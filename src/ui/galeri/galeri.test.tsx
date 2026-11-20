/**
 * Görsel envanter galerisi (#galeri): sekme kayıtları eşlemeden, arama ve "yalnız eksikler" süzgeci, eksik/yedek kare
 * kırmızı çerçeve sınıfı, animasyon bütçesi (en çok 8) ve sunucu çizimi. Görsel açılmaz.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Galeri, { GALERI_TABS, filterRecords, spriteOf, tabRecords } from './Galeri';
import { MAX_ANIMATED } from '../statusFx';
import { setLang } from '../../i18n';

describe('görsel galerisi', () => {
  it('sekmeler: 10 Dungeondex kategorisi + yüzey, nesne, alan, zar, boyut', () => {
    expect(GALERI_TABS).toHaveLength(15);
    expect(tabRecords('buyu')).toHaveLength(339);
    expect(tabRecords('esya')).toHaveLength(449);
    expect(tabRecords('canavar')).toHaveLength(330);
    expect(tabRecords('altsinif')).toHaveLength(120);
    expect(tabRecords('nesne').length).toBeGreaterThan(30);
  });

  it('arama ve yalnız eksikler süzgeci', () => {
    const all = tabRecords('buyu');
    expect(filterRecords(all, 'fireball', false).map(([id]) => id)).toContain('fireball');
    const miss = filterRecords(all, '', true);
    expect(miss.length).toBeGreaterThan(0);
    expect(miss.every(([, r]) => r.durum !== 'var')).toBe(true);
    // Eşya ikon hattından sonra (npm run esya-ikon + dd-gorsel) yalnız 5 silah ikonsuz: dagger, mace, light-crossbow, warhammer, lance.
    expect(filterRecords(tabRecords('esya'), '', true).map(([id]) => id).sort()).toEqual(['dagger', 'lance', 'light-crossbow', 'mace', 'warhammer']);
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
