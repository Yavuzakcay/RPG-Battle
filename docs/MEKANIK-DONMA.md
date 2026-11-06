# Mekanik donması (Kuyruk K57)

**Karar (2026-11-06):** bu noktadan (kural sürümü 37, `main` 459ef5d + K57) sonra **yeni mekanik eklenmez**. İzin verilen işler:

- **Hata düzeltme:** var olan bir kuralın SRD 5.2.1'e ya da kendi verisine aykırı çalışması. Davranış değişiyorsa kural sürümü
  artar ve eski kayıt/replay eski kuralla oynar (`ruleVersion.ts`), yoksa sürüm değişmez.
- **Denge ayarı:** senaryo düşman listeleri, karşılaşma bütçesi, yapay zekâ ağırlıkları, ev kuralı parametreleri (JSON). Canavar
  verisi değişmez (CLAUDE.md yasakları).
- **Görsel, efekt, ses:** jeton, harita görseli, sprite, efekt bağlama, müzik/ortam; motor durumuna girmez.
- **Metin ve çeviri**, belge, test, başarım/paket bütçesi.

**İstisna (kullanıcı kararı):** Kuyruk P9 (ek paket ilkel genişletme 3, kural sürümü 38) kullanıcı tarafından açıkça
verildi; donma yalnız o kuyruğun kapsamı için kaldırıldı (DECISIONS.md, 2026-11-06 P9). Kuyruk P10 (ilkel genişletme 4, kural sürümü 39) aynı istisnayla.

Yeni mekanik sayılan (yapılmaz): yeni komut ya da olay türü, yeni süren etki alanı, yeni harita kuralı türü, yeni ev kuralı,
yeni ilkel, yeni Serüven sistemi. Eksik SRD parçaları `harita/belgeler/BUYU-SIGMAYAN.md`, `docs/SRD-DENETIM.md` ve CLAUDE.md
"Bilinen eksikler" tablosunda kalır; donma kaldırılınca oradan seçilir. Donmayı yalnızca kullanıcı kaldırır.

## Ev kuralları ve varsayılanları (tek tablo)

Aşağıdaki liste mevcut durumu verir; **varsayılanı CC değiştirmedi**, karar kullanıcının. "Nerede" sütunu bayrağın değiştiği
yeri söyler. Kaynaklar: `data/ev-kurallari.json` (savaş ev kuralları, `src/battle/houseRules.ts`), `data/seruven.json`
`anahtarlar` (Serüven), `src/app/features.ts` (Ayarlar → deneysel, `rpg-battle-deneysel`), harita varyant kuralları.

