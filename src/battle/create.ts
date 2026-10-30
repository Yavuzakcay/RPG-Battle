/** Karakter formundan ve canavar şablonundan savaşçı oluşturma, savaşı başlatma. */
import { ABILITIES, abilityModifier, type Ability } from '../rules/abilities';
import type { Height } from '../rules/conditions';
import { rollD20, rollDie, rollTag, type Rng } from '../rules/dice';
import type { DiceMode } from '../rules/manualDice';
import { skillBonus, type Skill } from '../rules/skills';
import { armorProficient, deriveStats, raceResistances, type CharacterSheet, type Scores } from '../rules/stats';
import { armor, getClass, getMonster, getRace, spells, type Lineage, type Monster, type ReactionMechanic } from '../data';
import { lineageOf, lineageSpells, raceDarkvision } from '../rules/lineage';
import { carryLoad, carrySpeedPenalty, heavilyLoaded, type CarryRule } from '../rules/carry';
import { GIANT_RESOURCE } from './giant';
import creatureTypes from '../../data/canavar-turleri.json';
import monsterReactions from '../../data/monster-reactions.json';
import { monsterAvatar, sheetAvatar } from './avatar';
import { monsterAttackArea } from '../rules/areaParse';
import { hasBonusUnarmed, offHandAttackOption, unarmedStrikeOption, weaponAttackOptions } from './weapons';
import { activeMasteries, weaponMasteryId } from '../rules/mastery';
import { classKit, classResources, resourceDef } from '../rules/classFeatures';
import { environmentFor, getMap, resolveMapChoice } from '../map/maps';
import { FRESH_ECONOMY, FRESH_MAP_STATUS, NO_RESOURCES, type ReactionSpec, type UsableFeature, type Avatar, type BattleEvent, type BattleState, type ActiveEffect, type Combatant, type DragonWakeMode, type MapState } from './types';
import { civilianLook, defaultCivilianLook } from './civilianLooks';
import { exhaustionD20Penalty } from '../rules/exhaustion';

/**
 * Karakterin tepkileri (Görev R1): sınıf özellikleri (veriden) ve bildiği tepki büyüleri (`mechanics.reaction`;
 * kimlik SRD büyü kimliği, save büyünün save'i).
 */
function sheetReactions(kit: ReturnType<typeof classKit>, known: string[]): ReactionSpec[] {
  const fromSpells = known
    .map((n) => spells.find((s) => s.name === n))
    .filter((s): s is NonNullable<typeof s> => !!s?.mechanics.reaction)
    .map((s) => ({ ...(s.mechanics.reaction as ReactionMechanic), id: s.srd, name: s.name, spell: s.name,
      ...(s.mechanics.save ? { save: s.mechanics.save } : {}), ...(s.rangeFt > 0 ? { rangeFt: s.rangeFt } : {}) }));
  return [...kit.reactions, ...fromSpells];
}

/** Canavarın çalışan tepkileri (data/monster-reactions.json; `none` olanlar alınmaz) ve kullanım havuzları. */
type MonsterReaction = ReactionMechanic & { id: string; name: string; status: string; note?: string };
export function monsterReactionsOf(monsterId: string): MonsterReaction[] {
  return ((monsterReactions.monsters as unknown as Record<string, MonsterReaction[]>)[monsterId] ?? []);
}
function monsterReactionFields(monsterId: string): Partial<Combatant> {
  const list = monsterReactionsOf(monsterId).filter((r) => r.status !== 'none')
    .map(({ status: _s, note: _n, ...r }) => r as ReactionSpec);
  if (list.length === 0) return {};
  const uses: Record<string, number> = {};
  for (const r of list) if (r.pool && r.uses !== undefined) uses[r.pool] = r.uses;
  return { reactions: list, ...(Object.keys(uses).length ? { reactionUses: uses } : {}) };
}

/** Görev K3: Goliath Cloud's Jaunt (bonus eylemle 30 ft ışınlanma; Giant Ancestry kaynağı). */
function lineageFeatures(lineage: Lineage | undefined): UsableFeature[] {
  if (lineage?.giant !== 'cloud') return [];
  return [{ key: 'species:goliath/clouds-jaunt', name: "Cloud's Jaunt", type: 'bonus', resource: GIANT_RESOURCE, effect: { kind: 'teleport', rangeFt: 30, sight: true } }];
}

