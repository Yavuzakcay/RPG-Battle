"""
K49 C5: bölgeler arası yollar. Yürüme ızgarası (data/harita/yurume-izgara.json) üstünde A* ile komşu bölge çiftlerinin
(komsuluk-grafi.json kenarlar) temsilci yerleşimleri arasındaki en ucuz yolu bulur; mevcut yol ağı (yol-katmani.json)
üstündeki uzaklıkla karşılaştırır. Yol ağıyla bağlı olmayan ya da yol ağı A*'tan çok dolambaçlı olan (oran > ESIK) çiftler
"zayıf"tır: A* yolu (geçit kapılarından geçerek) sadeleştirilip `yol-katmani.json`a `kaynak: "K49 A*"` ile eklenir.
Sonra `python scripts/yurume-izgara.py` yeniden çalıştırılır ve maliyetler tekrar ölçülür (rapor harita/belgeler/bolge-yollari.md).

    python scripts/k49-bolge-yollari.py [--kuru]
"""
import heapq
import json
import math
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = lambda *p: os.path.join(ROOT, 'data', 'harita', *p)
ESIK = 1.6        # yol ağı uzunluğu / A* uzunluğu
YOL_ORANI = 0.5   # A* yolunun yol hücresi (maliyet 10) oranı bunun altındaysa geçiş pahalı
DRY = '--kuru' in sys.argv

# Bölgenin temsilci yerleşimi (yol-katmani dugumler) ya da noktası.
TEMSILCI = {
    'buzul': 'goliath_kalesi', 'dag': 'cuce_kalesi', 'bati_kiyi': 'beyaz_sehir', 'bati_liman': 'liman',
    'orman': 'elf_kasabasi', 'bataklik': 'gnom_kasabasi', 'kral_kalesi_yarimadasi': 'kral_kalesi', 'col': 'tiefling_girisi',
}


def load_grid():
    g = json.load(open(H('yurume-izgara.json'), encoding='utf-8'))
    rows = []
    for rle in g['satirlar']:
        row = []
        for v, n in zip(rle[0::2], rle[1::2]):
            row.extend([v] * n)
        rows.append(row)
    return g['hucre'], rows


