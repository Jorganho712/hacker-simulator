import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/store';
import type { ScreenId } from '../game/types';
import { fmtGameTime } from '../game/state';
import { repRank, xpToNext } from '../game/data/progression';
import { EVENT_MAP } from '../game/data/events';
import { t } from '../i18n';
import { Icon, Modal, money } from './ui';
import MinigameHost from '../minigames/Host';
import Dashboard from '../screens/Dashboard';
import TerminalScreen from '../screens/TerminalScreen';
import Missions from '../screens/Missions';
import NetworkScreen from '../screens/NetworkScreen';
import ToolsScreen from '../screens/ToolsScreen';
import FilesScreen from '../screens/FilesScreen';
import ComputerScreen from '../screens/ComputerScreen';
import Market from '../screens/Market';
import Contacts from '../screens/Contacts';
import Skills from '../screens/Skills';
import Stats from '../screens/Stats';
import SettingsScreen from '../screens/SettingsScreen';

const NAV: { id: ScreenId; icon: string }[] = [
  { id: 'dashboard', icon: 'LayoutDashboard' }, { id: 'terminal', icon: 'SquareTerminal' }, { id: 'missions', icon: 'Target' },
  { id: 'network', icon: 'Network' }, { id: 'tools', icon: 'Wrench' }, { id: 'files', icon: 'FolderTree' },
  { id: 'computer', icon: 'Cpu' }, { id: 'market', icon: 'ShoppingCart' }, { id: 'contacts', icon: 'MessageSquare' },
  { id: 'skills', icon: 'GitBranch' }, { id: 'stats', icon: 'ChartColumn' }, { id: 'settings', icon: 'Settings' },
];

