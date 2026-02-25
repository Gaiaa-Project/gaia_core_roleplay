import type { ForeignKeyDefinition, TableDefinition } from './types';
import { Query, Scalar } from '../db/main';

export interface MissingElements {
  tables: TableDefinition[];
  columns: { tableName: string; columns: TableDefinition['columns'] }[];
  foreignKeys: { tableName: string; foreignKeys: ForeignKeyDefinition[] }[];
}

async function getDatabaseName(): Promise<string> {
  const name = await Scalar<string>('SELECT DATABASE()', []);
  if (!name) throw new Error('Unable to determine current database name');
  return name;
}

async function getExistingTables(database: string): Promise<string[]> {
  const rows = await Query<{ TABLE_NAME: string }>(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
    [database],
  );
  return rows.map((r) => r.TABLE_NAME);
}

async function getExistingColumns(database: string, tableName: string): Promise<string[]> {
  const rows = await Query<{ COLUMN_NAME: string }>(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [database, tableName],
  );
  return rows.map((r) => r.COLUMN_NAME);
}

async function getExistingForeignKeys(database: string, tableName: string): Promise<string[]> {
  const rows = await Query<{ CONSTRAINT_NAME: string }>(
    'SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_TYPE = ?',
    [database, tableName, 'FOREIGN KEY'],
  );
  return rows.map((r) => r.CONSTRAINT_NAME);
}

export async function inspectSchema(tables: TableDefinition[]): Promise<MissingElements> {
  const database = await getDatabaseName();
  const existingTables = await getExistingTables(database);

  const missing: MissingElements = {
    tables: [],
    columns: [],
    foreignKeys: [],
  };

  for (const table of tables) {
    if (!existingTables.includes(table.name)) {
      missing.tables.push(table);

      if (table.foreignKeys && table.foreignKeys.length > 0) {
        missing.foreignKeys.push({ tableName: table.name, foreignKeys: table.foreignKeys });
      }

      continue;
    }

    const existingCols = await getExistingColumns(database, table.name);
    const missingCols = table.columns.filter((c) => !existingCols.includes(c.name));
    if (missingCols.length > 0) {
      missing.columns.push({ tableName: table.name, columns: missingCols });
    }

    if (table.foreignKeys && table.foreignKeys.length > 0) {
      const existingFKs = await getExistingForeignKeys(database, table.name);
      const missingFKs = table.foreignKeys.filter((fk) => {
        const constraintName = `fk_${table.name}_${fk.column}`;
        return !existingFKs.includes(constraintName);
      });
      if (missingFKs.length > 0) {
        missing.foreignKeys.push({ tableName: table.name, foreignKeys: missingFKs });
      }
    }
  }

  return missing;
}
