/**
 * Kuyruk K66b (kural sürümü 50, K66a ile aynı): Earthquake yapı hasarı ve çöküş (SRD 5.2.1 s. 127 "Structures").
 * - Yapı: veride (`zone.structures.heightsFt`) adı geçen nesneler (kapı, kafes kapısı, çadır, çatlak duvar) ve Wall of Stone /
 *   Wall of Ice panelleri (Wall of Force panelsiz, hasara bağışık). Harita duvar harfleri (canları yok), köprü, bulmaca
 *   nesneleri, eşya ve ağaç yapı değil. Havadaki (Levitate) nesne yere değmez.
 * - Dökümde ve büyücünün her tur sonunda alandaki her yapıya 50 Bludgeoning (nesne/panel bağışıklık ve zayıflıkları aynen).
 * - 0 HP'de çöker: yarı yükseklik (altıgen 5 ft; en az 1) içindeki yaratıklar DEX save (büyünün DC'si); başarısızsa 12d6
 *   Bludgeoning, Prone ve enkaz altında (süren etki: hız 0, eylemle DC 20 Athletics `escape`; Restrained yok), başarılıysa
 *   yarı hasar. Çöken yapının altıgeni taşlık (`t`, zorlu arazi).
 * Yeni olay türü yok (`object_damaged`/`object_destroyed`, `zone_panel_damaged`/`zone_moved`, `save_resolved`,
 * `effect_added`, `tile_changed`, `map_note`). Saf; zar `rng` ile.
 */
import { distance, hexKey, sameHex, type Offset } from '../rules/hex';
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { autoFailsStrDexSave } from '../rules/conditions';
import { terrainOf } from '../map/terrain';
import type { ZoneSpec } from '../data';
import { damageProfile, isIntangible } from './common';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { saveDamage } from './classTraits';
import { applyEvents } from './reduce';
import { ruleVersion } from './ruleVersion';
import { bodyAt } from './body';
import { altitudeOf } from './altitude';
import { OBJECTS } from './objectData';
import { damageObjectEvents } from './objects';
import { panelDamageEvents, panelId, panelOf, panelStats } from './walls';
import { zoneSpecOf } from './zones';
import type { BattleEvent, BattleState, Combatant, MapObject, SpellZone } from './types';

type StructSpec = NonNullable<ZoneSpec['structures']>;
export const QUAKE_VERSION = 50;
/** Enkaz etkisinin kimlik öneki (rozet ve arayüz). */
export const BURIED_PREFIX = 'buried:';
export const isBuried = (c: Combatant): boolean => !!c.effects?.some((e) => e.id.startsWith(BURIED_PREFIX));

const specOfZone = (s: BattleState, z: SpellZone): StructSpec | undefined => (ruleVersion(s) >= QUAKE_VERSION ? zoneSpecOf(z)?.structures : undefined);

/** Alandaki yapılar: nesne ya da panel; yükseklik ve kalan can (önizleme, YZ ve hasar ortak). */
export interface Structure { kind: 'object' | 'panel'; at: Offset; heightFt: number; hp: number; label: string; obj?: MapObject; zone?: SpellZone; immune?: boolean }
export function structuresIn(s: BattleState, hexes: Offset[], spec: StructSpec, skipZoneId?: string): Structure[] {
  const keys = new Set(hexes.map(hexKey));
  const out: Structure[] = [];
  for (const o of s.map?.objects ?? []) {
    const h = spec.heightsFt[o.kind];
    if (h === undefined || o.carriedBy || (o.altitudeFt ?? 0) > 0 || !keys.has(hexKey(o.at))) continue;
    out.push({ kind: 'object', at: o.at, heightFt: h, hp: o.hp, label: OBJECTS[o.kind]?.tr ?? o.kind, obj: o });
  }
  for (const z of s.map?.zones ?? []) {
    if (z.id === skipZoneId) continue;
    for (const h of z.hexes) {
      if (!keys.has(hexKey(h)) || !panelOf(s, panelId(z, h))) continue;
      const st = panelStats(z);
      out.push({ kind: 'panel', at: h, heightFt: spec.heightsFt.panel ?? 10, hp: st.hp - (z.panelDamage?.[hexKey(h)] ?? 0), label: z.name, zone: z, immune: st.immune.includes(spec.damageType) });
    }
  }
  return out;
}

