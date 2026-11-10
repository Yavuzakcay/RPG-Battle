/**
 * Kuyruk E4c: kaynak ikonları (yalnız görünüm; savaşa, kurallara, kayda girmez). Eşleme `data/kaynak-ikon.json`; görseller
 * `npm run kaynak-ikon` ile `public/kaynak/` altında (192, 96, 64 px). Saf: React yok.
 */
import map from '../../data/kaynak-ikon.json';
import { resourceDef } from '../rules/classFeatures';

const BASE = import.meta.env.BASE_URL;
const KAYNAK = map.kaynak as Record<string, string>;
const DESEN = (map.desen as Array<{ ara: string; ikon: string }>).map((d) => ({ re: new RegExp(d.ara, 'i'), ikon: d.ikon }));
export const ICON_PX = map.boyut as number;
export const ICON_NAMES: readonly string[] = map.ikonlar;

/** Kaynağın ikon adı (yoksa null: yalnız metin). Sıra: tanımdaki `icon`, anahtar eşlemesi, ek paket kaynağının adı. */
export function resourceIconOf(id: string): string | null {
  const def = resourceDef(id);
  const direct = (def as { icon?: string } | undefined)?.icon;
  if (direct && ICON_NAMES.includes(direct)) return direct;
  if (KAYNAK[id]) return KAYNAK[id]!;
  if (id.startsWith('pk-')) for (const d of DESEN) if (d.re.test(def?.name ?? id)) return d.ikon;
  return null;
}

/** İkon görsel yolları (64 px, 2×: 96 px). Gösterim en az `ICON_PX` css px. */
export const resourceIconSrc = (icon: string): { src: string; srcSet: string } => ({
  src: `${BASE}kaynak/kaynak-${icon}-64.webp`,
  srcSet: `${BASE}kaynak/kaynak-${icon}-96.webp 3x`,
});
