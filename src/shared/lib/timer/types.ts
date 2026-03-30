export interface TimerOptions {
  duration: number;
  onEnd?: () => void;
  onTick?: (state: TimerState) => void;
  tickInterval?: number;
  autoStart?: boolean;
}

export interface TimerState {
  remaining: number;
  elapsed: number;
  progress: number;
  paused: boolean;
  finished: boolean;
}

export interface Timer {
  readonly id: number;
  readonly duration: number;
  pause(): void;
  play(): void;
  restart(): void;
  stop(triggerOnEnd?: boolean): void;
  isPaused(): boolean;
  isFinished(): boolean;
  getState(): TimerState;
  addTime(ms: number): void;
  removeTime(ms: number): void;
}
