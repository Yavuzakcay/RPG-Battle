#!/usr/bin/env python3
"""KW2 (yalnız görünüm): Dragonborn kanadının iki ek katmanı. Taban görsel (`public/kanat/dragonborn.webp`, tek sağ kanat) aynen kalır; üstüne iki saydam
katman çizilir, her biri kendi palet filtresiyle boyanır:
- `dragonborn-pence.webp`: pençe uçları (büyük kanca: kol düğümünün üstündeki boynuz; küçük pençe: ön kenar kemiğinin üstündeki çıkıntı; kanadın en ucundaki kemik ucu); boynuz beyazı paletiyle.
- `dragonborn-zar.webp`: kanat zarı = kanat − (kol + el bileği düğümü) − (ön kenar şeridi) − pençeler; soy renginin pembeyle karışımı paletiyle (yalnız `zar.etkin` açıkken çizilir).
Katman = taban görselin parlaklığı + alfa × bölge ağırlığı (kenarlar yumuşatılmış, dikiş görünmez). Bölgeler elle (sprite pikseli, 364×279; kılavuz: kontrast gerili görsel
üzerinde ızgara) ve ön kenar için sütun başına üstten BAND px.
`python3 scripts/dragonborn-kanat-katman.py [--onizleme <png>]`  (--onizleme: bölgeleri taban üstünde renkli gösterir; depoya yazılmaz)."""
import argparse, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAYNAK = os.path.join(ROOT, 'public/kanat/dragonborn.webp')
# Pençeler (sprite pikseli): büyük kanca (kol düğümünün üstü) ve ön kenardaki küçük pençe.
PENCE = [
    [(123, 18), (127, 10), (132, 4), (140, 1), (150, 0), (160, 2), (164, 5), (156, 8), (149, 10), (145, 15), (144, 21), (138, 25), (130, 25), (124, 22)],
    [(256, 26), (262, 24), (272, 24), (278, 26), (283, 29), (277, 31), (271, 34), (264, 35), (257, 32)],
    # kanadın en ucundaki kemik ucu: ön kenar kemiğinin parlak düğümü + sivri uç (sağ/aşağı)
    [(326, 62), (334, 62), (340, 66), (346, 71), (353, 76), (359, 81), (363, 86), (364, 93), (358, 92), (352, 89), (346, 88), (340, 86), (334, 80), (328, 72)],
]
# Kol (kalın pullu kemik) ve el bileği düğümü: zar boyası bunlara girmez, soy renginde kalır.
KOL = [(0, 108), (36, 106), (64, 98), (80, 84), (90, 66), (102, 48), (112, 34), (120, 24), (150, 24), (165, 40), (160, 60), (148, 72), (132, 74), (122, 70),
       (114, 80), (104, 96), (96, 112), (88, 128), (78, 137), (60, 143), (30, 143), (0, 143)]
BAND = 16          # ön kenar kemiği: x ≥ BAND_X sütunlarında kanadın üst kenarından aşağı bu kadar piksel
BAND_X = 140
BAND_X_END = 326   # uç kemik çokgeninden önce biter
YUMUSAK = 1.6      # bölge geçişi (Gauss sigma, px)
PENCE_YUMUSAK = 0.7

def poly_mask(shape, pts):
    im = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).polygon(pts, fill=255)
    return np.array(im) > 127

def bolgeler(alfa):
    """Dönen: pençe (bool), çerçeve (kol + ön kenar, bool), zar ağırlığı (0–1)."""
    h, w = alfa.shape
    pence = np.zeros((h, w), bool)
    for p in PENCE: pence |= poly_mask(alfa.shape, p)
    pence &= alfa
    kol = poly_mask(alfa.shape, KOL) & alfa
    band = np.zeros((h, w), bool)
    govde = alfa & ~ndi.binary_dilation(pence, iterations=2)   # üst kenar pençeleri atlayarak ölçülür (pençe sütunlarında kemik, pençenin altında)
    govde[:22, :] = False                                      # büyük kancanın artık pikselleri (y < 22) kemik sayılmaz
    for x in range(BAND_X, BAND_X_END):
        ys = np.where(govde[:, x])[0]
        if len(ys): band[ys.min():ys.min() + BAND, x] = True
    cerceve = (kol | band) & ~pence
    zar = alfa & ~ndi.binary_dilation(pence, iterations=1) & ~cerceve   # pençenin 1 px çevresi de zar boyası almaz (pembe saçak olmasın)
    return pence, cerceve, zar

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--onizleme'); a = ap.parse_args()
    img = np.array(Image.open(KAYNAK).convert('RGBA'))
    alfa = img[..., 3] > 10
    pence, cerceve, zar = bolgeler(alfa)
    # yumuşatılmış ağırlıklar: zar ağırlığı çerçeve/pençe sınırında 0'a iner, pençe ağırlığı kendi sınırında
    wz = np.clip(ndi.gaussian_filter(zar.astype(float), YUMUSAK), 0, 1) * alfa
    wp = np.clip(ndi.gaussian_filter(pence.astype(float), PENCE_YUMUSAK) * 1.6, 0, 1) * alfa
    wz = np.where(wp > 0.35, 0, wz * (1 - wp))      # pençenin üstünde (ve kenar yumuşatmasında) zar boyası yok
    if a.onizleme:
        l = img[..., 0] / 255.0
        v = np.clip((l - 0.74) / 0.26, 0, 1)
        g = (v * 255).astype(np.uint8)
        out = np.zeros(img.shape[:2] + (3,), np.uint8); out[...] = (36, 40, 48)
        base = np.stack([g, g, g], -1).astype(float)
        col = np.zeros_like(base); col[cerceve] = (70, 110, 220); col[zar] = (240, 120, 170); col[pence] = (255, 255, 255)
        mix = np.where(alfa[..., None], base * 0.55 + col * 0.45, out)
        Image.fromarray(mix.astype(np.uint8)).resize((img.shape[1] * 3, img.shape[0] * 3), Image.NEAREST).save(a.onizleme)
        print('önizleme:', a.onizleme, '| piksel pençe/çerçeve/zar:', int(pence.sum()), int(cerceve.sum()), int(zar.sum()))
        return
    for ad, wgt in (('zar', wz), ('pence', wp)):
        o = img.copy(); o[..., 3] = np.rint(img[..., 3] * wgt).astype(np.uint8)
        yol = os.path.join(ROOT, f'public/kanat/dragonborn-{ad}.webp')
        Image.fromarray(o, 'RGBA').save(yol, 'WEBP', lossless=True, quality=100, method=6)
        print(f'{ad}: {os.path.getsize(yol) // 1024} KB, alfa > 0 piksel {int((o[..., 3] > 0).sum())}')

if __name__ == '__main__': main()
