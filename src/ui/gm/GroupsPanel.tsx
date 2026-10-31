/**
 * Görev S4: Game Master grup paneli (kurulum): haritanın uyuyan/habersiz grup alanları, her grubun durumu ve haber
 * gidecek komşuları. Ayrı bileşen: GM Atölyesi aynı paneli kullanacak.
 */
import type { GroupState } from '../../battle/types';
import { t } from '../../i18n';

export type GroupChoice = Record<string, { state?: GroupState; links?: string[] }>;
const STATES: GroupState[] = ['asleep', 'calm', 'alarmed'];

export function GroupsPanel(props: {
  groups: Array<{ id: string; state?: GroupState; links?: string[]; hexes: unknown[] }>;
  value: GroupChoice; onChange: (next: GroupChoice) => void;
}) {
  const A = t().alarm;
  if (!props.groups.length) return null;
  const stateOf = (g: { id: string; state?: GroupState }) => props.value[g.id]?.state ?? g.state ?? 'asleep';
  const linksOf = (g: { id: string; links?: string[] }) => props.value[g.id]?.links ?? g.links ?? [];
  const set = (id: string, patch: { state?: GroupState; links?: string[] }) => props.onChange({ ...props.value, [id]: { ...props.value[id], ...patch } });
  return (
    <details className="groups-panel">
      <summary>{A.gm.summary(props.groups.length)}</summary>
      <p className="mute">{A.gm.note}</p>
      {props.groups.map((g) => (
        <div key={g.id} className="row wrap group-row">
          <strong>{g.id}</strong> <span className="mute">({g.hexes.length})</span>
          <select value={stateOf(g)} onChange={(e) => set(g.id, { state: e.target.value as GroupState })} aria-label={g.id}>
            {STATES.map((s) => <option key={s} value={s}>{A.state[s]}</option>)}
          </select>
          <span className="mute">{A.gm.links}:</span>
          {props.groups.filter((o) => o.id !== g.id).map((o) => (
            <label key={o.id}>
              <input type="checkbox" checked={linksOf(g).includes(o.id)}
                onChange={(e) => set(g.id, { links: e.target.checked ? [...linksOf(g), o.id] : linksOf(g).filter((x) => x !== o.id) })} /> {o.id}
            </label>
          ))}
        </div>
      ))}
    </details>
  );
}
