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
    expect(big.length).toBe(240);
    expect(small).toEqual(big);
  });
  it('rozet 48 px ve altında önce küçük kopya, sonra asıl görsel; büyükte yalnızca asıl', () => {
    const a = sheetAvatar({ ...blankCharacter('t').sheet, raceId: 'elf', classId: 'wizard', gender: 'kadin' });
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
