/**
 * Görev S3: Game Master hedef paneli (kurulum). Görev OD1C: yalnız hedef TÜRÜ ve başarısızlık koşulu seçilir; altıgen ve nesne
 * haritada (savaş öncesi yerleştirme şeridi, `MapBattle`) seçilir, bekleyen hedef "bekliyor" görünür. Taslak (`oda/hedef.ts`)
 * oda kaydında ve Hızlı savaşta aynı. Ayrı bileşen: GM Atölyesi aynı paneli kullanacak. Altıgenler ekranda 1 tabanlı.
 */
import { useState } from 'react';
import type { Goal, GoalFailKind, GoalKind, Goals } from '../../battle/types';
import type { Offset } from '../../rules/hex';
import { t } from '../../i18n';
import { failText, goalText } from '../goalText';
import { addDraftGoal, draftFromGoals, failPending, isPending, pendingNeeds, type DraftGoal, type GoalsDraft } from '../../oda/hedef';

const KINDS: GoalKind[] = ['defeat', 'reach', 'protect', 'destroy', 'survive', 'retrieve'];
const FAILS: GoalFailKind[] = ['rounds', 'civilians', 'object', 'alarm'];

/** "15,3 16,3" → 0 tabanlı altıgenler (geçersizler atlanır). Panelde artık kullanılmaz; testler ve içe aktarma için duruyor. */
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
  value: GoalsDraft | null; mapGoals: Goals | null; objects: Array<{ id: string; kind: string }>; size: { cols: number; rows: number };
  onChange: (next: GoalsDraft | null) => void;
}) {
  const G = t().goals;
  const P = G.gm;
  const Q = t().oda.goal;
  const v = props.value;
  const fake = { map: { objects: props.objects } } as unknown as import('../../battle/types').BattleState;
  const [kind, setKind] = useState<GoalKind>('reach');
  const [objectId, setObjectId] = useState('');
  const [rounds, setRounds] = useState(5);
  const [who, setWho] = useState(false);
  const [failKind, setFailKind] = useState<GoalFailKind>('rounds');
  const [failN, setFailN] = useState(6);
  const set = (g: GoalsDraft) => props.onChange(g.list.length || g.fail?.length ? g : null);
  const needsObject = kind === 'destroy' || kind === 'retrieve';
  const canObject = needsObject || kind === 'protect';
  const needsRounds = kind === 'survive' || kind === 'protect';
  const add = () => {
    const picked = objectId && objectId !== '?' ? objectId : '';
    const extra: Partial<DraftGoal> = {
      ...(canObject && picked ? { objectId: picked } : {}),
      ...(kind === 'protect' && objectId !== '' ? { wantsObject: true } : {}),
      ...(needsRounds && rounds > 0 ? { rounds } : {}), ...(kind === 'reach' && who ? { who: 'all' as const } : {}),
    };
    set(addDraftGoal(v, kind, kind === 'protect' && objectId === '' ? { ...extra } : extra));
  };
  const addFail = () => {
    const f = failKind === 'object' ? { kind: 'object' as const, objectId: objectId && objectId !== '?' ? objectId : '' }
      : failKind === 'civilians' ? { kind: 'civilians' as const, needed: failN } : { kind: failKind, rounds: failN };
    set({ ...(v ?? { mode: 'all' as const, list: [] }), fail: [...(v?.fail ?? []), f] });
  };
  const goalLine = (g: DraftGoal): string => {
    if (!isPending(g)) return `${goalText({ id: g.id, kind: g.kind, ...(g.hexes ? { hexes: g.hexes } : {}), ...(g.objectId ? { objectId: g.objectId } : {}), ...(g.rounds !== undefined ? { rounds: g.rounds } : {}) } as Goal, fake)}${g.hexes?.length ? ` [${g.hexes.map((h) => `${h.col + 1},${h.row + 1}`).join(' ')}]` : ''}`;
    return `${G.kind[g.kind]}${g.rounds ? ` (${g.rounds})` : ''}`;
  };
  return (
    <details className="goals-panel">
      <summary>{P.summary} ({v?.list.length ?? 0}{v?.fail?.length ? ` + ${v.fail.length} ✗` : ''})</summary>
      <div className="row wrap">
        <span className="mute">{P.presets}:</span>
        {props.mapGoals && <button type="button" onClick={() => props.onChange(draftFromGoals(props.mapGoals))}>{P.presetMap}</button>}
        <button type="button" onClick={() => props.onChange(draftFromGoals(goalPreset('defeat', props.size)))}>{P.presetDefeat}</button>
        <button type="button" onClick={() => props.onChange(draftFromGoals(goalPreset('escape', props.size)))}>{P.presetEscape}</button>
        <button type="button" onClick={() => props.onChange(draftFromGoals(goalPreset('survive', props.size)))}>{P.presetSurvive}</button>
        <button type="button" onClick={() => props.onChange(null)}>{P.clear}</button>
      </div>
      {!v ? <p className="mute">{P.none}</p> : (
        <>
          <label>{P.mode}{' '}
            <select value={v.mode} onChange={(e) => set({ ...v, mode: e.target.value as GoalsDraft['mode'] })}>
              <option value="all">{G.all}</option><option value="any">{G.any}</option>
            </select>
          </label>
          <ul className="goal-list">
            {v.list.map((g) => (
              <li key={g.id} className={isPending(g) ? 'pending' : ''}>{goalLine(g)}
                {isPending(g) && <small className="mute"> — {Q.pending}: {pendingNeeds(g).map((n) => (n === 'hex' ? Q.needHex : Q.needObject)).join(', ')}</small>}
                {' '}<button type="button" onClick={() => set({ ...v, list: v.list.filter((x) => x !== g) })}>{P.remove}</button></li>
            ))}
            {(v.fail ?? []).map((f, i) => (
              <li key={`f${i}`} className={`fail${failPending(f) ? ' pending' : ''}`}>✗ {failPending(f) ? Q.failObject : failText(f, fake)}
                {failPending(f) && <small className="mute"> — {Q.pending}: {Q.needObject}</small>}{' '}
                <button type="button" onClick={() => set({ ...v, fail: (v.fail ?? []).filter((_, j) => j !== i) })}>{P.remove}</button></li>
            ))}
          </ul>
          {v.list.some(isPending) && <p className="mute">{Q.afterMap}</p>}
        </>
      )}
      <div className="row wrap goal-add">
        <select value={kind} onChange={(e) => setKind(e.target.value as GoalKind)} aria-label={P.add}>
          {KINDS.map((k) => <option key={k} value={k}>{G.kind[k]}</option>)}
        </select>
        {(canObject || failKind === 'object') && (
          <select value={objectId} onChange={(e) => setObjectId(e.target.value)} aria-label={P.object}>
            {kind === 'protect' ? <option value="">{Q.civilians}</option> : null}
            <option value={kind === 'protect' ? '?' : ''}>{Q.objectLater}</option>
            {props.objects.map((o) => <option key={o.id} value={o.id}>{o.id}</option>)}
          </select>
        )}
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
