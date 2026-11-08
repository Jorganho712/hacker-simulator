import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { CHALLENGE_MAP, NODES, NODE_MAP } from '../game/data/world';
import { Chip, Icon, Panel } from '../components/ui';
import { execute, runChallenge } from '../game/terminal/commands';
import MiniConsole from '../components/MiniConsole';
import { mgSkillOk, nodeConnectLevel, toolLv } from '../game/derived';
import { MG_NAMES } from '../game/data/contracts';

const SEC_COLOR = ['', '#00FF88', '#7CFF4D', '#FFC857', '#FF8A3B', '#FF3B3B'];

export default function NetworkScreen() {
  const d = useGame((s) => s.data)!;
  const busy = useGame((s) => s.termBusy);
  const selected = useGame((s) => s.selectedNode);
  const selectNode = useGame((s) => s.selectNode);
  const [hover, setHover] = useState<string | null>(null);
  const known = NODES.filter((n) => d.discovered.includes(n.id));
  const sel = (selected && NODE_MAP[selected]) || null;
  useEffect(() => { if (!selected && known[0]) selectNode(known[0].id); }, []);
  const scanned = sel ? sel.id in d.scanned : false;
  const connected = sel && d.node === sel.id;
  const ghosts = NODES.filter((n) => !d.discovered.includes(n.id) && n.links.some((l) => d.discovered.includes(l)));

  return (
    <div className="p-3 sm:p-5 max-w-[1500px] mx-auto space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="font-mono text-lg text-neon tracking-widest uppercase">Rede</h1><p className="text-xs text-mute font-mono">Internet fictícia · {known.length}/{NODES.length} nós descobertos · nenhuma conexão real</p></div>
        <div className="flex gap-3 text-[11px] font-mono text-mute">{[1, 2, 3, 4, 5].map((i) => <span key={i} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SEC_COLOR[i] }} />sec {i}</span>)}</div>
      </div>
      <div className="grid xl:grid-cols-5 gap-3">
        <Panel className="xl:col-span-3" bodyClass="!p-0">
          <div className="relative w-full aspect-[4/3] min-h-[320px] overflow-hidden rounded-md bg-void/80" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgb(var(--accent) / 0.07), transparent 60%)' }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {NODES.flatMap((n) => n.links.filter((l) => n.id < l && NODE_MAP[l]).map((l) => ({ a: n, b: NODE_MAP[l] }))).map(({ a, b }) => {
                const da = d.discovered.includes(a.id), db = d.discovered.includes(b.id);
                if (!da && !db) return null;
                const both = da && db;
                const active = d.node && (d.node === a.id || d.node === b.id);
                return <line key={a.id + b.id} x1={a.pos[0]} y1={a.pos[1]} x2={b.pos[0]} y2={b.pos[1]} stroke={both ? (active ? '#00CFFF' : 'rgb(0 255 136 / 0.35)') : 'rgb(111 133 128 / 0.25)'} strokeWidth={both ? 0.35 : 0.2} strokeDasharray={both ? undefined : '1 1'} vectorEffect="non-scaling-stroke" style={{ strokeWidth: both ? 1.4 : 1 }} />;
              })}
            </svg>
            {ghosts.map((n) => (
              <div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-dashed border-mute/50 grid place-items-center text-mute text-[10px]" style={{ left: `${n.pos[0]}%`, top: `${n.pos[1]}%` }} title="Sinal desconhecido">?</div>
            ))}
            {known.map((n) => {
              const isSel = sel?.id === n.id;
              const isCon = d.node === n.id;
              return (
                <button key={n.id} onClick={() => selectNode(n.id)} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${n.pos[0]}%`, top: `${n.pos[1]}%` }} aria-label={n.name}>
                  <span className={`block w-5 h-5 rounded-full border-2 transition ${isSel ? 'scale-125' : 'group-hover:scale-110'} ${isCon ? 'animate-pulseDot' : ''}`}
                    style={{ borderColor: SEC_COLOR[n.security], background: `${SEC_COLOR[n.security]}${n.id in d.scanned ? '55' : '18'}`, boxShadow: isSel || isCon ? `0 0 14px ${isCon ? '#00CFFF' : SEC_COLOR[n.security]}` : undefined }} />
                  {isCon && <span className="absolute -inset-2 rounded-full border border-tech/60 animate-ping" />}
                  <span className={`absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap font-mono text-[9px] sm:text-[10px] px-1 rounded bg-void/80 ${isSel || hover === n.id ? 'text-soft' : 'text-mute'}`}>{n.id}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="xl:col-span-2" title={sel?.name ?? 'Selecione um nó'} icon="Server" bodyClass="space-y-3">
          {sel ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="blue">{sel.kind}</Chip>
                <span className="chip" style={{ borderColor: SEC_COLOR[sel.security] + '66', color: SEC_COLOR[sel.security] }}>segurança {sel.security}/5</span>
                <Chip tone="gray">{sel.address}</Chip>
                <Chip tone={toolLv(d, 'secureshell') >= nodeConnectLevel(sel.security) ? 'green' : 'red'} icon="Terminal">SSH nv.{nodeConnectLevel(sel.security)}</Chip>
                {connected && <Chip tone="green" icon="Link">conectado</Chip>}
              </div>
              <p className="text-xs text-soft/80 leading-relaxed"><span className="text-mute">{sel.org} — </span>{sel.desc}</p>
              <div className="flex gap-2 flex-wrap">
                <button className="btn" disabled={busy} onClick={() => execute(`scan ${sel.id}`)}><Icon name="Radar" size={13} />{scanned ? 'Reescanear' : 'Escanear'}</button>
                {!connected ? <button className="btn btn-tech" disabled={busy || !!d.node} onClick={() => execute(`connect ${sel.id}`)}><Icon name="Plug" size={13} />Conectar</button>
                  : <button className="btn btn-warn" disabled={busy} onClick={() => execute('disconnect')}><Icon name="Unplug" size={13} />Desconectar</button>}
                {scanned && <button className="btn btn-ghost" disabled={busy} onClick={() => execute(`inspect ${sel.id}`)}><Icon name="Search" size={13} />Inspecionar</button>}
              </div>
              {scanned ? (
                <>
                  <div>
                    <div className="panel-title mb-1">Serviços</div>
                    <div className="font-mono text-[11px] space-y-0.5">
                      {sel.services.filter((s) => s.state !== 'filtered' || toolLv(d, 'cyberscan') >= 3).map((s) => <div key={s.port} className="flex gap-2"><span className="text-tech w-12">{s.port}</span><span className="w-24 text-soft">{s.name}</span><span className={s.state === 'open' ? 'text-neon' : s.state === 'filtered' ? 'text-warn' : 'text-mute'}>{s.state}</span>{toolLv(d, 'cyberscan') >= 2 && s.vuln && <span className="text-warn truncate">⚠ {s.vuln}</span>}</div>)}
                    </div>
                  </div>
                  <div>
                    <div className="panel-title mb-1">Desafios disponíveis</div>
                    {sel.challenges.length === 0 && <p className="text-xs text-mute font-mono">Nenhum desafio neste nó.</p>}
                    <div className="space-y-1.5">
                      {sel.challenges.map((cid) => {
                        const ch = CHALLENGE_MAP[cid];
                        const dn = d.chDone[cid];
                        const ok = mgSkillOk(d, ch);
                        return (
                          <div key={cid} className="flex items-center gap-2 border border-line rounded px-2 py-1.5">
                            <div className="min-w-0 flex-1"><div className="text-xs text-soft truncate">{ch.name}</div><div className="text-[10px] font-mono text-mute">{MG_NAMES[ch.mg]} · dif {ch.diff}/5 · {ch.reward.money} cr{dn ? ` · ✔ ${dn.best}` : ''}</div></div>
                            <button className="btn !py-1" disabled={busy || !ok || !!useGame.getState().mg} title={!ok ? `Requer ${ch.minSkill?.skill} rank ${ch.minSkill?.rank}` : ''} onClick={() => runChallenge(cid, 'network')}>{ok ? 'Executar' : <Icon name="Lock" size={12} />}</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div><div className="panel-title mb-1">Informações descobertas</div><ul className="text-xs text-soft/80 space-y-0.5">{sel.facts.map((f) => <li key={f}>• {f}</li>)}</ul></div>
                  {connected && <div><div className="panel-title mb-1">Arquivos remotos</div><div className="font-mono text-[11px] text-tech space-y-0.5">{sel.files.map((f) => <div key={f.name}>{f.name}</div>)}</div></div>}
                </>
              ) : <p className="text-xs text-mute font-mono border border-dashed border-line rounded p-3">Escaneie este nó para revelar serviços, desafios e informações.</p>}
            </>
          ) : <p className="text-sm text-mute">Clique em um nó no mapa.</p>}
        </Panel>
      </div>
      <MiniConsole />
    </div>
  );
}
