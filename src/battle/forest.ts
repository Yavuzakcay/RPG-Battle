/**
 * Kuyruk 24: Orman harita mekanikleri (harita/belgeler/harita-mekanikleri.md "SEÇİLENLER — ORMAN"). Hepsi haritanın
 * varyant kuralında (`surum: 3`; `ruleOf`: eski savaşta ve Game Master kapattığında yok) ve mevcut parçalarla:
 * nesneler (`map.objects`, `object_use`, `object_damaged/destroyed`), zemin değişimi (`tile_changed`), yüzeyler (alev),
 * uyuyan/habersiz gruplar ve alarm (`alarmEvent`), çağrı olayı (`summoned`), harita etkisi (`map_effect`). Yeni olay türü
 * yok (kayıt sürümü aynı).
 * 1. Şelale geçidi (`waterfall`): heykelin gözü (statueEye) INT (Investigation) ya da WIS (Perception) kontrolüyle çözülür;
 *    şelale ayrılır, geçit altıgenleri açılır.
 * 2a. Alarm boynuzu (`hornAlarm`): nöbetçi grubu alarmlandıktan `delayRounds` tur sonra (tur başında) nöbetçi ayakta ve
 *    etkin ise boynuz öter, kamp grubu (takviye) alarmlanır; nöbetçi o ana dek etkisizse alarm iptal.
 * 2b. Çadır yangını (`tentFire`): ateş hasarı (alan, nesneye saldırı) ya da meşale (`ignite`) çadırı tutuşturur (alev
 *    yüzeyi); her tur başında rüzgâr yönündeki (`wind` kuralı, çöl kum fırtınasıyla ortak) yakın çadıra sıçrar, yanan
 *    çadıra bitişik duran ateş hasarı alır.
 * 3. Ağaç devirme (`treeFell`): devrilebilir ağaç STR (Athletics) kontrolüyle ya da HP'si bitince düşüş hattına devrilir:
 *    hattakiler DEX save (başarıda yarım hasar), gövde yarım siper (`k`), uçurumu kesen altıgen geçit (`p`).
 *    Köprüler (`bridgeBreak`): köprü nesnesi yıkılınca altıgenleri uçuruma/suya döner; üstündekiler DEX save ya da düşer.
 * 4. Kemik yığınları (`boneRise`): `rounds` tur sonra (tur başında) yığın SRD iskeletine döner; dağıt eylemi ya da ateş/
 *    ışıltı hasarı önler.
 * Sarmaşık kapanı (`vineTrap`) ve kütük siperi (`logCover`) maprules / forestStart'ta. Saf; zarlar rng'den.
 */
import { AXIAL_DIRECTIONS, addAxial, axialToOffset, distance, hexKey, offsetToAxial, sameHex, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { Skill } from '../rules/skills';
import { skillBonus } from '../rules/skills';
import { getMonster } from '../data';
import { alarmEvent } from './alarm';
import { combatantFromMonster } from './create';
import { checkEffect, damageEffect, nearestSolid, ruleHex, ruleOf, saveEffect } from './maprules';
import { fail, finish, type CommandResult } from './common';
import { applyEvents } from './reduce';
import { OBJECTS } from './objectData';
import { isAirborne } from './flight';
import { isIncapacitated } from '../rules/conditions';
import { areaDamageOf, surfaceEvent } from './surfaces';
import { terrainOf } from '../map/terrain';
import type { BattleEvent, BattleState, Combatant, MapObject, ObjectAction } from './types';

const FLOW: Record<string, number> = { SE: 0, NE: 1, N: 2, NW: 3, SW: 4, S: 5 };
const num = (v: unknown, d: number): number => (typeof v === 'number' ? v : d);
const str = (v: unknown, d: string): string => (typeof v === 'string' ? v : d);
const objOf = (s: BattleState, id: string) => s.map?.objects?.find((o) => o.id === id && !o.carriedBy);
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const standing = (s: BattleState) => Object.values(s.combatants).filter((c) => c.pos && c.hp > 0 && !c.summon?.gone);
const OFF = 'Bu harita mekaniği kapalı (Game Master) ya da bu savaşta yok.';

/** Kuraldaki nesne kimliği → altıgen listesi (1 tabanlı [sütun, satır]). */
function hexMap(s: BattleState, raw: unknown): Record<string, Offset[]> {
  const out: Record<string, Offset[]> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, list] of Object.entries(raw as Record<string, unknown>)) if (Array.isArray(list)) out[id] = list.map((xy) => ruleHex(s, xy));
  return out;
}

