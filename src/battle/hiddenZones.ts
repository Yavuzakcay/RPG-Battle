/**
 * Kuyruk S2 (kural sürümü 41): gizli ve kişiye özel alanlar.
 * - `hiddenFrom` (Spike Growth kamuflajı): o taraftan fark etmeyen (`seenBy` dışında) yaratık alanı bilmez: yapay zekâ
 *   ondan kaçınmaz (risk yok). Arama (Search: Wisdom (Perception), alanın DC'sine karşı, 60 ft içinde) ya da alanın
 *   hasarına uğramak fark ettirir (`zone_spotted`). Alanın hasarı ve zorlu arazisi fark etmeyen için de gerçektir.
 * - `visibleTo` (Phantasmal Force yanılsaması): yalnız bu yaratıklar ve büyücünün tarafı görür.
 * Arayüz (tek ekran): oyuncu ekranı yalnız parti tarafının bildiğini çizer; Game Master anahtarı "Gizli alanlar" hepsini.
 * Saf.
 */
import { distance } from '../rules/hex';
import { registerCommandEnd } from './turnHooks';
import type { BattleEvent, BattleState, Combatant, Side, SpellZone } from './types';

/** Yaratık bu alanı biliyor mu (gizli değil, gizliyse fark etmiş). */
export function zoneKnownBy(z: SpellZone, c: Pick<Combatant, 'id' | 'side'>): boolean {
  if (z.hiddenFrom && z.hiddenFrom === c.side && !(z.seenBy ?? []).includes(c.id)) return false;
  if (z.visibleTo && !z.visibleTo.includes(c.id) && c.side !== z.side) return false;
  return true;
}

/** Bir taraf (tek ekranda oyuncular: parti) alanı görüyor mu; `showAll` Game Master anahtarı. */
export function zoneShownTo(state: BattleState, z: SpellZone, side: Side, showAll: boolean): boolean {
  if (showAll) return true;
  if (z.hiddenFrom === side && !(z.seenBy ?? []).some((id) => state.combatants[id]?.side === side)) return false;
  if (z.visibleTo && z.side !== side && !z.visibleTo.some((id) => state.combatants[id]?.side === side)) return false;
  return true;
}

/** Arama: gizli alanları fark etme (60 ft içinde, toplam ≥ alanın DC'si). */
export function searchZoneEvents(state: BattleState, actor: Combatant, total: number): BattleEvent[] {
  if (!actor.pos) return [];
  return (state.map?.zones ?? []).filter((z) => z.hiddenFrom === actor.side && !(z.seenBy ?? []).includes(actor.id) && total >= z.dc
    && z.hexes.some((h) => distance(h, actor.pos as NonNullable<typeof actor.pos>) <= 12))
    .map((z): BattleEvent => ({ type: 'zone_spotted', zoneId: z.id, by: [actor.id] }));
}

// Komut sonu: gizli alanın tetiğine uğrayan (hasar, durum) onu fark eder.
registerCommandEnd((_before, next, events) => {
  const out: BattleEvent[] = [];
  for (const e of events) {
    // Tek seferlik tetik `zone_triggered`; süregelen hasar (Spike Growth: her 5 ft) `effect_tick` (kimlik: büyü).
    const z = e.type === 'zone_triggered' ? next.map?.zones?.find((x) => x.id === e.zoneId)
      : e.type === 'effect_tick' ? next.map?.zones?.find((x) => x.hiddenFrom && x.spellId === e.effectId) : undefined;
    if (!z || (e.type !== 'zone_triggered' && e.type !== 'effect_tick')) continue;
    const c = next.combatants[e.targetId];
    if (z?.hiddenFrom && c && !zoneKnownBy(z, c) && !out.some((x) => x.type === 'zone_spotted' && x.zoneId === z.id && x.by.includes(c.id))) out.push({ type: 'zone_spotted', zoneId: z.id, by: [c.id] });
  }
  return out;
});
