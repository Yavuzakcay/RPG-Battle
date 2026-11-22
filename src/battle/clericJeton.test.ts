/**
 * CLERIC-JETON-ID1-NOTU: Yaşam Manastırı (`life-domain`) geri geldi (98504837), hücre 1 (ID1) yeniden onun jetonu.
 * Cleric alt sınıf → hücre eşlemesi `data/cleric-jeton.json`, hücre adları `data/jeton-hucre-sirasi.json`.
 * Birlik Manastırı kuralı (3–16 ID3, 17+ ID9) bozulmamalı. Görseller okunmaz, yalnız dosya adları listelenir.
 */
import { describe, expect, it, vi } from 'vitest';
import { setSubTokenWarnings, sheetAvatar, subclassTokenFile } from './avatar';
import { findSubclass } from '../rules/subclasses';
import cleric from '../../data/cleric-jeton.json';
import hucre from '../../data/jeton-hucre-sirasi.json';
import type { CharacterSheet } from '../rules/stats';

const T = cleric as unknown as { note: string; altSiniflar: Record<string, string>; formlar: Record<string, { esik: number; ikinci: string }> };
const H = (hucre as unknown as { siniflar: Record<string, Record<string, string>> }).siniflar;
const sheet = (o: Partial<CharacterSheet>) => ({ name: 'T', raceId: 'dwarf', classId: 'cleric', gender: 'erkek', level: 3, ...o }) as unknown as CharacterSheet;
const RACES = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'orc', 'tiefling', 'goliath', 'celestial', 'dragonborn'] as const;

describe('Cleric alt sınıf jeton eşlemesi', () => {
  it('alt sınıf → hücre tablosu (Yaşam ID1, Aydın ID2, Birlik ID3/ID9, Demirci ID4 … Yakamoz ID8)', () => {
    expect(T.altSiniflar).toEqual({
      'life-domain': 'ID1', 'aydin-alani': 'ID2', 'demirci-alani': 'ID4', 'firtina-alani': 'ID5', 'mezar-alani': 'ID6',
      'savas-alani': 'ID7', 'yakamoz-alani': 'ID8', imza_birlik: 'ID3', 'baris-alani': 'ID3',
    });
    for (const sub of ['imza_birlik', 'baris-alani']) expect(T.formlar[sub]).toMatchObject({ esik: 17, ikinci: 'ID9' });
  });
  it('ID1 "kullanılmıyor" diye işaretli değil; hücre 1 Yaşam Manastırı', () => {
    expect(H.cleric!['1']).toMatch(/Yaşam/);
    expect(H.cleric!['1']).not.toMatch(/kullanılmıyor/);
    expect(T.note).not.toMatch(/kullanılmıyor/);
    expect(findSubclass('cleric', 'life-domain')?.id).toBe('life-domain');
  });
  it('Yaşam Manastırı oyunda her ırk × cinsiyet × seviyede ID1 jetonuna çözülür, dosya ve küçük kopyası var', () => {
    const files = new Set(Object.keys(import.meta.glob('../../public/characters/*-cleric-ID1.webp', { query: '?url', import: 'default' })).map((p) => p.split('/').pop()));
    const small = new Set(Object.keys(import.meta.glob('../../public/characters/kucuk/*-cleric-ID1.webp', { query: '?url', import: 'default' })).map((p) => p.split('/').pop()));
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setSubTokenWarnings(true);
    try {
      for (const race of RACES) for (const g of ['erkek', 'kadin'] as const) {
        const f = `${race}-${g}-cleric-ID1.webp`;
        expect(files.has(f), f).toBe(true);
        expect(small.has(f), `kucuk/${f}`).toBe(true);
        for (const level of [3, 16, 17, 20]) {
          expect(sheetAvatar(sheet({ raceId: race, gender: g, subclassId: 'life-domain', level })).src).toBe(`characters/${f}`);
        }
        expect(subclassTokenFile('cleric', race, g, 'life-domain')).toBe(f);
      }
      expect(w).not.toHaveBeenCalled();
    } finally { setSubTokenWarnings(false); w.mockRestore(); }
  });
  it('Birlik Manastırı kuralı aynen: 3–16 ID3, 17+ ID9', () => {
    for (const level of [3, 16]) expect(sheetAvatar(sheet({ subclassId: 'imza_birlik', level })).src).toBe('characters/dwarf-erkek-cleric-ID3.webp');
    for (const level of [17, 20]) expect(sheetAvatar(sheet({ subclassId: 'imza_birlik', level })).src).toBe('characters/dwarf-erkek-cleric-ID9.webp');
  });
});
