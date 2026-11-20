/**
 * SD5: kanat palet filtresi (yalnız görünüm): kanat görselinin parlaklığı gölge→ışık rengine eşlenir; alfa değişmez, yani kanat
 * opak kalır. SVG içinde `<defs>`, HTML'de gizli bir SVG içinde kullanılır; `filter: url(#kimlik)`.
 */
import { memo } from 'react';
import { allWingPalettes, wingFilterId, wingFilterTables, wingLumaMatrix, type WingPalet } from './lineageLook';

export function WingFilterDefs({ palet }: { palet: WingPalet }) {
  const t = wingFilterTables(palet);
  return (
    <defs>
      <filter id={wingFilterId(palet)} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        {/* KW1: parlaklık; `esik` varsa eşikten germe (açık kanat görseli palet aralığını tam kullanır), yoksa düz luma */}
        <feColorMatrix type="matrix" values={wingLumaMatrix(palet)} />
        <feComponentTransfer>
          <feFuncR type="table" tableValues={t.r} /><feFuncG type="table" tableValues={t.g} /><feFuncB type="table" tableValues={t.b} />
        </feComponentTransfer>
      </filter>
    </defs>
  );
}

/**
 * Bütün palet filtrelerinin tek, her zaman görünür tanımı: uygulama kökünde, DOM'da en önce (`App`). Her kanat kendi `<defs>`'ini de
 * taşır, yani aynı kimlik birçok yerde tanımlıdır ve `url(#kimlik)` ağaç sırasındaki İLK öğeye gider. İlk kopya `display:none` bir
 * kapsayıcıdaysa (karakter sihirbazının mobil önizlemesi masaüstünde gizli ve içerikte önce gelir) Firefox filtreyi uygulamaz
 * (Gecko hatası 376027) ve kanat taban görselin beyaz-gri hâliyle çizilir. Burada ilk kopya `display:none` değil, 0×0 ve mutlak konumlu
 * bir SVG'de durur; Chromium ve Firefox ikisi de kullanır.
 */
export const WingFilterHost = memo(function WingFilterHost() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" data-wing-filters="">
      {allWingPalettes().map((p) => <WingFilterDefs key={wingFilterId(p)} palet={p} />)}
    </svg>
  );
});
