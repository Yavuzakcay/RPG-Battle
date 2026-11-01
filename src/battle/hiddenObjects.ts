/**
 * Kuyruk 30 D1: gizli (keşif) nesneler. Harita JSON'unda nesnede `gizli: true` (isteğe bağlı `bulDc`, `flag`). Game
 * Master anahtarı `hiddenObjects` (global, kural sürümü 10, varsayılan açık): açıkken bulunmamış gizli nesne oyuncu
 * görünümünde çizilmez, bilgi kutusunda yazmaz ve yalnızca Game Master onunla etkileşir. Bulma: bir parti üyesi nesnenin
 * 1 altıgen komşusuna girer (ya da turunu orada başlatır) ya da turunun başında `radius` altıgen içindeyken pasif Algısı
 * (10 + Algı) nesnenin DC'sini (varsayılan `dc` 12) geçer. Uçanlar da bulur. Bulununca `object_changed { found }`;
 * nesnede `flag` varsa keşif bayrağı (`map_note.flag` → `BattleState.flags`). Kapalıyken ya da eski savaşta eski davranış.
 * Saf.
 */
import { distance, type Offset } from '../rules/hex';
import { globalRule } from './ruleControl';
import { skillBonus } from '../rules/skills';
import { objectAt } from './objectData';
import { terrainAt } from './movement';
import { terrainOf } from '../map/terrain';
import type { BattleEvent, BattleState, Combatant, MapObject } from './types';

const num = (v: unknown, d: number): number => (typeof v === 'number' ? v : d);

/** Gizli nesne kuralı bu savaşta etkin mi. */
export const hiddenObjectsActive = (state: Pick<BattleState, 'map' | 'kuralSurumu'>): boolean => !!globalRule(state, 'hiddenObjects');

/** Nesne şu an oyunculardan saklı mı (gizli, bulunmamış, kural etkin). */
export const concealed = (state: Pick<BattleState, 'map' | 'kuralSurumu'>, o: MapObject): boolean =>
  !!o.gizli && !o.found && hiddenObjectsActive(state);

const seeker = (c: Combatant) => c.side === 'party' && !c.civilian && c.hp > 0 && !c.summon?.gone;

function foundEvents(state: BattleState, c: Combatant, o: MapObject, how: string): BattleEvent[] {
  const out: BattleEvent[] = [{ type: 'object_changed', objectId: o.id, found: true, label: `${c.name} ${how}` }];
  if (o.flag && !(state.flags ?? []).includes(o.flag)) out.push({ type: 'map_note', text: `${c.name} gizli bir şey buldu.`, flag: o.flag });
  return out;
}

/** Parti üyesi `at` altıgenine girdi: komşudaki gizli nesneler bulunur. */
export function discoverOnEnter(state: BattleState, c: Combatant, at: Offset): BattleEvent[] {
  if (!seeker(c) || !hiddenObjectsActive(state)) return [];
  return (state.map?.objects ?? []).filter((o) => concealed(state, o) && distance(o.at, at) <= 1)
    .flatMap((o) => foundEvents(state, c, o, 'gizli nesneyi fark etti (yanında).'));
}

/** Tur başı: komşudaki ya da `radius` içinde pasif Algıyla fark edilen gizli nesneler. */
export function discoverOnTurnStart(state: BattleState, c: Combatant): BattleEvent[] {
  const r = globalRule(state, 'hiddenObjects');
  if (!r || !seeker(c) || !c.pos) return [];
  const passive = 10 + skillBonus(c, 'perception');
  const out: BattleEvent[] = [];
  for (const o of state.map?.objects ?? []) {
    if (!concealed(state, o)) continue;
    const d = distance(o.at, c.pos);
    if (d <= 1) out.push(...foundEvents(state, c, o, 'gizli nesneyi fark etti (yanında).'));
    else if (d <= num(r.radius, 3) && passive >= (o.findDc ?? num(r.dc, 12))) out.push(...foundEvents(state, c, o, `gizli nesneyi fark etti (pasif Algı ${passive}).`));
  }
  return out;
}

/** Arayüz: nesne çizilir mi (oyuncu görünümünde bulunmamış gizli nesne yok; Game Master görünümünde soluk). */
export function objectShown(state: Pick<BattleState, 'map' | 'kuralSurumu'>, o: MapObject, gmView: boolean): 'shown' | 'faded' | 'none' {
  if (!concealed(state, o)) return 'shown';
  return gmView ? 'faded' : 'none';
}

/** Arayüzde gösterilecek zemin adı: bulunmamış gizli nesnenin altıgeninde nesne adı yerine zeminin kendi adı. */
export function shownTerrainName(state: BattleState, at: Offset): string {
  const ob = objectAt(state, at);
  if (ob && concealed(state, ob)) return terrainOf(state.map?.tiles[at.row]?.[at.col] ?? '#').name;
  return terrainAt(state, at).name;
}
