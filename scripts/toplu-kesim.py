#!/usr/bin/env python3
"""Görev TOPLU-KESIM: 11 sınıfın ham sayfalarını kesip jeton üretir.
Ham: assets-ham/karakter/<sınıf>-<female|male|erkek|kadin>-<ırk>.jpg (depoya girmez; git checkout origin/wip/karakter-ham -- assets-ham/karakter).
Çıktı: public/characters/<ırk>-<erkek|kadin>-<sınıf>-<KOD>.webp (+ kucuk/ 96 px). KOD: warlock WL-n, sorcerer SC-n, diğerleri ID<n>.
Çalıştırma: python3 scripts/toplu-kesim.py [sınıf ...]   (Pillow, numpy, scipy)
"""
import glob, json, os, re, sys
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

RAW, OUT = 'assets-ham/karakter', 'public/characters'
SIZE, FIG_H, TOP, FOOT = 256, 240, 8, 247
GREEN, MAGENTA = np.array([0, 255, 0]), np.array([255, 0, 255])
T_FLOOD, T_HOLE, HOLE_MIN, SPECK, SPILL = 80, 45, 20, 20, 50
PEEL_CHROMA, PEEL_ITER, BLANK_PX = 90, 2, 3000
GEN = {'male': 'erkek', 'female': 'kadin', 'erkek': 'erkek', 'kadin': 'kadin'}
RACES = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'orc', 'tiefling', 'goliath', 'celestial']
# sınıf: (sütun, satır, KOD öneki, hücre adları (n sırası), beklenen boş hücreler {cinsiyet: [n]})
CLASSES = {
 'warlock': (4, 3, 'WL-', ['İblis Hamisi', 'Cin', 'Muhterem', 'Hortlak', 'Kargışçı', 'Kraken', 'Melek', 'Gulyabani', 'Paradoks', 'Ruhsar', 'Astrolog'], {}),
 'sorcerer': (3, 3, 'SC-', ['Ejderha Büyücülüğü', 'Alevbaz', 'Ceren Ürperten', 'İlahi Kan', 'Lanetli', 'Otonom Evren', 'Paratoner', 'Titan Kanı', 'Dunganga'], {}),
 'barbarian': (3, 3, 'ID', ['Varis', 'Element', 'Kaos', 'Şaman', 'İlkelliğin', 'Vahşet', 'Heybet', 'Çılgın Savaşçı', 'Geride Kalanın'], {}),
 'bard': (3, 3, 'ID', ['Bilgi', 'Ağıt', 'Akrobat', 'Arzu', 'Harp', 'Hatip', 'Islık', 'Varoluş', 'Şair'], {}),
 'cleric': (3, 3, 'ID', ['Yaşam', 'Aydın', 'Barış', 'Demirci', 'Fırtına', 'Mezar', 'Savaş', 'Yakamoz', 'Birlik Manastırı'], {}),
 'druid': (4, 2, 'ID', ['Toprak', 'Anka', 'Çağrı', 'Çürüyüş', 'Element', 'Feza', 'Uyku', 'Karadul'], {'erkek': [8]}),
 'fighter': (4, 3, 'ID', ['Şahin Gözlü', 'Çapkın Kavalye', 'Hissi Kablel', 'Pehlivan', 'Pehlivan (dev hali)', 'Ninja', 'Çift Dikiş', 'Samuray', 'Hokkabaz', 'Sancaktar', 'İmparator'], {'kadin': [11]}),
 'monk': (4, 3, 'ID', ['Açık El', 'Astral', 'Ayyaşlık', 'Azizlik', 'Ejderha', 'Element', 'Işık', 'Karanlık', 'Keskinlik', 'Ölümsüzlük', 'Yaşlı Bilge'], {}),
 'paladin': (4, 3, 'ID', ['Bağlılık', 'Antik', 'Asi/Yemin Bozan', 'Biat', 'Fetih', 'İntikam', 'Kefaret', 'Muhafız', 'Zafer', 'Hızır'], {}),
 'ranger': (3, 3, 'ID', ['Avcı', 'Avare', 'Çoban', 'Ejder Muhafızı', 'İbliskıran', 'İzci', 'Kovancı', 'Seyyah', 'Çiftçi'], {}),
 'rogue': (4, 3, 'ID', ['Hırsız', 'Dedektif', 'İllüzyonist', 'Kamufle', 'Kaşif', 'Psişik Hançerler', 'Silahşör', 'Suikastçı', 'Taktisyen', 'İnfazcı'], {}),
}
TALL = {'warlock': 8}  # kendi boyuna göre ölçeklenen uzun hücre

