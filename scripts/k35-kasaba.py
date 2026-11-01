#!/usr/bin/env python3
"""Kuyruk 35: kasaba seti haritaları (harita/yerlesim/kasaba-demirci-tapinak.json, kasaba-lagim.json). Zemin elle,
etiketli ızgaradan okundu (npx vite-node scripts/harita-etiket.ts <görsel> <çıktı> --boyut 21x11). Koordinatlar 0 tabanlı.
    python3 scripts/k35-kasaba.py
Zemin harfleri k34a-yerlesim.py ile aynı; lağımda kanal ve havuz 'w' (derin su, zorlu; K24d derin su sınırı kıyıdan
3 altıgende başlar, lağım kanalları dar olduğundan yürünebilir), köprüler 'p'.
"""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'harita' / 'yerlesim'
HIDE = {
    'terrain': {'g': 0},
    'adjacentTo': {'s': 0, 'm': 0, 'x': 0, 'a': 0, 'r': 0},
    'note': 'Yerleşim: duvar, sütun, sandık, varil, ağaç ve kaya dibinde; çit ve çalılıkta gizlenilir.',
}


def grid(cols=21, rows=11, fill='.'):
    return [[fill] * cols for _ in range(rows)]


def put(g, ch, cells):
    for c, r in cells:
        g[r][c] = ch


def zone(hexes):
    cs = [c for c, _ in hexes]
    return {'colRange': [min(cs) + 1, max(cs) + 1], 'hexes': [[c + 1, r + 1] for c, r in hexes]}


def demirci():
    g = grid()
    for r in range(0, 4):
        for c in range(0, 8):
            g[r][c] = 's'
    put(g, 'a', [(0, 0), (2, 0), (4, 0), (6, 0), (14, 0), (14, 1), (15, 3), (16, 6), (0, 9), (0, 10), (1, 10), (2, 10), (3, 10), (19, 10), (20, 10), (20, 9)])
    put(g, 'm', [(1, 4)])  # ocak
    put(g, 'x', [(0, 4), (2, 5), (3, 4), (4, 4), (6, 4), (7, 4), (5, 5), (6, 5), (3, 6), (0, 6), (0, 7), (2, 8), (3, 8), (5, 8), (1, 8),
                 (9, 2), (9, 3), (8, 3), (12, 2), (12, 3), (13, 3), (12, 4), (9, 4), (11, 5), (12, 5), (12, 6), (12, 8)])
    put(g, 'g', [(1, 9), (3, 9), (13, 1), (13, 2), (13, 4), (13, 5), (13, 6), (13, 7), (14, 4), (15, 5), (19, 5)])
    put(g, 's', [(4, 10), (5, 9), (5, 10), (6, 10), (7, 10), (15, 10), (16, 10), (17, 10), (13, 8), (15, 8), (19, 8)])
    for r in range(0, 3):
        for c in range(15, 21):
            g[r][c] = 's'
    put(g, 's', [(16, 3), (19, 3), (16, 4), (19, 4)])
    put(g, 'm', [(17, 3), (18, 3), (15, 6)])  # sunak, kuyu
    players = [(10, 8), (11, 8), (10, 9), (11, 9), (9, 8), (12, 9)]
    enemies = [(10, 2), (11, 2), (10, 3), (11, 3), (10, 4), (11, 4)]
    return g, players, enemies


