/**
 * Gizlenmenin haritada görünmesi (Adım 10d). Tek cihazda "perde": sırası gelen kim ise ekran
 * onun gözünden çizilir. Oyuncu turunda ekran oyuncunundur (düşmanın gizli jetonu görünmez);
 * düşman ya da masum turunda ve kurulumda ekran GM'indir (oyuncunun gizli jetonu, GM
 * "gizli jetonları göster" anahtarını açmadıkça görünmez). Kendi tarafının gizli jetonu
 * zemine uygun örtü, kapalı göz ve "Gizli (DC n)" etiketiyle yarı saydam çizilir.
 */
import { t } from '../i18n';
import { neighbors, type Offset } from '../rules/hex';
import { getMap } from '../map/maps';
import { economyBlock, preferBonus } from '../battle/economy';
import { stuckInBog } from '../battle/maprules';
import { hideSpotBonus } from '../battle/stealth';
import { terrainAt } from '../battle/movement';
import type { BattleState, Combatant } from '../battle';

export type Viewer = 'party' | 'gm';
export type TokenView = 'normal' | 'hidden-own' | 'hidden-shown' | 'invisible';
export type HideCover = 'sand' | 'leaves' | 'shadow';

/** Ekranın kimin gözünden çizildiği: oyuncu karakterinin turunda oyuncu, yoksa GM. */
export function viewerOf(state: BattleState): Viewer {
  const id = state.order[state.turnIndex];
  const c = id ? state.combatants[id] : undefined;
  return state.status === 'active' && c && c.side === 'party' && !c.civilian ? 'party' : 'gm';
}

/** Jeton bu ekranda nasıl çizilir. */
export function tokenView(state: BattleState, c: Combatant, showHiddenToGm: boolean): TokenView {
  if (!c.hidden) return 'normal';
  const viewer = viewerOf(state);
  const own = viewer === 'party' ? c.side === 'party' : c.side === 'enemies' || c.civilian;
  if (own) return 'hidden-own';
  return viewer === 'gm' && showHiddenToGm ? 'hidden-shown' : 'invisible';
}

/** Gizlenen jetonun örtüsü: kumda kum yığını, çalılıkta ve ağaç dibinde yaprak, başka yerde gölge. */
export function hideCover(state: BattleState, at: Offset): HideCover {
  const t = terrainAt(state, at);
  if (t.char === 'g' || t.char === 'a') return 'leaves';
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  if (neighbors(at, size).some((h) => terrainAt(state, h).char === 'a')) return 'leaves';
  if (t.char === 'd' || (state.map && getMap(state.map.id).hideTerrain[t.char] !== undefined)) return 'sand';
  return 'shadow';
}

/** Sırası gelen savaşçının bu tur gizlenebileceği altıgenler: kendi altıgeni ve yürüyebildikleri. */
export function hideSpots(state: BattleState, actor: Combatant | undefined, reachable: Iterable<string>): Offset[] {
  if (!actor?.pos || actor.hidden || !state.map) return [];
  const keys = new Set([`${actor.pos.col},${actor.pos.row}`, ...reachable]);
  const out: Offset[] = [];
  for (const k of keys) {
    const [col, row] = k.split(',').map(Number) as [number, number];
    if (hideSpotBonus(state, { col, row }) !== null) out.push({ col, row });
  }
  return out;
}

/** Gizlen düğmesi neden kapalı; açıksa null. */
export function hideBlockReason(state: BattleState, actor: Combatant): string | null {
  const V = t().view;
  if (!state.map || !actor.pos) return V.noHideMapless;
  if (actor.hidden) return V.alreadyHidden(actor.hidden.dc);
  if (stuckInBog(state, actor)) return V.stuck;
  if (hideSpotBonus(state, actor.pos) === null) {
    return V.noHideHere(terrainAt(state, actor.pos).name);
  }
  return economyBlock(state, actor, { type: 'hide', actorId: actor.id, bonus: preferBonus(actor, 'hide') });
}

/** Ortaya çıkma efektinin türü: yaprak (orman, çalılık) ya da toz. */
export function revealPuff(state: BattleState, at: Offset): 'leaves' | 'dust' {
  return hideCover(state, at) === 'leaves' ? 'leaves' : 'dust';
}
