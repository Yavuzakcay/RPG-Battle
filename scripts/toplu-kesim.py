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
    arr = clean_edges(np.array(canvas))
    # KQ6-14: figürden ayrı, küçük, nötr koyu ve yatay uzun çubuk (ızgara çerçevesi kırıntısı) tuvalin alt/yan kenarındaysa silinir
    lab, n_ = ndi.label(arr[..., 3] > 0, structure=np.ones((3, 3)))
    if n_ > 1:
        sizes = ndi.sum(np.ones_like(lab), lab, index=range(1, n_ + 1)); big = int(np.argmax(sizes)) + 1
        for i, sl in enumerate(ndi.find_objects(lab), 1):
            if i == big or sizes[i - 1] > 0.12 * sizes[big - 1]: continue
            h_, w_ = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            px_ = arr[sl][lab[sl] == i][:, :3].astype(int)
            neutral = px_.max(axis=1).mean() < 75 and float((px_.max(axis=1) - px_.min(axis=1)).mean()) < 32
            edge = sl[0].stop >= SIZE - 12 or sl[1].start <= 3 or sl[1].stop >= SIZE - 3
            if neutral and edge and (w_ >= 2.2 * h_ or h_ >= 2.2 * w_): arr[sl][lab[sl] == i] = 0
    return Image.fromarray(arr, 'RGBA'), nh, shifted

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

# ---------------------------------------------------------------------------------------------------------------------
# İŞ 1: bağlı bileşen tabanlı kesim (`--yeni`); eski ızgara yöntemi (`process`) yedekte. Parametreler data/kesim-parametre.json.
KP = json.load(open('data/kesim-parametre.json'))

def detect_grid(img, cols, rows):
    """Sayfadaki gerçek ızgara çizgileri (koyu sütun/satırlar) → (x sınırları, y sınırları); bulunamazsa None (orantılı bölme)."""
    dark = img.max(axis=2) < 80
    def bounds(frac, n, size):
        ok = frac > 0.5; runs = []; st = None
        for i, v in enumerate(ok):
            if v and st is None: st = i
            if not v and st is not None: runs.append((st + i) / 2); st = None
        if st is not None: runs.append((st + len(ok)) / 2)
        inner = [r_ for r_ in runs if size * 0.05 < r_ < size * 0.95]
        merged = []
        for r_ in inner:
            if merged and r_ - merged[-1] < size / n * 0.3: continue
            merged.append(r_)
        return [0] + merged + [size] if len(merged) == n - 1 else None
    xb = bounds(dark.mean(axis=0), cols, img.shape[1]); yb = bounds(dark.mean(axis=1), rows, img.shape[0])
    return (xb, yb) if xb and yb else None

def nominal_cell(cx, cy, W, H, cls, grid=None):
    """Merkez noktasının hücresi (satır-sütun okuma sırası, 1 tabanlı); uzun hücre (warlock 8) sağ sütun 2.-3. satır. grid: gerçek ızgara sınırları."""
    cols, rows = CLASSES[cls][0], CLASSES[cls][1]
    if grid and cls not in TALL:
        c = max(0, min(cols - 1, int(np.searchsorted(grid[0], cx, side='right')) - 1)); r = max(0, min(rows - 1, int(np.searchsorted(grid[1], cy, side='right')) - 1))
        return r * cols + c + 1
    c = min(cols - 1, int(cx / W * cols)); r = min(rows - 1, int(cy / H * rows))
    if cls in TALL and c == cols - 1 and r == 2: r = 1
    n = r * cols + c + 1
    if cls in TALL:  # sıra: 1-4, 5-7 (satır 2), 8 (uzun), 9-11 (satır 3)
        if r == 0: n = c + 1
        elif r == 1: n = 5 + c if c < cols - 1 else 8
        else: n = 9 + c
    return n

def sheet_bg(a):
    """Sayfanın gerçek zemin rengi (sayfa başına; saf #00FF00/#FF00FF'ten sapmış yeşil/magenta): en sık görülen doygun yeşil/magenta ton."""
    sm = a[::8, ::8].reshape(-1, 3).astype(int); q = sm // 16
    keys, inv, counts = np.unique(q, axis=0, return_inverse=True, return_counts=True)
    for k in np.argsort(-counts)[:8]:
        col = np.median(sm[inv.ravel() == k], axis=0)
        r, g, b = col
        if g - max(r, b) > 60 or min(r, b) - g > 60: return col
    return None

