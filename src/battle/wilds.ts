/**
 * Kuyruk 29 K28b: Buzul, Dağ ve Bataklık harita mekanikleri. Hepsi harita kuralı (`ruleOf`: haritanın varyantında, `surum: 8`,
 * Game Master anahtarı ve parametreleri `data/kural-kontrol.json`); kuralı olmayan haritada hiçbiri çalışmaz. Yeni olay
 * türü yok: `map_effect`, `map_note`, `effect_added`, `tile_changed`, `object_*`, `summoned`, yüzey/zon olayları ve itme.
 * - Hava (ortak): `snowfall` (şiddet 0 kapalı, 1 hafif, 2 orta, 3 şiddetli) ve `fog` (şiddet 1–3): görüş menzili ve
 *   menzilli saldırı dezavantajı; şiddetli karda açık kar (.) zorlu zemin. Rüzgâr kıran taşların (k) dibi kardan korunur.
 * - Giriş: `thinIce` (yarık komşusu buzda ağır zırhlı DEX save; başarısızsa soğuk su hasarı + Prone, yürüyüş biter),
 *   `sinkMud` (çamurda (n) ağır zırhlı Atletizm; başarısızsa batar, yürüyüş biter; K74 sürüm 76+ Restrained + Atletizm kurtulması).
 * - Tur başı: `bridgeGust` (köprüde (p) DEX save; başarısızsa rüzgâr yönünde itilir: uçurumsa düşer), `sentinelGaze`
 *   (gece heykelin gözü: yakındaki parti üyesi WIS save; başarısızsa bir tur Frightened).
 * - Tur sonu: `leeches` (sığ suda/çamurda (n) CON save; başarısızsa küçük hasar).
 * - Yeni tur: `pitGas` (her `interval` turda çukurda zehirli bulut), `witchCauldron` (kazan sağlamsa çevresinde zehirli
 *   buhar), `avalanche` (Game Master tetikler, `warnRounds` sonra çığ: DEX save, ezilme + Prone).
 * - Nesneler: `plaque` "oku" (`sentinelPuzzle`: INT (History) → kılıç yönündeki gizli kaya hanesi açılır), `boulderPile`
 *   "yuvarla" (`rockRoll`: hatta DEX save, yarım), `cauldron` "söndür" ya da yıkılır (cadı bir tur saldırılarında
 *   dezavantajlı), `iceSeal` yıkılır (`iceSeal`: hazine notu ya da pusu), `brazier` "söndür" (`brazierLight`: mangallar ışık
 *   verir; sönen mangal karanlık bırakır).
 * Saf; zarlar rng'den.
 */
