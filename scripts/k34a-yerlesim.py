#!/usr/bin/env python3
"""Kuyruk 34a: yerleşim haritaları (harita/yerlesim/<id>.json). Zemin elle, etiketli ızgaradan okundu
(npx vite-node scripts/harita-etiket.ts <görsel> <çıktı> --boyut 21x11). Koordinatlar 0 tabanlı (sütun, satır).
    python3 scripts/k34a-yerlesim.py
Zemin: '.' açık, 'p' kaldırım/köprü, 's' duvar/sur (geçilmez), 'w' hendek suyu (zorlu), 't' kuru hendek (zorlu),
'x' sandık/varil/araba/çadır (yarım siper, zorlu), 'm' sütun/heykel/kuyu ağzı (geçilmez, tam siper), 'a' ağaç,
'g' çit/çalı (zorlu, yarım siper), 'r' kaya, 'o' kapı/geçit, 'n' sığ havuz (zorlu), 'l' kürsü basamağı.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'harita' / 'yerlesim'


def grid(cols, rows, fill='.'):
    return [[fill] * cols for _ in range(rows)]


def put(g, ch, cells):
    for c, r in cells:
        g[r][c] = ch


def row(g, r, ch, c0=0, c1=None):
    for c in range(c0, (c1 if c1 is not None else len(g[0]) - 1) + 1):
        g[r][c] = ch


EVEN = lambda c: c % 2 == 0

HIDE = {
    'terrain': {'g': 0},
    'adjacentTo': {'s': 0, 'm': 0, 'x': 0, 'a': 0, 'r': 0},
    'note': 'Yerleşim: sur, sütun, heykel, sandık, araba, ağaç ve kaya dibinde; çit ve çalılıkta gizlenilir.',
}


def night(lights):
    return {'id': 'night', 'lights': [[c + 1, r + 1] for c, r in lights], 'lightRadiusHexes': 2, 'passivePerceptionPenalty': 5, 'hideAdvantage': True,
            'note': 'Gece: meşale ve fenerlerin 2 altıgeni aydınlık. Işıksız altıgende gizlenene karşı karanlık görüşü olmayan gözcünün pasif Algısı −5, Gizlen zarı avantajlı.'}


def variants(mid, lights, day_fx=None):
    if lights is None:  # tek sürüm iç mekân (taht salonu)
        return [{'id': 'ic-mekan', 'name': 'İç mekân', 'nameEn': 'Indoors', 'image': f'maps/yerlesim/{mid}.webp', 'rules': [], 'effects': [{'type': 'flicker', 'intensity': 0.4}]}]
    v = [{'id': 'gunduz', 'name': 'Gündüz', 'nameEn': 'Day', 'image': f'maps/yerlesim/{mid}.webp', 'rules': [], 'effects': day_fx or []}]
    if lights is not None:
        v.append({'id': 'gece', 'name': 'Gece', 'nameEn': 'Night', 'image': f'maps/yerlesim/{mid}-gece.webp', 'rules': [night(lights)],
                  'effects': [{'type': 'flicker', 'intensity': 0.5}]})
    return v


def zone(hexes, rng):
    return {'colRange': rng, 'hexes': [[c + 1, r + 1] for c, r in hexes]}


# ------------------------------------------------------------------ kale-onu (21×11)
def kale_onu():
    g = grid(21, 11)
    row(g, 0, 's'); g[0][10] = 'p'
    row(g, 1, 's'); g[1][10] = 'o'; g[1][0] = 'w'; g[1][20] = 'w'
    row(g, 2, 's'); g[2][10] = 'o'; g[2][0] = 'w'; g[2][20] = 'w'; g[2][19] = 'w'
    row(g, 3, 'w'); g[3][10] = 'p'
    for c in range(21):
        g[4][c] = 'w' if EVEN(c) else '.'
    g[4][0] = '.'; g[4][20] = '.'; g[4][10] = 'p'
    # kamp (batı): yıkık duvarlar, çadırlar, barikat, sandıklar, araba
    put(g, 'k', [(2, 5), (3, 5), (1, 6), (1, 8), (6, 5), (7, 5), (7, 6), (7, 8), (5, 9), (6, 9), (1, 9), (2, 9)])
    put(g, 'x', [(2, 6), (2, 8), (4, 6), (5, 8), (6, 6), (7, 9), (6, 10)])
    # doğu: balista, sandıklar, kayalar; köşelerde ağaç
    put(g, 'x', [(16, 7), (18, 6), (18, 8)])
    put(g, 'r', [(19, 5), (19, 9)])
    put(g, 'a', [(0, 10), (1, 10), (19, 10), (20, 10)])
    players = [(c, r) for r in (9, 10) for c in (8, 9, 10, 11, 12)]
    enemies = [(c, r) for r in (5, 6) for c in (12, 13, 14, 15, 16)]
    return g, players, enemies, [(10, 2), (8, 1), (12, 1), (4, 7)], {
        'name': 'Kale Önü', 'nameEn': 'Before the Castle',
        'tasarim': 'Kral Kalesi önü: sur ve kapı kulesi geçilmez; hendek suyu zorlu zemin (w); taş köprü (10. sütun) ve kapı ana yol; batıda kuşatma kampı, doğuda balista.',
    }


# ------------------------------------------------------------------ kale-avlu (21×11)
def kale_avlu():
    g = grid(21, 11)
    for r in range(11):
        for c in (0, 1, 19, 20):
            g[r][c] = 's'
    row(g, 0, 's'); row(g, 1, 's')
    put(g, 's', [(8, 2), (9, 2), (10, 2), (11, 2), (12, 2), (8, 3), (12, 3)])
    g[3][10] = 'p'  # donjon kapısı (nesne: kapı)
    put(g, 'x', [(2, 3), (3, 3), (6, 3), (14, 3), (16, 3), (17, 3), (18, 3), (17, 2), (12, 4), (17, 4), (18, 4),
                 (2, 4), (2, 5), (2, 6), (3, 5), (14, 5), (16, 5), (17, 5), (18, 5), (5, 6), (14, 6), (15, 6), (18, 6),
                 (3, 7), (6, 7), (7, 7), (8, 7), (16, 7), (17, 7), (13, 7), (15, 7)])
    put(g, 'm', [(5, 3)])  # kuyu
    put(g, 's', [(9, 7), (11, 7)])
    row(g, 8, 's'); g[8][10] = 'o'
    row(g, 9, 's'); g[9][10] = 'o'
    for c in range(21):
        g[10][c] = 's' if c <= 2 or c >= 18 else 'w'
    g[10][10] = 'p'
    players = [(c, r) for r in (6, 7) for c in (9, 10, 11, 12)] + [(10, 8), (10, 9)]
    enemies = [(c, r) for r in (3, 4) for c in (7, 8, 9, 10, 11, 13)]
    return g, players, enemies, [(3, 7), (10, 4), (2, 3), (19, 4)], {
        'name': 'Kale Avlusu', 'nameEn': 'Castle Courtyard',
        'tasarim': 'Dış sur, kuleler ve donjon geçilmez; avlu açık. Donjon kapısı (10,3; nesne `donjon-kapi`) K34b geçişi için işaretli. Güneyde kapı evi ve köprü.',
    }, [{'id': 'donjon-kapi', 'kind': 'door', 'at': [11, 4], 'state': 'closed', 'note': 'K34b: taht salonuna geçiş.'}]


# ------------------------------------------------------------------ kale-taht-salonu (15×7)
def taht():
    g = grid(15, 7)
    row(g, 0, 's')
    for r in range(7):
        g[r][0] = 's'; g[r][14] = 's'
    for c in range(1, 14, 2):
        g[6][c] = 's'
    g[6][7] = 'o'  # güney çift kapı (çıkış)
    dais = [(5, 0), (9, 0), (6, 1), (7, 1), (8, 1), (6, 2), (8, 2)]
    put(g, 'l', dais)
    g[0][7] = 'm'  # taht
    put(g, 'x', [(4, 1), (10, 1), (12, 1), (11, 2), (1, 3), (13, 3), (11, 4), (13, 4), (2, 5), (3, 5), (12, 5), (10, 6)])
    put(g, 'm', [(5, 2), (5, 3), (5, 4), (9, 2), (9, 3), (9, 4)])
    heights = [[0] * 15 for _ in range(7)]
    for c, r in dais + [(7, 0)]:
        heights[r][c] = 1
    players = [(c, r) for r in (5, 6) for c in (6, 7, 8)] + [(4, 5), (10, 5)]
    enemies = [(c, r) for r in (1, 2) for c in (3, 6, 7, 8, 11)]
    players = [p for p in players if g[p[1]][p[0]] not in 'sxm']
    return g, players, enemies, heights, {
        'name': 'Taht Salonu', 'nameEn': 'Throne Room',
        'tasarim': 'İç mekân, tek sürüm. Kürsü yükseklik 1 (heights katmanı; basamak l), taht geçilmez; sütunlar (m) geçilmez ve tam siper; güney çift kapı (7,6) çıkış.',
    }


# ------------------------------------------------------------------ kasaba-han (21×11)
def han():
    g = grid(21, 11)
    for r in (0, 1, 2):
        row(g, r, 's', 0, 12)
    for r in (3, 4):
        row(g, r, 's', 0, 3)
    for r in (0, 1, 2, 3):
        row(g, r, 's', 14, 18)
    for r in range(1, 7):
        g[r][19] = 's'; g[r][20] = 's'
    put(g, 'p', [(5, 3), (6, 3), (7, 3)])
    put(g, 'x', [(4, 3), (8, 3), (4, 4), (3, 4), (2, 5), (4, 5), (12, 2), (10, 3), (14, 2), (11, 4), (12, 4), (11, 5), (12, 5),
                 (17, 3), (15, 7), (16, 7), (1, 7), (2, 7), (2, 8), (3, 8), (19, 6)])
    put(g, 'm', [(14, 6)])  # kuyu
    put(g, 'x', [(13, 5)])
    for c in (1, 3, 5, 7, 11, 13, 15):
        g[9][c] = 'g'
    g[9][9] = 'o'  # güney kapı
    put(g, 'a', [(0, 9), (0, 10), (1, 10), (17, 8), (17, 9), (18, 8), (19, 7), (20, 8), (18, 9), (19, 9), (20, 9), (18, 10), (19, 10), (20, 10)])
    put(g, 'r', [(2, 10), (3, 10), (16, 10)])
    put(g, 'g', [(5, 10), (13, 10)])
    players = [(c, r) for r in (10,) for c in (7, 8, 9, 10, 11, 12)] + [(8, 9), (10, 9)]
    enemies = [(c, r) for r in (4, 5) for c in (5, 6, 7, 8, 9, 10)]
    return g, players, enemies, [(1, 5), (7, 8), (11, 8), (10, 2), (0, 6)], {
        'name': 'Kasaba Hanı', 'nameEn': 'Town Inn',
        'tasarim': 'Han binası, ev, ahır ve sağdaki ambar geçilmez; çit (g, zorlu) güneyi kapatır, kapı (9,9) çıkış. Kuyu geçilmez; araba, yalak, varil ve sandıklar siper.',
    }


# ------------------------------------------------------------------ beyaz-sehir-dis-kapi (21×11)
def dis_kapi():
    g = grid(21, 11)
    for r in (0, 1, 2):
        row(g, r, 's')
    for c in range(21):
        g[3][c] = 's' if EVEN(c) else '.'
    put(g, 's', [(9, 3), (11, 3)])
    g[0][10] = 'p'; g[1][10] = 'o'; g[2][10] = 'o'; g[3][10] = 'p'
    row(g, 4, 't'); g[4][10] = 'p'
    for c in range(0, 21, 2):
        g[5][c] = 't'
    g[5][10] = 'p'
    put(g, 'x', [(2, 6), (1, 7), (1, 8), (3, 8), (3, 6), (4, 6), (5, 6), (4, 7), (2, 9), (0, 8), (4, 9),
                 (7, 6), (8, 6), (6, 7), (5, 9), (13, 6), (13, 7), (14, 8), (15, 9),
                 (16, 6), (15, 6), (16, 7), (17, 6), (18, 6), (18, 7), (18, 8), (18, 9)])
    put(g, 'a', [(1, 5), (0, 6), (19, 5), (20, 6), (20, 9)])
    players = [(c, r) for r in (9, 10) for c in (7, 8, 9, 10, 11, 12)]
    enemies = [(c, r) for r in (6, 7) for c in (9, 10, 11, 12)] + [(14, 7), (15, 8)]
    return g, players, enemies, [(8, 2), (12, 2), (3, 7), (17, 7)], {
        'name': 'Beyaz Şehir Kapısı', 'nameEn': 'White City Gate',
        'tasarim': 'Beyaz sur ve kuleler geçilmez; kuru hendek (t) zorlu zemin; taş köprü (10. sütun) ve kapı ana yol. Batıda pazar çadırları, iki yanda kazıklar ve araba siper.',
    }


# ------------------------------------------------------------------ beyaz-sehir-saray-avlusu (21×11)
def saray():
    g = grid(21, 11)
    row(g, 0, 's')
    row(g, 1, 's')
    put(g, '.', [(7, 1), (8, 1), (9, 1), (10, 1), (11, 1), (12, 1), (13, 1)])
    put(g, 'a', [(1, 2), (2, 2), (4, 2), (5, 1), (5, 2), (15, 1), (15, 2), (16, 2), (18, 2), (19, 2), (2, 7), (2, 8), (18, 7), (18, 8)])
    put(g, 'g', [(3, 4), (4, 4), (6, 4), (6, 5), (16, 4), (17, 4), (14, 4), (14, 5), (4, 7), (5, 6), (4, 8), (4, 9), (5, 7),
                 (5, 8), (5, 9), (15, 6), (15, 7), (15, 8), (15, 9), (16, 7), (14, 7)])
    put(g, 'x', [(5, 3), (5, 4), (15, 3), (15, 4), (6, 8), (14, 8)])
    put(g, 'm', [(7, 3), (7, 4), (13, 3), (13, 4), (7, 6), (7, 7), (13, 6), (13, 7), (10, 5), (10, 6),
                 (0, 4), (2, 4), (0, 6), (2, 6), (18, 4), (20, 4), (18, 6), (20, 6)])
    put(g, 'n', [(10, 4), (10, 7), (10, 8), (9, 4), (9, 5), (9, 6), (9, 7), (11, 4), (11, 5), (11, 6), (11, 7)])
    put(g, 's', [(8, 9), (12, 9), (9, 10), (11, 10)])
    g[10][10] = 'o'  # güney kemerli kapı
    players = [(c, r) for r in (9, 10) for c in (5, 6, 7, 13, 14, 15)] + [(10, 9), (10, 10)]
    players = [p for p in players if g[p[1]][p[0]] in '.o']
    enemies = [(c, r) for r in (1, 2, 3) for c in (8, 9, 10, 11, 12)]
    enemies = [e for e in enemies if g[e[1]][e[0]] == '.']
    return g, players, enemies, [(8, 1), (12, 1), (6, 3), (14, 3), (8, 9), (12, 9)], {
        'name': 'Saray Avlusu', 'nameEn': 'Palace Courtyard',
        'tasarim': 'Saray cephesi geçilmez, merdivenler geçilir; havuz sığ su (n, zorlu), çeşme geçilmez; heykeller ve sütunlar tam siper, ağaçlar geçilmez, çit ve çiçeklikler (g) zorlu yarım siper; güney kemerli kapı (10,10) çıkış.',
    }


def write(mid, g, players, enemies, lights, meta, objects=None, heights=None, night_ok=True, env='d-z-zemin', ad=None):
    ad = ad or mid  # dosya/görsel adı (kale-avlu kimliği geniş haritada: yeni kimlik kale-ic-avlu, ad kale-avlu)
    players = [x for x in players if g[x[1]][x[0]] in '.pol']
    enemies = [x for x in enemies if g[x[1]][x[0]] in '.pol']
    assert len(players) >= 6 and len(enemies) >= 6, (mid, len(players), len(enemies))
    rows, cols = len(g), len(g[0])
    d = {
        'id': mid, 'bolge': 'yerlesim', 'gorsel': f'yerlesim/{ad}', 'name': meta['name'], 'nameEn': meta['nameEn'],
        'environmentId': env, 'orientation': 'flat-top', 'offset': 'odd-q', 'size': {'cols': cols, 'rows': rows}, 'hexFeet': 5,
        'startZones': {
            'players': zone(players, [min(c for c, _ in players) + 1, max(c for c, _ in players) + 1]),
            'enemies': zone(enemies, [min(c for c, _ in enemies) + 1, max(c for c, _ in enemies) + 1]),
            'note': 'Kuyruk 34a: parti güneyden (çıkış/kapı tarafı), düşman kuzeyden.',
        },
       'hide': HIDE,
        'variants': variants(ad, lights if night_ok else None),
        'tiles': [''.join(x) for x in g],
        'notes': {'tasarim': meta['tasarim']},
    }
    if heights:
        d['heights'] = heights
    if objects:
        d['objects'] = objects
    (OUT / f'{ad}.json').write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(mid, f'{cols}x{rows}', len(players), len(enemies))


OUT.mkdir(parents=True, exist_ok=True)
g, p, e, l, m = kale_onu(); write('kale-onu', g, p, e, l, m)
g, p, e, l, m, o = kale_avlu(); write('kale-ic-avlu', g, p, e, l, m, objects=o, ad='kale-avlu')
g, p, e, h, m = taht(); write('kale-taht-salonu', g, p, e, None, m, heights=h, night_ok=False)
g, p, e, l, m = han(); write('kasaba-han', g, p, e, l, m)
g, p, e, l, m = dis_kapi(); write('beyaz-sehir-dis-kapi', g, p, e, l, m)
g, p, e, l, m = saray(); write('beyaz-sehir-saray-avlusu', g, p, e, l, m)
