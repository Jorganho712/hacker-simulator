import { useMemo, useState } from 'react';
import { useGame } from '../game/store';
import { INV_MAP } from '../game/data/puzzles';
import { Chip, Icon, Panel } from '../components/ui';
import type { GameProps } from './Host';
import { toolLv } from '../game/derived';

const KIND_ICON: Record<string, string> = { log: 'ScrollText', email: 'Mail', arquivo: 'FileText', registro: 'ClipboardList', testemunho: 'MessageCircle' };

function Highlight({ text, key_ }: { text: string; key_?: string }) {
  if (!key_ || !text.includes(key_)) return <>{text}</>;
  const [a, b] = text.split(key_);
  return <>{a}<mark className="bg-warn/25 text-warn px-0.5 rounded">{key_}</mark>{b}</>;
}

export default function Investigation({ ch, finish }: GameProps) {
  const d = useGame((s) => s.data)!;
  const sc = INV_MAP[ch.params.scenario];
  const attemptsMax = 3 + (d.skills.forensics >= 4 ? 1 : 0) + (toolLv(d, 'traceguard') >= 2 ? 1 : 0);
  const hlCount = d.skills.forensics >= 5 ? 99 : d.skills.forensics >= 3 ? 2 : d.skills.forensics >= 1 ? 1 : 0;
  const keyIds = useMemo(() => sc.evidence.filter((e) => e.key).slice(0, hlCount).map((e) => e.id), [sc.id]);
  const [open, setOpen] = useState<string>(sc.evidence[0].id);
  const [seen, setSeen] = useState<Set<string>>(new Set([sc.evidence[0].id]));
  const [qi, setQi] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState(attemptsMax);
  const [errors, setErrors] = useState(0);
  const [fb, setFb] = useState<{ ok: boolean; t: string } | null>(null);
  const ev = sc.evidence.find((e) => e.id === open)!;
  const q = sc.questions[qi];

  const answer = () => {
    if (choice === null) return;
    if (choice === q.answer) {
      setFb({ ok: true, t: q.explain });
      const last = qi + 1 >= sc.questions.length;
      setTimeout(() => {
        if (last) finish({ win: true, score: Math.max(30, 100 - errors * 18), errors, hints: 0, note: 'Caso resolvido com as evidências corretas.' });
        else { setQi(qi + 1); setChoice(null); setWrong(new Set()); setFb(null); }
      }, last ? 1200 : 1600);
    } else {
      const left = attempts - 1;
      setAttempts(left); setErrors(errors + 1);
      setWrong(new Set([...wrong, choice]));
      setFb({ ok: false, t: 'Resposta incorreta. Revise as evidências.' });
      setChoice(null);
      if (left <= 0) setTimeout(() => finish({ win: false, score: Math.max(0, 40 - errors * 10), errors: errors + 1, hints: 0, note: 'Tentativas esgotadas: o caso foi arquivado sem conclusão.' }), 900);
    }
  };

  return (
    <div className="space-y-3">
      <div className="panel p-3 flex gap-2 text-sm"><Icon name="Search" size={16} className="text-neon mt-0.5 shrink-0" /><span><b className="text-neon">{sc.title}.</b> {sc.intro}</span></div>
      <div className="flex gap-2 flex-wrap"><Chip tone="red">Tentativas {attempts}/{attemptsMax}</Chip><Chip tone="blue">Evidências vistas {seen.size}/{sc.evidence.length}</Chip>{hlCount > 0 && <Chip tone="yellow" icon="Highlighter">Forense: trechos-chave destacados</Chip>}</div>
      <div className="grid lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 space-y-1.5">
          {sc.evidence.map((e) => (
            <button key={e.id} onClick={() => { setOpen(e.id); setSeen(new Set([...seen, e.id])); }} className={`w-full panel p-2.5 flex items-center gap-3 text-left transition hover:border-neon/50 ${open === e.id ? '!border-neon shadow-neonsm' : ''}`}>
              <Icon name={KIND_ICON[e.kind]} size={16} className="text-tech shrink-0" />
              <div className="min-w-0 flex-1"><div className="text-sm text-soft truncate">{e.title}</div><div className="text-[10px] font-mono text-mute">{e.kind} · {e.time}</div></div>
              {seen.has(e.id) && <Icon name="Eye" size={13} className="text-neon2" />}
            </button>
          ))}
        </div>
        <Panel className="lg:col-span-3" title={ev.title} icon={KIND_ICON[ev.kind]} right={<Chip tone="gray">{ev.time}</Chip>} bodyClass="space-y-2">
          <pre className="font-mono text-xs sm:text-sm text-soft/90 whitespace-pre-wrap break-words leading-relaxed bg-void border border-line rounded p-3"><Highlight text={ev.content} key_={keyIds.includes(ev.id) ? ev.key : undefined} /></pre>
        </Panel>
      </div>
      <Panel title={`Pergunta ${qi + 1}/${sc.questions.length}`} icon="CircleHelp" bodyClass="space-y-3">
        <p className="text-soft">{q.text}</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {q.options.map((o, i) => (
            <button key={o} disabled={wrong.has(i) || (fb?.ok ?? false)} onClick={() => setChoice(i)} className={`px-3 py-2 rounded border text-sm text-left transition ${choice === i ? 'border-neon bg-neon/10 text-neon' : wrong.has(i) ? 'border-alert/40 text-alert line-through opacity-60' : 'border-line hover:border-mute'} ${fb?.ok && i === q.answer ? '!border-neon !bg-neon/15 text-neon' : ''}`}>{o}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn" disabled={choice === null || (fb?.ok ?? false)} onClick={answer}><Icon name="Check" size={13} />Responder</button>
          {fb && <span className={`text-xs font-mono ${fb.ok ? 'text-neon' : 'text-alert'}`}>{fb.t}</span>}
        </div>
      </Panel>
    </div>
  );
}
