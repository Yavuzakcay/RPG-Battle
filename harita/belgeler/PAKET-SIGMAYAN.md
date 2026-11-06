# Ek paket: savaş modeline sığmayan özellikler (Kuyruk P9, P10)

P9'dan sonra "çalışmıyor" kalan özelliklerin P10 (kural sürümü 39) sonrası durumu. **Paket metni görülmeden**, yalnızca özellik
adı, sınıf/alt sınıf ve seviyeyle yazıldı; yama yazan taraf (paket metnini bilen) kesin sınıfı belirler. Ek paket metni bu
belgeye girmez. Elle tutulur.

## P10 ile yazılabilir hâle gelenler (yamada denenecek)

| Özellik | Sınıf / alt sınıf / sv | Karşılayan ilkel (P10) | Kalan yaklaşıklık |
|---|---|---|---|
| Dengeyi Geri Yükle | sorcerer / otonom-evren / 1 | `tepki` olay `hedefAlindi` + etki `avantajSifirla` | Yalnız saldırı zarı (kurtulma/kontrol zarında yok) |
| Denge Arayışı | barbarian / kaos-yolu / 10 | `zarYenile` (P9) ya da `zarDegistir.mod: ikiAtSec` | Metne göre seçilmeli |
| Kontrol Sağlama | barbarian / kaos-yolu / 14 | `zarYenile.mod: ikiAtSec` / `zarDegistir.mod: ikiAtSec` | Metne göre seçilmeli |
| Gelişmiş Zarlar | fighter / ninja / 10 | `zarDegistir.mod: zarBuyut` (P7) | Yalnız isabet hasar zarı (paketin kendi zar havuzu yok) |
| Üstün Taktik | fighter / ninja / 18 | `zarDegistir.mod: ikiAtSec` | Aynı |
| Misillemeli Sapma | bard / harp / 14 | `tepki` `dusmanBuyuAtiyor` + `buyuIptal` + `geriTepme` | — |
| Büyü Hırsızı | rogue / illuzyonist / 17 | `buyuIptal` (engelleme kısmı) | Engellenen büyüyü sonra kendin atma yok (aşağıda) |
| Şekil Değiştirici | wizard / simya / 10 | `buyuVer` + `bedava` (Polymorph) | "Yalnız kendine" kısıtı denetlenmez |
| Çevik Sıyrılma | rogue / kasif / 3 | `tepki` `dusmanYaklasti` + `hareketEt` (`yon: uzak`) | `hareketEt` yol bulmaz (ışınlanma girişi) |
| Kaçınılmaz Avcı | paladin / intikam-yemini / 7 | `tepki` `firsatSaldirisi` + `hizSifir` ve ikinci ilkel `hareketEt` (`yon: yakin`) | Aynı |
| Boyut Karşıtı Vuruş | paladin / muhafiz / 15 | `tepki` `buyuBasardi` + `hasarEkle` (ya da `dostaVuruldu` + `saldiriYap`, `kosul: hedefBuyuk`) | Metne göre seçilmeli |
| Karşı Darbe | ranger / ibliskiran / 15 | `tepki` `kurtulmaAttirildi` + `saldiriYap` | — |
| Doğaüstü Savunma | ranger / ibliskiran / 7 | `isaret.kurtulmaAvantaji` | Bonus yerine avantaj; kaynağı taşıyan kurtulmalarda |
| Zihinsel İtaat | warlock / muhterem / 14 | `kontrolEt` + `kurtulmasiz` (+ `sure: kalici`) | — |
| Ölümün Dostu | rogue / kamufle / 17 | `ekHasar.yanHedef` | Sınıfın Sneak Attack'ı değil, paketin ek zarı yan hedefe |
| Barış Azizi | cleric / baris / 17 | `ortakCan.direncler` | Havuz yerine üyelere direnç (aynı sonuç: havuza düşen hasar yarıya) |
| Gelişmiş Dev | fighter / pehlivan / 10 | `boyut.ekHasar` seviye tablosu (`{ "10": "1d8" }`) | — |
| Yoğunluk Ayarı | wizard / uzay-bukme / 2 | `hiz` (`hedef: dost/dusman`, eksi `artiFt`) | Ağırlık/zıplama etkisi yok |
| Flurry Şifası | monk / azizlik / 11 | `iyilestirme` (`tetik: isabet`, `kosul: [flurryVurusu]`) | Flurry kendisi Focus harcar ("Ki harcamadan" kısmı yok) |
| Tektonik Yoğunluk | sorcerer / titan-kani / 1 | `canArtisi` + `koruma.durumAvantaji: [Prone]` | İtmeye direnç ve yakın büyüye CON eki yok (aşağıda) |
| Koruyucu Ruhlar | druid / cagri / 10 | `cagirGuclendir.turBasiCan` | — |

