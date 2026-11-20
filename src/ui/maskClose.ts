/**
 * SD5: ten maskesindeki küçük delikleri kapatma (yalnız çizim tarafı; `assets/soy-maske-el/` ve otomatik maskeler değişmez).
 * Maske kenarındaki ince çatlaklar ve içerideki 1–3 piksellik boşluklar (yüz ve ellerde boyanmayan açık lekeler) morfolojik
 * kapama (genişlet, sonra aşındır; 3×3 kare, `iterations` kez) ile dolar. Eklenen piksel yalnız görselde dolu (alfa ≥ 10) ve ten
 * renginden belirgin kopmayan pikseldir (`keep`): göz akı, bebek, ağız içi gibi koyu ya da renksiz ayrıntılar delik sayılmaz.
 * Saf: DOM bilmez.
 */
import { rgbToLab } from './color';

export interface CloseOptions { iterations?: number; /** Piksel eklenebilir mi (renk/alfa koruması). */ keep?: (p: number) => boolean }

function dilate(src: Uint8Array, W: number, H: number): Uint8Array {
  const out = new Uint8Array(src.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 0;
    for (let dy = -1; dy <= 1 && !v; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= H) continue;
      for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx >= 0 && xx < W && src[yy * W + xx]) { v = 1; break; } }
    }
    out[y * W + x] = v;
  }
  return out;
}
function erode(src: Uint8Array, W: number, H: number): Uint8Array {
  const out = new Uint8Array(src.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = 1;
    for (let dy = -1; dy <= 1 && v; dy++) {
      const yy = y + dy;
      for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (yy < 0 || yy >= H || xx < 0 || xx >= W || !src[yy * W + xx]) { v = 0; break; } }
    }
    out[y * W + x] = v;
  }
  return out;
}
/** `on` (piksel başına 0/1) kapatılır; dönen dizide yeni dolan pikseller 1. Özgün dizi değişmez. */
export function closeMask(on: Uint8Array, W: number, H: number, opts: CloseOptions = {}): Uint8Array {
  const n = opts.iterations ?? 2;
  let d = on;
  for (let i = 0; i < n; i++) d = dilate(d, W, H);
  for (let i = 0; i < n; i++) d = erode(d, W, H);
  const out = Uint8Array.from(on);
  for (let p = 0; p < out.length; p++) if (!out[p] && d[p] && (!opts.keep || opts.keep(p))) out[p] = 1;
  return out;
}

/**
 * SD5/SD6: ten maskesi temizliği (çizim tarafı; dosyalar değişmez). 1) Delik kapatma: küçük boşluklar dolar; eklenen piksel görselde
 * dolu, L ≥ 30 ve renksiz beyaz/gri değil (göz akı, bebek, koyu çizgi delik sayılmaz). 2) Kenar saçağı (SD6): ten maskesine
 * bitişik, maskenin dışında kalan açık ten pikselleri (anti-alias saçağı: yanak-çene, kulak, boyun, saç çizgisi, el/parmak kenarı)
 * 1 piksel genişletmeyle maskeye alınır; yalnız ten tonunda (ortalama ten tonundan en çok 28° sapan, krosu ortalamanın yarısından
 * yüksek) ve çok açık değil/renksiz beyaz değil pikseller: gömlek yakası, manşet, dantel, göz akı, diş ve gerçek vurgular dokunulmaz.
 * Elle maskede eklenen piksel tam ağırlık alır.
 */
export function closeSkinHoles(data: Uint8ClampedArray, mask: Uint8Array | undefined, weights: Uint8Array | undefined, W: number, H: number): { mask?: Uint8Array; weights?: Uint8Array } {
  const base = mask ?? Uint8Array.from(weights as Uint8Array, (w) => (w > 0 ? 1 : 0));
  const lab = (p: number) => rgbToLab(data[p * 4] ?? 0, data[p * 4 + 1] ?? 0, data[p * 4 + 2] ?? 0);
  const keep = (p: number) => {
    if ((data[p * 4 + 3] ?? 0) < 10) return false;
    const [L, a, b] = lab(p);
    return L >= 30 && !(L > 80 && Math.hypot(a, b) < 6);
  };
  const closed = closeMask(base, W, H, { keep });
  // Kenar saçağı: ten ortalaması (ton, kroma).
  let sa = 0, sb = 0, sc = 0, n = 0;
  for (let p = 0; p < closed.length; p++) if (closed[p] && (data[p * 4 + 3] ?? 0) >= 10) { const [, a, b] = lab(p); sa += a; sb += b; sc += Math.hypot(a, b); n++; }
  const out = Uint8Array.from(closed);
  if (n > 0) {
    const mh = (Math.atan2(sb, sa) * 180) / Math.PI, mc = sc / n;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (closed[p] || (data[p * 4 + 3] ?? 0) < 10) continue;
      let nb = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if ((dx || dy) && xx >= 0 && xx < W && yy >= 0 && yy < H && closed[yy * W + xx]) nb++;
      }
      if (nb < 2) continue;
      const [L, a, b] = lab(p);
      const c = Math.hypot(a, b);
      const dh = Math.abs((((Math.atan2(b, a) * 180) / Math.PI - mh + 540) % 360) - 180);
      if (L < 45 || L > 94 || c < mc * 0.5 || dh > 28 || (L > 80 && c < 10)) continue;
      out[p] = 1;
    }
  }
  if (mask) return { mask: out };
  const w2 = Uint8Array.from(weights as Uint8Array);
  for (let p = 0; p < out.length; p++) if (out[p] && !base[p]) w2[p] = 255;
  return { weights: w2 };
}

