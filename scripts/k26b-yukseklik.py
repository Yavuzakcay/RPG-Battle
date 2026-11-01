# Kuyruk 29 K26b: beş haritaya yükseklik katmanı (python3 scripts/k26b-yukseklik.py). Seviyeler görselden bölge bölge
# (bir seviye = 10 ft, Game Master parametresi). K27b betiği bu alanları korur. Kararlar DECISIONS.md'de.
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
W, H = 21, 11

def load(bolge, ad):
  p = os.path.join(ROOT, 'harita', bolge, ad + '.json'); return p, json.load(open(p))
def save(p, d):
  json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2); open(p, 'a').write('\n')
def fill(L, v, cells):
  for c, r in cells: L[r][c] = v
def rect(c0, c1, r0, r1): return [(c, r) for r in range(r0, r1 + 1) for c in range(c0, c1 + 1)]
def by_tile(T, L, ch, v):
  for r in range(H):
    for c in range(W):
      if T[r][c] == ch: L[r][c] = v

def dag_kayalik(T):
  # Basamaklı teraslar: orta havza 0, kuzey ve sağ iç bant 1, üst/sağ/güney dış bantlar 2, köşeler 3. Komşu teraslar
  # arasında fark 1 (tırmanmadan, ek hareketle çıkılır); kuzeybatı köşesinde 2 seviyelik duvar.
  L = [[0] * W for _ in range(H)]
  fill(L, 2, rect(2, 17, 0, 0)); fill(L, 3, rect(0, 1, 0, 1)); fill(L, 3, rect(18, 20, 0, 10))
  fill(L, 1, rect(2, 11, 1, 2)); fill(L, 2, rect(12, 17, 1, 2)); fill(L, 2, rect(0, 1, 2, 2))
  fill(L, 1, [(0, r) for r in range(3, 8)]); fill(L, 1, rect(13, 14, 3, 6)); fill(L, 2, rect(15, 17, 3, 8))
  fill(L, 1, rect(8, 14, 7, 8)); fill(L, 1, rect(0, 7, 8, 8)); fill(L, 2, rect(0, 17, 9, 10))
  return L, []

def dag_karakol(T):
  # Kuleler +2 (z), sur yolu +1 (h); kapı (o) ve çevre 0. Ahşap merdivenler (l) rampa: zeminden kuleye.
  L = [[0] * W for _ in range(H)]
  by_tile(T, L, 'z', 2); by_tile(T, L, 'h', 1); by_tile(T, L, 'l', 1)
  return L, []

def dag_kopru(T):
  # Köprü ve iki yaka 0, uçurum −3 (düşme 30 ft).
  L = [[0] * W for _ in range(H)]
  by_tile(T, L, 'u', -3)
  return L, []

def buzul_kamp(T):
  # Kamp düzlüğü (kütüklü ateşin çevresi, alçak kaya kenarının kuzeyi) +1; doğu düzlüğü +2; donmuş şelale: üst kısmı
  # +2 (dik yüzey: tarladan tırmanma, Atletizm), alt havzası +1 (uzun yol); güney uçurum −3; kayalık sırtlar (#) +3.
  L = [[0] * W for _ in range(H)]
  fill(L, 1, rect(6, 14, 1, 4)); fill(L, 1, [(15, 1), (15, 2)])
  fill(L, 2, rect(17, 19, 0, 5)); fill(L, 1, [(18, 7), (19, 7), (18, 6), (19, 6)])
  for r in range(H):
    for c in (16, 17):
      if T[r][c] == 'i': L[r][c] = 2 if r <= 5 else 1
  by_tile(T, L, 'u', -3); by_tile(T, L, '#', 3)
  return L, []

def buzul_kayalik(T):
  # Doğudaki yükseltili buz düzlüğü (mühürlü) +1; doğu uçurumu −3; buz kayası kümeleri (v) +2 (geçilmez; görüşü keser).
  L = [[0] * W for _ in range(H)]
  fill(L, 1, rect(11, 17, 1, 5)); fill(L, 1, [(16, 6), (17, 6), (15, 6)])
  by_tile(T, L, 'u', -3); by_tile(T, L, 'v', 2)
  return L, []

for bolge, ad, fn in [('dag', 'dag-kayalik', dag_kayalik), ('dag', 'dag-karakol', dag_karakol), ('dag', 'dag-kopru', dag_kopru),
                      ('buzul', 'buzul-kamp', buzul_kamp), ('buzul', 'buzul-kayalik', buzul_kayalik)]:
  p, d = load(bolge, ad)
  L, ramps = fn(d['tiles'])
  assert all(-3 <= v <= 8 for row in L for v in row)
  d['heights'] = L
  if ramps: d['ramps'] = [[c + 1, r + 1] for c, r in ramps]
  else: d.pop('ramps', None)
  save(p, d)
  print(ad); print('\n'.join(' '.join(f'{v:2d}' for v in row) for row in L))
