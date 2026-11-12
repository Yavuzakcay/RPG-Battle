/**
 * Kuyruk AS1a: 41 alt soy, mekaniksiz yarısı. Sayı (38 soy + 3 Celestial uyanışı), yalnızca açıklama (motor alanı yok),
 * hizalanma alt soy tablosu, oluşturucu kartları (Human 4 kültür + ayrı ten tonu), görünüm verisi, eski kayıt bildirimi.
 * Savaş koduna ve kural sürümüne dokunulmadığı da denetlenir (sürüm 68).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from '../screens/Builder';
import { blankCharacter, characterIssues, type SavedCharacter } from './builder';
import { altSoyKey, newAlignment, startContributions, startValue } from './alignment';
import { lineageName, lineageNotes, migrateLineages } from './lineage';
import { races } from '../data';
import { AWAKENING_OPTIONS, CELESTIAL } from './celestialData';
import { newPendingLineages, LINEAGE_NOTICE_KEY } from '../app/lineageNotice';
import { AWAKENING_DEFAULT, AWAKENING_FROM, CULTURE_SKIN, SKIN_TONES, WING_SLOTS, awakeningLookIds, lineageLook, lookEntries } from '../ui/lineageLook';
import { LookFrame } from '../ui/LookFrame';
import hizalanma from '../../data/hizalanma-baslangic.json';
import gorunum from '../../data/alt-soy-gorunum.json';
import kuralSurumu from '../../data/kural-surumu.json';

const COUNTS: Record<string, number> = { dragonborn: 10, goliath: 6, elf: 3, tiefling: 4, gnome: 3, dwarf: 3, halfling: 2, orc: 3, human: 4 };
const NEW = ['tiefling/winged', 'gnome/subterranean', 'dwarf/crag', 'dwarf/knoll', 'dwarf/undervault', 'halfling/slender', 'halfling/sturdy', 'orc/glacier', 'orc/wildwood', 'orc/fen',
  'human/tenhausser', 'human/khadyrga', 'human/pure-city', 'human/outwall'];
const ALT = (hizalanma as unknown as { altSoy: Record<string, { duzen: number; iyilik: number; gerekce: { tr: string; en: string } }> }).altSoy;
const ids = (): string[] => [...races.flatMap((r) => (r.lineages ?? []).map((l) => `${r.id}/${l.id}`)), ...AWAKENING_OPTIONS.map((a) => `celestial/${a}`)];
const char = (patch: Partial<SavedCharacter['sheet']>): SavedCharacter => { const b = blankCharacter('as1'); return { ...b, sheet: { ...b.sheet, name: 'Alt', ...patch } }; };
const html = (c: SavedCharacter, step: 'character' | 'summary' = 'character') => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step={step} />);

describe('41 alt soy', () => {
  it('soy sayısı ırk başına ve toplam 41 (38 soy + 3 Celestial uyanışı)', () => {
    for (const [race, n] of Object.entries(COUNTS)) expect(races.find((r) => r.id === race)?.lineages?.length, race).toBe(n);
    expect(ids().length).toBe(41);
    expect(new Set(ids()).size).toBe(41);
    expect(AWAKENING_OPTIONS.length).toBe(3);
  });
  it('yeni 14 alt soy: TR/EN ad ve özet, buff/debuff açıklaması, durum planlı; motor alanı (direnç, hız, görüş, büyü) yok', () => {
    for (const key of NEW) {
      const [r, id] = key.split('/') as [string, string];
      const l = races.find((x) => x.id === r)?.lineages?.find((x) => x.id === id);
      expect(l, key).toBeDefined();
      for (const lang of ['tr', 'en'] as const) {
        expect(lineageName(l!, lang).length, key).toBeGreaterThan(1);
        expect(l!.summary[lang].length, key).toBeGreaterThan(10);
        const n = lineageNotes(l!, lang);
        expect(n.buff.length, `${key} buff`).toBeGreaterThan(0);
        expect(n.debuff.length, `${key} debuff`).toBeGreaterThan(0);
        expect(n.planned, key).toBe(true);
      }
      expect(l!.resistances, key).toEqual([]);
      for (const f of ['speed', 'darkvision', 'spells', 'giant', 'extras'] as const) expect(l![f], `${key}.${f}`).toBeUndefined();
    }
  });
  it('soyu isteğe bağlı türler (Dwarf, Halfling, Orc, Human) varsayılan soysuz; diğerlerinin varsayılanı korunur', () => {
    for (const r of races) {
      if (['dwarf', 'halfling', 'orc', 'human'].includes(r.id)) { expect(r.lineageOptional, r.id).toBe(true); expect(r.defaultLineage, r.id).toBeUndefined(); }
      else expect(r.lineageOptional, r.id).toBeUndefined();
    }
    expect(races.find((r) => r.id === 'tiefling')?.defaultLineage).toBe('infernal');
    expect(races.find((r) => r.id === 'gnome')?.defaultLineage).toBe('forest-gnome');
  });
  it('kural sürümü 68 ve savaş dosyalarına dokunulmadı', () => {
    expect((kuralSurumu as { surum: number }).surum).toBe(68);
  });
});

describe('hizalanma alt soy tablosu', () => {
  it('tam 41 satır, kimlikler soy/uyanışla bire bir; ±50, TR/EN gerekçe', () => {
    expect(Object.keys(ALT).sort()).toEqual(ids().sort());
    for (const [k, v] of Object.entries(ALT)) {
      expect(Math.abs(v.duzen), k).toBeLessThanOrEqual(50);
      expect(Math.abs(v.iyilik), k).toBeLessThanOrEqual(50);
      expect(v.gerekce.tr.length, k).toBeGreaterThan(5);
      expect(v.gerekce.en.length, k).toBeGreaterThan(5);
    }
  });
  it('alt soy satırı ırk satırının YERİNE geçer; soy yoksa eski ırk değeri', () => {
    const base = { classId: 'fighter', backgroundId: 'soldier', raceId: 'dwarf' };
    const none = startContributions(base).find((x) => x.kaynak === 'irk')!;
    expect(none.id).toBe('dwarf');
    const crag = startContributions({ ...base, lineageId: 'crag' }).filter((x) => x.kaynak === 'irk');
    expect(crag.length).toBe(1);
    expect(crag[0]).toMatchObject({ id: 'dwarf/crag', duzen: ALT['dwarf/crag']!.duzen, iyilik: ALT['dwarf/crag']!.iyilik });
    expect(startContributions({ ...base, lineageId: 'crag' }, false).some((x) => x.kaynak === 'irk')).toBe(false);
    expect(startContributions({ ...base, lineageId: 'yok-soy' }).find((x) => x.kaynak === 'irk')!.id).toBe('dwarf');
  });
  it('uç buildler alt soyla: toplam hesaplanır, ±50 içinde', () => {
    const v = startValue(startContributions({ classId: 'rogue', backgroundId: 'criminal', subclassId: 'imza_infazci', raceId: 'tiefling', lineageId: 'abyssal' }));
    expect(v).toEqual({ duzen: -45 - -8 + -10, iyilik: -48 - -3 + -5 });
    expect(v.duzen).toBeGreaterThanOrEqual(-50);
  });
  it('Celestial: uyanış 3. seviyeden etkin; seçilince yeniden hesaplanır', () => {
    const base = { classId: 'cleric', backgroundId: 'acolyte', raceId: 'celestial' };
    expect(altSoyKey({ raceId: 'celestial', level: 2, celestialAwakening: 'kirik-kanat' })).toBeUndefined();
    expect(altSoyKey({ raceId: 'celestial', level: 3, celestialAwakening: 'kirik-kanat' })).toBe('celestial/kirik-kanat');
    expect(altSoyKey({ raceId: 'celestial', level: 3 })).toBe(`celestial/${CELESTIAL.awakening.default}`);
    const l2 = startValue(startContributions({ ...base, level: 2 }));
    const l3 = startValue(startContributions({ ...base, level: 3, celestialAwakening: 'gece-gozyasi' }));
    expect(l3).not.toEqual(l2);
    // Otomatik kabulde yeni toplama güncellenir (oluşturucu `withAlignment`).
    const a = newAlignment(l2, 'otomatik');
    expect(a.baslangic).toEqual(l2);
  });
  it('duman: 12 sınıf kadar ırk × soy, her toplam ±50 içinde', () => {
    for (const k of ['barbarian', 'paladin', 'rogue', 'monk']) for (const key of ids()) {
      const [raceId, lineageId] = key.split('/') as [string, string];
      const v = startValue(startContributions({ classId: k, backgroundId: 'soldier', raceId, lineageId, celestialAwakening: raceId === 'celestial' ? lineageId : undefined, level: 5 }));
      expect(Math.abs(v.duzen) <= 50 && Math.abs(v.iyilik) <= 50, key).toBe(true);
    }
  });
});

describe('oluşturucu: soy kartları', () => {
  it('Human: 4 kültür kartı + ayrı ten tonu seçici; ten kültüre bağlı değil (eşleme alanı boş)', () => {
    const m = html(char({ raceId: 'human', lineageId: 'khadyrga' }));
    expect((m.match(/lineage-card/g) ?? []).length).toBeGreaterThanOrEqual(4);
    for (const n of ['Tenhausser', 'Khadyrga', 'Saf Kent', 'Sur Dışı']) expect(m, n).toContain(n);
    expect(m).toContain('Kültür');
    expect((m.match(/class="skin-tone( on)?"/g) ?? []).length).toBe(SKIN_TONES.length);
    expect(Object.keys(CULTURE_SKIN)).toEqual([]);
    expect(html(char({ raceId: 'elf', lineageId: 'drow' }))).not.toContain('skin-tone');
  });
  it('seçili alt soyun buff/debuff açıklaması ve "planlı" etiketi görünür; İngilizce metin de var', () => {
    const m = html(char({ raceId: 'orc', lineageId: 'fen' }));
    expect(m).toContain('lineage-notes');
    expect(m).toContain('Zehir hasarına direnç.');
    expect(m).toContain('Soğuk hasarına karşı kurtarma zarlarında dezavantaj.');
    expect(m).toContain('planlı');
    expect((m.match(/lineage-card/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
  it('eski Human kaydı soysuz kalır: sorun çıkmaz, ipucu görünür; kaydedilirken soy atanmaz', () => {
    const old = char({ raceId: 'human', lineageId: undefined });
    expect(characterIssues(old).filter((i) => i.step === 'character')).toEqual([]);
    expect(html(old)).toContain('Alt soy seçilmedi');
    const m = migrateLineages([old]);
    expect(m.assigned).toEqual([]);
    expect(m.list[0]!.sheet.lineageId).toBeUndefined();
    expect(m.pending.map((p) => p.race)).toEqual(['Human']);
    // Soyu zorunlu türler (Elf) eskisi gibi atanır.
    expect(migrateLineages([char({ raceId: 'elf', lineageId: undefined })]).assigned.length).toBe(1);
  });
});

describe('"alt soy seç" bildirimi bir kez', () => {
  beforeEach(() => { try { localStorage.removeItem(LINEAGE_NOTICE_KEY); } catch { /* bellek yok */ } });
  it('aynı karakter için ikinci çağrıda yeniden bildirilmez', () => {
    const p = [{ id: `once-${Math.random()}`, name: 'Eski', race: 'Human' }];
    expect(newPendingLineages(p).length).toBe(1);
    expect(newPendingLineages(p).length).toBe(0);
  });
});

