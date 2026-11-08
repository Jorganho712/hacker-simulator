import type { FsEntry, MissionDef, ShopItem, ToolDef } from './types';
import type { GameData } from './state';
import { CPU_TIERS, NIC_TIERS, OS_TIERS, RAM_TIERS, STORAGE_TIERS } from './data/hardware';
import { TOOL_MAP, toolPrice } from './data/tools';
import { MISSION_MAP } from './data/missions';
import { NODE_MAP } from './data/world';
import { repRank } from './data/progression';

export const toolLv = (d: GameData, id: string) => d.tools[id] || 0;
export function hasTool(d: GameData, spec: string) {
  const [id, lv] = spec.split(':');
  return toolLv(d, id) >= (lv ? +lv : 1);
}
export const specName = (spec: string) => {
  const [id, lv] = spec.split(':');
  return `${TOOL_MAP[id]?.name ?? id}${lv ? ` nv.${lv}` : ''}`;
};

export const isOverheated = (d: GameData) => d.overheatUntil > Date.now();
export function cpuSpeed(d: GameData) {
  let v = CPU_TIERS[d.hw.cpu].value;
  if (d.inv.includes('up_overclock')) v *= 1.1;
  if (isOverheated(d)) v *= 0.65;
  return v;
}
export const netSpeed = (d: GameData) => NIC_TIERS[d.hw.nic].value;
export const ramMB = (d: GameData) => RAM_TIERS[d.hw.ram].value;
export const osUsageMB = (d: GameData) => OS_TIERS[d.hw.os].value;
export const storageCapMB = (d: GameData) => STORAGE_TIERS[d.hw.storage].value + (d.inv.includes('up_backup') ? 4096 : 0);
export const entryMB = (d: GameData, e: FsEntry) => (e.type === 'file' ? (e.size / 1024) * (d.inv.includes('sw_zip') ? 0.7 : 1) : 0);
export const usedMB = (d: GameData) => osUsageMB(d) + Object.values(d.fs).reduce((a, e) => a + entryMB(d, e), 0);
export const freeMB = (d: GameData) => Math.max(0, storageCapMB(d) - usedMB(d));
export const infraCapBonus = (d: GameData) => 1 + 0.05 * d.skills.infra;
export const infraDiscount = (d: GameData) => 1 - 0.03 * d.skills.infra;

// tempo (ms) de uma operação simulada
export function opTime(d: GameData, baseMs: number, termSpeed: number) {
  const infra = d.skills.infra >= 5 ? 0.75 : 1;
  const stealth = 1;
  const speed = cpuSpeed(d) * (0.6 + 0.4 * netSpeed(d) ** 0.5) * (termSpeed === 1 ? 0.6 : termSpeed === 3 ? 2.2 : 1);
  return Math.max(40, (baseMs * infra * stealth) / speed);
}

export function salePct(d: GameData, itemId: string) {
  const s = d.sales[itemId];
  return s && s.until > Date.now() ? s.pct : 0;
}
export function itemPrice(d: GameData, item: ShopItem): number {
  let p = item.price;
  if (item.kind === 'tool' && item.toolId) {
    const t = TOOL_MAP[item.toolId];
    p = toolPrice(t, toolLv(d, t.id) + 1);
  }
  if (item.kind === 'hw') p *= infraDiscount(d);
  p *= 1 - salePct(d, item.id);
  return Math.round(p);
}

export function mgSkillOk(d: GameData, ch: { minSkill?: { skill: any; rank: number } }) {
  return !ch.minSkill || d.skills[ch.minSkill.skill as keyof typeof d.skills] >= ch.minSkill.rank;
}

export function getMission(d: GameData | null, id: string): MissionDef | undefined {
  if (MISSION_MAP[id]) return MISSION_MAP[id];
  return d?.contracts.find((c) => c.mission.id === id)?.mission;
}

export interface ReqLine { label: string; ok: boolean }
export function reqLines(d: GameData, m: MissionDef): ReqLine[] {
  const r = m.requires;
  const out: ReqLine[] = [];
  if (r.level) out.push({ label: `Nível ${r.level}`, ok: d.level >= r.level });
  if (r.rep) out.push({ label: `Reputação ${r.rep}`, ok: d.rep >= r.rep });
  if (r.os) out.push({ label: `SO: ${OS_TIERS[r.os].name}`, ok: d.hw.os >= r.os });
  r.tools?.forEach((t) => out.push({ label: specName(t), ok: hasTool(d, t) }));
  r.completed?.forEach((c) => out.push({ label: `Concluir ${c}`, ok: d.missions[c]?.status === 'completed' }));
  r.flags?.forEach((f) => out.push({ label: `Evento: ${f}`, ok: !!d.flags[f] }));
  return out;
}
export const missionVisible = (d: GameData, m: MissionDef) => !(m.requires.offered && !d.offered.includes(m.id)) && (m.generated || true);
export const missionUnlocked = (d: GameData, m: MissionDef) => missionVisible(d, m) && reqLines(d, m).every((l) => l.ok);
export const prereqsDone = (d: GameData, m: MissionDef) => (m.requires.completed ?? []).every((c) => d.missions[c]?.status === 'completed');

export function nodeConnectLevel(security: number) {
  return security <= 2 ? 1 : security === 3 ? 2 : 3;
}

export function repLabel(d: GameData) { return repRank(d.rep).name; }
export const isDiscovered = (d: GameData, id: string) => d.discovered.includes(id) && !!NODE_MAP[id];
export const missionReward = (d: GameData, m: MissionDef, attempts: number, perfect: boolean) => {
  const penalty = Math.max(0.55, 1 - 0.15 * Math.max(0, attempts - 1));
  const rep = 1 + Math.max(0, repRank(d.rep) ? 0 : 0);
  let mult = penalty * (perfect ? 1.15 : 1) * rep;
  mult *= 1 + [0, 1, 2, 3, 4, 5, 6][Math.min(6, Math.floor(Math.max(0, d.rep) / 150))] * 0.015;
  if (d.inv.includes('up_vlan')) mult *= 1.05;
  return Math.round((m.reward.money * mult) / 5) * 5;
};
export type { ToolDef };
