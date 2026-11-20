#!/usr/bin/env python3
"""Görev WZ-KESIM: Wizard jeton sayfalarını keser (A 4x2 = 8, B 4x2 = 7 dolu) → public/characters/<irk>-<cinsiyet>-wizard-<WZ-id>.webp.
Ham sayfalar assets-ham/karakter/ altında (depoya girmez; `git checkout origin/wip/karakter-ham -- assets-ham/karakter`).
Çalıştırma: python3 scripts/wizard-kesim.py   (yalnız Pillow, numpy, scipy)
"""
import glob, json, os, re, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

RAW = 'assets-ham/karakter'
OUT = 'public/characters'
MAP_OUT = 'data/wizard-esleme'
SIZE, FIG_H, TOP, FOOT = 256, 240, 8, 247
GREEN, MAGENTA = np.array([0, 255, 0]), np.array([255, 0, 255])
T_FLOOD, T_HOLE, HOLE_MIN, SPECK = 80, 45, 20, 20
PEEL_CHROMA, PEEL_ITER, SPILL = 90, 2, 50
GEN = {'male': 'erkek', 'female': 'kadin', 'erkek': 'erkek', 'kadin': 'kadin'}
PATCH1 = [('tiefling', 'erkek', 'WZ-A3'), ('human', 'erkek', 'WZ-A3'), ('celestial', 'erkek', 'WZ-B5'), ('tiefling', 'kadin', 'WZ-A3')]
PATCH_ELF = ('elf', 'erkek', 'WZ-B7')

def find(stem):
    c = [f for f in glob.glob(f'{RAW}/{stem}.*')]
    return c[0] if c else None

def intervals(frac, thr=0.97, minw=150):
    """Koyu ayraç sütunları/satırları arasındaki dolu aralıklar."""
    ok = frac < thr; out = []; s = None
    for i, v in enumerate(ok):
        if v and s is None: s = i
        if not v and s is not None:
            if i - s >= minw: out.append((s, i))
            s = None
    if s is not None and len(ok) - s >= minw: out.append((s, len(ok)))
    return out

def grid(img):
    a = np.asarray(img).astype(int)
    dark = a.max(axis=2) < 70
    return intervals(dark.mean(axis=0)), intervals(dark.mean(axis=1))

def bg_of(cell):
    h, w = cell.shape[:2]; p = 10
    patches = np.concatenate([cell[:p, :p].reshape(-1, 3), cell[:p, -p:].reshape(-1, 3), cell[-p:, :p].reshape(-1, 3), cell[-p:, -p:].reshape(-1, 3)])
    med = np.median(patches, axis=0)
    dg, dm = np.linalg.norm(med - GREEN), np.linalg.norm(med - MAGENTA)
    return ('green', GREEN, dg) if dg < dm else ('magenta', MAGENTA, dm)

def chroma(a, kind):
    a = a.astype(int)
    return (np.minimum(a[..., 0], a[..., 2]) - a[..., 1]) if kind == 'magenta' else (a[..., 1] - np.maximum(a[..., 0], a[..., 2]))

