# Alt sınıf özelliği × görsel tablosu (Kuyruk E3)

`npm run efekt-tablosu` üretir (`scripts/buyu-efekt-tablosu.mjs`, kurallar `scripts/lib/buyu-efekt.mjs` `ILKEL_GORSEL`); elle düzenlenmez. Salt okuma. Paket metni (açıklama) yazılmaz: yalnız kimlik, ad, sınıf/alt sınıf, seviye, ilkel türü, aile ve sayı.

**Ek paket bu kopyada yok** (`icerik/` gitignore). Ek paket satırları yerine kurgusal fikstürler (`tests/fixtures/paket-*.json`, 7 dosya) kullanıldı; ilkel → görsel eşlemesi (2. bölüm) gerçek paket için de aynıdır. Gerçek 97 alt sınıf / 395 özellik için yerelde `npm run efekt-tablosu` (ya da `npm run efekt-tablosu -- <klasör>`) çalıştırın; belge yeniden üretilir. Beklenen dağılım için `harita/belgeler/PAKET-DURUM.md` (yerelde üretilir).

**Durum:** hazır (özel bağlı efekt var), genel (yedek/varsayılan görsel), eksik (görsel yok, gerekir), gerekmez (pasif sayı/beceri/kaynak; günlük ve kart yeter), planlı/hikâye (savaşta etkisi yok). Özelliğin durumu ilkellerinin en kötüsü (gerekmez sayılmaz).

Kaynaklar: çekirdek 4 = listede görünen SRD alt sınıfları (Circle of the Land, Champion, Hunter, Thief; diğer 8 SRD alt sınıfı `data/alt-sinif-gorunum.json` `kaldirilan`). İmza: `data/imza.json` (11 alt sınıf; özellik → `eylemler`/`pasifler` alanlarından ilkel) + Karadul Çemberi (`data/karadul.json`, `src/battle/karadul.ts`). Olay yolları: paket `src/battle/paket/index.ts`, imza `src/battle/imza*.ts`, aura `auraCore.ts` (etki `auras` → groundFx).

## 1. Özet

| Kaynak | Alt sınıf | Özellik | Hazır | Genel | Eksik | Gerekmez | Planlı/hikâye |
|---|---|---|---|---|---|---|---|
| SRD çekirdek | 4 | 21 | 2 | 1 | 2 | 16 | 0 |
| imza | 11 | 66 | 6 | 7 | 19 | 32 | 2 |
| imza (Karadul) | 1 | 6 | 2 | 3 | 1 | 0 | 0 |
| kurgusal fikstür | 31 | 128 | 14 | 23 | 54 | 36 | 1 |

### Aile özeti (aynı aile tek satır)

| Aile | Özellik | Alt sınıf | Çözüm | Özellikler (alt sınıf/özellik) |
|---|---|---|---|---|
| Tepki parıltısı (Shield, Feather Fall, paket tepkileri) (`tepki-koruma`) | 25 | 11 | kod | hunter/superior-hunters-defense, denge-muhafizi/denge-sozu, denge-muhafizi/siyrilan-adim, denge-muhafizi/av-takibi, denge-muhafizi/karsi-darbe, karsi-buyu/geri-tepen, karsi-buyu/basarili-buyu, el-cabuk/calma, kehanet-okulu/yazgi-sozu, demir-siper/siper-ol, kemik-cagirici/kemik-kalkan, kemik-cagirici/kemik-ayna, kemik-cagirici/kirik-kemik, tunc-kalkan/muhafiz-hatti, tunc-kalkan/diken, demir-nobet/durdurucu, demir-nobet/lanet-karsilik, demir-nobet/komsu-vurus, demir-nobet/siyrilma, demir-nobet/kacamaz, demir-nobet/buyu-kesici, demir-nobet/buyu-avcisi, kehribar-nobetci/kalkan-sozu, kehribar-nobetci/tas-deri, ruzgar-kartali/ruzgar-perdesi |
| İşaret simgesi ve bağ çizgisi (`isaret-bag`) | 25 | 16 | E2 + kod | imza_imparator/royal-word, imza_infazci/verdict, imza_ciftci/provisions, imza_dunganga/lullaby-blood, imza_dunganga/call, imza_astrolog/star-reading, imza_astrolog/seal-of-fate, imza_birlik/forge-bond, imza_birlik/shared-vitality, imza_sair/verse, imza_sair/master-poet, imza_harita/mark-the-ground, imza_harita/rewrite-the-ground, imza_harita/birds-eye, denge-muhafizi/av-isareti, denge-muhafizi/zincir, denge-muhafizi/birlik, zaman-muhru/muhur, ezgi-deposu/depo, tunc-kalkan/meydan, birlik-yolu/ortak-yurek, demir-nobet/lanet-isareti, zaman-katibi/buyu-ortakligi, zaman-katibi/olu-efendisi, kehribar-nobetci/av-isareti |
| Güçlendirme/zayıflatma oku (sayı oku ikonları) (`ikon-ok`) | 19 | 15 | E2 + kod | imza_imparator/exalted-throne, imza_astrolog/star-reading, imza_birlik/forge-bond, imza_bilge/nimble-elder, imza_bilge/final-lesson, imza_hizir/hastening-road, imza_harita/birds-eye, denge-muhafizi/agirlik, nagme-okulu/iade, nagme-okulu/bedava, nagme-okulu/mars, tas-kani/yogunluk, taktik-zar/taktik, kehanet-okulu/kehanet-zarlari, kehanet-okulu/sakin-zihin, tunc-kalkan/tunc-beden, demir-nobet/pusu-oncusu, kehribar-nobetci/tetik-gozu, ruzgar-kartali/kanat-cirpisi |
| Aura bağlama (mevcut aura şeritleri, eksik bağ) (`aura-bagla`) | 9 | 8 | kod | imza_imparator/crown-presence, imza_hizir/aura-hard-times, suru-cobani/komut, buyu-kalkani/kalkan-aura, birlik-yolu/kalkan-aurasi, birlik-yolu/isik-aurasi, suru-cemberi/suru-gucu, zaman-katibi/ruh-besleme, kul-cagirani/sicak-hale |
| Tek hedef büyü darbesi (save’li, saldırısız) (`tek-hedef`) | 8 | 6 | kod | imza_ciftci/provisions, imza_ciftci/harvest, imza_sair/verse, imza_sair/master-poet, imza_bilge/greater-mind-might, karadul-cemberi/final-kiss, birlik-yolu/dokunulmaz, kul-cagirani/kul-patlamasi |
| Silah parıltısı (smite, büyülü silah) (`silah`) | 7 | 6 | E2 + kod | karadul-cemberi/widow-venom, denge-muhafizi/yan-vurus, tunc-kalkan/buyulu-yumruk, tunc-kalkan/dev-avcisi, demir-nobet/pusu-oncusu, ruzgar-kartali/firtina-oku, bag-muhafizi/kilic-bagi |
| Paket çağrısının renkli portalı (`cagir-renk`) | 6 | 4 | kod | kemik-cagirici/kemik-diriltme, suru-cemberi/suru, suru-cemberi/son-koruyucu, zaman-katibi/ruh-cagrisi, kul-cagirani/kul-surusu, kul-cagirani/kor-cagrisi |
| Geçici HP kazanımı (`gecici-can`) | 5 | 4 | kod | imza_birlik/vigil, imza_sair/verse, imza_sair/master-poet, demir-nobet/sert-beden, safak-bekcisi/zafer-nefesi |
| Dönüşüm flaşı ve büyüme halkası (`donusum`) | 4 | 4 | E2 | karadul-cemberi/spider-shape, demir-siper/uzun-kol, kehribar-nobetci/dev-boyu, safak-bekcisi/safak-bicimi |
| Hasarsız alan büyüsüne alan patlaması (`alan-turu`) | 3 | 3 | kod | circle-of-the-land/lands-aid, imza_dunganga/call, imza_astrolog/comet |
| Diriltme / durum temizleme (`diriltme`) | 3 | 3 | kod | imza_imparator/undying-throne, imza_geride_kalan/risen-from-ashes, safak-bekcisi/son-isik |
| Zemin kutuları (kalıcı büyü alanı dokusu) (`zemin-kutu`) | 2 | 2 | E2 + Gemini | circle-of-the-land/natures-sanctuary, imza_harita/rewrite-the-ground |
| Görme büyüsü göz parıltısı (`goz`) | 2 | 2 | kod | karadul-cemberi/web-sense, tunc-kalkan/tunc-goz |
| Jeton parıltısı / ana hatları (CSS) (`parilti-css`) | 1 | 1 | kod | demir-siper/duvar-yuruyusu |
| Zaman küresi (`zaman`) | 1 | 1 | E2 | zaman-katibi/zaman-cizgisi |
| Kanat / havalanma (`kanat`) | 1 | 1 | E2 | ruzgar-kartali/kanat-cirpisi |
| Ruhani silah / güç eli çağrısı (`cagir-ruhani-silah`) | 1 | 1 | E2 | bag-muhafizi/donen-kilic |

