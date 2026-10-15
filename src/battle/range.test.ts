import { describe, it, expect } from 'vitest';
import { combatantFromMonster, execute, startBattle, weaponAttackOptions } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import { getMonster, monsters, spells, weapons } from '../data';
import type { Offset } from '../rules/hex';
import type { CharacterSheet } from '../rules/stats';
import { GM, P1, dice, mk, scripted, setup, sword } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
const OPEN = Array.from({ length: 7 }, () => '.'.repeat(15));

/** Açık zeminde haritalı savaş; savaşçılar verilen altıgenlerde, sıra listedeki ilk savaşçıda. */
function field(parts: Combatant[], positions: Record<string, Offset>): BattleState {
  const { state } = startBattle('r', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), {
    map: { id: 'volkan' },
  });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: OPEN } };
}

const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { side: 'enemies', ac: 5, hp: 50, maxHp: 50, ...p });
const opt = (p: Partial<AttackOption>): AttackOption => ({ ...sword, ...p });
const longbow = opt({ label: 'Longbow', ranged: true, range: [150, 600] });
const handXbow = opt({ label: 'Hand crossbow', ranged: true, range: [30, 120] });
const dagger = opt({ label: 'Dagger (fırlatma)', ranged: true, range: [20, 60] });

function attack(s: BattleState, option: AttackOption, rng = scripted([20, 15], [20, 15], [8, 1])) {
  return execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option }, P1, rng);
}
function firstEvent(r: ReturnType<typeof execute>): BattleEvent {
  if (!r.ok) throw new Error(r.error);
  const ev = r.events[0];
  if (!ev) throw new Error('olay yok');
  return ev;
}
const errorOf = (r: ReturnType<typeof execute>) => (r.ok ? '' : r.error);

describe('yakın dövüş erişimi', () => {
  it('erişim 5 ft = 1 altıgen; uzaktaki hedef reddedilir', () => {
    expect(attack(field([A(), B()], { A: o(3, 3), B: o(4, 3) }), sword).ok).toBe(true);
    const far = attack(field([A(), B()], { A: o(3, 3), B: o(5, 3) }), sword);
    expect(errorOf(far)).toBe('Hedef erişim dışında: 2 altıgen (10 ft), erişim 5 ft.');
  });
  it('uzun erişim (Reach) 10 ft = 2 altıgen', () => {
    const glaive = opt({ label: 'Glaive', reachFt: 10 });
    expect(attack(field([A(), B()], { A: o(3, 3), B: o(5, 3) }), glaive).ok).toBe(true);
    expect(attack(field([A(), B()], { A: o(3, 3), B: o(6, 3) }), glaive).ok).toBe(false);
  });
});

