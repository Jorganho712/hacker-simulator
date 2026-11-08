import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { complete, execute, promptText } from '../game/terminal/commands';
import { getMission } from '../game/derived';
import { audio } from '../game/audio';
import { Icon } from '../components/ui';
import type { TermKind } from '../game/types';

const COLORS: Record<TermKind, string> = {
  in: 'text-soft', out: 'text-soft/90', info: 'text-tech', ok: 'text-neon', warn: 'text-warn', err: 'text-alert',
  scan: 'text-tech/90', sys: 'text-neon2', dim: 'text-mute', hl: 'text-neon glow font-medium',
};
const QUICK = ['help', 'status', 'nodes', 'mission', 'ls', 'tools', 'wallet', 'clear'];

export default function TerminalScreen() {
  const term = useGame((s) => s.term);
  const busy = useGame((s) => s.termBusy);
  const d = useGame((s) => s.data)!;
  const typing = useGame((s) => s.settings.typing);
  const [input, setInput] = useState('');
  const [hIdx, setHIdx] = useState(-1);
  const [tabIdx, setTabIdx] = useState(0);
  const [tabBase, setTabBase] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const seen = useRef(term.length ? term[term.length - 1].id : 0);
  const mission = d.active ? getMission(d, d.active) : null;
  const rec = d.active ? d.missions[d.active] : null;
  const obj = mission && rec ? mission.objectives[rec.objIdx] : null;

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [term, busy]);
  useEffect(() => { if (!busy) inputRef.current?.focus({ preventScroll: true }); }, [busy]);
  useEffect(() => { const id = term.length ? term[term.length - 1].id : 0; const t = setTimeout(() => (seen.current = id), 400); return () => clearTimeout(t); }, [term]);

  const suggestions = useMemo(() => (input.trim() ? complete(input).slice(0, 8) : []), [input, d.discovered.length, d.node, d.contracts.length]);

  const submit = (line = input) => {
    const l = line.trim();
    setInput(''); setHIdx(-1); setTabBase(null);
    if (!l || busy) return;
    audio.play('click');
    execute(l);
  };

  const applyCompletion = (val: string) => {
    const endsSpace = /\s$/.test(input);
    const toks = input.split(/\s+/);
    if (toks.length <= 1 && !endsSpace) setInput(val + ' ');
    else { toks[endsSpace ? toks.length : toks.length - 1] = val; setInput(toks.join(' ').replace(/\s+$/, '') + ' '); }
    inputRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Tab') audio.play('key');
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const h = d.history;
      if (!h.length) return;
      const ni = hIdx < 0 ? h.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(ni); setInput(h[ni]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const h = d.history;
      if (hIdx < 0) return;
      const ni = hIdx + 1;
      if (ni >= h.length) { setHIdx(-1); setInput(''); } else { setHIdx(ni); setInput(h[ni]); }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const base = tabBase ?? input;
      const opts = complete(base);
      if (!opts.length) return;
      const idx = tabBase === null ? 0 : (tabIdx + 1) % opts.length;
      setTabBase(base); setTabIdx(idx);
      const endsSpace = /\s$/.test(base);
      const toks = base.split(/\s+/);
      if (toks.length <= 1 && !endsSpace) setInput(opts[idx] + (opts.length === 1 ? ' ' : ''));
      else { toks[endsSpace ? toks.length : toks.length - 1] = opts[idx]; setInput(toks.join(' ')); }
    } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); useGame.getState().clearTerm(); }
    else if (e.key !== 'Shift') setTabBase(null);
  };

  return (
    <div className="h-full flex flex-col p-2 sm:p-4 gap-2">
      {mission && obj ? (
        <button className="panel px-3 py-2 flex items-center gap-3 text-left hover:border-neon/50 transition shrink-0" onClick={() => obj.hint && setInput(obj.hint.split('  ')[0].replace(/^mission submit$/, 'mission submit'))}>
          <Icon name="Target" size={15} className="text-neon shrink-0" />
          <div className="min-w-0 flex-1 text-xs font-mono"><span className="text-mute">{mission.id} · objetivo {rec!.objIdx + 1}/{mission.objectives.length}:</span> <span className="text-soft">{obj.text}</span> <span className="text-tech hidden sm:inline">→ {obj.hint}</span></div>
        </button>
      ) : (
        <div className="panel px-3 py-2 flex items-center gap-3 shrink-0 text-xs font-mono text-mute"><Icon name="Target" size={15} />Nenhuma missão ativa — digite <span className="text-neon">mission list</span> e <span className="text-neon">mission start M-001</span>.</div>
      )}
      <div className="panel flex-1 min-h-0 flex flex-col !bg-void/90 shadow-[inset_0_0_40px_rgba(0,255,136,0.03)]" onClick={() => { if (!window.getSelection()?.toString()) inputRef.current?.focus(); }}>
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-line text-[11px] font-mono text-mute">
          <span className="w-2.5 h-2.5 rounded-full bg-alert/70" /><span className="w-2.5 h-2.5 rounded-full bg-warn/70" /><span className="w-2.5 h-2.5 rounded-full bg-neon/70" />
          <span className="ml-2 truncate">{promptText()}</span>
          <span className="ml-auto hidden sm:inline">Tab · ↑↓ · Ctrl+L</span>
        </div>
        <div ref={scroller} className="flex-1 min-h-0 overflow-y-auto px-3 py-2 font-mono text-[12.5px] sm:text-[13px] leading-[1.55]">
          {term.map((l) => (
            <div key={l.id} className={`whitespace-pre-wrap break-words ${COLORS[l.kind]} ${typing && l.id > seen.current ? 'animate-[reveal_.28s_steps(24)_both]' : ''}`}>
              {l.kind === 'in' ? <><span className="text-neon2">{l.prompt}</span> {l.text}</> : l.text || ' '}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        {suggestions.length > 0 && (
          <div className="px-3 py-1.5 border-t border-line flex gap-1.5 overflow-x-auto">
            {suggestions.map((s) => <button key={s} className="chip border-neon/30 text-neon/90 hover:bg-neon/10 whitespace-nowrap normal-case" onClick={() => applyCompletion(s)}>{s}</button>)}
          </div>
        )}
        <form className="flex items-center gap-2 px-3 py-2 border-t border-line bg-ink/60" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <span className="font-mono text-[13px] text-neon2 whitespace-nowrap max-w-[45%] truncate">{promptText()}</span>
          {busy ? <span className="flex-1 font-mono text-xs text-mute flex items-center gap-2"><span className="inline-block w-3 h-3 border-2 border-neon border-t-transparent rounded-full animate-spin" />processando...</span> : (
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} autoCapitalize="off" autoCorrect="off" spellCheck={false} autoComplete="off" aria-label="Linha de comando"
              className="flex-1 min-w-0 bg-transparent outline-none font-mono text-[13px] text-soft caret-[rgb(var(--accent))]" placeholder="digite um comando… (help)" />
          )}
          <button type="submit" className="btn !px-2 sm:hidden" disabled={busy} aria-label="Executar"><Icon name="CornerDownLeft" size={14} /></button>
        </form>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
        <button className="btn btn-ghost !px-2 shrink-0" disabled={busy} onClick={() => { const opts = complete(input); if (opts.length) applyCompletion(opts[0]); }}>Tab</button>
        <button className="btn btn-ghost !px-2 shrink-0" onClick={() => { const h = d.history; if (h.length) { const ni = hIdx < 0 ? h.length - 1 : Math.max(0, hIdx - 1); setHIdx(ni); setInput(h[ni]); } }}><Icon name="ArrowUp" size={13} /></button>
        {QUICK.map((q) => <button key={q} className="btn btn-ghost !px-2 shrink-0 normal-case" disabled={busy} onClick={() => submit(q)}>{q}</button>)}
      </div>
    </div>
  );
}
