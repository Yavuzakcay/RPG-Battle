/**
 * Kuyruk K69 (kural sürümü 53): çok altıgenli yaratıkların kalanları. Yalnız `multiHex` açıkken ve sürüm 53'te değişir;
 * kapalıyken ya da sürüm 52'de eski davranış (sayaç `bodyStats` ile hızlı yol). `run` replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { footprint, hexCount } from '../rules/footprint';
import { gargantuanTooBig } from '../app/setup';
import { t } from '../i18n';

describe('K69 sınırlar', () => {
  it('ayak izi şekilleri A6 ile aynı: Large 3, Huge 7, Gargantuan 19 (K69 isteği Large 4; A6 esas alındı)', () => {
    expect([hexCount('M'), hexCount('L'), hexCount('H'), hexCount('G')]).toEqual([1, 3, 7, 19]);
    expect(footprint({ col: 5, row: 5 }, 'G')).toHaveLength(19);
  });
  it('Gargantuan çok altıgen açıkken 15×7 haritada seçilemez (neden satırı TR/EN); 21×11 ve bayrak kapalı serbest', () => {
    const garg = [{ monster: { size: 'G' as const } }];
    expect(gargantuanTooBig({ cols: 15, rows: 7 }, garg, true)).toBe(true);
    expect(gargantuanTooBig({ cols: 21, rows: 11 }, garg, true)).toBe(false);
    expect(gargantuanTooBig({ cols: 31, rows: 17 }, garg, true)).toBe(false);
    expect(gargantuanTooBig({ cols: 15, rows: 7 }, garg, false)).toBe(false);
    expect(gargantuanTooBig({ cols: 15, rows: 7 }, [{ monster: { size: 'H' as const } }], true)).toBe(false);
    expect(t().gm.multiHex.gargantuanSmall).toMatch(/21×11/);
  });
});

import { startBattle } from './create';
import { execute } from './index';
import { auraGap, bodyAt, bodyOf, bodyStats, footprintOf, touchesHexes } from './body';
import { bodyFitProblem, moveCostFn } from './movement';
import { teleportProblem } from './teleport';
import { summonDef, summonHexNear, summonHexProblem } from './summons';
import { pushOutcome } from './forced';
import { forcedMove } from './motion';
import { coverFrom } from './cover';
import { pickArea } from './areaAttack';
import { burstEvents } from './surfaces';
import { grappleCleanup } from './grapple';
import { nearWall } from './altitude';
import { turnEndMapEvents } from './maprules';
import { mk, P1 } from './fixtures';
import { seededRng } from '../rules/dice';
import { serializeSession, restoreSession } from '../app/battleSave';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const club = { name: 'Greatclub', bonus: 6, damageDice: '2d8+4', damageType: 'bludgeoning', repeat: 1, ranged: false, reachFt: 5, text: '' };
/** 15×7 (ya da verilen) düz alan; O büyük yaratık. `ver` kural sürümü, `mh` çok altıgen bayrağı. */
function arena(size: Combatant['size'], at: Offset, hero: Offset, opts: { ver?: number; mh?: boolean; tiles?: string[]; extra?: Combatant[]; pos?: Record<string, Offset>; house?: Record<string, boolean> } = {}): BattleState {
  const parts = [mk('A', { ownerId: 'p1', hp: 60, maxHp: 60 }), mk('O', { side: 'enemies', size, hp: 200, maxHp: 200, attacks: [club], speed: 40, strScore: 20 }), ...(opts.extra ?? [])];
  const started = startBattle('k69', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' }, multiHex: opts.mh ?? true, kuralSurumu: opts.ver ?? 53, ...(opts.house ? { houseRules: opts.house } : {}) });
  const combatants = { ...started.state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: hero };
  combatants.O = { ...(combatants.O as Combatant), pos: at };
  for (const [id, p] of Object.entries(opts.pos ?? {})) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...started.state, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles: opts.tiles ?? Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const withTile = (tiles: string[], at: Offset, ch: string) => tiles.map((r, i) => (i === at.row ? r.slice(0, at.col) + ch + r.slice(at.col + 1) : r));
const flat = () => Array.from({ length: 7 }, () => '.'.repeat(15));
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;

describe('K69 varışta gövde sığması (çağırma, ışınlanma, atlama)', () => {
  it('ışınlanma: varışta gövde duvara değerse red; menzil gövdenin en yakın altıgeninden; sürüm 52 eski (yalnız çapa)', () => {
    const spec = { rangeFt: 30, sight: false };
    const tiles = withTile(flat(), o(10, 3), 's');
    const at = (ver: number) => arena('H', o(3, 3), o(13, 6), { ver, tiles });
    // (9,3) çapasında (çapadan 6 altıgen) Huge gövdesi (10,3) duvarına değer.
    expect(teleportProblem(at(53), C(at(53), 'O'), o(9, 3), spec)).toMatch(/gövde .*sığmıyor/);
    expect(teleportProblem(at(52), C(at(52), 'O'), o(9, 3), spec)).toBeNull();
    // Çapadan 7 altıgen (35 ft) ama gövde kenarından 6 (30 ft): 53'te menzilde, 52'de değil (düz alan).
    const open = (ver: number) => arena('H', o(3, 3), o(13, 6), { ver });
    expect(teleportProblem(open(53), C(open(53), 'O'), o(10, 4), spec)).toBeNull();
    expect(teleportProblem(open(52), C(open(52), 'O'), o(10, 4), spec)).toMatch(/menzil dışında/);
  });
  it('çağırma: Large atın gövdesi doluya değerse red; en yakın sığan yer bulunur; sürüm 52 yalnız çapa', () => {
    const def = summonDef('find-steed');
    if (!def) throw new Error('find-steed yok');
    const s = arena('M', o(12, 1), o(5, 3), { extra: [mk('X', { side: 'enemies' })], pos: { X: o(7, 3) } });
    // (6,3) çapasında Large gövdesi (7,3)'teki X'e değer.
    expect(bodyAt(s, { size: 'L' }, o(6, 3)).some((h) => h.col === 7 && h.row === 3)).toBe(true);
    expect(summonHexProblem(s, C(s, 'A'), def, o(6, 3), 'L')).toMatch(/gövde .*sığmıyor/);
    expect(summonHexProblem(s, C(s, 'A'), def, o(6, 3))).toBeNull();
    const near = summonHexNear(s, C(s, 'A'), def, 'L');
    expect(near).not.toBeNull();
    expect(bodyFitProblem(s, { id: 'q', name: 'q', size: 'L' }, near as Offset)).toBeNull();
  });
  it('atlama: inişte gövde duvara değerse red (sürüm 52: çapa boşsa iner)', () => {
    // Large (3,3) → (5,4) düz doğrultuda bir altıgen atlar; inişte gövde (6,5) duvarına değer.
    const tiles = withTile(flat(), o(6, 5), 's');
    const at = (ver: number) => ({ ...arena('L', o(3, 3), o(13, 1), { ver, tiles }), turnIndex: 1 });
    const jump: Command = { type: 'jump', actorId: 'O', to: o(5, 4) };
    const r53 = execute(at(53), jump, { playerId: 'gm', isGm: true }, seededRng(3));
    expect(r53.ok ? '' : r53.error).toMatch(/gövde .*sığmıyor/);
    expect(execute(at(52), jump, { playerId: 'gm', isGm: true }, seededRng(3)).ok).toBe(true);
  });
});

describe('K69 zemin etkileri', () => {
  it('patlama gövdenin çapa dışındaki altıgenine değerse yaratık bir kez etkilenir; sürüm 52 yalnız çapa', () => {
    const hit = (ver: number) => {
      const s = arena('H', o(7, 3), o(1, 1), { ver });
      const extra = bodyOf(s, C(s, 'O')).slice(1, 4);
      return burstEvents(s, extra, new Set(), 12, 6, '1d6', 'fire', 'A', 'test', seededRng(3)).filter((e) => (e as { targetId?: string }).targetId === 'O').length;
    };
    expect(hit(53)).toBeGreaterThan(0);
    expect(hit(52)).toBe(0);
  });
  it('itmede gövdenin bir altıgeni açık yarığa denk gelirse tek düşme (derinlik kadar); sürüm 52 kenarda durur', () => {
    const push = (ver: number) => {
      const s0 = arena('H', o(5, 3), o(3, 3), { ver });
      const to = o(6, 3);
      const pit = bodyAt(s0, C(s0, 'O'), to).find((h) => h.col === 7) as Offset;
      const zone: SpellZone = { id: 'y', spellId: 'earthquake', name: 'Yarık', casterId: 'A', side: 'party', dc: 15, slotLevel: 8, hexes: [pit], fissure: { depthFt: 20 } };
      const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: withTile(flat(), pit, 'u'), zones: [zone] } };
      return pushOutcome(s, C(s, 'O'), o(5, 3), to);
    };
    expect(push(53)).toMatchObject({ ok: true, kind: 'fall', fallFeet: 20, fissureFt: 20 });
    expect(push(52)).toMatchObject({ ok: false });
  });
  it('itmede gövdenin bir altıgeni lav ise lav (sürüm 52 yalnız çapa)', () => {
    const push = (ver: number) => {
      const s0 = arena('H', o(5, 3), o(3, 3), { ver });
      const to = o(6, 3);
      const lava = bodyAt(s0, C(s0, 'O'), to).find((h) => h.col === 7) as Offset;
      const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: withTile(flat(), lava, '~') } };
      return pushOutcome(s, C(s, 'O'), o(5, 3), to);
    };
    expect(push(53)).toMatchObject({ ok: true, kind: 'lava' });
    expect(push(52)).toMatchObject({ ok: true, kind: 'move' });
  });
});

