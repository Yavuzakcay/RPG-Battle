/** Görev WZ-BAGLA: Wizard alt sınıf jetonu çözümü, tablo bütünlüğü ve dosya varlığı. */
import { describe, expect, it, vi } from 'vitest';
import { sheetAvatar, subclassTokenFile, wizardSubclassFile } from './avatar';
import { classOfCombatant } from '../app/diceUnlock';
import tablo from '../../data/wizard-jeton.json';
import warlock from '../../data/warlock-jeton.json';
import sorcerer from '../../data/sorcerer-jeton.json';
import imza from '../../data/imza.json';
import type { CharacterSheet } from '../rules/stats';

/** Jeton dosya adları (görsel içeriği okunmaz). */
const FILES = new Set(Object.keys(import.meta.glob('../../public/characters/*-wizard-WZ-*.webp', { query: '?url', import: 'default' })).map((p) => p.split('/').pop()));
const sheet = (o: Partial<CharacterSheet>) => ({ name: 'T', raceId: 'dwarf', classId: 'wizard', gender: 'erkek', level: 3, ...o }) as unknown as CharacterSheet;

describe('WZ-BAGLA tablo', () => {
  it('15 hücre bir kez; her ırk×cinsiyet için 15 jeton dosyası var, Dragonborn yok', () => {
    const cells = Object.values(tablo.altSiniflar).sort();
    const want = [...Array.from({ length: 8 }, (_, i) => `WZ-A${i + 1}`), ...Array.from({ length: 7 }, (_, i) => `WZ-B${i + 1}`)].sort();
    expect(cells).toEqual(want);
    expect(tablo.irklar).not.toHaveProperty('dragonborn');
    for (const [race, gens] of Object.entries(tablo.irklar)) for (const g of gens) for (const c of want) expect(FILES.has(`${race}-${g}-wizard-${c}.webp`), `${race}-${g}-${c}`).toBe(true);
  });
});

describe('WZ-BAGLA çözüm', () => {
  it('eşleşen alt sınıf WZ jetonu, genel jeton yedek', () => {
    const a = sheetAvatar(sheet({ subclassId: 'evoker' }));
    expect(a.src).toBe('characters/dwarf-erkek-wizard-WZ-A1.webp');
    expect(a.fallbacks?.[0]).toBe('characters/dwarf-male-wizard.webp');
    expect(sheetAvatar(sheet({ subclassId: 'imza_harita', gender: 'kadin' })).src).toBe('characters/dwarf-kadin-wizard-WZ-B7.webp');
  });
  it('alt sınıfsız, başka sınıf ya da tabloda olmayan alt sınıf: eski davranış', () => {
    expect(sheetAvatar(sheet({})).src).toBe('characters/dwarf-male-wizard.webp');
    expect(sheetAvatar(sheet({ classId: 'fighter', subclassId: 'evoker' })).src).toBe('characters/dwarf-male-fighter.webp');
    expect(sheetAvatar(sheet({ subclassId: 'bilinmeyen' })).src).toBe('characters/dwarf-male-wizard.webp');
  });
  it('Dragonborn ve boyalı karakter (maske yok): genel jeton, eksik bir kez günlüğe', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(wizardSubclassFile('dragonborn', 'erkek', 'evoker', false)).toBeUndefined();
    expect(wizardSubclassFile('dragonborn', 'erkek', 'evoker', false)).toBeUndefined();
    expect(wizardSubclassFile('dwarf', 'erkek', 'evoker', true)).toBeUndefined();
    expect(warn.mock.calls.filter((c) => String(c[0]).includes('dragonborn-erkek-evoker'))).toHaveLength(1);
    expect(String(warn.mock.calls.at(-1)?.[0])).toContain('maskesi yok');
    warn.mockRestore();
  });
  it('zar teması: WZ jetonundan sınıf wizard', () => {
    expect(classOfCombatant({ avatar: { src: 'characters/dwarf-erkek-wizard-WZ-A1.webp' } } as never)).toBe('wizard');
    expect(classOfCombatant({ avatar: { src: 'characters/dwarf-male-fighter.webp' } } as never)).toBe('fighter');
  });
});

describe('BAGLA-3 Warlock ve Sorcerer', () => {
  const cells = (t: { altSiniflar: Record<string, string> }, pre: string, n: number) => ({ got: Object.values(t.altSiniflar).sort(), want: Array.from({ length: n }, (_, i) => `${pre}-${i + 1}`).sort() });
  it('hücre tabloları: Warlock WL-1..11, Sorcerer SC-1..9, imza/fikstür kimlikleri gerçek', () => {
    const w = cells(warlock, 'WL', 11); expect(w.got).toEqual(w.want);
    const s = cells(sorcerer, 'SC', 9); expect(s.got).toEqual(s.want);
    expect(warlock.altSiniflar).toMatchObject({ gulyabani: 'WL-8', imza_astrolog: 'WL-11', 'fiend-patron': 'WL-1' });
    expect(sorcerer.altSiniflar).toMatchObject({ 'draconic-sorcery': 'SC-1', imza_dunganga: 'SC-9' });
    const imzaIds = (imza as unknown as { altSiniflar: Array<{ id: string }> }).altSiniflar.map((x) => x.id);
    for (const id of ['imza_harita', 'imza_astrolog', 'imza_dunganga']) expect(imzaIds).toContain(id);
    expect(tablo.cozulemeyen).toEqual([]); expect(warlock.cozulemeyen).toEqual([]); expect(sorcerer.cozulemeyen).toEqual([]);
  });
  it('jeton dosyası yok (kesim yapılmadı): alt sınıf jetonu atanmaz, genel jeton kalır, eksik "<sınıf>-jeton eksik" yazılır', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(subclassTokenFile('warlock', 'dwarf', 'erkek', 'cin', false)).toBeUndefined();
    expect(sheetAvatar(sheet({ classId: 'warlock', subclassId: 'cin' })).src).toBe('characters/dwarf-male-warlock.webp');
    expect(sheetAvatar(sheet({ classId: 'sorcerer', subclassId: 'alevbaz' })).src).toBe('characters/dwarf-male-sorcerer.webp');
    const msgs = warn.mock.calls.map((c) => String(c[0]));
    expect(msgs.some((m) => m.startsWith('warlock-jeton eksik: dwarf-erkek-cin'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('sorcerer-jeton eksik: dwarf-erkek-alevbaz'))).toBe(true);
    warn.mockRestore();
  });
  it('zar teması: WL/SC jeton adından sınıf', () => {
    expect(classOfCombatant({ avatar: { src: 'characters/orc-kadin-warlock-WL-8.webp' } } as never)).toBe('warlock');
    expect(classOfCombatant({ avatar: { src: 'characters/orc-erkek-sorcerer-SC-3.webp' } } as never)).toBe('sorcerer');
  });
});
