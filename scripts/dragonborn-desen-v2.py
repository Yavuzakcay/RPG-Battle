"""Dragonborn pul deseni v2 (yalnız önizleme: docs/sabah/dragonborn-desen-v2/; public/ ve data/ değişmez).
`python scripts/dragonborn-desen-v2.py`
A) Maske: jetonun kendi başından ten tonu (Lab hue/kroma) örneklenir; tene yakın pikseller aday, 3×3 kapama, küçük bileşen atma,
   kapalı delik doldurma (parlama). Boyanan yalnız açık/ten pikseli (koyu kontur, göz, ağız, sıcak/doygun piksel hariç); içeri çekme yok.
B) Boyama: parlaklığı koruyan ton + doygunluk (Lab: L* tenin ortancasına göre farkıyla hedef orta tona taşınır, h/C hedefin).
C) Doku: pul karosu (v1 geometrisi, pul 8 px) yalnız ±L* modülasyonu; Gümüş/Beyaz'da koyulaştırma yönünde.
D) Önce (oyundaki çarpma filtresi) / sonra; 256 px ve 64/96 px; 6 jeton × 10 soy."""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAR = os.path.join(ROOT, 'public/characters')
OUT = os.path.join(ROOT, 'docs/sabah/dragonborn-desen-v2')
def _mod(n):
    s = importlib.util.spec_from_file_location(n.replace('-', '_'), os.path.join(ROOT, 'scripts', n + '.py')); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
renk = _mod('dragonborn-desen-renk'); v1 = _mod('dragonborn-desen')
lab = v1.dm.lab

JETONLAR = ['kadin-wizard-WZ-B1', 'erkek-fighter-ID4', 'erkek-barbarian-ID2', 'kadin-monk-ID1', 'erkek-ranger-ID4', 'kadin-fighter-ID4']
SOYLAR = v1.SOYLAR; SOY_TR = v1.SOY_TR
P = {'konturL': 42, 'tonFark': 16, 'cAlt': 0.3, 'cUst': 2.4, 'beyazL': 88, 'beyazC': 8, 'minBilesen': 40, 'bilesenL': 62, 'delik': 160,
     'sicakC': 14, 'sicakL': 88, 'mod': 5.0, 'modKoyu': {'gumus': (0.0, -3.0, -6.0), 'beyaz': (0.0, -3.0, -6.0)}}   # modKoyu: (açık, orta, koyu) L* farkı
BG = np.array([44, 48, 58])

def _lab2rgb(L, a, b):
    fy = (L + 16) / 116; fx, fz = fy + a / 500, fy - b / 200
    fi = lambda t: np.where(t ** 3 > 0.008856, t ** 3, (t - 16 / 116) / 7.787)
    x, y, z = fi(fx) * 0.95047, fi(fy), fi(fz) * 1.08883
    r = 3.2406 * x - 1.5372 * y - 0.4986 * z; g = -0.9689 * x + 1.8758 * y + 0.0415 * z; bl = 0.0557 * x - 0.2040 * y + 1.0570 * z
    rgb = np.stack([r, g, bl], -1)
    ok = np.all((rgb >= -1e-4) & (rgb <= 1.0001), -1)
    c = np.clip(rgb, 0, 1); c = np.where(c > 0.0031308, 1.055 * c ** (1 / 2.4) - 0.055, 12.92 * c)
    return c * 255, ok

def comps(m):
    H, W = m.shape; lab_ = np.full(m.shape, -1, np.int32); out = []
    for y0, x0 in zip(*np.nonzero(m)):
        if lab_[y0, x0] >= 0: continue
        st = [(y0, x0)]; lab_[y0, x0] = len(out); px = []
        while st:
            y, x = st.pop(); px.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and lab_[yy, xx] < 0: lab_[yy, xx] = len(out); st.append((yy, xx))
        out.append(np.array(px))
    return out

def dil(m): p = np.pad(m, 1); return np.any([p[1 + dy:1 + dy + m.shape[0], 1 + dx:1 + dx + m.shape[1]] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], 0)
def ero(m): p = np.pad(m, 1, constant_values=True); return np.all([p[1 + dy:1 + dy + m.shape[0], 1 + dx:1 + dx + m.shape[1]] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], 0)