def sane(boxes, W, H, cols, rows, cls):
    """Hücre kutuları makul mu: sayı, alan (0,45–1,8 × beklenen; uzun hücre 2×'e kadar), çakışma yok."""
    want = cols * rows - (1 if cls in TALL else 0)
    if len(boxes) != want: return False
    exp = W * H / (cols * rows)
    for b in boxes:
        ar = (b[2] - b[0]) * (b[3] - b[1])
        if ar < 0.45 * exp or ar > (2.2 if cls in TALL else 1.8) * exp: return False
    for i, a in enumerate(boxes):
        for b in boxes[i + 1:]:
            ox = min(a[2], b[2]) - max(a[0], b[0]); oy = min(a[3], b[3]) - max(a[1], b[1])
            if ox > 40 and oy > 40: return False
    return True

def shape_boxes(a, cols, rows):
    """Hücre kutuları şekillerden: çizgiler ve zemin dışında kalan ögeler kümelenir, her küme en yakın nominal hücre merkezine atanır
    (komşu hücreye taşan parçalar kendi figürüyle gelir). Boş hücre = None."""
    H, W = a.shape[:2]; k = 2
    sub = a[:H // k * k, :W // k * k].reshape(H // k, k, W // k, k, 3)[:, 0, :, 0].astype(int)
    h2, w2 = sub.shape[:2]
    near = (np.linalg.norm(sub - GREEN, axis=2) < 105) | (np.linalg.norm(sub - MAGENTA, axis=2) < 105)
    dk = sub.max(axis=2) < 75
    L = 40
    ln = ndi.binary_opening(dk, structure=np.ones((1, L), bool)) | ndi.binary_opening(dk, structure=np.ones((L, 1), bool))
    ln &= ~ndi.binary_dilation(ndi.binary_opening(dk, structure=np.ones((8, 8), bool)), iterations=2)
    fig = ~near & ~ndi.binary_dilation(ln, iterations=3)
    fig = ndi.binary_opening(fig, iterations=1)
    lab, n = ndi.label(ndi.binary_dilation(fig, iterations=7))
    if not n: return None
    objs = ndi.find_objects(lab); out = {}
    cx = [(i + 0.5) * w2 / cols for i in range(cols)]; cy = [(j + 0.5) * h2 / rows for j in range(rows)]
    for i in range(1, n + 1):
        m = (lab == i) & fig
        if m.sum() < 300: continue
        ys, xs = np.where(m)
        c = int(np.argmin([abs(xs.mean() - v) for v in cx])); r = int(np.argmin([abs(ys.mean() - v) for v in cy]))
        b = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        o = out.get((r, c)); out[(r, c)] = b if o is None else (min(o[0], b[0]), min(o[1], b[1]), max(o[2], b[2]), max(o[3], b[3]))
    pad = 8
    res = []
    for r in range(rows):
        for c in range(cols):
            b = out.get((r, c))
            res.append(None if b is None else (max(0, b[0] * k - pad), max(0, b[1] * k - pad), min(W, b[2] * k + pad), min(H, b[3] * k + pad)))
    return res

def cells_of(img, cls):
    """Aday hücre kutuları (tercih sırasıyla): zemin bileşenleri, çizgi bileşenleri, çizgi izdüşümü, şekil kümeleri, eşit bölme.
    Her aday [(mod, kutular)]; kutular okuma sırasında (şekilde boş hücre None). Hangisinin kullanılacağına `process` kesimi deneyip karar verir."""
    cols, rows = CLASSES[cls][0], CLASSES[cls][1]
    a = np.asarray(img); H, W = a.shape[:2]
    rowh = H / rows
    cands = []
    k = 2
    sub = a[:H // k * k, :W // k * k].reshape(H // k, k, W // k, k, 3)[:, 0, :, 0].astype(int)
    near = (np.linalg.norm(sub - GREEN, axis=2) < 140) | (np.linalg.norm(sub - MAGENTA, axis=2) < 140)
    near = ndi.binary_erosion(near, iterations=3)
    lab0, n0 = ndi.label(near)
    bb0 = []
    if n0:
        objs0 = ndi.find_objects(lab0)
        sz0 = ndi.sum(np.ones_like(lab0), lab0, index=range(1, n0 + 1))
        for i, s_ in enumerate(sz0, 1):
            if s_ > 0.3 * (H // k) * (W // k) / (cols * rows):
                sl = objs0[i - 1]
                bb0.append((max(0, sl[1].start * k - 3), max(0, sl[0].start * k - 3), min(W, sl[1].stop * k + 3), min(H, sl[0].stop * k + 3)))
    if sane(bb0, W, H, cols, rows, cls):
        bb0.sort(key=lambda b: (round(b[1] / rowh), b[0])); cands.append(('zemin', bb0))
    dark = a.max(axis=2) < 80
    L = 60
    lines = ndi.binary_opening(dark, structure=np.ones((1, L), bool)) | ndi.binary_opening(dark, structure=np.ones((L, 1), bool))
    lines &= ~ndi.binary_dilation(ndi.binary_opening(dark, structure=np.ones((15, 15), bool)), iterations=3)
    free = ~ndi.binary_dilation(lines, iterations=2)
    lab, n = ndi.label(free)
    boxes = []
    if n:
        objs = ndi.find_objects(lab)
        sizes = ndi.sum(np.ones_like(lab), lab, index=range(1, n + 1))
        for i, s_ in enumerate(sizes, 1):
            if s_ > 0.4 * H * W / (cols * rows):
                sl = objs[i - 1]; boxes.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop))
    if sane(boxes, W, H, cols, rows, cls):
        boxes.sort(key=lambda b: (round(b[1] / rowh), b[0])); cands.append(('çizgi', boxes))
    if cls in TALL: return cands
    def spans(frac, n, size):
        ok = frac < 0.40; out = []; st = None
        for i, v in enumerate(ok):
            if v and st is None: st = i
            if not v and st is not None:
                if i - st > 0.4 * size / n: out.append((st, i))
                st = None
        if st is not None and len(ok) - st > 0.4 * size / n: out.append((st, len(ok)))
        return out
    dk = a.max(axis=2) < 70
    xs_, ys_ = spans(dk.mean(axis=0), cols, W), spans(dk.mean(axis=1), rows, H)
    if len(xs_) == cols and len(ys_) == rows:
        bx = [(x0, y0, x1, y1) for (y0, y1) in ys_ for (x0, x1) in xs_]
        if sane(bx, W, H, cols, rows, cls): cands.append(('izdüşüm', bx))
    sb = shape_boxes(a, cols, rows)
    if sb is not None: cands.append(('şekil', sb))
    xs = [round(i * W / cols) for i in range(cols + 1)]; ys = [round(j * H / rows) for j in range(rows + 1)]
    cands.append(('eşit', [(xs[c], ys[r], xs[c + 1], ys[r + 1]) for r in range(rows) for c in range(cols)]))
    return cands

def ref_color(cell):
    h, w = cell.shape[:2]; p = 40
    ring = np.concatenate([cell[:p].reshape(-1, 3), cell[-p:].reshape(-1, 3), cell[:, :p].reshape(-1, 3), cell[:, -p:].reshape(-1, 3)])
    near = ring[(np.linalg.norm(ring - GREEN, axis=1) < 140) | (np.linalg.norm(ring - MAGENTA, axis=1) < 140)]
    if len(near) < 200: near = ring[ring.max(axis=1) >= 100] if (ring.max(axis=1) >= 100).any() else ring
    med = np.median(near, axis=0)
    kind = 'green' if np.linalg.norm(med - GREEN) < np.linalg.norm(med - MAGENTA) else 'magenta'
    return kind, med, float(min(np.linalg.norm(med - GREEN), np.linalg.norm(med - MAGENTA)))

def key(cell):
    kind, ref, dev = ref_color(cell)
    # ızgara çizgileri: kenara uzanan uzun koyu çizgiler (yatay/dikey, ≥ 80 px) zemin rengiyle örtülür
    dk = cell.max(axis=2) < 75
    ln = ndi.binary_opening(dk, structure=np.ones((1, 80), bool)) | ndi.binary_opening(dk, structure=np.ones((80, 1), bool))
    ln &= ~ndi.binary_dilation(ndi.binary_opening(dk, structure=np.ones((15, 15), bool)), iterations=3)  # kalın koyu yüzeyler (siyah pelerin) çizgi değildir
    if ln.any():
        ll, nl = ndi.label(ln, structure=np.ones((3, 3)))
        edge_l = set(np.unique(np.concatenate([ll[:3].ravel(), ll[-3:].ravel(), ll[:, :3].ravel(), ll[:, -3:].ravel()]))) - {0}
        if edge_l:
            cell = cell.copy(); cell[ndi.binary_dilation(np.isin(ll, list(edge_l)), iterations=4)] = ref.astype(np.uint8)
    pad = 12
    cell = np.pad(cell, ((pad, pad), (pad, pad), (0, 0)))
    cell[:pad] = ref; cell[-pad:] = ref; cell[:, :pad] = ref; cell[:, -pad:] = ref
    d = np.linalg.norm(cell.astype(float) - ref, axis=2)
    lab, n = ndi.label(d < T_FLOOD)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgm = np.isin(lab, list(edge))
    lab2, n2 = ndi.label((d < T_HOLE) & ~bgm)
    if n2:
        sizes = ndi.sum(np.ones_like(lab2), lab2, index=range(1, n2 + 1))
        for i, s in enumerate(sizes, 1):
            if s >= HOLE_MIN: bgm |= lab2 == i
    ci = cell.astype(int)
    ch = (np.minimum(ci[..., 0], ci[..., 2]) - ci[..., 1]) if kind == 'magenta' else (ci[..., 1] - np.maximum(ci[..., 0], ci[..., 2]))
    for _ in range(PEEL_ITER):
        bgm |= ndi.binary_dilation(bgm) & ~bgm & (ch > PEEL_CHROMA)
    band = ndi.binary_dilation(bgm, iterations=2) & ~bgm
    c = ci.copy()
    if kind == 'magenta':
        lim = c[..., 1] + SPILL
        c[..., 0] = np.where(band, np.minimum(c[..., 0], lim), c[..., 0]); c[..., 2] = np.where(band, np.minimum(c[..., 2], lim), c[..., 2])
    else:
        lim = np.maximum(c[..., 0], c[..., 2]) + SPILL
        c[..., 1] = np.where(band, np.minimum(c[..., 1], lim), c[..., 1])
    fg = ~bgm
    l3, n3 = ndi.label(fg, structure=np.ones((3, 3)))
    if n3:
        sizes = ndi.sum(np.ones_like(l3), l3, index=range(1, n3 + 1))
        small = [i for i, s in enumerate(sizes, 1) if s < SPECK]
        if small: fg &= ~np.isin(l3, small)
    # ızgara/çerçeve çizgileri (renkten bağımsız): kenar bandına değen ince uzun şeritler silinir
    h_f, w_f = fg.shape
    inner = fg[pad:h_f - pad, pad:w_f - pad]
    thin = ndi.binary_opening(inner, structure=np.ones((1, 60), bool)) | ndi.binary_opening(inner, structure=np.ones((60, 1), bool))
    thin &= ~ndi.binary_dilation(ndi.binary_opening(inner, structure=np.ones((14, 14), bool)), iterations=3)
    if thin.any():
        lt, nt = ndi.label(thin, structure=np.ones((3, 3)))
        band = np.zeros_like(thin); band[:10] = band[-10:] = True; band[:, :10] = band[:, -10:] = True
        hit = set(np.unique(lt[band & (lt > 0)]))
        if hit:
            kill = ndi.binary_dilation(np.isin(lt, list(hit)), iterations=2)
            fg[pad:h_f - pad, pad:w_f - pad] &= ~kill
    # ızgara çizgisi gölgesi: kenar bandında (4 px) koyu macenta/siyah karışım pikselleri silinir
    bandb = np.zeros(fg.shape, bool); bandb[pad:pad + 4] = bandb[-pad - 4:-pad] = True; bandb[:, pad:pad + 4] = bandb[:, -pad - 4:-pad] = True
    shade = (c.max(axis=2) < 110) & (np.abs(c[..., 0] - c[..., 2]) < 35) & (c[..., 1] < 45)
    fg &= ~(bandb & shade)
    # ızgara çizgisi artığı: kenara değen ince koyu şeritler silinir (figür parçaları kalın olduğundan kalır)
    l4, n4 = ndi.label(fg, structure=np.ones((3, 3)))
    if n4:
        objs = ndi.find_objects(l4)
        for i in range(1, n4 + 1):
            sl = objs[i - 1]
            h_, w_ = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            touches = sl[0].start <= pad + 1 or sl[1].start <= pad + 1 or sl[0].stop >= fg.shape[0] - pad - 1 or sl[1].stop >= fg.shape[1] - pad - 1
            if touches and min(h_, w_) <= 26:
                m_ = l4 == i
                if c[m_].max(axis=1).mean() < 110: fg &= ~m_
    rgba = np.dstack([c.astype(np.uint8), (fg * 255).astype(np.uint8)])[pad:-pad, pad:-pad]
    return rgba, kind, dev

def clean_edges(a, passes=3, thr=110):
    for _ in range(passes):
        al = a[..., 3] > 0
        edge = al & ndi.binary_dilation(~al, structure=np.ones((3, 3)))
        rgb = a[..., :3].astype(float)
        kill = edge & ((np.linalg.norm(rgb - MAGENTA, axis=2) < thr) | (np.linalg.norm(rgb - GREEN, axis=2) < thr))
        if not kill.any(): break
        a[kill] = 0
    return a

def bbox(rgba):
    ys, xs = np.where(rgba[..., 3] > 0)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else None

def render(rgba, bb, scale, cx):
    x0, y0, x1, y1 = bb
    im = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')
    nw, nh = max(1, round((x1 - x0) * scale)), max(1, round((y1 - y0) * scale))
    im = im.resize((nw, nh), Image.LANCZOS)
    left = round(SIZE / 2 + (x0 - cx) * scale)
    shifted = False
    if left < 0 or left + nw > SIZE: left = round((SIZE - nw) / 2); shifted = True
    top = max(0, FOOT + 1 - nh)
    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0)); canvas.alpha_composite(im, (left, top))
    return Image.fromarray(clean_edges(np.array(canvas)), 'RGBA'), nh, shifted

