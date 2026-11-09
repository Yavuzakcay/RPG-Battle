/**
 * Kuyruk K71d: modül başlatma testi. Her ekran giriş noktası (uygulama kökü, tembel parçalar, `screens/fixtures.ts`) taze bir
 * modül grafiğiyle (`vi.resetModules`) yüklenir; döngüsel içe aktarmada modül değerlendirme sırası yüzünden çıkan "Cannot
 * access … before initialization" / "… is not a function" hataları tarayıcıya (check:harita) gitmeden yakalanır (K71c'de bu
 * hata yalnız dev sunucusunda görülmüştü: DECISIONS.md K71c). Her giriş kendi kökünden değerlendirilir: sıra, tarayıcıdaki
 * ESM sırasıyla aynı (derinlik öncelikli, içe aktarma sırası).
 */
import { describe, expect, it, vi } from 'vitest';

const ENTRIES: Array<[string, () => Promise<unknown>]> = [
  ['screens/fixtures', () => import('../screens/fixtures')],
  ['App', () => import('../App')],
  ['MapBattle', () => import('../MapBattle')],
  ['screens/GmScreen', () => import('../screens/GmScreen')],
  ['screens/StatusScreen', () => import('../screens/StatusScreen')],
  ['screens/Builder', () => import('../screens/Builder')],
  ['screens/SettingsScreen', () => import('../screens/SettingsScreen')],
  ['screens/JourneyScreen', () => import('../screens/JourneyScreen')],
  ['screens/SeruvenScreen', () => import('../screens/SeruvenScreen')],
  ['screens/SeferMap', () => import('../screens/SeferMap')],
  ['screens/YerlesimHub', () => import('../screens/YerlesimHub')],
  ['screens/SehirGorunum', () => import('../screens/SehirGorunum')],
  ['screens/Screens', () => import('../screens/Screens')],
  ['battle/index', () => import('../battle/index')],
  ['battle/ai', () => import('../battle/ai')],
  ['battle/cover', () => import('../battle/cover')],
  ['battle/features', () => import('../battle/features')],
  ['battle/altitude', () => import('../battle/altitude')],
  ['ui/session', () => import('../ui/session')],
  ['app/battleSave', () => import('./battleSave')],
  ['sim/balance', () => import('../sim/balance')],
];

describe('K71d modül başlatma: giriş noktaları taze modül grafiğiyle', () => {
  for (const [name, load] of ENTRIES) {
    it(`${name} başlatma hatasız`, async () => {
      vi.resetModules();
      let err: unknown = null;
      try { await load(); } catch (e) { err = e; }
      expect(err === null ? null : String((err as Error)?.stack ?? err).split('\n').slice(0, 4).join(' | ')).toBeNull();
    }, 60_000);
  }
});
