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
import { gap } from './body';
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
  | { kind: 'noHeal' }
  | { kind: 'deathSaveDis' };
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
    for (const e of c.effects ?? []) if (e.aura) out.push({ owner: c, spec: e.aura });
  }
  return out;
}
const passes = (spec: AuraSpec, owner: Combatant, v: Combatant) =>
  spec.filter === 'enemies' ? v.side !== owner.side : spec.filter === 'allies' ? v.side === owner.side : spec.filter === 'others' ? v.id !== owner.id : true;

/** Bu yaratığı (isteğe bağlı başka konumda) kapsayan auralar. */
export function aurasOn(state: BattleState, v: Combatant, at: Offset | null = v.pos): Array<{ owner: Combatant; spec: AuraSpec }> {
  if (!at || !auraCoreOn(state)) return [];
  const probe = at === v.pos ? v : { ...v, pos: at };
  return activeAuras(state).filter(({ owner, spec }) => passes(spec, owner, v) && gap(state, owner, probe) <= spec.radius);
}

/** Etki gücü (en güçlüsü seçimi için): hasarda ortalama zar, bonusta miktar, diğerlerinde 1. */
function power(e: AuraEffect): number {
  if (e.kind === 'damage') { const m = /^(\d+)d(\d+)(?:\s*\+\s*(\d+))?$/.exec(e.dice.replace(/\s/g, '')); return m ? Number(m[1]) * (Number(m[2]) + 1) / 2 + Number(m[3] ?? 0) : 0; }
  if (e.kind === 'saveBonus') return e.amount;
  return 1;
}
const effKey = (e: AuraEffect) => (e.kind === 'damage' ? `damage:${e.type}` : e.kind === 'condition' ? `condition:${e.condition}` : e.kind);

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
export function passiveAuraOf(state: BattleState, v: Combatant): { saveBonus: number; immune: string[]; noHeal: boolean; deathDis: boolean } {
  const list = strongest(aurasOn(state, v).filter((x) => x.spec.trigger === 'passive'));
  const out = { saveBonus: 0, immune: [] as string[], noHeal: false, deathDis: false };
  for (const { spec } of list) {
    const e = spec.effect;
    if (e.kind === 'saveBonus') out.saveBonus = Math.max(out.saveBonus, e.amount);
    else if (e.kind === 'conditionImmune') out.immune = [...new Set([...out.immune, ...e.conditions])];
    else if (e.kind === 'noHeal') out.noHeal = true;
    else if (e.kind === 'deathSaveDis') out.deathDis = true;
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
      if (r.success && ces > 0 && spec.effect.kind === 'condition') out.push(resistImmunityEvent(state, v, 'aura', spec.id, owner, ces));
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
    if (e.kind === 'condition' && failed && !v.conditions.includes(e.condition)) out.push({ type: 'map_effect', rule: 'auraCore', targetId: v.id, text: spec.name, addCondition: e.condition });
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
