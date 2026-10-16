/** Canavar saldırıları: şablondan gelen saldırılar, nefes (save), Recharge ve Multiattack. */
import { getEnvironment } from '../data';
import { resolveAttack, resolveSave } from '../rules/attack';
import { attackSources, autoFailsStrDexSave, isAutoCritical } from '../rules/conditions';
import { adjustDamage, halfDamage } from '../rules/damage';
import { rollD20, rollDice, type Rng } from '../rules/dice';
import { combineModes, environmentSources, invertMode, underwaterSources } from '../rules/modes';
import { damageEffects } from './damage-effects';
import { fail, finish, isTargetable, type CommandResult, type Failure } from './common';
import { applyEvents } from './reduce';
import { checkReach, monsterAttackReach } from './range';
import { heightOf } from './cover';
import { isUnderwater } from './maprules';
import { distance } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant } from './types';

const profileOf = (t: Combatant) => ({
  resistances: t.resistances,
  immunities: t.immunities,
  vulnerabilities: t.vulnerabilities,
});

/** Tek bir canavar saldırısını çözer ve olaylarını döndürür. */
export function monsterAttackEvents(
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  index: number,
  rng: Rng,
): { ok: true; events: BattleEvent[] } | Failure {
  const atk = actor.attacks[index];
  if (!atk) return fail('Böyle bir saldırı yok.');
  if (atk.recharge && actor.rechargeUsed.includes(index)) return fail(`${atk.name} henüz şarj olmadı.`);
  const inReach = checkReach(state, actor, target, monsterAttackReach(atk));
  if (!inReach.ok) return { ok: false, error: `${atk.name}: ${inReach.error}` };

  const env = getEnvironment(state.environmentId);
  const tag = `${actor.casterTag} ${atk.name} ${atk.text}`.toLowerCase();
  const events: BattleEvent[] = [];

  if (atk.save) {
    // Nefes gibi: hedef save yapar, başarılıysa hasar yarıya iner (veya hiç olmaz).
    const reasons = environmentSources(env, tag);
    const mode = invertMode(combineModes(reasons));
    const autoFail =
      (atk.save.ability === 'str' || atk.save.ability === 'dex') && autoFailsStrDexSave(target.conditions);
    const dexCover = atk.save.ability === 'dex' ? inReach.cover : 0;
    const save = resolveSave(
      { modifier: target.saves[atk.save.ability] + dexCover, dc: atk.save.dc, mode, autoFail },
      rng,
    );
    const raw = atk.damageDice ? rollDice(atk.damageDice, rng) : { rolls: [] as number[], total: 0 };
    const amount = !save.success ? raw.total : atk.save.halfOnSave ? halfDamage(raw.total) : 0;
    const adj = amount > 0 ? adjustDamage(amount, atk.damageType, profileOf(target)) : { amount: 0, note: null };
    const fx = damageEffects(target, adj.amount, atk.damageType ?? '', false, rng);
    events.push({
      type: 'save_resolved', actorId: actor.id, targetId: target.id, label: atk.name,
      ability: atk.save.ability, dc: atk.save.dc, mode, reasons: reasons.map((r) => r.reason),
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: raw.rolls, rawDamage: raw.total, appliedDamage: adj.amount, damageType: atk.damageType ?? '',
      damageNote: adj.note, targetHpAfter: fx.hpAfter, conditionsAdded: [], effects: fx.effects,
      ...(atk.rider ? { rider: atk.rider } : {}),
      ...(dexCover ? { cover: dexCover } : {}),
    });
  } else {
    const allyAlive = Object.values(state.combatants).some(
      (c) => c.id !== actor.id && c.side === actor.side && c.hp > 0,
    );
    const beyond = !!atk.range && !!actor.pos && !!target.pos && distance(actor.pos, target.pos) * 5 > atk.range[0];
    const water = isUnderwater(state, actor) ? underwaterSources(atk.ranged, atk.damageType, beyond) : { sources: [], autoMiss: false };
    const sources = [
      ...environmentSources(env, tag, { weapon: true, ranged: atk.ranged }),
      ...attackSources({
        attackerConditions: actor.conditions, targetConditions: target.conditions,
        attackerHeight: heightOf(state, actor), targetHeight: heightOf(state, target), ranged: atk.ranged, spell: false,
        packTactics: actor.packTactics && allyAlive, targetAsleep: target.asleep === true,
      }),
      ...inReach.sources,
      ...water.sources,
    ];
    const mode = combineModes(sources);
    const targetAc = target.ac + inReach.cover;
    let d20: number[];
    let natural: number;
    let total: number;
    let hit: boolean;
    let critical: boolean;
    let fumble: boolean;
    let rolls: number[] = [];
    let raw = 0;
    if (atk.damageDice) {
      const res = resolveAttack(
        { attackBonus: atk.bonus, targetAc, mode, damage: atk.damageDice, autoCritical: isAutoCritical(target.conditions, atk.ranged) },
        rng,
      );
      d20 = res.d20.rolls; natural = res.d20.kept; total = res.total; hit = res.hit;
      critical = res.critical; fumble = res.fumble; rolls = res.damage?.rolls ?? []; raw = res.damage?.total ?? 0;
    } else {
      // Hasar zarı olmayan saldırı (Web gibi): yalnızca isabet belirlenir, etkisi elle uygulanır.
      const r = rollD20(mode, rng);
      d20 = r.rolls; natural = r.kept; total = natural + atk.bonus; fumble = natural === 1;
      hit = natural === 20 || (!fumble && total >= targetAc); critical = natural === 20;
    }
    // Su altında menzilli silahla normal menzil ötesine atış otomatik ıskalar (SRD 5.2.1).
    if (water.autoMiss) { hit = false; critical = false; rolls = []; raw = 0; }
    const adj = hit && raw > 0 ? adjustDamage(raw, atk.damageType, profileOf(target)) : { amount: 0, note: null };
    const fx = damageEffects(target, adj.amount, atk.damageType ?? '', critical, rng);
    events.push({
      type: 'attack_resolved', actorId: actor.id, targetId: target.id, label: atk.name, mode,
      reasons: sources.map((s) => s.reason), d20, natural, total, targetAc, hit, critical, fumble,
      damageRolls: rolls, rawDamage: raw, appliedDamage: adj.amount, damageType: atk.damageType ?? '',
      damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects,
      ...(atk.rider && hit ? { rider: atk.rider } : {}),
      ...(inReach.cover ? { cover: inReach.cover } : {}),
    });
  }
  if (atk.recharge) events.push({ type: 'recharge_used', actorId: actor.id, attackIndex: index });
  return { ok: true, events };
}

