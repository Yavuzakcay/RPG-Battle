/**
 * Kuyruk 21 D2b: yürüyen merdiven (zemin `Y`, ev kuralı; SRD'de karşılığı yok).
 * - Varyant kuralı `{ id: 'conveyor', flow: 'S', leverId?: 'kol' }`: basamaklar `flow` yönüne akar (yön adları
 *   flat-top: N, NE, SE, S, SW, NW).
 * - Yokuş yukarı adım: `Y` altıgenine akışa karşı (karşı yön ya da onun iki yanı) atılan adım. Adımı atan bir altıgen
 *   geri kayar (akış yönündeki komşuya; orası girilemez ya da doluysa geldiği altıgene) ve yürüyüşü biter: yukarı
 *   ilerlenemez. Uçan (havadaki) yaratık ve ışınlanma muaf; atlayışın iniş altıgeni `Y` ise iniş de kayar.
 * - Yol bulma yokuş yukarı kenarı geçilmez sayar (`conveyorBlocks`): yapay zekâ ve oyuncunun çok adımlı yolu yukarı
 *   kenarı "ilerleme" saymaz, uzun yolu seçer. Oyuncu doğrudan bitişik yukarı basamağa adım atarsa kayar.
 * - Kol (`lever` nesnesi, `leverId`): çekilince (`tipped`) merdiven durur; durmuş merdiven sıradan basamaktır.
 * Kayma `pushed` olayıdır (`by: 'conveyor'`), yeni olay türü yok (kayıt sürümü aynı).
 */
import { AXIAL_DIRECTIONS, addAxial, axialToOffset, directionTo, hexKey, isInside, offsetToAxial, type Offset } from '../rules/hex';
import { ruleOf } from './maprules';
import { terrainOf } from '../map/terrain';
import type { BattleEvent, BattleState, Combatant } from './types';

export const CONVEYOR_CHAR = 'Y';
/** Yön adı → AXIAL_DIRECTIONS indeksi (flat-top: 0 GD, 1 KD, 2 K, 3 KB, 4 GB, 5 G). */
export const FLOW_DIRS: Record<string, number> = { SE: 0, NE: 1, N: 2, NW: 3, SW: 4, S: 5 };

/** Çalışan yürüyen merdivenin akış yönü (indeks); kural yoksa ya da kol çekildiyse null. */
export function conveyorFlow(state: BattleState): number | null {
  const r = ruleOf(state, 'conveyor');
  if (!r) return null;
  const lever = typeof r.leverId === 'string' ? state.map?.objects?.find((o) => o.id === r.leverId) : undefined;
  if (lever && lever.state === 'tipped') return null;
  const flow = FLOW_DIRS[String(r.flow ?? 'S')];
  return flow ?? null;
}

const isConveyor = (state: BattleState, h: Offset) => state.map?.tiles[h.row]?.[h.col] === CONVEYOR_CHAR;

/** Adım `from → to` çalışan yürüyen merdivende yokuş yukarı mı (akışa karşı, ±60°)? */
export function isUphillStep(state: BattleState, from: Offset, to: Offset, flow = conveyorFlow(state)): boolean {
  if (flow === null || !isConveyor(state, to)) return false;
  const d = directionTo(from, to);
  if (d === null) return false;
  const against = (flow + 3) % 6;
  return d === against || d === (against + 1) % 6 || d === (against + 5) % 6;
}

/** Yol bulma için: yokuş yukarı kenar geçilmez (uçan muaf). Kural yoksa her zaman false (eski davranış). */
export function conveyorBlocks(state: BattleState, actor: Combatant, flying: boolean): (h: Offset, prev: Offset) => boolean {
  const flow = conveyorFlow(state);
  if (flow === null || flying) return () => false;
  void actor;
  return (h, prev) => isUphillStep(state, prev, h, flow);
}

/** `at`'taki yaratık akış yönünde bir altıgen kayar; orası girilemezse `fallback`'e. Hedef yoksa olay yok. */
export function conveyorSlideEvents(state: BattleState, moverId: string, at: Offset, fallback: Offset | null): BattleEvent[] {
  const flow = conveyorFlow(state);
  if (flow === null) return [];
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  const busy = new Set(Object.values(state.combatants).filter((c) => c.id !== moverId && c.pos && c.hp > 0).map((c) => hexKey(c.pos as Offset)));
  const free = (h: Offset) => {
    if (!isInside(h, size) || busy.has(hexKey(h))) return false;
    const t = terrainOf(state.map?.tiles[h.row]?.[h.col] ?? '#');
    if (t.movement === 'blocked' || t.movement === 'deadly') return false;
    return !state.map?.objects?.some((o) => o.at.col === h.col && o.at.row === h.row && o.kind !== 'chest' && o.kind !== 'lever');
  };
  const down = axialToOffset(addAxial(offsetToAxial(at), AXIAL_DIRECTIONS[flow] as { q: number; r: number }));
  const to = free(down) ? down : fallback && free(fallback) ? fallback : null;
  return to ? [{ type: 'pushed', targetId: moverId, from: at, to, by: 'conveyor' }] : [];
}

/** Arayüz: çalışan yürüyen merdivenin akış yönü (derece, ekranda; ok çizimi). */
export function flowAngle(flow: number): number {
  return [30, -30, -90, -150, 150, 90][flow] ?? 90;
}
