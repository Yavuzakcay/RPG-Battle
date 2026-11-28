/**
 * Görev HEROIC-INSPIRATION-TAM (SRD 5.2.1 s. 7): savaş dışında Game Master'ın Heroic Inspiration vermesi (Game Master kurulumu,
 * Serüven). Hak varsa yeni hak partide hakkı olmayan birine aktarılır ya da kaybolur (bir seferde en çok bir). Yalnız arayüz;
 * kural `rules/heroicInspiration.ts`.
 */
import { useState } from 'react';
import type { CharacterStatus } from '../rules/characterRest';
import { grantHeroic, hasHeroic, heroicPassTargets } from '../rules/heroicInspiration';
import { t } from '../i18n';

export interface HeroicMember { id: string; name: string; status: CharacterStatus }

/** Kâğıttaki hak rozeti (yoksa hiçbir şey). */
export function HeroicBadge(props: { status: Pick<CharacterStatus, 'resources'> | undefined }) {
  if (!hasHeroic(props.status)) return null;
  const P = t().player;
  return <span className="heroic-badge" title={P.heroicTip} aria-label={P.heroicTip}>{P.heroic}</span>;
}

/** Üye başına "İlham ver"; hakkı olan üyede aktarma/kaybolma seçimi. `onGrant` yalnız değişen durumları alır. */
export function HeroicGrant(props: { members: HeroicMember[]; onGrant?: (statuses: Record<string, CharacterStatus>, note: string) => void; title?: boolean;
  /** Komut yolu (Serüven `ilham_ver`): verilirse kural motorda yürür, `onGrant` çağrılmaz. */ onPick?: (memberId: string, passTo?: string) => void }) {
  const P = t().player;
  const [pick, setPick] = useState<string | null>(null);
  const [pass, setPass] = useState('');
  const run = (id: string, passTo?: string) => {
    if (props.onPick) { props.onPick(id, passTo); setPick(null); setPass(''); return; }
    const r = grantHeroic(props.members, id, passTo);
    if (!r.ok) return;
    const name = (x: string) => props.members.find((m) => m.id === x)?.name ?? x;
    props.onGrant?.(r.statuses, r.outcome.kind === 'kayboldu' ? P.heroicLost(name(r.outcome.from)) : P.heroicDone(name(r.outcome.to)));
    setPick(null); setPass('');
  };
  const alive = props.members.filter((m) => !m.status.dead);
  if (!alive.length) return null;
  const chosen = pick ? props.members.find((m) => m.id === pick) : undefined;
  return (
    <div className="heroic-grant">
      {props.title && <small className="mute">{P.heroicTitle}</small>}
      <div className="chips">
        {alive.map((m) => (
          <button key={m.id} type="button" className={`chip${hasHeroic(m.status) ? ' on' : ''}`} title={P.heroicGiveTip}
            onClick={() => (hasHeroic(m.status) ? setPick(m.id) : run(m.id))}>
            {m.name}{hasHeroic(m.status) ? ' ✦' : ''}
          </button>
        ))}
      </div>
      {chosen && (
        <div className="gm-row">
          <label>{P.heroicPass(chosen.name)}{' '}
            <select value={pass} onChange={(e: { target: { value: string } }) => setPass(e.target.value)}>
              <option value="">{P.heroicLose}</option>
              {heroicPassTargets(props.members, chosen.id).map((m) => <option key={m.id} value={m.id}>{P.heroicTo(m.name)}</option>)}
            </select>
          </label>{' '}
          <button type="button" className="ghost" onClick={() => run(chosen.id, pass || undefined)}>{P.heroicApply}</button>
        </div>
      )}
    </div>
  );
}
