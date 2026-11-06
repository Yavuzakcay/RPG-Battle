/**
 * Kuyruk P11 (kural sürümü 42): kancalara bağlanan P11 parçaları (`index.ts` içe aktarır).
 * - İlham zarı hasara (`ilham.hedefler: hasar`): ilhamlı yaratık silahla isabet edince zarı hasara ekleyebilir (seçim
 *   istemi `askChoice`; öneri: hedef ölmüyorsa saklamak yerine ekle). Zar harcanır (etki biter).
 * - İlham zarı AC'ye (`ilham.hedefler: ac`): ilhamlı yaratık saldırıyla vurulunca tepkisiyle zarı atıp AC'ye ekler;
 *   ıskaya dönerse saldırı ıska. Zar harcanır.
 * Saf; zar `rng` ile.
 */
import { adjustDamage } from '../../rules/damage';
import { askChoice } from '../../rules/choice';
import { askReaction } from '../../rules/reactionChoice';
import { rollDice, rollTag } from '../../rules/dice';
import { damageProfile } from '../common';
import { registerHitHook } from '../hitHooks';
import { canReact, reactionUsed, registerAllyHit } from '../reactions';
import type { ActiveEffect, BattleEvent } from '../types';
import { p11On } from './p11';

const inspireFx = (c: { effects?: ActiveEffect[] } | undefined, use: 'damage' | 'ac') => c?.effects?.find((e) => e.inspire && e.inspireUses?.includes(use));
const drop = (targetId: string, e: ActiveEffect): BattleEvent => ({ type: 'effect_ended', targetId, effectId: e.id, name: e.name, reason: 'used' });

registerHitHook((state, actor, target, ctx, rng) => {
  if (!p11On(state) || ctx.spell) return null;
  const e = inspireFx(actor, 'damage');
  if (!e?.inspire) return null;
  const pick = askChoice(rng, { actorId: actor.id, sourceId: target.id, label: `${e.name}: zarı hasara ekle`,
    options: [{ id: 'use', label: `+${e.inspire}` }, { id: 'keep', label: 'Sakla' }], suggested: 'use' });
  if (pick !== 'use') return null;
  const roll = rollDice(e.inspire, rollTag(rng, { kind: 'damage', by: actor.id }), ctx.critical);
  const adj = adjustDamage(roll.total, ctx.weaponType, damageProfile(target));
  return { extras: [{ label: e.name, rolls: roll.rolls, raw: roll.total, applied: adj.amount, type: ctx.weaponType, note: adj.note }], after: [() => [drop(actor.id, e)]] };
});

registerAllyHit((state, ctx, rng) => {
  if (!p11On(state) || ctx.critical) return null;
  const t = ctx.target;
  const e = inspireFx(t, 'ac');
  if (!e?.inspire || !canReact(t)) return null;
  const opt = { id: 'p11-ilham-ac', name: `${e.name}: AC +${e.inspire}` };
  const ans = askReaction(rng, { reactorId: t.id, trigger: 'hit', sourceId: ctx.attacker.id, info: { label: ctx.label, total: ctx.total, ac: ctx.ac, damage: ctx.damage },
    options: [opt], suggested: ctx.total < ctx.ac + Number(/d(\d+)/.exec(e.inspire)?.[1] ?? 0) ? { option: opt.id } : null });
  if (ans?.option !== opt.id) return null;
  const v = rollDice(e.inspire, rollTag(rng, { kind: 'damage', by: t.id })).total;
  const events: BattleEvent[] = [reactionUsed(t, opt, 'hit', ctx.attacker.id), drop(t.id, e),
    { type: 'map_note', text: `${t.name}: ${e.name} → AC +${v} (${ctx.ac + v})` }];
  // Iska: hasar verilmez; isabet kalırsa hasar aynı.
  return ctx.total < ctx.ac + v ? { events, name: e.name } : { events, name: e.name, damage: ctx.damage };
});