describe('menzilli saldırı', () => {
  it('normal menzilde dezavantaj yok, uzun menzilde dezavantaj, ötesi reddedilir', () => {
    const near = firstEvent(attack(field([A(), B()], { A: o(0, 3), B: o(6, 3) }), handXbow)); // 6 altıgen = 30 ft
    expect(near.type === 'attack_resolved' && near.mode).toBe('normal');
    const long = firstEvent(attack(field([A(), B()], { A: o(0, 3), B: o(7, 3) }), handXbow)); // 35 ft
    expect(long.type === 'attack_resolved' && long.mode).toBe('disadvantage');
    expect(long.type === 'attack_resolved' && long.reasons).toContain('Uzun menzil');
    const beyond = attack(field([A(), B()], { A: o(0, 0), B: o(13, 6) }), dagger); // 13 altıgen = 65 ft > 60
    expect(errorOf(beyond)).toBe('Hedef menzil dışında: 13 altıgen (65 ft), en uzak menzil 60 ft.');
  });
  it('yanında aksiyon yapabilen düşman varken menzilli saldırı dezavantajlı', () => {
    const parts = [A(), B(), mk('C', { side: 'enemies' })];
    const close = firstEvent(attack(field(parts, { A: o(3, 3), B: o(9, 3), C: o(3, 4) }), longbow));
    expect(close.type === 'attack_resolved' && close.reasons).toContain('Yanında düşman (menzilli saldırı)');
    const stunned = [A(), B(), mk('C', { side: 'enemies', conditions: ['Stunned'] })];
    const ok = firstEvent(attack(field(stunned, { A: o(3, 3), B: o(9, 3), C: o(3, 4) }), longbow));
    expect(ok.type === 'attack_resolved' && ok.mode).toBe('normal');
    const ally = [A(), B(), mk('C', { ownerId: 'p2' })];
    const withAlly = firstEvent(attack(field(ally, { A: o(3, 3), B: o(9, 3), C: o(3, 4) }), longbow));
    expect(withAlly.type === 'attack_resolved' && withAlly.mode).toBe('normal');
  });
  it('bitişik hedefe menzilli saldırı da dezavantajlı (hedef de bir düşman)', () => {
    const ev = firstEvent(attack(field([A(), B()], { A: o(3, 3), B: o(4, 3) }), longbow));
    expect(ev.type === 'attack_resolved' && ev.mode).toBe('disadvantage');
  });
  it('haritasız savaşta menzil denetlenmez', () => {
    const s = setup();
    const r = execute(s, { type: 'attack', actorId: 'C', targetId: 'B', option: dagger }, { playerId: 'p2', isGm: false },
      scripted([20, 15], [8, 1]));
    expect(r.ok).toBe(true);
  });
});

