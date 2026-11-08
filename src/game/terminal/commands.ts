import { useGame, gt } from '../store';
import type { GameData } from '../state';
import { NODE_MAP, CHALLENGE_MAP } from '../data/world';
import { resolveChallenge } from '../data/contracts';
import { MISSION_MAP } from '../data/missions';
import { TOOL_MAP, SHOP, SHOP_MAP, fmtMB } from '../data/tools';
import { CPU_TIERS, HW_LABEL, HW_TABLES, NIC_TIERS, OS_TIERS, RAM_TIERS, STORAGE_TIERS } from '../data/hardware';
import { REP_RANKS, SKILLS, repRank, xpToNext, nextRank } from '../data/progression';
import { CONTACTS } from '../data/contacts';
import { cpuSpeed, freeMB, getMission, hasTool, isOverheated, itemPrice, mgSkillOk, netSpeed, nodeConnectLevel, opTime, ramMB, storageCapMB, toolLv, usedMB, missionUnlocked, reqLines } from '../derived';
import { baseOf, displayPath, fmtKB, joinPath, listDir, parentOf, resolvePath } from '../fsops';
import { fmtGameTime } from '../state';
import { lev, parse, type Parsed } from './parser';
import { audio } from '../audio';

type Run = (p: Parsed) => Promise<void> | void;
export interface Cmd { name: string; aliases?: string[]; group: string; summary: string; usage: string; run: Run }

const S = () => useGame.getState();
const D = (): GameData => useGame.getState().data!;
const out = (k: Parameters<ReturnType<typeof S>['print']>[0], t: string) => S().print(k, t);
const sleep = (ms: number) => S().wait(opTime(D(), ms, S().settings.termSpeed));
const bar = (pct: number, w = 20) => '█'.repeat(Math.round((pct / 100) * w)) + '░'.repeat(w - Math.round((pct / 100) * w));

function findNode(arg?: string, onlyDiscovered = true): string | null {
  if (!arg) return null;
  const d = D();
  const a = arg.toLowerCase();
  const pool = Object.keys(NODE_MAP).filter((id) => !onlyDiscovered || d.discovered.includes(id));
  if (pool.includes(a)) return a;
  const m = pool.filter((id) => id.startsWith(a));
  return m.length === 1 ? m[0] : null;
}

function unknownNode(arg?: string) {
  if (!arg) return out('err', 'Alvo não informado. Use "nodes" para listar os alvos conhecidos.');
  if (NODE_MAP[arg.toLowerCase()]) return out('err', `[ERRO] O alvo "${arg}" ainda não foi descoberto. Explore a rede ou conclua missões.`);
  out('err', `[ERRO] Alvo desconhecido: "${arg}". Use "nodes" para listar os alvos conhecidos.`);
  const sug = Object.keys(NODE_MAP).filter((id) => D().discovered.includes(id)).sort((a, b) => lev(arg, a) - lev(arg, b))[0];
  if (sug && lev(arg, sug) <= 6) out('dim', `Você quis dizer: ${sug}?`);
}

function remoteFile(name?: string) {
  const d = D();
  if (!d.node || !name) return null;
  const files = NODE_MAP[d.node].files;
  return files.find((f) => f.name === name) || (files.filter((f) => f.name.startsWith(name)).length === 1 ? files.find((f) => f.name.startsWith(name)) : null) || null;
}
function localEntry(arg: string) {
  const d = D();
  const p = resolvePath(d.cwd, arg);
  if (d.fs[p]) return { path: p, e: d.fs[p] };
  // procurar por nome em downloads
  const dl = Object.entries(d.fs).filter(([path, e]) => e.type === 'file' && baseOf(path) === arg);
  if (dl.length >= 1) return { path: dl[0][0], e: dl[0][1] };
  return null;
}

export const promptText = () => {
  const d = D();
  const host = d.node ? d.node : d.promptName.split('@')[1] || 'cybercore';
  const user = d.node ? 'guest' : d.promptName.split('@')[0] || 'user';
  const path = d.node ? '/srv' : displayPath(d.cwd);
  return `${user}@${host}:${path}$`;
};

// ---------------------------------------------------------------- desafios compartilhados
export async function runChallenge(id: string, source = 'terminal') {
  const d = D();
  const ch = resolveChallenge(id);
  if (!ch) { out('err', `[ERRO] Desafio desconhecido: ${id}. Use "challenges" para listar.`); return; }
  if (!ch.contract && !d.discovered.includes(ch.node)) { out('err', `[ERRO] O ambiente ${ch.node} ainda não foi descoberto.`); return; }
  if (!ch.contract && !(ch.node in d.scanned) && d.node !== ch.node) { out('err', `[ERRO] Escaneie ${ch.node} antes de executar seus desafios (scan ${ch.node}).`); return; }
  if (!mgSkillOk(d, ch)) { out('err', `[BLOQUEADO] Este desafio exige a habilidade ${ch.minSkill!.skill} rank ${ch.minSkill!.rank}.`); return; }
  if (ch.mg === 'resources' && d.hw.os < 1) { out('err', '[BLOQUEADO] O gerenciador de recursos exige CyberCore OS 2.0 ou superior.'); return; }
  out('info', `[DESAFIO] ${ch.name} — dificuldade ${ch.diff}/5`);
  S().setBusy(true);
  const p = S().startMinigame(id, source);
  if (!p) { out('err', '[ERRO] Já existe um desafio em andamento.'); S().setBusy(false); return; }
  await p;
  S().setBusy(false);
}

