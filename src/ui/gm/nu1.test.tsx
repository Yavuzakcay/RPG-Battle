/** Kuyruk KQ5 NU1: tek Nesne paneli (katalog, kategori, arama, ipucu), nesne kartı (ağırlık, Türkçe açıklama, hedef yap). */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { catalog, categoriesOf, peopleHint, OBJECT_CATEGORIES } from './objectCatalog';
import { ObjectPanel } from './ObjectPanel';
import { ObjectCard, objectDescription } from './ObjectCard';
import { OBJECT_KINDS } from '../../battle/objectData';
import type { MapObject } from '../../battle/types';
import { setLang } from '../../i18n';

const ob = (kind: MapObject['kind'], extra: Partial<MapObject> = {}): MapObject => ({ id: `${kind}:1`, kind, at: { col: 1, row: 1 }, hp: 10, ...extra });

describe('NU1 katalog', () => {
  it('her tür en az bir kategoride; kategori çipleri doğru süzer', () => {
    for (const k of OBJECT_KINDS) expect(categoriesOf(k).length, k).toBeGreaterThan(0);
    const bykat = (c: (typeof OBJECT_CATEGORIES)[number]) => catalog({ category: c }).map((x) => x.kind);
    expect(bykat('silah')).toContain('sword'); expect(bykat('silah')).toContain('cudgel');
    expect(bykat('buyulu').sort()).toEqual(['amulet', 'potion', 'ring', 'wand']);
    expect(bykat('dekor')).toContain('statue');
    expect(bykat('tasinabilir')).toEqual(expect.arrayContaining(['chest', 'sword', 'potion']));
    expect(bykat('mekanik')).toEqual(expect.arrayContaining(['door', 'lever']));
    expect(bykat('mekanik')).not.toContain('chest');
  });
  it('arama ad (TR/EN) ya da kimlikle, büyük-küçük harf duyarsız', () => {
    expect(catalog({ query: 'LONGSWORD' }).map((c) => c.kind)).toEqual(['sword']);
    expect(catalog({ query: 'sandık' }).map((c) => c.kind)).toContain('chest');
    expect(catalog({ query: 'ring of' }).map((c) => c.kind)).toEqual(['ring']);
    expect(catalog({ query: 'yokböyle' })).toEqual([]);
    expect(catalog({ category: 'buyulu', query: 'wand' }).map((c) => c.kind)).toEqual(['wand']);
  });
  it('kart: ağırlık ve "1 kişi / 2+ kişi" ipucu', () => {
    expect(peopleHint(25)).toBe(1); expect(peopleHint(150)).toBe(1); expect(peopleHint(151)).toBe(2);
    const statue = catalog().find((c) => c.kind === 'statue')!;
    expect(statue.weight).toBe(600); expect(statue.people).toBe(2);
    expect(catalog().find((c) => c.kind === 'chest')?.people).toBe(1);
    expect(catalog().find((c) => c.kind === 'door')?.weight).toBeNull();
  });
});

describe('NU1 panel ve kart çizimi', () => {
  it('panel: arama kutusu, kategori çipleri, kartlarda simge/ad (İngilizce)/ağırlık/kişi ipucu; ayrı Ağırlık aracı yok', () => {
    const html = renderToStaticMarkup(createElement(ObjectPanel, { pick: 'inspect', onPick: () => {}, onClose: () => {} }));
    for (const s of ['Ara', 'Hepsi', 'Taşınabilir', 'Dekor', 'Silah', 'Büyülü eşya', 'Kapı/Mekanik', 'Longsword', 'Statue', '600 lb', '2+ kişi', '1 kişi', 'Bitti', 'Kilitli kapı']) expect(html).toContain(s);
    expect(html).not.toContain('⚖'); expect(html).not.toContain('Ağırlık aracı');
  });
  it('seçili kart vurgulu ve yerleştirme ipucu gösterir', () => {
    const html = renderToStaticMarkup(createElement(ObjectPanel, { pick: { kind: 'sword' }, onPick: () => {}, onClose: () => {} }));
    expect(html).toContain('object-card on'); expect(html).toContain('haritada bir altıgene dokun');
  });
  it('nesne kartı: ad İngilizce, Türkçe açıklama (büyülü eşya), ağırlık − / sayı / +, varsayılana dön, Kaldır, Hedef yap (kurulumda)', () => {
    expect(objectDescription('ring')).toContain('AC');
    expect(objectDescription('chest')).toBeUndefined();
    const html = renderToStaticMarkup(createElement(ObjectCard, { obj: ob('ring'), weightOn: true, goalKinds: ['protect', 'destroy', 'retrieve'], onWeight: () => {}, onRemove: () => {}, onGoal: () => {}, onClose: () => {} }));
    for (const s of ['Ring of Protection', 'Takınca', 'Ağırlık', 'aria-label="Azalt"', 'aria-label="Artır"', 'Varsayılana dön', 'Kaldır', 'Hedef yap', 'Koru', 'Yok et', 'Al ve çıkar']) expect(html).toContain(s);
    const noGoal = renderToStaticMarkup(createElement(ObjectCard, { obj: ob('chest'), weightOn: true, onWeight: () => {}, onRemove: () => {}, onClose: () => {} }));
    expect(noGoal).not.toContain('Hedef yap'); expect(noGoal).toContain('Açıklama yok');
    const old = renderToStaticMarkup(createElement(ObjectCard, { obj: ob('chest'), weightOn: false, onWeight: () => {}, onRemove: () => {}, onClose: () => {} }));
    expect(old).not.toContain('Ağırlık'); // eski sürüm (79): ağırlık yok
  });
  it('ağırlık değeri karttan okunur: GM ezmesi gösterilir', () => {
    const html = renderToStaticMarkup(createElement(ObjectCard, { obj: ob('chest', { agirlikLb: 400 }), weightOn: true, onWeight: () => {}, onRemove: () => {}, onClose: () => {} }));
    expect(html).toContain('value="400"');
  });
  it('EN arayüz', async () => {
    await setLang('en');
    const html = renderToStaticMarkup(createElement(ObjectPanel, { pick: 'inspect', onPick: () => {}, onClose: () => {} }));
    expect(html).toContain('Portable'); expect(html).toContain('2+ people'); expect(html).toContain('Search');
    await setLang('tr');
  });
});
