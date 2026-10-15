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
}

const ATTACKER_DISADVANTAGE = ['Blinded', 'Frightened', 'Poisoned', 'Prone', 'Restrained'];
const TARGET_ADVANTAGE = ['Blinded', 'Restrained', 'Stunned', 'Paralyzed', 'Unconscious', 'Petrified'];
const AUTO_FAIL_STR_DEX = ['Paralyzed', 'Stunned', 'Unconscious', 'Petrified'];
const AUTO_CRIT_WHEN_ADJACENT = ['Paralyzed', 'Unconscious'];

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
    out.push({
      effect: ctx.ranged ? 'disadvantage' : 'advantage',
      reason: `Hedef yerde (${ctx.ranged ? 'uzaktan' : 'yakından'})`,
    });
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

/** Yakından isabet eden bir saldırı, hedef Paralyzed veya Unconscious ise kritik olur. */
export function isAutoCritical(targetConditions: string[], ranged: boolean): boolean {
  return !ranged && targetConditions.some((c) => AUTO_CRIT_WHEN_ADJACENT.includes(c));
}
