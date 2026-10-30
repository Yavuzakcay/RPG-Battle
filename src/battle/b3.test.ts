/**
 * Görev B3 (SRD 5.2.1): zihin kontrolü ve yanılsama. Charm Person, Animal Friendship, Command (Approach, Drop, Flee),
 * Hideous Laughter, Protection from Evil and Good, Fear, Hypnotic Pattern, Calm Emotions, Suggestion, Mirror Image,
 * Phantasmal Force. Konsantrasyon, süre, hasarla bitme, zorlama hareketi ve replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { GM, P1, P2, mk } from './fixtures';
import { wardedFrom } from './mind';
import { spells } from '../data';
import srdSpells from '../../data/srd/spells.json';
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

/** Düz harita; sıra A (büyücü, 3,3), B (düşman), C (dost, 2,3). */
function arena(a: Partial<Combatant> = {}, b: Partial<Combatant> = {}, c: Partial<Combatant> = {}, bPos = o(4, 3)) {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, spellMod: 3, proficiency: 3, spellSlots: SLOTS, weaponOptions: [sword, bow], ...a }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, attacks: [claw], saves: LOW, ...b }),
    mk('C', { ownerId: 'p2', hp: 20, maxHp: 20, weaponOptions: [sword], ...c }),
  ];
  const started = startBattle('b3', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } });
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
const spell = (name: string) => spells.find((x) => x.name === name);

describe('veri: B3 büyüleri', () => {
  it('yeni büyüler SRD kimliğiyle; değişenlerin yukarı slotu ve save alanları yerinde', () => {
    const ids = new Set((srdSpells.spells as Array<{ id: string }>).map((x) => `spells:${x.id}`));
    for (const n of ['Animal Friendship', 'Calm Emotions', 'Phantasmal Force', 'Suggestion', 'Mirror Image', 'Charm Person', 'Hideous Laughter']) expect(ids.has(spell(n)?.srd ?? '')).toBe(true);
    expect(spell('Charm Person')?.mechanics).toMatchObject({ save: 'wis', conditions: ['Charmed'], upcast: { targets: 1 } });
    expect(spell('Hideous Laughter')?.mechanics).toMatchObject({ save: 'wis', conditions: ['Prone', 'Incapacitated'], upcast: { targets: 1 } });
    expect(spell('Command')?.mechanics.effect?.choices).toEqual(['approach', 'drop', 'flee', 'grovel', 'halt']);
  });
});

