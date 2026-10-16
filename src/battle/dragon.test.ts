/** Volkan "Uyuyan ejderha" varyantı: uyku, uyanma koşulları, dragonWake kipleri, GM düğmesi. */
import { describe, it, expect } from 'vitest';
import { execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import type { Offset } from '../rules/hex';
import { distance } from '../rules/hex';
import { chooseCommand } from './ai';
import { DRAGON_ID } from './create';
import { createMapBattle } from '../app/setup';
import { simulate } from '../sim/balance';
import { describeEvent } from '../ui/log';
import { GM, P1, mk, scripted, sword } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
const DRAGON_AT = o(7, 2);
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));

/** Uyuyan ejderha + A (oyuncu) + W (düşman kurt benzeri); düz zemin, sıra istenen savaşçıda. */
function arena(
  pos: Record<string, Offset>, turn = 'A', map: { dragon?: string; dragonWake?: 'never' | 'chance' | 'gm'; dragonWakeChance?: number } = {},
  extra: Combatant[] = [],
): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, weaponOptions: [sword], speed: 30 }),
    mk('W', { side: 'enemies', hp: 30, maxHp: 30, speed: 40,
      attacks: [{ name: 'Bite', bonus: 4, damageDice: '2d4+2', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' }] }),
    ...extra,
  ];
  const { state } = startBattle('d', 'd-z-zemin', parts, scripted(...parts.map(() => [20, 10] as [number, number]), [20, 1]),
    { map: { id: 'volkan', variantId: 'uyuyan-ejderha', ...map } });
  const combatants = { ...state.combatants };
  combatants[DRAGON_ID] = { ...(combatants[DRAGON_ID] as Combatant), pos: DRAGON_AT };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return {
    ...state, status: 'active', turnIndex: state.order.indexOf(turn), combatants,
    map: { ...(state.map as NonNullable<BattleState['map']>), tiles: flat },
  };
}
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const run = (s: BattleState, cmd: Command, ctx: CommandContext = P1, rng = scripted()) => ok(execute(s, cmd, ctx, rng));
const woke = (events: BattleEvent[]) => events.find((e): e is Extract<BattleEvent, { type: 'dragon_woke' }> => e.type === 'dragon_woke');
const dragonOf = (s: BattleState) => s.combatants[DRAGON_ID] as Combatant;

describe('uyuyan ejderha: varyant ve uyku', () => {
  it('varsayılan Young Red; Adult Red, Ancient Red ve Wyrmling seçilebilir; ortadaki adanın tepesine uyur halde yerleşir', () => {
    const plan = { mapId: 'volkan', variantId: 'uyuyan-ejderha', mirrored: false };
    const s = createMapBattle([mk('A', { ownerId: 'p1' })], plan, scripted()).state;
    expect(dragonOf(s)).toMatchObject({ name: 'Young Red Dragon', asleep: true, pos: DRAGON_AT, side: 'enemies' });
    expect(dragonOf(s).tokenScale).toBeGreaterThan(2);
    expect(s.map?.dragon).toEqual({ id: DRAGON_ID, mode: 'never', chancePct: 10 });
    for (const [id, name] of [['adult-red-dragon', 'Adult Red Dragon'], ['ancient-red-dragon', 'Ancient Red Dragon'], ['red-dragon-wyrmling', 'Red Dragon Wyrmling']]) {
      expect(dragonOf(createMapBattle([mk('A', { ownerId: 'p1' })], { ...plan, dragon: id }, scripted()).state).name).toBe(name);
    }
    // Normal Volkan değişmedi: ejderha yok.
    expect(createMapBattle([mk('A', { ownerId: 'p1' })], { ...plan, variantId: 'normal' }, scripted()).state.map?.dragon).toBeUndefined();
  });
  it('uykudaki ejderha turunu atlar, komut veremez; ona yakın dövüş avantajlı, menzilli değil', () => {
    const s = arena({ A: o(2, 2), W: o(12, 5) });
    const order = s.order.filter((id) => id !== DRAGON_ID);
    let cur = s;
    for (let i = 0; i < order.length * 2; i++) {
      const id = cur.order[cur.turnIndex] as string;
      expect(id).not.toBe(DRAGON_ID);
      cur = run(cur, { type: 'end_turn', actorId: id }, id === 'A' ? P1 : GM).state;
    }
    const atD = { ...s, turnIndex: s.order.indexOf(DRAGON_ID) };
    const r = execute(atD, { type: 'move', actorId: DRAGON_ID, to: o(7, 4) }, GM, scripted());
    expect(r.ok ? '' : r.error).toContain('uyuyor');
    // A bitişikte (zaten oradaydı): yakın dövüş avantajlı; vuruş hasar verir → uyanır.
    const near = arena({ A: o(6, 2), W: o(12, 5) });
    const hit = run(near, { type: 'attack', actorId: 'A', targetId: DRAGON_ID, option: sword }, P1, scripted([20, 18], [20, 18], [8, 5]));
    const atk = hit.events.find((e) => e.type === 'attack_resolved');
    expect(atk?.type === 'attack_resolved' && atk.reasons).toContain('Hedef uyuyor (yakından)');
    expect(woke(hit.events)).toMatchObject({ reason: 'hasar aldı' });
    expect(dragonOf(hit.state).asleep).toBe(false);
    const bow = { ...sword, label: 'Longbow', ranged: true, range: [150, 600] as [number, number], reachFt: undefined };
    const far = run(arena({ A: o(2, 2), W: o(12, 5) }), { type: 'attack', actorId: 'A', targetId: DRAGON_ID, option: bow }, P1, scripted([20, 1]));
    const shot = far.events.find((e) => e.type === 'attack_resolved');
    expect(shot?.type === 'attack_resolved' && shot.reasons).not.toContain('Hedef uyuyor (yakından)');
    expect(dragonOf(far.state).asleep).toBe(true); // ıska, hasar yok
  });
});

describe('uyanma koşulları', () => {
  it('bitişik altıgene giren (yürürken geçmek dahil) uyandırır; uzaktan geçen uyandırmaz', () => {
    const r = run(arena({ A: o(3, 2), W: o(12, 5) }), { type: 'move', actorId: 'A', to: o(6, 2) });
    expect(woke(r.events)).toMatchObject({ reason: 'yanına biri girdi', byId: 'A' });
    expect(describeEvent(woke(r.events) as BattleEvent, r.state)).toContain('uyandı');
    const quiet = run(arena({ A: o(3, 5), W: o(12, 5) }), { type: 'move', actorId: 'A', to: o(5, 5) });
    expect(woke(quiet.events)).toBeUndefined();
  });
  it('25 ft içinde gürültülü büyü (Thunderwave) uyandırır; uzaktaki uyandırmaz', () => {
    const wiz = { spellNames: ['Thunderwave'], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], spellSaveDc: 13, spellMod: 3 };
    const near = arena({ A: o(4, 2), W: o(12, 5) });
    const s = { ...near, combatants: { ...near.combatants, A: { ...(near.combatants.A as Combatant), ...wiz } } };
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Thunderwave', targetHex: o(3, 2) });
    expect(woke(r.events)).toMatchObject({ reason: 'gürültü' });
    const farS = arena({ A: o(1, 5), W: o(12, 5) });
    const f = { ...farS, combatants: { ...farS.combatants, A: { ...(farS.combatants.A as Combatant), ...wiz } } };
    expect(woke(run(f, { type: 'cast_spell', actorId: 'A', spellName: 'Thunderwave', targetHex: o(0, 5) }).events)).toBeUndefined();
  });
  it('tur sonunda 25 ft içindeki gizlenmemiş karakter için Algı: d20 + Perception ≥ 12', () => {
    // Sıranın son savaşçısı turunu bitirince tur değişir; A 4 altıgen (20 ft) uzakta.
    const s = arena({ A: o(3, 2), W: o(12, 5) });
    const last = s.order.filter((id) => id !== DRAGON_ID).at(-1) as string;
    const atLast = { ...s, turnIndex: s.order.indexOf(last) };
    const ctx = last === 'A' ? P1 : GM;
    // Young Red Perception +8: d20 3 → 11 < 12 uyumaya devam; d20 4 → 12 uyanır.
    const miss = run(atLast, { type: 'end_turn', actorId: last }, ctx, scripted([20, 3]));
    expect(miss.events.find((e) => e.type === 'dragon_perception')).toMatchObject({ total: 11, dc: 12, success: false });
    expect(dragonOf(miss.state).asleep).toBe(true);
    const hit = run(atLast, { type: 'end_turn', actorId: last }, ctx, scripted([20, 4]));
    expect(woke(hit.events)?.reason).toContain('Algı');
    // Gizlenmiş ya da 25 ft dışındaki karakter için zar yok.
    const hid = { ...atLast, combatants: { ...atLast.combatants, A: { ...(atLast.combatants.A as Combatant), hidden: { dc: 15 } } } };
    expect(run(hid, { type: 'end_turn', actorId: last }, ctx, scripted([20, 20])).events.some((e) => e.type === 'dragon_perception')).toBe(false);
    const far = { ...atLast, combatants: { ...atLast.combatants, A: { ...(atLast.combatants.A as Combatant), pos: o(1, 5) } } };
    expect(run(far, { type: 'end_turn', actorId: last }, ctx, scripted([20, 20])).events.some((e) => e.type === 'dragon_perception')).toBe(false);
  });
  it('uyanık düşmanlar yenilince ejderha uyurken parti kazanır', () => {
    const s = arena({ A: o(2, 2), W: o(3, 2) });
    const weak = { ...s, combatants: { ...s.combatants, W: { ...(s.combatants.W as Combatant), hp: 1 } } };
    const r = run(weak, { type: 'attack', actorId: 'A', targetId: 'W', option: sword }, P1, scripted([20, 18], [8, 5]));
    expect(r.state.status).toBe('finished');
    expect(r.state.winner).toBe('party');
    expect(dragonOf(r.state).asleep).toBe(true);
  });
});

describe('GM ve dragonWake kipleri', () => {
  it('GM her kipte, her an uyandırır ("GM ejderhayı uyandırdı"); oyuncu bu komutu veremez', () => {
    for (const mode of ['never', 'chance', 'gm'] as const) {
      const s = arena({ A: o(2, 2), W: o(12, 5) }, 'A', { dragonWake: mode });
      const r = run(s, { type: 'wake_dragon' }, GM);
      expect(dragonOf(r.state).asleep).toBe(false);
      expect(describeEvent(woke(r.events) as BattleEvent, r.state)).toContain('GM ejderhayı uyandırdı');
      const no = execute(s, { type: 'wake_dragon' }, P1, scripted());
      expect(no.ok).toBe(false);
    }
  });
  it('GM düşmanı elle yönetirken kısıt yok: bitişiğe girmek normal kuralla uyandırır', () => {
    const s = arena({ A: o(1, 5), W: o(10, 2) }, 'W', { dragonWake: 'never' });
    const r = run(s, { type: 'move', actorId: 'W', to: o(8, 2) }, GM);
    expect(woke(r.events)).toMatchObject({ byId: 'W' });
  });
  it('never ve gm: yapay zekâ düşmanı ejderhanın yanına girmez (yolu yanından geçmez)', () => {
    for (const mode of ['never', 'gm'] as const) {
      // Kurt ejderhanın öbür yanında; kahraman sol tarafta. Kısa yol ejderhanın yanından geçer.
      const s = arena({ A: o(4, 2), W: o(10, 2) }, 'W', { dragonWake: mode });
      const cmd = chooseCommand(s);
      const r = execute(s, cmd, GM, scripted());
      expect(r.ok && woke(r.events)).toBeFalsy();
      if (r.ok && cmd.type === 'move') expect(distance(r.state.combatants.W?.pos as Offset, DRAGON_AT)).toBeGreaterThan(1);
    }
  });
  it('chance: tur başında eğilim zarı (tohumlu); tutarsa "ejderhayı uyandırmaya çalıştı" ve yanına gider ya da bağırır', () => {
    const s = arena({ A: o(1, 5), W: o(13, 2) }, 'W', { dragonWake: 'chance', dragonWakeChance: 25 });
    expect(chooseCommand(s)).toEqual({ type: 'rouse_dragon', actorId: 'W' });
    // d100 30 ≥ 25: tutmaz; bu tur bir daha atılmaz.
    const miss = run(s, { type: 'rouse_dragon', actorId: 'W' }, GM, scripted([100, 31]));
    expect(miss.events[0]).toMatchObject({ type: 'rouse_roll', roll: 30, success: false });
    expect(execute(miss.state, { type: 'rouse_dragon', actorId: 'W' }, GM, scripted()).ok).toBe(false);
    expect(chooseCommand(miss.state).type).not.toBe('rouse_dragon');
    // d100 10 < 25: tutar; 30 ft uzakta (gürültü menzili dışında) → ejderhanın yanına yürür (uyandırır).
    const hit = run(s, { type: 'rouse_dragon', actorId: 'W' }, GM, scripted([100, 11]));
    expect(describeEvent(hit.events[0] as BattleEvent, hit.state)).toContain('W ejderhayı uyandırmaya çalıştı');
    const go = chooseCommand(hit.state);
    expect(go.type).toBe('move');
    const moved = run(hit.state, go, GM);
    expect(woke(moved.events)).toMatchObject({ byId: 'W' });
    // 25 ft içindeyse tutunca hemen bağırır.
    const close = arena({ A: o(1, 5), W: o(10, 2) }, 'W', { dragonWake: 'chance', dragonWakeChance: 25 });
    expect(woke(run(close, { type: 'rouse_dragon', actorId: 'W' }, GM, scripted([100, 1])).events)).toMatchObject({ reason: 'gürültü' });
  });
  it('oyuncu tarafı dragonWake\'ten etkilenmez: parti üyesi yanına girerse uyanır (never kipinde de)', () => {
    const r = run(arena({ A: o(5, 2), W: o(12, 5) }, 'A', { dragonWake: 'never' }), { type: 'move', actorId: 'A', to: o(6, 3) });
    expect(woke(r.events)).toBeDefined();
  });
  it('simülasyon tohumlu ve tekrarlanabilir (chance kipinde de)', () => {
    const sc = { id: 'x', name: 'x', map: { mapId: 'volkan', variantId: 'uyuyan-ejderha', dragon: 'red-dragon-wyrmling', dragonWake: 'chance' as const, dragonWakeChance: 50 }, enemies: { harpy: 1 } };
    expect(simulate(sc, 7)).toEqual(simulate(sc, 7));
  });
});
