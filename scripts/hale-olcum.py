#!/usr/bin/env python3
"""Celestial final kontrolü için hale ölçümü (yalnız ölçüm; jeton değiştirmez). İki yöntem, büyük skor kazanır:
- halka: başın tepesine yakın (üst satırdan en çok 14 px aşağı) altın/açık renkli bileşen; yatay (en/boy ≥ 1,8), ince (kalınlık ≤ 4,5), içi boş (doluluk ≤ 0,6),
  elips açısal kapsaması ve içinin/üstünün saydamlığı. Skor = kapsama × iç saydamlık (havada halka) ya da üst yay × üst saydamlık (başa değen halka).
- sütun: baş merkezi ±45 sütunda en üst opak dilim ince (≤ 6 px) ve altında saydam boşluk; ≥ 14 sütun kesintisiz düzgün yay. Skor = min(1, yay eni / 24).
Kalibrasyon (2026-11-19): git 2151397 "haleli" 149 orijinalin 91–99'u (etiketin bir kısmı gözle halesiz), gözle halesiz doğrulanmış 144 taban/düzeltme çıktısında 2 yanlış (Bard genel şapka tüyü).
Sınıflandırma (scripts/celestial-final.py): ≥ 0,5 haleli, 0,2–0,5 belirsiz, < 0,2 halesiz."""
import numpy as np
from scipy import ndimage as ndi
def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]; return x * x + y * y <= r * r
def hsv(rgb):
    c = rgb.astype(float) / 255; mx = c.max(-1); mn = c.min(-1); d = mx - mn + 1e-9
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, d / (mx + 1e-9), mx
def ring_cov(m, x0, y0, x1, y1, half=False):
    cx, cy, rx, ry = (x0 + x1 - 1) / 2, (y0 + y1 - 1) / 2, (x1 - x0) / 2, max((y1 - y0) / 2, 1)
    dd = ndi.binary_dilation(m, structure=disk(2)); hits = tot = 0
    for t in range(180 if half else 0, 360, 5):
        px = int(round(cx + rx * np.cos(np.radians(t)))); py = int(round(cy + ry * np.sin(np.radians(t))))
        tot += 1; hits += int(0 <= px < 256 and 0 <= py < 256 and dd[py, px])
    return hits / tot
