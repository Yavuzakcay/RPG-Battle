/**
 * Kuyruk K71b (kural sürümü 57+; `harita/belgeler/K71-PLAN.md` §4.1, K68 karar 9 geri alındı): herkes için duvara tırmanma.
 *
 * - **Kim:** uçmayan, süzülmeyen ve tırmanma hızı olmayan herkes ("Çeviklik tırmanıcısı"). Tırmanma hızı olan (Spider Climb,
 *   `climber`, Roving) K68b kuralıyla zarsız ve ek maliyetsiz tırmanır (`altitude.ts` `climbMove`).
 * - **Yüzey:** bitişik, geçilmez, tepesi bilinen (`obstacleTopFt` sonlu) ve tırmanılabilir engel (`data/dikey.json` `tirmanma`:
 *   sınıf kaba DC 10 / duvar DC 12 / pürüzsüz DC 15, çarpan 2/2/3; `tirmanilmaz` listesi). Tavana tutunma yok.
 * - **Zar:** tırmanışa başlarken (yerden ilk yükseliş) bir kez Çeviklik kontrolü: d20 + DEX değiştiricisi (beceri yetkinliği yok;
 *   Akrobasi değil). Tutmazsa düşme yok; yerinde kalır, o tırmanış adımının (5 ft) hareketi (çarpan altıgen) yanar.
 * - **Maliyet:** 5 ft dikey ya da duvarda bir altıgen = çarpan altıgen. Duvar tepesine (engel tepesi) dek; tepede DURULMAZ
 *   (K5): yalnız üstünden öte yana geçilir (`movement.ts`), sonra inilir.
 * Saf; zar `rng` ile (zar defteri ve replay aynen).
 */
import dikeyData from '../../data/dikey.json';
import { isIncapacitated, speedZero } from '../rules/conditions';
import { rollD20, rollTag, type Rng } from '../rules/dice';
import { neighbors, type Offset } from '../rules/hex';
import { ALT, altitudeCapFt, altitudeOf, ceilingOver } from './altitude';
import { bodyAt, isMultiHex53 } from './body';
import { fail, finish, type CommandResult } from './common';
import { obstacleTopFt } from './cover';
import { finishCheck } from './effectDice';
import { climbs, effectSpeedZero, fliesOrHovers } from './flight';
import { terrainAt } from './movement';
import { objectAt } from './objectData';
import { speedHexes } from './reduce';
import { checkBase, ruleVersion } from './ruleVersion';
import { spells } from '../data';
import { dikeyOf } from './vertical';
import type { BattleEvent, BattleState, Combatant } from './types';
import type { TerrainType } from '../map/terrain';

/** Kuyruk K71b: herkes için tırmanmanın kural sürümü. */
export const CLIMB_VERSION = 57;
export const climbOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(s) >= CLIMB_VERSION;

interface ClimbClass { dc: number; carpan: number; tr: string; en: string }
const T = dikeyData.tirmanma;
export const CLIMB_CLASSES = T.siniflar as Record<string, ClimbClass>;
type Table = 'harf' | 'nesne' | 'buyu' | 'engel';
const MAP: Record<Table, Record<string, string>> = { harf: T.harf, nesne: T.nesne, buyu: T.buyu, engel: T.engel };
const NO: Record<Table, Set<string>> = {
  harf: new Set(T.tirmanilmaz.harf), nesne: new Set(T.tirmanilmaz.nesne), buyu: new Set(T.tirmanilmaz.buyu), engel: new Set(T.tirmanilmaz.engel),
};
const pick = (table: Table, key: string | undefined): string | null => (!key || NO[table].has(key) ? null : MAP[table][key] ?? null);

/** Tırmanılabilir yüzey (sınıf, DC, çarpan, tepe). */
export interface ClimbSurface { sinif: string; dc: number; carpan: number; topFt: number; hex: Offset }

const same = (a: Offset, b: Offset): boolean => a.col === b.col && a.row === b.row;