## 2. İlkel → görsel eşlemesi

Ek paket ilkelleri (`src/content/ilkelSema.ts`) ve imza/SRD verisinden türetilen sözde ilkeller (`hasarAlan`, `kritik`, `duvarCizili`, `zeminAlan`, `pasif`).

| İlkel | Durum | Bugünkü anahtar | Eksik aile |
|---|---|---|---|
| ekHasar | genel | darbe-<silah> + hasar şeridi | `silah` |
| direnc | gerekmez | — | — |
| aura | genel | aura-altin (varsayılan; yalnız etkide aura alanı varsa) | `aura-bagla` |
| tepki | eksik | — | `tepki-koruma` |
| gecicCan | eksik | — | `gecici-can` |
| iyilestirme | hazır | iyilestir-kucuk/buyuk | — |
| hasar | genel | hasar şeridi (ateş/soğuk/asit/zehir) | `tek-hedef` |
| hasarAlan | eksik | — | `alan-turu` |
| durumUygula | hazır | durum döngüsü/CSS (durumun türüne göre) | — |
| isaret | eksik | — | `isaret-bag` |
| cagir | genel | cagir-portal (varsayılan) | `cagir-renk` |
| boyut | eksik | — | `donusum` |
| ucus | genel | rozet 🪽 | `kanat` |
| isinlan | hazır | isinlan-cikis → isinlan-giris | — |
| zorlaHareket | hazır | itme-toz | — |
| olumdenDon | eksik | — | `diriltme` |
| ekSaldiri | hazır | darbe-<silah> | — |
| zarEtkisi | genel | koruma-kutsama (yalnız dosta +zar) | `ikon-ok` |
| kaynak | gerekmez | — | — |
| bicim | genel | jeton biçime döner (geçiş yok) | `donusum` |
| yuzeyOlustur | hazır | yuzey-* (8 yüzey türünün hepsi eşlemede) | — |
| buyuVer | gerekmez | verilen büyünün efekti | — |
| buyuDegisimi | gerekmez | büyünün efekti | — |
| gorunmezlik | hazır | css:invisible | — |
| moralEtkisi | hazır | moral-yeniyol | — |
| zarMuhru | eksik | — | `ikon-ok` |
| engeldenGec | eksik | — | `parilti-css` |
| hiz | eksik | — | `ikon-ok` |
| buyuluVurus | genel | darbe-buyu | `silah` |
| zarDegistir | gerekmez | — | — |
| koruma | genel | koruma-* (etki alanı eşleşirse) | `ikon-ok` |
| algi | eksik | — | `goz` |
| cagirGuclendir | eksik | — | `aura-bagla` |
| ortakCan | eksik | — | `isaret-bag` |
| yuvaGeriKazan | gerekmez | — | — |
| meydanOkuma | eksik | — | `isaret-bag` |
| saldirmadanSave | genel | hasar şeridi | `tek-hedef` |
| kaynakYenile | gerekmez | — | — |
| tepkiHakki | gerekmez | — | — |
| zarYenile | gerekmez | — | — |
| buyuPaylas | eksik | — | `isaret-bag` |
| kontrolEt | genel | durum:charmed (varsa) | `isaret-bag` |
| zamanDurdur | eksik | — | `zaman` |
| flurryEk | hazır | darbe-ezme | — |
| olumZari | gerekmez | — | — |
| canArtisi | eksik | — | `gecici-can` |
| yetkinlik | gerekmez | — | — |
| ilham | eksik | — | `ikon-ok` |
| buyuSakla | eksik | — | `isaret-bag` |
| gucDeposu | eksik | — | `isaret-bag` |
| zarYarisi | gerekmez | — | — |
| zarHavuzu | eksik | — | `ikon-ok` |
| silahFirlat | eksik | — | `cagir-ruhani-silah` |
| silahBagi | eksik | — | `silah` |
| kritik | hazır | kritik-vurus | — |
| duvarCizili | hazır | duvar-cizili | — |
| zeminAlan | genel | yer-tutucu (.spell-zone) | `zemin-kutu` |
| pasif | gerekmez | — | — |

