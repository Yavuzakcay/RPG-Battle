/**
 * Görev H: Incapacitated, Stunned ve Paralyzed (SRD 5.2.1 Rules Glossary).
 * - Incapacitated: eylem, bonus eylem ve tepki yok; konsantrasyon kesilir. Hızı düşürmez (yürüyebilir).
 * - Stunned: Incapacitated + STR/DEX save otomatik başarısız + ona saldırılar avantajlı.
 * - Paralyzed: Incapacitated + hız 0 + STR/DEX save otomatik başarısız + ona saldırılar avantajlı + 5 ft içinden
 *   isabet kritik.
 */
import { describe, it, expect } from 'vitest';
import { execute, replay, speedHexes, startBattle } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import { chooseCommand } from './ai';
import { canReact } from './reactions';
import { opportunityAttacks } from './features';
import { GM, P1, P2, envId, mk, scripted, sword } from './fixtures';
import type { Offset } from '../rules/hex';
import { isIncapacitated, speedZero } from '../rules/conditions';
import { statusIcons } from '../ui/damageFloats';

const o = (col: number, row: number): Offset => ({ col, row });
const OPEN = Array.from({ length: 7 }, () => '.'.repeat(15));
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const errorOf = (r: ReturnType<typeof execute>) => (r.ok ? '' : r.error);
const ofType = <T extends BattleEvent['type']>(events: BattleEvent[], t: T) => events.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === t);
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 30 }, () => [20, 10] as [number, number]));
const bow: AttackOption = { ...sword, label: 'Longbow', ranged: true, range: [150, 600] };
const glaive: AttackOption = { ...sword, label: 'Glaive', reachFt: 10 };

/** Haritasız savaş; sıra listedeki sırayla. A (p1), B (düşman), C (p2). */
function arena(a: Partial<Combatant> = {}, b: Partial<Combatant> = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [sword, bow], ...a }),
    mk('B', { side: 'enemies', ac: 5, hp: 60, maxHp: 60, ...b }),
    mk('C', { ownerId: 'p2', weaponOptions: [sword] }),
  ];
  return startBattle('h', envId('Düz'), parts, scripted([20, 20], [20, 19], [20, 18])).state;
}
/** Açık haritada savaş (A, B, C altıgenlerde). */
function field(pos: Record<string, Offset>, a: Partial<Combatant> = {}, b: Partial<Combatant> = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [sword, bow, glaive], ...a }),
    mk('B', { side: 'enemies', ac: 5, hp: 60, maxHp: 60, ...b }),
    mk('C', { ownerId: 'p2', weaponOptions: [sword] }),
  ];
  const { state } = startBattle('h', 'd-z-zemin', parts, scripted([20, 20], [20, 19], [20, 18]), { map: { id: 'volkan' } });
  const combatants = { ...state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...state, status: 'active', turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: OPEN } };
}
const setCond = (s: BattleState, id: string, condition: string, present = true) =>
  ok(execute(s, { type: 'set_condition', targetId: id, condition, present }, GM, scripted())).state;
const attack = (s: BattleState, option: AttackOption, rng = pad([20, 12], [20, 12])) =>
  execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option }, P1, rng);
const firstAttack = (r: ReturnType<typeof execute>) => ofType(ok(r).events, 'attack_resolved')[0] as Extract<BattleEvent, { type: 'attack_resolved' }>;

describe('durum tanımları (rules/conditions)', () => {
  it('Incapacitated, Stunned, Paralyzed (ve Unconscious, Petrified) etkisiz bırakır; hız 0 yalnızca Paralyzed, Petrified, Unconscious, Grappled, Restrained', () => {
    for (const c of ['Incapacitated', 'Stunned', 'Paralyzed', 'Unconscious', 'Petrified']) expect(isIncapacitated([c])).toBe(true);
    expect(speedZero(['Stunned'])).toBe(false);
    expect(speedZero(['Incapacitated'])).toBe(false);
    for (const c of ['Paralyzed', 'Petrified', 'Unconscious', 'Grappled', 'Restrained']) expect(speedZero([c])).toBe(true);
  });
});

