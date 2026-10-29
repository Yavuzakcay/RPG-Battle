/**
 * Karakter oluşturma sihirbazı (Görev K1): adımların eksik hesabı, alt sınıfı olmayan sınıfta alt sınıfın eksik
 * sayılmaması, kayıtlı geçersiz alt sınıfın temizlenmesi, büyücü olmayanda Büyüler adımının gizlenmesi, kilitli geçmiş
 * becerisinin sınıftan yeniden seçilememesi.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder, clearInvalidSubclass, wizardSteps } from './Builder';
import { blankCharacter, characterIssues, characterProblems, withSkills, type SavedCharacter } from '../rules/builder';
import { classData } from '../data';
import type { Skill } from '../rules/skills';

const fighter = (patch: Partial<SavedCharacter['sheet']> = {}, skills: { classSkills?: Skill[]; otherSkills?: Skill[] } = {}): SavedCharacter => {
  const c = blankCharacter('k1');
  return { ...c, classSkills: skills.classSkills ?? ['athletics', 'perception'], otherSkills: skills.otherSkills ?? [],
    sheet: { ...c.sheet, name: 'Bor', armorName: 'Chain Mail', ...patch } };
};
const html = (c: SavedCharacter, step: Parameters<typeof Builder>[0]['step']) =>
  renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step={step} />);

describe('sihirbaz adımları ve eksikler', () => {
  it('her sorun bir adıma bağlı; metinler eski doğrulamayla aynı', () => {
    const blank = blankCharacter('x');
    const issues = characterIssues(blank);
    expect(issues.map((x) => x.text)).toEqual(characterProblems(blank));
    expect(issues.find((x) => x.text === 'Ad boş olamaz.')?.step).toBe('identity');
    expect(issues.find((x) => x.text.startsWith('Sınıf becerileri'))?.step).toBe('skills');
    expect(characterIssues(fighter()).length).toBe(0);
    const noSub = characterIssues(fighter({ level: 3 }));
    expect(noSub).toEqual([expect.objectContaining({ step: 'class', text: expect.stringMatching(/Alt sınıf seçilmeli/) })]);
    const pb = characterIssues({ ...fighter(), method: 'pointBuy', sheet: { ...fighter().sheet, baseScores: { str: 15, dex: 15, con: 15, int: 15, wis: 8, cha: 8 } } });
    expect(pb.some((x) => x.step === 'scores')).toBe(true);
    expect(characterIssues(fighter({ armorName: 'Yok' })).some((x) => x.step === 'equipment')).toBe(true);
  });
  it('veride alt sınıfı olmayan sınıfta alt sınıf eksik sayılmaz ve "Yakında" kutusu görünür', () => {
    const saved = classData.subclasses;
    try {
      classData.subclasses = saved.filter((x) => x.class !== 'fighter');
      expect(characterIssues(fighter({ level: 5 })).some((x) => /Alt sınıf/.test(x.text))).toBe(false);
      const m = html(fighter({ level: 5 }), 'class');
      expect(m).toContain('coming-soon');
      expect(m).toContain('Bu sınıfın alt sınıfları henüz oyunda yok');
      expect(m).not.toContain('Seçilmedi (zorunlu)');
    } finally {
      classData.subclasses = saved;
    }
    expect(html(fighter({ level: 5 }), 'class')).toContain('Seçilmedi (zorunlu)');
  });
  it('kayıtlı geçersiz alt sınıf açılırken boşa çevrilir ve bir kerelik not düşülür', () => {
    const bad = fighter({ level: 3, subclassId: 'evoker' });
    const r = clearInvalidSubclass(bad);
    expect(r.cleared).toBe('evoker');
    expect(r.character.sheet.subclassId).toBeUndefined();
    expect(clearInvalidSubclass(fighter({ level: 3, subclassId: 'champion' })).cleared).toBeNull();
    expect(html(bad, 'class')).toContain('Kayıtlı alt sınıf (evoker) bu sınıfta bulunamadı');
  });
  it('büyücü olmayan sınıfta Büyüler adımı yok (8 adım), büyücüde 9 adım', () => {
    expect(wizardSteps(fighter().sheet)).not.toContain('spells');
    expect(wizardSteps(fighter().sheet)).toHaveLength(8);
    expect(wizardSteps(fighter({ classId: 'wizard' }).sheet)).toHaveLength(9);
    expect(html(fighter(), 'identity')).toContain('1 / 8 · Kimlik');
    expect(html(fighter({ classId: 'wizard' }), 'scores')).toContain('4 / 9 · Puanlar');
  });
  it('geçmişten gelen beceri kilitli: sınıf düğmesi yok, tekrar seçilemez; sayaçlar', () => {
    const c = withSkills(fighter({}, { classSkills: ['perception'], otherSkills: ['athletics'] }));
    const m = html(c, 'skills');
    const row = /<li class="skill-row[^"]*"><span class="skill-name">Athletics[\s\S]*?<\/li>/.exec(m)?.[0] ?? '';
    expect(row).toContain('locked');
    expect(row).not.toContain('badge cls');
    expect(m).toContain('Sınıf becerisi 1/2');
    expect(m).toContain('Geçmişten gelen 1/3');
  });
  it('puanlar adımı: altı kutu, "temel + geçmiş" satırı; puan satın almada kalan puan çubuğu', () => {
    const m = html(fighter(), 'scores');
    expect((m.match(/class="score-box"/g) ?? []).length).toBe(6);
    expect(m).toContain('15 temel + 0 geçmiş');
    const pb = html({ ...fighter(), method: 'pointBuy', sheet: { ...fighter().sheet, baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } } }, 'scores');
    expect(pb).toContain('Kalan puan 27 / 27');
  });
  it('ilerleme adımında geliştirici etiketi (kısmen, oyunda henüz yok) metinde değil ipucunda', () => {
    const m = html(fighter({ level: 4 }), 'progress');
    expect(m).not.toMatch(/>[^<]*\((kısmen|oyunda henüz yok|uygulanıyor)\)[^<]*</);
  });
});
