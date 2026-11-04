/**
 * Kuyruk K20: Celestial (Düşmüş) ev kuralı. Kural kapalı/açık, eski kayıt (kural sürümü), Şifa Eli (dokunuş, PB × d4,
 * uzun dinlenme), Göksel Uyanış'ın üç biçimi (Parlayan Ruh aurası, Gece Gözyaşı korkusu, Kırık Kanat sınırı), direnç,
 * Light. Replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import { isAirborne } from './flight';
import { adjustDamage } from '../rules/damage';
import { blankCharacter } from '../rules/builder';
import { longRestStatus, fullStatus } from '../rules/characterRest';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';
import { AWAKEN_KEY, HEAL_KEY } from './celestial';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const low: Rng = () => 0.01;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };

const sheet = (patch: Partial<CharacterSheet>): CharacterSheet => ({
  ...blankCharacter('k20').sheet, name: 'Düşmüş', raceId: 'celestial', classId: 'fighter', level: 3, armorName: 'Chain Mail', weapons: [{ name: 'Longsword' }], ...patch,
});
const hero = (patch: Partial<CharacterSheet> = {}, id = 'A') => combatantFromSheet(sheet(patch), { id, ownerId: 'p1' });

/** Düz zemin: A (Celestial, 3,3), C (dost, 2,3), B (düşman, 4,3). */
function arena(a: Combatant, opts: { on?: boolean; kuralSurumu?: number; b?: Partial<Combatant> } = {}) {
  const ally = { ...hero({ raceId: 'human', name: 'Dost' }, 'C'), hp: 5 };
  const parts = [a, ally, mk('B', { side: 'enemies', hp: 80, maxHp: 80, saves: { str: 0, dex: 0, con: 0, int: 0, wis: -5, cha: 0 }, ...opts.b })];
  const started = startBattle('k20', 'd-z-zemin', parts, () => 0.5, {
    map: { id: 'col' }, ...(opts.on !== false ? { houseRules: { celestialIrki: true } } : {}), ...(opts.kuralSurumu ? { kuralSurumu: opts.kuralSurumu } : {}) });
  const combatants = { ...started.state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: o(3, 3) };
  combatants.C = { ...(combatants.C as Combatant), pos: o(2, 3) };
  combatants.B = { ...(combatants.B as Combatant), pos: o(4, 3) };
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  const state: BattleState = { ...started.state, status: 'active', order: ['A', 'C', 'B'], turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } };
  const events: BattleEvent[] = [{ type: 'battle_started', state }];
  const run = {
    state, events,
    do(cmd: Command, ctx: CommandContext = P1, rng: Rng = high) {
      const r = ok(execute(run.state, cmd, ctx, rng));
      run.state = r.state; run.events.push(...r.events);
      return r.events;
    },
    try: (cmd: Command, rng: Rng = high) => execute(run.state, cmd, P1, rng),
    c: (id: string) => run.state.combatants[id] as Combatant,
  };
  return run;
}

describe('Celestial ev kuralı', () => {
  it('Kuyruk K49: kalıcı ırk (sürüm 22): ev kuralı verilmese de özellikler ve Light var', () => {
    const r = arena(hero(), { on: false });
    expect(r.c('A').spellNames).toContain('Light');
    expect(r.c('A').features?.map((f) => f.key)).toEqual(expect.arrayContaining([HEAL_KEY, AWAKEN_KEY]));
  });
  it('eski kayıt (sürüm 18–21) ev kuralı kapalıyken özellik ve Light yok; direnç ve karanlık görüş eskisi gibi', () => {
    const r = arena(hero(), { on: false, kuralSurumu: 21 });
    expect(r.c('A').features?.some((f) => f.key.startsWith('ev:celestial/'))).toBeFalsy();
    expect(r.c('A').spellNames).not.toContain('Light');
    expect(r.c('A').resistances).toEqual(expect.arrayContaining(['necrotic', 'radiant']));
    expect(adjustDamage(10, 'radiant', r.c('A')).amount).toBe(5);
    expect(r.c('A').darkvision).toBe(60);
  });
  it('eski kural sürümünde (17) kural açık olsa da yeni mekanik yok', () => {
    const r = arena(hero(), { kuralSurumu: 17 });
    expect(r.c('A').features?.some((f) => f.key.startsWith('ev:celestial/'))).toBeFalsy();
  });
  it('kural açıkken Light bilinir, Şifa Eli ve (3. seviyede) Göksel Uyanış menüde', () => {
    const r = arena(hero());
    expect(r.c('A').spellNames).toContain('Light');
    expect(r.c('A').features?.map((f) => f.key)).toEqual(expect.arrayContaining([HEAL_KEY, AWAKEN_KEY]));
    const r1 = arena(hero({ level: 2 }));
    expect(r1.c('A').features?.map((f) => f.key)).toContain(HEAL_KEY);
    expect(r1.c('A').features?.map((f) => f.key)).not.toContain(AWAKEN_KEY);
  });
});

