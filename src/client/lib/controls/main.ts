const callers = new Map<string, Set<number>>();
const controls = new Map<number, Set<string>>();
const suppressed = new Set<number>();

function resolveCaller(caller?: string): string {
  if (caller) return caller;
  const invoker = GetInvokingResource();
  if (invoker) return invoker;
  return GetCurrentResourceName();
}

function linkControl(caller: string, key: number): void {
  let callerKeys = callers.get(caller);
  if (!callerKeys) {
    callerKeys = new Set();
    callers.set(caller, callerKeys);
  }
  callerKeys.add(key);

  let controlCallers = controls.get(key);
  if (!controlCallers) {
    controlCallers = new Set();
    controls.set(key, controlCallers);
  }
  controlCallers.add(caller);
}

function unlinkControl(caller: string, key: number): void {
  const callerKeys = callers.get(caller);
  if (callerKeys) {
    callerKeys.delete(key);
    if (callerKeys.size === 0) callers.delete(caller);
  }

  const controlCallers = controls.get(key);
  if (controlCallers) {
    controlCallers.delete(caller);
    if (controlCallers.size === 0) {
      controls.delete(key);
      suppressed.delete(key);
    }
  }
}

export function addDisabledControl(...keys: number[]): void {
  const caller = resolveCaller();
  for (const key of keys) {
    linkControl(caller, key);
  }
}

export function removeDisabledControl(...keys: number[]): void {
  const caller = resolveCaller();
  for (const key of keys) {
    unlinkControl(caller, key);
  }
}

export function clearDisabledControl(caller?: string): void {
  const resolved = resolveCaller(caller);
  const callerKeys = callers.get(resolved);
  if (!callerKeys) return;
  for (const key of callerKeys) {
    const controlCallers = controls.get(key);
    if (controlCallers) {
      controlCallers.delete(resolved);
      if (controlCallers.size === 0) {
        controls.delete(key);
        suppressed.delete(key);
      }
    }
  }
  callers.delete(resolved);
}

export function clearAllDisabledControls(): void {
  callers.clear();
  controls.clear();
  suppressed.clear();
}

export function suppressDisabledControl(...keys: number[]): void {
  for (const key of keys) {
    if (controls.has(key)) suppressed.add(key);
  }
}

export function unsuppressDisabledControl(...keys: number[]): void {
  for (const key of keys) {
    suppressed.delete(key);
  }
}

export function hasDisabledControl(key: number): boolean {
  return controls.has(key);
}

export function isDisabledControlSuppressed(key: number): boolean {
  return suppressed.has(key);
}

export function getDisabledControlCallers(key: number): string[] {
  const controlCallers = controls.get(key);
  return controlCallers ? [...controlCallers] : [];
}

export function getAllDisabledControls(): number[] {
  return [...controls.keys()];
}

export function tickDisabledControls(): void {
  for (const key of controls.keys()) {
    if (!suppressed.has(key)) {
      DisableControlAction(0, key, true);
    }
  }
}
