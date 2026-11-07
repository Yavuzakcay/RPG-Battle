/**
 * Kuyruk P12 (kural sürümü 43): ek paket ilkel genişletme 6, kancalı kısım (`index.ts` içe aktarır). Paketsiz savaşçıda
 * ya da sürüm < 43'te hiçbiri olay üretmez (eski kayıt/replay aynen).
 * - Güç deposu kaynağı (`gucDeposu.depo`): sayaç bir paket kaynağında (`yenilenme: depo`); olaylar (P11 + `karsiBuyu`:
 *   Counterspell ile durdurma / Dispel Magic ile düşman büyüsünü kırma) +1; büyü hasarında turda bir 1 güç harcanır
 *   (`harca: buyuHasari`, seçim istemi; tek hedefe), isabette sayaç × zar (`harca: isabet`).
 * - Rastgele büyü listesi (`buyuVer.rastgeleListe`): düğme dN atar (zar defteri), geçerli hedefi olmayan büyüde yeniden;
 *   seçilen büyü bu tur slotsuz bir kez (`grantSpell`).
 * - Vertigo (`vertigo`, `vertigoKontrol`): öfke başlayınca zar; satır etkisi; hasar alınca tepkiyle yeniden; iki zar seçimi.
 * Saf; zar `rng` ile.
 */
import { spells, type Spell } from '../../data';
import { askChoice } from '../../rules/choice';
import { askReaction } from '../../rules/reactionChoice';
import { adjustDamage } from '../../rules/damage';
import { resolveSave } from '../../rules/attack';
import { rollDice, rollDie, rollTag, type Rng } from '../../rules/dice';
import { distance, neighbors, type Offset } from '../../rules/hex';
import type { Ability } from '../../rules/abilities';
import { damageProfile, fail, finish, type CommandResult } from '../common';
import { saveDice } from '../effectDice';
import { saveMode } from '../durations';
import { damageEffects } from '../damage-effects';
import { saveDamage } from '../classTraits';
import { canReact, reactionUsed } from '../reactions';
import { registerHitHook } from '../hitHooks';
import { registerCommandEnd } from '../turnHooks';
import { registerAction } from '../ai/actions';
import { teleportEvent, teleportProblem } from '../teleport';
import { withArrival } from '../motion';
import { hitEffect } from '../maprules';
import { OBJECTS } from '../objectData';
import { applyEvents } from '../reduce';
import { turnKey } from '../economy';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, UsableFeature } from '../types';
import { alive, dcOf, flatNum, formul, resKey, usedKey, usedThisTurn, val } from './core';
import {
  DILEK, VERTIGO, VERTIGO_FX, p12On, p12Ref, refsOf, rowName, vertigoRow, vertigoSides, wishCount, wishList, type Ref, type VertigoRow,
} from './p12core';

const nameOf = (r: Ref): string => (r.p.ad as string | undefined) ?? r.feat.ad;
const foesOf = (state: BattleState, a: Combatant) => Object.values(state.combatants).filter((c) => alive(c) && c.side !== a.side && !c.civilian);
const feetTo = (a: Combatant, b: { pos?: Offset | null }) => (a.pos && b.pos ? distance(a.pos, b.pos) * 5 : 0);

// ------------------------------------------------------------------ güç deposu (kaynaklı sayaç)

const depoRefs = (c: Combatant | undefined): Ref[] => refsOf(c, 'gucDeposu').filter((r) => !!r.p.depo);
const depoKey = (c: Combatant, r: Ref): string => resKey(c, (r.p.depo as { id: string }).id);

