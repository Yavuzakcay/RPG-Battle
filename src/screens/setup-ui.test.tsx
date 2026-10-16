/** GM kurulum ekranı (UI): sunucuda çizilen HTML'de varyant ve uyuyan ejderha seçenekleri. */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GmScreen } from './Screens';

const html = (initial: Parameters<typeof GmScreen>[0]['initial']) =>
  renderToStaticMarkup(<GmScreen characters={[]} onStart={() => {}} onBack={() => {}} onAddCharacters={() => {}} initial={initial} />);
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
  it('chance kipinde yüzde alanı (varsayılan 10) çıkar', () => {
    const m = html({ mapId: 'volkan', variantId: 'uyuyan-ejderha', dragonWake: 'chance' });
    expect(m).toMatch(/aria-label="Uyandırma yüzdesi"[^>]*value="10"|value="10"[^>]*aria-label="Uyandırma yüzdesi"/);
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
    expect(tiers(m)).toEqual(['Ufak', 'Orta', 'Güçlü', 'Boss', 'Efsanevi']);
    expect(names.indexOf('Lemure')).toBeLessThan(names.indexOf('Hell Hound'));
    expect(names.indexOf('Hell Hound')).toBeLessThan(names.indexOf('Tarrasque'));
    expect(m).toContain('Volkan haritasına uyanlar (40)');
    expect(m).toMatch(/<input type="checkbox" aria-label="Tüm canavarlar"\/>/);
  });
  it('Taverna: Ufak, Orta, Güçlü kademeleri; boss yok', () => {
    expect(tiers(html({ mapId: 'taverna' }))).toEqual(['Ufak', 'Orta', 'Güçlü']);
  });
  it('"Tüm canavarlar" açıkken 330 canavarın hepsi', () => {
    const m = html({ mapId: 'volkan', allMonsters: true });
    expect(rows(m).length).toBe(330);
    expect(rows(m)).toContain('Commoner');
    expect(m).toContain('Tüm canavarlar (330)');
  });
});
