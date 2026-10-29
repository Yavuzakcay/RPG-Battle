/**
 * Işınlanma (Görev S1): büyü ya da yetenekle konum değiştirme. Komut → `teleported` olayı → reducer (yalnızca `pos`);
 * yürüme olmadığı için fırsat saldırısı ve zemin girişi tetiklenmez, sıra, konsantrasyon ve eylem ekonomisi korunur.
 * Hedef altıgen: harita içi, geçilebilir, boş, menzil içinde; görüş gerekiyorsa görüş hattı açık ve (karanlıkta)
 * görülebilir. Saf.
 */
import { distance, type Offset } from '../rules/hex';
import { sightBlockedBetween } from './cover';
import { canSee } from './maprules';
import { hexLabel, occupantAt, placeProblem } from './movement';
import type { BattleEvent, BattleState, Combatant } from './types';

export interface TeleportSpec { rangeFt: number; sight: boolean }

/** Hedef altıgen sorunu (yoksa null). */
export function teleportProblem(state: BattleState, actor: Combatant, to: Offset, spec: TeleportSpec): string | null {
  if (!state.map || !actor.pos) return 'Işınlanma yalnızca haritalı savaşta.';
  const why = placeProblem(state, to);
  if (why) return why;
  if (to.col === actor.pos.col && to.row === actor.pos.row) return 'Zaten oradasın.';
  const d = distance(actor.pos, to);
  if (d * 5 > spec.rangeFt) return `${hexLabel(to)} menzil dışında (en çok ${spec.rangeFt} ft).`;
  const other = occupantAt(state, to, actor.id);
  if (other) return `${hexLabel(to)} dolu (${other.name}).`;
  if (spec.sight) {
    const wall = sightBlockedBetween(state, actor.pos, to);
    if (wall) return `${hexLabel(to)} görülmüyor (${wall}).`;
    if (!canSee(state, actor, { ...actor, pos: to })) return `${hexLabel(to)} karanlıkta, görülmüyor.`;
  }
  return null;
}

/** Işınlanılabilecek altıgenler (arayüz önizlemesi ve yapay zekâ). */
export function teleportHexes(state: BattleState, actor: Combatant, spec: TeleportSpec): Offset[] {
  if (!state.map || !actor.pos) return [];
  const out: Offset[] = [];
  const rows = state.map.tiles.length, cols = state.map.tiles[0]?.length ?? 0;
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    if (teleportProblem(state, actor, { col, row }, spec) === null) out.push({ col, row });
  }
  return out;
}

export const teleportEvent = (actor: Combatant, to: Offset, label: string): BattleEvent =>
  ({ type: 'teleported', actorId: actor.id, from: actor.pos as Offset, to, label });