// ---------------------------------------------------------------- scan
async function doScan(arg?: string) {
  const d = D();
  if (!hasTool(d, 'cyberscan')) return out('err', '[ERRO] CyberScan não instalado. Compre-o no Mercado.');
  const id = findNode(arg);
  if (!id) return unknownNode(arg);
  const n = NODE_MAP[id];
  out('scan', `[SCAN] Initializing virtual scan on ${n.address} (${id}.sim)...`);
  audio.play('scan');
  await sleep(600);
  out('scan', '[SCAN] Analyzing simulated environment...');
  await sleep(700 + n.security * 150);
  const lv = toolLv(d, 'cyberscan');
  const shown = n.services.filter((s) => s.state === 'open' || (s.state === 'filtered' && lv >= 3));
  out('info', `[INFO] ${shown.length} virtual services detected.`);
  out('out', 'PORT      STATE     SERVICE        VERSION');
  for (const s of n.services) {
    if (s.state === 'filtered' && lv < 3) continue;
    out(s.state === 'open' ? 'ok' : s.state === 'filtered' ? 'warn' : 'dim', `${String(s.port).padEnd(9)} ${s.state.padEnd(9)} ${s.name.padEnd(14)} ${lv >= 2 ? s.version : '?'}`);
    await sleep(120);
  }
  const chs = n.challenges.length;
  out('info', `[INFO] ${chs} security challenge${chs === 1 ? '' : 's'} available.${chs ? ' Use "challenges ' + id + '".' : ''}`);
  if (lv >= 3) n.facts.forEach((f) => out('dim', `       · ${f}`));
  // NetVision revela vizinhos
  if (hasTool(d, 'netvision')) {
    const nb = n.links.filter((l) => NODE_MAP[l] && !d.discovered.includes(l) && (NODE_MAP[l].minLevel ?? 1) <= d.level + 2);
    if (nb.length) { out('info', `[NETVISION] ${nb.length} nó(s) vizinho(s) mapeado(s).`); S().discover(nb); }
  }
  S().markScanned(id);
  S().patch((x) => ({ stats: { ...x.stats, scans: x.stats.scans + 1 } }));
  out('ok', '[OK] Scan completed.');
  S().emit({ type: 'scan', target: id });
  S().checkAchievements();
}

// ---------------------------------------------------------------- comandos
const cmds: Cmd[] = [];
const def = (c: Cmd) => cmds.push(c);

def({ name: 'help', aliases: ['man', '?'], group: 'Sistema', summary: 'Mostra os comandos disponíveis', usage: 'help [comando]',
  run: (p) => {
    const q = p.args[0]?.toLowerCase();
    if (q) {
      const c = cmds.find((x) => x.name === q || x.aliases?.includes(q));
      if (!c) return out('err', `Sem ajuda para "${q}".`);
      out('hl', `${c.name} — ${c.summary}`);
      out('out', `Uso: ${c.usage}`);
      if (c.aliases?.length) out('dim', `Aliases: ${c.aliases.join(', ')}`);
      return;
    }
    out('hl', '=== COMANDOS DISPONÍVEIS ===');
    const groups = [...new Set(cmds.map((c) => c.group))];
    for (const g of groups) {
      out('info', `\n[${g}]`);
      cmds.filter((c) => c.group === g).forEach((c) => out('out', `  ${c.name.padEnd(12)} ${c.summary}`));
    }
    out('dim', '\nDica: Tab autocompleta · ↑/↓ histórico · "help <comando>" mostra o uso detalhado.');
  } });
def({ name: 'clear', aliases: ['cls'], group: 'Sistema', summary: 'Limpa a tela do terminal', usage: 'clear', run: () => S().clearTerm() });
def({ name: 'whoami', group: 'Sistema', summary: 'Mostra o usuário atual', usage: 'whoami',
  run: () => { const d = D(); out('out', `${d.name}${d.title ? ` «${d.title}»` : ''} — ${repRank(d.rep).name} (nível ${d.level})`); } });
def({ name: 'date', group: 'Sistema', summary: 'Data e hora da simulação', usage: 'date',
  run: () => { const t = fmtGameTime(D().minutes); out('out', `${t.date} ${t.time} (horário fictício de Neo-Santos)`); } });
def({ name: 'status', group: 'Sistema', summary: 'Resumo da sua situação', usage: 'status',
  run: () => {
    const d = D();
    const m = d.active ? getMission(d, d.active) : null;
    out('hl', '=== STATUS ===');
    out('out', `Operador   : ${d.name}   Nível ${d.level}  (${d.xp}/${xpToNext(d.level)} XP)`);
    out('out', `Créditos   : ${d.money} cr   Reputação: ${d.rep} (${repRank(d.rep).name})`);
    out('out', `Conexão    : ${d.node ? `conectado a ${d.node}` : 'local (sem sessão remota)'}`);
    out('out', `Missão     : ${m ? `${m.id} — ${m.title}` : 'nenhuma ativa'}`);
    out('out', `Hardware   : CPU x${cpuSpeed(d).toFixed(1)}${isOverheated(d) ? ' (SUPERAQUECIDA — use "repair")' : ''} · ${fmtMB(ramMB(d))} RAM · ${fmtMB(freeMB(d))} livres`);
    if (d.skillPoints > 0) out('warn', `Você tem ${d.skillPoints} ponto(s) de habilidade para distribuir (aba HABILIDADES).`);
  } });
def({ name: 'sysinfo', aliases: ['neofetch'], group: 'Sistema', summary: 'Características do computador virtual', usage: 'sysinfo',
  run: () => {
    const d = D();
    out('hl', '=== SYSINFO ===');
    out('out', `SO          : ${OS_TIERS[d.hw.os].name}`);
    out('out', `Processador : ${CPU_TIERS[d.hw.cpu].name} (${CPU_TIERS[d.hw.cpu].spec}) · velocidade x${cpuSpeed(d).toFixed(2)}`);
    out('out', `Memória RAM : ${RAM_TIERS[d.hw.ram].name}`);
    out('out', `Disco       : ${STORAGE_TIERS[d.hw.storage].name} — ${fmtMB(usedMB(d))} usados / ${fmtMB(storageCapMB(d))}`);
    out('out', `Rede        : ${NIC_TIERS[d.hw.nic].name} (banda x${netSpeed(d)})`);
    out('dim', `Disco: [${bar((usedMB(d) / storageCapMB(d)) * 100, 24)}] ${Math.round((usedMB(d) / storageCapMB(d)) * 100)}%`);
  } });
def({ name: 'pwd', group: 'Arquivos', summary: 'Diretório atual', usage: 'pwd', run: () => out('out', D().node ? `/srv/${D().node}` : D().cwd) });
def({ name: 'ls', aliases: ['dir'], group: 'Arquivos', summary: 'Lista arquivos (locais ou do nó conectado)', usage: 'ls [-l] [caminho]',
  run: (p) => {
    const d = D();
    if (d.node) {
      const n = NODE_MAP[d.node];
      out('info', `Conteúdo remoto de ${d.node}:`);
      n.files.forEach((f) => out('out', p.flags.l ? `${'-rw-r--r--'} ${fmtKB((f.size ?? 1) * 1000).padStart(9)}  ${f.name}${f.encrypted ? '  [cifrado]' : ''}${f.recoverable ? '  [apagado]' : ''}` : f.name + (f.encrypted ? '  🔒' : '')));
      return;
    }
    const path = resolvePath(d.cwd, p.args[0] || '.');
    const e = d.fs[path];
    if (!e) return out('err', `ls: não foi possível acessar '${p.args[0]}': arquivo ou diretório inexistente`);
    if (e.type === 'file') return out('out', e.name);
    const items = listDir(d.fs, path);
    if (!items.length) return out('dim', '(vazio)');
    items.forEach(({ e }) => out(e.type === 'dir' ? 'info' : 'out', p.flags.l ? `${e.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'} ${e.type === 'dir' ? '     -' : fmtKB(e.size).padStart(9)}  ${e.name}${e.type === 'dir' ? '/' : ''}${e.encrypted ? '  [cifrado]' : ''}` : e.name + (e.type === 'dir' ? '/' : '') + (e.encrypted ? '  🔒' : '')));
  } });
