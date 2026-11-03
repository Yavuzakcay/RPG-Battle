/**
 * Süren etkiler (Görev R2; SRD 5.2.1): savaşçının üzerindeki `effects` listesi. Etkiyi koyan büyüler `spells.ts`'te
 * (`kind: effect`, smite'ın `ongoing`'i); zar eklentileri `effectDice.ts`, geçici HP ve hasar azaltma
 * `damage-effects.ts`, bitişler (süre, konsantrasyon, ölüm, tek kullanım) reducer'da (`pruneEffects`).
 *
 * Burada etkili yaratığın tur başı: geçici HP (Heroism), süregelen hasar ve ardından kurtarma zarı (Searing Smite;
 * başarıda biter), Command (turunu kaybeder; Grovel önce yere düşer).
 */
import { gap } from './body';
import { damageProfile } from './common';
import { resolveSave } from '../rules/attack';
import { adjustDamage } from '../rules/damage';
import { rollDice, rollDie, rollTag, type Rng } from '../rules/dice';
import { damageEffects } from './damage-effects';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { applyEvents } from './reduce';
import { compelEvents } from './mind';
import { strikeApi } from './reactions';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

const profileOf = (c: Combatant) => damageProfile(c);

/** Etkinin süren hasarı: zar (dirençle), hasar uygulanır, sonra save; başarıda etki biter. */
function ongoingEvents(c: Combatant, e: ActiveEffect, rng: Rng): BattleEvent[] {
  const o = e.ongoing;
  if (!o) return [];
  const d = rollDice(o.dice, rollTag(rng, { kind: 'damage', by: e.sourceId }));
  const adj = adjustDamage(d.total, o.type, profileOf(c));
  const fx = damageEffects(c, adj.amount, o.type, false, rng);
  const after = { ...c, hp: fx.hpAfter };
  let save: Extract<BattleEvent, { type: 'effect_tick' }>['save'];
  if (fx.hpAfter > 0) {
    const r = resolveSave({ extra: saveDice(after, o.save), modifier: after.saves[o.save], dc: o.dc, mode: saveMode('normal', after, o.save) }, rollTag(rng, { by: c.id }));
    save = { ability: o.save, dc: o.dc, d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success, ...(r.extra ? { extra: r.extra } : {}) };
  }
  const events: BattleEvent[] = [{
    type: 'effect_tick', targetId: c.id, effectId: e.id, name: e.name, damageRolls: d.rolls, appliedDamage: adj.amount,
    damageType: o.type, targetHpAfter: fx.hpAfter, effects: fx.effects, ...(save ? { save } : {}),
  }];
  if (save?.success) events.push({ type: 'effect_ended', targetId: c.id, effectId: e.id, name: e.name, reason: 'save' });
  return events;
}

/**
 * Sırası gelen yaratığın etkileri (tur başı): geçici HP, süregelen hasar, Command. `skip`: turunu kaybeder (Command).
 */
