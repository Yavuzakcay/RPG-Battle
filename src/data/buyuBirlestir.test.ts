import { describe, expect, it } from 'vitest';
import { mergeCastingTime, mergeUpcast } from '../../scripts/lib/buyu-birlestir.mjs';

// Kuyruk 41b: `npm run srd:buyu` elle yazılmış yukarı slot verisini ve süreleri ezmez, yalnızca eksikleri doldurur.
describe('srd:buyu birleştirmesi', () => {
  it('elle yazılmış upcast (durationBySlot, applied) olduğu gibi kalır', () => {
    const hand = { kind: 'effect', upcast: { durationBySlot: { '4': { rounds: 100 } }, applied: true } };
    expect(mergeUpcast(hand, { duration: true })).toEqual(hand);
  });
  it('elle yazılmış zar SRD zarıyla karışmaz (Ice Knife patlaması)', () => {
    const hand = { kind: 'attack', upcast: { burstDice: '1d6', applied: true } };
    expect(mergeUpcast(hand, { dice: '1d6' }).upcast).toEqual({ burstDice: '1d6', applied: true });
  });
  it('upcast yoksa SRD tanımı yazılır; ikisi de yoksa alan eklenmez', () => {
    expect(mergeUpcast({ kind: 'save' }, { dice: '1d8' }).upcast).toEqual({ dice: '1d8' });
    expect('upcast' in mergeUpcast({ kind: 'save' }, null)).toBe(false);
  });
  it('eski upcastDice işareti applied olarak taşınır', () => {
    const m = mergeUpcast({ kind: 'save', upcastDice: true }, { dice: '1d6' });
    expect(m.upcast).toEqual({ dice: '1d6', applied: true });
    expect('upcastDice' in m).toBe(false);
  });
  it('döküm süresi: ritüel ve savaş dışı uzun süreler korunur, eylem/bonus/tepki eşitlenir', () => {
    expect(mergeCastingTime('ritual', '1 minute')).toBe('ritual');
    expect(mergeCastingTime('action', '10 minutes')).toBe('action');
    expect(mergeCastingTime('action', 'bonus')).toBe('bonus');
    expect(mergeCastingTime(undefined, 'ritual')).toBe('ritual');
  });
});
