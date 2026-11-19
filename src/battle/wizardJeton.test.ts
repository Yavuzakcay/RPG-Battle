/** Görev WZ-BAGLA: Wizard alt sınıf jetonu çözümü, tablo bütünlüğü ve dosya varlığı. */
import { describe, expect, it, vi } from 'vitest';
import { setSubTokenWarnings, sheetAvatar, subclassTokenFile, wizardSubclassFile } from './avatar';
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
  it('15 hücre bir kez; her ırk×cinsiyet için 15 jeton dosyası var (Dragonborn dahil)', () => {
    const cells = Object.values(tablo.altSiniflar).sort();
    const want = [...Array.from({ length: 8 }, (_, i) => `WZ-A${i + 1}`), ...Array.from({ length: 7 }, (_, i) => `WZ-B${i + 1}`)].sort();
    expect(cells).toEqual(want);
    expect(tablo.irklar).toHaveProperty('dragonborn'); // KQ6 bağlama
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
  it('Dragonborn bağlı (KQ6): WZ jetonu gelir, eksik uyarısı yok', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setSubTokenWarnings(true);
    expect(wizardSubclassFile('dragonborn', 'erkek', 'evoker')).toBe('dragonborn-erkek-wizard-WZ-A1.webp');
    expect(wizardSubclassFile('elf', 'kadin', 'evoker')).toBe('elf-kadin-wizard-WZ-A1.webp');
    expect(warn).not.toHaveBeenCalled();
    setSubTokenWarnings(false);
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
  it('jetonlar kesildi: dosyalar var, alt sınıf jetonu atanır; Dragonborn ve boyalı karakter genel jetonda, eksik "<sınıf>-jeton eksik" yazılır', () => {
    const files = new Set(Object.keys(import.meta.glob('../../public/characters/*-warlock-WL-*.webp', { query: '?url', import: 'default' })).concat(Object.keys(import.meta.glob('../../public/characters/*-sorcerer-SC-*.webp', { query: '?url', import: 'default' }))).map((p) => p.split('/').pop()));
    for (const [t, cls, pre, n] of [[warlock, 'warlock', 'WL', 11], [sorcerer, 'sorcerer', 'SC', 9]] as const) {
      expect(Object.keys(t.irklar)).toContain('dragonborn');
      for (const [race, gens] of Object.entries(t.irklar)) for (const g of gens) for (let i = 1; i <= n; i++) expect(files.has(`${race}-${g}-${cls}-${pre}-${i}.webp`), `${race}-${g}-${cls}-${pre}-${i}`).toBe(true);
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setSubTokenWarnings(true);
    expect(subclassTokenFile('warlock', 'dwarf', 'erkek', 'cin')).toBe('dwarf-erkek-warlock-WL-2.webp');
    expect(sheetAvatar(sheet({ classId: 'warlock', subclassId: 'cin' })).src).toBe('characters/dwarf-erkek-warlock-WL-2.webp');
    expect(sheetAvatar(sheet({ classId: 'sorcerer', subclassId: 'alevbaz', gender: 'kadin' })).src).toBe('characters/dwarf-kadin-sorcerer-SC-2.webp');
    expect(subclassTokenFile('warlock', 'dragonborn', 'erkek', 'cin')).toBe('dragonborn-erkek-warlock-WL-2.webp');
    expect(subclassTokenFile('sorcerer', 'dwarf', 'erkek', 'bilinmeyen')).toBeUndefined(); // sahte kimlik: sessiz
    const msgs = warn.mock.calls.map((c) => String(c[0]));
    expect(msgs).toEqual([]);
    setSubTokenWarnings(false);
    warn.mockRestore();
  });
  it('zar teması: WL/SC jeton adından sınıf', () => {
    expect(classOfCombatant({ avatar: { src: 'characters/orc-kadin-warlock-WL-8.webp' } } as never)).toBe('warlock');
    expect(classOfCombatant({ avatar: { src: 'characters/orc-erkek-sorcerer-SC-3.webp' } } as never)).toBe('sorcerer');
  });
});

describe('TOPLU-KESIM: 9 sınıf bağlaması', () => {
  const NINE = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue'] as const;
  const tabs = import.meta.glob('../../data/{barbarian,bard,cleric,druid,fighter,monk,paladin,ranger,rogue}-jeton.json', { eager: true, import: 'default' }) as Record<string, { sinif: string; irklar: Record<string, string[]>; altSiniflar: Record<string, string>; cinsiyet?: Record<string, string>; formlar?: Record<string, { ikinci: string }> }>;
  const sira = (import.meta.glob('../../data/jeton-hucre-sirasi.json', { eager: true, import: 'default' }) as Record<string, { siniflar: Record<string, Record<string, string>> }>)['../../data/jeton-hucre-sirasi.json']!;
  const files = new Set(Object.keys(import.meta.glob('../../public/characters/*-ID*.webp', { query: '?url', import: 'default' })).map((p) => p.split('/').pop()));
  const byClass = (c: string) => Object.values(tabs).find((t) => t.sinif === c)!;
  const known = new Set<string>([...(imza as unknown as { altSiniflar: Array<{ id: string }> }).altSiniflar.map((x) => x.id), 'path-of-the-berserker', 'college-of-lore', 'life-domain', 'circle-of-the-land', 'warrior-of-the-open-hand', 'oath-of-devotion', 'hunter', 'thief', 'champion', 'karadul-cemberi']);
  it('her sınıf: hücreler sıradaki adlara uyar, kimlikler gerçek (imza/fikstür/Karadul/paket listesi), jeton dosyaları var', async () => {
    const liste = (await import('../../icerik-liste.txt?raw')).default as string;
    for (const l of liste.split('\n')) { const m = l.split('|').map((x) => x.trim()); if (m[2]) known.add(m[2]); }
    for (const c of NINE) {
      const t = byClass(c); const cells = [...Object.values(t.altSiniflar), ...Object.values(t.formlar ?? {}).map((f) => f.ikinci)];
      const max = Object.keys(sira.siniflar[c]!).length;
      for (const [id, cell] of Object.entries(t.altSiniflar)) {
        expect(known.has(id), `${c}:${id}`).toBe(true);
        expect(Number(cell.slice(2)) >= 1 && Number(cell.slice(2)) <= max, `${c}:${cell}`).toBe(true);
      }
      expect(Object.keys(t.irklar)).toContain('dragonborn');
      for (const [race, gens] of Object.entries(t.irklar)) for (const g of gens) for (const cell of new Set(cells)) {
        const n = Number(cell.slice(2));
        const blank = (c === 'druid' && g === 'erkek' && n === 8) || (c === 'fighter' && g === 'kadin' && n === 11);
        if (!blank) expect(files.has(`${race}-${g}-${c}-${cell}.webp`), `${race}-${g}-${c}-${cell}`).toBe(true);
      }
    }
  });
  it('özel durumlar: Birlik/Barış aynı jeton, Pehlivan dev hali bağlı değil, Gladyatör kendi jetonu, cinsiyet kuralları', () => {
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setSubTokenWarnings(true);
    // 2026-11-19 (kullanıcı kararı): Birlik Manastırı 3–16 ID3, 17+ ID9 (`formlar`; ayrıntı src/screens/birlikJeton.test.tsx).
    expect(subclassTokenFile('cleric', 'dwarf', 'erkek', 'imza_birlik')).toBe('dwarf-erkek-cleric-ID3.webp');
    expect(subclassTokenFile('cleric', 'dwarf', 'erkek', 'baris-alani')).toBe('dwarf-erkek-cleric-ID3.webp');
    expect(subclassTokenFile('cleric', 'dwarf', 'erkek', 'baris-alani', 17)).toBe('dwarf-erkek-cleric-ID9.webp');
    expect(subclassTokenFile('fighter', 'dwarf', 'erkek', 'pehlivan')).toBe('dwarf-erkek-fighter-ID4.webp');
    expect(Object.values(byClass('fighter').altSiniflar)).not.toContain('ID5');
    // CC 2026-11-19: Gladyatör (champion) artık kendi jetonunu kullanır (ayrı sayfadan, kod ID12), sınıf-genel jeton değil.
    expect(subclassTokenFile('fighter', 'dwarf', 'erkek', 'champion')).toBe('dwarf-erkek-fighter-ID12.webp');
    expect(sheetAvatar(sheet({ classId: 'fighter', subclassId: 'champion' })).src).toBe('characters/dwarf-erkek-fighter-ID12.webp');
    expect(subclassTokenFile('fighter', 'dwarf', 'erkek', 'imza_imparator')).toBe('dwarf-erkek-fighter-ID11.webp');
    expect(subclassTokenFile('fighter', 'dwarf', 'kadin', 'imza_imparator')).toBeUndefined();
    expect(subclassTokenFile('druid', 'dwarf', 'kadin', 'karadul-cemberi')).toBe('dwarf-kadin-druid-ID8.webp');
    expect(subclassTokenFile('druid', 'dwarf', 'erkek', 'karadul-cemberi')).toBeUndefined();
    expect(subclassTokenFile('monk', 'dragonborn', 'erkek', 'astral-disiplini')).toBe('dragonborn-erkek-monk-ID2.webp');
    expect(subclassTokenFile('rogue', 'human', 'erkek', 'thief')).toBe('human-erkek-rogue-ID1.webp'); // boyalı ırk: maske yoksa da jeton gelir
    expect(w.mock.calls.map((c) => String(c[0]))).toEqual([]); // cinsiyet kısıtı sessiz, eksik jeton yok
    setSubTokenWarnings(false);
    w.mockRestore();
    expect(sheetAvatar(sheet({ classId: 'rogue', subclassId: 'dedektif' })).src).toBe('characters/dwarf-male-rogue.webp'.replace('male-rogue', 'erkek-rogue-ID2'));
  });
  it('zar teması: ID jetonundan sınıf', () => {
    expect(classOfCombatant({ avatar: { src: 'characters/elf-kadin-paladin-ID7.webp' } } as never)).toBe('paladin');
  });
});

describe('KQ6-5: Pehlivan ikinci form (seviye eşiği veride)', () => {
  const fighter = (level: number, extra: Record<string, unknown> = {}) => sheet({ classId: 'fighter', raceId: 'celestial', gender: 'erkek', subclassId: 'pehlivan', level, ...extra });
  it('seviye 9 → 1. form (ID4); seviye 10 ve 20 → 2. form (ID5)', () => {
    expect(sheetAvatar(fighter(9)).src).toBe('characters/celestial-erkek-fighter-ID4.webp');
    expect(sheetAvatar(fighter(10)).src).toBe('characters/celestial-erkek-fighter-ID5.webp');
    expect(sheetAvatar(fighter(20)).src).toBe('characters/celestial-erkek-fighter-ID5.webp');
    expect(subclassTokenFile('fighter', 'dwarf', 'kadin', 'pehlivan', 12)).toBe('dwarf-kadin-fighter-ID5.webp');
    expect(subclassTokenFile('fighter', 'dwarf', 'kadin', 'pehlivan')).toBe('dwarf-kadin-fighter-ID4.webp'); // seviye bilinmiyorsa 1. form
  });
  it('2. form yoksa (veri: ikinciYok) 1. forma döner, uyarı yok; başka alt sınıf iki formlu değil', async () => {
    const tab = (await import('../../data/fighter-jeton.json')).default as unknown as { formlar: Record<string, { ikinciYok: string[] }> };
    const keep = [...tab.formlar.pehlivan!.ikinciYok];
    tab.formlar.pehlivan!.ikinciYok.push('dwarf-kadin');
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(subclassTokenFile('fighter', 'dwarf', 'kadin', 'pehlivan', 15)).toBe('dwarf-kadin-fighter-ID4.webp');
      expect(w).not.toHaveBeenCalled();
    } finally { tab.formlar.pehlivan!.ikinciYok.splice(0, tab.formlar.pehlivan!.ikinciYok.length, ...keep); w.mockRestore(); }
    for (const t of [warlock, sorcerer, tablo]) expect((t as { formlar?: unknown }).formlar).toBeUndefined();
    expect(subclassTokenFile('fighter', 'dwarf', 'erkek', 'ninja', 20)).toBe('dwarf-erkek-fighter-ID6.webp');
  });
  it('ikinci form jetonları (ID5) her ırk × cinsiyet için dosya olarak var', () => {
    const files = new Set(Object.keys(import.meta.glob('../../public/characters/*-fighter-ID5.webp', { query: '?url', import: 'default' })).map((p) => p.split('/').pop()));
    for (const race of ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'orc', 'tiefling', 'goliath', 'celestial']) for (const g of ['erkek', 'kadin']) expect(files.has(`${race}-${g}-fighter-ID5.webp`), `${race}-${g}`).toBe(true);
  });
});
