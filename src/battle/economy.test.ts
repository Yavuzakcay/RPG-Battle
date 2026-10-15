import { describe, it, expect } from 'vitest';
import { combatantFromMonster, combatantFromSheet, execute, replay } from './index';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import { getMonster } from '../data';
import { speedHexes } from './movement';
import { GM, P1, advanceTo, mk, scripted, setup, sword } from './fixtures';

const errorOf = (r: ReturnType<typeof execute>) => (r.ok ? '' : r.error);
function ok(r: ReturnType<typeof execute>) {
  if (!r.ok) throw new Error(r.error);
  return r;
}
const hit = () => scripted([20, 15], [8, 1]);
const attack = (s: BattleState, actorId = 'A'): ReturnType<typeof execute> =>
  execute(s, { type: 'attack', actorId, targetId: 'B', option: sword }, P1, hit());
/** Sıra A'da; B düşman (60 HP), A'ya verilen alanlarla. */
const turnOfA = (a: Partial<Combatant> = {}) =>
  advanceTo(setup('Düz', { A: a, B: { hp: 60, maxHp: 60 } }), 'A');
const caster = {
  spellNames: ['Fire Bolt', 'Magic Missile', 'Healing Word', 'Shield'], level: 5, spellMod: 4, spellAttack: 7,
  spellSaveDc: 15, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0],
};

describe('eylem (action)', () => {
  it('saldırı eylemi harcar; ikinci saldırı reddedilir; başarısız komut harcamaz', () => {
    const s = turnOfA();
    const out = execute(s, { type: 'attack', actorId: 'A', targetId: 'A', option: sword }, P1, hit());
    expect(out.ok).toBe(false);
    const first = ok(attack(s));
    expect(first.state.combatants.A?.economy.action).toBe(true);
    expect(errorOf(attack(first.state))).toBe('Eylem bu tur kullanıldı.');
  });
  it('Extra Attack: Attack eylemi iki saldırı (Fighter 5), üçüncüsü reddedilir', () => {
    let s = turnOfA({ attacksPerAction: 2 });
    s = ok(attack(s)).state;
    expect(s.combatants.A?.economy.attacksLeft).toBe(1);
    s = ok(attack(s)).state;
    expect(errorOf(attack(s))).toBe('Eylem bu tur kullanıldı.');
  });
  it('arama, gizlenme ve stabilize de eylem; tur sonunda her şey yenilenir', () => {
    let s = turnOfA();
    s = ok(attack(s)).state;
    expect(errorOf(execute(s, { type: 'dash', actorId: 'A' }, P1, scripted()))).toBe('Eylem bu tur kullanıldı.');
    s = advanceTo(ok(execute(s, { type: 'end_turn', actorId: 'A' }, P1, scripted())).state, 'A');
    expect(s.combatants.A?.economy).toMatchObject({ action: false, bonus: false, attacksLeft: 0, dashes: 0 });
    expect(attack(s).ok).toBe(true);
  });
});

describe('koşma ve ayrılma', () => {
  it('Dash bu tur hızı bir kez daha ekler', () => {
    const s = turnOfA();
    const base = speedHexes(s.combatants.A as Combatant);
    const dashed = ok(execute(s, { type: 'dash', actorId: 'A' }, P1, scripted()));
    expect(speedHexes(dashed.state.combatants.A as Combatant)).toBe(2 * base);
    const dis = ok(execute(turnOfA(), { type: 'disengage', actorId: 'A' }, P1, scripted()));
    expect(dis.state.combatants.A?.economy.disengaged).toBe(true);
  });
  it('bonus eylemle yalnızca özelliği olan yapar (Rogue Cunning Action); ardından eylem hâlâ var', () => {
    const plain = turnOfA();
    expect(errorOf(execute(plain, { type: 'dash', actorId: 'A', bonus: true }, P1, scripted()))).toBe('Dash bonus eylemle yapılamaz.');
    const rogue = turnOfA({ bonusActions: ['dash', 'disengage', 'hide'] });
    const r = ok(execute(rogue, { type: 'dash', actorId: 'A', bonus: true }, P1, scripted()));
    expect(r.state.combatants.A?.economy).toMatchObject({ bonus: true, action: false, dashes: 1 });
    expect(errorOf(execute(r.state, { type: 'disengage', actorId: 'A', bonus: true }, P1, scripted()))).toBe('Bonus eylem bu tur kullanıldı.');
    expect(attack(r.state).ok).toBe(true);
  });
});

