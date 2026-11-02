# Kuyruk 29 (K27b): Buzul, Dağ ve Bataklık paketlerinin 12 haritası (python3 scripts/k27b-haritalar.py [ad...]).
# Çöl paketinin (scripts/col-haritalar.py) yöntemi: zemin, görselin 0 tabanlı "sütun,satır" etiketli ızgarasından
# (npx vite-node scripts/harita-etiket.ts) elle okunur → harita/<bolge>/duzeltme/<ad>.json (tam satırlar) ve
# harita/<bolge>/<ad>.json. 21×11, gündüz + gece tek kart (gece: ayrı görsel + `night`). Kimlik = ad. Yükseklik katmanı
# (K26b) ve harita mekanikleri (K28b) ayrı betiklerle haritaların üstüne yazılır (bu betik onları korur).
import json, os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
W, H = 21, 11

def grid(ch='.'): return [[ch] * W for _ in range(H)]
def put(T, ch, *pts):
  for c, r in pts: T[r][c] = ch
def row(T, r, cols, ch):
  for c in cols: T[r][c] = ch
def nbrs(c, r):
  d = [(1, -1), (1, 0), (-1, -1), (-1, 0), (0, -1), (0, 1)] if c % 2 == 0 else [(1, 0), (1, 1), (-1, 0), (-1, 1), (0, -1), (0, 1)]
  return [(c + dc, r + dr) for dc, dr in d if 0 <= c + dc < W and 0 <= r + dr < H]
BLOCKED = set('#scumvaO~')
def reach(T, start):
  seen = {start}; q = [start]
  while q:
    c, r = q.pop()
    for n in nbrs(c, r):
      if n not in seen and T[n[1]][n[0]] not in BLOCKED: seen.add(n); q.append(n)
  return seen
R = range

NIGHT = lambda lights: {"id": "night", "lights": [[c + 1, r + 1] for c, r in lights], "lightRadiusHexes": 2, "passivePerceptionPenalty": 5, "hideAdvantage": True,
  "note": "Gece: yalnızca ışık kaynaklarının çevresi aydınlık. Işıksız altıgende gizlenene karşı karanlık görüşü olmayan gözcünün pasif Algısı −5, Gizlen zarı avantajlı."}
ICE = {"id": "ice", "terrain": "i", "save": "DEX", "dc": 10, "onFail": "prone", "endsMovement": True, "note": "Buz (i): girince DEX DC 10, başarısızsa Prone ve hareket biter (mevcut buz kuralı)."}
DEEP = {"id": "deepWater", "terrain": "w", "swim": True, "heavyArmorSink": {"ability": "STR", "skill": "Athletics", "dc": 12, "drownAfterRounds": 3},
  "note": "Sığ su ve çamur n: zorlu zemin. Koyu bataklık suyu w: derin su (yüzme, zorlu zemin; ağır zırhlı batabilir; kıyıdan uzaksa çok derin, K24d)."}
MUD = {"id": "mudNote", "terrain": "n", "note": "Sığ su ve çamur: zorlu zemin, hasar yok."}
FX = {
  'buzul': ([{"type": "snow", "intensity": 0.6}, {"type": "iceGlint", "intensity": 0.6}], [{"type": "snow", "intensity": 0.5}, {"type": "iceGlint", "intensity": 0.4}]),
  'dag': ([{"type": "dust", "intensity": 0.3}, {"type": "birdShadow", "intensity": 0.6}], [{"type": "fog", "intensity": 0.5}, {"type": "motes", "intensity": 0.6}]),
  'bataklik': ([{"type": "groundFog", "intensity": 0.8}, {"type": "bubbles", "intensity": 0.6}], [{"type": "groundFog", "intensity": 1}, {"type": "fireflies", "intensity": 0.8}]),
}
ENV = {'buzul': 'buzul-dondurucu-so-uk', 'dag': 'da-u-urum', 'bataklik': 'sualt-batakl-k'}
HIDE = {
  'buzul': {"terrain": {".": 0, "g": 2}, "adjacentTo": {"r": 0, "v": 0, "k": 0, "a": 0, "x": 0, "m": 0}, "cover": {".": "sand", "g": "leaves"},
            "note": "Buzul: karda gömülerek; buz kayası (r, v), taş (k), ağaç (a) ve sandık/mangal (x) dibinde gizlenilir."},
  'dag': {"terrain": {"g": 2}, "adjacentTo": {"r": 0, "v": 0, "a": 0, "x": 0, "m": 0, "t": 0}, "cover": {"g": "leaves"},
          "note": "Dağ: çalılıkta (g, +2), kaya (r, v), ağaç (a), çadır/sandık (x) ve heykel (m) dibinde gizlenilir."},
  'bataklik': {"terrain": {"g": 2, "n": 0}, "adjacentTo": {"a": 0, "r": 0, "k": 0, "x": 0, "m": 0}, "cover": {"g": "leaves", "n": "shadow"},
               "note": "Bataklık: sazlık ve köklerde (g, +2), ağaç (a), taş (k), sandık/ateş (x) dibinde gizlenilir."},
}

