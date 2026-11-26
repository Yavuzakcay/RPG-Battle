/**
 * Görev SRD-TAMAMLAMA-2 (savaş dışı; kural ve kayıt sürümü değişmedi): MC-SRD-DENETIM'in iki kısmi satırı.
 * 1. Kısa dinlenmede zar türü seçimi (SRD 5.2.1 s. 25 "track them separately", s. 187): `shortRestStatus(..., byDie)`,
 *    `hitDiceLeftBy`, `defaultDiePlan` (öneri = eski davranış, büyük zardan).
 * 2. Feat seviye ön koşulu çoklu sınıfta toplam karakter seviyesiyle (`sheetFeatCtx`, `prereqLevelAt`); tek sınıf aynen.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { characterIssues, newCharacter, type SavedCharacter } from './builder';
import { syncClassFields } from './multiclass';
import { defaultDiePlan, fullStatus, hitDiceLeftBy, shortRestStatus, type CharacterStatus } from './characterRest';
import { advancementProblems, advancementSlots, casterCtx, featById, featProblem, prereqLevelAt, sheetAdvancementSlots, sheetCasterCtx, sheetFeatCtx } from './advancement';
import { finalScores, type CharacterSheet, type ClassEntry, type Scores } from './stats';
import { loadCharacters } from '../app/storage';
import { RestPanel } from '../screens/Screens';

const scores: Scores = { str: 13, dex: 13, con: 10, int: 13, wis: 10, cha: 10 };
function mc(classes: ClassEntry[], extra: Partial<CharacterSheet> = {}): CharacterSheet {
  const c = newCharacter('st2');
  return syncClassFields({ ...c.sheet, backgroundBonuses: {}, baseScores: scores, armorName: 'Zırhsız', shield: false, weapons: [], offHand: undefined, advancements: [], ...extra, classes });
}
const single = (classId: string, level: number, extra: Partial<CharacterSheet> = {}): CharacterSheet =>
  ({ ...newCharacter('st2s').sheet, classId, level, baseScores: scores, advancements: [], ...extra });
const rng = () => 0.5;
/** Yaralı durum (tam HP'nin yarısı). */
const hurt = (s: CharacterSheet, patch: Partial<CharacterStatus> = {}): CharacterStatus => { const f = fullStatus(s); return { ...f, hp: Math.max(1, Math.floor(f.hp / 2)), ...patch }; };

describe('kısa dinlenmede zar türü seçimi', () => {
  const fw = mc([{ classId: 'fighter', level: 3 }, { classId: 'wizard', level: 2 }]);

  it('yalnız birden çok zar türü olan çoklu sınıfta seçim (tek sınıf ve Fighter/Paladin yok)', () => {
    expect(hitDiceLeftBy(fw, undefined)).toEqual({ 10: 3, 6: 2 });
    expect(hitDiceLeftBy(single('fighter', 5), undefined)).toBeNull();
    expect(hitDiceLeftBy(mc([{ classId: 'fighter', level: 3 }, { classId: 'paladin', level: 2 }], { baseScores: { ...scores, cha: 13 } }), undefined)).toBeNull();
  });

  it('öneri eski davranış: büyük zardan başlar; öneriyle dinlenmek byDie vermemekle aynı', () => {
    expect(defaultDiePlan(fw, undefined, 1)).toEqual({ 10: 1 });
    expect(defaultDiePlan(fw, undefined, 4)).toEqual({ 10: 3, 6: 1 });
    expect(defaultDiePlan(single('wizard', 5), undefined, 2)).toBeNull();
    const st = hurt(fw);
    const plan = defaultDiePlan(fw, st, 2)!;
    expect(shortRestStatus(fw, st, 2, rng, undefined, plan)).toEqual(shortRestStatus(fw, st, 2, rng));
  });

  it('oyuncu küçük zarı seçebilir; kalanına kırpılır; harcanan tür kayda geçer', () => {
    const st = hurt(fw);
    const r = shortRestStatus(fw, st, 0, rng, undefined, { 6: 2 });
    expect(r.rolls).toHaveLength(2);
    expect(r.rolls.every((x) => x >= 1 && x <= 6)).toBe(true);
    expect(r.status.hitDiceSpentBy).toEqual({ 6: 2 });
    expect(r.status.hitDiceSpent).toBe(2);
    expect(hitDiceLeftBy(fw, r.status)).toEqual({ 10: 3, 6: 0 });
    // d6 bitti: 5 istense de 0 atılır; d10'dan 1.
    const r2 = shortRestStatus(fw, r.status, 0, rng, undefined, { 6: 5, 10: 1 });
    expect(r2.rolls).toHaveLength(1);
    expect(r2.status.hitDiceSpentBy).toEqual({ 10: 1, 6: 2 });
  });

  it('tek sınıfta byDie yok sayılır (eski davranış)', () => {
    const s = single('wizard', 5);
    const st = hurt(s);
    expect(shortRestStatus(s, st, 2, rng, undefined, { 12: 3 })).toEqual(shortRestStatus(s, st, 2, rng));
  });

  it('türü kayıtlı olmayan eski harcanmış zarlar büyük zardan düşülür (eski kayıt)', () => {
    const st = hurt(fw, { hitDiceSpent: 2, hitDiceSpentBy: undefined });
    expect(hitDiceLeftBy(fw, st)).toEqual({ 10: 1, 6: 2 });
    expect(defaultDiePlan(fw, st, 2)).toEqual({ 10: 1, 6: 1 });
  });

  it('RestPanel: çoklu zar türünde tür başına sayaç (öneri d10 1), tek sınıfta eski tek sayaç', () => {
    const c = (sheet: CharacterSheet): SavedCharacter => ({ ...newCharacter('x'), sheet, status: hurt(sheet) });
    const multi = renderToStaticMarkup(createElement(RestPanel, { c: c(fw), onUpdate: () => {} }));
    expect(multi).toContain('rest-dice-types');
    expect(multi).toContain('d10 −');
    expect(multi).toContain('d6 +');
    const one = renderToStaticMarkup(createElement(RestPanel, { c: c(single('wizard', 5)), onUpdate: () => {} }));
    expect(one).not.toContain('rest-dice-types');
  });
});

