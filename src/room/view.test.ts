/**
 * Görev ODA-3 (O3) test 9: görünüm süzgeci (ODA-TASARIM.md §4.2). Her gizli bilgi türü için sahne: gizlenen düşman,
 * Spike Growth kamuflajı, Phantasmal Force, gizli nesne, Game Master tuzak katmanı, HP kademesi (izleyiciye bağlı), gizli
 * zar ve GM olayları. Game Master izleyicisi görür, oyuncu izleyicisi görmez, kendi gizlenen savaşçısı "hidden-own".
 */
import { describe, it, expect, afterEach } from 'vitest';
import { startBattle } from '../battle';
import type { BattleEvent, BattleState, Combatant, MapObject, SpellZone } from '../battle/types';
import { getMap } from '../map/maps';
import type { Offset } from '../rules/hex';
import { mk, scripted } from '../battle/fixtures';
import { describeEvents } from '../ui/log';
import { hpModeFor } from '../ui/hpVisibility';
import { enemyHpVis, savedHpVis, setRoomOverlay, setViewerHpVis } from '../oda/active';
import { IZLEYICI_GM, alanGorunur, gmTuzaklari, hpGorunumu, jetonGorunumu, nesneGorunumu, olaylariSuz, type Izleyici } from './view';

const o = (col: number, row: number): Offset => ({ col, row });
const A_IZ: Izleyici = { tur: 'oyuncu', ownerIds: ['p1'] };
const B_IZ: Izleyici = { tur: 'oyuncu', ownerIds: ['p2'] };
const IZ: Izleyici = { tur: 'izleyici' };

/** Hazine odası (bulunmamış tuzaklı Dungeon varyantı): A (p1), C (p2) parti; E düşman. */
function sahne(): BattleState {
  const parts = [mk('A', { ownerId: 'p1' }), mk('C', { ownerId: 'p2' }), mk('E', { side: 'enemies' })];
  const { state } = startBattle('d', 'd-z', parts, scripted([20, 20], [20, 19], [20, 18]), { map: { id: 'dungeon', variantId: 'hazine' } });
  const pos: Record<string, Offset> = { A: o(0, 0), C: o(1, 0), E: o(14, 0) };
  const combatants = Object.fromEntries(Object.entries(state.combatants).map(([id, c]) => [id, { ...c, pos: pos[id] ?? c.pos }]));
  return { ...state, status: 'active', combatants };
}
const gizle = (s: BattleState, id: string): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), hidden: { dc: 16 } } } });
const alan = (p: Partial<SpellZone>): SpellZone => ({ id: 'z1', spellId: 'spike-growth', name: 'Spike Growth', casterId: 'E', side: 'enemies', hexes: [o(5, 3)], dc: 13, ...p } as SpellZone);
const alanli = (s: BattleState, z: SpellZone): BattleState => ({ ...s, map: { ...(s.map as NonNullable<BattleState['map']>), zones: [z] } });

afterEach(() => { setViewerHpVis(null); setRoomOverlay(null); });

describe('görünüm süzgeci: jeton', () => {
  it('gizlenen düşman: Game Master görür (kendi tarafı), oyuncu ve izleyici görmez', () => {
    const s = gizle(sahne(), 'E');
    const e = s.combatants.E as Combatant;
    expect(jetonGorunumu(e, IZLEYICI_GM)).toBe('hidden-own');
    expect(jetonGorunumu(e, A_IZ)).toBe('invisible');
    expect(jetonGorunumu(e, IZ)).toBe('invisible');
  });
  it('gizlenen parti üyesi: oyuncularda örtüyle (aynı taraf), Game Master her zaman görür', () => {
    const s = gizle(sahne(), 'A');
    const a = s.combatants.A as Combatant;
    expect(jetonGorunumu(a, A_IZ)).toBe('hidden-own');
    expect(jetonGorunumu(a, B_IZ)).toBe('hidden-own');
    expect(jetonGorunumu(a, IZLEYICI_GM)).toBe('hidden-shown');
    expect(jetonGorunumu(s.combatants.C as Combatant, A_IZ)).toBe('normal');
  });
});