def buzul_kamp():
  rows = ["###########a####ia..#", "######.a.ra.a...i...#", "#####..aaxx....ai...#", ".a.aa.t.......aaii..#",
          "....att..aa.....ii.aa", "a..tt.aa.....aa.ii..a", "###tt.aaaa.aaaa.iiaaa", "#####...aaa.a...ii..a",
          "######...#.#####ii###", "uuuuuu########uuuuuuu", "uuuuuuuuuuuuuuuuuuuuu"]
  T = [list(s) for s in rows]
  P = [(0, 3), (0, 4), (2, 3), (2, 4), (3, 4), (1, 5), (2, 5), (5, 3), (5, 5), (5, 4)]
  E = [(18, 2), (19, 2), (18, 3), (19, 3), (18, 4), (18, 5), (19, 5), (18, 1), (19, 1), (17, 1), (18, 7), (19, 7)]
  return T, P, E, []

def buzul_kayalik():
  rows = [".v................uuu", "vv............rr..uuu", "vv...ii.vvv...r....uu", "vvvvviivvvv.r......uu",
          "vvvvviitvv.....rr..uu", "vvviiiii.........r.uu", "vvvviiii...vvvvrrr.uu", "v.v.iiii...vvvv....uu",
          "aa.iiiii...vv..aa..uu", "a..vvvvv.......aa..uu", "...vvvvvvvv........uu"]
  T = [list(s) for s in rows]
  P = [(2, 1), (3, 1), (4, 1), (5, 1), (2, 0), (3, 0), (4, 0), (2, 2), (3, 2), (4, 2)]
  E = [(12, 4), (13, 4), (14, 4), (13, 3), (15, 3), (16, 3), (16, 2), (12, 2), (13, 2), (17, 3), (17, 2), (11, 3)]
  return T, P, E, []

def buzul_acik():
  T = grid()
  put(T, 'u', (8, 1), (9, 1), (9, 2), (10, 3), (0, 5), (1, 5), (0, 6), (0, 7), (12, 7), (12, 8), (11, 8), (10, 9), (10, 10), (9, 10))
  put(T, 'r', (3, 2), (3, 3), (4, 3), (2, 4), (9, 0), (10, 0), (16, 1), (17, 1), (13, 2), (7, 9), (7, 10), (8, 10), (13, 9), (17, 9))
  put(T, 'k', (5, 4), (6, 4), (7, 4), (4, 5), (4, 6), (5, 6), (6, 5), (7, 5), (8, 5), (1, 8), (2, 9), (3, 9), (3, 10))
  put(T, 'g', (14, 3), (15, 3), (17, 3))
  put(T, 'a', (19, 7), (20, 7), (20, 8), (19, 8), (20, 9), (18, 9), (19, 9), (18, 10), (19, 10), (20, 10), (17, 10), (16, 10), (15, 10))
  P = [(1, 1), (2, 1), (1, 2), (2, 2), (0, 2), (0, 3), (1, 3), (2, 3), (3, 1), (0, 1)]
  E = [(17, 5), (18, 5), (19, 5), (17, 6), (18, 6), (19, 6), (18, 4), (19, 4), (20, 5), (20, 4), (16, 5), (17, 4)]
  return T, P, E, []