/** `karsiBuyu`: bu komutta düşman büyüsünü Counterspell ile durdurdu ya da Dispel Magic ile kırdı. */
function counterOrDispel(before: BattleState, events: BattleEvent[], c: Combatant, castBy?: string, spellName?: string): boolean {
  const countered = events.some((e) => e.type === 'reaction_used' && e.actorId === c.id && e.trigger === 'cast')
    && events.some((e) => e.type === 'spell_cast' && e.note.startsWith('Counterspell') && before.combatants[e.actorId]?.side !== c.side);
  if (countered) return true;
  if (castBy !== c.id || spells.find((s) => s.name === spellName)?.mechanics.kind !== 'dispel') return false;
  const foe = (id: string | undefined) => !!id && !!before.combatants[id] && before.combatants[id]?.side !== c.side;
  return events.some((e) => (e.type === 'effect_ended' && e.reason === 'dispelled' && foe(before.combatants[e.targetId]?.effects?.find((x) => x.id === e.effectId)?.sourceId))
    || (e.type === 'zone_ended' && e.reason === 'dispelled' && (before.map?.zones ?? []).some((z) => z.id === e.zoneId && z.side !== c.side))
    || (e.type === 'summon_vanished' && e.reason === 'dispelled' && foe(e.ownerId)));
}

registerCommandEnd((before, next, events, cmd, rng) => {
  if (!p12On(next)) return [];
  const owners = Object.values(next.combatants).filter((c) => depoRefs(c).length);
  if (!owners.length) return [];
  const out: BattleEvent[] = [];
  let cur = next;
  const push = (evs: BattleEvent[]) => { if (evs.length) { out.push(...evs); cur = applyEvents(cur, evs); } };
  const castBy = cmd.type === 'cast_spell' ? cmd.actorId : undefined;
  const spellName = cmd.type === 'cast_spell' ? cmd.spellName : undefined;
  for (const c0 of owners) for (const r of depoRefs(c0)) {
    const c = cur.combatants[c0.id] as Combatant;
    const olay = val<string>(r.p, 'olay');
    const n = olay === 'buyuYuvasi' ? events.filter((e) => e.type === 'slot_spent' && e.actorId === c.id).length
      : olay === 'hasarAlinca' ? ((before.combatants[c.id]?.hp ?? 0) > c.hp ? 1 : 0)
        : olay === 'karsiBuyu' ? (counterOrDispel(before, events, c, castBy, spellName) ? 1 : 0)
          : events.filter((e) => e.type === 'attack_resolved' && e.targetId === c.id && !e.hit).length;
    if (!n) continue;
    const key = depoKey(c, r);
    const have = c.resources[key] ?? 0;
    const cap = c.resourceCaps?.[key] ?? have;
    const now = Math.min(cap, have + n);
    if (now > have) push([{ type: 'feature_used', actorId: c.id, feature: key, remaining: now }, { type: 'map_note', text: `${c.name}: ${nameOf(r)} +${now - have} (${now}/${cap})` }]);
  }
  // Büyü hasarında harcama (turda bir; tek hedefe).
  if (castBy && spellName) {
    const c = cur.combatants[castBy];
    const r = depoRefs(c).find((x) => val<string>(x.p, 'harca') === 'buyuHasari');
    if (c && r) push(spendOnSpell(before, cur, c, r, spellName, rng));
  }
  return out;
});

function spendOnSpell(before: BattleState, cur: BattleState, c: Combatant, r: Ref, spellName: string, rng: Rng): BattleEvent[] {
  const spell = spells.find((s) => s.name === spellName);
  const list = r.p.buyuListesi as string | undefined;
  if (!spell || (list && !spell.classes.includes(list))) return [];
  const key = depoKey(c, r);
  if ((c.resources[key] ?? 0) < 1 || usedThisTurn(cur, c, r.feat.key, r.i)) return [];
  const hurt = Object.values(cur.combatants).filter((t) => t.id !== c.id && t.hp > 0 && !t.summon?.gone && ((before.combatants[t.id]?.hp ?? 0) > t.hp || (before.combatants[t.id]?.tempHp ?? 0) > (t.tempHp ?? 0)));
  const objs = (cur.map?.objects ?? []).filter((o) => o.hp > 0 && (before.map?.objects ?? []).some((b) => b.id === o.id && b.hp > o.hp));
  if (!hurt.length && !objs.length) return [];
  const n = Math.max(0, flatNum(r.p.harcaHasar, c));
  const type = (r.p.hasarTuru as string | undefined) ?? 'force';
  const name = nameOf(r);
  const foe = hurt.filter((t) => t.side !== c.side).sort((a, b) => a.hp - b.hp)[0];
  const pick = askChoice(rng, { actorId: c.id, label: `${name}: 1 güç → +${n} ${type}`,
    options: [...hurt.map((t) => ({ id: t.id, label: t.name })), ...objs.map((o) => ({ id: `obj:${o.id}`, label: OBJECTS[o.kind]?.tr ?? o.kind })), { id: 'keep', label: 'Sakla' }],
    suggested: foe ? foe.id : 'keep' });
  if (!pick || pick === 'keep' || n <= 0) return [];
  const pay: BattleEvent[] = [{ type: 'feature_used', actorId: c.id, feature: key, remaining: (c.resources[key] ?? 0) - 1 },
    { type: 'trait_turn', actorId: c.id, trait: usedKey(r.feat.key, r.i), key: turnKey(cur) }];
  if (pick.startsWith('obj:')) {
    const o = objs.find((x) => `obj:${x.id}` === pick);
    if (!o) return [];
    return [...pay, { type: 'object_damaged', objectId: o.id, actorId: c.id, label: name, damage: n, damageType: type, hpAfter: Math.max(0, o.hp - n) },
      ...(o.hp - n <= 0 ? [{ type: 'object_destroyed' as const, objectId: o.id, label: OBJECTS[o.kind]?.tr ?? o.kind }] : [])];
  }
  const t = hurt.find((x) => x.id === pick);
  return t ? [...pay, hitEffect(t, 'paket', name, { damage: String(n), damageType: type }, rng)] : [];
}

