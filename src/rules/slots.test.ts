/**
 * H-SLOT: büyü yuvaları. Her sınıf ve seviye için SRD 5.2.1 tablosu (tam, yarım, Pact Magic), sihirbazla oluşturulan
 * yarım büyücünün savaşta yuvası, kayıtlı durumda sınıf/seviye değişince yuvaların gelmesi, eski kayıt onarımı.
 */
import { describe, expect, it } from 'vitest';
import { classes } from '../data';
import { spellSlotsFor } from './stats';
import { blankCharacter, suggestedScores, type SavedCharacter } from './builder';
import { currentStatus, fullStatus, longRestStatus, repairSlots, type CharacterStatus } from './characterRest';
import { combatantFromSheet } from '../battle/create';
import { withStatus } from '../app/partyStatus';

const pad = (a: number[]) => [...a, ...Array(9 - a.length).fill(0)];
const FULL: Record<number, number[]> = {
  1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2], 6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1], 10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1], 13: [4, 3, 3, 3, 2, 1, 1], 14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1], 17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1], 20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};
const HALF: Record<number, number[]> = {
  1: [2], 2: [2], 3: [3], 4: [3], 5: [4, 2], 6: [4, 2], 7: [4, 3], 8: [4, 3], 9: [4, 3, 2], 10: [4, 3, 2], 11: [4, 3, 3], 12: [4, 3, 3],
  13: [4, 3, 3, 1], 14: [4, 3, 3, 1], 15: [4, 3, 3, 2], 16: [4, 3, 3, 2], 17: [4, 3, 3, 3, 1], 18: [4, 3, 3, 3, 1], 19: [4, 3, 3, 3, 2], 20: [4, 3, 3, 3, 2],
};
/** Pact Magic: slot sayısı ve seviyesi. */
const pact = (l: number) => { const s = pad([]); s[(l < 3 ? 1 : l < 5 ? 2 : l < 7 ? 3 : l < 9 ? 4 : 5) - 1] = l < 2 ? 1 : l < 11 ? 2 : l < 17 ? 3 : 4; return s; };

const sheetOf = (classId: string, level: number) => ({ ...blankCharacter('x').sheet, name: 'Yuva', classId, level, baseScores: suggestedScores(classId) });
const saved = (classId: string, level: number, status?: CharacterStatus): SavedCharacter =>
  ({ ...blankCharacter('x'), sheet: sheetOf(classId, level), ...(status ? { status } : {}) });

describe('yuva tablosu (SRD 5.2.1)', () => {
  it('her sınıf ve seviye 1–20', () => {
    for (const c of classes) for (let level = 1; level <= 20; level++) {
      const want = c.casting === null ? pad([]) : c.casting.type === 'full' ? pad(FULL[level] ?? []) : c.casting.type === 'half' ? pad(HALF[level] ?? []) : pact(level);
      expect(spellSlotsFor(c.id, level), `${c.id} ${level}`).toEqual(want);
    }
    expect(classes.filter((c) => c.casting?.type === 'half').map((c) => c.id).sort()).toEqual(['paladin', 'ranger']);
  });
});

describe('yarım büyücü savaşta', () => {
  it('sihirbazla oluşturulan Ranger ve Paladin (1, 3, 5) yuvayla girer', () => {
    for (const cls of ['ranger', 'paladin']) for (const level of [1, 3, 5]) {
      const c = saved(cls, level);
      const pc = withStatus(combatantFromSheet(c.sheet, { id: 'pc1', ownerId: c.id }), c);
      expect(pc.spellSlots, `${cls} ${level}`).toEqual(pad(HALF[level] ?? []));
    }
  });
  it('başka sınıfta kaydedilmiş durum (Fighter → Ranger) ve seviye atlama: kazanılan yuvalar dolu, harcanan düşer', () => {
    const asFighter = fullStatus(sheetOf('fighter', 5));
    const ranger = saved('ranger', 5, asFighter);
    expect(withStatus(combatantFromSheet(ranger.sheet, { id: 'pc1', ownerId: 'x' }), ranger).spellSlots).toEqual(pad([4, 2]));
    // 1. seviyede 2 yuvadan 1'i harcandı; 5. seviyeye çıkınca 4 − 1 = 3 ve 2.
    const lvl1 = { ...fullStatus(sheetOf('ranger', 1)), slots: pad([1]) };
    expect(currentStatus(sheetOf('ranger', 5), lvl1).slots).toEqual(pad([3, 2]));
    expect(longRestStatus(sheetOf('ranger', 5), lvl1).slots).toEqual(pad([4, 2]));
  });
});

describe('eski kayıt onarımı', () => {
  it('slot en çoğu olmayan durumda yuvalar tamamlanır; yalnızca eksik olanlar not edilir; ikinci açılışta değişmez', () => {
    const old = (slots: number[]): CharacterStatus => ({ hp: 10, hitDiceSpent: 0, resources: {}, slots: pad(slots) });
    const list = [
      saved('ranger', 5, old([])),
      saved('paladin', 3, old([3])),
      saved('fighter', 3, old([])),
      saved('wizard', 3),
    ];
    const r = repairSlots(list);
    expect(r.repaired).toEqual(['Yuva']);
    expect(r.list[0]?.status?.slots).toEqual(pad([4, 2]));
    expect(r.list[0]?.status?.slotMax).toEqual(pad([4, 2]));
    expect(r.list[0]?.status?.hp).toBe(10);
    expect(r.list[1]?.status?.slots).toEqual(pad([3]));
    expect(r.list[3]).toBe(list[3]);
    const again = repairSlots(r.list);
    expect(again.list).toBe(r.list);
    expect(again.repaired).toEqual([]);
  });
});
