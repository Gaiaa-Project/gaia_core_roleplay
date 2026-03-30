import type { Role } from './types';

const rolePermissionCache = new Map<number, Set<string>>();
const characterPermissionCache = new Map<number, Set<string>>();
const inheritanceDepthCache = new Map<number, number>();

export function resolveRolePermissions(
  roleId: number,
  roles: Map<number, Role>,
  rolePermsMap: Map<number, string[]>,
  visited: Set<number> = new Set(),
): Set<string> {
  if (visited.has(roleId)) return new Set();
  visited.add(roleId);

  const role = roles.get(roleId);
  if (!role) return new Set();

  const perms = new Set<string>(rolePermsMap.get(roleId) ?? []);

  if (role.inherits_from !== null) {
    const parentPerms = resolveRolePermissions(role.inherits_from, roles, rolePermsMap, visited);
    for (const perm of parentPerms) {
      perms.add(perm);
    }
  }

  return perms;
}

export function buildRoleCache(
  roles: Map<number, Role>,
  rolePermsMap: Map<number, string[]>,
): void {
  rolePermissionCache.clear();
  inheritanceDepthCache.clear();

  for (const [roleId] of roles) {
    rolePermissionCache.set(roleId, resolveRolePermissions(roleId, roles, rolePermsMap));
    inheritanceDepthCache.set(roleId, computeDepth(roleId, roles));
  }
}

function computeDepth(
  roleId: number,
  roles: Map<number, Role>,
  visited: Set<number> = new Set(),
): number {
  if (visited.has(roleId)) return 0;
  visited.add(roleId);

  const role = roles.get(roleId);
  if (!role || role.inherits_from === null) return 0;

  return 1 + computeDepth(role.inherits_from, roles, visited);
}

export function getRolePermissions(roleId: number): Set<string> {
  return rolePermissionCache.get(roleId) ?? new Set();
}

export function getRoleDepth(roleId: number): number {
  return inheritanceDepthCache.get(roleId) ?? 0;
}

export function getCharacterPermissions(charId: number): Set<string> | undefined {
  return characterPermissionCache.get(charId);
}

export function setCharacterPermissions(charId: number, perms: Set<string>): void {
  characterPermissionCache.set(charId, perms);
}

export function invalidateCharacter(charId: number): void {
  characterPermissionCache.delete(charId);
}

export function invalidateAllCharacters(): void {
  characterPermissionCache.clear();
}
