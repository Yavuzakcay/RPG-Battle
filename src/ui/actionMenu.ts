/**
 * Görev SD2 (yalnız arayüz): savaş eylem menüsünün yapısı. Menü öğeleri (`mainItems`, MapBattle.tsx) kendi anahtarlarıyla
 * üretilir; bu modül her anahtarın nereye gideceğini söyler: halka menüde en çok 6 büyük düğme
 * (Saldır, Hareket, Büyü, Özel, Eşya, Turu bitir), geri kalanı alt menülerde. Saf işlev: React, DOM, komut yok;
 * komutu gönderen `act` kapanışları olduğu gibi taşınır.
 *
 * Kurallar (denetim: harita/belgeler/SADELESTIRME-DENETIM.md):
 * - Üst düzey 6 düğme sabit: kullanılamıyorsa gizlenmez, soluk kalır ve dokununca nedeni söylenir.
 * - Alt menüde kullanılamayan öğe gizlenir (`visible`).
 * - Hızlı eylem (bonus) rozeti öğenin kendisinde (`cost`), ayrı düğme değil.
 */

/** Hızlı eylem (bonus eylem) ya da tepki rozeti. */
export type MenuCost = 'bonus' | 'reaction';

export interface MenuItem {
  key: string;
  label: string;
  /** Doluysa o an yapılamaz; değer nedenin tek cümlesi. */
  reason?: string;
  cost?: MenuCost;
  act: () => void;
}

/** Halka menünün sabit 6 düğmesi (sıra bu). */
export const TOP_KEYS = ['attack', 'move', 'spell', 'special', 'items', 'end'] as const;
export type TopKey = (typeof TOP_KEYS)[number];

/** "Özel" altındaki gruplar (sekme sırası bu). */
export const SPECIAL_GROUPS = ['combat', 'heal', 'shape', 'slots', 'summon', 'other'] as const;
export type SpecialGroup = (typeof SPECIAL_GROUPS)[number];

export type MenuArea = 'top' | 'move' | 'items' | 'special' | 'hidden';
export interface Place { area: MenuArea; group?: SpecialGroup }

/** Hareket alt menüsüne giden öğeler (yürü, koş… ve ayağa kalkma / kurtulma / kat, binek, düşme). */
const MOVE_KEYS = new Set(['walk', 'dash', 'disengage', 'jump', 'stand', 'escape_grapple', 'escape', 'escapeSpell', 'floor', 'mount', 'dismount', 'drop', 'fissureClimb', 'shift']);
/** Eşya alt menüsü: iksirler (`item-<kimlik>`), nesne ve fırlatma. */
const ITEM_KEYS = new Set(['object', 'throwObject']);
/** "Diğer" grubu: her zaman yapılabilen temel eylemler. */
const OTHER_KEYS = new Set(['dodge', 'help', 'hide', 'shove', 'search', 'distract', 'pull', 'srd19:stonecunning']);
/** Şifa ve koruma özellikleri (anahtar parçası). */
const HEAL_RE = /(lay-on-hands|divine-spark|preserve-life|healing-touch|wholeness|tireless|inspiration|natures-veil|lands-aid|sanctuary|vigil|vitality|sacred-weapon|nimbus|awakening|forge-bond)/;
const HEAL_KEYS = new Set(['wind']);
/** Hayvan formu (biçim başına bir öğe) ve slot/kaynak çevirme (ayrı gruplar: biçim listesi uzun olabilir). */
const SHAPE_RE = /^shape-/;
const SLOT_RE = /^(magician-|resurge-|font-)/;
/** Çağrılar, yoldaşlar, büyü sürdürme ve alan işaretleri. */
const SUMMON_KEYS = new Set(['steer', 'famOrder', 'gaze', 'commandSummons', 'sphereRoll', 'followHex', 'danceMove', 'followup', 'fissure', 'rally', 'iswap', 'unpossess']);
const SUMMON_RE = /^(steed-|sphereCarry-|beadThrow-|beadTouch-)/;

