/**
 * Görev K17: sınıfa bağlı seçimler sınıf değişince. Başka sınıfa ait seçimler sessizce yok sayılır (uyarı yok, kayda
 * yazılmaz) ve taslakta saklanır; eski sınıfa dönünce uyanları geri gelir. Aynı sınıfta fazla seçim ve seviye
 * düşürme uyarılı ve kayıt engelli kalır (K6); zorunlu seçim eksikse uyarı kalır.
 */
import { describe, expect, it } from 'vitest';
import { blankCharacter, characterIssues, classScoped, savableCharacter, suggestedScores, switchClass, type SavedCharacter } from './builder';

const char = (classId: string, level: number, patch: Partial<SavedCharacter['sheet']> = {}, classSkills: SavedCharacter['classSkills'] = []): SavedCharacter => {
  const c = blankCharacter('k17');
  return { ...c, classSkills, sheet: { ...c.sheet, name: 'Mira', classId, level, armorName: 'Zırhsız', baseScores: suggestedScores(classId), ...patch } };
};
const texts = (c: SavedCharacter) => characterIssues(c).map((x) => x.text);
const INV = ['agonizing-blast:Eldritch Blast', 'armor-of-shadows', 'eldritch-mind'];

describe('sınıfa bağlı seçimler', () => {
  it('Warlock → Wizard → Warlock: Invocation uyarısı yok, geri dönünce gelir', () => {
    const wl = char('warlock', 3, { subclassId: 'fiend-patron', spellNames: ['Eldritch Blast', 'Chill Touch', 'Hex', 'Hellish Rebuke', 'Misty Step', 'Hold Person'], invocations: INV },
      ['arcana', 'deception']);
    expect(texts(wl).filter((t) => /Invocation/.test(t))).toEqual([]);
    const wiz = switchClass(wl, 'wizard');
    expect(wiz.sheet.invocations).toBeUndefined();
    expect(wiz.sheet.spellNames).toEqual([]);
    expect(texts(wiz).some((t) => /Invocation|seçilemez|Hex/.test(t))).toBe(false);
    const back = switchClass(wiz, 'warlock');
    expect(back.sheet.invocations).toEqual(INV);
    expect(back.sheet.spellNames).toEqual(wl.sheet.spellNames);
    expect(back.sheet.subclassId).toBe('fiend-patron');
    expect(back.classSkills).toEqual(['arcana', 'deception']);
    expect(texts(back).filter((t) => /Invocation|seçilemez|fazla/.test(t))).toEqual([]);
  });
  it('Druid → Wizard: Druid büyüleri ve Primal Order seçimi uyarı üretmez, kayda yazılmaz', () => {
    const dr = char('druid', 1, { spellNames: ['Druidcraft', 'Produce Flame', 'Cure Wounds', 'Entangle'], featureChoices: { 'druid:primal-order': 'magician' } });
    // Eski davranış (seçimler taşınırsa): her büyü için ayrı satır. Şimdi taşınsalar bile yok sayılır.
    const carried: SavedCharacter = { ...dr, sheet: { ...dr.sheet, classId: 'wizard' } };
    expect(texts(carried).filter((t) => /seçilemez|Druidcraft/.test(t))).toEqual([]);
    expect(savableCharacter(carried).sheet.spellNames).toEqual([]);
    expect(savableCharacter(carried).sheet.featureChoices).toBeUndefined();
    const wiz = switchClass(dr, 'wizard');
    expect(texts(wiz).filter((t) => /seçilemez|Druidcraft/.test(t))).toEqual([]);
    expect(savableCharacter(wiz).classDrafts).toBeUndefined();
  });
  it('aynı sınıfta fazla seçim: uyarı ve kayıt engeli (K6)', () => {
    const wl = char('warlock', 1, { spellNames: ['Eldritch Blast', 'Chill Touch', 'Hex', 'Hellish Rebuke', 'Bane'], invocations: ['armor-of-shadows', 'eldritch-mind'] });
    const t = texts(wl);
    expect(t.some((x) => /Hazırlanan büyü fazla \(3 \/ 2\)/.test(x))).toBe(true);
    expect(t.some((x) => /Eldritch Invocations: 1 seçilmeli \(2 seçildi\)/.test(x))).toBe(true);
  });
  it('seviye düşürme: fazlası uyarılı ve kayıt engelli; sınıfa dönüşte ise uymayanlar düşer', () => {
    const wl5 = char('warlock', 5, { subclassId: 'fiend-patron', spellNames: ['Eldritch Blast', 'Chill Touch', 'Poison Spray', 'Hex', 'Hellish Rebuke', 'Hold Person', 'Misty Step', 'Counterspell', 'Fly'],
      invocations: [...INV, 'devils-sight', 'fiendish-vigor'] });
    const down = { ...wl5, sheet: { ...wl5.sheet, level: 2 } };
    const t = texts(down);
    expect(t.some((x) => /Counterspell bu sınıf ve seviyede seçilemez/.test(x))).toBe(true);
    expect(t.some((x) => /Invocations: 3 seçilmeli \(5 seçildi\)/.test(x))).toBe(true);
    // Başka sınıfa geçip 2. seviyede geri dönünce: seviyeye ve sayıya uyanlar gelir, fazlası düşer.
    const back = switchClass({ ...switchClass(wl5, 'wizard'), sheet: { ...switchClass(wl5, 'wizard').sheet, level: 2 } }, 'warlock');
    expect(back.sheet.level).toBe(2);
    // 2. seviyede 2 cantrip, en çok 1. seviye büyü: Poison Spray (3. cantrip), Hold Person, Misty Step, Counterspell, Fly düşer.
    expect(back.sheet.spellNames).toEqual(['Eldritch Blast', 'Chill Touch', 'Hex', 'Hellish Rebuke']);
    expect(back.sheet.invocations?.length).toBe(3);
    expect(texts(back).filter((x) => /fazla|seçilemez|Invocations/.test(x))).toEqual([]);
  });
  it('zorunlu seçim eksikse uyarı kalır (sınıf becerileri)', () => {
    const wiz = switchClass(char('fighter', 1, {}, ['athletics', 'perception']), 'wizard');
    expect(texts(wiz).some((x) => /Sınıf becerileri/.test(x))).toBe(true);
  });
  it('classScoped: sınıf anahtarı olmayan seçimler ve kendi sınıfınınkiler korunur', () => {
    const s = classScoped(char('druid', 2, { featureChoices: { 'druid:primal-order': 'warden', 'cleric:divine-order': 'thaumaturge' }, wildShapeForms: ['wolf'] }).sheet);
    expect(s.featureChoices).toEqual({ 'druid:primal-order': 'warden' });
    expect(s.wildShapeForms).toEqual(['wolf']);
    expect(classScoped(char('wizard', 2, { wildShapeForms: ['wolf'], metamagic: ['quickened'] }).sheet).wildShapeForms).toBeUndefined();
  });
});
