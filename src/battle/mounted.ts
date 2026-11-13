/**
 * Kuyruk 19 (görev 7, SRD 5.2.1 Mounted Combat; anahtar `srdK19`): binek.
 * - `mount`: bitişikteki gönüllü (aynı taraf) ve binicide en az bir boy büyük yaratığa binmek hızın yarısı kadar
 *   hareket harcar; binici bineğin altıgenine geçer (`riding`, bineğe `rider`).
 * - `dismount`: bitişik boş altıgene inmek hızın yarısı.
 * - Binici kendi yürüyemez (bineği taşır): reducer sonu `syncRiders` binicinin yerini bineğe eşitler (yürüyüş, itme,
 *   ışınlanma, atlama hepsi).
 * - Bağımsız binek (SRD "independent mount"): binek kendi sırasıyla oynar; kontrollü binek ayrımı yok.
 * - Binek Prone olur, düşer ya da Incapacitated olursa binici DEX save (DC 10); başarısızsa Prone; her durumda
 *   bitişik boş altıgene iner (komut sonu `riderCleanup`).
 *
 * Kuyruk MB1 (kural sürümü 68, `binekSurum.ts`; `harita/belgeler/BINEK-PLAN.md` B1, B3, B8–B10, B23, B24):
 * - Yığın (B1): binici bineğin altıgenini VE irtifasını izler (`syncRiders`); kendi hücresini kaplamaz (`riderOnMount`,
 *   `movement.ts` `occupantAt`); komut sonu irtifa düşüşü biniciye işlemez (bineğin üstünde durur).
 * - Maliyet (B3): hızın yarısı, 5 ft'e aşağı (en az 5 ft). Yerde yatan (Prone) binemez (önce kalkar).
 * - Ayrılma (B9, B24): binicinin kendi konumu ya da irtifası bir olayla değişirse (ışınlanma, itme, Levitate) bineğe geri
 *   çekilmez; komut sonunda save'siz iner.
 * - Düşme (SRD): bineği isteği dışında itilen (`pushed`), bineği yeni Prone olan ya da kendisi Prone olan binici DEX 10.
 *   Başarıda üstte kalır ve Prone olmaz (B8 ⚠ yorum); başarısızsa bineğin 5 ft içinde boş altıgene düşer, Prone.
 * - Ölü/kaybolmuş binek (B10): save'siz iner. Baygın ya da Incapacitated binek: DEX 10 yalnız Prone'u belirler, her
 *   durumda iner (eski davranış).
 * Sürüm 67 ve altı birebir eski kod.
 */
import { resolveSave } from '../rules/attack';
import { isIncapacitated } from '../rules/conditions';
import { rollTag, type Rng } from '../rules/dice';
import { distance, neighbors, sameHex, type Offset } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import { saveDice } from './effectDice';
import { saveMode } from './durations';
import { sizeRank } from './forced';
import { globalRule } from './ruleControl';
import { binekOn } from './binekSurum';
import { altitudeCapFt, bodyHeightFt, ceilingOver, climbingAloft } from './altitude';
import { binekMb3On, binekMb4On, binekMb7On } from './binekSurum';
import { binekMb2On } from './binekMb2Surum';
import { mountControlled } from './binekMb2';
import { adjacent3D } from './adjacency';
import { bandOf } from './cells';
import { climbs, flySpeed } from './flight';
import { bodyFitProblem, occupantAt, placeProblem, stackFitProblem } from './movement';
import { slabsAt } from './stand';
import { anyRiders, bodyOutsideSpots, fallOffSpot, riderOnMount } from './riderCore';
import { bodyAt, covers, isMultiHex53 } from './body';
import type { BattleEvent, BattleState, Combatant } from './types';

/** Binme/inme maliyeti (altıgen). 68+: hızın yarısı 5 ft'e aşağı, en az 1 altıgen (B3); öncesi yukarı yuvarlama. */
const halfSpeed = (state: Pick<BattleState, 'kuralSurumu'>, c: Combatant) => (binekOn(state) ? Math.max(1, Math.floor(c.speed / 10)) : Math.ceil(c.speed / 10));
const occupied = (state: BattleState, h: Offset) => Object.values(state.combatants).some((o) => o.hp > 0 && !!o.pos && sameHex(o.pos, h) && !o.summon?.gone);

