/**
 * Ortak simge setleri (glif): `data/glif-esleme.json` kayıtları (32, adlar görev listesiyle birebir ve hücre sırasıyla), eşlemeler
 * ve görsel dosyaları (yalnız ad listesi, `import.meta.glob`; görsel açılmaz), açıklama metni kalıpları.
 */
import { describe, expect, it } from 'vitest';
import data from '../../../data/glif-esleme.json';
import { GLYPH_NAMES, actionGlyph, damageGlyph, glyphSegments, hasGlyph, itemGlyphs, schoolGlyph, spellGlyphs, type GlyphSegment } from './glyphs';
import { eventDamageTypes } from '../logEntries';
import { damageTypesOf } from '../preview/movePreview';
import type { BattleEvent } from '../../battle/types';

const SAYFA1 = ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation',
  'action', 'bonus-action', 'reaction', 'passive', 'concentration', 'ritual', 'attunement', 'cursed'];
const SAYFA2 = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant',
  'slashing', 'thunder', 'healing', 'temporary-hp', 'saving-throw'];
const BIG = new Set(Object.keys(import.meta.glob('/public/glif/*.webp')).map((f) => (f.split('/').pop() as string).replace(/\.webp$/, '')));
const SMALL = new Set(Object.keys(import.meta.glob('/public/glif/kucuk/*.webp')).map((f) => (f.split('/').pop() as string).replace(/\.webp$/, '')));
const KESIM = (data as unknown as { kesim: Record<string, { sayfa: number; hucre: number; kutu: number[] }> }).kesim;
const all = () => true;
const shown = (segs: GlyphSegment[]) => segs.map((p) => ('glif' in p ? `[${p.glif}]` : p.text)).join('');
const plain = (segs: GlyphSegment[]) => segs.map((p) => ('text' in p ? p.text : '')).join('');

describe('glif-esleme: kayıtlar', () => {
  it('32 kayıt; adlar görev listesiyle birebir, hücre sırasıyla; iki sayfa 4×4', () => {
    expect(data.sayfalar.map((p) => p.adlar)).toEqual([SAYFA1, SAYFA2]);
    expect(data.sayfalar.map((p) => p.izgara)).toEqual([[4, 4], [4, 4]]);
    expect(data.sayfalar.map((p) => p.kaynak)).toEqual(['assets-ham/esya/glif-1.jpg', 'assets-ham/esya/glif-2.jpg']);
    expect(GLYPH_NAMES).toEqual([...SAYFA1, ...SAYFA2]);
    expect(new Set(GLYPH_NAMES).size).toBe(32);
    expect(Object.keys(data.adlar).sort()).toEqual([...GLYPH_NAMES].sort());
    for (const ad of GLYPH_NAMES) {
      const l = (data.adlar as Record<string, { tr: string; en: string }>)[ad]!;
      expect(l.tr.length * l.en.length, ad).toBeGreaterThan(0);
    }
  });

  it('eşlemeler yalnız var olan simgelere; 8 okul, 13 hasar türü, 4 eylem türü', () => {
    const names = new Set(GLYPH_NAMES);
    expect(Object.keys(data.okul).sort()).toEqual(['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']);
    expect(Object.keys(data.hasar)).toHaveLength(13);
    for (const v of [...Object.values(data.okul), ...Object.values(data.hasar)]) expect(names.has(v), v).toBe(true);
    for (const [k, v] of Object.entries(data.eylem)) if (k !== 'not') expect(names.has(v), v).toBe(true);
    for (const p of data.metin.kaliplar) expect(names.has(p.glif), p.glif).toBe(true);
    expect(new Set(data.metin.kaliplar.map((p) => p.glif)).size).toBe(16);
  });

  it('kesim kaydı: yalnız bilinen adlar, sayfa ve hücre listedeki yeriyle aynı; kaydı olanın iki dosyası var (128 ve 48 px)', () => {
    for (const [ad, k] of Object.entries(KESIM)) {
      const page = data.sayfalar[k.sayfa - 1]!;
      expect(page.adlar[k.hucre - 1], ad).toBe(ad);
      expect(BIG.has(ad), `public/glif/${ad}.webp`).toBe(true);
      expect(SMALL.has(ad), `public/glif/kucuk/${ad}.webp`).toBe(true);
      expect(hasGlyph(ad)).toBe(true);
    }
    // Kesilmemiş simgenin dosyası da yok (kırık resim çizilmez; dosya kaydı olmadan gelmez).
    for (const f of [...BIG, ...SMALL]) expect(KESIM[f], f).toBeDefined();
  });

  it.skipIf(Object.keys(KESIM).length === 0)('32 simgenin hepsi kesildi (npm run glif)', () => {
    expect(Object.keys(KESIM).sort()).toEqual([...GLYPH_NAMES].sort());
  });
});

