/**
 * (fırsat saldırısı + hareketEt: yürüyüş bitince komut sonunda.)
 * Kuyruk P10: ek paket ilkel genişletme 4 (kural sürümü 39+; eski savaşta hiçbiri çalışmaz). Var olan kancalara bağlanır:
 * - `tepki` olayı `hedefAlindi` + etki `avantajSifirla`: hedef alınma kancası (`registerTargeted`, zardan önce); hedefe bu
 *   komutluk `attackedAdv` + `attackedDis` (avantaj ve dezavantaj birbirini götürür, zar normal; SRD kuralı). Komut sonunda
 *   kalkar.
 * - `dusmanYaklasti` (+ `hareketEt` / `hizSifir`): yürüyüş adımı kancası (`registerAfterStep`; düşman sana bitişik oldu).
 * - `buyuBasardi` (+ `hasarEkle`): komut sonu (senin büyün isabet etti ya da hedef kurtulmayı geçemedi).
 * Diğer P10 alanları yorumlayıcıda (`index.ts`, `p9.ts`). Saf; zar `rng` ile. Paketsiz savaşta olay üretmez.
 */
import { gap64 } from '../adjacency';
import { canReact, reactionUsed, registerTargeted } from '../reactions';
import { registerAfterStep, registerCommandEnd } from '../turnHooks';
import { applyEvents } from '../reduce';
import { turnKey } from '../economy';
import { hitEffect } from '../maprules';
import { teleportEvent } from '../teleport';
import { askReaction } from '../../rules/reactionChoice';
import type { Rng } from '../../rules/dice';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from '../types';
import { alive, canPay, costOf, flatNum, formul, kosulOk, p10On, usedKey, usedThisTurn, val, within, type Ilkel, type PaketOzellik } from './core';
import { moveHex } from './p9';

interface Ref { feat: PaketOzellik; p: Ilkel; i: number }
const refs = (c: Combatant | undefined, olay: string): Ref[] =>
  (c?.paket?.ozellikler ?? []).flatMap((feat) => feat.ilkeller.map((p, i) => ({ feat, p, i }))).filter((x) => x.p.tur === 'tepki' && x.p.olay === olay);
const nameOf = (r: Ref) => (r.p.ad as string | undefined) ?? r.feat.ad;
const ready = (state: BattleState, g: Combatant, r: Ref, target?: Combatant) =>
  canPay(g, r.p) && kosulOk(state, g, r.p, target) && !(r.p.turdaBir && usedThisTurn(state, g, r.feat.key, r.i));
const ask = (rng: Rng, g: Combatant, src: Combatant, label: string, opt: { id: string; name: string }, trigger: 'ally' | 'targeted' = 'ally') =>
  askReaction(rng, { reactorId: g.id, trigger, sourceId: src.id, info: { label }, options: [opt], suggested: { option: opt.id } })?.option === opt.id;
/** Tepki + kaynak (`reaction_used.resource`). */
function react(state: BattleState, g: Combatant, r: Ref, src: Combatant, trigger: 'ally' | 'targeted'): BattleEvent[] {
  const k = costOf(g, r.p);
  return [reactionUsed(g, { id: usedKey(r.feat.key, r.i), name: nameOf(r), ...(k ? { resource: k.id } : {}) }, trigger, src.id),
    ...(r.p.turdaBir ? [{ type: 'trait_turn' as const, actorId: g.id, trait: usedKey(r.feat.key, r.i), key: turnKey(state) }] : [])];
}
export const DENGE = (id: string) => `pk-denge:${id}`;

// ------------------------------------------------------------------ hedef alınınca: avantajı sıfırla

registerTargeted((state, attacker, target, rng) => {
  if (!p10On(state) || attacker.side === target.side) return null;
  for (const g of Object.values(state.combatants)) {
    if (!g.paket || g.side !== target.side || !canReact(g) || g.hp <= 0) continue;
    for (const r of refs(g, 'hedefAlindi')) {
      if (r.p.etki !== 'avantajSifirla' || !ready(state, g, r, attacker)) continue;
      if (g.id !== target.id && !within(state, g, target, flatNum(val(r.p, 'menzilFt'), g))) continue;
      if (!ask(rng, g, attacker, nameOf(r), { id: usedKey(r.feat.key, r.i), name: nameOf(r) }, 'targeted')) continue;
      const fx: BattleEvent = { type: 'effect_added', targetId: target.id, effect: { id: DENGE(target.id), name: nameOf(r), sourceId: g.id, attackedAdv: true, attackedDis: true, until: state.round, icon: '⚖' } as ActiveEffect };
      return { events: [...react(state, g, r, attacker, 'targeted'), fx], targetId: target.id };
    }
  }
  return null;
});

// ------------------------------------------------------------------ düşman yaklaşınca

