/** Kuyruk 19 (Görev 4–5): 11–20. seviye alt sınıf özellikleri (anahtar `featuresK19`, kural sürümü 16). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { nextActor } from './common';
import { lineOfFire } from './cover';
import { attackDice } from './effectDice';
import { hurlEvents } from './apex';
import { syncAuras } from './auras';
import { spendSlot } from './slots';
import { GM, P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, UsableFeature } from './types';
import type { Rng } from '../rules/dice';

const sheet = (classId: string, level: number, sub?: string) => ({ ...blankCharacter('x').sheet, name: classId, classId, subclassId: sub, level, baseScores: suggestedScores(classId) });
const fist: AttackOption = { label: 'Unarmed Strike', attackBonus: 30, damage: '1d4+3', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'unarmed', weaponId: 'unarmed-strike', reachFt: 5, martialArts: true };

function arena(ver: number, a: Combatant, toggles?: Record<string, boolean>, b: Partial<Combatant> = {}) {
  const parts = [
    { ...a, id: 'A', ownerId: 'p1' },
    mk('B', { side: 'enemies', hp: 200, maxHp: 200, initiative: 5, saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 }, ...b }),
    mk('C', { ownerId: 'p1', hp: 20, maxHp: 20 }),
  ];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: { col: 4, row: 3 }, B: { col: 5, row: 3 }, C: { col: 3, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...s0, status: 'active', round: 1, order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
  return new Run(state);
}
class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, rng: Rng = () => 0.5) { const r = execute(this.state, cmd, 'actorId' in cmd && cmd.actorId === 'B' ? GM : P1, rng); if (!r.ok) throw new Error(r.error); this.state = r.state; this.events.push(...r.events); return r.events; }
  try(cmd: Command, rng: Rng = () => 0.5) { const r = execute(this.state, cmd, P1, rng); return r.ok ? null : r.error; }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
const OFF = { featuresK19: false };
const pc = (classId: string, level: number, sub: string) => combatantFromSheet(sheet(classId, level, sub), { id: 'A', ownerId: 'p1' });

describe('Kuyruk 19: Berserker / Devotion', () => {
  it('Intimidating Presence: düşman WIS save ya da Frightened; kullanım yoksa Rage harcar; kapalıyken yok', () => {
    const r = arena(16, pc('barbarian', 14, 'path-of-the-berserker'));
    const key = 'barbarian/path-of-the-berserker:intimidating-presence';
    r.do({ type: 'use_feature', actorId: 'A', feature: key }, () => 0.05);
    expect(r.c('B').effects?.some((e) => e.grants?.includes('Frightened') && e.repeatSave)).toBe(true);
    const rage = r.c('A').resources.rage ?? 0;
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, bonus: false } } } };
    r.do({ type: 'use_feature', actorId: 'A', feature: key }, () => 0.05);
    expect(r.c('A').resources.rage).toBe(rage - 1);
    r.replays();
    const off = arena(16, pc('barbarian', 14, 'path-of-the-berserker'), OFF);
    expect(off.try({ type: 'use_feature', actorId: 'A', feature: key })).toMatch(/kapalı/);
  });
  it('Holy Nimbus: yürüyen alan + Fiend/Undead save avantajı; Smite of Protection yarım siper', () => {
    const r = arena(16, pc('paladin', 20, 'oath-of-devotion'));
    r.do({ type: 'use_feature', actorId: 'A', feature: 'paladin/oath-of-devotion:holy-nimbus' });
    const zone = r.state.map?.zones?.find((z) => z.spellId.startsWith('feature:'));
    expect(zone?.anchorId).toBe('A');
    expect(Number(zone?.damage)).toBeGreaterThan(0);
    expect(r.c('A').effects?.find((e) => e.saveAdvVs)?.saveAdvVs).toEqual(['fiend', 'undead']);
    r.replays();
    expect(r.c('A').traits).toContain('smite-of-protection');
  });
});

describe('Kuyruk 19: Open Hand / Thief', () => {
  it('Quivering Palm: Unarmed isabetinden sonra 4 Focus ile titreşim; eylemle 10d12 Force', () => {
    const m = pc('monk', 17, 'warrior-of-the-open-hand');
    const r = arena(16, { ...m, weaponOptions: [fist] });
    const key = 'monk/warrior-of-the-open-hand:quivering-palm';
    expect(r.try({ type: 'use_feature', actorId: 'A', feature: key })).toMatch(/Unarmed/);
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: fist }, () => 0.9);
    const focus = r.c('A').resources.focus ?? 0;
    r.do({ type: 'use_feature', actorId: 'A', feature: key });
    expect(r.c('A').resources.focus).toBe(focus - 4);
    expect(r.c('B').effects?.some((e) => e.quivering)).toBe(true);
    // Sonraki tur: eylemle bitir.
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, action: false, attacksLeft: 1, meleeHit: undefined } } } };
    const hp = r.c('B').hp;
    r.do({ type: 'use_feature', actorId: 'A', feature: key }, () => 0.01);
    expect(hp - r.c('B').hp).toBeGreaterThanOrEqual(10);
    expect(r.c('B').effects?.some((e) => e.quivering)).toBeFalsy();
  });
  it('Fleet Step: başka bonus eylemden sonra Step of the Wind bonus eylemsiz (turda bir)', () => {
    const m = pc('monk', 11, 'warrior-of-the-open-hand');
    const r = arena(16, m);
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, bonus: true } } } };
    r.do({ type: 'focus_action', actorId: 'A', action: 'step-of-the-wind' });
    expect(r.c('A').economy.fleetUsed).toBe(true);
    expect(r.try({ type: 'focus_action', actorId: 'A', action: 'step-of-the-wind' })).toMatch(/Bonus/);
    const off = arena(16, m, OFF);
    off.state = { ...off.state, combatants: { ...off.state.combatants, A: { ...off.c('A'), economy: { ...off.c('A').economy, bonus: true } } } };
    expect(off.try({ type: 'focus_action', actorId: 'A', action: 'step-of-the-wind' })).toMatch(/Bonus/);
  });
  it("Thief's Reflexes: ilk turda inisiyatif − 10'da ikinci tur, sonra sıra sürer", () => {
    const t = { ...pc('rogue', 17, 'thief'), initiative: 25 };
    const r0 = arena(16, t);
    const r = new Run({ ...r0.state, combatants: { ...r0.state.combatants, A: { ...r0.c('A'), initiative: 25 }, B: { ...r0.c('B'), initiative: 20 }, C: { ...r0.c('C'), initiative: 5 } } });
    r.do({ type: 'end_turn', actorId: 'A' });
    expect(r.state.order[r.state.turnIndex]).toBe('B');
    r.do({ type: 'end_turn', actorId: 'B' });
    expect(r.state.order[r.state.turnIndex]).toBe('A');
    expect(r.state.reflexDone).toEqual(['A']);
    r.do({ type: 'end_turn', actorId: 'A' });
    expect(r.state.order[r.state.turnIndex]).toBe('C');
    expect(r.state.round).toBe(1);
    r.replays();
    const off = arena(16, t, OFF);
    off.state = { ...off.state, combatants: { ...off.state.combatants, A: { ...off.c('A'), initiative: 25 }, B: { ...off.c('B'), initiative: 20 }, C: { ...off.c('C'), initiative: 5 } } };
    expect(nextActor({ ...off.state, turnIndex: 1 }).id).toBe('C');
  });
});

describe('Kuyruk 19: Draconic / Land / Lore / Hunter', () => {
  it('Dragon Wings uçuş (yoksa 3 Sorcery Point); Dragon Companion Summon Dragon slotsuz', () => {
    const r = arena(16, pc('sorcerer', 18, 'draconic-sorcery'));
    r.do({ type: 'use_feature', actorId: 'A', feature: 'sorcerer/draconic-sorcery:dragon-wings' });
    expect(r.c('A').effects?.find((e) => e.fly)?.fly).toBe(60);
    const s = spendSlot(r.c('A'), 5, undefined, 'Summon Dragon');
    expect(s.ok && s.events[0]).toMatchObject({ type: 'feature_used', feature: 'dragonCompanion' });
  });
  it("Nature's Sanctuary: küpteki dostlara yarım siper; bonus eylemle taşınır", () => {
    const d = pc('druid', 14, 'circle-of-the-land');
    const r = arena(16, d);
    const key = 'druid/circle-of-the-land:natures-sanctuary';
    r.do({ type: 'use_feature', actorId: 'A', feature: key, to: { col: 3, row: 3 } });
    expect(lineOfFire(r.state, r.c('B'), r.c('C')).cover).toBeGreaterThanOrEqual(2);
    r.do({ type: 'use_feature', actorId: 'A', feature: key, to: { col: 8, row: 3 } });
    expect(r.c('A').economy.bonus).toBe(true);
    expect(lineOfFire(r.state, r.c('B'), r.c('C')).cover).toBe(0);
    r.replays();
  });
  it('Peerless Skill: anahtar açıkken saldırıya ikinci şans Bardic Inspiration zarı', () => {
    const r = arena(16, pc('bard', 14, 'college-of-lore'));
    r.state = syncAuras(r.state);
    expect(attackDice(r.c('A')).some((x) => x.label === 'Peerless Skill' && x.resource === 'bardicInspiration')).toBe(true);
    const off = arena(16, pc('bard', 14, 'college-of-lore'), OFF);
    off.state = syncAuras(off.state);
    expect(attackDice(off.c('A')).some((x) => x.label === 'Peerless Skill')).toBe(false);
  });
  it("Superior Hunter's Defense: isabet tepkisi sonrası aynı türe tur sonuna dek direnç", () => {
    const h = pc('ranger', 15, 'hunter');
    expect(h.reactions?.some((x) => x.kind === 'resist')).toBe(true);
  });
});

describe('Kuyruk 19: Fiend / Evoker', () => {
  it('Hurl Through Hell: isabette CHA save, başarısızsa 8d10 Psychic + Incapacitated', () => {
    const w = { ...pc('warlock', 14, 'fiend-patron'), pos: { col: 4, row: 3 } };
    const r = arena(16, w);
    const evs = hurlEvents(r.state, r.c('A'), r.c('B'), () => 0.01);
    expect(evs.some((e) => e.type === 'save_resolved' && e.appliedDamage >= 8)).toBe(true);
    expect(evs.some((e) => e.type === 'condition_changed' && e.condition === 'Incapacitated')).toBe(true);
    const off = arena(16, w, OFF);
    expect(hurlEvents(off.state, off.c('A'), off.c('B'), () => 0.01)).toEqual([]);
  });
  it('Overchannel: hasar zarları en yüksek; ikinci kullanımda Necrotic bedel', () => {
    const wz = pc('wizard', 14, 'evoker');
    const r = arena(16, { ...wz, spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0], spellNames: [...wz.spellNames, 'Magic Missile'] } as Combatant);
    const mm = { type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B', slotLevel: 1, overchannel: true } as Command;
    const plain = arena(16, r.c('A'));
    const hp0 = plain.c('B').hp;
    plain.do({ ...mm, overchannel: false } as Command, () => 0.999);
    const best = hp0 - plain.c('B').hp;
    const hp = r.c('B').hp;
    r.do(mm, () => 0.01);
    expect(hp - r.c('B').hp).toBe(best);
    expect(r.c('A').resources.overchannel).toBe(9);
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, action: false, slotTurn: null } } } };
    const mine = r.c('A').hp;
    r.do(mm, () => 0.01);
    expect(r.c('A').hp).toBeLessThan(mine);
    r.replays();
    void ({} as UsableFeature);
  });
});

describe('Kuyruk 19: sınıf 11–20 kalanları', () => {
  it('Nature Magician: 2 Wild Shape → 4. seviye slot (uzun dinlenmede bir); kapalıyken yok', () => {
    const d = pc('druid', 20, 'circle-of-the-land');
    expect(d.traits).toContain('nature-magician');
    const r = arena(16, { ...d, resources: { ...d.resources, wildShape: 4 } as Combatant['resources'] });
    const before = r.c('A').spellSlots[3] ?? 0;
    r.do({ type: 'wild_resurgence', actorId: 'A', mode: 'magician', uses: 2 });
    expect(r.c('A').spellSlots[3]).toBe(before + 1);
    expect(r.c('A').resources.wildShape).toBe(2);
    expect(r.try({ type: 'wild_resurgence', actorId: 'A', mode: 'magician', uses: 1 })).toMatch(/dinlenmede/);
    r.replays();
    const off = arena(16, d, OFF);
    expect(off.try({ type: 'wild_resurgence', actorId: 'A', mode: 'magician', uses: 1 })).toMatch(/kapalı/);
  });
  it('Arcane Apotheosis: Innate Sorcery etkinken turda bir Metamagic bedelsiz', async () => {
    const { apotheosisDiscount } = await import('./sorcerer');
    const s = { ...pc('sorcerer', 20, 'draconic-sorcery'), metamagic: { quickened: 2, twinned: 1 } };
    const r = arena(16, s as Combatant);
    r.do({ type: 'use_feature', actorId: 'A', feature: 'sorcerer:innate-sorcery' });
    expect(r.c('A').k19Traits).toBe(true);
    expect(apotheosisDiscount(r.state, r.c('A'), ['quickened'])).toBe(2);
    const used = { ...r.c('A'), economy: { ...r.c('A').economy, apotheosisUsed: true } };
    expect(apotheosisDiscount(r.state, used, ['quickened'])).toBe(0);
  });
  it('Improved Elemental Fury (Potent): cantrip menzili +300 ft; Improved Blessed Strikes geçici HP', async () => {
    const { spellReach } = await import('./range');
    const fb = { rangeFt: 120, level: 0, mechanics: { kind: 'attack' } };
    expect(spellReach(fb, { k19Traits: true, traits: ['potent-spellcasting', 'improved-primal-strike'] })).toMatchObject({ normalFt: 420 });
    expect(spellReach(fb, { k19Traits: false, traits: ['potent-spellcasting', 'improved-primal-strike'] })).toMatchObject({ normalFt: 120 });
    const cl = combatantFromSheet({ ...sheet('cleric', 14, 'life-domain'), featureChoices: { 'cleric:blessed-strikes': 'potent-spellcasting' } }, { id: 'A', ownerId: 'p1' });
    expect(cl.traits).toContain('potent-spellcasting');
    const r = arena(16, { ...cl, spellNames: [...cl.spellNames, 'Sacred Flame'] });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'B' }, () => 0.5);
    expect(r.events.some((e) => e.type === 'temp_hp' && e.label === 'Potent Spellcasting')).toBe(true);
  });
  it('Eldritch Master: Magical Cunning bütün Pact slotlarını geri verir', async () => {
    const { magicalCunningStatus, fullStatus } = await import('../rules/characterRest');
    const w = sheet('warlock', 20, 'fiend-patron');
    const full = fullStatus(w);
    const spent = { ...full, slots: full.slots.map(() => 0), resources: { ...full.resources, magicalCunning: 1 } };
    const after = magicalCunningStatus(w, spent);
    expect(after?.slots).toEqual(full.slots);
  });
  it('Spell Mastery seçimi: seçilen 1. seviye büyü slotsuz', () => {
    const base = sheet('wizard', 18, 'evoker');
    const wz = combatantFromSheet({ ...base, spellNames: [...(base.spellNames ?? []), 'Magic Missile', 'Thunderwave', 'Misty Step'], featureChoices: { 'wizard:spell-mastery/1': 'Thunderwave' } }, { id: 'A', ownerId: 'p1' });
    expect(wz.freeSpells?.Thunderwave).toBe('spellMastery');
    expect(wz.freeSpells?.['Magic Missile']).toBeUndefined();
  });
});
