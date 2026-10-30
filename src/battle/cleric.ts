/**
 * Cleric özellikleri (Görev CLERIC; SRD 5.2.1, veriden: `data/class-features.json`, `data/subclasses.json`).
 * Kodda sınıf adı yok: özellikler etki türü (`FeatureEffect.kind`) ve işaretlerle (`traits`) çalışır.
 * - Divine Spark (`divineSpark`): Channel Divinity, eylem, 30 ft içinde bir yaratık: iyileştirme (zar + WIS) ya da
 *   CON save'li Necrotic/Radiant hasar (başarıda yarı). Zar sayısı seviyeyle (2: 1d8, 7: 2d8, 13: 3d8, 18: 4d8).
 * - Turn Undead (`turnUndead`): 30 ft içindeki her Undead WIS save; başarısızsa 1 dakika Frightened ve Incapacitated
 *   (hasar alınca biter). Sear Undead (`sear-undead` işareti): başarısız olanlara WIS değiştiricisi kadar d8 (en az 1)
 *   Radiant.
 * - Preserve Life (`preserveLife`): 30 ft içindeki Bloodied (yarı HP ve altı) yaratıklara 5 × seviye HP dağıtılır;
 *   kimse yarı HP'sinin üstüne çıkmaz. Dağıtım en yaralıdan başlar.
 * - Blessed Strikes: Divine Strike (`divine-strike`: turda bir silah isabetine +1d8, Improved ile 2d8; Necrotic ya da
 *   Radiant, hedefe daha çok işleyeni) ve Potent Spellcasting (`potent-spellcasting`: cantrip hasarına WIS).
 * - Life Domain: Disciple of Life (`disciple-of-life`), Blessed Healer (`blessed-healer`), Supreme Healing
 *   (`supreme-healing`) iyileştirme yolunda (`healBonus`, `healSelfAfter`). Saf.
 */
import { adjustDamage, applyHealing } from '../rules/damage';
import { resolveSave } from '../rules/attack';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance } from '../rules/hex';
import { usedThisTurn } from './classTraits';
import { damageProfile, fail, finish, isTargetable, type CommandResult } from './common';
import { damageEffects } from './damage-effects';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { turnKey } from './economy';
import { resourceLeft, type AttackOption, type BattleEvent, type BattleState, type Combatant, type ExtraDamage, type UsableFeature } from './types';

export type ClericUse = { feature: string; targetId?: string; choice?: string };
const has = (c: Combatant, trait: string) => !!c.traits?.includes(trait);

/** Menzil (ft) içinde mi (haritasız savaşta her zaman). */
function within(state: BattleState, a: Combatant, b: Combatant, ft: number): boolean {
  if (!state.map) return true;
  return !!a.pos && !!b.pos && distance(a.pos, b.pos) * 5 <= ft;
}

/** Seviye eşiklerinden zar sayısı ({"2":1,"7":2,…}). */
function diceAt(level: number, table: Record<string, number>): number {
  let n = 0;
  for (const [l, v] of Object.entries(table)) if (level >= Number(l)) n = Math.max(n, v);
  return Math.max(1, n);
}

/** Hedefe daha çok işleyen hasar türü (direnç/bağışıklık). */
function bestType(target: Combatant, types: string[], amount = 10): string {
  return [...types].sort((a, b) => adjustDamage(amount, b, damageProfile(target)).amount - adjustDamage(amount, a, damageProfile(target)).amount)[0] ?? types[0] ?? 'radiant';
}

const isUndead = (c: Combatant) => (c.creatureType ?? '').toLowerCase() === 'undead';

/** Kullanım sorunu (null: kullanılabilir). */
export function clericFeatureProblem(state: BattleState, actor: Combatant, f: UsableFeature, cmd: ClericUse): string | null {
  const e = f.effect;
  if (e.kind === 'divineSpark') {
    const t = cmd.targetId ? state.combatants[cmd.targetId] : undefined;
    if (!t) return 'Hedef seçmelisin.';
    if (!isTargetable(t)) return `${t.name} ayakta değil.`;
    if (!within(state, actor, t, e.rangeFt)) return `${t.name} ${e.rangeFt} ft'ten uzakta.`;
    if (cmd.choice && cmd.choice !== 'heal' && !e.types.includes(cmd.choice)) return 'Geçersiz seçim.';
    if ((cmd.choice ?? (t.side === actor.side ? 'heal' : '')) === 'heal' && t.hp >= t.maxHp) return `${t.name} zaten tam sağlıklı.`;
    return null;
  }
  if (e.kind === 'turnUndead') {
    return Object.values(state.combatants).some((c) => c.side !== actor.side && isUndead(c) && isTargetable(c) && within(state, actor, c, e.rangeFt))
      ? null : `${e.rangeFt} ft içinde Undead yok.`;
  }
  if (e.kind === 'preserveLife') {
    return preserveTargets(state, actor, e.rangeFt).length > 0 ? null : `${e.rangeFt} ft içinde yarı HP'nin altında (Bloodied) yaralı yok.`;
  }
  return null;
}

