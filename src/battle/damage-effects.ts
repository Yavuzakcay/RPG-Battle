/** Hasar uygulanırken ortaya çıkan özel kurallar: Undead Fortitude ve Regeneration. */
import { rollD20, type Rng } from '../rules/dice';
import { applyDamage } from '../rules/damage';
import type { Combatant, DamageEffect } from './types';

export function damageEffects(
  target: Combatant,
  applied: number,
  damageType: string,
  critical: boolean,
  rng: Rng,
): { hpAfter: number; effects: DamageEffect[] } {
  const type = damageType.trim().toLowerCase();
  const effects: DamageEffect[] = [];
  let hpAfter = applyDamage(target.hp, applied);
  const blockedNow = target.regeneration > 0 && applied > 0 && (type === 'acid' || type === 'fire');
  if (blockedNow) effects.push({ kind: 'regen_blocked' });

  // Undead Fortitude: 0 HP'ye düşünce CON save (DC 5 + hasar); radiant ve kritik vuruş bunu atlar.
  if (hpAfter === 0 && target.hp > 0 && target.undeadFortitude && type !== 'radiant' && !critical && applied > 0) {
    const dc = 5 + applied;
    const roll = rollD20('normal', rng);
    const total = roll.kept + target.saves.con;
    const success = total >= dc;
    effects.push({ kind: 'undead_fortitude', dc, natural: roll.kept, total, success });
    if (success) hpAfter = 1;
  }

  // Yenilenme: 0 HP'de ama acid/fire ile engellenmediyse tur başında ayağa kalkabilir.
  if (hpAfter === 0 && target.regeneration > 0 && !blockedNow && !target.regenBlocked) {
    effects.push({ kind: 'regen_pending' });
  }

  // Oyuncu karakterleri 0 HP'de ölmez: ölüm save'lerine başlar.
  if (target.side === 'party' && !target.civilian && applied > 0) {
    if (target.life === 'dying' || target.life === 'stable') {
      if (applied >= target.maxHp) {
        effects.push({ kind: 'instant_death' });
      } else {
        const failures = Math.min(3, target.deathSaves.failures + (critical ? 2 : 1));
        effects.push({ kind: 'death_save_failed', failures, died: failures >= 3 });
      }
    } else if (hpAfter === 0 && target.hp > 0) {
      effects.push(applied - target.hp >= target.maxHp ? { kind: 'instant_death' } : { kind: 'dying' });
    }
  }
  return { hpAfter, effects };
}
