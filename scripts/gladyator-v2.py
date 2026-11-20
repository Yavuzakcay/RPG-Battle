#!/usr/bin/env python3
"""Gladyatör sayfaları v2: Gemini'ye giden her hücre 768×768 (en az 650). 2'li sayfalar 1536×768, Dragonborn tek hücre 768×768.
Kaynak: docs/sabah/gladyator-sayfa/ (eslesme.csv hücre sırası ve zemin rengi; ten referansı oradaki sayfalardan) ve hücre görseli için ham Fighter sayfaları
(assets-ham/karakter/fighter-<male|female>-<ırk>.jpg; ilk argüman klasör): 640 px sayfa yerine ham sayfadan kesilir, çift yeniden örnekleme olmaz.
Çıktı: docs/sabah/gladyator-sayfa/v2/ (gladyator-<erkek|kadin>-01..04.png, -dragonborn.png, eslesme-v2.csv). Üzerine yazmaz, silmez."""
import csv, importlib.util, os, sys
import numpy as np
from PIL import Image
RAW = sys.argv[1] if len(sys.argv) > 1 else 'assets-ham/karakter'
SRC, OUT = 'docs/sabah/gladyator-sayfa', 'docs/sabah/gladyator-sayfa/v2'
CELL, FILL = 768, 0.65
KEYS = {'yesil': (0, 255, 0), 'macenta': (255, 0, 255)}
PAGES = [['tiefling', 'celestial'], ['dwarf', 'elf'], ['gnome', 'goliath'], ['halfling', 'orc']]
GENS = {'erkek': 'male', 'kadin': 'female'}
# ten örnek merkezleri (eski 1920 px sayfa piksel koordinatı; yüz bölgesi, doğrulama görüntüsüyle ayarlandı)
FACE = {('erkek', 'tiefling'): (330, 225), ('erkek', 'celestial'): (985, 250), ('erkek', 'dwarf'): (1640, 225), ('erkek', 'elf'): (350, 900), ('erkek', 'gnome'): (970, 920),
        ('erkek', 'goliath'): (1620, 850), ('erkek', 'halfling'): (350, 1540), ('erkek', 'orc'): (985, 1480),
        ('kadin', 'tiefling'): (335, 215), ('kadin', 'celestial'): (1006, 242), ('kadin', 'dwarf'): (1630, 250), ('kadin', 'elf'): (340, 880), ('kadin', 'gnome'): (1000, 930),
        ('kadin', 'goliath'): (1610, 850), ('kadin', 'halfling'): (340, 1530), ('kadin', 'orc'): (975, 1500),
        ('erkek', 'dragonborn'): (330, 245), ('kadin', 'dragonborn'): (975, 245)}
R = 14
spec = importlib.util.spec_from_file_location('gs', 'scripts/gladyator-sayfa.py')
src = open('scripts/gladyator-sayfa.py').read().replace('\nmain()\n', '\n')   # yalnız işlevler
ns = {'__name__': 'gs'}; sys.argv = [sys.argv[0], RAW]; exec(compile(src, 'gladyator-sayfa.py', 'exec'), ns)
extract, cell_of = ns['extract'], ns['cell_of']
def nearest_key(rgb):
    return min(KEYS, key=lambda k: sum((a - b) ** 2 for a, b in zip(KEYS[k], rgb)))
def hexc(c): return '#%02X%02X%02X' % tuple(int(v) for v in c)
def skin(gen, race):
    sheet = 'sancaktar-dragonborn.png' if race == 'dragonborn' else f'sancaktar-{gen}.png'
    a = np.asarray(Image.open(f'{SRC}/{sheet}').convert('RGB')).astype(int); x, y = FACE[(gen, race)]
    p = a[y - R:y + R, x - R:x + R].reshape(-1, 3)
    p = p[(p.max(axis=1) > 70) & ~((p[:, 1] > 200) & (p[:, 0] < 80)) & ~((p[:, 0] > 200) & (p[:, 2] > 200) & (p[:, 1] < 80))]   # outline ve zemin hariç
    med = np.median(p, axis=0); q = p[np.linalg.norm(p - med, axis=1) < 40]
    return q.mean(axis=0), len(q)
def make(fig, key):
    w, h = fig.size; s = FILL * CELL / max(w, h); nw, nh = max(1, round(w * s)), max(1, round(h * s))
    f = fig.resize((nw, nh), Image.LANCZOS)
    al = np.array(f)[..., 3]; f = Image.fromarray(np.dstack([np.array(f)[..., :3], np.where(al >= 128, 255, 0).astype(np.uint8)]), 'RGBA')   # sert kenar
    c = Image.new('RGB', (CELL, CELL), KEYS[key]); c.paste(f, ((CELL - nw) // 2, (CELL - nh) // 2), f)
    ys, xs = np.where(np.array(f)[..., 3] > 0)
    px0, py0 = (CELL - nw) // 2 + xs.min(), (CELL - nh) // 2 + ys.min(); px1, py1 = (CELL - nw) // 2 + xs.max(), (CELL - nh) // 2 + ys.max()
    assert min(px0, py0, CELL - 1 - px1, CELL - 1 - py1) >= CELL * 0.10, 'marj'
    return c
old = {}
for r in csv.DictReader(open(f'{SRC}/eslesme.csv', encoding='utf-8-sig')): old[(r['yeni_sayfa'], r['irk'], r['cinsiyet'])] = r
os.makedirs(OUT, exist_ok=True)
def save(img, name):
    p = f'{OUT}/{name}'
    if os.path.exists(p): raise SystemExit(f'{p} var; üzerine yazılmaz')
    img.save(p)
rows = []
for gen, g in GENS.items():
    cells = {}
    for race in sum(PAGES, []) + ['dragonborn']:
        sheet = 'sancaktar-dragonborn.png' if race == 'dragonborn' else f'sancaktar-{gen}.png'
        o = old[(sheet, race, gen)]
        key = 'macenta' if race == 'dragonborn' else nearest_key(tuple(int(o['kaynak_zemin'][i:i + 2], 16) for i in (1, 3, 5)))
        fig, _ = extract(cell_of(f'{RAW}/fighter-{g}-{race}.jpg')); cells[race] = (make(fig, key), key, o)
    for pg, pair in enumerate(PAGES + [['dragonborn']], 1):
        name = f'gladyator-{gen}-dragonborn.png' if pair == ['dragonborn'] else f'gladyator-{gen}-{pg:02d}.png'
        sheet = Image.new('RGB', (CELL * len(pair), CELL))
        for i, race in enumerate(pair):
            c, key, o = cells[race]; sheet.paste(c, (i * CELL, 0)); t, n = skin(gen, race)
            rows.append([name, i + 1, race, gen, f"{o['yeni_sayfa']} hücre {o['yeni_hucre']}", hexc(KEYS[key]), o['kaynak_zemin'], f'{CELL}x{CELL}', hexc(t), n])
        save(sheet, name)
p = f'{OUT}/eslesme-v2.csv'
assert not os.path.exists(p)
with open(p, 'w', newline='', encoding='utf-8') as fh:
    w = csv.writer(fh); w.writerow(['sayfa', 'hucre', 'irk', 'cinsiyet', 'kaynak_hucre', 'zemin_hex', 'kaynak_zemin_ornek', 'hucre_boyutu', 'ten_hex', 'ten_ornek_px']); w.writerows(rows)
print(len(rows))
