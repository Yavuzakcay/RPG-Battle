/**
 * Kuyruk K54: imza alt sınıfların eksik özellikleri (kural sürümü 25, `data/imza.json` `surumK54`). K53 ortak sistemleri
 * üstüne: zorla hareket kipleri (`forcedMove`), nesne itme/fırlatma/enkaz (`objectMotion`), ışınlanma (`teleport`),
 * geçici engel (`barriers`), aura (`auraCore`). Eski sürüm savaşta (23–24) bu dosyanın hiçbir yolu çalışmaz; K50
 * davranışı aynen kalır. Saf.
 */
import data from '../../data/imza.json';
import { ruleVersion } from './ruleVersion';
import { imzaOn, byLevel, imzaPasifler } from './imzaCore';
import { forcedMove } from './motion';
import { conjureDebris, forcedMoveObject, throwObject, weightOf } from './objectMotion';
import { objectAt } from './objectData';
import { applyEvents } from './reduce';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { canReact, reactionUsed, registerAfterAttack, registerTargeted, strikeApi } from './reactions';
import { teleportEvent, teleportProblem } from './teleport';
import { withArrival } from './motion';
import { hitEffect } from './maprules';
import { occupantAt } from './movement';
import { askReaction } from '../rules/reactionChoice';
import { resolveSave } from '../rules/attack';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { distance, neighbors, type Offset } from '../rules/hex';
import { resourceLeft, type BattleEvent, type BattleState, type Combatant } from './types';

export const K54_VERSION = (data as { surumK54?: number }).surumK54 ?? 25;
/** K54 özellikleri bu savaşta mı (sürüm 25+ ve alt sınıfın ev kuralı açık). */
export const k54 = (state: BattleState, sub?: string): boolean => ruleVersion(state) >= K54_VERSION && (!sub || imzaOn(state, sub));
const SIZE = ['T', 'S', 'M', 'L', 'H', 'G'];
const sizeOk = (t: Combatant, max?: string) => !max || SIZE.indexOf(t.size ?? 'M') <= SIZE.indexOf(max);

/** Zihin Gücü (yaratık): STR kurtulması başarısızsa kipe göre `mesafe` ft; serbest kipte `to` altıgenine doğru. */
export function mindMoveEvents(state: BattleState, actor: Combatant, t: Combatant, spec: { kip?: string; mesafe?: number; boyutEnCok?: string }, failed: boolean,
  to: Offset | undefined, rng: Rng): BattleEvent[] {
  if (!failed || !actor.pos || !t.pos || !sizeOk(t, spec.boyutEnCok)) return [];
  const kip = (spec.kip ?? 'push') as 'push' | 'pull' | 'slide' | 'free';
  return forcedMove(state, t.id, kip, spec.mesafe ?? 10, actor.id, rng, kip === 'free' ? { to } : { origin: actor.pos });
}

/** Zihin Gücü (nesne): `to` altıgenindeki hareketli nesne Monk'tan uzağa (ağırlık sınırı seviyeye göre). */
export function mindObjectProblem(state: BattleState, actor: Combatant, to: Offset | undefined, range: number, allowed: string[]): string | null {
  if (!to) return 'Nesnenin altıgenini seç.';
  const o = objectAt(state, to);
  if (!o) return 'Orada nesne yok.';
  const w = weightOf(o);
  if (!w || !allowed.includes(w)) return 'Bu nesne zihinle taşınamayacak kadar ağır ya da sabit.';
  if (actor.pos && distance(actor.pos, to) * 5 > range) return `${range} ft içinde olmalı.`;
  return null;
}
export function mindObjectEvents(state: BattleState, actor: Combatant, to: Offset, feet: number, rng: Rng): BattleEvent[] {
  const o = objectAt(state, to);
  if (!o || !actor.pos) return [];
  return forcedMoveObject(state, o.id, 'push', feet, actor.id, rng, { origin: actor.pos });
}

