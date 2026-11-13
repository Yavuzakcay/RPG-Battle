/**
 * Kuyruk K48 Adım C: Karadul Çemberi (ev kuralı `karadulCemberi`, kural sürümü 21). Görünürlük ve kadın kısıtı, Wild
 * Shape'in kalkması, skor takası (DC insan CHA'sından), Charmed kırılması, sürpriz vuruşun yalnız dönüşülen turun ilk
 * saldırısı olması, Son Öpücük'te efsanevi ayrımı, kural kapalı / eski sürüm.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import { blankCharacter } from '../rules/builder';
import { gainedFeatures } from '../rules/classFeatures';
import { findSubclass, genderVisible } from '../rules/subclasses';
import { deriveStats, type CharacterSheet } from '../rules/stats';
import { GAZE_KEY, KARADUL_ID, SPIDER_KEY, karadulDc } from './karadul';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const high: Rng = () => 0.99;
const low: Rng = () => 0.01;
/** Örnek: STR 8, CHA 16, WIS 15, CON 8 (insan). */
const sheet = (patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('kd').sheet, name: 'Lilith', raceId: 'human', classId: 'druid', subclassId: KARADUL_ID, gender: 'kadin', level: 6,
  baseScores: { str: 8, dex: 14, con: 8, int: 10, wis: 15, cha: 16 }, armorName: 'Leather Armor', weapons: [{ name: 'Quarterstaff' }], ...patch,
});
const widow = (patch: Partial<CharacterSheet> = {}) => combatantFromSheet(sheet(patch), { id: 'A', ownerId: 'p1' });

