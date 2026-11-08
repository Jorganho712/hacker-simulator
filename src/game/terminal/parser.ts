// Parser de comandos do terminal simulado. Interpreta SOMENTE os comandos definidos pelo jogo.

export interface Parsed {
  raw: string;
  cmd: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

export function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q: '"' | "'" | null = null;
  let has = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === q) q = null;
      else cur += c;
    } else if (c === '"' || c === "'") {
      q = c;
      has = true;
    } else if (/\s/.test(c)) {
      if (cur || has) out.push(cur);
      cur = '';
      has = false;
    } else cur += c;
  }
  if (cur || has) out.push(cur);
  return out;
}

export function parse(line: string): Parsed {
  const tokens = tokenize(line.trim());
  const cmd = (tokens.shift() || '').toLowerCase();
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (const t of tokens) {
    if (t.startsWith('--') && t.length > 2) {
      const [k, v] = t.slice(2).split('=');
      flags[k] = v === undefined ? true : v;
    } else if (/^-[a-zA-Z]+$/.test(t)) {
      for (const ch of t.slice(1)) flags[ch] = true;
    } else args.push(t);
  }
  return { raw: line.trim(), cmd, args, flags };
}

export function lev(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
