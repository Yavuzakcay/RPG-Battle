# Hizalanma (Alignment) sistemi, taslak v1.1 (2026-11-05)

Kullanıcı isteği: GM, karakterlerin kararlarına göre hizalama ibresini oynatsın. Başlangıç konumu karakter oluşturmanın sonunda geçmiş, sınıf, alt sınıf ve ırka göre **otomatik** yapılır; oyuncu kabul etmezse yalnız orta noktaya ya da bulunduğu satır/sütunun orta çizgisine geçebilir. Serüven'de otomatik olsun (Serüven kilitli: otomatik kısım sonra; veri modeli şimdiden buna hazır).

## Çerçeve
- Ev kuralı: `houseRule("hizalanma")`, varsayılan KAPALI. Kapalıyken hiçbir şey görünmez ve hiçbir kural değişmez (eski kayıt/replay aynı).
- SRD 5.2.1 hizalamayı oyuncu karakterine kural olarak vermez; tamamen ev kuralıdır ve **varsayılan olarak yalnız anlatısal/gösterge**: mekanik ceza ya da bonus yok. Mekanik bağlar ayrı, tek tek açılan seçeneklerdir.

## Model
- İki eksen, her biri −50…+50 (toplam 101 nokta; tüm puanlar bu ölçeğe göredir): **Düzen ↔ Kaos** (D–K) ve **İyilik ↔ Kötülük** (İ–K). (0, 0) = Gerçek Tarafsız.
- Etiket 9 kutudan biri: eksen değeri ≥ +17 uç, ≤ −17 karşı uç, arası tarafsız. (Düzenli İyi, Tarafsız İyi, Kaotik İyi, Düzenli Tarafsız, Gerçek Tarafsız, Kaotik Tarafsız, Düzenli Kötü, Tarafsız Kötü, Kaotik Kötü.)
- Kutu değişimi 2 puan histerezisli (17'ye çıkınca uç olur, 15'e inene kadar kalır).
- Karakter kaydına `hizalanma: {duzen, iyilik, baslangic, gunluk[]}`; eski kayıtta alan yoksa 0,0 sayılır.

## Başlangıç konumu (sonda otomatik; oyuncu reddedip yalnız orta noktaya ya da orta çizgiye geçebilir)
- Kural açıkken, karakter oluşturmanın **son adımında** başlangıç otomatik hesaplanır: **geçmiş + sınıf + alt sınıf + ırk** katkılarının toplamı, ±50'ye kırpılır. Sonuç ızgarada ibre ve etiketle gösterilir; altında katkı satırları (her kalemin gerekçesi ve puanı, ırk/kültür satırı en altta).
- Oyuncunun seçenekleri: **Kabul et** ya da **Kabul etme**. Kabul etmezse ibre serbest dolaşmaz; yalnız şu üç yere geçebilir (ızgarada hesaplanan kutunun satırı ve sütunu üzerinden):
  1. **Orta nokta:** Gerçek Tarafsız (Düzen 0, İyilik 0).
  2. **Bulunduğu satırın orta çizgisi:** Düzen eksenini 0'a çeker, İyilik değeri aynı kalır (örn. Düzenli İyi → Tarafsız İyi).
  3. **Bulunduğu sütunun orta çizgisi:** İyilik eksenini 0'a çeker, Düzen değeri aynı kalır (örn. Düzenli İyi → Düzenli Tarafsız).
  Hesaplanan kutu zaten bir orta çizgideyse o seçenek görünmez (örn. Tarafsız İyi için "satır" seçeneği yok, sütun ve orta nokta kalır). Gerçek Tarafsız çıkarsa kabul etmeme seçeneği anlamsız olur ve gösterilmez. Uca ya da başka kutuya yerleşmek yok; ince ayar yok.
