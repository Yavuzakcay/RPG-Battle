# KATALOG-1 F / F2: sığmayan ve yaklaşık güçler (kalanlar)

Mühür Ruhu (`data/bosslar-muhur.json`, `scripts/katalog-f-bosslar.mjs`) ve kadim/mücevher (`data/canavarlar-kadim.json`, `scripts/katalog-f2-kadim.mjs`)
kayıtlarında motora sığmayan güçlerin **kalan** listesi. Görev KATALOG-GUC-TAM (kural sürümü 109, 2026-11-28) listenin büyük kısmını motora
taşıdı; kapananlar bu belgeden silindi, ne olduklarının kaydı `DECISIONS.md` "Görev KATALOG-GUC-TAM" bölümünde.

- **Veri:** `data/katalog-gucler.json` (canavar kimliğine göre; üretici `python scripts/katalog-gucler.py`), mühür taşı yuvaları
  `data/yuva-kurallari.json`. 108 ve altındaki kayıt/replay bu verinin hiçbirini okumaz.
- **Motor:** `src/battle/katalog109*.ts` (aura, saldırı eki, alan bırakma, efsanevi türleri, faz, özel güçler), `src/rules/sockets.ts` (yuvalar).
- **Testler:** `src/battle/katalog109.test.ts`, `src/rules/sockets.test.ts`.

## Serüven'e ait (motor dışında; karar bekliyor)

| Güç | Metin ne diyor | Durum | Soru |
|---|---|---|---|
| Ten Stones Resonance (Captive → Hexonia) | 10 Mühür Taşı sunağa bırakılınca Captive Dragon, Dragon of Hexonia'ya evrilir | Savaş içi biçim değişimi değil; iki kayıt ayrı | Serüven düğümünde mi (Captive savaşı biter, Hexonia sonraki savaşa dost eklenir), yoksa savaş içinde mi? |
| Mücevher yumurta izleyicisi (`gemEggResonanceTracker`) | Taşıyıcının Alignment kararları ve en sık nitelik/beceri zarları yumurtanın hattını açar; tek yumurta | Hat kaydı elle seçilir | Hizalanma günlüğü ve zar defteri Serüven kaydında mı tutulacak (savaşa girmez)? Rengi seçen "karar yoğunluğu" eşikleri? |
| Ocean-Nightmare üç fazı (gemi → deniz → ada) | Faz 1 gemide 700 HP (0 HP'de gemi batar), Faz 2 denizde 600 HP (0 HP'de ölmez), Faz 3 Titan adada | Üç ayrı kayıt ve harita | Serüven düğüm zinciri (üç savaş art arda, aradaki dinlenme yok) olarak mı? Gemi/deniz/ada haritaları yok. |
| Hull Crusher, Ship Sinks, Wounded Dreamer, Dreamer Stirs | Gemi gövdesine vuruş; 700 HP'de batış; 600 HP başlangıç; 0 HP'de serbest bırakma ve ada | Yazılı özellik | Gemi nesnesi (`data/nesneler.json`) ve düğüm sonucu; haritalar gelince |
| Kaltakkıran zırhı parçalanınca taşların bölgeye düşmesi | Zırh parçalanınca kaynaşmış taşlar ait oldukları bölgeye düşer | Yalnız veri alanı (`data/yuva-kurallari.json` `parcalaninca`) | Serüven olayı ne zaman tetiklenir (Seal That Strips Darkness)? |
| Mücevher binek bağında Taşıyıcı'ya göre Save DC | DC Taşıyıcı'nın baskın niteliğine göre | Kayıtta sabit DC | Taşıyıcı (yumurta sahibi) kaydı Serüven'de |

## Motorda kalan yaklaşıklar ve eksikler

