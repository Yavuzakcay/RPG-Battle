/** Kuyruk 14 SP1: sprite eşlemesi. Görsel dosyası okunmaz; yalnızca adlar ve seçim kuralı. */
import { describe, expect, it } from 'vitest';
import esleme from '../../data/sprite-esleme.json';
import mevcut from '../../data/sprite-mevcut.json';
import { hexHash, mappedSpriteNames, objectSprite, zoneKey, zoneSprite } from './sprites';

describe('sprite eşlemesi', () => {
  it('zorunlu yüzeyler ve nesneler eşlemede; adlar kurala uyuyor', () => {
    const z = Object.values(esleme.zones).map((e) => e.tr);
    for (const need of ['sis', 'ağ', 'gres', 'yağ', 'alev', 'buhar', 'buz', 'su', 'zehir bulutu']) expect(z).toContain(need);
    expect(esleme.effects.patlama.sprites).toEqual(['yuzey-patlama']);
    expect(Object.keys(esleme.objects)).toEqual(['oilBarrel', 'powderKeg']);
    for (const n of mappedSpriteNames()) expect(n).toMatch(/^(yuzey|nesne)-[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('dosya yoksa null (yer tutucu, görüntü değişmez); depoda sprite yok', () => {
    expect(mevcut.sprites).toEqual([]);
    expect(zoneSprite({ spellId: 'surface:oil', surface: 'oil' }, { col: 1, row: 1 })).toBeNull();
    expect(objectSprite('oilBarrel', { col: 1, row: 1 })).toBeNull();
  });
  it('varsa ayarlarıyla; varyant altıgen başına deterministik, yalnızca mevcut varyantlar', () => {
    const have = new Set(['yuzey-gres-1', 'yuzey-gres-3', 'nesne-varil']);
    expect(zoneKey({ spellId: 'grease' })).toBe('spells:grease');
    const a = zoneSprite({ spellId: 'grease' }, { col: 4, row: 2 }, have);
    expect(a && ['yuzey-gres-1', 'yuzey-gres-3'].includes(a.name)).toBe(true);
    expect(zoneSprite({ spellId: 'grease' }, { col: 4, row: 2 }, have)).toEqual(a);
    const names = new Set(Array.from({ length: 40 }, (_, i) => zoneSprite({ spellId: 'grease' }, { col: i, row: i % 7 }, have)?.name));
    expect(names).toEqual(new Set(['yuzey-gres-1', 'yuzey-gres-3']));
    expect(zoneSprite({ spellId: 'fog-cloud' }, { col: 0, row: 0 }, new Set(['yuzey-sis']))).toEqual({ name: 'yuzey-sis', opacity: 0.7, scale: 1.2 });
    expect(objectSprite('oilBarrel', { col: 0, row: 0 }, have)?.name).toBe('nesne-varil');
    expect(hexHash({ col: 3, row: 5 })).toBe(hexHash({ col: 3, row: 5 }));
  });
});
