/**
 * Görev P7: ek paket özelliğinin ilkellerinden kısa özet satırı (özellik kartı: "isabette ek zar · büyülü vuruş").
 * Yalnız ilkel türleri ve tetik; paket metni kullanılmaz. Aynı tür bir kez.
 */
import { t } from '../i18n';

export function ilkelOzet(ilkeller: Array<{ tur: string }> | undefined): string {
  if (!ilkeller?.length) return '';
  const names = t().builder.paketOzet;
  return [...new Set(ilkeller.filter((p) => p.tur !== 'kaynak').map((p) => names[p.tur] ?? p.tur))].join(' · ');
}
