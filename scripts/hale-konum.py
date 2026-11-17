#!/usr/bin/env python3
"""KQ6-19: yıldız tacı konumu (data/hale-konum.json). Halesiz Celestial jetonlarda baş üst noktası: 2 px açılmış opak kütlenin ilk satırı (şapka/kask/taç/saç üst kenarı),
yatay merkez = ilk 10 satırın ortalaması, ölçek = baş genişliği / 32 (0,8–1,25). Varsayılan = sınıf+cinsiyet (Gariban ve genel jeton ayrı grup) ortancası;
jeton kaydı yalnız varsayılandan > 8 px (x ya da y) ya da > 0,2 ölçek sapan jetonlarda (yıldız tacı konum hatasına toleranslıdır: ± 8 px sorun sayılmaz).
Tacın örtüştüğü şapka/taç jetonlarında y şapka üstündedir (kütle ilk satırı). Hale görünür kalan (bekleyen) jetonlar kayıt dışıdır (taç çizilmez)."""
import json, os, re
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
D = 'public/characters'
def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]; return x * x + y * y <= r * r
def geom(a):
    solid = ndi.binary_opening(a[..., 3] > 100, structure=disk(2))
    lab, k = ndi.label(solid, structure=np.ones((3, 3)))
    big = lab == (1 + int(np.argmax(ndi.sum(solid, lab, range(1, k + 1)))))
    top = int(np.where(big.any(axis=1))[0][0])
    xs = np.where(big[top:top + 10].any(axis=0))[0]; cx = int(round(xs.mean()))
    row = np.where(big[min(255, top + 16)])[0]; hw = (row.max() - row.min()) / 2 if len(row) else 22
    return top, cx, hw
def key_of(name):
    m = re.match(r'^(erkek|kadin|male|female)-([a-z]+)(?:-(.+))?$', name)
    g = {'male': 'erkek', 'female': 'kadin'}.get(m.group(1), m.group(1)); cls = m.group(2); code = m.group(3) or ''
    return f'{cls}-{g}' + ('-gr' if code == 'GR' else ('-genel' if code == '' else ''))
def main():
    hold = set(json.load(open('data/hale-halesiz.json'))['bekleyen'])
    names = sorted(f[len('celestial-'):-5] for f in os.listdir(D) if f.startswith('celestial-') and f.endswith('.webp') and f[:-5] not in hold)
    g = {}
    for n in names:
        a = np.array(Image.open(f'{D}/celestial-{n}.webp').convert('RGBA')); top, cx, hw = geom(a)
        g[n] = (cx, top, float(np.clip(hw / 32, 0.8, 1.25)))
    groups = {}
    for n, v in g.items(): groups.setdefault(key_of(n), []).append(v)
    var = {k: {'x': int(np.median([v[0] for v in vs])), 'y': int(np.median([v[1] for v in vs])), 'olcek': round(float(np.median([v[2] for v in vs])), 2)} for k, vs in sorted(groups.items())}
    jeton = {}
    for n, (x, y, o) in g.items():
        d = var[key_of(n)]
        if abs(x - d['x']) > 8 or abs(y - d['y']) > 8 or abs(o - d['olcek']) > 0.2: jeton[n] = {'x': x, 'y': y, 'olcek': round(o, 2)}
    out = {'_not': 'KQ6-19: yıldız tacı konumu (jeton 256 px uzayında; x,y = başın/şapkanın üst orta noktası, olcek = tasarım ölçeği oranı). Üretici scripts/hale-konum.py. varsayilan: <sınıf>-<erkek|kadin>[-gr|-genel]; jeton: varsayılandan > 8 px sapanlar için ezme (anahtar = dosya adı, celestial- öneksiz).', 'varsayilan': var, 'jeton': dict(sorted(jeton.items()))}
    json.dump(out, open('data/hale-konum.json', 'w'), ensure_ascii=False, indent=1)
    print(len(names), 'jeton,', len(var), 'varsayılan grup,', len(jeton), 'ezme')
if __name__ == '__main__': main()
