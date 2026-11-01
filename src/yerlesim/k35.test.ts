/**
 * Kuyruk 35: kasaba zinciri ileri-geri, lağım (derin su kanal, köprüler), kale zindan dalı, ırk görünümleri ve savaş
 * haritası filtresi anahtarı, "Savaşları atla (önizleme)" test anahtarı, Celestial başlangıcı.
 */
import { describe, expect, it } from 'vitest';
import { executeSeruven, nodeKey, nodeStop, pageById, type SeruvenCommand, type SeruvenState } from '../journey/seruven';
import { seruvenSkipCommand, yerlesimCrossCommand, yerlesimSession } from '../app/seruvenBattle';
import { dispatch } from '../ui/session';
import { partyAt } from '../sim/balance';
import { getMap } from '../map/maps';
import { terrainOf } from '../map/terrain';
import { YERLESIM, gorunumFiltre, haritaFiltre, yerlesimById } from './yerlesim';
import { saveMapTint, storedMapTint } from '../ui/mapTintSetting';

function begin(opts: { race?: string; toggles?: Record<string, boolean> } = {}): SeruvenState {
  const party = partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: i === 0 && opts.race ? { ...sh, raceId: opts.race } : sh }));
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party, ...(opts.toggles ? { toggles: opts.toggles } : {}) });
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
const step = (s: SeruvenState, cmd: SeruvenCommand): SeruvenState => {
  const r = executeSeruven(s, cmd);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
function walkTo(s: SeruvenState, hex: [number, number]) {
  let ss = yerlesimSession(s, () => 0.5)!;
  ss = dispatch(ss, { type: 'start_battle' }, () => 0.5);
  const pc = Object.values(ss.state.combatants).find((c) => c.side === 'party' && c.ownerId === 'p1')!;
  const there = { ...ss.state, combatants: { ...ss.state.combatants, [pc.id]: { ...pc, pos: { col: hex[0] - 1, row: hex[1] - 1 } } } };
  return yerlesimCrossCommand(s, there)!;
}
const inTown = (id = 'kasaba-ornek'): SeruvenState => ({ ...begin({ race: 'human' }), yerlesim: { id, map: null, from: null, seen: [] } });

describe('kasaba seti', () => {
  it('lağım: kanal ve havuz derin su (zorlu), köprüler geçit; tek karanlık sürüm', () => {
    const m = getMap('kasaba-lagim');
    expect(m.variants.map((v) => v.id)).toEqual(['karanlik']);
    expect(m.variants[0]!.rules.some((r) => r.id === 'darkness')).toBe(true);
    expect(terrainOf('w').movement).toBe('difficult');
    expect([m.tiles[2]!.slice(9, 12), m.tiles[7]!.slice(9, 12)]).toEqual(['ppp', 'ppp']);
    expect(m.tiles[5]!.slice(6, 16)).toBe('w'.repeat(10));
    const d = getMap('kasaba-demirci-tapinak', { variantId: 'gece' });
    expect(d.variants.map((v) => v.id)).toEqual(['gunduz', 'gece']);
    expect([d.size.cols, d.size.rows, m.size.cols, m.size.rows]).toEqual([21, 11, 21, 11]);
  });
  it('meydan → taverna, han, demirci-tapınak, lağım ve geri; demircinin kuzey yolu hub', () => {
    let s = step(inTown(), { type: 'yerlesim_map', map: 'meydan', via: 'hub' });
    const back: Record<string, [number, number]> = { taverna: [1, 5], 'kasaba-han': [10, 10], 'kasaba-demirci-tapinak': [10, 11], 'kasaba-lagim': [3, 3] };
    const go: Record<string, [number, number]> = { taverna: [1, 4], 'kasaba-han': [15, 4], 'kasaba-demirci-tapinak': [8, 1], 'kasaba-lagim': [8, 7] };
    for (const [to, hex] of Object.entries(go)) {
      s = step(s, walkTo(s, hex));
      expect(s.yerlesim, to).toMatchObject({ map: to, from: 'meydan' });
      s = step(s, walkTo(s, back[to]!));
      expect(s.yerlesim, to).toMatchObject({ map: 'meydan', from: to });
    }
    s = step(s, walkTo(s, [8, 1]));
    s = step(s, walkTo(s, [11, 1]));
    expect(s.yerlesim?.map).toBeNull();
    expect(s.yerlesim?.seen).toEqual(expect.arrayContaining(['meydan', 'taverna', 'kasaba-han', 'kasaba-demirci-tapinak', 'kasaba-lagim']));
  });
  it('kale zindan dalı: avludan Dungeon meşaleli varyanta, geri dönüş avluya', () => {
    let s = step(inTown('kral-kalesi'), { type: 'yerlesim_map', map: 'kale-onu', via: 'hub' });
    s = step(s, walkTo(s, [11, 1]));
    s = step(s, walkTo(s, [7, 3]));
    expect(s.yerlesim).toMatchObject({ map: 'zindan', from: 'kale-ic-avlu' });
    const z = yerlesimById('kral-kalesi')!.haritalar.find((h) => h.id === 'zindan')!;
    expect([z.mapId, z.variantId]).toEqual(['dungeon', 'mesale']);
    s = step(s, walkTo(s, [8, 6]));
    expect(s.yerlesim).toMatchObject({ map: 'kale-ic-avlu', from: 'zindan' });
  });
});

describe('ırk görünümleri', () => {
  const table: Record<string, string> = {
    human: 'sehir', dwarf: 'kale', goliath: 'kale', dragonborn: 'kale', elf: 'kasaba', gnome: 'kasaba', halfling: 'kasaba', orc: 'kasaba', tiefling: 'kasaba',
  };
  it('dokuz ırk görünümü ve şablonu; İnsan filtresiz (varsayılan); her yerleşimin sahibi ırkı veride', () => {
    expect(Object.fromEntries(Object.entries(YERLESIM.gorunumler).map(([k, v]) => [k, v.sablon]))).toEqual(table);
    expect(YERLESIM.gorunumler.human!.filtre).toBe('');
    for (const [k, v] of Object.entries(YERLESIM.gorunumler)) if (k !== 'human') expect(v.filtre, k).toMatch(/^[a-z-]+\([^)]+\)( [a-z-]+\([^)]+\))*$/);
    for (const y of YERLESIM.yerlesimler) {
      expect(YERLESIM.gorunumler[y.irk ?? ''], y.id).toBeDefined();
      expect(YERLESIM.gorunumler[y.gorunum], y.id).toBeDefined();
    }
  });
  it('yeni yerleşim yalnızca JSON: kopya kaynağın haritalarını ve hub\'ını alır, şablon ırk tablosuyla uyumlu', () => {
    const copies = YERLESIM.yerlesimler.filter((y) => y.kopya);
    expect(copies.map((y) => y.irk).sort()).toEqual(['dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'orc', 'tiefling']);
    for (const y of copies) {
      const src = yerlesimById(y.kopya!)!;
      expect(y.haritalar).toBe(src.haritalar);
      expect([y.baslangic, y.sablon]).toEqual([src.baslangic, table[y.irk!]]);
    }
    // Kopya yerleşimde de kapı zinciri çalışır.
    let s = step(inTown('cuce-kalesi'), { type: 'yerlesim_map', map: 'kale-onu', via: 'hub' });
    s = step(s, walkTo(s, [11, 1]));
    expect(s.yerlesim).toMatchObject({ id: 'cuce-kalesi', map: 'kale-ic-avlu' });
  });
  it('savaş haritası filtresi: yerleşimin görünümü; ayar kapalıyken boş (varsayılan açık)', () => {
    const dwarf = yerlesimById('cuce-kalesi')!;
    expect(haritaFiltre(dwarf, true)).toBe(gorunumFiltre(dwarf));
    expect(haritaFiltre(dwarf, true)).not.toBe('');
    expect(haritaFiltre(dwarf, false)).toBe('');
    expect(haritaFiltre(yerlesimById('beyaz-sehir'), true)).toBe('');
    // Ayar varsayılan açık (test ortamında localStorage yok: okuma yedeği).
    expect(storedMapTint()).toBe(true);
    expect(() => saveMapTint(false)).not.toThrow();
  });
});

describe('Savaşları atla (önizleme)', () => {
  const atBoss = (on: boolean): SeruvenState => {
    const s = begin({ race: 'human', toggles: { savaslariAtla: on } });
    return { ...s, page: 'bataklik', at: 'cadinin-kampi', done: [...s.done, nodeKey('bataklik', 'kutuk-adalari')] };
  };
  it('varsayılan kapalı: atlama reddedilir', () => {
    expect(begin().toggles.savaslariAtla ?? false).toBe(false);
    const c = seruvenSkipCommand(atBoss(false), 'cadinin-kampi')!;
    expect(executeSeruven(atBoss(false), c).ok).toBe(false);
  });
  it('açıkken boss düğümü kazanılmış sayılır: XP ve ödül normal yoldan, parti değişmez, kayıtta "atlandı"', () => {
    const s0 = atBoss(true);
    const node = pageById('bataklik')!.nodes.find((n) => n.id === 'cadinin-kampi')!;
    const stop = nodeStop(node, s0.level)!;
    const c = seruvenSkipCommand(s0, 'cadinin-kampi')!;
    expect(c.xp).toBeGreaterThan(0);
    const r = executeSeruven(s0, c);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const key = nodeKey('bataklik', 'cadinin-kampi');
    expect(r.state.done).toContain(key);
    expect(r.state.skipped).toEqual([key]);
    expect(r.state.xp).toBe(s0.xp + c.xp);
    expect(r.state.gold).toBe(s0.gold + (stop.reward?.gold ?? 0));
    expect(r.state.party.map((m) => m.status)).toEqual(s0.party.map((m) => m.status));
    expect(r.events.some((e) => e.type === 'seruven_result' && e.skipped)).toBe(true);
    // Yenilgi atlanamaz.
    expect(executeSeruven(s0, { ...c, outcome: 'lost' }).ok).toBe(false);
  });
});

describe('Celestial başlangıcı', () => {
  it('Celestial → Batı Kıyısı Beyaz Şehir düğümü', () => {
    const s = begin({ race: 'celestial' });
    expect([s.page, s.at, s.startPage]).toEqual(['bati-kiyisi', 'beyaz-sehir', 'bati-kiyisi']);
  });
});
