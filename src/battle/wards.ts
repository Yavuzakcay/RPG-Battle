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
import { rollTag, type Rng } from '../rules/dice';
import { distance } from '../rules/hex';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
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
export function sanctuaryCheck(state: BattleState, cmd: Command, rng: Rng): { events: BattleEvent[]; blocked: boolean } | null {
  if (!('actorId' in cmd)) return null;
  const attacker = state.combatants[cmd.actorId];
  if (!attacker) return null;
  for (const id of targetsOf(state, cmd)) {
    const t = state.combatants[id];
    const ward = t?.effects?.find((e) => e.sanctuary);
    if (!t || !ward?.sanctuary || t.side === attacker.side) continue;
    const save = resolveSave({ extra: saveDice(attacker, 'wis'), modifier: attacker.saves.wis, dc: ward.sanctuary.dc, mode: saveMode('normal', attacker, 'wis') },
      rollTag(rng, { by: attacker.id, kind: 'save' }));
    const ev: BattleEvent = { type: 'sanctuary_save', actorId: attacker.id, targetId: t.id, label: ward.name, dc: ward.sanctuary.dc,
      d20: save.d20?.rolls ?? [], total: save.total ?? 0, success: save.success };
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
