/**
 * Görev K10: sınıf kaynakları ve HP için H-SLOT kalıbı. Kayıtta en çok + kalan; seviye atlayınca yalnızca harcanan
 * düşer (kaynak 0'da ya da eski en çokta takılmaz), yeni kaynak dolu gelir; eski kayıtlar açılışta bir kez onarılır.
 */
import { describe, expect, it } from 'vitest';
import { blankCharacter, suggestedScores, type SavedCharacter } from './builder';
import { currentStatus, fullStatus, repairSlots, type CharacterStatus } from './characterRest';
import { combatantFromSheet } from '../battle/create';
import { withStatus } from '../app/partyStatus';

const sheetOf = (classId: string, level: number) => ({ ...blankCharacter('x').sheet, name: 'Kaynak', classId, level, baseScores: suggestedScores(classId) });

describe('seviye atlama', () => {
  it('Barbarian 2 → 3: Rage 2 → 3; bütün Rage harcanmışsa yeni hak gelir (sıfırda takılmaz)', () => {
    const lvl2 = fullStatus(sheetOf('barbarian', 2));
    expect(lvl2.resources.rage).toBe(2);
    const spent: CharacterStatus = { ...lvl2, resources: { ...lvl2.resources, rage: 0 } };
    const lvl3 = currentStatus(sheetOf('barbarian', 3), spent);
    expect(lvl3.resources.rage).toBe(1);
    // Hiç harcanmamışsa yeni en çok: 3 (eski kalıpta 2'de kalıyordu).
    expect(currentStatus(sheetOf('barbarian', 3), lvl2).resources.rage).toBe(3);
  });
  it('yeni kazanılan kaynak dolu gelir; savaşa bu durumla girilir', () => {
    const lvl1 = { ...fullStatus(sheetOf('fighter', 1)), resources: { secondWind: 0 } };
    const s2 = sheetOf('fighter', 2);
    const cur = currentStatus(s2, lvl1);
    expect(cur.resources.actionSurge).toBe(1);
    expect(cur.resources.secondWind).toBe((fullStatus(s2).resources.secondWind ?? 0) - (fullStatus(sheetOf('fighter', 1)).resources.secondWind ?? 0));
    const ch: SavedCharacter = { ...blankCharacter('x'), sheet: s2, status: lvl1 };
    expect(withStatus(combatantFromSheet(s2, { id: 'pc', ownerId: 'x' }), ch).resources.actionSurge).toBe(1);
  });
  it('HP: seviye atlayınca alınan hasar kadar eksik; 0 HP 0 kalır', () => {
    const f1 = fullStatus(sheetOf('fighter', 1));
    const hurt = { ...f1, hp: f1.hp - 3 };
    const f3 = fullStatus(sheetOf('fighter', 3));
    expect(currentStatus(sheetOf('fighter', 3), hurt).hp).toBe(f3.hp - 3);
    expect(currentStatus(sheetOf('fighter', 3), { ...f1, hp: 0 }).hp).toBe(0);
  });
});

describe('eski kayıt onarımı', () => {
  it('en çoğu olmayan durumda kaynaklar tabloya tamamlanır, HP en çoğu yazılır; ikinci açılışta değişmez', () => {
    const old: CharacterStatus = { hp: 20, hitDiceSpent: 0, resources: { rage: 0 }, slots: Array(9).fill(0), slotMax: Array(9).fill(0) };
    const list: SavedCharacter[] = [{ ...blankCharacter('a'), sheet: sheetOf('barbarian', 3), status: old }];
    const r = repairSlots(list);
    expect(r.repaired).toEqual(['Kaynak']);
    expect(r.list[0]?.status?.resources.rage).toBe(3);
    expect(r.list[0]?.status?.resourceMax?.rage).toBe(3);
    expect(r.list[0]?.status?.hpMax).toBe(fullStatus(sheetOf('barbarian', 3)).hp);
    expect(r.list[0]?.status?.hp).toBe(20);
    const again = repairSlots(r.list);
    expect(again.list).toBe(r.list);
    expect(again.repaired).toEqual([]);
  });
});
