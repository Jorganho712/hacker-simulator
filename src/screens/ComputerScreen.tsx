import { useGame } from '../game/store';
import { Bar, Chip, Icon, Panel, Sparkline } from '../components/ui';
import { CPU_TIERS, HW_LABEL, HW_TABLES, NIC_TIERS, OS_TIERS, RAM_TIERS, STORAGE_TIERS } from '../game/data/hardware';
import { cpuSpeed, freeMB, isOverheated, netSpeed, storageCapMB, usedMB, ramMB } from '../game/derived';
import { fmtMB, SHOP } from '../game/data/tools';
import type { Hardware } from '../game/types';

const ICONS: Record<keyof Hardware, string> = { cpu: 'Cpu', ram: 'MemoryStick', storage: 'HardDrive', nic: 'Wifi', os: 'MonitorCog' };

export default function ComputerScreen() {
  const d = useGame((s) => s.data)!;
  const m = useGame((s) => s.metrics);
  const repair = useGame((s) => s.repair);
  const setScreen = useGame((s) => s.setScreen);
  const hot = isOverheated(d);
  const used = usedMB(d);
  const cap = storageCapMB(d);
  const cpu = m.cpu[m.cpu.length - 1];
  const ram = m.ram[m.ram.length - 1];
  const slots = ['cpu', 'ram', 'storage', 'nic', 'os'] as (keyof Hardware)[];
  const tiers = { cpu: CPU_TIERS, ram: RAM_TIERS, storage: STORAGE_TIERS, nic: NIC_TIERS, os: OS_TIERS };

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="font-mono text-lg text-neon tracking-widest uppercase">Meu computador</h1><p className="text-xs text-mute font-mono">{OS_TIERS[d.hw.os].name} · sessão {d.name}@{d.promptName.split('@')[1]}</p></div>
        {hot && <div className="flex items-center gap-2"><Chip tone="red" icon="Thermometer">SUPERAQUECIMENTO</Chip><button className="btn btn-warn" onClick={() => repair()}>Reparar (60 cr)</button></div>}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Processador" icon="Cpu">
          <div className="text-sm text-soft mb-1">{CPU_TIERS[d.hw.cpu].name}</div>
          <div className="text-[11px] font-mono text-mute mb-2">{CPU_TIERS[d.hw.cpu].spec} · velocidade <span className="text-neon">x{cpuSpeed(d).toFixed(2)}</span>{hot && <span className="text-alert"> (reduzida)</span>}</div>
          <Sparkline data={m.cpu} h={64} />
          <Bar value={cpu} label="Uso de CPU" right={`${cpu.toFixed(0)}%`} />
          <div className="mt-2 flex items-center justify-between font-mono text-xs"><span className="text-mute">Temperatura</span><span className={m.temp > 62 ? 'text-alert' : m.temp > 52 ? 'text-warn' : 'text-neon'}>{m.temp.toFixed(0)}°C</span></div>
          <Bar value={m.temp - 25} max={70} color={m.temp > 62 ? '#FF3B3B' : m.temp > 52 ? '#FFC857' : 'rgb(var(--accent))'} h={4} />
        </Panel>
        <Panel title="Memória RAM" icon="MemoryStick">
          <div className="text-sm text-soft mb-1">{RAM_TIERS[d.hw.ram].name}</div>
          <div className="text-[11px] font-mono text-mute mb-2">{RAM_TIERS[d.hw.ram].spec}</div>
          <Sparkline data={m.ram} color="#00CFFF" h={64} />
          <Bar value={ram} label="Uso de RAM" right={`${fmtMB((ram / 100) * ramMB(d))} / ${fmtMB(ramMB(d))}`} color="#00CFFF" />
        </Panel>
        <Panel title="Armazenamento" icon="HardDrive">
          <div className="text-sm text-soft mb-1">{STORAGE_TIERS[d.hw.storage].name}{d.inv.includes('up_backup') && <span className="text-mute"> + backup 4 GB</span>}</div>
          <div className="text-[11px] font-mono text-mute mb-2">{STORAGE_TIERS[d.hw.storage].spec}</div>
          <div className="relative w-28 h-28 mx-auto my-2">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#172126" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#FFC857" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(used / cap) * 100} 100`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center font-mono text-sm text-warn">{Math.round((used / cap) * 100)}%</div>
          </div>
          <div className="text-center font-mono text-xs text-mute">{fmtMB(used)} usados · <span className="text-neon">{fmtMB(freeMB(d))} livres</span></div>
        </Panel>
      </div>

      <Panel title="Componentes e upgrades" icon="Wrench" right={<button className="btn" onClick={() => setScreen('market')}><Icon name="ShoppingCart" size={13} />Mercado</button>}>
        <div className="space-y-4">
          {slots.map((slot) => {
            const list = tiers[slot];
            const cur = d.hw[slot];
            return (
              <div key={slot}>
                <div className="flex items-center gap-2 mb-2"><Icon name={ICONS[slot]} size={15} className="text-neon" /><span className="panel-title">{HW_LABEL[slot]}</span>
                  <span className="text-[11px] font-mono text-mute ml-auto">{slot === 'cpu' ? 'afeta o tempo de tarefas e a capacidade de recursos' : slot === 'ram' ? 'capacidade do gerenciador de recursos e ferramentas' : slot === 'storage' ? 'espaço para downloads e arquivos' : slot === 'nic' ? 'velocidade de scans e downloads' : 'desbloqueia comandos e ferramentas'}</span></div>
                <div className="grid grid-cols-5 gap-1.5">
                  {list.map((t, i) => {
                    const item = SHOP.find((s) => s.hw?.slot === slot && s.hw.tier === i);
                    return (
                      <div key={i} className={`rounded border p-2 text-center transition ${i === cur ? 'border-neon bg-neon/10 shadow-neonsm' : i < cur ? 'border-line bg-white/[0.02] opacity-70' : i === cur + 1 ? 'border-warn/40 border-dashed' : 'border-line opacity-40'}`}>
                        <div className="text-[10px] font-mono text-soft leading-tight min-h-[28px]">{t.name}</div>
                        <div className="text-[10px] font-mono mt-1 text-mute">{i === cur ? 'INSTALADO' : i < cur ? 'antigo' : i === cur + 1 && item ? `${item.price} cr` : '—'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid md:grid-cols-3 gap-4">
        <Panel title="Efeitos ativos" icon="Zap" bodyClass="space-y-2 text-xs font-mono">
          <div>Rede: <span className="text-neon">x{netSpeed(d)}</span> (scans e downloads)</div>
          <div>CPU: <span className="text-neon">x{cpuSpeed(d).toFixed(2)}</span> {d.inv.includes('up_overclock') && <Chip tone="green">overclock</Chip>}</div>
          <div>Gerenciador de recursos: {d.hw.os >= 1 ? <span className="text-neon">disponível</span> : <span className="text-alert">requer CyberCore OS</span>}</div>
          <div>Monitor (comando): {d.hw.os >= 1 ? <span className="text-neon">disponível</span> : <span className="text-alert">requer CyberCore OS</span>}</div>
        </Panel>
        <Panel title="Melhorias instaladas" icon="PackageCheck" bodyClass="flex flex-wrap gap-1.5 content-start">
          {d.inv.filter((i) => !i.startsWith('hw_') && !i.startsWith('course_')).map((i) => <Chip key={i} tone="green">{SHOP.find((s) => s.id === i)?.name ?? i}</Chip>)}
          {!d.inv.filter((i) => !i.startsWith('hw_') && !i.startsWith('course_')).length && <span className="text-xs text-mute font-mono">Nenhuma melhoria extra instalada.</span>}
        </Panel>
        <Panel title="Seu setup" icon="Gauge" bodyClass="space-y-1 text-xs font-mono text-mute">
          {slots.map((s) => <div key={s} className="flex justify-between"><span>{HW_LABEL[s]}</span><span className="text-soft">{HW_TABLES[s][d.hw[s]].name}</span></div>)}
        </Panel>
      </div>
    </div>
  );
}