/**
 * Zihin Gücü: Fırlat: `to` altıgenindeki nesne (yoksa zemin enkazı) hedefe fırlatılır; hedef DEX kurtulması (başarıda
 * yarı). Tek zar (çarpma hasarı eklenmez).
 */
export function hurlEvents(state: BattleState, actor: Combatant, target: Combatant, to: Offset | undefined, dice: string, type: string, dc: number, rng: Rng): BattleEvent[] | string {
  if (!to || !target.pos) return 'Fırlatılacak nesnenin altıgenini seç.';
  let cur = state;
  const events: BattleEvent[] = [];
  let obj = objectAt(cur, to);
  if (!obj || !weightOf(obj)) {
    const d = conjureDebris(cur, to);
    if (!d) return 'Orada fırlatılacak bir şey yok.';
    events.push(...d.events);
    cur = applyEvents(cur, d.events);
    obj = cur.map?.objects?.find((x) => x.id === d.objectId);
  }
  if (!obj) return 'Nesne yok.';
  const sv = resolveSave({ extra: saveDice(target, 'dex'), modifier: target.saves.dex, dc, mode: saveMode('normal', target, 'dex', actor) }, rollTag(rng, { by: target.id }));
  events.push({ type: 'map_note', text: `${target.name}: DEX save ${sv.total}/${dc} — ${sv.success ? 'yarı hasar' : 'tam isabet'}` });
  const roll = rollDice(dice, rollTag(rng, { kind: 'damage', by: actor.id }));
  const amount = sv.success ? Math.floor(roll.total / 2) : roll.total;
  // Monk telekinezisi: menzil nesnenin ağırlığından değil özellikten (60 ft); fırlatma çizgisi nesneden hedefe.
  const r = throwObject(cur, obj.at, obj.id, target.pos, actor.id, rng, { dice: String(amount), type }, 1e6);
  if ('problem' in r) return r.problem;
  return [...events, ...r.events];
}

/**
 * Sabır (Yaşlı Bilge 3): sana yakın dövüşte iskalayan düşmana tepkiyle silahsız saldırı. Önce ücretsiz kullanım
 * (`imzaSabir`), sonra 1 Odak.
 */
export function patienceEvents(state: BattleState, monkId: string, attackerId: string, rng: Rng): BattleEvent[] {
  const m = state.combatants[monkId];
  const a = state.combatants[attackerId];
  if (!m || !a || !canReact(m) || m.imza !== 'imza_bilge' || m.level < 3 || !k54(state, m.imza)) return [];
  const free = resourceLeft(m, 'imzaSabir') > 0;
  if (!free && resourceLeft(m, 'focus') < 1) return [];
  const api = strikeApi();
  if (!api || !api.can(state, m.id, a.id)) return [];
  const ans = askReaction(rng, { reactorId: m.id, trigger: 'miss', sourceId: a.id, info: { label: 'Sabır' }, options: [{ id: 'imza-sabir', name: 'Sabır' }], suggested: { option: 'imza-sabir' } });
  if (ans?.option !== 'imza-sabir') return [];
  const res = free ? 'imzaSabir' : 'focus';
  const pre: BattleEvent[] = [{ type: 'feature_used', actorId: m.id, feature: res, remaining: resourceLeft(m, res) - 1 },
    reactionUsed(m, { id: 'imza-sabir', name: 'Sabır' }, 'miss', a.id)];
  return [...pre, ...api.strike(applyEvents(state, pre), m.id, a.id, rng, 'Unarmed Strike')];
}

registerAfterAttack((state, attackerId, targetId, info, rng) => (!info.hit && info.melee ? patienceEvents(state, targetId, attackerId, rng) : []));

// ---------------------------------------------------------------- Hızır Yemini (K54 G2)

