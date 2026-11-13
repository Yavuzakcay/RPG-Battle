/**
 * Kuyruk MB1 (kural sürümü 68): binek yığınının yaprak sorguları. Hareket, irtifa ve hücre modülleri buradan okur
 * (`mounted.ts`'i içe aktarmak döngü kenarı eklerdi). Yalnız veri, tür ve sürüm sabiti içe aktarır.
 */
import { distance, isInside, neighbors, sameHex, type Offset } from '../rules/hex';
import { footprint } from '../rules/footprint';
import rules from '../../data/s2-kurallar.json';
import { binekMb3On, binekMb4On, binekOn } from './binekSurum';
import type { BattleState, Combatant, MountRule } from './types';

const BOY_FT = rules.irtifa.boyFt as Record<string, number>;
/** Yaratığın boyu (ft; `altitude.ts` `bodyHeightFt` ile aynı veri; yaprak kopya). */
export const heightFtOf = (c: Pick<Combatant, 'size'>): number => BOY_FT[c.size] ?? 5;

/** Savaşta binici var mı (hızlı yol). */
export function anyRiders(state: Pick<BattleState, 'combatants'>): boolean {
  for (const c of Object.values(state.combatants)) if (c.riding) return true;
  return false;
}

/** Binici bineğinin üstünde mi (aynı altıgen ve irtifa; ayrılmış binici değil). */
export function riderOnMount(state: Pick<BattleState, 'combatants'>, c: Pick<Combatant, 'riding' | 'pos' | 'altitudeFt'>): boolean {
  if (!c.riding || !c.pos) return false;
  const m = state.combatants[c.riding];
  return !!m?.pos && sameHex(m.pos, c.pos) && (m.altitudeFt ?? 0) === (c.altitudeFt ?? 0);
}

/** 68+: bineğinin üstündeki binici (hücre kaplamaz, irtifa düşüşü işlemez). */
export function seatedRider(state: Pick<BattleState, 'combatants' | 'kuralSurumu'>, c: Pick<Combatant, 'riding' | 'pos' | 'altitudeFt'>): boolean {
  return !!c.riding && binekOn(state) && riderOnMount(state, c);
}

/** B11 (68+, ⚠ SRD'de boy yok): bineğin üstündeki binicinin yığına kattığı boy (ft; binicinin boyu). Binici yoksa 0. */
export function riderStackFt(state: Pick<BattleState, 'kuralSurumu'> & Partial<Pick<BattleState, 'combatants'>>, mount: { rider?: string }): number {
  if (!mount.rider || !binekOn(state) || !state.combatants) return 0;
  const r = state.combatants[mount.rider];
  return r && riderOnMount(state as Pick<BattleState, 'combatants'>, r) ? BOY_FT[r.size] ?? 5 : 0;
}

// --- Kuyruk MB3 (kural sürümü 69) -------------------------------------------------------------------------------------

/** 69+: bineğin üstündeki binici (yoksa undefined). */
export function seatedRiderOf(state: Pick<BattleState, 'combatants' | 'kuralSurumu'>, mount: Pick<Combatant, 'rider'>): Combatant | undefined {
  if (!mount.rider || !binekMb3On(state)) return undefined;
  const r = state.combatants[mount.rider];
  return r && riderOnMount(state, r) ? r : undefined;
}

/**
 * B6 (69+, ⚠ yorum): bineğinin üstündeki binicinin dikey bandı bineğin bandı. Bant için kullanılacak boyut: binicide bineğin
 * boyutu (irtifalar zaten eşit). 68 ve altında, binici değilse ya da savaşçılar yoksa kendi boyutu.
 */
export function bandSizeOf(state: Pick<BattleState, 'kuralSurumu'> & Partial<Pick<BattleState, 'combatants'>>, c: Pick<Combatant, 'size'>): Combatant['size'] {
  const r = c as Partial<Combatant>;
  if (!r.riding || !state.combatants || !binekMb3On(state)) return c.size;
  const m = state.combatants[r.riding];
  return m && riderOnMount(state as Pick<BattleState, 'combatants'>, r as Combatant) ? m.size : c.size;
}

