/**
 * KQ6-19 (yalnız görünüm): Celestial yıldız tacı (alternatif C, 1,6×). Tek çözücü: rozet (karakter ekranı, `AvatarBadge`) ve savaş jetonu (`AvatarCircle` → `TokenFigure`)
 * burada konumu alır, `StarCrown.tsx` çizer. Taç yalnız hale gösteren Celestial uyanışlarında (Gece Gözyaşı ve Kırık Kanat'ta hale/taç yok: `lineageLook.hideHalo`)
 * ve sprite'ı halesiz olan jetonlarda çizilir. Sprite'ta sanat halesi kalan jetonlar (`data/hale-halesiz.json` bekleyen: Gemini düzeltmesi/karar bekleyenler) taç almaz.
 * Konum `data/hale-konum.json` (jeton 256 px uzayı: x, y = başın/şapkanın üst orta noktası, olcek): sınıf+cinsiyet varsayılanı, yalnız > 8 px sapanlarda jeton kaydı.
 */
import konum from '../../data/hale-konum.json';
import bekleyen from '../../data/hale-halesiz.json';
import { lineageLook, type LookSheet } from './lineageLook';

/** Taç gövdesinin jeton uzayı çarpanı (`data/hale-konum.json` `tac.katsayi`). */
export const CROWN_K: number = (konum as unknown as { tac: { katsayi: number } }).tac.katsayi;
export interface CrownSpec { x: number; y: number; olcek: number }
type Entry = { x: number; y: number; olcek: number };
const HOLD = new Set<string>(bekleyen.bekleyen);
const DEF = konum.varsayilan as Record<string, Entry>;
const OVR = konum.jeton as Record<string, Entry>;

/** `characters/(kucuk/)celestial-<ad>.webp` → ad (öneksiz). */
const nameOf = (src: string | null | undefined): string | null => /(?:^|\/)(?:kucuk\/)?celestial-([^/]+)\.webp$/.exec(src ?? '')?.[1] ?? null;

/** Varsayılan grup anahtarı: `<sınıf>-<erkek|kadin>[-gr|-genel]` (scripts/hale-konum.py `key_of` ile aynı). */
export function crownKey(name: string): string | null {
  const m = /^(erkek|kadin|male|female)-([a-z]+)(?:-(.+))?$/.exec(name);
  if (!m) return null;
  const g = m[1] === 'male' ? 'erkek' : m[1] === 'female' ? 'kadin' : m[1];
  return `${m[2]}-${g}${m[3] === 'GR' ? '-gr' : m[3] ? '' : '-genel'}`;
}

export function crownSpec(src: string | null | undefined, look: LookSheet | undefined | null): CrownSpec | null {
  if (!look || look.raceId !== 'celestial') return null;
  const name = nameOf(src);
  if (!name || HOLD.has(`celestial-${name}`) || lineageLook(look).hideHalo) return null;
  const k = crownKey(name);
  return OVR[name] ?? (k ? DEF[k] : undefined) ?? null;
}