function arena(a: Combatant, opts: { on?: boolean; kuralSurumu?: number; b?: Partial<Combatant> } = {}) {
  const parts = [a, mk('C', { ownerId: 'p1', hp: 20, maxHp: 20 }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, monsterId: 'bandit', saves: { str: 0, dex: 0, con: -5, int: 0, wis: -5, cha: 0 }, ...opts.b })];
  const s0 = startBattle('kd', 'd-z-zemin', parts, () => 0.5, {
    map: { id: 'col' }, ...(opts.on !== false ? { houseRules: { karadulCemberi: true } } : {}), ...(opts.kuralSurumu ? { kuralSurumu: opts.kuralSurumu } : {}) }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: { col: 3, row: 3 }, C: { col: 5, row: 3 }, B: { col: 4, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...s0, status: 'active', order: ['A', 'C', 'B'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
  const run = {
    state, events: [{ type: 'battle_started', state } as BattleEvent],
    do(cmd: Command, rng: Rng = high) {
      const r = execute(run.state, cmd, P1, rng);
      if (!r.ok) throw new Error(r.error);
      run.state = r.state; run.events.push(...r.events);
      return r.events;
    },
    try: (cmd: Command) => execute(run.state, cmd, P1, high),
    /** A'nın eylem ekonomisi tazelenir (yeni tur gibi; test kısayolu). */
    fresh: () => { const eco = state.combatants.A?.economy as Combatant['economy']; run.state = { ...run.state, combatants: { ...run.state.combatants, A: { ...(run.state.combatants.A as Combatant), economy: eco } } }; },
    c: (id: string) => run.state.combatants[id] as Combatant,
  };
  return run;
}
const bite = (r: ReturnType<typeof arena>) => ({ type: 'attack', actorId: 'A', targetId: 'B', option: r.c('A').weaponOptions[0] }) as Command;

describe('Karadul: oluşturucu ve sınıf özellikleri', () => {
  // Görev AS2: Ayarlar anahtarı (karadulEnabled) ve kadın kısıtı ayarı (karadulWomenOnly) kalktı; cinsiyet kuralı alt sınıfın
  // kendisinde (`cinsiyet: 'kadin'`). Eski beklenti "anahtar kapalıyken görünmez" yerine: kadına her zaman, erkeğe hiç.
  it('cinsiyet kuralı alt sınıfta: yalnız kadın karaktere görünür (anahtar yok); mevcut seçim hep görünür; İmparator yalnız erkek', () => {
    const sub = findSubclass('druid', KARADUL_ID);
    expect(sub?.ev).toBe(true);
    if (!sub) return;
    expect(sub.cinsiyet).toBe('kadin');
    expect(genderVisible(sub, { gender: 'kadin' })).toBe(true);
    expect(genderVisible(sub, { gender: 'erkek' })).toBe(false);
    expect(genderVisible(sub, {})).toBe(false);
    expect(genderVisible(sub, { gender: 'erkek', subclassId: KARADUL_ID })).toBe(true);
    const imp = findSubclass('fighter', 'imza_imparator');
    expect(imp?.cinsiyet).toBe('erkek');
    if (!imp) return;
    expect(genderVisible(imp, { gender: 'erkek' })).toBe(true);
    expect(genderVisible(imp, { gender: 'kadin' })).toBe(false);
    expect(genderVisible(findSubclass('fighter', 'champion') ?? imp, { gender: 'kadin' })).toBe(true);
  });
  it('Wild Shape kalkar (kaynağıyla), ek beceriler Persuasion ve Deception', () => {
    expect(gainedFeatures('druid', 6, KARADUL_ID).some((f) => f.key === 'druid:wild-shape')).toBe(false);
    expect(gainedFeatures('druid', 6, 'circle-of-the-land').some((f) => f.key === 'druid:wild-shape')).toBe(true);
    const d = deriveStats(sheet());
    expect(d.skills.persuasion).toBe(d.modifiers.cha + d.proficiency);
    expect(d.skills.deception).toBe(d.modifiers.cha + d.proficiency);
    const a = widow();
    expect(a.features?.some((f) => f.effect.kind === 'wildShape')).toBe(false);
    expect(a.resources.wildShape).toBeUndefined();
    expect(a.resources.karadulSpider).toBe(a.proficiency);
  });
});

describe('Karadul: savaş', () => {
  // Görev AS2 (kural sürümü 78): ev kuralı kapısı kalktı; eski beklenti "kural kapalıyken yok" yalnız 77 ve altı kayıt/replay için.
  it('eski sürüm (77) kural kapalı ya da sürüm 20: Karadul özellikleri yok; 78+ kural kapalıyken de var', () => {
    for (const r of [arena(widow(), { on: false, kuralSurumu: 77 }), arena(widow(), { kuralSurumu: 20 })]) {
      expect(r.c('A').features?.some((f) => f.key.startsWith('ev:karadul/'))).toBeFalsy();
    }
    expect(arena(widow(), { on: false }).c('A').features?.some((f) => f.key.startsWith('ev:karadul/'))).toBe(true);
  });
  it('Örümcek Biçimi: skor takası STR↔CHA, CON↔WIS; DC insan CHA\'sından; biçim canı geçici HP; bırakınca döner', () => {
    const r = arena(widow());
    const dc0 = karadulDc(r.c('A'));
    r.do({ type: 'use_feature', actorId: 'A', feature: SPIDER_KEY });
    r.fresh();
    const a = r.c('A');
    expect(a.shape?.spider).toBe(true);
    expect(a.modifiers.str).toBe(3); // CHA 16
    expect(a.modifiers.cha).toBe(-1); // STR 8
    expect(a.modifiers.con).toBe(2); // WIS 15
    expect(a.modifiers.wis).toBe(-1); // CON 8
    expect(a.ac).toBe(14);
    expect(a.tempHp).toBe(26);
    expect(karadulDc(a)).toBe(dc0);
    // Biçimde büyü yok.
    r.do({ type: 'use_feature', actorId: 'A', feature: SPIDER_KEY });
    expect(r.c('A').shape).toBeUndefined();
    expect(r.c('A').modifiers.str).toBe(-1);
    expect(r.c('A').tempHp ?? 0).toBe(0);
    expect(replay(r.events)).toEqual(r.state);
  });
  it('Büyüleyici Bakış: Charmed; büyüleyenin tarafı saldırınca (ıska da) biter', () => {
    const r = arena(widow());
    r.do({ type: 'use_feature', actorId: 'A', feature: GAZE_KEY, targetId: 'B' }, low);
    expect(r.c('B').conditions).toContain('Charmed');
    r.state = { ...r.state, turnIndex: 1 };
    r.events.push({ type: 'battle_started', state: r.state });
    r.do({ type: 'attack', actorId: 'C', targetId: 'B', option: r.c('C').weaponOptions[0] ?? { label: 'x', attackBonus: -20, damage: '1d4', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'x' } }, low);
    expect(r.c('B').conditions).not.toContain('Charmed');
    expect(replay(r.events)).toEqual(r.state);
  });
  it('Tatlı Tuzak yalnızca dönüşülen turun ilk ısırığında (avantaj + ek zar); büyü vuruştan sonra biter', () => {
    const r = arena(widow({ level: 6 }), { b: { hp: 300, maxHp: 300 } });
    r.do({ type: 'use_feature', actorId: 'A', feature: GAZE_KEY, targetId: 'B' }, low);
    r.state = { ...r.state, round: r.state.round + 1 }; // yeni tur
    r.fresh();
    r.events.push({ type: 'battle_started', state: r.state });
    r.do({ type: 'use_feature', actorId: 'A', feature: SPIDER_KEY });
    const ev = r.do(bite(r)).find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(ev.mode).toBe('advantage');
    expect(ev.extra?.some((x) => x.label === 'Tatlı Tuzak')).toBe(true);
    expect(r.c('B').conditions).not.toContain('Charmed');
    // Aynı turda ikinci ısırık (yeniden büyülenmiş olsa bile) tuzak değildir.
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, action: false, attacksLeft: 0, bonus: false } } } };
    r.do({ type: 'use_feature', actorId: 'A', feature: GAZE_KEY, targetId: 'B' }, low);
    const ev2 = r.do(bite(r)).find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(ev2.extra?.some((x) => x.label === 'Tatlı Tuzak')).toBeFalsy();
  });
  it('Son Öpücük (14): otomatik kritik; efsanevi olmayan zayıf hedef ölür, efsanevi ölmez', () => {
    const kill = (b: Partial<Combatant>) => {
      const r = arena(widow({ level: 14 }), { b: { hp: 30, maxHp: 30, ...b } });
      r.do({ type: 'use_feature', actorId: 'A', feature: GAZE_KEY, targetId: 'B' }, low);
      r.state = { ...r.state, round: r.state.round + 1 };
      r.fresh();
      r.do({ type: 'use_feature', actorId: 'A', feature: SPIDER_KEY });
      const ev = r.do(bite(r), () => 0.5).find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
      return { r, ev };
    };
    const a = kill({ hp: 200, maxHp: 200 });
    expect(a.ev.critical).toBe(true);
    expect(a.r.c('A').resources.karadulKiss).toBe(0);
    const weak = kill({ hp: 150, maxHp: 150 });
    expect(weak.ev.extra?.some((x) => x.label === 'Son Öpücük (ölüm)') || weak.r.c('B').hp <= 0).toBe(true);
    const boss = kill({ hp: 150, maxHp: 150, legendaryLeft: 3 });
    expect(boss.ev.extra?.some((x) => x.label === 'Son Öpücük (ölüm)')).toBeFalsy();
    expect(boss.r.c('B').conditions).toContain('Stunned');
  });
});
