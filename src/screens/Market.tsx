import { useState } from 'react';
import { useGame } from '../game/store';
import { SHOP, SHOP_CATS, TOOL_MAP } from '../game/data/tools';
import type { ShopCategory, ShopItem } from '../game/types';
import { itemPrice, salePct, toolLv } from '../game/derived';
import { Chip, Icon, money } from '../components/ui';

function status(d: NonNullable<ReturnType<typeof useGame.getState>['data']>, it: ShopItem): { state: 'owned' | 'ok' | 'locked'; reason?: string } {
  if (it.kind === 'hw' && it.hw) {
    const cur = d.hw[it.hw.slot];
    if (it.hw.tier <= cur) return { state: 'owned' };
    if (it.hw.tier > cur + 1) return { state: 'locked', reason: 'Compre o nível anterior' };
  }
  if (it.once && d.inv.includes(it.id)) return { state: 'owned' };
  if (it.kind === 'tool' && it.toolId) {
    const t = TOOL_MAP[it.toolId];
    const lv = toolLv(d, t.id);
    if (lv >= t.maxLevel) return { state: 'owned' };
    if (lv === 0 && d.level < t.levelReq) return { state: 'locked', reason: `Nível ${t.levelReq}` };
    if (d.hw.os < t.osReq) return { state: 'locked', reason: `SO tier ${t.osReq}` };
    if (d.hw.ram < t.ramReq) return { state: 'locked', reason: 'Mais RAM' };
  }
  if (it.levelReq && d.level < it.levelReq) return { state: 'locked', reason: `Nível ${it.levelReq}` };
  if (it.repReq && d.rep < it.repReq) return { state: 'locked', reason: `Reputação ${it.repReq}` };
  return { state: 'ok' };
}

export default function Market() {
  const d = useGame((s) => s.data)!;
  const buy = useGame((s) => s.buy);
  const equip = useGame((s) => s.equip);
  const [cat, setCat] = useState<ShopCategory>('Ferramentas');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const items = SHOP.filter((i) => i.cat === cat);

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="font-mono text-lg text-neon tracking-widest uppercase">Mercado</h1>
          <p className="text-xs text-mute font-mono">Hardware, software, ferramentas, cursos e melhorias — preços em créditos.</p>
        </div>
        <div className="panel px-4 py-2 font-mono text-warn flex items-center gap-2"><Icon name="Coins" size={16} />{money(d.money)}</div>
      </div>
      <div className="flex gap-1 flex-wrap mb-4">
        {SHOP_CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`btn ${cat === c ? '' : 'btn-ghost'}`}>{c}</button>
        ))}
      </div>
      {msg && <div className={`mb-3 text-xs font-mono px-3 py-2 rounded border ${msg.ok ? 'border-neon/40 text-neon bg-neon/5' : 'border-alert/40 text-alert bg-alert/5'}`}>{msg.t}</div>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((it) => {
          const st = status(d, it);
          const price = itemPrice(d, it);
          const sale = salePct(d, it.id);
          const tool = it.toolId ? TOOL_MAP[it.toolId] : null;
          const lv = tool ? toolLv(d, tool.id) : 0;
          const canAfford = d.money >= price;
          const equipable = st.state === 'owned' && it.kind === 'cosmetic' && it.effect;
          return (
            <div key={it.id} className={`panel p-3 flex flex-col gap-2 ${st.state === 'owned' ? 'border-neon/30' : ''} ${st.state === 'locked' ? 'opacity-70' : ''}`}>
              <div className="flex gap-3">
                <div className="w-11 h-11 shrink-0 rounded bg-neon/10 border border-neon/30 grid place-items-center text-neon"><Icon name={it.icon} size={20} /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-soft font-medium">{it.name}{tool && lv > 0 && <span className="ml-2 text-[11px] font-mono text-neon">nv.{lv}→{Math.min(lv + 1, tool.maxLevel)}</span>}</div>
                  <p className="text-[12px] text-mute leading-snug">{it.desc}</p>
                </div>
              </div>
              <ul className="text-[11px] text-soft/80 font-mono space-y-0.5">
                {(tool ? tool.features[Math.min(lv, tool.maxLevel - 1)] : it.benefits).map((b) => <li key={b}><span className="text-neon">+</span> {b}</li>)}
              </ul>
              <div className="flex flex-wrap gap-1.5">
                {it.levelReq ? <Chip tone={d.level >= it.levelReq ? 'green' : 'red'}>Nível {it.levelReq}</Chip> : null}
                {it.repReq ? <Chip tone={d.rep >= it.repReq ? 'green' : 'red'}>Rep {it.repReq}</Chip> : null}
                {tool && tool.osReq > 0 && <Chip tone={d.hw.os >= tool.osReq ? 'green' : 'red'}>SO {tool.osReq}+</Chip>}
                {tool && tool.ramReq > 0 && <Chip tone={d.hw.ram >= tool.ramReq ? 'green' : 'red'}>RAM tier {tool.ramReq}+</Chip>}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <div className="font-mono">
                  {st.state === 'owned' && !(tool && lv < tool.maxLevel) ? <span className="text-neon text-sm flex items-center gap-1"><Icon name="CircleCheck" size={14} />{tool ? 'Nível máximo' : 'Adquirido'}</span> : (
                    <span className={`text-base ${canAfford ? 'text-warn' : 'text-alert'}`}>{sale > 0 && <s className="text-mute text-xs mr-1">{it.price}</s>}{price} cr{sale > 0 && <span className="ml-1 text-[10px] text-neon">-{sale * 100}%</span>}</span>
                  )}
                </div>
                {equipable ? <button className="btn btn-ghost" onClick={() => equip(it.id)}>Equipar</button> : (st.state === 'owned' && !(tool && lv < tool.maxLevel)) ? null : (
                  <button className="btn" disabled={st.state === 'locked' || (st.state === 'owned' && !(tool && lv < (tool?.maxLevel ?? 0))) || !canAfford}
                    title={st.reason} onClick={() => { const r = buy(it.id); setMsg({ ok: r.ok, t: r.msg }); }}>
                    {st.state === 'locked' ? <><Icon name="Lock" size={12} />{st.reason}</> : lv > 0 && tool && lv < tool.maxLevel ? 'Melhorar' : 'Comprar'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
