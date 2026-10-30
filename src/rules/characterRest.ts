/**
 * Karakterin savaşlar arası durumu ve dinlenme (Görev N): kalan HP, harcanan HP zarı (Hit Point Dice), sınıf
 * kaynakları ve büyü slotları. Savaş bitince kaydedilir; bir sonraki savaş bu durumla başlar. Kısa dinlenme HP zarı
 * harcatır ve kısa dinlenmede yenilenen kaynakları (Second Wind'den biri, Action Surge, Warlock slotları…) doldurur;
 * uzun dinlenme her şeyi doldurur, harcanan HP zarlarının yarısını geri verir (SRD 5.2.1 "Resting").
 * Saf fonksiyonlar; zar `rng` ile.
 */
import { lineageOf } from './lineage';
import { featResources } from './backgrounds';
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
  /**
   * H-SLOT: kayıt anındaki en çok slotlar. Harcanan = `slotMax − slots`; seviye ya da sınıf değişince yeni tablodan
   * yalnızca harcanan düşer (kazanılan slotlar dolu gelir). Eski kayıtlarda yok: açılışta `repairSlots` tamamlar.
   */
  slotMax?: number[];
  /**
   * Görev K10: kayıt anındaki kaynak en çokları ve HP en çoğu (H-SLOT kalıbı). Harcanan = en çok − kalan; seviye ya da
   * sınıf değişince yeni en çoktan yalnızca harcanan düşer (kaynak 0'da ya da eski en çokta takılmaz). Eski kayıtlarda
   * yok: açılışta `repairSlots` tamamlar.
   */
  resourceMax?: Record<string, number>;
  hpMax?: number;
  /** Savaşta öldü: dinlenme diriltmez. */
  dead?: boolean;
  /** Görev S1: bitkinlik seviyesi (yoksa 0); uzun dinlenme 1 azaltır. */
  exhaustion?: number;
}

/** Dinlenmiş (tam) durum. */
export function fullStatus(sheet: CharacterSheet): CharacterStatus {
  const d = deriveStats(sheet);
  // F1: feat kaynakları (Magic Initiate) da uzun dinlenmede dolar.
  const resources = { ...classResources(sheet.classId, sheet.level, d.modifiers, sheet.raceId, lineageOf(sheet)?.id, sheet.subclassId), ...featResources(sheet) };
  return { hp: d.maxHp, hitDiceSpent: 0, resources, slots: [...d.spellSlots], slotMax: [...d.spellSlots], resourceMax: { ...resources }, hpMax: d.maxHp };
}

