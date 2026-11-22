/**
 * Eski alt sınıf kimliklerinin yönlenmesi (2026-11-22 kullanıcı kararı; eski adı `lifeDomainYonlendirme.test.ts`).
 * Yalnız Barış Alanı (`baris-alani`) kaldırıldı ve kimliği Birlik Manastırı'na (`imza_birlik`) yönlenir. Yaşam Manastırı
 * (`life-domain`, SRD'nin Cleric alt sınıfı) kalır, yönlenmez; Birlik Manastırı onun yanındadır. 2026-11-21'deki
 * "Yaşam → Birlik" yönlendirmesi (commit 47dab278) kullanıcı kararı değildi, geri alındı: eski kayıtta `life-domain` olduğu gibi kalır.
 */
import { describe, expect, it } from 'vitest';
import { findSubclass, visibleSubclasses } from './subclasses';
import { blankCharacter, migrateSubclasses, suggestedScores } from './builder';
import { defaultSubclass } from './classFeatures';
import { combatantFromSheet } from '../battle/create';

const rahip = (subclassId: string) => {
  const c = blankCharacter('x');
  return { ...c, sheet: { ...c.sheet, name: 'Rahip', classId: 'cleric', subclassId, level: 5, baseScores: suggestedScores('cleric') } };
};

describe('alt sınıf yönlendirmesi: yalnız Barış Alanı', () => {
  it('baris-alani Birlik Manastırı\'na yönlenir ve listede yok', () => {
    expect(findSubclass('cleric', 'baris-alani')?.id).toBe('imza_birlik');
    expect(visibleSubclasses('cleric').some((s) => s.id === 'baris-alani')).toBe(false);
  });
  it('life-domain yönlenmez: listede kendi kimliğiyle, Birlik Manastırı yanında; Cleric varsayılanı Yaşam', () => {
    expect(findSubclass('cleric', 'life-domain')?.id).toBe('life-domain');
    const ids = visibleSubclasses('cleric').map((s) => s.id);
    expect(ids).toContain('life-domain');
    expect(ids).toContain('imza_birlik');
    expect(defaultSubclass('cleric')).toBe('life-domain');
  });
  it('eski kayıtta life-domain olduğu gibi kalır (yeniden yazılmaz, bildirim yok)', () => {
    const list = [rahip('life-domain')];
    const m = migrateSubclasses(list);
    expect(m.assigned).toEqual([]);
    expect(m.list).toBe(list);
    expect(m.list[0]!.sheet.subclassId).toBe('life-domain');
  });
  it('life-domain ile kurulan savaşçı Yaşam Manastırı mekaniğiyle (imza yok)', () => {
    const c = combatantFromSheet(rahip('life-domain').sheet, { id: 'A', ownerId: 'p1' });
    expect(c.imza).toBeUndefined();
    expect(c.traits ?? []).toContain('disciple-of-life');
  });
});