def astar(grid, cell, a, b):
    W, Hh = len(grid[0]), len(grid)
    def snap(p):
        x, y = int(p[0] // cell), int(p[1] // cell)
        best = None
        for r in range(0, 8):
            for dx in range(-r, r + 1):
                for dy in range(-r, r + 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < W and 0 <= ny < Hh and grid[ny][nx]:
                        d = dx * dx + dy * dy
                        if best is None or d < best[0]:
                            best = (d, (nx, ny))
            if best:
                return best[1]
        return (x, y)
    s, t = snap(a), snap(b)
    dist = {s: 0.0}
    prev = {}
    q = [(0.0, s)]
    while q:
        d, u = heapq.heappop(q)
        if u == t:
            break
        if d > dist.get(u, 1e18):
            continue
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            nx, ny = u[0] + dx, u[1] + dy
            if not (0 <= nx < W and 0 <= ny < Hh) or not grid[ny][nx]:
                continue
            nd = d + grid[ny][nx] * (1.4142 if dx and dy else 1.0)
            if nd < dist.get((nx, ny), 1e18):
                dist[(nx, ny)] = nd
                prev[(nx, ny)] = u
                h = math.hypot(t[0] - nx, t[1] - ny) * 10
                heapq.heappush(q, (nd + h * 0, (nx, ny)))
    if t not in dist:
        return None, None
    path, u = [t], t
    while u != s:
        u = prev[u]
        path.append(u)
    path.reverse()
    return dist[t], [[p[0] * cell + cell // 2, p[1] * cell + cell // 2] for p in path]


def plen(pts):
    return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:]))


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (ax, ay), (bx, by) = pts[0], pts[-1]
    L = math.hypot(bx - ax, by - ay) or 1
    dmax, idx = 0, 0
    for i, (px, py) in enumerate(pts[1:-1], 1):
        d = abs((by - ay) * px - (bx - ax) * py + bx * ay - by * ax) / L
        if d > dmax:
            dmax, idx = d, i
    if dmax <= eps:
        return [pts[0], pts[-1]]
    return rdp(pts[:idx + 1], eps)[:-1] + rdp(pts[idx:], eps)


def road_graph(roads, hubs=()):
    """Yol noktaları düğüm (64 px içinde birleşir); kenar ağırlığı çizgi uzunluğu. Yerleşim merkezi (`hubs`) kavşaktır:
    320 px içindeki yol uçlarına bağlanır (kasaba içi sokaklar ızgarada yok)."""
    nodes = []
    def nid(p):
        for i, q in enumerate(nodes):
            if math.hypot(p[0] - q[0], p[1] - q[1]) < 64:
                return i
        nodes.append(p)
        return len(nodes) - 1
    adj = {}
    for r in roads:
        pts = r['noktalar']
        ids = [nid(p) for p in pts]
        for (i, j), a, b in zip(zip(ids, ids[1:]), pts, pts[1:]):
            w = math.hypot(b[0] - a[0], b[1] - a[1])
            adj.setdefault(i, []).append((j, w))
            adj.setdefault(j, []).append((i, w))
    ends = {nid(r['noktalar'][0]) for r in roads} | {nid(r['noktalar'][-1]) for r in roads}
    for h in hubs:
        hi = nid(list(h))
        for e in list(ends):
            w = math.hypot(nodes[e][0] - h[0], nodes[e][1] - h[1])
            if e != hi and w < 320:
                adj.setdefault(hi, []).append((e, w))
                adj.setdefault(e, []).append((hi, w))
    return nodes, adj


def road_dist(roads, a, b, hubs=()):
    nodes, adj = road_graph(roads, hubs)
    near = lambda p: min(range(len(nodes)), key=lambda i: math.hypot(nodes[i][0] - p[0], nodes[i][1] - p[1]))
    s, t = near(a), near(b)
    gap = math.hypot(nodes[s][0] - a[0], nodes[s][1] - a[1]) + math.hypot(nodes[t][0] - b[0], nodes[t][1] - b[1])
    if gap > 400:
        return None
    dist = {s: 0}
    q = [(0, s)]
    while q:
        d, u = heapq.heappop(q)
        if u == t:
            return d + gap
        if d > dist[u]:
            continue
        for v, w in adj.get(u, []):
            if d + w < dist.get(v, 1e18):
                dist[v] = d + w
                heapq.heappush(q, (d + w, v))
    return None


def measure(roads, edges, dug, label):
    cell, grid = load_grid()
    out = []
    for e in edges:
        a, b = dug[TEMSILCI[e['a']]], dug[TEMSILCI[e['b']]]
        c1, p1 = astar(grid, cell, a, e['kapi_a'])
        c2, p2 = astar(grid, cell, e['kapi_b'], b)
        c3, p3 = astar(grid, cell, e['kapi_a'], e['kapi_b'])
        if None in (c1, c2, c3):
            out.append((e, None, None, None, None, None))
            continue
        path = p1 + p3[1:] + p2[1:]
        rd = road_dist(roads, a, b, dug.values())
        frac = sum(1 for x, y in path if grid[y // cell][x // cell] == 10) / len(path)
        out.append((e, c1 + c2 + c3, plen(path), rd, path, frac))
    return out


def main():
    edges = json.load(open(H('komsuluk-grafi.json'), encoding='utf-8'))['kenarlar']
    yk = json.load(open(H('yol-katmani.json'), encoding='utf-8'))
    dug = yk['dugumler']
    before = measure(yk['yollar'], edges, dug, 'once')
    added = []
    for i, (e, cost, L, rd, path, frac) in enumerate(before):
        if cost is None:
            continue
        weak = rd is None or rd / L > ESIK or frac < YOL_ORANI
        rid = f"k49-{e['a']}-{e['b']}-{i + 1}"
        if weak and not any(r['id'] == rid for r in yk['yollar']):
            pts = [[int(x), int(y)] for x, y in rdp(path, 40)]
            mil = round(plen(pts) / 40)
            added.append({'id': rid, 'tur': 'patika', 'noktalar': pts, 'mil': mil, 'kaynak': 'K49 A*', 'yaya_gun': round(mil / 24, 1)})
    if not DRY and added:
        yk['yollar'].extend(added)
        json.dump(yk, open(H('yol-katmani.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        subprocess.run([sys.executable, os.path.join(ROOT, 'scripts', 'yurume-izgara.py')], check=True)
    after = measure(yk['yollar'], edges, dug, 'sonra') if not DRY else before
    lines = ['# Bölgeler arası yollar (K49 C5)', '',
             '`python scripts/k49-bolge-yollari.py` üretir. Komşu bölge çiftleri `komsuluk-grafi.json` kenarlarından; temsilci yerleşimler '
             'betikteki `TEMSILCI` tablosunda. A* yürüme ızgarasında (maliyet birimi: hücre × ızgara değeri; 10 yol, 20 çim, 52 orman, 80 dağ), '
             'geçit kapılarından geçerek. "Yol ağı" mevcut `yol-katmani.json` çizgileri üstündeki en kısa uzunluk (px). '
             f'Zayıf: yol ağıyla bağlı değil, yol ağı / A* uzunluğu > {ESIK} ya da en ucuz yürüyüşün yol hücresi oranı < {YOL_ORANI} (pahalı arazi).', '',
             '| Çift | Geçit | A* maliyeti önce | sonra | A* uzunluğu (px) | Yol oranı önce | sonra | Yol ağı önce (px) | sonra | Durum |', '|---|---|---|---|---|---|---|---|---|---|']
    for i, ((e, c0, L0, r0, _, q0), (_, c1, L1, r1, _, q1)) in enumerate(zip(before, after)):
        rid = f"k49-{e['a']}-{e['b']}-{i + 1}"
        st = 'yol eklendi' if any(a['id'] == rid for a in added) else ('zaten iyi' if c0 is not None else 'A* bulunamadı')
        f = lambda v: '—' if v is None else str(round(v))
        g = lambda v: '—' if v is None else f'{v:.0%}'
        lines.append(f"| {e['a']} – {e['b']} | {e['ad']} | {f(c0)} | {f(c1)} | {f(L0)} | {g(q0)} | {g(q1)} | {f(r0)} | {f(r1)} | {st} |")
    lines += ['', f'Eklenen yol: {len(added)} ({", ".join(a["id"] for a in added) or "yok"}). Görüntüleyicide `patika` türü ince çizgiyle çizilir.', '']
    open(os.path.join(ROOT, 'harita', 'belgeler', 'bolge-yollari.md'), 'w', encoding='utf-8').write('\n'.join(lines))
    print('\n'.join(lines))


main()
