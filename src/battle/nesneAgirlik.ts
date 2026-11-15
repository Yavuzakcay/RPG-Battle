/**
 * Kuyruk KQ3 NA1 (kural sürümü 80): nesne ağırlığı ve taşıma. Mevcut yolları genişletir (`object_use` `take`/`put`, nesne
 * hareketi, `retrieve` hedefi); ikinci mekanizma yok. Saf.
 * - Ağırlık: nesne verisinde `agirlikLb`, haritadaki nesnede ve Game Master komutunda ezilir (`MapObject.agirlikLb`).
 * - Kapasite: savaşçıda `carryCapLb` (STR × 15 × boyut; Powerful Build karakter oluşturulurken), yoksa `strScore` × 15 × boyut çarpanı;
 *   kendi yükü `carryUsedLb`, taşıdığı nesnelerin payı eklenir. Sınır yalnız `BattleState.tasima` kapalı değilken.
 * - Birden çok taşıyıcı: `take` bitişik dostları kendiliğinden (sırayla en boşu) toplar; ağırlık paylaşılır, hepsinin hızı yarıya
 *   (`Combatant.groupCarry`). Taşıyan düşer/Incapacitated/Prone olursa taşıyıcı listesinden çıkar; kalanlar yetmezse nesne düşer.
 */
import data from '../../data/nesne-agirlik.json';
import tasima from '../../data/tasima.json';
import { isIncapacitated } from '../rules/conditions';
import { distance } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import { OBJECTS } from './objectData';
import { nesneOn } from './nesneSurum';
import type { BattleEvent, BattleState, Combatant, MapObject } from './types';

export const AGIRLIK = data;
export { nesneOn };

export type WeightClass = 'hafif' | 'orta' | 'agir';

/** Nesnenin ağırlığı (lb): ezme, yoksa veri, yoksa 0. */
export const objectWeightLb = (o: Pick<MapObject, 'kind' | 'agirlikLb'>): number => o.agirlikLb ?? OBJECTS[o.kind]?.agirlikLb ?? 0;

/** Ağırlık sınıfı (itme çarpanı): veriden eşikler. */
export const weightClassOf = (lb: number): WeightClass => (lb <= data.sinif.hafifEnFazlaLb ? 'hafif' : lb <= data.sinif.ortaEnFazlaLb ? 'orta' : 'agir');

/** Fırlatma menzili (ft) ağırlığa göre; en ağır basamağın üstü fırlatılamaz (0). */
export const throwRangeByWeight = (lb: number): number => data.firlatma.find((b) => lb <= b.enFazlaLb)?.ft ?? 0;

const sizeMult = (size: string | undefined): number => (tasima.sizeCarry as Record<string, number>)[size ?? 'M'] ?? 1;

/** Toplam taşıma kapasitesi (lb). */
export const capacityOf = (c: Combatant): number => c.carryCapLb ?? c.strScore * tasima.capacityPerStr * sizeMult(c.size);
/** İtme/sürükleme/kaldırma sınırı (lb; STR × 30). */
export const dragLimitOf = (c: Combatant): number => c.strScore * tasima.dragPerStr * sizeMult(c.size);

export const carriersOf = (o: MapObject): string[] => (o.carriedBy ? [o.carriedBy, ...(o.carriers ?? [])] : []);

/** Savaşçının şimdiki yükü (lb): kendi eşyası + taşıdığı nesnelerin payı (`except`: sayılmayacak nesne). */
export function usedOf(state: BattleState, c: Combatant, except?: string): number {
  let used = c.carryUsedLb ?? 0;
  for (const o of state.map?.objects ?? []) {
    if (o.id === except) continue;
    const ids = carriersOf(o);
    if (ids.includes(c.id)) used += objectWeightLb(o) / ids.length;
  }
  return used;
}

export const freeOf = (state: BattleState, c: Combatant, except?: string): number => Math.max(0, capacityOf(c) - usedOf(state, c, except));

/** Ağırlık sınırı bu savaşta işliyor mu (sürüm 80+ ve Taşıma yükü oda kuralı kapalı değil). */
export const limitsOn = (s: BattleState): boolean => nesneOn(s) && (s.tasima ?? 'off') !== 'off';

const canCarry = (c: Combatant): boolean => c.hp > 0 && !c.civilian && !c.summon && !isIncapacitated(c.conditions) && !c.conditions.includes('Prone');

/** Kaç kişi gerekir (en az): ağırlık / (en güçlü boş kapasite). */
export const peopleNeeded = (lb: number, perPerson: number): number => Math.max(1, Math.ceil(lb / Math.max(1, perPerson)));

/**
 * Nesneyi alma planı: ağırlık tek başına kapasitedeyse yalnız `actor`; değilse nesneye ve `actor`a bitişik (en çok `taserSayisiEn`)
 * kullanılabilir dostlar sırayla en boş kapasiteden eklenir. Yetmezse neden (kaç kişi gerekir, yanında kaç kişi var).
 */
