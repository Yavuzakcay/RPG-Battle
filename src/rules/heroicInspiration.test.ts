/**
 * Görev HEROIC-INSPIRATION-TAM (SRD 5.2.1 s. 7): kâğıttaki kalıcı hak (savaş dışı, sürümsüz): bir seferde en çok bir, Game
 * Master verir (varsa aktarılır ya da kaybolur), savaş sonrası kalır, Human uzun dinlenmede kazanır.
 */
import { describe, expect, it } from 'vitest';
import { grantHeroic, hasHeroic, heroicPassTargets, withHeroic } from './heroicInspiration';
import { currentStatus, fullStatus, isRested, longRestStatus, shortRestStatus } from './characterRest';
import { blankCharacter, suggestedScores, type SavedCharacter } from './builder';
import type { CharacterSheet } from './stats';
import type { CharacterStatus } from './characterRest';

const sheet = (raceId: string): CharacterSheet => ({ ...blankCharacter('hi').sheet, name: raceId, raceId, classId: 'fighter', level: 3, baseScores: suggestedScores('fighter'), weapons: [{ name: 'Longsword' }] });
const member = (id: string, raceId: string, status?: CharacterStatus): SavedCharacter & { status: CharacterStatus } =>
  ({ ...blankCharacter(id), id, sheet: sheet(raceId), status: status ?? currentStatus(sheet(raceId)) });

describe('Heroic Inspiration kâğıtta', () => {
  it('Human dinlenmiş durumda bir hak taşır; diğer türler taşımaz', () => {
    expect(hasHeroic(fullStatus(sheet('human')))).toBe(true);
    expect(hasHeroic(fullStatus(sheet('elf')))).toBe(false);
  });
  it('Elf\'e verilen hak kâğıtta kalır (en çok 1), dinlenmiş sayılmayı bozmaz, kısa/uzun dinlenmede kalır', () => {
    const sh = sheet('elf');
    const given = withHeroic(fullStatus(sh));
    expect(currentStatus(sh, given).resources.heroicInspiration).toBe(1);
    expect(currentStatus(sh, { ...given, resources: { ...given.resources, heroicInspiration: 3 } }).resources.heroicInspiration).toBe(1);
    expect(isRested(sh, given)).toBe(true);
    expect(longRestStatus(sh, given).resources.heroicInspiration).toBe(1);
    expect(shortRestStatus(sh, given, 0, () => 0.5).status.resources.heroicInspiration).toBe(1);
    // Harcanmış hak (0) kâğıtta görünmez.
    expect(currentStatus(sh, { ...given, resources: { ...given.resources, heroicInspiration: 0 } }).resources.heroicInspiration).toBeUndefined();
  });
  it('Human Resourceful: harcanan hak uzun dinlenmede gelir, kısa dinlenmede gelmez', () => {
    const sh = sheet('human');
    const spent = { ...fullStatus(sh), resources: { ...fullStatus(sh).resources, heroicInspiration: 0 } };
    expect(shortRestStatus(sh, spent, 0, () => 0.5).status.resources.heroicInspiration).toBe(0);
    expect(longRestStatus(sh, spent).resources.heroicInspiration).toBe(1);
  });
});

describe('grantHeroic (Only One at a Time)', () => {
  const party = [member('a', 'elf'), member('b', 'dwarf'), member('c', 'human')];
  it('hakkı olmayana verilir', () => {
    const r = grantHeroic(party, 'a');
    expect(r.ok && r.outcome).toEqual({ kind: 'verildi', to: 'a' });
    expect(r.ok && r.statuses.a?.resources.heroicInspiration).toBe(1);
  });
  it('hakkı olanda: aktarılmazsa kaybolur (durum değişmez), hakkı olmayan dosta aktarılır', () => {
    const lost = grantHeroic(party, 'c');
    expect(lost.ok && lost.outcome).toEqual({ kind: 'kayboldu', from: 'c' });
    expect(lost.ok && Object.keys(lost.statuses)).toEqual([]);
    const passed = grantHeroic(party, 'c', 'b');
    expect(passed.ok && passed.outcome).toEqual({ kind: 'aktarildi', from: 'c', to: 'b' });
    expect(passed.ok && passed.statuses.b?.resources.heroicInspiration).toBe(1);
  });
  it('hakkı olana ya da kendine aktarılmaz; ölüye verilmez', () => {
    const withB = [party[0]!, { ...party[1]!, status: withHeroic(party[1]!.status) }, party[2]!];
    expect(grantHeroic(withB, 'c', 'b').ok).toBe(false);
    expect(grantHeroic(withB, 'c', 'c').ok).toBe(false);
    expect(heroicPassTargets(withB, 'c').map((m) => m.id)).toEqual(['a']);
    expect(grantHeroic([{ ...party[0]!, status: { ...party[0]!.status, dead: true } }], 'a').ok).toBe(false);
  });
});

describe('Karakter kâğıdı modeli', () => {
  it('kâğıtta hak görünür (Human dinlenmiş, Elf verilmiş), yoksa görünmez', async () => {
    const { sheetModel } = await import('../screens/sheet/sheetModel');
    expect(sheetModel(member('h', 'human'), 'tr').heroic).toBe(true);
    expect(sheetModel(member('e', 'elf'), 'tr').heroic).toBe(false);
    expect(sheetModel(member('e', 'elf', withHeroic(fullStatus(sheet('elf')))), 'tr').heroic).toBe(true);
  });
});
