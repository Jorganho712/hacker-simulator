import type { Contract, FeedLine, FsEntry, Hardware, Msg, MissionRecord, Notif, SkillId, Stats } from './types';
import { START_HW } from './data/hardware';

export const SAVE_VERSION = 1;

export interface GameData {
  v: number;
  name: string;
  title: string;
  promptName: string;
  money: number;
  xp: number;
  level: number;
  rep: number;
  skillPoints: number;
  skills: Record<SkillId, number>;
  hw: Hardware;
  tools: Record<string, number>;
  inv: string[];
  fs: Record<string, FsEntry>;
  cwd: string;
  node: string | null;
  discovered: string[];
  scanned: Record<string, number>;
  inspected: string[];
  missions: Record<string, MissionRecord>;
  active: string | null;
  offered: string[];
  contracts: Contract[];
  flags: Record<string, boolean | string | number>;
  choices: Record<string, string>;
  contactsUnlocked: string[];
  threads: Record<string, Msg[]>;
  pending: Record<string, string | null>;
  trust: Record<string, number>;
  ach: Record<string, number>;
  stats: Stats;
  chDone: Record<string, { best: number; count: number }>;
  history: string[];
  notifs: Notif[];
  feed: FeedLine[];
  minutes: number;
  cooldowns: Record<string, number>;
  overheatUntil: number;
  sales: Record<string, { pct: number; until: number }>;
  created: number;
  savedAt: number;
}

export const EMPTY_STATS: Stats = {
  commands: 0, missionsDone: 0, missionsFailed: 0, mgPlayed: 0, mgWon: {}, analysisWon: 0, errors: 0,
  moneyEarned: 0, moneySpent: 0, toolsBought: 0, scans: 0, playSeconds: 0, perfectMissions: 0, eventsSeen: 0, filesCreated: 0,
};

const dir = (name: string, now: number): FsEntry => ({ type: 'dir', name, size: 0, created: now });
const file = (name: string, content: string, now: number, extra: Partial<FsEntry> = {}): FsEntry => ({ type: 'file', name, content, size: Math.max(1, Math.ceil(content.length / 80)), created: now, ...extra });

export function initialFs(now: number): Record<string, FsEntry> {
  return {
    '/': dir('/', now),
    '/home': dir('home', now),
    '/home/user': dir('user', now),
    '/home/user/documents': dir('documents', now),
    '/home/user/downloads': dir('downloads', now),
    '/home/user/reports': dir('reports', now),
    '/home/user/notes': dir('notes', now),
    '/home/user/readme.txt': file('readme.txt', 'HACKER SIMULATOR — Realistic Cyber Ops\n\nBem-vindo ao seu centro de operações.\n\n1. Aceite contratos na aba MISSÕES.\n2. Use o TERMINAL para escanear, conectar, baixar e analisar.\n3. Compre ferramentas e melhore seu computador no MERCADO.\n4. Converse com contatos para desbloquear histórias.\n\nTudo aqui é uma simulação local e fictícia.\n', now, { readonly: true }),
    '/home/user/notes/primeiros_passos.txt': file('primeiros_passos.txt', 'Meus lembretes:\n- terminal: help\n- scan <alvo>, connect <alvo>, cat <arquivo>\n- download <arquivo> para salvar em ~/downloads\n- analyze <arquivo> usa HexAnalyzer\n', now),
  };
}

export function newGameData(name: string): GameData {
  const now = Date.now();
  return {
    v: SAVE_VERSION,
    name,
    title: '',
    promptName: 'user@cybercore',
    money: 250,
    xp: 0,
    level: 1,
    rep: 0,
    skillPoints: 1,
    skills: { analysis: 0, crypto: 0, forensics: 0, infra: 0, security: 0 },
    hw: { ...START_HW },
    tools: { cyberscan: 1, secureshell: 1, hexanalyzer: 1 },
    inv: [],
    fs: initialFs(now),
    cwd: '/home/user',
    node: null,
    discovered: ['pf-workstation', 'aegis-train-01'],
    scanned: {},
    inspected: [],
    missions: {},
    active: null,
    offered: [],
    contracts: [],
    flags: {},
    choices: {},
    contactsUnlocked: ['morpheus'],
    threads: {},
    pending: {},
    trust: {},
    ach: {},
    stats: { ...EMPTY_STATS, mgWon: {} },
    chDone: {},
    history: [],
    notifs: [],
    feed: [],
    minutes: 9 * 60 + 5, // 09:05 do dia 1
    cooldowns: {},
    overheatUntil: 0,
    sales: {},
    created: now,
    savedAt: now,
  };
}

export const GAME_EPOCH = new Date('2031-03-14T00:00:00').getTime();
export function fmtGameTime(minutes: number) {
  const d = new Date(GAME_EPOCH + minutes * 60000);
  const p = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
}
