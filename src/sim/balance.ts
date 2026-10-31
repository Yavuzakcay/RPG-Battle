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
import { alternativeCantrips, spellOptions } from '../rules/builder';
import { classKit } from '../rules/classFeatures';
import { createMapBattle } from '../app/setup';
import { contextFor } from '../ui/session';

/** Simülasyon partisinin seviyesi (varsayılan 5; `npm run sim -- --seviye N`). */
export const DEFAULT_LEVEL = 5;

/** Tohumlu zar (mulberry32): aynı tohum aynı savaş. */
export const seeded = seededRng;

import partyData from '../../data/sim-partiler.json';
import scenarioData from '../../data/sim-senaryolar.json';

/** Parti üyesi verisi (`data/sim-partiler.json`): 5. seviye sheet ve seviyeye göre üstüne yazılan alanlar. */
interface MemberData { sheet: CharacterSheet; levels?: Record<string, Partial<CharacterSheet>> }
const MEMBERS = partyData.members as unknown as Record<string, MemberData>;
const PARTIES = partyData.parties as Record<string, { ad: string; members: string[] }>;
const membersOf = (kind: string): MemberData[] => {
  const p = PARTIES[kind];
  if (!p) throw new Error(`Bilinmeyen parti: ${kind}`);
  return p.members.map((id) => {
    const m = MEMBERS[id];
    if (!m) throw new Error(`Bilinmeyen parti üyesi: ${id}`);
    return m;
  });
};

/** 5. seviye parti: savaşçı, büyücü, rahip, haydut, korucu (oluşturucu kurallarına uyar; veri `data/sim-partiler.json`). */
export const PARTY: CharacterSheet[] = membersOf('standart').map((m) => m.sheet);

/**
 * Barbarian partisi (Görev P-Barbarian): Bor (Fighter) yerine Grum (Barbarian); diğer dört üye aynı.
 * Greataxe (Cleave) + Handaxe (Vex), zırhsız (Unarmored Defense: 10 + DEX + CON = 14).
 */
export const BARBARIAN: CharacterSheet = (MEMBERS.grum as MemberData).sheet;
export const BARBARIAN_PARTY: CharacterSheet[] = membersOf('barbar').map((m) => m.sheet);

/**
 * Yan el partisi (Görev P1): Sela (Rogue) Rapier yerine Shortsword (Vex) + yan elde Dagger (Nick); diğer üyeler
 * standart. Yan el saldırısının ve yapay zekâsının etkisini ölçmek için; varsayılan parti değişmez.
 */
export const OFFHAND_PARTY: CharacterSheet[] = membersOf('yanel').map((m) => m.sheet);

/** Simülasyon partileri (`data/sim-partiler.json` `parties`): kimlik → görünen ad. */
export const PARTY_KINDS: Record<string, string> = Object.fromEntries(Object.entries(PARTIES).map(([k, v]) => [k, v.ad]));
export type PartyKind = string;
let partyKind: PartyKind = 'standart';
/** Simülasyonun partisi (betik başında seçilir; varsayılan standart parti). */
export function setPartyKind(kind: PartyKind): void {
  if (!PARTIES[kind]) throw new Error(`Bilinmeyen parti: ${kind}`);
  partyKind = kind;
}

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
  /** Seviyeye göre ayrı düşman listesi (Görev B1; `data/sim-senaryolar.json` `enemies.<seviye>`). Yoksa `enemies`. */
  byLevel?: Record<number, Record<string, number>>;
}

/** CR → XP (SRD 5.2.1, tüm CR'ler). */
const XP: Record<string, number> = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900,
  '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000,
  '17': 18000, '18': 20000, '19': 22000, '20': 25000, '21': 33000, '22': 41000, '23': 50000, '24': 62000, '30': 155000,
};
export const scenarioXp = (s: Scenario, level: number = DEFAULT_LEVEL) =>
  Object.entries(enemiesAt(s, level)).reduce((n, [id, k]) => n + (XP[getMonster(id).cr] ?? 0) * k, 0)
  // Uyuyan ejderha varyantın kendisinden gelir (listede yok); XP'ye eklenir.
  + (s.map?.dragon ? XP[getMonster(s.map.dragon).cr] ?? 0 : 0);

/**
 * Senaryolar `data/sim-senaryolar.json`'dan. `enemies` 5. seviye listesi; diğer seviyeler `byLevel`'da.
 */
export const SCENARIOS: Scenario[] = (scenarioData.scenarios as unknown as Array<Omit<Scenario, 'enemies' | 'byLevel'> & { enemies: Record<string, Record<string, number>> }>)
  .map(({ enemies, ...rest }) => {
    const byLevel = Object.fromEntries(Object.entries(enemies).filter(([l]) => Number(l) !== DEFAULT_LEVEL).map(([l, e]) => [Number(l), e]));
    const five = enemies[String(DEFAULT_LEVEL)];
    if (!five) throw new Error(`${rest.id}: 5. seviye düşman listesi yok`);
    return { ...rest, enemies: five, ...(Object.keys(byLevel).length > 0 ? { byLevel } : {}) };
  });


