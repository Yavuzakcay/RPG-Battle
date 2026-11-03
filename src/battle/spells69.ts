/**
 * Kuyruk 19 (görev 3): 6.–9. seviye büyülerin motor kancaları (anahtar `spells69`, kural sürümü 16). Veri
 * `data/spells-69.json` (`scripts/k19-buyu-69.py`). Normal büyü yolu (slot, eylem, konsantrasyon, save'li hasar) çalıştıktan
 * sonra (`executeCast`) özel alanlar işlenir:
 * - `extraTargets` (Chain Lightning: birincil hedefin 30 ft'indeki 3 düşman daha save yapar),
 * - `dustAtZero` (Disintegrate: 0 HP'ye düşen toz olur), `notBelowOne` + `maxHpDrain` (Harm),
 * - `cures` (Heal: Blinded, Deafened, Poisoned biter), `riseZombie` (Finger of Death: ölen Humanoid zombi olur),
 * - `powerWord` (Stun: 150 HP ve altı Stunned, üstü bir tur hız 0; Kill: 100 HP ve altı ölür, üstü 12d12 Psychic;
 *   Heal: bütün HP + durumlar), `massHeal` (700 HP, en yaralıdan), `hpTiers` (Divine Word), `prismatic` (Prismatic Spray),
 *   `reverseGravity`, `timeStop` (art arda tur), `wish` (≤ 8. seviye büyüyü kopyalar),
 * - `spellGlobe` / `antimagic` (Globe of Invulnerability, Antimagic Field: içerideki yaratıklar dışarıdan gelen büyüden
 *   etkilenmez; Antimagic içinde büyü yapılamaz).
 */
import { distance, type Offset } from '../rules/hex';
import { rollDice, rollDie, rollTag, type Rng } from '../rules/dice';
import { spells, getMonster, type Spell } from '../data';
import { globalRule } from './ruleControl';
import { damageEffect, saveEffect } from './maprules';
import { applyEvents } from './reduce';
import { fail, type CommandResult } from './common';
import { monsterAttackEvents } from './monsters';
import { pickArea } from './areaAttack';
import { timedCondition } from './durations';
import { combatantFromMonster } from './create';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

type M = Spell['mechanics'] & {
  extraTargets?: number; extraWithinFt?: number; dustAtZero?: boolean; notBelowOne?: boolean; maxHpDrain?: boolean; cures?: string[];
  riseZombie?: boolean; powerWord?: 'stun' | 'kill' | 'heal'; massHeal?: number; hpTiers?: Array<[number, string]>; prismatic?: boolean;
  reverseGravity?: boolean; fallFt?: number; timeStop?: string; wish?: boolean;
};
const on = (s: BattleState) => !!globalRule(s, 'spells69');
const hexOf = (c: Combatant) => c.pos as Offset;
const ft = (a: Combatant, b: Combatant) => (a.pos && b.pos ? distance(a.pos, b.pos) * 5 : Infinity);

/** 6.+ seviye büyü yapılabilir mi (anahtar; Antimagic Field içinde büyü yok). */
export function spells69Problem(state: BattleState, actor: Combatant, spell: Spell): string | null {
  if (spell.level >= 6 && !on(state)) return '6.–9. seviye büyüler kapalı (Game Master: spells69).';
  if (on(state) && inAntimagic(state, actor)) return 'Antimagic Field içinde büyü yapılamaz.';
  return null;
}
function inAntimagic(state: BattleState, c: Combatant): boolean {
  return Object.values(state.combatants).some((h) => h.hp > 0 && h.effects?.some((e) => e.antimagic !== undefined && ft(h, c) <= (e.antimagic ?? 10)));
}
/** Hedef, büyücünün dışında kaldığı bir kürenin içinde mi (Globe: büyü seviyesi sınırı; Antimagic: her seviye). */
function shielded(state: BattleState, caster: Combatant, target: Combatant, level: number): boolean {
  for (const h of Object.values(state.combatants)) {
    if (h.hp <= 0) continue;
    for (const e of h.effects ?? []) {
      const r = e.antimagic ?? e.globeRadiusFt;
      const max = e.antimagic !== undefined ? 9 : e.spellGlobe;
      if (r === undefined || max === undefined || level > max) continue;
      if (ft(h, target) <= r && ft(h, caster) > r) return true;
    }
  }
  return false;
}

