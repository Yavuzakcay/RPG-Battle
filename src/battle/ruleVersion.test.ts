/**
 * Kuyruk 16 K16E: kural sürümü ve SRD 5.2.1 durum düzeltmeleri. Prone (saldırı mesafeyle), Frightened (yalnızca korku
 * kaynağı görüş hattındayken; yetenek kontrollerinde de; kaynağa isteyerek yaklaşamaz), Invisible (inisiyatifte avantaj).
 * Sürüm 1 (eski kayıt) eski kurallarla aynı; replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant } from './index';
import { GM, P1, mk, scripted, sword } from './fixtures';
import { CURRENT_RULES, fearSources, frightenedNow, ruleVersion } from './ruleVersion';
import type { Offset } from '../rules/hex';

const o = (col: number, row: number): Offset => ({ col, row });
const OPEN = Array.from({ length: 7 }, () => '.'.repeat(15));
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 30 }, () => [20, 10] as [number, number]));
const bow: AttackOption = { ...sword, label: 'Longbow', ranged: true, range: [150, 600] };
const glaive: AttackOption = { ...sword, label: 'Glaive', reachFt: 10 };

function field(pos: Record<string, Offset>, opts: { a?: Partial<Combatant>; b?: Partial<Combatant>; rules?: number; tiles?: string[] } = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [sword, bow, glaive], ...opts.a }),
    mk('B', { side: 'enemies', ac: 5, hp: 60, maxHp: 60, ...opts.b }),
  ];
  const { state } = startBattle('k16e', 'd-z-zemin', parts, scripted([20, 20], [20, 19]), { map: { id: 'volkan' }, ...(opts.rules ? { kuralSurumu: opts.rules } : {}) });
  const combatants = { ...state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...state, status: 'active', turnIndex: state.order.indexOf('A'), combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: opts.tiles ?? OPEN } };
}
const attackMode = (s: BattleState, option: AttackOption) => {
  const r = ok(execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option }, P1, pad([20, 12], [20, 12])));
  return (r.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>).mode;
};
/** B'nin A'yı korkuttuğu durum (süreli durum sayacının kaynağı B). */
const scared = (s: BattleState): BattleState => {
  const a = s.combatants.A as Combatant;
  return { ...s, combatants: { ...s.combatants, A: { ...a, conditions: [...a.conditions, 'Frightened'], conditionTimers: [{ condition: 'Frightened', ownerId: 'A', end: 'turnEnd', count: 3, label: 'Korku', sourceId: 'B' }] } } };
};

describe('kural sürümü', () => {
  it('yeni savaş güncel sürümle başlar (başlangıç durumunda kuralSurumu); alanı olmayan eski kayıt 1', () => {
    expect(CURRENT_RULES).toBe(2);
    const s = field({ A: o(3, 3), B: o(4, 3) });
    expect(s.kuralSurumu).toBe(2);
    const old = field({ A: o(3, 3), B: o(4, 3) }, { rules: 1 });
    expect(old.kuralSurumu).toBeUndefined();
    expect(ruleVersion(old)).toBe(1);
  });
});

describe('Prone (SRD 5.2.1: 5 ft içinden avantaj, değilse dezavantaj)', () => {
  const prone = { b: { conditions: ['Prone'] } };
  it('sürüm 2: 10 ft erişimden yakın dövüş dezavantajlı, bitişikten menzilli avantajlı', () => {
    expect(attackMode(field({ A: o(3, 3), B: o(5, 3) }, prone), glaive)).toBe('disadvantage');
    expect(attackMode(field({ A: o(3, 3), B: o(4, 3) }, prone), sword)).toBe('advantage');
    // Bitişikten menzilli: Prone avantajı ile yakın düşman dezavantajı birbirini götürür.
    expect(attackMode(field({ A: o(3, 3), B: o(4, 3) }, prone), bow)).toBe('normal');
    expect(attackMode(field({ A: o(1, 3), B: o(9, 3) }, prone), bow)).toBe('disadvantage');
  });
  it('sürüm 1: eski kural (yakın dövüş avantaj, menzilli dezavantaj)', () => {
    expect(attackMode(field({ A: o(3, 3), B: o(5, 3) }, { ...prone, rules: 1 }), glaive)).toBe('advantage');
  });
});