const preserveTargets = (state: BattleState, actor: Combatant, ft: number) => Object.values(state.combatants)
  .filter((c) => c.side === actor.side && !c.civilian && c.life !== 'dead' && c.hp < Math.floor(c.maxHp / 2) && !c.summon?.intangible && within(state, actor, c, ft));

/** Cleric özelliğini uygular (kaynak harcanmış sayılarak). */
export function executeClericFeature(state: BattleState, actor: Combatant, f: UsableFeature, cmd: ClericUse, rng: Rng | undefined): CommandResult {
  const why = clericFeatureProblem(state, actor, f, cmd);
  if (why) return fail(why);
  if (!rng) return fail('Zar gerekli.');
  const e = f.effect;
  const events: BattleEvent[] = [];
  if (f.resource) events.push({ type: 'feature_used', actorId: actor.id, feature: f.resource, remaining: resourceLeft(actor, f.resource) - 1 });
  const wis = actor.modifiers.wis;
  const dc = actor.spellSaveDc ?? 8 + actor.proficiency + wis;

  if (e.kind === 'divineSpark') {
    const t = state.combatants[cmd.targetId as string] as Combatant;
    const count = diceAt(actor.level, e.dice);
    const choice = cmd.choice ?? (t.side === actor.side ? 'heal' : bestType(t, e.types));
    if (choice === 'heal') {
      const amount = healDice(actor, `${count}d8`, rng) + wis;
      const hpAfter = applyHealing(t.hp, t.maxHp, Math.max(0, amount));
      events.push({ type: 'healed', actorId: actor.id, targetId: t.id, label: f.name, amount: hpAfter - t.hp, targetHpAfter: hpAfter });
      return finish(state, events);
    }
    events.push(saveDamageEvent(t, actor, f.name, e.save, dc, `${count}d8+${wis}`, choice, true, rng));
    return finish(state, events);
  }

  if (e.kind === 'turnUndead') {
    const targets = Object.values(state.combatants).filter((c) => c.side !== actor.side && isUndead(c) && isTargetable(c) && within(state, actor, c, e.rangeFt));
    const sear = has(actor, 'sear-undead') ? `${Math.max(1, wis)}d8` : null;
    const searRoll = sear ? rollDice(sear, rollTag(rng, { kind: 'damage', by: actor.id })) : null;
    for (const t of targets) {
      const save = resolveSave({ extra: saveDice(t, e.save), modifier: t.saves[e.save], dc, mode: saveMode('normal', t, e.save) }, rollTag(rng, { by: t.id }));
      const raw = !save.success && searRoll ? searRoll.total : 0;
      const adj = raw > 0 ? adjustDamage(raw, 'radiant', damageProfile(t)) : { amount: 0, note: null };
      const fx = damageEffects(t, adj.amount, 'radiant', false, rng);
      events.push({
        type: 'save_resolved', actorId: actor.id, targetId: t.id, label: f.name, ability: e.save, dc, mode: 'normal', reasons: [],
        d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
        damageRolls: raw > 0 ? searRoll?.rolls ?? [] : [], rawDamage: raw, appliedDamage: adj.amount, damageType: raw > 0 ? 'radiant' : '',
        damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: [],
        ...(save.extra ? { bonusDice: save.extra } : {}),
      });
      if (!save.success && fx.hpAfter > 0) {
        events.push({ type: 'effect_added', targetId: t.id, effect: {
          id: `${f.key}`, name: f.name, sourceId: actor.id, until: state.round + e.rounds - 1, grants: e.conditions, breakOnDamage: true, icon: '✝',
        } });
      }
    }
    return finish(state, events);
  }

  if (e.kind === 'preserveLife') {
    let pool = e.perLevel * actor.level;
    const list = preserveTargets(state, actor, e.rangeFt).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    for (const t of list) {
      if (pool <= 0) break;
      const give = Math.min(pool, Math.floor(t.maxHp / 2) - Math.max(0, t.hp));
      if (give <= 0) continue;
      pool -= give;
      const hpAfter = applyHealing(t.hp, t.maxHp, give);
      events.push({ type: 'healed', actorId: actor.id, targetId: t.id, label: f.name, amount: hpAfter - t.hp, targetHpAfter: hpAfter });
    }
    return finish(state, events);
  }
  return fail('Bu özellik yok.');
}

