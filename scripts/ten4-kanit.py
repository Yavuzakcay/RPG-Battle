"""
TEN-MASKE-4-IRK kanıtı (yalnız okur): önce/sonra tarayıcı boya dökümünü (`scripts/jeton-denetim-cizim.ts --yalniz boya`, oyunun kendi
`tintedUrl` çıktısı) karşılaştırır.
  1. Hedef dışı (Orc/Goliath/Dwarf/Gnome dışı) görünüşler: önce ve sonra aynı anahtar, piksel piksel aynı mı.
  2. Hedef görünüşler (sonra): boyalı jetonun ham jetondan farklı her pikseli ten maskesinin içinde mi (çalışma anı onarımı: maskenin
     1 px kapaması + çevrelediği ≤ 12 px delikler, `maskClose.ts` `fixSkinMask`, yalnız Goliath). Maske dışı fark = kıyafet/silah/saç/sakal.
     Opak piksel birebir; yarı saydam kenar ön-çarpılmış görünen değerle (tuval kodlaması), alfa birebir.
  3. Soy başına 3 jeton önce/sonra sayfası (önce: bütün-jeton CSS filtresi numpy'de feColorMatrix ile, ya da eski boya).
Çalıştırma: python scripts/ten4-kanit.py <önce klasörü> <sonra klasörü> <çıktı klasörü>  (klasör = gorsel-dokum/jeton-denetim düzeni)
"""
import os, sys, json, re
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ONCE, SONRA, OUT = sys.argv[1:4]
IRK = ('orc', 'goliath', 'dwarf', 'gnome')
os.makedirs(OUT, exist_ok=True)
meta = lambda d: json.load(open(f'{d}/veri/boya.json', encoding='utf-8'))
mo, ms = meta(ONCE), meta(SONRA)
race = lambda src: src.split('/')[-1].split('-')[0]
png = lambda d, k: np.asarray(Image.open(f'{d}/boya/{k}.png').convert('RGBA'))

SOY = json.load(open('data/soy-renkleri.json', encoding='utf-8'))
def srgb_to_lab(rgb):
    c = rgb.astype(np.float64) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

sonuc = {}
# 1) hedef dışı
same = diff = only = 0; farkli = []
for k, m in mo.items():
    if race(m['src']) in IRK: continue
    s = ms.get(k)
    if not s: only += 1; continue
    if m['png'] != s['png'] or m['fb'] != s['fb']: diff += 1; farkli.append(k); continue
    if m['png'] and not np.array_equal(png(ONCE, k), png(SONRA, k)): diff += 1; farkli.append(k); continue
    same += 1
yeni_dis = sum(1 for k, s in ms.items() if race(s['src']) not in IRK and k not in mo)
sonuc['hedefDisi'] = dict(ayni=same, farkli=diff, yalnizOnce=only, yalnizSonra=yeni_dis, ornekFarkli=farkli[:10])

