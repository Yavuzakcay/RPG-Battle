/**
 * Kuyruk 38: seviye 6–10 altyapısı (SRD 5.2.1). Yeterlilik bonusu, büyü yuvaları (tam, yarı, Warlock Pact), ASI
 * seviyeleri, Extra Attack, HP, XP eşikleri, karşılaşma bütçesi; seviye sınırı (5 / Üst seviye 10); Serüven seviye
 * atlaması sınırı; yolculuk/Serüven kayıt sürümü 2 (1 yüklenir).
 */
import { describe, expect, it } from 'vitest';
import { deriveStats } from './stats';
import { advancementSlots } from './advancement';
import { classKit } from './classFeatures';
import { budgetPerCharacter, encounterBudget } from './budget';
import { LEVEL_CAP, UPPER_LEVEL_CAP, levelCap } from '../app/limits';
import { nextLevelXp } from '../journey/engine';
import { executeSeruven } from '../journey/seruven';
import { partyAt } from '../sim/balance';
import { JOURNEY_VERSION, LOADABLE_JOURNEY_VERSIONS } from '../app/journeySave';
import type { CharacterSheet } from './stats';

const sheet = (classId: string, level: number, extra: Partial<CharacterSheet> = {}): CharacterSheet => ({
  name: 'T', raceId: 'human', classId, level, baseScores: { str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14 },
  armorName: 'Zırhsız', shield: false, itemNames: [], ...extra,
} as CharacterSheet);
const LV = [6, 7, 8, 9, 10];

describe('seviye 6–10 tabloları (SRD 5.2.1)', () => {
  it('yeterlilik bonusu: 6–8 +3, 9–10 +4', () => {
    for (const lv of LV) expect(deriveStats(sheet('fighter', lv)).proficiency, String(lv)).toBe(lv >= 9 ? 4 : 3);
  });
  it('büyü yuvaları: tam (Wizard/Cleric/Druid/Bard/Sorcerer), yarı (Paladin/Ranger), Warlock Pact', () => {
    const full: Record<number, number[]> = { 6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2] };
    const half: Record<number, number[]> = { 6: [4, 2], 7: [4, 3], 8: [4, 3], 9: [4, 3, 2], 10: [4, 3, 2] };
    const trim = (a: number[]) => { const b = [...a]; while (b.length && !b[b.length - 1]) b.pop(); return b; };
    for (const lv of LV) {
      for (const c of ['wizard', 'cleric', 'druid', 'bard', 'sorcerer']) expect(trim(deriveStats(sheet(c, lv)).spellSlots), `${c} ${lv}`).toEqual(full[lv]);
      for (const c of ['paladin', 'ranger']) expect(trim(deriveStats(sheet(c, lv)).spellSlots), `${c} ${lv}`).toEqual(half[lv]);
      // Warlock: Pact Magic 2 yuva; yuva seviyesi 6 → 3, 7–8 → 4, 9–10 → 5.
      const w = trim(deriveStats(sheet('warlock', lv)).spellSlots);
      expect([w.length, w[w.length - 1]], `warlock ${lv}`).toEqual([lv >= 9 ? 5 : lv >= 7 ? 4 : 3, 2]);
    }
  });
  it('ASI seviyeleri 4 ve 8 (Fighter 6, Rogue 10 ek); Extra Attack 5\'ten (Fighter, Paladin, Ranger, Barbarian, Monk)', () => {
    const asi = (c: string) => advancementSlots(c, 10).filter((x) => x.kind === 'asi').map((x) => x.level);
    expect(asi('wizard')).toEqual([4, 8]);
    expect(asi('fighter')).toEqual([4, 6, 8]);
    expect(asi('rogue')).toEqual([4, 8, 10]);
    for (const c of ['fighter', 'paladin', 'ranger', 'barbarian', 'monk']) for (const lv of LV) expect(classKit(c, lv).attacksPerAction, `${c} ${lv}`).toBe(2);
    expect(classKit('wizard', 10).attacksPerAction).toBe(1);
  });
  it('HP: 1. seviyede tam zar + CON, sonra ortalama + CON (SRD sabit değer)', () => {
    // Fighter d10, CON 14 (+2): 10+2 + 9×(6+2) = 84; Wizard d6: 6+2 + 9×(4+2) = 62.
    expect(deriveStats(sheet('fighter', 10)).maxHp).toBe(84);
    expect(deriveStats(sheet('wizard', 10)).maxHp).toBe(62);
  });
  it('XP eşikleri (6→7 … 10→11) ve karşılaşma bütçesi (karakter başına Low/Moderate/High)', () => {
    expect([6, 7, 8, 9, 10].map((l) => nextLevelXp(l))).toEqual([23000, 34000, 48000, 64000, 85000]);
    expect(nextLevelXp(5)).toBe(14000);
    expect(LV.map((l) => [budgetPerCharacter(l, 'low'), budgetPerCharacter(l, 'moderate'), budgetPerCharacter(l, 'high')]))
      .toEqual([[600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100]]);
    expect(encounterBudget([7, 7, 7, 7], 'moderate')).toBe(5200);
  });
});

describe('seviye sınırı ve Üst seviye anahtarı', () => {
  // Kuyruk 19: Üst seviye tavanı 10 → 20 (SRD'nin tamamı; kullanıcı kararı).
  it('sınır 5, Üst seviye açıkken 20', () => {
    expect([LEVEL_CAP, UPPER_LEVEL_CAP, levelCap(false), levelCap(true)]).toEqual([5, 20, 5, 20]);
  });
  it('Serüven: 5. seviyede atlama yalnızca Üst seviye açıkken; 20\'de durur', () => {
    const party = partyAt(5).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh }));
    const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party, toggles: { irkBaslangic: false } });
    if (!r.ok) throw new Error(r.error);
    const rich = { ...r.state, xp: 999999 };
    expect(rich.level).toBe(5);
    expect(executeSeruven(rich, { type: 'level_up' }).ok).toBe(false);
    const up = { ...rich, toggles: { ...rich.toggles, ustSeviye: true } };
    const six = executeSeruven(up, { type: 'level_up' });
    expect(six.ok && six.state.level).toBe(6);
    expect(executeSeruven({ ...up, level: 10 }, { type: 'level_up' }).ok).toBe(true);
    expect(executeSeruven({ ...up, level: 20 }, { type: 'level_up' }).ok).toBe(false);
  });
  it('yolculuk/Serüven kayıt sürümü 2; 1 yüklenmeye devam eder', () => {
    expect(JOURNEY_VERSION).toBe(2);
    expect(LOADABLE_JOURNEY_VERSIONS).toEqual([1, 2]);
  });
});
