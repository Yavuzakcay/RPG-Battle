/** Durum etkilerinin saldırılara ve save'lere etkisi, ve yükseklik farkı. */
import { conditions } from '../data';
import type { ModeSource } from './modes';

/** -1 alçak, 0 aynı seviye, 1 yüksek zemin. */
export type Height = -1 | 0 | 1;

export interface AttackContext {
  attackerConditions: string[];
  targetConditions: string[];
  /** Haritasız savaşta -1/0/1, haritada altıgenin yüksekliği (0/1/2). Yalnızca sıra önemli. */
  attackerHeight: number;
  targetHeight: number;
  /** Menzilli saldırı mı? */
  ranged: boolean;
  /** Büyü saldırısı mı? (Pack Tactics büyülere uygulanmaz.) */
  spell: boolean;
  /** Pack Tactics: saldıranın bu özelliği var ve başka bir müttefik ayakta. */
  packTactics?: boolean;
  /** Hedef uyuyor (uyuyan ejderha): yakın dövüş saldırıları avantajlı. */
  targetAsleep?: boolean;
  /** Saldıranın tarafı (Yardım işareti `Help:<taraf>` hedefteyse avantaj). */
  attackerSide?: string;
  /**
   * Kuyruk 16 K16E (kural sürümü 2): Prone hedefe saldıran 5 ft içinde mi (SRD 5.2.1: içindeyse avantaj, değilse
   * dezavantaj). Yoksa eski kural (yakın dövüş avantaj, menzilli dezavantaj).
   */
  proneWithin5?: boolean;
}

const ATTACKER_DISADVANTAGE = ['Blinded', 'Frightened', 'Poisoned', 'Prone', 'Restrained'];
const TARGET_ADVANTAGE = ['Blinded', 'Restrained', 'Stunned', 'Paralyzed', 'Unconscious', 'Petrified'];
const AUTO_FAIL_STR_DEX = ['Paralyzed', 'Stunned', 'Unconscious', 'Petrified'];
const AUTO_CRIT_WHEN_ADJACENT = ['Paralyzed', 'Unconscious'];
/** Hızı 0 olan durumlar (SRD 5.2.1: Grappled, Restrained, Paralyzed, Petrified, Unconscious; "can't increase"). */
const SPEED_ZERO = ['Grappled', 'Restrained', 'Paralyzed', 'Petrified', 'Unconscious'];

/** Hızı 0 mı (Görev H). Incapacitated ve Stunned hızı düşürmez: yürüyebilir ama eylem yapamaz. */
export function speedZero(conds: string[]): boolean {
  return conds.some((c) => SPEED_ZERO.includes(c));
}

/**
 * Durum yüzünden yapamadığı hareket komutları da sayılmaz (Görev H): Incapacitated yaratık eylem, bonus eylem ve tepki
 * yapamaz; hızı 0 değilse yürüyebilir, atlayabilir ve kalkabilir (SRD 5.2.1 Incapacitated).
 */
export const MOVE_ONLY_COMMANDS = ['move', 'jump', 'stand_up', 'change_height'];

/** Saldıran yaratığın aksiyon yapıp yapamayacağı. */
export function isIncapacitated(conds: string[]): boolean {
  return conds.some((c) => conditions.incapacitating.includes(c));
}

/** Saldırıya avantaj veya dezavantaj veren tüm kaynakları listeler. */
export function attackSources(ctx: AttackContext): ModeSource[] {
  const out: ModeSource[] = [];
  if (ctx.attackerHeight !== ctx.targetHeight) {
    const higher = ctx.attackerHeight > ctx.targetHeight;
    out.push({
      effect: higher ? 'advantage' : 'disadvantage',
      reason: higher ? 'Yüksek zemin avantajı' : 'Alçak zemin dezavantajı',
    });
  }
  for (const c of ATTACKER_DISADVANTAGE) {
    if (ctx.attackerConditions.includes(c)) out.push({ effect: 'disadvantage', reason: `Saldıran ${c}` });
  }
  if (ctx.attackerConditions.includes('Invisible')) {
    out.push({ effect: 'advantage', reason: 'Saldıran görünmez' });
  }
  for (const c of TARGET_ADVANTAGE) {
    if (ctx.targetConditions.includes(c)) out.push({ effect: 'advantage', reason: `Hedef ${c}` });
  }
  if (ctx.targetConditions.includes('Invisible')) {
    out.push({ effect: 'disadvantage', reason: 'Hedef görünmez' });
  }
  if (ctx.targetConditions.includes('Prone')) {
    const near = ctx.proneWithin5 ?? !ctx.ranged;
    out.push({
      effect: near ? 'advantage' : 'disadvantage',
      reason: ctx.proneWithin5 === undefined ? `Hedef yerde (${ctx.ranged ? 'uzaktan' : 'yakından'})` : `Hedef yerde (${near ? '5 ft içinden' : '5 ft dışından'})`,
    });
  }
  if (ctx.targetAsleep && !ctx.ranged) {
    out.push({ effect: 'advantage', reason: 'Hedef uyuyor (yakından)' });
  }
  // Kaçın (Dodge): hedef etkisiz değil ve hızı 0 değilse, görebildiği saldıran dezavantajlı.
  if (ctx.targetConditions.includes('Dodge') && !isIncapacitated(ctx.targetConditions)
    && !ctx.targetConditions.some((c) => c === 'Grappled' || c === 'Restrained') && !ctx.attackerConditions.includes('Invisible')) {
    out.push({ effect: 'disadvantage', reason: 'Hedef kaçınıyor' });
  }
  if (ctx.attackerSide && ctx.targetConditions.includes(`Help:${ctx.attackerSide}`)) {
    out.push({ effect: 'advantage', reason: 'Yardım' });
  }
  if (ctx.packTactics && !ctx.spell) {
    out.push({ effect: 'advantage', reason: 'Pack Tactics' });
  }
  return out;
}

/** Hedef, STR/DEX save'lerini otomatik kaybeder mi? */
export function autoFailsStrDexSave(targetConditions: string[]): boolean {
  return targetConditions.some((c) => AUTO_FAIL_STR_DEX.includes(c));
}

/**
 * Hedef Paralyzed ya da Unconscious iken isabet, saldıran 5 ft içindeyse kritiktir (SRD 5.2.1; yakın dövüş ya da
 * menzilli fark etmez, 10 ft erişimden yapılan yakın dövüş saldırısı kritik değil). `withinFiveFt`: haritada bitişik,
 * haritasızda yakın dövüş saldırısı (Görev H).
 */
export function isAutoCritical(targetConditions: string[], withinFiveFt: boolean): boolean {
  return withinFiveFt && targetConditions.some((c) => AUTO_CRIT_WHEN_ADJACENT.includes(c));
}
