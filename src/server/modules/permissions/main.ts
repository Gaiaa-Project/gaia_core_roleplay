import { Print } from '@/shared/lib/print/main';
import { Query, Execute, Single } from '@/server/modules/db/main';
import { createCron } from '@/server/lib/cron/main';
import { seedPermissions } from './seed';
import { matchPermission, isValidPermission } from './wildcards';
import {
  buildRoleCache,
  getRolePermissions as getCachedRolePerms,
  getRoleDepth,
  getCharacterPermissions as getCachedCharPerms,
  setCharacterPermissions,
  invalidateCharacter,
  invalidateAllCharacters,
} from './cache';
import type { Role, Permission, AssignRoleOptions } from './types';

const log = Print.create('RBAC');

const rolesMap = new Map<number, Role>();
const rolesByName = new Map<string, Role>();

async function loadRoles(): Promise<void> {
  rolesMap.clear();
  rolesByName.clear();

  const rows = await Query<Role>('SELECT * FROM roles');
  for (const role of rows) {
    rolesMap.set(role.id, role);
    rolesByName.set(role.name, role);
  }
}

async function loadAndBuildCache(): Promise<void> {
  await loadRoles();

  const rows = await Query<{ role_id: number; name: string }>(
    'SELECT rp.role_id, p.name FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id',
  );

  const rolePermsMap = new Map<number, string[]>();
  for (const row of rows) {
    const arr = rolePermsMap.get(row.role_id) ?? [];
    arr.push(row.name);
    rolePermsMap.set(row.role_id, arr);
  }

  buildRoleCache(rolesMap, rolePermsMap);
  invalidateAllCharacters();
}

async function resolveCharacterPermissions(charId: number): Promise<Set<string>> {
  const cached = getCachedCharPerms(charId);
  if (cached) return cached;

  const rows = await Query<{ role_id: number; expires_at: string | null }>(
    'SELECT role_id, expires_at FROM character_roles WHERE character_id = ?',
    [charId],
  );

  const perms = new Set<string>();
  const now = Date.now();

  for (const row of rows) {
    if (row.expires_at && new Date(row.expires_at).getTime() < now) continue;

    const rolePerms = getCachedRolePerms(row.role_id);
    for (const perm of rolePerms) {
      perms.add(perm);
    }
  }

  setCharacterPermissions(charId, perms);
  return perms;
}

async function writeAuditLog(
  action: string,
  targetType: string,
  targetId: string,
  performedBy?: number,
  details?: string,
): Promise<void> {
  await Execute(
    'INSERT INTO rbac_audit_log (action, target_type, target_id, performed_by, details) VALUES (?, ?, ?, ?, ?)',
    [action, targetType, targetId, performedBy ?? null, details ?? null],
  );
}

export async function InitPermissions(): Promise<void> {
  await seedPermissions();
  await loadAndBuildCache();

  createCron('*/5 * * * *', async () => {
    const result = await Execute(
      'DELETE FROM character_roles WHERE expires_at IS NOT NULL AND expires_at < NOW()',
    );
    if (result.affectedRows > 0) {
      log.info(`cleaned ${result.affectedRows} expired role(s)`);
      invalidateAllCharacters();
    }
  });

  log.success(`initialized with ${rolesMap.size} roles`);
}

export async function hasPermission(charId: number, permission: string): Promise<boolean> {
  const perms = await resolveCharacterPermissions(charId);
  return matchPermission(perms, permission);
}

export async function canModify(sourceCharId: number, targetCharId: number): Promise<boolean> {
  const sourceRole = await getPrimaryRole(sourceCharId);
  const targetRole = await getPrimaryRole(targetCharId);

  if (!sourceRole) return false;
  if (!targetRole) return true;

  const sourceDepth = getRoleDepth(sourceRole.id);
  const targetDepth = getRoleDepth(targetRole.id);

  return sourceDepth > targetDepth;
}

export async function getCharacterRoles(charId: number): Promise<Role[]> {
  const rows = await Query<{ role_id: number; expires_at: string | null }>(
    'SELECT role_id, expires_at FROM character_roles WHERE character_id = ?',
    [charId],
  );

  const now = Date.now();
  const results: Role[] = [];

  for (const row of rows) {
    if (row.expires_at && new Date(row.expires_at).getTime() < now) continue;
    const role = rolesMap.get(row.role_id);
    if (role) results.push(role);
  }

  return results;
}

export async function getCharacterPermissions(charId: number): Promise<string[]> {
  const perms = await resolveCharacterPermissions(charId);
  return [...perms];
}

export async function getPrimaryRole(charId: number): Promise<Role | null> {
  const roles = await getCharacterRoles(charId);
  return roles.find((r) => r.is_primary) ?? null;
}

