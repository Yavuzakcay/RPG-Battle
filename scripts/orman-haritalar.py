# Kuyruk 23: Orman paketinin dört yeni haritası (python3 scripts/orman-haritalar.py). Depo kökünde çalıştırılır.
# Zemin: görselin koordinatlı ızgarasından elle okunan altıgenler (0 tabanlı sütun, satır) → harita/orman/duzeltme/<ad>.json
# (tam satırlar; D1 hattı) → `npm run harita-zemin` önerisiyle birleştirilir (düzeltme tam satır olduğu için son söz onda)
# → harita/orman/<ad>.json. Eğik çizilmiş nesnelerde (çadır, kulübe, heykel) geçilmez altıgen yalnızca zemine değen
# tabanda; çatı/üst kısım geçilebilir. Gece: aynı harita, ayrı gece görseli (`<ad>-gece`) + `night` kuralı (klasik
# Orman ve diğer gece/akşam varyantlarının yöntemi). Kimlik = ad.
import json, os, subprocess, tempfile
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'harita', 'orman')
one = lambda c, r: [c + 1, r + 1]
BLOCKED = set('#scumvaeO')
def grid(W, H, ch='.'): return [[ch] * W for _ in range(H)]
def put(T, pts, ch):
  for c, r in pts: T[r][c] = ch
def row(T, r, c0, c1, ch):
  for c in range(c0, c1 + 1): T[r][c] = ch
def nbrs(c, r, W, H):
  d = [(1, -1), (1, 0), (-1, -1), (-1, 0), (0, -1), (0, 1)] if c % 2 == 0 else [(1, 0), (1, 1), (-1, 0), (-1, 1), (0, -1), (0, 1)]
  return [(c + dc, r + dr) for dc, dr in d if 0 <= c + dc < W and 0 <= r + dr < H]
def passable(ch): return ch not in BLOCKED and ch != '~'
def reach(T, start, wall=set()):
  H, W = len(T), len(T[0]); seen = {start}; q = [start]
  while q:
    c, r = q.pop()
    for n in nbrs(c, r, W, H):
      cc, rr = n
      if n not in seen and passable(T[rr][cc]) and T[rr][cc] not in wall: seen.add(n); q.append(n)
  return seen
def satirlar(T): return {str(i + 1): ''.join(r) for i, r in enumerate(T)}

def zemin(ad, size, T):
  os.makedirs(os.path.join(OUT, 'duzeltme'), exist_ok=True)
  fix = os.path.join(OUT, 'duzeltme', ad + '.json')
  json.dump({"_not": "Kuyruk 23: görselin koordinatlı ızgarasından elle (tam satırlar; scripts/orman-haritalar.py yazar).", "satirlar": satirlar(T)},
            open(fix, 'w'), ensure_ascii=False, indent=1); open(fix, 'a').write('\n')
  with tempfile.TemporaryDirectory() as td:
    out = os.path.join(td, 'z.json')
    subprocess.run(['npm', 'run', '-s', 'harita-zemin', '--', ad, '--boyut', size, '--gorsel', 'orman/' + ad, '--cikti', out], cwd=ROOT, check=True, capture_output=True)
    return [list(l) for l in json.load(open(out))['tiles']]

SAFE = lambda T, c, r: T[r][c] in '.pnlogtk'
def snap(T, pts, taken):
  H, W = len(T), len(T[0]); res = []; taken = set(taken)
  for p in pts:
    q = [p]; seen = {p}
    while q:
      c, r = q.pop(0)
      if SAFE(T, c, r) and T[r][c] not in 'tk' and (c, r) not in taken: break
      for n in nbrs(c, r, W, H):
        if n not in seen: seen.add(n); q.append(n)
    res.append((c, r)); taken.add((c, r))
  return res

HIDE = {"terrain": {"g": 2}, "adjacentTo": {"a": 0, "r": 0, "k": 0, "x": 0}, "cover": {"g": "leaves"},
        "note": "Çalılıkta (g, +2), ağaç (a), kaya (r), kütük (k) ve fıçı/sandık (x) dibinde gizlenilir."}
