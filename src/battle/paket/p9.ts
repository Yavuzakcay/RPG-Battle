/**
 * Kuyruk P9: ek paket ilkel genişletme 3 (kural sürümü 38+; eski savaşta hiçbiri çalışmaz). Var olan kancalara bağlanır:
 * - tepki olayları: `firsatSaldirisi` ve `kurtulmaAttirildi` komut sonunda (`attack_resolved.opportunity`, `save_resolved`),
 *   `isaretliVurdu` / `komsuHedefVuruldu` / `banaIsabet + hareketEt` saldırı sonrasında (`registerAfterAttack`),
 *   `dusmanBuyuAtiyor` büyü yapılırken (`registerCastHook`, Counterspell anı);
 * - etkiler `hizSifir` (süren etki `speedZero`), `hasarEkle` (`hitEffect`), `buyuIptal` (büyü boşa), `hareketEt` (ışınlanma
 *   girişiyle yarı hız uzaklaşma: yol bulmaz, kısmi);
 * - `isaret.aktar` (işaretli düşünce en yakın düşmana), `buyuPaylas` (kendine yapılan büyü etkisi dosta da), `olumZari`
 *   (ölüm kurtulması başarısında can), `cagirGuclendir.turBasiCan` (çağrıya tur başı
 *   geçici can). Saf; zar `rng` ile. Paketsiz savaşta olay üretmez.
 */
import { gap } from '../body';
import { canReact, reactionUsed, registerAfterAttack, registerCastHook, strikeApi } from '../reactions';
import { registerAfterOpportunity, registerCommandEnd, registerTurnStart } from '../turnHooks';
import { applyEvents, speedHexes } from '../reduce';
import { hitEffect } from '../maprules';
import { teleportEvent, teleportProblem } from '../teleport';
import { saveDice } from '../effectDice';
import { saveMode } from '../durations';
import { turnKey } from '../economy';
import { resolveSave } from '../../rules/attack';
import { askReaction } from '../../rules/reactionChoice';
import { rollTag, type Rng } from '../../rules/dice';
import { distance, isInside, type Offset } from '../../rules/hex';
import { spells } from '../../data';
import type { Ability } from '../../rules/abilities';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from '../types';
import { alive, amount, canPay, costOf, dcOf, flatNum, formul, kosulOk, markId, p10On, p9On, usedKey, usedThisTurn, val, within, type Ilkel, type PaketOzellik } from './core';

interface Ref { feat: PaketOzellik; p: Ilkel; i: number }
const refs = (c: Combatant | undefined, pick: (p: Ilkel) => boolean): Ref[] =>
  (c?.paket?.ozellikler ?? []).flatMap((feat) => feat.ilkeller.map((p, i) => ({ feat, p, i }))).filter((x) => pick(x.p));
const nameOf = (r: Ref) => (r.p.ad as string | undefined) ?? r.feat.ad;
const ft = (p: Ilkel, f: string, c: Combatant) => flatNum(val(p, f), c);
const tepkiOf = (olay: string) => (p: Ilkel) => p.tur === 'tepki' && p.olay === olay;

/** Kaynak ve (varsa) turda bir işareti. */
function costEvents(state: BattleState, g: Combatant, r: Ref): BattleEvent[] {
  const k = costOf(g, r.p);
  return [...(k ? [{ type: 'feature_used' as const, actorId: g.id, feature: k.id, remaining: (g.resources[k.id] ?? 0) - k.cost }] : []),
    ...(r.p.turdaBir ? [{ type: 'trait_turn' as const, actorId: g.id, trait: usedKey(r.feat.key, r.i), key: turnKey(state) }] : [])];
}
const ready = (state: BattleState, g: Combatant, r: Ref, target?: Combatant) =>
  canPay(g, r.p) && kosulOk(state, g, r.p, target) && !(r.p.turdaBir && usedThisTurn(state, g, r.feat.key, r.i));

function ask(rng: Rng, g: Combatant, src: Combatant, label: string, opt: { id: string; name: string }, trigger: 'ally' | 'cast' = 'ally'): boolean {
  return askReaction(rng, { reactorId: g.id, trigger, sourceId: src.id, info: { label, total: 0, ac: 0, damage: 0 }, options: [opt], suggested: { option: opt.id } })?.option === opt.id;
}

