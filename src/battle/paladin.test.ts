/**
 * Paladin 1–5 (Görev P-Paladin; SRD 5.2.1): sınıf kiti, Lay On Hands, Paladin's Smite / Divine Smite, Channel Divinity
 * (Sacred Weapon), yemin büyüleri, Blessed Warrior, Paladin büyüleri (Divine Favor, Shield of Faith, Shining Smite,
 * Protection from Evil and Good, Magic Weapon).
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet } from './create';
import { applyEvents } from './reduce';
import { advanceTo, P1, scripted, setup } from './fixtures';
import { effectiveAc } from './divine';
import { chooseCommand } from './ai';
import { blankCharacter, characterProblems, withSkills } from '../rules/builder';
import { classKit, completeThrough, experimentalFrom, missingFeatures } from '../rules/classFeatures';
import type { CharacterSheet } from '../rules/stats';
import type { BattleState, Combatant, Command } from './types';

const sheet = (level: number, p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  name: 'Aria', raceId: 'human', classId: 'paladin', level, armorName: 'Chain Mail', shield: true, itemNames: [],
  baseScores: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 }, backgroundBonuses: { str: 2, cha: 1 },
  weapons: [{ name: 'Longsword' }, { name: 'Javelin' }], ...(level >= 3 ? { subclassId: 'oath-of-devotion' } : {}), ...p,
});

/** A Paladin (sıra A'da), B düşman (bitişik, haritasız, 80 HP, AC 5), C dost. */
function battle(level: number, p: Partial<CharacterSheet> = {}, b: Partial<Combatant> = {}, c: Partial<Combatant> = {}): BattleState {
  const pal = combatantFromSheet(sheet(level, p), { id: 'A', ownerId: 'p1' });
  const { id: _i, name: _n, ownerId: _o, initiativeBonus: _b, ...fields } = pal;
  return advanceTo(setup('Düz', { A: fields as Partial<Combatant>, B: { hp: 80, maxHp: 80, ac: 5, ...b }, C: c }), 'A');
}
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 20 }, () => [20, 10] as [number, number]));
const run = (s: BattleState, cmd: Command, rng = pad()) => {
  const r = execute(s, cmd, P1, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, pad()); return r.ok ? null : r.error; };
const A = (s: BattleState) => s.combatants.A as Combatant;
const opt = (s: BattleState, label: string) => A(s).weaponOptions.find((o) => o.label === label) as NonNullable<Combatant['offHandOption']>;
const hit = (s: BattleState, rng = pad([20, 15], [8, 5])) => run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Longsword') }, rng).state;
const LOH = 'paladin:lay-on-hands';
const SW = 'paladin/oath-of-devotion:sacred-weapon';

