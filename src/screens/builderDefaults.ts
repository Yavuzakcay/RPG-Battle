/**
 * Görev SD3: oluşturucunun "önerilen" başlangıç değerleri (yalnızca Builder parçasında; kural, komut ya da kayıt alanı
 * eklemez). Yeni karakterde ad, sınıf becerileri, geçmiş bonusu ve donanım hazır gelir: "Devam"a basınca makul bir
 * karakter çıkar. Kullanıcı seçimini değiştirdiyse sınıf ya da geçmiş değişince ezilmez (`isAuto…`).
 */
import { armor, classes, getClass, races, weapons } from '../data';
import { ABILITIES, type Ability } from '../rules/abilities';
import { SKILLS, SKILL_IDS, type Skill } from '../rules/skills';
import { backgroundById, backgroundSkills, type Background } from '../rules/backgrounds';
import { classKit, defaultSubclass, subclassesOf } from '../rules/classFeatures';
import { ASI_FEAT, advancementSlots, isStyleChoice, scoresBeforeSlot, type Advancement } from '../rules/advancement';
import { bonusesOf } from '../rules/backgrounds';
import { masteryOptions } from '../rules/mastery';
import { needsSubclass, spellLimits, type SavedCharacter } from '../rules/builder';
import { invocationSlots } from '../rules/invocations';
import { packExperimental } from '../rules/subclasses';
import { classSpellList } from '../rules/spellList';
import type { CharacterSheet } from '../rules/stats';
import data from '../../data/onerilen-baslangic.json';

interface KitDef { zirh: string; kalkan: boolean; silahlar: string[] }
const KITS = data.siniflar as Record<string, KitDef>;
const SPELL_PRIO = data.buyuOnceligi as Record<string, string[]>;

export interface RecommendedKit { armorName: string; shield: boolean; weapons: Array<{ name: string }> }

/** Sınıfın önerilen başlangıç donanımı (verideki ad armor/weapons listesinde yoksa Zırhsız ve silahsız). */
export function recommendedKit(classId: string): RecommendedKit {
  const k = KITS[classId];
  if (!k) return { armorName: 'Zırhsız', shield: false, weapons: [] };
  return {
    armorName: armor.some((a) => a.name === k.zirh) ? k.zirh : 'Zırhsız',
    shield: k.kalkan,
    weapons: k.silahlar.filter((n) => weapons.some((w) => w.name === n)).map((name) => ({ name })),
  };
}

/** Önerilen sınıf becerileri: sınıf listesinden, sınıfın en önemli yetenekleriyle uyuşanlar önce; geçmişten gelenler atlanır. */
export function recommendedSkills(classId: string, level: number, subclassId: string | undefined, bgSkills: Skill[]): Skill[] {
  const cls = getClass(classId);
  const list: Skill[] = cls.skillChoices.from === 'any' ? SKILL_IDS : cls.skillChoices.from;
  const max = cls.skillChoices.count + classKit(classId, level, subclassId).extraClassSkills;
  const rank = (k: Skill) => { const i = cls.abilityPriority.indexOf(SKILLS[k].ability as Ability); return i < 0 ? 99 : i; };
  return list.filter((k) => !bgSkills.includes(k))
    .map((k, i) => ({ k, i }))
    .sort((a, b) => rank(a.k) - rank(b.k) || a.i - b.i)
    .slice(0, max).map((x) => x.k);
}

/** Önerilen geçmiş bonusu: geçmişin üç yeteneğinden sınıfın en önemlisine +2, sonrakine +1. */
export function recommendedBonuses(classId: string, bg: Pick<Background, 'abilities'> | undefined): Partial<Record<Ability, number>> {
  if (!bg) return {};
  const order = getClass(classId).abilityPriority;
  const sorted = [...bg.abilities].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const out: Partial<Record<Ability, number>> = {};
  if (sorted[0]) out[sorted[0]] = 2;
  if (sorted[1]) out[sorted[1]] = 1;
  return out;
}

/** Önerilen ustalık seçimleri: önerilen silahlardan, sınıfın ustalık hakkı kadar. */
export function recommendedMasteries(sheet: CharacterSheet): string[] {
  const own = new Set((sheet.weapons ?? []).map((w) => w.name));
  const count = classKit(sheet.classId, sheet.level, sheet.subclassId).weaponMastery?.count ?? 0;
  return masteryOptions(sheet).filter((w) => own.has(w.name)).slice(0, count).map((w) => w.id);
}

