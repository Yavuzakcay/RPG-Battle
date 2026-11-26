/**
 * Görev MC4 (kural sürümü 105; SRD 5.2.1 s. 25 "class features ... based on your level in that class"): çoklu sınıflı oyuncu
 * savaşçısının kurulumu sınıf başına (kit, kaynak, Invocation) ve savaşta/dinlenmede sınıf seviyesi. Kararlar K5 (Weapon
 * Mastery), K6 (Channel Divinity). 104 ve altında çoklu sınıflı sayfa MC öncesi gibi.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { combatantFromSheet, setDefaultRuleVersion } from './create';
import { CURRENT_RULES } from './ruleVersion';
import { featureLevel, levelIn, resourceLevel } from './classLevel';
import { applyEvents } from './reduce';
import type { BattleState, Combatant } from './types';
import { type CharacterSheet, type ClassEntry, type Scores } from '../rules/stats';
import { arcaneRecovery, currentStatus, fullStatus, resourceClassLevel, sorcerousRestoration } from '../rules/characterRest';
import { newCharacter } from '../rules/builder';
import { syncClassFields } from '../rules/multiclass';
import { masteryRight } from '../rules/mastery';
import { mcImpl } from '../rules/mcHook';
import { classResources, resourceDef } from '../rules/classFeatures';
import { withStatus } from '../app/partyStatus';

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

const scores: Scores = { str: 14, dex: 14, con: 12, int: 14, wis: 14, cha: 14 };
function mc(classes: ClassEntry[], extra: Partial<CharacterSheet> = {}): CharacterSheet {
  const c = newCharacter('mc4');
  return syncClassFields({ ...c.sheet, backgroundBonuses: {}, baseScores: { ...scores }, armorName: 'Zırhsız', shield: false, weapons: [], offHand: undefined, advancements: [], ...extra, classes });
}
const pc = (s: CharacterSheet, v = 105): Combatant => { setDefaultRuleVersion(v); return combatantFromSheet(s, { id: 'A', ownerId: 'p1' }); };

describe('MC4 kurulum: sınıf başına kit', () => {
  it('Rogue 1 / Fighter 4: Sneak Attack 1d6, Extra Attack yok, Second Wind ve Action Surge Fighter 4 ile', () => {
    const c = pc(mc([{ classId: 'rogue', level: 1 }, { classId: 'fighter', level: 4 }]));
    expect(c.sneakAttackDice).toBe(1);
    expect(c.attacksPerAction).toBe(1);
    expect(c.classLevels).toMatchObject({ rogue: 1, fighter: 4 });
    expect(c.resources.secondWind).toBe(3);
    expect(c.resources.actionSurge).toBe(1);
    expect(resourceLevel(c, 'secondWind')).toBe(4);
    expect(c.level).toBe(5);
  });

  it('Fighter 5 / Ranger 5: Extra Attack yığılmaz (2 saldırı)', () => {
    expect(pc(mc([{ classId: 'fighter', level: 5 }, { classId: 'ranger', level: 5 }])).attacksPerAction).toBe(2);
  });

  it('Fighter 4 / Rogue 1 (104): MC öncesi gibi ilk sınıf + toplam seviye, sınıf seviyesi yok', () => {
    const c = pc(mc([{ classId: 'fighter', level: 4 }, { classId: 'rogue', level: 1 }]), 104);
    expect(c.classLevels).toBeUndefined();
    expect(c.attacksPerAction).toBe(2);
    expect(c.sneakAttackDice).toBe(0);
  });

  const blade = { invocations: ['pact-of-the-blade', 'thirsting-blade'], weapons: [{ name: 'Longsword' }], pactWeapon: 'Longsword' } as Partial<CharacterSheet>;
  it('Thirsting Blade, Extra Attack varken ek saldırı vermez (SRD 5.2.1 s. 25)', () => {
    const c = pc(mc([{ classId: 'warlock', level: 5 }, { classId: 'fighter', level: 5 }], blade));
    expect(c.attacksPerAction).toBe(2);
    expect(c.pactAttacks).toBeUndefined();
  });
  it('Warlock 5 / Rogue 1: Thirsting Blade pact silahıyla 2 saldırı (Invocation Warlock seviyesiyle)', () => {
    const c = pc(mc([{ classId: 'warlock', level: 5 }, { classId: 'rogue', level: 1 }], blade));
    expect(c.attacksPerAction).toBe(1);
    expect(c.pactAttacks).toBe(2);
  });
});

describe('MC4 K6: Channel Divinity sınıfa özgü havuz', () => {
  const s = mc([{ classId: 'cleric', level: 2 }, { classId: 'paladin', level: 3 }]);
  it('Cleric 2 / Paladin 3: iki ayrı havuz, sınıf ekli kimlik; özellikler kendi havuzundan harcar', () => {
    const c = pc(s);
    expect(c.resources.channelDivinity).toBeUndefined();
    // Her havuz kendi sınıfının tablosundan, o sınıfın seviyesiyle (tek sınıflı karakterinkiyle aynı).
    expect(c.resources['channelDivinity@cleric']).toBe(classResources('cleric', 2).channelDivinity);
    expect(c.resources['channelDivinity@paladin']).toBe(classResources('paladin', 3).channelDivinity);
    const used = (c.features ?? []).map((f) => f.resource).filter((r) => r?.startsWith('channelDivinity'));
    expect(new Set(used)).toEqual(new Set(['channelDivinity@cleric', 'channelDivinity@paladin']));
    expect(resourceDef('channelDivinity@paladin')?.name).toBe('Channel Divinity');
    expect(resourceLevel(c, 'channelDivinity@paladin')).toBe(3);
  });
  it('durum: aynı kimlikler; tek sınıftan kalan sınıfsız kimlik ilk sınıfın havuzu sayılır', () => {
    expect(Object.keys(fullStatus(s).resources).filter((k) => k.startsWith('channelDivinity')).sort()).toEqual(['channelDivinity@cleric', 'channelDivinity@paladin']);
    const old = { ...fullStatus(s), resources: { channelDivinity: 0 }, resourceMax: { channelDivinity: classResources('cleric', 2).channelDivinity ?? 0 } };
    const now = currentStatus(s, old);
    expect(now.resources['channelDivinity@cleric']).toBe(0);
    expect(now.resources['channelDivinity@paladin']).toBe(classResources('paladin', 3).channelDivinity);
  });
  it('Cleric 3 / Fighter 2 (çakışma yok): kimlik sınıfsız kalır', () => {
    const c = pc(mc([{ classId: 'cleric', level: 3 }, { classId: 'fighter', level: 2 }]));
    expect(c.resources.channelDivinity).toBeGreaterThan(0);
    expect(Object.keys(c.resources).some((k) => k.includes('@'))).toBe(false);
  });
});

describe('MC4 K5: Weapon Mastery', () => {
  it('Barbarian 1 (yakın dövüş, 2) + Fighter 1 (kısıtsız, 3): hak 3, menzilli silah seçilebilir', () => {
    const r = masteryRight(mc([{ classId: 'barbarian', level: 1 }, { classId: 'fighter', level: 1 }]));
    expect(r?.count).toBe(3);
    expect(r?.melee).toBe(false);
  });
  it('Barbarian 4 + Wizard 1: hak Barbarian tablosundan, yakın dövüş kısıtı kalır', () => {
    const r = masteryRight(mc([{ classId: 'barbarian', level: 4 }, { classId: 'wizard', level: 1 }]));
    expect(r?.count).toBe(3);
    expect(r?.melee).toBe(true);
  });
});

describe('MC4 savaşta ve dinlenmede sınıf seviyesi', () => {
  it('yardımcılar: tek sınıflı ve canavarda karakter seviyesi', () => {
    const one = { level: 7 } as Combatant;
    expect(levelIn(one, 'fighter')).toBe(7);
    expect(featureLevel(one, 'fighter:second-wind')).toBe(7);
    expect(resourceLevel(one, 'indomitable')).toBe(7);
    const two = { level: 7, classLevels: { fighter: 4, wizard: 3 } } as Pick<Combatant, 'level' | 'classLevels'>;
    expect(featureLevel(two, 'wizard/school-of-evocation:sculpt-spells')).toBe(3);
    expect(resourceLevel(two, 'indomitable')).toBe(4);
  });

  it('Arcane Recovery bütçesi Wizard seviyesinin yarısı (Wizard 2 / Fighter 4: 1)', () => {
    const s = mc([{ classId: 'wizard', level: 2 }, { classId: 'fighter', level: 4 }]);
    expect(resourceClassLevel(s, 'arcaneRecovery')).toBe(2);
    const st = fullStatus(s);
    const slots = st.slots.map(() => 0);
    const r = arcaneRecovery(s, st.resources, slots);
    expect(r.slots.reduce((n, x, i) => n + x * (i + 1), 0)).toBe(1);
  });

  it('Sorcerous Restoration Sorcerer seviyesinin yarısı (Sorcerer 5 / Fighter 4: 2 puan)', () => {
    const s = mc([{ classId: 'sorcerer', level: 5 }, { classId: 'fighter', level: 4 }], { baseScores: { ...scores, cha: 13 } });
    expect(sorcerousRestoration(s, { sorcerousRestoration: 1, sorceryPoints: 0 }, { sorceryPoints: 5 }).sorceryPoints).toBe(2);
  });

  it('Lifedrinker HP zarı havuzu zar türü başına; harcama büyük zardan, savaş sonu türüyle', () => {
    const s = mc([{ classId: 'warlock', level: 9 }, { classId: 'fighter', level: 3 }], { invocations: ['pact-of-the-blade', 'lifedrinker'] });
    const c = pc(s);
    expect(c.hitDice).toEqual({ die: 10, left: 12, pool: { 8: 9, 10: 3 } });
    const st = { combatants: { A: c } } as unknown as BattleState;
    const after = applyEvents(st, [{ type: 'hit_die_spent', actorId: 'A', left: 11, die: 10 }]).combatants.A as Combatant;
    expect(after.hitDice).toEqual({ die: 10, left: 11, pool: { 8: 9, 10: 2 } });
    expect(mcImpl().spentFromPool(s, after.hitDice!.pool!)).toEqual({ 10: 1 });
    const back = withStatus(c, { sheet: s, status: { ...fullStatus(s), hitDiceSpent: 1, hitDiceSpentBy: { 10: 1 } } });
    expect(back.hitDice).toEqual({ die: 10, left: 11, pool: { 8: 9, 10: 2 } });
  });
});
