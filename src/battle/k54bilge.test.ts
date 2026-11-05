/**
 * Kuyruk K54 G1: Yaşlı Bilge Disiplini eksik özellikleri (kural sürümü 25): Zihin Gücü kipleri (it/çek/yana/serbest),
 * nesne itme, fırlatma (enkaz), Sabır tepkisi, Çevik Yaşlı fırsat saldırısı muafiyeti, Son Ders aurası; eski sürümde yok.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, startBattle } from './create';
import { getMonster } from '../data';
import { applyEvents, replay } from './reduce';
import { P1, mk } from './fixtures';
import { makeObject } from './objects';
import { afterAttackReactions } from './reactions';
import './imza54';
import { blankCharacter } from '../rules/builder';
import { distance } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const low: Rng = () => 0.01;
const mid: Rng = () => 0.5;
const o = (col: number, row: number) => ({ col, row });
const monk = (level: number) => combatantFromSheet({ ...blankCharacter('im').sheet, name: 'Bilge', raceId: 'human', classId: 'monk', subclassId: 'imza_bilge', level, gender: 'kadin',
  baseScores: { str: 12, dex: 16, con: 14, int: 10, wis: 16, cha: 8 } } as CharacterSheet, { id: 'A', ownerId: 'p1' });

function arena(level: number, opts: { kuralSurumu?: number; B?: ReturnType<typeof o>; C?: ReturnType<typeof o>; ogre?: boolean } = {}) {
  const B = opts.ogre ? { ...combatantFromMonster(getMonster('ogre'), { id: 'B' }), side: 'enemies' as const } : mk('B', { side: 'enemies', hp: 60, maxHp: 60, monsterId: 'bandit', saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 } });
  const s0 = startBattle('im', 'k54', [monk(level), mk('C', { ownerId: 'p1', hp: 10, maxHp: 30 }), B], () => 0.5, {
    map: { id: 'col' }, houseRules: { imza_bilge: true }, ...(opts.kuralSurumu ? { kuralSurumu: opts.kuralSurumu } : {}) }).state;
  const combatants = { ...s0.combatants };
  const place: Record<string, { col: number; row: number }> = { A: o(3, 3), B: opts.B ?? o(4, 3), C: opts.C ?? o(0, 0) };
  for (const [id, p] of Object.entries(place)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...s0, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 9 }, () => '.'.repeat(15)), objects: [], zones: [] } };
  const run = {
    state, events: [{ type: 'battle_started', state } as BattleEvent],
    do(cmd: Command, rng: Rng = mid) {
      const r = execute(run.state, cmd, P1, rng);
      if (!r.ok) throw new Error(r.error);
      run.state = r.state; run.events.push(...r.events);
      return r.events;
    },
    try: (cmd: Command, rng: Rng = mid) => execute(run.state, cmd, P1, rng),
    c: (id: string) => run.state.combatants[id] as Combatant,
  };
  return run;
}
const use = (f: string, targetId?: string, to?: { col: number; row: number }): Command => ({ type: 'use_feature', actorId: 'A', feature: `imza:imza_bilge/${f}`, ...(targetId ? { targetId } : {}), ...(to ? { to } : {}) });
const keys = (r: ReturnType<typeof arena>) => (r.c('A').features ?? []).map((f) => f.key);

describe('K54 Yaşlı Bilge', () => {
  it('sürüm 24 savaşında yeni eylemler yok; 25 savaşında var', () => {
    expect(keys(arena(11, { kuralSurumu: 24 }))).not.toContain('imza:imza_bilge/mind-pull');
    expect(keys(arena(11, { kuralSurumu: 24 }))).toContain('imza:imza_bilge/mind-might');
    const k = keys(arena(11));
    for (const f of ['mind-pull', 'mind-slide', 'mind-object', 'mind-move', 'mind-hurl']) expect(k).toContain(`imza:imza_bilge/${f}`);
    expect(keys(arena(3))).not.toContain('imza:imza_bilge/mind-hurl');
  });
  it('Çek: uzaktaki düşman Monk\'a doğru 10 ft', () => {
    const r = arena(3, { B: o(8, 3) });
    r.do(use('mind-pull', 'B'), low);
    expect(distance(r.c('A').pos!, r.c('B').pos!)).toBe(3);
  });
  it('Yana kaydır: uzaklık değişmez, yer değişir', () => {
    const r = arena(3, { B: o(6, 3) });
    const d0 = distance(r.c('A').pos!, r.c('B').pos!);
    r.do(use('mind-slide', 'B'), low);
    expect(r.c('B').pos).not.toEqual(o(6, 3));
    expect(distance(r.c('A').pos!, r.c('B').pos!)).toBe(d0);
  });
  it('Taşı (11): seçilen altıgene doğru 20 ft; altıgen yoksa red', () => {
    const r = arena(11, { B: o(5, 3) });
    expect(r.try(use('mind-move', 'B'), low).ok).toBe(false);
    r.do(use('mind-move', 'B', o(5, 7)), low);
    expect(r.c('B').pos).toEqual(o(5, 7));
  });
  it('Nesne: hafif sandık itilir; 3. seviyede orta ağırlık (varil) reddedilir, 11. seviyede itilir', () => {
    const r = arena(3);
    const chest = makeObject(r.state, 'chest', o(3, 1));
    r.state = applyEvents(r.state, [{ type: 'object_placed', object: chest }]);
    r.do(use('mind-object', undefined, o(3, 1)), low);
    expect(distance(o(3, 3), r.state.map!.objects!.find((x) => x.id === chest.id)!.at)).toBe(4);
    const barrel = makeObject(r.state, 'oilBarrel', o(1, 3));
    r.state = applyEvents(r.state, [{ type: 'object_placed', object: barrel }]);
    expect(r.try(use('mind-object', undefined, o(1, 3)), low).ok).toBe(false);
    const h = arena(11);
    const b2 = makeObject(h.state, 'oilBarrel', o(1, 3));
    h.state = applyEvents(h.state, [{ type: 'object_placed', object: b2 }]);
    h.do(use('mind-object', undefined, o(1, 3)), low);
    expect(h.state.map!.objects!.find((x) => x.id === b2.id)!.at).not.toEqual(o(1, 3));
  });
  it('Fırlat (11): nesne yoksa enkaz belirir, hedef DEX save başarısız → tek zar hasar; replay aynı', () => {
    const r = arena(11, { B: o(6, 3) });
    const ev = r.do(use('mind-hurl', 'B', o(3, 6)), low);
    expect(ev.some((e) => e.type === 'object_placed')).toBe(true);
    expect(r.c('B').hp).toBeLessThan(60);
    expect(r.c('B').hp).toBeGreaterThanOrEqual(60 - 18);
    expect(replay(r.events).combatants.B?.hp).toBe(r.c('B').hp);
  });
  it('Sabır: yakın dövüşte ıskalayan düşmana tepkiyle silahsız saldırı; önce ücretsiz kullanım', () => {
    const r = arena(3);
    const free0 = r.c('A').resources.imzaSabir ?? 0;
    expect(free0).toBeGreaterThan(0);
    const ev = afterAttackReactions(r.state, 'B', 'A', null, { melee: true, damageType: 'slashing', dealt: 0 }, mid);
    expect(ev.some((e) => e.type === 'reaction_used' && e.reaction === 'imza-sabir')).toBe(true);
    expect(applyEvents(r.state, ev).combatants.A?.resources.imzaSabir).toBe(free0 - 1);
    // İsabette ya da sürüm 24'te yok.
    expect(afterAttackReactions(r.state, 'B', 'A', { events: [], hit: true, ac: 10, damage: 3 }, { melee: true, damageType: 'slashing', dealt: 3 }, mid)
      .some((e) => e.type === 'reaction_used')).toBe(false);
    const old = arena(3, { kuralSurumu: 24 });
    expect(afterAttackReactions(old.state, 'B', 'A', null, { melee: true, damageType: 'slashing', dealt: 0 }, mid).some((e) => e.type === 'reaction_used')).toBe(false);
  });
  it('Çevik Yaşlı (11): sürüm 25\'te erişimden çıkmak fırsat saldırısı doğurmaz; 24\'te doğurur', () => {
    const oa = (r: ReturnType<typeof arena>) => r.do({ type: 'move', actorId: 'A', to: o(1, 3) }).some((e) => e.type === 'reaction_used' && e.reaction === 'opportunity-attack');
    expect(oa(arena(11, { ogre: true }))).toBe(false);
    expect(oa(arena(11, { ogre: true, kuralSurumu: 24 }))).toBe(true);
  });
  it('Son Ders (17): sürüm 25\'te dostlara WIS kadar save bonusu aurası', () => {
    const r = arena(17, { C: o(4, 4) });
    r.do(use('final-lesson'));
    expect(r.c('C').auraSave ?? 0).toBeGreaterThan(0);
  });
});