/**
 * Önerilen büyüler (SD3): sınıfın öncelik listesinden, SRD sınıf tablosundaki cantrip / hazırlanan (Wizard'da büyü kitabı)
 * sayılarına kadar; her zaman hazır büyüler ve oyunda çalışmayanlar atlanır, erişilemeyen seviyeler seçilmez.
 */
export function recommendedSpells(sheet: CharacterSheet): { spellNames: string[]; spellbook?: string[] } {
  const lim = spellLimits(sheet.classId, sheet.level, sheet.featureChoices, sheet.invocations);
  const kit = classKit(sheet.classId, sheet.level, sheet.subclassId);
  const prio = SPELL_PRIO[sheet.classId] ?? [];
  const rank = (n: string) => { const i = prio.indexOf(n); return i < 0 ? 1000 : i; };
  const usable = classSpellList(sheet.classId)
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => !!x.spell && !kit.alwaysPrepared.includes(x.name) && !x.spell.mechanics.unsupported && x.level <= lim.maxLevel)
    .sort((a, b) => rank(a.x.name) - rank(b.x.name) || a.i - b.i)
    .map(({ x }) => x);
  const cantrips = usable.filter((x) => x.level === 0).slice(0, lim.cantrips).map((x) => x.name);
  const leveled = usable.filter((x) => x.level > 0).map((x) => x.name);
  if (lim.spellbook !== null) {
    const book = leveled.slice(0, lim.spellbook);
    return { spellNames: [...cantrips, ...book.slice(0, lim.prepared)], spellbook: book };
  }
  return { spellNames: [...cantrips, ...leveled.slice(0, lim.prepared)] };
}

/** Büyü listesi boş ya da bu sınıf ve seviyenin önerisiyle aynı mı (kullanıcı dokunmamış). */
export function isAutoSpells(c: SavedCharacter): boolean {
  const cur = c.sheet.spellNames ?? [];
  if (cur.length === 0) return true;
  try { return sameSet(cur, recommendedSpells(c.sheet).spellNames); } catch { return false; }
}

/** Önerilen büyüler bu karaktere yazılır (yalnız büyü alanları). */
function withSpells(c: SavedCharacter): SavedCharacter {
  let rec: ReturnType<typeof recommendedSpells>;
  try { rec = recommendedSpells(c.sheet); } catch { return c; }
  const sheet: CharacterSheet = { ...c.sheet, spellNames: rec.spellNames };
  if (rec.spellbook) sheet.spellbook = rec.spellbook; else delete sheet.spellbook;
  return { ...c, sheet };
}

/** Soyu zorunlu türde ilk soy (soyu isteğe bağlı türlerde boş kalır: oyundaki varsayılan değişmez). */
function defaultLineage(raceId: string): string | undefined {
  const r = races.find((x) => x.id === raceId);
  return r && !r.lineageOptional ? r.lineages?.[0]?.id : undefined;
}

/**
 * Sınıfın zorunlu özel seçimleri boşsa önerilir (yalnız boşken): alt sınıf (SRD'nin ilk alt sınıfı; ev kuralı ve dış paket
 * alt sınıfları seçilmez), Metamagic (ilk N), Eldritch Invocation (ön koşulsuz, tekrarsız, oyunda çalışan ilk N). Böylece
 * "İleri"ye basan çocuğun karakteri bu yüzden eksik kalmaz.
 */
export function withClassChoices(c: SavedCharacter): SavedCharacter {
  let s = c.sheet;
  if (needsSubclass(s) && !s.subclassId) {
    // Görev AS2: önce sınıfın varsayılanı (data/alt-sinif-gorunum.json `varsayilan`), yoksa ilk tam çalışan paket alt sınıfı.
    const sub = defaultSubclass(s.classId) ?? subclassesOf(s.classId).find((x) => !x.ev && !packExperimental(x))?.id;
    if (sub) s = { ...s, subclassId: sub };
  }
  const mm = classKit(s.classId, s.level, s.subclassId).metamagic;
  if (mm && mm.count > 0 && (s.metamagic ?? []).length === 0) s = { ...s, metamagic: Object.keys(mm.costs).slice(0, mm.count) };
  const slots = invocationSlots(s.classId, s.level);
  if (slots && slots.count > 0 && (s.invocations ?? []).length === 0) {
    const ok = slots.list.filter((v) => !v.requires && !v.repeatable && !v.effect?.rituals && !v.effect?.pactWeapon && v.status !== 'none' && v.minLevel <= s.level);
    if (ok.length >= slots.count) s = { ...s, invocations: ok.slice(0, slots.count).map((v) => v.id) };
  }
  return s === c.sheet ? c : { ...c, sheet: s };
}

