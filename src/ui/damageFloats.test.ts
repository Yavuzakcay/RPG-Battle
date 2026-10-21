/** Durum/zemin hasarı animasyonu: olaylardan hasar listesi (yalnızca arayüz). */
import { describe, it, expect } from 'vitest';
import type { BattleEvent } from '../battle/types';
import { FRESH_MAP_STATUS } from '../battle/types';
import { damageHits, kindOf, statusIcons } from './damageFloats';

const dmg = (targetId: string, applied: number, type: string): BattleEvent => ({
  type: 'map_effect', rule: 'lavaEdge', targetId, text: 'sıcak dalga',
  damage: { rolls: [applied], raw: applied, applied, type, note: null }, hpAfter: 10,
});

describe('hasar animasyonu', () => {
  it('tür → animasyon: ateş, zehir, soğuk, asit; diğerleri genel', () => {
    expect(['fire', 'poison', 'cold', 'acid', 'radiant', 'piercing'].map(kindOf)).toEqual(['fire', 'poison', 'cold', 'acid', 'hit', 'hit']);
  });
  it("map_effect hasarı ve yayılım save'i sırayla; hasarsız olaylar yok sayılır", () => {
    const aura = { type: 'save_resolved', actorId: 'C', targetId: 'B', label: 'Spirit Guardians', ability: 'wis', dc: 13, mode: 'normal', reasons: [],
      d20: [5], natural: 5, total: 5, success: false, damageRolls: [6], rawDamage: 6, appliedDamage: 6, damageType: 'radiant', damageNote: null,
      targetHpAfter: 4, effects: [], conditionsAdded: [], aura: { casterId: 'C', turn: '1:0' } } as BattleEvent;
    const noDamage: BattleEvent = { type: 'map_effect', rule: 'bog', targetId: 'A', text: 'sudan çıktı' };
    expect(damageHits([dmg('A', 4, 'fire'), noDamage, dmg('B', 0, 'poison'), aura])).toEqual([
      { targetId: 'A', amount: 4, kind: 'fire' }, { targetId: 'B', amount: 6, kind: 'hit' }]);
  });
  it('kalıcı simgeler: yanıyor, zehirli (durum ya da batak zehri)', () => {
    expect(statusIcons({ conditions: ['Burning'], mapStatus: FRESH_MAP_STATUS }).map((s) => s.icon)).toEqual(['🔥']);
    expect(statusIcons({ conditions: [], mapStatus: { ...FRESH_MAP_STATUS, lingeringPoison: true } }).map((s) => s.title)).toEqual(['Zehirli']);
    expect(statusIcons({ conditions: ['Prone'], mapStatus: FRESH_MAP_STATUS })).toEqual([]);
  });
});