describe('K69 tur sonu zemin', () => {
  it('gövdenin üç altıgeni alevdeyse tur sonu tek hasar (yaratık başına bir kez); çapa temizken de tetikler, sürüm 52 de A6 gibi bir kez', () => {
    const end = (ver: number) => {
      const s0 = arena('H', o(7, 3), o(1, 1), { ver });
      let tiles = flat();
      for (const h of bodyOf(s0, C(s0, 'O')).slice(1, 4)) tiles = withTile(tiles, h, 'f');
      const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles } };
      return turnEndMapEvents(s, C(s, 'O'), seededRng(5)).filter((e) => e.type === 'map_effect');
    };
    expect(end(53)).toHaveLength(1);
    expect(end(52)).toHaveLength(1);
  });
});

describe('K69 çarpma, görüş, alan, aura, yakalama, tırmanma', () => {
  it('çarpma: itilen Huge gövdesinin ön kenarındaki yaratık da çarpılır (sürüm 52 yalnız çapa)', () => {
    const hurt = (ver: number) => {
      // İtme (5,3) → (6,4); X (7,4) varış gövdesinde ama çapada değil.
      const s = arena('H', o(5, 3), o(3, 3), { ver, house: { carpmaHasari: true }, extra: [mk('X', { side: 'enemies', hp: 50, maxHp: 50 })], pos: { X: o(7, 4) } });
      const evs = forcedMove(s, 'O', 'push', 5, 'A', seededRng(4), { origin: o(3, 3) });
      return evs.filter((e) => e.type === 'map_effect' && (e as { targetId?: string }).targetId === 'X').length;
    };
    expect(hurt(53)).toBe(1);
    expect(hurt(52)).toBe(0);
  });
  it('alan siperi: büyük hedefin çapası duvar arkasında ama bir gövde altıgeni görünüyorsa hedeflenir (sürüm 52 kapalı)', () => {
    const cover = (ver: number) => {
      const tiles = withTile(flat(), o(9, 3), 's');
      const s = arena('H', o(10, 3), o(1, 1), { ver, tiles });
      return coverFrom(s, o(5, 3), C(s, 'O')).blocked;
    };
    expect(cover(53)).toBe(false);
    expect(cover(52)).toBe(true);
  });
  it('alan kapsaması: Huge bir kez sayılır; nokta menzili büyük büyücünün gövdesinden', () => {
    const s = arena('H', o(7, 3), o(1, 1));
    const fireball = { shape: 'sphere' as const, sizeFt: 10, origin: 'point' as const, targets: 'all' as const };
    const pick = pickArea(s, C(s, 'A'), fireball, 150, o(7, 3));
    if ('ok' in pick) throw new Error(pick.error);
    expect(pick.reached.filter((x) => x.c.id === 'O')).toHaveLength(1);
    const caster = arena('H', o(3, 3), o(13, 6));
    // Çapadan 6 altıgen (30 ft) ötedeki nokta gövde kenarından 5: 25 ft menzilde.
    const r = pickArea(caster, C(caster, 'O'), fireball, 25, o(9, 3));
    expect('reached' in r).toBe(true);
    expect('reached' in pickArea({ ...caster, kuralSurumu: 52 }, C(caster, 'O'), fireball, 25, o(9, 3))).toBe(false);
  });
  it('aura: merkez sahibinin çapası, kapsama hedef ayak izi (sürüm 52 gövdeler arası)', () => {
    const s = arena('H', o(7, 3), o(9, 3));
    expect(auraGap(s, C(s, 'O'), C(s, 'A'))).toBe(2);
    expect(auraGap({ ...s, kuralSurumu: 52 }, C(s, 'O'), C(s, 'A'))).toBe(1);
  });
  it('yakalama: Huge yakalayan gövdeyle bitişikken (çapalar 2 uzak) yakalama sürer (sürüm 52 düşer)', () => {
    const held = (ver: number) => {
      const s = arena('H', o(7, 3), o(9, 3), { ver });
      const a = C(s, 'A');
      const g = { ...s, combatants: { ...s.combatants, A: { ...a, grapple: { by: 'O', escapeDc: 15 } as Combatant['grapple'] } } };
      return grappleCleanup(g).length;
    };
    expect(held(53)).toBe(0);
    expect(held(52)).toBe(1);
  });
  it('tırmanma: Large tırmanıcının çapası değil ama bir gövde altıgeni duvar dibindeyse duvarda', () => {
    // Large (7,3) gövdesi 7,3 8,4 7,4; duvar (9,4) yalnız (8,4)'e bitişik.
    const tiles = withTile(flat(), o(9, 4), 's');
    const s = arena('L', o(7, 3), o(1, 1), { tiles });
    const big = C(s, 'O');
    expect(nearWall(s, big)).toBe(true);
    expect(nearWall({ ...s, kuralSurumu: 52 }, big)).toBe(false);
  });
});

