import type { MigrationConfig } from '@/server/modules/migration/types';

export const migrationConfig: MigrationConfig = {
  // Enables or disables automatic SQL migration on server start
  // When disabled, no migration or schema check will run
  enabled: true,

  // Enables detection of missing tables and columns even if the version hasn't changed
  // Useful to auto-repair a database where someone manually deleted a table or column
  // Disable if you intentionally remove tables/columns and don't want them re-created
  detectMissing: true,

  schema: {
    // Schema version — bump this when you modify the schema (add tables, columns, etc.)
    // A new version triggers a full migration pass and gets recorded in schema_migrations
    version: '0.0.1',

    // Declarative list of all tables managed by the migration system
    // Each table defines its columns, indexes, and foreign keys
    // The migration engine will create missing tables, add missing columns, and set up foreign keys
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'INT', autoIncrement: true, primaryKey: true, unsigned: true },
          { name: 'license', type: 'VARCHAR(60)', notNull: true, unique: true },
          { name: 'discord_id', type: 'VARCHAR(30)', notNull: true, unique: true },
          { name: 'ip', type: 'VARCHAR(45)', notNull: true },
          {
            name: 'last_seen',
            type: 'TIMESTAMP',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
          { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        ],
        indexes: [
          { name: 'idx_license', columns: ['license'] },
          { name: 'idx_discord_id', columns: ['discord_id'] },
          { name: 'idx_last_seen', columns: ['last_seen'] },
        ],
      },
    ],
  },
};
