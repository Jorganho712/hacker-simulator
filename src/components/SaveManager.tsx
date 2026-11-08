import { useRef, useState } from 'react';
import { SLOTS, listSaves, useGame } from '../game/store';
import { Icon, Modal } from './ui';

export const fmtPlay = (s: number) => `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;

export default function SaveManager({ mode, onLoaded }: { mode: 'menu' | 'game'; onLoaded?: () => void }) {
  const [tick, setTick] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { loadSlot, saveSlot, deleteSlot, exportSave, importSave, data } = useGame();
  const saves = listSaves();
  void tick;

  const download = () => {
    const json = exportSave();
    if (!json) return setMsg({ ok: false, text: 'Nenhum jogo ativo para exportar.' });
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hacker-simulator-${data?.name || 'save'}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setMsg({ ok: true, text: 'Save exportado em JSON.' });
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    const text = await f.text();
    const ok = importSave(text);
    setMsg({ ok, text: ok ? 'Save importado com sucesso!' : 'Arquivo inválido: não é um save do Hacker Simulator.' });
    if (ok) onLoaded?.();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {SLOTS.map((slot) => {
          const s = saves.find((x) => x.slot === slot);
          return (
            <div key={slot} className="panel p-3 flex items-center gap-3 flex-wrap">
              <div className="grid place-items-center w-9 h-9 rounded bg-neon/10 border border-neon/30 text-neon font-mono text-xs">{slot === 'auto' ? 'AUTO' : `#${slot}`}</div>
              <div className="flex-1 min-w-[160px]">
                {s ? (
                  <>
                    <div className="font-mono text-sm text-soft">{s.name} <span className="text-mute">· nível {s.level}</span></div>
                    <div className="text-[11px] text-mute font-mono">{s.money} cr · rep {s.rep} · {s.missions} missões · {fmtPlay(s.playSeconds)} · {new Date(s.savedAt).toLocaleString('pt-BR')}</div>
                  </>
                ) : <div className="text-mute text-sm font-mono">— slot vazio —</div>}
              </div>
              <div className="flex gap-2">
                {mode === 'game' && slot !== 'auto' && <button className="btn" onClick={() => { const ok = saveSlot(slot); setTick((t) => t + 1); setMsg({ ok, text: ok ? `Progresso salvo no slot ${slot}.` : 'Falha ao salvar.' }); }}><Icon name="Save" size={13} />Salvar</button>}
                {s && <button className="btn btn-tech" onClick={() => { const ok = loadSlot(slot); if (ok) onLoaded?.(); else setMsg({ ok: false, text: 'Save corrompido.' }); }}><Icon name="FolderOpen" size={13} />Carregar</button>}
                {s && <button className="btn btn-danger" onClick={() => setConfirmDel(slot)} aria-label="Apagar"><Icon name="Trash2" size={13} /></button>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 flex-wrap">
        {mode === 'game' && <button className="btn btn-tech" onClick={download}><Icon name="Download" size={13} />Exportar JSON</button>}
        <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}><Icon name="Upload" size={13} />Importar JSON</button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {msg && <div className={`text-xs font-mono ${msg.ok ? 'text-neon' : 'text-alert'}`}>{msg.text}</div>}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Apagar save?" footer={<><button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => { deleteSlot(confirmDel!); setConfirmDel(null); setTick((t) => t + 1); }}>Apagar definitivamente</button></>}>
        <p className="text-sm text-soft/90">Esta ação remove o progresso do slot <b>{confirmDel}</b> e <b>não pode ser desfeita</b>.</p>
      </Modal>
    </div>
  );
}
