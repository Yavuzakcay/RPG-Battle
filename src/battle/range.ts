/**
 * Haritalı savaşta menzil: yakın dövüş erişimi, menzilli silahların normal ve uzun
 * menzili, büyü menzili. Haritasız savaşta (veya konumu olmayan savaşçıda) hiçbir şey
 * denetlenmez, eski davranış aynen sürer. Mesafe altıgen cinsinden (1 altıgen = 5 ft).
 */
import { cageBoxBlock } from './forcecage';
import { inProtectiveAura } from './ruleVersion';
import { knowsWhere } from './sight';
import { rangeBonusFt } from './heights';
import { stormRangeBonusFt } from './desert';
import { againstStrongWind } from './forest';
import { gap } from './body';
import { reachFt } from './altitude';
import { isIncapacitated } from '../rules/conditions';
import { distance, line } from '../rules/hex';
import { highJumpReachFt, solidWallAt } from './movement';
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
  | { kind: 'ranged'; normalFt: number; longFt: number; spell?: boolean; /** Kuyruk S2: saldırının adı (Wind Wall kuşatma mermisi). */ label?: string }
  /** Saldırı zarı olmayan etki (save'li büyü, nefes, iyileştirme): yalnızca menzil sınırı. */
  | { kind: 'effect'; rangeFt: number };