STEALTH = {"id": "stealth", "lineOfSightBlockers": ["a"], "note": "Ağaçlar görüşü keser; çalılıkta ve ağaç dibinde gizlenilir."}
DEEP = {"id": "deepWater", "terrain": "w", "swim": True, "heavyArmorSink": {"ability": "STR", "skill": "Athletics", "dc": 12, "drownAfterRounds": 3},
        "note": "Sığ su n: zorlu zemin. Derin su w: yüzme, zorlu zemin; ağır zırhlı batabilir (mevcut derin su kuralı)."}
DAY_FX = [{"type": "lightShafts", "intensity": 1, "speed": 0.5, "scale": "strong", "params": {"alpha": 0.08}},
          {"type": "fallingLeaves", "intensity": 1, "speed": 0.8, "scale": "strong", "params": {"count": 8, "shapes": 4, "alpha": 0.9, "size": 2}},
          {"type": "birdShadow", "intensity": 1, "scale": "strong", "params": {"everySec": [28, 52], "alpha": 0.28}}]
NIGHT_FX = [{"type": "groundFog", "intensity": 1, "speed": 0.7, "scale": "strong", "params": {"count": 6, "band": [0.55, 1], "alpha": 0.11}},
            {"type": "fireflies", "intensity": 0.8},
            {"type": "motes", "intensity": 1, "scale": "strong", "params": {"count": 10, "alpha": 0.32, "size": 2}}]

import sys
ONLY = sys.argv[1:]
def want(ad): return not ONLY or ad in ONLY

def write(ad, name, nameEn, size, T, players, enemies, goals, note, lights, water=False, objects=None, radius=2, variants=None, extra=None, hide=None, day_only=None, night_only=None, gizli=False):
  T = zemin(ad, size, T)
  enemies = snap(T, enemies, set(players))
  bad = [(c, r) for c, r in players + enemies if not SAFE(T, c, r)]
  if bad: raise SystemExit(f'{ad}: güvenli olmayan başlangıç {bad}')
  H, W = len(T), len(T[0])
  seen = reach(T, players[0])
  lost = [(c, r) for r in range(H) for c in range(W) if passable(T[r][c]) and (c, r) not in seen]
  if lost: raise SystemExit(f'{ad}: ulaşılamayan geçilebilir altıgenler {lost}')
  day_rules = [STEALTH] + ([DEEP] if water else [])
  night = {"id": "night", "lights": [one(*l) for l in lights], "lightRadiusHexes": radius, "passivePerceptionPenalty": 5, "hideAdvantage": True,
           "note": "Gece: yalnızca ışık kaynaklarının çevresi aydınlık. Işıksız altıgende gizlenene karşı karanlık görüşü olmayan gözcünün pasif Algısı −5, Gizlen zarı avantajlı."}
  m = {"id": ad, "bolge": "orman", **({"gizli": True} if gizli else {}), "gorsel": f"orman/{ad}", "name": name, "nameEn": nameEn, "environmentId": "orman",
       "orientation": "flat-top", "offset": "odd-q", "size": {"cols": W, "rows": H}, "hexFeet": 5, "tiles": [''.join(r) for r in T],
       "startZones": {"players": {"colRange": [min(p[0] for p in players) + 1, max(p[0] for p in players) + 1], "hexes": [one(*p) for p in players]},
                      "enemies": {"colRange": [min(p[0] for p in enemies) + 1, max(p[0] for p in enemies) + 1], "hexes": [one(*p) for p in enemies]},
                      "note": "Kuyruk 23: başlangıçlar sahne tasarımından."},
      "hide": hide or HIDE,
       **({"objects": objects} if objects else {}),
       **({"goals": goals} if goals else {}),
       "variants": variants or [
         {"id": "gunduz", "name": "Gündüz", "nameEn": "Day", "image": f"maps/orman/{ad}.webp", "rules": day_rules + (extra or []) + (day_only or []), "effects": DAY_FX},
         {"id": "gece", "name": "Gece", "nameEn": "Night", "image": f"maps/orman/{ad}-gece.webp", "rules": day_rules + (extra or []) + (night_only or []) + [night], "effects": NIGHT_FX}],
       "notes": {"tasarim": note}}
  open(os.path.join(OUT, ad + '.json'), 'w').write(json.dumps(m, ensure_ascii=False, indent=1) + '\n')
  print(ad); print('\n'.join(m['tiles']))
  return T

