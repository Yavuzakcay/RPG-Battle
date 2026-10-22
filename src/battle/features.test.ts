/**
 * Sınıf özellikleri ve süren büyüler (SRD 5.2.1): Sneak Attack, Hunter's Mark, Action Surge,
 * Second Wind, konsantrasyon, Spiritual Weapon, Spirit Guardians, fırsat saldırısı ve bunları
 * kullanan parti yapay zekâsı. Haritasız ve haritalı savaş.
 */
import { describe, it, expect } from 'vitest';
import { combatantFromMonster, combatantFromSheet, execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command } from './index';
import { getMonster } from '../data';
import { PARTY } from '../sim/balance';
import { chooseCommand } from './ai';
import { moveCostFn } from './movement';
import { distance, type Offset } from '../rules/hex';
import { GM, P1, mk, scripted } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
const board = () => Array.from({ length: 7 }, () => '.'.repeat(15));
const always = (u: number) => () => u;
/** d20 = 16, d6 = 5, d8 = 7, d10 = 8: isabet eder, kritik değil. */
const HIT = always(0.76);

const pc = (i: number, id: string) => combatantFromSheet(PARTY[i] as (typeof PARTY)[number], { id, ownerId: 'p1' });
const bor = (id = 'Bor') => pc(0, id);
const tavi = (id = 'Tavi') => pc(2, id);
const sela = (id = 'Sela') => pc(3, id);
const kael = (id = 'Kael') => pc(4, id);
const ogre = (id = 'O', p: Partial<Combatant> = {}) => ({ ...combatantFromMonster(getMonster('ogre'), { id }), ...p });
const dummy = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 60, maxHp: 60, ac: 10, ...p });

/** Sıra listedeki sırayla; haritalıysa verilen altıgenler, düz zemin. */
function battle(list: Combatant[], positions?: Record<string, Offset>): BattleState {
  const parts = list.map((c) => ({ ...c, initiativeBonus: 0 }));
  const init = scripted(...parts.map((_, i) => [20, 20 - i] as [number, number]));
  if (!positions) return startBattle('f', 'd-z-zemin', parts, init).state;
  const { state } = startBattle('f', 'd-z-zemin', parts, init, { map: { id: 'kale' } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: board() } };
}
const ctx = (s: BattleState, id: string) => (s.combatants[id]?.side === 'enemies' ? GM : P1);
function run(s: BattleState, cmd: Command, rng = HIT): { state: BattleState; events: BattleEvent[] } {
  const r = execute(s, cmd, ctx(s, 'actorId' in cmd ? cmd.actorId : ''), rng);
  if (!r.ok) throw new Error(r.error);
  return r;
}
const err = (s: BattleState, cmd: Command, rng = HIT) => {
  const r = execute(s, cmd, ctx(s, 'actorId' in cmd ? cmd.actorId : ''), rng);
  return r.ok ? null : r.error;
};
const endTurn = (s: BattleState) => run(s, { type: 'end_turn', actorId: s.order[s.turnIndex] as string }).state;
const attacks = (events: BattleEvent[]) => events.filter((e): e is Extract<BattleEvent, { type: 'attack_resolved' }> => e.type === 'attack_resolved');
const extras = (events: BattleEvent[]) => attacks(events).flatMap((e) => (e.extra ?? []).map((x) => x.label));
const weapon = (c: Combatant, name: string) => {
  const w = c.weaponOptions.find((x) => x.label === name);
  if (!w) throw new Error(name);
  return w;
};

