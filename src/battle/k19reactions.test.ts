/**
 * Kuyruk 19 (srdK19): SRD canavar tepkilerinin kalanları: Protection, Whirlwind of Sand, Deflect Missile (geri
 * yöneltme), Reflexive Antennae, Redirect Attack (canavar saldırısı), Pursuit, Ink Cloud, Burst of Ingenuity.
 * Her biri anahtar açık / kapalı.
 */
import { describe, expect, it } from 'vitest';
import { startBattle } from './index';
import type { BattleEvent, BattleState, Combatant } from './index';
import { applyEvents } from './reduce';
import { combatantFromMonster } from './create';
import { afterAttackReactions, hitReactions, type HitContext } from './reactions';
import { inkEvents, reactionTurnEndEvents } from './monsterAbilities';
import { monsterAttackEvents } from './monsters';
import { getMonster } from '../data';
import { seededRng as seeded } from '../rules/dice';
import { secondChance } from '../rules/attack';
import { saveDice } from './effectDice';
import { syncAuras } from './auras';
import { mk, sword } from './fixtures';
import './commands';

const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
type Part = { id: string; monster?: string; side: 'party' | 'enemies'; pos: { col: number; row: number } };

/** Savaş: verilen yaratıklar; anahtar kapalıysa `srdK19: false`. */
function arena(parts: Part[], on = true, tiles = flat): BattleState {
  const list = parts.map((p) => p.monster
    ? { ...combatantFromMonster(getMonster(p.monster), { id: p.id }), side: p.side }
    : { ...mk(p.id, { ownerId: 'p1', hp: 60, maxHp: 60, weaponOptions: [sword], speed: 30 }), side: p.side });
  const { state } = startBattle('b', 'd-z-zemin', list as Combatant[], () => 0.5, { kuralSurumu: 16, map: { id: 'col', ...(on ? {} : { ruleToggles: { srdK19: false } }) } });
  const combatants = { ...state.combatants };
  for (const p of parts) combatants[p.id] = { ...(combatants[p.id] as Combatant), pos: p.pos, side: p.side };
  const s: BattleState = { ...state, status: 'active', round: 1, order: parts.map((p) => p.id), turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
  return syncAuras(s);
}
const ctxOf = (s: BattleState, attacker: string, target: string, over: Partial<HitContext> = {}): HitContext => ({
  attacker: s.combatants[attacker] as Combatant, target: s.combatants[target] as Combatant, label: 'test',
  total: (s.combatants[target] as Combatant).ac + 1, ac: (s.combatants[target] as Combatant).ac, critical: false, melee: true, ranged: false, damage: 5, damageType: 'slashing', ...over,
});
const types = (ev: BattleEvent[]) => ev.map((e) => e.type);

describe('Kuyruk 19: SRD canavar tepkileri (srdK19)', () => {
  it('Shield Guardian Protection: 5 ft içindeki dosta isabette AC +5, saldırı ıskalar; kapalıyken isabet', () => {
    const parts: Part[] = [{ id: 'A', side: 'party', pos: { col: 5, row: 3 } }, { id: 'G', monster: 'shield-guardian', side: 'party', pos: { col: 6, row: 3 } },
      { id: 'X', side: 'enemies', pos: { col: 4, row: 3 } }];
    const on = arena(parts);
    const r = hitReactions(on, ctxOf(on, 'X', 'A'), seeded(1));
    expect(r.hit).toBe(false);
    expect(r.events.some((e) => e.type === 'effect_added' && e.effect.id === 'guard:G' && e.effect.ac === 5)).toBe(true);
    const off = arena(parts, false);
    expect(hitReactions(off, ctxOf(off, 'X', 'A'), seeded(1)).hit).toBe(true);
  });

  it('Whirlwind of Sand: AC +2 ve ışınlanma, varışta komşu düşmanlar Blinded; kapalıyken yalnızca AC +2', () => {
    const parts: Part[] = [{ id: 'M', monster: 'mummy-lord', side: 'enemies', pos: { col: 7, row: 3 } }, { id: 'A', side: 'party', pos: { col: 6, row: 3 } },
      { id: 'B', side: 'party', pos: { col: 12, row: 3 } }];
    const on = arena(parts);
    const r = hitReactions(on, ctxOf(on, 'A', 'M'), seeded(1));
    expect(r.hit).toBe(false);
    expect(types(r.events)).toContain('teleported');
    expect(r.events.some((e) => e.type === 'effect_added' && e.effect.grants?.includes('Blinded'))).toBe(true);
    const off = arena(parts, false);
    const r2 = hitReactions(off, ctxOf(off, 'A', 'M'), seeded(1));
    expect(r2.hit).toBe(false);
    expect(types(r2.events)).not.toContain('teleported');
  });

  it('Deflect Missile: hasar 0\'a inince saldıran DEX 17 save yapar (Force); kapalıyken geri yöneltme yok', () => {
    const parts: Part[] = [{ id: 'S', monster: 'stone-giant', side: 'enemies', pos: { col: 9, row: 3 } }, { id: 'A', side: 'party', pos: { col: 3, row: 3 } }];
    for (const on of [true, false]) {
      const s = arena(parts, on);
      const r = hitReactions(s, ctxOf(s, 'A', 'S', { melee: false, ranged: true, damage: 3, damageType: 'piercing' }), seeded(1));
      expect(r.damage).toBe(0);
      const after = afterAttackReactions(applyEvents(s, r.events), 'A', 'S', r, { melee: false, damageType: 'piercing', dealt: 0 }, seeded(2));
      expect(after.some((e) => e.type === 'map_effect' && e.targetId === 'A' && e.text.includes('Deflect Missile'))).toBe(on);
    }
  });

  it('Reflexive Antennae: yakın dövüş isabetinde tepki + DEX 11; başarısızsa silah saldırısına −1; kapalıyken yok', () => {
    const parts: Part[] = [{ id: 'R', monster: 'rust-monster', side: 'enemies', pos: { col: 7, row: 3 } }, { id: 'A', side: 'party', pos: { col: 6, row: 3 } }];
    const s = arena(parts);
    let corroded = false;
    for (let seed = 1; seed <= 20 && !corroded; seed++) {
      const ev = afterAttackReactions(s, 'A', 'R', { events: [], hit: true, ac: 14, damage: 3 }, { melee: true, damageType: 'slashing', dealt: 3 }, seeded(seed));
      expect(types(ev)).toContain('reaction_used');
      corroded = ev.some((e) => e.type === 'effect_added' && e.effect.id === 'corrode:A' && e.effect.dice?.sign === -1);
    }
    expect(corroded).toBe(true);
    const off = arena(parts, false);
    expect(types(afterAttackReactions(off, 'A', 'R', { events: [], hit: true, ac: 14, damage: 3 }, { melee: true, damageType: 'slashing', dealt: 3 }, seeded(1)))).not.toContain('reaction_used');
  });

  it('Redirect Attack: canavar saldırısında goblin patron komşu dostla yer değiştirir; kapalıyken eski (yalnızca silah)', () => {
    const parts: Part[] = [{ id: 'B', monster: 'goblin-boss', side: 'enemies', pos: { col: 7, row: 3 } }, { id: 'G', monster: 'goblin-warrior', side: 'enemies', pos: { col: 8, row: 3 } },
      { id: 'W', monster: 'wolf', side: 'party', pos: { col: 6, row: 3 } }];
    const s = arena(parts);
    const r = monsterAttackEvents(s, s.combatants.W as Combatant, s.combatants.B as Combatant, 0, seeded(1));
    if (!r.ok) throw new Error(r.error);
    expect(types(r.events)).toContain('swapped');
    const off = arena(parts, false);
    const r2 = monsterAttackEvents(off, off.combatants.W as Combatant, off.combatants.B as Combatant, 0, seeded(1));
    if (!r2.ok) throw new Error(r2.error);
    expect(types(r2.events)).not.toContain('swapped');
  });

  it('Pursuit: hareket ederek turunu bitiren düşmanın 10 ft yakınına ışınlanır; kapalıyken yok', () => {
    const parts: Part[] = [{ id: 'N', monster: 'nalfeshnee', side: 'enemies', pos: { col: 13, row: 3 } }, { id: 'A', side: 'party', pos: { col: 2, row: 3 } }];
    const moved = (s: BattleState) => ({ ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), movementUsed: 3 } } });
    const ev = reactionTurnEndEvents(moved(arena(parts)), 'A', seeded(1));
    const tp = ev.find((e) => e.type === 'teleported');
    expect(tp && tp.type === 'teleported' && Math.abs(tp.to.col - 2) <= 2).toBe(true);
    expect(reactionTurnEndEvents(moved(arena(parts, false)), 'A', seeded(1))).toEqual([]);
  });

  it('Ink Cloud: su altında 5 ft\'te tur bitince yoğun örtü alanı + uzaklaşma; karada ve kapalıyken yok', () => {
    const water = Array.from({ length: 7 }, () => 'w'.repeat(15));
    const parts: Part[] = [{ id: 'O', monster: 'octopus', side: 'enemies', pos: { col: 7, row: 3 } }, { id: 'A', side: 'party', pos: { col: 6, row: 3 } }];
    const ev = reactionTurnEndEvents(arena(parts, true, water), 'A', seeded(1));
    expect(ev.some((e) => e.type === 'zone_created' && e.zone.spec?.obscured === 'heavy')).toBe(true);
    expect(reactionTurnEndEvents(arena(parts, true), 'A', seeded(1)).some((e) => e.type === 'zone_created')).toBe(false);
    expect(reactionTurnEndEvents(arena(parts, false, water), 'A', seeded(1))).toEqual([]);
    // Giant Octopus: hasar alınca (10 ft küp: 7 altıgen).
    const g = arena([{ id: 'O', monster: 'giant-octopus', side: 'enemies', pos: { col: 7, row: 3 } }, { id: 'A', side: 'party', pos: { col: 6, row: 3 } }], true, water);
    const gi = inkEvents(g, 'O', 'damaged', seeded(1)).find((e) => e.type === 'zone_created');
    expect(gi && gi.type === 'zone_created' ? gi.zone.hexes.length : 0).toBe(7);
  });

  it('Burst of Ingenuity: 30 ft içindeki dostun başarısız save\'ine +2 (yalnızca tutarsa); tepki ve havuz harcanır; kapalıyken yok', () => {
    const parts: Part[] = [{ id: 'P', monster: 'sphinx-of-wonder', side: 'enemies', pos: { col: 7, row: 3 } }, { id: 'K', monster: 'knight', side: 'enemies', pos: { col: 9, row: 3 } },
      { id: 'A', side: 'party', pos: { col: 1, row: 3 } }];
    const s = arena(parts);
    const k = s.combatants.K as Combatant;
    expect(k.burstBy?.id).toBe('P');
    const extra = saveDice(k, 'wis');
    const r = secondChance(extra, { total: 13, natural: 10, bonus: 3, need: 15, mode: 'normal', kind: 'save' }, seeded(1));
    expect(r?.total).toBe(15);
    expect(secondChance(extra.filter((x) => x.reroll === 'plus'), { total: 11, natural: 8, bonus: 3, need: 15, mode: 'normal', kind: 'save' }, seeded(1))).toBeNull();
    const used = applyEvents(s, [{ type: 'save_resolved', actorId: 'A', targetId: 'K', ability: 'wis', dc: 15, d20: [10], natural: 10, total: 15, success: true, effects: [], conditionsAdded: [], targetHpAfter: (s.combatants.K as Combatant).hp, label: 'test', bonusDice: [r!.entry] } as unknown as BattleEvent]);
    expect(used.combatants.P?.economy.reaction).toBe(true);
    expect(used.combatants.P?.reactionUses?.['sphinx-of-wonder:burst']).toBe(1);
    expect(arena(parts, false).combatants.K?.burstBy).toBeUndefined();
  });

  it('Eski kural sürümü (15): yeni tepkiler çalışmaz (replay aynı kalır)', () => {
    const parts: Part[] = [{ id: 'A', side: 'party', pos: { col: 5, row: 3 } }, { id: 'G', monster: 'shield-guardian', side: 'party', pos: { col: 6, row: 3 } },
      { id: 'X', side: 'enemies', pos: { col: 4, row: 3 } }];
    const old = { ...arena(parts), kuralSurumu: 15 };
    expect(hitReactions(old, ctxOf(old, 'X', 'A'), seeded(1)).hit).toBe(true);
    const n: Part[] = [{ id: 'N', monster: 'nalfeshnee', side: 'enemies', pos: { col: 13, row: 3 } }, { id: 'A', side: 'party', pos: { col: 2, row: 3 } }];
    const o2 = { ...arena(n), kuralSurumu: 15 };
    expect(reactionTurnEndEvents({ ...o2, combatants: { ...o2.combatants, A: { ...(o2.combatants.A as Combatant), movementUsed: 3 } } }, 'A', seeded(1))).toEqual([]);
  });
});