def({ name: 'cd', group: 'Arquivos', summary: 'Muda de diretório', usage: 'cd <caminho>',
  run: (p) => {
    const d = D();
    if (d.node) return out('err', 'cd: sistema de arquivos remoto é plano. Use "disconnect" para voltar ao seu computador.');
    const path = resolvePath(d.cwd, p.args[0] ?? '~');
    const e = d.fs[path];
    if (!e) return out('err', `cd: ${p.args[0]}: diretório inexistente`);
    if (e.type !== 'dir') return out('err', `cd: ${p.args[0]}: não é um diretório`);
    S().setCwd(path);
  } });
def({ name: 'cat', aliases: ['type', 'read'], group: 'Arquivos', summary: 'Mostra o conteúdo de um arquivo', usage: 'cat <arquivo>',
  run: (p) => {
    const d = D();
    const a = p.args[0];
    if (!a) return out('err', 'cat: informe um arquivo.');
    const rf = remoteFile(a);
    if (d.node && rf) {
      if (rf.encrypted) { out('warn', `[CIFRADO] ${rf.name} está criptografado. Baixe e use "decrypt ${rf.name}".`); out('dim', '4f 7a a1 9c 33 e0 5d ... (conteúdo ilegível)'); S().emit({ type: 'cat', target: rf.name }); return; }
      if (rf.recoverable) { out('warn', `[APAGADO] ${rf.name} foi removido do disco. Use "recover ${rf.name}" com DataRecovery.`); return; }
      out('out', rf.content);
      S().emit({ type: 'cat', target: rf.name });
      return;
    }
    if (d.node) return out('err', `cat: ${a}: arquivo remoto não encontrado em ${d.node}. Use "ls".`);
    const le = localEntry(a);
    if (!le) return out('err', `cat: ${a}: arquivo ou diretório inexistente`);
    if (le.e.type === 'dir') return out('err', `cat: ${a}: é um diretório`);
    if (le.e.encrypted) { out('warn', `[CIFRADO] ${le.e.name} está criptografado. Use "decrypt ${le.e.name}".`); return; }
    if (le.e.recoverable) { out('warn', `[APAGADO] ${le.e.name} precisa de "recover".`); return; }
    out('out', le.e.content || '(arquivo vazio)');
    S().emit({ type: 'cat', target: le.e.name });
  } });
def({ name: 'mkdir', group: 'Arquivos', summary: 'Cria uma pasta', usage: 'mkdir <nome>',
  run: (p) => {
    if (D().node) return out('err', 'mkdir: operação indisponível em nó remoto.');
    if (!p.args[0]) return out('err', 'mkdir: informe o nome.');
    const r = S().mkdir(resolvePath(D().cwd, p.args[0]));
    out(r.ok ? 'ok' : 'err', r.msg);
  } });
def({ name: 'touch', aliases: ['note'], group: 'Arquivos', summary: 'Cria uma nota de texto', usage: 'note <arquivo> [texto...]',
  run: (p) => {
    if (D().node) return out('err', 'Operação indisponível em nó remoto.');
    if (!p.args[0]) return out('err', 'Informe o nome do arquivo.');
    const r = S().writeFile(resolvePath(D().cwd, p.args[0]), p.args.slice(1).join(' '));
    out(r.ok ? 'ok' : 'err', r.msg);
  } });
def({ name: 'echo', group: 'Arquivos', summary: 'Imprime texto (use > arquivo para gravar)', usage: 'echo texto [> arquivo]',
  run: (p) => {
    const i = p.args.indexOf('>');
    if (i === -1) return out('out', p.args.join(' '));
    const text = p.args.slice(0, i).join(' ');
    const file = p.args[i + 1];
    if (!file) return out('err', 'echo: informe o arquivo de destino após ">"');
    const r = S().writeFile(resolvePath(D().cwd, file), text);
    out(r.ok ? 'ok' : 'err', r.msg);
  } });
def({ name: 'rm', aliases: ['del'], group: 'Arquivos', summary: 'Remove arquivo/pasta', usage: 'rm <caminho>',
  run: (p) => {
    if (D().node) return out('err', 'rm: operação indisponível em nó remoto.');
    if (!p.args[0]) return out('err', 'rm: informe o caminho.');
    const le = localEntry(p.args[0]);
    if (!le) return out('err', `rm: ${p.args[0]}: inexistente`);
    const r = S().removePath(le.path);
    out(r.ok ? 'ok' : 'err', r.msg);
  } });
def({ name: 'history', group: 'Sistema', summary: 'Histórico de comandos', usage: 'history',
  run: () => { const h = D().history.slice(-25); h.forEach((l, i) => out('dim', `${String(D().history.length - h.length + i + 1).padStart(4)}  ${l}`)); } });

def({ name: 'nodes', aliases: ['net'], group: 'Rede', summary: 'Lista os alvos conhecidos', usage: 'nodes',
  run: () => {
    const d = D();
    out('hl', 'ID                    ENDEREÇO        SEC  TIPO            STATUS');
    d.discovered.filter((i) => NODE_MAP[i]).forEach((id) => {
      const n = NODE_MAP[id];
      out(d.node === id ? 'ok' : 'out', `${id.padEnd(21)} ${n.address.padEnd(15)} ${String(n.security).padEnd(4)} ${n.kind.padEnd(15)} ${d.node === id ? 'CONECTADO' : id in d.scanned ? 'escaneado' : 'descoberto'}`);
    });
  } });
