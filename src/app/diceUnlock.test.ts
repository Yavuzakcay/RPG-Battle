/**
 * Görev SD9: zar sahipliği ve eşleme. 63 tema kimliği (dosya adı zar-<kimlik>.jpg), her sınıf/ırk için zar, her canavar/bölge/ödül
 * eşlemesi geçerli tema kimliğine, açılma kaydı idempotent, kilitli tema seçilemez, olay dinleyicileri.
 */
import { describe, expect, it } from 'vitest';
import esleme from '../../data/zar-esleme.json';
import gorseller from '../../data/zar-gorselleri.json';
import types from '../../data/canavar-turleri.json';
import bolgeler from '../../harita/_ortak/harita-bolgeleri.json';
import seruven from '../../data/seruven.json';
import yerlesim from '../../data/yerlesim.json';
import { classes, races } from '../data';
import { DICE_THEMES, diceCategoryOf, diceThemeOf } from '../ui/diceTheme';
import { LEGACY_IDS, alwaysOpen, choiceOf, classOfCombatant, emptyStore, isUnlocked, mapTheme, monsterTheme, normalize, setChoice, themeForRoll, unlock, unlockHint, unlocksFromBattle, unlocksFromSeruven } from './diceUnlock';
import type { BattleState, Combatant } from '../battle/types';

const ids = new Set(gorseller.themes.map((x) => x.id));
const E = esleme as unknown as { siniflar: Record<string, string>; irklar: Record<string, string>; dusmanlar: Array<{ tema: string; id?: string[]; tur?: string[] }>;
  haritalar: Record<string, string>; bolgeler: Record<string, string>; seruvenSayfalar: Record<string, string>; yerlesimler: Record<string, string>; oduller: Record<string, string>; hazineSirasi: string[]; esyalar: Record<string, string>; buyuler: Record<string, string> };

/** Kullanıcının ham dosya listesi (assets-ham/zarlar/zar-<kimlik>.jpg): tek gerçek kaynak. */
const RAW63 = [
  'altin', 'bronz', 'elmas', 'epoksi', 'gokkusagi', 'gumus', 'inci', 'oltu-tasi', 'safir', 'yakut', 'zumrut', 'klasik',
  ...['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'].map((x) => `sinif-${x}`),
  ...['celestial', 'dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling'].map((x) => `irk-${x}`),
  ...['ada', 'bataklik', 'col', 'coral', 'cyberpunk', 'dag', 'dungeon', 'gemi', 'kale', 'magara', 'orman', 'sehir', 'space', 'taverna', 'volkan'].map((x) => `harita-${x}`),
  ...['beholder', 'bosluk', 'couatl', 'dev', 'devoruer', 'ejderha', 'flumph', 'gibbering', 'iblis', 'illithid', 'lich', 'tarrasque'].map((x) => `dusman-${x}`),
  'item-kum-saati', 'item-potion',
];
const mapIds = new Set(Object.values(import.meta.glob('../../harita/*/*.json', { eager: true }) as Record<string, { default?: { id?: string }; id?: string }>).map((m) => (m.default ?? m).id));
/** Kaynağı SRD'de olmayan düşman temaları: kural boş, yalnız Game Master/test anahtarıyla açılır. */
const NO_SRD = ['dusman-devoruer', 'dusman-flumph'];

