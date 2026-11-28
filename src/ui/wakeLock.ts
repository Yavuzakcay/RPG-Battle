/**
 * Görev ODA-4 (madde 2): çevrimiçi odada savaş ekranı açıkken ekran kilitlenmesin (Screen Wake Lock API). Telefon/tablet
 * GM cihazı uyuyunca bağlantı kopar ve oda durur; oyuncu cihazında da yeniden bağlanma gerekmesin. API yoksa (eski
 * tarayıcı, güvenli olmayan köken, test) sessizce hiçbir şey yapmaz. Sekme gizlenince tarayıcı kilidi bırakır; görünür
 * olunca yeniden istenir.
 */
import { useEffect } from 'react';

interface KilitNesnesi { release(): Promise<void>; addEventListener?(t: 'release', fn: () => void): void }
interface WakeLockApi { request(tur: 'screen'): Promise<KilitNesnesi> }

export function useWakeLock(on: boolean): void {
  useEffect(() => {
    if (!on || typeof navigator === 'undefined' || typeof document === 'undefined') return undefined;
    const api = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock;
    if (!api?.request) return undefined;
    let kilit: KilitNesnesi | null = null;
    let bitti = false;
    const iste = () => {
      if (bitti || kilit || document.visibilityState !== 'visible') return;
      void api.request('screen').then((k) => {
        if (bitti) { void k.release().catch(() => {}); return; }
        kilit = k;
        k.addEventListener?.('release', () => { kilit = null; });
      }).catch(() => { /* izin yok ya da pil tasarrufu: kilitsiz devam */ });
    };
    const gorunur = () => { if (document.visibilityState === 'visible') iste(); };
    iste();
    document.addEventListener('visibilitychange', gorunur);
    return () => {
      bitti = true;
      document.removeEventListener('visibilitychange', gorunur);
      if (kilit) void kilit.release().catch(() => {});
      kilit = null;
    };
  }, [on]);
}
