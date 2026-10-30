/**
 * Karakterin savaşlar arası durumu ve dinlenme (Görev N): kalan HP, harcanan HP zarı (Hit Point Dice), sınıf
 * kaynakları ve büyü slotları. Savaş bitince kaydedilir; bir sonraki savaş bu durumla başlar. Kısa dinlenme HP zarı
 * harcatır ve kısa dinlenmede yenilenen kaynakları (Second Wind'den biri, Action Surge, Warlock slotları…) doldurur;
 * uzun dinlenme her şeyi doldurur, harcanan HP zarlarının yarısını geri verir (SRD 5.2.1 "Resting").
 * Saf fonksiyonlar; zar `rng` ile.
 */
import { lineageOf } from './lineage';
import { getClass } from '../data';
import type { Rng } from './dice';
import { classResources, rechargeResources } from './classFeatures';
import { longRest, shortRest, type RestState } from './rest';
import { MAX_EXHAUSTION, exhaustionAfterLongRest } from './exhaustion';
import { deriveStats, type CharacterSheet } from './stats';

export interface CharacterStatus {
  hp: number;
  /** Harcanan HP zarı sayısı (en çok seviye kadar). */
  hitDiceSpent: number;
  /** Sınıf kaynaklarının kalan kullanımları. */
  resources: Record<string, number>;
  /** Kalan büyü slotları (1.–9. seviye). */
  slots: number[];
  /** Savaşta öldü: dinlenme diriltmez. */
  dead?: boolean;
  /** Görev S1: bitkinlik seviyesi (yoksa 0); uzun dinlenme 1 azaltır. */
  exhaustion?: number;
}

/** Dinlenmiş (tam) durum. */
export function fullStatus(sheet: CharacterSheet): CharacterStatus {
  const d = deriveStats(sheet);
  return { hp: d.maxHp, hitDiceSpent: 0, resources: classResources(sheet.classId, sheet.level, d.modifiers, sheet.raceId, lineageOf(sheet)?.id), slots: [...d.spellSlots] };
}

/** Kayıtlı durum ya da (yoksa) tam durum; seviye/sınıf değiştiyse en çok değerlere kırpılır. */
export function currentStatus(sheet: CharacterSheet, status?: CharacterStatus): CharacterStatus {
  const full = fullStatus(sheet);
  if (!status) return full;
  const resources: Record<string, number> = {};
  for (const [id, max] of Object.entries(full.resources)) resources[id] = Math.min(max, Math.max(0, status.resources[id] ?? max));
  return {
    hp: Math.min(full.hp, Math.max(0, status.hp)),
    hitDiceSpent: Math.min(sheet.level, Math.max(0, status.hitDiceSpent)),
    resources,
    slots: full.slots.map((n, i) => Math.min(n, Math.max(0, status.slots[i] ?? n))),
    ...(status.dead ? { dead: true } : {}),
    ...((status.exhaustion ?? 0) > 0 ? { exhaustion: Math.min(MAX_EXHAUSTION, status.exhaustion ?? 0) } : {}),
  };
}

/** Durum tam mı (dinlenmeye gerek yok). */
export function isRested(sheet: CharacterSheet, status?: CharacterStatus): boolean {
  return JSON.stringify(currentStatus(sheet, status)) === JSON.stringify(fullStatus(sheet));
}

function restState(sheet: CharacterSheet, s: CharacterStatus): RestState {
  const d = deriveStats(sheet);
  return {
    hp: s.hp, maxHp: d.maxHp, level: sheet.level, hitDie: getClass(sheet.classId).hitDie,
    hitDiceLeft: sheet.level - s.hitDiceSpent, conMod: d.modifiers.con,
    spellSlots: s.slots, maxSpellSlots: d.spellSlots, pactMagic: getClass(sheet.classId).casting?.type === 'pact',
  };
}

export interface RestResult { status: CharacterStatus; rolls: number[]; healed: number }

/** Kısa dinlenme: `dice` kadar HP zarı (kalan kadar) harcanır; kısa dinlenmede yenilenen kaynaklar dolar. */
export function shortRestStatus(sheet: CharacterSheet, status: CharacterStatus | undefined, dice: number, rng: Rng): RestResult {
  const s = currentStatus(sheet, status);
  if (s.dead) return { status: s, rolls: [], healed: 0 };
  const r = shortRest(restState(sheet, s), dice, rng);
  const max = fullStatus(sheet).resources;
  return {
    status: {
      hp: r.state.hp, hitDiceSpent: sheet.level - r.state.hitDiceLeft, slots: r.state.spellSlots,
      resources: rechargeResources(s.resources, max, 'short', sheet.level),
      ...(s.exhaustion ? { exhaustion: s.exhaustion } : {}),
    },
    rolls: r.rolls,
    healed: r.healed,
  };
}

/** Uzun dinlenme: HP, slotlar ve bütün kaynaklar dolar; harcanan HP zarlarının yarısı (en az 1) geri gelir. */
export function longRestStatus(sheet: CharacterSheet, status: CharacterStatus | undefined): CharacterStatus {
  const s = currentStatus(sheet, status);
  if (s.dead) return s;
  const r = longRest(restState(sheet, s));
  return {
    hp: r.hp, hitDiceSpent: sheet.level - r.hitDiceLeft, slots: r.spellSlots,
    resources: rechargeResources(s.resources, fullStatus(sheet).resources, 'long', sheet.level),
    // Bitkinlik (SRD 5.2.1): uzun dinlenme 1 seviye azaltır.
    ...(exhaustionAfterLongRest(s.exhaustion) > 0 ? { exhaustion: exhaustionAfterLongRest(s.exhaustion) } : {}),
  };
}
