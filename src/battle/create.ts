/** Karakter formundan ve canavar şablonundan savaşçı oluşturma, savaşı başlatma. */
import { ABILITIES, abilityModifier, type Ability } from '../rules/abilities';
import type { Height } from '../rules/conditions';
import { rollDie, type Rng } from '../rules/dice';
import { skillBonus } from '../rules/skills';
import { deriveStats, raceResistances, type CharacterSheet, type Scores } from '../rules/stats';
import { armor, getClass, getRace, type Monster } from '../data';
import { weaponAttackOptions } from './weapons';
import { attacksPerActionFor, bonusActionsFor } from './economy';
import { environmentFor, getMap } from '../map/maps';
import { FRESH_ECONOMY, FRESH_MAP_STATUS, type Avatar, type BattleEvent, type BattleState, type Combatant, type MapState } from './types';

/** Yer tutucu zemin rengi: ırka göre. */
const RACE_COLOR: Record<string, string> = {
  celestial: '#b8932a', dragonborn: '#a84330', dwarf: '#8a5a2b', elf: '#3f8f4f', gnome: '#7a4fa0',
  goliath: '#5f6f7c', halfling: '#c27436', human: '#3d6fa8', orc: '#4f7a2a', tiefling: '#8c2f5a',
};
/** Yer tutucu yazısı: sınıfın kısa adı. */
const CLASS_LABEL: Record<string, string> = {
  barbarian: 'Bb', bard: 'Bd', cleric: 'Cl', druid: 'Dr', fighter: 'Fi', monk: 'Mo', paladin: 'Pa',
  ranger: 'Ra', rogue: 'Ro', sorcerer: 'So', warlock: 'Wa', wizard: 'Wi',
};

/** Karakter avatarı: dosya adı kuralı `avatars/<ırk>-<sınıf>-<erkek|kadin>.webp`. */
export function sheetAvatar(sheet: CharacterSheet): Avatar {
  return {
    src: sheet.avatar ?? `avatars/${sheet.raceId}-${sheet.classId}-${sheet.gender ?? 'erkek'}.webp`,
    bg: RACE_COLOR[sheet.raceId] ?? '#4a5560',
    label: CLASS_LABEL[sheet.classId] ?? sheet.classId.slice(0, 2),
  };
}

/** Canavar avatarı: dosya adı kuralı `avatars/canavar-<id>.webp`. */
export function monsterAvatar(monster: Monster): Avatar {
  const words = monster.name.split(' ');
  const label = words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : monster.name.slice(0, 2);
  return { src: monster.avatar ?? `avatars/canavar-${monster.id}.webp`, bg: '#6b2a2f', label };
}

const armorStealthDisadvantage = (name: string): boolean =>
  armor.find((a) => a.name === name)?.stealthDisadvantage === true;

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
    avatar: sheetAvatar(sheet),
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
    hidden: null,
    stealthDisadvantage: armorStealthDisadvantage(sheet.armorName),
    heavyArmor: armor.find((a) => a.name === sheet.armorName)?.type === 'heavy',
    mapStatus: FRESH_MAP_STATUS,
    economy: FRESH_ECONOMY,
    attacksPerAction: attacksPerActionFor(sheet.classId, sheet.level),
    bonusActions: bonusActionsFor(sheet.classId, sheet.level),
    conditions: [],
    modifiers: d.modifiers,
    saves: d.saves,
    skills: d.skills,
    climbMod: Math.max(skillBonus(d, 'athletics'), skillBonus(d, 'acrobatics')),
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
    weaponOptions: (sheet.weapons ?? []).flatMap((w) => weaponAttackOptions(sheet, w.name, w.enchant ?? 0)),
  };
}

export function combatantFromMonster(
  monster: Monster,
  opts: { id: string; name?: string; height?: Height },
): Combatant {
  const mods = {} as Scores;
  for (const a of ABILITIES) mods[a as Ability] = abilityModifier(monster.abilities[a]);
  const who = { skills: monster.skills ?? {}, modifiers: mods };
  return {
    id: opts.id,
    name: opts.name ?? monster.name,
    avatar: monsterAvatar(monster),
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
    hidden: null,
    stealthDisadvantage: false,
    heavyArmor: false,
    mapStatus: FRESH_MAP_STATUS,
    economy: FRESH_ECONOMY,
    attacksPerAction: 1,
    bonusActions: monster.bonusActions ?? [],
    conditions: [],
    modifiers: mods,
    saves: { ...mods, ...monster.saves },
    skills: { ...monster.skills },
    climbMod: Math.max(skillBonus(who, 'athletics'), skillBonus(who, 'acrobatics')),
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
      ...(a.reachFt !== undefined ? { reachFt: a.reachFt } : {}),
      ...(a.range ? { range: a.range } : {}),
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
  /** Açılacak isteğe bağlı kurallar (karanlık, masumları koru). */
  options?: string[];
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
    map = {
      id: m.id, variantId: variant.id, mirrored: m.mirrored, tiles: [...m.tiles],
      ...(opts.map.options && opts.map.options.length > 0 ? { options: [...opts.map.options] } : {}),
    };
    env = environmentFor(m, variant.id);
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