def key(cell, pad=0):
    """Hücre → (RGBA, zemin adı, bilgi). Yalnız kenardan bağlı zemin anahtarlanır; içte kalan zemin delikleri sıkı toleransla."""
    kind, col, dev = bg_of(cell)
    if pad:
        cell = np.pad(cell, ((pad, pad), (pad, pad), (0, 0)), mode='constant', constant_values=0) + 0
        cell[:pad] = col; cell[-pad:] = col; cell[:, :pad] = col; cell[:, -pad:] = col
    d = np.linalg.norm(cell.astype(float) - col, axis=2)
    lab, n = ndi.label(d < T_FLOOD)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgm = np.isin(lab, list(edge))
    holes = 0
    lab2, n2 = ndi.label((d < T_HOLE) & ~bgm)
    if n2:
        sizes = ndi.sum(np.ones_like(lab2), lab2, index=range(1, n2 + 1))
        for i, s in enumerate(sizes, 1):
            if s >= HOLE_MIN: bgm |= lab2 == i; holes += 1
    ch = chroma(cell, kind)
    for _ in range(PEEL_ITER):
        near = ndi.binary_dilation(bgm, iterations=1) & ~bgm
        bgm |= near & (ch > PEEL_CHROMA)
    # Kenarda kalan zemin sızıntısı (JPEG kenar karışımı): bitişik 2 piksel bandında zemin renginin kroması kısılır (karakterin iç pembe/yeşil ögelerine dokunmaz)
    band = ndi.binary_dilation(bgm, iterations=2) & ~bgm
    c = cell.astype(int).copy()
    if kind == 'magenta':
        lim = c[..., 1] + SPILL
        c[..., 0] = np.where(band, np.minimum(c[..., 0], lim), c[..., 0]); c[..., 2] = np.where(band, np.minimum(c[..., 2], lim), c[..., 2])
    else:
        lim = np.maximum(c[..., 0], c[..., 2]) + SPILL
        c[..., 1] = np.where(band, np.minimum(c[..., 1], lim), c[..., 1])
    cell = c.astype(np.uint8)
    fg = ~bgm
    lab3, n3 = ndi.label(fg, structure=np.ones((3, 3)))
    if n3:
        sizes = ndi.sum(np.ones_like(lab3), lab3, index=range(1, n3 + 1))
        small = [i for i, s in enumerate(sizes, 1) if s < SPECK]
        if small: fg &= ~np.isin(lab3, small)
    rgba = np.dstack([cell, (fg * 255).astype(np.uint8)])
    return rgba, kind, {'zeminSapma': round(float(dev), 1), 'icDelik': holes}

def bbox(rgba):
    ys, xs = np.where(rgba[..., 3] > 0)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else None

def make_tokens(cells, label, pad=0):
    """cells: [(id, rgb ndarray)] → tek ölçekle 256x256 jetonlar."""
    keyed = []
    for cid, c in cells:
        rgba, kind, info = key(c, pad)
        bb = bbox(rgba)
        if bb is None: raise SystemExit(f'{label} {cid}: boş hücre')
        h, w = rgba.shape[:2]
        touches = bool(rgba[0, :, 3].any() or rgba[-1, :, 3].any() or rgba[:, 0, 3].any() or rgba[:, -1, 3].any())
        keyed.append((cid, rgba, kind, info, bb, touches))
    hmax = max(b[4][3] - b[4][1] for b in keyed); wmax = max(b[4][2] - b[4][0] for b in keyed)
    scale = min(FIG_H / hmax, (SIZE - 4) / wmax)
    toks = {}
    for cid, rgba, kind, info, bb, touches in keyed:
        x0, y0, x1, y1 = bb
        im = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')
        nw, nh = max(1, round((x1 - x0) * scale)), max(1, round((y1 - y0) * scale))
        im = im.resize((nw, nh), Image.LANCZOS)
        cx = rgba.shape[1] / 2
        left = round(SIZE / 2 + (x0 - cx) * scale)  # hücre merkezi → 128
        if left < 0 or left + nw > SIZE: left = round((SIZE - nw) / 2); info['merkezBBox'] = True
        top = FOOT + 1 - nh
        canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0)); canvas.alpha_composite(im, (left, max(0, top)) if top >= 0 else (left, 0))
        canvas = clean_edges(canvas)
        toks[cid] = (canvas, kind, {**info, 'kenaraDegiyor': touches, 'bboxKaynak': [int(v) for v in bb], 'yukseklikPx': nh, 'ustBosluk': max(0, top)})
    return toks, scale

