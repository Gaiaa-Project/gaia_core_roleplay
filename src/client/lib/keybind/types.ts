export interface KeybindOptions {
  name: string;
  description: string;
  defaultKey?: string;
  defaultMapper?: string;
  secondaryKey?: string;
  secondaryMapper?: string;
  disabled?: boolean;
  onPressed?: (keybind: KeybindInstance) => void;
  onReleased?: (keybind: KeybindInstance) => void;
}

export interface KeybindInstance {
  readonly name: string;
  readonly description: string;
  readonly hash: number;
  getCurrentKey(): string;
  isControlPressed(): boolean;
  enable(toggle: boolean): void;
  isEnabled(): boolean;
}
