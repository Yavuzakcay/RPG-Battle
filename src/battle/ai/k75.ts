/**
 * Kuyruk K75 (kural sürümü 79): yapay zekâ binme/inme kararı, yalnız mevcut `mount`/`dismount` komutlarıyla.
 * Denge notu (MB8): menzilli binici ata binince düşman hattına taşınır; bu yüzden yalnız yakın dövüşçü biner (menzilli
 * silah/saldırısı yok), yalnız bitişik, boş, eğitimli (kontrollü) dost bineğe, yalnız düşman bir hareket turundan uzaktayken.
 * İnme: binek ağır yaralıysa (can ≤ `INME_CAN`).
 */
import { distance } from '../../rules/hex';
import { mountControlled } from '../binekMb2';
import { k75On } from '../k75Surum';
import type { BattleState, Combatant, Command } from '../types';

/** Bineğin canı bu oranın altındaysa binici iner. */
export const INME_CAN = 0.25;

const meleeOnly = (c: Combatant): boolean => !c.weaponOptions.some((o) => o.ranged) && !(c.attacks ?? []).some((a) => a.ranged) && !(c.spellSlots ?? []).some((n) => n > 0);

/** Bineği kullanmak için en iyi aday komut (yoksa null). `ok`: komutun motor denemesi (ai.ts `tryCmd`). */
export function mountDecision(state: BattleState, actor: Combatant, ok: (c: Command) => boolean): Command | null {
  if (!k75On(state) || !actor.pos || actor.hp <= 0 || actor.summon) return null;
  if (actor.riding) {
    const m = state.combatants[actor.riding];
    if (!m || m.maxHp <= 0 || m.hp / m.maxHp > INME_CAN) return null;
    const cmd: Command = { type: 'dismount', actorId: actor.id };
    return ok(cmd) ? cmd : null;
  }
  if (actor.movementUsed > 0 || !meleeOnly(actor)) return null;
  const foes = Object.values(state.combatants).filter((c) => c.side !== actor.side && c.hp > 0 && c.pos && !c.summon?.gone);
  if (!foes.length) return null;
  const nearest = Math.min(...foes.map((f) => distance(actor.pos!, f.pos!)));
  // Düşman kendi hızıyla zaten ulaşılabilir uzaklıktaysa binmeye hareket harcanmaz.
  if (nearest <= Math.floor(actor.speed / 5)) return null;
  for (const m of Object.values(state.combatants)) {
    if (m.side !== actor.side || m.hp <= 0 || m.rider || m.id === actor.id || !m.pos || !mountControlled(m)) continue;
    if (distance(actor.pos, m.pos) > 1) continue;
    const cmd: Command = { type: 'mount', actorId: actor.id, mountId: m.id };
    if (ok(cmd)) return cmd;
  }
  return null;
}
