/**
 * Kuyruk AS1b (kural sürümü 71): alt soy buff/debuff mekaniği. Her alt soy için veriden çalışan etki; savaş sürümü < 71'de
 * (eski kayıt/replay) hiçbiri uygulanmaz. Yorumlar (SRD'de yok) DECISIONS.md AS1b kaydında.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, defaultRuleVersion, setDefaultRuleVersion, startBattle } from './create';
import { saveMode } from './durations';
import { passivePerception } from './stealth';
import { fallEffect } from './maprules';
import { replay } from './reduce';
import { moveCostFn } from './movement';
import { isAirborne, swimsByTrait } from './flight';
import { CURRENT_RULES } from './ruleVersion';
import { ALT_SOY_VERSION } from './altSoySurum';
import { GM, P1, mk } from './fixtures';
import { races } from '../data';
import { blankCharacter } from '../rules/builder';
import { deriveStats, type CharacterSheet } from '../rules/stats';
import type { Skill } from '../rules/skills';
import type { SaveCtx } from './altSoySurum';
import { lineageEtki } from '../rules/lineage';
import { carryLoad } from '../rules/carry';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const mid: Rng = () => 0.5;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

const sheet = (patch: Partial<CharacterSheet>): CharacterSheet => ({
  ...blankCharacter('as1b').sheet, name: 'Soy', armorName: 'Chain Mail', weapons: [{ name: 'Longsword' }], ...patch,
});
const hero = (patch: Partial<CharacterSheet>, id = 'A') => combatantFromSheet(sheet(patch), { id, ownerId: 'p1' });
type MapPick = { id: string; variantId?: string };

/** Düz arena: A (karakter, 3,3) ve B (düşman, 4,3); harita ve zemin seçilebilir. */
function arena(a: Combatant, b: Partial<Combatant> = {}, map: MapPick = { id: 'col' }, tile = '.') {
  const claw = { name: 'Claw', bonus: 30, damageDice: '1d8+1', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
  const parts = [a, mk('B', { side: 'enemies', hp: 80, maxHp: 80, attacks: [claw], ...b })];
  const started = startBattle('as1b', 'd-z-zemin', parts, () => 0.5, { map });
  const combatants = { ...started.state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: o(3, 3) };
  combatants.B = { ...(combatants.B as Combatant), pos: o(4, 3) };
  const m = started.state.map as NonNullable<BattleState['map']>;
  const tiles = m.tiles.map((row, r) => (r === 3 ? row.slice(0, 3) + tile + tile + row.slice(5) : row));
  const state: BattleState = { ...started.state, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants, map: { ...m, tiles } };
  const events: BattleEvent[] = [{ type: 'battle_started', state }];
  const run = {
    state, events,
    do(cmd: Command, ctx: CommandContext = P1, rng: Rng = high) {
      const r = ok(execute(run.state, cmd, ctx, rng));
      run.state = r.state; run.events.push(...r.events);
      return r.events;
    },
    c: (id: string) => run.state.combatants[id] as Combatant,
  };
  return run;
}
const fx = (c: Combatant, prefix = 'soy:') => (c.effects ?? []).filter((e) => e.id.startsWith(prefix));

describe('AS1b: sürüm kapısı', () => {
  it('sürüm 71; 70 ve altında oluşan savaşçıda alt soy etkisi yok (türetme ve süren etki)', () => {
    expect(ALT_SOY_VERSION).toBe(71);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(71);
    const p = { raceId: 'human', lineageId: 'outwall', level: 1 } as const;
    const on = hero(p);
    expect(fx(on).length).toBe(1);
    expect(on.modifiers.con).toBeGreaterThan(hero({ raceId: 'human' }).modifiers.con - 1);
    setDefaultRuleVersion(70);
    expect(defaultRuleVersion()).toBe(70);
    const off = hero(p);
    expect(fx(off)).toEqual([]);
    expect(off.skills.survival).toBe(hero({ raceId: 'human' }).skills.survival);
    expect(off.strScore).toBe(hero({ raceId: 'human' }).strScore);
  });
  it('açık sürüm 70 ile kurulan savaş alt soy etkilerini savaş başında söker', () => {
    const a = hero({ raceId: 'elf', lineageId: 'drow' });
    expect(fx(a).length).toBe(1);
    const started = startBattle('as1b', 'd-z-zemin', [a, mk('B', { side: 'enemies' })], () => 0.5, { map: { id: 'col' }, kuralSurumu: 70 });
    expect(fx(started.state.combatants.A as Combatant)).toEqual([]);
    expect((started.state.combatants.A as Combatant).traits ?? []).not.toContain('sunlight-sensitive');
  });
  it('soysuz karakter (eski Human) etkisiz; savaş sürümü 71 ama alt soy yok', () => {
    const h = hero({ raceId: 'human', lineageId: undefined });
    expect(fx(h)).toEqual([]);
    expect(lineageEtki(sheet({ raceId: 'human' }))).toBeUndefined();
  });
});

describe('AS1b: karakter türetmesi (yetenek, hız, kurtarma, beceri, AC, direnç, görüş, taşıma)', () => {
  const D = (patch: Partial<CharacterSheet>, off = false) => deriveStats({ ...sheet({ armorName: 'Zırhsız', baseScores: { str: 12, dex: 12, con: 12, int: 12, wis: 12, cha: 12 }, ...patch }), ...(off ? { soyKapali: true as const } : {}) });
  it('Human kültürleri: yetenek +1 (geçmiş bonusuna ek, tavan 20)', () => {
    const base = D({ raceId: 'human', lineageId: undefined }).scores;
    const t = D({ raceId: 'human', lineageId: 'tenhausser' }).scores;
    expect([t.str - base.str, t.con - base.con]).toEqual([1, 1]);
    expect(D({ raceId: 'human', lineageId: 'khadyrga' }).scores.int - base.int).toBe(1);
    expect(D({ raceId: 'human', lineageId: 'pure-city' }).scores.wis - base.wis).toBe(1);
    const capped = D({ raceId: 'human', lineageId: 'tenhausser', baseScores: { str: 20, dex: 12, con: 12, int: 12, wis: 12, cha: 12 } }).scores;
    expect(capped.str).toBe(20);
  });
  it('Halfling İnce Çeviklik +1 ve hız +5; Kalın Güç +1, Dayanıklılık +1, hız −5, taşıma ×1,5', () => {
    const base = D({ raceId: 'halfling', lineageId: undefined });
    const sl = D({ raceId: 'halfling', lineageId: 'slender' });
    expect([sl.scores.dex - base.scores.dex, sl.speed - base.speed]).toEqual([1, 5]);
    const st = D({ raceId: 'halfling', lineageId: 'sturdy' });
    expect([st.scores.str - base.scores.str, st.scores.con - base.scores.con, st.speed - base.speed]).toEqual([1, 1, -5]);
    const load = (lin?: string) => carryLoad(sheet({ raceId: 'halfling', lineageId: lin, baseScores: { str: 12, dex: 12, con: 12, int: 12, wis: 12, cha: 12 } }), 'tiered');
    expect(load('sturdy').capacity / load(undefined).capacity).toBeCloseTo(1.5 * (13 / 12), 5);
  });
  it('Goliath Stone hız −5; Dwarf Tepe Dayanıklılık kurtarma +1 / Çeviklik −1', () => {
    expect(D({ raceId: 'goliath', lineageId: 'stone' }).speed).toBe(D({ raceId: 'goliath', lineageId: 'hill' }).speed - 5);
    const base = D({ raceId: 'dwarf', lineageId: undefined }).saves;
    const kn = D({ raceId: 'dwarf', lineageId: 'knoll' }).saves;
    expect([kn.con - base.con, kn.dex - base.dex]).toEqual([1, -1]);
  });
  it('beceri: Gnome Yeraltı ve Dwarf Yeraltı Gizlen +2; Tenhausser Diplomasi/Gizlen −1; Sur Dışı Hayatta Kalma ve Algı +2', () => {
    const sk = (raceId: string, lineageId?: string) => D({ raceId, lineageId }).skills;
    const dex = (raceId: string, lineageId?: string) => D({ raceId, lineageId }).modifiers.dex;
    expect((sk('gnome', 'subterranean').stealth ?? dex('gnome', 'subterranean')) - dex('gnome', 'subterranean')).toBe(2);
    expect((sk('dwarf', 'undervault').stealth ?? dex('dwarf', 'undervault')) - dex('dwarf', 'undervault')).toBe(2);
    expect((sk('human', 'tenhausser').stealth ?? 0) - dex('human', 'tenhausser')).toBe(-1);
    const wis = D({ raceId: 'human', lineageId: 'outwall' }).modifiers.wis;
    expect(sk('human', 'outwall').survival).toBe(wis + 2);
    expect(sk('human', 'outwall').perception).toBe(wis + 2);
  });
  it('Saf Kent zırhsız AC −1 (Çeviklik +1 değiştiriciyi değiştirmeyen skorda); zırhlıda etkisiz', () => {
    const p = { raceId: 'human', lineageId: 'pure-city' } as const;
    expect(D({ ...p }).ac).toBe(D({ ...p }, true).ac - 1);
    expect(D({ ...p, armorName: 'Chain Mail' }).ac).toBe(D({ ...p, armorName: 'Chain Mail' }, true).ac);
  });
  it('Dwarf Dağ: ağır zırhın Güç şartı hız cezası yok sayılır (diğer Dwarf alt soyunda −10 ft)', () => {
    const weak = { baseScores: { str: 8, dex: 12, con: 12, int: 12, wis: 12, cha: 12 }, armorName: 'Plate Armor' } as const;
    const crag = D({ raceId: 'dwarf', lineageId: 'crag', ...weak });
    const knoll = D({ raceId: 'dwarf', lineageId: 'knoll', ...weak });
    expect(crag.armorStrengthShort).toBeDefined();
    expect(crag.speed).toBe(knoll.speed + 10);
  });
  it('direnç ve görüş: Orc Buzul soğuk, Bataklık zehir direnci; Gnome Yeraltı karanlık görüş 120', () => {
    const r = (lin: string) => hero({ raceId: 'orc', lineageId: lin }).resistances;
    expect(r('glacier')).toContain('cold');
    expect(r('fen')).toContain('poison');
    expect(r('wildwood')).toEqual([]);
    expect(hero({ raceId: 'gnome', lineageId: 'subterranean' }).darkvision).toBe(120);
    expect(hero({ raceId: 'gnome', lineageId: 'rock-gnome' }).darkvision).toBe(60);
    setDefaultRuleVersion(70);
    expect(hero({ raceId: 'orc', lineageId: 'glacier' }).resistances).toEqual([]);
    expect(hero({ raceId: 'gnome', lineageId: 'subterranean' }).darkvision).toBe(60);
  });
  it('savaşçı değerleri: Human Sur Dışı Güç/Con ve Gizlen savaşçıda (skills, saves)', () => {
    const a = hero({ raceId: 'human', lineageId: 'tenhausser' });
    const b = hero({ raceId: 'human' });
    expect(a.strScore).toBe(b.strScore + 1);
    expect(a.saves.con).toBe(b.saves.con + (a.modifiers.con - b.modifiers.con));
  });
});

const swing = (r: ReturnType<typeof arena>) => r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: r.c('A').weaponOptions[0] as Combatant['weaponOptions'][number] });
const attackMode = (r: ReturnType<typeof arena>) => (swing(r).find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>).mode;
const checkMode = (r: ReturnType<typeof arena>, skill: Skill) => (r.do({ type: 'skill_check', actorId: 'A', skill, dc: 10 }, GM).find((e) => e.type === 'skill_checked') as Extract<BattleEvent, { type: 'skill_checked' }>).mode;

