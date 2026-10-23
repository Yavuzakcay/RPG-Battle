/** Harita üstü arayüzün (HUD) saf yardımcıları: yüzen menü ve balon yerleşimi, parlayan hedefler. */
import { spells, type Spell } from '../data';
import type { BattleState, Combatant } from '../battle';
import { attackChoices, isAreaSpell, type AttackChoice } from './mapView';

export interface Point {
  x: number;
  y: number;
}
export interface Box {
  w: number;
  h: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Jetonun çevresine dizilen düğmelerin merkezleri (px). Düğmeler, sahnenin içinde kalan açılar
 * arasından jetondan ortaya bakan yöne en yakın yaya, birbirine değmeyecek aralıkla dizilir;
 * böylece kenara yakın jetonda menü sığacak tarafa açılır. Yay sığmazsa yarıçap büyütülür.
 * Hiçbir yarıçap yetmezse düğmeler sahnenin içine itilir.
 */
export function radialLayout(token: Point, count: number, box: Box, radius: number, button: number): Point[] {
  const toCenter = Math.atan2(box.h / 2 - token.y, box.w / 2 - token.x);
  const half = button / 2 + 2;
  const STEP = Math.PI / 90;
  const N = 180;
  const at = (a: number, r: number): Point => ({ x: token.x + r * Math.cos(a), y: token.y + r * Math.sin(a) });
  const fits = (p: Point) => p.x >= half && p.x <= box.w - half && p.y >= half && p.y <= box.h - half;
  for (let r = radius; r <= radius * 4; r += 6) {
    const gap = 2 * Math.asin(Math.min(1, (button + 6) / (2 * r)));
    const spread = gap * (count - 1);
    if (gap * count > 2 * Math.PI) continue; // tam çemberde ilk ve son düğme çakışır
    const ok = Array.from({ length: N }, (_, i) => fits(at(toCenter + (i - N / 2) * STEP, r)));
    // Ortaya bakan yöne en yakın, yeterince uzun sığan aralığı ara (i: yayın başlangıcı).
    let best: number | null = null;
    const need = Math.ceil(spread / STEP);
    for (let i = 0; i + need < N; i++) {
      let all = true;
      for (let k = i; k <= i + need && all; k++) all = ok[k] as boolean;
      if (!all) continue;
      const mid = toCenter + (i + need / 2 - N / 2) * STEP;
      if (best === null || Math.abs(mid - toCenter) < Math.abs(best - toCenter)) best = mid;
    }
    if (best !== null) {
      return Array.from({ length: count }, (_, i) => at(best - spread / 2 + gap * i, r));
    }
  }
  // Tek yay sığmıyor (çok düğme, kenardaki jeton): iç içe halkalara, ortaya bakan yöne yakın
  // ve birbirine değmeyen yerlere sırayla yerleştir.
  const cands: Array<{ p: Point; ring: number; turn: number }> = [];
  for (let ring = 0; ring < 6; ring++) {
    const r = radius + ring * (button + 6);
    const step = 2 * Math.asin(Math.min(1, (button + 6) / (2 * r)));
    for (let k = 0; k * step < 2 * Math.PI; k++) {
      for (const sign of k === 0 ? [1] : [1, -1]) {
        const p = at(toCenter + sign * k * step, r);
        if (fits(p)) cands.push({ p, ring, turn: k * step });
      }
    }
  }
  cands.sort((x, y) => x.ring - y.ring || x.turn - y.turn);
  const picked: Point[] = [];
  for (const c of cands) {
    if (picked.length === count) break;
    if (picked.every((q) => Math.hypot(q.x - c.p.x, q.y - c.p.y) >= button + 4)) picked.push(c.p);
  }
  // Sahne gerçekten küçükse kalanlar kenara (son çare).
  for (let i = picked.length; i < count; i++) {
    const p = at(toCenter - Math.PI / 2 + (Math.PI * i) / Math.max(1, count - 1), radius);
    picked.push({ x: clamp(p.x, half, box.w - half), y: clamp(p.y, half, box.h - half) });
  }
  return picked;
}

/** Balonun sol üst köşesi (px): çapanın sağında, sığmazsa solunda; dikeyde sahnenin içinde. */
export function bubbleAt(anchor: Point, size: Box, box: Box, gap = 12): Point {
  const right = anchor.x + gap;
  const x = right + size.w <= box.w ? right : Math.max(0, anchor.x - gap - size.w);
  return { x, y: clamp(anchor.y - size.h / 2, 0, Math.max(0, box.h - size.h)) };
}

/** Saldırı seçenekleri (silah, canavar saldırısı, Multiattack) ve büyü seçenekleri ayrı. */
export const isSpellChoice = (c: AttackChoice) => c.id.startsWith('s-');

/** "Saldır" kipinde: en az bir saldırıyla vurulabilecek düşmanlar. */
export function attackTargets(state: BattleState, actorId: string): string[] {
  const side = state.combatants[actorId]?.side;
  return Object.values(state.combatants)
    .filter((c) => c.id !== actorId && c.side !== side)
    .filter((c) => attackChoices(state, actorId, c.id).some((ch) => !isSpellChoice(ch) && ch.command))
    .map((c) => c.id);
}

/** Tek hedefli büyünün yapılabileceği hedefler. */
export function spellTargets(state: BattleState, actorId: string, spellName: string): string[] {
  return Object.values(state.combatants)
    .filter((c) => attackChoices(state, actorId, c.id).some((ch) => ch.id === `s-${spellName}` && ch.command))
    .map((c) => c.id);
}

/** Büyü listesi: tek hedefli, alan ve elle uygulanan (hedefsiz) büyüler. */
export function spellMenu(actor: Combatant): Array<{ spell: Spell; kind: 'target' | 'area' | 'self' }> {
  return actor.spellNames
    .map((n) => spells.find((s) => s.name === n))
    .filter((s): s is Spell => s !== undefined)
    // Tepki büyüleri menüde yok: tetik olunca sorulur (Görev R1).
    .filter((s) => s.castingTime !== 'reaction')
    .map((spell) => ({
      spell,
      kind: isAreaSpell(spell) ? 'area' as const
        : spell.mechanics.kind === 'utility' || (spell.mechanics.kind === 'buff' && !spell.mechanics.ward) ? 'self' as const : 'target' as const,
    }));
}

/** Büyünün atılabileceği slot seviyeleri (büyü seviyesi ve üstü, dolu olanlar), küçükten büyüğe. */
export function slotChoices(actor: Combatant, spell: Spell): number[] {
  if (spell.level === 0) return [];
  return actor.spellSlots.map((n, i) => (n > 0 && i + 1 >= spell.level ? i + 1 : 0)).filter((l) => l > 0);
}

/** Büyü slotu var mı (cantrip her zaman). */
export function hasSlotFor(actor: Combatant, spell: Spell): boolean {
  return spell.level === 0 || actor.spellSlots.some((n, i) => i + 1 >= spell.level && n > 0);
}
