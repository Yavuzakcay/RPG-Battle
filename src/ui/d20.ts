/**
 * Açılış ekranının 3D d20'si (Görev L2), saf geometri: ikosahedron, yüz numaraları (karşılıklı yüzler toplamı 21),
 * 20 yüzünü kameraya baktıran son yönelim, dönüş anahtar kareleri (CSS matrix3d) ve izdüşüm ölçüsü. Çizim yalnızca
 * CSS 3D (`preserve-3d`, her yüz bir div); canvas/WebGL yok. Koordinatlar CSS uzayında: x sağ, y aşağı, z izleyiciye.
 * Kenar uzunluğu 1 (CSS'te 1em): yüz div'i 1em × (√3/2)em üçgen, `translate3d(em) matrix3d(dönme)` ile yerine oturur.
 */
export type Vec = [number, number, number];
export type Mat = [Vec, Vec, Vec]; // satırlar

const PHI = (1 + Math.sqrt(5)) / 2;
export const TRI_H = Math.sqrt(3) / 2;

const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec): Vec => mul(a, 1 / Math.hypot(...a));
export const apply = (m: Mat, v: Vec): Vec => [dot(m[0], v), dot(m[1], v), dot(m[2], v)];
const matMul = (a: Mat, b: Mat): Mat => {
  const col = (j: 0 | 1 | 2): Vec => [b[0][j], b[1][j], b[2][j]];
  return a.map((row) => [dot(row, col(0)), dot(row, col(1)), dot(row, col(2))]) as Mat;
};

