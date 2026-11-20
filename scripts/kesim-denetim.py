#!/usr/bin/env python3
"""İŞ 1 denetimi (kesmeden): public/characters/*.webp (kucuk/maske/bas hariç) kesim hataları.
a) alfa kanvas kenarına değiyor (kesik figür), b) ana figür dışında ikinci büyük bağlı parça (komşu hücre parçası),
c) genişlik kardeşlerden anormal (yarım kesik), d) kenarda magenta/yeşil sızıntı oranı. Çıktı: docs/sabah/kesim-denetim.md + JSON.
"""
import colorsys, glob, json, os, re, sys, collections
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

EDGE_PX, SECOND_FRAC, WIDTH_LO, LEAK_FRAC = 3, 0.06, 0.62, 0.04
rows = {}
for f in sorted(glob.glob('public/characters/*.webp')):
    name = os.path.basename(f)[:-5]
    a = np.asarray(Image.open(f).convert('RGBA'))
    al = a[..., 3] > 40
    if not al.any(): rows[name] = {'bos': True}; continue
    ys, xs = np.where(al)
    bb = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    touch = {'sol': int(al[:, 0].sum()), 'sag': int(al[:, -1].sum()), 'ust': int(al[0].sum()), 'alt': int(al[-1].sum())}
    # b) bileşenler (6 px kaynaştırma: efekt/aksesuar aynı figürde)
    lab, n = ndi.label(ndi.binary_dilation(al, iterations=5))
    sizes = sorted([int(((lab == i) & al).sum()) for i in range(1, n + 1)], reverse=True)
    second = sizes[1] / sizes[0] if len(sizes) > 1 else 0.0
    # d) kenar sızıntısı
    edge = al & ndi.binary_dilation(~al, structure=np.ones((3, 3)))
    rgb = a[..., :3][edge].astype(float) / 255.0
    leak = 0
    for r, g, b in rgb:
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        if s > 0.55 and v > 0.55 and ((0.25 < h < 0.42) or (0.80 < h < 0.92)): leak += 1
    rows[name] = {'bb': bb, 'w': bb[2] - bb[0], 'h': bb[3] - bb[1], 'touch': touch, 'ikinci': round(second, 3), 'sizdirma': round(leak / max(1, len(rgb)), 3), 'kenarPx': int(edge.sum())}
# c) kardeşler: aynı irk-cinsiyet-sınıf ailesi (hücre kodu atılır)
def fam(n): return re.sub(r'-(WZ-[AB]\d|WL-\d+|SC-\d+|ID\d+)$', '', n)
groups = collections.defaultdict(list)
for n, r in rows.items():
    if 'w' in r: groups[fam(n)].append(n)
for g, names in groups.items():
    if len(names) < 4: continue
    med = float(np.median([rows[n]['w'] for n in names]))
    for n in names: rows[n]['genislikOran'] = round(rows[n]['w'] / med, 2)
probs = {}
for n, r in rows.items():
    if 'w' not in r: continue
    p = []
    t = r['touch']
    if t['sol'] > EDGE_PX or t['sag'] > EDGE_PX or t['ust'] > EDGE_PX or t['alt'] > EDGE_PX: p.append('kenara değiyor ' + ','.join(k for k, v in t.items() if v > EDGE_PX))
    if r['ikinci'] > SECOND_FRAC: p.append(f"ikinci parça {r['ikinci']}")
    if r.get('genislikOran', 1) < WIDTH_LO: p.append(f"dar {r['genislikOran']}")
    if r['sizdirma'] > LEAK_FRAC: p.append(f"sızıntı {r['sizdirma']}")
    if p: probs[n] = p
json.dump({'satir': rows, 'sorunlu': probs}, open('/tmp/claude-0/s/denetim.json', 'w'), ensure_ascii=False)
cnt = collections.Counter(k.split()[0] for v in probs.values() for k in v)
print(len(rows), 'jeton;', len(probs), 'sorunlu;', dict(cnt))
