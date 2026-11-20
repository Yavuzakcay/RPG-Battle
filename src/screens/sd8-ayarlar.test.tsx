/** SD8 (Ayarlar): sade Ayarlar ekranı, Game Master kurulumunda "Oda kuralları", Keşif Defteri ayrı sayfa; saklama anahtarları aynı. */
import { describe, expect, it, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsScreen } from './SettingsScreen';
import { RoomRules } from '../ui/settings/RoomRules';
import { alignmentEnabled, setAlignmentEnabled } from '../app/features';
import { loadSettings, saveSettings } from '../app/discovery';
import { storedCarryRule } from '../ui/carrySetting';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); }, removeItem: (k: string) => { m.delete(k); }, clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } } as Storage;
}
describe('SD8 Ayarlar', () => {
  beforeEach(() => { (globalThis as { localStorage?: Storage }).localStorage = memoryStorage(); });
  it('Ayarlar: oyuncu ayarları üstte, oda ayarları yok, Gelişmiş katlı, Keşif Defteri tek satır', () => {
    const html = renderToStaticMarkup(<SettingsScreen onBack={() => {}} />);
    for (const s of ['Dil', 'Ses', 'Efekt animasyonu', 'Savaş sonu videosu', 'Hamle önizlemesi', 'Şehir görünümü', 'Harita rengi', 'Keşif Defteri', 'Gelişmiş']) expect(html).toContain(s);
    expect(html).not.toContain('Zar teması'); // zar seçimi karakter oluşturucunun son ekranında
    for (const s of ['Üst seviye', 'Taşıma yükü', 'Alignment', 'Keşif modu', 'İpucu rozetleri', 'Yolculuk (deneme)']) expect(html).not.toContain(s);
    expect(html).not.toContain('???'); // defter satırları ayrı sayfada
    expect(html).not.toContain('paketten'); // eski "N paketten M alt sınıf" satırı kalktı
    expect(html).toContain('<details'); // Gelişmiş
    expect(html).not.toMatch(/<details[^>]* open/);
  });
  it('Oda kuralları: Game Master kurulumu ayarları eski saklama anahtarlarına yazar/okur', () => {
    expect(alignmentEnabled()).toBe(false);
    const html = renderToStaticMarkup(<RoomRules />);
    for (const s of ['Oda kuralları', 'Taşıma yükü', 'Alignment', 'Keşif modu', 'İpucu rozetleri', 'Yolculuk (deneme)']) expect(html).toContain(s);
    expect(html).not.toContain('Üst seviye'); // 2026-11-19: anahtar kalktı
    setAlignmentEnabled(true);
    expect(alignmentEnabled()).toBe(true);
    expect(JSON.parse(localStorage.getItem('rpg-battle-deneysel') ?? '{}').hizalanma).toBe(true);
    saveSettings({ ...loadSettings(), discovery: false });
    expect(JSON.parse(localStorage.getItem('rpg-battle-onizleme') ?? '{}').discovery).toBe(false);
    expect(storedCarryRule()).toBeTruthy();
  });
  it('varsayılanlar korunur: önizleme açık, keşif modu açık, ipucu açık', () => {
    const d = loadSettings();
    expect(d.on && d.discovery && d.hints).toBe(true);
  });
});
