/**
 * Avantaj ve dezavantaj kaynaklarını birleştirme.
 * 5E kuralı: en az bir avantaj ve en az bir dezavantaj varsa ikisi birbirini iptal eder,
 * kaç tane olduğuna bakılmaz.
 */
import type { Environment } from '../data';
import type { RollMode } from './dice';

export interface ModeSource {
  effect: 'advantage' | 'disadvantage';
  reason: string;
}

export function combineModes(sources: ModeSource[]): RollMode {
  const adv = sources.some((s) => s.effect === 'advantage');
  const dis = sources.some((s) => s.effect === 'disadvantage');
  if (adv && !dis) return 'advantage';
  if (dis && !adv) return 'disadvantage';
  return 'normal';
}

/** Ters çevirir: saldıran avantajlıysa hedefin save'i dezavantajlı olur (save büyülerinde). */
export function invertMode(mode: RollMode): RollMode {
  return mode === 'advantage' ? 'disadvantage' : mode === 'disadvantage' ? 'advantage' : 'normal';
}

/**
 * Bir ortamın kurallarından, verilen etikete uyanları bulur.
 * Etiket, saldırının küçük harfli tarifidir: "elf wizard fire bolt 120 ft ... 1d10 fire".
 * Bir kural, anahtar kelimelerinden biri etikette geçiyorsa uygulanır.
 */
export function environmentSources(env: Environment, tag: string): ModeSource[] {
  const t = tag.toLowerCase();
  return env.rules
    .filter((rule) => rule.keywords.some((k) => t.includes(k)))
    .map((rule) => ({ effect: rule.effect, reason: rule.note }));
}
