"""Dragonborn pul deseni: kodla üretilen dikişsiz piksel karo + önizlemeler (yalnız docs/sabah/dragonborn-desen/, public/'e yazmaz).
`python scripts/dragonborn-desen.py`
Geometri (10 soyda aynı): pul genişliği W, satır aralığı W, satırlar W/2 kaydırılmış (tuğla), pul boyu 1,75W, alt uç sivri;
üstteki satır alttakinin üstüne biner (pulun görünen kısmı damla). Tonlar: 0 koyu (alt V kenarı ve uç), 1 orta (üst kısım), 2 açık (uca yakın iç bölge); siyah çizgi/nokta yok.
Karo 2W×2W, piksel = jetonun 1 görüntü pikseli (256 px jeton uzayında, en yakın komşu)."""
import json, os, sys, importlib.util
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/sabah/dragonborn-desen')
def _mod(n):
    s = importlib.util.spec_from_file_location(n, os.path.join(ROOT, 'scripts', n + '.py')); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
renk = _mod('dragonborn-desen-renk'); dm = _mod('dragonborn-desen-maske')
SECENEK = {'kucuk': 8, 'orta': 10}

def tile(W):
    """2W×2W ton dizisi (0 koyu, 1 orta, 2 açık)."""
    T = 2 * W; Hs = 1.75 * W; t0 = 0.875 * W; out = np.zeros((T, T), np.uint8)
    def w(v): return W / 2 if v < t0 else (W / 2) * max(0.0, 1 - ((v - t0) / (Hs - t0)) ** 1.6)   # dışbükey yanlar, sivri uç
    for y in range(T):
        for x in range(T):
            best = None
            for j in range(-3, 3):           # satır (üstteki öncelikli: küçük ty kazanır)
                ty = j * W; off = (W / 2) * (j % 2)
                v = y + 0.5 - ty
                if v < 0 or v > Hs: continue
                for i in range(-2, 4):
                    cx = i * W + W / 2 + off
                    for wrapx in (-T, 0, T):
                        u = x + 0.5 - (cx + wrapx)
                        if abs(u) <= w(v):
                            if best is None or ty < best[0]: best = (ty, u, v)
            if best is None: out[y, x] = 1; continue
            _, u, v = best
            edge = w(v) - abs(u)
            if (v >= t0 * 0.8 and edge < 1.0) or (v > Hs - 1.0 and edge < 0.6): out[y, x] = 0                     # alt (V) kenar ve uç: koyu
            elif edge >= 1.5 and W * 0.8 <= v <= Hs - 1.5 and -W * 0.34 <= u <= W * 0.1: out[y, x] = 2                   # uca yakın iç bölge (hafif sol): açık
            else: out[y, x] = 1                                                                   # üst kısım (üst pulun altında): orta
    return out

def colorize(t, cols):
    pal = np.array([renk.hex2rgb(cols['koyu']), renk.hex2rgb(cols['orta']), renk.hex2rgb(cols['acik'])], np.uint8)
    return pal[t]