# ---------------------------------------------------------------- 1) Heykel gölü 31×17 (su ve pusu)
T = grid(31, 17)
put(T, [(0, 0), (1, 0), (3, 1), (4, 1), (3, 2), (4, 2), (4, 3), (4, 4), (5, 4), (6, 4), (6, 5), (7, 5)], 'n')   # dere
for r, a, b in [(4, 13, 21), (5, 7, 21), (6, 8, 23), (7, 9, 24), (8, 9, 25), (9, 10, 26), (10, 13, 26), (11, 14, 26), (12, 15, 25), (13, 18, 22)]:
  row(T, r, a, b, 'n')                                                    # göl kıyısı (sığ)
for r, a, b in [(6, 16, 21), (7, 15, 22), (8, 15, 22), (9, 16, 22), (10, 17, 22), (11, 18, 21)]:
  row(T, r, a, b, 'w')                                                    # derin göl
for r, a, b in [(0, 13, 24), (1, 14, 24), (2, 17, 24), (3, 19, 24), (4, 22, 24), (5, 22, 23)]:
  row(T, r, a, b, 's')                                                    # heykelli kayalık (heykel yüzü kayalığın parçası)
for r in range(2, 7): row(T, r, 27, 30, 's')                              # şelale kayalığı
put(T, [(25, 2), (26, 2), (25, 3), (26, 3), (25, 4), (26, 4), (26, 5)], 's')
put(T, [(25, 5), (25, 6), (26, 6), (26, 7), (24, 6)], 'w')                # şelale havuzu
for r in (0, 1): row(T, r, 25, 30, 's')                                   # kayalığın üstündeki su (ulaşılmaz: duvar sayılır)
put(T, [(28, 7), (29, 7), (30, 7)], 's')
put(T, [(1, 2), (2, 2), (5, 1), (6, 1), (9, 0), (11, 1), (12, 1), (13, 2), (8, 7), (7, 7), (0, 7), (0, 8), (0, 14), (0, 15), (3, 14),
        (3, 15), (6, 15), (6, 16), (29, 13), (30, 13), (27, 15), (27, 16)], 'a')   # ağaçlar
put(T, [(3, 6), (4, 6), (0, 6), (3, 11), (4, 11), (10, 14), (9, 14)], 'g')        # çalılar
put(T, [(1, 4), (10, 3), (16, 2), (7, 12), (17, 13)], 'r')                         # kıyıdaki yosunlu kayalar (örtü)
# Kuyruk 24: nilüfer taşları ve göl tabanındaki taşlar sığ geçit (n); gölün geri kalanı derin (w). Kuzey kıyı şeridi
# (satır 4) heykelin dibine giden sığ kıyı.
PADS = {(12, 5), (13, 5), (14, 5), (15, 4), (16, 5), (17, 4), (23, 10), (24, 11), (25, 10),
        (10, 6), (11, 7), (12, 7), (13, 8), (14, 8), (14, 9), (15, 9), (15, 10)}
for r in range(5, 14):
  for c in range(9, 27):
    if T[r][c] == 'n' and (c, r) not in PADS: T[r][c] = 'w'