// ---------------------------------------------------------------------------------------------
// Nesne kullanımı (object_use): solve, ignite, fell, scatter

/** Orman nesnesinin kullanımı; bu nesne türü değilse null (genel nesne kuralları çalışır). */
export function executeForestUse(state: BattleState, actor: Combatant, objectId: string, action: ObjectAction, rng: Rng): CommandResult | null {
  const obj = objOf(state, objectId);
  if (!obj || !['statueEye', 'tent', 'tree', 'bonePile'].includes(obj.kind)) return null;
  if (!actor.pos || distance(actor.pos, obj.at) > 1) return fail('Nesneye bitişik olmalısın.');
  const name = `${actor.name}: ${OBJECTS[obj.kind].tr}`;
  if (obj.kind === 'statueEye' && action === 'solve') {
    const r = ruleOf(state, 'waterfall');
    if (!r || r.eyeId !== obj.id) return fail(OFF);
    if (obj.state === 'open') return fail('Geçit zaten açık.');
    const skills = (Array.isArray(r.skills) ? r.skills : ['investigation', 'perception']) as Skill[];
    const sk = [...skills].sort((a, b) => skillBonus(actor, b) - skillBonus(actor, a))[0] as Skill;
    const check = checkEffect(actor, 'waterfall', 'heykelin gözünün sırrını çözmeye çalışıyor', sk, num(r.dc, 13), rng, state);
    const events: BattleEvent[] = [check];
    if (check.roll?.success) events.push(...waterfallOpenEvents(state, r, obj));
    return finish(state, events);
  }
  if (obj.kind === 'tent' && action === 'ignite') {
    if (!ruleOf(state, 'tentFire')) return fail(OFF);
    if (obj.state === 'burning') return fail('Çadır zaten yanıyor.');
    return finish(state, igniteEvents(state, obj, actor.id, `${name} meşaleyle tutuşturuldu`));
  }
  if (obj.kind === 'tree' && action === 'fell') {
    const r = ruleOf(state, 'treeFell');
    if (!r || !(r.trees && typeof r.trees === 'object' && obj.id in (r.trees as object))) return fail(OFF);
    const check = checkEffect(actor, 'treeFell', 'ağacı devirmeye çalışıyor', 'athletics', num(r.checkDc, 15), rng, state);
    const events: BattleEvent[] = [check];
    if (check.roll?.success) {
      const gone: BattleEvent = { type: 'object_destroyed', objectId: obj.id, label: `${name} devrildi` };
      events.push(gone, ...treeFallEvents(applyEvents(state, [check, gone]), obj, actor.id, rng));
    }
    return finish(state, events);
  }
  if (obj.kind === 'bonePile' && action === 'scatter') {
    if (!ruleOf(state, 'boneRise')) return fail(OFF);
    return finish(state, [{ type: 'object_removed', objectId: obj.id },
      { type: 'map_note', text: `${name} dağıtıldı: kemikler canlanamaz.` }]);
  }
  return fail('Bu nesneyle bu yapılamaz.');
}

