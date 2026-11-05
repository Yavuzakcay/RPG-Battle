/**
 * Kuyruk K54b G3: Birlik Manastırı (kural sürümü 27): Omuz Ver (başarısız kurtulmaya bağlı dosttan +WIS, tepki),
 * Ortak Şifa (diğer bağlılara WIS can), Yıkılmaz Birlik (havuz 0'da bir kez ayakta); sürüm 26'da yok; YZ Bağ ve Teselli.
 */
import { describe, it, expect } from 'vitest';
import { kitArena, o, mid } from './k54bKit';
import { applyEvents } from './reduce';
import { saveDice } from './effectDice';
import { resolveSave, secondChanceAll } from '../rules/attack';
import { commandEndHookEvents } from './turnHooks';
import { chooseCommand } from './ai';
import { mk } from './fixtures';
import './imza';
import type { BattleEvent, Combatant } from './types';

const ally = (id: string, pos: { col: number; row: number }) => ({ ...mk(id, { ownerId: 'p1', hp: 20, maxHp: 30 }), pos }) as Combatant;
const B = (level: number, extra: Partial<Parameters<typeof kitArena>[0]> = {}) => kitArena({ cls: 'cleric', sub: 'imza_birlik', level, scores: { wis: 16 }, house: false,
  place: { C: o(4, 4), B: o(12, 7) }, extra: [ally('D', o(2, 3))], ...extra });

describe('K54b Birlik Manastırı', () => {
  it('Omuz Ver: Bağlı dostun başarısız kurtulmasına başka Bağlı dost +WIS (yalnız başarıya çevirecekse); sürüm 26\'da yok', () => {
    const r = B(3);
    r.do(r.use('forge-bond'));
    const c = r.c('C');
    expect(c.shoulderBy).toBeDefined();
    const extra = saveDice(c, 'dex');
    expect(extra.some((x) => x.label === 'Omuz Ver')).toBe(true);
    const bonus = c.shoulderBy!.bonus;
    const sc = secondChanceAll(extra.filter((x) => x.reroll), { total: 10, natural: 10, bonus: 0, need: 10 + bonus, mode: 'normal', kind: 'save' }, mid);
    expect(sc?.entries[0]?.label).toBe('Omuz Ver');
    expect(secondChanceAll(extra.filter((x) => x.reroll), { total: 10, natural: 10, bonus: 0, need: 11 + bonus, mode: 'normal', kind: 'save' }, mid)?.entries[0]?.label).not.toBe('Omuz Ver');
    const old = B(3, { kuralSurumu: 26 });
    old.do(old.use('forge-bond'));
    expect(old.c('C').shoulderBy).toBeUndefined();
    void resolveSave;
  });
  it('Ortak Şifa (8): rahibin büyüsüyle Bağlı dost iyileşince diğer Bağlılar WIS can; turda bir', () => {
    const r = B(8);
    r.do(r.use('forge-bond'));
    const heal: BattleEvent = { type: 'healed', actorId: 'A', targetId: 'C', label: 'Cure Wounds', amount: 5, targetHpAfter: 25 };
    const next = applyEvents(r.state, [heal]);
    const ev = commandEndHookEvents(r.state, next, [heal], { type: 'cast_spell', actorId: 'A', spellName: 'Cure Wounds', targetId: 'C' } as never, mid, applyEvents);
    const after = applyEvents(next, ev);
    expect(after.combatants.D!.hp).toBe(20 + 3);
    expect(commandEndHookEvents(after, after, [heal], { type: 'cast_spell', actorId: 'A', spellName: 'Cure Wounds', targetId: 'C' } as never, mid, applyEvents)).toEqual([]);
    const old = B(8, { kuralSurumu: 26 });
    old.do(old.use('forge-bond'));
    expect(commandEndHookEvents(old.state, applyEvents(old.state, [heal]), [heal], { type: 'cast_spell', actorId: 'A', spellName: 'x', targetId: 'C' } as never, mid, applyEvents)).toEqual([]);
  });
  it('Yıkılmaz Birlik (17): havuz 0\'a düşecekken 2 × seviye canla kalır, bir kez', () => {
    const r = B(17);
    r.do(r.use('forge-bond'));
    r.fresh();
    r.do(r.use('shared-vitality'));
    const pool = Object.values(r.state.hpPools ?? {})[0]!;
    expect(pool.guard?.hp).toBe(34);
    const kill: BattleEvent = { type: 'map_effect', rule: 'test', targetId: 'C', text: 'ölümcül', hpAfter: 0, damage: { type: 'force', applied: 999 } } as BattleEvent;
    const s1 = applyEvents(r.state, [kill]);
    expect(s1.hpPools![pool.id]!.hp).toBe(34);
    expect(s1.combatants.C!.life).not.toBe('dead');
    expect(s1.combatants.A!.economy.reaction).toBe(true);
    const s2 = applyEvents(s1, [{ ...kill, targetId: 'D' } as BattleEvent]);
    expect(s2.combatants.C!.life).toBe('dead');
  });
  it('YZ: Bağ Kurma bonus eylemle; yaralı bağlı varken Teselli Nöbeti', () => {
    const r = B(3, { place: { C: o(4, 4), B: o(5, 3) } });
    const c = chooseCommand(r.state);
    expect(c.type === 'use_feature' && c.feature).toBe('imza:imza_birlik/forge-bond');
    r.do(c);
    r.state = { ...r.state, combatants: { ...r.state.combatants, C: { ...r.c('C'), hp: 5 } } };
    const c2 = chooseCommand(r.state);
    expect(c2.type === 'use_feature' && c2.feature).toBe('imza:imza_birlik/vigil');
  });
});
