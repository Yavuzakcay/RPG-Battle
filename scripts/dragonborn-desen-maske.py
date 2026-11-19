"""Dragonborn pul deseni için uygulama maskesi (yalnız önizleme; public/'e yazmaz).
Kaynak: oyunun Dragonborn pul bölgesi maskesi public/characters/maske/<jeton>.png (scripts/soy-maske-dragonborn.ts: baş, kuyruk, eller, çıplak uzuv).
Ek ayıklama: boynuz (sarımsı b* > BOYNUZ_B ya da gri: kroma < BOYNUZ_C ve L* < BOYNUZ_L; ten lavanta-beyaz a* > 0, b* < 0), koyu kontur (L* < KONTUR_L), sonra 3×3 erozyon (1 px içeri) KIRINTI pikselden küçük bileşenlerin atılması, ilk maskede olup DELIK pikselden küçük iç deliklerin (parlama) doldurulması.
Güvenilmeyen jetonlar docs/sabah/dragonborn-desen/guvenilmeyen.json (elle inceleme + otomatik ölçüt)."""
import json, os, sys, glob
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAR = os.path.join(ROOT, 'public/characters')
OUT = os.path.join(ROOT, 'docs/sabah/dragonborn-desen')
BOYNUZ_B, BOYNUZ_C, BOYNUZ_L, KONTUR_L, KIRINTI, DELIK = 0.0, 4.5, 88.0, 40.0, 12, 14

def lab(rgb):
    c = rgb / 255.0; c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

def erode(m):
    p = np.pad(m, 1, constant_values=False); o = m.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            o &= p[1 + dy:1 + dy + m.shape[0], 1 + dx:1 + dx + m.shape[1]]
    return o

def drop_small(m, n):
    """8-bağlı bileşenlerden n pikselden küçükleri at (kıyafet içi kırıntı)."""
    H, W = m.shape; seen = np.zeros_like(m); out = m.copy(); dropped = 0
    for y0, x0 in zip(*np.nonzero(m)):
        if seen[y0, x0]: continue
        st = [(y0, x0)]; seen[y0, x0] = True; px = []
        while st:
            y, x = st.pop(); px.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not seen[yy, xx]:
                        seen[yy, xx] = True; st.append((yy, xx))
        if len(px) < n:
            dropped += len(px)
            for y, x in px: out[y, x] = False
    return out, dropped

def tokens():
    return sorted(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(CHAR, 'dragonborn-*.webp')) if '-erkek-' in f or '-kadin-' in f)

def mask_of(name):
    """(rgba, uygulama maskesi, bilgi) — maske yoksa None."""
    rgba = np.array(Image.open(os.path.join(CHAR, name + '.webp')).convert('RGBA'))
    mf = os.path.join(CHAR, 'maske', name + '.png')
    if not os.path.exists(mf):
        return rgba, None, {'neden': 'maske yok'}
    m0 = (np.array(Image.open(mf).convert('L')) > 127) & (rgba[..., 3] >= 128)
    L = lab(rgba[..., :3].astype(float))
    skin = np.median(L[m0 & (L[..., 2] < 2)], 0) if (m0 & (L[..., 2] < 2)).sum() > 30 else np.median(L[m0], 0)
    C = np.hypot(L[..., 1], L[..., 2])
    horn = m0 & ((L[..., 2] > BOYNUZ_B) | ((C < BOYNUZ_C) & (L[..., 0] < BOYNUZ_L)))   # sarımsı (b* > 0) ya da gri boynuz; ten lavanta (a* > 0, b* < 0)
    dark = m0 & (L[..., 0] < KONTUR_L)
    m1 = m0 & ~horn & ~dark
    m2 = erode(m1)
    m2, kirinti = drop_small(m2, KIRINTI)
    hole, _ = drop_small(~m2, DELIK)          # maskenin içindeki küçük delikler (parlama) = ten
    m2 = m2 | (~hole & (rgba[..., 3] >= 128) & m0)
    info = {'m0': int(m0.sum()), 'boynuzAyiklanan': int(horn.sum()), 'kontur': int(dark.sum()), 'kirinti': kirinti, 'son': int(m2.sum()),
            'tenLab': [round(float(v), 1) for v in skin]}
    return rgba, m2, info

if __name__ == '__main__':
    # inceleme sayfaları: maske macenta bindirme
    names = tokens(); S = 128; per = 12
    os.makedirs(os.path.join(OUT, 'inceleme'), exist_ok=True)
    rep = {}
    for p in range(0, len(names), 72):
        chunk = names[p:p + 72]; rows = (len(chunk) + per - 1) // per
        sheet = Image.new('RGB', (per * S, rows * (S + 12)), (40, 44, 52))
        from PIL import ImageDraw
        d = ImageDraw.Draw(sheet)
        for i, n in enumerate(chunk):
            rgba, m, info = mask_of(n); rep[n] = info
            bg = np.zeros((256, 256, 3)) + [60, 60, 70]; al = rgba[..., 3:4] / 255.0
            im = rgba[..., :3] * al + bg * (1 - al)
            if m is not None:
                im[m] = im[m] * 0.4 + np.array([255, 0, 255]) * 0.6
            t = Image.fromarray(im.astype(np.uint8)).resize((S, S), Image.NEAREST)
            x, y = (i % per) * S, (i // per) * (S + 12)
            sheet.paste(t, (x, y)); d.text((x + 2, y + S), f'{p + i}:{n[11:]}', fill=(220, 220, 220))
        sheet.quantize(256, dither=Image.Dither.NONE).save(os.path.join(OUT, 'inceleme', f'maske-{p // 72 + 1}.png'), optimize=True)
    json.dump(rep, open(os.path.join(OUT, 'inceleme', 'maske-olcum.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(names))
