import type { FsEntry } from './types';

export type Fs = Record<string, FsEntry>;

export function resolvePath(cwd: string, input: string): string {
  let p = input.trim();
  if (p === '' || p === '.') return cwd;
  if (p === '~') return '/home/user';
  if (p.startsWith('~/')) p = '/home/user/' + p.slice(2);
  const abs = p.startsWith('/') ? p : cwd === '/' ? '/' + p : cwd + '/' + p;
  const parts: string[] = [];
  for (const seg of abs.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return '/' + parts.join('/');
}

export const parentOf = (p: string) => (p === '/' ? '/' : p.slice(0, p.lastIndexOf('/')) || '/');
export const baseOf = (p: string) => p.slice(p.lastIndexOf('/') + 1);
export const joinPath = (a: string, b: string) => (a === '/' ? '/' + b : a + '/' + b);

export function listDir(fs: Fs, dir: string): { path: string; e: FsEntry }[] {
  const prefix = dir === '/' ? '/' : dir + '/';
  return Object.entries(fs)
    .filter(([p]) => p !== dir && p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
    .map(([path, e]) => ({ path, e }))
    .sort((a, b) => (a.e.type === b.e.type ? a.e.name.localeCompare(b.e.name) : a.e.type === 'dir' ? -1 : 1));
}

export function displayPath(p: string) {
  return p === '/home/user' ? '~' : p.startsWith('/home/user/') ? '~' + p.slice('/home/user'.length) : p;
}

export function uniqueName(fs: Fs, dir: string, name: string): string {
  if (!fs[joinPath(dir, name)]) return name;
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let i = 2; i < 999; i++) {
    const n = `${stem}_${i}${ext}`;
    if (!fs[joinPath(dir, n)]) return n;
  }
  return name + '_x';
}

export function removeRecursive(fs: Fs, path: string): Fs {
  const out: Fs = {};
  for (const [p, e] of Object.entries(fs)) {
    if (p === path || p.startsWith(path + '/')) continue;
    out[p] = e;
  }
  return out;
}

export function moveEntry(fs: Fs, from: string, to: string): Fs {
  const out: Fs = {};
  for (const [p, e] of Object.entries(fs)) {
    if (p === from) out[to] = { ...e, name: baseOf(to) };
    else if (p.startsWith(from + '/')) out[to + p.slice(from.length)] = e;
    else out[p] = e;
  }
  return out;
}

export const isValidName = (n: string) => /^[\w\-. áéíóúãõâêôçÁÉÍÓÚÃÕÂÊÔÇ]+$/.test(n) && n.length <= 48 && n !== '.' && n !== '..';

export const fmtKB = (kb: number) => (kb >= 1048576 ? (kb / 1048576).toFixed(1) + ' GB' : kb >= 1024 ? (kb / 1024).toFixed(kb >= 10240 ? 0 : 1) + ' MB' : Math.round(kb) + ' KB');
