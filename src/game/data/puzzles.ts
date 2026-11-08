import { caesar, substEncrypt, vigenere } from '../crypto';

// ---------------- Criptografia ----------------
export type CipherKind = 'caesar' | 'subst' | 'sequence' | 'word' | 'numeric' | 'vigenere';

export interface CipherPuzzle {
  id: string;
  kind: CipherKind;
  title: string;
  prompt: string;
  cipher: string; // texto cifrado ou sequência
  answer: string;
  hints: string[];
  key?: string; // vigenère: chave real
  shift?: number;
  crib?: string; // palavra conhecida no texto
}

const SUBST_A = 'QWERTYUIOPASDFGHJKLZXCVBNM'; // substituição "teclado"
const SUBST_B = 'ZEBRASCDFGHIJKLMNOPQTUVWXY';
const SUBST_C = 'MNBVCXZLKJHGFDSAPOIUYTREWQ';

export const PUZZLES: CipherPuzzle[] = [
  {
    id: 'pz_caesar_01', kind: 'caesar', title: 'Cifra de César',
    prompt: 'Cada letra foi deslocada por um número fixo no alfabeto. Teste os deslocamentos até a mensagem fazer sentido.',
    cipher: caesar('PARABENS. A PALAVRA DE ACESSO DO NIVEL DOIS E SENTINELA. CONTINUE ASSIM.', 3), answer: 'PARABENS A PALAVRA DE ACESSO DO NIVEL DOIS E SENTINELA CONTINUE ASSIM',
    hints: ['A mensagem começa com "PARABENS".', 'O deslocamento é menor que 5.', 'Deslocamento: 3 posições para trás.'], shift: 3, crib: 'PARABENS',
  },
  {
    id: 'pz_subst_01', kind: 'subst', title: 'Substituição simples',
    prompt: 'Cada letra foi trocada por outra de forma fixa. Use a frequência das letras e o contexto: a mensagem fala de um backup.',
    cipher: substEncrypt('O BACKUP DO CONTADOR ESTA NO DISCO DOIS PASTA ARQUIVO MORTO', SUBST_A), answer: 'O BACKUP DO CONTADOR ESTA NO DISCO DOIS PASTA ARQUIVO MORTO',
    hints: ['A palavra BACKUP aparece na mensagem.', 'A letra mais frequente costuma ser a vogal A ou O.', 'Texto: "O BACKUP DO CONTADOR ESTA NO DISCO..."'], crib: 'BACKUP',
  },
  {
    id: 'pz_caesar_02', kind: 'caesar', title: 'César — nível 2',
    prompt: 'Outro deslocamento. Desta vez a dica é que a mensagem fala do OBSERVADOR.',
    cipher: caesar('O OBSERVADOR ESTA ATENTO AOS SEUS PASSOS', 7), answer: 'O OBSERVADOR ESTA ATENTO AOS SEUS PASSOS',
    hints: ['A palavra OBSERVADOR está na mensagem.', 'O deslocamento é um número entre 5 e 9.', 'Deslocamento: 7.'], shift: 7, crib: 'OBSERVADOR',
  },
  {
    id: 'pz_seq_01', kind: 'sequence', title: 'Sequência lógica',
    prompt: 'Qual é o próximo número da sequência?',
    cipher: '2, 6, 18, 54, ?', answer: '162', hints: ['Cada termo é multiplicado pelo mesmo fator.', 'Fator: 3.', '54 × 3 = ?'],
  },
  {
    id: 'pz_word_01', kind: 'word', title: 'Quebra-cabeça de palavras',
    prompt: 'As letras abaixo formam uma palavra do mundo da segurança digital. Reorganize-as.',
    cipher: 'L L A W E R I F', answer: 'FIREWALL', hints: ['É uma barreira de rede.', 'Começa com F.', 'FIRE + WALL.'],
  },
  {
    id: 'pz_num_01', kind: 'numeric', title: 'Padrão numérico',
    prompt: 'Complete o padrão numérico.',
    cipher: '3, 5, 9, 17, 33, ?', answer: '65', hints: ['Observe a diferença entre termos consecutivos.', 'As diferenças são potências de 2: 2, 4, 8, 16...', 'Próxima diferença: 32.'],
  },
  {
    id: 'pz_vig_01', kind: 'vigenere', title: 'Cifra de Vigenère',
    prompt: 'Cifra polialfabética: uma palavra-chave define vários deslocamentos. Dica do laboratório: a chave tem 6 letras e é o nome do fundador do programa.',
    cipher: vigenere('A PASSPHRASE DO PAINEL E LUZ DE ALERTA', 'MARROW', false), answer: 'A PASSPHRASE DO PAINEL E LUZ DE ALERTA', key: 'MARROW',
    hints: ['A chave tem 6 letras.', 'O fundador chama-se Dr. Elias Marrow (veja os arquivos do laboratório).', 'Chave: MARROW.'],
  },
  {
    id: 'pz_subst_02', kind: 'subst', title: 'Substituição — escala de plantão',
    prompt: 'Texto administrativo da Aegis cifrado por substituição. Palavras comuns: LISTA, ACESSOS, AEGIS.',
    cipher: substEncrypt('LISTA DE ACESSOS AEGIS LABS SEDE PRINCIPAL HORARIOS DE PLANTAO DOS ANALISTAS', SUBST_B), answer: 'LISTA DE ACESSOS AEGIS LABS SEDE PRINCIPAL HORARIOS DE PLANTAO DOS ANALISTAS',
    hints: ['A palavra AEGIS aparece no texto.', 'DE é a palavra curta mais frequente.', 'Comece pelas palavras repetidas (DE, LISTA...).'], crib: 'AEGIS',
  },
  {
    id: 'pz_subst_03', kind: 'subst', title: 'Substituição — prova 09',
    prompt: 'Mensagem do examinador. Palavras prováveis: PROVA, MODULO, SEQUENCIA.',
    cipher: substEncrypt('A PROVA CONTINUA NO PROXIMO MODULO A SEQUENCIA IMPORTA MAIS QUE A VELOCIDADE', SUBST_C), answer: 'A PROVA CONTINUA NO PROXIMO MODULO A SEQUENCIA IMPORTA MAIS QUE A VELOCIDADE',
    hints: ['A palavra PROVA aparece no início.', 'A letra isolada "A" é provavelmente a vogal A.', 'MODULO tem a letra O repetida.'], crib: 'PROVA',
  },
  {
    id: 'pz_vig_02', kind: 'vigenere', title: 'Vigenère — prova 09',
    prompt: 'A chave tem 6 letras: é a palavra em inglês para "escudo".',
    cipher: vigenere('A CHAVE DA PROXIMA PORTA ESTA NO ESPELHO', 'SHIELD', false), answer: 'A CHAVE DA PROXIMA PORTA ESTA NO ESPELHO', key: 'SHIELD',
    hints: ['A chave é sinônimo de ESCUDO em inglês.', 'A chave tem 6 letras.', 'Chave: SHIELD.'],
  },
  {
    id: 'pz_num_02', kind: 'numeric', title: 'Padrão numérico — prova 09',
    prompt: 'Complete o padrão (dica: alterna duas regras).',
    cipher: '1, 2, 4, 7, 11, 16, 22, ?', answer: '29', hints: ['Observe as diferenças entre termos vizinhos.', 'As diferenças são 1, 2, 3, 4, 5, 6...', 'Próxima diferença: 7. Então 22 + 7.'],
  },
  {
    id: 'pz_vig_03', kind: 'vigenere', title: 'Vigenère — núcleo Helix',
    prompt: 'A chave é o codinome do projeto: LOTUS + AZUL, apenas a segunda palavra (4 letras).',
    cipher: vigenere('PROJETO LOTUS AZUL ENTRA EM FASE FINAL AO ANOITECER', 'AZUL', false), answer: 'PROJETO LOTUS AZUL ENTRA EM FASE FINAL AO ANOITECER', key: 'AZUL',
    hints: ['A chave aparece no nome do projeto.', 'A chave tem 4 letras.', 'Chave: AZUL.'],
  },
  {
    id: 'pz_seq_02', kind: 'sequence', title: 'Sequência de Fibonacci modificada',
    prompt: 'Cada termo é a soma dos dois anteriores. Qual é o 8º termo?',
    cipher: '2, 3, 5, 8, 13, 21, 34, ?', answer: '55', hints: ['Soma dos dois anteriores.', '21 + 34 = ?', 'Resposta: 55.'],
  },
];