describe('silah seçenekleri', () => {
  const sheet = (weaponsList: CharacterSheet['weapons']): CharacterSheet => ({
    name: 'T', raceId: 'human', classId: 'fighter', level: 1,
    baseScores: { str: 14, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
    armorName: 'Zırhsız', shield: false, itemNames: [], weapons: weaponsList,
  });
  it('fırlatılabilir silah iki seçenek verir: yakın dövüş ve fırlatma', () => {
    const [melee, thrown] = weaponAttackOptions(sheet([{ name: 'Dagger' }]), 'Dagger');
    expect(melee).toMatchObject({ label: 'Dagger', ranged: false, reachFt: 5 });
    expect(thrown).toMatchObject({ label: 'Dagger (fırlatma)', ranged: true, range: [20, 60] });
    expect(thrown?.attackBonus).toBe(melee?.attackBonus);
  });
  it('menzilli silah menzilini, uzun erişimli silah 10 ft erişimini taşır', () => {
    expect(weaponAttackOptions(sheet([]), 'Longbow')).toMatchObject([{ ranged: true, range: [150, 600] }]);
    expect(weaponAttackOptions(sheet([]), 'Glaive')).toMatchObject([{ ranged: false, reachFt: 10 }]);
    expect(weaponAttackOptions(sheet([]), 'Longsword')).toMatchObject([{ ranged: false, reachFt: 5 }]);
  });
});

describe('canavar saldırıları', () => {
  const run = (s: BattleState, cmd: Command, ctx: CommandContext = GM) => execute(s, cmd, ctx, scripted([20, 15], ...dice(6, 3, 3)));
  const monsterFirst = (id: string, at: Offset, target: Offset) => {
    const m = combatantFromMonster(getMonster(id), { id: 'M' });
    return field([m, mk('P', { ownerId: 'p1', hp: 200, maxHp: 200 })], { M: at, P: target });
  };
  it('Wolf Bite 5 ft, Troll Rend 10 ft', () => {
    expect(run(monsterFirst('wolf', o(3, 3), o(5, 3)), { type: 'monster_attack', actorId: 'M', targetId: 'P', attackIndex: 0 }).ok).toBe(false);
    expect(run(monsterFirst('troll', o(3, 3), o(5, 3)), { type: 'monster_attack', actorId: 'M', targetId: 'P', attackIndex: 0 }).ok).toBe(true);
  });
  it('Multiattack: saldırılardan biri erişemiyorsa komut bütünüyle reddedilir', () => {
    const r = run(monsterFirst('hill-giant', o(3, 3), o(6, 3)), { type: 'multiattack', actorId: 'M', targetId: 'P' });
    expect(errorOf(r)).toContain('Tree Club: Hedef erişim dışında');
  });
  it('nefes (save) 30 ft koni: 6 altıgen içinde', () => {
    const breath = (target: Offset) =>
      execute(monsterFirst('young-red-dragon', o(0, 3), target), { type: 'monster_attack', actorId: 'M', targetId: 'P', attackIndex: 1 },
        GM, scripted([20, 5], ...dice(6, ...Array<number>(16).fill(1))));
    expect(breath(o(6, 3)).ok).toBe(true);
    expect(errorOf(breath(o(7, 3)))).toContain('menzil 30 ft');
  });
});

describe('büyü menzili', () => {
  const caster = (p: Partial<Combatant> = {}) => A({
    spellNames: ['Fire Bolt', 'Cure Wounds', 'Burning Hands'], spellAttack: 5, spellSaveDc: 13, spellMod: 3, level: 5,
    spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0], ...p,
  });
  const cast = (s: BattleState, spellName: string, targetId: string) =>
    execute(s, { type: 'cast_spell', actorId: 'A', spellName, targetId }, P1, scripted([20, 15], [20, 15], ...dice(10, 5, 5), ...dice(6, 3, 3, 3)));
  it('dokunma büyüsü (Cure Wounds) yalnızca bitişik hedefe', () => {
    const parts = [caster(), B(), mk('C', { ownerId: 'p2', hp: 5 })];
    expect(cast(field(parts, { A: o(3, 3), B: o(12, 3), C: o(4, 3) }), 'Cure Wounds', 'C').ok).toBe(true);
    expect(errorOf(cast(field(parts, { A: o(3, 3), B: o(12, 3), C: o(5, 3) }), 'Cure Wounds', 'C'))).toContain('menzil 5 ft');
  });
  it('kendinden çıkan koni (Burning Hands 15 ft) 3 altıgen', () => {
    expect(cast(field([caster(), B()], { A: o(3, 3), B: o(6, 3) }), 'Burning Hands', 'B').ok).toBe(true);
    expect(cast(field([caster(), B()], { A: o(3, 3), B: o(7, 3) }), 'Burning Hands', 'B').ok).toBe(false);
  });
  it('Fire Bolt (120 ft) bütün haritaya yeter; yanında düşman varken dezavantajlı', () => {
    expect(cast(field([caster(), B()], { A: o(0, 0), B: o(14, 6) }), 'Fire Bolt', 'B').ok).toBe(true);
    const r = cast(field([caster(), B(), mk('C', { side: 'enemies' })], { A: o(3, 3), B: o(10, 3), C: o(3, 4) }), 'Fire Bolt', 'B');
    const ev = firstEvent(r);
    expect(ev.type === 'attack_resolved' && ev.reasons).toContain('Yanında düşman (menzilli saldırı)');
  });
});

describe('menzil verisi', () => {
  it('menzilli ve fırlatılabilir silahların menzili, uzun erişimlilerin işareti var', () => {
    for (const w of weapons) {
      if (w.ranged || w.thrown) expect(w.range?.length).toBe(2);
    }
    expect(weapons.filter((w) => w.reach).map((w) => w.name).sort()).toEqual(['Glaive', 'Halberd', 'Whip']);
  });
  it('Trident SRD 5.2.1 değerleri: 1d8, iki elle 1d10', () => {
    expect(weapons.find((w) => w.name === 'Trident')).toMatchObject({ damage: '1d8', versatileDamage: '1d10' });
  });
  it('her büyünün menzili (ft) ve her canavar saldırısının erişimi veya menzili var', () => {
    for (const s of spells) expect(s.rangeFt).toBeGreaterThanOrEqual(0);
    for (const m of monsters) {
      for (const a of m.attacks) expect(a.reachFt !== undefined || a.range !== undefined).toBe(true);
    }
  });
});
