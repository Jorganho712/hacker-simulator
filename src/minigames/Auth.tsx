import { useMemo, useState } from 'react';
import { useGame } from '../game/store';
import { rng, shuffle } from '../game/crypto';
import { Chip, Icon, Panel } from '../components/ui';
import type { GameProps } from './Host';
import { toolLv } from '../game/derived';

function score(secret: number[], guess: number[]) {
  let b = 0, c = 0;
  guess.forEach((g, i) => { if (g === secret[i]) b++; else if (secret.includes(g)) c++; });
  return { b, c };
}

function* perms(n: number, cur: number[] = []): Generator<number[]> {
  if (cur.length === n) { yield cur; return; }
  for (let d = 0; d < 10; d++) if (!cur.includes(d)) yield* perms(n, [...cur, d]);
}

export function makePuzzle(seed: number, digits: number) {
  const r = rng(seed);
  const secret = shuffle(r, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, digits);
  let cands = [...perms(digits)];
  const clues: { g: number[]; b: number; c: number }[] = [];
  let guard = 0;
  while (cands.length > 1 && guard++ < 14) {
    // escolhe o palpite que mais reduz o conjunto (amostra)
    let best: number[] | null = null, bestSize = Infinity;
    for (let t = 0; t < 10; t++) {
      const g = shuffle(r, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, digits);
      const sc = score(secret, g);
      const size = cands.filter((x) => { const s = score(x, g); return s.b === sc.b && s.c === sc.c; }).length;
      if (size < bestSize && (sc.b + sc.c > 0)) { best = g; bestSize = size; }
    }
    if (!best) break;
    const sc = score(secret, best);
    clues.push({ g: best, ...sc });
    cands = cands.filter((x) => { const s = score(x, best!); return s.b === sc.b && s.c === sc.c; });
  }
  return { secret, clues, unique: cands.length === 1 };
}

export default function Auth({ ch, finish }: GameProps) {
  const d = useGame((s) => s.data)!;
  const digits = ch.params.digits as number;
  const puz = useMemo(() => makePuzzle(ch.params.seed, digits), [ch.id]);
  const sec = d.skills.security;
  const maxAttempts = ch.params.attempts + (sec >= 4 ? 2 : sec >= 2 ? 1 : 0);
  const reveals = toolLv(d, 'traceguard') >= 3 ? 2 : toolLv(d, 'traceguard') >= 1 ? 1 : 0;
  const [cur, setCur] = useState<number[]>([]);
  const [tries, setTries] = useState<{ g: number[]; b: number; c: number }[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const left = maxAttempts - tries.length;

  const press = (n: number) => { if (cur.length < digits && !cur.includes(n)) setCur([...cur, n]); };
  const submit = () => {
    if (cur.length !== digits) return;
    const sc = score(puz.secret, cur);
    const t = [...tries, { g: cur, ...sc }];
    setTries(t); setCur([]);
    if (sc.b === digits) setTimeout(() => finish({ win: true, score: Math.max(30, 100 - (t.length - 1) * 10 - revealed.length * 8), errors: t.length - 1, hints: revealed.length, note: `Combinação ${puz.secret.join('')} descoberta em ${t.length} tentativa(s).` }), 700);
    else if (t.length >= maxAttempts) setTimeout(() => finish({ win: false, score: 0, errors: t.length, hints: revealed.length, note: `O cofre travou. A combinação era ${puz.secret.join('')}.` }), 900);
    else setMsg(`${sc.b} certo(s) no lugar, ${sc.c} certo(s) fora do lugar.`);
  };
  const reveal = () => {
    if (revealed.length >= reveals) return;
    const idx = [...Array(digits).keys()].filter((i) => !revealed.includes(i));
    const i = idx[Math.floor(Math.random() * idx.length)];
    setRevealed([...revealed, i]);
    setMsg(`TraceGuard: posição ${i + 1} = ${puz.secret[i]}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center"><Chip tone="red">Tentativas {left}/{maxAttempts}</Chip><Chip tone="blue">{digits} dígitos · todos diferentes</Chip>
        <button className="btn btn-warn ml-auto" disabled={revealed.length >= reveals} onClick={reveal} title={reveals === 0 ? 'Requer TraceGuard' : ''}><Icon name="Crosshair" size={13} />TraceGuard ({reveals - revealed.length})</button></div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Pistas dos guardiões" icon="ScrollText" bodyClass="space-y-2">
          {puz.clues.map((c, i) => (
            <div key={i} className="flex items-center gap-3 border border-line rounded px-3 py-2 font-mono">
              <span className="text-mute text-xs w-5">#{i + 1}</span>
              <span className="text-tech tracking-[0.35em] text-lg">{c.g.join('')}</span>
              <span className="ml-auto text-xs"><span className="text-neon">{c.b} no lugar</span> · <span className="text-warn">{c.c} fora do lugar</span></span>
            </div>
          ))}
          <p className="text-[11px] text-mute font-mono">Cada pista descreve um palpite antigo. Deduza a combinação que satisfaz todas elas.</p>
        </Panel>
        <Panel title="Painel de acesso" icon="Fingerprint" bodyClass="space-y-3">
          <div className="flex gap-2 justify-center">
            {Array.from({ length: digits }).map((_, i) => (
              <div key={i} className={`w-12 h-14 sm:w-14 sm:h-16 border-2 rounded grid place-items-center font-mono text-2xl ${cur[i] !== undefined ? 'border-neon text-neon bg-neon/10' : revealed.includes(i) ? 'border-warn text-warn' : 'border-line text-mute'}`}>
                {cur[i] ?? (revealed.includes(i) ? puz.secret[i] : '·')}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => <button key={n} disabled={cur.includes(n)} onClick={() => press(n)} className="py-3 rounded border border-line font-mono text-lg hover:border-neon hover:bg-neon/10 disabled:opacity-30 transition">{n}</button>)}
          </div>
          <div className="flex gap-2"><button className="btn btn-ghost flex-1" onClick={() => setCur(cur.slice(0, -1))}><Icon name="Delete" size={13} />Apagar</button><button className="btn flex-1" disabled={cur.length !== digits} onClick={submit}><Icon name="LockOpen" size={13} />Testar</button></div>
          {msg && <p className="text-xs font-mono text-warn text-center">{msg}</p>}
          {tries.length > 0 && <div className="space-y-1 max-h-32 overflow-y-auto">{tries.map((t, i) => <div key={i} className="text-xs font-mono flex justify-between border-b border-line/50 py-0.5"><span className="text-tech tracking-widest">{t.g.join('')}</span><span className="text-mute">{t.b} no lugar · {t.c} fora</span></div>)}</div>}
        </Panel>
      </div>
    </div>
  );
}
