/**
 * Görev KARAR104 (kural sürümü 104, A2): yapışma (SRD 5.2.1 Stirge Proboscis s. 330, Darkmantle Crush s. 279, Cloaker Attach s. 274).
 * Kural `data/canavar-ekleri-a2.json` `yapisma` (kayıtta `surum` 104). Tek doğru kaynak hedefteki süren etki (`attachedBy`):
 * - İsabette yapışır (boyut sınırı `maxSize`); Darkmantle hedef Medium ya da küçükse ve saldırı avantajlıysa örter (`cover`:
 *   Blinded + nefes alamaz, A3 `noBreath`). Cloaker hedefi Blinded.
 * - Yapışan hedefle birlikte hareket eder: komut sonunda hedefe bitişik değilse hedefin yanındaki en yakın boş altıgene geçer
 *   (`teleported`; fırsat saldırısı ve zemin girişi yok), yer yoksa düşer. Hedef yürürken yapışanın fırsat saldırısı yok.
 * - Yapışan kendi hareketiyle ayrılır (5 ft harcar; `detachSelfEvents`, yürüme/atlama komutundan önce).
 * - Hedef eylemle ayırır (`escape`: Darkmantle DC 13, Cloaker DC 14 STR (Athletics); Stirge zarsız); Stirge ve Cloaker'da 5 ft
 *   içindeki yaratık da (`help`, `escapeCheck.allyHelp`).
 * - Kısıt (`blocked`): Stirge bağlıyken Proboscis yapamaz (`self`), Cloaker Attach'ı başka hedefe yapamaz (`others`), Darkmantle
 *   yalnız hedefe saldırır ve avantajlıdır (`allOthers`, `adv`).
 * - Stirge: hedef stirge'nin her tur başında 2d4 Necrotic (`sourceTurnDamage`).
 * - Cloaker (`share`): aldığı hasarı yarıya indirir (bütün türlere direnç, aşağı yuvarlanır), hedef aynı miktarda hasar alır
 *   (komut sonu; aynı türle, hedefin direnci işler: KARAR104-KALAN).
 * Biten: yapışan 0 HP/kaybolmuş, hedef ölü, ayrılma. 103 ve altında yok.
 */
import { distance, neighbors, type Offset } from '../rules/hex';
import { a2Of } from './ridersA2';
import { fitsSize } from './grapple';
import { damageEffects } from './damage-effects';
import { adjustDamage } from '../rules/damage';
import { damageProfile } from './common';
import { isAirborne } from './flight';
import { occupantAt, placeProblem } from './movement';
import { karar104On } from './karar104Surum';
import { registerCommandEnd } from './turnHooks';
import { applyEvents } from './reduce';
import type { ModeSource } from '../rules/modes';
import { formMonsterId } from './shapeMonsterCore';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

export interface AttachSpec {
  maxSize?: string;
  blocked?: 'self' | 'others' | 'allOthers';
  adv?: boolean;
  grants?: string[];
  cover?: { maxSize: string; grants: string[]; noBreath?: boolean };
  sourceTurnDamage?: { dice: string; type: string };
  escapeDc?: number;
  auto?: boolean;
  help?: boolean;
  share?: boolean;
}

const ALL_DAMAGE = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
export const attachId = (attackerId: string): string => `yapisma:${attackerId}`;
const shareId = (targetId: string): string => `yapisma-paylas:${targetId}`;
const fits = fitsSize;

/** Saldırının yapışma kuralı (104+, A2 kaydında `yapisma`). */
export function attachSpecOf(state: BattleState, actor: Combatant, attackName: string): AttachSpec | undefined {
  if (!karar104On(state)) return undefined;
  return (a2Of(state, formMonsterId(actor), attackName) as { yapisma?: AttachSpec } | undefined)?.yapisma;
}

/** Yapışanın bağlı olduğu hedef ve etki (yoksa null). */
export function attachedHost(state: BattleState, attacker: Combatant): { host: Combatant; effect: ActiveEffect } | null {
  if (!karar104On(state)) return null;
  for (const c of Object.values(state.combatants)) {
    const e = c.effects?.find((x) => x.attachedBy === attacker.id);
    if (e) return { host: c, effect: e };
  }
  return null;
}

