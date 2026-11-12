# AS2 envanteri: 120 alt sınıf tek paket (salt okuma; kod değişmedi)

Görev AS2 adım 1 ("önce, koddan önce"). Tarih 2026-11-12, dal `wip/toplu-k74-as2` (kural sürümü 77). Bu belge yalnız
kimlik, ad ve sayı içerir; dış paketin özellik metni yazılmaz.

## Sonuç: AS2 bu oturumda DURDU

Dış paket (`icerik/*.json`) bu bulut kopyasında **yok** (`icerik/` gitignore'da; `ls icerik` → yok). Görevin üç adımı
paketin kendisini gerektiriyor ve paketin depoya girmesi gerekecek:

1. **SRD 12'si kaldırılınca motorun ve sim partilerinin yeni varsayılanı** (Fighter → "bizim Şampiyon" vb.) paketin
   kimliklerinden gelir. Depoda paket yoksa build'de sınıf başına yalnız imza/Karadul alt sınıfı kalır (Fighter yalnız
   İmparator = yalnız erkek: kadın Fighter alt sınıfsız kalır; Cleric yalnız Birlik Manastırı…). Testler (Champion/Thief/Hunter
   `classTraits.ts`, sim partileri, `srdIds`) paketsiz koşamaz; "108 + 12 = 120" sayımı depoda doğrulanamaz.
2. **Göç tablosu** (`champion` → bizim sürüm kimliği): paketteki 12 yerelleştirilmiş SRD sürümünün kimlikleri depoda hiçbir
   yerde yok. `icerik-liste.txt` 97 satır (aşağıda); görevdeki 108'den 11 eksik, eksikler tam olarak yerelleştirilmiş SRD
   sürümleri (sınıf başına bir) gibi görünüyor ama kimlikleri bilinmiyor. Kimlik uydurmak göçü bozar.
3. **Hizalanma `altSinif` tablosu** yeni kimliklere eşlenecek; değer uydurulmayacak; eşlenecek kimlikler paketsiz bilinmiyor.

Görev metni: "paket içeriğinin repoya girmesi gerekiyorsa DUR ve kullanıcıya bildir (içerik gitignore'da)". Seçenekler
aşağıda (Karar gereken); kullanıcı kararı gelmeden kod yazılmadı.

## Kaynaklar (bugün ayrı)

| Kaynak | Dosya / anahtar | Sayı | Kapı |
|---|---|---|---|
| SRD 5.2.1 | `data/subclasses.json` (+ `data/srd/` kaydı) | 12 (sınıf başına 1) | yok (her zaman) |
| İmza (ev kuralı) | `data/imza.json` `altSiniflar` | 11 | ev kuralı `imza_<ad>` (savaşta sürüm 23+), Ayarlar `rpg-battle-deneysel.imza`; Birlik Manastırı `evKurali: null` (her zaman) |
| Karadul Çemberi (ev kuralı) | `data/karadul.json` `subclass` | 1 (Druid) | Ayarlar `karadulEnabled` + `karadulWomenOnly`, savaşta ev kuralı `karadulCemberi` (sürüm 21+) |
| Dış paketler | `icerik/*.json` (yerelde, gitignore), localStorage `rpg-battle-icerik`, `loadLocalFolder` (`source: 'klasor'`), silinen `rpg-battle-icerik-yoksay` | `icerik-liste.txt`: 97 (görev: 109 gömülü) | Ayarlar "Dış içerik" (aç/sil), "kopyalarda hangisi kalsın" (Paket/SRD/İkisi de, `visibleSubclasses`), çalışan özelliği olmayan paket alt sınıfı seçimde gizli |

### SRD 12 (kaldırılacak)

| Sınıf | Kimlik | Ad (TR / EN) |
|---|---|---|
| Barbarian | `path-of-the-berserker` | Çılgın Savaşçı Yolu / Path of the Berserker |
| Bard | `college-of-lore` | Bilgi Koleji / College of Lore |
| Cleric | `life-domain` | Yaşam Etki Alanı / Life Domain |
| Druid | `circle-of-the-land` | Toprak Çemberi / Circle of the Land |
| Fighter | `champion` | Şampiyon / Champion |
| Monk | `warrior-of-the-open-hand` | Açık El Savaşçısı / Warrior of the Open Hand |
| Paladin | `oath-of-devotion` | Bağlılık Yemini / Oath of Devotion |
| Ranger | `hunter` | Avcı / Hunter |
| Rogue | `thief` | Hırsız / Thief |
| Sorcerer | `draconic-sorcery` | Ejderha Büyücülüğü / Draconic Sorcery |
| Warlock | `fiend-patron` | İblis Hamisi / Fiend Patron |
| Wizard | `evoker` | Evokasyon Ustası / Evoker |

### Bizim 12 (kalır)

