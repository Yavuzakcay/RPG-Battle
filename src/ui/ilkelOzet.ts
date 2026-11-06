/**
 * Görev P7: ek paket özelliğinin ilkellerinden kısa özet satırı (özellik kartı: "isabette ek zar · büyülü vuruş").
 * Yalnız ilkel türleri ve tetik; paket metni kullanılmaz. Aynı tür bir kez.
 */
import { t } from '../i18n';

export function ilkelOzet(ilkeller: Array<{ tur: string; etki?: unknown }> | undefined): string {
  if (!ilkeller?.length) return '';
  const names = t().builder.paketOzet;
  // Kuyruk P10: tepkide etkinin adı parantezde (yeni etkiler: avantaj sıfırlama, hareket, büyü iptali…).
  const etki = t().builder.paketEtki;
  return [...new Set(ilkeller.filter((p) => p.tur !== 'kaynak').map((p) => {
    const base = names[p.tur] ?? p.tur;
    const e = p.tur === 'tepki' && typeof (p as { etki?: unknown }).etki === 'string' ? etki[(p as { etki: string }).etki] : undefined;
    return e ? `${base} (${e})` : base;
  }))].join(' · ');
}
