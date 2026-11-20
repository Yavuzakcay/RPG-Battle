/** Görev B93 (A2): Serüven seviye atlama / uzun dinlenme seçimleri (ortak yardımcı; sınıflar `data/secim-degisim.json`). */
import { describe, expect, it } from 'vitest';
import { blankCharacter, suggestedScores } from './builder';
import { changeCounts, choicesBound, fitChanges, ruleFor } from './levelChoices';
import { recommendedSpells } from '../screens/builderDefaults';
import { choiceIssues, executeSeruven, type SeruvenState } from '../journey/seruven';
import type { CharacterSheet } from './stats';

const SUB: Record<string, string> = { cleric: 'life-domain', sorcerer: 'draconic-sorcery', wizard: 'evoker', warlock: 'fiend-patron', fighter: 'champion' };
const sheetOf = (classId: string, level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => {
  const base: CharacterSheet = { ...blankCharacter('x').sheet, name: 'Deneme', classId, level, baseScores: suggestedScores(classId), subclassId: SUB[classId],
    ...(classId === 'sorcerer' ? { metamagic: ['careful', 'distant'] } : {}), ...patch };
  return { ...base, ...recommendedSpells(base), ...patch };
};
const begin = (sheet: CharacterSheet, extra: Partial<SeruvenState> = {}): SeruvenState => {
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party: [{ id: 'p1', name: 'Deneme', sheet }], toggles: { irkBaslangic: false } });
  if (!r.ok) throw new Error(r.error);
  return { ...r.state, ...extra };
};
/** Sayfaya bakan büyü sorunları (sınıf becerileri sayfada tutulmaz: sarmalayıcıda hep eksik görünür). */
const spellIssues = (s: CharacterSheet) => choiceIssues(s).filter((x) => !x.startsWith('Sınıf becerileri'));
const cantrips = (s: CharacterSheet) => (s.spellNames ?? []).filter((n) => ['Fire Bolt', 'Light', 'Mage Hand', 'Prestidigitation', 'Ray of Frost', 'Shocking Grasp', 'Minor Illusion', 'Sacred Flame', 'Guidance', 'Thaumaturgy', 'Eldritch Blast', 'Toll the Dead', 'Spare the Dying', 'Resistance', 'Mending', 'Message', 'Acid Splash', 'Chill Touch', 'Poison Spray', 'Blade Ward', 'Friends', 'True Strike', 'Word of Radiance', 'Sorcerous Burst', 'Dancing Lights', 'Elementalism', 'Shillelagh', 'Starry Wisp', 'Thunderclap'].includes(n));

describe('A2: seçim değişimi kuralları (veriden)', () => {
  it('yalnız verisi olan sınıflar bağlı (Cleric, Sorcerer, Wizard, Warlock); kural kodda sınıf adı olmadan veriden', () => {
    for (const c of ['cleric', 'sorcerer', 'wizard', 'warlock']) expect(choicesBound(c)).toBe(true);
    for (const c of ['bard', 'druid', 'ranger', 'paladin', 'fighter']) expect(choicesBound(c)).toBe(false);
    expect(ruleFor('cleric', 'hazir').dinlenme).toBe('hepsi');
    expect(ruleFor('warlock', 'secenek:warlock:mystic-arcanum/6').seviye).toBe(1);
    expect(ruleFor('warlock', 'secenek:warlock/fiend:fiendish-resilience').dinlenme).toBe('hepsi');
  });
  it('değişim sayımı: cantrip ve hazır büyü ayrı; sayıya sığmayan reddedilir', () => {
    const a = sheetOf('sorcerer', 3);
    const counts = changeCounts(a, { ...a, spellNames: (a.spellNames ?? []).slice(1) });
    expect(Object.values(counts).reduce((n, x) => n + x, 0)).toBe(1);
    expect(fitChanges('sorcerer', { cantrip: 2 }, { seviye: true, dinlenme: false }, {}).ok).toBe(false);
    expect(fitChanges('sorcerer', { cantrip: 1 }, { seviye: true, dinlenme: false }, {}).ok).toBe(true);
    expect(fitChanges('sorcerer', { cantrip: 1 }, { seviye: true, dinlenme: false }, { seviye: { cantrip: 1 } }).ok).toBe(false);
    expect(fitChanges('sorcerer', { cantrip: 1 }, { seviye: false, dinlenme: true }, {}).ok).toBe(false);
    expect(fitChanges('cleric', { hazir: 5 }, { seviye: false, dinlenme: true }, {}).ok).toBe(true);
    // Yazılmayan alan yalnız eklenir (Expertise, büyü kitabı).
    expect(fitChanges('wizard', { spellbook: 1 }, { seviye: true, dinlenme: true }, {}).ok).toBe(false);
  });
});