/** Bağlıyken saldırı kısıtı: sorun metni ya da null. */
export function attachBlock(state: BattleState, actor: Combatant, target: Combatant, attackName: string): string | null {
  const at = attachedHost(state, actor);
  if (!at) return null;
  const own = attachSpecOf(state, actor, attackName);
  if (own?.blocked === 'self') return `${attackName}: ${at.host.name} hedefine yapışıkken kullanılamaz.`;
  if (own?.blocked === 'others' && target.id !== at.host.id) return `${attackName}: yapışıkken yalnız ${at.host.name} hedefine.`;
  // Darkmantle: bağlıyken her saldırısı yalnız hedefe (bağlandığı saldırının kuralı).
  const anchor = Object.values(actor.attacks).map((a) => attachSpecOf(state, actor, a.name)).find((s) => s?.blocked === 'allOthers');
  if (anchor && target.id !== at.host.id) return `Yapışıkken yalnız ${at.host.name} hedefine saldırabilir.`;
  return null;
}

/** Darkmantle: bağlıyken hedefe saldırıları avantajlı. */
export function attachSources(state: BattleState, actor: Combatant, target: Combatant): ModeSource[] {
  const at = attachedHost(state, actor);
  if (!at || at.host.id !== target.id) return [];
  return actor.attacks.some((a) => attachSpecOf(state, actor, a.name)?.adv) ? [{ effect: 'advantage', reason: 'Yapışık (hedefe avantaj)' }] : [];
}

/** İsabetten sonra yapışma (hedef saldırı sonrası HP'siyle). `advantage`: saldırı avantajlı mıydı (Darkmantle örtmesi). */
export function attachEvents(state: BattleState, actor: Combatant, target: Combatant, attackName: string, advantage: boolean): BattleEvent[] {
  const spec = attachSpecOf(state, actor, attackName);
  if (!spec || target.hp <= 0 || actor.hp <= 0 || !fits(target, spec.maxSize) || attachedHost(state, actor)) return [];
  const cover = spec.cover && advantage && fits(target, spec.cover.maxSize) ? spec.cover : undefined;
  const grants = [...(spec.grants ?? []), ...(cover?.grants ?? [])];
  const effect: ActiveEffect = {
    id: attachId(actor.id), name: `${actor.name}: ${attackName} (yapışık)`, sourceId: actor.id, attachedBy: actor.id, until: state.round + 14400,
    ...(grants.length ? { grants } : {}),
    ...(cover?.noBreath ? { noBreath: true as const } : {}),
    ...(spec.sourceTurnDamage ? { sourceTurnDamage: spec.sourceTurnDamage } : {}),
    escapeCheck: { dc: spec.escapeDc ?? 0, ...(spec.help ? { allyHelp: true } : {}) },
    ...(spec.auto ? { attachAuto: true } : {}),
  };
  const out: BattleEvent[] = [{ type: 'effect_added', targetId: target.id, effect }];
  if (spec.share) out.push({ type: 'effect_added', targetId: actor.id, effect: { id: shareId(target.id), name: `${attackName}: hasar paylaşımı`, sourceId: actor.id, resist: ALL_DAMAGE, until: state.round + 14400, attachShare: target.id } });
  return out;
}

/** Yapışanın kendi hareketiyle ayrılması (5 ft): yürüme/atlama komutundan önce. Hareket yetmezse sorun metni. */
export function detachSelfEvents(state: BattleState, actor: Combatant): BattleEvent[] | string {
  const at = attachedHost(state, actor);
  if (!at || !actor.pos) return [];
  if (Math.floor(actor.speed / 5) - actor.movementUsed < 1) return `${at.host.name} hedefinden ayrılmak için 5 ft hareket gerekli.`;
  return [{ type: 'effect_ended', targetId: at.host.id, effectId: at.effect.id, name: at.effect.name, reason: 'expired' }, { type: 'moved', actorId: actor.id, path: [actor.pos], cost: 1 }];
}

/** Hedef yürürken yapışan ona fırsat saldırısı yapmaz (birlikte hareket eder). */
export function attachedTo(state: BattleState, attacker: Combatant, hostId: string): boolean {
  return attachedHost(state, attacker)?.host.id === hostId;
}

/**
 * Görev KARAR104-KALAN: komutta `id`'nin aldığı hasarın tür parçaları (saldırı, save, süren etki olayları ve ek hasarları);
 * toplam `lost`'u aşmaz, türü bilinmeyen kalan `''` (türsüz).
 */
