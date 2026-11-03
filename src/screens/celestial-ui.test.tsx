/**
 * Kuyruk K20: Celestial (Düşmüş) ev kuralı oluşturucuda. Ayarlar kapalıyken seçilemez (eski Celestial karakter yine
 * görünür), açıkken seçilir; hikâye metni, özellik listesi ve Göksel Uyanış kartları. Oluşturucu duman testi.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, characterIssues, type SavedCharacter } from '../rules/builder';
import { setCelestialEnabled } from '../app/features';
import { combatantFromSheet } from '../battle';

const char = (patch: Partial<SavedCharacter['sheet']> = {}): SavedCharacter => {
  const b = blankCharacter('cel');
  return { ...b, sheet: { ...b.sheet, name: 'Düşmüş', ...patch } };
};
const html = (c: SavedCharacter) => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step="character" />);

// Test ortamında localStorage yok: bellek içi yedek.
if (typeof localStorage === 'undefined') {
  const mem = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); }, removeItem: (k: string) => { mem.delete(k); } };
}
afterEach(() => setCelestialEnabled(false));

describe('Celestial oluşturucuda', () => {
  it('ev kuralı kapalıyken kart yok; eski Celestial karakterde kart görünür', () => {
    expect(html(char({ raceId: 'human' }))).not.toContain('>Celestial<');
    expect(html(char({ raceId: 'celestial' }))).toContain('Celestial');
  });
  it('açıkken seçilir: hikâye, özellikler ve üç Göksel Uyanış kartı', () => {
    setCelestialEnabled(true);
    expect(html(char({ raceId: 'human' }))).toContain('Celestial');
    const out = html(char({ raceId: 'celestial', level: 3, celestialAwakening: 'kirik-kanat' }));
    expect(out).toContain('Göksel Ada');
    for (const name of ['Düşmüşün Görüşü', 'Şifa Eli', 'Parlayan Ruh', 'Gece Gözyaşı', 'Kırık Kanat']) expect(out).toContain(name);
    expect(out).toContain('yere inmen gerekir');
  });
  it('duman: 12 sınıf × seviye 1/3/5 Celestial karakter sorunsuz kurulur ve savaşçıya dönüşür', () => {
    setCelestialEnabled(true);
    for (const classId of ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']) {
      for (const level of [1, 3, 5]) {
        const c = char({ raceId: 'celestial', classId, level });
        expect(() => html(c)).not.toThrow();
        // Sınıf kuralları (alt sınıf, invocation) ayrı; tür/soy sorunu yok.
        expect(characterIssues(c).filter((i) => i.step === 'character' && /tür|Celestial|soy/i.test(i.text)).map((i) => `${classId}: ${i.text}`)).toEqual([]);
        const cb = combatantFromSheet(c.sheet, { id: 'x', ownerId: 'p' });
        expect(cb.features?.some((f) => f.key === 'ev:celestial/awakening')).toBe(level >= 3);
      }
    }
  });
});