describe('Paladin: sınıf kiti (SRD 5.2.1 tablosundan)', () => {
  it('slotlar, Lay On Hands (5 × seviye), Paladin\'s Smite, Channel Divinity 2, Extra Attack 5. seviyede', () => {
    const at = (l: number) => combatantFromSheet(sheet(l), { id: 'a', ownerId: 'p' });
    expect(at(1).spellSlots.slice(0, 2)).toEqual([2, 0]);
    expect(at(1).resources).toEqual({ layOnHands: 5 });
    expect(at(2).resources).toMatchObject({ layOnHands: 10, paladinsSmite: 1 });
    expect(at(3).resources).toMatchObject({ layOnHands: 15, channelDivinity: 2 });
    expect(at(5).spellSlots.slice(0, 3)).toEqual([4, 2, 0]);
    expect(at(4).attacksPerAction).toBe(1);
    expect(at(5).attacksPerAction).toBe(2);
    // Weapon Mastery: 2 silah; Fighting Style 2. seviyede.
    expect(classKit('paladin', 1).weaponMastery?.count).toBe(2);
    expect(classKit('paladin', 2).featSlots.map((f) => f.level)).toEqual([2]);
  });
  it('her zaman hazır büyüler: Divine Smite (2), yemin büyüleri (3, 5), Find Steed (5); hazır sayısına girmez', () => {
    expect(classKit('paladin', 1).alwaysPrepared).toEqual([]);
    expect(classKit('paladin', 2).alwaysPrepared).toEqual(['Divine Smite']);
    expect(classKit('paladin', 3, 'oath-of-devotion').alwaysPrepared).toEqual(['Divine Smite', 'Protection from Evil and Good', 'Shield of Faith']);
    expect([...classKit('paladin', 5, 'oath-of-devotion').alwaysPrepared].sort()).toEqual(['Aid', 'Divine Smite', 'Find Steed', 'Protection from Evil and Good', 'Shield of Faith', 'Zone of Truth']);
    // Alt sınıf seçilmemişse yemin büyüleri ve Sacred Weapon yok.
    expect(classKit('paladin', 3).alwaysPrepared).toEqual(['Divine Smite']);
    expect(classKit('paladin', 3).usable.map((u) => u.key)).toEqual([LOH]);
    expect(classKit('paladin', 3, 'oath-of-devotion').usable.map((u) => u.key)).toEqual([LOH, SW]);
  });
  it('1–5 eksiksiz: "deneysel" uyarısı 6. seviyeden (Faithful Steed kısmen: Find Steed çağırması var, Görev R3)', () => {
    expect(missingFeatures('paladin', 5, 'oath-of-devotion')).toEqual([]);
    expect(completeThrough('paladin', 'oath-of-devotion')).toBeGreaterThanOrEqual(5);
    expect(experimentalFrom('paladin', 'oath-of-devotion')).toBe(6);
    expect(classKit('paladin', 5, 'oath-of-devotion').features.find((f) => f.id === 'faithful-steed')?.mechanic?.status).toBe('partial');
  });
});

describe('Lay On Hands', () => {
  it('bonus eylem; havuzdan istenen kadar HP; havuz azalır; dokunmak gerekir', () => {
    let s = battle(3, {}, {}, { hp: 4, maxHp: 20 });
    const r = run(s, { type: 'use_feature', actorId: 'A', feature: LOH, targetId: 'C', amount: 10 });
    expect(r.events.find((e) => e.type === 'healed')).toMatchObject({ targetId: 'C', amount: 10, targetHpAfter: 14 });
    expect(r.state.combatants.C?.hp).toBe(14);
    expect(A(r.state).resources.layOnHands).toBe(5);
    expect(A(r.state).economy.bonus).toBe(true);
    s = r.state;
    expect(err(s, { type: 'use_feature', actorId: 'A', feature: LOH, targetId: 'C', amount: 1 })).toBe('Bonus eylem bu tur kullanıldı.');
  });
  it('havuzdan fazlası, tam sağlıklı hedef, düşman ve uzak hedef olmaz', () => {
    const s = battle(1, {}, {}, { hp: 4, maxHp: 20 });
    expect(err(s, { type: 'use_feature', actorId: 'A', feature: LOH, targetId: 'C', amount: 6 })).toBe('Havuzda 5 puan var.');
    expect(err(s, { type: 'use_feature', actorId: 'A', feature: LOH, targetId: 'A', amount: 2 })).toContain('tam sağlıklı');
    expect(err(s, { type: 'use_feature', actorId: 'A', feature: LOH, targetId: 'B', amount: 2 })).toContain('dostuna');
    const far = advanceTo(setup('Düz', { A: { ...A(s), id: 'A' }, C: { hp: 4, maxHp: 20, height: 1 } }), 'A');
    expect(err(far, { type: 'use_feature', actorId: 'A', feature: LOH, targetId: 'C', amount: 2 })).toContain('bitişik');
  });
  it('5 puanla Poisoned kalkar (HP vermez); 0 HP dostu kaldırır', () => {
    const s = battle(2, {}, {}, { hp: 0, maxHp: 20, life: 'dying', conditions: ['Poisoned', 'Unconscious'] });
    const cured = run(s, { type: 'use_feature', actorId: 'A', feature: LOH, targetId: 'C', amount: 1, cure: true });
    expect(cured.events.find((e) => e.type === 'condition_changed')).toMatchObject({ condition: 'Poisoned', present: false });
    expect(A(cured.state).resources.layOnHands).toBe(4);
    expect(cured.state.combatants.C?.hp).toBe(1);
    expect(cured.state.combatants.C?.conditions).not.toContain('Poisoned');
  });
});

