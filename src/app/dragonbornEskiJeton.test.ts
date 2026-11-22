/**
 * DRAGONBORN-ESKI-JETON-KALDIR (kullanıcı kararı 2026-11-22): Dragonborn'un eski sınıf-genel jetonları (`dragonborn-<male|female>-<sınıf>.webp`)
 * oyunda hiç kullanılmaz. Bütün Dragonborn × sınıf × cinsiyet × alt sınıf × seviye × soy görünümleri ve mahkûm kıyafeti güncel jetona
 * (Gariban ya da alt sınıf jetonu, pul maskeli, küçük kopyalı) çözülür; eski dosyalar ve veri satırları yok.
 * Görseller açılmaz: yalnız dosya adları listelenir (`import.meta.glob`, tembel).
 */
import { describe, expect, it } from 'vitest';
import { classes, races } from '../data';
import { blankCharacter } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import { classBaseTokenFile, genericTokenRetired, prisonerOutfit, sheetAvatar } from '../battle/avatar';
import type { Avatar } from '../battle/types';
import { badgeChain, thumbOf } from '../ui/Avatar';
import { maskUrlFor } from '../ui/tint';
import { executeSeruven, type SeruvenCommand, type SeruvenState } from '../journey/seruven';
import { HAPIS } from '../journey/hapishane';
import { hapisSession } from './seruvenBattle';
import { partyAt } from '../sim/balance';
import jetonGenel from '../../data/jeton-genel.json';
import filtreYedek from '../../data/soy-filtre-yedek.json';
import filtreAday from '../../data/soy-filtre-adaylari.json';
import maskeRapor from '../../data/soy-maske-rapor.json';
import olcum from '../../data/soy-olcum.json';
import soyRenkleri from '../../data/soy-renkleri.json';
import kanatKok from '../../data/dragonborn-kanat-kok.json';
import ddEsleme from '../../data/dungeondex-gorsel-esleme.json?raw';

const names = (g: Record<string, unknown>) => new Set(Object.keys(g).map((f) => f.split('/').pop()!));
const BIG = names(import.meta.glob('/public/characters/*.webp'));
const SMALL = names(import.meta.glob('/public/characters/kucuk/*.webp'));
const PUL = names(import.meta.glob('/public/characters/maske-pul/*.png'));
const MASK = names(import.meta.glob('/public/characters/maske/*.png'));
const TABLES = import.meta.glob('../../data/*-jeton.json', { eager: true, import: 'default' }) as Record<string, { sinif: string; altSiniflar: Record<string, string>; cinsiyet?: Record<string, string> }>;

