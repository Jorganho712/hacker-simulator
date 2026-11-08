# HACKER SIMULATOR — Realistic Cyber Ops · Status do projeto

## Como rodar
Esta máquina não tem Node.js; o projeto roda com **Deno 2** (já instalado) ou com Node normalmente.

```bash
deno task dev        # servidor de desenvolvimento em http://localhost:5173
deno task build      # build de produção em dist/
deno task typecheck  # checagem de tipos (tsc)
deno task test       # joga as 20 missões da campanha de forma automatizada + valida conteúdo
```
Com Node: `npm install && npm run dev`.

## Stack
React 18 · TypeScript · Vite · Tailwind 3 · Framer Motion · Zustand · Lucide · WebAudio (sem arquivos de áudio) · fontes via @fontsource (offline).

## Funcionalidades concluídas
- **Boot, menu, intro narrativa**, continuar/novo/carregar (slots AUTO + 1–3, export/import JSON, confirmações), créditos, configurações.
- **Shell profissional**: barra superior (nome, nível/XP, créditos, reputação, status, hora fictícia, notificações), menu lateral com 12 seções, drawer no celular, toasts, eventos em modal.
- **Terminal real**: parser com aspas/flags, histórico persistente, Tab/autocomplete + chips, Ctrl+L, sugestões de comando ("você quis dizer"), efeito de revelação, 45+ comandos ligados ao estado do jogo (help, scan, inspect, connect, download, analyze, recover, decrypt, run, firewall, logs, mission, shop/buy, monitor, wallet, profile…). Só interpreta comandos do jogo.
- **Missões**: 20 missões de campanha (Iniciante → Especialista) + contratos procedurais repetíveis + eventos de contrato especial/relâmpago. Objetivos sequenciais exigem ações reais; falha/abandono/tempo limite/erros máximos; relatórios em ~/reports.
- **Economia/progressão**: créditos, XP/níveis (até 30), 7 ranks de reputação, árvore de 5 habilidades com especializações, 24 conquistas.
- **Computador**: CPU/RAM/disco/rede/SO com gráficos, temperatura, superaquecimento (`repair`), upgrades que afetam velocidade, armazenamento real (downloads ocupam espaço), capacidade do minigame de recursos e requisitos de ferramentas.
- **Ferramentas** (10) com níveis; **Mercado** (hardware, software, ferramentas, cursos, melhorias, cosméticos) com promoções por evento.
- **Rede fictícia**: 19 nós (empresas, labs, fóruns, mercado, organizações) com mapa visual, serviços, vulnerabilidades, arquivos, desafios.
- **7 minigames** com tela própria, instruções, pontuação e vitória/derrota: Criptografia (César, substituição, Vigenère, sequências, anagramas), Logs (centenas de linhas geradas + heurística do LogHunter), Firewall (regras ordenadas), Investigação, Padrões, Autenticação (dedução tipo Mastermind com pistas únicas) e Recursos (CPU/RAM/tempo).
- **Contatos**: MORPHEUS, NOVA, GHOST, VANTA com diálogos ramificados, flags e finais múltiplos (expor / autoridades / vender).
- **Arquivos**: gerenciador (pastas, notas, renomear, mover, excluir, analisar, descriptografar, recuperar), persistente.
- **Áudio** sintetizado (efeitos + música ambiente opcional, só após interação), temas desbloqueáveis, i18n estruturado (pt-BR completo na UI, en parcial).

## Verificado
- `tsc` sem erros; build de produção OK.
- `deno task test`: campanha completa (M-001…M-020 incl. ramo VANTA) concluída via motor real; referências de nós/arquivos/desafios válidas; cifras decifram; pistas de autenticação únicas; firewalls solucionáveis; logs consistentes.
- Navegador: boot → menu → novo jogo → intro → dashboard → contatos → terminal (missão, scan) → minigame de cifra → mapa de rede; layout mobile (dashboard + drawer); save/continuar após reload.

## Pendências / ideias
- Testar visualmente cada um dos 7 minigames e telas (Mercado, Habilidades, Arquivos) em celular/tablet em jogo longo.
- Balanceamento fino de preços/recompensas após playtests reais.
- Bundle JS ~1.2 MB (lucide `icons` completo): trocar por imports individuais se quiser reduzir.
- Mais conteúdo: novos nós, missões, diálogos reativos a flags (ghost_ally, mole_*), tradução completa para inglês.

## Decisões de arquitetura
- `src/game/` = lógica e dados (sem UI): `store.ts` (Zustand, ações, tick), `state.ts` (save), `derived.ts` (regras calculadas), `terminal/` (parser + comandos), `data/` (mundo, missões, loja, diálogos, eventos…).
- Objetivos de missão são casados contra **eventos de jogo** (`emit`) produzidos pelos comandos/minigames — não há botão que complete missão sozinho.
- Desafios gerados (`gen:<mg>:<seed>:<dif>`) são determinísticos: contratos infinitos sem salvar dados grandes.
- Tudo é fictício: IPs 10.77.x.x são ids de jogo; nenhuma requisição de rede é feita.
