/**
 * Kuyruk K67b (kural sürümü 51): Dancing Lights (SRD 5.2.1): "up to four torch-size lights within range … Alternatively,
 * you combine the four lights into one glowing Medium form … each light sheds Dim Light in a 10-foot radius. As a Bonus
 * Action, you can move the lights up to 60 feet to a space within range. A light must be within 20 feet of another light
 * created by this spell, and a light vanishes if it exceeds the spell's range."
 *
 * Alanın altıgenleri ışık noktalarıdır (en çok `lightPoints`; birleşik biçim tek nokta, ad "(birleşik)"); loş ışık alan
 * kuralından (`lightDim` 2, parlak yok). Yeni olay yok: yerleştirme `zone_created`, taşıma ve sönme `zone_moved` /
 * `zone_ended`. Denetim (motor ve seçici) tek fonksiyonda (`danceProblem`). Saf.
 */
import { axialToOffset, distance, isInside, offsetToAxial, sameHex, type Offset } from '../rules/hex';
import { mechanicsAt } from './spellVersion';
import { ruleVersion } from './ruleVersion';
import { spells, type Spell } from '../data';
import type { BattleEvent, BattleState, Combatant, SpellZone } from './types';

/** Işıklar arası bağ: "within 20 feet of another light" (4 altıgen). */
export const DANCE_LINK_HEXES = 4;
export const DANCE_COMBINED = 'birlesik';

const sizeOf = (state: BattleState) => ({ cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 });

/** Büyünün sürüm 51+ ışık noktası sayısı (Dancing Lights 4; yoksa 0). */
export const danceMax = (state: Pick<BattleState, 'kuralSurumu'>, spell: Spell | undefined): number =>
  spell && ruleVersion(state) >= 51 ? mechanicsAt(state, spell).lightPoints ?? 0 : 0;

/** Birleşik biçim mi (alan adı; sürüm 51). */
export const isCombined = (z: SpellZone): boolean => z.name.endsWith('(birleşik)');

/**
 * Işık noktalarının sorunu (yoksa null): 1–N nokta, harita içinde, farklı altıgenler, her biri büyücüden menzilde ve
 * (birden çoksa) her biri başka bir ışığın 20 ft içinde. `from` büyücünün yeri (taşımada da aynı).
 */
export function danceProblem(state: BattleState, actor: Combatant, spell: Spell, points: Offset[], combined = false): string | null {
  const max = combined ? 1 : danceMax(state, spell);
  if (!points.length) return `${spell.name}: ışık için bir altıgen seç.`;
  if (points.length > max) return combined ? `${spell.name}: birleşik biçim tek ışıktır.` : `${spell.name}: en çok ${max} ışık.`;
  const size = sizeOf(state);
  for (const [i, p] of points.entries()) {
    if (!isInside(p, size)) return `${spell.name}: ışık harita dışında.`;
    if (points.some((q, j) => j < i && sameHex(p, q))) return `${spell.name}: iki ışık aynı altıgende olamaz.`;
    if (!actor.pos || distance(actor.pos, p) * 5 > spell.rangeFt) return `${spell.name}: ışık menzil dışında (${spell.rangeFt} ft).`;
  }
  if (points.length > 1) {
    const loose = points.find((p) => !points.some((q) => !sameHex(p, q) && distance(p, q) <= DANCE_LINK_HEXES));
    if (loose) return `${spell.name}: her ışık başka bir ışığın ${DANCE_LINK_HEXES * 5} ft içinde olmalı.`;
  }
  return null;
}

/** Seçicide eklenecek noktanın sorunu: eklenince sayı ve menzil; bağ kuralı yalnızca tamamlanınca (önizleme) denetlenir. */
export function danceAddProblem(state: BattleState, actor: Combatant, spell: Spell, points: Offset[], h: Offset, combined = false): string | null {
  const max = combined ? 1 : danceMax(state, spell);
  if (points.length >= max) return combined ? `${spell.name}: birleşik biçim tek ışıktır.` : `${spell.name}: en çok ${max} ışık.`;
  const why = danceProblem(state, actor, spell, [...points, h], combined);
  // Bağ kuralı: yeni nokta seçilmişlerden birine 20 ft içinde değilse hemen söylenir (ilk nokta serbest).
  return why && !why.includes(`${DANCE_LINK_HEXES * 5} ft`) ? why
    : points.length && !points.some((q) => distance(q, h) <= DANCE_LINK_HEXES) ? `${spell.name}: her ışık başka bir ışığın ${DANCE_LINK_HEXES * 5} ft içinde olmalı.` : null;
}

/**
 * Taşıma (bonus eylem; `spell_followup`): `points` verilirse her ışık sırayla kendi yeni yerine (her biri en çok 60 ft),
 * yoksa bütün ışıklar `to`'ya aynı ötelemeyle (ilk ışık `to`'ya). Sonuç `danceProblem`'dan geçmeli.
 */
export function danceMoveHexes(state: BattleState, actor: Combatant, spell: Spell, z: SpellZone, to: Offset | undefined, points: Offset[] | undefined): Offset[] | string {
  const ft = mechanicsAt(state, spell).repeat?.moveZoneFt ?? 60;
  const old = z.hexes;
  let next: Offset[];
  if (points?.length) {
    if (points.length !== old.length) return `${spell.name}: ${old.length} ışığın her biri için yeni yer seç.`;
    const far = points.findIndex((p, i) => distance(old[i] as Offset, p) * 5 > ft);
    if (far >= 0) return `${spell.name}: ışık en çok ${ft} ft taşınır.`;
    next = points;
  } else {
    const from = old[0];
    if (!to || !from) return `${spell.name}: taşımak için bir altıgen seç.`;
    if (distance(from, to) * 5 > ft) return `${spell.name}: ışık en çok ${ft} ft taşınır.`;
    // Eksenel öteleme (biçim korunur; `shiftZoneEvents` ile aynı).
    const a = offsetToAxial(from); const b = offsetToAxial(to);
    next = old.map((h) => { const x = offsetToAxial(h); return axialToOffset({ q: x.q + b.q - a.q, r: x.r + b.r - a.r }); });
  }
  return danceProblem(state, actor, spell, next, isCombined(z)) ?? next;
}

/** Komut sonu: büyücünün menzilinden çıkan ışık söner (son ışık sönerse büyü biter; konsantrasyon motorda biter). */
export function danceCleanupEvents(state: BattleState): BattleEvent[] {
  if (ruleVersion(state) < 51 || !state.map?.zones?.length) return [];
  const out: BattleEvent[] = [];
  for (const z of state.map.zones) {
    const sp = spells.find((s) => s.id === z.spellId);
    if (!danceMax(state, sp) || !sp) continue;
    const caster = state.combatants[z.casterId];
    const keep = caster?.pos ? z.hexes.filter((h) => distance(caster.pos as Offset, h) * 5 <= sp.rangeFt) : [];
    if (keep.length === z.hexes.length) continue;
    out.push(keep.length ? { type: 'zone_moved', zoneId: z.id, hexes: keep, center: keep[0] } : { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'expired' });
  }
  return out;
}