function Screen({ id }: { id: ScreenId }) {
  switch (id) {
    case 'dashboard': return <Dashboard />;
    case 'terminal': return <TerminalScreen />;
    case 'missions': return <Missions />;
    case 'network': return <NetworkScreen />;
    case 'tools': return <ToolsScreen />;
    case 'files': return <FilesScreen />;
    case 'computer': return <ComputerScreen />;
    case 'market': return <Market />;
    case 'contacts': return <Contacts />;
    case 'skills': return <Skills />;
    case 'stats': return <Stats />;
    case 'settings': return <SettingsScreen />;
  }
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const d = useGame((s) => s.data)!;
  const setScreen = useGame((s) => s.setScreen);
  const markRead = useGame((s) => s.markNotifsRead);
  const lang = useGame((s) => s.settings.lang);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = d.notifs.filter((n) => !n.read).length;
  const time = fmtGameTime(d.minutes);
  const rank = repRank(d.rep);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <header className="h-14 shrink-0 border-b border-line bg-ink/95 flex items-center gap-3 px-3 relative z-30">
      <button className="lg:hidden p-2 -ml-1 text-neon" aria-label="Menu" onClick={onMenu}><Icon name="Menu" size={20} /></button>
      <div className="flex items-center gap-2 min-w-0">
        <div className="hidden sm:grid w-8 h-8 rounded bg-neon/10 border border-neon/40 place-items-center text-neon font-mono text-sm">{d.name[0]?.toUpperCase()}</div>
        <div className="min-w-0 leading-tight">
          <div className="font-mono text-sm text-soft truncate">{d.name}{d.title && <span className="text-tech"> «{d.title}»</span>}</div>
          <div className="font-mono text-[10px] text-mute truncate">{d.promptName}</div>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 ml-3 w-44" title={`${d.xp}/${xpToNext(d.level)} XP`}>
        <span className="font-mono text-xs text-neon whitespace-nowrap">LV {d.level}</span>
        <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden"><div className="h-full bg-neon shadow-neonsm transition-all" style={{ width: `${(d.xp / xpToNext(d.level)) * 100}%` }} /></div>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-3 sm:gap-5 font-mono text-xs">
        <div className="text-warn flex items-center gap-1.5" title={t('common.money')}><Icon name="Coins" size={14} /><span>{money(d.money)}</span></div>
        <div className="hidden sm:flex items-center gap-1.5" style={{ color: rank.color }} title={t('common.rep', lang)}><Icon name="Star" size={14} />{rank.name} <span className="text-mute">({d.rep})</span></div>
        <div className={`hidden md:flex items-center gap-1.5 ${d.node ? 'text-tech' : 'text-neon'}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulseDot" />{d.node ? `VPN · ${d.node}` : t('top.online', lang)}
        </div>
        <div className="hidden lg:block text-mute leading-tight text-right"><div>{time.time}</div><div className="text-[10px]">{time.date}</div></div>
        <div className="relative" ref={ref}>
          <button className="relative p-2 text-soft hover:text-neon" aria-label={t('top.notifs', lang)} onClick={() => { setOpen(!open); if (!open) setTimeout(markRead, 1200); }}>
            <Icon name="Bell" size={18} />
            {unread > 0 && <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-alert text-[10px] grid place-items-center text-white">{unread}</span>}
          </button>
          {open && (
            <div className="absolute right-0 top-11 w-[min(92vw,360px)] panel !bg-ink shadow-neon max-h-[70vh] overflow-y-auto z-50">
              <div className="px-3 py-2 border-b border-line panel-title">{t('top.notifs', lang)}</div>
              {d.notifs.length === 0 && <div className="p-4 text-xs text-mute font-mono">Nada por aqui.</div>}
              {d.notifs.slice(0, 20).map((n) => (
                <button key={n.id} className="w-full text-left px-3 py-2 border-b border-line/60 hover:bg-white/5 flex gap-2" onClick={() => { setOpen(false); if (n.kind === 'msg') setScreen('contacts'); }}>
                  <Icon name={n.kind === 'ok' ? 'CircleCheck' : n.kind === 'err' ? 'CircleX' : n.kind === 'warn' ? 'TriangleAlert' : n.kind === 'msg' ? 'Mail' : n.kind === 'unlock' ? 'LockOpen' : 'Info'} size={14} className={`mt-0.5 shrink-0 ${n.kind === 'err' ? 'text-alert' : n.kind === 'warn' ? 'text-warn' : n.kind === 'msg' ? 'text-tech' : 'text-neon'}`} />
                  <span className="min-w-0"><span className="block text-xs text-soft">{n.title}</span>{n.body && <span className="block text-[11px] text-mute truncate">{n.body}</span>}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const screen = useGame((s) => s.screen);
  const setScreen = useGame((s) => s.setScreen);
  const d = useGame((s) => s.data)!;
  const lang = useGame((s) => s.settings.lang);
  const quit = useGame((s) => s.quitToMenu);
  const unreadMsgs = Object.values(d.threads).flat().filter((m) => m.from === 'them' && !m.read).length;
  const badge = (id: ScreenId): number => (id === 'contacts' ? unreadMsgs : id === 'skills' ? d.skillPoints : id === 'missions' ? (d.active ? 0 : d.contracts.length) : 0);
  const body = (
    <nav className="flex flex-col h-full py-2">
      <div className="px-4 py-3 mb-1 flex items-center gap-2 border-b border-line">
        <div className="w-7 h-7 rounded bg-neon/10 border border-neon/40 grid place-items-center text-neon"><Icon name="Terminal" size={14} /></div>
        <div className="font-mono text-[11px] leading-tight text-neon tracking-widest">HACKER<br /><span className="text-mute">SIMULATOR</span></div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {NAV.map((n) => {
          const b = badge(n.id);
          const active = screen === n.id;
          return (
            <button key={n.id} onClick={() => { setScreen(n.id); onClose(); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition relative ${active ? 'bg-neon/10 text-neon' : 'text-soft/80 hover:bg-white/5 hover:text-soft'}`}>
              {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-neon shadow-neon rounded" />}
              <Icon name={n.icon} size={17} />
              <span className="font-mono text-xs uppercase tracking-wider flex-1">{t('nav.' + n.id, lang)}</span>
              {b > 0 && <span className="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-neon/20 border border-neon/50 text-[10px] text-neon font-mono">{b}</span>}
            </button>
          );
        })}
      </div>
      <div className="px-2 pt-2 border-t border-line space-y-1">
        <button className="w-full btn btn-ghost" onClick={() => useGame.getState().saveSlot('auto') && useGame.getState().notify('ok', 'Progresso salvo', 'Slot AUTO atualizado.', true)}><Icon name="Save" size={13} />Salvar</button>
        <button className="w-full btn btn-ghost" onClick={quit}><Icon name="LogOut" size={13} />Menu principal</button>
      </div>
    </nav>
  );
  return (
    <>
      <aside className="hidden lg:block w-56 shrink-0 border-r border-line bg-ink/95">{body}</aside>
      <AnimatePresence>
        {open && (
          <motion.div className="lg:hidden fixed inset-0 z-[55]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <motion.aside className="absolute left-0 top-0 bottom-0 w-64 bg-ink border-r border-line" initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}>{body}</motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const dismiss = useGame((s) => s.dismissToast);
  return (
    <div className="fixed top-16 right-3 z-[65] flex flex-col gap-2 w-[min(92vw,330px)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((x) => (
          <motion.div key={x.id} layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} onClick={() => dismiss(x.id)}
            className={`pointer-events-auto panel !bg-ink px-3 py-2 flex gap-2 shadow-neon cursor-pointer border-l-2 ${x.kind === 'err' ? '!border-l-alert' : x.kind === 'warn' ? '!border-l-warn' : x.kind === 'msg' ? '!border-l-tech' : '!border-l-neon'}`}>
            <Icon name={x.kind === 'ok' ? 'CircleCheck' : x.kind === 'err' ? 'CircleX' : x.kind === 'warn' ? 'TriangleAlert' : x.kind === 'msg' ? 'Mail' : x.kind === 'unlock' ? 'Sparkles' : 'Info'} size={16} className={x.kind === 'err' ? 'text-alert' : x.kind === 'warn' ? 'text-warn' : x.kind === 'msg' ? 'text-tech' : 'text-neon'} />
            <div className="min-w-0"><div className="text-xs text-soft font-mono">{x.title}</div>{x.body && <div className="text-[11px] text-mute line-clamp-2">{x.body}</div>}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function EventModal() {
  const pe = useGame((s) => s.pendingEvent);
  const respond = useGame((s) => s.respondEvent);
  const d = useGame((s) => s.data)!;
  const def = pe ? EVENT_MAP[pe.id] : null;
  return (
    <Modal open={!!pe && !!def} title={<span className="flex items-center gap-2"><Icon name={def?.icon || 'Bell'} size={15} />{def?.title}</span>}
      footer={def?.choices.map((c, i) => <button key={c.id} className={`btn ${i > 0 ? 'btn-ghost' : ''}`} onClick={() => respond(c.id)}>{c.label}</button>)}>
      <p className="text-sm text-soft/90 leading-relaxed">{def?.text(d)}{pe?.payload?.extra}</p>
    </Modal>
  );
}

export default function Shell() {
  const screen = useGame((s) => s.screen);
  const [menu, setMenu] = useState(false);
  const mgActive = useGame((s) => !!s.mg);
  const anim = useGame((s) => s.settings.animations && !s.settings.reduceMotion);
  const page = useMemo(() => <Screen id={screen} />, [screen]);
  return (
    <div className="h-full flex flex-col">
      <TopBar onMenu={() => setMenu(true)} />
      <div className="flex-1 min-h-0 flex">
        <Sidebar open={menu} onClose={() => setMenu(false)} />
        <main className="flex-1 min-w-0 min-h-0 relative overflow-hidden grid-bg">
          <AnimatePresence mode="wait">
            <motion.div key={screen} className="absolute inset-0 overflow-y-auto" initial={anim ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} exit={anim ? { opacity: 0 } : undefined} transition={{ duration: 0.18 }}>
              {page}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toasts />
      <EventModal />
      {mgActive && <MinigameHost />}
    </div>
  );
}
