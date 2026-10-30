/**
 * Alan şekilleri altıgen ızgarada (1 altıgen = 5 ft). Saf fonksiyonlar: savaşı bilmez.
 *
 * - Küre (sphere): merkez noktadan yarıçap / 5 altıgen içindeki altıgenler.
 * - Küp (cube): kenarı S olan küp, yarıçapı S / 10 (aşağı yuvarlanır) olan altıgen öbeği
 *   sayılır. Noktadan çıkan küpün merkezi o noktadır; büyücüden çıkan küpün merkezi
 *   hedef yönünde S / 10 (yukarı yuvarlanır) altıgen ileridedir, büyücü dahil değildir.
 * - Koni (cone; SRD 5.2.1 "Cone"): koninin genişliği her noktada çıkıştan uzaklığına eşittir. Altıgen merkezi
 *   yön ekseni üzerindeki izdüşümü p (0 < p ≤ uzunluk / 5) ve eksene uzaklığı p / 2 + 0,1 altıgen içindeyse alandadır
 *   (0,1: altıgen kenarı payı; alan her yönde ideale yakın: 15 ft → 5, 30 ft → 17–22, 60 ft → 80–86 altıgen).
 *   Çıkış altıgeni dahil değil (SRD: "isn't included … unless its creator decides otherwise").
 * - Çizgi (line): çıkıştan hedef yönünde uzunluk / 5 altıgenlik; genişlik `widthFt` / 5 altıgen (varsayılan 5 ft = 1).
 *   Geniş çizgi (10 ft) yan yana paralel çizgilerdir (önce sağa, sonra sola kaydırılmış). Çıkış dahil değil.
 * - Yayılım (emanation): çıkış altıgeninin çevresinde boyut / 5 altıgen; çıkış dahil değil.
 * - Duvar (wall; Görev B2, Wind Wall): seçilen noktadan geçen, büyücüden noktaya yöne dik, uzunluk / 5 altıgenlik çizgi.
 * Hepsi ızgaranın dışına taşan altıgenleri atar.
 */
import {
  axialToOffset, distance, isInside, line, offsetToAxial, sameHex, withinRange, type GridSize, type Offset,
} from './hex';

export type AreaShape = 'sphere' | 'cube' | 'cone' | 'line' | 'emanation' | 'wall';

export interface AreaSpec {
  shape: AreaShape;
  /** Yarıçap (küre), kenar (küp), uzunluk (koni, çizgi) veya yayılım uzaklığı (ft). */
  sizeFt: number;
  /** Alan seçilen noktadan mı (Fireball) yoksa büyücüden mi (Burning Hands) çıkar. */
  origin: 'point' | 'self';
  /** Çizginin genişliği (ft; varsayılan 5). */
  widthFt?: number;
  /** CILA (Wind Wall): duvar düz değil, büyücünün çevresinde yay (seçilen noktanın uzaklığında). */
  bend?: 'arc';
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

/** Koninin kenar payı (altıgen): ızgarada her yönde ideal alana yakın sonuç verir (bkz. üstteki açıklama). */
const CONE_EDGE = 0.1;
const UNIT = Math.sqrt(3);

function cone(origin: Offset, aim: Offset, lengthHexes: number, size: GridSize): Offset[] {
  const o = center(origin);
  const t = center(aim);
  const dir = Math.atan2(t.y - o.y, t.x - o.x);
  const ux = Math.cos(dir);
  const uy = Math.sin(dir);
  return withinRange(origin, lengthHexes + 1, size).filter((h) => {
    if (sameHex(h, origin)) return false;
    const c = center(h);
    const dx = (c.x - o.x) / UNIT;
    const dy = (c.y - o.y) / UNIT;
    const p = dx * ux + dy * uy;
    const q = Math.abs(dy * ux - dx * uy);
    return p > 0 && p <= lengthHexes + 1e-9 && q <= p / 2 + CONE_EDGE + 1e-9;
  });
}

/** Yöne en dik komşu yönü (geniş çizginin kaydırılması için). */
function sideStep(origin: Offset, aim: Offset, sign: 1 | -1): Offset {
  const o = center(origin);
  const t = center(aim);
  const dir = Math.atan2(t.y - o.y, t.x - o.x) + sign * Math.PI / 2;
  let best = origin;
  let bestDiff = Infinity;
  for (const n of withinRange(origin, 1).filter((h) => !sameHex(h, origin))) {
    const c = center(n);
    let d = Math.abs(Math.atan2(c.y - o.y, c.x - o.x) - dir);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d < bestDiff - 1e-9) { bestDiff = d; best = n; }
  }
  return best;
}