export function effectTurnStartEvents(state: BattleState, id: string, rng: Rng): { events: BattleEvent[]; skip: boolean } {
  // Görev B1: koyanın sonraki turunun başına dek süren etkiler (Heat Metal dezavantajı, Ray of Enfeeblement başarısı).
  const events: BattleEvent[] = Object.values(state.combatants).flatMap((x) => (x.effects ?? [])
    .filter((e) => e.untilSourceTurn && e.sourceId === id)
    .map((e): BattleEvent => ({ type: 'effect_ended', targetId: x.id, effectId: e.id, name: e.name, reason: 'expired' })));
  let current = applyEvents(state, events);
  // Kuyruk 19: Aura of Life: 0 HP'deki dost auranın içinde turuna başlarsa 1 HP kazanır.
  const me = current.combatants[id];
  if (me && me.hp === 0 && (me.life === 'dying' || me.life === 'stable') && me.pos) {
    const holder = Object.values(current.combatants).find((p) => p.id !== id && p.side === me.side && p.hp > 0 && p.pos
      && (p.effects ?? []).some((e) => e.auraLife?.revive && gap(current, p, me) * 5 <= e.auraLife.radiusFt));
    if (holder) {
      const heal: BattleEvent = { type: 'healed', actorId: holder.id, targetId: id, label: 'Aura of Life', amount: 1, targetHpAfter: 1 };
      events.push(heal);
      current = applyEvents(current, [heal]);
    }
  }
  // Görev B3: koyanın her turunun başında hedefe hasar (Phantasmal Force).
  for (const x of Object.values(current.combatants)) {
    for (const e of (x.effects ?? []).filter((f) => f.sourceTurnDamage && f.sourceId === id)) {
      const t = current.combatants[x.id] as Combatant;
      if (t.hp <= 0) continue;
      const st = e.sourceTurnDamage as NonNullable<typeof e.sourceTurnDamage>;
      const d = rollDice(st.dice, rollTag(rng, { kind: 'damage', by: id }));
      const adj = adjustDamage(d.total, st.type, profileOf(t));
      const fx = damageEffects(t, adj.amount, st.type, false, rng);
      const tick: BattleEvent = { type: 'effect_tick', targetId: t.id, effectId: e.id, name: e.name, damageRolls: d.rolls, appliedDamage: adj.amount,
        damageType: st.type, targetHpAfter: fx.hpAfter, effects: fx.effects };
      events.push(tick);
      current = applyEvents(current, [tick]);
    }
  }
  // Görev WIZARD: Blink: turun başında Ethereal'den döner (aynı altıgene; SRD: 10 ft içinde boş bir yer).
  for (const e of current.combatants[id]?.effects ?? []) {
    if (e.ethereal && !e.banished) {
      const back: BattleEvent = { type: 'effect_ended', targetId: id, effectId: e.id, name: e.name, reason: 'turn' };
      events.push(back);
      current = applyEvents(current, [back]);
    }
  }
  const c0 = current.combatants[id];
  if (!c0?.effects?.length || c0.hp <= 0) return { events, skip: false };
  let skip = false;
  for (const e of c0.effects) {
    const c = current.combatants[id] as Combatant;
    if (c.hp <= 0) break;
    let evs: BattleEvent[] = [];
    if (e.tempHp && e.tempHp > 0) evs = [{ type: 'temp_hp', targetId: id, amount: e.tempHp, label: e.name }];
    if (e.ongoing) evs = ongoingEvents(c, e, rng);
    // Görev CLERIC: Bestow Curse: tur başında WIS save; başarısızsa bu tur eylem yok.
    if (e.turnSave) {
      const save = resolveSave({ extra: saveDice(c, e.turnSave.ability), modifier: c.saves[e.turnSave.ability], dc: e.turnSave.dc, mode: saveMode('normal', c, e.turnSave.ability) }, rollTag(rng, { by: id }));
      evs = [{ type: 'curse_save', actorId: id, label: e.name, dc: e.turnSave.dc, d20: save.d20?.rolls ?? [], total: save.total ?? 0, success: save.success },
        ...(save.success ? [] : [{ type: 'action_used' as const, actorId: id, kind: 'action' as const, what: e.name }])];
    }
    // Kuyruk 19: Conjure Elemental tutsağı: tur başında save; başarısızsa hasar, başarılıysa serbest.
    if (e.startSave) {
      const ss = e.startSave;
      const r = resolveSave({ extra: saveDice(c, ss.ability), modifier: c.saves[ss.ability], dc: ss.dc, mode: saveMode('normal', c, ss.ability) }, rollTag(rng, { by: c.id }));
      const d = !r.success ? rollDice(ss.dice, rollTag(rng, { kind: 'damage', by: e.sourceId })) : null;
      const adj = d ? adjustDamage(d.total, ss.type, damageProfile(c)) : { amount: 0 };
      const fx = adj.amount > 0 ? damageEffects(c, adj.amount, ss.type, false, rng) : { hpAfter: c.hp, effects: [] };
      evs = [...evs, { type: 'effect_tick', targetId: id, effectId: e.id, name: e.name, damageRolls: d?.rolls ?? [], appliedDamage: adj.amount, damageType: ss.type,
        targetHpAfter: fx.hpAfter, effects: fx.effects, save: { ability: ss.ability, dc: ss.dc, d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success } },
        ...(r.success ? [{ type: 'effect_ended' as const, targetId: id, effectId: e.id, name: e.name, reason: 'save' as const }] : [])];
    }
    // Kuyruk 19: Compulsion: turunun başında seçilen yönde hareketinin tamamını kullanır; tur kaybedilmez.
    if (e.compel?.dir !== undefined) {
      // Kuyruk 19: Compulsion: seçilen yön yalnızca bu tur için; hareketten sonra silinir (her tur yeniden bonus eylem).
      evs = [...evs, ...compelEvents(current, id, e, 'direction', rng), { type: 'effect_added', targetId: id, effect: { ...e, compel: {} } }];
    }
    if (e.confused) {
      const r = confusionTurn(current, id, e, rng);
      evs = [...evs, ...r.events];
      if (r.skip) skip = true;
    }
    if (e.command) {
      // Görev B3: Approach ve Flee önce zorlamayla yürütür (Fear: Dash ile kaçış); sonra tur biter. Süren zorlamada
      // (Suggestion, Fear, Calm Emotions) etki kalır.
      const moved = e.command === 'approach' || e.command === 'flee' ? compelEvents(current, id, e, e.command, rng) : [];
      evs = [...moved, { type: 'turn_lost', actorId: id, label: e.name, command: e.command },
        ...(e.commandPersist ? [] : [{ type: 'effect_ended' as const, targetId: id, effectId: e.id, name: e.name, reason: 'turn' as const }])];
      skip = true;
    }
    events.push(...evs);
    current = applyEvents(current, evs);
  }
  return { events, skip };
}

