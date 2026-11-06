"""
K49 D: dünya bölgeleri ve yüzülebilir su. Yürüme ızgarasından (data/harita/yurume-izgara.json, hücre 32 px) iki katman üretir:
  - `yuzme`: geçilmez ama dar su olan hücreler (göl, nehir). Renk z2 karolarından (mavi baskın); "dar": kapalı su
    kütlesi (harita kenarına değmeyen, ≤ gölEnFazla hücre) ya da iki karşı yönde de `darYaricap` hücre içinde kara var.
    Açık deniz, uçurum ve kayalık (mavi olmayan) geçilmez kalır.
  - `satirlar`: hücrenin bölgesi (0 = yok/deniz, 1.. = `bolgeler` sırası). Bölge tohumları etiketler.json `bolge` ve
    `ada` etiketleri; kara + yüzme hücrelerinde çok kaynaklı Dijkstra (arazi maliyetiyle; sınırlar dağ/su hattına oturur).
    Erişilemeyen kara parçası en yakın tohuma (öklid) gider.
Parametreler data/harita/bolge-yukleme.json `uretim`. Çıktı data/harita/bolge-izgara.json (RLE). Elle düzenlenmez.

    python scripts/k49-bolgeler.py
"""
import heapq
import json
import os
from collections import deque

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = lambda *p: os.path.join(ROOT, 'data', 'harita', *p)
par = json.load(open(H('bolge-yukleme.json'), encoding='utf-8'))['uretim']

g = json.load(open(H('yurume-izgara.json'), encoding='utf-8'))
CELL, W, Hh = g['hucre'], g['genislik'], g['yukseklik']
grid = []
for rle in g['satirlar']:
    row = []
    for v, n in zip(rle[0::2], rle[1::2]):
        row.extend([v] * n)
    grid.append(row)

# z2 (1/8 ölçek): hücre = 4 px.
base = os.path.join(ROOT, 'public', 'maps', 'dunya', '2')
man = json.load(open(os.path.join(ROOT, 'public', 'maps', 'dunya', 'manifest.json'), encoding='utf-8'))
z2 = next(z for z in man['zoomlar'] if z['z'] == 2)
img = Image.new('RGB', (z2['genislik'], z2['yukseklik']))
for x in os.listdir(base):
    for f in os.listdir(os.path.join(base, x)):
        img.paste(Image.open(os.path.join(base, x, f)).convert('RGB'), (int(x) * man['karo'], int(f.split('.')[0]) * man['karo']))
px = img.load()
k = CELL * z2['olcek']


def blue(x, y):
    r = gg = b = n = 0
    for yy in range(int(y * k), min(img.height, int((y + 1) * k))):
        for xx in range(int(x * k), min(img.width, int((x + 1) * k))):
            p = px[xx, yy]
            r += p[0]; gg += p[1]; b += p[2]; n += 1
    return n and b / n > r / n + par['maviFark'] and gg >= r


water = [[grid[y][x] == 0 and blue(x, y) for x in range(W)] for y in range(Hh)]
# Su kütleleri: kenara değen ya da büyük olan = deniz.
comp = [[-1] * W for _ in range(Hh)]
lake = set()
cid = 0
for y in range(Hh):
    for x in range(W):
        if not water[y][x] or comp[y][x] >= 0:
            continue
        q, cells, edge = deque([(x, y)]), [], False
        comp[y][x] = cid
        while q:
            cx, cy = q.popleft()
            cells.append((cx, cy))
            edge |= cx in (0, W - 1) or cy in (0, Hh - 1)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < W and 0 <= ny < Hh and water[ny][nx] and comp[ny][nx] < 0:
                    comp[ny][nx] = cid
                    q.append((nx, ny))
        if not edge and len(cells) <= par['golEnFazla']:
            lake |= set(cells)
        cid += 1

R = par['darYaricap']
def land(x, y):
    return 0 <= x < W and 0 <= y < Hh and grid[y][x] > 0
def narrow(x, y):
    """Dar su: dört eksenin en az `darEksen` tanesinde iki yanda da `darYaricap` içinde kara (nehir); kıyı şeridi değil."""
    hits = 0
    for dx, dy in ((1, 0), (0, 1), (1, 1), (1, -1)):
        a = any(land(x + dx * i, y + dy * i) for i in range(1, R + 1))
        b = any(land(x - dx * i, y - dy * i) for i in range(1, R + 1))
        hits += a and b
    return hits >= par['darEksen']

swim = [[1 if water[y][x] and ((x, y) in lake or narrow(x, y)) else 0 for x in range(W)] for y in range(Hh)]

