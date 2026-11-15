/**
 * Kuyruk K51: Game Master "Hizalanma" paneli (ev kuralı açıkken): seçili karakterin ızgarası (ibre + başlangıç),
 * eksen çubukları, hazır olay düğmeleri (azalan getiri), serbest giriş (eksen, −10…+10, gerekçe), günlük (geri al /
 * geri getir), kartta gizle ve başlangıcı yeniden belirle. Her değişim karakterin `hizalanma.gunluk`ına yazılır.
 * Kuyruk K52: Moral bağı (`moralBond`: hizalanma + moralSistemi + hizalanmaMoral) açıkken olay uygulanmadan önce Moral
 * önizlemesi (düğmede ve serbest girişte), "bu olayda Moral etkisi yok" seçeneği, karakterin Moral'i ve savrulma.
 */
import '../../app/alignDiceHook';
import { useState } from 'react';
import { ALIGN, ALIGN_EVENTS, alignmentLabel, alignmentOf, correctValue, labelOf, labelPath, lastAnchorIndex, repeatFactor, toggleUndo, type Alignment, type Axis } from '../../rules/alignment';
import { applyAlignAct, applyTurningPoint, characterMoral, swingOf, type AlignAct, type MoralCtx, type MoralResult } from '../../rules/alignmentMoral';
import { currentStatus } from '../../rules/characterRest';
import type { SavedCharacter } from '../../rules/builder';
import { AlignmentGrid } from '../AlignmentGrid';
import { getLang, t } from '../../i18n';

const today = () => new Date().toISOString().slice(0, 10);