describe('Incapacitated', () => {
  it('eylem, bonus eylem yok; tepki yok; yürüyebilir (hızı düşmez); turunu bitirebilir', () => {
    const s = setCond(arena(), 'A', 'Incapacitated');
    expect(errorOf(attack(s, sword))).toContain('Aksiyon yapamaz');
    expect(errorOf(execute(s, { type: 'dash', actorId: 'A' }, P1, scripted()))).toContain('Aksiyon yapamaz');
    expect(errorOf(execute(s, { type: 'disengage', actorId: 'A' }, P1, scripted()))).toContain('Aksiyon yapamaz');
    expect(canReact(s.combatants.A)).toBe(false);
    expect(speedHexes(s.combatants.A as Combatant)).toBe(6);
    // Haritasız savaşta hareket: yükseklik değiştirme.
    expect(ok(execute(s, { type: 'change_height', actorId: 'A', toHeight: -1 }, P1, pad())).state.combatants.A?.height).toBe(-1);
    expect(ok(execute(s, { type: 'end_turn', actorId: 'A' }, P1, scripted())).state.turnIndex).toBe(1);
  });
  it('konsantrasyon kesilir (Bless biter) ve çağrılan yaratık kaybolur', () => {
    const conc = { spell: 'Bless', slotLevel: 1, round: 1 } as unknown as NonNullable<Combatant['concentration']>;
    const s = setCond(arena({ concentration: conc }), 'A', 'Incapacitated');
    expect(s.combatants.A?.concentration).toBeNull();
  });
  it('kendi başına saldırılara avantaj vermez; STR/DEX save otomatik başarısız değil', () => {
    const s = setCond(arena(), 'B', 'Incapacitated');
    expect(firstAttack(attack(s, sword)).mode).toBe('normal');
    const sh = ok(execute(s, { type: 'shove', actorId: 'A', targetId: 'B', effect: 'prone' }, P1, pad([20, 19])));
    expect(ofType(sh.events, 'shove_resolved')[0]?.d20.length).toBe(1);
  });
  it('yapay zekâ etkisiz yaratıkta turunu bitirir; tepki istenmez (fırsat saldırısı yok)', () => {
    let s = arena({}, { weaponOptions: [sword] });
    s = setCond(s, 'B', 'Incapacitated');
    s = ok(execute(s, { type: 'end_turn', actorId: 'A' }, P1, scripted())).state;
    expect(chooseCommand(s)).toEqual({ type: 'end_turn', actorId: 'B' });
    const f = field({ A: o(3, 3), B: o(4, 3), C: o(1, 1) }, {}, { weaponOptions: [sword] });
    expect(opportunityAttacks(setCond(f, 'B', 'Incapacitated'), 'A', { from: o(3, 3), to: o(2, 3) }, pad())).toEqual([]);
    expect(opportunityAttacks(f, 'A', { from: o(3, 3), to: o(2, 3) }, pad()).length).toBeGreaterThan(0);
  });
});