def({ name: 'ping', group: 'Rede', summary: 'Testa a latência de um alvo da simulação', usage: 'ping <alvo>',
  run: async (p) => {
    const id = findNode(p.args[0]);
    if (!id) return unknownNode(p.args[0]);
    const n = NODE_MAP[id];
    for (let i = 0; i < 3; i++) { out('out', `resposta de ${n.address}: tempo=${Math.round(8 + n.security * 11 + Math.random() * 9)}ms (simulado)`); await sleep(300); }
  } });
def({ name: 'scan', group: 'Rede', summary: 'Varre um alvo fictício (CyberScan)', usage: 'scan <alvo>', run: (p) => doScan(p.args[0]) });
def({ name: 'inspect', group: 'Rede', summary: 'Exibe informações de um sistema ou arquivo', usage: 'inspect <alvo|arquivo>',
  run: async (p) => {
    const d = D();
    const a = p.args[0];
    if (!a) return out('err', 'inspect: informe um alvo (ex.: inspect aegis-train-01).');
    const id = findNode(a);
    if (id) {
      const n = NODE_MAP[id];
      if (!(id in d.scanned)) return out('err', `[ERRO] Escaneie ${id} primeiro (scan ${id}).`);
      const lv = toolLv(d, 'cyberscan');
      out('hl', `=== ${n.name} ===`);
      out('out', `Endereço: ${n.address}  ·  Organização: ${n.org}  ·  Tipo: ${n.kind}`);
      out('out', `Segurança: ${'■'.repeat(n.security)}${'□'.repeat(5 - n.security)} (${n.security}/5)  ·  SecureShell exigido: nv.${nodeConnectLevel(n.security)}`);
      out('dim', n.desc);
      await sleep(500);
      n.services.forEach((s) => {
        if (s.state === 'filtered' && lv < 3) return;
        out(s.vuln && lv >= 2 ? 'warn' : 'out', ` ${s.port}/${s.name} ${lv >= 2 ? s.version : ''}${lv >= 2 && s.vuln ? `\n     ⚠ ${s.vuln}` : ''}${lv >= 3 && s.note ? `\n     ℹ ${s.note}` : ''}`);
      });
      if (lv < 2) out('dim', '(Atualize o CyberScan para o nível 2 para ver vulnerabilidades.)');
      n.facts.forEach((f) => out('info', ` · ${f}`));
      out('ok', `[OK] ${n.challenges.length} desafio(s) de segurança disponível(is).`);
      S().markInspected(id);
      S().emit({ type: 'inspect', target: id });
      return;
    }
    const le = localEntry(a);
    if (!le) return out('err', `inspect: "${a}" não é um alvo conhecido nem um arquivo local.`);
    out('hl', `=== ${le.e.name} ===`);
    out('out', `Tipo: ${le.e.type}  ·  Tamanho: ${fmtKB(le.e.size)}  ·  Criado: ${new Date(le.e.created).toLocaleString('pt-BR')}`);
    out('out', `Estado: ${le.e.encrypted ? 'cifrado' : le.e.recoverable ? 'apagado/corrompido' : 'legível'}${le.e.analyzed ? ' · analisado' : ''}`);
  } });

def({ name: 'connect', aliases: ['ssh'], group: 'Rede', summary: 'Conecta-se a um alvo (SecureShell)', usage: 'connect <alvo>',
  run: async (p) => {
    const d = D();
    if (!hasTool(d, 'secureshell')) return out('err', '[ERRO] SecureShell não instalado.');
    const id = findNode(p.args[0]);
    if (!id) return unknownNode(p.args[0]);
    if (d.node === id) return out('warn', `Você já está conectado a ${id}.`);
    if (d.node) return out('err', `Você já está conectado a ${d.node}. Use "disconnect" primeiro.`);
    const n = NODE_MAP[id];
    const need = nodeConnectLevel(n.security);
    if (toolLv(d, 'secureshell') < need) return out('err', `[ACESSO NEGADO] ${id} tem segurança ${n.security}: exige SecureShell nível ${need} (você tem ${toolLv(d, 'secureshell')}).`);
    if (!(id in d.scanned)) out('warn', '[AVISO] Alvo não escaneado. Prosseguindo às cegas...');
    out('sys', `[CONNECT] Abrindo túnel simulado para ${n.address}...`);
    await sleep(700);
    out('sys', '[CONNECT] Handshake de chaves (simulado)...');
    await sleep(600 + n.security * 120);
    S().setNode(id);
    out('ok', `[OK] Conectado a ${n.name}. Use "ls" para ver os arquivos.`);
    S().emit({ type: 'connect', target: id });
  } });
def({ name: 'disconnect', aliases: ['exit', 'logout'], group: 'Rede', summary: 'Encerra a sessão remota', usage: 'disconnect',
  run: async () => {
    const d = D();
    if (!d.node) return out('err', 'Nenhuma sessão remota ativa.');
    const n = d.node;
    out('sys', `[DISCONNECT] Encerrando sessão com ${n}...`);
    await sleep(400);
    S().setNode(null);
    out('ok', '[OK] Sessão encerrada. Você voltou ao seu computador.');
  } });
def({ name: 'download', aliases: ['get'], group: 'Rede', summary: 'Baixa um arquivo do nó conectado', usage: 'download <arquivo>',
  run: async (p) => {
    const d = D();
    if (!d.node) return out('err', 'download: conecte-se a um alvo primeiro.');
    const f = remoteFile(p.args[0]);
    if (!f) return out('err', `download: arquivo "${p.args[0] ?? ''}" não encontrado em ${d.node}. Use "ls".`);
    const dest = joinPath('/home/user/downloads', f.name);
    if (d.fs[dest]) return out('warn', `${f.name} já foi baixado (~/downloads).`);
    const kb = (f.size ?? 1) * 1000;
    if (kb / 1024 > freeMB(d)) return out('err', `[ERRO] Armazenamento insuficiente: ${fmtKB(kb)} necessários, ${fmtMB(freeMB(d))} livres. Apague arquivos (rm) ou compre um disco maior.`);
    out('sys', `[DOWNLOAD] ${f.name} (${fmtKB(kb)}) de ${d.node}...`);
    const fast = toolLv(d, 'secureshell') >= 3 ? 0.5 : 1;
    for (let i = 1; i <= 4; i++) { await sleep((220 + (f.size ?? 1) * 0.5) * fast); out('dim', `  [${bar(i * 25, 20)}] ${i * 25}%`); }
    const r = S().writeFile(dest, f.content, { size: kb, encrypted: f.encrypted, analysis: f.analysis, recoverable: f.recoverable, recovered: f.recovered, malicious: f.malicious });
    if (!r.ok) return out('err', `[ERRO] ${r.msg}`);
    out('ok', `[OK] Salvo em ~/downloads/${f.name}`);
    S().emit({ type: 'download', target: f.name });
  } });
