import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { CONTACTS, DIALOGUE_MAP } from '../game/data/contacts';
import { Avatar, Chip, Empty, Icon, Panel } from '../components/ui';
import { fmtGameTime } from '../game/state';
import { MISSION_MAP } from '../game/data/missions';

const RELATED: Record<string, string[]> = {
  morpheus: ['M-001', 'M-004', 'M-006', 'M-014', 'M-016', 'M-018', 'M-019', 'M-020'],
  nova: ['M-002', 'M-003', 'M-005', 'M-008', 'M-015', 'M-017'],
  ghost: ['M-007', 'M-013'],
  vanta: ['M-010', 'M-012', 'M-018'],
};

export default function Contacts() {
  const d = useGame((s) => s.data)!;
  const choose = useGame((s) => s.choose);
  const markRead = useGame((s) => s.markRead);
  const [sel, setSel] = useState<string>(() => {
    const withNew = CONTACTS.find((c) => d.contactsUnlocked.includes(c.id) && (d.threads[c.id] || []).some((m) => m.from === 'them' && !m.read));
    return withNew?.id || 'morpheus';
  });
  const end = useRef<HTMLDivElement>(null);
  const unlocked = CONTACTS.filter((c) => d.contactsUnlocked.includes(c.id));
  const c = CONTACTS.find((x) => x.id === sel)!;
  const thread = d.threads[sel] || [];
  const pendingId = d.pending[sel];
  const node = pendingId ? DIALOGUE_MAP[pendingId] : null;
  const revealed = sel !== 'morpheus' || !!d.flags.morpheus_revealed;
  const displayName = revealed ? c.name : '???';

  useEffect(() => { useGame.setState({ helpFocus: sel }); markRead(sel); return () => useGame.setState({ helpFocus: null }); }, [sel, thread.length]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [thread.length, pendingId, sel]);

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto h-full flex flex-col">
      <div className="mb-3"><h1 className="font-mono text-lg text-neon tracking-widest uppercase">Contatos</h1><p className="text-xs text-mute font-mono">Mensagens e decisões moldam a história e os contratos que chegam até você.</p></div>
      <div className="grid lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-3 space-y-2 lg:overflow-y-auto">
          {CONTACTS.map((x) => {
            const open = d.contactsUnlocked.includes(x.id);
            const unread = (d.threads[x.id] || []).filter((m) => m.from === 'them' && !m.read).length;
            const nm = x.id === 'morpheus' && !d.flags.morpheus_revealed ? '???' : x.name;
            return (
              <button key={x.id} disabled={!open} onClick={() => setSel(x.id)} className={`w-full panel p-2.5 flex items-center gap-3 text-left transition ${sel === x.id ? '!border-neon shadow-neonsm' : 'hover:border-mute'} ${!open ? 'opacity-40' : ''}`}>
                <Avatar glyph={open ? nm[0] : '?'} color={open ? x.color : '#6F8580'} size={38} />
                <div className="min-w-0 flex-1"><div className="font-mono text-sm text-soft">{open ? nm : 'Contato bloqueado'}</div><div className="text-[11px] text-mute truncate">{open ? x.specialty : 'Avance na história'}</div></div>
                {unread > 0 && <span className="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-tech/20 border border-tech/60 text-[10px] text-tech font-mono">{unread}</span>}
              </button>
            );
          })}
        </div>

        <Panel className="lg:col-span-6 min-h-[420px]" bodyClass="!p-0 flex flex-col" title={<span className="flex items-center gap-2"><Icon name="MessageSquare" size={13} className="text-neon" />{displayName}</span>} right={<span className="text-[10px] font-mono text-mute">{revealed ? c.handle : '[anônimo]'}</span>}>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[260px] max-h-[56vh] lg:max-h-none">
            {thread.length === 0 && <Empty icon="MessageSquareDashed" text="Sem mensagens ainda." />}
            {thread.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap border ${m.from === 'me' ? 'bg-neon/10 border-neon/30 text-soft' : 'bg-white/[0.03] border-line text-soft/90'}`}
                  style={m.from === 'them' ? { borderColor: `${c.color}44` } : undefined}>
                  {m.text}
                  <div className="text-[10px] font-mono text-mute mt-1">{fmtGameTime(m.ts).time}</div>
                </div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <div className="border-t border-line p-3 space-y-2 bg-ink/60">
            {node?.choices ? (
              <>
                <div className="panel-title">Escolha sua resposta</div>
                {node.choices.map((ch, i) => (
                  <button key={i} className="btn w-full !justify-start !normal-case !tracking-normal text-left !text-sm" onClick={() => choose(sel, i)}>
                    <Icon name="CornerDownRight" size={14} className="shrink-0" /><span className="text-left">{ch.text}</span>
                    {ch.offer && <Chip tone="yellow">nova missão</Chip>}
                  </button>
                ))}
              </>
            ) : <div className="text-xs font-mono text-mute flex items-center gap-2"><Icon name="Clock" size={13} />Nenhuma resposta pendente. Novas mensagens chegam conforme você progride.</div>}
          </div>
        </Panel>

        <Panel className="lg:col-span-3 h-fit" title="Dossiê" icon="IdCard" bodyClass="space-y-3">
          <div className="flex items-center gap-3"><Avatar glyph={displayName[0]} color={c.color} size={54} /><div><div className="font-mono text-soft">{displayName}</div><div className="text-[11px] text-mute">{revealed ? c.specialty : 'Identidade desconhecida'}</div></div></div>
          {revealed && <p className="text-xs text-soft/80 leading-relaxed">{c.bio}</p>}
          <div><div className="panel-title mb-1">Personalidade</div><p className="text-xs text-mute">{revealed ? c.personality : 'Direto, anônimo e cuidadoso.'}</p></div>
          <div><div className="panel-title mb-1">Confiança</div><div className="font-mono text-sm text-tech">{(d.trust[sel] || 0) >= 0 ? '+' : ''}{d.trust[sel] || 0}</div></div>
          <div>
            <div className="panel-title mb-1">Missões relacionadas</div>
            <div className="flex flex-wrap gap-1">
              {RELATED[sel].map((id) => <Chip key={id} tone={d.missions[id]?.status === 'completed' ? 'green' : 'gray'} icon={d.missions[id]?.status === 'completed' ? 'Check' : undefined}>{MISSION_MAP[id] ? id : id}</Chip>)}
            </div>
          </div>
        </Panel>
      </div>
      {unlocked.length < 4 && <p className="text-[11px] text-mute font-mono mt-2">Novos contatos aparecem ao concluir missões.</p>}
    </div>
  );
}
