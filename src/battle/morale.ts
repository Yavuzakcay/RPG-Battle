/**
 * Kuyruk K48 Adım B: Moral, tam mod (ev kuralı `moralSistemi`, kural sürümü 20; `data/moral.json`, `rules/moral.ts`).
 * Savaşa etkisi yalnızca kural açık ve sürüm yeterliyken; eski savaş/replay ve kapalı kural eski davranış.
 * - Savaş başında oyuncu karakterine `moralMax`/`moral` (kayıtlı durumdan; yoksa dolu). 0'la giren "Bunalmış": ilk tur
 *   eylem yok (Incapacitated), hız yarım.
 * - Komut sonunda (`moraleAfterEvents`): dost 0 HP'ye düşünce öbür karakterler, yeni korkan karakter Moral kaybeder.
 *   0'a düşen "Çökmüş": bulunduğu yerde kalır (hız 0), eylem yapamaz (Incapacitated), ona saldırı avantajlı; HP'ye
 *   dokunmaz (HP de 0'a düşerse ölüm/ölmek üzere kuralları aynen). Moral ≥ 1 olunca çökme biter.
 * - `moral_rally` (eylem): çökmüş dosta +1 (veride ek bonus veren özellikler için +1 daha).
 * - Eşikler: Moral ≤ yarı: WIS ve CHA save/kontrollerine −1; ≤ üçte bir: Frightened/Charmed save'lerinde dezavantaj.
 * Saf.
 */
import { gap } from './body';
import { fail, finish, type CommandResult } from './common';
import { houseRule } from './houseRules';
import { MORAL, MORAL_VERSION, moralHalf, moralMaxFrom, moralNow, moralThird } from '../rules/moral';
import { SKILLS, isSkill } from '../rules/skills';
import type { Ability } from '../rules/abilities';
import type { ExtraDie } from '../rules/attack';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

export const COLLAPSE_ID = 'moral:cokmus';
export const DAZE_ID = 'moral:bunalmis';

/** Tam mod bu savaşta açık mı (ev kuralı + kural sürümü). */
export const moraleOn = (state: Pick<BattleState, 'houseRules' | 'map' | 'kuralSurumu'>): boolean =>
  (state.kuralSurumu ?? 1) >= MORAL_VERSION && houseRule(state, 'moralSistemi');

/** Moral taşıyan oyuncu karakteri mi (masum, çağrılmış ve canavar değil). */
const isPc = (c: Combatant): boolean => c.side === 'party' && !c.civilian && !c.summon && !!c.ownerId && c.level > 0;
export const collapsed = (c: Pick<Combatant, 'effects'>): boolean => !!c.effects?.some((e) => e.id === COLLAPSE_ID);

/** Savaş başı: kural açıksa karakterlere havuz, kapalıysa (kayıtlı durumdan gelen) Moral alanı silinir. */
export function withMorale(state: BattleState): BattleState {
  const on = moraleOn(state);
  let changed = false;
  const combatants: Record<string, Combatant> = {};
  for (const [id, c] of Object.entries(state.combatants)) {
    if (on && isPc(c)) {
      const max = moralMaxFrom(c.modifiers, c.proficiency);
      combatants[id] = { ...c, moralMax: max, moral: moralNow(c.moral, max) };
      changed = true;
    } else if (c.moral !== undefined || c.moralMax !== undefined) {
      const { moral: _m, moralMax: _x, ...rest } = c;
      combatants[id] = rest as Combatant;
      changed = true;
    } else combatants[id] = c;
  }
  return changed ? { ...state, combatants } : state;
}

function collapseEffect(c: Combatant): ActiveEffect {
  return { id: COLLAPSE_ID, name: 'Çökmüş', sourceId: c.id, grants: ['Incapacitated'], speedZero: true, ...(MORAL.cokmus.saldiriAvantaj ? { attackedAdv: true } : {}) };
}

/** Savaş başı (start_battle): Moral 0 ile giren "Bunalmış" (ilk tur). */
export function moraleStartEvents(state: BattleState): BattleEvent[] {
  if (!moraleOn(state)) return [];
  return Object.values(state.combatants).filter((c) => c.moralMax !== undefined && (c.moral ?? 1) <= 0 && c.hp > 0).map((c) => ({
    type: 'effect_added', targetId: c.id,
    effect: { id: DAZE_ID, name: 'Bunalmış', sourceId: c.id, until: state.round, grants: ['Incapacitated'], speedMult: MORAL.bunalmis.hizCarpani, icon: '😶' },
  }));
}

const frightened = (c: Combatant | undefined): boolean => !!c?.conditions.includes('Frightened');

