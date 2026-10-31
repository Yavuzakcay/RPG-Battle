/**
 * Kuyruk 24: Orman mekanikleri. Her mekanik için: tetiklenir; eski kayıtta (kural sürümü 2) tetiklenmez; Game Master
 * kapatınca tetiklenmez. Replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { applyEvents, replay } from './reduce';
import { forestRoundEvents, windDir } from './forest';
import { ruleOf } from './maprules';
import { terrainOf } from '../map/terrain';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const low: Rng = () => 0.01;
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const club: AttackOption = { label: 'Sopa', attackBonus: 20, damage: '1d2+40', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'x' };
const torch: AttackOption = { ...club, label: 'Meşale', damage: '1d2', damageType: 'fire', reachFt: 5 };

interface Opt { variant?: string; v?: number; toggles?: Record<string, boolean>; params?: Record<string, Record<string, number | string>>; extra?: Combatant[] }
function battle(mapId: string, pos: Record<string, Offset>, opt: Opt = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, skills: { athletics: 10, investigation: 10, perception: 10 }, weaponOptions: [club, torch] }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 5, saves: LOW }),
    ...(opt.extra ?? []),
  ];
  const st = startBattle('k24', 'orman', parts, () => 0.5, {
    map: { id: mapId, ...(opt.variant ? { variantId: opt.variant } : {}), ...(opt.toggles ? { ruleToggles: opt.toggles } : {}), ...(opt.params ? { ruleParams: opt.params } : {}) },
    ...(opt.v ? { kuralSurumu: opt.v } : {}),
  }).state;
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants } as BattleState;
}
const run = (s: BattleState, cmd: Command, rng: Rng = high, ctx = P1) => { const r = execute(s, cmd, ctx, rng); if (!r.ok) throw new Error(r.error); return r; };
const tile = (s: BattleState, h: Offset) => s.map?.tiles[h.row]?.[h.col];
const objIn = (s: BattleState, id: string) => s.map?.objects?.find((x) => x.id === id);
const use = (s: BattleState, objectId: string, action: 'solve' | 'ignite' | 'fell' | 'scatter', rng: Rng = high) => execute(s, { type: 'object_use', actorId: 'A', objectId, action }, P1, rng);
const replays = (start: BattleState, ...steps: Array<{ state: BattleState; events: BattleEvent[] }>) =>
  expect(replay([{ type: 'battle_started', state: start }, ...steps.flatMap((x) => x.events)])).toEqual(steps[steps.length - 1]?.state);

describe('1. Heykel Gölü: şelale arkası geçit', () => {
  const at = { A: o(21, 4), B: o(2, 9) };
  it('göz çözülünce şelale ayrılır, geçit açılır; başarısız deneme bir şey açmaz; replay aynı', () => {
    const s0 = battle('orman-heykel-golu', at);
    expect(tile(s0, o(28, 7))).toBe('s');
    expect(use(s0, 'heykelGozu', 'solve', low).ok && tile((use(s0, 'heykelGozu', 'solve', low) as { state: BattleState }).state, o(28, 7))).toBe('s');
    const r = run(s0, { type: 'object_use', actorId: 'A', objectId: 'heykelGozu', action: 'solve' });
    expect(['.', '.', '.']).toEqual([o(28, 7), o(28, 6), o(29, 6)].map((h) => tile(r.state, h)));
    expect(objIn(r.state, 'heykelGozu')?.state).toBe('open');
    expect(objIn(r.state, 'gecitSandik')).toBeTruthy();
    replays(s0, r);
  });
  it('nilüfer taşları sığ, gölün geri kalanı derin', () => {
    const s = battle('orman-heykel-golu', at);
    expect(terrainOf(tile(s, o(13, 5)) ?? '#').name).toBe('Sığ su, çamur');
    expect(tile(s, o(18, 7))).toBe('w');
  });
  it('eski kayıtta ve Game Master kapatınca çalışmaz', () => {
    expect(use(battle('orman-heykel-golu', at, { v: 2 }), 'heykelGozu', 'solve').ok).toBe(false);
    expect(use(battle('orman-heykel-golu', at, { toggles: { waterfall: false } }), 'heykelGozu', 'solve').ok).toBe(false);
  });
});

describe('2a. Ork Kampı: alarm boynuzu', () => {
  const sentry = (s: BattleState, round: number, sentryHp = 60): BattleState => ({
    ...s, round,
    combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), hp: sentryHp } },
    groups: (s.groups ?? []).map((g) => (g.id === 'nobet' ? { ...g, state: 'alarmed' as const, alarmedRound: 1, members: ['B'] }
      : g.id === 'kamp' ? { ...g, state: 'asleep' as const, members: ['C'] } : g)),
  });
  const extra = [mk('C', { side: 'enemies', hp: 20, maxHp: 20, asleep: true })];
  const pos = { A: o(13, 8), B: o(16, 3), C: o(6, 4) };
  it('gruplar kuraldan kurulur; nöbetçi alarmından 1 tur sonra ayaktaysa boynuz öter, kamp alarmlanır', () => {
    const s = battle('orman-ork-kampi', pos, { extra });
    expect(s.groups?.map((g) => [g.id, g.state])).toEqual([['nobet', 'calm'], ['kamp', 'calm']]);
    const evs = forestRoundEvents(sentry(s, 2), high);
    expect(evs.some((e) => e.type === 'group_alarmed' && e.groupId === 'kamp')).toBe(true);
    // Henüz vakti gelmedi (aynı tur) ya da nöbetçi susturuldu: boynuz yok.
    expect(forestRoundEvents(sentry(s, 1), high).some((e) => e.type === 'group_alarmed')).toBe(false);
    const silenced = forestRoundEvents(sentry(s, 2, 0), high);
    expect(silenced.some((e) => e.type === 'group_alarmed')).toBe(false);
    expect(silenced.some((e) => e.type === 'map_note' && /iptal/.test(e.text))).toBe(true);
  });
  it('Game Master parametresi: takviyeye kalan tur', () => {
    const s = battle('orman-ork-kampi', pos, { extra, params: { hornAlarm: { delayRounds: 2 } } });
    expect(forestRoundEvents(sentry(s, 2), high).some((e) => e.type === 'group_alarmed')).toBe(false);
    expect(forestRoundEvents(sentry(s, 3), high).some((e) => e.type === 'group_alarmed')).toBe(true);
  });
  it('eski kayıtta ve Game Master kapatınca grup yok, boynuz yok', () => {
    for (const s of [battle('orman-ork-kampi', pos, { extra, v: 2 }), battle('orman-ork-kampi', pos, { extra, toggles: { hornAlarm: false } })]) {
      expect(s.groups).toBeUndefined();
      expect(forestRoundEvents({ ...s, round: 2 }, high)).toEqual([]);
    }
  });
});

describe('2b. Ork Kampı: çadır yangını (ortak rüzgâr)', () => {
  const pos = { A: o(4, 7), B: o(5, 4) };
  it('meşale çadırı tutuşturur (alev yüzeyi); tur başında rüzgâr yönündeki çadıra sıçrar, bitişikteki hasar alır', () => {
    const s0 = battle('orman-ork-kampi', pos);
    expect(windDir(s0)).toBe('NE');
    const r = run(s0, { type: 'object_use', actorId: 'A', objectId: 'cadir3', action: 'ignite' });
    expect(objIn(r.state, 'cadir3')?.state).toBe('burning');
    expect(r.state.map?.zones?.some((z) => z.surface === 'fire' && z.until === undefined)).toBe(true);
    const round = forestRoundEvents({ ...r.state, round: 2 }, high);
    // cadir3 (batı) → kuzeydoğusundaki cadir1 tutuşur; güneydoğudaki çadırlar tutuşmaz.
    expect(round.filter((e) => e.type === 'object_changed' && e.state === 'burning').map((e) => (e as { objectId: string }).objectId)).toEqual(['cadir1']);
    // A yanan çadıra bitişik: hasar.
    expect(round.some((e) => e.type === 'map_effect' && e.rule === 'tentFire' && e.targetId === 'A')).toBe(true);
    replays(s0, r);
  });
  it('rüzgâr yönü Game Master parametresi; kapalıyken her yöne', () => {
    const toSE = battle('orman-ork-kampi', pos, { params: { wind: { dir: 'SE' } } });
    const lit = run(toSE, { type: 'object_use', actorId: 'A', objectId: 'cadir3', action: 'ignite' }).state;
    expect(forestRoundEvents({ ...lit, round: 2 }, high).some((e) => e.type === 'object_changed' && e.state === 'burning')).toBe(false);
    const calm = run(battle('orman-ork-kampi', pos, { toggles: { wind: false } }), { type: 'object_use', actorId: 'A', objectId: 'cadir3', action: 'ignite' }).state;
    expect(windDir(calm)).toBeNull();
    expect(forestRoundEvents({ ...calm, round: 2 }, high).some((e) => e.type === 'object_changed' && e.state === 'burning')).toBe(true);
  });
  it('ateş hasarı (nesneye saldırı) de tutuşturur', () => {
    const s = battle('orman-ork-kampi', pos);
    const r = run(s, { type: 'attack_object', actorId: 'A', objectId: 'cadir3', option: torch });
    expect(objIn(r.state, 'cadir3')?.state).toBe('burning');
  });
  it('eski kayıtta ve Game Master kapatınca tutuşmaz', () => {
    expect(use(battle('orman-ork-kampi', pos, { v: 2 }), 'cadir3', 'ignite').ok).toBe(false);
    const off = battle('orman-ork-kampi', pos, { toggles: { tentFire: false } });
    expect(use(off, 'cadir3', 'ignite').ok).toBe(false);
    expect(objIn(run(off, { type: 'attack_object', actorId: 'A', objectId: 'cadir3', option: torch }).state, 'cadir3')?.state).toBeUndefined();
  });
});

describe('3. Oduncu Kampı: ağaç devirme, köprüler, nehir', () => {
  const pos = { A: o(5, 1), B: o(7, 1) };
  it('STR ile devrilen ağaç hattakine DEX save, gövde yarım siper, uçurumu kesen altıgen geçit; replay aynı', () => {
    const s0 = battle('orman-oduncu-kampi', pos);
    expect(tile(s0, o(9, 2))).toBe('u');
    const r = run(s0, { type: 'object_use', actorId: 'A', objectId: 'agac1', action: 'fell' });
    expect(objIn(r.state, 'agac1')).toBeUndefined();
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'treeFell' && e.targetId === 'B' && (e.damage?.applied ?? 0) > 0)).toBe(true);
    expect([tile(r.state, o(5, 0)), tile(r.state, o(6, 1)), tile(r.state, o(9, 2))]).toEqual(['t', 'k', 'p']);
    expect(terrainOf('k').cover).toBe(2);
    replays(s0, r);
  });
  it('köprü kırılınca geçit kapanır; üstündeki kenara atlar', () => {
    const s0 = battle('orman-oduncu-kampi', { A: o(9, 4), B: o(8, 4) });
    const r = run(s0, { type: 'attack_object', actorId: 'A', objectId: 'kopru2', option: club });
    expect([tile(r.state, o(7, 4)), tile(r.state, o(8, 4))]).toEqual(['u', 'u']);
    const b = r.state.combatants.B as Combatant;
    expect(b.pos && tile(r.state, b.pos)).not.toBe('u');
  });
  it('nehir geçilmez: varsayılan kapalı (yüzülür), Game Master açınca geçilmez', () => {
    expect(tile(battle('orman-oduncu-kampi', pos), o(3, 14))).toBe('w');
    const on = battle('orman-oduncu-kampi', pos, { toggles: { riverBlocked: true } });
    expect(tile(on, o(3, 14))).toBe('R');
    expect(terrainOf('R')).toMatchObject({ movement: 'blocked', flyersPass: true });
    expect(tile(on, o(14, 14))).toBe('p');
  });
  it('eski kayıtta ve Game Master kapatınca ağaç devrilmez, köprü kırılsa da geçit kalır', () => {
    expect(use(battle('orman-oduncu-kampi', pos, { v: 2 }), 'agac1', 'fell').ok).toBe(false);
    expect(use(battle('orman-oduncu-kampi', pos, { toggles: { treeFell: false } }), 'agac1', 'fell').ok).toBe(false);
    const off = battle('orman-oduncu-kampi', { A: o(9, 4), B: o(2, 2) }, { toggles: { bridgeBreak: false } });
    expect(tile(run(off, { type: 'attack_object', actorId: 'A', objectId: 'kopru2', option: club }).state, o(8, 4))).toBe('p');
    expect(tile(battle('orman-oduncu-kampi', pos, { v: 2, toggles: { riverBlocked: true } }), o(3, 14))).toBe('w');
  });
});

describe('4. Kemik Açıklığı: kemik yığınları canlanır', () => {
  const pos = { A: o(2, 4), B: o(19, 4) };
  it('2 tur sonra (3. turun başında) her yığın SRD iskeleti olur; dağıtılan ve ateşle yanan yığın kalkmaz', () => {
    const s0 = battle('orman-kemik-acikligi', pos);
    expect(forestRoundEvents({ ...s0, round: 2 }, high)).toEqual([]);
    const rise = forestRoundEvents({ ...s0, round: 3 }, high);
    const raised = rise.filter((e) => e.type === 'summoned').map((e) => (e as { combatant: Combatant }).combatant);
    expect(raised.map((c) => [c.monsterId, c.side])).toEqual([['skeleton', 'enemies'], ['skeleton', 'enemies'], ['skeleton', 'enemies']]);
    const scattered = run(s0, { type: 'object_use', actorId: 'A', objectId: 'kemik1', action: 'scatter' });
    expect(objIn(scattered.state, 'kemik1')).toBeUndefined();
    const burnt = run(battle('orman-kemik-acikligi', { A: o(14, 5), B: o(19, 4) }), { type: 'attack_object', actorId: 'A', objectId: 'kemik2', option: torch });
    expect(objIn(burnt.state, 'kemik2')).toBeUndefined();
    expect(forestRoundEvents({ ...scattered.state, round: 3 }, high).filter((e) => e.type === 'summoned')).toHaveLength(2);
    replays(s0, scattered);
  });
  it('gece varyantında 1 tur sonra; tur sayısı Game Master parametresi', () => {
    expect(forestRoundEvents({ ...battle('orman-kemik-acikligi', pos, { variant: 'gece' }), round: 2 }, high).some((e) => e.type === 'summoned')).toBe(true);
    expect(forestRoundEvents({ ...battle('orman-kemik-acikligi', pos, { params: { boneRise: { rounds: 4 } } }), round: 3 }, high)).toEqual([]);
  });
  it('tam akış: tur geçince iskelet sıraya girer ve replay aynı', () => {
    const s0 = battle('orman-kemik-acikligi', pos, { params: { boneRise: { rounds: 1 } } });
    const a = run(s0, { type: 'end_turn', actorId: 'A' });
    const b = run(a.state, { type: 'end_turn', actorId: 'B' }, high, GM);
    expect(b.state.round).toBe(2);
    expect(b.state.order.filter((id) => id.startsWith('kemik-'))).toHaveLength(3);
    replays(s0, a, b);
  });
  it('eski kayıtta ve Game Master kapatınca kalkmaz, dağıtılamaz', () => {
    expect(forestRoundEvents({ ...battle('orman-kemik-acikligi', pos, { v: 2 }), round: 3 }, high)).toEqual([]);
    const off = battle('orman-kemik-acikligi', pos, { toggles: { boneRise: false } });
    expect(forestRoundEvents({ ...off, round: 3 }, high)).toEqual([]);
    expect(use(off, 'kemik1', 'scatter').ok).toBe(false);
  });
});

describe('5. Dere Kenarı: sarmaşık kapanı ve kütük siperi', () => {
  const pos = { A: o(5, 3), B: o(13, 3) };
  it('sarmaşığa giren STR save; başarısızsa Restrained, yürüyüş biter, eylemle kurtulur; pasif Algı fark eder', () => {
    const s0 = battle('orman', pos);
    const r = run(s0, { type: 'move', actorId: 'A', to: o(6, 3) }, low);
    const a = r.state.combatants.A as Combatant;
    expect(a.conditions).toContain('Restrained');
    expect(r.state.map?.trapsSprung).toEqual(['6,3']);
    const free = run(r.state, { type: 'escape', actorId: 'A' }, high);
    expect((free.state.combatants.A as Combatant).conditions).not.toContain('Restrained');
    replays(s0, r, free);
    // Tur başında yakındaki parti üyesi pasif Algıyla fark eder (Perception +10).
    const watch = run(run(s0, { type: 'end_turn', actorId: 'A' }).state, { type: 'end_turn', actorId: 'B' }, high, GM);
    expect(watch.state.map?.trapsFound?.length).toBeGreaterThan(0);
  });
  it('devrik kütük yarım siper (k); eski kayıtta ve kapalıyken köprü (p)', () => {
    expect(tile(battle('orman', pos), o(1, 1))).toBe('k');
    expect(tile(battle('orman', pos, { v: 2 }), o(1, 1))).toBe('p');
    expect(tile(battle('orman', pos, { toggles: { logCover: false } }), o(1, 1))).toBe('p');
  });
  it('eski kayıtta ve Game Master kapatınca sarmaşık yok', () => {
    for (const s of [battle('orman', pos, { v: 2 }), battle('orman', pos, { toggles: { vineTrap: false } })]) {
      expect(ruleOf(s, 'vineTrap')).toBeUndefined();
      const r = run(s, { type: 'move', actorId: 'A', to: o(6, 3) }, low);
      expect((r.state.combatants.A as Combatant).conditions).not.toContain('Restrained');
    }
  });
});

describe('Kuyruk 24b: Ork Kampı sürekli takviye', () => {
  const extra = [mk('C', { side: 'enemies', hp: 20, maxHp: 20 })];
  const pos = { A: o(13, 8), B: o(16, 3), C: o(6, 4) };
  /** Nöbetçi (B) 1. turda alarmlanmış; kamp (C) habersiz. */
  const alarmed = (s: BattleState, sentryHp = 60): BattleState => ({
    ...s, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), hp: sentryHp } },
    groups: (s.groups ?? []).map((g) => (g.id === 'nobet' ? { ...g, state: 'alarmed' as const, alarmedRound: 1, members: ['B'] } : g.id === 'kamp' ? { ...g, members: ['C'] } : g)),
  });
  /** `from` turundan `to` turuna kadar her tur başı Orman olayları; olaylar ve son durum. */
  function rounds(s0: BattleState, from: number, to: number) {
    let s = s0;
    const all: BattleEvent[] = [];
    for (let r = from; r <= to; r++) {
      s = { ...s, round: r };
      const evs = forestRoundEvents(s, high);
      all.push(...evs);
      s = applyEvents(s, evs);
    }
    return { state: s, events: all };
  }
  const raised = (evs: BattleEvent[]) => evs.filter((e) => e.type === 'summoned').map((e) => (e as { combatant: Combatant }).combatant);

  it('alarm → 1 tur sonra boynuz → her 2 turda 1 takviye (Tough, Berserker sırayla, çadır yanında); replay aynı', () => {
    const s0 = alarmed(battle('orman-ork-kampi', pos, { extra }));
    const r = rounds(s0, 2, 6);
    expect(r.state.map?.hornRound).toBe(2);
    expect(r.events.some((e) => e.type === 'group_alarmed' && e.groupId === 'kamp')).toBe(true);
    const waves = raised(r.events);
    expect(waves.map((c) => [c.id, c.monsterId, c.side])).toEqual([['takviye-1', 'tough', 'enemies'], ['takviye-2', 'berserker', 'enemies']]);
    expect(r.state.order.slice(-2)).toEqual(['takviye-1', 'takviye-2']);
    // Tur alanı testte elle ilerletildi (olaysız); geri kalan durum olaylardan birebir.
    expect({ ...replay([{ type: 'battle_started', state: s0 }, ...r.events]), round: r.state.round }).toEqual(r.state);
  });
  it('son çadır yıkılınca/yanınca takviye durur; çadır saldırıyla yıkılır', () => {
    const s0 = alarmed(battle('orman-ork-kampi', { ...pos, A: o(4, 7) }, { extra }));
    const hit = run(s0, { type: 'attack_object', actorId: 'A', objectId: 'cadir3', option: club });
    expect(hit.state.map?.objects?.some((x) => x.id === 'cadir3')).toBe(false);
    const ruined = { ...hit.state, map: { ...(hit.state.map as NonNullable<BattleState['map']>), objects: (hit.state.map?.objects ?? []).map((x) => (x.kind === 'tent' ? { ...x, state: 'burning' as const } : x)) } };
    expect(raised(rounds(ruined, 2, 8).events)).toEqual([]);
  });
  it('toplam üst sınır ve dalga büyüklüğü Game Master parametresi', () => {
    const s0 = alarmed(battle('orman-ork-kampi', pos, { extra, params: { hornReinforce: { maxTotal: 3, waveSize: 2, interval: 1 } } }));
    const r = rounds(s0, 2, 8);
    expect(raised(r.events).map((c) => c.id)).toEqual(['takviye-1', 'takviye-2', 'takviye-3']);
  });
  it('nöbetçi boynuzdan önce düşerse hiç takviye gelmez', () => {
    const r = rounds(alarmed(battle('orman-ork-kampi', pos, { extra }), 0), 2, 8);
    expect(r.state.map?.hornRound).toBeUndefined();
    expect(raised(r.events)).toEqual([]);
  });
  it('Game Master kapatınca ve eski kayıtta (kural sürümü 3) eski tek seferlik davranış', () => {
    for (const s of [battle('orman-ork-kampi', pos, { extra, toggles: { hornReinforce: false } }), battle('orman-ork-kampi', pos, { extra, v: 3 })]) {
      const r = rounds(alarmed(s), 2, 8);
      expect(r.events.filter((e) => e.type === 'group_alarmed')).toHaveLength(1);
      expect(r.state.map?.hornRound).toBeUndefined();
      expect(raised(r.events)).toEqual([]);
    }
  });
});

