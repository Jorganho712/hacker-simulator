import type { MissionDef, ObjectiveDef } from '../types';

// ---------- construtores de objetivos ----------
const scan = (n: string): ObjectiveDef => ({ id: `scan_${n}`, text: `Escanear o alvo ${n}`, hint: `scan ${n}`, match: { type: 'scan', target: n }, tool: 'cyberscan' });
const inspect = (n: string): ObjectiveDef => ({ id: `inspect_${n}`, text: `Inspecionar o sistema ${n}`, hint: `inspect ${n}`, match: { type: 'inspect', target: n } });
const connect = (n: string): ObjectiveDef => ({ id: `connect_${n}`, text: `Conectar-se a ${n}`, hint: `connect ${n}`, match: { type: 'connect', target: n }, tool: 'secureshell' });
const cat = (f: string, hint?: string): ObjectiveDef => ({ id: `cat_${f}`, text: `Ler o arquivo ${f}`, hint: hint || `cat ${f}`, match: { type: 'cat', target: f } });
const download = (f: string): ObjectiveDef => ({ id: `dl_${f}`, text: `Baixar ${f} para o seu computador`, hint: `download ${f}`, match: { type: 'download', target: f } });
const analyze = (f: string): ObjectiveDef => ({ id: `an_${f}`, text: `Analisar ${f}`, hint: `analyze ${f}  (o arquivo precisa estar em ~/downloads)`, match: { type: 'analyze', target: f }, tool: 'hexanalyzer' });
const decrypt = (f: string): ObjectiveDef => ({ id: `dec_${f}`, text: `Descriptografar ${f}`, hint: `decrypt ${f}`, match: { type: 'decrypt', target: f } });
const recover = (f: string): ObjectiveDef => ({ id: `rec_${f}`, text: `Recuperar ${f}`, hint: `recover ${f}`, match: { type: 'recover', target: f }, tool: 'datarecovery' });
const mg = (ref: string, text: string): ObjectiveDef => ({ id: `mg_${ref}`, text, hint: `run ${ref}`, match: { type: 'mg', ref } });
const submit = (): ObjectiveDef => ({ id: 'submit', text: 'Entregar o relatório ao cliente', hint: 'mission submit', match: { type: 'submit' } });

