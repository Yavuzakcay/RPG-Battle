/** Silah ustalığı işaretleri (Sap, Slow, Vex): süre ve hız etkisi. Saf; reducer ve hareket kullanır. */
import type { Combatant, MasteryMark } from './types';

/** Slow işaretlerinin hız azalması (ft): üst üste binmez, en büyüğü. */
export function slowFeet(c: Pick<Combatant, 'marks'>): number {
  return Math.max(0, ...(c.marks ?? []).filter((m) => m.kind === 'slow').map((m) => m.feet ?? 10));
}

/** Tur geçişinde işaret sayaçları: biten turun sonu ve başlayan turun başı (işareti koyana göre). */
export function tickMarks(marks: MasteryMark[] | undefined, ended: string, started: string): MasteryMark[] | undefined {
  if (!marks || marks.length === 0) return marks;
  return marks
    .map((m) => ((m.end === 'turnEnd' && m.by === ended) || (m.end === 'turnStart' && m.by === started) ? { ...m, count: m.count - 1 } : m))
    .filter((m) => m.count > 0);
}
