/**
 * Kuyruk 19 (anahtar `featuresK19`, kural sürümü 16): Find Steed'in Otherworldly Steed stat bloğu (SRD 5.2.1).
 * - Life Bond: sahip 1.+ seviye büyüyle HP kazanınca at 5 ft içindeyse aynı miktarı kazanır (`lifeBondEvents`).
 * - Bonus eylemler (atın kendi turunda; uzun dinlenmeye dek bir kez = savaşta bir kez): Fell Glare (Fiend: 60 ft görülen
 *   yaratık WIS save, sahibin büyü DC'si; başarısızsa sahibin sonraki turunun sonuna dek Frightened), Fey Step (Fey: 60 ft
 *   boş altıgene ışınlanma), Healing Touch (Celestial: 5 ft içindeki yaratık 2d8 + büyü seviyesi HP).
 * Binek olarak kullanma (mounted combat) SRD denetiminde ayrı ele alınır.
 */
import { distance, type Offset } from '../rules/hex';
import { resolveSave } from '../rules/attack';
import { applyHealing } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { fail, finish, type CommandResult } from './common';
import { saveDice } from './effectDice';
import { saveMode, timedCondition } from './durations';
import { canSee } from './maprules';
import { featuresOn } from './shift';
import { teleportEvent, teleportProblem } from './teleport';
import { withArrival } from './motion';
import type { BattleEvent, BattleState, Combatant } from './types';

export type SteedAction = 'fell-glare' | 'fey-step' | 'healing-touch';
const NEEDS: Record<SteedAction, string> = { 'fell-glare': 'fiend', 'fey-step': 'fey', 'healing-touch': 'celestial' };
const isSteed = (c: Combatant) => c.summon?.spellId === 'find-steed' && !c.summon.gone && c.hp > 0;

export function steedActions(state: BattleState, steed: Combatant): SteedAction[] {
  if (!featuresOn(state) || !isSteed(steed)) return [];
  return (Object.keys(NEEDS) as SteedAction[]).filter((k) => steed.summon?.choice === NEEDS[k] && !steed.traitTurns?.[k]);
}

export function executeSteedAction(state: BattleState, steed: Combatant, kind: SteedAction, rng: Rng, targetId?: string, to?: Offset): CommandResult {
  if (!steedActions(state, steed).includes(kind)) return fail('Bu at bu bonus eylemi yapamaz (tür ya da kullanılmış).');
  const owner = state.combatants[steed.summon?.by ?? ''];
  const mark: BattleEvent = { type: 'trait_turn', actorId: steed.id, trait: kind, key: 'used' };
  if (kind === 'fey-step') {
    if (!to) return fail('Işınlanılacak altıgeni seç.');
    const why = teleportProblem(state, steed, to, { rangeFt: 60, sight: false });
    if (why) return fail(why);
    return finish(state, [mark, ...withArrival(state, [mark], [teleportEvent(steed, to, 'Fey Step')], rng)]);
  }
  const t = targetId ? state.combatants[targetId] : undefined;
  if (!t || t.hp <= 0 && kind === 'fell-glare') return fail('Hedef bulunamadı.');
  if (kind === 'healing-touch') {
    if (steed.pos && t.pos && distance(steed.pos, t.pos) > 1) return fail('Healing Touch: 5 ft içinde olmalı.');
    if (t.life === 'dead') return fail('Ölü iyileşmez.');
    const roll = rollDice(`2d8+${steed.summon?.level ?? 2}`, rollTag(rng, { kind: 'heal', by: steed.id }));
    const after = applyHealing(t.hp, t.maxHp, roll.total);
    return finish(state, [mark, { type: 'healed', actorId: steed.id, targetId: t.id, label: 'Healing Touch', amount: after - t.hp, targetHpAfter: after }]);
  }
  // Fell Glare
  if (t.side === steed.side) return fail('Fell Glare bir düşmana.');
  if (steed.pos && t.pos && distance(steed.pos, t.pos) > 12) return fail('Fell Glare: 60 ft içinde olmalı.');
  if (!canSee(state, steed, t)) return fail(`${t.name} görülmüyor.`);
  const dc = owner?.spellSaveDc ?? 10;
  const r = resolveSave({ extra: saveDice(t, 'wis'), modifier: t.saves.wis, dc, mode: saveMode('normal', t, 'wis') }, rollTag(rng, { by: t.id }));
  const evs: BattleEvent[] = [mark, { type: 'condition_save', targetId: t.id, condition: 'Frightened', ability: 'wis', dc, d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success,
    ...(r.extra ? { bonusDice: r.extra } : {}) }];
  if (!r.success && owner) evs.push(timedCondition(state, t.id, { condition: 'Frightened', owner: 'source', end: 'turnEnd', rounds: 1 }, owner.id, 'Fell Glare'));
  return finish(state, evs);
}

/** Life Bond: 1.+ seviye büyüyle sahibe gelen iyileşme, 5 ft içindeki ata da. */
export function lifeBondEvents(state: BattleState, events: BattleEvent[], spellLevel: number): BattleEvent[] {
  if (!featuresOn(state) || spellLevel < 1) return [];
  const out: BattleEvent[] = [];
  for (const e of events) {
    if (e.type !== 'healed' || e.amount <= 0) continue;
    const steed = Object.values(state.combatants).find((c) => isSteed(c) && c.summon?.by === e.targetId);
    const owner = state.combatants[e.targetId];
    if (!steed || !owner?.pos || !steed.pos || distance(owner.pos, steed.pos) > 1 || steed.hp >= steed.maxHp) continue;
    const after = applyHealing(steed.hp, steed.maxHp, e.amount);
    out.push({ type: 'healed', actorId: e.actorId, targetId: steed.id, label: 'Life Bond', amount: after - steed.hp, targetHpAfter: after });
  }
  return out;
}
