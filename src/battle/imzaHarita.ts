/**
 * Kuyruk K54b G1: Harita Öğretisi (Wizard imza alt sınıfı; kural sürümü 27). Veri `data/imza.json` (`ozel` ve `param`):
 * - Arazi Okuma (3): ilk turunun başında 60 ft içindeki tuzaklar (tuzak, sarmaşık kapanı) bulunmuş sayılır, tehlikeli
 *   zemin ve yüzeyler günlüğe yazılır (Serüven keşif yarıçapı kısmı Serüven kilitliyken yok).
 * - Mevzi İşareti (3): seçilen altıgen + iki yan altıgen (büyücüye göre enine), 10 tur zemin koruması + kurtulma bonusu
 *   (`groundWard.ts`).
 * - Zemin Yeniden Yaz (6): üç kip, 20 ft yarıçap, 10 tur: zor zemin (alan `difficult`), yol aç (zemin yüzeyleri kalkar,
 *   dostlara zemin koruması), buz (yüzey; K55 çözücüsünden geçer: ateş eritir…).
 * - Çizili Duvar (10): K53 geçici engeli (`data/engeller.json` `cizili-duvar`), seçilen + iki yan altıgen.
 * - Kuşbakışı Plan (14): 10 tur dostlara zemin koruması; "Kuşbakışı: Yerleştir" serbest eylemi turda iki kez bir dostu
 *   60 ft içindeki boş altıgene ışınlar ya da iki dostun yerini değiştirir (fırsat saldırısı yok; K53 varış kancaları).
 * Saf; `rng` enjekte.
 */
import { barrierEvents, barriersOn } from './barriers';
import { surfaceEvent } from './surfaces';
import { teleport, withArrival } from './motion';
import { teleportEvent } from './teleport';
import { occupantAt, placeProblem, terrainAt } from './movement';
import { trapHexes, vineHexes } from './maprules';
import { registerTurnStart } from './turnHooks';
import { imzaPasifler } from './imzaCore';
import { ruleVersion } from './ruleVersion';
import { distance, hexKey, isInside, neighbors, withinRange, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, SpellZone } from './types';

export const HARITA_VERSION = 27;
type Param = Record<string, unknown>;
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const walkable = (s: BattleState, h: Offset) => isInside(h, sizeOf(s)) && terrainAt(s, h).movement !== 'blocked';
const ftHex = (ft: number) => Math.floor(ft / 5);
const zoneId = (s: BattleState, kind: string, actor: Combatant) => `imza-${kind}-${actor.id}-${s.round}-${s.turnIndex}-${(s.map?.zones ?? []).length}`;

/** Seçilen altıgen + büyücüye göre enine iki yan altıgen (en çok `n`). */
export function lateralHexes(state: BattleState, from: Offset, center: Offset, n = 3): Offset[] {
  const d = distance(from, center);
  const side = neighbors(center, sizeOf(state)).filter((h) => distance(from, h) === d && walkable(state, h))
    .sort((a, b) => a.row - b.row || a.col - b.col);
  return [center, ...side].slice(0, Math.max(1, n));
}

/** Doğrulama (null = geçerli). */
export function haritaProblem(state: BattleState, actor: Combatant, ozel: string, p: Param, target: Combatant | undefined, to: Offset | undefined): string | null {
  if (!state.map || !actor.pos) return 'Yalnızca haritalı savaşta.';
  if (ozel === 'plan') return planProblem(state, actor, p, target, to);
  if (!to) return 'Bir altıgen seç.';
  if (!isInside(to, sizeOf(state))) return 'Harita dışında.';
  const range = Number(p.menzilFt ?? 60);
  if (distance(actor.pos, to) * 5 > range) return `${range} ft içinde olmalı.`;
  if (ozel === 'duvar') {
    if (!barriersOn(state)) return 'Geçici engeller kapalı (Game Master anahtarı).';
    if (occupantAt(state, to)) return 'Yaratığın üzerine duvar çizilemez.';
    if (!walkable(state, to)) return 'Oraya duvar çizilemez.';
  }
  if (ozel === 'isaret' && !walkable(state, to)) return 'Geçilmez altıgen işaretlenemez.';
  return null;
}

