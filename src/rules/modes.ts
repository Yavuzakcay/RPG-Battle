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
/**
 * Su altında silah saldırısı (SRD 5.2.1 Underwater Combat, s. 16): yüzme hızı olmayanın
 * piercing olmayan yakın dövüş saldırısı ve menzilli silah saldırısı dezavantajlı; menzilli
 * saldırı normal menzil ötesinde otomatik ıskalar (`autoMiss`).
 */
export function underwaterSources(ranged: boolean, damageType: string | undefined, beyondNormal: boolean):
  { sources: ModeSource[]; autoMiss: boolean } {
  if (ranged) {
    return beyondNormal
      ? { sources: [{ effect: 'disadvantage', reason: 'Su altında normal menzil ötesi: otomatik ıska' }], autoMiss: true }
      : { sources: [{ effect: 'disadvantage', reason: 'Su altında menzilli atış' }], autoMiss: false };
  }
  return (damageType ?? '').toLowerCase() === 'piercing'
    ? { sources: [], autoMiss: false }
    : { sources: [{ effect: 'disadvantage', reason: 'Su altında piercing olmayan yakın dövüş' }], autoMiss: false };
}

export function invertMode(mode: RollMode): RollMode {
  return mode === 'advantage' ? 'disadvantage' : mode === 'disadvantage' ? 'advantage' : 'normal';
}

/** Saldırının türü: silah saldırısı mı, menzilli mi. */
export interface AttackKind {
  weapon?: boolean;
  ranged?: boolean;
}

/**
 * Bir ortamın kurallarından, verilen etikete uyanları bulur.
 * Etiket, saldırının küçük harfli tarifidir: "elf wizard fire bolt 120 ft ... 1d10 fire".
 * Bir kural, anahtar kelimelerinden biri etikette geçiyorsa uygulanır. `weapon` kuralları
 * yalnızca silah saldırısında; `ranged` işaretli kurallar yalnızca menzilli ya da yalnızca
 * yakın dövüş silah saldırısında.
 */
export function environmentSources(env: Environment, tag: string, kind: AttackKind = {}): ModeSource[] {
  const t = tag.toLowerCase();
  return env.rules
    .filter((rule) => rule.category !== 'weapon' || kind.weapon === true)
    .filter((rule) => rule.ranged === undefined || rule.ranged === (kind.ranged === true))
    .filter((rule) => rule.keywords.some((k) => t.includes(k)))
    .map((rule) => ({ effect: rule.effect, reason: rule.note }));
}
