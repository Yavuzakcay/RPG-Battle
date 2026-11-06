/**
 * Kuyruk K58 G1: hamle önizleme kartı (tembel parça). Hedef seçilince, onaydan önce: isabet/kritik olasılığı, hasar
 * aralığı (en az–ortalama–en çok), kurtulma DC'si ve başarı olasılığı, düşürme olasılığı, avantaj/dezavantaj kaynakları,
 * dost ateşi (kırmızı), itme/ışınlanma varışı, fırsat saldırıları, tepkimeler (keşif moduna göre; keşfedilmemişse yalnız
 * "?" ipucu). Ayrıntı Kısa: hedef başına tek satır; Tam: kaynaklar ve durumlar da.
 */
import { useMemo } from 'react';
import { t } from '../../i18n';
import { hexText } from '../log';
import type { BattleState, Command, CommandContext } from '../../battle/types';
import type { DiscoveryStore, PreviewSettings } from '../../app/discovery';
import { movePreview, pct, rangeText } from './movePreview';

export default function PreviewCard(props: { state: BattleState; cmd: Command | null; ctx: CommandContext; disc: DiscoveryStore; settings: PreviewSettings }) {
  const P = t().battle.preview;
  const mp = useMemo(() => (props.cmd ? movePreview(props.state, props.cmd, props.ctx, props.disc, props.settings) : null), [props.state, props.cmd, props.ctx, props.disc, props.settings]);
  if (!mp) return null;
  if (!mp.ok) return <div className="preview-card bad"><small>{P.error(mp.error ?? '')}</small></div>;
  const full = props.settings.detail === 'tam';
  const name = (id: string) => props.state.combatants[id]?.name ?? id;
  return (
    <div className="preview-card" role="status">
      {mp.lines.filter((l) => !l.self || l.damage.max > 0 || l.healing.max > 0).map((l) => (
        <div key={l.id} className={`pv-line${l.ally && !l.self && l.damage.max > 0 ? ' friendly' : ''}`}>
          <b>{l.name}</b>
          {l.hitP !== undefined && <span>{P.hit(pct(l.hitP))}{l.critP ? ` · ${P.crit(pct(l.critP))}` : ''}</span>}
          {l.dc !== undefined && <span>{P.save(l.ability ?? '', l.dc, pct(l.saveP))}</span>}
          {l.damage.max > 0 && <span>{P.dmg(rangeText(l.damage))}</span>}
          {l.healing.max > 0 && <span>{P.heal(rangeText(l.healing))}</span>}
          {l.killP > 0.01 && <span>{P.kill(pct(l.killP))}</span>}
          {l.movedTo && <span>{P.moved(hexText(l.movedTo))}</span>}
          {l.teleportedTo && <span>{P.teleport(hexText(l.teleportedTo))}</span>}
          {full && l.conditions.length > 0 && <small>{P.conditions}: {l.conditions.join(', ')}</small>}
          {full && l.reasons.length > 0 && <small>{l.reasons.join(' · ')}</small>}
          {l.ally && !l.self && l.damage.max > 0 && <em className="warn">{P.friendly(l.name, Math.round(l.damage.avg))}</em>}
        </div>
      ))}
      {mp.selfDamage > 0.5 && <em className="warn">{P.self(Math.round(mp.selfDamage))}</em>}
      {mp.opportunity.map((o, i) => <em key={i} className="warn">{P.oa(name(o.attackerId), o.at ? hexText(o.at) : '', Math.round(o.damage))}</em>)}
      {mp.reactions.length > 0 && <small>{P.reactions}: {mp.reactions.join(', ')}</small>}
      {mp.mystery && <span className="pv-mystery" title={P.mystery}>?</span>}
      {mp.lines.length === 0 && !mp.mystery && <small>{P.none}</small>}
    </div>
  );
}
