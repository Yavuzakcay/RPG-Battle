/**
 * Görev M1: ana menü. Kayıtlı savaş varken "devam et" kartı ve kayıt özeti, yokken kart yok; başlık APP_NAME'den,
 * işlevler (Oyuncu, Game Master, Durum, Ayarlar, dil) aynen; simgeler SVG (emoji yok); sürüm package.json'dan.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Home } from './Screens';
import { SAVE_KEY, savedBattleSummary } from '../app/saveKey';
import pkg from '../../package.json';

const memStore = (v: string | null) => ({ getItem: (k: string) => (k === SAVE_KEY ? v : null) });
const save = JSON.stringify({ version: 19, savedAt: '2026-10-30T18:40:00.000Z', events: [
  { type: 'battle_started', state: { round: 1, map: { id: 'kale', variantId: 'gece' } } },
  { type: 'turn_ended', round: 2 }, { type: 'turn_ended', round: 3 },
] });

// Test ortamında localStorage yok: basit bellek deposu.
const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); }, removeItem: (k: string) => { mem.delete(k); } };
afterEach(() => { mem.clear(); });

describe('ana menü', () => {
  it('kayıtlı savaş yok: devam kartı yok; Oyuncu, Game Master, Durum, Ayarlar ve dil anahtarı var', () => {
    const html = renderToStaticMarkup(<Home onPlayer={() => {}} onGm={() => {}} onStatus={() => {}} onSettings={() => {}} />);
    expect(html).not.toContain('home-card resume');
    expect(html).not.toContain('Kayıtlı savaşa devam et');
    for (const s of ['Oyuncu', 'Game Master', 'Durum', 'Ayarlar', 'role="radiogroup"', 'home2-panel']) expect(html).toContain(s);
    expect((html.match(/class="role home-card/g) ?? []).length).toBe(2);
    expect(html).toContain(`Sürüm ${pkg.version.split('.').slice(0, 2).join('.')} · SRD 5.2.1`);
    expect(html).toContain('<svg');
    expect(html).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });
  it('kayıtlı savaş var: devam kartı en üstte ve kayıt özeti (tur, gece)', () => {
    localStorage.setItem(SAVE_KEY, save);
    const html = renderToStaticMarkup(<Home onPlayer={() => {}} onGm={() => {}} onStatus={() => {}} onResume={() => {}} />);
    expect(html).toContain('home-card resume');
    expect(html.indexOf('home-card resume')).toBeLessThan(html.indexOf('home-card player'));
    expect(html).toMatch(/gece · 3\. tur/);
    expect(savedBattleSummary(memStore(save))).toEqual({ mapId: 'kale', variantId: 'gece', round: 3, savedAt: '2026-10-30T18:40:00.000Z' });
    expect(savedBattleSummary(memStore('{ bozuk'))).toBeNull();
    expect(savedBattleSummary(memStore(null))).toBeNull();
  });
});
