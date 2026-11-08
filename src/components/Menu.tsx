import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { listSaves, useGame } from '../game/store';
import { audio } from '../game/audio';
import { t } from '../i18n';
import { Icon, Modal } from './ui';
import SettingsPanel from './SettingsPanel';
import SaveManager, { fmtPlay } from './SaveManager';
import { repRank } from '../game/data/progression';

const LOGO = `██╗  ██╗ █████╗  ██████╗██╗  ██╗███████╗██████╗
██║  ██║██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗
███████║███████║██║     █████╔╝ █████╗  ██████╔╝
██╔══██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝`;

const FEED = [
  'sim-net: 19 nós fictícios online · nenhum tráfego real',
  'aegis-train-01: novos alunos conectados ao programa de treino',
  'cobalt-forum: rumores sobre um infiltrado na Aegis Labs',
  'obsidian-market: leilão #81 aberto — fonte: VANTA',
  'kestrel-gw: falhas de login de madrugada continuam',
  'orbital-grid: tráfego anômalo na subestação 4',
];

export default function Menu({ onNew }: { onNew: (name: string) => void }) {
  const { loadSlot, settings } = useGame();
  const lang = settings.lang;
  const [saves, setSaves] = useState(listSaves());
  const [modal, setModal] = useState<null | 'load' | 'settings' | 'credits' | 'new'>(null);
  const [name, setName] = useState('');
  const [confirmNew, setConfirmNew] = useState(false);
  const latest = [...saves].sort((a, b) => b.savedAt - a.savedAt)[0];
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTicker((x) => (x + 1) % FEED.length), 3200);
    return () => clearInterval(i);
  }, []);
  useEffect(() => setSaves(listSaves()), [modal]);

  const items: { id: string; label: string; icon: string; disabled?: boolean; onClick: () => void }[] = [
    { id: 'continue', label: t('menu.continue', lang), icon: 'Play', disabled: !latest, onClick: () => latest && loadSlot(latest.slot) },
    { id: 'new', label: t('menu.new', lang), icon: 'FilePlus2', onClick: () => setModal('new') },
    { id: 'load', label: t('menu.load', lang), icon: 'FolderOpen', onClick: () => setModal('load') },
    { id: 'settings', label: t('menu.settings', lang), icon: 'SlidersHorizontal', onClick: () => setModal('settings') },
    { id: 'credits', label: t('menu.credits', lang), icon: 'Info', onClick: () => setModal('credits') },
  ];

  const startNew = () => {
    audio.unlock();
    if (!name.trim()) return;
    if (saves.length && !confirmNew) return setConfirmNew(true);
    setModal(null);
    onNew(name.trim());
  };

  return (
    <div className="h-full overflow-y-auto grid-bg">
      <div className="min-h-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 p-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <pre className="text-neon glow font-mono text-[6px] sm:text-[9px] leading-tight select-none overflow-hidden mb-1">{LOGO}</pre>
          <div className="font-mono text-[11px] text-mute tracking-[0.35em] mb-8">SIMULATOR · REALISTIC CYBER OPS</div>
          <nav className="space-y-2">
            {items.map((it, i) => (
              <motion.button key={it.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} disabled={it.disabled}
                onClick={() => { audio.unlock(); audio.play('click'); it.onClick(); }}
                className="group w-full flex items-center gap-3 px-4 py-3 border border-line rounded bg-panel/80 hover:border-neon hover:shadow-neonsm hover:bg-neon/5 transition disabled:opacity-35 disabled:hover:border-line disabled:hover:shadow-none text-left">
                <Icon name={it.icon} size={16} className="text-neon" />
                <span className="font-mono text-sm uppercase tracking-widest flex-1">{it.label}</span>
                <Icon name="ChevronRight" size={14} className="text-mute group-hover:text-neon transition" />
              </motion.button>
            ))}
          </nav>
          <p className="mt-6 text-[11px] text-mute font-mono leading-relaxed">Todo o jogo é uma simulação local e fictícia. Nenhuma conexão real é feita — alvos, dados e serviços existem apenas aqui.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="w-full max-w-md space-y-4">
          <div className="panel p-4">
            <div className="panel-title mb-2 flex items-center gap-2"><Icon name="UserRound" size={13} className="text-neon" />Perfil detectado</div>
            {latest ? (
              <div className="space-y-1 font-mono text-sm">
                <div className="text-soft text-lg">{latest.name}</div>
                <div className="text-mute text-xs">Nível {latest.level} · {repRank(latest.rep).name} · {latest.money.toLocaleString('pt-BR')} cr</div>
                <div className="text-mute text-xs">{latest.missions} missões · {fmtPlay(latest.playSeconds)} de jogo</div>
                <div className="text-mute text-[11px]">Último save: {new Date(latest.savedAt).toLocaleString('pt-BR')}</div>
              </div>
            ) : <p className="text-mute text-sm font-mono">Nenhum perfil encontrado. Inicie um novo jogo para começar sua carreira.</p>}
          </div>
          <div className="panel p-4">
            <div className="panel-title mb-2 flex items-center gap-2"><Icon name="Radio" size={13} className="text-tech" />Transmissões da simulação</div>
            <div className="font-mono text-xs space-y-1.5">
              {[0, 1, 2].map((k) => {
                const idx = (ticker + k) % FEED.length;
                return <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 - k * 0.3 }} className="text-soft/90"><span className="text-neon">▸</span> {FEED[idx]}</motion.div>;
              })}
            </div>
          </div>
        </motion.div>
      </div>

      <Modal open={modal === 'new'} onClose={() => { setModal(null); setConfirmNew(false); }} title="Novo jogo"
        footer={<><button className="btn btn-ghost" onClick={() => { setModal(null); setConfirmNew(false); }}>Cancelar</button><button className={`btn ${confirmNew ? 'btn-danger' : ''}`} disabled={!name.trim()} onClick={startNew}>{confirmNew ? 'Sobrescrever e começar' : 'Começar'}</button></>}>
        <label className="block text-sm text-soft mb-2">Como você quer ser chamado na rede?</label>
        <input autoFocus className="input w-full" maxLength={20} value={name} onChange={(e) => { setName(e.target.value); setConfirmNew(false); }} onKeyDown={(e) => e.key === 'Enter' && startNew()} placeholder="ex.: n0v4_dev" />
        {confirmNew && <p className="mt-3 text-sm text-warn font-mono">⚠ Já existe um progresso salvo automaticamente. Começar um novo jogo sobrescreve o slot AUTO (slots manuais 1–3 são preservados). Confirmar?</p>}
      </Modal>
      <Modal open={modal === 'load'} onClose={() => setModal(null)} title="Carregar progresso" wide><SaveManager mode="menu" onLoaded={() => setModal(null)} /></Modal>
      <Modal open={modal === 'settings'} onClose={() => setModal(null)} title="Configurações" wide><SettingsPanel /></Modal>
      <Modal open={modal === 'credits'} onClose={() => setModal(null)} title="Créditos">
        <div className="space-y-3 text-sm text-soft/90 font-mono">
          <p><span className="text-neon">HACKER SIMULATOR — Realistic Cyber Ops</span></p>
          <p>Design de jogo, interface, narrativa e código: gerado em colaboração com Claude Code.</p>
          <p className="text-mute text-xs">Tecnologias: React · TypeScript · Vite · Tailwind CSS · Framer Motion · Zustand · Lucide · WebAudio.</p>
          <p className="text-mute text-xs">Todos os personagens, empresas, redes, endereços e eventos são fictícios. Nenhuma operação real é executada: o terminal interpreta apenas comandos do jogo.</p>
        </div>
      </Modal>
    </div>
  );
}
