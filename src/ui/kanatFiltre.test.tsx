/**
 * Kanat palet filtresi ev sahibi (yalnız görünüm; kural ve kayıt sürümü değişmez). Her kanat kendi `<defs>`'ini taşır, yani aynı filtre
 * kimliği sayfada birçok yerde tanımlıdır ve `url(#kimlik)` ağaç sırasındaki İLK öğeye gider. İlk kopya `display:none` bir kapsayıcıdaysa
 * (karakter sihirbazının mobil önizlemesi masaüstünde gizli ve içerikte masaüstü önizlemesinden önce gelir) Firefox filtreyi uygulamaz
 * (Gecko hatası 376027) ve kanat taban görselin beyaz-gri hâliyle çizilir. `WingFilterHost` her paleti bir kez, görünür bir SVG'de ve
 * `App`'te en önce tanımlar; böylece ilk kopya her tarayıcıda kullanılır.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WingFilterHost } from './WingFilter';
import { allWingPalettes, lineageLook, wingFilterId, type WingPalet } from './lineageLook';
import kanat from '../../data/kanat-esleme.json';
import appSrc from '../App.tsx?raw';

const SLOTS = kanat.slotlar as unknown as Record<string, { palet?: WingPalet; renkPaletleri?: Record<string, unknown> }>;

describe('kanat filtre ev sahibi: paletlerin tek listesi', () => {
  it('kimliğe göre tekil; slot paletleri listede', () => {
    const list = allWingPalettes();
    expect(list.length).toBeGreaterThan(0);
    expect(new Set(list.map(wingFilterId)).size).toBe(list.length);
    const ids = new Set(list.map(wingFilterId));
    for (const [slot, w] of Object.entries(SLOTS)) if (w.palet) expect(ids.has(wingFilterId(w.palet)), slot).toBe(true);
  });
  it('Dragonborn: 10 soyun taban, zar ve pençe paletleri (çözücünün ürettiği her palet) listede', () => {
    const ids = new Set(allWingPalettes().map(wingFilterId));
    const soylar = Object.keys(SLOTS.dragonborn!.renkPaletleri!);
    expect(soylar).toHaveLength(10);
    for (const soy of soylar) {
      const wing = lineageLook({ raceId: 'dragonborn', lineageId: soy, level: 5 }, { ability: true }).wing!;
      expect(wing.katmanlar?.map((k) => k.ad), soy).toEqual(['zar', 'pence']);
      for (const p of [wing.palet!, ...wing.katmanlar!.map((k) => k.palet)]) expect(ids.has(wingFilterId(p)), `${soy} ${wingFilterId(p)}`).toBe(true);
    }
  });
});

describe('kanat filtre ev sahibi: görünür tek tanım', () => {
  const html = renderToStaticMarkup(<WingFilterHost />);
  it('her paletin süzgeci tam bir kez tanımlı', () => {
    for (const p of allWingPalettes()) expect(html.match(new RegExp(`<filter id="${wingFilterId(p)}"`, 'g')), wingFilterId(p)).toHaveLength(1);
  });
  it('SVG görünür sayılır: 0×0 ve mutlak konumlu, display:none yok (Firefox display:none altındaki filtreyi uygulamaz)', () => {
    expect(html).toMatch(/^<svg width="0" height="0"/);
    expect(html).toContain('position:absolute');
    expect(html).not.toMatch(/display:\s*none/);
  });
});

describe('kanat filtre ev sahibi: uygulama kökünde en önce', () => {
  it('App içe aktarır ve ilk çocuk olarak çizer (MenuBackground ve ekranlardan önce: kopyalar arasında ilk sıra onun)', () => {
    expect(appSrc).toContain("import { WingFilterHost } from './ui/WingFilter'");
    const i = appSrc.indexOf('<WingFilterHost />');
    expect(i).toBeGreaterThan(-1);
    expect(i).toBeLessThan(appSrc.indexOf('<MenuBackground />'));
    expect(i).toBeLessThan(appSrc.indexOf('<Screens '));
  });
});
