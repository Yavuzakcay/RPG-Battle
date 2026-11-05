/**
 * Kuyruk K54b (kural sürümü 27): zemin koruması (Harita Öğretisi). Mevzi İşareti ve Zemin Yeniden Yaz "Yol aç" kipi
 * alan (`SpellZone.groundWard`) bırakır; Kuşbakışı Plan dostlara süren etki (`ActiveEffect.groundWard`) verir. Korunan
 * dost o altıgende zor zemini yok sayar (hareket), zemin yüzeyinin ve zemin alanının tetiklerinden etkilenmez; Mevzi
 * altıgeninde kurtulma bonusu (`syncAuras` → `wardSave`). Bağımlılıksız (hareket, alan ve aura modülleri okur). Saf.
 */
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant, SpellZone } from './types';

const same = (a: Offset, b: Offset) => a.col === b.col && a.row === b.row;
/** Gaz katmanındaki yüzeyler zemin sayılmaz (buhar, zehir bulutu). */
const GAS = new Set(['steam', 'poison']);

/** Bu altıgen (ya da her yer) bu yaratık için korunuyor mu; korumasızsa null, yoksa koruyan alanlar. */
function wardZones(state: BattleState, c: Combatant, at: Offset): SpellZone[] {
  return (state.map?.zones ?? []).filter((z) => z.groundWard && z.side === c.side && z.hexes.some((h) => same(h, at)));
}

/** Hareket: bu yaratık için korunan altıgen sınaması; hiç koruma yoksa null (hesap yok). */
export function groundWardFn(state: BattleState, c: Combatant): ((h: Offset) => boolean) | null {
  if (c.effects?.some((e) => e.groundWard)) return () => true;
  if (!(state.map?.zones ?? []).some((z) => z.groundWard && z.side === c.side)) return null;
  return (h) => wardZones(state, c, h).length > 0;
}

/** Yaratık (şu anki ya da verilen altıgende) zemin korumasında mı. */
export function groundWarded(state: BattleState, c: Combatant, at: Offset | null = c.pos): boolean {
  if (c.effects?.some((e) => e.groundWard)) return true;
  return !!at && wardZones(state, c, at).length > 0;
}

/** Alan bu korumayla yok sayılır mı: zemin yüzeyi (gaz değil) ya da zemin alanı (`ground`). */
export const groundZone = (z: SpellZone, ground: boolean | undefined): boolean => (!!z.surface && !GAS.has(z.surface)) || !!ground;

/** Mevzi İşareti kurtulma bonusu (en büyüğü). */
export function groundWardSave(state: BattleState, c: Combatant): number {
  if (!c.pos) return 0;
  return Math.max(0, ...wardZones(state, c, c.pos).map((z) => z.groundWard?.saveBonus ?? 0));
}
