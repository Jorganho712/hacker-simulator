import { useGame } from '../game/store';
import { SKILLS, skillCost } from '../game/data/progression';
import { Chip, Icon, Panel } from '../components/ui';

export default function Skills() {
  const d = useGame((s) => s.data)!;
  const spend = useGame((s) => s.spendSkill);
  const total = Object.values(d.skills).reduce((a, b) => a + b, 0);
  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-mono text-lg text-neon tracking-widest uppercase">Habilidades</h1><p className="text-xs text-mute font-mono">Ganhe 1 ponto por nível. Cada rank custa mais pontos que o anterior — escolha seu caminho.</p></div>
        <div className="panel px-4 py-2 font-mono flex items-center gap-3"><Icon name="Sparkles" size={16} className="text-warn" /><span className="text-warn text-lg">{d.skillPoints}</span><span className="text-xs text-mute">pontos disponíveis</span></div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SKILLS.map((s) => {
          const r = d.skills[s.id];
          const cost = skillCost(r);
          return (
            <Panel key={s.id} title={s.name} icon={s.icon} right={r >= 5 ? <Chip tone="yellow" icon="Crown">{s.spec}</Chip> : <Chip tone="gray">rank {r}/5</Chip>} bodyClass="space-y-3">
              <p className="text-sm text-mute">{s.desc}</p>
              <ol className="space-y-1.5">
                {s.ranks.map((t, i) => (
                  <li key={i} className={`flex gap-2 text-xs ${i < r ? 'text-soft' : i === r ? 'text-soft/80' : 'text-mute'}`}>
                    <span className={`w-5 h-5 shrink-0 grid place-items-center rounded-sm border font-mono text-[10px] ${i < r ? 'border-neon bg-neon/20 text-neon' : 'border-line'}`}>{i + 1}</span>
                    <span className="pt-0.5">{t}</span>
                  </li>
                ))}
              </ol>
              {r >= 5 && <div className="text-xs text-warn font-mono border border-warn/30 rounded p-2 bg-warn/5">★ Especialização: {s.specDesc}</div>}
              <button className="btn w-full" disabled={r >= 5 || d.skillPoints < cost} onClick={() => spend(s.id)}>
                {r >= 5 ? 'Rank máximo' : `Evoluir para rank ${r + 1} (${cost} pt${cost > 1 ? 's' : ''})`}
              </button>
            </Panel>
          );
        })}
      </div>
      <p className="text-xs text-mute font-mono">Pontos investidos: {total}. Cursos no Mercado concedem pontos extras.</p>
    </div>
  );
}
