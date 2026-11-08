/**
 * Kuyruk K53 S5: aura altyapısı (GM anahtarı `auraCore`, kural sürümü 24; parametreler `data/hareket.json` `aura`).
 * Aura, sahibinin süren etkisinde `aura` alanıdır (sahiple birlikte hareket eder; etki bitince biter):
 * yarıçap (altıgen), hedef süzgeci (düşman/dost/hepsi/kendisi hariç), tetik (tur başı, tur sonu, girince, pasif), etki
 * (hasar, durum, save bonusu, durum bağışıklığı, can yenileyemez, ölüm kurtulma dezavantajı), kurtulma ve DC.
 * - Aynı etki birden çok auradan gelirse en güçlüsü uygulanır (toplanmaz); aynı aura aynı yaratığa tur başına bir kez
 *   işler (`trait_turn` işareti `aura:<id>`).
 * - Cesaret ortak kuralı: kurtulmayı başaran yaratık o etkiye `cesaretTur` tur bağışık (`resistImmunity*`; imza
 *   alt sınıfları aynı sayacı kullanır).
 * - Pasif etkiler (save bonusu, bağışıklık, can yenileyemez, ölüm save dezavantajı) `syncAuras` içinde savaşçıya yazılır;
 *   save bonusu Aura of Protection ile aynı "en güçlüsü" kuralıyla birleşir.
 * Saf; `rng` enjekte.
 */
import motion from '../../data/hareket.json';
import { globalRule } from './ruleControl';
import { ruleVersion } from './ruleVersion';
import { MOTION_VERSION } from './motion';
import { auraGap } from './body';
import { damageEffect } from './maprules';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { turnKey } from './economy';
import { isIncapacitated } from '../rules/conditions';
import { resolveSave } from '../rules/attack';
import { rollTag, type Rng } from '../rules/dice';
import type { Ability } from '../rules/abilities';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant } from './types';

export type AuraTrigger = 'turnStart' | 'turnEnd' | 'enter' | 'passive';
export type AuraEffect =
  | { kind: 'damage'; dice: string; type: string; half?: boolean }
  | { kind: 'condition'; condition: string }
  | { kind: 'saveBonus'; amount: number }
  | { kind: 'conditionImmune'; conditions: string[] }
  /** Görev P7: pasif direnç ve kurtulma dezavantajı. */
  | { kind: 'resist'; types: string[] }
  | { kind: 'saveDis' }
  | { kind: 'noHeal' }
  | { kind: 'deathSaveDis' }
  /** Kuyruk K54: tur başı Motivasyon (Moral tam modu açıkken; en çoğu aşmaz). */
  | { kind: 'moral'; amount: number }
  /** Kuyruk K54: ölüm save avantajı ve tur başı geçici can (Dar Gün Aurası; `belowHalf`: yalnız yarı canın altındakilere). */
  | { kind: 'deathSaveAdv'; belowHalf?: boolean }
  | { kind: 'tempHp'; amount: number; belowHalf?: boolean }
  /** Kuyruk K54b: başarısız kurtulmada süren etki (`rounds` tur) ve isteğe bağlı hasar (Dunganga Çağrısı: Uykulu + 2d10). */
  | { kind: 'effect'; effect: { name: string; icon?: string } & Record<string, unknown>; rounds: number; dice?: string; type?: string };
export interface AuraSpec {
  id: string;
  name: string;
  radius: number;
  filter: 'enemies' | 'allies' | 'all' | 'others';
  trigger: AuraTrigger;
  effect: AuraEffect;
  save?: { ability: Ability; dc?: number };
  /** Kurtulmayı başaran bu auraya N tur bağışık (Cesaret); yoksa `aura.cesaretTur` (0 = yok). */
  cesaret?: number;
  /** Kuyruk K54b: yalnız bu durumdaki yaratıklar (Kâbus: Frightened). */
  requires?: string;
}

export const AURA = motion.aura;
export const auraCoreOn = (s: BattleState): boolean => ruleVersion(s) >= MOTION_VERSION && !!globalRule(s, 'auraCore');

/** Cesaret (direnç bağışıklığı) sayacının kimliği: `<önek>:cesaret:<özellik>:<sahip>`. */
export const resistImmunityId = (prefix: string, key: string, ownerId: string) => `${prefix}:cesaret:${key}:${ownerId}`;
export const hasResistImmunity = (c: Combatant, prefix: string, key: string, ownerId: string) => !!c.effects?.some((e) => e.id === resistImmunityId(prefix, key, ownerId));
/** Kurtulmayı başaran hedefe N tur bağışıklık etkisi. */
export function resistImmunityEvent(state: BattleState, target: Combatant, prefix: string, key: string, owner: Combatant, rounds: number): BattleEvent {
  return { type: 'effect_added', targetId: target.id, effect: { id: resistImmunityId(prefix, key, owner.id), name: 'Cesaret', sourceId: owner.id, until: state.round + rounds, icon: '🛡' } };
}