describe('Sneak Attack (haydut, 5. seviye 3d6)', () => {
  it('avantajla Finesse silah isabetinde 3d6 ek hasar; turda bir kez', () => {
    const s = battle([sela(), dummy('E', { conditions: ['Restrained'] })]);
    const r = run(s, { type: 'attack', actorId: 'Sela', targetId: 'E', option: weapon(s.combatants.Sela as Combatant, 'Rapier') });
    const hit = attacks(r.events)[0];
    expect(hit?.mode).toBe('advantage');
    expect(hit?.extra?.[0]).toMatchObject({ label: 'Sneak Attack', rolls: [5, 5, 5], applied: 15, type: 'piercing' });
    expect(hit?.appliedDamage).toBe(hit!.rawDamage + 15);
    // Aynı turda ikinci isabet (Action Surge yok, ama bonus saldırı gibi) ek hasar almaz.
    const again = { ...r.state, combatants: { ...r.state.combatants, Sela: { ...(r.state.combatants.Sela as Combatant), economy: { ...(r.state.combatants.Sela as Combatant).economy, action: false } } } };
    const r2 = run(again, { type: 'attack', actorId: 'Sela', targetId: 'E', option: weapon(s.combatants.Sela as Combatant, 'Rapier') });
    expect(extras(r2.events)).toEqual([]);
  });
  it('avantaj yokken hedefin yanında Incapacitated olmayan müttefik yeter (haritalı)', () => {
    const s = battle([sela(), bor(), dummy('E')], { Sela: o(2, 3), Bor: o(6, 3), E: o(7, 3) });
    const bow = weapon(s.combatants.Sela as Combatant, 'Shortbow');
    expect(extras(run(s, { type: 'attack', actorId: 'Sela', targetId: 'E', option: bow }).events)).toEqual(['Sneak Attack']);
    const far = battle([sela(), bor(), dummy('E')], { Sela: o(2, 3), Bor: o(5, 1), E: o(7, 3) });
    expect(extras(run(far, { type: 'attack', actorId: 'Sela', targetId: 'E', option: bow }).events)).toEqual([]);
    const stunned = battle([sela(), bor(), dummy('E')], { Sela: o(2, 3), Bor: o(6, 3), E: o(7, 3) });
    const st = { ...stunned, combatants: { ...stunned.combatants, Bor: { ...(stunned.combatants.Bor as Combatant), conditions: ['Stunned'] } } };
    expect(extras(run(st, { type: 'attack', actorId: 'Sela', targetId: 'E', option: bow }).events)).toEqual([]);
  });
  it('dezavantajda yandaş yetmez; Finesse olmayan yakın dövüş silahıyla olmaz', () => {
    const s = battle([sela(), bor(), dummy('E')], { Sela: o(6, 4), Bor: o(6, 3), E: o(7, 3) });
    // Yanında düşman varken menzilli saldırı dezavantajlı.
    const bow = weapon(s.combatants.Sela as Combatant, 'Shortbow');
    const r = run(s, { type: 'attack', actorId: 'Sela', targetId: 'E', option: bow });
    expect(attacks(r.events)[0]?.mode).toBe('disadvantage');
    expect(extras(r.events)).toEqual([]);
    const club = { ...weapon(s.combatants.Sela as Combatant, 'Rapier'), label: 'Club', finesse: undefined };
    expect(extras(run(s, { type: 'attack', actorId: 'Sela', targetId: 'E', option: club }).events)).toEqual([]);
  });
  it('haritasız: hedefle aynı yükseklikte yakın dövüşçü müttefik yandaş sayılır', () => {
    const s = battle([sela(), bor(), dummy('E')]);
    const rapier = weapon(s.combatants.Sela as Combatant, 'Rapier');
    expect(extras(run(s, { type: 'attack', actorId: 'Sela', targetId: 'E', option: rapier }).events)).toEqual(['Sneak Attack']);
    const high = { ...s, combatants: { ...s.combatants, Bor: { ...(s.combatants.Bor as Combatant), height: 1 as const } } };
    expect(extras(run(high, { type: 'attack', actorId: 'Sela', targetId: 'E', option: rapier }).events)).toEqual([]);
  });
});

