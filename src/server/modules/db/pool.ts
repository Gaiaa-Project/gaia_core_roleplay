import { createPool as mariaCreatePool } from 'mariadb';
import type { Pool, PoolConnection } from 'mariadb';
import { RESOURCE_NAME } from '@/shared/index';
import { ParseConnectionString } from './config';

const TAG = `[${RESOURCE_NAME}] Database`;

function log(msg: string): void {
  process.stdout.write(`${TAG}: ${msg}\n`);
}

function logError(msg: string): void {
  process.stderr.write(`${TAG}: ${msg}\n`);
}

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
    logError('Invalid username or password — check your mysql_connection_string credentials');
    return;
  }

  if (error.errno === 1049 || error.code === 'ER_BAD_DB_ERROR') {
    logError('Database not found — the specified database does not exist');
    return;
  }

  if (error.code === 'ECONNREFUSED') {
    logError('Connection refused — wrong host/port or MariaDB/MySQL is not running');
    return;
  }

  if (error.code === 'ENOTFOUND') {
    logError('Host not found — the specified hostname could not be resolved');
    return;
  }

  if (error.code === 'ETIMEDOUT' || error.code === 'CONNECT_TIMEOUT') {
    logError('Connection timed out — check your host and port');
    return;
  }

  logError(`Unexpected error — ${error.sqlMessage ?? error.code ?? String(err)}`);
}

export async function InitializeDatabase(): Promise<void> {
  const connStr = GetConvar('mysql_connection_string', '');

  if (!connStr) {
    logError('Connection string not found — set mysql_connection_string in your server.cfg');
    throw new Error('mysql_connection_string convar is not set');
  }

  log('Connection string found');

  const config = ParseConnectionString();
  log(`Connecting to ${config.host}:${config.port} — database: ${config.database}`);

  pool = mariaCreatePool(config);

  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    await conn.ping();
    log(`Connected successfully — ${config.host}:${config.port}/${config.database}`);
  } catch (err) {
    diagnoseError(err);
    pool = null;
    throw err;
  } finally {
    if (conn) await conn.release();
  }
}