function freeNeighbor(state: BattleState, at: Offset): Offset | null {
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  return neighbors(at, size).find((h) => !occupied(state, h)) ?? null;
}

export { anyRiders, riderOnMount, riderStackFt } from './riderCore';

export function mountProblem(state: BattleState, actor: Combatant, mountId: string): string | null {
  if (!globalRule(state, 'srdK19')) return 'Binek kuralları bu kural sürümünde ya da Game Master ayarında kapalı.';
  if (actor.riding) return 'Zaten bir bineğin üstündesin.';
  const m = state.combatants[mountId];
  if (!m || m.hp <= 0 || m.id === actor.id) return 'Binek bulunamadı.';
  if (m.side !== actor.side) return 'Yalnızca gönüllü (dost) bir yaratığa binilir.';
  if (m.rider) return 'Bineğin üstünde zaten biri var.';
  if (sizeRank(m.size) <= sizeRank(actor.size)) return 'Binek senden en az bir boy büyük olmalı.';
  // Kuyruk MB7 (70+): çağrılan yaratığa yalnız binek kuralı varsa binilir (Find Steed, Phantom Steed, paket `binek`).
  if (m.summon && binekMb7On(state)) {
    const rule = m.summon.mount;
    if (!rule) return `${m.name} binek değil (çağrılan yaratık).`;
    if (rule.ownerOnly && actor.id !== m.summon.by) return `${m.name}: yalnız çağıranı biner.`;
    if (rule.maxRider && sizeRank(actor.size) > sizeRank(rule.maxRider)) return `${m.name}: binici en çok ${rule.maxRider} boyutunda olur.`;
    const owner = state.combatants[m.summon.by];
    if (rule.minLevel && (owner?.level ?? 0) < rule.minLevel) return `${m.name}: çağıranın ${rule.minLevel}. seviyesinden binilir.`;
  }
  // Kuyruk MB3 (69+): bitişiklik 3B (havadaki bineğe havadan binilir); yer altındaki ya da duvarda tutunan (tırmanma hızı
  // olmayan) bineğe binilmez; yığın kat döşemesinin altına da sığmalı (B11).
  if (binekMb3On(state) && state.map) {
    if (!actor.pos || !m.pos || !adjacent3D(state, actor, m)) return 'Bineğe bitişik olmalısın (havadaki bineğe havadan binilir).';
    if (m.burrowed) return 'Yer altındaki bineğe binilmez.';
    if (climbingAloft(m) && !climbs(m, state)) return 'Duvarda tutunan bineğe binilmez.';
    const top = (m.altitudeFt ?? 0) + bodyHeightFt(m) + bodyHeightFt(actor);
    // Kuyruk MB4 (72+, çok altıgen): döşeme gövdenin bütün altıgenlerinde denetlenir.
    const under = binekMb4On(state) && isMultiHex53(state, m) ? bodyAt(state, m, m.pos).flatMap((h) => slabsAt(state, h)) : slabsAt(state, m.pos);
    const slab = under.find((f) => f > (m.altitudeFt ?? 0) && f < top);
    if (slab !== undefined) return `Kat döşemesi alçak (${slab} ft): binekle birlikte sığmazsın.`;
  } else if (state.map && (!actor.pos || !m.pos || distance(actor.pos, m.pos) > 1)) return 'Bineğe bitişik olmalısın.';
  if (binekOn(state)) {
    if (actor.conditions.includes('Prone')) return 'Yerde yatarken binilmez: önce kalk.';
    // B11 (⚠ SRD'de boy yok): bineğin boyu + binicinin boyu tavanın altına sığmalı.
    const ceil = ceilingOver(state, m);
    if (ceil !== null && (m.altitudeFt ?? 0) + bodyHeightFt(m) + bodyHeightFt(actor) > ceil) return `Tavan alçak (${ceil} ft): binekle birlikte sığmazsın.`;
  }
  if (actor.movementUsed + halfSpeed(state, actor) > Math.floor(actor.speed / 5) * (1 + actor.economy.dashes)) return 'Binmek için hızının yarısı kadar hareketin kalmalı.';
  return null;
}

