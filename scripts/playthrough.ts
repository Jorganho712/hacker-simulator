// Teste automatizado: joga TODAS as missões pelo mesmo motor do jogo (terminal + store), sem navegador.
import { useGame } from '../src/game/store.ts';
import { execute } from '../src/game/terminal/commands.ts';
import { ALL_STORY } from '../src/game/data/missions.ts';
import { NODE_MAP, CHALLENGES } from '../src/game/data/world.ts';
import { TOOLS } from '../src/game/data/tools.ts';
import { PUZZLE_MAP } from '../src/game/data/puzzles.ts';
import { caesar, vigenere, normalize } from '../src/game/crypto.ts';
import { makePuzzle } from '../src/minigames/Auth.tsx';
import { genFlows, evaluate } from '../src/game/fwgen.ts';
import { genLogs } from '../src/game/logsgen.ts';

const g = () => useGame.getState();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log('  FALHA:', m); } };

g().updateSettings({ termSpeed: 3 });
g().newGame('Tester');
g().patch(() => ({
  money: 5_000_000, level: 30,
  skills: { analysis: 5, crypto: 5, forensics: 5, infra: 5, security: 5 },
  hw: { cpu: 4, ram: 4, storage: 4, nic: 4, os: 3 },
  tools: Object.fromEntries(TOOLS.map((t) => [t.id, t.maxLevel])),
}));

const pendingAll = () => { for (const c of Object.keys(g().data!.pending)) { let n = 0; while (g().data!.pending[c] && n++ < 10) g().choose(c, 0); } };
const cmd = async (line: string) => { await execute(line); };
async function runMg(line: string) {
  const p = execute(line);
  await sleep(60);
  if (g().mg) g().finishMinigame({ win: true, score: 92, errors: 0, hints: 0 });
  await p;
}
const nodeOf = (file: string) => Object.values(NODE_MAP).find((n) => n.files.some((f) => f.name === file))?.id;
async function ensureConnected(id: string) {
  if (g().data!.node && g().data!.node !== id) await cmd('disconnect');
  if (g().data!.node !== id) await cmd(`connect ${id}`);
}

async function playMission(id: string) {
  pendingAll();
  const m = ALL_STORY.find((x) => x.id === id)!;
  const r = g().startMission(id);
  ok(r.ok, `${id}: não iniciou (${r.msg})`);
  if (!r.ok) return false;
  for (const o of m.objectives) {
    const rec = g().data!.missions[id];
    if (!rec || rec.status !== 'active') break;
    const before = rec.objIdx;
    const mt = o.match;
    switch (mt.type) {
      case 'scan': await cmd(`scan ${mt.target}`); break;
      case 'inspect': await cmd(`inspect ${mt.target}`); break;
      case 'connect': if (g().data!.node) await cmd('disconnect'); await cmd(`connect ${mt.target}`); break;
      case 'cat': { const n = nodeOf(mt.target!); if (n) await ensureConnected(n); await cmd(`cat ${mt.target}`); break; }
      case 'download': { const n = nodeOf(mt.target!)!; await ensureConnected(n); await cmd(`download ${mt.target}`); break; }
      case 'recover': { const n = nodeOf(mt.target!)!; await ensureConnected(n); await cmd(`recover ${mt.target}`); break; }
      case 'analyze': if (g().data!.node) await cmd('disconnect'); await cmd(`analyze ${mt.target}`); break;
      case 'decrypt': if (g().data!.node) await cmd('disconnect'); await runMg(`decrypt ${mt.target}`); break;
      case 'mg': { const ch = CHALLENGES.find((c) => c.id === mt.ref)!; await ensureConnected(ch.node); await runMg(`run ${mt.ref}`); break; }
      case 'choice': pendingAll(); break;
      case 'submit': await cmd('mission submit'); break;
    }
    const after = g().data!.missions[id];
    const adv = !after || after.status === 'completed' || after.objIdx > before;
    ok(adv, `${id}: objetivo "${o.text}" não avançou`);
    if (!adv) return false;
  }
  const fin = g().data!.missions[id];
  ok(fin?.status === 'completed', `${id}: não concluiu (status=${fin?.status})`);
  return fin?.status === 'completed';
}

