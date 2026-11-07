/**
 * Kuyruk K53 S4: geçici engel (GM anahtarı `tempBarriers`, kural sürümü 24). Engel bir büyü alanıdır (`SpellZone.barrier`):
 * altıgenler, süre (`until`), hareketi/görüşü keser mi, HP/AC (Wall of Stone panel düzeniyle altıgen başına), kim geçer
 * (`passFor`), sahibi. Türler `data/engeller.json` (Wizard "Çizili Duvar" gibi özellikler veriden). Mevcut duvarlar
 * (Wall of Stone/Force: `zone.solid`; Wind Wall: `windWall`) aynı okuma yolundan görünür (`barrierOf`); davranışları
 * eski kod yolunda aynen kalır. Yol bulma `zoneMoveCost` üstünden engeli görür; süre dolunca alan biter (`pruneZones`).
 */
import data from '../../data/engeller.json';
import { spells } from '../data';
import { globalRule } from './ruleControl';
import { ruleVersion } from './ruleVersion';
import { occupantAt } from './movement';
import { MOTION_VERSION } from './motion';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, SpellZone } from './types';

export interface BarrierSpec {
  kind: string;
  name?: string;
  blocksMove: boolean;
  blocksSight: boolean;
  hp?: number;
  ac?: number;
  passFor?: 'none' | 'allies' | 'owner';
  /** Yalnız eski Wind Wall için bilgi: küçük uçanı ve menzilli saldırıyı keser. */
  windWall?: boolean;
}
export const BARRIER_KINDS = data.kinds as Record<string, Omit<BarrierSpec, 'kind'> & { tr: string; en: string; rounds: number }>;

/** Yeni engeller çalışıyor mu (sürüm 24+, GM anahtarı). */
export const barriersOn = (s: BattleState): boolean => ruleVersion(s) >= MOTION_VERSION && !!globalRule(s, 'tempBarriers');

const same = (a: Offset, b: Offset) => a.col === b.col && a.row === b.row;

/** Alanın engel okuması: yeni engel (`barrier`), eski katı duvar (Wall of Stone/Force) ya da Wind Wall; değilse null. */
export function barrierOf(state: BattleState, z: SpellZone): BarrierSpec | null {
  if (z.barrier) return barriersOn(state) ? z.barrier : null;
  const zs = z.spec ?? spells.find((s) => s.id === z.spellId)?.mechanics.zone;
  if (zs?.solid) return { kind: 'solid', name: z.name, blocksMove: true, blocksSight: !(zs.transparent && globalRule(state, 'spellsK19')), ...(zs.panels ? { hp: zs.panelHp ?? 90, ac: zs.panelAc ?? 15 } : {}), passFor: 'none' };
  if (zs?.windWall) return { kind: 'windWall', name: z.name, blocksMove: false, blocksSight: false, windWall: true, passFor: 'none' };
  return null;
}

/** Bu altıgende herkese kapalı yeni engel (terrainAt için); yoksa null. */
export function solidBarrierAt(state: BattleState, h: Offset): { name: string; blocksSight: boolean } | null {
  if (!barriersOn(state)) return null;
  for (const z of state.map?.zones ?? []) {
    if (!z.barrier || !z.barrier.blocksMove || (z.barrier.passFor ?? 'none') !== 'none') continue;
    if (z.hexes.some((x) => same(x, h))) return { name: z.name, blocksSight: z.barrier.blocksSight };
  }
  return null;
}

/** Yürüyen yaratık bu engelden geçer mi. */
export function passesBarrier(z: SpellZone, mover: Combatant): boolean {
  const p = z.barrier?.passFor ?? 'none';
  return p === 'allies' ? mover.side === z.side : p === 'owner' ? mover.id === z.casterId : false;
}

/**
 * Engel yarat: dolu altıgen atlanır (üstünde yaratık olan altıgen engel olmaz). Olay `zone_created`; süre `rounds` tur.
 * Kapalıysa ya da tür yoksa olay yok.
 */
export function barrierEvents(state: BattleState, owner: Combatant, kind: string, hexes: Offset[], rounds?: number): BattleEvent[] {
  const def = BARRIER_KINDS[kind];
  if (!def || !barriersOn(state)) return [];
  const free = hexes.filter((h) => !occupantAt(state, h));
  if (!free.length) return [];
  const { tr, en: _en, rounds: r0, ...spec } = def;
  const zone: SpellZone = {
    id: `engel-${kind}-${state.round}-${state.turnIndex}-${(state.map?.zones ?? []).length}-${free[0]!.col},${free[0]!.row}`, spellId: `barrier:${kind}`, name: tr, casterId: owner.id, side: owner.side, dc: 0, slotLevel: 0,
    hexes: free, until: state.round + (rounds ?? r0), barrier: { kind, ...spec },
  };
  return [{ type: 'zone_created', zone }];
}
