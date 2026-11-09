/**
 * Kuyruk K73c (kural sürümü 64): kazma (kaz, hedeflenemez, çık + saldır, tremorsense, duvar/kaya engeli, alan), su altı
 * (dalış, silah ve menzilli kuralı, ateş direnci, nefes ve boğulma, süzülen hariç), çok altıgenli gövdenin en yüksek ayak
 * altı ve döşeme, paket/tepki menzilinin 3B olması. 63'te eski davranış; replay aynı.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mk, P1 } from './fixtures';
import { execute, startBattle } from './index';
import { replay } from './reduce';
import { checkReach } from './range';
import { feetBetween } from './reactions';
import { bodyZeminFt } from './vertical';
import { bodyFitProblem } from './movement';
import { pickArea } from './areaAttack';
import { chooseCommand } from './ai';
import { setDefaultRuleVersion } from './create';
import { CURRENT_RULES } from './ruleVersion';
import { KATLI_BINA_DIKEY, KATLI_BINA_TILES } from '../map/fixtures/katliBina';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
const open = (ch = '.') => Array.from({ length: 7 }, () => ch.repeat(15));
interface Opts { ver?: number; tiles?: string[]; env?: string; multiHex?: boolean; dikey?: NonNullable<BattleState['map']>['dikey'] }
function field(parts: Combatant[], pos: Record<string, [Offset, number?]>, o: Opts = {}): BattleState {
  const s = startBattle('k73c', o.env ?? 'l-kavurucu-s-cak', parts, () => 0.5, { kuralSurumu: o.ver ?? 64, ...(o.multiHex ? { multiHex: true } : {}),
    map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, [p, alt]] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}) };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants, ...(o.env ? { environmentId: o.env } : {}),
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: o.tiles ?? open(), objects: [], ...(o.dikey ? { dikey: o.dikey } : {}) } };
}
const BITE = [{ name: 'Bite', bonus: 5, damageDice: '1d6', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' }] as never;
const CLUB = [{ name: 'Slam', bonus: 5, damageDice: '1d6', damageType: 'bludgeoning', repeat: 1, ranged: false, reachFt: 5, text: 'Slam' }] as never;
const bow: AttackOption = { label: 'Longbow', attackBonus: 6, damage: '1d8+3', damageType: 'piercing', ranged: true, spell: false, range: [150, 600], tag: 'longbow' };
const mace: AttackOption = { label: 'Mace', attackBonus: 5, damage: '1d6+3', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'mace' };
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', speed: 30, weaponOptions: [bow, mace], hp: 30, maxHp: 30, ...p });
const DIGGER = (p: Partial<Combatant> = {}) => mk('D', { side: 'enemies', speed: 30, burrowFt: 30, attacks: BITE, hp: 30, maxHp: 30, ...p });
const GM = { playerId: 'gm', isGm: true };
const of = (s: BattleState, id: string) => s.combatants[id] as Combatant;
const run = (s: BattleState, cmd: Command, ctx = P1, rng: Rng = () => 0.9) => execute(s, cmd, ctx, rng);
const ok = (r: ReturnType<typeof execute>): BattleState => { if (!r.ok) throw new Error(r.error); return r.state; };
const turnOf = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('K73c kazma (Görev 1)', () => {
  const scene = (ver = 64, o: Opts = {}) => turnOf(field([A(), DIGGER()], { A: [H(3)], D: [H(8)] }, { ver, ...o }), 'D');
  const dig: Command = { type: 'vertical_move', actorId: 'D', toFt: -5 };
  it('kazma hızı olan kazılabilir zeminde yer altına iner (1 altıgen); 63\'te yok', () => {
    const r = run(scene(), dig, GM);
    expect(r.ok).toBe(true);
    if (r.ok) expect([of(r.state, 'D').altitudeFt, of(r.state, 'D').burrowed, of(r.state, 'D').movementUsed]).toEqual([-5, true, 1]);
    expect(run(scene(63), dig, GM).ok).toBe(false);
  });
  it('yer altındaki hedeflenemez; tremorsense ya da kazma hızı olan hedefler; yer altındaki saldıramaz', () => {
    const s = ok(run(scene(), dig, GM));
    expect(checkReach(s, of(s, 'A'), of(s, 'D'), { kind: 'ranged', normalFt: 150, longFt: 600 })).toMatchObject({ ok: false });
    const sensed = { ...s, combatants: { ...s.combatants, A: { ...of(s, 'A'), pos: H(7), senses: { tremorsense: 30 } } } };
    expect(checkReach(sensed, of(sensed, 'A'), of(sensed, 'D'), { kind: 'melee', reachFt: 5 })).toMatchObject({ ok: true });
    expect(checkReach(s, of(s, 'D'), of(s, 'A'), { kind: 'melee', reachFt: 300 })).toMatchObject({ ok: false });
  });
  it('yer altında kazma hızıyla ilerler, yüzeye çıkıp saldırır', () => {
    const s1 = ok(run(scene(), dig, GM));
    const s2 = ok(run(s1, { type: 'move', actorId: 'D', to: H(4) }, GM));
    expect([of(s2, 'D').pos, of(s2, 'D').burrowed]).toEqual([H(4), true]);
    const s3 = ok(run(s2, { type: 'vertical_move', actorId: 'D', toFt: 0 }, GM));
    expect([of(s3, 'D').altitudeFt ?? 0, of(s3, 'D').burrowed]).toEqual([0, undefined]);
    expect(run(s3, { type: 'monster_attack', actorId: 'D', targetId: 'A', attackIndex: 0 }, GM).ok).toBe(true);
  });
  it('duvar, taşlık ve mağara/zindan zemini kazılmaz; yer altında duvardan geçilmez', () => {
    const rocky = scene(64, { tiles: open('t') });
    expect(run(rocky, dig, GM).ok).toBe(false);
    expect(run(scene(64, { env: 'yeralt-ma-ara' }), dig, GM).ok).toBe(false);
    const wall = Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c === 6 ? 's' : '.')).join(''));
    const s = ok(run(scene(64, { tiles: wall }), dig, GM));
    expect(run(s, { type: 'move', actorId: 'D', to: H(5) }, GM).ok).toBe(false);
  });
  it('yer üstü alan (küre) yer altındakine işlemez', () => {
    const s = ok(run(scene(), dig, GM));
    const area = pickArea(s, of(s, 'A'), { shape: 'sphere', sizeFt: 20, origin: 'point', targets: 'all' } as never, 150, H(8));
    expect('ok' in area ? null : area.reached.map((x) => x.c.id)).not.toContain('D');
  });
  it('YZ: yürüyerek yolu olmayan kazan düşman kazar; yer altında yaklaşıp bitişikte yüzeye çıkar', () => {
    const wall = Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c === 6 ? 's' : '.')).join(''));
    const s = scene(64, { tiles: wall });
    expect(chooseCommand(s)).toEqual({ type: 'vertical_move', actorId: 'D', toFt: -5 });
    const under = { ...s, combatants: { ...s.combatants, D: { ...of(s, 'D'), pos: H(4), altitudeFt: -5, burrowed: true as const } } };
    expect(chooseCommand(under)).toEqual({ type: 'vertical_move', actorId: 'D', toFt: 0 });
  });
});

describe('K73c su altı (Görev 2)', () => {
  // 7–14. sütun derin su.
  const lake = () => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c >= 7 ? 'w' : '.')).join(''));
  const scene = (ver = 64, a: Partial<Combatant> = {}, apos: [Offset, number?] = [H(8)]) =>
    field([A(a), mk('G', { side: 'enemies', attacks: CLUB, hp: 30, maxHp: 30 })], { A: apos, G: [H(10)] }, { ver, tiles: lake() });
  it('derin suda dalar (yüzme hızı yoksa 5 ft = 2 altıgen), batık olur; 63\'te dalış yok', () => {
    const r = run(scene(), { type: 'vertical_move', actorId: 'A', toFt: -5 });
    expect(r.ok).toBe(true);
    if (r.ok) expect([of(r.state, 'A').altitudeFt, of(r.state, 'A').movementUsed]).toEqual([-5, 2]);
    expect(run(scene(63), { type: 'vertical_move', actorId: 'A', toFt: -5 }).ok).toBe(false);
  });
  it('su altındaki (yüzeyde de) ateşe dirençli; 63\'te değil; süzülen su altı sayılmaz', () => {
    const synced = (s: BattleState) => ok(run(s, { type: 'dodge', actorId: 'A' }));
    expect(of(synced(scene()), 'A').auraResist).toContain('fire');
    expect(of(synced(scene(63)), 'A').auraResist ?? []).not.toContain('fire');
    const hov = synced(scene(64, { effects: [{ id: 'pk:t#0:A', name: 'Süzülme', sourceId: 'A', fly: 30, flyCapFt: 5, hover: true }] }));
    expect(of(hov, 'A').auraResist ?? []).not.toContain('fire');
  });
  it('kıyıdan batık hedefe menzilli saldırı dezavantajlı (64); 63\'te değil', () => {
    for (const [ver, dis] of [[64, true], [63, false]] as const) {
      const s = field([A(), mk('G', { side: 'enemies', attacks: CLUB, hp: 30, maxHp: 30 })], { A: [H(3)], G: [H(9), -10] }, { ver, tiles: lake() });
      const r = run(s, { type: 'attack', actorId: 'A', targetId: 'G', option: bow }, P1, () => 0.5);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      const atk = r.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
      expect(atk.mode === 'disadvantage').toBe(dis);
    }
  });
  it('nefes: süre bitince tur sonu 1 Exhaustion; yüzeye çıkınca gider', () => {
    const s0 = scene(64, {}, [H(8), -5]);
    const tired = { ...s0, combatants: { ...s0.combatants, A: { ...of(s0, 'A'), mapStatus: { ...of(s0, 'A').mapStatus, breath: 10 } } } };
    const s1 = ok(run(tired, { type: 'end_turn', actorId: 'A' }));
    expect([of(s1, 'A').exhaustion, of(s1, 'A').mapStatus.suffocation]).toEqual([1, 1]);
    const s2 = ok(run(turnOf({ ...s1, combatants: { ...s1.combatants, A: { ...of(s1, 'A'), movementUsed: 0 } } }, 'A'), { type: 'vertical_move', actorId: 'A', toFt: 0 }));
    expect([of(s2, 'A').exhaustion, of(s2, 'A').mapStatus.breath, of(s2, 'A').mapStatus.suffocation]).toEqual([0, 0, 0]);
  });
  it('yüzme hızı olan canavarın Piercing olmayan yakın dövüşü cezasız (64)', () => {
    const shark = (ver: number) => field([mk('S', { side: 'enemies', monsterId: 'reef-shark', attacks: CLUB, hp: 20, maxHp: 20 }), A()], { S: [H(9)], A: [H(10)] }, { ver, tiles: lake() });
    const mode = (ver: number) => {
      const r = run(shark(ver), { type: 'monster_attack', actorId: 'S', targetId: 'A', attackIndex: 0 }, GM, () => 0.5);
      return r.ok ? (r.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>).mode : null;
    };
    expect(mode(64)).toBe('normal');
    expect(mode(63)).toBe('disadvantage');
  });
  it('YZ: nefesi bitmek üzere olan batık yüzeye çıkar', () => {
    const s0 = scene(64, {}, [H(8), -10]);
    const low = { ...s0, combatants: { ...s0.combatants, A: { ...of(s0, 'A'), mapStatus: { ...of(s0, 'A').mapStatus, breath: 9 } } } };
    expect(chooseCommand(low)).toMatchObject({ type: 'vertical_move', actorId: 'A', toFt: 0 });
  });
});

describe('K73c çok altıgenli gövde ve 3B menzil (Görev 5, 6)', () => {
  it('çok altıgenli gövdenin zemini en yüksek ayak altı (64); 63\'te çapa', () => {
    const big = (ver: number) => {
      const s = field([A(), mk('L', { side: 'enemies', size: 'L', hp: 40, maxHp: 40 })], { A: [H(2)], L: [H(6)] }, { ver, multiHex: true });
      // Çapanın batısı 10 ft (katman yerine K72 duruş değil: doğrudan zemin fonksiyonu sınanır).
      return s;
    };
    const s64 = big(64);
    expect(bodyZeminFt(s64, of(s64, 'L'), H(6))).toBe(0);
    expect(bodyZeminFt(big(63), of(big(63), 'L'), H(6))).toBe(0);
  });
  it('kat döşemesini aşan ya da kenarından taşan büyük gövde yerleştirilemez (64)', () => {
    const s = field([A(), mk('L', { side: 'enemies', size: 'L', hp: 40, maxHp: 40 })], { A: [H(1)], L: [H(12)] }, { multiHex: true, tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY });
    const edge = bodyFitProblem(s, { ...of(s, 'L'), altitudeFt: 10 }, H(8, 2));
    expect(edge).toMatch(/döşeme/);
    const s63 = { ...s, kuralSurumu: 63 };
    expect(bodyFitProblem(s63, { ...of(s63, 'L'), altitudeFt: 10 }, H(8, 2)) ?? '').not.toMatch(/döşeme/);
  });
  it('tepki menzili 3B: 30 ft yukarıdaki 64\'te 30 ft, 63\'te 5 ft; döşeme ayırır', () => {
    for (const [ver, want] of [[64, 30], [63, 5]] as const) {
      const s = field([A(), mk('F', { side: 'enemies', fly: 60, hp: 20, maxHp: 20 })], { A: [H(3)], F: [H(4), 30] }, { ver });
      expect(feetBetween(s, of(s, 'A'), of(s, 'F'))).toBe(want);
    }
    const floors = field([A(), mk('F', { side: 'enemies', hp: 20, maxHp: 20 })], { A: [H(6)], F: [H(6), 10] }, { tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY });
    expect(feetBetween(floors, of(floors, 'A'), of(floors, 'F'))).toBe(Infinity);
  });
});

describe('K73c replay', () => {
  it('kazma, yüzeye çıkış, dalış ve nefes olayları baştan oynatılınca aynı durum', () => {
    const lake = Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c >= 9 ? 'w' : '.')).join(''));
    let s = turnOf(field([A(), DIGGER()], { A: [H(10)], D: [H(4)] }, { tiles: lake }), 'D');
    const events: BattleEvent[] = [{ type: 'battle_started', state: s } as BattleEvent];
    const step = (cmd: Command, ctx = P1) => { const r = execute(s, cmd, ctx, () => 0.9); if (!r.ok) throw new Error(r.error); s = r.state; events.push(...r.events); };
    step({ type: 'vertical_move', actorId: 'D', toFt: -5 }, GM);
    step({ type: 'move', actorId: 'D', to: H(6) }, GM);
    step({ type: 'vertical_move', actorId: 'D', toFt: 0 }, GM);
    step({ type: 'end_turn', actorId: 'D' }, GM);
    step({ type: 'vertical_move', actorId: 'A', toFt: -5 });
    step({ type: 'end_turn', actorId: 'A' });
    expect(JSON.stringify(replay(events).combatants)).toBe(JSON.stringify(s.combatants));
  });
});

// --- Görev 3 ve 4: havada merkezli küre/silindir, Call Lightning fırtına devralma -------------------------------------------
const SLOTS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const MAGE = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', spellNames: ['Fireball', 'Shatter', 'Fog Cloud', 'Moonbeam', 'Darkness', 'Call Lightning', 'Flame Strike'],
  spellSlots: SLOTS, spellSaveDc: 30, spellAttack: 10, spellMod: 5, casterTag: 'wizard', hp: 200, maxHp: 200, ...p });
const FOE = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, saves: LOW, ...p });
const saved = (evs: BattleEvent[]) => evs.filter((e) => e.type === 'save_resolved').map((e) => (e as { targetId: string }).targetId).sort();
function onMap(parts: Combatant[], pos: Record<string, [Offset, number?]>, mapId: string, variantId: string, ver = 64): BattleState {
  const s = startBattle('k73c', 'k73c', parts, () => 0.5, { kuralSurumu: ver, map: { id: mapId, variantId, ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, [p, alt]] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}) };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: open(), objects: [] } };
}

describe('K73c havada merkezli alan (Görev 3)', () => {
  const sky = (ver = 64) => field([MAGE(), FOE('F', { fly: 60, altitudeFt: 40 }), FOE('G')], { A: [H(0)], F: [H(6), 40], G: [H(7)] }, { ver });
  const fb = (p: Partial<Command> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: H(6), ...p }) as Command;
  it('Fireball merkezi 40 ft\'te: uçan vurulur, yerdeki dışarıda; yerde merkezliyken tersi; 63\'te yükseklik yok sayılır', () => {
    expect(saved((run(sky(), fb({ targetFt: 40 })) as { events: BattleEvent[] }).events)).toEqual(['F']);
    expect(saved((run(sky(), fb()) as { events: BattleEvent[] }).events)).toEqual(['G']);
    const r63 = run(sky(63), fb({ targetFt: 40 }));
    const r63b = run(sky(63), fb());
    expect(r63.ok && r63b.ok && saved(r63.events)).toEqual(saved((r63b as { events: BattleEvent[] }).events));
  });
  it('merkez yüksekliği 5 ft adımla, açık gökte en çok uçuş üst sınırı; menzil 3B', () => {
    expect(run(sky(), fb({ targetFt: 12 }))).toMatchObject({ ok: false, error: 'Merkez yüksekliği 5 ft adımla seçilir.' });
    expect(run(sky(), fb({ targetFt: 65 }))).toMatchObject({ ok: false, error: 'Merkez en çok 60 ft yükseğe konur.' });
    const s = sky();
    const tall = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), ucusUstFt: 120 } };
    const sh = (ft: number) => run(tall, { type: 'cast_spell', actorId: 'A', spellName: 'Shatter', targetHex: H(2), targetFt: ft } as Command);
    expect(sh(60).ok).toBe(true);
    expect(sh(65)).toMatchObject({ ok: false, error: 'Nokta menzil dışında: 65 ft (3B), menzil 60 ft.' });
  });
  it('havadaki silindir dairesi üstte: Flame Strike 40 ft silindir merkez 40 ft\'te yere iner, 50 ft\'te inmez', () => {
    const fs = (ft: number) => saved((run(sky(), { type: 'cast_spell', actorId: 'A', spellName: 'Flame Strike', targetHex: H(6), targetFt: ft } as Command) as { events: BattleEvent[] }).events);
    expect(fs(40)).toEqual(['F', 'G']);
    expect(fs(50)).toEqual(['F']);
  });
  it('yere değmeyen havadaki alan yerdeki yüzeye işlemez (alan altıgenleri yalnız görsel)', () => {
    const r = run(sky(), fb({ targetFt: 40 }));
    const cast = r.ok ? r.events.find((e) => e.type === 'spell_cast' && (e as { area?: unknown }).area) as { area: { hexes: Offset[]; airHexes?: Offset[] } } : undefined;
    expect([cast?.area.hexes.length, (cast?.area.airHexes?.length ?? 0) > 0]).toEqual([0, true]);
  });
  it('kalıcı alan: Fog Cloud havada aralığını kaydeder; Darkness yere bağlı (2B ışık) havada merkezlenmez', () => {
    const r = run(sky(), { type: 'cast_spell', actorId: 'A', spellName: 'Fog Cloud', targetHex: H(6), targetFt: 40 } as Command);
    expect(r.ok && r.state.map?.zones?.find((z) => z.spellId === 'fog-cloud')?.air).toEqual({ loFt: 20, hiFt: 60 });
    expect(run(sky(), { type: 'cast_spell', actorId: 'A', spellName: 'Darkness', targetHex: H(6), targetFt: 40 } as Command)).toMatchObject({ ok: false, error: 'Bu alan yere bağlı: havada merkezlenemez.' });
  });
  it('havadaki Moonbeam silindiri (40 ft, merkez 50): uçan içeride, yerdeki dışarıda (altitudeInZone)', async () => {
    const { altitudeInZone } = await import('./altitude');
    const r = run(sky(), { type: 'cast_spell', actorId: 'A', spellName: 'Moonbeam', targetHex: H(6), targetFt: 50 } as Command);
    const z = r.ok ? r.state.map?.zones?.find((x) => x.spellId === 'moonbeam') : undefined;
    expect(z?.air).toEqual({ loFt: 10, hiFt: 50 });
    if (!r.ok || !z) return;
    expect([altitudeInZone(r.state, z, null, of(r.state, 'F')), altitudeInZone(r.state, z, null, of(r.state, 'G'))]).toEqual([true, false]);
  });
  it('önizleme motorla aynı: yalnız aralıktakiler', async () => {
    const { areaActPreview } = await import('../ui/hud');
    const { spells } = await import('../data');
    const sp = spells.find((x) => x.name === 'Fireball') as NonNullable<(typeof spells)[number]>;
    const s = sky();
    const pv = areaActPreview(s, of(s, 'A'), { kind: 'spell', spell: sp }, H(6), null, undefined, null, 40);
    expect([pv.error, pv.foes.map((c) => c.id)]).toEqual([null, ['F']]);
  });
});

describe('K73c Call Lightning fırtına devralma (Görev 4)', () => {
  const cl = (p: Partial<Command>) => ({ type: 'cast_spell', actorId: 'A', spellName: 'Call Lightning', ...p }) as Command;
  const storm = (ver = 64) => onMap([MAGE(), FOE('F')], { A: [H(0)], F: [H(14)] }, 'ada', 'firtina', ver);
  it('fırtınalı açık gökte yeni bulut yok: fırtına devralınır, nokta bulut yarıçapının ötesinde de olur, +1d10', () => {
    const r = run(storm(), cl({ targetHex: H(14) }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const z = r.state.map?.zones?.find((x) => x.spellId === 'call-lightning');
    expect([z?.cloud?.storm, z?.hexes.length, z?.center]).toEqual([{ kind: 'map' }, 0, undefined]);
    expect((r.events.find((e) => e.type === 'spell_cast' && (e as { area?: unknown }).area) as { area: { dice: string } }).area.dice).toBe('4d10');
    // 63: yeni bulut kurulur, nokta 60 ft içinde olmalı.
    expect(run(storm(63), cl({ targetHex: H(14) }))).toMatchObject({ ok: false });
  });
  it('Storm of Vengeance alanı altında devralır; nokta alanın dışındaysa red', () => {
    const base = onMap([MAGE(), FOE('F')], { A: [H(0)], F: [H(5)] }, 'col', 'gunduz');
    const sov = { id: 'sov', spellId: 'storm-of-vengeance', name: 'Storm of Vengeance', casterId: 'X', side: 'enemies' as const, dc: 15, slotLevel: 9,
      hexes: Array.from({ length: 7 }, (_, c) => H(c)) };
    const s = { ...base, map: { ...(base.map as NonNullable<BattleState['map']>), zones: [sov] } };
    const r = run(s, cl({ targetHex: H(5) }));
    expect(r.ok && r.state.map?.zones?.find((x) => x.spellId === 'call-lightning')?.cloud?.storm).toEqual({ kind: 'zone', zoneId: 'sov' });
    expect(run(s, cl({ targetHex: H(9) }))).toMatchObject({ ok: false, error: 'Call Lightning: şimşek noktası fırtınanın (Storm of Vengeance) altında olmalı.' });
  });
  it('bulutsuz noktanın yüksekliği (yaratık seçilmeden): 20 ft\'teki uçan vurulur, tabanın üstü red', () => {
    const s = field([MAGE(), FOE('F', { fly: 30, altitudeFt: 20 }), FOE('G')], { A: [H(0)], F: [H(6), 20], G: [H(7)] });
    const r = run(s, cl({ targetHex: H(6), targetFt: 20 }));
    expect(r.ok && saved(r.events)).toEqual(['F']);
    expect(run(s, cl({ targetHex: H(6), targetFt: 35 }))).toMatchObject({ ok: false, error: 'Call Lightning: nokta bulutun tabanının (30 ft) altında olmalı.' });
  });
  it('replay: havadaki alan ve devralınan fırtına aynı durumu verir', () => {
    let s = storm();
    const events: BattleEvent[] = [{ type: 'battle_started', state: s } as BattleEvent];
    const step = (cmd: Command) => { const r = execute(s, cmd, P1, () => 0.9); if (!r.ok) throw new Error(r.error); s = r.state; events.push(...r.events); };
    step(cl({ targetHex: H(14) }));
    expect(JSON.stringify(replay(events).map?.zones)).toBe(JSON.stringify(s.map?.zones));
  });
});