WATERFALL = {"id": "waterfall", "surum": 3, "eyeId": "heykelGozu", "dc": 13, "skills": ["investigation", "perception"],
             "hexes": [one(28, 7), one(28, 6), one(29, 6)], "to": ".", "flag": "heykel-magarasi-kesfedildi",
             "note": "Kuyruk 24: heykelin gözü (statueEye, heykelin yüzünde; sığ kıyıdan bitişik) INT (Investigation) ya da WIS (Perception) DC 13 ile çözülür: şelale ayrılır, şelale kayalığındaki geçit (28–29, 6–7) açılır. Arkasında sandık. Kuyruk 24b: geçide ilk giren parti üyesi heykel-magarasi-kesfedildi bayrağını üretir (sefer ekranı kullanacak)."}
if want('orman-heykel-golu'): write('orman-heykel-golu', 'Mielikki Gölü', 'Lake of Mielikki', '31x17', T, extra=[WATERFALL],
  objects=[{"id": "heykelGozu", "kind": "statueEye", "at": one(22, 4)}, {"id": "gecitSandik", "kind": "chest", "at": one(29, 6)}],
  players=[(2, 9), (3, 9), (2, 10), (3, 10), (4, 9), (4, 10), (1, 10), (2, 11), (5, 9), (5, 10)],
  enemies=[(27, 9), (28, 9), (27, 11), (28, 11), (29, 10), (24, 13), (25, 12), (14, 3), (15, 3), (18, 3), (12, 4), (11, 5), (20, 13), (13, 12)],
  goals=None, lights=[(18, 8), (11, 3)], water=True,
  note="Kuyruk 23: göl (kıyı n sığ, orta w derin: yüzme, mevcut derin su kuralı), kuzeyde heykelli kayalık ve doğuda şelale kayalığı duvar (s), dere ve patika, kıyıdaki yosunlu kayalar örtü (r). Parti batıdaki patikada; pusu doğu kıyısında, heykelin dibinde ve güney kıyıda. Gece: ay ışığı göl ortasında ve kuzey kıyıda.")

# ---------------------------------------------------------------- 2) Oduncu kampı 31×17 (köprü boğazı)
T = grid(31, 17)
RAV = {0: [11, 12], 1: [11, 12], 2: [9, 10, 11], 3: [8, 9], 4: [6, 7, 8], 5: [5, 6], 6: [3, 4, 5], 7: [2, 3, 4], 8: [0, 1, 2], 9: [0]}
for r, cs in RAV.items(): put(T, [(c, r) for c in cs], 'u')               # uçurum
put(T, [(11, 0), (12, 0), (7, 4), (8, 4)], 'p')                           # iki ahşap köprü
for r in (13, 14, 15): row(T, r, 0, 30, 'w')                              # güneydeki nehir (derin)
for r in (13, 14, 15): put(T, [(14, r), (15, r)], 'p')                    # güney köprüsü
put(T, [(14, 4), (15, 4), (16, 4), (7, 8), (7, 9), (8, 9), (9, 8), (9, 9), (23, 8), (24, 8), (25, 8), (24, 9)], 's')   # kulübeler (taban)
put(T, [(19, 1), (20, 1), (21, 1), (19, 2), (19, 3), (19, 4), (20, 4), (21, 4), (23, 1), (25, 1), (26, 1), (26, 2), (26, 3), (26, 4),
        (26, 5), (25, 5), (22, 4), (22, 5)], 's')                         # harabe duvarları (içi açık)
put(T, [(23, 3)], 'r')
put(T, [(8, 1), (4, 3), (3, 4), (9, 6), (10, 7), (12, 8), (13, 9), (15, 8), (16, 9), (21, 8), (18, 3), (12, 11), (13, 11), (17, 11),
        (19, 12), (6, 10), (11, 4), (14, 2), (2, 5)], 't')                # kütük kökleri (zorlu)
