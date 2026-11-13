/**
 * Görev AS1b düzeltmesi (kullanıcı): Human kültürleri Tenhausser, Khadyrga, Saf Kent, Sur Dışı ("Sürgünü" eki yok). Sur Dışı
 * seçilince ek "Sürgün" seçimi (yalnız üç kültür; yalnız görünüm, buff/debuff Sur Dışı'nınki). Başka kültürde görünmez,
 * Sur Dışı'ndan çıkınca sıfırlanır. Kültür–ten eşlemesi boşken üç ton serbest; eşleme dolunca (yalnız veri) sürgün tonu belirler.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from '../screens/Builder';
import { blankCharacter, type SavedCharacter } from './builder';
import { setLang } from '../i18n';
import { races } from '../data';
import { sheetAvatar } from '../battle/avatar';
import { lineageSummary } from './lineage';
import { CULTURE_SKIN, EXILE, exileName, exileOf, exileOptions, pickCulture, SKIN_TONES, cultureSkinTone, skinTint, tonesFor } from '../ui/lineageLook';

const char = (patch: Partial<SavedCharacter['sheet']>): SavedCharacter => { const b = blankCharacter('as1b'); return { ...b, sheet: { ...b.sheet, name: 'Alt', ...patch } }; };
const html = (c: SavedCharacter) => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step="character" />);
const human = () => races.find((r) => r.id === 'human');

afterEach(() => setLang('tr'));

describe('AS1b düzeltmesi: Human kültürleri ve Sur Dışı sürgünü', () => {
  it('kültür adları ekisiz; Sur Dışı\'nda Sürgün seçimi yalnız üç seçenekle; diğer kültürlerde yok', () => {
    expect(human()?.lineages?.map((l) => l.ad?.tr)).toEqual(['Tenhausser', 'Khadyrga', 'Saf Kent', 'Sur Dışı']);
    const out = html(char({ raceId: 'human', lineageId: 'outwall' }));
    expect((out.match(/class="pick-card exile-card( on)?"/g) ?? []).length).toBe(3);
    for (const n of ['Tenhausser Sürgünü', 'Khadyrga Sürgünü', 'Saf Kent Sürgünü']) expect(out).toContain(n);
    expect(exileOptions('outwall')).toEqual(['tenhausser', 'khadyrga', 'pure-city']);
    for (const k of ['tenhausser', 'khadyrga', 'pure-city']) {
      expect(exileOptions(k)).toEqual([]);
      expect(html(char({ raceId: 'human', lineageId: k }))).not.toContain('exile-card');
    }
  });
  it('Sur Dışı\'ndan çıkınca sürgün sıfırlanır; Sur Dışı\'nda kalınca korunur; geçersiz sürgün yok sayılır', () => {
    const s = { lineageId: 'outwall', exileCulture: 'khadyrga', skinTone: 'siyahi' };
    expect(pickCulture(s, 'tenhausser').exileCulture).toBeUndefined();
    expect(pickCulture(s, 'outwall').exileCulture).toBe('khadyrga');
    expect(exileOf('outwall', 'outwall')).toBeUndefined();
    expect(exileOf('tenhausser', 'khadyrga')).toBeUndefined();
  });
  it('buff/debuff her zaman Sur Dışı\'nınki (sürgün seçimi değiştirmez)', () => {
    const outwall = human()?.lineages?.find((l) => l.id === 'outwall');
    const a = html(char({ raceId: 'human', lineageId: 'outwall' }));
    const b = html(char({ raceId: 'human', lineageId: 'outwall', exileCulture: 'tenhausser' }));
    const sum = outwall ? lineageSummary(outwall, 'tr') : '';
    expect(sum.length).toBeGreaterThan(0);
    expect(a).toContain(sum); expect(b).toContain(sum);
    // Ten tonu listesi sürgüne göre değişir (tasarım); buff/debuff notları aynı kalır.
    const notes = (h: string) => h.match(/<div class="lineage-notes".*?<\/ul><\/div><\/div>/s)?.[0];
    expect(notes(b)).toBeDefined(); expect(notes(b)).toBe(notes(a));
  });
  it('Sur Dışı + Sürgün: tonlar sürgün kültürünün satırından (tek ton kendiliğinden); sürgünsüz üç ton; jeton boyası aynı çözücüden', () => {
    expect(CULTURE_SKIN).toEqual({ tenhausser: ['siyahi'], khadyrga: ['orijinal'], 'pure-city': ['dogu-asyali'], outwall: ['orijinal', 'siyahi', 'dogu-asyali'] });
    expect(tonesFor('outwall')).toEqual(SKIN_TONES);
    expect(tonesFor('outwall', 'tenhausser').map((t) => t.id)).toEqual(['siyahi']);
    expect(tonesFor('outwall', 'pure-city').map((t) => t.id)).toEqual(['dogu-asyali']);
    expect(cultureSkinTone('outwall', 'orijinal', 'tenhausser')).toBe('siyahi');
    expect(cultureSkinTone('outwall', 'dogu-asyali', 'khadyrga')).toBe('orijinal');
    expect(cultureSkinTone('outwall', 'siyahi')).toBe('siyahi');
    expect(pickCulture({ lineageId: 'outwall', exileCulture: 'pure-city', skinTone: 'siyahi' }, 'outwall').skinTone).toBe('dogu-asyali');
    expect(pickCulture({ lineageId: 'outwall', exileCulture: 'khadyrga', skinTone: 'siyahi' }, 'tenhausser')).toEqual({ lineageId: 'tenhausser', exileCulture: undefined, skinTone: 'siyahi' });
    const h = html(char({ raceId: 'human', lineageId: 'outwall', exileCulture: 'tenhausser', skinTone: 'orijinal' }));
    expect((h.match(/class="skin-tone( on)?"/g) ?? []).length).toBe(1);
    expect(h).toContain('class="skin-tone on" data-tone="siyahi"');
    const sheet = (exileCulture?: string, skinTone?: string) => ({ ...char({ raceId: 'human', lineageId: 'outwall', exileCulture, skinTone }).sheet });
    expect(sheetAvatar(sheet('tenhausser', 'orijinal')).tint).toEqual(skinTint('human', 'siyahi'));
    expect(sheetAvatar(sheet('khadyrga', 'siyahi')).tint).toBeUndefined();
    expect(sheetAvatar(sheet(undefined, 'siyahi')).tint).toEqual(skinTint('human', 'siyahi'));
  });
  it('eski kayıt (sürgün alanı yok) etkilenmez; TR/EN metinler', () => {
    expect(html(char({ raceId: 'human', lineageId: 'outwall' }))).toContain('Sürgün');
    expect(Object.keys(EXILE.ad).sort()).toEqual(['khadyrga', 'pure-city', 'tenhausser']);
    expect(exileName('pure-city', 'en')).toBe('Pure City Exile');
    setLang('en');
    const en = html(char({ raceId: 'human', lineageId: 'outwall' }));
    expect(en).toContain('Tenhausser Exile');
    expect(en).toContain('Exile');
  });
});
