/**
 * Kuyruk S2 §5: paket silah modeli (kurgusal fikstür `tests/fixtures/paket-s2.json`; kural sürümü 41). `silahFirlat`
 * (yakın dövüş silahına fırlatma seçeneği, ele döner) ve `silahBagi` (zorla düşmez, yerden ele çağrılır); eski sürümde
 * etkisiz; uçtan uca komutlar baştan oynatılınca aynı durum.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import s2 from '../../../tests/fixtures/paket-s2.json';
import { validatePack } from '../../content/schema';
import { applyPackSubclasses } from '../../content/paket';
import { classData } from '../../data';
import { kitArena, o } from '../k54bKit';
import { replay } from '../reduce';
import { dropEvents } from '../heldItems';
import type { Combatant } from '../types';

beforeEach(() => {
  const r = validatePack(s2, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  applyPackSubclasses(r.pack.subclasses);
});
afterEach(() => applyPackSubclasses([]));

const arena = (kuralSurumu?: number) => kitArena({ cls: 'fighter', sub: 'bag-muhafizi', level: 5, sheet: { weapons: [{ name: 'Longsword' }] } as never, place: { A: o(3, 3), B: o(6, 3) }, ...(kuralSurumu ? { kuralSurumu } : {}) });
const same = (r: ReturnType<typeof arena>) => expect(JSON.stringify(replay(r.events).combatants)).toBe(JSON.stringify(r.state.combatants));

describe('S2 paket silah modeli', () => {
  it('silahFirlat: uzun kılıç fırlatılır (20/60 ft), saldırıdan sonra elde kalır', () => {
    const r = arena();
    const opt = r.c('A').weaponOptions.findIndex((x) => x.returns);
    expect(opt).toBeGreaterThanOrEqual(0);
    expect(r.c('A').weaponOptions[opt]).toMatchObject({ weaponId: 'longsword', ranged: true, range: [20, 60] });
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: r.c('A').weaponOptions[opt] } as never);
    expect(r.c('A').weaponOptions.some((x) => x.returns)).toBe(true);
    expect(r.c('A').dropped ?? []).toEqual([]);
    same(r);
  });
  it('silahBagi: zorla bırakma düşürmez; elle bırakılan silah bonus eylemle uzaktan ele döner', () => {
    const r = arena();
    expect(r.c('A').bonded).toEqual(['longsword']);
    expect(dropEvents(r.state, r.c('A'), 'longsword', 'test', true)).toEqual([]);
    r.do({ type: 'drop_item', actorId: 'A', item: 'longsword' });
    expect(r.c('A').dropped).toEqual(['longsword']);
    // Uzaklaş: bağsız alma bitişik ister.
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), pos: o(10, 5) } as Combatant } };
    r.events.push({ type: 'moved', actorId: 'A', path: [o(10, 5)], to: o(10, 5) } as never);
    const ev = r.do({ type: 'use_feature', actorId: 'A', feature: 'pk:bag-muhafizi/kilic-bagi:bonus' } as never);
    expect(ev.some((e) => e.type === 'item_picked' && e.bond)).toBe(true);
    expect(r.c('A').dropped ?? []).toEqual([]);
    expect(r.c('A').weaponOptions.some((x) => x.weaponId === 'longsword' && !x.ranged)).toBe(true);
    expect(r.c('A').economy.interacted).toBeFalsy();
  });
  it('sürüm 40: ikisi de yok', () => {
    const r = arena(40);
    expect(r.c('A').weaponOptions.some((x) => x.returns)).toBe(false);
    expect(r.c('A').bonded).toBeUndefined();
  });
});
