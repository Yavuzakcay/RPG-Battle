/**
 * Bütünleşik uygulamanın saf yardımcıları (Adım 13): GM'in savaş kurması (parti, düşmanlar,
 * harita), özel canavar, savaş sonu özeti. Ekranı bilmez.
 */
import { combatantFromMonster, combatantFromSheet, startBattle, type BattleEvent, type BattleState, type Combatant } from '../battle';
import type { Monster } from '../data';
import { getMap } from '../map/maps';
import type { Rng } from '../rules/dice';
import { parseDice, seededRng } from '../rules/dice';
import { costsFrom, distance, hexKey, type Offset } from '../rules/hex';
import { enterCost, terrainOf } from '../map/terrain';
import { isRiskyHex, ruleHex, ruleOf, trapHexes } from '../battle/maprules';
import type { DragonWakeMode } from '../battle/types';
import type { CharacterSheet } from '../rules/stats';
import { createSession, dispatch, type Session } from '../ui/session';

/** GM'in elle tanımladığı canavar (tek saldırılı). */
export interface CustomMonsterInput {
  name: string;
  ac: number;
  hp: number;
  speed: number;
  attackName: string;
  attackBonus: number;
  /** "1d8+2" biçiminde. */
  damage: string;
  damageType: string;
  ranged: boolean;
}

/** Özel canavarın sorunları; boşsa geçerli. */
export function customMonsterProblems(m: CustomMonsterInput): string[] {
  const out: string[] = [];
  if (m.name.trim() === '') out.push('Ad boş olamaz.');
  if (!Number.isInteger(m.ac) || m.ac < 1 || m.ac > 30) out.push('AC 1–30 olmalı.');
  if (!Number.isInteger(m.hp) || m.hp < 1 || m.hp > 999) out.push('HP 1–999 olmalı.');
  if (!Number.isInteger(m.speed) || m.speed < 0 || m.speed > 120 || m.speed % 5 !== 0) out.push('Hız 0–120 ft, 5\'in katı olmalı.');
  if (!Number.isInteger(m.attackBonus) || m.attackBonus < -5 || m.attackBonus > 20) out.push('Saldırı bonusu −5..+20 olmalı.');
  try {
    parseDice(m.damage);
  } catch {
    out.push('Hasar "1d8+2" biçiminde olmalı.');
  }
  return out;
}

/** Özel canavarı motorun canavar kaydına çevirir (ability'ler 10, tek saldırı). */
export function customMonster(m: CustomMonsterInput, id: string): Monster {
  return {
    id, name: m.name.trim(), ac: m.ac, hp: m.hp, speed: m.speed,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, cr: '?',
    attacks: [{
      name: m.attackName.trim() || 'Saldırı', bonus: m.attackBonus, damage: `${m.damage} ${m.damageType}`.trim(),
      damageDice: m.damage, damageType: m.damageType, ranged: m.ranged,
      ...(m.ranged ? { range: [80, 320] as [number, number] } : { reachFt: 5 }),
    }],
    traits: 'Özel canavar (GM)',
  };
}

export interface BattlePlan {
  party: Array<{ id: string; sheet: CharacterSheet }>;
  /** Düşmanlar: canavar ve adedi. */
  enemies: Array<{ monster: Monster; count: number }>;
  mapId: string;
  variantId: string;
  mirrored: boolean;
  options?: string[];
  civilians?: number;
  /** Masumların yeri: düşmanlardan en uzak (varsayılan), ortada, rastgele (tohumlu) ya da elle. */
  civilianPlacement?: CivilianPlacement;
  /** Rastgele yerleşimin tohumu (aynı tohum aynı yerleşim). */
  civilianSeed?: number;
  /** Elle yerleşim: masumların altıgenleri (savaştaki yönüyle, aynalıysa aynalı). */
  civilianHexes?: Offset[];
  /** Sıkı kural: masumların yarısı ölürse düşmanlar kazanır (varsayılan kapalı, bilgi amaçlı). */
  strictObjective?: boolean;
  /** Uyuyan ejderha varyantı: ejderha ve yapay zekâ düşmanlarının uyandırma kipi (`dragonWake`). */
  dragon?: string;
  dragonWake?: DragonWakeMode;
  dragonWakeChance?: number;
}

