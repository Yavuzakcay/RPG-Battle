/**
 * Görev CLERIC: Sanctuary (saldırı/büyü hedef seçiminden önce WIS save; başarısızsa boşa gider), Warding Bond (hasarın
 * büyücüye bölüşülmesi; her hasar yolunda), Bestow Curse'ün diğer üç seçeneği. Senaryo testleri, replay dahil.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk, sword } from './fixtures';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const claw = { name: 'Claw', bonus: 30, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const HIGH = { str: 20, dex: 20, con: 20, int: 20, wis: 20, cha: 20 };

class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, ctx: CommandContext = P1, rng: Rng = () => 0.5) {
    const r = execute(this.state, cmd, ctx, rng);
    if (!r.ok) throw new Error(r.error);
    this.state = r.state; this.events.push(...r.events);
    return r.events;
  }
  to(id: string) { while (this.state.order[this.state.turnIndex] !== id) { const cur = this.state.order[this.state.turnIndex] as string; this.do({ type: 'end_turn', actorId: cur }, this.state.combatants[cur]?.side === 'enemies' ? GM : P1); } }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}

/** A büyücü (3,3), C dost (2,3), B düşman (4,3; C'ye bitişik değil ama A'ya bitişik). */
function arena(spellNames: string[], b: Partial<Combatant> = {}) {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellNames, spellSlots: [4, 3, 3, 3, 0, 0, 0, 0, 0], spellSaveDc: 15, spellAttack: 7, spellMod: 3, weaponOptions: [sword] }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, attacks: [claw], ...b }),
    mk('C', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [sword] }),
  ];
  const s = startBattle('cs', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos: Record<string, Offset> = { A: o(3, 3), B: o(4, 3), C: o(3, 4) };
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return new Run({ ...s, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } });
}

describe('Sanctuary', () => {
  it('düşman saldırısından önce WIS save; başarısızsa saldırı boşa gider (hasar yok); başarılıysa saldırır', () => {
    const r = arena(['Sanctuary'], { saves: LOW });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Sanctuary', targetIds: ['A'] });
    expect(r.c('A').effects?.[0]).toMatchObject({ sanctuary: { dc: 15 } });
    r.to('B');
    const evs = r.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, () => 0.5);
    expect(evs.find((e) => e.type === 'sanctuary_save')).toMatchObject({ success: false, dc: 15 });
    expect(evs.some((e) => e.type === 'attack_resolved')).toBe(false);
    expect(r.c('A').hp).toBe(30);
    expect(r.c('B').economy.action).toBe(true);
    r.replays();
    const ok = arena(['Sanctuary'], { saves: HIGH });
    ok.do({ type: 'cast_spell', actorId: 'A', spellName: 'Sanctuary', targetIds: ['A'] });
    ok.to('B');
    const hit = ok.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, () => 0.5);
    expect(hit.find((e) => e.type === 'sanctuary_save')).toMatchObject({ success: true });
    expect(hit.some((e) => e.type === 'attack_resolved')).toBe(true);
  });
  it('korunan saldırınca biter; büyü hedeflemesinde de çalışır', () => {
    const r = arena(['Sanctuary', 'Fire Bolt']);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Sanctuary', targetIds: ['A'] });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' });
    expect(r.c('A').effects?.some((e) => e.sanctuary) ?? false).toBe(false);
  });
});

describe('Warding Bond', () => {
  it('hedefe +1 AC/save ve direnç; hedef hasar alınca büyücü aynı miktarda; replay aynı', () => {
    const r = arena(['Warding Bond']);
    const acBefore = r.c('C').ac;
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Warding Bond', targetIds: ['C'] });
    const fx = r.c('C').effects?.[0];
    expect(fx).toMatchObject({ bondTo: 'A', ac: 1 });
    expect(fx?.resist).toContain('slashing');
    expect(acBefore).toBeGreaterThan(0);
    r.to('B');
    // B, C'ye yürüyüp vurur (bitişik altıgen 3,4'ün yanı 4,4).
    r.do({ type: 'move', actorId: 'B', to: o(4, 4) }, GM);
    const evs = r.do({ type: 'monster_attack', actorId: 'B', targetId: 'C', attackIndex: 0 }, GM, () => 0.5);
    const hit = evs.find((e) => e.type === 'attack_resolved') as { appliedDamage: number };
    const bond = evs.find((e) => e.type === 'bond_damage') as { targetId: string; amount: number };
    expect(hit.appliedDamage).toBeGreaterThan(0);
    expect(bond).toMatchObject({ targetId: 'A', amount: hit.appliedDamage });
    expect(r.c('A').hp).toBe(30 - hit.appliedDamage);
    r.replays();
  });
});

describe('Bestow Curse seçenekleri', () => {
  const curse = (choice: string) => {
    const r = arena(['Bestow Curse'], { saves: LOW });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Bestow Curse', targetIds: ['B'], choice });
    return r;
  };
  it('attack: lanetliyenin üstüne saldırı dezavantajlı', () => {
    const r = curse('attack');
    expect(r.c('B').effects?.[0]).toMatchObject({ attackDisVs: 'A' });
    r.to('B');
    const evs = r.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM);
    expect(evs.find((e) => e.type === 'attack_resolved')).toMatchObject({ mode: 'disadvantage' });
  });
  it('turn: tur başı WIS save, başarısızsa eylem yok', () => {
    const r = curse('turn');
    r.to('B');
    const save = r.events.find((e) => e.type === 'curse_save');
    expect(save).toMatchObject({ success: false });
    expect(r.c('B').economy.action).toBe(true);
    r.replays();
  });
  it('damage: lanetleyenin silah isabetine +1d8 Necrotic; ability seçimi eskisi gibi', () => {
    const r = curse('damage');
    r.to('C'); r.to('A');
    const evs = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, () => 0.9);
    const a = evs.find((e) => e.type === 'attack_resolved') as { hit: boolean; extra?: Array<{ type: string }> };
    expect(a.hit).toBe(true);
    expect(a.extra?.map((x) => x.type)).toContain('necrotic');
    const w = curse('wis');
    expect(w.c('B').effects?.[0]).toMatchObject({ name: 'Bestow Curse', saveDis: ['wis'] });
  });
});
