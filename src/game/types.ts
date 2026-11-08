// Tipos centrais do HACKER SIMULATOR. Tudo aqui é ficção: alvos, dados e serviços são locais.

export type SkillId = 'analysis' | 'crypto' | 'forensics' | 'infra' | 'security';
export type MgId = 'cipher' | 'logs' | 'firewall' | 'investigation' | 'pattern' | 'auth' | 'resources';
export type Difficulty = 'Iniciante' | 'Intermediário' | 'Avançado' | 'Especialista';
export type ToolCategory =
  | 'Diagnóstico'
  | 'Análise'
  | 'Criptografia'
  | 'Monitoramento'
  | 'Forense digital'
  | 'Segurança'
  | 'Administração de sistemas';

export type ScreenId =
  | 'dashboard'
  | 'terminal'
  | 'missions'
  | 'network'
  | 'tools'
  | 'files'
  | 'computer'
  | 'market'
  | 'contacts'
  | 'skills'
  | 'stats'
  | 'settings';

// ---------- Eventos de jogo (usados para cumprir objetivos de missão) ----------
export type GameEventType =
  | 'scan'
  | 'connect'
  | 'inspect'
  | 'cat'
  | 'download'
  | 'analyze'
  | 'decrypt'
  | 'recover'
  | 'monitor'
  | 'mg'
  | 'submit'
  | 'choice'
  | 'buy';

export interface GameEvent {
  type: GameEventType;
  target?: string; // nó ou arquivo
  ref?: string; // id de desafio / escolha / item
  win?: boolean;
}

export interface ObjectiveDef {
  id: string;
  text: string;
  hint: string;
  match: { type: GameEventType; target?: string; ref?: string };
  tool?: string; // ferramenta necessária (informativo / validado nos comandos)
}

export interface MissionRequires {
  level?: number;
  rep?: number;
  tools?: string[];
  completed?: string[];
  flags?: string[];
  offered?: boolean; // precisa ter sido oferecida por contato/evento
  os?: number;
}

export interface MissionOnComplete {
  flags?: Record<string, boolean | string | number>;
  messages?: { contact: string; node: string }[];
  offer?: string[];
  reveal?: string[]; // nós a descobrir
  files?: { path: string; name: string; content: string }[];
  unlockContacts?: string[];
  note?: string;
}

export interface MissionDef {
  id: string;
  title: string;
  client: string;
  org?: string;
  difficulty: Difficulty;
  category: string;
  description: string;
  briefing: string[];
  objectives: ObjectiveDef[];
  reward: { money: number; xp: number; rep: number };
  eta: string;
  requires: MissionRequires;
  consequences: { success: string; failure: string };
  onComplete?: MissionOnComplete;
  timeLimit?: number; // segundos reais
  maxErrors?: number;
  story?: boolean;
  generated?: boolean;
  expiresAt?: number;
}

export interface MissionRecord {
  status: 'active' | 'completed' | 'failed';
  objIdx: number;
  errors: number;
  attempts: number;
  startedAt: number;
  deadline?: number;
  completedAt?: number;
  payout?: number;
  perfect?: boolean;
}

// ---------- Mundo ----------
export interface ServiceDef {
  port: number;
  name: string;
  version: string;
  state: 'open' | 'filtered' | 'closed';
  note?: string; // visível em inspect com ferramenta nível 2+
  vuln?: string; // visível em inspect
}

export interface FileDef {
  name: string;
  content: string;
  size?: number; // KB
  encrypted?: { challenge: string; plain: string };
  analysis?: string[];
  recoverable?: boolean; // precisa de `recover` antes de ler
  recovered?: string;
  malicious?: boolean;
}

export interface ChallengeDef {
  id: string;
  node: string;
  name: string;
  mg: MgId;
  diff: number; // 1..5
  desc: string;
  params?: any;
  reward: { money: number; xp: number };
  minSkill?: { skill: SkillId; rank: number };
  contract?: boolean; // repetível (contratos)
}

export interface NodeDef {
  id: string;
  name: string;
  address: string;
  kind: 'empresa' | 'laboratório' | 'treinamento' | 'banco de dados' | 'fórum' | 'mercado' | 'organização' | 'rede privada' | 'infraestrutura';
  org: string;
  desc: string;
  security: number; // 1..5
  pos: [number, number]; // mapa (0..100)
  links: string[];
  services: ServiceDef[];
  files: FileDef[];
  challenges: string[]; // ids de ChallengeDef
  startsDiscovered: boolean;
  minLevel?: number;
  facts: string[]; // informações descobertas ao escanear/inspecionar
}

