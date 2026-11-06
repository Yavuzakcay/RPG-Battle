# Ana haritada olmayan haritalar (K49 C6)

`python scripts/k49-yetim-haritalar.py` üretir. "Dünyada": Serüven düğümü (senaryo ya da sefer durağı), yerleşim, hapishane, şehir görünümü ya da Serüven bağlantısı açıyor. Yeraltı haritaları kalır (ayrı liste).

Toplam 59 harita: dünyada 47, yeraltı 2, başka yerde kullanılan 10, yetim 0.

## Yetim (hiçbir yerde kullanılmıyor; kaldırma adayı)

- yok

## Dünyada yok ama başka yerde kullanılıyor (kalır)

- `bataklik` (harita/bataklik/bataklik-klasik.json): bolge-karsilasma.json, scripts/harita-bolge-tasi.py, scripts/k27b-haritalar.py, scripts/k28b-mekanikler.py, src/battle/ai.test.ts, src/battle/forced.test.ts, src/battle/maprules.test.ts, src/journey/encounter.test.ts, src/journey/seruven.test.ts, src/journey/seruven33.test.ts, src/map/effects.test.t
- `col` (harita/col/col-klasik.json): bolge-karsilasma.json, scripts/col-haritalar.py, scripts/harita-bolge-tasi.py, scripts/k22-col-mekanikler.py, scripts/k32-yeralti-nehri.py, sim senaryosu col, sim-a2.json, src/app/k19aynalama.test.ts, src/app/setup.test.ts, src/battle/ai.test.ts, src/battle/aiObjectives.test.ts, src/battle/alarm.tes
- `dag` (harita/dag/dag-klasik.json): bolge-karsilasma.json, scripts/harita-bolge-tasi.py, scripts/k17-yukseklik.py, scripts/k26-mekanikler.py, scripts/k26b-yukseklik.py, scripts/k27b-haritalar.py, scripts/k28b-mekanikler.py, src/battle/ai.test.ts, src/battle/forced.test.ts, src/battle/heights.test.ts, src/battle/k26.test.ts, src/battle
- `ada` (harita/deniz/deniz-ada.json): scripts/harita-bolge-tasi.py, src/battle/area-spells.test.ts, src/battle/forced.test.ts, src/battle/maprules.test.ts, src/battle/movement.test.ts, src/map/effects.test.ts, src/map/maps.test.ts, src/ui/audio/sound.test.ts, src/ui/camera.test.ts
- `gemi` (harita/deniz/deniz-gemi.json): scripts/harita-bolge-tasi.py, src/battle/k19vision.test.ts, src/battle/maprules.test.ts, src/map/effects.test.ts, src/map/maps.test.ts, src/ui/audio/sound.test.ts, src/world/roam.test.ts
- `kale-avlu` (harita/kale/kale-avlu.json): scripts/harita-bolge-tasi.py, scripts/k34a-yerlesim.py, sim senaryosu kale-avlu-garnizon, sim senaryosu kale-avlu-savunma, src/map/genis.test.ts, src/map/kaleBaskini.test.ts, src/map/maps.test.ts, src/screens/k25.test.tsx
- `kale-baskini` (harita/kale/kale-baskini.json): scripts/harita-bolge-tasi.py, sim senaryosu kale-baskini, sim senaryosu kale-baskini-muhafiz, src/battle/k14a.test.ts, src/map/genis.test.ts, src/map/kaleBaskini.test.ts, src/map/maps.test.ts, src/screens/k25.test.tsx
- `kale` (harita/kale/kale-klasik.json): scripts/harita-bolge-tasi.py, sim senaryosu kale, sim senaryosu kale-gece, sim-a2.json, sim-boss.json, src/battle/ai.test.ts, src/battle/features.test.ts, src/battle/forced.test.ts, src/battle/k9c.test.ts, src/battle/maprules.test.ts, src/battle/mastery.test.ts, src/battle/night.test.ts, src/map/eff
- `orman-yolu` (harita/orman/orman-genis-yol.json): scripts/harita-bolge-tasi.py, sim senaryosu orman-yolu-avcilar, sim senaryosu orman-yolu-pusu, src/battle/objects.test.ts, src/battle/surfaces.test.ts, src/map/genis.test.ts, src/map/maps.test.ts, src/screens/k25.test.tsx, src/sim/k18bsmoke.test.ts
- `ortamlar-diyari` (harita/vitrin/vitrin-ortamlar-diyari.json): scripts/harita-bolge-tasi.py, src/map/genis.test.ts, src/map/maps.test.ts, src/sim/k18bsmoke.test.ts, vitrin

## Yeraltı (kalır)

- `magara-genis` (harita/yeralti/yeralti-magara-genis.json)
- `magara` (harita/yeralti/yeralti-magara.json)

## Dünyada