def key_sheet(a, ref=None):
    """Sayfa zemin anahtarı: saf yeşil/magenta (ve sayfanın kendi zemin tonu) yakınındaki büyük bölgeler (hücre zeminleri) silinir; figür içi küçük bölgeler kalır."""
    p = KP['saf']; af = a.astype(float)
    ds = [np.linalg.norm(af - np.array(p['yesil']), axis=2), np.linalg.norm(af - np.array(p['magenta']), axis=2)]
    if ref is not None: ds.append(np.linalg.norm(af - np.array(ref, float), axis=2))
    d = np.minimum.reduce(ds)
    near = d < KP['bgEsik']
    lab, n = ndi.label(near)
    bg = np.zeros(near.shape, bool)
    if n:
        sizes = ndi.sum(np.ones_like(lab), lab, index=range(1, n + 1))
        big = [i for i, s_ in enumerate(sizes, 1) if s_ >= KP['bgMinAlan']]
        bg = np.isin(lab, big)
        # figür içinde kalan küçük zemin cepleri (kol-balta arası vb.): saf zemin rengine çok yakın ve yeterince büyükse zemindir
        pocket = [i for i, s_ in enumerate(sizes, 1) if KP['cepMinAlan'] <= s_ < KP['bgMinAlan']]
        if pocket:
            tight = d < KP['cepEsik']
            l2, n2 = ndi.label(tight)
            s2 = ndi.sum(np.ones_like(l2), l2, index=range(1, n2 + 1)) if n2 else []
            bg |= np.isin(l2, [i for i, s_ in enumerate(s2, 1) if s_ >= KP['cepMinAlan']])
    return ~bg

def drop_lines(fg):
    L = KP['ciziOpenUzunluk']
    ln = ndi.binary_opening(fg, structure=np.ones((1, L), bool)) | ndi.binary_opening(fg, structure=np.ones((L, 1), bool))
    ln &= ~ndi.binary_dilation(ndi.binary_opening(fg, structure=np.ones((16, 16), bool)), iterations=3)
    # yalnız koyu ince çizgiler (çizgi rengi): figür kılıç/asa gibi uzun ince parçaları renkli olduğundan kalır
    return ln

def trim_lines(rgba):
    """Kutunun dış bandına (14 px) değen koyu ince uzun şeritler (ızgara çizgisi artığı) silinir."""
    a = rgba.copy(); al = a[..., 3] > 0; dk = al & (a[..., :3].max(axis=2) < 80)
    ln = ndi.binary_opening(dk, structure=np.ones((1, 40), bool)) | ndi.binary_opening(dk, structure=np.ones((40, 1), bool))
    ln &= ~ndi.binary_dilation(ndi.binary_opening(dk, structure=np.ones((14, 14), bool)), iterations=3)
    if not ln.any(): return a
    lab, n = ndi.label(ln, structure=np.ones((3, 3)))
    band = np.zeros_like(ln); band[:16] = band[-16:] = True; band[:, :16] = band[:, -16:] = True
    hit = set(np.unique(lab[band & (lab > 0)]))
    if hit: a[ndi.binary_dilation(np.isin(lab, list(hit)), iterations=2), 3] = 0
    return a

def sheet_kind(img, box, fg):
    x0, y0, x1, y1 = box; pad = 12
    sub = img[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad].astype(float); m = ~fg[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]
    if m.sum() < 50: return 'magenta'
    med = np.median(sub[m], axis=0)
    return 'green' if np.linalg.norm(med - np.array(KP['saf']['yesil'])) < np.linalg.norm(med - np.array(KP['saf']['magenta'])) else 'magenta'

def peel(a, kind):
    """Zemin renginde geniş hale/bant (yapay zekâ üretimi bulanık kenar): kenar pikselleri sayfanın zemin tonundaysa katman katman soyulur
    (en çok `soyAdim` px; kenarlardan içeri yalnız zemin tonlu bağlı pikseller). Figürün kendi renkleri (zemin tonu olmayan) durur."""
    al = a[..., 3] > 0
    for _ in range(KP['soyAdim']):
        edge = al & ~ndi.binary_erosion(al)
        rgb = a[..., :3].astype(int)
        ch = (np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]) if kind == 'magenta' else (rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]))
        kill = edge & (ch > KP['soyKroma'])
        if not kill.any(): break
        a[kill, 3] = 0; al = al & ~kill
    return a

