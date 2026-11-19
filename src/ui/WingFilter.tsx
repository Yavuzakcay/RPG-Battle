/**
 * SD5: kanat palet filtresi (yalnız görünüm): kanat görselinin parlaklığı gölge→ışık rengine eşlenir; alfa değişmez, yani kanat
 * opak kalır. SVG içinde `<defs>`, HTML'de gizli bir SVG içinde kullanılır; `filter: url(#kimlik)`.
 */
import { wingFilterId, wingFilterTables, wingLumaMatrix, type WingPalet } from './lineageLook';

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
