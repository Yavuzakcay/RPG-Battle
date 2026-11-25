/**
 * Karakterin savaşlar arası durumu ve dinlenme (Görev N): kalan HP, harcanan HP zarı (Hit Point Dice), sınıf
 * kaynakları ve büyü slotları. Savaş bitince kaydedilir; bir sonraki savaş bu durumla başlar. Kısa dinlenme HP zarı
 * harcatır ve kısa dinlenmede yenilenen kaynakları (Second Wind'den biri, Action Surge, Warlock slotları…) doldurur;
 * uzun dinlenme her şeyi doldurur, harcanan HP zarlarının tamamını geri verir (SRD 5.2.1 s. 185 Long Rest; GENEL-SAVAS-DENETIM G5).
 * Saf fonksiyonlar; zar `rng` ile.
 */
import { gainedFeatures } from './classFeatures';
import { lineageOf } from './lineage';
import { featResources } from './backgrounds';
import { itemResources, rechargeItems } from './itemCharges';
import { getClass } from '../data';
import { classResources, depotStart, rechargeResources, resourceDef } from './classFeatures';
import { longRest, shortRest, type RestState } from './rest';
import { MAX_EXHAUSTION, exhaustionAfterLongRest } from './exhaustion';
import { deriveStats, type CharacterSheet } from './stats';
import { isMultiSheet, mcImpl } from './mcHook';
import type { Rng } from './dice';

export interface CharacterStatus {
  hp: number;
  /** Harcanan HP zarı sayısı (en çok seviye kadar). */
  hitDiceSpent: number;
  /**
   * Görev MC2 (SRD 5.2.1 s. 25 "Hit Point Dice"): çoklu sınıfta zar türü başına harcanan (farklı türler ayrı izlenir;
   * toplamı `hitDiceSpent`). Tek sınıfta ve hiç harcanmamışsa yazılmaz.
   */
  hitDiceSpentBy?: Partial<Record<6 | 8 | 10 | 12, number>>;
  /** Sınıf kaynaklarının kalan kullanımları. */
  resources: Record<string, number>;
  /** Kalan büyü slotları (1.–9. seviye). */
  slots: number[];
  /** Görev MC3: çoklu sınıfta ayrı Pact Magic havuzunda kalan yuva (SRD 5.2.1 s. 26). Tek sınıfta ve havuzsuzda yazılmaz. */
  pactSlots?: number;
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
  /**
   * Görev B93: kaynak başına kalan uzun dinlenme bekleme sayısı (Greater Divine Intervention: Wish'ten sonra 2d4 Long Rest).
   * Sayaç sürdükçe uzun dinlenme o kaynağı doldurmaz.
   */
  waits?: Record<string, number>;
  /** Savaşta öldü: dinlenme diriltmez. */
  dead?: boolean;
  /** Görev S1: bitkinlik seviyesi (yoksa 0); uzun dinlenme 1 azaltır. */
  exhaustion?: number;
  /** Kuyruk K48: Moral (ev kuralı; yoksa dolu). Dinlenmeler değiştirmez (kazanç Serüven katmanında). */
  moral?: number;
  /** Kuyruk K48: Moral 0'da savaş dışında öldü (diriltilince kalkar). */
  moralOlum?: true;
}

/** Kuyruk K48: Moral alanları olduğu gibi taşınır (yoksa yazılmaz; eski kayıt aynı). */
const moralPart = (s: CharacterStatus): Pick<CharacterStatus, 'moral' | 'moralOlum'> =>
  ({ ...(s.moral !== undefined ? { moral: s.moral } : {}), ...(s.moralOlum ? { moralOlum: true as const } : {}) });

/** Görev MC2: çoklu sınıfın can zarı havuzu (zar türü → sayı; aynı türler birleşir). Tek sınıfta null. */
export const hitDicePool = (sheet: CharacterSheet): Partial<Record<6 | 8 | 10 | 12, number>> | null =>
  (isMultiSheet(sheet) ? mcImpl().hitDicePool(sheet) : null);
