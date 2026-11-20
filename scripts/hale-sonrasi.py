#!/usr/bin/env python3
"""KQ6-12: docs/sabah/hale-sonrasi.png kontak sayfası (264 Celestial jeton: once | sonra Parlayan Ruh | sonra Gece Gözyaşı halesiz) ve docs/sabah/hale-elle.md."""
import io, json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
REF = sys.argv[sys.argv.index('--once') + 1] if '--once' in sys.argv else 'bb36b76'
D = 'public/characters'
def src(n):
    b = subprocess.run(['git', 'show', f'{REF}:{D}/{n}.webp'], capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(b)).convert('RGBA')
names = sorted(f[:-5] for f in os.listdir(D) if f.startswith('celestial-') and f.endswith('.webp'))
elle = json.load(open('data/hale-elle.json')); bek = elle['bekleyen']
cw, ch, lab = 200, 86, 12
COLS = 2
rows = (len(names) + COLS - 1) // COLS
im = Image.new('RGB', (COLS * (cw * 3 + 8), rows * (ch + lab)), (96, 100, 112)); dr = ImageDraw.Draw(im)
for i, n in enumerate(names):
    ox = (i % COLS) * (cw * 3 + 8); oy = (i // COLS) * (ch + lab)
    a = src(n); main = Image.open(f'{D}/{n}.webp').convert('RGBA')
    hp = f'{D}/halesiz/{n}.webp'; ges = Image.open(hp).convert('RGBA') if os.path.exists(hp) else None
    for k, t in enumerate((a, main, ges if ges is not None else a)):
        v = t.crop((28, 0, 228, ch)); im.paste(v, (ox + k * cw, oy + lab), v)
    st = ('BEKLEYEN: ' + bek[n]['durum']) if n in bek else ''
    dr.text((ox + 2, oy + 1), f'{n[10:]} | once | sonra (Parlayan Ruh) | sonra (Gece Gozyasi) {st}'[:120], fill=(255, 255, 255) if not st else (255, 200, 120))
im.save('docs/sabah/hale-sonrasi.png'); print(im.size)
def cell(n):
    m = re.match(r'celestial-(erkek|kadin)-([a-z]+)-(.+)$', n)
    return (m.group(2), m.group(3), m.group(1)) if m else ('genel', n.split('-', 2)[-1], n.split('-')[1])
L = ['# Hale: ELLE listesi (KQ6-12)', '', 'Sınıf / hücre kodu / cinsiyet = jeton hücresi (`<ırk>-<cinsiyet>-<sınıf>-<kod>`); neden: güvenlik kontrolü ya da elle karar. Bu jetonlarda **asıl jeton değişmedi** ve Gece Gözyaşı / Kırık Kanat için halesiz varyantı üretilmedi: hale şimdilik görünür kalır.', '',
     '| Sınıf | Hücre | Cinsiyet | Durum | Neden |', '|---|---|---|---|---|']
for n, v in sorted(bek.items()):
    s, c, g = cell(n); L.append(f'| {s} | {c} | {g} | {v["durum"]} | {v["neden"]} |')
open('docs/sabah/hale-elle.md', 'w').write('\n'.join(L) + '\n'); print(len(bek))
