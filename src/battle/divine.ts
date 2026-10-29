/**
 * Kutsal güçler (Görev P-Paladin; SRD 5.2.1, veriden: `data/class-features.json`, `data/spells.json`):
 * - `use_feature`: savaşta kullanılan sınıf özelliği. İyileştirme havuzu (Lay On Hands: bonus eylem, dokunuş,
 *   havuzdan istenen kadar HP; `cureCost` puanla Poisoned kalkar) ya da süren güçlendirme (Sacred Weapon: Attack
 *   eylemiyle, Channel Divinity harcar; yakın dövüş silah saldırılarına CHA, Radiant hasar).
 * - Smite büyüleri (Divine Smite, Searing Smite, Shining Smite): bu tur yakın dövüş silahıyla vurulan hedefe isabetin
 *   ek hasarı; vuruş kritikse zarlar iki kat. Divine Smite Fiend/Undead'e +1d8.
 * - Koruma (konsantrasyon hedefinde `ward`): Shield of Faith +2 AC, Shining Smite (hedefe saldırılar avantajlı),
 *   Protection from Evil and Good (belli türlerin saldırıları dezavantajlı).
 * - Süren güçlendirmeler (`buffs`): Divine Favor (+1d4 radiant), Magic Weapon (+1), Sacred Weapon.
 */
import { spells } from '../data';
import { abilityModifier } from '../rules/abilities';
import { adjustDamage, applyHealing } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance } from '../rules/hex';
import type { ModeSource } from '../rules/modes';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { heightOf } from './cover';
import { damageEffects } from './damage-effects';
import { timedCondition } from './durations';
import { resourceLeft, type AttackOption, type BattleEvent, type BattleState, type Buff, type Combatant, type UsableFeature } from './types';

type UseFeature = { feature: string; targetId?: string; amount?: number; cure?: boolean };

const spellOf = (name: string | undefined) => spells.find((s) => s.name === name);

/** Savaşçının bu özelliği (kimliği `sınıf:özellik`). */
export const usableFeature = (actor: Combatant, key: string): UsableFeature | undefined =>
  (actor.features ?? []).find((f) => f.key === key);

/** Dokunuş: kendisi ya da bitişik (haritasız savaşta aynı yükseklik). */
function touching(state: BattleState, a: Combatant, b: Combatant): boolean {
  if (a.id === b.id) return true;
  if (state.map) return !!a.pos && !!b.pos && distance(a.pos, b.pos) <= 1;
  return heightOf(state, a) === heightOf(state, b);
}

/** Özellik şu an kullanılabilir mi (hedef ve miktar dahil): sorun yoksa null. */
export function featureProblem(state: BattleState, actor: Combatant, cmd: UseFeature): string | null {
  const f = usableFeature(actor, cmd.feature);
  if (!f) return 'Bu özellik yok.';
  const left = f.resource ? resourceLeft(actor, f.resource) : Infinity;
  if (left <= 0) return `${f.name}: kullanım kalmadı.`;
  if (f.when === 'attackAction' && actor.economy.action && actor.economy.attacksLeft <= 0) {
    return `${f.name} Attack eylemiyle kullanılır (eylem başka bir şeye harcandı).`;
  }
  const e = f.effect;
  if (e.kind === 'healPool') {
    const target = cmd.targetId ? state.combatants[cmd.targetId] : actor;
    if (!target) return 'Hedef bulunamadı.';
    if (target.side !== actor.side) return 'Yalnızca kendine ya da bir dostuna.';
    if (target.life === 'dead') return `${target.name} öldü.`;
    if (e.touch && !touching(state, actor, target)) return 'Dokunmak için bitişik olmalısın.';
    const amount = cmd.amount ?? 0;
    const cost = amount + (cmd.cure ? e.cureCost : 0);
    if (amount < 0 || !Number.isInteger(amount)) return 'Geçersiz miktar.';
    if (cost <= 0) return 'İyileştirilecek miktar seçmelisin.';
    if (cost > left) return `Havuzda ${left} puan var.`;
    if (cmd.cure && !e.cures.some((c) => target.conditions.includes(c))) return `${target.name} üzerinde kaldırılacak durum yok (${e.cures.join(', ')}).`;
    if (!cmd.cure && target.hp >= target.maxHp) return `${target.name} zaten tam sağlıklı.`;
  }
  return null;
}

/** Bir özelliğin süren güçlendirmesi (Sacred Weapon): yetenek bonusu en az `min`. */
function featureBuff(actor: Combatant, f: UsableFeature, round: number): Buff | null {
  const e = f.effect;
  if (e.kind !== 'buff') return null;
  const mod = actor.modifiers[e.attackBonusAbility] ?? abilityModifier(10);
  return { source: f.name, by: actor.id, until: round + e.rounds - 1, attackBonus: Math.max(e.min, mod), meleeOnly: true, ...(e.radiant ? { radiant: true } : {}) };
}