/** Görev MC2: harcanan zarlar havuza kırpılır; boşsa yazılmaz (alan yok = hiç harcanmamış). Tek sınıfta yok. */
const spentByPart = (sheet: CharacterSheet, by: CharacterStatus['hitDiceSpentBy']): Pick<CharacterStatus, 'hitDiceSpentBy'> =>
  (isMultiSheet(sheet) ? mcImpl().spentBy(sheet, by) : {});

/** Görev MC3: ayrı Pact havuzu dinlenmede dolar (çoklu sınıf; havuz yoksa alan yazılmaz). */
const pactFill = (sheet: CharacterSheet, s: CharacterStatus): Pick<CharacterStatus, 'pactSlots'> =>
  (s.pactSlots === undefined ? {} : { pactSlots: fullStatus(sheet).pactSlots ?? s.pactSlots });

/** Dinlenmiş (tam) durum. */
export function fullStatus(sheet: CharacterSheet): CharacterStatus {
  const d = deriveStats(sheet);
  // F1: feat kaynakları (Magic Initiate) da uzun dinlenmede dolar.
  // Görev TE99: yüklü eşyaların yükü de durumda (SRD 5.2.1 s. 206 Charges; yenilenme `itemCharges.ts`).
  const resources = { ...classResources(sheet.classId, sheet.level, d.modifiers, sheet.raceId, lineageOf(sheet)?.id, sheet.subclassId), ...featResources(sheet), ...itemResources(sheet) };
  // Kuyruk P12: sayaç kaynağı (paket `yenilenme: depo`) dinlenmiş durumda başlangıç değerinde; en çok değer üst sınır.
  return { hp: d.maxHp, hitDiceSpent: 0, resources: depotStart(resources), slots: [...d.spellSlots], slotMax: [...d.spellSlots], resourceMax: { ...resources }, hpMax: d.maxHp,
    ...(d.pactSlots ? { pactSlots: d.pactSlots.count } : {}) };
}

/** Kayıtlı durum ya da (yoksa) tam durum; seviye/sınıf değiştiyse en çok değerlere kırpılır. */
export function currentStatus(sheet: CharacterSheet, status?: CharacterStatus): CharacterStatus {
  const full = fullStatus(sheet);
  if (!status) return full;
  const resources: Record<string, number> = {};
  for (const [id, max] of Object.entries(full.resourceMax ?? full.resources)) {
    const left = status.resources[id];
    // K10: en çok biliniyorsa yalnızca harcanan düşer; yeni kazanılan kaynak dolu gelir.
    const spent = left === undefined ? 0 : status.resourceMax ? Math.max(0, (status.resourceMax[id] ?? left) - left) : null;
    // Kuyruk P12: yeni kazanılan sayaç kaynağı (`depot`) başlangıç değeriyle gelir (`full.resources`; diğerlerinde en çok değer).
    resources[id] = left === undefined ? (full.resources[id] ?? max) : spent === null ? Math.min(max, Math.max(0, left)) : Math.max(0, max - spent);
  }
  // K10: HP de aynı kalıpla (seviye atlayınca alınan hasar kadar eksik; 0 HP'de kalan 0 kalır).
  const hp = status.hpMax !== undefined && status.hp > 0
    ? Math.max(1, full.hp - Math.max(0, status.hpMax - status.hp))
    : Math.min(full.hp, Math.max(0, status.hp));
  return {
    hp,
    hitDiceSpent: Math.min(sheet.level, Math.max(0, status.hitDiceSpent)),
    ...spentByPart(sheet, status.hitDiceSpentBy),
    resources,
    slots: pactShift(full.slots, status) ?? full.slots.map((n, i) => (status.slotMax
      // Görev B93: tablonun üstündeki yaratılmış slot (Font of Magic) uzun dinlenmeye dek kalır.
      ? Math.max(0, n - Math.max(0, (status.slotMax[i] ?? 0) - (status.slots[i] ?? 0))) + Math.max(0, (status.slots[i] ?? 0) - (status.slotMax[i] ?? 0))
      : Math.min(n, Math.max(0, status.slots[i] ?? n)))),
    slotMax: full.slots,
    resourceMax: { ...(full.resourceMax ?? full.resources) },
    hpMax: full.hp,
    // Görev MC3: ayrı Pact havuzu (çoklu sınıf); yoksa dolu.
    ...(full.pactSlots !== undefined ? { pactSlots: Math.min(full.pactSlots, Math.max(0, status.pactSlots ?? full.pactSlots)) } : {}),
    ...(status.dead ? { dead: true } : {}),
    ...((status.exhaustion ?? 0) > 0 ? { exhaustion: Math.min(MAX_EXHAUSTION, status.exhaustion ?? 0) } : {}),
    ...(status.waits && Object.keys(status.waits).length ? { waits: { ...status.waits } } : {}),
    ...moralPart(status),
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
    spellSlots: s.slots, maxSpellSlots: d.spellSlots, pactMagic: pactArray(sheet),
  };
}

