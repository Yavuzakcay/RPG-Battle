/** Karakter formundan ve canavar şablonundan savaşçı oluşturma, savaşı başlatma. */
import { ABILITIES, abilityModifier, type Ability } from '../rules/abilities';
import type { Height } from '../rules/conditions';
import { rollDie, type Rng } from '../rules/dice';
import { skillBonus } from '../rules/skills';
import { deriveStats, raceResistances, type CharacterSheet, type Scores } from '../rules/stats';
import { armor, getClass, getMonster, getRace, type Monster } from '../data';
import { weaponAttackOptions } from './weapons';
import { attacksPerActionFor, bonusActionsFor, classResources, sneakAttackDiceFor } from './economy';
import { environmentFor, getMap, resolveMapChoice } from '../map/maps';
import { FRESH_ECONOMY, FRESH_MAP_STATUS, NO_RESOURCES, type Avatar, type BattleEvent, type BattleState, type Combatant, type DragonWakeMode, type MapState } from './types';
import { civilianLook, defaultCivilianLook } from './civilianLooks';

/** Uyuyan ejderhanın savaşçı kimliği. */
export const DRAGON_ID = 'ejderha';

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

/** Koddaki cinsiyet → jeton dosya adındaki İngilizce karşılığı. */
const GENDER_FILE: Record<'erkek' | 'kadin', 'male' | 'female'> = { erkek: 'male', kadin: 'female' };

/**
 * Karakter jetonunun dosya adı (tek yer; başka biçimde kurulmaz): `<ırk>-<male|female>-<sınıf>.webp`.
 * Irk ve sınıf kimlikleri zaten İngilizce (celestial, dragonborn... / barbarian, bard...);
 * cinsiyet erkek→male, kadin→female; cinsiyetsiz eski kayıt male.
 */
export function characterTokenFile(raceId: string, gender: 'erkek' | 'kadin' | undefined, classId: string): string {
  return `${raceId}-${GENDER_FILE[gender ?? 'erkek']}-${classId}.webp`;
}

/**
 * Karakter jetonu (pixel art, karşıdan çizili): `characters/` + `characterTokenFile`.
 * Cinsiyeti olmayan eski kayıtlar erkek (male). Yoksa eski `avatars/<ırk>-<sınıf>-<cinsiyet>.webp`,
 * o da yoksa baş harfli rozet (yedek zinciri).
 */
export function sheetAvatar(sheet: CharacterSheet): Avatar {
  const gender = sheet.gender ?? 'erkek';
  return {
    src: sheet.avatar ?? `characters/${characterTokenFile(sheet.raceId, gender, sheet.classId)}`,
    fallbacks: sheet.avatar ? [] : [`avatars/${sheet.raceId}-${sheet.classId}-${gender}.webp`],
    bg: RACE_COLOR[sheet.raceId] ?? '#4a5560',
    label: CLASS_LABEL[sheet.classId] ?? sheet.classId.slice(0, 2),
  };
}

/** Canavar jetonu: `public/monsters/<id>.webp`; uyurken (varsa) `<id>-uyku.webp`. */
export function monsterAvatar(monster: Monster): Avatar {
  const words = monster.name.split(' ');
  const label = words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : monster.name.slice(0, 2);
  return { src: monster.avatar ?? `monsters/${monster.id}.webp`, asleepSrc: `monsters/${monster.id}-uyku.webp`, bg: '#6b2a2f', label };
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
    raceId: sheet.raceId,
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
    darkvision: race.darkvision,
    civilian: false,
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
    // Ranger (Favored Enemy): Hunter's Mark her zaman hazır.
    spellNames: sheet.classId === 'ranger' && !(sheet.spellNames ?? []).includes("Hunter's Mark")
      ? [...(sheet.spellNames ?? []), "Hunter's Mark"] : sheet.spellNames ?? [],
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
    concentration: null,
    resources: classResources(sheet.classId, sheet.level),
    sneakAttackDice: sneakAttackDiceFor(sheet.classId, sheet.level),
    sneakTurn: null,
    size: race.sizes.includes('M') ? 'M' : 'S',
    proficiency: d.proficiency,
  };
}

/** Canavarın yetkinlik bonusu CR'den (SRD 5.2.1): 0–4: +2, 5–8: +3, 9–12: +4, 13–16: +5, ... */
export function crProficiency(cr: string): number {
  const n = cr.includes('/') ? 0 : Number(cr);
  return Number.isFinite(n) ? 2 + Math.floor(Math.max(0, n - 1) / 4) : 2;
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
    monsterId: monster.id,
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
    darkvision: monster.darkvision ?? 0,
    civilian: false,
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
    concentration: null,
    resources: NO_RESOURCES,
    sneakAttackDice: 0,
    sneakTurn: null,
    size: monster.size ?? 'M',
    proficiency: crProficiency(monster.cr),
  };
}

/** Haritalı savaş seçenekleri: harita, varyant (varsayılan ilki) ve yatay aynalama. */
export interface MapChoice {
  id: string;
  variantId?: string;
  mirrored?: boolean;
  /** Açılacak isteğe bağlı kurallar (karanlık, masumları koru). */
  options?: string[];
  /** Masumları koru açıksa masum sayısı (kuraldaki en az/en çok aralığına sıkıştırılır). */
  civilians?: number;
  /** Sıkı kural: masumların en az yarısı (haritanın oranı) ölürse düşmanlar kazanır. Varsayılan kapalı. */
  strictObjective?: boolean;
  /** Uyuyan ejderha varyantı: ejderhanın canavar kimliği (kuraldaki `dragons` listesinden). */
  dragon?: string;
  /** Yapay zekâ düşmanlarının ejderhayı uyandırma kipi ve `chance` yüzdesi (varsayılan: varyantın JSON'u). */
  dragonWake?: DragonWakeMode;
  dragonWakeChance?: number;
  /** Masum görünümlerinin karışık atanma tohumu (arayüz rastgele verir; başlangıç olayında saklanır). Varsayılan 1. */
  civilianArtSeed?: number;
}

