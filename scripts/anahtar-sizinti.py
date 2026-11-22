#!/usr/bin/env python3
"""KQ6-16: yeni jetonlarda (data/toplu-kesim-yeni-rapor.json) kenar anahtar sızıntısı taraması (#00FF00 yeşil, #FF00FF pembe).
Sızıntı = saf anahtar rengine yakın (uzaklık < 100) VE ince (≤ 3 px) kenar kalıntısı: tuvalin saydam kısmına ≤ 2 px yakın, bağlı anahtar renkli bileşeni küçük (≤ 90 px) olan pikseller.
Büyük anahtar renkli bölgeler (rün çemberi, enerji küresi, yaprak) sanatın parçasıdır, dokunulmaz. Kullanım: python3 scripts/anahtar-sizinti.py [--temizle]
Çıktı: docs/sabah/anahtar-sizinti.md (liste). --temizle: sızıntı pikselleri silinir (alfa 0), kenar 1 px içeriye doğru zemin renginden arındırılır, kucuk/ kopyası yeniden üretilir.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
D = 'public/characters'
G, M = np.array([0, 255, 0]), np.array([255, 0, 255])

def fringe(a, chroma=100, inner_max=40):
    """Dış siluet piksellerinden (alfa > 100, kenara ≤ 2 px) yeşil/pembe kroması yüksek ama içerideki komşuları anahtar renginde OLMAYANLAR:
    sanatın kendi yeşil/pembe parçası (hayalet, alev, fener ışığı, rün) içi de aynı renkte olduğundan işaretlenmez."""
    al = a[..., 3] > 100; rgb = a[..., :3].astype(float)
    chg = rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]); chm = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]
    edge = al & ~ndi.binary_erosion(al, iterations=2); inner = ndi.binary_erosion(al, iterations=4)
    def inner_mean(ch):
        w = ndi.uniform_filter(np.where(inner, ch, 0.0), 9); c = ndi.uniform_filter(inner.astype(float), 9)
        return np.where(c > 0.05, w / np.maximum(c, 1e-6), 0)
    return {'yesil': edge & (chg > chroma) & (inner_mean(chg) < inner_max), 'pembe': edge & (chm > chroma) & (inner_mean(chm) < inner_max)}

scan = fringe

def main():
    clean = '--temizle' in sys.argv
    rep = json.load(open('data/toplu-kesim-yeni-rapor.json'))
    names = [k['cikti'] for s in rep['sayfalar'] for k in s['kesilen']]
    rows = []
    for n in names:
        f = f'{D}/{n}.webp'; a = np.array(Image.open(f).convert('RGBA')); sc = scan(a)
        cnt = {k: int(v.sum()) for k, v in sc.items()}
        if sum(cnt.values()) < 3: continue
        rows.append((n, cnt))
        if clean:
            bad = sc['yesil'] | sc['pembe']
            a[bad, 3] = 0
            # silinen pikselin yanındaki kenar pikselleri de anahtar tonlu ise (1 px) silinir
            for _ in range(2):   # kenar içeri kayınca açılan yeni sızıntı pikselleri (en çok 2 geçiş)
                sc2 = scan(a); b2 = sc2['yesil'] | sc2['pembe']
                if not b2.any(): break
                a[b2, 3] = 0
            Image.fromarray(a).save(f, 'WEBP', quality=92, alpha_quality=100, method=4)
            Image.fromarray(a).resize((96, 96), Image.LANCZOS).save(f'{D}/kucuk/{n}.webp', 'WEBP', quality=82, method=4)
    L = ['# Anahtar sızıntısı taraması (KQ6-16)', '', f'{len(names)} yeni jeton tarandı; sızıntılı {len(rows)}' + (' (temizlendi)' if clean else ' (temizlenmedi)') + '. Sızıntı = dış siluet pikseli yeşil/pembe baskın ama içerideki komşuları anahtar renginde değil (≥ 3 px). Sanatın kendi yeşil/pembe parçaları (yeşil hayalet, alev, fener ışığı, rün çemberi, enerji küresi) içi de aynı renkte olduğundan işaretlenmez.', '',
         '| Jeton | yeşil px | pembe px |', '|---|---:|---:|'] + [f'| {n} | {c["yesil"]} | {c["pembe"]} |' for n, c in sorted(rows, key=lambda r: -sum(r[1].values()))]
    open('docs/sabah/anahtar-sizinti.md', 'w').write('\n'.join(L) + '\n')
    print(len(names), len(rows), sum(sum(c.values()) for _, c in rows))
    for n, c in sorted(rows, key=lambda r: -sum(r[1].values()))[:15]: print(n, c)

if __name__ == '__main__': main()
