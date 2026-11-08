import type { ContactDef, DialogueNode } from '../types';

export const CONTACTS: ContactDef[] = [
  {
    id: 'morpheus', name: 'MORPHEUS', handle: 'dr.marrow@aegis.sim', specialty: 'Mentor · Segurança digital', color: '#00FF88', glyph: 'M', startsUnlocked: true,
    bio: 'Dr. Elias Marrow, fundador da Aegis Labs. Ex-engenheiro de defesa que acredita que o melhor ataque é ensinar a defender.',
    personality: 'Paciente, enigmático, exigente. Fala em perguntas e nunca entrega a resposta de graça.',
  },
  {
    id: 'nova', name: 'NOVA', handle: 'nova.reyes@datalab.sim', specialty: 'Análise de dados & logs', color: '#00CFFF', glyph: 'N', startsUnlocked: false,
    bio: 'Nova Reyes, analista de dados freelancer. Vê padrões onde outros veem ruído. Mantém um fichário de heurísticas para caçar anomalias.',
    personality: 'Direta, curiosa, bem-humorada. Gosta de café, gráficos e de ter razão.',
  },
  {
    id: 'ghost', name: 'GHOST', handle: '[canal-cobalt-09]', specialty: 'Veterano · Operações discretas', color: '#B28DFF', glyph: 'G', startsUnlocked: false,
    bio: 'Saiu da Aegis há quatro anos e desapareceu do mapa. Conhece a Black Lotus melhor que qualquer pessoa viva — e por isso vive escondido.',
    personality: 'Seco, desconfiado, leal a poucos. Cobra favores, mas cumpre o que promete.',
  },
  {
    id: 'vanta', name: 'VANTA', handle: '[mercado-obsidian/v]', specialty: 'Corretor de contratos de alto risco', color: '#FF3B3B', glyph: 'V', startsUnlocked: false,
    bio: 'Intermediário que paga bem por trabalhos que ninguém quer assumir. Ninguém sabe para quem realmente trabalha.',
    personality: 'Charmoso, calculista, sempre sorrindo no texto. Nunca responde "por quê".',
  },
];
export const CONTACT_MAP = Object.fromEntries(CONTACTS.map((c) => [c.id, c]));

const N = (id: string, contact: string, text: string, choices?: DialogueNode['choices'], auto?: string): DialogueNode => ({ id, contact, text, choices, auto });

