import type { Vector2, WeightedOption, RGB, RGBA, SeededRandom } from './types';

export function createSeed(seed: number): SeededRandom {
  let s = seed >>> 0;
  return function (): number {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomBool(): boolean {
  return Math.random() < 0.5;
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)] as T;
}

export function randomChoices<T>(array: T[], count: number, withReplacement: boolean = false): T[] {
  if (!withReplacement && count > array.length) {
    throw new RangeError(`count (${count}) exceeds array length (${array.length})`);
  }
  if (withReplacement) {
    return Array.from(
      { length: count },
      () => array[Math.floor(Math.random() * array.length)] as T,
    );
  }
  const copy = array.slice();
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * (copy.length - i));
    result.push(copy[index] as T);
    copy[index] = copy[copy.length - 1 - i] as T;
  }
  return result;
}

export function randomWeighted<T>(options: WeightedOption<T>[]): T {
  let total = 0;
  for (const option of options) {
    total += option.weight;
  }
  let threshold = Math.random() * total;
  for (const option of options) {
    threshold -= option.weight;
    if (threshold <= 0) {
      return option.value;
    }
  }
  return (options[options.length - 1] as WeightedOption<T>).value;
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i] as T;
    result[i] = result[j] as T;
    result[j] = temp;
  }
  return result;
}

export function randomPointInCircle(center: Vector2, radius: number): Vector2 {
  const angle = Math.random() * 2 * Math.PI;
  const r = radius * Math.sqrt(Math.random());
  return {
    x: center.x + r * Math.cos(angle),
    y: center.y + r * Math.sin(angle),
  };
}

export function randomUUIDv4(): string {
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    const r = Math.floor(Math.random() * 16);
    if (i === 8 || i === 12 || i === 16 || i === 20) uuid += '-';
    if (i === 12) {
      uuid += '4';
    } else if (i === 16) {
      uuid += hex[(r & 0x3) | 0x8];
    } else {
      uuid += hex[r];
    }
  }
  return uuid;
}

function simpleHash(input: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    bytes.push(input.charCodeAt(i) & 0xff);
  }
  const h = new Array<number>(20).fill(0);
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const msg = bytes.slice();
  const bitLen = msg.length * 8;
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  for (let i = 7; i >= 0; i--) {
    msg.push((bitLen / Math.pow(2, i * 8)) & 0xff);
  }
  for (let chunk = 0; chunk < msg.length; chunk += 64) {
    const w: number[] = [];
    for (let i = 0; i < 16; i++) {
      w.push(
        ((msg[chunk + i * 4]! << 24) |
          (msg[chunk + i * 4 + 1]! << 16) |
          (msg[chunk + i * 4 + 2]! << 8) |
          msg[chunk + i * 4 + 3]!) >>>
          0,
      );
    }
    for (let i = 16; i < 80; i++) {
      const val = w[i - 3]! ^ w[i - 8]! ^ w[i - 14]! ^ w[i - 16]!;
      w.push(((val << 1) | (val >>> 31)) >>> 0);
    }
    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4;
    for (let i = 0; i < 80; i++) {
      let f: number, k: number;
      if (i < 20) {
        f = ((b & c) | (~b & d)) >>> 0;
        k = 0x5a827999;
      } else if (i < 40) {
        f = (b ^ c ^ d) >>> 0;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = ((b & c) | (b & d) | (c & d)) >>> 0;
        k = 0x8f1bbcdc;
      } else {
        f = (b ^ c ^ d) >>> 0;
        k = 0xca62c1d6;
      }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[i]!) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = temp;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }
  const result = [h0, h1, h2, h3, h4];
  for (let i = 0; i < 5; i++) {
    const val = result[i]!;
    h[i * 4] = (val >>> 24) & 0xff;
    h[i * 4 + 1] = (val >>> 16) & 0xff;
    h[i * 4 + 2] = (val >>> 8) & 0xff;
    h[i * 4 + 3] = val & 0xff;
  }
  return h;
}

function toHexByte(n: number): string {
  return n.toString(16).padStart(2, '0');
}

export function randomUUIDv5(namespace: string, name: string): string {
  const hash = simpleHash(namespace + name);
  hash[6] = (hash[6]! & 0x0f) | 0x50;
  hash[8] = (hash[8]! & 0x3f) | 0x80;
  return (
    toHexByte(hash[0]!) +
    toHexByte(hash[1]!) +
    toHexByte(hash[2]!) +
    toHexByte(hash[3]!) +
    '-' +
    toHexByte(hash[4]!) +
    toHexByte(hash[5]!) +
    '-' +
    toHexByte(hash[6]!) +
    toHexByte(hash[7]!) +
    '-' +
    toHexByte(hash[8]!) +
    toHexByte(hash[9]!) +
    '-' +
    toHexByte(hash[10]!) +
    toHexByte(hash[11]!) +
    toHexByte(hash[12]!) +
    toHexByte(hash[13]!) +
    toHexByte(hash[14]!) +
    toHexByte(hash[15]!)
  );
}

export function randomUUIDv6(): string {
  const now = Date.now();
  const gregorianOffset = 122192928000000000n;
  const ts = BigInt(now) * 10000n + gregorianOffset;
  const timeLow = Number((ts >> 28n) & 0xffffffffffffn);
  const timeMid = Number((ts >> 12n) & 0xffffn);
  const timeHiVersion = Number(ts & 0x0fffn) | 0x6000;
  const clockSeq = Math.floor(Math.random() * 0x3fff) | 0x8000;
  const node = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
  const timeHighStr = timeLow.toString(16).padStart(12, '0');
  const timeMidStr = timeMid.toString(16).padStart(4, '0');
  const timeHiStr = timeHiVersion.toString(16).padStart(4, '0');
  const clockStr = clockSeq.toString(16).padStart(4, '0');
  const nodeStr = node.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${timeHighStr.slice(0, 8)}-${timeHighStr.slice(8)}-${timeMidStr}-${timeHiStr}-${clockStr}-${nodeStr}`.replace(
    /^(.{8})-(.{4})-(.{4})-(.{4})-(.{4})(.{12})$/,
    '$1$2-$3-$4-$5-$6',
  );
}

export function randomUUIDv7(): string {
  const now = Date.now();
  const msHigh = Math.floor(now / 0x10000);
  const msLow = now & 0xffff;
  const randA = Math.floor(Math.random() * 0x1000);
  const randBHigh = Math.floor(Math.random() * 0x3fff) | 0x8000;
  const randC = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
  const p1 = msHigh.toString(16).padStart(8, '0');
  const p2 = msLow.toString(16).padStart(4, '0');
  const p3 = (0x7000 | randA).toString(16).padStart(4, '0');
  const p4 = randBHigh.toString(16).padStart(4, '0');
  const p5 = randC.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export function randomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function randomAlphabetic(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function randomNumeric(length: number): string {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function randomRGB(): RGB {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
}

export function randomRGBA(): RGBA {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
    a: Math.random(),
  };
}

export function randomPercentage(): number {
  return Math.random() * 100;
}

export function randomAngle(): number {
  return Math.random() * 360;
}

export function randomSign(): number {
  return Math.random() < 0.5 ? -1 : 1;
}

export function randomPointOnCircleEdge(center: Vector2, radius: number): Vector2 {
  const angle = Math.random() * 2 * Math.PI;
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

export function randomRadianAngle(): number {
  return Math.random() * 2 * Math.PI;
}