/** `use_feature` komutu. Eylem ekonomisi `economy.ts`'te (özelliğin türüne göre). */
export function executeUseFeature(state: BattleState, actor: Combatant, cmd: UseFeature, rng?: Rng): CommandResult {
  const why = featureProblem(state, actor, cmd);
  if (why) return fail(why);
  const f = usableFeature(actor, cmd.feature) as UsableFeature;
  const e = f.effect;
  const events: BattleEvent[] = [];
  if (e.kind === 'healPool') {
    const target = (cmd.targetId ? state.combatants[cmd.targetId] : actor) as Combatant;
    const amount = cmd.amount ?? 0;
    const cost = amount + (cmd.cure ? e.cureCost : 0);
    events.push({ type: 'feature_used', actorId: actor.id, feature: f.resource as string, remaining: resourceLeft(actor, f.resource as string) - cost });
    if (cmd.cure) {
      const c = e.cures.find((x) => target.conditions.includes(x)) as string;
      events.push({ type: 'condition_changed', targetId: target.id, condition: c, present: false, reason: f.name });
    }
    if (amount > 0) {
      const hpAfter = applyHealing(target.hp, target.maxHp, amount);
      events.push({ type: 'healed', actorId: actor.id, targetId: target.id, label: f.name, amount: hpAfter - target.hp, targetHpAfter: hpAfter });
    }
    return finish(state, events);
  }
  // Görev F: kendine geçici HP (Tireless) ya da sonraki turunun sonuna dek durum (Nature's Veil: Invisible).
  if (e.kind === 'tempHp' || e.kind === 'condition') {
    if (f.resource) events.push({ type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: resourceLeft(actor, f.resource) - 1 });
    if (e.kind === 'tempHp') {
      if (!rng) return fail('Zar gerekli.');
      const amount = Math.max(1, rollDice(e.dice, rollTag(rng, { by: actor.id, kind: 'heal' })).total + Math.max(e.min, actor.modifiers[e.ability]));
      events.push({ type: 'temp_hp', targetId: actor.id, amount, label: f.name });
    } else {
      events.push(timedCondition(state, actor.id, { condition: e.condition, owner: 'target', end: 'turnEnd' }, actor.id, f.name));
    }
    return finish(state, events);
  }
  const buff = featureBuff(actor, f, state.round) as Buff;
  if (f.resource) events.push({ type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: resourceLeft(actor, f.resource) - 1 });
  events.push({ type: 'buff_added', targetId: actor.id, buff });
  return finish(state, events);
}

// ------------------------------------------------------------------ süren etkiler

/** Geçerli güçlendirmeler (süresi dolmamış). */
export const activeBuffs = (state: BattleState, c: Combatant): Buff[] => (c.buffs ?? []).filter((b) => b.until >= state.round);

/** Silah saldırısına güçlendirmeler: saldırı/hasar bonusu ve Radiant seçeneği (saldırı seçeneği güncellenir). */
export function withBuffs(state: BattleState, actor: Combatant, option: AttackOption): AttackOption {
  if (option.spell) return option;
  const buffs = activeBuffs(state, actor).filter((b) => !b.meleeOnly || !option.ranged);
  if (buffs.length === 0) return option;
  const attack = buffs.reduce((n, b) => n + (b.attackBonus ?? 0), 0);
  const damage = buffs.reduce((n, b) => n + (b.damageBonus ?? 0), 0);
  let dmg = option.damage;
  if (damage !== 0) {
    const m = /^(\d+d\d+)([+-]\d+)?$/.exec(option.damage.replace(/\s/g, ''));
    if (m) { const bonus = Number(m[2] ?? 0) + damage; dmg = `${m[1]}${bonus === 0 ? '' : bonus > 0 ? `+${bonus}` : bonus}`; }
  }
  const radiant = buffs.some((b) => b.radiant);
  return { ...option, attackBonus: option.attackBonus + attack, damage: dmg, ...(radiant ? { radiantOption: true } : {}) };
}

/** Radiant seçeneği: hedef silahın türüne dirençli ya da bağışıksa ve Radiant'a değilse Radiant. */
export function bestDamageType(option: AttackOption, target: Combatant): string | undefined {
  if (!option.radiantOption || !option.damageType) return option.damageType;
  const profile = { resistances: target.resistances, immunities: target.immunities, vulnerabilities: target.vulnerabilities };
  return adjustDamage(10, 'radiant', profile).amount > adjustDamage(10, option.damageType, profile).amount ? 'radiant' : option.damageType;
}