def({ name: 'analyze', aliases: ['analyse'], group: 'Análise', summary: 'Analisa um arquivo local (HexAnalyzer)', usage: 'analyze <arquivo>',
  run: async (p) => {
    const d = D();
    if (!hasTool(d, 'hexanalyzer')) return out('err', '[ERRO] HexAnalyzer não instalado.');
    if (!p.args[0]) return out('err', 'analyze: informe um arquivo local (ex.: analyze orcamento_final.pdf.scr).');
    const le = localEntry(p.args[0]);
    if (!le || le.e.type !== 'file') {
      if (d.node && remoteFile(p.args[0])) return out('err', `analyze: o arquivo está em ${d.node}. Baixe-o primeiro: download ${p.args[0]}`);
      return out('err', `analyze: ${p.args[0]}: arquivo local inexistente.`);
    }
    const lv = toolLv(d, 'hexanalyzer');
    out('scan', `[HEX] Carregando ${le.e.name} (${fmtKB(le.e.size)})...`);
    await sleep(700);
    out('scan', '[HEX] Lendo cabeçalhos e strings...');
    await sleep(800);
    const lines = le.e.analysis || ['L1|Arquivo comum. Nenhuma anomalia detectada.'];
    let hidden = 0;
    out('hl', `=== RESULTADO: ${le.e.name} ===`);
    for (const l of lines) {
      const [tag, txt] = l.includes('|') ? l.split('|') : ['L1', l];
      const need = +tag.slice(1);
      if (need <= lv) { out(/malic|Assinatura|SIM-/.test(txt) ? 'warn' : 'out', ` • ${txt}`); await sleep(160); } else hidden++;
    }
    if (hidden) out('dim', `[HEX] ${hidden} resultado(s) exigem HexAnalyzer nível maior.`);
    if (d.skills.analysis >= 2 && le.e.encrypted) out('info', ' • (Análise 2) Arquivo cifrado: use "decrypt".');
    S().patch((x) => ({ fs: { ...x.fs, [le.path]: { ...x.fs[le.path], analyzed: true } } }));
    out('ok', '[OK] Análise concluída.');
    S().emit({ type: 'analyze', target: le.e.name });
  } });
def({ name: 'recover', group: 'Análise', summary: 'Recupera arquivos apagados (DataRecovery)', usage: 'recover <arquivo>',
  run: async (p) => {
    const d = D();
    if (!hasTool(d, 'datarecovery')) return out('err', '[ERRO] DataRecovery não instalado. Compre-o no Mercado (Ferramentas).');
    const name = p.args[0];
    if (!name) return out('err', 'recover: informe o arquivo apagado.');
    const rf = remoteFile(name);
    const le = d.node ? null : localEntry(name);
    const src = rf ?? (le?.e as any);
    if (!src || !src.recoverable) return out('err', `recover: nada para recuperar em "${name}".`);
    const fname = src.name;
    out('scan', `[RECOVER] Varrendo setores livres em busca de ${fname}...`);
    for (let i = 1; i <= 4; i++) { await sleep(500); out('dim', `  setor ${i * 2048}-${i * 2048 + 2047}: ${i < 3 ? 'fragmento encontrado' : 'reconstruindo'}`); }
    const chance = Math.min(1, 0.72 + 0.1 * toolLv(d, 'datarecovery') + 0.1 * d.skills.forensics);
    if (d.skills.forensics < 1 && Math.random() > chance) { out('warn', '[RECOVER] Falha na reconstrução (setores corrompidos). Tente novamente.'); return; }
    const outName = fname.replace(/\.del$/, '') + '.recuperado.txt';
    const r = S().writeFile(joinPath('/home/user/downloads', outName), src.recovered || '(vazio)', { size: 220 * 1000 });
    if (!r.ok) return out('err', `[ERRO] ${r.msg}`);
    out('ok', `[OK] Arquivo restaurado: ~/downloads/${outName}`);
    S().emit({ type: 'recover', target: fname });
  } });
def({ name: 'decrypt', group: 'Análise', summary: 'Descriptografa um arquivo (minigame de criptografia)', usage: 'decrypt <arquivo|desafio>',
  run: async (p) => {
    const d = D();
    const a = p.args[0];
    if (!a) {
      const enc = Object.entries(d.fs).filter(([, e]) => e.encrypted);
      if (!enc.length) return out('dim', 'Nenhum arquivo cifrado em seu computador.');
      out('info', 'Arquivos cifrados:');
      enc.forEach(([, e]) => out('out', `  🔒 ${e.name}`));
      return;
    }
    if (a.startsWith('ch_') || a.startsWith('gen:')) {
      const ch = resolveChallenge(a);
      if (ch?.mg === 'cipher') return runChallenge(a);
      return out('err', 'decrypt: esse desafio não é de criptografia.');
    }
    const le = localEntry(a);
    if (!le || le.e.type !== 'file') {
      if (d.node && remoteFile(a)?.encrypted) return out('err', `decrypt: baixe o arquivo antes (download ${a}).`);
      return out('err', `decrypt: ${a}: arquivo inexistente.`);
    }
    if (!le.e.encrypted) return out('warn', `${le.e.name} não está cifrado.`);
    const enc = le.e.encrypted;
    const res = await runChallengeAndWait(enc.challenge);
    if (res?.win) {
      S().patch((x) => ({ fs: { ...x.fs, [le.path]: { ...x.fs[le.path], content: enc.plain, encrypted: undefined, size: Math.max(2, Math.ceil(enc.plain.length / 80)) } } }));
      out('ok', `[DECRYPT] ${le.e.name} descriptografado. Conteúdo:`);
      out('hl', enc.plain);
      S().emit({ type: 'decrypt', target: le.e.name });
    } else if (res) out('err', '[DECRYPT] Falha. O arquivo continua cifrado — tente de novo.');
  } });
