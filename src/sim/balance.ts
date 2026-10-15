/**
 * Denge ölçümü (Adım 11): 5 kişilik 5. seviye parti, farklı haritalarda tohumlu simülasyon.
 * Her iki taraf `battle/ai.ts` ile oynar. Arayüzü bilmez; `npm run sim` raporu basar.
 */
import { combatantFromMonster, combatantFromSheet, execute, startBattle, type BattleState, type Combatant, type Command } from '../battle';
import { currentActorId } from '../battle/common';
import { chooseCommand } from '../battle/ai';
import { getMonster } from '../data';
import type { Rng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import { createMapBattle } from '../app/setup';
import { contextFor } from '../ui/session';

/** Tohumlu zar (mulberry32): aynı tohum aynı savaş. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
  map?: { mapId: string; variantId: string; options?: string[]; civilians?: number; civilianPlacement?: 'far' | 'middle' };
  enemies: Record<string, number>;
}

/** CR → XP (SRD 5.2.1). */
const XP: Record<string, number> = { '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '5': 1800, '6': 2300, '10': 5900 };
export const scenarioXp = (s: Scenario) =>
  Object.entries(s.enemies).reduce((n, [id, k]) => n + (XP[getMonster(id).cr] ?? 0) * k, 0);

export const SCENARIOS: Scenario[] = [
  { id: 'duz', name: 'Düz (haritasız)', enemies: { troll: 1, 'hill-giant': 1, owlbear: 1, ogre: 1, wolf: 2 } },
  { id: 'col', name: 'Çöl (gündüz)', map: { mapId: 'col', variantId: 'gunduz' },
    enemies: { troll: 1, 'minotaur-of-baphomet': 1, owlbear: 1, ogre: 1, 'bandit-captain': 1, wolf: 4, 'goblin-warrior': 2 } },
  { id: 'volkan', name: 'Volkan', map: { mapId: 'volkan', variantId: 'varsayilan' },
    enemies: { wyvern: 1, troll: 1, wolf: 4, 'goblin-warrior': 2 } },
  { id: 'orman', name: 'Orman', map: { mapId: 'orman', variantId: 'orman' },
    enemies: { troll: 1, owlbear: 1, 'minotaur-of-baphomet': 1, ogre: 1, 'giant-spider': 3, wolf: 6 } },
  { id: 'magara', name: 'Mağara (karanlık)', map: { mapId: 'magara', variantId: 'magara' },
    enemies: { troll: 1, owlbear: 1, ogre: 1, 'giant-spider': 3, ghoul: 2 } },
  { id: 'kale', name: 'Kale (gündüz)', map: { mapId: 'kale', variantId: 'gunduz' },
    enemies: { troll: 1, ogre: 2, 'bandit-captain': 1, 'hobgoblin-warrior': 6, 'goblin-warrior': 4 } },
  { id: 'taverna', name: 'Taverna (4 masum ortada)',
    map: { mapId: 'taverna', variantId: 'ic-mekan', options: ['objective'], civilians: 4, civilianPlacement: 'middle' },
    enemies: { 'bandit-captain': 2, tough: 4, ogre: 1, 'minotaur-of-baphomet': 1, 'hobgoblin-warrior': 1 } },
  { id: 'taverna-arka', name: 'Taverna (4 masum düşmandan uzakta, varsayılan)',
    map: { mapId: 'taverna', variantId: 'ic-mekan', options: ['objective'], civilians: 4 },
    enemies: { 'bandit-captain': 2, tough: 4, ogre: 1, 'minotaur-of-baphomet': 1, 'hobgoblin-warrior': 1 } },
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
}

export function measure(s: Scenario, runs: number, firstSeed = 1): Summary {
  let wins = 0, timeouts = 0, rounds = 0, dead = 0, down = 0, anyDeath = 0, saved = 0;
  for (let i = 0; i < runs; i++) {
    const r = simulate(s, firstSeed + i);
    if (r.winner === 'party') wins++;
    if (r.winner === 'timeout') timeouts++;
    rounds += r.rounds;
    dead += r.pcDead;
    down += r.pcDown;
    if (r.pcDead > 0) anyDeath++;
    saved += r.civiliansSaved;
  }
  const hasCivilians = s.map?.options?.includes('objective') ?? false;
  return { scenario: s, runs, partyWins: wins, timeouts, avgRounds: rounds / runs, avgDead: dead / runs, avgDown: down / runs, anyDeath: anyDeath / runs,
    avgSaved: hasCivilians ? saved / runs : null };
}