/** Varyantın uyuyan ejderha kuralı (kurulum ekranı için): seçilebilir ejderhalar ve varsayılanlar. */
export function dragonSetup(mapId: string, variantId: string): { dragons: string[]; dragon: string; mode: DragonWakeMode; chancePct: number } | null {
  const v = getMap(mapId, { variantId }).variants.find((x) => x.id === variantId);
  const r = v?.rules.find((x) => x.id === 'sleepingDragon');
  if (!r) return null;
  const dragon = String(r.dragon);
  return {
    dragons: (r.dragons as string[] | undefined) ?? [dragon], dragon,
    mode: (r.dragonWake as DragonWakeMode | undefined) ?? 'never', chancePct: typeof r.chancePct === 'number' ? r.chancePct : 25,
  };
}

export type CivilianPlacement = 'far' | 'middle' | 'random' | 'manual';

/** Masum sayacının mutlak sınırları. */
export const CIVILIAN_LIMIT = 12;

/** Haritanın masum kuralı (varsa): varsayılan sayı ve özellikler. */
export function civilianRule(mapId: string, variantId: string): { default: number; hp: number; ac: number; speedHexes: number } | null {
  const map = getMap(mapId);
  const rule = (map.variants.find((v) => v.id === variantId) ?? map.variants[0])?.rules.find((r) => r.id === 'objective');
  const c = rule?.civilians as { min: number; default?: number; hp: number; ac: number; speedHexes: number } | undefined;
  return c ? { default: c.default ?? c.min, hp: c.hp, ac: c.ac, speedHexes: c.speedHexes } : null;
}

/**
 * Masum bir altıgene neden konamaz; konabilirse null. Engel, lav, alev, batak, tuzak ve düşman
 * başlangıç bölgesi geçersiz (partinin bölgesi geçerli: masumlar partinin arkasında durabilir).
 */
export function civilianHexProblem(mapId: string, variantId: string, mirrored: boolean, h: Offset): string | null {
  const map = getMap(mapId, { variantId, mirrored });
  const ch = map.tiles[h.row]?.[h.col];
  if (ch === undefined) return 'harita dışı';
  const t = terrainOf(ch);
  if (t.movement === 'blocked') return `engel (${t.name})`;
  if (t.movement === 'deadly') return 'lav';
  if (t.hazard) return `tehlikeli (${t.name})`;
  if (t.rule === 'trap') return 'tuzak';
  if (t.rule === 'bog') return 'derin batak';
  if (map.startZones.enemies.some((z) => z.col === h.col && z.row === h.row)) return 'düşman başlangıç bölgesi';
  return null;
}

/** Bu haritada en çok kaç masum: 12 ve uygun (yürünebilir, tehlikesiz) altıgen sayısından küçüğü. */
export function maxCivilians(mapId: string, variantId: string, mirrored = false): number {
  let ok = 0;
  for (let row = 0; row < 7; row++) for (let col = 0; col < 15; col++) if (!civilianHexProblem(mapId, variantId, mirrored, { col, row })) ok++;
  return Math.min(CIVILIAN_LIMIT, ok);
}

/** Aynalama: elle konan masumlar zeminle birlikte yatay aynalanır. */
export function mirrorHexes(hexes: Offset[]): Offset[] {
  return hexes.map((h) => ({ col: 14 - h.col, row: h.row }));
}

/** Plandaki sorunlar (boşsa savaş kurulabilir). */
export function planProblems(plan: BattlePlan): string[] {
  const out: string[] = [];
  if (plan.party.length === 0) out.push('En az bir oyuncu karakteri seçilmeli.');
  const foes = plan.enemies.reduce((n, e) => n + e.count, 0);
  if (foes === 0) out.push('En az bir düşman seçilmeli.');
  const map = getMap(plan.mapId, { variantId: plan.variantId });
  if (plan.party.length > map.startZones.players.length) out.push(`Haritada en çok ${map.startZones.players.length} oyuncu yeri var.`);
  if (foes > map.startZones.enemies.length) out.push(`Haritada en çok ${map.startZones.enemies.length} düşman yeri var.`);
  if (plan.options?.includes('objective') && plan.civilianPlacement === 'manual') {
    const want = plan.civilians ?? civilianRule(plan.mapId, plan.variantId)?.default ?? 0;
    const placed = (plan.civilianHexes ?? []).filter((h) => !civilianHexProblem(plan.mapId, plan.variantId, plan.mirrored, h)).length;
    if (placed < want) out.push(`Elle yerleşim: ${want - placed} masum daha yerleştirin (${placed}/${want}).`);
  }
  return out;
}

