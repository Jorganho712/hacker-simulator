import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { pick, randInt, rng, shuffle } from '../game/crypto';
import { Chip, Icon } from '../components/ui';
import type { GameProps } from './Host';

interface Round { seq: (string | number)[]; options: (string | number)[]; answer: string | number; rule: string }
const SYM = ['▲', '►', '▼', '◄'];
const GLY = ['◆', '●', '■', '★', '✚', '✖'];

function makeRound(r: () => number, diff: number): Round {
  const t = randInt(r, 0, Math.min(6, 2 + diff));
  let seq: (string | number)[] = [], ans: string | number = 0, rule = '';
  const len = 5;
  if (t === 0) { const a = randInt(r, 1, 20), dd = randInt(r, 2, 9); seq = Array.from({ length: len }, (_, i) => a + i * dd); ans = a + len * dd; rule = `soma ${dd}`; }
  else if (t === 1) { const a = randInt(r, 1, 5), m = randInt(r, 2, 3); seq = Array.from({ length: len }, (_, i) => a * m ** i); ans = a * m ** len; rule = `multiplica por ${m}`; }
  else if (t === 2) { const a = randInt(r, 1, 4), b = randInt(r, 2, 6); const f = [a, b]; for (let i = 2; i < len + 1; i++) f.push(f[i - 1] + f[i - 2]); seq = f.slice(0, len); ans = f[len]; rule = 'soma dos dois anteriores'; }
  else if (t === 3) { const o = randInt(r, 0, 4); seq = Array.from({ length: len }, (_, i) => (i + o) ** 2); ans = (len + o) ** 2; rule = 'quadrados'; }
  else if (t === 4) { const s = randInt(r, 0, 6), st = randInt(r, 2, 4); seq = Array.from({ length: len }, (_, i) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[(s + i * st) % 26]); ans = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[(s + len * st) % 26]; rule = `letras +${st}`; }
  else if (t === 5) { const o = randInt(r, 0, 3), dir = r() < 0.5 ? 1 : -1; seq = Array.from({ length: len }, (_, i) => SYM[(((o + i * dir) % 4) + 4) % 4]); ans = SYM[(((o + len * dir) % 4) + 4) % 4]; rule = 'rotação de símbolos'; }
  else { const a = randInt(r, 5, 15), d1 = randInt(r, 2, 5), d2 = randInt(r, 1, 4); seq = [a]; for (let i = 1; i <= len; i++) seq.push((seq[i - 1] as number) + (i % 2 ? d1 : d2)); ans = seq.pop()!; seq = seq.slice(0, len); rule = `alterna +${d1} e +${d2}`; }
  const opts = new Set<string | number>([ans]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 40) {
    if (typeof ans === 'number') opts.add(Math.max(0, ans + pick(r, [-3, -2, -1, 1, 2, 3, 5, -5, 10, Math.round(ans * 0.1) || 4])));
    else if (SYM.includes(ans as string)) opts.add(pick(r, SYM));
    else opts.add('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[randInt(r, 0, 25)]);
  }
  return { seq, options: shuffle(r, [...opts]), answer: ans, rule };
}

export default function Pattern({ ch, finish }: GameProps) {
  const d = useGame((s) => s.data)!;
  const rounds = useMemo(() => { const r = rng(ch.params.seed); return Array.from({ length: ch.params.rounds }, () => makeRound(r, ch.diff)); }, [ch.id]);
  const bonus = d.skills.analysis >= 5 ? 8 : d.skills.analysis >= 1 ? 4 : 0;
  const total = Math.max(14, 32 - ch.diff * 3) + bonus;
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(total);
  const [picked, setPicked] = useState<string | number | null>(null);
  const [errors, setErrors] = useState(0);
  const locked = useRef(false);
  const need = Math.ceil(rounds.length * 0.65);
  const round = rounds[i];

  const next = (ok: boolean, p: string | number | null) => {
    if (locked.current) return;
    locked.current = true;
    setPicked(p ?? '—');
    const sc = score + (ok ? 1 : 0);
    const er = errors + (ok ? 0 : 1);
    setScore(sc); setErrors(er);
    setTimeout(() => {
      locked.current = false;
      if (i + 1 >= rounds.length) {
        const win = sc >= need;
        finish({ win, score: Math.round((sc / rounds.length) * 100), errors: er, hints: 0, note: `${sc}/${rounds.length} acertos (mínimo ${need}).` });
      } else { setI(i + 1); setPicked(null); setTime(total); }
    }, 900);
  };

  useEffect(() => {
    if (picked !== null) return;
    const t = setInterval(() => setTime((x) => { if (x <= 1) { clearInterval(t); next(false, null); return 0; } return x - 1; }), 1000);
    return () => clearInterval(t);
  }, [i, picked]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex gap-2 flex-wrap items-center"><Chip tone="blue">Rodada {i + 1}/{rounds.length}</Chip><Chip tone="green">Acertos {score} (mín. {need})</Chip><Chip tone="red">Erros {errors}</Chip>
        <span className={`ml-auto font-mono text-lg ${time <= 5 ? 'text-alert' : 'text-warn'}`}>⏱ {time}s</span></div>
      <div className="h-1.5 bg-line rounded-full overflow-hidden"><div className="h-full bg-warn transition-all duration-1000 ease-linear" style={{ width: `${(time / total) * 100}%` }} /></div>
      <div className="panel p-6 text-center">
        <div className="panel-title mb-4">Qual é o próximo elemento?</div>
        <div className="flex gap-2 sm:gap-4 justify-center items-center flex-wrap font-mono text-2xl sm:text-4xl text-tech glow">
          {round.seq.map((x, k) => <span key={k} className="min-w-[44px] px-2 py-2 border border-line rounded bg-void">{x}</span>)}
          <span className="min-w-[44px] px-2 py-2 border-2 border-dashed border-neon text-neon rounded">?</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {round.options.map((o) => {
          const sel = picked !== null;
          const right = sel && o === round.answer;
          const bad = sel && picked === o && o !== round.answer;
          return (
            <button key={String(o)} disabled={sel} onClick={() => next(o === round.answer, o)}
              className={`py-4 rounded border font-mono text-2xl transition ${right ? 'border-neon bg-neon/15 text-neon' : bad ? 'border-alert bg-alert/15 text-alert' : 'border-line hover:border-neon/60 hover:bg-neon/5'}`}>{o}</button>
          );
        })}
      </div>
      {picked !== null && <p className="text-center text-xs font-mono text-mute"><Icon name="Info" size={12} className="inline mr-1" />Regra: {round.rule}</p>}
    </div>
  );
}
void GLY;