# Güvenilmeyen maskeler: elle inceleme (docs/sabah/dragonborn-desen/inceleme/) + otomatik (maske yok / < 30 px)
GUVENILMEYEN = {
    'maske yok': ['erkek-rogue-ID4', 'kadin-rogue-ID4', 'kadin-druid-ID4'],
    'boynuz ten renginde, maske boynuzu ayıramıyor': ['erkek-fighter-ID7', 'erkek-warlock-WL-1', 'erkek-warlock-WL-2', 'erkek-warlock-WL-5',
        'kadin-warlock-WL-1', 'kadin-warlock-WL-2', 'kadin-warlock-WL-5', 'kadin-warlock-WL-9', 'kadin-sorcerer-SC-3'],
    'açık renkli kıyafet/zırh/eşya maskeye karışıyor': ['erkek-barbarian-ID4', 'erkek-barbarian-ID7', 'erkek-barbarian-ID8', 'erkek-cleric-ID7',
        'erkek-fighter-ID3', 'erkek-fighter-ID10', 'erkek-monk-ID9', 'erkek-paladin-ID10', 'erkek-ranger-ID8', 'erkek-rogue-ID10',
        'erkek-sorcerer-SC-6', 'erkek-warlock-WL-7', 'erkek-wizard-WZ-A1', 'erkek-wizard-WZ-A2', 'erkek-wizard-WZ-A5', 'erkek-wizard-WZ-A6',
        'erkek-wizard-WZ-A8', 'erkek-wizard-WZ-B5', 'kadin-cleric-ID3', 'kadin-cleric-ID7', 'kadin-paladin-ID10', 'kadin-rogue-ID10',
        'kadin-sorcerer-SC-6', 'kadin-warlock-WL-7', 'kadin-wizard-WZ-A5', 'kadin-wizard-WZ-B5', 'erkek-cleric-ID5', 'kadin-cleric-ID5',
        'kadin-wizard-WZ-A1', 'kadin-wizard-WZ-A6', 'kadin-fighter-ID10'],
    'kostüm/ruh/ölümsüz biçim: yüz ya da gövde ejderha teni değil': ['erkek-bard-ID7', 'kadin-bard-ID7', 'erkek-cleric-ID6', 'kadin-cleric-ID6',
        'erkek-druid-ID4', 'erkek-monk-ID2', 'kadin-monk-ID2', 'erkek-monk-ID10', 'kadin-monk-ID10', 'erkek-sorcerer-SC-3',
        'erkek-sorcerer-SC-5', 'kadin-sorcerer-SC-5', 'erkek-sorcerer-SC-9', 'kadin-sorcerer-SC-9', 'erkek-warlock-WL-4', 'kadin-warlock-WL-4',
        'erkek-warlock-WL-8', 'kadin-warlock-WL-8', 'erkek-warlock-WL-10', 'kadin-warlock-WL-10', 'kadin-fighter-ID7'],
}
REDDET = {f'dragonborn-{n}': neden for neden, ns in GUVENILMEYEN.items() for n in ns}
ORNEK = ['dragonborn-erkek-fighter-ID4', 'dragonborn-kadin-monk-ID1', 'dragonborn-erkek-barbarian-ID2', 'dragonborn-kadin-wizard-WZ-B1']
SOYLAR = ['siyah', 'mavi', 'pirinc', 'bronz', 'bakir', 'altin', 'yesil', 'kirmizi', 'gumus', 'beyaz']
SOY_TR = {'siyah': 'Siyah (Black)', 'mavi': 'Mavi (Blue)', 'pirinc': 'Pirinç (Brass)', 'bronz': 'Bronz (Bronze)', 'bakir': 'Bakır (Copper)',
          'altin': 'Altın (Gold)', 'yesil': 'Yeşil (Green)', 'kirmizi': 'Kırmızı (Red)', 'gumus': 'Gümüş (Silver)', 'beyaz': 'Beyaz (White)'}
BG = (44, 48, 58)
def _font():
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DejaVuSans.ttf', 'arial.ttf', 'segoeui.ttf'):   # Linux, Windows
        try: return ImageFont.truetype(f, 13)
        except OSError: pass
    return ImageFont.load_default()
FONT = _font()

def label(im, txt, xy, fill=(230, 232, 238)): ImageDraw.Draw(im).text(xy, txt, fill=fill, font=FONT)

def apply(rgba, mask, layer):
    """Normalize çarpma: ten ortancası 1 kabul edilir (beyaz/lavanta taban pulun rengini kaydırmaz), gölge-ışık korunur."""
    rgb = rgba[..., :3].astype(float); out = rgb.copy()
    ref = np.median(rgb[mask], 0) if mask.sum() else np.array([255.0] * 3)
    gain = np.clip(rgb / np.maximum(ref, 1), 0, 1.15)
    out[mask] = np.clip(layer[mask].astype(float) * gain[mask], 0, 255)
    o = rgba.copy(); o[..., :3] = out.astype(np.uint8); return o

def flat(t): return np.zeros_like(t)

def on_bg(rgba, scale=1):
    al = rgba[..., 3:4] / 255.0; im = rgba[..., :3] * al + np.array(BG) * (1 - al)
    p = Image.fromarray(im.astype(np.uint8)); return p.resize((p.width * scale, p.height * scale), Image.NEAREST) if scale > 1 else p

