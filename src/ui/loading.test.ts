/** Görev I: küçük karakter jetonları ve menü arka planı dosyaları (yalnızca dosya adları; resimler yüklenmez). */
import { describe, it, expect } from 'vitest';
import { blankCharacter } from '../rules/builder';
import { sheetAvatar } from '../battle';
import { badgeChain, thumbOf } from './Avatar';
import { menuBackgroundSources } from './MenuBackground';

const big = Object.keys(import.meta.glob('/public/characters/*.webp')).map((f) => f.split('/').pop()).sort();
const small = Object.keys(import.meta.glob('/public/characters/kucuk/*.webp')).map((f) => f.split('/').pop()).sort();
const acilis = new Set(Object.keys(import.meta.glob('/public/acilis/*')).map((f) => `acilis/${f.split('/').pop()}`));

describe('küçük karakter jetonları', () => {
  it('her karakter jetonunun 96 px kopyası var (npm run karakter-kucuk)', () => {
    // KQ6-14 (kesim sonrası sayı güncellemesi): + 240 Gariban (<irk>-<cinsiyet>-<sınıf>-GR, 10 ırk × 2 cinsiyet × 12 sınıf) + 210 Dragonborn alt sınıf (11 sınıf) + 30 Wizard Dragonborn (WZ-A/B); Hızır (Paladin ID10, 18) mevcut dosyaların yerine yazıldı
    // DRAGONBORN-ESKI-JETON-KALDIR (2026-11-22): Dragonborn'un 24 sınıf-genel jetonu kaldırıldı (240 → 216 sınıf-genel; toplam 2900 → 2876).
    expect(big.length).toBe(216 + 270 + 1890 + 240 + 210 + 30 + 20); // 216 sınıf-genel + 270 Wizard (WZ-KESIM) + 1890 alt sınıf jetonu (TOPLU-KESIM: warlock 198, sorcerer 162, barbarian/bard/cleric/ranger 162'şer, druid 135, fighter 189, monk 198, paladin 180, rogue 180); + 20 Gladyatör (CC 2026-11-19, fighter ID12)
    expect(small).toEqual(big);
  });
  it('rozet 48 px ve altında önce küçük kopya, sonra asıl görsel; büyükte yalnızca asıl', () => {
    const a = sheetAvatar({ ...blankCharacter('t').sheet, raceId: 'elf', classId: 'wizard', gender: 'kadin', level: 3 });
    expect(thumbOf(a.src)).toBe('characters/kucuk/elf-female-wizard.webp');
    expect(badgeChain(a, 44).slice(0, 2)).toEqual(['characters/kucuk/elf-female-wizard.webp', 'characters/elf-female-wizard.webp']);
    expect(badgeChain(a, 56)[0]).toBe('characters/elf-female-wizard.webp');
    expect(thumbOf('monsters/troll.webp')).toBe(null);
  });
});

describe('menü arka planı dosyaları', () => {
  it('her ekran ve tema için WebM, MP4 ve poster var', () => {
    for (const portrait of [false, true]) for (const dark of [false, true]) {
      const s = menuBackgroundSources({ portrait, dark, motion: true });
      expect(acilis.has(s.poster)).toBe(true);
      expect(acilis.has(s.video!.webm)).toBe(true);
      expect(acilis.has(s.video!.mp4)).toBe(true);
    }
  });
});
