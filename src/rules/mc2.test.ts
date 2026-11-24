/**
 * Görev MC2: çoklu sınıf türetmesi (SRD 5.2.1 s. 24–26).
 * 1. "Eski = yeni": tek sınıflı karakterlerin türetme, dinlenme, yuva ve oluşturucu sonuçları MC2 öncesi commit'in
 *    (`cdc8c2a0`) sonuçlarıyla aynı (362 durum, `fixtures/mc2-eski-yeni.json`; yardımcı `fixtures/mc2EskiYeni.ts`).
 * 2. Yeni sarmalayıcılar tek sınıfta eski işlevlerle aynı.
 * 3. SRD örnekleri ve kullanıcı kararları (K7 hız toplanır, K8 en yüksek AC).
 */
import { describe, expect, it } from 'vitest';
import golden from './fixtures/mc2-eski-yeni.json';
import { mc2Hashes } from './fixtures/mc2EskiYeni';
import { partyAt, PARTY_KINDS } from '../sim/balance';
import { weapons } from '../data';
import { armorProficient, deriveStats, sheetArmorProficient, sheetSpellcasting, spellSlotsFor, type CharacterSheet, type ClassEntry, type Scores } from './stats';
import { advancementProblems, advancementSlots, casterCtx, sheetAdvancementSlots, sheetCasterCtx } from './advancement';
import { sheetWeaponProficient, weaponProficient } from './mastery';
import { fullStatus, hitDicePool, isRested, longRestStatus, shortRestStatus } from './characterRest';
import { characterIssues, classScoped, newCharacter } from './builder';
import { syncClassFields } from './multiclass';

const singles = (): CharacterSheet[] => Object.keys(PARTY_KINDS).flatMap((k) => [1, 3, 5, 11, 20].flatMap((lv) => { try { return partyAt(lv, k); } catch { return []; } }));
const scores10: Scores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
/** Çoklu sınıflı sayfa (yeni karakter tabanı, zırhsız; skorlar verilen). */
function mc(classes: ClassEntry[], base: Partial<Scores> = {}, extra: Partial<CharacterSheet> = {}): CharacterSheet {
  const c = newCharacter('mc2');
  return syncClassFields({ ...c.sheet, backgroundBonuses: {}, baseScores: { ...scores10, ...base }, armorName: 'Zırhsız', shield: false, weapons: [], offHand: undefined, advancements: [], ...extra, classes });
}
const w = (name: string) => weapons.find((x) => x.name === name)!;
const rng = () => 0.5;

describe('MC2 eski = yeni (tek sınıf)', () => {
  it('362 tek sınıflı durumun sonucu MC2 öncesiyle aynı', () => {
    const now = mc2Hashes();
    expect(Object.keys(now).length).toBe(Object.keys(golden).length);
    const diff = Object.keys(golden).filter((k) => (golden as Record<string, string>)[k] !== now[k]);
    expect(diff).toEqual([]);
  });
  it('sarmalayıcılar tek sınıfta eski işlevlerle aynı', () => {
    for (const s of singles()) {
      expect(sheetAdvancementSlots(s), s.name).toEqual(advancementSlots(s.classId, s.level, s.subclassId));
      expect(sheetCasterCtx(s), s.name).toEqual(casterCtx(s.classId, s.level, s.subclassId));
      expect(sheetSpellcasting(s).slots, s.name).toEqual(spellSlotsFor(s.classId, s.level));
      expect(hitDicePool(s)).toBeNull();
      for (const t of ['none', 'light', 'medium', 'heavy', 'shield'] as const) expect(sheetArmorProficient(s, t), `${s.name} ${t}`).toBe(armorProficient(s.classId, t, s.featureChoices, s));
      for (const x of weapons) expect(sheetWeaponProficient(s, x), `${s.name} ${x.name}`).toBe(weaponProficient(s.classId, x, s.featureChoices, s));
    }
  });
});