/** Bu tremor yapıyı yıkar mı (bağışıklık ve zayıflık dahil). */
export function collapses(st: Structure, spec: StructSpec): boolean {
  if (st.kind === 'panel') {
    const p = st.zone ? panelStats(st.zone) : null;
    if (!p || p.immune.includes(spec.damageType)) return false;
    return st.hp - spec.damage * (p.vuln.includes(spec.damageType) ? 2 : 1) <= 0;
  }
  const def = st.obj ? OBJECTS[st.obj.kind] : undefined;
  if (!def || ['poison', 'psychic'].includes(spec.damageType)) return false;
  return st.hp - spec.damage * (def.vulnerable?.includes(spec.damageType) ? 2 : 1) <= 0;
}

/** Çöküş yarıçapı (altıgen): yarı yükseklik / 5 ft, en az 1. */
export const collapseRadius = (heightFt: number): number => Math.max(1, Math.floor(heightFt / 2 / 5));

/** Çöküşün vuracağı yaratıklar (gövdesinin bir altıgeni yarıçap içinde; dokunulamaz çağrı hariç). */
export function collapseVictims(s: BattleState, at: Offset, heightFt: number): Combatant[] {
  const r = collapseRadius(heightFt);
  return Object.values(s.combatants).filter((c) => c.pos && c.hp > 0 && c.life !== 'dead' && !c.summon?.gone && !isIntangible(c) && !c.offFloor
    && altitudeOf(c) <= heightFt && bodyAt(s, c, c.pos).some((b) => distance(b, at) <= r));
}