/** Şelale ayrılır: geçit altıgenleri açılır, göz "açık" olur. */
function waterfallOpenEvents(state: BattleState, r: Record<string, unknown>, eye: MapObject): BattleEvent[] {
  const to = str(r.to, '.');
  const hexes = (Array.isArray(r.hexes) ? r.hexes : []).map((xy) => ruleHex(state, xy));
  return [
    { type: 'object_changed', objectId: eye.id, state: 'open', label: 'Heykelin gözü döndü: şelale ikiye ayrıldı' },
    ...hexes.map((at): BattleEvent => ({ type: 'tile_changed', at, to })),
    { type: 'map_note', text: 'Şelalenin arkasındaki geçit açıldı.' },
  ];
}

// ---------------------------------------------------------------------------------------------
// Çadır yangını

function tentHexes(state: BattleState): Record<string, Offset[]> {
  const r = ruleOf(state, 'tentFire');
  return r ? hexMap(state, r.tents) : {};
}

/** Çadır tutuşur: nesne `burning`, altıgenlerinde kalıcı alev yüzeyi (çadır yanarken söner­mez). */
function igniteEvents(state: BattleState, tent: MapObject, actorId: string, label: string): BattleEvent[] {
  const hexes = tentHexes(state)[tent.id] ?? [tent.at];
  const changed: BattleEvent = { type: 'object_changed', objectId: tent.id, state: 'burning', label };
  const lit = surfaceEvent(applyEvents(state, [changed]), 'fire', hexes, actorId, state.combatants[actorId]?.side ?? 'enemies');
  if (lit.type === 'zone_created') { const { until: _u, ...zone } = lit.zone; return [changed, { ...lit, zone: { ...zone, id: `${zone.id}:${tent.id}` } }]; }
  return [changed, lit];
}

/** Ekrandaki (piksel) merkez: yön açısı için. */
const center = (h: Offset) => ({ x: 1.5 * h.col, y: Math.sqrt(3) * (h.row + (h.col & 1 ? 0.5 : 0)) });
const WIND_VEC: Record<string, { x: number; y: number }> = {
  N: { x: 0, y: -1 }, S: { x: 0, y: 1 }, NE: { x: Math.sqrt(3) / 2, y: -0.5 }, SE: { x: Math.sqrt(3) / 2, y: 0.5 },
  SW: { x: -Math.sqrt(3) / 2, y: 0.5 }, NW: { x: -Math.sqrt(3) / 2, y: -0.5 },
};
const mid = (hs: Offset[]) => { const ps = hs.map(center); return { x: ps.reduce((n, p) => n + p.x, 0) / ps.length, y: ps.reduce((n, p) => n + p.y, 0) / ps.length }; };

/** Rüzgâr kuralının yönü (ortak `wind` kuralı; kapalıysa null: yangın her yöne). */
export function windDir(state: BattleState): string | null {
  const w = ruleOf(state, 'wind');
  return w && typeof w.dir === 'string' && WIND_VEC[w.dir] ? w.dir : null;
}

