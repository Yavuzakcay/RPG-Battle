/** GM kurulum ekranı (UI): sunucuda çizilen HTML'de varyant ve uyuyan ejderha seçenekleri. */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GmScreen } from './Screens';

const html = (initial: Parameters<typeof GmScreen>[0]['initial']) =>
  renderToStaticMarkup(<GmScreen characters={[]} onStart={() => {}} onBack={() => {}} onAddCharacters={() => {}} initial={initial} />);
const select = (markup: string, label: string) => {
  const m = new RegExp(`<select[^>]*aria-label="${label}"[^>]*>(.*?)</select>`).exec(markup);
  return m ? [...(m[1] ?? '').matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)</g)].map((x) => [x[1], x[2]]) : null;
};

describe('GM kurulum ekranı: Volkan uyuyan ejderha', () => {
  it('Volkan seçiliyken varyant listesinde "Uyuyan ejderha" var; normal varyantta ejderha seçimleri yok', () => {
    const plain = html({ mapId: 'volkan' });
    expect(select(plain, 'Varyant')).toEqual([['varsayilan', 'Volkan'], ['uyuyan-ejderha', 'Uyuyan ejderha']]);
    expect(select(plain, 'Ejderha')).toBe(null);
  });
  it('uyuyan-ejderha seçilince ejderha (Young varsayılan, Adult, Wyrmling) ve dragonWake kipi çıkar', () => {
    const m = html({ mapId: 'volkan', variantId: 'uyuyan-ejderha' });
    expect(select(m, 'Ejderha')?.map((x) => x[0])).toEqual(['young-red-dragon', 'adult-red-dragon', 'red-dragon-wyrmling']);
    expect(m).toMatch(/<option value="young-red-dragon" selected="">/);
    expect(select(m, 'Ejderhayı uyandırma \\(yapay zekâ düşmanları\\)')?.map((x) => x[0])).toEqual(['never', 'chance', 'gm']);
    expect(m).toMatch(/<option value="never" selected="">/);
    expect(m).not.toContain('aria-label="Uyandırma yüzdesi"');
  });
  it('chance kipinde yüzde alanı (varsayılan 25) çıkar', () => {
    const m = html({ mapId: 'volkan', variantId: 'uyuyan-ejderha', dragonWake: 'chance' });
    expect(m).toMatch(/aria-label="Uyandırma yüzdesi"[^>]*value="25"|value="25"[^>]*aria-label="Uyandırma yüzdesi"/);
  });
});
