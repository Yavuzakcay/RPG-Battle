/**
 * Silah ustalığı etkileri savaşta (Weapon Mastery, SRD 5.2.1). Saldırı çözüldükten sonra seçeneğin
 * `mastery` alanına göre otomatik uygulanır; etkiler mevcut sistemleri kullanır:
 * - Cleave: isabette ilk hedefin 5 ft yakınındaki ve erişimdeki ikinci düşmana ek saldırı (turda bir kez).
 * - Graze: ıskada yetenek değiştiricisi kadar hasar.
 * - Push: isabette 10 ft uzağa itme (`pushAwayEvents`; en çok Large). Yakın dövüşte eylemin son saldırısında.
 * - Sap / Slow / Vex: süreli işaret (`Combatant.marks`); süre tur başı/sonu sayacıyla reducer'da düşer.
 * - Topple: CON save, başarısızsa Prone (`condition_changed`).
 * Nick saldırıya değil yan el ek saldırısının ekonomisine etki eder (`economy.ts` `offhand_attack`, Görev P1).
 * Parametreler `data/class-features.json` "masteries"ten.
 */
import { saveDice } from './effectDice';
import { resolveSave } from '../rules/attack';
import { autoFailsStrDexSave } from '../rules/conditions';
import { adjustDamage } from '../rules/damage';
import { rollTag, type Rng } from '../rules/dice';
import { distance } from '../rules/hex';
import { masteryMechanic } from '../rules/mastery';
import type { ModeSource } from '../rules/modes';
import { isTargetable, damageProfile } from './common';
import { heightOf } from './cover';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { turnKey } from './economy';
import { pushAwayEvents, sizeRank } from './forced';
import { checkReach, optionReach } from './range';
import { applyEvents } from './reduce';
import type { AttackOption, BattleEvent, BattleState, Combatant, MasteryMark } from './types';

const profileOf = (c: Combatant) => damageProfile(c);
const alive = (c: Combatant | undefined): c is Combatant => !!c && c.hp > 0 && isTargetable(c);
const isOwnTurn = (state: BattleState, id: string) => state.order[state.turnIndex] === id;

/**
 * Saldırı zarına işaretlerden gelen avantaj/dezavantaj ve kullanılıp kalkan işaretler. Sap: saldıranın
 * bir sonraki saldırısı dezavantajlı. Vex: saldıranın işaretli hedefe bir sonraki saldırısı avantajlı.
 * Kalkma olayları saldırıdan önce gelir (aynı saldırının koyduğu yeni işaret silinmesin).
 */
export function markSources(actor: Combatant, target: Combatant, option?: AttackOption): { sources: ModeSource[]; used: BattleEvent[] } {
  const sources: ModeSource[] = [];
  const used: BattleEvent[] = [];
  // Reckless Attack: kendi STR saldırıları avantajlı; Reckless olana yapılan saldırılar avantajlı (işaret kalkmaz).
  if (option?.ability === 'str' && !option.spell && (actor.marks ?? []).some((m) => m.kind === 'reckless')) {
    sources.push({ effect: 'advantage', reason: 'Reckless Attack' });
  }
  if ((target.marks ?? []).some((m) => m.kind === 'reckless')) sources.push({ effect: 'advantage', reason: 'Reckless Attack (hedef)' });
  // Multiattack Defense (Görev F): hedefe bu tur isabet ettiyse diğer saldırıları dezavantajlı.
  if ((target.marks ?? []).some((m) => m.kind === 'mdefense' && m.targetId === actor.id)) sources.push({ effect: 'disadvantage', reason: 'Multiattack Defense' });
  for (const m of actor.marks ?? []) {
    if (m.kind === 'sap') {
      sources.push({ effect: 'disadvantage', reason: 'Sap' });
      used.push({ type: 'mastery_mark_used', holderId: actor.id, kind: 'sap', by: m.by });
    }
    // Studied Attacks (Görev F): ıskaladığı yaratığa bir sonraki saldırısı avantajlı; kullanılınca kalkar.
    if (m.kind === 'studied' && m.targetId === target.id) {
      sources.push({ effect: 'advantage', reason: 'Studied Attacks' });
      used.push({ type: 'mastery_mark_used', holderId: actor.id, kind: 'studied', by: m.by, targetId: target.id });
    }
    if (m.kind === 'vex' && m.targetId === target.id) {
      sources.push({ effect: 'advantage', reason: 'Vex' });
      used.push({ type: 'mastery_mark_used', holderId: actor.id, kind: 'vex', by: m.by, targetId: target.id });
    }
  }
  return { sources, used };
}

type Attack = (state: BattleState, actor: Combatant, target: Combatant, option: AttackOption) => BattleEvent[];

/** Cleave'in ikinci hedefi: ilk hedefin 5 ft yakınında, erişimde, en az HP'li düşman (eşitse sırada önce gelen). */
function cleaveTarget(state: BattleState, actor: Combatant, first: Combatant, option: AttackOption): Combatant | undefined {
  return state.order
    .map((id) => state.combatants[id])
    .filter((c): c is Combatant => alive(c) && c.id !== first.id && c.id !== actor.id && c.side !== actor.side && !c.civilian && !c.hidden)
    .filter((c) => (state.map
      ? !!c.pos && !!first.pos && distance(c.pos, first.pos) <= 1
      : heightOf(state, c) === heightOf(state, first)))
    .filter((c) => checkReach(state, actor, c, optionReach(option)).ok)
    .sort((a, b) => a.hp - b.hp)[0];
}