/** `harca: isabet` + `depo`: silah isabetinde bütün sayaç × zar (seçim), kaynak 0'a iner. */
registerHitHook((state, actor, target, ctx, rng) => {
  if (!p12On(state)) return null;
  const r = depoRefs(actor).find((x) => val<string>(x.p, 'harca') !== 'buyuHasari' && x.p.zar !== undefined);
  if (!r || ctx.spell) return null;
  const key = depoKey(actor, r);
  const have = actor.resources[key] ?? 0;
  if (have <= 0) return null;
  const name = nameOf(r);
  const die = formul(r.p.zar, actor);
  if (askChoice(rng, { actorId: actor.id, sourceId: target.id, label: `${name}: ${have} güç`, options: [{ id: 'use', label: `+${have}×${die}` }, { id: 'keep', label: 'Sakla' }],
    suggested: target.hp > 0 ? 'use' : 'keep' }) !== 'use') return null;
  const m = /^(\d+)d(\d+)(.*)$/.exec(die);
  const roll = rollDice(m ? `${Number(m[1]) * have}d${m[2]}${m[3]}` : String((Number(die) || 0) * have), rollTag(rng, { kind: 'damage', by: actor.id }), ctx.critical);
  const type = (r.p.hasarTuru as string | undefined) ?? ctx.weaponType;
  const adj = adjustDamage(roll.total, type, damageProfile(target));
  return { extras: [{ label: name, rolls: roll.rolls, raw: roll.total, applied: adj.amount, type, note: adj.note }],
    after: [() => [{ type: 'feature_used', actorId: actor.id, feature: key, remaining: 0 }]] };
});

// ------------------------------------------------------------------ rastgele büyü listesi (Sınırlı Dilek)

/** Büyünün şu an geçerli bir hedefi var mı (menzilde uygun yaratık; alan/kendine büyüler her zaman; savaş dışı değil). */
export function wishSpellValid(state: BattleState, a: Combatant, s: Spell): boolean {
  const m = s.mechanics;
  if (m.offCombat) return false;
  if (s.area?.origin === 'self' || s.rangeFt === 0) return true;
  const reach = Math.max(5, s.rangeFt) + (s.area ? s.area.sizeFt : 0);
  const inReach = (t: Combatant) => !state.map || feetTo(a, t) <= reach;
  const allies = Object.values(state.combatants).filter((t) => t.side === a.side && !t.summon?.gone && inReach(t));
  switch (m.kind) {
    case 'attack': case 'save': case 'auto': case 'sleep': case 'mark':
      return foesOf(state, a).some(inReach);
    case 'heal': return allies.some((t) => t.hp > 0 && t.hp < t.maxHp);
    case 'cure': return allies.some((t) => (m.cures ?? []).some((x) => t.conditions.includes(x)));
    case 'revive': return allies.some((t) => t.hp <= 0);
    case 'effect': {
      const side = (m.effect as { side?: string } | undefined)?.side;
      return side === 'enemy' ? foesOf(state, a).some(inReach) : allies.some((t) => t.hp > 0);
    }
    default: return true;
  }
}
const wishSpells = (p: Ref['p']): Array<Spell | undefined> => wishList(p).map((n) => spells.find((s) => s.name === n));

