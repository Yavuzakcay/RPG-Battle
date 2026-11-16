#!/usr/bin/env python3
"""KQ6-10 hale v2 (yalnız önizleme): şekil temelli güvenli hale silme + tek kodla hale.
Hale = baş korumasının DIŞINDAKİ, ince, geniş, altın tonlu halka/yay bileşeni (renk eşiği tek başına silmez).
Koruma = (3 px açılmış opak kütle, 2 px genişletilmiş) ∪ baş kutusu ∪ kutunun altı. Güvenlik: baş kutusu alfa>0 sayısı değişirse ya da silinen
piksel beklenen halka büyüklüğünün çok üstündeyse silme iptal → ELLE.
Kullanım: python3 scripts/hale-v2.py  → docs/sabah/hale-v2/*.png + hale-v2.json
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi
spec = importlib.util.spec_from_file_location('ht', 'scripts/hale-tespit.py'); ht = importlib.util.module_from_spec(spec); spec.loader.exec_module(ht)
N = 256; HEAD_H = 56

def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]; return x * x + y * y <= r * r
def dil(m, r): return ndi.binary_dilation(m, structure=disk(r))

def gold_loose(a):
    rgb = a[..., :3].astype(float) / 255.0
    mx = rgb.max(axis=2); mn = rgb.min(axis=2); d = mx - mn + 1e-9
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = d / (mx + 1e-9)
    return (a[..., 3] > 20) & (h >= 30) & (h <= 95) & (s > 0.12) & (mx > 0.5)

def head_top_ref(a):
    """Baş/şapka/kask üst kenarı: koyu kontur (opak, parlaklık < 0.35) ≥ 6 px olan ilk satır; halede koyu kontur yoktur."""
    dark = (a[..., 3] > 200) & (a[..., :3].max(axis=2) < 90)
    return next((y for y in range(N) if int(dark[y].sum()) >= 6), None)

def find_hole_ring(a):
    """Kapalı halka: M = alfa>20 maskesinde içi boş (delik) ince geniş elips. → (delik maskesi, kanvasa değiyor mu) ya da None."""
    M = a[..., 3] > 100; tref = head_top_ref(a)      # delik: opak halkanın içi (yumuşak parıltı deliği doldurmasın)
    holes = ndi.binary_fill_holes(M) & ~M
    lab, _ = ndi.label(holes); best = None
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        m = lab == i; area = int(m.sum())
        w = sl[1].stop - sl[1].start; h = sl[0].stop - sl[0].start
        cym = (sl[0].start + sl[0].stop) / 2
        if area < 30 or w < 20 or h > 18 or w / max(h, 1) < 2.2 or cym > 90 or (tref is not None and cym > tref + 2): continue   # halka başın ÜSTÜNDE (kask/şapka içi delik değil)
        if best is None or sl[0].start < best[1][0].start: best = (m, sl)
    return best

def analyse(a):
    """→ dict(durum tam|kesik|yok|belirsiz, rm, box, top, cx, perim)"""
    solid = a[..., 3] > 100; M = a[..., 3] > 20
    rgb = a[..., :3].astype(float) / 255.0; mx = rgb.max(axis=2)
    out = {'durum': 'yok', 'rm': np.zeros(solid.shape, bool), 'box': None, 'top': None, 'cx': 128, 'perim': 0, 'comp': np.zeros(solid.shape, bool)}
    hole = find_hole_ring(a)
    band = dil(hole[0], 6) if hole else np.zeros(solid.shape, bool)
    # baş kütlesi: halka bandı çıkarılmış opak kütlenin 3 px açılması (ince halka kütle sayılmaz)
    opened = ndi.binary_opening(solid & ~band, structure=disk(3))
    if not opened.any(): return out
    top = next((y for y in range(N) if ht.runs(opened[y]) >= 18), int(np.where(opened.any(axis=1))[0][0]))
    opened = opened & (np.arange(N)[:, None] >= top - 2)               # baş satırının üstündeki kalın halka uçları kütle sayılıp korunmasın
    cols = np.where(opened[top:top + HEAD_H].any(axis=0))[0]
    box = (int(cols.min()), top, int(cols.max()) + 1, min(N, top + HEAD_H))
    out.update(top=top, box=box, cx=int(round(np.where(opened[top:top + 12])[1].mean())))
    protect = dil(opened, 3); protect[box[3]:] = True
    protect1 = dil(opened, 1); protect1[box[3]:] = True
    pm = np.where(a[..., 3] < 180, protect1, protect)                    # yumuşak (alfa<180) halka pikselleri başa 1 px yaklaşabilir, opaklar 3 px
    bright = M & (mx > 0.45) & ~((a[..., 3] > 200) & (mx < 0.45))
    if hole:
        m, sl = hole; ys, xs = np.where(dil(m, 6) & M)
        touch = bool(ys.min() <= 0 or xs.min() <= 0 or xs.max() >= N - 1) if len(ys) else True
        ys0, xs0 = np.where(band & M)
        reg = np.zeros(solid.shape, bool); reg[max(0, ys0.min() - 10):ys0.max() + 11, max(0, xs0.min() - 14):xs0.max() + 15] = True
        ring = reg & (a[..., 3] > 0) & ~pm & (bright | (a[..., 3] < 180)) & (np.arange(N)[:, None] <= top - 1)
        w = sl[1].stop - sl[1].start; h = sl[0].stop - sl[0].start
        out.update(durum='kesik' if touch else 'tam', rm=ring, comp=m, perim=np.pi * np.sqrt(((w / 2 + 3) ** 2 + (h / 2 + 3) ** 2) / 2) * 2)
        return out
    # delik yok: kesik yay (ince, geniş, başın üstünde, koruma dışı parlak bileşen)
    g = bright & ~protect
    lab, n = ndi.label(dil(g, 2) & ~protect)
    comp = np.zeros(solid.shape, bool); perim = 0.0
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        mm = g & (lab == i)
        if int(mm.sum()) < 12: continue
        w = sl[1].stop - sl[1].start; h = sl[0].stop - sl[0].start
        cxm = (sl[1].start + sl[1].stop) / 2; cym = (sl[0].start + sl[0].stop) / 2
        if w < 14 or h > 40 or not (top - 40 <= cym <= top + 6) or abs(cxm - (box[0] + box[2]) / 2) > 30: continue
        comp |= mm; perim += np.pi * np.sqrt(((w / 2) ** 2 + (h / 2) ** 2) / 2) * 2
    if comp.sum() < 12: return out
    ys, xs = np.where(comp)                                           # yayın uç parçaları da halkadan: bbox'u genişleterek (başın üstü, koruma dışı)
    reg = np.zeros(solid.shape, bool); reg[max(0, ys.min() - 8):ys.max() + 9, max(0, xs.min() - 24):xs.max() + 25] = True
    rm = reg & (a[..., 3] > 0) & ~pm & (bright | (a[..., 3] < 180)) & (np.arange(N)[:, None] <= top - 1)
    # Görsel kapanış: halka elipsinin açısal kapsaması ≥ %60 ve kanvas kenarına değmiyor → tam (alt yay saçın/kaskın arkasında kalmış olabilir)
    pts = rm | comp; yy, xx = np.where(pts); frac = 0.0; touch = True
    if len(yy):
        y0, y1, x0, x1 = yy.min(), yy.max(), xx.min(), xx.max(); rx, ry = (x1 - x0) / 2, (y1 - y0) / 2
        touch = bool(y0 <= 0 or x0 <= 0 or x1 >= N - 1)
        if rx >= 8:
            cxe, cye = (x0 + x1) / 2, (y0 + y1) / 2; dd = dil(pts, 2); hits = 0
            for t in range(0, 360, 5):
                px = int(round(cxe + rx * np.cos(np.radians(t)))); py = int(round(cye + max(ry, 1) * np.sin(np.radians(t))))
                hits += int(0 <= px < N and 0 <= py < N and dd[py, px])
            frac = hits / 72
    out.update(durum='tam' if frac >= 0.6 and not touch else 'kesik', rm=rm, comp=comp, perim=perim, kapsama=round(frac, 2))
    return out

def halo_candidates(a):
    """Üst bölgede (satır < 70) parlak, ince, yatay uzun bileşen var mı: varsa hale olabilir (çift hale riski → 'yok' sayılmaz)."""
    al = a[..., 3] > 20; mx = a[..., :3].max(axis=2) / 255.0
    thin = al & ~ndi.binary_opening(a[..., 3] > 60, structure=disk(2)) & (mx > 0.55)
    thin[70:] = False
    lab, _ = ndi.label(dil(thin, 1))
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        w = sl[1].stop - sl[1].start; h = sl[0].stop - sl[0].start
        if w >= 18 and w / max(h, 1) >= 1.6 and int((thin & (lab == i)).sum()) >= 15: return True
    return False

def above_empty(a, d):
    """Kesin 'yok': baş kütlesinin (açılmış opak kütle) üst kenarının üstünde, başa ±50 px içinde HİÇ opak piksel yok. Hale, tüy, hançer, parıltı: varsa belirsiz."""
    if d['top'] is None: return False
    x0, x1 = max(0, d['cx'] - 50), min(N, d['cx'] + 50); t = d['top']
    return not bool((a[:max(0, t - 1), x0:x1, 3] > 30).any())

def stray_above(a, d):
    """Başın üstünde, koruma dışında halka olmayan parlak artık var mı (çift hale riski → belirsiz)."""
    if d['box'] is None: return False
    M = (a[..., 3] > 20); above = np.zeros(M.shape, bool); above[:d['box'][1] + 6] = True
    lab, _ = ndi.label(M & above)
    return any(int((lab == i).sum()) >= 20 and int(ndi.binary_opening(lab == i, structure=disk(3)).sum()) < 0.5 * int((lab == i).sum()) and sl[1].stop - sl[1].start >= 14 and (sl[1].stop - sl[1].start) / max(1, sl[0].stop - sl[0].start) >= 2.0 for i, sl in enumerate(ndi.find_objects(lab), 1) if sl[0].start < d['box'][1] + 6 and sl[0].stop <= d['box'][1] + 14)

def erase(a):
    """→ (yeni a, bilgi). Güvenlik kontrolleri başarısızsa a değişmez, bilgi['iptal'] = neden."""
    d = analyse(a); info = {'durum': d['durum'], 'silinen': int(d['rm'].sum()), 'iptal': None, 'box': d['box']}
    if d['box'] is None: info.update(box_once=0, box_sonra=0, kalan=0); return a, info, d
    x0, y0, x1, y1 = d['box']; once = int((a[y0:y1, x0:x1, 3] > 0).sum())
    if d['durum'] == 'yok':
        if halo_candidates(a) or stray_above(a, d) or not above_empty(a, d): info['durum'] = 'belirsiz'; info['iptal'] = 'başın üstünde halka olabilecek artık var (çift hale riski)'
        info.update(box_once=once, box_sonra=once, kalan=0); return a, info, d
    b = a.copy(); b[d['rm'], 3] = 0; sonra = int((b[y0:y1, x0:x1, 3] > 0).sum())
    expected = d['perim'] * 6
    if sonra != once: info['iptal'] = 'baş kutusu piksel sayısı değişti'
    elif info['silinen'] > 2 * expected + 30: info['iptal'] = f'silinen {info["silinen"]} >> beklenen {int(expected)}'
    kalan = int((dil(d['comp'], 2) & (a[..., 3] >= 24) & ~d['rm']).sum())
    if not info['iptal'] and kalan > 40: info['iptal'] = f'halka başa değiyor: {kalan} px silinemedi (kalıntı)'
    info.update(box_once=once, box_sonra=sonra, kalan=kalan)
    return (a if info['iptal'] else b), info, d

def draw_halo(a, d):
    """Tek hale: başın üstüne ortalı altın ince elips, figürün arkasında."""
    cx = d['cx']; cy = max(7, (d['top'] if d['top'] is not None else 20) - 4); rx, ry = 26, 6
    layer = Image.new('RGBA', (N, N), (0, 0, 0, 0)); dr = ImageDraw.Draw(layer)
    dr.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=(255, 214, 72, 255), width=2)
    glow = Image.blend(Image.new('RGBA', (N, N), (0, 0, 0, 0)), layer.filter(ImageFilter.GaussianBlur(2)), 0.6)
    out = Image.new('RGBA', (N, N), (0, 0, 0, 0)); out.alpha_composite(glow); out.alpha_composite(layer); out.alpha_composite(Image.fromarray(a))
    return np.array(out), int(((np.array(layer)[..., 3] > 0) & ~(a[..., 3] > 0)).sum())

def load(n): return np.array(Image.open(f'public/characters/{n}.webp').convert('RGBA'))

def sheet(name, before, after, info, label, outdir):
    Z = 4; W = N * Z
    im = Image.new('RGB', (W * 2, W + 28), (96, 100, 112)); dr = ImageDraw.Draw(im)
    for k, arr in enumerate((before, after)):
        v = Image.fromarray(arr).resize((W, W), Image.NEAREST); im.paste(v, (k * W, 28), v)
        if info['box']:
            x0, y0, x1, y1 = [c * Z for c in info['box']]; dr.rectangle((k * W + x0, 28 + y0, k * W + x1 - 1, 28 + y1 - 1), outline=(255, 0, 255))
    dr.text((4, 2), f'{label} | {name} | durum {info["durum"]} | önce', fill=(255, 255, 255))
    dr.text((W + 4, 2), f'sonra | baş kutusu {info["box_once"]}→{info["box_sonra"]} | silinen {info["silinen"]} | kalan {info["kalan"]} | çizilen {info.get("cizilen", 0)}' + (f' | İPTAL: {info["iptal"]}' if info['iptal'] else ''), fill=(255, 255, 255))
    im.save(f'{outdir}/{name}.png')

if __name__ == '__main__':
    outdir = 'docs/sabah/hale-v2'; os.makedirs(outdir, exist_ok=True)
    classes = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
    pick = {'barbarian': 'ID1', 'bard': 'ID5', 'cleric': 'ID3', 'druid': 'ID7', 'fighter': 'ID1', 'monk': 'ID4', 'paladin': 'ID8', 'ranger': 'ID5', 'rogue': 'ID3', 'sorcerer': 'SC-1', 'warlock': 'WL-3', 'wizard': 'WZ-A1'}
    onceki = ['celestial-erkek-barbarian-ID7', 'celestial-erkek-druid-ID1', 'celestial-erkek-barbarian-ID1', 'celestial-erkek-barbarian-ID3', 'celestial-erkek-barbarian-ID2', 'celestial-erkek-barbarian-ID4']
    gece = [f'celestial-erkek-{c}-{pick[c]}' for c in classes]
    report = []
    for n in onceki:                                # çizim modu: tam = dokunma; kesik = sil + çiz; yok = çiz
        a = load(n); b, info, d = erase(a); info['mod'] = 'cizim'
        if info['durum'] == 'tam': res = a; info.update(silinen=0, iptal=None, box_sonra=info['box_once'])
        else:
            res = b
            if not info['iptal'] and info['durum'] != 'belirsiz':
                res, cz = draw_halo(b, d); info['cizilen'] = cz
        sheet(n, a, res, info, 'ÇİZİM', outdir); report.append({'ad': n, **{k: v for k, v in info.items() if k != 'box'}})
    for n in gece:                                  # Gece Gözyaşı: yalnız sil (halesiz)
        a = load(n); b, info, d = erase(a); info['mod'] = 'gece'
        sheet(n, a, b, info, 'GECE GÖZYAŞI', outdir); report.append({'ad': n, **{k: v for k, v in info.items() if k != 'box'}})
    json.dump(report, open(f'{outdir}/rapor.json', 'w'), ensure_ascii=False, indent=1)
    for r in report: print(r['mod'], r['ad'][10:], r['durum'], 'kutu', r['box_once'], '→', r['box_sonra'], 'sil', r['silinen'], 'kalan', r['kalan'], 'çiz', r.get('cizilen', 0), r['iptal'] or '')