const OLD = /dragonborn-(male|female)-/;
const CURRENT = /^characters\/dragonborn-(erkek|kadin)-([a-z]+)-[A-Za-z0-9-]+\.webp$/;
const LINEAGES = (races.find((r) => r.id === 'dragonborn')!.lineages ?? []).map((l) => l.id);
/** Seviye eşikleri: Gariban < 3, alt sınıf 3+, kanat 5+, ikinci form 10+ (Pehlivan), üst sınır 20. */
const LEVELS = [1, 2, 3, 4, 5, 9, 10, 11, 17, 20];
const sheet = (p: Partial<CharacterSheet>): CharacterSheet => ({ ...blankCharacter('t').sheet, raceId: 'dragonborn', ...p });
const file = (src: string) => src.replace(/^.*\//, '');

/** Avatarın bütün zinciri (rozet küçük kopyası dahil) güncel Dragonborn jetonu; eski jeton hiçbir halkada yok. */
function expectCurrent(a: Avatar, label: string, cls?: string) {
  const m = CURRENT.exec(a.src);
  expect(m, `${label}: ${a.src}`).not.toBeNull();
  if (cls) expect(m![2], label).toBe(cls);
  expect(BIG.has(file(a.src)), `${label}: ${a.src} yok`).toBe(true);
  expect(SMALL.has(file(thumbOf(a.src)!)), `${label}: küçük kopya yok`).toBe(true);
  for (const s of [...badgeChain(a, 44), ...badgeChain(a, 56)]) {
    expect(s, label).not.toMatch(OLD);
    if (s.startsWith('characters/')) expect((s.includes('/kucuk/') ? SMALL : BIG).has(file(s)), `${label}: ${s} yok`).toBe(true);
  }
  // Soy boyası pul yolunda ve pul maskesi var (maskesiz Dragonborn jetonu yok: yedek filtreye düşmez).
  if (a.tint) {
    const mask = maskUrlFor(a.src, a.tint);
    expect(mask, label).toMatch(/\/maske-pul\//);
    expect(PUL.has(file(mask!)), `${label}: pul maskesi yok (${mask})`).toBe(true);
  }
}

describe('Dragonborn eski sınıf-genel jetonu kaldırıldı', () => {
  it('veri: kaldırılan ırk listesi; diğer ırklar sınıf-genel jetonla aynen', () => {
    expect(jetonGenel.kaldirilan).toEqual(['dragonborn']);
    expect(genericTokenRetired('dragonborn')).toBe(true);
    expect(genericTokenRetired('elf')).toBe(false);
    expect(classBaseTokenFile('elf', 'kadin', 'monk')).toBe('elf-female-monk.webp');
    expect(classBaseTokenFile('dragonborn', 'kadin', 'monk')).toBe('dragonborn-kadin-monk-GR.webp');
    expect(classBaseTokenFile('dragonborn', undefined, 'wizard')).toBe('dragonborn-erkek-wizard-GR.webp');
    expect(sheetAvatar(sheet({ raceId: 'elf', classId: 'monk', gender: 'erkek', level: 3 })).src).toBe('characters/elf-male-monk.webp');
  });

  it('bütün sınıf × cinsiyet × alt sınıf × seviye × soy görünümleri güncel jetona çözülür', () => {
    expect(classes.length).toBe(12);
    let n = 0;
    for (const c of classes) {
      const T = Object.values(TABLES).find((t) => t.sinif === c.id)!;
      expect(T, c.id).toBeDefined();
      const subs = [undefined, 'bilinmeyen-alt-sinif', ...Object.keys(T.altSiniflar)];
      for (const gender of ['erkek', 'kadin', undefined] as const) for (const subclassId of subs) for (const level of LEVELS)
        for (const lineageId of [undefined, ...LINEAGES]) {
          const s = sheet({ classId: c.id, level, ...(gender ? { gender } : {}), ...(subclassId ? { subclassId } : {}), ...(lineageId ? { lineageId } : {}) });
          const a = sheetAvatar(s);
          expectCurrent(a, `${c.id}/${gender ?? '-'}/${subclassId ?? '-'}/${level}/${lineageId ?? '-'}`, c.id);
          // Cinsiyet dosya adında doğru (cinsiyetsiz eski kayıt erkek).
          expect(a.src).toContain(`dragonborn-${gender ?? 'erkek'}-`);
          // Seviye < 3, alt sınıfsız, tabloda olmayan ya da cinsiyet kısıtlı alt sınıf: Gariban.
          const only = subclassId ? T.cinsiyet?.[subclassId] : undefined;
          if (level < 3 || !subclassId || !(subclassId in T.altSiniflar) || (only && only !== (gender ?? 'erkek'))) expect(a.src, `${c.id} ${subclassId} ${level}`).toMatch(/-GR\.webp$/);
          n++;
        }
    }
    expect(n).toBeGreaterThan(12 * 3 * LEVELS.length * 11 * 10);
  });

  it('oluşturucunun sınıf önyüklemesi (alt sınıfsız, her seviye) küçük kopyası olan güncel jeton', () => {
    for (const gender of ['erkek', 'kadin'] as const) for (const level of [1, 3, 10, 20]) for (const c of classes) {
      const t = thumbOf(sheetAvatar({ ...sheet({ gender, level, classId: 'fighter', subclassId: 'champion' }), classId: c.id, subclassId: undefined }).src)!;
      expect(t).toBe(`characters/kucuk/dragonborn-${gender}-${c.id}-GR.webp`);
      expect(SMALL.has(file(t)), t).toBe(true);
    }
  });

  it('mahkûm kıyafeti: Keşiş Gariban jetonu (pul maskeli), soy rengi karakterden; eski monk jetonuna dönmez', () => {
    expect(HAPIS.kostum.sinif).toBe('monk');
    for (const gender of ['erkek', 'kadin', undefined] as const) for (const lineageId of [undefined, ...LINEAGES]) for (const c of classes) for (const level of [1, 5, 10]) {
      const sub = Object.keys(Object.values(TABLES).find((t) => t.sinif === c.id)!.altSiniflar)[0];
      const s = sheet({ classId: c.id, level, ...(gender ? { gender } : {}), ...(lineageId ? { lineageId } : {}), ...(sub ? { subclassId: sub } : {}) });
      const base = sheetAvatar(s);
      const a = prisonerOutfit(base, s, HAPIS.kostum.sinif);
      expect(a.outfit).toBe('mahkum');
      expect(a.src).toBe(`characters/dragonborn-${gender ?? 'erkek'}-monk-GR.webp`);
      expect(a.tint).toEqual(base.tint);
      expect(a.fallbacks?.[0]).toBe(base.src);
      expectCurrent(a, `mahkum ${c.id}/${gender ?? '-'}/${lineageId ?? '-'}/${level}`, 'monk');
    }
    // Özel avatarda yalnız hale; diğer ırklarda sınıf-genel Keşiş jetonu (değişmedi).
    const own = sheet({ classId: 'fighter', avatar: 'data:image/png;base64,AA' });
    expect(prisonerOutfit(sheetAvatar(own), own, 'monk')).toMatchObject({ src: 'data:image/png;base64,AA', outfit: 'mahkum' });
    const elf = sheet({ raceId: 'elf', classId: 'fighter', gender: 'kadin', level: 5 });
    expect(prisonerOutfit(sheetAvatar(elf), elf, 'monk').src).toBe('characters/elf-female-monk.webp');
  });

  it('Hapishane oturumu: Dragonborn parti üyesi Keşiş Gariban jetonuyla (uçtan uca)', () => {
    const party = partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: i === 0 ? { ...sh, raceId: 'dragonborn', lineageId: 'gold', gender: 'kadin' as const } : sh }));
    const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party, toggles: { irkBaslangic: false } });
    if (!r.ok) throw new Error(r.error);
    const city: SeruvenState = { ...r.state, page: 'bati-kiyisi', at: 'beyaz-sehir', yerlesim: { id: 'beyaz-sehir', map: null, from: null, seen: [] }, gold: 80, potions: 2, items: ['rope'] };
    const jailed = executeSeruven(city, { type: 'hapse_at' } as SeruvenCommand);
    if (!jailed.ok) throw new Error(jailed.error);
    const st = hapisSession(jailed.state, HAPIS.baslangic, () => 0.5)!.state;
    const db = Object.values(st.combatants).find((c) => c.side === 'party' && c.id.startsWith('pc') && c.avatar.src.includes('dragonborn'));
    expect(db?.avatar).toMatchObject({ outfit: 'mahkum', src: 'characters/dragonborn-kadin-monk-GR.webp' });
    expectCurrent(db!.avatar, 'hapis oturumu', 'monk');
  });

  it('eski dosyalar ve veri satırları yok (jeton, küçük kopya, maske, yedek filtre, ölçüm, maske düzeltmesi, kanat kökü, Dungeondex)', () => {
    const old = (set: Set<string>) => [...set].filter((f) => OLD.test(f));
    expect(old(BIG)).toEqual([]);
    expect(old(SMALL)).toEqual([]);
    expect(old(MASK)).toEqual([]);
    for (const d of [filtreYedek, filtreAday]) expect(Object.keys(d.soylar).filter((k) => k.startsWith('dragonborn/'))).toEqual([]);
    expect(Object.keys(maskeRapor.sprites).filter((k) => OLD.test(k))).toEqual([]);
    expect(Object.keys(olcum.races)).not.toContain('dragonborn');
    expect(Object.keys(soyRenkleri.maskFix).filter((k) => OLD.test(k))).toEqual([]);
    expect(Object.keys(kanatKok.sinif).filter((k) => k.endsWith('-genel'))).toEqual([]);
    expect(ddEsleme).not.toMatch(OLD);
    // Kalan her Dragonborn jetonunun pul maskesi ve küçük kopyası var.
    const db = [...BIG].filter((f) => f.startsWith('dragonborn-'));
    expect(db.length).toBe(266);
    for (const f of db) { expect(PUL.has(f.replace('.webp', '.png')), f).toBe(true); expect(SMALL.has(f), f).toBe(true); }
  });
});
