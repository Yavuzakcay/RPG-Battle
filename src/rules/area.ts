/**
 * Alan şekilleri altıgen ızgarada (1 altıgen = 5 ft). Saf fonksiyonlar: savaşı bilmez.
 *
 * - Küre (sphere): merkez noktadan yarıçap / 5 altıgen içindeki altıgenler.
 * - Küp (cube): kenarı S olan küp, yarıçapı S / 10 (aşağı yuvarlanır) olan altıgen öbeği
 *   sayılır. Noktadan çıkan küpün merkezi o noktadır; büyücüden çıkan küpün merkezi
 *   hedef yönünde S / 10 (yukarı yuvarlanır) altıgen ileridedir, büyücü dahil değildir.
 * - Koni (cone): çıkış altıgeninden uzunluk / 5 altıgen içinde, hedef yönüyle en fazla 30°
 *   açı yapan altıgenler (5e: koninin genişliği o noktanın uzaklığına eşittir).
 * - Çizgi (line): çıkıştan hedef yönünde uzunluk / 5 altıgenlik, 1 altıgen genişliğinde.
 * - Yayılım (emanation): çıkış altıgeninin çevresinde boyut / 5 altıgen; çıkış dahil değil.
 * Hepsi ızgaranın dışına taşan altıgenleri atar.
 */
import {
  axialToOffset, distance, isInside, line, offsetToAxial, sameHex, withinRange, type GridSize, type Offset,
} from './hex';

export type AreaShape = 'sphere' | 'cube' | 'cone' | 'line' | 'emanation';

export interface AreaSpec {
  shape: AreaShape;
  /** Yarıçap (küre), kenar (küp), uzunluk (koni, çizgi) veya yayılım uzaklığı (ft). */
  sizeFt: number;
  /** Alan seçilen noktadan mı (Fireball) yoksa büyücüden mi (Burning Hands) çıkar. */
  origin: 'point' | 'self';
}

/** Düz üstlü altıgen merkezinin kartezyen konumu (altıgen boyu birimi). */
function center(o: Offset): { x: number; y: number } {
  const a = offsetToAxial(o);
  return { x: 1.5 * a.q, y: Math.sqrt(3) * (a.r + a.q / 2) };
}

/** `from`dan `toward` yönünde `steps` altıgen ötedeki altıgen (ızgara dışına çıkabilir). */
export function stepToward(from: Offset, toward: Offset, steps: number): Offset {
  const A = offsetToAxial(from);
  const B = offsetToAxial(toward);
  const d = distance(from, toward);
  if (d === 0) return from;
  const k = steps / d;
  const q = A.q + (B.q - A.q) * k;
  const r = A.r + (B.r - A.r) * k;
  // Küp koordinatında yuvarlama.
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return axialToOffset({ q: rq + 0, r: rr + 0 });
}

function cone(origin: Offset, aim: Offset, lengthHexes: number, size: GridSize): Offset[] {
  const o = center(origin);
  const t = center(aim);
  const dir = Math.atan2(t.y - o.y, t.x - o.x);
  return withinRange(origin, lengthHexes, size).filter((h) => {
    if (sameHex(h, origin)) return false;
    const c = center(h);
    let diff = Math.abs(Math.atan2(c.y - o.y, c.x - o.x) - dir);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    return diff <= Math.PI / 6 + 1e-9;
  });
}

/**
 * Alanın kapladığı altıgenler. `caster` büyücünün altıgeni; `aim` seçilen nokta (noktadan
 * çıkan alanlarda merkez, büyücüden çıkanlarda yön). Yayılımda `aim` kullanılmaz.
 */
export function areaHexes(spec: AreaSpec, caster: Offset, aim: Offset | null, size: GridSize): Offset[] {
  const hexes = spec.sizeFt / 5;
  const inGrid = (xs: Offset[]) => xs.filter((h) => isInside(h, size));
  if (spec.shape === 'emanation') return withinRange(caster, Math.floor(hexes), size).filter((h) => !sameHex(h, caster));
  if (!aim) return [];
  if (spec.origin === 'point') {
    const radius = spec.shape === 'cube' ? Math.floor(spec.sizeFt / 10) : Math.floor(hexes);
    return withinRange(aim, radius, size);
  }
  if (sameHex(aim, caster)) return [];
  if (spec.shape === 'cone') return cone(caster, aim, Math.floor(hexes), size);
  if (spec.shape === 'line') {
    const end = stepToward(caster, aim, Math.floor(hexes));
    return inGrid(line(caster, end).slice(1));
  }
  // Büyücüden çıkan küp (Thunderwave) veya küre: hedef yönünde ileride bir öbek.
  const radius = spec.shape === 'cube' ? Math.floor(spec.sizeFt / 10) : Math.floor(hexes);
  const mid = stepToward(caster, aim, Math.ceil(spec.sizeFt / 10));
  return withinRange(mid, radius, size).filter((h) => !sameHex(h, caster));
}
