export type ArgType = 'string' | 'number' | 'player' | 'coordinate' | 'boolean' | 'merge' | 'any';

export interface ArgDefinition {
  name: string;
  type?: ArgType;
  help?: string;
  optional?: boolean;
  validator?: (value: unknown) => boolean;
  validatorError?: string;
}

export interface CommandSuggestion {
  help?: string;
  arguments?: ArgDefinition[];
  strictArgCount?: boolean;
}

export interface CommandOptions {
  permission?: string;
  allowConsole?: boolean;
  suggestion?: CommandSuggestion;
  cooldown?: number;
}

export interface ParsedArgs {
  [key: string]: unknown;
}

export type CommandCallback = (
  source: number,
  args: ParsedArgs,
  rawArgs: string[],
) => void | Promise<void>;

export interface RegisteredCommand {
  name: string;
  permission: string | null;
  callback: CommandCallback;
  allowConsole: boolean;
  suggestion: CommandSuggestion | null;
  cooldown: number;
}
