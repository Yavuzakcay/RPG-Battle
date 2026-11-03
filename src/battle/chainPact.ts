/**
 * Kuyruk 19: Warlock Eldritch Invocation'larının kalanları (SRD 5.2.1; anahtar `invocationsK19`, kural sürümü 16).
 * - Pact of the Chain: özel familiar biçimleri (Imp, Pseudodragon, Quasit, Skeleton, Sphinx of Wonder, Sprite, Venomous
 *   Snake; Slaad Tadpole SRD 5.2.1 listesinde yok); Attack eyleminde bir saldırıdan vazgeçip familiar'ı tepkisiyle
 *   saldırtma (`familiar_strike`).
 * - Investment of the Chain Master: familiar 40 ft uçar, bonus eylemle Attack eylemi emri (`familiar_order`), BPS
 *   hasarı Necrotic/Radiant (hedefe en çok işleyen), save DC'si büyücününki, isabet hasarına büyücünün tepkisiyle direnç.
 * - Gift of the Protectors: kitaptaki adlar (savaş başında CHA değiştiricisi kadar dost) 0 HP'ye düşünce 1 HP'de kalır;
 *   biri tetikleyince uzun dinlenmeye dek kimse (`protectors-gift` kaynağı).
 * - Gaze of Two Minds: bonus eylemle bitişik gönüllü dostun duyularıyla algılar (sonraki turunun sonuna dek, bonus
 *   eylemle uzar); onun özel duyuları ve 60 ft içindeyse büyüyü onun yerinden yapma.
 */
import { fail, finish, type CommandResult } from './common';
import { canReact, reactionUsed, strikeApi } from './reactions';
import { globalRule } from './ruleControl';
import type { BattleEvent, BattleState, Combatant } from './types';
import { distance } from '../rules/hex';

export const CHAIN_FORMS = ['imp', 'pseudodragon', 'quasit', 'skeleton', 'sphinx-of-wonder', 'sprite', 'venomous-snake'];
export const chainOn = (state: BattleState) => !!globalRule(state, 'invocationsK19');
const ORDER = 'chain:order';

/** Sahibin familiar'ı (Find Familiar çağrısı). */
export function familiarOf(state: BattleState, ownerId: string): Combatant | undefined {
  return Object.values(state.combatants).find((c) => c.summon?.by === ownerId && c.summon.spellId === 'find-familiar' && !c.summon.gone && c.hp > 0);
}

/** Familiar saldırabilir mi: Investment emri (bu turu) varsa. */
export const familiarOrdered = (c: Combatant) => !!c.effects?.some((e) => e.id === ORDER);

/** Pact of the Chain: Attack eyleminde bir saldırıdan vazgeç, familiar tepkisiyle saldırsın. */
export function executeFamiliarStrike(state: BattleState, owner: Combatant, targetId: string, rng: import('../rules/dice').Rng): CommandResult {
  if (!chainOn(state) || !owner.traits?.includes('pact-of-the-chain')) return fail('Pact of the Chain yok.');
  const fam = familiarOf(state, owner.id);
  if (!fam) return fail('Familiar yok.');
  if (!owner.economy.action || owner.economy.attacksLeft <= 0) return fail('Önce Attack eylemiyle saldır (kalan saldırı gerekir).');
  if (!canReact(fam as Combatant | undefined)) return fail('Familiar tepki veremez.');
  const api = strikeApi();
  if (!api || !api.can(state, fam.id, targetId)) return fail(`${fam.name} hedefe ulaşamıyor.`);
  const evs: BattleEvent[] = [{ type: 'action_used', actorId: owner.id, kind: 'attack', what: 'Pact of the Chain', attacksLeft: owner.economy.attacksLeft - 1 },
    reactionUsed(fam, { id: 'chain-strike', name: 'Pact of the Chain' }, 'targeted', owner.id), ...api.strike(state, fam.id, targetId, rng)];
  return finish(state, evs);
}

