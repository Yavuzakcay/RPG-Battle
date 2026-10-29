/**
 * Görev B2 (SRD 5.2.1): büyü alanları. Kalıcı zemin etkileri (Entangle, Fog Cloud, Grease, Moonbeam, Silence, Spike Growth,
 * Web, Plant Growth, Sleet Storm, Stinking Cloud), geçici engel (Wind Wall), yürüyen alanlı çağrılar (Flaming Sphere,
 * Conjure Animals), Animate Dead yukarı slot. Süre bitişi, konsantrasyon kaybı, üst üste binme, uçan muafiyeti, replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, P2, mk } from './fixtures';
import { moveCostFn } from './movement';
import { chooseCommand } from './ai';
import { zoneAttackSources, zoneTurnEvents, triggerEvents } from './zones';
import { areaHexes } from '../rules/area';
import { spells } from '../data';
import summonData from '../../data/summons.json';
import srdSpells from '../../data/srd/spells.json';
import { distance, sameHex, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext, SpellZone } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const mid: Rng = () => 0.5;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const err = (r: ReturnType<typeof execute>) => (r.ok ? null : r.error);
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const SLOTS = [4, 3, 3, 3, 1, 0, 0, 0, 0];
const sword: AttackOption = { label: 'Longsword', attackBonus: 4, damage: '1d8+2', damageType: 'slashing', ranged: false, spell: false,
  tag: 'longsword', weaponId: 'longsword', weaponDamage: '1d8', abilityMod: 2 };
const bow: AttackOption = { label: 'Longbow', attackBonus: 5, damage: '1d8+3', damageType: 'piercing', ranged: true, range: [150, 600], spell: false,
  tag: 'longbow', weaponId: 'longbow', weaponDamage: '1d8', abilityMod: 3 };
const SAVES_HIGH = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

/** Düz harita; sıra A (büyücü, 3,3), B (düşman), C (dost, 2,3). */
function arena(a: Partial<Combatant> = {}, b: Partial<Combatant> = {}, c: Partial<Combatant> = {}, bPos = o(8, 3)) {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, spellMod: 3, proficiency: 3, spellSlots: SLOTS, weaponOptions: [sword, bow], ...a }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, attacks: [claw], ...b }),
    mk('C', { ownerId: 'p2', hp: 20, maxHp: 20, weaponOptions: [sword], ...c }),
  ];
  const started = startBattle('b2', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } });
  const pos: Record<string, Offset> = { A: o(3, 3), B: bPos, C: o(2, 3) };
  const combatants = { ...started.state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  const state: BattleState = { ...started.state, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } };
  return new Run(state);
}