describe('Fighter: Action Surge ve Second Wind', () => {
  it('Action Surge eylemden sonra bir Attack eylemi daha verir (Extra Attack ile iki saldırı)', () => {
    let s = battle([bor(), dummy('E', { hp: 200, maxHp: 200 })]);
    const sword = weapon(s.combatants.Bor as Combatant, 'Longsword');
    expect(err(s, { type: 'action_surge', actorId: 'Bor' })).toBe('Önce eylemini kullanmalısın.');
    s = run(s, { type: 'attack', actorId: 'Bor', targetId: 'E', option: sword }).state;
    s = run(s, { type: 'attack', actorId: 'Bor', targetId: 'E', option: sword }).state;
    expect(err(s, { type: 'attack', actorId: 'Bor', targetId: 'E', option: sword })).toBe('Eylem bu tur kullanıldı.');
    const r = run(s, { type: 'action_surge', actorId: 'Bor' });
    expect(r.events).toEqual([{ type: 'feature_used', actorId: 'Bor', feature: 'actionSurge', remaining: 0 }]);
    s = run(r.state, { type: 'attack', actorId: 'Bor', targetId: 'E', option: sword }).state;
    s = run(s, { type: 'attack', actorId: 'Bor', targetId: 'E', option: sword }).state;
    expect(err(s, { type: 'attack', actorId: 'Bor', targetId: 'E', option: sword })).toBe('Eylem bu tur kullanıldı.');
    expect(err(s, { type: 'action_surge', actorId: 'Bor' })).toBe('Action Surge kalmadı.');
  });
  it('Action Surge\'ün ek eylemiyle büyü yapılamaz; turda bir kez', () => {
    let s = battle([mk('F', { ownerId: 'p1', resources: { actionSurge: 2, secondWind: 0, favoredEnemy: 0 }, spellNames: ['Fire Bolt'], spellAttack: 5, weaponOptions: [] }), dummy('E')]);
    s = run(s, { type: 'dash', actorId: 'F' }).state;
    s = run(s, { type: 'action_surge', actorId: 'F' }).state;
    expect(err(s, { type: 'cast_spell', actorId: 'F', spellName: 'Fire Bolt', targetId: 'E' })).toBe('Action Surge\'ün ek eylemiyle büyü yapılamaz.');
    s = run(s, { type: 'dash', actorId: 'F' }).state;
    expect(err(s, { type: 'action_surge', actorId: 'F' })).toBe('Action Surge bu tur kullanıldı.');
  });
  it('Second Wind bonus eylemle 1d10 + seviye iyileştirir; 5. seviyede 3 kullanım', () => {
    const s0 = battle([bor(), dummy('E')]);
    expect(s0.combatants.Bor?.resources).toEqual({ actionSurge: 1, secondWind: 3 });
    const s = { ...s0, combatants: { ...s0.combatants, Bor: { ...(s0.combatants.Bor as Combatant), hp: 10 } } };
    const r = run(s, { type: 'second_wind', actorId: 'Bor' }, scripted([10, 6]));
    expect(r.events.filter((e) => e.type !== 'action_used')).toEqual([
      { type: 'feature_used', actorId: 'Bor', feature: 'secondWind', remaining: 2 },
      { type: 'healed', actorId: 'Bor', targetId: 'Bor', label: 'Second Wind', amount: 11, targetHpAfter: 21 },
    ]);
    expect(r.state.combatants.Bor?.economy.bonus).toBe(true);
    expect(err(r.state, { type: 'second_wind', actorId: 'Bor' })).toBe('Bonus eylem bu tur kullanıldı.');
  });
});