| Sınıf | Kimlik | Not |
|---|---|---|
| Fighter | `imza_imparator` | görev kararı: yalnız erkek |
| Rogue | `imza_infazci` | |
| Ranger | `imza_ciftci` | |
| Sorcerer | `imza_dunganga` | |
| Warlock | `imza_astrolog` | |
| Cleric | `imza_birlik` | eski `baris-alani` kimliği buna yönlenir (`data/imza.json`) |
| Barbarian | `imza_geride_kalan` | |
| Bard | `imza_sair` | |
| Monk | `imza_bilge` | |
| Paladin | `imza_hizir` | |
| Wizard | `imza_harita` | |
| Druid | Karadul Çemberi (`data/karadul.json`) | görev kararı: yalnız kadın (bugün Ayarlar `karadulWomenOnly`) |

### Dış paket listesi (`icerik-liste.txt`, depoda; yalnız kimlik sayısı)

| Sınıf | Listede | Görevde (yerelleştirilen) | Fark |
|---|---|---|---|
| Barbarian | 7 | 8 | 1 |
| Bard | 7 | 8 | 1 |
| Cleric | 7 (Barış Alanı dahil) | 7 (Barış Alanı çıkar) | 1 (Barış çıkınca 6 → 7 için 1 eksik) |
| Druid | 6 | 7 | 1 |
| Fighter | 9 | 10 | 1 |
| Monk | 9 | 10 | 1 |
| Paladin | 8 | 9 | 1 |
| Ranger | 7 | 8 | 1 |
| Rogue | 8 | 9 | 1 |
| Sorcerer | 7 | 8 | 1 |
| Warlock | 9 | 10 | 1 |
| Wizard | 13 | 14 | 1 |
| **Toplam** | **97** | **108** | **12** (Barış dahil 97 − 1 + 12 = 108) |

Her sınıfta tam bir eksik: büyük olasılıkla paketin "bizim sürüm" SRD alt sınıfı (Şampiyon'un yerelleştirilmiş hâli vb.).
Liste dosyası bunları içermiyor; kimlikleri paketsiz bilinemez.

### Çakışma denetimi (kimlik/ad)

- Liste kimlikleri SRD (12) ve imza (11) kimlikleriyle çakışmıyor (imza `imza_` önekli; liste kimlikleri öneksiz Türkçe).
- Tek bilinen çakışma: `baris-alani` (liste: Cleric Barış Alanı) ↔ imza yönlendirmesi `baris-alani` → `imza_birlik`. Görev kararı
  Barış Alanı'nı paketten çıkarır; yönlendirme kalır.
- Ad çakışması: liste "Ejderha Disiplini" (Monk) ↔ SRD "Ejderha Büyücülüğü" (Sorcerer) farklı sınıf, sorun değil.
- Paketin yerelleştirilmiş SRD sürümlerinin kimlikleri SRD kimliğiyle aynıysa (ör. `champion`) mevcut `visibleSubclasses`
  (Paket/SRD/İkisi de) zaten bunu çözüyordu; aynı değilse göç tablosu gerekir. Paketsiz bilinemez.

## Kaldırılacak Ayarlar öğeleri (yalnız alt sınıfla ilgili; kod yeri)

| Öğe | Yer |
|---|---|
| Karadul Çemberi anahtarı `karadulEnabled`, kadın kısıtı `karadulWomenOnly` | `src/app/features.ts`, `src/rules/subclasses.ts` `houseSubclassVisible`, `src/screens/SettingsScreen.tsx`, `src/screens/Builder.tsx` |
| İmza ev kuralı kapısı `rpg-battle-deneysel.imza`, `characterHouseRules` | `src/app/features.ts`, `src/rules/classFeatures.ts` |
| Dış içerik aç/sil düğmeleri, 12 "Ek alt sınıflar" satırı | `src/screens/SettingsScreen.tsx`, `src/content/store` |
| "Kopyalarda hangisi kalsın" (Paket/SRD/İkisi de) | `visibleSubclasses` (`src/rules/subclasses.ts`), Ayarlar |
| Çalışan özelliği olmayan paket alt sınıfının gizlenmesi | `src/content/paket.ts` `applyPackSubclasses` |

## Karar gereken (kullanıcı)

A. **Paketi depoya al** (önerilen tek yol, görevin bütün sayım/göç/test şartları için): 108 alt sınıfı derleme zamanı veri
   dosyası olarak (`data/alt-siniflar-paket.json` gibi) depoya koy; `.gitignore`'daki `icerik/` kuralı kişisel ek paketler için
   kalır. Lisans/sahiplik kararı kullanıcıda (görev "içerik kullanıcıya aittir, repoya GİRMEZ" diyor).
B. **Paket depo dışında kalsın, yerelde gömülü yüklensin** (mevcut `loadLocalFolder`, `import.meta.glob('icerik/*.json')`):
   kod yazılabilir ama SRD 12'si kaldırılınca paketsiz build/CI'da sınıflar alt sınıfsız kalır, göç tablosu yerelde üretilir
   (kimlikler veride yalnız yerelde), testler 120'yi yalnız yerelde doğrular. Bulut oturumunda yapılamaz.
C. **SRD 12'si kalsın, paket gelene dek** yalnız ayarların sadeleşmesi (Karadul/İmza kapılarının kalkması, cinsiyet kuralının
   alt sınıfa taşınması) ayrı, küçük bir görev olarak yapılsın (kural sürümü 78).