/** Ten renk kutusu: Lab açıklık ve kroma aralığı, ton aralıkları (derece; `lo > hi` 360°'yi sarar). */
export interface SkinBox { L: readonly number[]; C: readonly number[]; h: ReadonlyArray<readonly number[]> }

/**
 * TB1/TG1: ten maskesi onarımı ayarı (`data/soy-renkleri.json` `races.<ırk>.temizlik`; ten renk kutusu aynı ırkın `mask` kaydı,
 * `temizlik.kutu` varsa o). Piksel değerleri `temizlik.referans` genişlikli jeton içindir (`skinFixParams` küçük kopyaya ölçekler).
 */
export interface SkinFixCfg {
  mask: SkinBox;
  temizlik: {
    referans: number;
    /** İsteğe bağlı: delik/kapama için ten renk kutusu (yoksa ırkın `mask` kutusu). Goliath: parlak göz akı/rün pikselleri dışarıda kalsın diye dar. */
    kutu?: SkinBox;
    /** Delik onarımı: kapama tekrarı, en büyük çevrelenmiş boşluk (piksel), eklenen / özgün maske sınırı. */
    delik: { kapama: number; enCok: number; ekleOrani: number };
    /**
     * Gölge bandı (TG1, Tiefling boynuz/kuyruk gölge yarısı; yoksa yapılmaz, elle maskede hiç yapılmaz): maskeye bitişik, koyu ve aynı
     * ton ailesindeki piksellerin bileşeni maskeye katılır. Aday piksel: maske ortalama tonundan en çok `ton` derece, kroma `kroma`
     * aralığında, açıklık `Lalt` (altı kontur mürekkebi) ile maske ortalama açıklığı + `Lust` arasında. Bileşen kabulü: en çok `enCok`
     * piksel, her pikseli maskeye en çok `kalinlik` uzak (Chebyshev), maskeye bitişik en az `temas` piksel, ortalama tonu bitişik
     * maske piksellerinin ortalama tonundan en çok `tonKomsu` derece, dış sınırının en az `kontur` payı kontur mürekkebi ya da şeffaf.
     * `kromaKomsu` (yoksa 0): bitişik maske piksellerinin ortalama kroması en az bu değer olmalı; maske gerçek (doygun) ten değil
     * zırh, cüppe ya da saç kenarına oturmuşsa (kroma ≈ 16–24; ten ≈ 40+) bileşen katılmaz, yanlış maske büyümez.
     */
    golge?: { ton: number; tonKomsu: number; kroma: readonly number[]; Lalt: number; Lust: number; kalinlik: number; temas: number; kontur: number; enCok: number; kromaKomsu?: number };
    /** Vurgu onarımı (yoksa yapılmaz): açıklık eşiği, en büyük parça (piksel), komşuluğun en az bu payı maskede olmalı (çevrelenmişlik). */
    vurgu?: { L: number; boyut: number; cevre: number };
  };
}

/** Jeton genişliğine göre ölçeklenmiş parametreler (`s = W / referans`): uzunluklar s ile, alanlar s² ile; hepsi en az 1. */
export function skinFixParams(t: SkinFixCfg['temizlik'], W: number) {
  const s = W / t.referans, one = (v: number) => Math.max(1, v), g = t.golge, v = t.vurgu;
  return {
    kapama: one(Math.round(t.delik.kapama * s)),
    enCok: one(Math.round(t.delik.enCok * s * s)),
    ekleOrani: t.delik.ekleOrani,
    golge: g ? {
      ton: g.ton, tonKomsu: g.tonKomsu, kromaAlt: g.kroma[0] as number, kromaUst: g.kroma[1] as number, Lalt: g.Lalt, Lust: g.Lust,
      kalinlik: one(Math.ceil(g.kalinlik * s)), temas: one(Math.round(g.temas * s)), kontur: g.kontur, enCok: one(Math.round(g.enCok * s * s)),
      kromaKomsu: g.kromaKomsu ?? 0,
    } : undefined,
    vurgu: v ? { L: v.L, boyut: one(Math.round(v.boyut * s * s)), cevre: v.cevre } : undefined,
  };
}

