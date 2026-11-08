/**
 * Kuyruk S2 (kural sürümü 41): irtifa. Savaşçıda `altitudeFt` (zeminin, yani yükseklik katmanının üstünde; yoksa 0);
 * nesnede de (Levitate). Sürüm 40 ve öncesinde hiçbiri yok (eski kayıt/replay aynen).
 * - Dikey hareket `vertical_move`: kendi uçuş hızı olan, hareketinden öder (5 ft = 1 altıgen); Levitate'i yapan, hedefini
 *   (yaratık ya da nesne) turda en çok 20 ft yukarı/aşağı (hareketsiz).
 * - Erişim/menzil: yatay uzaklıkla dikey fark büyüğü (`reachFt`).
 * - Alanlar: yer alanı (`ground`, yüzey) yalnız zemindekini, diğerleri `heightFt` (silindir; yoksa 20 ft) yüksekliğe dek.
 * - Düşüş (komut sonu): havada tutan şey biterse (Fly bitti, uçan Prone/Incapacitated/hızı 0) SRD düşme hasarı
 *   (10 ft başına 1d6, en çok 20d6) ve Prone; Levitate bitince süzülerek iner (hasarsız). Levitate'li nesne de iner.
 * Saf; zar `rng` ile.
 */
import rules from '../../data/s2-kurallar.json';
import { spells } from '../data';
import type { ZoneSpec } from '../data/types';
import { isIncapacitated, speedZero } from '../rules/conditions';
import type { Rng } from '../rules/dice';
import { fail, finish, type CommandResult } from './common';
import { turnKey } from './economy';
import { climbs, effectSpeedZero, fliesOrHovers, flySpeed, isAirborne } from './flight';
import { fallEffect } from './maprules';
import { fallReactions } from './reactions';
import { applyEvents, speedHexes } from './reduce';
import { ruleVersion } from './ruleVersion';
import { registerCommandEnd } from './turnHooks';
import type { BattleEvent, BattleState, Combatant, SpellZone } from './types';
import { neighbors, type Offset } from '../rules/hex';
import { maps } from '../map/maps';
import { terrainAt } from './movement';

export const ALT = rules.irtifa;
export const altitudeOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(s) >= 41;
export const altitudeOf = (c: Pick<Combatant, 'altitudeFt'> | undefined): number => c?.altitudeFt ?? 0;

/** Erişim uzaklığı (ft): yatay uzaklık ile irtifa farkının büyüğü (sürüm 41+; öncesinde yalnız yatay). */
export function reachFt(state: Pick<BattleState, 'kuralSurumu'>, a: Combatant, b: Combatant, flatFt: number): number {
  if (!altitudeOn(state)) return flatFt;
  return Math.max(flatFt, Math.abs(altitudeOf(a) - altitudeOf(b)));
}

/** Alanın tepe yüksekliği (ft): yer alanı ve yüzey 0, gaz bulutu ve diğerleri `heightFt` ya da varsayılan. */
export function zoneTopFt(z: SpellZone, spec: ZoneSpec | null | undefined): number {
  if (spec?.heightFt !== undefined) return spec.heightFt;
  if (spec?.ground) return ALT.groundZoneTopFt;
  if (z.surface && z.surface !== 'steam' && z.surface !== 'poison') return ALT.groundZoneTopFt;
  return ALT.defaultZoneTopFt;
}

/** İrtifadaki yaratık alanın içinde mi (yükseklik bakımından). Sürüm < 41 ya da irtifa 0: her zaman. */
export function altitudeInZone(state: Pick<BattleState, 'kuralSurumu'>, z: SpellZone, spec: ZoneSpec | null | undefined, c: Combatant | undefined): boolean {
  const a = altitudeOf(c);
  if (!a || !altitudeOn(state)) return true;
  return a <= zoneTopFt(z, spec);
}

