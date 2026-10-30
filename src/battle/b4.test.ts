/**
 * Görev B4 (SRD 5.2.1): aydınlatma ve karanlık (Light, Dancing Lights, Continual Flame, Daylight, Darkness, Faerie Fire,
 * Starry Wisp, Flame Blade), görünmezlik (Faerie Fire, See Invisibility), seçilebilen hasar türü (Sorcerous Burst) ve
 * savaş dışı büyüler (Game Master'a not). Konsantrasyon, süre ve replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, P2, mk } from './fixtures';
import { canSee, litHexes, magicDarkHexes } from './maprules';
import { spells } from '../data';
import { withinRange, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const mid: Rng = () => 0.5;
const high: Rng = () => 0.99;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const err = (r: ReturnType<typeof execute>) => (r.ok ? null : r.error);
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const SLOTS = [4, 3, 3, 3, 0, 0, 0, 0, 0];
const sword: AttackOption = { label: 'Longsword', attackBonus: 4, damage: '1d8+2', damageType: 'slashing', ranged: false, spell: false,
  tag: 'longsword', weaponId: 'longsword', weaponDamage: '1d8', abilityMod: 2 };
const bow: AttackOption = { label: 'Longbow', attackBonus: 5, damage: '1d8+3', damageType: 'piercing', ranged: true, range: [150, 600], spell: false,
  tag: 'longbow', weaponId: 'longbow', weaponDamage: '1d8', abilityMod: 3 };
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };

/** Düz zemin (harita kuralları `mapId`'den); sıra A (büyücü, 3,3), B (düşman), C (dost, 2,3). */
function arena(a: Partial<Combatant> = {}, b: Partial<Combatant> = {}, c: Partial<Combatant> = {}, bPos = o(4, 3), mapId = 'col') {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, spellMod: 3, proficiency: 3, spellSlots: SLOTS, weaponOptions: [sword, bow], ...a }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, attacks: [claw], saves: LOW, ...b }),
    mk('C', { ownerId: 'p2', hp: 20, maxHp: 20, weaponOptions: [sword], ...c }),
  ];
  const started = startBattle('b4', 'd-z-zemin', parts, () => 0.5, { map: { id: mapId } });
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
  end(rng: Rng = mid) {
    const id = this.state.order[this.state.turnIndex] as string;
    return this.do({ type: 'end_turn', actorId: id }, this.ctx(id), rng);
  }
  to(id: string, rng: Rng = mid) { const out: BattleEvent[] = []; while (this.state.order[this.state.turnIndex] !== id) out.push(...this.end(rng)); return out; }
  round(rng: Rng = mid) { const out: BattleEvent[] = [...this.end(rng)]; out.push(...this.to('A', rng)); return out; }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  fx(id: string, srd: string) { return this.c(id).effects?.find((e) => e.id === srd); }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
const key = (h: Offset) => `${h.col},${h.row}`;
/** Karanlık haritada çevresi (2 altıgen) tamamen ışıksız bir altıgen. */
function darkSpot(state: BattleState, avoid: Offset[] = []): Offset {
  const lit = litHexes(state);
  const size = { cols: 15, rows: 7 };
  for (let col = 1; col < 14; col++) for (let row = 1; row < 6; row++) {
    const h = o(col, row);
    if (avoid.some((a) => Math.abs(a.col - col) + Math.abs(a.row - row) < 3)) continue;
    if (withinRange(h, 2, size).every((x) => !lit.has(key(x)))) return h;
  }
  throw new Error('ışıksız yer yok');
}
const attackMode = (evs: BattleEvent[]) => { const e = evs.find((x) => x.type === 'attack_resolved'); return e?.type === 'attack_resolved' ? e.mode : null; };

describe('ışık ve karanlık (karanlık haritası)', () => {
  it('Light: dokunulan dost 4 altıgen aydınlık yayar; süre 600 tur', () => {
    const r = arena({ spellNames: ['Light'] }, {}, {}, o(13, 0), 'magara');
    const spot = darkSpot(r.state);
    const near = o(spot.col, spot.row + 1);
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), pos: spot }, C: { ...r.c('C'), pos: near } } };
    expect(litHexes(r.state).has(key(near))).toBe(false);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Light', targetIds: ['C'] });
    expect(r.fx('C', 'spells:light')).toMatchObject({ light: 4, until: r.state.round + 599 });
    expect(litHexes(r.state).has(key(near))).toBe(true);
    expect(litHexes(r.state).has(key(spot))).toBe(true);
  });
  it('Darkness: alan ışıksız (ışık aydınlatamaz), yoğun örtü, karanlık görüş içini göremez; Daylight örtüşen Darkness\'ı kaldırır', () => {
    const r = arena({ spellNames: ['Darkness', 'Daylight', 'Light'], darkvision: 60 }, {}, {}, o(9, 3), 'magara');
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Light', targetIds: ['A'] });
    r.round();
    expect(canSee(r.state, r.c('A'), r.c('B'))).toBe(true);
    r.cast({ spellName: 'Darkness', targetHex: o(9, 3) });
    expect(r.state.map?.zones?.some((z) => z.spellId === 'darkness')).toBe(true);
    expect(magicDarkHexes(r.state).has(key(o(9, 3)))).toBe(true);
    expect(litHexes(r.state).has(key(o(9, 3)))).toBe(false);
    expect(canSee(r.state, r.c('A'), r.c('B'))).toBe(false);
    expect(r.c('A').concentration?.spell).toBe('Darkness');
    r.round();
    const evs = r.cast({ spellName: 'Daylight', targetHex: o(7, 3) });
    expect(evs.some((e) => e.type === 'zone_ended' && e.reason === 'dispelled')).toBe(true);
    expect(litHexes(r.state).has(key(o(9, 3)))).toBe(true);
    r.replays();
  });
  it('Dancing Lights: ışık noktası çevresiyle aydınlık; konsantrasyonla biter', () => {
    const r = arena({ spellNames: ['Dancing Lights', 'Darkness'] }, {}, {}, o(13, 0), 'magara');
    const spot = darkSpot(r.state, [o(3, 3), o(2, 3)]);
    r.cast({ spellName: 'Dancing Lights', targetHex: spot });
    expect(litHexes(r.state).has(key(spot))).toBe(true);
    expect(litHexes(r.state).has(key(o(spot.col, spot.row + 1)))).toBe(true);
    r.round();
    r.cast({ spellName: 'Darkness', targetHex: o(9, 0) });
    expect(r.state.map?.zones?.some((z) => z.spellId === 'dancing-lights')).toBe(false);
    r.replays();
  });
});