/** Savaştaki etkin auralar (sahibi ayakta, Incapacitated değil). */
function activeAuras(state: BattleState): Array<{ owner: Combatant; spec: AuraSpec }> {
  const out: Array<{ owner: Combatant; spec: AuraSpec }> = [];
  for (const c of Object.values(state.combatants)) {
    if (c.hp <= 0 || !c.pos || isIncapacitated(c.conditions)) continue;
    for (const e of c.effects ?? []) for (const a of [...(e.aura ? [e.aura] : []), ...(e.auras ?? [])]) out.push({ owner: c, spec: a });
  }
  return out;
}
const passes = (spec: AuraSpec, owner: Combatant, v: Combatant) =>
  spec.filter === 'enemies' ? v.side !== owner.side : spec.filter === 'allies' ? v.side === owner.side : spec.filter === 'others' ? v.id !== owner.id : true;

/** Bu yaratığı (isteğe bağlı başka konumda) kapsayan auralar. */
export function aurasOn(state: BattleState, v: Combatant, at: Offset | null = v.pos): Array<{ owner: Combatant; spec: AuraSpec }> {
  if (!at || !auraCoreOn(state)) return [];
  const probe = at === v.pos ? v : { ...v, pos: at };
  return activeAuras(state).filter(({ owner, spec }) => passes(spec, owner, v) && (!spec.requires || v.conditions.includes(spec.requires)) && auraGap(state, owner, probe) <= spec.radius);
}

/** Etki gücü (en güçlüsü seçimi için): hasarda ortalama zar, bonusta miktar, diğerlerinde 1. */
function power(e: AuraEffect): number {
  if (e.kind === 'damage') { const m = /^(\d+)d(\d+)(?:\s*\+\s*(\d+))?$/.exec(e.dice.replace(/\s/g, '')); return m ? Number(m[1]) * (Number(m[2]) + 1) / 2 + Number(m[3] ?? 0) : 0; }
  if (e.kind === 'saveBonus') return e.amount;
  if (e.kind === 'effect' && e.dice) return power({ kind: 'damage', dice: e.dice, type: e.type ?? '' });
  return 1;
}
const effKey = (e: AuraEffect) => (e.kind === 'damage' ? `damage:${e.type}` : e.kind === 'condition' ? `condition:${e.condition}` : e.kind === 'effect' ? `effect:${e.effect.name}` : e.kind);

/** Her etki türünden en güçlüsü (toplanmaz). */
export function strongest(list: Array<{ owner: Combatant; spec: AuraSpec }>): Array<{ owner: Combatant; spec: AuraSpec }> {
  const best = new Map<string, { owner: Combatant; spec: AuraSpec }>();
  for (const x of list) {
    const k = `${x.spec.trigger}|${effKey(x.spec.effect)}`;
    const cur = best.get(k);
    if (!cur || power(x.spec.effect) > power(cur.spec.effect)) best.set(k, x);
  }
  return [...best.values()];
}

/** Pasif aura alanları (syncAuras): save bonusu, durum bağışıklığı, can yenileyemez, ölüm save dezavantajı. */
export function passiveAuraOf(state: BattleState, v: Combatant): { saveBonus: number; immune: string[]; noHeal: boolean; deathDis: boolean; deathAdv: boolean; resist: string[]; saveDis: boolean } {
  const list = strongest(aurasOn(state, v).filter((x) => x.spec.trigger === 'passive'));
  const out = { saveBonus: 0, immune: [] as string[], noHeal: false, deathDis: false, deathAdv: false, resist: [] as string[], saveDis: false };
  for (const { spec } of list) {
    const e = spec.effect;
    if (e.kind === 'saveBonus') out.saveBonus = Math.max(out.saveBonus, e.amount);
    else if (e.kind === 'conditionImmune') out.immune = [...new Set([...out.immune, ...e.conditions])];
    else if (e.kind === 'noHeal') out.noHeal = true;
    else if (e.kind === 'resist') out.resist = [...new Set([...out.resist, ...e.types])];
    else if (e.kind === 'saveDis') out.saveDis = true;
    else if (e.kind === 'deathSaveDis') out.deathDis = true;
    else if (e.kind === 'deathSaveAdv' && (!e.belowHalf || v.hp < v.maxHp / 2)) out.deathAdv = true;
  }
  return out;
}