export function executeMount(state: BattleState, actor: Combatant, mountId: string): CommandResult {
  const why = mountProblem(state, actor, mountId);
  if (why) return fail(why);
  // Kuyruk MB2 (74+): eğitimli/kontrollü binek (veriden) kontrollü olur.
  const m = state.combatants[mountId] as Combatant;
  return finish(state, [{ type: 'mounted', actorId: actor.id, mountId, cost: halfSpeed(state, actor), ...(binekMb2On(state) && mountControlled(m) ? { control: 'kontrollu' as const } : {}) }]);
}

export function executeDismount(state: BattleState, actor: Combatant, to?: Offset, toFt?: number): CommandResult {
  if (!actor.riding) return fail('Bir bineğin üstünde değilsin.');
  if (binekMb3On(state)) return dismount69(state, actor, to, toFt);
  const at = to ?? (actor.pos ? freeNeighbor(state, actor.pos) : null);
  if (!at || (actor.pos && distance(actor.pos, at) > 1) || occupied(state, at)) return fail('İnmek için bitişik boş bir altıgen seç.');
  if (actor.movementUsed + halfSpeed(state, actor) > Math.floor(actor.speed / 5) * (1 + actor.economy.dashes)) return fail('İnmek için hızının yarısı kadar hareketin kalmalı.');
  return finish(state, [{ type: 'dismounted', actorId: actor.id, at, cost: halfSpeed(state, actor) }]);
}

/**
 * Kuyruk MB3 (69+): inme. Varış bitişik altıgen, binicinin hücresi kendi bandında boş olmalı. `toFt` verilmezse bineğin
 * irtifası (havadaki binekten uçamayan inerse komut sonunda düşer); farklı irtifa yalnız uçabilene, bineğin bandının 5 ft
 * yakınında ve irtifa üst sınırı (tavan) altında.
 */
function dismount69(state: BattleState, actor: Combatant, to?: Offset, toFt?: number): CommandResult {
  const m = state.combatants[actor.riding ?? ''];
  const alt = actor.altitudeFt ?? 0;
  const ft = toFt ?? alt;
  if (ft % 5 !== 0) return fail('İrtifa 5 ft\'in katı olmalı.');
  if (ft !== alt && flySpeed(actor) <= 0) return fail('Başka bir irtifada inmek için uçabilmelisin.');
  if (m && (ft < alt - 5 || ft > alt + bodyHeightFt(m))) return fail('Bineğin 5 ft yakınında inilir.');
  if (ft < Math.min(0, alt)) return fail('Bu derinliğe inilmez.');
  const band = bandOf(actor, ft);
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  const free = (h: Offset) => !occupantAt(state, h, actor.id, band) && (ft > 0 || !placeProblem(state, h));
  // Kuyruk MB4 (72+, çok altıgen): bineğin gövdesinin dışına, gövdeye bitişik boş altıgene (çapaya en yakın); binicinin kendi
  // gövdesi (Large binici) sığmalı.
  if (m && binekMb4On(state) && isMultiHex53(state, m)) {
    const off = { ...actor, riding: undefined } as Combatant;
    const spots = bodyOutsideSpots(state, m);
    const fits = (h: Offset) => free(h) && !bodyFitProblem(state, { ...off, altitudeFt: ft }, h, []) && !bodyAt(state, off, h).some((x) => covers(state, m, x));
    const at = to ?? spots.find(fits) ?? null;
    if (!at || !spots.some((h) => sameHex(h, at)) || !fits(at)) return fail('Binekten inmek için gövdesine bitişik boş bir altıgen seç.');
    return dismountTail(state, actor, at, ft, alt);
  }
  const at = to ?? (actor.pos ? neighbors(actor.pos, size).find(free) ?? null : null);
  if (!at || !actor.pos || distance(actor.pos, at) !== 1 || !free(at)) return fail('İnmek için bitişik boş bir altıgen seç.');
  return dismountTail(state, actor, at, ft, alt);
}

function dismountTail(state: BattleState, actor: Combatant, at: Offset, ft: number, alt: number): CommandResult {
  if (ft > 0 && ft > altitudeCapFt(state, { ...actor, pos: at })) return fail('Tavan alçak: o irtifada inilmez.');
  if (actor.movementUsed + halfSpeed(state, actor) > Math.floor(actor.speed / 5) * (1 + actor.economy.dashes)) return fail('İnmek için hızının yarısı kadar hareketin kalmalı.');
  return finish(state, [{ type: 'dismounted', actorId: actor.id, at, cost: halfSpeed(state, actor), ...(ft !== alt ? { toFt: ft } : {}) }]);
}

