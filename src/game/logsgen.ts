import { pick, randInt, rng, shuffle } from './crypto';

export interface LogLine {
  i: number;
  time: string;
  svc: string;
  user: string;
  ip: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  msg: string;
  key: boolean;
}
export interface LogCase {
  lines: LogLine[];
  attackerUser: string;
  attackerIp: string;
  users: string[];
  ips: string[];
  keyCount: number;
  story: string;
}

const NORMAL_USERS = ['ana.silva', 'bruno.costa', 'carla.m', 'diego.r', 'elisa.t', 'fabio.p', 'gisele.o', 'hugo.n'];
const INTERNAL = ['10.77.3.11', '10.77.3.12', '10.77.3.14', '10.77.3.21', '10.77.3.30', '10.77.3.37'];
const DECOY_EXT = ['10.77.9.4', '10.77.9.18', '10.77.9.52'];
const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (h: number, m: number, s: number) => `${pad(h)}:${pad(m)}:${pad(s)}`;

export function genLogs(scenario: string, seed: number, count: number): LogCase {
  const r = rng(seed);
  const attackerUser = pick(r, ['svc_backup', 'svc_report', 'svc_deploy', 'svc_sync']);
  const attackerIp = `10.77.9.${randInt(r, 60, 99)}`;
  const decoyUser = pick(r, NORMAL_USERS);
  const raw: Omit<LogLine, 'i'>[] = [];
  const add = (h: number, m: number, s: number, svc: string, user: string, ip: string, level: LogLine['level'], msg: string, key = false) =>
    raw.push({ time: stamp(h, m, s), svc, user, ip, level, msg, key });

  // ruído normal
  const normalCount = count - (scenario === 'bruteforce' ? 14 : scenario === 'exfil' ? 7 : 8);
  for (let k = 0; k < normalCount; k++) {
    const h = r() < 0.9 ? randInt(r, 7, 18) : randInt(r, 19, 23);
    const m = randInt(r, 0, 59), s = randInt(r, 0, 59);
    const u = pick(r, NORMAL_USERS);
    const ip = pick(r, INTERNAL);
    const t = r();
    if (t < 0.28) add(h, m, s, 'sshd', u, ip, 'INFO', `Accepted publickey for ${u}`);
    else if (t < 0.5) add(h, m, s, 'web', u, ip, 'INFO', `GET /dashboard 200 ${randInt(r, 4, 90)}ms`);
    else if (t < 0.62) add(h, m, s, 'web', u, ip, 'INFO', `POST /api/report 201 ${randInt(r, 20, 400)}ms`);
    else if (t < 0.72) add(h, m, s, 'db', u, ip, 'INFO', `SELECT ok rows=${randInt(r, 1, 900)} duration=${randInt(r, 2, 90)}ms`);
    else if (t < 0.8) add(h, m, s, 'cron', 'root', '127.0.0.1', 'INFO', pick(r, ['job backup-incremental ok', 'job rotate-logs ok', 'job cleanup-tmp ok', 'job healthcheck ok']));
    else if (t < 0.88) add(h, m, s, 'auth', u, ip, 'WARN', `Failed password for ${u} (attempt 1)`);
    else if (t < 0.94) add(h, m, s, 'web', u, ip, 'WARN', `GET /old-report 404`);
    else add(h, m, s, 'sshd', u, ip, 'INFO', `session closed for ${u}`);
  }
  // chamarizes: um usuário comum com 2 falhas
  add(9, randInt(r, 5, 40), 12, 'auth', decoyUser, pick(r, INTERNAL), 'WARN', `Failed password for ${decoyUser} (attempt 1)`);
  add(9, randInt(r, 41, 55), 4, 'auth', decoyUser, pick(r, INTERNAL), 'WARN', `Failed password for ${decoyUser} (attempt 2)`);
  add(9, 58, 31, 'auth', decoyUser, pick(r, INTERNAL), 'INFO', `Accepted password for ${decoyUser}`);
  add(14, randInt(r, 0, 59), randInt(r, 0, 59), 'web', pick(r, NORMAL_USERS), pick(r, DECOY_EXT), 'WARN', 'GET /wp-login 404 (scanner conhecido, bloqueado pelo WAF)');

  let story = '';
  if (scenario === 'bruteforce') {
    const h0 = randInt(r, 2, 3);
    for (let k = 0; k < 8; k++) add(h0, 12 + k * 3, randInt(r, 0, 59), 'auth', attackerUser, attackerIp, 'ERROR', `Failed password for ${attackerUser} (attempt ${k + 1})`, true);
    add(h0, 41, 7, 'auth', attackerUser, attackerIp, 'WARN', `Accepted password for ${attackerUser} after 8 failures`, true);
    add(h0, 42, 15, 'sshd', attackerUser, attackerIp, 'WARN', `sudo: ${attackerUser} added to group admin`, true);
    add(h0, 44, 2, 'db', attackerUser, attackerIp, 'WARN', `SELECT ok rows=48210 duration=3100ms`, true);
    add(h0, 47, 50, 'web', attackerUser, attackerIp, 'ERROR', 'GET /admin/export 200 (fora do horário comercial)', true);
    add(h0, 52, 9, 'sshd', attackerUser, attackerIp, 'INFO', `session closed for ${attackerUser}`, true);
    story = `Uma conta de serviço (${attackerUser}) teve muitas falhas seguidas de um login bem-sucedido de madrugada. Quem é e de onde veio?`;
  } else if (scenario === 'exfil') {
    const h0 = randInt(r, 1, 4);
    add(h0, 5, 11, 'auth', attackerUser, attackerIp, 'WARN', `Accepted publickey for ${attackerUser} (chave nova)`, true);
    add(h0, 7, 30, 'db', attackerUser, attackerIp, 'WARN', `SELECT ok rows=1200000 duration=48200ms`, true);
    add(h0, 12, 3, 'web', attackerUser, attackerIp, 'ERROR', `EXPORT customers.csv 480MB para ${attackerIp}`, true);
    add(h0, 14, 41, 'web', attackerUser, attackerIp, 'ERROR', 'EXPORT audit_dump.csv 212MB', true);
    add(h0, 16, 20, 'sshd', attackerUser, attackerIp, 'WARN', 'rm /var/log/audit.log (log apagado)', true);
    add(h0, 17, 2, 'auth', attackerUser, attackerIp, 'INFO', `session closed for ${attackerUser}`, true);
    add(h0, 17, 40, 'cron', 'root', '127.0.0.1', 'ERROR', 'job rotate-logs falhou: arquivo ausente', true);
    story = `Houve uma exportação massiva de dados fora do expediente. Identifique a conta e o IP que fizeram a exportação e apagaram rastros.`;
  } else {
    const h0 = randInt(r, 22, 23);
    add(h0, 2, 5, 'sshd', attackerUser, attackerIp, 'WARN', `Accepted publickey for ${attackerUser} de IP externo incomum`, true);
    add(h0, 9, 40, 'db', attackerUser, attackerIp, 'WARN', `GRANT ALL on vault.* TO ${attackerUser}`, true);
    add(h0, 14, 12, 'web', attackerUser, attackerIp, 'ERROR', 'GET /vault/roster.dat 200 (acesso restrito)', true);
    add(h0, 18, 3, 'web', attackerUser, attackerIp, 'ERROR', 'GET /vault/staff_access.log 200 (acesso restrito)', true);
    add(h0, 21, 57, 'sshd', attackerUser, attackerIp, 'WARN', `scp download 18MB para ${attackerIp}`, true);
    add(h0, 25 > 59 ? 59 : 25, 1, 'auth', attackerUser, attackerIp, 'INFO', `session closed for ${attackerUser}`, true);
    story = `Um acesso restrito fora do horário e vindo de um IP incomum apareceu nos registros. Quem acessou o vault e de onde?`;
  }
  raw.sort((a, b) => a.time.localeCompare(b.time));
  const lines = raw.map((l, i) => ({ ...l, i }));
  const users = shuffle(r, [...new Set([attackerUser, decoyUser, ...NORMAL_USERS.slice(0, 4), 'root'])]);
  const ips = shuffle(r, [attackerIp, ...DECOY_EXT, ...INTERNAL.slice(0, 2)]);
  return { lines, attackerUser, attackerIp, users, ips, keyCount: lines.filter((l) => l.key).length, story };
}

// Heurística real do LogHunter: pontua cada linha por sinais de anomalia
export function anomalyScore(l: LogLine, lines: LogLine[]) {
  const h = +l.time.slice(0, 2);
  let s = 0;
  if (h >= 22 || h <= 5) s += 2;
  if (l.level === 'ERROR') s += 2;
  if (l.level === 'WARN') s += 1;
  if (/EXPORT|GRANT|rm \/var|sudo|restrito|roster|scp|apagado|chave nova|admin/i.test(l.msg)) s += 2;
  if (/^svc_/.test(l.user)) s += 1;
  if (l.ip.startsWith('10.77.9.')) s += 1;
  const fails = lines.filter((x) => x.ip === l.ip && /Failed/.test(x.msg)).length;
  if (fails >= 5) s += 2;
  return s;
}
