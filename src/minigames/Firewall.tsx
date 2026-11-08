import { useMemo, useState } from 'react';
import { useGame } from '../game/store';
import { evaluate, genFlows, type Flow, type Rule } from '../game/fwgen';
import { Chip, Icon, Panel } from '../components/ui';
import type { GameProps } from './Host';
import { toolLv } from '../game/derived';

const SRC_LABEL: Record<string, string> = { any: 'Qualquer origem', internal: 'Rede interna', partner: 'Parceiros', external: 'Externa (inclui hostil)', hostile: 'Lista negra (hostil)' };
const GROUP_TXT: Record<string, string> = { internal: 'interna', partner: 'parceiro', external: 'externa', hostile: 'HOSTIL' };

export default function Firewall({ ch, finish }: GameProps) {
  const d = useGame((s) => s.data)!;
  const { flows, title, brief } = useMemo(() => genFlows(ch.params.scenario, ch.params.seed), [ch.id]);
  const pv = toolLv(d, 'packetview');
  const fx = toolLv(d, 'firewallx');
  const sec = d.skills.security;
  const maxAttempts = ch.params.attempts + (sec >= 3 ? 2 : sec >= 1 ? 1 : 0) + fx;
  const simsMax = 2 + fx * 2;
  const [rules, setRules] = useState<Rule[]>([]);
  const [policy, setPolicy] = useState<'allow' | 'block'>('allow');
  const [draft, setDraft] = useState<Rule>({ action: 'block', src: 'any', port: 'any', proto: 'any' });
  const [attempts, setAttempts] = useState(maxAttempts);
  const [sims, setSims] = useState(simsMax);
  const [report, setReport] = useState<{ verdicts: Record<number, 'allow' | 'block'>; s: ReturnType<typeof summarize> } | null>(null);
  const [simInfo, setSimInfo] = useState<ReturnType<typeof summarize> | null>(null);
  const [errors, setErrors] = useState(0);

  const ports = [...new Set(flows.map((f) => f.port))].sort((a, b) => a - b);
  const srcOptions = Object.keys(SRC_LABEL);

  function summarize(rs: Rule[], pol: 'allow' | 'block') {
    const verdicts: Record<number, 'allow' | 'block'> = {};
    flows.forEach((f) => (verdicts[f.id] = evaluate(f, rs, pol)));
    const crit = flows.filter((f) => f.critical);
    const critOk = crit.filter((f) => verdicts[f.id] === 'allow').length;
    const legit = flows.filter((f) => f.legit && !f.critical);
    const legitOk = legit.filter((f) => verdicts[f.id] === 'allow').length;
    const mal = flows.filter((f) => !f.legit);
    const malBlocked = mal.filter((f) => verdicts[f.id] === 'block').length;
    const win = critOk === crit.length && malBlocked / mal.length >= 0.9 && (legit.length === 0 || legitOk / legit.length >= 0.8);
    const score = Math.round(((critOk / crit.length) * 40 + (malBlocked / mal.length) * 45 + (legit.length ? (legitOk / legit.length) * 15 : 15)));
    return { verdicts, crit: crit.length, critOk, legit: legit.length, legitOk, mal: mal.length, malBlocked, win, score };
  }

  const add = (r: Rule = draft) => setRules((rs) => [...rs, r]);
  const simulate = () => { if (sims <= 0) return; setSims(sims - 1); setSimInfo(summarize(rules, policy)); };
  const apply = () => {
    const s = summarize(rules, policy);
    setReport({ verdicts: s.verdicts, s });
    const left = attempts - 1;
    setAttempts(left);
    if (s.win) setTimeout(() => finish({ win: true, score: s.score, errors, hints: 0, note: `${s.malBlocked}/${s.mal} ameaças bloqueadas · ${s.critOk}/${s.crit} serviços críticos preservados.` }), 900);
    else {
      setErrors(errors + 1);
      if (left <= 0) setTimeout(() => finish({ win: false, score: s.score, errors: errors + 1, hints: 0, note: 'Tentativas esgotadas: a política não protegeu o ambiente.' }), 900);
    }
  };

  const templates: { label: string; rule: Rule }[] = fx >= 1 ? [
    { label: 'Bloquear telnet (23)', rule: { action: 'block', src: 'any', port: 23, proto: 'tcp' } },
    { label: 'Permitir interno', rule: { action: 'allow', src: 'internal', port: 'any', proto: 'any' } },
    { label: 'Permitir 443 de qualquer origem', rule: { action: 'allow', src: 'any', port: 443, proto: 'tcp' } },
    { label: 'Bloquear lista negra', rule: { action: 'block', src: 'hostile', port: 'any', proto: 'any' } },
  ] : [];

  return (
    <div className="space-y-3">
      <div className="panel p-3 text-sm"><b className="text-neon">{title}</b> — <span className="text-soft/90">{brief}</span></div>
      <div className="flex gap-2 flex-wrap items-center">
        <Chip tone="red" icon="Shield">Tentativas {attempts}/{maxAttempts}</Chip>
        <Chip tone="blue" icon="FlaskConical">Simulações {sims}</Chip>
        {pv === 0 && <Chip tone="gray">PacketView ausente: reputação das origens oculta</Chip>}
        {sec >= 2 && <Chip tone="yellow" icon="Lightbulb">Dica: libere só as portas necessárias e bloqueie o resto</Chip>}
      </div>
      <div className="grid lg:grid-cols-5 gap-3">
        <Panel title="Regras (ordem de avaliação)" icon="ListOrdered" className="lg:col-span-2" bodyClass="space-y-3">
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {rules.length === 0 && <p className="text-xs text-mute font-mono">Nenhuma regra. Tudo segue a política padrão.</p>}
            {rules.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono border border-line rounded px-2 py-1">
                <span className="text-mute w-4">{i + 1}</span>
                <span className={r.action === 'allow' ? 'text-neon' : 'text-alert'}>{r.action === 'allow' ? 'PERMITIR' : 'BLOQUEAR'}</span>
                <span className="flex-1 text-soft/90 truncate">{SRC_LABEL[r.src]} · porta {r.port} · {r.proto}</span>
                <button aria-label="Subir" disabled={i === 0} onClick={() => { const n = [...rules]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setRules(n); }} className="text-mute hover:text-neon disabled:opacity-30"><Icon name="ArrowUp" size={12} /></button>
                <button aria-label="Remover" onClick={() => setRules(rules.filter((_, k) => k !== i))} className="text-mute hover:text-alert"><Icon name="X" size={12} /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <select className="input !py-1" value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value as any })}><option value="allow">Permitir</option><option value="block">Bloquear</option></select>
            <select className="input !py-1" value={draft.src} onChange={(e) => setDraft({ ...draft, src: e.target.value as any })}>{srcOptions.map((s) => <option key={s} value={s}>{SRC_LABEL[s]}</option>)}</select>
            <select className="input !py-1" value={String(draft.port)} onChange={(e) => setDraft({ ...draft, port: e.target.value === 'any' ? 'any' : +e.target.value })}><option value="any">Qualquer porta</option>{ports.map((p) => <option key={p} value={p}>Porta {p}</option>)}</select>
            <select className="input !py-1" value={draft.proto} onChange={(e) => setDraft({ ...draft, proto: e.target.value as any })}><option value="any">Qualquer protocolo</option><option value="tcp">TCP</option><option value="udp">UDP</option></select>
          </div>
          <button className="btn w-full" onClick={() => add()}><Icon name="Plus" size={13} />Adicionar regra</button>
          {templates.length > 0 && <div className="flex gap-1.5 flex-wrap">{templates.map((t) => <button key={t.label} className="chip border-tech/40 text-tech hover:bg-tech/10 normal-case" onClick={() => add(t.rule)}>+ {t.label}</button>)}</div>}
          <div className="flex items-center gap-2 text-xs font-mono"><span className="text-mute">Política padrão:</span>
            <button className={`btn !py-1 ${policy === 'allow' ? '' : 'btn-ghost'}`} onClick={() => setPolicy('allow')}>Permitir</button>
            <button className={`btn !py-1 ${policy === 'block' ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setPolicy('block')}>Negar</button>
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            <button className="btn btn-tech" disabled={sims <= 0} onClick={simulate}><Icon name="FlaskConical" size={13} />Simular</button>
            <button className="btn" disabled={attempts <= 0} onClick={apply}><Icon name="ShieldCheck" size={13} />Aplicar regras</button>
          </div>
          {simInfo && <div className="text-xs font-mono border border-tech/30 rounded p-2 text-tech space-y-0.5"><div>Simulação: críticos liberados {simInfo.critOk}/{simInfo.crit}</div><div>Ameaças bloqueadas {simInfo.malBlocked}/{simInfo.mal}</div><div>Outro tráfego legítimo {simInfo.legitOk}/{simInfo.legit}</div></div>}
        </Panel>

        <Panel title="Tráfego observado" icon="Activity" className="lg:col-span-3" bodyClass="!p-0">
          <div className="max-h-[56vh] overflow-y-auto">
            <table className="w-full text-[11px] sm:text-xs font-mono">
              <thead className="sticky top-0 bg-ink text-mute"><tr className="text-left"><th className="p-2">Origem</th><th>Porta</th><th>Serviço</th><th className="hidden sm:table-cell">Descrição</th><th className="p-2">{report ? 'Veredito' : ''}</th></tr></thead>
              <tbody>
                {flows.map((f: Flow) => {
                  const v = report?.verdicts[f.id];
                  const wrong = v && ((f.legit && v === 'block') || (!f.legit && v === 'allow'));
                  return (
                    <tr key={f.id} className={`border-t border-line/50 ${wrong ? 'bg-alert/10' : v ? 'bg-neon/[0.04]' : ''}`}>
                      <td className="p-2"><div className="text-soft">{f.src}</div><div className={`text-[10px] ${pv >= 1 && f.group === 'hostile' ? 'text-alert' : 'text-mute'}`}>{pv >= 1 ? GROUP_TXT[f.group] : f.group === 'internal' ? 'interna' : f.group === 'partner' ? 'parceiro' : 'externa'}</div></td>
                      <td className="text-tech">{f.port}/{f.proto}</td>
                      <td className="text-soft/90">{f.service}</td>
                      <td className="hidden sm:table-cell text-mute">{pv >= 2 ? f.desc : pv >= 1 ? f.desc.split(' ').slice(0, 3).join(' ') + '…' : '—'}</td>
                      <td className="p-2">{v && <span className={v === 'allow' ? 'text-neon' : 'text-alert'}>{v === 'allow' ? '✔ permitido' : '✘ bloqueado'}{wrong ? ' ⚠' : ''}{f.critical ? ' ★' : ''}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {report && <div className="p-3 border-t border-line text-xs font-mono flex flex-wrap gap-3"><span className="text-neon">Críticos {report.s.critOk}/{report.s.crit}</span><span className="text-tech">Ameaças bloqueadas {report.s.malBlocked}/{report.s.mal}</span><span className="text-warn">Legítimo {report.s.legitOk}/{report.s.legit}</span><span className="ml-auto text-soft">★ = serviço crítico</span></div>}
        </Panel>
      </div>
    </div>
  );
}