/** Investment of the Chain Master: bonus eylemle familiar'a Attack eylemi emri (familiar'ın sonraki turunun sonuna dek). */
export function executeFamiliarOrder(state: BattleState, owner: Combatant): CommandResult {
  if (!chainOn(state) || !owner.traits?.includes('chain-master')) return fail('Investment of the Chain Master yok.');
  const fam = familiarOf(state, owner.id);
  if (!fam) return fail('Familiar yok.');
  return finish(state, [{ type: 'effect_added', targetId: fam.id, effect: { id: ORDER, name: 'Saldırı emri', sourceId: owner.id, until: state.round + 1, untilOwnTurnEnd: true } }]);
}

/** Investment: familiar'ın isabet hasarına sahibinin tepkisiyle direnç (hasar yarıya). */
export function chainResist(state: BattleState, target: Combatant, damage: number): { owner: Combatant; damage: number } | null {
  if (!chainOn(state) || !target.summon || target.summon.spellId !== 'find-familiar' || damage <= 1) return null;
  const owner = state.combatants[target.summon.by];
  if (!owner?.traits?.includes('chain-master') || !canReact(owner) || !owner.pos || !target.pos) return null;
  return { owner, damage: Math.floor(damage / 2) };
}

/** Gift of the Protectors: savaş başında kitaba yazılı dostlar (CHA değiştiricisi kadar; en yakınlar). */
export function protectorsGiftEvents(state: BattleState): BattleEvent[] {
  if (!chainOn(state)) return [];
  const out: BattleEvent[] = [];
  for (const w of Object.values(state.combatants)) {
    if (!w.traits?.includes('gift-of-the-protectors') || (w.resources['protectors-gift'] ?? 1) <= 0) continue;
    const n = Math.max(1, w.modifiers.cha);
    const allies = Object.values(state.combatants).filter((c) => c.side === w.side && !c.civilian && !c.summon && c.hp > 0)
      .sort((a, b) => (a.id === w.id ? -1 : b.id === w.id ? 1 : (a.pos && w.pos && b.pos ? distance(a.pos, w.pos) - distance(b.pos, w.pos) : 0)))
      .slice(0, n);
    for (const a of allies) out.push({ type: 'effect_added', targetId: a.id, effect: { id: `protectors-gift:${w.id}`, name: 'Gift of the Protectors', sourceId: w.id, deathWard: true, giftOf: w.id, icon: '📖' } });
  }
  return out;
}

/** Gaze of Two Minds: bonus eylemle bitişik gönüllü dosta bağlan (ya da bağı uzat). */
export function executeGaze(state: BattleState, owner: Combatant, allyId: string): CommandResult {
  if (!chainOn(state) || !owner.traits?.includes('gaze-of-two-minds')) return fail('Gaze of Two Minds yok.');
  const a = state.combatants[allyId];
  const cur = owner.effects?.find((e) => e.gazeAt);
  if (!a || a.id === owner.id || a.side !== owner.side || a.hp <= 0 || !a.pos || !owner.pos) return fail('Gönüllü bir dost seç.');
  if (cur?.gazeAt !== a.id && distance(a.pos, owner.pos) > 1) return fail('İlk bağ için dokunmak gerekir (5 ft).');
  return finish(state, [{ type: 'effect_added', targetId: owner.id, effect: { id: 'gaze-of-two-minds', name: `Gaze of Two Minds (${a.name})`, sourceId: owner.id, gazeAt: a.id,
    until: state.round + 1, untilOwnTurnEnd: true, icon: '👁' } }]);
}

/** Bağlı dostun konumu (60 ft içindeyse büyü oradan yapılabilir). */
export function gazePos(state: BattleState, c: Combatant): import('../rules/hex').Offset | null {
  const e = c.effects?.find((x) => x.gazeAt);
  const a = e?.gazeAt ? state.combatants[e.gazeAt] : undefined;
  return a?.pos && c.pos && a.hp > 0 && distance(a.pos, c.pos) <= 12 ? a.pos : null;
}
