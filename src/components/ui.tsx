import { icons } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useGame } from '../game/store';

export function Icon({ name, size = 16, className = '' }: { name: string; size?: number; className?: string }) {
  const C = (icons as any)[name] ?? icons.Circle;
  return <C size={size} className={className} strokeWidth={1.75} />;
}

export function Panel({ title, icon, right, children, className = '', bodyClass = '' }: { title?: ReactNode; icon?: string; right?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={`panel flex flex-col min-h-0 ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-line">
          <div className="panel-title flex items-center gap-2">{icon && <Icon name={icon} size={13} className="text-neon" />}{title}</div>
          {right}
        </header>
      )}
      <div className={`p-3 min-h-0 flex-1 ${bodyClass}`}>{children}</div>
    </section>
  );
}

export function Bar({ value, max = 100, color = 'rgb(var(--accent))', h = 6, label, right }: { value: number; max?: number; color?: string; h?: number; label?: ReactNode; right?: ReactNode }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="w-full">
      {(label || right) && <div className="flex justify-between text-[11px] font-mono text-mute mb-1"><span>{label}</span><span>{right}</span></div>}
      <div className="w-full rounded-full bg-line overflow-hidden" style={{ height: h }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
}

const CHIP: Record<string, string> = {
  green: 'border-neon/40 text-neon bg-neon/10', blue: 'border-tech/40 text-tech bg-tech/10', red: 'border-alert/40 text-alert bg-alert/10',
  yellow: 'border-warn/40 text-warn bg-warn/10', gray: 'border-line text-mute bg-white/[0.02]', white: 'border-soft/30 text-soft bg-white/5',
};
export function Chip({ children, tone = 'gray', icon }: { children: ReactNode; tone?: keyof typeof CHIP; icon?: string }) {
  return <span className={`chip ${CHIP[tone]}`}>{icon && <Icon name={icon} size={10} />}{children}</span>;
}

export function Modal({ open, onClose, title, children, wide = false, footer }: { open: boolean; onClose?: () => void; title?: ReactNode; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const anim = useGame((s) => s.settings.animations && !s.settings.reduceMotion);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm" initial={anim ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={anim ? { opacity: 0 } : undefined} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
          <motion.div className={`panel w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[92vh] flex flex-col shadow-neon !bg-ink`} initial={anim ? { y: 16, scale: 0.98 } : false} animate={{ y: 0, scale: 1 }} exit={anim ? { y: 10, opacity: 0 } : undefined}>
            <header className="flex items-center justify-between px-4 py-3 border-b border-line">
              <h3 className="font-mono text-sm uppercase tracking-widest text-neon">{title}</h3>
              {onClose && <button className="text-mute hover:text-soft p-1" aria-label="Fechar" onClick={onClose}><Icon name="X" size={16} /></button>}
            </header>
            <div className="p-4 overflow-y-auto min-h-0">{children}</div>
            {footer && <footer className="px-4 py-3 border-t border-line flex justify-end gap-2 flex-wrap">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Sparkline({ data, color = 'rgb(var(--accent))', h = 48, max = 100 }: { data: number[]; color?: string; h?: number; max?: number }) {
  const w = 200;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (Math.min(v, max) / max) * (h - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${color.replace(/\W/g, '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" /><stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill={`url(#g${color.replace(/\W/g, '')})`} stroke="none" points={`0,${h} ${pts} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Avatar({ glyph, color, size = 40 }: { glyph: string; color: string; size?: number }) {
  return (
    <div className="relative shrink-0 grid place-items-center rounded-md font-mono font-bold" style={{ width: size, height: size, color, background: `${color}14`, border: `1px solid ${color}66`, boxShadow: `0 0 10px ${color}33`, fontSize: size * 0.45 }}>
      <svg className="absolute inset-0 opacity-30" viewBox="0 0 40 40"><path d="M0 30 L12 22 L20 28 L30 14 L40 20" stroke={color} fill="none" strokeWidth="1" /><circle cx="30" cy="14" r="2" fill={color} /></svg>
      <span className="relative">{glyph}</span>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode; icon?: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 flex-wrap border-b border-line mb-3">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={`px-3 py-2 font-mono text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 -mb-px transition ${value === t.id ? 'border-neon text-neon' : 'border-transparent text-mute hover:text-soft'}`}>
          {t.icon && <Icon name={t.icon} size={13} />}{t.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, tone = 'green' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'green' | 'blue' | 'yellow' | 'red' }) {
  const c = { green: 'text-neon', blue: 'text-tech', yellow: 'text-warn', red: 'text-alert' }[tone];
  return (
    <div className="panel px-3 py-2">
      <div className="panel-title">{label}</div>
      <div className={`font-mono text-xl ${c} glow`}>{value}</div>
      {sub && <div className="text-[11px] text-mute font-mono">{sub}</div>}
    </div>
  );
}

export function Empty({ icon = 'Inbox', text }: { icon?: string; text: string }) {
  return <div className="grid place-items-center text-mute text-sm gap-2 py-10"><Icon name={icon} size={28} className="opacity-50" /><span className="font-mono text-xs">{text}</span></div>;
}

export const money = (n: number) => n.toLocaleString('pt-BR') + ' cr';
