/**
 * Kuyruk K71c: dikey harekette fırsat saldırısı üreticisi için yaprak kayıt modülü (içe aktarması yok). `features.ts`
 * kaydeder, `altitude.ts` çağırır. Doğrudan içe aktarma modül döngüsü yapıyordu (reactions → cover → altitude → features →
 * … → reactions; dev sunucusunda "Cannot access 'afterHooks' before initialization"). Yaprak modül, onu ilk alan
 * modülün gövdesinden önce değerlendirilir; başlatma sırası sorunu olmaz.
 */
import type { Rng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState } from './types';

export type VerticalOpportunityFn = (state: BattleState, moverId: string, step: { from: Offset; to: Offset; fromAlt?: number; toAlt?: number }, rng: Rng) => BattleEvent[];
let fn: VerticalOpportunityFn | null = null;
export function registerVerticalOpportunity(f: VerticalOpportunityFn): void { fn = f; }
export function verticalOpportunity(): VerticalOpportunityFn | null { return fn; }