/** Büyü sonrası olayları düzenler ve ekler (normal yol çalıştıktan sonra). */
export function after69(before: BattleState, state: BattleState, actor: Combatant, spell: Spell, events: BattleEvent[], target: { id?: string; hex?: Offset; choice?: string }, rng: Rng): BattleEvent[] | null {
  if (!on(before)) return null;
  const m = spell.mechanics as M;
  const slot = events.find((e) => e.type === 'spell_cast' || e.type === 'save_resolved') ? spell.level : spell.level;
  let out = [...events];
  // Globe / Antimagic: dışarıdan gelen büyünün içerideki hedeflere etkisi düşer.
  const blocked = new Set(Object.values(before.combatants).filter((t) => t.id !== actor.id && shielded(before, actor, t, slot)).map((t) => t.id));
  if (blocked.size) out = out.filter((e) => !('targetId' in e && typeof e.targetId === 'string' && blocked.has(e.targetId) && e.type !== 'spell_cast'));
  if (!spell.mechanics || spell.level < 6) return blocked.size ? out : null;
  let cur = applyEvents(before, out);
  const add = (evs: BattleEvent[]) => { out.push(...evs); cur = applyEvents(cur, evs); };
  // Harm: 1 HP'nin altına düşürmez; HP maksimumu alınan hasar kadar azalır.
  if (m.notBelowOne) out = out.map((e) => (e.type === 'save_resolved' && e.targetHpAfter === 0 && (before.combatants[e.targetId]?.hp ?? 0) > 0
    ? { ...e, targetHpAfter: 1, appliedDamage: Math.max(0, (before.combatants[e.targetId]?.hp ?? 1) - 1), effects: [] } : e));
  if (m.notBelowOne || m.maxHpDrain) cur = applyEvents(before, out);
  if (m.maxHpDrain) for (const e of [...out]) if (e.type === 'save_resolved' && e.appliedDamage > 0) add([{ type: 'max_hp_drained', targetId: e.targetId, amount: e.appliedDamage, label: spell.name }]);
  // Chain Lightning: birincil hedefin 30 ft'indeki en çok 3 düşman (aynı DC) save yapar.
  if (m.extraTargets && target.id) {
    const first = cur.combatants[target.id];
    const others = first ? Object.values(cur.combatants).filter((c) => c.id !== first.id && c.id !== actor.id && c.side !== actor.side && c.hp > 0 && ft(first, c) <= (m.extraWithinFt ?? 30))
      .slice(0, m.extraTargets) : [];
    const fake: Combatant = { ...actor, attacks: [{ name: spell.name, bonus: 0, damageDice: m.damage, damageType: m.damageType, save: { ability: m.save as 'dex', dc: actor.spellSaveDc ?? 15, halfOnSave: true }, repeat: 0, ranged: true, range: [600, 600], text: spell.name } as unknown as Combatant['attacks'][number]], rechargeUsed: [] };
    for (const o of others) { const r = monsterAttackEvents(cur, fake, o, 0, rng); if (r.ok) add(r.events); }
  }
  // Disintegrate: 0 HP'ye düşen toz olur (ölü).
  if (m.dustAtZero) for (const e of [...out]) if (e.type === 'save_resolved' && e.targetHpAfter === 0) {
    const t = cur.combatants[e.targetId];
    if (t && t.life !== 'dead') add([damageEffect(t, 'spells69', `${spell.name}: toz oldu`, { dice: String(t.maxHp * 2), type: 'force' }, rng)]);
  }
  // Finger of Death: ölen Humanoid büyücünün kontrolünde zombi olarak kalkar.
  if (m.riseZombie) for (const e of [...out]) if (e.type === 'save_resolved' && e.targetHpAfter === 0) {
    const t = cur.combatants[e.targetId];
    if (!t || t.creatureType !== 'humanoid' || !t.pos) continue;
    const z = combatantFromMonster(getMonster('zombie'), { id: `${t.id}-zombie`, name: `Zombi (${t.name})` });
    add([{ type: 'summoned', ownerId: actor.id, spell: spell.name, combatant: { ...z, side: actor.side, pos: t.pos, initiative: actor.initiative, summon: { by: actor.id, spellId: spell.id, spell: spell.name, level: spell.level, turn: 'after-owner' } }, index: cur.order.indexOf(actor.id) + 1 }]);
  }
  // Heal ve Power Word Heal: durumlar biter.
  if (m.cures && m.kind === 'heal') for (const e of [...out]) if (e.type === 'healed') {
    const t = cur.combatants[e.targetId];
    for (const c of m.cures) if (t?.conditions.includes(c)) add([{ type: 'map_effect', rule: 'spells69', targetId: t.id, text: `${spell.name}: ${c} bitti`, removeCondition: c }]);
  }
  const t = target.id ? cur.combatants[target.id] : undefined;
  if (m.powerWord && t) {
    add(powerWordEvents(cur, actor, t, m.powerWord, spell, rng));
    // Words of Creation (Bard 20): ilk hedefin 10 ft'indeki ikinci bir yaratık da hedef (aynı taraftan; en yakın).
    if (actor.traits?.includes('words-of-creation')) {
      const second = Object.values(cur.combatants).filter((c) => c.id !== t.id && c.id !== actor.id && c.side === t.side && c.life !== 'dead' && ft(t, c) <= 10)
        .sort((a, b) => ft(t, a) - ft(t, b))[0];
      if (second) add(powerWordEvents(cur, actor, second, m.powerWord, spell, rng));
    }
  }
  if (m.massHeal) add(massHealEvents(cur, actor, m.massHeal, m.cures ?? [], spell));
  if (m.hpTiers) add(divineWordEvents(cur, actor, spell, rng));
  if (m.prismatic) add(prismaticEvents(cur, actor, spell, target.hex ?? (t ? hexOf(t) : null), rng));
  if (m.reverseGravity) add(reverseGravityEvents(cur, actor, spell, target.hex ?? (t ? hexOf(t) : null), rng));
  if (m.timeStop) add([{ type: 'time_stop', actorId: actor.id, turns: rollDice(m.timeStop, rollTag(rng, { by: actor.id })).total }]);
  return out;
}

