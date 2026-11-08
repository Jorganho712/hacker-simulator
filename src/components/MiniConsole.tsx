import { useEffect, useRef } from 'react';
import { useGame } from '../game/store';
import type { TermKind } from '../game/types';
import { Icon } from './ui';

const COLORS: Record<TermKind, string> = { in: 'text-soft', out: 'text-soft/90', info: 'text-tech', ok: 'text-neon', warn: 'text-warn', err: 'text-alert', scan: 'text-tech/90', sys: 'text-neon2', dim: 'text-mute', hl: 'text-neon' };

export default function MiniConsole({ lines = 9, className = '' }: { lines?: number; className?: string }) {
  const term = useGame((s) => s.term);
  const busy = useGame((s) => s.termBusy);
  const setScreen = useGame((s) => s.setScreen);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [term.length]);
  return (
    <div className={`panel !bg-void/90 ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-line">
        <span className="panel-title flex items-center gap-2"><Icon name="SquareTerminal" size={12} className="text-neon" />Saída do sistema {busy && <span className="inline-block w-2.5 h-2.5 border-2 border-neon border-t-transparent rounded-full animate-spin" />}</span>
        <button className="text-[11px] font-mono text-mute hover:text-neon" onClick={() => setScreen('terminal')}>abrir terminal →</button>
      </div>
      <div className="px-3 py-2 font-mono text-[12px] leading-[1.5] overflow-y-auto" style={{ maxHeight: lines * 19 }}>
        {term.slice(-40).map((l) => <div key={l.id} className={`whitespace-pre-wrap break-words ${COLORS[l.kind]}`}>{l.kind === 'in' ? <><span className="text-neon2">{l.prompt}</span> {l.text}</> : l.text || ' '}</div>)}
        {term.length === 0 && <div className="text-mute">Sem atividade.</div>}
        <div ref={end} />
      </div>
    </div>
  );
}
