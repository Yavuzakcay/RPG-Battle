/**
 * Kuyruk K62 (kural sürümü 46): Delayed Blast Fireball (SRD 5.2.1). Büyü bir boncuk alanıdır (`SpellZone.bead`, merkez
 * `center`): dökümde hasar yok; taban 12d6 (+1d6 yukarı slot başına), büyücünün turu her bittiğinde ve büyü sürerken
 * +1d6 birikir (`zone.dealt` = biriken zar sayısı). Büyü bitince (konsantrasyon kopar ya da 10 tur dolar) 20 ft yarıçaplı
 * küre patlar (`beadAfterEvents`, komut sonunda): hedef başına DEX save, birikmiş toplam Fire (başarıda yarı), yanıcı
 * nesneler Fireball gibi tutuşur (standart `area_used` + `save_resolved` olayları). Boncuğa dokunan yaratık
 * (`spell_followup` `choice: 'bead'`) DEX save atar: başarısızlıkta büyü biter ve patlar; başarıda boncuğu en çok 40 ft
 * fırlatır (yaratık altıgenine girerse ya da katı bir engele çarparsa orada patlar). Saf modül.
 */
import { areaHexes } from '../rules/area';
import { distance, hexKey, isInside, line, type Offset } from '../rules/hex';
import { resolveSave } from '../rules/attack';
import { rollTag, type Rng } from '../rules/dice';
import { areaSaveEvents } from './areaAttack';
import { fail, finish, type CommandResult } from './common';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { terrainAt, occupantAt } from './movement';
import { applyEvents } from './reduce';
import { ruleVersion } from './ruleVersion';
import { autoFailsStrDexSave } from '../rules/conditions';
import type { BattleEvent, BattleState, Combatant, SpellZone } from './types';

export const BEAD_VERSION = 46;
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const centerOf = (z: SpellZone): Offset => z.center ?? z.hexes[Math.floor(z.hexes.length / 2)] as Offset;

/** Haritadaki boncuklar (sürüm 46+). */
export const beadsOf = (s: BattleState): SpellZone[] => (ruleVersion(s) >= BEAD_VERSION ? (s.map?.zones ?? []).filter((z) => !!z.bead) : []);

/** Boncuğun şimdiki hasar zarı sayısı (d6): taban 12 + yukarı slot + birikenler. */
export const beadDice = (z: SpellZone, baseLevel = 7): number => 12 + Math.max(0, z.slotLevel - baseLevel) + (z.dealt ?? 0);

const beadAlive = (s: BattleState, z: SpellZone): boolean => {
  const c = s.combatants[z.casterId];
  return !!c && c.life !== 'dead' && c.hp > 0 && c.concentration?.spell === z.name && s.round <= (z.bead?.until ?? 0);
};

/** Büyücünün turu bitince (büyü sürerken) her boncuğa +1d6. */
export function beadTurnEndEvents(state: BattleState, casterId: string): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const z of beadsOf(state)) {
    if (z.casterId !== casterId || !beadAlive(state, z)) continue;
    out.push({ type: 'zone_dealt', zoneId: z.id, amount: 1 }, { type: 'map_note', text: `${z.name}: boncuk parlıyor, hasar ${beadDice(z) + 1}d6'ya çıktı.` });
  }
  return out;
}

/** Biten boncukların patlaması (komut sonunda): konsantrasyon bitti, süre doldu ya da büyücü düştü. */
export function beadAfterEvents(state: BattleState, rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  let s = state;
  for (const z0 of beadsOf(state)) {
    const z = s.map?.zones?.find((x) => x.id === z0.id);
    if (!z || beadAlive(s, z)) continue;
    const evs = explodeEvents(s, z, rng);
    out.push(...evs);
    s = applyEvents(s, evs);
  }
  return out;
}

function explodeEvents(state: BattleState, z: SpellZone, rng: Rng): BattleEvent[] {
  const at = centerOf(z);
  const caster = state.combatants[z.casterId];
  const hexes = areaHexes({ shape: 'sphere', sizeFt: 20, origin: 'point', targets: 'all' } as never, at, at, sizeOf(state));
  const keys = new Set(hexes.map(hexKey));
  const reached = Object.values(state.combatants)
    .filter((c) => c.pos && c.hp > 0 && c.life !== 'dead' && keys.has(hexKey(c.pos)))
    .map((c) => ({ c, cover: 0 as const }));
  const dice = beadDice(z);
  const out: BattleEvent[] = [{ type: 'map_note', text: `${z.name}: boncuk patladı (${dice}d6 ateş).` }];
  if (caster) {
    out.push(...areaSaveEvents(state, caster, { hexes, origin: at, reached } as never, { shape: 'sphere', sizeFt: 20, origin: 'point' } as never,
      { label: z.name, ability: 'dex', dc: z.dc, damageDice: `${dice}d6`, damageType: 'fire', halfOnSave: true, fromSpell: true }, rng, at));
  }
  out.push({ type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'expired' });
  return out;
}

