#!/usr/bin/env python3
"""KESIM-DUZELT (2026-11-22): jetonları düzeltilmiş şerit silmeyle (`toplu-kesim.py` `grid_lines`, `drop_lines`, `trim_lines`) ham
sayfadan yeniden keser ve ölçer. Kesim `cc-kesim.py`/`toplu-kesim.py`'nin KENDİ ayıklamasıyla (kaynağa göre: sınıf sayfası, hale tabanı
üçte bir hücre, düzeltme figürü, gövde, ızgara, tek figür); yerleşim:
  eski    eski jetona alt piksel kayıt (ölçek x/y, öteleme) + yalnız geri gelen pikseller eklenir (eski pikseller değişmez; kesim yarığı,
          silinmiş kontur/taban/kanat kenarı geri gelir). Maske eski kesimle hizalı kalır, yalnız eklenen pikseller maskesizdir.
  sayfa   sayfa ölçeği (`cc.sheet_scale` ya da `olcekHedef`: sayfanın ortanca figürü verilen boya) + `tk.render` (yanlış oranlı sayfa,
          kabul edilen yeni çizim).
  kardes  aynı ırk/cinsiyet/sınıf kardeşlerinin ortanca boyu (`cc.place_token`).
  sigdir  eski boy korunur, figür tuvale sığmıyorsa küçülür (`cc.place_token`; kesik şapka/kanat/kalkan).
Komutlar (depo kökünden; ham klasör `CC_HAM`, varsayılan assets-ham/karakter = wip/karakter-ham karakter/ + eksikler/ birleşik):
  python scripts/kesim-yenile.py olc [--n 200] [--tohum 20261122] [--eski <eski toplu-kesim.py>]   # regresyon (yazmaz)
  python scripts/kesim-yenile.py belirsiz [--eski <eski toplu-kesim.py>]                              # belirsiz yarık adayları (yazmaz)
  python scripts/kesim-yenile.py uygula [--kuru | --kurudan] [--is ad,...]                           # data/kesim-duzelt.json işleri
  python scripts/kesim-yenile.py maske                                                               # eski kesime ait kalan maskeler → belge
Çıktı: gorsel-dokum/kesim-duzelt/ (kontak sayfaları ve ölçü JSON'u; git dışı). Uygulamada eski jetonlar
public/characters/_yedek-kesim-2026-11-22/ altına kopyalanır (git dışı), defter data/cc-kesim-kaynak.json (kaynak `duzeltme`, not)."""
import glob, importlib.util, json, math, os, random, re, shutil, sys
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from scipy.signal import fftconvolve
from scipy.optimize import minimize

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
_s = importlib.util.spec_from_file_location('cc', 'scripts/cc-kesim.py'); cc = importlib.util.module_from_spec(_s); _s.loader.exec_module(cc)
tk = cc.tk
SIZE = 256
OUT = 'gorsel-dokum/kesim-duzelt'
YEDEK = 'public/characters/_yedek-kesim-2026-11-22'
ISLER = 'data/kesim-duzelt.json'
GEN_EN = {'erkek': 'male', 'kadin': 'female'}

def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

def load_tk(path):
    """Eski (karşılaştırma için) toplu-kesim modülü; `grid_lines` yoksa uyum katmanı: boş ızgara, `trim_lines` ızgara bağımsız."""
    s = importlib.util.spec_from_file_location('tk_eski', path); m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
    if not hasattr(m, 'grid_lines'):
        m.grid_lines = lambda img, layout=None: np.zeros(img.shape[:2], bool)
        _trim = m.trim_lines; m.trim_lines = lambda rgba, grid=None: _trim(rgba)
    return m

# ---------------------------------------------------------------------------------------------------------------- kaynak → kesici
BARD_SAYFA = {f: len(lst) for f, lst in cc.BARD}

def spec_of(dosya, hucre):
    """Defter kaydı (dosya, hücre) → kesici tanımı; desteklenmeyen kaynak (git ref, halka yerleşimi) → None."""
    if re.match(r'hale-gemini-sayfa-\d+\.png$', dosya): return {'kesici': 'ucte-bir', 'sayfa': dosya, 'hucre': hucre}
    if re.match(r'hale-gemini-duzeltme-sayfa-\d+\.jpg$', dosya): return {'kesici': 'duzeltme', 'sayfa': dosya, 'hucre': hucre}
    if dosya in BARD_SAYFA: return {'kesici': 'govde', 'sayfa': dosya, 'hucre': hucre, 'adet': BARD_SAYFA[dosya]}
    if re.match(r'barbarian-(fe)?male-aurasiz\.jpg$', dosya): return {'kesici': 'govde', 'sayfa': dosya, 'hucre': hucre, 'adet': 8}
    if dosya in cc.SORC_IZGARA: r, c = cc.SORC_IZGARA[dosya]; return {'kesici': 'izgara', 'sayfa': dosya, 'hucre': hucre, 'satir': r, 'sutun': c}
    m = re.match(r'gladiator-([a-z-]+)-(female|male)\.jpg$', dosya)
    if m: return {'kesici': 'figur', 'sayfa': dosya, 'hucre': hucre, 'adet': len(m.group(1).split('-'))}
    if dosya in cc.TEK.values(): return {'kesici': 'tek', 'sayfa': dosya, 'hucre': 1}
    m = re.match(r'(clerik|cleric|druid|fighter|warlock|gariban|barbarian|bard|monk|paladin|ranger|rogue|sorcerer)-', dosya)
    if m and os.path.splitext(dosya)[1] in ('.jpg', '.jpeg', '.png'):
        return {'kesici': 'sayfa', 'sayfa': dosya, 'hucre': hucre, 'duzen': {'clerik': 'cleric'}.get(m.group(1), m.group(1))}
    return None

_cache = {}
def kes(spec, mod=None):
    """→ (anahtarlı RGBA kırpık, sayfa kutusu (x0, y0, x1, y1)) ya da None. `mod`: kesimde kullanılacak toplu-kesim modülü (eski hat için)."""
    old_tk = cc.tk
    if mod is not None: cc.tk = mod
    try:
        t = mod or tk
        path = f'{cc.RAW}/{spec["sayfa"]}'; k = spec['kesici']; n = spec['hucre']
        key = (id(t), path, k, spec.get('duzen'), spec.get('adet'))
        if k == 'sayfa':
            if key not in _cache: _cache[key] = t.components_of_sheet(path, spec['duzen'])
            c = _cache[key].get(n)
            return None if c is None or any(w.startswith('ELLE:') for w in c[2]) else (c[0], c[1])
        if k == 'ucte-bir':
            if key not in _cache:
                a = np.asarray(Image.open(path).convert('RGB')); _cache[key] = (a, cc.key_page(a), t.grid_lines(a, (3, 3)))
            a, fg, G = _cache[key]
            return cc.taban_cell(a, fg, G, n)
        if k == 'duzeltme':
            if key not in _cache: _cache[key] = cc.duzeltme_figures(path)
            a, fg, G, lab, order = _cache[key]
            if n > len(order): return None
            i, (x0, y0, x1, y1), _, _ = order[n - 1]
            m = (lab[y0:y1, x0:x1] == i) & fg[y0:y1, x0:x1]
            return cc.keyed_rgba(a[y0:y1, x0:x1], m, G[y0:y1, x0:x1]), (x0, y0, x1, y1)
        if k in ('govde', 'figur', 'izgara'):
            if key not in _cache:
                _cache[key] = (cc.cut_bodies(path, spec['adet']) if k == 'govde' else cc.cut_figures(path, spec['adet']) if k == 'figur'
                               else cc.cut_grid(path, spec['satir'], spec['sutun']))[0]
            out = _cache[key]
            if n > len(out) or out[n - 1] is None: return None
            return out[n - 1][0], out[n - 1][1]
        if k == 'tek':
            if key not in _cache: _cache[key] = cc.tek_figure(path)
            return _cache[key]
    finally:
        cc.tk = old_tk
    return None