async function runChallengeAndWait(id: string) {
  const d = D();
  const ch = resolveChallenge(id);
  if (!ch) { out('err', `[ERRO] Desafio ${id} não encontrado.`); return null; }
  if (!mgSkillOk(d, ch)) { out('err', `[BLOQUEADO] Exige ${ch.minSkill!.skill} rank ${ch.minSkill!.rank}.`); return null; }
  S().setBusy(true);
  out('info', `[DESAFIO] ${ch.name}`);
  const p = S().startMinigame(id, 'terminal');
  if (!p) { S().setBusy(false); return null; }
  const r = await p;
  S().setBusy(false);
  return r;
}
def({ name: 'run', aliases: ['challenge'], group: 'Desafios', summary: 'Executa um desafio de segurança de um alvo', usage: 'run <id-do-desafio>',
  run: async (p) => { if (!p.args[0]) return out('err', 'run: informe o id (use "challenges <alvo>").'); await runChallenge(p.args[0]); } });
def({ name: 'challenges', group: 'Desafios', summary: 'Lista desafios de um alvo', usage: 'challenges [alvo]',
  run: (p) => {
    const d = D();
    const id = p.args[0] ? findNode(p.args[0]) : d.node;
    if (!id) return p.args[0] ? unknownNode(p.args[0]) : out('err', 'challenges: informe um alvo ou conecte-se.');
    const n = NODE_MAP[id];
    if (!(id in d.scanned) && d.node !== id) return out('err', `Escaneie ${id} primeiro (scan ${id}).`);
    out('hl', `Desafios de ${id}:`);
    if (!n.challenges.length) return out('dim', '  (nenhum)');
    n.challenges.forEach((c) => {
      const ch = CHALLENGE_MAP[c];
      const dn = d.chDone[c];
      out(dn ? 'ok' : 'out', `  ${c.padEnd(22)} [${ch.mg}] dif ${ch.diff}/5  ${dn ? `✔ melhor ${dn.best}` : '—'}  ${ch.name}${ch.minSkill && !mgSkillOk(d, ch) ? `  🔒 ${ch.minSkill.skill} ${ch.minSkill.rank}` : ''}`);
    });
  } });
for (const [alias, mg, label] of [['logs', 'logs', 'análise de logs'], ['investigate', 'investigation', 'investigação digital'], ['pattern', 'pattern', 'padrões'], ['auth', 'auth', 'autenticação'], ['resources', 'resources', 'recursos']] as const) {
  def({ name: alias, group: 'Desafios', summary: `Abre o desafio de ${label} do alvo conectado`, usage: `${alias} [id-do-desafio]`,
    run: async (p) => {
      const d = D();
      const id = p.args[0] || (d.node ? NODE_MAP[d.node].challenges.find((c) => CHALLENGE_MAP[c].mg === mg) : undefined);
      if (!id) return out('err', `${alias}: conecte-se a um alvo com desafio de ${label} ou informe o id.`);
      const ch = resolveChallenge(id);
      if (!ch || ch.mg !== mg) return out('err', `${alias}: "${id}" não é um desafio de ${label}.`);
      await runChallenge(id);
    } });
}
def({ name: 'firewall', aliases: ['fw'], group: 'Desafios', summary: 'Abre o desafio de firewall do alvo conectado', usage: 'firewall [id-do-desafio]',
  run: async (p) => {
    const d = D();
    const id = p.args[0] || (d.node ? NODE_MAP[d.node].challenges.find((c) => CHALLENGE_MAP[c].mg === 'firewall') : undefined);
    if (!id) {
      out('hl', 'Firewall local: ATIVO');
      out('out', `Regras: política padrão DROP · 3 regras (22/tcp interno, 443/tcp, ICMP limitado)`);
      out('dim', 'Conecte-se a um alvo com desafio de firewall e rode "firewall" para configurar o dele.');
      return;
    }
    const ch = resolveChallenge(id);
    if (!ch || ch.mg !== 'firewall') return out('err', `firewall: "${id}" não é um desafio de firewall.`);
    await runChallenge(id);
  } });
def({ name: 'monitor', aliases: ['top', 'ps'], group: 'Análise', summary: 'Monitor de recursos e tráfego (CyberCore OS+)', usage: 'monitor',
  run: async () => {
    const d = D();
    if (d.hw.os < 1) return out('err', '[ERRO] Monitor indisponível no LegacyOS. Atualize para CyberCore OS 2.0 (Mercado → Software).');
    out('hl', '=== MONITOR (5 amostras) ===');
    for (let i = 0; i < 5; i++) {
      const m = S().metrics;
      out('out', `CPU [${bar(m.cpu[m.cpu.length - 1], 16)}] ${m.cpu[m.cpu.length - 1].toFixed(0).padStart(3)}%   RAM [${bar(m.ram[m.ram.length - 1], 16)}] ${m.ram[m.ram.length - 1].toFixed(0).padStart(3)}%   NET ${m.net[m.net.length - 1].toFixed(1)} Mb/s   ${m.temp.toFixed(0)}°C`);
      await sleep(550);
    }
    if (toolLv(d, 'netvision') >= 2) {
      out('info', 'NetVision — tráfego por nó conhecido:');
      d.discovered.slice(0, 6).forEach((n) => out('dim', `  ${n.padEnd(20)} ${(Math.random() * 20).toFixed(1)} Mb/s`));
    }
    S().emit({ type: 'monitor' });
  } });

