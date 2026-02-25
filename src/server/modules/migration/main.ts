import { RESOURCE_NAME } from '@/shared/index';
import { migrationConfig } from '@/shared/config/migration_config';
import { Execute, Scalar } from '../db/main';
import { inspectSchema } from './inspector';
import {
  generateCreateTableSQL,
  generateAddColumnSQL,
  generateAddForeignKeySQL,
} from './sql_generator';

const MIGRATIONS_TABLE = 'schema_migrations';

async function ensureMigrationsTable(): Promise<void> {
  await Execute(
    `CREATE TABLE IF NOT EXISTS \`${MIGRATIONS_TABLE}\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`resource\` VARCHAR(255) NOT NULL,
      \`version\` VARCHAR(50) NOT NULL,
      \`applied_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY \`idx_resource_version\` (\`resource\`, \`version\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

async function getLatestVersion(): Promise<string | null> {
  return await Scalar<string>(
    `SELECT version FROM \`${MIGRATIONS_TABLE}\` WHERE resource = ? ORDER BY id DESC LIMIT 1`,
    [RESOURCE_NAME],
  );
}

async function markVersionApplied(version: string): Promise<void> {
  await Execute(`INSERT INTO \`${MIGRATIONS_TABLE}\` (resource, version) VALUES (?, ?)`, [
    RESOURCE_NAME,
    version,
  ]);
}

async function applyMissingElements(): Promise<number> {
  const { schema } = migrationConfig;
  const missing = await inspectSchema(schema.tables);
  let changes = 0;

  for (const table of missing.tables) {
    const sql = generateCreateTableSQL(table);
    await Execute(sql);
    console.log(`[${RESOURCE_NAME}] Migration: Created table \`${table.name}\``);
    changes++;
  }

  for (const { tableName, columns } of missing.columns) {
    for (const col of columns) {
      const sql = generateAddColumnSQL(tableName, col);
      await Execute(sql);
      console.log(`[${RESOURCE_NAME}] Migration: Added column \`${col.name}\` to \`${tableName}\``);
      changes++;
    }
  }

  for (const { tableName, foreignKeys } of missing.foreignKeys) {
    for (const fk of foreignKeys) {
      const sql = generateAddForeignKeySQL(tableName, fk);
      await Execute(sql);
      console.log(
        `[${RESOURCE_NAME}] Migration: Added foreign key \`${fk.column}\` on \`${tableName}\` -> \`${fk.references.table}\``,
      );
      changes++;
    }
  }

  return changes;
}

export async function RunMigration(): Promise<void> {
  if (!migrationConfig.enabled) return;

  const { schema } = migrationConfig;
  if (schema.tables.length === 0) return;

  await ensureMigrationsTable();

  const latestVersion = await getLatestVersion();
  const isNewVersion = latestVersion !== schema.version;

  if (isNewVersion) {
    console.log(
      `[${RESOURCE_NAME}] Migration: Applying version ${schema.version}${latestVersion ? ` (from ${latestVersion})` : ''}...`,
    );
    const changes = await applyMissingElements();
    await markVersionApplied(schema.version);
    console.log(
      `[${RESOURCE_NAME}] Migration: Version ${schema.version} applied (${changes} change${changes !== 1 ? 's' : ''})`,
    );
  } else if (migrationConfig.detectMissing) {
    const changes = await applyMissingElements();
    if (changes > 0) {
      console.log(
        `[${RESOURCE_NAME}] Migration: Detected and applied ${changes} missing element${changes !== 1 ? 's' : ''}`,
      );
    }
  }
}
