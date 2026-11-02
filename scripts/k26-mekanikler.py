# Görev K26: Buzul ve Dağ paketlerinin K28b'de olmayan mekanikleri (python3 scripts/k26-mekanikler.py).
# K27b ve K28b betiklerinden sonra çalışır; var olan kuralları ve nesneleri korur, aynı kimliklileri yeniler (tekrar
# çalıştırılabilir). Yeni kurallar `surum: 12` (yalnızca yeni savaşlar); Game Master anahtarları ve parametreleri
# data/kural-kontrol.json'da. Koordinatlar 1 tabanlı [sütun, satır].
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
S = 12
def one(c, r): return [c + 1, r + 1]
def R(id, **kw): return {"id": id, "surum": S, **kw}
def obj(id, kind, c, r, **kw): return {"id": id, "kind": kind, "at": one(c, r), **kw}
COLD = R('coldExposure', startRound=3, interval=3, dc=10,
         note="Dondurucu soğuk (SRD Extreme Cold, savaş ölçeği; varsayılan kapalı): 3. turdan başlayarak her 3 turda CON DC 10, başarısızsa 1 Exhaustion; soğuk direnci/bağışıklığı olan geçer.")

def kayalik_strip(tiles):
  return [one(c, r) for r in (4, 5) for c in range(10, 19) if tiles[r][c] == '.']

# harita → (her iki varyanta eklenecek kurallar (fonksiyon: tiles → liste), nesneler, var olan kurala eklenecek alanlar)
PLAN = {
  'buzul-acik': (lambda t: [COLD], [], {}),
  'buzul-kamp': (lambda t: [COLD], [], {'avalanche': {'autoRound': 0, 'dir': 'SE'}}),
  'buzul-kayalik': (lambda t: [COLD, R('avalanche', warnRounds=1, autoRound=4, dc=12, damage='2d6', dir='S', hexes=kayalik_strip(t),
                     note="Çığ: 4. turda kendiliğinden uyarı (Game Master daha önce tetikleyebilir), bir tur sonra kuzeydoğu sırtının altındaki şeritte DEX DC 12, başarısızsa 2d6 ezilme + Prone ve bir altıgen güneye sürüklenme.")], [], {}),
  'buzul-tapinak': (lambda t: [R('frozenFall', object='selale', hexes=[one(19, 1), one(19, 2), one(20, 1), one(20, 2)], to='.', flag='buzul-selale-gecidi',
                     note="Donmuş şelale (doğu duvarı): saldırıyla kırılır ya da ateşle eritilir (ateş iki kat); ardındaki geçit açılır, keşif bayrağı.")],
                    [obj('selale', 'frozenFall', 19, 2)], {}),
  'dag-karakol': (lambda t: [R('gateLever', lever='kol', gate='kapi', note="Kapı kolu: kalenin içindeki kol çekilince kapı açılır ya da kapanır (eylem; kapı altında yaratık varsa kapanmaz)."),
                   R('ballista', attackBonus=6, damage='3d10', range=[120, 480], note="Balista (kuzey kule): bitişikteki yaratık eylemle yükler, eylemle ateşler; +6, 3d10 delici, 120/480 ft.")],
                  [obj('kol', 'lever', 9, 4), obj('balista', 'ballista', 9, 2)], {}),
  'dag-nobetci': (lambda t: [R('sentinelNiche', chest='nis-sandik', hidden=one(4, 7), note="Gizli niş: heykelin kılıcının gösterdiği kayada; sandık pasif Algıyla (DC 15) bulunur ya da bulmaca açar.")],
                  [obj('nis-sandik', 'chest', 4, 7, gizli=True, bulDc=15)], {}),
}
for ad, (rules, objects, extend) in PLAN.items():
  p = os.path.join(ROOT, 'harita', 'buzul' if ad.startswith('buzul') else 'dag', ad + '.json')
  d = json.load(open(p))
  extra = rules(d['tiles'])
  ids = {x['id'] for x in extra}
  for v in d['variants']:
    v['rules'] = [r for r in v['rules'] if r['id'] not in ids] + [dict(x) for x in extra]
    for r in v['rules']:
      if r['id'] in extend: r.update(extend[r['id']])
  if objects:
    keep = [o for o in d.get('objects', []) if o['id'] not in {x['id'] for x in objects}]
    d['objects'] = keep + objects
  json.dump(d, open(p, 'w'), ensure_ascii=False, indent=2); open(p, 'a').write('\n')
  print(ad, [r['id'] for r in d['variants'][0]['rules']], [o['id'] for o in d.get('objects', [])])
