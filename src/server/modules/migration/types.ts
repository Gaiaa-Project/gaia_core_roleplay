export interface ColumnDefinition {
  name: string;
  type: string;
  autoIncrement?: boolean;
  primaryKey?: boolean;
  notNull?: boolean;
  unique?: boolean;
  default?: string | number | boolean | null;
  unsigned?: boolean;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

export interface ForeignKeyDefinition {
  column: string;
  references: {
    table: string;
    column: string;
  };
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  foreignKeys?: ForeignKeyDefinition[];
}

export interface SchemaDefinition {
  version: string;
  tables: TableDefinition[];
}

export interface MigrationConfig {
  enabled: boolean;
  detectMissing: boolean;
  schema: SchemaDefinition;
}
