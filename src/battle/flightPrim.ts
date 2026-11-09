/**
 * Kuyruk U1a (kural sürümü 61+; `harita/belgeler/UCUS-ENVANTER.md`): uçuş kademelerinin tek çözücüsü. Ek paket `ucus`
 * ilkeli ve Celestial Kırık Kanat'ın `data/celestial.json` `ucus` bloğu aynı parametreleri kullanır (JSON'da; kodda sabit
 * yok):
 * - `hizFt` (formül ya da "yurume") ya da `hizCarpani` (yürüme hızı × çarpan, 5'in katına aşağı; varsayılan 1);
 * - `azamiIrtifaFt` (yaratık başına irtifa sınırı; yoksa haritanın sınırı) → etkide `flyCapFt`;
 * - `sureDakika` (1 dk = 10 tur; yoksa `sure` tur ya da "kalici");
 * - `yeredegmez` (süzülme) → etkide `hover` (`flight.ts` `hovers`, `groundBound`);
 * - `zorunluInis` (uçuş yalnız kendi turunda; tur sonunda biter, havadaysa düşer) → ana etkide `pkGlide`, alt etki
 *   `<ana>:kanat` kendi turunun başında eklenir, sonunda kalkar;
 * - `seviyeEsigi` + `esikSonrasi` (seviye eşiğinden sonra üste yazılan parametreler).
 * Kullanım sayısı (`kullanim`) içerik katmanında örtük kaynak olur (`content/ilkelSema.ts` `kullanimKaynak`). Saf.
 */
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

export const U1A_VERSION = 61;
export const u1aOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= U1A_VERSION;

type P = Record<string, unknown>;
const isObj = (x: unknown): x is P => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Seviye eşiğine göre geçerli parametreler (`esikSonrasi` üste yazılır). */
export function ucusAt(p: P, level: number): P {
  if (typeof p.seviyeEsigi !== 'number' || level < p.seviyeEsigi || !isObj(p.esikSonrasi)) return p;
  return { ...p, ...p.esikSonrasi };
}

/** Uçuş hızı (ft): `hizFt` (formül; "yurume" yürüme hızı), yoksa yürüme hızı × `hizCarpani` (5'in katına aşağı). */
export function ucusHiz(p: P, speed: number, num: (v: unknown) => number): number {
  if (p.hizFt !== undefined && p.hizFt !== 'yurume') return num(p.hizFt);
  const k = typeof p.hizCarpani === 'number' ? p.hizCarpani : 1;
  return Math.max(0, Math.floor((speed * k) / 5) * 5);
}

/** Süre (tur): `sureDakika` × 10, yoksa `sure` (tur); "kalici" ya da yoksa null (süresiz). */
export function ucusRounds(p: P): number | null {
  if (typeof p.sureDakika === 'number') return Math.max(1, Math.round(p.sureDakika * 10));
  return typeof p.sure === 'number' ? p.sure : null;
}

/**
 * Süren etki gövdesi. Zorunlu inişte uçuş ana etkide değil (`pkGlide` = hız; alt etki kendi turunda uçurur); değilse
 * `fly`. Sınır ve süzülme her iki durumda da taşınır (alt etkiye kopyalanır).
 */
export function ucusBody(p: P, speed: number, num: (v: unknown) => number): Partial<ActiveEffect> {
  const ft = ucusHiz(p, speed, num);
  const extra: Partial<ActiveEffect> = {
    ...(typeof p.azamiIrtifaFt === 'number' ? { flyCapFt: p.azamiIrtifaFt } : {}),
    ...(p.yeredegmez === true ? { hover: true as const } : {}),
  };
  return p.zorunluInis === true ? { pkGlide: ft, ...extra } : { fly: ft, ...extra };
}

/** Zorunlu inişin alt etkisi (kendi turunda uçuş). */
export const glideSubId = (parentId: string): string => `${parentId}:kanat`;
export function glideSubEvent(targetId: string, parent: ActiveEffect, round: number): BattleEvent {
  return {
    type: 'effect_added', targetId,
    effect: {
      id: glideSubId(parent.id), name: parent.name, sourceId: parent.sourceId, until: parent.until ?? round, fly: parent.pkGlide as number, icon: parent.icon ?? '🪶',
      ...(parent.flyCapFt !== undefined ? { flyCapFt: parent.flyCapFt } : {}), ...(parent.hover ? { hover: true as const } : {}),
    },
  };
}

/** Tur başı (sürüm 61+): zorunlu inişli uçuş etkisi sürüyorsa alt etki (uçuş) açılır. */
export function glideTurnStartEvents(state: BattleState, id: string): BattleEvent[] {
  if (!u1aOn(state)) return [];
  const c = state.combatants[id];
  if (!c?.effects?.length) return [];
  const out: BattleEvent[] = [];
  for (const e of c.effects) {
    if (!e.pkGlide || c.effects.some((x) => x.id === glideSubId(e.id))) continue;
    out.push(glideSubEvent(id, e, state.round));
  }
  return out;
}

/** Tur sonu (sürüm 61+): zorunlu inişin alt etkisi biter (havadaysa komut sonunda düşer: `altitude.ts`). */
export function glideTurnEndEvents(state: BattleState, id: string): BattleEvent[] {
  if (!u1aOn(state)) return [];
  const c: Combatant | undefined = state.combatants[id];
  if (!c?.effects?.length) return [];
  const out: BattleEvent[] = [];
  for (const e of c.effects) {
    if (!e.pkGlide) continue;
    const sub = c.effects.find((x) => x.id === glideSubId(e.id));
    if (sub) out.push({ type: 'effect_ended', targetId: id, effectId: sub.id, name: sub.name, reason: 'turn' });
  }
  return out;
}
