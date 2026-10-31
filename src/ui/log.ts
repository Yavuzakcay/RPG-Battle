/** Olayları insanın okuyacağı satırlara çevirir (geçerli dilde; metinler src/i18n/strings.ts `log`). */
import { goalText } from './goalText';
import { riderOf } from '../battle/riders';
import { civilianLook } from '../battle/civilianLooks';
import type { BattleEvent, BattleState, DamageEffect } from '../battle';
import type { Offset } from '../rules/hex';
import { skillLabel } from '../rules/skills';
import { terrainOf } from '../map/terrain';
import { t } from '../i18n';

/** Kullanıcıya gösterilen 1 tabanlı konum (geçerli dilde). */
export const hexText = (o: Offset): string => t().log.hex(o.col + 1, o.row + 1);

function effectText(e: DamageEffect): string {
  const L = t().log;
  switch (e.kind) {
    case 'regen_blocked': return L.regenBlocked;
    case 'regen_pending': return L.regenPending;
    case 'undead_fortitude': return L.undeadFortitude(e.natural, e.total, e.dc, e.success);
    case 'dying': return L.dying;
    case 'instant_death': return L.instantDeath;
    case 'death_save_failed': return L.deathSaveFailed(e.died, e.failures);
    case 'concentration': return L.concentration(e.spell, e.natural, e.total, e.dc, e.success) + (e.extra ? ` (${bonusText(e.extra)})` : '');
    case 'temp_absorbed': return L.tempAbsorbed(e.amount, e.left);
    case 'reduced': return L.reducedBy(e.label, e.roll, e.amount);
    case 'effect_save': return L.damageResave(e.name, e.natural, e.total, e.dc, e.success);
  }
}

/** Zar eklentileri (Bless +1d4, Bane −1d4; Görev R2): "Bless +3, Bane −2". */
function bonusText(xs: Array<{ label: string; value: number }>): string {
  return xs.map((x) => `${x.label} ${x.value >= 0 ? '+' : '−'}${Math.abs(x.value)}`).join(', ');
}

function damagePart(rolls: number[], raw: number, applied: number, type: string, note: string | null): string {
  const L = t().log;
  return L.damage(rolls.length > 1 ? `${rolls.join('+')} = ` : '', raw, note ? ` (${L.note[note] ?? note})` : '', applied, type).trim();
}

/** Canavar saldırısının uygulanamayan ek etkisi (uygulananlar zaten yazıldı; attack-riders.json). */
function riderPart(state: BattleState, actorId: string, label: string, rider: string | undefined): string | null {
  if (!rider) return null;
  const L = t().log;
  const spec = riderOf(state.combatants[actorId]?.monsterId, label);
  if (!spec) return L.riderNone(rider);
  return spec.unsupported ? L.riderPartial(spec.unsupported, spec.text ?? '') : null;
}