function checkTarget(state: BattleState, actor: Combatant, targetId: string): Combatant | Failure {
  const target = state.combatants[targetId];
  if (!target) return fail('Hedef bulunamadı.');
  if (target.id === actor.id) return fail('Kendine saldıramazsın.');
  if (!isTargetable(target)) return fail('Hedef zaten düşmüş.');
  return target;
}

export function executeMonsterAttack(
  state: BattleState, actor: Combatant, targetId: string, attackIndex: number, rng: Rng,
): CommandResult {
  const target = checkTarget(state, actor, targetId);
  if ('ok' in target) return target;
  const r = monsterAttackEvents(state, actor, target, attackIndex, rng);
  if (!r.ok) return r;
  return finish(state, r.events);
}

/** Multiattack: Recharge'sız tüm saldırılar, tekrar sayısı kadar sırayla. Hedef düşerse durur. */
export function executeMultiattack(state: BattleState, actor: Combatant, targetId: string, rng: Rng): CommandResult {
  if (!actor.multiattack) return fail('Bu yaratığın Multiattack\'ı yok.');
  const first = checkTarget(state, actor, targetId);
  if ('ok' in first) return first;
  const events: BattleEvent[] = [];
  let current = state;
  for (let i = 0; i < actor.attacks.length; i++) {
    const atk = actor.attacks[i];
    if (!atk || atk.recharge) continue;
    for (let k = 0; k < atk.repeat; k++) {
      const t = current.combatants[targetId];
      if (!t || !isTargetable(t) || (t.hp <= 0 && !t.regenPending)) break;
      const r = monsterAttackEvents(current, actor, t, i, rng);
      if (!r.ok) return r;
      events.push(...r.events);
      current = applyEvents(current, r.events);
    }
  }
  if (events.length === 0) return fail('Yapılacak saldırı yok.');
  return finish(state, events);
}