## 3. Özellik tablosu

### SRD çekirdek (4 alt sınıf, 21 özellik)

| Sınıf | Alt sınıf | Özellik | Ad | Sv | İlkeller | Durum | Bugünkü anahtar | Eksik aile |
|---|---|---|---|---|---|---|---|---|
| druid | circle-of-the-land | circle-of-the-land-spells | Toprak Çemberi Büyüleri | 3 | pasif | gerekmez | — | — |
| druid | circle-of-the-land | lands-aid | Toprağın Yardımı | 3 | hasarAlan, iyilestirme | eksik | `iyilestir-kucuk/buyuk` | `alan-turu` |
| druid | circle-of-the-land | natural-recovery | Doğal Toparlanma | 6 | pasif | gerekmez | — | — |
| druid | circle-of-the-land | natures-ward | Doğanın Koruması | 10 | pasif | gerekmez | — | — |
| druid | circle-of-the-land | natures-sanctuary | Doğanın Sığınağı | 14 | zeminAlan | genel | `yer-tutucu (.spell-zone)` | `zemin-kutu` |
| fighter | champion | improved-critical | Gelişmiş Kritik | 3 | kritik | hazır | `kritik-vurus` | — |
| fighter | champion | remarkable-athlete | Olağanüstü Atlet | 3 | pasif | gerekmez | — | — |
| fighter | champion | additional-fighting-style | Ek Dövüş Stili | 7 | pasif | gerekmez | — | — |
| fighter | champion | heroic-warrior | Kahraman Savaşçı | 10 | pasif | gerekmez | — | — |
| fighter | champion | superior-critical | Üstün Kritik | 15 | kritik | hazır | `kritik-vurus` | — |
| fighter | champion | survivor | Hayatta Kalan | 18 | pasif | gerekmez | — | — |
| ranger | hunter | hunters-lore | Avcı Bilgisi | 3 | pasif | gerekmez | — | — |
| ranger | hunter | hunters-prey | Avcının Avı | 3 | pasif | gerekmez | — | — |
| ranger | hunter | defensive-tactics | Savunma Taktikleri | 7 | pasif | gerekmez | — | — |
| ranger | hunter | superior-hunters-prey | Üstün Avcının Avı | 11 | pasif | gerekmez | — | — |
| ranger | hunter | superior-hunters-defense | Üstün Avcı Savunması | 15 | tepki | eksik | — | `tepki-koruma` |
| rogue | thief | fast-hands | Çevik Eller | 3 | pasif | gerekmez | — | — |
| rogue | thief | second-story-work | Üst Kat İşi | 3 | pasif | gerekmez | — | — |
| rogue | thief | supreme-sneak | Yüce Sinsilik | 9 | pasif | gerekmez | — | — |
| rogue | thief | use-magic-device | Büyülü Eşya Kullanımı | 13 | pasif | gerekmez | — | — |
| rogue | thief | thiefs-reflexes | Hırsız Refleksleri | 17 | pasif | gerekmez | — | — |

### imza (11 alt sınıf, 66 özellik)

