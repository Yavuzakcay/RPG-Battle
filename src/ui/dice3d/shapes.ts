/**
 * Zar şekilleri (d4, d6, d8, d10, d12, d20; d100 = iki d10): köşeler, yüzler, yüz etiketleri ve "sonuç yüzü
 * yukarı" yönelimi. Yalnızca geometri ve matematik; çizim `Dice3D.tsx`'te. Okunan değer: d4'te üstteki köşe
 * (gerçek d4 gibi her yüzün köşelerinde o köşenin değeri yazar), ötekilerde üstteki yüz.
 */
import { axisAngle, cross, dot, fromTo, mul, norm, rotate, scale, sub, add, type Quat, type Vec3 } from './math';

export interface Face {
  /** Köşe indeksleri, dışarıdan bakınca saat yönünün tersi. */
  verts: number[];
  normal: Vec3;
  center: Vec3;
  /** Yüzdeki yazının "yukarı" yönü (yüz düzleminde). */
  up: Vec3;
  /** Yüzde yazan etiket (d4'te boş; köşe etiketleri kullanılır). */
  label: string;
}

export interface DieShape {
  sides: number;
  vertices: Vec3[];
  faces: Face[];
  /** d4: köşe etiketleri ("1".."4"); sonuç üstteki köşe. */
  vertexLabels?: string[];
  /** Yüz düzleminin merkeze uzaklığı (zemine oturunca merkezin yüksekliği). */
  inradius: number;
}

const centroid = (pts: Vec3[]): Vec3 => scale(pts.reduce((a, b) => add(a, b), [0, 0, 0] as Vec3), 1 / pts.length);

/** Newell yöntemiyle düzlem normali (hafif düzlemsiz çokgenlerde de kararlı). */
function newell(pts: Vec3[]): Vec3 {
  const n: Vec3 = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i] as Vec3, b = pts[(i + 1) % pts.length] as Vec3;
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return norm(n);
}

/** Çokgenin köşelerini dışarıdan bakınca saat yönünün tersine sıralar. */
function orient(vs: Vec3[], idx: number[]): number[] {
  const pts = idx.map((i) => vs[i] as Vec3);
  const c = centroid(pts);
  const n = norm(c);
  const e1 = norm(sub(pts[0] as Vec3, c));
  const e2 = cross(n, e1);
  return [...idx].sort((a, b) => {
    const pa = sub(vs[a] as Vec3, c), pb = sub(vs[b] as Vec3, c);
    return Math.atan2(dot(pa, e2), dot(pa, e1)) - Math.atan2(dot(pb, e2), dot(pb, e1));
  });
}

function makeShape(sides: number, vertices: Vec3[], polys: number[][], labels: string[], upMode: 'vertex' | 'edge' = 'vertex', vertexLabels?: string[]): DieShape {
  const r = Math.max(...vertices.map((v) => Math.hypot(...v)));
  const vs = vertices.map((v) => scale(v, 1 / r));
  const faces = polys.map((p, i) => {
    const pts = p.map((k) => vs[k] as Vec3);
    const center = centroid(pts);
    let normal = newell(pts);
    let verts = p;
    // Ters yönlüyse çevrilir; ilk köşe (yazının yukarısı ona göre) yerinde kalır.
    if (dot(normal, center) < 0) { verts = [p[0] as number, ...p.slice(1).reverse()]; normal = scale(normal, -1); }
    const a = vs[verts[0] as number] as Vec3, b = vs[verts[1] as number] as Vec3;
    const toward = upMode === 'edge' ? scale(add(a, b), 0.5) : a;
    const raw = sub(toward, center);
    const up = norm(sub(raw, scale(normal, dot(raw, normal))));
    return { verts, normal, center, up, label: labels[i] ?? '' };
  });
  const inradius = Math.min(...faces.map((f) => dot(f.center, f.normal)));
  return { sides, vertices: vs, faces, inradius, ...(vertexLabels ? { vertexLabels } : {}) };
}