export const PUZZLE_MAP: Record<string, CipherPuzzle> = Object.fromEntries(PUZZLES.map((p) => [p.id, p]));

// ---------------- Investigação ----------------
export interface Evidence {
  id: string;
  title: string;
  kind: 'log' | 'email' | 'arquivo' | 'registro' | 'testemunho';
  time: string;
  content: string;
  key?: string; // trecho-chave destacado com Forense
}
export interface InvQuestion {
  id: string;
  text: string;
  options: string[];
  answer: number;
  explain: string;
}
export interface InvScenario {
  id: string;
  title: string;
  intro: string;
  evidence: Evidence[];
  questions: InvQuestion[];
}

export const INVESTIGATIONS: InvScenario[] = [
  {
    id: 'inv_obsidian',
    title: 'Vazamento na Obsidian Logistics',
    intro: 'Manifestos de carga vazaram entre terça e quinta. Examine as evidências, cruze horários e responda quem, quando e como.',
    evidence: [
      { id: 'e1', title: 'Log de VPN (trecho)', kind: 'log', time: '12/03 23:47', content: '23:47 VPN login  svc_report  ip=10.77.9.77  OK\n23:51 EXPORT svc_report shipping_manifest.csv (42 MB)\n00:02 VPN logout svc_report', key: 'svc_report' },
      { id: 'e2', title: 'Escala de turnos', kind: 'registro', time: '12/03', content: 'Paulo M. — turno 08:00–17:00 (folga na quinta)\nRicardo S. — 09:00–18:00\nConta de serviço svc_report — gerenciada por Ricardo S.', key: 'gerenciada por Ricardo S.' },
      { id: 'e3', title: 'E-mail de Ricardo ao fornecedor', kind: 'email', time: '11/03 18:20', content: 'Ricardo: "Anotei a senha do svc_report no meu notebook para facilitar. Não se preocupe, só eu uso."\nNo dia seguinte o notebook foi esquecido num café.', key: 'Anotei a senha do svc_report' },
      { id: 'e4', title: 'Câmera da portaria', kind: 'testemunho', time: '12/03 23:30', content: 'A portaria registra Paulo saindo às 17:05. Ricardo saiu às 18:10. Ninguém entrou no prédio após 18:30.' },
      { id: 'e5', title: 'Origem do IP 10.77.9.77', kind: 'registro', time: '13/03', content: 'IP pertence à rede pública do Cobalt Forum (nó externo). Não faz parte da Obsidian.', key: 'rede pública do Cobalt Forum' },
    ],
    questions: [
      { id: 'q1', text: 'Qual conta foi usada na exportação indevida?', options: ['paulo.m', 'ricardo.s', 'svc_report', 'admin'], answer: 2, explain: 'O log mostra svc_report exportando o manifesto às 23:51.' },
      { id: 'q2', text: 'Como o atacante provavelmente obteve acesso à conta?', options: ['Força bruta no VPN', 'Senha anotada em notebook esquecido', 'Phishing para Paulo', 'Invasão física ao prédio'], answer: 1, explain: 'Ricardo anotou a senha e o notebook foi esquecido num café.' },
      { id: 'q3', text: 'Por que os funcionários internos (Paulo e Ricardo) estão fora de suspeita direta?', options: ['Estavam em casa/fora e o IP era externo', 'Ambos têm folga', 'São novatos', 'Não têm acesso VPN'], answer: 0, explain: 'Ninguém entrou após 18:30 e o IP de origem é externo.' },
    ],
  },
  {
    id: 'inv_ghost',
    title: 'A trilha de GHOST',
    intro: 'GHOST deixou migalhas no Cobalt Forum. Cruze horário, relay e nomes de arquivo para descobrir onde ele guarda suas cópias.',
    evidence: [
      { id: 'e1', title: 'Último post de GHOST', kind: 'registro', time: '03:17', content: 'Post às 03:17: "Quem seguir a trilha encontra a casa. Relay 9, espelho 1. O resto é ruído."', key: 'Relay 9' },
      { id: 'e2', title: 'Tabela de relays', kind: 'arquivo', time: '—', content: 'Relay 7 -> obsidian-market\nRelay 9 -> ghost-safehouse (10.77.13.13)\nRelay 12 -> blacklotus-relay', key: 'Relay 9 -> ghost-safehouse' },
      { id: 'e3', title: 'Mensagem privada de nullbyte', kind: 'email', time: '02:50', content: '"Ele disse que não confia no espelho 3. Disse que lá tem algo plantado pela Black Lotus."', key: 'espelho 3' },
      { id: 'e4', title: 'Índice de espelhos (parcial)', kind: 'arquivo', time: '—', content: 'espelho 1: logs Aegis (2029)\nespelho 2: manifestos Obsidian\nespelho 3: ???', },
    ],
    questions: [
      { id: 'q1', text: 'Qual nó é o esconderijo de GHOST?', options: ['obsidian-market', 'blacklotus-relay', 'ghost-safehouse', 'helix-core'], answer: 2, explain: 'Relay 9 aponta para ghost-safehouse.' },
      { id: 'q2', text: 'Qual espelho NÃO deve ser acessado?', options: ['Espelho 1', 'Espelho 2', 'Espelho 3', 'Todos são seguros'], answer: 2, explain: 'GHOST avisa para nunca confiar no espelho 3.' },
      { id: 'q3', text: 'Que grupo aparece associado ao motivo de GHOST ter sumido?', options: ['Cobalt', 'Black Lotus', 'Obsidian', 'Nordwatch'], answer: 1, explain: 'A mensagem de nullbyte e o fórum citam a Black Lotus.' },
    ],
  },
  {
    id: 'inv_mole',
    title: 'O Infiltrado da Aegis',
    intro: 'Alguém vende a escala de plantão da Aegis para a Black Lotus. Compare ponto eletrônico, logs e fala de testemunhas.',
    evidence: [
      { id: 'e1', title: 'Escala oficial de plantão', kind: 'registro', time: '—', content: 'Iris Tanaka — seg/qua\nMarcus Hale — ter/qui\nLena Koskov — sex/sáb\nTomás Abreu — dom', },
      { id: 'e2', title: 'Log de acesso ao roster (madrugada)', kind: 'log', time: '03:12 (sexta)', content: 'sexta 03:12 acesso a staff_roster.txt usuário=mhale via ssh de 10.77.13.66\nsexta 03:14 download roster.dat', key: 'usuário=mhale via ssh de 10.77.13.66' },
      { id: 'e3', title: 'Ponto eletrônico (sexta)', kind: 'registro', time: 'sex', content: 'Marcus Hale NÃO tem plantão na sexta (ponto zerado).\nLena Koskov — entrou às 22:00.', key: 'Marcus Hale NÃO tem plantão na sexta' },
      { id: 'e4', title: 'Origem 10.77.13.66', kind: 'arquivo', time: '—', content: '10.77.13.66 é o endereço do relay principal da Black Lotus.', key: 'relay principal da Black Lotus' },
      { id: 'e5', title: 'Depoimento da Dra. Tanaka', kind: 'testemunho', time: '—', content: '"O Marcus vive pedindo para trocar de turno e nunca explica por quê. Outro dia me perguntou quem fica sozinho aos fins de semana."', key: 'quem fica sozinho aos fins de semana' },
    ],
    questions: [
      { id: 'q1', text: 'Quem é o infiltrado?', options: ['Iris Tanaka', 'Marcus Hale', 'Lena Koskov', 'Tomás Abreu'], answer: 1, explain: 'O usuário mhale acessou o roster de um IP da Black Lotus, fora do seu plantão.' },
      { id: 'q2', text: 'Qual a principal evidência técnica?', options: ['Ponto zerado na sexta', 'Acesso ao roster vindo de IP da Black Lotus', 'Troca frequente de turno', 'Download de roster.dat por Lena'], answer: 1, explain: 'A origem 10.77.13.66 pertence à Black Lotus.' },
      { id: 'q3', text: 'O que o comportamento dele sugere?', options: ['Pretende saber quando a sede está vazia', 'Está de férias', 'Quer auditar a rede', 'Estava testando backups'], answer: 0, explain: 'Pergunta sobre quem fica sozinho aos fins de semana.' },
    ],
  },
  {
    id: 'inv_final',
    title: 'A teia Black Lotus',
    intro: 'Conecte Helix, Black Lotus, VANTA e o Protocolo Blackout. O que você descobrir definirá o desfecho.',
    evidence: [
      { id: 'e1', title: 'Plano Blackout', kind: 'arquivo', time: 'hoje 23:59', content: 'Fase 1: sobrecarregar controle da rede elétrica\nFase 2: apagar registros\nFase 3: culpar a Aegis Labs\nResponsável interno: VANTA', key: 'Responsável interno: VANTA' },
      { id: 'e2', title: 'Pagamento Helix → Lotus', kind: 'registro', time: '03/2030', content: 'Pagamento mensal via Obsidian Market ao contato "Cravo". Valor: 80k cr. Referência: Projeto Lótus Azul.', key: 'Projeto Lótus Azul' },
      { id: 'e3', title: 'Chat VANTA ↔ Cravo', kind: 'email', time: 'ontem', content: 'VANTA: "A janela é amanhã às 23:59. Se a Aegis ficar sem plantão, o resto é fácil."\nCravo: "Helix garante cobertura jurídica."', key: 'se a Aegis ficar sem plantão' },
      { id: 'e4', title: 'Alvo secundário', kind: 'registro', time: 'hoje', content: 'Orbital Grid: tráfego anômalo vindo do relay Black Lotus. Duração prevista: 40 min.' },
    ],
    questions: [
      { id: 'q1', text: 'Quem coordena internamente o Protocolo Blackout?', options: ['Cravo', 'VANTA', 'GHOST', 'MORPHEUS'], answer: 1, explain: 'O plano cita VANTA como responsável.' },
      { id: 'q2', text: 'Quem financia a operação?', options: ['Nordwatch Bank', 'Cobalt Forum', 'Helix Dynamics', 'Obsidian Logistics'], answer: 2, explain: 'Pagamentos Helix → Black Lotus via Obsidian Market.' },
      { id: 'q3', text: 'A quem a Fase 3 pretende culpar?', options: ['Orbital Grid', 'Aegis Labs', 'Kestrel Media', 'Meridian Health'], answer: 1, explain: 'Fase 3: culpar a Aegis Labs.' },
    ],
  },
];
export const INV_MAP: Record<string, InvScenario> = Object.fromEntries(INVESTIGATIONS.map((i) => [i.id, i]));

