export interface CronOptions {
  debug?: boolean;
}

export interface CronTask {
  readonly id: number;
  readonly expression: string;
  isActive(): boolean;
  run(): void;
  stop(): void;
  getNextRun(): Date | null;
  getLastRun(): Date | null;
}

export type CronJob = (task: CronTask) => void | Promise<void>;
