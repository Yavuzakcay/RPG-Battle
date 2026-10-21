/** GM kurulum ekranı (UI): sunucuda çizilen HTML'de varyant ve uyuyan ejderha seçenekleri. */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GmScreen } from './Screens';
import { demoCharacters } from './fixtures';
import { MAX_PARTY } from '../app/limits';

const html = (initial: Parameters<typeof GmScreen>[0]['initial']) =>
  renderToStaticMarkup(<GmScreen characters={[]} onStart={() => {}} onBack={() => {}} initial={initial} />);
/** Varyant düğmeleri (radyo): [değer, seçili mi, yazı]. */
const variants = (markup: string) => {
  const m = /<div[^>]*role="radiogroup"[^>]*aria-label="Varyant"[^>]*>(.*?)<\/div>/.exec(markup);
  return [...(m?.[1] ?? '').matchAll(/<label[^>]*><input type="radio" name="variant"([^>]*)\/>([^<]*)<\/label>/g)]
    .map((x) => [/value="([^"]*)"/.exec(x[1] ?? '')?.[1], /checked/.test(x[1] ?? ''), (x[2] ?? '').trim()]);
};
const select = (markup: string, label: string) => {
  const m = new RegExp(`<select[^>]*aria-label="${label}"[^>]*>(.*?)</select>`).exec(markup);
  return m ? [...(m[1] ?? '').matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)</g)].map((x) => [x[1], x[2]]) : null;
};

describe('GM kurulum ekranı: Volkan uyuyan ejderha', () => {
  it('Volkan seçiliyken varyant listesinde "Uyuyan ejderha" var; normal varyantta ejderha seçimleri yok', () => {
    const plain = html({ mapId: 'volkan' });
    // Varyantlar açılır liste değil, hep görünen düğmeler; ejderhalı varyantta 🐉 işareti.
    expect(variants(plain)).toEqual([['normal', true, 'Volkan'], ['uyuyan-ejderha', false, 'Uyuyan ejderha 🐉']]);
    expect(select(plain, 'Ejderha')).toBe(null);
  });
  it('uyuyan-ejderha seçilince ejderha (Young varsayılan, Adult, Ancient, Wyrmling) ve dragonWake kipi çıkar', () => {
    const m = html({ mapId: 'volkan', variantId: 'uyuyan-ejderha' });
    expect(variants(m).find((v) => v[1])?.[0]).toBe('uyuyan-ejderha');
    expect(select(m, 'Ejderha')?.map((x) => x[0])).toEqual(['young-red-dragon', 'adult-red-dragon', 'ancient-red-dragon', 'red-dragon-wyrmling']);
    expect(m).toMatch(/<option value="young-red-dragon" selected="">/);
    expect(select(m, 'Ejderhayı uyandırma \\(yapay zekâ düşmanları\\)')?.map((x) => x[0])).toEqual(['never', 'chance', 'gm']);
    expect(m).toMatch(/<option value="never" selected="">/);
    expect(m).not.toContain('aria-label="Uyandırma yüzdesi"');
  });
  it('chance kipinde yüzde alanı (varsayılan 2) çıkar', () => {
    const m = html({ mapId: 'volkan', variantId: 'uyuyan-ejderha', dragonWake: 'chance' });
    expect(m).toMatch(/aria-label="Uyandırma yüzdesi"[^>]*value="2"|value="2"[^>]*aria-label="Uyandırma yüzdesi"/);
  });
});

