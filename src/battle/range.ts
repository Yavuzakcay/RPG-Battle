/**
 * Haritalı savaşta menzil: yakın dövüş erişimi, menzilli silahların normal ve uzun
 * menzili, büyü menzili. Haritasız savaşta (veya konumu olmayan savaşçıda) hiçbir şey
 * denetlenmez, eski davranış aynen sürer. Mesafe altıgen cinsinden (1 altıgen = 5 ft).
 */
import { isIncapacitated } from '../rules/conditions';
import { distance } from '../rules/hex';
import type { ModeSource } from '../rules/modes';
import type { Cover } from '../map/terrain';
import { fail, isIntangible, isTargetable, type Failure } from './common';
import { zoneAttackSources } from './zones';
import { lineOfFire } from './cover';
import { mapAttackSources } from './maprules';
import type { BattleState, Combatant } from './types';

/** Bir saldırının veya etkinin ulaşabildiği uzaklık. */
export type Reach =
  /** Yakın dövüş (ft): 5 = 1 altıgen, uzun erişim 10 = 2 altıgen. */
  | { kind: 'melee'; reachFt: number }
  /** Saldırı zarlı menzilli saldırı: normal menzil ötesi dezavantaj, uzun menzil ötesi yok. */
  | { kind: 'ranged'; normalFt: number; longFt: number; spell?: boolean }
  /** Saldırı zarı olmayan etki (save'li büyü, nefes, iyileştirme): yalnızca menzil sınırı. */
  | { kind: 'effect'; rangeFt: number };

/** Saldıranın yanında (1 altıgen) aksiyon yapabilen bir düşman var mı? */
export function enemyAdjacent(state: BattleState, c: Combatant): boolean {
  if (!c.pos) return false;
  const pos = c.pos;
  return Object.values(state.combatants).some(
    (o) => o.side !== c.side && o.pos !== null && isTargetable(o) && o.hp > 0 && !isIncapacitated(o.conditions) && !isIntangible(o)
      && distance(pos, o.pos) === 1,
  );
}

const feetText = (hexes: number) => `${hexes} altıgen (${hexes * 5} ft)`;

export interface Targeting {
  ok: true;
  /** Menzilden gelen avantaj/dezavantaj kaynakları. */
  sources: ModeSource[];
  /** Hedefin siperi: saldırıda AC'ye, DEX save'ine eklenir. */
  cover: Cover;
  /** CILA: saldırı otomatik ıskalar (nedeni; Wind Wall: menzilli silah saldırısı duvardan geçerken). */
  autoMiss?: string;
}

/**
 * Menzili, görüş hattını ve siperi denetler. Geçerliyse menzilden gelen avantaj/dezavantaj
 * kaynaklarını ve hedefin siperini döndürür; haritasız savaşta hiçbir şey denetlenmez.
 */
