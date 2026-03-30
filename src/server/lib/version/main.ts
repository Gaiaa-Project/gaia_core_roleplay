import { Print } from '@/shared/lib/print/main';

declare function PerformHttpRequest(
  url: string,
  cb: (status: number, response: string, headers: Record<string, string>) => void,
  method: string,
  data?: string,
  headers?: Record<string, string>,
): void;

const log = Print.create('Version');

interface GitHubRelease {
  tag_name: string;
  prerelease: boolean;
  html_url: string;
  body?: string;
}

function parseVersion(version: string): number[] | null {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(current: number[], latest: number[]): -1 | 0 | 1 {
  for (let i = 0; i < 3; i++) {
    if (current[i]! < latest[i]!) return -1;
    if (current[i]! > latest[i]!) return 1;
  }
  return 0;
}

export function versionCheck(repository: string): void {
  const resource = GetInvokingResource() || GetCurrentResourceName();
  const rawVersion = GetResourceMetadata(resource, 'version', 0);

  if (!rawVersion) {
    log.warn(`unable to determine version for '${resource}'`);
    return;
  }

  const current = parseVersion(rawVersion);
  if (!current) {
    log.warn(`invalid version format '${rawVersion}' for '${resource}'`);
    return;
  }

  setTimeout(() => {
    PerformHttpRequest(
      `https://api.github.com/repos/${repository}/releases/latest`,
      (status: number, response: string) => {
        if (status !== 200) return;

        let data: GitHubRelease;
        try {
          data = JSON.parse(response);
        } catch {
          return;
        }

        if (data.prerelease) return;

        const latest = parseVersion(data.tag_name);
        if (!latest) return;

        const cmp = compareVersions(current, latest);

        if (cmp === -1) {
          log.warn(
            `update available for '${resource}': ${rawVersion} → ${data.tag_name}\n${data.html_url}`,
          );
        } else if (cmp === 0) {
          log.success(`'${resource}' is up to date (${rawVersion})`);
        }
      },
      'GET',
      '',
      { Accept: 'application/vnd.github.v3+json' },
    );
  }, 2000);
}
