/** SD8 eki: Alignment zarları kalıcı açılır, karakter başına zar seçimi, seçim otomatik değişmez, kilitliler listelenmez. */
import { describe, expect, it } from 'vitest';
import cfg from '../../data/hizalanma.json';
import { ALIGN_DICE_IDS, ALIGN_ESIK, alignDiceOf, ownedAlignDice, withAlignDice } from '../rules/alignDice';
import { ownedDice, resolveDice, savedChoice } from './diceOwn';
import { emptyStore, themeForRoll, unlock } from './diceUnlock';
import { newAlignment } from '../rules/alignment';
import { blankCharacter } from '../rules/builder';
import { loadCharacters, saveCharacters } from './storage';
import './alignDiceHook';
import { renderToStaticMarkup } from 'react-dom/server';
import { DiceStep } from '../ui/DiceStep';

const ch = (over: Partial<ReturnType<typeof blankCharacter>> = {}) => ({ ...blankCharacter('k1'), ...over });
const lg = { duzen: 40, iyilik: 40 }; // Lawful Good
const ce = { duzen: -40, iyilik: -40 }; // Chaotic Evil

describe('SD8 eki: Alignment zarları', () => {
  it('eşik sabiti hizalanma.json ile aynı', () => { expect(ALIGN_ESIK).toBe(cfg.esik); });
  it('9 kare kimliği, ızgara sırasıyla; kareden zar', () => {
    expect(ALIGN_DICE_IDS).toHaveLength(9);
    expect(new Set(ALIGN_DICE_IDS).size).toBe(9);
    expect(alignDiceOf(lg)).toBe('hizalanma-lawful-good');
    expect(alignDiceOf(ce)).toBe('hizalanma-chaotic-evil');
    expect(alignDiceOf({ duzen: 0, iyilik: 0 })).toBe('hizalanma-true-neutral');
    expect(alignDiceOf(undefined)).toBeNull();
  });
  it('başlangıç karesi açılır; kare değişince yenisi eklenir, eskisi kalır; tekrarsız', () => {
    const a = newAlignment(lg, 'otomatik');
    let c = withAlignDice(ch({ hizalanma: a }));
    expect(c.hizalanmaZarlar).toEqual(['hizalanma-lawful-good']);
    expect(withAlignDice(c)).toBe(c); // değişmedi: aynı nesne
    c = withAlignDice({ ...c, hizalanma: newAlignment(ce, 'otomatik') });
    expect(c.hizalanmaZarlar).toEqual(['hizalanma-lawful-good', 'hizalanma-chaotic-evil']);
    c = withAlignDice({ ...c, hizalanma: newAlignment(lg, 'otomatik') });
    expect(c.hizalanmaZarlar).toHaveLength(2);
  });
  it('kaydetme kancası: saveCharacters bulunduğu karenin zarını karakter kaydına ekler (kare değişince eski kalır)', () => {
    const c0 = ch({ id: 'kk', hizalanma: newAlignment(lg, 'otomatik') });
    saveCharacters([c0]);
    expect(loadCharacters()[0]?.hizalanmaZarlar).toEqual(['hizalanma-lawful-good']);
    saveCharacters([{ ...loadCharacters()[0]!, hizalanma: newAlignment(ce, 'otomatik') }]);
    expect(loadCharacters()[0]?.hizalanmaZarlar).toEqual(['hizalanma-lawful-good', 'hizalanma-chaotic-evil']);
  });
  it('ev kuralı kapalı/hizalanması olmayan karakterde açılmış zarlar kalır, yenisi açılmaz', () => {
    expect(ownedAlignDice({ hizalanma: undefined, hizalanmaZarlar: ['hizalanma-neutral-evil'] })).toEqual(['hizalanma-neutral-evil']);
    expect(ownedAlignDice({ hizalanma: undefined, hizalanmaZarlar: undefined })).toEqual([]);
  });
  it('liste: Klasik, sınıf, ırk, açılmış Alignment; açılmamış ödül zarı yok, açılmışı var', () => {
    const c = ch({ hizalanma: newAlignment(lg, 'otomatik') });
    const base = ownedDice(c, emptyStore()).map((o) => o.value);
    expect(base.slice(0, 2)).toEqual(['klasik', 'sinif']);
    expect(base).toContain('irk');
    expect(base).toContain('hizalanma-lawful-good');
    expect(base).not.toContain('dusman-ejderha');
    const { store } = unlock(emptyStore(), ['dusman-ejderha'], 'p');
    const withPrize = ownedDice(c, store);
    // profil adı etkin profil değilse görünmez; etkin profile açılınca görünür
    expect(withPrize.some((o) => o.value === 'dusman-ejderha')).toBe(false);
    const own = unlock(emptyStore(), ['dusman-ejderha']).store;
    expect(ownedDice(c, own).some((o) => o.value === 'dusman-ejderha' && o.kind === 'odul')).toBe(true);
  });
  it('seçim karakter kaydında; yoksa profil yedeği/sınıf; sahip olunmayan seçim kaydı değiştirmez, çizimde sınıfa düşer', () => {
    const c = ch({ zar: 'hizalanma-chaotic-evil' }); // hizalanması yok: sahip değil
    expect(savedChoice(c, emptyStore())).toBe('hizalanma-chaotic-evil');
    expect(resolveDice(c, emptyStore())).toBe('sinif');
    expect(c.zar).toBe('hizalanma-chaotic-evil');
    const owned = ch({ zar: 'hizalanma-lawful-good', hizalanma: newAlignment(lg, 'otomatik') });
    expect(resolveDice(owned, emptyStore())).toBe('hizalanma-lawful-good');
    expect(resolveDice(ch(), emptyStore())).toBe('sinif');
    // Alignment ev kuralı sonradan kapansa da açılmış zar seçilebilir kalır
    const kept = ch({ zar: 'hizalanma-lawful-good', hizalanmaZarlar: ['hizalanma-lawful-good'] });
    expect(resolveDice(kept, emptyStore())).toBe('hizalanma-lawful-good');
  });
  it('savaş: karakter seçimi charChoice ile çizilir, yoksa profil seçimi (görünüm; sonuç etkilenmez)', () => {
    const state = { map: undefined, combatants: { a: { id: 'a', side: 'party', ownerId: 'k1', raceId: 'human', avatar: { src: 'characters/human-male-wizard.webp' } } } } as never;
    expect(themeForRoll('a', { state, store: emptyStore(), charChoice: () => 'hizalanma-lawful-good' })).toBe('hizalanma-lawful-good');
    expect(themeForRoll('a', { state, store: emptyStore() })).toBe('sinif-wizard');
  });
  it('son ekran: açılmış zarlar listelenir, açılmamış kilitli gösterilmez', () => {
    const html = renderToStaticMarkup(<DiceStep c={ch({ hizalanma: newAlignment(lg, 'otomatik') })} setC={() => {}} />);
    expect(html).toContain('Klasik');
    expect(html).toContain('Lawful Good');
    expect(html).not.toContain('Chaotic Evil');
    expect(html).not.toContain('🔒');
  });
});
