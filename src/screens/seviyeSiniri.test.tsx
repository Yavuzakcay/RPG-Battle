/** 2026-11-19 (kullanıcı kararı): 5. seviye sınırı ve "Üst seviye (6–20)" anahtarı kalktı; sınır her yerde 20 (`LEVEL_CAP`). */
import { describe, expect, it, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { Builder } from './Builder';
import { characterIssues, newCharacter } from '../rules/builder';
import { experimentalFrom } from '../rules/classFeatures';
import { loadCharacters, saveCharacters } from '../app/storage';
import { LEVEL_CAP } from '../app/limits';
import { loadSeruven } from '../app/seruvenSave';
import { JOURNEY_KEY, JOURNEY_VERSION } from '../app/journeySave';
import { executeSeruven, type SeruvenEvent } from '../journey/seruven';
import { partyAt } from '../sim/balance';
import { setAlignmentEnabled } from '../app/features';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); }, removeItem: (k: string) => { m.delete(k); }, clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } } as Storage;
}
beforeEach(() => { (globalThis as { localStorage?: Storage }).localStorage = memoryStorage(); });

const at = (level: number) => { const c = newCharacter(`k${level}`); return { ...c, sheet: { ...c.sheet, level } }; };
const build = (level: number) => renderToStaticMarkup(createElement(Builder, { initial: at(level), onSave: () => {}, onCancel: () => {} }));

describe('seviye sınırı 20, anahtarsız', () => {
  it('tek sabit 20; yeni karakter 1. seviyede başlar', () => {
    expect(LEVEL_CAP).toBe(20);
    expect(newCharacter('x').sheet.level).toBe(1);
  });
  it.each([6, 12, 20])('seviye %i: oluşturucu seçici 1–20, kayıt seviyeyi korur, seviye sınırı sorunu yok', (lv) => {
    const html = build(lv);
    expect(html).toContain('<option value="20"');
    expect(html).not.toContain('<option value="21"');
    expect(html).toMatch(new RegExp(`<option value="${lv}" selected`));
    expect(characterIssues(at(lv)).map((i) => i.step + ':' + i.text).filter((t) => /1–20|seviye aralığı|levelRange/i.test(t))).toEqual([]);
    saveCharacters([at(lv)]);
    expect(loadCharacters()[0]?.sheet.level).toBe(lv);
  });
  it('eski ayar kaydında ustSeviye: false olan kullanıcı yine 20\'yi seçer; anahtar sonraki yazmada düşer', () => {
    localStorage.setItem('rpg-battle-deneysel', JSON.stringify({ ustSeviye: false }));
    expect(build(5)).toContain('<option value="20"');
    setAlignmentEnabled(true);
    expect(JSON.parse(localStorage.getItem('rpg-battle-deneysel') ?? '{}')).toEqual({ hizalanma: true });
  });
  it('6+ "deneysel" uyarısı veriden görünür (anahtarsız)', () => {
    const c0 = at(12);
    const c = { ...c0, sheet: { ...c0.sheet, classId: 'ranger', subclassId: 'imza_ciftci' } };
    const from = experimentalFrom('ranger', 'imza_ciftci');
    expect(from).toBe(6);
    expect(renderToStaticMarkup(createElement(Builder, { initial: c, onSave: () => {}, onCancel: () => {} }))).toContain(`${from}+ seviye deneysel`);
  });
  it('ustSeviye anahtarlı eski Serüven kaydı yüklenir ve 20\'ye dek seviye atlar', () => {
    const party = partyAt(5).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh }));
    const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party, toggles: { irkBaslangic: false, ustSeviye: false } as Record<string, boolean> });
    if (!r.ok) throw new Error(r.error);
    localStorage.setItem(JOURNEY_KEY, JSON.stringify({ version: JOURNEY_VERSION, savedAt: 'x', events: [], seruven: r.events as SeruvenEvent[] }));
    const { state } = loadSeruven();
    expect(state?.level).toBe(5);
    const up = executeSeruven({ ...state!, xp: 999999 }, { type: 'level_up' });
    expect(up.ok && up.state.level).toBe(6);
    expect(executeSeruven({ ...state!, xp: 9999999, level: 19 }, { type: 'level_up' }).ok).toBe(true);
    expect(executeSeruven({ ...state!, xp: 9999999, level: 20 }, { type: 'level_up' }).ok).toBe(false);
  });
});