/**
 * Seviyeye göre parti üreteci (Görev B1). Üye verisi `data/sim-partiler.json`: 5. seviye sheet, `levels.<N>` o seviyenin
 * gerçek seçimleri (SRD tablosundaki cantrip ve hazır büyü sayısı kadar büyü; donanım başlangıç altınıyla alınabilir).
 * Her seviyede seçilemeyen büyüler, gelmemiş seviye yuvaları (ASI/feat) ve hakkı aşan silah ustalıkları kesilir;
 * tanımsız seviye (8, 11…) 5. seviye sheet'inden bu kesmeyle üretilir. 5. seviyede veri sheet'i birebir döner.
 */
export function partyAt(level: number = DEFAULT_LEVEL, kind: PartyKind = partyKind): CharacterSheet[] {
  if (!Number.isInteger(level) || level < 1 || level > 20) throw new Error(`Seviye 1–20 olmalı: ${level}`);
  return membersOf(kind).map((m) => memberAt(m, level));
}

function memberAt(m: MemberData, level: number): CharacterSheet {
  const patch = m.levels?.[String(level)];
  if (level === DEFAULT_LEVEL && !patch) return m.sheet;
  const sheet = { ...m.sheet, ...patch, level };
  // Sınıf listesi ve yuva seçeneğinin (Blessed Warrior) cantrip'leri.
  const allowed = new Set([...spellOptions(sheet.classId, level), ...alternativeCantrips({ ...sheet, advancements: (sheet.advancements ?? []).filter((a) => a.level <= level) }).options]);
  const masteries = classKit(sheet.classId, level, sheet.subclassId).weaponMastery?.count ?? 0;
  return {
    ...sheet, spellNames: (sheet.spellNames ?? []).filter((n) => allowed.has(n)),
    advancements: (sheet.advancements ?? []).filter((a) => a.level <= level),
    weaponMasteries: (sheet.weaponMasteries ?? []).slice(0, masteries),
  };
}

/** Senaryonun bu seviyede kendi düşman listesi var mı (yoksa 5. seviye listesi kullanılır). */
export const hasLevelList = (s: Scenario, level: number) => level === DEFAULT_LEVEL || !!s.byLevel?.[level];

/** Senaryonun bu seviyedeki düşmanları: `byLevel`'da varsa o liste, yoksa 5. seviye listesi (iskelet). */
export function enemiesAt(s: Scenario, level: number = DEFAULT_LEVEL): Record<string, number> {
  return s.byLevel?.[level] ?? s.enemies;
}

function participants(s: Scenario, level: number = DEFAULT_LEVEL): Combatant[] {
  const party = partyAt(level).map((sheet, i) => combatantFromSheet(sheet, { id: `pc${i + 1}`, ownerId: `p${i + 1}` }));
  const foes: Combatant[] = [];
  for (const [id, count] of Object.entries(enemiesAt(s, level))) {
    for (let i = 1; i <= count; i++) foes.push(combatantFromMonster(getMonster(id), { id: `${id}-${i}`, name: `${getMonster(id).name} ${i}` }));
  }
  return [...party, ...foes];
}

/** Görev Y1: simülasyonda yüzey etkileşimi (regresyon karşılaştırması için kapatılabilir; varsayılan açık). */
let surfaceReactions = true;
export const setSurfaceReactions = (on: boolean) => { surfaceReactions = on; };

export function setupBattle(s: Scenario, rng: Rng, level: number = DEFAULT_LEVEL): BattleState {
  const flag = (st: BattleState): BattleState => (surfaceReactions ? st : { ...st, yuzeyEtkilesimi: false });
  if (!s.map) return flag(startBattle('sim', 'd-z-zemin', participants(s, level), rng).state);
  const session = createMapBattle(participants(s, level), { ...s.map, mirrored: false }, rng);
  const gm = { playerId: 'gm', isGm: true };
  const state = session.state;
  const r = execute(flag(state), { type: 'start_battle' }, gm, rng);
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
export function simulate(s: Scenario, seed: number, maxRounds = 20, level: number = DEFAULT_LEVEL): BattleResult {
  const rng = seeded(seed);
  let state = setupBattle(s, rng, level);
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

export function measure(s: Scenario, runs: number, firstSeed = 1, level: number = DEFAULT_LEVEL): Summary {
  let wins = 0, timeouts = 0, rounds = 0, dead = 0, down = 0, anyDeath = 0, saved = 0, woke = 0, wokeWins = 0, dragon = false;
  for (let i = 0; i < runs; i++) {
    const r = simulate(s, firstSeed + i, 20, level);
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
