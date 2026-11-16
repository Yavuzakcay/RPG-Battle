/** Görev WZ-BAGLA: Wizard alt sınıf jetonu çözümü, tablo bütünlüğü ve dosya varlığı. */
import { describe, expect, it, vi } from 'vitest';
import { sheetAvatar, wizardSubclassFile } from './avatar';
import { classOfCombatant } from '../app/diceUnlock';
import tablo from '../../data/wizard-jeton.json';
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
