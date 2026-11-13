# Kuyruk 29 K28b: Buzul, Dağ ve Bataklık haritalarının mekanik kuralları ve nesneleri (python3 scripts/k28b-mekanikler.py).
# K27b betiğinden sonra çalışır (K27b ek kuralları ve nesneleri korur). Kurallar `surum: 8` (yalnızca yeni savaşlar);
# Game Master anahtarları ve parametreleri data/kural-kontrol.json'da. Koordinatlar 1 tabanlı [sütun, satır].
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
S = 8
def one(c, r): return [c + 1, r + 1]
def R(id, **kw): return {"id": id, "surum": S, **kw}
FOG = lambda sev: R('fog', severity=sev, note="Sis: görüş menzili (şiddet 1: 6, 2: 4, 3: 2 altıgen); yarısından uzağa menzilli saldırı dezavantajlı.")
SNOW = lambda sev: R('snowfall', severity=sev, note="Kar yağışı: 0 kapalı, 1 hafif, 2 orta (6 altıgen görüş), 3 şiddetli (3 altıgen, açık kar zorlu). Rüzgâr kıran taş (k) dibi korunur.")
MUD = R('sinkMud', terrain='n', dc=10, note="Batıran çamur: ağır zırhlı çamura girince Atletizm DC 10; başarısızsa batar, yürüyüş biter.")
def obj(id, kind, c, r, **kw): return {"id": id, "kind": kind, "at": one(c, r), **kw}

