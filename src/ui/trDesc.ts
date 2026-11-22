/**
 * Görev SD4 / EN-ACIKLAMA: açıklama erişimi. Türkçe arayüzde `data/aciklamalar-tr.json`; İngilizce arayüzde
 * `data/aciklamalar-en.json` (SRD 5.2.1 metni ya da çeviri). EN karşılığı yoksa (geriye uyum) kısa "açıklama yalnız
 * Türkçe" notu. Açıklama hiç yoksa undefined.
 */
import { enAciklama, trAciklama, type AciklamaTuru } from '../data';
import { getLang, t } from '../i18n';

export function describeTr(tur: AciklamaTuru, id: string): string | undefined {
  const text = trAciklama(tur, id);
  if (getLang() === 'tr') return text;
  const en = enAciklama(tur, id);
  if (en) return en;
  return text ? t().common.descTrOnly : undefined;
}