- Alt sınıf 3. seviyede seçilince (ya da değişince) otomatik hesap yeniden yapılır: oyuncu **Kabul etmişse** değer yeni toplama güncellenir ve oyuncuya bildirilir (kabul/yerleştir yine açık); oyuncu **kabul etmeyip orta noktaya/orta çizgiye geçmişse** değer değişmez, yalnızca "önerilen şu olurdu" bilgisi gösterilir.
- İsteğe bağlı GM ayarı: "başlangıç yalnız otomatik" (oyuncu kabul etmeme seçeneğini kullanamaz). Varsayılan: oyuncu kullanabilir.
- Kayda `baslangic` ve `baslangicTuru` ("otomatik" / "orta" / "satir-orta" / "sutun-orta") yazılır; sonradan yalnız GM "yeniden belirle" ile değiştirir (günlüğe yazılır).
- Katkı tabloları `data/hizalanma-baslangic.json`. Tabloda olmayan geçmiş/alt sınıf/ırk 0 sayılır, çökme yok.
- **Irk katkısı her iki eksende, her iki yönde olabilir** (hem Düzen↔Kaos hem İyilik↔Kötülük; artı ya da eksi). Puanlar küçüktür (en çok ±8) ve her biri evren içi **kültür/yetişme** gerekçesine bağlıdır; hiçbir ırkın toplam etkisi "baştan kötü" olacak kadar büyük değildir (İyilik ekseninde en düşük −2). SRD 5.2.1 ırklara hizalama bağlamaz; bu yüzden tamamen ev kuralıdır ve kural anahtarında ırk katkısı ayrıca kapatılabilir (`hizalanmaIrk`, varsayılan açık). Oyuncu sonuçtan memnun değilse orta noktaya ya da orta çizgiye geçebilir.
- **Irk tablosu (Düzen, İyilik; gerekçe; ±50 ölçeği):** Dragonborn (+5, −2; klan onuru ve gurur) · Dwarf (+8, −2; gelenek, söz ve inat) · Elf (−4, +3; kendi yolunu çizen uzun ömür) · Gnome (−3, +4; merak ve oyunbazlık) · Goliath (+6, −3; acımasız ama adil rekabet) · Halfling (+3, +5; yuva ve topluluk) · Human (0, 0; çeşitlilik) · Orc (+6, −2; klan bağı ve sert hayatta kalma) · Tiefling (−8, −3; dışlanmışlık ve güvensizlik) · Celestial (+5, +8; ışığa bağlı yetişme). Alt soylar (Drow vb.) ekstra puan taşımaz.
- **Sınıf, geçmiş, alt sınıf katkıları (Düzen, İyilik):**
  - Sınıf: Barbarian (−10, 0) · Bard (−12, +10) · Cleric (+10, +10) · Druid (0, +5) · Fighter (+8, 0) · Monk (+15, 0) · Paladin (+20, +15) · Ranger (0, +5) · Rogue (−12, −10) · Sorcerer (−10, 0) · Warlock (−5, −5) · Wizard (+5, 0).
  - Geçmiş (SRD): Acolyte (+10, +5) · Criminal (−12, −9) · Sage (+5, 0) · Soldier (+10, −3). Diğer geçmişleri CC adından/temasından makul değerle doldurur ve raporlar.
  - İmza alt sınıflar: Fighter İmparator (+12, −30) · Rogue İnfazcı (−13, −26) · Ranger Çiftçi (+5, +10) · Barbarian Geride Kalan (−10, +5) · Bard Şair Koleji (−8, +14) · Cleric Birlik Manastırı (+10, +10) · Monk Yaşlı Bilge (+15, +5) · Paladin Hızır Yemini (+10, +20) · Wizard Harita Öğretisi (+10, 0) · Warlock Astrolog (+5, 0) · Sorcerer Dunganga (0, −10) · Karadul Çemberi (−10, −15). SRD alt sınıflar: tema adına göre CC doldurur (ör. Paladin Devotion +, Rogue Thief −).
