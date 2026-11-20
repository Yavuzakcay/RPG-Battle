/**
 * Görev B93 (A2): seviye atlama ve uzun dinlenmede seçim değişimi; bütün sınıflar için tek yardımcı (sınıf adı yok, kurallar
 * `data/secim-degisim.json`). SRD 5.2.1: yeni seçim (sayı artışı) serbest; var olan seçimi çıkarmak/değiştirmek sınıf
 * metnindeki pencerede ("Whenever you gain a level" = seviye, "Whenever you finish a Long Rest" = dinlenme) ve sayıda.
 * Seçimin kendisinin kurala uygunluğu (liste, sayı, kitap, ön koşul) oluşturucu kurallarıyla (`characterIssues`) denetlenir.
 * Saf.
 */
import data from '../../data/secim-degisim.json';
import { spells } from '../data';
import type { CharacterSheet } from './stats';
import { advancementSlots, isStyleChoice } from './advancement';
import { classKit, subclassesOf, subclassLevel } from './classFeatures';

export type Allow = number | 'hepsi';
export interface ChangeRule { seviye?: Allow; dinlenme?: Allow }
export type ChoiceWindow = 'seviye' | 'dinlenme';
/** Pencerede kullanılmış değişim sayıları (anahtar → sayı). */
export type ChoiceUse = Partial<Record<ChoiceWindow, Record<string, number>>>;

/** Seviye atlamada/dinlenmede değişebilen sayfa alanları (Serüven `set_choices` yalnız bunları yazar). */
export const CHOICE_FIELDS = ['spellNames', 'spellbook', 'invocations', 'metamagic', 'expertise', 'featureChoices', 'advancements',
  'subclassId', 'pactWeapon', 'weaponMasteries'] as const;
export type ChoiceField = (typeof CHOICE_FIELDS)[number];

interface ClassRules { [key: string]: ChangeRule | Record<string, ChangeRule> | undefined; secenek?: Record<string, ChangeRule> }
const RULES = (data as { siniflar: Record<string, ClassRules> }).siniflar;

/** Sınıf seçim değişimine bağlı mı (verisi var mı). */
export const choicesBound = (classId: string): boolean => RULES[classId] !== undefined;

/** Anahtarın kuralı (yazılmayan: yalnız eklenir). `secenek:<anahtar>` featureChoices anahtarıdır. */
export function ruleFor(classId: string, key: string): ChangeRule {
  const r = RULES[classId];
  if (!r) return {};
  if (key.startsWith('secenek:')) {
    const k = key.slice('secenek:'.length);
    const hit = Object.entries(r.secenek ?? {}).find(([p]) => (p.startsWith(':') ? k.endsWith(p) : p.endsWith('/') ? k.startsWith(p) : k === p));
    return hit?.[1] ?? {};
  }
  return (r[key] as ChangeRule | undefined) ?? {};
}

const levelOf = (n: string) => spells.find((x) => x.name === n)?.level ?? 1;
const removed = <T>(a: readonly T[] | undefined, b: readonly T[] | undefined, key: (x: T) => string = (x) => String(x)): number => {
  const after = new Map<string, number>();
  for (const x of b ?? []) after.set(key(x), (after.get(key(x)) ?? 0) + 1);
  let n = 0;
  for (const x of a ?? []) {
    const k = key(x);
    const left = after.get(k) ?? 0;
    if (left > 0) after.set(k, left - 1); else n++;
  }
  return n;
};

