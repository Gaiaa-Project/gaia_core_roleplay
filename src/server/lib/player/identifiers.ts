import type { PlayerIdentifiers } from './types';

const IDENTIFIER_KEYS: (keyof Omit<PlayerIdentifiers, 'name'>)[] = [
  'license2',
  'license',
  'steam',
  'discord',
  'fivem',
  'xbl',
  'live',
  'ip',
];

export function GetIdentifiers(sessionId: number): PlayerIdentifiers {
  const source = String(sessionId);
  const rawIdentifiers: string[] = getPlayerIdentifiers(source);
  const playerName = GetPlayerName(source);

  const identifiers: PlayerIdentifiers = {
    license: null,
    license2: null,
    steam: null,
    discord: null,
    fivem: null,
    xbl: null,
    live: null,
    ip: null,
    name: playerName ?? 'Unknown',
  };

  for (const raw of rawIdentifiers) {
    for (const key of IDENTIFIER_KEYS) {
      if (raw.startsWith(`${key}:`)) {
        identifiers[key] = raw.substring(key.length + 1);
        break;
      }
    }
  }

  return identifiers;
}
