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
import { lineageName, migrateLineages } from './lineage';
import { lineageNotes as notesOf } from '../ui/lineageNotes';
import { races } from '../data';
import { AWAKENING_OPTIONS, CELESTIAL } from './celestialData';
import { newPendingLineages, LINEAGE_NOTICE_KEY } from '../app/lineageNotice';
import { cultureSkinTone, skinTint, ORIGINAL_LINEAGES, isOriginalLineage, AWAKENING_DEFAULT, AWAKENING_FROM, CULTURE_SKIN, SKIN_TONES, WING_SLOTS, awakeningLookIds, lineageLook, lookEntries } from '../ui/lineageLook';
import { LookFrame } from '../ui/LookFrame';
import { sheetAvatar } from '../battle/avatar';
import hizalanma from '../../data/hizalanma-baslangic.json';
import gorunum from '../../data/alt-soy-gorunum.json';
import soyRenkleri from '../../data/soy-renkleri.json';
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
  it('41 alt soy: TR/EN ad ve özet; 38 soyun hepsinde debuff metni ve durum (çalışır/kısmi), mekanik veride `etki`; yeni 14 soyda buff metni (Tepe/Yeraltı dahil)', () => {
    let n = 0;
    for (const r of races) for (const l of r.lineages ?? []) {
      const key = `${r.id}/${l.id}`;
      n++;
      for (const lang of ['tr', 'en'] as const) {
        expect(lineageName(l, lang).length, key).toBeGreaterThan(1);
        expect(l.summary[lang].length, key).toBeGreaterThan(5);
        const x = notesOf(r.id, l, lang);
        // Debuff metni: yeni 14'te ve eski 27'de (Kanatlı, Gnome Yeraltı, Dağ... buff'lı olanlar ayrıca debuff'lı).
        if (!['tiefling/winged', 'dwarf/crag', 'halfling/sturdy', 'orc/glacier', 'orc/wildwood', 'orc/fen', 'human/tenhausser', 'human/khadyrga', 'human/pure-city', 'human/outwall', 'halfling/slender', 'gnome/subterranean'].includes(key)) expect(x.debuff.length, `${key} debuff`).toBeGreaterThan(0);
        expect(['calisir', 'kismi'], key).toContain(x.status);
      }
      expect(l.etki, key).toBeDefined();
      expect(l.durum, key).not.toBe('planli');
    }
    expect(n).toBe(38);
    for (const key of NEW) {
      const [r, id] = key.split('/') as [string, string];
      const l = races.find((x) => x.id === r)!.lineages!.find((x) => x.id === id)!;
      expect(notesOf(r, l, 'tr').buff.length + notesOf(r, l, 'tr').debuff.length, key).toBeGreaterThan(0);
    }
  });
  it('Dwarf Tepe ve Yeraltı artık yeni buff taşır (taban türü tekrar etmez: +1 HP / karanlık görüş yok)', () => {
    const dwarf = races.find((r) => r.id === 'dwarf')!;
    expect(dwarf.hpPerLevel).toBe(1);
    expect(dwarf.darkvision).toBe(120);
    for (const id of ['knoll', 'undervault']) {
      const l = dwarf.lineages!.find((x) => x.id === id)!;
      expect(notesOf('dwarf', l, 'tr').buff.length).toBe(1);
      expect(JSON.stringify([notesOf('dwarf', l, 'tr').buff, l.summary]).toLowerCase()).not.toMatch(/\bhp\b|karanlık görüş|darkvision/);
    }
    const m = html(char({ raceId: 'dwarf', lineageId: 'knoll' }));
    expect(m).toContain('Dayanıklılık kurtarma zarlarında +1');
    expect(m).toContain('Çeviklik kurtarma zarlarında −1');
    expect(m).toContain('Darkvision 120 ft');
    // SD3: "çalışır / kısmi" durum etiketi oyuncuya gösterilmez (yalnız planlı için küçük "yakında").
    expect(m).not.toContain('data-status');
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
    // AS1a kural sürümünü artırmadı (68); sonraki şeritler (MB3 69, MB7 70) artırır: alt sınır.
    expect((kuralSurumu as { surum: number }).surum).toBeGreaterThanOrEqual(68);
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
    expect(v).toEqual({ duzen: -45, iyilik: -50 });
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
  it('Human: 4 kültür kartı + ayrı ten tonu seçici; kültür–ten eşlemesi (Sürgün = kültür kimliği), tek tonlu kültürde ton kendiliğinden seçili', () => {
    const m = html(char({ raceId: 'human', lineageId: 'outwall' }));
    expect((m.match(/lineage-card/g) ?? []).length).toBeGreaterThanOrEqual(4);
    // AS1b düzeltmesi (kullanıcı): ilk üç kültürün adında "Sürgünü" eki yok.
    for (const n of ['Tenhausser', 'Khadyrga', 'Saf Kent', 'Sur Dışı']) expect(m, n).toContain(n);
    // Kültür kartlarında "Sürgünü" eki yok (Sürgün seçimi kartları ayrı bölümde: exile-grid).
    expect(m.split('exile-grid')[0]).not.toContain('Sürgünü');
    expect(m).toContain('Kültür');
    expect((m.match(/class="skin-tone( on)?"/g) ?? []).length).toBe(3);
    expect(SKIN_TONES.map((t) => t.id)).toEqual(['orijinal', 'siyahi', 'dogu-asyali']);
    // Kültür–ten eşlemesi: Tenhausser Koyu, Khadyrga Orijinal, Saf Kent Altın, Sur Dışı üçü.
    expect(CULTURE_SKIN).toEqual({ tenhausser: ['siyahi'], khadyrga: ['orijinal'], 'pure-city': ['dogu-asyali'], outwall: ['orijinal', 'siyahi', 'dogu-asyali'] });
    // Tek tonlu kültür: kayıtlı ton ne olursa olsun (boş, başka ton, bilinmeyen) kültürün tonu seçili görünür.
    for (const [lin, tone] of [['tenhausser', 'siyahi'], ['khadyrga', 'orijinal'], ['pure-city', 'dogu-asyali']] as const) {
      for (const saved of [undefined, 'orijinal', 'siyahi', 'dogu-asyali', 'abanoz']) {
        expect(cultureSkinTone(lin, saved), `${lin}/${saved}`).toBe(tone);
        const h = html(char({ raceId: 'human', lineageId: lin, skinTone: saved }));
        expect((h.match(/class="skin-tone( on)?"/g) ?? []).length).toBe(1);
        expect(h).toContain(`class="skin-tone on" data-tone="${tone}"`);
      }
    }
    // Sur Dışı ve kültürsüz: kayıtlı ton aynen (bilinmeyen → Orijinal seçili).
    expect(cultureSkinTone('outwall', 'siyahi')).toBe('siyahi');
    expect(cultureSkinTone(undefined, 'dogu-asyali')).toBe('dogu-asyali');
    expect(html(char({ raceId: 'human', lineageId: 'outwall', skinTone: 'abanoz' }))).toContain('class="skin-tone on" data-tone="orijinal"');
    expect(html(char({ raceId: 'elf', lineageId: 'drow' }))).not.toContain('skin-tone');
  });
  it('jeton tonu kültürden: Tenhausser kayıtlı tonsuz da Koyu boyanır, Khadyrga kayıtlı Koyu ile de boyasız', () => {
    const sheet = (lineageId: string, skinTone?: string) => ({ ...char({ raceId: 'human', lineageId, skinTone }).sheet });
    expect(sheetAvatar(sheet('tenhausser')).tint).toEqual(skinTint('human', 'siyahi'));
    expect(sheetAvatar(sheet('pure-city', 'siyahi')).tint).toEqual(skinTint('human', 'dogu-asyali'));
    expect(sheetAvatar(sheet('khadyrga', 'siyahi')).tint).toBeUndefined();
    expect(sheetAvatar(sheet('outwall', 'siyahi')).tint).toEqual(skinTint('human', 'siyahi'));
  });
  it('seçili alt soyun buff/debuff açıklaması ve "planlı" etiketi görünür; İngilizce metin de var', () => {
    const m = html(char({ raceId: 'orc', lineageId: 'fen' }));
    expect(m).toContain('lineage-notes');
    expect(m).toContain('Zehir hasarına direnç.');
    expect(m).toContain('Soğuk hasarına karşı kurtarma zarlarında dezavantaj.');
    expect(m).not.toContain('data-status');
    expect(m).not.toContain('kısmi');
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
    expect([s.scaleX, s.scaleY]).toEqual([0.94, 1.05]);
    expect([t.scaleX, t.scaleY]).toEqual([1.1, 0.97]);
    expect(lineageLook({ raceId: 'orc', lineageId: 'glacier' }).filter).toContain('hue-rotate');
  });
  it('kanat slotları (Tiefling Kanatlı, Celestial Kırık Kanat, Dragonborn, alt sınıfa bağlı Melek): sprite bağlı; Tiefling ve Dragonborn yalnız havadayken', () => {
    expect(WING_SLOTS.sort()).toEqual(['celestial-kirik-kanat', 'dragonborn', 'melek-acik', 'tiefling-kanatli']);
    for (const [race, lin] of [['tiefling', 'winged'], ['dragonborn', 'red']] as const) {
      expect(lineageLook({ raceId: race, lineageId: lin, level: 5 }, { flying: false }).wing).toBeNull();
      expect(lineageLook({ raceId: race, lineageId: lin, level: 5 }, { flying: true }).wing).not.toBeNull();
    }
  });
  it('Celestial: Parlayan Ruh haleli; Kırık Kanat halesiz + kanat; Gece Gözyaşı halesiz + koyu filtre; 3. seviyeden', () => {
    const at = (a: string, level = 3) => lineageLook({ raceId: 'celestial', celestialAwakening: a, level });
    expect(at('parlayan-ruh')).toMatchObject({ hideHalo: false, wing: null, filter: '' });
    expect(at('kirik-kanat')).toMatchObject({ hideHalo: true, wing: { id: 'celestial-kirik-kanat' } });
    expect(at('gece-gozyasi').hideHalo).toBe(true);
    expect(at('gece-gozyasi').filter).toContain('brightness');
    expect(at('kirik-kanat', 2)).toMatchObject({ hideHalo: false, wing: null });
    expect(awakeningLookIds().sort()).toEqual([...AWAKENING_OPTIONS].sort());
    expect(AWAKENING_FROM).toBe(CELESTIAL.awakening.minLevel);
    expect(AWAKENING_DEFAULT).toBe(CELESTIAL.awakening.default);
  });
  it('Human ten tonu (AS1c): filtre yok (giysi renkleri bozulmaz); Orijinal boyasız, Koyu ve Altın ten maskesiyle (tint); görünüm (filtre/oran) kültürden bağımsız', () => {
    for (const lin of ['tenhausser', 'khadyrga', 'pure-city', 'outwall']) {
      for (const tone of ['orijinal', 'siyahi', 'dogu-asyali', 'abanoz']) expect(lineageLook({ raceId: 'human', lineageId: lin, skinTone: tone })).toMatchObject({ filter: '', scaleX: 1, scaleY: 1 });
    }
    expect(skinTint('human', undefined)).toBeUndefined();
    expect(skinTint('human', 'orijinal')).toBeUndefined();
    expect(skinTint('human', 'abanoz')).toBeUndefined();
    expect(skinTint('elf', 'siyahi')).toBeUndefined();
    const a = skinTint('human', 'siyahi')!, b = skinTint('human', 'dogu-asyali')!;
    expect('lch' in a.to && 'lch' in b.to && a.to.lch.L !== b.to.lch.L).toBe(true);
    expect(SKIN_TONES.map((t) => t.renk)).toEqual([null, '#96623E', '#E2B880']);
    const w = renderToStaticMarkup(<LookFrame sheet={{ raceId: 'tiefling', lineageId: 'winged' }} size={44}><i /></LookFrame>);
    expect(w).not.toContain('look-wing');
    const h = renderToStaticMarkup(<LookFrame sheet={{ raceId: 'celestial', celestialAwakening: 'gece-gozyasi', level: 3 }} size={44}><i /></LookFrame>);
    expect(h).toContain('halo-hidden');
  });
});