def({ name: 'mission', aliases: ['m'], group: 'Missões', summary: 'Gerencia missões (list | info | start | submit | abort)', usage: 'mission [list|info|start <id>|submit|abort]',
  run: (p) => {
    const d = D();
    const sub = (p.args[0] || 'info').toLowerCase();
    const norm = (x: string) => (/^\d+$/.test(x) ? 'M-' + x.padStart(3, '0') : /^m-?\d+$/i.test(x) ? 'M-' + x.replace(/\D/g, '').padStart(3, '0') : x);
    if (sub === 'list') {
      out('hl', '=== MISSÕES ===');
      const all = [...Object.values(MISSION_MAP), ...d.contracts.map((c) => c.mission)];
      all.forEach((m) => {
        const st = d.missions[m.id]?.status;
        if (m.requires.offered && !d.offered.includes(m.id)) return;
        if (!m.generated && !(m.requires.completed ?? []).every((c) => d.missions[c]?.status === 'completed') && st !== 'active') return;
        const ok = missionUnlocked(d, m);
        out(st === 'completed' ? 'dim' : st === 'active' ? 'ok' : ok ? 'out' : 'warn', `${m.id.padEnd(8)} ${m.difficulty.padEnd(13)} ${(st === 'completed' ? '✔ concluída' : st === 'active' ? '▶ ativa' : st === 'failed' ? '↻ refazer' : ok ? 'disponível' : '🔒 bloqueada').padEnd(13)} ${m.title} — ${m.reward.money} cr`);
      });
      return;
    }
    if (sub === 'start') {
      const id = norm(p.args[1] || '');
      if (!id) return out('err', 'Uso: mission start <id>');
      const r = S().startMission(id);
      if (!r.ok) {
        out('err', `[ERRO] ${r.msg}`);
        const m = getMission(d, id);
        if (m) reqLines(d, m).filter((l) => !l.ok).forEach((l) => out('warn', `  ✘ ${l.label}`));
      }
      return;
    }
    if (sub === 'submit' || sub === 'entregar') {
      if (!d.active) return out('err', 'Nenhuma missão ativa.');
      const m = getMission(d, d.active)!;
      const rec = d.missions[d.active];
      const obj = m.objectives[rec.objIdx];
      if (obj.match.type !== 'submit') return out('warn', `[PENDENTE] Ainda falta: ${obj.text}  (dica: ${obj.hint})`);
      S().emit({ type: 'submit' });
      return;
    }
    if (sub === 'abort' || sub === 'abandon') {
      if (!d.active) return out('err', 'Nenhuma missão ativa.');
      S().abandonMission();
      return out('warn', 'Missão abandonada (−2 reputação se havia progresso).');
    }
    const id = sub === 'info' ? d.active : norm(sub);
    const m = id ? getMission(d, id) : null;
    if (!m) return out('dim', sub === 'info' ? 'Nenhuma missão ativa. Use "mission list" e "mission start <id>".' : `Missão "${sub}" não encontrada.`);
    const rec = d.missions[m.id];
    out('hl', `${m.id} — ${m.title}  [${m.difficulty}]`);
    out('out', `Cliente: ${m.client}${m.org ? ` (${m.org})` : ''}  ·  Recompensa: ${m.reward.money} cr · ${m.reward.xp} XP · ${m.reward.rep >= 0 ? '+' : ''}${m.reward.rep} rep  ·  Tempo: ${m.eta}`);
    out('dim', m.description);
    m.objectives.forEach((o, i) => {
      const done = rec?.status === 'completed' || (rec?.status === 'active' && i < rec.objIdx);
      const cur = rec?.status === 'active' && i === rec.objIdx;
      out(done ? 'ok' : cur ? 'hl' : 'dim', `  ${done ? '[x]' : cur ? '[>]' : '[ ]'} ${o.text}${cur ? `   ← ${o.hint}` : ''}`);
    });
    if (rec?.deadline && rec.status === 'active') out('warn', `Tempo restante: ${Math.max(0, Math.round((rec.deadline - Date.now()) / 1000))}s`);
  } });

def({ name: 'profile', group: 'Conta', summary: 'Informações da sua conta', usage: 'profile',
  run: () => {
    const d = D();
    const r = repRank(d.rep);
    const nr = nextRank(d.rep);
    out('hl', `=== PERFIL: ${d.name}${d.title ? ' «' + d.title + '»' : ''} ===`);
    out('out', `Nível ${d.level}   XP [${bar((d.xp / xpToNext(d.level)) * 100, 20)}] ${d.xp}/${xpToNext(d.level)}`);
    out('out', `Reputação: ${d.rep} — ${r.name}${nr ? `  (próximo: ${nr.name} em ${nr.min})` : '  (máxima)'}`);
    out('out', `Habilidades: ${SKILLS.map((s) => `${s.name} ${d.skills[s.id]}`).join(' · ')}`);
    out('out', `Missões concluídas: ${d.stats.missionsDone}   Conquistas: ${Object.keys(d.ach).length}   Contatos: ${d.contactsUnlocked.length}`);
    if (d.skillPoints) out('warn', `Pontos de habilidade disponíveis: ${d.skillPoints}`);
  } });
def({ name: 'wallet', aliases: ['balance'], group: 'Conta', summary: 'Saldo e movimentação', usage: 'wallet',
  run: () => {
    const d = D();
    out('hl', '=== CARTEIRA ===');
    out('ok', `Saldo atual     : ${d.money} cr`);
    out('out', `Total ganho     : ${d.stats.moneyEarned} cr`);
    out('out', `Total gasto     : ${d.stats.moneySpent} cr`);
    Object.entries(d.sales).filter(([, s]) => s.until > Date.now()).forEach(([id, s]) => out('info', `Promoção: ${SHOP_MAP[id]?.name} -${s.pct * 100}% (${Math.round((s.until - Date.now()) / 1000)}s)`));
  } });
def({ name: 'tools', aliases: ['inventory', 'inv'], group: 'Conta', summary: 'Suas ferramentas instaladas', usage: 'tools',
  run: () => {
    const d = D();
    out('hl', '=== FERRAMENTAS ===');
    Object.entries(d.tools).filter(([, l]) => l > 0).forEach(([id, l]) => {
      const t = TOOL_MAP[id];
      out('out', `  ${t.name.padEnd(13)} nv.${l}/${t.maxLevel}  [${t.category}]  ${t.features[l - 1][0]}`);
    });
    const others = d.inv.filter((i) => !i.startsWith('hw_'));
    if (others.length) out('dim', `Itens: ${others.map((i) => SHOP_MAP[i]?.name ?? i).join(', ')}`);
  } });
def({ name: 'skills', group: 'Conta', summary: 'Árvore de habilidades', usage: 'skills',
  run: () => { const d = D(); SKILLS.forEach((s) => out('out', `  ${s.name.padEnd(15)} ${'■'.repeat(d.skills[s.id])}${'□'.repeat(5 - d.skills[s.id])}  ${d.skills[s.id] ? s.ranks[d.skills[s.id] - 1] : '—'}`)); out('dim', `Pontos disponíveis: ${d.skillPoints} (use a aba HABILIDADES)`); } });
def({ name: 'contacts', aliases: ['msgs'], group: 'Conta', summary: 'Lista contatos e mensagens novas', usage: 'contacts',
  run: () => {
    const d = D();
    CONTACTS.filter((c) => d.contactsUnlocked.includes(c.id)).forEach((c) => {
      const unread = (d.threads[c.id] || []).filter((m) => m.from === 'them' && !m.read).length;
      out(unread ? 'warn' : 'out', `  ${c.id === 'morpheus' && !d.flags.morpheus_revealed ? '???' : c.name}`.padEnd(14) + ` ${c.specialty}${unread ? `  (${unread} nova(s)${d.pending[c.id] ? ', aguarda resposta' : ''})` : ''}`);
    });
    out('dim', 'Responda mensagens na aba CONTATOS.');
  } });
