/**
 * Görev OYUNCU-HEDEF-DOST: oyuncu/Game Master komutunda onaylı karşı taraf hedefi (`crossSide`). SRD 5.2.1 hedefi tarafla
 * sınırlamayan yetenek/büyü/eşya dosta (ya da yardım düşmana) yapılabilir; bayraksız komut eskisi gibi (yapay zekâ bayrak vermez).
 * Rıza isteyen ("willing creature") büyüler (`data/dost-hedef.json`) değişmez. Replay her senaryoda aynı.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster } from './create';
import { chooseCommand } from './ai';
import { replay } from './reduce';
import { getMonster } from '../data';
import { GM, mk, P1 } from './fixtures';
import { startBattle } from './create';
import type { DiceRequest, Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const at = (col: number, row: number) => ({ col, row });
const flat = (): string[] => Array.from({ length: 11 }, () => '.'.repeat(21));
function scene104(v: number, parts: Combatant[]): BattleState {
  const s0 = startBattle('ohd', 'd', parts.map((p) => ({ ...p, pos: null })), () => 0.5, { kuralSurumu: v, map: { id: 'kale-onu', variantId: 'gunduz' } } as never).state;
  const cs: Record<string, Combatant> = {};
  for (const p of parts) cs[p.id] = { ...(s0.combatants[p.id] as Combatant), pos: p.pos, initiative: 0 };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: parts.map((p) => p.id), turnIndex: 0, combatants: cs, map: { ...s0.map!, tiles: flat(), objects: [], zones: [] } };
}
/** Kancalı zar: d20 hep `d20`; diğer zarlar ⌊yüz/2⌋ + 1. */
function hooked(d20: number): Rng {
  const f = (() => 0.5) as Rng & { dice?: (r: DiceRequest) => number[] };
  f.dice = (req) => (req.sides === 20 ? Array.from({ length: req.count }, () => d20) : Array.from({ length: req.count }, () => Math.floor(req.sides / 2) + 1));
  return f;
}
const beast = (id: string, cid: string, pos: { col: number; row: number }): Combatant =>
  ({ ...combatantFromMonster(getMonster(id), { id: cid }), side: 'party', ownerId: 'p1', pos });
const ally = (p: Partial<Combatant> = {}) => mk('H', { ownerId: 'p2', hp: 60, maxHp: 60, ac: 5, saves: { str: -10, dex: -10, con: 0, int: 0, wis: 0, cha: 0 }, pos: at(4, 5), ...p });
const foe = () => mk('E', { side: 'enemies', hp: 60, maxHp: 60, pos: at(12, 2) });
function run(s0: BattleState, cmds: Command[], rng: Rng = hooked(15)) {
  let s = s0;
  const events: BattleEvent[] = [];
  for (const cmd of cmds) {
    const id = (cmd as { actorId?: string }).actorId ?? '';
    const r = execute(s, cmd, s.combatants[id]?.side === 'enemies' ? GM : P1, rng);
    if (!r.ok) throw new Error(`${cmd.type}: ${r.error}`);
    s = r.state;
    events.push(...r.events);
  }
  expect(replay([{ type: 'battle_started', state: s0 }, ...events] as BattleEvent[])).toEqual(s);
  return { state: s, events };
}
const tryCmd = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, hooked(15)); return r.ok ? '' : r.error; };
const bite = (s: BattleState, id: string, target = 'H'): Command =>
  ({ type: 'monster_attack', actorId: id, targetId: target, attackIndex: (s.combatants[id] as Combatant).attacks.findIndex((a) => a.name === 'Bite') }) as Command;