def buzul_tapinak():
  T = grid()
  put(T, 'u', (3, 0), (4, 0), (5, 0), (6, 0), *[(c, 1) for c in R(0, 6)], *[(c, 2) for c in R(0, 6)], *[(c, 3) for c in R(0, 5)])
  put(T, '#', (19, 0), (20, 0), (19, 1), (20, 1), (19, 2), (20, 2), (20, 3), (20, 4), (19, 10), (20, 10), (20, 9))
  put(T, 's', (9, 0), (10, 0), (11, 0), (12, 0), (13, 0), (8, 1), (13, 1), (13, 2), (13, 3), (13, 4), (14, 3), (16, 3), (17, 4), (17, 5), (17, 6), (17, 7),
      (14, 6), (14, 7), (15, 8), (16, 8), (7, 2), (6, 5), (2, 5), (4, 5), (1, 5), (1, 6), (1, 7), (1, 8), (3, 8), (4, 9), (5, 8), (6, 9), (7, 8), (7, 7), (7, 6),
      (9, 6), (9, 7), (9, 8), (13, 6), (13, 7), (13, 8))
  put(T, 'm', (9, 2), (12, 3), (10, 7), (12, 7))
  put(T, 'x', (9, 1), (11, 1), (12, 1))
  put(T, 'l', (10, 8), (12, 8), (10, 9), (12, 9), (11, 9), (11, 10))
  P = [(3, 10), (4, 10), (5, 10), (6, 10), (7, 10), (5, 9), (7, 9), (8, 10), (8, 9), (2, 10)]
  E = [(10, 2), (11, 2), (10, 3), (11, 3), (10, 4), (11, 4), (12, 4), (10, 5), (11, 5), (12, 5), (10, 6), (11, 6)]
  lights = [(9, 1), (11, 1), (12, 1), (7, 3), (8, 5), (13, 5), (15, 3), (16, 4), (17, 4), (15, 6), (2, 5), (4, 5), (3, 7), (4, 8), (6, 7), (6, 8)]
  return T, P, E, lights

def dag_karakol():
  T = grid()
  row(T, 0, R(1, 21), 't'); row(T, 1, R(1, 9), 't'); row(T, 1, R(11, 21), 't'); row(T, 2, R(12, 21), 't')
  put(T, 't', (0, 1), (0, 2), (0, 3)); row(T, 8, R(0, 8), 't'); row(T, 8, R(11, 21), 't'); row(T, 9, R(0, 21), 't'); row(T, 10, R(0, 21), 't')
  put(T, 'g', (3, 0), (4, 1), (16, 1), (14, 3), (1, 8), (3, 9), (14, 7), (15, 8), (19, 7), (0, 4), (12, 2), (5, 8))
  put(T, 'z', (8, 2), (8, 3), (9, 1), (9, 2), (9, 3), (10, 2), (10, 3), (11, 2), (8, 7), (8, 8), (9, 7), (9, 8), (10, 7), (10, 8), (11, 7))
  put(T, 'h', (8, 4), (8, 5), (8, 6), (9, 4), (9, 5), (9, 6), (10, 4), (10, 6))
  put(T, 'o', (10, 5))
  put(T, 'l', (7, 2), (7, 3), (7, 6), (7, 7))
  put(T, 'x', (3, 2), (4, 3), (5, 3), (6, 4), (1, 5), (5, 6), (4, 6), (3, 6), (1, 3), (1, 6), (2, 7), (3, 4))
  put(T, 'r', (17, 3), (17, 6))
  P = [(16, 4), (16, 5), (17, 4), (17, 5), (18, 4), (18, 5), (19, 5), (19, 4), (18, 6), (16, 6)]
  E = [(2, 3), (2, 4), (2, 5), (3, 5), (4, 4), (4, 5), (2, 6), (3, 3), (5, 5), (9, 2), (9, 7), (6, 5)]
  return T, P, E, [(10, 5), (4, 5)]

def dag_kayalik():
  T = grid()
  put(T, 'a', (2, 1), (16, 1), (17, 1), (5, 8))
  put(T, 'g', (7, 2), (0, 4), (2, 9), (1, 9), (18, 8), (14, 8), (12, 1), (10, 8), (11, 10), (13, 10))
  put(T, 'r', (4, 4), (5, 4), (4, 5), (5, 5), (6, 5), (4, 6), (6, 6), (17, 9))
  put(T, 'x', (10, 5)); put(T, 't', (9, 5), (11, 5))
  for r in (9, 10):
    for c in R(0, 8):
      if T[r][c] == '.': T[r][c] = 't'
  for r in R(0, 11): T[r][20] = 't'
  P = [(1, 4), (1, 5), (2, 4), (2, 5), (1, 6), (2, 6), (2, 7), (1, 7), (3, 7), (3, 4)]
  E = [(16, 3), (17, 3), (16, 4), (17, 4), (16, 5), (17, 5), (18, 4), (18, 5), (16, 6), (17, 6), (18, 6), (15, 4)]
  return T, P, E, []

