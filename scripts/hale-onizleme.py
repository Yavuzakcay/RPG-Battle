#!/usr/bin/env python3
"""İŞ 2 önizleme: Gece Gözyaşı (sabit kırpma ↔ jeton başına gerçek hale pikselleri) ve hale durumları (tam/kesik/yok; çizilen hale)."""
import importlib.util, sys, os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
spec = importlib.util.spec_from_file_location('ht', 'scripts/hale-tespit.py'); ht = importlib.util.module_from_spec(spec); spec.loader.exec_module(ht)
CLIP = int(256 * 0.095)

def load(n): return Image.open(f'public/characters/{n}.webp').convert('RGBA')
def fixed_clip(img):
    a = np.array(img); a[:CLIP, :, 3] = 0; return Image.fromarray(a)
def remove_halo(img):
    a = np.array(img); d = ht.detect(a)
    if d['mask'].any(): a[d['mask'], 3] = 0
    return Image.fromarray(a), d
def draw_halo(img):
    """Kodla çizilen tek tip hale: başın üstüne ortalı altın ince elips, hafif parıltı, figürün ARKASINDA."""
    a = np.array(img); al = a[..., 3] > 60
    gm = ht.gold(a); solid = al & ~gm
    dense = next((y for y in range(256) if ht.runs(solid[y]) >= 18), 20)
    xs = np.where(solid[dense:dense + 14])[1]; cx = int(xs.mean()) if len(xs) else 128
    cy = max(7, dense - 4); rx, ry = 26, 6
    layer = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=(255, 214, 72, 255), width=2)
    glow = layer.filter(ImageFilter.GaussianBlur(2)); glow = Image.blend(Image.new('RGBA', (256, 256), (0, 0, 0, 0)), glow, 0.6)
    out = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); out.alpha_composite(glow); out.alpha_composite(layer); out.alpha_composite(img)
    return out

if __name__ == '__main__':
    classes = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
    pick = {'barbarian': 'ID1', 'bard': 'ID5', 'cleric': 'ID3', 'druid': 'ID7', 'fighter': 'ID1', 'monk': 'ID4', 'paladin': 'ID8', 'ranger': 'ID5', 'rogue': 'ID3', 'sorcerer': 'SC-1', 'warlock': 'WL-3', 'wizard': 'WZ-A1'}
    items = [(f'celestial-erkek-{c}-{pick[c]}', c) for c in classes] + [('celestial-erkek-bard-ID9', 'bard yesil sapka')]
    px = 128
    im = Image.new('RGB', (px * len(items), px * 2 + 24), (96, 100, 112)); dr = ImageDraw.Draw(im)
    for i, (n, label) in enumerate(items):
        t = load(n); before = fixed_clip(t); after, d = remove_halo(t)
        for k, v in enumerate((before, after)):
            v2 = v.resize((px, px), Image.LANCZOS); im.paste(v2, (i * px, 12 + k * (px + 0)), v2)
        dr.text((i * px + 2, 1), f'{label} [{d["durum"]}]', fill=(255, 255, 255))
    im.save('docs/sabah/hale-gece-gozyasi-onizleme.png')
    # hale durumları: kesik / yok / tam örnekleri (tespit tablosundan) + çizilen hale
    rows = json.load(open('/tmp/claude-0/s/hale.json'))
    by = {}
    for n, st, bb in rows: by.setdefault(st, []).append(n)
    sel = by.get('kesik', [])[:2] + by.get('yok', [])[:2] + by.get('tam', [])[:2]
    im2 = Image.new('RGB', (px * 2 * len(sel), px + 14), (96, 100, 112)); dr = ImageDraw.Draw(im2)
    for i, n in enumerate(sel):
        t = load(n); st = [r[1] for r in rows if r[0] == n][0]
        for k, v in enumerate((t, draw_halo(remove_halo(t)[0]) if st != 'tam' else t)):
            v2 = v.resize((px, px), Image.LANCZOS); im2.paste(v2, ((i * 2 + k) * px, 14), v2)
        dr.text((i * 2 * px + 2, 1), f'{n[10:30]} {st}', fill=(255, 255, 255))
    im2.save('docs/sabah/hale-durum-onizleme.png')
    print(sel)
