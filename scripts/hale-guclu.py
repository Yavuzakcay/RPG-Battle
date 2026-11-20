#!/usr/bin/env python3
"""KQ6-18: halesiz varyantlar için güçlü silme (güvenlik ağıyla). Kalıntılı halesiz varyantlar (denetim: docs/sabah/hale-silme-denetim.csv `halesizde_hale_kaldi = evet`) asıl jetondan yeniden üretilir.
Yöntem: (1) hale tohumu = hale-v2 maskesi ∪ hale-oneri şekil maskesi ∪ mevcut halesizde silinmiş pikseller; (2) hale tonu = tohumun opak çekirdeğinin ortanca rengi;
(3) aday = tohumun 6 px çevresinde, hale tonuna yakın (ya da yarı saydam parıltı) bağlı pikseller; jetonun başka yerinde (baş çizgisinin altında) aynı ton ≥ 120 px ise
(altın saç gibi) aday yalnız tohumla sınırlı; (4) KORUMA: baş konturunun ilk koyu satırından (≥ top−1) aşağısı tümüyle, koyu kontur pikselleri ve hale tonu olmayan her piksel. Silinen = aday − koruma.
Güvenlik ağı: silme sonrası halede kalıntı (şekil temelli: hale-v2, hale-oneri, tohum çevresinde hale tonlu ≥ 24 alfa piksel > 8) varsa ya da beklenmeyen bir şey olursa varyant ÜRETİLMEZ (gevşetme yok): jeton "Gemini'ye gidecek" listesine alınır (halesiz dosyası kaldırılır, hale çizilmez).
Kullanım: python3 scripts/hale-guclu.py   (kaynak liste: docs/sabah/hale-silme-denetim.csv)."""
import csv, importlib.util, json, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
hv = load('hv', 'scripts/hale-v2.py'); ho = load('ho', 'scripts/hale-oneri.py')
D = 'public/characters'; N = 256; T = 70; RESIDUAL_MAX = 8; BODY_SAME = 120

def save(arr, path, small=False):
    im = Image.fromarray(arr); os.makedirs(os.path.dirname(path), exist_ok=True)
    (im.resize((96, 96), Image.LANCZOS) if small else im).save(path, 'WEBP', lossless=True, quality=100, method=6)

def seeds(o, f):
    m = np.zeros((N, N), bool)
    hv.OPAQUE_R = 3; d = hv.analyse(o)
    if d['rm'].any(): m |= d['rm']
    if d['durum'] in ('tam', 'kesik') and d['comp'].any() and d['comp'].sum() < 600: m |= d['comp']
    r = ho.rings(o)
    if r['sinif'] == 'var': m |= r['mask']
    if f is not None: m |= (o[..., 3] > 0) & (f[..., 3] == 0)
    return m

def residual(o, f):
    """Halesiz varyantta (f) asıl jetonun (o) hale tohumu çevresinde kalan hale tonlu piksel sayısı (ton temelli kalıntı denetimi); tohum yoksa 0."""
    S = seeds(o, f)
    if not S.any(): return 0
    rgb = o[..., :3].astype(float); al = o[..., 3]; core = S & (al > 150)
    if core.sum() < 15: core = S & (al > 60)
    if core.sum() < 8: return 0
    c = np.median(rgb[core], axis=0); top = ho.mass_info(o)['top_px']; rows = np.arange(N)[:, None]
    band = ndi.binary_dilation(S, iterations=6)
    return int((band & (f[..., 3] >= 24) & (np.linalg.norm(f[..., :3].astype(float) - c, axis=2) < T) & (rows < top - 1)).sum())

