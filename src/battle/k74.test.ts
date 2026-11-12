/**
 * Kuyruk K74: (75) Truesight motorun beş eski yolunda tek sorgudan, Hallow tek toplu koruma; (76) batıran çamurun gerçek
 * bedeli, tehlike katmanında çamur zemini. Her kol eski sürümde eski davranış.
 */
import { describe, expect, it } from 'vitest';
import { seededRng, type Rng } from '../rules/dice';
import { execute, replay, startBattle } from './index';
import { mk, P1, sword } from './fixtures';
import { field } from './k19spells.test';
import { hiddenTo } from './k74Surum';
import { superiorPreyEvents } from './classTraits';
import { dragonRoundEvents } from './dragon';
import { hazardHexes } from '../ui/hazardLayer';
import type { BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

const SRC = import.meta.glob(['./reactions.ts', './features.ts', './classTraits.ts', './mastery.ts', './dragon.ts'], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const readFileSync = (p: string): string => SRC[p.replace('src/battle/', './')] ?? '';
const SEER = { effects: [{ id: 'true-seeing', name: 'True Seeing', sourceId: 'B', until: 99, truesight: 120 }] };
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;
const go = (s: BattleState, cmd: Command, rng: Rng = seededRng(3)) => {
  const r = execute(s, cmd, P1, rng);
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
};

describe('K74 Truesight: motor yolları tek sorguda (sürüm 75)', () => {
  const scene = (ver: number, seer = true) => field([
    mk('A', { ownerId: 'p1', hidden: { dc: 15 }, hp: 40, maxHp: 40 }),
    mk('B', { side: 'enemies', weaponOptions: [sword], hp: 40, maxHp: 40, ...(seer ? SEER : {}) }),
  ], { A: { col: 4, row: 3 }, B: { col: 5, row: 3 } }, ver);

  it('hiddenTo: 75\'te Truesight menzilindeki gizlenmiş görülür; 74\'te ve Truesight\'sız gizli', () => {
    expect(hiddenTo(scene(75), C(scene(75), 'B'), C(scene(75), 'A'))).toBe(false);
    expect(hiddenTo(scene(74), C(scene(74), 'B'), C(scene(74), 'A'))).toBe(true);
    expect(hiddenTo(scene(75, false), C(scene(75, false), 'B'), C(scene(75, false), 'A'))).toBe(true);
  });

  it('fırsat saldırısı: gizlenmiş yürüyen Truesight\'lı düşmanın erişiminden çıkınca 75\'te saldırı, 74\'te yok', () => {
    const away: Command = { type: 'move', actorId: 'A', to: { col: 1, row: 3 } };
    const oa = (ver: number) => go(scene(ver), away).events.some((e) => e.type === 'attack_resolved' && e.actorId === 'B');
    expect(oa(75)).toBe(true);
    expect(oa(74)).toBe(false);
  });

  it('Superior Hunter\'s Prey: gizlenmiş ikinci hedef 75\'te Truesight ile seçilir, 74\'te seçilmez', () => {
    const s = (ver: number) => field([
      mk('R', { ownerId: 'p1', traits: ['superior-hunters-prey'], ...SEER }),
      mk('E1', { side: 'enemies', hp: 30, maxHp: 30 }),
      mk('E2', { side: 'enemies', hp: 10, maxHp: 10, hidden: { dc: 15 } }),
    ], { R: { col: 2, row: 3 }, E1: { col: 6, row: 3 }, E2: { col: 8, row: 3 } }, ver);
    const mark = { raw: 4, rolls: [4], type: 'force' };
    const hit = (ver: number) => superiorPreyEvents(s(ver), C(s(ver), 'R'), C(s(ver), 'E1'), mark, () => 0.5).length > 0;
    expect(hit(75)).toBe(true);
    expect(hit(74)).toBe(false);
  });

  it('uyuyan ejderha: Truesight menzilindeki gizlenmiş parti üyesi 75\'te Algı zarına girer, 74\'te girmez', () => {
    const s = (ver: number): BattleState => {
      const b = field([mk('D', { side: 'enemies', asleep: true, ...SEER }), mk('A', { ownerId: 'p1', hidden: { dc: 15 } })], { D: { col: 2, row: 3 }, A: { col: 5, row: 3 } }, ver);
      return { ...b, map: { ...(b.map as NonNullable<BattleState['map']>), dragon: { id: 'D' } } as NonNullable<BattleState['map']> };
    };
    expect(dragonRoundEvents(s(75), () => 0.01).length).toBeGreaterThan(0);
    expect(dragonRoundEvents(s(74), () => 0.01)).toEqual([]);
  });

  it('beş yolun hiçbirinde ham `hidden` süzgeci kalmadı (tek sorgu `hiddenTo`)', () => {
    for (const f of ['reactions', 'features', 'classTraits', 'mastery', 'dragon']) {
      const src = readFileSync(`src/battle/${f}.ts`);
      expect(src, f).toContain('hiddenTo(');
    }
    expect(readFileSync('src/battle/reactions.ts')).not.toMatch(/!b\.hidden && canSee/);
    expect(readFileSync('src/battle/mastery.ts')).not.toMatch(/!c\.civilian && !c\.hidden\)/);
  });
});

describe('K74 Hallow: tek toplu koruma (sürüm 75)', () => {
  const cleric = (ver: number) => ({ ...field([mk('P', { ownerId: 'p1', spellNames: ['Hallow'], spellSlots: [4, 3, 3, 3, 3, 0, 0, 0, 0], spellSaveDc: 15 }), mk('G', { side: 'enemies' })],
    { P: { col: 5, row: 3 }, G: { col: 12, row: 3 } }, ver), status: 'setup' as const });
  it('75\'te tür seçimi yok sayılır, SRD\'nin altı türü birden; 74\'te seçim geçerli', () => {
    const cast: Command = { type: 'cast_spell', actorId: 'P', spellName: 'Hallow', choice: 'tur=undead' };
    expect(go(cleric(75), cast).state.map?.zones?.find((z) => z.ward)?.ward?.types).toEqual(['aberration', 'celestial', 'elemental', 'fey', 'fiend', 'undead']);
    expect(go(cleric(74), cast).state.map?.zones?.find((z) => z.ward)?.ward?.types).toEqual(['undead']);
  });

});

describe('K74b batıran çamur (sürüm 76) ve tehlike katmanı', () => {
  const kamp = (ver: number, athletics = -10): BattleState => {
    const st = startBattle('k74', 'batak', [mk('A', { ownerId: 'p1', heavyArmor: true, skills: { athletics }, hp: 40, maxHp: 40 }), mk('B', { side: 'enemies' })], () => 0.5,
      { kuralSurumu: ver, map: { id: 'batak-kamp' } }).state;
    const combatants = { ...st.combatants, A: { ...C(st, 'A'), pos: { col: 0, row: 4 } }, B: { ...C(st, 'B'), pos: { col: 18, row: 1 } } };
    return { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants };
  };
  const enter: Command = { type: 'move', actorId: 'A', to: { col: 1, row: 4 } };
  it('76: başarısız Atletizm\'de Restrained + kurtulma (Atletizm, kuralın DC\'si); başarılıda bedel yok', () => {
    const fail = go(kamp(76), enter, () => 0.01).state;
    const eff = C(fail, 'A').effects?.find((e) => e.id.startsWith('sinkMud:'));
    expect(eff?.escapeCheck).toEqual({ dc: 10, skill: 'athletics' });
    expect(C(fail, 'A').conditions).toContain('Restrained');
    const ok = go(kamp(76, 20), enter, () => 0.99).state;
    expect(C(ok, 'A').conditions).not.toContain('Restrained');
  });
  it('75: eski davranış (yalnız yürüyüş biter, saplanma yok)', () => {
    const old = go(kamp(75), enter, () => 0.01).state;
    expect(C(old, 'A').conditions).not.toContain('Restrained');
    expect(C(old, 'A').effects?.some((e) => e.id.startsWith('sinkMud:'))).toBeFalsy();
  });
  it('tehlike katmanı çamur zeminini gösterir (yalnız kurallı haritada)', () => {
    const m = hazardHexes(kamp(76), {});
    expect(m.get('1,4')).toContain('mud');
    expect(m.get('0,4') ?? []).not.toContain('mud');
    const plain = field([mk('A', { ownerId: 'p1' })], { A: { col: 1, row: 1 } }, 76);
    expect([...hazardHexes(plain, {}).values()].flat()).not.toContain('mud');
  });
});