describe('görünmezlik', () => {
  it('Faerie Fire: DEX save başarısızsa işaretli; Invisible yararı yok, saldırı avantajlı, ışık', () => {
    const r = arena({ spellNames: ['Faerie Fire'] }, { conditions: ['Invisible'] }, {}, o(6, 3));
    r.cast({ spellName: 'Faerie Fire', targetHex: o(6, 3) });
    expect(r.fx('B', 'spells:faerie-fire')).toMatchObject({ revealed: true, attackedAdv: true, light: 2, concentration: 'Faerie Fire' });
    r.round();
    expect(attackMode(r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: bow }))).toBe('advantage');
    r.replays();
  });
  it('See Invisibility: görünmez hedefe dezavantaj yok', () => {
    const r = arena({ spellNames: ['See Invisibility'] }, { conditions: ['Invisible'] }, {}, o(6, 3));
    expect(attackMode(ok(execute(r.state, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, mid)).events)).toBe('disadvantage');
    r.cast({ spellName: 'See Invisibility' });
    r.round();
    expect(attackMode(r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: bow }))).toBe('normal');
  });
  it('Starry Wisp: isabette radiant; hedef işaretli (görünmez olamaz, ışık)', () => {
    const r = arena({ spellNames: ['Starry Wisp'] }, {}, {}, o(6, 3));
    const evs = r.cast({ spellName: 'Starry Wisp', targetId: 'B' }, high);
    const hit = evs.find((e) => e.type === 'attack_resolved');
    expect(hit?.type === 'attack_resolved' && hit.hit && hit.damageType === 'radiant').toBe(true);
    expect(r.fx('B', 'spells:starry-wisp')).toMatchObject({ revealed: true, light: 2 });
    r.replays();
  });
});

describe('saldırı büyüleri', () => {
  it('Flame Blade: bonus eylemle hazır (saldırı yok, ışık); aynı tur eylemle 3d6 + yetenek fire; eylem bir kez', () => {
    const r = arena({ spellNames: ['Flame Blade'] });
    const cast = r.cast({ spellName: 'Flame Blade', targetId: 'B' });
    expect(cast.some((e) => e.type === 'attack_resolved')).toBe(false);
    expect(r.c('A').economy.bonus).toBe(true);
    expect(r.c('A').concentration?.spell).toBe('Flame Blade');
    expect(r.fx('A', 'spells:flame-blade')?.light).toBe(2);
    const evs = r.do({ type: 'spell_followup', actorId: 'A', targetId: 'B' }, P1, high);
    const hit = evs.find((e) => e.type === 'attack_resolved');
    expect(hit?.type === 'attack_resolved' && hit.hit && hit.damageType === 'fire').toBe(true);
    expect(r.try({ type: 'spell_followup', actorId: 'A', targetId: 'B' })).not.toBeNull();
    r.replays();
  });
  it('Sorcerous Burst: hasar türü seçilir (yoksa Fire)', () => {
    const r = arena({ spellNames: ['Sorcerous Burst'] }, {}, {}, o(6, 3));
    const evs = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Sorcerous Burst', targetId: 'B', choice: 'cold' }, P1, high);
    const e = evs.find((x) => x.type === 'attack_resolved');
    expect(e?.type === 'attack_resolved' && e.damageType).toBe('cold');
    r.round();
    const f = r.cast({ spellName: 'Sorcerous Burst', targetId: 'B' }, high).find((x) => x.type === 'attack_resolved');
    expect(f?.type === 'attack_resolved' && f.damageType).toBe('fire');
  });
});

describe('savaş dışı büyüler', () => {
  it('her savaş dışı büyünün Game Master notu var; yapınca günlüğe not düşer', () => {
    const off = spells.filter((s) => s.mechanics.offCombat);
    expect(off.length).toBeGreaterThanOrEqual(25);
    for (const s of off) expect(s.mechanics.gmNote, s.name).toBeTruthy();
    const r = arena({ spellNames: ['Detect Magic'] });
    const ev = r.cast({ spellName: 'Detect Magic' }).find((e) => e.type === 'spell_cast');
    expect(ev?.type === 'spell_cast' && ev.note).toMatch(/Game Master'a not/);
    r.replays();
  });
});
