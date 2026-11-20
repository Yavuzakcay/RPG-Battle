/** Görev B93: Divine Intervention'ın hazırlanmamış büyüsü (yaprak modül; economy ve spells ortak). Saf. */
import type { Spell } from '../data';
import { resourceDef } from '../rules/classFeatures';
import { resourceLeft, type Combatant } from './types';

/** Görev B93: hazırlanmamış büyüyü de slotsuz veren listeli kaynak (Divine Intervention; `freeSpellList.anyFromList`). */
export function anyListResource(actor: Combatant, spell: Spell): string | null {
  for (const id of Object.keys(actor.resources)) {
    const list = resourceDef(id)?.freeSpellList;
    if (!list?.anyFromList || resourceLeft(actor, id) <= 0 || spell.castingTime === 'reaction') continue;
    // `extraNames` (Greater Divine Intervention: Wish) yalnız bilinen (20. seviyede her zaman hazır) büyüde; burada değil.
    if (spell.level >= (list.minLevel ?? 1) && spell.level <= list.maxLevel && spell.classes.some((c) => list.classes.includes(c))) return id;
  }
  return null;
}

