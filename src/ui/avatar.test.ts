/** Karakter jetonları (pixel art): dosya adı kuralı, 240 dosya ve yedek zinciri. */
import { describe, it, expect } from 'vitest';
import { races, classes } from '../data';
import { sheetAvatar } from '../battle';
import { blankCharacter } from '../rules/builder';
import { pickImage } from './Avatar';

const RACES = ['celestial', 'dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling'];
const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
// Yalnızca dosya adları (tembel glob; resimler yüklenmez, testlere girmez).
const files = new Set(Object.keys(import.meta.glob('/public/characters/*.webp')).map((f) => f.split('/').pop()));

describe('karakter jetonları', () => {
  it('ırk ve sınıf kimlikleri resim adlarıyla aynı (Aasimar değil celestial)', () => {
    expect(races.map((r) => r.id).sort()).toEqual(RACES);
    expect(classes.map((c) => c.id).sort()).toEqual(CLASSES);
    expect(JSON.stringify(races).toLowerCase()).not.toContain('aasimar');
  });
  it('dosya adı ${ırk}-${male|female}-${sınıf}.webp; cinsiyetsiz eski kayıt male; eski yol yedekte', () => {
    const base = { ...blankCharacter('t').sheet, raceId: 'elf', classId: 'wizard' };
    expect(sheetAvatar({ ...base, gender: 'kadin' })).toMatchObject({
      src: 'characters/elf-female-wizard.webp', fallbacks: ['avatars/elf-wizard-kadin.webp'],
    });
    expect(sheetAvatar({ ...base, gender: 'erkek' }).src).toBe('characters/elf-male-wizard.webp');
    const { gender: _g, ...old } = { ...base, gender: undefined };
    expect(sheetAvatar(old).src).toBe('characters/elf-male-wizard.webp');
  });
  it('yedek zinciri: resim yoksa eski yol, o da yoksa baş harfli rozet (null)', () => {
    const chain = ['characters/elf-female-wizard.webp', 'avatars/elf-wizard-kadin.webp'];
    expect(pickImage(chain, new Map())).toEqual({ src: null, pending: chain[0] });
    expect(pickImage(chain, new Map([[chain[0] as string, true]]))).toEqual({ src: chain[0], pending: null });
    expect(pickImage(chain, new Map([[chain[0] as string, false]]))).toEqual({ src: null, pending: chain[1] });
    expect(pickImage(chain, new Map([[chain[0] as string, false], [chain[1] as string, true]]))).toEqual({ src: chain[1], pending: null });
    expect(pickImage(chain, new Map([[chain[0] as string, false], [chain[1] as string, false]]))).toEqual({ src: null, pending: null });
  });
  // Resimler depoya eklenince (public/characters) 240'ının hepsi aranır; hiç yoksa bu test atlanır.
  it.skipIf(files.size === 0)('240 resmin hepsi var (10 ırk × 2 cinsiyet × 12 sınıf)', () => {
    const want = RACES.flatMap((r) => ['male', 'female'].flatMap((g) => CLASSES.map((c) => `${r}-${g}-${c}.webp`)));
    expect(want).toHaveLength(240);
    expect(want.filter((f) => !files.has(f))).toEqual([]);
  });
});
