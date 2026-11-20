/**
 * Kuyruk KQ5 NU1: yerleştirilmiş nesnenin tek kartı (araç kapalıyken ya da "İncele" seçiliyken nesneye dokununca): ad (İngilizce),
 * açıklama (Türkçe; SRD eşyalarında `aciklamalar-tr.json`), ağırlık düzenleme (− / sayı / +, varsayılana dön; kural sürümü 80+),
 * "Kaldır" ve (kurulumda) "Hedef yap" (Koru / Yok et / Al ve çıkar). Eski ayrı "⚖ Ağırlık" aracı kalktı; aynı yer bu kartın içinde.
 */
import { useState } from 'react';
import { OBJECTS } from '../../battle/objectData';
import { AGIRLIK, objectWeightLb } from '../../battle/nesneAgirlik';
import type { MapObject } from '../../battle/types';
import { aciklamaOf } from '../../data';
import { getLang, t } from '../../i18n';

const step = (lb: number): number => (lb < 20 ? 0.5 : lb < 100 ? 5 : 25);
const clampLb = (n: number): number => Math.min(AGIRLIK.maxLb, Math.max(AGIRLIK.minLb, Math.round(n * 10) / 10));

/** Nesne türünün açıklaması, arayüz dilinde (yoksa undefined). */
export function objectDescription(kind: MapObject['kind']): string | undefined {
  const id = OBJECTS[kind]?.srd?.split(':')[1];
  // SRD kimliği çoğul olabilir (potions-of-healing); eşya kaydı tekil (potion-of-healing).
  const lang = getLang();
  return id ? aciklamaOf('esya', id, lang) ?? aciklamaOf('esya', id.replace(/^potions-/, 'potion-'), lang) : undefined;
}

export function ObjectCard(props: {
  obj: MapObject; weightOn: boolean; goalKinds?: Array<'protect' | 'destroy' | 'retrieve'>;
  onWeight: (lb: number | null) => void; onRemove: () => void; onGoal?: (kind: 'protect' | 'destroy' | 'retrieve') => void; onClose: () => void;
}) {
  const N = t().nu1.card;
  const en = getLang() === 'en';
  const def = OBJECTS[props.obj.kind];
  const lb = objectWeightLb(props.obj);
  const [text, setText] = useState(String(lb));
  const desc = objectDescription(props.obj.kind);
  const set = (n: number) => { const v = clampLb(n); setText(String(v)); props.onWeight(v); };
  return (
    <div className="gm-tool object-card-panel" role="dialog" aria-label={def?.en ?? props.obj.kind}>
      <strong className="gm-tool-title">{def?.icon} {en ? def?.en : def?.tr} <small>{en ? def?.tr : def?.en}</small></strong>
      <p className="object-desc">{desc ?? N.noDesc}</p>
      {props.weightOn && (
        <div className="object-weight" role="group" aria-label={N.weight}>
          <span>{N.weight}</span>
          <button type="button" aria-label={N.minus} onClick={() => set(lb - step(lb))}>−</button>
          <input type="number" min={AGIRLIK.minLb} max={AGIRLIK.maxLb} step={0.5} value={text} aria-label={N.weight}
            onChange={(e: { target: { value: string } }) => setText(e.target.value)}
            onBlur={() => { const n = Number(text.replace(',', '.')); if (Number.isFinite(n)) set(n); else setText(String(lb)); }} />
          <span>{t().nu1.lb}</span>
          <button type="button" aria-label={N.plus} onClick={() => set(lb + step(lb))}>+</button>
          <button type="button" className="ghost" onClick={() => { props.onWeight(null); setText(String(def?.agirlikLb ?? lb)); }}>{N.reset}</button>
        </div>
      )}
      <div className="object-actions">
        {props.goalKinds?.length ? (
          <span className="object-goals"><small>{N.makeGoal}:</small>
            {props.goalKinds.map((k) => <button key={k} type="button" onClick={() => props.onGoal?.(k)}>{N[k]}</button>)}
          </span>
        ) : null}
        <button type="button" className="danger" onClick={props.onRemove}>{N.remove}</button>
        <button type="button" className="ghost" onClick={props.onClose}>{N.close}</button>
      </div>
    </div>
  );
}
