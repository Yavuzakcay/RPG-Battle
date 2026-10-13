/** Karakter formundan ve canavar şablonundan savaşçı oluşturma, savaşı başlatma. */
import { ABILITIES, abilityModifier, type Ability } from '../rules/abilities';
import type { Height } from '../rules/conditions';
import { rollDie, type Rng } from '../rules/dice';
import { deriveStats, type CharacterSheet, type Scores } from '../rules/stats';
import { getClass, getRace, type Monster } from '../data';
import type { BattleEvent, BattleState, Combatant } from './types';

export function combatantFromSheet(
  sheet: CharacterSheet,
  opts: { id: string; ownerId: string; height?: Height },
): Combatant {
  const d = deriveStats(sheet);
  const race = sheet.raceId;
  const cls = getClass(sheet.classId);
  return {
    id: opts.id,
    name: sheet.name,
    side: 'party',
    ownerId: opts.ownerId,
    ac: d.ac,
    hp: d.maxHp,
    maxHp: d.maxHp,
    speed: d.speed,
    initiativeBonus: d.initiative,
    initiative: 0,
    height: opts.height ?? 0,
    conditions: [],
    modifiers: d.modifiers,
    saves: d.saves,
    climbMod: Math.max(d.modifiers.str, d.modifiers.dex),
    spellSlots: d.spellSlots,
    resistances: race === 'hill-dwarf' ? ['poison'] : race === 'tiefling' ? ['fire'] : [],
    immunities: [],
    vulnerabilities: [],
    packTactics: false,
    level: sheet.level,
    spellMod: cls.casting ? d.modifiers[cls.casting.ability] : 0,
    spellSaveDc: d.spellSaveDc,
    spellAttack: d.spellAttack,
    spellNames: sheet.spellNames ?? [],
    casterTag: `${getRace(sheet.raceId).name} ${cls.name}`.toLowerCase(),
    attacks: [],
    multiattack: false,
    undeadFortitude: false,
    regeneration: 0,
    rechargeUsed: [],
    regenBlocked: false,
    regenPending: false,
    life: 'alive',
    deathSaves: { successes: 0, failures: 0 },
  };
}

export function combatantFromMonster(
  monster: Monster,
  opts: { id: string; name?: string; height?: Height },
): Combatant {
  const mods = {} as Scores;
  for (const a of ABILITIES) mods[a as Ability] = abilityModifier(monster.abilities[a]);
  return {
    id: opts.id,
    name: opts.name ?? monster.name,
    side: 'enemies',
    ownerId: null,
    ac: monster.ac,
    hp: monster.hp,
    maxHp: monster.hp,
    speed: monster.speed,
    initiativeBonus: mods.dex,
    initiative: 0,
    height: opts.height ?? 0,
    conditions: [],
    modifiers: mods,
    saves: { ...mods },
    climbMod: Math.max(mods.str, mods.dex),
    spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    resistances: monster.resistances ?? [],
    immunities: monster.immunities ?? [],
    vulnerabilities: monster.vulnerabilities ?? [],
    packTactics: monster.packTactics ?? false,
    level: 0,
    spellMod: 0,
    spellSaveDc: null,
    spellAttack: null,
    spellNames: [],
    casterTag: monster.name.toLowerCase(),
    attacks: monster.attacks.map((a) => ({
      name: a.name,
      bonus: a.bonus,
      damageDice: a.damageDice,
      damageType: a.damageType,
      save: a.save,
      rider: a.rider,
      recharge: a.recharge,
      repeat: a.repeat ?? 1,
      ranged: a.ranged ?? false,
      text: a.damage,
    })),
    multiattack: monster.multiattack ?? false,
    undeadFortitude: monster.undeadFortitude ?? false,
    regeneration: monster.regeneration ?? 0,
    rechargeUsed: [],
    regenBlocked: false,
    regenPending: false,
    life: 'alive',
    deathSaves: { successes: 0, failures: 0 },
  };
}

/** Herkes için initiative atar, sıralar ve ilk durumu "battle_started" olayı olarak döndürür. */
export function startBattle(
  id: string,
  environmentId: string,
  participants: Combatant[],
  rng: Rng,
): { state: BattleState; events: BattleEvent[] } {
  const rolled = participants.map((p) => ({ ...p, initiative: rollDie(20, rng) + p.initiativeBonus }));
  // Aynı toplamda, listede önce gelen önce oynar (sıralama kararlıdır).
  const sorted = [...rolled].sort((a, b) => b.initiative - a.initiative);
  const combatants: Record<string, Combatant> = {};
  for (const c of sorted) combatants[c.id] = c;
  const state: BattleState = {
    id,
    environmentId,
    status: 'active',
    round: 1,
    order: sorted.map((c) => c.id),
    turnIndex: 0,
    combatants,
  };
  return { state, events: [{ type: 'battle_started', state }] };
}