function dilekProblem(state: BattleState, a: Combatant, r: Ref): string | null {
  const list = wishSpells(r.p);
  if (!list.length) return `${nameOf(r)}: liste seçilmedi (oluşturucuda ${wishCount(r.p)} büyü seç).`;
  const k = r.p.kaynak as { id: string; maliyet?: number } | undefined;
  if (k && (a.resources[resKey(a, k.id)] ?? 0) < (k.maliyet ?? 1)) return `${nameOf(r)}: kullanım kalmadı.`;
  if (a.economy.action) return `${nameOf(r)}: eylemin kullanıldı (büyü yapılamaz).`;
  if (a.effects?.some((e) => e.id === `pk-dilek:${a.id}`)) return `${nameOf(r)}: önce seçilen büyüyü yap.`;
  if (!list.some((s) => s && wishSpellValid(state, a, s))) return `${nameOf(r)}: listedeki büyülerin geçerli hedefi yok (kullanım harcanmadı).`;
  return null;
}

function dilekExecute(state: BattleState, a: Combatant, r: Ref, rng: Rng): CommandResult {
  const why = dilekProblem(state, a, r);
  if (why) return fail(why);
  const n = wishCount(r.p);
  const list = wishSpells(r.p);
  const name = nameOf(r);
  const notes: string[] = [];
  let pick: Spell | undefined;
  for (let tries = 0; tries < 60 && !pick; tries++) {
    const face = rollDie(n, rollTag(rng, { by: a.id }));
    const s = list[face - 1];
    const ok = !!s && wishSpellValid(state, a, s);
    notes.push(`d${n} = ${face}${s ? ` → ${s.name}` : ''}${ok ? '' : ' (geçersiz, yeniden)'}`);
    if (ok) pick = s;
  }
  pick ??= list.find((s) => s && wishSpellValid(state, a, s));
  if (!pick) return fail(`${name}: geçerli büyü yok.`);
  const k = r.p.kaynak as { id: string; maliyet?: number } | undefined;
  const key = k ? resKey(a, k.id) : null;
  return finish(state, [
    ...(key ? [{ type: 'feature_used' as const, actorId: a.id, feature: key, remaining: (a.resources[key] ?? 0) - (k?.maliyet ?? 1) }] : []),
    { type: 'map_note', text: `${a.name}: ${name}: ${notes.join('; ')}` },
    { type: 'effect_added', targetId: a.id, effect: { id: `pk-dilek:${a.id}`, name: `${name}: ${pick.name}`, sourceId: a.id, grantSpell: { spellName: pick.name },
      untilOwnTurnEnd: true, until: state.round + 1, icon: '✨' } as ActiveEffect },
  ]);
}

// ------------------------------------------------------------------ vertigo

const kontrol = (c: Combatant | undefined, mod: string): Ref | undefined => refsOf(c, 'vertigoKontrol').find((x) => x.p.mod === mod);
const rowRank = (row: VertigoRow | undefined, state: BattleState, c: Combatant): number => {
  if (!row) return 0;
  const r = Math.floor((row.yaricapFt ?? 10) / 5);
  const foes = foesOf(state, c).filter((f) => f.pos && c.pos && distance(f.pos, c.pos) <= r).length;
  if (row.etki === 'patlama' || row.etki === 'isik') return foes * 2 + (row.tekrar ? 1 : 0);
  if (row.etki === 'acBonusu') return 1.5;
  return foes ? 1 : 2.5; // ışınlanma: düşman yakında değilse değerli
};