def({ name: 'shop', aliases: ['market'], group: 'Economia', summary: 'Lista itens do mercado', usage: 'shop [categoria]',
  run: (p) => {
    const d = D();
    const cat = p.args[0]?.toLowerCase();
    out('hl', 'ID                      PREÇO   ITEM');
    SHOP.filter((i) => !cat || i.cat.toLowerCase().startsWith(cat)).filter((i) => !(i.once && d.inv.includes(i.id)) && (i.kind !== 'hw' || (i.hw && i.hw.tier === d.hw[i.hw.slot] + 1))).slice(0, 40).forEach((i) => {
      const locked = (i.levelReq ?? 0) > d.level;
      out(locked ? 'dim' : 'out', `${i.id.padEnd(23)} ${String(itemPrice(d, i)).padStart(6)}  ${i.name}${locked ? `  🔒 nível ${i.levelReq}` : ''}`);
    });
    out('dim', 'Use "buy <id>" para comprar.');
  } });
def({ name: 'buy', group: 'Economia', summary: 'Compra um item do mercado', usage: 'buy <id>',
  run: (p) => {
    if (!p.args[0]) return out('err', 'buy: informe o id (veja "shop").');
    const id = SHOP_MAP[p.args[0]] ? p.args[0] : Object.keys(SHOP_MAP).find((k) => k === 'tool_' + p.args[0].toLowerCase());
    if (!id) return out('err', `buy: item "${p.args[0]}" não encontrado.`);
    const r = S().buy(id);
    out(r.ok ? 'ok' : 'err', r.msg);
  } });
def({ name: 'repair', group: 'Economia', summary: 'Repara superaquecimento (60 cr)', usage: 'repair',
  run: () => { const r = S().repair(); out(r.ok ? 'ok' : 'warn', r.msg); } });
def({ name: 'save', group: 'Sistema', summary: 'Salva o progresso manualmente', usage: 'save [1|2|3]',
  run: (p) => { const slot = ['1', '2', '3'].includes(p.args[0]) ? p.args[0] : '1'; const okS = S().saveSlot(slot); out(okS ? 'ok' : 'err', okS ? `Progresso salvo no slot ${slot}.` : 'Falha ao salvar.'); } });
def({ name: 'sudo', group: 'Sistema', summary: '(sem efeito)', usage: 'sudo', run: () => out('warn', 'sudo: este é um ambiente de simulação — permissões já são tudo que você tem... e só dentro do jogo. 😉') });

export const COMMANDS = cmds;
export const COMMAND_NAMES = cmds.flatMap((c) => [c.name, ...(c.aliases ?? [])].filter((n) => n !== '?'));

// ---------------------------------------------------------------- execução
export async function execute(line: string) {
  const s = S();
  const d = D();
  const prompt = promptText();
  s.print('in', line, prompt);
  s.recordCommand(line);
  const p = parse(line);
  if (!p.cmd) return;
  const c = cmds.find((x) => x.name === p.cmd || x.aliases?.includes(p.cmd));
  if (!c) {
    s.print('err', `bash: ${p.cmd}: comando não encontrado.`);
    const sug = COMMAND_NAMES.filter((n) => lev(n, p.cmd) <= 2).slice(0, 3);
    if (sug.length) s.print('dim', `Você quis dizer: ${sug.join(', ')}?`);
    else s.print('dim', 'Digite "help" para ver os comandos disponíveis.');
    audio.play('error');
    return;
  }
  s.setBusy(true);
  try {
    await c.run(p);
  } catch (e) {
    s.print('err', `[ERRO INTERNO] ${(e as Error).message}`);
  } finally {
    s.setBusy(false);
  }
  void d;
}

// ---------------------------------------------------------------- autocompletar
export function complete(line: string): string[] {
  const d = gt().data;
  if (!d) return [];
  const endsSpace = /\s$/.test(line);
  const toks = line.trimStart().split(/\s+/);
  if (toks.length === 1 && !endsSpace) {
    const q = toks[0].toLowerCase();
    return [...new Set(COMMAND_NAMES)].filter((n) => n.startsWith(q)).sort();
  }
  const cmd = toks[0].toLowerCase();
  const cur = endsSpace ? '' : toks[toks.length - 1];
  const argIndex = endsSpace ? toks.length - 1 : toks.length - 2;
  const nodeIds = d.discovered.filter((n) => NODE_MAP[n]);
  let pool: string[] = [];
  if (['scan', 'inspect', 'connect', 'ssh', 'ping', 'challenges'].includes(cmd)) pool = nodeIds;
  else if (['cat', 'download', 'get', 'analyze', 'recover', 'decrypt', 'rm', 'type', 'read', 'ls', 'cd'].includes(cmd)) {
    if (d.node) pool = NODE_MAP[d.node].files.map((f) => f.name);
    else pool = Object.entries(d.fs).filter(([path]) => parentOf(path) === d.cwd || cur.includes('/')).map(([, e]) => e.name);
    if (['analyze', 'decrypt', 'recover'].includes(cmd)) pool = [...pool, ...Object.values(d.fs).filter((e) => e.type === 'file').map((e) => e.name)];
    if (cmd === 'decrypt') pool.push(...Object.keys(CHALLENGE_MAP).filter((c) => CHALLENGE_MAP[c].mg === 'cipher'));
  } else if (cmd === 'mission' || cmd === 'm') {
    pool = argIndex === 0 ? ['list', 'info', 'start', 'submit', 'abort'] : Object.keys(MISSION_MAP).concat(d.contracts.map((c) => c.mission.id));
  } else if (cmd === 'run' || cmd === 'challenge') pool = nodeIds.flatMap((n) => NODE_MAP[n].challenges);
  else if (['logs', 'investigate', 'pattern', 'auth', 'resources', 'firewall', 'fw'].includes(cmd)) pool = nodeIds.flatMap((n) => NODE_MAP[n].challenges);
  else if (cmd === 'buy') pool = SHOP.map((i) => i.id);
  else if (cmd === 'help' || cmd === 'man') pool = COMMAND_NAMES;
  else if (cmd === 'shop') pool = ['hardware', 'software', 'ferramentas', 'cursos', 'melhorias', 'cosméticos'];
  const res = [...new Set(pool)].filter((x) => x.toLowerCase().startsWith(cur.toLowerCase())).sort();
  return res;
}

export const _refs = { HW_LABEL, HW_TABLES, REP_RANKS, MISSION_MAP };
