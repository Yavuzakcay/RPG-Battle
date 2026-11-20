#!/usr/bin/env python3
"""KQ6-17: hale alternatif tasarımları (yalnız önizleme; oyuna bağlanmaz). Aynı 6 jetonda 4 tasarım yan yana: docs/sabah/hale-alternatif.png.
Taban: halesiz varyant (yoksa hale-v2 silmesi, kalıntı sınırı gevşek, yalnız görüntü için). Tasarımlar yalnız alfa=0 piksellere çizilir (jetonun hiçbir pikseli değişmez).
A) ince altın elips halka + hafif parıltı  B) çift ince halka (iç parlak, dış soluk)  C) alından yükselen küçük ışık/yıldız taçı (halka yok)  D) kafanın arkasında yarım güneş ışığı (nimbus).
Renk #F5D76E tonu."""
import importlib.util, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi
spec = importlib.util.spec_from_file_location('hv', 'scripts/hale-v2.py'); hv = importlib.util.module_from_spec(spec); spec.loader.exec_module(hv)
hv.OPAQUE_R = 2; hv.KALAN_MAX = 9999
D = 'public/characters'; N = 256
GOLD = (245, 215, 110); LIGHT = (255, 240, 170); DEEP = (214, 176, 70)
TOKENS = [('celestial-erkek-fighter-ID1', 'erkek Fighter ID1'), ('celestial-kadin-cleric-ID1', 'kadin Cleric ID1'), ('celestial-erkek-wizard-WZ-A1', 'erkek Wizard WZ-A1'),
          ('celestial-kadin-rogue-ID7', 'kadin Rogue ID7'), ('celestial-erkek-warlock-WL-7', 'erkek Warlock WL-7'), ('celestial-erkek-monk-GR', 'Gariban erkek Monk')]

# Yalnız görüntü: halesiz varyantında kalan hale kalıntısı otomatik silinemeyen jetonda, baş kontur satırının üstü elle temizlenir (üretim dosyası DEĞİŞMEZ).
MANUAL_CLEAR = {'celestial-erkek-warlock-WL-7': 20}

def base_of(n):
    p = f'{D}/halesiz/{n}.webp'
    if os.path.exists(p):
        a = np.array(Image.open(p).convert('RGBA')); b, info, d = hv.erase(a)       # halesizde kalan hale kalıntısı varsa (örn. Warlock WL-7) görüntü için bir kez daha silinir
        r = (b, 'halesiz varyant + ek silme') if info['durum'] in ('tam', 'kesik') and not info['iptal'] else (a, 'halesiz varyant')
        if n in MANUAL_CLEAR: r[0][:MANUAL_CLEAR[n]] = 0; r = (r[0], r[1] + ' + elle temizlik (yalnız önizleme)')
        return r
    a = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA')); b, info, d = hv.erase(a)
    return (a, 'silme güvenli değil: hale görünür') if info['iptal'] and 'başı' in str(info['iptal']) else (b, 'hale-v2 silmesi (gevşek kalıntı)')

def head_geom(a):
    """Halesiz tabanda baş/şapka üstü: açılmış opak kütlenin ilk satırı, başa ortalı yatay merkez ve üst genişlik."""
    solid = ndi.binary_opening(a[..., 3] > 100, structure=hv.disk(2))
    lab, k = ndi.label(solid, structure=np.ones((3, 3)))
    big = lab == (1 + int(np.argmax(ndi.sum(solid, lab, range(1, k + 1)))))
    top = int(np.where(big.any(axis=1))[0][0])
    xs = np.where(big[top:top + 10].any(axis=0))[0]; cx = int(round(xs.mean()))
    row = np.where(big[min(255, top + 16)])[0]; hw = int((row.max() - row.min()) / 2) if len(row) else 22
    return top, cx, max(14, min(hw, 34))

def layer():
    return Image.new('RGBA', (N, N), (0, 0, 0, 0))

def glow(L, blur, gain):
    g = L.filter(ImageFilter.GaussianBlur(blur)); arr = np.array(g); arr[..., 3] = (arr[..., 3] * gain).astype(np.uint8)
    return Image.fromarray(arr)

def comp(*layers):
    out = layer()
    for l in layers: out = Image.alpha_composite(out, l)
    return out

