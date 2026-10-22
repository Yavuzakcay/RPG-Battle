/**
 * Gizlenmenin haritada görünmesi (Adım 10d). Tek cihazda "perde": sırası gelen kim ise ekran
 * onun gözünden çizilir. Oyuncu turunda ekran oyuncunundur (düşmanın gizli jetonu görünmez);
 * düşman ya da masum turunda ve kurulumda ekran GM'indir (oyuncunun gizli jetonu, GM
 * "gizli jetonları göster" anahtarını açmadıkça görünmez). Kendi tarafının gizli jetonu
 * zemine uygun örtü, kapalı göz ve "Gizli (DC n)" etiketiyle yarı saydam çizilir.
 */
import { t } from '../i18n';
import type { Offset } from '../rules/hex';
import { economyBlock, preferBonus } from '../battle/economy';
import { stuckInBog } from '../battle/maprules';
import { HIDE_DC, hideCheck, hideRulesOf, hideSpot, hideSpotBonus } from '../battle/stealth';
import { isUnlit, nightStealth } from '../battle/maprules';
import { TERRAIN } from '../map/terrain';
import type { HideCover } from '../map/maps';
import { terrainAt } from '../battle/movement';
import type { BattleState, Combatant } from '../battle';

export type Viewer = 'party' | 'gm';
export type TokenView = 'normal' | 'hidden-own' | 'hidden-shown' | 'invisible';
export type { HideCover };

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

/** Gizlenen jetonun örtüsü (veri: `data/stealth.json` ve haritanın `hide.cover` alanı); bilinmiyorsa gölge. */
export function hideCover(state: BattleState, at: Offset): HideCover {
  const spot = hideSpot(state, at);
  const covers = hideRulesOf(state).cover;
  return (spot && covers[spot.char]) || covers[terrainAt(state, at).char] || 'shadow';
}

/** Sırası gelen savaşçının bu tur gizlenebileceği altıgenler: kendi altıgeni ve yürüyebildikleri. */
export function hideSpots(state: BattleState, actor: Combatant | undefined, reachable: Iterable<string>): Offset[] {
  return hideZones(state, actor, reachable, false).filter((z) => z.ok).map((z) => z.hex);
}

/**
 * Saklanma bölgeleri (Görev K): haritanın gizlenme yerleri, bu savaşçı için sınıflı. `ok`: bu tur ulaşılabilir ve
 * yanında onu gören düşman yok (vurgulu); öteki yerler (uzak ya da düşmanın gözü önünde) `all` ise soluk.
 */
export function hideZones(state: BattleState, actor: Combatant | undefined, reachable: Iterable<string>, all: boolean): Array<{ hex: Offset; ok: boolean }> {
  if (!actor?.pos || actor.hidden || !state.map) return [];
  const near = new Set([`${actor.pos.col},${actor.pos.row}`, ...reachable]);
  const out: Array<{ hex: Offset; ok: boolean }> = [];
  state.map.tiles.forEach((line, row) => [...line].forEach((_, col) => {
    const hex = { col, row };
    const key = `${col},${row}`;
    if (!all && !near.has(key)) return;
    if (hideSpot(state, hex) === null) return;
    const ok = near.has(key) && hideCheck(state, actor, hex).ok;
    if (ok || all) out.push({ hex, ok });
  }));
  return out;
}

/** Bilgi kutusundaki gizlenme satırı: "Saklanılabilir: evet (çalılık +2)" ya da "hayır (neden)"; gece ve gözcü notu. */
export function hideInfo(state: BattleState, actor: Combatant | undefined, at: Offset): string {
  const V = t().view;
  const spot = hideSpot(state, at);
  const parts: string[] = [];
  if (!spot) {
    parts.push(V.hideNo(V.hideNoCover(terrainAt(state, at).name)));
  } else {
    const what = spot.adjacent ? V.hideBehind(TERRAIN[spot.char]?.name ?? spot.char) : (TERRAIN[spot.char]?.name ?? spot.char);
    const check = actor?.pos && !actor.hidden ? hideCheck(state, actor, at) : null;
    if (check?.reason === 'adjacentEnemy') parts.push(V.hideNo(V.hideAdjacent(state.combatants[check.adjacentId ?? '']?.name ?? '')));
    else {
      parts.push(V.hideYes(what.toLocaleLowerCase(), spot.bonus));
      if (check?.advantage) parts.push(V.hideDark);
      if (check?.watcher && check.dc > HIDE_DC) parts.push(V.hideWatch(check.dc, state.combatants[check.watcher.id]?.name ?? ''));
    }
  }
  if (nightStealth(state) && isUnlit(state, at)) parts.push(V.unlit);
  return parts.join(' · ');
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
  const check = hideCheck(state, actor);
  if (check.reason === 'adjacentEnemy') return V.hideNo(V.hideAdjacent(state.combatants[check.adjacentId ?? '']?.name ?? ''));
  return economyBlock(state, actor, { type: 'hide', actorId: actor.id, bonus: preferBonus(actor, 'hide') });
}

/** Ortaya çıkma efektinin türü: yaprak (orman, çalılık) ya da toz. */
export function revealPuff(state: BattleState, at: Offset): 'leaves' | 'dust' {
  return hideCover(state, at) === 'leaves' ? 'leaves' : 'dust';
}
