# Sabah raporu (gece kuyruğu: K1 → L6 → B3 → B4 → B5 → CILA)

**Durum:** kuyruğun altı görevi de bitti, hepsi bu dalda ve gönderildi; hiçbir görev `wip/` dalına kalmadı. Kayıt sürümü 19 kaldı (olay biçimine yalnızca isteğe bağlı alanlar eklendi). Son tam paket: 100 dosya / 1142 test yeşil; ana parça 384,8 kB (500 kB sınırı altında).

## YARIM KALANLAR

Görev bitti ama şu parçalar kısmi kaldı (ayrıntı ilgili bölümde ve `DECISIONS.md`'de):
- **CILA 4 — Wind Wall biçimi:** düz ve yay biçimi var; serbest çizim (50 ft'lik istenen yol) yok.
- **CILA 5 — Blindness/Deafness seçimi:** motor `choice` ile Deafened alır; arayüzde ve yapay zekâda seçim düğmesi yok (her zaman Blinded).
- **CILA 6 — Flaming Sphere çarpması:** yalnızca taşımanın sonunda bitişik yaratığa (yol üstündeki ilk yaratıkta durma yok).
- **B3 — Sleep'in ikinci aşaması**, **B5 — Sanctuary, Warding Bond, Jump, Spider Climb** ve **B4 — Water Walk, Knock**: karar bekliyor (aşağıda).
- **B5 — Bestow Curse:** dört lanet seçeneğinden yalnızca ilki.


## Karar bekleyenler (özet)

- **K1 — "Zarla" yöntemi:** oyunda hiç yoktu (yalnızca Standart dizi ve Puan satın alma). Eklemek kayıt biçimine yeni yöntem (`method: 'roll'`) ve zar kaydı ister. Seçenekler: (a) eklenmesin; (b) 4d6 en düşük atılır, sonuç kayda yazılır (yeni yöntem, eski kayıtlar etkilenmez); (c) zar sonuçları elle girilir (masa zarı).
- **K1 — "Aynı 4 alakasız alt sınıf" dolgusu depoda bulunamadı:** her sınıfın tam bir SRD alt sınıfı var. Olası kaynak tarayıcıdaki dış içerik paketi (Ayarlar → Dış içerik) ya da yerel `icerik/` klasörü. Sihirbaz kuralı genel uygulandı (veride alt sınıf yoksa "Yakında"; açılışta sınıfta olmayan alt sınıf temizlenir). Kaynak dış içerikse paketi Ayarlar'dan kaldırman yeterli.

- **L6 — Açılış katman çözünürlüğü:** açılış katmanları 1400 px'ten dışa aktarılıyor (`scripts/logo.ts` `WIDTH.acilis`); 2x ekranda kanatlar ≈1,3 kat büyütülüyor. Seçenekler: (a) böyle kalsın; (b) `WIDTH.acilis` 2000–2400 yapılıp `npm run logo` yeniden çalıştırılsın (görseller ≈2 kat büyür, `data/logo.json` ölçüleri yeniden üretilir, logo testlerindeki genişlik beklentisi güncellenir).
- **B3 — Sleep ikinci aşaması:** SRD 5.2.1'de başarısız save Incapacitated, sonraki tur sonunda ikinci başarısız save Unconscious. Oyunda yalnızca tur sonu save'le biten Incapacitated. Seçenekler: (a) böyle kalsın; (b) iki aşamalı zamanlayıcı (`conditionTimers`'a "ikinci başarısızlıkta durum değişir" alanı; "second failure" kalıbını canavar etkileri de kullanır, Bilinen eksikler'de).
- **B3 — Suggestion serbest metin:** oyunda iki öneri var ("savaşı bırak", "uzaklaş"). Seçenekler: (a) böyle kalsın; (b) Game Master'ın yazdığı öneri günlüğe yazılır, etki yine "turunu kaybeder" olur; (c) öneri listesi veride genişletilir (ör. "silahını bırak", "dostuna yaklaş").
- **B3 — Charm Person/Animal Friendship hasarla bitme kaynağı:** SRD'de yalnızca büyücü ya da dostlarının verdiği hasar bitirir; oyunda her hasar. Seçenekler: (a) böyle kalsın; (b) `breakOnDamage: 'casterSide'` (hasar verenin tarafı olaya yazılır; hasar etkisine kaynak alanı eklemek gerekir).
- **B4 — Water Walk:** haritalarda su, bataklık ve lav altıgenleri var (derin su geçilmez, bataklık zorlu). Seçenekler: (a) savaş dışı not kalsın (şimdiki); (b) süren etki `waterWalk`: sıvı altıgenleri düz zemin sayılır (derin su/bataklık kuralı atlanır, lavın hasarı sürer), 10 dosta kadar.
- **B4 — Knock:** Kale haritasında kapı kuralı (`gate`) var. Seçenekler: (a) savaş dışı not kalsın; (b) Knock kapıyı açar (kapı kuralına "açıldı" olayı; 300 ft'lik gürültü yok sayılır).
- **B4 — Ana parça büyüdü:** büyü verisi (`data/spells.json`; B3–B5'te 109 → 168 kayıt) ana parçada; 358 → 385 kB (sınır 500). Seçenekler: (a) böyle kalsın; (b) büyü verisini tembel yüklemeye geçir (`loadSpells()`, canavar ve sınıf verisi gibi; çağrı yerlerinde yükleme sırası gerekir).
- **B5 — Sanctuary:** seçenekler: (a) karar bekliyor kalsın; (b) saldırı/büyü hedeflenirken saldıran WIS save, başarısızsa saldırı boşa gider (eylem/saldırı harcanır; silah, canavar ve büyü yollarına ortak bir "hedef alma" denetimi); (c) basit yaklaşık: korunana saldırılar dezavantajlı (SRD'den uzak).
- **B5 — Warding Bond:** seçenekler: (a) karar bekliyor kalsın; (b) hedefe +1 AC/save ve direnç, hedef hasar alınca büyücüye aynı miktarda ikinci hasar olayı (bütün hasar yollarında ortak kanca); (c) bölüşmesiz (yalnızca güçlendirme; dengesiz).
- **B5 — Jump / Spider Climb:** seçenekler: (a) karar bekliyor kalsın; (b) Jump: Volkan lav atlaması kuralını genel "atla" hareketine açmak; Spider Climb: tırmanma kuralında yükseklik maliyeti yok (süren etki `climb`).
- **B5 — Bestow Curse'ün diğer üç seçeneği** (saldırıya dezavantaj, tur başı WIS save ya da eylem kaybı, büyücünün isabetlerinde +1d8 necrotic): seçenekler: (a) yalnızca ilk seçenek kalsın; (b) üçü de `variants` ile eklensin (tur başı save için B3 zorlama kalıbına "save ile" eki gerekir).

- **K3 — Sihirbaz adım sayısı:** kimlik + tür + sınıf birleşince büyücüde 7, büyücü olmayanda 6 adım oldu (görevde 8/7 yazıyordu; üç adım birleşince iki adım düşer). Seçenekler: (a) 7/6 kalsın; (b) "Soy ve özellikler" gibi ayrı bir adım eklenip 8/7'ye çıkılsın.
- **K3 — Soy büyülerinin yeteneği:** SRD'de soy seçilirken INT/WIS/CHA seçilir; oyunda büyücü sınıfta sınıfın yeteneği, değilse en yükseği. Seçenekler: (a) böyle kalsın; (b) sihirbaza "soy büyüsü yeteneği" seçimi (kayıtta yeni isteğe bağlı alan; büyücü sınıfta ayrı DC gerekir).
- **K3 — Goliath isabet yetenekleri (Fire's Burn, Frost's Chill, Hill's Tumble):** oyunda silah isabetinde otomatik, turda bir kez; oyuncuya sorulmuyor, büyü saldırısında yok. Seçenekler: (a) böyle kalsın; (b) isabette oyuncuya sor (tepki istemi kalıbıyla "kullan / sakla"; yapay zekâ kural tabanlı); (c) büyü saldırılarına da açılsın.
- **K3 — Stone's Endurance kapsamı:** yalnızca saldırı isabetinin hasarında; büyü save'i, alan ve zemin hasarında yok. Seçenekler: (a) böyle kalsın; (b) bütün hasar yollarına ortak "hasar alınca" tepki kancası (Warding Bond ile aynı kanca).
- **K3 — Oyunda olmayan soy özellikleri:** Goliath Large Form (5. seviye) ve Powerful Build, High Elf'in uzun dinlenmede cantrip değiştirmesi, Rock Gnome'un mekanik aletleri. Seçenekler: (a) ⓘ notuyla kalsın; (b) Large Form süren etki olarak (boyut L, hız +10, STR avantajı; yalnızca görsel ölçek değişir), cantrip değiştirme dinlenme ekranında seçim.

---

## K1: Karakter oluşturma sihirbazı

- Tek uzun form 9 adımlı sihirbaza çevrildi (Kimlik, Irk, Sınıf, Puanlar, Beceriler, İlerleme, Donanım, Büyüler, Özet); büyü seçemeyen sınıfta 8 adım.
- Veri, kayıt biçimi ve kurallar aynı: sorunlar `characterIssues` ile adımlara bağlandı (metinler aynı). Eksik "Devam"ı engellemez; Kaydet yalnızca Özet'te ve eksik yoksa çalışır. Eksikler kırmızı düğme, ilgili adıma götürür.
- Masaüstü: üstte adım çubuğu (✓ yeşil / turuncu geçerli / kırmızı "!"), sağda 290 px özet paneli. Mobil: "4 / 9 · Puanlar" başlığı, ilerleme çubuğu, alt özet çubuğu ("N eksik" açılır liste), 48 px Geri/Devam.
- Puanlar: altı kutu tek sırada (mobilde 2 sütun), "N temel + M geçmiş", standart dizide değer tek kutuda (yer değiştirme), puan satın almada "Kalan puan X / 27" çubuğu; geçmiş bonusu ve seviye artışı alttaki kutuda.
- Beceriler: 18 becerilik tek liste, Sınıf (turuncu) / Geçmiş (yeşil, kilitli) rozetleri, sayaçlar. Donanım: zırh türü düğmeleri + Kalkan, silah kartlarında ustalık düğmesi ("★ Nick"), "Silahlar: seçili N · Ustalık X / Y". Geliştirici etiketleri ⓘ ipucunda.
- Alt sınıfı veride olmayan sınıfta "Yakında" kutusu, eksik sayılmaz; kayıtlı geçersiz alt sınıf açılırken boşa çevrilir (bir kerelik not).
- Sihirbaz ayrı parça (`Builder`, 31,9 kB): ana parça **383 → 358 kB**.
- Testler: 7 yeni sihirbaz testi; tam paket 96 dosya / 1097 test; check:harita 160/0, check:ses 15/0.
- Ekran görüntüleri: `docs/sabah/k1-puanlar-masaustu.jpg`, `docs/sabah/k1-puanlar-mobil.jpg`.
- Commit 60186b6.
- Sapmalar: "Zarla" yöntemi yok (karar bekliyor); oyunda ayrı bir "geçmiş" varlığı olmadığı için geçmiş becerilerini oyuncu seçer (en çok 3), seçildiğinde kilitli rozetle gösterilir.

---

## L6: Açılışta kapalıdan açık kanada geçiş

- Kanıt toplandı: açılış dondurulup (Web Animations API) 2x ekran görüntüsü ve katman opaklık/z-sıraları alındı (masaüstü 1280×800, mobil 390×844).
- (a) Kapalı ve açık kanat ilk ≈160 ms'de aynı karede (0,9/0,06 → 0,1/1). Düzeltme: kapalı kanatlar açık kanatlardan önce tamamen söner (140 ms, `wing-at`'ta biter), açık kanatlar katlı pozdan ≈110 ms'de belirir. Sonra: 0 ms 0/0, 60 ms 0/0,84; iki siluet yok.
- (b) Kaynak görselde şerit/çentik yok. Canlı katmanda `will-change: transform` katlı pozda rasterleştirip büyütüyordu; kaldırıldı. Katman çözünürlüğü (1400 px) karar bekliyor.
- (c) Son logo karesinde çentik yok; açılış sırasında kanat katmanının kök kenarındaki dikey kesik (katman kutusu sınırı) kapalı gövdenin üstünde basamak gibi görünüyordu. Kök kenarına %3'lük yumuşak maske; tam açık görünüm aynı. Canlı zarın silueti bu bölgenin dışında (sorun zardan değil).
- Önce/sonra kareleri: `docs/sabah/l6-once-*.jpg`, `docs/sabah/l6-sonra-*.jpg` (0060 çift kanat, 0700 kök basamağı, 2000 son kare, mobil 0700), yakın plan `l6-kanat-koku-once/sonra.jpg`.
- Commit 5bc7f7d.
- Testler: açılış testleri (soğuk açılış, dönüş, atlama, hareketi azalt) yeşil + 1 yeni (kanat devri süresi). Tam paket 96 dosya / 1098 test; check:harita 160/0, check:ses 15/0. Ana parça 357,9 kB.

---

## B3: Zihin kontrolü ve yanılsama

- Yeni motor parçaları (`src/battle/mind.ts` + süren etki alanları): büyüleme (`charm`: büyüleyene saldırı yok), hasarla bitme (`breakOnDamage`), hasarla yeniden save (`damageSave`, Hideous Laughter avantajlı), zorlama hareketi (`compelEvents`: Command Approach/Flee, Fear kaçışı Dash ile, Suggestion "uzaklaş"; tur başında motorca, sonra tur biter), süren zorlama (`commandPersist`), büyücünün turunda hasar (`sourceTurnDamage`), Mirror Image kopyaları (`images`; isabette d6 ≥ 3 kopyaya), Protection from Evil and Good'un Charmed/Frightened koruması (`wardedFrom`, reducer).
- Büyüler: Charm Person, Animal Friendship (yeni), Command (5 sözcük; Drop yalnızca tur kaybı), Hideous Laughter, Fear, Hypnotic Pattern, Calm Emotions (yeni), Suggestion (yeni; iki seçenek), Mirror Image, Phantasmal Force (yeni), Protection from Evil and Good. Büyü sayısı 109 → 113.
- Savaş dışı işaretlenenler (denetimde "savaş dışı"): Minor Illusion, Prestidigitation, Disguise Self, Unseen Servant, Arcanist's Magic Aura, Silent Image, Major Image.
- **Denetim (0–3. seviye, 183 büyü):** önce tam 56 / kısmi 42 / yok 85 → sonra tam 56 / kısmi 47 / yok 80. Zihin kontrolü grubundaki büyülerin hepsi artık kısmi (sapmalar `approx` notunda); hiçbiri "tam" değil çünkü her birinde SRD'den küçük bir sapma var.
- Testler: `src/battle/b3.test.ts` 12 test (her büyü; konsantrasyon, süre, hasarla bitme, zorlama hareketi, replay). Kayıt uyumluluğu: olay biçimi değişmedi (yalnızca süren etkiye isteğe bağlı alanlar ve yeni hasar etkisi `effect_save`); `SAVE_VERSION` 19 kaldı, eski kayıt testleri yeşil.
- Teknik düzeltme: hasar profili takma adları (`const profileOf = damageProfile`) yeni döngüsel içe aktarmayla modül yüklenirken tanımsız kalıyordu; tembel sarmalayıcı yapıldı (7 dosya, davranış aynı).
- Hızlı regresyon (HEAD'e karşı, 100 tohum; standart ve paladin, 3. ve 5. seviye; Mağara, Dungeon, Kale, Volkan): **16 satırın hepsi aynı** (simülasyon partileri yeni büyüleri kullanmıyor).
- Commit d386872. Tam paket 97 dosya / 1110 test yeşil. Ana parça 361,3 kB. check:harita 160/0, check:ses 15/0.
- **Eksik sprite/ikon:** durum sprite'ları Charmed, Frightened, Incapacitated için var. Eksik: Mirror Image kopyaları (jetonda kopya göstergesi yok, yalnızca etki simgesi 👥), Phantasmal Force yanılsaması, Calm Emotions kayıtsızlığı, zorlama hareketi (Command/Fear kaçışı) için ayrı görsel; şimdilik etki simgeleri (emoji).

---

## B4: Aydınlatma, algılama, nesne büyüleri

- Işık: büyü ışıkları karanlık/gece haritalarının ışık listesine (`litHexes`) eklendi: süren etkide `light` (Light, Continual Flame, Flame Blade, Faerie Fire, Starry Wisp) ve alanda `zone.light` (Dancing Lights, Daylight). Yalnızca parlak ışık; ışıksız haritada etkisiz.
- Darkness: yoğun örtü alanı + büyülü karanlık (ışık aydınlatamaz, karanlık görüş içini göremez); Daylight örtüşen Darkness'ı kaldırır.
- Görünmezlik: Faerie Fire (DEX save; saldırılar avantajlı, Invisible yararı yok, ışık), Starry Wisp (isabette aynı işaret), See Invisibility (görünmeze dezavantaj yok). Ortak yer `src/battle/sight.ts`.
- Flame Blade (bonus eylemle hazır, saldırı "Büyüyü sürdür" ile aynı turda da; 3d6 + yetenek, slot başına +1d6), Sorcerous Burst (tür seçimi; patlayan zar yok).
- **Savaş dışı (Game Master'a not):** 25 büyü (Mage Hand, Thaumaturgy, Elementalism, Purify Food and Drink, Arcane Lock, Create Food and Water, Detect Magic, Detect Evil and Good, Detect Poison and Disease, Detect Thoughts, Find Traps, Locate Animals or Plants, Locate Object, Sending, Meld into Stone, Water Breathing, Water Walk, Knock + B3'ün 7 yanılsaması). Sihirbaz çipinde "savaş dışı" etiketi, savaş menüsünde "savaş dışı · Game Master", günlükte not. Ekran görüntüsü: `docs/sabah/b4-savas-disi.jpg`.
- **Denetim:** önce tam 56 / kısmi 47 / yok 80 → sonra tam 56 / kısmi 57 / savaş dışı 25 / yok 45 (yeni durum: savaş dışı). Büyü sayısı 113 → 145.
- Testler: `src/battle/b4.test.ts` 9 test (ışık, karanlık + Daylight, Dancing Lights konsantrasyonu, Faerie Fire, See Invisibility, Starry Wisp, Flame Blade, Sorcerous Burst, savaş dışı notu; replay). `spells.test.ts` yukarı slot listesine Flame Blade eklendi (veri değişikliği). Kayıt sürümü 19 kaldı (yalnızca isteğe bağlı alanlar ve `zone_ended` nedeni `dispelled`).
- Hızlı regresyon (HEAD'e karşı, 100 tohum; standart ve paladin, 3. ve 5. seviye; Mağara, Dungeon, Kale, Volkan): **16 satırın hepsi aynı** (Mağara karanlık haritası dahil; simülasyon partileri yeni büyüleri kullanmıyor).
- Commit f869fbf. Tam paket 98 dosya / 1119 test yeşil. Ana parça 373,8 kB (+12,5 kB büyü verisi; karar bekliyor). check:harita 160/0, check:ses 15/0.

---

## B5: Özel mekanikli büyüler

- Denetimdeki "özel mekanik" grubunun 31 büyüsü (+ Alter Self; Detect Magic B4'te) tek tek ele alındı:
  - **Çalışıyor (14):** Color Spray, Expeditious Retreat, Ice Knife, Alter Self, Darkvision, Dragon's Breath, Enhance Ability, Pass without Trace, Protection from Poison, Bestow Curse, Dispel Magic, Remove Curse (çoğu kısmi, sapmalar `approx`'ta); Darkvision ve Pass without Trace tam.
  - **Savaş dışı (10):** Druidcraft, Comprehend Languages, Floating Disk, Goodberry, Speak with Animals, Animal Messenger, Enthrall, Gentle Repose, Speak with Dead, Tongues.
  - **Karar bekliyor (4):** Sanctuary, Warding Bond, Jump, Spider Climb (yukarıda seçenekler).
  - **Kısmi kaldı (5):** Hex, Mage Armor, Invisibility, Magic Weapon, Mind Spike.
- Küçük motor kancaları: `darkvisionOf`, `checkAdv` (`checkMode`), `stealthAuraFor`, `cureOnCast`, `burst`, `kind: dispel`. Yeni geniş sistem yok.
- **Denetim:** önce tam 56 / kısmi 57 / savaş dışı 25 / yok 45 → sonra tam 58 / kısmi 67 / savaş dışı 35 / yok 23. Büyü sayısı 145 → 168.
- Testler: `src/battle/b5.test.ts` 12 test (veri sınıflaması, Ice Knife patlaması ıskada da, Color Spray süresi, Dragon's Breath, Expeditious Retreat, Alter Self, Darkvision, Enhance Ability, Pass without Trace konsantrasyonu, Protection from Poison, Bestow Curse + Remove Curse, Dispel Magic; replay). Kayıt sürümü 19 kaldı (yalnızca isteğe bağlı alanlar ve `effect_ended` nedeni `dispelled`).
- Hızlı regresyon (HEAD'e karşı, 100 tohum; standart ve paladin, 3. ve 5. seviye; Mağara, Dungeon, Kale, Volkan): **16 satırın hepsi aynı**.
- Commit 62eeb18. Tam paket 99 dosya / 1131 test yeşil. Ana parça 382,9 kB (büyü verisi +23 kayıt). check:harita 160/0, check:ses 15/0.

---

## CILA: B1/B2 sapmalarının düzeltmeleri

1. **Haste / Slow / Ray of Enfeeblement:** Haste'in ek eylemi ("Hızlı eylem", eylemden sonra; tek silah saldırısı, Dash, Disengage, Hide; yapay zekâ kullanır). Slow: DEX save −2, eylem ya da bonus eylem (ikisi değil), Attack tek saldırı. Ray of Enfeeblement: yakın dövüş (STR) saldırıları ve STR kontrolleri dezavantajlı. Ekran görüntüsü: `docs/sabah/cila-hizli-eylem.jpg`.
2. **Entangle/Web:** tur sonu save'i kalktı; eylemle ("Kurtul") Athletics kontrolü büyünün DC'sine karşı. Yapay zekâ tutulunca önce kurtulmayı dener.
3. **Sis içinden görüş:** iki taraf da örtünün dışındayken aradaki yoğun örtü iki tarafı görünmez yapar (avantaj ve dezavantaj birbirini götürür).
4. **Wind Wall:** menzilli silah saldırısı duvardan geçerken otomatik ıskalar (günlükte neden; yapay zekâ boşa atmaz); duvar düz ya da yay biçiminde (önizleme balonunda seçim).
5. **Acid Arrow** yukarı slotta gecikmeli hasar da +1d4; **Silence** içindeki yaratık Thunder'a bağışık; **Blindness/Deafness** Deafened seçilebilir (motor), Deafened Command ve Suggestion'ı engeller.
6. **Flaming Sphere ve ruh sürüsü:** kendi turları yok; sahibi bonus eylemle 30 ft taşır ("Çağrıyı taşı"); küre bitişik düşmana çarptırılır. Yapay zekâ basit kuralla taşır.
7. **Yapay zekâ zemin büyüleri:** Entangle, Web, Grease, Spike Growth, Sleet Storm, Stinking Cloud, Moonbeam: alanda en az iki düşman ve hiç dost yoksa.
- **Denetim:** önce tam 58 / kısmi 67 / savaş dışı 35 / yok 23 → sonra tam 59 / kısmi 66 / savaş dışı 35 / yok 23 (Acid Arrow tam). Kısmi kalanlardaki notlar daraldı (Haste, Slow, Ray of Enfeeblement, Entangle, Web, Fog Cloud, Wind Wall, Silence, Blindness/Deafness, Flaming Sphere, Conjure Animals).
- Testler: `src/battle/cila.test.ts` 11 test (her madde; replay). `b2.test.ts` ve `spells.test.ts` bilerek değişen davranışa göre güncellendi (commit mesajında gerekçe).
- **Hızlı regresyon** (HEAD'e karşı, 100 tohum; standart ve paladin × 3./5. seviye; Mağara, Dungeon, Kale, Volkan): en büyük fark ±2 puan (standart 3 Volkan 62 → 63, Dungeon 91 → 90; paladin 5 Volkan 89 → 91); aralık dışı satırlar önceden de dışındaydı (`docs/harita/DENGE.md`).
- Tam paket 100 dosya / 1142 test yeşil. Ana parça 384,8 kB. check:harita 160/0, check:ses 15/0. Kayıt sürümü 19 (yeni olaylar `haste_action`, `summon_steered`; eski kayıtlar yüklenir).
- Commit 1c745ed.

---

## L7: Son logo karesinde zarın omuzlarındaki çentik

- Kanıt (2x, son kare, koyu/açık, masaüstü/mobil): (A) L6'nın kök kenarı maskesi kaldırılınca omuzlardaki açık kırmızı çentik kayboluyor; fark yalnızca kanat kökünün %3'lük şeridinde (maske şeridi yarı saydam bırakıp alttaki geniş gövdenin hafif kaymış konturunu gösteriyordu). (B) Canlı zar/parlama/göz gizlenince omuzlarda değişen piksel yok. (C) Canlı zar son karede sönmüş (devir), silueti çentiğe katkı vermiyor; kaynak `logo-acilis.webp` omuzlarda temiz. **Neden: A (L6 maskesi).**
- Düzeltme: maske yalnızca kanatlar açılırken; tam açılınca maske kutusu büyüyüp saydam şerit katmanın dışına çıkıyor (`splash.css`, `splash-mask-off`). L6'nın açılış sırasındaki kök basamağı düzeltmesi korunuyor.
- Önce–sonra: `docs/sabah/l7-omuz-{dark,light}-{masaustu,mobil}.jpg` (2x, 5x/10x büyütme), tam kare `l7-once-masaustu-koyu.jpg` / `l7-sonra-masaustu-koyu.jpg`, deneyler `l7-deney-A-maske.jpg`, `l7-deney-B-zarsiz.jpg`.
- Açılış testleri 21/21 yeşil; typecheck ve build yeşil; check:harita 160 kontrol 0 hata, check:ses 15 kontrol 0 hata. Ana parça 384,8 kB (değişmedi). Kaynak görselde kusur yok (karar bekleyen yok).

## K3: Tek ilk adım ve tür soyları

- **İlk adım "Karakter":** kimlik (ad, seviye, görünüm), tür kartları ("Yetenek puanı bonusu türden değil, geçmişten gelir." notuyla), soy kartları, sınıf kartları, alt sınıf ve özellikler tek adımda. Adım sayısı büyücüde 7, büyücü olmayanda 6 (karar bekleyenlerde). Adım çubuğu, ilerleme çubuğu ve eksik düğmeleri yeni adıma gidiyor ("Ad boş" → Karakter).
- **Jeton önizlemesi:** jetonu tür, görünüm ve sınıf belirliyor; üçü de anında değiştiriyor (test). Masaüstünde sağ panelde büyük (200 px), mobilde üstte küçük yapışkan şerit. Görüntüler: `docs/sabah/k3-karakter-masaustu.jpg`, `docs/sabah/k3-karakter-mobil.jpg`.
- **Soy seçici:** açılır liste yerine kartlar (masaüstünde yan yana, mobilde alt alta); kartta ad ve yalnızca ayıran özelliklerin kısa özeti (veride `summary`, TR/EN). Aynı özet özet panelinde ve karakter kartında.
- **Dragonborn:** 10 ata türü nefes türünü ve direnci zaten doğru veriyordu (test eklendi). **Tiefling:** direnç vardı; soy büyüleri (Abyssal, Chthonic, Infernal; 3. ve 5. seviye) eklendi, Hellish Rebuke slotsuz tepki.
- **Elf** (Drow: karanlık görüş 120 ft, Dancing Lights, Faerie Fire, Darkness; High Elf: Prestidigitation, Detect Magic, Misty Step; Wood Elf: hız 35 ft, Druidcraft, Longstrider, Pass without Trace), **Gnome** (Forest: Minor Illusion, Speak with Animals yetkinlik bonusu kadar; Rock: Mending, Prestidigitation), **Goliath** (6 ata, yetkinlik bonusu kadar): mevcut sistemlerle bağlandı. Seviyeli soy büyüsü uzun dinlenmede bir kez slotsuz; büyücü olmayan karakterde büyü yeteneği INT/WIS/CHA'nın en yükseği.
- **Goliath:** Fire/Frost/Hill silah isabetinde otomatik (turda bir), Stone ve Storm tepki, Cloud bonus eylemle 30 ft ışınlanma (savaş menüsünde altıgen seçilir). Kısmi olanlar yalnızca ⓘ ipucunda.
- **Soy yetenekleri** özette ve savaş kartında soy adıyla ("Drow: Faerie Fire"); savaş dışı ya da oyunda olmayanlar ⓘ ile.
- **Eski kayıt:** soyu boş Elf/Gnome/Goliath karakter ilk soyu alır, bir kerelik not. Kayıt sürümü 19.
- **Celestial:** veride alt seçeneği yok, dokunulmadı.
- **Testler:** `src/battle/lineage.test.ts` (10: özet verisi, 10 Dragonborn atası, Tiefling/Elf/Gnome büyü ve kaynakları, Drow slotsuz Faerie Fire + replay, Goliath isabet/tepki/ışınlanma + replay, eski kayıt), `wizard.test.tsx` (+3: eksiklerin adımı, jeton önizlemesi, soy kartları ve özette soy). Değişen eski testler: adım adları ve sayıları, "miras" → "soy" metni.
- **Doğrulama:** typecheck, tam paket 101 dosya / 1155 test yeşil, build (ana parça 384,8 → 394,2 kB: tür ve kaynak verisi + soy modülü; sınır 500), check:harita 160/0, check:ses 15/0. Hızlı regresyon (HEAD'e karşı, 100 tohum, standart ve paladin, 3. ve 5. seviye, Mağara/Dungeon/Kale/Volkan): kazanma oranları ±2 puan içinde (Elf üyelere soy yazıldı).

## H-SLOT: Yarım büyücünün (Ranger, Paladin) büyü yuvası yok

- **Yeniden üretim:** (a) sihirbazla yeni Ranger/Paladin 1/3/5 ve (b) hazır örnekler savaşa doğru yuvayla giriyor (1: 2, 3: 3, 5: 4 + 2); (c) **kayıtlı durumu olan** karakter (boş formun varsayılanı Fighter iken dinlenmiş ya da savaşmış, sonra Ranger/Paladin yapılmış ya da seviye atlamış) savaşa 0 yuvayla giriyordu: menüde her büyü "slot yok".
- **Neden:** yuvalar kayda yazılmıyor, savaşa girişte sınıf tablosundan hesaplanıyor (tablo doğru, 1. seviyeden başlıyor; sihirbaz alanı yazmıyor). Savaşlar arası durum kalan yuvayı tutup yeni tabloyla "en az" alındığından kazanılan yuvalar kayboluyordu.
- **Düzeltme:** durumda en çok yuvalar da (`slotMax`) tutuluyor; harcanan düşülüyor. Eski kayıtlarda yuvalar açılışta bir kez tamamlanıyor, kısa not ("Büyü yuvaları sınıf ve seviyeye göre tamamlandı"). Kayıt sürümü 19.
- **Testler:** `src/rules/slots.test.ts` (her sınıf ve seviye 1–20 için yuva tablosu, sihirbazla oluşturulan Ranger/Paladin 1/3/5 savaşta, Fighter → Ranger ve seviye atlama, eski kayıt onarımı). Değişen eski test: savaş sonucu durumu artık `slotMax` içeriyor.
- **Ekran görüntüsü:** `docs/sabah/h-slot-ranger-buyu-menusu.jpg` (eski kayıtlı 5. seviye Ranger, onarımdan sonra büyü menüsü: hepsi seçilebilir).
- **Doğrulama:** typecheck, tam paket 102 dosya / 1159 test yeşil, build (ana parça 395,0 kB), check:harita 160/0, check:ses 15/0; hızlı regresyon (standart ve paladin, 3. ve 5. seviye, 4 senaryo) HEAD ile birebir aynı.
