function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function tableContains(tbl: Record<string, unknown> | unknown[], value: unknown): boolean {
  const values = Array.isArray(tbl) ? tbl : Object.values(tbl);

  if (!Array.isArray(value)) {
    return values.includes(value);
  }

  const set = new Set(values);
  for (const v of value) {
    if (!set.has(v)) return false;
  }
  return true;
}

export function tableMatches(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return a === b;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!(key in bObj) || !tableMatches(aObj[key], bObj[key])) return false;
  }

  return true;
}

export function tableDeepClone<T>(tbl: T): T {
  if (typeof tbl !== 'object' || tbl === null) return tbl;

  if (Array.isArray(tbl)) {
    return tbl.map((item) => tableDeepClone(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(tbl as Record<string, unknown>)) {
    result[key] = tableDeepClone((tbl as Record<string, unknown>)[key]);
  }
  return result as T;
}

export function tableMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  addNumbers: boolean = true,
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];

    if (isRecord(targetVal) && isRecord(sourceVal)) {
      tableMerge(targetVal, sourceVal, addNumbers);
    } else if (addNumbers && typeof targetVal === 'number' && typeof sourceVal === 'number') {
      target[key] = targetVal + sourceVal;
    } else {
      target[key] = sourceVal;
    }
  }

  return target;
}

export function tableFreeze<T extends Record<string, unknown>>(tbl: T): Readonly<T> {
  return Object.freeze(tbl);
}

export function tableIsFrozen(tbl: Record<string, unknown>): boolean {
  return Object.isFrozen(tbl);
}

export function tableMap(
  tbl: Record<string, unknown> | unknown[],
  fn: (value: unknown, key: string | number) => unknown,
): Record<string, unknown> | unknown[] {
  if (Array.isArray(tbl)) {
    return tbl.map((v, i) => fn(v, i));
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(tbl)) {
    result[key] = fn(tbl[key], key);
  }
  return result;
}

export function tableFilter(
  tbl: Record<string, unknown> | unknown[],
  fn: (value: unknown, key: string | number) => boolean,
): Record<string, unknown> | unknown[] {
  if (Array.isArray(tbl)) {
    return tbl.filter((v, i) => fn(v, i));
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(tbl)) {
    if (fn(tbl[key], key)) result[key] = tbl[key];
  }
  return result;
}

export function tableFind(
  tbl: Record<string, unknown> | unknown[],
  fn: (value: unknown, key: string | number) => boolean,
): unknown | undefined {
  if (Array.isArray(tbl)) {
    return tbl.find((v, i) => fn(v, i));
  }

  for (const key of Object.keys(tbl)) {
    if (fn(tbl[key], key)) return tbl[key];
  }
  return undefined;
}

export function tableKeys(tbl: Record<string, unknown>): string[] {
  return Object.keys(tbl);
}

export function tableValues(tbl: Record<string, unknown>): unknown[] {
  return Object.values(tbl);
}

export function tableSize(tbl: Record<string, unknown> | unknown[]): number {
  return Array.isArray(tbl) ? tbl.length : Object.keys(tbl).length;
}