# ---------------------------------------------------------------------------------------------------------------- yerleşim
def render_map(crop, sx, sy, ox, oy):
    """Kırpığı jeton tuvaline (256) eşler: tuval = o + s · kırpık (sürekli koordinat; `tk.render` ile aynı uzlaşım). LANCZOS, ön-çarpımlı."""
    h, w = crop.shape[:2]
    bx0, by0, bx1, by1 = -ox / sx, -oy / sy, (SIZE - ox) / sx, (SIZE - oy) / sy
    P = int(math.ceil(max(0, -bx0, -by0, bx1 - w, by1 - h))) + 4
    pad = np.zeros((h + 2 * P, w + 2 * P, 4), np.uint8); pad[P:P + h, P:P + w] = crop
    pad[..., :3][pad[..., 3] == 0] = 0
    im = Image.fromarray(pad, 'RGBA').resize((SIZE, SIZE), Image.LANCZOS, box=(bx0 + P, by0 + P, bx1 + P, by1 + P))
    return np.array(im)

def _pm(a):
    f = a.astype(float); return np.dstack([f[..., :3] * f[..., 3:4] / 255.0, f[..., 3]])

def register(crop, tok):
    """Kırpığı eski jetona kaydeder: (sx, sy, ox, oy, kayıp, iou). Önce alfa ilintisiyle (FFT) kaba ölçek/öteleme, koordinat inişi, sonra
    ön-çarpımlı RGBA farkının karesini en küçükleyen sınırlı Nelder–Mead (ölçek ±%4, öteleme ±4 px). Doğrulama: eski hattı birebir yeniden
    üretilebilen bir Warlock jetonunda kesin dönüşümden sapma ≤ 0,02 px."""
    A = crop[..., 3].astype(float) / 255; T = tok[..., 3].astype(float) / 255
    ya, xa = np.where(A > 0.5); yt, xt = np.where(T > 0.5)
    if not len(ya) or not len(yt): return None
    sh = (yt.max() - yt.min() + 1) / (ya.max() - ya.min() + 1); sw = (xt.max() - xt.min() + 1) / (xa.max() - xa.min() + 1)
    best = None; Tn = math.sqrt((T * T).sum())
    for s in np.arange(min(sh, sw) * 0.92, max(sh, sw) * 1.08, min(sh, sw) * 0.004):
        nw, nh = max(1, round(A.shape[1] * s)), max(1, round(A.shape[0] * s))
        As = np.asarray(Image.fromarray((A * 255).astype(np.uint8)).resize((nw, nh), Image.BILINEAR)).astype(float) / 255
        cor = fftconvolve(T, As[::-1, ::-1], mode='full')
        iy, ix = np.unravel_index(int(np.argmax(cor)), cor.shape)
        sc = cor[iy, ix] / (Tn * math.sqrt((As * As).sum()) + 1e-9)
        if best is None or sc > best[0]: best = (sc, nw / A.shape[1], nh / A.shape[0], ix - (nw - 1), iy - (nh - 1))
    _, sx, sy, ox, oy = best
    tp = _pm(tok)
    def loss(p):
        r = render_map(crop, *p); u = (tok[..., 3] > 0) | (r[..., 3] > 0)
        return float(np.abs(_pm(r) - tp)[u].mean()) if u.any() else 1e9
    p = [sx, sy, float(ox), float(oy)]; cur = loss(p)
    for it in range(3):
        do, ds = 0.5 / 2 ** it, 0.003 / 2 ** it
        for j, d in ((2, do), (3, do), (0, ds * p[0]), (1, ds * p[1])):
            for k in (-2, -1, 1, 2):
                q = list(p); q[j] += k * d; v = loss(q)
                if v < cur: cur, p = v, q
    def loss2(q):
        r = render_map(crop, q[0] / 100, q[1] / 100, q[2], q[3]); u = (tok[..., 3] > 0) | (r[..., 3] > 0)
        return float(((_pm(r) - tp) ** 2)[u].mean()) if u.any() else 1e12
    x0 = np.array([p[0] * 100, p[1] * 100, p[2], p[3]])
    bnd = [(x0[0] * 0.96, x0[0] * 1.04), (x0[1] * 0.96, x0[1] * 1.04), (x0[2] - 4, x0[2] + 4), (x0[3] - 4, x0[3] + 4)]
    res = minimize(loss2, x0=x0, method='Nelder-Mead', bounds=bnd, options={'xatol': 1e-3, 'fatol': 1e-4, 'maxfev': 600})
    p = [res.x[0] / 100, res.x[1] / 100, float(res.x[2]), float(res.x[3])]; cur = loss(p)
    r = render_map(crop, *p)
    a1, a2 = r[..., 3] > 127, tok[..., 3] > 127
    return (*p, cur, float((a1 & a2).sum() / max(1, (a1 | a2).sum())))

def merge_restore(old, new, grow=2, lo=32, hi=128, min_px=4):
    """Eski jetona yalnız geri gelen pikseller eklenir: yeni ≥ hi, eski < lo olan (≥ min_px bağlı) çekirdek ve `grow` px çevresinde yeni
    alfa eskiden yüksekse yeni piksel. Başka hiçbir piksel değişmez. → (sonuç, eklenen çekirdek px)."""
    add = (new[..., 3] >= hi) & (old[..., 3] < lo)
    if not add.any(): return old.copy(), 0
    lab, n = ndi.label(add, structure=np.ones((3, 3))); sz = np.bincount(lab.ravel(), minlength=n + 1)
    # İki hattın anahtarlama farkı eski siluet boyunca 1 px'lik kenar bırakır: eklenen parça ya en az bir 2×2 dolu blok içerir (yarık,
    # kontur şeridi) ya da eski siluete yapışık değildir (yay kirişi, zincir gibi ince çıkıntı); siluete yapışık ince kenar eklenmez.
    blok = np.bincount(lab[ndi.binary_opening(add, structure=np.ones((2, 2), bool))].ravel(), minlength=n + 1)
    yap = np.bincount(lab[ndi.binary_dilation(old[..., 3] >= hi) & add].ravel(), minlength=n + 1)
    add = np.isin(lab, [i for i in range(1, n + 1) if sz[i] >= min_px and (blok[i] > 0 or yap[i] < 0.6 * sz[i])])
    if not add.any(): return old.copy(), 0
    reg = ndi.binary_dilation(add, iterations=grow)
    out = old.copy(); take = reg & (new[..., 3] > old[..., 3]); out[take] = new[take]
    cl = tk.clean_edges(out.copy())
    out[reg] = cl[reg]   # zemin renkli kenar pikseli (eklenen bölgede) temizlenir
    return out, int(add.sum())

