#!/usr/bin/env python3
"""KQ6-16: yeni/yenilenen Celestial jetonlar (Gariban -GR, Hızır Paladin ID10) için halesiz varyant (hale-v2 yöntemi, güvenlik kontrolleriyle).
Asıl jetona DOKUNULMAZ (hale çizilmez). Yalnız hale pikselleri silinir; baş kutusu alfa>0 sayısı değişirse / kalıntı > 40 px ise varyant üretilmez → data/hale-elle.json bekleyen.
Kullanım: python3 scripts/hale-yeni.py   (idempotent: işlenen adların eski halesiz dosyası ve bekleyen kaydı yeniden yazılır)
"""
import importlib.util, json, os, re
import numpy as np
from PIL import Image
spec = importlib.util.spec_from_file_location('hv', 'scripts/hale-v2.py'); hv = importlib.util.module_from_spec(spec); spec.loader.exec_module(hv)
D = 'public/characters'
hv.OPAQUE_R = 2; hv.KALAN_MAX = 12
spec2 = importlib.util.spec_from_file_location('ho', 'scripts/hale-oneri.py'); ho = importlib.util.module_from_spec(spec2); spec2.loader.exec_module(ho)

def save(arr, path, small=False):
    im = Image.fromarray(arr); os.makedirs(os.path.dirname(path), exist_ok=True)
    (im.resize((96, 96), Image.LANCZOS) if small else im).save(path, 'WEBP', lossless=True, quality=100, method=6)

def main():
    elle = json.load(open('data/hale-elle.json')); bek = elle['bekleyen']
    names = sorted(f[:-5] for f in os.listdir(D) if re.match(r'^celestial-(erkek|kadin)-[a-z]+-GR\.webp$|^celestial-(erkek|kadin)-paladin-ID10\.webp$', f))
    rep = []
    for n in names:
        for p in (f'{D}/halesiz/{n}.webp', f'{D}/halesiz/kucuk/{n}.webp'):
            if os.path.exists(p): os.remove(p)
        bek.pop(n, None)
        a = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA')); b, info, d = hv.erase(a)
        durum = info['durum']; out = None; neden = None
        if durum in ('tam', 'kesik') and not info['iptal']: out = b
        elif durum == 'yok' and hv.above_empty(a, d) and not hv.halo_candidates(a) and ho.rings(a)['sinif'] == 'yok': out = a   # hale yok (kesin: başın üstü boş): halesiz = asıl jeton
        else: neden = info['iptal'] or f'hale durumu belirsiz ({durum}); başın üstünde hale olabilecek piksel var'
        if out is not None: save(out, f'{D}/halesiz/{n}.webp'); save(out, f'{D}/halesiz/kucuk/{n}.webp', small=True)
        else: bek[n] = {'neden': neden, 'durum': 'karar bekliyor', 'karar': ''}
        rep.append((n, durum, info['silinen'], info['kalan'], 'halesiz' if out is not None else 'bekleyen'))
    json.dump(elle, open('data/hale-elle.json', 'w'), ensure_ascii=False, indent=1)
    json.dump({'_not': 'KQ6-12/16: halesiz varyantı üretilemeyen Celestial jetonlar (hideHalo iken asıl jeton, hale görünür kalır). Üretici scripts/hale-uygula.py, scripts/hale-yeni.py.', 'bekleyen': sorted(bek)}, open('data/hale-halesiz.json', 'w'), ensure_ascii=False, indent=1)
    from collections import Counter
    print(len(names), Counter(r[4] for r in rep))
    for r in rep:
        if r[4] == 'bekleyen': print(' ', r)

if __name__ == '__main__': main()