# harita → (gündüz ek kurallar, gece ek kurallar, nesneler, gece ışıkları değişikliği)
PLAN = {
  'buzul-acik': ([SNOW(2), R('thinIce', dc=10, damage='1d6', damageType='cold', note="İnce buz: yarık (u) komşusu altıgende ağır zırhlı DEX DC 10; başarısızsa soğuk su 1d6 + Prone.")],
                 [SNOW(2), R('thinIce', dc=10, damage='1d6', damageType='cold')], [], None),
  'buzul-kamp': ([SNOW(1), R('avalanche', warnRounds=2, dc=12, damage='2d6', hexes=[one(c, r) for r in (3, 4, 5) for c in range(0, 6)],
                   note="Çığ: Game Master tetikler; 2 tur sonra kuzeybatı yamaç eteğinde DEX DC 12, başarısızsa 2d6 ezilme + Prone (gömülme).")],
                 [SNOW(1), R('avalanche', warnRounds=2, dc=12, damage='2d6', hexes=[one(c, r) for r in (3, 4, 5) for c in range(0, 6)])], [], None),
  'buzul-kayalik': ([SNOW(1), R('iceSeal', content=0, monster='ice-mephit', count=2, note="Mühür: yıkılınca (ateş/ışık ya da saldırı) altında hazine ya da pusu (Game Master: içerik 0 hazine, 1 pusu).")],
                    [SNOW(1), R('iceSeal', content=0, monster='ice-mephit', count=2)], [obj('muhur', 'iceSeal', 14, 3)], None),
  'buzul-tapinak': ([R('brazierLight', radius=2, note="Mangallar ışık verir; söndürülen mangal (bitişikken eylem) karanlık bırakır.")],
                    [R('brazierLight', radius=2), R('darkness', unlitSightHexes=3, darkvisionHexes=12, lightRadiusHexes=2, lights=[], unseenTargetsUntargetable=True, unseenAttackerAdvantage=True)],
                    [obj('mangal1', 'brazier', 9, 1), obj('mangal2', 'brazier', 11, 1), obj('mangal3', 'brazier', 12, 1), obj('mangal4', 'brazier', 8, 5),
                     obj('mangal5', 'brazier', 15, 4), obj('mangal6', 'brazier', 3, 6), obj('duvar1', 'crackedWall', 6, 5), obj('duvar2', 'crackedWall', 14, 6),
                     obj('duvar3', 'crackedWall', 9, 7)], 'nolights'),
  'dag-kopru': ([R('bridgeBreak', bridges={"kopru": [one(c, r) for c, r in [(8, 5), (9, 5), (10, 5), (11, 5), (12, 5), (13, 4), (14, 4)]]}, to={"kopru": 'u'},
                   note="Taş köprü HP'li nesne: yıkılırsa geçit kapanır, üstündekiler düşer."),
                 R('bridgeGust', dc=10, dir='S', note="Köprüde tur başında sert rüzgâr: DEX DC 10, başarısızsa rüzgâr yönünde itilir (uçurumsa düşer).")],
                [R('bridgeBreak', bridges={"kopru": [one(c, r) for c, r in [(8, 5), (9, 5), (10, 5), (11, 5), (12, 5), (13, 4), (14, 4)]]}, to={"kopru": 'u'}),
                 R('bridgeGust', dc=10, dir='S'), FOG(2)], [obj('kopru', 'bridge', 10, 5)], None),
  'dag-karakol': ([], [FOG(1)], [obj('kapi', 'gate', 10, 5, state='closed')], None),
  'dag-kayalik': ([R('rockRoll', dc=13, damage='3d6', length=4, note="Kaya yığını: bitişikken itilir; yığının ardındaki 4 altıgende DEX DC 13, 3d6 ezilme (başarılıysa yarım).")],
                  [R('rockRoll', dc=13, damage='3d6', length=4), FOG(1)], [obj('kaya1', 'boulderPile', 14, 2), obj('kaya2', 'boulderPile', 16, 7)], None),
  'dag-nobetci': ([R('sentinelPuzzle', dc=14, hidden=one(4, 7), content=0, note="Heykel bulmacası: plakayı okuyan INT (History) DC 14; kılıcın gösterdiği gizli kaya hanesi açılır (Game Master içerik: 0 hazine, 1 silah, 2 ipucu, 3 pusu).")],
                  [R('sentinelPuzzle', dc=14, hidden=one(4, 7), content=0), R('sentinelGaze', dc=12, radius=2, statue=one(3, 1),
                    note="Gece heykelin gözü parlar: 2 altıgen içinde tura başlayan parti üyesi WIS DC 12, başarısızsa bir tur Frightened.")],
                  [obj('plaka', 'plaque', 5, 4)], None),
  'batak-kamp': ([FOG(1), MUD, R('witchCauldron', dc=12, hag='green-hag', note="Cadı kazanı: sağlamken her tur çevresinde zehirli buhar; söndürülür ya da yıkılırsa cadı bir tur saldırılarında dezavantajlı.")],
                 [FOG(2), MUD, R('witchCauldron', dc=12, hag='green-hag')], [obj('kazan', 'cauldron', 18, 4)], None),
  'batak-kale': ([FOG(1), R('boneRise', monster='skeleton', rounds=2, note="Hortlak kemikler: 2 tur sonra iskelet; dağıt eylemi ya da ateş/ışıltı önler.")],
                 [FOG(2), R('boneRise', monster='skeleton', rounds=1)], [obj('kemik1', 'bonePile', 13, 2), obj('kemik2', 'bonePile', 12, 7), obj('kemik3', 'bonePile', 14, 1)], None),
  'batak-adalar': ([FOG(1), MUD, R('bridgeBreak', bridges={"kutuk1": [one(c, r) for c, r in [(3, 5), (4, 5), (5, 5)]], "kutuk2": [one(c, r) for c, r in [(16, 5), (17, 5), (18, 5)]]},
                     to={"kutuk1": 'w', "kutuk2": 'w'}, note="Kütük köprüler HP'li nesne: yıkılınca ada bağlantısı kopar."),
                   R('leeches', terrain='n', dc=10, damage='1d4', damageType='piercing', note="Sülük suyu: sığ suda turunu bitiren CON DC 10, başarısızsa 1d4.")],
                   [FOG(2), MUD, R('bridgeBreak', bridges={"kutuk1": [one(c, r) for c, r in [(3, 5), (4, 5), (5, 5)]], "kutuk2": [one(c, r) for c, r in [(16, 5), (17, 5), (18, 5)]]},
                     to={"kutuk1": 'w', "kutuk2": 'w'}), R('leeches', terrain='n', dc=10, damage='1d4', damageType='piercing')],
                   [obj('kutuk1', 'bridge', 4, 5), obj('kutuk2', 'bridge', 17, 5)], None),
  'batak-cukur': ([FOG(1), R('pitGas', interval=3, dc=12, hexes=[one(c, r) for c, r in [(12, 4), (13, 4), (14, 4), (12, 5), (13, 5), (14, 5), (13, 6), (13, 3)]],
                    note="Zehirli gaz: her 3 turda çukurun ortasında zehirli bulut (CON DC 12, Poisoned).")],
                  [FOG(2), R('pitGas', interval=3, dc=12, hexes=[one(c, r) for c, r in [(12, 4), (13, 4), (14, 4), (12, 5), (13, 5), (14, 5), (13, 6), (13, 3)]])], [], None),
}
BOLGE = {'buzul': 'buzul', 'dag': 'dag', 'batak': 'bataklik'}
for ad, (day, night, objects, light) in PLAN.items():
  p = os.path.join(ROOT, 'harita', BOLGE[ad.split('-')[0]], ad + '.json')
  d = json.load(open(p))
  for v, extra in zip(d['variants'], (day, night)):
    ids = {x['id'] for x in extra}
    v['rules'] = [r for r in v['rules'] if r['id'] not in ids] + extra
    if light == 'nolights':
      for r in v['rules']:
        if r['id'] == 'night': r['lights'] = []
  if objects: d['objects'] = objects
  for o in objects:
    # Çatlak duvarın altı açık zemin: yıkılınca geçit açılır.
    if o['kind'] == 'crackedWall':
      c, r = o['at'][0] - 1, o['at'][1] - 1; row = d['tiles'][r]; d['tiles'][r] = row[:c] + '.' + row[c + 1:]
  json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2); open(p, 'a').write('\n')
  print(ad, [r['id'] for r in d['variants'][0]['rules']], [r['id'] for r in d['variants'][1]['rules']])
