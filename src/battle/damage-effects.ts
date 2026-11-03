/** Hasar uygulanırken ortaya çıkan özel kurallar: Undead Fortitude, Regeneration ve konsantrasyon. */
import { rollD20, rollDice, rollTag, type Rng } from '../rules/dice';
import { extrasTotal, rollExtras } from '../rules/attack';
import { saveDice } from './effectDice';
import { applyDamage } from '../rules/damage';
import type { Combatant, DamageEffect } from './types';
import { spells } from '../data';

export function damageEffects(
  target: Combatant,
  applied: number,
  damageType: string,
  critical: boolean,
  rng: Rng,
): { hpAfter: number; effects: DamageEffect[] } {
  const type = damageType.trim().toLowerCase();
  const effects: DamageEffect[] = [];
  // Kuyruk 19 (Fire/Lightning/Acid Absorption): emilen hasar (eksi miktar) HP verir.
  if (applied < 0) return { hpAfter: Math.min(target.maxHp, target.hp - applied), effects: [{ kind: 'absorbed', amount: -applied }] };
  // Kuyruk 19 (Freeze, Aversion to Fire; srdK19): belirli türde hasar alınca süreli etki (sonraki turunun sonuna dek).
  for (const e of target.effects ?? []) for (const fx of e.onDamageFx ?? []) {
    if (applied > 0 && fx.type === type) effects.push({ kind: 'trait_fx', name: fx.name, effect: fx.effect });
  }
  // Hydra (Multiple Heads): ateş hasarı yeni başları engeller.
  if (applied > 0 && type === 'fire' && target.heads !== undefined) effects.push({ kind: 'trait_fx', name: 'Multiple Heads', effect: {}, headsFire: true });
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
    // Eldritch Mind (Görev WARLOCK): konsantrasyon save'inde avantaj.
    const roll = rollD20(target.traits?.includes('eldritch-mind') ? 'advantage' : 'normal', rollTag(rng, { kind: 'save', by: target.id, bonus: target.saves.con }));
    const total = roll.kept + target.saves.con;
    const success = total >= dc;
    effects.push({ kind: 'undead_fortitude', dc, natural: roll.kept, total, success });
    if (success) hpAfter = 1;
  }

  // Kuyruk 41b: Death Ward (SRD 5.2.1): ilk kez 0 HP'ye düşecekken 1 HP'de kalır ve büyü biter.
  const ward = hpAfter === 0 && target.hp > 0 && applied > 0 ? (target.effects ?? []).find((e) => e.deathWard) : undefined;
  if (ward) {
    hpAfter = 1;
    effects.push({ kind: 'death_ward', effectId: ward.id, name: ward.name });
  }

  // Kuyruk 19: Relentless Rage (Barbarian 11): öfkedeyken 0 HP'ye düşen CON save (DC 10, her kullanımda +5; dinlenmede 10'a
  // döner: kaynak `relentlessRage` kalan kullanım, DC = 10 + 5 × harcanan). Başarıda HP 2 × Barbarian seviyesi.
  if (hpAfter === 0 && target.hp > 0 && applied > 0 && target.rage && target.traits?.includes('relentless-rage')) {
    const used = 10 - Math.min(10, target.resources.relentlessRage ?? 10);
    const dc = 10 + 5 * used;
    // Kuyruk 19: Cloud of Insects (efsanevi eylem): konsantrasyon save'ine dezavantaj.
    const roll = rollD20(target.effects?.some((e) => e.concDis) ? 'disadvantage' : 'normal', rollTag(rng, { kind: 'save', by: target.id, bonus: target.saves.con }));
    const extra = rollExtras(saveDice(target, 'con'), 'save', rollTag(rng, { by: target.id }));
    const total = roll.kept + target.saves.con + extrasTotal(extra);
    const hp = 2 * target.level;
    effects.push({ kind: 'relentless_rage', dc, natural: roll.kept, total, success: total >= dc, hp });
    if (total >= dc) hpAfter = Math.min(target.maxHp, hp);
  }

  // Kuyruk 19 (Orc Relentless Endurance): 0 HP'ye düşüp ölmeyen 1 HP'de kalır (uzun dinlenmede bir; `srdK19` savaş başı).
  if (hpAfter === 0 && target.hp > 0 && applied > 0 && target.traits?.includes('relentless-endurance') && (target.resources.relentlessEndurance ?? 0) > 0
    && applied - target.hp < target.maxHp) {
    effects.push({ kind: 'relentless_endurance' });
    hpAfter = 1;
  }

  // Yenilenme: 0 HP'de ama acid/fire ile engellenmediyse tur başında ayağa kalkabilir.
  if (hpAfter === 0 && target.regeneration > 0 && !blockedNow && !target.regenBlocked) {
    effects.push({ kind: 'regen_pending' });
  }

  // Konsantrasyon (SRD 5.2.1): hasar alan CON save yapar, DC 10 veya hasarın yarısı (en çok 30).
  // 0 HP'ye düşen yaratığın konsantrasyonu zaten biter (reducer).
  // Relentless Hunter (Ranger; Görev F): hasar Hunter's Mark konsantrasyonunu bozmaz.
  const relentless = target.traits?.includes('relentless-hunter') && spells.find((s) => s.name === target.concentration?.spell)?.mechanics.kind === 'mark';
  if (target.concentration && taken > 0 && hpAfter > 0 && !relentless) {
    const dc = Math.min(30, Math.max(10, Math.floor(taken / 2)));
    // Kuyruk 19: Cloud of Insects (efsanevi eylem): konsantrasyon save'ine dezavantaj.
    const roll = rollD20(target.effects?.some((e) => e.concDis) ? 'disadvantage' : 'normal', rollTag(rng, { kind: 'save', by: target.id, bonus: target.saves.con }));
    // Konsantrasyon CON save'i de save: zar eklentileri (Bless) eklenir.
    const extra = rollExtras(saveDice(target, 'con'), 'save', rollTag(rng, { by: target.id }));
    const total = roll.kept + target.saves.con + extrasTotal(extra);
    effects.push({ kind: 'concentration', spell: target.concentration.spell, dc, natural: roll.kept, total, success: total >= dc, ...(extra.length ? { extra } : {}) });
  }

  // Görev B3: hasar alınca etkinin kurtarma zarı (Hideous Laughter; avantajlı): başarıda etki biter (reducer).
  if (taken > 0 && hpAfter > 0) {
    for (const e of (target.effects ?? []).filter((x) => x.damageSave)) {
      const ds = e.damageSave as NonNullable<typeof e.damageSave>;
      const roll = rollD20(ds.advantage ? 'advantage' : 'normal', rollTag(rng, { kind: 'save', by: target.id, bonus: target.saves[ds.ability] }));
      const total = roll.kept + target.saves[ds.ability] + (target.auraSave ?? 0);
      effects.push({ kind: 'effect_save', effectId: e.id, name: e.name, dc: ds.dc, natural: roll.kept, total, success: total >= ds.dc });
    }
  }

  // Oyuncu karakterleri 0 HP'de ölmez: ölüm save'lerine başlar.
  // Çağrılmış yaratık 0 HP'de kaybolur (Görev R3; ölüm save'i yok).
  // Kuyruk 18 H1: yönetilen yaratık asıl tarafına göre (canavar ölüm save'i atmaz).
  if ((target.allegiance?.side ?? target.side) === 'party' && !target.civilian && !target.summon && applied > 0) {
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