/** Altıgendeki engelin yüzey sınıfı (yoksa ya da tırmanılmazsa null). */
function surfaceClass(state: BattleState, h: Offset): string | null {
  for (const z of state.map?.zones ?? []) {
    if (z.surface || !z.hexes.some((x) => same(x, h))) continue;
    if (z.cage) return null;
    if (z.barrier?.blocksMove) return pick('engel', z.barrier.kind);
    const zone = spells.find((s) => s.id === z.spellId)?.mechanics.zone;
    if (zone?.solid) return pick('buyu', z.spellId);
    if (zone?.occupy) return null;
  }
  const obj = state.map?.objects?.length ? objectAt(state, h) : undefined;
  if (obj) return pick('nesne', obj.kind);
  const ch = state.map?.tiles[h.row]?.[h.col];
  const over = ch ? dikeyOf(state)?.yuzey?.[ch] : undefined;
  if (over) return over === 'tirmanilmaz' ? null : (CLIMB_CLASSES[over] ? over : null);
  return pick('harf', ch);
}

/** Altıgendeki tırmanılabilir yüzey (sürümden bağımsız okuma; çağıran sürümü denetler). */
export function surfaceAt(state: BattleState, h: Offset, t: TerrainType = terrainAt(state, h)): ClimbSurface | null {
  if (t.movement !== 'blocked' || t.outOfBounds || t.flyersPass) return null;
  const top = obstacleTopFt(state, h, t);
  if (!Number.isFinite(top) || top <= 0) return null;
  const sinif = surfaceClass(state, h);
  const k = sinif ? CLIMB_CLASSES[sinif] : undefined;
  return sinif && k ? { sinif, dc: k.dc, carpan: k.carpan, topFt: Math.min(top, ALT.maxFt), hex: h } : null;
}

/** Çeviklik tırmanıcısı (sürüm 57+): uçmayan, süzülmeyen, tırmanma hızı olmayan. */
export const dexClimber = (state: BattleState, c: Combatant): boolean => climbOn(state) && !fliesOrHovers(c) && !climbs(c, state);

const gridOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });

/** Yaratığın (gövdesinin) bitişiğindeki tırmanılabilir yüzeyler. */
export function surfacesNear(state: BattleState, c: Combatant, at: Offset | null = c.pos): ClimbSurface[] {
  if (!at || !state.map) return [];
  const size = gridOf(state);
  const body = isMultiHex53(state, c) ? bodyAt(state, c, at) : [at];
  const out: ClimbSurface[] = [];
  const seen = new Set<string>();
  for (const b of body) for (const n of neighbors(b, size)) {
    const k = `${n.col},${n.row}`;
    if (seen.has(k) || body.some((x) => same(x, n))) continue;
    seen.add(k);
    const s = surfaceAt(state, n);
    if (s) out.push(s);
  }
  return out;
}

/** İrtifadaki tırmanıcının tutunduğu en kolay yüzey (tepesi en az irtifa kadar); yoksa null. */
export function holdSurface(state: BattleState, c: Combatant, at: Offset | null = c.pos, alt = altitudeOf(c)): ClimbSurface | null {
  const ok = surfacesNear(state, c, at).filter((s) => s.topFt >= alt);
  return ok.sort((a, b) => a.carpan - b.carpan || a.dc - b.dc)[0] ?? null;
}

/** Tırmanma kontrolünün başarı olasılığı (d20 + DEX ≥ DC; avantaj sayılmaz). */
export const climbOdds = (c: Combatant, dc: number): number => Math.max(0, Math.min(1, (21 - dc + c.modifiers.dex) / 20));

/** Çeviklik kontrolü (yetkinliksiz): `map_effect` (kural `climb`), zar olayda. */
export function climbCheckEvent(state: BattleState, c: Combatant, dc: number, what: string, rng: Rng): Extract<BattleEvent, { type: 'map_effect' }> {
  const ab = 'dex';
  const adv = !!c.effects?.some((e) => e.checkAdv?.includes(ab));
  const dis = !!c.effects?.some((e) => e.checkDis?.includes(ab));
  const base0 = adv && !dis ? 'advantage' : dis && !adv ? 'disadvantage' : 'normal';
  const mode = checkBase(state, c, base0);
  const bonus = c.modifiers.dex;
  const d = rollD20(mode, rollTag(rng, { by: c.id, kind: 'check', bonus }));
  const r = finishCheck(c, ab, d.kept, bonus, dc, mode, rng);
  return { type: 'map_effect', rule: 'climb', targetId: c.id, text: what,
    roll: { label: 'Çeviklik', dc, d20: d.rolls, natural: d.kept, total: r.total, success: r.total >= dc, mode },
    ...(r.extra.length ? { bonusDice: r.extra } : {}) };
}