/** Olaylar (doğrulamadan sonra). */
export function haritaEvents(state: BattleState, actor: Combatant, ozel: string, p: Param, target: Combatant | undefined, to: Offset | undefined, dc: number, rng: Rng): BattleEvent[] | string {
  if (ozel === 'plan') return planEvents(state, actor, target as Combatant, to as Offset, rng);
  const at = to as Offset;
  const sure = Number(p.sure ?? 10);
  if (ozel === 'duvar') {
    const ev = barrierEvents(state, actor, String(p.engel ?? 'cizili-duvar'), lateralHexes(state, actor.pos as Offset, at, Number(p.enCokHex ?? 3)), sure);
    return ev.length ? ev : 'Duvar çizilecek boş altıgen yok.';
  }
  if (ozel === 'isaret') {
    const out: BattleEvent[] = (state.map?.zones ?? []).filter((z) => z.casterId === actor.id && z.spellId === 'imza:mevzi')
      .map((z) => ({ type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'replaced' }) as BattleEvent);
    const zone: SpellZone = { id: zoneId(state, 'mevzi', actor), spellId: 'imza:mevzi', name: 'Mevzi İşareti', casterId: actor.id, side: actor.side, dc: 0, slotLevel: 0,
      hexes: lateralHexes(state, actor.pos as Offset, at, Number(p.enCokHex ?? 3)), until: state.round + sure,
      groundWard: { saveBonus: Number(p.saveBonus ?? 1) }, spec: { color: '#d8b04a', icon: '⚑' } };
    return [...out, { type: 'zone_created', zone }];
  }
  // Zemin Yeniden Yaz: alan (yarıçap içi, geçilir altıgenler).
  const hexes = withinRange(at, ftHex(Number(p.yaricapFt ?? 20)), sizeOf(state)).filter((h) => walkable(state, h));
  if (!hexes.length) return 'Alan boş.';
  const kip = String(p.kip ?? 'zor');
  if (kip === 'buz') {
    const ev = surfaceEvent(state, 'ice', hexes, actor.id, actor.side, dc);
    if (ev.type === 'zone_created') ev.zone = { ...ev.zone, until: state.round + sure };
    return [ev];
  }
  if (kip === 'temizle') {
    const keys = new Set(hexes.map(hexKey));
    const out: BattleEvent[] = [];
    for (const z of state.map?.zones ?? []) {
      if (!z.surface || z.surface === 'steam' || z.surface === 'poison' || !z.hexes.some((h) => keys.has(hexKey(h)))) continue;
      const left = z.hexes.filter((h) => !keys.has(hexKey(h)));
      out.push(left.length ? { type: 'zone_moved', zoneId: z.id, hexes: left } : { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'replaced' });
    }
    const zone: SpellZone = { id: zoneId(state, 'yol', actor), spellId: 'imza:yol-ac', name: 'Açılmış Yol', casterId: actor.id, side: actor.side, dc: 0, slotLevel: 0,
      hexes, until: state.round + sure, groundWard: {}, spec: { color: '#7fbf7f', icon: '🗺' } };
    return [...out, { type: 'zone_created', zone }];
  }
  const zone: SpellZone = { id: zoneId(state, 'zemin', actor), spellId: 'imza:zor-zemin', name: 'Yeniden Yazılmış Zemin', casterId: actor.id, side: actor.side, dc, slotLevel: 0,
    hexes, until: state.round + sure, spec: { difficult: Number(p.maliyet ?? 2), ground: true, color: '#8a6d4a', icon: '🗺' } };
  return [{ type: 'zone_created', zone }];
}

// ---------------------------------------------------------------- Kuşbakışı Plan

