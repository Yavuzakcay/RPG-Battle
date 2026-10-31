/**
 * Kuyruk 24c: gres yanıcılığı ve yanıcı hane hedeflemesi (harita bağımsız Game Master mekaniği `greaseFlammable`,
 * kural sürümü 5; `ruleControl.ts` `globalRule`). Mevcut parçalar: alev yüzeyi (`surfaceEvent('fire')`, hasarı
 * `zones.ts` `triggerEvents`: turda bir kez), yüzey tepkimeleri (`elementReactionEvents`: yağ, ağ, buz, su→buhar,
 * zehir bulutu), nesne hasarı (`damageObjectEvents`; çadır `forest.ts`'te tutuşur). Yeni hasar kuralı ve yeni olay yok.
 * - Gres alanına (Grease büyüsü) ateş değerse (alan, isabet eden saldırının hedefi, ateş hasarı alan yaratığın altıgeni ya da
 *   hane hedefli ateş büyüsü) bütün gres alanı alev yüzeyine döner; alev `burnRounds` tur sürer, sonra zemin normal.
 *   Tutuşma anında alevdeki yaratıklar alevin hasarını bir kez alır (aynı turda ikinci kez almaz).
 * - Yanan gres buhar üretmez: buhar yalnızca ateşin değdiği su altıgeninde (mevcut kural).
 * Saf; zarlar rng'den.
 */
