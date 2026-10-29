/**
 * Karakter oluşturucu kuralları (Adım 13): skor belirleme (standart dizi veya point buy),
 * geçmiş bonusu, beceri seçimi, büyü ve donanım denetimi. Saf fonksiyonlar; ekranı bilmez.
 * SRD 5.2.1 "Character Creation": standart dizi 15, 14, 13, 12, 10, 8; point buy 27 puan,
 * skorlar 8–15, maliyet tablosu aşağıda. Ability bonusları geçmişten (+2/+1 veya +1/+1/+1).
 */
import { armor, classes, getClass, races, spells, weapons } from '../data';
import { ABILITIES, type Ability } from './abilities';
import { SKILL_IDS, type Skill } from './skills';
import { classSkillProblem, deriveStats, finalScores, spellSlotsFor, type CharacterSheet, type Scores } from './stats';
import { advancementProblems, featEffects, sheetFeats } from './advancement';
import { classKit, defaultSubclass, subclassLevel, subclassesOf } from './classFeatures';
import { masteryProblems } from './mastery';
import { offHandProblem } from './hands';
import type { CharacterStatus } from './characterRest';

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;
export const POINT_BUY_BUDGET = 27;
const POINT_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

export type ScoreMethod = 'standard' | 'pointBuy';

/** Kayıtlı karakter: form ve oluşturucunun ek bilgileri. */
export interface SavedCharacter {
  id: string;
  method: ScoreMethod;
  /** Sınıftan seçilen beceriler (sınıf listesine göre denetlenir). */
  classSkills: Skill[];
  /** Geçmiş ve türden gelen beceriler (en çok 3). */
  otherSkills: Skill[];
  sheet: CharacterSheet;
  /** Savaşlar arası durum (kalan HP, HP zarı, kaynak, slot); yoksa dinlenmiş (Görev N). */
  status?: CharacterStatus;
}

/** Point buy harcaması; skor 8–15 dışındaysa null. */
export function pointBuyCost(scores: Scores): number | null {
  let total = 0;
  for (const a of ABILITIES) {
    const cost = POINT_COST[scores[a]];
    if (cost === undefined) return null;
    total += cost;
  }
  return total;
}

/** Skorlar standart diziyi tam olarak kullanıyor mu. */
export function usesStandardArray(scores: Scores): boolean {
  return ABILITIES.map((a) => scores[a]).sort((x, y) => y - x).join(',') === STANDARD_ARRAY.join(',');
}

/** Sınıfın önerdiği sırayla standart dizi (oluşturucunun başlangıç değeri). */
export function suggestedScores(classId: string): Scores {
  const order = getClass(classId).abilityPriority;
  const out = {} as Scores;
  order.forEach((a, i) => { out[a] = STANDARD_ARRAY[i] ?? 8; });
  return out;
}

/** Bu sınıf ve seviyede yapılabilen en yüksek büyü seviyesi (0: yalnızca cantrip ya da hiç). */
export function maxSpellLevel(classId: string, level: number): number {
  const slots = spellSlotsFor(classId, level);
  let max = 0;
  slots.forEach((n, i) => { if (n > 0) max = i + 1; });
  return max;
}

/** Sınıfın bu seviyede seçebileceği büyüler (cantrip dahil, en yüksek slot seviyesine kadar). */
/**
 * Yuva seçeneğinin (Blessed Warrior) verdiği cantrip'ler: seçilen seçeneğin listesindeki cantrip'ler ve en çok kaç tane.
 * Seçenek yoksa boş.
 */
export function alternativeCantrips(s: Pick<CharacterSheet, 'classId' | 'level' | 'subclassId' | 'advancements'>): { options: string[]; max: number } {
  const chosen = classKit(s.classId, s.level, s.subclassId).slotAlternatives.filter((alt) => (s.advancements ?? []).some((a) => a.featId === alt.id && a.level === alt.level));
  const options = spells.filter((sp) => sp.level === 0 && chosen.some((alt) => sp.classes.includes(alt.spellList))).map((sp) => sp.name);
  return { options, max: chosen.reduce((n, alt) => n + alt.cantrips, 0) };
}

export function spellOptions(classId: string, level: number): string[] {
  const code = getClass(classId).spellCode;
  if (!code) return [];
  const max = maxSpellLevel(classId, level);
  return spells.filter((s) => s.classes.includes(code) && s.level <= max).map((s) => s.name);
}