export async function assignRole(
  charId: number,
  roleName: string,
  options?: AssignRoleOptions,
  performedBy?: number,
): Promise<boolean> {
  const role = rolesByName.get(roleName);
  if (!role) return false;

  if (role.is_primary) {
    const currentPrimary = await getPrimaryRole(charId);
    if (currentPrimary) {
      await Execute('DELETE FROM character_roles WHERE character_id = ? AND role_id = ?', [
        charId,
        currentPrimary.id,
      ]);
    }
  }

  const expiresAt =
    options?.expiresIn !== undefined
      ? new Date(Date.now() + options.expiresIn * 1000).toISOString().slice(0, 19).replace('T', ' ')
      : null;

  await Execute(
    'INSERT INTO character_roles (character_id, role_id, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)',
    [charId, role.id, expiresAt],
  );

  invalidateCharacter(charId);

  await writeAuditLog(
    'role_assigned',
    'character',
    String(charId),
    performedBy,
    `role=${roleName}${expiresAt ? ` expires=${expiresAt}` : ''}`,
  );

  return true;
}

export async function revokeRole(
  charId: number,
  roleName: string,
  performedBy?: number,
): Promise<boolean> {
  const role = rolesByName.get(roleName);
  if (!role) return false;

  const result = await Execute(
    'DELETE FROM character_roles WHERE character_id = ? AND role_id = ?',
    [charId, role.id],
  );

  if (result.affectedRows === 0) return false;

  invalidateCharacter(charId);

  await writeAuditLog('role_revoked', 'character', String(charId), performedBy, `role=${roleName}`);

  return true;
}

export async function createRole(
  name: string,
  label: string,
  isPrimary: boolean,
  inheritsFrom?: string,
  performedBy?: number,
): Promise<Role | null> {
  if (rolesByName.has(name)) return null;

  let inheritsId: number | null = null;
  if (inheritsFrom) {
    const parent = rolesByName.get(inheritsFrom);
    if (!parent) return null;
    inheritsId = parent.id;
  }

  const result = await Execute(
    'INSERT INTO roles (name, label, is_primary, inherits_from) VALUES (?, ?, ?, ?)',
    [name, label, isPrimary ? 1 : 0, inheritsId],
  );

  await loadAndBuildCache();

  await writeAuditLog(
    'role_created',
    'role',
    name,
    performedBy,
    `label=${label} primary=${isPrimary} inherits=${inheritsFrom ?? 'none'}`,
  );

  return rolesMap.get(Number(result.insertId)) ?? null;
}

export async function deleteRole(name: string, performedBy?: number): Promise<boolean> {
  const role = rolesByName.get(name);
  if (!role) return false;

  await Execute('DELETE FROM roles WHERE id = ?', [role.id]);

  await loadAndBuildCache();

  await writeAuditLog('role_deleted', 'role', name, performedBy);

  return true;
}

export async function addPermissionToRole(
  roleName: string,
  permission: string,
  performedBy?: number,
): Promise<boolean> {
  if (!isValidPermission(permission)) return false;

  const role = rolesByName.get(roleName);
  if (!role) return false;

  let perm = await Single<Permission>('SELECT * FROM permissions WHERE name = ?', [permission]);

  if (!perm) {
    const result = await Execute('INSERT INTO permissions (name) VALUES (?)', [permission]);
    perm = { id: Number(result.insertId), name: permission, description: null };
  }

  const existing = await Single<{ role_id: number }>(
    'SELECT role_id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
    [role.id, perm.id],
  );

  if (existing) return false;

  await Execute('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [
    role.id,
    perm.id,
  ]);

  await loadAndBuildCache();

  await writeAuditLog(
    'permission_added',
    'role',
    roleName,
    performedBy,
    `permission=${permission}`,
  );

  return true;
}

export async function removePermissionFromRole(
  roleName: string,
  permission: string,
  performedBy?: number,
): Promise<boolean> {
  const role = rolesByName.get(roleName);
  if (!role) return false;

  const perm = await Single<Permission>('SELECT * FROM permissions WHERE name = ?', [permission]);
  if (!perm) return false;

  const result = await Execute(
    'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
    [role.id, perm.id],
  );

  if (result.affectedRows === 0) return false;

  await loadAndBuildCache();

  await writeAuditLog(
    'permission_removed',
    'role',
    roleName,
    performedBy,
    `permission=${permission}`,
  );

  return true;
}

export async function getAllRoles(): Promise<Role[]> {
  return [...rolesMap.values()];
}

export async function getAllPermissions(): Promise<Permission[]> {
  return Query<Permission>('SELECT * FROM permissions');
}

export async function getRolePermissions(roleName: string): Promise<string[]> {
  const role = rolesByName.get(roleName);
  if (!role) return [];
  return [...getCachedRolePerms(role.id)];
}

export function getStaffOnline(): number[] {
  const players = getPlayers() as string[];
  return players.map((p) => parseInt(p));
}