/**
 * Bineğin 5 ft içinde (yer düzeyinde) boş komşu altıgen: binekten düşen binicinin yeri (MB1 `mounted.ts` ile aynı ölçüt).
 * Kuyruk MB4 (72+, çok altıgen açık, `mount` verilince): gövdenin dışında, gövdeye bitişik ve hiçbir gövdenin kaplamadığı
 * altıgen (`bodyOutsideSpots`).
 */
export function fallOffSpot(state: Pick<BattleState, 'combatants' | 'map'> & Partial<Pick<BattleState, 'kuralSurumu' | 'multiHex' | 'multiHexMax'>>, at: Offset, mount?: Combatant): Offset | null {
  if (mount && binekMb4On(state)) return bodyOutsideSpots(state, mount).find((h) => !bodyCovered(state, h)) ?? null;
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  const occupied = (h: Offset) => Object.values(state.combatants).some((o) => o.hp > 0 && !!o.pos && sameHex(o.pos, h) && !o.summon?.gone);
  return neighbors(at, size).find((h) => !occupied(h)) ?? null;
}

// --- Kuyruk MB4 (kural sürümü 72; çok altıgen açıkken) ---------------------------------------------------------------

type MhState = Pick<BattleState, 'combatants'> & Partial<Pick<BattleState, 'kuralSurumu' | 'multiHex' | 'multiHexMax' | 'map'>>;

/**
 * Yaprak ayak izi (`body.ts` `bodyAt` ile aynı şekil; döngü açmamak için kopya): çok altıgen açıkken Large/Huge/Gargantuan
 * gövde, değilse çapa. MB4 (72+): bineğinin üstündeki binici tek altıgen (çapa).
 */
export function leafBody(state: MhState, c: Pick<Combatant, 'size' | 'pos'> & { riding?: string }, at: Offset | null = c.pos): Offset[] {
  if (!at) return [];
  if (!state.multiHex || (c.size !== 'L' && c.size !== 'H' && c.size !== 'G')) return [at];
  if (c.riding && binekMb4On(state) && riderOnMount(state, c as Combatant)) return [at];
  return footprint(at, c.size === 'G' && state.multiHexMax === 'H' ? 'H' : c.size);
}

/** Altıgen yaşayan bir yaratığın gövdesinde mi (bineğin üstündeki binici kaplamaz). */
function bodyCovered(state: MhState, h: Offset): boolean {
  for (const o of Object.values(state.combatants)) {
    if (o.hp <= 0 || !o.pos || o.summon?.gone || (o.riding && riderOnMount(state, o))) continue;
    if (leafBody(state, o).some((x) => sameHex(x, h))) return true;
  }
  return false;
}

/**
 * MB4: bineğin gövdesinin dışında, gövdeye bitişik (5 ft) harita içi altıgenler; çapaya yakından uzağa (eşitlikte gövde ve komşu
 * sırası; belirlenimci). Doluluk ve zemin çağıranda.
 */
export function bodyOutsideSpots(state: MhState, mount: Combatant): Offset[] {
  if (!mount.pos) return [];
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  const body = leafBody(state, mount);
  const inBody = (h: Offset) => body.some((x) => sameHex(x, h));
  const out: Offset[] = [];
  for (const b of body) for (const h of neighbors(b, size)) if (!inBody(h) && !out.some((x) => sameHex(x, h))) out.push(h);
  const a = mount.pos;
  return out.filter((h) => isInside(h, size)).map((h, i) => ({ h, i, d: distance(a, h) })).sort((x, y) => x.d - y.d || x.i - y.i).map((x) => x.h);
}

/** Kuyruk MB7: veri/paket binek tanımı → savaşçıdaki binek kuralı. */
export function mountRuleOf(m: { kural?: unknown; enBuyukBinici?: unknown; minSeviye?: unknown; kontrol?: unknown } | undefined, control = false): MountRule | undefined {
  if (!m) return undefined;
  return { ...(m.kural === 'sahip' ? { ownerOnly: true as const } : {}), ...(typeof m.enBuyukBinici === 'string' ? { maxRider: m.enBuyukBinici as MountRule['maxRider'] } : {}),
    ...(typeof m.minSeviye === 'number' ? { minLevel: m.minSeviye } : {}),
    // Kuyruk MB2 (74+; `control` çağıran sürümü denetler): kontrollü binek.
    ...(control && m.kontrol === 'kontrollu' ? { controlled: true as const } : {}) };
}
