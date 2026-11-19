/**
 * Mekanik matris: büyünün işleyicisini seçer. Seçim motorun büyü türüne (komutun nasıl verileceği) ve SRD'ye (yapım
 * süresi, tepki) göre; beklentiler işleyicide SRD'den.
 */
import type { Spell } from '../../data/types';
import type { SrdSpell } from './srd';
import type { Satir } from './ortak';
import { OZEL } from './ozel';
import { girdapRows } from './girdap';
import { mechOf } from './buyu';
import { zoneRows } from './alanBuyu';
import { effectRows } from './etki';
import { dispelRows, markRows, offRows, reactionSpellRows, restoreRows, smiteRows, special69Rows, summonRows, teleportRows } from './digerBuyu';

export function otherRows(sp: Spell, s: SrdSpell, core: (sp: Spell, s: SrdSpell) => Satir[]): Satir[] {
  const m = mechOf(sp);
  const o = OZEL[s.id];
  // Control Water girdabı (kural sürümü 84): kendi satırları (slot 4–9 × save, çekme, kaçış).
  if (sp.mechanics.k84?.whirlpool) return girdapRows(sp, s);
  if (m.offCombat) return offRows(sp, s);
  if (s.cast === 'reaction') return reactionSpellRows(sp, s);
  if (s.cast === 'long') return offRows(sp, s);
  if (o?.yapim || o?.tetik || o?.karar) return zoneRows(sp, s);
  if (m.zone) return zoneRows(sp, s);
  switch (m.kind) {
    case 'effect': case 'buff': return effectRows(sp, s);
    case 'summon': return summonRows(sp, s);
    case 'smite': return smiteRows(sp, s);
    case 'mark': return markRows(sp, s);
    case 'teleport': return teleportRows(sp, s);
    case 'cure': case 'revive': return restoreRows(sp, s);
    case 'dispel': return dispelRows(sp, s);
    case 'utility': return special69Rows(sp, s);
    default: return core(sp, s);
  }
}
