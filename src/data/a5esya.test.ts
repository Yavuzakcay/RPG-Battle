/**
 * Kuyruk A5: eşya sınıflandırması (a savaş dışı, b veriyle tanımlı, c karar bekliyor), Rod of Resurrection tanımı ve
 * eşya kartının kısa özeti. Belge `harita/belgeler/ESYA-SINIFLANDIRMA.md` (`node scripts/a5-esya-siniflandirma.mjs`).
 */
import { describe, expect, it } from 'vitest';
import itemsBase from '../../data/items.json';
import itemsSrd from '../../data/items-srd.json';
import cls from '../../data/esya-siniflandirma.json';
import { itemParts } from '../battle/itemEffects';
import { itemDetail, itemHasMechanic, itemSummary } from '../ui/equipmentText';
import type { Item } from './types';

// test-setup tembel SRD eşyalarını items.json dizisine ekler: kimliğe göre tekilleştir.
const all = [...new Map(([...itemsBase, ...itemsSrd] as unknown as Item[]).map((it) => [it.id, it])).values()];
const karar = cls.karar as Record<string, string>;
const kod = cls.kod as Record<string, string>;
const classOf = (it: Item) => (karar[it.id] ? 'c' : it.offCombat ? 'a' : itemHasMechanic(it) || kod[it.id] ? 'b' : null);

describe('A5 eşya sınıflandırması', () => {
  it('her eşya üç sınıftan birinde; karar listesindekiler veride var', () => {
    expect(all.filter((it) => classOf(it) === null).map((it) => it.id)).toEqual([]);
    const ids = new Set(all.map((it) => it.id));
    for (const id of [...Object.keys(karar), ...Object.keys(cls.a5), ...Object.keys(kod)]) expect(ids.has(id), id).toBe(true);
  });
  it('sayımlar belgeyle tutarlı (a + b + c = toplam)', () => {
    const n: Record<'a' | 'b' | 'c', number> = { a: 0, b: 0, c: 0 };
    for (const it of all) n[classOf(it) as 'a' | 'b' | 'c'] += 1;
    expect(n.a + n.b + n.c).toBe(all.length);
    expect(n.c).toBe(Object.keys(karar).length);
  });
});

describe('A5 Rod of Resurrection', () => {
  it('Heal yüklü büyü, 5 yük; savaş dışı değil', () => {
    const rod = all.find((it) => it.id === 'rod-of-resurrection') as Item;
    expect(rod.offCombat).toBeUndefined();
    const p = itemParts([rod.name], 'p1');
    expect(p.addSpells).toContain('Heal');
    expect(p.addResources['item:rod-of-resurrection']).toBe(5);
  });
});

describe('A5 kısa özet', () => {
  it('büyü/yük, bonus, isabet, kullanım alanları özette; mekaniği olan eşyada "Game Master işler" yok', () => {
    const by = (id: string) => all.find((it) => it.id === id) as Item;
    expect(itemSummary(by('rod-of-resurrection'))).toContain('Heal');
    expect(itemSummary(by('rod-of-resurrection'))).toContain('5');
    expect(itemSummary(by('javelin-of-lightning'))).toContain('4d6');
    expect(itemSummary(by('vorpal-sword'))).toContain('+3');
    expect(itemDetail(by('wand-of-wonder'))).not.toContain('kendiliğinden uygulanmaz');
  });
});
