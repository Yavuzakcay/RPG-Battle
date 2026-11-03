/**
 * Görev K26: Buzul ve Dağ paketlerinin K28b'de olmayan mekanikleri. Hepsi harita kuralı (`ruleOf`, haritadaki kuralda
 * `surum: 12`; Game Master anahtarı ve parametreleri `data/kural-kontrol.json`); eski savaşta (kural sürümü < 12) hiçbiri
 * çalışmaz, replay aynı. Yeni olay türü yok: `map_effect`, `map_note`, `effect_added`, `exhaustion_changed`, `tile_changed`,
 * `object_*`, yüzey/zon olayları ve itme.
 * - `gateLever`: kol (lever) çekilince bağlı kapı nesnesi açılır/kapanır (kol tekrar çekilebilir; kapının altında yaratık
 *   varsa kapanmaz). Kol bağlı değilse eski davranış (yürüyen merdiven).
 * - `ballista`: balista nesnesi; bitişikteki yaratık eylemle "yükle" ve "ateşle" (hedef altıgeni `to`). Değerler kuralda
 *   (varsayılan: +6, 3d10 delici, 120/480 ft; uzak menzilde dezavantaj; görüş hattı balistanın altıgeninden).
 * - `frozenFall`: donmuş şelale nesnesi (buz, ateşe karşı savunmasız: `nesneler.json` `vulnerable`); kırılınca ya da
 *   eriyince ardındaki geçit altıgenleri açılır, keşif bayrağı (Orman şelalesi ile aynı olay biçimi).
 * - `coldExposure`: SRD 5.2.1 Extreme Cold'un savaş ölçeği (varsayılan kapalı): `startRound`'dan başlayarak her `interval`
 *   turda soğuğa açık her yaratık CON save (DC 10); başarısızsa 1 Exhaustion. Soğuk direnci/bağışıklığı olan otomatik geçer.
 * - `sentinelNiche`: heykelin gösterdiği gizli niş: içindeki gizli sandık bulununca (pasif Algı, `hiddenObjects`) ya da
 *   bulmaca çözülünce niş kayası açılır.
 * - Çığ (`avalanche`, sürüm 12 eklemeleri): `autoRound` (0: yalnızca Game Master), uyarıda şeridin üstünde uyarı yüzeyi
 *   (`warning`, yapay zekâ kaçınır), başarısız save'de `dir` yönüne bir altıgen itilme.
 * Saf; zarlar rng'den.
 */
import { exhaustionGain } from './deathWard';
import { distance, sameHex, type Offset } from '../rules/hex';
import { rollD20, rollTag, type Rng } from '../rules/dice';
import { damageEffect, ruleHex, ruleOf, saveEffect } from './maprules';
import { damageProfile, fail, finish, isTargetable, type CommandResult } from './common';
import { applyEvents } from './reduce';
import { surfaceEvent } from './surfaces';
import { sightBlockedBetween } from './cover';
import { effectiveAc } from './divine';
import { ruleVersion } from './ruleVersion';
import { getMap } from '../map/maps';
import { forcedMoveEvents, pushOutcome } from './forced';
import { downwind } from './wilds';
import type { BattleEvent, BattleState, Combatant, MapObject, ObjectAction } from './types';

/** Bu dosyadaki mekaniklerin gerektirdiği kural sürümü. */
export const K26_VERSION = 12;
const num = (v: unknown, d: number): number => (typeof v === 'number' ? v : d);
const str = (v: unknown, d: string): string => (typeof v === 'string' ? v : d);
const OFF = 'Bu harita mekaniği kapalı (Game Master) ya da bu savaşta yok.';
const hexList = (s: BattleState, raw: unknown): Offset[] => (Array.isArray(raw) ? raw : []).map((xy) => ruleHex(s, xy));
const standing = (s: BattleState) => Object.values(s.combatants).filter((c) => c.pos && c.hp > 0 && !c.summon?.gone);
export const k26On = (s: BattleState): boolean => ruleVersion(s) >= K26_VERSION;
/** Haritanın varyantında kural yazılı mı (Game Master kapatmış ya da sürüm yetmese de). */
const mapHasRule = (s: BattleState, id: string): boolean => {
  if (!s.map) return false;
  const m = getMap(s.map.id);
  return !!(m.variants.find((v) => v.id === s.map?.variantId) ?? m.variants[0])?.rules.some((r) => r.id === id);
};

// ---------------------------------------------------------------------------------------------
// Nesne kullanımı: kol → kapı, balista