/**
 * Reducer sonu: binici bineğin yerinde. Kuyruk MB1 (68+, `prev` = olaydan önceki durum): irtifa da eşitlenir; binicinin
 * kendi konumu/irtifası bu olayla değiştiyse ya da zaten ayrılmışsa eşitlenmez (komut sonunda `riderCleanup` indirir).
 */
export function syncRiders(state: BattleState, prev?: BattleState): BattleState {
  let next = state;
  const v68 = binekOn(state);
  for (const c of Object.values(state.combatants)) {
    if (!c.riding) continue;
    const m = next.combatants[c.riding];
    if (!m?.pos) continue;
    if (!v68) {
      if (!c.pos || !sameHex(c.pos, m.pos)) next = { ...next, combatants: { ...next.combatants, [c.id]: { ...c, pos: m.pos } } };
      continue;
    }
    const pc = prev?.combatants[c.id];
    const pm = prev?.combatants[c.riding];
    if (pc?.riding === c.riding && pc.pos && pm?.pos) {
      // Binici bu olayla kendisi yer/irtifa değiştirdi (ışınlanma, itme, Levitate): bineğe geri çekilmez.
      if (!c.pos || !sameHex(pc.pos, c.pos) || (pc.altitudeFt ?? 0) !== (c.altitudeFt ?? 0)) continue;
      // Önceki olayda ayrılmıştı: eşitlenmez.
      if (!sameHex(pc.pos, pm.pos) || (pc.altitudeFt ?? 0) !== (pm.altitudeFt ?? 0)) continue;
    }
    const alt = m.altitudeFt ?? 0;
    if (c.pos && sameHex(c.pos, m.pos) && (c.altitudeFt ?? 0) === alt) continue;
    const { altitudeFt: _a, ...rest } = c;
    next = { ...next, combatants: { ...next.combatants, [c.id]: { ...rest, pos: m.pos, ...(alt !== 0 || c.altitudeFt !== undefined ? { altitudeFt: alt } : {}) } as Combatant } };
  }
  return next;
}

function fallSave(c: Combatant, rng: Rng) {
  const save = resolveSave({ extra: saveDice(c, 'dex'), modifier: c.saves.dex, dc: 10, mode: saveMode('normal', c, 'dex') }, rollTag(rng, { by: c.id }));
  const event: BattleEvent = { type: 'save_resolved', actorId: c.id, targetId: c.id, label: 'Binekten düşme', ability: 'dex', dc: 10, mode: 'normal', reasons: [],
    d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
    damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: c.hp, effects: [], conditionsAdded: save.success ? [] : ['Prone'] };
  return { success: save.success, event };
}

/** Komut sonu: bineği düşen/Prone/Incapacitated olan binici DEX save (DC 10), başarısızsa Prone; bitişiğe iner. */
export function riderCleanup(state: BattleState, rng: Rng, before?: BattleState, events: readonly BattleEvent[] = []): BattleEvent[] {
  if (binekOn(state)) return riderCleanup68(state, rng, before, events);
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    if (!c.riding || c.hp <= 0) continue;
    const m = state.combatants[c.riding];
    const falls = !m || m.hp <= 0 || m.conditions.includes('Prone') || isIncapacitated(m.conditions) || !!m.summon?.gone;
    if (!falls) continue;
    const save = resolveSave({ extra: saveDice(c, 'dex'), modifier: c.saves.dex, dc: 10, mode: saveMode('normal', c, 'dex') }, rollTag(rng, { by: c.id }));
    out.push({ type: 'save_resolved', actorId: c.id, targetId: c.id, label: 'Binekten düşme', ability: 'dex', dc: 10, mode: 'normal', reasons: [],
      d20: save.d20?.rolls ?? [], natural: save.d20?.kept ?? null, total: save.total, success: save.success,
      damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: c.hp, effects: [], conditionsAdded: save.success ? [] : ['Prone'] });
    const at = c.pos ? freeNeighbor(state, c.pos) ?? c.pos : c.pos;
    if (at) out.push({ type: 'dismounted', actorId: c.id, at, cost: 0 });
    if (!save.success) out.push({ type: 'condition_changed', targetId: c.id, condition: 'Prone', present: true, reason: 'Binekten düşme' });
  }
  return out;
}

