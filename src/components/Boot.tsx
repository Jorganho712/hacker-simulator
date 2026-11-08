import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { listSaves, useGame } from '../game/store';
import { audio } from '../game/audio';

const LOGO = `██╗  ██╗ █████╗  ██████╗██╗  ██╗███████╗██████╗
██║  ██║██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗
███████║███████║██║     █████╔╝ █████╗  ██████╔╝
██╔══██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`;

export default function Boot() {
  const setPhase = useGame((s) => s.setPhase);
  const [lines, setLines] = useState<{ tag: string; text: string }[]>([]);
  const [pct, setPct] = useState(0);
  const done = useRef(false);
  const hasSave = listSaves().length > 0;

  useEffect(() => {
    const script: [string, string, number][] = [
      ['BOOT', 'Initializing CyberCore...', 250],
      ['OK', 'Loading virtual kernel...', 260],
      ['OK', 'Mounting simulated filesystem...', 220],
      ['OK', 'Connecting simulation environment (isolated, local only)...', 300],
      ['OK', 'Loading security modules: CyberScan · SecureShell · HexAnalyzer', 280],
      ['OK', 'Verifying sandbox integrity — no external connections allowed.', 280],
      [hasSave ? 'OK' : 'WARN', hasSave ? 'User profile detected.' : 'No profile found — new session.', 280],
      ['OK', 'All systems operational.', 350],
    ];
    let i = 0;
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      if (i >= script.length) {
        setPct(100);
        setTimeout(() => { if (!done.current) { done.current = true; setPhase('menu'); } }, 650);
        return;
      }
      const [tag, text, ms] = script[i++];
      setLines((l) => [...l, { tag, text }]);
      setPct(Math.round((i / script.length) * 100));
      audio.play('key');
      setTimeout(step, ms);
    };
    setTimeout(step, 400);
    return () => { cancelled = true; };
  }, []);

  const skip = () => { if (!done.current) { done.current = true; audio.unlock(); setPhase('menu'); } };
  useEffect(() => {
    const k = () => skip();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  return (
    <div className="h-full grid place-items-center grid-bg p-4 cursor-pointer" onClick={skip}>
      <div className="w-full max-w-2xl">
        <motion.pre initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="text-neon glow font-mono text-[7px] sm:text-[11px] leading-tight mb-2 overflow-hidden select-none">{LOGO}</motion.pre>
        <div className="font-mono text-xs text-mute tracking-[0.4em] mb-6">REALISTIC CYBER OPS · SIMULATOR 1.0</div>
        <div className="font-mono text-xs sm:text-sm space-y-1 min-h-[210px]">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className={l.tag === 'OK' ? 'text-neon' : l.tag === 'WARN' ? 'text-warn' : 'text-tech'}>[{l.tag}]</span>
              <span className="text-soft/90">{l.text}</span>
            </div>
          ))}
          <span className="cursor-block" />
        </div>
        <div className="mt-6">
          <div className="h-1.5 bg-line rounded-full overflow-hidden"><div className="h-full bg-neon shadow-neon transition-all duration-300" style={{ width: `${pct}%` }} /></div>
          <div className="flex justify-between font-mono text-[10px] text-mute mt-1"><span>CARREGANDO MÓDULOS</span><span>{pct}%</span></div>
        </div>
        <div className="mt-8 text-center font-mono text-[10px] text-mute/70">pressione qualquer tecla para pular</div>
      </div>
    </div>
  );
}
