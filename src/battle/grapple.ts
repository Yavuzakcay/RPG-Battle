/**
 * Yakalama (Grappled), yere düşme (Prone), hücum ve rider durum etkileri (SRD 5.2.1).
 *
 * - Yakalanan: hızı 0 (hareket komutları reddedilir), yakalayandan uzaklaşamaz. Kaçış: eylem;
 *   d20 + Athletics ya da Acrobatics (yüksek olan) ≥ kaçış DC'si. Yakalayan onu sürükleyebilir
 *   (yakalayanın hareket maliyeti iki kat). Yakalayan düşer, uyur, etkisiz kalır ya da araya mesafe
 *   girerse yakalama biter (`grappleCleanup`, her komuttan sonra).
 * - Yere düşmüş: ayağa kalkmak hızın yarısı kadar hareket harcar (`stand_up`; yürürken otomatik).
 *   Yakın dövüş saldırıları avantajlı, uzaktan dezavantajlı (rules/conditions.ts).
 * - Hücum ("20+ ft düz koşup vurursa"): turdaki son düz koşu (`run`) en az o kadar ve hedef koşu
 *   yönünde bitişikse tutar.
 */
import { checkBase } from './ruleVersion';
import { extrasTotal, rollExtras } from '../rules/attack';
import { finishCheck, saveDice } from './effectDice';
import type { Ability } from '../rules/abilities';
import { resolveSave } from '../rules/attack';
import { autoFailsStrDexSave, isIncapacitated, speedZero } from '../rules/conditions';
import { rollD20, rollTag, type Rng, type RollMode } from '../rules/dice';
import { directionTo, distance, isInside, withinRange, type Offset } from '../rules/hex';
import { bodyOf, gap, isMultiHex53 } from './body';
import { bodyFitProblem, occupantAt, placeProblem } from './movement';
import { checkMode, skillBonus } from '../rules/skills';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { attackEffect, makeTimer, saveMode, timedCondition } from './durations';
import { speedHexes } from './reduce';
import type { RiderSpec } from './riders';
import { a2Events } from './ridersA2';
import type { BattleEvent, BattleState, Combatant, Command } from './types';
import { flySpeed } from './flight';
import { globalRule } from './ruleControl';

const SIZES = ['T', 'S', 'M', 'L', 'H', 'G'] as const;
/** Hedef boyut sınırına uyuyor mu ("Large or smaller"). */
export const fitsSize = (target: Combatant, max?: string) => !max || SIZES.indexOf(target.size) <= SIZES.indexOf(max as (typeof SIZES)[number]);

/** Ayağa kalkmanın maliyeti: hızın yarısı (altıgen, yukarı yuvarlanır). */
export const standUpCost = (c: Combatant) => Math.ceil(Math.floor((flySpeed(c) > 0 ? flySpeed(c) : c.speed) / 5) / 2);

/** Ayağa kalkabilir mi; değilse neden. */
export function standUpProblem(c: Combatant): string | null {
  if (!c.conditions.includes('Prone')) return 'Yerde değil.';
  if (speedZero(c.conditions)) return 'Hızı 0 (Grappled, Restrained, Paralyzed…): ayağa kalkamaz.';
  if (c.movementUsed + standUpCost(c) > speedHexes(c)) return 'Ayağa kalkacak kadar hareket kalmadı (hızın yarısı gerekir).';
  return null;
}

export function standUpEvents(c: Combatant): BattleEvent[] | string {
  const why = standUpProblem(c);
  return why ?? [{ type: 'stood_up', actorId: c.id, cost: standUpCost(c) }];
}

export function executeStandUp(state: BattleState, actor: Combatant): CommandResult {
  const ev = standUpEvents(actor);
  return typeof ev === 'string' ? fail(ev) : finish(state, ev);
}

/** Kaçış denemesi (eylem). */
export function executeEscapeGrapple(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  const g = actor.grapple;
  if (!g) return fail('Yakalanmış değil.');
  // Kuyruk 19: Freedom of Movement: 5 ft hareket harcayarak büyüsüz yakalamadan kendiliğinden kurtulur (eylem yok).
  if (actor.effects?.some((e) => e.freeMove) && actor.pos) {
    if (speedHexes(actor) - actor.movementUsed < 1) return fail('Freedom of Movement: kurtulmak için 5 ft hareket gerekli.');
    return finish(state, [{ type: 'moved', actorId: actor.id, path: [actor.pos], cost: 1 }, { type: 'grapple_ended', targetId: actor.id, reason: 'Freedom of Movement' }]);
  }
  const ath = skillBonus(actor, 'athletics');
  const acr = skillBonus(actor, 'acrobatics');
  const skill = acr > ath ? 'acrobatics' : 'athletics';
  // Kuyruk 19: Powerful Build (Goliath; SRD 5.2.1): Grappled'ı bitirme denetiminde avantaj (anahtar `powerfulBuild`, sürüm 16).
  const pb = actor.raceId === 'goliath' && !!globalRule(state, 'powerfulBuild');
  const mode0 = checkMode(actor, skill, checkBase(state, actor));
  // Avantaj ile dezavantaj birbirini götürür (SRD).
  const mode: RollMode = !pb ? mode0 : mode0 === 'disadvantage' ? 'normal' : 'advantage';
  const d = rollD20(mode, rollTag(rng, { kind: 'check', by: actor.id, bonus: Math.max(ath, acr) }));
  const { total, extra } = finishCheck(actor, skill, d.kept, Math.max(ath, acr), g.escapeDc, mode, rng);
  const success = total >= g.escapeDc;
  const events: BattleEvent[] = [{ type: 'grapple_escape', actorId: actor.id, skill, d20: d.rolls, total, dc: g.escapeDc, success, ...(extra.length ? { bonusDice: extra } : {}) }];
  if (success) events.push({ type: 'grapple_ended', targetId: actor.id, reason: 'kaçtı' });
  return finish(state, events);
}

