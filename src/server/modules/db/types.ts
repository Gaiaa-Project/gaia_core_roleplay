import type { PoolConnection } from 'mariadb';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface PoolConfig extends DatabaseConfig {
  connectionLimit: number;
  connectTimeout: number;
  acquireTimeout: number;
  multipleStatements: boolean;
  dateStrings: boolean;
  insertIdAsNumber: boolean;
  decimalAsNumber: boolean;
  bigIntAsNumber: boolean;
}

export { type UpsertResult } from 'mariadb';

export type TransactionCallback = (conn: PoolConnection) => Promise<void>;
