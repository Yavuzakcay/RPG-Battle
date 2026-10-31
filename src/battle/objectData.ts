/**
 * Görev S2: nesne verisi ve etkin zemin (saf, döngüsüz: `movement.ts` `terrainAt` buradan okur). Nesne altıgenin
 * zeminini değiştirir: hareket (normal/zorlu/engel), örtü (yarım/3/4) ve görüş kesme; kapı ve masa duruma göre.
 * Böylece hareket, örtü, görüş ve yapay zekâ tek yerden etkilenir.
 */
import data from '../../data/nesneler.json';
import type { TerrainType } from '../map/terrain';
import type { BattleState, MapObject, ObjectKind, ObjectState } from './types';
import type { Offset } from '../rules/hex';

interface ObjectTerrain { movement: 'normal' | 'difficult' | 'blocked'; cover: 0 | 2 | 5; blocksSight: boolean }
export interface ObjectDef {
  tr: string; en: string; ac: number; hp: number; material: string; size: string; icon: string; aiRisk: number;
  flammable?: boolean; carryable?: boolean; door?: boolean; explodes?: boolean; ignites?: boolean; onBreak?: 'oil' | 'fire'; defaultState?: ObjectState;
  terrain: ObjectTerrain; states?: Partial<Record<ObjectState, ObjectTerrain>>;
}
export const OBJECTS = data.kinds as unknown as Record<ObjectKind, ObjectDef>;
export const OBJECT_KINDS = Object.keys(OBJECTS) as ObjectKind[];
export const OBJECT_DATA = data as unknown as {
  oilSpill: number; lockDc: number;
  keg: { save: 'dex'; dc: number; damage: string; damageType: string; radiusHexes: number; half: boolean; srd: string };
};

const key = (h: Offset) => `${h.col},${h.row}`;

/** Altıgendeki nesne (yoksa undefined). */
export function objectAt(state: Pick<BattleState, 'map'>, h: Offset): MapObject | undefined {
  const list = state.map?.objects;
  if (!list?.length) return undefined;
  const k = key(h);
  return list.find((o) => !o.carriedBy && key(o.at) === k);
}

/** Zeminin nesneyle birleşik hâli: hareket ve görüş nesneden, örtü ikisinin büyüğü; ad nesnenin. */
export function withObject(t: TerrainType, o: MapObject): TerrainType {
  const def = OBJECTS[o.kind];
  if (!def) return t;
  const ot = (o.state && def.states?.[o.state]) || def.terrain;
  const movement = ot.movement === 'blocked' || t.movement === 'blocked' ? 'blocked'
    : t.movement === 'deadly' ? 'deadly' : ot.movement === 'difficult' || t.movement === 'difficult' ? 'difficult' : t.movement;
  return { ...t, name: def.tr, movement, cover: Math.max(t.cover, ot.cover) as TerrainType['cover'], blocksSight: !!(t.blocksSight || ot.blocksSight) };
}
