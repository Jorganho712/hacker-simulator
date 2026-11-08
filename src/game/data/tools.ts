import type { ShopItem, ToolDef } from '../types';
import { CPU_TIERS, HW_LABEL, HW_TABLES, NIC_TIERS, OS_TIERS, RAM_TIERS, STORAGE_TIERS } from './hardware';

export const TOOLS: ToolDef[] = [
  {
    id: 'cyberscan', name: 'CyberScan', icon: 'Radar', category: 'Diagnóstico', maxLevel: 4, basePrice: 150, levelReq: 1, osReq: 0, ramReq: 0, starter: true,
    desc: 'Varredura de serviços em ambientes simulados. Base de toda auditoria.',
    features: [
      ['Comando scan: lista portas e serviços'],
      ['inspect mostra versões e vulnerabilidades dos serviços'],
      ['Detecta serviços filtrados e notas ocultas'],
      ['Modo furtivo: varreduras 40% mais rápidas'],
    ],
  },
  {
    id: 'secureshell', name: 'SecureShell', icon: 'SquareTerminal', category: 'Administração de sistemas', maxLevel: 3, basePrice: 220, levelReq: 1, osReq: 0, ramReq: 0, starter: true,
    desc: 'Cliente de acesso remoto simulado. O nível define a segurança máxima dos nós que você acessa.',
    features: [
      ['connect em nós de segurança 1–2'],
      ['connect em nós de segurança 3'],
      ['connect em nós de segurança 4–5 · downloads 2x mais rápidos'],
    ],
  },
  {
    id: 'hexanalyzer', name: 'HexAnalyzer', icon: 'Binary', category: 'Análise', maxLevel: 3, basePrice: 180, levelReq: 1, osReq: 0, ramReq: 0, starter: true,
    desc: 'Inspeciona estrutura e conteúdo de arquivos em busca de anomalias.',
    features: [
      ['analyze: metadados e strings visíveis'],
      ['analyze: strings ocultas e cabeçalhos'],
      ['analyze: assinaturas de arquivos maliciosos de treino'],
    ],
  },
  {
    id: 'datarecovery', name: 'DataRecovery', icon: 'HardDriveDownload', category: 'Forense digital', maxLevel: 3, basePrice: 140, levelReq: 2, osReq: 0, ramReq: 0,
    desc: 'Recupera arquivos apagados ou corrompidos de discos simulados.',
    features: [['Comando recover: restaura arquivos pequenos'], ['recover: arquivos fragmentados'], ['recover: discos criptografados parcialmente']],
  },
  {
    id: 'cryptlab', name: 'CryptLab', icon: 'KeyRound', category: 'Criptografia', maxLevel: 4, basePrice: 220, levelReq: 3, osReq: 0, ramReq: 1,
    desc: 'Bancada de criptoanálise. Aumenta suas dicas e ferramentas nos desafios de cifra.',
    features: [
      ['+1 dica por desafio · análise de frequência'],
      ['+2 dicas · prévia automática do deslocamento'],
      ['+3 dicas · sugestões de substituição'],
      ['+4 dicas · desafios de cifra premiam +15%'],
    ],
  },
  {
    id: 'loghunter', name: 'LogHunter', icon: 'ScrollText', category: 'Monitoramento', maxLevel: 3, basePrice: 240, levelReq: 4, osReq: 1, ramReq: 1,
    desc: 'Caçador de anomalias em logs. Destaca padrões suspeitos automaticamente.',
    features: [['2 varreduras automáticas por análise'], ['4 varreduras · destaca horários incomuns'], ['6 varreduras · correlaciona usuários e IPs']],
  },
  {
    id: 'netvision', name: 'NetVision', icon: 'Network', category: 'Diagnóstico', maxLevel: 3, basePrice: 320, levelReq: 5, osReq: 1, ramReq: 1,
    desc: 'Mapeia topologia de redes. Scans revelam nós vizinhos automaticamente.',
    features: [['scan revela nós vizinhos'], ['monitor mostra tráfego por nó'], ['Mapa da rede com rotas de acesso']],
  },
  {
    id: 'packetview', name: 'PacketView', icon: 'Activity', category: 'Análise', maxLevel: 3, basePrice: 300, levelReq: 6, osReq: 1, ramReq: 2,
    desc: 'Inspeção de pacotes. Revela reputação e descrição do tráfego no minigame de firewall.',
    features: [['Mostra reputação da origem'], ['Mostra carga útil resumida'], ['Marca automaticamente tráfego hostil']],
  },
  {
    id: 'firewallx', name: 'FirewallX', icon: 'ShieldCheck', category: 'Segurança', maxLevel: 3, basePrice: 420, levelReq: 6, osReq: 1, ramReq: 2,
    desc: 'Suíte de regras defensivas. Mais tentativas e modelos de regra no minigame de firewall.',
    features: [['+1 tentativa · modelos de regra'], ['+2 tentativas · simulação rápida'], ['+3 tentativas · regras automáticas']],
  },
  {
    id: 'traceguard', name: 'TraceGuard', icon: 'Crosshair', category: 'Segurança', maxLevel: 3, basePrice: 380, levelReq: 8, osReq: 2, ramReq: 2,
    desc: 'Rastreamento defensivo. Ajuda em autenticação e investigações; reduz impacto de rivais.',
    features: [['Revela 1 dígito em quebra-cabeças de autenticação'], ['+1 pista em investigações'], ['Rivais causam 60% menos dano']],
  },
];