registerAfterStep((state, moverId, from, rng) => {
  if (!p10On(state)) return [];
  const mover = state.combatants[moverId];
  if (!alive(mover) || !mover.pos) return [];
  for (const g of Object.values(state.combatants)) {
    if (!g.paket || g.side === mover.side || !canReact(g) || g.hp <= 0 || !g.pos) continue;
    // Yeni bitişik: önceki altıgen bitişik değildi, şimdiki bitişik.
    const was = gapAt(state, g, from);
    if (gap64(state, g, mover) > 1 || was <= 1) continue;
    for (const r of refs(g, 'dusmanYaklasti')) {
      if (!ready(state, g, r, mover)) continue;
      const etki = r.p.etki as string;
      const to = etki === 'hareketEt' ? moveHex(state, g, mover, val<string>(r.p, 'yon') === 'yakin' ? 'yakin' : 'uzak') : null;
      if (etki === 'hareketEt' && !to) continue;
      if (!ask(rng, g, mover, nameOf(r), { id: usedKey(r.feat.key, r.i), name: nameOf(r) })) continue;
      const out: BattleEvent[] = react(state, g, r, mover, 'ally');
      if (to) out.push(teleportEvent(g, to, nameOf(r)));
      else if (etki === 'hizSifir') out.push({ type: 'effect_added', targetId: mover.id, effect: { id: `pk-hiz0:${g.id}:${mover.id}`, name: nameOf(r), sourceId: g.id, speedZero: true, untilOwnTurnEnd: true, until: state.round + 1, icon: '⛓' } as ActiveEffect });
      return out;
    }
  }
  return [];
});

/** Bir altıgenle yaratık arası uzaklık (tek altıgen; çok altıgenli gövde `gap` ile ölçülür). */
function gapAt(state: BattleState, g: Combatant, at: { col: number; row: number }): number {
  return gap64(state, g, { ...g, id: '__p10', pos: at } as Combatant);
}

// ------------------------------------------------------------------ komut sonu

registerCommandEnd((_before, next, events0, cmd, rng) => {
  if (!p10On(next)) return [];
  const out: BattleEvent[] = [];
  let cur = next;
  const push = (evs: BattleEvent[]) => { if (evs.length) { out.push(...evs); cur = applyEvents(cur, evs); } };
  // Avantaj sıfırlama yalnız o saldırı komutunda.
  for (const c of Object.values(cur.combatants)) {
    const e = c.effects?.find((x) => x.id === DENGE(c.id));
    if (e) push([{ type: 'effect_ended', targetId: c.id, effectId: e.id, name: e.name, reason: 'used' }]);
  }
  // Fırsat saldırın isabet etti → yürüyüş bitince hareket (kaçana yaklaş ya da uzaklaş; tepki zaten harcandı).
  for (const e of events0) {
    if (e.type !== 'attack_resolved' || !e.opportunity || !e.hit) continue;
    const g = cur.combatants[e.actorId];
    const t = cur.combatants[e.targetId];
    for (const r of g?.paket && alive(t) ? refs(g, 'firsatSaldirisi') : []) {
      if (r.p.etki !== 'hareketEt' || !g || !t || !ready(cur, g, r, t)) continue;
      const to = moveHex(cur, cur.combatants[g.id] as Combatant, t, val<string>(r.p, 'yon') === 'yakin' ? 'yakin' : 'uzak');
      if (!to) continue;
      const k = costOf(g, r.p);
      push([...(k ? [{ type: 'feature_used' as const, actorId: g.id, feature: k.id, remaining: (g.resources[k.id] ?? 0) - k.cost }] : []),
        ...(r.p.turdaBir ? [{ type: 'trait_turn' as const, actorId: g.id, trait: usedKey(r.feat.key, r.i), key: turnKey(cur) }] : []),
        teleportEvent(cur.combatants[g.id] as Combatant, to, nameOf(r))]);
      break;
    }
  }
  // Büyün başarılı oldu: isabet ya da başarısız kurtulma → hasarEkle.
  if (cmd.type === 'cast_spell') {
    const g = cur.combatants[cmd.actorId];
    if (g?.paket && canReact(g)) {
      const hitId = events0.flatMap((e) => (e.type === 'attack_resolved' && e.actorId === g.id && e.hit ? [e.targetId]
        : e.type === 'save_resolved' && e.actorId === g.id && !e.success ? [e.targetId] : []))
        .find((id) => { const t = cur.combatants[id]; return alive(t) && t.side !== g.side; });
      const t = hitId ? cur.combatants[hitId] : undefined;
      for (const r of t ? refs(g, 'buyuBasardi') : []) {
        if (r.p.etki !== 'hasarEkle' || !ready(cur, g, r, t) || !t) continue;
        if (!ask(rng, g, t, nameOf(r), { id: usedKey(r.feat.key, r.i), name: nameOf(r) })) continue;
        push([...react(cur, g, r, t, 'ally'), hitEffect(t, 'paket', nameOf(r), { damage: formul(r.p.miktar, g), damageType: val<string>(r.p, 'hasarTuru') }, rng)]);
        break;
      }
    }
  }
  return out;
});