/**
 * Görev B1: sırası biten yaratığın etkileri (tur sonu): gecikmeli hasar (Acid Arrow; bir kez, sonra biter) ve tekrar
 * kurtarma zarı (Slow, Ray of Enfeeblement; başarıda biter).
 */
export function effectTurnEndEvents(state: BattleState, id: string, rng: Rng): BattleEvent[] {
  const c0 = state.combatants[id];
  if (!c0?.effects?.length || c0.hp <= 0) return [];
  const events: BattleEvent[] = [];
  let current = state;
  for (const e of c0.effects) {
    const c = current.combatants[id] as Combatant;
    if (c.hp <= 0) break;
    const evs: BattleEvent[] = [];
    // Görev B2: o turun sonuna dek süren (Stinking Cloud).
    if (e.untilOwnTurnEnd) evs.push({ type: 'effect_ended', targetId: id, effectId: e.id, name: e.name, reason: 'turn' });
    else if (e.delayed) {
      const d = rollDice(e.delayed.dice, rollTag(rng, { kind: 'damage', by: e.sourceId }));
      const adj = adjustDamage(d.total, e.delayed.type, profileOf(c));
      const fx = damageEffects(c, adj.amount, e.delayed.type, false, rng);
      evs.push({ type: 'effect_tick', targetId: id, effectId: e.id, name: e.name, damageRolls: d.rolls, appliedDamage: adj.amount,
        damageType: e.delayed.type, targetHpAfter: fx.hpAfter, effects: fx.effects },
      { type: 'effect_ended', targetId: id, effectId: e.id, name: e.name, reason: 'turn' });
    } else if (e.repeatSave) {
      const { ability, dc } = e.repeatSave;
      const r = resolveSave({ extra: saveDice(c, ability), modifier: c.saves[ability], dc, mode: saveMode('normal', c, ability) }, rollTag(rng, { by: c.id }));
      // Kuyruk 19: başarısız save'de yinelenen hasar (Phantasmal Killer).
      const fd = !r.success ? e.repeatSave.failDamage : undefined;
      const d = fd ? rollDice(fd.dice, rollTag(rng, { kind: 'damage', by: e.sourceId })) : null;
      const adj = fd && d ? adjustDamage(d.total, fd.type, profileOf(c)) : { amount: 0 };
      const fx = adj.amount > 0 ? damageEffects(c, adj.amount, fd?.type ?? '', false, rng) : { hpAfter: c.hp, effects: [] };
      evs.push({ type: 'effect_tick', targetId: id, effectId: e.id, name: e.name, damageRolls: d?.rolls ?? [], appliedDamage: adj.amount, damageType: fd?.type ?? '',
        targetHpAfter: fx.hpAfter, effects: fx.effects, save: { ability, dc, d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success, ...(r.extra ? { extra: r.extra } : {}) } });
      const tally = e.repeatSave.tally;
      if (tally) {
        // Kuyruk 19: Contagion: üç başarıda biter, üç başarısızlıkta kalıcı (save'ler durur).
        const next = { ...tally, s: tally.s + (r.success ? 1 : 0), f: tally.f + (r.success ? 0 : 1) };
        if (next.s >= next.need) evs.push({ type: 'effect_ended', targetId: id, effectId: e.id, name: e.name, reason: 'save' });
        else if (next.f >= next.need) { const { repeatSave: _r, ...rest } = e; evs.push({ type: 'effect_added', targetId: id, effect: { ...rest, until: undefined } }); }
        else evs.push({ type: 'effect_added', targetId: id, effect: { ...e, repeatSave: { ...e.repeatSave, tally: next } } });
      } else if (r.success) evs.push({ type: 'effect_ended', targetId: id, effectId: e.id, name: e.name, reason: 'save' });
    } else if (e.blink) {
      // Görev WIZARD: Blink: tur sonunda d20; 11+ ise sonraki turunun başına dek Ethereal (hedef alınamaz, etkilenmez).
      const d = rollDie(20, rollTag(rng, { by: id, kind: 'check' }));
      evs.push({ type: 'effect_tick', targetId: id, effectId: e.id, name: `${e.name} (d20 ${d})`, damageRolls: [], appliedDamage: 0, damageType: '',
        targetHpAfter: c.hp, effects: [] });
      if (d >= 11) evs.push({ type: 'effect_added', targetId: id, effect: { id: 'blink:ethereal', name: 'Blink: Ethereal', sourceId: id, ethereal: true, icon: '✧' } });
    }
    events.push(...evs);
    current = applyEvents(current, evs);
  }
  return events;
}

