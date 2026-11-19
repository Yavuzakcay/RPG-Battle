/**
 * Görev D3 (kural sürümü 89): durum bağışıklığının kaynak bilgisiyle denetimi (yaprak modül; reducer ve canavar özellikleri
 * kullanır). Vampire Familiar (SRD 5.2.1 s. 334): "Charmed (except from its vampire master)": efendi = aynı asıl taraftaki
 * `vampire` canavarı (`data/srd-d3.json` `efendiIstisnasi`; bağışıklık etkisinde `immuneExcept`). Süren etkinin verdiği
 * durumlar (`grants`) 89+'da bağışıklığa takılır: taşıyıcı durum (Charmed, Frightened) ya da bütün durumlar bağışıksa etki
 * tutmaz, yoksa yalnız bağışık durum düşer. Saf.
 */
import d3 from '../../data/srd-d3.json';
import { homeSide } from './allegiance';
import type { ActiveEffect, BattleState, Combatant } from './types';

const DATA = d3 as { tasiyiciDurumlar: string[]; efendiIstisnasi: Record<string, Record<string, string>> };

/** Canavarın efendi istisnaları (durum → efendinin canavar kimliği); yoksa `undefined`. */
export const masterExceptions = (monsterId: string | undefined): Record<string, string> | undefined =>
  monsterId ? DATA.efendiIstisnasi[monsterId] : undefined;

/** Bu bağışıklık etkisi kaynağın verdiği duruma işlemiyor mu (kaynak, taşıyıcının aynı taraftaki efendisi). */
function exceptFrom(state: BattleState | undefined, c: Combatant, e: ActiveEffect, condition: string, sourceId: string | undefined): boolean {
  const master = e.immuneExcept?.[condition];
  if (!master || !state || !sourceId) return false;
  const src = state.combatants[sourceId];
  return !!src && src.id !== c.id && src.monsterId === master && homeSide(src) === homeSide(c);
}

/** Süren etkilerden bu duruma (bu kaynaktan) bağışık mı. */
export const effectImmune = (state: BattleState | undefined, c: Combatant, condition: string, sourceId?: string): boolean =>
  (c.effects ?? []).some((e) => !!e.immune?.includes(condition) && !exceptFrom(state, c, e, condition, sourceId));

/**
 * 89+: etkinin verdiği durumlardan bağışık olunanlar. `null`: etki hiç tutmaz (taşıyıcı durum ya da bütün durumlar
 * bağışık); yoksa kalan durumlar (değişmediyse aynı dizi).
 */
export function grantsAfterImmunity(grants: string[], immune: (condition: string) => boolean): string[] | null {
  const blocked = grants.filter(immune);
  if (!blocked.length) return grants;
  if (blocked.length === grants.length || blocked.some((g) => DATA.tasiyiciDurumlar.includes(g))) return null;
  return grants.filter((g) => !blocked.includes(g));
}