const planOn = (actor: Combatant) => !!actor.effects?.some((e) => e.id === `imza:imza_harita/birds-eye:${actor.id}`);
const PLAN_MARKS = ['imza:plan1', 'imza:plan2', 'imza:plan3', 'imza:plan4'];
function planSlot(state: BattleState, actor: Combatant, max: number): string | null {
  const key = String(state.round);
  return PLAN_MARKS.slice(0, max).find((m) => actor.traitTurns?.[m] !== key) ?? null;
}
function planProblem(state: BattleState, actor: Combatant, p: Param, ally: Combatant | undefined, to: Offset | undefined): string | null {
  if (!planOn(actor)) return 'Kuşbakışı Plan sürmüyor.';
  if (!planSlot(state, actor, Number(p.turdaEnCok ?? 2))) return 'Bu tur yerleştirme hakkın bitti.';
  if (!ally?.pos) return 'Bir dost seç.';
  if (!to) return 'Varış altıgenini seç.';
  const range = Number(p.menzilFt ?? 60);
  if (distance(actor.pos as Offset, to) * 5 > range || distance(actor.pos as Offset, ally.pos) * 5 > range) return `${range} ft içinde olmalı.`;
  if (to.col === ally.pos.col && to.row === ally.pos.row) return 'Dost zaten orada.';
  const other = occupantAt(state, to, ally.id);
  if (other) return other.side === actor.side && other.hp > 0 ? null : 'Varış altıgeni dolu.';
  return placeProblem(state, to);
}
function planEvents(state: BattleState, actor: Combatant, ally: Combatant, to: Offset, rng: Rng): BattleEvent[] | string {
  const mark: BattleEvent = { type: 'trait_turn', actorId: actor.id, trait: planSlot(state, actor, 4) as string, key: String(state.round) };
  const other = occupantAt(state, to, ally.id);
  if (other) {
    // Dost yer takası: iki konum birden (fırsat saldırısı yok).
    return [mark, ...withArrival(state, [mark], [teleportEvent(ally, to, 'Kuşbakışı Plan'), teleportEvent(other, ally.pos as Offset, 'Kuşbakışı Plan')], rng)];
  }
  const r = teleport(state, ally, to, { rangeFt: 1e6, sight: false }, 'Kuşbakışı Plan', rng, [mark]);
  return 'problem' in r ? r.problem : [mark, ...r.events];
}

// ---------------------------------------------------------------- Arazi Okuma (tur başı)

registerTurnStart((state, id) => {
  const c = state.combatants[id];
  if (!c?.pos || c.imza !== 'imza_harita' || ruleVersion(state) < HARITA_VERSION || c.traitTurns?.['imza:arazi']) return [];
  const prm = imzaPasifler(c).find((p) => p.ozellik === 'read-the-land')?.etki.araziOkuma as { yaricapFt: number } | undefined;
  if (!prm || !state.map) return [];
  const r = ftHex(prm.yaricapFt);
  const out: BattleEvent[] = [{ type: 'trait_turn', actorId: c.id, trait: 'imza:arazi', key: 'bilindi' }];
  const known = new Set([...(state.map.trapsFound ?? []), ...(state.map.trapsSprung ?? [])]);
  for (const h of [...trapHexes(state), ...vineHexes(state)]) {
    if (known.has(hexKey(h)) || distance(c.pos, h) > r) continue;
    known.add(hexKey(h));
    out.push({ type: 'map_note', text: `${c.name} araziyi okudu: tuzak (${h.col + 1},${h.row + 1}).`, trapFound: h });
  }
  const near = withinRange(c.pos, r, sizeOf(state));
  const hazards = near.filter((h) => { const t = terrainAt(state, h); return !!t.hazard || t.movement === 'deadly'; }).length;
  const surf = new Set((state.map.zones ?? []).filter((z) => z.surface && z.hexes.some((h) => distance(c.pos as Offset, h) <= r)).map((z) => z.name));
  if (hazards || surf.size) out.push({ type: 'map_note', text: `${c.name} araziyi okudu: ${hazards} tehlikeli zemin altıgeni${surf.size ? `, yüzeyler: ${[...surf].join(', ')}` : ''}.` });
  return out;
});