/** Alan büyüsü (küre, küp, silindir, koni, çizgi) bu irtifaya ulaşır mı. */
export function areaReachesAltitude(state: Pick<BattleState, 'kuralSurumu'>, area: { shape: string; sizeFt: number; heightFt?: number }, c: Combatant): boolean {
  const a = altitudeOf(c);
  if (!a || !altitudeOn(state)) return true;
  if (area.heightFt !== undefined) return a <= area.heightFt;
  if (area.shape === 'line') return a <= 5;
  return a <= area.sizeFt;
}

const levitateOn = (c: Combatant | undefined) => c?.effects?.find((e) => e.levitate);

// --- Kuyruk K68b (sürüm 52): tavan, yaratık boyu, duvar ve tırmanma ---------------------------------------------------

const CEILING = new Map<string, number | null>();
/** Haritanın (varyantın) tavan yüksekliği (ft; `tavanFt`, sürüm 52+); açık gökte ya da eski sürümde null. */
export function ceilingFt(state: Pick<BattleState, 'kuralSurumu' | 'map'>): number | null {
  if (ruleVersion(state) < 52 || !state.map) return null;
  const key = `${state.map.id}\u0000${state.map.variantId}`;
  let v = CEILING.get(key);
  if (v === undefined) {
    const m = maps.find((x) => x.id === state.map?.id);
    v = (m?.variants.find((x) => x.id === state.map?.variantId) ?? m?.variants[0])?.tavanFt ?? null;
    CEILING.set(key, v);
  }
  return v;
}

/** Yaratığın boyu (ft; ⚠ SRD vermez, K68 karar 3: boyuttan). */
export const bodyHeightFt = (c: Pick<Combatant, 'size'>): number => (ALT.boyFt as Record<string, number>)[c.size] ?? 5;

/** Kuyruk K68c: göz yüksekliği (ft): irtifa + boyun yarısı (görüş hattının ucu). */
export const eyeFt = (c: Pick<Combatant, 'size' | 'altitudeFt'>): number => altitudeOf(c) + bodyHeightFt(c) / 2;

/** İrtifa üst sınırı (ft, 5'in katı): tavanlı haritada tavan − boy, açık gökte `irtifa.maxFt`. */
export function altitudeCapFt(state: Pick<BattleState, 'kuralSurumu' | 'map'>, c: Pick<Combatant, 'size'>): number {
  const ceil = ceilingFt(state);
  if (ceil === null) return ALT.maxFt;
  return Math.max(0, Math.floor((ceil - bodyHeightFt(c)) / ALT.stepFt) * ALT.stepFt);
}

/** Tavana değiyor mu (tavanlı harita, irtifa = üst sınır > 0). */
export const atCeiling = (state: Pick<BattleState, 'kuralSurumu' | 'map'>, c: Combatant): boolean => {
  if (ceilingFt(state) === null) return false;
  const cap = altitudeCapFt(state, c);
  return cap > 0 && altitudeOf(c) >= cap;
};

/**
 * Dikey yüzey (duvar) altıgeni: engel zeminine (`movement: 'blocked'`; uçanın üstünden geçtiği uçurum/yarık `u` ve coşkun
 * nehir `R` hariç: `flyersPass`) ya da harita kenarına bitişik. Levitate tutunması (S2) kendi eski denetimini kullanır.
 */
export function wallHex(state: BattleState, h: Offset): boolean {
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  if (h.col <= 0 || h.row <= 0 || h.col >= size.cols - 1 || h.row >= size.rows - 1) return true;
  return neighbors(h, size).some((n) => { const t = terrainAt(state, n); return t.movement === 'blocked' && !t.flyersPass; });
}

/** Tırmanma hızıyla duvarda/tavanda duran yaratık (`climbing` işareti yalnız sürüm 52'de; uçmayan, süzülmeyen). */
export const climbingAloft = (c: Combatant): boolean => !!c.climbing && altitudeOf(c) > 0 && !fliesOrHovers(c);

