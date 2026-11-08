import type { ChallengeDef, NodeDef } from '../types';

// Todos os alvos abaixo são FICTÍCIOS e existem apenas dentro da simulação local.
// Endereços na faixa 10.77.x.x são identificadores de jogo; nenhum tráfego real é gerado.

export const NODES: NodeDef[] = [
  {
    id: 'pf-workstation', name: 'Pixel Forge — Estação de Helena', address: '10.77.1.14', kind: 'empresa', org: 'Pixel Forge Studio',
    desc: 'Estação de trabalho de uma pequena produtora de jogos indie. Recebeu um anexo estranho por e-mail.',
    security: 1, pos: [18, 62], links: ['aegis-train-01'], startsDiscovered: true,
    services: [
      { port: 21, name: 'ftp-sim', version: '0.9', state: 'open', vuln: 'Transferência sem criptografia (SIM-2031-0007)' },
      { port: 80, name: 'http-sim', version: '1.1', state: 'open', note: 'Painel de impressora exposto' },
      { port: 3389, name: 'rdp-sim', version: '3.0', state: 'filtered', note: 'Acesso remoto restrito à rede interna' },
    ],
    files: [
      { name: 'inbox_note.txt', size: 2, content: 'De: Helena Duarte <helena@pixelforge.sim>\nPara: suporte\nAssunto: Anexo estranho\n\nRecebi um "orçamento final" de um fornecedor que eu não conheço.\nO arquivo termina em .scr, o que me deixou desconfiada. Não abri.\nPode olhar com calma? Está na pasta /public.\n\n— Helena' },
      { name: 'orcamento_final.pdf.scr', size: 740, malicious: true, content: '[binário simulado — 740 KB]\nMZ-SIM\x00\x00\x03\x00 cabeçalho de executável de treinamento',
        analysis: [
          'L1|Tipo declarado: documento PDF. Tipo real: executável de treino (extensão dupla).',
          'L1|Tamanho: 740 KB — incompatível com um orçamento de 1 página.',
          'L2|String oculta encontrada: "phone-home.sim/update" (domínio fictício de treinamento).',
          'L2|Cabeçalho adulterado para imitar PDF; ícone falsificado.',
          'L3|Assinatura SIM-TROJ-001 detectada: comportamento de downloader (inofensivo, apenas simulado).',
        ] },
      { name: 'readme_pf.txt', size: 1, content: 'Pixel Forge Studio — rede interna\nSuporte de TI: terceirizado.\nBackups: toda sexta-feira.\n' },
    ],
    challenges: [],
    facts: ['Estação com antivírus desatualizado', 'Usuário alvo de phishing simulado'],
  },
  {
    id: 'aegis-train-01', name: 'Aegis Labs — Servidor de Treinamento 01', address: '10.77.2.5', kind: 'treinamento', org: 'Aegis Labs',
    desc: 'Servidor oficial de treinamento da Aegis Labs. Projetado para iniciantes testarem suas primeiras habilidades.',
    security: 1, pos: [34, 78], links: ['pf-workstation', 'aegis-lab-02', 'malware-lab'], startsDiscovered: true,
    services: [
      { port: 21, name: 'ftp-sim', version: '1.2', state: 'open', vuln: 'Login anônimo habilitado (SIM-2031-0042)' },
      { port: 22, name: 'ssh-sim', version: '2.0', state: 'open', note: 'Autenticação por chave exigida' },
      { port: 80, name: 'http-sim', version: '1.1', state: 'open', vuln: 'Listagem de diretórios ativa (SIM-2031-0043)' },
      { port: 23, name: 'telnet-sim', version: '0.5', state: 'filtered', note: 'Desativado por política' },
    ],
    files: [
      { name: 'welcome.txt', size: 1, content: 'BEM-VINDO À AEGIS LABS — PROGRAMA DE TREINAMENTO\n\nEste servidor é um ambiente seguro e isolado.\nNada aqui afeta sistemas reais.\n\nExercício 01: decifre o arquivo exercise_01.enc.\nDica: os antigos romanos já usavam essa técnica.' },
      { name: 'exercise_01.enc', size: 3, encrypted: { challenge: 'ch_caesar_01', plain: 'PARABENS. A PALAVRA DE ACESSO DO NIVEL DOIS E SENTINELA. CONTINUE ASSIM.' }, content: '', analysis: ['L1|Padrão de cifra de deslocamento detectado (alfabeto rotacionado).'] },
      { name: 'challenge_brief.txt', size: 2, content: 'DESAFIO DE NÍVEL 2 — MENSAGEM CIFRADA\n\nSe você chegou até aqui, já provou ter faro.\nExecute o desafio ch_cipher_series para demonstrar domínio de padrões:\n   run ch_cipher_series\n\n— Observador' },
    ],
    challenges: ['ch_caesar_01', 'ch_pattern_01', 'ch_cipher_series'],
    facts: ['Ambiente de treinamento oficial', 'Dois desafios de segurança abertos a qualquer aluno'],
  },
  {
    id: 'recover-pc-07', name: 'Contabilidade Alvorada — PC 07', address: '10.77.1.31', kind: 'empresa', org: 'Contabilidade Alvorada',
    desc: 'Computador de um escritório de contabilidade. O disco foi formatado por engano e há arquivos a recuperar.',
    security: 1, pos: [8, 40], links: ['pf-workstation'], startsDiscovered: false,
    services: [
      { port: 445, name: 'smb-sim', version: '2.1', state: 'open', vuln: 'Compartilhamento sem senha (SIM-2031-0019)' },
      { port: 80, name: 'http-sim', version: '1.0', state: 'closed' },
    ],
    files: [
      { name: 'balanco_2030.del', size: 220, recoverable: true, recovered: 'BALANÇO 2030 — Contabilidade Alvorada\nReceita: 482.300\nDespesas: 391.870\nResultado: 90.430\nObs.: arquivo restaurado a partir de setores marcados como livres.', content: '[setores marcados como livres — conteúdo ilegível sem recuperação]' },
      { name: 'backup_info.enc', size: 4, encrypted: { challenge: 'ch_subst_recover', plain: 'O BACKUP DO CONTADOR ESTA NO DISCO DOIS PASTA ARQUIVO MORTO' }, content: '', analysis: ['L1|Cifra de substituição simples: cada letra trocada por outra de forma fixa.'] },
      { name: 'recado.txt', size: 1, content: 'Pessoal, formatamos o PC 07 sem querer. O Seu Antônio jura que o balanço estava lá. Socorro!' },
    ],
    challenges: ['ch_subst_recover'],
    facts: ['Disco formatado recentemente', 'Dados recuperáveis em setores livres'],
  },
  {
    id: 'kestrel-gw', name: 'Kestrel Media — Gateway', address: '10.77.3.1', kind: 'empresa', org: 'Kestrel Media',
    desc: 'Gateway de acesso de uma agência de mídia digital. A equipe de TI notou tentativas estranhas de login de madrugada.',
    security: 2, pos: [52, 55], links: ['kestrel-cms', 'kestrel-db', 'aegis-lab-02', 'cobalt-forum'], startsDiscovered: false, minLevel: 3,
    services: [
      { port: 22, name: 'ssh-sim', version: '2.4', state: 'open', vuln: 'Limite de tentativas desativado (SIM-2031-0112)' },
      { port: 443, name: 'https-sim', version: '1.3', state: 'open' },
      { port: 3306, name: 'sql-sim', version: '5.1', state: 'filtered', note: 'Acessível apenas pela rede interna' },
    ],
    files: [
      { name: 'auth.log', size: 480, content: '[registro de autenticação — abra o desafio de análise de logs: run ch_logs_kestrel]' },
      { name: 'memo_it.txt', size: 1, content: 'MEMO — TI Kestrel Media\nDe: Dario Kest\n\nO monitoramento mostrou muitas falhas de login entre 02h e 04h.\nQuem tentava entrar parecia usar uma conta de serviço (svc_*).\nPrecisamos saber QUEM, DE ONDE e QUANDO. Contrato aberto.' },
      { name: 'network_map.txt', size: 1, content: 'Topologia Kestrel:\n  gateway -> kestrel-cms (web)\n  gateway -> kestrel-db  (dados)\n  gateway -> aegis-lab-02 (laboratório parceiro)' },
    ],
    challenges: ['ch_logs_kestrel', 'ch_fw_kestrel'],
    facts: ['Falhas de login em massa durante a madrugada', 'Conta de serviço envolvida'],
  },
  {
    id: 'kestrel-cms', name: 'Kestrel Media — CMS Web', address: '10.77.3.8', kind: 'empresa', org: 'Kestrel Media',
    desc: 'Sistema de gestão de conteúdo da Kestrel. Aplicação web com plug-ins desatualizados.',
    security: 2, pos: [66, 42], links: ['kestrel-gw'], startsDiscovered: false, minLevel: 4,
    services: [
      { port: 80, name: 'http-sim', version: '2.2', state: 'open', vuln: 'Plug-in de upload sem validação (SIM-2031-0140)' },
      { port: 8080, name: 'admin-sim', version: '1.0', state: 'open', vuln: 'Painel admin sem MFA (SIM-2031-0141)' },
    ],
    files: [{ name: 'cms_changelog.txt', size: 2, content: 'v2.2.1 — plugin de galeria atualizado\nv2.2.0 — upload de imagens liberado a todos os usuários\nv2.1.9 — correção de ortografia' }],
    challenges: ['ch_pattern_kestrel'],
    facts: ['Plug-in vulnerável de upload', 'Painel administrativo exposto'],
  },
  {
    id: 'kestrel-db', name: 'Kestrel Media — Banco de Dados', address: '10.77.3.20', kind: 'banco de dados', org: 'Kestrel Media',
    desc: 'Banco de dados de clientes da Kestrel (dados totalmente fictícios).',
    security: 3, pos: [74, 62], links: ['kestrel-gw'], startsDiscovered: false, minLevel: 4,
    services: [
      { port: 3306, name: 'sql-sim', version: '5.1', state: 'open', vuln: 'Conta padrão com privilégios amplos (SIM-2031-0150)' },
      { port: 22, name: 'ssh-sim', version: '2.4', state: 'filtered', note: 'Somente via gateway' },
    ],
    files: [
      { name: 'audit_checklist.txt', size: 2, content: 'CHECKLIST DE AUDITORIA — KESTREL\n[ ] Inventário de serviços\n[ ] Revisão de contas padrão\n[ ] Teste de padrões de acesso\n[ ] Relatório final\n\nObs.: auditoria apenas em ambiente de laboratório autorizado.' },
    ],
    challenges: [],
    facts: ['Contas padrão ainda ativas', 'Backup noturno às 03h'],
  },
  {
    id: 'meridian-clinic', name: 'Meridian Health — Rede da Clínica', address: '10.77.4.2', kind: 'empresa', org: 'Meridian Health',
    desc: 'Rede de uma clínica fictícia. O firewall está em modo "permitir tudo" desde a mudança de sede.',
    security: 2, pos: [78, 28], links: ['aegis-lab-02'], startsDiscovered: false, minLevel: 4,
    services: [
      { port: 443, name: 'portal-sim', version: '3.1', state: 'open', note: 'Portal de pacientes' },
      { port: 104, name: 'imaging-sim', version: '1.8', state: 'open', vuln: 'Sem restrição de origem (SIM-2031-0201)' },
      { port: 23, name: 'telnet-sim', version: '0.5', state: 'open', vuln: 'Protocolo legado exposto (SIM-2031-0202)' },
    ],
    files: [
      { name: 'policy.txt', size: 2, content: 'POLÍTICA DE REDE — MERIDIAN HEALTH\n\n1. O portal de pacientes (443) deve ficar aberto ao mundo.\n2. Imagens médicas (104) só podem ser acessadas pela rede interna 10.x.\n3. Telnet deve estar bloqueado.\n4. Nenhum tráfego vindo de fontes hostis conhecidas.\n\nRegras do firewall: configure e teste. Não derrube o portal!' },
      { name: 'incident_report.txt', size: 2, content: 'Incidente nº 12 — Tentativas de conexão em massa à porta 23 vindas de blocos externos. Nenhum dado afetado ainda.' },
    ],
    challenges: ['ch_fw_meridian'],
    facts: ['Firewall em modo permissivo', 'Fontes hostis monitoradas por lista negra'],
  },
  {
    id: 'cobalt-forum', name: 'Cobalt Forum', address: '10.77.9.9', kind: 'fórum', org: 'Comunidade Cobalt',
    desc: 'Fórum fictício de entusiastas de segurança. Rumores, ofertas e pistas circulam entre os tópicos.',
    security: 2, pos: [58, 20], links: ['kestrel-gw', 'obsidian-market'], startsDiscovered: false, minLevel: 4,
    services: [{ port: 443, name: 'forum-sim', version: '4.0', state: 'open' }, { port: 6667, name: 'chat-sim', version: '1.0', state: 'open', note: 'Salas privadas' }],
    files: [
      { name: 'thread_ghost.txt', size: 3, content: 'TÓPICO: "Quem é GHOST?"\n\n[nullbyte] Dizem que ele largou a Aegis Labs faz 4 anos.\n[r4dar] Eu vi uma conversa onde ele citou "Black Lotus" e sumiu do mapa.\n[GHOST] Pare de falar de mim. Quem quiser trabalhar, siga a trilha de migalhas: o último post às 03:17, o relay 9 e o arquivo "mirror".\n[nullbyte] ...sumiu.' },
      { name: 'thread_vanta.txt', size: 2, content: 'TÓPICO: "Contratos de alto risco"\n\n[V] Pago bem por trabalhos que ninguém quer fazer. Sem perguntas.\n[mod] Este tópico será removido. Regras da casa.\n[V] Quem quiser, procure por VANTA.' },
      { name: 'thread_rumor.txt', size: 2, content: 'TÓPICO: "Vazamento na Aegis?"\n\n[r4dar] Alguém lá dentro está vendendo horários de acesso.\n[nullbyte] Se for verdade, tem um infiltrado.\n[mod] Sem acusações sem prova.' },
    ],
    challenges: ['ch_inv_ghost'],
    facts: ['Canal de comunicação de GHOST', 'Rumores sobre um infiltrado na Aegis'],
  },
  {
    id: 'aegis-lab-02', name: 'Aegis Labs — Laboratório Web 02', address: '10.77.2.40', kind: 'laboratório', org: 'Aegis Labs',
    desc: 'Aplicação de laboratório da Aegis com falhas propositais (e algumas não propositais).',
    security: 2, pos: [44, 38], links: ['aegis-train-01', 'kestrel-gw', 'meridian-clinic', 'lab-net-09', 'aegis-vault'], startsDiscovered: false, minLevel: 5,
    services: [
      { port: 80, name: 'http-sim', version: '2.0', state: 'open', vuln: 'Validação de sessão fraca (SIM-2031-0260)' },
      { port: 8443, name: 'admin-sim', version: '1.4', state: 'open', vuln: 'Painel com credencial derivada de padrão previsível (SIM-2031-0261)' },
      { port: 22, name: 'ssh-sim', version: '2.4', state: 'filtered' },
    ],
    files: [
      { name: 'admin_panel.bak', size: 96, malicious: false, content: '[backup do painel — conteúdo binário simulado]', analysis: [
        'L1|Backup de aplicação web (formato .bak).',
        'L2|Comentário de desenvolvedor: "chave de sessão = nome do mentor + data" — prática insegura.',
        'L2|Pista: a senha mestra é uma frase cifrada com Vigenère; a chave tem 6 letras e é o sobrenome do fundador (veja lab_notes.txt).',
      ] },
      { name: 'lab_notes.txt', size: 2, content: 'Notas do laboratório 02\n- Painel admin usa a mesma passphrase desde 2029.\n- A passphrase está cifrada em admin_panel.bak.\n- Chave de decifragem: o sobrenome do fundador do programa, Dr. Elias Marrow (MORPHEUS é só o codinome).' },
      { name: 'roster.dat', size: 18, encrypted: { challenge: 'ch_roster', plain: 'LISTA DE ACESSOS AEGIS LABS SEDE PRINCIPAL HORARIOS DE PLANTAO DOS ANALISTAS' }, content: '', analysis: ['L1|Cifra de substituição. Conteúdo sensível: escala de plantão da Aegis.'] },
    ],
    challenges: ['ch_cipher_lab', 'ch_auth_lab', 'ch_roster', 'ch_logs_betrayal', 'ch_fw_aegis_def'],
    facts: ['Painel com senha mestra fraca', 'Parceiro de Kestrel Media'],
  },
  {
    id: 'obsidian-logistics', name: 'Obsidian Logistics', address: '10.77.5.12', kind: 'empresa', org: 'Obsidian Logistics',
    desc: 'Empresa de logística fictícia. Manifestos de carga vazaram para um concorrente e ninguém sabe como.',
    security: 3, pos: [30, 20], links: ['obsidian-market'], startsDiscovered: false, minLevel: 6,
    services: [
      { port: 443, name: 'https-sim', version: '1.3', state: 'open' },
      { port: 22, name: 'ssh-sim', version: '3.0', state: 'open', vuln: 'Chave de serviço compartilhada (SIM-2031-0310)' },
      { port: 5432, name: 'sql-sim', version: '6.0', state: 'filtered' },
    ],
    files: [
      { name: 'employee_memo.txt', size: 2, content: 'MEMO INTERNO — OBSIDIAN LOGISTICS\n\nA diretoria suspeita de vazamento de manifestos de carga entre terça e quinta.\nO acesso por VPN deve ser revisado. Há registros de um login às 23h47 que ninguém reconhece.\nO estagiário Paulo alega que estava de folga. O gerente Ricardo diz que estava em reunião.' },
      { name: 'vpn_access.log', size: 220, content: '2031-03-12 08:02 VPN login  paulo.m     ip=10.77.5.40  OK\n2031-03-12 09:15 VPN login  ricardo.s   ip=10.77.5.12  OK\n2031-03-12 23:47 VPN login  svc_report  ip=10.77.9.77  OK  (conta de serviço, fora do expediente)\n2031-03-12 23:51 EXPORT     svc_report  shipping_manifest.csv (42 MB)\n2031-03-13 00:02 VPN logout svc_report\n2031-03-13 08:30 VPN login  paulo.m     ip=10.77.5.40  OK' },
      { name: 'shipping_manifest.csv', size: 1800, content: 'id;origem;destino;carga\n1021;Porto A;Hub 3;Eletrônicos\n1022;Porto B;Hub 1;Medicamentos\n1023;Porto A;Hub 2;Peças\n...' },
    ],
    challenges: ['ch_inv_obsidian'],
    facts: ['Vazamento de manifestos', 'Login de conta de serviço fora do horário'],
  },
  {
    id: 'obsidian-market', name: 'Obsidian Market', address: '10.77.9.30', kind: 'mercado', org: 'Obsidian Market',
    desc: 'Mercado virtual fictício, cheio de leilões de dados sintéticos e rumores.',
    security: 3, pos: [40, 8], links: ['obsidian-logistics', 'cobalt-forum'], startsDiscovered: false, minLevel: 6,
    services: [{ port: 443, name: 'market-sim', version: '5.2', state: 'open' }, { port: 9050, name: 'onion-sim', version: '1.0', state: 'filtered', note: 'Roteamento anônimo simulado' }],
    files: [
      { name: 'listing_board.txt', size: 2, content: 'LEILÕES ATIVOS\n#77 — "Manifestos de carga Obsidian" (dados sintéticos de treino) — 2.4k cr\n#81 — "Escala de plantão Aegis" — oferta de VANTA\n#88 — "Antivírus roubado (fake)" — golpe, evite' },
    ],
    challenges: ['ch_pattern_market'],
    facts: ['Leilão com dados do Obsidian', 'VANTA tem anúncios ativos'],
  },
  {
    id: 'malware-lab', name: 'Aegis Sandbox — Amostras', address: '10.77.2.99', kind: 'laboratório', org: 'Aegis Labs',
    desc: 'Ambiente isolado de amostras de treinamento. Nenhum arquivo aqui é funcional — mas alguns se comportam como se fossem.',
    security: 2, pos: [20, 90], links: ['aegis-train-01'], startsDiscovered: false, minLevel: 6,
    services: [{ port: 22, name: 'ssh-sim', version: '2.0', state: 'open' }, { port: 8000, name: 'sandbox-sim', version: '1.1', state: 'open', note: 'Execução emulada' }],
    files: [
      { name: 'fatura_0331.pdf.scr', size: 512, malicious: true, content: '[amostra 1 — executável com ícone de PDF]', analysis: ['L1|Extensão dupla suspeita (.pdf.scr).', 'L2|String oculta: "beacon.sim/ping".', 'L3|Assinatura SIM-TROJ-014 (treino): downloader.'] },
      { name: 'relatorio_vendas.xlsx', size: 88, malicious: false, content: '[planilha comum — 3 abas, sem macros]', analysis: ['L1|Planilha limpa. Sem macros, sem conexões externas.', 'L3|Nenhuma assinatura maliciosa.'] },
      { name: 'update_driver.bin', size: 1040, malicious: true, content: '[amostra 2 — pseudo-driver]', analysis: ['L1|Binário sem assinatura digital válida.', 'L2|Entrada de persistência: tarefa agendada "SysUpdateSim".', 'L3|Assinatura SIM-ROOT-003 (treino): rootkit emulado.'] },
      { name: 'ata_reuniao.docx', size: 40, malicious: false, content: '[documento de texto comum]', analysis: ['L1|Documento limpo.', 'L3|Nenhuma assinatura maliciosa.'] },
      { name: 'cracked_tool.exe', size: 2200, malicious: true, content: '[amostra 3 — "ferramenta crackeada"]', analysis: ['L1|Empacotador desconhecido; entropia alta.', 'L2|String oculta: "keylog.sim/up".', 'L3|Assinatura SIM-SPY-009 (treino): coletor de teclas emulado.'] },
    ],
    challenges: ['ch_pattern_sandbox'],
    facts: ['Três amostras maliciosas simuladas', 'Duas amostras limpas misturadas'],
  },
  {
    id: 'db-archive-7', name: 'Arquivo 7 — Cofre de Dados', address: '10.77.6.7', kind: 'banco de dados', org: 'Consórcio Arquivo',
    desc: 'Cofre de dados históricos de um consórcio de pesquisa. Acesso protegido por combinação numérica.',
    security: 3, pos: [88, 50], links: ['kestrel-db', 'nordwatch-bank'], startsDiscovered: false, minLevel: 7,
    services: [{ port: 7777, name: 'vault-sim', version: '2.0', state: 'open', vuln: 'Combinação numérica de quatro dígitos (SIM-2031-0400)' }, { port: 443, name: 'https-sim', version: '1.3', state: 'open' }],
    files: [
      { name: 'vault_manifest.txt', size: 3, content: 'COFRE 7 — MANIFESTO\n\nConteúdo: 12 volumes de dados históricos (sintéticos).\nCombinação: fornecida por pistas dos guardiões.\nSe o cofre for aberto, registre o acesso no relatório.\n\nNota do guardião: "Quem abre o cofre sem as pistas, falha. Quem as segue, entra."' },
    ],
    challenges: ['ch_auth_archive'],
    facts: ['Cofre guarda dados históricos', 'Tentativas limitadas de combinação'],
  },
  {
    id: 'ghost-safehouse', name: 'Esconderijo de GHOST', address: '10.77.13.13', kind: 'rede privada', org: 'Independente',
    desc: 'Um nó remoto e discreto. GHOST mantém suas cópias de segurança aqui.',
    security: 3, pos: [70, 8], links: ['cobalt-forum'], startsDiscovered: false, minLevel: 8,
    services: [{ port: 22, name: 'ssh-sim', version: '3.1', state: 'open', note: 'Somente chaves conhecidas' }, { port: 9001, name: 'relay-sim', version: '0.9', state: 'open' }],
    files: [
      { name: 'dead_drop.txt', size: 2, content: 'Se você chegou até aqui, é bom. Ou teimoso.\n\nVou ser direto: três anos atrás deixei a Aegis porque descobri que alguém lá dentro vendia horários de plantão a um grupo chamado BLACK LOTUS.\nNão consegui provar. Ninguém acreditou.\n\nSe você achar o infiltrado, me avise. Ele é bom: apaga rastros em logs. Mas o plantão dele nunca bate com o ponto.\n— G.' },
      { name: 'mirror_index.txt', size: 1, content: 'espelho 1: logs Aegis (cópia de 2029)\nespelho 2: manifestos Obsidian\nespelho 3: nada. Nunca confie em espelho 3.' },
    ],
    challenges: [],
    facts: ['GHOST mantém backups aqui', 'Menção ao grupo BLACK LOTUS'],
  },
  {
    id: 'aegis-vault', name: 'Aegis Labs — Rede Interna (Vault)', address: '10.77.2.200', kind: 'rede privada', org: 'Aegis Labs',
    desc: 'Rede interna e restrita da Aegis. Registros de acesso do pessoal e documentos sensíveis (fictícios).',
    security: 3, pos: [30, 48], links: ['aegis-lab-02'], startsDiscovered: false, minLevel: 9,
    services: [{ port: 22, name: 'ssh-sim', version: '3.0', state: 'open', vuln: 'Chave de suporte compartilhada (SIM-2031-0501)' }, { port: 8443, name: 'hr-sim', version: '2.2', state: 'open', note: 'Sistema de ponto eletrônico' }],
    files: [
      { name: 'staff_access.log', size: 350, content: '[registros de acesso do pessoal — execute: run ch_logs_aegis]' },
      { name: 'staff_roster.txt', size: 2, content: 'EQUIPE AEGIS LABS (plantão noturno)\n- Dra. Iris Tanaka — Plantão seg/qua\n- Marcus Hale — Plantão ter/qui (engenheiro de sistemas)\n- Lena Koskov — Plantão sex/sáb\n- Tomás Abreu — Plantão dom (estagiário)' },
      { name: 'timecard.csv', size: 6, content: 'nome;dia;entrada;saida\nMarcus Hale;ter;22:00;06:00\nMarcus Hale;qui;22:00;06:00\nIris Tanaka;seg;22:00;06:00\nIris Tanaka;qua;22:00;06:00' },
    ],
    challenges: ['ch_logs_aegis', 'ch_inv_mole'],
    facts: ['Há um infiltrado nesta rede', 'Escala de plantão vazou para terceiros'],
  },
  {
    id: 'lab-net-09', name: 'Aegis Labs — Rede de Certificação 09', address: '10.77.2.90', kind: 'rede privada', org: 'Aegis Labs',
    desc: 'Rede de provas da Aegis: sequências de desafios técnicos para candidatos avançados.',
    security: 3, pos: [14, 22], links: ['aegis-lab-02'], startsDiscovered: false, minLevel: 11,
    services: [{ port: 8001, name: 'exam-sim', version: '4.0', state: 'open' }, { port: 8002, name: 'exam-sim', version: '4.0', state: 'open' }],
    files: [{ name: 'exam_rules.txt', size: 2, content: 'REGRAS DA PROVA\nQuatro módulos em sequência: padrões, criptografia, autenticação e análise de logs.\nErros acima do limite reprovam. Dica: sua infraestrutura afeta o tempo.' }],
    challenges: ['ch_pattern_hard', 'ch_cipher_hard', 'ch_auth_hard', 'ch_logs_seq'],
    facts: ['Prova de certificação oficial Aegis'],
  },
  {
    id: 'nordwatch-bank', name: 'Nordwatch Bank — Infraestrutura', address: '10.77.7.1', kind: 'empresa', org: 'Nordwatch Bank',
    desc: 'Infraestrutura de um banco fictício contratando uma auditoria completa antes da fiscalização.',
    security: 4, pos: [90, 78], links: ['db-archive-7', 'orbital-grid'], startsDiscovered: false, minLevel: 10,
    services: [
      { port: 443, name: 'https-sim', version: '1.3', state: 'open' },
      { port: 22, name: 'ssh-sim', version: '3.2', state: 'open', vuln: 'Chaves de operadores antigas não revogadas (SIM-2031-0601)' },
      { port: 1433, name: 'sql-sim', version: '7.0', state: 'filtered', note: 'Apenas rede de operações' },
      { port: 9000, name: 'swift-sim', version: '1.0', state: 'filtered', note: 'Barramento financeiro simulado' },
    ],
    files: [
      { name: 'audit_scope.txt', size: 2, content: 'ESCOPO DA AUDITORIA — NORDWATCH BANK\n1. Revisar regras de firewall do perímetro.\n2. Analisar logs de exportação de dados dos últimos 7 dias.\n3. Emitir relatório.\nProibido testar qualquer sistema fora do laboratório simulado.' },
      { name: 'export_audit.log', size: 600, content: '[logs de exportação — execute: run ch_logs_nordwatch]' },
    ],
    challenges: ['ch_fw_nordwatch', 'ch_logs_nordwatch'],
    facts: ['Auditoria obrigatória antes da fiscalização'],
  },
  {
    id: 'orbital-grid', name: 'Orbital Grid Authority', address: '10.77.8.1', kind: 'infraestrutura', org: 'Orbital Grid Authority',
    desc: 'Centro de controle de uma rede elétrica fictícia. Uma onda de tráfego anômalo ameaça a estabilidade simulada.',
    security: 4, pos: [78, 92], links: ['nordwatch-bank'], startsDiscovered: false, minLevel: 11,
    services: [
      { port: 502, name: 'scada-sim', version: '2.1', state: 'open', vuln: 'Protocolo industrial sem autenticação (SIM-2031-0700)' },
      { port: 443, name: 'https-sim', version: '1.3', state: 'open' },
      { port: 22, name: 'ssh-sim', version: '3.2', state: 'filtered' },
    ],
    files: [{ name: 'scada_notice.txt', size: 2, content: 'AVISO — ORBITAL GRID\nTráfego anômalo na subestação 4 e carga crescente nos servidores de controle.\nPrioridade: manter a rede estável. Libere processamento para os módulos críticos e restrinja tráfego hostil.' }],
    challenges: ['ch_res_grid', 'ch_fw_grid'],
    facts: ['Infraestrutura crítica simulada', 'Carga anômala sobre os servidores'],
  },
  {
    id: 'helix-core', name: 'Helix Dynamics — Núcleo', address: '10.77.10.1', kind: 'empresa', org: 'Helix Dynamics',
    desc: 'Núcleo de sistemas de uma megacorporação fictícia. Alvo de uma operação autorizada de contrainteligência.',
    security: 5, pos: [92, 20], links: ['blacklotus-relay'], startsDiscovered: false, minLevel: 13,
    services: [
      { port: 443, name: 'https-sim', version: '1.3', state: 'open' },
      { port: 7000, name: 'vault-sim', version: '4.0', state: 'open', vuln: 'Cofre com combinação de seis dígitos (SIM-2031-0800)' },
      { port: 22, name: 'ssh-sim', version: '4.0', state: 'filtered' },
    ],
    files: [
      { name: 'helix_ops.txt', size: 3, content: 'HELIX DYNAMICS — OPERAÇÃO INTERNA\nContratos com BLACK LOTUS foram firmados em 2030 sob o codinome "Projeto Lótus Azul".\nPagamentos mensais via mercado Obsidian.\n[arquivo parcial — restante no cofre]' },
    ],
    challenges: ['ch_auth_helix', 'ch_cipher_helix', 'ch_res_helix'],
    facts: ['Elo entre Helix e Black Lotus', 'Cofre central com combinação de seis dígitos'],
  },
  {
    id: 'blacklotus-relay', name: 'Black Lotus — Relay Principal', address: '10.77.13.66', kind: 'organização', org: 'Black Lotus',
    desc: 'Nó de comando de uma organização criminosa fictícia. O alvo final da sua carreira... por enquanto.',
    security: 5, pos: [62, 76], links: ['helix-core'], startsDiscovered: false, minLevel: 15,
    services: [
      { port: 9001, name: 'relay-sim', version: '0.9', state: 'open', vuln: 'Canal de controle com chave reaproveitada (SIM-2031-0900)' },
      { port: 443, name: 'https-sim', version: '1.3', state: 'open' },
    ],
    files: [
      { name: 'blackout_plan.txt', size: 3, content: 'PROTOCOLO BLACKOUT — Black Lotus\n\nFase 1: sobrecarregar servidores de controle da rede elétrica fictícia.\nFase 2: apagar registros de acesso.\nFase 3: culpar a Aegis Labs.\n\nJanela de execução: 23:59 de hoje.\nResponsável interno: VANTA.' },
      { name: 'lotus_roster.txt', size: 2, content: 'Operadores: VANTA (coordenação), M. HALE (infiltração — preso/afastado?), contato Helix: "Cravo".' },
    ],
    challenges: ['ch_logs_lotus', 'ch_res_final', 'ch_inv_final'],
    facts: ['Plano de ataque à rede elétrica', 'VANTA coordena a operação'],
  },
];