/** Cleave hasarı: yetenek değiştiricisi eklenmez (negatifse eklenir). */
function cleaveDamage(option: AttackOption): string {
  const base = option.weaponDamage ?? option.damage;
  const mod = option.abilityMod ?? 0;
  return mod < 0 ? `${base}${mod}` : base;
}

/** Bu saldırı Attack eyleminin son saldırısı mı (yakın dövüşte Push buna bakar). */
function lastAttackOfAction(actor: Combatant): boolean {
  const left = actor.economy.attacksLeft > 0 ? actor.economy.attacksLeft - 1 : actor.attacksPerAction - 1;
  return left <= 0;
}

/**
 * Saldırının ustalık olayları. `state` saldırı olayı uygulanmış durum; `before` saldırıdan önceki saldıran
 * (eylem ekonomisi için). Olay yoksa boş liste.
 */
export function masteryEvents(
  state: BattleState, before: Combatant, targetId: string, option: AttackOption,
  hit: { hit: boolean; appliedDamage: number; opportunity: boolean }, rng: Rng, attack: Attack,
): BattleEvent[] {
  const id = option.mastery;
  const mech = id ? masteryMechanic(id) : undefined;
  const actor = state.combatants[before.id];
  const target = state.combatants[targetId];
  if (!id || !mech || mech.status === 'missing' || !actor || !target) return [];
  const base = { type: 'mastery_applied' as const, actorId: actor.id, targetId, mastery: id, label: option.label };
  const markEvent = (holderId: string, mark: MasteryMark): BattleEvent => ({ ...base, mark: { holderId, mark } });
  const damaged = hit.hit && hit.appliedDamage > 0;

  switch (id) {
    case 'graze': {
      if (hit.hit || !isTargetable(target)) return [];
      const amount = Math.max(0, option.abilityMod ?? 0);
      if (amount === 0) return [];
      const type = option.damageType ?? '';
      const adj = adjustDamage(amount, type, profileOf(target));
      const fx = damageEffects(target, adj.amount, type, false, rng);
      return [{ ...base, damage: { raw: amount, applied: adj.amount, type, note: adj.note }, hpAfter: fx.hpAfter, effects: fx.effects }];
    }
    case 'cleave': {
      if (!hit.hit || option.ranged || actor.cleaveTurn === turnKey(state)) return [];
      const second = cleaveTarget(state, actor, target, option);
      if (!second) return [];
      const mark: BattleEvent = { ...base, targetId: second.id, turn: turnKey(state) };
      const after = applyEvents(state, [mark]);
      const swing = { ...option, damage: cleaveDamage(option), label: `${option.label} (Cleave)` };
      delete swing.mastery;
      return [mark, ...attack(after, after.combatants[actor.id] as Combatant, after.combatants[second.id] as Combatant, swing)];
    }
    case 'push': {
      if (!hit.hit || !alive(target) || !state.map || !actor.pos || !target.pos) return [];
      if (sizeRank(target.size) > sizeRank(mech.maxSize ?? 'L')) return [];
      if (!option.ranged && !hit.opportunity && !lastAttackOfAction(before)) return [];
      const pushed = pushAwayEvents(state, actor.pos, target.id, mech.feet ?? 10, actor.id, rng);
      return pushed.length > 0 ? [base, ...pushed] : [];
    }
    case 'sap':
      return hit.hit && alive(target) ? [markEvent(target.id, { kind: 'sap', by: actor.id, end: 'turnStart', count: 1 })] : [];
    case 'slow':
      return damaged && alive(target)
        ? [markEvent(target.id, { kind: 'slow', by: actor.id, end: 'turnStart', count: 1, feet: mech.feet ?? 10 })]
        : [];
    case 'vex':
      return damaged && alive(target)
        ? [markEvent(actor.id, { kind: 'vex', by: actor.id, targetId: target.id, end: 'turnEnd', count: isOwnTurn(state, actor.id) ? 2 : 1 })]
        : [];
    case 'topple': {
      if (!hit.hit || !alive(target)) return [];
      const ability = mech.save ?? 'con';
      const dc = option.masteryDc ?? 8;
      const r = resolveSave({
        extra: saveDice(target, ability), modifier: target.saves[ability], dc, mode: saveMode('normal', target, ability),
        autoFail: (ability === 'str' || ability === 'dex') && autoFailsStrDexSave(target.conditions),
      }, rollTag(rng, { by: target.id }));
      const save = { ability, dc, d20: r.d20?.rolls ?? [], natural: r.d20?.kept ?? null, total: r.total, success: r.success };
      const prone: BattleEvent[] = !r.success && !target.conditions.includes('Prone')
        ? [{ type: 'condition_changed', targetId: target.id, condition: 'Prone', present: true, reason: 'Topple' }]
        : [];
      return [{ ...base, save, ...(r.extra ? { bonusDice: r.extra } : {}) }, ...prone];
    }
    default:
      return [];
  }
}