describe('Şifa Eli', () => {
  it('bitişik dosta eylemle PB × d4; bir kez; uzun dinlenmede yenilenir', () => {
    const r = arena(hero());
    const ev = r.do({ type: 'use_feature', actorId: 'A', feature: HEAL_KEY, targetId: 'C' });
    const heal = ev.find((e) => e.type === 'healed') as Extract<BattleEvent, { type: 'healed' }>;
    expect(heal.amount).toBe(8); // PB 2 × d4 (en yüksek)
    expect(r.c('C').hp).toBe(13);
    expect(r.c('A').economy.action).toBe(true);
    expect(r.c('A').resources.celestialHeal).toBe(0);
    expect(r.try({ type: 'use_feature', actorId: 'A', feature: HEAL_KEY, targetId: 'C' }).ok).toBe(false);
    expect(replay(r.events)).toEqual(r.state);
    // Uzun dinlenme: kaynak karakterde yeniden dolar.
    const s = sheet({});
    const spent = { ...fullStatus(s), resources: { ...fullStatus(s).resources, celestialHeal: 0 } };
    expect(longRestStatus(s, spent).resources.celestialHeal).toBe(1);
  });
  it('uzaktaki dosta dokunulamaz', () => {
    const r = arena(hero());
    r.state = { ...r.state, combatants: { ...r.state.combatants, C: { ...r.c('C'), pos: o(8, 3) } } };
    expect(r.try({ type: 'use_feature', actorId: 'A', feature: HEAL_KEY, targetId: 'C' }).ok).toBe(false);
  });
});

describe('Göksel Uyanış', () => {
  const swing = (r: ReturnType<typeof arena>) =>
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: r.c('A').weaponOptions[0] as Combatant['weaponOptions'][number] });
  it('Parlayan Ruh: bonus eylem; turda bir kez isabete +PB ışıltı; tur sonunda 10 ft içindeki düşmana PB', () => {
    const r = arena(hero({ celestialAwakening: 'parlayan-ruh' }));
    r.do({ type: 'use_feature', actorId: 'A', feature: AWAKEN_KEY });
    expect(r.c('A').economy.bonus).toBe(true);
    expect(r.c('A').effects?.find((e) => e.id === AWAKEN_KEY)?.light).toBe(2);
    const first = swing(r).find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(first.extra?.filter((x) => x.label === 'Göksel Uyanış')).toHaveLength(1);
    expect(first.extra?.find((x) => x.label === 'Göksel Uyanış')).toMatchObject({ raw: 2, type: 'radiant' });
    const hpBefore = r.c('B').hp;
    r.do({ type: 'end_turn', actorId: 'A' });
    const tick = r.events.find((e) => e.type === 'effect_tick' && e.targetId === 'B') as Extract<BattleEvent, { type: 'effect_tick' }>;
    expect(tick).toMatchObject({ appliedDamage: 2, damageType: 'radiant' });
    expect(r.c('B').hp).toBe(hpBefore - 2);
    expect(r.c('C').hp).toBe(5); // dosta işlemez
    expect(replay(r.events)).toEqual(r.state);
  });
  it('Gece Gözyaşı: 10 ft içindeki düşman WIS save; başarısızsa sonraki turunun başına dek Frightened; ek hasar ölümsüz', () => {
    const r = arena(hero({ celestialAwakening: 'gece-gozyasi' }));
    r.do({ type: 'use_feature', actorId: 'A', feature: AWAKEN_KEY }, P1, low);
    const save = r.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
    expect(save).toMatchObject({ ability: 'wis', success: false });
    expect(save.dc).toBe(8 + 2 + r.c('A').modifiers.cha);
    expect(r.c('B').effects?.some((e) => e.grants?.includes('Frightened'))).toBe(true);
    expect(r.c('A').effects?.find((e) => e.id === AWAKEN_KEY)?.celestialStrike).toEqual({ bonus: 2, type: 'necrotic' });
    expect(replay(r.events)).toEqual(r.state);
  });
  it('Kırık Kanat: yalnızca kendi turunda yarım hızla süzülür, tur sonunda yere iner, sonraki turunda yine süzülür', () => {
    const r = arena(hero({ celestialAwakening: 'kirik-kanat' }));
    r.do({ type: 'use_feature', actorId: 'A', feature: AWAKEN_KEY });
    expect(isAirborne(r.c('A'))).toBe(true);
    expect(r.c('A').effects?.find((e) => e.fly)?.fly).toBe(15);
    r.do({ type: 'end_turn', actorId: 'A' });
    expect(isAirborne(r.c('A'))).toBe(false);
    // Sıra yeniden A'ya gelince süzülme açılır (tam uçuş yok: tur sonunda yine iner).
    r.state = { ...r.state, turnIndex: 2 };
    r.events.push({ type: 'battle_started', state: r.state });
    r.do({ type: 'end_turn', actorId: 'B' }, { playerId: null, isGm: true });
    expect(r.state.order[r.state.turnIndex]).toBe('A');
    expect(isAirborne(r.c('A'))).toBe(true);
  });
  it('uzun dinlenmede bir kez; ikinci kullanım reddedilir', () => {
    const r = arena(hero());
    r.do({ type: 'use_feature', actorId: 'A', feature: AWAKEN_KEY });
    expect(r.c('A').resources.celestialAwakening).toBe(0);
    expect(r.try({ type: 'use_feature', actorId: 'A', feature: AWAKEN_KEY }).ok).toBe(false);
  });
});
