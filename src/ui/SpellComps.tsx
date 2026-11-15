/**
 * Görev SD13: büyü bileşen etiketleri. Dolu (turuncu, SD10) = büyüde var; olmayan hiç gösterilmez. Etikete dokununca tek satır
 * Türkçe/İngilizce açıklama; M'de malzeme adı, değer ve tüketim, değerli malzemede ⚠. Yalnız bilgi (yeni engel yok).
 * `compact`: liste satırında tek küçük "VSM" grubu (dokunulmaz, ipucu başlığı). `silenced`: V vurgulanır (Sessizlik alanı).
 */
import { useState } from 'react';
import { t } from '../i18n';
import { spellComponents, type SpellComponents } from '../rules/spellComponents';

type Part = 'v' | 's' | 'm';
const PARTS: Part[] = ['v', 's', 'm'];

/** Tek satır açıklama metni (M'de malzeme ayrıntısı). */
export function componentNote(c: SpellComponents, part: Part): string {
  const C = t().comps;
  if (part === 'v') return C.vHelp;
  if (part === 's') return C.sHelp;
  const mat = c.material;
  // Tek değerli malzemede ad sadeleşir ("a diamond"), değer ve tüketim Türkçe; birden çok değerde SRD metni olduğu gibi.
  const single = mat && (mat.text.match(/GP/gi) ?? []).length <= 1;
  const clean = mat && single ? mat.text.replace(/,?\s*(which the spell consumes|worth [\d,]+\+? ?GP)/gi, '').trim() : mat?.text ?? '';
  const extra = mat ? [clean && C.material(clean), single && mat.gp ? C.gp(mat.gp) : '', single && mat.consumed ? C.consumed : ''].filter(Boolean).join(', ') : '';
  return `${C.mHelp}${extra ? ` ${extra}` : ''}`;
}

export function SpellComps(props: { spell: { id: string; srd?: string }; compact?: boolean; silenced?: boolean }) {
  const C = t().comps;
  const c = spellComponents(props.spell);
  const [open, setOpen] = useState<Part | null>(null);
  if (!c) return null;
  const present = PARTS.filter((p) => c[p]);
  const valuable = !!c.material?.gp;
  const name = { v: C.vName, s: C.sName, m: C.mName };
  if (props.compact) {
    return (
      <span className="spell-comps compact" title={`${C.label}: ${present.map((p) => name[p]).join(', ')}`} aria-label={`${C.label}: ${present.map((p) => name[p]).join(', ')}`}>
        {present.map((p) => <b key={p} className={`comp on${p === 'v' && props.silenced ? ' hot' : ''}`}>{C[p]}</b>)}
        {valuable && <i className="comp-gp" title={C.valuable} aria-label={C.valuable}>⚠</i>}
      </span>
    );
  }
  return (
    <span className="spell-comps">
      {present.map((p) => (
        <button key={p} type="button" className={`comp on${p === 'v' && props.silenced ? ' hot' : ''}`} aria-pressed={open === p} title={name[p]} onClick={() => setOpen(open === p ? null : p)}>{C[p]}</button>
      ))}
      {valuable && <i className="comp-gp" title={C.valuable} aria-label={C.valuable}>⚠</i>}
      {props.silenced && c.v && <small className="comp-note hot">{C.silenced}</small>}
      {open && <small className="comp-note">{name[open]}: {componentNote(c, open)}</small>}
    </span>
  );
}

/** ⓘ penceresi için düz metin: "Bileşenler: V (Verbal), S (Somatic), M (Material): Malzeme: …". */
export function componentsInfo(spell: { id: string; srd?: string }): string {
  const c = spellComponents(spell);
  if (!c) return '';
  const C = t().comps;
  const name = { v: C.vName, s: C.sName, m: C.mName };
  const parts = PARTS.filter((p) => c[p]).map((p) => `${C[p]} (${name[p]})`).join(', ');
  const m = c.m ? ` ${componentNote(c, 'm')}` : '';
  return `${C.label}: ${parts}.${m}`;
}