const cannotHold = (c: Combatant): boolean => c.conditions.includes('Prone') || isIncapacitated(c.conditions) || speedZero(c.conditions) || effectSpeedZero(c);

/** İrtifadaki Çeviklik tırmanıcısı duvarda tutunuyor mu (Prone/Incapacitated/hız 0 düşürür; tavana tutunmaz). */
export function dexClimberHolds(state: BattleState, c: Combatant): boolean {
  if (!c.pos || cannotHold(c)) return false;
  return holdSurface(state, c) !== null;
}

/** Çeviklik tırmanıcısının dikey hareketi (`vertical_move`, sürüm 57+). */
export function dexClimbMove(state: BattleState, actor: Combatant, from: number, to: number, rng: Rng): CommandResult {
  if (!actor.pos) return fail('Hedef bulunamadı.');
  if (from < 0) return fail('Yarıktan çıkmak için yarık tırmanışını kullan.');
  if (cannotHold(actor)) return fail('Tırmanamaz: hızı 0, Prone ya da Incapacitated.');
  const near = surfacesNear(state, actor);
  if (!near.length) return fail('Tırmanılacak yüzey yok (bitişikte tepesi bilinen, tırmanılabilir engel olmalı).');
  const capTop = Math.max(...near.map((s) => s.topFt));
  const cap = ceilingOver(state, actor) === null ? capTop : Math.min(capTop, altitudeCapFt(state, actor));
  if (to > cap) return fail(`Engel tepesi ${cap} ft: daha yükseğe tırmanılmaz.`);
  // Yükselişte hedef irtifaya uzanan en kolay yüzey; inişte şimdiki irtifada tutunulan.
  const s = holdSurface(state, actor, actor.pos, Math.max(from, to));
  if (!s) return fail('Bu irtifada tutunacak yüzey yok.');
  const d = Math.abs(to - from);
  const cost = (d / ALT.stepFt) * s.carpan;
  const left = speedHexes(actor) - actor.movementUsed;
  if (cost > left) return fail(`Yeterli hareket yok (${d} ft tırmanma = ${cost} altıgen).`);
  const events: BattleEvent[] = [];
  if (from <= 0 && to > 0) {
    const check = climbCheckEvent(state, actor, s.dc, `${actor.name} tırmanmaya başlıyor (${CLIMB_CLASSES[s.sinif]?.tr ?? s.sinif}, DC ${s.dc})`, rng);
    if (!check.roll?.success) {
      const burn = Math.min(left, s.carpan);
      return finish(state, [{ ...check, text: `${check.text}: tutunamadı (yerinde kaldı, ${burn} altıgen hareket yandı)`, burnMove: burn }]);
    }
    events.push(check);
  }
  events.push({ type: 'altitude_changed', targetId: actor.id, altitudeFt: to, label: to > from ? 'Tırmanma' : 'İniş (tırmanarak)', cost, byId: actor.id, gentle: false, ...(to > 0 ? { climb: true as const } : {}) });
  return finish(state, events);
}

/** Arayüz ve YZ: yerdeki Çeviklik tırmanıcısının tırmanma bilgisi (DC, çarpan, tepe) ya da null. */
export function climbStartInfo(state: BattleState, c: Combatant): { dc: number; carpan: number; topFt: number; sinif: string } | null {
  if (!dexClimber(state, c) || !c.pos || altitudeOf(c) !== 0 || cannotHold(c)) return null;
  const near = surfacesNear(state, c);
  if (!near.length) return null;
  const best = [...near].sort((a, b) => a.dc - b.dc || a.carpan - b.carpan)[0] as ClimbSurface;
  return { dc: best.dc, carpan: best.carpan, topFt: Math.max(...near.map((s) => s.topFt)), sinif: best.sinif };
}