/** Vertigo zarı (Kontrol Sağlama: iki zar, seçim). */
function vertigoFace(state: BattleState, c: Combatant, r: Ref, rng: Rng): number {
  const sides = vertigoSides(r.p);
  const a = rollDie(sides, rollTag(rng, { by: c.id }));
  if (!kontrol(c, 'ikiAtSec')) return a;
  const b = rollDie(sides, rollTag(rng, { by: c.id }));
  const ra = vertigoRow(r.p, a);
  const rb = vertigoRow(r.p, b);
  if (ra === rb) return a;
  const pick = askChoice(rng, { actorId: c.id, label: `${nameOf(r)}: vertigo satırını seç`,
    options: [{ id: 'a', label: `${a}: ${ra ? rowName(ra) : '?'}` }, { id: 'b', label: `${b}: ${rb ? rowName(rb) : '?'}` }],
    suggested: rowRank(rb, state, c) > rowRank(ra, state, c) ? 'b' : 'a' });
  return pick === 'b' ? b : a;
}

/** Satırın anlık etkisi (patlama / ışık): alandakilere. */
function rowBurst(state: BattleState, c: Combatant, r: Ref, row: VertigoRow, rng: Rng): BattleEvent[] {
  if (row.etki !== 'patlama' && row.etki !== 'isik') return [];
  const rad = Math.floor((row.yaricapFt ?? 10) / 5);
  const name = `${nameOf(r)}: ${rowName(row)}`;
  const pool = row.suzgec === 'hepsi' ? Object.values(state.combatants).filter((t) => alive(t) && t.id !== c.id && !t.civilian) : foesOf(state, c);
  const ts = pool.filter((t) => !state.map || (t.pos && c.pos && distance(t.pos, c.pos) <= rad));
  if (!ts.length) return [];
  const out: BattleEvent[] = [];
  const save = row.save;
  const ab = (save?.yetenek ?? 'con') as Ability;
  const dc = save ? dcOf(save, c) : 0;
  const dmg = row.etki === 'patlama' ? rollDice(formul(row.zar, c), rollTag(rng, { kind: 'damage', by: c.id })) : null;
  const type = row.hasarTuru ?? 'force';
  for (const t of ts) {
    const sv = save ? resolveSave({ extra: saveDice(t, ab), modifier: t.saves[ab], dc, mode: saveMode('normal', t, ab, c) }, rollTag(rng, { by: t.id })) : null;
    const success = !!sv?.success;
    if (row.etki === 'patlama' && dmg) {
      const half = !!(save as { yari?: boolean } | undefined)?.yari;
      const raw = save ? saveDamage(t, ab, success, dmg.total, half) : dmg.total;
      const adj = raw > 0 ? adjustDamage(raw, type, damageProfile(t)) : { amount: 0, note: null };
      const fx = damageEffects(t, adj.amount, type, false, rng);
      out.push({ type: 'save_resolved', actorId: c.id, targetId: t.id, label: name, ability: ab, dc, mode: sv ? saveMode('normal', t, ab, c) : 'normal', reasons: [],
        d20: sv?.d20?.rolls ?? [], natural: sv?.d20?.kept ?? null, total: sv?.total ?? 0, success, damageRolls: dmg.rolls, rawDamage: dmg.total, appliedDamage: adj.amount,
        damageType: type, damageNote: adj.note, targetHpAfter: fx.hpAfter, conditionsAdded: [], effects: fx.effects, ...(sv?.extra ? { bonusDice: sv.extra } : {}) });
      continue;
    }
    if (sv) out.push({ type: 'save_resolved', actorId: c.id, targetId: t.id, label: name, ability: ab, dc, mode: saveMode('normal', t, ab, c), reasons: [],
      d20: sv.d20?.rolls ?? [], natural: sv.d20?.kept ?? null, total: sv.total, success, damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null,
      targetHpAfter: t.hp, conditionsAdded: [], effects: [], ...(sv.extra ? { bonusDice: sv.extra } : {}) });
    if (success) continue;
    const s = row.sure === 'kalici' ? undefined : (row.sure ?? 1);
    out.push({ type: 'effect_added', targetId: t.id, effect: { id: `pk-vertigo-isik:${c.id}`, name, sourceId: c.id, grants: [row.durum ?? 'Blinded'], icon: '✺',
      ...(s ? { until: state.round + s } : {}) } as ActiveEffect });
  }
  return out;
}

