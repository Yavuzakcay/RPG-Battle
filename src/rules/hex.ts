/**
 * Altıgen ızgara geometrisi: düz üstlü (flat-top) altıgenler, odd-q offset düzeni.
 * Koordinatlar 0 tabanlıdır (kullanıcıya gösterilirken 1 eklenir). 0 tabanlı tek
 * numaralı sütunlar yarım altıgen aşağı kayıktır. Saf fonksiyonlar: harita biçimini
 * ve savaş durumunu bilmez; zemin maliyeti dışarıdan verilir.
 */

/** Satır/sütun koordinatı (0 tabanlı). */
export interface Offset {
  col: number;
  row: number;
}

/** Eksenel (axial) koordinat: mesafe ve yön hesapları burada yapılır. */
export interface Axial {
  q: number;
  r: number;
}

/** Izgara boyutu (sütun × satır). */
export interface GridSize {
  cols: number;
  rows: number;
}

/** Eksenel koordinatta 6 komşu yönü (sırası sabit, yol bulmada eşitlikleri belirler). */
export const AXIAL_DIRECTIONS: readonly Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function offsetToAxial(o: Offset): Axial {
  return { q: o.col, r: o.row - (o.col - (o.col & 1)) / 2 };
}

export function axialToOffset(a: Axial): Offset {
  return { col: a.q, row: a.r + (a.q - (a.q & 1)) / 2 };
}

/** Haritada anahtar olarak kullanılacak metin ("col,row"). */
export const hexKey = (o: Offset): string => `${o.col},${o.row}`;

export const sameHex = (a: Offset, b: Offset): boolean => a.col === b.col && a.row === b.row;

export function isInside(o: Offset, size: GridSize): boolean {
  return o.col >= 0 && o.row >= 0 && o.col < size.cols && o.row < size.rows;
}