/** Önceki sayfadan sonrakine çıkarılan/değişen seçim sayıları (anahtar → sayı; yalnız > 0 olanlar). */
export function changeCounts(before: CharacterSheet, after: CharacterSheet): Record<string, number> {
  const out: Record<string, number> = {};
  const put = (k: string, n: number) => { if (n > 0) out[k] = n; };
  put('cantrip', removed((before.spellNames ?? []).filter((n) => levelOf(n) === 0), (after.spellNames ?? []).filter((n) => levelOf(n) === 0)));
  put('hazir', removed((before.spellNames ?? []).filter((n) => levelOf(n) > 0), (after.spellNames ?? []).filter((n) => levelOf(n) > 0)));
  for (const f of ['spellbook', 'invocations', 'metamagic', 'expertise', 'weaponMasteries'] as const) put(f, removed(before[f] as string[] | undefined, after[f] as string[] | undefined));
  // Görev B94: Fighting Style yuvası (feat ya da Blessed/Druidic Warrior) ayrı anahtar `stil`; diğer yuvalar `advancements`.
  const style = (a: CharacterSheet['advancements']) => (a ?? []).filter((x) => isStyleChoice(x.featId));
  const other = (a: CharacterSheet['advancements']) => (a ?? []).filter((x) => !isStyleChoice(x.featId));
  put('stil', removed(style(before.advancements), style(after.advancements), (x) => JSON.stringify(x)));
  put('advancements', removed(other(before.advancements), other(after.advancements), (x) => JSON.stringify(x)));
  for (const f of ['subclassId', 'pactWeapon'] as const) put(f, before[f] !== undefined && before[f] !== '' && before[f] !== after[f] ? 1 : 0);
  for (const [k, v] of Object.entries(before.featureChoices ?? {})) put(`secenek:${k}`, after.featureChoices?.[k] !== v ? 1 : 0);
  return out;
}

const room = (allow: Allow | undefined, used: number): number => (allow === 'hepsi' ? Infinity : Math.max(0, (allow ?? 0) - used));

/**
 * Değişimler açık pencerelere sığıyor mu. Önce seviye penceresi, sonra dinlenme penceresi harcanır.
 * Döner: harcanacak sayılar ya da sığmayan ilk anahtar.
 */
export function fitChanges(classId: string, counts: Record<string, number>, open: Record<ChoiceWindow, boolean>, used: ChoiceUse):
  { ok: true; use: ChoiceUse } | { ok: false; key: string } {
  const use: ChoiceUse = {};
  for (const [key, n] of Object.entries(counts)) {
    const rule = ruleFor(classId, key);
    let left = n;
    for (const w of ['seviye', 'dinlenme'] as const) {
      if (!open[w] || left <= 0) continue;
      const take = Math.min(left, room(rule[w], used[w]?.[key] ?? 0));
      if (take > 0) { use[w] = { ...(use[w] ?? {}), [key]: take }; left -= take; }
    }
    if (left > 0) return { ok: false, key };
  }
  return { ok: true, use };
}

/** Yalnız seçim alanları (Serüven komutu bunları taşır). */
export function pickChoiceFields(s: Partial<CharacterSheet>): Partial<CharacterSheet> {
  const out: Partial<CharacterSheet> = {};
  for (const f of CHOICE_FIELDS) if (s[f] !== undefined) (out as Record<string, unknown>)[f] = s[f];
  return out;
}

/** İki kullanım kaydını toplar. */
export function addUse(a: ChoiceUse, b: ChoiceUse): ChoiceUse {
  const out: ChoiceUse = { ...a };
  for (const w of ['seviye', 'dinlenme'] as const) {
    if (!b[w]) continue;
    const m = { ...(out[w] ?? {}) };
    for (const [k, n] of Object.entries(b[w]!)) m[k] = (m[k] ?? 0) + n;
    out[w] = m;
  }
  return out;
}

/** Görev B95 (A): seviye atlamada istenen eksik seçimlerin türü. */
export type PendingChoice = 'subclassId' | 'advancements' | 'weaponMasteries' | 'expertise';

/**
 * Görev B95 (A): sayfada boş kalan, istenmesi gereken seçimler (sınıf adsız, sınıf ve seviye verisinden): alt sınıf
 * seviyesine ulaşıp alt sınıfı boş (otomatik atanmaz), doldurulmamış ASI/feat/Epic Boon/Fighting Style yuvası, ustalık
 * hakkından az seçim, Expertise hakkından az seçim. Saf.
 */
export function pendingChoices(s: CharacterSheet): PendingChoice[] {
  const out: PendingChoice[] = [];
  const at = subclassLevel(s.classId);
  if (!s.subclassId && at !== null && s.level >= at && subclassesOf(s.classId).length > 0) out.push('subclassId');
  if (advancementSlots(s.classId, s.level, s.subclassId).length > (s.advancements ?? []).length) out.push('advancements');
  const kit = classKit(s.classId, s.level, s.subclassId);
  if (kit.weaponMastery && (s.weaponMasteries ?? []).length < kit.weaponMastery.count) out.push('weaponMasteries');
  if ((s.expertise ?? []).length < kit.expertise) out.push('expertise');
  return out;
}