/** Yeni vertigo zarı: eski etki biter, satırın süren etkisi ve anlık etkisi. */
function vertigoEvents(state: BattleState, c: Combatant, r: Ref, rng: Rng): BattleEvent[] {
  const face = vertigoFace(state, c, r, rng);
  const row = vertigoRow(r.p, face);
  const out: BattleEvent[] = [];
  const old = c.effects?.find((e) => e.id === VERTIGO_FX(c.id));
  if (old) out.push({ type: 'effect_ended', targetId: c.id, effectId: old.id, name: old.name, reason: 'used' });
  if (!row) return [...out, { type: 'map_note', text: `${c.name}: vertigo ${face} (tabloda yok)` }];
  out.push({ type: 'map_note', text: `${c.name}: ${nameOf(r)} d${vertigoSides(r.p)} = ${face} → ${rowName(row)}` },
    { type: 'effect_added', targetId: c.id, effect: { id: VERTIGO_FX(c.id), name: `${nameOf(r)}: ${rowName(row)}`, sourceId: c.id, icon: '🌀',
      pkVertigo: { key: r.feat.key, i: r.i, face, ...(row.etki === 'isinlan' && row.hemen ? { free: true } : {}) },
      ...(row.etki === 'acBonusu' ? { ac: Math.max(1, flatNum(row.miktar ?? 1, c)) } : {}) } as ActiveEffect });
  return [...out, ...rowBurst(applyEvents(state, out), c, r, row, rng)];
}

const activeRow = (c: Combatant): { r: Ref; row: VertigoRow } | null => {
  const v = c.effects?.find((e) => e.id === VERTIGO_FX(c.id))?.pkVertigo;
  if (!v) return null;
  const r = refsOf(c, 'vertigo').find((x) => x.feat.key === v.key && x.i === v.i);
  const row = r ? vertigoRow(r.p, v.face) : undefined;
  return r && row ? { r, row } : null;
};

registerCommandEnd((before, next, _events, cmd, rng) => {
  if (!p12On(next)) return [];
  const owners = Object.values(next.combatants).filter((c) => refsOf(c, 'vertigo').length);
  if (!owners.length) return [];
  const out: BattleEvent[] = [];
  let cur = next;
  const push = (evs: BattleEvent[]) => { if (evs.length) { out.push(...evs); cur = applyEvents(cur, evs); } };
  for (const c0 of owners) {
    const c = cur.combatants[c0.id] as Combatant;
    const b = before.combatants[c.id];
    const fx = c.effects?.find((e) => e.id === VERTIGO_FX(c.id));
    // Öfke bitti: vertigo biter.
    if (fx && (!c.rage || c.hp <= 0)) { push([{ type: 'effect_ended', targetId: c.id, effectId: fx.id, name: fx.name, reason: 'expired' }]); continue; }
    // Öfke başladı: zar.
    if (c.rage && !b?.rage) { for (const r of refsOf(c, 'vertigo').slice(0, 1)) push(vertigoEvents(cur, cur.combatants[c.id] as Combatant, r, rng)); continue; }
    // Denge Arayışı: öfkedeyken hasar alınca tepkiyle yeniden.
    const k = kontrol(c, 'hasardaYenile');
    const act = activeRow(c);
    if (!k || !act || !c.rage || c.hp <= 0 || !b || b.hp <= c.hp) continue;
    const react = val<boolean>(k.p, 'tepkiyle') !== false;
    if (react && !canReact(c)) continue;
    const opt = { id: 'p12-vertigo', name: `${nameOf(k)}: vertigo yeniden` };
    const sugg = act.row.etki === 'acBonusu' || (act.row.etki === 'isinlan') || act.row.tekrar ? null : { option: opt.id };
    const src = 'actorId' in cmd ? (cmd as { actorId: string }).actorId : undefined;
    const ans = askReaction(rng, { reactorId: c.id, trigger: 'damaged', ...(src ? { sourceId: src } : {}), info: { label: nameOf(k), damage: b.hp - c.hp }, options: [opt], suggested: sugg });
    if (ans?.option !== opt.id) continue;
    push([...(react ? [reactionUsed(c, opt, 'damaged', src ?? c.id)] : [])]);
    push(vertigoEvents(cur, cur.combatants[c.id] as Combatant, act.r, rng));
  }
  return out;
});