- **Uç buildler (±50 ölçeği; hepsi 3. seviye, alt sınıf dahil):**
  - **Düzenli İyi:** Paladin + Acolyte + Hızır Yemini + Celestial = D +45, İ +48.
  - **Kaotik İyi:** Bard + Criminal + Şair Koleji + Elf = D −36, İ +18 (İyilik eşiği +17'yi geçer → Kaotik İyi).
  - **Düzenli Kötü:** Fighter + Soldier + İmparator + Goliath = D +36, İ −36.
  - **Kaotik Kötü:** Rogue + Criminal + İnfazcı + Tiefling = D −45, İ −48.
  - Başlangıç sınırı ±50 olduğu için hiçbir kombinasyon ±50'yi geçmez. Bu dört satır K51 testine sabit beklenti olarak girer.
  - Not: uçtaki bir karakter eksenin neredeyse sonunda başlar; o yönde ilerleyecek yeri kalmaz, yalnız geri çekilebilir (vicdan/dönüşüm mekaniği tam bu durumda anlamlı).

## GM aracı (elle)
- GM ekranında "Hizalanma" paneli: seçili karakter için 3×3 ızgarada ibre, iki eksen çubuğu, başlangıç noktası işareti, son günlük kayıtları.
- Hazır eylem düğmeleri (iki eksene ± puan; değerler `data/hizalanma-olaylari.json` içinde, GM değiştirebilir):
  - Merhamet gösterdi: İ +3 · Teslim olanı öldürdü: İ −5, D −2 · Söz tuttu: D +3 · Yeminini bozdu: D −5 · Yasayı çiğnedi (haklı gerekçeyle): D −3 · Masumu korudu: İ +4 · Zorbalık/işkence: İ −5 · Rüşvet/hırsızlık: D −3, İ −2 · Kendini feda etti: İ +5.
  - Serbest: GM bir eksen ve miktar (−10…+10) girer, kısa gerekçe yazar.
- Her değişim günlüğe yazılır (kim, ne, kaç puan, gerekçe, oturum/tur) ve geri alınabilir.
- Aynı olay türü art arda 3. kez etkisini yarıya indirir (yalnız GM düğmeleri; serbest girişe uygulanmaz).

## Görünüm
- Karakter kartında küçük etiket ("Kaotik İyi"), dokununca ibre. Varsayılan herkese görünür; GM "gizli" yapabilir. Kayıt karakterle gider.

## Moral (Motivasyon) bağı (`hizalanmaMoral`, varsayılan KAPALI; ikisi de açıksa çalışır)
Fikir: karakter kendi hizalanmasına ters düşerse vicdan azabı (Moral kaybı), uygun davranırsa iç huzur (Moral kazancı); Moral çökünce de insan savrulur (ibre kolay kayar).
1. **Vicdan çatışması (kayıp):** GM olay düğmesi ya da Serüven seçimi bir eksene ±puan verirken, karakterin o eksendeki değeri ±17'ün ötesindeyse (güçlü yönlü) ve olay ibreyi **ters yöne** ≥3 puan çekiyorsa karakter Moral −1 alır (olay ≥5 puansa −2). Tarafsız eksende (|değer| < 17) çatışma sayılmaz. Olay başına en çok −2; karakter başına günde en çok −3.
2. **İç huzur (kazanç):** Aynı koşulda olay ibreyi **aynı yöne** ≥3 puan çekiyorsa Moral +1; karakter başına her uzun dinlenmede en çok +1 (suistimal edilemez, "iyilik yap, moral kazan" döngüsü olmasın).
3. **Savrulma (Moral → hizalanma):** Moral ≤ 1/3 iken hizalanma olaylarının puanı ×1.5 olur (kolay kayar); Moral > 1/3 iken ×1. Çökmüş/Bunalmış karakter için ek kural yok.
4. **Şahit kuralı (ilk sürümde YOK):** Bir müttefik karşı hizalamada ağır eylem yaparsa şahitlerin Moral kaybı fikri sonraya; ilk sürümde gürültü yaratmasın.
5. **Gerçek Tarafsız:** Çatışma da huzur da yaşamaz (her iki eksen < 17); esneklik avantajı ve sıkıcılık bedeli olarak kalır. Karakter kutu dışına çıktıkça mekanik de devreye girer.
6. **Veri:** Olay/seçenek tek bir `hizalanmaEtki` taşır; Moral hesabı bundan türer, ayrıca `moralEtki` yazılmaz. Mevcut Moral kayıplarıyla (Birlik Can Havuzu paylaşımı vb.) çakışmaz: vicdan kaybı yalnız eylemi yapan karakterde, paylaşım kancalarına girmez.
7. **Hafif/tam mod:** Hafif modda yalnız Serüven'de ve GM düğmelerinde çalışır; savaş içi eylem (öldürme, merhamet) GM düğmesiyle işlenirse tam modda aynı kural geçerli. Savaş motoruna kural sürümü gerektiren yeni mekanik eklemez.
8. **Denge:** Sayılar (−1/−2, +1, ×1.5, ±17 eşiği) Moral denge turunda ölçülür; kayıp tablosu zaten orada ayarlanıyor.

9. **Yol değiştirme (dönüşüm) güvenliği:** Vicdan çatışması Moral'i **1'in altına indirmez** (hizalanma değiştirmeye çalışırken karakter Moral ölümüyle ölmesin; ölüm yalnız başka kayıplardan olur). Kötü birinin iyiye dönmesi (ya da tersi) bu yüzden **zaman ve sabır** ister: her ters eylem Moral'e mal olur, Moral dinlenmeyle dolar, böylece değişim doğal olarak yavaşlar.
10. **Yeni yol ödülü:** Karakterin etiketi bir eksende ±17 eşiğini aşarak değişirse (örn. Kötü → Tarafsız ya da Tarafsız → İyi) tek seferlik Moral +2 ("yeni bir yol buldu"), karakter başına eksen başına bir kez. Eksen eşiğin içine girince (|değer| < 17) çatışma da biter; yani dönüşümün en zor kısmı eşiğe kadar olan yoldur.
11. **Aynı olay tekrarı:** Azalan getiri (hizalanma günlüğü kuralı) dönüşümde de geçerli; sabırsızlıkla aynı iyiliği üst üste yapmak ibreyi hızlandırmaz. Farklı türde eylemler gerekir.

## Diğer mekanik bağlar (hepsi AYRI anahtar, varsayılan KAPALI)
1. **Yemin bağı (`hizalanmaYemin`):** Paladin ve Cleric: yemin hizalamasının tersi uca geçince GM'e "yemin sınavı" uyarısı; ceza yok. (Moral bağıyla birlikte: yemin hizalamasına ters eylem vicdan çatışmasını zaten tetikler.)
2. **Büyü bağı (`hizalanmaBuyu`):** Detect Evil and Good, Protection from Evil and Good, Holy Word/Blasphemy hedefin İ eksenine bakar (≤ −17 Kötü, ≥ +17 İyi). Yaratık türü kuralı önceliklidir.

## Serüven (sonra, kilit açılınca)
- Yolculuk/olay seçenekleri `hizalanmaEtki: {duzen, iyilik}` taşır; seçim yapılınca otomatik günlüğe işlenir (GM düğmeleriyle aynı veri biçimi).

## Motor ihtiyaçları (CC)
- `data/hizalanma-olaylari.json`, karakter kaydı alanı + eski kayıt uyumu (kayıt sürümü artar), oluşturucuda hizalanma adımı (son adım: otomatik sonuç + Kabul / orta nokta / satır-sütun orta çizgisi), `data/hizalanma-baslangic.json`, GM paneli, kart etiketi, günlük (ekle/geri al), azalan getiri, üç ayrı kural anahtarı. Testte: kapalıyken görünmez, otomatik başlangıç hesabı (sınıf/geçmiş/alt sınıf/ırk toplamı, kırpma, tabloda olmayan değer), kabul ve üç geçiş seçeneği (orta nokta, satır orta çizgisi, sütun orta çizgisi; hesaplanan kutu orta çizgideyken seçeneklerin gizlenmesi), alt sınıf sonradan seçilince davranış, ırk katkısı kapalı, eski kayıt, geri alma, histerezis, GM yeniden belirleme.
- Savaş kural sürümü değişmez.

## Açık sorular (varsayılan yazıldı)
1. Eksen aralığı ±50 (toplam 101 nokta), kutu eşiği ±17, başlangıç sınırı ±50: uygun mu? Daha kaba istenirse 5 kademe.
2. İlk kuyrukta panel + başlangıç seçimi + günlük + etiket; mekanik bağlar sonra (önerim).