/** Kurtulma (hasarsız): `save_resolved` olayı ve sonuç. */
function saveVs(g: Combatant, label: string, p: Ilkel, t: Combatant, rng: Rng): { ev: BattleEvent; success: boolean } {
  const save = p.save as Record<string, unknown>;
  const ab = (save.yetenek ?? 'con') as Ability;
  const dc = dcOf(save, g);
  const mode = saveMode('normal', t, ab, g);
  const sv = resolveSave({ extra: saveDice(t, ab), modifier: t.saves[ab], dc, mode }, rollTag(rng, { by: t.id }));
  return { success: sv.success, ev: { type: 'save_resolved', actorId: g.id, targetId: t.id, label, ability: ab, dc, mode, reasons: [], d20: sv.d20?.rolls ?? [], natural: sv.d20?.kept ?? null,
    total: sv.total, success: sv.success, damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: t.hp, effects: [], conditionsAdded: [],
    ...(sv.extra ? { bonusDice: sv.extra } : {}) } };
}

/** `hizSifir` / `hasarEkle` etkisi olaydaki düşmana. */
function onFoe(state: BattleState, g: Combatant, r: Ref, t: Combatant, rng: Rng): BattleEvent[] {
  const name = nameOf(r);
  if (r.p.etki === 'hasarEkle') return [hitEffect(t, 'paket', name, { damage: formul(r.p.miktar, g), damageType: val<string>(r.p, 'hasarTuru') }, rng)];
  if (r.p.etki === 'hizSifir') {
    const out: BattleEvent[] = [];
    if (r.p.save) { const sv = saveVs(g, name, r.p, t, rng); out.push(sv.ev); if (sv.success) return out; }
    out.push({ type: 'effect_added', targetId: t.id, effect: { id: `pk-hiz0:${g.id}:${t.id}`, name, sourceId: g.id, speedZero: true, untilOwnTurnEnd: true, until: state.round + 1, icon: '⛓' } as ActiveEffect });
    return out;
  }
  // P10 (sürüm 39+): fırsat saldırısından / düşman yaklaşınca hareket (uzak ya da yakın; ışınlanma girişi).
  if (r.p.etki === 'hareketEt' && p10On(state)) {
    const me = state.combatants[g.id] as Combatant;
    const to = moveHex(state, me, t, val<string>(r.p, 'yon') === 'yakin' ? 'yakin' : 'uzak');
    return to ? [teleportEvent(me, to, name)] : [];
  }
  return [];
}

/** Yarı hızın kadar saldırgandan uzak, boş, görülen altıgen (ışınlanma girişi; yol bulmaz). */
function retreatHex(state: BattleState, g: Combatant, from: Combatant): Offset | null { return moveHex(state, g, from, 'uzak'); }

/** P10: yarı hız içinde `from`'dan en uzak (uzak) ya da ona bitişik en yakın (yakin) boş, görülen altıgen. */
export function moveHex(state: BattleState, g: Combatant, from: Combatant, yon: 'uzak' | 'yakin'): Offset | null {
  if (yon === 'yakin') return approachHex(state, g, from);
  return fleeHex(state, g, from);
}
function approachHex(state: BattleState, g: Combatant, from: Combatant): Offset | null {
  if (!state.map || !g.pos || !from.pos) return null;
  const r = Math.floor(speedHexes(g) / 2);
  if (r < 1 || distance(g.pos, from.pos) <= 1) return null;
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  let best: { h: Offset; d: number } | null = null;
  for (let row = g.pos.row - r - 1; row <= g.pos.row + r + 1; row++) for (let col = g.pos.col - r - 1; col <= g.pos.col + r + 1; col++) {
    const h = { col, row };
    if (!isInside(h, size) || distance(g.pos, h) > r || teleportProblem(state, g, h, { rangeFt: r * 5, sight: true })) continue;
    const d = distance(from.pos, h);
    if (d < 1) continue;
    if (!best || d < best.d || (d === best.d && distance(g.pos, h) < distance(g.pos, best.h))) best = { h, d };
  }
  return best && best.d < distance(from.pos, g.pos) ? best.h : null;
}
function fleeHex(state: BattleState, g: Combatant, from: Combatant): Offset | null {
  if (!state.map || !g.pos || !from.pos) return null;
  const r = Math.floor(speedHexes(g) / 2);
  if (r < 1) return null;
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  let best: { h: Offset; d: number } | null = null;
  for (let row = g.pos.row - r - 1; row <= g.pos.row + r + 1; row++) for (let col = g.pos.col - r - 1; col <= g.pos.col + r + 1; col++) {
    const h = { col, row };
    if (!isInside(h, size) || distance(g.pos, h) > r || teleportProblem(state, g, h, { rangeFt: r * 5, sight: true })) continue;
    const d = distance(from.pos, h);
    if (!best || d > best.d || (d === best.d && (h.row - best.h.row || h.col - best.h.col) < 0)) best = { h, d };
  }
  return best && best.d > distance(from.pos, g.pos) ? best.h : null;
}

