# KATALOG-1 F — Mühür Ruhu bölge bossları: tasarım (Aşama 1)

Görev KATALOG-1 F, Aşama 1. Bu dosya yalnızca belgedir: kod, veri ve test değişmedi. Aşama 2 bu belgedeki K-kararları onaylandıktan ve BOSS-GORSEL-1 `birlesik`'e birleştikten sonra başlar (`public/boss/` ve `data/boss-gorsel.json` yoksa Aşama 2 durur).

- **Dal:** `claude/katalog-1-f-tasarim`, `origin/birlesik` (15a05761) üstünden açıldı.
- **Kural sürümü:** 106 (`data/kural-surumu.json` `surum`; SRD-TAMAMLAMA-1 B). Kayıt sürümü 25. Bu tasarımın Aşama 2'si yalnızca veri ekleyeceği için **ikisini de değiştirmeyi öngörmez**.
- **Ön durum:** KATALOG-1 A–E `birlesik`'te. KATALOG-1 G (anlatım) başlamadı: `claude/katalog-1-g-narrative-…` dalında G commit'i yok. SRD-TAMAMLAMA-1 A–C bitti (106).
- **Kaynak:** depo dışındaki `docs/katalog/` altında iki PDF, `pdftotext -layout` ile okundu:
  - *Kaltakkıran'ın Paladin Zırhı ve On Mühür Taşı Sistemi* (21 s.): §5 on Seviye 3 taş, §6 on bölge bossu ve fazları.
  - *Kadim Yaratıklar ve Mücevher Ejderhası Kataloğu* (11 s.).

## 0. Önce bilinmesi gereken üç bulgu

1. **PDF'te bölge bosslarının stat bloğu yok.** §6 her boss için yalnız üç bilgi verir: element, bir cümlelik "Faz 1 — Temel Savaş Kimliği" ve "Faz 2 (%50 Can) — Taş Uyanışı". §5'teki taş prospektüsleri buna iki şey ekler: bossun kendi taşından gelen bağışıklıkları ve **taşın Savaş Sanatı**. PDF bu sanatı "o taşı taşıyan bölge boss'undan miras" diye anar, yani bossun imza eylemidir.
   - PDF'te **olmayanlar:** CR, boyut, HP, AC, hız, yetenek puanları, saldırılar, efsanevi eylem ve efsanevi direnç.
   - Aşağıdaki tablolarda bu alanlar **"öneri"** olarak işaretli. "Birebir" denetimi yalnızca PDF'in gerçekten tanımladığı güçlere uygulanır.
2. **Motorda "%50 canda faza geç" tetiği yok.** Bloodied'a bağlı mantık yalnızca canavara özel kod olarak var: Ochre Jelly Split, Berserk, Troll Loathsome Limbs, `bloodied` avantajı. Faz 2'yi açacak veri alanı yok. Mekanik donması nedeniyle **on bossun Faz 2 geçişi "sığmıyor"**. Faz 2'nin parçalarının çoğu mevcut ilkellerle yazılabilir (tur başı aura, Mirror Image, çağırma), ancak faz kapısı olmadan. Seçenekler K3'te.
3. **Canavar eylemleriyle zemin yüzeyi oluşturma yok.** Taş sanatlarının yarısı ve Faz 2'lerin çoğu "alan N tur alev, buz ya da asit yüzeyi olur" der. Canavar yetenekleri, efsanevi eylemler ve saldırı ekleri yüzey yaratamaz. Tek yol harita kuralı `lairEruption`'dur (Volkan; tur başı, rastgele altıgen). Bu parçalar "sığmıyor"; yaklaşık yollar satırlarda.

## 1. Kimlik, sınıf ve dosya düzeni (Aşama 2 için öneri)

