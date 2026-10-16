/**
 * Denge ölçümü (Adım 11): 5 kişilik 5. seviye parti, farklı haritalarda tohumlu simülasyon.
 * Her iki taraf `battle/ai.ts` ile oynar. Arayüzü bilmez; `npm run sim` raporu basar.
 */
import { combatantFromMonster, combatantFromSheet, execute, startBattle, type BattleState, type Combatant, type Command } from '../battle';
import { currentActorId } from '../battle/common';
import { chooseCommand } from '../battle/ai';
import { getMonster } from '../data';
import { seededRng, type Rng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import { createMapBattle } from '../app/setup';
import { contextFor } from '../ui/session';

/** Tohumlu zar (mulberry32): aynı tohum aynı savaş. */
export const seeded = seededRng;

/** 5. seviye parti: savaşçı, büyücü, rahip, haydut, korucu (oluşturucu kurallarına uyar). */
export const PARTY: CharacterSheet[] = [
  {
    name: 'Bor', raceId: 'dwarf', classId: 'fighter', level: 5, gender: 'erkek',
    baseScores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 }, backgroundBonuses: { str: 2, con: 1 },
    armorName: 'Chain Mail', shield: true, itemNames: [], weapons: [{ name: 'Longsword' }, { name: 'Light crossbow' }],
    skills: ['athletics', 'perception', 'intimidation', 'survival'],
  },
  {
    name: 'Mira', raceId: 'elf', classId: 'wizard', level: 5, gender: 'kadin',
    baseScores: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 }, backgroundBonuses: { int: 2, con: 1 },
    armorName: 'Zırhsız', shield: false, itemNames: [], weapons: [{ name: 'Quarterstaff' }],
    spellNames: ['Fire Bolt', 'Ray of Frost', 'Magic Missile', 'Sleep', 'Scorching Ray', 'Hold Person', 'Fireball'],
    skills: ['arcana', 'investigation', 'history', 'insight', 'perception'],
  },
  {
    name: 'Tavi', raceId: 'human', classId: 'cleric', level: 5, gender: 'kadin',
    baseScores: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 }, backgroundBonuses: { wis: 2, con: 1 },
    armorName: 'Chain Mail', shield: true, itemNames: [], weapons: [{ name: 'Mace' }],
    spellNames: ['Sacred Flame', 'Guiding Bolt', 'Healing Word', 'Cure Wounds', 'Spiritual Weapon', 'Spirit Guardians'],
    skills: ['insight', 'medicine', 'religion', 'persuasion'],
  },
  {
    name: 'Sela', raceId: 'halfling', classId: 'rogue', level: 5, gender: 'kadin',
    baseScores: { str: 8, dex: 15, con: 14, int: 12, wis: 13, cha: 10 }, backgroundBonuses: { dex: 2, con: 1 },
    armorName: 'Studded Leather Armor', shield: false, itemNames: [], weapons: [{ name: 'Rapier' }, { name: 'Shortbow' }],
    skills: ['stealth', 'perception', 'acrobatics', 'deception', 'sleightOfHand', 'insight'], expertise: ['stealth', 'perception'],
  },
  {
    name: 'Kael', raceId: 'elf', classId: 'ranger', level: 5, gender: 'erkek',
    baseScores: { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 8 }, backgroundBonuses: { dex: 2, wis: 1 },
    armorName: 'Chain Shirt', shield: false, itemNames: [], weapons: [{ name: 'Longbow' }, { name: 'Shortsword' }],
    spellNames: ['Cure Wounds'], skills: ['perception', 'stealth', 'survival', 'nature', 'athletics'],
  },
];