function takenByType(events: readonly BattleEvent[], id: string, lost: number): Array<[string, number]> {
  const parts = new Map<string, number>();
  const add = (type: string | undefined, n: number | undefined) => { if (n && n > 0) parts.set(type ?? '', (parts.get(type ?? '') ?? 0) + n); };
  for (const e of events) {
    if (!('targetId' in e) || e.targetId !== id || !('appliedDamage' in e)) continue;
    const x = e as { appliedDamage?: number; damageType?: string; extra?: Array<{ applied: number; type: string }> };
    add(x.damageType, x.appliedDamage);
    for (const ex of x.extra ?? []) add(ex.type, ex.applied);
  }
  const out: Array<[string, number]> = [];
  let left = lost;
  for (const [t, n] of parts) { if (left <= 0) break; const k = Math.min(n, left); out.push([t, k]); left -= k; }
  if (left > 0) out.push(['', left]);
  return out;
}

function followSpot(state: BattleState, a: Combatant, host: Combatant): Offset | null {
  if (!host.pos || !a.pos) return null;
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  const free = neighbors(host.pos, size).filter((h) => !occupantAt(state, h, a.id) && (isAirborne(a) || !placeProblem(state, h, a)));
  return free.sort((x, y) => distance(x, a.pos as Offset) - distance(y, a.pos as Offset) || x.row - y.row || x.col - y.col)[0] ?? null;
}

// Komut sonu: Cloaker hasar paylaşımı, birlikte hareket ve bitiş.
registerCommandEnd((before, next, events) => {
  if (!karar104On(next)) return [];
  const out: BattleEvent[] = [];
  let s = next;
  const push = (evs: BattleEvent[]) => { if (evs.length) { out.push(...evs); s = applyEvents(s, evs); } };
  // Cloaker: bu komutta aldığı (yarıya inmiş) hasar kadar hedef de hasar alır. KARAR104-KALAN (⚠ kapandı; SRD "the target takes
  // the same amount of damage"): Cloaker'ın aldığı türle (olaylardaki tür parçaları), hedefin direnç/bağışıklık/zayıflığıyla;
  // türü bilinmeyen kalan türsüz.
  for (const a of Object.values(next.combatants)) {
    const share = a.effects?.find((e) => e.attachShare);
    const b = before.combatants[a.id];
    if (!share || !b) continue;
    const lost = (b.hp + (b.tempHp ?? 0)) - (Math.max(0, a.hp) + (a.tempHp ?? 0));
    if (lost <= 0) continue;
    let left = lost;
    for (const [type, n] of takenByType(events, a.id, lost)) {
      const host = s.combatants[share.attachShare as string];
      if (!host || host.hp <= 0) break;
      const part = Math.min(n, left);
      left -= part;
      const adj = type ? adjustDamage(part, type, damageProfile(host)) : { amount: part, note: null };
      const amount = Math.max(0, adj.amount);
      const fx = damageEffects(host, amount, type, false, () => 0.5);
      push([{ type: 'effect_tick', targetId: host.id, effectId: share.id, name: `${a.name}: paylaşılan hasar`, damageRolls: [], appliedDamage: amount, damageType: type, targetHpAfter: fx.hpAfter, effects: fx.effects }]);
    }
  }
  for (const host0 of Object.values(s.combatants)) {
    for (const e of host0.effects ?? []) {
      if (!e.attachedBy) continue;
      const host = s.combatants[host0.id] as Combatant;
      const a = s.combatants[e.attachedBy];
      const end = (): void => push([{ type: 'effect_ended', targetId: host.id, effectId: e.id, name: e.name, reason: 'expired' }]);
      if (!a || a.hp <= 0 || a.summon?.gone || a.offFloor || host.life === 'dead' || host.offFloor || !a.pos || !host.pos) { end(); continue; }
      if (distance(a.pos, host.pos) <= 1) continue;
      const to = followSpot(s, a, host);
      if (!to) { end(); continue; }
      push([{ type: 'teleported', actorId: a.id, from: a.pos, to, label: 'yapışık: hedefle birlikte' }]);
    }
  }
  // Yapışması biten Cloaker'ın paylaşım etkisi kalkar.
  for (const a of Object.values(s.combatants)) {
    const share = a.effects?.find((e) => e.attachShare);
    if (share && !s.combatants[share.attachShare as string]?.effects?.some((e) => e.attachedBy === a.id)) {
      push([{ type: 'effect_ended', targetId: a.id, effectId: share.id, name: share.name, reason: 'expired' }]);
    }
  }
  return out;
});
