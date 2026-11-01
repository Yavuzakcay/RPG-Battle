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


def rows(lines):
    g = [list(x) for x in lines]
    assert len(g) == ROWS and all(len(x) == COLS for x in g), [len(x) for x in g]
    return g


def hucre():
    """Hücre platformu (görselden): batıda 3, doğuda 3 hücre (yatak, varil, saman), ortada mavi ışıklı nöbet salonu
    (mangallar, anahtar duvarı ve masa, devrik bank), kuzeyde köprü kapısı (10,1), güneyde parmaklıklı hedef hücre."""
    g = rows([
        'uuuuuuuuuupuuuuuuuuuu',
        'uuuussssss.ssssssuuuu',
        'uuuuxx.xm...m.xxxuuuu',
        'uuuu...........x.uuuu',
        'uuuussss.....ssssuuuu',
        'uuuuxxx.x.....xxxuuuu',
        'uuuu.s.s...xxs.s.uuuu',
        'uuuusxs.......s.suuuu',
        'uuuu..x..s.s..x..uuuu',
        'uuuusssss...sssssuuuu',
        'uuuuuuuuusssuuuuuuuuu',
    ])
    players = [(6, 2), (4, 3), (5, 3), (6, 3), (7, 3), (7, 5), (4, 6), (6, 6), (7, 7), (4, 8), (5, 8)]
    enemies = [(9, 3), (11, 3), (10, 5), (9, 6), (12, 4), (10, 7)]
    objects = [
        obj('hedefKapi', 'gate', (10, 8), state='locked', lockDc=15),
        obj('hucreAnahtari', 'key', (9, 4)),
        obj(None, 'benchLeg', (4, 3)), obj(None, 'chain', (13, 3)), obj(None, 'bucket', (7, 5)), obj(None, 'cudgel', (12, 3)),
    ]
    groups = [{'id': 'nobet', 'state': 'calm', 'hexes': h1([(c, r) for r in range(2, 9) for c in range(8, 13) if g[r][c] in '.p']), 'links': []}]
    goals = {'mode': 'any', 'list': [{'id': 'kacis', 'kind': 'veya', 'options': [
        [{'id': 'nobetciler', 'kind': 'defeat'}],
        [{'id': 'mahkumKopru', 'kind': 'reach', 'hexes': h1([(10, 0), (10, 1)]), 'ids': ['mahkum']}],
    ]}], 'fail': [{'kind': 'down', 'ids': ['mahkum']}]}
    rules = [dark([(9, 2), (11, 2), (10, 5), (6, 2), (6, 5), (14, 2), (14, 5)], 'Hücre bloğu: salonun mavi mangalları ve hücre meşaleleri aydınlık; karanlıkta 4 altıgen görülür.')]
    return g, players, enemies, objects, groups, goals, rules


def halka():
    """Dış halka (görselden): halka yol (mavi ışıklı taş), ortada derin çukur, kuzey-güney taş geçit; kuzey kapı (10,1),
    geçidin ortasında platform kapısı (10,4), güney kapı (10,10); kuzey kulenin kapısı (10,0)."""
    g = rows([
        'sssss........x..sssss',
        'sss.....ms.sm.....sss',
        'ss.x..mwwwpwwwm..x.ss',
        'ss...wwwwwpwwwww...ss',
        's.xm.wwwwwpwwwww.m.xs',
        's....wwwwwpwwwww....s',
        'ss...wwwwwpwwwww...ss',
        'ss...mwwwwpwwwwm...ss',
        'sss.....s...s.....sss',
        'ssssssssss.ssssssssss',
        'ssssssssss.ssssssssss',
    ])
    players = [(10, 2), (10, 3), (9, 0), (11, 0), (8, 0), (12, 0), (7, 1), (13, 1), (6, 1), (14, 1)]
    enemies = [(3, 3), (4, 6), (17, 3), (16, 6), (13, 8), (7, 8)]
    objects = [obj(None, 'chain', (2, 5)), obj(None, 'cudgel', (18, 5))]
    groups = [{'id': 'devriye', 'state': 'calm', 'hexes': h1([(c, r) for r in range(ROWS) for c in range(COLS) if g[r][c] == '.' and c != 10]), 'links': []}]
    goals = {'mode': 'any', 'list': [{'id': 'gecis', 'kind': 'veya', 'options': [
        [{'id': 'devriyeler', 'kind': 'defeat'}],
        [{'id': 'guneyKapisi', 'kind': 'reach', 'hexes': h1([(10, 10)]), 'ids': ['mahkum']}],
    ]}], 'fail': [{'kind': 'down', 'ids': ['mahkum']}]}
    rules = [dark([(8, 1), (12, 1), (6, 2), (14, 2), (3, 4), (17, 4), (5, 7), (15, 7)], 'Dış halka: altı mavi mangal ve kapılar aydınlık; çukurun dibi görünmez.')]
    return g, players, enemies, objects, groups, goals, rules


