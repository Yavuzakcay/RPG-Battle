# Kuyruk 27 (K27): Çöl paketinin dört haritası (python3 scripts/col-haritalar.py). Depo kökünde çalıştırılır.
# Zemin: görselin 0 tabanlı "sütun,satır" etiketli ızgarasından elle okunur (renk önerisi kumu lav sanıyor) →
# harita/col/duzeltme/<ad>.json (tam satırlar) ve harita/col/<ad>.json. Gece: aynı harita, ayrı gece görseli (<ad>-gece)
# + `night` kuralı (Orman paketinin yöntemi). Gündüz: klasik Çöl'ün sıcak kuralı (heat; Game Master anahtarı var).
# Kimlik = ad. Çöl mekanikleri (ani sel, çürük güverte, kum solucanı) bu pakette yok.
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'harita', 'col')
W, H = 21, 11
ENV = 'l-kavurucu-s-cak'

def grid(): return [['.'] * W for _ in range(H)]
def put(T, ch, *pts):
  for c, r in pts: T[r][c] = ch
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

HEAT = {"id": "heat", "save": "CON", "dc": 12, "damage": "1d4", "damageType": "fire", "when": "endOfOwnTurn", "requires": ["heavyArmor", "notInShade"]}
NIGHT = lambda lights: {"id": "night", "lights": lights, "lightRadiusHexes": 2, "passivePerceptionPenalty": 5, "hideAdvantage": True,
  "note": "Gece: yalnızca ışık kaynaklarının çevresi aydınlık. Işıksız altıgende gizlenene karşı karanlık görüşü olmayan gözcünün pasif Algısı −5, Gizlen zarı avantajlı."}
HIDE = {"terrain": {".": 0, "d": 2, "g": 2}, "adjacentTo": {"r": 0, "k": 0, "x": 0, "c": 0, "a": 0}, "cover": {".": "sand", "d": "sand", "g": "leaves"},
  "note": "Çöl: açık kumda kuma gömülerek, kum tepesinde (d) ve çalılıkta (g) daha kolay; kaya, sütun, sandık ve ağaç dibinde gizlenilir."}
DAY_FX = [{"type": "heatHaze", "intensity": 0.6}, {"type": "dust", "intensity": 0.3}]
NIGHT_FX = [{"type": "motes", "intensity": 0.8}]

def gemi():
  T = grid()
  put(T, 'r', (0, 0), (20, 0), (20, 10))
  put(T, 'k', (10, 0), (11, 0), (10, 1), (11, 1), (13, 1), (9, 2), (11, 2), (12, 2), (14, 2), (8, 3), (9, 3), (12, 3),
      (7, 4), (8, 4), (9, 4), (7, 5), (8, 5), (9, 5), (6, 9))
  put(T, 'p', (12, 0), (13, 0), (9, 1), (12, 1), (8, 2), (10, 2), (13, 2), (15, 2), (10, 3), (11, 3), (13, 3), (14, 3),
      (10, 4), (11, 4), (12, 4), (13, 4), (10, 5), (11, 5), (12, 5), (4, 6), (5, 6), (8, 6), (10, 6), (11, 6),
      (3, 7), (5, 7), (7, 7), (8, 7), (10, 7), (11, 7), (2, 8), (3, 8), (4, 8), (5, 8), (6, 8), (2, 9), (4, 9), (5, 9),
      (2, 10), (4, 10), (5, 10))
  put(T, 'x', (14, 0), (8, 1), (14, 1), (5, 2), (5, 3), (15, 3), (5, 4), (16, 4), (17, 4), (6, 5), (13, 5), (15, 5), (16, 5),
      (15, 6), (4, 7), (6, 7), (14, 7), (15, 7), (3, 9), (3, 10))
  put(T, 't', (4, 2), (6, 6), (10, 8), (13, 9), (19, 8))
  put(T, 'd', (3, 5), (2, 4), (18, 2), (17, 1))
  return T, {"players": [(1, 2), (1, 3), (2, 3), (1, 4), (0, 4), (2, 2), (0, 3), (3, 3), (0, 5), (1, 5)],
             "enemies": [(18, 5), (17, 6), (18, 6), (19, 5), (18, 4), (19, 6), (17, 7), (19, 4), (16, 8), (18, 7), (20, 5), (17, 8)]}, []

