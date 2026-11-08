import type { SkillId } from '../types';
import type { GameData } from '../state';

export const MAX_LEVEL = 30;
export const xpToNext = (level: number) => Math.round(60 + 40 * level + 14 * level * level);

export const REP_RANKS = [
  { name: 'Desconhecido', min: 0, color: '#6F8580' },
  { name: 'Novato', min: 40, color: '#DCE7E3' },
  { name: 'Técnico', min: 150, color: '#00CFFF' },
  { name: 'Especialista', min: 400, color: '#00FF88' },
  { name: 'Profissional', min: 900, color: '#FFC857' },
  { name: 'Elite', min: 1800, color: '#FF8A3B' },
  { name: 'Lenda digital', min: 3200, color: '#FF3B3B' },
];
export const REP_MAX = 4000;
export const repRank = (rep: number) => [...REP_RANKS].reverse().find((r) => rep >= r.min) || REP_RANKS[0];
export const repRankIndex = (rep: number) => REP_RANKS.findIndex((r) => r === repRank(rep));
export const nextRank = (rep: number) => REP_RANKS[repRankIndex(rep) + 1];
// bônus de contrato por reputação: +4% por rank
export const repPayBonus = (rep: number) => 1 + repRankIndex(rep) * 0.04;

export interface SkillDef {
  id: SkillId;
  name: string;
  icon: string;
  desc: string;
  ranks: string[];
  spec: string; // especialização no rank 5
  specDesc: string;
}
export const SKILLS: SkillDef[] = [
  { id: 'analysis', name: 'ANÁLISE', icon: 'ChartLine', desc: 'Interpretar dados e logs com precisão.', ranks: [
    'Logs: 1 dica de linha-chave por análise', 'Logs: filtros avançados · Padrões: +4s por rodada', 'Logs: 2 dicas · analyze revela notas ocultas', 'Logs: 3 dicas · +10% de recompensa em análises', 'Logs: 4 dicas · Padrões: +8s por rodada'],
    spec: 'Analista Sênior', specDesc: '+20% de dinheiro em desafios de logs e padrões.' },
  { id: 'crypto', name: 'CRIPTOGRAFIA', icon: 'KeyRound', desc: 'Cifras, chaves e criptoanálise.', ranks: [
    'Cifras: 1 dica grátis · libera desafios dif. 3', 'Cifras: libera desafios dif. 4 · prévia de substituição', 'Cifras: 2 dicas grátis · libera desafios dif. 5', 'Cifras: sugestão de chave Vigenère', 'Cifras: erros custam menos pontos'],
    spec: 'Criptoanalista', specDesc: '+20% de dinheiro em desafios de cifra.' },
  { id: 'forensics', name: 'FORENSE', icon: 'Search', desc: 'Investigar arquivos, evidências e rastros.', ranks: [
    'Investigação: destaca 1 trecho-chave', 'recover: sucesso garantido em arquivos pequenos', 'Investigação: destaca 2 trechos-chave', 'Investigação: +1 tentativa de resposta', 'Investigação: destaca todos os trechos-chave'],
    spec: 'Perito Digital', specDesc: '+20% de dinheiro em investigações e recuperações.' },
  { id: 'infra', name: 'INFRAESTRUTURA', icon: 'Server', desc: 'Otimizar computadores e redes.', ranks: [
    'Recursos: +5% de capacidade · -3% em hardware', 'Recursos: +10% · -6% em hardware', 'Recursos: +15% · -9% em hardware', 'Recursos: +20% · -12% em hardware', 'Recursos: +25% · -15% em hardware'],
    spec: 'Arquiteto de Sistemas', specDesc: 'Tarefas do terminal 25% mais rápidas.' },
  { id: 'security', name: 'SEGURANÇA', icon: 'ShieldCheck', desc: 'Defesa, auditoria e endurecimento.', ranks: [
    'Firewall: +1 tentativa', 'Autenticação: +1 tentativa · Firewall: dica de regra', 'Firewall: +2 tentativas · +4% em missões defensivas', 'Autenticação: +2 tentativas · +8% defensivas', 'Firewall: pontuação perfeita facilitada'],
    spec: 'Guardião', specDesc: '+20% de dinheiro em firewall e autenticação.' },
];
export const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const skillCost = (currentRank: number) => currentRank + 1;