| Sınıf | Alt sınıf | Özellik | Ad | Sv | İlkeller | Durum | Bugünkü anahtar | Eksik aile |
|---|---|---|---|---|---|---|---|---|
| fighter | imza_imparator | noble-upbringing | Asil Terbiye | 3 | pasif | gerekmez | — | — |
| fighter | imza_imparator | decree | Buyruk | 3 | ekSaldiri, isinlan | hazır | `darbe-<silah>`, `isinlan-cikis → isinlan-giris` | — |
| fighter | imza_imparator | crown-presence | Taht Varlığı | 7 | aura | genel | `aura-altin (varsayılan; yalnız etkide aura alanı varsa)` | `aura-bagla` |
| fighter | imza_imparator | royal-word | Hükümdar Sözü | 7 | isaret | eksik | — | `isaret-bag` |
| fighter | imza_imparator | edict | Ferman | 10 | pasif | gerekmez | — | — |
| fighter | imza_imparator | wider-throne | Genişleyen Taht | 10 | pasif | gerekmez | — | — |
| fighter | imza_imparator | exalted-throne | Yüce Taht | 15 | zarEtkisi | genel | `koruma-kutsama (yalnız dosta +zar)` | `ikon-ok` |
| fighter | imza_imparator | undying-throne | Ölümsüz Taht | 15 | olumdenDon | eksik | — | `diriltme` |
| rogue | imza_infazci | verdict | Hüküm | 3 | isaret | eksik | — | `isaret-bag` |
| rogue | imza_infazci | masked-justice | Maskeli Adalet | 3 | pasif | gerekmez | — | — |
| rogue | imza_infazci | final-warning | Son Uyarı | 9 | durumUygula | hazır | `durum döngüsü/CSS (durumun türüne göre)` | — |
| rogue | imza_infazci | intervention | Müdahale | 9 | pasif | gerekmez | — | — |
| rogue | imza_infazci | relentless-pursuit | Peşini Bırakmayan | 13 | pasif | gerekmez | — | — |
| rogue | imza_infazci | execution | İnfaz | 17 | pasif | gerekmez | — | — |
| ranger | imza_ciftci | farm-lore | Çiftlik Bilgisi | 3 | pasif | gerekmez | — | — |
| ranger | imza_ciftci | provisions | Erzak | 3 | iyilestirme, hasar, isaret | eksik | `iyilestir-kucuk/buyuk`, `hasar şeridi (ateş/soğuk/asit/zehir)` | `tek-hedef`, `isaret-bag` |
| ranger | imza_ciftci | harvest | Hasat | 7 | iyilestirme, hasar, durumUygula | genel | `iyilestir-kucuk/buyuk`, `hasar şeridi (ateş/soğuk/asit/zehir)`, `durum döngüsü/CSS (durumun türüne göre)` | `tek-hedef` |
| ranger | imza_ciftci | spore-hardened | Mantar Tutkunu | 7 | pasif | gerekmez | — | — |
| ranger | imza_ciftci | bounty | Bereket | 11 | pasif | gerekmez | — | — |
| sorcerer | imza_dunganga | lullaby-blood | Ninni Kanı | 3 | isaret | eksik | — | `isaret-bag` |
| sorcerer | imza_dunganga | basket | Sepet | 6 | durumUygula | hazır | `durum döngüsü/CSS (durumun türüne göre)` | — |
| sorcerer | imza_dunganga | nightmare | Kâbus | 14 | pasif | gerekmez | — | — |
| sorcerer | imza_dunganga | call | Dunganga Çağrısı | 18 | durumUygula, hasarAlan, isaret | eksik | `durum döngüsü/CSS (durumun türüne göre)` | `alan-turu`, `isaret-bag` |
| sorcerer | imza_dunganga | standing-firm | Cesaret | 3 | pasif | gerekmez | — | — |
| warlock | imza_astrolog | expanded | Genişletilmiş büyüler | 3 | pasif | gerekmez | — | — |
| warlock | imza_astrolog | star-reading | Yıldız Falı | 3 | zarEtkisi, isaret, koruma | eksik | `koruma-kutsama (yalnız dosta +zar)`, `koruma-* (etki alanı eşleşirse)` | `ikon-ok`, `isaret-bag` |
| warlock | imza_astrolog | sky-guide | Gök Rehberi | 3 | — | planlı/hikâye | — | — |
| warlock | imza_astrolog | fate-turned | Yazgı Değişir | 6 | pasif | gerekmez | — | — |
| warlock | imza_astrolog | comet | Kuyruklu Yıldız | 10 | hasarAlan | eksik | — | `alan-turu` |
| warlock | imza_astrolog | seal-of-fate | Yazgı Mührü | 14 | isaret | eksik | — | `isaret-bag` |
| cleric | imza_birlik | forge-bond | Bağ Kurma | 3 | ortakCan, koruma | eksik | `koruma-* (etki alanı eşleşirse)` | `isaret-bag`, `ikon-ok` |
| cleric | imza_birlik | lend-shoulder | Omuz Ver | 3 | pasif | gerekmez | — | — |
| cleric | imza_birlik | vigil | Teselli Nöbeti | 3 | gecicCan, moralEtkisi | eksik | `moral-yeniyol` | `gecici-can` |
| cleric | imza_birlik | shared-vitality | Birlik Can Havuzu | 6 | ortakCan | eksik | — | `isaret-bag` |
| cleric | imza_birlik | common-cure | Ortak Şifa | 8 | pasif | gerekmez | — | — |
| cleric | imza_birlik | unbroken-union | Yıkılmaz Birlik | 17 | pasif | gerekmez | — | — |
| barbarian | imza_geride_kalan | wounded-heart | Yaralı Kalp | 3 | pasif | gerekmez | — | — |
| barbarian | imza_geride_kalan | strength-of-the-worn | Yıpranmışlığın Gücü | 3 | pasif | gerekmez | — | — |
| barbarian | imza_geride_kalan | standing-in-rage | Öfkeyle Ayakta | 3 | pasif | gerekmez | — | — |
| barbarian | imza_geride_kalan | mourning-wrath | Dostunun Yası | 6 | pasif | gerekmez | — | — |
| barbarian | imza_geride_kalan | used-to-grief | Alışkın Acı | 10 | pasif | gerekmez | — | — |
| barbarian | imza_geride_kalan | risen-from-ashes | Küllerden Doğan | 14 | olumdenDon | eksik | — | `diriltme` |
| bard | imza_sair | verse | Mısra | 3 | gecicCan, moralEtkisi, hasar, isaret | eksik | `moral-yeniyol`, `hasar şeridi (ateş/soğuk/asit/zehir)` | `gecici-can`, `tek-hedef`, `isaret-bag` |
| bard | imza_sair | pens-power | Kalemin Gücü | 3 | pasif | gerekmez | — | — |
| bard | imza_sair | night-verse | Gece Şiiri | 3 | — | planlı/hikâye | — | — |
| bard | imza_sair | refrain | Nakarat | 6 | pasif | gerekmez | — | — |
| bard | imza_sair | undying-verse | Ölümsüz Dize | 14 | pasif | gerekmez | — | — |
| bard | imza_sair | master-poet | Usta Şair | 14 | gecicCan, moralEtkisi, hasar, isaret | eksik | `moral-yeniyol`, `hasar şeridi (ateş/soğuk/asit/zehir)` | `gecici-can`, `tek-hedef`, `isaret-bag` |
| monk | imza_bilge | elder-wisdom | Yaşlı Bilgelik | 3 | pasif | gerekmez | — | — |
| monk | imza_bilge | mind-might | Zihin Gücü | 3 | zorlaHareket | hazır | `itme-toz` | — |
| monk | imza_bilge | patience | Sabır | 3 | pasif | gerekmez | — | — |
| monk | imza_bilge | calm-word | Sakin Söz | 6 | moralEtkisi | hazır | `moral-yeniyol` | — |
| monk | imza_bilge | greater-mind-might | Zihin Gücü genişler | 11 | zorlaHareket, hasar | genel | `itme-toz`, `hasar şeridi (ateş/soğuk/asit/zehir)` | `tek-hedef` |
| monk | imza_bilge | nimble-elder | Çevik Yaşlı | 11 | hiz | eksik | — | `ikon-ok` |
| monk | imza_bilge | final-lesson | Son Ders | 17 | zarEtkisi | genel | `koruma-kutsama (yalnız dosta +zar)` | `ikon-ok` |
| paladin | imza_hizir | oath-spells | Yemin büyüleri | 3 | pasif | gerekmez | — | — |
| paladin | imza_hizir | just-in-time | Tam Zamanında | 3 | pasif | gerekmez | — | — |
| paladin | imza_hizir | sense-of-need | Muhtaç Sezgisi | 3 | pasif | gerekmez | — | — |
| paladin | imza_hizir | aura-hard-times | Dar Gün Aurası | 7 | aura | genel | `aura-altin (varsayılan; yalnız etkide aura alanı varsa)` | `aura-bagla` |
| paladin | imza_hizir | miracle-in-time | Yetişen Mucize | 15 | pasif | gerekmez | — | — |
| paladin | imza_hizir | hastening-road | Yetişen Yol | 20 | zarEtkisi, isinlan | genel | `koruma-kutsama (yalnız dosta +zar)`, `isinlan-cikis → isinlan-giris` | `ikon-ok` |
| wizard | imza_harita | read-the-land | Arazi Okuma | 3 | pasif | gerekmez | — | — |
| wizard | imza_harita | mark-the-ground | Mevzi İşareti | 3 | isaret | eksik | — | `isaret-bag` |
| wizard | imza_harita | rewrite-the-ground | Zemin Yeniden Yaz | 6 | isaret, zeminAlan | eksik | `yer-tutucu (.spell-zone)` | `isaret-bag`, `zemin-kutu` |
| wizard | imza_harita | drawn-wall | Çizili Duvar | 10 | duvarCizili | hazır | `duvar-cizili` | — |
| wizard | imza_harita | birds-eye | Kuşbakışı Plan | 14 | koruma, isaret | eksik | `koruma-* (etki alanı eşleşirse)` | `ikon-ok`, `isaret-bag` |

