// Görev K21: soy maskesi klasörleri (tek yer). Elle maske kaynağı (ELLE) betiklerce yalnızca okunur, asla yazılmaz.
import path from 'node:path';

export const ROOT = path.join(import.meta.dirname ?? '.', '..');
export const CHAR = path.join(ROOT, 'public/characters');
/** Kullanıcının çizdiği elle maskeler (yalnızca okunur). */
export const ELLE = path.join(ROOT, 'assets/soy-maske-el');
/** Otomatik maskeler (npm run soy-maske yazar). */
export const OTO = path.join(CHAR, 'maske');
/** Doğrulanmış elle maskelerin çalışma anı kopyası (gri ağırlık; betik yazar). */
export const EL_KOPYA = path.join(CHAR, 'maske-el');
export const RAPOR = path.join(ROOT, 'data/soy-maske-rapor.json');
export const INCELE = path.join(ROOT, 'docs/sabah/soy-inceleme');
