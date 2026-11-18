/**
 * Denge turu (2026-11-03): bölge karşılaşma üreteci. Saf; zar `rng` ile. Varsayılanlar `data/bolge-karsilasma.json`
 * (K47 serbest gezinti karşılaşmaları bunu okuyacak). Düşmanlar bölge haritasının ortam listesinden
 * (`data/monster-ortamlari.json`), SRD 5.2.1 XP bütçesiyle (`data/butce.json`) seçilir:
 * 1. Lider: CR ≤ seviye + `liderCrEk`, XP ≤ bütçe × `liderPay`; en yüksek XP'li üç adaydan biri.
 * 2. Yardımcılar: XP'si liderin en az 1/`yardimciOran`'ı, kalan bütçeye sığan türler; toplam en çok `enCok` düşman,
 *    en çok `efsaneviEnCok` efsanevi canavar. Bütçe seviyeye göre `seviyeCarpani` ile çarpılır (yoksa 1).
 */
import data from '../../data/bolge-karsilasma.json';
import butce from '../../data/butce.json';
import { MONSTER_ENVS, type MonsterEnv } from '../data/monsterEnv';
import { getMonster } from '../data';
import { encounterBudget, type EncounterDifficulty } from '../rules/budget';
import type { Rng } from '../rules/dice';

export interface Region {
  id: string;
  ad: { tr: string; en: string };
  harita: { mapId: string; variantId: string };
  /** Bölge zorluk çarpanı (bütçe × çarpan). */
  carpan: number;
}
interface Rules { liderCrEk: number; enCok: number; yardimciOran: number; altSinir: number; liderPay: number; efsaneviEnCok: number }

export const REGIONS: readonly Region[] = data.bolgeler as Region[];
export const ENCOUNTER_RULES: Rules = data.kurallar;
export const DEFAULT_DIFFICULTY = data.zorluk as EncounterDifficulty;
const CR_XP = butce.crXp as Record<string, number>;
const EXCLUDED = new Set<string>(data.haric);
const EXCLUDED_THEMES = new Set<string>(data.haricTema);

/** SRD XP'si (CR dizgisinden; bilinmeyen 0). */
export const crXp = (cr: string): number => CR_XP[cr] ?? 0;

const LEVEL_MULT = (data as { seviyeCarpani?: Record<string, number> }).seviyeCarpani ?? {};

/** Efsanevi eylemli canavar mı (SRD "Legendary Actions"; canavar verisi yüklü olmalı). */
export function isLegendary(id: string): boolean {
  try { return (getMonster(id).unsupported ?? []).some((u: string) => u.startsWith('Legendary Actions')); } catch { return false; }
}

/** Seviye bütçe çarpanı (`seviyeCarpani`; yoksa 1). */
export const levelMultiplier = (level: number): number => LEVEL_MULT[String(level)] ?? 1;

export const regionById = (id: string): Region | undefined => REGIONS.find((r) => r.id === id);

/** Bölge haritasına uyan canavarlar (XP'ye göre artan). */
export function regionMonsters(region: Region): MonsterEnv[] {
  return MONSTER_ENVS.filter((m) => m.ortam.includes(region.harita.mapId) && crXp(m.cr) > 0 && !EXCLUDED.has(m.id) && !EXCLUDED_THEMES.has(m.tema)).sort((a, b) => crXp(a.cr) - crXp(b.cr));
}

export interface Encounter {
  enemies: Record<string, number>;
  /** Bütçe (çarpanlı) ve harcanan XP. */
  budget: number;
  xp: number;
}

const pick = <T>(list: readonly T[], rng: Rng): T => list[Math.min(list.length - 1, Math.floor(rng() * list.length))] as T;

/** Bölge ve parti seviyeleri için karşılaşma. `multiplier` bölgenin çarpanının üstüne (ölçüm için). */
export function regionEncounter(region: Region, levels: number[], rng: Rng, opts: { difficulty?: EncounterDifficulty; multiplier?: number; rules?: Partial<Rules> } = {}): Encounter {
  const rules = { ...ENCOUNTER_RULES, ...opts.rules };
  const level = Math.max(1, Math.round(levels.reduce((a, b) => a + b, 0) / Math.max(1, levels.length)));
  const budget = Math.round(encounterBudget(levels, opts.difficulty ?? DEFAULT_DIFFICULTY) * region.carpan * levelMultiplier(level) * (opts.multiplier ?? 1));
  const pool = regionMonsters(region);
  if (pool.length === 0) return { enemies: {}, budget, xp: 0 };
  const leaders = pool.filter((m) => m.crSayi <= level + rules.liderCrEk && crXp(m.cr) <= budget * rules.liderPay);
  const top = leaders.slice(-3);
  const leader = top.length > 0 ? pick(top, rng) : (pool[0] as MonsterEnv);
  const enemies: Record<string, number> = { [leader.id]: 1 };
  let left = budget - crXp(leader.cr);
  let count = 1;
  let legendary = isLegendary(leader.id) ? 1 : 0;
  const floor = crXp(leader.cr) / rules.yardimciOran;
  // Yardımcılar: önce büyük türler (en çok iki tür), sonra kalan bütçe.
  for (let kinds = 0; kinds < 3 && count < rules.enCok; kinds++) {
    const fits = pool.filter((m) => crXp(m.cr) >= floor && crXp(m.cr) <= left && m.crSayi <= level + rules.liderCrEk && (legendary < rules.efsaneviEnCok || !isLegendary(m.id)));
    if (fits.length === 0) break;
    // Kalan yuvaları dolduracak kadar büyük olanlardan seç (çok sayıda ufak yaratık yerine).
    const slots = rules.enCok - count;
    const big = fits.filter((m) => crXp(m.cr) * slots >= left * 0.5);
    const kind = pick(big.length > 0 ? big.slice(-4) : fits.slice(-4), rng);
    const n = Math.max(1, Math.min(slots, Math.floor(left / crXp(kind.cr)), 3, isLegendary(kind.id) ? rules.efsaneviEnCok - legendary : 3));
    if (isLegendary(kind.id)) legendary += n;
    enemies[kind.id] = (enemies[kind.id] ?? 0) + n;
    left -= n * crXp(kind.cr);
    count += n;
  }
  return { enemies, budget, xp: budget - left };
}
