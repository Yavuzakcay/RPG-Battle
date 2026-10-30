import { describe, expect, it } from 'vitest';
import { scripted } from '../battle/fixtures';
import { currentStatus, fullStatus, isRested, longRestStatus, shortRestStatus, type CharacterStatus } from './characterRest';
import { PARTY } from '../sim/balance';
import { applyBattleResult, statusBlock, withStatus } from '../app/partyStatus';
import { blankCharacter, type SavedCharacter } from './builder';
import { combatantFromSheet, type BattleState } from '../battle';

const bor = PARTY[0]!; // 5. seviye Fighter (d10, CON 15 → +2)
const kael = PARTY[4]!; // 5. seviye Ranger

describe('savaşlar arası durum ve dinlenme', () => {
  it('durum yoksa tam: HP, kaynaklar, slotlar', () => {
    const f = fullStatus(bor);
    expect(f).toMatchObject({ hitDiceSpent: 0, resources: { actionSurge: 1, secondWind: 3 } });
    expect(isRested(bor, undefined)).toBe(true);
    expect(currentStatus(kael, undefined).resources.favoredEnemy).toBe(3);
  });
  it('kısa dinlenme: HP zarı + CON iyileştirir, Second Wind birini ve Action Surge\'ü geri verir', () => {
    const hurt: CharacterStatus = { hp: 10, hitDiceSpent: 0, resources: { actionSurge: 0, secondWind: 0 }, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] };
    const r = shortRestStatus(bor, hurt, 2, scripted([10, 6], [10, 4]));
    expect(r.rolls).toEqual([6, 4]);
    expect(r.healed).toBe(6 + 2 + 4 + 2);
    expect(r.status).toMatchObject({ hp: 24, hitDiceSpent: 2, resources: { actionSurge: 1, secondWind: 1 } });
    // Favored Enemy yalnızca uzun dinlenmede.
    expect(shortRestStatus(kael, { ...fullStatus(kael), resources: { favoredEnemy: 0 } }, 0, scripted()).status.resources.favoredEnemy).toBe(0);
  });
  it('uzun dinlenme her şeyi doldurur, harcanan HP zarlarının yarısı geri gelir; ölü dirilmez', () => {
    const spent: CharacterStatus = { hp: 1, hitDiceSpent: 4, resources: { actionSurge: 0, secondWind: 0 }, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] };
    const r = longRestStatus(bor, spent);
    expect(r).toEqual({ ...fullStatus(bor), hitDiceSpent: 2 });
    expect(longRestStatus(bor, { ...spent, dead: true }).dead).toBe(true);
  });
  it('savaşa durumla başlanır; biten savaşın sonucu karaktere yazılır', () => {
    const ch: SavedCharacter = { ...blankCharacter('k1'), sheet: bor, status: { hp: 12, hitDiceSpent: 1, resources: { actionSurge: 0, secondWind: 2 }, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] } };
    const c = withStatus(combatantFromSheet(bor, { id: 'pc1', ownerId: 'k1' }), ch);
    expect(c).toMatchObject({ hp: 12, resources: { actionSurge: 0, secondWind: 2 } });
    const state = { status: 'finished', combatants: { pc1: { ...c, hp: 5, resources: { actionSurge: 0, secondWind: 1 } } } } as unknown as BattleState;
    const [after] = applyBattleResult([ch], state);
    expect(after?.status).toEqual({ hp: 5, hitDiceSpent: 1, resources: { actionSurge: 0, secondWind: 1 }, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      slotMax: [0, 0, 0, 0, 0, 0, 0, 0, 0], resourceMax: fullStatus(bor).resourceMax, hpMax: fullStatus(bor).hpMax }); // K10: en çoklar da yazılır
    const dead = applyBattleResult([ch], { ...state, combatants: { pc1: { ...c, hp: 0, life: 'dead' } } } as unknown as BattleState);
    expect(statusBlock(dead[0]!)).toBe('dead');
    expect(applyBattleResult([ch], { ...state, status: 'active' } as BattleState)).toEqual([ch]);
  });
});