/**
 * Slot dizisi Pact Magic mı (kısa dinlenmede dolar). Tek sınıfta sınıfın kendisi; Görev MC2: çoklu sınıfta dizi yalnız tek
 * büyücü Warlock'sa Pact'tir (başka Spellcasting sınıfı varken Pact ayrı havuzda: `pactSlots`, MC3).
 */
function pactArray(sheet: CharacterSheet): boolean {
  return isMultiSheet(sheet) ? mcImpl().pactArray(sheet) : getClass(sheet.classId).casting?.type === 'pact';
}

export interface RestResult { status: CharacterStatus; rolls: number[]; healed: number }

/** Kısa dinlenme: `dice` kadar HP zarı (kalan kadar) harcanır; kısa dinlenmede yenilenen kaynaklar dolar. */
export function shortRestStatus(sheet: CharacterSheet, status: CharacterStatus | undefined, dice: number, rng: Rng,
  /** Görev B93: slot kurtarma seçimi (kaynak → slot seviyeleri; null: kullanma; yoksa otomatik, en yüksekten). */ recover?: Record<string, number[] | null>): RestResult {
  const s = currentStatus(sheet, status);
  // GENEL-SAVAS-DENETIM G1 (SRD 5.2.1 s. 187): kısa dinlenmeye başlamak için en az 1 HP; 0 HP'de hiçbir kazanç yok.
  if (s.dead || s.hp < 1) return { status: s, rolls: [], healed: 0 };
  const r0 = isMultiSheet(sheet) ? mcImpl().shortRest(sheet, s, restState(sheet, s), dice, rng) : { ...shortRest(restState(sheet, s), dice, rng), spentBy: undefined };
  // Görev WIZARD: Arcane Recovery (kaynak `arcaneRecovery`, uzun dinlenmede bir kez): toplamı seviyenin yarısını (yukarı)
  // aşmayan, 6. seviyenin altındaki slotlar en yüksekten başlayarak. Görev B93: oyuncu seçer ya da ertelerse kullanılmaz.
  const recovery = arcaneRecovery(sheet, s.resources, r0.state.spellSlots, 'arcaneRecovery', recover?.arcaneRecovery);
  // Görev DRUID: Natural Recovery (Circle of the Land) aynı kural, kendi kaynağıyla.
  const natural = arcaneRecovery(sheet, s.resources, recovery.slots, 'naturalRecovery', recover?.naturalRecovery);
  const r = { ...r0, state: { ...r0.state, spellSlots: natural.slots } };
  const max = fullStatus(sheet).resourceMax ?? fullStatus(sheet).resources;
  return {
    status: {
      hp: r.state.hp, hitDiceSpent: sheet.level - r.state.hitDiceLeft, ...spentByPart(sheet, r.spentBy), slots: r.state.spellSlots, slotMax: s.slotMax ?? [], resourceMax: s.resourceMax ?? {}, hpMax: s.hpMax ?? r.state.hp,
      // Görev MC3 (SRD 5.2.1 s. 70 Pact Magic: kısa ya da uzun dinlenmede dolar): ayrı Pact havuzu.
      ...pactFill(sheet, s),
      resources: rechargeItems(sheet, sorcerousRestoration(sheet, rechargeResources({ ...s.resources, ...(recovery.used ? { arcaneRecovery: 0 } : {}), ...(natural.used ? { naturalRecovery: 0 } : {}) },
        max, 'short', sheet.level), max), 'short', rng),
      // Kuyruk 18 H3: Tireless (Ranger 10): kısa dinlenme Exhaustion'ı 1 azaltır.
      ...(tirelessAfter(sheet, s.exhaustion) ? { exhaustion: tirelessAfter(sheet, s.exhaustion) } : {}),
      ...moralPart(s),
    },
    rolls: r.rolls,
    healed: r.healed,
  };
}

