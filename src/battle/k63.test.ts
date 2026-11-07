/**
 * Kuyruk K63 (kural sürümü 47): Truesight. Tek sorgu `truesightSees` (sight.ts): True Seeing 120 ft gerçek görüş,
 * görsel yanılsamaya karşı otomatik save, Hide'dan saklanamama, gerçek biçim, paket `algi` ve canavar duyusu aynı
 * altyapıdan; 46 ve altında eski davranış. Replay `run` içinde.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { mk } from './fixtures';
import { caster, field, run } from './k19spells.test';
import { chooseCommand } from './ai';
import { knowsWhere, senseSees, seesTrueForm, sightConditions, truesightRange, truesightSees } from './sight';
import type { ActiveEffect, BattleState, Combatant, Command } from './types';

const ALL = [4, 3, 3, 3, 3, 3, 3, 2, 1];
const sp = (n: string) => spells.find((s) => s.name === n) as NonNullable<(typeof spells)[number]>;
const cast = (spellName: string, extra: Record<string, unknown> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const wiz = (names: string[], p: Partial<Combatant> = {}) => caster({ spellNames: names, spellSlots: ALL, concentration: null, hp: 900, maxHp: 900, ...p });
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 300, maxHp: 300, ...p });
const pos = { A: { col: 2, row: 3 }, C: { col: 3, row: 3 }, F0: { col: 6, row: 3 } };
const ts = (ft: number): ActiveEffect => ({ id: 'spells:true-seeing', name: 'True Seeing', sourceId: 'A', truesight: ft } as ActiveEffect);
const withEff = (s: BattleState, id: string, e: ActiveEffect): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), effects: [...(s.combatants[id]?.effects ?? []), e] } } });

describe('K63 True Seeing', () => {
  it('veri ve M1 metni: 120 ft Truesight, 1 saat; k63 etkisi truesight 120, konsantrasyon yok', () => {
    expect(sp('True Seeing').text).toMatch(/120 ft Truesight/);
    expect(sp('True Seeing').concentration).toBeFalsy();
    expect(sp('True Seeing').mechanics.k63?.effect).toMatchObject({ truesight: 120, rounds: 600, side: 'ally' });
  });
  it('47: dokunulan dost 120 ft Truesight alır (görünmezi görür); 46: eski yaklaşıklık (seeInvisible + darkvision)', () => {
    const mk47 = (k: number) => run(field([wiz(['True Seeing']), mk('C', { ownerId: 'p1' }), foe('F0', { conditions: ['Invisible'] })], pos, k), cast('True Seeing', { targetIds: ['C'] })).state;
    const s = mk47(47);
    const e = s.combatants.C?.effects?.find((x) => x.id === 'spells:true-seeing');
    expect(e).toMatchObject({ truesight: 120 });
    expect(e?.seeInvisible).toBeUndefined();
    expect(truesightRange(s, s.combatants.C as Combatant)).toBe(120);
    expect(truesightSees(s, s.combatants.C as Combatant, s.combatants.F0 as Combatant)).toBe(true);
    const sc = sightConditions(s.combatants.C as Combatant, s.combatants.F0 as Combatant, s);
    expect(sc.targetConditions).not.toContain('Invisible');
    const old = mk47(46);
    expect(old.combatants.C?.effects?.find((x) => x.id === 'spells:true-seeing')).toMatchObject({ seeInvisible: true, darkvision: 120 });
    expect(truesightSees(old, old.combatants.C as Combatant, old.combatants.F0 as Combatant)).toBe(false);
  });
  it('menzil dışı (120 ft = 24 altıgen) görmez; Truesight olmayan görmez', () => {
    const s = field([wiz([]), mk('C', { ownerId: 'p1' }), foe('F0', { conditions: ['Invisible'] })], { ...pos, F0: { col: 6, row: 3 } }, 47);
    const t = withEff(s, 'C', ts(120));
    const far = { ...t, combatants: { ...t.combatants, F0: { ...(t.combatants.F0 as Combatant), pos: { col: 30, row: 3 } } } } as BattleState;
    expect(truesightSees(t, t.combatants.C as Combatant, t.combatants.F0 as Combatant)).toBe(true);
    expect(truesightSees(far, far.combatants.C as Combatant, far.combatants.F0 as Combatant)).toBe(false);
    expect(truesightSees(s, s.combatants.C as Combatant, s.combatants.F0 as Combatant)).toBe(false);
  });
});

describe('K63 Truesight bağlantıları', () => {
  const base = (k: number) => field([wiz([]), mk('C', { ownerId: 'p1' }), foe('F0')], pos, k);
  it('canavar duyusu, Boon, Witch Sight ve paket gercekGorusFt aynı menzil sorgusundan', () => {
    const s = base(47);
    const c = s.combatants.C as Combatant;
    expect(truesightRange(s, { ...c, senses: { truesight: 30 } })).toBe(30);
    expect(truesightRange(s, withEff(s, 'C', { ...ts(0), truesight: undefined, pkTruesight: 10 } as ActiveEffect).combatants.C as Combatant)).toBe(10);
    expect(truesightRange(s, { ...c, traits: ['boon-truesight'] })).toBe(60);
    // senseSees (görünmez, karanlık) aynı menzili kullanır.
    const eff = withEff(s, 'C', ts(120));
    expect(senseSees(eff, eff.combatants.C as Combatant, eff.combatants.F0 as Combatant)).toBe(true);
  });
  it('görsel yanılsama (Phantasmal Force): Truesight\'lı hedefin save\'i otomatik geçer (47); 46\'da atılır ve düşebilir', () => {
    const fx = (k: number, sees: boolean) => {
      const hero = mk('C', { side: 'enemies', hp: 300, maxHp: 300, saves: { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 } });
      let s = field([wiz(['Phantasmal Force'], { spellSaveDc: 20 }), hero], { A: { col: 2, row: 3 }, C: { col: 4, row: 3 } }, k);
      if (sees) s = withEff(s, 'C', ts(120));
      return run(s, cast('Phantasmal Force', { targetId: 'C' }));
    };
    const saved = fx(47, true);
    const sv = saved.events.find((e) => e.type === 'save_resolved');
    expect(sv).toMatchObject({ success: true, natural: null });
    expect(saved.state.combatants.C?.effects?.some((e) => e.id === 'spells:phantasmal-force')).toBeFalsy();
    const unseeing = fx(47, false);
    expect(unseeing.events.find((e) => e.type === 'save_resolved')?.success).toBe(false);
    const old = fx(46, true);
    expect(old.events.find((e) => e.type === 'save_resolved')).toMatchObject({ success: false });
  });
  it('Hide: Truesight menzilindeki gizlenmiş yaratık saklanamaz (47); 46\'da saklanır', () => {
    const hid = (k: number) => {
      const s = base(k);
      const t = withEff(s, 'C', ts(120));
      return { ...t, combatants: { ...t.combatants, F0: { ...(t.combatants.F0 as Combatant), hidden: { dc: 15 } } } } as BattleState;
    };
    const s47 = hid(47), s46 = hid(46);
    expect(knowsWhere(s47, s47.combatants.C as Combatant, s47.combatants.F0 as Combatant)).toBe(true);
    expect(knowsWhere(s46, s46.combatants.C as Combatant, s46.combatants.F0 as Combatant)).toBe(false);
  });
  it('dönüşmüş hedefin asıl biçimi görülür (47)', () => {
    const s = withEff(base(47), 'C', ts(120));
    const shaped = { ...(s.combatants.F0 as Combatant), shape: { name: 'Bear', prev: {} } as never };
    expect(seesTrueForm(s, s.combatants.C as Combatant, shaped)).toBe(true);
    expect(seesTrueForm(base(47), base(47).combatants.C as Combatant, shaped)).toBe(false);
    expect(seesTrueForm(s, s.combatants.C as Combatant, s.combatants.F0 as Combatant)).toBe(false);
  });
  it('YZ: Truesight sahibi düşman, gizlenmiş oyuncuyu hedefler (47); 46\'da hedeflemez', () => {
    const mkAi = (k: number) => {
      const e = mk('E', { side: 'enemies', hp: 90, maxHp: 90, senses: { truesight: 120 }, attacks: [{ name: 'Claw', bonus: 8, damageDice: '1d8+4', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' }] });
      const p = mk('P', { ownerId: 'p1', hp: 60, maxHp: 60, hidden: { dc: 15 } });
      return field([e, p], { E: { col: 2, row: 3 }, P: { col: 3, row: 3 } }, k, { specialSenses: true });
    };
    const c47 = chooseCommand(mkAi(47));
    expect(c47.type === 'monster_attack' && c47.targetId === 'P').toBe(true);
    const c46 = chooseCommand(mkAi(46));
    expect(c46.type === 'monster_attack').toBe(false);
  });
});