/** K54 pasifinin etkisi (alt sınıf, seviye, sürüm 25+, ev kuralı). */
function pasifOf(state: BattleState, c: Combatant, ozellik: string): Record<string, unknown> | undefined {
  if (!c.imza || !k54(state, c.imza)) return undefined;
  return imzaPasifler(c).find((p) => p.ozellik === ozellik)?.etki;
}
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
/** Dostun yanındaki boş varış altıgeni (yakın dövüşte saldırganın erişiminde); zaten yanındaysa kendi yeri. */
function spotBeside(state: BattleState, p: Combatant, ally: Combatant, attacker: Combatant | null, rangeFt: number): Offset | null {
  if (!p.pos || !ally.pos) return null;
  const melee = !!attacker?.pos && distance(attacker.pos, ally.pos) <= 1;
  const okFor = (h: Offset) => !melee || distance(h, attacker!.pos!) <= 1;
  if (distance(p.pos, ally.pos) <= 1 && okFor(p.pos)) return p.pos;
  return neighbors(ally.pos, sizeOf(state)).filter((h) => okFor(h) && !occupantAt(state, h) && !teleportProblem(state, p, h, { rangeFt: rangeFt + 5, sight: false }))
    .sort((a, b) => distance(a, p.pos!) - distance(b, p.pos!) || a.row - b.row || a.col - b.col)[0] ?? null;
}
function moveBeside(state: BattleState, p: Combatant, spot: Offset, label: string, rng: Rng): BattleEvent[] {
  if (p.pos && spot.col === p.pos.col && spot.row === p.pos.row) return [];
  return withArrival(state, [], [teleportEvent(p, spot, label)], rng);
}
const JIT = (pid: string) => `imza:hizir-jit:${pid}`;
const ALL_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];

/** Tam Zamanında: dost hedef alınınca (zardan önce) Hızır paladini yanına ışınlanır, saldırı ona yönelir; isabette yarı hasar. */
registerTargeted((state, attacker, target, rng) => {
  for (const p of Object.values(state.combatants)) {
    if (p.id === target.id || p.side !== target.side || p.hp <= 0 || !p.pos || !target.pos || !canReact(p)) continue;
    const prm = pasifOf(state, p, 'just-in-time')?.tamZamaninda as { menzilFt: number; kaynak: string } | undefined;
    if (!prm || resourceLeft(p, prm.kaynak) < 1 || distance(p.pos, target.pos) * 5 > prm.menzilFt) continue;
    const spot = spotBeside(state, p, target, attacker, prm.menzilFt);
    if (!spot) continue;
    // Öneri (yapay zekâ): dostun canı paladininkinden azsa üstlen.
    const ans = askReaction(rng, { reactorId: p.id, trigger: 'ally', sourceId: attacker.id, info: { label: 'Tam Zamanında' },
      options: [{ id: 'imza-tam-zamaninda', name: 'Tam Zamanında' }], suggested: target.hp <= p.hp ? { option: 'imza-tam-zamaninda' } : null });
    if (ans?.option !== 'imza-tam-zamaninda') continue;
    const pre: BattleEvent[] = [{ type: 'feature_used', actorId: p.id, feature: prm.kaynak, remaining: resourceLeft(p, prm.kaynak) - 1 },
      reactionUsed(p, { id: 'imza-tam-zamaninda', name: 'Tam Zamanında' }, 'ally', attacker.id)];
    const tele = moveBeside(applyEvents(state, pre), p, spot, 'Tam Zamanında', rng);
    const half: BattleEvent = { type: 'effect_added', targetId: p.id, effect: { id: JIT(p.id), name: 'Tam Zamanında', sourceId: p.id, until: state.round, resist: ALL_TYPES, icon: '🕊' } };
    return { events: [...pre, ...tele, half], targetId: p.id };
  }
  return null;
});

