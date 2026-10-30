/**
 * Harita komutları (Adım 8): bataktan çıkma ve çekme (`bog`), kapı (`gate`: GM açar/kapatır,
 * herkes kırmaya çalışabilir).
 * Parametreler haritanın JSON'undan.
 */
import { rollD20, rollTag, type Rng } from '../rules/dice';
import { checkMode, skillBonus } from '../rules/skills';
import { finishCheck } from './effectDice';
import { resolveAttack } from '../rules/attack';
import { distance, sameHex, type Offset } from '../rules/hex';
import { fail, type CommandResult } from './common';
import { checkEffect, nearestSolid, ruleHex, ruleObject, ruleOf, ruleNumber, ruleSkill, stuckInBog } from './maprules';
import { occupantAt } from './movement';
import { applyEvents } from './reduce';
import type { AttackOption, BattleEvent, BattleState, Combatant } from './types';

/** Bataktan çıkış başarılıysa: en yakın sağlam altıgen, sayaç sıfır, kalıcı zehir başlar. */
function freed(state: BattleState, ev: Extract<BattleEvent, { type: 'map_effect' }>, who: Combatant, near?: Offset): string | null {
  if (!ev.roll?.success || !who.pos) return null;
  const to = nearestSolid(state, who.pos, who.id, near);
  if (!to) return 'Yakında çıkılacak sağlam ve boş altıgen yok.';
  ev.moveTo = to;
  ev.mapStatus = { sink: 0, lingeringPoison: ruleOf(state, 'bog')?.lingeringPoison !== undefined };
  return null;
}

export function executeEscape(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  // CILA (Entangle, Web): büyünün tuttuğu yaratık eylemle STR (Athletics) kontrolüyle kurtulur.
  const held = actor.effects?.find((e) => e.escapeCheck);
  if (held?.escapeCheck) {
    const dc = held.escapeCheck.dc;
    const bonus = skillBonus(actor, 'athletics');
    const mode = checkMode(actor, 'athletics');
    const d = rollD20(mode, rollTag(rng, { kind: 'check', by: actor.id, bonus }));
    const { total, extra } = finishCheck(actor, 'athletics', d.kept, bonus, dc, mode, rng);
    const success = total >= dc;
    const events: BattleEvent[] = [{ type: 'grapple_escape', actorId: actor.id, skill: 'athletics', d20: d.rolls, total, dc, success, ...(extra.length ? { bonusDice: extra } : {}) }];
    if (success) events.push({ type: 'effect_ended', targetId: actor.id, effectId: held.id, name: held.name, reason: 'save' });
    return { ok: true, state: applyEvents(state, events), events };
  }
  const bog = ruleOf(state, 'bog');
  if (!bog || !stuckInBog(state, actor)) return fail('Batağa saplanmış değil.');
  const esc = ruleObject(bog, 'escape');
  const ev = checkEffect(actor, 'bog', 'bataktan çıkmaya çalışıyor', ruleSkill(esc.skill), ruleNumber(esc, 'dc'), rng);
  const problem = freed(state, ev, actor);
  if (problem) return fail(problem);
  return { ok: true, state: applyEvents(state, [ev]), events: [ev] };
}

export function executePull(state: BattleState, actor: Combatant, targetId: string, rng: Rng): CommandResult {
  const bog = ruleOf(state, 'bog');
  if (!bog) return fail('Bu haritada batak yok.');
  const target = state.combatants[targetId];
  if (!target || target.side !== actor.side || target.id === actor.id) return fail('Yalnızca bir müttefik çekilebilir.');
  if (!stuckInBog(state, target)) return fail(`${target.name} batağa saplanmış değil.`);
  if (!actor.pos || !target.pos || distance(actor.pos, target.pos) !== 1) return fail('Çekmek için bitişik olmalı.');
  const pull = ruleObject(bog, 'allyPull');
  const ev = checkEffect(actor, 'bog', `${target.name} adlı müttefiği çekiyor`, ruleSkill(pull.skill), ruleNumber(pull, 'dc'), rng);
  // Zar çekenin; sonuç (yer değiştirme, sayaç) çekilene uygulanır.
  const onTarget: Extract<BattleEvent, { type: 'map_effect' }> = { ...ev, targetId: target.id, text: `${actor.name} tarafından çekiliyor` };
  const problem = freed(state, onTarget, target, actor.pos);
  if (problem) return fail(problem);
  const events: BattleEvent[] = [onTarget];
  return { ok: true, state: applyEvents(state, events), events };
}

