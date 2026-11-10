/**
 * Kuyruk E4c: kaynak göstergesi "ikon + sayı" (savaş kartı, karakter listesi). İkon en az 32 px (24 px altında ince çizgili ki / d20 /
 * arcanum okunmaz); ad ve sayı `title` ve `aria-label`'da (yalnız görünüm). İkonsuz kaynak çağıranda metin kalır.
 */
import { resourceDef } from '../rules/classFeatures';
import { ICON_PX, resourceIconOf, resourceIconSrc } from './resourceIcon';

export function ResourceChip({ id, n, max, showName }: { id: string; n: number; max?: number; /** Aynı ikonu paylaşan kaynaklar ayırt edilsin diye ad da görünür. */ showName?: boolean }) {
  const icon = resourceIconOf(id);
  if (!icon) return null;
  const label = `${resourceDef(id)?.name ?? id} ${n}${max !== undefined ? `/${max}` : ''}`;
  const { src, srcSet } = resourceIconSrc(icon);
  return (
    <span className="res-chip" role="img" title={label} aria-label={label}>
      <img src={src} srcSet={srcSet} width={ICON_PX} height={ICON_PX} alt="" aria-hidden="true" draggable={false} />
      <b aria-hidden="true">{n}{max !== undefined ? <small>/{max}</small> : null}</b>
      {showName && <em aria-hidden="true">{resourceDef(id)?.name ?? id}</em>}
    </span>
  );
}

/** İkonlu kaynak sırası (ikonsuzlar çağıranda metin). */
export const iconed = <T extends [string, ...unknown[]]>(list: T[]): T[] => list.filter(([id]) => !!resourceIconOf(id));
export const plain = <T extends [string, ...unknown[]]>(list: T[]): T[] => list.filter(([id]) => !resourceIconOf(id));

/** Aynı ikonu paylaşan kaynaklar (ör. Focus ve Uncanny Metabolism): bunlarda ad da görünür (aksi hâlde iki aynı ikon ayırt edilemez). */
export const sharedIcons = (ids: string[]): Set<string> => {
  const count = new Map<string, number>();
  for (const id of ids) { const i = resourceIconOf(id); if (i) count.set(i, (count.get(i) ?? 0) + 1); }
  return new Set(ids.filter((id) => (count.get(resourceIconOf(id) ?? '') ?? 0) > 1));
};