export function AlignmentPanel(props: { characters: SavedCharacter[]; onUpdate: (list: SavedCharacter[]) => void; moralBond?: boolean }) {
  const H = t().view.hizalanma;
  const lang = getLang();
  const [id, setId] = useState<string>(props.characters[0]?.id ?? '');
  const [axis, setAxis] = useState<Axis>('iyilik');
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState('');
  const [moralOff, setMoralOff] = useState(false);
  const [redo, setRedo] = useState<{ duzen: number; iyilik: number } | null>(null);
  const [fix, setFix] = useState<{ duzen: number; iyilik: number } | null>(null);
  const [tpTitle, setTpTitle] = useState('');
  const [tpReason, setTpReason] = useState('');
  const [tpHide, setTpHide] = useState(false);
  const c = props.characters.find((x) => x.id === id) ?? props.characters[0];
  if (!c) return null;
  const a = alignmentOf(c.hizalanma);
  const now = () => new Date().toISOString();
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
  const cm = props.moralBond ? characterMoral(c.sheet, c.status) : null;
  const ctx: MoralCtx | null = cm ? { ...cm, day: today() } : null;
  const put = (next: Alignment, moral?: number) => props.onUpdate(props.characters.map((x) => (x.id === c.id
    ? { ...x, hizalanma: next, ...(moral !== undefined ? { status: { ...currentStatus(x.sheet, x.status), moral } } : {}) } : x)));
  const run = (act: AlignAct): MoralResult => applyAlignAct(a, act, 'gm', now(), ctx, moralOff);
  const commit = (r: MoralResult) => { if (r.changed) put(r.alignment, r.delta ? r.moral : undefined); };
  const moralText = (r: { delta: number; nedenler: string[] }) => H.moralDelta(r.delta, r.nedenler.map((n) => H.reasons[n] ?? n).join(', '));
  const preview = (r: MoralResult) => (r.delta ? ` · ${moralText(r)}` : '');
  const free: AlignAct = { kind: 'serbest', eksen: axis, miktar: amount, gerekce: reason.trim() };
  const freePreview = ctx && amount && reason.trim() ? run(free) : null;
  return (
    <details className="gm-align panel">
      <summary>{H.panel}</summary>
      <label className="gm-row">{H.pick}
        <select value={c.id} onChange={(e: { target: { value: string } }) => setId(e.target.value)}>
          {props.characters.map((x) => <option key={x.id} value={x.id}>{x.sheet.name}</option>)}
        </select>
      </label>
      <AlignmentGrid value={a} start={a.baslangic} label={a} bars />
      {labelPath(a, lang).length > 0 && <p className="align-path" title={H.pathHelp}>{H.path}: {labelPath(a, lang).join(' → ')}</p>}
      {cm && (
        <p className="mute">{H.moralLine(cm.moral, cm.max)}{swingOf(cm) !== 1 ? ` · ${H.swing(swingOf(cm))}` : ''}</p>
      )}
      {cm && <label className="gm-row"><input type="checkbox" checked={moralOff} onChange={(e: { target: { checked: boolean } }) => setMoralOff(e.target.checked)} /> {H.moralOff}</label>}
      <h4>{H.quick}</h4>
      <div className="align-quick">
        {ALIGN_EVENTS.map((e) => {
          const r = run({ kind: 'olay', olayId: e.id });
          return (
            <button key={e.id} type="button" className="chip" title={`${H.law} ${sign(e.duzen)} · ${H.good} ${sign(e.iyilik)}${preview(r)}`}
              onClick={() => commit(r)}>{e.ad[lang]}{repeatFactor(a, e.id) < 1 ? <small className="align-moral"> ×{repeatFactor(a, e.id)}</small> : null}{r.delta ? <small className={r.delta < 0 ? 'align-moral bad' : 'align-moral good'}> {sign(r.delta)}</small> : null}</button>
          );
        })}
      </div>
      <h4>{H.free}</h4>
      <div className="align-free">
        <select value={axis} onChange={(e: { target: { value: string } }) => setAxis(e.target.value as Axis)} aria-label={H.law}>
          <option value="duzen">{H.law}</option><option value="iyilik">{H.good}</option>
        </select>
        <input type="number" min={-ALIGN.serbestEnCok} max={ALIGN.serbestEnCok} value={amount} aria-label={H.amount}
          onChange={(e: { target: { value: string } }) => setAmount(Number(e.target.value))} style={{ width: '4.5em' }} />
        <input type="text" value={reason} placeholder={H.reason} aria-label={H.reason} onChange={(e: { target: { value: string } }) => setReason(e.target.value)} />
        <button type="button" disabled={!amount || !reason.trim()} onClick={() => { commit(run(free)); setReason(''); }}>{H.add}</button>
      </div>
      {freePreview && freePreview.delta !== 0 && <p className="mute">{moralText(freePreview)}</p>}
      <h4>{H.log}</h4>
      {a.gunluk.length === 0 ? <p className="mute">{H.empty}</p> : (
        <ul className="align-log">
          {[...a.gunluk].map((e, i) => ({ e, i })).reverse().slice(0, 20).map(({ e, i }) => e.tur === 'donum' && e.donum ? (
            <li key={e.id} className="align-turn"><strong>{H.turnLine(e.donum.baslik, e.gerekce.slice(e.donum.baslik.length + 2), alignmentLabel(e.donum.eski.kova.duzen, e.donum.eski.kova.iyilik, lang), alignmentLabel(e.donum.yeni.kova.duzen, e.donum.yeni.kova.iyilik, lang), `${e.donum.eski.duzen}/${e.donum.eski.iyilik}`, `${e.donum.yeni.duzen}/${e.donum.yeni.iyilik}`)}</strong>
              {e.moral ? <small> · {moralText(e.moral)}</small> : null}</li>
          ) : e.tur === 'duzelt' ? (
            <li key={e.id} className="mute">{e.zaman.slice(0, 10)} · {H.fixed(...(e.gerekce.split(' → ') as [string, string]))}</li>
          ) : (
            <li key={e.id} className={e.geriAlindi ? 'undone' : ''}>
              <span>{e.zaman.slice(0, 10)} · {e.gerekce} ({H.law} {sign(e.duzen)}, {H.good} {sign(e.iyilik)}){e.azalim === 0 ? ` · ${H.none}` : e.azalim === 0.25 ? ` · ${H.quarter}` : e.yarim || e.azalim === 0.5 ? ` · ${H.half}` : ''}
                {e.carpan ? ` · ${H.swing(e.carpan)}` : ''}{e.moral ? ` · ${moralText(e.moral)}` : ''}</span>
              {(e.tur === 'olay' || e.tur === 'serbest') && i > lastAnchorIndex(a) && <button type="button" className="ghost" onClick={() => put(toggleUndo(a, e.id))}>{e.geriAlindi ? H.redo : H.undo}</button>}
            </li>
          ))}
        </ul>
      )}
      <label className="gm-row"><input type="checkbox" checked={!!a.gizli} onChange={(e: { target: { checked: boolean } }) => put({ ...a, gizli: e.target.checked })} /> {H.hide}</label>
      <h4>{H.turning}</h4>
      {redo ? (
        <div className="align-free align-turn-form">
          <p className="mute">{H.turningHelp}</p>
          <input type="number" min={-ALIGN.eksen} max={ALIGN.eksen} value={redo.duzen} aria-label={H.law} style={{ width: '4.5em' }}
            onChange={(e: { target: { value: string } }) => setRedo({ ...redo, duzen: Number(e.target.value) })} />
          <input type="number" min={-ALIGN.eksen} max={ALIGN.eksen} value={redo.iyilik} aria-label={H.good} style={{ width: '4.5em' }}
            onChange={(e: { target: { value: string } }) => setRedo({ ...redo, iyilik: Number(e.target.value) })} />
          <input type="text" value={tpTitle} placeholder={H.turnTitle} aria-label={H.turnTitle} onChange={(e: { target: { value: string } }) => setTpTitle(e.target.value)} />
          <input type="text" value={tpReason} placeholder={H.turnReason} aria-label={H.turnReason} onChange={(e: { target: { value: string } }) => setTpReason(e.target.value)} />
          <label><input type="checkbox" checked={tpHide} onChange={(e: { target: { checked: boolean } }) => setTpHide(e.target.checked)} /> {H.hide}</label>
          <button type="button" className="cta" disabled={!tpTitle.trim() || !tpReason.trim()} onClick={() => {
            const r = applyTurningPoint(a, redo, tpTitle.trim(), tpReason.trim(), 'gm', now(), ctx, moralOff, tpHide || undefined);
            put(r.alignment, r.delta ? r.moral : undefined); setRedo(null); setTpTitle(''); setTpReason(''); setTpHide(false);
          }}>{H.turnApply}</button>
          <button type="button" className="ghost" onClick={() => setRedo(null)}>{H.turnCancel}</button>
        </div>
      ) : <button type="button" className="ghost" onClick={() => setRedo({ duzen: a.duzen, iyilik: a.iyilik })}>{H.turning}</button>}
      {fix ? (
        <div className="align-free">
          <p className="mute">{H.fixHelp}</p>
          <input type="number" min={-ALIGN.eksen} max={ALIGN.eksen} value={fix.duzen} aria-label={H.law} style={{ width: '4.5em' }} onChange={(e: { target: { value: string } }) => setFix({ ...fix, duzen: Number(e.target.value) })} />
          <input type="number" min={-ALIGN.eksen} max={ALIGN.eksen} value={fix.iyilik} aria-label={H.good} style={{ width: '4.5em' }} onChange={(e: { target: { value: string } }) => setFix({ ...fix, iyilik: Number(e.target.value) })} />
          <button type="button" onClick={() => { put(correctValue(a, fix, 'gm', now())); setFix(null); }}>{H.fixApply}</button>
          <button type="button" className="ghost" onClick={() => setFix(null)}>{H.turnCancel}</button>
        </div>
      ) : <button type="button" className="ghost align-fix" title={H.fixHelp} onClick={() => setFix({ duzen: a.duzen, iyilik: a.iyilik })}>{H.fix}</button>}
    </details>
  );
}