def despill(rgba, kind='magenta'):
    """Alfa kenarına 2 px içindeki zemin renkli sızıntıyı kısar, kenarı 1 px daraltır; figür içi renklere dokunmaz."""
    a = peel(rgba.copy(), kind); al = a[..., 3] > 0
    for _ in range(KP['alfaDaralt']):
        er = ndi.binary_erosion(al); a[~er, 3] = 0; al = er
    band = al & ~ndi.binary_erosion(al, iterations=KP['despillBant'])
    rgb = a[..., :3].astype(int)
    mag = (np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]) > KP['despillKroma']
    grn = (rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2])) > KP['despillKroma']
    m = band & mag
    if m.any():
        lim = rgb[..., 1] + KP['despillKroma']
        a[..., 0] = np.where(m, np.minimum(rgb[..., 0], lim), a[..., 0]); a[..., 2] = np.where(m, np.minimum(rgb[..., 2], lim), a[..., 2])
    g = band & grn
    if g.any():
        lim = np.maximum(rgb[..., 0], rgb[..., 2]) + KP['despillKroma']
        a[..., 1] = np.where(g, np.minimum(rgb[..., 1], lim), a[..., 1])
    # saf zemin rengine çok yakın kenar pikselleri saydamlaşır
    near = (np.linalg.norm(a[..., :3].astype(float) - np.array(KP['saf']['yesil']), axis=2) < KP['saf']['yakinlik']) | (np.linalg.norm(a[..., :3].astype(float) - np.array(KP['saf']['magenta']), axis=2) < KP['saf']['yakinlik'])
    a[band & near, 3] = 0
    return a

