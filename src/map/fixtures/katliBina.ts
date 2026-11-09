/**
 * Kuyruk K72 test fikstürü: iki katlı küçük bina ("katli-bina", 15×7). Katalogda (harita/<bolge>/) yer almaz; testler zemin
 * harflerini ve `dikey` verisini savaş durumuna ezme olarak koyar (`MapState.tiles`, `MapState.dikey`). Düzen (0 tabanlı):
 * - 3–9. sütun, 1–5. satır: taş duvarlı bina (`s`), doğu duvarında kapı aralığı (9, 3) `o`.
 * - İç: 4–8. sütun, 2–4. satır (15 altıgen). Üst kat döşemesi 10 ft (alt katın tavanı).
 * - Merdiven (4, 2): zemin ↔ üst kat (yürüyerek, 5 ft = 1 altıgen). Delik (8, 4): döşemesiz açıklık (uçan geçer, üstten düşülür).
 */
import type { MapDikey, RawMap } from '../maps';

export const KATLI_BINA_TILES = [
  '...............',
  '...sssssss.....',
  '...s.....s.....',
  '...s.....o.....',
  '...s.....s.....',
  '...sssssss.....',
  '...............',
];

const IC = [4, 5, 6, 7, 8].flatMap((c) => [2, 3, 4].map((r) => `${c},${r}`));

export const KATLI_BINA_DIKEY: MapDikey = {
  harfFt: { s: 20 },
  katlar: [{ id: 'ust', ad: 'Üst kat', en: 'Upper floor', ft: 10, altigenler: IC, merdiven: ['4,2'], delik: ['8,4'] }],
};

export const KATLI_BINA: RawMap = {
  id: 'katli-bina',
  name: 'Katlı bina (test)',
  environmentId: 'yeralt-ma-ara',
  orientation: 'flat-top',
  offset: 'odd-q',
  size: { cols: 15, rows: 7 },
  hexFeet: 5,
  tiles: KATLI_BINA_TILES,
  startZones: { players: { colRange: [1, 2] }, enemies: { colRange: [12, 14] } },
  variants: [{ id: 'varsayilan', name: 'Bina', image: 'maps/yeralti/yeralti-zindan.webp', rules: [], dikey: KATLI_BINA_DIKEY }],
};