describe('K69 hareket, fırsat saldırısı, YZ sayımı, hızlı yol, kayıt', () => {
  it('dar geçit: Large tek altıgenlik aralıktan geçemez, Medium geçer (SRD 5.2.1 Squeezing yok)', () => {
    const tiles = flat().map((r, i) => (i === 3 ? r : r.slice(0, 7) + 's' + r.slice(8)));
    const s = arena('L', o(5, 3), o(1, 1), { tiles });
    expect(moveCostFn(s, C(s, 'O'))(o(7, 3), o(6, 3))).toBeNull();
    expect(moveCostFn(s, C(s, 'A'))(o(7, 3), o(6, 3))).not.toBeNull();
  });
  it('fırsat saldırısı: gövdenin erişiminden çıkan tetikler (içinde kalan tetiklemez)', () => {
    const s = arena('H', o(7, 3), o(9, 3));
    const away = execute(s, { type: 'move', actorId: 'A', to: o(12, 3) } as Command, P1, seededRng(5));
    expect(away.ok && away.events.some((e) => e.type === 'attack_resolved' && (e as { actorId?: string }).actorId === 'O')).toBe(true);
  });
  it('YZ/alan sayımı: büyük yaratık altıgen kopyası olmadan tek sayılır (touchesHexes yaratık başına)', () => {
    const s = arena('G', o(10, 5), o(1, 1), { tiles: Array.from({ length: 11 }, () => '.'.repeat(21)) });
    const big = C(s, 'O');
    const hexes = footprintOf(s, big);
    expect(hexes.length).toBeGreaterThan(1);
    expect(Object.values(s.combatants).filter((c) => touchesHexes(s, c, hexes)).map((c) => c.id)).toEqual(['O']);
  });
  it('bayrak kapalı: çok altıgen yoluna girilmez (sayaç), gövde tek altıgen', () => {
    const before = bodyStats.multi;
    const s = arena('G', o(7, 3), o(1, 1), { mh: false });
    expect(bodyOf(s, C(s, 'O'))).toHaveLength(1);
    pushOutcome(s, C(s, 'O'), o(7, 3), o(8, 3));
    coverFrom(s, o(2, 3), C(s, 'O'));
    expect(bodyStats.multi).toBe(before);
  });
  it('kayıt: bayrağı olmayan eski kayıt kapalı açılır; bayraklı kayıt bayrağı korur (SAVE_VERSION aynı)', () => {
    const on = arena('H', o(7, 3), o(1, 1));
    const { multiHex: _m, ...off0 } = on;
    for (const [st, want] of [[on, true], [off0 as BattleState, false]] as const) {
      const r = restoreSession(serializeSession({ state: st, events: [{ type: 'battle_started', state: st } as BattleEvent] } as never));
      if (!r.ok) throw new Error('yüklenmedi');
      expect(!!r.session.state.multiHex).toBe(want);
    }
  });
});