def components_of_sheet(path, cls, force_cells=(), protect=()):
    """→ {hücre n: (RGBA tam sayfa boyutunda kırpılmış kutu, bbox, uyarı listesi)}; elle kontrol gerektirenler uyarıda 'ELLE'."""
    img = np.asarray(Image.open(path).convert('RGB')); H, W = img.shape[:2]
    grid = detect_grid(img, CLASSES[cls][0], CLASSES[cls][1]) if cls not in TALL else None
    fg = key_sheet(img, sheet_bg(img))
    lines = drop_lines(fg)
    fg &= ~lines
    # ızgara çerçeve çizgileri: çok uzun (≥ 300 px) koyu düz şeritler; yalnız İKİ YANI da zemin olanlar (iki hücre zemini arasındaki çizgi;
    # siyah pelerin gibi figür içi koyu şeritlerin yanında figür vardır, silinmez)
    dk_ = img.max(axis=2) < 90
    llh = ndi.binary_opening(dk_, structure=np.ones((1, 300), bool)); llv = ndi.binary_opening(dk_, structure=np.ones((300, 1), bool))
    if llh.any() or llv.any():
        bgm = np.pad(~fg, 60, constant_values=True); Hh, Ww = fg.shape
        up = bgm[0:Hh, 10:10 + Ww] if False else None
        def side(dy, dx): return bgm[60 + dy:60 + dy + Hh, 60 + dx:60 + dx + Ww]
        both_h = np.zeros_like(llh); both_v = np.zeros_like(llh)
        for d_ in (16, 24, 32, 44, 56): both_h |= side(-d_, 0) & side(d_, 0); both_v |= side(0, -d_) & side(0, d_)
        kill = ndi.binary_closing(llh & both_h, structure=np.ones((1, 241), bool)) & llh | ndi.binary_closing(llv & both_v, structure=np.ones((241, 1), bool)) & llv
        for (px0, py0, px1, py1) in protect: kill[py0:py1, px0:px1] = False    # KQ6-20: kollar açık figür (siyah gövde bandı) çizgi sanılmasın: hücre içi korunur
        if kill.any(): fg &= ~ndi.binary_dilation(kill, iterations=3)
    fg = ndi.binary_opening(fg, iterations=1)
    # ızgara çizgisi kırıntıları (kesik kesik ince şeritler): ince uzun küçük bileşenler atılır
    l0, n0 = ndi.label(fg, structure=np.ones((3, 3)))
    objs = ndi.find_objects(l0)
    for i, sl in enumerate(objs, 1):
        h_, w_ = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if min(h_, w_) <= KP['inceSerit'] and max(h_, w_) >= 20 and int((l0[sl] == i).sum()) < 3500: fg[sl] &= ~(l0[sl] == i)
    # Büyük bileşenler (figürler) birbirine ASLA birleşmez; küçük parçalar (aksesuar, efekt, kılıç ucu) aynı hücredeki en yakın büyük
    # figüre, aralarındaki uzaklık `birlestirPx` içindeyse eklenir (komşu hücrenin figürüne asla).
    l0, n0 = ndi.label(fg, structure=np.ones((3, 3)))
    objs = ndi.find_objects(l0)
    info = {}
    for i, sl in enumerate(objs, 1):
        m = (l0[sl] == i)
        area = int(m.sum())
        if area < KP['kucukParca']: continue
        ys, xs = np.where(m)
        info[i] = {'sl': sl, 'm': m, 'area': area, 'cx': xs.mean() + sl[1].start, 'cy': ys.mean() + sl[0].start}
        info[i]['n'] = nominal_cell(info[i]['cx'], info[i]['cy'], W, H, cls, grid)
    big = [i for i, c in info.items() if c['area'] >= KP['figurMinAlan']]
    owner = {i: i for i in big}
    for i, c in info.items():
        if i in owner: continue
        best, bd = None, 1e9
        for j in big:
            if info[j]['n'] != c['n']: continue
            sj = info[j]['sl']; sc = c['sl']
            dx = max(0, max(sj[1].start, sc[1].start) - min(sj[1].stop, sc[1].stop)); dy = max(0, max(sj[0].start, sc[0].start) - min(sj[0].stop, sc[0].stop))
            if dx > KP['birlestirPx'] * 2 or dy > KP['birlestirPx'] * 2: continue
            # gerçek en yakın piksel uzaklığı (kutu içinde)
            y0 = min(sj[0].start, sc[0].start); y1 = max(sj[0].stop, sc[0].stop); x0 = min(sj[1].start, sc[1].start); x1 = max(sj[1].stop, sc[1].stop)
            sub = l0[y0:y1, x0:x1]
            dist = ndi.distance_transform_edt(sub != j)
            d = float(dist[sub == i].min())
            if d < bd: best, bd = j, d
        if best is not None and bd <= KP['birlestirPx']: owner[i] = best
    clusters = []
    for j in big:
        members = [info[i] for i, o in owner.items() if o == j]
        for c in members: c['m'] = c['m']
        clusters.append({'members': members, 'area': sum(c['area'] for c in members), 'n': info[j]['n'], 'cx': info[j]['cx'], 'cy': info[j]['cy']})
    byn = {}
    for c in clusters: byn.setdefault(c['n'], []).append(c)
    out = {}
    names = CLASSES[cls][3]
    for n_, lst in byn.items():
        lst.sort(key=lambda c: -c['area'])
        main = lst[0]
        warn = []
        keep = list(main['members'])
        for other in lst[1:]:  # aynı hücredeki ikinci büyük parça: figürden çok küçükse efekt/aksesuar (ruh, kanat, gölge), değilse iki figür
            if other['area'] <= KP['ikinciOran'] * main['area'] or n_ in force_cells: keep += other['members']
            else: warn.append(f"ELLE: hücrede iki büyük figür ({other['area']} / {main['area']} px)")
        # ızgara çizgisi kırıntısı: nötr koyu, ince/uzun küçük parça (figürden ayrı) figüre katılmaz
        def lineish(c):
            if c['area'] >= 25000 or c is max(keep, key=lambda k_: k_['area']): return False
            px_ = img[c['sl']][c['m']].astype(int)
            neutral = px_.max(axis=1).mean() < 100 and float((px_.max(axis=1) - px_.min(axis=1)).mean()) < 30
            return neutral and float(ndi.distance_transform_edt(np.pad(c["m"], 1)).max()) <= 36   # çizgi kalınlığı ≤ ~48 px
        keep = [c for c in keep if not lineish(c)]
        y0 = min(c['sl'][0].start for c in keep); y1 = max(c['sl'][0].stop for c in keep); x0 = min(c['sl'][1].start for c in keep); x1 = max(c['sl'][1].stop for c in keep)
        rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8); rgba[..., :3] = img[y0:y1, x0:x1]
        for c in keep:
            sl = c['sl']; mm = np.zeros((y1 - y0, x1 - x0), bool); mm[sl[0].start - y0:sl[0].stop - y0, sl[1].start - x0:sl[1].stop - x0] = c['m']
            rgba[..., 3] |= (mm * 255).astype(np.uint8)
        # iki hücreye taşan (temas eden) figür: kümenin yatay/dikey kapsamı iki nominal hücreyi geçiyorsa elle kontrol
        cols, rows_ = CLASSES[cls][0], CLASSES[cls][1]
        cw_ = (grid[0][(n_ - 1) % cols + 1] - grid[0][(n_ - 1) % cols]) if grid else W / cols
        if (x1 - x0) > cw_ * (1 + KP['elleKontrol']['ikiHucreOran']) * 1.0 and cls not in TALL: warn.append('ELLE: figür bir hücre genişliğini aşıyor (temas/birleşme)')
        # kümenin piksel kütlesi başka bir nominal hücreye de düşüyorsa (iki figür birleşmiş): elle kontrol
        ysx, xsx = np.where(rgba[..., 3] > 0)
        other = np.mean([nominal_cell(xsx[j] + x0, ysx[j] + y0, W, H, cls, grid) != n_ for j in range(0, len(xsx), 7)]) if len(xsx) else 0
        if other > KP['elleKontrol']['ikiHucreOran']: warn.append(f'ELLE: figür kütlesinin %{other * 100:.0f}\'i başka hücrede (iki figür temas ediyor)')
        out[n_] = (despill(trim_lines(rgba), sheet_kind(img, (x0, y0, x1, y1), fg)), (x0, y0, x1, y1), warn)
    return out