put(T, [(10, 4), (5, 8), (11, 12), (18, 7), (27, 6), (29, 12)], 'r')      # kayalar
put(T, [(0, 0), (1, 0), (0, 2), (0, 3), (0, 4), (0, 5), (1, 5), (0, 6), (0, 10), (1, 10), (2, 10), (0, 11), (2, 11), (4, 10), (0, 12),
        (3, 0), (5, 0), (6, 0), (7, 0), (17, 0), (18, 0), (20, 0), (21, 0), (22, 0), (23, 0), (24, 0), (28, 0), (29, 0), (30, 0), (30, 1),
        (29, 2), (30, 2), (30, 3), (30, 4), (30, 5), (29, 5), (30, 6), (29, 7), (30, 7), (28, 8), (30, 8), (30, 9), (29, 10), (30, 10), (30, 11),
        (29, 11), (0, 16), (1, 16), (7, 16), (13, 16), (20, 16), (25, 16), (26, 16), (27, 16), (28, 16), (29, 16), (30, 16), (18, 11)], 'a')
put(T, [(1, 1), (5, 2), (29, 9), (28, 12), (27, 11), (19, 16)], 'g')      # çalılar
SOUTH = [(15, 16), (14, 16), (16, 16), (12, 16)]
ODUNCU_RULES = [
  {"id": "treeFell", "surum": 3, "checkDc": 15, "saveDc": 13, "damage": "2d6",
   "trees": {"agac1": {"dir": "SE", "length": 5}, "agac2": {"dir": "S", "length": 4}},
   "note": "Kuyruk 24: devrilebilir ağaçlar STR (Athletics) DC 15 ya da HP'si bitince kuraldaki yöne devrilir; hattakiler DEX DC 13 (2d6, başarıda yarım). Gövde yarım siper (k); agac1 uçurumu tek altıgende (9,2) keser: orası geçit (p)."},
  {"id": "bridgeBreak", "surum": 3, "bridges": {"kopru1": [one(11, 0), one(12, 0)], "kopru2": [one(7, 4), one(8, 4)],
     "kopru3": [one(c, r) for r in (13, 14, 15) for c in (14, 15)]}, "to": {"kopru1": "u", "kopru2": "u", "kopru3": "w"},
   "note": "Kuyruk 24: üç köprü HP'li nesne (kırılınca uçurum/nehir; mevcut uçurum ve derin su kuralları)."},
  {"id": "riverBlocked", "surum": 3, "from": "w", "to": "R",
   "note": "Kuyruk 24: Game Master anahtarı (varsayılan kapalı): açıkken nehir geçilmez (R; uçan geçer), kapalıyken yüzülerek geçilir."}]
if want('orman-oduncu-kampi'): write('orman-oduncu-kampi', 'Oduncu Kampı', "Woodcutters' Camp", '31x17', T, extra=ODUNCU_RULES,
  objects=[{"id": "agac1", "kind": "tree", "at": one(5, 0)}, {"id": "agac2", "kind": "tree", "at": one(1, 5)},
           {"id": "kopru1", "kind": "bridge", "at": one(11, 0)}, {"id": "kopru2", "kind": "bridge", "at": one(8, 4)},
           {"id": "kopru3", "kind": "bridge", "at": one(14, 14)}],
  players=[(2, 1), (2, 2), (3, 1), (3, 2), (4, 1), (4, 2), (1, 3), (2, 3), (3, 3), (5, 3)],
  enemies=[(13, 6), (14, 6), (16, 6), (12, 10), (14, 11), (16, 11), (15, 12), (14, 12), (20, 6), (22, 3), (24, 2), (21, 9), (10, 9), (17, 10)],
  goals={"mode": "any", "list": [{"id": "oduncu", "kind": "veya", "options": [[{"id": "oduncu-yen", "kind": "defeat"}],
         [{"id": "oduncu-gecis", "kind": "reach", "who": "all", "hexes": [one(*h) for h in SOUTH]}]]}]},
  lights=[(15, 5), (8, 10), (24, 10), (14, 12)],
  note="Kuyruk 23: KB'deki parti ile kamp arasında uçurum (u, geçilmez; uçan geçer); geçitler iki ahşap köprü (11–12,0 ve 7–8,4). Güneydeki nehir derin su (w; yüzme mevcut kuralla mümkün ama yavaş), güney köprüsü (14–15, 13–15) tek kuru geçit. Harabe duvarları geçilmez, içi açık; kulübeler geçilmez (taban); kütük kökleri zorlu (t). Hedef VEYA: düşmanları yen ya da herkes güney köprüsünden karşı kıyıya.", water=True)