/** Tur başı: yanan çadırlar rüzgâr yönündeki yakın çadırları tutuşturur; yanan çadıra bitişik duranlar hasar alır. */
function tentRoundEvents(state: BattleState, rng: Rng): BattleEvent[] {
  const r = ruleOf(state, 'tentFire');
  if (!r) return [];
  const tents = tentHexes(state);
  const burning = (state.map?.objects ?? []).filter((o) => o.kind === 'tent' && o.state === 'burning' && tents[o.id]);
  if (!burning.length) return [];
  const out: BattleEvent[] = [];
  let s = state;
  const wind = windDir(state);
  const reach = num(r.spreadHexes, 4);
  // Hasar: yanan çadır altıgenine bitişik ya da içinde (uçmayan, ayakta).
  const hot = burning.flatMap((o) => tents[o.id] ?? []);
  for (const c of standing(s)) {
    if (isAirborne(c) || !c.pos || !hot.some((h) => distance(h, c.pos as Offset) <= 1)) continue;
    const ev = damageEffect(c, 'tentFire', 'yanan çadırın alevi', { dice: str(r.damage, '1d6'), type: 'fire' }, rng);
    out.push(ev); s = applyEvents(s, [ev]);
  }
  // Sıçrama: bu turun başındaki yanan çadırlardan (zincirleme yok).
  for (const b of burning) {
    const bh = tents[b.id] ?? [];
    for (const t of (s.map?.objects ?? []).filter((o) => o.kind === 'tent' && o.state !== 'burning' && tents[o.id])) {
      const th = tents[t.id] ?? [];
      const d = Math.min(...bh.flatMap((x) => th.map((y) => distance(x, y))));
      if (d > reach) continue;
      if (wind) {
        const a = mid(bh); const z = mid(th); const v = { x: z.x - a.x, y: z.y - a.y };
        const w = WIND_VEC[wind] as { x: number; y: number };
        const len = Math.hypot(v.x, v.y) || 1;
        if ((v.x * w.x + v.y * w.y) / len < 0.5) continue; // rüzgârın ±60° içinde değil
      }
      const evs = igniteEvents(s, t, b.id, `Alev rüzgârla ${OBJECTS.tent.tr.toLowerCase()} ${t.id} çadırına sıçradı`);
      out.push(...evs); s = applyEvents(s, evs);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Ağaç devirme ve köprüler

/** Ağacın düşüş hattı (kuraldaki yön ve uzunluk). */
export function fallLine(state: BattleState, tree: MapObject): Offset[] {
  const r = ruleOf(state, 'treeFell');
  const spec = (r?.trees as Record<string, { dir?: string; length?: number }> | undefined)?.[tree.id];
  if (!spec) return [];
  const dir = AXIAL_DIRECTIONS[FLOW[spec.dir ?? 'S'] ?? 5] as { q: number; r: number };
  const size = sizeOf(state);
  const out: Offset[] = [];
  let a = offsetToAxial(tree.at);
  for (let i = 0; i < (spec.length ?? 4); i++) {
    a = addAxial(a, dir);
    const h = axialToOffset(a);
    if (h.col < 0 || h.row < 0 || h.col >= size.cols || h.row >= size.rows) break;
    const t = terrainOf(state.map?.tiles[h.row]?.[h.col] ?? '#');
    if (t.movement === 'blocked' && !t.flyersPass) break; // ağaç, duvar: gövde orada durur
    out.push(h);
  }
  return out;
}

/** Devrilen ağaç: hattakiler DEX save (yarım), kütük `k`, uçurum `p` (geçit), ağacın yeri kütük kökü `t`. */
function treeFallEvents(state: BattleState, tree: MapObject, actorId: string, rng: Rng): BattleEvent[] {
  const r = ruleOf(state, 'treeFell');
  if (!r) return [];
  const line = fallLine(state, tree);
  const out: BattleEvent[] = [];
  let s = state;
  for (const c of standing(s)) {
    if (isAirborne(c) || !line.some((h) => sameHex(h, c.pos as Offset))) continue;
    const ev = saveEffect(c, 'treeFell', 'devrilen ağacın altında', 'dex', num(r.saveDc, 13), rng,
      { hit: { dice: str(r.damage, '2d6'), type: 'bludgeoning', halfOnSave: true } });
    out.push(ev); s = applyEvents(s, [ev]);
  }
  out.push({ type: 'tile_changed', at: tree.at, to: 't' });
  for (const h of line) {
    const ch = s.map?.tiles[h.row]?.[h.col] ?? '#';
    out.push({ type: 'tile_changed', at: h, to: terrainOf(ch).flyersPass ? 'p' : 'k' });
  }
  out.push({ type: 'map_note', text: line.some((h) => terrainOf(s.map?.tiles[h.row]?.[h.col] ?? '#').flyersPass)
    ? 'Ağaç uçurumun üstüne devrildi: gövde geçit oldu.' : 'Ağaç devrildi: gövde yarım siper.' });
  return out;
}

/** Köprü yıkıldı: altıgenleri kuraldaki zemine döner; üstündekiler DEX save (başarı: kenara atlar; başarısız: düşer). */
function bridgeBreakEvents(state: BattleState, bridge: MapObject, rng: Rng): BattleEvent[] {
  const r = ruleOf(state, 'bridgeBreak');
  if (!r) return [];
  const hexes = hexMap(state, r.bridges)[bridge.id];
  if (!hexes?.length) return [];
  const to0 = (r.to as Record<string, string> | undefined)?.[bridge.id] ?? 'u';
  // Nehir geçilmez açıksa çöken nehir köprüsü de geçilmez nehre döner.
  const river = ruleOf(state, 'riverBlocked');
  const to = river && to0 === String(river.from ?? 'w') ? String(river.to ?? 'R') : to0;
  const fall = (OBJECTS.bridge as unknown as { fall: { save: 'dex'; dc: number; damage: string; damageType: string } }).fall;
  const out: BattleEvent[] = hexes.map((at): BattleEvent => ({ type: 'tile_changed', at, to }));
  let s = applyEvents(state, out);
  for (const c of standing(s)) {
    if (isAirborne(c) || !hexes.some((h) => sameHex(h, c.pos as Offset))) continue;
    const ev = saveEffect(c, 'bridgeBreak', 'köprü çöktü', fall.save, fall.dc, rng, {});
    if (ev.type === 'map_effect' && !ev.roll?.success) Object.assign(ev, damageEffect(c, 'bridgeBreak', 'köprüyle birlikte düştü', { dice: fall.damage, type: fall.damageType }, rng), { roll: ev.roll });
    const land = nearestSolid(s, c.pos as Offset, c.id);
    if (land && ev.type === 'map_effect' && (ev.hpAfter ?? 1) > 0) ev.moveTo = land;
    out.push(ev); s = applyEvents(s, [ev]);
  }
  out.push({ type: 'map_note', text: 'Köprü yıkıldı: geçit kapandı.' });
  return out;
}

// ---------------------------------------------------------------------------------------------
// Komut sonu: nesne hasarının sonuçları

/** Komutun nesne hasarı ve alanlı ateşinin Orman sonuçları (ağaç devrilir, köprü çöker, çadır tutuşur, yığın dağılır). */
export function forestAfterEvents(before: BattleState, next: BattleState, events: BattleEvent[], rng: Rng): BattleEvent[] {
  if (!next.map?.objects?.length && !before.map?.objects?.length) return [];
  const out: BattleEvent[] = [];
  let s = next;
  const push = (evs: BattleEvent[]) => { out.push(...evs); s = applyEvents(s, evs); };
  for (const e of events) {
    if (e.type === 'object_destroyed') {
      const o = before.map?.objects?.find((x) => x.id === e.objectId) ?? s.map?.objects?.find((x) => x.id === e.objectId);
      if (!o) continue;
      if (o.kind === 'tree' && !/devrildi/.test(e.label)) push(treeFallEvents(s, o, (e as { actorId?: string }).actorId ?? 'harita', rng));
      if (o.kind === 'bridge') push(bridgeBreakEvents(s, o, rng));
    }
    if (e.type === 'object_damaged' && e.damage > 0) {
      const o = objOf(s, e.objectId);
      if (!o) continue;
      if (o.kind === 'tent' && e.damageType === 'fire' && o.state !== 'burning' && ruleOf(s, 'tentFire')) push(igniteEvents(s, o, e.actorId ?? 'harita', `${OBJECTS.tent.tr} ateşle tutuştu`));
      if (o.kind === 'bonePile' && (e.damageType === 'fire' || e.damageType === 'radiant') && ruleOf(s, 'boneRise')) {
        push([{ type: 'object_removed', objectId: o.id }, { type: 'map_note', text: `${OBJECTS.bonePile.tr} ${e.damageType === 'fire' ? 'yandı' : 'ışıltıyla arındı'}: canlanamaz.` }]);
      }
    }
  }
  // Alanlı ateş çadırın herhangi bir altıgenine değdiyse (nesnenin kendi altıgeni dışında da).
  if (ruleOf(s, 'tentFire')) {
    const tents = tentHexes(s);
    for (const hit of areaDamageOf(events)) {
      if (hit.damageType !== 'fire') continue;
      const keys = new Set(hit.hexes.map(hexKey));
      for (const t of (s.map?.objects ?? []).filter((o) => o.kind === 'tent' && o.state !== 'burning' && tents[o.id])) {
        if ((tents[t.id] ?? []).some((h) => keys.has(hexKey(h)))) push(igniteEvents(s, t, hit.actorId, `${OBJECTS.tent.tr} ateşle tutuştu`));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Tur başı: boynuz, çadır yangını, kemik yığınları

function hornEvents(state: BattleState, rng: Rng): BattleEvent[] {
  const r = ruleOf(state, 'hornAlarm');
  if (!r) return [];
  const sentry = state.groups?.find((g) => g.id === str(r.sentryGroup, 'nobet'));
  const camp = state.groups?.find((g) => g.id === str(r.campGroup, 'kamp'));
  if (!sentry || !camp || sentry.state !== 'alarmed' || sentry.alarmedRound === undefined) return [];
  if (state.round !== sentry.alarmedRound + num(r.delayRounds, 1)) return [];
  // Kuyruk 24b: sürekli takviye açıksa boynuz, kamp başka yoldan alarmlanmış olsa da çalar (takviye sayacı başlar).
  const more = !!ruleOf(state, 'hornReinforce');
  if (camp.state === 'alarmed' && !more) return [];
  const able = (sentry.members ?? []).map((id) => state.combatants[id]).filter((c): c is Combatant => !!c && c.hp > 0 && !isIncapacitated(c.conditions));
  if (!able.length) return [{ type: 'map_note', text: 'Nöbetçi boynuzu öttüremeden susturuldu: alarm iptal.' }];
  const note: BattleEvent = { type: 'map_note', text: `${able[0]?.name} alarm boynuzunu öttürdü: kamp uyandı, takviye geliyor!`, ...(more ? { hornRound: state.round } : {}) };
  return camp.state === 'alarmed' ? [note] : [note, alarmEvent(state, camp, 'alarm boynuzu', able[0]?.id, rng)];
}

/** Ayakta çadır: yıkılmamış (listede) ve yanmıyor. */
const standingTents = (state: BattleState) => (state.map?.objects ?? []).filter((o) => o.kind === 'tent' && o.state !== 'burning');

/**
 * Kuyruk 24b: sürekli takviye (`hornReinforce`). Boynuz çaldıktan sonra her `interval` turda bir (tur başında) `waveSize`
 * ork ayakta kalan çadırların yanından gelir; toplam `maxTotal`. Son çadır yıkılınca/yanınca durur. Canavar kuraldaki
 * listeden sırayla (zar yok); yaratık `summoned` olayının içinde (replay aynı).
 */
function reinforceEvents(state: BattleState): BattleEvent[] {
  const r = ruleOf(state, 'hornReinforce');
  const horn = state.map?.hornRound;
  if (!r || horn === undefined) return [];
  const k = state.round - horn;
  const every = Math.max(1, num(r.interval, 2));
  if (k <= 0 || k % every !== 0) return [];
  const tents = standingTents(state);
  if (!tents.length) return [];
  const count = Object.keys(state.combatants).filter((id) => id.startsWith('takviye-')).length;
  const n = Math.min(Math.max(1, num(r.waveSize, 1)), num(r.maxTotal, 12) - count);
  if (n <= 0) return [];
  const list = Array.isArray(r.monsters) && r.monsters.length ? (r.monsters as string[]) : ['tough'];
  const out: BattleEvent[] = [];
  let s = state;
  for (let i = 0; i < n; i++) {
    const idx = count + i;
    const tent = tents[idx % tents.length] as MapObject;
    const at = nearestSolid(s, tent.at, '');
    if (!at) continue;
    const mon = getMonster(list[idx % list.length] as string);
    const c = { ...combatantFromMonster(mon, { id: `takviye-${idx + 1}`, name: `${mon.name} (takviye ${idx + 1})` }), side: 'enemies' as const, pos: at, initiative: 0 };
    const ev: BattleEvent = { type: 'summoned', ownerId: 'harita', spell: 'Alarm boynuzu', combatant: c, index: s.order.length };
    out.push(ev); s = applyEvents(s, [ev]);
  }
  if (out.length) out.unshift({ type: 'map_note', text: `Kamptan takviye geldi (${out.length}); çadırlar ayakta kaldıkça gelmeye devam edecek.` });
  return out;
}

function boneEvents(state: BattleState): BattleEvent[] {
  const r = ruleOf(state, 'boneRise');
  if (!r || state.round !== 1 + num(r.rounds, 2)) return [];
  const piles = (state.map?.objects ?? []).filter((o) => o.kind === 'bonePile');
  if (!piles.length) return [];
  const mon = getMonster(str(r.monster, 'skeleton'));
  const out: BattleEvent[] = [];
  let s = state;
  let n = Object.keys(state.combatants).filter((id) => id.startsWith('kemik-')).length;
  for (const p of piles) {
    const busy = standing(s).some((c) => sameHex(c.pos as Offset, p.at));
    const at = busy ? nearestSolid(s, p.at, '') : p.at;
    n++;
    const evs: BattleEvent[] = [{ type: 'object_removed', objectId: p.id }];
    if (at) {
      const c = { ...combatantFromMonster(mon, { id: `kemik-${n}`, name: `${mon.name} (kemik yığını ${n})` }), side: 'enemies' as const, pos: at, initiative: 0 };
      evs.push({ type: 'summoned', ownerId: 'harita', spell: 'Kemik yığını', combatant: c, index: s.order.length });
    }
    out.push(...evs); s = applyEvents(s, evs);
  }
  out.unshift({ type: 'map_note', text: 'Kemik yığınları sarsıldı: iskeletler ayağa kalkıyor!' });
  return out;
}

/** Yeni tur başında Orman mekanikleri (sıra: boynuz, çadır yangını, kemikler). */
export function forestRoundEvents(state: BattleState, rng: Rng): BattleEvent[] {
  if (!state.map) return [];
  const out: BattleEvent[] = [];
  let s = state;
  for (const make of [(x: BattleState) => hornEvents(x, rng), reinforceEvents, (x: BattleState) => tentRoundEvents(x, rng), boneEvents]) {
    const evs = make(s);
    out.push(...evs); s = applyEvents(s, evs);
  }
  return out;
}

/**
 * Kuyruk 24d: mağara keşfi hane tabanlı (kural sürümü 5): komut sonunda şelale geçidinin bir altıgeninde duran parti üyesi
 * (uçarak, ışınlanarak, itilerek gelen dahil) bayrağı üretir; yürüyerek girende zaten `enterHexEvents` üretmiştir.
 */
export function caveDiscoveryEvents(state: BattleState): BattleEvent[] {
  const fall = ruleOf(state, 'waterfall');
  if (!fall || typeof fall.flag !== 'string' || (state.kuralSurumu ?? 1) < 5 || (state.flags ?? []).includes(fall.flag) || !Array.isArray(fall.hexes)) return [];
  const hexes = fall.hexes.map((xy) => ruleHex(state, xy));
  const who = Object.values(state.combatants).find((c) => c.side === 'party' && !c.civilian && !c.summon && c.pos && c.hp > 0 && hexes.some((h) => sameHex(h, c.pos as Offset)));
  return who ? [{ type: 'map_note', text: `${who.name} şelalenin arkasındaki geçide ulaştı: mağara keşfedildi.`, flag: fall.flag }] : [];
}
