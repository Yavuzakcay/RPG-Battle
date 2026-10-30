/**
 * F1: Magic Initiate (SRD 5.2.1). 1. seviye büyü uzun dinlenmede bir kez slotsuz (slotu olmayan sınıfta da), sonra
 * slotla; büyü yeteneği INT/WIS/CHA seçilir (varsayılan listeye uygun) ve zorluk sınıfı/saldırı bonusu buna göre;
 * seviye yuvasından da alınır (her seferinde farklı liste); kaynak uzun dinlenmede yenilenir.
 */
import { describe, expect, it } from 'vitest';
import { combatantFromSheet } from './create';
import { execute } from './index';
import { setup, scripted, P1 } from './fixtures';
import type { BattleState, Combatant } from './types';
import { blankCharacter, characterIssues, type SavedCharacter } from '../rules/builder';
import { featFreeSpells, featResources, magicInitiateAll, magicInitiateProblems } from '../rules/backgrounds';
import { featOptions } from '../rules/advancement';
import { fullStatus, longRestStatus } from '../rules/characterRest';
import { hasSlotFor, onceFree } from '../ui/hud';
import { spells } from '../data';
import type { CharacterSheet } from '../rules/stats';

const acolyte = (patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('f1').sheet, name: 'Mürit', classId: 'fighter', level: 1, backgroundId: 'acolyte',
  baseScores: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 }, backgroundBonuses: { wis: 2, cha: 1 },
  magicInitiate: { cleric: { cantrips: ['Sacred Flame', 'Guidance'], spell: 'Guiding Bolt' } }, ...patch,
});
const asA = (c: Combatant): Partial<Combatant> => { const { id: _i, name: _n, ownerId: _o, initiativeBonus: _b, ...f } = c; return f; };
const turnOf = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });

describe('Magic Initiate: slotsuz kullanım ve yetenek', () => {
  it('kaynak ve slotsuz büyü veride/savaşçıda; Fighter (slotsuz sınıf) için menüde "bir kez, slotsuz"', () => {
    const sheet = acolyte();
    expect(featResources(sheet)).toEqual({ 'magic-initiate-cleric': 1 });
    expect(featFreeSpells(sheet)).toEqual({ 'Guiding Bolt': 'magic-initiate-cleric' });
    const c = combatantFromSheet(sheet, { id: 'A', ownerId: 'p1' });
    expect(c.spellSlots.every((n) => n === 0)).toBe(true);
    expect(c.resources['magic-initiate-cleric']).toBe(1);
    const gb = spells.find((x) => x.name === 'Guiding Bolt')!;
    expect(hasSlotFor(c, gb)).toBe(true);
    expect(onceFree(c, gb)).toBe(true);
    expect(hasSlotFor({ ...c, resources: { ...c.resources, 'magic-initiate-cleric': 0 } }, gb)).toBe(false);
  });
  it('zorluk sınıfı ve saldırı bonusu seçilen yetenekle (varsayılan Cleric → WIS)', () => {
    // WIS 12+2 = 14 (+2), CHA 11 (+0), yetkinlik +2.
    const wis = combatantFromSheet(acolyte(), { id: 'A', ownerId: 'p1' });
    expect(wis.spellStats?.['Sacred Flame']).toEqual({ dc: 12, attack: 4 });
    const cha = combatantFromSheet(acolyte({ magicInitiate: { cleric: { cantrips: ['Sacred Flame', 'Guidance'], spell: 'Guiding Bolt', ability: 'cha' } } }), { id: 'A', ownerId: 'p1' });
    expect(cha.spellStats?.['Guiding Bolt']).toEqual({ dc: 10, attack: 2 });
  });
  it('savaş: ilk Guiding Bolt slotsuz (kaynak harcanır), ikincisi slot yokken yapılamaz; zorluk sınıfı WIS ile', () => {
    let s = setup('Düz', { A: asA(combatantFromSheet(acolyte(), { id: 'A', ownerId: 'p1' })) });
    s = turnOf(s, 'A');
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Guiding Bolt', targetId: 'B' }, P1, scripted([20, 15], [6, 3], [6, 3], [6, 3], [6, 3]));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.events.some((e) => e.type === 'feature_used' && e.feature === 'magic-initiate-cleric' && e.remaining === 0)).toBe(true);
    expect(r.events.some((e) => e.type === 'slot_spent')).toBe(false);
    expect(r.state.combatants.A!.resources['magic-initiate-cleric']).toBe(0);
    const again = execute({ ...r.state, combatants: { ...r.state.combatants, A: { ...r.state.combatants.A!, economy: s.combatants.A!.economy } } },
      { type: 'cast_spell', actorId: 'A', spellName: 'Guiding Bolt', targetId: 'B' }, P1, scripted([20, 15]));
    expect(again.ok).toBe(false);
    // Sacred Flame (cantrip) zorluk sınıfı Magic Initiate yeteneğiyle: 12.
    const sf = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'B' }, P1, scripted([20, 2], [8, 4]));
    expect(sf.ok && sf.events.find((e) => e.type === 'save_resolved')).toMatchObject({ dc: 12 });
  });
  it('slotlu sınıfta önce slotsuz hak, sonra slot (Wizard + Acolyte)', () => {
    const sheet = acolyte({ classId: 'wizard', spellNames: [], baseScores: { str: 8, dex: 13, con: 14, int: 15, wis: 12, cha: 10 } });
    let s = setup('Düz', { A: asA(combatantFromSheet(sheet, { id: 'A', ownerId: 'p1' })) });
    s = turnOf(s, 'A');
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Guiding Bolt', targetId: 'B' }, P1, scripted([20, 15], [6, 3], [6, 3], [6, 3], [6, 3]));
    expect(r.ok && r.events.some((e) => e.type === 'slot_spent')).toBe(false);
    const fresh = { ...r.ok ? r.state : s };
    const again = execute({ ...fresh, combatants: { ...fresh.combatants, A: { ...fresh.combatants.A!, economy: s.combatants.A!.economy } } },
      { type: 'cast_spell', actorId: 'A', spellName: 'Guiding Bolt', targetId: 'B' }, P1, scripted([20, 15], [6, 3], [6, 3], [6, 3], [6, 3]));
    expect(again.ok && again.events.some((e) => e.type === 'slot_spent')).toBe(true);
  });
  it('uzun dinlenmede yenilenir', () => {
    const sheet = acolyte();
    const used = { ...fullStatus(sheet), resources: { ...fullStatus(sheet).resources, 'magic-initiate-cleric': 0 } };
    expect(longRestStatus(sheet, used).resources['magic-initiate-cleric']).toBe(1);
  });
});

