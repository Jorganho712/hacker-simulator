import type { ChallengeDef, MgId, MissionDef, SkillId } from '../types';
import { caesar, pick, randInt, rng, shuffle, substEncrypt } from '../crypto';
import { CHALLENGE_MAP, NODES } from './world';
import type { CipherPuzzle } from './puzzles';

// Contratos procedurais repetíveis: dão dinheiro e XP, e movimentam a economia.
// Cada contrato = 1 desafio gerado de forma determinística a partir da referência "gen:<mg>:<seed>:<diff>".

const CLIENTS = ['Atlas Seguros', 'Nimbus Cloud', 'Prisma Educação', 'Estaleiro Vega', 'Café Quântico', 'Radar Notícias', 'Fábrica Pétalas', 'Lumen Energia', 'Porto Seco S.A.', 'Clínica Horizonte', 'Mercadinho Sol', 'Biblioteca Municipal'];
const WORDS = ['FIREWALL', 'PROTOCOLO', 'CRIPTOGRAFIA', 'SERVIDOR', 'AUDITORIA', 'TERMINAL', 'GATEWAY', 'PACOTE', 'ROTEADOR', 'SENHA', 'REDE', 'BACKUP', 'ANTIVIRUS', 'SESSAO', 'CERTIFICADO', 'CHAVE', 'SANDBOX', 'ENDPOINT'];
const PHRASES = [
  'O RELATORIO DE AUDITORIA ESTA PRONTO PARA ENTREGA',
  'ATUALIZE OS SERVIDORES ANTES DO FIM DE SEMANA',
  'A SENHA DO ADMINISTRADOR PRECISA SER TROCADA HOJE',
  'NENHUM ACESSO SUSPEITO FOI REGISTRADO NA MADRUGADA',
  'O BACKUP SEMANAL FOI CONCLUIDO COM SUCESSO',
  'REVISE AS REGRAS DO FIREWALL ANTES DA FISCALIZACAO',
  'A EQUIPE DE SEGURANCA ESTARA DE PLANTAO NESTA NOITE',
  'USE SEMPRE AUTENTICACAO EM DOIS FATORES NAS CONTAS CRITICAS',
];

export interface GenParams { mg: MgId; seed: number; diff: number }
export const genRef = (mg: MgId, seed: number, diff: number) => `gen:${mg}:${seed}:${diff}`;
export function parseGen(ref: string): GenParams | null {
  const m = /^gen:(\w+):(\d+):(\d+)$/.exec(ref);
  return m ? { mg: m[1] as MgId, seed: +m[2], diff: +m[3] } : null;
}

function genCipher(seed: number, diff: number): CipherPuzzle[] {
  const r = rng(seed);
  const out: CipherPuzzle[] = [];
  const n = diff >= 4 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const t = r();
    if (diff <= 2 || t < 0.35) {
      const sh = randInt(r, 2, 12);
      const plain = pick(r, PHRASES);
      out.push({ id: `g${seed}_${i}`, kind: 'caesar', title: 'César', prompt: 'Decifre a mensagem do cliente (deslocamento fixo).', cipher: caesar(plain, sh), answer: plain, hints: [`A mensagem contém a palavra ${plain.split(' ')[0]}.`, `Deslocamento menor que 13.`, `Deslocamento: ${sh}.`], shift: sh, crib: plain.split(' ')[0] });
    } else if (t < 0.6) {
      const start = randInt(r, 2, 9); const step = randInt(r, 2, 6);
      const seqn = Array.from({ length: 5 }, (_, k) => start + k * step);
      const geo = r() < 0.5 && diff >= 3;
      const seq = geo ? Array.from({ length: 5 }, (_, k) => 2 * Math.pow(3, k)) : seqn;
      const next = geo ? 2 * Math.pow(3, 5) : start + 5 * step;
      out.push({ id: `g${seed}_${i}`, kind: 'sequence', title: 'Sequência', prompt: 'Qual é o próximo número?', cipher: seq.join(', ') + ', ?', answer: String(next), hints: ['Compare termos consecutivos.', geo ? 'Cada termo multiplica pelo mesmo fator.' : 'A diferença é constante.', `Resposta: ${next}.`] });
    } else if (t < 0.8) {
      const w = pick(r, WORDS);
      const sc = shuffle(r, w.split('')).join(' ');
      out.push({ id: `g${seed}_${i}`, kind: 'word', title: 'Anagrama', prompt: 'Reorganize as letras: palavra de segurança digital.', cipher: sc, answer: w, hints: [`Começa com ${w[0]}.`, `Tem ${w.length} letras.`, `Resposta: ${w}.`] });
    } else {
      const key = shuffle(r, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).join('');
      const plain = pick(r, PHRASES);
      out.push({ id: `g${seed}_${i}`, kind: 'subst', title: 'Substituição', prompt: 'Cada letra foi trocada por outra. Use frequência e contexto.', cipher: substEncrypt(plain, key), answer: plain, hints: [`A primeira palavra é ${plain.split(' ')[0]}.`, `A última palavra é ${plain.split(' ').pop()}.`, `Texto: ${plain}`], crib: plain.split(' ')[0] });
    }
  }
  return out;
}