export interface Scenario {
  id: string;
  name: string;
  /** Haritasız savaşta yok (soyut "Düz" ortamı). */
  /** Masumlar varsayılan olarak düşmandan en uzak altıgenlere; `middle` haritanın ortasına. */
  map?: {
    mapId: string; variantId: string; options?: string[]; civilians?: number; civilianPlacement?: 'far' | 'middle';
    /** Uyuyan ejderha varyantı: ejderha ve yapay zekâ düşmanlarının uyandırma kipi. */
    dragon?: string; dragonWake?: 'never' | 'chance' | 'gm'; dragonWakeChance?: number;
  };
  enemies: Record<string, number>;
}

/** CR → XP (SRD 5.2.1, tüm CR'ler). */
const XP: Record<string, number> = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900,
  '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000,
  '17': 18000, '18': 20000, '19': 22000, '20': 25000, '21': 33000, '22': 41000, '23': 50000, '24': 62000, '30': 155000,
};
export const scenarioXp = (s: Scenario) =>
  Object.entries(s.enemies).reduce((n, [id, k]) => n + (XP[getMonster(id).cr] ?? 0) * k, 0)
  // Uyuyan ejderha varyantın kendisinden gelir (listede yok); XP'ye eklenir.
  + (s.map?.dragon ? XP[getMonster(s.map.dragon).cr] ?? 0 : 0);

export const SCENARIOS: Scenario[] = [
  { id: 'duz', name: 'Düz — haritasız', enemies: { ogre: 1, 'bandit-captain': 1, 'gnoll-warrior': 4, wolf: 4, worg: 2, boar: 2 } },
  { id: 'col', name: 'Çöl — Gündüz', map: { mapId: 'col', variantId: 'gunduz' },
    enemies: { 'giant-scorpion': 2, mummy: 2, manticore: 2, 'gnoll-warrior': 4, 'giant-hyena': 1, scout: 2, 'death-dog': 1 } },
  { id: 'volkan', name: 'Volkan', map: { mapId: 'volkan', variantId: 'normal' },
    enemies: { 'hell-hound': 2, 'fire-elemental': 1, magmin: 2, imp: 2, 'magma-mephit': 1 } },
  // Uyuyan ejderha: ejderha ana tehdit (varyant ekler, listede yok), eşlik edenler az.
  { id: 'volkan-ejder', name: 'Volkan — uyuyan Young Red Dragon',
    map: { mapId: 'volkan', variantId: 'uyuyan-ejderha', dragon: 'young-red-dragon' }, enemies: { wyvern: 1, harpy: 2 } },
  { id: 'volkan-ejder-adult', name: 'Volkan — uyuyan Adult Red Dragon',
    map: { mapId: 'volkan', variantId: 'uyuyan-ejderha', dragon: 'adult-red-dragon' }, enemies: { wyvern: 1, harpy: 2 } },
  { id: 'volkan-ejder-ancient', name: 'Volkan — uyuyan Ancient Red Dragon',
    map: { mapId: 'volkan', variantId: 'uyuyan-ejderha', dragon: 'ancient-red-dragon' }, enemies: { wyvern: 1, harpy: 2 } },
  { id: 'volkan-ejder-wyrmling', name: 'Volkan — uyuyan Red Dragon Wyrmling',
    map: { mapId: 'volkan', variantId: 'uyuyan-ejderha', dragon: 'red-dragon-wyrmling' }, enemies: { wyvern: 2 } },
  { id: 'volkan-ejder-sans', name: 'Volkan — uyuyan Young Red, dragonWake: chance (varsayılan %2)',
    map: { mapId: 'volkan', variantId: 'uyuyan-ejderha', dragon: 'young-red-dragon', dragonWake: 'chance' },
    enemies: { wyvern: 1, harpy: 2 } },
  { id: 'orman', name: 'Orman', map: { mapId: 'orman', variantId: 'orman' },
    enemies: { owlbear: 2, werewolf: 2, 'giant-spider': 3, 'dire-wolf': 4, ettercap: 2, wolf: 2 } },
  { id: 'magara', name: 'Mağara — karanlık', map: { mapId: 'magara', variantId: 'magara' },
    enemies: { troll: 1, 'giant-spider': 2, ghoul: 1, darkmantle: 1, ettercap: 1, ogre: 1, 'phase-spider': 1 } },
  { id: 'dungeon', name: 'Dungeon — Koridor (meşale)', map: { mapId: 'dungeon', variantId: 'mesale' },
    enemies: { wight: 2, 'bugbear-stalker': 2, mummy: 2, ghast: 2, ghoul: 2, 'bugbear-warrior': 2, 'minotaur-of-baphomet': 1, wraith: 1 } },
  { id: 'dungeon-merdiven', name: 'Dungeon — Merdiven', map: { mapId: 'dungeon', variantId: 'merdiven' },
    enemies: { ghoul: 2, ghast: 2, 'bugbear-warrior': 3, skeleton: 4, 'bugbear-stalker': 1 } },
  { id: 'dungeon-hazine', name: 'Dungeon — Hazine odası', map: { mapId: 'dungeon', variantId: 'hazine' },
    enemies: { wight: 2, 'bugbear-stalker': 2, mummy: 2, ghast: 1, ghoul: 2, 'bugbear-warrior': 1, 'minotaur-of-baphomet': 1, wraith: 1 } },
  { id: 'kale', name: 'Kale — Gündüz', map: { mapId: 'kale', variantId: 'gunduz' },
    enemies: { 'hobgoblin-warrior': 6, 'goblin-warrior': 2, 'hobgoblin-captain': 1, 'bugbear-stalker': 1, berserker: 3, 'warrior-veteran': 2, 'bugbear-warrior': 2 } },
  { id: 'taverna', name: 'Taverna — 4 masum ortada',
    map: { mapId: 'taverna', variantId: 'ic-mekan', options: ['objective'], civilians: 4, civilianPlacement: 'middle' },
    enemies: { 'tough-boss': 2, knight: 2, 'bandit-captain': 2, tough: 2, spy: 1 } },
  { id: 'taverna-arka', name: 'Taverna — 4 masum düşmandan uzakta, varsayılan',
    map: { mapId: 'taverna', variantId: 'ic-mekan', options: ['objective'], civilians: 4 },
    enemies: { 'tough-boss': 2, knight: 2, 'bandit-captain': 2, tough: 2, spy: 1 } },
  { id: 'taverna-8', name: 'Taverna — 8 masum düşmandan uzakta',
    map: { mapId: 'taverna', variantId: 'ic-mekan', options: ['objective'], civilians: 8 },
    enemies: { 'tough-boss': 2, knight: 2, 'bandit-captain': 2, tough: 2, spy: 1 } },
];

