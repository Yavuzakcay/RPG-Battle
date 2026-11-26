# KATALOG-1 — Envanter ve uygulama planı (Aşama 1)

Görev KATALOG-1, Aşama 1. Yalnız belge: kod, veri, test ve kural sürümü değişmedi (KARAR104 ayrı iş). Girdi `docs/katalog/` altındaki 10 PDF; depoya girmez. Metin `pdftotext` (UTF-8, ham ve `-layout` kipleri) ile okundu, parçalar betikle ayrıştırıldı, sınıflandırma kod okunarak yapıldı (2026-11-26, dal `katalog-1`).

**Yöntem ve sınır.** "Durum" sütunu masa başı denetimdir: eşyanın her etkisi, bugünkü eşya veri yollarından birine sığıyor mu diye bakıldı. Yollar:

- `Item` alanları (`src/data/types.ts`): `bonus` (weapon/armor/shield/spell), `effects` (AC, save, `setAbility`, `unarmoredAcBonus`, `armorAcBonus`, `shieldAcBonus`), `passive` (süren etki: direnç, bağışıklık, `darkvision`, `fly`, `speedFt`, `saveAdvAgainst`, `checkAdv`, `jumpFt`, `webWalker`/`iceWalker`, `waterWalk`, `noCrit`, `regen`…), `onHit` (tek ek hasar), `spells` + `charges` + `recharge` (yüklü SRD büyüsü), `use` (heal/effect/throw/coat).
- `Item.paket`: 55 ek paket ilkeli eşyada da çalışır (Görev P7, `src/battle/paket/bag.ts` `itemBag`); tetikler `isabet`, `oldurunce`, `hasarAlinca`, `turBasi`, `savasBasi`, `bonus`/`eylem`/`serbest`/`tepki`; koşullar yalnız `KOSULLAR` listesi (`src/content/ilkelSema.ts`: ofke, yarimCanAlti, zirhsiz, avantajli, dostBitisik, konsantrasyon (kendi), buyuTurunda, seviyeliBuyuTurunda, hedefBuyuk, bicim, isaretli, harita, flurryVurusu, ilkTur, zarYarisi).

Bu yollara sığmayan her parça "kanca gerekir"; tek tek doğrulama (paket şema denetimi + bir savaş denemesi) Aşama 2'nin işidir. Sınıflar kaba değil ama kesin de değil: bir parça "çalışır" görünüp Aşama 2'de küçük bir kanca isteyebilir, tersi daha az olası.

**Durum tanımları.**

- **çalışır**: bütün etkiler bugünkü veri yollarıyla yazılabilir (yaklaşık kısımlar not sütununda).
- **kanca gerekir**: temel istatistik (bonus, AC, hasar zarı, direnç) çalışır; en az bir özellik yeni bir koşul, tetik ya da alan ister. AS2 deseniyle `calismiyor`/`planli` etiketiyle girer.
- **sistem gerekir**: çekirdeği motorda olmayan bir sistem (özel cephane seçimi, soket, zanaat, Kararma). Veri ve anlatım olarak girer.

## 1. ÖZET

### 1.1 Sayılar

| Kategori (Aşama 2 parçası) | Parça | Sıra Dışı | Nadir | Çok Nadir | Efsanevi | çalışır | kanca gerekir | sistem gerekir |
|---|---|---|---|---|---|---|---|---|
| A Silahlar (Cilt 1: 40, Cilt 2: 50, Karanlık Yadigârlar: 35) | 125 | 24 | 40 | 41 | 20 | 76 | 49 | 0 |
| B Zırh, cübbe, kalkan (Zırhlar: 45, KY: 10 zırh + 5 kalkan) | 60 | 9 | 21 | 23 | 7 | 26 | 34 | 0 |
| C Giyilebilir (başlık, pelerin, eldiven, bot: 50 + KY 5 başlık) | 55 | 12 | 24 | 15 | 4 | 31 | 24 | 0 |
| D Yüzük, tılsım, mühür taşı, zanaat eklentisi | 45 | 8 | 19 | 13 | 5 | 26 | 16 | 3 |
| E Tüketilebilir (bomba, özel ok, kaplama, iksir, eliksir, çay) | 45 | 14 | 16 | 12 | 3 | 9 | 24 | 12 |
| **Toplam katalog eşyası** | **330** | 67 | 120 | 104 | 39 | **168** | **147** | **15** |

Uyum gerektiren: 204 parça. Bunlara ek olarak boss dosyalarından:

- **19 boss ganimeti**: Mora 2, Tarvok 2, Kaltakkıran paketi 15. Seviye 1 ve 2 taşlar 10'ar varyantlı; varyantlar ayrı kayıt sayılırsa 37 olur. Tablo bölüm 3.6'da.
- **22 yaratık ya da boss varlığı**: 3 ana boss, 4 kadim biçim, 5 mücevher ejderhası türü, 10 bölge bossu. Mücevher ejderhalarının Genç ve Yetişkin evreleri ayrı sayılırsa 27 stat satırı olur. Tablo bölüm 3.1'de.