def process_cc(job):
    cls, path = job
    m = re.match(rf'{cls}-(male|female|erkek|kadin)-([a-z]+)\.', os.path.basename(path))
    gen, race = GEN[m.group(1)], m.group(2)
    res = {'sinif': cls, 'irk': race, 'cinsiyet': gen, 'dosya': os.path.basename(path), 'kesilen': [], 'bos': [], 'uyari': [], 'elle': []}
    if race not in RACES: res['atlandi'] = 'irk listesinde yok'; return res, {}
    comps = components_of_sheet(path, cls)
    names = CLASSES[cls][3]; blanks = CLASSES[cls][4].get(gen, [])
    valid = {n: v for n, v in comps.items() if n <= len(names) and n not in blanks}
    for n in range(1, len(names) + 1):
        if n not in valid and n not in blanks: res['uyari'].append(f'hücre {n} figür bulunamadı')
    for n, (rgba, bb, w) in valid.items():
        if any(x.startswith('ELLE') for x in w): res['elle'].append((n, w[0]))
    hmax = max(v[0].shape[0] for n, v in valid.items() if TALL.get(cls) != n); wmax = max(v[0].shape[1] for n, v in valid.items() if TALL.get(cls) != n)
    scale = min(FIG_H / hmax, (SIZE - 4) / wmax); res['olcek'] = round(scale, 4)
    toks = {}
    for n, (rgba, bb, w) in valid.items():
        if any(x.startswith('ELLE') for x in w): continue
        sc = scale
        if TALL.get(cls) == n: sc = min(FIG_H / rgba.shape[0], (SIZE - 4) / rgba.shape[1])
        bb2 = bbox(rgba)
        tok, nh, shifted = render(rgba, bb2, sc, rgba.shape[1] / 2)
        toks[n] = tok; res['kesilen'].append(n)
    return res, toks