describe('glif: başlık eşlemesi', () => {
  it('büyü okul + Concentration + Ritual; eylem türü; hasar türü; eşyada Attunement', () => {
    expect(spellGlyphs({ school: 'Evocation', concentration: true }, true)).toEqual(['evocation', 'concentration', 'ritual']);
    expect(spellGlyphs({ school: 'Illusion', castingTime: 'ritual' })).toEqual(['illusion', 'ritual']);
    expect(spellGlyphs({})).toEqual([]);
    expect(schoolGlyph('Necromancy')).toBe('necromancy');
    expect([actionGlyph('action'), actionGlyph('bonus'), actionGlyph('reaction'), actionGlyph('passive'), actionGlyph('trait')])
      .toEqual(['action', 'bonus-action', 'reaction', 'passive', 'passive']);
    expect([actionGlyph('free'), actionGlyph('legendary'), actionGlyph('resource'), actionGlyph(undefined)]).toEqual([undefined, undefined, undefined, undefined]);
    expect(damageGlyph('Fire')).toBe('fire');
    expect(itemGlyphs({ attunement: true })).toEqual(['attunement']);
    expect(itemGlyphs({})).toEqual([]);
  });
});

describe('glif: açıklama metninde satır içi simge', () => {
  it('hasar türü yalnız "… hasar" / "… damage" önünde; Türkçe büyük harf (Işıltı, Ateş); metin aynen', () => {
    const s = 'Hedef 8d6 Ateş hasarı alır. Işıltı hasarı, gök gürültüsü hasarına; ateşli yaratık; Ateş veya soğuk hasarı. Fire damage.';
    const segs = glyphSegments(s, all);
    expect(plain(segs)).toBe(s);
    expect(shown(segs)).toBe('Hedef 8d6 [fire]Ateş hasarı alır. [radiant]Işıltı hasarı, [thunder]gök gürültüsü hasarına; ateşli yaratık; Ateş veya [cold]soğuk hasarı. [fire]Fire damage.');
  });

  it('geçici can, kurtarma zarı, iyileştirme (TR/EN); sözcük içinde eşleşmez', () => {
    const s = 'DEX kurtarma zarını atar; 2d4 geçici HP ve Temporary Hit Points. Dokunduğun dostu iyileştirirsin; heals 1d8. Geçici canavar yok.';
    expect(shown(glyphSegments(s, all))).toBe('DEX [saving-throw]kurtarma zarını atar; 2d4 [temporary-hp]geçici HP ve [temporary-hp]Temporary Hit Points. Dokunduğun dostu [healing]iyileştirirsin; [healing]heals 1d8. Geçici canavar yok.');
  });

  it('paragraf başına aynı simge en çok 2 kez; yeni paragrafta yeniden', () => {
    const s = 'ateş hasarı, ateş hasarı, ateş hasarı ve soğuk hasarı\nateş hasarı';
    expect(shown(glyphSegments(s, all))).toBe('[fire]ateş hasarı, [fire]ateş hasarı, ateş hasarı ve [cold]soğuk hasarı\n[fire]ateş hasarı');
  });

  it('görseli kesilmemiş simge hiç işaretlenmez (varsayılan: kesim kaydı)', () => {
    const s = 'ateş hasarı';
    expect(glyphSegments(s, (ad) => ad !== 'fire')).toEqual([{ text: s }]);
    if (!hasGlyph('fire')) expect(glyphSegments(s)).toEqual([{ text: s }]);
  });
});

describe('glif: hasar türü çipleri (önizleme kartı, günlük)', () => {
  it('olaylardan hasar türleri; hasarsız olayda yok, ikinci tür dahil', () => {
    const ev = [
      { type: 'attack_resolved', actorId: 'a', targetId: 't', hit: true, appliedDamage: 7, damageType: 'Slashing' },
      { type: 'save_resolved', actorId: 'a', targetId: 't', appliedDamage: 5, damageType: 'fire', secondary: { type: 'radiant', applied: 3 } },
      { type: 'attack_resolved', actorId: 'a', targetId: 'u', hit: false, appliedDamage: 0, damageType: 'piercing' },
    ] as unknown as BattleEvent[];
    expect(damageTypesOf(ev, 't')).toEqual(['slashing', 'fire', 'radiant']);
    expect(eventDamageTypes(ev[1]!)).toEqual(['fire', 'radiant']);
    expect(eventDamageTypes(ev[2]!)).toEqual([]);
  });
});