def sutun():
  T = grid()
  put(T, 'c', (2, 2), (5, 2), (8, 2), (10, 3), (2, 7), (5, 7), (8, 7), (10, 7), (9, 10), (16, 3), (18, 3))
  put(T, 'k', (11, 2), (3, 2), (6, 2), (7, 2), (12, 3), (5, 6), (3, 7), (7, 7), (11, 6), (13, 7), (3, 9), (5, 10), (6, 10),
      (10, 10), (11, 9), (12, 10))
  put(T, 'r', (6, 3), (12, 2), (13, 1), (14, 1), (14, 2), (13, 5), (14, 6), (13, 6), (6, 7), (16, 10), (1, 10), (0, 10))
  put(T, 't', (7, 1), (0, 2), (0, 7), (14, 7), (19, 7), (20, 7), (19, 8), (20, 8), (18, 9), (19, 9), (20, 9), (18, 10), (19, 10), (20, 10), (16, 4))
  return T, {"players": [(1, 4), (1, 5), (2, 4), (2, 5), (0, 4), (0, 5), (3, 4), (3, 5), (1, 3), (0, 6)],
             "enemies": [(17, 5), (18, 5), (17, 6), (18, 6), (19, 5), (19, 4), (16, 6), (18, 7), (17, 7), (20, 5), (19, 6), (16, 7)]}, []

def vaha():
  T = grid()
  for c in range(4, 21): T[0][c] = '#'
  for c in range(6, 21): T[1][c] = '#'
  put(T, 'a', (0, 1), (5, 1), (6, 2), (7, 2), (9, 2), (13, 2), (14, 2), (15, 2), (1, 3), (8, 3), (11, 3), (14, 3), (16, 3),
      (2, 4), (3, 4), (17, 4), (2, 5), (8, 5), (17, 5), (7, 6), (8, 6), (17, 6), (8, 7), (11, 7), (16, 7), (11, 8), (14, 8),
      (12, 9), (14, 9))
  put(T, 'g', (1, 1), (3, 2), (5, 2), (0, 3), (9, 3), (15, 3), (4, 4), (16, 4), (7, 5), (6, 5), (9, 6), (9, 7), (12, 8), (13, 8),
      (15, 8), (16, 8), (15, 9))
  put(T, 'n', (0, 2), (1, 2), (2, 2), (2, 3), (3, 3), (4, 3), (5, 3), (6, 4), (7, 4), (8, 4), (9, 4), (10, 4), (11, 4), (12, 4),
      (13, 4), (14, 4), (15, 4), (9, 5), (16, 5), (10, 6), (15, 6), (16, 6), (10, 7), (13, 7), (15, 7))
  put(T, 'w', (10, 5), (11, 5), (12, 5), (13, 5), (14, 5), (15, 5), (11, 6), (12, 6), (13, 6), (14, 6), (12, 7), (14, 7))
  put(T, 'r', (4, 5), (6, 6), (10, 3), (12, 3), (18, 5), (10, 8), (17, 8), (11, 9))
  return T, {"players": [(1, 6), (1, 7), (2, 6), (2, 7), (0, 6), (0, 7), (3, 6), (3, 7), (1, 8), (2, 8)],
             "enemies": [(19, 5), (19, 6), (20, 5), (20, 6), (18, 6), (19, 4), (18, 7), (19, 7), (20, 4), (20, 7), (18, 3), (19, 3)]}, []

def kanyon():
  T = grid()
  for c in range(W):
    if c not in (15,): T[0][c] = '#'
  put(T, '#', (0, 1), (2, 1), (4, 1), (6, 1), (8, 1), (10, 1), (12, 1), (18, 1), (20, 1), (19, 1))
  put(T, '#', (5, 9), (6, 9), (7, 9), (9, 9), (17, 9), (18, 9), (19, 9), (20, 9))
  for c in range(W):
    if c not in (12, 13, 14, 15, 16): T[10][c] = '#'
  put(T, 'w', (0, 5), (2, 5), (3, 4), (4, 4), (5, 3), (6, 3), (7, 3), (8, 3), (9, 3), (9, 4), (10, 5), (11, 5), (11, 6), (12, 6),
      (12, 7), (13, 6), (15, 5), (15, 6), (16, 5), (17, 4), (19, 4), (20, 5))
  put(T, 'n', (1, 5), (0, 6), (2, 6), (13, 7), (18, 5))
  put(T, 'p', (14, 6), (14, 7))
  put(T, 'a', (1, 4), (3, 5), (8, 4), (10, 4), (17, 3))
  put(T, 'g', (1, 3), (4, 5), (5, 4), (6, 4), (7, 4), (5, 2), (11, 2), (12, 3), (10, 6), (10, 7), (11, 7), (15, 7), (17, 5),
      (19, 5), (20, 2), (19, 8))
  put(T, 'r', (13, 2), (7, 6), (1, 8), (20, 7))
  put(T, 't', (6, 6), (2, 9))
  return T, {"players": [(1, 7), (2, 7), (3, 7), (2, 8), (3, 8), (0, 7), (0, 8), (4, 7), (4, 8), (3, 6)],
             "enemies": [(17, 7), (18, 7), (17, 8), (18, 8), (16, 7), (19, 7), (16, 8), (18, 6), (19, 6), (17, 6), (20, 8), (16, 9)]}, []

