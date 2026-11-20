/**
 * Hazırla (Ready) eylemi, SRD 5.2.1 s.186–187 (kural sürümü 90; `readySurum.ts`). Yan etkisiz.
 *
 * - Komut `ready`: kendi turunda eylem (`economy.ts`). Algılanabilir bir tetik (`data/hazirla.json`) ve yanıt seçilir:
 *   tek saldırı (Extra Attack yalnız kendi turunda: s.48), hızın kadar hareket ya da hazırlanan büyü.
 * - Büyü (R2): döküm süresi eylem olmalı; slot hazırlarken harcanır ve tetik gelmezse geri gelmez; tutmak konsantrasyon
 *   ister (`ready:<büyü>` adıyla); konsantrasyon bozulursa büyü etkisiz dağılır. Hedef salınırken seçilir (tepki sorusu).
 *   Konsantrasyonlu büyü salınınca kendi konsantrasyonu tutmanın yerini alır (tek konsantrasyon).
 * - Tetik olunca, tetik bittikten hemen sonra tepkiyle yanıt verilir ya da tetik yok sayılır (karar `askReaction`).
 *   Tepki hakkı fırsat saldırısıyla ortak (`canReact`/`reactionUsed`); önce tetiklenen harcar.
 * - Hazırlık sonraki turunun başında biter (`ready_lapsed`); Incapacitated, düşme, haritadan ayrılma ve tutma
 *   konsantrasyonunun bozulması da bitirir.
 * - Time Stop sürerken başkasının hazırlığı tetiklenmez ("no time passes for other creatures").
 * - Yapay zekâ Ready kullanmaz (bu sürümde).
 */
import { sinif97On } from './sinif97Surum';
import { cunningProblem } from './classTraits';
import { spells } from '../data';
import hazirla from '../../data/hazirla.json';
import { distance, isInside, sameHex, type Offset } from '../rules/hex';
import { askReaction, type ReactionOption } from '../rules/reactionChoice';
import { isIncapacitated } from '../rules/conditions';
import type { Rng } from '../rules/dice';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { turnKey } from './economy';
import { meleeOf, weaponAttackEvents, withPos } from './features';
import { hiddenTo } from './k74Surum';
import { canSee } from './maprules';
import { monsterAttackEvents } from './monsters';
import { executeMove } from './movement';
import { checkReach, monsterAttackReach, optionReach } from './range';
import { canReact, feetBetween, reactionUsed, registerAfterAttack } from './reactions';
import { readyOn } from './readySurum';
import { applyEvents } from './reduce';
import { spendSlot } from './slots';
import { registerAfterStep, registerCommandEnd, registerTurnStart } from './turnHooks';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, ReadiedAction, ReadyResponse } from './types';

export type ReadyEventKind = 'adim' | 'saldiri' | 'buyu' | 'hareketBitti';
export interface ReadyTriggerDef {
  id: string; olay: ReadyEventKind; kosul: 'erisim' | 'altigen' | 'mesafe' | 'herhangi' | 'dost' | 'bana';
  mesafeFt?: number; ad: { tr: string; en: string };
}
export const READY_TRIGGERS = hazirla.tetikler as ReadyTriggerDef[];
export const READY_RESPONSES = hazirla.yanitlar as Array<{ id: ReadyResponse['kind']; ad: { tr: string; en: string } }>;
export const readyTrigger = (id: string): ReadyTriggerDef | undefined => READY_TRIGGERS.find((t) => t.id === id);

/** Tutulan büyünün konsantrasyon adı. */
export const holdName = (spellName: string): string => `ready:${spellName}`;
/** Tutulan büyü hâlâ tutuluyor mu (konsantrasyon bozulmadı). */
const holdIntact = (c: Combatant): boolean =>
  c.readied?.response.kind !== 'spell' || c.concentration?.spell === holdName(c.readied.response.spellName);

/** Büyü salma (iç komut) için komut yürütücüsü: `commands.ts` yüklenirken kaydeder (döngüsel içe aktarma yok). */
type CastExec = (state: BattleState, cmd: Extract<Command, { type: 'cast_spell' }>, rng: Rng) => CommandResult;
let castExec: CastExec | null = null;
export const registerReadyCast = (f: CastExec): void => { castExec = f; };

const DRY: Rng = () => 0.5;
const responseLabel = (r: ReadyResponse): string =>
  r.kind === 'attack' ? `saldırı (${r.option?.label ?? 'canavar saldırısı'})` : r.kind === 'move' ? 'hareket' : `büyü (${r.spellName})`;

