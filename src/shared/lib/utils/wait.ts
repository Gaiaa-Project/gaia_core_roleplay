export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function waitFor<T>(cb: () => T | undefined | null, timeout?: number | false): Promise<T> {
  const value = cb();
  if (value != null) return Promise.resolve(value);

  const ms = timeout === false ? false : typeof timeout === 'number' ? timeout : 1000;
  const start = GetGameTimer();

  return new Promise((resolve, reject) => {
    const check = () => {
      const result = cb();

      if (result != null) {
        resolve(result);
        return;
      }

      if (ms !== false) {
        const elapsed = GetGameTimer() - start;
        if (elapsed > ms) {
          reject(new Error(`waitFor timed out after ${elapsed}ms`));
          return;
        }
      }

      setTimeout(check, 0);
    };

    setTimeout(check, 0);
  });
}
