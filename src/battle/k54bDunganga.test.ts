/**
 * Kuyruk K54b G2: Dunganga (kural sürümü 27): Ninni/Sepet yedek Büyücülük Puanı, tek sepet, Kâbus tur başı hasarı,
 * Dunganga Çağrısı aurası (tur başı Uykulu + hasar, can yenileyemez, Cesaret), Çağrı sırasında bonus eylemle Sepet;
 * eski sürümde eski davranış; YZ Ninni ve Sepet kullanır.
 */
import { describe, it, expect } from 'vitest';
import { kitArena, o, low, high, mid } from './k54bKit';
import { auraTriggerEvents } from './auraCore';
import { applyEvents, replay } from './reduce';
import { chooseCommand } from './ai';
import { mk } from './fixtures';
import './imza';
import type { Combatant } from './types';

const D = (level: number, extra: Partial<Parameters<typeof kitArena>[0]> = {}) => kitArena({ cls: 'sorcerer', sub: 'imza_dunganga', level, scores: { cha: 16 }, ...extra });
const foe = (id: string, pos: { col: number; row: number }) => ({ ...mk(id, { side: 'enemies', hp: 60, maxHp: 60, monsterId: 'bandit', saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 } }), pos }) as Combatant;
const drain = (r: ReturnType<typeof D>, res: string) => { const c = r.c('A'); r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...c, resources: { ...c.resources, [res]: 0 } } } }; };

describe('K54b Dunganga', () => {
  it('Ninni: ücretsiz kullanım bitince 1 Büyücülük Puanı (sürüm 27); 26\'da red', () => {
    const r = D(3);
    drain(r, 'imzaNinni');
    const sp = r.c('A').resources.sorceryPoints ?? 0;
    expect(sp).toBeGreaterThan(0);
    r.do(r.use('lullaby'), low);
    expect(r.c('A').resources.sorceryPoints).toBe(sp - 1);
    expect(r.c('B').effects?.some((e) => e.name === 'Uykulu')).toBe(true);
    const old = D(3, { kuralSurumu: 26 });
    drain(old, 'imzaNinni');
    expect(old.try(old.use('lullaby'), low).ok).toBe(false);
  });
  it('Sepet: aynı anda tek sepet (yenisi eskisini bitirir), yedek 3 Büyücülük Puanı', () => {
    const r = D(6, { extra: [foe('E', o(5, 3))] });
    r.do(r.use('basket', 'B'), low);
    expect(r.c('B').conditions).toContain('Incapacitated');
    r.fresh();
    drain(r, 'imzaSepet');
    const sp = r.c('A').resources.sorceryPoints ?? 0;
    r.do(r.use('basket', 'E'), low);
    expect(r.c('A').resources.sorceryPoints).toBe(sp - 3);
    expect(r.c('E').conditions).toContain('Incapacitated');
    expect(r.c('B').effects?.some((e) => e.name === 'Sepet')).toBe(false);
    expect(replay(r.events).combatants.E?.conditions).toEqual(r.c('E').conditions);
  });
  it('Kâbus (14): korkan düşman tur başında 1d10 + CHA zihin hasarı; korkmayan almaz', () => {
    const r = D(14, { place: { B: o(12, 7) } });
    expect(r.c('A').effects?.some((e) => e.name === 'Kâbus: Korku')).toBe(true);
    expect(auraTriggerEvents(r.state, 'B', 'turnStart', mid)).toEqual([]);
    const s = { ...r.state, combatants: { ...r.state.combatants, B: { ...r.c('B'), conditions: ['Frightened'] } } };
    const ev = auraTriggerEvents(s, 'B', 'turnStart', mid);
    expect(applyEvents(s, ev).combatants.B!.hp).toBeLessThan(60);
    expect(D(14, { kuralSurumu: 26 }).c('A').effects?.some((e) => e.name === 'Kâbus: Korku')).toBe(false);
  });
  it('Dunganga Çağrısı (18): seninle hareket eden aura; tur başı Uykulu + hasar, can yenileyemez; Cesaret; Sepet bonus eylemle', () => {
    const r = D(18, { extra: [foe('E', o(5, 4))] });
    expect(r.keys()).toContain('imza:imza_dunganga/call-aura');
    expect(r.keys()).not.toContain('imza:imza_dunganga/call');
    expect(r.try(r.use('basket-swift', 'B'), low).ok).toBe(false);
    r.do(r.use('call-aura'));
    expect(r.c('B').auraNoHeal).toBe(true);
    const ev = auraTriggerEvents(r.state, 'B', 'turnStart', low);
    const s = applyEvents(r.state, ev);
    expect(s.combatants.B!.effects?.some((e) => e.name === 'Uykulu')).toBe(true);
    expect(s.combatants.B!.hp).toBeLessThan(60);
    // Kurtulan (yüksek zar) Cesaret ile bağışık olur.
    const brave = { ...r.state, combatants: { ...r.state.combatants, E: { ...r.c('E'), saves: { ...r.c('E').saves, wis: 10 } } } };
    const ok = applyEvents(brave, auraTriggerEvents(brave, 'E', 'turnStart', high));
    expect(ok.combatants.E!.effects?.some((e) => e.name === 'Cesaret')).toBe(true);
    // Çağrı sürerken Sepet bonus eylemle; yeterlilik kadar sepet.
    r.do(r.use('basket-swift', 'B'), low);
    r.fresh();
    r.do(r.use('basket', 'E'), low);
    expect(r.c('B').conditions).toContain('Incapacitated');
    expect(r.c('E').conditions).toContain('Incapacitated');
    expect(D(18, { kuralSurumu: 26 }).keys()).toContain('imza:imza_dunganga/call');
  });
  it('YZ: iki düşman yakınken Ninni, tek güçlü düşmanda Sepet', () => {
    const r = D(6, { extra: [foe('E', o(5, 3))] });
    const c = chooseCommand(r.state);
    expect(c.type === 'use_feature' && c.feature).toMatch(/imza:imza_dunganga\/(lullaby|basket)/);
    const one = D(6, { place: { B: o(6, 3) } });
    const c1 = chooseCommand(one.state);
    expect(c1.type === 'use_feature' && c1.feature).toBe('imza:imza_dunganga/basket');
  });
});