def dag_kopru():
  T = grid()
  U = {0: R(5, 14), 1: R(5, 14), 2: R(5, 14), 3: R(7, 15), 4: R(7, 13), 5: [13], 6: R(9, 16), 7: R(8, 16), 8: R(8, 16), 9: R(7, 15), 10: R(7, 15)}
  for r, cs in U.items():
    for c in cs: T[r][c] = 'u'
  put(T, 'p', (8, 5), (9, 5), (10, 5), (11, 5), (12, 5), (13, 4), (14, 4))
  put(T, 'a', (1, 2), (2, 3), (0, 7), (4, 5), (4, 6), (1, 9), (2, 9), (3, 10), (15, 1), (17, 1), (20, 5), (17, 4))
  P = [(1, 4), (2, 4), (1, 5), (2, 5), (3, 5), (1, 6), (2, 6), (3, 6), (2, 7), (3, 4)]
  E = [(17, 5), (18, 5), (19, 5), (18, 4), (18, 6), (19, 4), (19, 6), (17, 6), (16, 5), (16, 4), (18, 3), (19, 3)]
  return T, P, E, []

def dag_nobetci():
  T = grid()
  put(T, '#', *[(0, r) for r in R(1, 11)], (1, 5), (1, 7), (1, 8), (1, 9), (1, 10), (2, 9), (2, 10), (3, 9), (3, 10), (4, 10),
      *[(c, 0) for c in R(15, 21)], *[(c, 1) for c in R(16, 21)], (19, 2), (20, 2), (20, 3), (20, 9), (20, 10), (19, 10))
  put(T, 'm', (3, 0), (3, 1), (4, 1), (3, 2), (4, 2), (3, 3), (4, 3))
  put(T, 'x', (4, 4), (5, 4))
  put(T, 'v', (9, 0), (8, 1), (9, 1), (11, 2), (12, 2), (13, 2), (13, 1), (8, 3), (7, 4), (7, 5), (8, 5), (14, 3), (2, 6), (8, 6), (9, 6), (8, 7), (8, 8),
      (8, 9), (8, 10), (14, 9))
  put(T, 'a', (0, 0), (1, 0), (11, 0), (12, 0), (11, 1), (12, 5), (13, 4), (12, 6), (16, 4), (16, 6), (20, 6), (2, 7), (3, 7), (16, 7), (19, 7), (20, 7),
      (3, 8), (4, 8), (12, 8), (14, 8), (6, 9), (7, 9), (10, 9), (11, 9), (6, 10))
  put(T, 'r', (6, 7), (6, 8), (4, 7))
  put(T, 'l', (10, 3), (18, 3), (18, 4), (17, 10))
  P = [(1, 2), (2, 2), (1, 3), (2, 3), (1, 4), (2, 4), (2, 5), (3, 5), (3, 4), (2, 1)]
  E = [(16, 5), (17, 5), (18, 5), (19, 5), (20, 5), (17, 4), (19, 4), (15, 5), (15, 4), (18, 6), (19, 6), (17, 6)]
  return T, P, E, [(3, 1)]

def batak_kamp():
  T = grid()
  row(T, 0, R(0, 21), 'g'); row(T, 1, R(7, 15), 'g'); row(T, 10, R(0, 13), 'g'); put(T, 'g', (2, 7), (4, 7))
  put(T, 'w', (3, 2), (4, 2), (5, 2), (4, 3), (3, 1), (14, 6), (15, 6), (14, 5), (15, 3), (15, 4), (13, 9), (14, 9), (13, 10), (14, 10), (0, 9))
  put(T, 'n', (1, 4), (3, 4), (5, 4), (1, 5), (2, 6), (4, 5), (5, 6), (6, 7), (8, 7), (3, 6), (0, 6), (1, 7), (7, 6), (9, 8), (8, 9))
  put(T, 'a', (9, 0), (10, 1), (13, 1), (16, 1), (19, 1), (1, 1), (6, 1), (20, 6))
  put(T, 'x', (18, 4), (17, 7))
  P = [(0, 4), (0, 5), (1, 6), (2, 5), (2, 4), (3, 5), (0, 7), (2, 8), (1, 8), (3, 8)]
  E = [(16, 4), (17, 5), (18, 5), (19, 5), (16, 6), (17, 6), (18, 6), (19, 6), (16, 5), (18, 3), (19, 4), (19, 7)]
  return T, P, E, [(18, 4), (17, 7)]

