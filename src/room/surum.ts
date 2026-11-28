/**
 * Görev ODA-1 (O1): katılımda sürüm el sıkışması (Karar 3). Host aynı protokolü, aynı build'i ve aynı kural sürümünü
 * ister; biri farklıysa `red{neden:'surum'}` (istemci "sayfayı yenile" der). Görev ODA-3 (madde 4): dış içerik özeti
 * kalktı: paketler oyuna gömülü, aynı build aynı içerik demek (GM cihazında eksik paket yolu yok).
 */
import { defaultRuleVersion } from '../battle/create';
import { ODA_PROTOKOL, type SurumBilgisi } from './protocol';

export const buildKimligi = (): string => (typeof __APP_BUILD__ === 'string' ? __APP_BUILD__ : 'bilinmiyor');

export const yerelSurum = (): SurumBilgisi => ({ protokol: ODA_PROTOKOL, uygulama: buildKimligi(), kuralSurumu: defaultRuleVersion() });

export type SurumAlani = 'protokol' | 'uygulama' | 'kuralSurumu';
/** İlk farklı alan; eşitse null. */
export function surumUyusmazligi(host: SurumBilgisi, istemci: SurumBilgisi): SurumAlani | null {
  for (const k of ['protokol', 'uygulama', 'kuralSurumu'] as const) if (host[k] !== istemci[k]) return k;
  return null;
}
