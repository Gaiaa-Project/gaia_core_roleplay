export function GenerateUUID(): string {
  const timestamp = Date.now();
  const hex = timestamp.toString(16).padStart(12, '0');

  const randomHex = (length: number): string => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
  };

  const variant = (8 + Math.floor(Math.random() * 4)).toString(16);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '7' + randomHex(3),
    variant + randomHex(3),
    randomHex(12),
  ].join('-');
}
