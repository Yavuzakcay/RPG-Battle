/** Hasar uygulanırken ortaya çıkan özel kurallar: Undead Fortitude, Regeneration ve konsantrasyon. */
import { rollD20, rollDice, rollTag, type Rng } from '../rules/dice';
import { extrasTotal, rollExtras } from '../rules/attack';
import { saveDice } from './effectDice';
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
  // Hasar azaltma etkisi (Resistance; Görev R2): seçilen türde, turda bir, zar kadar.
  const red = applied > 0 ? (target.effects ?? []).find((e) => e.reduce && !e.reduce.spent && e.reduce.types.includes(type)) : undefined;
  if (red?.reduce) {
    const roll = rollDice(red.reduce.die, rollTag(rng, { kind: 'damage', by: target.id })).total;
    const amount = Math.min(applied, roll);
    effects.push({ kind: 'reduced', label: red.name, effectId: red.id, roll, amount });
    applied -= amount;
  }
  // Geçici HP önce harcanır (Heroism; Görev R2). Konsantrasyon DC'si alınan hasarın tamamıyla.
  const temp = Math.min(target.tempHp ?? 0, applied);
  if (temp > 0) effects.push({ kind: 'temp_absorbed', amount: temp, left: (target.tempHp ?? 0) - temp });
  const taken = applied;
  applied -= temp;
  let hpAfter = applyDamage(target.hp, applied);
  const blockedNow = target.regeneration > 0 && applied > 0 && (type === 'acid' || type === 'fire');
  if (blockedNow) effects.push({ kind: 'regen_blocked' });

  // Undead Fortitude: 0 HP'ye düşünce CON save (DC 5 + hasar); radiant ve kritik vuruş bunu atlar.
  if (hpAfter === 0 && target.hp > 0 && target.undeadFortitude && type !== 'radiant' && !critical && applied > 0) {
    const dc = 5 + applied;
    const roll = rollD20('normal', rollTag(rng, { kind: 'save', by: target.id, bonus: target.saves.con }));
    const total = roll.kept + target.saves.con;
    const success = total >= dc;
    effects.push({ kind: 'undead_fortitude', dc, natural: roll.kept, total, success });
    if (success) hpAfter = 1;
  }

  // Yenilenme: 0 HP'de ama acid/fire ile engellenmediyse tur başında ayağa kalkabilir.
  if (hpAfter === 0 && target.regeneration > 0 && !blockedNow && !target.regenBlocked) {
    effects.push({ kind: 'regen_pending' });
  }

  // Konsantrasyon (SRD 5.2.1): hasar alan CON save yapar, DC 10 veya hasarın yarısı (en çok 30).
  // 0 HP'ye düşen yaratığın konsantrasyonu zaten biter (reducer).
  if (target.concentration && taken > 0 && hpAfter > 0) {
    const dc = Math.min(30, Math.max(10, Math.floor(taken / 2)));
    const roll = rollD20('normal', rollTag(rng, { kind: 'save', by: target.id, bonus: target.saves.con }));
    // Konsantrasyon CON save'i de save: zar eklentileri (Bless) eklenir.
    const extra = rollExtras(saveDice(target), 'save', rollTag(rng, { by: target.id }));
    const total = roll.kept + target.saves.con + extrasTotal(extra);
    effects.push({ kind: 'concentration', spell: target.concentration.spell, dc, natural: roll.kept, total, success: total >= dc, ...(extra.length ? { extra } : {}) });
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
