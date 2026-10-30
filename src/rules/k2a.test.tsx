/**
 * Görev K2a: "Zarla 4d6" (SRD 5.2.1 Random Generation): 6 kez 4d6, en düşük zar atılır. Tohumlu Rng'de sabit sonuç,
 * elle zar defterinde her grup istenir (masa zarı), kutulara standart dizi gibi dağıtılır, yeniden atma yok.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { seededRng } from './dice';
import { enterDice, newBook, runWithDice, type DiceBook } from './manualDice';
import { blankCharacter, characterIssues, rollAbilityScores, rolledScores, usesRolled, type SavedCharacter } from './builder';
import { Builder } from '../screens/Builder';

describe('4d6 en düşük atılır', () => {
  it('sabit tohumla aynı altı değer; her değer 3–18', () => {
    const a = rollAbilityScores(seededRng(42));
    expect(a).toEqual(rollAbilityScores(seededRng(42)));
    expect(a).toHaveLength(6);
    for (const v of a) { expect(v).toBeGreaterThanOrEqual(3); expect(v).toBeLessThanOrEqual(18); }
    expect(a).toMatchInlineSnapshot(`
      [
        15,
        10,
        15,
        11,
        12,
        11,
      ]
    `);
  });
  it('elle zar defteri: altı kez 4d6 istenir (kind ability), girilen zarlardan en düşüğü atılır', () => {
    const groups = [[6, 6, 6, 1], [5, 4, 3, 2], [1, 1, 1, 1], [6, 5, 4, 3], [2, 2, 3, 6], [4, 4, 4, 4]];
    let book: DiceBook = newBook();
    const asked: number[] = [];
    for (;;) {
      const r = runWithDice(rollAbilityScores, book, { ask: () => true, auto: seededRng(1) });
      if (r.ok) { expect(r.value).toEqual([18, 12, 3, 15, 11, 12]); break; }
      expect(r.need).toMatchObject({ sides: 6, count: 4, kind: 'ability' });
      book = enterDice(book, r.need, groups[asked.length] as number[]);
      asked.push(1);
    }
    expect(asked).toHaveLength(6);
  });
});

describe('sihirbaz', () => {
  const rolled = [18, 12, 3, 15, 11, 12];
  const ch = (patch: Partial<SavedCharacter> = {}): SavedCharacter => {
    const c = blankCharacter('k2a');
    return { ...c, classSkills: ['athletics', 'perception'], sheet: { ...c.sheet, name: 'Zar' }, ...patch };
  };
  it('değerler sınıf önceliğiyle dağıtılır; dağılım denetimi; zar atılmadan eksik', () => {
    const scores = rolledScores('fighter', rolled);
    expect(scores.str).toBe(18);
    expect(usesRolled(scores, rolled)).toBe(true);
    const ok = ch({ method: 'roll', rolled, sheet: { ...ch().sheet, baseScores: scores } });
    expect(characterIssues(ok).filter((i) => i.step === 'scores')).toEqual([]);
    const notYet = ch({ method: 'roll' });
    expect(characterIssues(notYet).map((i) => i.text)).toContain('Skorlar için zar atılmalı (4d6).');
    const wrong = ch({ method: 'roll', rolled, sheet: { ...ch().sheet, baseScores: { ...scores, str: 17 } } });
    expect(characterIssues(wrong).map((i) => i.text)).toContain('Atılan altı değer her skora bir kez dağıtılmalı.');
  });
  it('Puanlar adımı: atılmamışsa iki düğme; atılmışsa yeniden atma düğmesi yok, altı değer çipi (tekrarlı değer ayrı)', () => {
    const before = renderToStaticMarkup(<Builder initial={ch({ method: 'roll' })} onSave={() => {}} onCancel={() => {}} step="scores" />);
    expect(before).toContain('Zarları at');
    expect(before).toContain('Masa zarıyla gir');
    const after = renderToStaticMarkup(<Builder initial={ch({ method: 'roll', rolled, sheet: { ...ch().sheet, baseScores: rolledScores('fighter', rolled) } })}
      onSave={() => {}} onCancel={() => {}} step="scores" />);
    expect(after).not.toContain('Zarları at');
    expect(after).toContain('Atılan değerler: 18, 12, 3, 15, 11, 12');
    expect((after.match(/class="value-chip/g) ?? []).length).toBe(6);
    // Hepsi bir kutuda: seçili kutunun (STR) çipi açık, diğer beşi başka kutuda.
    expect((after.match(/class="value-chip on"/g) ?? []).length).toBe(1);
    expect((after.match(/class="value-chip used"/g) ?? []).length).toBe(5);
  });
});