describe('görünüm süzgeci: alan, nesne, tuzak', () => {
  it('Spike Growth kamuflajı: yalnız fark eden savaşçının oyuncusu görür; Game Master hep görür', () => {
    const s = alanli(sahne(), alan({ hiddenFrom: 'party', seenBy: ['C'] }));
    const z = (s.map?.zones ?? [])[0] as SpellZone;
    expect(alanGorunur(s, z, IZLEYICI_GM)).toBe(true);
    expect(alanGorunur(s, z, A_IZ)).toBe(false);
    expect(alanGorunur(s, z, B_IZ)).toBe(true);
    expect(alanGorunur(s, z, IZ)).toBe(true); // izleyici parti düzeyinde: partiden biri gördü
    const kimse = alanli(sahne(), alan({ hiddenFrom: 'party' }));
    expect(alanGorunur(kimse, (kimse.map?.zones ?? [])[0] as SpellZone, IZ)).toBe(false);
  });
  it('Phantasmal Force: yanılsama yalnız hedefin oyuncusunda', () => {
    const s = alanli(sahne(), alan({ spellId: 'phantasmal-force', visibleTo: ['A'] }));
    const z = (s.map?.zones ?? [])[0] as SpellZone;
    expect(alanGorunur(s, z, A_IZ)).toBe(true);
    expect(alanGorunur(s, z, B_IZ)).toBe(false);
    expect(alanGorunur(s, z, IZLEYICI_GM)).toBe(true);
  });
  it('gizli nesne: Game Master soluk, oyuncu hiç; bulununca herkes', () => {
    const s = sahne();
    const ob = { id: 'sandik', kind: 'chest', at: o(6, 3), hp: 10, gizli: true } as MapObject;
    expect(nesneGorunumu(s, ob, IZLEYICI_GM)).toBe('faded');
    expect(nesneGorunumu(s, ob, A_IZ)).toBe('none');
    expect(nesneGorunumu(s, { ...ob, found: true }, A_IZ)).toBe('shown');
  });
  it('Game Master tuzak katmanı: bulunmamış tuzak yalnız GM\'de; bulununca katmandan çıkar', () => {
    const s = sahne();
    const tiles = getMap('dungeon', { variantId: 'hazine' }).tiles;
    const gm = gmTuzaklari(s, IZLEYICI_GM);
    expect(gm.length).toBeGreaterThan(0);
    for (const h of gm) expect(tiles[h.row]?.[h.col]).toBe('j');
    expect(gmTuzaklari(s, A_IZ)).toEqual([]);
    const k = `${gm[0]!.col},${gm[0]!.row}`;
    const bulundu = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), trapsFound: [k] } };
    expect(gmTuzaklari(bulundu, IZLEYICI_GM).map((h) => `${h.col},${h.row}`)).not.toContain(k);
  });
});

describe('görünüm süzgeci: HP kademesi izleyiciye bağlı', () => {
  it('Game Master tam görür, oyuncu odanın kademesini; kayda giden değer izleyiciden bağımsız', () => {
    expect(hpGorunumu(IZLEYICI_GM, 'gizli')).toBe('tam');
    expect(hpGorunumu(A_IZ, 'etiket')).toBe('etiket');
    setRoomOverlay({ deneysel: {}, hp: 'gizli' });
    const s = sahne();
    const e = s.combatants.E as Combatant;
    expect(hpModeFor(e)).toBe('gizli');
    setViewerHpVis('tam'); // GM cihazı (çevrimiçi host)
    expect(hpModeFor(e)).toBe(null);
    expect(enemyHpVis()).toBe('tam');
    expect(savedHpVis()).toBe('gizli');
    const ev: BattleEvent = { type: 'hp_adjusted', targetId: 'E', hpAfter: 7 } as BattleEvent;
    expect(describeEvents([ev], s).join(' ')).toContain('7');
    setViewerHpVis('gizli'); // oyuncu cihazı
    expect(describeEvents([ev], s).join(' ')).not.toContain('7');
  });
});

describe('görünüm süzgeci: olaylar (günlük, animasyon, zar)', () => {
  const s = gizle(sahne(), 'E');
  const olaylar: BattleEvent[] = [
    { type: 'dice_rolled', rolls: [{ sides: 20, values: [14], kind: 'check', by: 'E' }, { sides: 20, values: [9], kind: 'attack', by: 'A' }] },
    { type: 'moved', actorId: 'E', path: [o(14, 0), o(13, 0)], cost: 1 } as BattleEvent,
    { type: 'moved', actorId: 'A', path: [o(0, 0), o(0, 1)], cost: 1 } as BattleEvent,
    { type: 'hide_attempted', actorId: 'E', mode: 'normal', d20: [14], natural: 14, total: 18, dc: 15, success: true } as unknown as BattleEvent,
    { type: 'dragon_perception', actorId: 'E', watcherId: 'A', d20: [3], total: 8, dc: 15, success: false },
    { type: 'rouse_roll', actorId: 'E', roll: 40, pct: 25, success: false, turn: 'A' },
    { type: 'zone_created', zone: alan({ hiddenFrom: 'party' }) },
    { type: 'hp_pool_created', poolId: 'h', memberIds: ['E'], hp: 30, max: 30 },
  ];
  it('Game Master hepsini görür', () => {
    expect(olaylariSuz(olaylar, s, s, IZLEYICI_GM)).toEqual(olaylar);
  });
  it('oyuncu: gizlenen düşmanın hareketi, Stealth zarı, GM zarları ve gizli alan çizilmez; kendi hareketi ve zarı kalır', () => {
    const out = olaylariSuz(olaylar, s, s, A_IZ, { hp: 'gizli' });
    expect(out.map((e) => e.type)).toEqual(['dice_rolled', 'moved']);
    expect(out[0]).toMatchObject({ rolls: [{ by: 'A', kind: 'attack' }] });
    expect(out[1]).toMatchObject({ actorId: 'A' });
    // HP tam iken düşman can havuzu görünür.
    expect(olaylariSuz(olaylar, s, s, A_IZ, { hp: 'tam' }).map((e) => e.type)).toContain('hp_pool_created');
  });
  it('grupta açığa çıkan düşmanın hareketi görünür (önce gizli, sonra değil)', () => {
    const acik = sahne();
    const out = olaylariSuz([olaylar[1] as BattleEvent], s, acik, A_IZ);
    expect(out).toHaveLength(1);
  });
});
