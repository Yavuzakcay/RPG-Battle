/** KQ6-12: Celestial halesiz varyantları: her jeton ya halesiz dosyaya sahip ya da `bekleyen` (elle karar) listesinde; yalnız dosya adları. */
import { describe, expect, it } from 'vitest';
import halesiz from '../../data/hale-halesiz.json';
import elle from '../../data/hale-elle.json';

const files = (g: Record<string, unknown>, strip: RegExp) => new Set(Object.keys(g).map((k) => k.replace(strip, '').split('/').pop() as string));
const main = files(import.meta.glob('../../public/characters/celestial-*.webp'), /\.webp$/);
const free = files(import.meta.glob('../../public/characters/halesiz/celestial-*.webp'), /\.webp$/);
const small = files(import.meta.glob('../../public/characters/halesiz/kucuk/celestial-*.webp'), /\.webp$/);

describe('halesiz Celestial varyantları (KQ6-12)', () => {
  it('288 jeton (264 alt sınıf/genel + 24 Gariban -GR): her biri halesiz varyanta (+ küçük kopya) sahip ya da bekleyen listesinde; ikisi birden değil', () => {
    expect(main.size).toBe(288);
    const hold = new Set(halesiz.bekleyen);
    for (const n of main) expect(free.has(n) !== hold.has(n), n).toBe(true);
    expect(free.size + hold.size).toBe(288);
    expect([...free].sort()).toEqual([...small].sort());
    for (const h of hold) expect(main.has(h), h).toBe(true);
  });
  it('elle karar dosyası: bekleyen listesi hale-halesiz ile aynı; Paladin ID8 ve Warlock WL-3 Gemini bekliyor; Barbarian ID1 ve Bard ID5 çizim kararı', () => {
    expect(Object.keys(elle.bekleyen).sort()).toEqual([...halesiz.bekleyen].sort());
    for (const k of ['paladin-ID8', 'warlock-WL-3']) expect((elle.kararlar as Record<string, { karar: string }>)[k]?.karar).toBe('gemini');
    for (const k of ['barbarian-ID1', 'bard-ID5']) expect((elle.kararlar as Record<string, { karar: string }>)[k]?.karar).toBe('ciz');
    for (const n of ['celestial-erkek-paladin-ID8', 'celestial-erkek-warlock-WL-3']) expect(halesiz.bekleyen).toContain(n);
  });
});
