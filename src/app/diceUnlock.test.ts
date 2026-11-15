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
import { alwaysOpen, choiceOf, classOfCombatant, emptyStore, isUnlocked, monsterTheme, normalize, setChoice, themeForRoll, unlock, unlockHint, unlocksFromBattle, unlocksFromSeruven } from './diceUnlock';
import type { BattleState, Combatant } from '../battle/types';

const ids = new Set(gorseller.themes.map((x) => x.id));
const E = esleme as unknown as { siniflar: Record<string, string>; irklar: Record<string, string>; dusmanlar: Array<{ tema: string; id?: string[]; tur?: string[] }>;
  bolgeler: Record<string, string>; seruvenSayfalar: Record<string, string>; yerlesimler: Record<string, string>; oduller: Record<string, string>; hazineSirasi: string[]; esyalar: Record<string, string>; buyuler: Record<string, string> };

describe('SD9: temalar', () => {
  it('63 tema; kimlik küçük harf/tire (dosya adı zar-<kimlik>.jpg); kategori sayıları 12/12/10/15/12/2', () => {
    expect(gorseller.themes.length).toBe(63);
    for (const x of gorseller.themes) expect(x.id, x.id).toMatch(/^[a-z0-9-]+$/);
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
  it('her eşleme geçerli tema kimliğine gider (düşman, bölge, sayfa, yerleşim, ödül, eşya, büyü)', () => {
    const all = [...E.dusmanlar.map((r) => r.tema), ...Object.values(E.bolgeler), ...Object.values(E.seruvenSayfalar), ...Object.values(E.yerlesimler),
      ...Object.values(E.oduller), ...E.hazineSirasi, ...Object.values(E.esyalar), ...Object.values(E.buyuler)];
    for (const id of all) expect(ids.has(id), id).toBe(true);
    // her açılabilir tema bir yoldan açılabilir: 12 düşman, 15 harita, 11 malzeme (Klasik hariç), 2 eşya
    const reach = new Set(all);
    for (const x of gorseller.themes) if (!alwaysOpen(x.id)) expect(reach.has(x.id), x.id).toBe(true);
  });
  it('düşman kuralları gerçek canavarlara denk gelir; bölge/sayfa/yerleşim anahtarları gerçek', () => {
    for (const r of E.dusmanlar) {
      const hits = Object.keys(types.types).filter((m) => r.id?.includes(m) || r.tur?.includes((types.types as Record<string, string>)[m] as string));
      if (r.tema !== 'dusman-beholder' || hits.length) expect(hits.length, r.tema).toBeGreaterThan(0);
    }
    expect(monsterTheme('young-red-dragon')).toBe('dusman-ejderha'); expect(monsterTheme('lich')).toBe('dusman-lich'); expect(monsterTheme('goblin-warrior')).toBeNull();
    const regions = new Set(bolgeler.bolgeler.map((b) => b.id));
    for (const b of Object.keys(E.bolgeler)) expect(regions.has(b), b).toBe(true);
    const pages = new Set(seruven.pages.map((p) => p.id));
    for (const p of Object.keys(E.seruvenSayfalar)) expect(pages.has(p), p).toBe(true);
    const places = new Set((yerlesim as unknown as { yerlesimler: Array<{ id: string }> }).yerlesimler.map((y) => y.id));
    for (const y of Object.keys(E.yerlesimler)) expect(places.has(y), y).toBe(true);
    const keys = new Set(seruven.pages.flatMap((p) => p.nodes.map((n) => `${p.id}/${n.id}`)));
    for (const k of Object.keys(E.oduller)) expect(keys.has(k), k).toBe(true);
  });
  it('kilitli temanın ipucu var (TR/EN); açıklar için boş', () => {
    expect(unlockHint('dusman-ejderha', 'tr')).toContain('Ejderha'); expect(unlockHint('dusman-ejderha', 'en')).toContain('Dragon');
    expect(unlockHint('esya-kumsaati', 'tr')).toContain('Time Stop'); expect(unlockHint('sinif-wizard', 'tr')).toBe(''); expect(unlockHint('klasik', 'en')).toBe('');
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
    expect(unlocksFromBattle(state([w], { status: 'active', winner: undefined }), ev).sort()).toEqual(['esya-iksir', 'esya-kumsaati']);
  });
  it('Serüven: kazanılan düğüm sayfa zarını, ödül ziyareti malzemeyi açar (tablo, sonra sıra)', () => {
    const none = () => false;
    expect(unlocksFromSeruven([{ type: 'seruven_result', key: 'orman/x', outcome: 'won', statuses: {}, xp: 0, gold: 0, potions: 0 }] as never, none)).toEqual(['harita-orman']);
    expect(unlocksFromSeruven([{ type: 'seruven_visited', key: 'derinlikler/hazine', gold: 5, potions: 0, items: [] }] as never, none)).toEqual(['altin']);
    expect(unlocksFromSeruven([{ type: 'seruven_visited', key: 'orman/baska', gold: 5, potions: 0, items: [] }, { type: 'seruven_visited', key: 'orman/baska2', gold: 5, potions: 0, items: [] }] as never, none)).toEqual(['kemik', 'obsidyen']);
    expect(unlocksFromSeruven([{ type: 'seruven_visited', key: 'orman/baska', gold: 5, potions: 0, items: [] }] as never, (id) => id === 'kemik')).toEqual(['obsidyen']);
  });
});