/** Karakter kimliğinden kararlı bir önerilen ad. */
export function suggestedName(id: string): string {
  const names = data.adlar;
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return names[h % names.length] ?? names[0] ?? '';
}

const sameSet = <T,>(a: readonly T[], b: readonly T[]) => a.length === b.length && a.every((x) => b.includes(x));
const bonusEq = (a: Partial<Record<Ability, number>>, b: Partial<Record<Ability, number>>) => ABILITIES.every((k) => (a[k] ?? 0) === (b[k] ?? 0));

/** Beceriler boş ya da bu sınıfın önerisiyle aynı mı (kullanıcı dokunmamış). */
export function isAutoSkills(c: SavedCharacter): boolean {
  const s = c.sheet;
  return c.classSkills.length === 0 || sameSet(c.classSkills, recommendedSkills(s.classId, s.level, s.subclassId, backgroundSkills(s)));
}
export function isAutoBonuses(c: SavedCharacter): boolean {
  const b = c.sheet.backgroundBonuses ?? {};
  return Object.keys(b).length === 0 || bonusEq(b, recommendedBonuses(c.sheet.classId, backgroundById(c.sheet.backgroundId)));
}
export function isAutoKit(c: SavedCharacter): boolean {
  const s = c.sheet;
  const k = recommendedKit(s.classId);
  const blank = s.armorName === 'Zırhsız' && !s.shield && (s.weapons ?? []).length === 0;
  return blank || (s.armorName === k.armorName && !!s.shield === k.shield && sameSet((s.weapons ?? []).map((w) => w.name), k.weapons.map((w) => w.name)));
}

/** Donanım + ustalık önerisi bu karaktere yazılır (yalnız bu alanlar). */
function withKit(c: SavedCharacter): SavedCharacter {
  const k = recommendedKit(c.sheet.classId);
  const sheet: CharacterSheet = { ...c.sheet, armorName: k.armorName, shield: k.shield, weapons: k.weapons, offHand: undefined };
  const masteries = recommendedMasteries(sheet);
  return { ...c, sheet: { ...sheet, weaponMasteries: masteries.length ? masteries : undefined } };
}

/** Yeni karakter: ad, beceriler, geçmiş bonusu ve donanım önerisiyle dolu (kayıtta var olan alanlar). */
export function withSuggestions(c0: SavedCharacter): SavedCharacter {
  // Önce sınıfın zorunlu seçimleri (alt sınıf ek beceri verebilir), sonra beceriler, donanım, büyüler, yetenek artışı.
  const c = withClassChoices(c0);
  const s = c.sheet;
  const bg = backgroundById(s.backgroundId);
  const next: SavedCharacter = {
    ...c,
    classSkills: c.classSkills.length ? c.classSkills : recommendedSkills(s.classId, s.level, s.subclassId, backgroundSkills(s)),
    sheet: { ...s, name: s.name || suggestedName(c.id), lineageId: s.lineageId ?? defaultLineage(s.raceId),
      backgroundBonuses: Object.keys(s.backgroundBonuses ?? {}).length ? s.backgroundBonuses : recommendedBonuses(s.classId, bg) },
  };
  const kitted = isAutoKit(next) ? withKit(next) : next;
  return withSpells({ ...kitted, sheet: withRecommendedAsi(kitted.sheet) });
}

/** Sınıf değişti: dokunulmamış öneriler yeni sınıfa göre yenilenir; kullanıcının seçimleri ve geri gelen taslak ezilmez. */
export function reSuggestAfterClassSwitch(before: SavedCharacter, after: SavedCharacter): SavedCharacter {
  let c = withClassChoices(after);
  const s = c.sheet;
  if (isAutoSkills(before) && c.classSkills.length === 0) {
    c = { ...c, classSkills: recommendedSkills(s.classId, s.level, s.subclassId, backgroundSkills(s)) };
  }
  if (isAutoBonuses(before)) {
    c = { ...c, sheet: { ...c.sheet, backgroundBonuses: recommendedBonuses(s.classId, backgroundById(s.backgroundId)) } };
  }
  if (isAutoKit(before)) c = withKit(c);
  if (isAutoSpells(before) && (c.sheet.spellNames ?? []).length === 0) c = withSpells(c);
  return { ...c, sheet: withRecommendedAsi(c.sheet) };
}

