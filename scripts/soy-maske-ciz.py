"""GORSEL-DUZELTME: elle ten maskesi çizimi (jeton başına tanım `data/soy-maske-ciz.json`).

Yapay zekâ ham maskesinin (docs/soy-maske-yz.md) yerine geçen, tekrarlanabilir elle çizim: her jeton için bölgeler (kutu ya da
çokgen, 256 px jeton uzayı) içinde renk kuralı (Lab: L, kroma C, ton h aralıkları) ten adayı seçer; `ekle` / `haric` kutu ya da
çokgenleri elle düzeltmedir. `bos: true`: jetonda çıplak ten yok (zırh, gölge, hayalet): bilerek boş maske.

Çıktı:
- assets/soy-maske-ham/<jeton>.png (siyah-beyaz). Sonra `npm run soy-maske-ice -- <jeton>` (temizlik + doğrulama →
  assets/soy-maske-el/) ve `npm run soy-maske -- --el` (gri ağırlık kopyası public/characters/maske-el/, data/soy-maske-rapor.json).
  Dragonborn maskesi yapılmaz (kullanıcı kararı; maskesiz jetonlar yedek filtreyle, `tint.ts`).
- Kontrol görseli docs/sabah/maske-kontrol/<jeton>.png: jeton · maske · jeton üstünde kırmızı örtü · yalnız maskelenen pikseller (4×).

Çalıştırma: python scripts/soy-maske-ciz.py [jeton ...]
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CHAR = os.path.join(ROOT, 'public/characters')
HAM = os.path.join(ROOT, 'assets/soy-maske-ham')
KONTROL = os.path.join(ROOT, 'docs/sabah/maske-kontrol')
TANIM = os.path.join(ROOT, 'data/soy-maske-ciz.json')


def lab(rgb):
    """sRGB (0–255) → CIE Lab (D65), numpy."""
    c = rgb / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    x = (c[..., 0] * 0.4124 + c[..., 1] * 0.3576 + c[..., 2] * 0.1805) / 0.95047
    y = c[..., 0] * 0.2126 + c[..., 1] * 0.7152 + c[..., 2] * 0.0722
    z = (c[..., 0] * 0.0193 + c[..., 1] * 0.1192 + c[..., 2] * 0.9505) / 1.08883
    f = lambda t: np.where(t > 216 / 24389, np.cbrt(t), (24389 / 27 * t + 16) / 116)
    fx, fy, fz = f(x), f(y), f(z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], -1)


def shape_mask(spec, W, H):
    """Kutu [x0, y0, x1, y1] (uçlar dahil) ya da çokgen [[x, y], ...] → bool dizisi."""
    img = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(img)
    if 'kutu' in spec:
        x0, y0, x1, y1 = spec['kutu']
        d.rectangle([x0, y0, x1, y1], fill=255)
    else:
        d.polygon([tuple(p) for p in spec['cokgen']], fill=255)
    return np.array(img) > 0


def in_ranges(v, ranges):
    out = np.zeros(v.shape, bool)
    for a, b in ranges:
        out |= (v >= a) & (v <= b) if a <= b else (v >= a) | (v <= b)
    return out


def build(name, t):
    rgba = np.array(Image.open(os.path.join(CHAR, f'{name}.webp')).convert('RGBA'))
    H, W = rgba.shape[:2]
    opaque = rgba[..., 3] >= 128
    m = np.zeros((H, W), bool)
    if not t.get('bos'):
        L = lab(rgba[..., :3].astype(float))
        C = np.hypot(L[..., 1], L[..., 2])
        h = (np.degrees(np.arctan2(L[..., 2], L[..., 1])) + 360) % 360
        for b in t['bolgeler']:
            r = shape_mask(b, W, H) & opaque
            if 'L' in b: r &= (L[..., 0] >= b['L'][0]) & (L[..., 0] <= b['L'][1])
            if 'C' in b: r &= (C >= b['C'][0]) & (C <= b['C'][1])
            if 'h' in b: r &= in_ranges(h, b['h'])
            m |= r
        for e in t.get('ekle', []): m |= shape_mask(e, W, H) & opaque
        for e in t.get('haric', []): m &= ~shape_mask(e, W, H)
    return rgba, m


def kontrol(name, rgba, m, tur):
    H, W = m.shape
    bg = np.zeros((H, W, 4), np.uint8); bg[...] = (58, 63, 74, 255)
    base = Image.alpha_composite(Image.fromarray(bg), Image.fromarray(rgba))
    a = np.array(base)
    ov = a.copy(); ov[m, 0] = (ov[m, 0] * 0.35 + 255 * 0.65).astype(np.uint8); ov[m, 1] = (ov[m, 1] * 0.35).astype(np.uint8); ov[m, 2] = (ov[m, 2] * 0.35).astype(np.uint8)
    only = np.zeros_like(a); only[...] = (20, 20, 24, 255); only[m] = a[m]
    mk = np.zeros_like(a); mk[...] = (0, 0, 0, 255); mk[m] = (255, 255, 255, 255)
    k = 3
    tiles = [Image.fromarray(x).resize((W * k, H * k), Image.NEAREST) for x in (a, mk, ov, only)]
    out = Image.new('RGB', (4 * W * k + 3 * 6, H * k + 22), (30, 30, 34))
    for i, tl in enumerate(tiles): out.paste(tl.convert('RGB'), (i * (W * k + 6), 22))
    ImageDraw.Draw(out).text((6, 5), f'{name} · {tur} · {int(m.sum())} px · jeton | maske | örtü | yalnız maske', fill=(240, 220, 120))
    os.makedirs(KONTROL, exist_ok=True)
    out.save(os.path.join(KONTROL, f'{name}.png'), optimize=True)


def main():
    tanim = json.load(open(TANIM, encoding='utf-8'))['jetonlar']
    only = sys.argv[1:]
    for name, t in tanim.items():
        if only and name not in only: continue
        rgba, m = build(name, t)
        os.makedirs(HAM, exist_ok=True)
        Image.fromarray((m * 255).astype(np.uint8), 'L').save(os.path.join(HAM, f'{name}.png'), optimize=True)
        kontrol(name, rgba, m, 'ten')
        print(f'{name}: {int(m.sum())} px{" (bilerek boş)" if t.get("bos") else ""}')


if __name__ == '__main__':
    main()