class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, ctx: CommandContext = P1, rng: Rng = mid) {
    const r = ok(execute(this.state, cmd, ctx, rng));
    this.state = r.state;
    this.events.push(...r.events);
    return r.events;
  }
  try(cmd: Command, ctx: CommandContext = P1, rng: Rng = mid) { return err(execute(this.state, cmd, ctx, rng)); }
  cast(cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>, rng: Rng = mid) {
    return this.do({ type: 'cast_spell', actorId: 'A', ...cmd }, P1, rng);
  }
  ctx(id: string): CommandContext { const c = this.c(id); return c.side === 'enemies' ? GM : c.ownerId === 'p2' ? P2 : P1; }
  /** Sıradakinin turunu bitirir. */
  end(rng: Rng = mid) {
    const id = this.state.order[this.state.turnIndex] as string;
    return this.do({ type: 'end_turn', actorId: id }, this.ctx(id), rng);
  }
  /** Sıra verilen savaşçıya gelene dek turları bitirir. */
  to(id: string, rng: Rng = mid) { const out: BattleEvent[] = []; while (this.state.order[this.state.turnIndex] !== id) out.push(...this.end(rng)); return out; }
  round(rng: Rng = mid) { const out: BattleEvent[] = [...this.end(rng)]; out.push(...this.to('A', rng)); return out; }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  zones(): SpellZone[] { return this.state.map?.zones ?? []; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
const spell = (name: string) => spells.find((x) => x.name === name);
const saves = (evs: BattleEvent[], id: string) => evs.filter((e) => e.type === 'save_resolved' && e.targetId === id);

describe('veri: B2 büyüleri', () => {
  it('yeni büyüler SRD kimliğiyle; alanlar ve yukarı slotlar yerinde; çağırma verisi', () => {
    const ids = new Set((srdSpells.spells as Array<{ id: string }>).map((x) => `spells:${x.id}`));
    for (const n of ['Fog Cloud', 'Grease', 'Silence', 'Plant Growth', 'Sleet Storm', 'Wind Wall', 'Entangle', 'Moonbeam', 'Spike Growth', 'Web',
      'Stinking Cloud', 'Flaming Sphere', 'Conjure Animals']) {
      expect(ids.has(spell(n)?.srd ?? '')).toBe(true);
      expect(spell(n)?.mechanics.zone).toBeDefined();
    }
    expect(spell('Moonbeam')?.mechanics.upcast).toEqual({ dice: '1d10', applied: true });
    expect(spell('Flaming Sphere')?.mechanics.upcast).toEqual({ dice: '1d6', applied: true });
    expect(spell('Searing Smite')?.mechanics.upcast).toEqual({ dice: '1d6', applied: true });
    expect(spell('Moonbeam')?.mechanics).toMatchObject({ damage: '2d10', damageType: 'radiant', save: 'con', halfOnSave: true });
    expect(spells.filter((s) => s.noVerbal).map((s) => s.name).sort()).toEqual(['Counterspell', 'Hypnotic Pattern', 'Mind Spike', 'True Strike']);
    const data = summonData as unknown as { summons: Record<string, { creature?: string; intangible?: boolean; count?: unknown }>; creatures: Record<string, { srd: string }> };
    expect(data.summons['flaming-sphere']).toMatchObject({ creature: 'flaming-sphere', intangible: true });
    expect(data.summons['conjure-animals']).toMatchObject({ creature: 'spirit-pack', intangible: true });
    expect(data.summons['animate-dead']?.count).toEqual({ base: 1, perLevel: 2 });
  });
});

describe('kalıcı zemin etkileri', () => {
  it('Grease: oluşunca DEX save ya da Prone; zorlu arazi; uçan muaf; girince ve tur sonunda yeniden save; 10 tur sonra kalkar', () => {
    const r = arena({ spellNames: ['Grease'] }, {}, { fly: 30 });
    const evs = r.cast({ spellName: 'Grease', targetHex: o(8, 3) });
    expect(r.zones()).toHaveLength(1);
    expect(saves(evs, 'B')).toHaveLength(1);
    expect(r.c('B').conditions).toContain('Prone');
    expect(moveCostFn(r.state, r.c('A'))(o(7, 3), o(6, 3))).toBe(2);
    expect(moveCostFn(r.state, r.c('C'))(o(7, 3), o(6, 3))).toBe(1);
    const end = r.to('C');
    expect(saves(end, 'B')).toHaveLength(1);
    // Uçan C alana girer: save yok.
    const fly = r.do({ type: 'move', actorId: 'C', to: o(7, 4) }, P2);
    expect(saves(fly, 'C')).toHaveLength(0);
    for (let i = 0; i < 10; i++) r.round();
    expect(r.zones()).toHaveLength(0);
    r.replays();
  });
  it('üst üste binen aynı büyü: yaratık yalnızca birinden (en yüksek DC) save yapar', () => {
    const r = arena({ spellNames: ['Grease'] }, { saves: SAVES_HIGH });
    r.cast({ spellName: 'Grease', targetHex: o(8, 3) });
    r.round();
    r.cast({ spellName: 'Grease', targetHex: o(8, 4) });
    expect(r.zones()).toHaveLength(2);
    expect(saves(zoneTurnEvents(r.state, 'B', 'end', mid), 'B')).toHaveLength(1);
  });
  it('Entangle: büyücü hariç alandakiler STR save ya da Restrained (büyü sürdükçe); konsantrasyon bitince alan ve durum kalkar', () => {
    const r = arena({ spellNames: ['Entangle', 'Fog Cloud'] }, {}, {}, o(4, 3));
    r.cast({ spellName: 'Entangle', targetHex: o(4, 3) });
    expect(r.c('B').conditions).toContain('Restrained');
    expect(r.c('A').conditions).not.toContain('Restrained');
    expect(moveCostFn(r.state, r.c('C'))(o(5, 3), o(4, 3))).toBe(2);
    r.round();
    r.cast({ spellName: 'Fog Cloud', targetHex: o(10, 3) });
    expect(r.zones().map((z) => z.name)).toEqual(['Fog Cloud']);
    expect(r.c('B').conditions).not.toContain('Restrained');
    r.replays();
  });
  it('Fog Cloud: yoğun örtüdeki hedefe dezavantaj, içinden saldırana avantaj', () => {
    const r = arena({ spellNames: ['Fog Cloud'] });
    r.cast({ spellName: 'Fog Cloud', targetHex: o(9, 3) });
    expect(zoneAttackSources(r.state, r.c('A'), r.c('B'), true, false)).toEqual([{ effect: 'disadvantage', reason: 'Görülmeyen hedef (yoğun örtü)' }]);
    expect(zoneAttackSources(r.state, r.c('B'), r.c('A'), true, false)).toEqual([{ effect: 'advantage', reason: 'Görülmeyen saldıran (yoğun örtü)' }]);
    r.round();
    const atk = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: bow }).find((e) => e.type === 'attack_resolved');
    expect(atk?.type === 'attack_resolved' && atk.reasons).toContain('Görülmeyen hedef (yoğun örtü)');
    r.replays();
  });
  it('Moonbeam: oluşunca CON save 2d10; turda bir kez; sonraki turda eylemle slotsuz taşınır', () => {
    const r = arena({ spellNames: ['Moonbeam'] });
    const evs = r.cast({ spellName: 'Moonbeam', targetHex: o(8, 3) });
    expect(saves(evs, 'B')).toEqual([expect.objectContaining({ appliedDamage: 12, damageType: 'radiant' })]);
    expect(r.c('B').hp).toBe(48);
    // B kendi turunda içinde bitirir: yeni tur, yeniden save.
    r.end();
    const bEnd = r.end();
    expect(saves(bEnd, 'B')).toHaveLength(1);
    r.to('A');
    const slots = r.c('A').spellSlots;
    expect(r.try({ type: 'spell_followup', actorId: 'A', targetId: 'B' })).toBeNull();
    const moved = r.do({ type: 'spell_followup', actorId: 'A', targetId: 'B' });
    expect(moved.some((e) => e.type === 'zone_moved')).toBe(true);
    expect(r.c('A').spellSlots).toEqual(slots);
    expect(r.c('A').economy.action).toBe(true);
    r.replays();
  });
  it('Silence: içeride sözlü büyü yapılamaz, sözsüz (True Strike) yapılabilir; konsantrasyon bitince kalkar', () => {
    const r = arena({ spellNames: ['Silence', 'Fog Cloud', 'True Strike'] }, {}, {}, o(4, 3));
    r.cast({ spellName: 'Silence', targetHex: o(3, 3) });
    r.round();
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Fog Cloud', targetHex: o(9, 3) })).toMatch(/sessizlik/);
    r.cast({ spellName: 'True Strike', targetId: 'B', choice: 'Longsword' });
    r.replays();
  });
  it('Spike Growth: içinde yürüdükçe her altıgende 2d4; uçan muaf; itilen de hasar alır', () => {
    const r = arena({ spellNames: ['Spike Growth'] }, {}, {}, o(9, 3));
    r.cast({ spellName: 'Spike Growth', targetHex: o(9, 3) });
    r.end();
    const walk = r.do({ type: 'move', actorId: 'B', to: o(11, 3) }, GM);
    expect(walk.filter((e) => e.type === 'effect_tick')).toHaveLength(2);
    expect(r.c('B').hp).toBe(60 - 12);
    const f = arena({ spellNames: ['Spike Growth'] }, { fly: 30 }, {}, o(9, 3));
    f.cast({ spellName: 'Spike Growth', targetHex: o(9, 3) });
    f.end();
    expect(f.do({ type: 'move', actorId: 'B', to: o(11, 3) }, GM).some((e) => e.type === 'effect_tick')).toBe(false);
    r.replays();
  });
  it('Web: tur başında DEX save ya da Restrained; tur sonunda STR ile kurtulma save\'i; zorlu arazi', () => {
    const r = arena({ spellNames: ['Web'] });
    const cast = r.cast({ spellName: 'Web', targetHex: o(8, 3) });
    expect(saves(cast, 'B')).toHaveLength(0);
    const start = r.end();
    expect(saves(start, 'B')).toHaveLength(1);
    expect(r.c('B').conditions).toContain('Restrained');
    const end = r.end();
    expect(end.some((e) => e.type === 'effect_tick' && e.targetId === 'B' && e.save?.ability === 'str')).toBe(true);
    r.replays();
  });
  it('Plant Growth: yürüme dört kat; kalıcı (süresiz); uçan muaf', () => {
    const r = arena({ spellNames: ['Plant Growth'] }, {}, { fly: 30 });
    r.cast({ spellName: 'Plant Growth', targetHex: o(8, 3) });
    expect(r.zones()[0]?.until).toBeUndefined();
    expect(moveCostFn(r.state, r.c('A'))(o(4, 3), o(3, 3))).toBe(4);
    expect(moveCostFn(r.state, r.c('C'))(o(4, 3), o(3, 3))).toBe(1);
    r.replays();
  });
  it('Sleet Storm: tur başında DEX save ya da Prone ve konsantrasyon kaybı', () => {
    const r = arena({ spellNames: ['Sleet Storm'] }, { concentration: { spell: 'Bless', slotLevel: 1, turn: '0:0' } as Combatant['concentration'] });
    r.cast({ spellName: 'Sleet Storm', targetHex: o(8, 3) });
    r.end();
    expect(r.c('B').conditions).toContain('Prone');
    expect(r.c('B').concentration).toBeNull();
    r.replays();
  });
  it('Stinking Cloud: tur başında CON save ya da o turun sonuna dek Poisoned ve eylemsiz', () => {
    const r = arena({ spellNames: ['Stinking Cloud'] });
    r.cast({ spellName: 'Stinking Cloud', targetHex: o(8, 3) });
    r.end();
    expect(r.c('B').conditions).toEqual(expect.arrayContaining(['Poisoned', 'Incapacitated']));
    r.end();
    expect(r.c('B').conditions).not.toContain('Poisoned');
    r.replays();
  });
});

