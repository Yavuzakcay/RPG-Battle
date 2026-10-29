/** Durum/zemin hasarı animasyonu: olaylardan hasar listesi (yalnızca arayüz). */
import { describe, it, expect } from 'vitest';
import type { BattleEvent } from '../battle/types';
import { FRESH_MAP_STATUS } from '../battle/types';
import { EFFECT_SPRITES, damageHits, kindOf, outcomeMarks, spriteFor, statusIcons } from './damageFloats';

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
      { targetId: 'A', amount: 4, kind: 'fire', damageType: 'fire' }, { targetId: 'B', amount: 6, kind: 'hit', damageType: 'radiant' }]);
  });
  it('kalıcı simgeler: yanıyor, zehirli (durum ya da batak zehri)', () => {
    expect(statusIcons({ conditions: ['Burning'], mapStatus: FRESH_MAP_STATUS }).map((s) => s.icon)).toEqual(['🔥']);
    expect(statusIcons({ conditions: [], mapStatus: { ...FRESH_MAP_STATUS, lingeringPoison: true } }).map((s) => s.title)).toEqual(['Zehirli']);
    expect(statusIcons({ conditions: ['Prone', 'Grappled'], mapStatus: FRESH_MAP_STATUS }).map((s) => s.key)).toEqual(['grappled', 'prone']);
    expect(statusIcons({ conditions: ['Blinded'], mapStatus: FRESH_MAP_STATUS })).toEqual([]);
  });
});

describe('eylem sonucu işareti', () => {
  it('saldırı isabet/ıska/kritik, kurtarma, kaçış; zarsız olay işaretlenmez', () => {
    const atk = (hit: boolean, critical = false, d20 = [12]) => ({ type: 'attack_resolved', actorId: 'A', targetId: 'B', label: 'Longsword', mode: 'normal',
      reasons: [], d20, natural: d20[0] ?? null, total: 15, targetAc: 13, hit, critical, fumble: false, damageRolls: [], rawDamage: 0, appliedDamage: 0,
      damageType: 'slashing', damageNote: null, targetHpAfter: 10, effects: [] }) as BattleEvent;
    const save: BattleEvent = { type: 'condition_save', targetId: 'C', condition: 'Poisoned', ability: 'con', dc: 12, d20: [15], total: 15, success: true };
    const esc: BattleEvent = { type: 'grapple_escape', actorId: 'D', skill: 'athletics', d20: [3], total: 5, dc: 12, success: false };
    expect(outcomeMarks([atk(true), atk(false), atk(true, true), atk(true, false, []), save, esc])).toEqual([
      { targetId: 'B', ok: true, text: '✔ İsabet' }, { targetId: 'B', ok: false, text: '✖ Iska' }, { targetId: 'B', ok: true, text: '✔ Kritik' },
      { targetId: 'C', ok: true, text: '✔ Kurtardı' }, { targetId: 'D', ok: false, text: '✖ Kurtulamadı' }]);
  });
});

describe('hasar efekti sprite\'ları', () => {
  const files = Object.keys(import.meta.glob('../../public/efektler/*.webp')).map((p) => `efektler/${p.split('/').pop() ?? ''}`).sort();
  it('5 şerit (burn 8 kare, diğerleri 6), 128 px, 110 ms; dosyaları var', () => {
    expect(EFFECT_SPRITES.map((s) => [s.id, s.frames, s.size, s.frameMs])).toEqual([
      ['burn', 8, 128, 110], ['poison', 6, 128, 110], ['freeze', 6, 128, 110], ['acid', 6, 128, 110], ['bleed', 6, 128, 110]]);
    // Görev V: klasörde durum efektleri ve engel de var; her hasar şeridinin dosyası olmalı.
    for (const s of EFFECT_SPRITES) expect(files).toContain(s.file);
  });
  it('eşleme: fire→burn, poison→poison, cold→freeze, acid→acid, Infernal Wound→bleed; diğerleri sprite\'sız', () => {
    expect(['fire', 'poison', 'cold', 'acid', 'radiant'].map((t) => spriteFor({ damageType: t })?.id ?? null)).toEqual(['burn', 'poison', 'freeze', 'acid', null]);
    const wound: BattleEvent = { type: 'map_effect', rule: 'condition', targetId: 'A', text: 'Bearded Devil: Infernal Glaive: Infernal Wound',
      damage: { rolls: [5], raw: 5, applied: 5, type: '', note: null }, hpAfter: 10 };
    const [hit] = damageHits([wound]);
    expect(hit?.condition).toBe('Infernal Wound');
    expect(spriteFor(hit ?? {})?.id).toBe('bleed');
  });
});
