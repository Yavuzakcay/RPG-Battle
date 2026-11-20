/**
 * Görev SD5: oluşturucu ilk adım sadeleştirmesi (tek tür/sınıf ızgarası, açıklamasız kartlar, zorunlu Sürgün, parantezsiz alt sınıf)
 * ve ten maskesi delik kapatma. Yalnız arayüz/görsel; kural ve kayıt sürümü değişmez.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, characterIssues, type SavedCharacter } from '../rules/builder';
import { classes, races } from '../data';
import { subclassPlainName } from '../rules/subclasses';
import { closeMask, closeSkinHoles } from '../ui/maskClose';
import { setLang } from '../i18n';

const char = (patch: Partial<SavedCharacter['sheet']>): SavedCharacter => { const b = blankCharacter('sd5'); return { ...b, sheet: { ...b.sheet, name: 'Ad', ...patch } }; };
const html = (c: SavedCharacter) => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step="character" />);

describe('SD5: ilk adım', () => {
  beforeEach(() => { setLang('tr'); });
  it('bütün türler ve sınıflar tek ızgarada; "Diğer" katı yok; kartta açıklama yok', () => {
    const m = html(char({ raceId: 'human', lineageId: 'tenhausser', classId: 'wizard' }));
    expect((m.match(/race-card-small/g) ?? []).length).toBe(races.length);
    expect((m.match(/class-card-small/g) ?? []).length).toBe(classes.length);
    expect(m).not.toContain('race-more'); expect(m).not.toContain('class-more');
    expect(m).not.toMatch(/Diğer (türler|sınıflar)/);
    expect(m).not.toContain('Ten tonu');
  });
  it('Sur Dışı: Sürgün zorunlu (sorun + uyarı); seçilince sorun yok', () => {
    const base = char({ raceId: 'human', lineageId: 'outwall' });
    expect(characterIssues(base).some((i) => i.step === 'character' && /Sürgün/.test(i.text))).toBe(true);
    expect(html(base)).toContain('exile-grid');
    const ok = char({ raceId: 'human', lineageId: 'outwall', exileCulture: 'khadyrga' });
    expect(characterIssues(ok).some((i) => /Sürgün/.test(i.text))).toBe(false);
    expect(characterIssues(char({ raceId: 'human', lineageId: 'tenhausser' })).some((i) => /Sürgün/.test(i.text))).toBe(false);
  });
  it('alt sınıf adı parantezsiz', () => {
    expect(subclassPlainName({ tr: 'Işık Alanı', en: 'Light Domain' }, 'tr', 'cleric')).not.toContain('(');
  });
});

describe('SD5: ten maskesi delik kapatma', () => {
  it('küçük delikler dolar, büyük boşluk (göz) ve dışarısı dolmaz', () => {
    const W = 12, H = 12; const m = new Uint8Array(W * H).fill(0);
    for (let y = 2; y < 10; y++) for (let x = 2; x < 10; x++) m[y * W + x] = 1;
    m[5 * W + 5] = 0; // 1 pikselik delik
    for (let y = 3; y < 8; y++) for (let x = 7; x < 9; x++) m[y * W + x] = 0; // 2 geniş uzun yarık dolar (≤2 piksel genişlik)
    const out = closeMask(m, W, H);
    expect(out[5 * W + 5]).toBe(1);
    expect(out[0]).toBe(0); expect(out[11 * W + 11]).toBe(0);
  });
  it('keep koruması: koyu ya da renksiz piksel eklenmez; elle maskede (ağırlık) tam ağırlık', () => {
    const W = 8, H = 8; const data = new Uint8ClampedArray(W * H * 4);
    for (let p = 0; p < W * H; p++) { data[p * 4] = 200; data[p * 4 + 1] = 150; data[p * 4 + 2] = 120; data[p * 4 + 3] = 255; }
    const w = new Uint8Array(W * H); for (let y = 1; y < 7; y++) for (let x = 1; x < 7; x++) w[y * W + x] = 255;
    w[3 * W + 3] = 0; w[4 * W + 4] = 0;
    const p1 = 3 * W + 3; // koyu: eklenmez
    data[p1 * 4] = 10; data[p1 * 4 + 1] = 10; data[p1 * 4 + 2] = 10;
    const r = closeSkinHoles(data, undefined, w, W, H);
    expect(r.weights![p1]).toBe(0);
    expect(r.weights![4 * W + 4]).toBe(255);
    expect(w[4 * W + 4]).toBe(0); // özgün dizi değişmez
  });
});
