import { RESOURCE_NAME } from '@/shared/index';
import { migrationConfig } from '@/shared/config/migration_config';
import { Execute, Scalar } from '../db/main';
import { getDatabaseName, getMatchingTables, inspectSchema } from './inspector';
import {
  generateCreateTableSQL,
  generateAddColumnSQL,
  generateAddForeignKeySQL,
} from './sql_generator';

const TAG = `[${RESOURCE_NAME}] Migration`;
const MIGRATIONS_TABLE = 'schema_migrations';

function log(msg: string): void {
  process.stdout.write(`${TAG}: ${msg}\n`);
}

function logError(msg: string): void {
  process.stderr.write(`${TAG}: ${msg}\n`);
}

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
    log('Auto-migration disabled');
    return;
  }

  log('Auto-migration enabled');

  if (schema.tables.length === 0) {
    log('No tables defined in schema — skipping');
    return;
  }

  let database: string;
  try {
    database = await getDatabaseName();
    log(`Database found — ${database}`);
  } catch {
    logError('Database not found — unable to determine database name');
    return;
  }

  await ensureMigrationsTable();

  const matchingTables = await getMatchingTables(database, schema.tables);
  if (matchingTables.length > 0) {
    log(`${matchingTables.length} table(s) found — ${matchingTables.join(', ')}`);
  } else {
    log('No existing tables found');
  }

  const latestVersion = await getLatestVersion();
  const isNewVersion = latestVersion !== schema.version;

  if (!isNewVersion) {
    log(`Version ${schema.version} already applied`);

    if (!migrationConfig.detectMissing) {
      log('Repair disabled — skipping verification');
      return;
    }

    log('Repair enabled — checking tables and columns...');
    const missing = await inspectSchema(database, schema.tables);
    const totalMissing =
      missing.tables.length +
      missing.columns.reduce((sum, c) => sum + c.columns.length, 0) +
      missing.foreignKeys.reduce((sum, f) => sum + f.foreignKeys.length, 0);

    if (totalMissing === 0) {
      log('All tables and columns OK — nothing to repair');
      return;
    }

    log(`${totalMissing} missing element(s) detected — repairing...`);
    let repaired = 0;

    for (const table of missing.tables) {
      await Execute(generateCreateTableSQL(table));
      log(`Repaired: created table \`${table.name}\``);
      repaired++;
    }

    for (const { tableName, columns } of missing.columns) {
      for (const col of columns) {
        await Execute(generateAddColumnSQL(tableName, col));
        log(`Repaired: added column \`${col.name}\` to \`${tableName}\``);
        repaired++;
      }
    }

    for (const { tableName, foreignKeys } of missing.foreignKeys) {
      for (const fk of foreignKeys) {
        await Execute(generateAddForeignKeySQL(tableName, fk));
        log(`Repaired: added foreign key \`${fk.column}\` on \`${tableName}\``);
        repaired++;
      }
    }

    log(`Repair complete — ${repaired} element(s) repaired`);
    return;
  }

  log(
    `New version detected: ${schema.version}${latestVersion ? ` (current: ${latestVersion})` : ' (first migration)'}`,
  );
  log('Starting migration...');

  const missing = await inspectSchema(database, schema.tables);

  for (const table of missing.tables) {
    log(`Migrating table \`${table.name}\`...`);
    await Execute(generateCreateTableSQL(table));
    log(`Table \`${table.name}\` — done`);
  }

  for (const { tableName, columns } of missing.columns) {
    for (const col of columns) {
      log(`Adding column \`${col.name}\` to \`${tableName}\`...`);
      await Execute(generateAddColumnSQL(tableName, col));
      log(`Column \`${col.name}\` on \`${tableName}\` — done`);
    }
  }

  for (const { tableName, foreignKeys } of missing.foreignKeys) {
    for (const fk of foreignKeys) {
      log(`Adding foreign key \`${fk.column}\` on \`${tableName}\`...`);
      await Execute(generateAddForeignKeySQL(tableName, fk));
      log(`Foreign key \`${fk.column}\` on \`${tableName}\` — done`);
    }
  }

  await markVersionApplied(schema.version);
  log(`Migration to version ${schema.version} complete`);
}
