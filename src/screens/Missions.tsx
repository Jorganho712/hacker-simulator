import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../game/store';
import { ALL_STORY } from '../game/data/missions';
import { getMission, missionReward, missionUnlocked, prereqsDone, reqLines } from '../game/derived';
import type { MissionDef } from '../game/types';
import { Bar, Chip, Empty, Icon, Modal, Panel, Tabs } from '../components/ui';
import { runChallenge } from '../game/terminal/commands';
import { Countdown } from './Dashboard';

const DIFF_TONE = { Iniciante: 'green', Intermediário: 'blue', Avançado: 'yellow', Especialista: 'red' } as const;

export default function Missions() {
  const d = useGame((s) => s.data)!;
  const { startMission, emit, abandonMission, setScreen } = useGame.getState();
  const [tab, setTab] = useState<'story' | 'board' | 'done'>('story');
  const [sel, setSel] = useState<string | null>(d.active);
  const [confirmAbort, setConfirmAbort] = useState(false);
  const [msg, setMsg] = useState('');
  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force((x) => x + 1), 1000); return () => clearInterval(i); }, []);

  const story = useMemo(() => ALL_STORY.filter((m) => d.missions[m.id]?.status !== 'completed' && !(m.requires.offered && !d.offered.includes(m.id)) && (prereqsDone(d, m) || d.missions[m.id])), [d]);
  const done = ALL_STORY.filter((m) => d.missions[m.id]?.status === 'completed');
  const board = d.contracts.filter((c) => c.expiresAt > Date.now() || c.mission.id === d.active);
  const list: MissionDef[] = tab === 'story' ? story : tab === 'board' ? board.map((c) => c.mission) : done;
  const cur = (sel && getMission(d, sel)) || list[0] || null;
  const rec = cur ? d.missions[cur.id] : undefined;
  const active = d.active === cur?.id;
  const contract = cur && board.find((c) => c.mission.id === cur.id);

  const start = (id: string) => { const r = startMission(id); setMsg(r.ok ? '' : r.msg); };
  const objNow = active && cur ? cur.objectives[rec!.objIdx] : null;

  const openChallenge = async () => {
    if (!objNow || objNow.match.type !== 'mg') return;
    const p = runChallenge(objNow.match.ref!, 'missions');
    setTimeout(() => { if (!useGame.getState().mg) setScreen('terminal'); }, 120);
    await p;
  };

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto h-full flex flex-col">
      <Tabs tabs={[{ id: 'story', label: `Contratos (${story.length})`, icon: 'Target' }, { id: 'board', label: `Quadro (${board.length})`, icon: 'BriefcaseBusiness' }, { id: 'done', label: `Concluídas (${done.length})`, icon: 'CheckCheck' }]} value={tab} onChange={(t) => { setTab(t); setSel(null); setMsg(''); }} />
      <div className="grid lg:grid-cols-5 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 space-y-2 overflow-y-auto pr-1 lg:max-h-full max-h-[40vh]">
          {list.length === 0 && <Empty icon="Inbox" text={tab === 'board' ? 'Nenhum contrato no quadro agora. Novos contratos aparecem com o tempo.' : tab === 'done' ? 'Nenhuma missão concluída ainda.' : 'Sem contratos disponíveis. Converse com seus contatos ou avance na história.'} />}
          {list.map((m) => {
            const st = d.missions[m.id]?.status;
            const ok = missionUnlocked(d, m);
            const c = board.find((x) => x.mission.id === m.id);
            return (
              <button key={m.id} onClick={() => { setSel(m.id); setMsg(''); }} className={`w-full text-left panel p-3 transition hover:border-neon/50 ${cur?.id === m.id ? '!border-neon shadow-neonsm' : ''} ${!ok && st !== 'active' ? 'opacity-70' : ''}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-neon">{m.id}</span>
                  <Chip tone={DIFF_TONE[m.difficulty]}>{m.difficulty}</Chip>
                  {st === 'active' && <Chip tone="green" icon="Play">ativa</Chip>}
                  {st === 'failed' && <Chip tone="red" icon="RotateCcw">refazer</Chip>}
                  {!ok && st !== 'active' && <Chip tone="gray" icon="Lock">bloqueada</Chip>}
                  {c && st !== 'active' && <span className="ml-auto text-[11px] font-mono text-warn flex items-center gap-1"><Icon name="Timer" size={11} /><Countdown to={c.expiresAt} /></span>}
                </div>
                <div className="text-sm text-soft">{m.title}</div>
                <div className="text-[11px] text-mute font-mono mt-0.5">{m.client} · {m.reward.money} cr · {m.reward.xp} XP</div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3 min-h-0 overflow-y-auto">
          {!cur ? <Panel><Empty icon="Target" text="Selecione uma missão." /></Panel> : (
            <Panel title={<span>{cur.id} · {cur.category}</span>} icon="FileText" bodyClass="space-y-4">
              <div>
                <h2 className="text-xl text-soft mb-1">{cur.title}</h2>
                <div className="flex gap-2 flex-wrap items-center"><Chip tone={DIFF_TONE[cur.difficulty]}>{cur.difficulty}</Chip><span className="text-xs text-mute font-mono">Cliente: {cur.client}{cur.org && cur.org !== cur.client ? ` (${cur.org})` : ''}</span><span className="text-xs text-mute font-mono">⏱ {cur.eta}</span></div>
              </div>
              <p className="text-sm text-soft/90 leading-relaxed">{cur.description}</p>
              <div className="panel p-3 !bg-void/60 space-y-1.5">{cur.briefing.map((b, i) => <p key={i} className="text-xs text-mute leading-relaxed font-mono">» {b}</p>)}</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="panel py-2"><div className="font-mono text-warn">{missionReward(d, cur, (rec?.attempts ?? 0) + (active ? 0 : 1), false)} cr</div><div className="text-[10px] text-mute uppercase font-mono">recompensa</div></div>
                <div className="panel py-2"><div className="font-mono text-neon">{cur.reward.xp} XP</div><div className="text-[10px] text-mute uppercase font-mono">experiência</div></div>
                <div className="panel py-2"><div className="font-mono text-tech">{cur.reward.rep >= 0 ? '+' : ''}{cur.reward.rep}</div><div className="text-[10px] text-mute uppercase font-mono">reputação</div></div>
              </div>
              {(rec?.attempts ?? 0) > 1 || rec?.status === 'failed' ? <p className="text-xs text-warn font-mono">⚠ Tentativas anteriores reduzem a recompensa (−15% por falha).</p> : null}

              <div>
                <div className="panel-title mb-2">Objetivos</div>
                <ul className="space-y-2">
                  {cur.objectives.map((o, i) => {
                    const done = rec?.status === 'completed' || (active && i < rec!.objIdx);
                    const now = active && i === rec!.objIdx;
                    return (
                      <li key={o.id} className={`flex gap-2 text-sm ${done ? 'text-mute' : now ? 'text-soft' : 'text-mute/80'}`}>
                        <Icon name={done ? 'SquareCheck' : now ? 'CircleArrowRight' : 'Square'} size={16} className={`mt-0.5 shrink-0 ${now ? 'text-neon' : done ? 'text-neon2' : ''}`} />
                        <span className={done ? 'line-through' : ''}>{o.text}{(now || !active) && <span className="block font-mono text-[11px] text-tech/80">{o.hint}</span>}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {!active && rec?.status !== 'completed' && (
                <div>
                  <div className="panel-title mb-2">Requisitos</div>
                  <div className="flex gap-2 flex-wrap">
                    {reqLines(d, cur).length === 0 && <Chip tone="green">sem requisitos</Chip>}
                    {reqLines(d, cur).map((l) => <Chip key={l.label} tone={l.ok ? 'green' : 'red'} icon={l.ok ? 'Check' : 'X'}>{l.label}</Chip>)}
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div className="panel p-2 border-neon/20"><div className="text-neon font-mono mb-0.5">Se der certo</div><span className="text-mute">{cur.consequences.success}</span></div>
                <div className="panel p-2 border-alert/20"><div className="text-alert font-mono mb-0.5">Se der errado</div><span className="text-mute">{cur.consequences.failure}</span></div>
              </div>
              {cur.timeLimit && <p className="text-xs text-warn font-mono flex items-center gap-1"><Icon name="Timer" size={13} />Missão cronometrada: {Math.round(cur.timeLimit / 60)} minutos.</p>}
              {active && rec?.deadline && <Bar value={Math.max(0, rec.deadline - Date.now())} max={cur.timeLimit! * 1000} color="#FFC857" label="Tempo" right={<Countdown to={rec.deadline} />} />}
              {active && cur.maxErrors && <p className="text-xs font-mono text-mute">Erros: {rec!.errors}/{cur.maxErrors}</p>}

              <div className="flex gap-2 flex-wrap pt-1">
                {!active && rec?.status !== 'completed' && <button className="btn" disabled={!missionUnlocked(d, cur) || !!d.active} onClick={() => start(cur.id)}><Icon name="Play" size={13} />{rec?.status === 'failed' ? 'Tentar de novo' : 'Aceitar missão'}</button>}
                {active && <button className="btn btn-tech" onClick={() => setScreen('terminal')}><Icon name="SquareTerminal" size={13} />Abrir terminal</button>}
                {active && objNow?.match.type === 'mg' && <button className="btn" onClick={openChallenge}><Icon name="Gamepad2" size={13} />Abrir desafio</button>}
                {active && objNow?.match.type === 'submit' && <button className="btn" onClick={() => emit({ type: 'submit' })}><Icon name="Send" size={13} />Entregar relatório</button>}
                {active && objNow?.match.type === 'choice' && <button className="btn" onClick={() => setScreen('contacts')}><Icon name="MessageSquare" size={13} />Abrir contatos</button>}
                {active && <button className="btn btn-danger" onClick={() => setConfirmAbort(true)}><Icon name="Ban" size={13} />Abandonar</button>}
              </div>
              {!active && d.active && <p className="text-xs text-warn font-mono">Termine ou abandone a missão {d.active} antes de aceitar outra.</p>}
              {msg && <p className="text-xs text-alert font-mono">{msg}</p>}
              {contract && !active && <p className="text-[11px] text-mute font-mono">Contrato avulso: expira se não for aceito a tempo.</p>}
            </Panel>
          )}
        </div>
      </div>
      <Modal open={confirmAbort} onClose={() => setConfirmAbort(false)} title="Abandonar missão?" footer={<><button className="btn btn-ghost" onClick={() => setConfirmAbort(false)}>Continuar missão</button><button className="btn btn-danger" onClick={() => { abandonMission(); setConfirmAbort(false); }}>Abandonar</button></>}>
        <p className="text-sm text-soft/90">Seu progresso nesta missão será perdido e você sofrerá uma pequena perda de reputação (−2) se já tiver avançado.</p>
      </Modal>
    </div>
  );
}