def process(job):
    cls, path = job
    m = re.match(rf'{cls}-(male|female|erkek|kadin)-([a-z]+)\.', os.path.basename(path))
    gen, race = GEN[m.group(1)], m.group(2)
    cols, rows, pre, names, blanks = CLASSES[cls]
    res = {'sinif': cls, 'irk': race, 'cinsiyet': gen, 'dosya': os.path.basename(path), 'kesilen': [], 'bos': [], 'uyari': []}
    if race not in RACES: res['atlandi'] = 'irk listesinde yok (ör. dragonborn)'; return res
    img = Image.open(path).convert('RGB'); a = np.asarray(img)
    best = None
    for mode, boxes0 in cells_of(img, cls):
        boxes = list(boxes0)
        notes = []
        if mode == 'şekil':
            H_, W_ = a.shape[:2]
            for n0, b0 in enumerate(boxes):
                if b0 is None and n0 + 1 <= len(names) and (n0 + 1) not in blanks.get(gen, []):
                    r_, c_ = divmod(n0, cols)
                    boxes[n0] = (round(c_ * W_ / cols), round(r_ * H_ / rows), round((c_ + 1) * W_ / cols), round((r_ + 1) * H_ / rows)); notes.append(f'hücre {n0 + 1} şekil bulunamadı, eşit bölme kullanıldı')
        keyed, blank, touches, devs = {}, [], [], {}
        for n, bx in enumerate(boxes, 1):
            if n > len(names): break
            if bx is None: blank.append(n); continue
            x0, y0, x1, y1 = bx
            cell = a[y0 + 2:y1 - 2, x0 + 2:x1 - 2]
            rgba, kind, dev = key(cell)
            bb = bbox(rgba)
            big = 0
            if bb is not None:
                lb, nb = ndi.label(rgba[..., 3] > 0, structure=np.ones((3, 3)))
                big = max(ndi.sum(np.ones_like(lb), lb, index=range(1, nb + 1))) if nb else 0
            if bb is None or big < BLANK_PX: blank.append(n); continue
            touch = bool(rgba[0, :, 3].any() or rgba[-1, :, 3].any() or rgba[:, 0, 3].any() or rgba[:, -1, 3].any())
            if touch: touches.append(n)
            if dev > 60: devs[n] = dev
            keyed[n] = (rgba, bb, kind, dev, touch)
        exp = set(blanks.get(gen, []))
        unexpected = [n for n in blank if n not in exp]
        hs = sorted(v[1][3] - v[1][1] for k_, v in keyed.items() if TALL.get(cls) != k_)
        spread = (hs[-1] / max(1, hs[len(hs) // 2])) if hs else 9
        score = 3 * len(touches) + 12 * len(unexpected) + 12 * abs(len(keyed) - (len(names) - len(exp))) + (15 if spread > 1.9 else 0) + len(notes)
        if best is None or score < best[0]: best = (score, mode, keyed, blank, touches, devs, notes)
        if score == 0: break
    score, mode, keyed, blank_l, touch_l, devs, notes = best
    res['mod'] = mode; res['puan'] = score; res['uyari'].extend(notes)
    res['bos'] = list(blank_l)
    if any(n not in blanks.get(gen, []) for n in blank_l): res['uyari'].append(f"beklenmeyen boş hücre {blank_l} (beklenen {blanks.get(gen, [])})")
    exp_blank = blanks.get(gen, []); want = len(names) - len(exp_blank)
    valid = {n: v for n, v in keyed.items() if n <= len(names)}  # adlandırılmamış hücreler (ör. rogue 11-12) boş sayılır
    if len(valid) != want: res['uyari'].append(f'jeton sayısı {len(valid)} != beklenen {want}')
    norm = [n for n in valid if TALL.get(cls) != n]
    hmax = max(v[1][3] - v[1][1] for n, v in valid.items() if n in norm); wmax = max(v[1][2] - v[1][0] for n, v in valid.items() if n in norm)
    scale = min(FIG_H / hmax, (SIZE - 4) / wmax); res['olcek'] = round(scale, 4)
    res['olcekSinir'] = 'yükseklik' if FIG_H / hmax <= (SIZE - 4) / wmax else 'genişlik'
    for n, (rgba, bb, kind, dev, touch) in valid.items():
        sc = scale
        if TALL.get(cls) == n: sc = min(FIG_H / (bb[3] - bb[1]), (SIZE - 4) / (bb[2] - bb[0]))
        tok, nh, shifted = render(rgba, bb, sc, rgba.shape[1] / 2)
        code = f'{pre}{n}'
        name = f'{race}-{gen}-{cls}-{code}.webp'
        tok.save(f'{OUT}/{name}', 'WEBP', quality=92, alpha_quality=100, method=4)
        tok.resize((96, 96), Image.LANCZOS).save(f'{OUT}/kucuk/{name}', 'WEBP', quality=82, method=4)
        res['kesilen'].append(n)
        if touch: res['uyari'].append(f'hücre {n} kenara değiyor (kırpılmış olabilir)')
        if shifted: res['uyari'].append(f'hücre {n} yatay merkezlendi (taşma)')
        if dev > 60: res['uyari'].append(f'hücre {n} zemin rengi sapması {dev:.0f}')
    return res

def check_images(cls, results):
    names = CLASSES[cls][3]; pre = CLASSES[cls][2]; px = 96
    for gen in ('erkek', 'kadin'):
        rs = {r['irk']: r for r in results if r['cinsiyet'] == gen and r['sinif'] == cls and 'atlandi' not in r}
        if not rs: continue
        W = 70 + len(names) * px; H = 16 + len(rs) * (px + 26)
        im = Image.new('RGB', (W, H), (96, 100, 112)); d = ImageDraw.Draw(im)
        for i, nm in enumerate(names): d.text((70 + i * px + 2, 2), f'{i + 1} {nm[:14]}', fill=(255, 255, 255))
        for ri, race in enumerate(r for r in RACES if r in rs):
            y = 16 + ri * (px + 26); d.text((2, y + px // 2), race[:8], fill=(255, 255, 255))
            for n in range(1, len(names) + 1):
                f = f'{OUT}/{race}-{gen}-{cls}-{pre}{n}.webp'
                if os.path.exists(f) and n in rs[race]['kesilen']:
                    t = Image.open(f).convert('RGBA').resize((px, px), Image.LANCZOS); im.paste(t, (70 + (n - 1) * px, y), t)
        os.makedirs('docs/sabah/toplu-kesim', exist_ok=True)
        im.save(f'docs/sabah/toplu-kesim/{cls}-{gen}.jpg', quality=85)

if __name__ == '__main__':
    only = [a for a in sys.argv[1:] if not a.startswith('--')] or list(CLASSES)
    os.makedirs(f'{OUT}/kucuk', exist_ok=True)
    for cls in only:
        jobs = [(cls, p) for p in sorted(glob.glob(f'{RAW}/{cls}-*'))]
        with Pool(4) as pool: results = pool.map(process, jobs, chunksize=1)
        json.dump(results, open(f'/tmp/claude-0/s/toplu-{cls}.json', 'w'), ensure_ascii=False, indent=1)
        check_images(cls, results)
        cut = sum(len(r['kesilen']) for r in results); skip = [r['dosya'] for r in results if 'atlandi' in r]
        warn = [(r['dosya'], r['uyari']) for r in results if r['uyari']]
        print(f'{cls}: {len(results)} sayfa, {cut} jeton, atlanan sayfa {skip}, modlar {sorted({r.get("mod") for r in results if "mod" in r})}, uyarı {len(warn)}')
        for w in warn[:40]: print('   ', w)