describe('Hunter\'s Mark (korucu) ve konsantrasyon', () => {
  it('Favored Enemy ile slotsuz, bonus eylem; işaretliye her isabette 1d6 force', () => {
    let s = battle([kael(), dummy('E'), dummy('F')]);
    const slots = s.combatants.Kael?.spellSlots;
    expect(s.combatants.Kael?.spellNames).toContain("Hunter's Mark");
    const r = run(s, { type: 'cast_spell', actorId: 'Kael', spellName: "Hunter's Mark", targetId: 'E' });
    s = r.state;
    expect(r.events.some((e) => e.type === 'slot_spent')).toBe(false);
    expect(s.combatants.Kael?.resources.favoredEnemy).toBe(2);
    expect(s.combatants.Kael?.spellSlots).toEqual(slots);
    expect(s.combatants.Kael?.economy.bonus).toBe(true);
    expect(s.combatants.Kael?.concentration).toMatchObject({ spell: "Hunter's Mark", targetId: 'E' });
    const bow = weapon(s.combatants.Kael as Combatant, 'Longbow');
    const hit = attacks(run(s, { type: 'attack', actorId: 'Kael', targetId: 'E', option: bow }).events)[0];
    expect(hit?.extra).toEqual([{ label: "Hunter's Mark", rolls: [5], raw: 5, applied: 5, type: 'force', note: null }]);
    expect(extras(run(s, { type: 'attack', actorId: 'Kael', targetId: 'F', option: bow }).events)).toEqual([]);
  });
  it('işaretli hedef 0 HP\'ye düşmeden işaret taşınamaz; düşünce bonus eylemle taşınır', () => {
    let s = battle([kael(), dummy('E', { hp: 3 }), dummy('F')]);
    s = run(s, { type: 'cast_spell', actorId: 'Kael', spellName: "Hunter's Mark", targetId: 'E' }).state;
    expect(err(s, { type: 'spell_followup', actorId: 'Kael', targetId: 'F' })).toBe('Bonus eylem bu tur kullanıldı.');
    s = endTurn(endTurn(endTurn(s)));
    expect(err(s, { type: 'spell_followup', actorId: 'Kael', targetId: 'F' })).toContain('0 HP');
    s = run(s, { type: 'attack', actorId: 'Kael', targetId: 'E', option: weapon(s.combatants.Kael as Combatant, 'Longbow') }).state;
    expect(s.combatants.E?.hp).toBe(0);
    const r = run(s, { type: 'spell_followup', actorId: 'Kael', targetId: 'F' });
    expect(r.state.combatants.Kael?.concentration?.targetId).toBe('F');
    expect(r.state.combatants.Kael?.economy.bonus).toBe(true);
  });
  it('hasar alan konsantre CON save yapar (DC 10 veya hasarın yarısı); başarısızsa biter', () => {
    let s = battle([kael(), ogre('O')]);
    s = run(s, { type: 'cast_spell', actorId: 'Kael', spellName: "Hunter's Mark", targetId: 'O' }).state;
    s = endTurn(s);
    // Ogre 16 → isabet, 2d8+4 = 7+7+4 = 18; CON save zar 16 + 1 = 17 ≥ DC 10.
    let r = run(s, { type: 'monster_attack', actorId: 'O', targetId: 'Kael', attackIndex: 0 });
    expect(attacks(r.events)[0]?.effects).toEqual([{ kind: 'concentration', spell: "Hunter's Mark", dc: 10, natural: 16, total: 17, success: true }]);
    expect(r.state.combatants.Kael?.concentration).not.toBe(null);
    r = run(s, { type: 'monster_attack', actorId: 'O', targetId: 'Kael', attackIndex: 0 }, scripted([20, 15], [8, 7], [8, 7], [20, 2]));
    expect(attacks(r.events)[0]?.effects[0]).toMatchObject({ kind: 'concentration', success: false });
    expect(r.state.combatants.Kael?.concentration).toBe(null);
  });
  it('yeni konsantrasyon büyüsü eskisini bitirir; 0 HP veya Incapacitated bitirir; büyünün durumu kalkar', () => {
    const caster = mk('W', { ownerId: 'p1', spellNames: ['Hold Person', 'Bless'], spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0], spellSaveDc: 30 });
    let s = battle([caster, dummy('E')]);
    s = run(s, { type: 'cast_spell', actorId: 'W', spellName: 'Hold Person', targetId: 'E' }).state;
    expect(s.combatants.E?.conditions).toContain('Paralyzed');
    expect(s.combatants.W?.concentration?.conditions).toEqual([{ targetId: 'E', condition: 'Paralyzed' }]);
    s = endTurn(endTurn(s));
    const bless = run(s, { type: 'cast_spell', actorId: 'W', spellName: 'Bless' }).state;
    expect(bless.combatants.W?.concentration?.spell).toBe('Bless');
    expect(bless.combatants.E?.conditions).not.toContain('Paralyzed');
    const ko = (execute(s, { type: 'set_condition', targetId: 'W', condition: 'Unconscious', present: true }, GM, HIT) as { state: BattleState }).state;
    expect(ko.combatants.W?.concentration).toBe(null);
    expect(ko.combatants.E?.conditions).not.toContain('Paralyzed');
  });
});

