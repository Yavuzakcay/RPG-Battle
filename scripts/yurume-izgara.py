"""
K47: yürünebilirlik maskesi (data/harita/yurume-maliyet-1_4.png, 1/4 ölçek; 0 geçilmez, değer = maliyet × 20) →
yol bulma ızgarası data/harita/yurume-izgara.json (hücre 32 dünya pikseli, satır başına RLE).

Düzeltmeler (maske taslak; kullanıcı kararı 2026-11-03: CC gözle doğrular):
  - Yol katmanı (yol-katmani.json) boyunca 1 hücre geniş koridor maliyet 10 (yol/patika) — yollar maskede nehir
    çizgileriyle kesiliyordu; köprüsüz nehir geçişi yol üzerindeyse açılır.
  - Köprüler (komsuluk-grafi.json kopruler) ve bölge geçit kapıları (kenarlar kapi_a/kapi_b): yarıçap 2 hücre maliyet 10.
  - Geçilmez hücreye düşen düğüm 1 hücre açılır; kıtadan kopuk (ada olmayan) düğüm ≤ 6 hücredeyse koridor (Çöl Vahası).
  - Çalıştırınca bağlantı raporu: kıta düğümleri (tum_dugumler_dunya.json, ada dışı) tek parça mı.

    python scripts/yurume-izgara.py
"""
import json
import os
from collections import Counter, deque

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = lambda *p: os.path.join(ROOT, 'data', 'harita', *p)
CELL = 32                  # dünya pikseli
MASK_SCALE = 4             # maske 1/4 ölçek
K = CELL // MASK_SCALE     # hücre başına maske pikseli (8)

mask = Image.open(H('yurume-maliyet-1_4.png')).convert('L')
mw, mh = mask.size
W, Hh = (mw * MASK_SCALE + CELL - 1) // CELL, (mh * MASK_SCALE + CELL - 1) // CELL
px = mask.load()

grid = []
for gy in range(Hh):
    row = []
    for gx in range(W):
        vals = [px[x, y] for y in range(gy * K, min(mh, gy * K + K)) for x in range(gx * K, min(mw, gx * K + K))]
        passable = [v for v in vals if v > 0]
        # Hücrenin yarısından çoğu geçilmezse geçilmez; değilse geçilebilirlerin en yaygın maliyeti.
        row.append(0 if len(passable) * 2 < len(vals) else Counter(passable).most_common(1)[0][0])
    grid.append(row)

fixes = Counter()

def paint(x, y, r, cost, why):
    cx, cy = int(x // CELL), int(y // CELL)
    for yy in range(cy - r, cy + r + 1):
        for xx in range(cx - r, cx + r + 1):
            if 0 <= xx < W and 0 <= yy < Hh and (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r:
                if grid[yy][xx] == 0 or grid[yy][xx] > cost:
                    if grid[yy][xx] == 0:
                        fixes[why] += 1
                    grid[yy][xx] = cost

roads = json.load(open(H('yol-katmani.json'), encoding='utf-8'))['yollar']
for r in roads:
    pts = r['noktalar']
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = max(1, int(max(abs(bx - ax), abs(by - ay)) / (CELL / 2)))
        for k in range(n + 1):
            paint(ax + (bx - ax) * k / n, ay + (by - ay) * k / n, 0, 10, 'yol')
graph = json.load(open(H('komsuluk-grafi.json'), encoding='utf-8'))
for b in graph['kopruler']:
    paint(b['dunya_px'][0], b['dunya_px'][1], 2, 10, 'kopru')
for e in graph['kenarlar']:
    paint(e['kapi_a'][0], e['kapi_a'][1], 2, 10, 'gecit')
    paint(e['kapi_b'][0], e['kapi_b'][1], 2, 10, 'gecit')

# Bağlantı raporu.
def comp(start):
    seen = {start}
    q = deque([start])
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < Hh and grid[ny][nx] and (nx, ny) not in seen:
                seen.add((nx, ny)); q.append((nx, ny))
    return seen

nodes = json.load(open(H('tum_dugumler_dunya.json'), encoding='utf-8'))
cell = lambda p: (int(p[0] // CELL), int(p[1] // CELL))
dead = [k for k, p in nodes.items() if grid[cell(p)[1]][cell(p)[0]] == 0]
for k in dead:  # düğüm geçilmez hücredeyse (maske taslağı) 1 hücre aç
    paint(nodes[k][0], nodes[k][1], 1, 20, 'dugum')
main = comp(cell(nodes['orman/Patika']))
# Kıtadan kopuk ama ada olmayan düğüm (Volkan adası hariç) ≤ 6 hücredeyse en yakın kıta hücresine düz koridor.
for k, p in nodes.items():
    if k.startswith('volkan/') or cell(p) in main:
        continue
    pocket = comp(cell(p))
    near = min(((abs(a[0] - b[0]) + abs(a[1] - b[1]), a, b) for a in pocket for b in main if abs(a[0] - b[0]) <= 6 and abs(a[1] - b[1]) <= 6), default=None)
    if near and near[0] <= 6:
        (ax, ay), (bx, by) = near[1], near[2]
        for t in range(near[0] + 1):
            paint((ax + (bx - ax) * t / max(1, near[0]) + 0.5) * CELL, (ay + (by - ay) * t / max(1, near[0]) + 0.5) * CELL, 0, 20, 'kopuk-dugum')
        main = comp(cell(nodes['orman/Patika']))
cut = [k for k, p in nodes.items() if cell(p) not in main]

rows = []
for row in grid:
    runs, prev, n = [], row[0], 0
    for v in row:
        if v == prev:
            n += 1
        else:
            runs += [prev, n]; prev, n = v, 1
    runs += [prev, n]
    rows.append(runs)
out = {
    'not': "K47: yürüme ızgarası (npm: python scripts/yurume-izgara.py; elle düzenlenmez). Hücre 32 dünya pikseli; 0 geçilmez, değer maliyet × 20 (10 yol, 20 çim, 22/24 açık arazi, 36 kar, 52 orman, 80 dağ/engel). Satır başına RLE [değer, adet, …]. Düzeltmeler: yol koridoru, köprü ve geçit kapıları açık.",
    'hucre': CELL, 'genislik': W, 'yukseklik': Hh, 'satirlar': rows,
    'duzeltme': dict(fixes), 'kopuk': cut,
}
json.dump(out, open(H('yurume-izgara.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'{W}×{Hh} hücre, düzeltme {dict(fixes)}, geçilmez hücredeki düğüm {len(dead)}: {dead}')
print(f'kıta bileşeninde olmayan düğümler ({len(cut)}): {cut}')
print(f'dosya {os.path.getsize(H("yurume-izgara.json")) // 1024} kB')
