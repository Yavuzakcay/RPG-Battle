/**
 * Kuyruk S2 (kural sürümü 41): el modeli. Elde tutulanlar = savaşçının silah seçeneklerindeki silahlar (silahsız vuruş
 * ve büyü saldırısı hariç) eksi bırakılanlar (`dropped`); Flame Blade bıçağı süren etkinin `held` kaydıyla.
 * - `drop_item` (serbest): silah yere düşer, altıgende `droppedItem` nesnesi olur (saldırı seçenekleri nesnede saklı).
 * - `pick_up`: bitişik ya da aynı altıgendeki yerdeki eşya; turda bir nesne etkileşimi serbest, ikincisi eylem.
 * - Metal: silah ve zırh verisinde `metal` (Heat Metal); canavarda silah adı silah verisiyle eşleşirse o silahın bayrağı.
 * Saf.
 */
import armorData from '../../data/armor.json';
import weaponData from '../../data/weapons.json';
import { isIncapacitated } from '../rules/conditions';
import { distance, hexKey } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import { ruleVersion } from './ruleVersion';
import { genel96On } from './genel96Surum';
import { karar104On } from './karar104Surum';
import { applyEvents } from './reduce';
import { economyCost } from './economy';
import type { BattleEvent, BattleState, Combatant } from './types';

export const handsOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(s) >= 41;

const WEAPONS = weaponData as Array<{ id: string; name: string; metal?: boolean }>;
const METAL_ARMOR = new Set((armorData as Array<{ name: string; metal?: boolean }>).filter((a) => a.metal).map((a) => a.name));

/** Elde tutulan silah kimlikleri (sıralı, tekil). */
export function heldWeapons(c: Combatant): string[] {
  const ids = c.weaponOptions.filter((o) => o.weaponId && o.weaponId !== 'unarmed-strike' && o.weaponId !== 'improvised' && !o.spell).map((o) => o.weaponId as string);
  return [...new Set(ids)].filter((id) => !(c.dropped ?? []).includes(id));
}

const weaponByName = (name: string) => WEAPONS.find((w) => name.toLowerCase().includes(w.name.toLowerCase()));

/** Tutulan metal silahlar (karakterde silah kimliği, canavarda saldırı adı). */
export function heldMetal(c: Combatant): string[] {
  const own = heldWeapons(c).filter((id) => WEAPONS.find((w) => w.id === id)?.metal);
  const monster = c.weaponOptions.length ? [] : c.attacks.filter((a) => !a.ranged || a.reachFt).map((a) => weaponByName(a.name)).filter((w) => w?.metal).map((w) => w?.id as string);
  return [...new Set([...own, ...monster])];
}

/** Metal zırh giyiyor mu (zırh verisinde `metal`; canavarda bilinmez: yok sayılır). */
export const wearsMetal = (c: Combatant): boolean => !!c.metalArmor;
void METAL_ARMOR;

/** Metal bir nesneyle temasta mı (Heat Metal hedefi). */
export const touchesMetal = (c: Combatant): boolean => heldMetal(c).length > 0 || wearsMetal(c);

let dropSeq = 0;
/** Eşya bırakma olayı (komut ya da büyü etkisiyle). Elde değilse boş. */
export function dropEvents(state: BattleState, c: Combatant, item: string, label: string, forced = false): BattleEvent[] {
  if (!heldWeapons(c).includes(item)) return [];
  // Paket `silahBagi`: bağlı silah zorlamayla düşmez (Incapacitated değilken).
  if (forced && (c.bonded ?? []).includes(item) && !isIncapacitated(c.conditions)) return [];
  const options = c.weaponOptions.filter((o) => o.weaponId === item);
  const used = new Set((state.map?.objects ?? []).map((o) => o.id));
  let id = `drop:${c.id}:${item}`;
  for (dropSeq = 1; used.has(id); dropSeq++) id = `drop:${c.id}:${item}:${dropSeq}`;
  return [{ type: 'item_dropped', actorId: c.id, item, label, ...(state.map && c.pos ? { objectId: id, at: c.pos } : {}), options }];
}

export function executeDropItem(state: BattleState, actor: Combatant, item: string): CommandResult {
  if (!handsOn(state)) return fail('Eşya bırakma bu kural sürümünde yok.');
  const evs = dropEvents(state, actor, item, 'bıraktı');
  if (!evs.length) return fail('Bu eşya elinde değil.');
  return finish(state, evs);
}