export function executeHighlandsUse(state: BattleState, actor: Combatant, objectId: string, action: ObjectAction, to: Offset | undefined, rng: Rng): CommandResult | null {
  const obj = state.map?.objects?.find((o) => o.id === objectId && !o.carriedBy);
  if (!obj) return null;
  if (obj.kind === 'lever' && action === 'pull') {
    const r = ruleOf(state, 'gateLever');
    if (!r || str(r.lever, '') !== obj.id) return mapHasRule(state, 'gateLever') ? fail(OFF) : null;
    if (!actor.pos || distance(actor.pos, obj.at) > 1) return fail('Kola bitişik olmalısın.');
    const gate = state.map?.objects?.find((o) => o.id === str(r.gate, ''));
    if (!gate) return fail('Kolun bağlı olduğu kapı yok (kırılmış).');
    const opening = gate.state !== 'open';
    if (!opening && Object.values(state.combatants).some((c) => c.pos && sameHex(c.pos, gate.at) && isTargetable(c))) return fail('Kapının altıgeninde yaratık var: kapanmaz.');
    return finish(state, [
      { type: 'object_changed', objectId: obj.id, label: `${actor.name} kolu çekti` },
      { type: 'object_changed', objectId: gate.id, state: opening ? 'open' : 'closed', label: opening ? 'Kol: kapı açıldı' : 'Kol: kapı kapandı' },
    ]);
  }
  if (obj.kind !== 'ballista') return null;
  const r = ruleOf(state, 'ballista');
  if (!r) return fail(OFF);
  if (!actor.pos || distance(actor.pos, obj.at) > 1) return fail('Balistaya bitişik olmalısın.');
  if (action === 'load') {
    if (obj.state !== 'spent') return fail('Balista zaten yüklü.');
    return finish(state, [{ type: 'object_changed', objectId: obj.id, state: 'loaded', label: `${actor.name} balistayı yükledi` }]);
  }
  if (action !== 'fire') return fail('Bu nesneyle bu yapılamaz.');
  if (obj.state === 'spent') return fail('Balista boş: önce yüklenmeli.');
  const target = to ? Object.values(state.combatants).find((c) => c.pos && sameHex(c.pos, to) && isTargetable(c)) : undefined;
  if (!target?.pos) return fail('Balista hedefi yok.');
  if (target.id === actor.id) return fail('Kendine ateş edemezsin.');
  const d = distance(obj.at, target.pos) * 5;
  const [normal, long] = Array.isArray(r.range) ? (r.range as number[]) : [120, 480];
  if (d > (long ?? 480)) return fail(`Hedef menzil dışında (${d} ft).`);
  const wall = sightBlockedBetween(state, obj.at, target.pos);
  if (wall) return fail(`Hedef görünmüyor: araya ${wall} giriyor.`);
  const bonus = num(r.attackBonus, 6);
  const mode = d > (normal ?? 120) ? 'disadvantage' : 'normal';
  const roll = rollD20(mode, rollTag(rng, { by: actor.id, kind: 'attack', bonus }));
  const ac = effectiveAc(state, target);
  const crit = roll.kept === 20;
  const hit = crit || (roll.kept !== 1 && roll.kept + bonus >= ac);
  const dice = str(r.damage, '3d10');
  const events: BattleEvent[] = [
    { type: 'object_changed', objectId: obj.id, state: 'spent', label: `${actor.name} balistayı ateşledi` },
    { type: 'map_note', text: `Balista → ${target.name}: zar ${roll.kept}${mode === 'disadvantage' ? ' (uzak menzil, dezavantaj)' : ''}, toplam ${roll.kept + bonus} / AC ${ac}: ${hit ? (crit ? 'kritik isabet' : 'isabet') : 'ıska'}.` },
  ];
  if (hit) events.push(damageEffect(target, 'ballista', 'balista oku', { dice: crit ? dice.replace(/^(\d+)d/, (_, n: string) => `${Number(n) * 2}d`) : dice, type: 'piercing' }, rng));
  return finish(state, events);
}

// ---------------------------------------------------------------------------------------------
// Yeni tur: soğuğa maruz kalma, çığın kendiliğinden gelişi

/** Soğuğa dayanıklı: soğuk direnci ya da bağışıklığı (SRD Extreme Cold). */
export const coldProof = (c: Combatant): boolean => {
  const p = damageProfile(c);
  return p.resistances.includes('cold') || p.immunities.includes('cold');
};

export function highlandsRoundEvents(state: BattleState, rng: Rng): BattleEvent[] {
  if (!state.map || !k26On(state)) return [];
  const out: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { out.push(...evs); s = applyEvents(s, evs); };
  const cold = ruleOf(s, 'coldExposure');
  const start = num(cold?.startRound, 3);
  if (cold && s.round >= start && (s.round - start) % Math.max(1, num(cold.interval, 3)) === 0) {
    const evs: BattleEvent[] = [{ type: 'map_note', text: 'Dondurucu soğuk iliklere işliyor (CON save, başarısızsa 1 Exhaustion).' }];
    for (const c of standing(s)) {
      if (c.civilian || coldProof(c)) continue;
      const ev = saveEffect(c, 'coldExposure', 'dondurucu soğuk', 'con', num(cold.dc, 10), rng);
      evs.push(ev);
      if (ev.type === 'map_effect' && !ev.roll?.success) evs.push(...exhaustionGain(s, c, (c.exhaustion ?? 0) + 1, 'Dondurucu soğuk'));
    }
    push(evs);
  }
  const ava = ruleOf(s, 'avalanche');
  const auto = num(ava?.autoRound, 0);
  if (ava && auto > 0 && s.round === auto && !s.map?.avalancheRound) {
    const t = avalancheWarnEvents(s, ava);
    push(t);
  }
  return out;
}