labels = [e for e in json.load(open(H('etiketler.json'), encoding='utf-8'))['etiketler'] if e['tip'] in ('bolge', 'ada')]
seeds = []
for i, e in enumerate(labels):
    cx, cy = int(e['x'] // CELL), int(e['y'] // CELL)
    best = min(((abs(x - cx) + abs(y - cy), x, y) for y in range(max(0, cy - 12), min(Hh, cy + 13)) for x in range(max(0, cx - 12), min(W, cx + 13)) if grid[y][x] > 0), default=None)
    seeds.append((best[1], best[2]) if best else (cx, cy))
reg = [[0] * W for _ in range(Hh)]
dist = {}
q = []
for i, (x, y) in enumerate(seeds):
    dist[(x, y)] = 0
    reg[y][x] = i + 1
    heapq.heappush(q, (0, x, y, i + 1))
SW = par['yuzmeMaliyet']
while q:
    d, x, y, r = heapq.heappop(q)
    if d > dist.get((x, y), 1e18):
        continue
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if not (0 <= nx < W and 0 <= ny < Hh):
            continue
        c = grid[ny][nx] or (SW if swim[ny][nx] else 0)
        if not c:
            continue
        nd = d + c
        if nd < dist.get((nx, ny), 1e18):
            dist[(nx, ny)] = nd
            reg[ny][nx] = r
            heapq.heappush(q, (nd, nx, ny, r))
for y in range(Hh):
    for x in range(W):
        if (grid[y][x] or swim[y][x]) and not reg[y][x]:
            reg[y][x] = 1 + min(range(len(seeds)), key=lambda i: (seeds[i][0] - x) ** 2 + (seeds[i][1] - y) ** 2)

# Kuyruk K57: buz bölgelerinde (Karkedon) buz yarıkları, buzul duvarları ve kar gölgeli uçurumlar da mavi baskın görünür ve
# "dar su" sayılıyordu. Bu bölgelerde yüzme yalnızca canlı turkuaz suda (HSV doygunluk ≥ doygunluk, parlaklık ≥ parlaklik,
# ton ≤ tonEnFazla) ve en az `enAzHucre` hücrelik bitişik kümede kalır; ayıklanan hücre ne kara ne su (geçilmez, bölgesiz).
import colorsys
buz = par.get('buzSu')
if buz:
    ids = [e['id'] for e in labels]
    rx = {ids.index(i) + 1 for i in buz['bolgeler'] if i in ids}

    def avg(x, y):
        r = gg = b = n = 0
        for yy in range(int(y * k), min(img.height, int((y + 1) * k))):
            for xx in range(int(x * k), min(img.width, int((x + 1) * k))):
                p = px[xx, yy]
                r += p[0]; gg += p[1]; b += p[2]; n += 1
        return colorsys.rgb_to_hsv(r / n / 255, gg / n / 255, b / n / 255)

    def vivid(x, y):
        hh, ss, vv = avg(x, y)
        return ss >= buz['doygunluk'] and vv >= buz['parlaklik'] and hh <= buz['tonEnFazla']

    cand = {(x, y) for y in range(Hh) for x in range(W) if swim[y][x] and reg[y][x] in rx and vivid(x, y)}
    keep, seen = set(), set()
    for c0 in cand:
        if c0 in seen:
            continue
        st, comp = [c0], []
        seen.add(c0)
        while st:
            a = st.pop()
            comp.append(a)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    nb = (a[0] + dx, a[1] + dy)
                    if nb in cand and nb not in seen:
                        seen.add(nb)
                        st.append(nb)
        if len(comp) >= buz['enAzHucre']:
            keep |= set(comp)
    dropped = 0
    for y in range(Hh):
        for x in range(W):
            if swim[y][x] and reg[y][x] in rx and (x, y) not in keep:
                swim[y][x] = 0
                reg[y][x] = 0
                dropped += 1
    print('buz bölgelerinde ayıklanan yüzme hücresi', dropped, 'kalan', len(keep))


def rle(row):
    out = []
    for v in row:
        if out and out[-2] == v:
            out[-1] += 1
        else:
            out += [v, 1]
    return out


boxes = {}
for y in range(Hh):
    for x in range(W):
        r = reg[y][x]
        if r:
            b = boxes.setdefault(r, [x, y, x, y])
            b[0], b[1], b[2], b[3] = min(b[0], x), min(b[1], y), max(b[2], x), max(b[3], y)
out = {
    'not': 'K49 D: dünya bölgeleri (satirlar: 0 yok, 1.. bolgeler sırası) ve yüzülebilir dar su (yuzme: 1). `python scripts/k49-bolgeler.py` üretir; elle düzenlenmez.',
    'hucre': CELL, 'genislik': W, 'yukseklik': Hh,
    'bolgeler': [{'id': e['id'], 'tr': e['tr'], 'en': e['en'], 'kutu': [b[0] * CELL, b[1] * CELL, (b[2] + 1) * CELL, (b[3] + 1) * CELL]}
                 for i, e in enumerate(labels) for b in [boxes.get(i + 1, [0, 0, 0, 0])]],
    'satirlar': [rle(r) for r in reg],
    'yuzme': [rle(r) for r in swim],
}
json.dump(out, open(H('bolge-izgara.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('yüzme hücresi', sum(map(sum, swim)), 'göl', len(lake), 'bölge', [(e['id'], sum(r.count(i + 1) for r in reg)) for i, e in enumerate(labels)])