def batak_kale():
  T = grid()
  put(T, 'w', *[(0, r) for r in R(0, 11)], (1, 0), (1, 1), (1, 9), (1, 10), (2, 10), *[(c, 10) for c in R(3, 9)])
  put(T, 's', (2, 1), (1, 2), (1, 3), (1, 4), (1, 6), (1, 7), (2, 8), (4, 8), (6, 8)); put(T, 'o', (1, 5))
  put(T, 'm', (4, 1), (3, 9), (14, 9))
  put(T, 'a', (9, 4), (9, 5), (3, 3))
  put(T, 'g', (8, 4), (8, 5), (10, 4), (10, 5), (8, 6), (9, 6), (10, 6), (7, 5), (3, 2))
  put(T, 'x', (4, 5), (5, 5)); put(T, 't', (8, 7), (8, 8), (12, 8), (13, 8)); put(T, 'r', (10, 0))
  for r in R(0, 11):
    for c in R(15, 21):
      if T[r][c] == '.': T[r][c] = 'g'
  for c in R(14, 21):
    if T[0][c] == '.': T[0][c] = 'g'
  for c in R(9, 21):
    if T[10][c] == '.': T[10][c] = 'g'
  put(T, 'a', (17, 6), (19, 2), (16, 9), (20, 4), (18, 0))
  P = [(17, 4), (18, 4), (17, 5), (18, 5), (19, 4), (19, 5), (17, 3), (18, 3), (16, 4), (16, 5)]
  E = [(5, 3), (6, 3), (5, 2), (6, 2), (7, 3), (6, 4), (5, 6), (6, 6), (7, 6), (4, 4), (3, 5), (3, 6)]
  return T, P, E, []

def batak_adalar():
  T = grid('w')
  put(T, '.', (6, 4), (7, 3), (7, 4), (8, 4), (9, 4), (6, 5), (7, 5), (8, 5), (9, 5), (10, 5), (11, 4), (11, 5), (12, 4), (12, 5), (13, 4), (13, 5), (14, 4),
      (14, 5), (15, 5), (14, 6), (6, 6), (7, 6), (8, 6), (9, 6), (7, 7), (8, 7), (9, 7))
  put(T, 'g', (6, 7), (5, 7), (6, 8), (7, 8), (8, 8), (6, 9), (7, 9), (11, 2), (12, 2), (13, 2), (14, 2), (15, 2), (12, 3), (14, 3), (15, 3), (16, 3), (1, 6), (2, 6))
  put(T, '.', (0, 3), (1, 3), (0, 4), (1, 4), (2, 4), (0, 5), (1, 5), (2, 5), (0, 6), (0, 7), (1, 7))
  put(T, '.', (19, 3), (20, 3), (19, 4), (20, 4), (19, 5), (20, 5), (19, 6), (20, 6), (19, 7), (20, 7), (20, 8), (18, 4), (18, 6))
  put(T, 'p', (3, 5), (4, 5), (5, 5), (16, 5), (17, 5), (18, 5))
  put(T, 'n', (5, 4), (5, 6), (16, 4), (16, 6), (10, 7), (11, 6), (12, 6), (13, 6), (15, 6), (9, 8), (6, 3), (10, 4))
  put(T, 'a', (10, 6), (1, 0), (4, 0), (12, 0), (13, 0), (14, 1), (15, 0), (11, 10), (13, 10), (18, 9), (19, 9), (4, 9))
  P = [(0, 3), (1, 3), (0, 4), (1, 4), (2, 4), (0, 5), (1, 5), (2, 5), (0, 6), (0, 7)]
  E = [(19, 3), (20, 3), (19, 4), (20, 4), (19, 5), (20, 5), (19, 6), (20, 6), (19, 7), (20, 7), (20, 8), (18, 4)]
  return T, P, E, []