def layer_for(t, cols, H=256, Wd=256):
    c = colorize(t, cols); ry, rx = -(-H // c.shape[0]), -(-Wd // c.shape[1])
    return np.tile(c, (ry, rx, 1))[:H, :Wd]

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')   # Windows konsolu (cp1254) Δ, → gibi karakterleri yazamaz
    os.makedirs(OUT, exist_ok=True)
    tab, ref = renk.table()
    tiles = {k: tile(W) for k, W in SECENEK.items()}
    # 1) karolar (ham, 1× piksel) + yan yana sayfa + 4×4 döşeme testi
    for sec, t in tiles.items():
        d = os.path.join(OUT, 'karo', sec); os.makedirs(d, exist_ok=True)
        S = 8; Tn = t.shape[0]
        sheet = Image.new('RGB', (10 * (Tn * S + 16) + 16, Tn * S + 48), BG)
        for i, soy in enumerate(SOYLAR):
            c = colorize(t, tab[soy]); Image.fromarray(c).save(os.path.join(d, f'desen-{soy}.png'))
            Image.fromarray(np.tile(c, (4, 4, 1))).resize((Tn * 4 * 6, Tn * 4 * 6), Image.NEAREST).save(os.path.join(d, f'doseme-4x4-{soy}.png'))
            sheet.paste(Image.fromarray(c).resize((Tn * S, Tn * S), Image.NEAREST), (16 + i * (Tn * S + 16), 32)); label(sheet, SOY_TR[soy].split(' ')[0], (16 + i * (Tn * S + 16), 10))
        sheet.save(os.path.join(OUT, f'desen-sayfa-{sec}.png'))
    # 2) renk kareleri
    sw = 64; img = Image.new('RGB', (180 + 3 * (sw + 8) + 40 + 3 * (sw + 8), 40 + 10 * (sw + 10)), BG)
    label(img, 'Sonuç (açık / orta / koyu)', (180, 8)); label(img, 'Başlangıç değeri', (180 + 3 * (sw + 8) + 40, 8))
    for r, soy in enumerate(SOYLAR):
        y = 36 + r * (sw + 10); v = tab[soy]; label(img, SOY_TR[soy], (10, y + sw // 2 - 7))
        for c, k in enumerate(('acik', 'orta', 'koyu')):
            ImageDraw.Draw(img).rectangle([180 + c * (sw + 8), y, 180 + c * (sw + 8) + sw, y + sw], fill=v[k])
            b = v.get('baslangic', {}).get(k, v[k]); x2 = 180 + 3 * (sw + 8) + 40 + c * (sw + 8)
            ImageDraw.Draw(img).rectangle([x2, y, x2 + sw, y + sw], fill=b)
    img.save(os.path.join(OUT, 'renk-kareleri.png'))
    # 3) jeton önizlemeleri: her örnek jeton için 10 soy × (orijinal | desen küçük | desen orta | düz renk)
    names = dm.tokens(); masks = {}
    def get(n):
        if n not in masks: masks[n] = dm.mask_of(n)
        return masks[n]
    d = os.path.join(OUT, 'jeton'); os.makedirs(d, exist_ok=True)
    S2 = 2; cell = 224 * S2
    for n in ORNEK:
        rgba, m, _ = get(n)
        sheet = Image.new('RGB', (4 * cell + 220, 10 * (cell + 8) + 40), BG)
        for c, h in enumerate(['orijinal', 'desen küçük (pul 8 px)', 'desen orta (pul 10 px)', 'düz renk (orta ton)']): label(sheet, h, (220 + c * cell + 6, 12))
        for r, soy in enumerate(SOYLAR):
            y = 36 + r * (cell + 8); label(sheet, SOY_TR[soy], (8, y + cell // 2))
            vs = [rgba, apply(rgba, m, layer_for(tiles['kucuk'], tab[soy])), apply(rgba, m, layer_for(tiles['orta'], tab[soy])),
                  apply(rgba, m, colorize(flat(np.zeros((256, 256), np.uint8)) + 1, tab[soy]))]
            for c, v in enumerate(vs): sheet.paste(on_bg(v).crop((16, 8, 240, 232)).resize((cell, cell), Image.NEAREST), (220 + c * cell, y))
        sheet.quantize(256, dither=Image.Dither.NONE).save(os.path.join(d, f'{n[11:]}.png'), optimize=True)
    # 4) bütün jetonlar: kırmızı küçük desen (uygulanmayanlar beyaz + kırmızı çerçeve)
    per, S3 = 12, 128; rows = -(-len(names) // per)
    for sec in ('kucuk',):
        for soy in ('kirmizi', 'mavi'):
            sh = Image.new('RGB', (per * S3, rows * (S3 + 16)), BG); dr = ImageDraw.Draw(sh)
            for i, n in enumerate(names):
                rgba, m, _ = get(n); x, y = (i % per) * S3, (i // per) * (S3 + 16)
                ok = m is not None and m.sum() >= 30 and n not in REDDET
                v = apply(rgba, m, layer_for(tiles[sec], tab[soy])) if ok else rgba
                sh.paste(on_bg(v).resize((S3, S3), Image.NEAREST), (x, y))
                if not ok: dr.rectangle([x, y, x + S3 - 1, y + S3 - 1], outline=(230, 60, 60), width=2)
                dr.text((x + 2, y + S3 + 1), n[11:], fill=(220, 220, 220) if ok else (240, 120, 120))
            sh.quantize(256, dither=Image.Dither.NONE).save(os.path.join(OUT, f'tum-jetonlar-{soy}-{sec}.png'), optimize=True)
    # 5) boynuz ve kıyafet kenarı yakın kırpmalar (×8): orijinal | desen | maske sınırı
    def horn_box(m):
        ys = np.nonzero(m.any(1))[0]; xs = np.nonzero(m[ys[0]:ys[0] + 30].any(0))[0]; cx = (xs[0] + xs[-1]) // 2
        return (int(cx - 36), int(max(ys[0] - 22, 0)), int(cx + 36), int(max(ys[0] - 22, 0) + 48))
    def cloth_box(rgba, m):
        """Maske kenarının açık renkli, maske dışı (kıyafet/zırh) piksele en çok değdiği 72×48 pencere (baş altı)."""
        L = dm.lab(rgba[..., :3].astype(float)); other = (rgba[..., 3] >= 128) & ~m & (L[..., 0] > 60)
        grow = ~dm.erode(~m); edge = grow & other; ys = np.nonzero(m.any(1))[0]; edge[: ys[0] + 45] = False
        yy, xx = np.nonzero(edge)
        if not len(yy): return (60, 90, 132, 138)
        best = max(((((abs(yy - y) < 24) & (abs(xx - x) < 36)).sum(), y, x) for y, x in zip(yy[::7], xx[::7])))
        _, y, x = best; x0 = int(min(max(x - 36, 0), 184)); y0 = int(min(max(y - 24, 0), 208)); return (x0, y0, x0 + 72, y0 + 48)
    kirp = []
    for n, ad in [('dragonborn-erkek-barbarian-GR', 'boynuz'), ('dragonborn-kadin-monk-ID1', 'boynuz'), ('dragonborn-erkek-warlock-WL-9', 'boynuz')]:
        kirp.append((n, horn_box(get(n)[1]), ad))
    for n, ad in [('dragonborn-erkek-barbarian-GR', 'kiyafet'), ('dragonborn-erkek-wizard-WZ-B1', 'kiyafet'), ('dragonborn-kadin-cleric-ID1', 'kiyafet')]:
        r_, m_, _ = get(n); kirp.append((n, cloth_box(r_, m_), ad))
    dd = os.path.join(OUT, 'kirpma'); os.makedirs(dd, exist_ok=True)
    for n, box, ad in kirp:
        rgba, m, _ = get(n); v = apply(rgba, m, layer_for(tiles['kucuk'], tab['kirmizi']))
        ov = on_bg(rgba); ova = np.array(ov).astype(float); ova[m] = ova[m] * 0.35 + np.array([255, 0, 200]) * 0.65
        w, h = box[2] - box[0], box[3] - box[1]; Z = 8
        out = Image.new('RGB', (3 * w * Z + 40, h * Z + 34), BG)
        for c, (im, t) in enumerate([(on_bg(rgba), 'orijinal'), (on_bg(v), 'desen (kırmızı, küçük)'), (Image.fromarray(ova.astype(np.uint8)), 'maske (macenta)')]):
            out.paste(im.crop(box).resize((w * Z, h * Z), Image.NEAREST), (c * (w * Z + 20), 30)); label(out, t, (c * (w * Z + 20) + 4, 8))
        out.save(os.path.join(dd, f'{ad}-{n[11:]}.png'))
    # 5b) savaş boyutu: jeton ekranda 256 px'ten küçük çizilir (altıgen ≥ 44 px); 64/96/128 px'e küçültülmüş hâl (tarayıcı gibi yumuşak küçültme)
    sz = [64, 96, 128]; n = 'dragonborn-erkek-fighter-ID4'; rgba, m, _ = get(n)
    vs = [('orijinal', rgba), ('küçük desen', apply(rgba, m, layer_for(tiles['kucuk'], tab['kirmizi']))),
          ('orta desen', apply(rgba, m, layer_for(tiles['orta'], tab['kirmizi']))), ('düz renk', apply(rgba, m, colorize(np.ones((256, 256), np.uint8), tab['kirmizi'])))]
    out = Image.new('RGB', (sum(sz) + 40 * len(sz) + 120, len(vs) * 140 + 30), BG)
    for r, (t, v) in enumerate(vs):
        label(out, t, (6, 30 + r * 140 + 50)); x = 120
        for z in sz:
            im = Image.fromarray(v).resize((z, z), Image.LANCZOS); bg = Image.new('RGBA', (z, z), BG + (255,)); bg.alpha_composite(im)
            big = bg.convert('RGB').resize((z * 1, z * 1)); out.paste(big, (x, 30 + r * 140)); 
            if r == 0: label(out, f'{z} px', (x, 8))
            x += z + 40
    out.save(os.path.join(OUT, 'savas-boyutu.png'))
    # 6) ölçüm + güvenilmeyen liste
    rep = {}
    for n in names:
        rgba, m, info = get(n)
        rep[n[11:]] = {'uygulandi': bool(m is not None and m.sum() >= 30 and n not in REDDET), 'neden': REDDET.get(n) or info.get('neden'),
                       **{k: v for k, v in info.items() if k != 'neden'}}
    json.dump({'not': 'scripts/dragonborn-desen.py: jeton başına desen uygulama durumu ve maske ölçümü (piksel, 256 px).', 'jetonlar': rep},
              open(os.path.join(OUT, 'jeton-durumu.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    print('uygulanan', sum(v['uygulandi'] for v in rep.values()), '/', len(rep))