/** Kapı kuralı ve kapının o anki durumu (aynalı haritada konum çevrilir). */
export function gateAt(state: BattleState, at: Offset): { state: 'open' | 'closed' | 'broken'; hp: number; ac: number } | null {
  const rule = ruleOf(state, 'gate');
  if (!rule || !sameHex(ruleHex(state, rule.hex), at)) return null;
  const saved = state.map?.gates?.[`${at.col},${at.row}`];
  const initial = rule.state === 'closed' ? 'closed' : 'open';
  return { state: saved?.state ?? initial, hp: saved?.hp ?? ruleNumber(rule, 'hp'), ac: ruleNumber(rule, 'ac') };
}

export function executeGate(state: BattleState, at: Offset, open: boolean, isGm: boolean): CommandResult {
  if (!isGm) return fail('Kapıyı yalnızca GM açıp kapatır.');
  if (state.status !== 'active') return fail('Savaş sürmüyor.');
  const gate = gateAt(state, at);
  if (!gate) return fail('Burada kapı yok.');
  if (gate.state === 'broken') return fail('Kapı kırık: kapanmaz.');
  if (open === (gate.state === 'open')) return fail(open ? 'Kapı zaten açık.' : 'Kapı zaten kapalı.');
  if (!open && occupantAt(state, at)) return fail('Kapının altında biri var: kapanmaz.');
  const events: BattleEvent[] = [
    { type: 'tile_changed', at, to: open ? 'o' : 'O' },
    { type: 'map_note', text: open ? 'Kapı açıldı.' : 'Kapı kapandı.', gate: { at, state: open ? 'open' : 'closed', hp: gate.hp } },
  ];
  return { ok: true, state: applyEvents(state, events), events };
}

/** Kapalı kapıya saldırı: AC'ye karşı saldırı zarı, hasar kapının HP'sinden düşer; 0'da kırılır. */
export function executeAttackGate(state: BattleState, actor: Combatant, at: Offset, option: AttackOption, rng: Rng): CommandResult {
  const gate = gateAt(state, at);
  if (!gate || gate.state !== 'closed') return fail('Kırılacak kapalı kapı yok.');
  if (!actor.pos) return fail('Konum yok.');
  const d = distance(actor.pos, at);
  if (option.ranged) {
    const long = option.range?.[1] ?? Infinity;
    if (d * 5 > long) return fail(`Kapı menzil dışında (${d * 5} ft).`);
  } else if (d * 5 > (option.reachFt ?? 5)) {
    return fail(`Kapı erişim dışında (${d * 5} ft).`);
  }
  const r = resolveAttack({ attackBonus: option.attackBonus, targetAc: gate.ac, mode: 'normal', damage: option.damage, autoCritical: false }, rollTag(rng, { by: actor.id }));
  const dealt = r.hit ? r.damage?.total ?? 0 : 0;
  const hp = Math.max(0, gate.hp - dealt);
  const verdict = r.hit ? `isabet, ${dealt} hasar, kapının HP'si ${hp}` : 'ıska';
  const events: BattleEvent[] = [{
    type: 'map_note', text: `${actor.name} kapıya vurdu (${option.label}): zar ${r.d20.kept}, toplam ${r.total} / AC ${gate.ac}: ${verdict}.`,
    gate: { at, state: hp === 0 ? 'broken' : 'closed', hp },
  }];
  if (hp === 0) events.push({ type: 'tile_changed', at, to: 'o' }, { type: 'map_note', text: 'Kapı kırıldı!' });
  return { ok: true, state: applyEvents(state, events), events };
}