// ---------------------------------------------------------------- komut

/** Hazırlığın neden kurulamadığı (yoksa null): sürüm, harita, tetik, yanıt. Kapılar (sıra, eylem, Incapacitated, binek, beden) `commands.ts`'te. */
export function readyProblem(state: BattleState, actor: Combatant, cmd: Extract<Command, { type: 'ready' }>): string | null {
  if (!readyOn(state)) return 'Hazırla bu kural sürümünde yok (sürüm 90 ve üstü).';
  if (!state.map || !actor.pos) return 'Hazırla yalnızca haritalı savaşta.';
  if (actor.offFloor) return `${actor.name} haritada değil: hazırlanamaz.`;
  if (actor.readied) return 'Zaten hazırlanmış bir eylem var.';
  const t = readyTrigger(cmd.trigger);
  if (!t) return `Bilinmeyen tetik: ${cmd.trigger}.`;
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  if (t.kosul === 'altigen' && (!cmd.hex || !isInside(cmd.hex, size))) return 'Tetik altıgenini seç.';
  if (cmd.sourceId) {
    const s = state.combatants[cmd.sourceId];
    if (!s || s.side === actor.side) return 'Tetikleyen bir düşman olmalı.';
  }
  const r = cmd.response;
  if (r.kind === 'attack') {
    if (r.option) {
      if (!actor.weaponOptions.some((o) => o.label === r.option?.label)) return 'Bu saldırı seçeneği yok.';
    } else {
      const a = actor.attacks[r.attackIndex ?? -1];
      if (!a || a.save || !a.damageDice) return 'Bu saldırı hazırlanamaz.';
    }
    if (actor.effects?.some((e) => e.noAttack)) return 'Bu durumda saldırı hazırlanamaz.';
    // Görev B95-B (97+): hazırlanan saldırının Cunning Strike seçenekleri (Sneak Attack verirse uygulanır).
    if (r.cunning?.length) {
      if (!sinif97On(state) || !r.option) return 'Bu saldırıda Cunning Strike hazırlanamaz.';
      const bad = cunningProblem(actor, r.cunning);
      if (bad) return bad;
    }
  } else if (r.kind === 'move') {
    if (!isInside(r.to, size) || sameHex(r.to, actor.pos)) return 'Hareket hedefini seç.';
  } else {
    const sp = spells.find((s) => s.name === r.spellName);
    if (!sp) return `Büyü bulunamadı: ${r.spellName}`;
    if (!actor.spellNames.includes(sp.name)) return 'Bu büyüyü bilmiyor.';
    // SRD 5.2.1 s.186: hazırlanan büyünün döküm süresi bir eylem olmalı.
    if (sp.castingTime !== 'action') return `${sp.name} hazırlanamaz: döküm süresi eylem olmalı.`;
    if (actor.shape && !actor.traits?.includes('beast-spells')) return 'Wild Shape biçiminde büyü hazırlanamaz.';
    if (actor.rage) return 'Rage sürerken büyü hazırlanamaz (konsantrasyon sürdürülemez).';
  }
  return null;
}

/** `ready` komutu (eylem ekonomisi ve sıra denetimi `execute`/`executeCommand`'de). */
export function executeReady(state: BattleState, actor: Combatant, cmd: Extract<Command, { type: 'ready' }>): CommandResult {
  const problem = readyProblem(state, actor, cmd);
  if (problem) return fail(problem);
  const events: BattleEvent[] = [];
  let response: ReadyResponse = cmd.response;
  if (response.kind === 'attack' && response.option) {
    const own = actor.weaponOptions.find((o) => o.label === (response as { option: AttackOption }).option.label) as AttackOption;
    response = { kind: 'attack', option: own, ...(response.cunning?.length ? { cunning: response.cunning } : {}) };
  }
  if (response.kind === 'spell') {
    const sp = spells.find((s) => s.name === (response as { spellName: string }).spellName)!;
    // Slot hemen harcanır (tetik gelmezse geri gelmez); tutmak konsantrasyon ister.
    const slot = spendSlot(actor, sp.level, response.slotLevel ?? undefined, sp.name);
    if (!slot.ok) return slot;
    events.push(...slot.events);
    response = { kind: 'spell', spellName: sp.name, slotLevel: slot.slotLevel };
    events.push({ type: 'concentration_started', actorId: actor.id, spell: holdName(sp.name), slotLevel: slot.slotLevel ?? 0, turn: turnKey(state) });
  }
  const t = readyTrigger(cmd.trigger)!;
  const readied: ReadiedAction = {
    trigger: t.id, response, round: state.round,
    ...(cmd.sourceId ? { sourceId: cmd.sourceId } : {}), ...(cmd.hex ? { hex: cmd.hex } : {}),
  };
  events.unshift({ type: 'readied', actorId: actor.id, readied, label: `${actor.name} hazırlandı: ${t.ad.tr} → ${responseLabel(response)}` });
  return finish(state, events);
}