# ---------------------------------------------------------------- 3) Ork kampı 21×11 (akın)
T = grid(21, 11)
put(T, [(c, 0) for c in range(0, 12)] + [(0, 1), (1, 1), (2, 1), (3, 1), (0, 2), (1, 2), (0, 3), (1, 3), (0, 4), (0, 5), (0, 6), (0, 7),
        (1, 7), (0, 8), (1, 8), (0, 9), (1, 9), (2, 9), (0, 10), (1, 10), (2, 10), (3, 10), (4, 10), (5, 10)], 'a')   # orman kenarı
for r in (0, 1): row(T, r, 15, 20, 's')                                   # kuzeydoğu kayalık
put(T, [(20, 2)], 's')
put(T, [(5, 3), (6, 3), (7, 3), (11, 3), (12, 3), (13, 3), (2, 6), (3, 6), (4, 6), (14, 6), (15, 6), (16, 6), (8, 10), (9, 10), (10, 10), (11, 10)], 's')   # çadırlar (taban)
put(T, [(8, 2), (9, 2), (4, 8), (5, 8)], 'm')                             # silah rafları
put(T, [(9, 5)], 'm')                                                     # ateş çukuru
put(T, [(4, 3), (4, 4), (16, 7), (15, 3), (14, 8)], 'x')                  # fıçı, sandık, masa
put(T, [(20, 4), (19, 5), (20, 5), (18, 6), (19, 6), (18, 7), (17, 8), (18, 8), (17, 9), (16, 10), (17, 10)], 't')   # doğudaki çukur yol (zorlu)
put(T, [(19, 9)], 'r')
TENTS = {"cadir1": [(5, 3), (6, 3), (7, 3)], "cadir2": [(11, 3), (12, 3), (13, 3)], "cadir3": [(2, 6), (3, 6), (4, 6)],
         "cadir4": [(14, 6), (15, 6), (16, 6)], "cadir5": [(8, 10), (9, 10), (10, 10), (11, 10)]}
ORK_ENEMIES = [(16, 3), (6, 4), (7, 4), (10, 4), (11, 4), (3, 5), (5, 5), (13, 4), (14, 4), (16, 5), (7, 7), (9, 7), (11, 7), (6, 2), (3, 7)]
ORK_RULES = [
  {"id": "hornAlarm", "surum": 3, "sentryGroup": "nobet", "campGroup": "kamp", "delayRounds": 1,
   "groups": [{"id": "nobet", "state": "calm", "hexes": [one(16, 3)]},
              {"id": "kamp", "state": "calm", "hexes": [one(*h) for h in ORK_ENEMIES[1:]]}],
   "note": "Kuyruk 24: kuzeydoğu kayalığın dibindeki nöbetçi (habersiz grup) partiyi fark edince alarmlanır; alarmından 1 tur sonra tur başında ayakta ve etkinse boynuzu öttürür, çadırlardaki kamp (habersiz grup) takviye olarak alarmlanır. Nöbetçi o ana dek etkisizse alarm iptal. Gizli yaklaşan parti mevcut gizlenme/sürpriz kurallarıyla başlar (habersiz nöbetçi turunu atlar, alarmda dezavantajlı inisiyatif)."},
  {"id": "hornReinforce", "surum": 4, "interval": 2, "waveSize": 1, "maxTotal": 12, "monsters": ["tough", "berserker"],
   "note": "Kuyruk 24b: boynuz çaldıktan sonra her 2 turda bir (tur başında) 1 ork takviyesi ayakta kalan çadırların yanından gelir (toplam en çok 12); bütün çadırlar yıkılınca/yanınca durur. SRD 5.2.1'de ork yok: Tough ve Berserker sırayla (zar yok). Kapalıysa eski tek seferlik davranış (yalnızca kamp alarmı)."},
  {"id": "tentFire", "surum": 3, "damage": "1d6", "spreadHexes": 4, "tents": {k: [one(*h) for h in v] for k, v in TENTS.items()},
   "note": "Kuyruk 24: ateş hasarı ya da meşale (eylem) çadırı tutuşturur (alev yüzeyi); her tur başında rüzgâr yönündeki (±60°) 4 altıgen içindeki çadıra sıçrar, yanan çadıra bitişik duran 1d6 ateş hasarı alır."},
  {"id": "wind", "surum": 3, "kind": "fire", "dir": "NE",
   "note": "Kuyruk 24: ortak rüzgâr kuralı (tür parametresi kind: fire | sand; çöl akşamındaki kum fırtınasıyla aynı kural). Yön Game Master kurulumunda değişir."}]
