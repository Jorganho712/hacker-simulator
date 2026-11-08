// Utilitários de cifras clássicas (educativos). Operam apenas sobre texto fictício do jogo.

export const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function caesar(text: string, shift: number): string {
  const s = ((shift % 26) + 26) % 26;
  return text.replace(/[A-Z]/g, (c) => ALPHA[(ALPHA.indexOf(c) + s) % 26]);
}

export function substEncrypt(text: string, key: string): string {
  return text.replace(/[A-Z]/g, (c) => key[ALPHA.indexOf(c)]);
}

export function substDecrypt(cipher: string, mapping: Record<string, string>): string {
  return cipher.replace(/[A-Z]/g, (c) => mapping[c] || '·');
}

export function vigenere(text: string, key: string, decrypt = false): string {
  let j = 0;
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!k) return text;
  return text.replace(/[A-Z]/g, (c) => {
    const sh = ALPHA.indexOf(k[j % k.length]) * (decrypt ? -1 : 1);
    j++;
    return ALPHA[(((ALPHA.indexOf(c) + sh) % 26) + 26) % 26];
  });
}

export function freq(text: string): [string, number][] {
  const m: Record<string, number> = {};
  for (const c of text) if (/[A-Z]/.test(c)) m[c] = (m[c] || 0) + 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

// RNG determinístico (mulberry32)
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];
export const shuffle = <T,>(r: () => number, arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const randInt = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