describe('AS1b: kurtarma dezavantajı (hasar türü, durum, yetenek, konsantrasyon)', () => {
  const sm = (c: Combatant, ab: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', ctx?: SaveCtx) => saveMode('normal', c, ab, undefined, ctx);
  const A = (raceId: string, lineageId: string) => hero({ raceId, lineageId });
  it('hasar türüne karşı: Red/Fire soğuk, Silver/Frost/Wood-elf/Forest ateş, Chthonic ışıltı, Infernal soğuk, Orc Buzul ateş, Orman/Wildwood zehir, Bataklık soğuk', () => {
    const cases: Array<[string, string, string]> = [['dragonborn', 'red', 'cold'], ['goliath', 'fire', 'cold'], ['dragonborn', 'silver', 'fire'], ['goliath', 'frost', 'fire'],
      ['elf', 'wood-elf', 'fire'], ['gnome', 'forest-gnome', 'fire'], ['tiefling', 'chthonic', 'radiant'], ['tiefling', 'infernal', 'cold'],
      ['orc', 'glacier', 'fire'], ['orc', 'wildwood', 'poison'], ['orc', 'fen', 'cold']];
    for (const [r, l, dmg] of cases) {
      const c = A(r, l);
      expect(sm(c, 'dex', { damage: dmg }), `${r}/${l} ${dmg}`).toBe('disadvantage');
      expect(sm(c, 'dex', { damage: 'acid' }), `${r}/${l} acid`).toBe('normal');
      expect(sm(c, 'dex'), `${r}/${l} bağlamsız`).toBe('normal');
    }
  });
  it('durum: Gold Frightened, Hill Prone; diğerleri etkilenmez', () => {
    expect(sm(A('dragonborn', 'gold'), 'wis', { against: ['Frightened'] })).toBe('disadvantage');
    expect(sm(A('dragonborn', 'gold'), 'wis', { against: ['Prone'] })).toBe('normal');
    expect(sm(A('goliath', 'hill'), 'str', { against: ['Prone'] })).toBe('disadvantage');
    expect(sm(A('goliath', 'cloud'), 'str', { against: ['Prone'] })).toBe('normal');
  });
  it('yetenek kurtarması: Green Bilgelik, High-elf Dayanıklılık (başka yetenekte normal)', () => {
    expect(sm(A('dragonborn', 'green'), 'wis')).toBe('disadvantage');
    expect(sm(A('dragonborn', 'green'), 'con')).toBe('normal');
    expect(sm(A('elf', 'high-elf'), 'con')).toBe('disadvantage');
    expect(sm(A('elf', 'high-elf'), 'wis')).toBe('normal');
  });
  it('avantaj ve dezavantaj birbirini götürür (Danger Sense gibi avantaj + soy dezavantajı)', () => {
    const c = { ...A('dragonborn', 'green'), saveAdvantage: ['wis' as const] };
    expect(sm(c, 'wis')).toBe('normal');
  });
  it('konsantrasyon: Bronze ve Abyssal etkisinde concDis', () => {
    expect(A('dragonborn', 'bronze').effects?.some((e) => e.concDis)).toBe(true);
    expect(A('tiefling', 'abyssal').effects?.some((e) => e.concDis)).toBe(true);
    expect(A('tiefling', 'infernal').effects?.some((e) => e.concDis)).toBe(false);
  });
  it('savaşta: Fear büyüsü Gold Dragonborn\'a (Frightened) dezavantajlı, Red\'e değil', () => {
    const d20s = (lin: string) => {
      const caster = mk('B', { side: 'enemies', spellNames: ['Fear'], spellSlots: [0, 0, 2, 0, 0, 0, 0, 0, 0], spellSaveDc: 12, spellMod: 3, spellAttack: 5 });
      const r = arena(A('dragonborn', lin), caster, { id: 'orman' });
      r.state = { ...r.state, order: ['B', 'A'], turnIndex: 0, combatants: { ...r.state.combatants, B: { ...r.c('B'), pos: o(1, 3) } } };
      const ev = r.do({ type: 'cast_spell', actorId: 'B', spellName: 'Fear', slotLevel: 3, targetHex: o(4, 3) } as Command, GM);
      return (ev.find((e) => e.type === 'save_resolved' && e.targetId === 'A') as Extract<BattleEvent, { type: 'save_resolved' }>).d20.length;
    };
    expect(d20s('gold')).toBe(2);
    expect(d20s('red')).toBe(1);
  });
  it('savaşta: canavar soğuk nefesi Red\'e dezavantajlı, Silver\'a değil', () => {
    const breath = { name: 'Frost Breath', bonus: 0, damageDice: '2d6', damageType: 'cold', repeat: 1, ranged: true, reachFt: 0, range: [30, 30] as [number, number], text: '', save: { ability: 'con' as const, dc: 10, halfOnSave: true } };
    const modeFor = (lin: string) => {
      const r = arena(A('dragonborn', lin), { attacks: [breath] }, { id: 'orman' });
      r.state = { ...r.state, turnIndex: 1 };
      const ev = r.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM);
      return (ev.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>).d20.length;
    };
    // d20 sayısı: dezavantajlı 2 zar, normal 1 zar (olaydaki `mode` yalnız ortam kaynaklarını gösterir).
    expect(modeFor('red')).toBe(2);
    expect(modeFor('silver')).toBe(1);
  });
});

