/**
 * Görev SD4: Türkçe açıklama erişimi (`data/aciklamalar-tr.json`). Türkçe arayüzde açıklama; İngilizce arayüzde açıklama
 * varsa ama yalnız Türkçe yazılmışsa kısa "açıklama yalnız Türkçe" notu (kaynak SRD metni gösterilmez). Açıklama hiç yoksa undefined.
 */
import { trAciklama, type AciklamaTuru } from '../data';
import { getLang, t } from '../i18n';

export function describeTr(tur: AciklamaTuru, id: string): string | undefined {
  const text = trAciklama(tur, id);
  if (!text) return undefined;
  return getLang() === 'tr' ? text : t().common.descTrOnly;
}
