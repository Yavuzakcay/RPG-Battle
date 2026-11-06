# Ek paket: savaş modeline sığmayan özellikler (Kuyruk P9)

Kuyruk P9'un hedef listesindeki 51 özellikten (P7 sonrası 48 "çalışmıyor" + 3 "planlı") P9 ilkelleriyle de yazılamayanlar.
**Paket metni görülmeden**, yalnızca özellik adı, sınıf/alt sınıf ve seviyeyle yazıldı; yama yazan taraf (paket metnini bilen)
kesin sınıfı belirler. Ek paket metni bu belgeye girmez. Elle tutulur.

| Özellik | Sınıf / alt sınıf / sv | Neden sığmıyor | CC önerisi |
|---|---|---|---|
| Dengeyi Geri Yükle | sorcerer / otonom-evren / 1 | Saldırı zarı atıldıktan sonra avantaj/dezavantajı kaldırmak için atış kipini geri alan bir giriş yok (zar defteri tek atış) | `tepki` etkisi `avantajSifirla`: hedef alınma kancasında (`registerTargeted`, zardan önce) kip `normal`e zorlanır |
| Denge Arayışı | barbarian / kaos-yolu / 10 | Aynı (avantaj/dezavantajı sıfırlama) | Aynı `avantajSifirla` |
| Kutsanmış Şifa | sorcerer / ilahi-kan / 6 | İyileştirme zarları ayrı yoldan (`healed`); `zarDegistir` yalnız isabet hasarında | `zarDegistir.kapsam: iyilestirme` (büyü iyileştirme ifadesine kanca) |
| İkiz Büyüleme | wizard / aldatma / 10 | Tek hedefli büyüyü ikinci hedefe uygulamak büyü yapımını iki kez koşturmayı ister (slot, konsantrasyon, tepkiler) | `buyuHedefEkle`: yapım öncesi hedef listesine ekleme (`cast_spell.targetIds`, Twinned Spell yolu) |
| Büyü Mühürleme | wizard / zamanalti / 10 | Büyüyü saklayıp sonra patlatmak için "bekleyen büyü" durumu yok | `buyuDepola`: süren etki olarak saklı büyü + `spell_followup` ile ateşleme |
| Güç Deposu | bard / harp / 6 | Aynı (depolama) | Aynı `buyuDepola` |
| Okyanusun Kavrayışı | warlock / kraken / 10 | Ad tek başına mekaniği belirlemiyor; P7'de durum/yakalama ilkelleri vardı ve yine "çalışmıyor" kaldı | Paket metniyle yeniden değerlendir |
| Vahşi Öfke | ranger / coban / 11 | Yoldaşa komutla çoklu saldırı: çağrının eylem sayısını sahibinin komutu artırmıyor | `cagirGuclendir.komutSaldiri` (komut edilen turda Multiattack +1) |
| Element Rünü | barbarian / heybet / 6 | Silaha fırlatma ve geri dönme özelliği eklemek silah modelini (Thrown, geri dönüş) değiştirir | Eşya/silah düzeyinde `thrownReturn` alanı |
| Büyü Silahı Bağı | fighter / hokkabaz / 3 | Silahı mühürleme ve ele ışınlama için eşya bırakma/çağırma modeli yok | Eşya modeli (el boşluğu) gelince |
| Hücum Marşı ve Harp Eğitimi | bard / harp / 3 | Zırh/kalkan yetkinliği oluşturucu verisi; dostun İlham zarını hasara/AC'ye ekleme Bardic Inspiration yolunda yok | Oluşturucu yetkinlik alanı + ilham zarı hedef türü |
| Ölümün Dostu | rogue / kamufle / 17 | Sinsi Saldırı'yı yan hedefe aktarmak Sneak Attack çözümünü ikinci hedefe bölmeyi ister | `ekHasar.hedef: yanHedef` (isabet sonrası ikinci hedef seçimi) |
| Analitik Dövüş | rogue / dedektif / 3 | Karşılaştırmalı zar yarışıyla Sinsi Saldırı koşulu açma yok | `kosul: zarYarisi` (bonus eylemle karşılıklı kontrol) |
| Barış Azizi | cleric / baris / 17 | Ortak can havuzu hasarı üye başına direnç uygulamıyor (havuz tek sayı) | `ortakCan.direncler` (havuza düşen hasar türüne göre yarıya) |
| Büyü Direnci Aurası | paladin / antik / 7 | Hasarın kaynağı (büyü mü) hasar uygulama noktasında taşınmıyor | `direnc.kaynak: buyu` + büyü hasarı olaylarına kaynak işareti |