- `batak-adalar`: Serüven bataklik/kutuk-adalari
- `batak-cukur`: Serüven bataklik/batik-cukur
- `batak-kale`: Serüven bataklik/batik-kale
- `batak-kamp`: Serüven bataklik/cadinin-kampi
- `buzul-acik`: Serüven buzul/acik-buzul
- `buzul-kamp`: Serüven buzul/karli-kamp
- `buzul-kayalik`: Serüven buzul/buzul-kayaliklari
- `buzul-tapinak`: Serüven buzul/buz-tapinagi
- `col-gemi-enkazi`: Serüven col/gemi-enkazi
- `col-kanyon-nehri`: Serüven col/kanyon-nehri
- `col-sutun-harabesi`: Serüven col/sutun-harabesi
- `col-vaha`: Serüven col/vaha
- `yeralti-nehri`: seruven.json .baglantilar[].id
- `dag-karakol`: Serüven dag/gecit-karakolu
- `dag-kayalik`: Serüven dag/yuksek-kayaliklar
- `dag-kopru`: Serüven dag/ucurum-koprusu
- `dag-nobetci`: Serüven dag/sessiz-nobetci
- `derinlikler-lav-salonu`: Serüven derinlikler/lav (sefer)
- `derinlikler-magara-karakol`: Serüven derinlikler/karakol (sefer)
- `derinlikler-mantar-magarasi`: Serüven derinlikler/mantar (sefer)
- `derinlikler-mezar-labirenti`: Serüven derinlikler/mezar (sefer)
- `hapishane-dis-halka`: Serüven hapishane-adasi/dis-halka
- `hapishane-hucre-platformu`: Serüven hapishane-adasi/hucre-blogu
- `hapishane-iskele`: Serüven hapishane-adasi/iskele
- `hapishane-mudur-kulesi`: Serüven hapishane-adasi/mudur-kulesi
- `orman-heykel-golu`: Serüven orman/mielikki-golu
- `orman-heykel-magarasi`: Serüven orman/heykel-magarasi
- `orman-kemik-acikligi`: Serüven orman/kemik-acikligi
- `orman-oduncu-kampi`: Serüven orman/oduncu-kampi
- `orman-ork-kampi`: Serüven orman/ork-kampi
- `orman`: Serüven orman/patika
- `sehir-meydani`: yerlesim.json .yerlesimler[].haritalar[].mapId
- `taverna`: yerlesim.json .yerlesimler[].haritalar[].kapilar[].to, yerlesim.json .yerlesimler[].haritalar[].mapId
- `volkan`: Serüven volkan/ejder (sefer)
- `volkanik-demirhane`: Serüven volkan/demirhane (sefer)
- `kanyon-koprusu`: Serüven volkan/kopru (sefer)
- `isinlanma-salonu`: Serüven volkan/salon (sefer)
- `lav-tapinagi`: Serüven volkan/tapinak (sefer)
- `dungeon`: Serüven derinlikler/hazine (sefer), Serüven derinlikler/merdiven (sefer), Serüven derinlikler/mesale (sefer), yerlesim.json .yerlesimler[].haritalar[].mapId
- `beyaz-sehir-dis-kapi`: yerlesim.json .yerlesimler[].haritalar[].kapilar[].to, yerlesim.json .yerlesimler[].haritalar[].mapId
- `beyaz-sehir-saray-avlusu`: yerlesim.json .yerlesimler[].haritalar[].kapilar[].to, yerlesim.json .yerlesimler[].haritalar[].mapId
- `kale-ic-avlu`: yerlesim.json .yerlesimler[].haritalar[].kapilar[].to, yerlesim.json .yerlesimler[].haritalar[].mapId
- `kale-onu`: yerlesim.json .yerlesimler[].haritalar[].kapilar[].to, yerlesim.json .yerlesimler[].haritalar[].mapId
- `kale-taht-salonu`: yerlesim.json .yerlesimler[].haritalar[].kapilar[].to, yerlesim.json .yerlesimler[].haritalar[].mapId
- `kasaba-demirci-tapinak`: yerlesim.json .yerlesimler[].haritalar[].kapilar[].to, yerlesim.json .yerlesimler[].haritalar[].mapId
- `kasaba-han`: yerlesim.json .yerlesimler[].haritalar[].kapilar[].to, yerlesim.json .yerlesimler[].haritalar[].mapId
- `kasaba-lagim`: yerlesim.json .yerlesimler[].haritalar[].kapilar[].to, yerlesim.json .yerlesimler[].haritalar[].mapId
## Karar (K49 C6)

Yetim harita yok: dünyada karşılığı olmayan 10 haritanın hepsi sim senaryosu, sefer, test ya da vitrin olarak kullanılıyor (görev: "başka bir yerde kullanılan haritayı kaldırma"). İkinci adımda (kaldırma) silinecek harita çıkmadı; bu yüzden kaldırma commit'i yapılmadı. Klasik haritalar (`col`, `dag`, `bataklik`, `kale`, `ada`, `gemi`) denge simülasyonunun ve testlerin temeli.
