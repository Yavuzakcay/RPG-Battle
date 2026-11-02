/**
 * Kuyruk 17 G1: "Yakında" olan 4.–5. seviye büyülerden motorun küçük kancayla çözdükleri: Banishment (savaştan geçici
 * çıkış), Resilient Sphere (kapalı küre), Wall of Force ve Wall of Stone (geçilmez duvar). Replay aynı.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, P2, mk } from './fixtures';
import { moveCostFn } from './movement';
import { spells } from '../data';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const mid: Rng = () => 0.5;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const err = (r: ReturnType<typeof execute>) => (r.ok ? null : r.error);
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const SLOTS = [4, 3, 3, 3, 2, 0, 0, 0, 0];
const sword: AttackOption = { label: 'Longsword', attackBonus: 9, damage: '1d8+2', damageType: 'slashing', ranged: false, spell: false,
  tag: 'longsword', weaponId: 'longsword', weaponDamage: '1d8', abilityMod: 2 };
const bow: AttackOption = { label: 'Longbow', attackBonus: 9, damage: '1d8+3', damageType: 'piercing', ranged: true, range: [150, 600], spell: false,
  tag: 'longbow', weaponId: 'longbow', weaponDamage: '1d8', abilityMod: 3 };

function arena(names: string[], bPos = o(9, 3)) {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 7, spellSaveDc: 15, spellMod: 4, proficiency: 3, spellSlots: SLOTS, spellNames: names, weaponOptions: [sword, bow] }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, attacks: [claw] }),
    mk('C', { ownerId: 'p2', hp: 20, maxHp: 20, weaponOptions: [sword, bow] }),
  ];
  const started = startBattle('k17', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } });
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
  do(cmd: Command, ctx: CommandContext = P1, rng: Rng = mid) { const r = ok(execute(this.state, cmd, ctx, rng)); this.state = r.state; this.events.push(...r.events); return r.events; }
  try(cmd: Command, ctx: CommandContext = P1, rng: Rng = mid) { return err(execute(this.state, cmd, ctx, rng)); }
  cast(cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>, rng: Rng = mid) { return this.do({ type: 'cast_spell', actorId: 'A', ...cmd }, P1, rng); }
  ctx(id: string): CommandContext { const c = this.c(id); return c.side === 'enemies' ? GM : c.ownerId === 'p2' ? P2 : P1; }
  end() { const id = this.state.order[this.state.turnIndex] as string; return this.do({ type: 'end_turn', actorId: id }, this.ctx(id)); }
  to(id: string) { while (this.state.order[this.state.turnIndex] !== id) this.end(); }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
const spell = (name: string) => spells.find((s) => s.name === name);

describe('K17 G1: veri', () => {
  // Kuyruk 18 H2: kalan sekiz büyü de uygulandı; "Yakında" listesi boş.
  it('dört büyü artık "Yakında" değil; kalan sekizi de Kuyruk 18 H2\'de uygulandı', () => {
    for (const n of ['Banishment', 'Resilient Sphere', 'Wall of Force', 'Wall of Stone']) expect(spell(n)?.mechanics.unsupported, n).toBeUndefined();
    const left = spells.filter((s) => (s.level === 4 || s.level === 5) && s.mechanics.unsupported).map((s) => s.name).sort();
    expect(left).toEqual([]);
  });
});

describe('K17 G1: Banishment', () => {
  it('CHA save başarısız: hedef alınamaz, eylem yok, kendi turunda dönmez; konsantrasyona bağlı', () => {
    const r = arena(['Banishment'], o(4, 3));
    r.cast({ spellName: 'Banishment', targetId: 'B' });
    expect(r.c('B').effects?.some((e) => e.banished && e.ethereal)).toBe(true);
    expect(r.try({ type: 'attack', actorId: 'C', targetId: 'B', option: sword }, P2)).toBeTruthy();
    r.to('B');
    expect(r.try({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM)).toBeTruthy();
    r.end();
    expect(r.c('B').effects?.some((e) => e.banished)).toBe(true);
    // Konsantrasyon bağı: etki büyücünün konsantrasyonuna bağlı (bitince reducer kaldırır).
    expect(r.c('A').concentration?.spell).toBe('Banishment');
    r.replays();
  });
});

describe('K17 G1: Resilient Sphere', () => {
  it('küredeki yaratık hasar almaz, hareket edemez, saldıramaz; dosta save\'siz', () => {
    const r = arena(['Resilient Sphere'], o(4, 3));
    r.cast({ spellName: 'Resilient Sphere', targetId: 'B' });
    expect(r.c('B').effects?.some((e) => e.sealed)).toBe(true);
    r.to('C');
    r.do({ type: 'attack', actorId: 'C', targetId: 'B', option: bow }, P2, () => 0.99);
    expect(r.c('B').hp).toBe(60);
    r.to('B');
    expect(r.try({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM)).toBeTruthy();
    expect(r.c('B').effects?.find((e) => e.sealed)?.speedZero).toBe(true);
    r.replays();
  });
});

describe('K17 G1: Wall of Force / Wall of Stone', () => {
  it.each(['Wall of Force', 'Wall of Stone'])('%s: duvar altıgenine girilmez, ardındaki hedefe saldırı ve büyü geçmez', (name) => {
    const r = arena([name]);
    r.cast({ spellName: name, targetHex: o(6, 3) });
    expect(r.state.map?.zones?.[0]?.name).toBe(name);
    expect(moveCostFn(r.state, r.c('C'))(o(6, 3), o(5, 3))).toBeNull();
    r.to('C');
    expect(r.try({ type: 'attack', actorId: 'C', targetId: 'B', option: bow }, P2, () => 0.99)).toMatch(new RegExp(name));
    r.replays();
  });
});

describe('K17 G1: yapay zekâ', () => {
  it.each(['Banishment', 'Resilient Sphere', 'Wall of Force', 'Wall of Stone'])('%s bilen büyücünün yapay zekâ turu çökmez ve geçerli komut üretir', async (name) => {
    const { chooseCommand } = await import('./ai');
    const r = arena([name], o(5, 3));
    const cmd = chooseCommand(r.state);
    expect(cmd).toBeTruthy();
    const res = execute(r.state, cmd as Command, P1, mid);
    expect(res.ok).toBe(true);
  });
});

describe('K17 G1: yapay zekâ Banishment', () => {
  it('iki düşman varken en güçlüsünü sürgün eder; tek düşmana yapmaz', async () => {
    const { chooseCommand } = await import('./ai');
    const r = arena(['Banishment'], o(9, 3));
    const two = { ...r.state, combatants: { ...r.state.combatants, D: { ...(r.state.combatants.B as Combatant), id: 'D', name: 'D', hp: 40, pos: o(10, 4) } } };
    expect(chooseCommand(two)).toMatchObject({ type: 'cast_spell', spellName: 'Banishment', targetId: 'B' });
    expect(chooseCommand(r.state)).not.toMatchObject({ spellName: 'Banishment' });
  });
});