describe('Spiritual Weapon (sonraki turlarda bonus eylemle saldırı)', () => {
  it('yakın dövüş büyü saldırısı (yanında düşman dezavantajı yok); güç hedefin yanında kalır', () => {
    const s = battle([tavi(), dummy('Near'), dummy('E')], { Tavi: o(2, 3), Near: o(3, 3), E: o(10, 3) });
    const r = run(s, { type: 'cast_spell', actorId: 'Tavi', spellName: 'Spiritual Weapon', targetId: 'E' });
    const hit = attacks(r.events)[0];
    expect(hit?.mode).toBe('normal');
    expect(hit?.damageType).toBe('force');
    const conc = r.state.combatants.Tavi?.concentration;
    expect(conc?.spell).toBe('Spiritual Weapon');
    expect(distance(conc?.pos as Offset, o(10, 3))).toBe(1);
    expect(err(r.state, { type: 'cast_spell', actorId: 'Tavi', spellName: 'Spiritual Weapon', targetId: 'E' })).toBe('Bonus eylem bu tur kullanıldı.');
    // 60 ft + gücün 5 ft'i: 13 altıgen uzak hedef menzil dışında.
    const far = battle([tavi(), dummy('E')], { Tavi: o(0, 3), E: o(14, 3) });
    expect(err(far, { type: 'cast_spell', actorId: 'Tavi', spellName: 'Spiritual Weapon', targetId: 'E' })).toContain('erişim dışında');
  });
  it('sonraki turda güç 20 ft uçup saldırır (bonus eylem); aynı tur ve uzak hedef olmaz', () => {
    let s = battle([tavi(), dummy('E'), dummy('F')], { Tavi: o(2, 3), E: o(8, 3), F: o(14, 0) });
    s = run(s, { type: 'cast_spell', actorId: 'Tavi', spellName: 'Spiritual Weapon', targetId: 'E' }).state;
    expect(err(s, { type: 'spell_followup', actorId: 'Tavi', targetId: 'E' })).toBe('Bonus eylem bu tur kullanıldı.');
    s = endTurn(endTurn(endTurn(s)));
    expect(err(s, { type: 'spell_followup', actorId: 'Tavi', targetId: 'F' })).toContain('Hedef güce uzak');
    const r = run(s, { type: 'spell_followup', actorId: 'Tavi', targetId: 'E' });
    expect(attacks(r.events)[0]).toMatchObject({ label: 'Spiritual Weapon', hit: true, damageType: 'force', damageRolls: [7] });
    expect(attacks(r.events)[0]?.rawDamage).toBe(7 + (s.combatants.Tavi as Combatant).spellMod);
    expect(r.state.combatants.Tavi?.economy.bonus).toBe(true);
    expect(r.state.combatants.Tavi?.economy.action).toBe(false);
  });
  it('haritasız savaşta da sürdürülür; konsantrasyon bitince sürdürülemez', () => {
    let s = battle([tavi(), dummy('E')]);
    s = run(s, { type: 'cast_spell', actorId: 'Tavi', spellName: 'Spiritual Weapon', targetId: 'E' }).state;
    s = endTurn(endTurn(s));
    expect(attacks(run(s, { type: 'spell_followup', actorId: 'Tavi', targetId: 'E' }).events)).toHaveLength(1);
    const lost = { ...s, combatants: { ...s.combatants, Tavi: { ...(s.combatants.Tavi as Combatant), concentration: null } } };
    expect(err(lost, { type: 'spell_followup', actorId: 'Tavi', targetId: 'E' })).toBe('Sürdürülecek bir konsantrasyon büyüsü yok.');
  });
});