def design(kind, top, cx, hw):
    rx = int(np.clip(hw * 0.95, 18, 28)); y = max(9, top - 5)
    L = layer(); d = ImageDraw.Draw(L)
    if kind == 'A':
        ry = 6; cy = max(ry + 2, top - 6)
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=GOLD + (255,), width=2)
        d.arc((cx - rx, cy - ry, cx + rx, cy + ry), 195, 345, fill=LIGHT + (255,), width=1)
        return comp(glow(L, 2.2, 0.55), L)
    if kind == 'B':
        cy = max(10, top - 7)
        d.ellipse((cx - rx - 3, cy - 8, cx + rx + 3, cy + 8), outline=GOLD + (110,), width=1)         # dış soluk
        d.ellipse((cx - rx + 3, cy - 5, cx + rx - 3, cy + 5), outline=LIGHT + (255,), width=1)       # iç parlak
        d.ellipse((cx - rx + 2, cy - 6, cx + rx - 2, cy + 6), outline=GOLD + (255,), width=1)
        return comp(glow(L, 1.8, 0.45), L)
    if kind == 'C':
        # alından yükselen ışık: başın üstünde küçük dört uçlu yıldızlar ve ince ışık çizgileri (halka yok)
        def star(x, y, r, col):
            d.line((x - r, y, x + r, y), fill=col + (255,), width=1); d.line((x, y - r, x, y + r), fill=col + (255,), width=1)
            d.line((x - r // 2, y - r // 2, x + r // 2, y + r // 2), fill=col + (170,), width=1); d.line((x - r // 2, y + r // 2, x + r // 2, y - r // 2), fill=col + (170,), width=1)
        base = max(14, top - 4)
        for k, (dx, dy, r) in enumerate([(0, 0, 6), (-10, 3, 3), (10, 3, 3), (-19, 7, 2), (19, 7, 2)]):
            star(cx + dx, base - 8 + dy, r, LIGHT if k == 0 else GOLD)
        for dx in (-5, 0, 5): d.line((cx + dx, base + 1, cx + dx, base - 6 - (4 if dx == 0 else 0)), fill=GOLD + (120,), width=1)
        return comp(glow(L, 2.0, 0.6), L)
    if kind == 'D':
        # kafanın arkasında yarım güneş ışığı (üst yarı): hafif radyal parıltı + kısa ışınlar
        cy = top + 20; R = int(hw * 1.5) + 14
        yy, xx = np.mgrid[0:N, 0:N]; dist = np.hypot(xx - cx, (yy - cy) * 1.05)
        a = np.clip(1 - dist / R, 0, 1) ** 1.6 * 150; a[yy > cy + 6] = 0
        arr = np.zeros((N, N, 4), np.uint8); arr[..., 0], arr[..., 1], arr[..., 2] = GOLD; arr[..., 3] = a.astype(np.uint8)
        L = Image.fromarray(arr); d = ImageDraw.Draw(L)
        for ang in range(200, 341, 20):
            r0, r1 = R * 0.7, R * 1.0
            d.line((cx + r0 * np.cos(np.radians(ang)), cy + r0 * np.sin(np.radians(ang)), cx + r1 * np.cos(np.radians(ang)), cy + r1 * np.sin(np.radians(ang))), fill=GOLD + (150,), width=1)
        return L
    raise ValueError(kind)

def apply(a, layer_img):
    h = np.array(layer_img); o = a.copy(); free = a[..., 3] == 0; o[free] = h[free]
    return o

def main():
    kinds = [('A', 'A: ince altin halka'), ('B', 'B: cift ince halka'), ('C', 'C: alindan isik / yildiz taci'), ('D', 'D: arkada yarim gunes (nimbus)')]
    cell_w, big, small, lab = 256, 256, 96, 22
    W = 150 + len(TOKENS) * cell_w; H = 24 + len(kinds) * (big + small + lab + 8)
    sheet = Image.new('RGB', (W, H), (30, 32, 40)); dr = ImageDraw.Draw(sheet)
    info = []
    for ci, (n, label) in enumerate(TOKENS):
        a, how = base_of(n); top, cx, hw = head_geom(a); info.append((n, how, top, cx, hw))
        dr.text((150 + ci * cell_w + 4, 6), f'{label}', fill=(255, 255, 255))
        for ri, (k, kl) in enumerate(kinds):
            o = apply(a, design(k, top, cx, hw)); im = Image.fromarray(o)
            oy = 24 + ri * (big + small + lab + 8)
            sheet.paste(im, (150 + ci * cell_w, oy), im)
            sm = im.resize((small, small), Image.LANCZOS); sheet.paste(sm, (150 + ci * cell_w + 8, oy + big), sm)
            dr.text((150 + ci * cell_w + 8 + small + 8, oy + big + 4), f'{small} px', fill=(160, 165, 175))
    for ri, (k, kl) in enumerate(kinds): dr.text((6, 24 + ri * (big + small + lab + 8) + 100), kl, fill=(245, 215, 110))
    sheet.save('docs/sabah/hale-alternatif.png'); print(sheet.size)
    for r in info: print(r)

if __name__ == '__main__': main()