export const STORY_MISSIONS: MissionDef[] = [
  // ==================== INICIANTE ====================
  {
    id: 'M-001', title: 'Arquivo Suspeito', client: 'Helena Duarte', org: 'Pixel Forge Studio', difficulty: 'Iniciante', category: 'Análise de arquivo', story: true,
    description: 'Uma produtora indie recebeu um anexo com extensão dupla. Descubra o que ele realmente é.',
    briefing: ['Mensagem anônima: "Preciso de olhos frescos. A Pixel Forge recebeu um arquivo estranho e não confia no próprio TI."', 'Use o terminal: escaneie, conecte, baixe o anexo e analise-o. Tudo acontece num ambiente de simulação.'],
    objectives: [scan('pf-workstation'), connect('pf-workstation'), cat('inbox_note.txt'), download('orcamento_final.pdf.scr'), analyze('orcamento_final.pdf.scr'), submit()],
    reward: { money: 120, xp: 70, rep: 8 }, eta: '10 min', requires: { offered: true },
    consequences: { success: 'Helena confia na sua análise e indica você para outros contatos.', failure: 'Helena pede uma segunda opinião e perde a confiança.' },
    onComplete: { messages: [{ contact: 'morpheus', node: 'm1_done' }], flags: { first_contract: true }, reveal: ['aegis-train-01'] },
  },
  {
    id: 'M-002', title: 'Porta Aberta', client: 'Programa de Treinamento', org: 'Aegis Labs', difficulty: 'Iniciante', category: 'Vulnerabilidades', story: true,
    description: 'Identifique vulnerabilidades no servidor de treinamento da Aegis e decifre o exercício 01.',
    briefing: ['A Aegis Labs mantém um servidor de treino. Quem passar nele recebe indicação para contratos reais.', 'Encontre os serviços vulneráveis, leia o aviso de boas-vindas e decifre o arquivo de exercício.'],
    objectives: [scan('aegis-train-01'), inspect('aegis-train-01'), connect('aegis-train-01'), cat('welcome.txt'), download('exercise_01.enc'), decrypt('exercise_01.enc'), submit()],
    reward: { money: 160, xp: 100, rep: 10 }, eta: '15 min', requires: { completed: ['M-001'] },
    consequences: { success: 'Você entra no radar da comunidade Aegis. NOVA entra em contato.', failure: 'Nenhum dano — mas o convite ao programa atrasa.' },
    onComplete: { messages: [{ contact: 'nova', node: 'm2_done' }], unlockContacts: ['nova'], reveal: ['recover-pc-07'] },
  },
  {
    id: 'M-003', title: 'Dados Perdidos', client: 'Seu Antônio', org: 'Contabilidade Alvorada', difficulty: 'Iniciante', category: 'Recuperação de dados', story: true,
    description: 'Um escritório formatou o PC por engano. Recupere o balanço de 2030 e a nota de backup.',
    briefing: ['Você vai precisar da ferramenta DataRecovery (Mercado → Ferramentas).', 'O balanço foi apagado, mas os setores continuam no disco. O backup está cifrado por substituição simples.'],
    objectives: [scan('recover-pc-07'), connect('recover-pc-07'), recover('balanco_2030.del'), download('backup_info.enc'), decrypt('backup_info.enc'), submit()],
    reward: { money: 220, xp: 130, rep: 12 }, eta: '20 min', requires: { completed: ['M-002'], level: 2, tools: ['datarecovery'] },
    consequences: { success: 'O escritório recupera um ano inteiro de contabilidade.', failure: 'Dados parcialmente perdidos; o cliente reduz o pagamento.' },
    onComplete: { messages: [{ contact: 'nova', node: 'm3_done' }] },
  },
  {
    id: 'M-004', title: 'Mensagem Cifrada', client: 'O Observador', org: 'Aegis Labs', difficulty: 'Iniciante', category: 'Criptografia', story: true,
    description: 'O Observador deixou um desafio em série: cifra, sequência, anagrama e padrão numérico.',
    briefing: ['Um arquivo challenge_brief.txt está no servidor de treino. Quem o lê descobre o próximo passo.', 'Resolva os quatro enigmas em sequência. Menos erros, melhor pagamento.'],
    objectives: [connect('aegis-train-01'), cat('challenge_brief.txt'), mg('ch_cipher_series', 'Resolver a série de cifras do Observador'), submit()],
    reward: { money: 260, xp: 150, rep: 15 }, eta: '15 min', requires: { completed: ['M-003'], level: 3 },
    consequences: { success: 'O Observador revela quem é: MORPHEUS, fundador da Aegis.', failure: 'O Observador diz que "paciência também é habilidade". Tente de novo.' },
    onComplete: { messages: [{ contact: 'morpheus', node: 'm4_done' }], flags: { morpheus_revealed: true }, reveal: ['kestrel-gw', 'malware-lab'] },
  },
  {
    id: 'M-005', title: 'Atividade Suspeita', client: 'Dario Kest', org: 'Kestrel Media', difficulty: 'Iniciante', category: 'Análise de logs', story: true,
    description: 'Falhas de login de madrugada na Kestrel Media. Descubra a conta, a origem e os horários.',
    briefing: ['O TI da Kestrel notou centenas de falhas entre 02h e 04h.', 'No minigame de logs, marque as linhas suspeitas e identifique usuário e IP de origem. LogHunter ajuda.'],
    objectives: [scan('kestrel-gw'), connect('kestrel-gw'), cat('memo_it.txt'), mg('ch_logs_kestrel', 'Identificar a atividade suspeita nos logs'), submit()],
    reward: { money: 320, xp: 180, rep: 20 }, eta: '20 min', requires: { completed: ['M-004'], level: 3 },
    consequences: { success: 'Dario fecha a brecha e recomenda você.', failure: 'O incidente continua e o cliente contrata outra equipe.' },
    onComplete: { messages: [{ contact: 'nova', node: 'm5_done' }], reveal: ['meridian-clinic', 'kestrel-cms', 'kestrel-db'] },
  },
  {
    id: 'M-006', title: 'Parede de Fogo', client: 'Dra. Rosa Lima', org: 'Meridian Health', difficulty: 'Iniciante', category: 'Firewall', story: true,
    description: 'Configure o firewall virtual de uma clínica: portal aberto, imagens só internas, telnet bloqueado.',
    briefing: ['A clínica está em modo "permitir tudo". Escreva regras que bloqueiem o tráfego hostil sem derrubar o portal de pacientes.', 'Leia policy.txt antes de começar.'],
    objectives: [scan('meridian-clinic'), connect('meridian-clinic'), cat('policy.txt'), mg('ch_fw_meridian', 'Configurar o firewall da Meridian Health'), submit()],
    reward: { money: 380, xp: 220, rep: 24 }, eta: '25 min', requires: { completed: ['M-005'], level: 4 },
    consequences: { success: 'A clínica passa pela auditoria sem sustos.', failure: 'Regras mal feitas derrubam o portal por algumas horas.' },
    onComplete: { messages: [{ contact: 'morpheus', node: 'm6_done' }] },
  },

  // ==================== INTERMEDIÁRIO ====================
  {
    id: 'M-007', title: 'Auditoria Relâmpago', client: 'Dario Kest', org: 'Kestrel Media', difficulty: 'Intermediário', category: 'Auditoria de rede', story: true,
    description: 'Audite a rede da Kestrel: gateway, CMS e banco de dados. Cada serviço precisa ser mapeado e inspecionado.',
    briefing: ['Dario ficou satisfeito e quer a rede inteira revisada. Será preciso a ferramenta NetVision para revelar os nós vizinhos ao escanear o gateway.', 'Depois, mapeie o CMS e o banco, leia o checklist e resolva o desafio de padrões do CMS.'],
    objectives: [scan('kestrel-gw'), scan('kestrel-cms'), scan('kestrel-db'), inspect('kestrel-cms'), inspect('kestrel-db'), connect('kestrel-db'), cat('audit_checklist.txt'), mg('ch_pattern_kestrel', 'Reconhecer o padrão de tráfego do CMS'), submit()],
    reward: { money: 600, xp: 320, rep: 35 }, eta: '35 min', requires: { completed: ['M-006'], level: 5, tools: ['netvision', 'secureshell:2'] },
    consequences: { success: 'A Kestrel assina um contrato recorrente com você.', failure: 'A auditoria atrasa; a diretoria questiona o investimento.' },
    onComplete: { messages: [{ contact: 'ghost', node: 'm7_done' }], reveal: ['aegis-lab-02', 'cobalt-forum', 'obsidian-logistics'], unlockContacts: ['ghost'] },
  },
  {
    id: 'M-008', title: 'Sombras na Empresa', client: 'Marta Obsidian', org: 'Obsidian Logistics', difficulty: 'Intermediário', category: 'Investigação de empresa', story: true,
    description: 'Manifestos de carga vazaram. Investigue a Obsidian Logistics e descubra quem exportou os dados.',
    briefing: ['O nó da Obsidian é de segurança 3: você precisará de SecureShell nível 2.', 'Leia o memo, baixe o log da VPN e monte o caso na investigação digital.'],
    objectives: [scan('obsidian-logistics'), connect('obsidian-logistics'), cat('employee_memo.txt'), download('vpn_access.log'), mg('ch_inv_obsidian', 'Investigar o vazamento de manifestos'), submit()],
    reward: { money: 780, xp: 400, rep: 45 }, eta: '40 min', requires: { completed: ['M-007'], level: 6, tools: ['secureshell:2'] },
    consequences: { success: 'Marta troca todas as senhas e paga um bônus por discrição.', failure: 'O vazamento continua e o inocente Paulo é demitido.' },
    onComplete: { reveal: ['obsidian-market', 'db-archive-7'], messages: [{ contact: 'nova', node: 'm8_done' }] },
  },
  {
    id: 'M-009', title: 'Falha de Laboratório', client: 'Aegis Labs', org: 'Aegis Labs', difficulty: 'Intermediário', category: 'Aplicação de laboratório', story: true,
    description: 'O painel do laboratório 02 guarda uma passphrase cifrada. Ache as falhas e decifre a frase mestra.',
    briefing: ['Escaneie e inspecione o laboratório, baixe admin_panel.bak e analise-o com HexAnalyzer nível 2.', 'A passphrase está cifrada com Vigenère; as pistas estão nas notas do laboratório.'],
    objectives: [scan('aegis-lab-02'), inspect('aegis-lab-02'), connect('aegis-lab-02'), cat('lab_notes.txt'), download('admin_panel.bak'), analyze('admin_panel.bak'), mg('ch_cipher_lab', 'Decifrar a passphrase do painel'), submit()],
    reward: { money: 700, xp: 380, rep: 40 }, eta: '40 min', requires: { completed: ['M-007'], level: 6, tools: ['hexanalyzer:2'] },
    consequences: { success: 'A Aegis corrige o painel e te dá acesso a mais laboratórios.', failure: 'A falha permanece aberta até o próximo ciclo de auditoria.' },
    onComplete: { reveal: ['lab-net-09'] },
  },
  {
    id: 'M-010', title: 'Cofre de Autenticação', client: 'Consórcio Arquivo', org: 'Consórcio Arquivo', difficulty: 'Intermediário', category: 'Autenticação', story: true,
    description: 'Abra o Cofre 7 seguindo as pistas dos guardiões. Quatro dígitos, tentativas limitadas.',
    briefing: ['O consórcio perdeu a combinação do cofre. As pistas são o único caminho.', 'No minigame, cada tentativa devolve quantos dígitos estão certos e no lugar certo. TraceGuard revela um dígito.'],
    objectives: [scan('db-archive-7'), connect('db-archive-7'), cat('vault_manifest.txt'), mg('ch_auth_archive', 'Descobrir a combinação do Cofre 7'), submit()],
    reward: { money: 950, xp: 480, rep: 55 }, eta: '30 min', requires: { completed: ['M-008', 'M-009'], level: 7, tools: ['secureshell:2'] },
    consequences: { success: 'O consórcio recupera seu acervo. Um contato novo aparece nas sombras: VANTA.', failure: 'O cofre trava por 24 horas.' },
    onComplete: { messages: [{ contact: 'vanta', node: 'm10_vanta' }], unlockContacts: ['vanta'], reveal: [] },
  },
  {
    id: 'M-011', title: 'Arquivo Infectado', client: 'Aegis Labs', org: 'Aegis Sandbox', difficulty: 'Intermediário', category: 'Forense de malware (treino)', story: true,
    description: 'Cinco amostras num sandbox: três são maliciosas (de treino). Analise todas e prove sua assinatura.',
    briefing: ['Use HexAnalyzer nível 3 para ler assinaturas.', 'Analise as três amostras suspeitas e depois resolva o desafio de padrões de comportamento.'],
    objectives: [scan('malware-lab'), connect('malware-lab'), download('fatura_0331.pdf.scr'), download('update_driver.bin'), download('cracked_tool.exe'), analyze('fatura_0331.pdf.scr'), analyze('update_driver.bin'), analyze('cracked_tool.exe'), mg('ch_pattern_sandbox', 'Reconhecer o padrão de comportamento das amostras'), submit()],
    reward: { money: 880, xp: 440, rep: 50 }, eta: '40 min', requires: { completed: ['M-009'], level: 7, tools: ['hexanalyzer:3'] },
    consequences: { success: 'A Aegis adiciona suas assinaturas ao banco de treinamento.', failure: 'Amostras limpas são marcadas como maliciosas; o time perde horas.' },
    onComplete: {},
  },
  {
    id: 'M-013', title: 'Rastros de GHOST', client: 'GHOST', org: 'Independente', difficulty: 'Intermediário', category: 'Investigação', story: true,
    description: 'GHOST deixou migalhas no Cobalt Forum. Se você as seguir, chega ao esconderijo dele.',
    briefing: ['"Quem seguir a trilha encontra a casa." — GHOST', 'Leia o tópico, resolva a investigação, revele o esconderijo e conecte-se.'],
    objectives: [scan('cobalt-forum'), connect('cobalt-forum'), cat('thread_ghost.txt'), mg('ch_inv_ghost', 'Montar a trilha de GHOST'), scan('ghost-safehouse'), connect('ghost-safehouse'), cat('dead_drop.txt'), submit()],
    reward: { money: 1100, xp: 520, rep: 60 }, eta: '45 min', requires: { completed: ['M-010'], level: 8, tools: ['secureshell:2'] },
    consequences: { success: 'GHOST te trata como igual. Ele conta sobre o infiltrado.', failure: 'GHOST muda de esconderijo. Você perde a chance.' },
    onComplete: { messages: [{ contact: 'ghost', node: 'm13_done' }], reveal: ['ghost-safehouse', 'aegis-vault'] },
  },

  // ==================== AVANÇADO ====================
  {
    id: 'M-014', title: 'O Infiltrado', client: 'MORPHEUS', org: 'Aegis Labs', difficulty: 'Avançado', category: 'Contra-inteligência', story: true,
    description: 'Há um infiltrado na Aegis. Entre na rede interna, analise acessos e identifique quem vende o plantão.',
    briefing: ['O nó aegis-vault tem segurança 3. A rede interna guarda logs de acesso e escalas.', 'Analise os logs, cruze com a investigação e entregue o nome ao mentor.'],
    objectives: [scan('aegis-vault'), connect('aegis-vault'), cat('staff_roster.txt'), mg('ch_logs_aegis', 'Analisar os acessos internos da Aegis'), mg('ch_inv_mole', 'Identificar o infiltrado'), submit()],
    reward: { money: 1900, xp: 700, rep: 90 }, eta: '1 h', requires: { completed: ['M-011', 'M-013'], level: 9, tools: ['secureshell:2', 'loghunter:1'] },
    consequences: { success: 'O infiltrado é exposto. A Aegis te vê como aliado de verdade.', failure: 'O infiltrado percebe e some. A Aegis fica vulnerável.' },
    onComplete: { messages: [{ contact: 'morpheus', node: 'm14_done' }], flags: { mole_found: true }, reveal: ['nordwatch-bank'] },
  },
  {
    id: 'M-015', title: 'Auditoria Nordwatch', client: 'Conselho Nordwatch', org: 'Nordwatch Bank', difficulty: 'Avançado', category: 'Auditoria de infraestrutura', story: true,
    description: 'Auditoria completa do perímetro de um banco fictício: firewall e logs de exportação.',
    briefing: ['Nó de segurança 4: SecureShell nível 3 é obrigatório.', 'Escopo: revisar firewall e logs de exportação. Nada fora do laboratório simulado.'],
    objectives: [scan('nordwatch-bank'), connect('nordwatch-bank'), cat('audit_scope.txt'), mg('ch_fw_nordwatch', 'Revisar o firewall do perímetro'), mg('ch_logs_nordwatch', 'Analisar os logs de exportação'), submit()],
    reward: { money: 2600, xp: 880, rep: 110 }, eta: '1 h 15', requires: { completed: ['M-014'], level: 10, tools: ['secureshell:3', 'firewallx:1', 'loghunter:2'] },
    consequences: { success: 'O banco passa na fiscalização e te contrata para uma segunda rodada.', failure: 'Lacunas persistem; o banco leva multa e culpa o relatório.' },
    onComplete: { messages: [{ contact: 'nova', node: 'm15_done' }], reveal: ['orbital-grid'] },
  },
  {
    id: 'M-016', title: 'Rede Elétrica', client: 'Orbital Grid Authority', org: 'Orbital Grid Authority', difficulty: 'Avançado', category: 'Infraestrutura crítica', story: true,
    description: 'Proteja a infraestrutura crítica simulada: estabilize a carga e restrinja o tráfego hostil.',
    briefing: ['O gerenciador de recursos usa a capacidade real do seu computador: melhore CPU e RAM para ter folga.', 'O gerenciador exige CyberCore OS ou superior.'],
    objectives: [scan('orbital-grid'), connect('orbital-grid'), cat('scada_notice.txt'), mg('ch_res_grid', 'Estabilizar a carga dos servidores'), mg('ch_fw_grid', 'Restringir o tráfego hostil da subestação 4'), submit()],
    reward: { money: 3200, xp: 1000, rep: 130 }, eta: '1 h 15', requires: { completed: ['M-015'], level: 11, tools: ['secureshell:3', 'packetview:1'], os: 1 },
    consequences: { success: 'A rede estabiliza. A imprensa ficcional te chama de "o técnico anônimo".', failure: 'Há instabilidade e falta de energia parcial na simulação.' },
    onComplete: { messages: [{ contact: 'morpheus', node: 'm16_done' }] },
  },
  {
    id: 'M-017', title: 'Sequência Técnica', client: 'Banca Aegis', org: 'Aegis Labs', difficulty: 'Avançado', category: 'Certificação', story: true,
    description: 'Prova de certificação em quatro módulos: padrões, criptografia, autenticação e logs.',
    briefing: ['Quatro módulos em sequência na rede de certificação.', 'Sua infraestrutura e suas habilidades ajudam: Criptografia 2 libera o módulo de cifras.'],
    objectives: [connect('lab-net-09'), cat('exam_rules.txt'), mg('ch_pattern_hard', 'Módulo 1 — Padrões'), mg('ch_cipher_hard', 'Módulo 2 — Criptografia'), mg('ch_auth_hard', 'Módulo 3 — Autenticação'), mg('ch_logs_seq', 'Módulo 4 — Logs'), submit()],
    reward: { money: 3400, xp: 1100, rep: 140 }, eta: '1 h 30', requires: { completed: ['M-014'], level: 11, tools: ['cryptlab:2', 'loghunter:2', 'secureshell:2'] },
    consequences: { success: 'Certificação Aegis nível 3 concedida.', failure: 'Você precisa repetir a prova após uma semana.' },
    onComplete: { messages: [{ contact: 'nova', node: 'm17_done' }] },
  },
  {
    id: 'M-018', title: 'Traição', client: 'MORPHEUS', org: 'Aegis Labs', difficulty: 'Avançado', category: 'Resposta a incidentes', story: true,
    description: 'Alguém abriu a porta da Aegis para um ataque. Rastreie os logs e organize a defesa em tempo real.',
    briefing: ['VANTA mostra suas verdadeiras cores: sempre trabalhou para a Black Lotus.', 'Descubra por onde o ataque entrou e feche as portas da Aegis.'],
    objectives: [connect('aegis-lab-02'), mg('ch_logs_betrayal', 'Rastrear quem abriu a porta'), mg('ch_fw_aegis_def', 'Defender a Aegis sob ataque'), submit()],
    reward: { money: 4200, xp: 1300, rep: 160 }, eta: '1 h', requires: { completed: ['M-016', 'M-017'], level: 12, tools: ['traceguard:1', 'secureshell:3'] },
    consequences: { success: 'A Aegis sobrevive. Os rivais agora sabem seu nome.', failure: 'A sede da Aegis sofre danos graves na simulação.' },
    onComplete: { messages: [{ contact: 'vanta', node: 'm18_betrayal' }, { contact: 'ghost', node: 'm18_ghost' }], reveal: ['helix-core', 'blacklotus-relay'] },
  },

  // ==================== ESPECIALISTA ====================
  {
    id: 'M-019', title: 'Operação Meia-Noite', client: 'MORPHEUS', org: 'Aegis Labs', difficulty: 'Especialista', category: 'Operação com limite de tempo', story: true,
    description: 'Penetre na contrainteligência do núcleo Helix (ambiente autorizado) antes que o relógio acabe. Doze minutos.',
    briefing: ['Você tem 12 minutos reais. Cofre de seis dígitos, cifra Vigenère e um pipeline de processos.', 'Se o tempo acabar, a operação falha.'],
    objectives: [scan('helix-core'), connect('helix-core'), mg('ch_auth_helix', 'Abrir o cofre central da Helix'), mg('ch_cipher_helix', 'Decifrar as mensagens do núcleo'), mg('ch_res_helix', 'Executar o pipeline de contrainteligência'), submit()],
    reward: { money: 7000, xp: 2000, rep: 220 }, eta: '12 min (cronometrado)', requires: { completed: ['M-018'], level: 14, tools: ['secureshell:3', 'cryptlab:3', 'traceguard:2'] },
    consequences: { success: 'Provas do "Projeto Lótus Azul" em mãos. Tudo muda.', failure: 'A janela se fecha. A Helix troca todas as chaves.' },
    timeLimit: 720, maxErrors: 12,
    onComplete: { messages: [{ contact: 'morpheus', node: 'm19_done' }], flags: { helix_evidence: true } },
  },
  {
    id: 'M-020', title: 'Protocolo Blackout', client: 'MORPHEUS', org: 'Aegis Labs', difficulty: 'Especialista', category: 'Operação final', story: true,
    description: 'A Black Lotus quer apagar a rede elétrica fictícia e culpar a Aegis. Pare o Protocolo Blackout e decida o destino das provas.',
    briefing: ['Entre no relay da Black Lotus, analise logs, conecte as peças e contenha o ataque.', 'No fim, uma escolha moral definirá seu legado.'],
    objectives: [scan('blacklotus-relay'), connect('blacklotus-relay'), cat('blackout_plan.txt'), mg('ch_logs_lotus', 'Encontrar a assinatura da operação'), mg('ch_inv_final', 'Montar a teia Black Lotus'), mg('ch_res_final', 'Conter o ataque (contra-ataque)'),
      { id: 'final', text: 'Decidir o destino das provas (escolha moral)', hint: 'Abra Contatos → MORPHEUS e escolha', match: { type: 'choice', ref: 'final_choice' } }, submit()],
    reward: { money: 12000, xp: 3500, rep: 400 }, eta: '2 h', requires: { completed: ['M-019'], level: 16, tools: ['traceguard:2', 'netvision:2', 'packetview:2', 'secureshell:3'] },
    consequences: { success: 'A rede elétrica fictícia é salva. Sua lenda começa.', failure: 'O Blackout acontece. Mas não é o fim — você pode tentar de novo.' },
    onComplete: { messages: [{ contact: 'morpheus', node: 'epilogue' }], flags: { game_complete: true } },
  },
];