function powerWordEvents(state: BattleState, actor: Combatant, t: Combatant, kind: 'stun' | 'kill' | 'heal', spell: Spell, rng: Rng): BattleEvent[] {
  if (kind === 'heal') {
    const amount = t.maxHp - t.hp;
    const ev: BattleEvent[] = amount > 0 ? [{ type: 'healed', actorId: actor.id, targetId: t.id, label: spell.name, amount, targetHpAfter: t.maxHp }] : [];
    for (const c of ['Charmed', 'Frightened', 'Paralyzed', 'Poisoned', 'Stunned']) if (t.conditions.includes(c)) ev.push({ type: 'map_effect', rule: 'spells69', targetId: t.id, text: `${spell.name}: ${c} bitti`, removeCondition: c });
    if (t.conditions.includes('Prone')) ev.push({ type: 'map_effect', rule: 'spells69', targetId: t.id, text: `${spell.name}: ayağa kalkar`, removeCondition: 'Prone' });
    return ev;
  }
  if (kind === 'kill') {
    if (t.hp <= 100) return [damageEffect(t, 'spells69', `${spell.name}: ölür`, { dice: String(t.hp + t.maxHp), type: 'psychic' }, rng)];
    return [damageEffect(t, 'spells69', spell.name, { dice: '12d12', type: 'psychic' }, rng)];
  }
  // Stun: 150 HP ve altı Stunned (her tur sonu CON save); üstü sonraki turunun başına dek hız 0.
  if (t.hp <= 150) return [timedCondition(state, t.id, { condition: 'Stunned', saveEnds: { ability: 'con', dc: actor.spellSaveDc ?? 15 }, maxRounds: 600 } as never, actor.id, spell.name)];
  return [{ type: 'effect_added', targetId: t.id, effect: { id: `pws:${actor.id}:${t.id}`, name: spell.name, sourceId: actor.id, speedZero: true, until: state.round + 1 } as ActiveEffect }];
}

function massHealEvents(state: BattleState, actor: Combatant, pool: number, cures: string[], spell: Spell): BattleEvent[] {
  let left = pool;
  const out: BattleEvent[] = [];
  const allies = Object.values(state.combatants).filter((c) => c.side === actor.side && !c.civilian && c.life !== 'dead' && c.pos && ft(actor, c) <= 60
    && !['undead', 'construct'].includes(c.creatureType ?? '')).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  for (const c of allies) {
    const amount = Math.min(left, c.maxHp - c.hp);
    if (amount > 0) { out.push({ type: 'healed', actorId: actor.id, targetId: c.id, label: spell.name, amount, targetHpAfter: c.hp + amount }); left -= amount; }
    for (const k of cures) if (c.conditions.includes(k)) out.push({ type: 'map_effect', rule: 'spells69', targetId: c.id, text: `${spell.name}: ${k} bitti`, removeCondition: k });
    if (left <= 0) break;
  }
  return out;
}

/** Divine Word: 30 ft'te seçilen düşmanlar CHA save; başarısızsa HP'ye göre ölüm ya da durumlar. */
function divineWordEvents(state: BattleState, actor: Combatant, spell: Spell, rng: Rng): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const t of Object.values(state.combatants)) {
    if (t.side === actor.side || t.civilian || t.hp <= 0 || ft(actor, t) > 30) continue;
    const ev = saveEffect(t, 'spells69', spell.name, 'cha', actor.spellSaveDc ?? 15, rng);
    out.push(ev);
    if (!(ev.type === 'map_effect' && ev.roll && !ev.roll.success)) continue;
    if (t.hp <= 20) { out.push(damageEffect(t, 'spells69', `${spell.name}: ölür`, { dice: String(t.hp + t.maxHp), type: 'radiant' }, rng)); continue; }
    const grants = t.hp <= 30 ? ['Blinded', 'Deafened', 'Stunned'] : t.hp <= 40 ? ['Blinded', 'Deafened'] : t.hp <= 50 ? ['Deafened'] : [];
    const rounds = t.hp <= 30 ? 600 : t.hp <= 40 ? 100 : 10;
    if (grants.length) out.push({ type: 'effect_added', targetId: t.id, effect: { id: `dw:${actor.id}:${t.id}`, name: spell.name, sourceId: actor.id, grants, until: state.round + rounds } as ActiveEffect });
  }
  return out;
}

