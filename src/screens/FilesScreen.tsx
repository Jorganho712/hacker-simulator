import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../game/store';
import { baseOf, displayPath, fmtKB, joinPath, listDir, parentOf } from '../game/fsops';
import { Chip, Empty, Icon, Modal, Panel } from '../components/ui';
import { execute } from '../game/terminal/commands';
import MiniConsole from '../components/MiniConsole';
import { fmtMB } from '../game/data/tools';
import { freeMB, storageCapMB, usedMB } from '../game/derived';

export default function FilesScreen() {
  const d = useGame((s) => s.data)!;
  const busy = useGame((s) => s.termBusy);
  const { mkdir, writeFile, removePath, renamePath, movePath, setCwd } = useGame.getState();
  const [dir, setDir] = useState(d.cwd || '/home/user');
  const [sel, setSel] = useState<string | null>(null);
  const [modal, setModal] = useState<null | 'mkdir' | 'note' | 'rename' | 'move' | 'delete'>(null);
  const [text, setText] = useState('');
  const [content, setContent] = useState('');
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState<string | null>(null);
  const [showCon, setShowCon] = useState(false);

  const items = useMemo(() => (d.fs[dir] ? listDir(d.fs, dir) : []), [d.fs, dir]);
  const entry = sel ? d.fs[sel] : null;
  const dirs = Object.entries(d.fs).filter(([, e]) => e.type === 'dir').map(([p]) => p).sort();
  useEffect(() => { if (sel && !d.fs[sel]) setSel(null); if (!d.fs[dir]) setDir('/home/user'); }, [d.fs]);

  const crumbs = dir.split('/').filter(Boolean);
  const done = (r: { ok: boolean; msg: string }) => { if (r.ok) { setModal(null); setErr(''); setText(''); setContent(''); } else setErr(r.msg); return r.ok; };
  const run = (cmd: string) => { setShowCon(true); execute(cmd); };

  return (
    <div className="p-3 sm:p-5 max-w-[1400px] mx-auto space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="font-mono text-lg text-neon tracking-widest uppercase">Arquivos</h1><p className="text-xs text-mute font-mono">Disco: {fmtMB(usedMB(d))} / {fmtMB(storageCapMB(d))} · livre {fmtMB(freeMB(d))}</p></div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn" onClick={() => { setText(''); setErr(''); setModal('mkdir'); }}><Icon name="FolderPlus" size={13} />Nova pasta</button>
          <button className="btn btn-tech" onClick={() => { setText(''); setContent(''); setErr(''); setModal('note'); }}><Icon name="FilePlus" size={13} />Nova nota</button>
        </div>
      </div>
      <div className="grid lg:grid-cols-12 gap-3">
        <Panel title="Pastas" icon="FolderTree" className="lg:col-span-3 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto" bodyClass="!p-1.5">
          {dirs.map((p) => (
            <button key={p} onClick={() => { setDir(p); setSel(null); setCwd(p); }} className={`w-full text-left px-2 py-1 rounded font-mono text-xs flex items-center gap-1.5 hover:bg-white/5 ${dir === p ? 'bg-neon/10 text-neon' : 'text-soft/80'}`} style={{ paddingLeft: 8 + (p === '/' ? 0 : p.split('/').length - 1) * 10 }}>
              <Icon name={dir === p ? 'FolderOpen' : 'Folder'} size={13} />{p === '/' ? '/' : baseOf(p)}
            </button>
          ))}
        </Panel>
        <Panel className="lg:col-span-5" title={<span className="normal-case tracking-normal font-mono text-xs">{displayPath(dir)}</span>} icon="Folder" right={dir !== '/' && <button className="btn btn-ghost !py-0.5" onClick={() => { setDir(parentOf(dir)); setSel(null); }}><Icon name="ArrowUp" size={12} />Subir</button>} bodyClass="!p-0 max-h-[55vh] overflow-y-auto">
          {items.length === 0 ? <Empty icon="FolderOpen" text="Pasta vazia." /> : items.map(({ path, e }) => (
            <button key={path} onClick={() => (e.type === 'dir' ? (setDir(path), setSel(null), setCwd(path)) : setSel(path))} onDoubleClick={() => e.type === 'dir' && setDir(path)}
              className={`w-full flex items-center gap-3 px-3 py-2 border-b border-line/60 text-left hover:bg-white/5 ${sel === path ? 'bg-neon/10' : ''}`}>
              <Icon name={e.type === 'dir' ? 'Folder' : e.encrypted ? 'FileLock2' : e.malicious ? 'FileWarning' : 'FileText'} size={16} className={e.type === 'dir' ? 'text-warn' : e.encrypted ? 'text-tech' : e.malicious ? 'text-alert' : 'text-soft/70'} />
              <span className="flex-1 min-w-0 font-mono text-xs text-soft truncate">{e.name}</span>
              {e.encrypted && <Chip tone="blue">cifrado</Chip>}
              {e.recoverable && <Chip tone="yellow">apagado</Chip>}
              {e.analyzed && <Chip tone="green">analisado</Chip>}
              <span className="text-[10px] font-mono text-mute w-16 text-right">{e.type === 'file' ? fmtKB(e.size) : ''}</span>
            </button>
          ))}
        </Panel>
        <Panel className="lg:col-span-4" title={entry?.name || 'Visualizador'} icon="Eye" bodyClass="space-y-3">
          {!entry ? <Empty icon="FileSearch" text="Selecione um arquivo para visualizar." /> : (
            <>
              <div className="flex gap-1.5 flex-wrap">
                <Chip tone="gray">{fmtKB(entry.size)}</Chip>
                <Chip tone="gray">{new Date(entry.created).toLocaleDateString('pt-BR')}</Chip>
                {entry.readonly && <Chip tone="yellow">somente leitura</Chip>}
                {entry.encrypted && <Chip tone="blue" icon="Lock">cifrado</Chip>}
                {entry.malicious && <Chip tone="red" icon="Bug">suspeito</Chip>}
              </div>
              {edit === sel ? (
                <textarea className="input w-full h-56 text-xs" value={content} onChange={(e) => setContent(e.target.value)} />
              ) : (
                <pre className="bg-void border border-line rounded p-3 text-xs font-mono text-soft/90 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                  {entry.encrypted ? '🔒 Conteúdo cifrado. Use "Descriptografar".' : entry.recoverable ? '⚠ Arquivo apagado/corrompido. Use "recover" com DataRecovery no terminal.' : entry.content || '(vazio)'}
                </pre>
              )}
              <div className="flex gap-1.5 flex-wrap">
                {edit === sel ? (
                  <><button className="btn" onClick={() => { const r = writeFile(sel!, content); if (r.ok) setEdit(null); else setErr(r.msg); }}><Icon name="Save" size={13} />Salvar</button><button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancelar</button></>
                ) : (
                  <>
                    {!entry.readonly && !entry.encrypted && !entry.recoverable && <button className="btn btn-ghost" onClick={() => { setEdit(sel); setContent(entry.content || ''); }}><Icon name="Pencil" size={13} />Editar</button>}
                    {entry.encrypted && <button className="btn btn-tech" disabled={busy} onClick={() => run(`decrypt ${entry.name}`)}><Icon name="KeyRound" size={13} />Descriptografar</button>}
                    {!entry.encrypted && <button className="btn btn-tech" disabled={busy} onClick={() => run(`analyze ${entry.name}`)}><Icon name="Binary" size={13} />Analisar</button>}
                    {entry.recoverable && <button className="btn btn-warn" disabled={busy} onClick={() => run(`recover ${entry.name}`)}><Icon name="HardDriveDownload" size={13} />Recuperar</button>}
                    {!entry.readonly && <button className="btn btn-ghost" onClick={() => { setText(entry.name); setErr(''); setModal('rename'); }}>Renomear</button>}
                    {!entry.readonly && <button className="btn btn-ghost" onClick={() => { setText('/home/user/documents'); setErr(''); setModal('move'); }}>Mover</button>}
                    {!entry.readonly && <button className="btn btn-danger" onClick={() => setModal('delete')}><Icon name="Trash2" size={13} /></button>}
                  </>
                )}
              </div>
              {err && !modal && <div className="text-xs text-alert font-mono">{err}</div>}
            </>
          )}
        </Panel>
      </div>
      {showCon && <MiniConsole />}
      <div className="flex items-center gap-1 text-[11px] font-mono text-mute flex-wrap">{crumbs.length ? crumbs.map((c, i) => <span key={i}>/ {c}</span>) : '/'}</div>

      <Modal open={modal === 'mkdir'} onClose={() => setModal(null)} title="Nova pasta" footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="btn" onClick={() => done(mkdir(joinPath(dir, text.trim())))}>Criar</button></>}>
        <input autoFocus className="input w-full" placeholder="nome da pasta" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && done(mkdir(joinPath(dir, text.trim())))} />
        {err && <p className="text-xs text-alert mt-2 font-mono">{err}</p>}
      </Modal>
      <Modal open={modal === 'note'} onClose={() => setModal(null)} title="Nova nota / relatório" footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="btn" onClick={() => { const n = text.trim(); const r = writeFile(joinPath(dir, n.includes('.') ? n : n + '.txt'), content); done(r); }}>Salvar</button></>}>
        <input autoFocus className="input w-full mb-2" placeholder="nome do arquivo (ex.: pistas.txt)" value={text} onChange={(e) => setText(e.target.value)} />
        <textarea className="input w-full h-40 text-xs" placeholder="Conteúdo…" value={content} onChange={(e) => setContent(e.target.value)} />
        {err && <p className="text-xs text-alert mt-2 font-mono">{err}</p>}
      </Modal>
      <Modal open={modal === 'rename'} onClose={() => setModal(null)} title="Renomear" footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="btn" onClick={() => { const r = renamePath(sel!, text.trim()); if (r.ok) setSel(joinPath(parentOf(sel!), text.trim())); done(r); }}>Renomear</button></>}>
        <input autoFocus className="input w-full" value={text} onChange={(e) => setText(e.target.value)} />
        {err && <p className="text-xs text-alert mt-2 font-mono">{err}</p>}
      </Modal>
      <Modal open={modal === 'move'} onClose={() => setModal(null)} title="Mover para…" footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="btn" onClick={() => { const r = movePath(sel!, text); if (r.ok) setSel(null); done(r); }}>Mover</button></>}>
        <select className="input w-full" value={text} onChange={(e) => setText(e.target.value)}>{dirs.map((p) => <option key={p} value={p}>{displayPath(p)}</option>)}</select>
        {err && <p className="text-xs text-alert mt-2 font-mono">{err}</p>}
      </Modal>
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Excluir item?" footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => { done(removePath(sel!)); setSel(null); }}>Excluir</button></>}>
        <p className="text-sm text-soft/90">Excluir <b>{entry?.name}</b> libera espaço em disco, mas não pode ser desfeito.</p>
      </Modal>
    </div>
  );
}