/**
 * Görev B1: saldıranın süren etkilerinden hasar zarından düşülen zar (Ray of Enfeeblement −1d8 her hasar; Reduce
 * −1d4 yalnızca silah ve silahsız vuruşta, 1'in altına indirmez). Ham hasar ve günlük notu.
 */
export function damagePenalty(actor: Combatant, raw: number, weapon: boolean, rng: Rng): { total: number; note: string | null } {
  let total = raw;
  const notes: string[] = [];
  for (const e of actor.effects ?? []) {
    const p = e.damagePenalty;
    if (!p || (p.weaponOnly && !weapon) || raw <= 0) continue;
    const d = rollDice(p.die, rollTag(rng, { kind: 'damage', by: e.sourceId }));
    total = Math.max(p.min ?? 0, total - d.total);
    notes.push(`${e.name} −${d.total}`);
  }
  return { total, note: notes.length ? notes.join(', ') : null };
}

/**
 * Kuyruk 19: Confusion (SRD 5.2.1) tur başı d10: 1: eylem yok, hareketinin tamamıyla d4 yönüne (kuzey, doğu, güney,
 * batı; altıgende doğu/batı q ekseni); 2–6: hareket ve eylem yok; 7–8: hareket yok, erişimindeki rastgele yaratığa bir
 * yakın dövüş saldırısı (yoksa eylem yok); 9–10: kendisi seçer (bonus eylem ve tepki yine yok).
 */
function confusionTurn(state: BattleState, id: string, e: ActiveEffect, rng: Rng): { events: BattleEvent[]; skip: boolean } {
  const d = rollDie(10, rollTag(rng, { by: id, kind: 'check' }));
  const note = (text: string): BattleEvent => ({ type: 'map_note', text: `${state.combatants[id]?.name ?? id}: ${e.name} d10 = ${d} — ${text}` });
  const lost: BattleEvent = { type: 'turn_lost', actorId: id, label: e.name, command: 'halt' };
  if (d >= 9) return { events: [note('davranışını seçer')], skip: false };
  if (d === 1) {
    const d4 = rollDie(4, rollTag(rng, { by: id, kind: 'check' }));
    const dir = [2, 0, 5, 3][d4 - 1] as number;
    const names = ['kuzey', 'doğu', 'güney', 'batı'];
    return { events: [note(`${names[d4 - 1]} yönüne yürür`), ...compelEvents(state, id, { ...e, compel: { dir } }, 'direction', rng), lost], skip: true };
  }
  if (d <= 6) return { events: [note('hareket etmez, eylem yapmaz'), lost], skip: true };
  const api = strikeApi();
  const near = api ? Object.values(state.combatants).filter((c) => c.id !== id && c.hp > 0 && c.pos && api.can(state, id, c.id)) : [];
  if (!api || !near.length) return { events: [note('erişiminde yaratık yok, eylem yapmaz'), lost], skip: true };
  const pick = near[rollDie(near.length, rollTag(rng, { by: id, kind: 'check' })) - 1] as Combatant;
  return { events: [note(`rastgele hedefe saldırır: ${pick.name}`), ...api.strike(state, id, pick.id, rng), lost], skip: true };
}

