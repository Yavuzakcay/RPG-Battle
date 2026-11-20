/**
 * Görev SWARM95 (kural sürümü 95; SRD 5.2.1 Swarm: "The swarm can occupy another creature's space and vice versa, and
 * the swarm can move through any opening large enough for a Tiny …"). Gaseous Form `shareSpace`/`squeeze` altyapısı;
 * 94 ve altı eski davranış (red); Wild Shape biçimi aynı kural; replay; yapay zekâ.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk, sword } from './fixtures';
import { chooseCommand } from './ai';
import { occupantsAt } from './movement';
import { SWARM95_VERSION, swarm95On } from './swarm95Surum';
import { isSwarm } from './swarmShare';
import { CURRENT_RULES } from './ruleVersion';
import { seededRng, type Rng } from '../rules/dice';
import { getMonster } from '../data';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const NEW = SWARM95_VERSION;
const OLD = SWARM95_VERSION - 1;
const MID: Rng = () => 0.5;
const o = (col: number, row: number): Offset => ({ col, row });
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const replays = (s0: BattleState, evs: BattleEvent[], after: BattleState) => expect(replay([{ type: 'battle_started', state: s0 }, ...evs])).toEqual(after);
afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

const OPEN = Array.from({ length: 7 }, () => '.'.repeat(15));
/** 5. sütun duvar; (5,3) kapalı kapının altıgeni. */
const WALLED = OPEN.map((row, r) => (r === 3 ? row : `${row.slice(0, 5)}s${row.slice(6)}`));

/** Düşman sürü S, parti A (ve isteğe bağlı başkaları); sıra `first`te. */
function arena(v: number, pos: Record<string, Offset>, first: string, opts: { form?: string; extra?: Combatant[]; tiles?: string[] } = {}): BattleState {
  const sw = { ...combatantFromMonster(getMonster(opts.form ?? 'swarm-of-rats'), { id: 'S', kuralSurumu: v }), side: 'enemies' as const };
  const s0 = startBattle('swarm95', 'd', [sw, mk('A', { ownerId: 'p1', hp: 30, maxHp: 30 }), ...(opts.extra ?? [])], MID, { kuralSurumu: v, map: { id: 'col' } } as never).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, turnIndex: s0.order.indexOf(first),
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: opts.tiles ?? OPEN }, combatants };
}
const move = (s: BattleState, id: string, to: Offset) => execute(s, { type: 'move', actorId: id, to }, id === 'A' ? P1 : GM, MID);

describe('SWARM95: sabit ve kurulum', () => {
  it('sürüm 95; sürü etkisi 95+ shareSpace/squeeze/swarm taşır, 94 taşımaz', () => {
    expect(SWARM95_VERSION).toBe(95);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(SWARM95_VERSION);
    expect(swarm95On({ kuralSurumu: 95 })).toBe(true);
    expect(swarm95On({ kuralSurumu: 94 })).toBe(false);
    const fx = (v: number) => arena(v, { S: o(3, 3), A: o(8, 3) }, 'S').combatants.S?.effects?.find((e) => e.passCreatures && e.noHeal);
    expect(fx(NEW)).toMatchObject({ swarm: true, shareSpace: true, squeeze: true });
    expect(fx(OLD)?.swarm).toBeUndefined();
    expect(fx(OLD)?.shareSpace).toBeUndefined();
  });
});