describe('SD9: temalar', () => {
  it('tam 63 ham kimlik; Kemik/Obsidyen ve uydurma kimlik yok; kimlik küçük harf/tire (dosya adı zar-<kimlik>.jpg)', () => {
    expect(new Set(RAW63).size).toBe(63);
    const have = gorseller.themes.map((x) => x.id);
    expect([...have].sort()).toEqual([...RAW63].sort());
    for (const id of have) expect(id, id).toMatch(/^[a-z0-9-]+$/);
    for (const gone of ['kemik', 'obsidyen', 'bakir', 'demir', 'kristal', 'mermer', 'ahsap', 'harita-buzul', 'harita-liman', 'dusman-vampir', 'esya-iksir', 'esya-kumsaati']) expect(have).not.toContain(gone);
  });
  it('kategori sayıları: malzeme 12 / sınıf 12 / ırk 10 / harita 15 / düşman 12 / eşya 2', () => {
    const count: Record<string, number> = {};
    for (const x of DICE_THEMES) count[diceCategoryOf(x.id)] = (count[diceCategoryOf(x.id)] ?? 0) + 1;
    expect(count).toEqual({ malzeme: 12, sinif: 12, irk: 10, harita: 15, dusman: 12, esya: 2 });
  });
  it('görseli olmayan tema Klasik görselle çizilir, kendi 3D renkleri var', () => {
    const t = diceThemeOf('dusman-ejderha');
    expect(t.dice['20']?.image).toBe(diceThemeOf('klasik').dice['20']?.image);
    expect(t.three?.body).toMatch(/^#/);
  });
  it('her sınıf ve her ırk için zar var (her zaman açık)', () => {
    for (const c of classes) { const id = E.siniflar[c.id]; expect(ids.has(id as string), c.id).toBe(true); expect(alwaysOpen(id as string)).toBe(true); }
    for (const r of races) { const id = E.irklar[r.id]; expect(ids.has(id as string), r.id).toBe(true); expect(alwaysOpen(id as string)).toBe(true); }
  });
  it('her eşleme geçerli tema kimliğine gider; her açılabilir tema bir yoldan açılır (SRD karşılığı olmayan iki düşman zarı hariç)', () => {
    const all = [...E.dusmanlar.map((r) => r.tema), ...Object.values(E.haritalar), ...Object.values(E.bolgeler), ...Object.values(E.seruvenSayfalar), ...Object.values(E.yerlesimler),
      ...Object.values(E.oduller), ...E.hazineSirasi, ...Object.values(E.esyalar), ...Object.values(E.buyuler)];
    for (const id of all) expect(ids.has(id), id).toBe(true);
    const reach = new Set(all.filter((id) => !NO_SRD.includes(id) || false));
    for (const x of gorseller.themes) if (!alwaysOpen(x.id) && !NO_SRD.includes(x.id)) expect(reach.has(x.id), x.id).toBe(true);
    for (const id of NO_SRD) expect(E.dusmanlar.find((r) => r.tema === id)?.id ?? []).toEqual([]);
  });
  it('düşman kuralları gerçek canavarlara denk gelir; harita/bölge/sayfa/yerleşim/ödül anahtarları gerçek', () => {
    for (const r of E.dusmanlar) {
      if (NO_SRD.includes(r.tema)) continue;
      const hits = Object.keys(types.types).filter((m) => r.id?.includes(m) || r.tur?.includes((types.types as Record<string, string>)[m] as string));
      expect(hits.length, r.tema).toBeGreaterThan(0);
    }
    expect(monsterTheme('young-red-dragon')).toBe('dusman-ejderha'); expect(monsterTheme('lich')).toBe('dusman-lich');
    expect(monsterTheme('shadow')).toBe('dusman-bosluk'); expect(monsterTheme('couatl')).toBe('dusman-couatl'); expect(monsterTheme('gibbering-mouther')).toBe('dusman-gibbering');
    expect(monsterTheme('goblin-warrior')).toBeNull(); expect(monsterTheme('vampire')).toBeNull();
    const regions = new Set(bolgeler.bolgeler.map((b) => b.id));
    for (const b of Object.keys(E.bolgeler)) expect(regions.has(b), b).toBe(true);
    for (const m of Object.keys(E.haritalar)) expect(mapIds.has(m), m).toBe(true);
    expect(mapTheme('kasaba-han')).toBe('harita-taverna'); expect(mapTheme('ortamlar-diyari')).toBe('harita-space');
    expect(mapTheme('orman', () => 'orman')).toBe('harita-orman'); expect(mapTheme('buzul-acik', () => 'buzul')).toBeNull();
    const pages = new Set(seruven.pages.map((p) => p.id));
    for (const p of Object.keys(E.seruvenSayfalar)) expect(pages.has(p), p).toBe(true);
    expect(E.seruvenSayfalar.buzul).toBeUndefined(); expect(E.seruvenSayfalar['bati-kiyisi']).toBeUndefined();
    const places = new Set((yerlesim as unknown as { yerlesimler: Array<{ id: string }> }).yerlesimler.map((y) => y.id));
    for (const y of Object.keys(E.yerlesimler)) expect(places.has(y), y).toBe(true);
    const keys = new Set(seruven.pages.flatMap((p) => p.nodes.map((n) => `${p.id}/${n.id}`)));
    for (const k of Object.keys(E.oduller)) expect(keys.has(k), k).toBe(true);
  });
  it('kilitli temanın ipucu var (TR/EN); açıklar için boş', () => {
    expect(unlockHint('dusman-ejderha', 'tr')).toContain('Ejderha'); expect(unlockHint('dusman-ejderha', 'en')).toContain('Dragon');
    expect(unlockHint('item-kum-saati', 'tr')).toContain('Time Stop'); expect(unlockHint('sinif-wizard', 'tr')).toBe(''); expect(unlockHint('klasik', 'en')).toBe('');
    for (const id of ['harita-space', 'harita-coral', 'harita-cyberpunk', 'dusman-devoruer']) { expect(unlockHint(id, 'tr'), id).not.toBe(''); expect(unlockHint(id, 'en'), id).not.toBe(''); }
  });
});

describe('SD9c: Oltu Taşı ve eski kayıt göçü', () => {
  it('kaldırılmış kimlikler eşleme/ipucu/ödül dosyalarında kalmadı; Oltu Taşı malzeme grubunda, ödülde ve açılır', () => {
    const text = JSON.stringify(gorseller) + JSON.stringify(esleme);
    expect(text).not.toMatch(/"kemik"|"obsidyen"/); expect(text).not.toMatch(/Obsidian|Obsidyen/);
    expect(diceCategoryOf('oltu-tasi')).toBe('malzeme'); expect(DICE_THEMES.some((x) => x.id === 'oltu-tasi')).toBe(true);
    expect(Object.values(E.oduller)).toContain('oltu-tasi');
    expect(unlockHint('oltu-tasi', 'tr')).not.toBe(''); expect(unlockHint('oltu-tasi', 'en')).not.toBe('');
    expect(unlocksFromSeruven([{ type: 'seruven_visited', key: 'derinlikler/sandik', gold: 1, potions: 0, items: [] }] as never, () => false)).toEqual(['oltu-tasi']);
    const s0 = emptyStore(); expect(setChoice(s0, 'c1', 'oltu-tasi', 'p')).toBe(s0);
    const s1 = unlock(s0, ['oltu-tasi'], 'p').store; expect(choiceOf(setChoice(s1, 'c1', 'oltu-tasi', 'p'), 'c1', 'p')).toBe('oltu-tasi');
  });
  it('eski kayıt: kemik → Klasik; obsidyen → Oltu Taşı (açılmışsa), açılmamışsa Klasik; açılan/bildirim göçü', () => {
    expect(LEGACY_IDS).toEqual({ kemik: 'klasik', obsidyen: 'oltu-tasi' });
    const opened = normalize({ profiller: { p: { acilan: { obsidyen: 2, kemik: 1, 'dusman-lich': 1 }, secim: { a: 'kemik', b: 'obsidyen', c: 'altin' }, yeni: ['obsidyen', 'kemik'] } } }).profiller.p!;
    expect(opened.acilan).toEqual({ 'oltu-tasi': 2, 'dusman-lich': 1 });
    expect(opened.secim).toEqual({ a: 'klasik', b: 'oltu-tasi', c: 'altin' }); expect(opened.yeni).toEqual(['oltu-tasi']);
    const closed = normalize({ profiller: { p: { acilan: {}, secim: { b: 'obsidyen', a: 'kemik' } } } }).profiller.p!;
    expect(closed.secim).toEqual({ b: 'klasik', a: 'klasik' });
    const all = normalize({ hepsiAcik: true, profiller: { p: { acilan: {}, secim: { b: 'obsidyen' } } } }).profiller.p!;
    expect(all.secim.b).toBe('oltu-tasi');
    // göç sonrası seçim geçerli kimlik: choiceOf eski kimliği hiç görmez (açılmamış obsidyen → Klasik)
    expect(choiceOf(normalize({ profiller: { p: { secim: { b: 'obsidyen' } } } }), 'b', 'p')).toBe('klasik');
  });
});

describe('SD9: sahiplik', () => {
  it('açılma kaydı idempotent; yeni bildirim bir kez; her zaman açık temalar kayda girmez', () => {
    const a = unlock(emptyStore(), ['dusman-lich', 'harita-orman'], 'p');
    expect(a.fresh).toEqual(['dusman-lich', 'harita-orman']);
    const b = unlock(a.store, ['dusman-lich', 'harita-orman', 'sinif-wizard', 'klasik'], 'p');
    expect(b.fresh).toEqual([]); expect(b.store).toBe(a.store);
    expect(isUnlocked(a.store, 'dusman-lich', 'p')).toBe(true); expect(isUnlocked(a.store, 'dusman-lich', 'q')).toBe(false);
  });
  it('kilitli tema seçilemez; açık tema seçilir; kilitli seçim Sınıfa düşer; hepsiAcik hepsini açar', () => {
    const s0 = emptyStore();
    expect(setChoice(s0, 'c1', 'dusman-lich', 'p')).toBe(s0);
    expect(choiceOf(s0, 'c1', 'p')).toBe('sinif');
    const s1 = unlock(s0, ['dusman-lich'], 'p').store;
    const s2 = setChoice(s1, 'c1', 'dusman-lich', 'p');
    expect(choiceOf(s2, 'c1', 'p')).toBe('dusman-lich');
    expect(choiceOf(s2, 'c2', 'p')).toBe('sinif');
    const s3 = setChoice(s2, '*', 'irk', 'p'); expect(choiceOf(s3, 'c2', 'p')).toBe('irk');
    expect(choiceOf({ ...s3, hepsiAcik: true }, 'c9', 'p')).toBe('irk');
    expect(isUnlocked({ ...s0, hepsiAcik: true }, 'dusman-lich', 'p')).toBe(true);
    expect(normalize({ profiller: { p: { acilan: { 'yok-tema': 1, 'dusman-lich': 1 } } } }).profiller.p?.acilan).toEqual({ 'dusman-lich': 1 });
    // kaldırılmış kimlik (eski kayıt): açılan listede atılır, seçim sessizce Sınıfa düşer (hepsiAcik'te de)
    const old = { ...emptyStore(), hepsiAcik: true, profiller: { p: { acilan: {}, secim: { c1: 'esya-iksir' }, yeni: ['dusman-vampir'] } } };
    expect(choiceOf(old, 'c1', 'p')).toBe('sinif'); expect(normalize(old).profiller.p?.yeni).toEqual([]);
  });
});

const mk = (o: Partial<Combatant>): Combatant => ({ id: 'x', name: 'x', side: 'party', hp: 10, maxHp: 10, civilian: false, ownerId: 'c1', avatar: { src: 'characters/human-male-wizard.webp' }, ...o } as unknown as Combatant);
describe('SD9: atışın teması ve olay kancaları', () => {
  const state = (cs: Combatant[], extra: Partial<BattleState> = {}): BattleState => ({ combatants: Object.fromEntries(cs.map((c) => [c.id, c])), map: { id: 'orman' }, status: 'finished', winner: 'party', ...extra } as unknown as BattleState);
  it('oyuncu: Sınıf (varsayılan) / Irk / Klasik; düşman: canavar teması herkese görünür; atıcısız: bölge', () => {
    const w = mk({ id: 'pc1', raceId: 'elf' }); const d = mk({ id: 'foe1', side: 'enemies', monsterId: 'lich', ownerId: null });
    const g = mk({ id: 'foe2', side: 'enemies', monsterId: 'goblin-warrior', ownerId: null });
    const st = state([w, d, g]);
    const ctx = { state: st, store: emptyStore(), regionOf: () => 'orman' };
    expect(classOfCombatant(w)).toBe('wizard');
    expect(themeForRoll('pc1', ctx)).toBe('sinif-wizard');
    expect(themeForRoll('foe1', ctx)).toBe('dusman-lich');
    expect(themeForRoll('foe2', ctx)).toBe('harita-orman');
    expect(themeForRoll(undefined, ctx)).toBe('harita-orman');
    expect(themeForRoll('pc1', { ...ctx, store: setChoice(emptyStore(), 'c1', 'irk') })).toBe('irk-elf');
    expect(themeForRoll('pc1', { ...ctx, store: setChoice(emptyStore(), 'c1', 'klasik') })).toBe('klasik');
  });
  it('savaş sonu: yenilen canavar ve bölge açılır; kaybedilen savaşta yalnız eşya/büyü; eşya kullanımı açar', () => {
    const w = mk({ id: 'pc1' }); const d = mk({ id: 'foe1', side: 'enemies', monsterId: 'young-red-dragon', hp: 0, ownerId: null });
    expect(unlocksFromBattle(state([w, d]), [], () => 'orman').sort()).toEqual(['dusman-ejderha', 'harita-orman']);
    expect(unlocksFromBattle(state([w, d], { winner: 'enemies' }), [], () => 'orman')).toEqual([]);
    const ev = [{ type: 'item_used', actorId: 'pc1', itemId: 'potion-of-healing', name: 'x', targetId: 'pc1', left: 0 }, { type: 'spell_cast', actorId: 'pc1', label: 'Time Stop', targetId: null, slotLevel: 9, note: '' }] as never;
    expect(unlocksFromBattle(state([w], { status: 'active', winner: undefined }), ev).sort()).toEqual(['item-kum-saati', 'item-potion']);
  });
  it('Serüven: kazanılan düğüm sayfa zarını, ödül ziyareti malzemeyi açar (tablo, sonra sıra)', () => {
    const none = () => false;
    expect(unlocksFromSeruven([{ type: 'seruven_result', key: 'orman/x', outcome: 'won', statuses: {}, xp: 0, gold: 0, potions: 0 }] as never, none)).toEqual(['harita-orman']);
    expect(unlocksFromSeruven([{ type: 'seruven_visited', key: 'derinlikler/hazine', gold: 5, potions: 0, items: [] }] as never, none)).toEqual(['altin']);
    expect(unlocksFromSeruven([{ type: 'seruven_visited', key: 'orman/baska', gold: 5, potions: 0, items: [] }, { type: 'seruven_visited', key: 'orman/baska2', gold: 5, potions: 0, items: [] }] as never, none)).toEqual(['bronz', 'gumus']);
    expect(unlocksFromSeruven([{ type: 'seruven_visited', key: 'orman/baska', gold: 5, potions: 0, items: [] }] as never, (id) => id === 'bronz')).toEqual(['gumus']);
  });
});