/** Çöküş: save, 12d6 (bir kez atılır), Prone, enkaz; zemin taşlık. */
function collapseEvents(state: BattleState, quake: SpellZone, spec: StructSpec, at: Offset, heightFt: number, label: string, rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { out.push(...evs); s = applyEvents(s, evs); };
  const ch = s.map?.tiles[at.row]?.[at.col] ?? '#';
  const t = terrainOf(ch);
  push([{ type: 'map_note', text: `${label} çöktü (${heightFt} ft)` }, ...(t.outOfBounds || t.flyersPass || t.rule === 'deepWater' || ch === spec.collapse.rubble ? [] : [{ type: 'tile_changed', at, to: spec.collapse.rubble } as BattleEvent])]);
  const victims = collapseVictims(s, at, heightFt);
  if (!victims.length) return out;
  const roll = rollDice(spec.collapse.dice, rollTag(rng, { kind: 'damage', by: quake.casterId }));
  const caster = s.combatants[quake.casterId];
  for (const c0 of victims) {
    const c = s.combatants[c0.id] as Combatant;
    if (c.hp <= 0) continue;
    const save = resolveSave({ extra: saveDice(c, 'dex'), modifier: c.saves.dex, dc: quake.dc, mode: saveMode('normal', c, 'dex', caster), autoFail: autoFailsStrDexSave(c.conditions) }, rollTag(rng, { by: c.id }));
    const amount = saveDamage(c, 'dex', save.success, roll.total, true);
    const adj = amount > 0 ? adjustDamage(amount, spec.collapse.type, damageProfile(c)) : { amount: 0, note: null };
    const fx = damageEffects(c, adj.amount, spec.collapse.type, false, rng);
    const buried = !save.success && fx.hpAfter > 0;
    push([{ type: 'save_resolved', actorId: quake.casterId, targetId: c.id, label: `${label}: çöküş`, ability: 'dex', dc: quake.dc, mode: 'normal', reasons: [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: roll.rolls, rawDamage: roll.total, appliedDamage: adj.amount, damageType: spec.collapse.type, damageNote: adj.note,
      targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: buried && !c.conditions.includes('Prone') ? ['Prone'] : [], ...(save.extra ? { bonusDice: save.extra } : {}) }]);
    if (buried) push([{ type: 'effect_added', targetId: c.id, effect: { id: `${BURIED_PREFIX}${quake.id}:${at.col},${at.row}`, name: 'Enkaz altında', sourceId: quake.casterId,
      speedZero: true, escapeCheck: { dc: spec.collapse.escapeDc, skill: 'athletics' } } }]);
  }
  return out;
}

/** Earthquake alanındaki yapılara 50 hasar; çökenler çöküş olaylarıyla. */
export function quakeStructureEvents(state: BattleState, quake: SpellZone, rng: Rng): BattleEvent[] {
  const spec = specOfZone(state, quake);
  if (!spec) return [];
  const out: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { out.push(...evs); s = applyEvents(s, evs); };
  for (const st of structuresIn(s, quake.hexes, spec, quake.id)) {
    if (st.kind === 'object' && st.obj) {
      const live = s.map?.objects?.find((o) => o.id === st.obj?.id);
      if (!live) continue;
      const evs = damageObjectEvents(s, live, spec.damage, spec.damageType, quake.casterId, quake.name, rng);
      push(evs);
      if (evs.some((e) => e.type === 'object_destroyed' && e.objectId === live.id)) push(collapseEvents(s, quake, spec, live.at, st.heightFt, st.label, rng));
    } else if (st.zone) {
      const live = s.map?.zones?.find((z) => z.id === st.zone?.id);
      if (!live || !live.hexes.some((h) => sameHex(h, st.at))) continue;
      const evs = panelDamageEvents(s, live, st.at, spec.damage, spec.damageType);
      push(evs);
      if (evs.some((e) => e.type === 'zone_moved' && e.zoneId === live.id)) push(collapseEvents(s, quake, spec, st.at, st.heightFt, st.label, rng));
    }
  }
  return out;
}

/** Büyücünün tur sonu: kendi Earthquake alanlarındaki yapılara yeniden 50 hasar. */
export function quakeTurnEndEvents(state: BattleState, casterId: string, rng: Rng): BattleEvent[] {
  if (ruleVersion(state) < QUAKE_VERSION) return [];
  const out: BattleEvent[] = [];
  let s = state;
  for (const z of (state.map?.zones ?? []).filter((x) => x.casterId === casterId && specOfZone(state, x))) {
    const live = s.map?.zones?.find((x) => x.id === z.id);
    if (!live) continue;
    const evs = quakeStructureEvents(s, live, rng);
    out.push(...evs); s = applyEvents(s, evs);
  }
  return out;
}

/** Önizleme ve yapay zekâ: bu tremorda çökecek yapılar ve vuracakları (dost/düşman büyücüye göre). */
export function quakeForecast(s: BattleState, actor: Combatant, hexes: Offset[], spec: StructSpec): { structures: Structure[]; falling: Structure[]; foes: Combatant[]; friends: Combatant[] } {
  const structures = structuresIn(s, hexes, spec);
  const falling = structures.filter((st) => collapses(st, spec));
  const hit = new Map<string, Combatant>();
  for (const st of falling) for (const c of collapseVictims(s, st.at, st.heightFt)) hit.set(c.id, c);
  const all = [...hit.values()];
  const friend = (c: Combatant) => c.side === actor.side || !!c.civilian;
  return { structures, falling, foes: all.filter((c) => !friend(c)), friends: all.filter(friend) };
}

/** Döküm: büyünün yarattığı Earthquake alanı (yapı kuralı olan) bulunur, yapılara hasar. */
export function quakeCastEvents(state: BattleState, events: BattleEvent[], rng: Rng): BattleEvent[] {
  const made = events.find((e): e is Extract<BattleEvent, { type: 'zone_created' }> => e.type === 'zone_created' && !!specOfZone(state, e.zone));
  const live = made ? state.map?.zones?.find((z) => z.id === made.zone.id) : undefined;
  return live ? quakeStructureEvents(state, live, rng) : [];
}
