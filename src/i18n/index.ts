// Estrutura de traduções: adicione novos idiomas criando outro dicionário em DICTS.
export type Lang = 'pt-BR' | 'en';

const ptBR: Record<string, string> = {
  'nav.dashboard': 'Dashboard', 'nav.terminal': 'Terminal', 'nav.missions': 'Missões', 'nav.network': 'Rede', 'nav.tools': 'Ferramentas',
  'nav.files': 'Arquivos', 'nav.computer': 'Computador', 'nav.market': 'Mercado', 'nav.contacts': 'Contatos', 'nav.skills': 'Habilidades',
  'nav.stats': 'Estatísticas', 'nav.settings': 'Configurações',
  'menu.continue': 'Continuar jogo', 'menu.new': 'Novo jogo', 'menu.load': 'Carregar progresso', 'menu.settings': 'Configurações', 'menu.credits': 'Créditos',
  'common.money': 'Créditos', 'common.level': 'Nível', 'common.rep': 'Reputação', 'common.back': 'Voltar', 'common.close': 'Fechar', 'common.save': 'Salvar',
  'common.cancel': 'Cancelar', 'common.confirm': 'Confirmar', 'common.buy': 'Comprar', 'common.owned': 'Adquirido', 'common.locked': 'Bloqueado',
  'top.online': 'ONLINE', 'top.offline': 'SEM REDE', 'top.notifs': 'Notificações',
  'set.sfxVolume': 'Volume dos efeitos', 'set.musicVolume': 'Volume da música', 'set.music': 'Música ambiente', 'set.sfx': 'Efeitos sonoros',
  'set.fx': 'Efeitos visuais (linhas de varredura)', 'set.glow': 'Brilho neon', 'set.animations': 'Animações', 'set.typing': 'Efeito de digitação',
  'set.theme': 'Tema visual', 'set.lang': 'Idioma', 'set.termSpeed': 'Velocidade do terminal', 'set.reduceMotion': 'Reduzir movimento', 'set.reset': 'Redefinir progresso',
};
const en: Record<string, string> = {
  'nav.dashboard': 'Dashboard', 'nav.terminal': 'Terminal', 'nav.missions': 'Missions', 'nav.network': 'Network', 'nav.tools': 'Tools',
  'nav.files': 'Files', 'nav.computer': 'Computer', 'nav.market': 'Market', 'nav.contacts': 'Contacts', 'nav.skills': 'Skills',
  'nav.stats': 'Statistics', 'nav.settings': 'Settings',
  'menu.continue': 'Continue game', 'menu.new': 'New game', 'menu.load': 'Load progress', 'menu.settings': 'Settings', 'menu.credits': 'Credits',
  'common.money': 'Credits', 'common.level': 'Level', 'common.rep': 'Reputation', 'common.back': 'Back', 'common.close': 'Close', 'common.save': 'Save',
  'common.cancel': 'Cancel', 'common.confirm': 'Confirm', 'common.buy': 'Buy', 'common.owned': 'Owned', 'common.locked': 'Locked',
  'top.online': 'ONLINE', 'top.offline': 'NO LINK', 'top.notifs': 'Notifications',
  'set.sfxVolume': 'Effects volume', 'set.musicVolume': 'Music volume', 'set.music': 'Ambient music', 'set.sfx': 'Sound effects',
  'set.fx': 'Visual effects (scanlines)', 'set.glow': 'Neon glow', 'set.animations': 'Animations', 'set.typing': 'Typing effect',
  'set.theme': 'Visual theme', 'set.lang': 'Language', 'set.termSpeed': 'Terminal speed', 'set.reduceMotion': 'Reduce motion', 'set.reset': 'Reset progress',
};
export const DICTS: Record<Lang, Record<string, string>> = { 'pt-BR': ptBR, en };
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'pt-BR', label: 'Português (Brasil)' },
  { id: 'en', label: 'English (parcial)' },
];

let current: Lang = 'pt-BR';
export const setLang = (l: Lang) => { current = l; };
export const t = (key: string, lang: Lang = current) => DICTS[lang]?.[key] ?? ptBR[key] ?? key;
