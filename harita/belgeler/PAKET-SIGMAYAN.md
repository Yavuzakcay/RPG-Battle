# Ek paket: savaş modeline sığmayan özellikler (Kuyruk P9, P10, P11)

P9'dan sonra "çalışmıyor" kalan özelliklerin P10 (kural sürümü 39) ve P11 (kural sürümü 42) sonrası durumu. **Paket metni görülmeden**, yalnızca özellik
adı, sınıf/alt sınıf ve seviyeyle yazıldı; yama yazan taraf (paket metnini bilen) kesin sınıfı belirler. Ek paket metni bu
belgeye girmez. Elle tutulur.

## P10 ile yazılabilir hâle gelenler (yamada denenecek)

| Özellik | Sınıf / alt sınıf / sv | Karşılayan ilkel (P10) | Kalan yaklaşıklık |
|---|---|---|---|
| Dengeyi Geri Yükle | sorcerer / otonom-evren / 1 | `tepki` olay `hedefAlindi` + etki `avantajSifirla` | Yalnız saldırı zarı (kurtulma/kontrol zarında yok) |
| Denge Arayışı | barbarian / kaos-yolu / 10 | `zarYenile` (P9) ya da `zarDegistir.mod: ikiAtSec` | Metne göre seçilmeli |
| Kontrol Sağlama | barbarian / kaos-yolu / 14 | `zarYenile.mod: ikiAtSec` / `zarDegistir.mod: ikiAtSec` | Metne göre seçilmeli |
| Gelişmiş Zarlar | fighter / ninja / 10 | `zarDegistir.mod: zarBuyut` (P7) | Paketin kendi zar havuzu P11'de (`zarHavuzu`, zar seviye tablosu) |
| Üstün Taktik | fighter / ninja / 18 | `zarDegistir.mod: ikiAtSec` | Havuz P11'de (`zarHavuzu.savasBasiEnAz`) |
| Misillemeli Sapma | bard / harp / 14 | `tepki` `dusmanBuyuAtiyor` + `buyuIptal` + `geriTepme` | — |
| Büyü Hırsızı | rogue / illuzyonist / 17 | `buyuIptal` (engelleme kısmı) | Çalma kısmı P11'de (`buyuIptal.calar`) |
| Şekil Değiştirici | wizard / simya / 10 | `buyuVer` + `bedava` (Polymorph) | "Yalnız kendine" P11'de (`buyuVer.yalnizKendine`) |
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
| Tektonik Yoğunluk | sorcerer / titan-kani / 1 | `canArtisi` + `koruma.durumAvantaji: [Prone]` | Kalanı P11'de (`koruma.itmeDirenci`, `buyuDegisimi.yetenekEki`) |
| Koruyucu Ruhlar | druid / cagri / 10 | `cagirGuclendir.turBasiCan` | — |

## P11 ile yazılabilir hâle gelenler (kural sürümü 42; yamada denenecek)

Kuyruk S2 (kural sürümü 41) iki silah satırını da kapattı (`silahFirlat`, `silahBagi`). Ayrıntı DECISIONS.md "Kuyruk P11"/"Kuyruk S2".

