/** Karakter formundan ve canavar şablonundan savaşçı oluşturma, savaşı başlatma. */
import { ABILITIES, abilityModifier, type Ability } from '../rules/abilities';
import type { Height } from '../rules/conditions';
import { rollDie, type Rng } from '../rules/dice';
import { deriveStats, raceResistances, type CharacterSheet, type Scores } from '../rules/stats';
import { getClass, getRace, type Monster } from '../data';
import { weaponAttackOption } from './weapons';
import { getMap } from '../map/maps';
import type { BattleEvent, BattleState, Combatant, MapState } from './types';

export function combatantFromSheet(
  sheet: CharacterSheet,
  opts: { id: string; ownerId: string; height?: Height },
): Combatant {
  const d = deriveStats(sheet);
  const race = getRace(sheet.raceId);
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
    pos: null,
    movementUsed: 0,
    fly: 0,
    strScore: d.scores.str,
    run: null,
    conditions: [],
    modifiers: d.modifiers,
    saves: d.saves,
    climbMod: Math.max(d.modifiers.str, d.modifiers.dex),
    spellSlots: d.spellSlots,
    resistances: raceResistances(sheet),
    immunities: [],
    vulnerabilities: [],
    packTactics: false,
    level: sheet.level,
    spellMod: cls.casting ? d.modifiers[cls.casting.ability] : 0,
    spellSaveDc: d.spellSaveDc,
    spellAttack: d.spellAttack,
    spellNames: sheet.spellNames ?? [],
    casterTag: `${race.name} ${cls.name}`.toLowerCase(),
    attacks: [],
    multiattack: false,
    undeadFortitude: false,
    regeneration: 0,
    rechargeUsed: [],
    regenBlocked: false,
    regenPending: false,
    life: 'alive',
    deathSaves: { successes: 0, failures: 0 },
    weaponOptions: (sheet.weapons ?? []).map((w) => weaponAttackOption(sheet, w.name, w.enchant ?? 0)),
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
    pos: null,
    movementUsed: 0,
    fly: monster.fly ?? 0,
    strScore: monster.abilities.str,
    run: null,
    conditions: [],
    modifiers: mods,
    saves: { ...mods, ...monster.saves },
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
    weaponOptions: [],
  };
}

/** Haritalı savaş seçenekleri: harita, varyant (varsayılan ilki) ve yatay aynalama. */
export interface MapChoice {
  id: string;
  variantId?: string;
  mirrored?: boolean;
}

/**
 * Herkes için initiative atar, sıralar ve ilk durumu "battle_started" olayı olarak döndürür.
 * Harita verilirse savaş kurulum aşamasında başlar ve ortam haritadan gelir.
 */
export function startBattle(
  id: string,
  environmentId: string,
  participants: Combatant[],
  rng: Rng,
  opts: { map?: MapChoice } = {},
): { state: BattleState; events: BattleEvent[] } {
  let map: MapState | undefined;
  let env = environmentId;
  if (opts.map) {
    const m = getMap(opts.map.id, { mirrored: opts.map.mirrored ?? false });
    const variant = opts.map.variantId ? m.variants.find((v) => v.id === opts.map?.variantId) : m.variants[0];
    if (!variant) throw new Error(`Harita varyantı bulunamadı: "${opts.map.variantId ?? ''}"`);
    map = { id: m.id, variantId: variant.id, mirrored: m.mirrored, tiles: [...m.tiles] };
    env = m.environmentId;
  }
  const rolled = participants.map((p) => ({ ...p, initiative: rollDie(20, rng) + p.initiativeBonus }));
  // Aynı toplamda, listede önce gelen önce oynar (sıralama kararlıdır).
  const sorted = [...rolled].sort((a, b) => b.initiative - a.initiative);
  const combatants: Record<string, Combatant> = {};
  for (const c of sorted) combatants[c.id] = c;
  const state: BattleState = {
    id,
    environmentId: env,
    status: map ? 'setup' : 'active',
    ...(map ? { map } : {}),
    round: 1,
    order: sorted.map((c) => c.id),
    turnIndex: 0,
    combatants,
  };
  return { state, events: [{ type: 'battle_started', state }] };
}