describe('SWARM95: altıgen paylaşımı (SRD Swarm)', () => {
  it('sürü başka yaratığın altıgenine girer, orada durur ve çıkar; 94 red', () => {
    const s0 = arena(NEW, { S: o(3, 3), A: o(5, 3) }, 'S');
    const r = ok(move(s0, 'S', o(5, 3)));
    expect(r.state.combatants.S?.pos).toEqual(o(5, 3));
    expect(occupantsAt(r.state, o(5, 3)).map((c) => c.id).sort()).toEqual(['A', 'S']);
    const out = ok(move(r.state, 'S', o(6, 3)));
    expect(out.state.combatants.S?.pos).toEqual(o(6, 3));
    replays(s0, [...r.events, ...out.events], out.state);
    const old = move(arena(OLD, { S: o(3, 3), A: o(5, 3) }, 'S'), 'S', o(5, 3));
    expect(old.ok).toBe(false);
    if (!old.ok) expect(old.error).toMatch(/dolu/);
  });

  it('vice versa: başkası sürünün altıgenine girip durur; 94 red', () => {
    const s0 = arena(NEW, { S: o(5, 3), A: o(3, 3) }, 'A');
    const r = ok(move(s0, 'A', o(5, 3)));
    expect(r.state.combatants.A?.pos).toEqual(o(5, 3));
    replays(s0, r.events, r.state);
    expect(move(arena(OLD, { S: o(5, 3), A: o(3, 3) }, 'A'), 'A', o(5, 3)).ok).toBe(false);
  });

  it('sürü olmayan yaratık işgal edemez; sürü + başkası olan altıgende de duramaz', () => {
    const t = mk('T', { side: 'enemies' });
    const plain = arena(NEW, { S: o(10, 0), A: o(3, 3), T: o(5, 3) }, 'A', { extra: [t] });
    const r1 = move(plain, 'A', o(5, 3));
    expect(r1.ok).toBe(false);
    const mixed = arena(NEW, { S: o(5, 3), A: o(3, 3), T: o(5, 3) }, 'A', { extra: [t] });
    const r2 = move(mixed, 'A', o(5, 3));
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error).toMatch(/dolu/);
  });

  it('sürüyle paylaşılan altıgendeki düşman yolu yine keser (sürünün içinden geçilir, onun değil)', () => {
    // A (3,3) → (7,3): (5,3)'te sürü + düşman T; düz yol T yüzünden yok, A dolaşır (yol 4'ten uzun).
    const t = mk('T', { side: 'enemies' });
    const s = arena(NEW, { S: o(5, 3), A: o(3, 3), T: o(5, 3) }, 'A', { extra: [t] });
    const r = ok(move(s, 'A', o(7, 3)));
    const ev = r.events.find((e) => e.type === 'moved') as Extract<BattleEvent, { type: 'moved' }>;
    expect(ev.path.some((h) => h.col === 5 && h.row === 3)).toBe(false);
  });

  it('işgal edilen altıgendeki yaratık hedeflenebilir; sürü de', () => {
    const s0 = arena(NEW, { S: o(3, 3), A: o(5, 3) }, 'S');
    const shared = ok(move(s0, 'S', o(5, 3))).state;
    const i = (shared.combatants.S as Combatant).attacks.findIndex((x) => !x.save);
    const hit = execute(shared, { type: 'monster_attack', actorId: 'S', targetId: 'A', attackIndex: i } as Command, GM, MID);
    expect(hit.ok).toBe(true);
    const aTurn = { ...shared, turnIndex: shared.order.indexOf('A') };
    const back = execute(aTurn, { type: 'attack', actorId: 'A', targetId: 'S', option: sword } as Command, P1, MID);
    expect(back.ok).toBe(true);
  });
});

describe('SWARM95: Tiny açıklık (kapı aralığı)', () => {
  const door = (s: BattleState) => ok(execute(s, { type: 'place_object', kind: 'door', at: o(5, 3) }, GM, MID)).state;
  it('sürü kapalı kapının aralığından geçer; 94 ve sürü olmayan geçemez', () => {
    const s = door(arena(NEW, { S: o(3, 3), A: o(10, 0) }, 'S', { tiles: WALLED }));
    const r = ok(move(s, 'S', o(7, 3)));
    expect(r.state.combatants.S?.pos).toEqual(o(7, 3));
    replays(s, r.events, r.state);
    expect(move(door(arena(OLD, { S: o(3, 3), A: o(10, 0) }, 'S', { tiles: WALLED })), 'S', o(7, 3)).ok).toBe(false);
    expect(move(door(arena(NEW, { S: o(10, 0), A: o(3, 3) }, 'A', { tiles: WALLED })), 'A', o(7, 3)).ok).toBe(false);
  });
});