## Hâlâ sığmayanlar

| Özellik | Sınıf / alt sınıf / sv | Neden sığmıyor | CC önerisi |
|---|---|---|---|
| Kusursuz İlham | bard / hatip / 6 | Bardic Inspiration zarının harcanması sınıf kaynağı yolunda (`bardicInspiration`); başarısızlıkta geri verme kancası yok | İlham zarı sonucu olayına (`bonusDice`) kaynak iadesi kancası |
| Usta Gösterisi | bard / akrobat / 14 | Kaynak yokken ücretsiz d6 ilham: ilham zarı türü ve kaynaksız kullanım sınıf yolunda | Aynı kanca + `zarBoyu` alanı |
| Kutsanmış Şifa | sorcerer / ilahi-kan / 6 | İyileştirme olayı (`healed`) zarları taşımıyor; büyü iyileştirmesi `spells.ts` içinde | `healed.rolls` + `zarDegistir.kapsam: iyilestirme` |
| İkiz Büyüleme | wizard / aldatma / 10 | Tek hedefli büyüyü ikinci hedefe uygulamak yapımı ikinci kez çalıştırır (eylem, yuva, Counterspell, konsantrasyon) | Büyü yapımına `targetIds` (Twinned Spell yolu) ve paket izni |
| Büyü Mühürleme | wizard / zamanalti / 10 | "Bekleyen büyü" durumu (sakla, sonra ateşle) komut modelinde yok | Süren etki `storedSpell` + `spell_followup` ile ateşleme |
| Güç Deposu | bard / harp / 6 | Aynı (depolanan güç sonra hasara) | Aynı + depo sayacı |
| Kitabın Ruhu | wizard / hattat / 6 | Konsantrasyonsuz büyüde, konsantrasyona bağlı etkiler reducer'da düşer (`pruneEffects`) | Etkiye `concentration` yerine `until` yazan yapım seçeneği |
| Okyanusun Kavrayışı | warlock / kraken / 10 | Ad tek başına mekaniği belirlemiyor | Paket metniyle yeniden değerlendirilmeli |
| Sınırlı Dilek | warlock / cin / 14 | Wish benzeri büyü kopyalama yalnız `spells69` Wish'inde; paket tetiği yok | `buyuVer` + `kopya: { enCokSeviye }` |
| Büyü Hırsızı (çalma kısmı) | rogue / illuzyonist / 17 | Savaş sırasında yeni büyü verme (hazır büyüler savaş kuruluşunda) | Süren etki `grantSpell` + slotsuz kullanım |
| Vahşi Öfke | ranger / coban / 11 | Yönetilen/çağrılan yaratığa komutla ek saldırı: çağrının saldırı sayısı sahibin komutuyla değişmiyor | `cagirGuclendir.komutSaldiri` (komut turunda Multiattack +1) |
| Analitik Dövüş | rogue / dedektif / 3 | Karşılaştırmalı zar yarışı (contest) ilkel düzeyinde yok | `kosul: zarYarisi` + yarışı atan bonus eylem |
| Büyü Direnci Aurası | paladin / antik / 7 | Hasarın büyüden geldiği hasar uygulama noktasında taşınmıyor (`adjustDamage` profil yalnız tür) | Büyü hasarı olaylarına kaynak bayrağı + `direnc.kaynak: buyu` |
| Element Rünü | barbarian / heybet / 6 | Silaha fırlatma ve ele dönme özelliği eklemek silah modelini değiştirir | Silahta `thrownReturn` (eşya düzeyi) |
| Büyü Silahı Bağı | fighter / hokkabaz / 3 | Silahı ele ışınlama için eşya bırakma/çağırma (el boşluğu) modeli yok | Eşya modeli gelince |
| Hücum Marşı ve Harp Eğitimi | bard / harp / 3 | Zırh/kalkan yetkinliği oluşturucu verisi; dostun ilham zarını hasara/AC'ye ekleme ilham yolunda yok | Oluşturucuda paket yetkinliği + ilham zarı hedef türü |
| Tektonik Yoğunluk (kalan) | sorcerer / titan-kani / 1 | İtmeye karşı avantaj (zorla hareket kurtulmasız) ve yakın büyüye CON eki | `forcedMove` direnci + `buyuDegisimi.yetenekEki` |