/** Save'li hasar olayı (başarıda yarı). */
function saveDamageEvent(t: Combatant, actor: Combatant, label: string, ability: 'con' | 'wis', dc: number, expr: string, type: string, half: boolean, rng: Rng): BattleEvent {
  const save = resolveSave({ extra: saveDice(t, ability), modifier: t.saves[ability], dc, mode: saveMode('normal', t, ability) }, rollTag(rng, { by: t.id }));
  const d = rollDice(expr, rollTag(rng, { kind: 'damage', by: actor.id }));
  const raw = Math.max(0, save.success ? (half ? Math.floor(d.total / 2) : 0) : d.total);
  const adj = raw > 0 ? adjustDamage(raw, type, damageProfile(t)) : { amount: 0, note: null };
  const fx = damageEffects(t, adj.amount, type, false, rng);
  return {
    type: 'save_resolved', actorId: actor.id, targetId: t.id, label, ability, dc, mode: 'normal', reasons: [],
    d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
    damageRolls: d.rolls, rawDamage: raw, appliedDamage: adj.amount, damageType: type, damageNote: adj.note,
    targetHpAfter: fx.hpAfter, effects: fx.effects, conditionsAdded: [], ...(save.extra ? { bonusDice: save.extra } : {}),
  };
}

/** İyileştirme zarı: Supreme Healing'de zar atılmaz, en yüksek değer. */
export function healDice(actor: Combatant, expr: string, rng: Rng): number {
  if (has(actor, 'supreme-healing')) {
    const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(expr.replace(/\s/g, ''));
    if (m) return Number(m[1]) * Number(m[2]) + Number(m[3] ?? 0);
  }
  return rollDice(expr, rollTag(rng, { kind: 'heal', by: actor.id })).total;
}

/** Disciple of Life: slotla yapılan iyileştirme büyüsüne 2 + slot seviyesi. */
export const healBonus = (actor: Combatant, slotLevel: number | null): number =>
  has(actor, 'disciple-of-life') && slotLevel ? 2 + slotLevel : 0;

/** Blessed Healer: slotla başkasını iyileştirince büyücü 2 + slot seviyesi HP kazanır (olay ya da boş). */
export function healSelfAfter(actor: Combatant, slotLevel: number | null, healedOthers: boolean, label: string): BattleEvent[] {
  if (!has(actor, 'blessed-healer') || !slotLevel || !healedOthers || actor.hp <= 0 || actor.hp >= actor.maxHp) return [];
  const hpAfter = applyHealing(actor.hp, actor.maxHp, 2 + slotLevel);
  return [{ type: 'healed', actorId: actor.id, targetId: actor.id, label: `${label} (Blessed Healer)`, amount: hpAfter - actor.hp, targetHpAfter: hpAfter }];
}

/** Potent Spellcasting: cantrip hasarına WIS değiştiricisi (cantrip ölçeği olan hasar büyüleri). */
export const cantripBonus = (actor: Combatant): number => (has(actor, 'potent-spellcasting') ? Math.max(0, actor.modifiers.wis) : 0);

/** Divine Strike: turda bir silah isabetinde ek zar (Improved Blessed Strikes ile 2d8); yoksa null. */
export function divineStrikeHit(state: BattleState, actor: Combatant, target: Combatant, option: AttackOption, critical: boolean, rng: Rng):
  { extra: ExtraDamage; traitTurns: Record<string, string> } | null {
  if (!has(actor, 'divine-strike') || option.spell || usedThisTurn(state, actor, 'divine-strike')) return null;
  const type = bestType(target, ['necrotic', 'radiant']);
  const d = rollDice(has(actor, 'improved-blessed-strikes') ? '2d8' : '1d8', rollTag(rng, { kind: 'damage', by: actor.id }), critical);
  const adj = adjustDamage(d.total, type, damageProfile(target));
  return { extra: { label: 'Divine Strike', rolls: d.rolls, raw: d.total, applied: adj.amount, type, note: adj.note }, traitTurns: { 'divine-strike': turnKey(state) } };
}
