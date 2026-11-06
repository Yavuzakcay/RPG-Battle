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
    if (actor.economy.action) return fail('Bu tur nesne etkileşimini kullandın; eylemin de yok.');
    extra.push({ type: 'action_used', actorId: actor.id, kind: 'action', what: 'Eşyayı al' } as BattleEvent);
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
