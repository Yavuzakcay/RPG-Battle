/**
 * Görev WS92 (kural sürümü 92): yutma (Swallow) SRD 5.2.1 uyumunun saf yardımcıları. Yutulan midede: konumu yutanınki
 * (reducer `syncSwallowed`), hücre kaplamaz ve dışarıdan hedef alınmaz (`common.ts` `isTargetable`), içeriden yalnız yutanı
 * görür (`cover.ts` `lineOfFire`). Mideden çıkınca (kusma, kaçış, ceset, biçim sonu) dolu altıgendeyse en yakın boş bitişik
 * altıgene konur. İşaret (`swallow.inside`) yalnız 92+ yutmada yazılır; 91 ve altı kayıtta hiçbiri işlemez.
 */
import { neighbors, ring, sameHex, type Offset } from '../rules/hex';
import { occupantAt, placeProblem } from './movement';
import { ws92On } from './ws92Surum';
import type { ActiveEffect, BattleState, Combatant } from './types';

/** Midedeki yaratığın yutma etkisi (92+). */
export const insideEffect = (c: Pick<Combatant, 'effects'> | undefined): ActiveEffect | undefined =>
  c?.effects?.find((e) => !!e.swallowedBy && !!e.swallow?.inside);

/** Yutanın midesindeki (canlı ya da değil) yaratıklar. */
export function swallowedIn(state: Pick<BattleState, 'combatants'>, byId: string): Combatant[] {
  return Object.values(state.combatants).filter((c) => insideEffect(c)?.swallowedBy === byId);
}

/**
 * Total Cover (SRD "against attacks and other effects outside"): içerideki yalnız yutanını hedef alabilir; dışarıdan
 * içerideki hedef alınamaz. Engel yoksa false.
 */
export function insideBlocks(attacker: Pick<Combatant, 'id' | 'effects'>, target: Pick<Combatant, 'id' | 'effects'>): boolean {
  const a = insideEffect(attacker);
  if (a) return a.swallowedBy !== target.id;
  return !!insideEffect(target);
}

/** Yutan, midesinde yaratık varken bu saldırıyı kullanamaz (Giant Frog/Toad: "can't use Bite"). Sorun metni ya da null. */
export function swallowBlockedAttack(state: BattleState, actor: Combatant, attackName: string | undefined): string | null {
  if (!attackName || !ws92On(state)) return null;
  const base = attackName.replace(/ \(.*\)$/, '');
  for (const o of Object.values(state.combatants)) {
    const e = o.effects?.find((x) => x.swallowedBy === actor.id && x.swallow?.inside && !x.swallow.corpse);
    if (e?.swallow?.blocks?.some((b) => b === base || b === attackName)) return `${base}: ${o.name} midedeyken kullanılamaz.`;
  }
  return null;
}

/** Mideden çıkan için en yakın boş altıgen (önce bitişikler, satır/sütun sırasıyla; deterministik). */
function freeSpot(state: BattleState, center: Offset, who: Combatant): Offset | null {
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  if (!size.cols) return null;
  const fits = (h: Offset) => !placeProblem(state, h, who) && !occupantAt(state, h, who.id);
  const order = (a: Offset, b: Offset) => a.row - b.row || a.col - b.col;
  const near = neighbors(center, size).sort(order).find(fits);
  if (near) return near;
  for (let r = 2; r <= Math.max(size.cols, size.rows); r++) {
    const spot = ring(center, r, size).sort(order).find(fits);
    if (spot) return spot;
  }
  return null;
}

/**
 * Reducer sonu (92+ işaretiyle): midedekinin konumu yutanınki; mideden yeni çıkan dolu bir altıgendeyse en yakın boş
 * altıgene. Etkisi olmayan durumda aynı nesne.
 */
export function syncSwallowed(state: BattleState, prev: BattleState): BattleState {
  let next = state;
  for (const c of Object.values(state.combatants)) {
    const e = insideEffect(c);
    if (e) {
      const by = next.combatants[e.swallowedBy as string];
      if (by?.pos && (!c.pos || !sameHex(c.pos, by.pos))) next = { ...next, combatants: { ...next.combatants, [c.id]: { ...c, pos: by.pos } } };
      continue;
    }
    if (!c.pos || !state.map || !insideEffect(prev.combatants[c.id])) continue;
    if (!occupantAt(next, c.pos, c.id)) continue;
    const spot = freeSpot(next, c.pos, c);
    if (spot) next = { ...next, combatants: { ...next.combatants, [c.id]: { ...(next.combatants[c.id] as Combatant), pos: spot } } };
  }
  return next;
}