describe('geçici engel: Wind Wall', () => {
  it('oluşunca içindekiler STR save 4d8; menzilli silah saldırısı duvardan geçemez (büyü geçer); Small uçan giremez; konsantrasyonla kalkar', () => {
    const r = arena({ spellNames: ['Wind Wall', 'Fog Cloud'] }, {}, { size: 'S', fly: 30 }, o(9, 3));
    const wall = areaHexes({ shape: 'wall', sizeFt: 50, origin: 'point' }, o(3, 3), o(6, 3), { cols: 15, rows: 7 });
    // 50 ft = 10 altıgen; 7 satırlık haritada dikey duvar kenarda kırpılır.
    expect(wall.length).toBeGreaterThanOrEqual(7);
    expect(areaHexes({ shape: 'wall', sizeFt: 50, origin: 'point' }, o(7, 0), o(7, 3), { cols: 15, rows: 7 })).toHaveLength(10);
    expect(wall.every((h, i) => i === 0 || wall.slice(0, i).some((p) => distance(p, h) === 1))).toBe(true);
    expect(wall.some((h) => sameHex(h, o(6, 3)))).toBe(true);
    r.cast({ spellName: 'Wind Wall', targetHex: o(6, 3) });
    r.round();
    expect(r.try({ type: 'attack', actorId: 'A', targetId: 'B', option: bow })).toMatch(/rüzgâr duvarı/);
    expect(zoneAttackSources(r.state, r.c('A'), r.c('B'), true, true)).toEqual([]);
    expect(moveCostFn(r.state, r.c('C'))(o(6, 3), o(5, 3))).toBeNull();
    r.cast({ spellName: 'Fog Cloud', targetHex: o(12, 1) });
    expect(r.zones().map((z) => z.name)).toEqual(['Fog Cloud']);
    r.replays();
  });
  it('alandaki yaratık oluşunca save yapar (yarı hasar)', () => {
    const r = arena({ spellNames: ['Wind Wall'] }, {}, {}, o(6, 3));
    const evs = r.cast({ spellName: 'Wind Wall', targetHex: o(6, 3) });
    expect(saves(evs, 'B')).toEqual([expect.objectContaining({ ability: 'str', appliedDamage: 20, damageType: 'bludgeoning' })]);
  });
});

