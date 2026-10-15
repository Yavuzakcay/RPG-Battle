/**
 * Bütünleşik uygulamanın saf yardımcıları (Adım 13): GM'in savaş kurması (parti, düşmanlar,
 * harita), özel canavar, savaş sonu özeti. Ekranı bilmez.
 */
import { combatantFromMonster, combatantFromSheet, startBattle, type BattleEvent, type BattleState, type Combatant } from '../battle';
import type { Monster } from '../data';
import { getMap } from '../map/maps';
import type { Rng } from '../rules/dice';
import { parseDice } from '../rules/dice';
import { distance, type Offset } from '../rules/hex';
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
}

/** Plandaki sorunlar (boşsa savaş kurulabilir). */
export function planProblems(plan: BattlePlan): string[] {
  const out: string[] = [];
  if (plan.party.length === 0) out.push('En az bir oyuncu karakteri seçilmeli.');
  const foes = plan.enemies.reduce((n, e) => n + e.count, 0);
  if (foes === 0) out.push('En az bir düşman seçilmeli.');
  const map = getMap(plan.mapId);
  if (plan.party.length > map.startZones.players.length) out.push(`Haritada en çok ${map.startZones.players.length} oyuncu yeri var.`);
  if (foes > map.startZones.enemies.length) out.push(`Haritada en çok ${map.startZones.enemies.length} düşman yeri var.`);
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
 * otomatik yerleşir (istenirse `place` ile değiştirilir), masumlar ortaya yakın; GM başlatır.
 */
export function createMapBattle(
  participants: Combatant[], choice: { mapId: string; variantId: string; mirrored: boolean; options?: string[]; civilians?: number },
  rng: Rng,
): Session {
  const map = getMap(choice.mapId, { mirrored: choice.mirrored });
  const { state, events } = startBattle('harita', map.environmentId, participants, rng, {
    map: {
      id: choice.mapId, variantId: choice.variantId, mirrored: choice.mirrored,
      ...(choice.options ? { options: choice.options } : {}), ...(choice.civilians ? { civilians: choice.civilians } : {}),
    },
  });
  let session = createSession(state, events);
  const free = { party: preferred(map.startZones.players), enemies: preferred(map.startZones.enemies) };
  for (const c of Object.values(session.state.combatants)) {
    if (c.civilian) continue;
    const at = free[c.side].shift();
    if (at) session = dispatch(session, { type: 'place', actorId: c.id, at }, rng);
  }
  const middle = { col: Math.floor(map.size.cols / 2), row: Math.floor(map.size.rows / 2) };
  const spots: Offset[] = [];
  for (let row = 0; row < map.size.rows; row++) for (let col = 0; col < map.size.cols; col++) spots.push({ col, row });
  spots.sort((a, b) => distance(a, middle) - distance(b, middle) || a.row - b.row || a.col - b.col);
  for (const c of Object.values(session.state.combatants).filter((x) => x.civilian)) {
    for (const at of spots) {
      const next = dispatch(session, { type: 'place', actorId: c.id, at }, rng);
      if (next.error === null) { session = next; break; }
    }
  }
  return { ...session, error: null };
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
export function battleSummary(events: BattleEvent[], state: BattleState): { rounds: number; winner: BattleState['winner']; rows: SummaryRow[] } {
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
  return { rounds: state.round, winner: state.winner, rows: [...rows.values()] };
}
