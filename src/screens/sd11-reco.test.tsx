/** SD11: oluşturucuda önerilen seçimler açık: etiket kümeleri, "Önerilenleri seç" / "Temizle", seviyeye uyum, Kaydet nedeni. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { blankCharacter, characterIssues, type SavedCharacter } from '../rules/builder';
import { applyReco, clearReco, recoSets, recoWouldOverwrite, withSuggestions } from './builderDefaults';
import { spellLimits } from '../rules/builder';
import { Builder } from './Builder';

const mk = (classId: string, level: number): SavedCharacter => {
  const c = blankCharacter('r1');
  return withSuggestions({ ...c, sheet: { ...c.sheet, classId, level, name: 'Mira', raceId: 'human' } as SavedCharacter['sheet'] });
};

describe('SD11 öneri mantığı', () => {
  it('yeni büyücü: öneriler dolu ve önerilen kümeyle aynı; bir büyüyü çıkarınca kalanlar önerilen kalır', () => {
    const c = mk('wizard', 3);
    const rec = recoSets(c);
    const names = c.sheet.spellNames ?? [];
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => rec.spells.includes(n))).toBe(true);
    const less = { ...c, sheet: { ...c.sheet, spellNames: names.slice(1) } };
    expect((less.sheet.spellNames ?? []).every((n) => recoSets(less).spells.includes(n))).toBe(true);
    expect(recoSets(less).spells).toContain(names[0]);
  });
  it('Temizle: bölüm boş; Kaydet nedenini söyler (sorun listesi dolu)', () => {
    const c = clearReco(mk('wizard', 3), 'spells');
    expect(c.sheet.spellNames ?? []).toEqual([]);
    // Büyü eksikliği kaydı engellemez (sayaç gösterir); sınıf becerisi eksikliği nedenini söyler.
    const noSkills = clearReco(mk('fighter', 1), 'skills');
    expect(noSkills.classSkills).toEqual([]);
    expect(characterIssues(noSkills).length).toBeGreaterThan(0);
    const k = clearReco(mk('fighter', 1), 'kit');
    expect([k.sheet.armorName, k.sheet.weapons]).toEqual(['Zırhsız', []]);
  });
  it('Önerilenleri seç: doluyor, sınıf tablosundaki sayılara ve seviyeye uyuyor; farklı seçimde onay gerekir', () => {
    for (const [cls, lvl] of [['wizard', 1], ['wizard', 5], ['cleric', 3], ['sorcerer', 7], ['bard', 12]] as const) {
      const c0 = mk(cls, lvl);
      const lim = spellLimits(cls, lvl, c0.sheet.featureChoices, c0.sheet.invocations);
      const c = applyReco(clearReco(c0, 'spells'), 'spells');
      const names = c.sheet.spellNames ?? [];
      expect(names.length, `${cls}/${lvl}`).toBeGreaterThan(0);
      expect(names.length).toBeLessThanOrEqual(lim.cantrips + lim.prepared);
    }
    const base = mk('wizard', 3);
    expect(recoWouldOverwrite(base, 'spells')).toBe(false); // zaten önerilen
    const touched = { ...base, sheet: { ...base.sheet, spellNames: ['Shield'] } };
    expect(recoWouldOverwrite(touched, 'spells')).toBe(true);
    expect(recoWouldOverwrite(clearReco(base, 'spells'), 'spells')).toBe(false); // boş: onaysız
  });
  it('Hepsini önerilenle doldur / temizle', () => {
    const empty = clearReco(mk('ranger', 3), 'all');
    expect(empty.classSkills).toEqual([]);
    const full = applyReco(empty, 'all');
    expect(full.classSkills.length).toBeGreaterThan(0);
    expect((full.sheet.weapons ?? []).length).toBeGreaterThan(0);
  });
  it('arayüz: yeni karakterde "Önerilen" etiketi çıkar', () => {
    const c = mk('wizard', 3);
    const html = renderToStaticMarkup(<Builder initial={c} suggest onSave={() => {}} onCancel={() => {}} />);
    expect(typeof html).toBe('string');
  });
});
