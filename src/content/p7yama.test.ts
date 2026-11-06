/**
 * Görev P7: ek paket yaması (`docs/ek-yama/p8.yama.json`) şemaya uyar: her girdinin ilkelleri doğrulayıcıdan hatasız
 * geçer (yamanın kendi kaynakları, sınıf kaynakları ve `$kaynak` belirteci), durum geçerli, çalışır/kısmi ilkelli.
 */
import { describe, expect, it } from 'vitest';
import yama from '../../docs/ek-yama/p8.yama.json';
import { ilkelErrors } from './ilkelSema';

/** Yamanın başvurduğu sınıf kaynakları (paket doğrulayıcısı gerçek listeyle denetler) ve `$kaynak` belirteci. */
const sinifKaynaklari = new Set(['channelDivinity', 'focus', 'rage', 'bardicInspiration', 'wildShape', '$kaynak']);

describe('P7 yaması', () => {
  it('96 girdi; durumlar geçerli; çalışır/kısmi ilkelli', () => {
    expect(yama.girdiler).toHaveLength(96);
    for (const g of yama.girdiler) {
      expect(['calisir', 'kismi', 'planli', 'hikaye', 'calismiyor']).toContain(g.durum);
      if (g.durum === 'calisir' || g.durum === 'kismi') expect(g.ilkeller?.length, g.ad).toBeGreaterThan(0);
    }
  });
  it('ilkeller doğrulayıcıdan hatasız geçer', () => {
    for (const g of yama.girdiler.filter((x) => x.ilkeller)) {
      const own = new Set((g.ilkeller as Array<Record<string, unknown>>).filter((p) => p.tur === 'kaynak').map((p) => p.id as string));
      const errs = ilkelErrors(g.ilkeller, g.ad, { kaynaklar: own, sinifKaynaklari, yaratiklar: new Set() });
      expect(errs, g.ad).toEqual([]);
    }
  });
});