/** Kayıtlı durum ya da (yoksa) tam durum; seviye/sınıf değiştiyse en çok değerlere kırpılır. */
export function currentStatus(sheet: CharacterSheet, status?: CharacterStatus): CharacterStatus {
  const full = fullStatus(sheet);
  if (!status) return full;
  const resources: Record<string, number> = {};
  for (const [id, max] of Object.entries(full.resources)) {
    const left = status.resources[id];
    // K10: en çok biliniyorsa yalnızca harcanan düşer; yeni kazanılan kaynak dolu gelir.
    const spent = left === undefined ? 0 : status.resourceMax ? Math.max(0, (status.resourceMax[id] ?? left) - left) : null;
    resources[id] = spent === null ? Math.min(max, Math.max(0, left ?? max)) : Math.max(0, max - spent);
  }
  // K10: HP de aynı kalıpla (seviye atlayınca alınan hasar kadar eksik; 0 HP'de kalan 0 kalır).
  const hp = status.hpMax !== undefined && status.hp > 0
    ? Math.max(1, full.hp - Math.max(0, status.hpMax - status.hp))
    : Math.min(full.hp, Math.max(0, status.hp));
  return {
    hp,
    hitDiceSpent: Math.min(sheet.level, Math.max(0, status.hitDiceSpent)),
    resources,
    slots: full.slots.map((n, i) => (status.slotMax
      ? Math.max(0, n - Math.max(0, (status.slotMax[i] ?? 0) - (status.slots[i] ?? 0)))
      : Math.min(n, Math.max(0, status.slots[i] ?? n)))),
    slotMax: full.slots,
    resourceMax: { ...full.resources },
    hpMax: full.hp,
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
  const r0 = shortRest(restState(sheet, s), dice, rng);
  // Görev WIZARD: Arcane Recovery (kaynak `arcaneRecovery`, uzun dinlenmede bir kez): toplamı seviyenin yarısını (yukarı)
  // aşmayan, 6. seviyenin altındaki slotlar en yüksekten başlayarak.
  const recovery = arcaneRecovery(sheet, s.resources, r0.state.spellSlots);
  // Görev DRUID: Natural Recovery (Circle of the Land) aynı kural, kendi kaynağıyla.
  const natural = arcaneRecovery(sheet, s.resources, recovery.slots, 'naturalRecovery');
  const r = { ...r0, state: { ...r0.state, spellSlots: natural.slots } };
  const max = fullStatus(sheet).resources;
  return {
    status: {
      hp: r.state.hp, hitDiceSpent: sheet.level - r.state.hitDiceLeft, slots: r.state.spellSlots, slotMax: s.slotMax ?? [], resourceMax: s.resourceMax ?? {}, hpMax: s.hpMax ?? r.state.hp,
      resources: sorcerousRestoration(sheet, rechargeResources({ ...s.resources, ...(recovery.used ? { arcaneRecovery: 0 } : {}), ...(natural.used ? { naturalRecovery: 0 } : {}) },
        max, 'short', sheet.level), max),
      ...(s.exhaustion ? { exhaustion: s.exhaustion } : {}),
    },
    rolls: r.rolls,
    healed: r.healed,
  };
}

/**
 * Görev WARLOCK: Magical Cunning (kaynak `magicalCunning`, uzun dinlenmede bir kez; savaş dışı 1 dakikalık ayin):
 * harcanmış Pact slotlarının yarısı (yukarı) geri gelir. Kullanılamıyorsa null.
 */
export function magicalCunningStatus(sheet: CharacterSheet, status: CharacterStatus | undefined): CharacterStatus | null {
  const s = currentStatus(sheet, status);
  const max = fullStatus(sheet).slots;
  if (s.dead || (s.resources.magicalCunning ?? 0) <= 0) return null;
  const i = max.findIndex((n) => n > 0);
  const spent = i < 0 ? 0 : (max[i] ?? 0) - (s.slots[i] ?? 0);
  if (spent <= 0) return null;
  const slots = [...s.slots];
  slots[i] = (slots[i] ?? 0) + Math.ceil(spent / 2);
  return { ...s, slots, resources: { ...s.resources, magicalCunning: 0 } };
}

/**
 * Görev SORCERER: Sorcerous Restoration (kaynak `sorcerousRestoration`, uzun dinlenmede bir kez): kısa dinlenmede seviyenin
 * yarısı (aşağı) kadar Sorcery Point; eksik puan yoksa kullanılmaz.
 */
export function sorcerousRestoration(sheet: CharacterSheet, resources: Record<string, number>, max: Record<string, number>): Record<string, number> {
  const points = resources.sorceryPoints ?? 0;
  if ((resources.sorcerousRestoration ?? 0) <= 0 || points >= (max.sorceryPoints ?? 0)) return resources;
  return { ...resources, sorcerousRestoration: 0, sorceryPoints: Math.min(max.sorceryPoints ?? 0, points + Math.floor(sheet.level / 2)) };
}

/** Görev WIZARD: Arcane Recovery'nin geri verdiği slotlar (kaynak yoksa ya da eksik slot yoksa aynı). */
export function arcaneRecovery(sheet: CharacterSheet, resources: Record<string, number>, slots: number[], resource = 'arcaneRecovery'): { slots: number[]; used: boolean } {
  if ((resources[resource] ?? 0) <= 0) return { slots, used: false };
  const max = deriveStats(sheet).spellSlots;
  let budget = Math.ceil(sheet.level / 2);
  const out = [...slots];
  for (let lv = 5; lv >= 1; lv--) {
    while (budget >= lv && (out[lv - 1] ?? 0) < (max[lv - 1] ?? 0)) { out[lv - 1] = (out[lv - 1] ?? 0) + 1; budget -= lv; }
  }
  const used = out.some((n, i) => n !== slots[i]);
  return { slots: used ? out : slots, used };
}

/** Uzun dinlenme: HP, slotlar ve bütün kaynaklar dolar; harcanan HP zarlarının yarısı (en az 1) geri gelir. */
export function longRestStatus(sheet: CharacterSheet, status: CharacterStatus | undefined): CharacterStatus {
  const s = currentStatus(sheet, status);
  if (s.dead) return s;
  const r = longRest(restState(sheet, s));
  return {
    hp: r.hp, hitDiceSpent: sheet.level - r.hitDiceLeft, slots: r.spellSlots, slotMax: s.slotMax ?? [], resourceMax: s.resourceMax ?? {}, hpMax: s.hpMax ?? r.hp,
    resources: rechargeResources(s.resources, fullStatus(sheet).resources, 'long', sheet.level),
    // Bitkinlik (SRD 5.2.1): uzun dinlenme 1 seviye azaltır.
    ...(exhaustionAfterLongRest(s.exhaustion) > 0 ? { exhaustion: exhaustionAfterLongRest(s.exhaustion) } : {}),
  };
}

/**
 * H-SLOT: eski kayıtlarda slot en çoğu (`slotMax`) yok; kayıtlı kalan slotlar başka sınıf ya da seviyeye aitse yarım
 * büyücü (Ranger, Paladin) savaşa slotsuz giriyordu. Açılışta bir kez: `slotMax`ı olmayan durumda slotlar sınıf ve
 * seviyenin tablosuna tamamlanır. Döner: düzeltilen karakterlerin adları (slotu eksik olanlar; bir kerelik not).
 */
export function repairSlots<T extends { sheet: CharacterSheet; status?: CharacterStatus }>(list: T[]): { list: T[]; repaired: string[] } {
  const repaired: string[] = [];
  const needs = (s: CharacterStatus | undefined) => !!s && (!s.slotMax || !s.resourceMax || s.hpMax === undefined);
  const out = list.map((c) => {
    if (!c.status || !needs(c.status)) return c;
    let full: CharacterStatus;
    try { full = fullStatus(c.sheet); } catch { return c; }
    let status = c.status;
    let changed = false;
    if (!status.slotMax) {
      changed ||= full.slots.some((n, i) => (status.slots[i] ?? 0) < n);
      status = { ...status, slots: [...full.slots], slotMax: [...full.slots] };
    }
    // K10: eski kayıtta kaynak en çoğu yok; kalanı başka seviyeye ait olabilir: kaynaklar tabloya tamamlanır (H-SLOT gibi).
    if (!status.resourceMax) {
      const res = full.resources;
      changed ||= Object.entries(res).some(([id, n]) => (status.resources[id] ?? n) < n);
      status = { ...status, resources: { ...res }, resourceMax: { ...res } };
    }
    // HP en çoğu: kayıttaki HP olduğu gibi kalır (hasar bilinmiyor), en çok bugünkü tablo.
    if (status.hpMax === undefined) status = { ...status, hpMax: full.hp, hp: Math.min(full.hp, status.hp) };
    if (changed) repaired.push(c.sheet.name);
    return { ...c, status };
  });
  return { list: list.some((c) => needs(c.status)) ? out : list, repaired };
}