def mask_of(rgba):
    L = lab(rgba[..., :3].astype(float)); a, b = L[..., 1], L[..., 2]; C = np.hypot(a, b); h = (np.degrees(np.arctan2(b, a)) + 360) % 360
    op = rgba[..., 3] >= 128; ys, xs = np.nonzero(op); y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    lav = op & (L[..., 0] > 55) & (a > 1) & (b < -1) & (h > 270) & (h < 345)
    head = np.zeros_like(op); head[y0:y0 + int((y1 - y0) * 0.3), x0 + (x1 - x0) // 5: x1 - (x1 - x0) // 5] = True
    s = lav & head
    if s.sum() < 50: return None, {'neden': 'başta ten örneği yok'}
    h0 = float(np.median(h[s])); c0 = float(np.median(C[s])); l0 = float(np.median(L[..., 0][s]))
    dh = np.abs((h - h0 + 180) % 360 - 180)
    skin = op & (L[..., 0] > P['konturL']) & (dh <= P['tonFark']) & (C >= c0 * P['cAlt']) & (C <= c0 * P['cUst'] + 3)
    white = op & (L[..., 0] > P['beyazL']) & (C < P['beyazC'])
    cand = skin | white
    cand = ero(dil(cand)) & op                                    # 3×3 kapama
    keep = np.zeros_like(cand); dropped = 0
    for c in comps(cand):
        mL = L[..., 0][c[:, 0], c[:, 1]].mean(); onlyWhite = white[c[:, 0], c[:, 1]].mean() > 0.8
        if len(c) >= P['minBilesen'] and mL >= P['bilesenL'] and not onlyWhite: keep[c[:, 0], c[:, 1]] = True
        else: dropped += len(c)
    # kapalı delikler (dışarıdan ulaşılamayan, küçük) maskeye
    for c in comps(~keep):
        if len(c) <= P['delik'] and not ((c[:, 0] == 0) | (c[:, 1] == 0) | (c[:, 0] == 255) | (c[:, 1] == 255)).any(): keep[c[:, 0], c[:, 1]] = True
    warm = (b > 0) & ((C > P['sicakC']) | (L[..., 0] < P['sicakL']))   # göz, ağız (doygun sıcak), boynuz (sarımsı gri); dövme kenarındaki açık hale boyanır
    paint = keep & op & (L[..., 0] > P['konturL']) & ~warm & (C <= c0 * P['cUst'] + 6)
    return paint, {'tonH': round(h0, 1), 'tonC': round(c0, 1), 'tenL': round(l0, 1), 'boya': int(paint.sum()), 'atilan': int(dropped)}

def paint(rgba, m, cols, soy, t):
    L = lab(rgba[..., :3].astype(float)); Lm = float(np.median(L[..., 0][m]))
    Lt, Ct, Ht = renk.rgb2lch(cols['orta'])
    dL = L[..., 0] - Lm
    Lo = np.clip(Lt + dL, 2, 99)
    mod = np.array(P['modKoyu'][soy][::-1] if soy in P['modKoyu'] else (-P['mod'], 0.0, P['mod']))   # karo tonu 0 koyu, 1 orta, 2 açık
    tl = np.tile(t, (256 // t.shape[0] + 1, 256 // t.shape[1] + 1))[:256, :256]
    Lo = np.clip(Lo + mod[tl], 2, 99)
    Co = Ct * np.clip(1 - np.abs(dL) / 120, 0.6, 1.0)                 # uç ışık/gölgede kroma hafif düşer
    out = rgba[..., :3].astype(float).copy()
    for k in range(6):                                                # gam dışında kroma kıs
        rgb, ok = _lab2rgb(Lo, Co * np.cos(np.radians(Ht)), Co * np.sin(np.radians(Ht)))
        Co = np.where(ok, Co, Co * 0.8)
    rgb, _ = _lab2rgb(Lo, Co * np.cos(np.radians(Ht)), Co * np.sin(np.radians(Ht)))
    out[m] = rgb[m]; o = rgba.copy(); o[..., :3] = np.clip(out, 0, 255).astype(np.uint8); return o

def game_mult(rgba, renk_hex, muaf=0.12, tam=0.28):
    """Oyundaki Dragonborn çarpma filtresi (src/ui/tint.ts multiplyPixels) birebir."""
    c = np.array(renk.hex2rgb(renk_hex)) / 255; d = rgba[..., :3].astype(float)
    sat = (d.max(-1) - d.min(-1)) / 255; w = np.where(sat <= muaf, 1, np.where(sat >= tam, 0, (tam - sat) / (tam - muaf)))
    w = w * (rgba[..., 3] >= 8); o = rgba.copy(); o[..., :3] = np.round(d + (d * c - d) * w[..., None]).astype(np.uint8); return o

def on_bg(rgba, size=None):
    im = Image.fromarray(rgba, 'RGBA')
    if size: im = im.resize((size, size), Image.LANCZOS)
    bg = Image.new('RGBA', im.size, tuple(BG) + (255,)); bg.alpha_composite(im); return bg.convert('RGB')

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    os.makedirs(OUT, exist_ok=True)
    tab, _ = renk.table(); t = v1.tile(8)
    game = json.load(open(os.path.join(ROOT, 'data/soy-renkleri.json'), encoding='utf-8'))['races']['dragonborn']['lineagesAlt']
    rep = {}
    for n in JETONLAR:
        rgba = np.array(Image.open(os.path.join(CHAR, f'dragonborn-{n}.webp')).convert('RGBA'))
        m, info = mask_of(rgba); rep[n] = info
        # maske kontrolü
        im = np.array(on_bg(rgba)).astype(float); ov = im.copy()
        if m is not None: ov[m] = ov[m] * 0.35 + np.array([255, 0, 200]) * 0.65
        mk = Image.new('RGB', (512, 256)); mk.paste(Image.fromarray(im.astype(np.uint8)), (0, 0)); mk.paste(Image.fromarray(ov.astype(np.uint8)), (256, 0))
        mk.save(os.path.join(OUT, f'maske-{n}.png'))
        if m is None: continue
        # sayfa: satır = soy; sütun: orijinal, önce (oyun), sonra (256, 2× gösterim); savaş boyutu önce/sonra 64, 96
        Z = 2; W = 224 * Z; colsW = [W, W, W, 64, 64, 96, 96]
        sheet = Image.new('RGB', (180 + sum(colsW) + 20 * len(colsW), 40 + 10 * (W + 10)), tuple(BG)); dr = ImageDraw.Draw(sheet)
        heads = ['orijinal', 'önce (oyundaki çarpma)', 'sonra (ton + pul dokusu)', 'önce 64', 'sonra 64', 'önce 96', 'sonra 96']
        xs = [180]; [xs.append(xs[-1] + w + 20) for w in colsW[:-1]]
        for x, hd in zip(xs, heads): dr.text((x, 12), hd, fill=(230, 232, 238), font=v1.FONT)
        for r, soy in enumerate(SOYLAR):
            y = 36 + r * (W + 10); dr.text((8, y + W // 2), SOY_TR[soy], fill=(230, 232, 238), font=v1.FONT)
            before = game_mult(rgba, game[tab[soy]['soy']]['multiply']['renk']) if tab[soy]['soy'] != 'white' else rgba
            after = paint(rgba, m, tab[soy], soy, t)
            ims = [on_bg(rgba).crop((16, 8, 240, 232)).resize((W, W), Image.NEAREST), on_bg(before).crop((16, 8, 240, 232)).resize((W, W), Image.NEAREST),
                   on_bg(after).crop((16, 8, 240, 232)).resize((W, W), Image.NEAREST), on_bg(before, 64), on_bg(after, 64), on_bg(before, 96), on_bg(after, 96)]
            for x, im_ in zip(xs, ims): sheet.paste(im_, (x, y))
        sheet.quantize(256, dither=Image.Dither.NONE).save(os.path.join(OUT, f'{n}.png'), optimize=True)
    # özet: 6 jeton × 10 soy, sonra (128 px) + üstte orijinal
    S = 128; oz = Image.new('RGB', (S * 11 + 10, len(JETONLAR) * (S + 6) + 24), tuple(BG)); dr = ImageDraw.Draw(oz)
    for c, hd in enumerate(['orijinal'] + [SOY_TR[x].split(' ')[0] for x in SOYLAR]): dr.text((c * S + 4, 4), hd, fill=(230, 232, 238), font=v1.FONT)
    for r, n in enumerate(JETONLAR):
        rgba = np.array(Image.open(os.path.join(CHAR, f'dragonborn-{n}.webp')).convert('RGBA')); m, _ = mask_of(rgba)
        oz.paste(on_bg(rgba).resize((S, S), Image.NEAREST), (0, 24 + r * (S + 6)))
        for c, soy in enumerate(SOYLAR): oz.paste(on_bg(paint(rgba, m, tab[soy], soy, t)).resize((S, S), Image.NEAREST), ((c + 1) * S, 24 + r * (S + 6)))
    oz.quantize(256, dither=Image.Dither.NONE).save(os.path.join(OUT, 'ozet.png'), optimize=True)
    json.dump({'not': 'scripts/dragonborn-desen-v2.py: maske ölçümü (ten tonu, boyanan piksel, atılan bileşen).', 'parametre': {k: v for k, v in P.items()}, 'jetonlar': rep},
              open(os.path.join(OUT, 'olcum.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    print(json.dumps(rep, ensure_ascii=False))