export const TOOL_MAP: Record<string, ToolDef> = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

export const toolPrice = (t: ToolDef, level: number) => Math.round((t.basePrice * Math.pow(level, 1.45)) / 5) * 5;

const hwIcon: Record<string, string> = { cpu: 'Cpu', ram: 'MemoryStick', storage: 'HardDrive', nic: 'Wifi', os: 'MonitorCog' };
const hwCat: Record<string, 'Hardware' | 'Software'> = { cpu: 'Hardware', ram: 'Hardware', storage: 'Hardware', nic: 'Hardware', os: 'Software' };
const hwLevel: Record<string, number[]> = {
  cpu: [0, 2, 5, 10, 16],
  ram: [0, 2, 4, 9, 15],
  storage: [0, 2, 4, 8, 14],
  nic: [0, 2, 5, 9, 15],
  os: [0, 3, 8, 14],
};

const hwItems: ShopItem[] = [];
(['cpu', 'ram', 'storage', 'nic', 'os'] as const).forEach((slot) => {
  HW_TABLES[slot].forEach((tier, i) => {
    if (i === 0) return;
    hwItems.push({
      id: `hw_${slot}_${i}`,
      cat: hwCat[slot],
      kind: 'hw',
      name: tier.name,
      icon: hwIcon[slot],
      desc: `${HW_LABEL[slot]} — ${tier.spec}`,
      price: tier.price,
      levelReq: hwLevel[slot][i],
      benefits:
        slot === 'cpu' ? [`Velocidade x${tier.value.toFixed(1)}`, 'Tarefas e minigames mais rápidos', 'Mais capacidade de processamento']
        : slot === 'ram' ? [`${tier.value / 1024} GB de memória`, 'Mais capacidade no gerenciador de recursos']
        : slot === 'storage' ? [`${tier.value >= 1048576 ? tier.value / 1048576 + ' TB' : tier.value / 1024 + ' GB'} de armazenamento`, 'Downloads maiores e mais arquivos']
        : slot === 'nic' ? [`Banda x${tier.value}`, 'Downloads e scans mais rápidos']
        : [tier.spec, 'Desbloqueia ferramentas e comandos'],
      hw: { slot, tier: i },
      once: true,
    });
  });
});

