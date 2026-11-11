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
import { bodyHeightFt, ceilingOver } from './altitude';
import { anyRiders, riderOnMount } from './riderCore';
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
  if (state.map && (!actor.pos || !m.pos || distance(actor.pos, m.pos) > 1)) return 'Bineğe bitişik olmalısın.';
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
  return finish(state, [{ type: 'mounted', actorId: actor.id, mountId, cost: halfSpeed(state, actor) }]);
}

export function executeDismount(state: BattleState, actor: Combatant, to?: Offset): CommandResult {
  if (!actor.riding) return fail('Bir bineğin üstünde değilsin.');
  const at = to ?? (actor.pos ? freeNeighbor(state, actor.pos) : null);
  if (!at || (actor.pos && distance(actor.pos, at) > 1) || occupied(state, at)) return fail('İnmek için bitişik boş bir altıgen seç.');
  if (actor.movementUsed + halfSpeed(state, actor) > Math.floor(actor.speed / 5) * (1 + actor.economy.dashes)) return fail('İnmek için hızının yarısı kadar hareketin kalmalı.');
  return finish(state, [{ type: 'dismounted', actorId: actor.id, at, cost: halfSpeed(state, actor) }]);
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
  const fallOff = (c: Combatant, m: Combatant, alreadyProne: boolean) => {
    const at = m.pos ? freeNeighbor(state, m.pos) ?? m.pos : c.pos;
    if (at) out.push({ type: 'dismounted', actorId: c.id, at, cost: 0, fell: true });
    if (!alreadyProne) out.push({ type: 'condition_changed', targetId: c.id, condition: 'Prone', present: true, reason: 'Binekten düşme' });
  };
  for (const c of Object.values(state.combatants)) {
    if (!c.riding) continue;
    const m = state.combatants[c.riding];
    // Ayrılmış binici (B9, B24) ya da kendisi düşmüş/ölmüş binici: save'siz, bulunduğu yerde iner.
    if (!m || c.hp <= 0 || !riderOnMount(state, c)) {
      const at = c.pos ?? (m?.pos ? freeNeighbor(state, m.pos) : null);
      if (at) out.push({ type: 'dismounted', actorId: c.id, at, cost: 0 });
      continue;
    }
    // Ölü ya da kaybolmuş binek (B10): save'siz iner.
    if (m.life === 'dead' || !!m.summon?.gone || (m.hp <= 0 && m.life === 'alive')) {
      const at = m.pos ? freeNeighbor(state, m.pos) ?? m.pos : c.pos;
      if (at) out.push({ type: 'dismounted', actorId: c.id, at, cost: 0 });
      continue;
    }
    // Baygın ya da Incapacitated binek: DEX 10 yalnız Prone'u belirler, her durumda iner.
    if (m.hp <= 0 || isIncapacitated(m.conditions)) {
      const s = fallSave(c, rng);
      out.push(s.event);
      const at = m.pos ? freeNeighbor(state, m.pos) ?? m.pos : c.pos;
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