export function executePickUp(state: BattleState, actor: Combatant, objectId: string): CommandResult {
  if (!handsOn(state)) return fail('Yerden alma bu kural sürümünde yok.');
  const o = state.map?.objects?.find((x) => x.id === objectId);
  if (!o || o.kind !== 'droppedItem' || !o.item) return fail('Yerde alınacak eşya yok.');
  if (!actor.pos || distance(actor.pos, o.at) > 1) return fail('Eşyaya bitişik olmalısın.');
  const extra: BattleEvent[] = [];
  if (actor.economy.interacted) {
    // GENEL96 A33 (sürüm 96+; SRD 5.2.1 s. 13 "If you want to interact with a second object, you need to take the Utilize
    // action"): ikinci etkileşim Utilize maliyet yolundan (Dazed, Slow, Stinking Cloud, Haste ek eylemi, Fast Hands).
    if (genel96On(state)) {
      const cost = economyCost(state, actor, { type: 'object_use', actorId: actor.id, objectId: o.id, action: 'unlock' });
      if (!cost.ok) return fail(`Bu tur nesne etkileşimini kullandın; ikinci etkileşim Utilize ister: ${cost.error}`);
      if (cost.event) extra.push({ ...cost.event, what: 'Eşyayı al (Utilize)' } as BattleEvent);
    } else {
      if (actor.economy.action) return fail('Bu tur nesne etkileşimini kullandın; eylemin de yok.');
      extra.push({ type: 'action_used', actorId: actor.id, kind: 'action', what: 'Eşyayı al' } as BattleEvent);
    }
  }
  return finish(state, [...extra, { type: 'item_picked', actorId: actor.id, objectId: o.id, label: 'yerden aldı' }]);
}

/** Paket `silahBagi`: yerdeki bağlı silahları ele çağır (uzaklık yok; nesne etkileşimi harcamaz). */
export function bondRecallEvents(state: BattleState, c: Combatant, label: string): BattleEvent[] | string {
  if (!handsOn(state)) return 'Silah çağırma bu kural sürümünde yok.';
  const objs = (state.map?.objects ?? []).filter((o) => o.kind === 'droppedItem' && o.item && (c.bonded ?? []).includes(o.item) && (c.dropped ?? []).includes(o.item));
  if (!objs.length) return 'Yerde bağlı silahın yok.';
  return objs.map((o) => ({ type: 'item_picked', actorId: c.id, objectId: o.id, label, bond: true }));
}

/** Yerdeki eşyalar (arayüz ve yapay zekâ). */
export const groundItemsNear = (state: BattleState, c: Combatant) =>
  (state.map?.objects ?? []).filter((o) => o.kind === 'droppedItem' && o.item && c.pos && distance(c.pos, o.at) <= 1);
export { hexKey };

/**
 * Görev KARAR104-KALAN A7 (104+, SRD 5.2.1 s. 191 Unconscious "You drop whatever you're holding"; GENEL-SAVAS B40): komut
 * içinde Unconscious olan (0 HP, Sleep, Knocking Out…) yaratık elindeki silahları altıgenine düşürür (`item_dropped`, bağlı
 * silah da). Yalnız haritalı savaşta (haritasızda yere düşen nesne olmaz, silah kaybolurdu). ⚠ Kalkan (giyilir, `shield_toggle`)
 * ve elde tutulan büyü etkileri (Flame Blade bıçağı, Produce Flame) kapsam dışı. 103: düşürmez.
 */
export function unconsciousDropEvents(before: BattleState, after: BattleState): BattleEvent[] {
  if (!karar104On(after) || !handsOn(after) || !after.map || after.status !== 'active') return [];
  const out: BattleEvent[] = [];
  let cur = after;
  for (const c of Object.values(after.combatants)) {
    if (!c.pos || c.offFloor || !c.conditions.includes('Unconscious') || before.combatants[c.id]?.conditions.includes('Unconscious')) continue;
    for (const item of heldWeapons(c)) {
      const evs = dropEvents(cur, cur.combatants[c.id] as Combatant, item, 'bayıldı, elinden düştü', true);
      if (!evs.length) continue;
      out.push(...evs);
      cur = applyEvents(cur, evs);
    }
  }
  return out;
}

/** Görev KARAR104-KALAN A7 (104+): yapay zekâ kendi düşen silahını bitişikten ya da altıgeninden alır (turda serbest etkileşim). */
export function ownDroppedNear(state: BattleState, c: Combatant): string | null {
  if (!karar104On(state) || !handsOn(state) || !c.pos || c.economy.interacted) return null;
  const o = groundItemsNear(state, c).find((x) => x.id.startsWith(`drop:${c.id}:`) && (c.dropped ?? []).includes(x.item as string));
  return o?.id ?? null;
}

