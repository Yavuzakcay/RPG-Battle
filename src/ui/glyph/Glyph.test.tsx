/**
 * Ortak simge setleri (glif) çizimi: simge `aria-hidden` ve boş alt metin, metin aynen; ayar kapalıysa ya da görsel kesilmemişse
 * hiçbir şey çizilmez. Görsel açılmaz (yalnız `src` adı); kesim kaydı test için taklit edilir. Sunucu çizimi (DOM ortamı yok).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../../data/glif-esleme.json', async (orig) => {
  const real = (await orig()) as { default: Record<string, unknown> & { sayfalar: Array<{ adlar: string[] }> } };
  const kesim = Object.fromEntries(real.default.sayfalar.flatMap((p, si) => p.adlar.map((ad, k) => [ad, { sayfa: si + 1, hucre: k + 1, kutu: [0, 0, 1, 1] }])));
  return { default: { ...real.default, kesim } };
});

const { DamageChip, GlyphBadges, GlyphText } = await import('./Glyph');
const { saveGlyphs } = await import('../glyphSetting');

const imgs = (html: string) => [...html.matchAll(/<img [^>]*>/g)].map((m) => m[0]);
const attr = (tag: string, a: string) => new RegExp(`${a}="([^"]*)"`).exec(tag)?.[1];
const textOf = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');

afterEach(() => saveGlyphs(true));

describe('GlyphText', () => {
  it('hasar türünün ve kurtarma zarının önüne 16 px simge; aria-hidden, alt boş; metin aynen', () => {
    const text = 'Hedef 8d6 ateş hasarı alır, başarılı DEX kurtarma zarında yarısı.';
    const html = renderToStaticMarkup(<p><GlyphText text={text} /></p>);
    const list = imgs(html);
    expect(list.map((i) => attr(i, 'data-glif'))).toEqual(['fire', 'saving-throw']);
    for (const i of list) {
      expect(attr(i, 'aria-hidden')).toBe('true');
      expect(attr(i, 'alt')).toBe('');
      expect(attr(i, 'width')).toBe('16');
      expect(attr(i, 'title')).toBeUndefined();
      expect(attr(i, 'src')).toMatch(/glif\/kucuk\/(fire|saving-throw)\.webp$/);
    }
    expect(textOf(html)).toBe(text);
    expect(html.indexOf('data-glif="fire"')).toBeLessThan(html.indexOf('ateş hasarı'));
  });

  it('ayar kapalıysa hiçbir simge çizilmez (başlık, metin, çip)', () => {
    saveGlyphs(false);
    const html = renderToStaticMarkup(<div><GlyphBadges list={['evocation']} /><GlyphText text="ateş hasarı" /><DamageChip type="fire" label="ateş" /></div>);
    expect(imgs(html)).toHaveLength(0);
    expect(textOf(html)).toBe('ateş hasarı');
  });

  it('başlık rozetleri 20 px ve ipucu adlı; çip simge + ad', () => {
    const html = renderToStaticMarkup(<div><GlyphBadges list={['evocation', undefined, 'concentration']} /><DamageChip type="fire" label="ateş" /></div>);
    const heads = imgs(html).filter((i) => i.includes('glyph-head'));
    expect(heads.map((i) => [attr(i, 'data-glif'), attr(i, 'width'), !!attr(i, 'title')])).toEqual([['evocation', '20', true], ['concentration', '20', true]]);
    expect(html).toMatch(/<span class="dmg-chip" data-dmg="fire"><img [^>]*aria-hidden="true"[^>]*>ateş<\/span>/);
  });
});