def lagim():
    g = grid()
    for c in range(21):
        g[0][c] = 's'
    put(g, 's', [(3, 1), (6, 1), (17, 1), (0, 4), (0, 7), (20, 4), (4, 10), (5, 10), (6, 10), (14, 10), (15, 10), (16, 10), (17, 10), (18, 10)])
    for r in range(0, 4):
        for c in (9, 10, 11):
            g[r][c] = 'w'
    put(g, 'p', [(9, 2), (10, 2), (11, 2)])  # üst köprü
    for r in range(4, 7):
        for c in range(6, 16):
            g[r][c] = 'w'  # orta havuz
    for r in range(7, 11):
        for c in (9, 10, 11):
            g[r][c] = 'w'  # alt kanal
    put(g, 'p', [(9, 7), (10, 7), (11, 7), (10, 8)])  # alt köprü
    put(g, 'x', [(1, 1), (1, 2), (0, 2), (19, 2), (20, 2), (3, 9), (1, 9), (0, 9), (20, 8), (20, 9)])
    players = [(1, 3), (2, 3), (3, 3), (2, 2), (3, 2), (1, 4)]
    enemies = [(18, 8), (17, 8), (18, 9), (17, 9), (16, 8), (19, 8)]
    return g, players, enemies


def write(mid, name, name_en, g, players, enemies, variants, env, tasarim):
    for c, r in players + enemies:
        assert g[r][c] in '.p', (mid, c, r, g[r][c])
    d = {
        'id': mid, 'bolge': 'yerlesim', 'gorsel': f'yerlesim/{mid}', 'name': name, 'nameEn': name_en, 'environmentId': env,
        'orientation': 'flat-top', 'offset': 'odd-q', 'size': {'cols': 21, 'rows': 11}, 'hexFeet': 5,
        'startZones': {'players': zone(players), 'enemies': zone(enemies), 'note': 'Kuyruk 35: parti meydan tarafından (kapı), düşman karşı uçta.'},
        'mirrorable': False, 'hide': HIDE, 'variants': variants, 'tiles': [''.join(x) for x in g], 'notes': {'tasarim': tasarim},
    }
    (OUT / f'{mid}.json').write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(mid)


g, p, e = demirci()
write('kasaba-demirci-tapinak', 'Demirci ve Tapınak', 'Smithy and Temple', g, p, e, [
    {'id': 'gunduz', 'name': 'Gündüz', 'nameEn': 'Day', 'image': 'maps/yerlesim/kasaba-demirci-tapinak.webp', 'rules': [], 'effects': []},
    {'id': 'gece', 'name': 'Gece', 'nameEn': 'Night', 'image': 'maps/yerlesim/kasaba-demirci-tapinak-gece.webp',
     'rules': [{'id': 'night', 'lights': [[2, 5], [9, 9], [18, 4], [19, 4]], 'lightRadiusHexes': 2, 'passivePerceptionPenalty': 5, 'hideAdvantage': True,
                'note': 'Gece: demirci ocağı, fener ve tapınak mumlarının 2 altıgeni aydınlık.'}],
     'effects': [{'type': 'flicker', 'intensity': 0.5}]},
], 'd-z-zemin', 'Kasaba sokağı: batıda demirci (bina geçilmez, ocak ve kuyu geçilmez, örs/sandık/varil siper), ortada kaldırım yol, doğuda tapınak (sunak geçilmez) ve bahçe; çit ve çalılar zorlu. Güney yolu meydana, kuzey yolu hub\'a.')
g, p, e = lagim()
write('kasaba-lagim', 'Kasaba Lağımı', 'Town Sewers', g, p, e, [
    {'id': 'karanlik', 'name': 'Karanlık lağım', 'nameEn': 'Dark sewers', 'image': 'maps/yerlesim/kasaba-lagim.webp',
     'rules': [{'id': 'darkness', 'unlitSightHexes': 3, 'darkvisionHexes': 12, 'lightRadiusHexes': 3, 'lights': [[5, 2], [16, 2]],
                'unseenTargetsUntargetable': True, 'unseenAttackerAdvantage': True,
                'note': 'Karanlık lağım: yalnızca iki meşalenin çevresi aydınlık; ışıksız altıgende karanlık görüşü olmayan 3 altıgen görür.'}],
     'effects': [{'type': 'drip', 'intensity': 0.4}]},
], 'yeralt-ma-ara', 'Kasaba lağımı: üst ve alt yürüme yolları, ortada kanal ve havuz (derin su, zorlu), iki köprü; batıda meydana çıkan merdiven (kapı).')
