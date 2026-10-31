/** Kuyruk 14 SP1: sprite eşlemesi. Görsel dosyası okunmaz; yalnızca adlar ve seçim kuralı. */
import { describe, expect, it } from 'vitest';
import esleme from '../../data/sprite-esleme.json';
import mevcut from '../../data/sprite-mevcut.json';
import { burstSprite, hexHash, mappedSpriteNames, objectSprite, pickWeighted, resolveSprite, variantsOf, zoneKey, zoneLook, zoneSprite } from './sprites';

describe('sprite eşlemesi', () => {
  it('zorunlu yüzeyler ve nesneler eşlemede; adlar kurala uyuyor', () => {
    const z = Object.values(esleme.zones).map((e) => e.tr);
    for (const need of ['sis', 'ağ', 'gres', 'yağ', 'alev', 'buhar', 'buz', 'su', 'zehir bulutu']) expect(z).toContain(need);
    expect(esleme.effects.patlama.sprites).toEqual(['yuzey-patlama']);
    expect(Object.keys(esleme.objects)).toEqual(['oilBarrel', 'powderKeg']);
    for (const n of mappedSpriteNames()) expect(n).toMatch(/^(yuzey|nesne)-[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('K15C: depodaki her sprite eşlemede; zorunlu türlerin hepsi gerçek dosyaya çözülür', () => {
    const have = new Set(mevcut.sprites);
    const mapped = new Set(mappedSpriteNames().map((n) => resolveSprite(n, have)).filter(Boolean));
    for (const n of mevcut.sprites) expect(mapped.has(n), n).toBe(true);
    for (const key of ['spells:fog-cloud', 'spells:web', 'spells:grease', 'surface:oil', 'surface:fire', 'surface:steam', 'surface:ice', 'surface:water', 'surface:poison'])
      expect(zoneLook(key.startsWith('surface:') ? { spellId: key, surface: key.slice(8) as 'oil' } : { spellId: key }, [{ col: 1, row: 1 }]), key).not.toBeNull();
    expect(objectSprite('oilBarrel', { col: 1, row: 1 })?.name).toBe('nesne-varil');
    expect(objectSprite('powderKeg', { col: 1, row: 1 })?.name).toBe('nesne-barut-varili');
    expect(burstSprite()?.name).toBe('yuzey-patlama');
  });
  it('K15C: eksiz ad ile -1 aynı varyant; dosya yoksa null (yer tutucu)', () => {
    expect(resolveSprite('yuzey-sis', new Set(['yuzey-sis-1']))).toBe('yuzey-sis-1');
    expect(resolveSprite('yuzey-sis-1', new Set(['yuzey-sis']))).toBe('yuzey-sis');
    expect(resolveSprite('yuzey-sis-2', new Set(['yuzey-sis']))).toBeNull();
    expect(zoneSprite({ spellId: 'surface:oil', surface: 'oil' }, { col: 1, row: 1 }, new Set())).toBeNull();
    expect(zoneLook({ spellId: 'fog-cloud' }, [{ col: 0, row: 0 }], new Set())).toBeNull();
    expect(objectSprite('oilBarrel', { col: 1, row: 1 }, new Set())).toBeNull();
  });
  it('K15C: ağırlıklı seçim deterministik; su-3 ağırlığı 0,3 (≈%13)', () => {
    const water = variantsOf((esleme.zones as Record<string, Parameters<typeof variantsOf>[0]>)['surface:water'], new Set(mevcut.sprites));
    expect(water.find((v) => v.name === 'yuzey-su-3')?.weight).toBe(0.3);
    const counts: Record<string, number> = {};
    for (let c = 0; c < 60; c++) for (let r = 0; r < 40; r++) {
      const n = zoneSprite({ spellId: 'surface:water', surface: 'water' }, { col: c, row: r })!.name;
      counts[n] = (counts[n] ?? 0) + 1;
    }
    const share = (counts['yuzey-su-3'] ?? 0) / 2400;
    expect(share).toBeGreaterThan(0.08);
    expect(share).toBeLessThan(0.19);
    expect(pickWeighted([{ name: 'a', weight: 1 }, { name: 'b', weight: 0 }], 99999)).toBe('a');
    expect(pickWeighted([], 1)).toBeNull();
  });
  it('K15C: alan düzeni altıgen başına deterministik; alev dik durur ve varyant döngüsü taşır, buhar-2 yükselir', () => {
    const hexes = Array.from({ length: 12 }, (_, i) => ({ col: i, row: i % 5 }));
    const fire = zoneLook({ spellId: 'surface:fire', surface: 'fire' }, hexes)!;
    expect(fire).toEqual(zoneLook({ spellId: 'surface:fire', surface: 'fire' }, hexes));
    expect(fire.anim).toBe('flicker');
    for (const p of fire.patches) { expect(p.rot).toBe(0); expect(p.cycle.length).toBe(3); expect(p.cycle[0]).toBe(p.name); }
    const fog = zoneLook({ spellId: 'fog-cloud' }, hexes)!;
    expect(fog.soft).toBe(true);
    expect(fog.scale).toBeGreaterThanOrEqual(1.4);
    expect(fog.scale).toBeLessThanOrEqual(1.8);
    expect(new Set(fog.patches.map((p) => p.rot)).size).toBeGreaterThan(1);
    const steam = zoneLook({ spellId: 'surface:steam', surface: 'steam' }, Array.from({ length: 30 }, (_, i) => ({ col: i, row: 2 })))!;
    for (const p of steam.patches) expect(p.anim).toBe(p.name === 'yuzey-buhar-2' ? 'rise' : 'drift');
  });
  it('varsa ayarlarıyla; varyant altıgen başına deterministik, yalnızca mevcut varyantlar', () => {
    const have = new Set(['yuzey-gres-1', 'yuzey-gres-3', 'nesne-varil']);
    expect(zoneKey({ spellId: 'grease' })).toBe('spells:grease');
    const a = zoneSprite({ spellId: 'grease' }, { col: 4, row: 2 }, have);
    expect(a && ['yuzey-gres-1', 'yuzey-gres-3'].includes(a.name)).toBe(true);
    expect(zoneSprite({ spellId: 'grease' }, { col: 4, row: 2 }, have)).toEqual(a);
    const names = new Set(Array.from({ length: 40 }, (_, i) => zoneSprite({ spellId: 'grease' }, { col: i, row: i % 7 }, have)?.name));
    expect(names).toEqual(new Set(['yuzey-gres-1', 'yuzey-gres-3']));
    expect(zoneSprite({ spellId: 'fog-cloud' }, { col: 0, row: 0 }, new Set(['yuzey-sis']))).toEqual({ name: 'yuzey-sis', opacity: 0.75, scale: 1.7 });
    expect(objectSprite('oilBarrel', { col: 0, row: 0 }, have)?.name).toBe('nesne-varil');
    expect(hexHash({ col: 3, row: 5 })).toBe(hexHash({ col: 3, row: 5 }));
  });
});
