/** Zar animasyonu için küçük vektör ve dördey (quaternion) matematiği (three.js'ten bağımsız; testlerde de çalışır). */
export type Vec3 = [number, number, number];
/** [x, y, z, w] */
export type Quat = [number, number, number, number];

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: Vec3): Vec3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

export const IDENTITY: Quat = [0, 0, 0, 1];

export function axisAngle(axis: Vec3, angle: number): Quat {
  const [x, y, z] = norm(axis);
  const s = Math.sin(angle / 2);
  return [x * s, y * s, z * s, Math.cos(angle / 2)];
}

/** a * b (önce b, sonra a uygulanır). */
export function mul(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export function rotate(q: Quat, v: Vec3): Vec3 {
  const [x, y, z, w] = q;
  const u: Vec3 = [x, y, z];
  const t = scale(cross(u, v), 2);
  return add(add(v, scale(t, w)), cross(u, t));
}

/** `from` birim vektörünü `to` birim vektörüne döndüren en kısa dönüş. */
export function fromTo(from: Vec3, to: Vec3): Quat {
  const a = norm(from), b = norm(to);
  const d = dot(a, b);
  if (d > 0.999999) return IDENTITY;
  if (d < -0.999999) {
    const ortho = Math.abs(a[0]) < 0.9 ? cross(a, [1, 0, 0]) : cross(a, [0, 1, 0]);
    return axisAngle(ortho, Math.PI);
  }
  const c = cross(a, b);
  const q: Quat = [c[0], c[1], c[2], 1 + d];
  const l = Math.hypot(...q);
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
}

/** Tohumlu, tekrarlanabilir sözde rastgele (görsel çeşitlilik; oyun zarlarıyla ilgisi yok). */
export function visualRandom(seed: number): () => number {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