export function liftPlan(state: BattleState, actor: Combatant, obj: MapObject): { helpers: string[] } | { problem: string } {
  if (!limitsOn(state)) return { helpers: [] };
  const w = objectWeightLb(obj);
  const mine = freeOf(state, actor, obj.id);
  if (w <= mine) return { helpers: [] };
  const near = Object.values(state.combatants)
    .filter((c) => c.id !== actor.id && c.side === actor.side && canCarry(c) && c.pos && actor.pos && obj.at && distance(c.pos, obj.at) <= 1 && distance(c.pos, actor.pos) <= 1)
    .sort((a, b) => freeOf(state, b, obj.id) - freeOf(state, a, obj.id));
  const helpers: string[] = [];
  let sum = mine;
  for (const c of near) {
    if (sum >= w || helpers.length + 1 >= data.taserSayisiEn) break;
    helpers.push(c.id); sum += freeOf(state, c, obj.id);
  }
  if (sum >= w) return { helpers };
  const best = Math.max(mine, ...near.map((c) => freeOf(state, c, obj.id)));
  return { problem: `Çok ağır: ${Math.round(w * 10) / 10} lb, senin boş kapasiten ${Math.round(mine)} lb. ${peopleNeeded(w, best)} kişi gerekir (bitişik yardım edebilecek: ${near.length}).` };
}

/** Bırakma (`put`): taşıyıcıdan çıkar; son taşıyıcı bırakırsa nesne altıgenine düşer. Kalanlar yetmiyorsa komut sonu temizliği düşürür. */
export function putEvents(state: BattleState, actor: Combatant, obj: MapObject): BattleEvent[] | string {
  const ids = carriersOf(obj);
  if (!ids.includes(actor.id) || !actor.pos) return 'Nesneyi taşımıyorsun.';
  const rest = ids.filter((x) => x !== actor.id);
  const name = OBJECTS[obj.kind].tr;
  if (!rest.length) return [{ type: 'object_changed', objectId: obj.id, carriedBy: null, at: actor.pos, label: `${actor.name}: ${name} bırakıldı` }];
  return [{ type: 'object_changed', objectId: obj.id, carriedBy: rest[0] as string, carriers: rest.length > 1 ? rest.slice(1) : null, label: `${actor.name}: ${name} bırakıldı (yük paylaşılıyordu)` }];
}

/**
 * Komut sonu temizliği (sürüm 80+): taşıyıcılardan düşen (öldü, kayboldu, Incapacitated, Prone) çıkar; kalanların kapasitesi
 * yetmiyorsa ya da kimse kalmadıysa nesne taşıyanın yerine düşer; yetiyorsa ilk kalan asıl taşıyıcı olur.
 */
export function carryCleanupEvents(state: BattleState): BattleEvent[] {
  if (!nesneOn(state)) return [];
  const out: BattleEvent[] = [];
  for (const o of state.map?.objects ?? []) {
    const ids = carriersOf(o);
    if (!ids.length) continue;
    const alive = ids.filter((id) => { const c = state.combatants[id]; return !!c && canCarry(c) && !c.summon?.gone; });
    const w = objectWeightLb(o);
    const group = alive.map((id) => state.combatants[id] as Combatant);
    const enough = !limitsOn(state) || group.reduce((n, c) => n + freeOf(state, c, o.id), 0) >= w;
    const first = state.combatants[ids[0] as string];
    if (alive.length === ids.length && enough) continue;
    const name = OBJECTS[o.kind]?.tr ?? o.kind;
    if (!alive.length || !enough) {
      const at = first?.pos ?? o.at;
      out.push({ type: 'object_changed', objectId: o.id, carriedBy: null, at, label: `${first?.name ?? '?'}: ${name} yere düştü` });
    } else {
      out.push({ type: 'object_changed', objectId: o.id, carriedBy: alive[0] as string, carriers: alive.length > 1 ? alive.slice(1) : null, label: `${name}: taşıyıcı çıktı, yük kalanlarda` });
    }
  }
  return out;
}

/** Game Master ağırlık komutu (kurulumda ve savaşta; günlüğe yazılır, replay aynı). */
export function executeSetObjectWeight(state: BattleState, cmd: { objectId: string; lb: number | null }, isGm: boolean): CommandResult {
  if (!isGm) return fail('Nesnenin ağırlığını yalnızca Game Master değiştirir.');
  if (!nesneOn(state)) return fail('Nesne ağırlığı bu kural sürümünde yok.');
  const o = state.map?.objects?.find((x) => x.id === cmd.objectId);
  if (!o) return fail('Nesne yok.');
  if (cmd.lb !== null && !(Number.isFinite(cmd.lb) && cmd.lb >= data.minLb && cmd.lb <= data.maxLb)) return fail(`Ağırlık ${data.minLb}–${data.maxLb} lb olmalı.`);
  const before = objectWeightLb(o);
  const after = cmd.lb ?? OBJECTS[o.kind]?.agirlikLb ?? 0;
  return finish(state, [{ type: 'object_changed', objectId: o.id, agirlikLb: cmd.lb, label: `${OBJECTS[o.kind]?.tr ?? o.kind}: ağırlık ${before} → ${after} lb${cmd.lb === null ? ' (varsayılan)' : ''}` }]);
}
