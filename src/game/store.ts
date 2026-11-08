import { create } from 'zustand';
import type { ChallengeDef, Contract, FeedLine, GameEvent, MissionDef, Msg, Notif, ScreenId, Settings, TermKind, TermLine } from './types';
import { SAVE_VERSION, fmtGameTime, newGameData, type GameData } from './state';
import { MISSION_MAP } from './data/missions';
import { NODE_MAP, NODES } from './data/world';
import { resolveChallenge, generateContract } from './data/contracts';
import { CONTACT_MAP, DIALOGUE_MAP } from './data/contacts';
import { ACHIEVEMENTS, MAX_LEVEL, REP_MAX, SKILL_MAP, repRank, skillCost, xpToNext } from './data/progression';
import { SHOP_MAP, TOOL_MAP } from './data/tools';
import { EVENT_MAP, EVENTS, TIPS } from './data/events';
import { cpuSpeed, getMission, hasTool, isOverheated, itemPrice, missionReward, missionUnlocked, nodeConnectLevel, opTime, reqLines, toolLv, usedMB, storageCapMB, ramMB } from './derived';
import { HW_LABEL, HW_TABLES } from './data/hardware';
import { audio } from './audio';
import { baseOf, isValidName, joinPath, moveEntry, parentOf, removeRecursive, resolvePath, uniqueName } from './fsops';
import { setLang } from '../i18n';

// ---------------------------------------------------------------- tipos
export interface MgResult { win: boolean; score: number; errors: number; hints: number; note?: string }
export interface MgSession { ch: ChallengeDef; resolve: (r: MgResult) => void; source: string }
export interface Toast { id: number; kind: Notif['kind']; title: string; body?: string }
export interface SaveMeta { slot: string; name: string; level: number; money: number; rep: number; savedAt: number; playSeconds: number; missions: number }
export type Phase = 'boot' | 'menu' | 'intro' | 'game';

const DEFAULT_SETTINGS: Settings = {
  sfxVolume: 0.6, musicVolume: 0.35, music: false, sfx: true, fx: true, glow: true, animations: true, typing: true,
  theme: 'matrix', lang: 'pt-BR', termSpeed: 2, reduceMotion: false,
};

const SETTINGS_KEY = 'hs_settings_v1';
const saveKey = (slot: string) => `hs_save_v1_${slot}`;
export const SLOTS = ['auto', '1', '2', '3'];

