import { Print } from '@/shared/lib/print/main';
import { hasPermission } from '@/server/modules/permissions/main';
import type {
  ArgDefinition,
  CommandCallback,
  CommandOptions,
  CommandSuggestion,
  ParsedArgs,
  RegisteredCommand,
} from './types';

const log = Print.create('Command');

const commands = new Map<string, RegisteredCommand>();
const cooldowns = new Map<string, number>();

function buildCooldownKey(source: number, commandName: string): string {
  return `${source}:${commandName}`;
}

function isOnCooldown(source: number, commandName: string, cooldownMs: number): boolean {
  if (cooldownMs <= 0) return false;

  const key = buildCooldownKey(source, commandName);
  const lastUsed = cooldowns.get(key);
  if (!lastUsed) return false;

  return Date.now() - lastUsed < cooldownMs;
}

function setCooldown(source: number, commandName: string): void {
  cooldowns.set(buildCooldownKey(source, commandName), Date.now());
}

function parseArgValue(
  raw: string | undefined,
  def: ArgDefinition,
  _index: number,
  allArgs: string[],
  currentIndex: number,
): { value: unknown; error: string | null } {
  if (raw === undefined || raw === '') {
    if (def.optional) return { value: undefined, error: null };
    return { value: undefined, error: `argument '${def.name}' is required` };
  }

  const type = def.type ?? 'any';

  switch (type) {
    case 'number': {
      const num = Number(raw);
      if (isNaN(num)) return { value: undefined, error: `'${def.name}' must be a number` };
      return { value: num, error: null };
    }

    case 'player': {
      const id = raw === 'me' ? 0 : parseInt(raw);
      if (isNaN(id)) return { value: undefined, error: `'${def.name}' must be a valid player ID` };
      return { value: id, error: null };
    }

    case 'coordinate': {
      const coord = parseFloat(raw);
      if (isNaN(coord))
        return { value: undefined, error: `'${def.name}' must be a valid coordinate` };
      return { value: coord, error: null };
    }

    case 'boolean': {
      const lower = raw.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') return { value: true, error: null };
      if (lower === 'false' || lower === '0' || lower === 'no')
        return { value: false, error: null };
      return { value: undefined, error: `'${def.name}' must be true/false` };
    }

    case 'merge': {
      const merged = allArgs.slice(currentIndex).join(' ');
      return { value: merged || undefined, error: merged ? null : `'${def.name}' is required` };
    }

    case 'string':
      return { value: raw, error: null };

    case 'any':
    default:
      return { value: raw, error: null };
  }
}

function validateArgs(
  rawArgs: string[],
  suggestion: CommandSuggestion,
  source: number,
): { parsed: ParsedArgs | null; error: string | null } {
  const defs = suggestion.arguments;
  if (!defs || defs.length === 0) return { parsed: {}, error: null };

  const requiredCount = defs.filter((d) => !d.optional).length;

  if (suggestion.strictArgCount && rawArgs.length !== defs.length) {
    return { parsed: null, error: `expected ${defs.length} arguments, got ${rawArgs.length}` };
  }

  if (rawArgs.length < requiredCount) {
    const missing = defs[rawArgs.length];
    return { parsed: null, error: `missing required argument '${missing?.name}'` };
  }

  const parsed: ParsedArgs = {};

  for (let i = 0; i < defs.length; i++) {
    const def = defs[i]!;
    const raw = rawArgs[i];

    const { value, error } = parseArgValue(raw, def, i, rawArgs, i);

    if (error) return { parsed: null, error };

    if (def.type === 'player' && value === 0) {
      parsed[def.name] = source;
    } else {
      parsed[def.name] = value;
    }

    if (def.validator && value !== undefined) {
      const valid = def.validator(value);
      if (!valid) {
        return { parsed: null, error: def.validatorError ?? `validation failed for '${def.name}'` };
      }
    }

    if (def.type === 'merge') break;
  }

  return { parsed, error: null };
}

function sendSuggestion(commandName: string, suggestion: CommandSuggestion): void {
  const args = suggestion.arguments?.map((arg) => ({
    name: arg.name,
    help: arg.help ?? `${arg.type ?? 'any'}${arg.optional ? ' (optional)' : ''}`,
  }));

  emitNet('chat:addSuggestion', -1, `/${commandName}`, suggestion.help ?? '', args ?? []);
}

function removeSuggestion(commandName: string): void {
  emitNet('chat:removeSuggestion', -1, `/${commandName}`);
}

export function registerCommand(
  name: string | string[],
  callback: CommandCallback,
  options?: CommandOptions,
): void {
  if (Array.isArray(name)) {
    for (const n of name) {
      registerCommand(n, callback, options);
    }
    return;
  }

  const existing = commands.get(name);
  if (existing) {
    log.warn(`command '${name}' already registered, overriding`);
    if (existing.suggestion) removeSuggestion(name);
  }

  const suggestion = options?.suggestion ?? null;

  const registered: RegisteredCommand = {
    name,
    permission: options?.permission ?? null,
    callback,
    allowConsole: options?.allowConsole ?? false,
    suggestion,
    cooldown: options?.cooldown ?? 0,
  };

  commands.set(name, registered);

  if (suggestion) sendSuggestion(name, suggestion);

  RegisterCommand(
    name,
    async (source: number, args: string[]) => {
      const cmd = commands.get(name);
      if (!cmd) return;

      if (source === 0 && !cmd.allowConsole) {
        log.warn(`command '${name}' cannot be executed from console`);
        return;
      }

      if (cmd.permission && source !== 0) {
        const charId = source;
        const allowed = await hasPermission(charId, cmd.permission);
        if (!allowed) {
          log.warn(`player ${source} attempted '${name}' without permission '${cmd.permission}'`);
          return;
        }
      }

      if (cmd.cooldown > 0 && source !== 0) {
        if (isOnCooldown(source, name, cmd.cooldown)) {
          return;
        }
        setCooldown(source, name);
      }

      let parsedArgs: ParsedArgs = {};

      if (cmd.suggestion?.arguments && cmd.suggestion.arguments.length > 0) {
        const { parsed, error } = validateArgs(args, cmd.suggestion, source);

        if (error) {
          if (source === 0) {
            log.error(`/${name}: ${error}`);
          } else {
            emitNet('gaia:command:error', source, name, error);
          }
          return;
        }

        parsedArgs = parsed ?? {};
      }

      try {
        await cmd.callback(source, parsedArgs, args);
      } catch (err) {
        log.error(`command '${name}' threw an error: ${err}`);
      }
    },
    true,
  );
}

export function unregisterCommand(name: string): boolean {
  const cmd = commands.get(name);
  if (!cmd) return false;

  if (cmd.suggestion) removeSuggestion(name);

  commands.delete(name);
  return true;
}

export function isCommandRegistered(name: string): boolean {
  return commands.has(name);
}

export function getRegisteredCommand(name: string): RegisteredCommand | null {
  return commands.get(name) ?? null;
}

export function getAllCommands(): RegisteredCommand[] {
  return [...commands.values()];
}