def batak_cukur():
  T = grid()
  W_ = {2: [11, 13, 15], 3: R(10, 17), 4: R(10, 18), 5: R(10, 18), 6: R(10, 17), 7: [12, 14]}
  for r, cs in W_.items():
    for c in cs: T[r][c] = 'w'
  put(T, 't', (8, 3), (7, 4), (8, 4), (7, 5), (8, 5), (9, 5), (7, 6), (8, 6), (9, 6), (8, 7), (9, 7), (10, 7), (10, 8), (11, 7), (11, 8), (12, 8), (13, 7),
      (13, 8), (14, 8), (15, 7), (15, 8), (16, 7), (16, 8), (17, 6), (17, 7), (18, 4), (18, 5), (18, 6), (18, 7), (17, 8), (18, 8), (9, 3), (9, 4), (10, 2),
      (14, 2), (16, 2), (17, 2), (18, 3), (9, 2), (12, 2), (17, 3))
  put(T, 'a', (2, 1), (4, 1), (1, 3), (3, 3), (5, 3), (2, 4), (4, 5), (3, 5), (6, 4))
  put(T, 'k', (1, 8), (1, 9), (3, 7), (4, 7), (4, 8), (5, 9), (1, 5), (2, 6))
  put(T, 'x', (3, 8), (5, 8), (6, 8), (2, 10))
  P = [(1, 2), (2, 2), (3, 2), (1, 4), (3, 4), (0, 5), (0, 6), (1, 6), (2, 5), (3, 6)]
  E = [(19, 4), (19, 5), (20, 4), (20, 5), (19, 6), (20, 6), (19, 3), (20, 3), (19, 7), (20, 7), (18, 2), (19, 2)]
  return T, P, E, []

MAPS = [
  ('buzul', 'buzul-kamp', 'Karlı Kamp', 'Snowy Camp', buzul_kamp, 'Karlı ormanda kamp ateşi ve kütükler; doğuda donmuş şelale (buz i, dik yüzey) ve arkasında yüksek düzlük; güneyde uçurum (u).'),
  ('buzul', 'buzul-kayalik', 'Buzul Kayalıkları', 'Glacier Cliffs', buzul_kayalik, 'Buz kayası kümeleri (v geçilmez), ortada düz buz (i, kayma), doğuda yükseltili düzlük ve mühür; en doğuda uçurum.'),
  ('buzul', 'buzul-acik', 'Açık Buzul', 'Open Glacier', buzul_acik, 'Açık kar düzlüğü; buz yarıkları (u), buz blokları (r), rüzgâr kırıcı taş halkası (k), kuru ağaçlar (g), güneydoğuda çam ormanı.'),
  ('buzul', 'buzul-tapinak', 'Buz Tapınağı', 'Ice Temple', buzul_tapinak, 'Taş tapınak: ana salon, batı ve doğu kanatlar (duvarlar s, sütunlar m, mangallar), güneyde kavisli merdiven; kuzeybatıda buz yarığı, doğuda buz kristali duvarı.'),
  ('dag', 'dag-karakol', 'Geçit Karakolu', 'Pass Outpost', dag_karakol, 'Geçidi kesen sur ve iki kule (z, yüksek; ahşap merdivenler l), surda kapı (o); batıda çadırlı kamp, doğuda kayalık geçit yolu.'),
  ('dag', 'dag-kayalik', 'Yüksek Kayalıklar', 'High Cliffs', dag_kayalik, 'Basamaklı kayalık teraslar (yükseklik katmanı 0–3), ortada kaya kümesi ve devrik araba, güneybatıda kayalık kütle.'),
  ('dag', 'dag-kopru', 'Uçurum Köprüsü', 'Chasm Bridge', dag_kopru, 'Sisli derin uçurum (u) iki yakayı ayırır; tek geçiş doğal taş kemer köprü (p). İki yaka ormanlık kayalık.'),
  ('dag', 'dag-nobetci', 'Sessiz Nöbetçi', 'Silent Sentinel', dag_nobetci, 'Kuzeybatıda kılıçlı kukuletalı dev heykel (m) ve önünde yazıtlı plaka (x); kaya kümeleri (v), ağaçlar, ortadan doğuya taş yol ve merdivenler (l).'),
  ('bataklik', 'batak-kamp', 'Cadının Kampı', "Witch's Camp", batak_kamp, 'Karanlık bataklık ormanında çamurlu yol (n), koyu su gölcükleri (w), doğuda iki ateş çukuru (x; kazan ateşi).'),
  ('bataklik', 'batak-kale', 'Batık Kale', 'Sunken Keep', batak_kale, 'Zehirli bataklık suyuna (w) gömülmüş kale avlusu: yıkık surlar (s), iki yuvarlak kule (m), ortada ölü dev ağaç (a) ve kökleri (g), kemikler; doğuda sık bataklık ormanı.'),
  ('bataklik', 'batak-adalar', 'Kütük Adaları', 'Log Isles', batak_adalar, 'Derin bataklık suyu (w) içinde üç ada: batı ve doğu adaları ortadaki büyük adaya kütük köprülerle (p) bağlı; sığ kıyılar (n), kökler (g).'),
  ('bataklik', 'batak-cukur', 'Batık Çukur', 'Sunken Pit', batak_cukur, 'Ortada çok derin su dolu çukur (w), çevresinde taşlı yamaçlar (t); batıda orman, güneybatıda yıkık kuyu ve sandıklar.'),
]

