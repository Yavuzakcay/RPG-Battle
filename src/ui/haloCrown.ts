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
/**
 * CELESTIAL-TAC-KALDIR (2026-11-23, kullanıcı): taç açık mı (`data/hale-konum.json` `tac.acik`; yoksa açık). Kapalıyken `crownSpec` her
 * yerde null döner: rozet, savaş jetonu ve karakter figürü tacı çizmez, çerçeve tacın kutusunu hesaba katmaz. Hale gizleme, kanat ve
 * uyanış görünümleri bundan bağımsız; geri açmak yalnız bu bayrak.
 */
export const CROWN_ON: boolean = (konum as unknown as { tac: { acik?: boolean } }).tac.acik !== false;
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

/**
 * Taç çiziminin (`StarCrownShape`) başın üst noktasından uzanımı, yerel birimde (× `CROWN_K` × `olcek` = jeton 256 uzayı): yukarı 18
 * (merkez sparkle y −12, r 6), yana 21 (en dış küçük yıldız x ±19, r 2). Çizim değişirse burası da.
 */
export const CROWN_REACH = { up: 18, side: 21 } as const;

/**
 * Tacın jeton 256 uzayındaki kutusu (yansıtılmış jetonda x aynalanır: iki yön birden kapsanır). Karakter ekranı çerçevesi
 * (`CharacterFigure`) tacı kırpmasın diye; savaş jetonunda taç zaten kutu dışına taşabilir.
 */
export function crownBox(c: CrownSpec): { x0: number; x1: number; y0: number } {
  const up = CROWN_REACH.up * CROWN_K * c.olcek, side = CROWN_REACH.side * CROWN_K * c.olcek;
  return { x0: Math.min(c.x, 256 - c.x) - side, x1: Math.max(c.x, 256 - c.x) + side, y0: c.y - up };
}

export function crownSpec(src: string | null | undefined, look: LookSheet | undefined | null): CrownSpec | null {
  if (!CROWN_ON || !look || look.raceId !== 'celestial') return null;
  const name = nameOf(src);
  if (!name || HOLD.has(`celestial-${name}`) || lineageLook(look).hideHalo) return null;
  const k = crownKey(name);
  return OVR[name] ?? (k ? DEF[k] : undefined) ?? null;
}