describe('büyüleme (Charmed)', () => {
  it('Charm Person: Humanoid WIS save (savaşta avantajlı) ya da Charmed; büyüleyene saldıramaz; hasar alınca biter', () => {
    const r = arena({ spellNames: ['Charm Person'] });
    const evs = r.cast({ spellName: 'Charm Person', targetId: 'B' });
    expect(evs.find((e) => e.type === 'save_resolved')).toMatchObject({ mode: 'advantage', success: false });
    expect(r.c('B').conditions).toContain('Charmed');
    r.end();
    expect(r.try({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM)).toMatch(/büyülenmiş/);
    r.to('C');
    r.do({ type: 'move', actorId: 'C', to: o(4, 4) }, P2);
    r.do({ type: 'attack', actorId: 'C', targetId: 'B', option: sword }, P2, high);
    expect(r.c('B').conditions).not.toContain('Charmed');
    expect(r.fx('B', 'spells:charm-person')).toBeUndefined();
    r.replays();
  });
  it('Görev K2c: Charm Person yalnızca büyücü ya da dostları hasar verince biter; düşmanın verdiği hasar bitirmez', () => {
    // Düşman tarafında ikinci bir yaratık (D), büyülenen B'nin yanında; Game Master onunla B'ye saldırır.
    const enemyHit = arena({ spellNames: ['Charm Person'] });
    enemyHit.cast({ spellName: 'Charm Person', targetId: 'B' });
    const d = { ...mk('D', { side: 'enemies', hp: 30, maxHp: 30, attacks: [{ ...claw, bonus: 30 }] }), pos: o(5, 3) };
    enemyHit.state = { ...enemyHit.state, combatants: { ...enemyHit.state.combatants, D: d }, order: [...enemyHit.state.order, 'D'] };
    enemyHit.events = [{ type: 'battle_started', state: enemyHit.state }];
    enemyHit.to('D');
    const hp = enemyHit.c('B').hp;
    enemyHit.do({ type: 'monster_attack', actorId: 'D', targetId: 'B', attackIndex: 0 }, GM, high);
    expect(enemyHit.c('B').hp).toBeLessThan(hp);
    expect(enemyHit.fx('B', 'spells:charm-person')).toBeDefined();
    expect(enemyHit.c('B').conditions).toContain('Charmed');
    enemyHit.replays();
    // Büyücünün kendisi vurunca biter (dostu C'nin vuruşu yukarıdaki testte).
    const own = arena({ spellNames: ['Charm Person'] });
    own.cast({ spellName: 'Charm Person', targetId: 'B' });
    own.round();
    own.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, high);
    expect(own.fx('B', 'spells:charm-person')).toBeUndefined();
    own.replays();
  });
  it('Animal Friendship yalnızca Beast; Charm Person Humanoid olmayana yapılmaz', () => {
    const r = arena({ spellNames: ['Animal Friendship', 'Charm Person'] }, { creatureType: 'fiend' });
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Animal Friendship', targetId: 'B' })).toMatch(/beast/);
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Charm Person', targetId: 'B' })).toMatch(/humanoid/);
    const w = arena({ spellNames: ['Animal Friendship'] }, { creatureType: 'beast' });
    w.cast({ spellName: 'Animal Friendship', targetId: 'B' });
    expect(w.fx('B', 'spells:animal-friendship')).toMatchObject({ charm: true, breakOnDamage: 'casterSide' });
  });
  it('Protection from Evil and Good: korunan, Fiend kaynaklı Charmed/Frightened almaz; başka türden alır', () => {
    const r = arena({ spellNames: ['Protection from Evil and Good'] }, { creatureType: 'fiend' });
    r.cast({ spellName: 'Protection from Evil and Good', targetId: 'C' });
    expect(wardedFrom(r.state, 'C', 'B', 'Charmed')).toBe(true);
    const charm: BattleEvent = { type: 'effect_added', targetId: 'C', effect: { id: 'x', name: 'Fiend charm', sourceId: 'B', grants: ['Charmed'], charm: true } };
    expect(applyEvents(r.state, [charm]).combatants.C?.conditions).not.toContain('Charmed');
    const other = { ...r.state, combatants: { ...r.state.combatants, B: { ...r.c('B'), creatureType: 'humanoid' } } };
    expect(applyEvents(other, [charm]).combatants.C?.conditions).toContain('Charmed');
  });
});

describe('zorlama', () => {
  it('Command Flee: sırası gelince büyücüden uzaklaşır ve turu biter; Approach: bitişiğe gelir', () => {
    const r = arena({ spellNames: ['Command'] }, {}, {}, o(6, 3));
    r.cast({ spellName: 'Command', targetId: 'B', choice: 'flee' });
    const start = r.end();
    expect(start.some((e) => e.type === 'moved' && e.actorId === 'B')).toBe(true);
    expect(start.some((e) => e.type === 'turn_lost' && e.actorId === 'B' && e.command === 'flee')).toBe(true);
    expect(distance(r.c('B').pos as Offset, o(3, 3))).toBeGreaterThan(3);
    expect(r.fx('B', 'spells:command')).toBeUndefined();
    r.replays();
    const a = arena({ spellNames: ['Command'] }, {}, {}, o(8, 3));
    a.cast({ spellName: 'Command', targetId: 'B', choice: 'approach' });
    a.end();
    expect(distance(a.c('B').pos as Offset, o(3, 3))).toBeLessThan(5);
    a.replays();
  });
  it('Fear: konide WIS save ya da Frightened; her turunda Dash ile kaçar (süren); konsantrasyon bitince durum kalkar', () => {
    const r = arena({ spellNames: ['Fear', 'Command'] }, {}, {}, o(5, 3));
    r.cast({ spellName: 'Fear', targetHex: o(5, 3) });
    expect(r.c('B').conditions).toContain('Frightened');
    const t1 = r.end();
    expect(t1.some((e) => e.type === 'dashed' && e.actorId === 'B')).toBe(true);
    expect(r.fx('B', 'spells:fear')?.commandPersist).toBe(true);
    r.to('A');
    r.do({ type: 'end_turn', actorId: 'A' }, P1);
    r.to('A');
    r.cast({ spellName: 'Command', targetId: 'B', choice: 'halt' });
    expect(r.c('B').conditions).toContain('Frightened');
    r.replays();
  });
  it('Suggestion (savaşı bırak): her turunu kaybeder; hasarla biter', () => {
    const r = arena({ spellNames: ['Suggestion'] });
    r.cast({ spellName: 'Suggestion', targetId: 'B', choice: 'halt' });
    expect(r.end().some((e) => e.type === 'turn_lost' && e.actorId === 'B')).toBe(true);
    r.round();
    expect(r.fx('B', 'spells:suggestion')).toBeDefined();
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, high);
    expect(r.fx('B', 'spells:suggestion')).toBeUndefined();
    r.replays();
  });
});

