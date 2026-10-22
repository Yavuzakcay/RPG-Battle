/**
 * Ses ayarları (Görev S): Ana ses, Ortam, Müzik, Efekt kaydırıcıları ve her birinin kapatma düğmesi; bu tarayıcıda
 * hatırlanır. Menüde ve savaş menüsünde "Ses" düğmesiyle açılır.
 */
import { useState } from 'react';
import { t } from '../i18n';
import { useSoundSettings } from './audio/sound';
import type { Channel } from './audio/soundPlan';

const CHANNELS: Channel[] = ['master', 'ambient', 'music', 'effects'];

export function SoundPanel(props: { onClose?: () => void }) {
  const S = t().sound;
  const [v, set] = useSoundSettings();
  return (
    <div className="sound-panel" role="group" aria-label={S.title}>
      <strong>{S.title}</strong>
      {CHANNELS.map((ch) => (
        <div key={ch} className="sound-row">
          <label htmlFor={`ses-${ch}`}>{S.channel[ch]}</label>
          <input id={`ses-${ch}`} type="range" min={0} max={100} step={1} value={Math.round(v.volume[ch] * 100)}
            disabled={v.muted[ch]} aria-valuetext={`${Math.round(v.volume[ch] * 100)}%`}
            onChange={(e: { target: { value: string } }) => set({ ...v, volume: { ...v.volume, [ch]: Number(e.target.value) / 100 } })} />
          <button className={v.muted[ch] ? 'on' : 'ghost'} aria-pressed={v.muted[ch]}
            onClick={() => set({ ...v, muted: { ...v.muted, [ch]: !v.muted[ch] } })}>{v.muted[ch] ? S.unmute : S.mute}</button>
        </div>
      ))}
      <small className="mute">{S.hint}</small>
      {props.onClose && <button className="ghost" onClick={props.onClose}>{t().common.close}</button>}
    </div>
  );
}

/** "Ses" düğmesi ve açılır panel. */
export function SoundButton(props: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`sound-button ${props.className ?? ''}`}>
      <button className="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{t().sound.button}</button>
      {open && <SoundPanel onClose={() => setOpen(false)} />}
    </span>
  );
}
