import { createPool as mariaCreatePool } from 'mariadb';
import type { Pool, PoolConnection } from 'mariadb';
import { ParseConnectionString } from './config';

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

export async function InitializeDatabase(): Promise<void> {
  const config = ParseConnectionString();
  pool = mariaCreatePool(config);

  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    await conn.release();
  }
}
