/** Çılgın Yol (Berserker, Frenzy) öfke efekti: yalnız `frenzy` + etkin Rage; renk pembe/magenta değil; kural verisi değişmez (yalnız görünüm). */
import { describe, expect, it } from 'vitest';
import { filterStyle, tokenFilters } from './statusFx';
import baglama from '../../data/efekt-baglama.json';

const base = { conditions: [] as string[], life: 'alive' as const, exhaustion: 0 };
const rage = { refreshed: false, added: [] as string[] };
describe('öfke efekti', () => {
  it('yalnız frenzy alt sınıfı ve Rage etkinken; kapalıyken ve başka alt sınıfta yok', () => {
    expect(tokenFilters({ ...base, frenzy: true, rage } as never)).toContain('rage');
    expect(tokenFilters({ ...base, frenzy: true, rage: null } as never)).not.toContain('rage');
    expect(tokenFilters({ ...base, frenzy: true } as never)).not.toContain('rage');
    expect(tokenFilters({ ...base, rage } as never)).not.toContain('rage');
  });
  it('kontur koyu kırmızı-turuncu (veriden), magenta/pembe değil', () => {
    const css = filterStyle(['rage']).filter;
    const O = baglama.jeton.ofke;
    expect(css).toContain(O.kontur); expect(css).toContain(O.parilti);
    for (const hex of [O.kontur, O.parilti, ...O.alevler]) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      expect(r! > g! * 1.5 && r! > b! * 1.5, hex).toBe(true); // kırmızı/turuncu baskın; mor/pembe (b yüksek) yok
    }
  });
});