function wideLine(caster: Offset, aim: Offset, lengthHexes: number, widthHexes: number, size: GridSize): Offset[] {
  const end = stepToward(caster, aim, lengthHexes);
  const out: Offset[] = [...line(caster, end).slice(1)];
  const shifts: Array<1 | -1> = [];
  for (let k = 1; k < widthHexes; k++) shifts.push(k % 2 === 1 ? 1 : -1);
  let right = { a: caster, b: end };
  let left = { a: caster, b: end };
  for (const s of shifts) {
    const cur = s === 1 ? right : left;
    const da = sideStep(cur.a, aim, s);
    // Ofset koordinatında kaydırma tek/çift sütunda farklıdır: eksenel koordinatla kaydır.
    const A = offsetToAxial(cur.a);
    const D = offsetToAxial(da);
    const B = offsetToAxial(cur.b);
    const nb = axialToOffset({ q: B.q + (D.q - A.q), r: B.r + (D.r - A.r) });
    const next = { a: da, b: nb };
    // Kaydırılmış şeridin ilk altıgeni çıkışın yanıdır (çıkış satırı): ana çizgi gibi atlanır.
    out.push(...line(next.a, next.b).slice(1).filter((h) => !sameHex(h, caster)));
    if (s === 1) right = next; else left = next;
  }
  const seen = new Set<string>();
  return out.filter((h) => isInside(h, size) && !seen.has(`${h.col},${h.row}`) && (seen.add(`${h.col},${h.row}`), true));
}

/** Kartezyen noktaya en yakın altıgen (küp yuvarlama). */
function nearestHex(x: number, y: number): Offset {
  const q = x / 1.5;
  const r = y / Math.sqrt(3) - q / 2;
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return axialToOffset({ q: rq, r: rr });
}

/** Duvar: `aim`dan geçen, büyücü→nokta yönüne dik `count` altıgenlik kesintisiz çizgi (tekrarsız). */
/**
 * CILA: yay biçimli duvar: büyücüden seçilen noktanın uzaklığındaki halkadan, noktaya en yakın `count` altıgen (halka
 * üstünde kesintisiz bir yay).
 */
function wallArc(caster: Offset, aim: Offset, count: number): Offset[] {
  const d = distance(caster, aim);
  if (d < 1) return wall(caster, aim, count);
  const big = { cols: 999, rows: 999 };
  const ring = withinRange(caster, d, big).filter((h) => distance(caster, h) === d);
  return ring.sort((a, b) => distance(a, aim) - distance(b, aim) || a.col - b.col || a.row - b.row).slice(0, count);
}

function wall(caster: Offset, aim: Offset, count: number): Offset[] {
  const a = center(caster);
  const b = center(aim);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const px = -(b.y - a.y) / len;
  const py = (b.x - a.x) / len;
  const out: Offset[] = [];
  const half = Math.floor((count - 1) / 2);
  for (let i = -half * 2; out.length < count && i <= (count - half) * 2 + 4; i++) {
    const h = nearestHex(b.x + px * i * Math.sqrt(3) / 2, b.y + py * i * Math.sqrt(3) / 2);
    if (!out.some((o) => sameHex(o, h))) out.push(h);
  }
  return out;
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
  if (spec.shape === 'wall') return inGrid(spec.bend === 'arc' ? wallArc(caster, aim, Math.floor(hexes)) : wall(caster, aim, Math.floor(hexes)));
  if (spec.origin === 'point') {
    const radius = spec.shape === 'cube' ? Math.floor(spec.sizeFt / 10) : Math.floor(hexes);
    return withinRange(aim, radius, size);
  }
  if (sameHex(aim, caster)) return [];
  if (spec.shape === 'cone') return cone(caster, aim, Math.floor(hexes), size);
  if (spec.shape === 'line') {
    const width = Math.max(1, Math.round((spec.widthFt ?? 5) / 5));
    if (width > 1) return wideLine(caster, aim, Math.floor(hexes), width, size);
    const end = stepToward(caster, aim, Math.floor(hexes));
    return inGrid(line(caster, end).slice(1));
  }
  // Büyücüden çıkan küp (Thunderwave) veya küre: hedef yönünde ileride bir öbek.
  const radius = spec.shape === 'cube' ? Math.floor(spec.sizeFt / 10) : Math.floor(hexes);
  const mid = stepToward(caster, aim, Math.ceil(spec.sizeFt / 10));
  return withinRange(mid, radius, size).filter((h) => !sameHex(h, caster));
}
