# Sabah raporu (gece kuyruğu: K1 → L6 → B3 → B4 → B5 → CILA)

## Karar bekleyenler (özet)

- **K1 — "Zarla" yöntemi:** oyunda hiç yoktu (yalnızca Standart dizi ve Puan satın alma). Eklemek kayıt biçimine yeni yöntem (`method: 'roll'`) ve zar kaydı ister. Seçenekler: (a) eklenmesin; (b) 4d6 en düşük atılır, sonuç kayda yazılır (yeni yöntem, eski kayıtlar etkilenmez); (c) zar sonuçları elle girilir (masa zarı).
- **K1 — "Aynı 4 alakasız alt sınıf" dolgusu depoda bulunamadı:** her sınıfın tam bir SRD alt sınıfı var. Olası kaynak tarayıcıdaki dış içerik paketi (Ayarlar → Dış içerik) ya da yerel `icerik/` klasörü. Sihirbaz kuralı genel uygulandı (veride alt sınıf yoksa "Yakında"; açılışta sınıfta olmayan alt sınıf temizlenir). Kaynak dış içerikse paketi Ayarlar'dan kaldırman yeterli.

- **L6 — Açılış katman çözünürlüğü:** açılış katmanları 1400 px'ten dışa aktarılıyor (`scripts/logo.ts` `WIDTH.acilis`); 2x ekranda kanatlar ≈1,3 kat büyütülüyor. Seçenekler: (a) böyle kalsın; (b) `WIDTH.acilis` 2000–2400 yapılıp `npm run logo` yeniden çalıştırılsın (görseller ≈2 kat büyür, `data/logo.json` ölçüleri yeniden üretilir, logo testlerindeki genişlik beklentisi güncellenir).
- **B3 — Sleep ikinci aşaması:** SRD 5.2.1'de başarısız save Incapacitated, sonraki tur sonunda ikinci başarısız save Unconscious. Oyunda yalnızca tur sonu save'le biten Incapacitated. Seçenekler: (a) böyle kalsın; (b) iki aşamalı zamanlayıcı (`conditionTimers`'a "ikinci başarısızlıkta durum değişir" alanı; "second failure" kalıbını canavar etkileri de kullanır, Bilinen eksikler'de).
- **B3 — Suggestion serbest metin:** oyunda iki öneri var ("savaşı bırak", "uzaklaş"). Seçenekler: (a) böyle kalsın; (b) Game Master'ın yazdığı öneri günlüğe yazılır, etki yine "turunu kaybeder" olur; (c) öneri listesi veride genişletilir (ör. "silahını bırak", "dostuna yaklaş").
- **B3 — Charm Person/Animal Friendship hasarla bitme kaynağı:** SRD'de yalnızca büyücü ya da dostlarının verdiği hasar bitirir; oyunda her hasar. Seçenekler: (a) böyle kalsın; (b) `breakOnDamage: 'casterSide'` (hasar verenin tarafı olaya yazılır; hasar etkisine kaynak alanı eklemek gerekir).
- **B4 — Water Walk:** haritalarda su, bataklık ve lav altıgenleri var (derin su geçilmez, bataklık zorlu). Seçenekler: (a) savaş dışı not kalsın (şimdiki); (b) süren etki `waterWalk`: sıvı altıgenleri düz zemin sayılır (derin su/bataklık kuralı atlanır, lavın hasarı sürer), 10 dosta kadar.
- **B4 — Knock:** Kale haritasında kapı kuralı (`gate`) var. Seçenekler: (a) savaş dışı not kalsın; (b) Knock kapıyı açar (kapı kuralına "açıldı" olayı; 300 ft'lik gürültü yok sayılır).
- **B4 — Ana parça büyüdü:** büyü verisi (`data/spells.json`, 32 yeni kayıt) ana parçada; 361 → 374 kB (sınır 500). Seçenekler: (a) böyle kalsın; (b) büyü verisini tembel yüklemeye geçir (`loadSpells()`, canavar ve sınıf verisi gibi; çağrı yerlerinde yükleme sırası gerekir).

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
- Sapmalar: "Zarla" yöntemi yok (karar bekliyor); oyunda ayrı bir "geçmiş" varlığı olmadığı için geçmiş becerilerini oyuncu seçer (en çok 3), seçildiğinde kilitli rozetle gösterilir.

---

## L6: Açılışta kapalıdan açık kanada geçiş

- Kanıt toplandı: açılış dondurulup (Web Animations API) 2x ekran görüntüsü ve katman opaklık/z-sıraları alındı (masaüstü 1280×800, mobil 390×844).
- (a) Kapalı ve açık kanat ilk ≈160 ms'de aynı karede (0,9/0,06 → 0,1/1). Düzeltme: kapalı kanatlar açık kanatlardan önce tamamen söner (140 ms, `wing-at`'ta biter), açık kanatlar katlı pozdan ≈110 ms'de belirir. Sonra: 0 ms 0/0, 60 ms 0/0,84; iki siluet yok.
- (b) Kaynak görselde şerit/çentik yok. Canlı katmanda `will-change: transform` katlı pozda rasterleştirip büyütüyordu; kaldırıldı. Katman çözünürlüğü (1400 px) karar bekliyor.
- (c) Son logo karesinde çentik yok; açılış sırasında kanat katmanının kök kenarındaki dikey kesik (katman kutusu sınırı) kapalı gövdenin üstünde basamak gibi görünüyordu. Kök kenarına %3'lük yumuşak maske; tam açık görünüm aynı. Canlı zarın silueti bu bölgenin dışında (sorun zardan değil).
- Önce/sonra kareleri: `docs/sabah/l6-once-*.jpg`, `docs/sabah/l6-sonra-*.jpg` (0060 çift kanat, 0700 kök basamağı, 2000 son kare, mobil 0700), yakın plan `l6-kanat-koku-once/sonra.jpg`.
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
