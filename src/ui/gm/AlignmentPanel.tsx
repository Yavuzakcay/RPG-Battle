/**
 * Kuyruk K51: Game Master "Hizalanma" paneli (ev kuralı açıkken): seçili karakterin ızgarası (ibre + başlangıç),
 * eksen çubukları, hazır olay düğmeleri (azalan getiri), serbest giriş (eksen, −10…+10, gerekçe), günlük (geri al /
 * geri getir), kartta gizle ve başlangıcı yeniden belirle. Her değişim karakterin `hizalanma.gunluk`ına yazılır.
 */
import { useState } from 'react';
import { ALIGN, ALIGN_EVENTS, addEvent, addFree, alignmentOf, gmRedetermine, toggleUndo, type Alignment, type Axis } from '../../rules/alignment';
import type { SavedCharacter } from '../../rules/builder';
import { AlignmentGrid } from '../AlignmentGrid';
import { getLang, t } from '../../i18n';

const today = () => new Date().toISOString().slice(0, 10);

export function AlignmentPanel(props: { characters: SavedCharacter[]; onUpdate: (list: SavedCharacter[]) => void }) {
  const H = t().view.hizalanma;
  const lang = getLang();
  const [id, setId] = useState<string>(props.characters[0]?.id ?? '');
  const [axis, setAxis] = useState<Axis>('iyilik');
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState('');
  const [redo, setRedo] = useState<{ duzen: number; iyilik: number } | null>(null);
  const c = props.characters.find((x) => x.id === id) ?? props.characters[0];
  if (!c) return null;
  const a = alignmentOf(c.hizalanma);
  const put = (next: Alignment) => props.onUpdate(props.characters.map((x) => (x.id === c.id ? { ...x, hizalanma: next } : x)));
  const now = () => new Date().toISOString();
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
  return (
    <details className="gm-align panel">
      <summary>{H.panel}</summary>
      <label className="gm-row">{H.pick}
        <select value={c.id} onChange={(e: { target: { value: string } }) => setId(e.target.value)}>
          {props.characters.map((x) => <option key={x.id} value={x.id}>{x.sheet.name}</option>)}
        </select>
      </label>
      <AlignmentGrid value={a} start={a.baslangic} label={a} bars />
      <h4>{H.quick}</h4>
      <div className="align-quick">
        {ALIGN_EVENTS.map((e) => (
          <button key={e.id} type="button" className="chip" title={`${H.law} ${sign(e.duzen)} · ${H.good} ${sign(e.iyilik)}`}
            onClick={() => put(addEvent(a, e.id, 'gm', now(), today()))}>{e.ad[lang]}</button>
        ))}
      </div>
      <h4>{H.free}</h4>
      <div className="align-free">
        <select value={axis} onChange={(e: { target: { value: string } }) => setAxis(e.target.value as Axis)} aria-label={H.law}>
          <option value="duzen">{H.law}</option><option value="iyilik">{H.good}</option>
        </select>
        <input type="number" min={-ALIGN.serbestEnCok} max={ALIGN.serbestEnCok} value={amount} aria-label={H.amount}
          onChange={(e: { target: { value: string } }) => setAmount(Number(e.target.value))} style={{ width: '4.5em' }} />
        <input type="text" value={reason} placeholder={H.reason} aria-label={H.reason} onChange={(e: { target: { value: string } }) => setReason(e.target.value)} />
        <button type="button" disabled={!amount || !reason.trim()} onClick={() => { put(addFree(a, axis, amount, reason.trim(), 'gm', now(), today())); setReason(''); }}>{H.add}</button>
      </div>
      <h4>{H.log}</h4>
      {a.gunluk.length === 0 ? <p className="mute">{H.empty}</p> : (
        <ul className="align-log">
          {[...a.gunluk].reverse().slice(0, 20).map((e) => (
            <li key={e.id} className={e.geriAlindi ? 'undone' : ''}>
              <span>{e.zaman.slice(0, 10)} · {e.gerekce} ({H.law} {sign(e.duzen)}, {H.good} {sign(e.iyilik)}){e.yarim ? ` · ${H.half}` : ''}</span>
              {(e.tur === 'olay' || e.tur === 'serbest') && <button type="button" className="ghost" onClick={() => put(toggleUndo(a, e.id))}>{e.geriAlindi ? H.redo : H.undo}</button>}
            </li>
          ))}
        </ul>
      )}
      <label className="gm-row"><input type="checkbox" checked={!!a.gizli} onChange={(e: { target: { checked: boolean } }) => put({ ...a, gizli: e.target.checked })} /> {H.hide}</label>
      <div className="align-free">
        {redo ? (
          <>
            <input type="number" min={-ALIGN.eksen} max={ALIGN.eksen} value={redo.duzen} aria-label={H.law} style={{ width: '4.5em' }}
              onChange={(e: { target: { value: string } }) => setRedo({ ...redo, duzen: Number(e.target.value) })} />
            <input type="number" min={-ALIGN.eksen} max={ALIGN.eksen} value={redo.iyilik} aria-label={H.good} style={{ width: '4.5em' }}
              onChange={(e: { target: { value: string } }) => setRedo({ ...redo, iyilik: Number(e.target.value) })} />
            <button type="button" onClick={() => { put(gmRedetermine(a, redo, 'gm', now(), H.redetermineReason)); setRedo(null); }}>{H.redetermine}</button>
          </>
        ) : <button type="button" className="ghost" onClick={() => setRedo({ ...a.baslangic })}>{H.redetermine}</button>}
      </div>
    </details>
  );
}
