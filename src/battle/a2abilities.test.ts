/**
 * Kuyruk A2 G2: koşul isteyen canavar yetenekleri (A0'da arenada koşul olmadığı için doğrulanamayan 23 yetenek). Her biri
 * için koşulu sağlayan senaryo: koşul varken çalışır, yokken reddedilir (`monster_ability`; anahtar `srdK19`).
 */
import { describe, expect, it } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant } from './index';
import { replay } from './reduce';
import { combatantFromMonster } from './create';
import { getMonster } from '../data';
import type { Offset } from '../rules/hex';
import { distance } from '../rules/hex';
import type { Rng } from '../rules/dice';
import { GM, mk, sword } from './fixtures';
import { CURRENT_RULES } from './ruleVersion';
import { getMap } from '../map/maps';
import { hideSpotBonus } from './stealth';
import { terrainAt } from './movement';

const LOW: Rng = () => 0.01;
const MID: Rng = () => 0.5;
const o = (col: number, row: number): Offset => ({ col, row });
const flat = (patch: Array<[Offset, string]> = []) => {
  const rows = Array.from({ length: 7 }, () => '.'.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
};
interface Opt { foe?: Offset; me?: Offset; foeP?: Partial<Combatant>; meP?: Partial<Combatant>; tiles?: string[]; map?: { id: string; variantId?: string }; extra?: Combatant[] }
function arena(monId: string, o2: Opt = {}): BattleState {
  const m = { ...combatantFromMonster(getMonster(monId), { id: 'X' }), side: 'enemies' as const };
  const parts = [mk('A', { ownerId: 'p1', hp: 200, maxHp: 200, weaponOptions: [sword], speed: 30, creatureType: 'humanoid' }), m, ...(o2.extra ?? [])];
  const { state } = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: CURRENT_RULES, map: o2.map ?? { id: 'col' } });
  const combatants = { ...state.combatants };
  combatants.X = { ...(combatants.X as Combatant), pos: o2.me ?? o(7, 3), ...o2.meP };
  combatants.A = { ...(combatants.A as Combatant), pos: o2.foe ?? o(6, 3), ...o2.foeP };
  for (const e of o2.extra ?? []) combatants[e.id] = { ...(combatants[e.id] as Combatant), ...e };
  return { ...state, status: 'active', round: 1, order: ['X', 'A', ...(o2.extra ?? []).map((e) => e.id)], turnIndex: 0, combatants,
    map: { ...(state.map as NonNullable<BattleState['map']>), tiles: o2.tiles ?? flat() } };
}
const use = (s: BattleState, abilityId: string, rng: Rng = LOW, targetId?: string) =>
  execute(s, { type: 'monster_ability', actorId: 'X', abilityId, ...(targetId ? { targetId } : {}) }, GM, rng);
const ok = (r: ReturnType<typeof use>) => { if (!r.ok) throw new Error(r.error); return r; };
const held = (by = 'X'): Partial<Combatant> => ({ conditions: ['Grappled'], grapple: { by, escapeDc: 15, restrained: false } });
const same = (s: BattleState, evs: BattleEvent[], after: BattleState) => expect(replay([{ type: 'battle_started', state: s }, ...evs])).toEqual(after);

describe('Swallow (6): yalnızca yakaladığı hedef; save başarısızsa yutulur', () => {
  for (const id of ['giant-frog', 'giant-toad', 'tarrasque', 'behir', 'remorhaz', 'purple-worm']) {
    it(id, () => {
      const s = arena(id, { foeP: held() });
      const r = ok(use(s, 'swallow'));
      const a = r.state.combatants.A!;
      expect(a.effects?.some((e) => e.swallowedBy === 'X')).toBe(true);
      expect(a.conditions).toEqual(expect.arrayContaining(['Blinded', 'Restrained']));
      same(s, r.events, r.state);
      expect(use(arena(id), 'swallow').ok).toBe(false);
    });
  }
});

