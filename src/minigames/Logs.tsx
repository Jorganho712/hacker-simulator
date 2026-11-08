import { useMemo, useState } from 'react';
import { useGame } from '../game/store';
import { anomalyScore, genLogs } from '../game/logsgen';
import { Chip, Icon, Panel } from '../components/ui';
import type { GameProps } from './Host';
import { toolLv } from '../game/derived';

const LVL = { INFO: 'text-soft/70', WARN: 'text-warn', ERROR: 'text-alert' } as const;

export default function Logs({ ch, finish }: GameProps) {
  const d = useGame((s) => s.data)!;
  const c = useMemo(() => genLogs(ch.params.scenario, ch.params.seed, ch.params.lines), [ch.id]);
  const hunter = toolLv(d, 'loghunter');
  const scansTotal = [0, 2, 4, 6][hunter] ?? 6;
  const hintsTotal = [0, 1, 1, 2, 3, 4][d.skills.analysis];
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [flag, setFlag] = useState<Set<number>>(new Set()); // destacadas por ferramenta
  const [q, setQ] = useState('');
  const [svc, setSvc] = useState('todos');
  const [scansLeft, setScansLeft] = useState(scansTotal);
  const [hintsLeft, setHintsLeft] = useState(hintsTotal);
  const [user, setUser] = useState('');
  const [ip, setIp] = useState('');
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState('');

  const services = ['todos', ...new Set(c.lines.map((l) => l.svc))];
  const visible = c.lines.filter((l) => (svc === 'todos' || l.svc === svc) && (!q || `${l.time} ${l.user} ${l.ip} ${l.msg}`.toLowerCase().includes(q.toLowerCase())));
  const scored = useMemo(() => c.lines.map((l) => ({ l, s: anomalyScore(l, c.lines) })).sort((a, b) => b.s - a.s || a.l.i - b.l.i), [c]);

  const toggle = (i: number) => { const n = new Set(marked); n.has(i) ? n.delete(i) : n.add(i); setMarked(n); };
  const scan = () => {
    if (scansLeft <= 0) return;
    const pool = scored.filter((x) => !flag.has(x.l.i)).slice(0, hunter >= 3 ? 5 : 4);
    setFlag(new Set([...flag, ...pool.map((x) => x.l.i)]));
    setScansLeft(scansLeft - 1);
  };
  const hint = () => {
    if (hintsLeft <= 0) return;
    const k = c.lines.find((l) => l.key && !marked.has(l.i) && !flag.has(l.i));
    if (k) { setFlag(new Set([...flag, k.i])); setMsg(`Dica de Análise: observe a linha às ${k.time}.`); }
    setHintsLeft(hintsLeft - 1);
  };

  const submit = () => {
    const keys = c.lines.filter((l) => l.key);
    const found = keys.filter((l) => marked.has(l.i)).length;
    const fp = [...marked].filter((i) => !c.lines[i].key).length;
    const userOk = user === c.attackerUser;
    const ipOk = ip === c.attackerIp;
    const ratio = found / keys.length;
    const errors = (userOk ? 0 : 1) + (ipOk ? 0 : 1) + Math.max(0, fp - 3);
    const score = Math.max(0, Math.round(ratio * 50 + (userOk ? 25 : 0) + (ipOk ? 25 : 0) - fp * 4));
    const win = ratio >= 0.6 && fp <= 3 && userOk && ipOk;
    if (win || tries >= 1) {
      finish({ win, score, errors, hints: scansTotal - scansLeft + hintsTotal - hintsLeft, note: win ? `${found}/${keys.length} linhas-chave · ${fp} falso(s) positivo(s).` : `Encontradas ${found}/${keys.length} linhas-chave, ${fp} falso(s) positivo(s); usuário ${userOk ? 'ok' : 'errado'}, IP ${ipOk ? 'ok' : 'errado'}.` });
    } else {
      setTries(1);
      setMsg(`Ainda não: ${found}/${keys.length} linhas-chave, ${fp} falso(s) positivo(s), usuário ${userOk ? 'ok' : 'errado'}, IP ${ipOk ? 'ok' : 'errado'}. Você tem mais uma tentativa.`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="panel p-3 text-sm text-soft/90 flex gap-2"><Icon name="FileSearch" size={16} className="text-neon mt-0.5 shrink-0" /><span>{c.story}</span></div>
      <div className="flex flex-wrap gap-2 items-center">
        <input className="input !py-1.5 flex-1 min-w-[160px]" placeholder="buscar (usuário, IP, texto…)" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !py-1.5" value={svc} onChange={(e) => setSvc(e.target.value)}>{services.map((s) => <option key={s}>{s}</option>)}</select>
        <button className="btn btn-tech" disabled={scansLeft <= 0 || hunter === 0} onClick={scan} title={hunter === 0 ? 'Requer LogHunter' : ''}><Icon name="Radar" size={13} />LogHunter ({scansLeft})</button>
        <button className="btn btn-warn" disabled={hintsLeft <= 0} onClick={hint}><Icon name="Lightbulb" size={13} />Dica ({hintsLeft})</button>
        <Chip tone="green">Marcadas: {marked.size}</Chip>
      </div>
      {msg && <p className="text-xs font-mono text-warn">{msg}</p>}
      <Panel bodyClass="!p-0" className="max-h-[48vh]">
        <div className="max-h-[46vh] overflow-y-auto font-mono text-[11px] sm:text-xs">
          {visible.map((l) => {
            const m = marked.has(l.i), f = flag.has(l.i);
            return (
              <button key={l.i} onClick={() => toggle(l.i)} className={`w-full flex flex-col gap-0.5 sm:grid sm:grid-cols-[72px_52px_110px_120px_1fr] sm:gap-2 px-2 py-1.5 sm:py-1 text-left border-b border-line/40 hover:bg-white/5 ${m ? 'bg-alert/15' : f ? 'bg-warn/10' : ''}`}>
                <div className="flex gap-2 sm:contents"><span className="text-mute">{l.time}</span><span className="text-tech">{l.svc}</span><span className="text-soft truncate">{l.user}</span><span className="text-mute truncate">{l.ip}</span></div>
                <span className={`${LVL[l.level]} break-words`}>{m && '🚩 '}{f && !m && '⚑ '}[{l.level}] {l.msg}</span>
              </button>
            );
          })}
          {visible.length === 0 && <div className="p-6 text-center text-mute">Nada encontrado com esse filtro.</div>}
        </div>
      </Panel>
      <div className="grid sm:grid-cols-3 gap-2 items-end">
        <label className="text-xs text-mute font-mono">Usuário suspeito<select className="input w-full mt-1" value={user} onChange={(e) => setUser(e.target.value)}><option value="">— selecione —</option>{c.users.map((u) => <option key={u}>{u}</option>)}</select></label>
        <label className="text-xs text-mute font-mono">IP de origem<select className="input w-full mt-1" value={ip} onChange={(e) => setIp(e.target.value)}><option value="">— selecione —</option>{c.ips.map((u) => <option key={u}>{u}</option>)}</select></label>
        <button className="btn" disabled={!user || !ip || marked.size === 0} onClick={submit}><Icon name="Send" size={13} />Entregar análise</button>
      </div>
      <p className="text-[11px] text-mute font-mono">Há ~{c.keyCount} linhas-chave entre {c.lines.length} registros. Marque as suspeitas; evite falsos positivos.</p>
    </div>
  );
}