// ---------------------------------------------------------------- tetik

interface Trigger { olay: ReadyEventKind; sourceId: string; targetId?: string; from?: Offset }

/** Erişim (ft): hazırlanan saldırının erişimi, yoksa en iyi yakın dövüş erişimi (en az 5 ft). */
function reachFtOf(c: Combatant): number {
  const r = c.readied?.response;
  if (r?.kind === 'attack') {
    if (r.option) return r.option.ranged ? 5 : r.option.reachFt ?? 5;
    const a = c.attacks[r.attackIndex ?? 0];
    if (a && !a.ranged) return a.reachFt ?? 5;
  }
  return Math.max(5, meleeOf(c)?.reachFt ?? 5);
}

/** Hazırlık bu olayla tetikleniyor mu (algılanabilir, karşı taraf, koşul). */
export function readyFires(state: BattleState, c: Combatant, ev: Trigger): boolean {
  const r = c.readied;
  if (!r || !c.pos || c.offFloor || !canReact(c) || !holdIntact(c)) return false;
  if (state.timeStop && state.timeStop.actorId !== c.id) return false;
  const t = readyTrigger(r.trigger);
  if (!t || t.olay !== ev.olay) return false;
  const src = state.combatants[ev.sourceId];
  if (!src || src.id === c.id || src.hp <= 0 || !src.pos || src.side === c.side) return false;
  if (r.sourceId && r.sourceId !== src.id) return false;
  // SRD: tetik algılanabilir olmalı (görünmez, saklanan, karanlıktaki tetikleyen yok).
  if (hiddenTo(state, c, src) || !canSee(state, c, src)) return false;
  switch (t.kosul) {
    case 'erisim':
    case 'mesafe': {
      const lim = t.kosul === 'erisim' ? reachFtOf(c) : t.mesafeFt ?? 30;
      if (feetBetween(state, c, src) > lim) return false;
      if (!ev.from) return true;
      const before = withPos(state, src.id, ev.from);
      return feetBetween(before, before.combatants[c.id] as Combatant, before.combatants[src.id] as Combatant) > lim;
    }
    case 'altigen': return !!r.hex && sameHex(src.pos, r.hex);
    case 'dost': { const tg = ev.targetId ? state.combatants[ev.targetId] : undefined; return !!tg && tg.id !== c.id && tg.side === c.side; }
    case 'bana': return ev.targetId === c.id;
    default: return true;
  }
}

/** Saldırı yanıtının geçerli hedefleri (tetikleyen önce). */
function attackTargets(state: BattleState, c: Combatant, sourceId: string): Combatant[] {
  const r = c.readied?.response;
  if (r?.kind !== 'attack') return [];
  const reach = r.option ? optionReach(r.option) : monsterAttackReach(c.attacks[r.attackIndex ?? 0] as NonNullable<Combatant['attacks'][number]>);
  return Object.values(state.combatants)
    .filter((t) => t.id !== c.id && t.side !== c.side && t.pos && isTargetable(t) && !t.civilian && !hiddenTo(state, c, t) && canSee(state, c, t) && checkReach(state, c, t, reach).ok)
    .sort((a, b) => (a.id === sourceId ? -1 : b.id === sourceId ? 1 : distance(c.pos!, a.pos!) - distance(c.pos!, b.pos!)));
}

/** Büyü yanıtının salma komutu (seçim: yaratık kimliği ya da hedefsiz `-`). */
function spellCmd(state: BattleState, c: Combatant, choice: string): Extract<Command, { type: 'cast_spell' }> {
  const r = c.readied?.response as Extract<ReadyResponse, { kind: 'spell' }>;
  const sp = spells.find((s) => s.name === r.spellName);
  const t = choice === '-' ? undefined : state.combatants[choice];
  const base = { type: 'cast_spell' as const, actorId: c.id, spellName: r.spellName, fromReady: true, ...(r.slotLevel ? { slotLevel: r.slotLevel } : {}) };
  if (!t) return base;
  return sp?.area && t.pos ? { ...base, targetHex: t.pos, targetId: t.id } : { ...base, targetId: t.id, targetIds: [t.id] };
}