| Yaratık | Güç | Bugün | Kalan / neden |
|---|---|---|---|
| Kongark | Taş Uyanışı: düşük yerçekimi (itme/çekme +5 ft), "her 2 turda" merkeze çekim | Faz 2 aurası her tur 15 ft çeker (STR 21) | İtme/çekme uzunluğunu değiştiren alan ilkeli yok; "2 turda bir" sayacı yok |
| Mirage | Taş Uyanışı: her tur başında **bir** oyuncuya Frightened | 60 ft içindeki her düşmana WIS 21 save | Aurada tek hedef seçimi yok |
| Mirage, Mirath | Misty Step | Işınlanma yeteneği (30 ft, en az 2 düşmanın yanına) | Canavar büyüsü yolu (`castWithoutAction`) hedef altıgen seçmiyor; yapay zekâ ancak düşmanlar kümeliyken kullanır |
| Mothraq | Taş Uyanışı: 3 hareketli zehir bulutu; ölü düşmanlar spor hizmetkârına döner | Bossun çevresine 15 ft zehir bulutu (10 tur) | Hareketli bulut ve ölüden çağırma yok |
| Stormer | Taş Uyanışı: tur sonu en yüksek irtifadaki ya da metal zırhlıya yıldırım | Su yüzeyi (20 ft) | "Metal zırhlı" ve "en yüksek irtifa" seçimi yok |
| Wolfgang | Taş Uyanışı: tipi görüş 30 ft; buz üstündekilere avantaj | Buz yüzeyi (30 ft) | Harita görüş menzili ve yüzey koşullu avantaj faz bloğunda yok |
| Lightaur | Taş Uyanışı: harita parlak ışıkla dolar | Tur başı Blinded aurası | Faz bloğu harita ışığını değiştirmiyor |
| Cimbombom | Taş Uyanışı: "arena kenarı" alev | 30 ft halka alev yüzeyi (3 tur) | Gerçek arena kenarı yerine bossun çevresindeki halka |
| Lightaur | Altın Yargı Sütunu 40 ft silindir | `cylinder` alan: yerde 20 ft yarıçap, 40 ft yükseklik (yükseklik canavar alanında kullanılmıyor) | Yarıçap PDF'te yok (seçim DECISIONS'ta) |
| Dragon of Hexonia | Continent Judgment Breath: şehirlere sıfır zarar | Dost ateşi yok, 0 HP'ye inen düşman ölür | Yapı ayrımı (nesne hasarı) yok |
| Dragon of Hexonia | Out-of-Time Storm: büyü iptali | İkinci inisiyatif (15) ve turda bir **saldırı** iptali | Gelen büyüyü hedef bilgisiyle yakalayan kanca yok (büyü kancası hedefi görmüyor) |
| Dragon of Hexonia | Size Shift: büyükken erişim ve kapsama büyür | Boyut ve ayak izi (`multiHex` açıkken) değişir | Erişim ft'si ve Kıta Ölçeği yarıçapı (2 altıgen) boyutla değişmiyor |
| Kozmik Anka | Cosmic Star Flame: ateş hasarı "Ateş + Işıltı" | Ateş/ışıltı direnci yok, bağışıklık dirence iner | Çift türlü hasar ayrı tür olarak yazılmıyor |
| Kozmik Anka | Halo: illüzyonları dağıtma, Kâbus Sisi → Anka Alevi | Invisible ve dostlarda Frightened/Unconscious silinir | İllüzyon büyülerini ve sis yüzeyini hedefleyen ilkel yok |
| Kozmik Anka | Star Mark: mesafe dezavantajı veremez | Görünmez olamaz, konsantrasyon bonusu yok | Saldıranın menzil dezavantajını kaldıran alan yok |
| Kozmik Anka | Ember Wing Flap: 50 ft uçuş | Karanlık silme | Efsanevi save eyleminde ardından uçuş yok |
| Kozmik Anka | Hunter Soul Bond: Avcı | Aynı taraftaki ilk Ranger karakteri | Avcı'yı Serüven kaydından seçme yok |
| `kozmik-anka-savas` | Savaş varyantı | Aynı değerler ve aynı 109 verisi | Varyant farkı belirlenince ayrıştır |
| Ocean-Nightmare, Titan | Dokunaç hedef sınırı (8 / 12) | Sınır yok | Yakalama sayacı yok |
| Ocean-Nightmare, Titan | Alpha Resonance (Safir ejderha varken gök gürültüsü direnci yok) | Yok | "Savaşta şu yaratık varsa" koşulu yok |
| Titan | Dream Call: 30 ft yaklaştırma + silah düşürme | Kayda girmedi | Efsanevi save'e `command: approach` + `dropHeld` bağlanmadı |
| Titan, Ocean-Nightmare | Fling / Cosmic Fling: "serbest yön", varışta 10 ft save | Kaynaktan uzağa itme (60/90 ft) + ikinci hasar | Varış noktası seçimi ve varış alanı save'i yok |
| Kadim kayıtlar | Siege Monster, büyüsüz fiziksel bağışıklık/direnç, duyular (Truesight, Tremorsense, Blindsight), kazma, tırmanma | Yazılı | `traits`/`senses` alanlarını katalog kayıtlarına açan ayrıştırma ayrı iş |
| Kadim kayıtlar | Durum bağışıklıkları | **Kapandı**: savaşta `dex` yan tablosundan (`pasif.immune`) | — |
| Alfa (Safir) | Sea Camouflage (suda gizlenme avantajı) | Yazılı | `stealth.json`'a yaratık başına su bonusu |
| Mücevher | Sigma Yetişkin nefesi: dostlara 30 geçici can | Yok | Saldırı ekinde "dostlara" kolu yok |
| Mücevher | Yetişkin pasifleri: Omega (düşen rakipten 25 geçici can), Alfa (Far Realm +2d10, dostlara AC +2), Gamma (ışınlanma engeli, kuvvet bağışıklığı) | Sigma (dostlara Blinded/Charmed bağışıklığı) ve Delta (görünmezi açığa çıkarır + 1d8) aura olarak çalışır | Aurada AC eki, ışınlanma engeli ve öldürme tetiği yok |
| Mücevher | Genç bağları: Sigma 2/UD d20 yeniden atma, Omega darbede iyileşme engeli, Delta tuzak/illüzyon avantajı, Alfa tepkiyle dost saldırısı, Gamma yerçekimi kaldırma | Binene türüne direnç (binek bağı) | Bağın kaynaklı aktif güçleri yok |
| Mühür taşları | Sv.3 Savaş Sanatları (oyuncu eylemi, 1/UD) ve ek bağışıklıklar (Burning, iceWalker, noHeal…) | Sv.3 yuvada türüne bağışıklık | Oyuncunun eşyadan eylemle alan saldırısı yapacağı yol yok (eşya `paket` ilkelleri yalnız pasif/isabet) |
| Mühür taşları | Kaltakkıran Hükümdar Vuruşu: turda bir kez, tür seçimi, 10 taşta direnç yok sayma | Her silah isabetine ilk taşın türünden 1d6/1d8/2d6 | Eşya isabet ekinde "turda bir" ve seçim yok |
| Mühür taşları | Kaltakkıran Uyum yuvası bedeli (1/2/3), İhanet Çatlağı | Yok | Uyum sayacı yuva sayısına bağlı değil |
| Bütün katalog yaratıkları | `monster-ortamlari.json` kaydı | Kayıt içinde `ortam` | Game Master seçicisi 330 SRD canavarını sayan testlere ve ana parçaya dokunmamak için; seçiciye bağlama ayrı iş |
| Dragon of Hexonia a/b | Yön işareti (a sağa, b sola) | Yan tabloda `yon` | Görseller gelince jeton yön alanı |
| Yetişkin mücevher | Body Sweep / Wing Buffet, Elemental Pulse | Değerler türetildi | PDF yalnız adları ve puanları veriyor |
| Ember Wing Flap | Kurtarma | DC 27 DEX türetildi | PDF kurtarma vermiyor |