function participants(s: Scenario): Combatant[] {
  const party = PARTY.map((sheet, i) => combatantFromSheet(sheet, { id: `pc${i + 1}`, ownerId: `p${i + 1}` }));
  const foes: Combatant[] = [];
  for (const [id, count] of Object.entries(s.enemies)) {
    for (let i = 1; i <= count; i++) foes.push(combatantFromMonster(getMonster(id), { id: `${id}-${i}`, name: `${getMonster(id).name} ${i}` }));
  }
  return [...party, ...foes];
}

export function setupBattle(s: Scenario, rng: Rng): BattleState {
  if (!s.map) return startBattle('sim', 'd-z-zemin', participants(s), rng).state;
  const session = createMapBattle(participants(s), { ...s.map, mirrored: false }, rng);
  const gm = { playerId: 'gm', isGm: true };
  const state = session.state;
  const r = execute(state, { type: 'start_battle' }, gm, rng);
  if (!r.ok) throw new Error(`${s.id}: ${r.error}`);
  return r.state;
}

export interface BattleResult {
  winner: 'party' | 'enemies' | 'timeout';
  rounds: number;
  /** Ölen oyuncu karakteri sayısı (ölüm save'leri ya da anında ölüm). */
  pcDead: number;
  /** Savaş sonunda 0 HP'deki (ölmekte/stabil) ama ölmemiş karakterler. */
  pcDown: number;
  /** Hayatta kalan masum (masumları koru açıksa; bilgi amaçlı, sonucu etkilemez). */
  civiliansSaved: number;
  /** Uyuyan ejderha savaşında ejderha uyandı mı (ejderhasız savaşta null). */
  dragonWoke: boolean | null;
}

