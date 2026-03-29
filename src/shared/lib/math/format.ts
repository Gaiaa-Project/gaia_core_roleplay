import { Print } from '../print/main';

const log = Print.create('Math');

export function formatNumber(value: number): string {
  const [intPart, decPart] = String(value).replace('-', '').split('.');
  const formatted = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = value < 0 ? '-' : '';
  if (decPart) return `${sign}${formatted}.${decPart}`;
  return `${sign}${formatted}`;
}

export function formatCurrency(value: number, symbol: string): string {
  const [intPart, decPart] = Math.abs(value).toFixed(2).split('.');
  const formatted = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = value < 0 ? '-' : '';
  return `${sign}${formatted}.${decPart} ${symbol}`;
}

export function formatWithSeparator(value: number, separator: string): string {
  if (separator === '.' && !Number.isInteger(value)) {
    log.warn(
      `formatWithSeparator: using "." as separator on a decimal number (${value}) — decimal part uses the same "." and may be ambiguous`,
    );
  }
  const [intPart, decPart] = String(value).replace('-', '').split('.');
  const formatted = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  const sign = value < 0 ? '-' : '';
  if (decPart) return `${sign}${formatted}.${decPart}`;
  return `${sign}${formatted}`;
}
