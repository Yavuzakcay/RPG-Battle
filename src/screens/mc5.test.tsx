/**
 * Görev MC5: oluşturucudan çoklu sınıflı karakter (SRD 5.2.1 s. 24–26). En çok 3 sınıf (K4, kullanıcı kararı 2026-11-26
 * yeniden doğrulandı; tek sabit `MAX_CLASSES`): 3 sınıf kurulabilir, 4. sınıf reddedilir; eski kayıtta 4 sınıf açılır ve
 * yalnız uyarı. Sınıf etiketi, ek sınıf becerisi, sınıf başına büyü, Serüven seviye atlama (K12), Channel Divinity etiketi.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { MAX_CLASSES } from '../app/limits';
import { characterIssues, newCharacter, type SavedCharacter } from '../rules/builder';
import { addClassProblems, syncClassFields } from '../rules/multiclass';
import { deriveStats, finalScores, type CharacterSheet, type ClassEntry, type Scores } from '../rules/stats';
import { combatantFromSheet } from '../battle/create';
import { MulticlassPanel, withClasses } from './builder/Multiclass';
import { wizardSteps } from './Builder';
import { resourceLabel, sheetClassLevel, sheetClassName } from '../ui/classLabel';
import { executeSeruven, levelXp, type SeruvenState } from '../journey/seruven';
import { partyAt } from '../sim/balance';
import { t } from '../i18n';

const scores: Scores = { str: 14, dex: 14, con: 12, int: 14, wis: 14, cha: 14 };
const base = (): CharacterSheet => ({ ...newCharacter('mc5').sheet, backgroundBonuses: {}, baseScores: { ...scores }, advancements: [] });
const mc = (classes: ClassEntry[], extra: Partial<CharacterSheet> = {}): CharacterSheet => syncClassFields({ ...base(), ...extra, classes });
const html = (s: CharacterSheet) => renderToStaticMarkup(createElement(MulticlassPanel, { sheet: s, setSheet: () => undefined }));
const M = () => t().builder.mc;

describe('MC5 sınıf sayısı sınırı (MAX_CLASSES)', () => {
  it('sınır tek sabitte 3', () => expect(MAX_CLASSES).toBe(3));

  it('3 sınıflı karakter kurulabilir; sınır sorunu yok', () => {
    let s = base();
    s = withClasses(s, [{ classId: s.classId, level: s.level }, { classId: 'wizard', level: 1 }]);
    expect(addClassProblems(s, 'cleric', finalScores(s))).toEqual([]);
    s = withClasses(s, [...s.classes!, { classId: 'cleric', level: 1 }]);
    expect(s.classes).toHaveLength(3);
    expect(characterIssues({ ...newCharacter('x'), sheet: s }).some((m) => m.text === t().mcIssues.mcTooMany(MAX_CLASSES, 3))).toBe(false);
  });

  it('4. sınıf reddedilir: kural sorunu ve arayüzde seçici kapalı, açıklama yazılı (TR/EN aynı metin anahtarı)', () => {
    const s = mc([{ classId: 'fighter', level: 1 }, { classId: 'wizard', level: 1 }, { classId: 'cleric', level: 1 }]);
    expect(addClassProblems(s, 'rogue', finalScores(s)).map((p) => p.kind)).toContain('cok');
    const h = html(s);
    expect(h).toContain(M().max(MAX_CLASSES));
    expect(h).toMatch(/<select disabled=""[^>]*aria-describedby="mc-full"/);
  });

  it('eski kayıtta 4 sınıflı karakter açılır, türetilir ve savaşa girer; yalnız uyarı', () => {
    const s = mc([{ classId: 'fighter', level: 1 }, { classId: 'wizard', level: 1 }, { classId: 'cleric', level: 1 }, { classId: 'rogue', level: 1 }]);
    expect(s.classes).toHaveLength(4);
    expect(() => deriveStats(s)).not.toThrow();
    expect(() => combatantFromSheet(s, { id: 'a', ownerId: 'p' })).not.toThrow();
    expect(() => html(s)).not.toThrow();
    const ch: SavedCharacter = { ...newCharacter('x'), sheet: s };
    expect(characterIssues(ch).some((m) => m.text === t().mcIssues.mcTooMany(MAX_CLASSES, 4))).toBe(true);
  });

  it('tek sınıflı karakter değişmez: panel yalnız "Sınıf ekle" seçicisi; sayfada classes yok', () => {
    const s = base();
    const h = html(s);
    expect(h).toContain(M().add);
    expect(h).not.toContain('mc-list');
    expect('classes' in withClasses(s, [{ classId: s.classId, level: s.level }])).toBe(false);
  });

  it('sınıf çıkarılınca tek sınıfa katlanır (eski üç alan, classes silinir)', () => {
    const s = mc([{ classId: 'fighter', level: 3 }, { classId: 'wizard', level: 2 }]);
    const back = withClasses(s, [{ classId: 'fighter', level: 3 }]);
    expect(back.classes).toBeUndefined();
    expect([back.classId, back.level]).toEqual(['fighter', 3]);
  });
});

describe('MC5 oluşturucu ve etiketler', () => {
  it('ön koşulu tutmayan sınıf soluk ve nedenli', () => {
    const s = mc([{ classId: 'fighter', level: 2 }, { classId: 'wizard', level: 1 }], { baseScores: { ...scores, str: 14, int: 13, cha: 8 } });
    expect(html(s)).toMatch(/<option value="bard" disabled="">Bard \([^)]*CHA/);
  });

  it('sınıf etiketi: tek sınıfta "Fighter 5", çoklu sınıfta "Fighter 3 · Wizard 2"', () => {
    expect(sheetClassLevel({ ...base(), classId: 'fighter', level: 5 })).toBe('Fighter 5');
    const s = mc([{ classId: 'fighter', level: 3 }, { classId: 'wizard', level: 2 }]);
    expect(sheetClassName(s)).toBe('Fighter 3 · Wizard 2');
    expect(sheetClassLevel(s)).toBe('Fighter 3 · Wizard 2');
  });

  it('Channel Divinity havuzlarına sınıf etiketi (K6)', () => {
    expect(resourceLabel('channelDivinity@paladin', 'Channel Divinity')).toBe('Channel Divinity (Paladin)');
    expect(resourceLabel('channelDivinity', 'Channel Divinity')).toBe('Channel Divinity');
  });

  it('ek sınıfın ilk seviye becerisi yetkinliğe yazılır (Rogue ek sınıf); ilk sınıfta sayılmaz', () => {
    const s = mc([{ classId: 'fighter', level: 3 }, { classId: 'rogue', level: 1, ekBeceri: 'stealth' }], { skills: [] });
    expect(deriveStats(s).skills.stealth).toBeDefined();
    expect(deriveStats({ ...s, classes: s.classes!.map((e) => ({ ...e, ekBeceri: undefined })) }).skills.stealth).toBeUndefined();
  });

  it('büyü adımı herhangi bir sınıf büyü yapabiliyorsa var (Fighter + Wizard)', () => {
    expect(wizardSteps(mc([{ classId: 'fighter', level: 3 }, { classId: 'wizard', level: 1 }]))).toContain('spells');
    expect(wizardSteps({ ...base(), classId: 'fighter', level: 3 })).not.toContain('spells');
  });
});

describe('MC5 Serüven seviye atlama (K12)', () => {
  const start = (sheet: CharacterSheet): SeruvenState => {
    const party = partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: i === 0 ? sheet : sh }));
    const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, toggles: { irkBaslangic: false }, party });
    if (!r.ok) throw new Error(r.error);
    return { ...r.state, xp: levelXp(r.state.level) ?? 0 };
  };
  const two = mc([{ classId: 'fighter', level: 2 }, { classId: 'wizard', level: 1 }]);

  it('varsayılan ilk sınıf; seçilen mevcut sınıf; tek sınıflılar eskisi gibi', () => {
    const s = start(two);
    const def = executeSeruven(s, { type: 'level_up' });
    if (!def.ok) throw new Error(def.error);
    expect(def.state.party[0]!.sheet.classes).toEqual([{ classId: 'fighter', level: 3 }, { classId: 'wizard', level: 1 }]);
    expect(def.state.party[0]!.sheet.level).toBe(4);
    expect(def.state.party[1]!.sheet.classes).toBeUndefined();
    expect(def.state.party[1]!.sheet.level).toBe(4);
    const pick = executeSeruven(s, { type: 'level_up', classOf: { p1: 'wizard' } });
    if (!pick.ok) throw new Error(pick.error);
    expect(pick.state.party[0]!.sheet.classes).toEqual([{ classId: 'fighter', level: 2 }, { classId: 'wizard', level: 2 }]);
  });

  it('yan (yeni) sınıf kutsal ayna olmadan reddedilir', () => {
    expect(executeSeruven(start(two), { type: 'level_up', classOf: { p1: 'cleric' } }).ok).toBe(false);
  });
});
