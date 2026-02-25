export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function waitUntil(condition: () => boolean, interval = 0, timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    if (interval > 0) {
      const check = () => {
        if (condition()) {
          resolve();
          return;
        }
        if (Date.now() - startTime > timeout) {
          reject(new Error('waitUntil timeout'));
          return;
        }
        setTimeout(check, interval);
      };
      check();
    } else {
      const tick = setTick(() => {
        if (condition()) {
          clearTick(tick);
          resolve();
          return;
        }
        if (Date.now() - startTime > timeout) {
          clearTick(tick);
          reject(new Error('waitUntil timeout'));
        }
      });
    }
  });
}

export function waitForPlayer(timeout = 30000): Promise<void> {
  return waitUntil(() => NetworkIsPlayerActive(PlayerId()), 0, timeout);
}

export function waitForModel(model: number, timeout = 10000): Promise<void> {
  RequestModel(model);
  return waitUntil(() => HasModelLoaded(model), 0, timeout);
}

export function waitForAnimDict(dict: string, timeout = 10000): Promise<void> {
  RequestAnimDict(dict);
  return waitUntil(() => HasAnimDictLoaded(dict), 0, timeout);
}