export function describeEvent(event: BattleEvent, state: BattleState): string {
  const L = t().log;
  // Görev K13B: Game Master'ın yerleştirdiği yüzey/nesne kaynağı `gm`.
  const n = (id: string) => state.combatants[id]?.name ?? (id === 'gm' ? 'Game Master' : id);
  const mode = (m: string) => L.mode[m] ?? '';
  switch (event.type) {
    case 'battle_started':
      return L.started(event.state.order.map((id) => n(id)).join(', '));
    case 'attack_resolved': {
      const parts = [`${n(event.actorId)} → ${n(event.targetId)}: ${event.opportunity ? L.opportunity : ''}${event.label}`];
      if (event.d20.length > 0) {
        const verdict = event.critical ? L.verdict.crit : event.fumble ? L.verdict.fumble : event.hit ? L.verdict.hit : L.verdict.miss;
        parts.push(L.attackRoll(event.d20.join(' / '), mode(event.mode), event.total, event.targetAc, event.cover ? L.cover(event.cover) : '', verdict));
      }
      if (event.hit && event.rawDamage > 0) {
        const extra = (event.extra ?? []).reduce((sum, x) => sum + x.applied, 0);
        parts.push(damagePart(event.damageRolls, event.rawDamage, event.appliedDamage - extra, event.damageType, event.damageNote));
      }
      for (const x of event.extra ?? []) parts.push(`${x.label}: ${damagePart(x.rolls, x.raw, x.applied, x.type, x.note)}`);
      if (event.savage) parts.push(L.savage(event.savage.totals[0], event.savage.totals[1], event.savage.totals[event.savage.kept]));
      if (event.autoMiss) parts.push(L.autoMiss(event.autoMiss));
      if (event.cunning) parts.push(L.cunning(event.cunning.options.join(', '), event.cunning.dice));
      if (event.reacted) parts.push(L.reacted(event.reacted.name, event.reacted.ac ?? 0, event.reacted.reduced ?? 0));
      if (event.bonusDice?.length) parts.push(L.bonusDice(bonusText(event.bonusDice)));
      if (event.reasons.length > 0) parts.push(L.effects(event.reasons.join(', ')));
      for (const e of event.effects) parts.push(effectText(e));
      const rider = riderPart(state, event.actorId, event.label, event.rider);
      if (rider) parts.push(rider);
      return parts.join('. ');
    }
    case 'save_resolved': {
      const ab = event.ability.toUpperCase();
      const parts = [`${n(event.actorId)} → ${n(event.targetId)}: ${event.label}`];
      parts.push(event.natural === null ? L.saveAuto(ab)
        : L.saveRoll(ab, event.d20.join(' / '), mode(event.mode), event.total ?? 0, event.cover ?? 0, event.dc, event.success));
      if (event.rawDamage > 0) parts.push(damagePart(event.damageRolls, event.rawDamage, event.appliedDamage, event.damageType, event.damageNote));
      if (event.bonusDice?.length) parts.push(L.bonusDice(bonusText(event.bonusDice)));
      if (event.conditionsAdded.length > 0) parts.push(L.conditionsAdded(event.conditionsAdded.join(', ')));
      if (event.reasons.length > 0) parts.push(L.effects(event.reasons.join(', ')));
      for (const e of event.effects) parts.push(effectText(e));
      const rider = riderPart(state, event.actorId, event.label, event.rider);
      if (rider) parts.push(rider);
      return parts.join('. ');
    }
    case 'healed':
      return L.healed(n(event.actorId), n(event.targetId), event.label, event.amount);
    case 'slot_spent':
      return L.slotSpent(n(event.actorId), event.level, event.remaining);
    case 'spell_cast':
      return `${n(event.actorId)}: ${event.label}. ${event.note}`;
    case 'effect_added':
      return L.effectAdded(n(event.targetId), event.effect.name, n(event.effect.sourceId));
    case 'effect_ended':
      return L.effectEnded(n(event.targetId), event.name, L.effectWhy[event.reason] ?? event.reason);
    case 'temp_hp':
      return L.tempHp(n(event.targetId), event.amount, event.label);
    case 'hp_boosted':
      return L.hpBoosted(n(event.targetId), event.amount, event.label);
    case 'effect_tick': {
      const parts = [L.effectTick(n(event.targetId), event.name, damagePart(event.damageRolls, event.appliedDamage, event.appliedDamage, event.damageType, null))];
      for (const e of event.effects) parts.push(effectText(e));
      if (event.save) parts.push(L.effectSave(event.save.ability.toUpperCase(), event.save.total, event.save.dc, event.save.success));
      return parts.join('. ');
    }
    case 'turn_lost':
      return L.turnLost(n(event.actorId), event.label, event.command === 'grovel');
    case 'slot_created':
      return L.slotCreated(n(event.actorId), event.level);
    case 'shape_changed':
      return event.stats ? L.shapeOn(n(event.actorId), event.stats.name) : L.shapeOff(n(event.actorId), event.reason ?? '');
    case 'trait_turn':
      return '';
    case 'sanctuary_save':
      return L.sanctuary(n(event.actorId), n(event.targetId), event.label, event.d20.join(' / '), event.total, event.dc, event.success);
    case 'curse_save':
      return L.curseSave(n(event.actorId), event.label, event.d20.join(' / '), event.total, event.dc, event.success);
    case 'bond_damage':
      return L.bondDamage(n(event.targetId), n(event.fromId), event.label, event.amount, event.targetHpAfter);
    case 'reaction_used':
      return L.reaction(n(event.actorId), event.name, event.sourceId ? n(event.sourceId) : null);
    case 'reaction_recharged':
      return L.reactionRecharged(n(event.actorId), state.combatants[event.actorId]?.reactions?.find((r) => r.id === event.reaction)?.name ?? event.reaction, event.d6, event.recharged);
    case 'swapped':
      return L.swapped(n(event.actorId), n(event.otherId));
    case 'condition_changed': {
      if (event.condition.startsWith('Immune:')) return L.immune(n(event.targetId), event.reason);
      if (event.condition === 'Dodge') return L.dodge(n(event.targetId));
      if (event.condition.startsWith('Help:')) return L.help(event.reason, n(event.targetId));
      const tm = event.timer;
      const how = !tm ? '' : tm.save ? L.timerSave(tm.save.ability.toUpperCase(), tm.save.dc)
        : L.timerTurn(tm.ownerId === event.targetId ? null : n(tm.ownerId), tm.end === 'turnStart');
      return L.condition(n(event.targetId), event.condition, event.present, event.reason, how);
    }
    case 'condition_timer':
      return '';
    case 'condition_save':
      return L.conditionSave(n(event.targetId), event.condition, event.ability.toUpperCase(), event.total, event.dc, event.success)
        + (event.bonusDice?.length ? ` (${bonusText(event.bonusDice)})` : '');
    case 'condition_ended':
      return event.condition === 'Dodge' ? L.dodgeEnd(n(event.targetId))
        : event.condition.startsWith('Help:') ? L.helpEnd(n(event.targetId), event.reason)
          : L.conditionEnd(n(event.targetId), event.condition, event.reason);
    case 'height_changed':
      if (!event.check) return L.heightDown(n(event.actorId), L.height[String(event.to)] ?? String(event.to));
      return L.climb(n(event.actorId), event.check.natural, event.check.total, event.check.dc, event.moved);
    case 'turn_ended':
      return L.turn(n(event.nextActorId), event.round);
    case 'placed':
      return L.placed(n(event.actorId), hexText(event.at));
    case 'civilian_art':
      return L.civilianArt(n(event.actorId), civilianLook(event.gorselId)?.name ?? event.gorselId);
    case 'dice_rolled':
      return '';
    case 'combat_started':
      return L.combatStarted;
    case 'moved': {
      const last = event.path[event.path.length - 1];
      return L.moved(n(event.actorId), last ? hexText(last) : '', event.cost);
    }
    case 'jumped':
      return L.jumped(n(event.actorId), event.running === true, event.gap, hexText(event.to), event.cost);
    case 'hide_attempted':
      return L.hide(n(event.actorId), event.d20.join(' / '), mode(event.mode), event.bonus ?? 0, event.total, event.dc, event.success);
    case 'revealed':
      return L.revealed(n(event.actorId), event.reason);
    case 'skill_checked':
      return L.skill(n(event.actorId), skillLabel(event.skill), event.reason ?? '', event.d20.join(' / '), mode(event.mode), event.total, event.dc, event.success)
        + (event.bonusDice?.length ? ` (${bonusText(event.bonusDice)})` : '');
    case 'searched':
      return L.searched(n(event.actorId), event.natural, event.total, event.found.map((id) => n(id)).join(', '));
    case 'fell_into_lava':
      return L.lava(n(event.actorId), hexText(event.at));
    case 'death_save':
      return L.deathSave(n(event.actorId), event.natural, L.deathOutcome[event.outcome] ?? event.outcome, event.successes, event.failures);
    case 'stabilized':
      return L.stabilized(n(event.actorId), n(event.targetId), event.natural, event.success);
    case 'recharge_used':
      return L.rechargeUsed(n(event.actorId));
    case 'recharge_rolled':
      return L.rechargeRolled(n(event.actorId), event.d6, event.recharged);
    case 'regeneration':
      return event.died ? L.regenDied(n(event.actorId)) : event.blocked ? L.regenBlockedTurn(n(event.actorId)) : L.regen(n(event.actorId), event.amount);
    case 'hp_adjusted':
      return L.hpAdjusted(n(event.targetId), event.hpAfter);
    case 'life_restored':
      return L.lifeRestored(n(event.targetId), event.life === 'alive', event.label);
    case 'teleported':
      return L.teleported(n(event.actorId), event.label);
    case 'exhaustion_changed':
      return L.exhaustion(n(event.targetId), event.level);
    case 'summon_steered':
      return L.summonSteered(n(event.summonId));
    case 'haste_action':
      return L.hasteAction(n(event.actorId));
    case 'action_used':
      // Eylem ve kalan saldırılar ayrıca yazılmaz; bonus eylem ve tepki yazılır. Nick: ek saldırı eylemin içinde.
      if (event.offhand && event.kind === 'attack') return L.nick(n(event.actorId));
      return event.kind === 'bonus' || event.kind === 'reaction' ? L.bonusAction(n(event.actorId), event.kind === 'bonus', event.what) : '';
    case 'dashed':
      return L.dashed(n(event.actorId));
    case 'disengaged':
      return L.disengaged(n(event.actorId));
    case 'map_effect': {
      const parts = [`${n(event.targetId)}: ${event.text}`];
      if (event.roll) {
        const r = event.roll;
        parts.push(L.mapRoll(r.label, r.d20.join(' / '), mode(r.mode), r.total, r.dc, r.success));
      }
      const d = event.damage;
      if (d && d.applied + d.raw > 0) {
        const sum = d.rolls.reduce((a, b) => a + b, 0);
        parts.push(sum > d.raw && d.rolls.length > 0
          ? L.halfDamage(d.rolls.join('+'), sum, d.raw, d.applied, d.type)
          : damagePart(d.rolls, d.raw, d.applied, d.type, d.note));
      }
      if (event.addCondition) parts.push(L.became(event.addCondition));
      if (event.removeCondition) parts.push(L.wore(event.removeCondition));
      if (event.mapStatus?.sink !== undefined) parts.push(L.sink(event.mapStatus.sink));
      if (event.moveTo) parts.push(`→ ${hexText(event.moveTo)}`);
      if (event.stopMovement) parts.push(L.stop);
      return `${parts.join('. ')}.`;
    }
    case 'tile_changed':
      return event.to === '~' ? L.toLava(hexText(event.at)) : L.tile(hexText(event.at), terrainOf(event.to).name);
    case 'lava_warning':
      return L.lavaWarning(event.hexes.length);
    case 'map_note':
      return event.text;
    case 'shove_resolved': {
      const push = event.effect === 'push';
      const roll = event.natural === null ? L.shoveAuto : L.shoveRoll(event.d20.join(' / '), event.total);
      return L.shove(n(event.actorId), n(event.targetId), L.shoveWhat(push), event.ability.toUpperCase(), roll, event.dc, L.shoveResult(event.success, push));
    }
    case 'jump_check':
      return L.jumpCheck(n(event.actorId), event.total, event.dc, event.natural === 20, L.jumpOutcome[event.outcome] ?? event.outcome);
    case 'pushed':
      return L.pushed(n(event.targetId), hexText(event.to));
    case 'mastery_applied': {
      const a = n(event.actorId);
      const b = n(event.targetId);
      const M = L.mastery;
      switch (event.mastery) {
        case 'graze': return event.damage ? M.graze(a, b, damagePart([], event.damage.raw, event.damage.applied, event.damage.type, event.damage.note)) : '';
        case 'cleave': return M.cleave(a, b);
        case 'push': return M.push(a, b);
        case 'sap': return M.sap(a, b);
        case 'slow': return M.slow(a, b, event.mark?.mark.feet ?? 10);
        case 'vex': return M.vex(a, b);
        case 'topple': return event.save ? M.topple(a, b, event.save.total, event.save.dc, event.save.success) : '';
        default: return '';
      }
    }
    case 'rage_started':
      return L.rageStarted(n(event.actorId), event.added.join(', '));
    case 'rage_extended':
      return L.rageExtended(n(event.actorId));
    case 'rage_ended':
      return L.rageEnded(n(event.actorId), event.reason);
    case 'reckless_started':
      return L.reckless(n(event.actorId));
    case 'mastery_mark_used':
      return L.markUsed(n(event.holderId), event.kind);
    case 'mark_added':
      return L.markAdded(n(event.holderId), event.label, n(event.mark.targetId ?? ''));
    case 'steady_aim_used':
      return L.steadyAim(n(event.actorId));
    case 'extra_damage':
      return `${n(event.actorId)} → ${n(event.targetId)}: ${event.label}. ${damagePart(event.rolls, event.raw, event.applied, event.damageType, event.damageNote)}`;
    case 'feature_used':
      return L.featureUsed(n(event.actorId), L.feature[event.feature] ?? event.feature, event.remaining);
    case 'buff_added':
      return L.buffAdded(n(event.targetId), event.buff.source, event.buff.until);
    case 'buff_removed':
      return L.buffRemoved(n(event.targetId), event.source);
    case 'concentration_started':
      return L.concStart(n(event.actorId), event.spell);
    case 'area_used':
      return L.area(n(event.actorId), event.label, event.sizeFt, L.shapeName[event.shape] ?? event.shape, event.targetIds.map(n).join(', '));
    case 'summoned':
      return L.summoned(n(event.ownerId), event.spell, event.combatant.name, event.combatant.summon?.level ?? 0,
        event.combatant.summon?.turn === 'own', event.combatant.initiative);
    case 'zone_created':
      return L.zoneCreated(n(event.zone.casterId), event.zone.name, event.zone.anchorId ? 0 : event.zone.hexes.length);
    case 'zone_moved':
      return L.zoneMoved(event.hexes.length ? (state.map?.zones?.find((z) => z.id === event.zoneId)?.name ?? '') : '');
    case 'zone_triggered':
      return '';
    case 'zone_ended':
      return L.zoneEnded(event.name);
    case 'object_placed':
      return L.objectPlaced(event.object.kind);
    case 'object_removed':
      return '';
    case 'object_damaged':
      return L.objectDamaged(event.label, event.objectId.split(':')[0] ?? '', event.roll ? `${event.roll.d20}+ = ${event.roll.total} / AC ${event.roll.ac}${event.roll.hit ? '' : ' (ıska)'}` : '', event.damage, event.damageType, event.hpAfter);
    case 'object_destroyed':
      return L.objectDestroyed(event.label);
    case 'object_changed':
      return L.objectChanged(event.label, event.check ? `${event.check.d20} → ${event.check.total} / DC ${event.check.dc}` : '');
    case 'groups_formed':
      return t().alarm.formed(Object.entries(event.members).map(([g, ids]) => `${g} ${ids.length} (${t().alarm.state[state.groups?.find((x) => x.id === g)?.state ?? 'asleep']})`).join(', '));
    case 'group_alarmed':
      return t().alarm.alarmed(event.groupId, event.byId && event.byId !== 'gm' ? `${event.reason}: ${n(event.byId)}` : event.reason);
    case 'goal_changed': {
      const g = state.goals?.list.find((x) => x.id === event.goalId);
      return t().goals.log(event.status === 'done' ? '✓' : '✗', g ? goalText(g, state) : event.goalId);
    }
    case 'surface_reacted':
      return L.surface(L.surfaceReaction[event.reaction] ?? event.reaction, event.label, event.hexes.length);
    case 'summon_vanished':
      return L.summonVanished(n(event.actorId), L.summonWhy[event.reason] ?? event.reason);
    case 'concentration_moved':
      return event.targetId ? L.markMoved(n(event.actorId), n(event.targetId)) : '';
    case 'battle_finished':
      return L.finished(event.winner === 'party');
    case 'dragon_woke':
      return event.byId === 'gm' ? L.gmWoke(n(event.actorId))
        : L.woke(n(event.actorId), event.reason, event.byId && event.reason !== 'hasar aldı' && !event.reason.startsWith('Algı') ? n(event.byId) : '');
    case 'dragon_perception':
      return L.stirred(n(event.actorId), event.total, event.dc, n(event.watcherId), event.success);
    case 'hp_pool_created':
      return L.hpPoolCreated(event.memberIds.map(n).join(', '), event.hp, event.max);
    case 'hp_pool_synced':
      return L.hpPoolSynced(Object.values(state.combatants).filter((c) => c.poolId === event.poolId).map((c) => c.name).join(', '), event.hp);
    case 'rouse_roll':
      return L.rouse(n(event.actorId), event.roll, event.pct, event.success);
    case 'stood_up':
      return L.stoodUp(n(event.actorId), event.cost);
    case 'grappled':
      return L.grappled(n(event.targetId), n(event.by), event.label, event.escapeDc, event.restrained);
    case 'grapple_ended':
      return L.grappleEnded(n(event.targetId), event.reason);
    case 'grapple_escape':
      return L.grappleEscape(n(event.actorId), skillLabel(event.skill), event.d20.join(' / '), event.total, event.dc, event.success);
  }
}

export function describeEvents(events: BattleEvent[], state: BattleState): string[] {
  return events.map((e) => describeEvent(e, state)).filter((line) => line !== '');
}
