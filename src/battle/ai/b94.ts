/**
 * Görev B94 (kural sürümü 94): Druid, Paladin ve Ranger özelliklerinin yapay zekâ kararları (basit kurallar, yalnız 94+;
 * sınıf adı yok, özellik etkisinin türünden). Komutu motor dener (`ok`: ai.ts `tryCmd`); aday sayısı küçük (YZ süresi).
 * - Land's Aid (`landsAid`): 0 HP'deki dost alandaysa onu kaldırmak için, yoksa iki ya da daha çok düşman kümesine.
 * - Nature's Sanctuary (`sanctuary`): yarı canın altındaki kendisi ya da bitişik dost, yakında düşman varken.
 */
import { distance, type Offset } from '../../rules/hex';
import { b94On } from '../b94Surum';
import { resourceLeft, type BattleState, type Combatant, type Command, type UsableFeature } from '../types';

type Ok = (c: Command) => boolean;
/** Bu modülün baktığı özellik etkisi türleri (ai.ts ön süzgeci). */
export const B94_KINDS = ['landsAid', 'sanctuary', 'nimbus', 'abjure', 'healPool', 'condition', 'tempHp'];
const ftBetween = (a: Offset, b: Offset) => distance(a, b) * 5;
const usable = (actor: Combatant, f: UsableFeature) => !f.resource || resourceLeft(actor, f.resource) > 0;

/** Eylemle kullanılan Druid kararları (Land's Aid, Nature's Sanctuary). */
export function druidChoice94(state: BattleState, actor: Combatant, foes: Combatant[], canAct: boolean, ok: Ok): Command | null {
  if (!b94On(state) || !canAct || !actor.pos || !state.map || foes.length === 0) return null;
  const feats = actor.features ?? [];
  const allies = Object.values(state.combatants).filter((c) => c.side === actor.side && !c.civilian && !c.summon && c.life !== 'dead' && !!c.pos);
  const aid = feats.find((f) => f.effect.kind === 'landsAid' && usable(actor, f));
  if (aid && aid.effect.kind === 'landsAid') {
    const e = aid.effect;
    const r = Math.round(e.radiusFt / 5);
    const down = allies.find((c) => c.hp <= 0 && ftBetween(actor.pos!, c.pos!) <= e.rangeFt);
    const spots: Offset[] = down ? [down.pos!] : foes.filter((c) => c.pos && ftBetween(actor.pos!, c.pos) <= e.rangeFt)
      .map((c) => ({ at: c.pos!, n: foes.filter((o) => o.pos && distance(o.pos, c.pos!) <= r).length }))
      .filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 2).map((x) => x.at);
    for (const to of spots) {
      const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: aid.key, to };
      if (ok(cmd)) return cmd;
    }
  }
  const sanct = feats.find((f) => f.effect.kind === 'sanctuary' && usable(actor, f));
  if (sanct && !state.map.zones?.some((z) => z.casterId === actor.id && z.spellId === `feature:${sanct.key}`)) {
    const hurt = allies.filter((c) => c.hp > 0 && c.hp < c.maxHp / 2 && distance(c.pos!, actor.pos!) <= 1);
    const near = foes.some((c) => c.pos && ftBetween(c.pos, actor.pos!) <= 30);
    if (hurt.length && near) {
      const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: sanct.key, to: actor.pos };
      if (ok(cmd)) return cmd;
    }
  }
  return null;
}

/**
 * Görev B94 (94+, basit kurallar): Paladin.
 * - Holy Nimbus (`nimbus`, bonus eylem): etkin değilken, kullanımı varken (YZ 5. seviye slot harcamaz) ve aurada düşman varken.
 * - Abjure Foes (`abjure`, eylem): 60 ft içinde Frightened olmayan en az iki düşman.
 * - Lay On Hands (`healPool`, durum temizleme): bitişik dostta (ya da kendinde) kaldırılabilir durum varken.
 */
