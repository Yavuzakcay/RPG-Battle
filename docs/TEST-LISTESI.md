# Cihaz test listesi (2026-11-04)

Bu listedeki her şey `wip/h3` dalında (son dal; altındaki bütün dallar içinde). Her maddede ✔ / ✘ ve kısa not yeter; ✘ ise ekran görüntüsü ve "ne yaptım → ne bekledim → ne oldu" üç satırı.

## 0. Hazırlık

```powershell
git fetch origin
git checkout wip/h3
git pull
npm install
npm run harita-karo          # dünya karoları (kaynak: assets-ham/harita/dunya/dunya-final-v47.png; v48 ise --kaynak ile ver)
npm run dev
```

- `npm run harita-karo` çıktısındaki rapor satırını yaz: karo sayısı, toplam boyut, ilk yükleme (z0–z2 + manifest) ve 1 MB karşılaştırması. Bunları bulutta ölçemedim.
- Mümkünse iki cihaz: masaüstü tarayıcı ve telefon (telefonda `npm run dev -- --host`, aynı ağdan aç).

## 1. Dünya haritası (en çok değişen yer)

Serüven → üst çubuk "Dünya haritası". Ayrıca adres çubuğuna `#dunya` (Harita Keşfi, sissiz).

**Karo dikişleri (H3; bulutta yeniden oluşturamadım, en önemli kontrol)**
- [ ] Yakınlaştır/uzaklaştır (tekerlek, kıstırma, + / −): z3, z4, z5 seviyelerinde karolar arasında 1 px açık çizgi var mı? Dikey ve yatay ayrı ayrı bak.
- [ ] Kesirli yakınlaştırmada (tekerleği yavaş çevir) çizgi beliriyor mu?
- [ ] Telefonda da aynı (telefonun piksel yoğunluğu kesirli olabilir).
- [ ] Karo kalitesi 95'e çıktı: görsel keskin mi, ilk açılış yavaş mı?

**Etiketler**
- [ ] Uzakta yalnızca kıta/deniz/bölge adları; yaklaştıkça yerleşimler, sonra yer adları.
- [ ] "Khadyrga Limanı" tek etiket, uzaktan da görünüyor; başka yerde "Kadırga" yok.
- [ ] "Kraken'in Gözü" gözün altında, okunur; gözde yalnızca mavi genişleyen halka, sarı nokta yok.
- [ ] Dil İngilizce'ye alınınca etiketler İngilizce.
- [ ] `konum_kesin: false` etiketleri gerçek görselde doğru yerde mi (özellikle Kum Buzulu, Charisific Mağarası, Hexonya).
- [ ] Gizli geçit etiketi, Heykel Mağarası keşfedilmeden görünmüyor.

**Simgeler ve tıklama (H1, H2b)**
- [ ] Sarı kareler yok; yerleşim = ev, iskele = çapa, savaş düğümü = çapraz kılıç, yer = pusula yıldızı. Uzakta kayboluyor, yakında beliriyor.
- [ ] Simgeler etiketlerin üstüne binmiyor (etiketin altına kayıyor).
- [ ] Bir **ev ya da çapaya** tıkla: ad + tür + "Buraya git" kartı açılıyor mu? İskelede "Gemi" düğmesi.
- [ ] Serüven'de "Buraya git" parti yürüyor; Harita Keşfi'nde kamera oraya gidiyor.
- [ ] Bir **Serüven düğümüne** tıkla: harita kapanmıyor; bulunduğun sayfadaki düğümde bilgi kartı haritanın üstünde açılıyor; başka sayfadaki düğüme parti yürüyor.
- [ ] Telefonda simgelere parmakla isabet etmek kolay mı?

**Khadyrga iskelesi ve gemi**
- [ ] Çapa havzanın içinde (güney rıhtım önü), açık denizde değil; gemi rotası (kesik mavi çizgi) çapadan çıkıp kanaldan denize açılıyor.
- [ ] Gemiyle Khadyrga'ya git, sonra karada yürümeye çalış: takılıyor mu?

**Hapishane Adası (H2a)**
- [ ] Su altı günlerinde tam daire katman; gemi ve iskele görünmüyor. (Bilinen: görselin sol/üst kenarı daireyi kesiyor, düz kenar görünür; görsel düzeltilmeli.)
- [ ] Yüzeye çıkış gününde katman yumuşakça kayboluyor, iskele beliriyor. Gün değiştirmek için uzun dinlenme yap (ya da yürüyerek saat ilerlet); her 7. günün ilk 6 saati yüzeyde.

**Serbest gezinti (K47)**
- [ ] Haritada boş yere dokun: parti yürüyor, animasyon dokununca atlanıyor; saat ilerliyor (alttaki şeritte gün/saat).
- [ ] Denize, büyük nehre, uçuruma tıklayınca "yürünemez" mesajı.
- [ ] Yürürken karşılaşma oluyor mu (şeritte yazar)? Karşılaşma henüz savaşa bağlanmıyor (bilinen eksik).
- [ ] Mielikki Gölü yakınında mor "?" işareti (pasif Algı yüksekse) → dokununca beceri sınavı.
- [ ] Hızlı seyahat paneli: gemi yalnızca iskeleden iskeleye; uçuş için bayrak gerekir.
- [ ] Keşif sisi: yürüdükçe açılıyor, kayıt yükleyince aynı kalıyor.
- [ ] Mini harita sürüklenince/tıklanınca kamera gidiyor.

