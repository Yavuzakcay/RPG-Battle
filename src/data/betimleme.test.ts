/**
 * Kuyruk B2: büyü betimlemeleri (data/buyu-betimleme.json): kapsam (339 büyü, eksik/fazla yok), şema, uzunluk; rakam uyarı olarak
 * raporlanır (hata değil). Betimleme büyü `text`'ine karışmaz (ortam kuralı o alanı anahtar sözcükle okur).
 */
import { describe, expect, it } from 'vitest';
import raw from '../../data/buyu-betimleme.json';
import { spells, spellDescriptions, spellDescriptionOf, spellDescriptionShown } from './index';
import { DESCRIPTION_MAX, betimlemeOf, descriptionShown, validateDescriptions } from './betimleme';

describe('büyü betimlemeleri (veri)', () => {
  it('339 büyünün hepsi için tam bir giriş: eksik ya da fazla kimlik yok', () => {
    expect(spells).toHaveLength(339);
    const r = validateDescriptions(raw, spells.map((s) => s.id));
    expect(r.errors).toEqual([]);
    expect(Object.keys(raw).filter((k) => !k.startsWith('_'))).toHaveLength(339);
  });
  it('her tr metni dolu ve en çok 135 karakter; rakam yalnız uyarı', () => {
    for (const s of spells) {
      const tr = (raw as unknown as Record<string, { tr: string }>)[s.id]?.tr ?? '';
      expect(tr.trim().length, s.id).toBeGreaterThan(0);
      expect(tr.length, s.id).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
    const w = validateDescriptions(raw, spells.map((s) => s.id)).warnings;
    if (w.length) console.warn(`betimleme rakam uyarısı (${w.length}): ${w.map((x) => x.split(':')[0]).join(', ')}`);
    expect(Array.isArray(w)).toBe(true);
  });
  it('doğrulayıcı hataları yakalar: eksik, fazla, boş, uzun, yapı, bilinmeyen dil', () => {
    const ids = ['a', 'b'];
    expect(validateDescriptions({ a: { tr: 'x' } }, ids).errors).toEqual(['b: betimleme yok']);
    expect(validateDescriptions({ a: { tr: 'x' }, b: { tr: 'y' }, c: { tr: 'z' } }, ids).errors).toEqual(['c: fazla kimlik (büyü yok)']);
    expect(validateDescriptions({ a: { tr: ' ' }, b: { tr: 'y' } }, ids).errors).toEqual(['a: tr boş ya da metin değil']);
    expect(validateDescriptions({ a: { tr: 'x'.repeat(136) }, b: 'y' }, ids).errors.length).toBe(2);
    expect(validateDescriptions({ a: { tr: 'x', de: 'q' }, b: { tr: 'y' } }, ids).errors).toEqual(['a: bilinmeyen dil anahtarı "de"']);
    expect(validateDescriptions({ a: { tr: 'x1' }, b: { tr: 'y' } }, ids)).toEqual({ errors: [], warnings: ['a: tr metninde rakam var'] });
  });
  it('erişim: betimlemeOf en → tr yedeği; descriptionShown yalnız o dilin metni (EN modunda tr gizli)', () => {
    const t = { x: { tr: 'türkçe' }, y: { tr: 'türkçe', en: 'english' } };
    expect(betimlemeOf(t, 'x', 'tr')).toBe('türkçe');
    expect(betimlemeOf(t, 'x', 'en')).toBe('türkçe');
    expect(betimlemeOf(t, 'y', 'en')).toBe('english');
    expect(betimlemeOf(t, 'yok', 'tr')).toBeUndefined();
    expect(descriptionShown(t, 'x', 'en')).toBeUndefined();
    expect(descriptionShown(t, 'y', 'en')).toBe('english');
    expect(descriptionShown(t, 'x', 'tr')).toBe('türkçe');
  });
  it('yüklenen tablo (loadClassData): kimlikle okunur, _aciklama sızmaz', () => {
    expect(Object.keys(spellDescriptions)).toHaveLength(339);
    expect(spellDescriptions._aciklama).toBeUndefined();
    expect(spellDescriptionOf('fireball', 'tr')).toContain('alev');
    expect(spellDescriptionShown('fireball', 'en')).toBeUndefined();
  });
});
