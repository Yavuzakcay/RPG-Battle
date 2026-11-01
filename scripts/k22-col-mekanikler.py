# Kuyruk 29 K22: Çöl mekanikleri (python3 scripts/k22-col-mekanikler.py). scripts/col-haritalar.py haritaları yeniden
# üretirse ardından bu betik çalıştırılır. Ayrıca Buzul Kayalıkları gecesine kar fırtınası (kar körlüğü + rüzgâr).
# Kurallar `surum: 9` (yalnızca yeni savaşlar); Game Master anahtarları data/kural-kontrol.json. Koordinatlar 1 tabanlı.
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
S = 9
def one(c, r): return [c + 1, r + 1]
def R(id, **kw): return {"id": id, "surum": S, **kw}
FLOOD = R('flashFlood', warnRounds=1, autoRound=0, widen=2, dc=12, damage='1d6', dir='SE',
          note="Ani sel: Game Master tetikler (autoRound > 0 ise o turda kendiliğinden); 1 tur uyarı, nehir 2 altıgen taşar; sudakiler STR DC 12, başarısızsa 1d6 + akışla itilir.")
def deck(tiles):
  hexes = [(c, r) for r in (4, 5) for c in (10, 11, 12) if tiles[r][c] == 'p'] + [(c, r) for r in (7, 8) for c in (3, 4, 5) if tiles[r][c] == 'p']
  return R('rottenDeck', hexes=[one(c, r) for c, r in hexes], dc=12, damage='1d6', to='.', compartment=one(11, 4),
           note="Çürük güverte: işaretli tahtalar ağırlıkla çöker (DEX DC 12; başarısızsa 1d6 + Prone, yürüyüş biter); ortadaki tahtanın altında gizli bölme.")
WORM = R('wormAmbush', monster='ankheg', lair=one(4, 8), emergeRound=3, dc=12, escapeDc=13, sand=['.', 'd'],
         note="Kum pususu: 3. turda kumda duran, yuvaya en yakın parti üyesinin yanından Ankheg çıkar; Algı DC 12 sezerse kurtulur, sezmezse yakalanır (kaçış DC 13).")
SAND = R('sandstorm', kind='kum', visibilityHexes=8, rangedDisadvantageBeyondHexes=4, downwindRangeHexes=2, hideCheckAdvantage=True,
         note="Kum fırtınası: 8 altıgen görüş, 4 altıgen ötesine menzilli dezavantaj; rüzgâr yönüne atış +10 ft, rüzgâra karşı dezavantajlı.")
WIND = R('wind', dir='SE', strength=1)
SNOW = R('sandstorm', kind='kar', visibilityHexes=6, rangedDisadvantageBeyondHexes=3, downwindRangeHexes=2, hideCheckAdvantage=True,
         note="Kar fırtınası (kar körlüğü): 6 altıgen görüş, 3 ötesine menzilli dezavantaj; rüzgâr yönüne atış +10 ft, rüzgâra karşı dezavantajlı.")
SNOW_WIND = R('wind', dir='S', strength=1)
PLAN = {  # harita → (gündüz ek kurallar, gece ek kurallar)
  ('col', 'col-kanyon-nehri'): (lambda t: [FLOOD], lambda t: [FLOOD]),
  ('col', 'col-gemi-enkazi'): (lambda t: [deck(t)], lambda t: [deck(t)]),
  ('col', 'col-sutun-harabesi'): (lambda t: [SAND, WIND], lambda t: []),
  ('col', 'col-vaha'): (lambda t: [WORM], lambda t: [WORM]),
  ('buzul', 'buzul-kayalik'): (lambda t: [], lambda t: [SNOW, SNOW_WIND]),
}
for (bolge, ad), fns in PLAN.items():
  p = os.path.join(ROOT, 'harita', bolge, ad + '.json')
  d = json.load(open(p))
  for v, fn in zip(d['variants'], fns):
    extra = fn(d['tiles'])
    ids = {x['id'] for x in extra}
    v['rules'] = [r for r in v['rules'] if r['id'] not in ids] + extra
  json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2); open(p, 'a').write('\n')
  print(ad, [[r['id'] for r in v['rules']] for v in d['variants']])