## 2. Su Altı Geçidi

- [ ] Vaha ↔ Mielikki Gölü bağlantısı: harita yeni yönde (şelale solda, vaha sağda).
- [ ] Eski bir kayıtta (geçit daha önce oynanmışsa) jetonlar doğru tarafta mı?
- [ ] Şelale geçidi bayrağı varsa "Gizli geçit" düğmesi, sınavsız ve anında geçiyor.

## 3. Celestial ırkı (K20, ev kuralı)

Ayarlar → "Game Master: Celestial ırkı (ev kuralı)".
- [ ] Kapalıyken oluşturucuda Celestial kartı yok; mevcut Celestial karakter yine düzenlenebiliyor.
- [ ] Açınca kart "(ev kuralı)" etiketiyle görünüyor; hikâye metni, özellik listesi, 3 Göksel Uyanış kartı (Parlayan Ruh / Gece Gözyaşı / Kırık Kanat). TR ve EN metin.
- [ ] 1–2. seviyede Uyanış "3. seviyede açılır" diyor.
- [ ] Savaşta (Game Master kurulumunda ev kuralları listesinde `Celestial` açık gelmeli):
  - [ ] Light büyüsü listede.
  - [ ] Şifa Eli: eylemle bitişik dosta; ikinci kullanım reddediliyor; uzun dinlenmeden sonra geri geliyor.
  - [ ] Parlayan Ruh: tur sonunda 10 ft içindeki düşmanlara ışıltı hasarı (dostlara değil); turda bir kez isabete +yeterlilik ek hasarı.
  - [ ] Gece Gözyaşı: yakındaki düşmanlar korkuyor (WIS save).
  - [ ] Kırık Kanat: yalnızca kendi turunda süzülüyor (yarım hız), tur sonunda iniyor. Lav/derin su üstünde turu bitirince ne oluyor? (yaklaşık kural; gözlem yaz)
  - [ ] Yapay zekâ oynayınca Celestial bu özellikleri mantıklı kullanıyor mu?
- [ ] Ev kuralı kurulumda kapatılınca özellikler savaşta yok, yalnızca direnç + karanlık görüş.

## 4. Denge ve yapay zekâ

- [ ] **Drow (Elf) partisi** 5. seviye: yapay zekâ artık herkesle Faerie Fire atmıyor; büyücü Fireball kullanıyor mu?
- [ ] Bard / büyücü partisinde Hypnotic Pattern, Faerie Fire hâlâ uygun durumda kullanılıyor mu (gerilemedi mi)?
- [ ] Volkan Serüveni 3. seviye: Lav Tapınağı artık geçilebilir mi (eskiden %20)?
- [ ] Seferlerde uzun dinlenme durağı (Volkan "kamp", Derinlikler "gece kampı") çalışıyor mu?
- [ ] Game Master kurulumunda yenilenen düşman (Troll vb.) varken ateş/asitsiz parti uyarısı çıkıyor mu?
- [ ] Orc, Tiefling, Dragonborn partileri belirgin güçlü mü (simülasyonda %82–85)? Oynarken "fazla kolay" hissi notu.

## 5. Ad ve genel

- [ ] Sekme başlığı, açılış ekranı, giriş ekranı: "Dice & Hex".
- [ ] Ayarlar → Hakkında/Atıflar: "Dice & Hex" ve SRD atfı.
- [ ] Eski kayıtlar (karakterler, Serüven, savaş kaydı) açılıyor mu? (anahtarlar değişmedi)

## 6. Serbest arama (kusur avı)

Bunlara ayrıca bak, beklenmedik her şeyi yaz:
- Telefonda dikey/yatay çevirme; dünya haritası, kartlar ve paneller taşıyor mu?
- Hızlı ardışık tıklama (çift dokunma = yakınlaştırma) istenmeyen yürüme başlatıyor mu?
- Dünya haritasını açıp kapatınca Serüven ekranı doğru yerde mi; savaştan dönünce harita durumu.
- Ses: dünya haritasında müzik/ortam sesi davranışı.
- Performans: harita kaydırırken takılma, telefon ısınması.
- Konsolda hata (F12 → Console) varsa kopyala.

## Bilinen eksikler (bunları kusur olarak yazmana gerek yok)

- Dünya haritasında karşılaşma → savaş geçişi, yüzme geçitleri, ayak izi, NPC öğrenme yok.
- Kraken'de tıklanabilir düğüm yok (yalnız efekt).
- Hapishane katman görselinin sol/üst kenarı düz.
- Akhalat, Akrepler, Dragos adalarının suya oturması ve Orion Yamaçları halosu harita görselinde düzelecek.