/** Plandaki savaşçılar: her karakterin sahibi kendisi (tek cihaz), düşmanlar numaralı. */
export function planParticipants(plan: BattlePlan): Combatant[] {
  const party = plan.party.map((p, i) => combatantFromSheet(p.sheet, { id: `pc${i + 1}`, ownerId: p.id }));
  const enemies: Combatant[] = [];
  for (const e of plan.enemies) {
    for (let i = 1; i <= e.count; i++) {
      const n = enemies.length + 1;
      enemies.push(combatantFromMonster(e.monster, { id: `foe${n}`, name: e.count > 1 ? `${e.monster.name} ${i}` : e.monster.name }));
    }
  }
  return [...party, ...enemies];
}

/** Başlangıç bölgesindeki altıgenler, haritanın ortasına (satır 4) yakın olanlar önce. */
function preferred(zone: Offset[]): Offset[] {
  return [...zone].sort((a, b) => Math.abs(a.row - 3) - Math.abs(b.row - 3) || a.row - b.row || a.col - b.col);
}

/**
 * Haritalı savaş oturumu: kurulum aşamasında başlar, herkes kendi başlangıç bölgesine
 * otomatik yerleşir (istenirse `place` ile değiştirilir); GM başlatır. Masumlar varsayılan
 * olarak düşmanlardan en uzak, partinin bölgesinden yürüyerek ulaşılabilen, tehlikesiz
 * (alev, batak, buz, tuzak olmayan) altıgenlere; istenirse haritanın ortasına.
 */
export function createMapBattle(
  participants: Combatant[],
  choice: {
    mapId: string; variantId: string; mirrored: boolean; options?: string[]; civilians?: number;
    civilianPlacement?: CivilianPlacement; civilianSeed?: number; civilianHexes?: Offset[]; strictObjective?: boolean;
    dragon?: string; dragonWake?: DragonWakeMode; dragonWakeChance?: number;
  },
  rng: Rng,
): Session {
  const map = getMap(choice.mapId, { mirrored: choice.mirrored, variantId: choice.variantId });
  const { state, events } = startBattle('harita', map.environmentId, participants, rng, {
    map: {
      id: choice.mapId, variantId: choice.variantId, mirrored: choice.mirrored,
      ...(choice.options ? { options: choice.options } : {}), ...(choice.civilians !== undefined ? { civilians: choice.civilians } : {}),
      ...(choice.strictObjective ? { strictObjective: true } : {}),
      ...(choice.dragon ? { dragon: choice.dragon } : {}), ...(choice.dragonWake ? { dragonWake: choice.dragonWake } : {}),
      ...(choice.dragonWakeChance !== undefined ? { dragonWakeChance: choice.dragonWakeChance } : {}),
    },
  });
  let session = createSession(state, events);
  const placement = choice.civilianPlacement ?? 'far';
  const civilians = Object.values(session.state.combatants).filter((x) => x.civilian);
  const placeAt = (id: string, candidates: Offset[]) => {
    for (const at of candidates) {
      const next = dispatch(session, { type: 'place', actorId: id, at }, rng);
      if (next.error === null) { session = next; return true; }
    }
    return false;
  };
  // Elle: masumlar GM'in seçtiği altıgenlere önce yerleşir; savaşçılar bölgelerinin boş kalanına.
  const manual = placement === 'manual'
    ? (choice.civilianHexes ?? []).filter((h) => !civilianHexProblem(choice.mapId, choice.variantId, choice.mirrored, h)) : [];
  const unplaced = civilians.filter((c, i) => !(manual[i] && placeAt(c.id, [manual[i] as Offset])));
  const zones = { party: preferred(map.startZones.players), enemies: preferred(map.startZones.enemies) };
  // Uyuyan ejderha kuralın altıgenine (aynalıda aynalanır).
  const sleeping = ruleOf(session.state, 'sleepingDragon');
  for (const c of Object.values(session.state.combatants)) {
    if (c.asleep && sleeping) placeAt(c.id, [ruleHex(session.state, sleeping.at)]);
    else if (!c.civilian) placeAt(c.id, zones[c.side]);
  }
  // Kalan masumlar (elle eksik bırakılanlar dahil) seçilen moda göre.
  const spots = civilianSpots(session.state, placement === 'manual' ? 'far' : placement, choice.civilianSeed ?? 1);
  for (const c of unplaced) placeAt(c.id, spots);
  return { ...session, error: null };
}

/**
 * Masumlar için aday altıgenler, en iyiden başlayarak (yerleştirme komutu ayrıca denetler).
 * `random`: güvenli ve yürünebilir altıgenler tohumla karışık (aynı tohum aynı sıra).
 */
