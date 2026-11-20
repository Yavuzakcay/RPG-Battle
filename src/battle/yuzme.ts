/** KQ6-8: yüzme hızı verisi (`data/yuzme-hizi.json`, canavar kimliği → ft) ve su zemini sorguları. Saf. */
import data from '../../data/yuzme-hizi.json';
import { terrainOf } from '../map/terrain';
import { SWIM_TILES } from './yuzmeSurum';
import type { BattleState, Combatant } from './types';

const HIZ = data.hiz as Record<string, number | null>;
/** Canavarın yüzme hızı (ft); yüzücü değilse ya da bilinmiyorsa undefined. */
export const swimSpeedOf = (monsterId: string | undefined): number | undefined => (monsterId ? HIZ[monsterId] ?? undefined : undefined);
/** Yüzücü canavar mı (yüzme hızı veride). */
export const isSwimmer = (c: Pick<Combatant, 'swimFt'>): boolean => (c.swimFt ?? 0) > 0;
/** Zemin harfi yüzülebilir su mu. */
export const swimTile = (ch: string | undefined): boolean => !!ch && SWIM_TILES.has(ch) && terrainOf(ch).movement !== 'blocked';
/** Altıgen su mu (haritasız ya da dışarıda: false). */
export const waterHexAt = (state: Pick<BattleState, 'map'>, h: { col: number; row: number }): boolean => swimTile(state.map?.tiles[h.row]?.[h.col]);