/** Salma anında slotu yerine koyulmuş geçici durum (slot hazırlarken harcandı; salma olayı slotu yeniden düşürmez). */
function withHeldSlot(state: BattleState, c: Combatant): BattleState {
  const r = c.readied?.response;
  const lvl = r?.kind === 'spell' ? r.slotLevel ?? 0 : 0;
  if (!lvl) return state;
  const slots = [...c.spellSlots];
  slots[lvl - 1] = (slots[lvl - 1] ?? 0) + 1;
  return { ...state, combatants: { ...state.combatants, [c.id]: { ...c, spellSlots: slots } } };
}
/** Salma olaylarından yer tutucu slot harcamasını çıkarır. */
function dropHeldSlot(events: BattleEvent[], c: Combatant, lvl: number): BattleEvent[] {
  if (!lvl) return events;
  const i = events.findIndex((e) => e.type === 'slot_spent' && e.actorId === c.id && e.level === lvl);
  return i < 0 ? events : [...events.slice(0, i), ...events.slice(i + 1)];
}

function spellChoices(state: BattleState, c: Combatant): Array<{ id: string; label: string }> {
  if (!castExec) return [];
  const cands = ['-', ...Object.values(state.combatants).filter((t) => t.pos && t.hp > 0 && !t.summon?.gone && !t.offFloor).map((t) => t.id)];
  const out: Array<{ id: string; label: string }> = [];
  const sim = withHeldSlot(state, c);
  for (const id of cands) {
    const r = castExec(sim, spellCmd(sim, sim.combatants[c.id] as Combatant, id), DRY);
    if (r.ok) out.push({ id, label: id === '-' ? (c.readied?.response as { spellName: string }).spellName : (state.combatants[id] as Combatant).name });
  }
  // Hedefsiz yapılabiliyorsa yaratık seçimi gerekmez.
  return out.some((x) => x.id === '-') ? out.filter((x) => x.id === '-') : out;
}

/** Tetiklenen hazırlığın salınması: karar, tepki, yanıt olayları. Kullanılmazsa boş (hazırlık sürer). */
function release(state: BattleState, c: Combatant, ev: Trigger, rng: Rng): BattleEvent[] {
  const r = c.readied as ReadiedAction;
  const t = readyTrigger(r.trigger) as ReadyTriggerDef;
  const src = state.combatants[ev.sourceId] as Combatant;
  let choices: Array<{ id: string; label: string }> | undefined;
  if (r.response.kind === 'attack') {
    choices = attackTargets(state, c, src.id).map((x) => ({ id: x.id, label: x.name }));
    if (!choices.length) return [];
  } else if (r.response.kind === 'move') {
    const probe = executeMove(state, { ...c, movementUsed: 0 }, r.response.to, DRY);
    if (!probe.ok) return [];
  } else {
    choices = spellChoices(state, c);
    if (!choices.length) return [];
  }
  const option: ReactionOption = { id: 'ready', name: `Hazırla: ${responseLabel(r.response)}`, ...(choices ? { choices } : {}) };
  const answer = askReaction(rng, {
    reactorId: c.id, trigger: 'ready', sourceId: src.id, info: { label: t.ad.tr }, options: [option],
    suggested: { option: 'ready', ...(choices ? { choice: (choices[0] as { id: string }).id } : {}) },
  });
  if (!answer) return [];
  const head: BattleEvent[] = [
    reactionUsed(c, { id: 'ready', name: 'Ready' }, 'ready', src.id),
    { type: 'ready_released', actorId: c.id, sourceId: src.id, trigger: t.id, label: `${c.name}: hazırlanan eylem (${t.ad.tr})` },
  ];
  const s1 = applyEvents(state, head);
  const me = s1.combatants[c.id] as Combatant;
  const resp = r.response;
  if (resp.kind === 'attack') {
    const target = s1.combatants[answer.choice ?? ''] as Combatant;
    const cun = resp.cunning?.length && sinif97On(s1) && !cunningProblem(me, resp.cunning) ? { cunning: resp.cunning } : {};
    const res = resp.option ? weaponAttackEvents(s1, me, target, resp.option, rng, true, false, cun) : monsterAttackEvents(s1, me, target, resp.attackIndex ?? 0, rng, true);
    if (!res.ok) return [];
    return [...head, ...res.events.map((e) => {
      if (e.type !== 'attack_resolved' || e.actorId !== c.id) return e;
      const { opportunity: _o, ...rest } = e;
      return { ...rest, ready: true };
    })];
  }
  if (resp.kind === 'move') {
    const res = executeMove(s1, { ...me, movementUsed: 0 }, resp.to, rng);
    if (!res.ok) return [];
    return [...head, ...res.events.map((e) => (e.type === 'moved' && e.actorId === c.id ? { ...e, reaction: true } : e))];
  }
  if (!castExec) return [];
  const sim = withHeldSlot(s1, { ...me, readied: r });
  const res = castExec(sim, spellCmd(sim, { ...(sim.combatants[c.id] as Combatant), readied: r }, answer.choice ?? '-'), rng);
  if (!res.ok) return [];
  return [...head, ...dropHeldSlot(res.events, c, resp.slotLevel ?? 0)];
}