describe('Stunned', () => {
  it('Incapacitated: eylem ve tepki yok; yürüyebilir', () => {
    const s = setCond(field({ A: o(3, 3), B: o(8, 3), C: o(1, 1) }), 'A', 'Stunned');
    expect(errorOf(attack(s, bow))).toContain('Aksiyon yapamaz');
    expect(canReact(s.combatants.A)).toBe(false);
    expect(ok(execute(s, { type: 'move', actorId: 'A', to: o(4, 3) }, P1, pad())).state.combatants.A?.pos).toEqual(o(4, 3));
  });
  it('ona saldırılar avantajlı; STR/DEX save otomatik başarısız (zar atılmaz, elle zar istenmez); CON save atılır', () => {
    const s = setCond(arena(), 'B', 'Stunned');
    const r = firstAttack(attack(s, sword));
    expect(r.mode).toBe('advantage');
    expect(r.reasons).toContain('Hedef Stunned');
    const sh = ok(execute(s, { type: 'shove', actorId: 'A', targetId: 'B', effect: 'prone' }, P1, scripted()));
    expect(ofType(sh.events, 'shove_resolved')[0]).toMatchObject({ success: false, d20: [], natural: null });
    expect(sh.state.combatants.B?.conditions).toContain('Prone');
  });
  it('5 ft içinden isabet kritik değil (yalnızca Paralyzed ve Unconscious)', () => {
    const s = setCond(arena(), 'B', 'Stunned');
    expect(firstAttack(attack(s, sword, pad([20, 12], [20, 12], [8, 3]))).critical).toBe(false);
  });
});

describe('Paralyzed', () => {
  it('hız 0: yürüyemez, kalkamaz, yükseklik değiştiremez; eylem yok', () => {
    const f = setCond(field({ A: o(3, 3), B: o(8, 3), C: o(1, 1) }), 'A', 'Paralyzed');
    expect(speedHexes(f.combatants.A as Combatant)).toBe(0);
    expect(errorOf(execute(f, { type: 'move', actorId: 'A', to: o(4, 3) }, P1, pad()))).toContain('hızı 0');
    expect(errorOf(attack(f, bow))).toContain('Aksiyon yapamaz');
    const s = setCond(arena(), 'A', 'Paralyzed');
    expect(errorOf(execute(s, { type: 'change_height', actorId: 'A', toHeight: -1 }, P1, pad()))).toContain('hızı 0');
    const prone = setCond(s, 'A', 'Prone');
    expect(errorOf(execute(prone, { type: 'stand_up', actorId: 'A' }, P1, pad()))).toContain('hızı 0');
  });
  it('ona saldırılar avantajlı, STR/DEX save otomatik başarısız', () => {
    const s = setCond(arena(), 'B', 'Paralyzed');
    expect(firstAttack(attack(s, sword)).mode).toBe('advantage');
    const sh = ok(execute(s, { type: 'shove', actorId: 'A', targetId: 'B', effect: 'prone' }, P1, scripted()));
    expect(ofType(sh.events, 'shove_resolved')[0]).toMatchObject({ success: false, d20: [] });
  });
  it('5 ft içinden isabet kritik: bitişikten yakın dövüş ve menzilli; 10 ft erişimden ve uzaktan değil', () => {
    const adj = setCond(field({ A: o(3, 3), B: o(4, 3), C: o(1, 1) }), 'B', 'Paralyzed');
    expect(firstAttack(attack(adj, sword)).critical).toBe(true);
    expect(firstAttack(attack(adj, bow)).critical).toBe(true);
    const far = setCond(field({ A: o(3, 3), B: o(5, 3), C: o(1, 1) }), 'B', 'Paralyzed');
    const reach = firstAttack(attack(far, glaive));
    expect(reach.hit).toBe(true);
    expect(reach.critical).toBe(false);
    expect(firstAttack(attack(far, bow)).critical).toBe(false);
    // Haritasız savaş: yakın dövüş saldırısı 5 ft içinde sayılır.
    expect(firstAttack(attack(setCond(arena(), 'B', 'Paralyzed'), sword)).critical).toBe(true);
  });
});