describe('Magic Initiate: seviye yuvasından (tekrar alınabilir, farklı liste)', () => {
  it('ASI yuvasında köken feat\'leri seçilebilir (SRD 5.2.1 "another feat … for which you qualify")', () => {
    const ids = featOptions({ level: 4, kind: 'asi', category: 'General' }, { scores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, casterClass: false }).map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(['magic-initiate', 'alert', 'savage-attacker', 'skilled']));
  });
  it('yuvadaki Magic Initiate liste ister; aynı liste ikinci kez alınamaz; seçilince kaynak ve büyüler', () => {
    const noList = acolyte({ level: 4, advancements: [{ level: 4, featId: 'magic-initiate' }] });
    expect(magicInitiateProblems(noList)).toContain('4. seviye Magic Initiate: büyü listesi seçilmeli (Cleric, Druid ya da Wizard).');
    const same = acolyte({ level: 4, advancements: [{ level: 4, featId: 'magic-initiate', list: 'cleric' }] });
    expect(magicInitiateProblems(same)).toContain('Magic Initiate her seferinde farklı bir büyü listesiyle alınmalı.');
    const ok = acolyte({ level: 4, advancements: [{ level: 4, featId: 'magic-initiate', list: 'wizard' }],
      magicInitiate: { cleric: { cantrips: ['Sacred Flame', 'Guidance'], spell: 'Guiding Bolt' }, wizard: { cantrips: ['Fire Bolt', 'Light'], spell: 'Shield' } } });
    expect(magicInitiateProblems(ok)).toEqual([]);
    expect(magicInitiateAll(ok).map((m) => [m.source, m.list, m.ability])).toEqual([['background', 'cleric', 'wis'], [4, 'wizard', 'int']]);
    expect(featResources(ok)).toEqual({ 'magic-initiate-cleric': 1, 'magic-initiate-wizard': 1 });
    const c: SavedCharacter = { ...blankCharacter('x'), classSkills: ['perception', 'survival'], sheet: ok };
    expect(characterIssues(c).filter((i) => i.step === 'progress')).toEqual([]);
    // Shield (tepki) de slotsuz hakla.
    const cb = combatantFromSheet(ok, { id: 'A', ownerId: 'p1' });
    expect(cb.freeSpells).toEqual({ 'Guiding Bolt': 'magic-initiate-cleric', Shield: 'magic-initiate-wizard' });
  });
});