describe('MC2 SRD 5.2.1 çoklu sınıf türetmesi', () => {
  it('yeterlilik bonusu toplam seviyeden: Fighter 3 / Rogue 2 → +3 (s. 25 örneği)', () => {
    expect(deriveStats(mc([{ classId: 'fighter', level: 3 }, { classId: 'rogue', level: 2 }], { str: 13, dex: 13 })).proficiency).toBe(3);
  });
  it('can: ilk sınıfın 1. seviyesi tam, sonrası her sınıfın "1. seviye sonrası" değeri (s. 25)', () => {
    // CON 10: Fighter 1 = 10, Fighter 2–3 = 2 × 6, Wizard 1–2 = 2 × 4 → 30.
    expect(deriveStats(mc([{ classId: 'fighter', level: 3 }, { classId: 'wizard', level: 2 }], { str: 13, int: 13 })).maxHp).toBe(30);
    // Sıra önemli: Wizard ilk sınıfsa 6 + 4 + 3 × 6 = 28.
    expect(deriveStats(mc([{ classId: 'wizard', level: 2 }, { classId: 'fighter', level: 3 }], { str: 13, int: 13 })).maxHp).toBe(28);
  });
  it('kurtarma yetkinliği yalnız ilk sınıftan (ek sınıf kutularında kurtarma yok)', () => {
    const d = deriveStats(mc([{ classId: 'fighter', level: 3 }, { classId: 'wizard', level: 2 }], { str: 13, int: 13 }));
    expect([...d.saveProficiencies].sort()).toEqual(['con', 'str']);
  });
  it('can zarı havuzu: aynı türler birleşir, farklılar ayrı (s. 25 örnekleri)', () => {
    expect(hitDicePool(mc([{ classId: 'fighter', level: 5 }, { classId: 'paladin', level: 5 }], { str: 13, cha: 13 }))).toEqual({ 10: 10 });
    expect(hitDicePool(mc([{ classId: 'cleric', level: 5 }, { classId: 'paladin', level: 5 }], { str: 13, wis: 13, cha: 13 }))).toEqual({ 8: 5, 10: 5 });
  });
  it('kısa dinlenme büyük zardan başlar, türü izler; uzun dinlenme hepsini geri verir', () => {
    const s = mc([{ classId: 'wizard', level: 2 }, { classId: 'fighter', level: 1 }], { str: 13, int: 13 });
    const f = fullStatus(s);
    const r1 = shortRestStatus(s, { ...f, hp: 1 }, 2, rng);
    expect(r1.status.hitDiceSpentBy).toEqual({ 10: 1, 6: 1 });
    expect(r1.status.hitDiceSpent).toBe(2);
    expect(r1.rolls.length).toBe(2);
    const r2 = shortRestStatus(s, r1.status, 5, rng);
    expect(r2.status.hitDiceSpentBy).toEqual({ 10: 1, 6: 2 });
    const long = longRestStatus(s, r2.status);
    expect(long.hitDiceSpent).toBe(0);
    expect(long.hitDiceSpentBy).toBeUndefined();
    expect(isRested(s, long)).toBe(true);
  });
  it('zırhsız AC: aynı anda yalnız biri, en yüksek otomatik (s. 25, K8)', () => {
    // Barbarian CON +3, Monk WIS +1: Barbarian'ınki seçilir (sıra fark etmez).
    const a = deriveStats(mc([{ classId: 'monk', level: 1 }, { classId: 'barbarian', level: 1 }], { str: 13, dex: 14, con: 16, wis: 13 }));
    expect(a.ac).toBe(10 + 2 + 3);
    const b = deriveStats(mc([{ classId: 'barbarian', level: 1 }, { classId: 'monk', level: 1 }], { str: 13, dex: 14, con: 12, wis: 18 }));
    expect(b.ac).toBe(10 + 2 + 4);
  });
  it('hız bonusları toplanır: Barbarian 5 Fast Movement + Monk 2 Unarmored Movement (K7)', () => {
    const base = deriveStats(mc([{ classId: 'barbarian', level: 1 }, { classId: 'monk', level: 1 }], { str: 13, dex: 13, wis: 13 })).speed;
    const s = deriveStats(mc([{ classId: 'barbarian', level: 5 }, { classId: 'monk', level: 2 }], { str: 13, dex: 13, wis: 13 })).speed;
    expect(s - base).toBe(20);
  });
  it('ek sınıf eğitimi kutudakiler + o sınıfın 1. seviye özellikleri: Wizard + Fighter kalkan/Martial; Wizard + Druid Medium yalnız Warden; Wizard + Rogue Rapier yok', () => {
    const wf = mc([{ classId: 'wizard', level: 1 }, { classId: 'fighter', level: 1 }], { str: 13, int: 13 });
    expect(sheetArmorProficient(wf, 'shield')).toBe(true);
    expect(sheetArmorProficient(wf, 'heavy')).toBe(false);
    expect(sheetWeaponProficient(wf, w('Longsword'))).toBe(true);
    // Druid kutusu yalnız Light + Shield; ama "Druid's level 1 features" Primal Order'ı da verir: Warden Medium zırh getirir.
    const wd = mc([{ classId: 'wizard', level: 1 }, { classId: 'druid', level: 1 }], { int: 13, wis: 13 }, { featureChoices: { 'druid:primal-order': 'magician' } });
    expect(sheetArmorProficient(wd, 'light')).toBe(true);
    expect(sheetArmorProficient(wd, 'medium')).toBe(false);
    expect(sheetArmorProficient({ ...wd, featureChoices: { 'druid:primal-order': 'warden' } }, 'medium')).toBe(true);
    const wr = mc([{ classId: 'wizard', level: 1 }, { classId: 'rogue', level: 1 }], { dex: 13, int: 13 });
    expect(sheetWeaponProficient(wr, w('Rapier'))).toBe(false);
    // İlk sınıf Rogue'sa Rogue'un kendi yetkinliği (Finesse Martial) gelir.
    const rw = mc([{ classId: 'rogue', level: 1 }, { classId: 'wizard', level: 1 }], { dex: 13, int: 13 });
    expect(sheetWeaponProficient(rw, w('Rapier'))).toBe(true);
    // Kalkan AC'ye eğitimle girer.
    expect(deriveStats({ ...wf, shield: true }).ac).toBe(deriveStats(wf).ac + 2);
  });
  it('büyü slotları: Ranger 4 / Sorcerer 3 → 5. seviye tablosu (s. 25–26 örneği); tek Spellcasting sınıfı kendi tablosu; tek büyücü Warlock Pact', () => {
    const rs = sheetSpellcasting(mc([{ classId: 'ranger', level: 4 }, { classId: 'sorcerer', level: 3 }], { dex: 13, wis: 13, cha: 13 }));
    expect(rs.slots).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
    const ww = sheetSpellcasting(mc([{ classId: 'wizard', level: 3 }, { classId: 'warlock', level: 2 }], { int: 13, cha: 13 }));
    expect(ww).toEqual({ slots: spellSlotsFor('wizard', 3), castClass: 'wizard' });
    const fw = sheetSpellcasting(mc([{ classId: 'fighter', level: 2 }, { classId: 'warlock', level: 3 }], { str: 13, cha: 13 }));
    expect(fw).toEqual({ slots: spellSlotsFor('warlock', 3), castClass: 'warlock' });
    expect(deriveStats(mc([{ classId: 'fighter', level: 2 }, { classId: 'wizard', level: 1 }], { str: 13, int: 16 })).spellSaveDc).toBe(8 + 2 + 3);
  });
  it('seviye yuvaları sınıf başına; iki sınıfın 4. seviye ASI\'si ayrı; aynı Fighting Style iki kez alınamaz', () => {
    const fw = mc([{ classId: 'fighter', level: 4 }, { classId: 'wizard', level: 4 }], { str: 13, int: 13 });
    const asi = sheetAdvancementSlots(fw).filter((x) => x.kind === 'asi');
    expect(asi.map((x) => [x.classId, x.level])).toEqual([['fighter', 4], ['wizard', 4]]);
    const ctx = { scores: scores10, ...sheetCasterCtx(fw) };
    const two = { ...fw, advancements: [{ level: 4, featId: 'ability-score-improvement', classId: 'fighter' }, { level: 4, featId: 'ability-score-improvement', classId: 'wizard' }] };
    expect(advancementProblems(two, ctx)).toEqual([]);
    const fp = mc([{ classId: 'fighter', level: 1 }, { classId: 'paladin', level: 2 }], { str: 13, cha: 13 });
    const dup = { ...fp, advancements: [{ level: 1, featId: 'defense', classId: 'fighter' }, { level: 2, featId: 'defense', classId: 'paladin' }] };
    expect(advancementProblems(dup, { scores: scores10, ...sheetCasterCtx(fp) }).length).toBe(1);
    const ok = { ...fp, advancements: [{ level: 1, featId: 'defense', classId: 'fighter' }, { level: 2, featId: 'archery', classId: 'paladin' }] };
    expect(advancementProblems(ok, { scores: scores10, ...sheetCasterCtx(fp) })).toEqual([]);
  });
  it('oluşturucu: ön koşul, sınıf başına alt sınıf ve ikinci sınıfın seçimleri korunur', () => {
    const c = newCharacter('mc2-k');
    const sheet = mc([{ classId: 'fighter', level: 3, subclassId: c.sheet.subclassId }, { classId: 'rogue', level: 3 }], { str: 13, dex: 12 });
    const texts = characterIssues({ ...c, sheet }).map((x) => x.text);
    expect(texts.some((t) => t.includes('Çoklu sınıf ön koşulu') && t.includes('Rogue') && t.includes('DEX'))).toBe(true);
    expect(texts.some((t) => t.includes('Rogue için alt sınıf seçilmeli'))).toBe(true);
    const scoped = classScoped({ ...sheet, featureChoices: { 'rogue:x': 'a', 'cleric:y': 'b' } });
    expect(scoped.featureChoices).toEqual({ 'rogue:x': 'a' });
  });
});
