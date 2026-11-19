#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TB1: soylu ırk jetonlarında "beyaz benek" teşhisi. YALNIZ OKUR: jeton, maske ve veri dosyalarına yazmaz; çıktı klasörüne yazar.

Kullanım (PowerShell/bash; numpy, scipy, Pillow gerekir):
  python scripts/soy-benek-teshis.py                       # Tiefling: rapor.csv, el-duzeltme-listesi.csv, en-kotu-*.png, ozet.json
  python scripts/soy-benek-teshis.py --irk hepsi           # + Dragonborn, Goliath, Elf (Dark Elf), Orc: diger-irklar-<ırk>.csv (yalnız rapor)
  python scripts/soy-benek-teshis.py --irk goliath --cikti /tmp/x
  python scripts/soy-benek-teshis.py --gorsel 0            # görselsiz (hızlı)

Tanım (kullanıcı): "neredeyse beyaz" piksel = R, G, B > 225 ve doygunluk < 0.12; gövde içi = şeffaf kenara >= 2 px içeride.
Her yakın-beyaz bileşen (8-bağlantılı) şöyle sınıflanır (piksel sayılır):
  a  maske deliği      : maskenin DIŞINDA ama maskenin çevrelediği boşlukta / 1 px kapama aralığında, ten bağlamında
  b  maskede boyanmamış: maskenin İÇİNDE ve soy boyaması sonrası hâlâ yakın-beyaz (boyama eşiği / ağırlık sorunu; en kötü soy)
  c  kaynakta beyaz    : <= 12 px, ten bağlamında (halkanın >= %50'si ten), koyu komşusu yok: Gemini sayfasında zaten beyaz benek
  d  meşru beyaz       : kalanı (göz akı, diş, kıyafet, saç, kanat, zırh): dokunulmaz
Genişletilmiş sayım (asıl görünür kusur): delik_px = maske boşluğundaki ten renkli (koyu/orta) pikseller; vurgu_px = maske eşiğinin
(L <= 85) üstünde kalan uç/kenar parlamaları. İkisi de `src/ui/maskClose.ts` `fixSkinMask`ın boyadığı pikseller; bu betikteki
`fix_mask` onun numpy portudur (285 + 285 Tiefling jetonunda TypeScript ile piksel piksel aynı; testi yok, DECISIONS.md TB1).
"""
import argparse
import csv
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
CHAR = ROOT / 'public' / 'characters'
SOY = json.loads((ROOT / 'data' / 'soy-renkleri.json').read_text(encoding='utf-8'))['races']
HAND = json.loads((ROOT / 'data' / 'soy-maske-rapor.json').read_text(encoding='utf-8'))['sprites']

WHITE_MIN, SAT_MAX, EDGE_PX = 225, 0.12, 2   # kullanıcı tanımı
S8 = np.ones((3, 3), bool)
SINIFLAR = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']


# ───────── renk (src/ui/color.ts birebir) ─────────
WX, WZ = 0.95047, 1.08883
def _lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def _gam(c): return np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.maximum(c, 0) ** (1 / 2.4) - 0.055)
def _f(t): return np.where(t > 216 / 24389, np.cbrt(t), (24389 / 27 * t + 16) / 116)
def _fi(t): return np.where(t ** 3 > 216 / 24389, t ** 3, (116 * t - 16) / (24389 / 27))


def rgb_to_lab(rgb):
    c = _lin(np.asarray(rgb, float) / 255)
    R, G, B = c[..., 0], c[..., 1], c[..., 2]
    x = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / WX
    y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B
    z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / WZ
    fx, fy, fz = _f(x), _f(y), _f(z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], axis=-1)


def lab_to_rgb(lab):
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    fy = (L + 16) / 116; fx = fy + a / 500; fz = fy - b / 200
    x, y, z = _fi(fx) * WX, _fi(fy), _fi(fz) * WZ
    R = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z
    G = -0.969266 * x + 1.8760108 * y + 0.041556 * z
    B = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z
    out = np.clip(_gam(np.maximum(np.stack([R, G, B], axis=-1), 0)), 0, 1) * 255
    return np.round(out).astype(np.uint8)


def paint(rgba, mask, spec):
    """src/ui/tint.ts maskedPixels (ikili maske yolu): spec = ('lch', {...}) ya da ('gradient', {...}). Yeni dizi döner."""
    kind, to = spec
    out = rgba.copy()
    sel = mask & (rgba[..., 3] >= 10)
    if not sel.any():
        return out
    lab = rgb_to_lab(rgba[..., :3][sel])
    L, a, b = lab[:, 0], lab[:, 1], lab[:, 2]
    if kind == 'gradient':
        Ls = np.sort(L)
        lo, hi = Ls[int(len(Ls) * 0.05)], Ls[min(len(Ls) - 1, int(len(Ls) * 0.95))]
        stops = np.array(to['gradient'], float)
        k, keep = to.get('contrast', 0), to.get('chromaKeep', 0)
        ma, mb = (a.mean(), b.mean()) if keep else (0, 0)
        t0 = np.clip((L - lo) / max(1, hi - lo), 0, 1)
        t = (t0 - k * np.sin(2 * np.pi * t0) / (2 * np.pi) if k else t0) * (len(stops) - 1)
        j = np.minimum(len(stops) - 2, np.floor(t)).astype(int); u = t - j
        A, B = stops[j], stops[j + 1]
        new = lab_to_rgb(np.stack([A[:, 0] + (B[:, 0] - A[:, 0]) * u, A[:, 1] + (B[:, 1] - A[:, 1]) * u + keep * (a - ma),
                                   A[:, 2] + (B[:, 2] - A[:, 2]) * u + keep * (b - mb)], axis=-1))
    else:
        lch = to['lch']
        hue_keep, chroma_keep = lch.get('hueKeep', 0.3), lch.get('chromaKeep', 0.5)
        gain, dL, contrast, target = lch.get('gain', 1), lch.get('dL', 0), lch.get('contrast', 1), lch.get('L')
        mh = np.degrees(np.arctan2(b.sum(), a.sum()))
        C = np.hypot(a, b); mc, ml = C.mean(), L.mean()
        dh = ((np.degrees(np.arctan2(b, a)) - mh + 540) % 360) - 180
        nh = np.radians(lch['h'] + dh * hue_keep)
        nc = np.maximum(0, lch['c'] + (C - mc) * chroma_keep)
        nl = np.clip(target + (L - ml) * contrast, 0, 100) if target is not None else np.clip((ml + (L - ml) * contrast) * gain + dL, 0, 100)
        new = lab_to_rgb(np.stack([nl, nc * np.cos(nh), nc * np.sin(nh)], axis=-1))
    out[..., :3][sel] = new
    return out


# Hedef rengi zaten beyaza yakın soylar: boyama sonrası beyaz kalması kusur değil, (b) ölçümüne girmez.
KASITLI_BEYAZ = {'dragonborn': {'white', 'silver'}}


def tints_of(irk):
    """Irkın maskeli boyama tanımları (soy → spec); maskesiz ırk (Orc) için boş."""
    r = SOY.get(irk)
    if not r:
        return {}
    out = {}
    for k, v in r['lineages'].items():
        if k in KASITLI_BEYAZ.get(irk, ()):
            continue
        if isinstance(v, dict) and 'lch' in v:
            out[k] = ('lch', v)
        elif isinstance(v, dict) and 'palet' in v:
            pal = r['paletler'][k]
            out[f'{k}-{r[v["palet"]]}'] = ('gradient', pal['secenekler'][r[v['palet']]])
    return out


# ───────── jeton / maske ─────────
def tokens_of(irk):
    return sorted(p.stem for p in CHAR.glob(f'{irk}-*.webp'))


def load_token(name):
    return np.array(Image.open(CHAR / f'{name}.webp').convert('RGBA'))


def load_mask(name):
    """Çalışma anı gibi: elle maske (maske-el, ağırlık > 0) ya da otomatik (maske, R > 127). Yoksa None."""
    el = HAND.get(name) == 'el'
    p = CHAR / ('maske-el' if el else 'maske') / f'{name}.png'
    if not p.exists():
        return None
    m = np.array(Image.open(p).convert('RGBA'))
    return (m[..., 0].astype(int) * m[..., 3] // 255 > 0) if el else (m[..., 0] > 127)


def dilate(a, n=1):
    for _ in range(n):
        a = ndi.binary_dilation(a, structure=S8)
    return a


def erode(a, n=1):
    for _ in range(n):
        a = ndi.binary_erosion(a, structure=S8, border_value=0)
    return a


def near_white(rgb):
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0.0)
    return (r > WHITE_MIN) & (g > WHITE_MIN) & (b > WHITE_MIN) & (sat < SAT_MAX)


def skin_box(rgba, mcfg):
    """Irkın otomatik maske ten renk kutusu (açıklık, kroma, ton) ve açıklık dizisi."""
    lab = rgb_to_lab(rgba[..., :3].astype(float))
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(a, b)
    h = (np.degrees(np.arctan2(b, a)) + 360) % 360
    hin = np.zeros(h.shape, bool)
    for lo, hi in mcfg['h']:
        hin |= ((h >= lo) & (h <= hi)) if lo <= hi else ((h >= lo) | (h <= hi))
    ok = (L >= mcfg['L'][0]) & (L <= mcfg['L'][1]) & (C >= mcfg['C'][0]) & (C <= mcfg['C'][1]) & hin & (rgba[..., 3] >= 10)
    return ok, L, C


# ───────── TB1 onarımı (src/ui/maskClose.ts fixSkinMask'ın numpy portu) ─────────
def scaled(T, W):
    s = W / T['referans']
    d, v = T['delik'], T['vurgu']
    rnd = lambda x: int(np.floor(x + 0.5))   # JS Math.round
    one = lambda x: max(1, x)
    return dict(kapama=one(rnd(d['kapama'] * s)), enCok=one(rnd(d['enCok'] * s * s)), ekleOrani=d['ekleOrani'],
                L=v['L'], boyut=one(rnd(v['boyut'] * s * s)), cevre=v['cevre'])


def hole_zone(M0, P):
    """Maske boşlukları (renkten bağımsız; fix_mask ile aynı sıra): 1 px kapama aralığı (gap) ve kapanmış maskenin çevrelediği
    küçük delikler (enc)."""
    gap = erode(dilate(M0, P['kapama']), P['kapama']) & ~M0
    Ma = M0 | gap
    lab_e, ne = ndi.label(ndi.binary_fill_holes(Ma) & ~Ma, structure=S8)
    enc = np.zeros_like(M0)
    if ne:
        for i, s in enumerate(ndi.sum(np.ones_like(lab_e), lab_e, index=range(1, ne + 1)), 1):
            if s <= P['enCok']:
                enc |= lab_e == i
    return enc, gap


def fix_mask(rgba, M0, mcfg, T):
    """Döner: (yeni maske, eklenen delik H, eklenen çevrelenmiş açık benek K)."""
    P = scaled(T, rgba.shape[1])
    ok, L, _ = skin_box(rgba, mcfg)
    body = rgba[..., 3] >= 128
    # 1) delik: önce 1 px kapama boşluğu (yalnız ten kutusu; ince yapı sınırı), sonra kapanmış maskenin çevrelediği küçük delikler
    gap = erode(dilate(M0, P['kapama']), P['kapama']) & ~M0 & ok
    Ma = M0 | gap if gap.sum() <= P['ekleOrani'] * max(1, M0.sum()) else M0
    lab_e, ne = ndi.label(ndi.binary_fill_holes(Ma) & ~Ma, structure=S8)
    enc = np.zeros_like(M0)
    if ne:
        for i, s in enumerate(ndi.sum(np.ones_like(lab_e), lab_e, index=range(1, ne + 1)), 1):
            if s <= P['enCok']:
                enc |= lab_e == i
    M1 = Ma | (enc & ok)
    H = M1 & ~M0
    # 2) vurgu: maskenin tamamen çevrelediği 1–3 px açık benek (komşu gövde piksellerinin >= cevre payı maskede)
    lab_b, nb = ndi.label((L >= P['L']) & body & ~M1, structure=S8)
    K = np.zeros_like(M0)
    Hh, Ww = M0.shape
    for i, sl in enumerate(ndi.find_objects(lab_b), 1):
        y0, y1, x0, x1 = max(0, sl[0].start - 2), min(Hh, sl[0].stop + 2), max(0, sl[1].start - 2), min(Ww, sl[1].stop + 2)
        comp = lab_b[y0:y1, x0:x1] == i
        if comp.sum() > P['boyut']:
            continue
        r1 = dilate(comp, 1) & ~comp & body[y0:y1, x0:x1]
        if r1.sum() > 0 and float((r1 & M1[y0:y1, x0:x1]).sum()) / r1.sum() >= P['cevre']:
            K[y0:y1, x0:x1] |= comp
    return M1 | K, H, K


def close_skin_holes(rgba, M):
    """src/ui/maskClose.ts closeSkinHoles (SD5/SD6: Human, Dark Elf çalışma anı temizliği) numpy portu."""
    lab = rgb_to_lab(rgba[..., :3].astype(float))
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    C, al = np.hypot(a, b), rgba[..., 3]
    keep = (al >= 10) & (L >= 30) & ~((L > 80) & (C < 6))
    closed = M | (erode(dilate(M, 2), 2) & ~M & keep)
    sel = closed & (al >= 10)
    out = closed.copy()
    if sel.any():
        mh, mc = np.degrees(np.arctan2(b[sel].sum(), a[sel].sum())), C[sel].sum() / sel.sum()
        nb = ndi.convolve(closed.astype(int), np.ones((3, 3), int), mode='constant') - closed
        dh = np.abs(((np.degrees(np.arctan2(b, a)) - mh + 540) % 360) - 180)
        out |= ~closed & (al >= 10) & (nb >= 2) & ~((L < 45) | (L > 94) | (C < mc * 0.5) | (dh > 28) | ((L > 80) & (C < 10)))
    return out


# ───────── sınıflama ─────────
def classify(rgba, M, mcfg, P, tints, inside=None):
    """Yakın-beyaz pikselleri a/b/c/d olarak sınıfla. Döner: (sayılar, c bileşenleri
    [(boyut, x, y, x0, y0, x1, y1, halka_maske_payi, maskeye_uzak_px)]). M None: maskesiz ırk (Orc), a ve b yok."""
    body = rgba[..., 3] >= 128
    if inside is None:
        inside = body & (ndi.distance_transform_edt(body) >= EDGE_PX)
    Wn = near_white(rgba[..., :3]) & inside
    has = M is not None
    # Ten bağlamı: maske üyeliği (renk kutusu güvenilmez: Tiefling'de mor/kırmızı zırh ve kıyafet de kutuya girer). Maskesiz ırkta (Orc)
    # renkli ve koyu olmayan pikseller.
    lab = rgb_to_lab(rgba[..., :3].astype(float)); L = lab[..., 0]
    skin = M if has else (np.hypot(lab[..., 1], lab[..., 2]) >= 8) & (L >= 25) & (L <= 90) & (rgba[..., 3] >= 10)
    zone = np.zeros_like(Wn)
    if has:
        enc, gap = hole_zone(M, P)
        zone = enc | gap
    # b: maskede ve boyama sonrası hâlâ yakın-beyaz (en kötü soy)
    b_mask, b_soy = np.zeros_like(Wn), ''
    if has:
        for soy, spec in tints.items():
            still = near_white(paint(rgba, M, spec)[..., :3]) & Wn & M
            if still.sum() > b_mask.sum():
                b_mask, b_soy = still, soy
    lab_w, kw = ndi.label(Wn & ~b_mask, structure=S8)
    n = dict(a=0, b=int(b_mask.sum()), c=0, d=0, b_soy=b_soy, yakin_beyaz=int(Wn.sum()))
    cs, dist_m = [], None
    Hh, Ww = Wn.shape
    for i, sl in enumerate(ndi.find_objects(lab_w), 1):
        y0, y1, x0, x1 = max(0, sl[0].start - 3), min(Hh, sl[0].stop + 3), max(0, sl[1].start - 3), min(Ww, sl[1].stop + 3)
        comp = lab_w[y0:y1, x0:x1] == i
        sz = int(comp.sum())
        ring = dilate(comp, 2) & ~comp & body[y0:y1, x0:x1]
        rn = max(1, int(ring.sum()))
        skf, dark = float((ring & skin[y0:y1, x0:x1]).sum()) / rn, float(((L[y0:y1, x0:x1] < 35) & ring).sum()) / rn
        if has and (comp & zone[y0:y1, x0:x1]).any() and skf >= 0.35 and dark < 0.25:
            n['a'] += sz
        elif sz <= 12 and skf >= 0.5 and dark < 0.25:
            n['c'] += sz
            ys, xs = np.where(comp)
            if has and dist_m is None:
                dist_m = ndi.distance_transform_cdt(~M, metric='chessboard')
            cs.append((sz, int(xs.mean()) + x0, int(ys.mean()) + y0, int(xs.min()) + x0, int(ys.min()) + y0, int(xs.max()) + x0, int(ys.max()) + y0,
                       round(skf, 2), int(dist_m[y0:y1, x0:x1][comp].min()) if has else -1))
        else:
            n['d'] += sz
    return n, cs


# ───────── görsel ─────────
def _font(size):
    for nm in ('DejaVuSans.ttf', 'LiberationSans-Regular.ttf', 'arial.ttf'):
        try:
            return ImageFont.truetype(nm, size), True
        except OSError:
            pass
    return ImageFont.load_default(), False


FONT, FONT_TR = _font(14)
_ASCII = str.maketrans('İıŞşĞğÖöÜüÇç', 'IiSsGgOoUuCc')
def tr(s): return s if FONT_TR else s.translate(_ASCII)


def over(a, bg):
    im = Image.fromarray(a, 'RGBA'); b = Image.new('RGBA', im.size, bg + (255,)); b.alpha_composite(im); return b.convert('RGB')


def windows(H, K, body, win):
    """Gövdenin üst / orta / alt bandında, birbirinden ayrık, değişen piksellerin en yoğun win×win penceresi (K ağırlık 3, H 1)."""
    ys, xs = np.where(body)
    y0, y1 = ys.min(), ys.max()
    wgt = (H.astype(float) + 3 * K.astype(float))
    box = ndi.uniform_filter(wgt, size=win, mode='constant') * win * win
    out = []
    for nm, lo, hi in (('üst (boynuz, baş)', 0, .40), ('orta (gövde)', .40, .75), ('alt (kuyruk, ayak)', .75, 1.01)):
        band = np.zeros_like(wgt, bool)
        band[int(y0 + lo * (y1 - y0 + 1)):int(y0 + hi * (y1 - y0 + 1)), :] = True
        sc = np.where(band, box, -1)
        if sc.max() <= 0:
            continue
        cy, cx = np.unravel_index(np.argmax(sc), sc.shape)
        out.append((nm, int(np.clip(cx - win // 2, 0, wgt.shape[1] - win)), int(np.clip(cy - win // 2, 0, wgt.shape[0] - win)), float(sc.max())))
        box[max(0, cy - win):cy + win, max(0, cx - win):cx + win] = -1   # sonraki bant bu bölgeyi yeniden seçmesin
    return out


def en_kotu_sayfa(path, name, rgba, M0, M1, H, K, spec, soy, win=32, zoom=8):
    """Jeton başına sayfa: üstte tam jeton önce/sonra, altta 8× kırpmalar [önce koyu | sonra koyu | önce açık | sonra açık]."""
    DARK, LIGHT = (24, 24, 32), (236, 236, 240)
    before, after = paint(rgba, M0, spec), paint(rgba, M1, spec)
    wins = windows(H, K, rgba[..., 3] >= 128, win)
    PW = win * zoom
    W = PW * 4 + 5 * 10
    top = 44 + 260
    img = Image.new('RGB', (W, top + len(wins) * (PW + 28) + 10), (250, 250, 250))
    d = ImageDraw.Draw(img)
    d.text((10, 6), tr(f'{name} · soy: {soy} · maske {int(M0.sum())} px · eklenen delik {int(H.sum())} px · eklenen çevrelenmiş açık benek {int(K.sum())} px'), fill=(0, 0, 0), font=FONT)
    for k, (cap, a) in enumerate((('önce (koyu zemin)', over(before, DARK)), ('sonra (koyu zemin)', over(after, DARK)),
                                  ('önce (açık zemin)', over(before, LIGHT)), ('sonra (açık zemin)', over(after, LIGHT)))):
        d.text((10 + k * (PW + 10), 26), tr(cap), fill=(60, 60, 60), font=FONT)
        img.paste(a.resize((256, 256), Image.NEAREST), (10 + k * (PW + 10), 44))   # tam jeton 1×
    for r, (cap, x, y, sc) in enumerate(wins):
        oy = top + r * (PW + 28)
        d.text((10, oy), tr(f'{cap}: x {x}–{x + win - 1}, y {y}–{y + win - 1} ({zoom}×)'), fill=(0, 0, 0), font=FONT)
        for k, (b, bg) in enumerate(((before, DARK), (after, DARK), (before, LIGHT), (after, LIGHT))):
            c = over(b, bg).crop((x, y, x + win, y + win)).resize((PW, PW), Image.NEAREST)
            img.paste(c, (10 + k * (PW + 10), oy + 20))
    img.save(path)


# ───────── ana akış ─────────
def tiefling(cikti, gorsel):
    mcfg, T = SOY['tiefling']['mask'], SOY['tiefling']['temizlik']
    tints = tints_of('tiefling')
    rows, manual, ozet = [], [], dict(jeton=0, maskesiz=[])
    for n, name in enumerate(tokens_of('tiefling')):
        M0 = load_mask(name)
        if M0 is None:
            ozet['maskesiz'].append(name)
            continue
        rgba = load_token(name)
        P = scaled(T, rgba.shape[1])
        body = rgba[..., 3] >= 128
        inside = body & (ndi.distance_transform_edt(body) >= EDGE_PX)
        before, _ = classify(rgba, M0, mcfg, P, tints, inside)
        M1, H, K = fix_mask(rgba, M0, mcfg, T)
        after, cs = classify(rgba, M1, mcfg, P, tints, inside)
        # kalan: düzeltme sonrası aynı kuralın tekrar bulacağı delik/vurgu (0 beklenir) ve elle liste (kaynakta beyaz, maske dışı)
        M2, H2, K2 = fix_mask(rgba, M1, mcfg, T)
        for (sz, cx, cy, x0, y0, x1, y1, skf, nm) in cs:
            manual.append(dict(jeton=name, x=cx, y=cy, bbox=f'{x0},{y0}-{x1},{y1}', boyut_px=sz, halka_ten_payi=skf, maskeye_uzaklik_px=nm))
        rows.append(dict(jeton=name, govde_px=int(body.sum()), maske_px=int(M0.sum()), yakin_beyaz_px=before['yakin_beyaz'],
                         a_maske_deligi_px=before['a'], b_maskede_boyanmamis_px=before['b'], b_en_kotu_soy=before['b_soy'],
                         c_kaynakta_beyaz_px=before['c'], d_mesru_beyaz_px=before['d'],
                         delik_px=int(H.sum()), vurgu_px=int(K.sum()), maske_eklenen_oran=round(float(H.sum() + K.sum()) / max(1, M0.sum()), 3),
                         sonra_a_px=after['a'], sonra_c_px=after['c'], sonra_kalan_delik_px=int(H2.sum()), sonra_kalan_vurgu_px=int(K2.sum())))
        if (n + 1) % 50 == 0:
            print(f'  {n + 1} jeton…', file=sys.stderr)
    cikti.mkdir(parents=True, exist_ok=True)
    cols = list(rows[0])
    with open(cikti / 'rapor.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=cols, lineterminator='\n'); w.writeheader(); w.writerows(rows)
    with open(cikti / 'el-duzeltme-listesi.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['jeton', 'x', 'y', 'bbox', 'boyut_px', 'halka_ten_payi', 'maskeye_uzaklik_px'], lineterminator='\n'); w.writeheader()
        for m in sorted(manual, key=lambda m: (m['jeton'], m['y'], m['x'])): w.writerow(m)
    tot = lambda k: sum(r[k] for r in rows)
    ozet.update(jeton=len(rows), govde_px=tot('govde_px'), maske_px=tot('maske_px'), yakin_beyaz_px=tot('yakin_beyaz_px'),
                a=tot('a_maske_deligi_px'), b=tot('b_maskede_boyanmamis_px'), c=tot('c_kaynakta_beyaz_px'), d=tot('d_mesru_beyaz_px'),
                delik_px=tot('delik_px'), vurgu_px=tot('vurgu_px'), sonra_a=tot('sonra_a_px'), sonra_c=tot('sonra_c_px'),
                sonra_kalan_delik=tot('sonra_kalan_delik_px'), sonra_kalan_vurgu=tot('sonra_kalan_vurgu_px'),
                delik_jeton=sum(1 for r in rows if r['delik_px'] > 0), vurgu_jeton=sum(1 for r in rows if r['vurgu_px'] > 0),
                benekli_jeton_a=sum(1 for r in rows if r['a_maske_deligi_px'] > 0), benekli_jeton_c=sum(1 for r in rows if r['c_kaynakta_beyaz_px'] > 0),
                el_listesi_jeton=len({m['jeton'] for m in manual}), el_listesi_bilesen=len(manual))
    en_kotu = sorted(rows, key=lambda r: -(r['delik_px'] + r['vurgu_px']))[:10]
    ozet['en_kotu_10'] = [(r['jeton'], r['delik_px'], r['vurgu_px']) for r in en_kotu]
    if gorsel:
        soy = 'abyssal'
        def sayfa(ad, r):
            rgba, M0 = load_token(r['jeton']), load_mask(r['jeton'])
            M1, H, K = fix_mask(rgba, M0, mcfg, T)
            en_kotu_sayfa(cikti / ad, r['jeton'], rgba, M0, M1, H, K, tints[soy], soy)
        for i, r in enumerate(en_kotu[:gorsel], 1):
            sayfa(f'en-kotu-{i:02d}-{r["jeton"]}.png', r)
    (cikti / 'ozet.json').write_text(json.dumps(ozet, ensure_ascii=False, indent=2), encoding='utf-8')
    return ozet


def diger(irk, cikti):
    """Diğer soylu ırklar: yalnız rapor (düzeltme yok). Ten kutusu ırkın `mask` kaydı; ayar Tiefling `temizlik` parametreleriyle."""
    mcfg = SOY.get(irk, {}).get('mask')
    T = SOY['tiefling']['temizlik']
    tints = tints_of(irk)
    rows = []
    for name in tokens_of(irk):
        rgba = load_token(name)
        M = load_mask(name) if irk in SOY else None
        if M is not None and irk == 'elf':   # çalışma anında SD6 temizliği (Dark Elf gradyan paleti)
            M = close_skin_holes(rgba, M)
        P = scaled(T, rgba.shape[1])
        body = rgba[..., 3] >= 128
        n, _ = classify(rgba, M, mcfg if M is not None else None, P, tints)
        H = K = 0
        if M is not None and mcfg:
            _, h, k = fix_mask(rgba, M, mcfg, T)
            H, K = int(h.sum()), int(k.sum())
        rows.append(dict(irk=irk, jeton=name, maske='yok' if M is None else 'var', govde_px=int(body.sum()), maske_px=0 if M is None else int(M.sum()),
                         yakin_beyaz_px=n['yakin_beyaz'], a_maske_deligi_px=n['a'], b_maskede_boyanmamis_px=n['b'], b_en_kotu_soy=n['b_soy'],
                         c_kaynakta_beyaz_px=n['c'], d_mesru_beyaz_px=n['d'], delik_px=H, vurgu_px=K))
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--irk', default='tiefling', help='tiefling | dragonborn | goliath | elf | orc | hepsi')
    ap.add_argument('--cikti', default=str(ROOT / 'docs' / 'sabah' / 'tiefling-beyaz-piksel'))
    ap.add_argument('--gorsel', type=int, default=10, help='en kötü N jeton için 8× önce/sonra sayfası (0: görselsiz)')
    a = ap.parse_args()
    cikti = Path(a.cikti)
    if a.irk in ('tiefling', 'hepsi'):
        print(json.dumps(tiefling(cikti, a.gorsel), ensure_ascii=False))
    if a.irk != 'tiefling':
        cikti.mkdir(parents=True, exist_ok=True)
        for irk in (['dragonborn', 'goliath', 'elf', 'orc'] if a.irk == 'hepsi' else [a.irk]):
            rows = diger(irk, cikti)
            with open(cikti / f'diger-irklar-{irk}.csv', 'w', newline='', encoding='utf-8') as f:
                w = csv.DictWriter(f, fieldnames=list(rows[0]), lineterminator='\n'); w.writeheader(); w.writerows(rows)
            print(f'diger-irklar-{irk}.csv: {len(rows)} jeton')


if __name__ == '__main__':
    main()
