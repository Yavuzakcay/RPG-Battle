/**
 * Kuyruk AS1b (kural sürümü 71): alt soy buff/debuff mekaniği. Sürüm numarası yalnız burada (MB kalıbı). Alt soy etkileri
 * (`data/races.json` `lineages[].etki`) savaş durumu sürümü ≥ 71 iken geçerlidir: karakter türetmesi (yetenek, hız, kurtarma,
 * beceri, AC), savaş başında süren etki ve haritaya bağlı koşullar. 70 ve altı (eski kayıt, replay) aynen. Yaprak modül.
 */
import soyData from '../../data/alt-soy.json';
import type { BattleState, Combatant } from './types';
import type { Skill } from '../rules/skills';

export const ALT_SOY_VERSION = 71;
export const altSoyOn = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= ALT_SOY_VERSION;

/**
 * Kurtarma bağlamı (`saveMode` 5. parametresi): etkinin hasar türü ve uyguladığı durumlar. Süren etkilerin `saveDisVs` kaydı
 * (alt soy: "X hasarına/durumuna karşı kurtarma dezavantajı") bununla karşılaştırılır. Yaprak.
 */
export interface SaveCtx { damage?: string; against?: string[] }
export function saveDisVs(effects: ReadonlyArray<{ saveDisVs?: Array<{ damage?: string; condition?: string }> }> | undefined, ctx: SaveCtx | undefined): boolean {
  if (!ctx || !effects) return false;
  return effects.some((e) => e.saveDisVs?.some((r) => (!!r.damage && r.damage === ctx.damage) || (!!r.condition && !!ctx.against?.includes(r.condition))));
}

type Fx = { effects?: ReadonlyArray<{ fallMult?: number; teleportEnds?: true; plantWalker?: true }> };
/** Düşme hasarı çarpanı (Kırık Kanat uyanışı ×2). */
export const soyFallMult = (c: Fx): number => (c.effects ?? []).reduce((m, e) => m * (e.fallMult ?? 1), 1);
/** Işınlanınca turun kalan hareketi biter (Cloud). */
export const soyTeleportEnds = (c: Fx): boolean => !!c.effects?.some((e) => e.teleportEnds);
/** Bitkisel zorlu arazi yok sayılır (Orc Orman). */
export const soyPlantWalker = (c: Fx): boolean => !!c.effects?.some((e) => e.plantWalker);

/** Bitkisel zemin harfi (çalılık, sazlık; `data/alt-soy.json` `bitkiselZemin`). */
export const plantChar = (ch: string): boolean => (soyData.bitkiselZemin as string[]).includes(ch);
/** Zorlu arazi veren bitkisel alan büyüsü (Entangle, Plant Growth, Spike Growth; `data/alt-soy.json`). */
export const isPlantZone = (spellId: string): boolean => (soyData.bitkiselAlanlar as string[]).includes(spellId);

/**
 * Alt soyun kontrol dezavantajı kancası: `ruleVersion.ts` `checkBase` çağırır, `soyEtki.ts` yüklenince kaydolur (ana parçaya harita
 * verisi çekmemek ve modül döngüsünde TDZ'ye düşmemek için kanca bu yaprak modülde).
 */
let soyCheck: ((state: BattleState, c: Combatant, skill: Skill) => boolean) | null = null;
export const registerSoyCheck = (fn: (state: BattleState, c: Combatant, skill: Skill) => boolean): void => { soyCheck = fn; };
export const soyCheckHook = (state: BattleState, c: Combatant, skill: Skill): boolean => !!soyCheck && soyCheck(state, c, skill);