// ---------------- Gerenciamento de recursos ----------------
export interface ResJob {
  id: string;
  name: string;
  cpu: number; // unidades de CPU (capacidade base = 100 * velocidade)
  ram: number; // MB
  dur: number; // segundos base
  required: boolean;
  after?: string;
  bonus?: number;
}
export interface ResScenario {
  id: string;
  title: string;
  intro: string;
  time: number; // segundos
  jobs: ResJob[];
}
export const RES_SCENARIOS: ResScenario[] = [
  {
    id: 'res_train', title: 'Treino de Recursos', intro: 'Aprenda a distribuir processamento e memória.', time: 45,
    jobs: [
      { id: 'j1', name: 'indexar-logs', cpu: 40, ram: 512, dur: 8, required: true },
      { id: 'j2', name: 'backup-incremental', cpu: 30, ram: 768, dur: 10, required: true },
      { id: 'j3', name: 'verificar-integridade', cpu: 35, ram: 512, dur: 9, required: false, bonus: 10 },
    ],
  },
  {
    id: 'res_grid', title: 'Estabilizar a rede elétrica (simulada)', intro: 'Carga anômala nos servidores. Execute os módulos críticos em ordem, sem estourar CPU ou RAM.', time: 70,
    jobs: [
      { id: 'j1', name: 'isolar-subestacao-4', cpu: 45, ram: 1024, dur: 10, required: true },
      { id: 'j2', name: 'balancear-carga', cpu: 55, ram: 1536, dur: 14, required: true, after: 'j1' },
      { id: 'j3', name: 'reiniciar-controle-scada', cpu: 40, ram: 1024, dur: 12, required: true, after: 'j1' },
      { id: 'j4', name: 'validar-telemetria', cpu: 35, ram: 768, dur: 9, required: true, after: 'j2' },
      { id: 'j5', name: 'snapshot-forense', cpu: 30, ram: 1024, dur: 10, required: false, bonus: 12 },
    ],
  },
  {
    id: 'res_helix', title: 'Operação Meia-Noite', intro: 'Pipeline de contrainteligência: extrair, descriptografar, correlacionar e reportar antes do prazo.', time: 80,
    jobs: [
      { id: 'j1', name: 'coletar-metadados', cpu: 40, ram: 1024, dur: 9, required: true },
      { id: 'j2', name: 'descriptografar-lote', cpu: 70, ram: 2048, dur: 16, required: true, after: 'j1' },
      { id: 'j3', name: 'correlacionar-pagamentos', cpu: 55, ram: 2048, dur: 14, required: true, after: 'j1' },
      { id: 'j4', name: 'gerar-relatorio', cpu: 35, ram: 1024, dur: 10, required: true, after: 'j2' },
      { id: 'j5', name: 'apagar-rastros-locais', cpu: 25, ram: 512, dur: 8, required: false, bonus: 10 },
      { id: 'j6', name: 'assinar-evidencias', cpu: 30, ram: 768, dur: 9, required: true, after: 'j3' },
    ],
  },
  {
    id: 'res_final', title: 'Contra-ataque Blackout', intro: 'A janela de ataque está aberta. Orquestre defesa, rastreamento e isolamento antes das 23:59.', time: 95,
    jobs: [
      { id: 'j1', name: 'bloquear-relay-lotus', cpu: 50, ram: 1536, dur: 10, required: true },
      { id: 'j2', name: 'rastrear-origem', cpu: 65, ram: 2560, dur: 16, required: true, after: 'j1' },
      { id: 'j3', name: 'isolar-subestacoes', cpu: 55, ram: 2048, dur: 14, required: true },
      { id: 'j4', name: 'restaurar-logs', cpu: 45, ram: 1536, dur: 12, required: true, after: 'j3' },
      { id: 'j5', name: 'notificar-autoridades', cpu: 20, ram: 512, dur: 6, required: true, after: 'j2' },
      { id: 'j6', name: 'copia-de-evidencias', cpu: 35, ram: 1024, dur: 10, required: false, bonus: 12 },
      { id: 'j7', name: 'contramedida-ativa', cpu: 60, ram: 2048, dur: 13, required: false, bonus: 15, after: 'j1' },
    ],
  },
];
export const RES_MAP: Record<string, ResScenario> = Object.fromEntries(RES_SCENARIOS.map((r) => [r.id, r]));
