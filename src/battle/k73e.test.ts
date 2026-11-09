/**
 * Kuyruk K73e (kural sürümü 65): YZ kazma (yaklaşma, kaçış, çıkış; duvar/taşta aday yok; tremorsense hedefleme) ve dalış
 * (kaçınma, yaklaşma, nefes sınırının yarısında çıkış, boğulma 0). 64'te eski karar; derin su/kazıcı yoksa 64 = 65.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mk, P1 } from './fixtures';
import { execute, startBattle } from './index';
import { replay } from './reduce';
import { chooseCommand } from './ai';
import { setDefaultRuleVersion } from './create';
import { CURRENT_RULES } from './ruleVersion';
import type { Offset } from '../rules/hex';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
const open = (ch = '.') => Array.from({ length: 7 }, () => ch.repeat(15));
const lake = () => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c >= 7 ? 'w' : '.')).join(''));
function field(parts: Combatant[], pos: Record<string, [Offset, number?]>, ver = 65, tiles = open(), turn?: string): BattleState {
  const s = startBattle('k73e', 'l-kavurucu-s-cak', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, [p, alt]] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}), ...(alt && alt < 0 && (combatants[id] as Combatant).burrowFt ? { burrowed: true as const } : {}) };
  const order = parts.map((c) => c.id);
  return { ...s, status: 'active', order, turnIndex: turn ? order.indexOf(turn) : 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles, objects: [] } };
}
const BITE = [{ name: 'Bite', bonus: 5, damageDice: '1d6', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' }] as never;
const bow: AttackOption = { label: 'Longbow', attackBonus: 6, damage: '1d8+3', damageType: 'piercing', ranged: true, spell: false, range: [150, 600], tag: 'longbow' };
const mace: AttackOption = { label: 'Mace', attackBonus: 5, damage: '1d6+3', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'mace' };
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', speed: 30, weaponOptions: [mace], hp: 30, maxHp: 30, ...p });
const DIG = (p: Partial<Combatant> = {}) => mk('D', { side: 'enemies', speed: 30, burrowFt: 30, attacks: BITE, hp: 30, maxHp: 30, ...p });
const SHARK = (p: Partial<Combatant> = {}) => mk('S', { side: 'enemies', monsterId: 'reef-shark', speed: 30, attacks: BITE, hp: 30, maxHp: 30, ...p });
const of = (s: BattleState, id: string) => s.combatants[id] as Combatant;
const dig = { type: 'vertical_move', actorId: 'D', toFt: -5 };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('K73e YZ kazma', () => {
  it('(a) yaklaşma: kazma hızı yürümenin iki katından hızlıysa kazar; eşit hızda kazmaz; 64\'te ikisinde de kazmaz', () => {
    const fast = (ver: number) => field([A(), DIG({ speed: 10, burrowFt: 40 })], { A: [H(2)], D: [H(10)] }, ver, open(), 'D');
    expect(chooseCommand(fast(65))).toEqual(dig);
    expect(chooseCommand(fast(64))).not.toEqual(dig);
    expect(chooseCommand(field([A(), DIG()], { A: [H(2)], D: [H(10)] }, 65, open(), 'D'))).not.toEqual(dig);
  });
  it('(a) yürüme yolu yokken (64\'teki gibi) kazar', () => {
    const wall = Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c === 6 ? 's' : '.')).join(''));
    // Duvar sütunu kazılmaz: yer altından da geçilmez → kazmaz (aday üretilmez).
    expect(chooseCommand(field([A(), DIG()], { A: [H(3)], D: [H(8)] }, 65, wall, 'D'))).not.toEqual(dig);
  });
  it('(b) kaçış: canı yarının altında, bitişikte tehdit, kimse sezemiyor → kazar; tremorsense\'li düşman varsa kazmaz', () => {
    const low = (sense?: number) => field([A(sense ? { senses: { tremorsense: sense } } : {}), DIG({ hp: 10 })], { A: [H(3)], D: [H(4)] }, 65, open(), 'D');
    expect(chooseCommand(low())).toEqual(dig);
    expect(chooseCommand(low(30))).not.toEqual(dig);
    expect(chooseCommand(field([A(), DIG({ hp: 10 })], { A: [H(3)], D: [H(4)] }, 64, open(), 'D'))).not.toEqual(dig);
  });
  it('(b) taşta (kazılamaz) kaçış adayı yok', () => {
    expect(chooseCommand(field([A(), DIG({ hp: 10 })], { A: [H(3)], D: [H(4)] }, 65, open('t'), 'D'))).not.toEqual(dig);
  });
  it('(c) çıkış: yer altında düşmanın yanında yüzeye çıkar, sonra saldırır', () => {
    const s = field([A(), DIG()], { A: [H(3)], D: [H(4), -5] }, 65, open(), 'D');
    expect(chooseCommand(s)).toEqual({ type: 'vertical_move', actorId: 'D', toFt: 0 });
    const r = execute(s, { type: 'vertical_move', actorId: 'D', toFt: 0 }, { playerId: 'gm', isGm: true }, () => 0.5);
    expect(r.ok && chooseCommand(r.state)).toMatchObject({ type: 'monster_attack', actorId: 'D', targetId: 'A' });
  });
  it('tremorsense\'li YZ yer altındaki düşmanı hedefler', () => {
    const s = field([A({ senses: { tremorsense: 30 } }), DIG()], { A: [H(3)], D: [H(4), -5] }, 65, open(), 'A');
    expect(chooseCommand(s)).toMatchObject({ targetId: 'D' });
  });
});

describe('K73e YZ dalış', () => {
  it('(a) kaçınma: kıyıdaki okçu varken yüzme hızı olan dalar; 64\'te dalmaz; yüzme hızı olmayan dalmaz', () => {
    const s = (ver: number, c: Combatant) => field([A({ weaponOptions: [bow] }), c], { A: [H(3)], [c.id]: [H(10)] }, ver, lake(), c.id);
    expect(chooseCommand(s(65, SHARK()))).toEqual({ type: 'vertical_move', actorId: 'S', toFt: -5 });
    expect(chooseCommand(s(64, SHARK()))).not.toEqual({ type: 'vertical_move', actorId: 'S', toFt: -5 });
    expect(chooseCommand(s(65, mk('S', { side: 'enemies', speed: 30, attacks: BITE, hp: 30, maxHp: 30 })))).not.toEqual({ type: 'vertical_move', actorId: 'S', toFt: -5 });
  });
  it('(b) yaklaşma: en yakın düşman batıksa dalar', () => {
    const s = field([A(), SHARK()], { A: [H(9), -5], S: [H(12)] }, 65, lake(), 'S');
    expect(chooseCommand(s)).toEqual({ type: 'vertical_move', actorId: 'S', toFt: -5 });
  });
  it('nefes: sınırın yarısında yüzeye çıkar (64\'te yalnız son turda)', () => {
    const s = (ver: number, breath: number) => {
      const st = field([A(), mk('E', { side: 'enemies', speed: 30, attacks: BITE, hp: 30, maxHp: 30 })], { A: [H(9), -5], E: [H(13)] }, ver, lake(), 'A');
      return { ...st, combatants: { ...st.combatants, A: { ...of(st, 'A'), mapStatus: { ...of(st, 'A').mapStatus, breath } } } };
    };
    // CON 0: sınır 10 tur; yarısı 5.
    expect(chooseCommand(s(65, 5))).toMatchObject({ type: 'vertical_move', actorId: 'A', toFt: 0 });
    expect(chooseCommand(s(65, 4))).not.toMatchObject({ type: 'vertical_move', toFt: 0 });
  });
  it('derin su ve kazıcı yokken 64 = 65 (aynı karar)', () => {
    const s = (ver: number) => field([A({ weaponOptions: [bow, mace] }), mk('E', { side: 'enemies', speed: 30, attacks: BITE, hp: 30, maxHp: 30 })], { A: [H(3)], E: [H(9)] }, ver, open(), 'E');
    expect(JSON.stringify(chooseCommand(s(65)))).toBe(JSON.stringify(chooseCommand(s(64))));
  });
  it('boğulma 0 ve replay: batık başlayan su savaşı (YZ iki taraf) 12 tur; boğulma olayı yok, olaylar baştan aynı durumu verir', () => {
    let s = field([A({ hp: 80, maxHp: 80 }), mk('B', { ownerId: 'p1', speed: 30, weaponOptions: [mace], hp: 80, maxHp: 80 }), SHARK({ hp: 80, maxHp: 80 })],
      { A: [H(8), -5], B: [H(8, 4), -5], S: [H(12), -5] }, 65, lake());
    const events: BattleEvent[] = [{ type: 'battle_started', state: s } as BattleEvent];
    let rng = 7;
    const r = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647; };
    for (let guard = 0; guard < 400 && s.status === 'active' && s.round <= 12; guard++) {
      const cmd = chooseCommand(s) as Command;
      const actorId = 'actorId' in cmd ? cmd.actorId : '';
      const ctx = of(s, actorId)?.side === 'enemies' ? { playerId: 'gm', isGm: true } : P1;
      let res = execute(s, cmd, ctx, r);
      if (!res.ok) res = execute(s, { type: 'end_turn', actorId } as Command, ctx, r);
      if (!res.ok) break;
      s = res.state; events.push(...res.events);
    }
    expect(events.filter((e) => e.type === 'exhaustion_changed' && String((e as { reason?: string }).reason).includes('boğulma'))).toEqual([]);
    expect(JSON.stringify(replay(events).combatants)).toBe(JSON.stringify(s.combatants));
  });
});