/** Kuyruk 18 H3: Tireless (Ranger 10, SRD 5.2.1): kısa dinlenmeden sonra Exhaustion bir azalır. */
function tirelessAfter(sheet: CharacterSheet, exhaustion: number | undefined): number {
  const ex = exhaustion ?? 0;
  return gainedFeatures(sheet.classId, sheet.level, sheet.subclassId).some((f) => f.key === 'ranger:tireless') ? Math.max(0, ex - 1) : ex;
}

/**
 * Görev WARLOCK: Magical Cunning (kaynak `magicalCunning`, uzun dinlenmede bir kez; savaş dışı 1 dakikalık ayin):
 * harcanmış Pact slotlarından en çok azami slot sayısının yarısı (yukarı) kadarı geri gelir. Kullanılamıyorsa null.
 */
export function magicalCunningStatus(sheet: CharacterSheet, status: CharacterStatus | undefined): CharacterStatus | null {
  const s = currentStatus(sheet, status);
  const max = fullStatus(sheet).slots;
  if (s.dead || (s.resources.magicalCunning ?? 0) <= 0) return null;
  const i = max.findIndex((n) => n > 0);
  const spent = i < 0 ? 0 : (max[i] ?? 0) - (s.slots[i] ?? 0);
  if (spent <= 0) return null;
  const slots = [...s.slots];
  // Kuyruk 19 (11–20): Eldritch Master (Warlock 20): Magical Cunning bütün harcanmış Pact slotlarını geri verir.
  const master = gainedFeatures(sheet.classId, sheet.level, sheet.subclassId).some((f) => f.key === 'warlock:eldritch-master');
  // Görev B93 (SRD 5.2.1 s. 72): "expended Pact Magic spell slots … equal to no more than half your maximum (round up)":
  // harcananların en çok azami slotun yarısı (yukarı) kadarı (eskiden harcananın yarısı).
  slots[i] = (slots[i] ?? 0) + (master ? spent : Math.min(spent, Math.ceil((max[i] ?? 0) / 2)));
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
export function arcaneRecovery(sheet: CharacterSheet, resources: Record<string, number>, slots: number[], resource = 'arcaneRecovery',
  pick?: number[] | null): { slots: number[]; used: boolean } {
  if ((resources[resource] ?? 0) <= 0 || pick === null) return { slots, used: false };
  const max = deriveStats(sheet).spellSlots;
  let budget = Math.ceil(sheet.level / 2);
  const out = [...slots];
  // Görev B93 (SRD 5.2.1 s. 78 "you can choose expended spell slots to recover"): seçilen seviyeler (bütçe, 6+ yok, eksik kadar).
  if (pick) {
    for (const lv of pick) {
      if (lv < 1 || lv > 5 || lv > budget || (out[lv - 1] ?? 0) >= (max[lv - 1] ?? 0)) continue;
      out[lv - 1] = (out[lv - 1] ?? 0) + 1; budget -= lv;
    }
    const used = out.some((n, i) => n !== slots[i]);
    return { slots: used ? out : slots, used };
  }
  for (let lv = 5; lv >= 1; lv--) {
    while (budget >= lv && (out[lv - 1] ?? 0) < (max[lv - 1] ?? 0)) { out[lv - 1] = (out[lv - 1] ?? 0) + 1; budget -= lv; }
  }
  const used = out.some((n, i) => n !== slots[i]);
  return { slots: used ? out : slots, used };
}

/** Uzun dinlenme: HP, slotlar ve bütün kaynaklar dolar; harcanan HP zarlarının tamamı geri gelir (SRD 5.2.1 s. 185). */
export function longRestStatus(sheet: CharacterSheet, status: CharacterStatus | undefined,
  /** Görev TE99: eşya yükünün zarlı yenilenmesi (yoksa durumdan tohumlu, tekrarlanabilir). */ rng?: Rng): CharacterStatus {
  const s = currentStatus(sheet, status);
  if (s.dead) return s;
  const r = longRest(restState(sheet, s));
  return {
    hp: r.hp, hitDiceSpent: sheet.level - r.hitDiceLeft, slots: r.spellSlots, slotMax: s.slotMax ?? [], resourceMax: s.resourceMax ?? {}, hpMax: s.hpMax ?? r.hp,
    // Görev MC3: ayrı Pact havuzu uzun dinlenmede dolar.
    ...pactFill(sheet, s),
    // Görev TE99: eşya yükleri "daily at dawn" kuralıyla (veride `recharge`; tek kullanımlık eşya dolmaz).
    ...waitedLongRest(rechargeItems(sheet, rechargeResources(s.resources, fullStatus(sheet).resourceMax ?? fullStatus(sheet).resources, 'long', sheet.level), 'long', rng), s.waits),
    // Bitkinlik (SRD 5.2.1): uzun dinlenme 1 seviye azaltır.
    ...(exhaustionAfterLongRest(s.exhaustion) > 0 ? { exhaustion: exhaustionAfterLongRest(s.exhaustion) } : {}),
    ...moralPart(s),
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
      status = { ...status, resources: { ...res }, resourceMax: { ...(full.resourceMax ?? res) } };
    }
    // HP en çoğu: kayıttaki HP olduğu gibi kalır (hasar bilinmiyor), en çok bugünkü tablo.
    if (status.hpMax === undefined) status = { ...status, hpMax: full.hp, hp: Math.min(full.hp, status.hp) };
    if (changed) repaired.push(c.sheet.name);
    return { ...c, status };
  });
  return { list: list.some((c) => needs(c.status)) ? out : list, repaired };
}