### imza (Karadul) (1 alt sınıf, 6 özellik)

| Sınıf | Alt sınıf | Özellik | Ad | Sv | İlkeller | Durum | Bugünkü anahtar | Eksik aile |
|---|---|---|---|---|---|---|---|---|
| druid | karadul-cemberi | bewitching-gaze | Büyüleyici Bakış | 3 | durumUygula | hazır | `durum döngüsü/CSS (durumun türüne göre)` | — |
| druid | karadul-cemberi | spider-shape | Örümcek Biçimi | 3 | bicim | genel | `jeton biçime döner (geçiş yok)` | `donusum` |
| druid | karadul-cemberi | widow-venom | Karadul Zehri | 3 | ekHasar | genel | `darbe-<silah> + hasar şeridi` | `silah` |
| druid | karadul-cemberi | sweet-snare | Tatlı Tuzak | 6 | durumUygula | hazır | `durum döngüsü/CSS (durumun türüne göre)` | — |
| druid | karadul-cemberi | web-sense | Ağ Duyusu | 10 | algi | eksik | — | `goz` |
| druid | karadul-cemberi | final-kiss | Son Öpücük | 14 | hasar | genel | `hasar şeridi (ateş/soğuk/asit/zehir)` | `tek-hedef` |

### kurgusal fikstür (31 alt sınıf, 128 özellik)

