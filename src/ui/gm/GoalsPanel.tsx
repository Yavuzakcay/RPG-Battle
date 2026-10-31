/**
 * Görev S3: Game Master hedef paneli (kurulum). Hedef ekle/kaldır (tür, altıgen ya da nesne, tur), birleşim
 * (hepsi/herhangi biri), başarısızlık koşulları ve hazır şablonlar (haritanın hedefleri, yalnızca yen, kaç, dayan).
 * Ayrı bileşen: GM Atölyesi aynı paneli kullanacak. Altıgenler ekranda 1 tabanlı (sütun,satır), içeride 0 tabanlı.
 */
import { useState } from 'react';
import type { BattleState, Goal, GoalFail, GoalFailKind, GoalKind, Goals } from '../../battle/types';
import type { Offset } from '../../rules/hex';
import { t } from '../../i18n';
import { failText, goalText } from '../goalText';

const KINDS: GoalKind[] = ['defeat', 'reach', 'protect', 'destroy', 'survive', 'retrieve'];
const FAILS: GoalFailKind[] = ['rounds', 'civilians', 'object', 'alarm'];

/** "15,3 16,3" → 0 tabanlı altıgenler (geçersizler atlanır). */
export function parseHexes(text: string): Offset[] {
  return text.split(/[\s;]+/).map((p) => p.split(',').map(Number)).filter((x) => x.length === 2 && x.every((n) => Number.isInteger(n) && n > 0))
    .map(([c, r]) => ({ col: (c as number) - 1, row: (r as number) - 1 }));
}

/** Hazır şablonlar: kaç = doğu kenarının bütün satırları. */
export function goalPreset(kind: 'defeat' | 'escape' | 'survive', size: { cols: number; rows: number }): Goals {
  if (kind === 'escape') return { mode: 'all', list: [{ id: 'kac', kind: 'reach', hexes: Array.from({ length: size.rows }, (_, row) => ({ col: size.cols - 1, row })) }] };
  if (kind === 'survive') return { mode: 'any', list: [{ id: 'dayan', kind: 'survive', rounds: 5 }, { id: 'yen', kind: 'defeat' }] };
  return { mode: 'all', list: [{ id: 'yen', kind: 'defeat' }] };
}