function vertigoProblem(state: BattleState, a: Combatant, r: Ref, mode: string, to?: Offset): string | null {
  const act = activeRow(a);
  if (!a.rage || !act || act.r.feat.key !== r.feat.key) return `${nameOf(r)}: etkin vertigo yok (öfkeye gir).`;
  if (mode === 'isinlan' || mode === 'hemen') {
    if (act.row.etki !== 'isinlan') return `${nameOf(r)}: etkin satır ışınlanma değil.`;
    if (mode === 'hemen' && !a.effects?.find((e) => e.id === VERTIGO_FX(a.id))?.pkVertigo?.free) return `${nameOf(r)}: bedava ışınlanma kullanıldı.`;
    if (!to) return 'Varış altıgenini seç.';
    return teleportProblem(state, a, to, { rangeFt: act.row.mesafeFt ?? 30, sight: true });
  }
  if (mode === 'tekrar') {
    if (!act.row.tekrar || (act.row.etki !== 'patlama' && act.row.etki !== 'isik')) return `${nameOf(r)}: etkin satır yinelenmez.`;
    return null;
  }
  return 'Bilinmeyen özellik.';
}

function vertigoExecute(state: BattleState, a: Combatant, r: Ref, mode: string, rng: Rng, to?: Offset): CommandResult {
  const why = vertigoProblem(state, a, r, mode, to);
  if (why) return fail(why);
  const act = activeRow(a) as { r: Ref; row: VertigoRow };
  if (mode === 'tekrar') return finish(state, rowBurst(state, a, act.r, act.row, rng));
  const fx = a.effects?.find((e) => e.id === VERTIGO_FX(a.id)) as ActiveEffect;
  const pre: BattleEvent[] = mode === 'hemen' && fx.pkVertigo ? [{ type: 'effect_added', targetId: a.id, effect: { ...fx, pkVertigo: { ...fx.pkVertigo, free: false } } }] : [];
  return finish(state, [...pre, ...withArrival(applyEvents(state, pre), [], [teleportEvent(a, to as Offset, `${nameOf(r)}: ışınlanma`)], rng)]);
}

// ------------------------------------------------------------------ düğme girişi (`index.ts` paketProblem/executePaket)

export function p12Problem(state: BattleState, actor: Combatant, f: UsableFeature, _targetId?: string, to?: Offset): string | null {
  if (!p12On(state)) return 'Bu özellik bu kural sürümünde yok.';
  const ref = p12Ref(actor, f.key);
  if (!ref) return 'Bilinmeyen özellik.';
  if (actor.hp <= 0) return 'Ayakta değil.';
  return f.key.startsWith(DILEK) ? dilekProblem(state, actor, ref.r) : vertigoProblem(state, actor, ref.r, ref.mode ?? '', to);
}
export function p12Execute(state: BattleState, actor: Combatant, f: UsableFeature, rng: Rng | undefined, to?: Offset): CommandResult {
  const why = p12Problem(state, actor, f, undefined, to);
  if (why) return fail(why);
  if (!rng) return fail('Zar gerekli.');
  const ref = p12Ref(actor, f.key) as NonNullable<ReturnType<typeof p12Ref>>;
  return f.key.startsWith(DILEK) ? dilekExecute(state, actor, ref.r, rng) : vertigoExecute(state, actor, ref.r, ref.mode ?? '', rng, to);
}
export const isP12Feature = (key: string): boolean => key.startsWith(DILEK) || key.startsWith(VERTIGO);

// ------------------------------------------------------------------ yapay zekâ