MAPS = [
  ('col-gemi-enkazi', 'Gemi Enkazı', 'Shipwreck', gemi, 'Kuma gömülmüş büyük gemi enkazı ve dev iskelet: güverte (p) normal, kaburgalar ve kemikler örtü (k), sandık ve fıçılar (x) zorlu + yarım siper. Parti batı kumlarında, düşman doğuda.'),
  ('col-sutun-harabesi', 'Sütun Harabesi', 'Column Ruins', sutun, 'Ayakta sütunlar (c) geçilmez ve tam siper, devrik sütunlar (k) ve kaya yığınları (r) örtü; doğuda kemer (iki ayak geçilmez, ortası açık).'),
  ('col-vaha', 'Vaha', 'Oasis', vaha, 'Kuzeyde kayalık duvar (oyun alanı dışı), batıdan gelen dere ve gölet: kıyı sığ (n), göletin ortası derin (w). Palmiyeler (a) geçilmez, çalılar (g) zorlu + gizlenme.'),
  ('col-kanyon-nehri', 'Kanyon Nehri', 'Canyon River', kanyon, 'Kanyon tabanında kıvrılan nehir derin (w); taşlı sığ geçitler (n) iki uçta, ortada ahşap köprü (p). Kuzey ve güney kanyon duvarları oyun alanı dışı.'),
]

def one(c, r): return [c + 1, r + 1]

for ad, name, en, fn, note in MAPS:
  T, starts, lights = fn()
  for side, hexes in starts.items():
    for c, r in hexes: assert T[r][c] in '.ptd', (ad, side, c, r, T[r][c])
  p0 = starts['players'][0]; e0 = starts['enemies'][0]
  assert e0 in reach(T, p0), (ad, 'parti düşmana ulaşamıyor')
  tiles = [''.join(r) for r in T]
  os.makedirs(os.path.join(OUT, 'duzeltme'), exist_ok=True)
  fix = os.path.join(OUT, 'duzeltme', ad + '.json')
  json.dump({"_not": "Kuyruk 27: görselin etiketli ızgarasından elle (tam satırlar; scripts/col-haritalar.py yazar).",
             "satirlar": {str(i + 1): t for i, t in enumerate(tiles)}}, open(fix, 'w'), ensure_ascii=False, indent=1)
  open(fix, 'a').write('\n')
  data = {
    "id": ad, "bolge": "col", "gorsel": f"col/{ad}", "name": name, "nameEn": en, "environmentId": ENV,
    "orientation": "flat-top", "offset": "odd-q", "size": {"cols": W, "rows": H}, "hexFeet": 5, "tiles": tiles,
    "startZones": {"players": {"colRange": [1, 5], "hexes": [one(*h) for h in starts['players']]},
                   "enemies": {"colRange": [16, 21], "hexes": [one(*h) for h in starts['enemies']]},
                   "note": "Kuyruk 27: başlangıçlar sahne tasarımından (batı parti, doğu düşman)."},
    "mirrorable": False, "hide": HIDE,
    "variants": [
      {"id": "gunduz", "name": "Gündüz", "nameEn": "Day", "image": f"maps/col/{ad}.webp", "rules": [HEAT], "effects": DAY_FX},
      {"id": "gece", "name": "Gece", "nameEn": "Night", "image": f"maps/col/{ad}-gece.webp", "rules": [NIGHT(lights)], "effects": NIGHT_FX},
    ],
    "notes": {"tasarim": "Kuyruk 27: " + note},
  }
  path = os.path.join(OUT, ad + '.json')
  json.dump(data, open(path, 'w'), ensure_ascii=False, indent=2); open(path, 'a').write('\n')
  print(ad); print('\n'.join(f'{i+1:2} {t}' for i, t in enumerate(tiles)))