| Özellik | Sınıf / alt sınıf / sv | Karşılayan ilkel / alan | Not |
|---|---|---|---|
| Kusursuz İlham | bard / hatip / 6 | `ilham.iade` (`hedefte` / `kaynaga`) | Metne göre iki kipten biri |
| Usta Gösterisi | bard / akrobat / 14 | `ilham.kaynaksiz` + `zarBoyu` | — |
| Hücum Marşı ve Harp Eğitimi | bard / harp / 3 | `ilham.hedefler: [hasar, ac]` + `yetkinlik` (orta zırh, kalkan, harp silahları) | AC kullanımı ilhamlı dostun tepkisiyle |
| Kutsanmış Şifa | sorcerer / ilahi-kan / 6 | `zarDegistir` `kapsam: iyilestirme` (tetik pasif) | Büyü iyileştirmesi (`healed.rolls`) |
| İkiz Büyüleme | wizard / aldatma / 10 | `buyuDegisimi.ikiz` (+ kaynak) | Twinned Spell yolu: yukarı slotta ek hedef alan büyüler |
| Büyü Mühürleme | wizard / zamanalti / 10 | `buyuSakla` (`cast_spell.store`, `spell_followup` `sakli`) | — |
| Güç Deposu | bard / harp / 6 | `gucDeposu` (olay, zar, enCok) ya da `buyuSakla` | Metne göre |
| Kitabın Ruhu | wizard / hattat / 6 | `buyuDegisimi.konsantrasyonsuz` (+ kaynak) + `cikisCagri` | Çağıran büyüde konsantrasyonsuz uygulanmaz |
| Okyanusun Kavrayışı | warlock / kraken / 10 | `buyuVer.bedava` + `konsantrasyonsuz` | Varsayım: kaynaklı bedava büyü, konsantrasyonsuz |
| Sınırlı Dilek | warlock / cin / 14 | `buyuVer.kopyaEnCokSeviye` (+ kaynak) | Bilinmeyen büyü slotsuz |
| Büyü Hırsızı (çalma kısmı) | rogue / illuzyonist / 17 | `tepki` `buyuIptal` + `calar` | Çalınan büyü bir kez, slotsuz |
| Şekil Değiştirici (yalnız kendine) | wizard / simya / 10 | `buyuVer.yalnizKendine` | Başkasına slotla |
| Vahşi Öfke | ranger / coban / 11 | `cagirGuclendir.komutSaldiri` | Komut (`command_summons`) turunda ek saldırı |
| Analitik Dövüş | rogue / dedektif / 3 | `zarYarisi` + `kosul: zarYarisi` | Kazanınca savaş boyu avantajsız Sneak Attack |
| Büyü Direnci Aurası | paladin / antik / 7 | `aura` `etki: direnc` + `hasarKaynagi: buyu` | Büyü hasarı (saldırı, kurtulma, alan, büyü alanı) |
| Tektonik Yoğunluk (kalan) | sorcerer / titan-kani / 1 | `koruma.itmeDirenci` + `buyuDegisimi.yetenekEki: con` | Yakın büyü: menzil ≤ 5 ft (`menzilEnCokFt`) |
| Denge Arayışı | barbarian / kaos-yolu / 10 | `zarHavuzu` (ya da P9/P10 `zarYenile` / `ikiAtSec`) | Metne göre |
| Kontrol Sağlama | barbarian / kaos-yolu / 14 | `zarHavuzu` / `zarYenile.mod: ikiAtSec` | Metne göre |
| Gelişmiş Zarlar | fighter / ninja / 10 | `zarHavuzu.zar` seviye tablosu | — |
| Üstün Taktik | fighter / ninja / 18 | `zarHavuzu.savasBasiEnAz` | — |
| Element Rünü | barbarian / heybet / 6 | `silahFirlat` (S2) | Fırlatılan silah elden çıkmaz (genel Thrown basitleştirmesi) |
| Büyü Silahı Bağı | fighter / hokkabaz / 3 | `silahBagi` (S2) | — |

## Hâlâ sığmayanlar

Yok. (P10 bölümündeki "kalan yaklaşıklık" sütunu, o satırların özellik adıyla kalan farkını yazar.)

## Fırlatılan silahın elden çıkması (Kuyruk K58 G8)

Genel SRD Thrown kuralında fırlatılan silah elden çıkar, hedefin yanına düşer; paketin `silahFirlat` ilkeli ise silahı geri döndürür
(Element Rünü). Oyunda **genel** Thrown silahlar elden çıkmaz (basitleştirme; javelin, hançer, el baltası atan canavar ve
karakterler cephane gibi sınırsız atar). S2 el modeli (`heldItems.ts`, `drop_item`/`pick_up`) bunu taşıyabilir, ancak:

- Mekanik donması (Kuyruk K57, docs/MEKANIK-DONMA.md): yeni kural ve yeni komut akışı (otomatik düşürme, silah sayısı) eklenmez.
- Etkisi dengede büyük: fırlatan her canavar (SRD'de onlarca javelin/hançer atan) ilk atıştan sonra yakın dövüşe ya da
  yerden almaya döner; yapay zekâya "silahını al" davranışı ve karakterde silah adedi gerekir (K59 denge turuna bağlı).

Bu yüzden `silahFirlat` dönüşü pakette olduğu gibi kalır (geri döner); genel kural donma kalkınca kural sürümü kapısıyla
(eski kayıt aynı) ele alınmalı. Karar DECISIONS.md (Kuyruk K58).