/** Prismatic Spray: 60 ft koni; her hedef için d8 renk (1–5 hasar, 6 Restrained → Petrified, 7 Blinded → sürgün, 8 iki ışın). */
function prismaticEvents(state: BattleState, actor: Combatant, spell: Spell, aim: Offset | null, rng: Rng): BattleEvent[] {
  const pick = pickArea(state, actor, { shape: 'cone', sizeFt: 60, origin: 'self', targets: 'all' } as never, 0, aim);
  if ('ok' in pick) return [];
  const out: BattleEvent[] = [];
  const dc = actor.spellSaveDc ?? 15;
  const colors: Array<[string, string]> = [['fire', 'Kırmızı'], ['acid', 'Turuncu'], ['lightning', 'Sarı'], ['poison', 'Yeşil'], ['cold', 'Mavi']];
  for (const { c } of pick.reached) {
    if (c.id === actor.id || c.hp <= 0) continue;
    const rays = ((): number[] => { const d = rollDie(8, rollTag(rng, { by: actor.id })); return d === 8 ? [rollDie(7, rollTag(rng, { by: actor.id })), rollDie(7, rollTag(rng, { by: actor.id }))] : [d]; })();
    for (const d of rays) {
      if (d <= 5) {
        const [type, name] = colors[d - 1] as [string, string];
        out.push(saveEffect(c, 'spells69', `${spell.name} (${name})`, 'dex', dc, rng, { hit: { dice: '12d6', type, halfOnSave: true } }));
      } else {
        const ev = saveEffect(c, 'spells69', `${spell.name} (${d === 6 ? 'Çivit' : 'Mor'})`, 'dex', dc, rng);
        out.push(ev);
        if (ev.type === 'map_effect' && ev.roll && !ev.roll.success) {
          out.push(d === 6
            ? timedCondition(state, c.id, { condition: 'Restrained', saveEnds: { ability: 'con', dc }, maxRounds: 3, escalate: { condition: 'Petrified', rounds: 14400 } } as never, actor.id, spell.name)
            : { type: 'effect_added', targetId: c.id, effect: { id: `ps7:${actor.id}:${c.id}`, name: `${spell.name} (Mor)`, sourceId: actor.id, grants: ['Blinded'], repeatSave: { ability: 'wis', dc }, until: state.round + 10 } as ActiveEffect });
        }
      }
    }
  }
  return out;
}

/** Reverse Gravity: alandaki yaratıklar DEX save; başarısızsa 100 ft yukarı düşer (10d6) ve büyü sürdükçe asılı kalır (hız 0). */
function reverseGravityEvents(state: BattleState, actor: Combatant, spell: Spell, aim: Offset | null, rng: Rng): BattleEvent[] {
  if (!aim) return [];
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    if (c.hp <= 0 || !c.pos || distance(c.pos, aim) * 5 > 50) continue;
    const ev = saveEffect(c, 'spells69', spell.name, 'dex', actor.spellSaveDc ?? 15, rng);
    out.push(ev);
    if (ev.type === 'map_effect' && ev.roll && !ev.roll.success) {
      out.push(damageEffect(c, 'spells69', `${spell.name}: tavana düştü`, { dice: '10d6', type: 'bludgeoning' }, rng),
        { type: 'effect_added', targetId: c.id, effect: { id: `rg:${actor.id}:${c.id}`, name: spell.name, sourceId: actor.id, speedZero: true, airborne: true, concentrationOf: actor.id, until: state.round + 10 } as ActiveEffect });
    }
  }
  return out;
}

/** Wish: 8. seviye ya da altı bir büyüyü (seçim `choice`) bileşensiz kopyalar; 9. seviye slot harcanır. */
export function wishSpell(choice: string | undefined): Spell | null {
  const s = choice ? spells.find((x) => x.name === choice) : undefined;
  return s && s.level <= 8 && s.name !== 'Wish' ? s : null;
}
export const wishProblem = (choice: string | undefined): string | null => (wishSpell(choice) ? null : 'Wish: kopyalanacak 8. seviye ya da altı bir büyü seçmelisin.');
export { fail };