/** Formdaki bütün sorunlar (boşsa karakter kaydedilebilir ve savaşa girebilir). */
export function characterProblems(c: SavedCharacter): string[] {
  const s = c.sheet;
  const out: string[] = [];
  if (s.name.trim() === '') out.push('Ad boş olamaz.');
  const race = races.find((r) => r.id === s.raceId);
  if (!race) out.push('Tür seçilmeli.');
  if (!classes.some((k) => k.id === s.classId)) out.push('Sınıf seçilmeli.');
  if (!Number.isInteger(s.level) || s.level < 1 || s.level > 20) out.push('Seviye 1–20 olmalı.');
  if (race?.lineages && race.lineages.length > 0 && !race.lineages.some((l) => l.id === s.lineageId)) {
    out.push(`${race.name} için miras seçilmeli.`);
  }
  if (c.method === 'standard' && !usesStandardArray(s.baseScores)) out.push('Standart dizi (15, 14, 13, 12, 10, 8) her skora bir kez dağıtılmalı.');
  if (c.method === 'pointBuy') {
    const cost = pointBuyCost(s.baseScores);
    if (cost === null) out.push('Point buy\'da skorlar 8–15 arası olmalı.');
    else if (cost > POINT_BUY_BUDGET) out.push(`Point buy ${cost} puan: en çok ${POINT_BUY_BUDGET}.`);
  }
  if (classes.some((k) => k.id === s.classId)) {
    const level = Number.isInteger(s.level) && s.level >= 1 && s.level <= 20 ? s.level : 1;
    const skillProblem = classSkillProblem(s.classId, c.classSkills, classKit(s.classId, level, s.subclassId).extraClassSkills);
    if (skillProblem) out.push(`Sınıf becerileri: ${skillProblem}`);
  }
  const extra = classes.some((k) => k.id === s.classId) ? featEffects(sheetFeats(s)).extraSkills : 0;
  if (c.otherSkills.length > 3 + extra) out.push(extra ? `Geçmiş, tür ve feat'ten en çok ${3 + extra} beceri.` : 'Geçmiş ve türden en çok 3 beceri.');
  if (c.otherSkills.some((x) => c.classSkills.includes(x))) out.push('Aynı beceri hem sınıftan hem geçmişten seçilmiş.');
  if (c.otherSkills.some((x) => !SKILL_IDS.includes(x))) out.push('Bilinmeyen beceri.');
  if (!armor.some((a) => a.name === s.armorName)) out.push('Zırh seçilmeli.');
  for (const w of s.weapons ?? []) if (!weapons.some((x) => x.name === w.name)) out.push(`Bilinmeyen silah: ${w.name}`);
  if (classes.some((k) => k.id === s.classId) && s.level >= 1 && s.level <= 20) {
    const alt = alternativeCantrips(s);
    const own = new Set(spellOptions(s.classId, s.level));
    const allowed = new Set([...own, ...alt.options]);
    for (const sp of s.spellNames ?? []) if (!allowed.has(sp)) out.push(`${sp} bu sınıf ve seviyede seçilemez.`);
    const altChosen = (s.spellNames ?? []).filter((n) => !own.has(n) && alt.options.includes(n)).length;
    if (altChosen > alt.max) out.push(`Blessed Warrior gibi seçenekten en çok ${alt.max} cantrip (${altChosen} seçildi).`);
    // Alt sınıf, seviye yuvaları (ASI/feat), uzmanlık hakkı (Görev N).
    // Kayıtta olmayan alt sınıf (dış içerik silindi ya da kapalı; Görev E1) sorun sayılmaz: karakter bozulmaz, alt sınıf
    // özellikleri olmadan oynar, listede "içerik eksik" görünür (`subclassMissing`).
    if (!s.subclassId && needsSubclass(s)) out.push(`Alt sınıf seçilmeli (${subclassLevel(s.classId)}. seviyede).`);
    try {
      out.push(...advancementProblems(s, { scores: finalScores({ ...s, advancements: [] }), casterClass: getClass(s.classId).casting !== null }));
    } catch (e) {
      out.push(e instanceof Error ? e.message : String(e));
    }
    const allowedExpertise = classKit(s.classId, s.level, s.subclassId).expertise;
    const chosen = s.expertise ?? [];
    if (chosen.length > allowedExpertise) out.push(`Uzmanlık (Expertise) en çok ${allowedExpertise} beceride (${chosen.length} seçildi).`);
    out.push(...masteryProblems(s).map((p) => `Silah ustalığı: ${p}`));
    const hand = offHandProblem(s);
    if (hand) out.push(`Yan el: ${hand}`);
  }
  if (out.length === 0) {
    try {
      deriveStats(s);
    } catch (e) {
      out.push(e instanceof Error ? e.message : String(e));
    }
  }
  return out;
}