import { footprintOf, touchesHexes } from './body';
import { K74, k74bOn } from './k74Surum';
import { AXIAL_DIRECTIONS, addAxial, axialToOffset, directionTo, distance, neighbors, offsetToAxial, sameHex, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import { getMonster } from '../data';
import { combatantFromMonster } from './create';
import { checkEffect, nearestSolid, ruleHex, ruleOf, saveEffect } from './maprules';
import { fail, finish, type CommandResult } from './common';
import { applyEvents } from './reduce';
import { isAirborne } from './flight';
import { surfaceEvent } from './surfaces';
import { forcedMoveEvents, pushOutcome } from './forced';
import { WIND_VEC, windDir } from './forest';
import { avalancheSweep, avalancheWarnEvents, k26On } from './highlands';
import type { BattleEvent, BattleState, Combatant, MapObject, ObjectAction } from './types';

const num = (v: unknown, d: number): number => (typeof v === 'number' ? v : d);
const str = (v: unknown, d: string): string => (typeof v === 'string' ? v : d);
const OFF = 'Bu harita mekaniği kapalı (Game Master) ya da bu savaşta yok.';
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const tileCh = (s: BattleState, h: Offset) => s.map?.tiles[h.row]?.[h.col] ?? '#';
const standing = (s: BattleState) => Object.values(s.combatants).filter((c) => c.pos && c.hp > 0 && !c.summon?.gone);
const hexList = (s: BattleState, raw: unknown): Offset[] => (Array.isArray(raw) ? raw : []).map((xy) => ruleHex(s, xy));

// ---------------------------------------------------------------------------------------------
// Hava: kar yağışı ve sis

export interface Weather { sight: number; disBeyond: number; label: string; snowDifficult: boolean; snow: boolean }
const SNOW = [null, null, { sight: 6, dis: 3 }, { sight: 3, dis: 1 }];
const FOG = [null, { sight: 6, dis: 3 }, { sight: 4, dis: 2 }, { sight: 2, dis: 1 }];

/** Bu savaştaki kar/sis görüş sınırları (ikisi de varsa sıkı olanı); yoksa null. */
export function weatherOf(state: BattleState): Weather | null {
  const snow = ruleOf(state, 'snowfall');
  const fog = ruleOf(state, 'fog');
  const s = snow ? SNOW[Math.max(0, Math.min(3, num(snow.severity, 1)))] : null;
  const f = fog ? FOG[Math.max(1, Math.min(3, num(fog.severity, 1)))] : null;
  if (!s && !f) return null;
  const sight = Math.min(s?.sight ?? 99, f?.sight ?? 99);
  const dis = Math.min(s?.dis ?? 99, f?.dis ?? 99);
  return { sight, disBeyond: dis, label: s && (!f || s.sight <= f.sight) ? 'Kar yağışı' : 'Sis', snowDifficult: !!snow && num(snow.severity, 1) >= 3, snow: !!s };
}

/** Rüzgâr kıran taşın (k) dibi: kar yağışından korunur. */
export const sheltered = (state: BattleState, h: Offset): boolean => neighbors(h, sizeOf(state)).some((n) => tileCh(state, n) === 'k');

/** Saldırıya hava etkisi: görüş dışı hedef seçilemez; uzak menzilli atış dezavantajlı (kar yağışında taş dibinden atan hariç). */
export function weatherAttack(state: BattleState, attacker: Combatant, target: Combatant, ranged: boolean):
  { sources: Array<{ effect: 'disadvantage'; reason: string }>; fail?: string } {
  const w = weatherOf(state);
  if (!w || !attacker.pos || !target.pos) return { sources: [] };
  const d = distance(attacker.pos, target.pos);
  if (d > w.sight) return { sources: [], fail: `${w.label}: ${w.sight} altıgenden uzağı görülmez (${d}).` };
  const cover = w.snow && w.label === 'Kar yağışı' && sheltered(state, attacker.pos);
  return { sources: ranged && d > w.disBeyond && !cover ? [{ effect: 'disadvantage', reason: w.label }] : [] };
}

/** Şiddetli karda açık kar (.) zorlu zemin (taş dibi hariç). */
export function snowMoveCost(state: BattleState, to: Offset): number {
  const w = weatherOf(state);
  return w?.snowDifficult && tileCh(state, to) === '.' && !sheltered(state, to) ? 2 : 1;
}

// ---------------------------------------------------------------------------------------------
// Altıgene giriş: ince buz, batıran çamur

export function wildsEnterEvents(state: BattleState, c: Combatant, at: Offset, rng: Rng): { events: BattleEvent[]; stop: boolean } {
  const events: BattleEvent[] = [];
  const mover = { ...c, pos: at };
  const thin = ruleOf(state, 'thinIce');
  if (thin && c.heavyArmor && tileCh(state, at) !== 'u' && neighbors(at, sizeOf(state)).some((n) => tileCh(state, n) === 'u')) {
    // Görev K26 (sürüm 12): ilk giriş yalnızca uyarı (buz çatırdar); çatırdamış buz kırılır: DEX save, başarısızsa
    // buzlu suya düşer: soğuk hasar + Prone + bir tur Restrained, yürüyüş biter.
    const v12 = k26On(state);
    if (v12 && !(state.map?.crackedIce ?? []).includes(`${at.col},${at.row}`)) {
      events.push({ type: 'map_note', text: `${c.name} ilerlerken ince buz çatırdadı: bir daha basan kırar!`, crackIce: at });
    } else {
      const ev = saveEffect(mover, 'thinIce', v12 ? 'çatlak buz kırılıyor' : 'ince buz çatırdıyor', 'dex', num(thin.dc, 10), rng,
        { hit: { dice: str(thin.damage, '1d6'), type: str(thin.damageType, 'cold') }, onFailCondition: 'Prone', stopOnFail: true });
      events.push(ev);
      if (v12 && ev.type === 'map_effect' && !ev.roll?.success) {
        events.push({ type: 'effect_added', targetId: c.id, effect: { id: 'buzlu-su', name: 'Buzlu suya düştü', sourceId: 'harita', until: state.round + 1, grants: ['Restrained'] } });
      }
    }
  }
  const mud = ruleOf(state, 'sinkMud');
  if (mud && c.heavyArmor && tileCh(state, at) === str(mud.terrain, 'n')) {
    const ev = checkEffect(mover, 'sinkMud', 'ağır zırhla çamura batıyor', 'athletics', num(mud.dc, 10), rng, state);
    if (!ev.roll?.success) ev.stopMovement = true;
    events.push(ev);
    // Kuyruk K74 (sürüm 76+): gerçek bedel: başarısızlıkta çamura saplanır (Restrained, Atletizm ile kurtulma; `data/k74.json`).
    if (!ev.roll?.success && k74bOn(state)) {
      const m = K74.sinkMud;
      events.push({ type: 'effect_added', targetId: c.id, effect: { id: `sinkMud:${at.col},${at.row}`, name: m.etkiAdi.tr, sourceId: 'harita',
        grants: [m.durum], escapeCheck: { dc: num(mud.dc, 10) + m.kacisDcFark, skill: 'athletics' } } });
    }
  }
  return { events, stop: events.some((e) => e.type === 'map_effect' && e.stopMovement === true) };
}

// ---------------------------------------------------------------------------------------------
// Tur başı ve sonu

/** Rüzgâr yönüne en iyi uyan komşu (itme). */
export function downwind(state: BattleState, from: Offset, dir: string): Offset | null {
  const v = WIND_VEC[dir];
  if (!v) return null;
  const c = (h: Offset) => ({ x: 1.5 * h.col, y: Math.sqrt(3) * (h.row + (h.col & 1 ? 0.5 : 0)) });
  const a = c(from);
  let best: Offset | null = null; let score = -2;
  for (const n of neighbors(from, sizeOf(state))) {
    const b = c(n); const dx = b.x - a.x; const dy = b.y - a.y; const l = Math.hypot(dx, dy) || 1;
    const s = (dx * v.x + dy * v.y) / l;
    if (s > score) { score = s; best = n; }
  }
  return best;
}

export function wildsTurnStartEvents(state: BattleState, c: Combatant, rng: Rng): BattleEvent[] {
  if (!c.pos) return [];
  const out: BattleEvent[] = [];
  const gust = ruleOf(state, 'bridgeGust');
  if (gust && footprintOf(state, c).some((h) => tileCh(state, h) === 'p') && !isAirborne(c)) {
    const ev = saveEffect(c, 'bridgeGust', 'köprüde sert rüzgâr', 'dex', num(gust.dc, 10), rng);
    out.push(ev);
    const to = ev.type === 'map_effect' && !ev.roll?.success ? downwind(state, c.pos, windDir(state) ?? str(gust.dir, 'S')) : null;
    if (to) {
      const s1 = applyEvents(state, [ev]);
      const me = s1.combatants[c.id] as Combatant;
      const res = pushOutcome(s1, me, c.pos, to);
      if (res.ok) out.push(...forcedMoveEvents(s1, c.id, res, 'harita', rng));
    }
  }
  const gaze = ruleOf(state, 'sentinelGaze');
  if (gaze && c.side === 'party' && !c.civilian && !(c.effects ?? []).some((e) => e.id === 'nobetci-bakis')) {
    const statue = ruleHex(state, gaze.statue);
    if (distance(c.pos, statue) <= num(gaze.radius, 2)) {
      const ev = saveEffect(c, 'sentinelGaze', 'heykelin parlayan gözü', 'wis', num(gaze.dc, 12), rng);
      out.push(ev);
      if (ev.type === 'map_effect' && !ev.roll?.success) {
        out.push({ type: 'effect_added', targetId: c.id, effect: { id: 'nobetci-bakis', name: 'Nöbetçinin bakışı', sourceId: 'harita', until: state.round + 1, grants: ['Frightened'] } });
      }
    }
  }
  return out;
}

export function wildsTurnEndEvents(state: BattleState, c: Combatant, rng: Rng): BattleEvent[] {
  const leech = ruleOf(state, 'leeches');
  if (!leech || !c.pos || isAirborne(c) || !footprintOf(state, c).some((h) => tileCh(state, h) === str(leech.terrain, 'n'))) return [];
  return [saveEffect(c, 'leeches', 'sülükler yapıştı', 'con', num(leech.dc, 10), rng,
    { hit: { dice: str(leech.damage, '1d4'), type: str(leech.damageType, 'piercing') } })];
}

// ---------------------------------------------------------------------------------------------
// Yeni tur: zehirli gaz, kazan buharı, çığ

const objKind = (s: BattleState, kind: string) => (s.map?.objects ?? []).filter((o) => o.kind === kind && !o.carriedBy);
function cloud(s: BattleState, hexes: Offset[], dc: number): BattleEvent | null {
  if (!hexes.length) return null;
  const ev = surfaceEvent(s, 'poison', hexes, 'harita', 'enemies', dc);
  return ev.type === 'zone_created' ? { ...ev, zone: { ...ev.zone, until: s.round } } : ev;
}

export function wildsRoundEvents(state: BattleState, rng: Rng): BattleEvent[] {
  if (!state.map) return [];
  const out: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { out.push(...evs); s = applyEvents(s, evs); };
  const pit = ruleOf(s, 'pitGas');
  if (pit && s.round > 1 && (s.round - 1) % Math.max(1, num(pit.interval, 3)) === 0) {
    const ev = cloud(s, hexList(s, pit.hexes), num(pit.dc, 12));
    if (ev) push([{ type: 'map_note', text: 'Çukurdan zehirli gaz yükseliyor!' }, ev]);
  }
  const caul = ruleOf(s, 'witchCauldron');
  if (caul) {
    for (const k of objKind(s, 'cauldron').filter((o) => o.state !== 'out')) {
      const ring = neighbors(k.at, sizeOf(s)).filter((h) => !['#', 's', 'u', 'a', 'v', 'm'].includes(tileCh(s, h)));
      const ev = cloud(s, ring, num(caul.dc, 12));
      if (ev) push([ev]);
    }
  }
  const ava = ruleOf(s, 'avalanche');
  if (ava && s.map?.avalancheRound !== undefined && s.map.avalancheRound === s.round) {
    const hexes = hexList(s, ava.hexes);
    const evs: BattleEvent[] = [{ type: 'map_note', text: 'Çığ geldi!', avalancheRound: 0 }];
    for (const c of standing(s)) {
      if (isAirborne(c) || !touchesHexes(s, c, hexes)) continue;
      const ev = saveEffect(c, 'avalanche', 'çığın altında', 'dex', num(ava.dc, 12), rng,
        { hit: { dice: str(ava.damage, '2d6'), type: 'bludgeoning' }, onFailCondition: 'Prone' });
      evs.push(ev);
      // Görev K26 (sürüm 12): save'i kaçıran yamaç yönüne sürüklenir.
      if (ev.type === 'map_effect' && !ev.roll?.success) {
        const s1 = applyEvents(s, evs);
        const me = s1.combatants[c.id] as Combatant;
        if (me.hp > 0) evs.push(...avalancheSweep(s1, ava, me, rng));
      }
    }
    push(evs);
  }
  return out;
}

/** Game Master: çığı tetikler (uyarı; `warnRounds` tur sonra gelir). */
export function avalancheTrigger(state: BattleState): BattleEvent[] | string {
  const r = ruleOf(state, 'avalanche');
  if (!r) return OFF;
  if (state.map?.avalancheRound) return 'Çığ zaten uyarıldı.';
  return avalancheWarnEvents(state, r);
}

// ---------------------------------------------------------------------------------------------
// Nesneler

/** Cadının zayıflaması: bir tur saldırılarında dezavantaj. */
function weakenHag(state: BattleState, r: Record<string, unknown>): BattleEvent[] {
  const hag = str(r.hag, 'green-hag');
  return Object.values(state.combatants).filter((c) => c.hp > 0 && c.monsterId === hag).map((c): BattleEvent => ({
    type: 'effect_added', targetId: c.id, effect: { id: 'kazan-sondu', name: 'Kazan söndü', sourceId: 'harita', until: state.round + 1, attackDis: {} },
  }));
}

const PUZZLE_CONTENT = ['hazine', 'silah', 'ipucu', 'pusu'];
const SEAL_CONTENT = ['hazine', 'pusu'];

export function executeWildsUse(state: BattleState, actor: Combatant, objectId: string, action: ObjectAction, rng: Rng): CommandResult | null {
  const obj = state.map?.objects?.find((o) => o.id === objectId && !o.carriedBy);
  if (!obj || !['plaque', 'boulderPile', 'cauldron', 'brazier'].includes(obj.kind)) return null;
  if (obj.kind === 'brazier' && action !== 'douse') return null;
  if (!actor.pos || distance(actor.pos, obj.at) > 1) return fail('Nesneye bitişik olmalısın.');
  if (obj.kind === 'plaque' && action === 'read') {
    const r = ruleOf(state, 'sentinelPuzzle');
    if (!r) return fail(OFF);
    if (obj.state === 'read') return fail('Yazıt zaten çözüldü.');
    const check = checkEffect(actor, 'sentinelPuzzle', 'plakadaki yazıtı okuyor', 'history', num(r.dc, 14), rng, state);
    const events: BattleEvent[] = [check];
    if (check.roll?.success) {
      const hidden = ruleHex(state, r.hidden);
      const what = PUZZLE_CONTENT[Math.max(0, Math.min(3, num(r.content, 0)))];
      events.push({ type: 'object_changed', objectId: obj.id, state: 'read', label: 'Yazıt çözüldü: kılıç yönü' },
        { type: 'tile_changed', at: hidden, to: '.' },
        { type: 'map_note', text: `Kılıcın gösterdiği kaya kayıyor (${hidden.col + 1},${hidden.row + 1}): küçük bir oyuk (Game Master: ${what}).` });
    }
    return finish(state, events);
  }
  if (obj.kind === 'boulderPile' && action === 'roll') {
    const r = ruleOf(state, 'rockRoll');
    if (!r) return fail(OFF);
    const dir = directionTo(actor.pos, obj.at);
    if (dir === null) return fail('Kaya yığınına bitişik olmalısın.');
    const step = AXIAL_DIRECTIONS[dir] as { q: number; r: number };
    const line: Offset[] = [];
    let a = offsetToAxial(obj.at);
    for (let i = 0; i < num(r.length, 4); i++) { a = addAxial(a, step); line.push(axialToOffset(a)); }
    const events: BattleEvent[] = [{ type: 'object_removed', objectId: obj.id },
      { type: 'map_note', text: `${actor.name} kaya yığınını yuvarladı!` }];
    for (const c of standing(state)) {
      if (c.id === actor.id || isAirborne(c) || !touchesHexes(state, c, line)) continue;
      events.push(saveEffect(c, 'rockRoll', 'yuvarlanan kayalar', 'dex', num(r.dc, 13), rng,
        { hit: { dice: str(r.damage, '3d6'), type: 'bludgeoning', halfOnSave: true } }));
    }
    return finish(state, events);
  }
  if (obj.kind === 'cauldron' && action === 'douse') {
    const r = ruleOf(state, 'witchCauldron');
    if (!r) return fail(OFF);
    if (obj.state === 'out') return fail('Kazan zaten söndü.');
    return finish(state, [{ type: 'object_changed', objectId: obj.id, state: 'out', label: 'Kazanın ateşi söndürüldü' }, ...weakenHag(state, r)]);
  }
  if (obj.kind === 'brazier' && action === 'douse') {
    if (!ruleOf(state, 'brazierLight')) return null;
    if (obj.state === 'out') return fail('Mangal zaten sönük.');
    return finish(state, [{ type: 'object_changed', objectId: obj.id, state: 'out', label: 'Mangal söndürüldü: karanlık çöktü' }]);
  }
  return fail('Bu nesneyle bu yapılamaz.');
}

/** Komut sonu: yıkılan kazan (cadı zayıflar), eriyen mühür (hazine ya da pusu). */
export function wildsAfterEvents(before: BattleState, next: BattleState, events: BattleEvent[]): BattleEvent[] {
  const gone = events.filter((e): e is Extract<BattleEvent, { type: 'object_destroyed' }> => e.type === 'object_destroyed')
    .map((e) => before.map?.objects?.find((o) => o.id === e.objectId)).filter((o): o is MapObject => !!o);
  if (!gone.length) return [];
  const out: BattleEvent[] = [];
  const caul = ruleOf(next, 'witchCauldron');
  if (caul && gone.some((o) => o.kind === 'cauldron')) out.push(...weakenHag(next, caul));
  const seal = ruleOf(next, 'iceSeal');
  const melted = gone.find((o) => o.kind === 'iceSeal');
  if (seal && melted) {
    const what = SEAL_CONTENT[Math.max(0, Math.min(1, num(seal.content, 0)))];
    out.push({ type: 'map_note', text: `Buz mühür eridi: altında ${what === 'pusu' ? 'pusu!' : 'bir hazine (Game Master).'}` });
    if (what === 'pusu') {
      const mon = getMonster(str(seal.monster, 'ice-mephit'));
      let s = applyEvents(next, out);
      for (let i = 1; i <= Math.max(1, num(seal.count, 2)); i++) {
        const at = nearestSolid(s, melted.at, '');
        if (!at) break;
        const c = { ...combatantFromMonster(mon, { id: `muhur-${i}`, name: `${mon.name} (mühür ${i})` }), side: 'enemies' as const, pos: at, initiative: 0 };
        const ev: BattleEvent = { type: 'summoned', ownerId: 'harita', spell: 'Buz mühür', combatant: c, index: s.order.length };
        out.push(ev); s = applyEvents(s, [ev]);
      }
    }
  }
  return out;
}

/** Işık kaynağı olan mangallar (`brazierLight`): sönmemiş mangalların altıgenleri ve yarıçapı. */
export function brazierLights(state: BattleState): Array<{ at: Offset; r: number }> {
  const r = ruleOf(state, 'brazierLight');
  if (!r) return [];
  return objKind(state, 'brazier').filter((o) => o.state !== 'out').map((o) => ({ at: o.at, r: num(r.radius, 2) }));
}
