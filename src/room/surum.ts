/**
 * Görev ODA-1 (O1): katılımda sürüm el sıkışması (Karar 3). Host aynı build'i, aynı kural sürümünü ve aynı dış içerik
 * özetini ister; biri farklıysa `red{neden:'surum'}`. Karar 4: paket JSON'u gönderilmez, aynı build ve içerik şartı yeter.
 */
import { defaultRuleVersion } from '../battle/create';
import { externalSubclasses } from '../rules/subclasses';
import { ODA_PROTOKOL, type SurumBilgisi } from './protocol';
import { ozet } from './hash';

export const buildKimligi = (): string => (typeof __APP_BUILD__ === 'string' ? __APP_BUILD__ : 'bilinmiyor');

/** Yüklü dış içeriğin özeti: alt sınıf tanımlarının kanonik JSON özeti (kimlik sırasıyla). İçerik yoksa `yok`. */
export function icerikOzeti(defs: ReadonlyArray<{ id: string }> = externalSubclasses()): string {
  if (!defs.length) return 'yok';
  return ozet([...defs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
}

export const yerelSurum = (): SurumBilgisi => ({ protokol: ODA_PROTOKOL, uygulama: buildKimligi(), kuralSurumu: defaultRuleVersion(), icerik: icerikOzeti() });

export type SurumAlani = 'protokol' | 'uygulama' | 'kuralSurumu' | 'icerik';
/** İlk farklı alan; eşitse null. */
export function surumUyusmazligi(host: SurumBilgisi, istemci: SurumBilgisi): SurumAlani | null {
  for (const k of ['protokol', 'uygulama', 'kuralSurumu', 'icerik'] as const) if (host[k] !== istemci[k]) return k;
  return null;
}
