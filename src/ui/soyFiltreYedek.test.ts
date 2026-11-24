/**
 * GORSEL-DUZELTME: maskesi olmayan jetonun yedek soy filtresi. Seçim (`data/soy-filtre-yedek.json`) adaylarla (`data/soy-filtre-adaylari.json`)
 * tutarlı, soy başına 8 farklı aday; karar veriden (`tintFallbackFilter` anahtarı `<ırk>/<soy>`), kodda ırk adı yok. Çalışma anı kararı
 * (maske yüklenemedi → yedek, maske gelince kendiliğinden yok) tarayıcıda görsel dökümle ölçülür (`npm run gorsel-dokum`).
 */
import { describe, expect, it } from 'vitest';
import adaylar from '../../data/soy-filtre-adaylari.json';
import yedek from '../../data/soy-filtre-yedek.json';
import soyRenkleri from '../../data/soy-renkleri.json';
import { LINEAGE_SKIN, tintFallbackFilter } from './lineageLook';
import { fallbackFilterFor } from './tint';
import tintSrc from './tint.ts?raw';
import lookSrc from './lineageLook.ts?raw';

const A = (adaylar as unknown as { soylar: Record<string, { adaylar: Array<{ id: number; ad: string; filter: string }> }> }).soylar;
const Y = (yedek as unknown as { soylar: Record<string, { aday?: number; filter: string; bekliyor?: true; eski?: true }> }).soylar;

describe('yedek soy filtresi (maske yokken)', () => {
  it('her soyda 8 farklı aday; seçim adayların biri (bekliyorsa ilk aday)', () => {
    expect(Object.keys(A).length).toBeGreaterThan(0);
    for (const [k, a] of Object.entries(A)) {
      expect(a.adaylar.map((x) => x.id), k).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(new Set(a.adaylar.map((x) => x.filter)).size, k).toBe(8);
      const y = Y[k];
      expect(y, k).toBeTruthy();
      expect(a.adaylar.find((x) => x.id === y!.aday)?.filter, k).toBe(y!.filter);
      if (y!.bekliyor) expect(y!.aday).toBe(1);
    }
    // TEN-MASKE-4-IRK: `eski` kayıtlar (Dwarf/Orc'un Kuyruk AS1a bütün-jeton filtresi) adaysız; diğerleri adaylarla birebir.
    expect(Object.keys(Y).filter((k) => !Y[k]!.eski).sort()).toEqual(Object.keys(A).sort());
  });
  it('anahtarlar boyalı soylar (Human ten tonu maskeli: yedek yok)', () => {
    const races = soyRenkleri.races as unknown as Record<string, { lineages?: Record<string, unknown> }>;
    for (const k of Object.keys(Y)) {
      const [race, lin] = k.split('/');
      expect(race).not.toBe('human');
      // TEN-MASKE-4-IRK: rengi soy-ten-renkleri.json'da olan soy da boyalı sayılır (null değil).
      expect(races[race!]?.lineages?.[lin!] || LINEAGE_SKIN[k], k).toBeTruthy();
    }
  });
  it('tintFallbackFilter veriden; soy yoksa boş', () => {
    for (const [k, y] of Object.entries(Y)) {
      const [raceId, lineageId] = k.split('/') as [string, string];
      expect(tintFallbackFilter({ raceId, lineageId })).toBe(y.filter);
    }
    expect(tintFallbackFilter({ raceId: 'human', lineageId: 'outwall' })).toBe('');
    expect(tintFallbackFilter({ raceId: 'goliath' })).toBe('');
    expect(tintFallbackFilter(undefined)).toBe('');
  });
  it('boyama denenmeden yedek yok (karar yalnız başarısız boyamada)', () => {
    const tint = { select: { hMin: 0, hMax: 45, sMin: 0, lMin: 0, lMax: 1 }, to: { lch: { h: 40, c: 38 } } } as never;
    expect(fallbackFilterFor('/characters/olmayan.webp', tint, { raceId: 'goliath', lineageId: 'fire' })).toBe('');
  });
  it('karar kodunda ırk adı yok', () => {
    const body = (src: string, name: string) => src.slice(src.indexOf(name), src.indexOf('\n}', src.indexOf(name)));
    for (const b of [body(tintSrc, 'export function fallbackFilterFor'), body(lookSrc, 'export function tintFallbackFilter')]) {
      for (const race of Object.keys(soyRenkleri.races)) expect(b).not.toContain(`'${race}'`);
    }
  });
});
