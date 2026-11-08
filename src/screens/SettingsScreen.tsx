import { useState } from 'react';
import { SLOTS, useGame } from '../game/store';
import { Icon, Modal, Panel } from '../components/ui';
import SettingsPanel from '../components/SettingsPanel';
import SaveManager from '../components/SaveManager';
import { t } from '../i18n';

export default function SettingsScreen() {
  const lang = useGame((s) => s.settings.lang);
  const [confirm, setConfirm] = useState(false);
  const [word, setWord] = useState('');
  const reset = () => {
    SLOTS.forEach((s) => useGame.getState().deleteSlot(s));
    useGame.setState({ data: null, phase: 'menu', term: [] });
  };
  return (
    <div className="p-3 sm:p-5 max-w-[1100px] mx-auto space-y-4">
      <h1 className="font-mono text-lg text-neon tracking-widest uppercase">{t('nav.settings', lang)}</h1>
      <Panel title="Preferências" icon="SlidersHorizontal"><SettingsPanel /></Panel>
      <Panel title="Salvamento" icon="Save" bodyClass="space-y-3">
        <p className="text-xs text-mute font-mono">O jogo salva automaticamente a cada ação importante e ao fechar a aba. Use os slots 1–3 para pontos de restauração e exporte/importe saves em JSON.</p>
        <SaveManager mode="game" />
      </Panel>
      <Panel title={t('set.reset', lang)} icon="TriangleAlert" bodyClass="space-y-2">
        <p className="text-sm text-soft/90">Apaga <b>todos</b> os saves (AUTO e slots 1–3) e volta ao menu principal. Exporte um JSON antes se quiser guardar uma cópia.</p>
        <button className="btn btn-danger" onClick={() => { setWord(''); setConfirm(true); }}><Icon name="Trash2" size={13} />{t('set.reset', lang)}</button>
      </Panel>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Apagar todo o progresso?" footer={<><button className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancelar</button><button className="btn btn-danger" disabled={word.toUpperCase() !== 'APAGAR'} onClick={reset}>Apagar tudo</button></>}>
        <p className="text-sm text-soft/90 mb-3">Esta ação é <b>irreversível</b>. Digite <span className="font-mono text-alert">APAGAR</span> para confirmar.</p>
        <input autoFocus className="input w-full" value={word} onChange={(e) => setWord(e.target.value)} />
      </Modal>
    </div>
  );
}