export function checkReach(
  state: BattleState, attacker: Combatant, target: Combatant, reach: Reach,
): Targeting | Failure {
  // Görev B2: dokunulamaz çağrı (Flaming Sphere, ruh sürüsü) hedef alınmaz.
  if (isIntangible(target)) return fail(`${target.name} dokunulamaz: hedef alınamaz.`);
  // Görev B3: büyülenen (Charm Person, Animal Friendship, Suggestion) büyüleyene saldıramaz ve onu hedef alamaz.
  if (attacker.effects?.some((e) => e.charm && e.sourceId === target.id)) return fail(`${attacker.name} büyülenmiş (Charmed): ${target.name} hedef alınamaz.`);
  if (target.hidden && target.side !== attacker.side) {
    return fail(`${target.name} gizlenmiş: hedef alınamaz, önce Ara ile bulunmalı.`);
  }
  if (!state.map || !attacker.pos || !target.pos) return { ok: true, sources: [], cover: 0 };
  const d = distance(attacker.pos, target.pos);
  const ft = d * 5;
  const sources: ModeSource[] = [];
  // Gizlenmiş saldıran görünmez sayılır: saldırı zarında avantaj (ardından ortaya çıkar).
  if (attacker.hidden) sources.push({ effect: 'advantage', reason: 'Gizlenmiş saldıran' });
  if (reach.kind === 'melee') {
    if (ft > reach.reachFt) return fail(`Hedef erişim dışında: ${feetText(d)}, erişim ${reach.reachFt} ft.`);
  } else if (reach.kind === 'effect') {
    if (ft > reach.rangeFt) return fail(`Hedef menzil dışında: ${feetText(d)}, menzil ${reach.rangeFt} ft.`);
  } else {
    if (ft > reach.longFt) return fail(`Hedef menzil dışında: ${feetText(d)}, en uzak menzil ${reach.longFt} ft.`);
    if (ft > reach.normalFt) sources.push({ effect: 'disadvantage', reason: 'Uzun menzil' });
    if (enemyAdjacent(state, attacker)) sources.push({ effect: 'disadvantage', reason: 'Yanında düşman (menzilli saldırı)' });
  }
  const lof = lineOfFire(state, attacker, target);
  if (lof.blocked) return fail(`Hedef görülemiyor: arada ${lof.blockedBy ?? 'engel'} var.`);
  // Harita kuralları: kum fırtınası, fırtına, karanlık, mazgal (Adım 8).
  const map = mapAttackSources(state, attacker, target, reach.kind === 'ranged');
  if ('ok' in map) return map;
  // Görev B2: büyü alanları: yoğun örtü (Fog Cloud…), rüzgâr duvarı (menzilli silah saldırısı geçemez).
  const zone = reach.kind === 'effect' ? { sources: [] } : zoneAttackSources(state, attacker, target, reach.kind === 'ranged', reach.kind === 'ranged' && !!reach.spell);
  return { ok: true, sources: [...sources, ...map.sources, ...zone.sources], cover: Math.max(lof.cover, map.cover) as Cover,
    ...(zone.autoMiss ? { autoMiss: zone.autoMiss } : {}) };
}

/** Karakter saldırı seçeneğinin erişimi. Menzil bilgisi olmayan menzilli seçenek sınırsız sayılır. */
export function optionReach(o: { ranged: boolean; reachFt?: number; range?: [number, number] }): Reach {
  if (!o.ranged) return { kind: 'melee', reachFt: o.reachFt ?? 5 };
  const [normalFt, longFt] = o.range ?? [Infinity, Infinity];
  return { kind: 'ranged', normalFt, longFt };
}

/** Canavar saldırısının erişimi: save'li etki, menzilli saldırı veya yakın dövüş. */
export function monsterAttackReach(a: { save?: unknown; ranged: boolean; reachFt?: number; range?: [number, number] }): Reach {
  if (a.save) return { kind: 'effect', rangeFt: a.range?.[1] ?? Infinity };
  if (a.ranged) return { kind: 'ranged', normalFt: a.range?.[0] ?? Infinity, longFt: a.range?.[1] ?? Infinity };
  return { kind: 'melee', reachFt: a.reachFt ?? 5 };
}

/**
 * Tek hedefli büyünün erişimi: menzili 5 ft'ten uzun saldırı büyüsü menzilli saldırıdır
 * (yanında düşman dezavantajı); diğerleri yalnızca menzil sınırı.
 */
export function spellReach(spell: { rangeFt: number; mechanics: { kind: string; lingering?: string } }): Reach {
  // Spiritual Weapon: güç menzil içinde belirip yanındakine yakın dövüş büyü saldırısı yapar.
  if (spell.mechanics.lingering === 'weapon') return { kind: 'melee', reachFt: spell.rangeFt + 5 };
  return spell.mechanics.kind === 'attack' && spell.rangeFt > 5
    ? { kind: 'ranged', normalFt: spell.rangeFt, longFt: spell.rangeFt, spell: true }
    : { kind: 'effect', rangeFt: spell.rangeFt };
}
