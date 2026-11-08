import { useEffect, useState } from 'react';
import { useGame } from './game/store';
import { audio } from './game/audio';
import { setLang } from './i18n';
import Boot from './components/Boot';
import Menu from './components/Menu';
import Intro from './components/Intro';
import Shell from './components/Shell';

export default function App() {
  const phase = useGame((s) => s.phase);
  const settings = useGame((s) => s.settings);
  const [introName, setIntroName] = useState('');
  const { setPhase, newGame, tick, saveSlot } = useGame.getState();

  // tema, efeitos e idioma
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = settings.theme;
    el.classList.toggle('reduce-motion', settings.reduceMotion || !settings.animations);
    el.classList.toggle('fx-glow', settings.glow);
    document.body.classList.toggle('crt', settings.fx);
    document.body.classList.toggle('vignette', settings.fx);
    setLang(settings.lang);
    audio.configure({ sfx: settings.sfx, sfxVolume: settings.sfxVolume, music: settings.music, musicVolume: settings.musicVolume });
  }, [settings]);

  // relógio do jogo
  useEffect(() => {
    const i = setInterval(() => useGame.getState().tick(), 1000);
    return () => clearInterval(i);
  }, [tick]);

  // salva ao fechar/ocultar
  useEffect(() => {
    const save = () => { const s = useGame.getState(); if (s.phase === 'game' && s.data) s.saveSlot('auto'); };
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', () => document.hidden && save());
    return () => window.removeEventListener('beforeunload', save);
  }, [saveSlot]);

  // desbloqueia áudio no primeiro gesto (política dos navegadores)
  useEffect(() => {
    const u = () => audio.unlock();
    window.addEventListener('pointerdown', u, { once: true });
    window.addEventListener('keydown', u, { once: true });
    return () => { window.removeEventListener('pointerdown', u); window.removeEventListener('keydown', u); };
  }, []);

  if (phase === 'boot') return <Boot />;
  if (phase === 'menu') return <Menu onNew={(n) => { setIntroName(n); setPhase('intro'); }} />;
  if (phase === 'intro') return <Intro name={introName} onDone={() => newGame(introName)} />;
  return <Shell />;
}
