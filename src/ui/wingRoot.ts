/**
 * KW1 (yalnız görünüm): Dragonborn kanat kökü. Kanat jetonun ARKASINDA, kökü gövde siluetinin omuz–dirsek bandında sol/sağ kenarının biraz
 * İÇİNDE; tek çözücü: rozet (`AvatarBadge`) ve savaş jetonu/karakter figürü (`AvatarCircle` → `TokenFigure`) aynı kökü kullanır.
 * Konum `data/dragonborn-kanat-kok.json` (jeton uzayı 256 px; üretici scripts/dragonborn-kanat-kok.py): sınıf+cinsiyet varsayılanı,
 * gruptan > 5 px sapan jetonlarda jeton kaydı; kayıt yoksa `kanat-esleme.json` `dragonborn.ayna.dx` ve `omuz` (lineageLook `wingPlacements`).
 * Elle ayar (`jetonAyar`: kök ve ölçek) üretilen verinin önüne geçer.
 */
import konum from '../../data/dragonborn-kanat-kok.json';
import kanat from '../../data/kanat-esleme.json';
import { crownKey } from './haloCrown';
import type { LookSheet, WingRoot } from './lineageLook';

const DEF = konum.sinif as Record<string, number[]>;
const OVR = konum.jeton as Record<string, number[]>;
/**
 * Ranger ID4: jeton başına elle ayar (`kanat-esleme.json` `slotlar.dragonborn.jetonAyar`; üretilen kök verisinin önüne geçer): `kok` [sol, sağ]
 * ve `olcek` (kanat çifti boyunun çarpanı; yoldaşı ya da büyük silueti olan jetonda kanat jetona göre küçülür). Yalnız görünüm.
 */
const ELLE = ((kanat as unknown as { slotlar: Record<string, { jetonAyar?: Record<string, { kok?: number[]; olcek?: number }> }> }).slotlar.dragonborn?.jetonAyar) ?? {};

/** `characters/(kucuk/)dragonborn-<ad>.webp` → ad (öneksiz; `erkek-fighter-ID12`). */
const nameOf = (src: string | null | undefined): string | null => /(?:^|\/)(?:kucuk\/)?dragonborn-([^/]+)\.webp$/.exec(src ?? '')?.[1] ?? null;

/** Jetonun kanat kökü (sol, sağ x; jeton uzayı); Dragonborn dışında, jeton adı çözülemezse ya da kayıt yoksa null (slot varsayılanı). */
export function wingRoot(src: string | null | undefined, look: LookSheet | undefined | null): WingRoot | null {
  if (!look || look.raceId !== 'dragonborn') return null;
  const name = nameOf(src);
  if (!name) return null;
  const k = crownKey(name);
  const el = ELLE[name];
  const e = el?.kok ?? OVR[name] ?? (k ? DEF[k] : undefined);
  return e ? { sol: e[0]!, sag: e[1]!, ...(el?.olcek ? { olcek: el.olcek } : {}) } : null;
}