/** Tırmanan duvara/tavana tutunabiliyor mu (Prone, Incapacitated, hız 0 düşürür: SRD "Speed 0 → Climb Speed 0"). */
const climberHolds = (state: BattleState, c: Combatant): boolean => {
  if (!climbs(c, state) || !c.pos) return false;
  if (c.conditions.includes('Prone') || isIncapacitated(c.conditions) || speedZero(c.conditions) || effectSpeedZero(c)) return false;
  return atCeiling(state, c) || wallHex(state, c.pos);
};

/** Tırmanılabilecek en yüksek irtifa (ft): tavanlı haritada üst sınır, açık alanda duvar boyu `irtifa.wallFt`. */
export const climbCapFt = (state: BattleState, c: Combatant): number =>
  ceilingFt(state) === null ? Math.min(ALT.maxFt, ALT.wallFt) : altitudeCapFt(state, c);

/** Kuyruk K68a: altıgendeki açık Earthquake yarığının derinliği (ft; yoksa 0). `fissure.ts`'e bağımlılık olmadan. */
export function fissureDepthAt(state: Pick<BattleState, 'map'>, at: Offset): number {
  const z = (state.map?.zones ?? []).find((x) => x.fissure && !x.fissure.pending && x.hexes.some((h) => h.col === at.col && h.row === at.row));
  return z?.fissure?.depthFt ?? 0;
}

/** Dikey hareket. */
export function executeVerticalMove(state: BattleState, actor: Combatant, cmd: { targetId?: string; objectId?: string; toFt: number }): CommandResult {
  if (!altitudeOn(state)) return fail('Dikey hareket bu kural sürümünde yok.');
  const to = cmd.toFt;
  if (!Number.isFinite(to) || to < 0 || to % ALT.stepFt !== 0 || to > ALT.maxFt) return fail(`İrtifa 0–${ALT.maxFt} ft, ${ALT.stepFt} ft adımla.`);
  const turn = turnKey(state);
  // Levitate'li nesne: yapan, turda 20 ft'e dek.
  if (cmd.objectId) {
    const o = state.map?.objects?.find((x) => x.id === cmd.objectId);
    if (!o || o.levitatedBy !== actor.id) return fail('Bu nesneyi Levitate ile sen tutmuyorsun.');
    const d = Math.abs(to - (o.altitudeFt ?? 0));
    if (d === 0) return fail('Nesne zaten o irtifada.');
    if (d > ALT.levitatePerTurnFt) return fail(`Levitate turda en çok ${ALT.levitatePerTurnFt} ft.`);
    return finish(state, [{ type: 'altitude_changed', objectId: o.id, altitudeFt: to, label: 'Levitate', byId: actor.id }]);
  }
  const t = state.combatants[cmd.targetId ?? actor.id];
  if (!t || t.hp <= 0 || !t.pos) return fail('Hedef bulunamadı.');
  const from = altitudeOf(t);
  const d = Math.abs(to - from);
  if (d === 0) return fail('Zaten o irtifada.');
  // Kuyruk K68b (sürüm 52): tavan − boy üst sınırı (açık gökte `maxFt`).
  const ceil = ceilingFt(state);
  if (ceil !== null && to > from && to > altitudeCapFt(state, t)) return fail(`Tavan ${ceil} ft: ${t.name} en çok ${altitudeCapFt(state, t)} ft yükselir.`);
  const lev = levitateOn(t);
  if (lev && lev.sourceId === actor.id) {
    const used = t.vertTurn?.turn === turn ? t.vertTurn.ft : 0;
    if (used + d > ALT.levitatePerTurnFt) return fail(`Levitate turda en çok ${ALT.levitatePerTurnFt} ft (bu tur ${used} ft).`);
    return finish(state, [{ type: 'altitude_changed', targetId: t.id, altitudeFt: to, label: 'Levitate', turn, moved: d, byId: actor.id, gentle: true }]);
  }
  if (t.id !== actor.id) return fail('Yalnız kendini (uçarak) ya da Levitate hedefini yükseltip alçaltabilirsin.');
  // Kuyruk K68b (sürüm 52): tırmanma hızı olan (Spider Climb, `climber`, Roving…) duvara bitişikken tırmanır/iner
  // (tırmanma hızıyla ek maliyetsiz: 5 ft = 1 altıgen); üst sınır tavan − boy ya da açık alanda duvar boyu.
  if (!fliesOrHovers(actor) && ruleVersion(state) >= 52 && climbs(actor, state)) return climbMove(state, actor, from, to);
  if (flySpeed(actor) <= 0) return fail('Uçuş hızın yok.');
  const cost = d / 5;
  if (actor.movementUsed + cost > speedHexes(actor)) return fail(`Yeterli hareket yok (${d} ft dikey = ${cost} altıgen).`);
  return finish(state, [{ type: 'altitude_changed', targetId: t.id, altitudeFt: to, label: 'Uçuş', cost, byId: actor.id, gentle: false }]);
}