/**
 * Boncuğa dokunma (`spell_followup`, `choice: 'bead'`, `targetId` = boncuk alanı kimliği, `targetHex` = fırlatma hedefi):
 * dokunan boncuğun altıgeninde ya da bitişiğinde olmalı. DEX save: başarısızlıkta büyü biter (patlama komut sonunda);
 * başarıda `targetHex` verilmişse en çok 40 ft fırlatılır.
 */
export function executeBeadTouch(state: BattleState, actor: Combatant, zoneId: string, to: Offset | undefined, rng: Rng): CommandResult {
  const z = beadsOf(state).find((x) => x.id === zoneId);
  if (!z || !actor.pos) return fail('Dokunulacak boncuk yok.');
  const at = centerOf(z);
  if (distance(actor.pos, at) > 1) return fail('Boncuğa dokunmak için yanında olmalısın.');
  const r = resolveSave({ extra: saveDice(actor, 'dex'), modifier: actor.saves.dex, dc: z.dc, mode: saveMode('normal', actor, 'dex'),
    autoFail: autoFailsStrDexSave(actor.conditions) }, rollTag(rng, { by: actor.id }));
  const events: BattleEvent[] = [{ type: 'map_note', text: `${actor.name}: parlayan boncuğa dokundu, DEX save ${r.total}/${z.dc} — ${r.success ? 'dayandı' : 'boncuk patlıyor'}` }];
  const caster = state.combatants[z.casterId];
  if (!r.success) {
    if (caster?.concentration?.spell === z.name) events.push({ type: 'concentration_ended', actorId: z.casterId, label: z.name });
    return finish(state, events);
  }
  if (!to) return finish(state, events);
  const { land, hit, hexes } = beadThrowLanding(state, actor, z, to);
  events.push({ type: 'zone_moved', zoneId: z.id, hexes, center: land }, { type: 'map_note', text: `${actor.name} boncuğu fırlattı (${hit ? 'çarptı' : 'indi'}).` });
  if (hit && caster?.concentration?.spell === z.name) events.push({ type: 'concentration_ended', actorId: z.casterId, label: z.name });
  return finish(state, events);
}

/**
 * Fırlatmanın inişi (motor ve arayüz önizlemesi ortak): en çok 40 ft; yaratık altıgenine girerse ya da katı engele çarparsa
 * orada patlar (`hit`). `hexes`: inişteki 20 ft küre (patlarsa etkilenecek altıgenler).
 */
export function beadThrowLanding(state: BattleState, actor: Pick<Combatant, 'id'>, z: SpellZone, to: Offset): { land: Offset; hit: boolean; hexes: Offset[] } {
  const at = centerOf(z);
  const size = sizeOf(state);
  const path = line(at, to).slice(1).filter((h) => distance(at, h) * 5 <= (z.bead?.throwFt ?? 40));
  let land = at;
  let hit = false;
  for (const h of path) {
    const t = terrainAt(state, h);
    if (!isInside(h, size) || t.movement === 'blocked' || t.blocksSight) { hit = true; break; }
    land = h;
    if (occupantAt(state, h, actor.id)) { hit = true; break; }
  }
  return { land, hit, hexes: areaHexes({ shape: 'sphere', sizeFt: 20, origin: 'point', targets: 'all' } as never, land, land, size) };
}

/** Arayüz: yaratığın dokunabileceği (altıgeninde ya da bitişiğinde) boncuklar. */
export const touchableBeads = (state: BattleState, actor: Combatant): SpellZone[] =>
  actor.pos ? beadsOf(state).filter((z) => distance(actor.pos as Offset, centerOf(z)) <= 1) : [];

/** Yapay zekâ: boncuğu en çok düşmanı kapsayan, dost kapsamayan noktaya (en az 2 düşman ya da 20+ HP bir düşman). */
export function beadAim(state: BattleState, actor: Combatant, foes: Combatant[], hexesAround: (c: Offset) => Offset[]): Offset | null {
  let best: { at: Offset; n: number } | null = null;
  for (const f of foes) {
    if (!f.pos) continue;
    const keys = new Set(hexesAround(f.pos).map(hexKey));
    const inside = Object.values(state.combatants).filter((c) => c.hp > 0 && c.pos && keys.has(hexKey(c.pos)));
    if (inside.some((c) => c.side === actor.side || c.civilian)) continue;
    const n = inside.length;
    if ((n >= 2 || f.hp >= 30) && (!best || n > best.n)) best = { at: f.pos, n };
  }
  return best?.at ?? null;
}