/** Rastgele liste: eylemi boşken ve listede geçerli büyü varken kullan (kural önceliği; büyüyü sonraki karar yapar). */
registerAction({
  id: 'paket:dilek', kind: 'damage', rule: true, note: 'Ek paket P12: rastgele büyü listesi (buyuVer.rastgeleListe): eylem boşken zar at, seçilen büyüyü slotsuz yap',
  gen: (state, actor, h) => {
    if (!p12On(state) || !h.canAct || !h.foes.length) return [];
    return (actor.features ?? []).filter((f) => f.key.startsWith(DILEK) && !p12Problem(state, actor, f)).map((f) => ({ type: 'use_feature' as const, actorId: actor.id, feature: f.key }));
  },
});
/** Vertigo: patlama/ışık yinelemesi (alanda düşman varken) ve ışınlanma (düşmana bitişik değilken en yakın düşmanın yanına). */
registerAction({
  id: 'paket:vertigo', kind: 'damage', rule: true, note: 'Ek paket P12: vertigo düğmeleri (yinele: alanda düşman; ışınlan: en yakın düşmanın yanına)',
  gen: (state, actor) => {
    if (!p12On(state) || !actor.rage) return [];
    const act = activeRow(actor);
    if (!act) return [];
    const out = [];
    for (const f of actor.features ?? []) {
      if (!f.key.startsWith(VERTIGO)) continue;
      const mode = f.key.slice(f.key.lastIndexOf(':') + 1);
      if (mode === 'tekrar' && !p12Problem(state, actor, f) && rowBurstWorth(state, actor, act.row)) out.push({ type: 'use_feature' as const, actorId: actor.id, feature: f.key });
      if ((mode === 'isinlan' || mode === 'hemen') && actor.pos && state.map) {
        const foe = foesOf(state, actor).filter((x) => x.pos).sort((x, y) => feetTo(actor, x) - feetTo(actor, y))[0];
        if (!foe?.pos || distance(foe.pos, actor.pos) <= 1) continue;
        const spot = [...neighbors(foe.pos)].sort((p, q) => distance(p, actor.pos as Offset) - distance(q, actor.pos as Offset)).find((h) => !p12Problem(state, actor, f, undefined, h));
        if (spot) out.push({ type: 'use_feature' as const, actorId: actor.id, feature: f.key, to: spot });
      }
    }
    return out;
  },
});
const rowBurstWorth = (state: BattleState, c: Combatant, row: VertigoRow) => {
  const rad = Math.floor((row.yaricapFt ?? 10) / 5);
  return foesOf(state, c).some((f) => f.pos && c.pos && distance(f.pos, c.pos) <= rad);
};

/** Okul ikiz büyüsü: bilinen okul büyüsünü en yakın iki düşmana (kuru çalıştırma puanlar). */
registerAction({
  id: 'paket:ikizOkul', kind: 'damage', note: 'Ek paket P12: okul ikiz büyüsü (buyuDegisimi.ikizOkul): tek hedefli okul büyüsü iki düşmana',
  gen: (state, actor, h) => {
    if (!p12On(state) || !actor.pkTwinSchool || !h.canAct || h.foes.length < 2) return [];
    const two = h.foes.slice(0, 2).map((f) => f.id);
    return actor.spellNames.map((n) => spells.find((s) => s.name === n)).filter((s): s is Spell => !!s && s.school === actor.pkTwinSchool && !s.area && s.rangeFt > 0
      && (s.mechanics.kind === 'save' || s.mechanics.kind === 'effect') && !s.mechanics.offCombat).slice(0, 3)
      .map((s) => ({ type: 'cast_spell' as const, actorId: actor.id, spellName: s.name, targetIds: two }));
  },
});
/** Dostun mühürlü büyüsü (`buyuSakla.dostTetikler`): saklayanın büyüsünü en yakın düşmana tetikle (ekonomi harcanmaz). */
registerAction({
  id: 'paket:muhur', kind: 'damage', note: 'Ek paket P12: dostun mühürlü büyüsünü tetikle (buyuSakla.dostTetikler; dostun ekonomisi harcanmaz)',
  gen: (state, actor, h) => {
    if (!p12On(state) || !h.foes.length) return [];
    const owners = Object.values(state.combatants).filter((c) => c.id !== actor.id && c.side === actor.side && c.hp > 0 && c.effects?.some((e) => e.storedSpell?.allies));
    return owners.flatMap((o) => h.foes.slice(0, 2).map((f) => ({ type: 'spell_followup' as const, actorId: actor.id, sourceId: o.id, targetId: f.id, choice: 'sakli', ...(f.pos ? { targetHex: f.pos } : {}) })));
  },
});
