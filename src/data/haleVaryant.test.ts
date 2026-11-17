/** KQ6-19: Celestial jetonlar: ya halesiz sprite (yıldız tacı oyunda çizilir; konum `data/hale-konum.json`) ya da sanat halesi kalan bekleyen jeton (taç yok). Yalnız dosya adları ve veri. */
import { describe, expect, it } from 'vitest';
import bekleyen from '../../data/hale-halesiz.json';
import konum from '../../data/hale-konum.json';
import elle from '../../data/hale-elle.json';
import { crownKey } from '../ui/haloCrown';

const names = (g: Record<string, unknown>) => new Set(Object.keys(g).map((k) => k.replace(/\.webp$/, '').split('/').pop() as string));
const main = names(import.meta.glob('../../public/characters/celestial-*.webp'));
const small = names(import.meta.glob('../../public/characters/kucuk/celestial-*.webp'));
const halesizDir = names(import.meta.glob('../../public/characters/halesiz/*.webp'));

describe('Celestial yıldız tacı verisi (KQ6-19)', () => {
  it('288 jeton: halesiz sprite ya da bekleyen; her halesiz jetonun konumu (varsayılan grup ya da jeton kaydı) var; eski halesiz klasörü kalktı', () => {
    expect(main.size).toBe(288);
    expect(halesizDir.size).toBe(0);
    const hold = new Set(bekleyen.bekleyen);
    for (const h of hold) expect(main.has(h), h).toBe(true);
    const free = [...main].filter((n) => !hold.has(n));
    expect(free.length + hold.size).toBe(288);
    const def = konum.varsayilan as Record<string, { x: number; y: number; olcek: number }>; const ovr = konum.jeton as Record<string, unknown>;
    for (const n of free) {
      const name = n.replace(/^celestial-/, ''); const k = crownKey(name);
      expect(ovr[name] ?? (k ? def[k] : undefined), n).toBeTruthy();
    }
    for (const k of Object.keys(ovr)) expect(main.has(`celestial-${k}`), k).toBe(true);
  });
  it('96 px kopyaları var; elle karar dosyası bekleyen listesiyle aynı; Paladin ID8 ve Warlock WL-3 Gemini bekliyor', () => {
    for (const n of main) expect(small.has(n), n).toBe(true);
    expect(Object.keys(elle.bekleyen).sort()).toEqual([...bekleyen.bekleyen].sort());
    for (const n of ['celestial-erkek-paladin-ID8', 'celestial-erkek-warlock-WL-3']) expect(bekleyen.bekleyen).toContain(n);
  });
});
