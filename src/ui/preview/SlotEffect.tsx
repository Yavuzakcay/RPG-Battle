/**
 * SD7: slot seçicinin etki bölümü (tembel parça): seçili slotla atılacak zar tek satırda, altında hedef başına ne kadarının
 * işleyeceği (mevcut hedef önizlemesinden). Hedef seçilmediyse yalnız zar satırı. Slot değişince anında yenilenir.
 */
import { useMemo } from 'react';
import { t } from '../../i18n';
import type { Spell } from '../../data';
import type { BattleState, Command, CommandContext } from '../../battle/types';
import { slotEffectLine } from '../slotInfo';
import { slotTargetLines } from './slotTargets';

export default function SlotEffect(props: { state: BattleState; ctx: CommandContext; spell: Spell; slotLevel: number; multi: boolean; cmd: Command | null }) {
  const X = t().battle.slotEffect;
  const line = slotEffectLine(props.spell, props.slotLevel, props.multi, X);
  const rows = useMemo(
    () => slotTargetLines(props.state, props.cmd, props.ctx, props.spell, props.slotLevel, X, (id) => props.state.combatants[id]?.name ?? id),
    [props.state, props.cmd, props.ctx, props.spell, props.slotLevel, X],
  );
  return (
    <div className="slot-effect" aria-live="polite">
      <small className="slot-effect-line">{line}</small>
      {rows.map((r) => <small key={r} className="slot-effect-row">{r}</small>)}
    </div>
  );
}
