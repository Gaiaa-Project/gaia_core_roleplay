import { createPool as mariaCreatePool } from 'mariadb';
import type { Pool, PoolConnection } from 'mariadb';
import { Print } from '@/shared/lib/print/main';
import { ParseConnectionString } from './config';

const log = Print.create('Database');

let pool: Pool | null = null;

export function CreatePool(): Pool {
  const config = ParseConnectionString();
  pool = mariaCreatePool(config);
  return pool;
}

export function GetPool(): Pool {
  if (!pool) {
    throw new Error('Database pool is not initialized. Call InitializeDatabase() first.');
  }
  return pool;
}

export function GetConnection(): Promise<PoolConnection> {
  return GetPool().getConnection();
}

export async function ClosePool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}

export function IsPoolReady(): boolean {
  return pool !== null && !pool.closed;
}

function diagnoseError(err: unknown): void {
  const error = err as { code?: string; errno?: number; sqlMessage?: string };

  if (error.errno === 1045 || error.code === 'ER_ACCESS_DENIED_ERROR') {
    log.error('Invalid username or password — check your mysql_connection_string credentials');
    return;
  }

  if (error.errno === 1049 || error.code === 'ER_BAD_DB_ERROR') {
    log.error('Database not found — the specified database does not exist');
    return;
  }

  if (error.code === 'ECONNREFUSED') {
    log.error('Connection refused — wrong host/port or MariaDB/MySQL is not running');
    return;
  }

  if (error.code === 'ENOTFOUND') {
    log.error('Host not found — the specified hostname could not be resolved');
    return;
  }

  if (error.code === 'ETIMEDOUT' || error.code === 'CONNECT_TIMEOUT') {
    log.error('Connection timed out — check your host and port');
    return;
  }

  log.error(`Unexpected error — ${error.sqlMessage ?? error.code ?? String(err)}`);
}

export async function InitializeDatabase(): Promise<void> {
  const connStr = GetConvar('mysql_connection_string', '');

  if (!connStr) {
    log.error('Connection string not found — set mysql_connection_string in your server.cfg');
    throw new Error('mysql_connection_string convar is not set');
  }

  log.info('Connection string found');

  const config = ParseConnectionString();
  log.info(`Connecting to ${config.host}:${config.port} — database: ${config.database}`);

  pool = mariaCreatePool(config);

  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    await conn.ping();
    log.success(`Connected successfully — ${config.host}:${config.port}/${config.database}`);
  } catch (err) {
    diagnoseError(err);
    pool = null;
    throw err;
  } finally {
    if (conn) await conn.release();
  }
}
