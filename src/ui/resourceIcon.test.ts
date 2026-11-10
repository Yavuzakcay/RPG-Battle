/**
 * Kuyruk E4c: kaynak ikonları (yalnız görünüm): eşleme, dosyalar (yalnız adlar), paket kaynağı yedek kuralı, paylaşılan ikon.
 */
import { describe, expect, it } from 'vitest';
import map from '../../data/kaynak-ikon.json';
import classFeatures from '../../data/class-features.json';
import imza from '../../data/imza.json';
import { classData } from '../data';
import { ICON_NAMES, ICON_PX, resourceIconOf, resourceIconSrc } from './resourceIcon';
import { sharedIcons } from './ResourceChip';

describe('kaynak ikonları', () => {
  it('sekiz ikon, her biri 192/96/64 px dosyalı (public/kaynak)', () => {
    // Yalnız dosya adları (tembel glob; görsel yüklenmez).
    const files = new Set(Object.keys(import.meta.glob('../../public/kaynak/*.webp')).map((k) => k.split('/').pop()!));
    expect(ICON_NAMES).toHaveLength(8);
    for (const n of ICON_NAMES) for (const f of [`kaynak-${n}.webp`, `kaynak-${n}-96.webp`, `kaynak-${n}-64.webp`]) expect(files.has(f), f).toBe(true);
    expect(files.size).toBe(24);
  });
  it('eşlemedeki her kaynak anahtarı sınıf ya da imza kaynakları tablosunda var; her ikon adı tanımlı', () => {
    const all = new Set([...Object.keys((classFeatures as { resources: Record<string, unknown> }).resources), ...Object.keys((imza as { kaynaklar: Record<string, unknown> }).kaynaklar)]);
    for (const [id, icon] of Object.entries(map.kaynak as Record<string, string>)) {
      expect(all.has(id), id).toBe(true);
      expect(ICON_NAMES, `${id} → ${icon}`).toContain(icon);
    }
  });
  it('görevdeki eşleme (E4-DENETIM (a)): Ki, İlham, kader d20, büyü puanı, arcanum, şifa havuzu', () => {
    const want: Record<string, string[]> = {
      ki: ['focus', 'uncannyMetabolism', 'wholenessOfBody'],
      ilham: ['bardicInspiration', 'imzaUstaSair', 'imzaOlumsuzDize'],
      'kader-d20': ['strokeOfLuck', 'darkOnesLuck', 'imzaFal', 'imzaYazgi'],
      'buyu-puani': ['sorceryPoints', 'innateSorcery'],
      arcanum: ['arcanum6', 'arcanum7', 'arcanum8', 'arcanum9'],
      'sifa-havuzu': ['layOnHands', 'celestialHeal', 'imzaHavuz', 'imzaHukumdar'],
    };
    for (const [icon, ids] of Object.entries(want)) for (const id of ids) expect(resourceIconOf(id), id).toBe(icon);
  });
  it('eşleşmeyen kaynak yalnız metin (null); ek paket kaynağı: tanımdaki icon, yoksa ad deseni (ruh kristali)', () => {
    expect(resourceIconOf('rage')).toBeNull();
    expect(resourceIconOf('actionSurge')).toBeNull();
    const t = classData.mechanics.resources;
    t['pk-x-ruh'] = { name: 'Ruh Kristali', feature: 'x', uses: { fixed: 2 }, recharge: { long: 'all' } };
    t['pk-x-zar'] = { name: 'Üstünlük Zarı', feature: 'x', uses: { fixed: 4 }, recharge: { long: 'all' }, icon: 'ustunluk-zari' };
    t['pk-x-baska'] = { name: 'Başka Şey', feature: 'x', uses: { fixed: 1 }, recharge: { long: 'all' } };
    try {
      expect(resourceIconOf('pk-x-ruh')).toBe('ruh-kristali');
      expect(resourceIconOf('pk-x-zar')).toBe('ustunluk-zari');
      expect(resourceIconOf('pk-x-baska')).toBeNull();
    } finally { delete t['pk-x-ruh']; delete t['pk-x-zar']; delete t['pk-x-baska']; }
  });
  it('en küçük gösterim 32 px; kaynak yolları 64 px (2×) ve 96 px (3×)', () => {
    expect(ICON_PX).toBeGreaterThanOrEqual(32);
    const s = resourceIconSrc('ki');
    expect(s.src).toMatch(/kaynak\/kaynak-ki-64\.webp$/);
    expect(s.srcSet).toMatch(/kaynak-ki-96\.webp 3x$/);
  });
  it('aynı ikonu paylaşan kaynaklarda ad görünür (Focus + Uncanny Metabolism), tek olanda gizli', () => {
    expect([...sharedIcons(['focus', 'uncannyMetabolism'])].sort()).toEqual(['focus', 'uncannyMetabolism']);
    expect(sharedIcons(['focus', 'bardicInspiration']).size).toBe(0);
  });
});