Tablo toplamı: **330 + 19 + 22 = 371 satır** (doğrulama bölümü 9'da).

### 1.2 PDF'in kendi iddiası ile bu denetim

| Katalog | PDF: savaşta çalışır / yeni kanca / özel (soket, zanaat) | Bu denetim: çalışır / kanca / sistem |
|---|---|---|
| Silahlar Cilt 1 (40) | 37 / 3 / 0 | 25 / 15 / 0 |
| Silahlar Cilt 2 (50) | 45 / 4 / 1 (Twinspark: notu okunamadı) | 38 / 12 / 0 |
| Karanlık Yadigârlar (55) | 46 / 8 / 1 | 20 / 35 / 0 |
| Zırhlar, Cübbeler, Kalkanlar (45) | 41 / 4 / 0 | 21 / 24 / 0 |
| Başlık, Pelerin, Eldiven, Bot (50) | 47 / 3 / 0 | 29 / 21 / 0 |
| Yüzük, Tılsım, Mühür Taşı (45) | 29 / 4 / 12 | 26 / 16 / 3 |
| Savaş Donanımı ve Tüketilebilir (45) | 39 / 6 / 0 | 9 / 24 / 12 |
| **Toplam (330)** | **284 / 32 / 14** | **168 / 147 / 15** |

PDF'in "savaşta çalışır" dediği 284 parçanın 124'ü bu denetimde kanca ya da sistem istedi; PDF'in kanca dediği 32 parçanın hepsi bu denetimde de kanca. Farkın kaynakları (bir parçada birden çok olabilir):

| Gerekçe | Parça | Not |
|---|---|---|
| Kalıcı sabit hasar azaltma ("tüm hasar −1", "fiziksel −3") | 17 | Motorun `reduce` etkisi turda bir kez işler (`damage-effects.ts`, `spent`), her darbede değil. PDF bunu "mevcut hasar azaltma" saymış. |
| Verilen hasar türüne bağlı tetik ("turda 1 soğuk hasarında…") | 19 | Paket tetikleri hasar türünü dinlemez. Yalnız büyü hasarı için `buyuDegisimi` var. |
| Taban silah istatistiği farklı (Finesse eklenmiş katana, Thrown kargı, kuvvet hasarlı arbalet…) | 21 | Büyülü silah, taşınan sıradan silaha bağlanan bir eşyadır (KARAR104 A10). Zar, özellik ve ustalık `weapons.json`'dan gelir, eşya değiştiremez. |
| Işık düzeyi koşulu ("loş/karanlıkta", "parlak ışıktaki hedef") | 13 | `lightLevelAt` motorda var, `KOSULLAR`'da yok. |
| Özel cephane (12 ok) | 12 | Seçilebilir, tüketilen tekil cephane yok. PDF'in andığı "TE99 K-D2" eşya ↔ silah bağıdır; cephaneyi çözmez. |
| `use.coat` / `use.throw` şeması dar | 16 | Kaplamada yalnız ek zar ve tür, fırlatmada yüzey, itme, çekme ve süreli durum yok. |
| Hedef/öz koşulları (Hidden, hedef konsantrasyonda, yükseklik, metal zırh/su, ≤%25 can, tam can) | 25 | `KOSULLAR`'da yok. |
| Diğer tetikler (iyileştirme yapma/alma, kendi başarılı save'i, durum uygulama, Dash, atlama inişi, Shove sonu) | 23 | Paket tetiklerinde yok. Bazıları bir sınıf özelliğinde var (Blessed Healer) ama eşyaya açık değil. |
| Eliksir "UD'ye dek" süresi ve "aynı anda 1" | 5 | `use.effect` tur sayısıyla sınırlı; savaşlar arası süre ve dışlama yok. |
| PDF'in kendi "Yeni kanca" notları | 32 | Hepsi doğrulandı, yerinde (bölüm 2.6). |

Ortak notlar (parçayı kanca saymadım, ortak değişiklik):

- **Kısmi yük yenilenmesi** ("UD 1d3"): paket kaynağı yalnız tamamen yenilenir (`itemCharges.ts`: `kaynak.yenilenme` uzun/kısa = hepsi). Büyü yükünde zar çalışır (`recharge: "1d3"`). Ortak değişiklik O6.
- **Büyücü uyum önkoşulu** (25 parça, "Uyum gerekli (Büyücü/Druid/Rahip-Paladin)"): oluşturucu denetlemiyor. Ortak değişiklik O4.

## 2. ENVANTER TABLOSU

Sütunlar:

- **Kaynak**: `S1` Silahlar Cilt 1, `S2` Cilt 2, `KY` Karanlık Yadigârlar, `ZK` Zırh/Cübbe/Kalkan, `GY` Giyilebilir, `YT` Yüzük/Tılsım/Mühür, `TK` Tüketilebilir; `#` PDF'teki sıra numarası.
- **id önerisi**: EN-AD'dan kebab-case. Mevcut 399 eşya, 38 silah ve SRD sihirli eşya kimlikleriyle çakışma yok.
- **Nad.**: SD Sıra Dışı, N Nadir, ÇN Çok Nadir, E Efsanevi.
- **Taban**: silahta bağlanacak `data/weapons.json` silahı. Zırhta önerilen SRD zırhı + `bonus.armor` (katalog AC'si − SRD taban AC). Kalkanda Shield +N (katalogdaki "AC +2" kalkanın kendi +2'si sayıldı; karar K8).
- **Özel / yük**: PDF "Etken içerik" satırından kısaltma.
- **Kanca / not**: kanca gerekçesi; "PDF:" ile başlayan PDF'in kendi kanca notudur.

### 2.1 A — Silahlar (125)

Taban silah `data/weapons.json` kimliği; "taban silahtan fark" eşya bağlanınca kaybolacak istatistik farkıdır (bölüm 2.6 madde 4).

| Kaynak | id önerisi | TR ad | EN-AD | Yuva | Nad. | Uyum | Taban | Bonus | Hasar | Ustalık | Özel / yük | Durum | Kanca / not |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S1#1 | `giantbreaker-blade` | Devkıran Pala | Giantbreaker Blade | silah (savaş) | E | evet | greatsword | +3 saldırı ve hasar | 2d6 + 3 kesici | Graze | Yük / Aktif: 2 yük (uzun dinlenme 1d2), Bonus eylem, 10 tur boyut +1, 15 geçici… | **çalışır** |  |
| S1#2 | `starcleave` | Yıldız Kesiği | Starcleave | silah (savaş) | ÇN | evet | greatsword | +2 saldırı ve hasar | 2d6 + 2 kesici + 1d6 psişik | Graze | Yük / Aktif: 2 yük (uzun dinlenme 1d2), isabette +2d6 psişik, DC 15 INT Stunned… | **kanca** | hedef konsantrasyonda koşulu |
| S1#3 | `crimson-maw` | Kızıl Doymaz | Crimson Maw | silah (savaş) | ÇN | evet | greatsword | +2 saldırı ve hasar | 2d6 + 2 kesici + 1d4 nekrotik | Graze | Yük / Aktif: 1 yük (uzun dinlenme), Bonus eylem, kendine 1d8 nekrotik, sonraki … | **çalışır** |  |
| S1#4 | `mute-iron` | Suskun Demir | Mute Iron | silah (savaş) | N | evet | greatsword | +1 saldırı ve hasar | 2d6 + 1 kesici | Graze | Yük / Aktif: 3 yük (uzun dinlenme 1d3), isabette DC 14 CON, 2 tur susturma + ko… | **çalışır** |  |
| S1#5 | `cinderheart-greatsword` | Korköz Büyük Kılıcı | Cinderheart Greatsword | silah (savaş) | SD | hayır | greatsword |  | 2d6 kesici + 1d4 ateş | Graze | Pasif: 10 ft parlak + 10 ft loş ışık, yüzey tutuşturma Kullanıcı derin su altıg… | **çalışır** |  |
| S1#6 | `duelists-signet` | Düellocu Mührü | Duelist's Signet | silah (savaş) | E | evet | rapier | +3 saldırı ve hasar | 1d8 + 3 delici + 1d4 nekrotik | Vex | Aktif: Bonus eylem 15 ft DC 16 WIS meydan okuma; 3 yük (UD 1d3) tepki 2d6 nekro… | **çalışır** |  |
| S1#7 | `dirge-blade` | Ağıt Kılıcı | Dirge Blade | silah (savaş) | N | evet | longsword | +1 saldırı ve hasar | 1d8 + 1 kesici (1d10 + 1) | Sap | Yük / Aktif: 3 yük (UD 1d3), Bonus eylem 15 ft (+1d4 dost saldırı 3 tur veya DC… | **çalışır** |  |
| S1#8 | `windpoise` | Rüzgâr Dengesi | Windpoise | silah (savaş) | ÇN | evet | scimitar | +2 saldırı ve hasar | 1d6 + 2 kesici | Nick | Yük / Aktif: 2 yük (UD 1d2), Eylem, 5 ft tüm düşmanlara ayrı saldırı Kasırga Ke… | **çalışır** |  |
| S1#9 | `stormbrand` | Kıvılcım Kılıcı | Stormbrand | silah (savaş) | ÇN | evet | longsword | +2 saldırı ve hasar | 1d8 + 2 kesici + 1d6 yıldırım | Sap | Yük / Aktif: 1 yük (UD), Eylem Lightning Bolt (DC 15 DEX, 8d6 yıldırım) Suda te… | **kanca** | PDF: silah saldırısında INT seçimi bayrağı; yıldırım zinciri ve Lightning Bolt savaşt |
| S1#10 | `whispering-rapier` | Fısıltı Meçi | Whispering Rapier | silah (savaş) | N | evet | rapier | +1 saldırı/hasar, +1 bü… | 1d8 + 1 delici + 1d4 psişik | Vex | Yük / Aktif: 2 yük (UD 1d2), Bonus eylem 30 ft DC 14 WIS, 1d8 psişik + Frighten… | **çalışır** |  |
| S1#11 | `stride-scimitar` | İvme Palası | Stride Scimitar | silah (savaş) | SD | hayır | scimitar | +1 saldırı ve hasar | 1d6 + 1 kesici | Nick | Pasif: Turda 1 isabette +10 ft hız ve 5 ft fırsat saldırısız kayma | **çalışır** |  |
| S1#12 | `blooddrinker` | Kan Susuzu | Blooddrinker | silah (basit) | E | evet | dagger | +2 saldırı/hasar, yan e… | 1d4 + 2 delici | Nick | Yük / Aktif: 3 yük (UD 1d3), DC 16 CON 3 tur 1d6 delici kanama + sonraki saldır… | **çalışır** |  |
| S1#13 | `gloomfang` | Karanlık Diş | Gloomfang | silah (savaş) | ÇN | evet | shortsword | +2 saldırı ve hasar | 1d6 + 2 delici | Vex | Pasif: 19–20 kritik, loş/karanlık hedefe saldırı avantajı Parlak ışık altındaki… | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok) |
| S1#14 | `spiteful-dagger` | Büyülü Kin Hançeri | Spiteful Dagger | silah (basit) | ÇN | evet | dagger | +2 saldırı ve hasar | 1d4 + 2 delici + 1d4 psişik | Nick | Yük / Aktif: 2 yük (UD 1d2), DC 15 WIS Charmed (2 tur) Aktif: 2 yük (UD 1d2), D… | **kanca** | Hidden koşulu |
| S1#15 | `frostbite-dagger` | Ayaz Kesici | Frostbite Dagger | silah (basit) | N | evet | dagger | +1 saldırı/hasar, yan e… | 1d4 + 1 delici + 1d4 soğuk | Nick | Tepki: Iskada 1d6 soğuk + DC 13 CON −10 ft hız (1 tur) Buz Karşılığı tepki hakk… | **çalışır** |  |
| S1#16 | `seeping-knife` | Sızıntı Bıçağı | Seeping Knife | silah (basit) | N | hayır | dagger | +1 saldırı ve hasar | 1d4 + 1 delici | Nick | Yük / Aktif: 1 yük (UD), Eylem Hold Person (DC 14 WIS, konsantrasyon) Hold Pers… | **çalışır** |  |
| S1#17 | `firstblood-shortsword` | İlk Kan Kısa Kılıcı | Firstblood Shortsword | silah (savaş) | SD | hayır | shortsword |  | 1d6 delici | Vex | Pasif: İnisiyatif +1 Hedef 1 puan bile hasar aldıktan sonra İlk Çizik bonusu te… | **kanca** | hedef/öz durum koşulu (KOSULLAR'da yok) |
| S1#18 | `vigil-halberd` | Nöbet Teberi | Vigil Halberd | silah (savaş) | ÇN | evet | halberd | +2 saldırı ve hasar | 1d10 + 2 kesici + 1d4 kuvvet | Cleave | Pasif: İnisiyatif +2, Perception avantajı, fırsat saldırısı avantajı + DC 15 ST… | **çalışır** |  |
| S1#19 | `embermaw-greataxe` | Kor Ağızlı Balta | Embermaw Greataxe | silah (savaş) | ÇN | evet | greataxe | +2 saldırı ve hasar | 1d12 + 2 kesici + 1d6 ateş | Cleave | Yük / Aktif: 2 yük (UD 1d2), Eylem 15 ft koni, DC 15 DEX, 3d6 ateş hasarı Kor S… | **çalışır** |  |
| S1#20 | `breeze-glaive` | Esinti Tırpanı | Breeze Glaive | silah (savaş) | ÇN | evet | glaive | +2 saldırı ve hasar | 1d10 + 2 kesici | Graze | Yük / Aktif: 2 yük (UD 1d2), Eylem 10 ft tüm düşmanlara saldırı veya Dispel Mag… | **kanca** | taban silahtan fark: +Finesse, −Heavy |
| S1#21 | `wyrmbreath-glaive` | Ejdernefes Kargısı | Wyrmbreath Glaive | silah (savaş) | N | evet | glaive | +1 saldırı ve hasar | 1d10 + 1 kesici | Graze | Yük / Aktif: 1 yük (UD), Bonus eylem 10 tur +1d4 element + o türe direnç STR 13… | **çalışır** |  |
| S1#22 | `spellbreaker-battleaxe` | Büyü Kıran Balta | Spellbreaker Battleaxe | silah (savaş) | SD | hayır | battleaxe | +1 saldırı ve hasar | 1d8 + 1 kesici (1d10 + 1) | Topple | Pasif: Konsantrasyonlu hedefe avantaj, konsantrasyon DC +2 Kan Hırsı yalnızca y… | **kanca** | hedef konsantrasyonda koşulu |
| S1#23 | `dawnseal-mace` | Şafak Mührü Topuzu | Dawnseal Mace | silah (basit) | E | evet | mace | +3 saldırı ve hasar | 1d6 + 3 ezici + 1d6 ışıltı | Sap | Yük / Aktif: 1 yük (UD) 0 HP'de 2d8 iyileşme; 1 yük (UD) Eylem 30 ft çizgi DC 1… | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok) |
| S1#24 | `shellbreaker-maul` | Zırh Kıran Balyoz | Shellbreaker Maul | silah (savaş) | ÇN | evet | maul | +2 saldırı ve hasar | 2d6 + 2 ezici | Topple | Pasif: Kritikte 10 ft itme + DC 15 CON Stunned (1 tur) 10 lb ağırlığı taşıma ka… | **çalışır** |  |
| S1#25 | `chainbreaker-warhammer` | Zincir Kıran Çekiç | Chainbreaker Warhammer | silah (savaş) | ÇN | evet | warhammer | +2 saldırı ve hasar | 1d8 + 2 ezici (1d10 + 2) | Push | Yük / Aktif: 2 yük (UD 1d2), Eylem durum kırma + 10 ft düşmana DC 15 STR 2d6 gü… | **çalışır** |  |
| S1#26 | `four-seasons-flail` | Dört Mevsim Gürzü | Four-Seasons Flail | silah (savaş) | N | evet | flail | +1 saldırı ve hasar | 1d8 + 1 ezici | Sap | Yük / Aktif: 3 yük (UD 1d3), Bonus eylem 5 tur element kipi + yüzey tepkimesi (… | **çalışır** |  |
| S1#27 | `shockwave-maul` | Sarsıntı Tokmağı | Shockwave Maul | silah (savaş) | SD | hayır | maul |  | 2d6 ezici | Topple | Pasif: Turda 1 jump inişinde 5 ft 1d4 gürültü hasarı; isabette 1 tur iyileşme e… | **kanca** | atlama/iniş tetiği |
| S1#28 | `tempest-trident` | Fırtına Zıpkını | Tempest Trident | silah (savaş) | E | evet | trident | +3 saldırı ve hasar | 1d8 + 3 delici (1d10 + 3) + 1d6 g… | Topple | Pasif: +10 ft hız, düşme direnci, turda 1 fırlatma isabetinde 10 ft DC 16 CON 2… | **çalışır** |  |
| S1#29 | `dusklight-spear` | Alacakaranlık Mızrağı | Dusklight Spear | silah (basit) | ÇN | evet | spear | +2 saldırı ve hasar | 1d6 + 2 delici (1d8 + 2) | Sap | Yük / Aktif: 2 yük (UD 1d2), Eylem Darkness veya Moonbeam (DC 15) Darkness ve M… | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok) |
| S1#30 | `tidecaller-trident` | Dalga Zıpkını | Tidecaller Trident | silah (savaş) | N | evet | trident | +1 saldırı ve hasar | 1d8 + 1 delici (1d10 + 1) | Topple | Yük / Aktif: 2 yük (UD 1d2), isabette +1d8 yıldırım hasarı Oluşan su yüzeyi üst… | **çalışır** |  |
| S1#31 | `homing-pike` | Geri Dönen Kargı | Homing Pike | silah (savaş) | SD | hayır | pike | +1 saldırı ve hasar | 1d10 + 1 delici | Push |  | **kanca** | yükseklik (K8) koşulu eşyada yok; taban silahtan fark: +Thrown |
| S1#32 | `staff-of-the-confluence` | Elementler Asası | Staff of the Confluence | silah (basit) | E | evet (Büyücü) | quarterstaff | +2 silah, +2 büyü saldı… | 1d6 + 2 ezici (1d8 + 2) | Topple | Yük / Aktif: 1 yük (UD) 1– 5. sv. yuvasız büyü; 1 yük (KD) element direnci + tu… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| S1#33 | `ashen-bone-staff` | Sönük Kemik Asası | Ashen Bone Staff | silah (basit) | ÇN | evet (Büyücü) | quarterstaff | +2 silah, +1 büyü saldı… | 1d6 + 2 ezici + 1d4 nekrotik | Topple | Yük / Aktif: 2 yük (UD 1d2), 1 yükle Necromancy save dezavantajı veya 2 yükle B… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| S1#34 | `hoarfrost-staff` | Kırağı Asası | Hoarfrost Staff | silah (basit) | ÇN | evet (Büyücü) | quarterstaff | +1 silah | 1d6 + 1 ezici + 1d4 soğuk | Topple | Yük / Aktif: 2 yük (UD 1d2), soğuk hasarında DC 15 CON Restrained (1 tur) Oluşa… | **kanca** | verilen hasar türü tetiği; uyum önkoşulu (Büyücü) |
| S1#35 | `sparkweave-staff` | Büyü Kıvılcımı Asası | Sparkweave Staff | silah (basit) | N | evet (Büyücü) | quarterstaff | +1 silah | 1d6 + 1 ezici | Topple | Yük / Aktif: 1 yük (UD), Tepki Counterspell (3. seviye) Counterspell 60 ft için… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| S1#36 | `purging-wand-staff` | Arındırma Değneği | Purging Wand-Staff | silah (basit) | SD | hayır | quarterstaff |  | 1d6 ezici | Topple | Yük / Aktif: 3 yük (UD 1d3), Eylem 30 ft (1 yük: 10 ft su yüzeyi/alev söndürme;… | **çalışır** |  |
| S1#37 | `skylight-longbow` | Gök Işığı Uzun Yayı | Skylight Longbow | silah (savaş) | E | evet | longbow | +3 saldırı ve hasar | 1d8 + 3 delici | Slow | Yük / Aktif: 3 yük (UD 1d3) +2d6 ışıltı + sonraki saldırı avantajı; 1 yük (UD) … | **çalışır** |  |
| S1#38 | `deadeye-longbow` | Keskin Nişancı Yayı | Deadeye Longbow | silah (savaş) | ÇN | evet | longbow | +2 saldırı ve hasar | 1d8 + 2 delici | Slow | Pasif: 19–20 kritik, yarım siperi yok sayma Üç çeyrek siper (+5 AC) ve tam sipe… | **kanca** | yükseklik (K8) koşulu eşyada yok; PDF: silah saldırısında yarım siper yok sayma bayrağı; critOn ve K8 yüksek zemin sava |
| S1#39 | `forcebolt-hand-crossbow` | Kuvvet Arbaleti | Forcebolt Hand Crossbow | silah (savaş) | N | evet | hand-crossbow | +1 saldırı ve hasar | 1d6 + 1 kuvvet | Vex | Yük / Aktif: 2 yük (UD 1d2), Eylem Magic Missile (2. seviye, 4 ok) Loading özel… | **kanca** | Hidden koşulu; taban silahtan fark: hasar türü kuvvet |
| S1#40 | `titanstring-longbow` | Dev Kirişli Yay | Titanstring Longbow | silah (savaş) | N | hayır | longbow | +1 saldırı ve hasar | 1d8 + 1 delici | Slow | Yük / Aktif: 2 yük (UD 1d2), isabette DC 14 STR 10 ft geri itme STR 14 altındak… | **kanca** | PDF: STR ≥ 14 şartlı ek menzilli hasar; Slow ve forcedMove itme savaşta çalışır |
| S2#41 | `twinspark-greataxe` | Çift Kıvılcım Baltası | Twinspark Greataxe | silah (savaş) | E | evet | greataxe | +3 | 1d12 + 3 kesici + 1d6 ateş | Cleave | Yük: 2 (UD 1d2), Bonus 10 ft DC 16 DEX 3d6 ateş STR 13 altında saldırı dezavant… | **çalışır** |  |
| S2#42 | `brimstone-flail` | Sıçrayan Kükürt Gürzü | Brimstone Flail | silah (savaş) | ÇN | evet | flail | +2 | 1d8 + 2 ezici + 1d4 asit | Sap | Yük: 3 (UD 1d3), DC 15 CON 2 tur AC −2 + 10 ft yağ yüzeyi (3 tur) Oluşan yağ yü… | **çalışır** |  |
| S2#43 | `glacierbreak-maul` | Buz Kıran Balyoz | Glacierbreak Maul | silah (savaş) | ÇN | evet | maul | +2 | 2d6 + 2 ezici + 1d6 soğuk | Topple | Yük: 2 (UD 1d2), Eylem 10 ft buz + DC 15 DEX 2d6 soğuk + Prone 10 lb ağırlığı t… | **çalışır** |  |
| S2#44 | `scaldstream-battleaxe` | Buharlı Savaş Baltası | Scaldstream Battleaxe | silah (savaş) | N | evet | battleaxe | +1 | 1d8 + 1 kesici (1d10 + 1) + 1d4 a… | Topple | Yük: 2 (UD 1d2), Bonus 10 ft buhar (2 tur) Oluşan buhar bulutu menzilli dostlar… | **çalışır** |  |
| S2#45 | `mirefang-scimitar` | Bataklık Dişi Palası | Mirefang Scimitar | silah (savaş) | N | evet | scimitar | +1 | 1d6 + 1 kesici + 1d4 zehir | Nick | Yük: 2 (UD 1d2), isabette 5 ft zehir bulutu (2 tur, DC 14 CON) Zehir bağışıklığ… | **çalışır** |  |
| S2#46 | `thunderclap-mace` | Gök Gürültüsü Tokmağı | Thunderclap Mace | silah (basit) | N | hayır | mace | +1 | 1d6 + 1 ezici + 1d4 gürültü | Sap | Yük: 2 (UD 1d2), Eylem Thunderwave (DC 14 CON, 2d8 gürültü + 10 ft itme) Gürült… | **çalışır** |  |
| S2#47 | `webrender-longsword` | Ağkesen Uzun Kılıç | Webrender Longsword | silah (savaş) | N | evet | longsword | +1 | 1d8 + 1 kesici (1d10 + 1) | Sap | Yük: 2 (UD 1d2), Bonus 15 ft ağ yüzeyi (DC 14 DEX) Oluşan ağ yüzeyi ateş değdiğ… | **çalışır** |  |
| S2#48 | `pitchtorch-club` | Yağlı Meşale Sopası | Pitchtorch Club | silah (basit) | SD | hayır | club |  | 1d4 ezici + 1d4 ateş | Slow | Pasif: 15+15 ft ışık, Shillelagh uyumu Derin su altıgeninde alev söner; parlak … | **çalışır** |  |
| S2#49 | `sparkling-handaxe` | Kıvılcımlı El Baltası | Sparkling Handaxe | silah (basit) | SD | hayır | handaxe |  | 1d6 kesici + 1d4 yıldırım | Vex | Pasif: Metal zırh/su hedefe +1 saldırı Silah fırlatıldığında ele kendiliğinden … | **kanca** | hedef/öz durum koşulu (KOSULLAR'da yok) |
| S2#50 | `lancers-charge-lance` | Süvari Hücum Kargısı | Lancer's Charge Lance | silah (savaş) | E | evet | lance | +3 | 1d10 + 3 delici | Topple | Pasif: Binekten düşme save avantajı Bineksizken Two-Handed kuralı geçerlidir (k… | **çalışır** |  |
| S2#51 | `barbed-chain-whip` | Dikenli Zincir Kamçı | Barbed Chain Whip | silah (savaş) | ÇN | evet | whip | +2 | 1d4 + 2 kesici + 1d6 ateş | Slow | Yük: 3 (UD 1d3), isabette DC 15 STR 5 ft çekme + 1 tur Restrained Bağlı bir hed… | **çalışır** |  |
| S2#52 | `sunstar-morningstar` | Kutsal Yıldız Gürzü | Sunstar Morningstar | silah (savaş) | ÇN | evet | morningstar | +2 | 1d8 + 2 delici + 1d4 ışıltı | Sap | Yük: 2 (UD 1d2), Eylem 10 ft DC 15 CON 3d6 ışıltı + 1 tur Blinded Şafak Patlama… | **çalışır** |  |
| S2#53 | `delvers-war-pick` | Çukur Delen Savaş Kazması | Delver's War Pick | silah (savaş) | N | hayır | war-pick | +1 | 1d8 + 1 delici (1d10 + 1) | Sap | Yük: 2 (UD 1d2), AC 17+/ağır zırha 1 tur AC −2 Zırh Çatlağı düşük AC'li hedefle… | **çalışır** |  |
| S2#54 | `silent-needle-blowgun` | Sessiz İğne Üfleci | Silent Needle Blowgun | silah (savaş) | N | evet | blowgun | +1 | 1 + 1 delici + 1d6 zehir | Vex | Yük: 3 (UD 1d3), DC 14 CON Poisoned + Blinded SRD 5.2.1 kuralı gereği Blowgun d… | **kanca** | Hidden koşulu |
| S2#55 | `starstone-sling` | Yıldız Taşı Sapanı | Starstone Sling | silah (basit) | N | hayır | sling | +1 | 1d4 + 1 ezici + 1d4 kuvvet | Slow | Yük: 2 (UD 1d2), isabette DC 14 CON 10 ft itme + Prone Normal menzil 30 ft kısa… | **çalışır** |  |
| S2#56 | `tide-sickle` | Kıyı Orağı | Tide Sickle | silah (basit) | SD | hayır | sickle | +1 | 1d4 + 1 kesici + 1d4 soğuk | Nick | Pasif: Su hedefe saldırı avantajı ve su dondurma | **kanca** | hedef/öz durum koşulu (KOSULLAR'da yok) |
| S2#57 | `giantcore-club` | Dev Özü Sopası | Giantcore Club | silah (basit) | SD | evet | club |  | 1d4 ezici | Slow | Pasif: Eldeyken STR skoru 19'a sabitlenir Sopa yere düşürülürse veya elde tutul… | **çalışır** |  |
| S2#58 | `silverneedle-dart` | Gümüş İğne Oku | Silverneedle Dart | silah (basit) | SD | hayır | dart | +1 | 1d4 + 1 delici | Vex |  | **çalışır** |  |
| S2#59 | `skyfall-heavy-crossbow` | Gök Düşüren Arbalet | Skyfall Heavy Crossbow | silah (savaş) | ÇN | evet | heavy-crossbow | +2 | 1d10 + 2 delici | Push | Yük: 2 (UD 1d2), Eylem 60 ft DC 15 STR 20 ft çekme 18 lb ağırlığı yüksektir; Lo… | **çalışır** |  |
| S2#60 | `battering-ram-staff` | Koçbaşı Asası | Battering Ram Staff | silah (basit) | ÇN | evet | quarterstaff | +2 | 1d6 + 2 ezici (1d8 + 2) | Topple | Yük: 2 (UD 1d2), DC 15 CON Stunned (1 tur) Huge ve Gargantuan yaratıklar Koç Da… | **çalışır** |  |
| S2#61 | `stormbolt-javelin` | Şimşek Ciriti | Stormbolt Javelin | silah (basit) | N | evet | javelin | +1 | 1d6 + 1 delici + 1d4 yıldırım | Slow |  | **çalışır** |  |
| S2#62 | `earthshatter-maul` | Çökertme Balyozu | Earthshatter Maul | silah (savaş) | N | evet | maul | +1 | 2d6 + 1 ezici + 1d4 gürültü | Topple | Yük: 2 (UD 1d2), Eylem 10 ft DC 14 STR 2d6 gürültü + 5 ft itme + Prone Yer Vuru… | **çalışır** |  |
| S2#63 | `hooklash-glaive` | Kancalı Tırpan Kargı | Hooklash Glaive | silah (savaş) | N | hayır | glaive | +1 | 1d10 + 1 kesici | Graze | Yük: 3 (UD 1d3), Bonus 20 ft DC 14 STR 1d6 delici + 10 ft çekme STR 13 altında … | **çalışır** |  |
| S2#64 | `gale-light-hammer` | İten Hafif Çekiç | Gale Light Hammer | silah (basit) | SD | hayır | light-hammer | +1 | 1d4 + 1 ezici | Nick | Yük: 1 (KD) veya kritikte DC 13 STR 10 ft itme 20 ft ötesi fırlatmalar dezavant… | **çalışır** |  |
| S2#65 | `vaulting-pike` | Sıçrama Kargısı | Vaulting Pike | silah (savaş) | SD | hayır | pike | +1 | 1d10 + 1 delici | Push | Pasif: Long Jump +5 ft 18 lb ağırlığı taşıma sınırında yüksektir; STR 13 altınd… | **çalışır** |  |
| S2#66 | `oathshatter-warhammer` | İnanç Kıran Savaş Çekici | Oathshatter Warhammer | silah (savaş) | SD | hayır | warhammer | +1 | 1d8 + 1 ezici (1d10 + 1) | Push | Yük: 1 (KD), isabette +1d6 kuvvet + DC 13 STR 15 ft itme 15 ft itme hedefi kend… | **çalışır** |  |
| S2#67 | `crimson-whisper` | Kırmızı Fısıltı | Crimson Whisper | silah (savaş) | E | evet | shortsword | +3 | 1d6 + 3 delici + 1d4 nekrotik | Vex | Yük: 2 (UD 1d2), öldürmede 1 tur Invisible Truesight veya Blindsight menzilinde… | **çalışır** |  |
| S2#68 | `nightjudge-scimitar` | Gece Yargıcı Palası | Nightjudge Scimitar | silah (savaş) | ÇN | evet | scimitar | +2 | 1d6 + 2 kesici | Nick | Yük: 2 (UD 1d2), gizliyken +1d6 psişik, gizlilik bozulmaz Parlak ışık altında K… | **kanca** | Hidden koşulu |
| S2#69 | `hellcinder-hand-crossbow` | Kül Ateşi El Arbaleti | Hellcinder Hand Crossbow | silah (savaş) | ÇN | evet | hand-crossbow | +2 | 1d6 + 2 delici | Vex | Yük: 2 (UD 1d2), Scorching Ray Loading yüzünden aynı aksiyonda tek normal atış … | **kanca** | Hidden koşulu |
| S2#70 | `ambushers-shortsword` | Pusu Kısa Kılıcı | Ambusher's Shortsword | silah (savaş) | N | hayır | shortsword | +1 | 1d6 + 1 delici | Vex | Pasif: İnisiyatif +2, Perception avantajı Öncü Darbesi yalnızca savaşın 1. turu… | **çalışır** |  |
| S2#71 | `shadowveil-shortbow` | Gölgeli Kısa Yay | Shadowveil Shortbow | silah (basit) | N | evet | shortbow | +1 (+2 loş/karanlıkta) | 1d6 + 1 delici | Vex | Yük: 2 (UD 1d2), DC 14 CON Blinded (1 tur) Gündüz veya parlak ışık altındaki al… | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok) |
| S2#72 | `sorrowthorn-dagger` | Keder Hançeri | Sorrowthorn Dagger | silah (basit) | N | evet | dagger | +1 | 1d4 + 1 delici | Nick |  | **çalışır** |  |
| S2#73 | `mindrend-shortsword` | Akıl Kıran Kısa Kılıç | Mindrend Shortsword | silah (savaş) | SD | hayır | shortsword | +1 | 1d6 + 1 delici | Vex |  | **çalışır** |  |
| S2#74 | `nightscout-dagger` | Gece İzci Hançeri | Nightscout Dagger | silah (basit) | SD | hayır | dagger | +1 | 1d4 + 1 delici | Nick | Pasif: Stealth avantajı, 30 ft Darkvision Stealth dezavantajı veren zırh giyili… | **çalışır** |  |
| S2#75 | `archmages-conduit-staff` | Başbüyücü Odası Asası | Archmage's Conduit Staff | silah (basit) | E | evet (Büyücü) | quarterstaff | +2 silah, +2 büyü saldı… | 1d6 + 2 ezici (1d8 + 2) | Topple | Yük: 1 (UD), Bonus ≤5. sv. yuva yenileme Yuva Geri Kazanımı 6–9. seviye büyü yu… | **kanca** | kendi başarılı save'i tetiği; uyum önkoşulu (Büyücü) |
| S2#76 | `incandescent-ember-staff` | Kor Alev Asası | Incandescent Ember Staff | silah (basit) | ÇN | evet (Büyücü) | quarterstaff | +1 silah, +1 menzilli b… | 1d6 + 1 ezici + 1d4 ateş | Topple | Yük: 1 (UD), Fireball (DC 15 DEX) Fireball küresindeki dost yaratıklar ve yanıc… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| S2#77 | `sovereigns-staff` | Taç Asası | Sovereign's Staff | silah (basit) | ÇN | evet (Büyücü) | quarterstaff | +2 silah, +1 büyü saldı… | 1d6 + 2 ezici (1d8 + 2) | Topple | Yük: 2 (UD 1d2), tepki 60 ft DC 15 INT 2d6 psişik + Stunned (1 tur) Hükümdar Ka… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| S2#78 | `resonance-staff` | Yankı Asası | Resonance Staff | silah (basit) | ÇN | evet (Büyücü) | quarterstaff | +2 silah, +1 büyü DC | 1d6 + 2 ezici (1d8 + 2) | Topple | Yük: 1 (UD), Protection from Energy Element Yankısı aynı anda yalnızca tek bir … | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| S2#79 | `harmonic-rapier` | Ahenk Meçi | Harmonic Rapier | silah (savaş) | N | evet | rapier | +1 | 1d8 + 1 delici | Vex | Yük: 1 (KD), Bonus DC 15 Performance → 5 tur +CHA hasar Performance kontrolü ba… | **kanca** | PDF: beceri kontrolü başarısına bağlı silah hasarına +CHA eki; Vex ve Silence kuralı |
| S2#80 | `staff-of-arcane-benediction` | Kutsama Asası | Staff of Arcane Benediction | silah (basit) | N | evet (Büyücü) | quarterstaff | +1 | 1d6 + 1 ezici (1d8 + 1) | Topple | Yük: 2 (UD 1d2), Bless Bless konsantrasyon gerektirir; konsantrasyon bozulduğun… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| S2#81 | `sylvan-voice-scimitar` | Orman Sesi Palası | Sylvan Voice Scimitar | silah (savaş) | SD | evet (Büyücü) | scimitar | +1 | 1d6 + 1 kesici | Nick | Pasif: Bitkisel zorlu arazide normal hareket (plantWalker) Büyücülük yeteneği o… | **kanca** | uyum önkoşulu (Büyücü); PDF: silah saldırısında genel büyücülük yeteneği seçimi; plantWalker ve Nick savaşta |
| S2#82 | `acidarrow-staff` | Asit Oku Asası | Acidarrow Staff | silah (basit) | SD | evet (Büyücü) | quarterstaff | +1 silah, +1 büyü saldı… | 1d6 + 1 ezici (1d8 + 1) | Topple | Yük: 1 (UD), Acid Arrow (2. seviye) Acid Arrow menzilli büyü saldırısı olduğund… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| S2#83 | `shattervow-greatsword` | Kırılgan Hüküm | Shattervow Greatsword | silah (savaş) | E | evet | greatsword | +3 | 2d6 + 3 kesici | Graze |  | **kanca** | PDF: tek saldırıda silahı kalıcı parçalayan Brittle/imha kancası; +3 ve Graze savaşta |
| S2#84 | `marshals-banner-longsword` | Sancak Komutanı Kılıcı | Marshal's Banner Longsword | silah (savaş) | ÇN | evet | longsword | +2 | 1d8 + 2 kesici (1d10 + 2) | Sap | Yük: 2 (UD 1d2), Bonus 30 ft dosta tepki saldırısı Komutan Buyruğu hedef dostun… | **çalışır** |  |
| S2#85 | `banshees-wail-shortbow` | Yakarış Uzun Yayı | Banshee's Wail Shortbow | silah (basit) | ÇN | evet | shortbow | +2 | 1d6 + 2 delici | Vex | Yük: 3 (UD 1d3), DC 15 WIS Frightened (2 tur) Frightened bağışıklığı olan yarat… | **çalışır** |  |
| S2#86 | `pactbound-warhammer` | Bağlı Savaş Çekici | Pactbound Warhammer | silah (savaş) | N | evet | warhammer | +1 (bağlıyken +2) | 1d8 + 1 ezici (1d10 + 1) | Push | Pasif: Bağlıyken düşürülemez Silah bağı olmayan karakterlerde yalnızca +1 savaş… | **kanca** | PDF: Pact/silah bağı varlığına bağlı dinamik +1 ve +1d6 yıldırım eki; silahBagi düşme |
| S2#87 | `scourge-of-torment-mace` | Kamçılayan Azap Topuzu | Scourge of Torment Mace | silah (basit) | N | evet | mace | +1 | 1d6 + 1 ezici + 1d6 nekrotik | Sap | Pasif: Nekrotik direnci Her isabet kullanıcıya ve yanındaki dostlara da 1d6 nek… | **kanca** | hedef konsantrasyonda koşulu |
| S2#88 | `bloodrite-dagger` | Kan Ayini Hançeri | Bloodrite Dagger | silah (basit) | N | evet | dagger | +1 | 1d4 + 1 delici | Nick | Aktif/Pasif: Bonus kendine 1d4 kesici (veya isabet) → saldırı/save +1d4 Kan Ada… | **çalışır** |  |
| S2#89 | `unbound-balance-staff` | Zırhsız Denge Asası | Unbound Balance Staff | silah (basit) | SD | evet | quarterstaff |  | 1d6 ezici (1d8) | Topple | Pasif: Unarmed Strike +1 saldırı/hasar; zırhsız/kalkansızken tüm kurtarma zarla… | **çalışır** |  |
| S2#90 | `frenzied-blood-flail` | Lanetli Çılgınlık Gürzü | Frenzied Blood Flail | silah (savaş) | SD | evet | flail | +2 | 1d8 + 2 ezici | Sap | Pasif: İsabette 1d4 iyileşme (turda maks. 2); saldırısız tur sonunda DC 12 WIS … | **çalışır** |  |
| KY#1 | `flame-siphon-greatsword` | Alev Sömüren Büyük Kılıç | Flame-Siphon Greatsword | silah (savaş) | E | evet | greatsword | +3 | 2d6 + 3 kesici + 1d6 ateş | Graze | Yük: 2 (UD 1d2), Eylem 30 ft çizgi DC 16 DEX 5d6 ateş + Prone + hedef başı 1d6 … | **çalışır** |  |
| KY#2 | `frostcrescent-greatsword` | Ayaz Hilal Büyük Kılıcı | Frostcrescent Greatsword | silah (savaş) | E | evet | greatsword | +3 | 2d6 + 3 kesici + 1d4 soğuk | Graze | Yük: 2 (UD 1d2), Bonus 3 tur 30 ft soğuk hilal saldırısı + DC 16 CON −10 ft hız… | **çalışır** |  |
| KY#3 | `corkscrew-executioner-sword` | Burgu İnfaz Kılıcı | Corkscrew Executioner Sword | silah (savaş) | ÇN | evet | greatsword | +2 | 2d6 + 2 kesici | Graze | Yük: 2 (UD 1d2), Eylem 20 ft 3× saldırı (her biri 1d8 + 2 delici + 1d4 kuvvet; … | **çalışır** |  |
| KY#4 | `riftbreaker-greatsword` | Yarık Çökerten Dev Kılıç | Riftbreaker Greatsword | silah (savaş) | ÇN | evet | maul | +2 | 2d6 + 2 ezici | Topple | Yük: 2 (UD 1d2), Eylem 30 ft çizgi DC 15 STR 4d6 kuvvet + Prone + 2 tur zorlu a… | **kanca** | taban silahtan fark: adı kılıç, istatistiği Maul (2d6 ezici, Topple) |
| KY#5 | `whirlwind-katana` | Girdap Katanası | Whirlwind Katana | silah (savaş) | E | evet | longsword | +3 | 1d8 + 3 kesici (1d10 + 3) | Vex | Yük: 2 (UD 1d2), Eylem 20 ft sıçrama + 4 kesim saldırısı Çelik Dansı varış altı… | **kanca** | taban silahtan fark: ustalık Vex≠Sap, +Finesse, +Reach |
| KY#6 | `mooncut-katana` | Aykesen Katana | Mooncut Katana | silah (savaş) | ÇN | evet | longsword | +2 | 1d8 + 2 kesici (1d10 + 2) + 1d4 k… | Vex | Yük: 3 (UD 1d3), Bonus 25 ft çizgi DC 15 DEX 3d6 kuvvet + konsantrasyon dezavan… | **kanca** | taban silahtan fark: ustalık Vex≠Sap, +Finesse |
| KY#7 | `bloodtide-katana` | Kızıl Akıntı Katanası | Bloodtide Katana | silah (savaş) | ÇN | evet | longsword | +2 | 1d8 + 2 kesici + 1d4 ateş | Vex | Yük: 2 (UD 1d2), Eylem 15 ft koni DC 15 DEX 3d6 kesici + 2d6 ateş + kanama Cons… | **kanca** | taban silahtan fark: ustalık Vex≠Sap, +Finesse |
| KY#8 | `horizonlight-greatsword` | Ufuk Işığı Büyük Kılıcı | Horizonlight Greatsword | silah (savaş) | E | evet | greatsword | +3 | 2d6 + 3 kesici + 1d6 ışıltı | Graze | Yük: 2 (UD 1d2), Eylem 30 ft koni DC 16 CON 6d6 ışıltı + Blinded STR 13 altında… | **çalışır** |  |
| KY#9 | `blackflame-oathblade` | Kara Alev Yemin Kılıcı | Blackflame Oathblade | silah (savaş) | ÇN | evet | greatsword | +2 | 2d6 + 2 kesici + 1d4 ateş | Graze | Yük: 2 (UD 1d2), Eylem 10 ft +3d6 nekrotik + kara alev dot + maks. HP azaltma K… | **çalışır** |  |
| KY#10 | `golden-poise-greatsword` | Altın Denge İki Elli Kılıcı | Golden Poise Greatsword | silah (savaş) | N | evet | greatsword | +1 | 2d6 + 1 kesici | Graze | Yük: 2 (UD 1d2), Bonus 1 tur +10 geçici can, B/P/S direnci, itilme/Prone bağışı… | **çalışır** |  |
| KY#11 | `cinderfrost-katana` | Küllü Ayaz Katanası | Cinderfrost Katana | silah (savaş) | N | evet | longsword | +1 | 1d8 + 1 kesici (1d10 + 1) | Vex | Yük: 2 (UD 1d2), Bonus 3 tur ikili element + 5 ft 1d8 yıldırım Aktivasyondaki 5… | **kanca** | taban silahtan fark: ustalık Vex≠Sap, +Finesse |
| KY#12 | `twin-starblades` | Yıldız Çifti Büyük Kılıçları | Twin Starblades | silah (savaş) | E | evet | greatsword | +3 | 2d6 + 3 kesici + 1d4 kuvvet | Cleave | Yük: 2 (UD 1d2), Eylem 20 ft çekme + 2d6 kuvvet; Bonus 10 ft 4d6 kuvvet + Prone… | **kanca** | taban silahtan fark: ustalık Cleave≠Graze |
| KY#13 | `nebula-wing-scimitar` | Bulutsu Kanat Palası | Nebula Wing Scimitar | silah (savaş) | ÇN | evet | scimitar | +2 | 1d6 + 2 kesici + 1d4 kuvvet | Nick | Yük: 3 (UD 1d3), Eylem 3 altıgene gecikmeli 3d6 kuvvet mayını Düşmanlar mayınlı… | **kanca** | PDF: 1 tur gecikmeli patlayan altıgen mayını nesnesi; Nick ve kuvvet hasarı çalışır |
| KY#14 | `stardust-flail` | Yıldız Tozu Gürzü | Stardust Flail | silah (savaş) | ÇN | evet | flail | +2 | 1d8 + 2 ezici + 1d4 kuvvet | Sap | Yük: 2 (UD 1d2), Eylem 10 ft içinde 5 gecikmeli kuvvet küresi (3d6 + 5 ft itme)… | **kanca** | PDF: 1 tur gecikmeli patlayan altıgen mayını nesnesi; forcedMove ve Sap çalışır |
| KY#15 | `meteor-jaw-war-pick` | Göktaşı Çene Kazması | Meteor Jaw War Pick | silah (savaş) | ÇN | evet | war-pick | +2 | 1d8 + 2 delici (1d10 + 2) + 1d4 k… | Sap | Yük: 3 (UD 1d3), Eylem 40 ft siper aşan dikey darbe (DC 15 DEX 4d6 kuvvet + Pro… | **çalışır** |  |
| KY#16 | `cinderdrag-maul` | Kor Sürükleyen Balyoz | Cinderdrag Maul | silah (savaş) | ÇN | evet | maul | +2 | 2d6 + 2 ezici + 1d4 ateş | Topple | Yük: 2 (UD 1d2), Eylem 20 ft alevli hücum + düşman sürükleme (DC 15 STR 3d6 ezi… | **kanca** | PDF: düz hatta düşmanı birlikte sürükleyen taşıma-hücum hareketi; alev izi ve Prone ç |
| KY#17 | `sawtooth-wheel-greataxe` | Dişli Çark Baltası | Sawtooth Wheel Greataxe | silah (savaş) | N | evet | greataxe | +1 | 1d12 + 1 kesici | Cleave | Yük: 2 (UD 1d2), Bonus 2 tur çark dönüşü + DC 14 CON 1d6 kanama 10 lb ağırlığı … | **çalışır** |  |
| KY#18 | `homing-forge-hammer` | Dönen Ocak Çekici | Homing Forge Hammer | silah (savaş) | N | hayır | warhammer | +1 | 1d8 + 1 ezici (1d10 + 1) | Push |  | **kanca** | taban silahtan fark: +Thrown |
| KY#19 | `homing-forge-greataxe` | Dönen Ocak Baltası | Homing Forge Greataxe | silah (savaş) | N | hayır | greataxe | +1 | 1d12 + 1 kesici | Cleave | Yük: 2 (UD 1d2), bitişiğe 1d12 + 1 kesici STR 13 altında dezavantaj verir; 20 f… | **kanca** | taban silahtan fark: +Thrown |
| KY#20 | `shadowbloom-maul` | Gölge Çiçeği Balyozu | Shadowbloom Maul | silah (savaş) | ÇN | evet | maul | +2 | 2d6 + 2 ezici + 1d4 ışıltı | Topple | Yük: 2 (UD 1d2), Eylem 3 kademeli (tek→5 ft→10 ft) 6d6 toplam darbe + Prone 10 … | **çalışır** |  |
| KY#21 | `scarlet-anvil-maul` | Kızıl Çekiç | Scarlet Anvil Maul | silah (savaş) | N | evet | maul | +1 | 2d6 + 1 ezici + 1d4 asit | Topple | Yük: 2 (UD 1d2), Eylem 10 ft DC 14 CON 2d6 asit + 2 tur 1d4 asit dot + asit yüz… | **çalışır** |  |
| KY#22 | `bellringer-mace` | Çan Sesi Topuzu | Bellringer Mace | silah (basit) | SD | hayır | mace | +1 | 1d6 + 1 ezici | Sap | Yük: 1 (KD), isabette 10 ft düşmana 1d6 gürültü + konsantrasyon dezavantajı Çın… | **kanca** | hedef konsantrasyonda koşulu |
| KY#23 | `sparkforge-hammer` | Kıvılcım Dövme Çekici | Sparkforge Hammer | silah (basit) | SD | hayır | light-hammer | +1 | 1d4 + 1 ezici + 1d4 yıldırım | Nick |  | **çalışır** |  |
| KY#24 | `blindspot-backhand-blades` | Kör Nokta İkiz Bıçakları | Blindspot Backhand Blades | silah (savaş) | ÇN | evet | scimitar | +2 | 1d6 + 2 kesici | Nick | Yük: 3 (UD 1d3), Bonus 10 ft arkaya kayma + kalkan AC yok sayan +1d6 saldırı He… | **çalışır** |  |
| KY#25 | `luster-twinblade` | Işık Biriktiren Çift Mızrak | Luster Twinblade | silah (savaş) | E | evet | yok (çift uçlu kılıç) | +3 | 1d8 + 3 kesici + 1d4 ışıltı | Vex | Özel: İsabette +1 yük (maks. 4) → Eylem 40 ft çizgi DC 16 DEX, yük başı 2d6 ışı… | **kanca** | PDF: silah üstünde savaş içi ardışık isabet sayacı; 40 ft çizgi ve ışıltı hasarı hazı; taban silahtan fark: SRD karşılığı yok: 1d8 kesici, Finesse+Two-Handed, Vex |
| KY#26 | `bloodrite-trident` | Kan Ayini Üç Dişli Mızrağı | Bloodrite Trident | silah (savaş) | E | evet | trident | +3 | 1d8 + 3 delici (1d10 + 3) + 1d4 a… | Topple | Yük: 2 (UD 1d2), Eylem 15 ft siper aşan DC 16 CON 3d6 ateş + 2d6 nekrotik + kan… | **kanca** | taban silahtan fark: +Reach |
| KY#27 | `skybolt-spear` | Gök Yıldırımı Mızrağı | Skybolt Spear | silah (savaş) | E | evet | spear | +3 | 1d8 + 3 delici (1d10 + 3) + 1d4 y… | Sap | Yük: 2 (UD 1d2), Eylem 100 ft 6d8 yıldırım + 10 ft itme + Prone Kadim Şimşek At… | **kanca** | taban silahtan fark: zar 1d8 (1d10)≠1d6 (1d8), +Finesse |
| KY#28 | `windspiral-pike` | Rüzgâr Burgusu Kargısı | Windspiral Pike | silah (savaş) | ÇN | evet | pike | +2 | 1d10 + 2 delici + 1d4 ışıltı | Push | Yük: 2 (UD 1d2), Eylem 30 ft çizgi DC 15 STR 4d6 delici + 2d6 ışıltı + 15 ft it… | **çalışır** |  |
| KY#29 | `ribbon-whip-blade` | Şerit Kamçı Kılıcı | Ribbon Whip-Blade | silah (savaş) | N | hayır | whip | +1 | 1d6 + 1 kesici | Slow | Yük: 2 (KD), Bonus +5 ft erişim, +1d8 delici, 1 tur tepki yok | **kanca** | taban silahtan fark: zar 1d6≠1d4 |
| KY#30 | `dryleaf-handwraps` | Kuru Yaprak Dövüş Sargısı | Dryleaf Handwraps | silah (basit) | N | evet | yok (el sargısı) | +1 | 1d6 + 1 ezici | Push | Yük: 2 (KD), Eylem 5 ft DC 14 STR 3d6 kuvvet + 15 ft itme + Prone Avuç Patlamas… | **kanca** | taban silahtan fark: Unarmed Strike'ı silah sayma (1d6 ezici, Finesse/Light, Push) |
| KY#31 | `gale-footwraps` | Kasırga Tekme Sargısı | Gale Footwraps | silah (basit) | ÇN | evet | yok (ayak sargısı) | +2 | 1d8 + 2 ezici | Topple | Yük: 2 (UD 1d2), Eylem 20 ft sıçrama + 10 ft DC 15 DEX 4d6 ezici + Prone | **kanca** | yükseklik (K8) koşulu eşyada yok; atlama/iniş tetiği; taban silahtan fark: Unarmed Strike'ı silah sayma (1d8 ezici, Finesse/Light, Topple) |
| KY#32 | `ember-perfume-bottle` | Köz Parfüm Şişesi | Ember Perfume Bottle | silah (basit) | N | hayır | yok (simya şişesi) | +1 | 1d6 + 1 ateş | Vex | Yük: 2 (UD 1d2), Eylem 15 ft çizgi DC 14 DEX 3d6 ateş + alev yüzeyi 15 ft menzi… | **kanca** | taban silahtan fark: SRD karşılığı yok: 1d6 ateş, 15 ft, Finesse/Light |
| KY#33 | `storm-perfume-bottle` | Yıldırım Parfüm Şişesi | Storm Perfume Bottle | silah (basit) | N | hayır | yok (simya şişesi) | +1 | 1d6 + 1 yıldırım | Vex | Yük: 2 (UD 1d2), Eylem 15 ft koni DC 14 DEX 3d6 yıldırım + tepki yok 15 ft menz… | **kanca** | taban silahtan fark: SRD karşılığı yok: 1d6 yıldırım, 15 ft, Finesse/Light |
| KY#34 | `frost-perfume-bottle` | Ayaz Parfüm Şişesi | Frost Perfume Bottle | silah (basit) | SD | hayır | yok (simya şişesi) |  | 1d6 soğuk | Slow | Yük: 1 (KD), Bonus 10 ft buz yüzeyi (2 tur) Düz +1 saldırı bonusu yoktur; buz y… | **kanca** | taban silahtan fark: SRD karşılığı yok: 1d6 soğuk, 15 ft, Finesse/Light |
| KY#35 | `crimson-needle-rapier` | Kızıl İğne Mızrağı | Crimson Needle Rapier | silah (savaş) | N | evet | rapier | +1 | 1d8 + 1 delici | Vex | Yük: 2 (UD 1d2), Bonus 10 ft kayma + avantajlı +1d8 asit Asit bağışıklığı olan … | **kanca** | verilen hasar türü tetiği |

### 2.2 B — Zırh, cübbe, kalkan (60)

Taban: önerilen SRD zırhı + `bonus.armor` (katalog AC'si − SRD AC). Bu yazım zırh eşyası ↔ giyilen zırh bağı (O3b) olmadan istismara açıktır (bölüm 4.6).

| Kaynak | id önerisi | TR ad | EN-AD | Yuva | Nad. | Uyum | Taban / tür | AC / bonus | Hasar | Özel / yük | Durum | Kanca / not |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KY#36 | `piercing-knight-shield` | Delici Şövalye Kalkanı | Piercing Knight Shield | kalkan | ÇN | evet | shield + silah | +2 | 1d8 + 2 delici | Pasif: Saldırı yapılan turda sonraki ilk darbede hasar −4 | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez); PDF: kalkan yuvasındaki nesneyi doğrudan yakın dövüş silahı olarak saldırtma bayrağı;; taban silahtan f… |
| KY#37 | `spellmirror-greatshield` | Büyü Yansıtan Büyük Kalkan | Spellmirror Greatshield | kalkan | E | evet | Shield +1 | +3 |  | Yük: 3 (UD 1d3), tepki büyü hasarı yarı / +4 AC + 60 ft büyücüye DC 16 DEX 3d8 … | **çalışır** |  |
| KY#38 | `one-eyed-mortar-shield` | Tek Gözlü Topçu Kalkanı | One-Eyed Mortar Shield | kalkan | ÇN | evet | Shield +0 | +2 |  | Yük: 2 (UD 1d2), Eylem 60 ft / 10 ft alan DC 15 DEX 4d6 ateş + 5 ft itme 12 lb … | **çalışır** |  |
| KY#39 | `flamevisage-greatshield` | Alev Yüzlü Kalkan | Flamevisage Greatshield | kalkan | N | evet | Shield +0 | +2 |  | Yük: 2 (UD 1d2), Eylem 15 ft koni DC 14 DEX 3d6 ateş + Burning + 1 tur +1 AC (y… | **çalışır** |  |
| KY#40 | `barbed-monolith-shield` | Dikenli Parmak İzi Kalkanı | Barbed Monolith Shield | kalkan | N | evet | Shield +0 | +2 |  | Pasif: İtilmeye direnç; başarılı Shove +1d8 delici + 1d4 psişik + DC 14 CON 1d4… | **kanca** | Shove/Grapple sonu tetiği |
| KY#41 | `raptor-feather-coat` | Yırtıcı Tüy Pelerini Zırhı | Raptor Feather Coat | hafif | N | hayır | Studded Leather Armor +0 | 12 + DEX |  | Pasif: Jump sonrası veya ≥10 ft yüksekten turda 1 isabete +1d6 hasar | **kanca** | yükseklik (K8) koşulu eşyada yok; atlama/iniş tetiği |
| KY#42 | `bramble-iron-plate` | Dikenli Çelik Zırhı | Bramble Iron Plate | orta | N | hayır | Breastplate +1 | 15 + DEX (maks. +2) |  | Pasif: Dash geçişi veya Shove/Grapple temasında düşman başı turda 1 kez 1d6 del… | **kanca** | Dash tetiği; Shove/Grapple sonu tetiği |
| KY#43 | `silentblade-scale` | Sessiz Bıçak Zırhı | Silentblade Scale | hafif | ÇN | evet | Studded Leather Armor +1 | 13 + DEX |  | Pasif: Stealth avantajı, Tremorsense'e karşı görünmezlik, sessiz hareket Görüş … | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok); Hidden koşulu |
| KY#44 | `crimson-fiend-plate` | Kızıl İblis Zırhı | Crimson Fiend Plate | ağır | ÇN | evet | Plate Armor +0 | 18 (Sabit) |  | Pasif: Verdiğin hasar +3 (alanda +2) | **kanca** | PDF: kullanıcının aldığı her hasara +3 ekleyen ters hasar değiştiricisi; verilen hasa |
| KY#49 | `royal-remnant-plate` | Kraliyet Kalıntısı Zırhı | Royal Remnant Plate | ağır | ÇN | evet | Plate Armor +0 | 18 (Sabit) |  | Pasif: Nekrotik direnci; ≤%25 canda tur başı 1d6 + 2 iyileşme (0 HP'de çalışmaz… | **kanca** | hedef/öz durum koşulu (KOSULLAR'da yok) |
| KY#50 | `vigil-shroud-robe` | Şifa Örtüsü Cübbesi | Vigil Shroud Robe | zırhsız | N | evet | zırhsız (unarmoredAcBonus/acExtra) | +1 |  | Pasif: Tur başı 10 ft içindeki yaralı dostlara 1d4 iyileşme Kullanıcının kendis… | **çalışır** |  |
| KY#51 | `verdigris-bastion-plate` | Yeşil Bakır Hisar Plakası | Verdigris Bastion Plate | ağır | E | evet | Plate Armor +2 | 20 (Sabit) |  | Pasif: Fiziksel hasar −3, zorla itme/çekme ve Prone bağışıklığı | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez) |
| KY#52 | `spellblade-coat` | Savaş Büyücüsü Cübbe Zırhı | Spellblade Coat | hafif | N | evet | Studded Leather Armor +0 | 12 + DEX |  | Pasif: Silah aktif yetenek hasarına turda 1 +1d6 ve aktif yetenek DC +1 | **çalışır** |  |
| KY#53 | `primordial-knight-plate` | Kök Şövalye Zırhı | Primordial Knight Plate | ağır | ÇN | evet | Plate Armor +1 | 19 (Sabit) |  | Pasif: Tüm hasar −1; yakın koni/alan yeteneklerine +1d6 hasar ve +5 ft menzil G… | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez) |
| KY#55 | `solitude-knight-plate` | Yalnızlık Şövalyesi Plakası | Solitude Knight Plate | ağır | ÇN | evet | Plate Armor +1 | 19 (Sabit) |  | Pasif: Fiziksel hasar −1; 5 ft saldırı sonrası sonraki yakın isabete +1d8 + DC … | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez) |
| ZK#1 | `ravenwing-leather` | Kuzgun Kanadı Derisi | Ravenwing Leather | hafif | E | evet | Studded Leather Armor +2 | 14 + DEX |  | Yük / Aktif: 2 yük (UD 1d2), Bonus 5 tur uçuş Uçuş süresi havadayken biterse ve… | **kanca** | yükseklik (K8) koşulu eşyada yok |
| ZK#2 | `mossmantle-armor` | Yosun Örtüsü Zırhı | Mossmantle Armor | hafif | ÇN | evet | Studded Leather Armor +1 | 13 + DEX |  | Yük: 1 (UD), Eylem Plant Growth Kuru ve yanıcı bitkisel yüzeyler ateş büyüsüyle… | **çalışır** |  |
| ZK#3 | `moonshift-hide` | Ay Biçimi Derisi | Moonshift Hide | hafif | ÇN | evet (Druid) | Studded Leather Armor +0 | 12 + DEX |  | Pasif (Wild Shape): En az 18 geçici can; geçici can sürerken +1 AC, gelen hasar… | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez); uyum önkoşulu (Druid) |
| ZK#4 | `sporewarden-leather` | Spor Bekçisi Derisi | Sporewarden Leather | hafif | ÇN | evet | Studded Leather Armor +1 | 13 + DEX |  | Yük: 2 (UD 1d2), Bonus 15 ft / 10 ft alan (zehir bulutu veya dost hız/isabet sp… | **çalışır** |  |
| ZK#5 | `crimson-stalker-leather` | Kızıl Suikastçı Derisi | Crimson Stalker Leather | hafif | ÇN | evet | Studded Leather Armor +1 | 13 + DEX |  | Pasif: İnisiyatif +2; 5 ft düşmanlara turda 1 delici vuruşta +1d6 delici ve dir… | **çalışır** |  |
| ZK#6 | `twilight-leather` | Alacakaranlık Derisi | Twilight Leather | hafif | N | evet | Studded Leather Armor +0 | 12 + DEX |  | Pasif: Stealth +1 (loş/karanlıkta Stealth +3 ve tüm kurtarma zarları +1) Gündüz… | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok) |
| ZK#7 | `spidersilk-armor` | Örümcek İpeği Zırhı | Spidersilk Armor | hafif | N | hayır | Studded Leather Armor +0 | 12 + DEX |  | Pasif: CON save avantajı, Stealth +1, Web Walker İpek dokusu ateş hasarına karş… | **çalışır** |  |
| ZK#8 | `corsair-captains-coat` | Korsan Kaptanı Ceketi | Corsair Captain's Coat | hafif | N | evet | Studded Leather Armor +0 | 12 + DEX |  | Yük: 1 (UD) 0 HP'de 1 HP + 8 geçici can; 1 (UD) Bonus 10 ft 2 hedef DC 14 WIS C… | **çalışır** |  |
| ZK#9 | `minstrels-favor-jerkin` | Ozanın İyilik Ceketi | Minstrel's Favor Jerkin | hafif | SD | hayır | Leather Armor +0 | 11 + DEX |  | Pasif: Turda 1 Bardic Inspiration veya dost iyileştirmede +5 geçici can | **kanca** | iyileştirme yapma/alma tetiği |
| ZK#10 | `scarlet-scout-leather` | Kızıl İzci Derisi | Scarlet Scout Leather | hafif | SD | hayır | Studded Leather Armor +0 | 12 + DEX |  | Pasif: Stealth +1, İnisiyatif +1, bitkisel zorlu arazide normal hareket Taşlık,… | **çalışır** |  |
| ZK#11 | `armor-of-fleetness` | Çeviklik Zırhı | Armor of Fleetness | orta | E | evet | Breastplate +2 | 16 + Tam DEX |  | Pasif: Tüm kurtarma zarları +2, +5 ft hız Riskler Yüksek AC yalnızca DEX skoru … | **kanca** | orta zırhta DEX tavanı (stats.ts sabit +2); PDF: orta zırhta +2 DEX tavanını kaldıran uncappedDex bayrağı; kurtarma ve hız çalışı |
| ZK#12 | `shadowknight-half-plate` | Gölge Şövalyesi Yarım Plakası | Shadowknight Half Plate | orta | ÇN | evet | Breastplate +2 | 16 + DEX (maks. +2) |  | Yük: 1 (UD), Bonus 3 tur +2 AC (kons.) Pasif: CON save avantajı; loş/karanlıkta… | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez); ışık düzeyi koşulu (KOSULLAR'da yok) |
| ZK#13 | `venomcarapace-scale` | Zehirli Kabuk Zırhı | Venomcarapace Scale | orta | ÇN | evet | Breastplate +1 | 15 + DEX (maks. +2) |  | Yük: 2 (UD 1d2), tepki 5 ft zehir bulutu + DC 15 CON 2d6 zehir 42 lb ağırlığı v… | **çalışır** |  |
| ZK#14 | `stormplate-scale` | Ebedi Fırtına Pul Zırhı | Stormplate Scale | orta | ÇN | evet | Breastplate +2 | 16 + DEX (maks. +2) |  | Pasif: Yıldırım direnci, Stunned bağışıklığı, yakın isabet alınca saldırgana 1d… | **çalışır** |  |
| ZK#15 | `serpentscale-mail` | Kertenkele Pulu Zırhı | Serpentscale Mail | orta | N | hayır | Breastplate +1 | 15 + Tam DEX |  | Pasif: İnisiyatif +1 Dice & Hex — Özgün Zırhlar, Cübbeler ve Kalkanlar Kataloğu… | **kanca** | orta zırhta DEX tavanı (stats.ts sabit +2); PDF: orta zırhta +2 DEX tavanını kaldıran uncappedDex bayrağı; inisiyatif çalışır |
| ZK#16 | `barkweave-breastplate` | Ağaç Kabuğu Göğüslüğü | Barkweave Breastplate | orta | N | hayır | Breastplate +1 | 15 + DEX (maks. +2) |  | Pasif: CON save avantajı; yakın dövüşte vuran Undead'e 1d6 ışıltı | **çalışır** |  |
| ZK#17 | `sparkmesh-chain-shirt` | Kıvılcım Yeleği | Sparkmesh Chain Shirt | orta | N | evet | Breastplate +0 | 14 + DEX (maks. +2) |  | Yük: 2 (UD 1d2), tepki DC 14 DEX 1d8 yıldırım + tepki yok Çarpan Halka tepki ha… | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez) |
| ZK#18 | `mindward-half-plate` | Psişik Kalkan Zırhı | Mindward Half Plate | orta | N | evet | Breastplate +1 | 15 + DEX (maks. +2) |  | Pasif: Psişik direnç, INT/WIS save +1, başarılı büyü save'inde turda 1 1d6 iyil… | **kanca** | kendi başarılı save'i tetiği |
| ZK#19 | `sunburst-breastplate` | Işık Dalgalı Göğüslük | Sunburst Breastplate | orta | SD | evet | Breastplate +0 | 14 + DEX (maks. +2) |  | Pasif: Turda 1 ışıltı hasarında 10 ft düşmanlara DC 13 CON → sonraki saldırı de… | **kanca** | verilen hasar türü tetiği |
| ZK#20 | `slipstream-chain-shirt` | Sıyrılan Zincir Gömlek | Slipstream Chain Shirt | orta | SD | hayır | Chain Shirt +0 | 13 + DEX (maks. +2) |  | Pasif: İyileştirme yapıldığında/alındığında tur sonuna dek fırsat saldırısı yok… | **kanca** | iyileştirme yapma/alma tetiği |
| ZK#21 | `briarwander-hide` | Çalılık Gezgini Zırhı | Briarwander Hide | orta | SD | hayır | Chain Shirt +0 | 13 + DEX (maks. +2) |  | Pasif: Nature +1, DEX save +1, plantWalker | **çalışır** |  |
| ZK#22 | `hellforge-plate` | Cehennem Ocağı Plakası | Hellforge Plate | ağır | E | evet | Plate Armor +2 | 20 (Sabit) |  | Yük: 1 (UD), Bonus 3 tur Fly 45 lb ağırlığı düşük STR'li büyücülerde taşıma kap… | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez); kendi başarılı save'i tetiği; ağır zırhta STR/eğitim muafiyeti; PDF: ağır zırhta eğitimsiz ceza muafiye… |
| ZK#23 | `plate-of-endurance` | Sarsılmaz Yemin Plakası | Plate of Endurance | ağır | ÇN | evet | Plate Armor +1 | 19 (Sabit) |  | Pasif: Fiziksel hasar −2, tüm kurtarma +1, itilmeye karşı STR avantajı ve mesaf… | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez); Shove/Grapple sonu tetiği |
| ZK#24 | `devouring-bone-plate` | Yutucu Kemik Plakası | Devouring Bone Plate | ağır | ÇN | evet | Plate Armor +1 | 19 (Sabit) |  | Pasif: Yakın dövüş saldırı +1; turda 1 öldürmede +10 geçici can ve +10 ft hız (… | **çalışır** |  |
| ZK#25 | `reapers-iron-plate` | Biçici Karanlık Plakası | Reaper's Iron Plate | ağır | ÇN | evet | Plate Armor +1 | 19 (Sabit) |  | Yük: 1 (UD), Eylem 15 ft DC 15 CON 3d6 nekrotik + yarı hız (2 tur) STR 15 altın… | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez) |
| ZK#26 | `marshals-crested-plate` | Mareşal Armalı Plakası | Marshal's Crested Plate | ağır | ÇN | evet | Plate Armor +1 | 19 (Sabit) |  | Pasif: Ateş direnci, tüm kurtarma zarları +2, tüm hasar −1 | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez) |
| ZK#27 | `plate-of-devotion` | Adanmışlık Plakası | Plate of Devotion | ağır | N | evet | Plate Armor +0 | 18 (Sabit) |  | Yük: 1 (UD), Bonus +1 Channel Divinity (yoksa 12 geçici can) STR 15 altında yür… | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez) |
| ZK#28 | `mindfortress-plate` | Zihin Kalesi Plakası | Mindfortress Plate | ağır | N | evet | Plate Armor +0 | 18 (Sabit) |  | Pasif: Frightened bağışıklığı, WIS save avantajı, tüm hasar −1 | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez) |
| ZK#29 | `dwarven-anvil-splint` | Cüce Örsü Şerit Zırhı | Dwarven Anvil Splint | ağır | N | evet | Plate Armor +0 | 18 (Sabit) |  | Pasif: +10 Maks. HP, CON save +1, delici hasar −2 STR 15 altında yürüme hızı 10… | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez); verilen hasar türü tetiği |
| ZK#30 | `scorched-iron-plate` | Kızgın Demir Plakası | Scorched Iron Plate | ağır | SD | hayır | Splint Armor +0 | 17 (Sabit) |  | Pasif: Tüm hasar −1; 5 ft yakın saldırgana 1d4 ateş hasarı | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez) |
| ZK#31 | `forcewave-chain-mail` | Dalgalanan Kuvvet Zırhı | Forcewave Chain Mail | ağır | SD | hayır | Chain Mail +0 | 16 (Sabit) |  | Pasif: Tüm hasar −1; turda 1 yakın darbede 1d4 kuvvet + DC 13 STR 5 ft itme | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez) |
| ZK#32 | `weavewoven-robe` | Örgü Dokuması Cübbe | Weavewoven Robe | zırhsız | E | evet (Büyücü) | zırhsız (unarmoredAcBonus/acExtra) | +2 |  | Pasif: +2 büyü DC, +1 büyü saldırı, başarılı büyü save'inde turda 1 1d6 iyileşm… | **kanca** | kendi başarılı save'i tetiği; uyum önkoşulu (Büyücü) |
| ZK#33 | `resonant-caster-robe` | Karizmatik Büyücü Cübbesi | Resonant Caster Robe | zırhsız | ÇN | evet (Büyücü) | zırhsız (unarmoredAcBonus/acExtra) | +1 |  | Pasif: Turda 1 cantrip hasarına +CHA; tur başı +CHA geçici can CHA skoru düşük … | **kanca** | uyum önkoşulu (Büyücü); PDF: eşyadan genel cantrip hasarına +CHA eki; acExtra ve tur başı geçici can savaşta |
| ZK#34 | `robe-of-supreme-focus` | Üstün Odak Cübbesi | Robe of Supreme Focus | zırhsız | ÇN | evet (Büyücü) | zırhsız (unarmoredAcBonus/acExtra) | +1 (Odaklanırken) |  | Pasif (Konsantrasyon varken): +1 AC ve tüm kurtarma zarları +2 Konsantrasyon sü… | **kanca** | hedef konsantrasyonda koşulu; uyum önkoşulu (Büyücü) |
| ZK#35 | `soulmender-monk-vest` | Ruh Yenileyen Keşiş Yeleği | Soulmender Monk Vest | zırhsız | ÇN | evet | zırhsız (unarmoredAcBonus/acExtra) | +2 |  | Tepki: 5 ft iskada 1 Unarmed Strike Pasif: Başarılı büyü save'inde turda 1 1d4 … | **kanca** | kendi başarılı save'i tetiği |
| ZK#36 | `tidecaller-robe` | Dalga Anası Cübbesi | Tidecaller Robe | zırhsız | N | evet | zırhsız (unarmoredAcBonus/acExtra) | +1 |  | Yük: 1 (KD), Eylem 30 ft / 10 ft su yüzeyi (3 tur) Su üzerinde beklemek yıldırı… | **çalışır** |  |
| ZK#37 | `nimble-cat-tunic` | Atik Kedi Tuniği | Nimble Cat Tunic | zırhsız | N | evet | zırhsız (unarmoredAcBonus/acExtra) | Yok |  | Pasif: Tüm DEX kontrollerinde avantaj, DEX save +1, Long Jump +5 ft Doğrudan +A… | **çalışır** |  |
| ZK#38 | `venomweaver-robe` | Zehirci Cübbesi | Venomweaver Robe | zırhsız | SD | hayır | zırhsız (unarmoredAcBonus/acExtra) | Yok |  | Pasif: Zehir direnci; turda 1 zehir büyüsüne +1d4 zehir hasarı Zehir bağışıklığ… | **çalışır** |  |
| ZK#39 | `walking-bastion-shield` | Yürüyen Hisar Kalkanı | Walking Bastion Shield | kalkan | E | evet | Shield +1 | +3 |  | Yük: 2 (UD 1d2) tepki 2d6 kuvvet + DC 16 STR 10 ft itme/Prone; 1 (UD) Warding B… | **çalışır** |  |
| ZK#40 | `deflector-knight-shield` | Saptıran Şövalye Kalkanı | Deflector Knight Shield | kalkan | ÇN | evet | Shield +0 | +2 |  | Yük: 2 (UD 1d2), tepki 60 ft menzilli iskada DC 15 DEX 2d6 kuvvet Mermi Saptırm… | **çalışır** |  |
| ZK#41 | `dreadwall-shield` | Korku Kalkanı | Dreadwall Shield | kalkan | ÇN | evet | Shield +0 | +2 |  | Pasif: +1 adet 1. seviye büyü yuvası; 15 ft düşmanlara Frightened save dezavant… | **çalışır** |  |
| ZK#42 | `sunward-shield` | Güneş Siperi Kalkanı | Sunward Shield | kalkan | N | evet | Shield +0 | +2 |  | Pasif: DEX save avantajı, +1 büyü DC, +1 büyü saldırı Elde kalkan tutmak Two-Ha… | **çalışır** |  |
| ZK#43 | `cinderback-shield` | Kor Karşılığı Kalkanı | Cinderback Shield | kalkan | N | evet | Shield +0 | +2 |  | Yük: 2 (UD 1d2), Bonus 2 tur +1 AC ve 5 ft yakın saldırgana 1d6 ateş Alevli Sip… | **çalışır** |  |
| ZK#44 | `shadecloak-greatshield` | Gölge Örtüsü Kalkanı | Shadecloak Greatshield | kalkan | N | evet | Shield +0 | +2 |  | Yük: 1 (KD), Bonus 10 ft Darkness (2 tur, kons. yok) + Hide avantajı Büyülü kar… | **çalışır** |  |
| ZK#45 | `briarvine-shield` | Dikenli Asma Kalkanı | Briarvine Shield | kalkan | SD | hayır | Shield +0 | +2 |  | Yük: 1 (KD), Bonus 10 ft DC 13 STR 1d6 delici + Restrained (1 tur) Ahşap kalkan… | **çalışır** |  |

### 2.3 C — Başlık, pelerin, eldiven, bot (55)

| Kaynak | id önerisi | TR ad | EN-AD | Yuva | Nad. | Uyum | Taban / tür | AC / bonus | Hasar | Özel / yük | Durum | Kanca / not |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KY#45 | `starstone-crown` | Yıldız Taşı Tacı | Starstone Crown | başlık | N | evet |  |  |  | Pasif: INT +2 (maks. 20), büyü DC +1 | **çalışır** |  |
| KY#46 | `silvertear-mask` | Gümüş Damla Maskesi | Silvertear Mask | başlık | N | evet |  |  |  | Pasif: CHA +2 (maks. 20), Persuasion/Deception +1 | **kanca** | verilen hasar türü tetiği |
| KY#47 | `pale-blood-mask` | Soluk Kan Maskesi | Pale Blood Mask | başlık | ÇN | evet |  |  |  | Pasif: 20 ft içinde kanama tetiklenince 1 tur +2 saldırı ve +1d4 silah hasarı C… | **kanca** | PDF: 20 ft çevredeki herhangi bir yaratığın bleed hasarı almasını dinleyen alan gözle |
| KY#48 | `fungal-crown` | Mantar Taç Başlığı | Fungal Crown | başlık | N | evet |  |  |  | Pasif: 20 ft içinde Poisoned veya asit/zehir yüzeyi hasarında +6 geçici can ve … | **kanca** | verilen hasar türü tetiği; PDF: 20 ft çevrede Poisoned veya asit/zehir yüzeyi hasarını dinleyen alan gözlemcisi |
| KY#54 | `snow-witch-hat` | Kar Cadısı Şapkası | Snow Witch Hat | başlık | N | evet (Büyücü) |  |  |  | Pasif: Soğuk direnci, soğuk büyülerine +1 DC ve turda 1 +1d4 soğuk hasarı Soğuk… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| GY#1 | `vigilant-drake-helm` | Gözcü Ejderha Miğferi | Vigilant Drake Helm | başlık | E | evet |  | +1 |  | Yük: 1 (KD), Bonus 30 ft 3 tur işaret (avantaj + öldürmede 10 geçici can) Ejder… | **çalışır** |  |
| GY#2 | `focus-surge-helm` | Odak Kıvılcımı Miğferi | Focus Surge Helm | başlık | ÇN | evet |  |  |  | Pasif: CON save +1; turda 1 silah isabeti → sonraki büyü DC ve saldırı +2 (1 tu… | **çalışır** |  |
| GY#3 | `shadowtracker-hood` | Gölge İzci Başlığı | Shadowtracker Hood | başlık | ÇN | evet |  |  |  | Yük: 1 (UD), Bonus 10 tur See Invisibility Gündüz açık alanlarda veya parlak ış… | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok) |
| GY#4 | `weavebound-circlet` | Örgü Tacı | Weavebound Circlet | başlık | ÇN | evet (Büyücü) |  |  |  | Pasif: Büyü saldırı +2, büyü DC +1, Arcana +1 Dice & Hex — Özgün Başlıklar, Pel… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| GY#5 | `embercrown-hood` | Alev Yutan Başlık | Embercrown Hood | başlık | ÇN | evet (Büyücü) |  |  |  | Pasif: Ateş direnci; turda 1 ateş hasarı → sonraki büyü DC +2 (1 tur) | **kanca** | verilen hasar türü tetiği; uyum önkoşulu (Büyücü) |
| GY#6 | `apex-stalker-helm` | Yırtıcı Miğfer | Apex Stalker Helm | başlık | N | evet |  |  |  | Pasif: Frightened bağışıklığı, 60 ft Darkvision, ≥10 ft yüksekten menzilli sald… | **kanca** | yükseklik (K8) koşulu eşyada yok |
| GY#7 | `crimson-fury-circlet` | Kızıl Hiddet Tacı | Crimson Fury Circlet | başlık | N | evet |  |  |  | Pasif: Tam canın altındayken yakın saldırı +1 ve +2 nekrotik; hasarsız tur sonu… | **kanca** | hedef/öz durum koşulu (KOSULLAR'da yok) |
| GY#8 | `stormsong-hat` | Gök Gürültüsü Şapkası | Stormsong Hat | başlık | N | evet (Büyücü) |  |  |  | Pasif: Gürültü direnci; turda 1 yıldırım/gürültü hasarı → sonraki büyü DC +1 ve… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| GY#9 | `diadem-of-spellstrike` | Kutsama Tacı | Diadem of Spellstrike | başlık | N | evet |  |  |  | Pasif: Durum/işaret uygulama sonrası sonraki silah isabetine +büyücülük değişti… | **kanca** | durum uygulama tetiği; PDF: durum/ustalık işareti uygulama sonrası silah hasarına büyü yeteneği eki; en küçü |
| GY#10 | `dawnmender-circlet` | Göksel Şifa Çemberi | Dawnmender Circlet | başlık | N | hayır |  |  |  | Pasif: Başka bir dostu iyileştirince turda 1 kez kendine 1d6 iyileşme Yalnızca … | **kanca** | iyileştirme yapma/alma tetiği |
| GY#11 | `mindshield-helm` | Düşünce Siperi Miğferi | Mindshield Helm | başlık | SD | hayır |  |  |  | Pasif: Kritik vuruş bağışıklığı, WIS save +1 Doğal 20 atışı yine otomatik isabe… | **çalışır** |  |
| GY#12 | `quickwit-cowl` | Hızlı Akıl Başlığı | Quickwit Cowl | başlık | SD | hayır |  |  |  | Pasif: 1–2. turlarda +10 ft yürüme hızı, inisiyatif +1 3. turdan itibaren hız b… | **çalışır** |  |
| GY#13 | `sparkcrest-circlet` | Kıvılcım Çemberi | Sparkcrest Circlet | başlık | SD | hayır |  |  |  | Pasif: Turda 1 yıldırım/gürültü hasarında +4 geçici can Geçici can üst üste bir… | **kanca** | verilen hasar türü tetiği |
| GY#14 | `shadowstep-cloak` | Gölge Yürüyüşü Pelerini | Shadowstep Cloak | pelerin | E | evet |  |  |  | Yük: 1 (KD), Bonus 30 ft loş/karanlık ışınlanma + ilk saldırıya avantaj Gündüz … | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok) |
| GY#15 | `weavefold-cloak` | Örgü Kıvrımı Pelerini | Weavefold Cloak | pelerin | ÇN | evet (Büyücü) |  |  |  | Yük: 2 (UD 1d2), tepki element hasarı yarı + sonraki isabete +1d6 o element Ele… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| GY#16 | `stormwing-cloak` | Kuzgun Kanadı Pelerini | Stormwing Cloak | pelerin | ÇN | evet |  | +1 |  | Yük: 1 (KD), Bonus 3 tur 5 ft süzülme (yeredegmez) Süzülme 5 ft ile sınırlıdır;… | **çalışır** |  |
| GY#17 | `fleshrender-cloak` | Asit Püskürten Pelerin | Fleshrender Cloak | pelerin | ÇN | evet |  |  |  | Pasif: Asit direnci; 5 ft yakın isabet alınca saldırgana 1d6 asit hasarı Menzil… | **çalışır** |  |
| GY#18 | `shadeblood-mantle` | Kanlı Gölge Örtüsü | Shadeblood Mantle | pelerin | N | evet |  |  |  | Pasif: Hidden iken 19–20 kritik; loş/karanlıkta +1 AC Dice & Hex — Özgün Başlık… | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok); Hidden koşulu |
| GY#19 | `frostmist-cloak` | Buzul Sis Pelerini | Frostmist Cloak | pelerin | N | evet |  |  |  | Pasif: Soğuk direnci; 5 ft yakın isabette 1d4 soğuk + turda 1 DC 13 CON −10 ft … | **çalışır** |  |
| GY#20 | `cindermoth-cloak` | Kül Güvesi Pelerini | Cindermoth Cloak | pelerin | N | evet |  |  |  | Pasif: Ateş direnci; turda 1 yakın darbede DC 14 DEX Burning Yanan düşman yağ v… | **çalışır** |  |
| GY#21 | `thunderskin-cloak` | Gök Gürültüsü Örtüsü | Thunderskin Cloak | pelerin | N | evet |  |  |  | Pasif: Gürültü direnci; 5 ft yakın darbede 1d4 gürültü + turda 1 DC 14 CON Deaf… | **çalışır** |  |
| GY#22 | `steamshell-cloak` | Buhar Perdesi Pelerini | Steamshell Cloak | pelerin | SD | hayır |  |  |  | Yük: 1 (KD), tepki +2 AC (o saldırıya) + 5 ft buhar yüzeyi (2 tur) +2 AC kritik… | **çalışır** |  |
| GY#23 | `trailblazer-cloak` | İvme Pelerini | Trailblazer Cloak | pelerin | SD | hayır |  |  |  | Pasif: Dash sonrası 1 tur +1 AC ve fırsat saldırıları dezavantajlı Dash yapılma… | **kanca** | Dash tetiği |
| GY#24 | `menders-mantle` | Şifacı Omuz Örtüsü | Mender's Mantle | pelerin | SD | hayır |  |  |  | Pasif: Poisoned save avantajı; turda 1 zehir hasarı/Poisoned uygulayınca 1d4 iy… | **çalışır** |  |
| GY#25 | `soulcatcher-gauntlets` | Ruh Yakalayan Eldiven | Soulcatcher Gauntlets | eldiven | E | evet |  |  |  | Pasif: CON +2 (maks. 20), Unarmed Strike +1d8 kuvvet; turda 1 Unarmed isabette … | **çalışır** |  |
| GY#26 | `compass-gloves` | Pusula Eldiveni | Compass Gloves | eldiven | ÇN | evet |  |  |  | Yük: 2 (UD 1d2), Eylem 30 ft menzil, 20 ft ışınlama (düşmana DC 15 WIS) | **çalışır** |  |
| GY#27 | `helldusk-gauntlets` | Alevli Yumruk Eldiveni | Helldusk Gauntlets | eldiven | ÇN | evet |  |  |  | Pasif: +1 büyü saldırı/DC, +1 STR save; silah +1d4 ateş, Unarmed +1d6 ateş + tu… | **çalışır** |  |
| GY#28 | `spellquick-gloves` | Hızlı Büyü Eldiveni | Spellquick Gloves | eldiven | ÇN | evet (Büyücü) |  |  |  | Yük: 1 (KD), Bonus eylemle eylemlik cantrip Yalnızca cantrip'lerde çalışır; 1. … | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| GY#29 | `daredevil-bracers` | Büyülü Hedef Eldiveni | Daredevil Bracers | eldiven | ÇN | evet (Büyücü) |  |  |  | Pasif: Büyü saldırı +1; menzilli büyüde 5 ft düşman dezavantajı yok Yakın Nişan… | **kanca** | uyum önkoşulu (Büyücü); PDF: menzilli büyüde enemyAdjacent dezavantajını kaldıran bayrak; +1 büyü saldırısı ç |
| GY#30 | `skythunder-gloves` | Yankı Göğü Eldiveni | Skythunder Gloves | eldiven | N | evet |  |  |  | Pasif: Turda 1 yıldırım/gürültü/ışıltı hasarında DC 14 CON → 1d4 gürültü + −10 … | **kanca** | verilen hasar türü tetiği |
| GY#31 | `slingmaster-gloves` | Fırlatma Ustası Eldiveni | Slingmaster Gloves | eldiven | N | hayır |  |  |  | Pasif: Fırlatılan silah ve nesne atışlarına +1d4 hasar Riskler Aynı silahla yap… | **çalışır** |  |
| GY#32 | `luminous-gauntlets` | Işıltı Saçan Eldiven | Luminous Gauntlets | eldiven | N | evet |  |  |  | Pasif: Turda 1 ışıltı hasarında hedefe 1 tur 5 ft parlak ışık, görünmezlik açma… | **kanca** | verilen hasar türü tetiği |
| GY#33 | `twinhand-gloves` | İki El Dengesi Eldiveni | Twinhand Gloves | eldiven | N | hayır |  |  |  | Pasif: Yan el saldırı hasarına yetenek değiştiricisi eklenir (offhandModifier),… | **çalışır** |  |
| GY#34 | `winterclaw-gloves` | Kış Pençesi Eldiveni | Winterclaw Gloves | eldiven | N | evet |  |  |  | Pasif: Turda 1 soğuk hasarında DC 14 CON → 1 tur DEX save dezavantajı + 2 tur b… | **kanca** | verilen hasar türü tetiği |
| GY#35 | `warding-healer-gloves` | Şifacı Zırh Eldiveni | Warding Healer Gloves | eldiven | N | evet |  |  |  | Pasif: İyileştirilen dosta 1 tur ezici/delici/kesici direnci | **kanca** | iyileştirme yapma/alma tetiği |
| GY#36 | `ichorous-gloves` | Asit İzi Eldiveni | Ichorous Gloves | eldiven | SD | hayır |  |  |  | Pasif: Turda 1 asit hasarında hedefin 5 ft çevresindeki düşmanlara 1d4 asit has… | **kanca** | verilen hasar türü tetiği |
| GY#37 | `dexterous-silk-gloves` | Büyülü Çeviklik Eldiveni | Dexterous Silk Gloves | eldiven | SD | evet |  |  |  | Pasif: DEX skoru 18'e sabitlenir, silah saldırı +1 DEX skoru zaten 18+ olan kar… | **çalışır** |  |
| GY#38 | `sparkhand-gloves` | Kıvılcım Eldiveni | Sparkhand Gloves | eldiven | SD | hayır |  |  |  | Pasif: Metal zırh/su hedefe Unarmed Strike avantajlı ve +1d4 yıldırım hasarı Su… | **kanca** | hedef/öz durum koşulu (KOSULLAR'da yok) |
| GY#39 | `nightwalker-boots` | Karanlık Adım Çizmeleri | Nightwalker Boots | bot | E | evet |  |  |  | Yük: 1 (KD), Bonus Misty Step (30 ft) Lav, alev ve derin su hasarlarına karşı k… | **çalışır** |  |
| GY#40 | `boots-of-unyielding` | Sarsılmaz İnat Çizmeleri | Boots of Unyielding | bot | ÇN | evet |  |  |  | Pasif: +10 ft hız, zorlu arazide normal hareket, Paralyzed/Restrained save avan… | **çalışır** |  |
| GY#41 | `frostspike-boots` | Buz Çivili Avcı Çizmeleri | Frostspike Boots | bot | ÇN | evet |  |  |  | Yük: 2 (UD 1d2), Bonus 15 ft ışınlanma + 5 ft buz (DC 14 DEX Prone) Varışta olu… | **çalışır** |  |
| GY#42 | `skyvault-boots` | Gök Sıçrayışı Çizmeleri | Skyvault Boots | bot | ÇN | evet |  |  |  | Yük: 1 (UD) tepki save +4; 1 (KD) Bonus 30 ft ışınlanma + 5 ft DC 15 DEX 2d6 at… | **çalışır** |  |
| GY#43 | `rushstrike-boots` | Süratli Akın Çizmeleri | Rushstrike Boots | bot | N | hayır |  |  |  | Yük: 2 (UD 1d2), Bonus Dash + o tur fırsat saldırıları dezavantajlı Fırsat sald… | **çalışır** |  |
| GY#44 | `stormstep-boots` | Yankı Adımı Çizmeleri | Stormstep Boots | bot | N | evet |  |  |  | Pasif: Turda 1 düşmana durum uygulayınca DC 14 CON → 1d4 gürültü hasarı + Prone… | **kanca** | durum uygulama tetiği |
| GY#45 | `steadyfocus-boots` | Büyü Dengesi Çizmeleri | Steadyfocus Boots | bot | N | evet |  |  |  | Pasif (Konsantrasyon varken): Prone ve zorla itilme bağışıklığı, +5 ft hız | **çalışır** |  |
| GY#46 | `springvault-boots` | Zıplama Yayı Çizmeleri | Springvault Boots | bot | N | hayır |  |  |  | Pasif: Acrobatics +1, Long/High Jump +5 ft; turda 1 jump inişinde 5 ft düşmana … | **kanca** | atlama/iniş tetiği |
| GY#47 | `waterskipper-sandals` | Suda Yürüyen Sandalet | Waterskipper Sandals | bot | N | evet |  |  |  | Yük: 1 (UD), Bonus 10 tur Water Walk Su üzerinde durmak düşman yıldırım saldırı… | **çalışır** |  |
| GY#48 | `windstep-sandals` | Keşişin Hızlı Sandaletleri | Windstep Sandals | bot | SD | evet |  |  |  | Pasif (Zırhsız/Kalkansız): +5 ft hız, Unarmed Strike hasarına +⌊WIS/2⌋ (min +1,… | **kanca** | PDF: zırhsızken Unarmed hasarına WIS/2 ölçeği; speedFt ve noArmor koşulu savaşta çalı |
| GY#49 | `sparkstride-boots` | Kıvılcım Çizmeleri | Sparkstride Boots | bot | SD | hayır |  |  |  | Pasif: Dash sonrası ilk saldırıya +1 isabet ve +1d4 yıldırım hasarı (1 tur) Ris… | **kanca** | Dash tetiği |
| GY#50 | `mirestrider-boots` | Bataklık Geçidi Çizmeleri | Mirestrider Boots | bot | SD | hayır |  |  |  | Pasif: Çamur/sığ su/batakta normal hareket maliyeti; batıran çamur ve batak kur… | **çalışır** |  |

### 2.4 D — Yüzük, tılsım, mühür taşı, zanaat eklentisi (45)

Mühür taşları (YT 34–42) kullanıcı ilkesine göre soketsiz, bağımsız tılsım olarak; durum tılsım modunun durumudur.

| Kaynak | id önerisi | TR ad | EN-AD | Yuva | Nad. | Uyum | Taban / tür | AC / bonus | Hasar | Özel / yük | Durum | Kanca / not |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| YT#1 | `shadowspark-ring` | Gölge Kıvılcımı Yüzüğü | Shadowspark Ring | yüzük | E | evet |  |  |  | Yük: 3 (UD 1d3), silah isabeti sonrası Enchantment/Illusion büyüsü bonus eyleml… | **kanca** | PDF: silah isabeti sonrası okul bazlı bonus büyü bayrağı; Stealth ve recharge çalışır |
| YT#2 | `high-command-ring` | Yüksek Emir Yüzüğü | High Command Ring | yüzük | ÇN | evet |  |  |  | Yük: 1 (UD), öldürme sonrası 3 tur içinde 1 isabeti kritik vuruşa çevirme Öldür… | **çalışır** |  |
| YT#3 | `gamblers-edge-ring` | Riskli Zar Yüzüğü | Gambler's Edge Ring | yüzük | ÇN | evet |  |  |  | Pasif: Tüm saldırı zarlarında avantaj | **çalışır** |  |
| YT#4 | `dazzling-halo-ring` | Körleştiren Işık Yüzüğü | Dazzling Halo Ring | yüzük | ÇN | evet |  |  |  | Pasif (Parlak ışıkta): Turda 1 büyü hasarında DC 15 CON → 2 tur 5 ft parlak ışı… | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok); verilen hasar türü tetiği |
| YT#5 | `snowburst-ring` | Ayaz Halka Yüzüğü | Snowburst Ring | yüzük | N | evet |  |  |  | Pasif: Turda 1 soğuk hasarında hedefin 5 ft çevresinde 2 tur buz yüzeyi (DC 13 … | **kanca** | verilen hasar türü tetiği |
| YT#6 | `caustic-band` | Yakıcı Asit Yüzüğü | Caustic Band | yüzük | N | hayır |  |  |  | Pasif: Tüm silah saldırı isabetlerine +2 asit hasarı Asit bağışıklığı olan yara… | **çalışır** |  |
| YT#7 | `callous-glow-ring` | Işık Çağrısı Yüzüğü | Callous Glow Ring | yüzük | N | hayır |  |  |  | Pasif: Parlak ışıktaki hedeflere silah/büyü hasarında +2 ışıltı hasarı (hedef b… | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok); verilen hasar türü tetiği |
| YT#8 | `spellstrike-ring` | Örgü Ahengi Yüzüğü | Spellstrike Ring | yüzük | N | evet |  |  |  | Pasif: Cantrip hasarı sonrası sonraki silah isabetine +büyücülük değiştiricisi … | **kanca** | verilen hasar türü tetiği; PDF: cantrip hasarı sonrası silah hasarına büyücülük yeteneği eki |
| YT#9 | `eversight-shadow-ring` | Gölge Yürüyen Yüzüğü | Eversight Shadow Ring | yüzük | N | evet |  |  |  | Pasif: Blinded bağışıklığı; loş/karanlık hedefe turda 1 +1d4 hasar Darkness vey… | **kanca** | ışık düzeyi koşulu (KOSULLAR'da yok) |
| YT#10 | `whispering-promise-ring` | Kutsanmış Şifa Yüzüğü | Whispering Promise Ring | yüzük | N | evet |  |  |  | Pasif: İyileştirilen yaratığa 2 tur +1d4 saldırı ve kurtarma (konsantrasyonsuz)… | **kanca** | iyileştirme yapma/alma tetiği |
| YT#11 | `sparkswall-ring` | Kıvılcım Halkası | Sparkswall Ring | yüzük | N | evet |  |  |  | Pasif: Yıldırım direnci; su×yıldırım zincir tepkimesi hasarına bağışıklık Doğru… | **kanca** | verilen hasar türü tetiği |
| YT#12 | `flinging-ring` | Kurnaz Fırlatış Yüzüğü | Flinging Ring | yüzük | SD | hayır |  |  |  | Pasif: Fırlatma ve nesne atışı hasarına +1d4 | **çalışır** |  |
| YT#13 | `strange-conduit-ring` | Sıçrayan Akım Yüzüğü | Strange Conduit Ring | yüzük | N | evet |  |  |  | Pasif (Konsantrasyon varken): Silah isabetlerine +1d4 psişik hasarı Konsantrasy… | **çalışır** |  |
| YT#14 | `elemental-infusion-ring` | Kül Ezgisi Yüzüğü | Elemental Infusion Ring | yüzük | N | evet |  |  |  | Pasif: Element büyüsü sonrası sonraki silah isabetine +1d4 aynı element hasarı … | **kanca** | verilen hasar türü tetiği |
| YT#15 | `venomthorn-ring` | Zehirli Diken Yüzüğü | Venomthorn Ring | yüzük | SD | hayır |  |  |  | Pasif: Turda 1 zehir hasarına +2; Poisoned hedefe saldırı +1 | **çalışır** |  |
| YT#16 | `locksmiths-ring` | Tuzakçının Kilit Yüzüğü | Locksmith's Ring | yüzük | SD | hayır |  |  |  | Pasif: Stealth +2, Sleight of Hand +2 | **çalışır** |  |
| YT#17 | `rootgrip-ring` | Çiftçi Kökü Yüzüğü | Rootgrip Ring | yüzük | SD | hayır |  |  |  | Yük: 1 (UD), Bonus Healing Word (2d4 + 2) Pasif: Yapılan iyileştirmelere +2 can | **çalışır** |  |
| YT#18 | `fracture-ring` | Sarsıntı Kırığı Yüzüğü | Fracture Ring | yüzük | SD | hayır |  |  |  | Pasif: Turda 1 gürültü hasarında DC 13 CON → 1 tur tepki yok Gürültü hasarı kay… | **kanca** | verilen hasar türü tetiği |
| YT#19 | `lifespring-amulet` | Yaşam Kaynağı Tılsımı | Lifespring Amulet | tılsım | E | evet |  |  |  | Yük: 1 (UD), Bonus 4d8 + 4 iyileşme + Poisoned temizleme | **çalışır** |  |
| YT#20 | `spellwell-amulet` | Yedek Yuva Kolyesi | Spellwell Amulet | tılsım | E | evet (Büyücü) |  |  |  | Yük: 1 (UD), Bonus ≤6. sv. 1 yuva yenileme 7–9. seviye büyü yuvalarını yenileme… | **çalışır** | uyum önkoşulu (Büyücü) → ortak değişiklik O4 (savaşta çalışır) |
| YT#21 | `rebirth-idol-amulet` | Yeniden Doğuş Tılsımı | Rebirth Idol Amulet | tılsım | ÇN | evet |  |  |  | Yük: 1 (UD), 0 HP'de otomatik %50 Maks. HP ile ayakta kalma Lav düşüşü, Power W… | **çalışır** |  |
| YT#22 | `devouts-medallion` | Adanmışlık Tılsımı | Devout's Medallion | tılsım | ÇN | evet (Rahip/Paladin) |  |  |  | Yük: 1 (UD), Bonus +1 Channel Divinity Channel Divinity havuzu zaten doluysa İl… | **çalışır** | uyum önkoşulu (Rahip/Paladin) → ortak değişiklik O4 (savaşta çalışır) |
| YT#23 | `spellspark-pendant` | Kıvılcım Düğümü Kolyesi | Spellspark Pendant | tılsım | ÇN | evet (Büyücü) |  |  |  | Pasif: Magic Missile +1 ok; turda 1 element cantrip'ine +büyücülük değiştiricis… | **kanca** | uyum önkoşulu (Büyücü); PDF: Magic Missile +1 ok ve eşyadan element cantrip'ine büyü yeteneği eki |
| YT#24 | `subjugation-pendant` | Cerrahi Felç Kolyesi | Subjugation Pendant | tılsım | ÇN | evet |  |  |  | Yük: 1 (UD), Humanoid'e kritik vuruşta DC 15 CON Paralyzed (2 tur, tur sonu sav… | **kanca** | hedef/öz durum koşulu (KOSULLAR'da yok) |
| YT#25 | `feyward-amulet` | Peri Duruşu Tılsımı | Feyward Amulet | tılsım | ÇN | evet |  |  |  | Pasif: Tüm INT, WIS ve CHA kurtarma zarlarında avantaj Fiziksel kurtarma zarlar… | **çalışır** |  |
| YT#26 | `brandbreaker-amulet` | Damgalayan Tılsım | Brandbreaker Amulet | tılsım | N | evet |  |  |  | Yük: 1 (UD), Bonus 30 ft DC 14 CON → 1 darbelik ezici/delici/kesici Zayıflığı (… | **çalışır** |  |
| YT#27 | `venomkiss-pendant` | Zehirli İntikam Kolyesi | Venomkiss Pendant | tılsım | N | evet |  |  |  | Pasif: İyileşme alındığında 3 tur silah saldırılarına +1d6 zehir hasarı | **kanca** | iyileştirme yapma/alma tetiği |
| YT#28 | `torment-conduit-amulet` | Element Kurbanı Kolyesi | Torment Conduit Amulet | tılsım | N | evet |  |  |  | Pasif: Yüzey üstündeyken turda 1 hasar büyüsüne +1d4 yüzey elementi hasarı | **kanca** | PDF: bulunulan yüzey türünü okuyup büyü hasarına element ekleyen kanca |
| YT#29 | `clearmind-pendant` | Berrak Zihin Kolyesi | Clearmind Pendant | tılsım | N | evet |  |  |  | Yük: 1 (UD), Bonus +2 Focus veya ≤2. sv. 1 yuva (yoksa 10 geçici can) Focus vey… | **çalışır** |  |
| YT#30 | `miststep-pendant` | Sis Adımı Kolyesi | Miststep Pendant | tılsım | N | hayır |  |  |  | Yük: 1 (KD), Bonus Misty Step (30 ft) | **çalışır** |  |
| YT#31 | `dreadwing-charm` | Karanlık Kanat Muskası | Dreadwing Charm | tılsım | SD | hayır |  |  |  | Pasif: Darkvision +30 ft (yoksa 30 ft); ≤%50 canda fırsat saldırısı tetiklemez | **çalışır** |  |
| YT#32 | `silverthread-locket` | Gümüş İğne Muskası | Silverthread Locket | tılsım | SD | hayır |  |  |  | Yük: 2 (UD 1d2), 1 yük Bonus Healing Word (2d4 + 2) veya 2 yük Eylem 15 ft 3 do… | **çalışır** |  |
| YT#33 | `emberheart-talisman` | Kızgın Yürek Tılsımı | Emberheart Talisman | tılsım | SD | hayır |  |  |  | Pasif: Ateş direnci; ≤%50 canda yakın dövüş isabetlerine +1d4 ateş hasarı Menzi… | **çalışır** |  |
| YT#34 | `ember-sigil-stone` | Kor Mühür Taşı | Ember Sigil Stone | soket | N | hayır | tılsım (soketsiz) |  |  | Silah: +1d4 ateş | **çalışır** | tılsım: 19–20 kritik (zarEtkisi `kritikAralik`); silah/zırh modları soket sistemi gerektirir (sistem) |
| YT#35 | `frost-sigil-stone` | Kırağı Mühür Taşı | Frost Sigil Stone | soket | N | hayır | tılsım (soketsiz) |  |  | Silah: +1d4 soğuk | **çalışır** | tılsım: +5 ft hız, iceWalker (passive); silah/zırh modları soket sistemi gerektirir (sistem) |
| YT#36 | `storm-sigil-stone` | Fırtına Mühür Taşı | Storm Sigil Stone | soket | N | hayır | tılsım (soketsiz) |  |  | Silah: +1d4 yıldırım | **çalışır** | tılsım: +1 AC (effects.acBonus); silah/zırh modları soket sistemi gerektirir (sistem) |
| YT#37 | `stone-sigil-stone` | Kaya Mühür Taşı | Stone Sigil Stone | soket | N | hayır | tılsım (soketsiz) |  |  | Silah: +1d4 asit | **çalışır** | tılsım: +8 maks. HP (canArtisi); silah/zırh modları soket sistemi gerektirir (sistem) |
| YT#38 | `venom-sigil-stone` | Zehir Mühür Taşı | Venom Sigil Stone | soket | N | hayır | tılsım (soketsiz) |  |  | Silah: +1d4 zehir | **çalışır** | tılsım: silah saldırı +1 (bonus.weapon, bağsız); silah/zırh modları soket sistemi gerektirir (sistem) |
| YT#39 | `masterwork-sigil-stone` | Usta Çelik Mühür Taşı | Masterwork Sigil Stone | soket | ÇN | hayır | tılsım (soketsiz) |  |  | Silah: +2 fiziksel hasar | **çalışır** | tılsım: tüm save +1 (effects.saveBonus); silah/zırh modları soket sistemi gerektirir (sistem) |
| YT#40 | `umbral-sigil-stone` | Gölge Özü Mühür Taşı | Umbral Sigil Stone | soket | ÇN | hayır | tılsım (soketsiz) |  |  | Silah: +1d6 nekrotik | **kanca** | tılsım: 60 ft Darkvision çalışır; Stealth +2 düz beceri bonusu eşyada doğrulanacak; silah/zırh modları soket sistemi gerektirir (sistem) |
| YT#41 | `radiant-sigil-stone` | Işıltı Özü Mühür Taşı | Radiant Sigil Stone | soket | ÇN | hayır | tılsım (soketsiz) |  |  | Silah: +1d6 ışıltı + 10 ft loş ışık | **kanca** | tılsım: iyileştirme büyülerine hedef başı +3 (eşyada iyileştirme eki yok); silah/zırh modları soket sistemi gerektirir (sistem) |
| YT#42 | `aether-core-stone` | Öz Çekirdeği Taşı | Aether Core Stone | soket | E | evet | tılsım (soketsiz) |  |  | Yük: 1 (UD) Silah: 3 tur +2d4 zehir | **çalışır** | tılsım: 1/UD bonus 10 ft aura +2 AC/saldırı dezavantajı (aura + kaynak); silah/zırh modları soket sistemi gerektirir (sistem) |
| YT#43 | `mounting-of-power` | Güç Çerçevesi | Mounting of Power | mühür çerçevesi | ÇN | hayır | zanaat eklentisi |  |  | Etki: Çerçevelenen Mühür Taşına türüne göre +1 STR, DEX veya INT (maks. 20) ekl… | **sistem** | zanaat/çerçeve/kalıcı efsun sistemi (yok) |
| YT#44 | `mystical-mounting` | Mistik Çerçeve | Mystical Mounting | mühür çerçevesi | ÇN | hayır | zanaat eklentisi |  |  | Etki: Silah +1 saldırı | **sistem** | zanaat/çerçeve/kalıcı efsun sistemi (yok) |
| YT#45 | `ancient-imbuement-relic` | Kadim Efsun Kalıntısı | Ancient Imbuement Relic | kalıcı efsun | E | hayır | zanaat eklentisi |  |  | Silah: +1d4 yıldırım | **sistem** | zanaat/çerçeve/kalıcı efsun sistemi (yok); 'Diğer' modu (tüm save +1, inisiyatif +1) bağımsız eşya olarak çalışabilir |

### 2.5 E — Savaş donanımı ve tüketilebilirler (45)

Yuva sütunu türdür (fırlat, özel ok, kaplama, iksir, eliksir, çay); "Uyum" tüketilebilirde hep hayır.

| Kaynak | id önerisi | TR ad | EN-AD | Yuva | Nad. | Uyum | Taban / tür | AC / bonus | Hasar | Özel / yük | Durum | Kanca / not |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TK#1 | `sinkhole-orb` | Çöküntü Küresi | Sinkhole Orb | fırlat: alan/hedef | SD | hayır |  |  |  | Etki: 1d6 kuvvet hasarı + 10 ft çekme + Prone Alandaki dost yaratıklar da kurta… | **kanca** | `use.throw` şemasında yüzey/itme/çekme/süreli etki yok |
| TK#2 | `sparkburst-flask` | Sıçrayan Kıvılcım Şişesi | Sparkburst Flask | fırlat: alan/hedef | SD | hayır |  |  |  |  | **kanca** | `use.throw` şemasında yüzey/itme/çekme/süreli etki yok |
| TK#3 | `rimeburst-orb` | Kırağı Küresi | Rimeburst Orb | fırlat: alan/hedef | SD | hayır |  |  |  | Etki: 2d4 soğuk hasarı + 2 tur buz yüzeyi Buz yüzeyi üstünden yürüyen dostları … | **kanca** | `use.throw` şemasında yüzey/itme/çekme/süreli etki yok |
| TK#4 | `flashblind-capsule` | Körleştiren Flaş Kapsülü | Flashblind Capsule | fırlat: alan/hedef | N | hayır |  |  |  | Etki: 2d6 ışıltı + 2 tur Blinded (Construct'a +1d6 gürültü ve 1 tur Stunned) 15… | **çalışır** |  |
| TK#5 | `websac-bomb` | Ağ Kesesi Bombası | Websac Bomb | fırlat: alan/hedef | SD | hayır |  |  |  | Etki: 3 tur Web yüzeyi (Restrained) Ateş hasarı değdiğinde ağ tutuşarak yanan a… | **kanca** | `use.throw` şemasında yüzey/itme/çekme/süreli etki yok |
| TK#6 | `shrapnel-nailbomb` | Gök Gürültüsü Çivisi | Shrapnel Nailbomb | fırlat: alan/hedef | N | hayır |  |  |  | Etki: 3d6 delici + 2 tur 1d4 delici kanama Yüksek patlama sesi 100 ft içindeki … | **kanca** | `use.throw` şemasında yüzey/itme/çekme/süreli etki yok |
| TK#7 | `tremor-sphere` | Sarsıntı Küresi | Tremor Sphere | fırlat: alan/hedef | N | hayır |  |  |  | Etki: 2d6 ezici + Prone + konsantrasyon save dezavantajı Uçan ve süzülen hedefl… | **çalışır** |  |
| TK#8 | `dreadcenser-bomb` | Korku Buhuru Bombası | Dreadcenser Bomb | fırlat: alan/hedef | N | hayır |  |  |  | Etki: 1d6 psişik + 2 tur Frightened (tur sonu save) Frightened bağışıklığı olan… | **çalışır** |  |
| TK#9 | `haste-spore-pod` | Hızlandıran Spor Kesesi | Haste Spore Pod | fırlat: alan/hedef | ÇN | hayır |  |  |  | Etki: 2 tur bulut; girenlere 1 tur uyuşukluksuz Haste Bulut dost-düşman ayrımı … | **kanca** | `use.throw` şemasında yüzey/itme/çekme/süreli etki yok |
| TK#10 | `armor-piercing-canister` | Zırh Delen Şarapnel | Armor-Piercing Canister | fırlat: alan/hedef | ÇN | hayır |  |  |  |  | **çalışır** |  |
| TK#11 | `enthralling-mist-vial` | Aşk Tozu Şişesi | Enthralling Mist Vial | fırlat: alan/hedef | ÇN | hayır |  |  |  | Etki: 2 tur Charmed (dost hasarıyla biter) Charmed bağışıklığı olan yaratıklara… | **çalışır** |  |
| TK#12 | `cinder-cluster-bomb` | Kül Salkım Bombası | Cinder Cluster Bomb | fırlat: alan/hedef | E | hayır |  |  |  | Etki: 6d6 ateş hasarı + 2 tur alev yüzeyi Dostlar ve masumlar da 6d6 patlamaya … | **kanca** | `use.throw` şemasında yüzey/itme/çekme/süreli etki yok |
| TK#13 | `watersplash-arrow` | Su Balonu Oku | Watersplash Arrow | özel ok | SD | hayır |  |  |  | Etki: Normal silah hasarı + 5 ft su yüzeyi (3 tur) + alev söndürme Ok ateşlendi… | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı) |
| TK#14 | `steamveil-arrow` | Buhar Bulutu Oku | Steamveil Arrow | özel ok | SD | hayır |  |  |  | Etki: Normal silah hasarı + 10 ft yoğun örtü buhar yüzeyi (2 tur) Buhar bulutu … | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı) |
| TK#15 | `hoarfrost-arrow` | Kırağı Oku | Hoarfrost Arrow | özel ok | SD | hayır |  |  |  | Etki: Normal silah hasarı + 1d6 soğuk + 5 ft buz yüzeyi (2 tur, DC 13 DEX) Ok ı… | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı) |
| TK#16 | `roaring-knockback-arrow` | Gürleyen İtme Oku | Roaring Knockback Arrow | özel ok | SD | hayır |  |  |  | Etki: Normal hasar + 1d6 gürültü + 5 ft DC 13 STR 10 ft geri itme | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı) |
| TK#17 | `blightbone-arrow` | Şifa Kesen Ok | Blightbone Arrow | özel ok | N | hayır |  |  |  | Etki: Normal hasar + 1d6 nekrotik + 2 tur iyileşme engeli (noHeal) | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı) |
| TK#18 | `arcing-bolt-arrow` | Sıçrayan Yıldırım Oku | Arcing Bolt Arrow | özel ok | N | hayır |  |  |  | Etki: Normal hasar + 1d8 yıldırım + 10 ft'te 2 düşmana DC 14 DEX 1d8 yıldırım T… | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı) |
| TK#19 | `splitflight-arrow` | Çoklu Hedef Oku | Splitflight Arrow | özel ok | ÇN | hayır |  |  |  | Etki: Ana hedefe tam hasar + 15 ft'te en fazla 3 düşmana yarı silah hasarı İlk … | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı); PDF: silah isabetinde 15 ft'teki 3 hedefe yarı silah hasarı seken ok kancası + K-D2 |
| TK#20 | `transposition-arrow` | Işınlanma Oku | Transposition Arrow | özel ok | N | hayır |  |  |  | Etki: Okun vardığı boş altıgene ışınlanma (K53 teleport) 60 ft ötesine ışınlanm… | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı); PDF: ok varış altıgenine ışınlama bağlantısı; K53 teleport motoru hazır |
| TK#21 | `spellsever-arrow` | Büyü Kıran Ok | Spellsever Arrow | özel ok | ÇN | hayır |  |  |  | Etki: Normal hasar + 1d6 kuvvet + 1–3. sv. Dispel Magic + konsantrasyon dezavan… | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı) |
| TK#22 | `knockdown-blunt-arrow` | Deviren Küt Ok | Knockdown Blunt Arrow | özel ok | SD | hayır |  |  |  | Etki: Ezici silah hasarı + DC 13 STR Prone (Large ve küçük) Huge ve Gargantuan … | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı) |
| TK#23 | `blessed-mending-arrow` | Kutsanmış Şifa Oku | Blessed Mending Arrow | özel ok | N | hayır |  |  |  | Etki: Hasarsız 2d6 + 2 can iyileşme + Burning temizleme + su yüzeyi Undead ve C… | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı); iyileştirme yapma/alma tetiği |
| TK#24 | `shadowpierce-arrow` | Örtü Aşan Gölge Oku | Shadowpierce Arrow | özel ok | ÇN | hayır |  |  |  | Etki: Normal hasar + 2d6 nekrotik + DC 15 CON Blinded (1 tur) + 5 ft Darkness (… | **sistem** | özel cephane seçimi+tüketimi yok (A10 yalnız silah bağı) |
| TK#25 | `oil-of-precision` | Keskin Nişan Yağı | Oil of Precision | silah kaplaması | SD | hayır |  |  |  | Etki: Saldırı zarlarına +2 Aynı silaha başka bir yağ veya zehir sürüldüğünde Ke… | **kanca** | `use.coat` yalnız zar+tür |
| TK#26 | `oil-of-combustion` | Yanıcı Reçine Yağı | Oil of Combustion | silah kaplaması | N | hayır |  |  |  | Etki: İsabette 2 tur Yanıcı Yağ; ateş alınca 5 ft DC 14 DEX 2d6 ateş patlaması … | **kanca** | `use.coat` yalnız zar+tür; PDF: işaretli hedef ateş hasarı aldığında 5 ft alan patlaması tetikleyen kanca |
| TK#27 | `magebane-venom` | Büyü Bozan Zehir | Magebane Venom | silah kaplaması | N | hayır |  |  |  | Etki: 2 tur konsantrasyon dezavantajı ve büyü saldırı/DC −2 | **kanca** | `use.coat` yalnız zar+tür |
| TK#28 | `arsonists-tincture` | Kundakçı Yağı | Arsonist's Tincture | silah kaplaması | ÇN | hayır |  |  |  | Etki: 2 tur ateş direncini kaldırır Ateş bağışıklığı (Immunity) olan yaratıklar… | **kanca** | `use.coat` yalnız zar+tür; PDF: hedeften belirli element direncini geçici bastıran süren etki bayrağı |
| TK#29 | `hoarfrost-coating` | Ayaz Kaplama Yağı | Hoarfrost Coating | silah kaplaması | N | hayır |  |  |  | Etki: +1d4 soğuk hasarı + DC 14 CON −10 ft hız (1 tur) + su dondurma Soğuk dire… | **kanca** | `use.coat` yalnız zar+tür |
| TK#30 | `oil-of-hexing` | Lanet Yağı | Oil of Hexing | silah kaplaması | SD | hayır |  |  |  | Etki: 2 tur −1d4 saldırı ve kurtarma zarları Zaten Bane büyüsü altındaki bir he… | **kanca** | `use.coat` yalnız zar+tür |
| TK#31 | `drowsleep-venom` | Uyku Özü Zehri | Drowsleep Venom | silah kaplaması | N | hayır |  |  |  | Etki: 2 tur Unconscious (hasar/sarsmayla uyanır) Elf, Undead, Construct ve zehi… | **kanca** | `use.coat` yalnız zar+tür |
| TK#32 | `crawler-paralytic` | Sürüngen Felç Salgısı | Crawler Paralytic | silah kaplaması | ÇN | hayır |  |  |  | Etki: 1d6 zehir hasarı + 1 tur Paralyzed Zehir ve Paralyzed bağışıklığı olan he… | **kanca** | `use.coat` yalnız zar+tür |
| TK#33 | `crimson-wyrm-toxin` | Kızıl Solucan Zehri | Crimson Wyrm Toxin | silah kaplaması | E | hayır |  |  |  | Etki: 4d6 zehir hasarı + 2 tur Poisoned Yalnızca 3 tur sürer ve zehir bağışıklı… | **kanca** | `use.coat` yalnız zar+tür |
| TK#34 | `ironhide-armour-potion` | Fiziksel Zırh İksiri | Ironhide Armour Potion | iksir | SD | hayır |  |  |  | Etki: +12 geçici can; geçici can sürerken fiziksel hasar −2 12 geçici can tüken… | **kanca** | her darbede sabit hasar azaltma (motorda `reduce` turda bir kez); geçici can sürdükçe koşulu |
| TK#35 | `spellward-armour-potion` | Büyü Zırhı İksiri | Spellward Armour Potion | iksir | SD | hayır |  |  |  | Etki: +12 geçici can; geçici can sürerken büyü kurtarma avantajı | **kanca** | geçici can sürdükçe koşulu |
| TK#36 | `nimble-tumble-potion` | Çevik Savuşturma İksiri | Nimble Tumble Potion | iksir | N | hayır |  |  |  | Etki: Saldırı zarlarına dezavantaj + fırsat saldırısı yok Restrained, Grappled … | **çalışır** |  |
| TK#37 | `stoneskin-draught` | Taş Deri İksiri | Stoneskin Draught | iksir | ÇN | hayır |  |  |  | Etki: +20 geçici can, B/P/S direnci, Burning/Poisoned/Stunned bağışıklığı | **çalışır** |  |
| TK#38 | `strong-will-draught` | Sağlam İrade İksiri | Strong Will Draught | iksir | N | hayır |  |  |  | Etki: Frightened/Charmed/Blinded temizleme + 3 tur bağışıklık + 10 geçici can P… | **çalışır** |  |
| TK#39 | `angelic-reprieve-potion` | Melek Uykusu İksiri | Angelic Reprieve Potion | iksir | ÇN | hayır |  |  |  |  | **kanca** | PDF: 2 tur kesintisiz uyku sonrası savaş içi Short Rest + 1–2. sv. yuva yenileme kanc |
| TK#40 | `elixir-of-bloodlust` | Kana Susamışlık Eliksiri | Elixir of Bloodlust | eliksir (UD'ye dek) | ÇN | hayır |  |  |  | Etki: Turda 1 öldürmede +8 geçici can + 1 ek Haste eylemi | **kanca** | UD'ye dek süre + tek aktif eliksir; PDF: oldurunce tetiğinde Haste ek eylemi açma ve tek-aktif-eliksir yuvası; Haste eyle |
| TK#41 | `elixir-of-vigilance` | Tetikte Olma Eliksiri | Elixir of Vigilance | eliksir (UD'ye dek) | N | hayır |  |  |  | Etki: İnisiyatif +5 ve Surprised bağışıklığı Başka bir Eliksir içildiğinde yeri… | **kanca** | UD'ye dek süre + tek aktif eliksir |
| TK#42 | `elixir-of-viciousness` | Keskin Kritik Eliksiri | Elixir of Viciousness | eliksir (UD'ye dek) | N | hayır |  |  |  | Etki: Kritik eşiği −1 (19–20; birleşirse en çok 18–20) Başka bir Eliksir içildi… | **kanca** | UD'ye dek süre + tek aktif eliksir |
| TK#43 | `elixir-of-battlemage-focus` | Savaş Büyücüsü Odak Eliksiri | Elixir of Battlemage Focus | eliksir (UD'ye dek) | ÇN | hayır |  |  |  | Etki: Büyü saldırı +2 ve büyü DC +2 Başka bir Eliksir içildiğinde etkisi silini… | **kanca** | UD'ye dek süre + tek aktif eliksir |
| TK#44 | `elixir-of-peerless-focus` | Eşsiz Odak Eliksiri | Elixir of Peerless Focus | eliksir (UD'ye dek) | SD | hayır |  |  |  | Etki: Konsantrasyon save avantajı ve Charmed save avantajı Başka bir Eliksir iç… | **kanca** | UD'ye dek süre + tek aktif eliksir |
| TK#45 | `emerald-tea-brew` | Zümrüt Çay Demlemesi | Emerald Tea Brew | nadir çay | E | hayır |  |  |  | Etki: +1 ek Bonus Eylem ve +10 ft yürüme hızı Savaşta ikinci bir fincan içileme… | **çalışır** |  |

### 2.6 PDF "Oyundaki durum" notu ile farklar

Kalıp hâlinde (parça listesi tabloların "Kanca / not" sütununda):

1. **"Mevcut hasar azaltma"** (17 parça: KY 36, 51, 53, 55; ZK 3, 12, 17, 22, 23, 25–31; TK 34; ayrıca YT 39'un zırh modu ve Tarvok'un koşumu): `ActiveEffect.reduce` turda bir kez işler ve `spent` olur. "Tüm hasar −1" her darbede işlemez. Gereken kanca: kalıcı düz azaltma alanı (ör. `flatReduce: { n, types? }`), `damage-effects.ts` içinde direnç/zayıflıktan sonra (GENEL96 sırası).
2. **"Mevcut element hasar tetiği / iyileştirme kancası / Dash tetiği / jump iniş kancası / Shove sonu tetiği / başarılı save tepkisi"**: bunların bir kısmı motorda bir sınıf özelliğine bağlı olarak var (ör. Blessed Healer, Slow Fall, Deflect Attacks). Eşya için açık tetik değiller. Gereken: paket ilkellerine yeni `tetik` değerleri: `hasarVerince` (+ `hasarTuru`), `iyilestirince`, `iyilesince`, `durumUygulayinca`, `dashSonrasi`, `inisSonrasi`, `itmeSonrasi`, `kurtulmaBasarinca`.
3. **"Mevcut lightLevelAt / hidden / Bloodied koşulu"**: motor sorguları var (`lightLevelAt`, gizlilik, can), ama `KOSULLAR`'da yalnız `yarimCanAlti` (kendi canı < yarı) var. Gereken yeni koşullar: `isik:parlak|los|karanlik` (kendi ya da hedef altıgeni), `gizli`, `hedefKonsantrasyon`, `hedefYarimCan`, `hedefTamCan`, `yuksekZemin`, `hedefSuda`, `hedefMetalZirh`, `canEsigi:<oran>`.
4. **Silah istatistiği**: PDF katana, el sargısı, parfüm şişesi, kuvvet arbaleti ve Finesse'li tırpan gibi silahları "çalışır" sayıyor. Oysa saldırı seçeneği bağlı sıradan silahtan üretilir (`weapons.json` zar, özellik, ustalık; ustalık SRD tablosundan). Gereken kanca: eşyada `silahOzu` ezmesi (zar, hasar türü, özellik ekle/çıkar, ustalık) ya da `weapons.json`'a özgün silah kaydı (srdIds testi silahları `weapons:<id>`'ye bağlıyor, o da genişletilmeli). Katananın Vex + Finesse + Versatile'ı SRD'de hiçbir silahta yok.
5. **Özel oklar**: PDF "cephane tüketimi TE99 K-D2 kancasıyla bağlanır" diyor. K-D2 KARAR104 A10'da eşya ↔ silah bağı olarak çözüldü (`rules/itemBinding.ts`, `data/esya-silah-bagi.json`). Cephane türü seçimi ve atış başına tüketim yok. `onHit.ammo` (Ammunition of Slaying) yalnız "cephaneli saldırıya ek" verir, tüketmez. Bu yüzden 12 ok **sistem gerekir**.
6. **Eliksirler**: "UD'ye dek" süre savaşlar arası durum ister (`CharacterStatus`); `use.effect` yalnız tur sayısı alır. "Aynı anda bir eliksir" dışlaması yok.
7. **Mühür taşları** (YT 34–42): PDF "savaş dışında sokete takılır" diyor; soket sistemi yok. Kullanıcı ilkesine göre her taş bağımsız tılsım gibi girer. Tılsım modu 7 taşta bugünkü yollarla çalışır, 2 taşta (Gölge Özü Stealth +2, Işıltı Özü şifa +3) kanca ister. Silah ve zırh modları sistem gerekir.
8. **Kodda olmayan tanımlayıcılar**: PDF'lerdeki şu adlar kodda yok ve PDF'te de "yeni kanca" olarak geçiyor (doğru etiketli): `uncappedDex`, `fearImmunityPierce`, `nightmareSleepCondition`, `rangeBlindspotDisadvantage`, `decoyHexTrap`, `stoneEnduranceReflect`, `collisionBonusDamage`, `adaptiveWeaknessResolver`, `chainFormTether`. Diğer anılan adların hepsi kodda var (`tauntBy`, `concDis`, `hitExtra`, `critOnly`, `pkCritOn`, `itmeDirenci`, `canArtisi`, `yuvaGeriKazan`, `kaynakYenile`, `weaponOverride`, `waterWalk`, `offhandModifier`, `twoHandedUnlessMounted`…). Çoğu bir **savaşçı/süren etki alanı** ya da **ilkel**; eşyaya bağlanma yolu bölüm 4.1'de.
9. **Cilt 2 #41 Twinspark Greataxe**: PDF'in durum notu metinden okunamadı (sütun kayması). İçerik ateş + 10 ft sıçrayan yıldırım + yüzey tutuşturma; bu denetimde çalışır sayıldı, Aşama 2'de doğrulanacak.

## 3. BOSS ENVANTERİ

### 3.1 Varlıklar

Ana bosslar (Mora, Tarvok, Kaltakkıran) PDF'te **canavar stat bloğu olarak değil, 20. seviye çoklu sınıf karakter** olarak tanımlı: CR, AC ve HP yazılmamış. Aşağıda AC/HP için SRD 5.2.1 çoklu sınıf kuralıyla kaba hesap var (ilk sınıf tam zar, kalan ortalama + CON; feat ve eşya hariç). Bölge bossları için yalnız tema ve 2. faz cümlesi var, stat bloğu yok.

| # | Varlık | Tür · boyut · altıgen | CR | AC | HP | Hız | Duyular | Bağışıklık / direnç (kısa) | Saldırılar · efsanevi | Faz | Yenilme anahtarı | Motora sığar mı |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B1 | Al-İha Mora (1. ana boss) | Karanlık Elf · Medium · 1 | yok | yok (cübbe 15 + DEX 2 = 17) | yok (≈145: Wizard 14 d6, Sorcerer 3 d6, Warlock 3 d8, CON +3) | 30 | Darkvision 120 | Cübbe: psişik direnç, Charmed/Frightened bağışık; Fey Ancestry | 9. seviye büyü, Twin/Subtle, Sarkaç yükleri (Ninni koni, Kör Nokta tepkisi, 0 HP'de 1 HP + 30 geçici can) · efsanevi yok | 2 (%100–51 / ≤%50: Kâbus Sisi + tur sonu ışınlanma) | Kozmik Anka alevi (ateş + ışıltı) görünmezlik, sis, konsantrasyon ve 0 HP kurtuluşunu kapatır | **Hayır, düz stat bloğu ister.** Düşman tarafında karakter sayfası yolu yok (`combatantFromSheet` yalnız partide). Çoklu sınıf MC dalında. Faz, "anahtar" ve 2 kanca (fearImmunityPierce, nightmareSleep) sistem/kanca |
| B2 | Dağ Ezen Tarvok (2. ana boss) | Taş Golyatı · Huge (öfkede) · 7 | yok | yok (zırhsız 10 + 2 + 5 = 17, koşum +3 → 20) | yok (≈239: Barbarian 14 d12, Fighter 6 d10, CON +5; Tough ile ≈279) | 30? | Darkvision 120 (Taş Rünü) | Öfkede psişik dışı her şeye direnç; fiziksel −4; psişik zayıflık | Dikilitaş (2d8 + 3 + 1d8, 10 ft erişim, fırlatma), Action Surge, Mighty Impel (oyuncu fırlatma 30 ft), Bulut Rünü (kritik saptırma) · efsanevi yok | 2 (≤%50: sütun devirme, 4 darbe) | Psişik hasar ya da başarısız INT save'i: 1 tur tepki yok, dirençler düşer | **Kısmen.** Boyut (Huge 7) ve direnç sığar. "Psişik alınca dirençleri düş" kanca. Mighty Impel = zorla hareket + çarpma (K53) var. Feat'ler SRD dışı (bölüm 5) |
| B3 | Kaltakkıran (3. ana boss) | Celestial (Kırık Kanat) · Medium · 1 | yok | 20 (zırh 10/10), Shield 25 | yok (≈191: Paladin 11 d10, Warlock 5 d8, Sorcerer 4 d6, CON +4) | 30, uçuş 30 (1/UD, 1 dk) | Darkvision | 10/10 zırh: 10 enerji türü + B/P/S bağışıklığı; ışıltı/nekrotik direnç | Çeneli Zincir Kılıcı, +21 sabit hasar, 19–20 kritik, Smite yığını · efsanevi yok | "İhanet Çatlağı" turları | Ejderha çanı ya da üstün varlık; Prone/Shove/Intimidation ile duruşu kırma → bağışıklıklar düşer | **Hayır.** Bütün türlere bağışık bir boss ancak "duruş kırılma" sistemiyle yenilebilir (sistem gerekir). Düz stat bloğu + ev kuralı |
| B4 | Kıta Ejderhası I | Dragon · Gargantuan · 19 (4×4) | 31 | 25 | 740 (37d20 + 370) | 50, uçuş 100, yüzme 50 | Blindsight 60, Darkvision 120, PP 26 | Kuvvet, gök gürültüsü, büyüsüz fiziksel; Frightened, Paralyzed, Petrified, Unconscious; direnç ateş, soğuk, yıldırım, nekrotik | Multiattack (korku + Bite + 2 Claw), Continent Roar Breath (120 × 20 ft çizgi, Recharge 5–6) · LR 4/gün · LA 3 (Tail, Kanat Fırtınası, Mühür Çekimi) | İlk 2 tur "Mahmurluk" (uçuş yarı, INT dezavantajı); On Taş → II'ye evrim | Savaşılabilir; Yol A'da evrim | **Büyük ölçüde.** Boyut 19 sınırında. Efsanevi tür eşleşmesi kısmi (bölüm 3.8). Mahmurluk = süreli etki. Kaltakkıran zırhı kancası ve evrim sistem |
| B5 | Kıta Ejderhası II | Dragon (Apex Mythic) · ? · 37 (özet "5×5+", ayrıntı "7×7") | 40 | 30 | 1.850 (60d20 + 1.220) | 80, uçuş 200 (Hover), yüzme 100, kazma 80 | Truesight 300, Tremorsense 1 mil, PP 33 | 10 enerji türü + büyüsüz fiziksel; 13 durum | Multiattack 4 saldırı (6d12 + 13 + 6d10 + 6d10…), Zettaflare (300 × 30 ft), çift inisiyatif, büyü yansıtma · LR 6 · LA 5 | — | NG koruyucu; "yenilecek düşman değil" | **Hayır.** 37 altıgen > 19 tavanı; çift inisiyatif, "her direnci ve bağışıklığı yok sayar", 300 ft alan (en büyük harita 48 × 5 = 240 ft) motorda yok. Öneri: sahne/müttefik varlığı, sim dışı (bölüm 3.7) |
| B6 | Kozmik Anka Kuşu | Celestial/Elemental · "Dev" ama 3×3 = 7 (Huge) | 32 | 26 | 780 (36d20 + 396) + 2. faz 450 (yumurta AC 22, 150 HP) | 40, uçuş 150 (Hover) | Truesight 120, PP 29 | Ateş, ışıltı, nekrotik, psişik; 11 durum | Multiattack (Beak + 2 Talons, Yıldız Alevi), Celestial Glide (120 ft koridor + 3 tur yüzey) · LR 4 · LA 3 | 0 HP'de Süpernova → yumurta → 450 HP ile dirilir | Müttefik (Avcı'nın ruh yoldaşı, CG) | **Kısmen.** Boyut sığar (Huge). "Ateş + ışıltı, dirençleri yok sayar" `buyuluVurus`/tür değişimi ile kısmen. Avcı'ya hasar paylaşımı = `ortakCan`'a yakın. Yeniden doğuş fazı sistem (küçük) |
| B7 | Uçurumun Yıldız-Kâbusu | Aberration (Mythic) · ? · 31 (6×6) | 35 | 26 | 1.150 (46d20 + 667) + 2. faz 550 | 40, yüzme 120, uçuş 60 (Hover) | Truesight 180, telepati 10 mil, PP 29 | Yıldırım, psişik, asit, soğuk, büyüsüz fiziksel; 12 durum; direnç kuvvet, nekrotik, gök gürültüsü | Maddening Gaze, 3 × Eldritch Tentacle (45 ft, en çok 12 yakalama), Cosmic Fling, Void-Lightning, Abyssal Swallow (6 hedef) · LR 5/6 · LA 4 · 60 ft delilik aurası | 0 HP'de 550 HP ile 2. faz (aura 90 ft, 4 dokunaç, merkez çekimi) | Final boss (4. kampanya) | **Kısmen.** 31 altıgen > 19; 12 eşzamanlı yakalama, 6 kişilik mide (`swallow92` tek mide modeli) ve "1d6 ile dosta saldırı" kanca. Siege Monster (×2 nesne hasarı) yok |
| B8 | Mücevher Ejderhası: Kristal (ışıltı) | Dragon · Genç "Large 2×2", Yetişkin "Gargantuan 3×3" | 15 / 25 | 19 / 22 | 240 / 480 | ? | ? | ? | Nefes 60 ft koni DC 19 / 90 ft DC 23; Yetişkinde "Efsanevi 3 puan" (eylemler tanımsız) | Yavru → Genç → Yetişkin (seviye 5–10 / 11–16 / 17–20) | Yoldaş/binek | **Hayır (veri eksik).** Hız, duyu, yetenek puanı, saldırı yok. Nefes DC'si "Taşıyıcının niteliğiyle ölçeklenir" diyor, tablo sabit DC veriyor (çelişki). Büyüme ve tür seçimi sistem |
| B9 | Mücevher Ejderhası: Topaz (nekrotik) | aynı | 16 / 26 | 19 / 23 | 265 / 515 | ? | ? | ? | Nefes DC 20 / 24; iyileşme engeli, maks. HP düşüşü | aynı | Yoldaş/binek | aynı |
| B10 | Mücevher Ejderhası: Zümrüt (psişik) | aynı | 17 / 27 | 20 / 23 | 285 / 545 | ? | ? | ? | Nefes DC 20 INT / 24 INT; −1d6, Stunned | aynı | Yoldaş/binek | aynı |
| B11 | Mücevher Ejderhası: Safir (gök gürültüsü) | aynı | 18 / 28 | 20 / 24 | 310 / 585 | ? | ? | ? | Nefes DC 21 / 25; itme, Prone | aynı | Yoldaş/binek | aynı |
| B12 | Mücevher Ejderhası: Ametist (kuvvet) | aynı | 20 / 30 | 21 / 25 | 340 / 650 | ? | ? | ? | Nefes DC 22 STR / 26; çekme, hız 0, uçuş iptali | aynı | Yoldaş/binek | aynı |
| B13 | Erimiş Örs Muhafızı (Yanık Demirhane) | lav golemi · ? | yok | yok | yok | – | – | Ateş bağışık | Kızgın çekiç, yağ ve kor sıçratma | %50: kenarlar 3 tur alev, tur başı 2d6 ateş dalgası | Sv.3 taş Kor Çekirdeği | **Hayır (stat yok).** Faz 2 = HP eşiğinde harita olayı (kanca) |
| B14 | Tipi Yutan Dev (Donmuş Geçit) | dev · ? | yok | yok | yok | – | – | Soğuk bağışık | Buz mızrağı, su dondurma | %50: harita yarısı buz, görüş 30 ft, buzdakine avantaj | Ayaz Kalbi | aynı (kar/sis `weatherOf` var) |
| B15 | Şimşek Süvarisi (Paratoner Yaylası) | binekli şövalye · ? | yok | yok | yok | – | – | Yıldırım bağışık | Su altıgenlerine elektrik mızrağı | %50: yağmur, rastgele su, tur sonu yıldırım | Fırtına Mili | aynı (binek MB1–MB8 var) |
| B16 | Kör Çan Devi (Yankı Kanyonu) | dev · ? | yok | yok | yok | – | Blindsight | Gürültü bağışık | Titreten adım | %50: tur başı 10 ft DC 15 CON Prone, sütun yıkımı | Çınlama Mührü | aynı |
| B17 | Sülfür Hidrası (Sülfür Bataklığı) | hidra · ? | yok | yok | yok | – | – | Asit bağışık | Çoklu ısırık, AC aşındırma | %50: kalıcı asit yüzeyi, yakın dövüşe 1d8 asit | Erime Damlası | aynı |
| B18 | Spor Hükümdarı (Çürük Orman) | kadim yaratık · ? | yok | yok | yok | – | – | Zehir bağışık | Mantar patlatma, Poisoned çekme | %50: 3 hareketli bulut, ölüleri spor hizmetkârına çevirme | Ağu Özü | aynı |
| B19 | Kırık Hale Şövalyesi (Terk Edilmiş Katedral) | muhafız · ? | yok | yok | yok | – | – | Işıltı bağışık | Körleştirici kalkan, ışın | %50: harita parlak, tur başı 15 ft DC 15 CON Blinded | Kör Güneş Parçası | aynı |
| B20 | Kemik Toplayıcı Lord (Kemik Ovası) | nekromant · ? | yok | yok | yok | – | – | Nekrotik bağışık | noHeal, kara alev | %50: tur başı 2 iskelet (`boneRise` var), iyileşme yarıya | Mezar Küresi | aynı |
| B21 | Ayna Zihin Avcısı (Sisli Akademi) | avcı · ? | yok | yok | yok | – | – | Psişik bağışık | Işınlanma, sahte gölge | %50: psişik sis, 2 kopya (Mirror Image), korku fısıltısı | Vesvese Kristali | aynı |
| B22 | Yörünge Nöbetçisi (Yıkık Gözlemevi) | nöbetçi · ? | yok | yok | yok | – | – | Kuvvet bağışık | İtme/çekme kombosu | %50: düşük yerçekimi (itme +5 ft), 2 turda bir 15 ft çekim | Boşluk Kırığı | aynı |

### 3.2 HP formülü denetimi

d20 ortalaması 10,5'tir. "Yazılan" PDF'teki toplam, "formülle" zar ortalaması + yazılan sabit, "CON ile" zar ortalaması + CON değiştiricisi × zar sayısı.

| Varlık | Yazılan | Formülle | CON ile | Bulgu | Öneri |
|---|---|---|---|---|---|
| Kıta I | 740 (37d20 + 370) | 758 | 758 (CON +10 × 37 = 370 ✓) | Zar ortalaması 10 alınmış | **758** (SRD kuralı: ortalama aşağı yuvarlanır, 758,5 → 758) |
| Kıta II | 1.850 (60d20 + 1.220) | 1.850 | 1.410 (CON +13 × 60 = 780) | Sabit CON'dan gelmiyor; 1.850'ye ulaşmak için ters hesaplanmış | Sahne varlığı ise 1.850 kalabilir; stat bloğu kuralına uymak için 1.410 ya da zar sayısı 60 → 79 (79d20 + 1.027 ≈ 1.856) |
| Anka | 780 (36d20 + 396) | 774 | 738 (CON +10 × 36 = 360) | Hem sabit hem toplam tutarsız | **738** ya da CON +11 (CON 32–33) ile 774; 2. faz 450 ayrı |
| Yıldız-Kâbusu | 1.150 (46d20 + 667) | 1.150 | 943 (CON +10 × 46 = 460) | Sabit CON'dan gelmiyor | **943** ya da 56d20 + 560 = 1.148 (zar sayısını artır) |
| Mücevher ejderhaları | yalnız toplam | – | – | Zar formülü ve CON yok | Aşama 2'de stat bloğuyla birlikte yazılır |

### 3.3 Altıgen kaplama ve `multiHex`

Motor (`src/rules/footprint.ts`): Large 3, Huge 7, Gargantuan 19 altıgen (çapa + 2 halka). Tavan 19. `multiHex` deneysel ve varsayılan kapalı. 15×7 haritada Gargantuan reddedilir (`gargantuanTooBig`).

- **Kıta II 37, Yıldız-Kâbusu 31**: tavanı aşar. 37 = 3 halka (çapa + 6 + 12 + 18). Motorun halka dizisine uyar, yeni bir boyut kademesi demektir ("Colossal" benzeri, SRD dışı). Etkileri: `CreatureSize` tipi, `footprint.ts`, `bodyOf`, gövde sığması (K69), dikey bant (`cells.ts` boy düzeyi: G = 4), YZ alan sayımı, Game Master seçici. **Yeni mekanik** sayılır (kural sürümü). 31 bir halka sayısına denk gelmez: ya 37'ye yuvarlanır ya 19'da kalır.
- **Kıta II çelişkisi**: özette "5×5+", ayrıntıda "7×7", ikisi de "37 altıgen" diyor. 37 = 3 halka, kare ızgara dili altıgende anlamsız; "7×7" yalnız çapı (7 altıgen) anlatıyorsa tutarlı.
- **Mücevher Ejderhası**: "Genç Large 2×2", "Yetişkin Gargantuan 3×3". Motorda Large = 3, Huge = 7 ("3×3" çapında), Gargantuan = 19. Yetişkin ya **Huge (7)** ya **Gargantuan (19)** olmalı. "Dev"/"Büyük" Türkçe boyut adları da Anka'da ("Dev Celestial 3×3 (7)") aynı karışıklığı yapıyor.
- **Tarvok "3×3 (Huge)"**: motorla tutarlı (7 altıgen). "Öfkede Huge olur" boyut değişimi `boyut`/`size` etkisiyle var.

### 3.4 Uçuş yüksekliği

PDF'teki 100–200 ft değerleri **uçuş hızı**dır, irtifa değil. Açık gökte irtifa üst sınırı `data/dikey.json` `ucusUstFt` = 60 ft (harita varyantı 5–120 ft arası ezer), tavanlı haritada tavan − boy. Gargantuan boyu 4 düzey (20 ft): açık gökte en çok 40 ft yükselebilir.

Etkilenen metinler:

- Kıta I "Kanat Fırtınası … + 50 ft uçuş" ve Anka "Köz Kanat … 50 ft uçuş": hareket olarak çalışır, irtifa olarak 60 ft'te kırpılır.
- Kıta II "gökyüzünden 60 ft yarıçaplı dikey sütun" ve "Tektonik Kayma ±30 ft" yükseklik değişimi: motorda yok (yükseklik katmanı savaş içinde değişmez).
- Altın Yargı Sütunu "40 ft yükseklik" (Sv.3 taş): `airArea` silindiri 60 ft altında, sığar.

Öneri: boss haritalarında varyant `ucusUstFt: 120`; hız değerleri olduğu gibi kalır.

### 3.5 Çoklu sınıf bossları

- MC motoru `origin/claude/beautiful-davinci-ahi7yn` dalında (MC1 veri modeli, en çok 3 sınıf, karakter kayıt sürümü 4; MC2 türetme: can, kurtarma, eğitim, AC, büyü yuvası). Bu dala birleşmedi, savaş tarafı (sınıf başına özellik, Pact + Spellcasting yuvası birlikte) doğrulanmadı.
- Düşman tarafında karakter sayfasıyla savaşçı kurma yolu yok: `combatantFromSheet` yalnız parti için çağrılıyor (`app/setup.ts`, `app/journeyBattle.ts`).
- Alt sınıflar yerel pakette var (`icerik/ek-wizard.json` Aldatma, `ek-sorcerer.json` Ceren Ürperten ve İlahi Kan, `ek-warlock.json` Hortlak ve Kargışçı, `ek-barbarian.json` Heybet Yolu, `ek-fighter.json` Pehlivan, `ek-paladin.json` Asi). Paket depo dışı; APK'da yok (AS2 ürün sorunu).

**Karar K4 (2026-11-26):** üç ana boss ne karakter ne boss stat bloğu olarak şimdi girmez; multiclass işi bittikten sonra ayrıca kurulur. İmza eşyaları B–D'de katalog eşyası olarak girer. Aşağıdaki öneri arşivdir.

**Öneri (arşiv):** üç ana boss **düz canavar stat bloğu** olarak girer. AC/HP, saldırılar, büyüler (`canavar-buyuleri.json`), tepkiler (`monster-reactions.json`), yetenekler (`canavar-yetenekleri.json`) ve efsanevi eylemler (`efsanevi.json`) veriden gelir. Çoklu sınıf yapısı yalnız Dungeondex anlatımı olur. MC birleşip "düşman karakter sayfası" yolu yazılırsa yeniden değerlendirilir.

Kaba can hesabı (≈145 / ≈239 / ≈191) bu kadim yaratıkların (740–1.850) çok altında; PDF bunu bağışıklık ve fazlarla telafi ediyor. CR verilmediği için denge simi zorunlu.

### 3.6 Fazlar

Motorda faz sistemi yok. Benzetilebilenler:

- %50 can eşiğinde arena değişimi (Mora, Tarvok, 10 bölge bossu): A2'de canavar eklerinde "HP eşiği" var (`ridersA2.ts`). Harita kuralı tetikleme (alev kenar, buz, yağmur, iskelet `boneRise`, sis) `ruleOf` + Game Master anahtarlarıyla kurulabilir. Eksik olan "can eşiği → harita olayı" bağı: **küçük kanca** (`boss.ts`'e `fazEsigi`).
- 0 HP'de ikinci can havuzu (Anka +450, Yıldız-Kâbusu +550): `undeadFortitude` ve paket `olumdenDon` benzer ama yeni HP ve stat değişimi yapmaz. `shape_changed` (Polymorph/Wild Shape) biçim canı modeli tersine kullanılabilir. **Sistem gerekir (küçük)**: "0 HP'de ikinci stat bloğuna geçiş", olay + reducer, kural sürümü.
- "İlk 2 tur Mahmurluk": süren etki (`untilRound`) ile çalışır.
- Legendary Resistance, efsanevi eylemler ve in olayları (`lairEruption`) fazın yerini tutmaz, yalnız tur dışı eylem verir.

Öneri: fazlar **sistem gerekir**; Aşama 2'de tek ortak kanca (eşik → olay listesi) olarak tasarlanır.

### 3.7 Kıta Ejderhası II

PDF açıkça "artık yenilecek bir düşman değil, kıtanın ve masumların mutlak koruyucusudur" diyor. Neutral Good, Yol A finalinin ürünü. Değerleri (CR 40, AC 30, dirençleri yok sayan hasar, çift inisiyatif, 300 ft dost-korur nefes) dengelenemez ve motora sığmaz.

**Öneri:** savaş boss'u değil; Serüven sahne varlığı ve isteğe bağlı müttefik. Sim ve denge kapsamı dışı. Stat bloğu Dungeondex'te bilgi olarak durur ("savaşta kullanılmaz" etiketi, `offCombat` benzeri). Savaşta kullanılacaksa 19 altıgen Gargantuan, LR 6, LA 5, tek inisiyatif ve "direnci yok say" yerine `buyuluVurus` ile sadeleştirilmiş bir sürüm ayrıca tasarlanmalı (karar K5).

### 3.8 Boss dosyası ve efsanevi eylem eşleşmesi

- **Dosya**: `data/monsters.json` 330'a sabit (`src/data/data.test.ts:162`, `src/data/srdCanavar.test.ts:26`). Öneri: `data/katalog-bosslar.json` (aynı `Monster` şeması + `kaynak: "katalog-1"`), tembel `loadKatalogBosses()`. `monsters` dizisine eklenmez; `getMonster` önce `monsters`'a, sonra boss dizisine bakar (test sayıları korunur). Game Master seçicide "Kadim/Boss" grubu, varsayılan gizli (Serüven açar; `gizli: true` harita deseni). Jetonlar `public/monsters/<id>.webp` (yoksa yedek).
- **Efsanevi türler** (`data/efsanevi.json`, `boss.ts`): `strike`, `rays`, `command`, `save`, `spell`, `teleport`, `drain`, `quake`, `buff`.

| Boss eylemi | Tür eşleşmesi | Eksik |
|---|---|---|
| Kıta I Tail (1) | `strike` | 20 ft itme (strike'ta itme yok) |
| Kıta I Kanat Fırtınası (2) | `save` (alan) | Prone + 50 ft yükselme |
| Kıta I Mühür Çekimi (2) | `save` | 30 ft çekme; "taş taşıyan hedef" seçimi (sistem) |
| Kıta II Tektonik Kayma (1) | `quake` | ±30 ft arazi yüksekliği değişimi |
| Kıta II Yıldırım Mızrağı Yağmuru (2) | `rays` | saldırı yerine DEX save'li 4 nokta |
| Kıta II On Mühür Patlaması (3) | `save` | Dispel + dostlara 100 HP |
| Anka Köz Kanat Çırpışı (1) | `save` | yüzey silme + uçuş |
| Anka Mühür Eriten Pençe (2) | `strike` | 0 HP kurtuluşunu 1 tur mühürleme |
| Anka Yıldız Gözyaşı (2) | `buff` | dost iyileştirme + durum temizleme |
| Yıldız-Kâbusu Eldritch Storm Bolt (1) | `save` | – (tek hedef; çalışır) |
| Yıldız-Kâbusu Abyssal Toxic Ink (2) | `save` | bulut alanı + Blinded/Poisoned/Silenced + hareket |
| Yıldız-Kâbusu Rüya Çağrısı (2) | `command` (approach) | silah düşürme (Command "drop" var, ikisi birlikte yok) |
| Mücevher Yetişkin "3 puan" | – | eylemler tanımsız |
| Mora, Tarvok, Kaltakkıran | – | efsanevi eylem yok (yalnız LR öneri: K6) |

### 3.9 Boss ganimeti (19 parça)

| Kaynak | id önerisi | TR ad | EN-AD | Yuva | Nad. | Uyum | Özet | Durum | Kanca / not |
|---|---|---|---|---|---|---|---|---|---|
| Mora | `abandoned-phylactery-pendulum` | Kara Malek'in Terk Edilmiş Filakteri Sarkacı | Abandoned Phylactery Pendulum | silah/odak (quarterstaff) | E | evet (Wizard/Sorcerer/Warlock) | +3 büyü, +2 DC (korkmuşa +3), 1d6 + 3 + 2d6 psişik + 10 ft itme, 60 ft korku dot, 6 yük | kanca | fearImmunityPierce, kâbus uykusu (psişikle uyanmayan Unconscious), koşullu DC, sınıf önkoşulu, "Uykusuzluk" dinlenme cezası |
| Mora | `robe-of-the-blindspot` | Kör Nokta Cübbesi | Robe of the Blindspot | cübbe | E | evet (büyücü) | AC 15 + DEX, psişik direnç, Charmed/Frightened bağışık, konsantrasyon +3, ≥30 ft saldırıya dezavantaj, Gölge Kayması, Zihin Perdesi | kanca | mesafeye bağlı dezavantaj, patlayan suret, set sinerjisi; "AC 15 + DEX" cübbe tabanı (Mage Armor benzeri `acBase`) |
| Tarvok | `mountain-crushers-chained-monolith` | Dağ Ezen'in Zincirli Dikilitaşı | Mountain-Crusher's Chained Monolith | silah | E | evet | 2d8 + 3 ezici + 1d8 gürültü, Heavy/2H/Reach/Thrown (döner), Topple/Push seçimi, 2/UD 15 ft savurma ya da 30 ft zincir | kanca | SRD karşılığı yok (2d8, Reach + Thrown); ustalık seçimi; STR 19 şartı |
| Tarvok | `champions-crag-harness` | Şampiyonun Kaya Koşumu | Champion's Crag Harness | zırhsız koşum | E | evet | +3 zırhsız AC, B/P/S −4, öfkede psişik dışı direnç, itme/Prone bağışık, meydan okuma | kanca | düz hasar azaltma, stoneEnduranceReflect, collisionBonusDamage, öfke koşulu (`ofke` var) |
| Kaltakkıran | `kaltakkirans-paladin-armor` | Kaltakkıran'ın Paladin Zırhı | Kaltakkıran's Paladin Armor | ağır zırh (Plate) | Yadigâr | 1→3 yuva | AC 18/19/20 taşa göre, B/P/S direnç/bağışıklık, Hükümdar Vuruşu | sistem | kalıcı kaynaşma, değişken uyum yuvası, Kararma Sayacı, İhanet; "Serüven'de" anlatımı |
| Kaltakkıran | `kaltakkirans-maw-chain-greatsword` | Kaltakkıran'ın Çeneli Zincir Kılıcı | Kaltakkiran's Maw-Chain Greatsword | silah | E | zırha kilitli | 3 fiziksel tür + adaptif, 5/15 ft çift form, sarmal | sistem | chainFormTether, adaptiveWeaknessResolver, zırh bağı, final akıbeti |
| Kaltakkıran | `cracked-elemental-stone` (10 varyant) | Çatlak Element Taşı (Sv.1) | Cracked Elemental Stone | zırh soketi | SD | hayır | seçili türden her hasar −3 | sistem | soket + düz azaltma; bağımsız tılsım modu önerisi: K3 |
| Kaltakkıran | `awakened-elemental-stone` (10 varyant) | Uyanmış Element Taşı (Sv.2) | Awakened Elemental Stone | zırh soketi | N | hayır | türe direnç + turda 1 silaha +1d4 | sistem | soket; bağımsız modda **çalışır** (direnç + paket `ekHasar`) |
| Kaltakkıran | `ember-core` | Kor Çekirdeği (ateş) | Ember Core | Sv.3 taş | E | zırh | ateş + Burning bağışık; 1/UD 15 ft 5d6 + itme + alev | sistem | yalnız Paladin Zırhı'na; tek başına çalışan kısmı: bağışıklık + Savaş Sanatı (paket `hasar` alan + `yuzeyOlustur`) |
| Kaltakkıran | `frost-heart` | Ayaz Kalbi (soğuk) | Frost Heart | Sv.3 taş | E | zırh | soğuk bağışık, iceWalker; 20 ft koni Restrained + buz | sistem | aynı |
| Kaltakkıran | `storm-spire` | Fırtına Mili (yıldırım) | Storm Spire | Sv.3 taş | E | zırh | yıldırım bağışık; 60 ft / 10 ft 6d6 + tepki yok | sistem | aynı |
| Kaltakkıran | `resonance-seal` | Çınlama Mührü (gürültü) | Resonance Seal | Sv.3 taş | E | zırh | gürültü + Deafened bağışık; 30 ft çizgi itme/Prone | sistem | aynı |
| Kaltakkıran | `dissolution-drop` | Erime Damlası (asit) | Dissolution Drop | Sv.3 taş | E | zırh | asit bağışık; 15 ft 5d6 + AC −3 + asit yüzeyi | sistem | aynı |
| Kaltakkıran | `venom-essence` | Ağu Özü (zehir) | Venom Essence | Sv.3 taş | E | zırh | zehir + Poisoned bağışık; 3 tur bulut (direnç aşar) | sistem | "direnci yok sayar" kanca |
| Kaltakkıran | `blinding-sun-shard` | Kör Güneş Parçası (ışıltı) | Blinding Sun Shard | Sv.3 taş | E | zırh | ışıltı + Blinded bağışık; 10 × 40 ft sütun | sistem | aynı |
| Kaltakkıran | `sepulcher-orb` | Mezar Küresi (nekrotik) | Sepulcher Orb | Sv.3 taş | E | zırh | nekrotik + noHeal bağışık; 25 ft çizgi + maks. HP törpüleme | sistem | aynı |
| Kaltakkıran | `whisper-crystal` | Vesvese Kristali (psişik) | Whisper Crystal | Sv.3 taş | E | zırh | psişik + Charmed/Frightened bağışık; 20 ft INT Stunned + konsantrasyon kırma | sistem | aynı |
| Kaltakkıran | `void-fracture` | Boşluk Kırığı (kuvvet) | Void Fracture | Sv.3 taş | E | zırh | kuvvet bağışık + zorla hareket/ışınlanma bağışık; 30 ft çekme + 6d6 | sistem | aynı |
| Kaltakkıran (Yol A) | `guardian-dragon-sigil` | Koruyucu Ejderha Mührü | Guardian Dragon Sigil | tılsım | E | evet | tüm save +1, Frightened bağışık, UD'de seçilen 2 türe direnç, 1/UD 30 ft koni (dostlara geçici can) | kanca | uzun dinlenmede seçilen direnç (seçim kipi) ve dost-korur koni; geri kalanı çalışır |

Kaltakkıran sistemi (kaynaşma, Kararma Sayacı 0–100, eşik diyalogları, İhanet, iki final yolu, `bondSacrificeLedger`) kullanıcı ilkesine göre **yalnız veri ve anlatım** olarak girer: Dungeondex prospektüsü + Serüven anlatım düğümleri, "Serüven'de" notuyla. Kod yazılmaz.

## 4. NEREYE NASIL EKLENİR (kod okunarak)

### 4.1 Büyülü silah ve zırh = `Item`

Katalog silahı ayrı bir silah kaydı değildir. `data/items.json` biçiminde bir eşyadır ve taşınan sıradan silaha bağlanır.

- **Bağlama**: KARAR104 A10'dan beri (kural sürümü 104, savaşçıda `k104`) eşyanın `bonus.weapon`'ı ve `onHit`'i yalnız **bağlı silahta** işler:
  - eşya türüne uygun silahlar `data/esya-silah-bagi.json` `esyalar` (any / melee / kimlik listesi);
  - seçim karakterde `silahBagi`; yoksa sayfadaki ilk uygun silah (`rules/itemBinding.ts`);
  - `itemParts` bağlı eşyanın bonusunu `boundBonus[silah]`, bağlanmayanınkini `looseBonus` (en yüksek) olarak ayırır.
- **Eski davranış**: 103 ve altında `bonus.weapon` eşyalar arasında en yüksek değer olarak bütün silahlara işler. `onHit.weaponId` yalnız 99+ (TE99) ve tek silah kimliğiyle.
- **Kataloğun "şu silaha +N" parçaları için anlamı**: her katalog silahı (125 + boss silahları) için `esya-silah-bagi.json`'a bir satır gerekir (ör. `"giantbreaker-blade": ["greatsword"]`). Satır yoksa eşya "bağlanmayan" sayılır ve +N'si karakterin **bütün** silahlarına gider. Bu, ikinci silahla açık bir istismar olur (bugün Bracers/Ioun gibi silah olmayanların davranışı).
- **Taşıma**: oyuncunun hem büyülü eşyayı hem de taban silahı (ör. Greatsword) taşıması gerekir. Taban silah yoksa eşya hiçbir silaha bağlanmaz, bonus işlemez. Öneri: oluşturucu katalog silahını seçince taban silahı kendiliğinden eklesin (O3).
- **Zar ve özellikler taban silahtan gelir** (bölüm 2.6 madde 4).
- **Tek `onHit`**: eşya başına bir ek hasar. İkinci ek hasar ve koşullu ekler paket `ekHasar` ile (paket ilkelleri eşyada çalışır, `itemBag`). Paket yolu `bonus`/`onHit` bağından bağımsız işler, yani "yalnız bu silahla" denetimi paket ekHasar'da yok. Kanca: paket ilkelinde `silah: "bagli"` koşulu (O2).

### 4.2 `Item.srd` zorunlu → tip ve görünüm düzeltmesi

`srd: string` zorunlu. `.srd` değerine doğrudan dokunan yerler (srd'siz kayıt bunları çökertir):

- `src/dungeondex/catalog.ts:155` (`i.srd.startsWith`)
- `src/dungeondex/prospektus/esya.ts:45, 54, 55`
- `src/rules/itemCategory.ts:16` (`it.srd.split`)
- `scripts/esya-ikon.mjs:88`, `scripts/esya-ikon-rapor.ts:24–39`, `scripts/en-aciklama-uret.mjs:75–93`, `scripts/lib/gorsel-envanter.ts:169–174`
- `src/dungeondex/gorselEsleme.test.ts:87`: nadirlik rengi = `srd.startsWith('magic-items')`

Öneri (O1):

- `srd?: string` + `kaynak?: 'katalog-1'` + `ozgun?: true`. Özgün geçmiş deseni: `backgrounds.json` `ozgun`, srd yok.
- Tek yardımcı `isMagicItem(i)` = `i.srd?.startsWith('magic-items') || i.kaynak === 'katalog-1'`; yukarıdaki bütün çağrılar buna geçer.
- `itemCategory.ts` `srdOf` srd yoksa `undefined` döner; tür ve nadirlik açık alanlardan gelir (4.3).
- `srdIds.test.ts` genişletmesi: yeni `it('katalog-1 özgün eşyalar …')` (geçmişler testinin `ozgun` kolu gibi):
  - id kebab-case;
  - bütün eşya ve silah kimlikleri arasında tekil;
  - `srd` tanımsız, `kaynak === 'katalog-1'`;
  - `name` (EN-AD) bütün eşya adları arasında tekil (eşyalar adla bağlanır: `itemNames`, `items.find(i => i.name === n)`);
  - `spells[].name` SRD büyüsüne çözülüyor;
  - `nadirlik` ve `yuva` geçerli enum.
- Mevcut `eşyalar` testi (`idProblems(itemsData)`) yalnız `data/items.json`'u tarıyor; katalog ayrı dosyada olacağı için ona dokunulmaz.

### 4.3 Nadirlik alanı

`Item`'da nadirlik yok; `itemTier` SRD kaydından türetiyor (`data/esya-kategori.json` `srd`). Öneri: `nadirlik?: 'olagandisi' | 'nadir' | 'cokNadir' | 'efsanevi' | 'yadigar'` (`ItemTier` + `yadigar`) ve `tur?: ItemKind`. `itemTier`/`itemKind` önce bu alanlara bakar. Dungeondex nadirlik rengi (`dungeondex-gorsel-esleme.json` `nadirlikRenkleri`) ve test buna göre.

### 4.4 Uyum sınırı

- **Bugün**: `MAX_ATTUNED = 3` (`rules/stats.ts:142`). `activeItemNames` listedeki ilk 3 uyumlu eşyayı etkin sayar, oluşturucu dördüncüyü kilitler (`Equipment.tsx`, `builder.ts:411`).
- **Yok**: yüzük ≤ 2, tılsım ≤ 1 alt sınırı; sınıf/büyücü önkoşulu ("Uyum gerekli (Büyücü)"); değişken uyum maliyeti (Kaltakkıran 1→3).
- **SRD 5.2.1**: yüzük ve tılsım sınırı vermez. "Multiple Items of the Same Kind" (s. 102–103) yalnız bir ayakkabı, bir eldiven/gauntlet, bir bracer, bir zırh, bir başlık, bir pelerin der.
- **Sınıflama**: yuva sınırları **oluşturucu kuralı** (O5, savaş kodu değil, kanca değil). Büyücü önkoşulu O4 (oluşturucu + `activeItemNames` eleme). Değişken uyum maliyeti sistem (Kaltakkıran).

### 4.5 Giyilebilir yuvalar

Karakter modelinde yuva yok: `itemNames: string[]` düz liste. "Aksesuar" kategorisi yalnız görünüm (`esya-kategori.json` `aksesuarSozcukleri`). Öneri:

- `Item.yuva?: 'baslik' | 'pelerin' | 'eldiven' | 'bot' | 'yuzuk' | 'tilsim' | 'cubbe' | 'zirh' | 'kalkan' | 'silah' | 'tuketilebilir' | 'tas'`.
- Oluşturucu "yuva başına 1 (yüzük 2)" denetimi `characterIssues` içinde; sorun metni `issues` (TR/EN).
- Karakter kaydı değişmez (yuva eşyadan okunur). Eski kayıtta çift başlık "sorun" olarak görünür, savaş etkisi `activeItemNames` gibi ilk geçerliyle sınırlanır.
- Kural sürümü gerekmez, çünkü yalnız seçim kısıtıdır.

### 4.6 Zırh ve kalkan

- **Zırh tabanı**: `data/armor.json` (SRD 13 zırh). Katalog zırhının kendi AC'si SRD zırh + `bonus.armor` olarak yazılır (tablodaki "Taban"). Ama `bonus.armor`/`effects.armorAcBonus` **giyilen herhangi bir zırha** eklenir (`stats.ts:313`). Hafif zırh eşyası plate giyene +2 verir. Gerekli: zırh eşyası ↔ giyilen zırh bağı (O3b; `esya-silah-bagi.json` deseninde `zirh` satırları), yoksa istismar.
- **Gizlilik**: "Gizlilik: Normal" orta/ağır parçalar için `passive.noStealthDis` var (çalışır).
- **"STR şartı yok", "eğitimsiz giyme muafiyeti"** (Hellforge): kanca. `armorProficient` paket `yetkinlik` ile genişleyebilir, ama eşyadan zırh eğitimi yolu yok.
- **Orta zırhta tam DEX**: `stats.ts:302` sabit `Math.min(dex, 2)` → kanca (`uncappedDex`).
- **Kalkan tak/çıkar**: KARAR101 `shield_toggle` (Utilize) `shieldAc` = kalkan + eşyaların `shieldAcBonus`'u. Katalog kalkanı `shieldAcBonus` ile uyumlu.
- **Eğitimsiz kalkan**: AC katkısı yok (`armorProficient(…'shield')`); katalogdaki "eğitimsiz +2 alamaz" ile aynı.
- **Kalkanla saldırma** (Delici Şövalye Kalkanı): kanca.
- **Cübbeler** ("Ek AC +N", zırhsız):
  - `effects.unarmoredAcBonus` zırhsız **ve kalkansız** ister (Bracers of Defense);
  - TE99 `acExtra` her koşulda ekler;
  - katalog "zırhla birlikte giyilemez" der, kalkanı yasaklamaz → `acExtra` + zırh giyiliyse etkisiz koşulu (`zirhsiz` paket koşulu var; `zarEtkisi` AC + `kosul: ["zirhsiz"]` ile çalışır).
  - Mage Armor (`acBase`) ve Unarmored Defense ile birikir (SRD'de Bracers da birikir); "AC 15 + DEX" Kör Nokta Cübbesi ise taban AC'dir ve Mage Armor ile birikmemeli (`acBase` en yüksek seçilir).

### 4.7 Tüketilebilirler

`use` türleri (`types.ts` `ItemUse`), komut `use_item` (bonus eylem, kendine ya da 5 ft dosta), olay `item_used` (adet azalır), envanter savaşçıda `consumables`:

- **Bombalar (E1)**: `throw` (Attack eyleminde bir saldırının yerine, DEX/STR/CON save, hasar, `grants` durum, `radiusFt`, `burning`). Yüzey oluşturma, itme/çekme, süreli durum turları, kanama, Haste bulutu yok → şema genişlemesi (O7). Menzil 30 ft ve "dost da save atar" çalışır.
- **Kaplamalar (E3)**: `coat` yalnız `dice` + `damageType` + `rounds` (Basic Poison). Save'li durum, konsantrasyon dezavantajı, direnç bastırma yok → O7. Keskin Nişan Yağı (+2 saldırı) `effect` + `weaponPlus` ile yaklaşık (weaponPlus hasara da ekler).
- **İksirler (E4)**: `effect` (`tempHp`, süren etki alanları) çalışır. "Geçici can sürdükçe" koşulu kanca. Melek Uykusu (savaş içi kısa dinlenme) kanca.
- **Eliksirler (E5)**: "UD'ye dek" + "aynı anda 1" yok → O8. Savaşlar arası süren eşya etkisi `CharacterStatus`'a yazılmalı; kural sürümü gerekmez, kayıt alanı gerekir.
- **Özel oklar (E2)**: sistem (bölüm 2.6 madde 5).
- **Çay (E6)**: `effect` + `extraBonus` + `speedFt` çalışır.

### 4.8 Tembel yükleme ve paket sınırı

- `data/items.json` ana parçada statik içe aktarılıyor (`src/data/index.ts:5`). `data/items-srd.json` (120 kB) `loadClassData` içinde tembel gelip `items` dizisine itiliyor (`index.ts:114–130`).
- Katalog (330 + 19 eşya, ≈ 600–800 bayt/eşya → ≈ 250 kB) **aynı yoldan** gelmeli: `data/items-katalog.json` + `loadClassData`'da `items.push(...)`. Bosslar ayrı `loadKatalogBosses()`.
- Ana parçaya etkisi ≈ 0 (yalnız yardımcı kod ve `isMagicItem`). Bugünkü ölçüm ≈453–457 kB / 500 kB sınırı (`data/paket-siniri.json`, CLAUDE.md 2026-11-22).
- TR/EN açıklamalar `data/aciklamalar-tr.json` / `aciklamalar-en.json` zaten tembel; 349 satır eklenince büyürler, ana parçayı etkilemezler.

### 4.9 Dungeondex, ikon, açıklama

- **Görünürlük**: Dungeondex eşya listesi `items` dizisinden (`catalog.ts:157`); tembel katalog yüklenince kendiliğinden görünür. O1 düzeltmesi şart, yoksa liste çöker.
- **İkon**: `npm run esya-ikon` ham sayfa ister (`assets-ham/esya/*.jpg`, `data/esya-ikon-sayfalar.json`). Katalog için ham görsel yok. Yedek tür ikonu var (`dungeondex-gorsel-esleme.json` `yedekler`, `scripts/lib/gorsel-envanter.ts` "ikon yok (tür yedeği)"). İkonsuz eşya bozulmaz. 349 ikon ayrı bir görsel üretim işi (GY-katalog), Aşama 2'yi beklemez.
- **Glif**: `itemGlyphs` uyum, hasar türü gibi alanlardan otomatik; ek iş yok.
- **TR açıklama**: kimlik = katalog id, `aciklamalar-tr.json` `esya`. Kaynak PDF'in "Ne işe yarar" + "Nasıl kullanılır" metni, Dungeondex üslubunda kısaltılarak. 349 kayıt, ≈ 60–120 sözcük. Test `src/data/aciklamalarTr.test.ts` kimliğin var olmasını ister.
- **EN açıklama**: `aciklamalar-en.json`; SRD metni olmadığından elle çeviri (`scripts/en-aciklama/ceviri.json` yolu). 349 kayıt, ≈ 30 bin sözcük. Yoksa "Description available in Turkish only" notu çıkar (bozulmaz).
- **EN-AD**: eşya `name` alanı İngilizce (SD4 kuralı); TR ad Dungeondex başlığında açıklamayla birlikte.

### 4.10 Ortak kod değişiklikleri (Aşama 2 önkoşulları)

| Kod | Değişiklik | Gerekli olduğu parça | Kural sürümü |
|---|---|---|---|
| O1 | `Item.srd` isteğe bağlı + `kaynak`/`ozgun`, `isMagicItem`, srdIds/gorselEsleme testleri | hepsi | hayır |
| O2 | `nadirlik`, `tur`, `yuva` alanları; `itemTier`/`itemKind` önce bunlar | hepsi | hayır |
| O3 | `esya-silah-bagi.json` satırları; oluşturucu taban silahı ekler; O3b zırh eşyası ↔ zırh bağı | A, B | O3b evet (AC değişir) |
| O4 | uyum önkoşulu (sınıf / Spellcasting / Pact Magic / Wild Shape / Channel Divinity) | 25 + 4 boss ganimeti | hayır (oluşturucu) |
| O5 | yuva başına sınır (SRD s. 102–103 + yüzük 2 / tılsım 1 ev kuralı) | C, D | hayır |
| O6 | paket kaynağında kısmi yenilenme (`yenilenme: "1d3"`) | yük taşıyan 142 parçanın "UD 1dN" olanları | hayır (dinlenme, savaş dışı) |
| O7 | `use.throw`/`use.coat` şema genişlemesi (yüzey, itme/çekme, save'li durum, süre) | E1, E3 | evet |
| O8 | savaşlar arası süren eşya etkisi + "tek eliksir" | E5 | hayır (kayıt alanı) |
| O9 | `KOSULLAR` + tetik genişlemesi (bölüm 2.6 madde 2–3) | ≈ 70 parça | evet |
| O10 | kalıcı düz hasar azaltma | 17 parça + koşum | evet |
| O11 | taban silah ezmesi (`silahOzu`) ya da özgün silah kaydı | 21 silah | evet |
| O12 | `loadKatalogBosses`, `getMonster` geri düşüşü, seçici grubu | F | hayır |

## 5. ÇAKIŞMA TARAMASI

**Betikle (kesin):**

- 330 katalog kimliği ↔ mevcut 399 eşya (`items.json` + `items-srd.json`), 38 silah ve SRD sihirli eşya kimlikleri: **çakışma yok**.
- 330 EN-AD ↔ aynı kümelerin adları: **çakışma yok**.
- Katalog içi: TR adlarda, EN adlarda ve kimliklerde **çift yok**.
- SRD sihirli silah adları (Vorpal, Holy Avenger, Sun Blade, Flame Tongue, Frost Brand, Defender, Luck Blade, Oathbow, Dancing, Nine Lives Stealer, Dwarven Thrower, Giant/Dragon Slayer) ve "Dawnbringer": hiçbir EN adda geçmiyor.

**Elle (değerlendirme; Aşama 2'de ad değişikliği listesi olarak onaya gelir):**

1. **BG3 adıyla birebir ya da çok yakın EN adlar** (PDF "telifsiz uyarlama, özel adlar temizlendi" diyor; temizlenmemiş görünenler):
   - YT 6 Caustic Band, YT 7 Callous Glow Ring, YT 13 Strange Conduit Ring (BG3'te aynı adlar, aynı etkiler)
   - S1 40 Titanstring Longbow (BG3 Titanstring Bow; STR'yi hasara ekleme aynı)
   - GY 27 Helldusk Gauntlets (BG3 Helldusk zırh seti)
   - GY 39 Nightwalker Boots (BG3 Disintegrating Night Walkers; Misty Step + kayma/ağ bağışıklığı aynı)
2. **Mekaniği BG3 eşyasıyla birebir, adı benzer** (risk düşük, kontrol önerilir):
   - GY 9 Diadem of Spellstrike ↔ Diadem of Arcane Synergy
   - YT 8 Spellstrike Ring ↔ Ring of Arcane Synergy
   - GY 25 Soulcatcher Gauntlets ↔ Gloves of Soul Catching
   - ZK 39 Walking Bastion Shield ↔ Viconia's Walking Fortress
   - S1 6 Duelist's Signet ↔ Duelist's Prerogative
   - S1 23 Dawnseal Mace ↔ Blood of Lathander
   - YT 2 High Command Ring ↔ Killer's Sweetheart
   - ZK 11 Armor of Fleetness ↔ Armour of Agility
   - ZK 32 Weavewoven Robe ↔ Robe of the Weave
3. **Kadim Yaratıklar metninde korumalı adlar**:
   - "Ancalagon ölçeği", "Thangorodrim Tail" (Tolkien)
   - "Bahamut'un … Zettaflare nefesi", saldırı adı "Zettaflare" (Final Fantasy; Bahamut ayrıca D&D tanrısı, SRD dışı)
   - "Placidusax" (Elden Ring)
   - "Cthulhu" (Lovecraft; kamu malı sayılır ama başlık adı olarak önerilmez)
   - Saldırı ve özellik adları yeniden adlandırılmalı. Simurg ve Kaf Dağı mitolojik, serbest.
4. **Mücevher ejderhası kümesi**: Ametist–kuvvet, Kristal–ışıltı, Zümrüt–psişik, Safir–gök gürültüsü, Topaz–nekrotik eşlemesi, WotC'nin SRD dışı Fizban's Treasury of Dragons'taki gem dragon kümesiyle birebir. Tür adları ya da tür–element eşlemesi değiştirilmeli (karar K7).
5. **SRD dışı D&D adları**:
   - Tarvok "Mighty Impel" (Path of the Giant)
   - Tarvok "Bulut Rünü/Taş Rünü" (Rune Knight)
   - Tarvok feat'leri Great Weapon Master, Sentinel, Tough (SRD 5.2.1 feat listesinde yok: `data/srd/feats.json` 17 feat)
   - Ana bossların alt sınıfları yerel pakette (`wip/alt-sinif-lisans` dalı bu konuyu zaten izliyor)
   - Kaltakkıran'ın "Oathbreaker/Hexblade/Divine Soul" karşılıkları TR adla yazılmış
6. **EN-AD "birebir çeviri" iddiasına uymayanlar**:
   - Tür/istatistik çelişkisi:
     - KY 35 Kızıl İğne **Mızrağı** ↔ Crimson Needle **Rapier** (istatistik rapier)
     - KY 25 Işık Biriktiren Çift **Mızrak** ↔ Luster **Twinblade** (kesici)
     - S2 85 Yakarış **Uzun** Yayı ↔ Banshee's Wail **Shortbow** (istatistik kısa yay)
     - GY 29 Büyülü Hedef **Eldiveni** ↔ Daredevil **Bracers** (SRD'de bracer ayrı yuva)
     - KY 4 Yarık Çökerten Dev **Kılıç** ↔ Riftbreaker Greatsword (istatistik Maul)
   - Anlam farklı: GY 16 Kuzgun Kanadı Pelerini ↔ **Stormwing** Cloak (ayrıca ZK 1 "Kuzgun Kanadı Derisi" ile karışır), GY 27 Alevli Yumruk ↔ Helldusk, YT 7 Işık Çağrısı ↔ Callous Glow, YT 10 Kutsanmış Şifa ↔ Whispering Promise, YT 13 Sıçrayan Akım ↔ Strange Conduit, YT 14 Kül Ezgisi ↔ Elemental Infusion, YT 24 Cerrahi Felç ↔ Subjugation, YT 28 Element Kurbanı ↔ Torment Conduit, GY 9 Kutsama Tacı ↔ Diadem of Spellstrike, KY 40 Dikenli Parmak İzi ↔ Barbed Monolith, S1 2 Yıldız Kesiği ↔ Starcleave (yakın), S1 3 Kızıl Doymaz ↔ Crimson Maw.
7. **Yakın TR adlar** (ayrı ama karışabilir): "Kıvılcım" 14 parçanın TR adında geçiyor (Kıvılcım Kılıcı, Kıvılcım Halkası, Kıvılcım Eldiveni, Kıvılcım Çizmeleri, Kıvılcım Çemberi, Kıvılcım Yeleği…). "Kuzgun Kanadı" iki parçada. "Dalga Zıpkını / Dalga Anası Cübbesi" ile "Tidecaller Trident / Tidecaller Robe": EN'de aynı "Tidecaller" öneki iki ayrı eşyada.

## 6. TUTARLILIK DENETİMİ

**Fiyat bantları** (silah, zırh, giyilebilir, yüzük; tüketilebilir ve taş hariç; 273 parça):

| Nadirlik | Parça | Medyan | En düşük–en yüksek | SRD 5.2.1 değeri (s. 205–206) |
|---|---|---|---|---|
| Sıra Dışı | 53 | 450 GP | 280–650 | 400 GP |
| Nadir | 99 | 1.600 GP | 1.100–2.200 | 4.000 GP |
| Çok Nadir | 87 | 7.400 GP | 6.200–8.500 | 40.000 GP |
| Efsanevi | 34 | 24.000 GP | 18.000–28.000 | 200.000 GP |

- Katalog **kendi içinde tutarlı**: medyanın 0,6–1,5 katı dışında parça yok.
- **SRD 5.2.1 değer tablosunun çok altında** (Nadir ×0,4, Çok Nadir ×0,18, Efsanevi ×0,12). SRD ayrıca taban silah/zırh fiyatının eklenmesini ister; katalog eklemiyor.
- Tüketilebilir medyanları: Sıra Dışı 62, Nadir 180, Çok Nadir 550, Efsanevi 1.600. SRD tüketilebilirde yarı değer verir (200 / 2.000 / 20.000 / 100.000); aynı oranla düşük.
- Oyunun dükkân/yerleşim ekonomisi (`data/yerlesim.json`) hangi ölçeği kullanacaksa ona göre karar (K9).

**Bonus–nadirlik deseni** (silahlar; Nadir +1, Çok Nadir +2, Efsanevi +3 deseninden sapanlar):

| Parça | Nadirlik | Bonus | Not |
|---|---|---|---|
| S1 12 Kan Susuzu | Efsanevi | +2 | yan elde +1 AC, 19–20 kritik ile telafi |
| S1 32 Elementler Asası | Efsanevi | +2 (silah) / +2 DC | asa; büyü bonusu ağırlıklı |
| S1 34 Kırağı Asası | Çok Nadir | +1 | asa |
| S2 75 Başbüyücü Odası Asası | Efsanevi | +2 | asa |
| S2 76 Kor Alev Asası | Çok Nadir | +1 | asa |
| S2 90 Lanetli Çılgınlık Gürzü | **Sıra Dışı** | **+2** | SRD'de +2 Nadir; bedeliyle bile bandın üstünde |

SRD 5.2.1'de Weapon +1 Uncommon, +2 Rare, +3 Very Rare. Kataloğun deseni bir kademe yukarı kaymış: Nadir +1, Efsanevi +3 ek güçlerle. Bu bilinçli bir tercih gibi duruyor.

**SRD güç bütçesini aşan birleşik etkiler** (öne çıkanlar):

- S1 1 Devkıran Pala: +3, Large+'ya 1d8 + Prone, 10 tur Large boy + 15 geçici can.
- S1 6 Düellocu Mührü: +3, 19–20 kritik, meydan okuma, tepki 2d6.
- S1 37 Gök Işığı Uzun Yayı: +3, ışık, +2d6, 3 tur Haste uyuşukluksuz.
- KY 51 Yeşil Bakır Hisar Plakası: AC 20 + fiziksel −3 + itme/Prone bağışıklığı.
- ZK 22 Cehennem Ocağı Plakası: AC 20, STR şartsız, eğitimsiz, tüm hasar −2, Fly.
- GY 1 Gözcü Ejderha Miğferi: +1 AC, tüm save +1, kritik ve Stunned bağışıklığı, tur başı iyileşme.
- YT 3 Riskli Zar Yüzüğü: bütün saldırılarda avantaj (Çok Nadir; bedeli save dezavantajı).
- TK 45 Zümrüt Çay: +1 bonus eylem.
- TK 40 Kana Susamışlık Eliksiri: UD'ye dek, öldürmede Haste eylemi.

Efsanevi SRD silahları (Holy Avenger, Vorpal) +3 + tek imza etkisidir. Katalog Efsanevilerinde 3–4 etki birikiyor. Denge simi (Aşama 2 parça sonunda, 100 tohum) ile ölçülmeli.

**Motorun SRD eşyalarıyla işlev çakışması** (aynı işi yapan SRD eşyası zaten var; ad farklı):

- S1 32 Elementler Asası ↔ Staff of Power/Fire benzeri
- GY 39 Karanlık Adım Çizmeleri ↔ Boots of Striding/Freedom of Movement
- YT 19 Yaşam Kaynağı (CON 21) ↔ Amulet of Health (CON 19)
- S2 57 Dev Özü Sopası (STR 19) ↔ Gauntlets of Ogre Power
- GY 37 Büyülü Çeviklik Eldiveni (DEX 18) ↔ SRD'de DEX sabitleyen eşya yok
- YT 20 Yedek Yuva Kolyesi ↔ Pearl of Power (≤3. seviye) güçlü sürümü
- TK 34–35 iksirler ↔ Potion of Resistance/Invulnerability benzeri

Çakışma sorun değil, ama Dungeondex'te "SRD benzeri" bağlantısı faydalı olur.

## 7. UYGULAMA PLANI (Aşama 2)

Ortak hazırlık **P0** önce gelir; sonra A–E paralel değil sıralı (her biri aynı veri dosyasına ve aynı testlere dokunur). F ve G bağımsız ama P0'ı bekler.

| Parça | İçerik | Önce gereken | Tahmini dosyalar | Doğrulama | Riskler |
|---|---|---|---|---|---|
| **P0** Ortak altyapı | O1, O2, O3 (silah bağı satır şeması), O12 iskeleti, tembel `items-katalog.json` + `loadClassData` | – | `src/data/types.ts`, `src/data/index.ts`, `src/rules/itemCategory.ts`, `src/dungeondex/catalog.ts`, `src/dungeondex/prospektus/esya.ts`, `src/data/srdIds.test.ts`, `src/dungeondex/gorselEsleme.test.ts`, betikler (esya-ikon, en-aciklama-uret, gorsel-envanter), `data/items-katalog.json` (boş), `DECISIONS.md` | typecheck, srdIds, gorselEsleme, catalog testleri, build (paket sınırı) | srd'ye dokunan gözden kaçmış çağrı (grep ile tek tek) |
| **A** Silahlar (125) | 76 çalışır tam; 49 kanca: `calismiyor`/`planli` etiketli özellik | P0; O11 olmadan katana/şişe/sargı "taban silah farkı" planlı kalır | `data/items-katalog.json`, `data/esya-silah-bagi.json`, `data/aciklamalar-tr.json`, (EN) | srdIds, itemBinding testleri, 5 temsilci silahla savaş testi (tek dosya), build | bağ satırı unutulursa +N bütün silahlara; taban silahsız karakter |
| **B** Zırh, cübbe, kalkan (60) | 26 çalışır; 34 kanca (17'si düz hasar azaltma) | P0, O3b (zırh bağı, kural sürümü) | aynı + `stats.ts` (O3b), `data/esya-zirh-bagi.json` | stats/AC testleri, kalkan toggle testi | O3b kural sürümü ister; düz azaltma (O10) yoksa ağır zırhların yarısı yalnız AC verir |
| **C** Giyilebilir (55) | 31 çalışır; 24 kanca (tetik/koşul) | P0, O5 (yuva) | aynı + `builder.ts` `characterIssues`, `strings*.ts` `issues` | oluşturucu testleri, ekran görüntüsü (tek) | yuva kuralı eski kayıtları "sorunlu" gösterir |
| **D** Yüzük, tılsım, mühür taşı (45 + Sv.1/Sv.2 taşı + Mühür) | 26 çalışır; 16 kanca; taşlar bağımsız tılsım; 3 zanaat eklentisi yalnız veri | P0, O5, karar K3 | aynı | srdIds, savaş testi (tılsım modu) | taş modu kararı (K3) |
| **E** Tüketilebilir (45) | 9 çalışır; 24 kanca (O7/O8); 12 ok sistem (yalnız veri + `offCombat` notu) | P0; O7 (kural sürümü), O8 | aynı + `items.ts`, `types.ts` `ItemUse`, `battleSave.ts` (O8 kayıt alanı) | items testleri, savaş testi | O7 kural sürümü; ok sistemi büyük iş |
| **F** Kadim yaratıklar (K4 sonrası kapsam) | Kıta I (758 HP, 19 altıgen), Anka (738 HP, Huge 7), Yıldız-Kâbusu (943 HP, 31 → Gargantuan 19), 5 mücevher ejderhası Genç (Large) + Yetişkin (Huge), eksik stat blokları tasarlanır ve onaya gelir (K13); Kıta II yalnız sahne varlığı kaydı (1.410 HP, 19 altıgen, sim dışı); güçler PDF'teki gibi, karşılığı olmayan `planli`; efsanevi eylem ekleme yok (K6) | P0 (O12); K7 ad listesi onayı; K13 tasarım onayı | `data/katalog-bosslar.json`, `data/efsanevi.json`, `data/canavar-yetenekleri.json`, `data/monster-reactions.json`, `src/data/index.ts`, Game Master seçici, `public/monsters/` | `check:harita`; denge simi yalnız savaşılan yeni yaratıklar için, 100 tohum | PDF'te eksik ya da çelişen stat yerleri: tahmin yok, rapora soru |
| **G** Kaltakkıran anlatım verisi | Kararma Sayacı, kaynaşma, İhanet, iki final yolu, `bondSacrificeLedger`: yalnız veri/anlatım ("Serüven'de"); Kaltakkıran savaşı yalnız anlatım (K14). Zırh, kılıç, On Mühür ve diğer imza eşyalar artık B–D'de katalog eşyası | P0, D | Serüven anlatım verisi, `data/aciklamalar-tr.json` | Dungeondex açılış | kod yazılmaz |
| — Mora, Tarvok, Kaltakkıran karakter kaydı | **ertelendi (K4)**: normal karakter ya da boss stat bloğu değil; multiclass işi bittikten sonra ayrıca kurulur. 10 bölge bossu da F kapsamı dışında | MC birleşmesi | – | – | – |

**Sıra (kullanıcı kararı 2026-11-26):** P0 → A, her parça ayrı commit, her parçadan sonra kısa rapor ve onay bekleme. B–E ve F onaydan sonra. İmza eşyalar (Mora 2, Tarvok 2, Kaltakkıran zırhı, Çeneli Zincir Kılıcı, Sv.1/Sv.2 taşları, On Mühür (Sv.3), Koruyucu Ejderha Mührü) kullanıcı kararıyla B–D'de normal katalog eşyası olarak girer; üç imza silah (Sarkaç, Dikilitaş, Zincir Kılıcı) da A'ya değil B–D'ye. Öneri: zırh/koşum/cübbe ve eşlik eden silah B'de birlikte, taşlar ve Mühür D'de (açık soru S1). Kanca kümeleri (O7, O9, O10, O11) ayrı "KATALOG-2 kanca" görevleri olarak kural sürümüyle gelir; A–E'de karşılığı olmayan özellik metniyle kayıtta kalır ve `planli`/`calismiyor` etiketi alır.

**Doğrulama maliyeti** (hafif mod): her parçada typecheck + srdIds + ilgili test + build + `check:harita` + `check:ses`. Denge ölçümü yalnız F'de (yeni boss, 100 tohum). A–E için tek temsilci savaş testi. Tam `npm test` akşam.

## 8. KARARLAR (kullanıcı, 2026-11-26)

Aşama 1 onaylandı.

**Genel kural**: PDF'teki güçler birebir korunur. Eşya ve yaratık özelliklerinin metni, sayıları (zar, DC, menzil, süre, şarj) ve etkileri PDF'teki gibi veriye girer; sadeleştirme, dengeleme, kırpma ya da "motora uysun" diye değiştirme yok. Motorda karşılığı olmayan güç metniyle kayıtta durur, yalnız `calismiyor`/`planli` etiketi alır. K7 yeniden adlandırması yalnız adı, K2 boyut küçültmesi yalnız boyutu değiştirir. PDF'te belirsiz ya da kendi içinde çelişen yer varsa tahmin yürütülmez, raporda sorulur.

| Karar | Sonuç |
|---|---|
| K1 | HP SRD formülüyle: Kıta I 758, Anka 738, Yıldız-Kâbusu 943, Kıta II 1.410. 2. faz havuzları (Anka +450, Yıldız-Kâbusu +550) PDF'te formülsüz, yazıldığı gibi |
| K2 | Yeni boyut kademesi yok, en çok 19 altıgen. Kadim yaratıklarda boyut küçülür, güçler aynen kalır: Yıldız-Kâbusu ve Kıta II Gargantuan 19; mücevher ejderhası Genç Large, Yetişkin Huge |
| K3 | Mühür taşları yalnız tılsım modu; zanaat eklentileri (YT 43–45) yalnız veri |
| K4 | Mora, Tarvok, Kaltakkıran normal karakter ya da boss stat bloğu değil; güçleri imza silah/zırhlarından gelir. Karakter kayıtları şimdi yapılmaz, multiclass işi bittikten sonra ayrıca kurulur. İmza silah/zırhlar (Kaltakkıran zırhı ve On Mühür dahil) B–D'de normal katalog eşyası; özel güçleri eşya özelliği olarak yazılır, karşılığı olmayanlar `calismiyor`/`planli`, kırpma yok |
| K5 | Kıta Ejderhası II sahne varlığı, sim dışı |
| K6 | Efsanevi direnç/eylem eklenmez |
| K7 | Yeniden adlandırma: BG3'e benzeyen 6 eşya, Kadim Yaratıklar'daki Tolkien/FF/Elden Ring adları; mücevher ejderhası kümesi yeniden tasarlanır. Adları Claude önerir, kullanıcı seçer |
| K8 | Kataloğun +N'i sihirli bonus, kalkanın kendi +2'sine eklenir (bölüm 2.2 "Taban" sütunundaki Shield +N, B parçasında buna göre düzeltilir); belirsiz parçada metne bakılıp karar yazılır |
| K9 | Katalog fiyatları aynen; ekonomi Serüven'e |
| K10 | Yuva kuralı oluşturucuya girmez (O5 düştü) |
| K11 | SRD karşılığı olmayan silahlar en yakın SRD silahına bağlanır, fark "kanca" etiketiyle |
| K12 | Özel oklar ve eliksirler yalnız veri |
| K13 | Eksik stat blokları yalnız kadim yaratıklar için tasarlanır, kullanıcı onaylar; mücevher nefes DC'si tablodaki sabit değer |
| K14 | Kaltakkıran savaşı yalnız anlatım |

**Açık sorular** (parça başlarken sorulacak):

- S1: üç imza silah (Sarkaç, Dikilitaş, Zincir Kılıcı) B–D'nin hangisine girer?
- S2: bölge bossları (B13–B22) F dışında; ne zaman ve hangi görevle?

### 8.1 K7 ad önerileri: BG3'e benzeyen 6 eşya

Yalnız EN-AD değişir, TR ad ve güçler aynı kalır. Öneriler TR adın birebir çevirisidir (kataloğun kendi EN-AD kuralı). Kadim Yaratıklar adları ve mücevher kümesi F başlarken önerilecek.

| Parça | TR ad (değişmez) | Şimdiki EN-AD | Öneri a (önerilen) | Öneri b |
|---|---|---|---|---|
| S1 40 | Dev Kirişli Yay | Titanstring Longbow | Giant-Sinew Longbow | Heavy-Strung Longbow |
| GY 27 | Alevli Yumruk Eldiveni | Helldusk Gauntlets | Blazing Fist Gauntlets | Emberfist Gauntlets |
| GY 39 | Karanlık Adım Çizmeleri | Nightwalker Boots | Darkstep Boots | Boots of the Dark Step |
| YT 6 | Yakıcı Asit Yüzüğü | Caustic Band | Searing Acid Ring | Acidburn Ring |
| YT 7 | Işık Çağrısı Yüzüğü | Callous Glow Ring | Lightcall Ring | Ring of the Calling Light |
| YT 13 | Sıçrayan Akım Yüzüğü | Strange Conduit Ring | Leaping Current Ring | Arcing Current Ring |

Not: "Flaming Fist" (birebir çeviri) Baldur's Gate'in paralı asker örgütünün adı olduğu için önerilmedi. Kimlik (id) yeni EN-AD'dan türetilir (ör. `giant-sinew-longbow`).

### 8.2 Karar öncesi sorular (arşiv)

1. **K1 HP tutarsızlıkları**: Kıta I 740 mı 758 mi; Anka 780 mi 738 mi; Yıldız-Kâbusu 1.150 mi 943 mü (ya da zar sayısı artırılarak 1.150 korunur mu); Kıta II 1.850 mi 1.410 mu? Öneri: SRD kuralıyla hesaplanan değer (758 / 738 / 943 / 1.410), sahne varlığı Kıta II hariç.
2. **K2 Boyut kademesi**: 37 (Kıta II) ve 31 (Yıldız-Kâbusu) altıgen için yeni bir boyut kademesi (3 halka = 37, kural sürümü, `multiHex` kapsamı) yazılsın mı, yoksa ikisi de Gargantuan 19'da mı kalsın? Mücevher Yetişkin Huge (7) mi Gargantuan (19) mu? Genç Large (3) doğru mu?
3. **K3 Mühür taşları (YT 34–42, Sv.1/Sv.2)**: bağımsız tılsım olarak yalnız "tılsım yuvası" etkisi mi, yoksa oyuncu üç moddan birini mi seçer (`featureChoices` benzeri eşya seçimi)? Zanaat eklentileri (YT 43–45) yalnız veri mi, yoksa Kadim Efsun Kalıntısı'nın "Diğer" modu bağımsız eşya mı?
4. **K4 Ana bossların biçimi**: Mora, Tarvok, Kaltakkıran düz canavar stat bloğu mu (öneri), yoksa MC birleşip "düşman karakter sayfası" yolu mu beklenir? AC/HP ve CR'yi kim belirler (PDF'te yok)?
5. **K5 Kıta Ejderhası II**: savaş boss'u mu, sahne/müttefik varlığı mı (öneri: sahne, sim dışı)? Savaşta kullanılacaksa sadeleştirilmiş sürüm tasarlansın mı?
6. **K6 Ana bosslara efsanevi direnç/eylem**: PDF vermiyor; 20. seviye karakter canı (≈145–280) ile 4–6 kişilik partiye karşı fazlar yetmeyebilir. LR/LA eklensin mi?
7. **K7 Korumalı adlar**: BG3 birebir adları (6 parça), Kadim Yaratıklar'daki Tolkien/Final Fantasy/Elden Ring adları ve Fizban's mücevher ejderhası kümesi yeniden adlandırılsın mı? Yeni adları kim verir (öneri: Aşama 2 başında ad listesi onaya)?
8. **K8 Kalkan AC'si**: katalogdaki "AC +2" kalkanın toplamı mı (normal kalkan + 0), yoksa sihirli +2 mi? Efsanevi "+3" = Shield +1 mi, +3 mü?
9. **K9 Fiyat ölçeği**: katalog fiyatları SRD 5.2.1 değer tablosunun (s. 205–206) çok altında; oyunun dükkân ekonomisi hangisini kullanacak?
10. **K10 Yuva kuralı**: SRD'nin "aynı türden tek" kuralı + kataloğun "yüzük 2, tılsım 1" ev kuralı oluşturucuya girsin mi? Kaltakkıran'ın değişken uyum maliyeti (1→3) yalnız anlatım mı?
11. **K11 Taban silah farkı**: Finesse'li katana, el sargısı, parfüm şişesi gibi SRD'de karşılığı olmayan silahlar için `weapons.json`'a özgün silah kaydı mı (srdIds genişler) yoksa eşyada istatistik ezmesi mi (O11)?
12. **K12 Özel oklar ve eliksirler**: özel cephane sistemi (seçim + tüketim) yazılsın mı, yoksa oklar şimdilik yalnız veri/`offCombat` mu? Eliksirin "UD'ye dek" süresi savaşlar arası durum olarak yazılsın mı?
13. **K13 Bölge bossları ve mücevher ejderhaları**: PDF'te stat bloğu yok (bölge) ya da eksik (mücevher: hız, duyu, yetenek puanı, saldırı, efsanevi eylemler). Stat tasarımı Aşama 2'de benden mi istenir, ayrı bir tasarım belgesi mi gelir? Mücevher nefes DC'si sabit mi (tablo) Taşıyıcının niteliğiyle mi (metin)?
14. **K14 Bağışıklık yığını**: Kaltakkıran 10/10 (13 türe bağışıklık) ve "duruş kırılma" ile yenilme sistemi kodlanmadan bu boss oynanamaz. Kaltakkıran savaşı da "Serüven'de, yalnız anlatım" mı?

## 9. DOĞRULAMA

- Tablo satırları (betikle sayıldı):
  - A 125 + B 60 + C 55 + D 45 + E 45 = **330 katalog eşyası** (kaynak toplamı: S1 40 + S2 50 + KY 55 + ZK 45 + GY 50 + YT 45 + TK 45 = 330).
  - Boss ganimeti 19 satır, boss/yaratık 22 satır.
  - **Genel toplam 371** (= 330 + 19 + 22).
- Yöntem notu: ayrıştırma `pdftotext` ham kipte 330 başlığın hepsini yakaladı. 26 parçanın özet satırı sütun kaymasıyla eksik çıktı; bunlar `-layout` kipinden tamamlandı. Twinspark'ın durum notu okunamadı (bölüm 2.6 madde 9).
- Kod, veri, test, build değişmedi. Yalnız bu dosya eklendi.
