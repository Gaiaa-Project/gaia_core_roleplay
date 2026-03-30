import type { ColumnDefinition, ForeignKeyDefinition, TableDefinition } from './types';

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function validateIdentifier(value: string, type: string): void {
  if (!IDENTIFIER_REGEX.test(value)) {
    throw new Error(`invalid ${type} identifier: '${value}'`);
  }
}

function generateColumnSQL(col: ColumnDefinition): string {
  validateIdentifier(col.name, 'column');
  const parts: string[] = [`\`${col.name}\``, col.type];

  if (col.unsigned) parts.push('UNSIGNED');
  if (col.notNull) parts.push('NOT NULL');
  if (col.autoIncrement) parts.push('AUTO_INCREMENT');
  if (col.unique) parts.push('UNIQUE');

  if (col.default !== undefined) {
    if (col.default === null) {
      parts.push('DEFAULT NULL');
    } else if (typeof col.default === 'string') {
      const raw = col.default.toUpperCase();
      if (raw.startsWith('CURRENT_TIMESTAMP') || raw === 'NOW()') {
        parts.push(`DEFAULT ${col.default}`);
      } else {
        parts.push(`DEFAULT '${col.default}'`);
      }
    } else {
      parts.push(`DEFAULT ${col.default}`);
    }
  }

  return parts.join(' ');
}

export function generateCreateTableSQL(table: TableDefinition): string {
  validateIdentifier(table.name, 'table');
  const lines: string[] = [];

  for (const col of table.columns) {
    lines.push(generateColumnSQL(col));
  }

  const primaryKeys = table.columns.filter((c) => c.primaryKey).map((c) => `\`${c.name}\``);
  if (primaryKeys.length > 0) {
    lines.push(`PRIMARY KEY (${primaryKeys.join(', ')})`);
  }

  if (table.indexes) {
    for (const idx of table.indexes) {
      const keyword = idx.unique ? 'UNIQUE KEY' : 'KEY';
      const cols = idx.columns.map((c) => `\`${c}\``).join(', ');
      lines.push(`${keyword} \`${idx.name}\` (${cols})`);
    }
  }

  return `CREATE TABLE IF NOT EXISTS \`${table.name}\` (\n  ${lines.join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
}

export function generateAddColumnSQL(tableName: string, col: ColumnDefinition): string {
  validateIdentifier(tableName, 'table');
  return `ALTER TABLE \`${tableName}\` ADD COLUMN ${generateColumnSQL(col)}`;
}

export function generateAddForeignKeySQL(tableName: string, fk: ForeignKeyDefinition): string {
  validateIdentifier(tableName, 'table');
  validateIdentifier(fk.column, 'column');
  validateIdentifier(fk.references.table, 'table');
  validateIdentifier(fk.references.column, 'column');
  const constraintName = `fk_${tableName}_${fk.column}`;
  let sql = `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`${fk.column}\`) REFERENCES \`${fk.references.table}\`(\`${fk.references.column}\`)`;
  if (fk.onDelete) sql += ` ON DELETE ${fk.onDelete}`;
  if (fk.onUpdate) sql += ` ON UPDATE ${fk.onUpdate}`;
  return sql;
}
