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
    expect(issues.find((x) => x.text === 'Ad boş olamaz.')?.step).toBe('character');
    expect(issues.find((x) => x.text.startsWith('Sınıf becerileri'))?.step).toBe('skills');
    expect(characterIssues(fighter()).length).toBe(0);
    const noSub = characterIssues(fighter({ level: 3 }));
    expect(noSub).toEqual([expect.objectContaining({ step: 'character', text: expect.stringMatching(/Alt sınıf seçilmeli/) })]);
    const pb = characterIssues({ ...fighter(), method: 'pointBuy', sheet: { ...fighter().sheet, baseScores: { str: 15, dex: 15, con: 15, int: 15, wis: 8, cha: 8 } } });
    expect(pb.some((x) => x.step === 'scores')).toBe(true);
    expect(characterIssues(fighter({ armorName: 'Yok' })).some((x) => x.step === 'equipment')).toBe(true);
  });
  it('veride alt sınıfı olmayan sınıfta alt sınıf eksik sayılmaz ve "Yakında" kutusu görünür', () => {
    const saved = classData.subclasses;
    try {
      classData.subclasses = saved.filter((x) => x.class !== 'fighter');
      expect(characterIssues(fighter({ level: 5 })).some((x) => /Alt sınıf/.test(x.text))).toBe(false);
      const m = html(fighter({ level: 5 }), 'character');
      expect(m).toContain('coming-soon');
      expect(m).toContain('Bu sınıfın alt sınıfları henüz oyunda yok');
      expect(m).not.toContain('Seçilmedi (zorunlu)');
    } finally {
      classData.subclasses = saved;
    }
    expect(html(fighter({ level: 5 }), 'character')).toContain('Seçilmedi (zorunlu)');
  });
  it('kayıtlı geçersiz alt sınıf açılırken boşa çevrilir ve bir kerelik not düşülür', () => {
    const bad = fighter({ level: 3, subclassId: 'evoker' });
    const r = clearInvalidSubclass(bad);
    expect(r.cleared).toBe('evoker');
    expect(r.character.sheet.subclassId).toBeUndefined();
    expect(clearInvalidSubclass(fighter({ level: 3, subclassId: 'champion' })).cleared).toBeNull();
    expect(html(bad, 'character')).toContain('Kayıtlı alt sınıf (evoker) bu sınıfta bulunamadı');
  });
  it('büyücü olmayan sınıfta Büyüler adımı yok (6 adım), büyücüde 7 adım (Görev K3: kimlik + tür + sınıf tek adım)', () => {
    expect(wizardSteps(fighter().sheet)).not.toContain('spells');
    expect(wizardSteps(fighter().sheet)).toHaveLength(6);
    expect(wizardSteps(fighter({ classId: 'wizard' }).sheet)).toHaveLength(7);
    expect(wizardSteps(fighter().sheet)[0]).toBe('character');
    expect(html(fighter(), 'character')).toContain('1 / 6 · Karakter');
    expect(html(fighter({ classId: 'wizard' }), 'scores')).toContain('2 / 7 · Puanlar');
  });
  it('geçmişten gelen beceri kilitli: sınıf düğmesi yok, tekrar seçilemez; sayaçlar', () => {
    const c = withSkills(fighter({}, { classSkills: ['perception'], otherSkills: ['athletics'] }));
    const m = html(c, 'skills');
    const row = /<li class="skill-row[^"]*"><span class="skill-name">Atletizm[\s\S]*?<\/li>/.exec(m)?.[0] ?? '';
    expect(row).toContain('locked');
    expect(row).not.toContain('badge cls');
    expect(m).toContain('Sınıf becerisi 1/2');
    expect(m).toContain('Geçmişten gelen 1/3');
  });
  it('puanlar adımı: altı kutu, "temel + geçmiş" satırı; puan satın almada kalan puan çubuğu', () => {
    const m = html(fighter(), 'scores');
    expect((m.match(/class="score-box[ "]/g) ?? []).length).toBe(6);
    expect(m).toContain('15 temel + 0 geçmiş');
    const pb = html({ ...fighter(), method: 'pointBuy', sheet: { ...fighter().sheet, baseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 } } }, 'scores');
    expect(pb).toContain('Kalan puan 27 / 27');
  });
  it('ilerleme adımında geliştirici etiketi (kısmen, oyunda henüz yok) metinde değil ipucunda', () => {
    const m = html(fighter({ level: 4 }), 'progress');
    expect(m).not.toMatch(/>[^<]*\((kısmen|oyunda henüz yok|uygulanıyor)\)[^<]*</);
  });
  it('Görev K3: ilk adım tek "Karakter" adımı; kimlik, tür, soy ve sınıf sorunları bu adıma bağlı', () => {
    const elf = fighter({ raceId: 'elf', lineageId: undefined, name: '' });
    const issues = characterIssues(elf);
    expect(issues.filter((x) => x.step === 'character').map((x) => x.text)).toEqual(['Ad boş olamaz.', 'Elf için soy seçilmeli.']);
    expect(issues.map((x) => x.text)).toEqual(characterProblems(elf));
    const m = html(fighter(), 'character');
    for (const h of ['Kimlik', 'Tür', 'Sınıf']) expect(m).toContain(`<h3>${h}</h3>`);
    expect(m).toContain('Yetenek puanı bonusu türden değil, geçmişten gelir.');
  });
  it('Görev K3: jeton önizlemesi tür, sınıf ve görünüm değişince değişir', () => {
    const src = (p: Partial<SavedCharacter['sheet']>) => /class="token-preview wiz-preview-side"[\s\S]*?characters\/([a-z-]+\.webp)/.exec(html(fighter(p), 'character'))?.[1];
    expect(src({})).toBe('human-male-fighter.webp');
    expect(src({ raceId: 'elf', lineageId: 'drow' })).toBe('elf-male-fighter.webp');
    expect(src({ classId: 'wizard' })).toBe('human-male-wizard.webp');
    expect(src({ gender: 'kadin' })).toBe('human-female-fighter.webp');
    expect(html(fighter(), 'character')).toContain('wiz-preview-mobile');
  });
  it('Görev K3: soy kartları özetiyle; seçilen Elf/Gnome/Goliath soyu özette görünür', () => {
    const m = html(fighter({ raceId: 'elf', lineageId: 'drow' }), 'character');
    expect(m).toContain('lineage-card');
    expect(m).toContain('Karanlık görüş 120 ft · Dancing Lights · Faerie Fire (3. sv) · Darkness (5. sv)');
    expect((m.match(/lineage-card/g) ?? []).length).toBe(3);
    for (const [raceId, lineageId, name] of [['elf', 'wood-elf', 'Wood Elf'], ['gnome', 'rock-gnome', 'Rock Gnome'], ['goliath', 'storm', "Storm's Thunder"]] as const) {
      const sum = html(fighter({ raceId, lineageId }), 'summary');
      expect(sum, lineageId).toContain(`Soy: ${name.replace("'", '&#x27;')} — `);
    }
    // Dragonborn özeti: "Green: Poison nefesi + Poison direnci".
    expect(html(fighter({ raceId: 'dragonborn', lineageId: 'green' }), 'summary')).toContain('Green — Poison nefesi + Poison direnci');
    // Oyunda olmayan soy özelliği yalnızca ⓘ ipucunda; geliştirici etiketi metinde yok.
    const rock = html(fighter({ raceId: 'gnome', lineageId: 'rock-gnome' }), 'character');
    expect(rock).toContain('Rock Gnome: Mekanik aletler');
    expect(rock).toMatch(/class="info-tip" title="[^"]*henüz oyunda yok/);
  });
});