/** Geçmiş değişti: dokunulmamış bonus yeni geçmişe göre yenilenir; geçmişten gelen becerilerle çakışan sınıf becerisi çıkar. */
export function reSuggestAfterBackground(before: SavedCharacter, after: SavedCharacter): SavedCharacter {
  let c = after;
  if (isAutoBonuses(before)) c = { ...c, sheet: { ...c.sheet, backgroundBonuses: recommendedBonuses(c.sheet.classId, backgroundById(c.sheet.backgroundId)) } };
  const bgSkills = backgroundSkills(c.sheet);
  if (c.classSkills.some((k) => bgSkills.includes(k))) {
    const auto = isAutoSkills(before);
    const kept = c.classSkills.filter((k) => !bgSkills.includes(k));
    c = { ...c, classSkills: auto ? recommendedSkills(c.sheet.classId, c.sheet.level, c.sheet.subclassId, bgSkills) : kept };
  }
  return c;
}

/** Şu anki sınıf listesi içinde mi (güvenlik). */
export const knownClass = (id: string) => classes.some((k) => k.id === id);

/**
 * Yetenek artışı önerisi (yuva için): sınıfın en önemli yeteneğine +2 (skor 20'yi aşmayan ilki). Yuvanın seviyesinden önceki
 * skorlar (taban + geçmiş + önceki yuvalar) esas alınır. Boş yuva da geçerli; öneri yalnız yeni karakterde kendiliğinden yazılır.
 */
export function recommendedAsi(sheet: CharacterSheet, level: number, list: Advancement[]): Advancement | null {
  const bonus = bonusesOf(sheet);
  const created = Object.fromEntries(ABILITIES.map((ab) => [ab, Math.min(20, sheet.baseScores[ab] + (bonus[ab] ?? 0))])) as Record<Ability, number>;
  const before = scoresBeforeSlot(created, list, level);
  const ab = getClass(sheet.classId).abilityPriority.find((a) => before[a] + 2 <= 20);
  return ab ? { level, featId: ASI_FEAT, abilities: { [ab]: 2 } } : null;
}

/** Yeni karakterde seviye çıkınca: boş yetenek artışı yuvalarına önerilen +2 yazılır (var olan seçimlere dokunulmaz). */
export function withRecommendedAsi(sheet: CharacterSheet): CharacterSheet {
  let list = sheet.advancements ?? [];
  for (const slot of advancementSlots(sheet.classId, sheet.level, sheet.subclassId)) {
    if (slot.kind !== 'asi' || list.some((a) => a.level === slot.level && !isStyleChoice(a.featId))) continue;
    const next = recommendedAsi(sheet, slot.level, list);
    if (next) list = [...list, next];
  }
  return list === (sheet.advancements ?? []) ? sheet : { ...sheet, advancements: list };
}

/** Seviye değişti (yeni karakter oturumu): dokunulmamış büyü ve yetenek artışı önerileri yeni seviyeye göre yenilenir. */
export function reSuggestAfterLevel(before: SavedCharacter, after: SavedCharacter): SavedCharacter {
  let c = withClassChoices(after);
  if (isAutoSkills(before)) c = { ...c, classSkills: recommendedSkills(c.sheet.classId, c.sheet.level, c.sheet.subclassId, backgroundSkills(c.sheet)) };
  if (isAutoSpells(before)) c = withSpells(c);
  return { ...c, sheet: withRecommendedAsi(c.sheet) };
}

// ------------------------------------------------------------------ SD11: açık "Önerilen" etiketi ve toplu doldur/temizle

export type RecoPart = 'skills' | 'spells' | 'kit' | 'class' | 'bonuses' | 'asi' | 'all';
const ALL_PARTS: Exclude<RecoPart, 'all'>[] = ['bonuses', 'class', 'skills', 'kit', 'spells', 'asi'];

/** Önerilen alt sınıf kimliği (yalnız alt sınıf gereken seviyede; `withClassChoices` ile aynı seçim). */
export function recommendedSubclassId(sheet: CharacterSheet): string | undefined {
  if (!needsSubclass(sheet)) return undefined;
  return defaultSubclass(sheet.classId) ?? subclassesOf(sheet.classId).find((x) => !x.ev && !packExperimental(x))?.id;
}