def strong_erase(o, f):
    """→ (sonuç dizisi ya da None, silinen px, kalıntı px, sebep)"""
    mi = ho.mass_info(o); top = mi['top_px']
    S = seeds(o, f)
    if not S.any(): return None, 0, 0, 'hale tohumu bulunamadı (şekil belirsiz)'
    rgb = o[..., :3].astype(float); al = o[..., 3]
    core = S & (al > 150)
    if core.sum() < 15: core = S & (al > 60)
    if core.sum() < 8: return None, 0, 0, 'hale rengi çıkarılamadı'
    c = np.median(rgb[core], axis=0)
    close = np.linalg.norm(rgb - c, axis=2) < T
    rows = np.arange(N)[:, None]
    body_same = int((close & (al > 150) & (rows >= top + 2)).sum())
    band = ndi.binary_dilation(S, iterations=6)
    dark = (al > 200) & (rgb.max(axis=2) < 90)
    cand = (al > 0) & band & (close | (al < 150))
    if body_same >= BODY_SAME: cand &= ndi.binary_dilation(S, iterations=2)       # aynı ton bedende de var (altın saç): yalnız tohum çevresi
    protect = (rows >= top - 1) | ndi.binary_dilation(dark, iterations=1)
    rm = (cand | S) & ~protect & (al > 0)
    # tohumdan bağımsız bütün yanlış-pozitif savunması: silinen her piksel halka bandında ve baş çizgisinin üstünde olmalı (yapısal, yukarıdaki koruma)
    res = o.copy(); res[rm, 3] = 0
    # kalıntı (şekil temelli)
    d2 = hv.analyse(res); r2 = ho.rings(res)
    resid_px = int((band & (res[..., 3] >= 24) & (np.linalg.norm(res[..., :3].astype(float) - c, axis=2) < T) & ~protect).sum())
    shape_left = d2['durum'] in ('tam', 'kesik') or r2['sinif'] == 'var'
    if shape_left or resid_px > RESIDUAL_MAX:
        why = f'kalıntı: şekil {"var" if shape_left else "yok"}, hale tonlu {resid_px} px (≤ {RESIDUAL_MAX} gerekir); halka baş çizgisine değiyor ya da baş/saç tonuyla karışık'
        return None, int(rm.sum()), resid_px, why
    r_final = residual(o, res)       # denetimle aynı ölçüt (silinmişlerle genişleyen tohum): tutarlılık
    if r_final > RESIDUAL_MAX: return None, int(rm.sum()), r_final, f'kalıntı (denetim ölçütü): hale tonlu {r_final} px (≤ {RESIDUAL_MAX} gerekir)'
    return res, int(rm.sum()), resid_px, ''

def main():
    elle = json.load(open('data/hale-elle.json')); bek = elle['bekleyen']
    import sys
    src = sys.argv[1] if len(sys.argv) > 1 else 'docs/sabah/hale-silme-denetim.csv'
    rows = list(csv.DictReader(open(src)))
    if 'sonuc' in rows[0]: todo = [r['dosya'][:-5] for r in rows if r['durum'] == 'halesiz var' and r['sonuc'] != 'temiz']        # denetim2 çıktısı: kalıntılı / şüpheli halesizler
    else: todo = [r['dosya'][:-5] for r in rows if r['halesizde_hale_kaldi'] == 'evet' or int(r['hale_disinda_silinen_px']) > 3]
    gemini = []; ok = []
    for n in todo:
        o = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA')); f = np.array(Image.open(f'{D}/halesiz/{n}.webp').convert('RGBA'))
        res, nrm, resid, why = strong_erase(o, f)
        if res is not None:
            save(res, f'{D}/halesiz/{n}.webp'); save(res, f'{D}/halesiz/kucuk/{n}.webp', small=True); ok.append((n, nrm, resid))
        else:
            for p in (f'{D}/halesiz/{n}.webp', f'{D}/halesiz/kucuk/{n}.webp'):
                if os.path.exists(p): os.remove(p)
            bek[n] = {'neden': why, 'durum': "Gemini'ye gidecek", 'karar': 'gemini'}
            gemini.append((n, why))
    json.dump(elle, open('data/hale-elle.json', 'w'), ensure_ascii=False, indent=1)
    json.dump({'_not': 'KQ6-12/16/18: halesiz varyantı üretilemeyen Celestial jetonlar (hideHalo iken asıl jeton, hale görünür kalır). Üretici scripts/hale-uygula.py, hale-yeni.py, hale-guclu.py.', 'bekleyen': sorted(bek)}, open('data/hale-halesiz.json', 'w'), ensure_ascii=False, indent=1)
    with open('docs/sabah/hale-gemini.csv', 'w', newline='') as fh:
        w = csv.writer(fh); w.writerow(['dosya', 'sebep', 'durum'])      # Gemini listesi: bekleyen kayıtlarından (önceki çalıştırmalar dahil, birikimli)
        w.writerows([(f'{n}.webp', v.get('neden', ''), v['durum']) for n, v in sorted(bek.items()) if 'Gemini' in v.get('durum', '')])
    print(len(todo), 'kalıntılı;', len(ok), 'temiz yeniden üretildi;', len(gemini), "Gemini'ye gidecek")
    for n, why in gemini: print(' ', n, '-', why[:90])

if __name__ == '__main__': main()