describe('Trample (3): Prone hedefe 5 ft içinde DEX save', () => {
  for (const id of ['gorgon', 'elephant', 'mammoth']) {
    it(id, () => {
      const s = arena(id, { foeP: { conditions: ['Prone'] } });
      const r = ok(use(s, 'trample'));
      expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'A' && e.appliedDamage > 0)).toBe(true);
      expect(use(arena(id), 'trample').ok).toBe(false);
    });
  }
});

describe('Rampage (2): Bloodied düşman varken yarım hareket + saldırı', () => {
  for (const id of ['gnoll-warrior', 'giant-hyena']) {
    it(id, () => {
      const s = arena(id, { foeP: { hp: 90, maxHp: 200 } });
      const r = ok(use(s, 'rampage', MID));
      expect(r.events.some((e) => e.type === 'attack_resolved' && e.actorId === 'X' && e.targetId === 'A')).toBe(true);
      expect(use(arena(id), 'rampage').ok).toBe(false);
    });
  }
});

describe('Reel (2): Restrained/Grappled hedefi çeker', () => {
  it('ettercap (Restrained, 30 ft)', () => {
    const s = arena('ettercap', { foe: o(3, 3), foeP: { conditions: ['Restrained'] } });
    const r = ok(use(s, 'reel'));
    expect(distance(r.state.combatants.A!.pos!, o(7, 3))).toBeLessThan(distance(o(3, 3), o(7, 3)));
    expect(use(arena('ettercap', { foe: o(3, 3) }), 'reel').ok).toBe(false);
  });
  it('roper (Grappled, 60 ft)', () => {
    const s = arena('roper', { foe: o(2, 3), foeP: held() });
    const r = ok(use(s, 'reel'));
    expect(distance(r.state.combatants.A!.pos!, o(7, 3))).toBeLessThan(5);
    expect(use(arena('roper', { foe: o(2, 3) }), 'reel').ok).toBe(false);
  });
});

describe('Su koşullu (3): Bubble Dash, Aquatic Charge', () => {
  const water = flat([[o(7, 3), 'w'], [o(8, 3), 'w']]);
  for (const id of ['seahorse', 'giant-seahorse']) {
    it(id, () => {
      const s = arena(id, { tiles: water });
      const r = ok(use(s, 'bubble-dash'));
      expect(r.events.some((e) => e.type === 'dashed')).toBe(true);
      expect(use(arena(id), 'bubble-dash').ok).toBe(false);
    });
  }
  it('sahuagin-warrior Aquatic Charge: suda tam hızla düşmana doğru', () => {
    const s = arena('sahuagin-warrior', { tiles: water, foe: o(2, 3) });
    const r = ok(use(s, 'aquatic-charge'));
    expect(r.state.combatants.X!.pos!.col).toBeLessThan(7);
    expect(use(arena('sahuagin-warrior', { foe: o(2, 3) }), 'aquatic-charge').ok).toBe(false);
  });
});

