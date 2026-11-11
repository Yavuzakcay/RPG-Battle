/**
 * Kuyruk MB1 (kural sürümü 68): binek yığınının yaprak sorguları. Hareket, irtifa ve hücre modülleri buradan okur
 * (`mounted.ts`'i içe aktarmak döngü kenarı eklerdi). Yalnız veri, tür ve sürüm sabiti içe aktarır.
 */
import { sameHex } from '../rules/hex';
import rules from '../../data/s2-kurallar.json';
import { binekOn } from './binekSurum';
import type { BattleState, Combatant } from './types';

const BOY_FT = rules.irtifa.boyFt as Record<string, number>;

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