/** Bir savaşı sonuna kadar oynar (en çok `maxRounds` tur; aşarsa berabere sayılır). */
export function simulate(s: Scenario, seed: number, maxRounds = 20): BattleResult {
  const rng = seeded(seed);
  let state = setupBattle(s, rng);
  const apply = (cmd: Command): boolean => {
    const actorId = 'actorId' in cmd ? cmd.actorId : '';
    const r = execute(state, cmd, contextFor(state, actorId), rng);
    if (!r.ok) return false;
    state = r.state;
    return true;
  };
  for (let guard = 0; guard < 2000 && state.status === 'active' && state.round <= maxRounds; guard++) {
    const actorId = currentActorId(state);
    for (let step = 0; step < 12; step++) {
      const cmd = chooseCommand(state);
      if (cmd.type === 'end_turn' || !apply(cmd)) break;
      if (state.status !== 'active' || currentActorId(state) !== actorId) break;
    }
    if (state.status === 'active' && currentActorId(state) === actorId) apply({ type: 'end_turn', actorId });
  }
  const pcs = Object.values(state.combatants).filter((c) => c.side === 'party' && !c.civilian);
  return {
    winner: state.status === 'finished' ? (state.winner ?? 'timeout') : 'timeout',
    rounds: state.round,
    pcDead: pcs.filter((c) => c.life === 'dead').length,
    pcDown: pcs.filter((c) => c.life !== 'dead' && c.hp <= 0).length,
    civiliansSaved: Object.values(state.combatants).filter((c) => c.civilian && c.hp > 0).length,
    dragonWoke: state.map?.dragon ? state.combatants[state.map.dragon.id]?.asleep !== true : null,
  };
}

export interface Summary {
  scenario: Scenario;
  runs: number;
  partyWins: number;
  timeouts: number;
  avgRounds: number;
  avgDead: number;
  avgDown: number;
  /** En az bir karakterin öldüğü savaşların oranı. */
  anyDeath: number;
  /** Ortalama kurtarılan masum; masumsuz senaryoda null. */
  avgSaved: number | null;
  /** Uyuyan ejderha: uyanma oranı ve uyandığı savaşlarda parti kazanma oranı (yoksa null). */
  dragonWokeRate: number | null;
  winWhenWoke: number | null;
}

export function measure(s: Scenario, runs: number, firstSeed = 1): Summary {
  let wins = 0, timeouts = 0, rounds = 0, dead = 0, down = 0, anyDeath = 0, saved = 0, woke = 0, wokeWins = 0, dragon = false;
  for (let i = 0; i < runs; i++) {
    const r = simulate(s, firstSeed + i);
    if (r.winner === 'party') wins++;
    if (r.winner === 'timeout') timeouts++;
    rounds += r.rounds;
    dead += r.pcDead;
    down += r.pcDown;
    if (r.pcDead > 0) anyDeath++;
    saved += r.civiliansSaved;
    if (r.dragonWoke !== null) dragon = true;
    if (r.dragonWoke) { woke++; if (r.winner === 'party') wokeWins++; }
  }
  const hasCivilians = s.map?.options?.includes('objective') ?? false;
  return { scenario: s, runs, partyWins: wins, timeouts, avgRounds: rounds / runs, avgDead: dead / runs, avgDown: down / runs, anyDeath: anyDeath / runs,
    avgSaved: hasCivilians ? saved / runs : null,
    dragonWokeRate: dragon ? woke / runs : null, winWhenWoke: dragon && woke > 0 ? wokeWins / woke : null };
}