def drop_detached_lines(old, out, lo=32):
    """KESIM-TEPE (`cizgiSuz` işi): eklenen piksellerden eski siluete DEĞMEYEN (1 px komşulukta) parçalar geri alınır, eğer
    ince ve uzunsa (ızgara/çerçeve çizgisi artığı, renk fark etmez: kalınlık ≤ 10 px, uzunluk ≥ 12 px, en/boy ≥ 3) ya da küçük
    (< 120 px) ve koyuysa (çizgi kırıntısı: ortalama en parlak kanal < 90). Siluete bağlı kontur (saç tepesi, kalkan kenarı) ve kopuk
    parlak parçalar (kıvılcım, yıldız) kalır. → (sonuç, silinen px)."""
    added = (out[..., 3] >= lo) & (old[..., 3] < lo)
    if not added.any(): return out, 0
    touch = ndi.binary_dilation(old[..., 3] >= lo, structure=np.ones((3, 3)))
    lab, n = ndi.label(added, structure=np.ones((3, 3))); res = out.copy(); gone = 0
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        m = lab[sl] == i
        if (touch[sl] & m).any(): continue
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        px = out[sl][m][:, :3].astype(int)
        thin = min(h, w) <= 10 and max(h, w) >= 12 and max(h, w) >= 3 * min(h, w)
        if thin or (int(m.sum()) < 120 and px.max(1).mean() < 90):
            res[sl][m] = old[sl][m]; gone += int(m.sum())
    return res, gone

def lost_gain(old, new, lo=32, hi=128, min_px=4):
    """Eski opak (≥ hi) → yeni saydam (< lo) çekirdek (kayıp) ve tersi (kazanç); ≥ min_px bağlı bileşenler (1 px kenar gürültüsü sayılmaz)."""
    def core(m):
        lab, n = ndi.label(m, structure=np.ones((3, 3))); sz = np.bincount(lab.ravel(), minlength=n + 1)
        return np.isin(lab, [i for i in range(1, n + 1) if sz[i] >= min_px]) if n else m
    return core((old[..., 3] >= hi) & (new[..., 3] < lo)), core((new[..., 3] >= hi) & (old[..., 3] < lo))

def bbox(a):
    ys, xs = np.where(a[..., 3] > 0)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1) if len(xs) else None

def comps_of(spec):
    key = (id(tk), f'{cc.RAW}/{spec["sayfa"]}', 'sayfa', spec['duzen'], None)
    if key not in _cache: _cache[key] = tk.components_of_sheet(key[1], spec['duzen'])
    return _cache[key]

def page_scale_target(spec, target_h):
    """Sayfanın bütün hücreleri: ortanca figür boyu `target_h` olacak ölçek (en büyük figür 240 / 252 sınırını aşmaz)."""
    comps = comps_of(spec)
    ok = {n: v for n, v in comps.items() if n <= len(tk.CLASSES[spec['duzen']][3]) and not any(w.startswith('ELLE') for w in v[2])}
    hs = [bbox(v[0])[3] - bbox(v[0])[1] for v in ok.values()]; ws = [bbox(v[0])[2] - bbox(v[0])[0] for v in ok.values()]
    return min(target_h / float(np.median(hs)), tk.FIG_H / max(hs), (SIZE - 4) / max(ws))

# ---------------------------------------------------------------------------------------------------------------- yarık ölçüsü
_jd = {}
def slit(a):
    """jeton-denetim.py'nin yarık ölçüsü (düz saydam yarık ≥ 10 px; örtüşme = yarığın iki yanı aynı parçanın devamı)."""
    if not _jd:
        src = open('scripts/jeton-denetim.py', encoding='utf-8').read()
        ns = {'np': np}; exec(compile(src[src.index('KAL = 6'):src.index('def cut_edges')], 'jd', 'exec'), ns); _jd.update(ns)
    op = a[..., 3] > 100; s = _jd['slit'](op)
    if not s or s[0] < 10: return None
    return {'uzunluk': int(s[0]), 'yon': s[1], 'satir': int(s[2]), 'bas': int(s[3]), 'ortusme': round(_jd['slit_class'](op, s), 2)}

# ---------------------------------------------------------------------------------------------------------------- kontak
def on_bg(a, col=(58, 63, 74)):
    bg = Image.new('RGBA', (a.shape[1], a.shape[0]), col + (255,)); bg.alpha_composite(Image.fromarray(a, 'RGBA')); return bg.convert('RGB')