function safeGet(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function safeSet(k: string, v: string): boolean {
  try { localStorage.setItem(k, v); return true; } catch { return false; }
}
function safeDel(k: string) {
  try { localStorage.removeItem(k); } catch { /* noop */ }
}

export function loadSettings(): Settings {
  try {
    const raw = safeGet(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* noop */ }
  return { ...DEFAULT_SETTINGS };
}

export function listSaves(): SaveMeta[] {
  const out: SaveMeta[] = [];
  for (const slot of SLOTS) {
    const raw = safeGet(saveKey(slot));
    if (!raw) continue;
    try {
      const p = JSON.parse(raw);
      const d = p.data as GameData;
      out.push({ slot, name: d.name, level: d.level, money: d.money, rep: d.rep, savedAt: d.savedAt, playSeconds: d.stats?.playSeconds ?? 0, missions: d.stats?.missionsDone ?? 0 });
    } catch { /* corrompido */ }
  }
  return out;
}

export function migrate(raw: any): GameData | null {
  if (!raw || typeof raw !== 'object' || !raw.name) return null;
  const base = newGameData(String(raw.name));
  const d: GameData = { ...base, ...raw, stats: { ...base.stats, ...(raw.stats || {}), mgWon: { ...(raw.stats?.mgWon || {}) } }, hw: { ...base.hw, ...(raw.hw || {}) }, skills: { ...base.skills, ...(raw.skills || {}) }, v: SAVE_VERSION };
  return d;
}

let termId = 1;
let toastId = 1;
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const MAX_TERM = 700;
const SKILL_DONE_NOTE = 'skill';
void SKILL_DONE_NOTE;

// ---------------------------------------------------------------- store
interface Store {
  phase: Phase;
  data: GameData | null;
  screen: ScreenId;
  settings: Settings;
  term: TermLine[];
  termBusy: boolean;
  mg: MgSession | null;
  pendingEvent: { id: string; payload?: any } | null;
  toasts: Toast[];
  metrics: { cpu: number[]; ram: number[]; net: number[]; temp: number };
  selectedNode: string | null;
  nextEventAt: number;
  dirty: boolean;
  lastSaveAt: number;
  helpFocus: string | null;

  // fluxo
  setPhase: (p: Phase) => void;
  setScreen: (s: ScreenId) => void;
  selectNode: (id: string | null) => void;
  newGame: (name: string) => void;
  loadSlot: (slot: string) => boolean;
  saveSlot: (slot: string) => boolean;
  deleteSlot: (slot: string) => void;
  exportSave: () => string | null;
  importSave: (json: string) => boolean;
  quitToMenu: () => void;
  updateSettings: (p: Partial<Settings>) => void;

  // terminal
  print: (kind: TermKind, text: string, prompt?: string) => void;
  clearTerm: () => void;
  setBusy: (b: boolean) => void;
  wait: (ms: number) => Promise<void>;
  recordCommand: (line: string) => void;

  // dados
  patch: (fn: (d: GameData) => Partial<GameData>) => void;
  notify: (kind: Notif['kind'], title: string, body?: string, silent?: boolean) => void;
  feed: (kind: FeedLine['kind'], text: string) => void;
  dismissToast: (id: number) => void;
  markNotifsRead: () => void;

  // economia / progressão
  addMoney: (n: number, track?: boolean) => void;
  spend: (n: number) => boolean;
  gainXp: (n: number) => void;
  addRep: (n: number) => void;
  spendSkill: (id: keyof GameData['skills']) => boolean;
  checkAchievements: () => void;
  buy: (itemId: string) => { ok: boolean; msg: string };
  equip: (itemId: string) => void;
  repair: () => { ok: boolean; msg: string };

  // arquivos
  mkdir: (path: string) => { ok: boolean; msg: string };
  writeFile: (path: string, content: string, extra?: any) => { ok: boolean; msg: string };
  removePath: (path: string) => { ok: boolean; msg: string };
  renamePath: (path: string, newName: string) => { ok: boolean; msg: string };
  movePath: (path: string, destDir: string) => { ok: boolean; msg: string };
  setCwd: (p: string) => void;
  setNode: (n: string | null) => void;
  discover: (ids: string[], announce?: boolean) => void;
  markScanned: (id: string) => void;
  markInspected: (id: string) => void;

  // missões
  emit: (e: GameEvent) => void;
  startMission: (id: string) => { ok: boolean; msg: string };
  abandonMission: () => void;
  failMission: (reason: string) => void;
  completeMission: () => void;
  addMissionErrors: (n: number) => void;

  // minigames
  startMinigame: (chId: string, source?: string) => Promise<MgResult> | null;
  finishMinigame: (r: MgResult) => void;

  // contatos
  deliver: (nodeId: string) => void;
  choose: (contactId: string, idx: number) => void;
  markRead: (contactId: string) => void;
  setFlag: (k: string, v: boolean | string | number) => void;

  // tick / eventos
  tick: () => void;
  respondEvent: (choice: string) => void;
}

export const useGame = create<Store>((set, get) => ({
  phase: 'boot',
  data: null,
  screen: 'dashboard',
  settings: loadSettings(),
  term: [],
  termBusy: false,
  mg: null,
  pendingEvent: null,
  toasts: [],
  metrics: { cpu: Array(40).fill(8), ram: Array(40).fill(30), net: Array(40).fill(2), temp: 42 },
  selectedNode: null,
  nextEventAt: Date.now() + 120000,
  dirty: false,
  lastSaveAt: 0,
  helpFocus: null,

  // ---------------------------------------------------------- fluxo
  setPhase: (phase) => set({ phase }),
  setScreen: (screen) => { audio.play('click'); set({ screen }); },
  selectNode: (selectedNode) => set({ selectedNode }),

  newGame: (name) => {
    const d = newGameData(name.trim() || 'Operador');
    set({ data: d, term: [], screen: 'dashboard', phase: 'game', mg: null, pendingEvent: null, nextEventAt: Date.now() + 150000 });
    const s = get();
    s.print('sys', 'CyberCore OS 1.2 — sessão iniciada.');
    s.print('info', 'Digite "help" para ver os comandos disponíveis.');
    s.feed('info', `Perfil criado: ${d.name}`);
    s.deliver('intro_unknown');
    get().saveSlot('auto');
  },

  loadSlot: (slot) => {
    const raw = safeGet(saveKey(slot));
    if (!raw) return false;
    try {
      const d = migrate(JSON.parse(raw).data);
      if (!d) return false;
      set({ data: d, term: [], screen: 'dashboard', phase: 'game', mg: null, pendingEvent: null, nextEventAt: Date.now() + 120000 });
      const s = get();
      s.print('sys', `Perfil carregado: ${d.name} (nível ${d.level}).`);
      s.print('info', 'Digite "help" para ver os comandos.');
      return true;
    } catch { return false; }
  },

  saveSlot: (slot) => {
    const d = get().data;
    if (!d) return false;
    const copy: GameData = { ...d, savedAt: Date.now() };
    const ok = safeSet(saveKey(slot), JSON.stringify({ v: SAVE_VERSION, data: copy }));
    if (ok) set({ lastSaveAt: Date.now(), dirty: false });
    return ok;
  },

  deleteSlot: (slot) => safeDel(saveKey(slot)),

  exportSave: () => {
    const d = get().data;
    return d ? JSON.stringify({ app: 'hacker-simulator', v: SAVE_VERSION, data: { ...d, savedAt: Date.now() } }, null, 2) : null;
  },

  importSave: (json) => {
    try {
      const p = JSON.parse(json);
      const d = migrate(p.data ?? p);
      if (!d) return false;
      set({ data: d, term: [], screen: 'dashboard', phase: 'game', mg: null, pendingEvent: null });
      get().saveSlot('auto');
      get().print('ok', 'Save importado com sucesso.');
      return true;
    } catch { return false; }
  },

  quitToMenu: () => {
    get().saveSlot('auto');
    set({ phase: 'menu', mg: null });
  },

  updateSettings: (p) => {
    const settings = { ...get().settings, ...p };
    set({ settings });
    safeSet(SETTINGS_KEY, JSON.stringify(settings));
    audio.configure({ sfx: settings.sfx, sfxVolume: settings.sfxVolume, music: settings.music, musicVolume: settings.musicVolume });
    setLang(settings.lang);
  },

  // ---------------------------------------------------------- terminal
  print: (kind, text, prompt) =>
    set((s) => {
      const lines = text.split('\n').map((t) => ({ id: termId++, kind, text: t, prompt }));
      const term = [...s.term, ...lines];
      return { term: term.length > MAX_TERM ? term.slice(term.length - MAX_TERM) : term };
    }),
  clearTerm: () => set({ term: [] }),
  setBusy: (termBusy) => set({ termBusy }),
  wait: (ms) => new Promise((r) => setTimeout(r, ms)),
  recordCommand: (line) => {
    get().patch((d) => ({ history: [...d.history.filter((h) => h !== line), line].slice(-120), stats: { ...d.stats, commands: d.stats.commands + 1 } }));
    get().checkAchievements();
  },

  // ---------------------------------------------------------- dados
  patch: (fn) => {
    const d = get().data;
    if (!d) return;
    set({ data: { ...d, ...fn(d) }, dirty: true });
  },

  notify: (kind, title, body, silent) => {
    const n: Notif = { id: uid(), kind, title, body, ts: get().data?.minutes ?? 0, read: false };
    get().patch((d) => ({ notifs: [n, ...d.notifs].slice(0, 60) }));
    const toast: Toast = { id: toastId++, kind, title, body };
    set((s) => ({ toasts: [...s.toasts, toast].slice(-4) }));
    setTimeout(() => get().dismissToast(toast.id), 5200);
    if (!silent) audio.play(kind === 'err' ? 'error' : kind === 'warn' ? 'alert' : kind === 'unlock' ? 'unlock' : kind === 'ok' ? 'success' : 'notify');
  },
  feed: (kind, text) => {
    const l: FeedLine = { id: uid(), ts: get().data?.minutes ?? 0, kind, text };
    get().patch((d) => ({ feed: [l, ...d.feed].slice(0, 80) }));
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markNotifsRead: () => get().patch((d) => ({ notifs: d.notifs.map((n) => ({ ...n, read: true })) })),

  // ---------------------------------------------------------- economia
  addMoney: (n, track = true) =>
    get().patch((d) => ({ money: Math.max(0, d.money + n), stats: track && n > 0 ? { ...d.stats, moneyEarned: d.stats.moneyEarned + n } : d.stats })),
  spend: (n) => {
    const d = get().data;
    if (!d || d.money < n) return false;
    get().patch((x) => ({ money: x.money - n, stats: { ...x.stats, moneySpent: x.stats.moneySpent + n } }));
    return true;
  },
  gainXp: (n) => {
    if (n <= 0) return;
    let leveled = 0;
    get().patch((d) => {
      let { xp, level, skillPoints } = d;
      xp += n;
      while (level < MAX_LEVEL && xp >= xpToNext(level)) {
        xp -= xpToNext(level);
        level++;
        skillPoints++;
        leveled = level;
      }
      if (level >= MAX_LEVEL) xp = Math.min(xp, xpToNext(MAX_LEVEL) - 1);
      return { xp, level, skillPoints };
    });
    if (leveled) {
      audio.play('level');
      get().notify('unlock', `Nível ${leveled}!`, '+1 ponto de habilidade disponível.', true);
      get().feed('ok', `Subiu para o nível ${leveled}.`);
    }
    get().checkAchievements();
  },
  addRep: (n) => {
    const before = repRank(get().data?.rep ?? 0).name;
    get().patch((d) => ({ rep: Math.max(0, Math.min(REP_MAX, d.rep + n)) }));
    const after = repRank(get().data?.rep ?? 0).name;
    if (after !== before) {
      get().notify(n > 0 ? 'unlock' : 'warn', n > 0 ? `Nova reputação: ${after}` : `Reputação reduzida: ${after}`, undefined, false);
      get().feed(n > 0 ? 'ok' : 'warn', `Reputação: ${after}`);
    }
    get().checkAchievements();
  },
  spendSkill: (id) => {
    const d = get().data;
    if (!d) return false;
    const rank = d.skills[id];
    const cost = skillCost(rank);
    if (rank >= 5 || d.skillPoints < cost) return false;
    get().patch((x) => ({ skills: { ...x.skills, [id]: rank + 1 }, skillPoints: x.skillPoints - cost }));
    audio.play('unlock');
    if (rank + 1 === 5) get().notify('unlock', `Especialização: ${SKILL_MAP[id].spec}`, SKILL_MAP[id].specDesc);
    else get().notify('ok', `${SKILL_MAP[id].name} → rank ${rank + 1}`, SKILL_MAP[id].ranks[rank], true);
    return true;
  },
  checkAchievements: () => {
    const d = get().data;
    if (!d) return;
    const fresh = ACHIEVEMENTS.filter((a) => !d.ach[a.id] && a.check(d));
    if (!fresh.length) return;
    get().patch((x) => {
      const ach = { ...x.ach };
      fresh.forEach((a) => (ach[a.id] = Date.now()));
      return { ach };
    });
    fresh.forEach((a) => {
      get().notify('unlock', `Conquista: ${a.name}`, a.desc);
      get().feed('ok', `Conquista desbloqueada: ${a.name}`);
      if (a.reward.money) get().addMoney(a.reward.money);
      if (a.reward.xp) get().gainXp(a.reward.xp);
    });
  },

  buy: (itemId) => {
    const d = get().data;
    const item = SHOP_MAP[itemId];
    if (!d || !item) return { ok: false, msg: 'Item inexistente.' };
    if (item.levelReq && d.level < item.levelReq) return { ok: false, msg: `Requer nível ${item.levelReq}.` };
    if (item.repReq && d.rep < item.repReq) return { ok: false, msg: `Requer reputação ${item.repReq}.` };
    if (item.once && d.inv.includes(item.id)) return { ok: false, msg: 'Você já possui este item.' };
    if (item.kind === 'hw' && item.hw) {
      const cur = d.hw[item.hw.slot];
      if (item.hw.tier <= cur) return { ok: false, msg: 'Você já possui este componente ou superior.' };
      if (item.hw.tier !== cur + 1) return { ok: false, msg: 'Compre o nível anterior primeiro.' };
    }
    let toolDef: any = null;
    if (item.kind === 'tool' && item.toolId) {
      toolDef = TOOL_MAP[item.toolId];
      const lv = toolLv(d, item.toolId);
      if (lv >= toolDef.maxLevel) return { ok: false, msg: 'Ferramenta já está no nível máximo.' };
      if (d.hw.os < toolDef.osReq) return { ok: false, msg: `Requer SO nível ${toolDef.osReq}: atualize no Computador.` };
      if (d.hw.ram < toolDef.ramReq) return { ok: false, msg: 'Requer mais memória RAM instalada.' };
      if (d.level < toolDef.levelReq && lv === 0) return { ok: false, msg: `Requer nível ${toolDef.levelReq}.` };
    }
    const price = itemPrice(d, item);
    if (d.money < price) return { ok: false, msg: `Créditos insuficientes (faltam ${price - d.money}).` };
    if (!get().spend(price)) return { ok: false, msg: 'Falha ao pagar.' };

    if (item.kind === 'hw' && item.hw) {
      get().patch((x) => ({ hw: { ...x.hw, [item.hw!.slot]: item.hw!.tier }, inv: [...x.inv, item.id] }));
    } else if (item.kind === 'tool' && item.toolId) {
      get().patch((x) => ({ tools: { ...x.tools, [item.toolId!]: toolLv(x, item.toolId!) + 1 }, stats: { ...x.stats, toolsBought: x.stats.toolsBought + 1 } }));
    } else if (item.kind === 'course') {
      const pts = item.id.startsWith('course_master2') ? 3 : item.id.startsWith('course_master') ? 2 : 1;
      get().patch((x) => ({ inv: [...x.inv, item.id], skillPoints: x.skillPoints + pts }));
    } else {
      get().patch((x) => ({ inv: [...x.inv, item.id] }));
      if (item.effect?.prompt) get().patch(() => ({ promptName: String(item.effect!.prompt) }));
      if (item.effect?.title) get().patch(() => ({ title: String(item.effect!.title) }));
    }
    get().emit({ type: 'buy', ref: itemId });
    get().notify('ok', `Compra: ${item.name}`, `-${price} cr`, true);
    audio.play('success');
    get().feed('ok', `Comprou ${item.name} por ${price} cr.`);
    get().checkAchievements();
    get().saveSlot('auto');
    return { ok: true, msg: `${item.name} adquirido.` };
  },

  equip: (itemId) => {
    const item = SHOP_MAP[itemId];
    const d = get().data;
    if (!item || !d || !d.inv.includes(itemId)) return;
    if (item.effect?.prompt) get().patch(() => ({ promptName: String(item.effect!.prompt) }));
    if (item.effect?.title) get().patch(() => ({ title: String(item.effect!.title) }));
    get().notify('info', `Equipado: ${item.name}`, undefined, true);
  },

  repair: () => {
    const d = get().data;
    if (!d) return { ok: false, msg: '' };
    if (!isOverheated(d)) return { ok: false, msg: 'Nenhum problema de hardware ativo.' };
    if (!get().spend(60)) return { ok: false, msg: 'Reparo custa 60 cr.' };
    get().patch(() => ({ overheatUntil: 0 }));
    get().notify('ok', 'Equipamento reparado', 'Temperatura normalizada.', true);
    return { ok: true, msg: 'Resfriamento reiniciado. Velocidade restaurada.' };
  },

  // ---------------------------------------------------------- arquivos
  mkdir: (path) => {
    const d = get().data!;
    if (d.fs[path]) return { ok: false, msg: 'Já existe um item com esse nome.' };
    const parent = parentOf(path);
    if (!d.fs[parent] || d.fs[parent].type !== 'dir') return { ok: false, msg: 'Diretório pai inexistente.' };
    if (!isValidName(baseOf(path))) return { ok: false, msg: 'Nome inválido.' };
    get().patch((x) => ({ fs: { ...x.fs, [path]: { type: 'dir', name: baseOf(path), size: 0, created: Date.now() } }, stats: { ...x.stats, filesCreated: x.stats.filesCreated + 1 } }));
    return { ok: true, msg: 'Pasta criada.' };
  },
  writeFile: (path, content, extra = {}) => {
    const d = get().data!;
    const parent = parentOf(path);
    if (!d.fs[parent] || d.fs[parent].type !== 'dir') return { ok: false, msg: 'Diretório pai inexistente.' };
    if (!isValidName(baseOf(path))) return { ok: false, msg: 'Nome inválido.' };
    const exists = d.fs[path];
    if (exists?.type === 'dir') return { ok: false, msg: 'Já existe uma pasta com esse nome.' };
    if (exists?.readonly) return { ok: false, msg: 'Arquivo somente leitura.' };
    const size = extra.size ?? Math.max(1, Math.ceil(content.length / 80));
    const kb = size - (exists?.size ?? 0);
    if (kb > 0 && kb / 1024 > Math.max(0, storageCapMB(d) - usedMB(d))) return { ok: false, msg: 'Armazenamento insuficiente. Apague arquivos ou compre um disco maior.' };
    get().patch((x) => ({
      fs: { ...x.fs, [path]: { type: 'file', name: baseOf(path), content, size, created: exists?.created ?? Date.now(), ...extra } },
      stats: exists ? x.stats : { ...x.stats, filesCreated: x.stats.filesCreated + 1 },
    }));
    return { ok: true, msg: 'Arquivo salvo.' };
  },
  removePath: (path) => {
    const d = get().data!;
    const e = d.fs[path];
    if (!e) return { ok: false, msg: 'Item inexistente.' };
    if (e.readonly || ['/', '/home', '/home/user', '/home/user/documents', '/home/user/downloads', '/home/user/reports', '/home/user/notes'].includes(path)) return { ok: false, msg: 'Item protegido pelo sistema.' };
    get().patch((x) => ({ fs: removeRecursive(x.fs, path) }));
    return { ok: true, msg: 'Removido.' };
  },
  renamePath: (path, newName) => {
    const d = get().data!;
    if (!d.fs[path] || d.fs[path].readonly) return { ok: false, msg: 'Não é possível renomear.' };
    if (!isValidName(newName)) return { ok: false, msg: 'Nome inválido.' };
    const to = joinPath(parentOf(path), newName);
    if (d.fs[to]) return { ok: false, msg: 'Já existe um item com esse nome.' };
    get().patch((x) => ({ fs: moveEntry(x.fs, path, to) }));
    return { ok: true, msg: 'Renomeado.' };
  },
  movePath: (path, destDir) => {
    const d = get().data!;
    const e = d.fs[path];
    if (!e || e.readonly) return { ok: false, msg: 'Não é possível mover.' };
    if (!d.fs[destDir] || d.fs[destDir].type !== 'dir') return { ok: false, msg: 'Destino inválido.' };
    if (destDir === path || destDir.startsWith(path + '/')) return { ok: false, msg: 'Destino dentro da própria pasta.' };
    const to = joinPath(destDir, baseOf(path));
    if (d.fs[to]) return { ok: false, msg: 'Já existe um item com esse nome no destino.' };
    get().patch((x) => ({ fs: moveEntry(x.fs, path, to) }));
    return { ok: true, msg: 'Movido.' };
  },
  setCwd: (p) => get().patch(() => ({ cwd: p })),
  setNode: (n) => get().patch(() => ({ node: n })),
  discover: (ids, announce = true) => {
    const d = get().data!;
    const fresh = ids.filter((i) => NODE_MAP[i] && !d.discovered.includes(i));
    if (!fresh.length) return;
    get().patch((x) => ({ discovered: [...x.discovered, ...fresh] }));
    if (announce) fresh.forEach((i) => { get().notify('unlock', 'Novo nó descoberto', `${NODE_MAP[i].name} (${i})`); get().feed('info', `Nó descoberto: ${i}`); });
  },
  markScanned: (id) => get().patch((d) => ({ scanned: { ...d.scanned, [id]: toolLv(d, 'cyberscan') } })),
  markInspected: (id) => get().patch((d) => ({ inspected: d.inspected.includes(id) ? d.inspected : [...d.inspected, id] })),

  // ---------------------------------------------------------- missões
  emit: (e) => {
    const d = get().data;
    if (!d || !d.active) return;
    const rec = d.missions[d.active];
    const def = getMission(d, d.active);
    if (!rec || !def || rec.status !== 'active') return;
    const obj = def.objectives[rec.objIdx];
    if (!obj) return;
    const m = obj.match;
    if (m.type !== e.type) return;
    if (m.target !== undefined && m.target !== e.target) return;
    if (m.ref !== undefined && m.ref !== e.ref) return;
    if (e.type === 'mg' && !e.win) return;
    const nextIdx = rec.objIdx + 1;
    get().patch((x) => ({ missions: { ...x.missions, [def.id]: { ...rec, objIdx: nextIdx } } }));
    if (obj.match.type !== 'submit') {
      get().notify('ok', 'Objetivo concluído', obj.text, true);
      audio.play('success');
      get().feed('ok', `[${def.id}] ${obj.text}`);
    }
    if (obj.match.type === 'submit' || nextIdx >= def.objectives.length) {
      get().completeMission();
      return;
    }
    const nxt = def.objectives[nextIdx];
    if (nxt.match.type === 'choice' && nxt.match.ref) get().deliver(nxt.match.ref);
  },

  startMission: (id) => {
    const d = get().data;
    const def = getMission(d, id);
    if (!d || !def) return { ok: false, msg: 'Missão inexistente.' };
    if (d.active) return { ok: false, msg: `Você já tem a missão ${d.active} ativa.` };
    if (d.missions[id]?.status === 'completed') return { ok: false, msg: 'Missão já concluída.' };
    if (!missionUnlocked(d, def)) return { ok: false, msg: 'Requisitos não cumpridos.' };
    const prev = d.missions[id];
    const rec = { status: 'active' as const, objIdx: 0, errors: 0, attempts: (prev?.attempts ?? 0) + 1, startedAt: Date.now(), deadline: def.timeLimit ? Date.now() + def.timeLimit * 1000 : undefined };
    get().patch((x) => ({ active: id, missions: { ...x.missions, [id]: rec } }));
    get().notify('info', `Missão iniciada: ${def.title}`, def.objectives[0].text, true);
    audio.play('notify');
    get().feed('info', `Missão aceita: ${id} — ${def.title}`);
    get().print('sys', `[MISSÃO] ${id} — ${def.title} iniciada.`);
    get().print('info', `[OBJETIVO] ${def.objectives[0].text}`);
    const first = def.objectives[0];
    if (first.match.type === 'choice' && first.match.ref) get().deliver(first.match.ref);
    return { ok: true, msg: 'Missão iniciada.' };
  },

  abandonMission: () => {
    const d = get().data;
    if (!d?.active) return;
    const def = getMission(d, d.active);
    const rec = d.missions[d.active];
    const progressed = (rec?.objIdx ?? 0) > 0;
    get().patch((x) => {
      const missions = { ...x.missions };
      if (def?.generated) delete missions[d.active!]; else missions[d.active!] = { ...rec, status: 'failed' };
      const contracts = def?.generated ? x.contracts.filter((c) => c.mission.id !== d.active) : x.contracts;
      return { active: null, missions, contracts };
    });
    if (progressed) get().addRep(-2);
    get().notify('warn', 'Missão abandonada', def?.title, true);
    get().feed('warn', `Missão ${def?.id} abandonada.`);
  },

  failMission: (reason) => {
    const d = get().data;
    if (!d?.active) return;
    const def = getMission(d, d.active);
    if (!def) return;
    const rec = d.missions[d.active];
    const loss = Math.max(2, Math.round(def.reward.rep * 0.5 * (d.inv.includes('sw_vpn') ? 0.7 : 1)));
    get().patch((x) => {
      const missions = { ...x.missions };
      if (def.generated) delete missions[def.id]; else missions[def.id] = { ...rec, status: 'failed' };
      return {
        active: null, missions,
        contracts: def.generated ? x.contracts.filter((c) => c.mission.id !== def.id) : x.contracts,
        stats: { ...x.stats, missionsFailed: x.stats.missionsFailed + 1 },
      };
    });
    get().addRep(-loss);
    get().notify('err', `Missão falhou: ${def.title}`, `${reason} (−${loss} reputação)`);
    get().feed('err', `${def.id} falhou: ${reason}`);
    get().print('err', `[MISSÃO] ${def.id} falhou: ${reason}`);
    get().print('dim', def.consequences.failure);
  },

  completeMission: () => {
    const d = get().data;
    if (!d?.active) return;
    const def = getMission(d, d.active);
    const rec = d.missions[d.active];
    if (!def || !rec) return;
    const perfect = rec.errors === 0;
    const payout = missionReward(d, def, rec.attempts, perfect);
    const xp = Math.round(def.reward.xp * (perfect ? 1.1 : 1));
    const repGain = def.reward.rep + (perfect && def.reward.rep > 0 ? 3 : 0);
    const oc = def.onComplete;
    const stamp = fmtGameTime(d.minutes);
    const report =
      `RELATÓRIO DE MISSÃO ${def.id}\n==========================\nTítulo: ${def.title}\nCliente: ${def.client}${def.org ? ` (${def.org})` : ''}\nDificuldade: ${def.difficulty}\nData: ${stamp.date} ${stamp.time}\n\n` +
      `Objetivos cumpridos:\n${def.objectives.map((o) => ` [x] ${o.text}`).join('\n')}\n\nErros: ${rec.errors}${perfect ? ' (execução perfeita!)' : ''}\nRecompensa: ${payout} cr · ${xp} XP · ${repGain >= 0 ? '+' : ''}${repGain} rep\n\nResultado: ${def.consequences.success}\n`;
    const rpath = '/home/user/reports/relatorio_' + def.id + '.txt';
    get().patch((x) => {
      const missions = { ...x.missions, [def.id]: { ...rec, status: 'completed' as const, completedAt: Date.now(), payout, perfect } };
      const fs = { ...x.fs };
      if (!fs[rpath]) fs[rpath] = { type: 'file', name: baseOf(rpath), content: report, size: 3, created: Date.now() };
      (oc?.files || []).forEach((f) => (fs[f.path] = { type: 'file', name: f.name, content: f.content, size: 2, created: Date.now() }));
      const flags = { ...x.flags, ...(oc?.flags || {}) };
      return {
        active: null, missions, fs, flags,
        contracts: x.contracts.filter((c) => c.mission.id !== def.id),
        offered: [...x.offered, ...(oc?.offer || [])],
        contactsUnlocked: [...new Set([...x.contactsUnlocked, ...(oc?.unlockContacts || [])])],
        stats: { ...x.stats, missionsDone: x.stats.missionsDone + 1, perfectMissions: x.stats.perfectMissions + (perfect ? 1 : 0) },
      };
    });
    get().addMoney(payout);
    get().gainXp(xp);
    get().addRep(repGain);
    audio.play('success');
    get().notify('ok', `Missão concluída: ${def.title}`, `+${payout} cr · +${xp} XP`, true);
    get().feed('ok', `${def.id} concluída. +${payout} cr.`);
    get().print('ok', `[MISSÃO] ${def.id} concluída! +${payout} cr · +${xp} XP · ${repGain >= 0 ? '+' : ''}${repGain} rep`);
    get().print('dim', def.consequences.success);
    get().print('dim', 'Relatório salvo em ~/reports/relatorio_' + def.id + '.txt');
    if (oc?.reveal?.length) get().discover(oc.reveal);
    oc?.messages?.forEach((m) => get().deliver(m.node));
    get().checkAchievements();
    get().saveSlot('auto');
  },

  addMissionErrors: (n) => {
    const d = get().data;
    if (!d?.active || n <= 0) return;
    const rec = d.missions[d.active];
    const def = getMission(d, d.active);
    if (!rec || !def) return;
    const errors = rec.errors + n;
    get().patch((x) => ({ missions: { ...x.missions, [d.active!]: { ...rec, errors } } }));
    if (def.maxErrors && errors > def.maxErrors) get().failMission('limite de erros excedido');
  },

  // ---------------------------------------------------------- minigames
  startMinigame: (chId, source = 'terminal') => {
    const d = get().data;
    const ch = resolveChallenge(chId);
    if (!d || !ch || get().mg) return null;
    return new Promise<MgResult>((resolve) => {
      set({ mg: { ch, resolve, source } });
      audio.play('scan');
    });
  },

  finishMinigame: (r) => {
    const s = get();
    const sess = s.mg;
    const d = s.data;
    if (!sess || !d) return;
    const ch = sess.ch;
    const done = d.chDone[ch.id];
    const first = !done;
    const gen = !!ch.contract;
    let money = 0, xp = 0;
    if (r.win && !gen) {
      const scale = 0.55 + (r.score / 100) * 0.45;
      const rep = first ? 1 : 0.35;
      const spec = { cipher: 'crypto', logs: 'analysis', pattern: 'analysis', investigation: 'forensics', firewall: 'security', auth: 'security', resources: 'infra' }[ch.mg] as keyof GameData['skills'];
      let mult = scale * rep;
      if (d.skills[spec] >= 5) mult *= 1.2;
      if (ch.mg === 'cipher' && toolLv(d, 'cryptlab') >= 4) mult *= 1.15;
      if ((ch.mg === 'logs' || ch.mg === 'pattern') && d.skills.analysis >= 4) mult *= 1.1;
      money = Math.round(ch.reward.money * mult);
      xp = Math.round(ch.reward.xp * mult);
    } else if (r.win && gen) {
      xp = Math.round(ch.reward.xp * 0.3);
    } else {
      xp = Math.round(ch.reward.xp * 0.1);
    }
    s.patch((x) => ({
      chDone: r.win ? { ...x.chDone, [ch.id]: { best: Math.max(done?.best ?? 0, r.score), count: (done?.count ?? 0) + 1 } } : x.chDone,
      stats: {
        ...x.stats,
        mgPlayed: x.stats.mgPlayed + 1,
        errors: x.stats.errors + r.errors,
        mgWon: r.win ? { ...x.stats.mgWon, [ch.mg]: (x.stats.mgWon[ch.mg] || 0) + 1 } : x.stats.mgWon,
        analysisWon: x.stats.analysisWon + (r.win && ['logs', 'investigation', 'pattern'].includes(ch.mg) ? 1 : 0),
      },
    }));
    if (money) s.addMoney(money);
    if (xp) s.gainXp(xp);
    if (ch.id === 'ch_inv_ghost' && r.win) s.discover(['ghost-safehouse']);
    s.print(r.win ? 'ok' : 'err', `[DESAFIO] ${ch.name}: ${r.win ? 'SUCESSO' : 'FALHA'} · pontuação ${r.score}${money ? ` · +${money} cr` : ''}${xp ? ` · +${xp} XP` : ''}`);
    s.addMissionErrors(r.errors);
    s.emit({ type: 'mg', ref: ch.id, win: r.win });
    set({ mg: null });
    sess.resolve(r);
    s.checkAchievements();
    s.saveSlot('auto');
  },

  // ---------------------------------------------------------- contatos
  deliver: (nodeId) => {
    let id = nodeId;
    const d0 = get().data;
    if (!d0) return;
    if (id === 'epilogue') id = 'epilogue_' + (d0.flags.ending || 'authorities');
    const node = DIALOGUE_MAP[id];
    if (!node) return;
    const contact = node.contact;
    // se já há uma escolha pendente e este nó também exige escolha, enfileira
    if (node.choices && d0.pending[contact]) {
      const q = String(d0.flags['q_' + contact] || '');
      get().patch((x) => ({ flags: { ...x.flags, ['q_' + contact]: q ? q + ',' + id : id } }));
      return;
    }
    const msg: Msg = { id: uid(), from: 'them', text: node.text, ts: d0.minutes, read: get().screen === 'contacts' && get().helpFocus === contact };
    get().patch((x) => ({
      threads: { ...x.threads, [contact]: [...(x.threads[contact] || []), msg] },
      pending: { ...x.pending, [contact]: node.choices ? id : null },
      contactsUnlocked: x.contactsUnlocked.includes(contact) ? x.contactsUnlocked : [...x.contactsUnlocked, contact],
    }));
    const name = contact === 'morpheus' && !d0.flags.morpheus_revealed ? 'Remetente anônimo' : CONTACT_MAP[contact].name;
    get().notify('msg', `Mensagem de ${name}`, node.text.slice(0, 80) + (node.text.length > 80 ? '…' : ''));
    if (node.auto) get().deliver(node.auto);
    else if (!node.choices) {
      const q = String(get().data!.flags['q_' + contact] || '');
      if (q && !get().data!.pending[contact]) {
        const [first, ...rest] = q.split(',');
        get().patch((x) => ({ flags: { ...x.flags, ['q_' + contact]: rest.join(',') } }));
        get().deliver(first);
      }
    }
  },

  choose: (contactId, idx) => {
    const d = get().data;
    if (!d) return;
    const nodeId = d.pending[contactId];
    const node = nodeId ? DIALOGUE_MAP[nodeId] : null;
    const ch = node?.choices?.[idx];
    if (!node || !ch) return;
    const me: Msg = { id: uid(), from: 'me', text: ch.reply ?? ch.text, ts: d.minutes, read: true };
    get().patch((x) => ({
      threads: { ...x.threads, [contactId]: [...(x.threads[contactId] || []), me] },
      pending: { ...x.pending, [contactId]: null },
      flags: { ...x.flags, ...(ch.flags || {}) },
      offered: [...x.offered, ...(ch.offer || []).filter((o) => !x.offered.includes(o))],
      trust: { ...x.trust, [contactId]: (x.trust[contactId] || 0) + (ch.trust || 0) },
      choices: { ...x.choices, [node.id]: ch.choiceId || String(idx) },
    }));
    audio.play('click');
    if (ch.money) get().addMoney(ch.money);
    if (ch.rep) get().addRep(ch.rep);
    if (ch.reveal) get().discover(ch.reveal);
    if (ch.offer?.length) get().notify('unlock', 'Nova missão disponível', ch.offer.join(', '));
    get().emit({ type: 'choice', ref: node.id });
    if (ch.choiceId) get().emit({ type: 'choice', ref: ch.choiceId });
    if (ch.next) setTimeout(() => get().deliver(ch.next!), 900);
    else {
      const q = String(get().data!.flags['q_' + contactId] || '');
      if (q) {
        const [first, ...rest] = q.split(',');
        get().patch((x) => ({ flags: { ...x.flags, ['q_' + contactId]: rest.join(',') } }));
        setTimeout(() => get().deliver(first), 900);
      }
    }
    get().saveSlot('auto');
  },

  markRead: (contactId) => {
    get().patch((x) => ({ threads: { ...x.threads, [contactId]: (x.threads[contactId] || []).map((m) => (m.read ? m : { ...m, read: true })) } }));
  },
  setFlag: (k, v) => get().patch((x) => ({ flags: { ...x.flags, [k]: v } })),

  // ---------------------------------------------------------- tick
  tick: () => {
    const s = get();
    const d = s.data;
    if (!d || s.phase !== 'game') return;
    const now = Date.now();
    // relógio e estatísticas
    const busy = s.termBusy || !!s.mg;
    const cpuLoad = Math.min(98, (busy ? 55 : 6) + Math.random() * (busy ? 30 : 10));
    const ramUse = Math.min(97, (([350, 500, 700, 900][d.hw.os] + (busy ? 500 : 150) + Math.random() * 90) / ramMB(d)) * 100);
    const netUse = busy ? 10 + Math.random() * 60 : 1 + Math.random() * 6;
    const temp = 36 + cpuLoad * 0.33 + (isOverheated(d) ? 22 : 0) - (d.inv.includes('up_cooling') ? 10 : 0);
    const m = s.metrics;
    set({ metrics: { cpu: [...m.cpu.slice(1), cpuLoad], ram: [...m.ram.slice(1), ramUse], net: [...m.net.slice(1), netUse], temp } });
    s.patch((x) => ({ minutes: x.minutes + 1, stats: { ...x.stats, playSeconds: x.stats.playSeconds + 1 } }));

    // prazo da missão ativa
    if (d.active) {
      const rec = d.missions[d.active];
      if (rec?.deadline && now > rec.deadline) s.failMission('o tempo acabou');
    }
    // contratos expirados
    const live = d.contracts.filter((c) => c.expiresAt > now || c.mission.id === d.active);
    if (live.length !== d.contracts.length) s.patch(() => ({ contracts: live }));
    // reposição do quadro de contratos
    const base = live.filter((c) => !c.mission.id.startsWith('S-'));
    if (d.stats.missionsDone >= 1 && base.length < 3 && Math.random() < 0.08) {
      const mission = generateContract(d.level, d.hw.os);
      const c: Contract = { id: mission.id, mission, expiresAt: now + (12 + Math.random() * 10) * 60000 };
      s.patch((x) => ({ contracts: [...x.contracts, c] }));
      if (base.length === 0) s.notify('info', 'Novo contrato no quadro', mission.title, true);
    }
    // eventos aleatórios
    if (!s.pendingEvent && !s.mg && now > s.nextEventAt && d.stats.missionsDone >= 1) {
      const elig = EVENTS.filter((e) => e.eligible(d) && (d.cooldowns[e.id] ?? 0) < now);
      if (elig.length) {
        const total = elig.reduce((a, e) => a + e.weight, 0);
        let r = Math.random() * total;
        const ev = elig.find((e) => (r -= e.weight) < 0) || elig[0];
        fireEvent(ev.id);
      }
      set({ nextEventAt: now + (70 + Math.random() * 80) * 1000 });
    }
    // autosave
    if (now - s.lastSaveAt > 25000 && s.dirty) s.saveSlot('auto');
  },

  respondEvent: (choice) => {
    const s = get();
    const pe = s.pendingEvent;
    const d = s.data;
    if (!pe || !d) return;
    audio.play('click');
    const now = Date.now();
    if ((pe.id === 'special_contract' || pe.id === 'limited_mission') && choice === 'accept') {
      const limited = pe.id === 'limited_mission';
      const mission = generateContract(d.level, d.hw.os, true);
      mission.id = 'S-' + mission.id.slice(2);
      mission.title = (limited ? 'Relâmpago: ' : '') + mission.title;
      const c: Contract = { id: mission.id, mission, expiresAt: now + (limited ? 4 : 6) * 60000 };
      s.patch((x) => ({ contracts: [...x.contracts, c] }));
      s.notify('ok', 'Contrato adicionado ao quadro', mission.title, true);
      set({ screen: 'missions' });
    }
    if (pe.id === 'software_update' && choice === 'ok') set({ screen: 'market' });
    if (pe.id === 'lab_found' && choice === 'ok') set({ screen: 'network' });
    if (pe.id === 'rival') {
      const reduce = toolLv(d, 'traceguard') >= 3 ? 0.4 : 1;
      if (choice === 'counter') {
        if (s.spend(80)) { s.addRep(Math.round(6 * 1)); s.notify('ok', 'Rival neutralizado', 'KRYPTO recuou. +reputação.', true); }
        else s.notify('warn', 'Créditos insuficientes', 'Você não pôde contra-atacar.', true);
      } else {
        const loss = Math.round(Math.min(d.money * 0.03, 120) * reduce * (d.inv.includes('sw_shieldlite') ? 0.5 : 1));
        s.patch((x) => ({ money: Math.max(0, x.money - loss) }));
        s.addRep(-Math.max(1, Math.round(3 * reduce)));
        s.notify('warn', 'KRYPTO levou um cliente', `-${loss} cr · -reputação`, true);
      }
    }
    set({ pendingEvent: null });
  },
}));

function fireEvent(id: string) {
  const s = useGame.getState();
  const d = s.data;
  const def = EVENT_MAP[id];
  if (!d || !def) return;
  const now = Date.now();
  let payload: any = {};
  let extra = '';
  s.patch((x) => ({ cooldowns: { ...x.cooldowns, [id]: now + def.cooldown * 1000 }, stats: { ...x.stats, eventsSeen: x.stats.eventsSeen + 1 } }));
  if (id === 'software_update') {
    const cands = Object.values(SHOP_MAP).filter((i) => (i.kind === 'tool' || i.kind === 'hw') && (i.levelReq ?? 1) <= d.level + 2);
    const item = cands[Math.floor(Math.random() * cands.length)];
    if (item) {
      s.patch((x) => ({ sales: { ...x.sales, [item.id]: { pct: 0.25, until: now + 300000 } } }));
      extra = ` Item em promoção: ${item.name}.`;
      payload.itemId = item.id;
    }
  }
  if (id === 'lab_found' || id === 'mystery_info') {
    const hidden = NODES.filter((n) => !d.discovered.includes(n.id) && (n.minLevel ?? 1) <= d.level + 1);
    const n = hidden[Math.floor(Math.random() * hidden.length)];
    if (n) { s.discover([n.id]); extra = ` Novo nó: ${n.name}.`; payload.node = n.id; }
    else if (id === 'lab_found') { set2NoEvent(); return; }
    if (id === 'mystery_info') {
      const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
      if (d.contactsUnlocked.includes(tip.contact)) {
        const msg: Msg = { id: Math.random().toString(36).slice(2), from: 'them', text: tip.text, ts: d.minutes };
        s.patch((x) => ({ threads: { ...x.threads, [tip.contact]: [...(x.threads[tip.contact] || []), msg] } }));
      }
      s.gainXp(20);
    }
  }
  if (id === 'tip') {
    const amt = 40 + d.level * 12;
    s.addMoney(amt);
    extra = ` Você recebeu ${amt} cr.`;
  }
  if (id === 'hardware_issue') {
    const dur = d.inv.includes('sw_shieldlite') ? 75000 : 150000;
    s.patch(() => ({ overheatUntil: now + dur }));
  }
  audio.play(id === 'rival' || id === 'hardware_issue' ? 'alert' : 'notify');
  s.feed(id === 'rival' || id === 'hardware_issue' ? 'warn' : 'info', def.title);
  useGame.setState({ pendingEvent: { id, payload: { ...payload, extra } } });
}
function set2NoEvent() { useGame.setState({ pendingEvent: null }); }

// utilitários exportados para comandos
export const gt = () => useGame.getState();
export { cpuSpeed, hasTool, itemPrice, opTime, reqLines, nodeConnectLevel, resolvePath, uniqueName, parentOf, usedMB, storageCapMB, HW_LABEL };

// Depuração (apenas dev): expõe a store no console do navegador.
if (typeof window !== "undefined" && (import.meta as any).env?.DEV) (window as any).__game = useGame;
