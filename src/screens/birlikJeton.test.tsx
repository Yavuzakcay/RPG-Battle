/**
 * Birlik Manastırı (Cleric imza alt sınıfı), 2026-11-19 kullanıcı kararı:
 * - jeton seviyeye göre: 3–16 hücre 3 (güvercinli genç rahip), 17+ hücre 9 (yaşlı çay ustası); veri `data/cleric-jeton.json`
 *   `formlar` (Pehlivan'ın KQ6-5 mekanizması, kodda sınıf koşulu yok); alt sınıfsız ya da başka alt sınıfta eski davranış;
 * - 17. seviye özelliğin (`unbroken-union`) adı "Barış Azizi" / "Saint of Peace"; kimlik aynı.
 * Görseller okunmaz, yalnız dosya adları listelenir.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { SheetView } from './sheet/SheetView';
import { setSubTokenWarnings, sheetAvatar, subclassTokenFile } from '../battle/avatar';
import { blankCharacter, migrateSubclasses, type SavedCharacter } from '../rules/builder';
import { findSubclass } from '../rules/subclasses';
import { loadCharacters } from '../app/storage';
import cleric from '../../data/cleric-jeton.json';
import imza from '../../data/imza.json';
import type { CharacterSheet } from '../rules/stats';

const sheet = (o: Partial<CharacterSheet>) => ({ name: 'T', raceId: 'dwarf', classId: 'cleric', gender: 'erkek', level: 3, ...o }) as unknown as CharacterSheet;
const src = (o: Partial<CharacterSheet>) => sheetAvatar(sheet(o)).src;
const RACES = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'orc', 'tiefling', 'goliath', 'celestial', 'dragonborn'] as const;

describe('Birlik Manastırı jetonu seviyeye göre', () => {
  it('seviye 3–16 ID3, 17 ve üstü ID9; eski baris-alani kimliği aynı; seviye düşünce geri döner', () => {
    for (const sub of ['imza_birlik', 'baris-alani']) {
      for (const level of [3, 10, 16]) expect(src({ subclassId: sub, level }), `${sub} ${level}`).toBe('characters/dwarf-erkek-cleric-ID3.webp');
      for (const level of [17, 20]) expect(src({ subclassId: sub, level }), `${sub} ${level}`).toBe('characters/dwarf-erkek-cleric-ID9.webp');
    }
    expect(subclassTokenFile('cleric', 'tiefling', 'kadin', 'imza_birlik', 17)).toBe('tiefling-kadin-cleric-ID9.webp');
    expect(subclassTokenFile('cleric', 'tiefling', 'kadin', 'imza_birlik')).toBe('tiefling-kadin-cleric-ID3.webp'); // seviye bilinmiyorsa 1. form
  });
  it('kural veride: esik 17, ikinci ID9, istisna yok; 1. form ID3', () => {
    const T = cleric as unknown as { altSiniflar: Record<string, string>; formlar: Record<string, { esik: number; ikinci: string; ikinciYok: string[] }> };
    for (const sub of ['imza_birlik', 'baris-alani']) {
      expect(T.altSiniflar[sub]).toBe('ID3');
      expect(T.formlar[sub]).toEqual({ esik: 17, ikinci: 'ID9', ikinciYok: [] });
    }
    expect(Object.keys(T.formlar).sort()).toEqual(['baris-alani', 'imza_birlik']);
  });
  it('alt sınıfsız ya da başka alt sınıfta eski davranış (Gariban, sınıf-genel, kendi hücresi; seviyeyle değişmez)', () => {
    expect(src({ level: 2, subclassId: 'imza_birlik' })).toBe('characters/dwarf-erkek-cleric-GR.webp');
    expect(src({ level: 5 })).toBe('characters/dwarf-male-cleric.webp');
    expect(src({ level: 17 })).toBe('characters/dwarf-male-cleric.webp');
    for (const level of [3, 17, 20]) {
      expect(src({ subclassId: 'life-domain', level })).toBe('characters/dwarf-erkek-cleric-ID1.webp');
      expect(src({ subclassId: 'yakamoz-alani', level })).toBe('characters/dwarf-erkek-cleric-ID8.webp');
    }
  });
  it('her ırk × cinsiyet için ID3 ve ID9 jetonu ve küçük kopyası var, eksik uyarısı yok', () => {
    const files = new Set(Object.keys(import.meta.glob('../../public/characters/*-cleric-ID{3,9}.webp', { query: '?url', import: 'default' })).map((p) => p.split('/').pop()));
    const small = new Set(Object.keys(import.meta.glob('../../public/characters/kucuk/*-cleric-ID{3,9}.webp', { query: '?url', import: 'default' })).map((p) => p.split('/').pop()));
    const missing: string[] = [];
    for (const race of RACES) for (const g of ['erkek', 'kadin']) for (const cell of ['ID3', 'ID9']) {
      const f = `${race}-${g}-cleric-${cell}.webp`;
      if (!files.has(f)) missing.push(f);
      if (!small.has(f)) missing.push(`kucuk/${f}`);
    }
    expect(missing).toEqual([]);
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setSubTokenWarnings(true);
    try {
      for (const race of RACES) for (const g of ['erkek', 'kadin'] as const) for (const level of [3, 17]) {
        expect(sheetAvatar(sheet({ raceId: race, gender: g, subclassId: 'imza_birlik', level })).src).toBe(`characters/${race}-${g}-cleric-${level >= 17 ? 'ID9' : 'ID3'}.webp`);
      }
      expect(w).not.toHaveBeenCalled();
    } finally { setSubTokenWarnings(false); w.mockRestore(); }
  });
});

describe('oluşturucu önizlemesi ve karakter kartı', () => {
  const ch = (level: number, subclassId: string | undefined = 'imza_birlik'): SavedCharacter => {
    const c = blankCharacter('birlik');
    return { ...c, sheet: { ...c.sheet, name: 'Rahip', raceId: 'dwarf', classId: 'cleric', level, ...(subclassId ? { subclassId } : {}) } };
  };
  const preview = (c: SavedCharacter) => /class="token-preview wiz-preview-side"[\s\S]*?characters\/([A-Za-z0-9-]+\.webp)/.exec(renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step="character" />))?.[1];
  const card = (c: SavedCharacter) => /class="sheet-token"[\s\S]*?characters\/([A-Za-z0-9-]+\.webp)/.exec(renderToStaticMarkup(<SheetView c={c} />))?.[1];
  it('oluşturucu önizlemesi seviyeye göre', () => {
    expect(preview(ch(3))).toBe('dwarf-erkek-cleric-ID3.webp');
    expect(preview(ch(16))).toBe('dwarf-erkek-cleric-ID3.webp');
    expect(preview(ch(17))).toBe('dwarf-erkek-cleric-ID9.webp');
    expect(preview(ch(17, 'life-domain'))).toBe('dwarf-erkek-cleric-ID1.webp');
  });
  it('karakter kartı seviyeye göre', () => {
    expect(card(ch(5))).toBe('dwarf-erkek-cleric-ID3.webp');
    expect(card(ch(17))).toBe('dwarf-erkek-cleric-ID9.webp');
    expect(card(ch(17, 'mezar-alani'))).toBe('dwarf-erkek-cleric-ID6.webp');
  });
});

describe('eski kayıt ve özellik adı', () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it('eski kayıt (baris-alani ve imza_birlik, kayıt sürümü 2) açılır, kimlik korunur, jeton seviyeye göre', () => {
    const mem = new Map<string, string>(); // test ortamında tarayıcı belleği yok: en küçük yerine koyma
    vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); }, removeItem: (k: string) => { mem.delete(k); } });
    const old = (id: string, subclassId: string, level: number) => { const c = blankCharacter(id); return { ...c, surum: 2, sheet: { ...c.sheet, name: id, raceId: 'elf', lineageId: 'high-elf', gender: 'kadin', classId: 'cleric', subclassId, level } }; };
    localStorage.setItem('rpg-battle-characters', JSON.stringify([old('a', 'baris-alani', 17), old('b', 'imza_birlik', 9)]));
    const { list, assigned } = migrateSubclasses(loadCharacters());
    expect(assigned).toEqual([]);
    expect(list.map((c) => c.sheet.subclassId)).toEqual(['baris-alani', 'imza_birlik']);
    expect(list.map((c) => findSubclass('cleric', c.sheet.subclassId)?.id)).toEqual(['imza_birlik', 'imza_birlik']);
    expect(list.map((c) => sheetAvatar(c.sheet).src)).toEqual(['characters/elf-kadin-cleric-ID9.webp', 'characters/elf-kadin-cleric-ID3.webp']);
  });
  it('17. seviye özellik: kimlik unbroken-union, ad Barış Azizi / Saint of Peace', () => {
    const sub = (imza as unknown as { altSiniflar: Array<{ id: string; features: Array<{ id: string; level: number; name: { tr: string; en: string } }> }> }).altSiniflar.find((s) => s.id === 'imza_birlik')!;
    const f = sub.features.find((x) => x.id === 'unbroken-union')!;
    expect(f.level).toBe(17);
    expect(f.name).toEqual({ tr: 'Barış Azizi', en: 'Saint of Peace' });
    const live = findSubclass('cleric', 'imza_birlik')!.features.find((x) => x.id === 'unbroken-union')!;
    expect(live.name).toEqual({ tr: 'Barış Azizi', en: 'Saint of Peace' });
    expect(JSON.stringify(imza)).not.toContain('Yıkılmaz Birlik');
  });
});