/** Saldıranın yanında (1 altıgen) aksiyon yapabilen bir düşman var mı? */
export function enemyAdjacent(state: BattleState, c: Combatant): boolean {
  if (!c.pos) return false;
  const pos = c.pos;
  return Object.values(state.combatants).some(
    (o) => o.side !== c.side && o.pos !== null && isTargetable(o) && o.hp > 0 && !isIncapacitated(o.conditions) && !isIntangible(o)
      && gap(state, { ...c, pos }, o) === 1 && reachFt(state, c, o, 5) <= 5,
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
  // Kuyruk A6 (Calm Emotions): kayıtsız yaratık büyücünün tarafına saldırmaz.
  if (attacker.effects?.some((e) => e.indifferentTo && e.indifferentTo === target.side)) return fail(`${attacker.name} kayıtsız (Calm Emotions): ${target.name} hedef alınamaz.`);
  if (attacker.effects?.some((e) => e.charm && e.sourceId === target.id) && !inProtectiveAura(state, attacker, 'aura-of-devotion')
    // Kuyruk S1: Calm Emotions altında bastırılmış büyülenme.
    && !attacker.effects.some((e) => e.suppressed?.some((x) => x.condition === 'Charmed'))) return fail(`${attacker.name} büyülenmiş (Charmed): ${target.name} hedef alınamaz.`);
  if (target.hidden && target.side !== attacker.side && !knowsWhere(state, attacker, target)) {
    return fail(`${target.name} gizlenmiş: hedef alınamaz, önce Ara ile bulunmalı.`);
  }
  if (!state.map || !attacker.pos || !target.pos) return { ok: true, sources: [], cover: 0 };
  // Görev P6: ek paket erişim eki (`boyut.erisimFt`; süren etki `reachPlus`) yakın dövüşe.
  const plus = reach.kind === 'melee' ? (attacker.effects ?? []).reduce((n, e) => n + (e.reachPlus ?? 0), 0) : 0;
  if (plus) reach = { kind: 'melee', reachFt: (reach as { reachFt: number }).reachFt + plus };
  // Görev A6: çok altıgenli gövdelerde en yakın iki altıgen arası.
  const d = gap(state, attacker, target);
  // Kuyruk S2 (sürüm 41): irtifa farkı (yatay uzaklıkla büyüğü).
  // Kuyruk K68b (sürüm 52): bu tur yerinde yüksek zıplayan (Jump) yakın dövüşte yukarıdakine zıplama yüksekliği kadar yaklaşır.
  const hj = reach.kind === 'melee' ? highJumpReachFt(state, attacker) : 0;
  const up = (target.altitudeFt ?? 0) - (attacker.altitudeFt ?? 0);
  const ft = hj && up > 0 ? Math.max(d * 5, up - hj) : reachFt(state, attacker, target, d * 5);
  const sources: ModeSource[] = [];
  // Gizlenmiş saldıran görünmez sayılır: saldırı zarında avantaj (ardından ortaya çıkar).
  if (attacker.hidden) sources.push({ effect: 'advantage', reason: 'Gizlenmiş saldıran' });
  if (reach.kind === 'melee') {
    if (ft > reach.reachFt) return fail(`Hedef erişim dışında: ${feetText(d)}, erişim ${reach.reachFt} ft.`);
  } else if (reach.kind === 'effect') {
    if (ft > reach.rangeFt) return fail(`Hedef menzil dışında: ${feetText(d)}, menzil ${reach.rangeFt} ft.`);
  } else {
    if (ft > reach.longFt) return fail(`Hedef menzil dışında: ${feetText(d)}, en uzak menzil ${reach.longFt} ft.`);
    // Kuyruk 26: 2+ seviye üstten menzilli saldırıda normal menzil uzar (yükseklik katmanı, yüksek zemin anahtarı).
    if (ft > reach.normalFt + rangeBonusFt(state, attacker.pos, target.pos) + stormRangeBonusFt(state, attacker.pos, target.pos)) sources.push({ effect: 'disadvantage', reason: 'Uzun menzil' });
    if (enemyAdjacent(state, attacker)) sources.push({ effect: 'disadvantage', reason: 'Yanında düşman (menzilli saldırı)' });
    // Gece kuyruğu 2 (K28 ortak): şiddetli rüzgâra karşı menzilli saldırı (Game Master: rüzgâr şiddeti; kural sürümü 7).
    if (againstStrongWind(state, attacker.pos, target.pos)) sources.push({ effect: 'disadvantage', reason: 'Şiddetli rüzgâra karşı' });
  }
  const lof = lineOfFire(state, attacker, target);
  if (lof.blocked) return fail(`Hedef görülemiyor: arada ${lof.blockedBy ?? 'engel'} var.`);
  // Kuyruk 19: görünmez duvar (Wall of Force) görüşü kesmez ama hiçbir şey geçemez.
  if (state.map.zones?.length) {
    const path = line(attacker.pos, target.pos).slice(1, -1);
    const wall = path.map((h) => solidWallAt(state, h)).find((w) => !!w);
    if (wall) return fail(`Hedefe ulaşılamıyor: arada ${wall} var.`);
  }
  // Kuyruk K62 (sürüm 46): Forcecage kutusu görüşü ve içeri/dışarı hedeflemeyi keser (kafeste geçer).
  const boxed = cageBoxBlock(state, attacker.pos, target.pos);
  if (boxed) return fail(`Hedefe ulaşılamıyor: arada ${boxed} var.`);
  // Harita kuralları: kum fırtınası, fırtına, karanlık, mazgal (Adım 8).
  const map = mapAttackSources(state, attacker, target, reach.kind === 'ranged');
  if ('ok' in map) return map;
  // Görev B2: büyü alanları: yoğun örtü (Fog Cloud…), rüzgâr duvarı (menzilli silah saldırısı geçemez).
  const zone = reach.kind === 'effect' ? { sources: [] } : zoneAttackSources(state, attacker, target, reach.kind === 'ranged', reach.kind === 'ranged' && !!reach.spell, reach.kind === 'ranged' ? reach.label : undefined);
  return { ok: true, sources: [...sources, ...map.sources, ...zone.sources], cover: Math.max(lof.cover, map.cover) as Cover,
    ...(zone.autoMiss ? { autoMiss: zone.autoMiss } : {}) };
}

/** Karakter saldırı seçeneğinin erişimi. Menzil bilgisi olmayan menzilli seçenek sınırsız sayılır. */
export function optionReach(o: { ranged: boolean; reachFt?: number; range?: [number, number]; label?: string }): Reach {
  if (!o.ranged) return { kind: 'melee', reachFt: o.reachFt ?? 5 };
  const [normalFt, longFt] = o.range ?? [Infinity, Infinity];
  return { kind: 'ranged', normalFt, longFt, ...(o.label ? { label: o.label } : {}) };
}

/** Canavar saldırısının erişimi: save'li etki, menzilli saldırı veya yakın dövüş. */
export function monsterAttackReach(a: { save?: unknown; ranged: boolean; reachFt?: number; range?: [number, number]; name?: string }): Reach {
  if (a.save) return { kind: 'effect', rangeFt: a.range?.[1] ?? Infinity };
  if (a.ranged) return { kind: 'ranged', normalFt: a.range?.[0] ?? Infinity, longFt: a.range?.[1] ?? Infinity, ...(a.name ? { label: a.name } : {}) };
  return { kind: 'melee', reachFt: a.reachFt ?? 5 };
}

/**
 * Tek hedefli büyünün erişimi: menzili 5 ft'ten uzun saldırı büyüsü menzilli saldırıdır
 * (yanında düşman dezavantajı); diğerleri yalnızca menzil sınırı.
 */
export function spellReach(spell: { rangeFt: number; level?: number; mechanics: { kind: string; lingering?: string } },
  caster?: { k19Traits?: boolean; traits?: string[] }): Reach {
  // Spiritual Weapon: güç menzil içinde belirip yanındakine yakın dövüş büyü saldırısı yapar.
  if (spell.mechanics.lingering === 'weapon') return { kind: 'melee', reachFt: spell.rangeFt + 5 };
  const range = spell.rangeFt + potentRangeFt(spell, caster);
  return spell.mechanics.kind === 'attack' && range > 5
    ? { kind: 'ranged', normalFt: range, longFt: range, spell: true }
    : { kind: 'effect', rangeFt: range };
}

/**
 * Kuyruk 19 (11–20): Improved Elemental Fury (Druid 15, Potent Spellcasting seçildiyse): 10 ft ve üstü menzilli
 * cantrip'lere +300 ft (`featuresK19`: savaşçıda `k19Traits`).
 */
export function potentRangeFt(spell: { rangeFt: number; level?: number }, caster?: { k19Traits?: boolean; traits?: string[] }): number {
  return caster?.k19Traits && spell.level === 0 && spell.rangeFt >= 10 && !!caster.traits?.includes('potent-spellcasting')
    && !!caster.traits.includes('improved-primal-strike') ? 300 : 0;
}
