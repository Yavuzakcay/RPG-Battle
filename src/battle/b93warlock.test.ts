/** Görev B93 (kural sürümü 93), aşama D: Warlock denetim düzeltmeleri (WARLOCK-DENETIM.md). */
import { describe, expect, it } from 'vitest';
import { arena, caster } from './b93fixtures';
import { blankCharacter, characterIssues, classScoped, suggestedScores } from '../rules/builder';
import { currentStatus, fullStatus, magicalCunningStatus } from '../rules/characterRest';
import { allInvocations } from '../rules/invocations';
import trDesc from '../../data/aciklamalar-tr.json';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent } from './types';

const o = (col: number, row: number) => ({ col, row });
const lock = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('k').sheet, name: 'Cadı', classId: 'warlock', subclassId: 'fiend-patron', level, baseScores: suggestedScores('warlock'), ...patch,
});

describe('Magical Cunning (s. 72)', () => {
  it('harcananın en çok azami slotun yarısı (yukarı) kadarı geri gelir', () => {
    const s11 = lock(11);
    const spent2 = { ...fullStatus(s11), slots: fullStatus(s11).slots.map((n) => (n > 0 ? n - 2 : 0)) };
    const i = fullStatus(s11).slots.findIndex((n) => n > 0);
    expect(magicalCunningStatus(s11, spent2)?.slots[i]).toBe(3); // 3 slot, 2 harcandı: 2 geri (eskiden 1)
    const s5 = lock(5);
    const all = { ...fullStatus(s5), slots: fullStatus(s5).slots.map(() => 0) };
    const j = fullStatus(s5).slots.findIndex((n) => n > 0);
    expect(magicalCunningStatus(s5, all)?.slots[j]).toBe(1); // 2 slot: en çok 1
  });
  it('seviye atlayınca Pact slot seviyesi değişirse harcanan sayısı taşınır (C9)', () => {
    const s4 = lock(4);
    const st = { ...fullStatus(s4), slots: fullStatus(s4).slots.map((n) => (n > 0 ? n - 1 : 0)) };
    const now = currentStatus(lock(5), st);
    const k = now.slots.findIndex((n, idx) => (fullStatus(lock(5)).slots[idx] ?? 0) > 0);
    expect(now.slots[k]).toBe((fullStatus(lock(5)).slots[k] ?? 0) - 1);
  });
});

describe('Hurl Through Hell (bizim sürüm: "Saldırı isabetinde")', () => {
  it('Eldritch Blast isabetinde tetiklenir (93); 92\'de yalnız silah', () => {
    const a = caster({ spellNames: ['Eldritch Blast'], traits: ['hurl-through-hell'], level: 14, resources: { hurlThroughHell: 1 }, k19Traits: true });
    const run = (rules?: number) => arena(a, [['B', { hp: 200, maxHp: 200 }, o(5, 3)]], { rules }).do({ type: 'cast_spell', actorId: 'A', spellName: 'Eldritch Blast', targetId: 'B' }, undefined, () => 0.6);
    const now = run(93); const old = run(92);
    const used = (evs: BattleEvent[]) => evs.some((e) => e.type === 'feature_used' && e.feature === 'hurlThroughHell');
    expect(used(now)).toBe(true);
    expect(used(old)).toBe(false);
  });
});

describe('Pact of the Tome ve Invocation arayüzü', () => {
  const tomeSheet = (names: string[]) => lock(3, { invocations: ['pact-of-the-tome', 'agonizing-blast:Fire Bolt'], spellNames: names });
  it('Tome cantrip\'leri her sınıfın listesinden (en çok 3); Agonizing Blast Tome cantrip\'ine', () => {
    const s = tomeSheet(['Eldritch Blast', 'Fire Bolt', 'Sacred Flame', 'Guidance', 'Hex']);
    expect(classScoped(s).spellNames).toEqual(expect.arrayContaining(['Fire Bolt', 'Sacred Flame', 'Guidance']));
    const ok = characterIssues({ ...blankCharacter('k'), sheet: s }).map((x) => x.text);
    expect(ok.some((x) => /Fire Bolt|Sacred Flame|uygun bir cantrip/.test(x))).toBe(false);
    const four = tomeSheet(['Eldritch Blast', 'Fire Bolt', 'Sacred Flame', 'Guidance', 'Light']);
    expect(characterIssues({ ...blankCharacter('k'), sheet: four }).some((x) => x.text.includes('4'))).toBe(true);
  });
  it('28 Invocation\'ın hepsinde Türkçe açıklama (ⓘ; geliştirici notu gösterilmez)', () => {
    const tr = (trDesc as { invocation: Record<string, string> }).invocation;
    for (const v of allInvocations()) expect(tr[v.id], v.id).toBeTruthy();
  });
  it('pact silahı menzilli seçilince uyarı', () => {
    const s = lock(3, { invocations: ['pact-of-the-blade', 'agonizing-blast:Eldritch Blast'], spellNames: ['Eldritch Blast', 'Minor Illusion', 'Hex', 'Armor of Agathys'], weapons: [{ name: 'Longbow' }], pactWeapon: 'Longbow' });
    expect(characterIssues({ ...blankCharacter('k'), sheet: s }).length).toBeGreaterThan(0);
    const ok = { ...s, weapons: [{ name: 'Longsword' }], pactWeapon: 'Longsword' };
    const pb = (x: CharacterSheet) => characterIssues({ ...blankCharacter('k'), sheet: x }).filter((i) => /[Pp]act/.test(i.text)).length;
    expect(pb(s)).toBeGreaterThan(pb(ok));
  });
});