/** Yakalama bitmeli mi: yakalayan yok, düştü, uyuyor, etkisiz ya da araya mesafe girdi. */
export function grappleCleanup(state: BattleState): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    if (!c.grapple) continue;
    const g = state.combatants[c.grapple.by];
    const reason = !g || !isTargetable(g) ? 'yakalayan düştü'
      : g.asleep ? 'yakalayan uyuyor' : isIncapacitated(g.conditions) ? 'yakalayan etkisiz'
        : !isTargetable(c) ? 'yakalanan düştü'
          // Kuyruk K69 (sürüm 53, çok altıgen): bitişiklik gövdeler arası (çapalar arası değil).
          : state.map && g.pos && c.pos && (isMultiHex53(state, g) || isMultiHex53(state, c) ? gap(state, g, c) : distance(g.pos, c.pos)) > 1 ? 'aralarında mesafe açıldı' : null;
    if (reason) out.push({ type: 'grapple_ended', targetId: c.id, reason });
  }
  return out;
}

/** Yakalayan yürüdüyse yakaladıklarını sürükler: yolun son adımından bir önceki altıgene (boşsa). */
export function dragEvents(before: BattleState, after: BattleState, events: BattleEvent[]): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const e of events) {
    if (e.type !== 'moved' || e.path.length === 0) continue;
    const held = Object.values(after.combatants).filter((c) => c.grapple?.by === e.actorId && c.pos);
    for (const c of held) {
      const from = before.combatants[e.actorId]?.pos;
      const to = e.path.length >= 2 ? e.path[e.path.length - 2] : from;
      // Kuyruk K69 (sürüm 53, çok altıgen): sürüklenen gövde, yakalayanın yeni gövdesine bitişik ve sığan en yakın yere.
      const g = after.combatants[e.actorId];
      if (g && (isMultiHex53(after, g) || isMultiHex53(after, c))) {
        const spot = dragSpot(after, g, c, to ?? null);
        if (spot && c.pos) out.push({ type: 'pushed', targetId: c.id, from: c.pos, to: spot, by: e.actorId });
        else out.push({ type: 'grapple_ended', targetId: c.id, reason: 'sürüklenemedi' });
        continue;
      }
      const busy = (h: { col: number; row: number }) => Object.values(after.combatants).some((x) => x.id !== c.id && x.pos && x.pos.col === h.col && x.pos.row === h.row);
      if (to && c.pos && !busy(to)) out.push({ type: 'pushed', targetId: c.id, from: c.pos, to, by: e.actorId });
      else out.push({ type: 'grapple_ended', targetId: c.id, reason: 'sürüklenemedi' });
    }
  }
  return out;
}

/**
 * Kuyruk K69: sürükleme yeri: tercihen yakalayanın bıraktığı çapa (`prefer`), değilse yakalayanın gövdesine bitişik
 * (gövdeler arası 1) ve sürüklenenin gövdesinin sığdığı, `prefer`'e en yakın altıgen (sabit sıra); yoksa null.
 */