/** Aynı kenar uzunluğundaki üçlüleri bulur (düzgün üçgen yüzlü cisimler). */
function triangles(vs: Vec3[], edge: number): number[][] {
  const out: number[][] = [];
  const close = (a: number, b: number) => Math.abs(Math.hypot(...sub(vs[a] as Vec3, vs[b] as Vec3)) - edge) < 1e-6;
  for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) for (let k = j + 1; k < vs.length; k++) {
    if (close(i, j) && close(j, k) && close(i, k)) out.push([i, j, k]);
  }
  return out;
}

const PHI = (1 + Math.sqrt(5)) / 2;
const nums = (n: number, from = 1) => Array.from({ length: n }, (_, i) => String(i + from));

function d4(): DieShape {
  const vs: Vec3[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  return makeShape(4, vs, triangles(vs, Math.sqrt(8)), [], 'vertex', nums(4));
}
function d6(): DieShape {
  const vs: Vec3[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) vs.push([x, y, z]);
  const polys: number[][] = [];
  for (let axis = 0; axis < 3; axis++) for (const s of [-1, 1]) {
    const idx = vs.map((v, i) => (v[axis] === s ? i : -1)).filter((i) => i >= 0);
    polys.push(orient(vs, idx));
  }
  // Karşılıklı yüzlerin toplamı 7 (gerçek zar gibi).
  return makeShape(6, vs, polys, ['1', '6', '2', '5', '3', '4'], 'edge');
}
function d8(): DieShape {
  const vs: Vec3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  return makeShape(8, vs, triangles(vs, Math.SQRT2), nums(8));
}
function icosaVerts(): Vec3[] {
  const vs: Vec3[] = [];
  for (const a of [-1, 1]) for (const b of [-PHI, PHI]) vs.push([0, a, b], [a, b, 0], [b, 0, a]);
  return vs;
}
function d20(): DieShape {
  const vs = icosaVerts();
  return makeShape(20, vs, triangles(vs, 2), nums(20));
}
function d12(): DieShape {
  // İkosahedronun duali: her ikosahedron köşesi bir beşgen; beşgenin köşeleri komşu üçgenlerin merkezleri.
  const iv = icosaVerts();
  const tris = triangles(iv, 2);
  const vs: Vec3[] = tris.map((t) => centroid(t.map((k) => iv[k] as Vec3)));
  const polys = iv.map((_, k) => orient(vs, tris.map((t, i) => (t.includes(k) ? i : -1)).filter((i) => i >= 0)));
  return makeShape(12, vs, polys, nums(12));
}
/** Beşgen trapezohedron (d10): iki tepe, iki halka; uçurtma yüzler düzlemsel olsun diye tepe yüksekliği hesaplanır. */
function d10(labels: string[]): DieShape {
  const ring = 0.12;
  const at = (deg: number, y: number): Vec3 => [Math.cos((deg * Math.PI) / 180), y, Math.sin((deg * Math.PI) / 180)];
  const U = (i: number) => at(72 * i, ring);
  const L = (i: number) => at(72 * i + 36, -ring);
  // Tepe: U0, L0, U1 düzleminin y eksenini kestiği yer.
  const n = cross(sub(L(0), U(0)), sub(U(1), U(0)));
  const h = dot(n, U(0)) / n[1];
  const vs: Vec3[] = [[0, Math.abs(h), 0], [0, -Math.abs(h), 0]];
  for (let i = 0; i < 5; i++) vs.push(U(i));
  for (let i = 0; i < 5; i++) vs.push(L(i));
  const u = (i: number) => 2 + (i % 5), l = (i: number) => 7 + (i % 5);
  const polys: number[][] = [];
  for (let i = 0; i < 5; i++) polys.push([0, u(i + 1), l(i), u(i)]);
  for (let i = 0; i < 5; i++) polys.push([1, l(i), u(i + 1), l(i + 1)]);
  // Etiketler üst ve alt yüzlere sırayla dağılır.
  const order = [0, 5, 1, 6, 2, 7, 3, 8, 4, 9];
  const lab: string[] = Array.from({ length: 10 }, () => '');
  order.forEach((faceIdx, k) => { lab[faceIdx] = labels[k] ?? ''; });
  // Uçurtmada yazının yukarısı tepe köşesine doğru: köşe sırası tepeyle başlıyor.
  return makeShape(10, vs, polys, lab, 'vertex');
}

const CACHE = new Map<string, DieShape>();
/** Zar türünün şekli; `variant` d100 için onlar ("00".."90") ya da birler ("0".."9") zarı. */
export function shapeOf(sides: number, variant: 'tens' | 'ones' | null = null): DieShape {
  const key = `${sides}:${variant}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const s = sides === 4 ? d4() : sides === 6 ? d6() : sides === 8 ? d8() : sides === 12 ? d12() : sides === 20 ? d20()
    : variant === 'tens' ? d10(Array.from({ length: 10 }, (_, i) => `${i}0`))
      : variant === 'ones' ? d10(Array.from({ length: 10 }, (_, i) => String(i)))
        : sides === 10 ? d10(nums(10)) : d6();
  CACHE.set(key, s);
  return s;
}

/** d100 sonucunu onlar ve birler zarına böler (100 = "00" + "0"). */
export function splitPercent(value: number): { tens: string; ones: string } {
  const ones = value % 10;
  const tens = value === 100 ? 0 : value - ones;
  return { tens: tens === 0 ? '00' : String(tens), ones: String(ones) };
}

/** Bir zar grubunun görünen zarları: d100 her değer için iki d10; ötekiler değer başına bir zar. */
export function visibleDice(sides: number, values: number[]): Array<{ shape: DieShape; label: string; valueIndex: number }> {
  if (sides === 100) {
    return values.flatMap((v, i) => {
      const p = splitPercent(v);
      return [{ shape: shapeOf(10, 'tens'), label: p.tens, valueIndex: i }, { shape: shapeOf(10, 'ones'), label: p.ones, valueIndex: i }];
    });
  }
  return values.map((v, i) => ({ shape: shapeOf(sides), label: String(v), valueIndex: i }));
}

/**
 * Zarın durduğu yönelim: istenen etiketli yüz (d4'te köşe) yukarı (+y), yazının yukarısı ekranın yukarısına (−z)
 * bakar; `yaw` küçük bir doğal sapma (radyan).
 */
export function restingQuat(shape: DieShape, label: string, yaw = 0): Quat {
  const Y: Vec3 = [0, 1, 0];
  if (shape.vertexLabels) {
    const k = shape.vertexLabels.indexOf(label);
    const v = shape.vertices[k] as Vec3;
    return mul(axisAngle(Y, yaw), fromTo(v, Y));
  }
  const face = shape.faces.find((f) => f.label === label);
  if (!face) throw new Error(`Zarda bu yüz yok: d${shape.sides} "${label}"`);
  const q1 = fromTo(face.normal, Y);
  const up = rotate(q1, face.up);
  const toScreenUp = Math.atan2(up[0], -up[2]);
  return mul(axisAngle(Y, toScreenUp + yaw), q1);
}

/** Yönelimde yukarı bakan etiket (doğrulama ve testler için). */
export function topLabel(shape: DieShape, q: Quat): string {
  const Y: Vec3 = [0, 1, 0];
  if (shape.vertexLabels) {
    let best = 0, bestY = -Infinity;
    shape.vertices.forEach((v, i) => { const y = rotate(q, v)[1]; if (y > bestY) { bestY = y; best = i; } });
    return shape.vertexLabels[best] ?? '';
  }
  let best = shape.faces[0] as Face, bestD = -Infinity;
  for (const f of shape.faces) { const d = dot(rotate(q, f.normal), Y); if (d > bestD) { bestD = d; best = f; } }
  return best.label;
}