def clean_edges(canvas, passes=3, thr=110):
    """Küçültme sonrası kalan zemin renkli kenar pikselleri (saf #00FF00/#FF00FF'ye yakın) saydamlaştırılır; iç ögelere dokunmaz."""
    a = np.array(canvas)
    for _ in range(passes):
        al = a[..., 3] > 0
        edge = al & ndi.binary_dilation(~al, structure=np.ones((3, 3)))
        rgb = a[..., :3].astype(float)
        near = (np.linalg.norm(rgb - MAGENTA, axis=2) < thr) | (np.linalg.norm(rgb - GREEN, axis=2) < thr)
        kill = edge & near
        if not kill.any(): break
        a[kill] = 0
    return Image.fromarray(a, 'RGBA')

def residue(canvas, kind_hint=None):
    """Kenar piksel taraması: saydam komşusu olan opak piksellerde magenta/yeşil kalıntı."""
    a = np.asarray(canvas); al = a[..., 3] > 128
    edge = al & ndi.binary_erosion(~al, border_value=1, iterations=1, structure=np.ones((3, 3))) if False else al & ndi.binary_dilation(~al, structure=np.ones((3, 3)))
    rgb = a[..., :3].astype(int)
    mg = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1] > 100
    gr = rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]) > 100
    return int((edge & mg).sum()), int((edge & gr).sum())

