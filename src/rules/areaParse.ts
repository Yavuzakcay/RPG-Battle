/**
 * Canavar saldırısının alanı (Görev R4; SRD 5.2.1 stat block metninden): "each creature in a 15-foot Cone",
 * "a 60-foot-long, 5-foot-wide Line", "a 10-foot Emanation originating from …", "a 20-foot-radius Sphere centered on a
 * point … within 120 feet", "…-radius, 40-foot-high Cylinder …". Saf; savaşı bilmez.
 *
 * - Koni, çizgi, yayılım ve küp: çıkış yaratığın kendisi (`self`), çıkış dahil değil.
 * - Noktada küre / silindir: `point`, menzil metindeki "within N feet"; silindir yarıçaplı küre sayılır (yükseklik yok).
 * - "each enemy": yalnızca düşmanlar; "each creature" ve diğerleri: alandaki herkes (dost ateşi).
 */
import type { AreaSpec } from './area';

export interface AttackArea extends AreaSpec {
  /** Noktadan çıkan alanda noktanın en çok uzaklığı (ft). */
  rangeFt?: number;
  targets: 'all' | 'enemies';
}

export function monsterAttackArea(text: string): AttackArea | undefined {
  const t = text.replace(/\s+/g, ' ');
  if (!/Saving Throw/i.test(t)) return undefined;
  const targets: AttackArea['targets'] = /\beach enemy\b/i.test(t) ? 'enemies' : 'all';
  const within = /within (\d+) feet/i.exec(t);
  const point = within ? { origin: 'point' as const, rangeFt: Number(within[1]) } : { origin: 'self' as const };
  let m = /(\d+)-foot-long, (\d+)-foot-? ?wide Line/i.exec(t);
  if (m) return { shape: 'line', sizeFt: Number(m[1]), widthFt: Number(m[2]), origin: 'self', targets };
  m = /(\d+)-foot Cone/i.exec(t);
  if (m) return { shape: 'cone', sizeFt: Number(m[1]), origin: 'self', targets };
  m = /(\d+)-foot Emanation/i.exec(t);
  if (m) return { shape: 'emanation', sizeFt: Number(m[1]), origin: 'self', targets };
  m = /(\d+)-foot-radius(?:, \d+-foot-high)? (Sphere|Cylinder)/i.exec(t);
  if (m) return within ? { shape: 'sphere', sizeFt: Number(m[1]), ...point, targets } : { shape: 'emanation', sizeFt: Number(m[1]), origin: 'self', targets };
  m = /(\d+)-foot Cube/i.exec(t);
  if (m) return { shape: 'cube', sizeFt: Number(m[1]), ...point, targets };
  return undefined;
}