import { distance, hexKey, type Offset } from '../rules/hex';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import type { Spell } from '../data';
import { fail, finish, type CommandResult } from './common';
import { sightBlockedBetween } from './cover';
import { damageObjectEvents } from './objects';
import { elementReactionEvents } from './surfaces';
import { spendSlot } from './slots';
import { hexLabel } from './movement';
import { globalRule } from './ruleControl';
import { applyEvents } from './reduce';
import { surfaceEvent } from './surfaces';
import { triggerEvents, zoneHexes } from './zones';
import { OBJECTS } from './objectData';
import { isAirborne } from './flight';
import type { BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;

export const GREASE_SPELL = 'grease';

/** Mekanik bu savaşta açık mı (kural sürümü 5 + Game Master anahtarı). */
export const greaseRule = (state: BattleState) => globalRule(state, 'greaseFlammable');

const greaseZones = (s: BattleState): SpellZone[] => (s.map?.zones ?? []).filter((z) => !z.surface && z.spellId === GREASE_SPELL);

/** Altıgende tutuşacak bir şey var mı: gres, yağ, ağ, yanıcı nesne (çadır, fıçı, masa). Mekanik kapalıysa false. */
export function flammableAt(state: BattleState, h: Offset): boolean {
  if (!state.map || !greaseRule(state)) return false;
  const k = hexKey(h);
  const zoned = (state.map.zones ?? []).some((z) => (z.surface === 'oil' || (!z.surface && (z.spellId === GREASE_SPELL || z.spellId === 'web')))
    && zoneHexes(state, z).some((x) => hexKey(x) === k));
  if (zoned) return true;
  return (state.map.objects ?? []).some((o) => !o.carriedBy && hexKey(o.at) === k && OBJECTS[o.kind]?.flammable === true && o.state !== 'burning');
}

/** Ateşin değdiği altıgenlere dokunan gres alanları alev olur; alevdeki yaratıklar bir kez yanar. */
export function greaseIgniteEvents(state: BattleState, hexes: Offset[], actorId: string, rng: Rng): BattleEvent[] {
  const rule = greaseRule(state);
  if (!rule || !hexes.length) return [];
  const touched = new Set(hexes.map(hexKey));
  const rounds = Math.max(1, typeof rule.burnRounds === 'number' ? rule.burnRounds : 3);
  const out: BattleEvent[] = [];
  let s = state;
  for (const z of greaseZones(state)) {
    const area = zoneHexes(s, z);
    if (!area.some((h) => touched.has(hexKey(h)))) continue;
    const side = s.combatants[actorId]?.side ?? 'enemies';
    const lit = surfaceEvent(s, 'fire', area, actorId, side);
    const fire = lit.type === 'zone_created' ? { ...lit, zone: { ...lit.zone, until: s.round + rounds - 1 } } : lit;
    const evs: BattleEvent[] = [
      { type: 'surface_reacted', reaction: 'ignite', hexes: area, sourceId: actorId, label: `${z.name} tutuştu` },
      { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' }, fire];
    out.push(...evs); s = applyEvents(s, evs);
    if (fire.type !== 'zone_created') continue;
    const keys = new Set(area.map(hexKey));
    for (const c of Object.values(s.combatants)) {
      if (!c.pos || c.hp <= 0 || isAirborne(c) || !keys.has(hexKey(c.pos))) continue;
      const zone = s.map?.zones?.find((x) => x.id === fire.zone.id);
      if (!zone) break;
      const hurt = triggerEvents(s, zone, c.id, rng);
      out.push(...hurt); s = applyEvents(s, hurt);
    }
  }
  return out;
}

/** Komutun ateşinin değdiği altıgenler: alan, alanlı saldırı, isabet eden ateş saldırısının hedefi, ateş hasarı alan yaratık. */
function fireHexesOf(next: BattleState, events: BattleEvent[]): Offset[] {
  const out: Offset[] = [];
  const at = (id: string) => next.combatants[id]?.pos;
  for (const e of events) {
    if (e.type === 'spell_cast' && e.area?.damageType === 'fire') out.push(...e.area.hexes);
    else if (e.type === 'area_used' && e.damageType === 'fire') out.push(...e.hexes);
    else if (e.type === 'attack_resolved' && e.hit && e.damageType === 'fire') { const p = at(e.targetId); if (p) out.push(p); }
    else if (e.type === 'save_resolved' && e.damageType === 'fire' && e.appliedDamage > 0) { const p = at(e.targetId); if (p) out.push(p); }
    else if (e.type === 'map_effect' && e.damage?.type === 'fire' && e.damage.applied > 0) { const p = at(e.targetId); if (p) out.push(p); }
  }
  return out;
}

/** Komut sonu (`execute`): ateşin değdiği gres tutuşur. Mekanik kapalıysa ya da gres yoksa boş. */
export function greaseAfterEvents(next: BattleState, events: BattleEvent[], rng: Rng): BattleEvent[] {
  if (!greaseZones(next).length || !greaseRule(next)) return [];
  const hexes = fireHexesOf(next, events);
  if (!hexes.length) return [];
  const actor = events.find((e) => 'actorId' in e && typeof (e as { actorId?: unknown }).actorId === 'string') as { actorId?: string } | undefined;
  return greaseIgniteEvents(next, hexes, actor?.actorId ?? 'harita', rng);
}

/** Ateşli tek hedefli büyü (saldırı, otomatik isabet ya da save; alansız) hane hedefleyebilir mi. */
export const fireHexSpell = (spell: Spell): boolean =>
  !spell.area && spell.mechanics.damageType === 'fire' && ['attack', 'auto', 'save'].includes(spell.mechanics.kind);

/**
 * Yanıcı haneye ateşli büyü (`cast_spell` + `targetHex`, `targetId` yok): menzil ve görüş yaratık hedefiyle aynı, isabet
 * zarı yok, hane tutuşur (gres, yağ, ağ, yanıcı nesne: nesneye büyünün hasar zarı). Slot ve eylem normal harcanır.
 * Yapay zekâ bu yolu kullanmaz.
 */
export function executeFireHex(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const at = cmd.targetHex as Offset;
  if (!greaseRule(state)) return fail('Yanıcı hane hedeflemesi kapalı (Game Master).');
  if (!flammableAt(state, at)) return fail('Bu altıgende tutuşacak bir şey yok.');
  if (!actor.pos) return fail('Konum yok.');
  const reach = spell.rangeFt;
  if (distance(actor.pos, at) * 5 > Math.max(5, reach)) return fail(`Altıgen menzil dışında (${distance(actor.pos, at) * 5} ft).`);
  const wall = sightBlockedBetween(state, actor.pos, at);
  if (wall) return fail(`Altıgen görünmüyor: araya ${wall} giriyor.`);
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const events: BattleEvent[] = [...slot.events,
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: `${hexLabel(at)} altıgeni tutuştu` }];
  let s = applyEvents(state, events);
  const push = (evs: BattleEvent[]) => { events.push(...evs); s = applyEvents(s, evs); };
  push(greaseIgniteEvents(s, [at], actor.id, rng));
  push(elementReactionEvents(s, 'fire', [at], actor.id, spell.name, rng));
  const obj = (s.map?.objects ?? []).find((o) => !o.carriedBy && hexKey(o.at) === hexKey(at) && OBJECTS[o.kind]?.flammable);
  if (obj) {
    const dmg = rollDice(spell.mechanics.damage ?? '1d10', rollTag(rng, { kind: 'damage', by: actor.id }));
    push(damageObjectEvents(s, obj, dmg.total, 'fire', actor.id, `${actor.name}: ${spell.name}`, rng));
  }
  return finish(state, events);
}
