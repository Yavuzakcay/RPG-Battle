/**
 * GECE-KATALOG-KALAN (kural sürümü 110): katalog motor yaklaşıklarının kapanışı. Yaprak modül (yalnız tür, veri erişimi ve sürüm);
 * çağıranlar: `spells.ts` (Out-of-Time Storm büyü iptali), `grapple.ts` (dokunaç yakalama sınırı), `motion.ts` (düşük yerçekimi).
 * Kodda canavar adıyla koşul yok: hepsi `data/katalog-gucler.json` (109 alanları ya da `s110` katmanı). 109 ve altında etkisiz.
 */
import { gucOf } from './katalog109Data';
import { katalog110On } from './katalog110Surum';
import type { BattleEvent, BattleState, Combatant } from './types';

const fxOf = (c: Combatant) => (c.effects ?? []).map((e) => e.k109).filter((x): x is NonNullable<typeof x> => !!x);

/**
 * Out-of-Time Storm (110+): `negateOnce` taşıyan hedefe düşmanın doğrudan hedef aldığı büyü, saldırı iptaliyle **ortak** turda bir
 * hakla boşa gider (Counterspell'in durdurması gibi: eylem harcanır, slot harcanmaz). Alan büyüsü ve dost büyüsü etkilenmez.
 * Hak varsa olaylar (hak işareti + not), yoksa null.
 */
export function outOfTimeSpellEvents(state: BattleState, caster: Combatant, targetIds: string[], spellName: string): BattleEvent[] | null {
  if (!katalog110On(state)) return null;
  for (const id of targetIds) {
    const t = state.combatants[id];
    if (!t || t.side === caster.side || t.hp <= 0 || !fxOf(t).some((f) => f.negateOnce)) continue;
    const key = `r${state.round}`;
    if (t.traitTurns?.['k109:negate'] === key) continue;
    return [{ type: 'trait_turn', actorId: t.id, trait: 'k109:negate', key }, { type: 'map_note', text: `${t.name}: Out-of-Time Storm (${spellName} iptal).` }];
  }
  return null;
}

/** Dokunaç yakalama sınırı (110+, `yakalamaSiniri`): yakalayan bu sayıda yaratığı tutuyorsa yeni yakalama yok. */
export function grappleCapReached(state: BattleState, actor: Combatant): boolean {
  const cap = gucOf(state, actor.monsterId)?.yakalamaSiniri;
  if (!cap || !katalog110On(state)) return false;
  return Object.values(state.combatants).filter((o) => o.grapple?.by === actor.id && o.hp > 0).length >= cap;
}

/** Düşük yerçekimi (110+, faz etkisinde `k109.lowGravity`): savaşta ayakta böyle bir yaratık varken zorla hareket N ft uzar. */
export function lowGravityFt(state: BattleState): number {
  if (!katalog110On(state)) return 0;
  let n = 0;
  for (const c of Object.values(state.combatants)) if (c.hp > 0 && !c.summon?.gone) for (const f of fxOf(c)) n = Math.max(n, f.lowGravity ?? 0);
  return n;
}
