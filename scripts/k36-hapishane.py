#!/usr/bin/env python3
"""Kuyruk 36: Hapishane Adası haritaları (harita/hapishane/<kimlik>.json), 21×11, tek loş varyant (mavi ışıklı karanlık).
    python3 scripts/k36-hapishane.py
Koordinatlar betikte 0 tabanlı (sütun, satır); JSON'da startZones/goals/groups/objects harita yükleyicisinin beklediği gibi
1 tabanlı (k34a/k35 betikleriyle aynı). Zemin harfleri: '.' taş zemin, 's' duvar/kule gövdesi, 'p' köprü/iskele tahtası,
'w' derin su (dış halkanın ortasındaki su dolu çukur ve deniz: K24d derin su sınırı), 'u' uçurum (adanın kayalık kenarı),
'x' sandık/masa/bank (yarım siper, zorlu), 'm' sütun (geçilmez, tam siper).
Görseller henüz yok: `npm run harita-gorsel -- <kimlik> --yer-tutucu` zeminden yer tutucu üretir; Gemini görseli
`harita/hapishane/gorsel/<kimlik>.jpg` gelince aynı komut (yer tutucusuz) kırpar.
"""
import json
import math
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'harita' / 'hapishane'
COLS, ROWS = 21, 11
HIDE = {
    'terrain': {},
    'adjacentTo': {'s': 0, 'm': 0, 'x': 0},
    'note': 'Hapishane: duvar, sütun, bank ve sandık dibinde gizlenilir; mavi fenerlerin dışı karanlık.',
}


def grid(fill='.'):
    return [[fill] * COLS for _ in range(ROWS)]


def put(g, ch, cells):
    for c, r in cells:
        g[r][c] = ch


def h1(cells):
    return [[c + 1, r + 1] for c, r in cells]


def zone(hexes):
    cs = [c for c, _ in hexes]
    return {'colRange': [min(cs) + 1, max(cs) + 1], 'hexes': h1(hexes)}


def dark(lights, note):
    return {'id': 'darkness', 'unlitSightHexes': 4, 'darkvisionHexes': 12, 'lightRadiusHexes': 2, 'lights': h1(lights),
            'unseenTargetsUntargetable': True, 'unseenAttackerAdvantage': True, 'note': note}


def obj(i, kind, at, **kw):
    o = {'kind': kind, 'at': [at[0] + 1, at[1] + 1]}
    if i:
        o = {'id': i, **o}
    o.update(kw)
    return o


def hucre():
    """Hücre platformu: batıda 3, doğuda 3 hücre; ortada nöbet salonu; güneyde büyük kapılı hedef hücre; kuzeyde köprü kapısı."""
    g = grid()
    for c in range(COLS):
        g[0][c] = 's'
        g[10][c] = 's'
    for r in range(ROWS):
        g[r][0] = 's'
        g[r][20] = 's'
    put(g, 'p', [(9, 0), (10, 0), (11, 0)])
    for side, front in ((range(1, 5), 5), (range(16, 20), 15)):
        for r in (3, 6):
            for c in side:
                g[r][c] = 's'
        for r in (1, 3, 4, 6, 7, 9):
            g[r][front] = 's'
    # Hedef hücre (güney ortada): duvar satır 8, kapı (10,8), iç (8..12, 9).
    put(g, 's', [(7, 8), (8, 8), (9, 8), (11, 8), (12, 8), (13, 8), (7, 9), (13, 9)])
    put(g, 'm', [(7, 3), (13, 3)])
    put(g, 'x', [(10, 4), (9, 4), (17, 1), (2, 9)])
    players = [(2, 1), (3, 1), (2, 4), (3, 4), (2, 7), (3, 7), (1, 1), (1, 4), (1, 7), (4, 1), (4, 4)]
    enemies = [(9, 2), (11, 2), (8, 5), (12, 5), (10, 6), (10, 2)]
    objects = [
        obj('hedefKapi', 'gate', (10, 8), state='locked', lockDc=15),
        obj('hucreAnahtari', 'key', (11, 4)),
        obj(None, 'benchLeg', (1, 2)), obj(None, 'chain', (17, 5)), obj(None, 'bucket', (6, 7)), obj(None, 'cudgel', (14, 1)),
    ]
    groups = [{'id': 'nobet', 'state': 'calm', 'hexes': h1([(c, r) for r in range(1, 8) for c in range(6, 15) if g[r][c] in '.p']), 'links': []}]
    goals = {'mode': 'any', 'list': [{'id': 'kacis', 'kind': 'veya', 'options': [
        [{'id': 'nobetciler', 'kind': 'defeat'}],
        [{'id': 'mahkumKopru', 'kind': 'reach', 'hexes': h1([(9, 0), (10, 0), (11, 0), (9, 1), (10, 1), (11, 1)]), 'ids': ['mahkum']}],
    ]}], 'fail': [{'kind': 'down', 'ids': ['mahkum']}]}
    rules = [dark([(10, 1), (10, 6), (10, 9), (3, 5), (17, 5)], 'Loş hücre bloğu: mavi fenerlerin 2 altıgeni aydınlık; karanlıkta 4 altıgen görülür.')]
    return g, players, enemies, objects, groups, goals, rules