def kule():
    """Müdür kulesi (görselden): dikdörtgen oda, kuzeyde müdürün masası ve koltuğu, dört sütun, ortada kırmızı halı ve
    ızgara, yanlarda silah rafları, sandık ve masalar, güney kapı (10,10)."""
    g = rows([
        'sssssssssssssssssssss',
        'sssssssssssssssssssss',
        'sxxxx.m..xxx..m.xxxxs',
        's....m....x....m....s',
        's....m.........m....s',
        's...................s',
        's....m.........m....s',
        's.xx.m.........m....s',
        's.x..............xx.s',
        'sxxx...m.....m...x..s',
        'ssssssssss.ssssssssss',
    ])
    players = [(10, 9), (9, 9), (11, 9), (10, 8), (9, 8), (11, 8), (8, 9), (12, 9), (8, 8), (12, 8)]
    enemies = [(10, 4), (8, 3), (12, 3), (9, 4)]
    objects = [obj('tasmaAnahtari', 'key', (11, 4)), obj(None, 'cudgel', (3, 6))]
    groups = [{'id': 'mudur', 'state': 'calm', 'hexes': h1([(c, r) for r in range(2, 6) for c in range(6, 15) if g[r][c] == '.']), 'links': []}]
    goals = {'mode': 'any', 'list': [{'id': 'anahtar', 'kind': 'veya', 'options': [
        [{'id': 'mudurYenildi', 'kind': 'defeat'}],
        [{'id': 'anahtarKapida', 'kind': 'retrieve', 'objectId': 'tasmaAnahtari', 'hexes': h1([(10, 10), (9, 9), (10, 9), (11, 9)])}],
    ]}], 'fail': [{'kind': 'down', 'ids': ['mahkum']}]}
    rules = [dark([(6, 2), (14, 2), (7, 9), (13, 9), (10, 3)], 'Müdür kulesi: dört mavi mangal ve masa; köşeler loş.')]
    return g, players, enemies, objects, groups, goals, rules


def iskele():
    """İskele (görselden): kuzeyde halka surunun kapı kulesi (kapı (10,3)), basamaklar, kayalık kıyı (sandık ve variller),
    güneye uzanan tahta iskele ve kayık (11,10); çevresi deniz."""
    g = rows([
        'sssssssssssssssssssss',
        'sssssssssssssssssssss',
        'uuusssssssssssssssuuu',
        'wuuuuuuuss.ssuuuuuuww',
        'wwwu.x...mpm.....twww',
        'www.x.....p.....x.www',
        'www.......p.......www',
        'www....xx...xx....www',
        'wwww.u.w.wpw.w.u.wwww',
        'wwwwwwwwwwpwwwwwwwwww',
        'wwwwwwwwwwpppwwwwwwww',
    ])
    players = [(9, 5), (11, 5), (10, 5), (8, 4), (12, 4), (10, 6), (8, 5), (12, 5), (9, 6), (11, 6)]
    enemies = [(9, 7), (11, 7), (10, 8), (12, 8), (8, 8), (14, 6)]
    objects = [obj('emanet', 'chest', (6, 4)), obj(None, 'cudgel', (5, 6))]
    boat = [(11, 10), (12, 10)]
    groups = [{'id': 'iskeleNobeti', 'state': 'calm', 'hexes': h1([(c, r) for r in range(6, ROWS) for c in range(COLS) if g[r][c] in '.p']), 'links': []}]
    goals = {'mode': 'any', 'list': [{'id': 'kayik', 'kind': 'veya', 'options': [
        [{'id': 'iskeleTemiz', 'kind': 'defeat'}],
        [{'id': 'kayigaBin', 'kind': 'reach', 'hexes': h1(boat), 'ids': ['mahkum']}],
    ]}], 'fail': [{'kind': 'down', 'ids': ['mahkum']}]}
    rules = [dark([(9, 4), (11, 4), (10, 9), (11, 10)], 'İskele: kapı mangalları, iskele ve kayık fenerleri; kıyı karanlık.')]
    return g, players, enemies, objects, groups, goals, rules


META = {
    'hapishane-hucre-platformu': ('Hücre Platformu', 'Cell Platform', hucre, 'yeralt-ma-ara',
                                  'Çukurun ortasındaki platform: batıda 3, doğuda 3 hücre (parti batıdakilerden çıkar), ortada nöbet salonu (masa, sütunlar), güneyde büyük kilitli kapılı hedef hücre (mahkûm), kuzeyde köprü kapısı.'),
    'hapishane-dis-halka': ('Dış Halka', 'Outer Ring', halka, 'd-z-zemin',
                            'Halka yol; ortada derin çukur (çok derin su olarak, K24d); kuzey-güney taş geçit, ortasında platform kapısı; kuzey kule kapısı müdür kulesine, güney kapı iskeleye.'),
    'hapishane-mudur-kulesi': ('Müdür Kulesi', "Warden's Tower", kule, 'yeralt-ma-ara',
                               'Müdür kulesi odası: kuzeyde müdürün masası ve tasma anahtarı, dört sütun, kırmızı halı ve ızgara, silah rafları, güney kapı (dış halkaya).'),
    'hapishane-iskele': ('İskele', 'Prison Dock', iskele, 'd-z-zemin',
                         'Kuzeyde halka surunun kapı kulesi (dış halkaya dönüş), basamaklar, kayalık kıyı (emanet sandığı, sandıklar, variller), güneye uzanan tahta iskele ve kayık (kaçış); çevresi deniz.'),
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