# 2) hedef: maske dışı fark
dis = {r: dict(gorunus=0, boyali=0, bos=0, maskeDisi=0, maskeDisiPx=0, onarimIci=0) for r in IRK}
kotu = []
for k, s in ms.items():
    r = race(s['src'])
    if r not in IRK: continue
    d = dis[r]; d['gorunus'] += 1
    if not s['png']: continue
    name = s['src'].split('/')[-1][:-5]
    orig = np.asarray(Image.open(f"public/{s['src']}").convert('RGBA'))
    out = png(SONRA, k)
    mp = f'public/characters/maske-el/{name}.png' if os.path.exists(f'public/characters/maske-el/{name}.png') else f'public/characters/maske/{name}.png'
    mask = np.asarray(Image.open(mp).convert('L').resize(orig.shape[1::-1], Image.NEAREST)) > 127
    # Opak pikselde RGB birebir; yarı saydamda tarayıcı tuvali ön-çarpılmış saklar (düz RGB yuvarlanır): görünen değer (RGB × alfa) ±2;
    # tam saydamda RGB anlamsız. Alfa her yerde birebir.
    oi, pi = orig.astype(int), out.astype(int)
    op = oi[..., 3] == 255; semi = (oi[..., 3] > 0) & ~op
    pm = np.abs(oi[..., :3] * oi[..., 3:] // 255 - pi[..., :3] * pi[..., 3:] // 255).max(-1)
    ch = (op & (np.abs(oi - pi)[..., :3].max(-1) > 0)) | (semi & (pm > 2)) | (oi[..., 3] != pi[..., 3])
    if not mask.any(): d['bos'] += 1
    else: d['boyali'] += 1
    o = ch & ~mask
    if o.any():
        # çalışma anı onarımı (Goliath temizlik: 1 px kapama + ≤ 12 px delik)
        # `fixSkinMask` modeli: ten renk kutusundaki (soy-renkleri temizlik.kutu) pikseller için 1 px kapama, sonra kapanmış maskenin
        # çevrelediği ≤ enCok px deliklerin kutudaki pikselleri.
        t = SOY['races'].get(r, {}).get('temizlik')
        if t:
            kb = t.get('kutu') or SOY['races'][r]['mask']
            lab = srgb_to_lab(orig[..., :3]); Lc = lab[..., 0]; Cc = np.hypot(lab[..., 1], lab[..., 2]); hc = (np.degrees(np.arctan2(lab[..., 2], lab[..., 1])) + 360) % 360
            ok = (Lc >= kb['L'][0]) & (Lc <= kb['L'][1]) & (Cc >= kb['C'][0]) & (Cc <= kb['C'][1]) & np.any([(hc >= a) & (hc <= b) for a, b in kb['h']], 0) & (orig[..., 3] >= 10)
            closed = mask | (ndi.binary_closing(mask, structure=np.ones((3, 3)), iterations=t['delik'].get('kapama', 1)) & ok)
            lb, n = ndi.label(ndi.binary_fill_holes(closed) & ~closed, structure=np.ones((3, 3)))
            small = np.isin(lb, 1 + np.where(ndi.sum(np.ones_like(lb), lb, range(1, n + 1)) <= t['delik']['enCok'])[0]) if n else np.zeros_like(mask)
            fix = closed | (small & ok)
        else:
            fix = mask
        d['onarimIci'] += int((o & fix).sum())
        o &= ~fix
    if o.any():
        d['maskeDisi'] += 1; d['maskeDisiPx'] += int(o.sum()); kotu.append((name, int(o.sum())))
sonuc['hedef'] = dis
sonuc['maskeDisiOrnek'] = sorted(kotu, key=lambda x: -x[1])[:15]

# 3) önce/sonra sayfaları
def css(arr, f):
    """CSS filter (sepia, hue-rotate, saturate, brightness; feColorMatrix tanımları, sRGB'de) → numpy."""
    rgb = arr[..., :3].astype(np.float64) / 255
    for fn, val in re.findall(r'([a-z-]+)\(([^)]+)\)', f):
        v = float(val.replace('deg', ''))
        if fn == 'brightness': rgb = rgb * v
        elif fn == 'saturate':
            M = np.array([[.213 + .787 * v, .715 - .715 * v, .072 - .072 * v], [.213 - .213 * v, .715 + .285 * v, .072 - .072 * v], [.213 - .213 * v, .715 - .715 * v, .072 + .928 * v]])
            rgb = rgb @ M.T
        elif fn == 'hue-rotate':
            a = np.radians(v); c, s_ = np.cos(a), np.sin(a)
            M = np.array([[.213 + c * .787 - s_ * .213, .715 - c * .715 - s_ * .715, .072 - c * .072 + s_ * .928],
                          [.213 - c * .213 + s_ * .143, .715 + c * .285 + s_ * .140, .072 - c * .072 - s_ * .283],
                          [.213 - c * .213 - s_ * .787, .715 - c * .715 + s_ * .715, .072 + c * .928 + s_ * .072]])
            rgb = rgb @ M.T
        elif fn == 'sepia':
            M = np.array([[.393 + .607 * (1 - v), .769 - .769 * (1 - v), .189 - .189 * (1 - v)], [.349 - .349 * (1 - v), .686 + .314 * (1 - v), .168 - .168 * (1 - v)], [.272 - .272 * (1 - v), .534 - .534 * (1 - v), .131 + .869 * (1 - v)]])
            rgb = rgb @ M.T
        rgb = np.clip(rgb, 0, 1)
    out = arr.copy(); out[..., :3] = np.round(rgb * 255).astype(np.uint8); return out

combos = lambda d: json.load(open(f'{d}/veri/kombinasyonlar.json', encoding='utf-8'))
def view(d, M, C, nm, lin):
    """Görünüşün oyundaki hâli: boya çıktısı (yoksa ham jeton) + görünüm filtresi (lineageLook) + yedek filtre."""
    for c in C:
        a = c['avatar']
        if a['src'] != f'characters/{nm}.webp' or (a.get('look') or {}).get('lineageId') != lin: continue
        base = np.asarray(Image.open(f"public/{a['src']}").convert('RGBA'))
        f = ((c.get('look') or {}).get('filter') or '')
        if a.get('tint'):
            m = next((v for v in M.values() if v['src'] == a['src'] and v['tint'] == a['tint']), None)
            k = next((kk for kk, v in M.items() if v is m), None)
            if m and m['png']: base = png(d, k)
            if m and m['fb']: f = (f + ' ' + m['fb']).strip()
        return css(base, f) if f else base
    return None
CO, CS = combos(ONCE), combos(SONRA)
ORNEK = lambda r: [f'{r}-erkek-barbarian-GR', f'{r}-kadin-bard-GR', f'{r}-male-fighter']
ten = json.load(open('data/soy-ten-renkleri.json', encoding='utf-8'))['soylar']
S = 128
def tile(arr):
    bg = Image.new('RGBA', (arr.shape[1], arr.shape[0]), (62, 64, 74, 255)); bg.alpha_composite(Image.fromarray(arr))
    return bg.convert('RGB').resize((S, S), Image.NEAREST)
for r in IRK:
    rows = [k for k in ten if k.startswith(r + '/') and ten[k]]
    page = Image.new('RGB', (S * 6 + 40, (S + 16) * len(rows) + 22), (24, 24, 30)); d = ImageDraw.Draw(page)
    d.text((4, 4), f'{r}: satir = soy; jeton basina once | sonra (once = eski cizim: butun-jeton filtresi ya da eski boya)', fill=(240, 230, 200))  # PIL varsayılan yazı tipi ASCII
    for i, key in enumerate(rows):
        y = 22 + i * (S + 16); lin = key.split('/')[1]
        d.text((4, y), f'{key} {ten[key]}', fill=(255, 220, 150))
        for j, nm in enumerate(ORNEK(r)):
            a, b = view(ONCE, mo, CO, nm, lin), view(SONRA, ms, CS, nm, lin)
            x = j * (2 * S + 12)
            if a is not None: page.paste(tile(a), (x, y + 14))
            if b is not None: page.paste(tile(b), (x + S + 2, y + 14))
    page.save(f'{OUT}/{r}.png')
json.dump(sonuc, open(f'{OUT}/kanit.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(sonuc, ensure_ascii=False, indent=1))