// Missões opcionais oferecidas por diálogos
export const OFFER_MISSIONS: MissionDef[] = [
  {
    id: 'M-012', title: 'Contrato Sombra', client: 'VANTA', org: 'Desconhecido', difficulty: 'Intermediário', category: 'Contrato de alto risco', story: true,
    description: 'VANTA paga o dobro para obter a escala de plantão da Aegis. Há consequências morais — e VANTA nunca explica para quem trabalha.',
    briefing: ['A escala está no lab 02, cifrada por substituição. Você já conhece a rede.', 'Pagamento alto. Se a Aegis descobrir, sua reputação com ela afunda.'],
    objectives: [connect('aegis-lab-02'), download('roster.dat'), decrypt('roster.dat'), submit()],
    reward: { money: 1700, xp: 420, rep: -25 }, eta: '30 min', requires: { offered: true, level: 7, tools: ['secureshell:2'] },
    consequences: { success: 'Dinheiro rápido — e uma dívida moral com VANTA.', failure: 'VANTA descarta você sem pagar.' },
    onComplete: { flags: { betrayed_aegis: true }, messages: [{ contact: 'vanta', node: 'm12_done' }] },
  },
];

export const ALL_STORY: MissionDef[] = [...STORY_MISSIONS, ...OFFER_MISSIONS];
export const MISSION_MAP: Record<string, MissionDef> = Object.fromEntries(ALL_STORY.map((m) => [m.id, m]));
