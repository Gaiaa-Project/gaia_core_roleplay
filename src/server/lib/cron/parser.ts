type FieldName = 'minute' | 'hour' | 'day' | 'month' | 'weekday';
type FieldMatcher = (value: number, date: Date) => boolean;

export interface ParsedCron {
  minute: FieldMatcher;
  hour: FieldMatcher;
  day: FieldMatcher;
  month: FieldMatcher;
  weekday: FieldMatcher;
}

const RANGES: Record<FieldName, { min: number; max: number }> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  day: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  weekday: { min: 1, max: 7 },
};

const WEEKDAY_NAMES: Record<string, string> = {
  mon: '1',
  tue: '2',
  wed: '3',
  thu: '4',
  fri: '5',
  sat: '6',
  sun: '7',
};

const MONTH_NAMES: Record<string, string> = {
  jan: '1',
  feb: '2',
  mar: '3',
  apr: '4',
  may: '5',
  jun: '6',
  jul: '7',
  aug: '8',
  sep: '9',
  oct: '10',
  nov: '11',
  dec: '12',
};

const SHORTCUTS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 1',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

function replaceNames(expr: string, map: Record<string, string>): string {
  return expr.toLowerCase().replace(/[a-z]+/g, (match) => map[match] ?? match);
}

function validateValue(value: number, field: FieldName): void {
  const range = RANGES[field];
  if (value < range.min || value > range.max) {
    throw new Error(`value ${value} out of range for ${field} (${range.min}-${range.max})`);
  }
}

function parseField(expr: string, field: FieldName): FieldMatcher {
  expr = expr.trim();

  if (expr === '*') return () => true;

  if (field === 'day' && expr.toLowerCase() === 'l') {
    return (day, date) => day === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  if (field === 'weekday') expr = replaceNames(expr, WEEKDAY_NAMES);
  if (field === 'month') expr = replaceNames(expr, MONTH_NAMES);

  if (expr.includes(',')) {
    const matchers = expr.split(',').map((part) => parseField(part.trim(), field));
    return (v, d) => matchers.some((m) => m(v, d));
  }

  if (expr.includes('/')) {
    const slashIdx = expr.indexOf('/');
    const rangeExpr = expr.substring(0, slashIdx);
    const stepStr = expr.substring(slashIdx + 1);
    const step = parseInt(stepStr);

    if (isNaN(step) || step <= 0) {
      throw new Error(`invalid step '${stepStr}' in ${field}`);
    }

    if (rangeExpr === '*') {
      const min = RANGES[field].min;
      return (v) => (v - min) % step === 0;
    }

    const dashIdx = rangeExpr.indexOf('-');
    if (dashIdx !== -1) {
      const start = parseInt(rangeExpr.substring(0, dashIdx));
      const end = parseInt(rangeExpr.substring(dashIdx + 1));
      if (isNaN(start) || isNaN(end)) {
        throw new Error(`invalid range with step '${expr}' in ${field}`);
      }
      validateValue(start, field);
      validateValue(end, field);
      return (v) => v >= start && v <= end && (v - start) % step === 0;
    }

    throw new Error(`invalid step expression '${expr}' in ${field}`);
  }

  if (expr.includes('-')) {
    const dashIdx = expr.indexOf('-');
    const start = parseInt(expr.substring(0, dashIdx));
    const end = parseInt(expr.substring(dashIdx + 1));
    if (isNaN(start) || isNaN(end)) {
      throw new Error(`invalid range '${expr}' in ${field}`);
    }
    validateValue(start, field);
    validateValue(end, field);

    if (end < start) return (v) => v >= start || v <= end;
    return (v) => v >= start && v <= end;
  }

  const num = parseInt(expr);
  if (isNaN(num)) throw new Error(`invalid value '${expr}' in ${field}`);
  validateValue(num, field);
  return (v) => v === num;
}

export function parseExpression(expression: string): ParsedCron {
  const resolved = SHORTCUTS[expression.toLowerCase()] ?? expression;
  const parts = resolved.trim().split(/\s+/);

  if (parts.length !== 5) {
    throw new Error(
      `invalid cron expression '${expression}': expected 5 fields, got ${parts.length}`,
    );
  }

  return {
    minute: parseField(parts[0] ?? '', 'minute'),
    hour: parseField(parts[1] ?? '', 'hour'),
    day: parseField(parts[2] ?? '', 'day'),
    month: parseField(parts[3] ?? '', 'month'),
    weekday: parseField(parts[4] ?? '', 'weekday'),
  };
}

export function matchesCron(fields: ParsedCron, date: Date): boolean {
  const jsDay = date.getDay();
  const weekday = jsDay === 0 ? 7 : jsDay;
  return (
    fields.minute(date.getMinutes(), date) &&
    fields.hour(date.getHours(), date) &&
    fields.day(date.getDate(), date) &&
    fields.month(date.getMonth() + 1, date) &&
    fields.weekday(weekday, date)
  );
}

export function findNextRun(fields: ParsedCron): Date | null {
  const now = new Date();
  const candidate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes() + 1,
    0,
    0,
  );

  const maxMinutes = 366 * 24 * 60;
  for (let i = 0; i < maxMinutes; i++) {
    if (matchesCron(fields, candidate)) return new Date(candidate);
    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  return null;
}