describe('OYUNCU-HEDEF-DOST: kurbağa yutması dosta (SRD Swallow "a creature grappled by it")', () => {
  for (const [kind, acid] of [['giant-toad', true], ['giant-frog', false]] as const) {
    it(`${kind}: ısırık dostu yakalar; yutma bayraksız reddedilir, onaylı (crossSide) çalışır`, () => {
      const s0 = scene104(104, [beast(kind, 'T', at(3, 5)), ally({ size: 'S' } as Partial<Combatant>), foe()]);
      const grabbed = run(s0, [bite(s0, 'T')]).state;
      expect(grabbed.combatants.H!.conditions).toContain('Grappled');
      const fresh = { ...grabbed, combatants: { ...grabbed.combatants, T: { ...(grabbed.combatants.T as Combatant), economy: { ...grabbed.combatants.T!.economy, action: false, attacksLeft: 0 } } } };
      const swallow: Command = { type: 'monster_ability', actorId: 'T', abilityId: 'swallow', targetId: 'H' } as Command;
      expect(tryCmd(fresh, swallow)).toMatch(/kullanılamaz/);
      const r = run(fresh, [{ ...swallow, crossSide: true } as Command]);
      const H = r.state.combatants.H as Combatant;
      expect(H.effects?.some((e) => e.swallowedBy === 'T')).toBe(true);
      expect(H.conditions).toEqual(expect.arrayContaining(['Blinded', 'Restrained']));
      // Asit hasarı: kara kurbağa her tur sonunda (3d6); dev kurbağa yalnız sonraki tur sonunda (2d4) ve kusar (SRD; Görev D1).
      const hp0 = H.hp;
      const ended = run(r.state, [{ type: 'end_turn', actorId: 'T' } as Command]).state;
      expect(hp0 - (ended.combatants.H as Combatant).hp > 0).toBe(acid);
    });
  }
  it('yapay zekâ kurbağası yakaladığı dostu yutmaz (hedef seçimi düşmanlarla sınırlı)', () => {
    const s0 = scene104(104, [beast('giant-toad', 'T', at(3, 5)), ally(), foe()]);
    const grabbed = run(s0, [bite(s0, 'T')]).state;
    const turn = { ...grabbed, combatants: { ...grabbed.combatants, T: { ...(grabbed.combatants.T as Combatant), economy: { ...grabbed.combatants.T!.economy, action: false, attacksLeft: 0 } } } };
    const cmd = chooseCommand(turn);
    expect((cmd as { crossSide?: true }).crossSide).toBeUndefined();
    const r = execute(turn, cmd, P1, hooked(15));
    expect(r.ok && r.state.combatants.H!.effects?.some((e) => e.swallowedBy)).toBeFalsy();
  });
});

