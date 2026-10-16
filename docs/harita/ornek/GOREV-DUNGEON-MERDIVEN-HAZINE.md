# Görev: Dungeon'a "Merdiven" ve "Hazine odası" varyantları

Dosyalar: `dungeon-yeni-varyantlar.json` (iki varyant + `terrainEk`), `public-maps/harita-dungeon-merdiven.webp`, `harita-dungeon-hazine.webp` → `public/maps/`.

1. `data/maps/dungeon.json` varyantlarına iki varyantı ekle (varyant başına tiles/startZones/mirrorable zaten destekleniyor). Mevcut "Koridor/Meşale" kalsın.
2. Yeni arazi harfleri: `l` alçak basamak (yükseklik 1), `y` yüksek basamak/sahanlık (yükseklik 2); ikisi normal maliyet, tırmanma yok. `u` = merdiven boşluğu (düşme), `m` sütun/heykel, `x` raf/sandık/masa (engel+yarım siper), `k` altın/enkaz yığını (zor zemin), `h` hazine kürsüsü (yüksek), `j` gizli tuzak, `o` kapı/kemer.
3. Kural kimlikleri (data-driven, JSON'da sabit değerler):
   - `highGround`: yüksekliği fazla olan saldırgan menzilli/yakın atakta avantaj (≥1 kademe fark).
   - `stairwellFall`: `u` hex'ine giren/itilen: 2d6 düşme hasarı + Prone, sonraki alt kata değil aynı odada en yakın `l`'ye yerleşir (oda tek kat).
   - `stairShove`: İt komutu yüksekten alçağa itilen hedefe ek 1d4 yuvarlanma + Prone.
   - Hazine: `j` gizli tuzak (mevcut trap kuralı, DC/hasar JSON'da), `hiddenTrap` Algı (pasif) ile fark edilir, `loot` sadece bilgi (GM hikayesi).
4. Doğrulayıcı: mirror ve startZones kontrolleri, `npm run check:harita` (kara ekran) iki varyantı da kapsasın; simülasyonda bu varyantları da ölç (DENGE.md).
5. Overlay kontrolü: önizleme `onizleme/ver_merdiven.jpg` ve `ver_hazine.jpg` ile hex harfleri karşılaştırılsın.

Commit: "Dungeon: Merdiven ve Hazine odasi varyantlari"
