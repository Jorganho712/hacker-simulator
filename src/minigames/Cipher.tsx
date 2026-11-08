import { useMemo, useState } from 'react';
import { useGame } from '../game/store';
import { PUZZLE_MAP, type CipherPuzzle } from '../game/data/puzzles';
import { ALPHA, caesar, freq, normalize, substDecrypt, vigenere } from '../game/crypto';
import { Icon, Panel, Chip } from '../components/ui';
import type { GameProps } from './Host';
import { toolLv } from '../game/derived';

const PT_ORDER = 'AEOSRIDMNTCULPVGQBFHZJXKYW';
const MAX_ERRORS = 5;

export default function Cipher({ ch, finish }: GameProps) {
  const d = useGame((s) => s.data)!;
  const puzzles: CipherPuzzle[] = useMemo(() => (ch.params.inline as CipherPuzzle[]) ?? (ch.params.puzzles as string[]).map((id) => PUZZLE_MAP[id]), [ch.id]);
  const crypt = d.skills.crypto;
  const lab = toolLv(d, 'cryptlab');
  const freeHints = (crypt >= 1 ? 1 : 0) + (crypt >= 3 ? 1 : 0) + lab;
  const [idx, setIdx] = useState(0);
  const [errors, setErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [shift, setShift] = useState(0);
  const [map, setMap] = useState<Record<string, string>>({});
  const [key, setKey] = useState('');
  const [text, setText] = useState('');
  const [flash, setFlash] = useState<{ ok: boolean; t: string } | null>(null);
  const p = puzzles[idx];

  const reset = () => { setShift(0); setMap({}); setKey(''); setText(''); setHintLevel(0); };
  const hint = () => {
    if (hintLevel >= p.hints.length) return;
    setHintLevel(hintLevel + 1); setHintsUsed(hintsUsed + 1);
    if (p.kind === 'caesar' && hintLevel >= 2 && p.shift !== undefined) setShift(p.shift);
    if (p.kind === 'vigenere' && hintLevel >= 2 && p.key) setKey(p.key);
  };
  const penalty = Math.max(0, hintsUsed - freeHints) * 8;
  const score = Math.max(10, 100 - errors * (crypt >= 5 ? 8 : 12) - penalty);

  const preview =
    p.kind === 'caesar' ? caesar(p.cipher, -shift)
    : p.kind === 'subst' ? substDecrypt(p.cipher, map)
    : p.kind === 'vigenere' ? vigenere(p.cipher, key, true)
    : p.cipher;

  const check = () => {
    let ok = false;
    if (['caesar', 'subst', 'vigenere'].includes(p.kind)) ok = normalize(preview) === normalize(p.answer);
    else ok = normalize(text) === normalize(p.answer);
    if (ok) {
      setFlash({ ok: true, t: 'Correto!' });
      if (idx + 1 >= puzzles.length) setTimeout(() => finish({ win: true, score, errors, hints: hintsUsed }), 500);
      else setTimeout(() => { setIdx(idx + 1); reset(); setFlash(null); }, 700);
    } else {
      const e = errors + 1;
      setErrors(e);
      setFlash({ ok: false, t: `Incorreto. Erros: ${e}/${MAX_ERRORS}` });
      if (e >= MAX_ERRORS) setTimeout(() => finish({ win: false, score: 0, errors: e, hints: hintsUsed, note: 'Erros demais: a mensagem permanece cifrada.' }), 700);
    }
  };

  const f = useMemo(() => freq(p.cipher), [p.id]);
  const letters = useMemo(() => [...new Set(p.cipher.replace(/[^A-Z]/g, '').split(''))].sort(), [p.id]);
  const bestShift = useMemo(() => {
    if (p.kind !== 'caesar') return 0;
    let best = 0, bs = -1;
    for (let s = 0; s < 26; s++) { const t = caesar(p.cipher, -s); const sc = [...t].reduce((a, c) => a + (PT_ORDER.indexOf(c) >= 0 ? 26 - PT_ORDER.indexOf(c) : 0), 0) + (p.crib && t.includes(p.crib) ? 500 : 0); if (sc > bs) { bs = sc; best = s; } }
    return best;
  }, [p.id]);
  const suggest = () => {
    const m = { ...map };
    f.slice(0, 3 + (lab >= 4 ? 2 : 0)).forEach(([c], i) => { if (!m[c]) m[c] = PT_ORDER[i]; });
    setMap(m);
  };

  const prompts: Record<string, string> = { caesar: 'Cifra de César', subst: 'Substituição', sequence: 'Sequência', word: 'Anagrama', numeric: 'Padrão numérico', vigenere: 'Vigenère' };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Chip tone="blue">Etapa {idx + 1}/{puzzles.length}</Chip><Chip tone="green">{prompts[p.kind]}</Chip>
        <Chip tone="red">Erros {errors}/{MAX_ERRORS}</Chip>
        <Chip tone="yellow" icon="Lightbulb">Dicas grátis: {Math.max(0, freeHints - hintsUsed)}</Chip>
        <span className="ml-auto font-mono text-sm text-warn">Pontuação {score}</span>
      </div>
      <Panel title={p.title} icon="Lock" bodyClass="space-y-4">
        <p className="text-sm text-soft/90">{p.prompt}</p>
        <div className="bg-void border border-line rounded p-4 font-mono text-lg sm:text-2xl tracking-widest text-tech break-words leading-relaxed select-text glow">{p.cipher}</div>

        {p.kind === 'caesar' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button className="btn" onClick={() => setShift((shift + 25) % 26)}>−</button>
              <input type="range" min={0} max={25} value={shift} onChange={(e) => setShift(+e.target.value)} className="flex-1 accent-[rgb(var(--accent))]" aria-label="Deslocamento" />
              <button className="btn" onClick={() => setShift((shift + 1) % 26)}>+</button>
              <span className="font-mono text-neon w-20 text-right">desloc. {shift}</span>
            </div>
            {lab >= 2 && <button className="btn btn-tech" onClick={() => setShift(bestShift)}><Icon name="WandSparkles" size={13} />CryptLab: sugerir deslocamento</button>}
            <div className="bg-void border border-neon/30 rounded p-3 font-mono text-base sm:text-xl text-neon tracking-wider break-words">{preview}</div>
          </div>
        )}

        {p.kind === 'subst' && (
          <div className="space-y-3">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(54px,1fr))] gap-1.5">
              {letters.map((c) => (
                <div key={c} className="border border-line rounded p-1 text-center">
                  <div className="font-mono text-tech text-sm">{c}</div>
                  <div className="text-[9px] text-mute font-mono">{f.find(([l]) => l === c)?.[1]}×</div>
                  <select className="w-full bg-void text-neon font-mono text-sm border border-line rounded mt-0.5 text-center" value={map[c] || ''} onChange={(e) => setMap({ ...map, [c]: e.target.value })} aria-label={`Letra ${c}`}>
                    <option value="">·</option>{ALPHA.split('').map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {lab >= 3 && <button className="btn btn-tech" onClick={suggest}><Icon name="WandSparkles" size={13} />CryptLab: sugerir letras frequentes</button>}
            {lab === 0 && crypt < 2 && <p className="text-[11px] text-mute font-mono">Dica: as letras mais frequentes costumam ser A, E e O em português.</p>}
            <div className="bg-void border border-neon/30 rounded p-3 font-mono text-base sm:text-xl text-neon tracking-wider break-words">{preview}</div>
          </div>
        )}

        {p.kind === 'vigenere' && (
          <div className="space-y-3">
            <input className="input w-full uppercase tracking-widest" placeholder="palavra-chave" value={key} onChange={(e) => setKey(e.target.value.replace(/[^a-zA-Z]/g, ''))} maxLength={12} />
            <div className="bg-void border border-neon/30 rounded p-3 font-mono text-base sm:text-xl text-neon tracking-wider break-words">{key ? preview : '—'}</div>
          </div>
        )}

        {['sequence', 'numeric', 'word'].includes(p.kind) && (
          <input className="input w-full text-lg uppercase" placeholder={p.kind === 'word' ? 'palavra' : 'próximo valor'} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} />
        )}

        <div className="flex gap-2 flex-wrap items-center">
          <button className="btn" onClick={check} disabled={['caesar', 'subst', 'vigenere'].includes(p.kind) ? false : !text.trim()}><Icon name="Check" size={13} />Confirmar decifragem</button>
          <button className="btn btn-warn" onClick={hint} disabled={hintLevel >= p.hints.length}><Icon name="Lightbulb" size={13} />Dica ({hintLevel}/{p.hints.length}){hintsUsed >= freeHints ? ' −8 pts' : ''}</button>
          {flash && <span className={`font-mono text-sm ${flash.ok ? 'text-neon' : 'text-alert'}`}>{flash.t}</span>}
        </div>
        {hintLevel > 0 && <ul className="text-xs font-mono text-warn space-y-1">{p.hints.slice(0, hintLevel).map((h) => <li key={h}>💡 {h}</li>)}</ul>}
      </Panel>
    </div>
  );
}