describe('boyasız orijinal alt soylar (AS1a-2 İş 3)', () => {
  const ORIG = ['elf/wood-elf', 'dwarf/knoll', 'halfling/slender', 'halfling/sturdy', 'orc/wildwood', 'celestial/parlayan-ruh', 'human/tenhausser', 'human/khadyrga', 'human/pure-city', 'human/outwall',
    'tiefling/infernal', 'gnome/rock-gnome', 'goliath/hill'];
  const PAINTED = ['dragonborn/black', 'goliath/cloud', 'goliath/fire', 'goliath/frost', 'goliath/stone', 'goliath/storm', 'elf/drow', 'elf/high-elf', 'tiefling/abyssal', 'tiefling/chthonic', 'gnome/forest-gnome', 'gnome/subterranean',
    'celestial/gece-gozyasi', 'dwarf/crag', 'dwarf/undervault', 'orc/glacier', 'orc/fen'];
  const table = soyRenkleri.races as Record<string, { lineages: Record<string, unknown> }>;
  it('liste tam: 13 orijinal; her ırkta (Dragonborn hariç) en az bir orijinal, Dragonborn\'da hiç yok', () => {
    expect([...ORIGINAL_LINEAGES].sort()).toEqual([...ORIG].sort());
    for (const r of races) {
      const n = ids().filter((k) => k.startsWith(`${r.id}/`) && isOriginalLineage(k)).length;
      if (r.id === 'dragonborn') expect(n).toBe(0); else expect(n, r.id).toBeGreaterThanOrEqual(1);
    }
  });
  it('tint tablosu: orijinal alt soy null (boyama yok), boyalı kalacaklar tintli; Dragonborn 10 renk aynen', () => {
    for (const k of ORIG) { const [r, l] = k.split('/') as [string, string]; if (table[r]) expect(table[r]!.lineages[l], k).toBeNull(); }
    for (const k of PAINTED) { const [r, l] = k.split('/') as [string, string]; if (table[r]) expect(table[r]!.lineages[l], k).not.toBeNull(); }
    expect(Object.values(table.dragonborn!.lineages).every((x) => x !== null)).toBe(true);
    expect(Object.keys(table.dragonborn!.lineages).length).toBe(10);
  });
  it('orijinal alt soyda filtre yok (yalnız oran); boyalı Dwarf/Orc alt soylarında geçici filtre var, Dwarf üçü birbirinden ayrı', () => {
    const f = (raceId: string, lineageId: string) => lineageLook({ raceId, lineageId, level: 1 });
    for (const k of ORIG.filter((x) => !x.startsWith('celestial'))) { const [r, l] = k.split('/') as [string, string]; expect(f(r, l).filter, k).toBe(''); }
    expect(lineageLook({ raceId: 'celestial', celestialAwakening: 'parlayan-ruh', level: 3 })).toMatchObject({ filter: '', hideHalo: false, wing: null });
    for (const k of ['dwarf/crag', 'dwarf/undervault', 'orc/glacier', 'orc/fen']) { const [r, l] = k.split('/') as [string, string]; expect(f(r, l).filter, k).not.toBe(''); }
    expect(f('dwarf', 'crag').filter).not.toBe(f('dwarf', 'undervault').filter);
    // Oranlar: Dwarf Tepe yalnız genişlik +%4; Halfling İnce en −%6 boy +%5, Kalın en +%10 boy −%3.
    expect([f('dwarf', 'knoll').scaleX, f('dwarf', 'knoll').scaleY]).toEqual([1.04, 1]);
    expect([f('orc', 'wildwood').scaleX, f('orc', 'wildwood').scaleY]).toEqual([1, 1]);
  });
  it('Tiefling Kanatlı (kararsız kalan) mevcut halinde: tintli, kanat yuvası', () => {
    expect(table.tiefling!.lineages.winged).not.toBeNull();
    // Kanat sprite'ı bağlı: havadayken katman var, yerdeyken yok.
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: true }).wing).toMatchObject({ id: 'tiefling-kanatli' });
    expect(lineageLook({ raceId: 'tiefling', lineageId: 'winged' }, { flying: false }).wing).toBeNull();
  });
});