describe('feat seviye ön koşulu karakter seviyesiyle', () => {
  const boon = featById('boon-of-combat-prowess')!;
  // Fighter 16 / Wizard 4: toplam 20; Wizard'ın 4. seviye ASI yuvası (sınıf seviyesi 4).
  const fw = mc([{ classId: 'fighter', level: 16 }, { classId: 'wizard', level: 4 }]);
  const wizSlot = sheetAdvancementSlots(fw).find((x) => x.classId === 'wizard' && x.kind === 'asi')!;

  it('çoklu sınıf: sınanan seviye toplam (20), tek sınıf: yuvanın seviyesi', () => {
    expect(boon.prerequisite).toBe('Level 19+');
    expect(wizSlot.level).toBe(4);
    expect(prereqLevelAt(wizSlot, sheetFeatCtx(fw, finalScores(fw)))).toBe(20);
    const f20 = single('fighter', 20);
    const asi4 = advancementSlots('fighter', 20).find((x) => x.kind === 'asi' && x.level === 4)!;
    expect(prereqLevelAt(asi4, sheetFeatCtx(f20, finalScores(f20)))).toBe(4);
  });

  it('toplam 19+ çoklu sınıfta geç ASI yuvasına Epic Boon; sınıf seviyesiyle (eski bağlam) reddedilir', () => {
    expect(featProblem(boon, wizSlot, sheetFeatCtx(fw, finalScores(fw)))).toBeNull();
    expect(featProblem(boon, wizSlot, { scores: finalScores(fw), ...sheetCasterCtx(fw) })).not.toBeNull();
    // Toplam 18: hâlâ reddedilir.
    const low = mc([{ classId: 'fighter', level: 14 }, { classId: 'wizard', level: 4 }]);
    const slot18 = sheetAdvancementSlots(low).find((x) => x.classId === 'wizard' && x.kind === 'asi')!;
    expect(featProblem(boon, slot18, sheetFeatCtx(low, finalScores(low)))).not.toBeNull();
  });

  it('tek sınıf değişmedi: Fighter 20 ASI yuvasında Epic Boon yok, 19. seviye Epic Boon yuvasında var', () => {
    const f20 = single('fighter', 20);
    const ctx = sheetFeatCtx(f20, finalScores(f20));
    expect(ctx).toEqual({ scores: finalScores(f20), ...casterCtx('fighter', 20) });
    for (const slot of advancementSlots('fighter', 20)) {
      expect(featProblem(boon, slot, ctx) === null, `${slot.kind} ${slot.level}`).toBe(slot.kind === 'epic');
    }
  });

  it('sorun denetimi aynı yardımcıyla: seçili Epic Boon geç ASI yuvasında geçerli, karakter sorunu yok', () => {
    const withBoon = mc([{ classId: 'fighter', level: 16 }, { classId: 'wizard', level: 4 }],
      { advancements: [{ level: 4, featId: 'boon-of-combat-prowess', classId: 'wizard', abilities: { str: 1 } }] });
    expect(advancementProblems(withBoon, sheetFeatCtx(withBoon, finalScores({ ...withBoon, advancements: [] })))).toEqual([]);
    expect(characterIssues({ ...newCharacter('x'), sheet: withBoon }).map((m) => m.text).filter((x) => x.includes('Boon'))).toEqual([]);
  });
});

describe('eski karakter kayıtları', () => {
  beforeEach(() => {
    const m = new Map<string, string>();
    (globalThis as { localStorage?: Storage }).localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); },
      removeItem: (k: string) => { m.delete(k); }, clear: () => m.clear(), key: () => null, length: 0 } as Storage;
  });
  it('sürüm 3 tek sınıflı ve sürüm 4 çoklu sınıflı (türsüz harcanmış zar, sınıfsız seçim) yüklenir ve dinlenir', () => {
    const one = single('wizard', 5);
    const multi = mc([{ classId: 'fighter', level: 16 }, { classId: 'wizard', level: 4 }]);
    const old = [
      { id: 'a', sheet: one, status: hurt(one, { hitDiceSpent: 1 }), surum: 3 },
      { id: 'b', sheet: { ...multi, advancements: [{ level: 4, featId: 'ability-score-improvement', abilities: { str: 2 } }] }, status: hurt(multi, { hitDiceSpent: 3 }), surum: 4 },
    ];
    localStorage.setItem('rpg-battle-characters', JSON.stringify(old));
    const list = loadCharacters();
    expect(list.map((c) => c.id)).toEqual(['a', 'b']);
    const [a, b] = list as [SavedCharacter, SavedCharacter];
    expect(hitDiceLeftBy(a.sheet, a.status)).toBeNull();
    expect(shortRestStatus(a.sheet, a.status, 1, rng).status.hitDiceSpent).toBe(2);
    expect(hitDiceLeftBy(b.sheet, b.status)).toEqual({ 10: 13, 6: 4 });
    expect(shortRestStatus(b.sheet, b.status, 0, rng, undefined, { 6: 1 }).status.hitDiceSpentBy).toEqual({ 10: 3, 6: 1 });
    expect(characterIssues({ ...newCharacter('x'), ...b }).map((m) => m.text).filter((x) => x.includes('Ability Score Improvement'))).toEqual([]);
  });
});