describe('durum etkileri', () => {
  it('Hideous Laughter: Prone + Incapacitated; tur sonu save; hasar alınca avantajlı save, başarıda biter', () => {
    const r = arena({ spellNames: ['Hideous Laughter'] }, { saves: { ...LOW, wis: 0 } });
    r.cast({ spellName: 'Hideous Laughter', targetId: 'B' });
    expect(r.c('B').conditions).toEqual(expect.arrayContaining(['Prone', 'Incapacitated']));
    expect(r.fx('B', 'spells:hideous-laughter')).toMatchObject({ repeatSave: { ability: 'wis', dc: 13 }, damageSave: { ability: 'wis', dc: 13, advantage: true } });
    r.round();
    const hit = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, high);
    const res = hit.find((e) => e.type === 'attack_resolved');
    expect(res?.type === 'attack_resolved' && res.effects.some((x) => x.kind === 'effect_save' && x.success)).toBe(true);
    expect(r.c('B').conditions).not.toContain('Incapacitated');
    r.replays();
  });
  it('Hypnotic Pattern: Charmed + Incapacitated + hız 0; hasar alınca biter', () => {
    const r = arena({ spellNames: ['Hypnotic Pattern'] }, {}, {}, o(8, 3));
    r.cast({ spellName: 'Hypnotic Pattern', targetHex: o(8, 3) });
    expect(r.c('B').conditions).toEqual(expect.arrayContaining(['Charmed', 'Incapacitated']));
    expect(r.fx('B', 'spells:hypnotic-pattern')?.speedZero).toBe(true);
    r.round();
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, high);
    expect(r.c('B').conditions).not.toContain('Charmed');
    r.replays();
  });
  it('Calm Emotions: dostun Frightened\'ı kalkar ve bağışık olur; düşman CHA save ya da kayıtsız (turunu kaybeder)', () => {
    const r = arena({ spellNames: ['Calm Emotions'] }, {}, { conditions: ['Frightened'] });
    r.cast({ spellName: 'Calm Emotions', targetHex: o(3, 3) });
    expect(r.c('C').conditions).not.toContain('Frightened');
    expect(r.fx('C', 'spells:calm-emotions')?.immune).toEqual(['Charmed', 'Frightened']);
    expect(r.fx('B', 'spells:calm-emotions')).toMatchObject({ command: 'halt', commandPersist: true, breakOnDamage: true });
    expect(r.end().some((e) => e.type === 'turn_lost' && e.actorId === 'B')).toBe(true);
    r.replays();
  });
});

describe('yanılsama', () => {
  it('Mirror Image: isabette d6 ≥ 3 ise kopya vurulur (kopya azalır); Blinded saldıran etkilenmez', () => {
    const r = arena({ spellNames: ['Mirror Image'] });
    r.cast({ spellName: 'Mirror Image' });
    expect(r.fx('A', 'spells:mirror-image')?.images).toBe(3);
    r.end();
    const ev = r.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, high).find((e) => e.type === 'attack_resolved');
    expect(ev).toMatchObject({ hit: false, reacted: { name: 'Mirror Image' } });
    expect(r.fx('A', 'spells:mirror-image')?.images).toBe(2);
    expect(r.c('A').hp).toBe(30);
    r.replays();
  });
  it('Phantasmal Force: INT save ya da büyücünün her turunun başında 2d8 psychic; konsantrasyonla biter', () => {
    const r = arena({ spellNames: ['Phantasmal Force', 'Command'] });
    r.cast({ spellName: 'Phantasmal Force', targetId: 'B' });
    const next = r.round();
    expect(next.some((e) => e.type === 'effect_tick' && e.targetId === 'B' && e.damageType === 'psychic')).toBe(true);
    expect(r.c('B').hp).toBeLessThan(60);
    r.replays();
  });
});