describe('SWARM95: Wild Shape sürü biçimi (Druid)', () => {
  const sheet = () => ({ ...blankCharacter('d').sheet, name: 'Ayla', classId: 'druid', subclassId: 'circle-of-the-land', level: 8, baseScores: suggestedScores('druid'), wildShapeForms: ['swarm-of-rats', 'wolf'] });
  function druid(v: number, form: string) {
    const d = combatantFromSheet(sheet() as never, { id: 'A', ownerId: 'p1' });
    const s0 = startBattle('swarm95w', 'd', [d, mk('T', { side: 'enemies', hp: 80, maxHp: 80 })], MID, { kuralSurumu: v, map: { id: 'col' } } as never).state;
    const s = { ...s0, kuralSurumu: v, status: 'active' as const, round: 1, turnIndex: s0.order.indexOf('A'), map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: OPEN },
      combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: o(3, 3) }, T: { ...(s0.combatants.T as Combatant), pos: o(5, 3) } } };
    const r = ok(execute(s, { type: 'wild_shape', actorId: 'A', form } as Command, P1, MID));
    return { s, r };
  }
  it('sürü biçimindeki Druid düşmanın altıgeninde durur (95); 94 red; kurt biçimi duramaz; replay', () => {
    const { s, r } = druid(NEW, 'swarm-of-rats');
    expect(isSwarm(r.state.combatants.A as Combatant)).toBe(true);
    // WS92 kullanıcı kararı: biçim Wild Shape geçici HP'sini korur.
    expect((r.state.combatants.A as Combatant).tempHp ?? 0).toBeGreaterThan(0);
    const m = ok(move(r.state, 'A', o(5, 3)));
    expect(m.state.combatants.A?.pos).toEqual(o(5, 3));
    replays(s, [...r.events, ...m.events], m.state);
    const old = druid(OLD, 'swarm-of-rats');
    expect(isSwarm(old.r.state.combatants.A as Combatant)).toBe(false);
    expect(move(old.r.state, 'A', o(5, 3)).ok).toBe(false);
    const wolf = druid(NEW, 'wolf');
    expect(move(wolf.r.state, 'A', o(5, 3)).ok).toBe(false);
  });
});

describe('SWARM95: yapay zekâ', () => {
  it('sürü ve parti yapay zekâsı hatasız oynar; hiçbir altıgende sürü olmayan iki yaratık yok', () => {
    for (const form of ['swarm-of-rats', 'swarm-of-bats']) {
      let s = arena(NEW, { S: o(2, 3), A: o(10, 3) }, 'S', { form, extra: [mk('B', { ownerId: 'p1', pos: null })] });
      s = { ...s, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), pos: o(11, 4) } } };
      const rng = seededRng(7);
      for (let i = 0; i < 60 && s.status === 'active'; i++) {
        const cmd = chooseCommand(s);
        const who = 'actorId' in cmd ? s.combatants[cmd.actorId] : undefined;
        const r = execute(s, cmd, who?.side === 'party' ? P1 : GM, rng);
        if (!r.ok) throw new Error(`${form} ${cmd.type}: ${r.error}`);
        s = r.state;
        const byHex = new Map<string, Combatant[]>();
        for (const c of Object.values(s.combatants)) if (c.pos && c.hp > 0) byHex.set(`${c.pos.col},${c.pos.row}`, [...(byHex.get(`${c.pos.col},${c.pos.row}`) ?? []), c]);
        for (const list of byHex.values()) expect(list.filter((c) => !isSwarm(c)).length).toBeLessThanOrEqual(1);
      }
    }
  });
});
