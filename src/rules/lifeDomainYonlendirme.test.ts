/**
 * 2026-11-21 (kullanıcı kararı): Yaşam Manastırı (`life-domain`) paketten silindi, yerini Birlik Manastırı (`imza_birlik`) alır.
 * Kimlik kayıtta yoksa (uygulamada hep) yönlenir; test kurulumu fikstürü yüklediği için burada fikstür kaydı geçici çıkarılır.
 * Kayıtlı karakter açılışta bir kez yeniden yazılır (`migrateSubclasses` `renamed`); savaş kurulumu Birlik imzasıyla.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { classData } from '../data';
import { effectiveSubclassId, findSubclass, legacySubclassTarget, visibleSubclasses } from './subclasses';
import { blankCharacter, migrateSubclasses, suggestedScores } from './builder';
import { combatantFromSheet } from '../battle/create';

describe('life-domain → Birlik Manastırı', () => {
  const saved = [...classData.subclasses];
  beforeAll(() => { classData.subclasses = saved.filter((s) => s.id !== 'life-domain'); });
  afterAll(() => { classData.subclasses = saved; });
  const ch = () => { const c = blankCharacter('x'); return { ...c, sheet: { ...c.sheet, name: 'Rahip', classId: 'cleric', subclassId: 'life-domain', level: 5, baseScores: suggestedScores('cleric') } }; };

  it('kayıtta yoksa yönlenir; listede yok', () => {
    expect(legacySubclassTarget('life-domain')).toBe('imza_birlik');
    expect(legacySubclassTarget('baris-alani')).toBeUndefined();
    expect(effectiveSubclassId('cleric', 'life-domain')).toBe('imza_birlik');
    expect(findSubclass('cleric', 'life-domain')?.id).toBe('imza_birlik');
    expect(visibleSubclasses('cleric').some((s) => s.id === 'life-domain')).toBe(false);
  });
  it('eski karakter bir kez yeniden yazılır ve bildirilir; ikinci açılışta değişiklik yok', () => {
    const m = migrateSubclasses([ch()]);
    expect(m.renamed).toEqual([{ name: 'Rahip', classId: 'cleric', subclassId: 'imza_birlik' }]);
    expect(m.list[0]!.sheet.subclassId).toBe('imza_birlik');
    const again = migrateSubclasses(m.list);
    expect(again.renamed).toEqual([]);
    expect(again.list).toBe(m.list);
  });
  it('yazılmamış eski kayıtla kurulan savaşçı Birlik Manastırı imzasıyla (Yaşam izi yok)', () => {
    const c = combatantFromSheet(ch().sheet, { id: 'A', ownerId: 'p1' });
    expect(c.imza).toBe('imza_birlik');
    expect(c.traits ?? []).not.toContain('disciple-of-life');
  });
});
