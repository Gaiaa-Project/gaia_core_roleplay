import type { KeybindOptions, KeybindInstance } from './types';

interface KeybindState {
  pressed: boolean;
  disabled: boolean;
  removed: boolean;
  onPressed?: (keybind: KeybindInstance) => void;
  onReleased?: (keybind: KeybindInstance) => void;
}

const registry = new Map<string, KeybindState>();

export function addKeybind(options: KeybindOptions): KeybindInstance {
  if (registry.has(options.name)) {
    throw new Error(`keybind '${options.name}' already exists`);
  }

  const hash = GetHashKey('+' + options.name) | 0x80000000;

  const state: KeybindState = {
    pressed: false,
    disabled: options.disabled ?? false,
    removed: false,
    onPressed: options.onPressed,
    onReleased: options.onReleased,
  };

  const instance: KeybindInstance = {
    name: options.name,
    description: options.description,
    hash,
    getCurrentKey: () => GetControlInstructionalButton(0, hash, true).substring(2),
    isControlPressed: () => state.pressed,
    enable: (toggle: boolean) => {
      state.disabled = !toggle;
    },
    isEnabled: () => !state.disabled,
  };

  registry.set(options.name, state);

  RegisterCommand(
    '+' + options.name,
    () => {
      if (state.removed || state.disabled || IsPauseMenuActive()) return;
      state.pressed = true;
      if (state.onPressed) state.onPressed(instance);
    },
    false,
  );

  RegisterCommand(
    '-' + options.name,
    () => {
      if (state.removed) return;
      state.pressed = false;
      if (state.disabled || IsPauseMenuActive()) return;
      if (state.onReleased) state.onReleased(instance);
    },
    false,
  );

  RegisterKeyMapping(
    '+' + options.name,
    options.description,
    options.defaultMapper ?? 'keyboard',
    options.defaultKey ?? '',
  );

  if (options.secondaryKey) {
    RegisterKeyMapping(
      '~!+' + options.name,
      options.description,
      options.secondaryMapper ?? options.defaultMapper ?? 'keyboard',
      options.secondaryKey,
    );
  }

  setTimeout(() => {
    emit('chat:removeSuggestion', '/+' + options.name);
    emit('chat:removeSuggestion', '/-' + options.name);
  }, 500);

  return instance;
}

export function removeKeybind(name: string): boolean {
  const state = registry.get(name);
  if (!state) return false;
  state.removed = true;
  state.pressed = false;
  registry.delete(name);
  return true;
}

export function enableKeybind(name: string, toggle: boolean): void {
  const state = registry.get(name);
  if (state) state.disabled = !toggle;
}

export function isKeybindPressed(name: string): boolean {
  return registry.get(name)?.pressed ?? false;
}
