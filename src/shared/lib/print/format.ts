export function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
    return String(value);
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;

  if (value instanceof Error) {
    const parts = [`${value.name}: ${value.message}`];
    if (value.stack) {
      const stackLines = value.stack.split('\n').slice(1);
      if (stackLines.length > 0) parts.push(stackLines.join('\n'));
    }
    return parts.join('\n');
  }

  if (Array.isArray(value) || typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

export function formatArgs(args: unknown[]): string {
  return args.map(formatValue).join(' ');
}