| Sınıf | Alt sınıf | Özellik | Ad | Sv | İlkeller | Durum | Bugünkü anahtar | Eksik aile |
|---|---|---|---|---|---|---|---|---|
| fighter | denge-muhafizi | denge-havuz | Denge Havuz | 3 | kaynak | gerekmez | — | — |
| fighter | denge-muhafizi | denge-sozu | Denge Sozu | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | denge-muhafizi | siyrilan-adim | Siyrilan Adim | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | denge-muhafizi | av-takibi | Av Takibi | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | denge-muhafizi | bastirma | Bastirma | 3 | durumUygula | hazır | `durum döngüsü/CSS (durumun türüne göre)` | — |
| fighter | denge-muhafizi | karsi-darbe | Karsi Darbe | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | denge-muhafizi | yan-vurus | Yan Vurus | 3 | ekHasar | genel | `darbe-<silah> + hasar şeridi` | `silah` |
| fighter | denge-muhafizi | ikili-zar | Ikili Zar | 3 | zarDegistir | gerekmez | — | — |
| fighter | denge-muhafizi | av-isareti | Av Isareti | 3 | isaret | eksik | — | `isaret-bag` |
| fighter | denge-muhafizi | zincir | Zincir | 3 | kontrolEt | genel | `durum:charmed (varsa)` | `isaret-bag` |
| fighter | denge-muhafizi | agirlik | Agirlik | 3 | hiz | eksik | — | `ikon-ok` |
| fighter | denge-muhafizi | birlik | Birlik | 3 | ortakCan | eksik | — | `isaret-bag` |
| wizard | karsi-buyu | karsi-havuz | Karsi Havuz | 3 | kaynak | gerekmez | — | — |
| wizard | karsi-buyu | geri-tepen | Geri Tepen | 3 | tepki | eksik | — | `tepki-koruma` |
| wizard | karsi-buyu | basarili-buyu | Basarili Buyu | 3 | tepki | eksik | — | `tepki-koruma` |
| bard | nagme-okulu | iade | iade | 3 | ilham | eksik | — | `ikon-ok` |
| bard | nagme-okulu | bedava | bedava | 3 | ilham | eksik | — | `ikon-ok` |
| bard | nagme-okulu | mars | mars | 3 | ilham, yetkinlik | eksik | — | `ikon-ok` |
| sorcerer | sifa-damari | sifa | sifa | 1 | zarDegistir | gerekmez | — | — |
| wizard | ikiz-ayna | ayna-havuz | ayna-havuz | 3 | kaynak | gerekmez | — | — |
| wizard | ikiz-ayna | ikiz | ikiz | 3 | buyuDegisimi | gerekmez | `büyünün efekti` | — |
| wizard | zaman-muhru | muhur-havuz | muhur-havuz | 3 | kaynak | gerekmez | — | — |
| wizard | zaman-muhru | muhur | muhur | 3 | buyuSakla | eksik | — | `isaret-bag` |
| wizard | murekkep-ruhu | murekkep-havuz | murekkep-havuz | 3 | kaynak | gerekmez | — | — |
| wizard | murekkep-ruhu | ruh | ruh | 3 | buyuDegisimi | gerekmez | `büyünün efekti` | — |
| warlock | dilek-cini | dilek-havuz | dilek-havuz | 3 | kaynak | gerekmez | — | — |
| warlock | dilek-cini | dilek | dilek | 3 | buyuVer | gerekmez | `verilen büyünün efekti` | — |
| rogue | el-cabuk | calma | calma | 3 | tepki | eksik | — | `tepki-koruma` |
| wizard | bicim-ustasi | bicim-havuz | bicim-havuz | 3 | kaynak | gerekmez | — | — |
| wizard | bicim-ustasi | bicim | bicim | 3 | buyuVer | gerekmez | `verilen büyünün efekti` | — |
| warlock | derin-kavrayis | kavra-havuz | kavra-havuz | 3 | kaynak | gerekmez | — | — |
| warlock | derin-kavrayis | kavra | kavra | 3 | buyuVer | gerekmez | `verilen büyünün efekti` | — |
| bard | ezgi-deposu | depo | depo | 3 | gucDeposu | eksik | — | `isaret-bag` |
| ranger | suru-cobani | komut | komut | 3 | cagirGuclendir | eksik | — | `aura-bagla` |
| rogue | iz-surucu | yaris | yaris | 3 | zarYarisi | gerekmez | — | — |
| paladin | buyu-kalkani | kalkan-aura | kalkan-aura | 3 | aura | genel | `aura-altin (varsayılan; yalnız etkide aura alanı varsa)` | `aura-bagla` |
| paladin | buyu-kalkani | kendi | kendi | 3 | direnc | gerekmez | — | — |
| sorcerer | tas-kani | yogunluk | yogunluk | 1 | koruma, buyuDegisimi | genel | `koruma-* (etki alanı eşleşirse)`, `büyünün efekti` | `ikon-ok` |
| fighter | taktik-zar | taktik-havuz | taktik-havuz | 3 | kaynak | gerekmez | — | — |
| fighter | taktik-zar | taktik | taktik | 3 | zarHavuzu | eksik | — | `ikon-ok` |
| wizard | kehanet-okulu | kehanet-havuzu | Kehanet Havuzu | 3 | kaynak | gerekmez | — | — |
| wizard | kehanet-okulu | kehanet-zarlari | Kehanet Zarları | 3 | zarMuhru | eksik | — | `ikon-ok` |
| wizard | kehanet-okulu | bukulmus-buyu | Bükülmüş Büyü | 3 | buyuDegisimi | gerekmez | `büyünün efekti` | — |
| wizard | kehanet-okulu | sakin-zihin | Sakin Zihin | 6 | zarEtkisi | genel | `koruma-kutsama (yalnız dosta +zar)` | `ikon-ok` |
| wizard | kehanet-okulu | yazgi-sozu | Yazgı Sözü | 6 | tepki | eksik | — | `tepki-koruma` |
| wizard | kehanet-okulu | buyu-kilic | Büyü Kılıcı | 10 | ekSaldiri | hazır | `darbe-<silah>` | — |
| fighter | demir-siper | uzun-kol | Uzun Kol | 3 | boyut | eksik | — | `donusum` |
| fighter | demir-siper | ikiz-darbe | İkiz Darbe | 3 | ekSaldiri | hazır | `darbe-<silah>` | — |
| fighter | demir-siper | siper-ol | Siper Ol | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | demir-siper | col-derisi | Çöl Derisi | 7 | direnc | gerekmez | — | — |
| fighter | demir-siper | duvar-yuruyusu | Duvar Yürüyüşü | 7 | engeldenGec | eksik | — | `parilti-css` |
| cleric | kemik-cagirici | kemik-diriltme | Kemik Diriltme | 3 | cagir | genel | `cagir-portal (varsayılan)` | `cagir-renk` |
| cleric | kemik-cagirici | kara-toprak | Kara Toprak | 3 | yuzeyOlustur | hazır | `yuzey-* (8 yüzey türünün hepsi eşlemede)` | — |
| cleric | kemik-cagirici | kemik-kalkan | Kemik Kalkan | 6 | tepki | eksik | — | `tepki-koruma` |
| cleric | kemik-cagirici | kemik-ayna | Kemik Ayna | 6 | tepki | eksik | — | `tepki-koruma` |
| cleric | kemik-cagirici | kirik-kemik | Kırık Kemik | 10 | tepki | eksik | — | `tepki-koruma` |
| fighter | tunc-kalkan | tunc-havuz | Tunc Havuz | 3 | kaynak | gerekmez | — | — |
| fighter | tunc-kalkan | buyulu-yumruk | Buyulu Yumruk | 3 | buyuluVurus | genel | `darbe-buyu` | `silah` |
| fighter | tunc-kalkan | firtina-vurus | Firtina Vurus | 3 | zarDegistir | gerekmez | — | — |
| fighter | tunc-kalkan | tunc-beden | Tunc Beden | 3 | koruma | genel | `koruma-* (etki alanı eşleşirse)` | `ikon-ok` |
| fighter | tunc-kalkan | tunc-goz | Tunc Goz | 3 | algi | eksik | — | `goz` |
| fighter | tunc-kalkan | meydan | Meydan | 3 | meydanOkuma | eksik | — | `isaret-bag` |
| fighter | tunc-kalkan | muhafiz-hatti | Muhafiz Hatti | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | tunc-kalkan | diken | Diken | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | tunc-kalkan | tazelen | Tazelen | 3 | kaynakYenile | gerekmez | — | — |
| fighter | tunc-kalkan | devirme | Devirme | 3 | zorlaHareket | hazır | `itme-toz` | — |
| fighter | tunc-kalkan | dev-avcisi | Dev Avcisi | 3 | ekHasar | genel | `darbe-<silah> + hasar şeridi` | `silah` |
| cleric | birlik-yolu | birlik-havuz | Birlik Havuz | 3 | kaynak | gerekmez | — | — |
| cleric | birlik-yolu | ortak-yurek | Ortak Yurek | 3 | ortakCan | eksik | — | `isaret-bag` |
| cleric | birlik-yolu | kalkan-aurasi | Kalkan Aurasi | 3 | aura | genel | `aura-altin (varsayılan; yalnız etkide aura alanı varsa)` | `aura-bagla` |
| cleric | birlik-yolu | isik-aurasi | Isik Aurasi | 3 | aura | genel | `aura-altin (varsayılan; yalnız etkide aura alanı varsa)` | `aura-bagla` |
| cleric | birlik-yolu | dokunulmaz | Dokunulmaz | 3 | saldirmadanSave | genel | `hasar şeridi` | `tek-hedef` |
| cleric | birlik-yolu | koz-sifasi | Koz Sifasi | 3 | yuzeyOlustur | hazır | `yuzey-* (8 yüzey türünün hepsi eşlemede)` | — |
| cleric | birlik-yolu | yuva-geri | Yuva Geri | 3 | yuvaGeriKazan | gerekmez | — | — |
| druid | suru-cemberi | suru | Suru | 3 | cagir | genel | `cagir-portal (varsayılan)` | `cagir-renk` |
| druid | suru-cemberi | son-koruyucu | Son Koruyucu | 3 | cagir | genel | `cagir-portal (varsayılan)` | `cagir-renk` |
| druid | suru-cemberi | suru-gucu | Suru Gucu | 3 | cagirGuclendir | eksik | — | `aura-bagla` |
| fighter | demir-nobet | nobet-havuz | Nobet Havuz | 3 | kaynak | gerekmez | — | — |
| fighter | demir-nobet | durdurucu | Durdurucu | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | demir-nobet | nobetci-gozu | Nobetci Gozu | 3 | tepkiHakki | gerekmez | — | — |
| fighter | demir-nobet | lanet-isareti | Lanet Isareti | 3 | isaret | eksik | — | `isaret-bag` |
| fighter | demir-nobet | lanet-karsilik | Lanet Karsilik | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | demir-nobet | komsu-vurus | Komsu Vurus | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | demir-nobet | siyrilma | Siyrilma | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | demir-nobet | sarsma | Sarsma | 3 | durumUygula | hazır | `durum döngüsü/CSS (durumun türüne göre)` | — |
| fighter | demir-nobet | kacamaz | Kacamaz | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | demir-nobet | pusu-oncusu | Pusu Oncusu | 3 | zarEtkisi, ekHasar | genel | `koruma-kutsama (yalnız dosta +zar)`, `darbe-<silah> + hasar şeridi` | `ikon-ok`, `silah` |
| fighter | demir-nobet | sert-beden | Sert Beden | 3 | canArtisi | eksik | — | `gecici-can` |
| fighter | demir-nobet | yeniden-dogus | Yeniden Dogus | 3 | olumZari | gerekmez | — | — |
| fighter | demir-nobet | buyu-kesici | Buyu Kesici | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | demir-nobet | buyu-avcisi | Buyu Avcisi | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | demir-nobet | zar-ustasi | Zar Ustasi | 3 | zarYenile | gerekmez | — | — |
| monk | ruzgar-avucu | ruzgar-kasirgasi | Ruzgar Kasirgasi | 3 | flurryEk | hazır | `darbe-ezme` | — |
| monk | ruzgar-avucu | ruzgar-sifasi | Ruzgar Sifasi | 3 | iyilestirme | hazır | `iyilestir-kucuk/buyuk` | — |
| wizard | zaman-katibi | katip-havuz | Katip Havuz | 3 | kaynak | gerekmez | — | — |
| wizard | zaman-katibi | buyu-ortakligi | Buyu Ortakligi | 3 | buyuPaylas | eksik | — | `isaret-bag` |
| wizard | zaman-katibi | zaman-cizgisi | Zaman Cizgisi | 3 | zamanDurdur | eksik | — | `zaman` |
| wizard | zaman-katibi | olu-efendisi | Olu Efendisi | 3 | kontrolEt | genel | `durum:charmed (varsa)` | `isaret-bag` |
| wizard | zaman-katibi | ruh-cagrisi | Ruh Cagrisi | 3 | cagir | genel | `cagir-portal (varsayılan)` | `cagir-renk` |
| wizard | zaman-katibi | ruh-besleme | Ruh Besleme | 3 | cagirGuclendir | eksik | — | `aura-bagla` |
| fighter | kehribar-nobetci | nobet-havuzu | Nöbet Havuzu | 3 | kaynak | gerekmez | — | — |
| fighter | kehribar-nobetci | av-isareti | Av İşareti | 3 | isaret | eksik | — | `isaret-bag` |
| fighter | kehribar-nobetci | kalkan-sozu | Kalkan Sözü | 3 | tepki | eksik | — | `tepki-koruma` |
| fighter | kehribar-nobetci | tas-deri | Taş Deri | 3 | tepki, direnc | eksik | — | `tepki-koruma` |
| fighter | kehribar-nobetci | tetik-gozu | Tetik Gözü | 7 | zarEtkisi | genel | `koruma-kutsama (yalnız dosta +zar)` | `ikon-ok` |
| fighter | kehribar-nobetci | dev-boyu | Dev Boyu | 7 | boyut | eksik | — | `donusum` |
| fighter | kehribar-nobetci | omuz-omuza | Omuz Omuza | 10 | ekSaldiri | hazır | `darbe-<silah>` | — |
| fighter | kehribar-nobetci | nobet-sozu | Nöbet Sözü | 3 | — | planlı/hikâye | — | — |
| ranger | ruzgar-kartali | kanat-havuzu | Kanat Havuzu | 3 | kaynak | gerekmez | — | — |
| ranger | ruzgar-kartali | firtina-oku | Fırtına Oku | 3 | ekHasar, zorlaHareket | genel | `darbe-<silah> + hasar şeridi`, `itme-toz` | `silah` |
| ranger | ruzgar-kartali | kanat-cirpisi | Kanat Çırpışı | 3 | ucus, hiz | eksik | `rozet 🪽` | `kanat`, `ikon-ok` |
| ranger | ruzgar-kartali | ruzgar-perdesi | Rüzgâr Perdesi | 7 | tepki | eksik | — | `tepki-koruma` |
| ranger | ruzgar-kartali | ruzgar-adimi | Rüzgâr Adımı | 7 | isinlan | hazır | `isinlan-cikis → isinlan-giris` | — |
| ranger | ruzgar-kartali | yuva | Yuva | 11 | pasif | gerekmez | — | — |
| druid | kul-cagirani | cagri-havuzu | Çağrı Havuzu | 3 | kaynak | gerekmez | — | — |
| druid | kul-cagirani | kul-surusu | Kül Sürüsü | 3 | cagir | genel | `cagir-portal (varsayılan)` | `cagir-renk` |
| druid | kul-cagirani | kor-cagrisi | Kor Çağrısı | 3 | cagir | genel | `cagir-portal (varsayılan)` | `cagir-renk` |
| druid | kul-cagirani | sicak-hale | Sıcak Hale | 6 | aura | genel | `aura-altin (varsayılan; yalnız etkide aura alanı varsa)` | `aura-bagla` |
| druid | kul-cagirani | kul-ustasi | Kül Ustası | 6 | yuzeyOlustur, buyuVer, buyuDegisimi | hazır | `yuzey-* (8 yüzey türünün hepsi eşlemede)`, `verilen büyünün efekti`, `büyünün efekti` | — |
| druid | kul-cagirani | kul-patlamasi | Kül Patlaması | 10 | hasar | genel | `hasar şeridi (ateş/soğuk/asit/zehir)` | `tek-hedef` |
| druid | kul-cagirani | kul-korkusu | Kül Korkusu | 10 | durumUygula, gorunmezlik | hazır | `durum döngüsü/CSS (durumun türüne göre)`, `css:invisible` | — |
| cleric | safak-bekcisi | safak-havuzu | Şafak Havuzu | 3 | kaynak | gerekmez | — | — |
| cleric | safak-bekcisi | safak-eli | Şafak Eli | 3 | iyilestirme | hazır | `iyilestir-kucuk/buyuk` | — |
| cleric | safak-bekcisi | zafer-nefesi | Zafer Nefesi | 3 | gecicCan, moralEtkisi | eksik | `moral-yeniyol` | `gecici-can` |
| cleric | safak-bekcisi | son-isik | Son Işık | 6 | olumdenDon | eksik | — | `diriltme` |
| cleric | safak-bekcisi | safak-bicimi | Şafak Biçimi | 10 | bicim, direnc, boyut | eksik | `jeton biçime döner (geçiş yok)` | `donusum` |
| fighter | bag-muhafizi | donen-kilic | donen-kilic | 3 | silahFirlat | eksik | — | `cagir-ruhani-silah` |
| fighter | bag-muhafizi | kilic-bagi | kilic-bagi | 3 | silahBagi | eksik | — | `silah` |

