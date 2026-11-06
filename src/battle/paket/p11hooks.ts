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
import { registerCommandEnd } from '../turnHooks';
import { flatNum, formul, val } from './core';
import { p11On, prims } from './p11';

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

// ------------------------------------------------------------------ güç deposu (sayaç)

const DEPO = (id: string) => `pk-depo:${id}`;

/** Komut sonu: `gucDeposu.olay` her gerçekleşmede sayaç +1 (en çok `enCok`). */
registerCommandEnd((before, next, events) => {
  if (!p11On(next)) return [];
  const out: BattleEvent[] = [];
  for (const c of Object.values(next.combatants)) {
    for (const r of prims(c, 'gucDeposu')) {
      const olay = val<string>(r.p, 'olay');
      const n = olay === 'buyuYuvasi' ? events.filter((e) => e.type === 'slot_spent' && e.actorId === c.id).length
        : olay === 'hasarAlinca' ? ((before.combatants[c.id]?.hp ?? 0) > c.hp ? 1 : 0)
          : events.filter((e) => e.type === 'attack_resolved' && e.targetId === c.id && !e.hit).length;
      if (!n) continue;
      const have = c.effects?.find((e) => e.id === DEPO(c.id))?.pkCharge ?? 0;
      const max = flatNum(val(r.p, 'enCok'), c) || 99;
      const now = Math.min(max, have + n);
      if (now === have) continue;
      out.push({ type: 'effect_added', targetId: c.id, effect: { id: DEPO(c.id), name: (r.p.ad as string | undefined) ?? r.feat.ad, sourceId: c.id, pkCharge: now, icon: '🔋' } });
      break;
    }
  }
  return out;
});

/** İsabette depo boşaltılır: sayaç × zar ek hasar (seçim). */
registerHitHook((state, actor, target, ctx, rng) => {
  if (!p11On(state)) return null;
  const fx = actor.effects?.find((e) => e.id === DEPO(actor.id));
  const r = prims(actor, 'gucDeposu')[0];
  if (!fx?.pkCharge || !r) return null;
  const pick = askChoice(rng, { actorId: actor.id, sourceId: target.id, label: `${fx.name}: ${fx.pkCharge} güç`,
    options: [{ id: 'use', label: `+${fx.pkCharge}×${formul(r.p.zar, actor)}` }, { id: 'keep', label: 'Sakla' }], suggested: target.hp > 0 ? 'use' : 'keep' });
  if (pick !== 'use') return null;
  const die = formul(r.p.zar, actor);
  const m = /^(\d+)d(\d+)(.*)$/.exec(die);
  const expr = m ? `${Number(m[1]) * fx.pkCharge}d${m[2]}${m[3]}` : String((Number(die) || 0) * fx.pkCharge);
  const roll = rollDice(expr, rollTag(rng, { kind: 'damage', by: actor.id }), ctx.critical);
  const type = val<string>(r.p, 'hasarTuru') ?? ctx.weaponType;
  const adj = adjustDamage(roll.total, type, damageProfile(target));
  return { extras: [{ label: fx.name, rolls: roll.rolls, raw: roll.total, applied: adj.amount, type, note: adj.note }], after: [() => [drop(actor.id, fx)]] };
});
