import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/store';
import { audio } from '../game/audio';

const SLIDES = [
  { tag: 'NEO-SANTOS · 2031', lines: ['Uma cidade de vidro e fibra óptica.', 'Onde cada porta trancada é um convite — e cada convite, um contrato.'] },
  { tag: 'VOCÊ', lines: ['Um computador velho. 250 créditos na conta.', 'Conhecimentos básicos, uma conexão lenta e muita curiosidade.', 'Ninguém sabe o seu nome na rede. Ainda.'] },
  { tag: 'MENSAGEM NÃO IDENTIFICADA', lines: ['"Olá. Preciso de olhos frescos para um pequeno trabalho de segurança digital."', '"Tudo acontece em ambiente simulado. Aceite — ou continue invisível."'] },
  { tag: 'SUA CARREIRA COMEÇA', lines: ['Contratos. Reputação. Rivais. Mentores.', 'Cada escolha deixa rastros. Cada rastro vira história.'] },
];

export default function Intro({ name, onDone }: { name: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const slide = SLIDES[i];
  const total = slide.lines.join('').length;
  const typing = useGame((s) => s.settings.typing);

  useEffect(() => {
    setShown(0);
    if (!typing) { setShown(total); return; }
    const iv = setInterval(() => setShown((s) => { if (s >= total) { clearInterval(iv); return s; } if (s % 3 === 0) audio.play('key'); return s + 1; }), 28);
    return () => clearInterval(iv);
  }, [i, typing]);

  const next = () => {
    if (shown < total) return setShown(total);
    if (i < SLIDES.length - 1) setI(i + 1);
    else onDone();
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  let remaining = shown;
  return (
    <div className="h-full grid place-items-center p-6 grid-bg cursor-pointer" onClick={next}>
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <div className="font-mono text-xs tracking-[0.4em] text-tech mb-6">{slide.tag}</div>
            <div className="font-mono text-base sm:text-xl leading-relaxed space-y-3 text-soft min-h-[160px]">
              {slide.lines.map((l, k) => {
                const part = l.slice(0, Math.max(0, remaining));
                remaining -= l.length;
                return <p key={k} className={k === 0 ? '' : 'text-soft/80'}>{part}{part.length < l.length && part.length > 0 && <span className="cursor-block" />}</p>;
              })}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-10 flex items-center justify-between">
          <div className="flex gap-1.5">{SLIDES.map((_, k) => <span key={k} className={`h-1 w-8 rounded-full ${k <= i ? 'bg-neon' : 'bg-line'}`} />)}</div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost" onClick={onDone}>Pular</button>
            <button className="btn" onClick={next}>{i < SLIDES.length - 1 ? 'Continuar' : `Iniciar como ${name}`}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