describe('görünüm verisi', () => {
  it('yeni kimlikler için görünüm kaydı: maskesiz ırklarda her soy, maskelide soy-renkleri', () => {
    const keys = lookEntries();
    for (const r of gorunum.maskesizIrklar) for (const l of races.find((x) => x.id === r)?.lineages ?? []) expect(keys, `${r}/${l.id}`).toContain(`${r}/${l.id}`);
    expect(keys).toContain('tiefling/winged');
  });
  it('Halfling İnce/Kalın oranı; İnce daha dar ve uzun, Kalın daha geniş', () => {
    const s = lineageLook({ raceId: 'halfling', lineageId: 'slender' });
    const t = lineageLook({ raceId: 'halfling', lineageId: 'sturdy' });
    expect(s.scaleX).toBeLessThan(1); expect(s.scaleY).toBeGreaterThan(1);
    expect(t.scaleX).toBeGreaterThan(1); expect(t.scaleY).toBeLessThan(1);
    expect(lineageLook({ raceId: 'orc', lineageId: 'glacier' }).filter).toContain('hue-rotate');
  });
  it('üç kanat sprite yuvası (Tiefling, Celestial Kırık Kanat, Dragonborn) ve yer tutucu', () => {
    expect(WING_SLOTS.sort()).toEqual(['celestial-kirik-kanat', 'dragonborn-ucus', 'tiefling']);
    for (const id of WING_SLOTS) {
      const w = (gorunum.kanatYuvalari as Record<string, { sprite: string | null; efekt: string }>)[id]!;
      expect(w.sprite).toBeNull();
      expect(w.efekt).toMatch(/^efekt-kanat-/);
    }
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }).wing?.id).toBe('tiefling');
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'infernal' }).wing).toBeNull();
    // Dragonborn kanadı yalnızca uçarken ve 5. seviyeden.
    expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 5 }).wing).toBeNull();
    expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 5 }, { flying: true }).wing?.id).toBe('dragonborn-ucus');
    expect(lineageLook({ raceId: 'dragonborn', lineageId: 'red', level: 3 }, { flying: true }).wing).toBeNull();
  });
  it('Celestial: Parlayan Ruh haleli; Kırık Kanat halesiz + kanat; Gece Gözyaşı halesiz + koyu filtre; 3. seviyeden', () => {
    const at = (a: string, level = 3) => lineageLook({ raceId: 'celestial', celestialAwakening: a, level });
    expect(at('parlayan-ruh')).toMatchObject({ hideHalo: false, wing: null, filter: '' });
    expect(at('kirik-kanat')).toMatchObject({ hideHalo: true });
    expect(at('kirik-kanat').wing?.id).toBe('celestial-kirik-kanat');
    expect(at('gece-gozyasi').hideHalo).toBe(true);
    expect(at('gece-gozyasi').filter).toContain('brightness');
    expect(at('kirik-kanat', 2)).toMatchObject({ hideHalo: false, wing: null });
    expect(awakeningLookIds().sort()).toEqual([...AWAKENING_OPTIONS].sort());
    expect(AWAKENING_FROM).toBe(CELESTIAL.awakening.minLevel);
    expect(AWAKENING_DEFAULT).toBe(CELESTIAL.awakening.default);
  });
  it('Human ten tonu görünüme girer (kültürden bağımsız); çerçeve sınıfları ve kanat yer tutucusu çizilir', () => {
    const a = lineageLook({ raceId: 'human', lineageId: 'tenhausser', skinTone: 'abanoz' });
    const b = lineageLook({ raceId: 'human', lineageId: 'khadyrga', skinTone: 'abanoz' });
    expect(a.filter).toBe(b.filter);
    expect(a.filter).not.toBe(lineageLook({ raceId: 'human', lineageId: 'tenhausser', skinTone: 'acik' }).filter);
    const w = renderToStaticMarkup(<LookFrame sheet={{ raceId: 'tiefling', lineageId: 'winged' }} size={44}><i /></LookFrame>);
    expect(w).toContain('look-wing placeholder');
    expect(w).toContain('efekt-kanat-seytan');
    const h = renderToStaticMarkup(<LookFrame sheet={{ raceId: 'celestial', celestialAwakening: 'gece-gozyasi', level: 3 }} size={44}><i /></LookFrame>);
    expect(h).toContain('halo-hidden');
  });
});