describe('GM kurulum ekranı: canavar listesi', () => {
  const rows = (markup: string) => [...markup.matchAll(/<div class="monster-row"><span><b>([^<]*)<\/b>/g)].map((x) => x[1]);
  const tiers = (markup: string) => [...markup.matchAll(/<h3 class="monster-tier">([^<]*) <small>/g)].map((x) => x[1]);
  it('varsayılan: seçili haritaya uyanlar, güç kademelerine ayrılmış, CR sırasıyla; seçili canavar hep listede', () => {
    const m = html({ mapId: 'volkan' });
    const names = rows(m);
    expect(names).toContain('Hell Hound');
    expect(names).toContain('Ancient Red Dragon');
    expect(names).not.toContain('Commoner');
    expect(names).toContain('Wolf'); // başlangıçta seçili (2 Wolf), Volkan'a uymasa da görünür
    expect(tiers(m)).toEqual(['Giriş Seviye', 'Orta', 'Güçlü', 'Boss', 'Efsanevi']);
    expect(names.indexOf('Lemure')).toBeLessThan(names.indexOf('Hell Hound'));
    expect(names.indexOf('Hell Hound')).toBeLessThan(names.indexOf('Tarrasque'));
    expect(m).toContain('Volkan haritasına uyanlar (40)');
    expect(m).toMatch(/<input type="checkbox" aria-label="Tüm canavarlar"\/>/);
  });
  it('Taverna: Giriş Seviye, Orta, Güçlü kademeleri; boss yok', () => {
    expect(tiers(html({ mapId: 'taverna' }))).toEqual(['Giriş Seviye', 'Orta', 'Güçlü']);
  });
  it('"Tüm canavarlar" açıkken 330 canavarın hepsi', () => {
    const m = html({ mapId: 'volkan', allMonsters: true });
    expect(rows(m).length).toBe(330);
    expect(rows(m)).toContain('Commoner');
    expect(m).toContain('Tüm canavarlar (330)');
  });
});

describe('GM kurulum ekranı: Dağ kış', () => {
  const rows = (markup: string) => [...markup.matchAll(/<div class="monster-row"><span><b>([^<]*)<\/b>/g)].map((x) => x[1]);
  it('kış varyantında soğuk iklim canavarları kademelerinin başında ve ❄ ile; yazda normal sıra', () => {
    const kis = html({ mapId: 'dag', variantId: 'kis' });
    const k = rows(kis);
    // Orta kademe: Polar Bear (CR 2, kış) Copper Dragon Wyrmling'den (CR 1) önce.
    expect(k.indexOf('Polar Bear')).toBeLessThan(k.indexOf('Copper Dragon Wyrmling'));
    expect(k.indexOf('Winter Wolf')).toBeLessThan(k.indexOf('Copper Dragon Wyrmling'));
    expect(kis).toMatch(/<b>Winter Wolf<\/b><span class="winter"/);
    const yaz = html({ mapId: 'dag', variantId: 'yaz' });
    expect(rows(yaz).indexOf('Copper Dragon Wyrmling')).toBeLessThan(rows(yaz).indexOf('Winter Wolf'));
    expect(yaz).not.toContain('class="winter"');
  });
});

describe('GM ekranı (Görev G)', () => {
  it('örnek karakter ve Hazır savaş yok; karakter yoksa boş durum metni; Aynala yok', () => {
    const m = html(undefined);
    expect(m).not.toMatch(/Hazır savaş|Örnek karakter|Aynala/);
    expect(m).toContain('Önce karakter oluştur');
  });
  it('harita seçimi düşman seçiminin üstünde; güç seviyesi filtresi beş kademeyle', () => {
    const m = html(undefined);
    expect(m.indexOf('<h2>Harita</h2>')).toBeGreaterThan(-1);
    expect(m.indexOf('<h2>Harita</h2>')).toBeLessThan(m.indexOf('<h2>Düşmanlar'));
    const opts = /aria-label="Güç seviyesi seçenekleri"(.*?)<\/div>/.exec(m)?.[1] ?? '';
    expect([...opts.matchAll(/\/>([^<]+)<small>/g)].map((x) => x[1]?.trim())).toEqual(['Giriş Seviye', 'Orta', 'Güçlü', 'Boss', 'Efsanevi']);
  });
  it('parti en fazla 6: 7 karakter varken 6 seçilince yedinci pasif ve bilgi görünür', () => {
    const base = demoCharacters();
    const seven = Array.from({ length: 7 }, (_, i) => ({ ...(base[i % 2] as (typeof base)[number]), id: `c${i}` }));
    const m = renderToStaticMarkup(<GmScreen characters={seven} onStart={() => {}} onBack={() => {}} />);
    expect(m).toContain(`En fazla ${MAX_PARTY} karakter`);
    // Varsayılan 4 seçili: hiçbiri pasif değil.
    expect([...m.matchAll(/type="checkbox"[^>]*disabled=""/g)].filter((x) => !/Tüm canavarlar/.test(x[0]))).toHaveLength(0);
    expect(MAX_PARTY).toBe(6);
  });
});
