/**
 * Görev P7: büyülü vuruş (ek paket `buyuluVurus`, `cagirGuclendir.buyuluVurus`). Büyüsüz saldırılara direnci olan
 * yaratık (`Combatant.nonmagicalResist`; paket yaratığı `buyusuzDirencler`) büyülü sayılmayan silah/canavar saldırısının
 * o türdeki hasarına dirençlidir. Büyü saldırısı ve süren etkisinde `pkMagic` taşıyan saldırgan büyülüdür. SRD 5.2.1
 * canavarlarında büyüsüz direnç yok: alan yoksa profil aynen döner. Saf.
 */
import type { Combatant } from './types';

/** Saldırgan büyülü mü (kendi büyülü vuruşu; çağrıldıysa sahibinin `cagrilanlar` kapsamı süren etkiyle gelir). */
export const isMagicStriker = (actor: Combatant): boolean => !!actor.effects?.some((e) => e.pkMagic?.includes('kendi'));

/** Hasar profili: büyüsüz saldırıysa hedefin büyüsüz direnci eklenir. */
export function nonmagicalProfile<P extends { resistances: string[] }>(actor: Combatant, target: Combatant, type: string | undefined, prof: P, spell = false): P {
  const list = target.nonmagicalResist;
  if (!list?.length || !type || !list.includes(type) || spell || isMagicStriker(actor) || prof.resistances.includes(type)) return prof;
  return { ...prof, resistances: [...prof.resistances, type] };
}
