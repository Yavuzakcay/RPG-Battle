/**
 * Kuyruk 18b: yüzey × yüzey etkileşimleri için sim duman testi: hazır yüzeyli ve sulu haritalarda 30 tohum (kural
 * sürümü 15, bütün etkileşimler açık); çökme yok, savaş biter ya da tur sınırına ulaşır.
 */
import { describe, expect, it } from 'vitest';
import { SCENARIOS, simulate } from './balance';

describe('K18b: yüzey etkileşimleri sim duman testi', () => {
  it('30 tohum (üç harita × 10): çökme yok', () => {
    const want = ['ortamlar-diyari', 'orman-yolu', 'col'];
    const list = want.map((id) => SCENARIOS.find((x) => x.map?.mapId === id)).filter((x) => !!x);
    expect(list.length).toBeGreaterThan(0);
    let runs = 0;
    for (const sc of list) for (let seed = 1; runs < 30 && seed <= Math.ceil(30 / list.length); seed++) {
      const r = simulate(sc!, seed, 12, 3);
      expect(['party', 'enemies', 'timeout']).toContain(r.winner);
      runs++;
    }
    expect(runs).toBe(30);
  }, 300_000);
});