describe('Frightened (yalnızca kaynak görüş hattındayken)', () => {
  // A ile B arasında duvar.
  const WALL = OPEN.map((r, i) => (i >= 1 && i <= 5 ? `${r.slice(0, 6)}s${r.slice(7)}` : r));
  it('kaynak görünürken saldırıda dezavantaj; duvar arkasındayken yok; kaynak bilinmiyorsa eski gibi hep', () => {
    const seen = scared(field({ A: o(3, 3), B: o(9, 3) }));
    expect(fearSources(seen, seen.combatants.A as Combatant).map((c) => c.id)).toEqual(['B']);
    expect(frightenedNow(seen, seen.combatants.A as Combatant)).toBe(true);
    expect(attackMode(seen, bow)).toBe('disadvantage');
    const hidden = scared(field({ A: o(3, 3), B: o(9, 3) }, { tiles: WALL }));
    expect(frightenedNow(hidden, hidden.combatants.A as Combatant)).toBe(false);
    const unknown = field({ A: o(3, 3), B: o(9, 3) }, { a: { conditions: ['Frightened'] }, tiles: WALL });
    expect(frightenedNow(unknown, unknown.combatants.A as Combatant)).toBe(true);
    // Sürüm 1: kaynak duvar arkasında olsa da dezavantaj.
    const old = scared(field({ A: o(3, 3), B: o(9, 3) }, { rules: 1, tiles: WALL }));
    expect(frightenedNow(old, old.combatants.A as Combatant)).toBe(true);
  });
  it('yetenek kontrolünde dezavantaj (Game Master kontrolü; kaynak görünürken)', () => {
    const s = scared(field({ A: o(3, 3), B: o(9, 3) }));
    const r = ok(execute(s, { type: 'skill_check', actorId: 'A', skill: 'athletics', dc: 10 }, GM, pad([20, 15], [20, 4])));
    const ev = r.events.find((e) => e.type === 'skill_checked') as { mode?: string } | undefined;
    expect(ev?.mode).toBe('disadvantage');
  });
  it('kaynağa isteyerek yaklaşamaz (yürüyüş reddedilir; uzaklaşmak serbest); sürüm 1 serbest', () => {
    const s = scared(field({ A: o(3, 3), B: o(9, 3) }));
    expect(execute(s, { type: 'move', actorId: 'A', to: o(5, 3) }, P1, pad()).ok).toBe(false);
    expect(execute(s, { type: 'move', actorId: 'A', to: o(1, 3) }, P1, pad()).ok).toBe(true);
    const old = scared(field({ A: o(3, 3), B: o(9, 3) }, { rules: 1 }));
    expect(execute(old, { type: 'move', actorId: 'A', to: o(5, 3) }, P1, pad()).ok).toBe(true);
  });
});

describe('Invisible (inisiyatifte avantaj)', () => {
  it('sürüm 2: inisiyatif atılırken Invisible olan avantajlı; sürüm 1 tek zar', () => {
    const parts = () => [mk('A', { ownerId: 'p1', conditions: ['Invisible'] }), mk('B', { side: 'enemies' })];
    const v2 = startBattle('i', 'd-z-zemin', parts(), scripted([20, 3], [20, 18], [20, 11])).state;
    expect(v2.combatants.A?.initiative).toBe(18 + (v2.combatants.A?.initiativeBonus ?? 0));
    const v1 = startBattle('i', 'd-z-zemin', parts(), scripted([20, 3], [20, 11]), { kuralSurumu: 1 }).state;
    expect(v1.combatants.A?.initiative).toBe(3 + (v1.combatants.A?.initiativeBonus ?? 0));
  });
  it('replay: sürüm 2 savaşı baştan oynatılınca aynı durum', () => {
    const s = field({ A: o(3, 3), B: o(5, 3) }, { b: { conditions: ['Prone'] } });
    const r = ok(execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: glaive }, P1, pad([20, 12], [20, 12])));
    expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
  });
});
