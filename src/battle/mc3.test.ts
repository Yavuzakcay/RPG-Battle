/**
 * Görev MC3 (kural sürümü 105; SRD 5.2.1 s. 25–26): ortak Spellcasting yuvası, ayrı Pact havuzu, büyünün sınıfı ve sınıf
 * başına büyü DC'si/saldırısı, sınıf başına hazırlama. 104 ve altında çoklu sınıflı sayfa MC öncesi gibi.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { advanceTo, dice, envId, mk, P1, scripted } from './fixtures';
import { combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { execute } from './commands';
import { applyEvents } from './reduce';
import { CURRENT_RULES } from './ruleVersion';
import { MC3_VERSION, mc3On } from './mc3Surum';
import type { BattleState, Combatant, Command } from './types';
import { deriveStats, type CharacterSheet, type ClassEntry, type Scores } from '../rules/stats';
import { fullStatus, longRestStatus, shortRestStatus } from '../rules/characterRest';
import { characterIssues, newCharacter } from '../rules/builder';
import { syncClassFields } from '../rules/multiclass';
import { SAVE_VERSION, LOADABLE_VERSIONS } from '../app/battleSave';

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

const scores10: Scores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
function mc(classes: ClassEntry[], base: Partial<Scores>, extra: Partial<CharacterSheet> = {}): CharacterSheet {
  const c = newCharacter('mc3');
  return syncClassFields({ ...c.sheet, backgroundBonuses: {}, baseScores: { ...scores10, ...base }, armorName: 'Zırhsız', shield: false, weapons: [], offHand: undefined, advancements: [], ...extra, classes });
}

describe('MC3 sabitler', () => {
  it('kural sürümü 105 (104 KARAR104), savaş kaydı 27 (26 KARAR104), 25 ve 26 yüklenir', () => {
    expect(MC3_VERSION).toBe(105);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(105);
    expect(mc3On({ kuralSurumu: 105 })).toBe(true);
    expect(mc3On({ kuralSurumu: 104 })).toBe(false);
    // KATALOG-F0: 28 (`phase_changed`); 27 yüklenmeye devam eder.
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(27);
    expect(LOADABLE_VERSIONS).toContain(27);
    expect(LOADABLE_VERSIONS).toContain(25);
    expect(LOADABLE_VERSIONS).toContain(26);
  });
});

describe('MC3 kural: yuva, ayrı Pact havuzu, sınıf başına DC (SRD 5.2.1 s. 25–26)', () => {
  const ww = mc([{ classId: 'wizard', level: 3 }, { classId: 'warlock', level: 3 }], { int: 16, cha: 12 });
  it('Wizard 3 / Warlock 3: Spellcasting tek sınıftan (Wizard tablosu), Pact ayrı havuz (2. seviye, 2 yuva)', () => {
    const d = deriveStats(ww);
    expect(d.spellSlots).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0]);
    expect(d.pactSlots).toEqual({ level: 2, count: 2 });
    // Sınıf başına: Wizard INT +3, Warlock CHA +1; yeterlilik +3 (toplam 6. seviye).
    expect(d.spellByClass).toEqual({ wizard: { dc: 14, attack: 6, mod: 3 }, warlock: { dc: 12, attack: 4, mod: 1 } });
    expect(d.spellSaveDc).toBe(14);
  });
  it('tek büyücü Warlock (Fighter / Warlock): Pact yuvaları dizide, ayrı havuz yok', () => {
    const d = deriveStats(mc([{ classId: 'fighter', level: 2 }, { classId: 'warlock', level: 3 }], { str: 13, cha: 13 }));
    expect(d.pactSlots).toBeUndefined();
    expect(d.spellByClass).toBeUndefined();
    expect(d.spellSlots[1]).toBe(2);
  });
  it('dinlenme: Pact havuzu kısa ve uzun dinlenmede dolar, Spellcasting yuvaları yalnız uzunda', () => {
    const f = fullStatus(ww);
    expect(f.pactSlots).toBe(2);
    const used = { ...f, pactSlots: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] };
    // Arcane Recovery kapalı (Wizard özelliği; sınıf seviyesi MC4).
    const short = shortRestStatus(ww, used, 0, () => 0.5, { arcaneRecovery: null }).status;
    expect(short.pactSlots).toBe(2);
    expect(short.slots[0]).toBe(0);
    const long = longRestStatus(ww, { ...used, pactSlots: 0 });
    expect(long.pactSlots).toBe(2);
    expect(long.slots[0]).toBe(4);
  });
  it('sınıf başına hazırlama: her sınıfın cantrip sınırı kendi seviyesiyle; büyünün sınıfı listesinde olmalı', () => {
    const c = newCharacter('mc3-h');
    // Wizard 1 (3 cantrip) / Sorcerer 1 (4 cantrip; ama Sorcerer cantrip'i 5).
    const sheet = mc([{ classId: 'wizard', level: 1 }, { classId: 'sorcerer', level: 1 }], { int: 13, cha: 13 }, {
      spellNames: ['Fire Bolt', 'Mage Hand', 'Light', 'Ray of Frost'], spellClass: { 'Fire Bolt': 'wizard', 'Mage Hand': 'wizard', Light: 'wizard', 'Ray of Frost': 'wizard' } });
    const texts = characterIssues({ ...c, sheet }).map((x) => x.text);
    expect(texts.some((t) => t.startsWith('Wizard:') && t.includes('4'))).toBe(true);
    // Cleric cantrip'i Wizard'a bağlı: büyünün sınıfı listesinde değil.
    const wc = mc([{ classId: 'wizard', level: 1 }, { classId: 'cleric', level: 1 }], { int: 13, wis: 13 }, { spellNames: ['Sacred Flame'], spellClass: { 'Sacred Flame': 'wizard' } });
    expect(characterIssues({ ...c, sheet: wc }).map((x) => x.text).some((t) => t.includes('Sacred Flame') && t.includes('Wizard'))).toBe(true);
    // Bağ yoksa listesinde olduğu sınıfa (Cleric) bağlanır, sorun yok.
    const ok = { ...wc, spellClass: undefined };
    expect(characterIssues({ ...c, sheet: ok }).map((x) => x.text).some((t) => t.includes('Sacred Flame'))).toBe(false);
  });
});

describe('MC3 savaşçı kurulumu ve sürüm kapısı', () => {
  const ws = mc([{ classId: 'wizard', level: 1 }, { classId: 'warlock', level: 1 }], { int: 16, cha: 10 }, { spellNames: ['Magic Missile', 'Hex'] });
  it('105: Pact havuzu, sınıf başına değerler ve büyünün sınıfı', () => {
    setDefaultRuleVersion(105);
    const c = combatantFromSheet(ws, { id: 'A', ownerId: 'p1' });
    expect(c.pactSlots).toEqual({ level: 1, max: 1, left: 1 });
    expect(c.spellByClass?.wizard?.dc).toBe(13);
    expect(c.spellByClass?.warlock?.dc).toBe(10);
    expect(c.spellClassOf).toEqual({ 'Magic Missile': 'wizard', Hex: 'warlock' });
    expect(c.spellSlots[0]).toBe(2);
  });
  it('104: MC öncesi gibi (ilk sınıf, toplam seviye; Pact havuzu yok)', () => {
    setDefaultRuleVersion(104);
    const c = combatantFromSheet(ws, { id: 'A', ownerId: 'p1' });
    expect(c.pactSlots).toBeUndefined();
    expect(c.spellByClass).toBeUndefined();
    const { classes: _c, spellClass: _s, ...old } = ws;
    expect(JSON.stringify(c)).toBe(JSON.stringify(combatantFromSheet(old, { id: 'A', ownerId: 'p1' })));
  });
});

describe('MC3 savaş: Pact harcaması ve büyünün sınıfının DC\'si', () => {
  function battle(a: Partial<Combatant>, ver = 105): BattleState {
    const parts = [
      mk('A', { ownerId: 'p1', initiativeBonus: 2, level: 2, spellMod: 3, spellSaveDc: 13, spellAttack: 5, spellNames: ['Magic Missile', 'Burning Hands'],
        spellSlots: [3, 0, 0, 0, 0, 0, 0, 0, 0], hp: 20, ...a }),
      mk('B', { side: 'enemies', hp: 40, maxHp: 40 }),
    ];
    return advanceTo(startBattle('mc3', envId('Düz'), parts, scripted([20, 10], [20, 15]), { kuralSurumu: ver }).state, 'A');
  }
  const cast = (s: BattleState, spellName: string, extra: Partial<Command> = {}, rng = scripted(...dice(4, 1, 1, 1))) =>
    execute(s, { type: 'cast_spell', actorId: 'A', spellName, targetId: 'B', ...extra } as Command, P1, rng);

  it('pact: yuva Pact havuzundan (olayda `pact`), Spellcasting yuvaları aynı; havuz boşsa reddedilir; yeniden oynatma aynı', () => {
    const s = battle({ pactSlots: { level: 1, max: 1, left: 1 } });
    const r = cast(s, 'Magic Missile', { pact: true });
    if (!r.ok) throw new Error(r.error);
    expect(r.events.find((e) => e.type === 'slot_spent')).toMatchObject({ level: 1, remaining: 0, pact: true });
    expect(r.state.combatants.A?.pactSlots?.left).toBe(0);
    expect(r.state.combatants.A?.spellSlots[0]).toBe(3);
    const again = cast({ ...r.state, combatants: { ...r.state.combatants, A: { ...r.state.combatants.A!, economy: s.combatants.A!.economy } } }, 'Magic Missile', { pact: true });
    expect(again.ok).toBe(false);
    // Pact'siz yapım Spellcasting yuvasından.
    const n = cast(s, 'Magic Missile');
    if (!n.ok) throw new Error(n.error);
    expect(n.state.combatants.A?.spellSlots[0]).toBe(2);
    expect(n.state.combatants.A?.pactSlots?.left).toBe(1);
    // Olaylar reducer'dan aynı duruma (replay ilkesi).
    expect(JSON.stringify(applyEvents(s, r.events))).toBe(JSON.stringify(r.state));
  });
  it('büyü kendi sınıfının DC\'siyle: Burning Hands Sorcerer\'a bağlıysa CHA DC, bağsızsa varsayılan (Wizard) DC', () => {
    const by = { wizard: { dc: 13, attack: 5, mod: 3 }, sorcerer: { dc: 10, attack: 2, mod: 0 } };
    const dcOf = (st: BattleState) => {
      const r = execute(st, { type: 'cast_spell', actorId: 'A', spellName: 'Burning Hands', targetId: 'B' } as Command, P1, scripted([20, 1], ...dice(6, 1, 1, 1)));
      if (!r.ok) throw new Error(r.error);
      return r.events.find((e) => e.type === 'save_resolved')?.dc;
    };
    expect(dcOf(battle({ spellByClass: by, spellClassOf: { 'Burning Hands': 'sorcerer' } }))).toBe(10);
    expect(dcOf(battle({ spellByClass: by, spellClassOf: { 'Burning Hands': 'wizard' } }))).toBe(13);
    // 104 savaşında sınıf bağı yok sayılır.
    expect(dcOf(battle({ spellByClass: by, spellClassOf: { 'Burning Hands': 'sorcerer' } }, 104))).toBe(13);
  });
});
