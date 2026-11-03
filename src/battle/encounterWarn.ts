/**
 * Denge turu (madde 6, K18 karar 8): karşılaşma uyarıları. Saf; Game Master kurulumu okur, savaşı değiştirmez.
 * Yenilenen (Regeneration) düşman yalnızca ateş ya da asit hasarı alınca yenilenmez (SRD Troll; motor
 * `damage-effects.ts`). Partide ateş/asit kaynağı yoksa bu düşmanlar öldürülemez: büyücüsüz partilerin Mağara ve Orman
 * 9. seviye listelerinde %0–3 kazanmasının nedeni. Kaynaklar: silah/canavar saldırısı, bilinen büyü, tür nefesi, iksir/şişe.
 */
import { spells } from '../data';
import type { Combatant } from './types';

const CUTS = new Set(['fire', 'acid']);
/** Savaşta atılabilen ateş/asit eşyaları (SRD donanım: Acid, Alchemist's Fire). */
const ITEMS = ['acid', 'alchemists-fire'];

/** Savaşçının ateş/asit hasar kaynağı var mı. */
export function hasFireOrAcid(c: Combatant): boolean {
  if (c.attacks.some((a) => a.damageType && CUTS.has(a.damageType))) return true;
  if (c.breath && CUTS.has(c.breath.damageType)) return true;
  if (ITEMS.some((id) => (c.consumables?.[id] ?? 0) > 0)) return true;
  return c.spellNames.some((n) => {
    const t = spells.find((s) => s.name === n)?.mechanics as { damageType?: string } | undefined;
    return !!t?.damageType && CUTS.has(t.damageType);
  });
}

/** Uyarı: partide ateş/asit yokken yenilenen düşmanların adları (yoksa boş). */
export function regenWarning(participants: readonly Combatant[]): string[] {
  const party = participants.filter((c) => c.side === 'party' && !c.civilian);
  if (party.length === 0 || party.some(hasFireOrAcid)) return [];
  const names = participants.filter((c) => c.side === 'enemies' && c.regeneration > 0).map((c) => c.name.replace(/\s+\d+$/, ''));
  return [...new Set(names)];
}
