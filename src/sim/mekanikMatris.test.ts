/**
 * Mekanik matris duman testi: ölçüm düzeneği (src/sim/matris) motorla birlikte derlenip çalışıyor mu. Sonuç sayıları
 * denetlenmez (motor bulguları düzeldikçe değişir); yalnızca satır üretimi ve sonuç sınıfları.
 */
import { describe, expect, it } from 'vitest';
import { tumBuyuSatirlari } from './matris/tum';
import { saldiriSatirlari } from './matris/saldiri';
import { siniflandir, KATALOG } from './matris/rapor';

const SONUC = ['doğru', 'yanlış', 'çökme', 'uygulanmıyor', 'karar bekliyor'];

describe('mekanik matris (duman)', () => {
  it('örnek büyüler ve saldırılar satır üretir', () => {
    const rows = [...tumBuyuSatirlari(['Fireball', 'Fire Bolt', 'Hold Person', 'Cure Wounds', 'Bless']), ...saldiriSatirlari(['Longsword', 'Goblin Warrior'])];
    expect(rows.length).toBeGreaterThan(60);
    for (const r of siniflandir(rows)) {
      expect(SONUC).toContain(r.sonuc);
      expect(r.baglam.length).toBeGreaterThan(0);
    }
    // Fire Bolt'un temel bağlamı (isabet, kritik, direnç) motorla tutarlı.
    expect(rows.filter((r) => r.ad === 'Fire Bolt' && /normal|kritik|direnç/.test(r.baglam)).every((r) => r.sonuc === 'doğru')).toBe(true);
  });
  it('bulgu kimlikleri tekil', () => {
    expect(new Set(KATALOG.map((k) => k.id)).size).toBe(KATALOG.length);
  });
});
