/**
 * Kuyruk 26 test fikstürü: yükseklik katmanlı sahne ("yukseklik-sahnesi", 15×7). Katalogda (harita/<bolge>/) yer almaz;
 * testler `vi.mock('../map/maps', …withYukseklik…)` ile kullanır. Düzen (0 tabanlı sütun):
 * - 4. sütun satır 0–2: sırt (seviye 1; iki yanından görüşü keser).
 * - 7–9. sütun satır 1–5: plato (seviye 2; çevresi 2 seviyelik uçurum). Satır 0 ve 6 düz geçit.
 * - (6, 3): rampa (seviye 2, `ramps` listesinde): zeminden platoya normal maliyetle.
 */
import type { RawMap } from '../maps';

const row = (lv: Record<number, number>) => Array.from({ length: 15 }, (_, c) => lv[c] ?? 0);

export const YUKSEKLIK_SAHNESI: RawMap = {
  id: 'yukseklik-sahnesi',
  name: 'Yükseklik sahnesi',
  environmentId: 'da-u-urum',
  orientation: 'flat-top',
  offset: 'odd-q',
  size: { cols: 15, rows: 7 },
  hexFeet: 5,
  tiles: Array.from({ length: 7 }, () => '...............'),
  heights: [
    row({ 4: 1 }),
    row({ 4: 1, 7: 2, 8: 2, 9: 2 }),
    row({ 4: 1, 7: 2, 8: 2, 9: 2 }),
    row({ 6: 2, 7: 2, 8: 2, 9: 2 }),
    row({ 7: 2, 8: 2, 9: 2 }),
    row({ 7: 2, 8: 2, 9: 2 }),
    row({}),
  ],
  ramps: [[7, 4]],
  startZones: { players: { colRange: [1, 3] }, enemies: { colRange: [8, 10] } },
  variants: [{ id: 'varsayilan', name: 'Sahne', image: 'maps/dag/dag-klasik.webp', rules: [] }],
  mirrorable: false,
};

type MapsModule = typeof import('../maps');

export function withYukseklik(orig: MapsModule): MapsModule {
  const loaded = orig.loadMap(YUKSEKLIK_SAHNESI);
  return {
    ...orig,
    getMap: (id, opts = {}) => (id === YUKSEKLIK_SAHNESI.id ? loaded : orig.getMap(id, opts)),
    resolveMapChoice: (id, variantId) => (id === YUKSEKLIK_SAHNESI.id ? { id, variantId: 'varsayilan' } : orig.resolveMapChoice(id, variantId)),
  };
}
