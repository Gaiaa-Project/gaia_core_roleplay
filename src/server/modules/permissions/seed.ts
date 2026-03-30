import { Print } from '@/shared/lib/print/main';
import { permissionSeedConfig } from '@/shared/config/permissions_config';
import { Query, Execute, Single } from '@/server/modules/db/main';
import type { Role, Permission } from './types';

const log = Print.create('RBAC Seed');

export async function seedPermissions(): Promise<void> {
  const existingRoles = await Query<Role>('SELECT * FROM roles');
  if (existingRoles.length > 0) {
    log.info('roles already seeded, skipping');
    return;
  }

  log.info('seeding default roles and permissions');

  const roleNameToId = new Map<string, number>();

  for (const seedRole of permissionSeedConfig.roles) {
    const result = await Execute('INSERT INTO roles (name, label, is_primary) VALUES (?, ?, ?)', [
      seedRole.name,
      seedRole.label,
      seedRole.isPrimary ? 1 : 0,
    ]);
    roleNameToId.set(seedRole.name, Number(result.insertId));
  }

  for (const seedRole of permissionSeedConfig.roles) {
    if (!seedRole.inheritsFrom) continue;
    const roleId = roleNameToId.get(seedRole.name);
    const parentId = roleNameToId.get(seedRole.inheritsFrom);
    if (roleId && parentId) {
      await Execute('UPDATE roles SET inherits_from = ? WHERE id = ?', [parentId, roleId]);
    }
  }

  const permNameToId = new Map<string, number>();

  for (const seedRole of permissionSeedConfig.roles) {
    for (const permName of seedRole.permissions) {
      if (permNameToId.has(permName)) continue;

      const existing = await Single<Permission>('SELECT * FROM permissions WHERE name = ?', [
        permName,
      ]);
      if (existing) {
        permNameToId.set(permName, existing.id);
        continue;
      }

      const result = await Execute('INSERT INTO permissions (name) VALUES (?)', [permName]);
      permNameToId.set(permName, Number(result.insertId));
    }
  }

  for (const seedRole of permissionSeedConfig.roles) {
    const roleId = roleNameToId.get(seedRole.name);
    if (!roleId) continue;

    for (const permName of seedRole.permissions) {
      const permId = permNameToId.get(permName);
      if (!permId) continue;

      await Execute('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [
        roleId,
        permId,
      ]);
    }
  }

  log.success(`seeded ${roleNameToId.size} roles and ${permNameToId.size} permissions`);
}