/**
 * Görev B93: bekleme sayacı olan kaynak uzun dinlenmede dolmaz; sayaç bir azalır (sıfıra inince bu dinlenmede dolar).
 * SRD 5.2.1 s. 38 Greater Divine Intervention: "can't use this feature again until you finish 2d4 Long Rests".
 */
function waitedLongRest(resources: Record<string, number>, waits: Record<string, number> | undefined): { resources: Record<string, number>; waits?: Record<string, number> } {
  if (!waits) return { resources };
  const out = { ...resources };
  const left: Record<string, number> = {};
  for (const [id, n] of Object.entries(waits)) {
    if (n - 1 > 0) { left[id] = n - 1; out[id] = 0; }
  }
  return { resources: out, ...(Object.keys(left).length ? { waits: left } : {}) };
}

/**
 * Görev B93: Arcane Recovery / Natural Recovery seçenekleri: eksik slotlardan (6. seviye altı) bütçeye sığan, daha fazla slot
 * eklenemeyen birleşimler (büyükten küçüğe; en çok 24). Kaynak yoksa ya da eksik slot yoksa boş.
 */
export function recoveryOptions(sheet: CharacterSheet, status: CharacterStatus | undefined, resource = 'arcaneRecovery'): number[][] {
  const s = currentStatus(sheet, status);
  if ((s.resources[resource] ?? 0) <= 0) return [];
  const max = deriveStats(sheet).spellSlots;
  const missing = [1, 2, 3, 4, 5].map((lv) => Math.max(0, (max[lv - 1] ?? 0) - (s.slots[lv - 1] ?? 0)));
  const out: number[][] = [];
  const walk = (lv: number, left: number, have: number[], miss: number[]) => {
    if (out.length >= 24) return;
    if (lv < 1) {
      const more = [1, 2, 3, 4, 5].some((l) => l <= left && miss[l - 1]! > 0);
      if (have.length && !more) out.push(have);
      return;
    }
    for (let n = Math.min(miss[lv - 1]!, Math.floor(left / lv)); n >= 0; n--) {
      const m2 = [...miss]; m2[lv - 1] = m2[lv - 1]! - n;
      walk(lv - 1, left - n * lv, [...have, ...Array(n).fill(lv)], m2);
    }
  };
  walk(5, Math.ceil(sheet.level / 2), [], missing);
  return out;
}

