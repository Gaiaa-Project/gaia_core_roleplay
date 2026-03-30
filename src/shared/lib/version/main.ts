import { Print } from '@/shared/lib/print/main';
import type { DependencyResult } from './types';

const log = Print.create('Dependency');

function parseVersion(version: string): number[] | null {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function checkDependency(resource: string, minimumVersion: string): DependencyResult {
  const caller = GetInvokingResource() || GetCurrentResourceName();
  const rawVersion = GetResourceMetadata(resource, 'version', 0);

  if (!rawVersion) {
    const message = `'${caller}' requires '${resource}' but it is not started or has no version`;
    log.error(message);
    return {
      ok: false,
      resource,
      requiredVersion: minimumVersion,
      currentVersion: 'unknown',
      message,
    };
  }

  const current = parseVersion(rawVersion);
  const minimum = parseVersion(minimumVersion);

  if (!current || !minimum) {
    const message = `invalid version format: current='${rawVersion}', required='${minimumVersion}'`;
    log.error(message);
    return {
      ok: false,
      resource,
      requiredVersion: minimumVersion,
      currentVersion: rawVersion,
      message,
    };
  }

  for (let i = 0; i < 3; i++) {
    if (current[i]! < minimum[i]!) {
      const message = `'${caller}' requires '${resource}' >= ${minimumVersion} (current: ${rawVersion})`;
      log.error(message);
      return {
        ok: false,
        resource,
        requiredVersion: minimumVersion,
        currentVersion: rawVersion,
        message,
      };
    }
    if (current[i]! > minimum[i]!) break;
  }

  return {
    ok: true,
    resource,
    requiredVersion: minimumVersion,
    currentVersion: rawVersion,
    message: '',
  };
}