## 4. Jeton görünümü

Karakter jeton atlası `public/characters/<ırk>-<cinsiyet>-<sınıf>.webp`: 10 ırk × 2 cinsiyet × 12 sınıf = 240 hücre, depoda eksik 0. Alt sınıf jeton yolunu etkilemez (`src/battle/avatar.ts` `characterTokenFile`; ayrıntı `harita/belgeler/ENVANTER-JETON-VE-BUYU.md` Bölüm 3e).

`claude/karakter-jeton-uretim-plani.md` ve `jeton-alt-sinif-kontrol-listesi.md` bu depoda yok (aranan her yolda bulunamadı); çapraz kontrol `ENVANTER-JETON-VE-BUYU.md` (Bölüm 3–4) ve atlasın kendisiyle yapıldı. İki plan belgesi yerelde varsa bu bölüm onlarla yeniden karşılaştırılmalı.

- Biçim değiştiren özellikler canavar jetonunu ödünç alır (`shape_changed` → `monsterAvatar`): Karadul Örümcek Biçimi `giant-wolf-spider` (var), `giant-spider` (var), `phase-spider` (var). Ayrı alt sınıf jetonu gerekmez; eksik olan geçiş flaşı (`donusum`).
- Boyut büyümesi (Large Form vb.) jeton ölçeğini veriden değiştirir (`tokenScale`); ayrı jeton gerekmez, büyüme halkası eksik (`donusum`).
- Kanat/uçuş: jetonda yalnız 🪽 rozeti; kanat katmanı E2 `donusum-kanat.jpg`’den (kod: jetonun arkasında katman). Ayrı jeton gerekmez.
- Silah/kalkan değişimi (silah bağı, büyülü silah, ruhani silah): jetonda çizilmez; parıltı katmanı (`silah`), ayrı jeton gerekmez.

