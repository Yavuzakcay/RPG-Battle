/**
 * Dungeondex Kitap kabuğu (Görev DD-Kitap): kapak ve açık kitap sunucu çizimi, kapak adımları (tam / azaltılmış),
 * ayar kapalıyken doğrudan açık kitap.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadMonsters } from '../../data';
import { setLang, t } from '../../i18n';
import { loadDexExtras, type DexExtras } from '../catalog';
import { Dungeondex } from '../../screens/Dungeondex';
import { coverSteps } from './Book';
import { BOOK_ANIM, logoStageIn } from './kitapData';

let extras: Omit<DexExtras, 'mapNames'>;
beforeAll(async () => { await loadMonsters(); extras = await loadDexExtras(); setLang('tr'); });

describe('Dungeondex Kitap', () => {
  it('kapak: başlık, "Dokun, aç", sayaç veriden; kitap kapak açılana dek çizilmez', () => {
    const m = renderToStaticMarkup(<Dungeondex onBack={() => {}} extras={extras} cover />);
    expect(m).toContain('data-testid="dex-cover"');
    expect(m).toContain('Dokun, aç');
    expect(m).toContain('339 büyü');
    expect(m).toContain('330 canavar');
    expect(m).toContain('splash-kapali-kanat');
    expect(m).not.toContain('dex-cat-buyu');
  });
  it('kapak kapalıyken açık kitap: sekmeler, vitrin, şerit, sayfada kart', () => {
    const m = renderToStaticMarkup(<Dungeondex onBack={() => {}} extras={extras} cover={false} initial={{ cat: 'canavar', id: 'goblin-warrior' }} />);
    expect(m).not.toContain('dex-cover');
    expect(m).toContain('dex-tab-buyu');
    expect(m).toContain('ddk-vitrin');
    expect(m).toContain('ddk-serit');
    expect(m).toContain('data-testid="dex-card"');
    expect(m).toContain('monsters/');
    setLang('en');
    try {
      const e = renderToStaticMarkup(<Dungeondex onBack={() => {}} extras={extras} cover />);
      expect(e).toContain(t().dex.cover.tap);
      expect(e).toContain('Tap to open');
    } finally { setLang('tr'); }
  });
  it('kapak adımları: tam = kanat → kapak dönüşü → açık; azaltılmış = kısa fade → açık', () => {
    expect(coverSteps('full').map((s) => s[0])).toEqual(['wings', 'turn', 'open']);
    expect(coverSteps('full')[1]![1]).toBe(BOOK_ANIM.kapakMs);
    expect(coverSteps('reduced').map((s) => s[0])).toEqual(['fade', 'open']);
    expect(coverSteps('reduced')[0]![1]).toBeLessThanOrEqual(400);
  });
  it('logo sahnesi pencereye ortalanır', () => {
    const s = logoStageIn({ x: 0.2, y: 0.25, w: 0.6, h: 0.45 }, 0.75);
    const n = (v: string) => parseFloat(v) / 100;
    expect(n(s.width!)).toBeGreaterThan(0.5);
    expect(n(s.left!) + n(s.width!) / 2).toBeGreaterThan(0.4);
    expect(n(s.left!) + n(s.width!) / 2).toBeLessThan(0.6);
  });
});
