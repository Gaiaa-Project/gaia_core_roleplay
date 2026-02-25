import { RESOURCE_NAME } from '@/shared/index';
import { formatArgs } from './format';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const Colors = {
  success: '\x1b[32m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[35m',
} as const;

const Labels = {
  success: 'SUCCESS',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG',
} as const;

const nativeLog = console.log;

function write(text: string): void {
  if (typeof process !== 'undefined' && typeof process.stdout?.write === 'function') {
    process.stdout.write(text + '\n');
  } else {
    nativeLog(text);
  }
}

function writeError(text: string): void {
  if (typeof process !== 'undefined' && typeof process.stderr?.write === 'function') {
    process.stderr.write(text + '\n');
  } else {
    nativeLog(text);
  }
}

type LogLevel = keyof typeof Colors;

function printMessage(level: LogLevel, module: string, args: unknown[]): void {
  const color = Colors[level];
  const label = Labels[level];
  const content = formatArgs(args);
  const message = `${color}${BOLD}[${RESOURCE_NAME}] ${label} ${module}:${RESET} ${color}${content}${RESET}`;

  if (level === 'error') {
    writeError(message);
  } else {
    write(message);
  }
}

export interface PrintInstance {
  success: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

function createPrint(module: string): PrintInstance {
  return {
    success: (...args: unknown[]) => printMessage('success', module, args),
    info: (...args: unknown[]) => printMessage('info', module, args),
    warn: (...args: unknown[]) => printMessage('warn', module, args),
    error: (...args: unknown[]) => printMessage('error', module, args),
    debug: (...args: unknown[]) => printMessage('debug', module, args),
  };
}

export const Print = {
  create: createPrint,
  success: (module: string, ...args: unknown[]) => printMessage('success', module, args),
  info: (module: string, ...args: unknown[]) => printMessage('info', module, args),
  warn: (module: string, ...args: unknown[]) => printMessage('warn', module, args),
  error: (module: string, ...args: unknown[]) => printMessage('error', module, args),
  debug: (module: string, ...args: unknown[]) => printMessage('debug', module, args),
};
