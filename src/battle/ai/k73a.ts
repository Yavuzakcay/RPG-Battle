/**
 * Kuyruk K73a (kural sürümü 62+; `harita/belgeler/K73A-DENETIM.md`): YZ'nin dikey taktiği için saf yardımcılar. Karar
 * yapıştırıcısı `ai.ts`'te (değerlendirici, kuru çalıştırma ve yer taramaları orada). Kural ve denge değişmez; yalnız karar.
 *
 * - Yaklaşma yol mesafesiyle: düşmana yürüyüş alanı (`climbAi.ts` `foeField`, çok kaynaklı ters Dijkstra). Düz altıgen
 *   mesafesi engel arkasındaki cepte yerel minimumda kalıyordu (Buzul — Kamp tohum 1 kilitlenmesi).
 * - Hava düzeyi: yerdeki yakın dövüşçülerin erişiminin hemen üstü (bant aralığı erişimi aşar), uçuşun kendi sınırı ve
 *   konsantrasyonlu uçuşta düşme riski sınırı (`data/yapay-zeka.json` `k73a`).
 * - İniş: uçuş bu tur bitiyorsa (süre, zorunlu iniş alt etkisi) ya da konsantrasyonlu uçuşta can eşiğin altındaysa.
 * - K8 yüksek zemin: altıgenin zemini + duruş yüksekliği (sur tepesi, kat) ile en yakın düşmanınki arasındaki fark.
 */
import aiData from '../../../data/yapay-zeka.json';
import dikeyData from '../../../data/dikey.json';
import { altitudeCapFt, altitudeOf } from '../altitude';
import { bandOf, heightLevels, levelOf, levelToFt } from '../cells';
import { flySpeed, fliesOrHovers, isAirborne } from '../flight';
import { meleeOf } from '../features';
import { moveCostFn, speedHexes } from '../movement';
import { landingFt, standAlt, standingOn } from '../stand';
import { bodyZeminFt } from '../vertical';
import { distance, hexKey, type Offset } from '../../rules/hex';
import { foeField } from './climbAi';
import type { BattleState, Combatant } from '../types';

export const K73A_VERSION = 62;
export const k73aOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= K73A_VERSION;

/** Parametreler (`data/yapay-zeka.json` `k73a`). */
export const K73A = (aiData as unknown as { k73a: { konsantrasyonUstFt: number; inisCanOrani: number; yuksekZeminPuan: number; surBasari: number; surMesafe: number } }).k73a;

// ------------------------------------------------------------------ yaklaşma (yol mesafesi)

const FIELD = new WeakMap<BattleState, Map<string, Map<string, number>>>();
/** Düşmanların yanına yürüyüş maliyeti alanı (altıgen → maliyet; erişilemeyen yok). Durum + yaratık başına önbellek. */
export function approachField(state: BattleState, actor: Combatant, foes: Combatant[]): (h: Offset) => number {
  let m = FIELD.get(state);
  if (!m) { m = new Map(); FIELD.set(state, m); }
  const key = `${actor.id}|${foes.map((f) => f.id).join(',')}`;
  let f = m.get(key);
  if (!f) {
    f = foeField(state, actor, foes.filter((x) => x.pos && x.hp > 0), moveCostFn(state, { ...actor, altitudeFt: isAirborne(actor) ? actor.altitudeFt : 0, climbing: undefined }));
    m.set(key, f);
  }
  const field = f;
  return (h) => field.get(hexKey(h)) ?? Infinity;
}

// ------------------------------------------------------------------ hava düzeyi

/** Uçuşu konsantrasyona bağlı mı (kendi uçuş hızı yok, uçuran etkilerin hepsi konsantrasyonlu). */
export function concentrationFlight(c: Combatant): boolean {
  if ((c.fly ?? 0) > 0) return false;
  const fx = (c.effects ?? []).filter((e) => (e.fly ?? 0) > 0);
  return fx.length > 0 && fx.every((e) => !!e.concentration);
}

/** Uçuş bu turun sonunda bitiyor mu: zorunlu iniş alt etkisi (Kırık Kanat, paket `zorunluInis`) ya da süre bu tur doluyor. */
export function flightEndsThisTurn(state: BattleState, c: Combatant): boolean {
  if ((c.fly ?? 0) > 0) return false;
  const fx = (c.effects ?? []).filter((e) => (e.fly ?? 0) > 0);
  if (!fx.length) return false;
  const lasting = fx.filter((e) => !(e.id === 'ev:celestial/glide' || e.id.endsWith(':kanat')) && (e.until === undefined || e.until > state.round));
  return lasting.length === 0;
}