def apply_new(old_scales):
    """İŞ 1 uygulaması: denetimde işaretli (sınıf-hücreli) jetonlar yeni kesimle yeniden yazılır; ELLE/figürsüz hücrelerde eski jeton kalır.
    Ölçek: sayfanın eski ölçeği (kardeşlerle tutarlı). Çıktı: data/kesim-yeniden.json (yeniden kesilen, elle, kapsam dışı)."""
    den = json.load(open('/tmp/claude-0/s/denetim.json'))['sorunlu']
    todo = {}
    out = {'yeniden': [], 'elle': [], 'figursuz': [], 'kapsamDisi': []}
    for name in den:
        m = re.match(r'^([a-z]+)-(erkek|kadin)-([a-z]+)-(WL-|SC-|ID)(\d+)$', name)
        if not m: out['kapsamDisi'].append(name + ' (' + ('wizard WZ ayrı betik' if '-WZ-' in name else 'sınıf-genel jeton, ham sayfa yok') + ')'); continue
        race, gen, cls, pre, n = m.group(1), m.group(2), m.group(3), m.group(4), int(m.group(5))
        todo.setdefault((cls, gen, race), []).append((name, n))
    inv = {'erkek': 'male', 'kadin': 'female'}
    for (cls, gen, race), items in sorted(todo.items()):
        cand = [f'{RAW}/{cls}-{inv[gen]}-{race}.jpg', f'{RAW}/{cls}-{gen}-{race}.jpg']
        path = next((c for c in cand if os.path.exists(c)), None)
        if not path: out['kapsamDisi'].append(f'{cls}-{gen}-{race} (ham sayfa yok)'); continue
        comps = components_of_sheet(path, cls)
        sc0 = old_scales.get((cls, gen, race))
        for name, n in items:
            c = comps.get(n)
            if c is None: out['figursuz'].append(f'{name}: yeni yöntem figür bulamadı, eski kaldı'); continue
            rgba, bb, warn = c
            if any(w.startswith('ELLE') for w in warn): out['elle'].append(f'{name}: {warn[0]}'); continue
            r2 = bbox(rgba)
            sc = sc0 or min(FIG_H / rgba.shape[0], (SIZE - 4) / rgba.shape[1])
            if TALL.get(cls) == n: sc = min(FIG_H / rgba.shape[0], (SIZE - 4) / rgba.shape[1])
            tok, nh, shifted = render(rgba, r2, min(sc, (SIZE - 4) / rgba.shape[1], 240 / rgba.shape[0] * 1.0), rgba.shape[1] / 2)
            fn = f'{name}.webp'
            tok.save(f'{OUT}/{fn}', 'WEBP', quality=92, alpha_quality=100, method=4)
            tok.resize((96, 96), Image.LANCZOS).save(f'{OUT}/kucuk/{fn}', 'WEBP', quality=82, method=4)
            out['yeniden'].append(name)
    json.dump(out, open('data/kesim-yeniden.json', 'w'), ensure_ascii=False, indent=1)
    return out

# ---------------------------------------------------------------------------------------------------------------------
# KQ6-14 TOPLU KESİM TEK TUR (`--yeni`): 52 sayfa (dragonborn sınıf, wizard dragonborn a/b, gariban, Hızır; wizard human yalnız referans).
ORIG = list(CLASSES)
GARIBAN = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
CLASSES['wizard_a'] = (4, 2, 'WZ-A', ['Patlama', 'Aldatmaca', 'Anka', 'Diriliş', 'Savaş', 'Kâtip', 'Kehanet', 'Kılıç Şarkısı'], {})
CLASSES['wizard_b'] = (4, 2, 'WZ-B', ['Seraplar', 'Sığınak', 'Simya', 'Tezahür', 'Uzay Bükücü', 'Zaman', 'Harita'], {'erkek': [], 'kadin': []})
CLASSES['gariban'] = (4, 3, 'GR', [c.capitalize() for c in GARIBAN], {})
CLASSES['hizir'] = (3, 3, '', [f'hücre {i}' for i in range(1, 10)], {})
RACES10 = RACES + ['dragonborn']
HIZIR = {'hizir-sayfa1': [('tiefling', 'erkek'), ('celestial', 'kadin'), ('dwarf', 'kadin'), ('elf', 'kadin'), ('gnome', 'kadin'), ('goliath', 'kadin'), ('halfling', 'kadin'), ('human', 'kadin'), ('orc', 'kadin')],
         'hizir-sayfa2': [('tiefling', 'kadin'), ('celestial', 'erkek'), ('dwarf', 'erkek'), ('elf', 'erkek'), ('gnome', 'erkek'), ('goliath', 'erkek'), ('halfling', 'erkek'), ('human', 'erkek'), ('orc', 'erkek')]}
INV = {'erkek': 'male', 'kadin': 'female'}

def find_raw(stem):
    c = sorted(glob.glob(f'{RAW}/{stem}.*'))
    return c[0] if c else None