describe('OYUNCU-HEDEF-DOST: diğer yetenekler, eylemler ve büyüler', () => {
  it('Wolf Bite (ek etki: Prone) dosta: SRD saldırısı zaten serbest; isabet zarı dostun AC’sine', () => {
    const s0 = scene104(104, [beast('wolf', 'W', at(3, 5)), ally(), foe()]);
    const r = run(s0, [bite(s0, 'W')]);
    expect(r.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ targetId: 'H', hit: true, targetAc: 5 });
    expect(r.state.combatants.H!.conditions).toContain('Prone');
  });
  it('Elephant Trample (save yeteneği) yerdeki dosta: bayraksız düşman yok, onaylı çalışır', () => {
    const s0 = scene104(104, [beast('elephant', 'L', at(3, 5)), ally({ conditions: ['Prone'] }), foe()]);
    const trample: Command = { type: 'monster_ability', actorId: 'L', abilityId: 'trample', targetId: 'H' } as Command;
    expect(tryCmd(s0, trample)).toMatch(/kullanılamaz/);
    const r = run(s0, [{ ...trample, crossSide: true } as Command]);
    expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'H')).toBe(true);
  });
  it('alan saldırısı (Red Dragon Wyrmling Fire Breath) dosta değer: alan dost ateşi aynen', () => {
    const s0 = scene104(104, [beast('red-dragon-wyrmling', 'D', at(3, 5)), ally(), foe()]);
    const i = (s0.combatants.D as Combatant).attacks.findIndex((a) => !!a.area);
    const r = run(s0, [{ type: 'monster_attack', actorId: 'D', targetId: '', attackIndex: i, targetHex: at(5, 5) } as Command]);
    expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'H')).toBe(true);
  });
  it('Monk bonus vuruşu, fırlatılan eşya, Bane dosta; Bless/iksir düşmana: bayraksız red, onaylı kabul', () => {
    const monk = mk('A', { ownerId: 'p1', pos: at(3, 5), bonusStrike: { label: 'Unarmed Strike', attackBonus: 5, damage: '1d6+3', damageType: 'bludgeoning', ranged: false, spell: false, tag: '' },
      traits: ['martial-arts'],
      consumables: { 'alchemists-fire': 1, 'potion-of-healing': 1 }, spellNames: ['Bane', 'Bless'], spellSlots: [4, 0, 0, 0, 0, 0, 0, 0, 0], spellSaveDc: 13 } as Partial<Combatant>);
    const near = mk('E', { side: 'enemies', hp: 60, maxHp: 60, pos: at(3, 6) });
    const s0 = scene104(104, [monk, ally(), near]);
    for (const cmd of [
      { type: 'use_item', actorId: 'A', itemId: 'alchemists-fire', targetId: 'H' },
      { type: 'use_item', actorId: 'A', itemId: 'potion-of-healing', targetId: 'E' },
      { type: 'cast_spell', actorId: 'A', spellName: 'Bane', targetIds: ['H'] },
      { type: 'cast_spell', actorId: 'A', spellName: 'Bless', targetIds: ['E'] },
    ] as Command[]) {
      expect(tryCmd(s0, cmd)).not.toBe('');
      expect(tryCmd(s0, { ...cmd, crossSide: true } as Command)).toBe('');
    }
  });
  it('rıza isteyen büyü (Haste "willing creature") düşmana onayla da yapılamaz; Help SRD gereği yalnız düşmana', () => {
    const c = mk('A', { ownerId: 'p1', pos: at(3, 5), spellNames: ['Haste'], spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0], spellSaveDc: 13 });
    const s0 = scene104(104, [c, ally(), mk('E', { side: 'enemies', hp: 60, maxHp: 60, pos: at(3, 6) })]);
    expect(tryCmd(s0, { type: 'cast_spell', actorId: 'A', spellName: 'Haste', targetIds: ['E'], crossSide: true } as Command)).toMatch(/dostlara/);
    expect(tryCmd(s0, { type: 'help', actorId: 'A', targetId: 'H' } as Command)).not.toBe('');
  });
});

describe('OYUNCU-HEDEF-DOST: arayüz hedef seçenekleri (attackChoices)', () => {
  it('dosta silah saldırısı onay işaretli; düşmana Bless `crossSide` ile; "willing" Haste düşman listesinde yok', async () => {
    const { attackChoices } = await import('../ui/mapView');
    const c = mk('A', { ownerId: 'p1', pos: at(3, 5), spellNames: ['Bless', 'Haste', 'Fire Bolt'], spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0], spellSaveDc: 13, spellAttack: 5,
      weaponOptions: [{ label: 'Longsword', attackBonus: 5, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: '' }] });
    const s0 = scene104(104, [c, ally(), mk('E', { side: 'enemies', hp: 60, maxHp: 60, pos: at(3, 6) })]);
    const onAlly = attackChoices(s0, 'A', 'H');
    expect(onAlly.find((x) => x.label === 'Longsword')).toMatchObject({ cross: 'ally' });
    expect(onAlly.find((x) => x.label === 'Fire Bolt')).toMatchObject({ cross: 'ally', command: { crossSide: true } });
    const onFoe = attackChoices(s0, 'A', 'E');
    expect(onFoe.find((x) => x.label === 'Longsword')?.cross).toBeUndefined();
    // Çoklu hedef kipinde (effectTargets): Bless düşmana da (onaylı), "willing" Haste düşmana hiç.
    const { effectTargets } = await import('../ui/hud');
    const { spells } = await import('../data');
    expect(effectTargets(s0, 'A', spells.find((x) => x.name === 'Bless')!)).toEqual(expect.arrayContaining(['A', 'H', 'E']));
    expect(effectTargets(s0, 'A', spells.find((x) => x.name === 'Haste')!)).not.toContain('E');
  });
});