describe('AS1b: kontrol dezavantajı (beceri, ışık, su, yerleşim)', () => {
  it('beceri: Blue ve Storm Gizlen, Brass Sezgi, Copper İkna, Rock Atletizm; başka beceri normal', () => {
    const cases: Array<[string, string, Skill, Skill]> = [['dragonborn', 'blue', 'stealth', 'athletics'], ['goliath', 'storm', 'stealth', 'athletics'], ['dragonborn', 'brass', 'insight', 'perception'],
      ['dragonborn', 'copper', 'persuasion', 'deception'], ['gnome', 'rock-gnome', 'athletics', 'acrobatics']];
    for (const [r, l, hit, miss] of cases) {
      expect(checkMode(arena(hero({ raceId: r, lineageId: l })), hit), `${r}/${l} ${hit}`).toBe('disadvantage');
      expect(checkMode(arena(hero({ raceId: r, lineageId: l })), miss), `${r}/${l} ${miss}`).toBe('normal');
    }
  });
  it('yetenek kontrolleri: White Zekâ, İnce Halfling Güç (Atletizm), başka yetenek normal', () => {
    expect(checkMode(arena(hero({ raceId: 'dragonborn', lineageId: 'white' })), 'arcana')).toBe('disadvantage');
    expect(checkMode(arena(hero({ raceId: 'dragonborn', lineageId: 'white' })), 'athletics')).toBe('normal');
    expect(checkMode(arena(hero({ raceId: 'halfling', lineageId: 'slender' })), 'athletics')).toBe('disadvantage');
    expect(checkMode(arena(hero({ raceId: 'halfling', lineageId: 'slender' })), 'arcana')).toBe('normal');
  });
  it('ışık: Black ve Gnome Yeraltı parlak ışıkta (gündüz haritası) Algı dezavantajlı; karanlık haritada değil; pasif Algı −5', () => {
    for (const [r, l] of [['dragonborn', 'black'], ['gnome', 'subterranean']] as const) {
      const day = arena(hero({ raceId: r, lineageId: l }), {}, { id: 'col', variantId: 'gunduz' });
      expect(checkMode(day, 'perception'), `${r} gün`).toBe('disadvantage');
      expect(checkMode(day, 'arcana'), `${r} gün arcana`).toBe('normal');
      const night = arena(hero({ raceId: r, lineageId: l }), {}, { id: 'orman', variantId: 'gece' });
      expect(checkMode(night, 'perception'), `${r} gece`).toBe('normal');
      const base = arena(hero({ raceId: 'human' }), {}, { id: 'col', variantId: 'gunduz' });
      const pp = (rr: ReturnType<typeof arena>) => passivePerception(rr.state, rr.c('A'), o(3, 3));
      expect(pp(day) - pp(base) + (day.c('A').skills.perception ?? 0) - (base.c('A').skills.perception ?? 0)).toBeLessThan(0);
    }
  });
  it('su: Dwarf Dağ ıslak zeminde Atletizm dezavantajlı, kuru zeminde değil', () => {
    const wet = arena(hero({ raceId: 'dwarf', lineageId: 'crag' }), {}, { id: 'orman' }, 'n');
    expect(checkMode(wet, 'athletics')).toBe('disadvantage');
    expect(checkMode(arena(hero({ raceId: 'dwarf', lineageId: 'crag' })), 'athletics')).toBe('normal');
  });
  it('yerleşim: Sur Dışı Karizma kontrolleri yerleşim haritasında dezavantajlı, dışında normal', () => {
    const town = arena(hero({ raceId: 'human', lineageId: 'outwall' }), {}, { id: 'kale-onu', variantId: 'gunduz' });
    expect(checkMode(town, 'persuasion')).toBe('disadvantage');
    expect(checkMode(town, 'athletics')).toBe('normal');
    expect(checkMode(arena(hero({ raceId: 'human', lineageId: 'outwall' })), 'persuasion')).toBe('normal');
  });
});