describe('yürüyen alanlı çağrılar', () => {
  it('Flaming Sphere: dokunulamaz küre; bitişikte tur bitiren DEX save 2d6; çarpma; konsantrasyon bitince küre ve alan kalkar', () => {
    const r = arena({ spellNames: ['Flaming Sphere', 'Fog Cloud'] }, {}, {}, o(6, 3));
    r.cast({ spellName: 'Flaming Sphere', targetHex: o(5, 3) });
    const sphere = Object.values(r.state.combatants).find((c) => c.summon?.spell === 'Flaming Sphere') as Combatant;
    expect(sphere.summon?.intangible).toBe(true);
    expect(r.zones()[0]).toMatchObject({ anchorId: sphere.id, radius: 1 });
    r.to('B');
    expect(r.try({ type: 'monster_attack', actorId: 'B', targetId: sphere.id, attackIndex: 0 }, GM)).toMatch(/dokunulamaz/);
    const bEnd = r.end();
    expect(saves(bEnd, 'B')).toEqual([expect.objectContaining({ ability: 'dex', appliedDamage: 8, damageType: 'fire' })]);
    // Kürenin sırası: çarpma (save'li saldırı) bitişikteki düşmana.
    r.to(sphere.id);
    const ram = r.do({ type: 'monster_attack', actorId: sphere.id, targetId: 'B', attackIndex: 0 }, P1);
    expect(ram.some((e) => e.type === 'save_resolved' && e.targetId === 'B')).toBe(true);
    r.to('A');
    r.cast({ spellName: 'Fog Cloud', targetHex: o(12, 1) });
    expect(r.c(sphere.id).summon?.gone).toBe(true);
    expect(r.zones().map((z) => z.name)).toEqual(['Fog Cloud']);
    r.replays();
  });
  it('Conjure Animals: ruh sürüsünün 10 ft içinde tur bitiren düşman DEX save 3d10; dost etkilenmez; yapay zekâ sürüyü düşmana yürütür', () => {
    const r = arena({ spellNames: ['Conjure Animals'] }, {}, {}, o(6, 3));
    r.cast({ spellName: 'Conjure Animals', targetHex: o(4, 3) });
    const pack = Object.values(r.state.combatants).find((c) => c.summon?.spell === 'Conjure Animals') as Combatant;
    const zone = r.zones()[0] as SpellZone;
    expect(zone).toMatchObject({ anchorId: pack.id, radius: 2 });
    expect(triggerEvents(r.state, zone, 'C', mid)).toEqual([]);
    r.to('B');
    expect(saves(r.end(), 'B')).toEqual([expect.objectContaining({ appliedDamage: 18, damageType: 'slashing' })]);
    r.to(pack.id);
    const cmd = chooseCommand(r.state);
    expect(cmd.type === 'move' || cmd.type === 'end_turn').toBe(true);
    r.replays();
  });
  it('Animate Dead: 5. slotla beş yaratık (1 + 2 × 2)', () => {
    const r = arena({ spellNames: ['Animate Dead'] });
    r.state = { ...r.state, status: 'setup' };
    r.events = [{ type: 'battle_started', state: r.state }];
    r.cast({ spellName: 'Animate Dead', form: 'skeleton', slotLevel: 5 });
    expect(Object.values(r.state.combatants).filter((c) => c.summon?.spell === 'Animate Dead')).toHaveLength(5);
    r.replays();
  });
});