export function paladinChoice94(state: BattleState, actor: Combatant, foes: Combatant[], canAct: boolean, ok: Ok): Command | null {
  if (!b94On(state) || foes.length === 0) return null;
  const feats = actor.features ?? [];
  const within = (c: Combatant, ft: number) => !state.map || (!!c.pos && !!actor.pos && ftBetween(c.pos, actor.pos) <= ft);
  if (!actor.economy.bonus) {
    const nimbus = feats.find((f) => f.effect.kind === 'nimbus' && !!f.resource && resourceLeft(actor, f.resource) > 0);
    if (nimbus && nimbus.effect.kind === 'nimbus' && !(actor.effects ?? []).some((e) => e.id === nimbus.key) && foes.some((c) => within(c, nimbus.effect.kind === 'nimbus' ? nimbus.effect.radiusFt : 30))) {
      const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: nimbus.key };
      if (ok(cmd)) return cmd;
    }
    const pool = feats.find((f) => f.effect.kind === 'healPool' && usable(actor, f));
    if (pool && pool.effect.kind === 'healPool') {
      const cures = pool.effect.cures;
      const ally = Object.values(state.combatants).find((c) => c.side === actor.side && c.hp > 0 && !c.civilian && !c.summon
        && (c.id === actor.id || (!!c.pos && !!actor.pos && distance(c.pos, actor.pos) <= 1)) && c.conditions.some((x) => cures.includes(x) && x !== 'Poisoned'));
      const cmd: Command | null = ally ? { type: 'use_feature', actorId: actor.id, feature: pool.key, targetId: ally.id, amount: 0, cure: true } : null;
      if (cmd && ok(cmd)) return cmd;
    }
  }
  if (canAct) {
    const abjure = feats.find((f) => f.effect.kind === 'abjure' && usable(actor, f));
    if (abjure && abjure.effect.kind === 'abjure') {
      const open = foes.filter((c) => within(c, abjure.effect.kind === 'abjure' ? abjure.effect.rangeFt : 60) && !c.conditions.includes('Frightened'));
      const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: abjure.key };
      if (open.length >= 2 && ok(cmd)) return cmd;
    }
  }
  return null;
}

/**
 * Görev B94 (94+, basit kurallar; etki türünden): Ranger.
 * - Nature's Veil (`condition` Invisible, bonus eylem): canı yarının altında, Invisible değilken ve 30 ft içinde düşman varken.
 * - Tireless (`tempHp`, eylem): canı üçte birin altında, geçici HP'si yokken (eylemi saldırı yerine harcar).
 */
export function rangerChoice94(state: BattleState, actor: Combatant, foes: Combatant[], canAct: boolean, ok: Ok): Command | null {
  if (!b94On(state) || foes.length === 0 || actor.hp <= 0) return null;
  const feats = actor.features ?? [];
  const near = foes.some((c) => !state.map || (!!c.pos && !!actor.pos && ftBetween(c.pos, actor.pos) <= 30));
  if (!actor.economy.bonus && actor.hp < actor.maxHp / 2 && near && !actor.conditions.includes('Invisible')) {
    const veil = feats.find((f) => f.effect.kind === 'condition' && f.effect.condition === 'Invisible' && f.type === 'bonus' && usable(actor, f));
    const cmd: Command | null = veil ? { type: 'use_feature', actorId: actor.id, feature: veil.key } : null;
    if (cmd && ok(cmd)) return cmd;
  }
  if (canAct && actor.hp < actor.maxHp / 3 && (actor.tempHp ?? 0) <= 0) {
    const tireless = feats.find((f) => f.effect.kind === 'tempHp' && usable(actor, f));
    const cmd: Command | null = tireless ? { type: 'use_feature', actorId: actor.id, feature: tireless.key } : null;
    if (cmd && ok(cmd)) return cmd;
  }
  return null;
}
