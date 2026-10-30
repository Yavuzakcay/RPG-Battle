/**
 * Görev K3: tür soyları. Veri (her seçenekte TR/EN özet), Dragonborn ata türü (nefes + direnç), Tiefling, Elf, Gnome
 * soy büyüleri ve slotsuz kullanımları, karanlık görüş ve hız, Goliath Giant Ancestry (isabet, tepki, ışınlanma),
 * eski kayıtta boş soy. Replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk } from './fixtures';
import { races } from '../data';
import { blankCharacter } from '../rules/builder';
import { lineageSpells, migrateLineages } from '../rules/lineage';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const mid: Rng = () => 0.5;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };

const sheet = (patch: Partial<CharacterSheet>): CharacterSheet => ({
  ...blankCharacter('k3').sheet, name: 'Soy', armorName: 'Chain Mail', weapons: [{ name: 'Longsword' }], ...patch,
});
const hero = (patch: Partial<CharacterSheet>) => combatantFromSheet(sheet(patch), { id: 'A', ownerId: 'p1' });

/** Düz zemin: A (karakter, 3,3) ve B (düşman, 4,3). */
function arena(a: Combatant, b: Partial<Combatant> = {}) {
  const claw = { name: 'Claw', bonus: 30, damageDice: '1d8+10', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
  const parts = [a, mk('B', { side: 'enemies', hp: 80, maxHp: 80, attacks: [claw], ...b })];
  const started = startBattle('k3', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } });
  const combatants = { ...started.state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: o(3, 3) };
  combatants.B = { ...(combatants.B as Combatant), pos: o(4, 3) };
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  const state: BattleState = { ...started.state, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } };
  const events: BattleEvent[] = [{ type: 'battle_started', state }];
  const run = {
    state, events,
    do(cmd: Command, ctx: CommandContext = P1, rng: Rng = high) {
      const r = ok(execute(run.state, cmd, ctx, rng));
      run.state = r.state; run.events.push(...r.events);
      return r.events;
    },
    c: (id: string) => run.state.combatants[id] as Combatant,
  };
  return run;
}

describe('soy verisi', () => {
  it('her soy seçeneğinin TR ve EN özeti dolu; büyüleri spells.json\'da', () => {
    const all = races.flatMap((r) => r.lineages ?? []);
    expect(all.length).toBeGreaterThanOrEqual(10 + 3 + 3 + 2 + 6);
    for (const l of all) {
      expect(l.summary.tr.trim(), l.id).not.toBe('');
      expect(l.summary.en.trim(), l.id).not.toBe('');
    }
    for (const id of ['elf', 'gnome', 'goliath']) expect(races.find((r) => r.id === id)?.lineages?.length).toBeGreaterThan(1);
  });
});

describe('Dragonborn ata türü', () => {
  const TABLE: Record<string, string> = { black: 'acid', copper: 'acid', blue: 'lightning', bronze: 'lightning', brass: 'fire', gold: 'fire', red: 'fire',
    green: 'poison', silver: 'cold', white: 'cold' };
  it('10 atanın her biri nefes hasar türünü ve direnci belirler', () => {
    for (const [id, type] of Object.entries(TABLE)) {
      const c = hero({ raceId: 'dragonborn', lineageId: id });
      expect(c.breath?.damageType, id).toBe(type);
      expect(c.resistances, id).toEqual([type]);
    }
  });
});

describe('Tiefling, Elf, Gnome soy büyüleri', () => {
  it('Tiefling: direnç ve seviyeye göre büyüler; seviyeli büyü uzun dinlenmede bir kez slotsuz', () => {
    const ab = hero({ raceId: 'tiefling', lineageId: 'abyssal', level: 5 });
    expect(ab.resistances).toEqual(['poison']);
    expect(ab.spellNames).toEqual(expect.arrayContaining(['Poison Spray', 'Ray of Sickness', 'Hold Person']));
    expect(ab.resources['abyssal:ray-of-sickness']).toBe(1);
    expect(ab.resources['abyssal:hold-person']).toBe(1);
    const ch1 = hero({ raceId: 'tiefling', lineageId: 'chthonic', level: 1 });
    expect(ch1.resistances).toEqual(['necrotic']);
    expect(ch1.spellNames).toContain('Chill Touch');
    expect(ch1.spellNames).not.toContain('False Life');
    expect(ch1.resources['chthonic:false-life']).toBeUndefined();
    const inf = hero({ raceId: 'tiefling', lineageId: 'infernal', level: 3 });
    expect(inf.resistances).toEqual(['fire']);
    expect(inf.spellNames).toEqual(expect.arrayContaining(['Fire Bolt', 'Hellish Rebuke']));
    expect(inf.spellNames).not.toContain('Darkness');
    expect(inf.reactions?.some((r) => r.name === 'Hellish Rebuke')).toBe(true);
    // Büyücü olmayan sınıfta soy büyüsünün yeteneği INT/WIS/CHA'nın en yükseği.
    expect(inf.spellSaveDc).not.toBeNull();
  });
  it('Elf: Drow karanlık görüş 120, High Elf Misty Step (5), Wood Elf hız 35', () => {
    const drow = hero({ raceId: 'elf', lineageId: 'drow', level: 3 });
    expect(drow.darkvision).toBe(120);
    expect(drow.spellNames).toEqual(expect.arrayContaining(['Dancing Lights', 'Faerie Fire']));
    expect(drow.resources['drow:faerie-fire']).toBe(1);
    const high5 = hero({ raceId: 'elf', lineageId: 'high-elf', level: 5 });
    expect(high5.darkvision).toBe(60);
    expect(high5.spellNames).toEqual(expect.arrayContaining(['Prestidigitation', 'Detect Magic', 'Misty Step']));
    const wood = hero({ raceId: 'elf', lineageId: 'wood-elf', level: 1 });
    expect(wood.speed).toBe(35);
    expect(wood.spellNames).toContain('Druidcraft');
    expect(hero({ raceId: 'elf', lineageId: 'drow' }).speed).toBe(30);
  });
  it('Gnome: Forest Speak with Animals yetkinlik bonusu kadar, Rock Mending + Prestidigitation', () => {
    const forest = hero({ raceId: 'gnome', lineageId: 'forest-gnome', level: 5 });
    expect(forest.spellNames).toEqual(expect.arrayContaining(['Minor Illusion', 'Speak with Animals']));
    expect(forest.resources['forest-gnome:speak-with-animals']).toBe(3);
    const rock = hero({ raceId: 'gnome', lineageId: 'rock-gnome' });
    expect(lineageSpells(sheet({ raceId: 'gnome', lineageId: 'rock-gnome' }))).toEqual(['Mending', 'Prestidigitation']);
    expect(rock.spellNames).toEqual(expect.arrayContaining(['Mending', 'Prestidigitation']));
  });
  it('Drow Faerie Fire slotsuz yapılır, kaynak düşer; replay aynı', () => {
    const r = arena(hero({ raceId: 'elf', lineageId: 'drow', level: 3 }));
    expect(r.c('A').spellSlots.every((n) => n === 0)).toBe(true);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Faerie Fire', targetHex: o(4, 3) });
    expect(r.c('A').resources['drow:faerie-fire']).toBe(0);
    expect(replay(r.events)).toEqual(r.state);
  });
});

