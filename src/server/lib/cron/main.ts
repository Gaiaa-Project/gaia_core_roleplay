import { Print } from '@/shared/lib/print/main';
import type { CronOptions, CronTask, CronJob } from './types';
import { parseExpression, matchesCron, findNextRun, type ParsedCron } from './parser';

const log = Print.create('Cron');

interface CronEntry {
  active: boolean;
  lastRun: Date | null;
  fields: ParsedCron;
  job: CronJob;
  debug: boolean;
}

let nextId = 1;
const entries = new Map<number, CronEntry>();
const instances = new Map<number, CronTask>();

export function createCron(expression: string, job: CronJob, options?: CronOptions): CronTask {
  const fields = parseExpression(expression);
  const id = nextId++;
  const debug = options?.debug ?? false;

  const entry: CronEntry = {
    active: true,
    lastRun: null,
    fields,
    job,
    debug,
  };

  const instance: CronTask = {
    id,
    expression,
    isActive: () => entry.active,
    run: () => {
      entry.active = true;
      if (debug) log.info(`task ${id} started`);
    },
    stop: () => {
      entry.active = false;
      if (debug) log.info(`task ${id} stopped`);
    },
    getNextRun: () => findNextRun(entry.fields),
    getLastRun: () => entry.lastRun,
  };

  entries.set(id, entry);
  instances.set(id, instance);

  if (debug) {
    const next = findNextRun(fields);
    log.info(`task ${id} created: '${expression}' — next: ${next?.toLocaleString() ?? 'none'}`);
  }

  return instance;
}

export function removeCron(id: number): boolean {
  const entry = entries.get(id);
  if (!entry) return false;
  entry.active = false;
  entries.delete(id);
  instances.delete(id);
  return true;
}

let lastTickMinute = -1;

setInterval(() => {
  const now = new Date();
  const minuteStamp = Math.floor(now.getTime() / 60000);

  if (minuteStamp === lastTickMinute) return;
  lastTickMinute = minuteStamp;

  for (const [id, entry] of entries) {
    if (!entry.active) continue;
    if (entry.lastRun && now.getTime() - entry.lastRun.getTime() < 59000) continue;

    if (matchesCron(entry.fields, now)) {
      entry.lastRun = now;
      if (entry.debug) log.debug(`task ${id} executing`);
      const instance = instances.get(id);
      if (instance) entry.job(instance);
    }
  }
}, 30000);