- **Sınıf etiketi:** "Mühür Ruhu" / "Seal Spirit" (görünen sınıf; motor mekaniğine girmez). Ad ve unvan İngilizce (SD4), açıklama Türkçe.
- **Yaratık türü:** motor türü SRD türlerinden biri olmalı. Türe bağlı kurallar şunlardır: Divine Smite +1d8 Fiend/Undead'e, Protection from Evil and Good, Hallow ve Turn Undead. Öneri: on bossun hepsi **Fiend** ("cehennem canavarı"); karar K2.
- **Veri dosyası:** `data/bosslar-muhur.json`. `data/monsters.json`'a yazılmaz; SRD sayım testi `src/data/srdCanavar.test.ts` 330 canavarı karşılaştırır.
  - Kayıt `Monster` biçiminde, ek alanlar: `kaynak: "katalog-1"`, `sinif: "muhur-ruhu"`, `element`, `eskiAd` (PDF'teki boss adı), `unvan` TR/EN, `katalog` (PDF kaynak ve sayfa).
  - Jeton yolu `avatar: "boss/<kimlik>.webp"`: `Monster.avatar` zaten `public/` altındaki yolu alır, kod gerekmez.
- **Güç bağlamaları** var olan dosyalara yeni anahtarlarla yazılır:
  - `data/efsanevi.json` `monsters.<kimlik>`
  - `data/canavar-yetenekleri.json` `<kimlik>` (sanat, aura, çekme, çağırma)
  - `data/monster-reactions.json`
  - `data/canavar-ekleri-a2.json` (`<kimlik>:<saldırı>` ekleri: süreli durum, itme, AC aşındırma, noHeal)
  - durum bağışıklığı ve duyular `unsupported` dizisinde, `monsterTraits` biçimiyle ("Durum bağışıklığı: …", "Blindsight 60")
  - Efsanevi direnç `traits` metninde "Legendary Resistance (N/Day)"; `create.ts` bunu metinden okur.
- **Yeni kod yalnızca yükleyicide:** `loadMonsters()` boss dosyasını tembel yükleyip `getMonster` aramasına ekler. Yaratık türü boss kaydından okunur, çünkü `data/canavar-turleri.json` SRD'den üretilir ve test denetler.
  - Risk: canavar dizisini sayan testler 330'u bekliyorsa bosslar ayrı dizide tutulur ve `getMonster` iki diziye bakar. Aşama 2'de doğrulanır.
- **Ortam:** `data/monster-ortamlari.json` kaydı `tema: "Mühür Ruhları"`; `ortam` listesi aşağıda. Hangi düğümde çıkacağı Serüven'e kalır.
- **Görsel:** yalnızca yol, `public/boss/<kimlik>.webp`. Bağlama Aşama 2'de, BOSS-GORSEL-1 birleşince yapılır. Taş görseli kullanılmaz.

| # | Element | Kimlik | Ad, unvan (EN) | `eskiAd` (PDF) | Taş (PDF §5) | PDF bölgesi | Önerilen `ortam` |
|---|---|---|---|---|---|---|---|
| 1 | Ateş | `cimbom` | Cimbom, Lion of the Hell | Erimiş Örs Muhafızı | Kor Çekirdeği | Yanık Demirhane | `volkanik-demirhane`, `lav-tapinagi`, `derinlikler-lav-salonu`, `volkan` |
| 2 | Soğuk | `wolfgang` | Wolfgang, Blizzard Wolf | Tipi Yutan Dev | Ayaz Kalbi | Donmuş Geçit | `buzul-kayalik`, `buzul-acik`, `buzul-tapinak`, `buzul-kamp` |
| 3 | Yıldırım | `stormer` | Stormer, Thunder Stallion | Şimşek Süvarisi | Fırtına Mili | Paratoner Yaylası | `dag-kayalik`, `dag-kopru`, `dag-nobetci`, `dag` |
| 4 | Gürültü | `gongar` | Gongar, Bell Shell Brute | Kör Çan Devi | Çınlama Mührü | Yankı Kanyonu | `col-kanyon-nehri`, `col-sutun-harabesi`, `kanyon-koprusu` |
| 5 | Asit | `hydraxe` | Hydraxe, Sulphur Hydra | Sülfür Hidrası | Erime Damlası | Sülfür Bataklığı | `batak-cukur`, `batak-adalar`, `batak-kale`, `bataklik` |
| 6 | Zehir | `mothra` | Mothra, Spore Moth | Spor Hükümdarı | Ağu Özü | Çürük Orman | `derinlikler-mantar-magarasi`, `orman-kemik-acikligi`, `orman-heykel-golu` |
| 7 | Işıltı | `lightaur` | Lightaur, Bull of Celestial | Kırık Hale Şövalyesi | Kör Güneş Parçası | Terk Edilmiş Katedral | `kasaba-demirci-tapinak`, `buzul-tapinak`, `lav-tapinagi` |
| 8 | Nekrotik | `cerbones` | Cerbones, Crematorium | Kemik Toplayıcı Lord | Mezar Küresi | Kemik Ovası | `orman-kemik-acikligi`, `derinlikler-mezar-labirenti` |
| 9 | Psişik | `mirage` | Mirage, Life Stealer | Ayna Zihin Avcısı | Vesvese Kristali | Sisli Akademi | `col-sutun-harabesi`, `isinlanma-salonu`, `beyaz-sehir-saray-avlusu` |
| 10 | Kuvvet | `darkape` | Darkape, Kong of the Void | Yörünge Nöbetçisi | Boşluk Kırığı | Yıkık Gözlemevi | `dag-karakol`, `kanyon-koprusu`, `isinlanma-salonu` |

PDF bölgelerinin hiçbiri oyunda harita olarak yok. `ortam` listesi temaya en yakın mevcut haritalardan seçildi ve yalnızca seçici süzgecini etkiler.

## 2. Boyut ve harita kararı

`multiHex` (Game Master anahtarı, varsayılan kapalı) kapalıyken her boyut tek altıgen kaplar; boyut yalnızca jeton ölçeğini ve boyuta bağlı kuralları etkiler (yakalama, itme, yutma, binek). Açıkken Large 3, Huge 7, Gargantuan 19 altıgen kaplar; Gargantuan 15×7 haritada reddedilir.

| Boss | PDF'in betimlediği | Önerilen boyut | `multiHex` kapalı | `multiHex` açık | Oynanacağı harita |
|---|---|---|---|---|---|
| Cimbom | ağır zırhlı lav golemi | Huge | 1 altıgen | 7 | 21×11 ya da 31×17 |
| Wolfgang | kırağı devi | Huge | 1 | 7 | 21×11 |
| Stormer | binekli şövalye | Large | 1 | 3 | 15×7 ve üstü |
| Gongar | dev tunç çan taşıyıcısı | Huge | 1 | 7 | 21×11 |
| Hydraxe | dev bataklık hidrası | Huge (SRD Hydra gibi) | 1 | 7 | 21×11 |
| Mothra | kadim yaratık | Huge | 1 | 7 | 21×11 ya da 31×17 |
| Lightaur | kutsal muhafız | Large | 1 | 3 | 15×7 ve üstü |
| Cerbones | nekromansi komutanı | Huge | 1 | 7 | 21×11 ya da 31×17 |
| Mirage | ışınlanan avcı | Medium | 1 | 1 | 15×7 ve üstü |
| Darkape | yerçekimi nöbetçisi | Huge | 1 | 7 | 21×11 |

- Gargantuan kullanılmaz (15×7'de reddedilir, 21×11'de alanın çoğunu kaplar).
- Huge bosslar için 21×11 ve üstü önerilir. 15×7'de `multiHex` açıkken sığar ama manevra alanı kalmaz.
- Güç boyuttan bağımsızdır (kullanıcı kararı: boyut küçültülebilir). Sanat alanları bossun çapa altıgeninden ölçülür.

## 3. Ortak boss iskeleti (PDF'te yok: öneri, karar K1)

PDF yalnız DC'leri verir: sanatlar DC 16, Faz 2 auraları DC 15. Önerilen iskelet bu DC'lerle tutarlı olacak biçimde, SRD 5.2.1'de efsanevi eylemli CR 13–15 canavarlara (Adult White/Black Dragon, Ice Devil) göre kuruldu:

- **CR 14**, yeterlilik +5, AC 17–20, HP 200–260, saldırı +10…+12.
- Bossun kendi eylemlerinin DC'si de 16 (PDF ile tutarlı).
- **Efsanevi direnç 3/Day.** PDF'te yok; motorda `traits` metniyle birebir çalışır.
- **Efsanevi eylem 3 kullanım/tur.** PDF'te yok. Yalnız mevcut türler: `strike` (ana saldırı), `teleport`, `save`, `buff`, `pull`.
- **Savaş Sanatı:** canavar yeteneği, eylem, **savaşta 1 kez** (`uses: 1`). PDF'te taşta 1/UD; bossun tek savaşına karşılığı budur.
- **Taşın pasifleri:** hasar türü bağışıklığı ve durum bağışıklıkları. PDF'e göre "Her boss kendi taşının hasar türüne bağışıktır"; birebir.

## 4. On boss: PDF ile motor karşılığı

Durum sütunu: **birebir** (mevcut veri alanıyla aynen), **yaklaşık** (en yakın mevcut mekanik; satırda farkı yazılı), **sığmıyor** (KATALOG-SIGMAYAN'a girer), **öneri** (PDF'te yok, tasarım önerisi).

### 4.1 Cimbom, Lion of the Hell (Ateş; eskiAd Erimiş Örs Muhafızı)

| Alan | PDF | Motor karşılığı | Durum |
|---|---|---|---|
| CR / boyut / tür | yok | CR 14, Huge, Fiend | öneri |
| HP / AC | yok | 250 (20d12+120) / 18 | öneri |
| Hız / duyular | yok | 50 ft / Darkvision 120 | öneri |
| Yetenekler | yok | STR 24, DEX 14, CON 22, INT 8, WIS 14, CHA 16; save DEX +7, CON +11, WIS +7 | öneri |
| Bağışıklık | Ateş; Burning | `immunities: ["fire"]`. Burning motorda durum değil; ateş bağışıklığı alev yüzeyini zaten 0'a indirir | birebir (Burning etkisiz) |
| Saldırılar | "kızgın çekiç" kimliği | Multiattack: Bite +12 (2d10+7 delici + 2d6 ateş), 2 Claw +12 (2d6+7 kesici) | öneri |
| Faz 1: vurduğu altıgenlere yağ ve kor sıçratma | var | Canavar saldırısı yüzey oluşturamaz | **sığmıyor**. Yaklaşık: yok (saldırıya ateş hasarı eklemek güç değiştirir) |
| Sanat, Erimiş Örs Patlaması | 15 ft yarıçap, kendi merkezli, DC 16 DEX, 5d6 ateş, 10 ft itme, başarıda yarı | yetenek `save`, alan `emanation` 15, `push` 10 (K53 `forcedMove`) | birebir |
| …alan 2 tur alev yüzeyi | var | yüzey oluşturma yok | **sığmıyor** |
| Faz 2, kenar altıgenler 3 tur alev | var | `lairEruption` (tur başı rastgele altıgen alev; faz kapısız, kenar değil) | **sığmıyor**. Yaklaşık: Game Master `place_surface` |
| Faz 2, tur başı 15 ft 2d6 ateş dalgası | var | `passive.ownerTurn` `{when:start, radiusFt:15, dice:"2d6", type:"fire"}` | yaklaşık (faz kapısı yok, K3) |
| Efsanevi | yok | LR 3; LA: Claw (1), Pounce (`strike` `halfMove`) | öneri |

### 4.2 Wolfgang, Blizzard Wolf (Soğuk; eskiAd Tipi Yutan Dev)

| Alan | PDF | Motor karşılığı | Durum |
|---|---|---|---|
| CR / boyut / HP / AC | yok | CR 14, Huge, Fiend, 240 / 17 | öneri |
| Hız | yok | 50 ft, tırmanma 30 ft ("yüksek kayalıklar") | öneri |
| Bağışıklık, pasif | Soğuk; buz/karda zorlu arazi ve kayma yok (iceWalker) | `immunities: ["cold"]`; Ice Walk canavar özelliği (`monsterTraits` `iceWalker`) | birebir |
| Faz 1: kayalıktan buz mızrağı | var | Frost Spear menzilli +11, 60/180 ft, 2d8+6 delici + 2d6 soğuk; Bite +11 (2d10+6 + Prone eki, DC 16 STR) | yaklaşık (atış saldırı olarak; değerler öneri) |
| Faz 1: suya değen yerleri anında dondurma | var | soğuk hasarı × su yüzeyi tepkimesi (`hexResolver`, `data/yuzey-etkilesimleri.json`) yalnız su **yüzeyinde**; su zemini (`w`) donmaz | yaklaşık |
| Sanat, Kırağı Nefesi | 20 ft koni, DC 16 CON, 5d6 soğuk + 1 tur Restrained, başarıda yarı | `save`, `cone` 20, `conditions: ["restrained"]` (sonraki turunun sonuna dek) | birebir |
| …koni 3 tur buz yüzeyi | var | yalnız su yüzeyinde tepkimeyle | **sığmıyor** (zemin) / yaklaşık (su) |
| Faz 2, haritanın yarısı buz | var | yok | **sığmıyor** |
| Faz 2, tipi görüşü 30 ft'e indirir | var | harita kuralı `snowfall`/`fog` (`weatherOf`), varyantta baştan | yaklaşık (faz kapısız) |
| Faz 2, buz üstündekine avantaj | var | yok | **sığmıyor** |
| Efsanevi | yok | LR 3; LA: Bite (1), Buz Mızrağı (1) | öneri |

### 4.3 Stormer, Thunder Stallion (Yıldırım; eskiAd Şimşek Süvarisi)

| Alan | PDF | Motor karşılığı | Durum |
|---|---|---|---|
| CR / boyut / HP / AC | yok | CR 14, Large, Fiend, 220 / 18 | öneri |
| Hız | yok | 80 ft | öneri |
| Bağışıklık | Yıldırım (su zinciri dahil) | `immunities: ["lightning"]`; zincir hasarı da yıldırım türü | birebir |
| Faz 1: hızlı manevra | var | `bonusActions: ["dash","disengage"]`; hücum eki (20+ ft düz koşu, Prone) | yaklaşık (manevra biçimi öneri) |
| Faz 1: su altıgenine elektrik mızrağı | var | Lightning Lance menzilli +11, 60/120 ft, 3d10 yıldırım; suda zincir `lightningWater` yalnız alan hasarında | yaklaşık |
| Sanat, Gök Mızrağı | 60 ft, 10 ft yarıçap, DC 16 DEX, 6d6 yıldırım, sonraki tur tepki yok, başarıda yarı; suya inerse 7 su altıgenine zincir | `save`, `sphere` 10, `rangeFt` 60, `effect: {noReactions}`; zincir `hexResolver` `area_used` üzerinden | birebir |
| Faz 2, yağmur ve rastgele su altıgenleri | var | yok | **sığmıyor** |
| Faz 2, tur sonu en yüksek ya da metal zırhlı hedefe yıldırım | var | hedef seçimi yok | **sığmıyor**. Yaklaşık: efsanevi `rays` (tek hedef, 1 kullanım) |
| Efsanevi | yok | LR 3; LA: Hooves (1), fırsat saldırısız yürüyüş (`strike` `noOA`) | öneri |

### 4.4 Gongar, Bell Shell Brute (Gürültü; eskiAd Kör Çan Devi)

| Alan | PDF | Motor karşılığı | Durum |
|---|---|---|---|
| CR / boyut / HP / AC | yok | CR 14, Huge, Fiend, 260 / 20 (kabuk) | öneri |
| Hız, duyular | Blindsight ile hareket | 30 ft; "Blindsight 60" (`monsterTraits` duyu) | birebir (Blindsight) |
| Bağışıklık | Gürültü; Deafened; ses kaynaklı itilmeye bağışıklık | `immunities: ["thunder"]`, "Durum bağışıklığı: Deafened"; itmeye bağışıklık canavarda yok | birebir / **sığmıyor** (itme) |
| Faz 1: adımlarıyla altıgen titretme | var | yok | **sığmıyor**. Yaklaşık: aura `difficult` (zorlu arazi) |
| Saldırılar | yok | 2 Bell Slam +12 (3d8+7 ezici + 1d8 gürültü) | öneri |
| Sanat, Kanyon Yırtığı | 30 ft çizgi, 10 ft genişlik, DC 16 CON, 5d6 gürültü + 15 ft itme + Prone + 2 tur Deafened, başarıda yarı | `save`, `line` 30/10, `push` 15, `conditions` prone + deafened | yaklaşık (Deafened süresi "sonraki turunun sonu"/"1 dk" seçenekleri var, 2 tur yok) |
| …nesnelere iki kat | var | `passive.siegeMonster` | birebir |
| …150 ft uyuyanları alarma geçirir | var (risk) | `alarm.ts` gürültü tetiği (hasar ve gürültü) | yaklaşık |
| Faz 2, tur başı 10 ft DC 15 CON yoksa Prone | var | `passive.auras` `{radiusFt:10, save:"con", dc:15, conditions:["prone"], on:["start"]}` | yaklaşık (faz kapısı yok) |
| Faz 2, siper sütunları yıkılır | var | yok (Earthquake yapı yolu büyüye bağlı) | **sığmıyor** |
| Efsanevi | yok | LR 3; LA: Bell Slam (1) | öneri |

### 4.5 Hydraxe, Sulphur Hydra (Asit; eskiAd Sülfür Hidrası)

| Alan | PDF | Motor karşılığı | Durum |
|---|---|---|---|
| CR / boyut / HP / AC | yok | CR 14, Huge, Fiend, 250 / 17 | öneri |
| Hız | asit göletlerinde yüzer | 30 ft, yüzme 40 ft | öneri |
| Bağışıklık | Asit; AC aşındırmasına bağışık | `immunities: ["acid"]`; bossun AC'si aşınmaz (aşındırma oyuncu saldırısında yok) | birebir |
| Faz 1: çoklu ısırık | var | SRD Hydra yolu `passive.heads` (5 baş), Bite +11 (1d10+6 delici + 1d6 asit) | birebir (sayılar öneri) |
| Faz 1: zırh AC'sini aşındırma | var | A2 eki "aşındırma" (`canavar-ekleri-a2.json`, isabette AC −1) | birebir |
| Sanat, Sülfür Tufanı | 30 ft, 15 ft yarıçap, DC 16 DEX, 5d6 asit + 3 tur AC −3 (başarıda yarı + AC −1) | `save`, `sphere` 15, `rangeFt` 30, `effect: {ac:-3}` | yaklaşık: süre 3 tur yerine "1 dk"/"sonraki tur"; başarıdaki AC −1 yok (canavar save'inde başarı etkisi yok) |
| …alan 3 tur asit yüzeyi | var | yüzey oluşturma yok | **sığmıyor** |
| Faz 2, kopan başın 10 ft'i kalıcı asit yüzeyi | var | yok | **sığmıyor** |
| Faz 2, her yakın dövüş isabetinde saldırgana 1d8 asit | var | dokunana hasar yalnız Fire Aura (1d10 ateş, sabit) | **sığmıyor**. Yaklaşık: `monster-reactions` hasar tetikli tepki (turda 1, tepki hakkıyla; birebir değil) |
| Efsanevi | yok | LR 3; LA: Bite (1) | öneri |

### 4.6 Mothra, Spore Moth (Zehir; eskiAd Spor Hükümdarı)

| Alan | PDF | Motor karşılığı | Durum |
|---|---|---|---|
| CR / boyut / HP / AC | yok | CR 14, Huge, Fiend, 220 / 16 | öneri |
| Hız | yok | 20 ft, uçuş 60 ft | öneri |
| Bağışıklık | Zehir; Poisoned; bulut görüş ve nefesi etkilemez | `immunities: ["poison"]`, "Durum bağışıklığı: Poisoned" | birebir (bulut görüşü: yoğun örtü kendi görüşünü de keser, **sığmıyor**) |
| Faz 1: mantar kümelerini patlatarak alanı kapatma | var | yok | **sığmıyor** |
| Faz 1: Poisoned hedefleri kendine çekme | var | yetenek `pull` + `needsCondition: "poisoned"` | birebir |
| Saldırı | yok | Spore Bite +10 (2d8+5 delici + 2d6 zehir, DC 16 CON yoksa Poisoned) | öneri |
| Sanat, Veba Bulutu | 30 ft, 15 ft yarıçap, 3 tur bulut; anında ve bulutta tur başlatana DC 16 CON 4d6 zehir + 2 tur Poisoned; başarıda yarı; **zehir direncini yok sayar** | dökümdeki save birebir (`save`, `sphere` 15). Kalıcı bulut canavarda yok; direnç aşma yok | yaklaşık (anlık) / **sığmıyor** (3 tur bulut, direnç aşma) |
| Faz 2, 3 hareketli zehir bulutu | var | yok | **sığmıyor**. Yaklaşık: Game Master `place_surface` zehir bulutu + rüzgâr sürüklemesi |
| Faz 2, 20 ft içindeki ölüleri spor hizmetkârına çevirme | var | yetenek `summon` `fromCorpse` (ölünün yerine; ör. SRD Zombie) | yaklaşık (hizmetkâr stat bloğu öneri; faz kapısı yok) |
| Efsanevi | yok | LR 3; LA: Kanat çırpışı (`save` 10 ft DEX, Prone) | öneri |

### 4.7 Lightaur, Bull of Celestial (Işıltı; eskiAd Kırık Hale Şövalyesi)

| Alan | PDF | Motor karşılığı | Durum |
|---|---|---|---|
| CR / boyut / HP / AC | yok | CR 14, Large, Fiend (K2), 230 / 19 ("parıltı kalkanı") | öneri |
| Bağışıklık | Işıltı; Blinded; 20 ft ışık aç/kapa | `immunities: ["radiant"]`, "Durum bağışıklığı: Blinded"; `passive.illumination` (aç/kapa yok) | birebir / yaklaşık (ışık hep açık) |
| Faz 1: kör edici parıltı kalkanı, ışın darbeleri | var | Gore +11 (2d10+6 delici + 2d6 ışıltı; hücum eki); Radiant Ray menzilli +11, 120 ft, 3d8 ışıltı | yaklaşık (kalkan AC'de) |
| Faz 1: karanlığı silme | var | canavar büyüsü Daylight (`canavar-buyuleri.json`, 1/gün) | yaklaşık |
| Sanat, Altın Yargı Sütunu | 60 ft, 10 ft yarıçap, 40 ft yükseklik silindir (uçanlar dahil), DC 16 CON, 6d6 ışıltı + 2 tur Blinded; büyülü karanlık dağılır | canavar alanında silindir yok → `sphere` 10 (havadaki hedefe yetmez); Blinded "sonraki tur"/"1 dk"; karanlık dağıtma yok | yaklaşık / **sığmıyor** (40 ft yükseklik, karanlık dağıtma) |
| Faz 2, harita parlak ışıkla dolar | var | yok | **sığmıyor** (yaklaşık: büyük `illumination`) |
| Faz 2, tur başı 15 ft DC 15 CON yoksa 1 tur Blinded | var | `passive.auras` `{radiusFt:15, save:"con", dc:15, conditions:["blinded"], on:["start"]}` | yaklaşık (faz kapısı yok) |
| Efsanevi | yok | LR 3; LA: Gore (1), Radiant Ray (1) | öneri |

### 4.8 Cerbones, Crematorium (Nekrotik; eskiAd Kemik Toplayıcı Lord)

| Alan | PDF | Motor karşılığı | Durum |
|---|---|---|---|
| CR / boyut / HP / AC | yok | CR 14, Huge, Fiend, 250 / 18 | öneri |
| Hız | yok | 50 ft | öneri |
| Bağışıklık | Nekrotik; maks. HP düşüşü ve noHeal'e bağışık | `immunities: ["necrotic"]`; maks. HP ve noHeal bağışıklığı canavarda yok | birebir / **sığmıyor** (noHeal ve maks. HP bağışıklığı) |
| Faz 1: kemiklerden zırh örme | var | yok. Yaklaşık: efsanevi `buff` `tempHp` | **sığmıyor** / yaklaşık |
| Faz 1: iyileşmeyi kesme | var | Bite eki `noHeal` (A2 süreli etki) | yaklaşık |
| Saldırı | yok | 3 Bite +11 (2d8+6 delici + 1d8 nekrotik) | öneri |
| Sanat, Kara Alev Kesiği | 25 ft çizgi, DC 16 CON, 5d6 nekrotik + 2 tur noHeal + savaş sonuna dek maks. HP −hasarın yarısı; başarıda yarı, tavan düşmez | `save`, `line` 25, `effect: {noHeal}`; maks. HP düşüşü (`monsterDrain`) yalnız isabetli saldırıda | yaklaşık (noHeal süresi) / **sığmıyor** (save'li alanda maks. HP) |
| Faz 2, her tur başı 2 iskelet | var | yetenek `summon` (Skeleton, `count` 2) eylemle ya da harita kuralı `boneRise` | yaklaşık (tur başı değil, faz kapısız) |
| Faz 2, saldırılara +1d8 kara alev | var | faz kapısı yok | **sığmıyor**. Yaklaşık: baştan ekli (güç artar, önerilmez) |
| Faz 2, 10 ft içindeki iyileşmeleri yarıya indirme | var | yok | **sığmıyor** |
| Efsanevi | yok | LR 3; LA: Bite (1) | öneri |

### 4.9 Mirage, Life Stealer (Psişik; eskiAd Ayna Zihin Avcısı)

| Alan | PDF | Motor karşılığı | Durum |
|---|---|---|---|
| CR / boyut / HP / AC | yok | CR 14, Medium, Fiend, 200 / 17 | öneri |
| Hız | yok | 40 ft | öneri |
| Bağışıklık | Psişik; Charmed, Frightened | `immunities: ["psychic"]`, "Durum bağışıklığı: Charmed, Frightened" | birebir |
| Faz 1: sütunlar arasında ışınlanma | var | efsanevi `teleport` (30 ft) ya da canavar büyüsü Misty Step | birebir |
| Faz 1: takım arkadaşlarının sahte gölgelerini çağırma | var | yok. Yaklaşık: `summon` SRD Shadow | **sığmıyor** / yaklaşık |
| Saldırı | yok | 2 Soul Claw +10 (2d8+5 kesici + 2d6 psişik) | öneri |
| Sanat, Zihin Kıran Çığlık | 20 ft, düşmanlar, DC 16 INT, 5d6 psişik + 1 tur Stunned + konsantrasyon otomatik kırılır; başarıda yarı, sersemlemez | `save`, `emanation` 20, `conditions: ["stunned"]`; Stunned konsantrasyonu zaten keser (Incapacitated) | birebir (kırılma Stunned'dan) |
| Faz 2, harita psişik sis | var | yok (varyantta `fog`) | **sığmıyor** |
| Faz 2, 2 gerçekçi kopya + yer değiştirme | var | efsanevi `buff` `effect: {images: 2}` (Mirror Image) | yaklaşık (yer değiştirme yok) |
| Faz 2, her tur başı bir oyuncuya korku | var | efsanevi `save` WIS, Frightened | yaklaşık (tur başı değil, efsanevi eylemle) |
| Efsanevi | yok | LR 3; LA: Teleport (1), Korku fısıltısı (1) | öneri |

### 4.10 Darkape, Kong of the Void (Kuvvet; eskiAd Yörünge Nöbetçisi)

| Alan | PDF | Motor karşılığı | Durum |
|---|---|---|---|
| CR / boyut / HP / AC | yok | CR 14, Huge, Fiend, 260 / 18 | öneri |
| Hız | yok | 40 ft, tırmanma 40 ft | öneri |
| Bağışıklık | Kuvvet; zorla itme, çekme ve ışınlamaya bağışık | `immunities: ["force"]`; zorla hareket bağışıklığı canavarda yok | birebir / **sığmıyor** (itme bağışıklığı) |
| Faz 1: uçurum kenarına itme/çekme kombosu | var | 2 Fist +12 (3d8+7 ezici, 10 ft itme eki); yetenek `pull` 15 ft | birebir (sayılar öneri) |
| Sanat, Yıldız Çöküşü | 30 ft içindeki düşmanları 15 ft çek (DC 16 STR engeller); ardından 10 ft'te DC 16 STR, 6d6 kuvvet + Prone (uçanlar düşer); başarıda yarı | iki adım tek eylemde yok: `pull` (save'li) + `save` `emanation` 10 + Prone; uçan Prone'da düşer (mevcut kural) | yaklaşık (iki ayrı yetenek, tek kullanımlık ortak sayaç yok) |
| Faz 2, düşük yerçekimi (itme/çekme +5 ft) | var | yok | **sığmıyor** |
| Faz 2, her 2 turda herkesi 15 ft merkeze çekme | var | yetenek `pull` `recharge` (5–6) | yaklaşık (2 tur yerine Recharge) |
| Efsanevi | yok | LR 3; LA: Fist (1), Çekim (2) | öneri |

## 5. Sığmayanların özeti (Aşama 2'de `KATALOG-SIGMAYAN.md`)

| Ortak boşluk | Bossların sayısı | Önerilen yol (yeni mekanik, donma kalkınca) |
|---|---|---|
| %50 can faz tetiği (Taş Uyanışı) | 10 | Veride `faz2: { esik: 0.5, pasif: …, harita: … }`; komut sonunda Bloodied geçişinde tek seferlik `effect_added`/`passive` açma |
| Canavar eylemiyle yüzey oluşturma (alev, buz, asit) | 5 (Cimbom, Wolfgang, Hydraxe, Mothra, Cerbones dolaylı) | Canavar `save` yeteneğine `surface: {tur, rounds}`; `surfaceEvent` zaten var |
| Faz 2 harita dönüşümü (buz yarısı, yağmur, sis, ışık, düşük yerçekimi) | 6 | Faz kapılı harita kuralı açma (`map.ruleToggles` olayla) |
| Kalıcı canavar bulutu, direnç aşma | 1 (Mothra) | Canavar yeteneğine `zone` + `ignoreResist` |
| Zorla hareket bağışıklığı | 2 (Gongar, Darkape) | Canavar pasifine `forcedImmune` (`forcedMove` girişinde) |
| Dokunana sabit olmayan türde hasar | 1 (Hydraxe) | `fireForm` benzeri `meleeRetaliate {dice, type}` |
| Silindir canavar alanı, karanlık dağıtma | 1 (Lightaur) | Canavar alanına `cylinder` (K73c büyü yolu var) |
| İyileşme yarılama aurası, noHeal/maks. HP bağışıklığı | 1 (Cerbones) | Aurada `healMult` |
| Tek eylemde iki aşamalı sanat (çek + vur) | 1 (Darkape) | Yetenekte `then` |

## 6. Kadim yaratıklar (PDF'te var)

PDF: *Kadim Yaratıklar ve Mücevher Ejderhası Kataloğu*. Hepsinin tam stat bloğu var. SRD tavanı Ancient Red Dragon (CR 24) ile Tarrasque (CR 30) arasını aşarlar. Hepsi çok altıgenli ve mistik fazlıdır.

| Varlık | PDF | Boyut / altıgen | Motor | Durum |
|---|---|---|---|---|
| Kıta Ejderhası V-I | CR 31, AC 25, 740 HP, LR 4, LA 3 (Tail, Kanat Fırtınası, Mühür Çekimi), Continent Roar Breath (120×20 ft çizgi, 16d8 kuvvet + 8d8 gürültü, 30 ft itme), Mahmurluk Perdesi (ilk 2 tur uçuş yarı), zırh İhanet kancası, On Taş Rezonansı | Gargantuan, 19 altıgen | Saldırılar, nefes, LR, LA (`strike`, `save`, `pull`) ve boyut birebir yazılabilir. Mahmurluk (tur sayacına bağlı hız) ve kalıcı Çatlak Kaya yüzeyi sığmıyor. İhanet ve Rezonans hikâye/sistem kancası | çoğu birebir, 3 sığmıyor |
| Kıta Ejderhası V-II | CR 40, AC 30, 1.850 HP, 37 altıgen, iki inisiyatif, büyü yansıtma, seçici nefes, bütün direnç/bağışıklığı yok sayma | 7×7 (37) | 37 altıgen boyut yok (en çok 19); iki inisiyatif, yansıtma, dost korumalı nefes, bağışıklık aşma yok | büyük ölçüde **sığmıyor**; ayrıca düşman değil koruyucu (final) |
| Kozmik Anka Kuşu | CR 32, AC 26, 780 + 450 HP, LR 4, LA 3, Yıldız Alevi (ateş + ışıltı, direnç aşar), Celestial Glide koridoru + yüzey, Küllerden Yeniden Doğuş (yumurta, 450 HP) | Huge, 7 altıgen | Boyut, saldırılar, LR birebir. Çift tür ve direnç aşma, koridor yüzeyi, 0 HP'de yumurta/diriliş, Avcı ruh bağı sığmıyor | yarısı **sığmıyor**; müttefik varlık |
| Mücevher Ejderhaları (5 tür) | Genç CR 15–20 / Yetişkin CR 25–30; binek ve yoldaş, taşıyıcının Alignment ve yetenek izine göre evrim | Large → Gargantuan | Yoldaş/binek ve evrim sistemi; boss değil | F kapsamı dışında önerilir |
| Uçurumun Yıldız-Kâbusu | CR 35, AC 26, 1.150 + 550 HP, 31 altıgen, 12 hedefe kadar yakalama, 6 yutma, delilik aurası, 0 HP'de 2. faz | 6×6 (31) | 31 altıgen yok; çoklu yakalama ve yutma tavanları, delilik aurası, 0 HP fazı yok | büyük ölçüde **sığmıyor** |

Öneri (K5): kadim yaratıklar F'ye girmesin, ayrı görev olsun (KATALOG-1 F2). Yalnız Kıta Ejderhası V-I motora büyük ölçüde sığıyor. Diğerleri birkaç yeni mekanik ister ve mekanik donması altında yarım kalır.

## 7. Denge planı (Aşama 2)

- `npm run sim:boss -- 100 --boss <kimlik>`. Senaryo, mevcut `data/sim-boss.json` biçiminde boss başına bir satır. Liste: boss + en çok 2 yardımcı (örn. Cerbones'ta Skeleton).
- Parti seviyesi K1 kararıyla, yeni parti eklenmez. Hedef aralık mevcut: Normal %45–65, Kolay %70–85.
- Aralık dışı satırlar `harita/belgeler/DENGE.md`'ye yazılır, düzeltilmez.
- Kural ve kayıt sürümü değişmez. Ana parça etkilenmez: boss verisi tembel yüklenir, sınır 465 kB.

## 8. Onay için kararlar

- **K1. Güç kademesi ve parti seviyesi.** PDF'te CR, HP, AC ve saldırı yok.
  - Öneri: hepsi **CR 14** (yukarıdaki iskelet), sim 13. seviye parti.
  - Alternatif: hikâyeye göre (Kaltakkıran sonrası, parti 17–20) CR 18–20. Sanat DC'leri PDF'te sabit 16 olduğu için bu kademede sanatlar zayıf kalır.
- **K2. Yaratık türü.** Öneri: hepsi Fiend. Smite ve PfEG bundan etkilenir. Lightaur (Işıltı) için Celestial de olur.
- **K3. Faz 2 (Taş Uyanışı).** Faz tetiği motorda yok. Seçenekler:
  - **(a)** Faz 2'nin yazılabilen parçalarını (tur başı aura, Mirror Image, çağırma, Recharge'lı çekim) **baştan açık** ver. Bossun gücü artar, birebir değil.
  - **(b)** Faz 2'yi verme. Yalnız Faz 1, sanat, LR ve LA olsun; Faz 2 KATALOG-SIGMAYAN'da beklesin.
  - **(c)** (b) + Game Master notu (`gmNote`): boss Bloodied olunca Game Master `place_surface`, hava kuralı ve çağırmayla Faz 2'yi elle uygular.
  - Öneri: **(c)**, PDF gücünü uydurmadan korur.
- **K4. Efsanevi eylem ve direnç.** PDF'te yok. Öneri: LR 3/Day, LA 3 kullanım (yukarıdaki listeler). Alternatif: yalnız LR.
- **K5. Kadim yaratıklar.** Öneri: F dışında ayrı görev. Alternatif: yalnız Kıta Ejderhası V-I bu görevde.
- **K6. Boyutlar.** Tablo §2. Gargantuan yok, Huge bosslar 21×11+.