/** Maske olmayan piksellerden görüntü kenarına 4-bağlantıyla ulaşılamayanlar: maskenin çevrelediği delikler (kenar dışı sayılmaz). */
function enclosedHoles(on: Uint8Array, W: number, H: number): Uint8Array {
  const reach = new Uint8Array(on.length), stack: number[] = [];
  const push = (p: number) => { if (!on[p] && !reach[p]) { reach[p] = 1; stack.push(p); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const p = stack.pop() as number, x = p % W, y = (p - x) / W;
    if (x > 0) push(p - 1);
    if (x < W - 1) push(p + 1);
    if (y > 0) push(p - W);
    if (y < H - 1) push(p + W);
  }
  return Uint8Array.from(on, (v, p) => (!v && !reach[p] ? 1 : 0));
}

/** 8-bağlantılı bileşen etiketleri (1…n; 0 = arka plan) ve bileşen boyutları (`sizes[etiket]`). */
function label8(on: Uint8Array, W: number, H: number): { id: Int32Array; sizes: number[] } {
  const id = new Int32Array(on.length), sizes = [0], stack: number[] = [];
  for (let s = 0; s < on.length; s++) {
    if (!on[s] || id[s]) continue;
    const k = sizes.length;
    let n = 0;
    id[s] = k; stack.push(s);
    while (stack.length) {
      const p = stack.pop() as number, x = p % W, y = (p - x) / W;
      n++;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx < 0 || xx >= W) continue; const q = yy * W + xx; if (on[q] && !id[q]) { id[q] = k; stack.push(q); } }
      }
    }
    sizes.push(n);
  }
  return { id, sizes };
}

type Shadow = NonNullable<ReturnType<typeof skinFixParams>['golge']>;

/** Çok kaynaklı genişlik-öncelikli tarama (8 komşu): her pikselin `on` piksellerine Chebyshev uzaklığı (on = 0). */
function chebyshevDist(on: Uint8Array, W: number, H: number): Int32Array {
  const d = new Int32Array(on.length).fill(-1), q = new Int32Array(on.length);
  let head = 0, tail = 0;
  for (let p = 0; p < on.length; p++) if (on[p]) { d[p] = 0; q[tail++] = p; }
  while (head < tail) {
    const p = q[head++] as number, x = p % W, y = (p - x) / W, nd = (d[p] as number) + 1;
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= H) continue;
      for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx < 0 || xx >= W) continue; const r = yy * W + xx; if (d[r] === -1) { d[r] = nd; q[tail++] = r; } }
    }
  }
  return d;
}

const hueOf = (a: number, b: number) => ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
const hueDiff = (x: number, y: number) => Math.abs((((x - y + 180) % 360) + 360) % 360 - 180);