/** Karakter alt sınıf seçmiş olmalı mı (alt sınıf seviyesine ulaştı). */
export function needsSubclass(s: Pick<CharacterSheet, 'classId' | 'level'>): boolean {
  const at = subclassLevel(s.classId);
  return at !== null && s.level >= at;
}

/**
 * Eski kayıtlar (Görev P-Paladin): alt sınıf seviyesine ulaşmış ama alt sınıfı boş karakterlere SRD'deki tek alt
 * sınıf atanır; kimlere atandığı döner (kullanıcıya bildirilir). Değişiklik yoksa aynı liste.
 */
export function migrateSubclasses(list: SavedCharacter[]): { list: SavedCharacter[]; assigned: Array<{ name: string; subclass: string }> } {
  const assigned: Array<{ name: string; subclass: string }> = [];
  const out = list.map((c) => {
    if (c.sheet.subclassId || !needsSubclass(c.sheet)) return c;
    const id = defaultSubclass(c.sheet.classId);
    if (!id) return c;
    assigned.push({ name: c.sheet.name, subclass: subclassesOf(c.sheet.classId).find((x) => x.id === id)?.name.en ?? id });
    return { ...c, sheet: { ...c.sheet, subclassId: id } };
  });
  return { list: assigned.length > 0 ? out : list, assigned };
}

/** Oluşturucunun formu kayıtlı karaktere çevirmesi: beceri listesi sınıf + diğerleri. */
export function withSkills(c: SavedCharacter): SavedCharacter {
  const skills = [...c.classSkills, ...c.otherSkills.filter((x) => !c.classSkills.includes(x))];
  // Uzmanlık yalnızca yetkin olunan becerilerde: seçimden çıkan beceri uzmanlıktan da düşer.
  const expertise = (c.sheet.expertise ?? []).filter((x) => skills.includes(x));
  return { ...c, sheet: { ...c.sheet, skills, ...(c.sheet.expertise ? { expertise } : {}) } };
}

/** Boş bir karakter (Human Fighter, standart dizi). */
export function blankCharacter(id: string): SavedCharacter {
  return {
    id, method: 'standard', classSkills: [], otherSkills: [],
    sheet: {
      name: '', raceId: 'human', classId: 'fighter', level: 1, gender: 'erkek',
      baseScores: suggestedScores('fighter'), backgroundBonuses: {}, armorName: 'Zırhsız', shield: false,
      itemNames: [], spellNames: [], weapons: [],
    },
  };
}

/** Geçmiş bonusu kalıbı: +2/+1 veya +1/+1/+1 (boş da geçerli: henüz seçilmedi). */
export function backgroundPattern(bonuses: Partial<Record<Ability, number>>): '2-1' | '1-1-1' | 'none' | 'invalid' {
  const v = Object.values(bonuses).filter((x) => x !== 0 && x !== undefined).sort().join(',');
  return v === '' ? 'none' : v === '1,2' ? '2-1' : v === '1,1,1' ? '1-1-1' : 'invalid';
}

/**
 * Geçmiş bonusunda bu skor bir artırılabilir mi: sonuç +2/+1 ya da +1/+1/+1 kalıbına (ya da onun eksik
 * hâline: +1, +2, +1/+1) uymalı; bir skora en fazla +2.
 */
export function canRaiseBonus(bonuses: Partial<Record<Ability, number>>, a: Ability): boolean {
  const next = { ...bonuses, [a]: (bonuses[a] ?? 0) + 1 };
  const v = Object.values(next).filter((x) => x !== 0 && x !== undefined).sort().join(',');
  return ['1', '2', '1,1', '1,2', '1,1,1'].includes(v);
}