describe("Paladin's Smite ve Divine Smite", () => {
  it('önce yakın dövüş isabeti gerekir; bonus eylem; ilk kullanım slotsuz, sonra slot', () => {
    let s = battle(2, { spellNames: [] });
    expect(err(s, { type: 'cast_spell', actorId: 'A', spellName: 'Divine Smite', targetId: 'B' })).toBe('Önce bu tur yakın dövüş silahıyla vurmalısın.');
    s = hit(s);
    expect(A(s).economy.meleeHit).toEqual({ targetId: 'B', critical: false });
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Divine Smite', targetId: 'B' }, pad([8, 4], [8, 5]));
    expect(r.events.find((e) => e.type === 'feature_used')).toMatchObject({ feature: 'paladinsSmite', remaining: 0 });
    expect(r.events.some((e) => e.type === 'slot_spent')).toBe(false);
    const dmg = r.events.find((e) => e.type === 'attack_resolved' && e.label.startsWith('Divine Smite'));
    expect(dmg).toMatchObject({ damageRolls: [4, 5], rawDamage: 9, damageType: 'radiant' });
    expect(A(r.state).economy.bonus).toBe(true);
    // Sonraki turda serbest kullanım bitti: slot harcar.
    let t = advanceTo(run(r.state, { type: 'end_turn', actorId: 'A' }).state, 'A');
    t = hit(t);
    const r2 = run(t, { type: 'cast_spell', actorId: 'A', spellName: 'Divine Smite', targetId: 'B' });
    expect(r2.events.find((e) => e.type === 'slot_spent')).toMatchObject({ level: 1 });
  });
  it('yukarı slot +1d8, Undead/Fiend +1d8, kritik vuruşta zarlar iki kat; yalnızca vurulan hedefe', () => {
    let s = battle(5, {}, { creatureType: 'undead' });
    s = hit(s, pad([20, 20], [8, 5], [8, 5]));
    expect(A(s).economy.meleeHit).toEqual({ targetId: 'B', critical: true });
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Divine Smite', targetId: 'B', slotLevel: 2 });
    const dmg = r.events.find((e) => e.type === 'attack_resolved' && e.label.startsWith('Divine Smite'));
    // 2d8 + 1d8 (2. slot) + 1d8 (Undead) = 4d8, kritikte 8 zar.
    expect(dmg && dmg.type === 'attack_resolved' ? dmg.damageRolls.length : 0).toBe(8);
    expect(err(s, { type: 'cast_spell', actorId: 'A', spellName: 'Divine Smite', targetId: 'C' })).toContain('vurduğun hedefe');
  });
  it('menzilli isabet smite açmaz', () => {
    let s = battle(2, {});
    s = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Javelin (fırlatma)') }, pad([20, 15], [6, 3])).state;
    expect(A(s).economy.meleeHit).toBeUndefined();
  });
});