/** Komut sonu: dost düştü / korktu kayıpları, 0'da çökme, ≥ 1'de çökmenin bitmesi. */
export function moraleAfterEvents(before: BattleState, after: BattleState, events: BattleEvent[]): BattleEvent[] {
  const pcs = Object.values(after.combatants).filter((c) => c.moralMax !== undefined);
  if (!pcs.length) return [];
  if (after.status === 'finished') return before.status === 'active' ? victoryEvents(after) : [];
  if (after.status !== 'active') return [];
  const fallen = pcs.filter((c) => (before.combatants[c.id]?.hp ?? 0) > 0 && c.hp <= 0).map((c) => c.id);
  const out: BattleEvent[] = [];
  for (const c of pcs) {
    if (c.life === 'dead') continue;
    let loss = 0;
    if (c.hp > 0) loss += MORAL.savasKayip.dostDustu * fallen.filter((id) => id !== c.id).length;
    if (frightened(c) && !frightened(before.combatants[c.id])) loss += MORAL.savasKayip.korkuBasarisiz;
    const now = c.moral ?? 0;
    const next = Math.max(0, now - loss);
    if (next !== now) out.push({ type: 'moral_changed', targetId: c.id, delta: next - now, moral: next, reason: fallen.length && c.hp > 0 ? 'dost' : 'korku' });
    // Yalnızca savaş içinde 0'a düşen çöker (0 ile giren Bunalmış olur, çökmez).
    if (next <= 0 && now > 0 && !collapsed(c)) out.push({ type: 'effect_added', targetId: c.id, effect: collapseEffect(c) });
    if (next >= 1 && collapsed(c)) out.push({ type: 'effect_ended', targetId: c.id, effectId: COLLAPSE_ID, name: 'Çökmüş', reason: 'used' });
  }
  void events;
  return out;
}

/**
 * Savaş biterken: kazanılırsa yaşayan her karaktere zafer ödülü (+1), çökmüş kalıp kazanana daha büyüğü (+2).
 * Yenilgi/kaçışta ödül yok (0'da kalan savaş dışında ölür: `app/partyStatus.ts`).
 */
function victoryEvents(after: BattleState): BattleEvent[] {
  if (after.winner !== 'party') return [];
  const out: BattleEvent[] = [];
  for (const c of Object.values(after.combatants)) {
    if (c.moralMax === undefined || c.life === 'dead') continue;
    const now = c.moral ?? 0;
    const next = Math.min(c.moralMax, now + (collapsed(c) ? MORAL.zafer.cokmusOdul : MORAL.zafer.odul));
    if (next !== now) out.push({ type: 'moral_changed', targetId: c.id, delta: next - now, moral: next, reason: 'zafer' });
  }
  return out;
}

/** Toparlama eylemiyle verilen Moral (veride ek bonus veren özelliği olana fazlası). */
export function rallyAmount(actor: Combatant): number {
  const r = MORAL.moralToparlamaEylem;
  const bonus = actor.features?.some((f) => r.ekBonus.ozellikler.includes(f.key)) ? r.ekBonus.miktar : 0;
  return r.miktar + bonus;
}

/** Toparlama yapılabilir mi (hata metni ya da null). */
export function rallyProblem(state: BattleState, actor: Combatant | undefined, target: Combatant | undefined): string | null {
  if (!moraleOn(state)) return 'Moral (tam mod) kapalı.';
  if (!actor || !target) return 'Savaşçı bulunamadı.';
  if (actor.id === target.id) return 'Kendini toparlayamazsın.';
  if (actor.hp <= 0 || collapsed(actor)) return 'Önce kendin toparlanmalısın.';
  if (target.side !== actor.side || target.moralMax === undefined) return 'Yalnızca dost karakter toparlanır.';
  if (!collapsed(target)) return `${target.name} çökmüş değil.`;
  if (!actor.pos || !target.pos || gap(state, actor, target) * 5 > MORAL.moralToparlamaEylem.menzilFt) return `${target.name} çok uzakta (en çok ${MORAL.moralToparlamaEylem.menzilFt} ft).`;
  return null;
}

/** `moral_rally`: çökmüş dosta Moral (eylem; ekonomide). Çökme komut sonunda (`moraleAfterEvents`) biter. */
export function executeRally(state: BattleState, cmd: { actorId: string; targetId: string }): CommandResult {
  const actor = state.combatants[cmd.actorId];
  const target = state.combatants[cmd.targetId];
  const why = rallyProblem(state, actor, target);
  if (why || !actor || !target) return fail(why ?? 'Savaşçı bulunamadı.');
  const max = target.moralMax ?? 0;
  const moral = Math.min(max, (target.moral ?? 0) + rallyAmount(actor));
  return finish(state, [{ type: 'moral_changed', targetId: target.id, delta: moral - (target.moral ?? 0), moral, reason: 'toparlama', byId: actor.id }]);
}

/** Eşik cezası (sabit −1) WIS/CHA save'lerinde. */
export function moraleSaveDice(c: Combatant | undefined, ability: Ability | undefined): ExtraDie[] {
  if (!c || c.moralMax === undefined || !ability) return [];
  const e = MORAL.etkiler;
  const out: ExtraDie[] = [];
  if (moralHalf(c.moral ?? 0, c.moralMax) && e.yariYetenekler.includes(ability)) out.push({ label: 'Moral', die: String(e.yariCeza), sign: -1 });
  // Üçte bir: korku ve büyülenmeye karşı save'de dezavantaj (başarıda d20 yeniden, küçüğü; `against`).
  if (moralThird(c.moral ?? 0, c.moralMax)) out.push({ label: 'Moral (dezavantaj)', die: 'd20', sign: -1, reroll: 'worse', against: e.ucteBirDezavantaj });
  return out;
}

/** Eşik cezası (sabit −1) WIS/CHA becerilerinin kontrollerinde. */
export function moraleCheckDice(c: Combatant | undefined, skill: string | undefined): ExtraDie[] {
  if (!c || c.moralMax === undefined || !skill || !isSkill(skill)) return [];
  const e = MORAL.etkiler;
  return moralHalf(c.moral ?? 0, c.moralMax) && e.yariYetenekler.includes(SKILLS[skill].ability) ? [{ label: 'Moral', die: String(e.yariCeza), sign: -1 }] : [];
}
