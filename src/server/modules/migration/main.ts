import { migrationConfig } from '@/shared/config/migration_config';
import { Print } from '@/shared/lib/print/main';
import { Execute, Scalar } from '../db/main';
import { getDatabaseName, getMatchingTables, inspectSchema } from './inspector';
import {
  generateCreateTableSQL,
  generateAddColumnSQL,
  generateAddForeignKeySQL,
} from './sql_generator';
import { RESOURCE_NAME } from '@/shared/index';

const log = Print.create('Migration');
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

export async function RunMigration(): Promise<void> {
  const { schema } = migrationConfig;

  if (!migrationConfig.enabled) {
    log.warn('Auto-migration disabled');
    return;
  }

  log.info('Auto-migration enabled');

  if (schema.tables.length === 0) {
    log.warn('No tables defined in schema — skipping');
    return;
  }

  let database: string;
  try {
    database = await getDatabaseName();
    log.success(`Database found — ${database}`);
  } catch {
    log.error('Database not found — unable to determine database name');
    return;
  }

  await ensureMigrationsTable();

  const matchingTables = await getMatchingTables(database, schema.tables);
  if (matchingTables.length > 0) {
    log.info(`${matchingTables.length} table(s) found — ${matchingTables.join(', ')}`);
  } else {
    log.info('No existing tables found');
  }

  const latestVersion = await getLatestVersion();
  const isNewVersion = latestVersion !== schema.version;

  if (!isNewVersion) {
    log.info(`Version ${schema.version} already applied`);

    if (!migrationConfig.detectMissing) {
      log.warn('Repair disabled — skipping verification');
      return;
    }

    log.info('Repair enabled — checking tables and columns...');
    const missing = await inspectSchema(database, schema.tables);
    const totalMissing =
      missing.tables.length +
      missing.columns.reduce((sum, c) => sum + c.columns.length, 0) +
      missing.foreignKeys.reduce((sum, f) => sum + f.foreignKeys.length, 0);

    if (totalMissing === 0) {
      log.success('All tables and columns OK — nothing to repair');
      return;
    }

    log.warn(`${totalMissing} missing element(s) detected — repairing...`);

    for (const table of missing.tables) {
      await Execute(generateCreateTableSQL(table));
      log.success(`Repaired: created table \`${table.name}\``);
    }

    for (const { tableName, columns } of missing.columns) {
      for (const col of columns) {
        await Execute(generateAddColumnSQL(tableName, col));
        log.success(`Repaired: added column \`${col.name}\` to \`${tableName}\``);
      }
    }

    for (const { tableName, foreignKeys } of missing.foreignKeys) {
      for (const fk of foreignKeys) {
        await Execute(generateAddForeignKeySQL(tableName, fk));
        log.success(`Repaired: added foreign key \`${fk.column}\` on \`${tableName}\``);
      }
    }

    log.success(`Repair complete — ${totalMissing} element(s) repaired`);
    return;
  }

  log.info(
    `New version detected: ${schema.version}${latestVersion ? ` (current: ${latestVersion})` : ' (first migration)'}`,
  );
  log.info('Starting migration...');

  const missing = await inspectSchema(database, schema.tables);

  for (const table of missing.tables) {
    log.info(`Migrating table \`${table.name}\`...`);
    await Execute(generateCreateTableSQL(table));
    log.success(`Table \`${table.name}\` — done`);
  }

  for (const { tableName, columns } of missing.columns) {
    for (const col of columns) {
      log.info(`Adding column \`${col.name}\` to \`${tableName}\`...`);
      await Execute(generateAddColumnSQL(tableName, col));
      log.success(`Column \`${col.name}\` on \`${tableName}\` — done`);
    }
  }

  for (const { tableName, foreignKeys } of missing.foreignKeys) {
    for (const fk of foreignKeys) {
      log.info(`Adding foreign key \`${fk.column}\` on \`${tableName}\`...`);
      await Execute(generateAddForeignKeySQL(tableName, fk));
      log.success(`Foreign key \`${fk.column}\` on \`${tableName}\` — done`);
    }
  }

  await markVersionApplied(schema.version);
  log.success(`Migration to version ${schema.version} complete`);
}