describe('AS1b: harita koşulları (gün ışığı, iç mekân)', () => {
  it('Drow ve Dwarf Yeraltı gün ışığında saldırı dezavantajlı; karanlık haritada değil', () => {
    for (const [r, l] of [['elf', 'drow'], ['dwarf', 'undervault']] as const) {
      expect(attackMode(arena(hero({ raceId: r, lineageId: l }), {}, { id: 'col', variantId: 'gunduz' })), `${r} gün`).toBe('disadvantage');
      // Karanlık haritada gün ışığı cezası yok (karanlık görüşlü soy gecede ayrıca avantajlıdır).
      expect(attackMode(arena(hero({ raceId: r, lineageId: l }), {}, { id: 'orman', variantId: 'gece' })), `${r} gece`).not.toBe('disadvantage');
    }
    expect(attackMode(arena(hero({ raceId: 'elf', lineageId: 'high-elf' }), {}, { id: 'col', variantId: 'gunduz' }))).toBe('normal');
  });
  it('Sur Dışı iç mekânda saldırı −2 ve inisiyatif −2; açık havada değil', () => {
    const bonus = (map: MapPick, lin?: string) => arena(hero({ raceId: 'human', lineageId: lin }), {}, map).c('A').weaponOptions[0]!.attackBonus;
    const inn = { id: 'taverna', variantId: 'ic-mekan' };
    expect(bonus(inn, 'outwall')).toBe(bonus({ id: 'col', variantId: 'gunduz' }, 'outwall') - 2);
    expect(bonus(inn, 'pure-city')).toBe(bonus({ id: 'col', variantId: 'gunduz' }, 'pure-city'));
    const init = (map: MapPick, lin: string) => startBattle('as1b', 'd-z-zemin', [hero({ raceId: 'human', lineageId: lin }), mk('B', { side: 'enemies' })], () => 0.5, { map }).state.combatants.A!.initiative;
    expect(init(inn, 'outwall')).toBe(init({ id: 'col', variantId: 'gunduz' }, 'outwall') - 2);
    expect(init(inn, 'pure-city')).toBe(init({ id: 'col', variantId: 'gunduz' }, 'pure-city'));
  });
});

