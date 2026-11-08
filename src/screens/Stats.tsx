import { useState } from 'react';
import { useGame } from '../game/store';
import { ACHIEVEMENTS, repRank } from '../game/data/progression';
import { Bar, Icon, Panel, Stat, Tabs, money } from '../components/ui';
import { MG_NAMES } from '../game/data/contracts';
import { fmtPlay } from '../components/SaveManager';
import type { MgId } from '../game/types';

export default function Stats() {
  const d = useGame((s) => s.data)!;
  const [tab, setTab] = useState<'stats' | 'ach'>('stats');
  const got = Object.keys(d.ach).length;
  const s = d.stats;
  const mgs = Object.keys(MG_NAMES) as MgId[];
  const maxMg = Math.max(1, ...mgs.map((m) => s.mgWon[m] || 0));
  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto">
      <div className="mb-3"><h1 className="font-mono text-lg text-neon tracking-widest uppercase">Estatísticas</h1></div>
      <Tabs tabs={[{ id: 'stats', label: 'Desempenho', icon: 'ChartColumn' }, { id: 'ach', label: `Conquistas (${got}/${ACHIEVEMENTS.length})`, icon: 'Trophy' }]} value={tab} onChange={setTab} />
      {tab === 'stats' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Tempo de jogo" value={fmtPlay(s.playSeconds)} />
            <Stat label="Comandos" value={s.commands} tone="blue" />
            <Stat label="Missões" value={`${s.missionsDone} ✔ / ${s.missionsFailed} ✘`} tone="yellow" />
            <Stat label="Perfeitas" value={s.perfectMissions} sub="sem erros" />
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title="Desafios vencidos por tipo" icon="Gamepad2" bodyClass="space-y-2.5">
              {mgs.map((m) => <Bar key={m} value={s.mgWon[m] || 0} max={maxMg} label={MG_NAMES[m]} right={s.mgWon[m] || 0} />)}
              <p className="text-xs font-mono text-mute pt-1">Jogados: {s.mgPlayed} · erros totais: {s.errors}</p>
            </Panel>
            <Panel title="Economia e progresso" icon="Coins" bodyClass="space-y-2 text-sm font-mono">
              {[['Créditos atuais', money(d.money)], ['Total ganho', money(s.moneyEarned)], ['Total gasto', money(s.moneySpent)], ['Ferramentas compradas (níveis)', s.toolsBought], ['Varreduras', s.scans], ['Arquivos criados', s.filesCreated], ['Eventos aleatórios', s.eventsSeen], ['Reputação', `${d.rep} — ${repRank(d.rep).name}`], ['Nós descobertos', d.discovered.length]].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between border-b border-line/50 pb-1"><span className="text-mute">{k}</span><span className="text-soft">{v}</span></div>
              ))}
            </Panel>
          </div>
          <Panel title="Decisões narrativas" icon="GitFork" bodyClass="flex flex-wrap gap-2">
            {Object.entries(d.flags).filter(([k, v]) => v && !k.startsWith('q_')).map(([k, v]) => <span key={k} className="chip border-tech/30 text-tech">{k}{typeof v !== 'boolean' ? `: ${v}` : ''}</span>)}
            {!Object.keys(d.flags).length && <span className="text-xs text-mute font-mono">Nenhuma decisão registrada ainda.</span>}
          </Panel>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = d.ach[a.id];
            return (
              <div key={a.id} className={`panel p-3 flex gap-3 ${unlocked ? 'border-neon/40 shadow-neonsm' : 'opacity-60'}`}>
                <div className={`w-11 h-11 shrink-0 rounded grid place-items-center border ${unlocked ? 'bg-neon/10 border-neon/50 text-neon' : 'bg-line border-line text-mute'}`}><Icon name={unlocked ? a.icon : 'Lock'} size={20} /></div>
                <div className="min-w-0">
                  <div className="text-sm text-soft">{a.name}</div>
                  <div className="text-xs text-mute">{a.desc}</div>
                  <div className="text-[10px] font-mono text-warn mt-1">+{a.reward.xp} XP{a.reward.money ? ` · +${a.reward.money} cr` : ''}{unlocked ? <span className="text-neon"> · desbloqueada {new Date(unlocked).toLocaleDateString('pt-BR')}</span> : ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