describe('Channel Divinity: Sacred Weapon (Oath of Devotion)', () => {
  it('eylemsiz, Channel Divinity harcar; yakın dövüş saldırısına CHA (+2), menzilliye değil', () => {
    const s = battle(3);
    const base = opt(s, 'Longsword').attackBonus;
    const r = run(s, { type: 'use_feature', actorId: 'A', feature: SW });
    expect(A(r.state).resources.channelDivinity).toBe(1);
    expect(A(r.state).economy.bonus).toBe(false);
    const atk = run(r.state, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(r.state, 'Longsword') }, pad([20, 3], [8, 5]));
    const ev = atk.events.find((e) => e.type === 'attack_resolved');
    expect(ev && ev.type === 'attack_resolved' ? ev.total : 0).toBe(3 + base + 2);
    const thrown = run(r.state, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(r.state, 'Javelin (fırlatma)') }, pad([20, 3], [6, 3]));
    const tev = thrown.events.find((e) => e.type === 'attack_resolved');
    expect(tev && tev.type === 'attack_resolved' ? tev.total : 0).toBe(3 + opt(r.state, 'Javelin (fırlatma)').attackBonus);
  });
  it('hedef silahın türüne dirençliyse Radiant; eylem başka şeye harcandıysa kullanılamaz', () => {
    const s = run(battle(3, {}, { resistances: ['slashing'] }), { type: 'use_feature', actorId: 'A', feature: SW }).state;
    const atk = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Longsword') }, pad([20, 15], [8, 5]));
    expect(atk.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ damageType: 'radiant' });
    const dodged = run(battle(3), { type: 'dodge', actorId: 'A' }).state;
    expect(err(dodged, { type: 'use_feature', actorId: 'A', feature: SW })).toContain('Attack eylemiyle');
  });
});

describe('Paladin büyüleri', () => {
  it('Shield of Faith: konsantrasyon hedefine +2 AC; konsantrasyon bitince kalkar', () => {
    const s = battle(1, { spellNames: ['Shield of Faith'] });
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Shield of Faith', targetId: 'C' });
    const c = r.state.combatants.C as Combatant;
    expect(effectiveAc(r.state, c)).toBe(c.ac + 2);
    const ended: BattleState = { ...r.state, combatants: { ...r.state.combatants, A: { ...A(r.state), concentration: null } } };
    expect(effectiveAc(ended, c)).toBe(c.ac);
  });
  it('Divine Favor: silah isabetinde +1d4 radiant; Magic Weapon: +1 saldırı ve hasar', () => {
    let s = battle(5, { spellNames: ['Divine Favor', 'Magic Weapon'] });
    s = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Divine Favor' }).state;
    expect(A(s).buffs?.[0]).toMatchObject({ source: 'Divine Favor', extraDamage: '1d4', damageType: 'radiant' });
    const atk = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(s, 'Longsword') }, pad([20, 15], [8, 5], [4, 3]));
    expect(atk.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ extra: [{ label: 'Divine Favor', raw: 3, type: 'radiant' }] });
    let m = battle(5, { spellNames: ['Magic Weapon'] });
    const before = opt(m, 'Longsword');
    m = run(m, { type: 'cast_spell', actorId: 'A', spellName: 'Magic Weapon' }).state;
    const a2 = run(m, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(m, 'Longsword') }, pad([20, 3], [8, 5]));
    const ev = a2.events.find((e) => e.type === 'attack_resolved');
    expect(ev && ev.type === 'attack_resolved' ? [ev.total, ev.rawDamage] : []).toEqual([3 + before.attackBonus + 1, 5 + 3 + 1]);
  });
  it('Shining Smite: hasar ve konsantrasyon boyunca hedefe saldırılar avantajlı', () => {
    let s = battle(5, { spellNames: ['Shining Smite'] });
    s = hit(s);
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Shining Smite', targetId: 'B' }, pad([6, 3], [6, 4]));
    expect(r.events.find((e) => e.type === 'attack_resolved' && e.label === 'Shining Smite')).toMatchObject({ rawDamage: 7, damageType: 'radiant' });
    expect(A(r.state).concentration).toMatchObject({ spell: 'Shining Smite', targetId: 'B' });
    const next = run(r.state, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(r.state, 'Longsword') }, pad([20, 3], [20, 15], [8, 5]));
    expect(next.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ mode: 'advantage' });
  });
  it('Protection from Evil and Good: Fiend/Undead saldırıları dezavantajlı', () => {
    const s = battle(3, {}, { creatureType: 'fiend', attacks: [{ name: 'Claw', bonus: 5, damage: '1d6', damageDice: '1d6', damageType: 'slashing', ranged: false, reachFt: 5 }] as never });
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Protection from Evil and Good', targetId: 'A' });
    const b = advanceTo(run(r.state, { type: 'end_turn', actorId: 'A' }).state, 'B');
    const atk = execute(b, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, { playerId: 'gm', isGm: true }, pad());
    if (!atk.ok) throw new Error(atk.error);
    expect(atk.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ mode: 'disadvantage' });
  });
});

