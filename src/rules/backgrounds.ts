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

/** Magic Initiate seçimi (liste başına saklanır: geçmiş değişip geri gelince seçimler döner). */
export interface MagicInitiatePick { cantrips: string[]; spell?: string }

interface BackgroundSheet {
  backgroundId?: string;
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

/** Geçmişin Magic Initiate'i (yoksa undefined): liste ve geçerli seçimler (listede olmayanlar yok sayılır). */
export function magicInitiateOf(sheet: BackgroundSheet): { list: string; cantrips: string[]; spell?: string } | undefined {
  const bg = backgroundOf(sheet);
  if (bg?.feat !== 'magic-initiate' || !bg.featList) return undefined;
  const pick = sheet.magicInitiate?.[bg.featList];
  const opt = magicInitiateOptions(bg.featList);
  const cantrips = (pick?.cantrips ?? []).filter((n) => opt.cantrips.includes(n)).slice(0, 2);
  const spell = pick?.spell && opt.spells.includes(pick.spell) ? pick.spell : undefined;
  return { list: bg.featList, cantrips, ...(spell ? { spell } : {}) };
}

/** Magic Initiate'ten bilinen büyüler (savaşa giden). */
export function magicInitiateSpells(sheet: BackgroundSheet): string[] {
  const mi = magicInitiateOf(sheet);
  return mi ? [...mi.cantrips, ...(mi.spell ? [mi.spell] : [])] : [];
}

/** Magic Initiate eksikleri (oluşturucu, İlerleme adımı). */
export function magicInitiateProblems(sheet: BackgroundSheet): string[] {
  const mi = magicInitiateOf(sheet);
  if (!mi) return [];
  const out: string[] = [];
  if (mi.cantrips.length !== 2) out.push(`Magic Initiate: 2 cantrip seçilmeli (${mi.cantrips.length} seçildi).`);
  if (!mi.spell) out.push('Magic Initiate: bir 1. seviye büyü seçilmeli.');
  return out;
}
