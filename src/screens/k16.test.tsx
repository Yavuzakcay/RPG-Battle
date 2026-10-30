/** Görev K16: Puanlar adımı (standart dizi): açıklama, sınıfa göre öneri, sıfırlama, takas; diğer yöntemler; taşıma kapasitesi. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { assignScore, blankCharacter, characterProblems, resetScores, rolledScores, suggestScores, suggestedScores, type SavedCharacter } from '../rules/builder';
import { carryLoad } from '../rules/carry';

const html = (c: SavedCharacter) => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step="scores" />);
const sc = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };

describe('Puanlar adımı', () => {
  it('takas: başka karttaki değer seçili karta geçer, seçili kartın eski değeri o karta', () => {
    expect(assignScore('standard', sc, 'cha', 15)).toEqual({ ...sc, cha: 15, str: 8 });
    expect(assignScore('roll', { ...sc, dex: 15, str: 14 }, 'wis', 14)).toEqual({ ...sc, dex: 15, str: 10, wis: 14 });
    // Puan satın almada takas yok: doğrudan yazılır.
    expect(assignScore('pointBuy', sc, 'cha', 15)).toEqual({ ...sc, cha: 15 });
  });
  it('sınıfa göre öner: SRD önerisi (Wizard INT 15); zarla atılanlarda büyükten küçüğe; puan satın almada yok', () => {
    expect(suggestScores('standard', 'wizard')).toEqual(suggestedScores('wizard'));
    expect(suggestScores('standard', 'wizard')?.int).toBe(15);
    expect(suggestScores('roll', 'fighter', [9, 17, 12, 14, 8, 11])).toEqual(rolledScores('fighter', [9, 17, 12, 14, 8, 11]));
    expect(suggestScores('pointBuy', 'wizard')).toBeNull();
  });
  it('sıfırla: standartta STR→CHA 15…8, zarla büyükten küçüğe, puan satın almada 8', () => {
    expect(resetScores('standard')).toEqual(sc);
    expect(resetScores('roll', [9, 17, 12, 14, 8, 11])).toEqual({ str: 17, dex: 14, con: 12, int: 11, wis: 9, cha: 8 });
    expect(resetScores('pointBuy')).toEqual({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
  });
  it('ekranda açıklama, öner ve sıfırla düğmeleri, çip notu; puan satın almada çip ve öneri yok', () => {
    const c = blankCharacter('k16');
    const m = html(c);
    expect(m).toContain('Bu altı değeri yeteneklere birer kez dağıt: 15, 14, 13, 12, 10, 8.');
    expect(m).toContain('Sınıfa göre öner');
    expect(m).toContain('Sıfırla');
    expect(m).toContain('hangi kartta');
    const pb = html({ ...c, method: 'pointBuy', sheet: { ...c.sheet, baseScores: resetScores('pointBuy') } });
    expect(pb).not.toContain('Sınıfa göre öner');
    expect(pb).toContain('stepper');
    const roll = html({ ...c, method: 'roll', rolled: [9, 17, 12, 14, 8, 11], sheet: { ...c.sheet, baseScores: rolledScores('fighter', [9, 17, 12, 14, 8, 11]) } });
    expect(roll).toContain('Atılan altı değeri');
    expect(characterProblems({ ...c, method: 'roll', rolled: [9, 17, 12, 14, 8, 11], sheet: { ...c.sheet, baseScores: assignScore('roll', rolledScores('fighter', [9, 17, 12, 14, 8, 11]), 'cha', 17) } }).join())
      .not.toContain('Atılan altı değer');
  });
  it('taşıma kapasitesi Güç skoruna bağlı (Güç 8 → 120 lb, Güç 18 → 270 lb)', () => {
    const s = blankCharacter('k16').sheet;
    expect(carryLoad({ ...s, baseScores: { ...s.baseScores, str: 8 }, backgroundBonuses: {} }, 'srd').capacity).toBe(120);
    expect(carryLoad({ ...s, baseScores: { ...s.baseScores, str: 15 }, backgroundBonuses: { str: 2, con: 1 }, advancements: [{ level: 4, featId: 'ability-score-improvement', abilities: { str: 1 } }], level: 4 }, 'srd').capacity).toBe(270);
  });
});
