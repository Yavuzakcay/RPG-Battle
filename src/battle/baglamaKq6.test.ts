/** KQ6 bağlama: Dragonborn bütün alt sınıf jetonlarında, Gariban (GR) seviye < 3, maskeler ve beyaz taban Dragonborn renkleri. */
import { describe, expect, it } from 'vitest';
import { blankCharacter } from '../rules/builder';
import { garibanTokenFile, lineageTint, sheetAvatar, subclassTokenFile } from './avatar';
import { naturalLeft } from '../ui/tokenMirror';
import { maskedTint } from '../ui/tint';
import alt from '../../data/soy-maske-alt-rapor.json';
import fighter from '../../data/fighter-jeton.json';

const MASKS = new Set(Object.keys(import.meta.glob('/public/characters/maske/*.png')).map((f) => f.split('/').pop()!.replace('.png', '')));
const FILES = new Set(Object.keys(import.meta.glob('/public/characters/*.webp')).map((f) => f.split('/').pop()!.replace('.webp', '')));
const sheet = (o: object) => ({ ...blankCharacter('t').sheet, ...o }) as ReturnType<typeof blankCharacter>['sheet'];
const COLORS = ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white'];

describe('KQ6 bağlama', () => {
  it('Dragonborn alt sınıf jetonu bağlı (12 sınıf): Karakter seviye 3+ alt sınıf jetonu, dosya var', () => {
    expect(subclassTokenFile('fighter', 'dragonborn', 'erkek', 'pehlivan')).toBe('dragonborn-erkek-fighter-ID4.webp');
    const a = sheetAvatar(sheet({ raceId: 'dragonborn', classId: 'rogue', gender: 'kadin', level: 3, subclassId: 'thief' }));
    expect(a.src).toBe('characters/dragonborn-kadin-rogue-ID1.webp');
    expect(FILES.has('dragonborn-kadin-rogue-ID1')).toBe(true);
  });
  it('Gariban: seviye < 3 GR jetonu (Celestial hariç); seviye 3+ alt sınıfsız genel jeton', () => {
    expect(garibanTokenFile('fighter', 'elf', 'kadin', 2)).toBe('elf-kadin-fighter-GR.webp');
    expect(garibanTokenFile('fighter', 'celestial', 'kadin', 1)).toBeUndefined();
    expect(garibanTokenFile('fighter', 'elf', 'kadin', 3)).toBeUndefined();
    expect(sheetAvatar(sheet({ raceId: 'dragonborn', classId: 'monk', gender: 'erkek', level: 1 })).src).toBe('characters/dragonborn-erkek-monk-GR.webp');
    expect(sheetAvatar(sheet({ raceId: 'dragonborn', classId: 'monk', gender: 'erkek', level: 3 })).src).toBe('characters/dragonborn-male-monk.webp');
    for (const race of ['dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling'])
      for (const cls of ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'])
        for (const g of ['erkek', 'kadin'] as const) expect(FILES.has(`${race}-${g}-${cls}-GR`), `${race}-${g}-${cls}-GR`).toBe(true);
  });
  it('Pehlivan seviye 10: Dragonborn dev hali (ID5); Gulyabani (WL-8) Dragonborn dahil aynalı', () => {
    expect(sheetAvatar(sheet({ raceId: 'dragonborn', classId: 'fighter', gender: 'erkek', level: 10, subclassId: 'pehlivan' })).src).toBe('characters/dragonborn-erkek-fighter-ID5.webp');
    expect(sheetAvatar(sheet({ raceId: 'dragonborn', classId: 'fighter', gender: 'erkek', level: 9, subclassId: 'pehlivan' })).src).toBe('characters/dragonborn-erkek-fighter-ID4.webp');
    expect(fighter.formlar.pehlivan.ikinci).toBe('ID5');
    expect(naturalLeft('characters/dragonborn-kadin-warlock-WL-8.webp')).toBe(true);
  });
  it('maskeler: bağlı her alt sınıf/Gariban jetonunun ten maskesi var ya da (kabuk/odun yüzü, tam örtülü) raporda "maskesiz"', () => {
    const rep = alt.jetonlar as Record<string, number>;
    expect(Object.keys(rep).length).toBe(6 * 264);
    for (const [name, n] of Object.entries(rep)) expect(MASKS.has(name), name).toBe(n >= 30);
    expect(Object.values(rep).filter((n) => n < 30).length).toBeLessThan(60);
  });
  it('Dragonborn beyaz taban: 10 renk maskeli ve birbirinden ayrı; eski jeton (sınıf-genel) eski tablodan', () => {
    const seen = new Set<string>();
    for (const c of COLORS) {
      const t = lineageTint('dragonborn', c, 'kadin', true)!;
      expect(maskedTint(t), c).toBe(true);
      seen.add(JSON.stringify(t.to));
    }
    expect(seen.size).toBe(10);
    const a = sheetAvatar(sheet({ raceId: 'dragonborn', lineageId: 'red', classId: 'rogue', gender: 'kadin', level: 3, subclassId: 'thief' }));
    expect(a.tint).toEqual(lineageTint('dragonborn', 'red', 'kadin', true));
    const g = sheetAvatar(sheet({ raceId: 'dragonborn', lineageId: 'red', classId: 'rogue', gender: 'kadin', level: 3 }));
    expect(g.tint).toEqual(lineageTint('dragonborn', 'red', 'kadin'));
  });
});
