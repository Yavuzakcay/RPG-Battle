/**
 * Görsel envanter galerisi (#galeri): sekme kayıtları eşlemeden, arama ve "yalnız eksikler" süzgeci, eksik/yedek kare
 * kırmızı çerçeve sınıfı, animasyon bütçesi (en çok 8) ve sunucu çizimi. Görsel açılmaz. Eşya sekmesi sabit sayı yerine veriden
 * (items + weapons + SRD kimlikli armor) türetilir; ikonsuz eşya yalnız `data/esya-ikonsuz-izin.json` izin listesindekiler.
 */
import { describe, expect, it } from 'vitest';
import { armor, items, weapons } from '../../data';
import izin from '../../../data/esya-ikonsuz-izin.json';
import { renderToStaticMarkup } from 'react-dom/server';
import Galeri, { GALERI_TABS, filterRecords, spriteOf, tabRecords } from './Galeri';
import { MAX_ANIMATED } from '../statusFx';
import { setLang } from '../../i18n';

/** Dungeondex eşya kayıtları (src/dungeondex/catalog.ts `buildDex` ile aynı kaynak): eşya + silah + SRD kimlikli zırh. */
const esyaKimlikleri = () => new Set([
  ...items.map((i) => i.id), ...weapons.map((w) => w.id),
  ...(armor as Array<{ srd?: string }>).filter((a) => a.srd).map((a) => String(a.srd).split(':')[1]!),
]);
const IZIN = new Set(Object.values(izin.gruplar).flat());

describe('görsel galerisi', () => {
  it('sekmeler: 10 Dungeondex kategorisi + yüzey, nesne, alan, zar, boyut', () => {
    expect(GALERI_TABS).toHaveLength(15);
    expect(tabRecords('buyu')).toHaveLength(339);
    expect(new Set(tabRecords('esya').map(([id]) => id))).toEqual(esyaKimlikleri()); // sayı veriden (KATALOG-1 ile 449 → 771)
    expect(tabRecords('canavar')).toHaveLength(350); // KATALOG-F2: 330 SRD + 20 kadim yaratık (yedek glifi)
    expect(tabRecords('altsinif')).toHaveLength(120);
    expect(tabRecords('nesne').length).toBeGreaterThan(30);
  });

  it('arama ve yalnız eksikler süzgeci', () => {
    const all = tabRecords('buyu');
    expect(filterRecords(all, 'fireball', false).map(([id]) => id)).toContain('fireball');
    const miss = filterRecords(all, '', true);
    expect(miss.length).toBeGreaterThan(0);
    expect(miss.every(([, r]) => r.durum !== 'var')).toBe(true);
  });

  it('eşya: izin listesi dışında ikonsuz eşya yok; ikon kazanan izinli eşya uyarılır', () => {
    const eksik = filterRecords(tabRecords('esya'), '', true).map(([id]) => id);
    expect(eksik.filter((id) => !IZIN.has(id)), 'ikonsuz eşya (izin listesinde değil)').toEqual([]);
    const kayit = esyaKimlikleri(); const eksikSet = new Set(eksik);
    const kazanan = [...IZIN].filter((id) => kayit.has(id) && !eksikSet.has(id));
    const kayitsiz = [...IZIN].filter((id) => !kayit.has(id));
    if (kazanan.length) console.warn(`data/esya-ikonsuz-izin.json: ikon kazandı, listeden çıkar: ${kazanan.join(', ')}`);
    if (kayitsiz.length) console.warn(`data/esya-ikonsuz-izin.json: eşya kaydı yok (kimlik değişti mi?), listeden çıkar: ${kayitsiz.join(', ')}`);
  });

  it('efekt şeritleri çözülüyor (fxPlan kaydı ya da durum döngüsü)', () => {
    for (const [id, r] of [...tabRecords('buyu'), ...tabRecords('durum')]) if (r.efekt && !r.efekt.startsWith('isaret-')) expect(spriteOf(r), id).not.toBeNull();
  });

  it('sunucu çizimi: büyü sekmesi, yedek kare kırmızı çerçeve sınıfı, en çok 8 animasyon', () => {
    setLang('tr');
    const html = renderToStaticMarkup(<Galeri onClose={() => {}} initialTab="buyu" />);
    expect(html).toContain('Görsel galerisi');
    expect(html).toContain('gal-tile yedek');
    expect(html).toContain('gal-tile var');
    const animatedCount = (html.match(/data-animated="1"/g) ?? []).length;
    expect(animatedCount).toBeGreaterThan(0);
    expect(animatedCount).toBeLessThanOrEqual(MAX_ANIMATED);
    expect(renderToStaticMarkup(<Galeri onClose={() => {}} initialTab="boyut" />)).toContain('gal-size-grid');
  });
});