def raw_tile(spec, box, px=200):
    if box is None: return Image.new('RGB', (px, px), (40, 40, 44))
    im = Image.open(f'{cc.RAW}/{spec["sayfa"]}').convert('RGB'); x0, y0, x1, y1 = box; m = 12
    t = im.crop((max(0, x0 - m), max(0, y0 - m), x1 + m, y1 + m)); t.thumbnail((px, px)); can = Image.new('RGB', (px, px), (40, 40, 44))
    can.paste(t, ((px - t.width) // 2, (px - t.height) // 2)); return can

def diff_tile(old, new, px=200):
    lost, gain = lost_gain(old, new)
    v = np.asarray(on_bg(new)).copy(); v = (v * 0.55).astype(np.uint8)
    v[gain] = (60, 255, 90); v[lost] = (255, 40, 40)
    return Image.fromarray(v).resize((px, px), Image.NEAREST)

def _font(size=12):
    from PIL import ImageFont
    for f in ('arial.ttf', 'DejaVuSans.ttf'):
        try: return ImageFont.truetype(f, size)
        except OSError: pass
    return ImageFont.load_default()

def contact(rows, path, title, px=200):
    """rows: [(etiket, satır altı not, [görseller])]; her satır: ham | eski | yeni | fark (yeşil eklenen, kırmızı kaybolan)."""
    if not rows: return
    cols = max(len(r[2]) for r in rows); W = cols * (px + 4) + 4; H = 22 + len(rows) * (px + 30); F = _font()
    im = Image.new('RGB', (W, H), (24, 27, 33)); d = ImageDraw.Draw(im); d.text((4, 4), title, fill=(235, 230, 220), font=F)
    for i, (lab, note, ims) in enumerate(rows):
        y = 22 + i * (px + 30)
        d.text((4, y), lab[:70], fill=(255, 255, 255), font=F); d.text((4 + 2 * (px + 4), y), note[:70], fill=(255, 210, 120), font=F)
        for j, t in enumerate(ims): im.paste(t.resize((px, px), Image.LANCZOS) if t.size != (px, px) else t, (4 + j * (px + 4), y + 14))
    os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, quality=90)

def tok_of(name):
    f = f'public/characters/{name}.webp'
    return np.array(Image.open(f).convert('RGBA')) if os.path.exists(f) else None

# ---------------------------------------------------------------------------------------------------------------- olc (regresyon)
def denetimde_adi_gecenler():
    t = open('harita/belgeler/JETON-DENETIM.md', encoding='utf-8').read()
    return set(re.findall(r'`([a-z]+-[A-Za-z0-9-]+)`', t))

def olc_one(item):
    """Tek jeton: yeni hatla kes, eski jetona kaydet, yeni hattın çıktısını (birleştirmesiz) eski jetonla karşılaştır."""
    name, spec, eski_path = item
    old = tok_of(name)
    res = {'jeton': name, 'kaynak': spec}
    try:
        c = kes(spec)
        if c is None: res['hata'] = 'figür bulunamadı/ELLE'; return res
        crop, box = c; reg = register(crop, old)
        if reg is None: res['hata'] = 'kayıt yok'; return res
        sx, sy, ox, oy, loss, iou = reg
        new = render_map(crop, sx, sy, ox, oy)
        lost, gain = lost_gain(old, new)
        res.update(kayit={'sx': round(sx, 5), 'sy': round(sy, 5), 'ox': round(ox, 3), 'oy': round(oy, 3), 'kayip': round(loss, 2), 'iou': round(iou, 4)},
                   kayipPx=int(lost.sum()), kazancPx=int(gain.sum()), kutu=[int(v) for v in box])
        if eski_path:
            co = kes(spec, load_tk_cached(eski_path))
            if co is not None:
                oldp = render_map(co[0], *reg[:4]) if co[1] == box else render_map(co[0], sx, sy, ox + (co[1][0] - box[0]) * sx, oy + (co[1][1] - box[1]) * sy)
                l2, g2 = lost_gain(oldp, new)
                res.update(eskiHatKayipPx=int(l2.sum()), eskiHatKazancPx=int(g2.sum()))
        res['_gorsel'] = (old, new, box)
    except Exception as e:
        res['hata'] = repr(e)
    return res

_tk_cache = {}
def load_tk_cached(p):
    if p not in _tk_cache: _tk_cache[p] = load_tk(p)
    return _tk_cache[p]

def olc_group(items):
    out = [olc_one(it) for it in items]; _cache.clear(); return out

def olc():
    n = int(arg('--n', 200)); seed = int(arg('--tohum', 20261122)); eski = arg('--eski')
    L = cc.ledger(); bad = denetimde_adi_gecenler()
    if os.path.exists(ISLER): bad |= {j['jeton'] for j in json.load(open(ISLER, encoding='utf-8'))['isler']}
    cand = []
    for name, j in sorted(L['jetonlar'].items()):
        w = j.get('kazanan')
        if not w or name in bad or not os.path.exists(f'public/characters/{name}.webp'): continue
        sp = spec_of(w['dosya'], w['hucre'])
        if sp and os.path.exists(f'{cc.RAW}/{sp["sayfa"]}'): cand.append((name, sp))
    rnd = random.Random(seed); pick = sorted(rnd.sample(cand, min(n, len(cand))))
    groups = {}
    for name, sp in pick: groups.setdefault(sp['sayfa'], []).append((name, sp, eski))
    with Pool(4) as p: res = [r for g in p.map(olc_group, list(groups.values()), chunksize=1) for r in g]
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for r in sorted(res, key=lambda r: -(r.get('kayipPx', 0) * 4 + r.get('kazancPx', 0))):
        if '_gorsel' in r:
            old, new, box = r.pop('_gorsel')
            if len(rows) < 60 and (r['kayipPx'] or r['kazancPx'] >= 8):
                rows.append((r['jeton'], f"kayıp {r['kayipPx']} kazanç {r['kazancPx']} iou {r['kayit']['iou']}", [raw_tile(r['kaynak'], tuple(box)), on_bg(old), on_bg(new), diff_tile(old, new)]))
    for k in range(0, len(rows), 15):
        contact(rows[k:k + 15], f'{OUT}/regresyon-{k // 15 + 1}.jpg', 'Regresyon (yazılmadı): ham | mevcut jeton | yeni hat (kayıtlı) | fark: yeşil eklenen, kırmızı kaybolan')
    json.dump({'aday': len(cand), 'secilen': len(pick), 'tohum': seed, 'sonuc': res}, open(f'{OUT}/regresyon.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ok = [r for r in res if 'hata' not in r]
    print(f'aday {len(cand)}, seçilen {len(pick)}, ölçülen {len(ok)}, hata {len(res) - len(ok)}')
    print('kayıp > 0:', sum(1 for r in ok if r['kayipPx']), ' kazanç > 0:', sum(1 for r in ok if r['kazancPx']), ' iou < 0,97:', [r['jeton'] for r in ok if r['kayit']['iou'] < 0.97])
    for r in sorted(ok, key=lambda r: -r['kayipPx'])[:15]: print('  ', r['jeton'], 'kayıp', r['kayipPx'], 'kazanç', r['kazancPx'], 'eski hat kayıp', r.get('eskiHatKayipPx'), r['kayit'])
    for r in res:
        if 'hata' in r: print('  HATA', r['jeton'], r['hata'])

# ---------------------------------------------------------------------------------------------------------------- uygula / belirsiz
def original(name):
    """Düzeltme öncesi jeton: yedekte varsa yedekten (yeniden çalıştırmada eski kesim kaynak kalır), yoksa public/characters."""
    f = f'{YEDEK}/{name}.webp'
    return np.array(Image.open(f).convert('RGBA')) if os.path.exists(f) else tok_of(name)

def race_median(race, gen, skip):
    hs = []
    for f in glob.glob(f'public/characters/{race}-{gen}-*.webp'):
        n = os.path.basename(f)[:-5]
        if n in skip: continue
        b = bbox(np.array(Image.open(f).convert('RGBA')))
        if b: hs.append(b[3] - b[1])
    return float(np.median(hs))

def place(j, crop, old, new_toks, skip):
    """İşin yerleşim kipine göre jeton (256 RGBA) ve ölçü notu."""
    mode = j['yerlesim']; info = {}
    if mode == 'eski':
        reg = register(crop, old); full = render_map(crop, *reg[:4])
        tok, added = merge_restore(old, full); info.update(kayit=[round(float(v), 4) for v in reg], eklenen=added)
        if j.get('cizgiSuz'): tok, info['cizgiSilinen'] = drop_detached_lines(old, tok)
        return tok, info
    if mode == 'sayfa':
        if j.get('olcekHedef') == 'irk':
            race, gen = j['jeton'].split('-')[:2]; th = race_median(race, gen, skip); sc = page_scale_target(j, th); info['hedefBoy'] = round(th, 1)
        else:
            sc, _ = cc.sheet_scale(comps_of(j), j['duzen'])
        tok, nh, shifted = tk.render(crop, tk.bbox(crop), sc, crop.shape[1] / 2); info['olcek'] = round(sc, 4)
        return np.array(tok), info
    if mode == 'kardes':
        stem = re.sub(r'ID\d+$', 'ID', j['jeton'])
        hs = [bbox(t)[3] - bbox(t)[1] for n, t in new_toks.items() if n.startswith(stem) and n != j['jeton']]
        if not hs:   # kardeşler bu çalıştırmada kesilmediyse diskteki güncel hâlleri
            hs = [bbox(np.array(Image.open(f).convert('RGBA')))[3] - bbox(np.array(Image.open(f).convert('RGBA')))[1]
                  for f in glob.glob(f'public/characters/{stem}*.webp') if os.path.basename(f)[:-5] != j['jeton']]
        th = float(np.median(hs)); tok, sc = cc.place_token(crop, th); info.update(kardesBoy=round(th, 1), olcek=sc)
        return tok, info
    if mode == 'sigdir':
        reg = register(crop, old); s = math.sqrt(reg[0] * reg[1]); b = tk.bbox(crop)
        th = min((b[3] - b[1]) * s, tk.FIG_H); tok, sc = cc.place_token(crop, th); info.update(eskiOlcek=round(s, 4), olcek=sc, hedefBoy=round(th, 1))
        return tok, info
    raise ValueError(mode)

def _hesapla(arg):
    """Paralel işçi: bir sayfanın kardeş olmayan işleri → [(ad, jeton, ölçü)] (jeton None = figür/eski jeton yok)."""
    grp, skip = arg; out = []
    for j in grp:
        old = original(j['jeton']); c = kes(j)
        if c is None or old is None: out.append((j['jeton'], None, None)); continue
        crop, box = c; tok, info = place(j, crop, old, {}, skip); info['kutu'] = [int(v) for v in box]
        out.append((j['jeton'], tok, info))
    _cache.clear(); return out

def uygula():
    """`--kuru`: yazmaz, sonuçlar gorsel-dokum/kesim-duzelt/kuru/<ad>.png + uygula-kuru.json; `--kurudan`: kuru sonuçlar (gözle bakılan)
    yeniden hesaplanmadan aynen yazılır. Kardeş olmayan işler sayfa başına paralel (4 süreç) hesaplanır."""
    kuru = '--kuru' in sys.argv; kurudan = '--kurudan' in sys.argv and not kuru; only = set((arg('--is') or '').split(',')) - {''}
    J = json.load(open(ISLER, encoding='utf-8'))
    isler = [j for j in J['isler'] if not only or j['jeton'] in only]
    isler.sort(key=lambda j: j['yerlesim'] == 'kardes')            # kardeş boyu önce yazılan kardeşlerden
    skip = {j['jeton'] for j in J['isler']}
    L = cc.ledger(); rep = {'adim': 'kesim-duzelt', 'yazilan': [], 'ezilmedi': [], 'hata': [], 'is': []}
    new_toks, rows, pre = {}, {}, {}
    if kurudan:
        kuruIs = {r['jeton']: r for r in json.load(open(f'{OUT}/uygula-kuru.json', encoding='utf-8'))['is']}
        for j in isler:
            kf = f'{OUT}/kuru/{j["jeton"]}.png'
            if j['jeton'] in kuruIs and os.path.exists(kf):
                info = {k: v for k, v in kuruIs[j['jeton']].items() if k in ('kayit', 'eklenen', 'hedefBoy', 'olcek', 'kardesBoy', 'eskiOlcek', 'kutu')}
                pre[j['jeton']] = (np.array(Image.open(kf).convert('RGBA')), dict(info, kurudan=True))
    else:
        groups = {}
        for j in isler:
            if j['yerlesim'] != 'kardes': groups.setdefault(j['sayfa'], []).append(j)
        with Pool(4) as p:
            for lst in p.map(_hesapla, [(g, skip) for g in groups.values()], chunksize=1):
                for name, tok, info in lst: pre[name] = (tok, info)
    if not kuru: os.makedirs(f'{YEDEK}/kucuk', exist_ok=True)
    for j in isler:
        name = j['jeton']; old = original(name)
        if name in pre: tok, info = pre[name]
        else:
            c = kes(j)
            if c is None or old is None: tok = info = None
            else: crop, box = c; tok, info = place(j, crop, old, new_toks, skip); info['kutu'] = [int(v) for v in box]
        if tok is None or old is None: rep['hata'].append(f'{name}: figür/eski jeton yok'); print('HATA', name); continue
        box = tuple(info['kutu'])
        kf = f'{OUT}/kuru/{name}.png'
        if kuru: os.makedirs(f'{OUT}/kuru', exist_ok=True); Image.fromarray(tok, 'RGBA').save(kf)
        new_toks[name] = tok
        lost, gain = lost_gain(old, tok)
        info.update(jeton=name, grup=j['grup'], yerlesim=j['yerlesim'], sayfa=j['sayfa'], hucre=j['hucre'], kayipPx=int(lost.sum()), kazancPx=int(gain.sum()),
                    yarikOnce=slit(old), yarikSonra=slit(tok), kenarSonra={'ust': int((tok[:2, :, 3] > 0).sum()), 'sol': int((tok[:, :2, 3] > 0).sum()), 'sag': int((tok[:, -2:, 3] > 0).sum())})
        rep['is'].append(info)
        ys = info['yarikOnce']; ya = info['yarikSonra']
        note = f"{j['yerlesim']} | yarık {ys['uzunluk'] if ys else 0}→{ya['uzunluk'] if ya else 0} | +{info['kazancPx']} -{info['kayipPx']}"
        rows.setdefault(j['grup'], []).append((f"{name}  ({j['sayfa']} h{j['hucre']})", note, [raw_tile(j, box), on_bg(old), on_bg(tok), diff_tile(old, tok)]))
        if not kuru:
            for src, dst in ((f'public/characters/{name}.webp', f'{YEDEK}/{name}.webp'), (f'public/characters/kucuk/{name}.webp', f'{YEDEK}/kucuk/{name}.webp')):
                if os.path.exists(src) and not os.path.exists(dst): shutil.copy2(src, dst)
            if cc.write_token(L, name, Image.fromarray(tok, 'RGBA'), 'duzeltme', j['sayfa'], j['hucre'], rep):
                L['jetonlar'][name]['gecmis'][-1]['not'] = (f"KESIM-TEPE 2026-11-23 ({j['yerlesim']})" if j['grup'] == 'tepe' else f"KESIM-DUZELT 2026-11-22 ({j['grup']}, {j['yerlesim']})")
        print(name, note)
    _cache.clear()
    os.makedirs(OUT, exist_ok=True)
    for g, rr in rows.items():
        for k in range(0, len(rr), 12):
            contact(rr[k:k + 12], f'{OUT}/uygula-{g}-{k // 12 + 1}.jpg', f'KESIM-DUZELT grup {g}: ham hücre | eski | yeni | fark (yeşil eklenen, kırmızı kaybolan)')
    json.dump(rep, open(f'{OUT}/uygula{"-kuru" if kuru else ""}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if not kuru: cc.save_ledger(L)
    print({k: len(v) for k, v in rep.items() if isinstance(v, list)})

def _belirsiz_grup(grp):
    out = []
    for b in grp:
        name = b['jeton']; r = {'jeton': name}
        old = tok_of(name); c = kes(b)
        if c is None or old is None: r['hata'] = 'figür/eski jeton yok'; out.append((r, None)); continue
        crop, box = c; reg = register(crop, old); full = render_map(crop, *reg[:4]); tok, added = merge_restore(old, full)
        s0, s1 = slit(old), slit(tok)
        r.update(eklenen=added, yarikOnce=s0, yarikSonra=s1, iou=round(reg[5], 4),
                 sonuc=('yarık kapandı' if s0 and not s1 else 'yarık kısaldı' if s0 and s1 and s1['uzunluk'] < s0['uzunluk'] else
                        'değişmedi' if added == 0 else 'piksel eklendi, yarık aynı' if s0 else 'piksel eklendi'))
        row = (f"{name}  ({b['sayfa']} h{b['hucre']})", f"{r['sonuc']} | +{added}", [raw_tile(b, box), on_bg(old), on_bg(tok), diff_tile(old, tok)]) if added else None
        out.append((r, row))
    _cache.clear(); return out

def belirsiz():
    """Belirsiz yarık adayları: yeni hatla kesip eski jetona kaydeder, yalnız geri gelen pikselleri ekler ve yarığın kapanıp kapanmadığını
    ölçer. Hiçbir şey yazılmaz."""
    J = json.load(open(ISLER, encoding='utf-8')); res, rows = [], []
    groups = {}
    for b in J['belirsiz']:
        if 'kapsamDisi' in b: res.append({'jeton': b['jeton'], 'kapsamDisi': b['kapsamDisi']})
        else: groups.setdefault(b['sayfa'], []).append(b)
    with Pool(4) as p:
        for lst in p.map(_belirsiz_grup, list(groups.values()), chunksize=1):
            for r, row in lst:
                res.append(r)
                if row: rows.append(row)
    order = {b['jeton']: i for i, b in enumerate(J['belirsiz'])}
    res.sort(key=lambda r: order[r['jeton']]); rows.sort(key=lambda x: order[x[0].split()[0]])
    for k in range(0, len(rows), 12): contact(rows[k:k + 12], f'{OUT}/belirsiz-{k // 12 + 1}.jpg', 'Belirsiz yarık adayları (YAZILMADI): ham | mevcut | yeni kesim (eklenen) | fark')
    json.dump(res, open(f'{OUT}/belirsiz.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    from collections import Counter
    print(Counter(r.get('sonuc') or ('kapsam dışı' if 'kapsamDisi' in r else 'hata') for r in res))

MASKE_MD = 'harita/belgeler/KESIM-DUZELT-MASKE-LISTESI.md'

def maske():
    """Yeniden kesilen jetonların maskeleri (bu görevde YENİDEN ÜRETİLMEDİ): hangi maske dosyası eski kesime ait kaldı → MASKE_MD.
    Girdi: data/kesim-duzelt.json, defter (KESIM-DUZELT notlu yazımlar), maske klasörleri; varsa gorsel-dokum/kesim-duzelt/uygula.json."""
    J = json.load(open(ISLER, encoding='utf-8')); L = cc.ledger()['jetonlar']
    rep = {r['jeton']: r for r in json.load(open(f'{OUT}/uygula.json', encoding='utf-8'))['is']} if os.path.exists(f'{OUT}/uygula.json') else {}
    kinds = [('maske', 'public/characters/maske/{}.png', 'otomatik ten maskesi'), ('maske-el', 'public/characters/maske-el/{}.png', 'elle maske'),
             ('soy-maske-el', 'assets/soy-maske-el/{}.png', 'elle maske kaynağı'), ('maske-pul', 'public/characters/maske-pul/{}.png', 'Dragonborn pul maskesi')]
    yazilan = [j for j in J['isler'] if any('KESIM-DUZELT' in g.get('not', '') for g in (L.get(j['jeton']) or {}).get('gecmis', []))]
    rows, tam, kismi, yok = [], [], [], []
    for j in yazilan:
        n = j['jeton']; have = [k for k, pat, _ in kinds if os.path.exists(pat.format(n))]
        if not have: yok.append(n); continue
        if j['yerlesim'] == 'eski':
            r = rep.get(n, {}); durum = f"kısmen eski: maske hizalı, eklenen {r.get('eklenen', '?')} px maskesiz"; kismi.append(n)
        else:
            durum = 'tamamen eski: yerleşim/ölçek değişti, maske kaymış'; tam.append(n)
        rows.append(f"| `{n}` | {j['grup']} | {j['yerlesim']} | {', '.join(have)} | {durum} |")
    L_ = ['# KESIM-DUZELT: maskesi eski kesime ait kalan jetonlar', '',
          f'Üretildi: `python scripts/kesim-yenile.py maske` (KESIM-DUZELT, 2026-11-22). Bu görevde maskeler **yeniden üretilmedi** (`npm run soy-maske`',
          'tam çalıştırılmadı; ayrı görev). Aşağıdaki jetonların kesimi değişti; maske dosyaları eski kesimden.', '',
          '- **tamamen eski** (yerleşim `sayfa`, `kardes`, `sigdir`: figürün ölçeği ya da konumu değişti): maske figürle hizalı değil; boyalı soyda',
          '  ten yanlış yere düşer. Bu jetonlar için maske yeniden üretilmeli (ayrı görev: otomatik maske `npm run soy-maske -- <ırk>` ırk süzgeciyle;',
          '  elle maske `assets/soy-maske-el/` kaynağı yeniden çizilir; Dragonborn pul `python scripts/dragonborn-pul-maske.py`).',
          '- **kısmen eski** (yerleşim `eski`: eski jetona kayıt, yalnız kesim yarığında silinmiş pikseller geri eklendi; eski pikseller aynen):',
          '  maske hizalı; yalnız eklenen pikseller (bilek, kabza, ayak tabanı, kontur, kanat kenarı) maskede yok. Eklenen pikselde ten varsa (bilek,',
          '  el) boyalı soyda o pikseller boyanmaz; maske yenilenince düzelir.', '',
          f'Toplam yeniden kesilen: {len(yazilan)}; maskesi olan: {len(rows)} (tamamen eski {len(tam)}, kısmen eski {len(kismi)}); maske dosyası olmayan '
          f'(soy filtresi ya da boyasız ırk): {len(yok)}.', '',
          '| Jeton | Grup | Yerleşim | Maske dosyaları | Durum |', '|---|---|---|---|---|'] + rows
    if yok: L_ += ['', 'Maske dosyası olmayanlar (değişiklik gerekmez): ' + ', '.join(f'`{n}`' for n in yok)]
    L_ += ['', 'Kanat kökü (`data/dragonborn-kanat-kok.json`) ve soy ölçümleri (`data/soy-olcum.json`, `data/soy-maske-rapor.json`) de jeton dosyasından',
           'üretilir; `eski` yerleşimde siluet değişmediği için kök geçerli, öteki yerleşimlerde ilgili üretici yeniden çalıştırılmalı (bu görevde çalıştırılmadı).']
    open(MASKE_MD, 'w', encoding='utf-8', newline='\n').write('\n'.join(L_) + '\n')
    print(MASKE_MD, len(yazilan), 'jeton; tamamen', len(tam), 'kısmen', len(kismi), 'maskesiz', len(yok))

def wzb2():
    """WZ-B2 altıgen kalkan (bütün ırklar; kullanıcı listesi "düz kesik kalkan"): yeni hatla kesilip eski jetona kaydedilir, yalnız geri gelen
    pikseller sayılır (yazılmaz). Kalkanın sağ kenarında (figür kutusunun sağ 40 px'i) eklenecek piksel yoksa kenar kesim kusuru değildir."""
    rows, res = [], []
    for f in sorted(glob.glob('public/characters/*-wizard-WZ-B2.webp')):
        name = os.path.basename(f)[:-5]; race, gen = name.split('-')[:2]
        pages = sorted(glob.glob(f'{cc.RAW}/wizard-{GEN_EN[gen]}-{race}-b.*'))
        if not pages: res.append([name, None, None]); continue
        spec = {'kesici': 'sayfa', 'sayfa': os.path.basename(pages[0]), 'duzen': 'wizard_b', 'hucre': 2}
        old = tok_of(name); c = kes(spec)
        if c is None: res.append([name, None, None]); continue
        crop, box = c; reg = register(crop, old); tok, added = merge_restore(old, render_map(crop, *reg[:4]))
        b = bbox(old); add = (tok[..., 3] > 127) & (old[..., 3] < 32); right = int(add[:, b[2] - 40:].sum())
        res.append([name, added, right])
        rows.append((name, f'eklenen {added}, sağ kenarda {right}', [raw_tile(spec, box), on_bg(old), on_bg(tok), diff_tile(old, tok)]))
        _cache.clear(); print(name, added, right)
    for k in range(0, len(rows), 10): contact(rows[k:k + 10], f'{OUT}/wzb2-dogrulama-{k // 10 + 1}.jpg', 'WZ-B2 doğrulama (YAZILMADI): ham | mevcut | yeni kesim (yalnız eklenen) | fark')
    note = ('Altıgen kalkanın sağ kenarı çizimde dikey ve düzdür (ham sayfada da öyle; koyu kahve konturu yerinde, ızgara çizgisine 35–60 px uzak). '
            'Jetonlar `wizard-kesim.py` ile kesildi (şerit silme yok); yeniden üretimi birebir (Human erkek: alfa farkı 0). Yeni hatla kesip kaydedince '
            'kalkanın sağ kenarına eklenecek piksel aşağıda: kesim kusuru yok, jetonlar değiştirilmedi.')
    json.dump({'not': note, 'sonuc': res}, open(f'{OUT}/wzb2.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

RAPOR_MD = 'harita/belgeler/KESIM-DUZELT.md'
GRUP_AD = {'a': 'kesim yarığı', 'b': 'yanlış oran (Gnome kadın / Halfling erkek Barbarian)', 'c': 'kesik şapka', 'd': 'düz kesik yan kanat/kalkan', 'e': 'eski Tiefling Druid kesimi'}
# Kontak sayfalarına bakılarak verilen notlar (gorsel-dokum/kesim-duzelt/uygula-*.jpg, belirsiz-*.jpg)
GOZ = {'celestial-female-wizard': 'kuşak ham çizimde macenta (zemin anahtarıyla aynı renk): anahtarlama siler, şerit silmeyle ilgisiz',
       'elf-kadin-druid-ID7': 'figür ile çizimdeki ince zemin çizgisi arası doğal boşluk',
       'human-kadin-bard-ID5': 'figür ile davul arası doğal boşluk',
       'dragonborn-kadin-bard-ID5': 'figür ile davul arası doğal boşluk',
       'gnome-kadin-cleric-ID1': 'sol kanat artık tuvalden taşmıyor; sağ kanat ham çizimde hücre sınırındaki ızgara çizgisine dek uzanıp orada biter (kaynak sınırı)',
       'celestial-kadin-cleric-ID3': 'yeni kesim jetonda bilerek silinmiş hale halkasını geri ekler: iyileşme değil',
       'celestial-kadin-fighter-GR': 'yeni kesim bilerek silinmiş haleyi geri ekler (başın üstünde): iyileşme değil',
       'celestial-kadin-rogue-ID9': 'yeni kesim bilerek silinmiş haleyi geri ekler (başın üstünde): iyileşme değil'}

def rapor():
    """Ölçü ve uygulama sonuçlarından belge: harita/belgeler/KESIM-DUZELT.md (gorsel-dokum/kesim-duzelt/*.json + data/kesim-duzelt.json)."""
    from collections import Counter
    J = json.load(open(ISLER, encoding='utf-8')); g = lambda f: json.load(open(f'{OUT}/{f}', encoding='utf-8')) if os.path.exists(f'{OUT}/{f}') else None
    reg, uyg, bel, wz, tara = g('regresyon.json'), g('uygula.json'), g('belirsiz.json'), g('wzb2.json'), g('tarama.json')
    L_ = ['# KESIM-DUZELT: şerit silme düzeltmesi ve yeniden kesim', '',
          'Üretildi: `python scripts/kesim-yenile.py rapor` (2026-11-22). Görsel kanıtlar `gorsel-dokum/kesim-duzelt/` (git dışı): `uygula-<grup>-<n>.jpg`',
          '(ham hücre | eski | yeni | fark: yeşil eklenen, kırmızı kaybolan), `regresyon-<n>.jpg`, `belirsiz-<n>.jpg`, `wzb2-dogrulama.jpg`. Eski jetonlar',
          f'`{YEDEK}/` (git dışı). Kural ve ölçüm ayrıntısı DECISIONS.md "KESIM-DUZELT"; maskeler `{MASKE_MD}`.', '']
    if tara:
        L_ += [f"Bütün jetonlarda düz yarık taraması (`python scripts/kesim-yarik-tara.py`, eşik 14 px; {tara['jeton']} jeton): aday {tara['once']} → **{tara['sonra']}**, "
               f"kopuk parçalı {tara['onceKopuk']} → **{tara['sonraKopuk']}** (kalanların çoğu doğal boşluk; belirsizler ve kapsam dışılar değiştirilmedi).", '']
    if uyg:
        iss = uyg['is']; by = Counter(r['grup'] for r in iss)
        L_ += ['## Yeniden kesilen jetonlar', '', f"Yazılan: **{len(uyg['yazilan'])}** jeton (hata {len(uyg['hata'])}, öncelikten ezilmeyen {len(uyg['ezilmedi'])}).", '',
               '| Grup | Jeton | Yerleşim | Sonuç |', '|---|---:|---|---|']
        for k in sorted(by):
            rr = [r for r in iss if r['grup'] == k]
            sl0 = sum(1 for r in rr if r.get('yarikOnce')); sl1 = sum(1 for r in rr if r.get('yarikSonra'))
            kn = sum(1 for r in rr if any(r['kenarSonra'].values()))
            ek = [r['eklenen'] for r in rr if 'eklenen' in r]
            note = f'yarık ölçüsü (≥ 10 px) önce {sl0} → sonra {sl1}; tuval kenarına değen {kn}' + (f'; eklenen piksel ortanca {int(np.median(ek))} (en çok {max(ek)})' if ek else '')
            L_.append(f"| {k}: {GRUP_AD[k]} | {len(rr)} | {', '.join(sorted({r['yerlesim'] for r in rr}))} | {note} |")
        L_ += ['', 'Yarık ölçüsü `jeton-denetim.py` ile aynı (düz saydam yarık ≥ 10 px; doğal boşluklar da girer). Ölçünün sonra da bulduğu yarık: aynı yerde ve',
               'yeni kesim hiç piksel eklemediyse kaynak ham çizim ya da renk anahtarıdır (şerit silme değil); başka yerde ve kısaysa belgelenen yarık',
               'kapanmış, ölçü doğal bir boşluğu (bacak arası, kol-gövde, dokunaç arası) buluyor. Hepsine kontak sayfasında bakıldı.', '',
               '| Jeton | Grup | Yerleşim | Kaynak | Yarık önce → sonra | Eklenen / fark | Not |', '|---|---|---|---|---|---|---|']
        for r in iss:
            a, b = r.get('yarikOnce'), r.get('yarikSonra')
            fark = f"+{r['eklenen']}" if 'eklenen' in r else f"+{r['kazancPx']} / −{r['kayipPx']} (yeniden yerleşim)"
            if r['jeton'] in GOZ: note = GOZ[r['jeton']]
            elif b and a and (a['yon'], a['satir']) == (b['yon'], b['satir']) and not r.get('eklenen'): note = 'aynı yer, piksel eklenmedi: ham çizim/anahtarlama'
            elif b: note = 'belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor' if a and (a['yon'], a['satir']) != (b['yon'], b['satir']) else 'doğal boşluk'
            else: note = ''
            L_.append(f"| `{r['jeton']}` | {r['grup']} | {r['yerlesim']} | {r['sayfa']} h{r['hucre']} | {a['uzunluk'] if a else 0} → {b['uzunluk'] if b else 0} | {fark} | {note} |")
    if J.get('kapsamDisi'):
        L_ += ['', '## Kapsam dışı (yeniden kesilmedi)', '', '| Jeton | Neden |', '|---|---|'] + [f"| `{k['jeton']}` | {k['neden']} |" for k in J['kapsamDisi']]
    if wz:
        L_ += ['', '## WZ-B2 altıgen kalkan (bütün ırklar): kesim kusuru yok', '', wz['not'], '', '| Jeton | Eklenecek piksel | Kalkanın sağ kenarında |', '|---|---:|---:|'] + \
              [f"| `{r[0]}` | {r[1]} | {r[2]} |" for r in wz['sonuc']]
    if reg:
        res = [r for r in reg['sonuc'] if 'hata' not in r]
        L_ += ['', '## Regresyon: 200 sağlam jeton (yalnız ölçü, hiçbiri yazılmadı)', '',
               f"Defterden (`data/cc-kesim-kaynak.json`) JETON-DENETIM'de adı geçmeyen ve ham sayfası bulunan {reg['aday']} jetondan rastgele {reg['secilen']} (tohum {reg['tohum']}).",
               'Her biri yeni hatla ham sayfadan kesildi, mevcut jetona alt piksel kaydedildi (Nelder–Mead) ve birleştirmesiz karşılaştırıldı; aynı kesim eski hatla',
               '(`toplu-kesim.py` 18a311bc öncesi) da yapıldı. Kayıp/kazanç: ≥ 4 px bağlı, eski opak (≥ 128) → yeni saydam (< 32) çekirdek ve tersi.', '',
               f"- Ölçülen: {len(res)}; hata: {len(reg['sonuc']) - len(res)}. Kaynak: " + ', '.join(f'{k} {v}' for k, v in Counter(r['kaynak']['kesici'] for r in res).items()) + '.',
               f"- **Eski hata göre figür pikseli kaybı: {sum(1 for r in res if r.get('eskiHatKayipPx', 0) > 0)} jeton.** Kazanç (geri gelen kontur, ayak tabanı, asa, kanat kenarı): {sum(1 for r in res if r.get('eskiHatKazancPx', 0) > 0)} jeton.",
               f"- Mevcut jetona göre kayıp: {sum(1 for r in res if r['kayipPx'] > 0)} jeton (" + ', '.join(f"{k} {v}" for k, v in Counter(r['kaynak']['kesici'] for r in res if r['kayipPx'] > 0).items()) +
               "); hepsinde eski hat da aynı pikselleri vermiyor: taban/düzeltme adımının `rescue`'su (git kaynağından geri konan iç kontur) ölçüye girmez. Uygulamada `eski` yerleşim eski pikselleri hiç silmez.",
               f"- Kayıt uyumu (IoU) en düşük: " + ', '.join(f"`{r['jeton']}` {r['kayit']['iou']}" for r in sorted(res, key=lambda r: r['kayit']['iou'])[:5]) + ' (kazancı en büyük olanlar).']
    if bel:
        cnt = Counter(r.get('sonuc') or ('kapsam dışı' if 'kapsamDisi' in r else 'hata') for r in bel)
        L_ += ['', '## Belirsiz yarık adayları (113; DEĞİŞTİRİLMEDİ, yalnız ölçü)', '',
               'Yeni hatla kesilip eski jetona kaydedildi, yalnız geri gelen pikseller eklenerek yarık yeniden ölçüldü. ' + ', '.join(f'{k}: {v}' for k, v in cnt.most_common()) + '.', '',
               'Uyarı: Celestial jetonlarının bir kısmında hale bilerek silinmiştir (yıldız tacı oyunda çizilir); ham sayfada hale olduğundan yeni kesim onu',
               'geri ekler. Bu adaylar "iyileşme" sayılmaz (Not sütunu); başka bir Celestial yeniden kesiminde de hale kaynağı denetlenmeli.', '',
               '| Jeton | Sonuç | Eklenecek piksel | Yarık önce → sonra | Not |', '|---|---|---:|---|---|']
        for r in bel:
            if 'kapsamDisi' in r: L_.append(f"| `{r['jeton']}` | kapsam dışı ({r['kapsamDisi']}) | | | |"); continue
            if 'hata' in r: L_.append(f"| `{r['jeton']}` | hata ({r['hata']}) | | | |"); continue
            a, b = r.get('yarikOnce'), r.get('yarikSonra')
            L_.append(f"| `{r['jeton']}` | {r['sonuc']} | {r['eklenen']} | {a['uzunluk'] if a else 0} → {b['uzunluk'] if b else 0} | {GOZ.get(r['jeton'], '')} |")
    open(RAPOR_MD, 'w', encoding='utf-8', newline='\n').write('\n'.join(L_) + '\n')
    print(RAPOR_MD)

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'olc': olc()
    elif cmd == 'uygula': uygula()
    elif cmd == 'belirsiz': belirsiz()
    elif cmd == 'maske': maske()
    elif cmd == 'wzb2': wzb2()
    elif cmd == 'rapor': rapor()
    else: sys.exit(__doc__)