describe('Spirit Guardians (kalıcı yayılım)', () => {
  const saves = (events: BattleEvent[]) => events.filter((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved');
  it('yayılıma giren düşman save yapar, turda yalnızca bir kez; tur sonunda yeniden yapmaz', () => {
    let s = battle([tavi(), dummy('E', { speed: 120 })], { Tavi: o(2, 3), E: o(10, 3) });
    s = run(s, { type: 'cast_spell', actorId: 'Tavi', spellName: 'Spirit Guardians' }).state;
    expect(s.combatants.Tavi?.concentration?.spell).toBe('Spirit Guardians');
    s = endTurn(s);
    const r = run(s, { type: 'move', actorId: 'E', to: o(4, 3) });
    const entered = saves(r.events);
    expect(entered).toHaveLength(1);
    expect(entered[0]).toMatchObject({ targetId: 'E', label: 'Spirit Guardians', ability: 'wis', damageType: 'radiant', aura: { casterId: 'Tavi' } });
    const back = run(r.state, { type: 'move', actorId: 'E', to: o(7, 3) });
    const again = run(back.state, { type: 'move', actorId: 'E', to: o(5, 3) });
    expect(saves(again.events)).toHaveLength(0);
    expect(saves(run(again.state, { type: 'end_turn', actorId: 'E' }).events)).toHaveLength(0);
  });
  it('turunu yayılımda bitiren save yapar; yayılım içinde hız yarı (altıgen iki kat)', () => {
    let s = battle([tavi(), dummy('E')], { Tavi: o(2, 3), E: o(4, 3) });
    s = run(s, { type: 'cast_spell', actorId: 'Tavi', spellName: 'Spirit Guardians' }).state;
    s = endTurn(s);
    s = { ...s, combatants: { ...s.combatants, Tavi: { ...(s.combatants.Tavi as Combatant), concentration: { ...(s.combatants.Tavi?.concentration as NonNullable<Combatant['concentration']>), auraHits: {} } } } };
    const cost = moveCostFn(s, s.combatants.E as Combatant);
    expect(cost(o(5, 3), o(4, 3))).toBe(2);
    expect(cost(o(6, 3), o(5, 3))).toBe(1);
    const r = run(s, { type: 'end_turn', actorId: 'E' });
    expect(saves(r.events).map((e) => e.targetId)).toEqual(['E']);
  });
  it('büyücü yürüyüp yayılımı düşmana götürürse düşman save yapar; müttefik etkilenmez', () => {
    let s = battle([tavi(), bor(), dummy('E')], { Tavi: o(1, 3), Bor: o(2, 2), E: o(9, 3) });
    s = run(s, { type: 'cast_spell', actorId: 'Tavi', spellName: 'Spirit Guardians' }).state;
    const r = run(s, { type: 'move', actorId: 'Tavi', to: o(6, 3) });
    expect(saves(r.events).map((e) => e.targetId)).toEqual(['E']);
  });
  it('haritasız: aynı yükseklikteki düşmanlar yayılımda; yüksekteki tur sonunda etkilenmez', () => {
    let s = battle([tavi(), dummy('E'), dummy('High', { height: 1 })]);
    const cast = run(s, { type: 'cast_spell', actorId: 'Tavi', spellName: 'Spirit Guardians' });
    expect(saves(cast.events).map((e) => e.targetId)).toEqual(['E']);
    s = endTurn(cast.state);
    expect(saves(run(s, { type: 'end_turn', actorId: 'E' }).events).map((e) => e.targetId)).toEqual(['E']);
    s = endTurn(s);
    expect(saves(run(s, { type: 'end_turn', actorId: 'High' }).events)).toHaveLength(0);
  });
});

describe('fırsat saldırısı', () => {
  it('erişimden çıkan yaratığa tepkiyle tek yakın dövüş saldırısı; tepki harcanır', () => {
    let s = battle([bor(), sela(), ogre('O')], { Bor: o(5, 3), O: o(6, 3), Sela: o(7, 3) });
    const r = run(s, { type: 'move', actorId: 'Bor', to: o(2, 3) });
    const oa = attacks(r.events);
    expect(oa).toHaveLength(1);
    expect(oa[0]).toMatchObject({ actorId: 'O', targetId: 'Bor', label: 'Greatclub', opportunity: true });
    expect(r.events).toContainEqual({ type: 'action_used', actorId: 'O', kind: 'reaction', what: 'Fırsat saldırısı' });
    expect(r.state.combatants.Bor?.pos).toEqual(o(2, 3));
    // Tepkisi gitti (kendi turuna kadar): başka biri erişimden çıksa da saldıramaz.
    s = endTurn(r.state);
    expect(s.order[s.turnIndex]).toBe('Sela');
    expect(attacks(run(s, { type: 'move', actorId: 'Sela', to: o(10, 3) }).events)).toHaveLength(0);
  });
  it('Disengage yapan, erişimde kalan ve yanından geçmeyen tetiklemez', () => {
    const s = battle([sela(), ogre('O')], { Sela: o(5, 3), O: o(6, 3) });
    const dis = run(s, { type: 'disengage', actorId: 'Sela', bonus: true }).state;
    expect(attacks(run(dis, { type: 'move', actorId: 'Sela', to: o(2, 3) }).events)).toHaveLength(0);
    expect(attacks(run(s, { type: 'move', actorId: 'Sela', to: o(5, 2) }).events)).toHaveLength(0);
  });
  it('fırsat saldırısıyla düşen yürüyemez', () => {
    const s = battle([mk('W', { ownerId: 'p1', hp: 3, maxHp: 30 }), ogre('O')], { W: o(5, 3), O: o(6, 3) });
    const r = run(s, { type: 'move', actorId: 'W', to: o(2, 3) });
    expect(r.events.some((e) => e.type === 'moved')).toBe(false);
    expect(r.state.combatants.W?.pos).toEqual(o(5, 3));
    expect(r.state.combatants.W?.life).toBe('dying');
  });
  it('karakterin fırsat saldırısı en iyi yakın dövüş silahıyla; haydut başkasının turunda Sneak Attack yapabilir', () => {
    let s = battle([ogre('O'), sela(), bor()], { O: o(6, 3), Sela: o(5, 3), Bor: o(7, 3) });
    const r = run(s, { type: 'move', actorId: 'O', to: o(10, 3) });
    const byId = Object.fromEntries(attacks(r.events).map((e) => [e.actorId, e]));
    expect(byId.Bor?.label).toBe('Longsword');
    expect(byId.Sela?.label).toBe('Rapier');
    expect(byId.Sela?.extra?.map((x) => x.label)).toEqual(['Sneak Attack']);
    s = r.state;
    expect(s.combatants.Sela?.sneakTurn).toBe(`${s.round}:0`);
  });
  it('haritasız: yükseklik değiştiren, aynı yükseklikteki düşmanlardan fırsat saldırısı yer', () => {
    const s = battle([mk('W', { ownerId: 'p1', hp: 30, maxHp: 30 }), ogre('O'), ogre('Far', { height: 1 })]);
    const r = run(s, { type: 'change_height', actorId: 'W', toHeight: -1 });
    expect(attacks(r.events).map((e) => e.actorId)).toEqual(['O']);
    expect(r.events.findIndex((e) => e.type === 'attack_resolved')).toBeLessThan(r.events.findIndex((e) => e.type === 'height_changed'));
    const dis = run(s, { type: 'disengage', actorId: 'W' }).state;
    expect(attacks(run(dis, { type: 'change_height', actorId: 'W', toHeight: -1 }).events)).toHaveLength(0);
  });
});

describe('parti yapay zekâsı sınıf özelliklerini kullanır', () => {
  it('savaşçı yaralıyken Second Wind, saldırdıktan sonra Action Surge', () => {
    const s = battle([bor(), dummy('E', { hp: 200, maxHp: 200 })]);
    const hurt = { ...s, combatants: { ...s.combatants, Bor: { ...(s.combatants.Bor as Combatant), hp: 15 } } };
    expect(chooseCommand(hurt).type).toBe('second_wind');
    expect(chooseCommand(s).type).toBe('attack');
    let t = s;
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) {
      const cmd = chooseCommand(t);
      if (cmd.type === 'end_turn') break;
      seen.push(cmd.type);
      t = run(t, cmd).state;
    }
    expect(seen).toEqual(['attack', 'attack', 'action_surge', 'attack', 'attack']);
  });
  it('korucu önce Hunter\'s Mark yapar; işaretli hedef düşünce işareti taşır', () => {
    const s = battle([kael(), dummy('E')], { Kael: o(2, 3), E: o(8, 3) });
    const first = chooseCommand(s);
    expect(first).toMatchObject({ type: 'cast_spell', spellName: "Hunter's Mark", targetId: 'E' });
    const two = battle([kael(), dummy('E'), dummy('F')], { Kael: o(2, 3), E: o(8, 3), F: o(9, 4) });
    let t = run(two, { type: 'cast_spell', actorId: 'Kael', spellName: "Hunter's Mark", targetId: 'E' }).state;
    t = endTurn(endTurn(endTurn(t)));
    t = { ...t, combatants: { ...t.combatants, E: { ...(t.combatants.E as Combatant), hp: 0 } } };
    expect(chooseCommand(t)).toEqual({ type: 'spell_followup', actorId: 'Kael', targetId: 'F' });
  });
  it('haydut fırsat saldırısı yiyecek yürüyüşten önce bonus eylemle ayrılır', () => {
    // Ogre gizli (hedef alınamaz) ama fırsat saldırısı yapabilir; görünen tek hedef menzil dışında:
    // yaklaşırken Ogre'nin erişiminden çıkar.
    const s0 = battle([sela(), ogre('O'), dummy('Far')], { Sela: o(4, 3), O: o(5, 3), Far: o(14, 6) });
    const s = { ...s0, combatants: { ...s0.combatants, O: { ...(s0.combatants.O as Combatant), hidden: { dc: 30 } } } };
    const cmd = chooseCommand(s);
    expect(cmd).toEqual({ type: 'disengage', actorId: 'Sela', bonus: true });
  });
  it('rahip Spiritual Weapon\'ı bonus eylemle yapar, sonraki turda sürdürür', () => {
    let s = battle([tavi(), dummy('E')], { Tavi: o(2, 3), E: o(6, 3) });
    const cmd = chooseCommand(s);
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Spiritual Weapon' });
    s = run(s, cmd).state;
    expect(chooseCommand(s)).toMatchObject({ type: 'cast_spell', spellName: 'Sacred Flame' });
    s = endTurn(endTurn(s));
    expect(chooseCommand(s)).toEqual({ type: 'spell_followup', actorId: 'Tavi', targetId: 'E' });
  });
  it('savaşçı bu tur yürüyerek kılıcına ulaşabiliyorsa arbaletle atmak yerine yürür', () => {
    const s = battle([bor(), dummy('E')], { Bor: o(2, 3), E: o(6, 3) });
    const cmd = chooseCommand(s);
    expect(cmd.type).toBe('move');
    const far = battle([bor(), dummy('E')], { Bor: o(0, 3), E: o(14, 3) });
    // Kılıca bu tur ulaşamıyor: yerinden arbaletle atar.
    expect(chooseCommand(far)).toMatchObject({ type: 'attack', option: { label: 'Light crossbow' } });
  });
  it('olaylar baştan oynatılınca aynı durum çıkar (konsantrasyon, kaynaklar, Sneak Attack)', async () => {
    const { replay } = await import('./index');
    let s = battle([sela(), kael(), bor(), ogre('O', { hp: 300, maxHp: 300 })], { Sela: o(5, 3), Kael: o(2, 3), Bor: o(7, 4), O: o(6, 3) });
    const all: BattleEvent[] = [{ type: 'battle_started', state: s }];
    for (let i = 0; i < 40 && s.status === 'active'; i++) {
      const id = s.order[s.turnIndex] as string;
      const cmd = chooseCommand(s);
      const r = execute(s, cmd, ctx(s, id), always(0.4 + (i % 5) * 0.1));
      if (!r.ok) break;
      all.push(...r.events);
      s = r.state;
    }
    expect(replay(all)).toEqual(s);
    expect(all.some((e) => e.type === 'feature_used')).toBe(true);
  });
});