describe('Kuyruk 24b: Heykel Gölü mağara keşif bayrağı', () => {
  const FLAG = 'heykel-magarasi-kesfedildi';
  /** Geçidi açar (göz çözülür), sonra A'yı geçidin önüne koyar. */
  function opened(opt: Opt = {}): BattleState {
    const s0 = battle('orman-heykel-golu', { A: o(21, 4), B: o(2, 9) }, opt);
    const r = use(s0, 'heykelGozu', 'solve');
    const s = r.ok ? (r as { state: BattleState }).state
      : { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: (s0.map?.tiles ?? []).map((l, row) => (row === 6 || row === 7 ? l.slice(0, 28) + '.' + l.slice(29) : l)) } };
    return { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), pos: o(27, 7), movementUsed: 0 } } };
  }
  it('geçide ilk giren parti üyesi olayı bir kez üretir; bayrak sonuçta; replay aynı', () => {
    const s0 = opened();
    const r1 = run(s0, { type: 'move', actorId: 'A', to: o(28, 7) });
    expect(r1.events.filter((e) => e.type === 'map_note' && e.flag === FLAG)).toHaveLength(1);
    expect(r1.state.flags).toEqual([FLAG]);
    const r2 = run(r1.state, { type: 'move', actorId: 'A', to: o(28, 6) });
    expect(r2.events.some((e) => e.type === 'map_note' && e.flag === FLAG)).toBe(false);
    expect(r2.state.flags).toEqual([FLAG]);
    replays(s0, r1, r2);
  });
  it('Game Master mekaniği kapattıysa ve eski kayıtta (kural sürümü 3) üretilmez', () => {
    for (const opt of [{ toggles: { waterfall: false } }, { v: 3 }]) {
      const r = run(opened(opt), { type: 'move', actorId: 'A', to: o(28, 7) });
      expect(r.state.flags).toBeUndefined();
    }
  });
});