def halka():
    """Dış halka: tam daire halka yolu, ortada su dolu derin çukur, kuzeyde köprü (platforma), kuzey kule (müdür), güneydoğu kule (iskele)."""
    g = grid()
    for c in range(COLS):
        for r in range(ROWS):
            x = (c - 10) / 10.4
            y = (r + 0.5 * (c % 2) - 5.0) / 5.9
            d = math.hypot(x, y)
            g[r][c] = 'w' if d < 0.56 else '.' if d < 0.97 else 'u'
    # Köprü: halkanın kuzey iç kenarından çukurun ortasına (platformun kuzey kapısına).
    put(g, 'p', [(10, 2), (10, 3), (10, 4), (10, 5)])
    # Kuzey kule (müdür kulesi; kapı (10,0)) ve güneydoğu kule (iskele; kapı (16,9)).
    put(g, 's', [(8, 0), (9, 0), (11, 0), (12, 0), (17, 8), (18, 8)])
    put(g, 'x', [(4, 2), (16, 2), (4, 8)])
    put(g, 'm', [(1, 5), (19, 5)])
    players = [(9, 1), (10, 1), (11, 1), (8, 1), (12, 1), (10, 2), (7, 1), (13, 1), (6, 1), (14, 1)]
    enemies = [(3, 4), (4, 6), (17, 4), (16, 6), (13, 9), (6, 9)]
    for c, r in players + enemies:
        assert g[r][c] in '.p', ('halka', c, r, g[r][c])
    objects = [obj(None, 'chain', (3, 3)), obj(None, 'cudgel', (15, 7))]
    groups = [{'id': 'devriye', 'state': 'calm', 'hexes': h1([(c, r) for r in range(ROWS) for c in range(COLS) if g[r][c] == '.' and (c < 7 or c > 13 or r > 7)]), 'links': []}]
    goals = {'mode': 'any', 'list': [{'id': 'gecis', 'kind': 'veya', 'options': [
        [{'id': 'devriyeler', 'kind': 'defeat'}],
        [{'id': 'kuleKapisi', 'kind': 'reach', 'hexes': h1([(16, 9), (10, 0)]), 'ids': ['mahkum']}],
    ]}], 'fail': [{'kind': 'down', 'ids': ['mahkum']}]}
    rules = [dark([(10, 0), (16, 9), (10, 2), (1, 5), (19, 5)], 'Dış halka: kule fenerleri ve köprü ağzı aydınlık; çukurun dibi görünmez.')]
    return g, players, enemies, objects, groups, goals, rules


def kule():
    """Müdür kulesi: yuvarlak oda, güney kapı (dış halkaya), müdürün masası ve tasma anahtarı, sütunlar."""
    g = grid()
    for c in range(COLS):
        for r in range(ROWS):
            x = (c - 10) / 10.2
            y = (r + 0.5 * (c % 2) - 5.0) / 5.6
            g[r][c] = '.' if math.hypot(x, y) < 0.98 else 's'
    for c in range(COLS):
        g[0][c] = 's'
        g[10][c] = 's'
    put(g, '.', [(10, 10)])
    put(g, 'm', [(6, 3), (14, 3), (6, 7), (14, 7)])
    put(g, 'x', [(9, 2), (10, 2), (11, 2), (3, 5), (17, 5)])
    players = [(10, 9), (9, 9), (11, 9), (10, 8), (9, 8), (11, 8), (8, 9), (12, 9), (8, 8), (12, 8)]
    enemies = [(10, 3), (8, 4), (12, 4), (10, 5)]
    for c, r in players + enemies:
        assert g[r][c] == '.', ('kule', c, r, g[r][c])
    objects = [obj('tasmaAnahtari', 'key', (10, 1)), obj(None, 'cudgel', (4, 6))]
    groups = [{'id': 'mudur', 'state': 'calm', 'hexes': h1([(c, r) for r in range(1, 6) for c in range(5, 16) if g[r][c] == '.']), 'links': []}]
    goals = {'mode': 'any', 'list': [{'id': 'anahtar', 'kind': 'veya', 'options': [
        [{'id': 'mudurYenildi', 'kind': 'defeat'}],
        [{'id': 'anahtarKapida', 'kind': 'retrieve', 'objectId': 'tasmaAnahtari', 'hexes': h1([(10, 10), (9, 9), (10, 9), (11, 9)])}],
    ]}], 'fail': [{'kind': 'down', 'ids': ['mahkum']}]}
    rules = [dark([(10, 2), (10, 8), (3, 5), (17, 5)], 'Müdür kulesi: masa ve kapı fenerleri; köşeler karanlık.')]
    return g, players, enemies, objects, groups, goals, rules


