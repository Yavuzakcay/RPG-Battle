/** Kuyruk K75b: jeton yönü saf işlevi (yalnız görünüm). */
import { describe, expect, it } from 'vitest';
import { mk } from '../battle/fixtures';
import type { Combatant } from '../battle/types';
import { facesLeft } from './tokenFacing';

const at = (id: string, col: number, extra: Partial<Combatant> = {}, row = 3): Combatant =>
  ({ ...mk(id, extra), pos: { col, row } }) as Combatant;
const world = (...cs: Combatant[]) => Object.fromEntries(cs.map((c) => [c.id, c]));
const W = 1000;

describe('facesLeft (K75b)', () => {
  it('parti jetonu düşman solundaysa sola, sağındaysa sağa bakar; karşılıklı', () => {
    const p = at('P', 8);
    const left = at('E', 2, { side: 'enemies' });
    const right = at('E', 12, { side: 'enemies' });
    expect(facesLeft(world(p, left), p, W)).toBe(true);
    expect(facesLeft(world(p, right), p, W)).toBe(false);
    // Düşman jetonu aynı kuralla partiye döner.
    expect(facesLeft(world(p, left), left, W)).toBe(false);
    expect(facesLeft(world(p, right), right, W)).toBe(true);
  });
  it('en yakın düşman seçilir (uzaktaki sağdaki yoksayılır)', () => {
    const p = at('P', 8);
    const near = at('E1', 6, { side: 'enemies' });
    const far = at('E2', 14, { side: 'enemies' });
    expect(facesLeft(world(p, near, far), p, W)).toBe(true);
  });
  it('eşit uzaklıkta zıt yönlerde iki düşman: önceki yön korunur', () => {
    const p = at('P', 8);
    const a = at('E1', 5, { side: 'enemies' });
    const b = at('E2', 11, { side: 'enemies' });
    expect(facesLeft(world(p, a, b), p, W, true)).toBe(true);
    expect(facesLeft(world(p, a, b), p, W, false)).toBe(false);
  });
  it('düşman yok: önceki yön, o da yoksa harita ortasına göre', () => {
    const p = at('P', 14);
    const q = at('Q', 1);
    expect(facesLeft(world(p), p, W, false)).toBe(false);
    expect(facesLeft(world(p), p, W)).toBe(true);
    expect(facesLeft(world(q), q, W)).toBe(false);
  });
  it('ölü ve sivil karşı taraf sayılmaz; çağrılan yaratık tarafıyla döner', () => {
    const p = at('P', 8);
    const dead = at('D', 2, { side: 'enemies', hp: 0 });
    const civ = at('C', 3, { side: 'enemies', civilian: true } as Partial<Combatant>);
    const foe = at('E', 12, { side: 'enemies' });
    expect(facesLeft(world(p, dead, civ, foe), p, W)).toBe(false);
    const summon = at('S', 9, { side: 'party', ownerId: 'P' } as Partial<Combatant>);
    expect(facesLeft(world(p, summon, foe), summon, W)).toBe(false);
    const foeL = at('E', 1, { side: 'enemies' });
    expect(facesLeft(world(p, summon, foeL), summon, W)).toBe(true);
  });
});