// ------------------------------------------------------------------ saldırı sonrası

registerAfterAttack((state, attackerId, targetId, info, rng) => {
  if (!info.hit || !p9On(state)) return [];
  const attacker = state.combatants[attackerId];
  const target = state.combatants[targetId];
  if (!attacker || !target || attacker.side === target.side) return [];
  for (const g of Object.values(state.combatants)) {
    if (!g.paket || !canReact(g) || g.hp <= 0) continue;
    // banaIsabet + hareketEt: vurulan uzaklaşır.
    if (g.id === target.id) for (const r of refs(g, (p) => p.tur === 'tepki' && p.olay === 'banaIsabet' && p.etki === 'hareketEt')) {
      if (!ready(state, g, r, attacker)) continue;
      const to = retreatHex(state, g, attacker);
      if (!to || !ask(rng, g, attacker, nameOf(r), { id: usedKey(r.feat.key, r.i), name: nameOf(r) })) continue;
      const k = costOf(g, r.p);
      return [reactionUsed(g, { id: usedKey(r.feat.key, r.i), name: nameOf(r), ...(k ? { resource: k.id } : {}) }, 'ally', attacker.id), ...costEvents(state, g, { ...r, p: { ...r.p, kaynak: undefined } }), teleportEvent(g, to, nameOf(r))];
    }
    // isaretliVurdu: senin işaretlediğin saldırgan sana ya da dostuna isabet etti.
    const marked = g.side === target.side && !!attacker.effects?.some((e) => e.id.startsWith('pk-isaret:') && e.id.endsWith(`:${g.id}`));
    // komsuHedefVuruldu: sana bitişik düşmana bir dostun isabet etti.
    const neighbour = g.side === attacker.side && g.id !== attacker.id && target.side !== g.side && !!g.pos && !!target.pos && gap(state, g, target) <= 1;
    for (const r of refs(g, (p) => p.tur === 'tepki' && ((marked && p.olay === 'isaretliVurdu') || (neighbour && p.olay === 'komsuHedefVuruldu')))) {
      const foe = r.p.olay === 'isaretliVurdu' ? attacker : target;
      if (!alive(foe) || !ready(state, g, r, foe)) continue;
      if (r.p.olay === 'isaretliVurdu' && g.id !== target.id && !within(state, g, target, ft(r.p, 'menzilFt', g))) continue;
      const api = strikeApi();
      if (r.p.etki === 'saldiriYap' && !(api && api.can(state, g.id, foe.id))) continue;
      const opt = { id: usedKey(r.feat.key, r.i), name: nameOf(r) };
      if (!ask(rng, g, foe, nameOf(r), opt)) continue;
      const k = costOf(g, r.p);
      const react = reactionUsed(g, { ...opt, ...(k ? { resource: k.id } : {}) }, 'ally', foe.id);
      const marks = costEvents(state, g, { ...r, p: { ...r.p, kaynak: undefined } });
      const cur = applyEvents(state, [react, ...marks]);
      if (r.p.etki === 'saldiriYap') return [react, ...marks, ...(api as NonNullable<typeof api>).strike(cur, g.id, foe.id, rng)];
      return [react, ...marks, ...onFoe(cur, g, r, cur.combatants[foe.id] as Combatant, rng)];
    }
  }
  return [];
});

// ------------------------------------------------------------------ fırsat saldırısı

/** Fırsat saldırın isabet etti (tepki zaten harcandı): `hizSifir` yürüyüşü keser (`movement.ts`), `hasarEkle`. */
registerAfterOpportunity((state, attackerId, targetId, events, rng) => {
  if (!p9On(state)) return [];
  const g = state.combatants[attackerId];
  const t = state.combatants[targetId];
  if (!g?.paket || !alive(t) || !events.some((e) => e.type === 'attack_resolved' && e.actorId === g.id && e.hit)) return [];
  const out: BattleEvent[] = [];
  let cur = state;
  for (const r of refs(g, tepkiOf('firsatSaldirisi'))) {
    // P10: hareketEt yürüyüş bitince (komut sonunda; `p10.ts`).
    if (r.p.etki === 'hareketEt') continue;
    if (!ready(cur, cur.combatants[g.id] as Combatant, r, t)) continue;
    const evs = [...costEvents(cur, cur.combatants[g.id] as Combatant, r), ...onFoe(cur, g, r, cur.combatants[t.id] as Combatant, rng)];
    out.push(...evs);
    cur = applyEvents(cur, evs);
  }
  return out;
});

