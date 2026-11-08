import type { GameData } from '../state';

export interface EventChoice { id: string; label: string; }
export interface EventDef {
  id: string;
  title: string;
  icon: string;
  weight: number;
  eligible: (s: GameData) => boolean;
  text: (s: GameData) => string;
  choices: EventChoice[];
  cooldown: number; // segundos reais
}

export const EVENTS: EventDef[] = [
  {
    id: 'special_contract', title: 'Contrato especial disponível', icon: 'BriefcaseBusiness', weight: 4, cooldown: 240,
    eligible: (s) => s.level >= 2 && s.contracts.length < 5,
    text: () => 'Um cliente de confiança oferece um contrato especial com pagamento acima do normal. A oferta expira em poucos minutos.',
    choices: [{ id: 'accept', label: 'Ver contrato' }, { id: 'ignore', label: 'Ignorar' }],
  },
  {
    id: 'limited_mission', title: 'Missão por tempo limitado', icon: 'Timer', weight: 2, cooldown: 420,
    eligible: (s) => s.level >= 4 && s.contracts.length < 5,
    text: () => 'Uma missão relâmpago foi aberta no quadro. Paga muito bem, mas só fica disponível por 4 minutos.',
    choices: [{ id: 'accept', label: 'Aceitar oferta' }, { id: 'ignore', label: 'Deixar passar' }],
  },
  {
    id: 'software_update', title: 'Atualização de software', icon: 'RefreshCw', weight: 3, cooldown: 300,
    eligible: (s) => s.level >= 2,
    text: () => 'Uma promoção de atualização liberou 25% de desconto numa ferramenta do mercado por 5 minutos.',
    choices: [{ id: 'ok', label: 'Ver no Mercado' }, { id: 'ignore', label: 'Depois' }],
  },
  {
    id: 'mystery_info', title: 'Informação misteriosa', icon: 'MessageSquareWarning', weight: 3, cooldown: 360,
    eligible: (s) => s.contactsUnlocked.length >= 2,
    text: (s) => 'Um contato enviou uma dica anônima sobre um ambiente ainda não mapeado. Pode valer o seu tempo.',
    choices: [{ id: 'ok', label: 'Ler a dica' }],
  },
  {
    id: 'lab_found', title: 'Novo laboratório descoberto', icon: 'FlaskConical', weight: 2, cooldown: 600,
    eligible: (s) => s.level >= 4,
    text: () => 'Um anúncio no fórum menciona um laboratório que não estava no seu mapa. Ele agora está disponível em REDE.',
    choices: [{ id: 'ok', label: 'Abrir mapa' }],
  },
  {
    id: 'rival', title: 'Um rival aparece', icon: 'Swords', weight: 2, cooldown: 480,
    eligible: (s) => s.level >= 5 && s.money > 300,
    text: () => 'Um rival chamado KRYPTO tenta roubar um dos seus clientes e ameaça sua reputação. Como reage?',
    choices: [{ id: 'counter', label: 'Contra-atacar (-80 cr)' }, { id: 'ignore', label: 'Ignorar' }],
  },
  {
    id: 'hardware_issue', title: 'Equipamento com problemas', icon: 'Thermometer', weight: 2, cooldown: 420,
    eligible: (s) => s.level >= 3 && !s.inv.includes('up_cooling') && !s.inv.includes('up_ups'),
    text: () => 'Seu computador está superaquecendo e reduz a velocidade. Resolva rápido com "repair" no terminal ou na aba COMPUTADOR.',
    choices: [{ id: 'ok', label: 'Entendido' }],
  },
  {
    id: 'tip', title: 'Gorjeta de cliente', icon: 'Gift', weight: 3, cooldown: 240,
    eligible: (s) => s.stats.missionsDone >= 1,
    text: () => 'Um cliente antigo ficou satisfeito com o seu trabalho e enviou uma gorjeta.',
    choices: [{ id: 'ok', label: 'Receber' }],
  },
];
export const EVENT_MAP = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

export const TIPS = [
  { contact: 'nova', text: 'Dica: logs de madrugada com conta de serviço são o primeiro lugar para olhar.' },
  { contact: 'morpheus', text: 'Dica: reputação abre portas. Um contrato bem feito vale mais que três feitos às pressas.' },
  { contact: 'ghost', text: 'Dica: nunca conecte sem escanear antes. Nem em laboratório.' },
  { contact: 'nova', text: 'Dica: o Mercado muda de preço com eventos. Fique de olho nas promoções.' },
];