export const NODE_MAP: Record<string, NodeDef> = Object.fromEntries(NODES.map((n) => [n.id, n]));

const C = (id: string, node: string, name: string, mg: ChallengeDef['mg'], diff: number, desc: string, money: number, xp: number, params: any = {}, extra: Partial<ChallengeDef> = {}): ChallengeDef => ({
  id, node, name, mg, diff, desc, params, reward: { money, xp }, ...extra,
});

export const CHALLENGES: ChallengeDef[] = [
  // Criptografia
  C('ch_caesar_01', 'aegis-train-01', 'Cifra de César: Exercício 01', 'cipher', 1, 'Decifre a mensagem de boas-vindas.', 40, 30, { puzzles: ['pz_caesar_01'] }),
  C('ch_subst_recover', 'recover-pc-07', 'Substituição: Backup do contador', 'cipher', 1, 'Decifre a nota de backup com análise de frequência.', 60, 40, { puzzles: ['pz_subst_01'] }),
  C('ch_cipher_series', 'aegis-train-01', 'Sequência de cifras do Observador', 'cipher', 2, 'César, sequência, anagrama e padrão numérico em série.', 90, 70, { puzzles: ['pz_caesar_02', 'pz_seq_01', 'pz_word_01', 'pz_num_01'] }),
  C('ch_cipher_lab', 'aegis-lab-02', 'Vigenère: Passphrase do painel', 'cipher', 3, 'Descubra a chave e decifre a passphrase.', 150, 110, { puzzles: ['pz_vig_01'] }, { minSkill: { skill: 'crypto', rank: 1 } }),
  C('ch_roster', 'aegis-lab-02', 'Substituição: Escala de plantão', 'cipher', 3, 'Decifre o arquivo roster.dat.', 130, 100, { puzzles: ['pz_subst_02'] }),
  C('ch_cipher_hard', 'lab-net-09', 'Módulo de Criptografia (Prova 09)', 'cipher', 4, 'Substituição, Vigenère e padrão numérico avançado.', 260, 200, { puzzles: ['pz_subst_03', 'pz_vig_02', 'pz_num_02'] }, { minSkill: { skill: 'crypto', rank: 2 } }),
  C('ch_cipher_helix', 'helix-core', 'Cifras do núcleo Helix', 'cipher', 5, 'Vigenère de chave longa e sequência complexa.', 480, 380, { puzzles: ['pz_vig_03', 'pz_seq_02'] }, { minSkill: { skill: 'crypto', rank: 3 } }),
  // Logs
  C('ch_logs_kestrel', 'kestrel-gw', 'Análise de logs: Kestrel Gateway', 'logs', 2, 'Encontre a força-bruta nos logs.', 120, 90, { scenario: 'bruteforce', seed: 1101, lines: 150, node: 'kestrel-gw' }),
  C('ch_logs_aegis', 'aegis-vault', 'Análise de logs: Acesso interno Aegis', 'logs', 3, 'Descubra quem acessou fora do horário.', 220, 170, { scenario: 'insider', seed: 2202, lines: 190, node: 'aegis-vault' }),
  C('ch_logs_nordwatch', 'nordwatch-bank', 'Análise de logs: Exportações Nordwatch', 'logs', 4, 'Encontre a exportação suspeita no meio de centenas de eventos.', 380, 300, { scenario: 'exfil', seed: 3303, lines: 240, node: 'nordwatch-bank' }),
  C('ch_logs_seq', 'lab-net-09', 'Módulo de Logs (Prova 09)', 'logs', 4, 'Logs da prova de certificação.', 300, 250, { scenario: 'bruteforce', seed: 4404, lines: 230, node: 'lab-net-09' }),
  C('ch_logs_betrayal', 'aegis-lab-02', 'Logs: Rastro da traição', 'logs', 4, 'Rastreie quem abriu a porta para o ataque.', 420, 330, { scenario: 'insider', seed: 5505, lines: 230, node: 'aegis-lab-02' }),
  C('ch_logs_lotus', 'blacklotus-relay', 'Logs: Relay Black Lotus', 'logs', 5, 'Ache a assinatura da operação em logs ofuscados.', 560, 450, { scenario: 'exfil', seed: 6606, lines: 280, node: 'blacklotus-relay' }),
  // Firewall
  C('ch_fw_meridian', 'meridian-clinic', 'Firewall da Clínica Meridian', 'firewall', 2, 'Proteja a clínica sem derrubar o portal.', 160, 120, { scenario: 'clinic', seed: 7, attempts: 4 }),
  C('ch_fw_kestrel', 'kestrel-gw', 'Firewall do gateway Kestrel', 'firewall', 2, 'Endureça o gateway de mídia.', 140, 100, { scenario: 'office', seed: 8, attempts: 4 }),
  C('ch_fw_nordwatch', 'nordwatch-bank', 'Firewall de perímetro Nordwatch', 'firewall', 4, 'Regras para um banco: permitir só o necessário.', 360, 290, { scenario: 'bank', seed: 9, attempts: 4 }),
  C('ch_fw_grid', 'orbital-grid', 'Firewall da subestação 4', 'firewall', 4, 'Bloqueie o tráfego hostil e mantenha o SCADA vivo.', 400, 320, { scenario: 'grid', seed: 10, attempts: 4 }),
  C('ch_fw_aegis_def', 'aegis-lab-02', 'Defesa da Aegis sob ataque', 'firewall', 4, 'Resposta de emergência: o ataque já começou.', 420, 340, { scenario: 'grid', seed: 11, attempts: 3 }),
  // Investigação
  C('ch_inv_obsidian', 'obsidian-logistics', 'Investigação: Vazamento Obsidian', 'investigation', 3, 'Descubra quem exportou os manifestos.', 220, 180, { scenario: 'inv_obsidian' }),
  C('ch_inv_ghost', 'cobalt-forum', 'Investigação: A trilha de GHOST', 'investigation', 3, 'Siga as migalhas deixadas por GHOST.', 220, 180, { scenario: 'inv_ghost' }),
  C('ch_inv_mole', 'aegis-vault', 'Investigação: O infiltrado', 'investigation', 4, 'Identifique quem vende o plantão da Aegis.', 400, 320, { scenario: 'inv_mole' }),
  C('ch_inv_final', 'blacklotus-relay', 'Investigação: Rede Black Lotus', 'investigation', 5, 'Conecte as peças da operação final.', 600, 480, { scenario: 'inv_final' }),
  // Padrões
  C('ch_pattern_01', 'aegis-train-01', 'Padrões: Aquecimento', 'pattern', 1, 'Identifique o próximo elemento de cada sequência.', 40, 30, { seed: 11, rounds: 5 }),
  C('ch_pattern_kestrel', 'kestrel-cms', 'Padrões: Tráfego do CMS', 'pattern', 2, 'Reconheça o padrão no tráfego do CMS.', 100, 80, { seed: 22, rounds: 6 }),
  C('ch_pattern_sandbox', 'malware-lab', 'Padrões: Comportamento das amostras', 'pattern', 3, 'Detecte padrões no comportamento das amostras.', 160, 130, { seed: 33, rounds: 6 }),
  C('ch_pattern_market', 'obsidian-market', 'Padrões: Preços do mercado', 'pattern', 3, 'Reconheça manipulações de preço.', 160, 130, { seed: 44, rounds: 6 }),
  C('ch_pattern_hard', 'lab-net-09', 'Módulo de Padrões (Prova 09)', 'pattern', 4, 'Sequências difíceis, tempo curto.', 250, 200, { seed: 55, rounds: 7 }),
  // Autenticação
  C('ch_auth_lab', 'aegis-lab-02', 'Autenticação: Painel do Laboratório', 'auth', 2, 'Descubra o código seguindo as pistas.', 130, 100, { seed: 66, digits: 4, attempts: 7 }),
  C('ch_auth_archive', 'db-archive-7', 'Autenticação: Cofre do Arquivo 7', 'auth', 3, 'Combinação de quatro dígitos com tentativas limitadas.', 200, 160, { seed: 77, digits: 4, attempts: 6 }),
  C('ch_auth_hard', 'lab-net-09', 'Módulo de Autenticação (Prova 09)', 'auth', 4, 'Combinação de cinco dígitos.', 300, 240, { seed: 88, digits: 5, attempts: 7 }),
  C('ch_auth_helix', 'helix-core', 'Autenticação: Cofre central Helix', 'auth', 5, 'Seis dígitos. Poucas tentativas.', 520, 420, { seed: 99, digits: 6, attempts: 8 }),
  // Recursos
  C('ch_res_grid', 'orbital-grid', 'Recursos: Estabilizar a rede elétrica', 'resources', 4, 'Gerencie CPU, memória e tempo para manter o sistema de pé.', 380, 300, { scenario: 'res_grid' }, { minSkill: { skill: 'infra', rank: 1 } }),
  C('ch_res_helix', 'helix-core', 'Recursos: Operação Meia-Noite', 'resources', 5, 'Execute a operação antes que o relógio acabe.', 520, 420, { scenario: 'res_helix' }),
  C('ch_res_final', 'blacklotus-relay', 'Recursos: Contra-ataque Blackout', 'resources', 5, 'A última grande orquestração de processos.', 700, 560, { scenario: 'res_final' }),
];

export const CHALLENGE_MAP: Record<string, ChallengeDef> = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]));