describe('Blessed Warrior (Fighting Style seçeneği)', () => {
  const paladin = (p: Partial<CharacterSheet>) => {
    const c = blankCharacter('p');
    return withSkills({ ...c, classSkills: ['athletics', 'insight'], sheet: { ...c.sheet, classId: 'paladin', level: 2, name: 'Aria', armorName: 'Chain Mail', ...p } });
  };
  it('feat yerine iki Cleric cantrip\'i; CHA ile yapılır; seçenek yoksa ya da fazlası sorun', () => {
    expect(characterProblems(paladin({ advancements: [{ level: 2, featId: 'blessed-warrior' }], spellNames: ['Sacred Flame', 'Guidance'] }))).toEqual([]);
    expect(characterProblems(paladin({ spellNames: ['Sacred Flame'] })).join(' ')).toContain('Sacred Flame bu sınıf ve seviyede seçilemez');
    expect(characterProblems(paladin({ advancements: [{ level: 2, featId: 'blessed-warrior' }], spellNames: ['Sacred Flame', 'Guidance', 'Resistance'] })).join(' ')).toContain('en çok 2');
    const c = combatantFromSheet(sheet(2, { advancements: [{ level: 2, featId: 'blessed-warrior' }], spellNames: ['Sacred Flame'] }), { id: 'a', ownerId: 'p' });
    // CHA 15 (+2) + yetkinlik 2 + 8 = 12.
    expect(c.spellSaveDc).toBe(12);
    expect(c.spellNames).toContain('Sacred Flame');
  });
});

describe('yapay zekâ (basit kurallar)', () => {
  it('saldırmadan önce Sacred Weapon; yakın dövüş isabetinden sonra slotsuz Divine Smite', () => {
    const s = battle(3);
    expect(chooseCommand(s)).toMatchObject({ type: 'use_feature', feature: SW });
    const after = hit(run(s, { type: 'use_feature', actorId: 'A', feature: SW }).state);
    expect(chooseCommand(after)).toMatchObject({ type: 'cast_spell', spellName: 'Divine Smite', targetId: 'B' });
  });
  it('düşmüş dostu Lay On Hands ile kaldırır', () => {
    const s = battle(3, {}, {}, { hp: 0, maxHp: 20, life: 'dying', conditions: ['Unconscious'] });
    expect(chooseCommand(s)).toMatchObject({ type: 'use_feature', feature: LOH, targetId: 'C', amount: 10 });
  });
});

describe('kayıt', () => {
  it('olaylar yeniden uygulanınca aynı durum', () => {
    const s = battle(5, { spellNames: ['Divine Favor'] });
    const a = run(s, { type: 'use_feature', actorId: 'A', feature: SW });
    const b = run(a.state, { type: 'attack', actorId: 'A', targetId: 'B', option: opt(a.state, 'Longsword') }, pad([20, 15], [8, 5]));
    const c = run(b.state, { type: 'cast_spell', actorId: 'A', spellName: 'Divine Smite', targetId: 'B' });
    expect(applyEvents(applyEvents(applyEvents(s, a.events), b.events), c.events)).toEqual(c.state);
  });
});
