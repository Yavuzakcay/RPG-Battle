# Ortam genişletme (Kuyruk KQ6-9)

Yalnız ortam eşlemesi (`data/monster-ortamlari.json`) genişledi; `data/monsters.json` değişmedi. Donör kuralları `data/ortam-genisletme.json` (harita başına en çok 4 donör harita; donör ortamındaki her canavar hedef haritaya da eklenir). "Tüm canavarlar" anahtarı aynen duruyor.

| Kimlik | Ad | Bölge | Gizli | Önce | Sonra | Eklenen donörler |
|---|---|---|---|---:|---:|---|
| yeralti-nehri | Yeraltı Nehri | col | evet | 2 ⚑ | 70 | magara, orman-heykel-golu, derinlikler-mantar-magarasi |
| hapishane-dis-halka | Dış Halka | hapishane | evet | 4 ⚑ | 53 | hapishane-hucre-platformu, hapishane-mudur-kulesi, hapishane-iskele, kale-onu |
| hapishane-hucre-platformu | Hücre Platformu | hapishane | evet | 4 ⚑ | 53 | hapishane-dis-halka, hapishane-mudur-kulesi, hapishane-iskele, kale-onu |
| hapishane-mudur-kulesi | Müdür Kulesi | hapishane | evet | 4 ⚑ | 53 | hapishane-dis-halka, hapishane-hucre-platformu, hapishane-iskele, kale-onu |
| hapishane-iskele | İskele | hapishane | evet | 5 ⚑ | 53 | hapishane-dis-halka, hapishane-hucre-platformu, hapishane-mudur-kulesi, kale-onu |
| derinlikler-lav-salonu | Lav Salonu | derinlikler |  | 6 ⚑ | 74 | derinlikler-magara-karakol, derinlikler-mezar-labirenti, derinlikler-mantar-magarasi, magara |
| orman-heykel-magarasi | Heykel Mağarası | orman | evet | 6 ⚑ | 70 | orman-heykel-golu, derinlikler-mantar-magarasi, magara |
| derinlikler-magara-karakol | Maden Ocağı | derinlikler |  | 8 ⚑ | 74 | derinlikler-lav-salonu, derinlikler-mezar-labirenti, derinlikler-mantar-magarasi, magara |
| derinlikler-mezar-labirenti | Mezar Labirenti | derinlikler |  | 8 ⚑ | 74 | derinlikler-lav-salonu, derinlikler-magara-karakol, derinlikler-mantar-magarasi, magara |
| derinlikler-mantar-magarasi | Mantar Mağarası | derinlikler |  | 9 ⚑ | 74 | derinlikler-lav-salonu, derinlikler-magara-karakol, derinlikler-mezar-labirenti, magara |
| orman-heykel-golu | Mielikki Gölü | orman |  | 10 ⚑ | 96 | orman-oduncu-kampi, orman-ork-kampi, orman-kemik-acikligi, ada |
| orman-oduncu-kampi | Oduncu Kampı | orman |  | 10 ⚑ | 35 | orman-heykel-golu, orman-ork-kampi, orman-kemik-acikligi |
| orman-ork-kampi | Ork Kampı | orman |  | 10 ⚑ | 35 | orman-heykel-golu, orman-oduncu-kampi, orman-kemik-acikligi |
| orman-kemik-acikligi | Kemik Açıklığı | orman |  | 13 ⚑ | 35 | orman-heykel-golu, orman-oduncu-kampi, orman-ork-kampi |
| taverna | Taverna | sehir |  | 27 ⚑ | 53 | kasaba-han |
| gemi | Güverte | deniz |  | 32 | 32 |  |
| volkan | Lav Adaları | volkan |  | 40 | 40 |  |
| isinlanma-salonu | Portal Salonu | volkan |  | 46 | 46 |  |
| kanyon-koprusu | Kanyon Köprüsü | volkan |  | 46 | 46 |  |
| lav-tapinagi | Lav Tapınağı | volkan |  | 46 | 46 |  |
| volkanik-demirhane | Volkanik Demirhane | volkan |  | 46 | 46 |  |
| batak-adalar | Kütük Adaları | bataklik |  | 47 | 47 |  |
| batak-cukur | Batık Çukur | bataklik |  | 47 | 47 |  |
| batak-kamp | Cadının Kampı | bataklik |  | 47 | 47 |  |
| bataklik | Bataklık | bataklik |  | 47 | 47 |  |
| batak-kale | Batık Kale | bataklik |  | 48 | 48 |  |
| sehir-meydani | Şehir Meydanı | sehir |  | 52 | 52 |  |
| beyaz-sehir-dis-kapi | Beyaz Şehir Kapısı | yerlesim |  | 53 | 53 |  |
| beyaz-sehir-saray-avlusu | Saray Avlusu | yerlesim |  | 53 | 53 |  |
| kale-ic-avlu | Kale Avlusu | yerlesim |  | 53 | 53 |  |
| kale-onu | Kale Önü | yerlesim |  | 53 | 53 |  |
| kale-taht-salonu | Taht Salonu | yerlesim |  | 53 | 53 |  |
| kasaba-demirci-tapinak | Demirci ve Tapınak | yerlesim |  | 53 | 53 |  |
| kasaba-han | Kasaba Hanı | yerlesim |  | 53 | 53 |  |
| col | Çöl | col | evet | 55 | 55 |  |
| col-gemi-enkazi | Gemi Enkazı | col |  | 55 | 55 |  |
| col-kanyon-nehri | Kanyon Nehri | col |  | 55 | 55 |  |
| col-sutun-harabesi | Sütun Harabesi | col |  | 55 | 55 |  |
| col-vaha | Vaha | col |  | 55 | 55 |  |
| kasaba-lagim | Kasaba Lağımı | yerlesim |  | 55 | 55 |  |
| magara | Mağara | yeralti |  | 60 | 60 |  |
| magara-genis | Mağara (orta) | yeralti | evet | 60 | 60 |  |
| ada | Ada | deniz |  | 69 | 69 |  |
| kale-avlu | Kale ve avlu | kale | evet | 71 | 71 |  |
| kale-baskini | Kale Baskını | kale | evet | 71 | 71 |  |
| orman | Patika | orman |  | 85 | 85 |  |
| orman-yolu | Orman yolu | orman | evet | 85 | 85 |  |
| buzul-acik | Açık Buzul | buzul |  | 88 | 88 |  |
| buzul-kamp | Karlı Kamp | buzul |  | 88 | 88 |  |
| buzul-kayalik | Buzul Kayalıkları | buzul |  | 88 | 88 |  |
| dag | Dağ | dag |  | 88 | 88 |  |
| dag-karakol | Geçit Karakolu | dag |  | 88 | 88 |  |
| dag-kayalik | Yüksek Kayalıklar | dag |  | 89 | 89 |  |
| dag-kopru | Uçurum Köprüsü | dag |  | 89 | 89 |  |
| buzul-tapinak | Buz Tapınağı | buzul |  | 90 | 90 |  |
| dag-nobetci | Sessiz Nöbetçi | dag |  | 90 | 90 |  |
| dungeon | Dungeon | yeralti |  | 112 | 112 |  |

⚑ = önce 30'dan az. Hedef: her harita ≥ 25 uygun canavar (test `src/data/ortamGenisletme.test.ts`).

## Etki (ölçülmedi)

- `src/journey/encounter.ts` (`regionEncounter`) bölge haritasının ortam listesinden seçer; bölge haritaları `buzul-acik`, `dag-karakol`, `orman`, `col-vaha`, `batak-adalar`, `kale-onu`, `isinlanma-salonu` genişletilen haritalar arasında değil (zaten ≥ 40): `data/bolge-karsilasma.json` ve bölge karşılaşmaları değişmez.
- Genişleyen haritalar yalnız Game Master kurulumunda (kademeli düşman listesi) ve Serüven düğümlerinin harita-ortam süzmesinde daha geniş havuz verir. Denge ölçümü yapılmadı.