export interface AchDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  reward: { xp: number; money: number };
  check: (s: GameData) => boolean;
}
const doneAll = (s: GameData, ids: string[]) => ids.every((i) => s.missions[i]?.status === 'completed');
const toolCount = (s: GameData) => s.stats.toolsBought;
export const ACHIEVEMENTS: AchDef[] = [
  { id: 'first_contact', name: 'Primeiro Contato', desc: 'Complete sua primeira missão.', icon: 'Handshake', reward: { xp: 30, money: 40 }, check: (s) => s.stats.missionsDone >= 1 },
  { id: 'terminal_active', name: 'Terminal Ativo', desc: 'Execute 50 comandos.', icon: 'SquareTerminal', reward: { xp: 40, money: 30 }, check: (s) => s.stats.commands >= 50 },
  { id: 'terminal_master', name: 'Mestre do Shell', desc: 'Execute 500 comandos.', icon: 'Terminal', reward: { xp: 150, money: 120 }, check: (s) => s.stats.commands >= 500 },
  { id: 'analyst', name: 'Analista', desc: 'Complete 10 desafios de análise (logs, investigação, padrões).', icon: 'ChartLine', reward: { xp: 120, money: 100 }, check: (s) => s.stats.analysisWon >= 10 },
  { id: 'specialist', name: 'Especialista', desc: 'Alcance o nível 20.', icon: 'GraduationCap', reward: { xp: 500, money: 500 }, check: (s) => s.level >= 20 },
  { id: 'collector', name: 'Colecionador', desc: 'Compre 10 ferramentas (níveis).', icon: 'Wrench', reward: { xp: 120, money: 150 }, check: (s) => toolCount(s) >= 10 },
  { id: 'legend', name: 'Lenda Digital', desc: 'Alcance a reputação máxima (Lenda digital).', icon: 'Crown', reward: { xp: 1500, money: 3000 }, check: (s) => s.rep >= 3200 },
  { id: 'perfectionist', name: 'Perfeccionista', desc: 'Complete uma missão sem erros.', icon: 'Target', reward: { xp: 80, money: 80 }, check: (s) => s.stats.perfectMissions >= 1 },
  { id: 'first_scan', name: 'Olhos Abertos', desc: 'Faça sua primeira varredura.', icon: 'Radar', reward: { xp: 15, money: 10 }, check: (s) => s.stats.scans >= 1 },
  { id: 'decryptor', name: 'Quebra-Códigos', desc: 'Vença 3 desafios de criptografia.', icon: 'KeyRound', reward: { xp: 60, money: 60 }, check: (s) => (s.stats.mgWon.cipher || 0) >= 3 },
  { id: 'firewall_pro', name: 'Muralha', desc: 'Vença 3 desafios de firewall.', icon: 'ShieldCheck', reward: { xp: 90, money: 90 }, check: (s) => (s.stats.mgWon.firewall || 0) >= 3 },
  { id: 'resource_manager', name: 'Orquestrador', desc: 'Vença 2 desafios de gerenciamento de recursos.', icon: 'Cpu', reward: { xp: 120, money: 120 }, check: (s) => (s.stats.mgWon.resources || 0) >= 2 },
  { id: 'rich', name: 'Cofre Cheio', desc: 'Acumule 10.000 créditos.', icon: 'Coins', reward: { xp: 150, money: 0 }, check: (s) => s.money >= 10000 },
  { id: 'upgrader', name: 'Hardware Faminto', desc: 'Compre 5 upgrades de hardware.', icon: 'Cpu', reward: { xp: 80, money: 50 }, check: (s) => s.inv.filter((i) => i.startsWith('hw_')).length >= 5 },
  { id: 'beginner_done', name: 'Fim do Treino', desc: 'Conclua todas as missões de nível Iniciante.', icon: 'Award', reward: { xp: 100, money: 100 }, check: (s) => doneAll(s, ['M-001', 'M-002', 'M-003', 'M-004', 'M-005', 'M-006']) },
  { id: 'mole_hunter', name: 'Caçador de Toupeiras', desc: 'Exponha o infiltrado da Aegis.', icon: 'Eye', reward: { xp: 200, money: 200 }, check: (s) => s.missions['M-014']?.status === 'completed' },
  { id: 'loyal', name: 'Lealdade', desc: 'Recuse a oferta de VANTA.', icon: 'Shield', reward: { xp: 80, money: 0 }, check: (s) => s.flags.vanta_refused === true },
  { id: 'shadow', name: 'Contratado nas Sombras', desc: 'Aceite o Contrato Sombra de VANTA.', icon: 'Ghost', reward: { xp: 50, money: 0 }, check: (s) => s.flags.vanta_deal === true },
  { id: 'story_end', name: 'Protocolo Encerrado', desc: 'Conclua a campanha principal.', icon: 'Flag', reward: { xp: 1000, money: 2000 }, check: (s) => s.flags.game_complete === true },
  { id: 'tycoon', name: 'Rede Própria', desc: 'Tenha todos os componentes no último nível.', icon: 'Server', reward: { xp: 600, money: 0 }, check: (s) => s.hw.cpu >= 4 && s.hw.ram >= 4 && s.hw.storage >= 4 && s.hw.nic >= 4 && s.hw.os >= 3 },
  { id: 'networked', name: 'Entre Contatos', desc: 'Desbloqueie os quatro contatos.', icon: 'Users', reward: { xp: 90, money: 70 }, check: (s) => s.contactsUnlocked.length >= 4 },
  { id: 'streak10', name: 'Dez Missões', desc: 'Conclua 10 missões ou contratos.', icon: 'ListChecks', reward: { xp: 150, money: 150 }, check: (s) => s.stats.missionsDone >= 10 },
  { id: 'streak30', name: 'Profissional Ativo', desc: 'Conclua 30 missões ou contratos.', icon: 'ListChecks', reward: { xp: 400, money: 500 }, check: (s) => s.stats.missionsDone >= 30 },
];
export const ACH_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
