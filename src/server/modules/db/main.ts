import type { PoolConnection } from 'mariadb';
import type { TransactionCallback, UpsertResult } from './types';
import { GetConnection } from './pool';

async function withConnection<T>(callback: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await GetConnection();
  try {
    return await callback(conn);
  } finally {
    await conn.release();
  }
}

export async function Query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  return withConnection((conn) => conn.query(sql, params));
}

export async function Execute(sql: string, params?: unknown[]): Promise<UpsertResult> {
  return withConnection((conn) => conn.query(sql, params));
}

export async function Single<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await Query<T>(sql, params);
  return rows[0] ?? null;
}

export async function Scalar<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
  const row = await Single<Record<string, T>>(sql, params);
  if (!row) return null;
  const keys = Object.keys(row);
  if (keys.length === 0) return null;
  return row[keys[0]!] ?? null;
}

export async function Exists(sql: string, params?: unknown[]): Promise<boolean> {
  const row = await Single(sql, params);
  return row !== null;
}

export async function Insert(sql: string, params?: unknown[]): Promise<number> {
  const result = await Execute(sql, params);
  return Number(result.insertId);
}

export async function Update(sql: string, params?: unknown[]): Promise<number> {
  const result = await Execute(sql, params);
  return result.affectedRows;
}

export async function Transaction(callback: TransactionCallback): Promise<boolean> {
  const conn = await GetConnection();
  try {
    await conn.beginTransaction();
    await callback(conn);
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.release();
  }
}

export async function BatchInsert<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
): Promise<number> {
  if (rows.length === 0) return 0;

  const columns = Object.keys(rows[0]!);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;
  const values = rows.map((row) => columns.map((col) => row[col]));

  return withConnection(async (conn) => {
    const result = await conn.batch<UpsertResult>(sql, values);
    return result.affectedRows;
  });
}

export async function RawQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T> {
  return withConnection((conn) => conn.query(sql, params));
}