/** Çığ uyarısı (Game Master ya da `autoRound`): gelme turu + sürüm 12'de şeridin üstünde uyarı yüzeyi. */
export function avalancheWarnEvents(state: BattleState, r: Record<string, unknown>): BattleEvent[] {
  const warn = Math.max(1, num(r.warnRounds, 2));
  const comes = state.round + warn;
  const out: BattleEvent[] = [{ type: 'map_note', text: `Dağdan uğultu: ${warn} tur sonra çığ geliyor!`, avalancheRound: comes }];
  if (!k26On(state)) return out;
  const ev = surfaceEvent(applyEvents(state, out), 'warning', hexList(state, r.hexes), 'harita', 'enemies');
  out.push(ev.type === 'zone_created' ? { ...ev, zone: { ...ev.zone, until: comes - 1 } } : ev);
  return out;
}

/** Sürüm 12: çığda save'i kaçıran yamaç yönüne (`dir`) bir altıgen sürüklenir. */
export function avalancheSweep(state: BattleState, r: Record<string, unknown>, c: Combatant, rng: Rng): BattleEvent[] {
  if (!k26On(state) || !c.pos) return [];
  const to = downwind(state, c.pos, str(r.dir, 'S'));
  if (!to) return [];
  const res = pushOutcome(state, c, c.pos, to);
  return res.ok ? forcedMoveEvents(state, c.id, res, 'harita', rng) : [];
}

// ---------------------------------------------------------------------------------------------
// Komut sonu: donmuş şelale, gizli niş

export function highlandsAfterEvents(before: BattleState, next: BattleState, events: BattleEvent[]): BattleEvent[] {
  if (!k26On(next)) return [];
  const out: BattleEvent[] = [];
  const fall = ruleOf(next, 'frozenFall');
  if (fall) {
    const gone = events.some((e) => e.type === 'object_destroyed' && e.objectId === str(fall.object, ''));
    if (gone) {
      const was = before.map?.objects?.find((o) => o.id === str(fall.object, ''));
      out.push(...hexList(next, fall.hexes).map((at): BattleEvent => ({ type: 'tile_changed', at, to: str(fall.to, '.') })),
        { type: 'map_note', text: `Donmuş şelale ${was ? 'çöktü' : 'eridi'}: ardındaki geçit açıldı.`, ...(typeof fall.flag === 'string' ? { flag: fall.flag } : {}) });
    }
  }
  const niche = ruleOf(next, 'sentinelNiche');
  if (niche) {
    const chest = next.map?.objects?.find((o) => o.id === str(niche.chest, ''));
    const hex = ruleHex(next, niche.hidden);
    const shut = next.map?.tiles[hex.row]?.[hex.col] !== '.';
    const found = events.some((e) => e.type === 'object_changed' && e.objectId === str(niche.chest, '') && e.found === true);
    const solved = events.some((e) => e.type === 'tile_changed' && sameHex(e.at, hex));
    if (shut && found) out.push({ type: 'tile_changed', at: hex, to: '.' }, { type: 'map_note', text: 'Heykelin kılıcının gösterdiği kayada bir niş fark edildi: içinde bir sandık!' });
    if (solved && chest?.gizli && !chest.found) out.push({ type: 'object_changed', objectId: chest.id, found: true, label: 'Nişte bir sandık var' });
  }
  return out;
}

/** Arayüz: balistanın varsayılan hedefi (menzil ve görüş hattındaki en yakın düşman). */
export function ballistaTarget(state: BattleState, actor: Combatant, obj: MapObject): Offset | null {
  const r = ruleOf(state, 'ballista');
  if (!r) return null;
  const long = Array.isArray(r.range) ? num((r.range as number[])[1], 480) : 480;
  const foes = Object.values(state.combatants).filter((c) => c.pos && c.side !== actor.side && c.hp > 0 && isTargetable(c)
    && distance(obj.at, c.pos) * 5 <= long && !sightBlockedBetween(state, obj.at, c.pos) && !c.civilian)
    .sort((a, b) => distance(obj.at, a.pos as Offset) - distance(obj.at, b.pos as Offset) || a.id.localeCompare(b.id));
  return foes[0]?.pos ?? null;
}

/** Testler ve sim: kural sürüm 12 eklemelerinin haritadaki kuralları. */
export const K26_RULES = ['gateLever', 'ballista', 'frozenFall', 'coldExposure', 'sentinelNiche'] as const;
