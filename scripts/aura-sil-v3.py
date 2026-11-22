#!/usr/bin/env python3
"""Aura-sil sayfaları v3 (onay bekliyor; v1 ve v2 dosyalarına dokunmaz): Barbarian Çılgın Yol (ID8) 16 jeton, KAYNAK SAYFADAN yeniden kesim.
Ham: assets-ham/karakter/barbarian-<male|female>-<ırk>.jpg (git checkout origin/wip/karakter-ham -- assets-ham/karakter; ya da ilk argüman klasör).
Hücre 8 (3×3, satır 3 sütun 2) hücre sınırı içinde kırpılır (komşu hücre artığı girmez), hücrenin kendi zemin rengi örneklenir, en büyük bağlı grup
(+ ≥ %12 boyutundaki ve hücre kenarına değmeyen gruplar: silah/efekt parçaları) korunur, despill (kenar bandında zemin tonu, 1 px saçak) uygulanır.
Çıktı: docs/sabah/aura-sil-v3-sayfa-01/02.png (3×3, 1536², düz #FF00FF, hücre 512, her kenarda ≥ %10 boşluk, 9. hücre boş), aura-sil-v3-eslesme.csv,
aura-sil-v3-karsilastirma.png (eski v1 | yeni v3)."""
import csv, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
RAW = sys.argv[1] if len(sys.argv) > 1 else 'assets-ham/karakter'
OUT = 'docs/sabah'
RACES = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'orc', 'tiefling', 'goliath']
GEN = {'erkek': 'male', 'kadin': 'female'}
CELL, BOX, FOOT, MAG = 512, 0.80, 0.90, (255, 0, 255)   # figür en çok %80 kutu: her kenarda ≥ %10 boşluk
INSET, T = 10, 70
def cell_of(path):
    im = Image.open(path).convert('RGB'); W, H = im.size
    x0, x1, y0, y1 = round(W / 3), round(2 * W / 3), round(2 * H / 3), H          # hücre 8
    return np.asarray(im.crop((x0 + INSET, y0 + INSET, x1 - INSET, y1 - INSET))).astype(int)
def extract(a):
    edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    edge = edge[edge.max(axis=1) > 90]; bg = np.median(edge, axis=0)
    d = np.linalg.norm(a - bg, axis=2)
    m = ndi.binary_opening(d > T, iterations=1)
    lab, n = ndi.label(ndi.binary_dilation(m, iterations=4))
    sizes = ndi.sum(m, lab, range(1, n + 1)); big = int(np.argmax(sizes)) + 1
    H, W = m.shape; border = np.zeros_like(m); border[:2] = border[-2:] = True; border[:, :2] = border[:, -2:] = True
    ok, dropped = [big], 0
    for i, v in enumerate(sizes, 1):
        if i == big: continue
        if v >= 0.12 * sizes.max() and not (border & (lab == i) & m).any(): ok.append(i)
        else: dropped += int(v)
    keep = m & np.isin(lab, ok)
    keep = ndi.binary_fill_holes(keep) & (d > T * 0.6) | keep
    # despill: kenar bandında (≤ 4 px) zemine yakın renk ve zemin tonu kalıntısı silinir, 1 px daralt
    band = keep & ~ndi.binary_erosion(keep, iterations=4)
    r_, g_, b_ = a[..., 0], a[..., 1], a[..., 2]
    tint = (g_ > np.maximum(r_, b_) + 45) if bg[1] > bg[0] else (np.minimum(r_, b_) > g_ + 45)
    keep &= ~(band & ((d < 150) | (tint & (d < 200))))
    keep = ndi.binary_opening(ndi.binary_erosion(keep, iterations=1), iterations=1)
    ys, xs = np.where(keep)
    rgba = np.dstack([a, keep * 255]).astype(np.uint8)[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(rgba, 'RGBA'), bg, dropped
def place(fig):
    w, h = fig.size; s = BOX * CELL / max(w, h)
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    f = fig.resize((nw, nh), Image.NEAREST)
    cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); cell.paste(f, ((CELL - nw) // 2, round(CELL * FOOT) - nh), f)
    a = np.array(cell)[..., 3] > 8; ys, xs = np.where(a)
    assert min(xs.min(), ys.min(), CELL - 1 - xs.max(), CELL - 1 - ys.max()) >= CELL * 0.10 - 1, 'marj'
    return cell
def save(img, name):
    p = f'{OUT}/{name}'
    if os.path.exists(p): raise SystemExit(f'{p} var; üzerine yazılmaz')
    img.save(p)
rows, cells = [], {}
for pg, (gen, g) in enumerate(GEN.items(), 1):
    sheet = Image.new('RGB', (3 * CELL, 3 * CELL), MAG)
    for c, race in enumerate(RACES):
        src = f'barbarian-{g}-{race}.jpg'
        fig, bg, dropped = extract(cell_of(f'{RAW}/{src}')); cell = place(fig); cells[(pg, c)] = cell
        sheet.paste(cell, ((c % 3) * CELL, (c // 3) * CELL), cell)
        rows.append([f'{pg:02d}', c + 1, f'{race}-{gen}-barbarian-ID8.webp', race, gen, src, 'hücre 8', '#%02X%02X%02X' % tuple(int(v) for v in bg), dropped])
    save(sheet, f'aura-sil-v3-sayfa-{pg:02d}.png')
p = f'{OUT}/aura-sil-v3-eslesme.csv'
assert not os.path.exists(p)
with open(p, 'w', newline='', encoding='utf-8') as fh:
    w = csv.writer(fh); w.writerow(['sayfa', 'hucre', 'dosya', 'irk', 'cinsiyet', 'kaynak_sayfa', 'kaynak_hucre', 'kaynak_zemin', 'atilan_komsu_px']); w.writerows(rows)
# karşılaştırma: eski (v1 sayfaları) | yeni (v3), her jeton 256 px, magenta zemin
S = 256; cols = 4
cmp_ = Image.new('RGB', (cols * 2 * S, 4 * (S + 18)), (255, 0, 255)); dr = ImageDraw.Draw(cmp_)
for i, (pg, c) in enumerate(sorted(cells)):
    old = Image.open(f'{OUT}/aura-sil-sayfa-{pg:02d}.png').convert('RGB').crop(((c % 3) * CELL, (c // 3) * CELL, (c % 3) * CELL + CELL, (c // 3) * CELL + CELL)).resize((S, S), Image.NEAREST)
    new = Image.new('RGB', (CELL, CELL), MAG); new.paste(cells[(pg, c)], (0, 0), cells[(pg, c)]); new = new.resize((S, S), Image.NEAREST)
    x, y = (i % cols) * 2 * S, (i // cols) * (S + 18)
    cmp_.paste(old, (x, y + 18)); cmp_.paste(new, (x + S, y + 18))
    r = rows[i]; dr.rectangle((x, y, x + 2 * S, y + 16), fill=(0, 0, 0)); dr.text((x + 4, y + 3), f'{r[3]} {r[4]}  eski | yeni (sayfa {r[0]} hücre {r[1]})', fill=(255, 255, 255))
    dr.line((x + S, y + 18, x + S, y + 18 + S), fill=(0, 0, 0))
save(cmp_, 'aura-sil-v3-karsilastirma.png')
print(len(rows))