/** Etiket için öneri kümeleri: etiket, seçili öğe bu kümelerdeyse gösterilir (oyuncu çıkarınca kalanlarda sürer, kendi eklediğinde yok). */
export function recoSets(c: SavedCharacter) {
  const s = c.sheet;
  let spells: string[] = [];
  try { spells = recommendedSpells(s).spellNames; } catch { /* sınıf verisi yok */ }
  const kit = recommendedKit(s.classId);
  return {
    skills: recommendedSkills(s.classId, s.level, s.subclassId, backgroundSkills(s)) as string[],
    spells,
    armor: kit.armorName, shield: kit.shield, weapons: kit.weapons.map((w) => w.name),
    subclass: recommendedSubclassId(s),
    bonuses: recommendedBonuses(s.classId, backgroundById(s.backgroundId)),
  };
}

const withoutAsi = (s: CharacterSheet): CharacterSheet => {
  const slots = advancementSlots(s.classId, s.level, s.subclassId).filter((x) => x.kind === 'asi').map((x) => x.level);
  const list = (s.advancements ?? []).filter((a) => !(slots.includes(a.level) && !isStyleChoice(a.featId)));
  return { ...s, advancements: list };
};

/** Bölümü önerilenle doldurur (mevcut seçimin üstüne yazar). */
export function applyReco(c: SavedCharacter, part: RecoPart): SavedCharacter {
  if (part === 'all') return ALL_PARTS.reduce((x, p) => applyReco(x, p), c);
  const s = c.sheet;
  switch (part) {
    case 'bonuses': return { ...c, sheet: { ...s, backgroundBonuses: recommendedBonuses(s.classId, backgroundById(s.backgroundId)) } };
    case 'skills': return { ...c, classSkills: recommendedSkills(s.classId, s.level, s.subclassId, backgroundSkills(s)) };
    case 'kit': return withKit({ ...c, sheet: { ...s, offHand: undefined } });
    case 'spells': return withSpells({ ...c, sheet: { ...s, spellNames: [], spellbook: undefined } });
    case 'class': return withClassChoices({ ...c, sheet: { ...s, subclassId: undefined, metamagic: [], invocations: [] } });
    case 'asi': return { ...c, sheet: withRecommendedAsi(withoutAsi(s)) };
  }
}

/** Bölümü boşaltır. */
export function clearReco(c: SavedCharacter, part: RecoPart): SavedCharacter {
  if (part === 'all') return ALL_PARTS.reduce((x, p) => clearReco(x, p), c);
  const s = c.sheet;
  switch (part) {
    case 'bonuses': return { ...c, sheet: { ...s, backgroundBonuses: {} } };
    case 'skills': return { ...c, classSkills: [] };
    case 'kit': return { ...c, sheet: { ...s, armorName: 'Zırhsız', shield: false, weapons: [], offHand: undefined, weaponMasteries: undefined } };
    case 'spells': return { ...c, sheet: { ...s, spellNames: [], spellbook: undefined } };
    case 'class': return { ...c, sheet: { ...s, subclassId: undefined, metamagic: [], invocations: [] } };
    case 'asi': return { ...c, sheet: withoutAsi(s) };
  }
}

const pick = (c: SavedCharacter, part: Exclude<RecoPart, 'all'>): unknown => {
  const s = c.sheet;
  switch (part) {
    case 'bonuses': return Object.entries(s.backgroundBonuses ?? {}).filter(([, v]) => v).sort();
    case 'skills': return [...c.classSkills].sort();
    case 'kit': return [s.armorName, !!s.shield, (s.weapons ?? []).map((w) => w.name).sort()];
    case 'spells': return [...(s.spellNames ?? [])].sort();
    case 'class': return [s.subclassId ?? null, [...(s.metamagic ?? [])].sort(), [...(s.invocations ?? [])].sort()];
    case 'asi': return JSON.stringify((s.advancements ?? []).filter((a) => !isStyleChoice(a.featId)));
  }
};
/** Bölümde oyuncunun önerilenden farklı (dolu) seçimi var mı: doldururken tek satır onay gerekir. */
export function recoWouldOverwrite(c: SavedCharacter, part: RecoPart): boolean {
  const parts = part === 'all' ? ALL_PARTS : [part];
  return parts.some((p) => {
    const cur = pick(c, p);
    const empty = Array.isArray(cur) ? cur.length === 0 || (p === 'kit' && cur[0] === 'Zırhsız' && !cur[1] && (cur[2] as unknown[]).length === 0) || (p === 'class' && cur[0] === null && (cur[1] as unknown[]).length === 0 && (cur[2] as unknown[]).length === 0) : cur === '[]';
    return !empty && JSON.stringify(cur) !== JSON.stringify(pick(applyReco(c, p), p));
  });
}