/** TG1 gölge bandı (bkz. `SkinFixCfg.temizlik.golge`): `m1`'in kopyasına kabul edilen bileşenleri ekleyip döner. */
function growShadow(m1: Uint8Array, W: number, H: number, G: Shadow, Ls: Float64Array, As: Float64Array, Bs: Float64Array, body: Uint8Array, vis: Uint8Array): Uint8Array {
  const N = W * H, out = Uint8Array.from(m1);
  let sa = 0, sb = 0, sl = 0, n = 0;
  for (let p = 0; p < N; p++) if (m1[p] && vis[p]) { sa += As[p] as number; sb += Bs[p] as number; sl += Ls[p] as number; n++; }
  if (n === 0) return out;
  const h0 = hueOf(sa, sb), Lm = sl / n;
  const cand = new Uint8Array(N), ink = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    const L = Ls[p] as number;
    ink[p] = !body[p] || L < G.Lalt ? 1 : 0;
    if (!body[p] || m1[p]) continue;
    const a = As[p] as number, b = Bs[p] as number, C = Math.hypot(a, b);
    if (L < G.Lalt || L > Lm + G.Lust || C < G.kromaAlt || C > G.kromaUst) continue;
    if (hueDiff(hueOf(a, b), h0) <= G.ton) cand[p] = 1;
  }
  const dist = chebyshevDist(m1, W, H), lab = label8(cand, W, H), members: number[][] = [];
  for (let p = 0; p < N; p++) { const k = lab.id[p] as number; if (k && (lab.sizes[k] as number) <= G.enCok) (members[k] ??= []).push(p); }
  const adjSeen = new Int32Array(N), outSeen = new Int32Array(N);
  members.forEach((mem, k) => {
    let maxd = 0, touch = 0;
    for (const p of mem) { const d = dist[p] as number; if (d > maxd) maxd = d; if (d === 1) touch++; }
    if (maxd > G.kalinlik || touch < G.temas) return;
    let adjA = 0, adjB = 0, adjC = 0, adjN = 0, outN = 0, outInk = 0, cA = 0, cB = 0;
    for (const p of mem) {
      cA += As[p] as number; cB += Bs[p] as number;
      const x = p % W, y = (p - x) / W;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= W) continue;
          const q = yy * W + xx;
          if (lab.id[q] === k) continue;
          if (m1[q]) { if (adjSeen[q] !== k) { adjSeen[q] = k; adjA += As[q] as number; adjB += Bs[q] as number; adjC += Math.hypot(As[q] as number, Bs[q] as number); adjN++; } }
          else if (outSeen[q] !== k) { outSeen[q] = k; outN++; outInk += ink[q] as number; }
        }
      }
    }
    if (adjN === 0 || hueDiff(hueOf(cA, cB), hueOf(adjA, adjB)) > G.tonKomsu) return;
    if (adjC / adjN < G.kromaKomsu) return; // bitişik maske doygun ten değil (zırh, cüppe, saç kenarı): yanlış maskeyi büyütme
    if (outN > 0 && outInk / outN < G.kontur) return;
    for (const p of mem) out[p] = 1;
  });
  return out;
}

/**
 * TB1/TG1: ten maskesi onarımı (Tiefling, Goliath). Otomatik ten maskesi (`npm run soy-maske`) açıklık/kroma/ton kutusu ve ΔE eşiğiyle
 * (yalnız en parlak palet kümelerine, `bright`) seçtiği için 1) gölgedeki koyu/orta ten pikselleri maskenin içinde delik ya da kenarında
 * çentik olarak, 2) boynuz/kuyruk/kol gibi yapıların gölge yarısı bütünüyle dışarıda kalır ("yarı boyalı"); boyanmayan bu pikseller soy
 * renginin yanında özgün tonda (şarap kırmızısı, pembe, gri) durur; 3) maske açıklık sınırının üstündeki 1–3 piksellik parlamalar
 * maskenin içinde açık benek kalır. Çizim tarafında, dosyalar değişmeden:
 * - Delik: 1 piksellik kapama boşlukları, ardından (kapanmış maskenin) tamamen çevrelediği küçük boşluklar (`delik.enCok`;
 *   4-bağlantılı arka plan taraması), yalnız ten renk kutusundaki pikseller için maskeye alınır. Kapama eklentisi özgün maskenin
 *   `ekleOrani`'nı aşarsa (ince yapı: kapama boynuz/kuyruk ucunu kalınlaştırmasın) kapama yapılmaz, yalnız çevrelenmiş delikler
 *   dolar (jeton bazında sınır).
 * - Gölge bandı (`golge`, yalnız ikili maskede; elle maske `weights` önceliklidir, dokunulmaz): maskeye bitişik koyu, aynı ton
 *   ailesinde, kontur mürekkebiyle sınırlı ince bandın bileşeni maskeye katılır (ayrıntı `SkinFixCfg.temizlik.golge`). Göz, kıyafet,
 *   saç, zırh, rün gibi ton ailesi dışındaki ya da maskeden uzağa uzanan (kalın/büyük) bölgeler bileşen olarak elenir; bitişik maske
 *   doygun ten değilse (`kromaKomsu`: otomatik maske zırh/cüppe/saç kenarına oturmuş jeton) hiç büyütme yapılmaz.
 * - Vurgu (`vurgu`): kapanmış maskenin tamamen çevrelediği (komşu gövde piksellerinin ≥ `cevre` payı maskede), açık (L ≥ `vurgu.L`) 1–3
 *   pikselli benek maskeye alınır (boyama açıklığı korur, tonu soya kaydırır). Göz, diş, zırh/kıyafet parlaması, mürekkep ve büyük
 *   açık ayrıntılar maskeyle çevrili olmadığından ya da büyük olduğundan dokunulmaz. Kaydı olmayan ırkta (Goliath) yapılmaz.
 * Elle maskede (`weights`) eklenen piksel tam ağırlık alır. Boyama yolu aynıdır (`tintPixels`); bu adım yalnız seçimi düzeltir.
 */