| Kimlik | Ne | Varsayılan | Nerede | Not |
|---|---|---|---|---|
| `suYildirim` | Su yıldırımı yayar (bağlı ≤ 7 altıgen) | **açık** | Game Master kurulumu (savaş) |  |
| `buhar` | Ateş + su = buhar (1 tur yoğun örtü) | **açık** | Game Master kurulumu (savaş) |  |
| `donma` | Soğuk + su = buz | **açık** | Game Master kurulumu (savaş) |  |
| `erime` | Ateş + buz = su | **açık** | Game Master kurulumu (savaş) |  |
| `zehirPatlama` | Zehir bulutu + ateş = patlama | **açık** | Game Master kurulumu (savaş) |  |
| `barutPatlama` | Barut fıçısı patlar | kapalı (seferde açık) | Game Master kurulumu (savaş) | yalnızca haritanın sefer bayrağıyla açık gelir (`seferKurallari`) |
| `alarmKosusu` | Alarm koşusu (haber taşıyan) | kapalı (seferde açık) | Game Master kurulumu (savaş) | yalnızca haritanın sefer bayrağıyla açık gelir (`seferKurallari`) |
| `asitHavuzu` | Asit havuzu | kapalı (seferde açık) | Game Master kurulumu (savaş) | yalnızca haritanın sefer bayrağıyla açık gelir (`seferKurallari`); motorda karşılığı yok, panelde görünmez |
| `moralSistemi` | Moral (tam mod): 0'da Çökmüş, eşik cezaları, toparlama, zafer ödülü (data/moral.json; kural sürümü 20) | kapalı | Game Master kurulumu (savaş) |  |
| `karadulCemberi` | Karadul Çemberi (Druid alt sınıfı, ev kuralı): Büyüleyici Bakış, Örümcek Biçimi, Karadul Zehri, Tatlı Tuzak, Ağ Duyusu, Son Öpücük | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza_imparator` | İmza alt sınıf: İmparator (Fighter, ev kuralı; data/imza.json, kural sürümü 23) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza_infazci` | İmza alt sınıf: İnfazcı (Rogue, ev kuralı; data/imza.json, kural sürümü 23) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza_ciftci` | İmza alt sınıf: Çiftçi (Ranger, ev kuralı; data/imza.json, kural sürümü 23) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza_dunganga` | İmza alt sınıf: Dunganga (Sorcerer, ev kuralı; data/imza.json, kural sürümü 23) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza_astrolog` | İmza alt sınıf: Astrolog (Warlock, ev kuralı; data/imza.json, kural sürümü 23) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza_geride_kalan` | İmza alt sınıf: Geride Kalanın Yolu (Barbarian, ev kuralı; data/imza.json, kural sürümü 23) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza_sair` | İmza alt sınıf: Şair Koleji (Bard, ev kuralı; data/imza.json, kural sürümü 23) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza_bilge` | İmza alt sınıf: Yaşlı Bilge Disiplini (Monk, ev kuralı; data/imza.json, kural sürümü 23) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza_hizir` | İmza alt sınıf: Hızır Yemini (Paladin, ev kuralı; data/imza.json, kural sürümü 23) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza_harita` | İmza alt sınıf: Harita Öğretisi (Wizard, ev kuralı; data/imza.json, kural sürümü 23) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `carpmaHasari` | Çarpma hasarı: zorla hareket engelde yarıda kalırsa kalan her altıgen için 1d6 kuvvet (en çok 3d6); çarpılan yaratık da aynısını ayrı zarla alır (SRD'de yok; kural sürümü 24+) | **açık** | Game Master kurulumu (savaş) |  |
| `hizalanmaMoral` | Hizalanma ↔ Moral bağı: vicdan çatışması, iç huzur, yeni yol, savrulma (hizalanma ve moralSistemi de açıkken; savaş hesabına girmez) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `hizalanma` | Hizalanma (Düzen/İyilik eksenleri, Game Master paneli ve günlük; savaş hesabına girmez) | kapalı | Game Master kurulumu (savaş) | Ayarlar → deneysel bayrağı açıksa yeni savaşta açık gelir (`characterHouseRules`) |
| `imza` (liste) | İmza alt sınıfların oluşturucuda görünmesi | kapalı (hepsi) | Ayarlar → deneysel | Birlik Manastırı ev kuralı değil, her zaman |
| `karadul` | Karadul Çemberi oluşturucuda seçilir | kapalı | Ayarlar → deneysel | |
| `karadulKadinKisiti` | Karadul yalnız kadın karakterlere | **açık** | Ayarlar → deneysel | yalnızca oluşturucu |
| `hizalanma` | Hizalanma (iki eksen, günlük, Game Master paneli) | kapalı | Ayarlar → deneysel | savaşa girmez |
| `hizalanmaIrk` | Hizalanmada ırk katkısı | **açık** | Ayarlar → deneysel | hizalanma açıkken |
| `hizalanmaYalnizOtomatik` | Hizalanma başlangıcı yalnız otomatik | kapalı | Ayarlar → deneysel | |
| `moralSistemi` (Serüven) | Moral (hafif): karakter başına ikinci can havuzu; Serüven'de kayıp/kazanç, 0'da Moral ölümü (data/moral.json) | kapalı | Serüven anahtarları | savaştaki karşılığı `moralSistemi` ev kuralı |
| `moralTam` (Serüven) | Moral (tam): savaşa etkili (0'da Çökmüş, eşiklerde ceza, toparlama, zafer ödülü); Moral açıkken | kapalı | Serüven anahtarları | savaştaki karşılığı `moralSistemi` ev kuralı |
| `conveyor` (harita kuralı) | Yürüyen merdiven (zemin `Y`, akışa karşı adım geri kayar; kol durdurur) | yalnız Zindan'ın `merdiven-yuruyen` varyantında açık | harita varyantı (`harita/yeralti/yeralti-zindan.json`) | Kuyruk 21 D2b ev kuralı; `kural-kontrol.json`'da anahtarı yok, kapatmak için başka varyant seçilir |

Celestial ırkı K49'dan beri ev kuralı değil (kalıcı ırk; sürüm 18–21 kayıtları eski `celestialIrki` bayrağıyla oynar).

## Varsayılanı kapalı Game Master mekanikleri (ev kuralı değil, bilgi için)

SRD ya da harita mekaniği olup varsayılanı kapalı gelenler (`data/kural-kontrol.json` `default: false`; kurulumda açılır):

| Kimlik | Ne | Kapsam |
|---|---|---|
| `riverBlocked` | Nehir geçilmez (kapalıyken yüzülerek geçilir) | haritanın varyant kuralı |
| `nightVision` | Gece görüşü kuralları (SRD: ışıksız altıgen karanlık; Darkvision/ışık menzili görür; görmeyen saldıran dezavantajlı, görülmeyen avantajlı) | her harita |
| `stormRules` | Fırtına kuralları (kuvvetli rüzgâr/fırtına: menzilli saldırı dezavantajı, uçuş iki kat hareket; yağmurda pasif Algı −5) | her harita |
| `coldExposure` | Dondurucu soğuk (SRD Extreme Cold, savaş ölçeği: her N turda CON save ya da 1 Exhaustion) | haritanın varyant kuralı |
| `multiHex` | Çok altıgenli büyük yaratıklar (deneysel) | Game Master kurulumu anahtarı (`createMapBattle` `multiHex`) |

Serüven anahtarlarının geri kalanı (yükleme ekranı, keşif sisi, hızlı seyahat…) ev kuralı değil, oynanış seçeneği;
varsayılanları `data/seruven.json` `anahtarlar`'da.