if want('orman-ork-kampi'): write('orman-ork-kampi', 'Ork Kampı', 'Orc Camp', '21x11', T, extra=ORK_RULES,
  objects=[{"id": k, "kind": "tent", "at": one(*v[len(v) // 2])} for k, v in TENTS.items()],
  players=[(12, 8), (13, 8), (12, 9), (13, 9), (14, 9), (14, 10), (13, 10), (12, 10), (15, 9), (15, 10)],
  enemies=ORK_ENEMIES,
  goals=None, lights=[(9, 5), (6, 4), (13, 4), (13, 7), (7, 8)], radius=2,
  note="Kuyruk 23: SRD 5.2.1'de ork stat bloğu yok; akın Berserker/Tough/Tough Boss/Worg ile (sahne adı 'ork akını'). Çadırlar ve silah rafları geçilmez (çadırda yalnızca taban), ortadaki ateş çukuru geçilmez, meşaleler örtü sayılmaz, doğudaki çukur yol zorlu (t). Parti güneyden kampa dalar. Gece: ateş çukuru ve meşaleler ışık.")

# ---------------------------------------------------------------- 4) Kemik açıklığı 21×11 (ölümsüz + orman canavarı)
T = grid(21, 11)
put(T, [(11, 3), (12, 3), (11, 4), (12, 4), (10, 3)], 'a')                # ortadaki büyük koyu ağaç 1
put(T, [(8, 6), (9, 6), (8, 7), (9, 7)], 'a')                             # ortadaki büyük koyu ağaç 2
put(T, [(0, 0), (0, 1), (5, 0), (6, 0), (7, 0), (9, 0), (13, 0), (14, 0), (15, 0),
        (16, 0), (19, 0), (20, 0), (6, 5), (14, 3), (14, 4), (0, 8), (0, 9), (1, 9), (3, 9), (3, 10), (5, 9), (5, 10), (13, 9), (15, 9),
        (15, 10), (19, 9), (20, 8), (20, 9)], 'a')                         # kenar ağaçları
put(T, [(3, 4), (4, 4), (4, 3), (16, 6), (17, 6), (16, 4), (17, 4), (7, 9), (8, 9), (8, 10), (12, 2)], 'g')   # çalılar (zorlu)
put(T, [(18, 6), (19, 5), (19, 6), (20, 5)], 'k')                         # devrik kütük (örtü)
put(T, [(18, 2), (19, 2)], 's')                                           # çadır (taban)
put(T, [(2, 3), (6, 8), (20, 3)], 'r')
PILES = [(1, 3), (15, 5), (17, 8)]
BONE = {"id": "boneRise", "surum": 3, "monster": "skeleton", "rounds": 2,
        "note": "Kuyruk 24: kemik/kafatası yığınları (bonePile) 2 tur sonra (3. turun başında) SRD Skeleton olarak kalkar; yığına bitişikken dağıt eylemi ya da ateş/ışıltı hasarı önler."}
if want('orman-kemik-acikligi'): write('orman-kemik-acikligi', 'Kemik Açıklığı', 'Bone Clearing', '21x11', T,
  day_only=[BONE], night_only=[{**BONE, "rounds": 1, "note": "Kuyruk 24: gece yığınlar 1 tur sonra (2. turun başında) kalkar."}],
  objects=[{"id": f"kemik{i + 1}", "kind": "bonePile", "at": one(*h)} for i, h in enumerate(PILES)],
  players=[(1, 4), (1, 5), (2, 5), (1, 6), (2, 6), (0, 5), (0, 6), (2, 4), (3, 5), (3, 6)],
  enemies=[(15, 5), (16, 5), (14, 6), (15, 7), (17, 7), (13, 6), (12, 6), (18, 4), (10, 5), (12, 8), (16, 2), (17, 9)],
  goals=None, lights=[(18, 3)], radius=1,
  note="Kuyruk 23: ortada iki büyük koyu ağaç geçilmez (a; gövde ve tepe çekirdeği), çalılar zorlu (g), kemikler ve kafatasları dekor, devrik kütük örtü (k), çadır geçilmez (taban). Parti batıdaki kemik yığınının yanında; ölümsüzler ve orman canavarı doğuda. Gece: yalnızca çadırın feneri.")

# ---------------------------------------------------------------- 5) Heykel mağarası 21×11 (Kuyruk 24; yeraltı, gecesiz)
# Üç oda (batı kristal odası, orta sütunlu salon, doğu mor kristal odası) ortak koridorlarla bağlı: batı–orta (4–5, 5–6),
# orta–doğu (15–16, 4–5). Sütunlar geçilmez (c; uzun gövde iki altıgen), kara boşluk ve mağara duvarı duvar (#), mavi
# havuzlar sığ su (n), taş yığınları zorlu + örtü (r), kristaller geçilmez ışık kaynağı (e), mantarlar dekor (.).
HM = [
  "#####################",
  "#######.c.#e..#######",
  "#.e.##..cnn..c####.e#",
  "#...##...nn.ccc##..e.",
  "c...##nr....crc.#....",
  "c.........ccn........",
  "c........r......#...c",
  "....##nc...n..c.#....",
  ".e.###.....nn.c.#....",
  "######.......e.###r##",
  "########...##########"]
if want('orman-heykel-magarasi'):
  T = [list(r) for r in HM]
  assert all(len(r) == 21 for r in T) and len(T) == 11
  DARK = {"id": "darkness", "unlitSightHexes": 3, "darkvisionHexes": 12, "lightRadiusHexes": 4, "lights": [],
          "unseenTargetsUntargetable": True, "unseenAttackerAdvantage": True,
          "note": "Karanlık mağara: yalnızca kristallerin (e) çevresi aydınlık; ışıksız altıgende karanlık görüşü olmayan 3 altıgen görür."}
  write('orman-heykel-magarasi', 'Heykel Mağarası', 'Statue Cave', '21x11', T,
    players=[(1, 4), (2, 4), (1, 5), (2, 5), (3, 4), (3, 5), (1, 6), (2, 6), (1, 3), (2, 3)],
    enemies=[(9, 4), (10, 5), (8, 6), (11, 7), (10, 8), (13, 6), (18, 5), (19, 6), (18, 7), (17, 4), (12, 2), (8, 8)],
    goals=None, lights=[], gizli=True, hide={"terrain": {}, "adjacentTo": {"c": 0, "r": 0, "e": 0}, "note": "Sütun, taş yığını ve kristal dibinde gizlenilir."},
    variants=[{"id": "karanlik", "name": "Karanlık mağara", "nameEn": "Dark cave", "image": "maps/orman/orman-heykel-magarasi.webp",
               "rules": [DARK], "effects": [{"type": "crystalFlicker", "intensity": 0.6}, {"type": "motes", "intensity": 0.4}, {"type": "drip", "intensity": 0.3}]}],
    note="Kuyruk 24: Heykel Gölü'nün şelale arkasındaki mağara (yeraltı, gece varyantı yok). Üç oda ortak koridorlarla bağlı; karanlık (yalnızca kristaller ışık). Parti batı kristal odasında; düşmanlar orta salonda ve doğu odada.")
