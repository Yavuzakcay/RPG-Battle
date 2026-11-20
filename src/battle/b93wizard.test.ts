/** Görev B93 (kural sürümü 93), aşama C: Wizard denetim düzeltmeleri (WIZARD-DENETIM.md). */
import { describe, expect, it } from 'vitest';
import { combatantFromSheet } from './create';
import { arena, caster } from './b93fixtures';
import { blankCharacter, characterIssues, spellLimits, suggestedScores } from '../rules/builder';
import { fullStatus, recoveryOptions, shortRestStatus } from '../rules/characterRest';
import { execute } from './commands';
import { P1 } from './fixtures';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent } from './types';

const o = (col: number, row: number) => ({ col, row });
const wiz = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('w').sheet, name: 'Büyücü', classId: 'wizard', subclassId: 'evoker', level, baseScores: suggestedScores('wizard'), ...patch,
});

describe('Potent Cantrip (bizim sürüm: ıskada da yarı hasar)', () => {
  it('ıskalanan Fire Bolt yarı hasar verir (93), ek etki yok; 92\'de 0', () => {
    const a = caster({ spellNames: ['Fire Bolt'], traits: ['potent-cantrip'], spellAttack: -20 });
    const dmg = (rules?: number) => (arena(a, [['B', { ac: 30 }, o(5, 3)]], { rules }).do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' })
      .find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>);
    const now = dmg(93); const old = dmg(92);
    expect(now.hit).toBe(false);
    expect(now.appliedDamage).toBeGreaterThan(0);
    expect(old.appliedDamage).toBe(0);
  });
});

describe('Arcane Recovery seçimi (s. 78)', () => {
  it('oyuncu slotları seçer ya da ertelerse kullanılmaz; otomatik eskisi gibi', () => {
    const s = wiz(6);
    const spent = { ...fullStatus(s), slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] };
    expect(recoveryOptions(s, spent)).toEqual(expect.arrayContaining([[3], [2, 1], [1, 1, 1]]));
    expect(shortRestStatus(s, spent, 0, () => 0.5).status.slots.slice(0, 3)).toEqual([0, 0, 1]);
    const pick = shortRestStatus(s, spent, 0, () => 0.5, { arcaneRecovery: [1, 1] });
    expect(pick.status.slots.slice(0, 3)).toEqual([2, 0, 0]);
    const skip = shortRestStatus(s, spent, 0, () => 0.5, { arcaneRecovery: null });
    expect(skip.status.slots.slice(0, 3)).toEqual([0, 0, 0]);
    expect(skip.status.resources.arcaneRecovery).toBe(1);
  });
});

describe('Spell Mastery ve Signature Spells (s. 79)', () => {
  const book = ['Magic Missile', 'Shield', 'Sleep', 'Misty Step', 'Scorching Ray', 'Fireball', 'Lightning Bolt', 'Counterspell'];
  it('kitaptan seçilen büyüler her zaman hazır ve slotsuz; Spell Mastery yalnız Action büyüsü; Signature her büyüye ayrı kullanım', () => {
    const c = combatantFromSheet(wiz(20, { spellbook: book, spellNames: ['Fire Bolt', 'Shield'],
      featureChoices: { 'wizard:spell-mastery/1': 'Sleep', 'wizard:spell-mastery/2': 'Misty Step', 'wizard:signature-spells/a': 'Fireball', 'wizard:signature-spells/b': 'Lightning Bolt' } }), { id: 'A', ownerId: 'p1' });
    expect(c.spellNames).toEqual(expect.arrayContaining(['Sleep', 'Fireball', 'Lightning Bolt']));
    expect(c.freeSpells?.Sleep).toBe('spellMastery');
    expect(c.spellNames).not.toContain('Misty Step'); // bonus eylemli: seçilemez
    expect(c.freeSpells?.Fireball).toBe('signatureSpells');
    expect(c.freeSpells?.['Lightning Bolt']).toBe('signatureSpells2');
    expect(c.resources.signatureSpells).toBe(1);
    expect(c.resources.signatureSpells2).toBe(1);
  });
});

describe('Ritual Adept (s. 78)', () => {
  it('kitaptaki ritüel büyü hazırlanmadan bilinir, yalnız kurulum ritüeli olarak; savaşta slotla yapılamaz', () => {
    const c = combatantFromSheet(wiz(3, { spellbook: ['Find Familiar', 'Detect Magic', 'Magic Missile'], spellNames: ['Fire Bolt', 'Magic Missile'] }), { id: 'A', ownerId: 'p1' });
    expect(c.spellNames).toEqual(expect.arrayContaining(['Find Familiar', 'Detect Magic']));
    expect(c.ritualOnly).toEqual(expect.arrayContaining(['Find Familiar', 'Detect Magic']));
    const r = arena({ ...c, pos: o(3, 3) }, [['B', {}, o(5, 3)]]);
    const res = execute(r.state, { type: 'cast_spell', actorId: 'A', spellName: 'Detect Magic' }, P1, () => 0.5);
    expect(res.ok).toBe(false);
  });
});

describe('Evocation Savant (bizim sürüm: kitaba Evocation büyüleri)', () => {
  it('kitap sınırı 3. seviyede +2, her yeni slot seviyesinde +1 (20: +9); fazlası Evocation olmalı', () => {
    expect(spellLimits('wizard', 3, undefined, undefined, 'evoker').spellbook).toBe(12);
    expect(spellLimits('wizard', 3).spellbook).toBe(10);
    expect(spellLimits('wizard', 20, undefined, undefined, 'evoker').spellbook).toBe(6 + 38 + 9);
    const non = ['Magic Missile', 'Shield', 'Sleep', 'Mage Armor', 'Detect Magic', 'Feather Fall', 'Misty Step', 'Web', 'Invisibility', 'Hold Person', 'Blur', 'Knock'];
    const ch = { ...blankCharacter('w'), sheet: wiz(3, { spellbook: non, spellNames: ['Fire Bolt', 'Light', 'Mage Hand', 'Magic Missile'] }) };
    expect(characterIssues(ch).some((x) => x.text.includes('Evocation'))).toBe(true);
  });
});