describe('büyüler', () => {
  it('bonus eylem büyüsü (Healing Word) + eylemle cantrip olur; turda ikinci slotlu büyü olmaz', () => {
    const s = turnOfA(caster);
    const heal = ok(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Healing Word', targetId: 'A' }, P1, scripted([4, 1])));
    expect(heal.state.combatants.A?.economy).toMatchObject({ bonus: true, action: false });
    const mm = execute(heal.state, { type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' }, P1, scripted([4, 1], [4, 1], [4, 1]));
    expect(errorOf(mm)).toBe('Bu tur zaten büyü slotu harcandı (turda bir slotlu büyü).');
    expect(ok(execute(heal.state, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, scripted([20, 15], [10, 1], [10, 1]))).ok).toBe(true);
  });
  it('tepki büyüsü (Shield) başkasının turunda yapılır, turlar arası bir kez; kendi turunda yenilenir', () => {
    const s = advanceTo(setup('Düz', { A: caster }), 'B');
    const shield: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Shield' };
    const r = ok(execute(s, shield, P1, scripted()));
    expect(r.state.combatants.A?.economy.reaction).toBe(true);
    expect(errorOf(execute(r.state, shield, P1, scripted()))).toBe('Tepki bu tur kullanıldı.');
    expect(errorOf(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, scripted()))).toBe('Sıra bu savaşçıda değil.');
    const own = advanceTo(ok(execute(r.state, { type: 'end_turn', actorId: 'B' }, GM, scripted())).state, 'A');
    expect(own.combatants.A?.economy.reaction).toBe(false);
  });
});

describe('canavarlar ve karakterler', () => {
  it('Multiattack tek eylem; sonra tek saldırı reddedilir', () => {
    const troll = combatantFromMonster(getMonster('troll'), { id: 'T' });
    const s = advanceTo(setup('Düz', { B: { ...troll, id: 'B', side: 'enemies' } }), 'B');
    const ctx: CommandContext = GM;
    const r = ok(execute(s, { type: 'multiattack', actorId: 'B', targetId: 'A' }, ctx, scripted([20, 2], [20, 2], [20, 2])));
    expect(errorOf(execute(r.state, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, ctx, scripted()))).toBe('Eylem bu tur kullanıldı.');
  });
  it('Extra Attack ve bonus eylemler veriden: Fighter 5 iki saldırı, Rogue 2 Cunning Action, Goblin Nimble Escape', () => {
    const sheet = {
      name: 'X', raceId: 'human', level: 5, baseScores: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 },
      armorName: 'Zırhsız', shield: false, itemNames: [],
    };
    expect(combatantFromSheet({ ...sheet, classId: 'fighter' }, { id: 'f', ownerId: 'p' }).attacksPerAction).toBe(2);
    expect(combatantFromSheet({ ...sheet, classId: 'wizard' }, { id: 'w', ownerId: 'p' }).attacksPerAction).toBe(1);
    expect(combatantFromSheet({ ...sheet, classId: 'rogue', level: 2 }, { id: 'r', ownerId: 'p' }).bonusActions).toEqual(['dash', 'disengage', 'hide']);
    expect(combatantFromMonster(getMonster('goblin-warrior'), { id: 'g' }).bonusActions).toEqual(['disengage', 'hide']);
    expect(mk('x').economy.action).toBe(false);
  });
  it('olaylar baştan oynatılınca aynı durum çıkar', () => {
    let s = turnOfA({ attacksPerAction: 2, bonusActions: ['dash'] });
    const all: BattleEvent[] = [{ type: 'battle_started', state: s }];
    for (const cmd of [
      { type: 'attack', actorId: 'A', targetId: 'B', option: sword },
      { type: 'dash', actorId: 'A', bonus: true },
      { type: 'attack', actorId: 'A', targetId: 'B', option: sword },
    ] as Command[]) {
      const r = ok(execute(s, cmd, P1, hit()));
      s = r.state;
      all.push(...r.events);
    }
    expect(replay(all)).toEqual(s);
  });
});