/** Korunacak masum (GM yönetir, silahsız, eylem yapmaz). Değerler haritanın `objective` kuralından. */
export function civilianCombatant(index: number, stats: { hp: number; ac: number; speedHexes: number }, gorselId = defaultCivilianLook(index)): Combatant {
  const look = civilianLook(gorselId);
  return {
    id: `masum${index}`, name: `Masum ${index}`, avatar: { src: look?.image ?? 'avatars/masum.webp', bg: '#8a7a4a', label: 'M' },
    ...(look ? { gorselId: look.id } : {}),
    side: 'party', ownerId: null, civilian: true, ac: stats.ac, hp: stats.hp, maxHp: stats.hp, speed: stats.speedHexes * 5,
    initiativeBonus: 0, initiative: 0, height: 0, pos: null, movementUsed: 0, fly: 0, strScore: 10, run: null, hidden: null,
    stealthDisadvantage: false, darkvision: 0, heavyArmor: false, mapStatus: FRESH_MAP_STATUS, economy: FRESH_ECONOMY,
    attacksPerAction: 1, bonusActions: [], conditions: [],
    modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }, saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    skills: {}, climbMod: 0, spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0], resistances: [], immunities: [], vulnerabilities: [],
    packTactics: false, level: 0, spellMod: 0, spellSaveDc: null, spellAttack: null, spellNames: [], casterTag: 'civilian',
    attacks: [], multiattack: false, undeadFortitude: false, regeneration: 0, rechargeUsed: [], regenBlocked: false,
    regenPending: false, life: 'alive', deathSaves: { successes: 0, failures: 0 }, weaponOptions: [],
    concentration: null, resources: NO_RESOURCES, sneakAttackDice: 0, sneakTurn: null, size: 'M', proficiency: 2,
  };
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
  // Eski kimlik ya da bilinmeyen harita/varyant çökmez, varsayılana düşer.
  if (opts.map) opts = { ...opts, map: { ...opts.map, ...resolveMapChoice(opts.map.id, opts.map.variantId) } };
  if (opts.map) {
    const m = getMap(opts.map.id, { mirrored: opts.map.mirrored ?? false, ...(opts.map.variantId ? { variantId: opts.map.variantId } : {}) });
    const variant = opts.map.variantId ? m.variants.find((v) => v.id === opts.map?.variantId) : m.variants[0];
    if (!variant) throw new Error(`Harita varyantı bulunamadı: "${opts.map.variantId ?? ''}"`);
    map = {
      id: m.id, variantId: variant.id, mirrored: m.mirrored, tiles: [...m.tiles],
      ...(opts.map.options && opts.map.options.length > 0 ? { options: [...opts.map.options] } : {}),
    };
    env = environmentFor(m, variant.id);
    const objective = variant.rules.find((r) => r.id === 'objective');
    if (objective && map.options?.includes('objective')) {
      const c = objective.civilians as { min: number; max: number; default?: number; hp: number; ac: number; speedHexes: number };
      const n = Math.min(c.max, Math.max(c.min, Math.round(opts.map.civilians ?? c.default ?? c.min)));
      // 0 masum: kural açık olsa da masum ve sayaç yok.
      if (n > 0) {
        // Görünümler tohumla karışık (savaşın kendi zarlarını tüketmez); 8'den fazla masumda sıra yeniden başlar.
        // GM kurulumda değiştirebilir (`choose_civilian_art`).
        const seed = opts.map.civilianArtSeed ?? 1;
        participants = [...participants, ...Array.from({ length: n }, (_, i) => civilianCombatant(i + 1, c, defaultCivilianLook(i + 1, seed)))];
        map.objective = {
          total: n, needed: Math.ceil(n * (objective.minSurvivorsRatio as number)),
          ...(opts.map.strictObjective ? { strict: true } : {}),
        };
      }
    }
    // Uyuyan ejderha (`sleepingDragon`): düşman tarafına uyur halde eklenir; yeri kuralın `at`ı.
    const sleeping = variant.rules.find((r) => r.id === 'sleepingDragon');
    if (sleeping) {
      const allowed = (sleeping.dragons as string[] | undefined) ?? [String(sleeping.dragon)];
      const pick = opts.map.dragon && allowed.includes(opts.map.dragon) ? opts.map.dragon : String(sleeping.dragon);
      const mon = getMonster(pick);
      participants = [...participants, {
        ...combatantFromMonster(mon, { id: DRAGON_ID, name: mon.name }),
        asleep: true,
      }];
      const pct = opts.map.dragonWakeChance ?? (typeof sleeping.chancePct === 'number' ? sleeping.chancePct : 2);
      map.dragon = {
        id: DRAGON_ID, mode: opts.map.dragonWake ?? ((sleeping.dragonWake as DragonWakeMode | undefined) ?? 'never'),
        chancePct: Math.max(0, Math.min(100, Math.round(pct))),
      };
    }
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
