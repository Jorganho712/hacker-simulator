import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { RES_MAP, type ResJob } from '../game/data/puzzles';
import { Bar, Chip, Icon, Panel } from '../components/ui';
import type { GameProps } from './Host';
import { cpuSpeed, infraCapBonus, ramMB } from '../game/derived';

const RAM_RESERVE = [350, 500, 700, 900];

interface Run { id: string; left: number; total: number }

export default function Resources({ ch, finish }: GameProps) {
  const d = useGame((s) => s.data)!;
  const sc = RES_MAP[ch.params.scenario];
  const speed = cpuSpeed(d);
  const bonus = infraCapBonus(d) + (d.skills.infra >= 1 ? 0.05 * (d.skills.infra - 1) : 0);
  const cpuCap = Math.round(100 * Math.pow(speed, 0.8) * (d.skills.infra ? 1 + 0.05 * d.skills.infra : 1));
  const ramCap = Math.round(Math.max(0, ramMB(d) - RAM_RESERVE[d.hw.os]) * bonus);
  const [running, setRunning] = useState<Run[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [time, setTime] = useState(sc.time);
  const [msg, setMsg] = useState('');
  const [started, setStarted] = useState(false);
  const finished = useRef(false);
  const doneRef = useRef<string[]>([]);
  const runRef = useRef<Run[]>([]);
  runRef.current = running;
  doneRef.current = done;

  const dur = (j: ResJob) => j.dur / Math.pow(speed, 0.5);
  const usedCpu = running.reduce((a, r) => a + sc.jobs.find((j) => j.id === r.id)!.cpu, 0);
  const usedRam = running.reduce((a, r) => a + sc.jobs.find((j) => j.id === r.id)!.ram, 0);
  const required = sc.jobs.filter((j) => j.required);

  const status = (j: ResJob): { can: boolean; why: string } => {
    if (done.includes(j.id)) return { can: false, why: 'concluído' };
    if (running.some((r) => r.id === j.id)) return { can: false, why: 'em execução' };
    if (j.after && !done.includes(j.after)) return { can: false, why: `aguarda ${sc.jobs.find((x) => x.id === j.after)!.name}` };
    if (j.ram > ramCap) return { can: false, why: `RAM máx. ${ramCap} MB < ${j.ram} MB (faça upgrade)` };
    if (j.cpu > cpuCap) return { can: false, why: 'CPU insuficiente (faça upgrade)' };
    if (usedCpu + j.cpu > cpuCap) return { can: false, why: 'sem CPU livre' };
    if (usedRam + j.ram > ramCap) return { can: false, why: 'sem RAM livre' };
    return { can: true, why: '' };
  };

  const start = (j: ResJob) => {
    const st = status(j);
    if (!st.can) return setMsg(st.why);
    setStarted(true);
    setRunning((r) => [...r, { id: j.id, left: dur(j), total: dur(j) }]);
    setMsg('');
  };

  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => {
      if (finished.current) return;
      setTime((x) => Math.max(0, x - 0.1));
      setRunning((rs) => {
        const next: Run[] = [];
        const fin: string[] = [];
        rs.forEach((r) => { const left = r.left - 0.1; if (left <= 0) fin.push(r.id); else next.push({ ...r, left }); });
        if (fin.length) setDone((dn) => [...new Set([...dn, ...fin])]);
        return next;
      });
    }, 100);
    return () => clearInterval(t);
  }, [started]);

  useEffect(() => {
    if (finished.current) return;
    const allReq = required.every((j) => done.includes(j.id));
    if (allReq && started) {
      finished.current = true;
      const extra = sc.jobs.filter((j) => !j.required && done.includes(j.id)).reduce((a, j) => a + (j.bonus || 0), 0);
      const sco = Math.min(100, Math.round(60 + (time / sc.time) * 30 + extra));
      setTimeout(() => finish({ win: true, score: sco, errors: 0, hints: 0, note: `Concluído com ${time.toFixed(0)}s de folga.${extra ? ` Bônus de opcionais: +${extra}.` : ''}` }), 600);
    } else if (time <= 0 && started) {
      finished.current = true;
      finish({ win: false, score: Math.round((done.filter((i) => sc.jobs.find((j) => j.id === i)!.required).length / required.length) * 40), errors: 1, hints: 0, note: 'O tempo acabou antes de concluir os processos obrigatórios.' });
    }
  }, [done, time, started]);

  return (
    <div className="space-y-3">
      <div className="panel p-3 text-sm"><b className="text-neon">{sc.title}</b> — <span className="text-soft/90">{sc.intro}</span></div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="panel p-3"><Bar value={usedCpu} max={cpuCap} label="CPU" right={`${usedCpu}/${cpuCap}`} color={usedCpu > cpuCap * 0.9 ? '#FFC857' : 'rgb(var(--accent))'} h={8} /></div>
        <div className="panel p-3"><Bar value={usedRam} max={ramCap} label="RAM" right={`${usedRam}/${ramCap} MB`} color="#00CFFF" h={8} /></div>
        <div className="panel p-3"><Bar value={time} max={sc.time} label="Tempo" right={`${time.toFixed(1)}s`} color={time < 12 ? '#FF3B3B' : '#FFC857'} h={8} /></div>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <Chip tone="green">Obrigatórios {required.filter((j) => done.includes(j.id)).length}/{required.length}</Chip>
        <Chip tone="blue">Velocidade da CPU x{speed.toFixed(1)}</Chip>
        {!started && <span className="text-xs font-mono text-warn">O relógio começa quando você iniciar o primeiro processo.</span>}
        {msg && <span className="text-xs font-mono text-alert">{msg}</span>}
      </div>
      <Panel title="Processos" icon="ListTree" bodyClass="grid md:grid-cols-2 gap-2">
        {sc.jobs.map((j) => {
          const run = running.find((r) => r.id === j.id);
          const st = status(j);
          const isDone = done.includes(j.id);
          return (
            <div key={j.id} className={`border rounded p-3 space-y-2 ${isDone ? 'border-neon/40 bg-neon/[0.04]' : run ? 'border-tech/50' : 'border-line'}`}>
              <div className="flex items-center gap-2"><Icon name={isDone ? 'CircleCheck' : run ? 'Loader' : 'Cog'} size={15} className={isDone ? 'text-neon' : run ? 'text-tech animate-spin' : 'text-mute'} />
                <span className="font-mono text-sm text-soft flex-1">{j.name}</span>{j.required ? <Chip tone="red">obrig.</Chip> : <Chip tone="yellow">+{j.bonus} bônus</Chip>}</div>
              <div className="text-[11px] font-mono text-mute flex gap-3"><span>CPU {j.cpu}</span><span>RAM {j.ram} MB</span><span>{dur(j).toFixed(1)}s</span></div>
              {run && <Bar value={run.total - run.left} max={run.total} color="#00CFFF" h={5} />}
              {!isDone && !run && <button className="btn w-full !py-1" disabled={!st.can} onClick={() => start(j)}><Icon name="Play" size={12} />{st.can ? 'Iniciar' : st.why}</button>}
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