export function civilianSpots(state: BattleState, placement: CivilianPlacement, seed = 1): Offset[] {
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  const spots: Offset[] = [];
  for (let row = 0; row < size.rows; row++) for (let col = 0; col < size.cols; col++) spots.push({ col, row });
  if (placement === 'middle') {
    const middle = { col: Math.floor(size.cols / 2), row: Math.floor(size.rows / 2) };
    return spots.sort((a, b) => distance(a, middle) - distance(b, middle) || a.row - b.row || a.col - b.col);
  }
  const foes = Object.values(state.combatants).filter((c) => c.side === 'enemies' && c.pos).map((c) => c.pos as Offset);
  const party = Object.values(state.combatants).find((c) => c.side === 'party' && !c.civilian && c.pos)?.pos;
  // Yürünebilir: partinin bir üyesinden yürüyerek ulaşılabilen altıgen (adacık, duvar arkası değil).
  const tile = (h: Offset) => terrainOf(state.map?.tiles[h.row]?.[h.col] ?? '#');
  const walk = party ? costsFrom(party, size, (h) => enterCost(tile(h))) : null;
  const traps = new Set(trapHexes(state).map(hexKey));
  const safe = (h: Offset) => !isRiskyHex(state, h) && !traps.has(hexKey(h)) && (!walk || walk.has(hexKey(h)));
  const far = (h: Offset) => (foes.length > 0 ? Math.min(...foes.map((f) => distance(h, f))) : 0);
  const ok = spots.filter((h) => safe(h) && (!state.map || !civilianHexProblem(state.map.id, state.map.variantId, state.map.mirrored, h)));
  if (placement === 'random') {
    const rng = seededRng(seed);
    for (let i = ok.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [ok[i], ok[j]] = [ok[j] as Offset, ok[i] as Offset];
    }
    return ok;
  }
  return ok.sort((a, b) => far(b) - far(a) || a.row - b.row || a.col - b.col);
}

export interface SummaryRow {
  id: string;
  name: string;
  side: Combatant['side'];
  civilian: boolean;
  dealt: number;
  taken: number;
  healed: number;
  downed: number;
  hpEnd: number;
  maxHp: number;
  status: 'ayakta' | 'düştü' | 'öldü';
}

/** Savaş sonu özeti: tur sayısı, kazanan ve savaşçı başına verilen/alınan hasar, iyileştirme, düşürme. */
export function battleSummary(events: BattleEvent[], state: BattleState): {
  rounds: number; winner: BattleState['winner']; rows: SummaryRow[];
  /** Masumları koru açıksa: kurtarılan (hayatta) ve ölen masum (bilgi amaçlı, sonucu etkilemez). */
  civilians: { total: number; saved: number; dead: number } | null;
} {
  const rows = new Map<string, SummaryRow>();
  for (const c of Object.values(state.combatants)) {
    rows.set(c.id, {
      id: c.id, name: c.name, side: c.side, civilian: c.civilian, dealt: 0, taken: 0, healed: 0, downed: 0,
      hpEnd: c.hp, maxHp: c.maxHp, status: c.life === 'dead' ? 'öldü' : c.hp > 0 ? 'ayakta' : 'düştü',
    });
  }
  const hit = (actorId: string | null, targetId: string, amount: number, hpAfter: number) => {
    const t = rows.get(targetId);
    if (t) t.taken += amount;
    const a = actorId ? rows.get(actorId) : undefined;
    if (a && actorId !== targetId) {
      a.dealt += amount;
      if (hpAfter === 0 && amount > 0) a.downed += 1;
    }
  };
  for (const e of events) {
    if (e.type === 'attack_resolved') hit(e.actorId, e.targetId, e.appliedDamage, e.targetHpAfter);
    if (e.type === 'save_resolved') hit(e.actorId, e.targetId, e.appliedDamage, e.targetHpAfter);
    if (e.type === 'map_effect' && e.damage) hit(null, e.targetId, e.damage.applied, e.hpAfter ?? 1);
    if (e.type === 'healed') { const a = rows.get(e.actorId); if (a) a.healed += e.amount; }
  }
  const civ = Object.values(state.combatants).filter((c) => c.civilian);
  const saved = civ.filter((c) => c.hp > 0).length;
  return {
    rounds: state.round, winner: state.winner, rows: [...rows.values()],
    civilians: civ.length > 0 ? { total: civ.length, saved, dead: civ.length - saved } : null,
  };
}