console.log('== Reproduzindo a campanha completa ==');
pendingAll();
const order = ['M-001', 'M-002', 'M-003', 'M-004', 'M-005', 'M-006', 'M-007', 'M-008', 'M-009', 'M-010', 'M-012', 'M-011', 'M-013', 'M-014', 'M-015', 'M-016', 'M-017', 'M-018', 'M-019', 'M-020'];
for (const id of order) {
  const good = await playMission(id);
  console.log(good ? '  OK ' : '  XX ', id, ALL_STORY.find((m) => m.id === id)!.title);
  if (!good) break;
}
const d = g().data!;
console.log('Concluídas:', Object.values(d.missions).filter((m) => m.status === 'completed').length, '| nível', d.level, '| rep', d.rep, '| conquistas', Object.keys(d.ach).length, '| final:', d.flags.ending);

console.log('== Referências de conteúdo ==');
for (const m of ALL_STORY) for (const o of m.objectives) {
  const t = o.match;
  if (t.type === 'scan' || t.type === 'connect' || t.type === 'inspect') ok(!!NODE_MAP[t.target!], `${m.id}: nó ${t.target} inexistente`);
  if (['cat', 'download', 'recover'].includes(t.type)) ok(!!nodeOf(t.target!), `${m.id}: arquivo ${t.target} não está em nenhum nó`);
  if (t.type === 'mg') ok(CHALLENGES.some((c) => c.id === t.ref), `${m.id}: desafio ${t.ref} inexistente`);
}
for (const n of Object.values(NODE_MAP)) {
  n.links.forEach((l) => ok(!!NODE_MAP[l], `nó ${n.id}: link ${l} inexistente`));
  n.challenges.forEach((c) => ok(CHALLENGES.some((x) => x.id === c && x.node === n.id), `nó ${n.id}: desafio ${c} inconsistente`));
  n.files.forEach((f) => { if (f.encrypted) ok(CHALLENGES.some((c) => c.id === f.encrypted!.challenge), `${f.name}: desafio de decifragem inexistente`); });
}

console.log('== Puzzles ==');
for (const p of Object.values(PUZZLE_MAP)) {
  if (p.kind === 'caesar') ok(normalize(caesar(p.cipher, -(p.shift ?? 0))) === normalize(p.answer), `${p.id}: César não decifra`);
  if (p.kind === 'vigenere') ok(normalize(vigenere(p.cipher, p.key!, true)) === normalize(p.answer), `${p.id}: Vigenère não decifra`);
}
for (const c of CHALLENGES.filter((c) => c.mg === 'auth')) { const pz = makePuzzle(c.params.seed, c.params.digits); ok(pz.unique, `${c.id}: pistas não determinam combinação única`); }
for (const c of CHALLENGES.filter((c) => c.mg === 'firewall')) {
  const { flows } = genFlows(c.params.scenario, c.params.seed);
  const rules = [
    { action: 'block', src: 'hostile', port: 'any', proto: 'any' }, { action: 'allow', src: 'internal', port: 'any', proto: 'any' },
    { action: 'allow', src: 'partner', port: 'any', proto: 'any' }, { action: 'allow', src: 'external', port: 443, proto: 'tcp' },
  ] as any;
  const crit = flows.filter((f) => f.critical).every((f) => evaluate(f, rules, 'block') === 'allow');
  const mal = flows.filter((f) => !f.legit);
  const blocked = mal.filter((f) => evaluate(f, rules, 'block') === 'block').length;
  ok(crit && blocked / mal.length >= 0.7, `${c.id}: solução de referência falha (crit=${crit}, bloqueadas ${blocked}/${mal.length})`);
}
for (const c of CHALLENGES.filter((c) => c.mg === 'logs')) {
  const lc = genLogs(c.params.scenario, c.params.seed, c.params.lines);
  ok(lc.keyCount >= 6 && lc.lines.length >= c.params.lines - 4, `${c.id}: logs inconsistentes (${lc.keyCount} chaves, ${lc.lines.length} linhas)`);
}

console.log(fails ? `\n${fails} FALHA(S)` : '\nTODOS OS TESTES PASSARAM');
Deno.exit(fails ? 1 : 0);