/** Bu anahtarın menüde nereye gittiği. Bilinmeyen anahtar (yeni yetenek) "Özel ▸ Dövüş" grubuna düşer. */
export function placeOf(key: string): Place {
  if ((TOP_KEYS as readonly string[]).includes(key)) return { area: 'top' };
  if (key === 'mountWhy') return { area: 'hidden' };
  if (MOVE_KEYS.has(key)) return { area: 'move' };
  if (ITEM_KEYS.has(key) || key.startsWith('item-')) return { area: 'items' };
  if (OTHER_KEYS.has(key)) return { area: 'special', group: 'other' };
  if (SHAPE_RE.test(key)) return { area: 'special', group: 'shape' };
  if (SLOT_RE.test(key)) return { area: 'special', group: 'slots' };
  if (SUMMON_KEYS.has(key) || SUMMON_RE.test(key)) return { area: 'special', group: 'summon' };
  if (HEAL_KEYS.has(key) || HEAL_RE.test(key)) return { area: 'special', group: 'heal' };
  return { area: 'special', group: 'combat' };
}

/** Hızlı eylem harcayan sabit anahtarlar (özelliklerde `UsableFeature.type === 'bonus'`, büyülerde `castingTime`). */
const BONUS_KEYS = new Set(['rage', 'wind', 'steady', 'strike', 'steer', 'unpossess', 'famOrder', 'gaze', 'commandSummons', 'flurry-of-blows', 'patient-defense', 'step-of-the-wind']);
export function costOfKey(key: string, featureType?: string): MenuCost | undefined {
  if (featureType === 'bonus') return 'bonus';
  if (BONUS_KEYS.has(key) || key.startsWith('shape-') || key.startsWith('steed-')) return 'bonus';
  return undefined;
}

/** Alt menüde yalnız yapılabilen öğeler kalır (üst düzeyde değil). */
export const visible = <T extends { reason?: string }>(items: T[]): T[] => items.filter((i) => !i.reason);

export interface SplitMenu {
  top: Partial<Record<TopKey, MenuItem>>;
  move: MenuItem[];
  items: MenuItem[];
  special: Record<SpecialGroup, MenuItem[]>;
}

/** Düz öğe listesini üst düzey, hareket, eşya ve özel gruplarına böler (sıra korunur). */
export function splitMenu(list: MenuItem[]): SplitMenu {
  const out: SplitMenu = { top: {}, move: [], items: [], special: { combat: [], heal: [], shape: [], slots: [], summon: [], other: [] } };
  for (const it of list) {
    const p = placeOf(it.key);
    if (p.area === 'top') out.top[it.key as TopKey] = it;
    else if (p.area === 'move') out.move.push(it);
    else if (p.area === 'items') out.items.push(it);
    else if (p.area === 'special' && p.group) out.special[p.group].push(it);
  }
  return out;
}

/** Yapılabilen öğesi olan özel gruplar, sekme sırasıyla. */
export const activeSpecialGroups = (s: SplitMenu): SpecialGroup[] => SPECIAL_GROUPS.filter((g) => visible(s.special[g]).length > 0);

/** Halka alt menüsü sayfası: en çok `size` düğme (geri dahil); fazlası "Daha fazla" sayfasına. */
export function pageOf<T>(items: T[], page: number, size = 6): { shown: T[]; more: boolean; pages: number } {
  // Tek sayfaya sığıyorsa (içerik + Geri ≤ size) sayfalama yok.
  if (items.length <= size - 1) return { shown: items, more: false, pages: 1 };
  const per = size - 2; // "Daha fazla" ve "Geri" için iki yer
  const pages = Math.ceil(items.length / per);
  const p = ((page % pages) + pages) % pages;
  return { shown: items.slice(p * per, p * per + per), more: true, pages };
}

/** Büyü sekmeleri: 0. seviye "Hile", sonra seviye başına bir grup; yalnız dolu gruplar. */
export function spellGroups<T extends { level: number }>(list: T[]): Array<{ level: number; items: T[] }> {
  const by = new Map<number, T[]>();
  for (const s of list) by.set(s.level, [...(by.get(s.level) ?? []), s]);
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([level, items]) => ({ level, items }));
}
