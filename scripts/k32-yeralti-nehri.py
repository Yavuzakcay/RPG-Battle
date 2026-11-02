# Kuyruk 32 M2: Serüven yeraltı nehri koridoru (python3 scripts/k32-yeralti-nehri.py). Zemin harita/col/gorsel/yeralti-nehri.jpg'nin
# 0 tabanlı etiketli ızgarasından (scripts/harita-etiket.ts) elle okundu: # kaya/boşluk (duvar), . kuru kıyı ve kum havuzu,
# n sığ nehir (turkuaz şerit; taş basamaklar da n: sığ su zorlu zemin), sütun 10–11'de dar boğaz. Batı uç Vaha (Çöl) tarafı, doğu uç
# Mielikki Gölü (Orman) tarafı. Gece varyantı yok, kısıtlı görüş yok. Serüven'e özel (seçicide gizli).
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
T = [
  "#####################",  # 0
  "#####################",  # 1
  "###########...#.##...",  # 2  11–13 kemik ve sandık, 15 kristal dibi, 17 heykel, 18–20 aydınlık çıkış ağzı
  "#.........#......#...",  # 3  1–2 kökler ve kum, 10 kaya sütunu, 17 heykel
  "..........#......nnn.",  # 4  10 kaya sütunu (dar boğaz), 17–19 doğuda nehir genişler
  "....nnnnnnnnnnnnnnnnn",  # 5  turkuaz sığ nehir (taş basamaklar dahil)
  "..........#.....n....",  # 6  10 sarkıt (dar boğaz)
  "#.........##.........",  # 7  10–11 kaya; doğuda yosunlu kıyı
  "##..#.....###########",  # 8  6–9 kemikli girinti
  "########..###########",  # 9
  "#####################",  # 10
]
assert all(len(r) == 21 for r in T) and len(T) == 11
def one(c, r): return [c + 1, r + 1]
west = [one(c, r) for c, r in [(0, 4), (0, 5), (1, 4), (1, 5), (0, 6), (1, 6), (2, 4), (2, 6)]]
east = [one(c, r) for c, r in [(20, 3), (20, 4), (20, 6), (19, 3), (19, 6), (20, 7), (19, 7), (18, 6)]]
mid = [one(c, r) for c, r in [(13, 3), (14, 3), (13, 4), (14, 4), (13, 6), (14, 6), (12, 7), (13, 7)]]
d = {
  "id": "yeralti-nehri", "bolge": "col", "gorsel": "col/yeralti-nehri", "name": "Yeraltı Nehri", "nameEn": "Underground River",
  "environmentId": "yeralt-ma-ara", "orientation": "flat-top", "offset": "odd-q", "size": {"cols": 21, "rows": 11}, "hexFeet": 5,
  "gizli": True,
  "startZones": {"players": {"colRange": [1, 3], "hexes": west}, "enemies": {"colRange": [12, 15], "hexes": mid},
                 "note": "Kuyruk 32: parti batı uçtan (Vaha) girer; Orman'dan gelişte Serüven başlangıcı doğu uç (seruven.json bağlantı ucu)."},
 
  "hide": {"terrain": {".": 0}, "adjacentTo": {"#": 0}, "cover": {".": "shadow"}, "note": "Mağara: kaya dibinde gizlenilir."},
  "variants": [{"id": "gunduz", "name": "Gündüz", "nameEn": "Day", "image": "maps/col/yeralti-nehri.webp", "rules": [], "effects": []}],
  "tiles": T,
  "notes": {"tasarim": "Kuyruk 32 M2: Vaha ↔ Mielikki Gölü arası yeraltı nehri koridoru. Ortada turkuaz sığ nehir (n), iki yanda kuru kıyı, sütun 10–11'de dar boğaz; batıda kum havuzu, doğuda yosunlu çıkış."},
}
p = os.path.join(ROOT, 'harita', 'col', 'yeralti-nehri.json')
json.dump(d, open(p, 'w'), ensure_ascii=False, indent=1); open(p, 'a').write('\n')
print(p)
# Serüven bağlantı uçları (data/seruven.json baglantilar[].uclar): batı = Vaha tarafı, doğu = Mielikki tarafı.
print(json.dumps({"a": west, "b": east}))
