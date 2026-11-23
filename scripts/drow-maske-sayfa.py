"""DROW-MASKE-TOPLU: önce/sonra kanıt sayfaları (yalnız okur; jeton/maske/veri değişmez).

Girdi `gorsel-dokum/drow-maske-toplu/{once,sonra}/<jeton>-{jeton,rozet}.png` (`npx vite-node scripts/drow-maske-cizim.ts`: oyunun kendi
çizimiyle Dark Elf savaş jetonu ve 84 px rozet). Çıktı `gorsel-dokum/drow-maske-toplu/<grup>-<n>.png` (git dışı): satır başına jeton adı,
önce/sonra savaş jetonu, önce/sonra rozet (boyalı, kırpmalı, ×2), kullanılan maske (kırmızı örtü). Sayfa başına en çok 12 jeton.

Çalıştırma: python scripts/drow-maske-sayfa.py <grup> jeton1,jeton2,...
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'gorsel-dokum/drow-maske-toplu')
CHAR = os.path.join(ROOT, 'public/characters')
BG = (96, 104, 96, 255)
J, RZ, LAB, PAD = 192, 164, 220, 8
# Rozet hücresi 164 px, 84 px rozet 40 px içeride: çevresiyle kırpılıp büyütülür (oyunda boyalı, kırpmalı çizim).
ROZ_KIRP = (26, 26, 138, 138)


def on_bg(path, size, crop=None):
    if not os.path.exists(path):
        im = Image.new('RGBA', (size, size), (60, 20, 20, 255))
        ImageDraw.Draw(im).text((8, 8), 'yok', fill=(255, 200, 200))
        return im.convert('RGB')
    im = Image.open(path).convert('RGBA')
    im = Image.alpha_composite(Image.new('RGBA', im.size, BG), im)
    if crop: im = im.crop(crop)
    return im.resize((size, size), Image.NEAREST).convert('RGB')


def mask_tile(name, size):
    """Oyunun kullandığı maske (elle maske önce, yoksa otomatik) jeton üstünde kırmızı örtü; maske yoksa 'maske yok'."""
    rgba = np.array(Image.open(os.path.join(CHAR, f'{name}.webp')).convert('RGBA'))
    a = np.array(Image.alpha_composite(Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), BG), Image.fromarray(rgba)))
    src = next((p for p in (f'{CHAR}/maske-el/{name}.png', f'{CHAR}/maske/{name}.png') if os.path.exists(p)), None)
    label = 'maske yok'
    if src:
        m = np.array(Image.open(src).convert('L')) > 0
        a[m, 0] = (a[m, 0] * 0.3 + 255 * 0.7).astype(np.uint8); a[m, 1] = (a[m, 1] * 0.3).astype(np.uint8); a[m, 2] = (a[m, 2] * 0.3).astype(np.uint8)
        label = f'{"elle" if "maske-el" in src else "otomatik"} {int(m.sum())} px'
    return Image.fromarray(a).resize((size, size), Image.NEAREST).convert('RGB'), label


def page(group, names, n):
    cols = [('once jeton', J), ('sonra jeton', J), ('once rozet', RZ), ('sonra rozet', RZ), ('maske', J)]
    W = LAB + sum(w + PAD for _, w in cols)
    H = 26 + len(names) * (J + PAD)
    out = Image.new('RGB', (W, H), (28, 28, 32))
    d = ImageDraw.Draw(out)
    x = LAB
    for t, w in cols:
        d.text((x + 4, 6), t, fill=(240, 220, 120)); x += w + PAD
    for i, name in enumerate(names):
        y = 26 + i * (J + PAD)
        d.text((6, y + 8), name, fill=(230, 230, 230))
        mt, ml = mask_tile(name, J)
        d.text((6, y + 26), ml, fill=(170, 200, 170))
        tiles = [on_bg(f'{OUT}/once/{name}-jeton.png', J), on_bg(f'{OUT}/sonra/{name}-jeton.png', J),
                 on_bg(f'{OUT}/once/{name}-rozet.png', RZ, ROZ_KIRP), on_bg(f'{OUT}/sonra/{name}-rozet.png', RZ, ROZ_KIRP), mt]
        x = LAB
        for (t, w), im in zip(cols, tiles):
            out.paste(im, (x, y + (J - w) // 2)); x += w + PAD
    path = os.path.join(OUT, f'{group}-{n}.png')
    out.save(path, optimize=True)
    return path


def main():
    group, names = sys.argv[1], [x for x in sys.argv[2].split(',') if x]
    for k in range(0, len(names), 12):
        print(page(group, names[k:k + 12], k // 12 + 1))


if __name__ == '__main__':
    main()
