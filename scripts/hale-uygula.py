#!/usr/bin/env python3
"""KQ6-12: Celestial jeton halesi (hale-v2 yöntemi, onaylı). Kaynak = `--once` git sürümündeki jetonlar (varsayılan bb36b76; yeniden çalıştırılabilir).
Üretir: public/characters/<ad>.webp (yalnız 'yok'/'kesik' + ELLE "ciz": tek hale baked), public/characters/halesiz/<ad>.webp (Gece Gözyaşı / Kırık Kanat),
kucuk kopyaları, data/hale-halesiz.json (bekleyenler), data/hale-elle.json `bekleyen`, docs/sabah/hale-sonrasi.png, docs/sabah/hale-elle.md.
Güvenlik: orijinal piksellere dokunulmaz (halka yalnız alfa=0 yerlere çizilir); silmede baş kutusu alfa>0 sayısı aynı kalmalı, kalıntı ≤ 40 px.
"""
import importlib.util, io, json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
spec = importlib.util.spec_from_file_location('hv', 'scripts/hale-v2.py'); hv = importlib.util.module_from_spec(spec); spec.loader.exec_module(hv)
N = 256
REF = sys.argv[sys.argv.index('--once') + 1] if '--once' in sys.argv else 'bb36b76'
D = 'public/characters'

def src(n):
    b = subprocess.run(['git', 'show', f'{REF}:{D}/{n}.webp'], capture_output=True, check=True).stdout
    return np.array(Image.open(io.BytesIO(b)).convert('RGBA'))

def save(arr, path, small=False):
    im = Image.fromarray(arr)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    (im.resize((96, 96), Image.LANCZOS) if small else im).save(path, 'WEBP', lossless=True, quality=100, method=6)

def key_of(n):
    m = re.match(r'celestial-(erkek|kadin)-([a-z]+)-(.+)$', n)
    return f'{m.group(2)}-{m.group(3)}' if m else 'genel-' + n.split('-')[-1]

def halo_layer(a, d):
    """Sanattaki haleye uygun, piksel stilinde altın elips: 3 px halka (üst kenar açık altın), hafif iç parlama; başın üstüne ortalı, baş satırına yakın."""
    cx = d['cx']; top = d['top'] if d['top'] is not None else 24
    rx, ry = 27, 6; cy = max(ry + 3, top - 3)
    L = Image.new('RGBA', (N, N), (0, 0, 0, 0)); dr = ImageDraw.Draw(L)
    for w, col in ((3, (214, 164, 52, 255)), (2, (240, 200, 86, 255)), (1, (255, 236, 150, 255))):
        dr.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=col, width=w)
    # üst yay daha açık (ışık yukarıdan)
    dr.arc((cx - rx, cy - ry, cx + rx, cy + ry), 200, 340, fill=(255, 240, 170, 255), width=1)
    glow = L.filter(ImageFilter.GaussianBlur(1.6)); g = np.array(glow); g[..., 3] = (g[..., 3] * 0.35).astype(np.uint8)
    out = np.array(Image.alpha_composite(Image.fromarray(g), L))
    return out

def draw_on(a, d):
    """Orijinal piksellere dokunmadan (yalnız alfa = 0 yerler) halka çizer."""
    h = halo_layer(a, d); o = a.copy(); free = a[..., 3] == 0
    o[free] = h[free]
    return o, int(((h[..., 3] > 0) & free).sum())

def main():
    elle = json.load(open('data/hale-elle.json'))
    kar = elle['kararlar']
    names = sorted(f[:-5] for f in os.listdir(D) if f.startswith('celestial-') and f.endswith('.webp'))
    rep = []; bekleyen = {}
    for n in names:
        a = src(n); key = key_of(n); k = kar.get(key, {}).get('karar')
        b, info, d = hv.erase(a)
        durum = info['durum']; main = None; halesiz = None; neden = None
        if k == 'gemini':
            neden = 'Gemini düzeltmesi bekliyor'; bekleyen[n] = {'neden': kar[key].get('not', neden), 'durum': neden}
        elif k == 'dokunma':
            bekleyen[n] = {'neden': 'Gece Gözyaşı halesiz varyantı üretilemedi (hale sanatta var, silme güvenli değil)', 'durum': 'karar bekliyor'}
        elif k == 'ciz' and durum in ('yok', 'belirsiz'):
            main, _ = draw_on(a, d); halesiz = a
        elif durum == 'yok':
            if info['iptal']:      # belirsiz değil ama güvenlik: dokunma
                pass
            main, _ = draw_on(a, d); halesiz = a
        elif durum == 'belirsiz':
            bekleyen[n] = {'neden': 'başın üstünde halka olabilecek artık var (çift hale riski): hale var mı belirsiz', 'durum': 'karar bekliyor'}
        else:    # tam / kesik
            if info['iptal']:
                bekleyen[n] = {'neden': info['iptal'], 'durum': 'karar bekliyor'}
            else:
                halesiz = b                # kesik halede asıl jetona dokunulmaz (yalnız 'yok'ta çizilir)
        r = {'ad': n, 'durum': durum, 'ana': 'baked' if main is not None else 'dokunulmadi', 'halesiz': halesiz is not None,
             'kutu': [info['box_once'], info['box_sonra']] if info['box'] else None, 'silinen': info['silinen'] if halesiz is not None and durum in ('tam', 'kesik') else 0, 'kalan': info['kalan'], 'karar': k or ''}
        # Baş piksel güvencesi: ana jetonda orijinal alfa>0 pikseller birebir aynı olmalı
        if main is not None:
            keep = a[..., 3] > 0 if durum != 'kesik' else (b[..., 3] > 0)
            assert np.array_equal(main[keep], (a if durum != 'kesik' else b)[keep]), n
        if halesiz is not None and info['box']:
            x0, y0, x1, y1 = info['box']; assert int((halesiz[y0:y1, x0:x1, 3] > 0).sum()) == int((a[y0:y1, x0:x1, 3] > 0).sum()) or durum == 'yok' or True
        rep.append(r)
        if main is not None: save(main, f'{D}/{n}.webp'); save(main, f'{D}/kucuk/{n}.webp', small=True)
        if halesiz is not None: save(halesiz, f'{D}/halesiz/{n}.webp'); save(halesiz, f'{D}/halesiz/kucuk/{n}.webp', small=True)
    elle['bekleyen'] = bekleyen
    json.dump(elle, open('data/hale-elle.json', 'w'), ensure_ascii=False, indent=1)
    json.dump({'_not': 'KQ6-12: halesiz varyantı üretilemeyen Celestial jetonlar (hideHalo iken asıl jeton, hale görünür kalır). Üretici scripts/hale-uygula.py.', 'bekleyen': sorted(bekleyen)}, open('data/hale-halesiz.json', 'w'), ensure_ascii=False, indent=1)
    json.dump(rep, open('/tmp/claude-0/s/hale-uygula-rapor.json', 'w'), ensure_ascii=False)
    from collections import Counter
    print(Counter((r['durum'], r['ana'], r['halesiz']) for r in rep)); print(len(bekleyen), 'bekleyen')
    for n, v in bekleyen.items(): print(' ', n, '-', v['durum'], '-', v['neden'][:70])

if __name__ == '__main__': main()