def yeni_jobs():
    """→ [(sayfa_adi, dosya, yerlesim, {hücre n: çıktı adı (uzantısız)}, olcek_grubu)] ve referans/eşleşmeyen listesi."""
    jobs, ref = [], []
    for cls in ORIG:                                  # 1) dragonborn sınıf sayfaları (22)
        for g in ('female', 'male'):
            f = find_raw(f'{cls}-{g}-dragonborn')
            if not f: ref.append(f'{cls}-{g}-dragonborn (dosya yok)'); continue
            names = CLASSES[cls][3]; pre = CLASSES[cls][2]
            jobs.append((os.path.basename(f), f, cls, {n: f'dragonborn-{GEN[g]}-{cls}-{pre}{n}' for n in range(1, len(names) + 1) if n not in CLASSES[cls][4].get(GEN[g], [])}, f'dragonborn-{g}-{cls}'))
    for g in ('female', 'male'):                      # 2) wizard dragonborn a/b (4)
        for part in ('a', 'b'):
            f = find_raw(f'wizard-{g}-dragonborn-{part}')
            if not f: ref.append(f'wizard-{g}-dragonborn-{part} (dosya yok)'); continue
            lay = f'wizard_{part}'; pre = CLASSES[lay][2]
            jobs.append((os.path.basename(f), f, lay, {n: f'dragonborn-{GEN[g]}-wizard-{pre}{n}' for n in range(1, len(CLASSES[lay][3]) + 1)}, f'wizard-{g}-dragonborn'))
    for race in RACES10:                              # 3) gariban (20)
        for g in ('female', 'male'):
            f = find_raw(f'gariban-{g}-{race}')
            if not f: ref.append(f'gariban-{g}-{race} (dosya yok)'); continue
            jobs.append((os.path.basename(f), f, 'gariban', {i + 1: f'{race}-{GEN[g]}-{GARIBAN[i]}-GR' for i in range(12)}, f'gariban-{g}-{race}'))
    for stem, lst in HIZIR.items():                   # 4) Hızır (2): hücre -> <irk>-<cinsiyet>-paladin-ID10
        f = find_raw(stem)
        if not f: ref.append(f'{stem} (dosya yok)'); continue
        jobs.append((os.path.basename(f), f, 'hizir', {i + 1: f'{r}-{g}-paladin-ID10' for i, (r, g) in enumerate(lst)}, stem))
    for g in ('female', 'male'):                      # 5) wizard human: yalnız referans
        for part in ('a', 'b'):
            f = find_raw(f'wizard-{g}-human-{part}')
            ref.append(f'{os.path.basename(f) if f else f"wizard-{g}-human-{part} (dosya yok)"}: yalnız referans, kesilmedi')
    return jobs, ref

def yeni_cut(job):
    name, path, lay, names, group = job
    res = {'dosya': name, 'yerlesim': lay, 'kesilen': [], 'elle': [], 'eksik': [], 'uyari': []}
    try:
        comps = components_of_sheet(path, lay)
        forced = tuple(n for n, v in comps.items() if v[2] and v[2][0].startswith('ELLE: hücrede iki büyük figür'))   # figür + yanında süzülen parçalar (hançer vb.): birleştirilir, ELLE notuyla
        if forced:
            c2 = components_of_sheet(path, lay, force_cells=forced)
            for n in forced: comps[n] = (c2[n][0], c2[n][1], [f'ELLE-birlestirildi: {comps[n][2][0]}'])
    except Exception as e: res['hata'] = repr(e); return res, {}
    want = list(names)
    res['bulunan'] = sorted(comps)
    return res, {n: comps[n] for n in comps}

