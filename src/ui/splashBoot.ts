/**
 * Açılış ekranının ana parçadaki küçük kısmı (Görev L, L2): açık mı, soğuk açılış mı arka plandan dönüş mü. Açılış
 * bileşeni (`Splash.tsx`, zar ve logo sahneleri) tembel parça; ilk statik kare index.html'de `#splash-static`
 * (React ağacının dışında; bileşen kendi ilk karesini çizince kaldırır).
 */
import { resume } from '../../data/acilis-ekrani.json';

export type SplashKind = 'cold' | 'resume';
export const STATIC_ID = 'splash-static';

/** Açılış ekranı açık mı: `?acilis=0` ya da `rpg-battle-acilis` = off (tarayıcı denetim betikleri) kapatır. */
export function splashEnabled(search: string, get: (key: string) => string | null): boolean {
  if (new URLSearchParams(search).get('acilis') === '0') return false;
  try { return get('rpg-battle-acilis') !== 'off'; } catch { return true; }
}

/** index.html'deki ilk statik kareyi kaldırır (açılış kapalıysa hemen, açıksa bileşen kendi karesini çizince). */
export function removeStaticSplash(doc: Pick<Document, 'getElementById'> = document): void {
  doc.getElementById(STATIC_ID)?.remove();
}

/**
 * Arka plandan dönüş: sekme/uygulama en az `afterHiddenMs` gizli kaldıysa ya da sayfa geri-ileri önbelleğinden
 * (bfcache) döndüyse. Saf karar: gizlenme ve görünme zamanları.
 */
export function isResume(hiddenAt: number | null, visibleAt: number, afterMs = resume.afterHiddenMs): boolean {
  return hiddenAt !== null && visibleAt - hiddenAt >= afterMs;
}

/** Dönüşleri dinler; `cb` kısa açılışı gösterir. Dönen fonksiyon dinlemeyi bırakır. */
export function watchResume(cb: () => void): () => void {
  let hiddenAt: number | null = null;
  const vis = () => {
    if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
    if (isResume(hiddenAt, Date.now())) cb();
    hiddenAt = null;
  };
  const show = (e: PageTransitionEvent) => { if (e.persisted) cb(); };
  document.addEventListener('visibilitychange', vis);
  window.addEventListener('pageshow', show);
  return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('pageshow', show); };
}