/** Kuyruk K68b: tırmanma hızıyla duvarda yukarı/aşağı (hareketten öder). */
function climbMove(state: BattleState, actor: Combatant, from: number, to: number): CommandResult {
  if (!actor.pos) return fail('Hedef bulunamadı.');
  if (from < 0) return fail('Yarıktan çıkmak için yarık tırmanışını kullan.');
  if (!climberHolds(state, { ...actor, altitudeFt: to })) {
    if (actor.conditions.includes('Prone') || isIncapacitated(actor.conditions) || speedZero(actor.conditions) || effectSpeedZero(actor)) return fail('Tırmanamaz: hızı 0, Prone ya da Incapacitated.');
    if (to > 0) return fail('Tırmanmak için duvara (engel ya da harita kenarı) bitişik ol.');
  }
  if (from <= 0 && !wallHex(state, actor.pos)) return fail('Tırmanmak için duvara (engel ya da harita kenarı) bitişik ol.');
  if (from > 0 && !wallHex(state, actor.pos)) return fail('İnmek için duvara bitişik ol (tavanın ortasından inilmez).');
  const cap = climbCapFt(state, actor);
  if (to > cap) return fail(ceilingFt(state) === null ? `Duvar boyu ${cap} ft: daha yükseğe tırmanılmaz.` : `Tavan ${ceilingFt(state)} ft: en çok ${cap} ft tırmanılır.`);
  const d = Math.abs(to - from);
  const cost = d / 5;
  if (actor.movementUsed + cost > speedHexes(actor)) return fail(`Yeterli hareket yok (${d} ft tırmanma = ${cost} altıgen).`);
  return finish(state, [{ type: 'altitude_changed', targetId: actor.id, altitudeFt: to, label: to > from ? 'Tırmanma' : 'İniş (tırmanarak)', cost, byId: actor.id, gentle: false, ...(to > 0 ? { climb: true as const } : {}) }]);
}

/** Levitate yükselmesi (büyü yapılınca): etkiyi alan hedef `cmd.altitudeFt` (yoksa 20 ft) yükselir. */
export function levitateRiseEvents(state: BattleState, events: BattleEvent[], wanted?: number): BattleEvent[] {
  if (!altitudeOn(state)) return [];
  const ft = Math.max(ALT.stepFt, Math.min(ALT.levitateRiseFt, Math.round((wanted ?? ALT.levitateRiseFt) / 5) * 5));
  return events.flatMap((e): BattleEvent[] => {
    const c = e.type === 'effect_added' && e.effect.levitate ? state.combatants[e.targetId] : undefined;
    if (!c || e.type !== 'effect_added') return [];
    // Kuyruk K68b (sürüm 52): tavana dek (tavan − boy).
    const to = Math.max(altitudeOf(c), Math.min(ft, altitudeCapFt(state, c)));
    return to === altitudeOf(c) && ceilingFt(state) !== null ? []
      : [{ type: 'altitude_changed', targetId: e.targetId, altitudeFt: to, label: 'Levitate', byId: e.effect.sourceId, gentle: true }];
  });
}

