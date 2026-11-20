#!/usr/bin/env python3
"""Aura-sil sayfaları v2 (onay bekliyor; eski aura-sil-sayfa-0N.png'ye dokunmaz): Barbarian Çılgın Yol (ID8) 16 jeton için
1) komşu figür ayıklama (Halfling erkek, Gnome kadın: iki figürlü kaynakta boş sütun aralığından sağdaki Çılgın Yol figürü kalır),
2) kenar temizliği: yeşil kenar despill (kenar bandında g > max(r,b)+22 → g = max(r,b)), ayak hizası ve kenar bandındaki magenta anahtar kalıntısı saydam,
3) en büyük bağlı grup (4 px genişletmeyle birleşen bileşenler: silah ve kıyafet parçaları gruba dahil) korunur; ≥ %12 diğer gruplar da kalır.
Jeton dosyalarına dokunmaz (çıktı yalnız sayfalar). Çıktı: docs/sabah/aura-sil-v2-sayfa-01/02.png, aura-sil-v2-eslesme.csv, aura-sil-karsilastirma.png."""
import csv, glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
D = 'public/characters'
RACES = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'orc', 'tiefling', 'goliath']
CELL, ALT, YAN, UST = 512, 0.06, 0.04, 0.04
SPLIT = {'halfling-erkek-barbarian-ID8', 'gnome-kadin-barbarian-ID8'}
def bbox(img):
    a = np.array(img)[..., 3] > 8; ys, xs = np.where(a); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
def place(img, name):
    x0, y0, x1, y1 = bbox(img); w, h = x1 - x0, y1 - y0
    base = round(CELL * (1 - ALT)); sc = min(CELL * (1 - 2 * YAN) / w, (base - CELL * UST) / h)
    nw, nh = max(1, int(w * sc)), max(1, int(h * sc))
    crop = img.crop((x0, y0, x1, y1)).resize((nw, nh), Image.NEAREST)
    cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); cell.paste(crop, ((CELL - nw) // 2, base - nh), crop)
    bx0, by0, bx1, by1 = bbox(cell)
    assert by1 <= base and bx0 >= CELL * YAN - 1 and bx1 <= CELL * (1 - YAN) + 1 and by0 >= CELL * UST - 1, f'marj: {name}'
    return cell
def clean(name):
    a = np.array(Image.open(f'{D}/{name}.webp').convert('RGBA')); notes = {}
    al = a[..., 3] > 8
    if name in SPLIT:
        col = al.sum(0); gaps = [x for x in range(40, 216) if col[x] == 0]
        assert gaps, f'boş sütun yok: {name}'
        cut = int(np.median(gaps)); a[:, :cut + 1, 3] = 0; notes['ayiklanan_figur_px'] = int(al[:, :cut + 1].sum()); al = a[..., 3] > 8
    dist = ndi.distance_transform_edt(al)                       # saydam piksele uzaklık (kenar bandı)
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    # magenta anahtar kalıntısı: kenar bandında (≤3 px) ya da ayak hizasında (alt 24 satır)
    mag = al & (r - g > 60) & (b - g > 60) & (np.abs(r - b) < 90) & ((dist <= 3) | (np.arange(256)[:, None] >= np.where(al)[0].max() - 24))
    notes['magenta_px'] = int(mag.sum()); a[mag, 3] = 0; al = a[..., 3] > 8; dist = ndi.distance_transform_edt(al)
    # yeşil despill (kenar bandı ≤ 14 px)
    m = al & (dist <= 14) & (g > np.maximum(r, b) + 22)
    notes['despill_px'] = int(m.sum()); a[m, 1] = np.maximum(r, b)[m]
    # en büyük bağlı grup
    lab, n = ndi.label(ndi.binary_dilation(al, iterations=4), structure=np.ones((3, 3)))
    sizes = ndi.sum(al, lab, range(1, n + 1)); big = int(np.argmax(sizes)) + 1; removed = 0
    for i in range(1, n + 1):
        if i != big and sizes[i - 1] < 0.12 * sizes[big - 1]:
            kill = (lab == i) & al; removed += int(kill.sum()); a[kill, 3] = 0
    notes['kucuk_grup_px'] = removed
    return Image.fromarray(a), notes
F = ImageFont.truetype(glob.glob('/usr/share/fonts/**/DejaVuSans.ttf', recursive=True)[0], 13)
rows = []; pairs = []
for p, g in enumerate(['erkek', 'kadin']):
    sheet = Image.new('RGB', (1536, 1536), (255, 0, 255))
    for c, race in enumerate(RACES):
        name = f'{race}-{g}-barbarian-ID8'; before = Image.open(f'{D}/{name}.webp').convert('RGBA'); img, notes = clean(name)
        cell = place(img, name); sheet.paste(cell, ((c % 3) * 512, (c // 3) * 512), cell)
        rows.append((f'{p + 1:02d}', c + 1, f'{name}.webp', race, g, '; '.join(f'{k}={v}' for k, v in notes.items())))
        pairs.append((name, before, img))
    sheet.save(f'docs/sabah/aura-sil-v2-sayfa-{p + 1:02d}.png')
with open('docs/sabah/aura-sil-v2-eslesme.csv', 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['sayfa', 'hucre', 'dosya', 'irk', 'cinsiyet', 'temizlik']); w.writerows(rows)
T = 200; cmp = Image.new('RGB', (4 * 2 * T, 4 * (T + 18)), (255, 0, 255)); d = ImageDraw.Draw(cmp)
for i, (name, b, a) in enumerate(pairs):
    x, y = (i % 4) * 2 * T, (i // 4) * (T + 18)
    for k, im in enumerate((b, a)):
        t = im.resize((T, T), Image.NEAREST); cmp.paste(t, (x + k * T, y), t)
    d.rectangle((x, y + T, x + 2 * T, y + T + 17), fill=(30, 32, 40)); d.text((x + 4, y + T + 1), f'{name[:-len("-barbarian-ID8")]}  önce | sonra', fill=(255, 255, 255), font=F)
cmp.save('docs/sabah/aura-sil-karsilastirma.png')
for r in rows: print(r[2], r[5])