/** Kuyruk MB1 (68+): binekten inme ve düşme kuralları (dosya başı). */
function riderCleanup68(state: BattleState, rng: Rng, before: BattleState | undefined, events: readonly BattleEvent[]): BattleEvent[] {
  if (!anyRiders(state)) return [];
  const out: BattleEvent[] = [];
  // Kuyruk MB4 (72+, çok altıgen): bineğin gövdesinin dışında, gövdeye bitişik boş altıgen.
  const spot = (m: Combatant): Offset | null => (binekMb4On(state) && isMultiHex53(state, m) ? fallOffSpot(state, m.pos as Offset, m) : freeNeighbor(state, m.pos as Offset));
  const fallOff = (c: Combatant, m: Combatant, alreadyProne: boolean) => {
    const at = m.pos ? spot(m) ?? m.pos : c.pos;
    if (at) out.push({ type: 'dismounted', actorId: c.id, at, cost: 0, fell: true });
    if (!alreadyProne) out.push({ type: 'condition_changed', targetId: c.id, condition: 'Prone', present: true, reason: 'Binekten düşme' });
  };
  for (const c of Object.values(state.combatants)) {
    if (!c.riding) continue;
    const m = state.combatants[c.riding];
    // Ayrılmış binici (B9, B24) ya da kendisi düşmüş/ölmüş binici: save'siz, bulunduğu yerde iner.
    if (!m || c.hp <= 0 || !riderOnMount(state, c)) {
      const at = c.pos ?? (m?.pos ? spot(m) : null);
      if (at) out.push({ type: 'dismounted', actorId: c.id, at, cost: 0 });
      continue;
    }
    // Kuyruk MB4 (72+, çok altıgen; B24): zorla varışta (itme, kafes, gövdenin en yakın sığdığı yere konması) yığın gövdenin bir
    // altıgeninde tavana/döşemeye sığmıyorsa binici save'siz, gövdenin dışına iner.
    if (binekMb4On(state) && isMultiHex53(state, m) && m.pos && stackFitProblem(state, m, m.pos)) {
      const at = spot(m) ?? c.pos;
      if (at) out.push({ type: 'dismounted', actorId: c.id, at, cost: 0 });
      continue;
    }
    // Ölü ya da kaybolmuş binek (B10): save'siz iner.
    if (m.life === 'dead' || !!m.summon?.gone || (m.hp <= 0 && m.life === 'alive')) {
      const at = m.pos ? spot(m) ?? m.pos : c.pos;
      if (at) out.push({ type: 'dismounted', actorId: c.id, at, cost: 0 });
      continue;
    }
    // Baygın ya da Incapacitated binek: DEX 10 yalnız Prone'u belirler, her durumda iner.
    if (m.hp <= 0 || isIncapacitated(m.conditions)) {
      const s = fallSave(c, rng);
      out.push(s.event);
      const at = m.pos ? spot(m) ?? m.pos : c.pos;
      if (at) out.push({ type: 'dismounted', actorId: c.id, at, cost: 0, ...(s.success ? {} : { fell: true as const }) });
      if (!s.success && !c.conditions.includes('Prone')) out.push({ type: 'condition_changed', targetId: c.id, condition: 'Prone', present: true, reason: 'Binekten düşme' });
      continue;
    }
    // SRD tetikleri: bineğin yeni Prone'u, bineğin isteği dışında itilmesi, binicinin Prone'u.
    const b = before?.combatants;
    const mountProne = m.conditions.includes('Prone') && !b?.[m.id]?.conditions.includes('Prone');
    const pushed = events.some((e) => e.type === 'pushed' && e.targetId === m.id);
    const riderProne = c.conditions.includes('Prone') && !b?.[c.id]?.conditions.includes('Prone');
    if (!mountProne && !pushed && !riderProne) continue;
    const s = fallSave(c, rng);
    out.push(s.event);
    if (s.success) {
      // B8 (⚠ yorum): başarıda binici Prone olmaz, bineğin üstünde kalır.
      if (c.conditions.includes('Prone')) out.push({ type: 'condition_changed', targetId: c.id, condition: 'Prone', present: false, reason: 'Binekte kaldı' });
      continue;
    }
    fallOff(c, m, c.conditions.includes('Prone'));
  }
  return out;
}
