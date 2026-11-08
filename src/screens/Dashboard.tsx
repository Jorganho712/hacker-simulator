import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { Bar, Chip, Icon, Panel, Sparkline, Stat, money } from '../components/ui';
import { getMission, isOverheated, missionUnlocked, cpuSpeed, freeMB, storageCapMB, usedMB } from '../game/derived';
import { STORY_MISSIONS } from '../game/data/missions';
import { nextRank, repRank, xpToNext } from '../game/data/progression';
import { fmtGameTime } from '../game/state';
import { CPU_TIERS, OS_TIERS, RAM_TIERS } from '../game/data/hardware';
import { fmtMB } from '../game/data/tools';

const AMBIENT = [
  'firewall: pacote suspeito bloqueado (origem simulada 10.77.9.%d)',
  'cron: backup incremental concluído',
  'netd: latência estável (%dms) com o gateway simulado',
  'auth: 3 tentativas de login ignoradas em honeypot',
  'sysmon: verificação de integridade OK',
  'dns-sim: cache atualizado (%d entradas)',
];

export default function Dashboard() {
  const d = useGame((s) => s.data)!;
  const m = useGame((s) => s.metrics);
  const setScreen = useGame((s) => s.setScreen);
  const [ambient, setAmbient] = useState<string[]>([]);
  const [blocked, setBlocked] = useState(128);

  useEffect(() => {
    const i = setInterval(() => {
      const t = AMBIENT[Math.floor(Math.random() * AMBIENT.length)].replace('%d', String(Math.floor(Math.random() * 200)));
      const time = fmtGameTime(useGame.getState().data?.minutes ?? 0).time;
      setAmbient((a) => [`${time} ${t}`, ...a].slice(0, 6));
      setBlocked((b) => b + Math.floor(Math.random() * 3));
    }, 3500);
    return () => clearInterval(i);
  }, []);

  const mission = d.active ? getMission(d, d.active) : null;
  const rec = d.active ? d.missions[d.active] : null;
  const rank = repRank(d.rep);
  const nr = nextRank(d.rep);
  const available = STORY_MISSIONS.filter((x) => !d.missions[x.id] && !(x.requires.offered && !d.offered.includes(x.id)) && missionUnlocked(d, x));
  const unread = Object.values(d.threads).flat().filter((x) => x.from === 'them' && !x.read).length;
  const tips: { icon: string; text: string; go: () => void; tone?: string }[] = [];
  if (!mission && available[0]) tips.push({ icon: 'Target', text: `Missão disponível: ${available[0].id} — ${available[0].title}`, go: () => setScreen('missions') });
  if (!mission && d.contracts.length) tips.push({ icon: 'BriefcaseBusiness', text: `${d.contracts.length} contrato(s) no quadro`, go: () => setScreen('missions') });
  if (unread) tips.push({ icon: 'Mail', text: `${unread} mensagem(ns) não lida(s)`, go: () => setScreen('contacts') });
  if (d.skillPoints) tips.push({ icon: 'GitBranch', text: `${d.skillPoints} ponto(s) de habilidade para gastar`, go: () => setScreen('skills') });
  if (isOverheated(d)) tips.push({ icon: 'Thermometer', text: 'Superaquecimento! Use "repair" ou a aba Computador.', go: () => setScreen('computer') });
  if (!tips.length) tips.push({ icon: 'Terminal', text: 'Explore a REDE e use o TERMINAL para escanear novos alvos.', go: () => setScreen('network') });

  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Créditos" value={money(d.money)} sub={`ganho total ${money(d.stats.moneyEarned)}`} tone="yellow" />
        <Stat label={`Nível ${d.level}`} value={<span className="text-base">{d.xp} / {xpToNext(d.level)} XP</span>} sub={<Bar value={d.xp} max={xpToNext(d.level)} h={4} />} />
        <Stat label="Reputação" value={<span style={{ color: rank.color }}>{rank.name}</span>} sub={nr ? `${d.rep} / ${nr.min} para ${nr.name}` : `${d.rep} (máxima)`} tone="blue" />
        <Stat label="Missões concluídas" value={d.stats.missionsDone} sub={`${Object.keys(d.ach).length} conquistas`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Operação atual" icon="Target" className="lg:col-span-2" right={mission && <button className="btn" onClick={() => setScreen('terminal')}><Icon name="SquareTerminal" size={13} />Terminal</button>}>
          {mission && rec ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-neon">{mission.id}</span><span className="text-soft">{mission.title}</span>
                <Chip tone="blue">{mission.difficulty}</Chip><Chip tone="yellow">{mission.reward.money} cr</Chip>
              </div>
              <Bar value={rec.objIdx} max={mission.objectives.length} label="Progresso" right={`${rec.objIdx}/${mission.objectives.length}`} />
              <ul className="space-y-1.5">
                {mission.objectives.map((o, i) => (
                  <li key={o.id} className={`flex items-start gap-2 text-sm ${i < rec.objIdx ? 'text-mute line-through' : i === rec.objIdx ? 'text-soft' : 'text-mute'}`}>
                    <Icon name={i < rec.objIdx ? 'SquareCheck' : i === rec.objIdx ? 'CircleArrowRight' : 'Square'} size={15} className={i === rec.objIdx ? 'text-neon mt-0.5' : 'mt-0.5'} />
                    <span>{o.text}{i === rec.objIdx && <span className="block font-mono text-[11px] text-tech">→ {o.hint}</span>}</span>
                  </li>
                ))}
              </ul>
              {rec.deadline && <div className="text-warn font-mono text-xs flex items-center gap-1"><Icon name="Timer" size={13} />Tempo restante: <Countdown to={rec.deadline} /></div>}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-mute">Nenhuma missão ativa. Aceite um contrato na aba Missões.</p>
              <div className="space-y-2">{tips.map((t) => (
                <button key={t.text} onClick={t.go} className="w-full flex items-center gap-3 px-3 py-2 rounded border border-line hover:border-neon/60 hover:bg-neon/5 text-left transition">
                  <Icon name={t.icon} size={16} className="text-neon" /><span className="text-sm flex-1">{t.text}</span><Icon name="ChevronRight" size={14} className="text-mute" />
                </button>))}</div>
            </div>
          )}
        </Panel>

        <Panel title="Seu computador" icon="Cpu" right={<button className="text-xs text-mute hover:text-neon font-mono" onClick={() => setScreen('computer')}>detalhes →</button>}>
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-mute leading-snug">{CPU_TIERS[d.hw.cpu].name} · {RAM_TIERS[d.hw.ram].name}<br />{OS_TIERS[d.hw.os].name}</div>
            <div><div className="flex justify-between text-[11px] font-mono text-mute"><span>CPU</span><span className="text-neon">{m.cpu[m.cpu.length - 1].toFixed(0)}%</span></div><Sparkline data={m.cpu} h={34} /></div>
            <div><div className="flex justify-between text-[11px] font-mono text-mute"><span>RAM</span><span className="text-tech">{m.ram[m.ram.length - 1].toFixed(0)}%</span></div><Sparkline data={m.ram} color="#00CFFF" h={34} /></div>
            <div><div className="flex justify-between text-[11px] font-mono text-mute"><span>REDE</span><span className="text-warn">{m.net[m.net.length - 1].toFixed(1)} Mb/s</span></div><Sparkline data={m.net} color="#FFC857" h={34} max={80} /></div>
            <div className="flex justify-between font-mono text-[11px]"><span className={m.temp > 62 ? 'text-alert' : 'text-mute'}>{m.temp.toFixed(0)}°C</span><span className="text-mute">x{cpuSpeed(d).toFixed(1)} · {fmtMB(freeMB(d))} livres</span></div>
            <Bar value={usedMB(d)} max={storageCapMB(d)} h={4} color="#FFC857" />
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Log de atividade" icon="ScrollText" className="lg:col-span-2" bodyClass="font-mono text-xs space-y-1 max-h-72 overflow-y-auto">
          {[...d.feed.slice(0, 8).map((f) => ({ k: f.id, t: `${fmtGameTime(f.ts).time} ${f.text}`, kind: f.kind })), ...ambient.map((a, i) => ({ k: 'a' + i + a, t: a, kind: 'dim' as const }))].slice(0, 14).map((l) => (
            <div key={l.k} className={l.kind === 'ok' ? 'text-neon' : l.kind === 'warn' ? 'text-warn' : l.kind === 'err' ? 'text-alert' : l.kind === 'info' ? 'text-tech' : 'text-mute'}>▸ {l.t}</div>
          ))}
        </Panel>
        <Panel title="Segurança da sessão" icon="ShieldCheck" bodyClass="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="panel py-2"><div className="font-mono text-2xl text-neon glow">{blocked}</div><div className="text-[10px] text-mute font-mono uppercase">ameaças bloqueadas</div></div>
            <div className="panel py-2"><div className="font-mono text-2xl text-tech">{d.discovered.length}</div><div className="text-[10px] text-mute font-mono uppercase">nós conhecidos</div></div>
          </div>
          <div className="text-xs text-mute font-mono flex items-center gap-2"><Icon name="Lock" size={13} className="text-neon" />Ambiente 100% local e simulado — sem tráfego externo.</div>
          <div className="text-xs font-mono flex items-center gap-2 text-soft/80"><span className={`w-2 h-2 rounded-full ${d.node ? 'bg-tech' : 'bg-neon'} animate-pulseDot`} />{d.node ? `Sessão remota em ${d.node}` : 'Sem sessão remota'}</div>
        </Panel>
      </div>
    </div>
  );
}

function Countdown({ to }: { to: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const s = Math.max(0, Math.round((to - now) / 1000));
  return <b>{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</b>;
}
export { Countdown };