describe('A2: Serüven set_choices', () => {
  it('seviye atlamada yeni seçim eklenir ve kaydedilir; bir cantrip değişimi; ikincisi reddedilir', () => {
    const sh = sheetOf('sorcerer', 3);
    expect(spellIssues(sh)).toEqual([]);
    let s = begin(sh, { xp: 999999, toggles: { irkBaslangic: false, seviyeAtlama: true } });
    const lv = executeSeruven(s, { type: 'level_up' });
    expect(lv.ok).toBe(true);
    if (!lv.ok) return;
    s = lv.state;
    const m = s.party[0]!.sheet;
    expect(m.level).toBe(4);
    // 4. seviye: +1 cantrip, +1 hazır büyü (SRD tablosu); eksik varken yeni seçim eklenebilir.
    const own = cantrips(m);
    const newC = ['Ray of Frost', 'Shocking Grasp', 'Mage Hand', 'Light', 'Prestidigitation', 'Fire Bolt', 'Minor Illusion', 'Acid Splash', 'Chill Touch'].filter((n) => !own.includes(n));
    const add = executeSeruven(s, { type: 'set_choices', memberId: 'p1', sheet: { spellNames: [...(m.spellNames ?? []), newC[0]!] } });
    expect(add.ok).toBe(true);
    if (!add.ok) return;
    expect(add.state.party[0]!.sheet.spellNames).toContain(newC[0]);
    // Bir cantrip değişimi (seviye penceresi).
    const cur = add.state.party[0]!.sheet.spellNames ?? [];
    const swap1 = executeSeruven(add.state, { type: 'set_choices', memberId: 'p1', sheet: { spellNames: cur.map((n) => (n === own[0] ? newC[1]! : n)) } });
    expect(swap1.ok).toBe(true);
    if (!swap1.ok) return;
    const cur2 = swap1.state.party[0]!.sheet.spellNames ?? [];
    const swap2 = executeSeruven(swap1.state, { type: 'set_choices', memberId: 'p1', sheet: { spellNames: cur2.map((n) => (n === own[1] ? newC[2]! : n)) } });
    expect(swap2.ok).toBe(false);
    // Liste dışı büyü (oluşturucu kuralı) reddedilir.
    const bad = executeSeruven(add.state, { type: 'set_choices', memberId: 'p1', sheet: { spellNames: [...cur, 'Cure Wounds'] } });
    expect(bad.ok).toBe(false);
  });
  it('Cleric: uzun dinlenmeden sonra hazır listenin hepsi değişir; dinlenmeden önce değişmez; Serüven başında değişim yok', () => {
    const sh = sheetOf('cleric', 3);
    expect(spellIssues(sh)).toEqual([]);
    const lvl = (sh.spellNames ?? []).filter((n) => !cantrips(sh).includes(n));
    const pool = ['Bless', 'Cure Wounds', 'Guiding Bolt', 'Healing Word', 'Shield of Faith', 'Command', 'Inflict Wounds', 'Sanctuary', 'Detect Magic', 'Bane'].filter((n) => !lvl.includes(n));
    const swapped = (sh.spellNames ?? []).map((n) => { const i = lvl.indexOf(n); return i >= 0 && i < 2 ? pool[i]! : n; });
    const s0 = begin(sh);
    expect(executeSeruven(s0, { type: 'set_choices', memberId: 'p1', sheet: { spellNames: swapped } }).ok).toBe(false);
    const r = executeSeruven({ ...s0, rests: 1 }, { type: 'set_choices', memberId: 'p1', sheet: { spellNames: swapped } });
    expect(r.ok).toBe(true);
    // Seçim alanı olmayan alan yazılmaz.
    const r2 = executeSeruven({ ...s0, rests: 1 }, { type: 'set_choices', memberId: 'p1', sheet: { name: 'Başka', raceId: 'dwarf' } });
    expect(r2.ok && r2.state.party[0]!.sheet.name).toBe('Deneme');
  });
  it('bağlı olmayan sınıf reddedilir (sonraki görev)', () => {
    const s = begin(sheetOf('fighter', 3), { rests: 1 });
    expect(executeSeruven(s, { type: 'set_choices', memberId: 'p1', sheet: {} }).ok).toBe(false);
  });
});