export const DIALOGUES: DialogueNode[] = [
  // --- Introdução ---
  N('intro_unknown', 'morpheus',
    'Olá. Você não me conhece — e é melhor assim por enquanto.\n\nA Pixel Forge Studio, uma produtora indie, recebeu um arquivo estranho por e-mail e não sabe se é perigoso. Eu preciso de olhos frescos para analisá-lo. Pago 120 créditos.\n\nTudo corre num ambiente de simulação seguro. Interessado?',
    [
      { text: 'Aceito. Como começo?', reply: 'Aceito o trabalho. Como começo?', next: 'intro_accept', offer: ['M-001'], choiceId: 'accepted_first' },
      { text: 'Quem é você?', reply: 'Antes de aceitar: quem é você?', next: 'intro_who', offer: ['M-001'], trust: 0 },
    ]),
  N('intro_accept', 'morpheus', 'Abra a aba MISSÕES e aceite o contrato M-001. Depois use o TERMINAL. Digite "help" para ver os comandos. Escaneie, conecte, baixe e analise. Siga a ordem dos objetivos.'),
  N('intro_who', 'morpheus', 'Alguém que viu algo promissor num currículo vazio. Chame de "O Observador". O contrato M-001 está liberado. Comece pela aba MISSÕES e use o TERMINAL (digite "help").'),
  N('m1_done', 'morpheus',
    'Bom trabalho. A Helena já comentou com meia dúzia de pessoas.\n\nHá um servidor de treinamento da Aegis Labs aberto para novatos: aegis-train-01. Se resolver os exercícios dele, você terá acesso ao programa. Veja a missão M-002.',
    [
      { text: 'Vou começar agora.', trust: 1 },
      { text: 'O que a Aegis Labs ganha com isso?', reply: 'O que a Aegis ganha ensinando novatos?', next: 'm1_why' },
    ]),
  N('m1_why', 'morpheus', 'Ensinar atacantes de laboratório a pensar como defensores. Cada vez que alguém aprende a quebrar uma cifra de brinquedo, o mundo tem um erro a menos para ser explorado de verdade.'),
  N('m2_done', 'nova',
    'Oi! Aqui é a Nova. Vi o seu nome na lista de aprovados do exercício 01 — raro alguém acertar o César de primeira.\n\nTrabalho com análise de dados. Se precisar de dica sobre logs, é só chamar.\n\nO Seu Antônio, da Contabilidade Alvorada, está desesperado: formatou o PC por engano. Tem um contrato (M-003). Mas você vai precisar da ferramenta DataRecovery.',
    [
      { text: 'Valeu, Nova! Vou olhar.', trust: 1 },
      { text: 'Você trabalha para a Aegis?', reply: 'Você trabalha para a Aegis?', next: 'm2_aegis' },
    ]),
  N('m2_aegis', 'nova', 'Mais ou menos. Presto serviço quando precisam de olhos em logs. Sou independente — e prefiro assim.'),
  N('m3_done', 'nova', 'Substituição simples é como um sudoku de letras: frequência primeiro, contexto depois. Se você comprar o CryptLab, ele mostra a frequência pra você. E o Morpheus quer te testar com uma mensagem cifrada — fica de olho.'),
  N('m4_done', 'morpheus',
    'Você resolveu a série do Observador. Chegou a hora de me apresentar: sou Elias Marrow, fundador da Aegis Labs. Pode me chamar de MORPHEUS.\n\nAgora o trabalho começa de verdade. A Kestrel Media tem atividade estranha nos logs. Veja M-005.',
    [
      { text: 'Estou pronto.', trust: 2 },
      { text: 'Por que me testou escondido?', reply: 'Por que me testou sem se identificar?', next: 'm4_why' },
    ]),
  N('m4_why', 'morpheus', 'Porque a pessoa que resolve problemas quando ninguém está olhando é a pessoa certa. Você passou.'),
  N('m5_done', 'nova', 'Boa análise! Dica de ouro: horário incomum + conta de serviço + IP externo = quase sempre problema. A clínica Meridian tem um firewall escancarado — M-006. Defesa também é uma arte.'),
  N('m6_done', 'morpheus', 'Seu firewall salvou um portal de pacientes. Para auditorias maiores, precisa de NetVision — mapeia nós vizinhos. A Kestrel quer a rede inteira revisada (M-007).'),

  // --- Ghost ---
  N('m7_done', 'ghost',
    'Vi seu scan na rede da Kestrel. Discreto. Não tanto quanto eu, mas discreto.\n\nNão me chame de nada. Se tiver curiosidade, o Cobalt Forum tem um tópico sobre mim. Siga as migalhas e talvez a gente converse.',
    [
      { text: 'Quem é você?', reply: 'Quem é você?', next: 'm7_who', trust: 1 },
      { text: 'Não converso com anônimos.', reply: 'Não converso com anônimos.', next: 'm7_rude', trust: -2 },
    ]),
  N('m7_who', 'ghost', 'Alguém que saiu da Aegis por boas razões. Chama de GHOST. Siga a trilha e eu te conto o resto.'),
  N('m7_rude', 'ghost', 'Justo. Mas anônimos sobrevivem mais. Se mudar de ideia, a trilha ainda estará no fórum.'),
  N('m8_done', 'nova', 'Caso do Obsidian resolvido. O Paulo seria demitido sem você. Dica: o fórum Cobalt e o mercado Obsidian andam cheios de rumores. Meu faro diz que a Aegis tem um problema interno.'),

  // --- Vanta / moral ---
  N('m10_vanta', 'vanta',
    'Olá, estrela em ascensão. Vi o cofre 7 aberto — trabalho limpo.\n\nPago o dobro para obter a escala de plantão da Aegis Labs, sem perguntas. Está no laboratório 02, num arquivo cifrado. Dinheiro rápido. O que me diz?',
    [
      { text: 'Aceito. Mande os detalhes.', reply: 'Aceito. Mande os detalhes.', next: 'vanta_accept', offer: ['M-012'], flags: { vanta_deal: true }, choiceId: 'vanta_accept', trust: 2 },
      { text: 'Não trabalho contra quem me ensinou.', reply: 'Não trabalho contra quem me ensinou.', next: 'vanta_refuse', flags: { vanta_refused: true }, rep: 10, choiceId: 'vanta_refuse' },
      { text: 'Vou pensar...', reply: 'Preciso pensar.', next: 'vanta_wait', flags: { vanta_pending: true } },
    ]),
  N('vanta_accept', 'vanta', 'Sabia que você era esperto. A missão M-012 foi liberada. Ah, e não comente com o Morpheus. Ele não entende de negócios.'),
  N('vanta_refuse', 'vanta', 'Que pena. A porta continua aberta. Mas lembre-se: lealdade não paga contas.', undefined, 'vanta_refuse_morph'),
  N('vanta_refuse_morph', 'morpheus', 'Fiquei sabendo da proposta de VANTA e da sua recusa. Não vou esquecer isso. Confie em mim: ele não é quem diz ser.'),
  N('vanta_wait', 'vanta', 'Não demore. Boas oportunidades têm prazo. Se mudar de ideia, me avise.',
    [
      { text: 'Fechado, aceito.', reply: 'Mudei de ideia. Aceito.', next: 'vanta_accept', offer: ['M-012'], flags: { vanta_deal: true, vanta_pending: false }, choiceId: 'vanta_accept' },
      { text: 'Recuso de vez.', reply: 'Recuso de vez.', next: 'vanta_refuse', flags: { vanta_refused: true, vanta_pending: false }, rep: 10, choiceId: 'vanta_refuse' },
    ]),
  N('m12_done', 'vanta', 'Entrega impecável. Pagamento enviado. Vamos trabalhar juntos de novo, tenho certeza.'),

  // --- Ghost continua ---
  N('m13_done', 'ghost',
    'Você é bom. Ou teimoso. Provavelmente ambos.\n\nJá leu o que deixei? Há um infiltrado na Aegis. Preciso que alguém de confiança olhe a rede interna. Isso te interessa?',
    [
      { text: 'Vou ajudar. Conte comigo.', reply: 'Vou ajudar. Conte comigo.', flags: { helped_ghost: true }, trust: 3, next: 'm13_ok' },
      { text: 'Isso não é problema meu.', reply: 'Isso não é problema meu.', flags: { helped_ghost: false }, trust: -3 },
    ]),
  N('m13_ok', 'ghost', 'Ótimo. A rede interna se chama aegis-vault. Vou liberar o nó no seu mapa. Procure alguém cuja presença nunca bate com o ponto.'),
  N('m14_done', 'morpheus',
    'Marcus Hale. Eu o treinei por oito anos. Não quero acreditar, mas as provas são claras.\n\nO que fazemos com ele?',
    [
      { text: 'Entregue-o às autoridades.', reply: 'Entregue-o às autoridades.', flags: { mole_reported: true }, rep: 15, trust: 2, next: 'm14_report', choiceId: 'mole_report' },
      { text: 'Use-o para vazar dados falsos à Lotus.', reply: 'Vamos usá-lo: vazar dados falsos para a Lotus.', flags: { mole_turned: true }, next: 'm14_turn', choiceId: 'mole_turn', trust: 1 },
      { text: 'A decisão é sua, mentor.', reply: 'A decisão é sua.', flags: { mole_left: true }, next: 'm14_left' },
    ]),
  N('m14_report', 'morpheus', 'Justo. Vou acionar a equipe jurídica hoje. Sem rancor — mas sem espaço para erros.'),
  N('m14_turn', 'morpheus', 'Arriscado, mas inteligente. Vamos plantar informações falsas. Isso pode nos dar tempo. Ou nos custar caro.'),
  N('m14_left', 'morpheus', 'Então eu decido. Vou conversar com ele antes de fazer qualquer coisa. Obrigado pela confiança.'),
  N('m15_done', 'nova', 'Auditoria do Nordwatch foi impecável! O mercado cochicha que a Orbital Grid Authority vai ligar. Vai precisar de CPU e RAM para o gerenciador de recursos — pense em upgrades.'),
  N('m16_done', 'morpheus', 'A rede estabilizou. Mas algo me preocupa: o tráfego anômalo veio de um relay que nunca vi. Para chegar na ponta, você vai precisar da certificação Aegis nível 3 — veja M-017.'),
  N('m17_done', 'nova', 'Certificada! Orgulho de você. Mas olha: a VANTA anda perguntando por você em todos os cantos. Cuidado.'),
  N('m18_betrayal', 'vanta',
    'Parabéns pela defesa. Foi um prazer trabalhar com você — e uma pena que acabe assim.\n\nSempre fui da Black Lotus. Nada pessoal. A janela do Blackout se aproxima. Quem te contratou para me deter não vai ganhar.',
    [
      { text: 'Você não vai vencer.', reply: 'Você não vai vencer.', flags: { vanta_enemy: true }, trust: -5 },
      { text: 'Quanto pagam para trair?', reply: 'Quanto pagam para trair?', next: 'vanta_offer', flags: { vanta_tempted: true } },
    ]),
  N('vanta_offer', 'vanta', 'Ah, finalmente uma conversa interessante. Terminada a operação, posso fazer de você sócio. Pense nisso.'),
  N('m18_ghost', 'ghost', 'Eu avisei. Black Lotus nunca fica quieta. Se ajudou a me achar antes, tem meu apoio agora. Se não... bom, boa sorte.'),
  N('m19_done', 'morpheus', 'As provas do Projeto Lótus Azul estão conosco. Resta o Protocolo Blackout — a Black Lotus ataca hoje às 23:59. Você é a única pessoa que pode chegar ao relay principal a tempo. Veja M-020.'),
  N('final_choice', 'morpheus',
    'O Blackout foi contido. Agora, as provas: Helix, Black Lotus, VANTA. Tudo em suas mãos.\n\nO que você faz com elas?',
    [
      { text: 'Expor tudo publicamente.', reply: 'Vou expor tudo publicamente.', flags: { ending: 'expose' }, rep: 80, choiceId: 'end_expose' },
      { text: 'Entregar às autoridades.', reply: 'Vou entregar tudo às autoridades.', flags: { ending: 'authorities' }, rep: 50, choiceId: 'end_authorities' },
      { text: 'Vender as provas à Helix.', reply: 'Vou vender as provas à Helix. O preço é bom.', flags: { ending: 'sell' }, money: 25000, rep: -60, choiceId: 'end_sell' },
    ]),
  N('epilogue_expose', 'morpheus', 'Você escolheu a verdade. Manchetes pelo mundo fictício inteiro: Helix cai, Black Lotus se esfacela. Alguns te chamam de herói, outros de problema. Sua carreira só começou — a Aegis te espera de portas abertas.'),
  N('epilogue_authorities', 'morpheus', 'Justiça, devagar mas firme. As autoridades prendem Cravo e desmontam o relay. A Aegis é inocentada. Você ganhou a confiança de quem importa. A rede agora é um lugar um pouco mais seguro.'),
  N('epilogue_sell', 'morpheus', 'Entendo. O dinheiro é alto. Mas o preço é seu nome. Eu não posso mais te apoiar... Quem sabe um dia você volte pra casa.'),
  N('epilogue', 'morpheus', 'Fim da primeira temporada.'),
];
export const DIALOGUE_MAP: Record<string, DialogueNode> = Object.fromEntries(DIALOGUES.map((d) => [d.id, d]));

// Gatilhos temporais / de nível para mensagens espontâneas
export interface Trigger { id: string; minLevel?: number; flag?: string; node: string; }
export const TRIGGERS: Trigger[] = [];
