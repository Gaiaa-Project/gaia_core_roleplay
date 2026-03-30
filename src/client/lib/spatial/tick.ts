const subscribers = new Map<string, () => void>();
let tickHandle: number | null = null;

export function registerTick(key: string, fn: () => void): void {
  subscribers.set(key, fn);

  if (!tickHandle) {
    tickHandle = setTick(() => {
      for (const callback of subscribers.values()) {
        callback();
      }
    });
  }
}

export function unregisterTick(key: string): void {
  subscribers.delete(key);

  if (subscribers.size === 0 && tickHandle !== null) {
    clearTick(tickHandle);
    tickHandle = null;
  }
}

export function hasTickSubscribers(): boolean {
  return subscribers.size > 0;
}