describe('süre ve birleşimler', () => {
  it('Stunning Strike: sahibinin sonraki turunun başına dek; süre dolunca kalkar ve eylem geri gelir', () => {
    const timer = { condition: 'Stunned', ownerId: 'A', end: 'turnStart' as const, count: 1, label: 'Stunning Strike' };
    let s = arena();
    s = { ...s, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), conditions: ['Stunned'], conditionTimers: [timer] } } };
    s = ok(execute(s, { type: 'end_turn', actorId: 'A' }, P1, scripted())).state;
    expect(s.combatants.B?.conditions).toContain('Stunned');
    s = ok(execute(s, { type: 'end_turn', actorId: 'B' }, GM, scripted())).state;
    s = ok(execute(s, { type: 'end_turn', actorId: 'C' }, P2, scripted())).state;
    expect(s.combatants.B?.conditions).not.toContain('Stunned');
  });
  it('kurtarma zarıyla çıkış (Hold Person): her tur sonu WIS save, başarıda Paralyzed biter; Paralyzed + Prone birlikte', () => {
    const caster = { spellNames: ['Hold Person'], spellSlots: [0, 2, 0, 0, 0, 0, 0, 0, 0], spellSaveDc: 14, spellMod: 3 };
    let s = arena(caster, { conditions: ['Prone'] });
    s = ok(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B' }, P1, pad([20, 2]))).state;
    expect(s.combatants.B?.conditions).toEqual(expect.arrayContaining(['Prone', 'Paralyzed']));
    s = ok(execute(s, { type: 'end_turn', actorId: 'A' }, P1, scripted())).state;
    const pass = ok(execute(s, { type: 'end_turn', actorId: 'B' }, GM, pad([20, 19])));
    expect(ofType(pass.events, 'condition_ended')[0]).toMatchObject({ condition: 'Paralyzed', reason: 'kurtarma zarı başarılı' });
    expect(pass.state.combatants.B?.conditions).toEqual(['Prone']);
  });
  it('Stunned + Paralyzed: tek rozet (Paralyzed); hız 0; durum kalkınca rozet de kalkar', () => {
    const s = setCond(setCond(arena(), 'B', 'Stunned'), 'B', 'Paralyzed');
    expect(statusIcons(s.combatants.B as Combatant).map((x) => x.key)).toEqual(['paralyzed']);
    expect(speedHexes(s.combatants.B as Combatant)).toBe(0);
    const t = setCond(s, 'B', 'Paralyzed', false);
    expect(statusIcons(t.combatants.B as Combatant).map((x) => x.key)).toEqual(['stunned']);
    expect(speedHexes(t.combatants.B as Combatant)).toBe(6);
    expect(statusIcons(setCond(t, 'B', 'Stunned', false).combatants.B as Combatant)).toEqual([]);
  });
  it('replay: olaylar baştan oynatılınca aynı durum', () => {
    const start = arena();
    const events: BattleEvent[] = [{ type: 'battle_started', state: start }];
    let s = start;
    const steps: Array<[Command, CommandContext]> = [
      [{ type: 'set_condition', targetId: 'B', condition: 'Paralyzed', present: true }, GM],
      [{ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1],
      [{ type: 'set_condition', targetId: 'A', condition: 'Stunned', present: true }, GM],
      [{ type: 'end_turn', actorId: 'A' }, P1],
    ];
    for (const [cmd, ctx] of steps) { const r = ok(execute(s, cmd, ctx, pad([20, 14], [20, 14]))); s = r.state; events.push(...r.events); }
    expect(replay(events)).toEqual(s);
  });
});

describe('inisiyatif (Kuyruk 17 H: SRD 5.2.1 Incapacitated "Surprised")', () => {
  it('inisiyatif atılırken Incapacitated/Stunned/Paralyzed olan dezavantajlı atar; durumsuz yaratık tek zar', () => {
    for (const cond of ['Incapacitated', 'Stunned', 'Paralyzed']) {
      const { state } = startBattle('i', 'd-z-zemin', [mk('A', { ownerId: 'p1', conditions: [cond] }), mk('B', { side: 'enemies' })], scripted([20, 18], [20, 3], [20, 11]));
      expect(state.combatants.A?.initiative, cond).toBe(3 + (state.combatants.A?.initiativeBonus ?? 0));
      expect(state.combatants.B?.initiative).toBe(11 + (state.combatants.B?.initiativeBonus ?? 0));
    }
  });
});

