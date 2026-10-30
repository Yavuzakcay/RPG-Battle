/**
 * Geçmişler (Görev G1; SRD 5.2.1 "Character Origins > Background Descriptions"): Acolyte, Criminal, Sage, Soldier.
 * Veri `data/backgrounds.json` (SRD kaydı `data/srd/backgrounds.json`). Geçmiş üç yetenek (bonus yalnızca bunlara),
 * köken feat'i, iki beceri ve alet (yalnızca metin) verir. Geçmişi olmayan eski kayıtta serbest köken feat'i ve
 * bonus olduğu gibi kalır. Geçmiş değişince geçersiz kalan seçimler silinmez, sessizce yok sayılır (geri dönünce
 * gelir). Saf: ekran ya da depolama bilmez.
 */
import backgroundsJson from '../../data/backgrounds.json';
import { classes, spells } from '../data';
import type { Ability } from './abilities';
import type { Skill } from './skills';

export interface Background {
  id: string;
  srd: string;
  name: { tr: string; en: string };
  abilities: Ability[];
  feat: string;
  /** Magic Initiate'in büyü listesi (sınıf kimliği). */
  featList?: string;
  skills: Skill[];
  tool: { tr: string; en: string };
  summary: { tr: string; en: string };
}

export const backgrounds = backgroundsJson.backgrounds as Background[];

export const backgroundById = (id: string | undefined): Background | undefined => backgrounds.find((b) => b.id === id);

/**
 * Magic Initiate seçimi (liste başına saklanır: geçmiş değişip geri gelince seçimler döner). F1: `ability` feat'in büyü
 * yeteneği (SRD 5.2.1: INT, WIS ya da CHA, feat alınırken seçilir); yoksa listenin varsayılanı (`MI_DEFAULT_ABILITY`).
 */
export interface MagicInitiatePick { cantrips: string[]; spell?: string; ability?: 'int' | 'wis' | 'cha' }

/** Magic Initiate listeleri (SRD 5.2.1: Cleric, Druid, Wizard) ve listeye uygun varsayılan yetenek. */
export const MI_LISTS = ['cleric', 'druid', 'wizard'] as const;
export const MI_DEFAULT_ABILITY: Record<string, 'int' | 'wis' | 'cha'> = { cleric: 'wis', druid: 'wis', wizard: 'int' };
/** Liste başına "uzun dinlenmede bir kez slotsuz" kaynağı (veride `data/class-features.json` resources). */
export const miResource = (list: string): string => `magic-initiate-${list}`;

interface BackgroundSheet {
  backgroundId?: string;
  /** F1: seviye yuvalarındaki Magic Initiate (`list`). */
  advancements?: Array<{ level: number; featId: string; list?: string }>;
  backgroundBonuses?: Partial<Record<Ability, number>>;
  originFeat?: string;
  magicInitiate?: Record<string, MagicInitiatePick>;
}

export const backgroundOf = (sheet: BackgroundSheet): Background | undefined => backgroundById(sheet.backgroundId);

/** Geçerli geçmiş bonusu: geçmiş varsa yalnızca onun üç yeteneği (diğerleri sessizce yok sayılır). */
export function bonusesOf(sheet: BackgroundSheet): Partial<Record<Ability, number>> {
  const raw = sheet.backgroundBonuses ?? {};
  const bg = backgroundOf(sheet);
  if (!bg) return raw;
  const kept = Object.entries(raw).filter(([, v]) => v);
  const own = kept.filter(([a]) => bg.abilities.includes(a as Ability));
  // Başka geçmişin yeteneğindeki değer düşünce kalan yarım kalıp (+2 tek başına) da yok sayılır: bonus dağıtılmamış sayılır.
  const key = own.map(([, v]) => v).sort().join(',');
  if (own.length < kept.length && key !== '1,2' && key !== '1,1,1') return {};
  return Object.fromEntries(own);
}

/** Köken feat'i: geçmişten (kilitli); geçmiş yoksa eski serbest seçim. */
export const originFeatOf = (sheet: BackgroundSheet): string | undefined => backgroundOf(sheet)?.feat ?? sheet.originFeat;

/** Geçmişten gelen beceriler (kilitli). */
export const backgroundSkills = (sheet: BackgroundSheet): Skill[] => backgroundOf(sheet)?.skills ?? [];

/** Geçmiş ve türden serbest beceri sayısı: geçmiş seçilince geçmişin iki becerisi bu üç haktan düşer. */
export const otherSkillMax = (sheet: BackgroundSheet): number => 3 - backgroundSkills(sheet).length;

/** Magic Initiate'in seçilebilecek büyüleri (listenin cantrip'leri ve 1. seviye büyüleri). */
export function magicInitiateOptions(list: string): { cantrips: string[]; spells: string[] } {
  // Büyü verisinde sınıf kodu (Clr, Wiz…; `classes.json` `spellCode`).
  const code = classes.find((k) => k.id === list)?.spellCode;
  const of = (level: number) => (code ? spells.filter((s) => s.level === level && s.classes.includes(code)).map((s) => s.name) : []);
  return { cantrips: of(0), spells: of(1) };
}

