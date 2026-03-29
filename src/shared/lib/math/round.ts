export type RoundMode = 'default' | 'ceil' | 'floor';

export function round(value: number, decimals: number = 0, mode: RoundMode = 'default'): number {
  const factor = Math.pow(10, decimals);
  const scaled = value * factor;

  if (mode === 'ceil') return Math.ceil(scaled) / factor;
  if (mode === 'floor') return Math.floor(scaled) / factor;
  return Math.round(scaled) / factor;
}