export function GoalsPanel(props: {
  value: Goals | null; mapGoals: Goals | null; objects: Array<{ id: string; kind: string }>; size: { cols: number; rows: number };
  onChange: (next: Goals | null) => void;
}) {
  const G = t().goals;
  const P = G.gm;
  const v = props.value;
  const fake = { map: { objects: props.objects } } as unknown as BattleState;
  const [kind, setKind] = useState<GoalKind>('reach');
  const [hexes, setHexes] = useState('');
  const [objectId, setObjectId] = useState('');
  const [rounds, setRounds] = useState(5);
  const [who, setWho] = useState(false);
  const [failKind, setFailKind] = useState<GoalFailKind>('rounds');
  const [failN, setFailN] = useState(6);
  const base: Goals = v ?? { mode: 'all', list: [] };
  const set = (g: Goals) => props.onChange(g.list.length || g.fail?.length ? g : null);
  const needsHexes = kind === 'reach' || kind === 'retrieve';
  const needsObject = kind === 'destroy' || kind === 'retrieve';
  const canObject = needsObject || kind === 'protect';
  const needsRounds = kind === 'survive' || kind === 'protect';
  const add = () => {
    const hx = parseHexes(hexes);
    if (needsHexes && !hx.length) return;
    const obj = objectId || (needsObject ? props.objects[0]?.id ?? '' : '');
    if (needsObject && !obj) return;
    let n = base.list.length + 1;
    while (base.list.some((g) => g.id === `g${n}`)) n++;
    const g: Goal = { id: `g${n}`, kind, ...(needsHexes ? { hexes: hx } : {}), ...(canObject && obj ? { objectId: obj } : {}),
      ...(needsRounds && rounds > 0 ? { rounds } : {}), ...(kind === 'reach' && who ? { who: 'all' as const } : {}) };
    set({ ...base, list: [...base.list, g] });
  };
  const addFail = () => {
    const f: GoalFail = failKind === 'object' ? { kind: 'object', objectId: objectId || props.objects[0]?.id || '' }
      : failKind === 'civilians' ? { kind: 'civilians', needed: failN } : { kind: failKind, rounds: failN };
    if (failKind === 'object' && !f.objectId) return;
    set({ ...base, fail: [...(base.fail ?? []), f] });
  };
  return (
    <details className="goals-panel">
      <summary>{P.summary} ({v?.list.length ?? 0}{v?.fail?.length ? ` + ${v.fail.length} ✗` : ''})</summary>
      <div className="row wrap">
        <span className="mute">{P.presets}:</span>
        {props.mapGoals && <button type="button" onClick={() => props.onChange(props.mapGoals)}>{P.presetMap}</button>}
        <button type="button" onClick={() => props.onChange(goalPreset('defeat', props.size))}>{P.presetDefeat}</button>
        <button type="button" onClick={() => props.onChange(goalPreset('escape', props.size))}>{P.presetEscape}</button>
        <button type="button" onClick={() => props.onChange(goalPreset('survive', props.size))}>{P.presetSurvive}</button>
        <button type="button" onClick={() => props.onChange(null)}>{P.clear}</button>
      </div>
      {!v ? <p className="mute">{P.none}</p> : (
        <>
          <label>{P.mode}{' '}
            <select value={v.mode} onChange={(e) => set({ ...v, mode: e.target.value as Goals['mode'] })}>
              <option value="all">{G.all}</option><option value="any">{G.any}</option>
            </select>
          </label>
          <ul className="goal-list">
            {v.list.map((g) => (
              <li key={g.id}>{goalText(g, fake)}{g.hexes?.length ? ` [${g.hexes.map((h) => `${h.col + 1},${h.row + 1}`).join(' ')}]` : ''}
                {' '}<button type="button" onClick={() => set({ ...v, list: v.list.filter((x) => x !== g) })}>{P.remove}</button></li>
            ))}
            {(v.fail ?? []).map((f, i) => (
              <li key={`f${i}`} className="fail">✗ {failText(f, fake)}{' '}
                <button type="button" onClick={() => set({ ...v, fail: (v.fail ?? []).filter((_, j) => j !== i) })}>{P.remove}</button></li>
            ))}
          </ul>
        </>
      )}
      <div className="row wrap goal-add">
        <select value={kind} onChange={(e) => setKind(e.target.value as GoalKind)} aria-label={P.add}>
          {KINDS.map((k) => <option key={k} value={k}>{G.kind[k]}</option>)}
        </select>
        {needsHexes && <input value={hexes} onChange={(e) => setHexes(e.target.value)} placeholder={P.hexes} aria-label={P.hexes} />}
        {(canObject || failKind === 'object') && (props.objects.length
          ? <select value={objectId} onChange={(e) => setObjectId(e.target.value)} aria-label={P.object}>
              {kind === 'protect' && <option value="">{G.text.civilians}</option>}
              {props.objects.map((o) => <option key={o.id} value={o.id}>{o.id}</option>)}
            </select>
          : needsObject ? <span className="mute">{P.noObject}</span> : null)}
        {needsRounds && <label>{P.rounds} <input type="number" min={0} max={50} value={rounds} onChange={(e) => setRounds(Number(e.target.value))} /></label>}
        {kind === 'reach' && <label><input type="checkbox" checked={who} onChange={(e) => setWho(e.target.checked)} /> {P.who}</label>}
        <button type="button" onClick={add}>{P.add}</button>
      </div>
      <div className="row wrap goal-add">
        <select value={failKind} onChange={(e) => setFailKind(e.target.value as GoalFailKind)} aria-label={P.addFail}>
          {FAILS.map((k) => <option key={k} value={k}>{G.failKind[k]}</option>)}
        </select>
        {failKind !== 'object' && <label>{failKind === 'civilians' ? P.needed : P.rounds} <input type="number" min={0} max={50} value={failN} onChange={(e) => setFailN(Number(e.target.value))} /></label>}
        <button type="button" onClick={addFail}>{P.addFail}</button>
      </div>
    </details>
  );
}