def one(c, r): return [c + 1, r + 1]
only = sys.argv[1:]
for bolge, ad, name, en, fn, note in MAPS:
  if only and ad not in only: continue
  T, P, E, lights = fn()
  assert len(T) == H and all(len(r) == W for r in T), (ad, [len(r) for r in T])
  for c, r in P + E: assert T[r][c] in '.ptdgnzhl', (ad, c, r, T[r][c])
  seen = reach(T, P[0])
  for h in P + E: assert h in seen, (ad, 'ulaşılamaz başlangıç', h)
  tiles = [''.join(r) for r in T]
  out = os.path.join(ROOT, 'harita', bolge)
  os.makedirs(os.path.join(out, 'duzeltme'), exist_ok=True)
  fix = os.path.join(out, 'duzeltme', ad + '.json')
  json.dump({"_not": "Kuyruk 29 K27b: görselin etiketli ızgarasından elle (tam satırlar; scripts/k27b-haritalar.py yazar).",
             "satirlar": {str(i + 1): t for i, t in enumerate(tiles)}}, open(fix, 'w'), ensure_ascii=False, indent=1)
  open(fix, 'a').write('\n')
  path = os.path.join(out, ad + '.json')
  old = json.load(open(path)) if os.path.exists(path) else {}
  rules = {'buzul': [ICE], 'dag': [], 'bataklik': [DEEP, MUD]}[bolge]
  day_fx, night_fx = FX[bolge]
  data = {
    "id": ad, "bolge": bolge, "gorsel": f"{bolge}/{ad}", "name": name, "nameEn": en, "environmentId": ENV[bolge],
    "orientation": "flat-top", "offset": "odd-q", "size": {"cols": W, "rows": H}, "hexFeet": 5, "tiles": tiles,
    "startZones": {"players": {"colRange": [1, 21], "hexes": [one(*h) for h in P]}, "enemies": {"colRange": [1, 21], "hexes": [one(*h) for h in E]},
                   "note": "Kuyruk 29: başlangıçlar sahne tasarımından."},
   "hide": HIDE[bolge],
    "variants": [
      {"id": "gunduz", "name": "Gündüz", "nameEn": "Day", "image": f"maps/{bolge}/{ad}.webp", "rules": list(rules), "effects": day_fx},
      {"id": "gece", "name": "Gece", "nameEn": "Night", "image": f"maps/{bolge}/{ad}-gece.webp", "rules": list(rules) + [NIGHT(lights)], "effects": night_fx},
    ],
    "notes": {"tasarim": "Kuyruk 29 K27b: " + note},
  }
  # K26b/K28b'nin yazdığı alanlar korunur (yükseklik, rampa, nesne, grup, hedef, ek varyant kuralları).
  for k in ('heights', 'ramps', 'objects', 'groups', 'goals', 'surfaces'):
    if k in old: data[k] = old[k]
  for v, ov in zip(data['variants'], old.get('variants', [])):
    extra = [r for r in ov.get('rules', []) if r['id'] not in {x['id'] for x in v['rules']}]
    v['rules'] += extra
  json.dump(data, open(path, 'w'), ensure_ascii=False, indent=2); open(path, 'a').write('\n')
  print(ad); print('\n'.join(f'{i+1:2} {t}' for i, t in enumerate(tiles)))