describe('Goliath Giant Ancestry', () => {
  const goliath = (id: string) => hero({ raceId: 'goliath', lineageId: id, level: 1 });
  const swing = (r: ReturnType<typeof arena>) =>
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: r.c('A').weaponOptions[0] as Combatant['weaponOptions'][number] });
  it('kaynak yetkinlik bonusu kadar; Fire\'s Burn isabette +1d10 Fire, turda bir kez', () => {
    const r = arena(goliath('fire'));
    expect(r.c('A').resources.giantAncestry).toBe(2);
    const ev = swing(r);
    const hit = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(hit.extra?.some((x) => x.label === "Fire's Burn" && x.type === 'fire')).toBe(true);
    expect(r.c('A').resources.giantAncestry).toBe(1);
    expect(replay(r.events)).toEqual(r.state);
  });
  it('Frost\'s Chill hedefi yavaşlatır, Hill\'s Tumble Prone yapar', () => {
    const f = arena(goliath('frost'));
    swing(f);
    expect(f.c('B').marks?.some((m) => m.kind === 'slow' && m.feet === 10)).toBe(true);
    const h = arena(goliath('hill'));
    swing(h);
    expect(h.c('B').conditions).toContain('Prone');
    expect(replay(h.events)).toEqual(h.state);
  });
  it('Stone\'s Endurance ve Storm\'s Thunder tepkileri, Cloud\'s Jaunt ışınlanma', () => {
    const stone = goliath('stone');
    expect(stone.reactions?.find((x) => x.name === "Stone's Endurance")).toMatchObject({ kind: 'reduce', resource: 'giantAncestry' });
    const storm = arena(goliath('storm'), { attacks: [{ name: 'Claw', bonus: 30, damageDice: '1d2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' }] });
    storm.state = { ...storm.state, turnIndex: 1 };
    storm.events[0] = { type: 'battle_started', state: storm.state };
    storm.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, mid);
    const thunder = storm.events.find((e) => e.type === 'extra_damage' && e.label === "Storm's Thunder");
    expect(thunder).toBeDefined();
    expect(storm.c('A').resources.giantAncestry).toBe(1);
    expect(replay(storm.events)).toEqual(storm.state);
    const cloud = arena(goliath('cloud'));
    cloud.do({ type: 'use_feature', actorId: 'A', feature: 'species:goliath/clouds-jaunt', to: o(8, 3) });
    expect(cloud.c('A').pos).toEqual(o(8, 3));
    expect(cloud.c('A').economy.bonus).toBe(true);
    expect(cloud.c('A').resources.giantAncestry).toBe(1);
  });
});

describe('eski kayıt', () => {
  it('soyu boş Elf/Gnome/Goliath ilk soyu alır (bir kerelik not); geçerli soy ve soysuz tür değişmez', () => {
    const list = [
      { ...blankCharacter('a'), sheet: sheet({ name: 'E', raceId: 'elf' }) },
      { ...blankCharacter('b'), sheet: sheet({ name: 'G', raceId: 'gnome' }) },
      { ...blankCharacter('c'), sheet: sheet({ name: 'O', raceId: 'goliath' }) },
      { ...blankCharacter('d'), sheet: sheet({ name: 'W', raceId: 'elf', lineageId: 'wood-elf' }) },
      { ...blankCharacter('e'), sheet: sheet({ name: 'H', raceId: 'human' }) },
    ];
    const m = migrateLineages(list);
    expect(m.list.map((c) => c.sheet.lineageId)).toEqual(['drow', 'forest-gnome', 'cloud', 'wood-elf', undefined]);
    expect(m.assigned.map((a) => a.name)).toEqual(['E', 'G', 'O']);
    expect(migrateLineages(m.list).assigned).toEqual([]);
  });
});
