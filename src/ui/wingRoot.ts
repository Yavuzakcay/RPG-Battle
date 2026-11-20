/**
 * KW1 (yalnız görünüm): Dragonborn kanat kökü. Kanat jetonun ARKASINDA, kökü gövde siluetinin omuz–dirsek bandında sol/sağ kenarının biraz
 * İÇİNDE; tek çözücü: rozet (`AvatarBadge`) ve savaş jetonu/karakter figürü (`AvatarCircle` → `TokenFigure`) aynı kökü kullanır.
 * Konum `data/dragonborn-kanat-kok.json` (tembel, `wingData.ts`) (jeton uzayı 256 px; üretici scripts/dragonborn-kanat-kok.py): sınıf+cinsiyet varsayılanı,
 * gruptan > 5 px sapan jetonlarda jeton kaydı; kayıt yoksa `kanat-esleme.json` `dragonborn.ayna.dx` ve `omuz` (lineageLook `wingPlacements`).
 */
import { crownKey } from './haloCrown';
import type { LookSheet, WingRoot } from './lineageLook';
import { wingRootTable } from './wingData';


/** `characters/(kucuk/)dragonborn-<ad>.webp` → ad (öneksiz; `erkek-fighter-ID12`). */
const nameOf = (src: string | null | undefined): string | null => /(?:^|\/)(?:kucuk\/)?dragonborn-([^/]+)\.webp$/.exec(src ?? '')?.[1] ?? null;

/** Jetonun kanat kökü (sol, sağ x; jeton uzayı); Dragonborn dışında, jeton adı çözülemezse ya da kayıt yoksa null (slot varsayılanı). */
export function wingRoot(src: string | null | undefined, look: LookSheet | undefined | null): WingRoot | null {
  if (!look || look.raceId !== 'dragonborn') return null;
  const name = nameOf(src);
  if (!name) return null;
  const k = crownKey(name);
  // Paket: veri tembel (`wingData.ts`); yüklenene dek kök yok (slot varsayılanı).
  const e = wingRootTable.jeton[name] ?? (k ? wingRootTable.sinif[k] : undefined);
  return e ? { sol: e[0]!, sag: e[1]! } : null;
}