/** Bir listenin geçerli seçimleri (listede olmayanlar yok sayılır). */
function miPick(sheet: BackgroundSheet, list: string): { list: string; cantrips: string[]; spell?: string; ability: 'int' | 'wis' | 'cha' } {
  const pick = sheet.magicInitiate?.[list];
  const opt = magicInitiateOptions(list);
  const cantrips = (pick?.cantrips ?? []).filter((n) => opt.cantrips.includes(n)).slice(0, 2);
  const spell = pick?.spell && opt.spells.includes(pick.spell) ? pick.spell : undefined;
  return { list, cantrips, ...(spell ? { spell } : {}), ability: pick?.ability ?? MI_DEFAULT_ABILITY[list] ?? 'int' };
}

/** Geçmişin Magic Initiate'i (yoksa undefined): liste ve geçerli seçimler (listede olmayanlar yok sayılır). */
export function magicInitiateOf(sheet: BackgroundSheet): { list: string; cantrips: string[]; spell?: string; ability: 'int' | 'wis' | 'cha' } | undefined {
  const bg = backgroundOf(sheet);
  if (bg?.feat !== 'magic-initiate' || !bg.featList) return undefined;
  return miPick(sheet, bg.featList);
}

/**
 * F1: karakterin bütün Magic Initiate'leri: geçmişten ve seviye yuvalarından (SRD 5.2.1: tekrar alınabilir, her
 * seferinde farklı liste). Yuvada liste seçilmemişse `list` boş (eksik olarak görünür).
 */
export function magicInitiateAll(sheet: BackgroundSheet): Array<{ source: 'background' | number; list: string; cantrips: string[]; spell?: string; ability: 'int' | 'wis' | 'cha' }> {
  const out: ReturnType<typeof magicInitiateAll> = [];
  const bg = magicInitiateOf(sheet);
  if (bg) out.push({ source: 'background', ...bg });
  for (const a of sheet.advancements ?? []) {
    if (a.featId !== 'magic-initiate') continue;
    out.push(a.list ? { source: a.level, ...miPick(sheet, a.list) } : { source: a.level, list: '', cantrips: [], ability: 'int' });
  }
  return out;
}

/** Magic Initiate'ten bilinen büyüler (savaşa giden; her zaman hazır). */
export function magicInitiateSpells(sheet: BackgroundSheet): string[] {
  return [...new Set(magicInitiateAll(sheet).flatMap((mi) => [...mi.cantrips, ...(mi.spell ? [mi.spell] : [])]))];
}

/** F1: Magic Initiate büyüsünün yeteneği (büyü adı → yetenek; aynı büyü iki listeden gelirse ilki). */
export function magicInitiateAbilities(sheet: BackgroundSheet): Record<string, 'int' | 'wis' | 'cha'> {
  const out: Record<string, 'int' | 'wis' | 'cha'> = {};
  for (const mi of magicInitiateAll(sheet)) for (const n of [...mi.cantrips, ...(mi.spell ? [mi.spell] : [])]) out[n] ??= mi.ability;
  return out;
}

/** F1: Magic Initiate'in "uzun dinlenmede bir kez slotsuz" kaynakları (1. seviye büyü seçilmiş listeler). */
export function featResources(sheet: BackgroundSheet): Record<string, number> {
  return Object.fromEntries(magicInitiateAll(sheet).filter((mi) => mi.list && mi.spell).map((mi) => [miResource(mi.list), 1]));
}

/** F1: slotsuz yapılabilen büyü → kaynak (savaşçının `freeSpells`'i). */
export function featFreeSpells(sheet: BackgroundSheet): Record<string, string> {
  const out: Record<string, string> = {};
  for (const mi of magicInitiateAll(sheet)) if (mi.list && mi.spell) out[mi.spell] ??= miResource(mi.list);
  return out;
}

/** Magic Initiate eksikleri (oluşturucu, İlerleme adımı). */
export function magicInitiateProblems(sheet: BackgroundSheet): string[] {
  const out: string[] = [];
  const all = magicInitiateAll(sheet);
  for (const mi of all) {
    const where = mi.source === 'background' ? 'Magic Initiate' : `${mi.source}. seviye Magic Initiate`;
    if (!mi.list) { out.push(`${where}: büyü listesi seçilmeli (Cleric, Druid ya da Wizard).`); continue; }
    if (mi.cantrips.length !== 2) out.push(`${where}: 2 cantrip seçilmeli (${mi.cantrips.length} seçildi).`);
    if (!mi.spell) out.push(`${where}: bir 1. seviye büyü seçilmeli.`);
  }
  const lists = all.map((mi) => mi.list).filter(Boolean);
  if (new Set(lists).size !== lists.length) out.push('Magic Initiate her seferinde farklı bir büyü listesiyle alınmalı.');
  return out;
}
