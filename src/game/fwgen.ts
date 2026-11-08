import { pick, randInt, rng, shuffle } from './crypto';

export type Group = 'internal' | 'partner' | 'external' | 'hostile';
export interface Flow {
  id: number;
  src: string;
  group: Group;
  port: number;
  proto: 'tcp' | 'udp';
  service: string;
  desc: string;
  legit: boolean;
  critical: boolean;
}
export interface Rule { action: 'allow' | 'block'; src: 'any' | 'internal' | 'partner' | 'external' | 'hostile'; port: number | 'any'; proto: 'tcp' | 'udp' | 'any' }

type T = Omit<Flow, 'id' | 'src'>;
const L = (group: Group, port: number, service: string, desc: string, critical = false, proto: 'tcp' | 'udp' = 'tcp'): T => ({ group, port, proto, service, desc, legit: true, critical });
const M = (group: Group, port: number, service: string, desc: string, proto: 'tcp' | 'udp' = 'tcp'): T => ({ group, port, proto, service, desc, legit: false, critical: false });

const SCEN: Record<string, { title: string; brief: string; flows: T[] }> = {
  clinic: {
    title: 'Clínica Meridian', brief: 'Portal de pacientes (443) aberto ao mundo. Imagens médicas (104) e administração (22) só pela rede interna. Telnet bloqueado.',
    flows: [
      L('external', 443, 'portal', 'Paciente acessa o portal', true), L('external', 443, 'portal', 'Paciente agenda consulta', true), L('internal', 443, 'portal', 'Recepção usa o portal'),
      L('internal', 104, 'imaging', 'Tomógrafo envia imagens', true), L('internal', 104, 'imaging', 'Médico consulta exame', true), L('internal', 22, 'ssh', 'Administrador de TI acessa servidor'),
      L('internal', 53, 'dns', 'Consulta DNS interna', false, 'udp'), L('partner', 443, 'portal', 'Laboratório parceiro envia resultado', true),
      M('hostile', 23, 'telnet', 'Tentativas de login em massa (força bruta)'), M('hostile', 23, 'telnet', 'Varredura de dispositivos legados'), M('external', 104, 'imaging', 'Origem externa tenta ler imagens'),
      M('hostile', 22, 'ssh', 'Falhas repetidas de senha'), M('external', 23, 'telnet', 'Conexão telnet vinda da internet'), M('hostile', 3389, 'rdp', 'Tentativa de acesso remoto'), M('hostile', 443, 'portal', 'Botnet de login automático (credential stuffing)'),
    ],
  },
  office: {
    title: 'Gateway Kestrel Media', brief: 'HTTPS (443) público. SSH (22) apenas interno e parceiros. Banco (3306) apenas interno.',
    flows: [
      L('external', 443, 'https', 'Cliente visita o site', true), L('external', 443, 'https', 'Leitor acessa a revista online', true), L('internal', 22, 'ssh', 'Equipe de TI acessa gateway', true),
      L('partner', 22, 'ssh', 'Parceiro Aegis acessa laboratório', true), L('internal', 3306, 'sql', 'CMS consulta banco', true), L('internal', 53, 'dns', 'DNS interno', false, 'udp'),
      M('hostile', 22, 'ssh', 'Força bruta de senhas (conta svc_*)'), M('external', 3306, 'sql', 'Tentativa de consulta ao banco por IP externo'), M('hostile', 22, 'ssh', 'Varredura de chaves SSH'),
      M('hostile', 3389, 'rdp', 'Acesso remoto não autorizado'), M('external', 23, 'telnet', 'Telnet inesperado'), M('hostile', 445, 'smb', 'Tentativa de acesso a arquivos'),
    ],
  },
  bank: {
    title: 'Perímetro Nordwatch Bank', brief: 'Internet banking (443) público. SQL (1433) só interno. Barramento financeiro (9000) só parceiros. SSH só interno.',
    flows: [
      L('external', 443, 'https', 'Cliente acessa o internet banking', true), L('external', 443, 'https', 'App mobile sincroniza saldo', true), L('partner', 9000, 'swift', 'Câmara de compensação envia lote', true), L('partner', 9000, 'swift', 'Banco parceiro consulta posição', true),
      L('internal', 1433, 'sql', 'Core bancário grava transações', true), L('internal', 22, 'ssh', 'Operador acessa servidor'), L('internal', 53, 'dns', 'DNS interno', false, 'udp'), L('internal', 443, 'https', 'Intranet de funcionários'),
      M('hostile', 22, 'ssh', 'Força bruta de chaves'), M('hostile', 1433, 'sql', 'Tentativa de consulta direta ao banco'), M('external', 9000, 'swift', 'Origem desconhecida no barramento'), M('hostile', 3389, 'rdp', 'Acesso remoto malicioso'),
      M('external', 1433, 'sql', 'Consulta SQL externa'), M('hostile', 443, 'https', 'Robô de credential stuffing'), M('hostile', 445, 'smb', 'Varredura SMB'), M('external', 22, 'ssh', 'SSH vindo da internet'), M('hostile', 23, 'telnet', 'Telnet legado explorado'),
    ],
  },
  grid: {
    title: 'Subestação 4 — Orbital Grid', brief: 'SCADA (502) apenas interno. HTTPS (443) para parceiros. SSH interno. Todo tráfego hostil deve cair.',
    flows: [
      L('internal', 502, 'scada', 'Controlador lê telemetria', true), L('internal', 502, 'scada', 'Operador ajusta carga', true), L('internal', 502, 'scada', 'Relé de proteção reporta falha', true),
      L('partner', 443, 'https', 'Concessionária consulta painel', true), L('internal', 22, 'ssh', 'Manutenção remota autorizada'), L('internal', 53, 'dns', 'DNS interno', false, 'udp'), L('internal', 123, 'ntp', 'Sincronização de relógio', false, 'udp'),
      M('hostile', 502, 'scada', 'Comandos industriais vindos de fora'), M('external', 502, 'scada', 'Escrita em registrador de origem externa'), M('hostile', 502, 'scada', 'Flood de leituras (negação de serviço simulada)'),
      M('hostile', 22, 'ssh', 'Força bruta de chaves'), M('hostile', 3389, 'rdp', 'Acesso remoto malicioso'), M('external', 23, 'telnet', 'Telnet inesperado'), M('hostile', 445, 'smb', 'Varredura SMB'), M('external', 443, 'https', 'Origem não parceira no painel'),
    ],
  },
};

export function genFlows(scenario: string, seed: number) {
  const sc = SCEN[scenario] ?? SCEN.office;
  const r = rng(seed * 7 + scenario.length);
  const ipFor = (g: Group) => g === 'internal' ? `10.0.${randInt(r, 1, 9)}.${randInt(r, 2, 250)}` : g === 'partner' ? `172.20.${randInt(r, 1, 9)}.${randInt(r, 2, 250)}` : g === 'hostile' ? `203.0.${randInt(r, 100, 120)}.${randInt(r, 2, 250)}` : `198.51.${randInt(r, 1, 99)}.${randInt(r, 2, 250)}`;
  const flows: Flow[] = shuffle(r, sc.flows).map((t, i) => ({ ...t, id: i + 1, src: ipFor(t.group) }));
  return { flows, title: sc.title, brief: sc.brief };
}

export function evaluate(flow: Flow, rules: Rule[], policy: 'allow' | 'block'): 'allow' | 'block' {
  for (const r of rules) {
    const srcOk = r.src === 'any' || r.src === flow.group || (r.src === 'external' && flow.group === 'hostile');
    if (srcOk && (r.port === 'any' || r.port === flow.port) && (r.proto === 'any' || r.proto === flow.proto)) return r.action;
  }
  return policy;
}
