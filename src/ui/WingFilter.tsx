/**
 * SD5: kanat palet filtresi (yalnız görünüm): kanat görselinin parlaklığı gölge→ışık rengine eşlenir; alfa değişmez, yani kanat
 * opak kalır. SVG içinde `<defs>`, HTML'de gizli bir SVG içinde kullanılır; `filter: url(#kimlik)`.
 */
import { wingFilterId, wingFilterTables, type WingPalet } from './lineageLook';

export function WingFilterDefs({ palet }: { palet: WingPalet }) {
  const t = wingFilterTables(palet);
  return (
    <defs>
      <filter id={wingFilterId(palet)} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
        <feComponentTransfer>
          <feFuncR type="table" tableValues={t.r} /><feFuncG type="table" tableValues={t.g} /><feFuncB type="table" tableValues={t.b} />
        </feComponentTransfer>
      </filter>
    </defs>
  );
}