def main():
    sheets = {}
    for f in sorted(glob.glob(f'{RAW}/wizard-*')):
        m = re.match(r'wizard-(male|female|erkek|kadin)-([a-z]+)-([ab])\.', os.path.basename(f))
        if m: sheets[(m.group(2), GEN[m.group(1)], m.group(3))] = f
    races = sorted({k[0] for k in sheets})
    report, all_tokens, problems = [], {}, []
    # yamalar
    patch = {}
    pf = glob.glob(f'{RAW}/wizard-yama-1*')
    if pf:
        img = Image.open(pf[0]).convert('RGB'); cols, rows = grid(img)
        if len(cols) != 4 or len(rows) != 1: problems.append(f'yama-1: ızgara {len(cols)}x{len(rows)}')
        else:
            a = np.asarray(img); (y0, y1) = rows[0]
            toks, sc = make_tokens([(i, a[y0:y1, x0:x1]) for i, (x0, x1) in enumerate(cols)], 'yama-1', pad=12)
            for i, (race, gen, wid) in enumerate(PATCH1): patch[(race, gen, wid)] = (toks[i], 'yama-1 hücre %d' % (i + 1), sc)
    pf = glob.glob(f'{RAW}/wizard-yama-*elf-b7*')
    if pf:
        a = np.asarray(Image.open(pf[0]).convert('RGB'))
        toks, sc = make_tokens([(0, a)], 'yama-elf-b7', pad=16)
        patch[PATCH_ELF] = (toks[0], 'yama-elf-b7', sc)
    used = set()
    for race in races:
        for gen in ('erkek', 'kadin'):
            for page in ('a', 'b'):
                f = sheets.get((race, gen, page))
                if not f: problems.append(f'eksik sayfa: {race} {gen} {page}'); continue
        for gen in ('erkek', 'kadin'):
            mapping = {'irk': race, 'cinsiyet': gen, 'hucreler': {}, 'atilan': [], 'yamali': []}
            for page in ('a', 'b'):
                f = sheets.get((race, gen, page))
                if not f: continue
                img = Image.open(f).convert('RGB'); cols, rows = grid(img)
                if len(cols) != 4 or len(rows) != 2: problems.append(f'{os.path.basename(f)}: ızgara {len(cols)}x{len(rows)}'); continue
                a = np.asarray(img); n = 8 if page == 'a' else 7
                cells = []
                for i in range(8):
                    r, c = divmod(i, 4); (y0, y1), (x0, x1) = rows[r], cols[c]
                    cells.append((f'WZ-{page.upper()}{i + 1}', a[y0 + 3:y1 - 3, x0 + 3:x1 - 3]))
                if page == 'b':  # B8 boş olmalı
                    b8 = cells.pop()[1]; k = key(b8)[0]; 
                    if bbox(k) is not None: problems.append(f'{race} {gen} B8 boş değil')
                    mapping['atilan'].append('WZ-B8 (boş hücre)')
                toks, sc = make_tokens(cells, f'{race} {gen} {page}')
                for cid, (cv, kind, info) in toks.items():
                    src = f'sayfa {page.upper()}'
                    if (race, gen, cid) in patch:
                        (pcv, pk, pinfo), pname, psc = patch[(race, gen, cid)]; used.add((race, gen, cid))
                        mapping['atilan'].append(cid + ' (asıl hücre)'); mapping['yamali'].append({'id': cid, 'yama': pname})
                        cv, kind, info, src = pcv, pk, pinfo, pname
                    cv.save(f'{OUT}/{race}-{gen}-wizard-{cid}.webp', 'WEBP', lossless=True, quality=100, method=6)
                    mg, gr = residue(cv)
                    mapping['hucreler'][cid] = {'kaynak': src, 'arkaPlan': kind, **info}
                    all_tokens[(race, gen, cid)] = cv
                    if mg or gr: problems.append(f'{race} {gen} {cid}: kenar kalıntısı magenta {mg}, yeşil {gr}')
                mapping[f'olcek{page.upper()}'] = round(sc, 4)
            json.dump(mapping, open(f'{MAP_OUT}/esleme-wizard-{race}-{gen}.json', 'w'), ensure_ascii=False, indent=1)
            n = len(mapping['hucreler']); report.append(f'{race:10s} {gen:5s} {n} jeton' + ('' if n == 15 else '  ← BEKLENEN 15'))
            if n != 15: problems.append(f'{race} {gen}: {n} jeton')
    for k in patch:
        if k not in used: problems.append(f'yama kullanılmadı: {k}')
    print('\n'.join(report))
    json.dump({'irklar': races, 'sorun': problems}, open('/tmp/claude-0/s/wz-rapor.json', 'w'), ensure_ascii=False, indent=1)
    print('SORUN:', *problems, sep='\n  ') if problems else print('sorun yok')
    # kontrol sayfaları
    def sheet(keys, path, px, bg=(96, 100, 112)):
        ids = [f'WZ-A{i}' for i in range(1, 9)] + [f'WZ-B{i}' for i in range(1, 8)]
        rows = sorted({(k[0], k[1]) for k in keys}); W, H = px * 15 + 70, px * len(rows)
        im = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(im)
        for r, (race, gen) in enumerate(rows):
            d.text((2, r * px + px // 2), f'{race[:7]}\n{gen}', fill=(255, 255, 255))
            for c, cid in enumerate(ids):
                t = all_tokens.get((race, gen, cid))
                if t is None: continue
                t = t.resize((px, px), Image.LANCZOS) if px != SIZE else t
                im.paste(t, (70 + c * px, r * px), t)
        os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path)
    sheet(all_tokens, 'docs/sabah/wizard-kesim-kontrol.png', 128)
    sheet([k for k in all_tokens if k[0] == 'orc'], 'docs/sabah/wizard-kesim-orc.png', 192)
    pk = {(r, g, c) for (r, g, c) in used}
    py = [(k, all_tokens[k]) for k in sorted(pk)]
    im = Image.new('RGB', (256 * len(py), 256), (96, 100, 112))
    for i, (k, t) in enumerate(py): im.paste(t, (i * 256, 0), t)
    im.save('docs/sabah/wizard-kesim-yama.png')

if __name__ == '__main__':
    if '--sadece-temizle' in sys.argv:  # kayıtlı jetonlara yalnız kenar temizliği (hızlı)
        for f in sorted(glob.glob(f'{OUT}/*-wizard-WZ-*.webp')):
            Image.open(f).convert('RGBA')
            clean_edges(Image.open(f).convert('RGBA')).save(f, 'WEBP', lossless=True, quality=100, method=6)
    else:
        main()