Görünümü değiştiren ilkeli olan özellikler (7):

| Kaynak | Alt sınıf | Özellik | İlkeller | Ayrı jeton | Öneri |
|---|---|---|---|---|---|
| imza (Karadul) | karadul-cemberi | spider-shape | bicim | canavar jetonu (ödünç) | dönüşüm flaşı |
| kurgusal fikstür | demir-siper | uzun-kol | boyut | gerekmez | büyüme halkası |
| kurgusal fikstür | demir-siper | duvar-yuruyusu | engeldenGec | gerekmez | hayalet CSS |
| kurgusal fikstür | kehribar-nobetci | dev-boyu | boyut | gerekmez | büyüme halkası |
| kurgusal fikstür | ruzgar-kartali | kanat-cirpisi | ucus | gerekmez | kanat katmanı |
| kurgusal fikstür | kul-cagirani | kul-korkusu | gorunmezlik | gerekmez | hazır (CSS) |
| kurgusal fikstür | safak-bekcisi | safak-bicimi | bicim, boyut | canavar jetonu (ödünç) | dönüşüm flaşı, büyüme halkası |

Eksik jeton hücresi (alt sınıf için zorunlu): **0**. Gerçek ek pakette `bicim` ilkeli canavar dışı bir biçim (`yaratiklar` jetonu) tanımlıyorsa jeton `JETON_ARKETIP`/`JETON_YEDEK` zincirine düşer (`src/content/ilkelSema.ts`); yerelde üretilen tabloda bu satırlar "canavar jetonu (ödünç)" olarak görünür.