/** Görev K3: Goliath Stone's Endurance (hasarı 1d12 + CON azaltır) ve Storm's Thunder (60 ft, 1d8 Thunder) tepkileri. */
function lineageReactions(lineage: Lineage | undefined, conMod: number): ReactionSpec[] {
  if (lineage?.giant === 'stone') {
    return [{ id: 'species:goliath/stones-endurance', name: "Stone's Endurance", kind: 'reduce', dice: `1d12${conMod >= 0 ? '+' : ''}${conMod}`, resource: GIANT_RESOURCE }];
  }
  if (lineage?.giant === 'storm') {
    return [{ id: 'species:goliath/storms-thunder', name: "Storm's Thunder", kind: 'thunder', dice: '1d8', damageType: 'thunder', rangeFt: 60, resource: GIANT_RESOURCE }];
  }
  return [];
}

/** Türün nefesi (Dragonborn): zar karakter seviyesinden, hasar türü mirasın direncinden. */
function breathOf(sheet: CharacterSheet, conMod: number, proficiency: number): Partial<Combatant> {
  const b = getRace(sheet.raceId).breathWeapon;
  if (!b) return {};
  const dice = Object.entries(b.dice).filter(([l]) => sheet.level >= Number(l)).map(([, v]) => v).pop() ?? '1d10';
  const damageType = raceResistances(sheet)[0] ?? 'fire';
  return { breath: { srd: b.srd, resource: b.resource, save: b.save, dc: 8 + conMod + proficiency, dice, damageType, shapes: b.shapes } };
}

/** Uyuyan ejderhanın savaşçı kimliği. */
export const DRAGON_ID = 'ejderha';

export { characterTokenFile, monsterAvatar, sheetAvatar } from './avatar';

const armorStealthDisadvantage = (name: string): boolean =>
  armor.find((a) => a.name === name)?.stealthDisadvantage === true;

