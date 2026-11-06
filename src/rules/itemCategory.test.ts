/** Kuyruk K49 B6: eşya kategorileri (görünüm): her eşyanın tek türü ve etki seviyesi; sayılar değişmez. */
import { describe, it, expect } from 'vitest';
import { items } from '../data';
import { ITEM_KINDS, itemKind, itemTier } from './itemCategory';

describe('eşya kategorileri', () => {
  it('her eşya bir türe düşer; toplam aynı; örnekler', () => {
    const counts = ITEM_KINDS.map((k) => items.filter((it) => itemKind(it) === k).length);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(items.length);
    const by = (n: string) => items.find((i) => i.name === n);
    const potion = items.find((i) => i.srd.startsWith('magic-items:potion'));
    if (potion) expect(itemKind(potion)).toBe('tuketilebilir');
    const ring = items.find((i) => /^Ring of/.test(i.name));
    if (ring) expect(itemKind(ring)).toBe('aksesuar');
    const gear = items.find((i) => i.srd.startsWith('gear:'));
    if (gear) expect(itemTier(gear)).toBe('siradan');
    void by;
  });
});
