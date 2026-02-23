import { DbConfig } from '@/shared/config/db_config';
import type { PoolConfig } from './types';

function parseUri(uri: string): PoolConfig {
  const url = new URL(uri);

  return {
    ...DbConfig,
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
  };
}

function parseKeyValue(str: string): PoolConfig {
  const pairs: Record<string, string> = {};
  for (const part of str.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();
    pairs[key] = value;
  }

  return {
    ...DbConfig,
    host: pairs['host'] ?? 'localhost',
    port: pairs['port'] ? parseInt(pairs['port'], 10) : 3306,
    user: pairs['user'] ?? 'root',
    password: pairs['password'] ?? '',
    database: pairs['database'] ?? 'gaia',
  };
}

export function ParseConnectionString(): PoolConfig {
  const connStr = GetConvar('mysql_connection_string', '');

  if (!connStr) {
    throw new Error('mysql_connection_string convar is not set');
  }

  if (connStr.startsWith('mysql://') || connStr.startsWith('mariadb://')) {
    return parseUri(connStr);
  }

  return parseKeyValue(connStr);
}