describe('AS1b: hareket, düşme, ışınlanma, tur başı', () => {
  it('Cloud: ışınlanınca o turun kalan hareketi biter (Hill: biter değil)', () => {
    const cloud = arena(hero({ raceId: 'goliath', lineageId: 'cloud' }));
    cloud.do({ type: 'use_feature', actorId: 'A', feature: 'species:goliath/clouds-jaunt', to: o(8, 3) });
    expect(cloud.c('A').pos).toEqual(o(8, 3));
    expect(cloud.c('A').movementUsed).toBeGreaterThanOrEqual(cloud.c('A').speed / 5);
    expect(replay(cloud.events)).toEqual(cloud.state);
    // Aynı ışınlanma etkisiz soyda hareketi bitirmez: Cloud etkisini söküp dene.
    const plain = arena(hero({ raceId: 'goliath', lineageId: 'cloud' }));
    plain.state = { ...plain.state, combatants: { ...plain.state.combatants, A: { ...plain.c('A'), effects: [] } } };
    plain.do({ type: 'use_feature', actorId: 'A', feature: 'species:goliath/clouds-jaunt', to: o(8, 3) });
    expect(plain.c('A').movementUsed).toBe(0);
  });
  it('Kırık Kanat uyanışı süresince düşme hasarı ×2 (uyanıştan önce ×1); Gece Gözyaşı Karizma kontrolü dezavantajlı', () => {
    const dice = (c: Combatant) => /(\d+)d6/.exec((fallEffect(c, 30, mid).damage?.rolls.length ?? 0) ? '' : '');
    void dice;
    const kirik = arena(hero({ raceId: 'celestial', lineageId: undefined, level: 3, celestialAwakening: 'kirik-kanat' }));
    const rollsBefore = fallEffect(kirik.c('A'), 30, mid).damage?.rolls.length ?? 0;
    kirik.do({ type: 'use_feature', actorId: 'A', feature: 'ev:celestial/awakening' });
    expect(kirik.c('A').effects?.find((e) => e.id === 'ev:celestial/awakening')?.fallMult).toBe(2);
    expect(fallEffect(kirik.c('A'), 30, mid).damage?.rolls.length).toBe(rollsBefore * 2);
    const gece = arena(hero({ raceId: 'celestial', lineageId: undefined, level: 3, celestialAwakening: 'gece-gozyasi' }));
    expect(checkMode(gece, 'persuasion')).toBe('normal');
    gece.do({ type: 'use_feature', actorId: 'A', feature: 'ev:celestial/awakening' });
    expect(checkMode(gece, 'persuasion')).toBe('disadvantage');
    expect(checkMode(gece, 'athletics')).toBe('normal');
  });
  it('Parlayan Ruh uyanışı süresince karanlık haritada Gizlen dezavantajlı, gündüz haritasında değil', () => {
    const mk1 = (map: MapPick) => { const r = arena(hero({ raceId: 'celestial', lineageId: undefined, level: 3, celestialAwakening: 'parlayan-ruh', armorName: 'Zırhsız' }), {}, map); r.do({ type: 'use_feature', actorId: 'A', feature: 'ev:celestial/awakening' }); return r; };
    expect(checkMode(mk1({ id: 'orman', variantId: 'gece' }), 'stealth')).toBe('disadvantage');
    expect(checkMode(mk1({ id: 'col', variantId: 'gunduz' }), 'stealth')).toBe('normal');
  });
  it('sürüm 70\'te uyanış debuff\'ı eklenmez', () => {
    const r = arena(hero({ raceId: 'celestial', lineageId: undefined, level: 3, celestialAwakening: 'kirik-kanat' }));
    r.state = { ...r.state, kuralSurumu: 70 };
    r.do({ type: 'use_feature', actorId: 'A', feature: 'ev:celestial/awakening' });
    expect(r.c('A').effects?.find((e) => e.id === 'ev:celestial/awakening')?.fallMult).toBeUndefined();
  });
  it('Khadyrga: tur başında zorlu arazide hız −5 ft (1 altıgen hareket yanar); düz zeminde değil', () => {
    const turnStartMoves = (tile: string) => {
      const r = arena(hero({ raceId: 'human', lineageId: 'khadyrga' }), {}, { id: 'orman' }, tile);
      r.do({ type: 'end_turn', actorId: 'A' });
      r.do({ type: 'end_turn', actorId: 'B' }, GM);
      expect(r.state.order[r.state.turnIndex]).toBe('A');
      return r.c('A').movementUsed;
    };
    expect(turnStartMoves('g')).toBe(1);
    expect(turnStartMoves('.')).toBe(0);
  });
  it('Orc Orman bitkisel zorlu araziyi (çalılık, Entangle) yok sayar; taş zorlu arazi ve diğer soylar yok saymaz', () => {
    const cost = (raceId: string, lineageId: string, tile: string) => {
      const r = arena(hero({ raceId, lineageId }), {}, { id: 'orman' }, tile);
      return moveCostFn(r.state, r.c('A'))(o(3, 3), o(2, 3));
    };
    expect(cost('orc', 'wildwood', 'g')).toBe(1);
    expect(cost('orc', 'glacier', 'g')).toBe(2);
    expect(cost('orc', 'wildwood', 't')).toBe(2);
    expect(cost('human', 'tenhausser', 'g')).toBe(2);
    // Bitkisel alan (Entangle): zorlu arazi; Orman yok sayar.
    const zoneCost = (lin: string) => {
      const r = arena(hero({ raceId: 'orc', lineageId: lin }), {}, { id: 'orman' }, '.');
      const zone = { id: 'z1', spellId: 'entangle', name: 'Entangle', casterId: 'B', side: 'enemies' as const, dc: 12, slotLevel: 1, hexes: [o(3, 3)] };
      r.state = { ...r.state, map: { ...(r.state.map as NonNullable<BattleState['map']>), zones: [zone as never] } };
      return moveCostFn(r.state, r.c('A'))(o(3, 3), o(2, 3));
    };
    expect(zoneCost('glacier') ?? 99).toBeGreaterThan(zoneCost('wildwood') ?? 0);
    expect(zoneCost('wildwood')).toBe(1);
  });
  it('Bataklık: yüzme etkisi (swim) ve zehir direnci; Orman bitkisel yürür etkisi', () => {
    const fen = hero({ raceId: 'orc', lineageId: 'fen' });
    expect(fen.effects?.some((e) => e.swim)).toBe(true);
    expect(swimsByTrait(fen)).toBe(true);
    expect(swimsByTrait(hero({ raceId: 'orc', lineageId: 'glacier' }))).toBe(false);
    expect(hero({ raceId: 'orc', lineageId: 'wildwood' }).effects?.some((e) => e.plantWalker)).toBe(true);
    expect(hero({ raceId: 'orc', lineageId: 'glacier' }).effects?.some((e) => e.plantWalker)).toBe(false);
  });
});