export function resolveChallenge(ref: string): ChallengeDef | null {
  if (CHALLENGE_MAP[ref]) return CHALLENGE_MAP[ref];
  const g = parseGen(ref);
  if (!g) return null;
  const node = NODES.filter((n) => n.security <= Math.max(1, g.diff))[g.seed % Math.max(1, NODES.filter((n) => n.security <= Math.max(1, g.diff)).length)] || NODES[0];
  const titles: Record<MgId, string> = {
    cipher: 'Criptografia sob demanda', logs: 'Análise de logs sob demanda', firewall: 'Configuração de firewall sob demanda',
    investigation: 'Investigação sob demanda', pattern: 'Reconhecimento de padrões', auth: 'Recuperação de acesso', resources: 'Otimização de recursos',
  };
  const params: any =
    g.mg === 'cipher' ? { puzzles: [], inline: genCipher(g.seed, g.diff) }
    : g.mg === 'logs' ? { scenario: ['bruteforce', 'exfil', 'insider'][g.seed % 3], seed: g.seed, lines: 110 + g.diff * 25, node: node.id }
    : g.mg === 'firewall' ? { scenario: ['clinic', 'office', 'bank', 'grid'][Math.min(3, Math.max(0, g.diff - 1))], seed: g.seed, attempts: 4 }
    : g.mg === 'pattern' ? { seed: g.seed, rounds: 5 + Math.min(2, g.diff > 3 ? 2 : 0) }
    : g.mg === 'auth' ? { seed: g.seed, digits: Math.min(6, 3 + g.diff), attempts: 6 + (g.diff > 3 ? 1 : 0) }
    : g.mg === 'investigation' ? { scenario: ['inv_obsidian', 'inv_ghost', 'inv_mole'][g.seed % 3] }
    : { scenario: g.diff >= 4 ? 'res_grid' : 'res_train' };
  return { id: ref, node: node.id, name: titles[g.mg], mg: g.mg, diff: g.diff, desc: 'Contrato gerado.', params, reward: { money: 40 + g.diff * 35, xp: 25 + g.diff * 25 }, contract: true };
}

const MG_FOR_SKILL: Record<SkillId, MgId[]> = { analysis: ['logs', 'pattern'], crypto: ['cipher'], forensics: ['investigation'], infra: ['resources'], security: ['firewall', 'auth'] };
const MG_LABEL: Record<MgId, string> = { cipher: 'Criptografia', logs: 'Análise de logs', firewall: 'Firewall', investigation: 'Investigação', pattern: 'Padrões', auth: 'Autenticação', resources: 'Recursos' };
export const MG_NAMES = MG_LABEL;
export const MG_SKILL: Record<MgId, SkillId> = { cipher: 'crypto', logs: 'analysis', firewall: 'security', investigation: 'forensics', pattern: 'analysis', auth: 'security', resources: 'infra' };

export function generateContract(level: number, os: number, special = false, seed = Math.floor(Math.random() * 1e6)): MissionDef {
  const r = rng(seed);
  const available: MgId[] = ['cipher', 'logs', 'firewall', 'pattern', 'auth', 'investigation'];
  if (os >= 1) available.push('resources');
  const mgId = pick(r, available);
  const diff = Math.max(1, Math.min(5, Math.round(1 + (level - 1) / 4 + (r() < 0.3 ? 1 : 0) + (special ? 1 : 0))));
  const ref = genRef(mgId, seed, diff);
  const difficulty = (['Iniciante', 'Iniciante', 'Intermediário', 'Avançado', 'Especialista', 'Especialista'] as const)[diff];
  const mult = special ? 1.7 : 1;
  const money = Math.round((60 + diff * 55 + level * 14) * mult / 5) * 5;
  const xp = Math.round((40 + diff * 35 + level * 6) * mult);
  const client = pick(r, CLIENTS);
  const node = resolveChallenge(ref)!.node;
  return {
    id: `C-${seed}`,
    title: `${special ? 'Especial: ' : ''}${MG_LABEL[mgId]} — ${client}`,
    client, org: client, difficulty, category: 'Contrato avulso', generated: true,
    description: `${client} precisa de um serviço de ${MG_LABEL[mgId].toLowerCase()} num ambiente de laboratório (${node}).`,
    briefing: [`Contrato avulso de ${client}.`, `Conecte-se ao ambiente, execute o desafio (${ref}) e entregue o relatório.`],
    objectives: [
      { id: 'mg', text: `Concluir o desafio de ${MG_LABEL[mgId].toLowerCase()} (dif. ${diff})`, hint: `run ${ref}`, match: { type: 'mg', ref } },
      { id: 'submit', text: 'Entregar o relatório ao cliente', hint: 'mission submit', match: { type: 'submit' } },
    ],
    reward: { money, xp, rep: 3 + diff * 3 + (special ? 6 : 0) },
    eta: `${5 + diff * 3} min`,
    requires: { level: Math.max(1, level - 2) },
    consequences: { success: 'Cliente satisfeito. Dinheiro e reputação.', failure: 'Cliente decepcionado; pagamento reduzido.' },
  };
}
