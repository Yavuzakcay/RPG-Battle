/**
 * Eylem menüsü düğmelerinin kısa açıklamaları (üzerine gelince ya da telefonda uzun basınca).
 * Anahtarlar MapBattle'daki menü öğeleriyle aynı; metinler src/i18n/strings.ts `hints`.
 */
import { t } from '../i18n';

/** Düğme anahtarının açıklaması (geçerli dilde); bilinmeyen anahtarda boş. */
export function actionHint(key: string): string {
  const h = t().hints as Record<string, unknown>;
  // SD2: değişken kimlikli öğeler (hayvan formu, slot yenileme, iksir) ortak açıklamayı paylaşır.
  const k = h[key] !== undefined ? key : key.startsWith('shape-') ? 'shape' : key.startsWith('magician-') ? 'magician' : key.startsWith('item-') ? 'itemUse' : key;
  const v = h[k];
  return typeof v === 'string' ? v : '';
}

/** Düğmenin açıklaması; kullanılamıyorsa nedeni de eklenir. */
export function actionTip(key: string, opts: { disabled?: boolean; reason?: string } = {}): string {
  const h = t().hints;
  const hint = actionHint(key);
  if (opts.reason) return `${hint}${h.unavailable(opts.reason)}`;
  if (opts.disabled) return `${hint}${h.unavailablePlain}`;
  return hint;
}