def yeni_main():
    import time
    jobs, ref = yeni_jobs()
    only_ = [a for a in sys.argv[1:] if not a.startswith('--')]
    if only_: jobs = [j for j in jobs if any(o in j[0] for o in only_)]   # örn. --yeni wizard-male
    os.makedirs(f'{OUT}/kucuk', exist_ok=True); os.makedirs('docs/sabah/toplu-kesim-yeni', exist_ok=True)
    t0 = time.time()
    with Pool(4) as pool: outs = pool.map(yeni_cut, jobs, chunksize=1)
    # Ölçek: sayfa başına (en yüksek/geniş normal figür 240); wizard a+b birlikte; Hızır = kardeş Paladin sayfasının ölçeği
    scales = {}
    grp = {}
    for (job, (res, comps)) in zip(jobs, outs):
        if 'hata' in res: continue
        name, path, lay, names, group = job
        valid = {n: v for n, v in comps.items() if n in names and not any(x.startswith('ELLE:') for x in v[2])}
        if not valid: continue
        norm = [n for n in valid if TALL.get(lay) != n]
        h = max(valid[n][0].shape[0] for n in norm); w = max(valid[n][0].shape[1] for n in norm)
        g_ = grp.setdefault(group, [0, 0]); g_[0] = max(g_[0], h); g_[1] = max(g_[1], w)
    for k, (h, w) in grp.items(): scales[k] = min(FIG_H / h, (SIZE - 4) / w)
    report = {'sayfalar': [], 'referans': ref}
    for (job, (res, comps)) in zip(jobs, outs):
        name, path, lay, names, group = job
        if 'hata' in res: report['sayfalar'].append(res); continue
        for n, stem in names.items():
            c = comps.get(n)
            if c is None: res['eksik'].append(n); continue
            rgba, bb, warn = c
            if any(x.startswith('ELLE:') for x in warn): res['elle'].append({'hucre': n, 'cikti': stem, 'neden': warn[0]}); continue
            sc = scales[group]
            if lay == 'hizir':   # kardeş Paladin sayfasının ölçeği (aynı ırk/cinsiyet), yükseklik 240'ı aşmaz
                race, gen = stem.split('-')[0], stem.split('-')[1]
                sib = find_raw(f'paladin-{INV[gen]}-{race}')
                if sib:
                    sc_ = components_of_sheet(sib, 'paladin'); vv = [v[0] for k_, v in sc_.items() if k_ <= 10 and not any(x.startswith('ELLE') for x in v[2])]
                    if vv: sc = min(FIG_H / max(v.shape[0] for v in vv), (SIZE - 4) / max(v.shape[1] for v in vv))
                sc = min(sc, FIG_H / rgba.shape[0], (SIZE - 4) / rgba.shape[1])
            if TALL.get(lay) == n: sc = min(FIG_H / rgba.shape[0], (SIZE - 4) / rgba.shape[1])
            tok, nh, shifted = render(rgba, bbox(rgba), sc, rgba.shape[1] / 2)
            tok.save(f'{OUT}/{stem}.webp', 'WEBP', quality=92, alpha_quality=100, method=4)
            tok.resize((96, 96), Image.LANCZOS).save(f'{OUT}/kucuk/{stem}.webp', 'WEBP', quality=82, method=4)
            res['kesilen'].append({'hucre': n, 'cikti': stem, 'olcek': round(sc, 4), 'uyari': [w_ for w_ in warn]})
        report['sayfalar'].append(res)
        # kontak sayfası
        px = 128; ks = res['kesilen']
        if ks:
            im = Image.new('RGB', (px * min(6, len(ks)), (px + 14) * ((len(ks) + 5) // 6)), (96, 100, 112)); d = ImageDraw.Draw(im)
            for i, k_ in enumerate(ks):
                t = Image.open(f"{OUT}/{k_['cikti']}.webp").convert('RGBA').resize((px, px), Image.LANCZOS)
                ox, oy = (i % 6) * px, (i // 6) * (px + 14); im.paste(t, (ox, oy + 14), t); d.text((ox + 2, oy + 1), f"{k_['hucre']} {k_['cikti'][-22:]}", fill=(255, 255, 255))
            im.save(f'docs/sabah/toplu-kesim-yeni/{os.path.splitext(name)[0]}.jpg', quality=85)
    if only_: print('kısmi çalıştırma: rapor dosyası güncellenmedi'); [print(r['dosya'], len(r['kesilen'])) for r in report['sayfalar']]; return
    json.dump(report, open('data/toplu-kesim-yeni-rapor.json', 'w'), ensure_ascii=False, indent=1)
    kes = sum(len(r['kesilen']) for r in report['sayfalar']); el = sum(len(r['elle']) for r in report['sayfalar']); ek = sum(len(r['eksik']) for r in report['sayfalar'])
    print(f'{len(jobs)} sayfa, {kes} jeton kesildi, {el} hücre ELLE (otomatik kesim güvenli değil), {ek} hücre figür bulunamadı, {time.time() - t0:.0f} sn')
    for r in report['sayfalar']:
        if r.get('hata') or r['elle'] or r['eksik']: print('  ', r['dosya'], r.get('hata', ''), 'ELLE', [(e['hucre'], e['neden'][:50]) for e in r['elle']], 'eksik', r['eksik'])

if __name__ == '__main__':
    if '--yeni' in sys.argv: yeni_main(); sys.exit(0)
    if '--yeni-uygula' in sys.argv:
        scales = {}
        for f in glob.glob('/tmp/claude-0/s/toplu-*.json'):
            for r in json.load(open(f)):
                if 'olcek' in r: scales[(r['sinif'], r['cinsiyet'], r['irk'])] = r['olcek']
        o = apply_new(scales); print({k: len(v) for k, v in o.items()}); sys.exit(0)
    only = [a for a in sys.argv[1:] if not a.startswith('--')] or ORIG
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
