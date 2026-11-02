# Kuyruk 17 G5: K26'da eksik kalan üç haritaya yükseklik katmanı (python3 scripts/k17-yukseklik.py). K26b betiğinin
# yardımcılarıyla aynı biçim (bir seviye = 10 ft; Game Master parametresi). Kararlar DECISIONS.md'de.
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
W, H = 21, 11

def load(bolge, ad):
  p = os.path.join(ROOT, 'harita', bolge, ad + '.json'); return p, json.load(open(p))
def save(p, d):
  json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2); open(p, 'a').write('\n')
def fill(L, v, cells, T=None, only='.'):
  for c, r in cells:
    if T is None or T[r][c] in only: L[r][c] = v
def rect(c0, c1, r0, r1): return [(c, r) for r in range(r0, r1 + 1) for c in range(c0, c1 + 1)]
def by_tile(T, L, ch, v):
  for r in range(H):
    for c in range(W):
      if T[r][c] == ch: L[r][c] = v

def buzul_acik(T):
  # Yarıklar (u) −2 (20 ft düşüş); güneydoğu ormanlı sırt (a ve çevresi) +1 (komşu düzlükle fark 1: tırmanmasız çıkılır).
  L = [[0] * W for _ in range(H)]
  fill(L, 1, rect(17, 20, 7, 10), T, '.ar')
  by_tile(T, L, 'u', -2)
  return L

def buzul_tapinak(T):
  # Kuzeybatı buz uçurumu (u) −3; doğu kaya duvarı (#) +3; sunak kürsüsü (mangallar arası, kuzey orta) +1.
  L = [[0] * W for _ in range(H)]
  fill(L, 1, rect(8, 13, 0, 2), T, '.mx')
  by_tile(T, L, 'u', -3); by_tile(T, L, '#', 3)
  # K26 donmuş şelalenin ardındaki geçit (kırılınca zemin olur) duvar yüksekliği almaz.
  fill(L, 0, [(19, 1), (19, 2), (20, 1), (20, 2)])
  return L

def dag_nobetci(T):
  # Heykelin kaidesi ve çevresi (m) +1; harita kenarındaki kaya duvarları (#) +3.
  L = [[0] * W for _ in range(H)]
  by_tile(T, L, 'm', 1); by_tile(T, L, '#', 3)
  return L

for bolge, ad, fn in [('buzul', 'buzul-acik', buzul_acik), ('buzul', 'buzul-tapinak', buzul_tapinak), ('dag', 'dag-nobetci', dag_nobetci)]:
  p, d = load(bolge, ad)
  L = fn(d['tiles'])
  assert all(-3 <= v <= 8 for row in L for v in row)
  d['heights'] = L
  d.pop('ramps', None)
  save(p, d)
  print(ad); print('\n'.join(' '.join(f'{v:2d}' for v in row) for row in L))