/**
 * Uçan yaratık havada kalabiliyor mu (Fly, uçuş hızı; Prone/Incapacitated/hızı 0 düşürür; Levitate her zaman).
 * Kuyruk K68b (sürüm 52): tırmanma hızı olan duvara bitişikken ya da tavana değerken tutunur.
 */
function staysUp(state: BattleState, c: Combatant): boolean {
  if (levitateOn(c)) return true;
  if (climbingAloft(c)) return climberHolds(state, c);
  if (!isAirborne(c)) return false;
  if (flySpeed(c) <= 0) return !!c.effects?.some((e) => e.airborne);
  return !c.conditions.includes('Prone') && !isIncapacitated(c.conditions) && !speedZero(c.conditions);
}

// Komut sonu: düşüş, süzülerek iniş, nesnenin inişi.
registerCommandEnd((before, next, _events, _cmd, rng: Rng) => {
  if (!altitudeOn(next)) return [];
  const out: BattleEvent[] = [];
  let s = next;
  for (const c0 of Object.values(next.combatants)) {
    let c = s.combatants[c0.id] as Combatant;
    // Kuyruk K66a: eksi irtifa (yarığın içi) düşüş değil.
    if (altitudeOf(c) <= 0) continue;
    // Kuyruk K68b (sürüm 52): tavanın üstündeki irtifa (boy büyüdü, tavanlı haritaya gelindi) tavana kırpılır (hasarsız).
    const cap = ceilingFt(s) === null ? null : altitudeCapFt(s, c);
    if (cap !== null && altitudeOf(c) > cap) {
      const evs: BattleEvent[] = [{ type: 'altitude_changed', targetId: c.id, altitudeFt: cap, label: `tavan (${ceilingFt(s)} ft)` }];
      out.push(...evs); s = applyEvents(s, evs);
      c = s.combatants[c0.id] as Combatant;
      if (cap <= 0) continue;
    }
    if (staysUp(s, c)) continue;
    const feet = altitudeOf(c);
    // Levitate bitti (önceki durumda vardı): süzülerek iner.
    if (c.altitudeGentle || levitateOn(before.combatants[c.id])) {
      // Kuyruk K68a (sürüm 52): yarığın üstündeyse dibine süzülür (hasarsız, Prone yok; SRD "floats gently to the ground").
      const pit = ruleVersion(next) >= 52 && c.pos ? fissureDepthAt(s, c.pos) : 0;
      const evs: BattleEvent[] = [{ type: 'altitude_changed', targetId: c.id, altitudeFt: pit ? -pit : 0, label: pit ? `Levitate bitti (süzülerek yarığın dibine, ${pit} ft)` : 'Levitate bitti (süzülerek iniş)' }];
      out.push(...evs); s = applyEvents(s, evs);
      continue;
    }
    const fr = fallReactions(s, c.id, feet, rng);
    const evs: BattleEvent[] = [...fr.events, { type: 'altitude_changed', targetId: c.id, altitudeFt: 0, label: 'düştü' },
      ...(c.pos ? [fallEffect(s.combatants[c.id] as Combatant, feet, rng, fr)] : [])];
    out.push(...evs); s = applyEvents(s, evs);
  }
  // Levitate'li nesne: yapanın Levitate konsantrasyonu bittiyse iner.
  const lev = spells.find((x) => x.id === 'levitate')?.name ?? 'Levitate';
  for (const o of s.map?.objects ?? []) {
    if (!o.levitatedBy) continue;
    if (s.combatants[o.levitatedBy]?.concentration?.spell === lev) continue;
    const evs: BattleEvent[] = [{ type: 'altitude_changed', objectId: o.id, altitudeFt: 0, label: 'Levitate bitti' }, { type: 'object_changed', objectId: o.id, label: 'Levitate bitti', levitatedBy: null }];
    out.push(...evs); s = applyEvents(s, evs);
  }
  return out;
});