/** Olaya bağlı bütün hazırlıklar (sıra düzeninde; her salma bir sonrakini görür). */
export function readyTriggerEvents(state: BattleState, ev: Trigger, rng: Rng): BattleEvent[] {
  if (!readyOn(state) || !Object.values(state.combatants).some((c) => c.readied)) return [];
  const out: BattleEvent[] = [];
  let cur = state;
  for (const id of state.order) {
    const c = cur.combatants[id];
    if (!c?.readied || !readyFires(cur, c, ev)) continue;
    const evs = release(cur, c, ev, rng);
    if (!evs.length) continue;
    out.push(...evs);
    cur = applyEvents(cur, evs);
  }
  return out;
}

/** Biten hazırlıklar: düştü, haritadan ayrıldı, Incapacitated, tutma konsantrasyonu bozuldu. */
export function readyCleanupEvents(state: BattleState): BattleEvent[] {
  if (!readyOn(state)) return [];
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    if (!c.readied) continue;
    const reason = c.hp <= 0 ? 'died' : c.offFloor || c.summon?.gone ? 'gone' : isIncapacitated(c.conditions) ? 'incapacitated' : !holdIntact(c) ? 'concentration' : null;
    if (reason) out.push({ type: 'ready_lapsed', actorId: c.id, reason, label: `${c.name}: hazırlık bitti` });
  }
  return out;
}

// ---------------------------------------------------------------- kancalar

// Düşman yürürken her adımdan sonra (erişime/altıgene/menzile girme).
registerAfterStep((state, moverId, from, rng) => readyTriggerEvents(state, { olay: 'adim', sourceId: moverId, from }, rng));
// Saldırı çözüldükten sonra.
registerAfterAttack((state, attackerId, targetId, _info, rng) => readyTriggerEvents(state, { olay: 'saldiri', sourceId: attackerId, targetId }, rng));
// Komut sonu: büyü yapıldı, hareket bitti; ardından biten hazırlıklar.
registerCommandEnd((_before, next, events, cmd, rng) => {
  if (!readyOn(next)) return [];
  const out: BattleEvent[] = [];
  let cur = next;
  const add = (evs: BattleEvent[]) => { if (evs.length) { out.push(...evs); cur = applyEvents(cur, evs); } };
  const seen = new Set<string>();
  // Büyü yapanlar: komutun büyüsü (saldırı büyüsü yalnız `attack_resolved` üretir) ve olaylardaki `spell_cast`.
  const casters = [...(cmd.type === 'cast_spell' && !cmd.fromReady ? [cmd.actorId] : []), ...events.flatMap((e) => (e.type === 'spell_cast' ? [e.actorId] : []))];
  for (const id of casters) {
    if (!seen.has(`b:${id}`)) { seen.add(`b:${id}`); add(readyTriggerEvents(cur, { olay: 'buyu', sourceId: id }, rng)); }
  }
  for (const e of [...events].reverse()) {
    if (e.type === 'moved' && !seen.has(`m:${e.actorId}`)) { seen.add(`m:${e.actorId}`); add(readyTriggerEvents(cur, { olay: 'hareketBitti', sourceId: e.actorId }, rng)); }
  }
  add(readyCleanupEvents(cur));
  return out;
});
// Sonraki turunun başında biter.
registerTurnStart((state, id) => {
  const c = state.combatants[id];
  if (!c?.readied || !readyOn(state)) return [];
  return [{ type: 'ready_lapsed', actorId: id, reason: 'turnStart', label: `${c.name}: hazırlık süresi doldu` }];
});