describe('Arazi/ışık koşullu (3): Tree Stride, Animate Trees, Shadow Stealth', () => {
  it('dryad Tree Stride: ağaç yanındayken ikinci ağacın yanına ışınlanır (düşmana en yakın); sürüm 29 eski davranış', () => {
    const s = arena('dryad', { tiles: flat([[o(8, 3), 'a'], [o(3, 3), 'a']]), foe: o(1, 3) });
    const r = ok(use(s, 'tree-stride'));
    const to = (r.events.find((e) => e.type === 'teleported') as Extract<BattleEvent, { type: 'teleported' }>).to;
    expect(distance(to, o(3, 3))).toBe(1);
    same(s, r.events, r.state);
    // Sürüm 29: eski yol (varışta 2+ düşman) tek düşmanda kullanılamaz.
    expect(use({ ...s, kuralSurumu: 29 }, 'tree-stride').ok).toBe(false);
    expect(use(arena('dryad', { foe: o(1, 1) }), 'tree-stride').ok).toBe(false);
  });
  it('treant Animate Trees: 60 ft içindeki ağaçlardan iki yaratık', () => {
    const s = arena('treant', { tiles: flat([[o(9, 2), 'a'], [o(9, 4), 'a']]) });
    const r = ok(use(s, 'animate-trees'));
    expect(r.events.filter((e) => e.type === 'summoned')).toHaveLength(2);
    expect(use(arena('treant'), 'animate-trees').ok).toBe(false);
  });
  it('shadow Shadow Stealth: karanlık haritada, gizlenme yerinde bonus eylemle Gizlen', () => {
    // Gizlenme yalnızca haritanın gizlenme yerlerinde (`hide`); mağaranın gerçek zemini, düşmana bitişik olmayan bir yer.
    const tiles = getMap('magara').tiles;
    const probe = arena('shadow', { map: { id: 'magara', variantId: 'magara' }, tiles, foe: o(0, 0) });
    let spot: Offset | null = null;
    for (let row = 0; row < tiles.length && !spot; row++) for (let col = 0; col < (tiles[0]?.length ?? 0) && !spot; col++) {
      if (hideSpotBonus(probe, o(col, row)) !== null && distance(o(col, row), o(0, 0)) > 2 && terrainAt(probe, o(col, row)).movement !== 'blocked') spot = o(col, row);
    }
    expect(spot).not.toBeNull();
    const s = arena('shadow', { map: { id: 'magara', variantId: 'magara' }, tiles, foe: o(0, 0), me: spot! });
    const r = ok(use(s, 'shadow-stealth', () => 0.99));
    expect(r.events.some((e) => e.type === 'hide_attempted')).toBe(true);
    expect(use(arena('shadow', { foe: o(1, 1) }), 'shadow-stealth').ok).toBe(false);
  });
});

describe('Diğer (6): Swoop, Consume Life, Create Specter, Hellfire Spellcasting', () => {
  it('roc Swoop: yakaladığını bırakır (düşme hasarı + Prone)', () => {
    const s = arena('roc', { foeP: held() });
    const r = ok(use(s, 'swoop'));
    expect(r.state.combatants.A!.conditions).toContain('Prone');
    expect(r.state.combatants.A!.conditions).not.toContain('Grappled');
    expect(use(arena('roc'), 'swoop').ok).toBe(false);
  });
  it('will-o-wisp Consume Life: 0 HP\'deki yaratık save\'i başaramazsa ölür', () => {
    const s = arena('will-o-wisp', { foeP: { hp: 0, life: 'dying', conditions: ['Unconscious'] } });
    const r = ok(use(s, 'consume-life'));
    expect(r.state.combatants.A!.life).toBe('dead');
    expect(use(arena('will-o-wisp'), 'consume-life').ok).toBe(false);
  });
  it('wraith Create Specter: 10 ft içindeki ölü insansıdan Specter', () => {
    const corpse = mk('C', { side: 'party', hp: 0, maxHp: 20, life: 'dead', creatureType: 'humanoid', pos: o(8, 3) });
    const s = arena('wraith', { extra: [corpse] });
    const r = ok(use(s, 'create-specter'));
    expect(r.events.some((e) => e.type === 'summoned' && e.combatant.name.toLowerCase().includes('specter'))).toBe(true);
    expect(use(arena('wraith'), 'create-specter').ok).toBe(false);
  });
  it('pit-fiend Hellfire Spellcasting: iki Fireball (save iki kez)', () => {
    const s = arena('pit-fiend', { foe: o(2, 3), foeP: { hp: 400, maxHp: 400 } });
    const r = ok(use(s, 'hellfire', MID));
    expect(r.events.filter((e) => e.type === 'save_resolved' && e.targetId === 'A')).toHaveLength(2);
  });
});