def iskele():
    """İskele: kuzeybatıda kule kapısından inen kaya yolu, emanet sandığı, doğuya uzanan tahta iskele ve uçta kayık."""
    g = grid('w')
    for c in range(COLS):
        for r in range(ROWS):
            if c <= 5 and r <= 8:
                g[r][c] = '.'
            elif c <= 3:
                g[r][c] = 'u'
    for c in range(5, 20):
        g[5][c] = 'p'
        g[6][c] = 'p'
    put(g, 'p', [(19, 4), (19, 7), (20, 5), (20, 6)])
    put(g, 'x', [(4, 3), (14, 6), (9, 6)])
    put(g, 's', [(0, 0), (1, 0), (2, 0)])
    players = [(1, 2), (2, 2), (3, 2), (1, 3), (2, 3), (3, 1), (1, 4), (2, 4), (3, 4), (4, 2)]
    enemies = [(12, 5), (13, 6), (15, 5), (16, 6), (7, 5), (17, 5)]
    for c, r in players + enemies:
        assert g[r][c] in '.p', ('iskele', c, r, g[r][c])
    objects = [obj('emanet', 'chest', (3, 3)), obj(None, 'cudgel', (5, 2))]
    boat = [(19, 4), (20, 5), (20, 6), (19, 7)]
    groups = [{'id': 'iskeleNobeti', 'state': 'calm', 'hexes': h1([(c, r) for r in range(ROWS) for c in range(6, COLS) if g[r][c] == 'p']), 'links': []}]
    goals = {'mode': 'any', 'list': [{'id': 'kayik', 'kind': 'veya', 'options': [
        [{'id': 'iskeleTemiz', 'kind': 'defeat'}],
        [{'id': 'kayigaBin', 'kind': 'reach', 'hexes': h1(boat), 'ids': ['mahkum']}],
    ]}], 'fail': [{'kind': 'down', 'ids': ['mahkum']}]}
    rules = [dark([(3, 3), (10, 5), (19, 5), (19, 6)], 'Gece iskelesi: emanet sandığı, iskele ortası ve kayık fenerleri.')]
    return g, players, enemies, objects, groups, goals, rules


META = {
    'hapishane-hucre-platformu': ('Hücre Platformu', 'Cell Platform', hucre, 'yeralt-ma-ara',
                                  'Çukurun ortasındaki platform: batıda 3, doğuda 3 hücre (parti batıdakilerden çıkar), ortada nöbet salonu (masa, sütunlar), güneyde büyük kilitli kapılı hedef hücre (mahkûm), kuzeyde köprü kapısı.'),
    'hapishane-dis-halka': ('Dış Halka', 'Outer Ring', halka, 'd-z-zemin',
                            'Tam daire halka yolu; ortada su dolu derin çukur (K24d: kıyıdan uzak kısmına yalnızca yüzenler); kuzey iç kenardan platforma köprü; kuzey kule kapısı müdür kulesine, güneydoğu kule kapısı iskeleye.'),
    'hapishane-mudur-kulesi': ('Müdür Kulesi', "Warden's Tower", kule, 'yeralt-ma-ara',
                               'Yuvarlak kule odası: kuzeyde müdürün masası ve tasma anahtarı, dört sütun, güney kapı (dış halkaya).'),
    'hapishane-iskele': ('İskele', 'Prison Dock', iskele, 'd-z-zemin',
                         'Kuzeybatıda kule kapısından (0,1; dış halkaya dönüş) inen kaya yolu ve emanet sandığı; doğuya uzanan tahta iskele, uçta kayık (kaçış); çevresi deniz.'),
}


def write(mid):
    name, name_en, fn, env, tasarim = META[mid]
    g, players, enemies, objects, groups, goals, rules = fn()
    for c, r in players + enemies:
        assert g[r][c] in '.p', (mid, c, r, g[r][c])
    d = {
        'id': mid, 'bolge': 'hapishane', 'gorsel': f'hapishane/{mid}', 'name': name, 'nameEn': name_en, 'environmentId': env,
        'orientation': 'flat-top', 'offset': 'odd-q', 'size': {'cols': COLS, 'rows': ROWS}, 'hexFeet': 5, 'gizli': True,
        'startZones': {'players': zone(players), 'enemies': zone(enemies), 'note': 'Kuyruk 36: Hapishane Adası (Serüven); parti girişleri data/seruven.json düğüm kapılarında.'},
        'mirrorable': False, 'hide': HIDE,
        'variants': [{'id': 'los', 'name': 'Loş', 'nameEn': 'Dim', 'image': f'maps/hapishane/{mid}.webp', 'rules': rules, 'effects': [{'type': 'drip', 'intensity': 0.3}]}],
        'objects': objects, 'groups': groups, 'goals': goals,
        'tiles': [''.join(x) for x in g], 'notes': {'tasarim': tasarim},
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{mid}.json').write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(mid)
    print('\n'.join(d['tiles']))


for k in META:
    write(k)
