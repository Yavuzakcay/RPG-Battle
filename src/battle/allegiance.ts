/**
 * Kuyruk 18 H1: taraf değiştirme (sadakat). Süren etkide `dominate: true` olan yaratık (Dominate Person, Dominate Beast)
 * etkiyi verenin tarafına ve sahibine geçer; asıl taraf ve sahip `allegiance`'ta saklanır. Etki herhangi bir yoldan
 * bitince (konsantrasyon, hasarla yeniden save, süre, ölüm, 0 HP) aynı reducer adımında asıl tarafa döner. Tek yer:
 * reducer sonrası `syncAllegiance` (replay olaylardan aynı durumu üretir); hedefleme, yapay zekâ ve kontrol `side`/
 * `ownerId`'den okuduğu için kendiliğinden doğru tarafı görür. Ölüm/düşme ve zafer sayımı asıl tarafı kullanır
 * (`homeSide`): yönetilen canavar 0 HP'de ölüm save'i atmaz; düşman tarafı yönetilen üyesi ayaktayken yenilmez.
 * Game Master anahtarı `allegianceSwap` (global, kural sürümü 14); kapalıyken etki yalnızca Charmed gibi davranır.
 * Sıra (inisiyatif) değişmez: yaratık kendi turunda yeni tarafıyla davranır (SRD 5.2.1).
 */
import { globalRule } from './ruleControl';
import { activePossession } from './possessionCore';
import type { BattleState, Combatant, Side } from './types';

/** Yaratığın asıl tarafı (yönetiliyorsa yönetilmeden önceki). */
export const homeSide = (c: Pick<Combatant, 'side' | 'allegiance'>): Side => c.allegiance?.side ?? c.side;

export function syncAllegiance(state: BattleState): BattleState {
  let next = state;
  const on = !!globalRule(state, 'allegianceSwap');
  // Kuyruk K64a (sürüm 48): ele geçirme Dominate'ten baskın ve kendi anahtarıyla (`possession`) çalışır.
  const possOn = !!globalRule(state, 'possession');
  for (const c of Object.values(state.combatants)) {
    const poss = possOn && c.hp > 0 && c.life !== 'dead' ? activePossession(c) : undefined;
    const dom = poss ?? (c.hp > 0 && c.life !== 'dead' ? c.effects?.find((e) => e.dominate) : undefined);
    const src = dom ? state.combatants[dom.sourceId] : undefined;
    const want = (poss || on) && dom && src && src.hp > 0 && homeSide(src) !== homeSide(c) ? src : undefined;
    if (want && (!c.allegiance || c.side !== want.side || c.ownerId !== want.ownerId)) {
      const home = c.allegiance ?? { side: c.side, ownerId: c.ownerId };
      next = { ...next, combatants: { ...next.combatants, [c.id]: { ...(next.combatants[c.id] as Combatant), allegiance: home, side: want.side, ownerId: want.ownerId } } };
    } else if (!want && c.allegiance) {
      const home = c.allegiance;
      const { allegiance: _a, ...rest } = next.combatants[c.id] as Combatant;
      next = { ...next, combatants: { ...next.combatants, [c.id]: { ...rest, side: home.side, ownerId: home.ownerId } as Combatant } };
    }
  }
  return next;
}