/**
 * Görev B93 (Warlock C9): tek seviyeli slot düzeninde (Pact Magic) seviye atlayınca slot seviyesi değişirse harcanan sayısı
 * yeni seviyeye taşınır (eskiden eski indekste harcanan, yeni indekste dolu sayılıyordu). Durum bu düzende değilse null.
 */
function pactShift(full: number[], status: CharacterStatus): number[] | null {
  if (!status.slotMax) return null;
  const nz = (a: number[]) => a.map((n, i) => (n > 0 ? i : -1)).filter((i) => i >= 0);
  const now = nz(full);
  const before = nz(status.slotMax);
  if (now.length !== 1 || before.length !== 1 || now[0] === before[0]) return null;
  const spent = Math.max(0, (status.slotMax[before[0]!] ?? 0) - (status.slots[before[0]!] ?? 0));
  return full.map((n, i) => (i === now[0] ? Math.max(0, n - spent) : n));
}

/**
 * Görev B93 (SRD 5.2.1 s. 66 Font of Magic, savaş dışı): slot → Sorcery Point (slot seviyesi kadar, tavanı aşmaz) ya da
 * Sorcery Point → slot (bedel ve en düşük seviye veriden; yaratılan slot uzun dinlenmede kaybolur). Kullanılamıyorsa null.
 */
export function fontOfMagicStatus(sheet: CharacterSheet, status: CharacterStatus | undefined, mode: 'toPoints' | 'toSlot', level: number): CharacterStatus | null {
  const s = currentStatus(sheet, status);
  const points = s.resources.sorceryPoints;
  if (s.dead || points === undefined) return null;
  const max = (fullStatus(sheet).resourceMax ?? fullStatus(sheet).resources).sorceryPoints ?? 0;
  if (mode === 'toPoints') {
    if ((s.slots[level - 1] ?? 0) <= 0 || points >= max) return null;
    const slots = [...s.slots]; slots[level - 1] = (slots[level - 1] ?? 0) - 1;
    return { ...s, slots, resources: { ...s.resources, sorceryPoints: Math.min(max, points + level) } };
  }
  const row = resourceDef('sorceryPoints')?.slotCost?.[String(level)];
  if (!row || sheet.level < row[1] || points < row[0]) return null;
  const slots = [...s.slots]; slots[level - 1] = (slots[level - 1] ?? 0) + 1;
  return { ...s, slots, resources: { ...s.resources, sorceryPoints: points - row[0] } };
}