/**
 * İnmesi gereken uçan (havada, bir duruş yüzeyinde değil): uçuş bu tur bitiyor ya da konsantrasyonlu uçuşta canı eşiğin
 * altında. İniş yüksekliği (alttaki en yüksek duruş yüzeyi) ya da null.
 */
export function landingWanted(state: BattleState, c: Combatant): number | null {
  const alt = altitudeOf(c);
  if (alt <= 0 || !c.pos || !fliesOrHovers(c) || standingOn(state, c) || c.climbing) return null;
  const low = concentrationFlight(c) && c.hp <= c.maxHp * K73A.inisCanOrani;
  if (!flightEndsThisTurn(state, c) && !low) return null;
  return landingFt(state, c.pos, alt);
}

/**
 * Menzilli uçanın yükselme irtifası (ft): kendisine bir sonraki turunda yetişebilecek, uçmayan yakın dövüşçü düşmanların
 * erişim bandının hemen üstü. Uçuş sınırı (kendi + harita) ve konsantrasyonlu uçuşta düşme riski sınırı aşılırsa ya da tehdit
 * yoksa null.
 */
export function riseFt(state: BattleState, actor: Combatant, foes: Combatant[]): number | null {
  if (!actor.pos || flySpeed(actor) <= 0) return null;
  const pos = actor.pos;
  let need = -1;
  for (const f of foes) {
    if (!f.pos || f.hp <= 0 || fliesOrHovers(f)) continue;
    const m = meleeOf(f);
    if (!m) continue;
    const r = Math.max(1, Math.floor(m.reachFt / 5));
    if (distance(f.pos, pos) > speedHexes(f) + r) continue;
    need = Math.max(need, bandOf(f).hi + r + 1);
  }
  if (need < 0) return null;
  const cap = Math.min(altitudeCapFt(state, actor), concentrationFlight(actor) ? K73A.konsantrasyonUstFt : Infinity);
  const ft = levelToFt(need);
  if (ft > cap || ft <= altitudeOf(actor)) return null;
  return ft;
}

/** Bitişik ya da erişimindeki bir düşman yükselmede fırsat saldırısı yapabilir mi (yaklaşık: yatay 2 altıgen içinde). */
export function engaged(actor: Combatant, foes: Combatant[]): boolean {
  if (!actor.pos) return false;
  const pos = actor.pos;
  return foes.some((f) => {
    if (!f.pos || f.hp <= 0) return false;
    const m = meleeOf(f);
    const r = m ? Math.max(1, Math.floor(m.reachFt / 5)) : 1;
    return distance(f.pos, pos) <= r;
  });
}

// ------------------------------------------------------------------ yüksek zemin (K8)

const HG_FT = (dikeyData as { yuksekZemin: { avantajFt: number } }).yuksekZemin.avantajFt;

/** Yaratığın K8 zemini (ft): altıgenin katman zemini + duruş yüksekliği (havadaysa null: K8 yok). */
export function groundOf(state: BattleState, c: Combatant, at: Offset = c.pos as Offset, alt: number = altitudeOf(c)): number | null {
  if (alt !== 0 && !standingOn(state, { pos: at, altitudeFt: alt })) return null;
  if (isAirborne(c) && alt === 0 && fliesOrHovers(c) && (c.fly ?? 0) <= 0 && c.effects?.some((e) => e.hover)) return null;
  return bodyZeminFt(state, c, at) + alt;
}

/** Saldırı yeri puanı için yüksek zemin indirimi: yerdeki menzilli için en yakın düşmanın zemininden ≥ 10 ft yüksek yer. */
export function highGroundBonus(state: BattleState, actor: Combatant, foes: Combatant[], at: Offset, alt: number): number {
  const mine = groundOf(state, actor, at, alt);
  if (mine === null) return 0;
  const near = foes.filter((f) => f.pos && f.hp > 0).sort((a, b) => distance(a.pos as Offset, at) - distance(b.pos as Offset, at))[0];
  if (!near?.pos) return 0;
  const theirs = bodyZeminFt(state, near, near.pos) + (standAlt(state, near) ?? altitudeOf(near));
  return mine - theirs >= HG_FT ? K73A.yuksekZeminPuan : 0;
}

/** Düzey yardımcısı (dışa açık; `ai.ts` ve testler). */
export const levelFt = (ft: number): number => levelToFt(levelOf(ft));
export const bodyLevels = heightLevels;
