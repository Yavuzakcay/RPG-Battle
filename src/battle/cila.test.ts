/**
 * Gece kuyruğu CILA (SRD 5.2.1): B1/B2 sapmalarının düzeltmeleri. Haste ek eylemi, Slow (DEX −2, eylem ya da bonus
 * eylem, tek saldırı), Ray of Enfeeblement (STR saldırı ve kontrol dezavantajı), Entangle/Web eylemle kurtulma, sis
 * içinden görüş, Wind Wall, Acid Arrow yukarı slotu, Silence Thunder bağışıklığı, Blindness/Deafness Deafened, çağrının
 * bonus eylemle taşınması, yapay zekânın alan büyüleri. Replay her testte.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, P2, mk } from './fixtures';
import { checkMode } from '../rules/skills';
import { saveDice } from './effectDice';
import { distance, type Offset } from '../rules/hex';
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
  const started = startBattle('cila', 'd-z-zemin', parts, () => 0.5, { map: { id: mapId } });
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
const attackMode = (evs: BattleEvent[]) => { const e = evs.find((x) => x.type === 'attack_resolved'); return e?.type === 'attack_resolved' ? e.mode : null; };

describe('CILA 1: Haste, Slow, Ray of Enfeeblement', () => {
  it('Haste: eylemden sonra ek eylem; yalnızca tek saldırı (büyü yok), turda bir', () => {
    const r = arena({ spellNames: ['Haste', 'Fire Bolt'], attacksPerAction: 2 });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Haste', targetIds: ['A'] });
    expect(r.try({ type: 'haste_action', actorId: 'A' })).toBeNull();
    r.do({ type: 'haste_action', actorId: 'A' });
    expect(r.c('A').economy).toMatchObject({ action: false, hasted: true, hasteUsed: true });
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' })).toMatch(/Haste/);
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword });
    expect(r.c('A').economy.attacksLeft).toBe(0);
    expect(r.try({ type: 'haste_action', actorId: 'A' })).toMatch(/bu tur/);
    r.round();
    expect(r.try({ type: 'haste_action', actorId: 'A' })).toMatch(/Önce eylemini/);
    r.replays();
  });
  it('Slow: DEX save −2; eylem ya da bonus eylem (ikisi değil); Attack tek saldırı', () => {
    const r = arena({ spellNames: ['Slow'] }, { attacksPerAction: 2 });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Slow', targetIds: ['B'] });
    expect(r.fx('B', 'spells:slow')).toMatchObject({ slowed: true, saveMod: { dex: -2 } });
    expect(saveDice(r.c('B'), 'dex')).toEqual([expect.objectContaining({ die: '2', sign: -1 })]);
    expect(saveDice(r.c('B'), 'wis')).toEqual([]);
    const c = r.c('C');
    const slowedC: Combatant = { ...c, effects: [{ id: 'spells:slow', name: 'Slow', sourceId: 'B', slowed: true }], attacksPerAction: 2, bonusActions: ['dash'] };
    r.state = { ...r.state, combatants: { ...r.state.combatants, C: { ...slowedC, pos: o(4, 4) } } };
    r.to('C');
    r.do({ type: 'attack', actorId: 'C', targetId: 'B', option: sword }, P2);
    expect(r.c('C').economy.attacksLeft).toBe(0);
    expect(r.try({ type: 'dash', actorId: 'C', bonus: true }, P2)).toMatch(/Slow/);
  });
  it('Ray of Enfeeblement: yakın dövüş (STR) saldırısı ve STR kontrolleri dezavantajlı', () => {
    const r = arena({ spellNames: ['Ray of Enfeeblement'] }, { saves: { ...LOW, con: -10 } });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Ray of Enfeeblement', targetIds: ['B'] });
    expect(checkMode(r.c('B'), 'athletics')).toBe('disadvantage');
    r.end();
    expect(attackMode(r.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM))).toBe('disadvantage');
    r.replays();
  });
});

describe('CILA 2: Entangle ve Web\'den eylemle kurtulma', () => {
  it('Restrained (Entangle): tur sonu save yok; eylemle Athletics kontrolü DC\'yi geçerse kurtulur', () => {
    const r = arena({ spellNames: ['Entangle'] }, { saves: LOW }, {}, o(6, 3));
    r.cast({ spellName: 'Entangle', targetHex: o(6, 3) });
    expect(r.c('B').conditions).toContain('Restrained');
    const fx = r.c('B').effects?.find((e) => e.escapeCheck);
    expect(fx).toMatchObject({ escapeCheck: { dc: 13 } });
    expect(fx?.repeatSave).toBeUndefined();
    r.end();
    const failEv = r.do({ type: 'escape', actorId: 'B' }, GM, () => 0.01);
    expect(failEv[0]).toMatchObject({ type: 'grapple_escape', success: false });
    expect(r.c('B').conditions).toContain('Restrained');
    r.round();
    r.to('B');
    const ok2 = r.do({ type: 'escape', actorId: 'B' }, GM, high);
    expect(ok2[0]).toMatchObject({ type: 'grapple_escape', success: true });
    expect(r.c('B').conditions).not.toContain('Restrained');
    r.replays();
  });
});

const place = (r: Run, id: string, at: Offset) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...r.c(id), pos: at } } }; r.events = [{ type: 'battle_started', state: r.state }]; };

describe('CILA 3–4: sis içinden görüş, Wind Wall', () => {
  it('arada yoğun örtü (Fog Cloud): iki taraf birbirini görmez, avantaj ve dezavantaj birbirini götürür', () => {
    const r = arena({ spellNames: ['Fog Cloud'] }, { conditions: ['Restrained'] }, {}, o(14, 3));
    place(r, 'A', o(0, 3));
    expect(attackMode(ok(execute(r.state, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, mid)).events)).toBe('advantage');
    r.cast({ spellName: 'Fog Cloud', targetHex: o(7, 3) });
    r.round();
    expect(attackMode(r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: bow }))).toBe('normal');
    r.replays();
  });
  it('Wind Wall: menzilli silah saldırısı otomatik ıskalar (olayda neden); yapay zekâ boşa atmaz; yay biçimli duvar', () => {
    const r = arena({ spellNames: ['Wind Wall'] }, {}, {}, o(9, 3));
    r.cast({ spellName: 'Wind Wall', targetHex: o(6, 3) });
    r.round();
    const shot = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, () => 0.99).find((e) => e.type === 'attack_resolved');
    expect(shot).toMatchObject({ hit: false, autoMiss: 'Wind Wall', appliedDamage: 0 });
    r.replays();
    const arc = arena({ spellNames: ['Wind Wall'] }, {}, {}, o(12, 3));
    arc.cast({ spellName: 'Wind Wall', targetHex: o(6, 3), wallShape: 'arc' });
    const z = arc.state.map?.zones?.[0];
    expect(z?.hexes.length).toBeGreaterThanOrEqual(5);
    expect(z?.hexes.every((h) => distance(h, o(3, 3)) === 3)).toBe(true);
    arc.replays();
  });
});

describe('CILA 5: Acid Arrow, Silence, Blindness/Deafness', () => {
  it('Acid Arrow 3. slotla: ilk hasar 5d4, gecikmeli 3d4', () => {
    const r = arena({ spellNames: ['Acid Arrow'] }, {}, {}, o(6, 3));
    r.cast({ spellName: 'Acid Arrow', targetId: 'B', slotLevel: 3 }, () => 0.9);
    expect(r.fx('B', 'spells:acid-arrow')?.delayed).toEqual({ dice: '3d4', type: 'acid' });
    r.replays();
  });
  it('Silence içindeki yaratık Thunder hasarına bağışık (Shatter)', () => {
    const r = arena({ spellNames: ['Silence', 'Shatter'] }, {}, {}, o(10, 3));
    r.cast({ spellName: 'Silence', targetHex: o(10, 3) });
    r.round();
    const evs = r.cast({ spellName: 'Shatter', targetHex: o(10, 3) });
    expect(evs.find((e) => e.type === 'save_resolved' && e.targetId === 'B')).toMatchObject({ appliedDamage: 0, damageType: 'thunder' });
  });
  it('Blindness/Deafness: Deafened seçilir; sağır hedefe Command işlemez', () => {
    const r = arena({ spellNames: ['Blindness/Deafness', 'Command'] });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Blindness/Deafness', targetId: 'B', choice: 'Deafened' });
    expect(r.c('B').conditions).toContain('Deafened');
    expect(r.c('B').conditions).not.toContain('Blinded');
    r.round();
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Command', targetId: 'B', choice: 'halt' })).toMatch(/Deafened/);
    r.replays();
  });
});

describe('CILA 6–7: çağrıyı bonus eylemle taşıma, yapay zekânın zemin büyüleri', () => {
  it('Flaming Sphere: kürenin kendi turu yok; sahibi bonus eylemle 30 ft taşır ve bitişik düşmana çarptırır', () => {
    const r = arena({ spellNames: ['Flaming Sphere'] }, {}, {}, o(8, 3));
    r.cast({ spellName: 'Flaming Sphere', targetHex: o(4, 3) });
    const sphere = Object.values(r.state.combatants).find((c) => c.summon?.spell === 'Flaming Sphere') as Combatant;
    expect(sphere.summon?.ownerBonus).toEqual({ moveFt: 30, ram: true });
    r.end();
    expect(r.state.order[r.state.turnIndex]).toBe('B');
    r.to('A');
    expect(r.try({ type: 'summon_move', actorId: 'A', to: o(12, 3) })).toMatch(/gidemez/);
    const evs = r.do({ type: 'summon_move', actorId: 'A', to: o(7, 3), ramId: 'B' });
    expect(r.c(sphere.id).pos).toEqual(o(7, 3));
    expect(evs.find((e) => e.type === 'save_resolved' && e.targetId === 'B')).toMatchObject({ ability: 'dex', damageType: 'fire' });
    expect(r.c('A').economy.bonus).toBe(true);
    expect(r.try({ type: 'summon_move', actorId: 'A', to: o(6, 3) })).not.toBeNull();
    r.replays();
  });
  it('yapay zekâ: iki düşman alanda ve dost yokken Entangle yapar; tek düşmanda yapmaz', async () => {
    const { chooseCommand } = await import('./ai');
    const r = arena({ spellNames: ['Entangle'], weaponOptions: [] }, {}, { pos: o(0, 0) }, o(8, 3));
    place(r, 'C', o(0, 6));
    expect(chooseCommand(r.state).type).not.toBe('cast_spell');
    const d = { ...r.c('B'), id: 'D', name: 'D', pos: o(8, 4) };
    r.state = { ...r.state, order: [...r.state.order, 'D'], combatants: { ...r.state.combatants, D: d } };
    const cmd = chooseCommand(r.state);
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Entangle' });
  });
});
