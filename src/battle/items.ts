/**
 * Kuyruk 43: savaşta sarf eşyası (SRD 5.2.1): iksir içmek ya da 5 ft içindeki birine içirmek bonus eylem; iyileştirme
 * zarı eşya verisinde (`data/items.json` `use`). Envanter savaşçıda `consumables` (adet), olay `item_used` adedi azaltır;
 * iyileşme mevcut `healed` olayıyla (0 HP'deki karakter kalkar). Replay olaylardan.
 */
import { items } from '../data';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Kullanılabilecek sarf eşyaları (adı, adedi). */
export function consumablesOf(c: Combatant): Array<{ id: string; name: string; count: number }> {
  return Object.entries(c.consumables ?? {}).filter(([, n]) => n > 0)
    .map(([id, count]) => ({ id, name: items.find((i) => i.id === id)?.name ?? id, count }));
}

/** Eşya bu hedefe kullanılabilir mi (sorun yoksa null). */
export function useItemProblem(state: BattleState, actor: Combatant, itemId: string, targetId: string): string | null {
  const it = items.find((i) => i.id === itemId);
  if (!it?.use) return 'Bu eşya savaşta kullanılmaz.';
  if ((actor.consumables?.[itemId] ?? 0) <= 0) return `${it.name} kalmadı.`;
  const t = state.combatants[targetId];
  if (!t || t.life === 'dead' || t.summon?.gone) return 'Hedef yok.';
  if (t.side !== actor.side) return 'İksir yalnızca kendine ya da bir dosta.';
  if (t.id !== actor.id && state.map && (!t.pos || !actor.pos || distance(t.pos, actor.pos) * 5 > it.use.reachFt)) return `Hedef ${it.use.reachFt} ft içinde olmalı.`;
  return null;
}

export function executeUseItem(state: BattleState, actor: Combatant, itemId: string, targetId: string, rng: Rng): CommandResult {
  const why = useItemProblem(state, actor, itemId, targetId);
  if (why) return fail(why);
  const it = items.find((i) => i.id === itemId)!;
  const t = state.combatants[targetId] as Combatant;
  const roll = rollDice(it.use!.dice, rollTag(rng, { by: actor.id, kind: 'heal' }));
  const amount = Math.max(0, Math.min(roll.total, t.maxHp - t.hp));
  const events: BattleEvent[] = [
    { type: 'item_used', actorId: actor.id, itemId, name: it.name, targetId, left: (actor.consumables?.[itemId] ?? 1) - 1 },
    { type: 'healed', actorId: actor.id, targetId, label: it.name, amount, targetHpAfter: t.hp + amount },
  ];
  return finish(state, events);
}