// ------------------------------------------------------------------ büyü yapılırken

registerCastHook((state, caster, spellName, _level, rng) => {
  if (!p9On(state)) return null;
  for (const id of state.order) {
    const g = state.combatants[id];
    if (!g?.paket || g.side === caster.side || !canReact(g)) continue;
    for (const r of refs(g, tepkiOf('dusmanBuyuAtiyor'))) {
      if (!ready(state, g, r, caster) || !within(state, g, caster, ft(r.p, 'menzilFt', g))) continue;
      const api = strikeApi();
      if (r.p.etki === 'saldiriYap' && !(api && api.can(state, g.id, caster.id))) continue;
      const opt = { id: usedKey(r.feat.key, r.i), name: nameOf(r) };
      if (!ask(rng, g, caster, spellName, opt, 'cast')) continue;
      const k = costOf(g, r.p);
      const events: BattleEvent[] = [reactionUsed(g, { ...opt, ...(k ? { resource: k.id } : {}) }, 'cast', caster.id), ...costEvents(state, g, { ...r, p: { ...r.p, kaynak: undefined } })];
      if (r.p.etki === 'buyuIptal') {
        if (r.p.save) { const sv = saveVs(g, nameOf(r), r.p, caster, rng); events.push(sv.ev); if (sv.success) return { countered: false, events }; }
        // P10 (sürüm 39+): geri tepme hasarı büyücüye.
        if (r.p.geriTepme !== undefined && p10On(state)) events.push(hitEffect(caster, 'paket', nameOf(r), { damage: formul(r.p.geriTepme, g), damageType: val<string>(r.p, 'hasarTuru') }, rng));
        return { countered: true, events };
      }
      const hits = (api as NonNullable<typeof api>).strike(applyEvents(state, events), g.id, caster.id, rng);
      events.push(...hits);
      const hit = hits.some((e) => e.type === 'attack_resolved' && e.actorId === g.id && e.hit);
      const down = (applyEvents(state, events).combatants[caster.id]?.hp ?? 0) <= 0;
      return { countered: down || (hit && !!r.p.iptal), events };
    }
  }
  return null;
});

// ------------------------------------------------------------------ tur başı

/** Çağrı güçlendirme: sahibinin `cagirGuclendir.turBasiCan`'ı çağrının kendi tur başında geçici can. */
registerTurnStart((state, id, rng) => {
  if (!p9On(state)) return [];
  const c = state.combatants[id];
  const owner = c?.summon && !c.summon.gone ? state.combatants[c.summon.by] : undefined;
  if (!c || c.hp <= 0 || !owner?.paket) return [];
  const out: BattleEvent[] = [];
  for (const r of refs(owner, (p) => p.tur === 'cagirGuclendir' && p.turBasiCan !== undefined)) {
    const n = amount(r.p.turBasiCan, owner, rng);
    if (n > (c.tempHp ?? 0)) out.push({ type: 'temp_hp', targetId: c.id, amount: n, label: nameOf(r) });
  }
  return out.slice(-1);
});

// ------------------------------------------------------------------ komut sonu