/** Eksen etrafında dönme (Rodrigues), açı radyan. */
export function rotation(axis: Vec, angle: number): Mat {
  const [x, y, z] = norm(axis);
  const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  return [
    [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
    [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
    [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
  ];
}

/** İkosahedron köşeleri, kenar 1. */
export const VERTICES: Vec[] = ([
  [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
  [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
  [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
] as Vec[]).map((v) => mul(v, 0.5));

export interface Face {
  /** Köşe sırası: tepe (A), sağ alt (B), sol alt (C); yerel x × y = dış normal. */
  v: [number, number, number];
  normal: Vec;
  centroid: Vec;
  number: number;
}

/** 20 yüz: birbirine 1 uzaklıkta üç köşe. */
function rawFaces(): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  const near = (i: number, j: number) => Math.abs(Math.hypot(...sub(VERTICES[i]!, VERTICES[j]!)) - 1) < 1e-9;
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) {
    if (near(i, j) && near(j, k) && near(i, k)) out.push([i, j, k]);
  }
  return out;
}

/** Yüzün yerleşimi: O (yüz div'inin sol üst köşesi), U (yerel x), V (yerel y), N (dış normal). */
export function faceFrame(f: Pick<Face, 'v'>): { O: Vec; U: Vec; V: Vec; N: Vec } {
  const [A, B, C] = f.v.map((i) => VERTICES[i]!) as [Vec, Vec, Vec];
  const U = sub(B, C);
  const O = sub(A, mul(U, 0.5));
  const V = mul(sub(C, O), 1 / TRI_H);
  return { O, U, V, N: cross(U, V) };
}

/** Logodaki d20'nin 20 çevresi (20 tepesi yukarıda; açı ekran derecesi, y aşağı): komşu numaralar ve yönleri. */
const AROUND_20: Array<[number, number]> = [
  [6, 90], [2, -150], [14, -30], // kenar komşuları: alt, sol üst, sağ üst
  [18, -110], [4, -70], // tepe köşesi
  [12, 170], [10, 130], // sol alt köşe
  [8, 10], [16, 50], // sağ alt köşe
];

/** Tüm geometri: yüzler (numaralı), 20 yüzünü öne ve tepesini yukarı getiren son yönelim R0. */
export function d20(): { faces: Face[]; R0: Mat } {
  const faces: Face[] = rawFaces().map(([a, b, c]) => {
    let f = { v: [a, b, c] as [number, number, number] };
    let fr = faceFrame(f);
    const centroid = mul(add(add(VERTICES[a]!, VERTICES[b]!), VERTICES[c]!), 1 / 3);
    if (dot(fr.N, centroid) < 0) { f = { v: [a, c, b] }; fr = faceFrame(f); }
    return { v: f.v, normal: norm(fr.N), centroid, number: 0 };
  });
  // 20: ilk yüz. Son yönelim: normali +z (izleyici), tepesi (A) ekranda yukarı (−y).
  const f20 = faces[0]!;
  const up = norm(sub(VERTICES[f20.v[0]]!, f20.centroid));
  const zb = f20.normal, yb = mul(up, -1), xb = cross(yb, zb);
  const R0: Mat = [xb, yb, zb];
  f20.number = 20;
  const opposite = (f: Face) => faces.find((g) => dot(g.normal, f.normal) < -0.999)!;
  opposite(f20).number = 1;
  // Ön yarıdaki diğer 9 yüz: ekran açısına en yakın beklenen numara (logodaki dizilim); karşılığı 21 − n.
  const front = faces.filter((f) => f !== f20 && dot(apply(R0, f.normal), [0, 0, 1]) > 0.01);
  const free = [...AROUND_20];
  for (const f of front.sort((a, b) => angleOf(R0, a) - angleOf(R0, b))) {
    const ang = angleOf(R0, f);
    let best = 0;
    free.forEach(([, e], i) => { if (angDist(ang, e) < angDist(ang, free[best]![1])) best = i; });
    const [n] = free.splice(best, 1)[0]!;
    f.number = n;
    opposite(f).number = 21 - n;
  }
  return { faces, R0 };
}
const angleOf = (R0: Mat, f: Face) => { const c = apply(R0, f.centroid); return (Math.atan2(c[1], c[0]) * 180) / Math.PI; };
const angDist = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

const n6 = (x: number) => (Math.abs(x) < 1e-9 ? 0 : Math.round(x * 1e6) / 1e6);
/** Dönme matrisi → CSS matrix3d (sütun sıralı). */
export const cssMatrix = (m: Mat): string =>
  `matrix3d(${[m[0][0], m[1][0], m[2][0], 0, m[0][1], m[1][1], m[2][1], 0, m[0][2], m[1][2], m[2][2], 0, 0, 0, 0, 1].map(n6).join(',')})`;

/**
 * Yüz div'inin dönüşümü (gövdenin içinde, transform-origin 0 0). `pad` em: div üçgenden bu kadar geniş (saydam pay;
 * üçgenin kenarı katman sınırına denk gelmesin, kenar yumuşatması doku içinde kalsın).
 */
export function faceTransform(f: Face, pad = 0): string {
  const fr = faceFrame(f);
  const { U, V, N } = fr;
  const O = sub(sub(fr.O, mul(U, pad)), mul(V, pad));
  const m: Mat = [[U[0], V[0], N[0]], [U[1], V[1], N[1]], [U[2], V[2], N[2]]];
  return `translate3d(${n6(O[0])}em,${n6(O[1])}em,${n6(O[2])}em) ${cssMatrix(m)}`;
}

/** Yüz parlaklığı (son yönelimde sol üstten ışık; dönüşte yüzle birlikte döner): 0,55–1,15. */
export function faceShade(f: Face, R0: Mat): number {
  const light = norm([-0.35, -0.7, 0.62]);
  return Math.round((0.55 + 0.6 * Math.max(0, dot(apply(R0, f.normal), light))) * 100) / 100;
}

/**
 * Dönüş: kalan açı Φ(1 − t²) (ease-in: yavaş başlar, sonda hızlı), eğik ve zamanla kayan eksen; son karede R0.
 * Anahtar kareler eşit açı adımında (ardışık iki yönelim arası < 70°, matris ara değeri doğru yönde döner);
 * kareler arası doğrusal. `turns` tam tur sayısı.
 */
export function spinFrames(R0: Mat, turns: number, steps = 30): Array<{ at: number; m: Mat }> {
  const total = turns * 2 * Math.PI;
  const out: Array<{ at: number; m: Mat }> = [];
  for (let i = 0; i <= steps; i++) {
    const t = Math.sqrt(i / steps);
    const axis: Vec = [0.45 + 0.3 * Math.sin(2.2 * t + 0.4), 1, 0.25 + 0.35 * Math.cos(1.7 * t)];
    const rem = total * (1 - t * t);
    out.push({ at: t, m: i === steps ? R0 : matMul(rotation(axis, -rem), R0) });
  }
  return out;
}

/** CSS @keyframes metni. */
export function spinKeyframes(name: string, R0: Mat, turns: number): string {
  return `@keyframes ${name}{${spinFrames(R0, turns).map((f) => `${Math.round(f.at * 100000) / 1000}%{transform:${cssMatrix(f.m)}}`).join('')}}`;
}

/**
 * Son yönelimde zarın ekrandaki sınırı (kenar = 1em; perspektif `p` em, z izleyiciye): en, boy ve merkez kayması.
 * Logodaki zarın ölçüsüne oturtmak için kullanılır.
 */
export function projectedBox(R0: Mat, p: number): { w: number; h: number; cx: number; cy: number } {
  const pts = VERTICES.map((v) => { const r = apply(R0, v); const k = p / (p - r[2]); return [r[0] * k, r[1] * k]; });
  const xs = pts.map((q) => q[0]!), ys = pts.map((q) => q[1]!);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
