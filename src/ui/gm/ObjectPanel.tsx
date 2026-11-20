/**
 * Kuyruk KQ5 NU1: tek "Nesne" paneli (eski ObjectTool + "⚖ Ağırlık" aracının yerine). Üstte arama ve kategori çipleri, altında kartlar:
 * simge, ad (İngilizce; Türkçe ad yanında), ağırlık (lb) ve "1 kişi / 2+ kişi" ipucu. Karta dokun → haritada altıgene dokun → yerleşir
 * ("Bitti" ile kapanır). Aynı liste hedef şeridinin "Nesne yerleştir" kipinde de kullanılır (ikinci arayüz yok).
 */
import { useState } from 'react';
import { OBJECTS } from '../../battle/objectData';
import type { ObjectKind, ObjectState } from '../../battle/types';
import { getLang, t } from '../../i18n';
import { OBJECT_CATEGORIES, catalog, type ObjectCategory } from './objectCatalog';

/** `inspect`: yerleştirmez, dokunulan nesnenin kartını açar. */
export type ObjectPick = { kind: ObjectKind; state?: ObjectState } | 'remove' | 'inspect';
const same = (a: ObjectPick, b: ObjectPick) => (typeof a === 'string' || typeof b === 'string' ? a === b : a.kind === b.kind && a.state === b.state);

export function ObjectPanel(props: { pick: ObjectPick; onPick: (p: ObjectPick) => void; onClose: () => void; title?: string }) {
  const N = t().nu1;
  const O = t().battle.gm.objectTool;
  const en = getLang() === 'en';
  const [cat, setCat] = useState<ObjectCategory | null>(null);
  const [q, setQ] = useState('');
  const cards = catalog({ category: cat, query: q });
  const chosen = typeof props.pick === 'string' ? null : OBJECTS[props.pick.kind];
  return (
    <div className="gm-tool object-panel" role="region" aria-label={props.title ?? N.panelTitle}>
      <strong className="gm-tool-title">{props.title ?? N.panelTitle}</strong>
      <input type="search" className="object-search" value={q} placeholder={N.searchPlaceholder} aria-label={N.search}
        onChange={(e: { target: { value: string } }) => setQ(e.target.value)} />
      <div className="object-cats" role="group" aria-label={N.panelTitle}>
        <button type="button" className={cat === null ? 'on' : ''} aria-pressed={cat === null} onClick={() => setCat(null)}>{N.cats.tumu}</button>
        {OBJECT_CATEGORIES.map((c) => <button key={c} type="button" className={cat === c ? 'on' : ''} aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{N.cats[c]}</button>)}
      </div>
      <div className="object-cards">
        <button type="button" className={`object-card${props.pick === 'inspect' ? ' on' : ''}`} aria-pressed={props.pick === 'inspect'} onClick={() => props.onPick('inspect')}>
          <span className="oc-icon">🔍</span><span className="oc-name">{N.inspect}</span><small>{N.inspectHint}</small>
        </button>
        {cards.map((c) => {
          const pick: ObjectPick = { kind: c.kind };
          const on = same(props.pick, pick);
          return (
            <button key={c.kind} type="button" className={`object-card${on ? ' on' : ''}`} aria-pressed={on} onClick={() => props.onPick(pick)} data-kind={c.kind}>
              <span className="oc-icon" aria-hidden="true">{c.icon}</span>
              <span className="oc-name">{en ? c.en : c.tr}</span>
              <small>{en ? c.tr : c.en}</small>
              {c.weight !== null && <small className="oc-weight">{c.weight} {N.lb} · {c.people === 1 ? N.one : N.two}</small>}
            </button>
          );
        })}
        <button type="button" className={`object-card${typeof props.pick !== 'string' && props.pick.state === 'locked' ? ' on' : ''}`}
          onClick={() => props.onPick({ kind: 'door', state: 'locked' })}><span className="oc-icon">{OBJECTS.door.icon}🔒</span><span className="oc-name">{N.lockedDoor}</span></button>
        <button type="button" className={`object-card${props.pick === 'remove' ? ' on' : ''}`} aria-pressed={props.pick === 'remove'} onClick={() => props.onPick('remove')}>
          <span className="oc-icon">✕</span><span className="oc-name">{O.remove}</span></button>
      </div>
      {chosen && <small className="object-picked" role="status">{N.pick(en ? chosen.en : chosen.tr)}</small>}
      <button type="button" className="cta object-done" onClick={props.onClose}>{N.done}</button>
    </div>
  );
}