registerCommandEnd((before, next, events0, cmd, rng) => {
  if (!p9On(next) || !Object.values(next.combatants).some((c) => c.paket)) return [];
  const out: BattleEvent[] = [];
  let cur = next;
  const push = (evs: BattleEvent[]) => { if (evs.length) { out.push(...evs); cur = applyEvents(cur, evs); } };

  // Senin etkinle düşman kurtulma attı (sonuç `sonuc` ile süzülür).
  for (const e of events0) {
    if (e.type !== 'save_resolved') continue;
    const g = cur.combatants[e.actorId];
    const t = cur.combatants[e.targetId];
    if (!g?.paket || !alive(t) || t.side === g.side || !canReact(g)) continue;
    for (const r of refs(g, tepkiOf('kurtulmaAttirildi'))) {
      if ((val<string>(r.p, 'sonuc') === 'basari') !== e.success || !ready(cur, g, r, t)) continue;
      if (r.p.etki === 'saldiriYap' && !(p10On(cur) && strikeApi()?.can(cur, g.id, t.id))) continue;
      const opt = { id: usedKey(r.feat.key, r.i), name: nameOf(r) };
      if (!ask(rng, g, t, nameOf(r), opt)) continue;
      const k = costOf(g, r.p);
      const react = reactionUsed(g, { ...opt, ...(k ? { resource: k.id } : {}) }, 'ally', t.id);
      push([react, ...costEvents(cur, g, { ...r, p: { ...r.p, kaynak: undefined } })]);
      // P10 (sürüm 39+): kurtulma sonrası saldırı.
      const api = strikeApi();
      if (r.p.etki === 'saldiriYap') { if (p10On(cur) && api && api.can(cur, g.id, t.id)) push(api.strike(cur, g.id, t.id, rng)); }
      else push(onFoe(cur, cur.combatants[g.id] as Combatant, r, cur.combatants[t.id] as Combatant, rng));
      break;
    }
  }

  // İşaret aktarımı: işaretli bu komutta 0 cana düştü → en yakın düşmana.
  for (const g of Object.values(cur.combatants)) for (const r of refs(g, (p) => p.tur === 'isaret' && p.aktar === true)) {
    const mid = markId(g.id, (r.p.id as string | undefined) ?? `${r.feat.key}-${r.i}`);
    for (const t0 of Object.values(before.combatants)) {
      const mark = t0.effects?.find((x) => x.id === mid);
      const t = cur.combatants[t0.id];
      if (!mark || !t || t.hp > 0 || t0.hp <= 0) continue;
      const nextFoe = Object.values(cur.combatants).filter((x) => alive(x) && x.side !== g.side && !x.civilian && x.id !== t.id && within(cur, g, x, ft(r.p, 'menzilFt', g)))
        .sort((x, y) => (x.pos && y.pos && t.pos ? distance(t.pos, x.pos) - distance(t.pos, y.pos) : 0) || x.id.localeCompare(y.id))[0];
      push([...(t.effects?.some((x) => x.id === mid) ? [{ type: 'effect_ended' as const, targetId: t.id, effectId: mid, name: mark.name, reason: 'used' as const }] : []),
        ...(nextFoe ? [{ type: 'effect_added' as const, targetId: nextFoe.id, effect: { ...mark } }] : [])]);
    }
  }

  // Büyü paylaşımı: kendine yapılan büyünün etkileri en zayıf dosta da.
  if (cmd.type === 'cast_spell') {
    const g = cur.combatants[cmd.actorId];
    const spell = spells.find((x) => x.name === cmd.spellName);
    for (const r of g ? refs(g, (p) => p.tur === 'buyuPaylas') : []) {
      if (!g || !spell || spell.level > ft(r.p, 'enCokSeviye', g) || !ready(cur, g, r)) continue;
      const mine = events0.filter((e): e is Extract<BattleEvent, { type: 'effect_added' }> => e.type === 'effect_added' && e.targetId === g.id && e.effect.sourceId === g.id && !e.effect.id.startsWith('pk'));
      const ally = Object.values(cur.combatants).filter((x) => alive(x) && x.side === g.side && x.id !== g.id && !x.summon && within(cur, g, x, ft(r.p, 'menzilFt', g)))
        .sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp || x.id.localeCompare(y.id))[0];
      if (!mine.length || !ally) continue;
      push([...costEvents(cur, g, r), ...mine.map((e) => ({ type: 'effect_added' as const, targetId: ally.id, effect: { ...e.effect, id: `${e.effect.id}:pk-paylas:${ally.id}` } }))]);
      break;
    }
  }

  // Ölüm kurtulmasında başarı → can.
  for (const e of events0) {
    if (e.type !== 'death_save' || e.outcome !== 'success') continue;
    const g = cur.combatants[e.actorId];
    for (const r of g ? refs(g, (p) => p.tur === 'olumZari') : []) {
      const me = cur.combatants[e.actorId] as Combatant;
      if (me.hp > 0 || me.life === 'dead' || !canPay(me, r.p) || (r.p.turdaBir && usedThisTurn(cur, me, r.feat.key, r.i))) continue;
      const n = Math.max(1, Math.min(me.maxHp, amount(r.p.iyilestir, me, rng)));
      push([...costEvents(cur, me, r), { type: 'healed', actorId: me.id, targetId: me.id, label: nameOf(r), amount: n, targetHpAfter: n }]);
      break;
    }
  }
  return out;
});
