import { useGame } from '../game/store';
import { LANGS, t } from '../i18n';
import { audio } from '../game/audio';
import { Icon } from './ui';

function Toggle({ on, set, label, hint }: { on: boolean; set: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => set(!on)} className="w-full flex items-center justify-between gap-3 py-2 text-left group">
      <span><span className="text-sm text-soft">{label}</span>{hint && <span className="block text-[11px] text-mute">{hint}</span>}</span>
      <span className={`w-10 h-5 rounded-full border transition relative shrink-0 ${on ? 'bg-neon/25 border-neon' : 'bg-line border-line'}`}>
        <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${on ? 'left-5 bg-neon shadow-neonsm' : 'left-0.5 bg-mute'}`} />
      </span>
    </button>
  );
}
function Slider({ value, set, label, disabled }: { value: number; set: (v: number) => void; label: string; disabled?: boolean }) {
  return (
    <label className={`block py-2 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex justify-between text-sm text-soft"><span>{label}</span><span className="font-mono text-xs text-mute">{Math.round(value * 100)}%</span></div>
      <input type="range" min={0} max={1} step={0.05} value={value} disabled={disabled} onChange={(e) => set(+e.target.value)} className="w-full accent-[rgb(var(--accent))]" />
    </label>
  );
}

export default function SettingsPanel() {
  const s = useGame((x) => x.settings);
  const up = useGame((x) => x.updateSettings);
  const inv = useGame((x) => x.data?.inv ?? []);
  const lang = s.lang;
  const themes: { id: typeof s.theme; name: string; color: string; own: boolean }[] = [
    { id: 'matrix', name: 'Matrix', color: '#00FF88', own: true },
    { id: 'cobalt', name: 'Cobalto', color: '#00CFFF', own: inv.includes('cos_theme_cobalt') },
    { id: 'amber', name: 'Âmbar', color: '#FFC857', own: inv.includes('cos_theme_amber') },
    { id: 'crimson', name: 'Carmesim', color: '#FF5B6B', own: inv.includes('cos_theme_crimson') },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-x-8">
      <div>
        <h4 className="panel-title mb-1 mt-2">Áudio</h4>
        <Toggle on={s.sfx} set={(v) => { up({ sfx: v }); audio.unlock(); audio.play('click'); }} label={t('set.sfx', lang)} />
        <Slider value={s.sfxVolume} set={(v) => { up({ sfxVolume: v }); audio.play('notify'); }} label={t('set.sfxVolume', lang)} disabled={!s.sfx} />
        <Toggle on={s.music} set={(v) => { audio.unlock(); up({ music: v }); }} label={t('set.music', lang)} hint="Trilha tecnológica discreta (só toca após sua interação)." />
        <Slider value={s.musicVolume} set={(v) => up({ musicVolume: v })} label={t('set.musicVolume', lang)} disabled={!s.music} />
        <h4 className="panel-title mb-1 mt-4">Visual</h4>
        <Toggle on={s.fx} set={(v) => up({ fx: v })} label={t('set.fx', lang)} />
        <Toggle on={s.glow} set={(v) => up({ glow: v })} label={t('set.glow', lang)} />
        <Toggle on={s.animations} set={(v) => up({ animations: v })} label={t('set.animations', lang)} />
        <Toggle on={s.reduceMotion} set={(v) => up({ reduceMotion: v })} label={t('set.reduceMotion', lang)} hint="Desativa transições e piscadas." />
      </div>
      <div>
        <h4 className="panel-title mb-1 mt-2">Terminal</h4>
        <Toggle on={s.typing} set={(v) => up({ typing: v })} label={t('set.typing', lang)} hint="Mostra respostas progressivamente." />
        <div className="py-2">
          <div className="text-sm text-soft mb-1">{t('set.termSpeed', lang)}</div>
          <div className="flex gap-2">
            {[[1, 'Lento'], [2, 'Normal'], [3, 'Rápido']].map(([v, l]) => (
              <button key={v} className={`btn ${s.termSpeed === v ? '' : 'btn-ghost'}`} onClick={() => up({ termSpeed: v as number })}>{l}</button>
            ))}
          </div>
        </div>
        <h4 className="panel-title mb-1 mt-4">{t('set.theme', lang)}</h4>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((th) => (
            <button key={th.id} disabled={!th.own} onClick={() => up({ theme: th.id })} className={`flex items-center gap-2 px-3 py-2 rounded border text-sm transition ${s.theme === th.id ? 'border-neon bg-neon/10' : 'border-line hover:border-mute'} ${!th.own ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <span className="w-3 h-3 rounded-full" style={{ background: th.color, boxShadow: `0 0 8px ${th.color}` }} />{th.name}{!th.own && <Icon name="Lock" size={11} className="ml-auto" />}
            </button>
          ))}
        </div>
        {themes.some((x) => !x.own) && <p className="text-[11px] text-mute mt-1">Temas extras são vendidos no Mercado → Cosméticos.</p>}
        <h4 className="panel-title mb-1 mt-4">{t('set.lang', lang)}</h4>
        <select className="input w-full" value={s.lang} onChange={(e) => up({ lang: e.target.value as any })}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <p className="text-[11px] text-mute mt-1">O conteúdo do jogo está em português (Brasil); o sistema de traduções está pronto para novos idiomas (src/i18n).</p>
      </div>
    </div>
  );
}