export function axialDistance(a: Axial, b: Axial): number {
  const dq = b.q - a.q;
  const dr = b.r - a.r;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

/** İki altıgen arası adım sayısı (1 altıgen = 5 ft). */
export function distance(a: Offset, b: Offset): number {
  return axialDistance(offsetToAxial(a), offsetToAxial(b));
}

const addAxial = (a: Axial, b: Axial, k = 1): Axial => ({ q: a.q + b.q * k, r: a.r + b.r * k });

/** Komşular; ızgara verilirse dışarıda kalanlar atılır. */
export function neighbors(o: Offset, size?: GridSize): Offset[] {
  const a = offsetToAxial(o);
  return AXIAL_DIRECTIONS.map((d) => axialToOffset(addAxial(a, d))).filter((n) => !size || isInside(n, size));
}

/** Merkezden tam olarak `radius` uzaklıktaki altıgenler (radius 0 ise yalnızca merkez). */
export function ring(center: Offset, radius: number, size?: GridSize): Offset[] {
  if (radius === 0) return !size || isInside(center, size) ? [center] : [];
  const out: Offset[] = [];
  // 4. yönde `radius` adım gidip halkayı 6 kenar boyunca dolaş.
  let cur = addAxial(offsetToAxial(center), AXIAL_DIRECTIONS[4] as Axial, radius);
  for (const dir of AXIAL_DIRECTIONS) {
    for (let i = 0; i < radius; i++) {
      out.push(axialToOffset(cur));
      cur = addAxial(cur, dir);
    }
  }
  return size ? out.filter((o) => isInside(o, size)) : out;
}

/** Merkezden en fazla `radius` uzaklıktaki tüm altıgenler (merkez dahil). */
export function withinRange(center: Offset, radius: number, size?: GridSize): Offset[] {
  const out: Offset[] = [];
  for (let k = 0; k <= radius; k++) out.push(...ring(center, k, size));
  return out;
}

function roundAxial(q: number, r: number): Axial {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  // -0 yerine 0 (karşılaştırmalar ve anahtarlar için).
  return { q: rq + 0, r: rr + 0 };
}

/**
 * İki altıgen arasındaki düz çizgi (başlangıç ve bitiş dahil), görüş hattı için.
 * Tam köşeden geçen çizgilerde sonucun her seferinde aynı olması için küçük, sabit
 * bir kaydırma uygulanır.
 */
export function line(a: Offset, b: Offset): Offset[] {
  const A = offsetToAxial(a);
  const B = offsetToAxial(b);
  const n = axialDistance(A, B);
  if (n === 0) return [a];
  const out: Offset[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const q = A.q + 1e-6 + (B.q - A.q) * t;
    const r = A.r + 1e-6 + (B.r - A.r) * t;
    out.push(axialToOffset(roundAxial(q, r)));
  }
  return out;
}

/**
 * `a`dan `b`ye düz bir eksen boyunca gidiliyorsa yön numarası (AXIAL_DIRECTIONS
 * indeksi), değilse null. Atlama gibi düz hareket kuralları için.
 */
export function directionTo(a: Offset, b: Offset): number | null {
  const A = offsetToAxial(a);
  const B = offsetToAxial(b);
  const n = axialDistance(A, B);
  if (n === 0) return null;
  const dq = (B.q - A.q) / n;
  const dr = (B.r - A.r) / n;
  const i = AXIAL_DIRECTIONS.findIndex((d) => d.q === dq && d.r === dr);
  return i === -1 ? null : i;
}

/** Bir altıgene girmenin maliyeti (adım sayısı); null ise girilemez. */
export type EnterCost = (o: Offset) => number | null;

export interface PathResult {
  /** Başlangıç hariç, sırayla girilen altıgenler. */
  path: Offset[];
  /** Toplam hareket maliyeti (altıgen cinsinden). */
  cost: number;
}

/**
 * En ucuz yol (Dijkstra). Maliyeti `enterCost` verir: normal 1, zorlu zemin 2,
 * engel null. `maxCost` verilirse bütçeyi aşan yollar hiç aranmaz. Eşit maliyetli
 * yollar arasında seçim sabittir (komşu sırası ve keşif sırasına göre).
 */
export function findPath(
  from: Offset,
  to: Offset,
  size: GridSize,
  enterCost: EnterCost,
  maxCost = Infinity,
): PathResult | null {
  if (!isInside(from, size) || !isInside(to, size)) return null;
  if (sameHex(from, to)) return { path: [], cost: 0 };
  const best = new Map<string, number>([[hexKey(from), 0]]);
  const prev = new Map<string, Offset>();
  const done = new Set<string>();
  const open: Array<{ hex: Offset; cost: number; seq: number }> = [{ hex: from, cost: 0, seq: 0 }];
  let seq = 1;
  while (open.length > 0) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      const o = open[i] as (typeof open)[number];
      const b = open[bi] as (typeof open)[number];
      if (o.cost < b.cost || (o.cost === b.cost && o.seq < b.seq)) bi = i;
    }
    const cur = open.splice(bi, 1)[0] as (typeof open)[number];
    const ck = hexKey(cur.hex);
    if (done.has(ck)) continue;
    done.add(ck);
    if (sameHex(cur.hex, to)) {
      const path: Offset[] = [];
      let k: Offset | undefined = cur.hex;
      while (k && !sameHex(k, from)) {
        path.unshift(k);
        k = prev.get(hexKey(k));
      }
      return { path, cost: cur.cost };
    }
    for (const n of neighbors(cur.hex, size)) {
      const nk = hexKey(n);
      if (done.has(nk)) continue;
      const step = enterCost(n);
      if (step === null) continue;
      const cost = cur.cost + step;
      if (cost > maxCost) continue;
      if (cost < (best.get(nk) ?? Infinity)) {
        best.set(nk, cost);
        prev.set(nk, cur.hex);
        open.push({ hex: n, cost, seq: seq++ });
      }
    }
  }
  return null;
}
