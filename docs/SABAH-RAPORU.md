# Sabah raporu (gece kuyruğu: K1 → L6 → B3 → B4 → B5 → CILA)

## Karar bekleyenler (özet)

- **K1 — "Zarla" yöntemi:** oyunda hiç yoktu (yalnızca Standart dizi ve Puan satın alma). Eklemek kayıt biçimine yeni yöntem (`method: 'roll'`) ve zar kaydı ister. Seçenekler: (a) eklenmesin; (b) 4d6 en düşük atılır, sonuç kayda yazılır (yeni yöntem, eski kayıtlar etkilenmez); (c) zar sonuçları elle girilir (masa zarı).
- **K1 — "Aynı 4 alakasız alt sınıf" dolgusu depoda bulunamadı:** her sınıfın tam bir SRD alt sınıfı var. Olası kaynak tarayıcıdaki dış içerik paketi (Ayarlar → Dış içerik) ya da yerel `icerik/` klasörü. Sihirbaz kuralı genel uygulandı (veride alt sınıf yoksa "Yakında"; açılışta sınıfta olmayan alt sınıf temizlenir). Kaynak dış içerikse paketi Ayarlar'dan kaldırman yeterli.

- **L6 — Açılış katman çözünürlüğü:** açılış katmanları 1400 px'ten dışa aktarılıyor (`scripts/logo.ts` `WIDTH.acilis`); 2x ekranda kanatlar ≈1,3 kat büyütülüyor. Seçenekler: (a) böyle kalsın; (b) `WIDTH.acilis` 2000–2400 yapılıp `npm run logo` yeniden çalıştırılsın (görseller ≈2 kat büyür, `data/logo.json` ölçüleri yeniden üretilir, logo testlerindeki genişlik beklentisi güncellenir).

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