/** Güçlendirmelerin isabetteki ek zarları (Divine Favor), silah saldırısında. */
export function buffExtraDice(state: BattleState, actor: Combatant): Array<{ label: string; expr: string; type: string }> {
  return activeBuffs(state, actor).filter((b) => b.extraDamage).map((b) => ({ label: b.source, expr: b.extraDamage as string, type: b.damageType ?? '' }));
}

/** Hedefi koruyan konsantrasyon etkileri (Shield of Faith, Shining Smite, Protection from Evil and Good). */
export function wardsOn(state: BattleState, target: Combatant): Array<{ spell: string; ward: NonNullable<ReturnType<typeof spellOf>>['mechanics']['ward'] }> {
  const out: Array<{ spell: string; ward: NonNullable<ReturnType<typeof spellOf>>['mechanics']['ward'] }> = [];
  for (const c of Object.values(state.combatants)) {
    const conc = c.concentration;
    if (!conc || conc.targetId !== target.id) continue;
    const ward = spellOf(conc.spell)?.mechanics.ward;
    if (ward) out.push({ spell: conc.spell, ward });
  }
  return out;
}

/** Hedefin AC'si (koruma etkileri dahil). */
export function effectiveAc(state: BattleState, target: Combatant): number {
  // Shield (Görev R1): sonraki turunun başına dek işaret.
  const shield = Math.max(0, ...(target.marks ?? []).filter((m) => m.kind === 'shield').map((m) => m.ac ?? 0));
  return target.ac + shield + wardsOn(state, target).reduce((n, w) => n + (w.ward?.ac ?? 0), 0);
}

/** Hedefe yapılan saldırıya koruma etkilerinden gelen avantaj/dezavantaj. */
export function wardSources(state: BattleState, attacker: Combatant, target: Combatant): ModeSource[] {
  const out: ModeSource[] = [];
  for (const { spell, ward } of wardsOn(state, target)) {
    if (ward?.advantageAgainst) out.push({ effect: 'advantage', reason: spell });
    if (attacker.creatureType && ward?.disadvantageFromTypes?.includes(attacker.creatureType)) out.push({ effect: 'disadvantage', reason: spell });
  }
  return out;
}

// ------------------------------------------------------------------ smite

/** Smite büyüsü bu hedefe yapılabilir mi: sorun yoksa null. */
export function smiteProblem(actor: Combatant, targetId: string | undefined): string | null {
  const hit = actor.economy.meleeHit;
  if (!hit) return 'Önce bu tur yakın dövüş silahıyla vurmalısın.';
  if (targetId && hit.targetId !== targetId) return 'Smite yalnızca bu tur yakın dövüş silahıyla vurduğun hedefe.';
  return null;
}

/** Smite hasarı: büyünün zarı + yukarı slot + tür ek zarı; kritik vuruşta zar sayısı iki kat. */
export function smiteEvents(
  state: BattleState, actor: Combatant, target: Combatant, spellName: string, slotLevel: number, rng: Rng,
): BattleEvent[] {
  const spell = spellOf(spellName);
  const m = spell?.mechanics;
  if (!spell || !m?.damage) return [];
  const crit = actor.economy.meleeHit?.critical === true;
  const dice: string[] = [m.damage];
  const up = slotLevel - spell.level;
  if (up > 0 && m.upcast?.dice && m.upcast.applied) for (let i = 0; i < up; i++) dice.push(m.upcast.dice);
  if (m.vsTypes && target.creatureType && m.vsTypes.types.includes(target.creatureType)) dice.push(m.vsTypes.dice);
  const rolls: number[] = [];
  let total = 0;
  for (const d of dice) {
    const r = rollDice(d, rollTag(rng, { kind: 'damage', by: actor.id }), crit);
    rolls.push(...r.rolls);
    total += r.total;
  }
  const adj = adjustDamage(total, m.damageType, { resistances: target.resistances, immunities: target.immunities, vulnerabilities: target.vulnerabilities });
  const fx = damageEffects(target, adj.amount, m.damageType ?? '', crit, rng);
  return [{
    type: 'attack_resolved', actorId: actor.id, targetId: target.id, label: `${spell.name}${crit ? ' (kritik)' : ''}`,
    mode: 'normal', reasons: [], d20: [], natural: 0, total: 0, targetAc: target.ac, hit: true, critical: false, fumble: false,
    damageRolls: rolls, rawDamage: total, appliedDamage: adj.amount, damageType: m.damageType ?? '', damageNote: adj.note,
    targetHpAfter: fx.hpAfter, effects: fx.effects,
  }];
}

/** Hedef alınabilir mi (smite ve koruma büyüleri için). */
export const canTarget = (c: Combatant | undefined): c is Combatant => !!c && isTargetable(c);