/** Saldırı sonrası: Tam Zamanında yarı hasar bitişi, Yetişen Mucize, Yetişen Yol hasar devralma. */
registerAfterAttack((state, attackerId, targetId, info, rng) => {
  const out: BattleEvent[] = [];
  let cur = state;
  const add = (evs: BattleEvent[]) => { out.push(...evs); cur = applyEvents(cur, evs); };
  const t0 = cur.combatants[targetId];
  if (t0?.effects?.some((e) => e.id === JIT(t0.id))) add([{ type: 'effect_ended', targetId: t0.id, effectId: JIT(t0.id), name: 'Tam Zamanında', reason: 'used' }]);
  if (info.dealt > 0) add(miracleEvents(cur, targetId, attackerId, info.dealt, rng));
  if (info.dealt > 0) add(roadTakeover(cur, targetId, attackerId, info.dealt, info.damageType, rng));
  return out;
});

/** Yetişen Mucize (15): dost saldırıyla 0 HP'ye düştü (ölmedi): yanına ışınlan, 1 HP, Motivasyon tam; hasarın yarısı sana. */
function miracleEvents(state: BattleState, allyId: string, attackerId: string, dealt: number, rng: Rng): BattleEvent[] {
  const a = state.combatants[allyId];
  if (!a || a.hp > 0 || a.life === 'dead' || a.summon) return [];
  for (const p of Object.values(state.combatants)) {
    if (p.id === a.id || p.side !== a.side || p.hp <= 0 || !p.pos || !a.pos || !canReact(p)) continue;
    const prm = pasifOf(state, p, 'miracle-in-time')?.mucize as { menzilFt: number; kaynak: string; pay: number; tavanSeviye: number } | undefined;
    if (!prm || resourceLeft(p, prm.kaynak) < 1 || distance(p.pos, a.pos) * 5 > prm.menzilFt) continue;
    const spot = spotBeside(state, p, a, null, prm.menzilFt);
    if (!spot) continue;
    const ans = askReaction(rng, { reactorId: p.id, trigger: 'ally', sourceId: attackerId, info: { label: 'Yetişen Mucize' },
      options: [{ id: 'imza-mucize', name: 'Yetişen Mucize' }], suggested: { option: 'imza-mucize' } });
    if (ans?.option !== 'imza-mucize') continue;
    const evs: BattleEvent[] = [{ type: 'feature_used', actorId: p.id, feature: prm.kaynak, remaining: resourceLeft(p, prm.kaynak) - 1 },
      reactionUsed(p, { id: 'imza-mucize', name: 'Yetişen Mucize' }, 'ally', attackerId)];
    let cur = applyEvents(state, evs);
    const tele = moveBeside(cur, p, spot, 'Yetişen Mucize', rng);
    evs.push(...tele); cur = applyEvents(cur, tele);
    evs.push({ type: 'healed', actorId: p.id, targetId: a.id, label: 'Yetişen Mucize', amount: 1, targetHpAfter: 1 });
    if (a.moralMax !== undefined && (a.moral ?? a.moralMax) < a.moralMax) evs.push({ type: 'moral_changed', targetId: a.id, delta: a.moralMax - (a.moral ?? 0), moral: a.moralMax, reason: 'toparlama', byId: p.id });
    const share = Math.min(Math.floor(dealt * prm.pay), p.level * prm.tavanSeviye);
    const me = applyEvents(cur, evs.slice(-1)).combatants[p.id] as Combatant;
    if (share > 0) evs.push(hitEffect(me, 'imza', 'Yetişen Mucize', { damage: String(share), damageType: 'force' }, rng));
    return evs;
  }
  return [];
}