function dragSpot(state: BattleState, g: Combatant, c: Combatant, prefer: Offset | null): Offset | null {
  if (!g.pos || !state.map) return null;
  const ok = (h: Offset) => isInside(h, { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 })
    && !placeProblem(state, h) && !occupantAt(state, h, c.id) && !bodyFitProblem(state, c, h)
    && gap(state, g, { ...c, pos: h }) === 1;
  if (prefer && ok(prefer)) return prefer;
  const near = bodyOf(state, g).flatMap((b) => withinRange(b, 4, { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 }));
  const seen = new Set<string>();
  const cands = near.filter((h) => { const k = `${h.col},${h.row}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (prefer ? distance(a, prefer) - distance(b, prefer) : 0) || a.row - b.row || a.col - b.col);
  return cands.find(ok) ?? null;
}

/** Hücum tutuyor mu: turdaki son düz koşu en az `feet` ve hedef o yönde bitişik. */
export function chargeHolds(actor: Combatant, target: Combatant, feet: number): boolean {
  if (!actor.run || !actor.pos || !target.pos || distance(actor.pos, target.pos) !== 1) return false;
  return actor.run.hexes * 5 >= feet && directionTo(actor.pos, target.pos) === actor.run.dir;
}

function saveFails(target: Combatant, save: { ability: Ability; dc: number }, rng: Rng, events: BattleEvent[], condition: string): boolean {
  const r = resolveSave({ extra: saveDice(target, save.ability), modifier: target.saves[save.ability], dc: save.dc, mode: saveMode('normal' as RollMode, target, save.ability),
    autoFail: (save.ability === 'str' || save.ability === 'dex') && autoFailsStrDexSave(target.conditions) }, rollTag(rng, { by: target.id }));
  events.push({ type: 'condition_save', targetId: target.id, condition, ability: save.ability, dc: save.dc, d20: r.d20?.rolls ?? [], total: r.total ?? 0, success: r.success, ...(r.extra ? { bonusDice: r.extra } : {}) });
  return !r.success;
}

/**
 * Rider'ın durum etkileri (isabette ya da save başarısızken): süreli durumlar, Prone (boyut ve
 * kurtarma zarıyla), yakalama, hücumla Prone. Elle tanımlı condition-effects.json önceliklidir
 * (onu durations.ts uygular; burada `conditions` yalnızca elle tanım yoksa üretilmiştir).
 */
export function riderConditionEvents(
  state: BattleState, actor: Combatant, target: Combatant, spec: RiderSpec | undefined, attackName: string, rng: Rng,
  monsterId: string | undefined = actor.monsterId,
): BattleEvent[] {
  // Kuyruk A2 (sürüm 30+): veriyle bağlanan ekler (süre, itme/çekme, hız/eylem kısıtı, ikinci aşama, 0 HP…); 0 HP'de de.
  const a2 = a2Events(state, actor, target, attackName, rng, monsterId);
  if (!spec || target.hp <= 0) return a2;
  const out: BattleEvent[] = [];
  const label = `${actor.name}: ${attackName}`;
  if (spec.conditions?.length && !attackEffect(monsterId, attackName)) {
    const ok = !spec.conditionSave || saveFails(target, spec.conditionSave, rng, out, spec.conditions[0]?.condition ?? '');
    if (ok) {
      for (const c of spec.conditions) {
        const save = typeof c.saveEnds === 'object' ? c.saveEnds : undefined;
        out.push({ type: 'condition_changed', targetId: target.id, condition: c.condition, present: true, reason: label, sourceId: actor.id,
          timer: makeTimer(state, c, c.condition, actor.id, target.id, label, save) });
      }
    }
  }
  const proneBy = (why: string, max?: string, save?: { ability: Ability; dc: number }) => {
    if (target.conditions.includes('Prone') || !fitsSize(target, max)) return;
    if (save && !saveFails(target, save, rng, out, 'Prone')) return;
    out.push({ type: 'condition_changed', targetId: target.id, condition: 'Prone', present: true, reason: why });
  };
  if (spec.prone) proneBy(label, spec.prone.maxSize, spec.prone.save);
  if (spec.charge?.prone && fitsSize(target, spec.charge.maxSize) && chargeHolds(actor, target, spec.charge.feet)) proneBy(`${label} (hücum)`, undefined, spec.charge.save);
  if (spec.grapple && !target.grapple && fitsSize(target, spec.grapple.maxSize)) {
    out.push({ type: 'grappled', targetId: target.id, by: actor.id, escapeDc: spec.grapple.escapeDc, restrained: spec.grapple.restrained, label });
  }
  return [...out, ...a2];
}

/**
 * Saldırının elle tanımlı süreli etkisi (condition-effects.json; Wyvern zehri, Ghoul felci…): isabette, varsa hedefin
 * kurtarma zarından sonra. `monsterId` canavar ya da Wild Shape biçimi (K13). `target` isabetten sonraki HP'siyle.
 */
export function attackEffectEvents(
  state: BattleState, actor: Combatant, target: Combatant, monsterId: string | undefined, attackName: string, rng: Rng,
): BattleEvent[] {
  const effect = attackEffect(monsterId, attackName);
  if (!effect || target.hp <= 0) return [];
  const out: BattleEvent[] = [];
  if (effect.save && !saveFails(target, effect.save, rng, out, effect.condition ?? '')) return out;
  out.push(timedCondition(state, target.id, effect, actor.id, `${actor.name}: ${attackName}`));
  return out;
}

/** Yürüme/atlama komutundan önce yerdeyse otomatik ayağa kalkar. */
export const needsStand = (actor: Combatant, cmd: Command) => (cmd.type === 'move' || cmd.type === 'jump') && actor.conditions.includes('Prone');
