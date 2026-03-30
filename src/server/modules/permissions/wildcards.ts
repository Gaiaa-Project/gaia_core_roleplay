export function matchPermission(granted: Set<string>, required: string): boolean {
  if (granted.has(`-${required}`)) return false;

  if (granted.has(required)) return true;

  if (granted.has('*')) {
    return !granted.has(`-${required}`);
  }

  const dotIndex = required.indexOf('.');
  if (dotIndex === -1) return false;

  const namespace = required.substring(0, dotIndex);
  const action = required.substring(dotIndex + 1);

  if (granted.has(`${namespace}.*`)) return true;
  if (granted.has(`*.${action}`)) return true;

  return false;
}

export function isValidPermission(permission: string): boolean {
  if (permission === '*') return true;

  const clean = permission.startsWith('-') ? permission.substring(1) : permission;

  return /^[a-zA-Z_]+(\.[a-zA-Z_*]+)+$/.test(clean);
}
