import type { TimerOptions, TimerState, Timer } from './types';

let nextId = 1;
const timers = new Map<number, TimerInternal>();

interface TimerInternal {
  id: number;
  duration: number;
  startTime: number;
  pausedAt: number | null;
  totalPaused: number;
  finished: boolean;
  intervalHandle: ReturnType<typeof setInterval> | null;
  onEnd?: () => void;
  onTick?: (state: TimerState) => void;
  tickInterval: number;
}

function now(): number {
  return typeof GetGameTimer === 'function' ? GetGameTimer() : Date.now();
}

function getElapsed(t: TimerInternal): number {
  if (t.finished) return t.duration;
  if (t.pausedAt !== null) return t.pausedAt - t.startTime - t.totalPaused;
  return now() - t.startTime - t.totalPaused;
}

function getRemaining(t: TimerInternal): number {
  return Math.max(0, t.duration - getElapsed(t));
}

function buildState(t: TimerInternal): TimerState {
  const elapsed = getElapsed(t);
  const remaining = Math.max(0, t.duration - elapsed);
  return {
    remaining,
    elapsed: Math.min(elapsed, t.duration),
    progress: Math.min(elapsed / t.duration, 1),
    paused: t.pausedAt !== null,
    finished: t.finished,
  };
}

function checkEnd(t: TimerInternal): void {
  if (t.finished) return;
  if (getRemaining(t) > 0) return;

  t.finished = true;
  stopInterval(t);

  if (t.onTick) t.onTick(buildState(t));
  if (t.onEnd) t.onEnd();

  timers.delete(t.id);
}

function startInterval(t: TimerInternal): void {
  if (t.intervalHandle) return;

  t.intervalHandle = setInterval(() => {
    if (t.pausedAt !== null) return;
    if (t.onTick) t.onTick(buildState(t));
    checkEnd(t);
  }, t.tickInterval);
}

function stopInterval(t: TimerInternal): void {
  if (!t.intervalHandle) return;
  clearInterval(t.intervalHandle);
  t.intervalHandle = null;
}

export function createTimer(options: TimerOptions): Timer {
  const id = nextId++;

  const internal: TimerInternal = {
    id,
    duration: options.duration,
    startTime: now(),
    pausedAt: null,
    totalPaused: 0,
    finished: false,
    intervalHandle: null,
    onEnd: options.onEnd,
    onTick: options.onTick,
    tickInterval: options.tickInterval ?? 1000,
  };

  timers.set(id, internal);

  const autoStart = options.autoStart ?? true;

  if (autoStart) {
    startInterval(internal);
  } else {
    internal.pausedAt = internal.startTime;
  }

  const instance: Timer = {
    get id() {
      return internal.id;
    },
    get duration() {
      return internal.duration;
    },

    pause() {
      if (internal.pausedAt !== null || internal.finished) return;
      internal.pausedAt = now();
    },

    play() {
      if (internal.pausedAt === null || internal.finished) return;
      internal.totalPaused += now() - internal.pausedAt;
      internal.pausedAt = null;

      if (!internal.intervalHandle) startInterval(internal);

      checkEnd(internal);
    },

    restart() {
      stopInterval(internal);
      internal.startTime = now();
      internal.pausedAt = null;
      internal.totalPaused = 0;
      internal.finished = false;
      timers.set(id, internal);
      startInterval(internal);
    },

    stop(triggerOnEnd?: boolean) {
      if (internal.finished) return;
      internal.finished = true;
      stopInterval(internal);
      timers.delete(id);
      if (triggerOnEnd && internal.onEnd) internal.onEnd();
    },

    isPaused() {
      return internal.pausedAt !== null;
    },

    isFinished() {
      return internal.finished;
    },

    getState() {
      return buildState(internal);
    },

    addTime(ms: number) {
      if (internal.finished) return;
      internal.duration += ms;
    },

    removeTime(ms: number) {
      if (internal.finished) return;
      internal.duration = Math.max(0, internal.duration - ms);
      checkEnd(internal);
    },
  };

  return instance;
}

export function getTimer(id: number): Timer | null {
  return timers.has(id) ? createTimerProxy(id) : null;
}

export function getAllTimers(): number[] {
  return [...timers.keys()];
}

function createTimerProxy(id: number): Timer | null {
  const internal = timers.get(id);
  if (!internal) return null;

  return {
    get id() {
      return internal.id;
    },
    get duration() {
      return internal.duration;
    },
    pause() {
      if (internal.pausedAt !== null || internal.finished) return;
      internal.pausedAt = now();
    },
    play() {
      if (internal.pausedAt === null || internal.finished) return;
      internal.totalPaused += now() - internal.pausedAt;
      internal.pausedAt = null;
      if (!internal.intervalHandle) startInterval(internal);
      checkEnd(internal);
    },
    restart() {
      stopInterval(internal);
      internal.startTime = now();
      internal.pausedAt = null;
      internal.totalPaused = 0;
      internal.finished = false;
      timers.set(id, internal);
      startInterval(internal);
    },
    stop(triggerOnEnd?: boolean) {
      if (internal.finished) return;
      internal.finished = true;
      stopInterval(internal);
      timers.delete(id);
      if (triggerOnEnd && internal.onEnd) internal.onEnd();
    },
    isPaused() {
      return internal.pausedAt !== null;
    },
    isFinished() {
      return internal.finished;
    },
    getState() {
      return buildState(internal);
    },
    addTime(ms: number) {
      if (internal.finished) return;
      internal.duration += ms;
    },
    removeTime(ms: number) {
      if (internal.finished) return;
      internal.duration = Math.max(0, internal.duration - ms);
      checkEnd(internal);
    },
  };
}