export function combatantFromSheet(
  sheet: CharacterSheet,
  opts: { id: string; ownerId: string; height?: Height; carryRule?: CarryRule },
): Combatant {
  const d = deriveStats(sheet);
  // Görev K5: kademeli taşıma kuralında yük hızı düşürür, ağır yükte STR/DEX/CON d20 testleri ve saldırılar dezavantajlı.
  const carryRule = opts.carryRule ?? 'off';
  const load = carryLoad(sheet, carryRule);
  const heavy = heavilyLoaded(load.level, carryRule);
  // Görev K9d: eğitimsiz zırh (SRD 5.2.1 Armor Training): STR/DEX d20 testleri (saldırı, save, kontrol) dezavantajlı, büyü
  // yok. Kalkanın cezası yalnızca AC (`deriveStats`).
  const untrained = !armorProficient(sheet.classId, armor.find((a) => a.name === sheet.armorName)?.type, sheet.featureChoices);
  const standing: ActiveEffect[] = [
    ...(heavy ? [{ id: 'load:heavy', name: 'Ağır yüklü', sourceId: opts.id, attackDis: {}, saveDis: ['str', 'dex', 'con'], checkDis: ['str', 'dex', 'con'] } satisfies ActiveEffect] : []),
    ...(untrained ? [{ id: 'armor:untrained', name: 'Eğitimsiz zırh', sourceId: opts.id, attackDis: {}, saveDis: ['str', 'dex'], checkDis: ['str', 'dex'], noCast: true } satisfies ActiveEffect] : []),
  ];
  const race = getRace(sheet.raceId);
  const cls = getClass(sheet.classId);
  const kit = classKit(sheet.classId, sheet.level, sheet.subclassId, sheet.featureChoices);
  // Görev K3: soy (soy büyüleri, karanlık görüş, Giant Ancestry); kaynaklar soya göre.
  const lineage = lineageOf(sheet);
  const resources = classResources(sheet.classId, sheet.level, d.modifiers, sheet.raceId, lineage?.id);
  // Kaynakla slotsuz yapılan büyü her zaman hazır (Favored Enemy → Hunter's Mark).
  const freeSpells = Object.keys(resources).map((id) => resourceDef(id)?.freeSpell).filter((x): x is string => !!x);
  // Her zaman hazır büyüler (Divine Smite, yemin büyüleri; Görev P-Paladin) seçilenlere eklenir.
  // Unarmed Strike (Martial Arts geçerliyken; Görev P-Monk).
  const unarmed = unarmedStrikeOption(sheet);
  const known0 = [...(sheet.spellNames ?? []), ...kit.alwaysPrepared.filter((n) => !(sheet.spellNames ?? []).includes(n))];
  const fromLineage = lineageSpells(sheet);
  const known = [...known0, ...fromLineage.filter((n) => !known0.includes(n))];
  // Soy büyülerinin yeteneği (SRD: INT, WIS ya da CHA, soy seçilirken): büyücü sınıfta sınıfın yeteneği, değilse en
  // yükseği (yaklaşık; DECISIONS.md, Görev K3).
  const castAbility = cls.casting?.ability
    ?? (fromLineage.length > 0 ? (['int', 'wis', 'cha'] as const).reduce((a, b) => (d.modifiers[b] > d.modifiers[a] ? b : a)) : null);
  const castMod = castAbility ? d.modifiers[castAbility] : 0;
  return {
    id: opts.id,
    name: sheet.name,
    avatar: sheetAvatar(sheet),
    raceId: sheet.raceId,
    ...(lineage ? { lineageId: lineage.id } : {}),
    ...(lineage?.giant ? { giant: lineage.giant } : {}),
    side: 'party',
    ownerId: opts.ownerId,
    ac: d.ac,
    hp: d.maxHp,
    maxHp: d.maxHp,
    speed: Math.max(0, d.speed - carrySpeedPenalty(load.level, carryRule)),
    ...(load.level !== 'ok' ? { load: load.level } : {}),
    ...(standing.length > 0 ? { effects: standing } : {}),
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
    darkvision: raceDarkvision(sheet),
    civilian: false,
    mapStatus: FRESH_MAP_STATUS,
    economy: FRESH_ECONOMY,
    attacksPerAction: kit.attacksPerAction,
    bonusActions: kit.bonusActions,
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
    spellMod: castMod,
    spellSaveDc: d.spellSaveDc ?? (castAbility ? 8 + d.proficiency + castMod : null),
    spellAttack: d.spellAttack ?? (castAbility ? d.proficiency + castMod : null),
    spellNames: [...known, ...freeSpells.filter((n) => !known.includes(n))],
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
    weaponOptions: [...(sheet.weapons ?? []).flatMap((w) => weaponAttackOptions(sheet, w.name, w.enchant ?? 0)), ...(unarmed ? [unarmed] : [])],
    // Yan el (Light ek saldırısı; Görev P1): Nick'li yan el silahıyla Attack eyleminin içinde.
    ...((): Partial<Combatant> => {
      const off = offHandAttackOption(sheet);
      return off ? { offHandOption: off, ...(off.weaponId && weaponMasteryId(off.weaponId) === 'nick' && activeMasteries(sheet).has(off.weaponId) ? { nickOffhand: true } : {}) } : {};
    })(),
    concentration: null,
    resources,
    sneakAttackDice: kit.sneakAttackDice,
    // Barbarian (veriden): Rage, Danger Sense, Reckless Attack, Frenzy, Primal Knowledge.
    ...(kit.rage ? { rageDamage: kit.rage.damage, rageResist: kit.rage.resist, rageStrAdvantage: kit.rage.strAdvantage, rage: null } : {}),
    ...(kit.saveAdvantages.length > 0 ? { saveAdvantage: kit.saveAdvantages } : {}),
    ...(kit.reckless ? { canReckless: true } : {}),
    ...(kit.frenzy ? { frenzy: true } : {}),
    ...(kit.primalSkills.length > 0 ? { primalSkills: kit.primalSkills as Skill[] } : {}),
    // Savaşta kullanılan sınıf özellikleri (Lay On Hands, Sacred Weapon; veriden).
    ...((): Partial<Combatant> => { const f = [...kit.usable, ...lineageFeatures(lineage)]; return f.length > 0 ? { features: f } : {}; })(),
    // Monk (Görev P-Monk; veriden): bonus Unarmed Strike, Focus eylemleri, Uncanny Metabolism, Deflect Attacks,
    // Slow Fall, Stunning Strike, Open Hand Technique.
    ...(unarmed && hasBonusUnarmed(sheet) ? { bonusStrike: unarmed } : {}),
    ...(kit.focusActions.length > 0 ? { focusActions: kit.focusActions } : {}),
    ...(kit.metabolism ? { metabolism: { ...kit.metabolism, max: resources[kit.metabolism.refill] ?? 0 } } : {}),
    ...(kit.deflect ? { deflect: {
      dice: kit.deflect.dice, bonus: d.modifiers.dex + sheet.level, types: kit.deflect.types,
      // Geri yöneltme: Focus, iki Martial Arts zarı + DEX, DEX save (DC 8 + WIS + yetkinlik; Monk DC'si).
      ...(kit.deflect.redirect && kit.martialArts ? { redirect: {
        resource: kit.deflect.redirect.resource, save: kit.deflect.redirect.save,
        dice: `${kit.deflect.redirect.dieCount}d${kit.martialArts.die.split('d')[1] ?? '6'}`, dc: 8 + d.modifiers.wis + d.proficiency,
      } } : {}),
    } } : {}),
    ...(kit.fallReduction > 0 ? { fallReduction: kit.fallReduction } : {}),
    ...(kit.stunning ? { stunning: { resource: kit.stunning.resource, save: kit.stunning.save, dc: 8 + d.modifiers[kit.stunning.dcAbility] + d.proficiency, condition: kit.stunning.condition } } : {}),
    ...(kit.openHand.length > 0 ? { openHand: kit.openHand } : {}),
    // Tepkiler (Görev R1): sınıf özellikleri ve tepki büyüleri; fırsat saldırısı herkeste.
    ...((): Partial<Combatant> => { const r = [...sheetReactions(kit, known), ...lineageReactions(lineage, d.modifiers.con)]; return r.length ? { reactions: r } : {}; })(),
    sneakTurn: null,
    size: race.sizes.includes('M') ? 'M' : 'S',
    proficiency: d.proficiency,
    // Dragonborn Breath Weapon (Görev R4; data/races.json): miras direnci hasar türü, DC 8 + CON + yetkinlik.
    ...breathOf(sheet, d.modifiers.con, d.proficiency),
    // Görev F: pasif özellik işaretleri ve kritik eşiği (veriden).
    ...(kit.traits.length > 0 ? { traits: kit.traits } : {}),
    ...(kit.critOn < 20 ? { critOn: kit.critOn } : {}),
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
    // SRD yaratık türü (Divine Smite, Protection from Evil and Good; data/canavar-turleri.json).
    ...((creatureTypes.types as Record<string, string>)[monster.id] ? { creatureType: (creatureTypes.types as Record<string, string>)[monster.id] } : {}),
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
      // Alanlı save saldırısı (nefes, koni, çizgi…; Görev R4).
      ...(a.save && (a.area ?? monsterAttackArea(a.damage)) ? { area: a.area ?? monsterAttackArea(a.damage) } : {}),
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
    // Tepkiler (Görev R1): Parry, Protective Magic… (data/monster-reactions.json).
    ...monsterReactionFields(monster.id),
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
  opts: { map?: MapChoice; diceMode?: DiceMode } = {},
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
  // Remarkable Athlete (Champion; Görev F): inisiyatifte avantaj.
  const rolled = participants.map((p) => {
    const tag = rollTag(rng, { kind: 'initiative', by: p.id, bonus: p.initiativeBonus });
    const d = p.traits?.includes('remarkable-athlete') ? rollD20('advantage', tag).kept : rollDie(20, tag);
    // Bitkinlik (Görev S1): inisiyatif DEX kontrolü, −2 × seviye.
    return { ...p, initiative: d + p.initiativeBonus - exhaustionD20Penalty(p.exhaustion) };
  });
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
    ...(opts.diceMode && opts.diceMode !== 'auto' ? { diceMode: opts.diceMode } : {}),
  };
  return { state, events: [{ type: 'battle_started', state }] };
}