// ---------- Ferramentas / loja / hardware ----------
export interface ToolDef {
  id: string;
  name: string;
  icon: string;
  category: ToolCategory;
  desc: string;
  features: string[][]; // features[level-1] = lista de funcionalidades desse nível
  maxLevel: number;
  basePrice: number;
  levelReq: number;
  osReq: number;
  ramReq: number; // tier
  starter?: boolean;
}

export type ShopCategory = 'Hardware' | 'Software' | 'Ferramentas' | 'Cursos' | 'Melhorias' | 'Cosméticos';

export interface ShopItem {
  id: string;
  cat: ShopCategory;
  name: string;
  icon: string;
  desc: string;
  price: number;
  levelReq?: number;
  repReq?: number;
  benefits: string[];
  kind: 'hw' | 'tool' | 'sw' | 'course' | 'upgrade' | 'cosmetic';
  hw?: { slot: keyof Hardware; tier: number };
  toolId?: string;
  once?: boolean;
  effect?: Record<string, number | string | boolean>;
}

export interface Hardware {
  cpu: number;
  ram: number;
  storage: number;
  nic: number;
  os: number;
}

// ---------- Arquivos ----------
export interface FsEntry {
  type: 'dir' | 'file';
  name: string;
  content?: string;
  size: number; // KB
  created: number;
  encrypted?: { challenge: string; plain: string };
  analysis?: string[];
  recoverable?: boolean;
  recovered?: string;
  malicious?: boolean;
  readonly?: boolean;
  tag?: string;
  analyzed?: boolean;
}

// ---------- Contatos ----------
export interface DialogueChoice {
  text: string;
  next?: string; // próximo nó automático
  flags?: Record<string, boolean | string | number>;
  rep?: number;
  money?: number;
  trust?: number;
  offer?: string[];
  reveal?: string[];
  choiceId?: string;
  reply?: string; // fala do jogador (se diferente do texto)
}

export interface DialogueNode {
  id: string;
  contact: string;
  text: string;
  choices?: DialogueChoice[];
  auto?: string; // próximo nó sem escolha
}

export interface ContactDef {
  id: string;
  name: string;
  handle: string;
  specialty: string;
  bio: string;
  personality: string;
  color: string;
  glyph: string;
  startsUnlocked: boolean;
  repReq?: number;
  levelReq?: number;
}

export interface Msg {
  id: string;
  from: 'them' | 'me';
  text: string;
  ts: number; // gameMinutes
  read?: boolean;
}

// ---------- Outros ----------
export interface Notif {
  id: string;
  kind: 'info' | 'ok' | 'warn' | 'err' | 'msg' | 'unlock';
  title: string;
  body?: string;
  ts: number;
  read: boolean;
}

export interface FeedLine {
  id: string;
  ts: number;
  kind: 'info' | 'ok' | 'warn' | 'err';
  text: string;
}

export type TermKind = 'in' | 'out' | 'info' | 'ok' | 'warn' | 'err' | 'scan' | 'sys' | 'dim' | 'hl';
export interface TermLine {
  id: number;
  kind: TermKind;
  text: string;
  prompt?: string;
}

export interface Contract {
  id: string;
  mission: MissionDef;
  expiresAt: number; // timestamp real
}

export interface Settings {
  sfxVolume: number;
  musicVolume: number;
  music: boolean;
  sfx: boolean;
  fx: boolean; // scanlines/ruído
  glow: boolean;
  animations: boolean;
  typing: boolean;
  theme: 'matrix' | 'cobalt' | 'amber' | 'crimson';
  lang: 'pt-BR' | 'en';
  termSpeed: number; // 1 lento .. 3 rápido
  reduceMotion: boolean;
}

export interface Stats {
  commands: number;
  missionsDone: number;
  missionsFailed: number;
  mgPlayed: number;
  mgWon: Record<string, number>;
  analysisWon: number;
  errors: number;
  moneyEarned: number;
  moneySpent: number;
  toolsBought: number;
  scans: number;
  playSeconds: number;
  perfectMissions: number;
  eventsSeen: number;
  filesCreated: number;
}
