"""Dragonborn pul deseni v2 (yalnız önizleme: docs/sabah/dragonborn-desen-v2/; public/ ve data/ değişmez).
`python scripts/dragonborn-desen-v2.py`
A) Maske: jetonun kendi başından ten tonu (Lab hue/kroma) örneklenir; tene yakın pikseller aday, 3×3 kapama, küçük bileşen atma,
   kapalı delik doldurma (parlama). Boyanan yalnız açık/ten pikseli (koyu kontur, göz, ağız, sıcak/doygun piksel hariç); içeri çekme yok.
B) Boyama: parlaklığı koruyan ton + doygunluk (Lab: L* tenin ortancasına göre farkıyla hedef orta tona taşınır, h/C hedefin).
C) Doku: pul karosu (v1 geometrisi, pul 8 px) yalnız ±L* modülasyonu; Gümüş/Beyaz'da koyulaştırma yönünde.
D) Önce (oyundaki çarpma filtresi) / sonra; 256 px ve 64/96 px; 6 jeton × 10 soy.
`--tam`: 264 jeton × 10 soy kontak sayfaları (tam/<soy>-NN.webp, 4 sütun, 256 px, şüpheliler kırmızı çerçeve), tam/savas-64.webp, tam/suphe.json.
Yoldaş (yavru ejderha) başı göz kümesinden bulunup maskeden çıkarılır (drop_companion)."""
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
P = {'konturL': 42, 'tonFark': 16, 'cAlt': 0.3, 'cUst': 2.4, 'beyazL': 88, 'beyazC': 8, 'minBilesen': 40, 'bilesenL': 62, 'delik': 160, 'yoldasY': 0.3, 'yoldasUzak': 45, 'yoldasR': 45, 'gozHalka': 0.25,
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
    """8-bağlı bileşenler (satır parçaları + birleşim kümesi; saf numpy/Python, scipy gerektirmez). Her bileşen (N, 2) [y, x] dizisi."""
    runs = []                                                     # (y, x0, x1) kapalı aralık
    for y in range(m.shape[0]):
        r = m[y].astype(np.int8); d = np.diff(np.concatenate([[0], r, [0]]))
        st, en = np.nonzero(d == 1)[0], np.nonzero(d == -1)[0] - 1
        runs.extend((y, a_, b_) for a_, b_ in zip(st, en))
    par = list(range(len(runs)))
    def find(i):
        while par[i] != i: par[i] = par[par[i]]; i = par[i]
        return i
    prev, j = [], 0
    for i, (y, a_, b_) in enumerate(runs):
        if i and runs[i - 1][0] != y:
            prev = [k for k in range(j, i) if runs[k][0] == y - 1]; j = i
        elif i == 0: prev = []
        for k in prev:
            if runs[k][1] <= b_ + 1 and runs[k][2] >= a_ - 1:
                ra, rb = find(i), find(k)
                if ra != rb: par[ra] = rb
    groups = {}
    for i, (y, a_, b_) in enumerate(runs): groups.setdefault(find(i), []).append((y, a_, b_))
    out = []
    for g in groups.values():
        ys = np.concatenate([np.full(b_ - a_ + 1, y) for y, a_, b_ in g]); xs = np.concatenate([np.arange(a_, b_ + 1) for y, a_, b_ in g])
        out.append(np.stack([ys, xs], 1))
    return out

def dil(m): p = np.pad(m, 1); return np.any([p[1 + dy:1 + dy + m.shape[0], 1 + dx:1 + dx + m.shape[1]] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], 0)
def ero(m): p = np.pad(m, 1, constant_values=True); return np.all([p[1 + dy:1 + dy + m.shape[0], 1 + dx:1 + dx + m.shape[1]] for dy in (-1, 0, 1) for dx in (-1, 0, 1)], 0)

def fill_holes(m):
    o = m.copy()
    for c in comps(~m):
        if not ((c[:, 0] == 0) | (c[:, 1] == 0) | (c[:, 0] == m.shape[0] - 1) | (c[:, 1] == m.shape[1] - 1)).any(): o[c[:, 0], c[:, 1]] = True
    return o

def drop_companion(keep, rgba, L, C, y0, y1, head):
    """Yoldaş (yavru ejderha vb.): göz = küçük doygun sıcak küme (4–80 px), çevresinin en az `gozHalka` payı maske, figürün üst
    `yoldasY` kısmında. Asıl başın ten örneği merkezinden `yoldasUzak` px'ten uzak göz yoldaşındır; o göze baş merkezinden daha yakın
    ve en çok `yoldasR` px uzaktaki maske pikselleri çıkarılır. Çıkarılan piksel sayısı döner."""
    eye = (rgba[..., 3] >= 128) & (L[..., 2] > 25) & (C > 35)
    hc = np.argwhere(head).mean(0); pets = []
    for c in comps(eye):
        if not 4 <= len(c) <= 80 or (c[:, 0].mean() - y0) / (y1 - y0) > P['yoldasY']: continue
        cm = np.zeros_like(keep); cm[c[:, 0], c[:, 1]] = True; ring = dil(dil(dil(cm))) & ~cm
        if (keep & ring).sum() / ring.sum() >= P['gozHalka'] and np.hypot(*(c.mean(0) - hc)) > P['yoldasUzak']: pets.append(c.mean(0))
    if not pets: return keep, 0
    yy, xx = np.mgrid[:keep.shape[0], :keep.shape[1]]; dh_ = np.hypot(yy - hc[0], xx - hc[1]); out = keep.copy()
    for pe in pets:
        dp = np.hypot(yy - pe[0], xx - pe[1]); out &= ~((dp < dh_) & (dp <= P['yoldasR']))
    return out, int(keep.sum() - out.sum())

def _kutular(shape, kutular):
    """Kutu [x0, y0, x1, y1] (uç hariç) ya da çokgen [[x, y], ...] listesi → ikili alan."""
    m = np.zeros(shape, bool)
    for k in kutular:
        if isinstance(k[0], (list, tuple)):
            im = Image.new('L', (shape[1], shape[0]), 0); ImageDraw.Draw(im).polygon([tuple(p) for p in k], fill=1); m |= np.array(im, bool)
        else:
            x0, y0, x1, y1 = k; m[y0:y1, x0:x1] = True
    return m

def _elle_ornek(rgba, ayar):
    """Kör topal maske (başta lavanta ten örneği olmayan jetonlar): `ornek` alanlarının ortanca Lab rengi ten sayılır; `alan` içinde
    a*b* farkı < `renkFark` (varsayılan 14) ve L* farkı < `parlakFark` (varsayılan 35) olan opak pikseller boyanır; 3×3 kapama, < 12 px
    bileşen atılır. Kontur ve göz/ağız gibi renge uzak pikseller kendiliğinden dışarıda kalır."""
    op = rgba[..., 3] >= 128; Lab = lab(rgba[..., :3].astype(float))
    s = _kutular(op.shape, ayar['ornek']) & op
    if s.sum() < 10: return None, {'neden': 'ten örneği alanı boş'}
    ref = np.median(Lab[s], 0)
    dab = np.hypot(Lab[..., 1] - ref[1], Lab[..., 2] - ref[2]); dL = np.abs(Lab[..., 0] - ref[0])
    alan = _kutular(op.shape, ayar['alan']) & op
    m = alan & (dab < ayar.get('renkFark', 14)) & (dL < ayar.get('parlakFark', 35))
    m = ero(dil(m)) & alan & (dL < ayar.get('parlakFark', 35))
    for c in comps(m):
        if len(c) < 12: m[c[:, 0], c[:, 1]] = False
    C = float(np.hypot(ref[1], ref[2]))
    return m, {'tonH': round(float((np.degrees(np.arctan2(ref[2], ref[1])) + 360) % 360), 1), 'tonC': round(C, 1), 'tenL': round(float(ref[0]), 1), 'boya': int(m.sum())}

def mask_of(rgba, ayar=None):
    """`ayar` (jeton başına düzeltme, data/dragonborn-pul-duzeltme.json): `P` eşik ezmesi, `beyazKutu` beyaz vurgu adayı yalnız bu
    kutularda ([x0, y0, x1, y1], 256 px, uç hariç), `yalniz` sonuç yalnız bu kutularda, `haric` sonuçtan çıkarılan kutular. Yoksa davranış aynen."""
    ayar = ayar or {}; P = {**globals()['P'], **ayar.get('P', {})}
    if 'ornek' in ayar: return _elle_ornek(rgba, ayar)
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
    if 'beyazKutu' in ayar: white &= _kutular(op.shape, ayar['beyazKutu'])
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
    keep, yoldas = drop_companion(keep, rgba, L, C, y0, y1, s)
    warm = (b > 0) & ((C > P['sicakC']) | (L[..., 0] < P['sicakL']))   # göz, ağız (doygun sıcak), boynuz (sarımsı gri); dövme kenarındaki açık hale boyanır
    paint = keep & op & (L[..., 0] > P['konturL']) & ~warm & (C <= c0 * P['cUst'] + 6)
    if 'yalniz' in ayar: paint &= _kutular(op.shape, ayar['yalniz'])
    if 'haric' in ayar: paint &= ~_kutular(op.shape, ayar['haric'])
    return paint, {'tonH': round(h0, 1), 'tonC': round(c0, 1), 'tenL': round(l0, 1), 'boya': int(paint.sum()), 'atilan': int(dropped), 'yoldas': int(yoldas)}

# ---- renk kapısı (pul v2 kapanışı): maskeyi renk bölgelerine ayırıp yalnız ejderha derisine yakın bölgeleri tutar ----
KAPI = {'tol': 8, 'ton': 12, 'kAlt': 0.4, 'kUst': 3.0, 'parlakL': 5, 'parlakK': 0.5, 'delik': 160, 'basKayip': 0.10, 'kotulesme': 0.005}

def _regions(mask, Lab, tol):
    """Maske içi renk bölgeleri: 4-komşu, Lab farkı < tol olan pikseller birleşir (kontur çizgisi ve renk sınırı bölgeleri ayırır)."""
    H, W = mask.shape; par = np.arange(H * W)
    def f(x):
        r = x
        while par[r] != r: r = par[r]
        while par[x] != r: par[x], x = r, par[x]
        return r
    for dy, dx in ((0, 1), (1, 0)):
        a = mask[:H - dy, :W - dx] & mask[dy:, dx:] & (np.linalg.norm(Lab[:H - dy, :W - dx] - Lab[dy:, dx:], axis=-1) < tol)
        for y, x in zip(*np.nonzero(a)):
            p, q = f(y * W + x), f((y + dy) * W + x + dx)
            if p != q: par[p] = q
    lab = np.full((H, W), -1)
    for y, x in zip(*np.nonzero(mask)): lab[y, x] = f(y * W + x)
    return lab

def renk_kapisi(rgba, info, m, k=KAPI):
    """Bölge ortalama rengi ten örneğine (info: tonH/tonC/tenL) yakın değilse bölge maskeden çıkar: ton farkı > `ton`, kroma oranı
    [`kAlt`, `kUst`] dışı ya da parlak (tenL + `parlakL` üstü) ve renksiz (kroma oranı < `parlakK`). Kapının açtığı, kalan maskeyle
    çevrili ≤ `delik` px delikler (ten vurgusu) geri konur. 33 el yamalı jetonda (etiket) ten %96 korunur, taşmanın ~%36'sı kesilir."""
    Lab = lab(rgba[..., :3].astype(float)); rl = _regions(m, Lab, k['tol']); keep = np.zeros_like(m)
    for r in np.unique(rl[rl >= 0]):
        q = rl == r; a = Lab[..., 1][q].mean(); b = Lab[..., 2][q].mean()
        dh = abs(((np.degrees(np.arctan2(b, a)) + 360) % 360 - info['tonH'] + 180) % 360 - 180); c = np.hypot(a, b) / info['tonC']
        dL = float(np.median(Lab[..., 0][q])) - info['tenL']
        if dh <= k['ton'] and k['kAlt'] <= c <= k['kUst'] and not (dL > k['parlakL'] and c < k['parlakK']): keep |= q
    for c in comps(m & ~keep):
        cm = np.zeros_like(m); cm[c[:, 0], c[:, 1]] = True; ring = dil(cm) & ~cm
        if len(c) <= k['delik'] and (keep[ring] | ~m[ring]).all() and keep[ring].mean() > 0.6: keep |= cm
    return keep

def tasma_tahmini(rgba, info, m):
    """Bağımsız taşma tahmini (kapıdan ayrı ölçüt): baş bandı (figürün üst %30'u) dışında parlak renksiz (beyaz kumaş/metal: kroma
    < 0,35 × ten kroması ve ten L*'ından açık) ya da ton dışı renkli (ton farkı > 20°, kroma > 3) maske piksellerinin oranı; ve baş
    bandındaki maske pikseli sayısı (kapının ten kaybını ölçmek için). Etiketli 33 jetonda gerçek taşmayla korelasyon 0,52."""
    Lab = lab(rgba[..., :3].astype(float)); C = np.hypot(Lab[..., 1], Lab[..., 2])
    dh = np.abs(((np.degrees(np.arctan2(Lab[..., 2], Lab[..., 1])) + 360) % 360 - info['tonH'] + 180) % 360 - 180)
    op = rgba[..., 3] >= 128; ys = np.nonzero(op)[0]; y0, y1 = ys.min(), ys.max()
    head = np.zeros_like(op); head[y0:y0 + int((y1 - y0) * 0.3)] = True
    bad = ((C < 0.35 * info['tonC']) & (Lab[..., 0] > info['tenL'])) | ((dh > 20) & (C > 3))
    return float((m & bad & ~head).sum() / max(1, m.sum())), int((m & head).sum())

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

# ---- tam üretim (`--tam`): 264 jeton × 10 soy, şüpheliler yalnız işaretlenir (hiçbir jeton dışarıda bırakılmaz) ----
TAM = os.path.join(OUT, 'tam')
SUPHE = {'tenDisiPx': 60, 'acikPx': 100, 'acikBilesen': 60, 'kucukAdet': 12, 'kucukPx': 25}
SUPHE_AD = {'MY': 'maske yok (başta ten örneği bulunamadı; boyanmadı)', 'TD': 'ten tonu dışı boyalı parça (kıyafet/eşya/diş olabilir)',
            'AB': 'boyanmamış açık bölge maskeye bitişik (kanat zarı/kıyafet olabilir)', 'KP': 'çok sayıda küçük ayrık boyalı parça',
            'YO': 'yoldaş (yavru ejderha) maskeden çıkarıldı; kalıntı olabilir', 'GI': '6 jetonluk incelemede görülen sızıntı (kemer, kılıç ağzı)'}
GORULEN = {'kadin-fighter-ID4': 'GI', 'erkek-ranger-ID4': 'GI'}   # v2 6 jeton incelemesi (README): yalnız işaret, maske değişmez

def all_tokens():
    return sorted(f[11:-5] for f in os.listdir(CHAR) if f.startswith('dragonborn-') and f.endswith('.webp') and ('-erkek-' in f or '-kadin-' in f))

def suspects(rgba, m, info):
    """Jeton başına şüphe kodları ve ölçüleri (yalnız rapor; maskeyi değiştirmez)."""
    if m is None: return ['MY'], {}
    L = lab(rgba[..., :3].astype(float)); a, b = L[..., 1], L[..., 2]; C = np.hypot(a, b); h = (np.degrees(np.arctan2(b, a)) + 360) % 360
    inh = (np.abs((h - info['tonH'] + 180) % 360 - 180) <= P['tonFark']) & (C >= info['tonC'] * P['cAlt'])
    cs = comps(m)
    off = sum(len(c) for c in cs if len(c) >= 15 and inh[c[:, 0], c[:, 1]].mean() < 0.4)
    small = sum(1 for c in cs if len(c) < SUPHE['kucukPx'])
    light = (rgba[..., 3] >= 128) & ~m & (L[..., 0] > 70) & (C < 10) & (b <= 0); near = dil(dil(m))
    unp = sum(len(c) for c in comps(light) if len(c) >= SUPHE['acikBilesen'] and near[c[:, 0], c[:, 1]].any())
    k = []
    if off >= SUPHE['tenDisiPx']: k.append('TD')
    if unp >= SUPHE['acikPx']: k.append('AB')
    if small >= SUPHE['kucukAdet']: k.append('KP')
    if info.get('yoldas'): k.append('YO')
    return k, {'tenDisiPx': int(off), 'acikPx': int(unp), 'kucukAdet': int(small)}

def tam():
    os.makedirs(TAM, exist_ok=True)
    tab, _ = renk.table(); t = v1.tile(8); names = all_tokens(); data = {}
    for n in names:
        rgba = np.array(Image.open(os.path.join(CHAR, f'dragonborn-{n}.webp')).convert('RGBA')); m, info = mask_of(rgba)
        k, olc = suspects(rgba, m, info)
        if n in GORULEN: k.append(GORULEN[n])
        data[n] = (rgba, m, info, k, olc)
    C4, R8, CELL, NAME = 4, 8, 256, 22
    for soy in SOYLAR:
        for p0 in range(0, len(names), C4 * R8):
            chunk = names[p0:p0 + C4 * R8]; rows = -(-len(chunk) // C4)
            pg = Image.new('RGB', (C4 * CELL, rows * (CELL + NAME)), tuple(BG)); dr = ImageDraw.Draw(pg)
            for i, n in enumerate(chunk):
                rgba, m, info, k, _ = data[n]; x, y = (i % C4) * CELL, (i // C4) * (CELL + NAME)
                pg.paste(on_bg(paint(rgba, m, tab[soy], soy, t) if m is not None else rgba), (x, y))
                if k: dr.rectangle([x + 1, y + 1, x + CELL - 2, y + CELL - 2], outline=(235, 50, 50), width=3)
                dr.text((x + 4, y + CELL + 3), n + ('  [' + ','.join(k) + ']' if k else ''), fill=(240, 110, 110) if k else (225, 228, 235), font=v1.FONT)
            pg.save(os.path.join(TAM, f'{soy}-{p0 // (C4 * R8) + 1:02d}.webp'), quality=90, method=6)
        print('soy', soy, flush=True)
    # savaş boyutu (64 px): satır = jeton, sütun = orijinal + 10 soy; iki blok yan yana
    S, NW, half = 64, 210, -(-len(names) // 2)
    bw = NW + 11 * S + 20; pg = Image.new('RGB', (2 * bw, 24 + half * (S + 2)), tuple(BG)); dr = ImageDraw.Draw(pg)
    for bl in range(2):
        for c, hd in enumerate(['orijinal'] + [SOY_TR[x].split(' ')[0] for x in SOYLAR]): dr.text((bl * bw + NW + c * S + 2, 4), hd[:8], fill=(230, 232, 238), font=v1.FONT)
    for i, n in enumerate(names):
        rgba, m, info, k, _ = data[n]; bx, y = (i // half) * bw, 24 + (i % half) * (S + 2)
        dr.text((bx + 4, y + 24), n + (' [' + ','.join(k) + ']' if k else ''), fill=(240, 110, 110) if k else (225, 228, 235), font=v1.FONT)
        pg.paste(on_bg(rgba, S), (bx + NW, y))
        for c, soy in enumerate(SOYLAR): pg.paste(on_bg(paint(rgba, m, tab[soy], soy, t) if m is not None else rgba, S), (bx + NW + (c + 1) * S, y))
        if k: dr.rectangle([bx + NW, y, bx + NW + 11 * S - 1, y + S - 1], outline=(235, 50, 50), width=2)
    pg.save(os.path.join(TAM, 'savas-64.webp'), quality=90, method=6)
    rep = {n: {'suphe': k, **olc, **{kk: vv for kk, vv in info.items()}} for n, (_, _, info, k, olc) in data.items()}
    json.dump({'not': 'scripts/dragonborn-desen-v2.py --tam: jeton başına şüphe kodları ve maske ölçümü. Kodlar: ' + '; '.join(f'{a} = {b}' for a, b in SUPHE_AD.items()),
               'esikler': SUPHE, 'jetonlar': rep}, open(os.path.join(TAM, 'suphe.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    print('şüpheli', sum(1 for v in rep.values() if v['suphe']), '/', len(rep))

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    if '--tam' in sys.argv: tam(); sys.exit()
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
