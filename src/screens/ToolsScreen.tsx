import { useState } from 'react';
import { useGame } from '../game/store';
import { TOOLS, toolPrice } from '../game/data/tools';
import { toolLv } from '../game/derived';
import { Bar, Chip, Icon, Panel } from '../components/ui';
import type { ToolCategory } from '../game/types';

const CATS: ('Todas' | ToolCategory)[] = ['Todas', 'Diagnóstico', 'Análise', 'Criptografia', 'Monitoramento', 'Forense digital', 'Segurança', 'Administração de sistemas'];

export default function ToolsScreen() {
  const d = useGame((s) => s.data)!;
  const setScreen = useGame((s) => s.setScreen);
  const [cat, setCat] = useState<(typeof CATS)[number]>('Todas');
  const [sel, setSel] = useState<string>(TOOLS[0].id);
  const list = TOOLS.filter((t) => cat === 'Todas' || t.category === cat);
  const tool = TOOLS.find((t) => t.id === sel) ?? TOOLS[0];
  const lv = toolLv(d, tool.id);
  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto">
      <div className="mb-4"><h1 className="font-mono text-lg text-neon tracking-widest uppercase">Ferramentas</h1><p className="text-xs text-mute font-mono">Seu inventário de software de cibersegurança — usado em missões, terminal e minigames.</p></div>
      <div className="flex gap-1 flex-wrap mb-4">{CATS.map((c) => <button key={c} className={`btn ${cat === c ? '' : 'btn-ghost'}`} onClick={() => setCat(c)}>{c}</button>)}</div>
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 grid sm:grid-cols-2 gap-3 content-start">
          {list.map((t) => {
            const l = toolLv(d, t.id);
            return (
              <button key={t.id} onClick={() => setSel(t.id)} className={`panel p-3 text-left transition hover:border-neon/50 ${sel === t.id ? '!border-neon shadow-neonsm' : ''} ${l === 0 ? 'opacity-75' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded grid place-items-center border ${l ? 'bg-neon/10 border-neon/40 text-neon' : 'bg-line border-line text-mute'}`}><Icon name={t.icon} size={22} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-soft font-medium">{t.name}</div>
                    <div className="text-[10px] text-mute font-mono uppercase">{t.category}</div>
                    <div className="mt-1 flex gap-0.5">{Array.from({ length: t.maxLevel }).map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-sm ${i < l ? 'bg-neon' : 'bg-line'}`} />)}</div>
                  </div>
                  <Chip tone={l ? 'green' : 'gray'}>{l ? `nv.${l}` : 'não possui'}</Chip>
                </div>
              </button>
            );
          })}
        </div>
        <Panel title={tool.name} icon={tool.icon} className="lg:col-span-2 h-fit" bodyClass="space-y-3">
          <p className="text-sm text-soft/90">{tool.desc}</p>
          <div className="flex gap-2 flex-wrap"><Chip tone="blue">{tool.category}</Chip><Chip tone={lv ? 'green' : 'gray'}>nível {lv}/{tool.maxLevel}</Chip><Chip tone="yellow">nível {tool.levelReq}+</Chip></div>
          <Bar value={lv} max={tool.maxLevel} label="Evolução" right={`${lv}/${tool.maxLevel}`} />
          <div className="space-y-1.5">
            {tool.features.map((f, i) => (
              <div key={i} className={`flex gap-2 text-sm ${i < lv ? 'text-soft' : 'text-mute'}`}>
                <Icon name={i < lv ? 'CircleCheck' : 'Circle'} size={14} className={`mt-0.5 shrink-0 ${i < lv ? 'text-neon' : ''}`} />
                <span><span className="font-mono text-[11px] text-tech mr-1">nv.{i + 1}</span>{f[0]}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] font-mono text-mute space-y-0.5">
            <div>Requer SO tier {tool.osReq}+ · RAM tier {tool.ramReq}+ · nível {tool.levelReq}</div>
            {lv < tool.maxLevel && <div>Próximo nível: <span className="text-warn">{toolPrice(tool, lv + 1)} cr</span></div>}
          </div>
          <button className="btn" onClick={() => setScreen('market')}><Icon name="ShoppingCart" size={13} />{lv === 0 ? 'Ir ao Mercado' : lv < tool.maxLevel ? 'Melhorar no Mercado' : 'Nível máximo'}</button>
        </Panel>
      </div>
    </div>
  );
}