export function fixSkinMask(data: Uint8ClampedArray, mask: Uint8Array | undefined, weights: Uint8Array | undefined, W: number, H: number, cfg: SkinFixCfg): { mask?: Uint8Array; weights?: Uint8Array } {
  const P = skinFixParams(cfg.temizlik, W), N = W * H;
  const base = mask ?? Uint8Array.from(weights as Uint8Array, (w) => (w > 0 ? 1 : 0));
  const box = cfg.temizlik.kutu ?? cfg.mask;
  // Piksel başına Lab (alfa ≥ 10), ten renk kutusu (ok), gövde (alfa ≥ 128).
  const Ls = new Float64Array(N), As = new Float64Array(N), Bs = new Float64Array(N), ok = new Uint8Array(N), body = new Uint8Array(N), vis = new Uint8Array(N);
  const [l0, l1] = box.L as [number, number], [c0, c1] = box.C as [number, number];
  for (let p = 0; p < N; p++) {
    const al = data[p * 4 + 3] ?? 0;
    if (al < 10) continue;
    const [L, a, b] = rgbToLab(data[p * 4] ?? 0, data[p * 4 + 1] ?? 0, data[p * 4 + 2] ?? 0);
    Ls[p] = L; As[p] = a; Bs[p] = b; vis[p] = 1;
    if (al >= 128) body[p] = 1;
    const C = Math.hypot(a, b);
    if (L < l0 || L > l1 || C < c0 || C > c1) continue;
    const h = hueOf(a, b);
    if (box.h.some((r) => ((r[0] as number) <= (r[1] as number) ? h >= (r[0] as number) && h <= (r[1] as number) : h >= (r[0] as number) || h <= (r[1] as number)))) ok[p] = 1;
  }
  // 1) Delik: önce 1 piksellik kapama boşlukları (yalnız ten renk kutusundaki pikseller), sonra kapanmış maskenin çevrelediği küçük
  // boşluklar (kapama ince kanalları kapatınca açık görünen boşluk çevrelenir: tek geçişte biter). Kapama eklentisi özgün maskenin
  // `ekleOrani`'nı aşarsa (ince yapı: boynuz/kuyruk ucu) kapama yapılmaz, yalnız çevrelenmiş delikler dolar.
  const closed = closeMask(base, W, H, { iterations: P.kapama, keep: (p) => ok[p] === 1 });
  let baseN = 0, gapN = 0;
  for (let p = 0; p < N; p++) { baseN += base[p] as number; gapN += closed[p] && !base[p] ? 1 : 0; }
  const ma = gapN > P.ekleOrani * Math.max(1, baseN) ? base : closed;
  const holes = label8(enclosedHoles(ma, W, H), W, H);
  const m1 = Uint8Array.from(ma);
  for (let p = 0; p < N; p++) { const k = holes.id[p] as number; if (k && ok[p] && (holes.sizes[k] as number) <= P.enCok) m1[p] = 1; }
  // 2) Gölge bandı: yalnız ikili (otomatik) maskede; elle maske (`weights`) önceliklidir.
  const m2 = P.golge && mask ? growShadow(m1, W, H, P.golge, Ls, As, Bs, body, vis) : m1;
  // 3) Vurgu: kapanmış maskenin tamamen çevrelediği, maske açıklık sınırının üstünde kalan 1–3 pikselli açık benek.
  const out = Uint8Array.from(m2);
  const V = P.vurgu;
  if (V) {
    const lab = label8(Uint8Array.from(m2, (v, p) => (!v && body[p] && (Ls[p] as number) >= V.L ? 1 : 0)), W, H);
    const members: number[][] = [], seen = new Int32Array(N);
    for (let p = 0; p < N; p++) { const k = lab.id[p] as number; if (k && (lab.sizes[k] as number) <= V.boyut) (members[k] ??= []).push(p); }
    members.forEach((mem, k) => {
      let n = 0, inMask = 0;
      for (const p of mem) {
        const x = p % W, y = (p - x) / W;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
          const q = yy * W + xx;
          if (lab.id[q] === k || seen[q] === k) continue;
          seen[q] = k;
          if (body[q]) { n++; inMask += m2[q] as number; }
        }
      }
      if (n > 0 && inMask / n >= V.cevre) for (const p of mem) out[p] = 1;
    });
  }
  if (mask) return { mask: out };
  const w2 = Uint8Array.from(weights as Uint8Array);
  for (let p = 0; p < N; p++) if (out[p] && !base[p]) w2[p] = 255;
  return { weights: w2 };
}