def halo(a, P=None):
    """İnce elips halka (başın tepesinde/üstünde, havada): → (skor 0–1, ölçü). Altın/açık renkli bileşen; yatay, ince, içi boş (doluluk düşük),
    üst yayı dolu (açısal kapsama), içi ve hemen üstü büyük ölçüde saydam. Başla birleşen halka ancak üst yayı başın üstünde kalıyorsa yakalanır."""
    al = a[..., 3] > 60
    if al.sum() < 200: return 0, {}
    ys, xs = np.where(a[..., 3] > 110); top = ys.min()
    h, s, v = hsv(a[..., :3])
    C = al & ((((h >= 28) & (h <= 80) & (s >= 0.18)) & (v >= 0.62)) | ((s < 0.30) & (v >= 0.82)))
    band = np.zeros_like(C); band[max(0, top - 2):top + 46] = True
    lab, n = ndi.label(ndi.binary_dilation(C & band, structure=disk(1)))
    best = (0.0, {})
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        m = (lab == i) & C; k = int(m.sum())
        if k < 20: continue
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop; w, hh = x1 - x0, y1 - y0
        if w < 16 or w > 80 or hh < 3 or hh > 28 or w / hh < 1.8 or y0 > top + 14: continue
        fill = k / (w * hh)
        if fill > 0.6: continue
        ix0, ix1 = x0 + w // 4, x1 - w // 4; iy0, iy1 = y0 + max(1, hh // 4), y1 - max(1, hh // 4)
        inner = a[iy0:iy1, ix0:ix1, 3] if iy1 > iy0 and ix1 > ix0 else np.zeros((1, 1))
        inner_free = float((inner < 60).mean())
        above = a[max(0, y0 - 4):y0, x0 + w // 5:x1 - w // 5, 3]
        above_free = float((above < 60).mean()) if above.size else 1.0
        cov = ring_cov(m, x0, y0, x1, y1); covu = ring_cov(m, x0, y0, x1, y1, half=True)
        thick = float(ndi.distance_transform_edt(np.pad(m, 1)).max())
        if thick > 4.5: continue
        # havada halka: içi saydam + tam kapsama; başla birleşik: üst yay dolu ve üstü saydam (içi saç olabilir)
        sc = max(cov * inner_free, covu * above_free * (0.8 if inner_free < 0.5 else 1.0))
        if covu < 0.6 or above_free < 0.6: sc = min(sc, cov * inner_free)
        if sc > best[0]:
            best = (round(sc, 3), {'en': w, 'boy': hh, 'kalinlik': round(thick, 1), 'doluluk': round(fill, 2), 'ic_saydam': round(inner_free, 2),
                                   'ust_saydam': round(above_free, 2), 'kapsama': round(cov, 2), 'ust_yay': round(covu, 2), 'px': k, 'y': int(y0), 'ust': int(top)})
    return best

P_COL = False
def halo_cols(a):
    """Sütun taraması: baş çevresindeki sütunlarda en üst opak dilim ince (≤ 6 px), altın/açık renkli ve altında saydam boşluk (≥ 1 px) varsa aday;
    yatayda kesintisiz (1 sütun boşluğa izin), y'si düzgün (komşu farkı ≤ 3) en uzun aday dizisi = halka yayı. → (skor, ölçü)."""
    A = a[..., 3] > 60
    ys, xs = np.where(a[..., 3] > 110)
    if not len(ys): return 0.0, {}
    top = ys.min(); band = (ys < top + 40); hx = float(np.median(xs[band]))
    h, s, v = hsv(a[..., :3])
    C = (((h >= 28) & (h <= 80) & (s >= 0.18)) & (v >= 0.62)) | ((s < 0.30) & (v >= 0.82))
    cand = {}
    for x in range(max(0, int(hx) - 45), min(256, int(hx) + 46)):
        col = A[:, x]; yy = np.where(col)[0]
        if not len(yy): continue
        y0 = yy[0]
        if y0 > top + 30: continue
        y1 = y0
        while y1 < 256 and col[y1]: y1 += 1
        t = y1 - y0
        y2 = y1
        while y2 < 256 and not col[y2]: y2 += 1
        g = y2 - y1
        if t > 6 or g < 1 or y2 >= 256: continue
        if P_COL and C[y0:y1, x].mean() < 0.5: continue
        cand[x] = (y0, t, g)
    best = (0.0, {}); run = []
    xs_ = sorted(cand)
    def score(run):
        L = run[-1] - run[0] + 1; cx = (run[0] + run[-1]) / 2
        if L < 14 or abs(cx - hx) > 32: return 0.0, {}
        yv = [cand[x][0] for x in run]
        # yay: uçlar ortadan aşağıda ya da düz (ters yay değil)
        mid = min(yv); ends = (yv[0] + yv[-1]) / 2
        if ends < mid - 1: return 0.0, {}
        sc = min(1.0, L / 24)
        return round(sc, 3), {'yay_en': L, 'yay_y': int(mid), 'kalinlik': int(np.median([cand[x][1] for x in run])), 'bosluk': int(np.median([cand[x][2] for x in run])), 'ust': int(top)}
    for x in xs_:
        if run and (x - run[-1] > 2 or abs(cand[x][0] - cand[run[-1]][0]) > 3):
            r = score(run); best = max(best, r, key=lambda z: z[0]); run = []
        run.append(x)
    if run: r = score(run); best = max(best, r, key=lambda z: z[0])
    return best

def halo_all(a):
    s1, m1 = halo(a); s2, m2 = halo_cols(a)
    return (s1, dict(m1, yontem='halka')) if s1 >= s2 else (s2, dict(m2, yontem='sutun'))