const toolItems: ShopItem[] = TOOLS.filter((t) => !t.starter || true).map((t) => ({
  id: `tool_${t.id}`,
  cat: 'Ferramentas',
  kind: 'tool',
  name: t.name,
  icon: t.icon,
  desc: t.desc,
  price: toolPrice(t, 1),
  levelReq: t.levelReq,
  benefits: t.features[0],
  toolId: t.id,
}));

const others: ShopItem[] = [
  { id: 'sw_shieldlite', cat: 'Software', kind: 'sw', name: 'ShieldLite AV', icon: 'ShieldAlert', desc: 'Antivírus local de laboratório. Reduz os danos de eventos de equipamento e rivais.', price: 180, levelReq: 3, benefits: ['-50% duração de problemas de hardware', 'Alertas de arquivos suspeitos'], once: true },
  { id: 'sw_vpn', cat: 'Software', kind: 'sw', name: 'Tunnel VPN-Sim', icon: 'Lock', desc: 'Túnel privado simulado. Protege seu nome em contratos que falham.', price: 450, levelReq: 6, benefits: ['Falhas custam 30% menos reputação'], once: true },
  { id: 'sw_zip', cat: 'Software', kind: 'sw', name: 'ZipMax Compressor', icon: 'Archive', desc: 'Compressão transparente de arquivos baixados.', price: 220, levelReq: 3, benefits: ['Arquivos ocupam 30% menos espaço'], once: true },
  { id: 'up_cooling', cat: 'Melhorias', kind: 'upgrade', name: 'Cooler Líquido', icon: 'Snowflake', desc: 'Resfriamento líquido para o seu PC. Temperaturas menores e imune a superaquecimento.', price: 600, levelReq: 4, benefits: ['-12°C sob carga', 'Imune a superaquecimento'], once: true },
  { id: 'up_ups', cat: 'Melhorias', kind: 'upgrade', name: 'Nobreak UPS-Sim', icon: 'BatteryCharging', desc: 'Protege seu equipamento contra falhas de energia e sobrecargas.', price: 350, levelReq: 3, benefits: ['Evita falhas elétricas', 'Salvamentos mais seguros'], once: true },
  { id: 'up_overclock', cat: 'Melhorias', kind: 'upgrade', name: 'Overclock Seguro', icon: 'Gauge', desc: 'Ajuste fino de clock com perfil térmico.', price: 700, levelReq: 5, benefits: ['+10% velocidade de CPU'], once: true },
  { id: 'up_backup', cat: 'Melhorias', kind: 'upgrade', name: 'Unidade de Backup', icon: 'DatabaseBackup', desc: 'Disco externo dedicado a arquivos de missão.', price: 400, levelReq: 4, benefits: ['+4 GB de armazenamento'], once: true },
  { id: 'up_vlan', cat: 'Melhorias', kind: 'upgrade', name: 'VLAN Privada', icon: 'Router', desc: 'Rede segmentada para laboratório próprio. Bônus de 5% em contratos.', price: 1200, levelReq: 9, repReq: 300, benefits: ['+5% de dinheiro em contratos'], once: true },
  { id: 'course_analysis', cat: 'Cursos', kind: 'course', name: 'Curso: Análise Forense de Logs', icon: 'GraduationCap', desc: 'Treinamento em interpretação de registros e anomalias.', price: 500, levelReq: 3, benefits: ['+1 ponto de habilidade'], once: true },
  { id: 'course_crypto', cat: 'Cursos', kind: 'course', name: 'Curso: Criptografia Clássica', icon: 'GraduationCap', desc: 'Cifras, substituições e criptoanálise de laboratório.', price: 600, levelReq: 4, benefits: ['+1 ponto de habilidade'], once: true },
  { id: 'course_forensics', cat: 'Cursos', kind: 'course', name: 'Curso: Investigação Digital', icon: 'GraduationCap', desc: 'Cadeia de custódia, linhas do tempo e evidências.', price: 700, levelReq: 5, benefits: ['+1 ponto de habilidade'], once: true },
  { id: 'course_infra', cat: 'Cursos', kind: 'course', name: 'Curso: Arquitetura de Redes', icon: 'GraduationCap', desc: 'Planejamento e administração de infraestrutura.', price: 800, levelReq: 6, benefits: ['+1 ponto de habilidade'], once: true },
  { id: 'course_security', cat: 'Cursos', kind: 'course', name: 'Curso: Defesa e Auditoria', icon: 'GraduationCap', desc: 'Políticas de firewall, hardening e resposta a incidentes.', price: 900, levelReq: 7, benefits: ['+1 ponto de habilidade'], once: true },
  { id: 'course_master1', cat: 'Cursos', kind: 'course', name: 'Masterclass: Operações Avançadas', icon: 'Award', desc: 'Programa intensivo com mentores de elite.', price: 3500, levelReq: 12, repReq: 800, benefits: ['+2 pontos de habilidade'], once: true },
  { id: 'course_master2', cat: 'Cursos', kind: 'course', name: 'Masterclass: Doutrina Cibernética', icon: 'Award', desc: 'Estratégia, ética e liderança em cibersegurança.', price: 9000, levelReq: 18, repReq: 1800, benefits: ['+3 pontos de habilidade'], once: true },
  { id: 'cos_theme_cobalt', cat: 'Cosméticos', kind: 'cosmetic', name: 'Tema Cobalto', icon: 'Palette', desc: 'Interface em azul tecnológico.', price: 150, benefits: ['Libera o tema "cobalt" em Configurações'], once: true },
  { id: 'cos_theme_amber', cat: 'Cosméticos', kind: 'cosmetic', name: 'Tema Âmbar', icon: 'Palette', desc: 'Fósforo âmbar, clássico dos mainframes.', price: 150, benefits: ['Libera o tema "amber"'], once: true },
  { id: 'cos_theme_crimson', cat: 'Cosméticos', kind: 'cosmetic', name: 'Tema Carmesim', icon: 'Palette', desc: 'Modo alerta vermelho para operações noturnas.', price: 250, benefits: ['Libera o tema "crimson"'], once: true },
  { id: 'cos_prompt_ghost', cat: 'Cosméticos', kind: 'cosmetic', name: 'Prompt: ghost@shadow', icon: 'Ghost', desc: 'Novo prompt do terminal.', price: 100, benefits: ['Altera o prompt do terminal'], once: true, effect: { prompt: 'ghost@shadow' } },
  { id: 'cos_prompt_root', cat: 'Cosméticos', kind: 'cosmetic', name: 'Prompt: root@nightshell', icon: 'Skull', desc: 'Prompt de administrador.', price: 120, benefits: ['Altera o prompt do terminal'], once: true, effect: { prompt: 'root@nightshell' } },
  { id: 'cos_title_phantom', cat: 'Cosméticos', kind: 'cosmetic', name: 'Título: Phantom', icon: 'Medal', desc: 'Título exibido no seu perfil.', price: 300, levelReq: 5, benefits: ['Título "Phantom" no perfil'], once: true, effect: { title: 'Phantom' } },
];

export const SHOP: ShopItem[] = [...hwItems, ...toolItems, ...others];
export const SHOP_MAP: Record<string, ShopItem> = Object.fromEntries(SHOP.map((s) => [s.id, s]));
export const SHOP_CATS = ['Hardware', 'Software', 'Ferramentas', 'Cursos', 'Melhorias', 'Cosméticos'] as const;

export const fmtMB = (mb: number) => (mb >= 1048576 ? (mb / 1048576).toFixed(1) + ' TB' : mb >= 1024 ? (mb / 1024).toFixed(mb >= 10240 ? 0 : 1) + ' GB' : Math.round(mb) + ' MB');
export const _unused = [CPU_TIERS, RAM_TIERS, STORAGE_TIERS, NIC_TIERS, OS_TIERS];
