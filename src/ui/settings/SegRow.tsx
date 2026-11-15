/**
 * SD8 (Ayarlar): sade ayar satırı. Etiket ve tek cümlelik açıklama solda/üstte, seçenek düğmeleri (aralıklı, dar ekranda
 * tek sütun) altta. Yalnız görünüm; değer ve saklama çağıranda.
 */
import type { ReactNode } from 'react';

export function SegRow<T extends string | boolean>(props: { label: string; help?: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <div className="set-row">
      <div className="set-text"><strong>{props.label}</strong>{props.help ? <p className="mute">{props.help}</p> : null}</div>
      <div className="set-seg" role="radiogroup" aria-label={props.label}>
        {props.options.map((o) => (
          <button key={String(o.value)} type="button" role="radio" aria-checked={props.value === o.value} className={props.value === o.value ? 'on' : 'ghost'} onClick={() => props.onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

/** Açık/Kapalı satırı. */
export function OnOffRow(props: { label: string; help?: string; value: boolean; on: string; off: string; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={`set-row${props.disabled ? ' disabled' : ''}`}>
      <div className="set-text"><strong>{props.label}</strong>{props.help ? <p className="mute">{props.help}</p> : null}</div>
      <div className="set-seg" role="radiogroup" aria-label={props.label}>
        {[true, false].map((v) => (
          <button key={String(v)} type="button" role="radio" aria-checked={props.value === v} disabled={props.disabled} className={props.value === v ? 'on' : 'ghost'} onClick={() => props.onChange(v)}>{v ? props.on : props.off}</button>
        ))}
      </div>
    </div>
  );
}

export function Fold(props: { title: string; help?: string; children: ReactNode; className?: string }) {
  return (
    <details className={`set-fold ${props.className ?? ''}`}>
      <summary>{props.title}</summary>
      {props.help ? <p className="mute">{props.help}</p> : null}
      {props.children}
    </details>
  );
}