describe('AS1b: Kanatlı Tiefling Kanat Süzülüşü', () => {
  const KEY = 'alt:tiefling/winged-glide';
  const winged = (armorName: string) => hero({ raceId: 'tiefling', lineageId: 'winged', armorName });
  it('özellik ve kaynak (yeterlilik bonusu kadar); soy direnci yok; diğer Tiefling soyunda özellik yok', () => {
    const c = winged('Leather Armor');
    expect(c.features?.some((f) => f.key === KEY)).toBe(true);
    expect(c.resources['soy:winged-glide']).toBe(2);
    expect(c.resistances).toEqual([]);
    expect(hero({ raceId: 'tiefling', lineageId: 'infernal' }).features?.some((f) => f.key === KEY)).toBeFalsy();
    setDefaultRuleVersion(70);
    expect(winged('Leather Armor').features?.some((f) => f.key === KEY)).toBeFalsy();
  });
  it('hafif zırhla bonus eylemle yarım hızla süzülür (30 ft sınırı, yere değmez), kaynak düşer; replay aynı', () => {
    const r = arena(winged('Leather Armor'));
    r.do({ type: 'use_feature', actorId: 'A', feature: KEY });
    const e = r.c('A').effects?.find((x) => x.fly);
    expect([e?.fly, e?.flyCapFt, e?.hover]).toEqual([r.c('A').speed / 2, 30, true]);
    expect(isAirborne(r.c('A'))).toBe(true);
    expect(r.c('A').economy.bonus).toBe(true);
    expect(r.c('A').resources['soy:winged-glide']).toBe(1);
    expect(replay(r.events)).toEqual(r.state);
  });
  it('orta ve ağır zırhla uçamaz; zırhsız ve hafif zırhla uçar', () => {
    for (const armor of ['Breastplate', 'Hide Armor', 'Chain Mail', 'Plate Armor']) {
      const r = arena(winged(armor));
      const res = execute(r.state, { type: 'use_feature', actorId: 'A', feature: KEY }, P1, high);
      expect(res.ok, armor).toBe(false);
    }
    for (const armor of ['Zırhsız', 'Padded Armor']) {
      const r = arena(winged(armor));
      expect(execute(r.state, { type: 'use_feature', actorId: 'A', feature: KEY }, P1, high).ok, armor).toBe(true);
    }
  });
  it('kullanım yeterlilik bonusu kadar: üçüncü kullanım reddedilir', () => {
    const r = arena(winged('Zırhsız'));
    r.do({ type: 'use_feature', actorId: 'A', feature: KEY });
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), effects: (r.c('A').effects ?? []).filter((x) => !x.fly), economy: { ...r.c('A').economy, bonus: false } } } };
    r.do({ type: 'use_feature', actorId: 'A', feature: KEY });
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), effects: (r.c('A').effects ?? []).filter((x) => !x.fly), economy: { ...r.c('A').economy, bonus: false } } } };
    expect(execute(r.state, { type: 'use_feature', actorId: 'A', feature: KEY }, P1, high).ok).toBe(false);
  });
});

describe('AS1b: Dragonborn nefes ve direnç (mevcut buff doğrulaması)', () => {
  const colors: Record<string, string> = { black: 'acid', blue: 'lightning', brass: 'fire', bronze: 'lightning', copper: 'acid', gold: 'fire', green: 'poison', red: 'fire', silver: 'cold', white: 'cold' };
  it('10 renk: kendi elementinin direnci ve nefes kaynağı çalışır', () => {
    for (const [lin, type] of Object.entries(colors)) {
      const c = hero({ raceId: 'dragonborn', lineageId: lin });
      expect(c.resistances, lin).toContain(type);
      expect(c.resources.breathWeapon, lin).toBe(2);
    }
  });
});