/** Tetikli auraların olayları (tur başı/sonu ya da giriş): save, hasar/durum, Cesaret; aura başına turda bir kez. */
export function auraTriggerEvents(state: BattleState, victimId: string, trigger: 'turnStart' | 'turnEnd' | 'enter', rng: Rng, at?: Offset | null): BattleEvent[] {
  const v = state.combatants[victimId];
  if (!v || v.hp <= 0 || !auraCoreOn(state)) return [];
  const key = turnKey(state);
  const out: BattleEvent[] = [];
  for (const { owner, spec } of strongest(aurasOn(state, v, at ?? v.pos).filter((x) => x.spec.trigger === trigger))) {
    const mark = `aura:${spec.id}:${owner.id}`;
    if (v.traitTurns?.[mark] === key || hasResistImmunity(v, 'aura', spec.id, owner.id)) continue;
    out.push({ type: 'trait_turn', actorId: v.id, trait: mark, key });
    let failed = true;
    if (spec.save) {
      const dc = spec.save.dc ?? owner.spellSaveDc ?? 8 + (owner.proficiency ?? 2);
      const r = resolveSave({ extra: saveDice(v, spec.save.ability), modifier: v.saves[spec.save.ability], dc, mode: saveMode('normal', v, spec.save.ability) }, rollTag(rng, { by: v.id }));
      out.push({ type: 'map_note', text: `${v.name}: ${spec.name} ${spec.save.ability.toUpperCase()} save ${r.total}/${dc} — ${r.success ? 'başardı' : 'başaramadı'}` });
      failed = !r.success;
      const ces = spec.cesaret ?? AURA.cesaretTur;
      if (r.success && ces > 0 && (spec.effect.kind === 'condition' || spec.effect.kind === 'effect')) out.push(resistImmunityEvent(state, v, 'aura', spec.id, owner, ces));
    }
    const e = spec.effect;
    if (e.kind === 'damage' && (failed || e.half)) {
      const ev = damageEffect(v, 'auraCore', spec.name, { dice: e.dice, type: e.type }, rng);
      if (!failed && ev.type === 'map_effect' && ev.damage) {
        const half = Math.floor(ev.damage.applied / 2);
        ev.hpAfter = Math.max(0, v.hp - half);
        ev.damage = { ...ev.damage, applied: half };
      }
      out.push(ev);
    }
    if (e.kind === 'effect' && failed) {
      if (e.dice) out.push(damageEffect(v, 'auraCore', spec.name, { dice: e.dice, type: e.type ?? '' }, rng));
      const id = `aura:${spec.id}:${owner.id}`;
      out.push({ type: 'effect_added', targetId: v.id, effect: { ...e.effect, id, name: e.effect.name, sourceId: owner.id, until: state.round + e.rounds } as import('./types').ActiveEffect });
    }
    if (e.kind === 'condition' && failed && !v.conditions.includes(e.condition)) out.push({ type: 'map_effect', rule: 'auraCore', targetId: v.id, text: spec.name, addCondition: e.condition });
    // Kuyruk K54: tur başı Motivasyon (yalnız Moral tam modunda: savaşçıda moralMax) ve geçici can (yarı canın altındakilere).
    if (e.kind === 'moral' && v.moralMax !== undefined) {
      const now = v.moral ?? v.moralMax;
      const to = Math.min(v.moralMax, now + e.amount);
      if (to !== now) out.push({ type: 'moral_changed', targetId: v.id, delta: to - now, moral: to, reason: 'toparlama', byId: owner.id });
    }
    if (e.kind === 'tempHp' && (!e.belowHalf || v.hp < v.maxHp / 2) && e.amount > (v.tempHp ?? 0)) out.push({ type: 'temp_hp', targetId: v.id, amount: e.amount, label: spec.name });
  }
  return out;
}

/** Yürüyüş/itme/ışınlanma adımı: girilen (önceden dışında olunan) auraların giriş tetikleri. */
export function auraEnterEvents(state: BattleState, moverId: string, from: Offset | null, to: Offset | null, rng: Rng): BattleEvent[] {
  const v = state.combatants[moverId];
  if (!v || !to || !auraCoreOn(state)) return [];
  const before = new Set(aurasOn(state, v, from).map((x) => `${x.spec.id}:${x.owner.id}`));
  const fresh = aurasOn(state, v, to).some((x) => x.spec.trigger === 'enter' && !before.has(`${x.spec.id}:${x.owner.id}`));
  return fresh ? auraTriggerEvents(state, moverId, 'enter', rng, to) : [];
}