/** Yetişen Yol (20) sürerken: turda bir, auradaki dostun aldığı saldırı hasarını üstlen (dost iyileşir, hasar sana). */
function roadTakeover(state: BattleState, allyId: string, attackerId: string, dealt: number, type: string, rng: Rng): BattleEvent[] {
  const a = state.combatants[allyId];
  if (!a || a.life === 'dead') return [];
  for (const p of Object.values(state.combatants)) {
    if (p.id === a.id || p.side !== a.side || p.hp <= dealt || !p.imza || !k54(state, p.imza)) continue;
    const road = `imza:imza_hizir/hastening-road:${p.id}`;
    if (!p.effects?.some((e) => e.id === road) || !a.effects?.some((e) => e.id === road)) continue;
    const mark = 'imza:yol-devral';
    const key = `${state.round}`;
    if (p.traitTurns?.[mark] === key) continue;
    const ans = askReaction(rng, { reactorId: p.id, trigger: 'ally', sourceId: attackerId, info: { label: 'Yetişen Yol' },
      options: [{ id: 'imza-yol-devral', name: 'Yetişen Yol' }], suggested: p.hp > dealt * 2 ? { option: 'imza-yol-devral' } : null });
    if (ans?.option !== 'imza-yol-devral') continue;
    const hpAfter = Math.min(a.maxHp, a.hp + dealt);
    return [{ type: 'trait_turn', actorId: p.id, trait: mark, key },
      { type: 'healed', actorId: p.id, targetId: a.id, label: 'Yetişen Yol', amount: hpAfter - a.hp, targetHpAfter: hpAfter },
      hitEffect(p, 'imza', 'Yetişen Yol', { damage: String(dealt), damageType: type || 'force' }, rng)];
  }
  return [];
}

/** Yetişen Yol: Adım: Yetişen Yol sürerken turda bir, 60 ft içindeki dostun yanına ışınlan. */
export function roadStepProblem(state: BattleState, p: Combatant, ally: Combatant | undefined): string | null {
  if (!p.effects?.some((e) => e.id === `imza:imza_hizir/hastening-road:${p.id}`)) return 'Yetişen Yol sürmüyor.';
  if (p.traitTurns?.['imza:yol-adim'] === `${state.round}`) return 'Bu tur zaten ışınlandın.';
  if (!ally || !spotBeside(state, p, ally, null, 60)) return 'Dostun yanında boş yer yok.';
  return null;
}
export function roadStepEvents(state: BattleState, p: Combatant, ally: Combatant, rng: Rng): BattleEvent[] {
  const spot = spotBeside(state, p, ally, null, 60);
  if (!spot) return [];
  const mark: BattleEvent = { type: 'trait_turn', actorId: p.id, trait: 'imza:yol-adim', key: `${state.round}` };
  return [mark, ...moveBeside(applyEvents(state, [mark]), p, spot, 'Yetişen Yol', rng)];
}

/** Muhtaç Sezgisi (3): bu savaşçıyı (0 HP ya da Çökmüş) sezen Hızır paladini var mı (harita işareti). */
export function needSensed(state: BattleState, c: Combatant): boolean {
  if (c.life === 'dead' || !c.pos || !(c.hp <= 0 || (c.moralMax !== undefined && (c.moral ?? c.moralMax) <= 0))) return false;
  return Object.values(state.combatants).some((p) => {
    const prm = p.id !== c.id && p.side === c.side && p.hp > 0 && p.pos ? pasifOf(state, p, 'sense-of-need')?.muhtac as { menzilFt: number } | undefined : undefined;
    return !!prm && distance(p.pos!, c.pos!) * 5 <= prm.menzilFt;
  });
}
/** Muhtaç Sezgisi: Elle Şifa ile iyileştirilen Çökmüş dost Motivasyon kazanır (Moral tam modu). */
export function needHealMoral(state: BattleState, healer: Combatant, t: Combatant): BattleEvent[] {
  const prm = pasifOf(state, healer, 'sense-of-need')?.muhtac as { moral: number } | undefined;
  if (!prm || t.moralMax === undefined || (t.moral ?? t.moralMax) > 0) return [];
  return [{ type: 'moral_changed', targetId: t.id, delta: prm.moral, moral: prm.moral, reason: 'toparlama', byId: healer.id }];
}

export { byLevel };
