/**
 * Görev CLERIC: hedef seçiminden önce ve hasardan sonra çalışan koruma büyüleri (SRD 5.2.1).
 * - Sanctuary: korunan yaratığı saldırı ya da hasar/durum veren büyüyle hedef alan düşman önce WIS save yapar (DC
 *   büyücününki); başarısızsa saldırı ya da büyü boşa gider (eylem/saldırı harcanır, büyü yuvası harcanmaz). Alan
 *   etkileri etkilenmez. Korunan saldırınca, büyü yapınca ya da hasar verince biter (`breakOnAct`).
 * - Warding Bond: bağlı hedef her hasar aldığında büyücü aynı miktarda hasar alır (`bond_damage`; her komuttan sonra,
 *   her hasar yolunda); büyücü 0 HP'ye düşünce ya da aralarında 60 ft'ten fazla olunca biter.
 * Saf; `execute` çağırır.
 */
import { spells } from '../data';
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance } from '../rules/hex';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { turnKey } from './economy';
import { ruleVersion } from './ruleVersion';
import type { BattleEvent, BattleState, Command, Combatant } from './types';

const ATTACKS = new Set(['attack', 'offhand_attack', 'bonus_strike', 'monster_attack', 'multiattack', 'horde_breaker', 'haste_action']);

/** Komutun hedef aldığı yaratık(lar) (saldırı ya da zararlı tek/çok hedefli büyü); alan ve dost büyüleri hariç. */
function targetsOf(state: BattleState, cmd: Command): string[] {
  if (ATTACKS.has(cmd.type) && 'targetId' in cmd && typeof cmd.targetId === 'string') return [cmd.targetId];
  if (cmd.type !== 'cast_spell') return [];
  const spell = spells.find((s) => s.name === cmd.spellName);
  const m = spell?.mechanics;
  if (!m || !spell || cmd.targetHex || spell.area) return [];
  const harmful = m.kind === 'attack' || m.kind === 'save' || m.kind === 'auto' || (m.kind === 'effect' && m.effect?.side === 'enemy');
  if (!harmful) return [];
  return [...(cmd.targetId ? [cmd.targetId] : []), ...(cmd.targetIds ?? [])];
}

/** Sanctuary: korunan hedef varsa saldıranın save'i; başarısızsa `blocked` (komut çalışmaz, yalnızca bu olay). */
export function sanctuaryCheck(state: BattleState, cmd: Command, rng: Rng): { events: BattleEvent[]; blocked: boolean; refused?: string } | null {
  if (!('actorId' in cmd)) return null;
  const attacker = state.combatants[cmd.actorId];
  if (!attacker) return null;
  // Kuyruk A6 (sürüm 35): save'i kaçıran saldırı ya da büyü boşa gitmez, saldıran yeni bir hedef seçer (SRD "either
  // choose a new target or lose the attack or spell"); aynı korunana bu tur yeniden yönelemez.
  const v35 = ruleVersion(state) >= 35;
  for (const id of targetsOf(state, cmd)) {
    const t = state.combatants[id];
    const ward = t?.effects?.find((e) => e.sanctuary);
    if (!t || !ward?.sanctuary || t.side === attacker.side) continue;
    if (v35 && attacker.sanctuaryLost?.turn === turnKey(state) && attacker.sanctuaryLost.ids.includes(t.id)) {
      return { events: [], blocked: true, refused: `${t.name} Sanctuary ile korunuyor: bu tur başka bir hedef seç.` };
    }
    const save = resolveSave({ extra: saveDice(attacker, 'wis'), modifier: attacker.saves.wis, dc: ward.sanctuary.dc, mode: saveMode('normal', attacker, 'wis') },
      rollTag(rng, { by: attacker.id, kind: 'save' }));
    const ev: BattleEvent = { type: 'sanctuary_save', actorId: attacker.id, targetId: t.id, label: ward.name, dc: ward.sanctuary.dc,
      d20: save.d20?.rolls ?? [], total: save.total ?? 0, success: save.success, ...(v35 ? { retarget: turnKey(state) } : {}) };
    return { events: [ev], blocked: !save.success };
  }
  return null;
}

const pool = (c: Combatant) => Math.max(0, c.hp) + (c.tempHp ?? 0);

/** Warding Bond: komutun sonunda bağlı hedeflerin aldığı hasar büyücüye; bağı bitiren durumlar. */
export function bondEvents(before: BattleState, after: BattleState, rng: Rng): BattleEvent[] {
  const events: BattleEvent[] = [];
  for (const t of Object.values(after.combatants)) {
    for (const e of t.effects ?? []) {
      if (!e.bondTo) continue;
      const caster = after.combatants[e.bondTo];
      const was = before.combatants[t.id];
      const lost = was && was.effects?.some((x) => x.id === e.id) ? pool(was) - pool(t) : 0;
      if (caster && lost > 0 && caster.hp > 0) {
        const fx = damageEffects(caster, lost, '', false, rng);
        events.push({ type: 'bond_damage', targetId: caster.id, fromId: t.id, label: e.name, amount: lost, targetHpAfter: fx.hpAfter, effects: fx.effects });
      }
      const far = !!after.map && !!caster?.pos && !!t.pos && distance(caster.pos, t.pos) * 5 > 60;
      const casterDown = !caster || (events.find((x) => x.type === 'bond_damage' && x.targetId === caster.id && x.targetHpAfter <= 0) !== undefined) || caster.hp <= 0;
      if (far || casterDown) events.push({ type: 'effect_ended', targetId: t.id, effectId: e.id, name: e.name, reason: 'expired' });
    }
  }
  return events;
}

/**
 * Kuyruk A6 (sürüm 35; Bestow Curse hasar seçeneği `curseDamage.spells`): lanetleyenin save'li büyüsü lanetliye hasar
 * verince ek zar (saldırı isabetleri `hitExtras` yolundan). Komut sonunda, hedef başına bir kez.
 */
export function curseSpellEvents(state: BattleState, events: BattleEvent[], rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  const done = new Set<string>();
  for (const ev of events) {
    if (ev.type !== 'save_resolved' || ev.appliedDamage <= 0 || done.has(ev.targetId)) continue;
    const t = state.combatants[ev.targetId];
    const curse = t?.effects?.find((e) => e.curseDamage?.spells && e.sourceId === ev.actorId);
    if (!t || !curse?.curseDamage || t.hp <= 0) continue;
    done.add(t.id);
    const d = rollDice(curse.curseDamage.dice, rollTag(rng, { kind: 'damage', by: ev.actorId }));
    const adj = adjustDamage(d.total, curse.curseDamage.type, t);
    const fx = damageEffects(t, adj.amount, curse.curseDamage.type, false, rng);
    out.push({ type: 'extra_damage', actorId: ev.actorId, targetId: t.id, label: curse.name, rolls: d.rolls, raw: d.total, applied: adj.amount,
      damageType: curse.curseDamage.type, damageNote: adj.note, targetHpAfter: fx.hpAfter, effects: fx.effects });
  }
  return out;
}
