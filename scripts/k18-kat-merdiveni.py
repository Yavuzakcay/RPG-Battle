"""Kuyruk 18 H4: Derinlikler kat merdiveni (savaş içi kat değişimi, `floorLink` kuralı; kural sürümü 15).
Maden Ocağı'nın (derinlikler-magara-karakol) `l` basamakları Mezar Labirenti'ne iner; Mezar Labirenti'nin batı
girişindeki iniş altıgenleri geri çıkar. derinlikler-haritalar.py sonrası çalıştırılır (kuralı ekler ya da yeniler).
Koordinatlar 1 tabanlı [sütun, satır]."""
import json, os
ROOT = os.path.join(os.path.dirname(__file__), '..', 'harita', 'derinlikler')
LINKS = {
  'derinlikler-magara-karakol': {"id": "floorLink", "surum": 15, "to": "derinlikler-mezar-labirenti", "toVariant": "varsayilan",
    "at": [[15, 9], [16, 9]], "arrive": [[2, 8], [2, 9], [3, 8], [3, 9], [4, 8], [4, 9]],
    "enemies": {"skeleton": 3, "ghoul": 1},
    "note": "Kuyruk 18 H4: basamaklar alt kata (Mezar Labirenti) iner; ilk inişte üç iskelet ve bir gulyabani."},
  'derinlikler-mezar-labirenti': {"id": "floorLink", "surum": 15, "to": "derinlikler-magara-karakol", "toVariant": "varsayilan",
    "at": [[2, 8], [2, 9]], "arrive": [[14, 10], [15, 10], [16, 10], [17, 10], [18, 10], [19, 10]],
    "note": "Kuyruk 18 H4: batı girişindeki merdiven Maden Ocağı'na çıkar."},
}
for ad, rule in LINKS.items():
  p = os.path.join(ROOT, ad + '.json')
  m = json.load(open(p))
  for v in m['variants']:
    v['rules'] = [r for r in v.get('rules', []) if r.get('id') != 'floorLink'] + [rule]
  open(p, 'w').write(json.dumps(m, ensure_ascii=False, indent=1) + '\n')
  print(ad)
