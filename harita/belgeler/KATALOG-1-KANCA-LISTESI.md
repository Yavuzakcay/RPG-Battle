# KATALOG-1: motorun denetleyemediği güçler (A–E)

Görev KATALOG-1 D sonu (kullanıcı kararı B-4). `data/items-katalog.json`'daki bütün `planli` ve `kismi` güçler, gerektirdiği kanca türüne göre
tek listede (E, KATALOG-1 E sonunda eklendi: kendi beş bölümünde, en sonda; kategori tablosu yalnız A–D). Metinler kayıtta PDF'teki gibi; burada yalnız eşya, güç adı, durum ve not. Kategori, güç metni ve notundan anahtar sözcükle
atanır (ilk eşleşen); bir güç birden çok kancaya ihtiyaç duyabilir. Üretici: oturum betiği `planliListe.py` (KATALOG-2 planlamasında yeniden üretilir).

| Parça | Kısmen | Planlı |
|---|---|---|
| A | 27 | 189 |
| B | 30 | 93 |
| C | 11 | 61 |
| D | 6 | 101 |
| E | 7 | 38 |
| **Toplam** | **81** | **482** |

| Kategori | Güç |
|---|---|
| Zırh/eşya bağı ve kaynaşma (yalnız belli zırh giyiliyken; Kaltakkıran paketi) | 25 |
| Soket ve zanaat eklentisi (K3: yalnız tılsım modu / yalnız veri) | 43 |
| Sabit hasar azaltma ("hasar −N", her darbede) | 15 |
| Kısa dinlenmede yenilenen yük (motor eşya yükünü yalnız uzun dinlenmede yeniler) | 19 |
| Beceri bonusu/avantajı (Stealth, Perception, Persuasion…; motorda yetenek düzeyi var, beceri düzeyi yok) | 29 |
| Işık düzeyi / gizlilik koşulu (loş, karanlık, parlak, Hidden) | 18 |
| Yükseklik, atlama, iniş tetiği | 19 |
| Büyü saldırısı ve DC'ye ayrı/tek taraflı bonus, belli büyü türüne bonus (motorda tek eşit bonus.spell) | 27 |
| Hasar türü/durum uygulama/öldürme/iyileştirme tetikleri ("verdiğinde", "uyguladığında", "0 HP'ye düşürdüğünde") | 64 |
| Yük harcayan özgün aktif güçler (eylem/bonus/tepki; SRD büyüsüyle birebir değil) | 121 |
| Durum/koşul kancaları (yarı can, konsantrasyon, su/yüzey, zırhsız, binek…) | 138 |

## Zırh/eşya bağı ve kaynaşma (yalnız belli zırh giyiliyken; Kaltakkıran paketi)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| B | BOSS#5 | Kaltakkıran'ın Paladin Zırhı (Kaltakkıran's Paladin Armor) | Zırh | kismi | Plate Armor (18, Stealth dezavantajı) çalışır; 5+ ve 10 taşta AC 19/20 kademesi soket sistemi bekler; giyme/çıkarma süresi savaş dışı |
| B | BOSS#5 | Kaltakkıran'ın Paladin Zırhı (Kaltakkıran's Paladin Armor) | Kalıcı Kaynaşma | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#5 | Kaltakkıran'ın Paladin Zırhı (Kaltakkıran's Paladin Armor) | Hükümdar Vuruşu | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#6 | Kaltakkıran'ın Çeneli Zincir Kılıcı (Kaltakkıran's Maw-Chain Greatsword) | Zırha Kilitli Bağ | planli | zırh bağı kancası yok; zırhsız kullanım engellenemediği için +3 ve üç fiziksel tür motora verilmedi (taban Greatsword yalın) |
| B | BOSS#6 | Kaltakkıran'ın Çeneli Zincir Kılıcı (Kaltakkıran's Maw-Chain Greatsword) | Taş Yankısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | BOSS#10 | Ayaz Kalbi (Soğuk) (Frost Heart) | Temel etki | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#10 | Ayaz Kalbi (Soğuk) (Frost Heart) | Boss Savaş Sanatı — Kırağı Nefesi (1/UD, Eylem) | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#11 | Fırtına Mili (Yıldırım) (Storm Spire) | Temel etki | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#11 | Fırtına Mili (Yıldırım) (Storm Spire) | Boss Savaş Sanatı — Gök Mızrağı (1/UD, Eylem) | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#12 | Çınlama Mührü (Gürültü) (Resonance Seal) | Temel etki | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#12 | Çınlama Mührü (Gürültü) (Resonance Seal) | Boss Savaş Sanatı — Kanyon Yırtığı (1/UD, Eylem) | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#13 | Erime Damlası (Asit) (Dissolution Drop) | Temel etki | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#13 | Erime Damlası (Asit) (Dissolution Drop) | Boss Savaş Sanatı — Sülfür Tufanı (1/UD, Eylem) | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#14 | Ağu Özü (Zehir) (Venom Essence) | Temel etki | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#14 | Ağu Özü (Zehir) (Venom Essence) | Boss Savaş Sanatı — Veba Bulutu (1/UD, Eylem) | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#15 | Kör Güneş Parçası (Işıltı) (Blinding Sun Shard) | Temel etki | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#15 | Kör Güneş Parçası (Işıltı) (Blinding Sun Shard) | Boss Savaş Sanatı — Altın Yargı Sütunu (1/UD, Eylem) | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#16 | Mezar Küresi (Nekrotik) (Sepulcher Orb) | Temel etki | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#16 | Mezar Küresi (Nekrotik) (Sepulcher Orb) | Boss Savaş Sanatı — Kara Alev Kesiği (1/UD, Eylem) | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#17 | Vesvese Kristali (Psişik) (Whisper Crystal) | Temel etki | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#17 | Vesvese Kristali (Psişik) (Whisper Crystal) | Boss Savaş Sanatı — Zihin Kıran Çığlık (1/UD, Eylem) | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#18 | Boşluk Kırığı (Kuvvet) (Void Fracture) | Temel etki | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#18 | Boşluk Kırığı (Kuvvet) (Void Fracture) | Boss Savaş Sanatı — Yıldız Çöküşü (1/UD, Eylem) | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#9 | Kor Çekirdeği (Ateş) (Ember Core) | Temel etki | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |
| D | BOSS#9 | Kor Çekirdeği (Ateş) (Ember Core) | Boss Savaş Sanatı — Erimiş Örs Patlaması (1/UD, Eylem) | planli | zırh bağı kancası yok: güç yalnız Kaltakkıran'ın Paladin Zırhı giyiliyken ve kaynaşmışken (Çeneli Zincir Kılıcı B-4 ile aynı); kaynaşma sistemi G anlatımında |

## Soket ve zanaat eklentisi (K3: yalnız tılsım modu / yalnız veri)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| D | BOSS#7a | Çatlak Element Taşı (Ateş) (Cracked Elemental Stone (Fire)) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; türe özel sabit −3 hasar azaltma motorda yok (sabit azaltma kancası) |
| D | BOSS#7b | Çatlak Element Taşı (Soğuk) (Cracked Elemental Stone (Cold)) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; türe özel sabit −3 hasar azaltma motorda yok (sabit azaltma kancası) |
| D | BOSS#7c | Çatlak Element Taşı (Yıldırım) (Cracked Elemental Stone (Lightning)) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; türe özel sabit −3 hasar azaltma motorda yok (sabit azaltma kancası) |
| D | BOSS#7d | Çatlak Element Taşı (Gürültü) (Cracked Elemental Stone (Thunder)) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; türe özel sabit −3 hasar azaltma motorda yok (sabit azaltma kancası) |
| D | BOSS#7e | Çatlak Element Taşı (Asit) (Cracked Elemental Stone (Acid)) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; türe özel sabit −3 hasar azaltma motorda yok (sabit azaltma kancası) |
| D | BOSS#7f | Çatlak Element Taşı (Zehir) (Cracked Elemental Stone (Poison)) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; türe özel sabit −3 hasar azaltma motorda yok (sabit azaltma kancası) |
| D | BOSS#7g | Çatlak Element Taşı (Işıltı) (Cracked Elemental Stone (Radiant)) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; türe özel sabit −3 hasar azaltma motorda yok (sabit azaltma kancası) |
| D | BOSS#7h | Çatlak Element Taşı (Nekrotik) (Cracked Elemental Stone (Necrotic)) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; türe özel sabit −3 hasar azaltma motorda yok (sabit azaltma kancası) |
| D | BOSS#7i | Çatlak Element Taşı (Psişik) (Cracked Elemental Stone (Psychic)) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; türe özel sabit −3 hasar azaltma motorda yok (sabit azaltma kancası) |
| D | BOSS#7j | Çatlak Element Taşı (Kuvvet) (Cracked Elemental Stone (Force)) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; türe özel sabit −3 hasar azaltma motorda yok (sabit azaltma kancası) |
| D | YT#34 | Kor Mühür Taşı (Ember Sigil Stone) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; yalnız Tılsım yuvası etkisi |
| D | YT#34 | Kor Mühür Taşı (Ember Sigil Stone) | Silah yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#34 | Kor Mühür Taşı (Ember Sigil Stone) | Zırh yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#35 | Kırağı Mühür Taşı (Frost Sigil Stone) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; yalnız Tılsım yuvası etkisi |
| D | YT#35 | Kırağı Mühür Taşı (Frost Sigil Stone) | Silah yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#35 | Kırağı Mühür Taşı (Frost Sigil Stone) | Zırh yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#36 | Fırtına Mühür Taşı (Storm Sigil Stone) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; yalnız Tılsım yuvası etkisi |
| D | YT#36 | Fırtına Mühür Taşı (Storm Sigil Stone) | Silah yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#36 | Fırtına Mühür Taşı (Storm Sigil Stone) | Zırh yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#37 | Kaya Mühür Taşı (Stone Sigil Stone) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; yalnız Tılsım yuvası etkisi |
| D | YT#37 | Kaya Mühür Taşı (Stone Sigil Stone) | Silah yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#37 | Kaya Mühür Taşı (Stone Sigil Stone) | Zırh yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#38 | Zehir Mühür Taşı (Venom Sigil Stone) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; yalnız Tılsım yuvası etkisi |
| D | YT#38 | Zehir Mühür Taşı (Venom Sigil Stone) | Silah yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#38 | Zehir Mühür Taşı (Venom Sigil Stone) | Zırh yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#39 | Usta Çelik Mühür Taşı (Masterwork Sigil Stone) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; yalnız Tılsım yuvası etkisi |
| D | YT#39 | Usta Çelik Mühür Taşı (Masterwork Sigil Stone) | Silah yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#39 | Usta Çelik Mühür Taşı (Masterwork Sigil Stone) | Zırh yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#40 | Gölge Özü Mühür Taşı (Umbral Sigil Stone) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; yalnız Tılsım yuvası etkisi |
| D | YT#40 | Gölge Özü Mühür Taşı (Umbral Sigil Stone) | Silah yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#40 | Gölge Özü Mühür Taşı (Umbral Sigil Stone) | Zırh yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#41 | Işıltı Özü Mühür Taşı (Radiant Sigil Stone) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; yalnız Tılsım yuvası etkisi |
| D | YT#41 | Işıltı Özü Mühür Taşı (Radiant Sigil Stone) | Silah yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#41 | Işıltı Özü Mühür Taşı (Radiant Sigil Stone) | Zırh yuvası | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#42 | Öz Çekirdeği Taşı (Aether Core Stone) | Temel etki | planli | K3: soket sistemi yok, taş tılsım olarak taşınır; yalnız Tılsım yuvası etkisi |
| D | YT#42 | Öz Çekirdeği Taşı (Aether Core Stone) | Silah yuvası (Zehirli Kaplama) | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#42 | Öz Çekirdeği Taşı (Aether Core Stone) | Zırh yuvası (Toplu Arındırma) | planli | K3 tılsım modu: silah/zırh yuvası etkisi uygulanmaz |
| D | YT#43 | Güç Çerçevesi (Mounting of Power) | Temel etki | planli | K3: zanaat eklentisi yalnız veri (soket/çerçeve sistemi yok) |
| D | YT#44 | Mistik Çerçeve (Mystical Mounting) | Temel etki | planli | K3: zanaat eklentisi yalnız veri (soket/çerçeve sistemi yok) |
| D | YT#45 | Kadim Efsun Kalıntısı (Ancient Imbuement Relic) | Temel etki | planli | K3: zanaat eklentisi yalnız veri (soket/çerçeve sistemi yok) |
| D | YT#45 | Kadim Efsun Kalıntısı (Ancient Imbuement Relic) | Silah | planli | K3: zanaat eklentisi yalnız veri (soket/çerçeve sistemi yok) |
| D | YT#45 | Kadim Efsun Kalıntısı (Ancient Imbuement Relic) | Zırh veya Kalkan | planli | K3: zanaat eklentisi yalnız veri (soket/çerçeve sistemi yok) |
| D | YT#45 | Kadim Efsun Kalıntısı (Ancient Imbuement Relic) | Başlık, Eldiven, Bot, Pelerin veya Takı | planli | K3: zanaat eklentisi yalnız veri (soket/çerçeve sistemi yok) |

## Sabit hasar azaltma ("hasar −N", her darbede)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| B | KY#36 | Delici Şövalye Kalkanı (Piercing Knight Shield) | Siperli Saplama | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#51 | Yeşil Bakır Hisar Plakası (Verdigris Bastion Plate) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#53 | Kök Şövalye Zırhı (Primordial Knight Plate) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#55 | Yalnızlık Şövalyesi Plakası (Solitude Knight Plate) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#17 | Kıvılcım Yeleği (Sparkmesh Chain Shirt) | Zırh ek etkisi | kismi | yıldırım direnci çalışır; kesici hasarda −1 yok (sabit hasar azaltma kancası) |
| B | ZK#22 | Cehennem Ocağı Plakası (Hellforge Plate) | Zırh ek etkisi | kismi | ateş direnci çalışır; Burning bağışıklığı ve tüm hasarda −2 yok |
| B | ZK#23 | Sarsılmaz Yemin Plakası (Plate of Endurance) | Zırh ek etkisi | kismi | tüm kurtarma +1 çalışır; ezici/delici/kesici hasarda −2 yok |
| B | ZK#25 | Biçici Karanlık Plakası (Reaper's Iron Plate) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#26 | Mareşal Armalı Plakası (Marshal's Crested Plate) | Zırh ek etkisi | kismi | ateş direnci ve tüm kurtarma +2 çalışır; tüm hasarda −1 yok |
| B | ZK#27 | Adanmışlık Plakası (Plate of Devotion) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#28 | Zihin Kalesi Plakası (Mindfortress Plate) | Zırh ek etkisi | kismi | Frightened bağışıklığı ve WIS kurtarma avantajı çalışır; tüm hasarda −1 yok |
| B | ZK#29 | Cüce Örsü Şerit Zırhı (Dwarven Anvil Splint) | Zırh ek etkisi | kismi | CON kurtarma +1 çalışır; en yüksek can +10 ve delici hasarda −2 yok |
| B | ZK#30 | Kızgın Demir Plakası (Scorched Iron Plate) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#31 | Dalgalanan Kuvvet Zırhı (Forcewave Chain Mail) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | KY#45 | Yıldız Taşı Tacı (Starstone Crown) | Taş Ağırlığı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |

## Kısa dinlenmede yenilenen yük (motor eşya yükünü yalnız uzun dinlenmede yeniler)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| A | KY#22 | Çan Sesi Topuzu (Bellringer Mace) | Çınlayan Tokmak (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#29 | Şerit Kamçı Kılıcı (Ribbon Whip-Blade) | Jilet Uzaması (2 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#30 | Kuru Yaprak Dövüş Sargısı (Dryleaf Handwraps) | Avuç Patlaması (2 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#34 | Ayaz Parfüm Şişesi (Frost Perfume Bottle) | Ayaz Sisi (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#32 | Elementler Asası (Staff of the Confluence) | Element Uyumu (1 yük, kısa dinlenme) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#64 | İten Hafif Çekiç (Gale Light Hammer) | Rüzgâr İtişi (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#66 | İnanç Kıran Savaş Çekici (Oathshatter Warhammer) | Kuvvet Vuruşu (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#79 | Ahenk Meçi (Harmonic Rapier) | Uyumlu Tını (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#36 | Dalga Anası Cübbesi (Tidecaller Robe) | Dalga Çağrısı (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#44 | Gölge Örtüsü Kalkanı (Shadecloak Greatshield) | Karanlık Perdesi (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#45 | Dikenli Asma Kalkanı (Briarvine Shield) | Dikenli Sarmaşık (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#1 | Gözcü Ejderha Miğferi (Vigilant Drake Helm) | Av İşareti (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#14 | Gölge Yürüyüşü Pelerini (Shadowstep Cloak) | Gölge Adımı (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#16 | Kuzgun Kanadı Pelerini (Stormwing Cloak) | Yel Süzülüşü (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#22 | Buhar Perdesi Pelerini (Steamshell Cloak) | Buhar Kaçışı (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#28 | Hızlı Büyü Eldiveni (Spellquick Gloves) | Hızlı Cantrip (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#39 | Karanlık Adım Çizmeleri (Darkstep Boots) | Gece Sıçraması (1 yük, KD) | kismi | 2. seviye Misty Step slotsuz çalışır; eşya yükü yalnız uzun dinlenmede yenilenir (kısa dinlenme yok) |
| C | GY#42 | Gök Sıçrayışı Çizmeleri (Skyvault Boots) | Kor Sıçrayışı (1 yük, KD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#30 | Sis Adımı Kolyesi (Miststep Pendant) | Sis Kaçışı (1 yük, KD) | kismi | 2. seviye Misty Step slotsuz çalışır; eşya yükü yalnız uzun dinlenmede yenilenir (kısa dinlenme yok) |

## Beceri bonusu/avantajı (Stealth, Perception, Persuasion…; motorda yetenek düzeyi var, beceri düzeyi yok)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| A | S1#18 | Nöbet Teberi (Vigil Halberd) | Tetikte Gözcü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#70 | Pusu Kısa Kılıcı (Ambusher's Shortsword) | Silahın ek etkisi | kismi | inisiyatif +2 çalışır; Perception avantajı yok (yalnız yetenek düzeyinde avantaj var) |
| A | S2#74 | Gece İzci Hançeri (Nightscout Dagger) | Silahın ek etkisi | kismi | 30 ft Darkvision çalışır; Stealth avantajı yok (yalnız yetenek düzeyinde avantaj var) |
| A | S2#79 | Ahenk Meçi (Harmonic Rapier) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#84 | Sancak Komutanı Kılıcı (Marshal's Banner Longsword) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#43 | Sessiz Bıçak Zırhı (Silentblade Scale) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#1 | Kuzgun Kanadı Derisi (Ravenwing Leather) | Zırh ek etkisi | kismi | inisiyatif +2 çalışır; Stealth avantajı yok (beceri düzeyinde avantaj kancası) |
| B | ZK#10 | Kızıl İzci Derisi (Scarlet Scout Leather) | Zırh ek etkisi | kismi | inisiyatif +1 çalışır; Stealth +1 ve bitki örtüsünde zorlu arazi muafiyeti yok |
| B | ZK#11 | Çeviklik Zırhı (Armor of Fleetness) | Zırh | kismi | Breastplate giyilmeli (taban 14 + sihirli +2); başka zırh giyilirse ek yine eklenir (O3b bağı yok); orta zırhta DEX tavanı kalkmıyor (motor sabit +2) |
| B | ZK#12 | Gölge Şövalyesi Yarım Plakası (Shadowknight Half Plate) | Gölge Zırhı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#15 | Kertenkele Pulu Zırhı (Serpentscale Mail) | Zırh | kismi | Breastplate giyilmeli (taban 14 + sihirli +1); başka zırh giyilirse ek yine eklenir (O3b bağı yok); orta zırhta DEX tavanı kalkmıyor (motor sabit +2) |
| B | ZK#21 | Çalılık Gezgini Zırhı (Briarwander Hide) | Zırh ek etkisi | kismi | DEX kurtarma +1 çalışır; Nature +1 (savaş dışı) ve çalılıkta zorlu arazi muafiyeti yok |
| B | ZK#22 | Cehennem Ocağı Plakası (Hellforge Plate) | Zırh | kismi | Plate Armor giyilmeli (taban 18 + sihirli +2); başka zırh giyilirse ek yine eklenir (O3b bağı yok); STR şartı ve eğitimsiz giyme muafiyeti yok |
| B | ZK#37 | Atik Kedi Tuniği (Nimble Cat Tunic) | Cübbe ek etkisi | kismi | DEX kontrollerinde ve inisiyatifte avantaj, DEX kurtarma +1 çalışır; Long Jump +5 ft yok |
| B | ZK#44 | Gölge Örtüsü Kalkanı (Shadecloak Greatshield) | Kalkan | kismi | +2 AC çalışır; Perception avantajı yok (beceri düzeyinde avantaj kancası) |
| B | ZK#6 | Alacakaranlık Derisi (Twilight Leather) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#6 | Alacakaranlık Derisi (Twilight Leather) | Gölge Koruması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#7 | Örümcek İpeği Zırhı (Spidersilk Armor) | Zırh ek etkisi | kismi | CON kurtarma avantajı ve Web Walker (ağ zorlu arazi değil, Restrained etmez) çalışır; Stealth +1 yok |
| B | ZK#8 | Korsan Kaptanı Ceketi (Corsair Captain's Coat) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#3 | Gölge İzci Başlığı (Shadowtracker Hood) | Temel etki | kismi | inisiyatif +2 çalışır; Perception +2 (beceri bonusu) yok |
| C | GY#33 | İki El Dengesi Eldiveni (Twinhand Gloves) | Çift El Ustalığı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#4 | Örgü Tacı (Weavebound Circlet) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#46 | Zıplama Yayı Çizmeleri (Springvault Boots) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#50 | Bataklık Geçidi Çizmeleri (Mirestrider Boots) | Sağlam Taban | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | KY#46 | Gümüş Damla Maskesi (Silvertear Mask) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#1 | Gölge Kıvılcımı Yüzüğü (Shadowspark Ring) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#16 | Tuzakçının Kilit Yüzüğü (Locksmith's Ring) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#16 | Tuzakçının Kilit Yüzüğü (Locksmith's Ring) | Gölge Soğukluğu | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#40 | Gölge Özü Mühür Taşı (Umbral Sigil Stone) | Tılsım yuvası | kismi | 60 ft karanlık görüş çalışır; Stealth +2 yok |

## Işık düzeyi / gizlilik koşulu (loş, karanlık, parlak, Hidden)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| A | S1#13 | Karanlık Diş (Gloomfang) | Gölge Avcısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#14 | Büyülü Kin Hançeri (Spiteful Dagger) | Gölgeden Vuruş | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#23 | Şafak Mührü Topuzu (Dawnseal Mace) | Şafak Halesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#29 | Alacakaranlık Mızrağı (Dusklight Spear) | Gölge Kesimi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#39 | Kuvvet Arbaleti (Forcebolt Hand Crossbow) | Gölge Koru | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#5 | Korköz Büyük Kılıcı (Cinderheart Greatsword) | Silahın ek etkisi | kismi | 10 ft parlak + 10 ft loş ışık çalışır; yağ/gres/ağ tutuşturma ve buhar yok |
| A | S2#54 | Sessiz İğne Üfleci (Silent Needle Blowgun) | Fısıltı Atışı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#68 | Gece Yargıcı Palası (Nightjudge Scimitar) | Kör Eden Gölge | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#68 | Gece Yargıcı Palası (Nightjudge Scimitar) | Sessiz Kesim (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#69 | Kül Ateşi El Arbaleti (Hellcinder Hand Crossbow) | Pusu Alevi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#71 | Gölgeli Kısa Yay (Shadowveil Shortbow) | Gölge Nişanı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#43 | Sessiz Bıçak Zırhı (Silentblade Scale) | Suskun Adım | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#18 | Kanlı Gölge Örtüsü (Shadeblood Mantle) | Pusu Keskinliği | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#3 | Gölge İzci Başlığı (Shadowtracker Hood) | Karanlık Keskinliği | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#32 | Işıltı Saçan Eldiven (Luminous Gauntlets) | Parlayan İz | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#4 | Körleştiren Işık Yüzüğü (Dazzling Halo Ring) | Körleştiren Hare | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#7 | Işık Çağrısı Yüzüğü (Lightcall Ring) | Aydınlık Avı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#9 | Gölge Yürüyen Yüzüğü (Eversight Shadow Ring) | Gölge Kesiği | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |

## Yükseklik, atlama, iniş tetiği

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| A | KY#26 | Kan Ayini Üç Dişli Mızrağı (Bloodrite Trident) | Kızıl Ayin (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#31 | Kasırga Tekme Sargısı (Gale Footwraps) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#31 | Kasırga Tekme Sargısı (Gale Footwraps) | Gökten İniş Tekmesi (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#27 | Sarsıntı Tokmağı (Shockwave Maul) | İniş Sarsıntısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#28 | Fırtına Zıpkını (Tempest Trident) | Gök Patlaması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#31 | Geri Dönen Kargı (Homing Pike) | Yüksekten Saplama | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#38 | Keskin Nişancı Yayı (Deadeye Longbow) | Kule Üstünlüğü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#46 | Gök Gürültüsü Tokmağı (Thunderclap Mace) | Çan Patlaması (2 yük, UD 1d2) | kismi | Thunderwave çalışır; su yüzeyini bir halka genişletme yok |
| A | S2#52 | Kutsal Yıldız Gürzü (Sunstar Morningstar) | Şafak Patlaması (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#59 | Gök Düşüren Arbalet (Skyfall Heavy Crossbow) | Kanat Kıran | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#65 | Sıçrama Kargısı (Vaulting Pike) | Sırık Sıçraması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#87 | Kamçılayan Azap Topuzu (Scourge of Torment Mace) | Azap Patlaması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#41 | Yırtıcı Tüy Pelerini Zırhı (Raptor Feather Coat) | Atlayış Kesimi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#51 | Yeşil Bakır Hisar Plakası (Verdigris Bastion Plate) | Kaya Kütlesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#53 | Kök Şövalye Zırhı (Primordial Knight Plate) | Kadim Şekil Gücü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#1 | Kuzgun Kanadı Derisi (Ravenwing Leather) | Yüksek Avcı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#13 | Zehirli Kabuk Zırhı (Venomcarapace Scale) | Spor Patlaması (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#46 | Zıplama Yayı Çizmeleri (Springvault Boots) | Gümleyen İniş | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#6 | Yırtıcı Miğfer (Apex Stalker Helm) | Kaya Gözcüsü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |

## Büyü saldırısı ve DC'ye ayrı/tek taraflı bonus, belli büyü türüne bonus (motorda tek eşit bonus.spell)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| A | S1#10 | Fısıltı Meçi (Whispering Rapier) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#34 | Kırağı Asası (Hoarfrost Staff) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#34 | Kırağı Asası (Hoarfrost Staff) | Ayaz Yüreği | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#35 | Büyü Kıvılcımı Asası (Sparkweave Staff) | Kıvılcım Akışı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#76 | Kor Alev Asası (Incandescent Ember Staff) | Silahın ek etkisi | kismi | ateş direnci çalışır; yalnız menzilli büyü saldırısına +1 ve sınırsız Fire Bolt yok |
| A | S2#78 | Yankı Asası (Resonance Staff) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#78 | Yankı Asası (Resonance Staff) | Element Yankısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#80 | Kutsama Asası (Staff of Arcane Benediction) | Güçlü Kutsama | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#1 | Kara Malek'in Terk Edilmiş Filakteri Sarkacı (Abandoned Phylactery Pendulum) | Büyü odağı | planli | büyü saldırısına +3 ile DC'ye +2 ayrı değer; motorda tek büyü bonusu (bonus.spell) var; Frightened/Charmed/Unconscious hedefe DC +3 koşulu yok |
| B | ZK#2 | Yosun Örtüsü Zırhı (Mossmantle Armor) | Zırh ek etkisi | kismi | CON kurtarma avantajı (konsantrasyon dahil) çalışır; yalnız büyü DC'sine +1 (saldırıya değil) kancası yok |
| B | ZK#32 | Örgü Dokuması Cübbe (Weavewoven Robe) | Cübbe ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#33 | Karizmatik Büyücü Cübbesi (Resonant Caster Robe) | Gür Cantrip | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#38 | Zehirci Cübbesi (Venomweaver Robe) | Zehir İzi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#4 | Spor Bekçisi Derisi (Sporewarden Leather) | Zırh ek etkisi | kismi | nekrotik direnci çalışır; yalnız büyü DC'sine +1 kancası yok |
| C | GY#2 | Odak Kıvılcımı Miğferi (Focus Surge Helm) | Vuruştan Odak | kismi | CON kurtarma +1 çalışır; silah isabetinden sonra ilk büyüye DC/saldırı +2 kancası yok |
| C | GY#27 | Alevli Yumruk Eldiveni (Blazing Fist Gauntlets) | Temel etki | kismi | büyü saldırısı/DC +1 ve STR kurtarma +1 çalışır; silaha 1d4, Unarmed Strike'a 1d6 ateş eki yok (eşyada tek isabet eki) |
| C | GY#5 | Alev Yutan Başlık (Embercrown Hood) | Kor Odaklanması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#8 | Gök Gürültüsü Şapkası (Stormsong Hat) | Fırtına Yükselişi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | KY#45 | Yıldız Taşı Tacı (Starstone Crown) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | KY#54 | Kar Cadısı Şapkası (Snow Witch Hat) | Kış İradesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#14 | Kül Ezgisi Yüzüğü (Elemental Infusion Ring) | Element Kaplaması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#20 | Yedek Yuva Kolyesi (Spellwell Amulet) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#22 | Adanmışlık Tılsımı (Devout's Medallion) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#23 | Kıvılcım Düğümü Kolyesi (Spellspark Pendant) | Element Güçlendirmesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#28 | Element Kurbanı Kolyesi (Torment Conduit Amulet) | Yüzey Aktarımı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#5 | Ayaz Halka Yüzüğü (Snowburst Ring) | Kırağı Halkası | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#8 | Örgü Ahengi Yüzüğü (Spellstrike Ring) | Cantrip Ahengi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |

## Hasar türü/durum uygulama/öldürme/iyileştirme tetikleri ("verdiğinde", "uyguladığında", "0 HP'ye düşürdüğünde")

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| A | KY#1 | Alev Sömüren Büyük Kılıç (Flame-Siphon Greatsword) | Can Sömürüsü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#18 | Dönen Ocak Çekici (Homing Forge Hammer) | Ağır Fırlatış | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#19 | Dönen Ocak Baltası (Homing Forge Greataxe) | Bumerang Kesimi (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#7 | Kızıl Akıntı Katanası (Bloodtide Katana) | Kızıl Yara | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#11 | İvme Palası (Stride Scimitar) | Atik Adım | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#15 | Ayaz Kesici (Frostbite Dagger) | Buz Karşılığı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#17 | İlk Kan Kısa Kılıcı (Firstblood Shortsword) | İlk Çizik | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#3 | Kızıl Doymaz (Crimson Maw) | Kan İçen | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#34 | Kırağı Asası (Hoarfrost Staff) | Buz Kıskacı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#4 | Suskun Demir (Mute Iron) | Sözü Kes | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#9 | Kıvılcım Kılıcı (Stormbrand) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#41 | Çift Kıvılcım Baltası (Twinspark Greataxe) | Sıçrayan Kıvılcım | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#43 | Buz Kıran Balyoz (Glacierbreak Maul) | Donmuş Zemin | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#48 | Yağlı Meşale Sopası (Pitchtorch Club) | Körüklü Alev | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#60 | Koçbaşı Asası (Battering Ram Staff) | Koç Darbesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#61 | Şimşek Ciriti (Stormbolt Javelin) | Yüksek Gerilim | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#67 | Kırmızı Fısıltı (Crimson Whisper) | Kızıl Sis (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#75 | Başbüyücü Odası Asası (Archmage's Conduit Staff) | Örgü Emici | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#77 | Taç Asası (Sovereign's Staff) | Hükümdar Karşılığı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#83 | Kırılgan Hüküm (Shattervow Greatsword) | Son Hüküm (Tek Kullanım) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#84 | Sancak Komutanı Kılıcı (Marshal's Banner Longsword) | Coşturan İnfaz | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#88 | Kan Ayini Hançeri (Bloodrite Dagger) | İsabet Bereketi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#90 | Lanetli Çılgınlık Gürzü (Frenzied Blood Flail) | Kanla Diril | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#2 | Kör Nokta Cübbesi (Robe of the Blindspot) | Gölge Kayması (2/UD, Tepki) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#3 | Dağ Ezen'in Zincirli Dikilitaşı (Mountain-Crusher's Chained Monolith) | Sütun Sarsıntısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#37 | Büyü Yansıtan Büyük Kalkan (Spellmirror Greatshield) | Ayna Yansıtması (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#42 | Dikenli Çelik Zırhı (Bramble Iron Plate) | Dikenli Temas | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#52 | Savaş Büyücüsü Cübbe Zırhı (Spellblade Coat) | Silah Sanatı Odağı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#55 | Yalnızlık Şövalyesi Plakası (Solitude Knight Plate) | Siper Karşılığı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#17 | Kıvılcım Yeleği (Sparkmesh Chain Shirt) | Çarpan Halka (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#18 | Psişik Kalkan Zırhı (Mindward Half Plate) | Zihin Dirilişi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#19 | Işık Dalgalı Göğüslük (Sunburst Breastplate) | Kamaştıran Hare | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#20 | Sıyrılan Zincir Gömlek (Slipstream Chain Shirt) | Kaygan Şifa | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#22 | Cehennem Ocağı Plakası (Hellforge Plate) | Kor Karşılığı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#24 | Yutucu Kemik Plakası (Devouring Bone Plate) | Avcı İştahı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#31 | Dalgalanan Kuvvet Zırhı (Forcewave Chain Mail) | Kuvvet Geri Tepmesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#32 | Örgü Dokuması Cübbe (Weavewoven Robe) | Örgü Yutucu | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#35 | Ruh Yenileyen Keşiş Yeleği (Soulmender Monk Vest) | Akıcı Karşılık | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#35 | Ruh Yenileyen Keşiş Yeleği (Soulmender Monk Vest) | Sakin Ruh | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#39 | Yürüyen Hisar Kalkanı (Walking Bastion Shield) | Hisar Karşılığı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#40 | Saptıran Şövalye Kalkanı (Deflector Knight Shield) | Mermi Saptırma (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#9 | Ozanın İyilik Ceketi (Minstrel's Favor Jerkin) | Paylaşılan Moral | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#10 | Göksel Şifa Çemberi (Dawnmender Circlet) | Şifa Yankısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#13 | Kıvılcım Çemberi (Sparkcrest Circlet) | Statik Kalkan | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#14 | Gölge Yürüyüşü Pelerini (Shadowstep Cloak) | Ölüm Perdesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#15 | Örgü Kıvrımı Pelerini (Weavefold Cloak) | Element Emme (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#19 | Buzul Sis Pelerini (Frostmist Cloak) | Ayaz Tepkisi | kismi | 1d4 soğuk karşılığı çalışır (retort); turda bir DC 13 CON hız −10 ft ve su altıgenini buza çevirme yok |
| C | GY#21 | Gök Gürültüsü Örtüsü (Thunderskin Cloak) | Çınlayan Deri | kismi | 1d4 gürültü karşılığı çalışır (retort); turda bir DC 14 CON Deafened yok |
| C | GY#24 | Şifacı Omuz Örtüsü (Mender's Mantle) | Zehirden Şifa | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#25 | Ruh Yakalayan Eldiven (Soulcatcher Gauntlets) | Ruh Akışı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#30 | Yankı Göğü Eldiveni (Skythunder Gloves) | Yankı Çatlağı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#34 | Kış Pençesi Eldiveni (Winterclaw Gloves) | Donan Ayaklar | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#35 | Şifacı Zırh Eldiveni (Warding Healer Gloves) | Kutsanmış Zırh | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#36 | Asit İzi Eldiveni (Ichorous Gloves) | Asit Sıçraması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#44 | Yankı Adımı Çizmeleri (Stormstep Boots) | Sarsan Yankı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#9 | Kutsama Tacı (Diadem of Spellstrike) | Büyüsel Ahenk | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | KY#47 | Soluk Kan Maskesi (Pale Blood Mask) | Kan Coşkusu | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | KY#48 | Mantar Taç Başlığı (Fungal Crown) | Spor Beslenmesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#10 | Kutsanmış Şifa Yüzüğü (Whispering Promise Ring) | Şifa Kutsaması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#15 | Zehirli Diken Yüzüğü (Venomthorn Ring) | Zehir Keskinliği | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#17 | Çiftçi Kökü Yüzüğü (Rootgrip Ring) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#18 | Sarsıntı Kırığı Yüzüğü (Fracture Ring) | Yankı Kesintisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#2 | Yüksek Emir Yüzüğü (High Command Ring) | İnfaz Mührü (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#27 | Zehirli İntikam Kolyesi (Venomkiss Pendant) | Zehirli Şifa | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |

## Yük harcayan özgün aktif güçler (eylem/bonus/tepki; SRD büyüsüyle birebir değil)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| A | KY#1 | Alev Sömüren Büyük Kılıç (Flame-Siphon Greatsword) | Yanan Yarık (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#10 | Altın Denge İki Elli Kılıcı (Golden Poise Greatsword) | Sarsılmaz Duruş (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#11 | Küllü Ayaz Katanası (Cinderfrost Katana) | Buzlu Yıldırım (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#12 | Yıldız Çifti Büyük Kılıçları (Twin Starblades) | Yıldız Çekimi (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#13 | Bulutsu Kanat Palası (Nebula Wing Scimitar) | Bulutsu Mayınları (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#14 | Yıldız Tozu Gürzü (Stardust Flail) | Yıldız Halkası (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#15 | Göktaşı Çene Kazması (Meteor Jaw War Pick) | Gök Dikeni (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#16 | Kor Sürükleyen Balyoz (Cinderdrag Maul) | Kızgın Hücum (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#17 | Dişli Çark Baltası (Sawtooth Wheel Greataxe) | Dönen Dişli (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#2 | Ayaz Hilal Büyük Kılıcı (Frostcrescent Greatsword) | Ayaz Hilali (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#20 | Gölge Çiçeği Balyozu (Shadowbloom Maul) | Üçlü Çöküş (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#21 | Kızıl Çekiç (Scarlet Anvil Maul) | Çürük Darbesi (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#24 | Kör Nokta İkiz Bıçakları (Blindspot Backhand Blades) | Kör Nokta Kayışı (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#25 | Işık Biriktiren Çift Mızrak (Luster Twinblade) | Parlaklık Yükü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#25 | Işık Biriktiren Çift Mızrak (Luster Twinblade) | Altın Girdap Işını | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#27 | Gök Yıldırımı Mızrağı (Skybolt Spear) | Kadim Şimşek Atışı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#28 | Rüzgâr Burgusu Kargısı (Windspiral Pike) | Hortum Burgusu (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#3 | Burgu İnfaz Kılıcı (Corkscrew Executioner Sword) | Dönen İnfaz (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#30 | Kuru Yaprak Dövüş Sargısı (Dryleaf Handwraps) | Silah | kismi | taban silah mace; fark henüz oyunda yok: Unarmed Strike'ı silah sayma (1d6 ezici, Finesse/Light, Push) |
| A | KY#32 | Köz Parfüm Şişesi (Ember Perfume Bottle) | Yürüyen Kıvılcım (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#33 | Yıldırım Parfüm Şişesi (Storm Perfume Bottle) | Kıvılcım Yağmuru (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#35 | Kızıl İğne Mızrağı (Crimson Needle Rapier) | İğne Hücumu (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#4 | Yarık Çökerten Dev Kılıç (Riftbreaker Greatsword) | Yerçekimi Yarığı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#5 | Girdap Katanası (Whirlwind Katana) | Çelik Dansı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#6 | Aykesen Katana (Mooncut Katana) | Kından Kesim (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#7 | Kızıl Akıntı Katanası (Bloodtide Katana) | Kan Yayı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#8 | Ufuk Işığı Büyük Kılıcı (Horizonlight Greatsword) | Altın Ufuk Dalgası (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#9 | Kara Alev Yemin Kılıcı (Blackflame Oathblade) | Kara Alev Yargısı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#1 | Devkıran Pala (Giantbreaker Blade) | İri Avı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#1 | Devkıran Pala (Giantbreaker Blade) | Dev Duruşu | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#10 | Fısıltı Meçi (Whispering Rapier) | Ürperti Fısıltısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#12 | Kan Susuzu (Blooddrinker) | Derin Yara | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#14 | Büyülü Kin Hançeri (Spiteful Dagger) | Zihin Çelme | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#18 | Nöbet Teberi (Vigil Halberd) | Durduran Tepki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#19 | Kor Ağızlı Balta (Embermaw Greataxe) | Kor Savurması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#2 | Yıldız Kesiği (Starcleave) | Zihin Kırığı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#20 | Esinti Tırpanı (Breeze Glaive) | Yel Süpürmesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#20 | Esinti Tırpanı (Breeze Glaive) | Mühür Bozma | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#21 | Ejdernefes Kargısı (Wyrmbreath Glaive) | Element Aşıla | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#22 | Büyü Kıran Balta (Spellbreaker Battleaxe) | Kan Hırsı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#23 | Şafak Mührü Topuzu (Dawnseal Mace) | Sönmeyen Nefes (1 yük, uzun dinlenme) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#23 | Şafak Mührü Topuzu (Dawnseal Mace) | Güneş Huzmesi (1 yük, uzun dinlenme) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#25 | Zincir Kıran Çekiç (Chainbreaker Warhammer) | Bağları Parçala | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#26 | Dört Mevsim Gürzü (Four-Seasons Flail) | Mevsim Değiştir | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#3 | Kızıl Doymaz (Crimson Maw) | Yıkım Bedeli | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#30 | Dalga Zıpkını (Tidecaller Trident) | Şimşek Ucu | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#32 | Elementler Asası (Staff of the Confluence) | Büyü Pili (1 yük, uzun dinlenme) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#33 | Sönük Kemik Asası (Ashen Bone Staff) | Çürütme (2 yük, uzun dinlenme 1d2) | planli | eşya büyüsünde yük maliyeti uygulanmıyor (2 yük yerine 1 düşer) ve Necromancy save dezavantajı yok; kanca |
| A | S1#35 | Büyü Kıvılcımı Asası (Sparkweave Staff) | Büyü Kesen (1 yük, uzun dinlenme) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#36 | Arındırma Değneği (Purging Wand-Staff) | Su ve Arındırma (3 yük, uzun dinlenme 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#37 | Gök Işığı Uzun Yayı (Skylight Longbow) | Işık İşareti (3 yük, uzun dinlenme 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#37 | Gök Işığı Uzun Yayı (Skylight Longbow) | Gök İvmesi (1 yük, uzun dinlenme) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#40 | Dev Kirişli Yay (Giant-Sinew Longbow) | Sarsan Ok | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#6 | Düellocu Mührü (Duelist's Signet) | Meydan Oku | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#6 | Düellocu Mührü (Duelist's Signet) | Keskin Karşılık | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#7 | Ağıt Kılıcı (Dirge Blade) | İki Ton (3 yük, uzun dinlenme 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#8 | Rüzgâr Dengesi (Windpoise) | Kasırga Kesimi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#41 | Çift Kıvılcım Baltası (Twinspark Greataxe) | Alev Halesi (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#42 | Sıçrayan Kükürt Gürzü (Brimstone Flail) | Aşındıran Darbe (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#43 | Buz Kıran Balyoz (Glacierbreak Maul) | Buzul Darbesi (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#44 | Buharlı Savaş Baltası (Scaldstream Battleaxe) | Kaynayan Kesim (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#45 | Bataklık Dişi Palası (Mirefang Scimitar) | Batak Dumanı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#47 | Ağkesen Uzun Kılıç (Webrender Longsword) | İpek Bağ (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#49 | Kıvılcımlı El Baltası (Sparkling Handaxe) | Metal Çekimi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#51 | Dikenli Zincir Kamçı (Barbed Chain Whip) | Zincir Çekişi (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#53 | Çukur Delen Savaş Kazması (Delver's War Pick) | Zırh Çatlağı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#54 | Sessiz İğne Üfleci (Silent Needle Blowgun) | Uyku İğnesi (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#55 | Yıldız Taşı Sapanı (Starstone Sling) | Sarsan Taş (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#59 | Gök Düşüren Arbalet (Skyfall Heavy Crossbow) | Çekme Halatı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#60 | Koçbaşı Asası (Battering Ram Staff) | Sarsan Toslama (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#62 | Çökertme Balyozu (Earthshatter Maul) | Yer Vuruşu (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#63 | Kancalı Tırpan Kargı (Hooklash Glaive) | Kanca Çekişi (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#71 | Gölgeli Kısa Yay (Shadowveil Shortbow) | Körleştirici Ok (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#75 | Başbüyücü Odası Asası (Archmage's Conduit Staff) | Yuva Geri Kazanımı (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#84 | Sancak Komutanı Kılıcı (Marshal's Banner Longsword) | Komutan Buyruğu (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#85 | Yakarış Uzun Yayı (Banshee's Wail Shortbow) | Ürperten Ok (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#88 | Kan Ayini Hançeri (Bloodrite Dagger) | Kan Adakı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#1 | Kara Malek'in Terk Edilmiş Filakteri Sarkacı (Abandoned Phylactery Pendulum) | Korku Yükleri (6 yük, UD 1d4+2; 30 ft içinde korkmuş düşman ölünce veya kritik başarısız save atınca +1 yük) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#2 | Kör Nokta Cübbesi (Robe of the Blindspot) | Zihin Perdesi (1/UD, Bonus Eylem) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#3 | Dağ Ezen'in Zincirli Dikilitaşı (Mountain-Crusher's Chained Monolith) | Arena Yaran Savuruş (2/UD, Eylem — iki moddan biri) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#4 | Şampiyonun Kaya Koşumu (Champion's Crag Harness) | Kaya Yankısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#4 | Şampiyonun Kaya Koşumu (Champion's Crag Harness) | "Sağlam Oyuncak!" Meydan Okuması (2/UD, Bonus Eylem) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#6 | Kaltakkıran'ın Çeneli Zincir Kılıcı (Kaltakkıran's Maw-Chain Greatsword) | Çift Form Geçişi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#6 | Kaltakkıran'ın Çeneli Zincir Kılıcı (Kaltakkıran's Maw-Chain Greatsword) | Boğucu Kıskaç ve Zaaf Akımı (2 yük, UD; Karanlık Final'de 3 yük) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#38 | Tek Gözlü Topçu Kalkanı (One-Eyed Mortar Shield) | Havan Atışı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#39 | Alev Yüzlü Kalkan (Flamevisage Greatshield) | Kalkan Alevi (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#49 | Kraliyet Kalıntısı Zırhı (Royal Remnant Plate) | Kraliyet Dirilişi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#1 | Kuzgun Kanadı Derisi (Ravenwing Leather) | Kuzgun Kanadı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#12 | Gölge Şövalyesi Yarım Plakası (Shadowknight Half Plate) | Karanlık Kalkanı (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#22 | Cehennem Ocağı Plakası (Hellforge Plate) | Alev Kanadı (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#25 | Biçici Karanlık Plakası (Reaper's Iron Plate) | Ölü Feryadı (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#27 | Adanmışlık Plakası (Plate of Devotion) | Ebedi Adanmışlık (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#3 | Ay Biçimi Derisi (Moonshift Hide) | Ay Koruması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#4 | Spor Bekçisi Derisi (Sporewarden Leather) | Spor Kesesi (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#43 | Kor Karşılığı Kalkanı (Cinderback Shield) | Alevli Siper (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#8 | Korsan Kaptanı Ceketi (Corsair Captain's Coat) | İnatçı Kaptan (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#8 | Korsan Kaptanı Ceketi (Corsair Captain's Coat) | Kaptanın Emri (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#26 | Pusula Eldiveni (Compass Gloves) | Konum Kaydır (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#3 | Gölge İzci Başlığı (Shadowtracker Hood) | Görünmezi Seç (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#37 | Büyülü Çeviklik Eldiveni (Dexterous Silk Gloves) | Temel etki | kismi | DEX 18 sabitlemesi çalışır (zaten 18+ ise etkisiz); silah saldırısına +1 yok |
| C | GY#41 | Buz Çivili Avcı Çizmeleri (Frostspike Boots) | Ayaz Adımı (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#42 | Gök Sıçrayışı Çizmeleri (Skyvault Boots) | Sarsılmaz Adım (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#43 | Süratli Akın Çizmeleri (Rushstrike Boots) | Topuk İvmesi (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#47 | Suda Yürüyen Sandalet (Waterskipper Sandals) | Su Üstünde (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#7 | Kızıl Hiddet Tacı (Crimson Fury Circlet) | Yaralı Öfke | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | BOSS#19 | Koruyucu Ejderha Mührü (Guardian Dragon Sigil) | Koruyucunun Nefesi (1/UD, Eylem) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#1 | Gölge Kıvılcımı Yüzüğü (Shadowspark Ring) | Hızlı Yanılsama (3 yük, UD 1d3) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#11 | Kıvılcım Halkası (Sparkswall Ring) | Yalıtımlı Taban | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#17 | Çiftçi Kökü Yüzüğü (Rootgrip Ring) | Kök Şifası (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#19 | Yaşam Kaynağı Tılsımı (Lifespring Amulet) | Yaşam Pınarı (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#20 | Yedek Yuva Kolyesi (Spellwell Amulet) | Yuva Pınarı (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#21 | Yeniden Doğuş Tılsımı (Rebirth Idol Amulet) | Kül Dirilişi (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#22 | Adanmışlık Tılsımı (Devout's Medallion) | İlahi Akış (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#24 | Cerrahi Felç Kolyesi (Subjugation Pendant) | Sinir Kilidi (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#26 | Damgalayan Tılsım (Brandbreaker Amulet) | Zayıf Damga (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#29 | Berrak Zihin Kolyesi (Clearmind Pendant) | İç Dinginlik (1 yük, UD) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#31 | Karanlık Kanat Muskası (Dreadwing Charm) | Temel etki | kismi | karanlık görüşü olmayana 30 ft çalışır; olanın menziline +30 ft eklenmez (motorda en yüksek değer) |
| D | YT#31 | Karanlık Kanat Muskası (Dreadwing Charm) | Son Kaçış | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#32 | Gümüş İğne Muskası (Silverthread Locket) | Acil Müdahale (2 yük, UD 1d2) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#33 | Kızgın Yürek Tılsımı (Emberheart Talisman) | Son Kor | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#42 | Öz Çekirdeği Taşı (Aether Core Stone) | Tılsım yuvası (Kaçınma Halesi) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |

## Durum/koşul kancaları (yarı can, konsantrasyon, su/yüzey, zırhsız, binek…)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| A | KY#11 | Küllü Ayaz Katanası (Cinderfrost Katana) | Silah | kismi | taban silah longsword; fark henüz oyunda yok: ustalık Vex≠Sap, +Finesse |
| A | KY#12 | Yıldız Çifti Büyük Kılıçları (Twin Starblades) | Silah | kismi | taban silah greatsword; fark henüz oyunda yok: ustalık Cleave≠Graze |
| A | KY#18 | Dönen Ocak Çekici (Homing Forge Hammer) | Silah | kismi | taban silah warhammer; fark henüz oyunda yok: +Thrown |
| A | KY#18 | Dönen Ocak Çekici (Homing Forge Hammer) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#19 | Dönen Ocak Baltası (Homing Forge Greataxe) | Silah | kismi | taban silah greataxe; fark henüz oyunda yok: +Thrown |
| A | KY#2 | Ayaz Hilal Büyük Kılıcı (Frostcrescent Greatsword) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#23 | Kıvılcım Dövme Çekici (Sparkforge Hammer) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#25 | Işık Biriktiren Çift Mızrak (Luster Twinblade) | Silah | kismi | taban silah longsword; fark henüz oyunda yok: SRD karşılığı yok: 1d8 kesici, Finesse+Two-Handed, Vex |
| A | KY#26 | Kan Ayini Üç Dişli Mızrağı (Bloodrite Trident) | Silah | kismi | taban silah trident; fark henüz oyunda yok: +Reach |
| A | KY#27 | Gök Yıldırımı Mızrağı (Skybolt Spear) | Silah | kismi | taban silah spear; fark henüz oyunda yok: zar 1d8 (1d10)≠1d6 (1d8), +Finesse |
| A | KY#29 | Şerit Kamçı Kılıcı (Ribbon Whip-Blade) | Silah | kismi | taban silah whip; fark henüz oyunda yok: zar 1d6≠1d4 |
| A | KY#31 | Kasırga Tekme Sargısı (Gale Footwraps) | Silah | kismi | taban silah flail; fark henüz oyunda yok: Unarmed Strike'ı silah sayma (1d8 ezici, Finesse/Light, Topple) |
| A | KY#32 | Köz Parfüm Şişesi (Ember Perfume Bottle) | Silah | kismi | taban silah dart; fark henüz oyunda yok: SRD karşılığı yok: 1d6 ateş, 15 ft, Finesse/Light |
| A | KY#32 | Köz Parfüm Şişesi (Ember Perfume Bottle) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#33 | Yıldırım Parfüm Şişesi (Storm Perfume Bottle) | Silah | kismi | taban silah dart; fark henüz oyunda yok: SRD karşılığı yok: 1d6 yıldırım, 15 ft, Finesse/Light |
| A | KY#33 | Yıldırım Parfüm Şişesi (Storm Perfume Bottle) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#34 | Ayaz Parfüm Şişesi (Frost Perfume Bottle) | Silah | kismi | taban silah dart; fark henüz oyunda yok: SRD karşılığı yok: 1d6 soğuk, 15 ft, Finesse/Light |
| A | KY#35 | Kızıl İğne Mızrağı (Crimson Needle Rapier) | Kızıl Çürük | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | KY#4 | Yarık Çökerten Dev Kılıç (Riftbreaker Greatsword) | Silah | kismi | taban silah maul; fark henüz oyunda yok: adı kılıç, istatistiği Maul (2d6 ezici, Topple) |
| A | KY#5 | Girdap Katanası (Whirlwind Katana) | Silah | kismi | taban silah longsword; fark henüz oyunda yok: ustalık Vex≠Sap, +Finesse, +Reach |
| A | KY#6 | Aykesen Katana (Mooncut Katana) | Silah | kismi | taban silah longsword; fark henüz oyunda yok: ustalık Vex≠Sap, +Finesse |
| A | KY#7 | Kızıl Akıntı Katanası (Bloodtide Katana) | Silah | kismi | taban silah longsword; fark henüz oyunda yok: ustalık Vex≠Sap, +Finesse |
| A | S1#12 | Kan Susuzu (Blooddrinker) | Yan El Siperi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#13 | Karanlık Diş (Gloomfang) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#15 | Ayaz Kesici (Frostbite Dagger) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#16 | Sızıntı Bıçağı (Seeping Knife) | Acı Yeri | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#2 | Yıldız Kesiği (Starcleave) | Odak Yırtığı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#20 | Esinti Tırpanı (Breeze Glaive) | Silah | kismi | taban silah glaive; fark henüz oyunda yok: +Finesse, −Heavy |
| A | S1#20 | Esinti Tırpanı (Breeze Glaive) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#22 | Büyü Kıran Balta (Spellbreaker Battleaxe) | Odak Yıkan | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#24 | Zırh Kıran Balyoz (Shellbreaker Maul) | Kabuk Yaran | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#24 | Zırh Kıran Balyoz (Shellbreaker Maul) | Sarsıcı Kritik | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#25 | Zincir Kıran Çekiç (Chainbreaker Warhammer) | Büyü Kalkanı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#27 | Sarsıntı Tokmağı (Shockwave Maul) | Kırık Kan | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#28 | Fırtına Zıpkını (Tempest Trident) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#28 | Fırtına Zıpkını (Tempest Trident) | Yel Örtüsü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#30 | Dalga Zıpkını (Tidecaller Trident) | Su Çağrısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#31 | Geri Dönen Kargı (Homing Pike) | Silah | kismi | taban silah pike; fark henüz oyunda yok: +Thrown |
| A | S1#31 | Geri Dönen Kargı (Homing Pike) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#33 | Sönük Kemik Asası (Ashen Bone Staff) | Solgun Emme | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#38 | Keskin Nişancı Yayı (Deadeye Longbow) | Keskin Nişan | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#39 | Kuvvet Arbaleti (Forcebolt Hand Crossbow) | Silah | kismi | taban silah hand-crossbow; fark henüz oyunda yok: hasar türü kuvvet |
| A | S1#39 | Kuvvet Arbaleti (Forcebolt Hand Crossbow) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#40 | Dev Kirişli Yay (Giant-Sinew Longbow) | Ağır Çekiş | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#5 | Korköz Büyük Kılıcı (Cinderheart Greatsword) | Silah | kismi | ek 1d4 ateş derin suda da işler (sönme yok) |
| A | S1#6 | Düellocu Mührü (Duelist's Signet) | Zarif Duruş | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S1#9 | Kıvılcım Kılıcı (Stormbrand) | Silah | kismi | saldırı ve hasarda INT seçimi yok (kanca) |
| A | S2#44 | Buharlı Savaş Baltası (Scaldstream Battleaxe) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#44 | Buharlı Savaş Baltası (Scaldstream Battleaxe) | Buhar Gözü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#45 | Bataklık Dişi Palası (Mirefang Scimitar) | Zehir Takibi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#47 | Ağkesen Uzun Kılıç (Webrender Longsword) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#47 | Ağkesen Uzun Kılıç (Webrender Longsword) | Avı Zehirle | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#50 | Süvari Hücum Kargısı (Lancer's Charge Lance) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#50 | Süvari Hücum Kargısı (Lancer's Charge Lance) | Süvari Hücumu | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#52 | Kutsal Yıldız Gürzü (Sunstar Morningstar) | Göz Alıcı Darbe | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#53 | Çukur Delen Savaş Kazması (Delver's War Pick) | Kaya Yaran | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#54 | Sessiz İğne Üfleci (Silent Needle Blowgun) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#55 | Yıldız Taşı Sapanı (Starstone Sling) | Silahın ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#56 | Kıyı Orağı (Tide Sickle) | Kıyı Üstünlüğü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#58 | Gümüş İğne Oku (Silverneedle Dart) | Gümüş Uç | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#65 | Sıçrama Kargısı (Vaulting Pike) | Canavar Avcısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#67 | Kırmızı Fısıltı (Crimson Whisper) | Acımasız Kesik | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#70 | Pusu Kısa Kılıcı (Ambusher's Shortsword) | Öncü Darbesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#72 | Keder Hançeri (Sorrowthorn Dagger) | Acı Kesiği | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#72 | Keder Hançeri (Sorrowthorn Dagger) | Savunmasız Av | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#73 | Akıl Kıran Kısa Kılıç (Mindrend Shortsword) | Zihin Çatlağı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#81 | Orman Sesi Palası (Sylvan Voice Scimitar) | Büyüsel Kavrayış | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#85 | Yakarış Uzun Yayı (Banshee's Wail Shortbow) | Korku Avcısı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#86 | Bağlı Savaş Çekici (Pactbound Warhammer) | Bağ Gücü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#89 | Zırhsız Denge Asası (Unbound Balance Staff) | Yalın Yumruk | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#89 | Zırhsız Denge Asası (Unbound Balance Staff) | Özgür Savunma | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| A | S2#90 | Lanetli Çılgınlık Gürzü (Frenzied Blood Flail) | Doymayan Öfke | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#1 | Kara Malek'in Terk Edilmiş Filakteri Sarkacı (Abandoned Phylactery Pendulum) | Silah | kismi | +3 saldırı/hasar ve 2d6 psişik bağlı Quarterstaff ile çalışır; isabette 10 ft geri itme yok |
| B | BOSS#1 | Kara Malek'in Terk Edilmiş Filakteri Sarkacı (Abandoned Phylactery Pendulum) | Korku Beslemesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#1 | Kara Malek'in Terk Edilmiş Filakteri Sarkacı (Abandoned Phylactery Pendulum) | Kadim İrade Kıran | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#2 | Kör Nokta Cübbesi (Robe of the Blindspot) | Yüzyıllık Nöbet | planli | yalnız konsantrasyon kurtarmasına sabit eklenti kancası yok |
| B | BOSS#2 | Kör Nokta Cübbesi (Robe of the Blindspot) | Algıdan Silinme | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#2 | Kör Nokta Cübbesi (Robe of the Blindspot) | Set Sinerjisi (Filakteri Sarkacı ile) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#3 | Dağ Ezen'in Zincirli Dikilitaşı (Mountain-Crusher's Chained Monolith) | Silah | kismi | +3 saldırı/hasar ve 1d8 gürültü bağlı Maul ile çalışır; 2d8 zarı, Reach 10 ft, geri dönen Thrown 20/60 ve Push seçimi yok |
| B | BOSS#4 | Şampiyonun Kaya Koşumu (Champion's Crag Harness) | Koşum | kismi | zırhsız AC'ye +3 (Unarmored Defense ile toplanır); kalkan taşınırken motor eki düşürür |
| B | BOSS#4 | Şampiyonun Kaya Koşumu (Champion's Crag Harness) | Taşın Kalbi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#4 | Şampiyonun Kaya Koşumu (Champion's Crag Harness) | Dağın Derisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#4 | Şampiyonun Kaya Koşumu (Champion's Crag Harness) | Yıkılmaz Duruş | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#4 | Şampiyonun Kaya Koşumu (Champion's Crag Harness) | Set Sinerjisi (Zincirli Dikilitaş ile — Altıgen Bilardosu) | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#5 | Kaltakkıran'ın Paladin Zırhı (Kaltakkıran's Paladin Armor) | Gövde Onarımı ve Uyum Bedeli | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | BOSS#6 | Kaltakkıran'ın Çeneli Zincir Kılıcı (Kaltakkıran's Maw-Chain Greatsword) | Jiletli Geri Çekiş | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#36 | Delici Şövalye Kalkanı (Piercing Knight Shield) | Kalkan | kismi | kalkan +2 AC çalışır (K8); kalkanla silah saldırısı (1d8 + 2 delici, STR/DEX, Vex) kancası yok, en yakın SRD silahı Rapier |
| B | KY#40 | Dikenli Parmak İzi Kalkanı (Barbed Monolith Shield) | Kalkan | kismi | +2 AC çalışır; zorla itilmeye karşı STR kurtarma avantajı yok |
| B | KY#40 | Dikenli Parmak İzi Kalkanı (Barbed Monolith Shield) | Dikenli İtiş | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#44 | Kızıl İblis Zırhı (Crimson Fiend Plate) | Kızıl Bedel | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | KY#50 | Şifa Örtüsü Cübbesi (Vigil Shroud Robe) | Cübbe | kismi | zırhsız ve kalkansızken (motor kalkan taşınırken eki düşürür) |
| B | KY#50 | Şifa Örtüsü Cübbesi (Vigil Shroud Robe) | Sükûnet Halesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#14 | Ebedi Fırtına Pul Zırhı (Stormplate Scale) | Şok Yansıması | kismi | 1d4 yıldırım karşılığı çalışır (retort: 5 ft içinden yakın dövüş isabeti hasar verince); su altıgeninde yıldırım zinciri yok |
| B | ZK#16 | Ağaç Kabuğu Göğüslüğü (Barkweave Breastplate) | Meşe Yansıması | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#2 | Yosun Örtüsü Zırhı (Mossmantle Armor) | Yeşil Kök | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#23 | Sarsılmaz Yemin Plakası (Plate of Endurance) | Kaya Duruşu | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#24 | Yutucu Kemik Plakası (Devouring Bone Plate) | Zırh ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#30 | Kızgın Demir Plakası (Scorched Iron Plate) | Sıcak Zırh | kismi | 1d4 ateş karşılığı çalışır (retort: her yakın dövüş isabeti hasar verince); yağ/ağ üstündeki saldırganı tutuşturma yok |
| B | ZK#32 | Örgü Dokuması Cübbe (Weavewoven Robe) | Cübbe | kismi | zırhsız ve kalkansızken (motor kalkan taşınırken eki düşürür) |
| B | ZK#33 | Karizmatik Büyücü Cübbesi (Resonant Caster Robe) | Cübbe | kismi | zırhsız ve kalkansızken (motor kalkan taşınırken eki düşürür) |
| B | ZK#33 | Karizmatik Büyücü Cübbesi (Resonant Caster Robe) | Canlı Hare | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#35 | Ruh Yenileyen Keşiş Yeleği (Soulmender Monk Vest) | Cübbe | kismi | zırhsız ve kalkansızken (motor kalkan taşınırken eki düşürür) |
| B | ZK#36 | Dalga Anası Cübbesi (Tidecaller Robe) | Cübbe | kismi | zırhsız ve kalkansızken (motor kalkan taşınırken eki düşürür) |
| B | ZK#36 | Dalga Anası Cübbesi (Tidecaller Robe) | Sulu Diriliş | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#40 | Saptıran Şövalye Kalkanı (Deflector Knight Shield) | Kalkan ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#41 | Korku Kalkanı (Dreadwall Shield) | Kalkan ek etkisi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#41 | Korku Kalkanı (Dreadwall Shield) | Dehşet Yüzü | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| B | ZK#5 | Kızıl Suikastçı Derisi (Crimson Stalker Leather) | Zayıf Nokta Aurası | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#1 | Gözcü Ejderha Miğferi (Vigilant Drake Helm) | Ejderha Dirilişi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#12 | Hızlı Akıl Başlığı (Quickwit Cowl) | İlk İvme | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#16 | Kuzgun Kanadı Pelerini (Stormwing Cloak) | Temel etki | kismi | +1 AC çalışır; düşme hasarına direnç yok |
| C | GY#20 | Kül Güvesi Pelerini (Cindermoth Cloak) | Köz Kıvılcımı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#23 | İvme Pelerini (Trailblazer Cloak) | Koşu Perdesi | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#25 | Ruh Yakalayan Eldiven (Soulcatcher Gauntlets) | Temel etki | kismi | Unarmed Strike isabetine 1d8 kuvvet çalışır; CON +2 (en fazla 20) yok |
| C | GY#27 | Alevli Yumruk Eldiveni (Blazing Fist Gauntlets) | Kızgın Tırnak | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#28 | Hızlı Büyü Eldiveni (Spellquick Gloves) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#29 | Büyülü Hedef Eldiveni (Daredevil Bracers) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#29 | Büyülü Hedef Eldiveni (Daredevil Bracers) | Yakın Nişan | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#31 | Fırlatma Ustası Eldiveni (Slingmaster Gloves) | Güçlü Savurma | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#38 | Kıvılcım Eldiveni (Sparkhand Gloves) | İletken Darbe | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#39 | Karanlık Adım Çizmeleri (Darkstep Boots) | Karanlık Denge | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#40 | Sarsılmaz İnat Çizmeleri (Boots of Unyielding) | Temel etki | kismi | hız +10 ft ve Paralyzed/Restrained kurtarma avantajı çalışır; zorlu arazi muafiyeti ve itilmeye karşı STR avantajı yok |
| C | GY#41 | Buz Çivili Avcı Çizmeleri (Frostspike Boots) | Temel etki | kismi | soğuk direnci ve buz/kar zorlu arazi değil (Ice Walk) çalışır; buzda kayıp Prone olmama yok |
| C | GY#42 | Gök Sıçrayışı Çizmeleri (Skyvault Boots) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#45 | Büyü Dengesi Çizmeleri (Steadyfocus Boots) | Köklü Odak | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#47 | Suda Yürüyen Sandalet (Waterskipper Sandals) | Temel etki | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#47 | Suda Yürüyen Sandalet (Waterskipper Sandals) | Fırtına Suyu | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#48 | Keşişin Hızlı Sandaletleri (Windstep Sandals) | Bilge Adım | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#49 | Kıvılcım Çizmeleri (Sparkstride Boots) | Koşu Kıvılcımı | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | GY#7 | Kızıl Hiddet Tacı (Crimson Fury Circlet) | Sönmeyen Hırs | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| C | KY#46 | Gümüş Damla Maskesi (Silvertear Mask) | Sıvı Bilek | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | BOSS#19 | Koruyucu Ejderha Mührü (Guardian Dragon Sigil) | Temel etki | kismi | tüm kurtarma +1 ve Frightened bağışıklığı çalışır; uzun dinlenmede seçilen 2 türe direnç seçimi yok |
| D | YT#12 | Kurnaz Fırlatış Yüzüğü (Flinging Ring) | Keskin Savuruş | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#23 | Kıvılcım Düğümü Kolyesi (Spellspark Pendant) | Ek Güdümlü Ok | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |
| D | YT#3 | Riskli Zar Yüzüğü (Gambler's Edge Ring) | Kumar Bedeli | kismi | bütün yetenek kurtarmalarında dezavantaj (konsantrasyon dahil) çalışır; ölüm kurtarmasında dezavantaj yok |
| D | YT#35 | Kırağı Mühür Taşı (Frost Sigil Stone) | Tılsım yuvası | kismi | hız +5 ft ve buz/kar zorlu arazi değil (Ice Walk) çalışır; buzda kayıp Prone olmama yok |
| D | YT#38 | Zehir Mühür Taşı (Venom Sigil Stone) | Tılsım yuvası | planli | yalnız silah saldırı zarına +1 kancası yok |
| D | YT#41 | Işıltı Özü Mühür Taşı (Radiant Sigil Stone) | Tılsım yuvası | planli | yeni kanca ya da paket ilkeli gerekir (KATALOG-2) |

## E: alanlı fırlatma, yüzey, çekme/itme, süreli durum (O7; kullanıcı kararı: KATALOG-2)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| E | TK#1 | Çöküntü Küresi (Sinkhole Orb) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#2 | Sıçrayan Kıvılcım Şişesi (Sparkburst Flask) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#3 | Kırağı Küresi (Rimeburst Orb) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#4 | Körleştiren Flaş Kapsülü (Flashblind Capsule) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#5 | Ağ Kesesi Bombası (Websac Bomb) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#6 | Gök Gürültüsü Çivisi (Shrapnel Nailbomb) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#7 | Sarsıntı Küresi (Tremor Sphere) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#8 | Korku Buhuru Bombası (Dreadcenser Bomb) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#9 | Hızlandıran Spor Kesesi (Haste Spore Pod) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#10 | Zırh Delen Şarapnel (Armor-Piercing Canister) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#11 | Aşk Tozu Şişesi (Enthralling Mist Vial) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#12 | Kül Salkım Bombası (Cinder Cluster Bomb) | Nasıl kullanılır | planli | alanlı fırlatma motorda yok (use.throw tek hedefe save; radiusFt okunmuyor); alan, yüzey, çekme/itme, süreli durum ve tur sonu save O7 şema genişlemesini bekler (KATALOG-2) |

## E: özel oklar (K12: yalnız veri; özel cephane seçimi ve tüketimi)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| E | TK#13 | Su Balonu Oku (Watersplash Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#14 | Buhar Bulutu Oku (Steamveil Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#15 | Kırağı Oku (Hoarfrost Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#16 | Gürleyen İtme Oku (Roaring Knockback Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#17 | Şifa Kesen Ok (Blightbone Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#18 | Sıçrayan Yıldırım Oku (Arcing Bolt Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#19 | Çoklu Hedef Oku (Splitflight Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#20 | Işınlanma Oku (Transposition Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#21 | Büyü Kıran Ok (Spellsever Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#22 | Deviren Küt Ok (Knockdown Blunt Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#23 | Kutsanmış Şifa Oku (Blessed Mending Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |
| E | TK#24 | Örtü Aşan Gölge Oku (Shadowpierce Arrow) | Nasıl kullanılır | planli | K12: özel oklar yalnız veri; özel cephane seçimi ve atış başına tüketim motorda yok (KATALOG-2) |

## E: silah kaplamaları (use.coat yalnız ek zar ve tür; isabet sonrası save'li etki O7)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| E | TK#25 | Keskin Nişan Yağı (Oil of Precision) | Nasıl kullanılır | planli | yalnız kaplanan silahın saldırı zarına +2 (hasarsız) motorda yok: weaponPlus hasara da ekler, zar etkisi bütün saldırılara (büyü dahil) işler; O7 (KATALOG-2) |
| E | TK#26 | Yanıcı Reçine Yağı (Oil of Combustion) | Nasıl kullanılır | planli | işaretli hedefin ateş hasarı alınca patlaması tetik kancası ister (PDF: yeni kanca); use.coat yalnız isabete ek zar ve tür verir; isabet sonrası save'li etki/durum O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#27 | Büyü Bozan Zehir (Magebane Venom) | Nasıl kullanılır | planli | use.coat yalnız isabete ek zar ve tür verir; isabet sonrası save'li etki/durum O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#28 | Kundakçı Yağı (Arsonist's Tincture) | Nasıl kullanılır | planli | hedefin ateş direncini geçici bastıran etki yok (PDF: yeni kanca); use.coat yalnız isabete ek zar ve tür verir; isabet sonrası save'li etki/durum O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#29 | Ayaz Kaplama Yağı (Hoarfrost Coating) | Nasıl kullanılır | kismi | her silah isabetine +1d4 soğuk 5 tur çalışır (Basic Poison yolu; kaplama bütün silah saldırılarına işler); DC 14 CON −10 ft hız ve su altıgenini dondurma: isabet sonrası save'li etki/durum O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#30 | Lanet Yağı (Oil of Hexing) | Nasıl kullanılır | planli | use.coat yalnız isabete ek zar ve tür verir; isabet sonrası save'li etki/durum O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#31 | Uyku Özü Zehri (Drowsleep Venom) | Nasıl kullanılır | planli | use.coat yalnız isabete ek zar ve tür verir; isabet sonrası save'li etki/durum O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#32 | Sürüngen Felç Salgısı (Crawler Paralytic) | Nasıl kullanılır | planli | use.coat yalnız isabete ek zar ve tür verir; isabet sonrası save'li etki/durum O7 şema genişlemesini bekler (KATALOG-2) |
| E | TK#33 | Kızıl Solucan Zehri (Crimson Wyrm Toxin) | Nasıl kullanılır | planli | use.coat yalnız isabete ek zar ve tür verir; isabet sonrası save'li etki/durum O7 şema genişlemesini bekler (KATALOG-2) |

## E: iksirler ve çay (mevcut use.effect yolu; eksik kısım notta)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| E | TK#34 | Fiziksel Zırh İksiri (Ironhide Armour Potion) | Nasıl kullanılır | kismi | 12 geçici can çalışır; geçici canın süre sonunda bitmesi motorda yok (use.effect geçici canı kalıcı verir); geçici can sürdükçe B/P/S hasarına −2 her darbede sabit azaltma (O10) ve koşul kancası ister (KATALOG-2) |
| E | TK#35 | Büyü Zırhı İksiri (Spellward Armour Potion) | Nasıl kullanılır | kismi | 12 geçici can çalışır; geçici canın süre sonunda bitmesi motorda yok (use.effect geçici canı kalıcı verir); "geçici can sürdükçe büyü kurtarma avantajı" koşul kancası ister (KATALOG-2), avantaj verilmedi |
| E | TK#36 | Çevik Savuşturma İksiri (Nimble Tumble Potion) | Nasıl kullanılır | kismi | 2 tur sana yapılan saldırılar dezavantajlı (attackedDis) ve hareketin fırsat saldırısı tetiklemez (noProvoke) çalışır; Dodge koşulları (hız 0 ya da Blinded iken kapanması) bu etkiye bağlı değil |
| E | TK#37 | Taş Deri İksiri (Stoneskin Draught) | Nasıl kullanılır | kismi | 20 geçici can, B/P/S direnci, Poisoned/Stunned bağışıklığı ve yarı hız 3 tur çalışır; Burning motorda durum değil (yanma süren etkisi), bağışıklığı yok; geçici canın süre sonunda bitmesi motorda yok (use.effect geçici canı kalıcı verir) |
| E | TK#38 | Sağlam İrade İksiri (Strong Will Draught) | Nasıl kullanılır | kismi | 3 tur Frightened/Charmed/Blinded bağışıklığı ve 10 geçici can çalışır; üzerindeki bu durumların anında kalkması eşya yolunda yok (cureOnCast yalnız büyüde işler); geçici canın süre sonunda bitmesi motorda yok (use.effect geçici canı kalıcı verir) |
| E | TK#39 | Melek Uykusu İksiri (Angelic Reprieve Potion) | Nasıl kullanılır | planli | PDF: 2 tur kesintisiz uyku sonrası savaş içi Short Rest + 1–2. sv. yuva yenileme kancası (KATALOG-2) |
| E | TK#45 | Zümrüt Çay Demlemesi (Emerald Tea Brew) | Nasıl kullanılır | kismi | 2 tur her tur +1 bonus eylem (extraBonus) ve +10 ft yürüme hızı çalışır; eylemsiz (serbest) içme motorda yok: use_item bonus eylem harcar (KATALOG-2) |

## E: eliksirler (K12: yalnız veri; UD'ye dek süre ve tek aktif eliksir, O8)

| Parça | Ref | Eşya | Güç | Durum | Not |
|---|---|---|---|---|---|
| E | TK#40 | Kana Susamışlık Eliksiri (Elixir of Bloodlust) | Nasıl kullanılır | planli | K12: eliksirler yalnız veri; uzun dinlenmeye dek süren etki ve "aynı anda tek eliksir" motorda yok (O8, KATALOG-2) |
| E | TK#41 | Tetikte Olma Eliksiri (Elixir of Vigilance) | Nasıl kullanılır | planli | K12: eliksirler yalnız veri; uzun dinlenmeye dek süren etki ve "aynı anda tek eliksir" motorda yok (O8, KATALOG-2) |
| E | TK#42 | Keskin Kritik Eliksiri (Elixir of Viciousness) | Nasıl kullanılır | planli | K12: eliksirler yalnız veri; uzun dinlenmeye dek süren etki ve "aynı anda tek eliksir" motorda yok (O8, KATALOG-2) |
| E | TK#43 | Savaş Büyücüsü Odak Eliksiri (Elixir of Battlemage Focus) | Nasıl kullanılır | planli | K12: eliksirler yalnız veri; uzun dinlenmeye dek süren etki ve "aynı anda tek eliksir" motorda yok (O8, KATALOG-2) |
| E | TK#44 | Eşsiz Odak Eliksiri (Elixir of Peerless Focus) | Nasıl kullanılır | planli | K12: eliksirler yalnız veri; uzun dinlenmeye dek süren etki ve "aynı anda tek eliksir" motorda yok (O8, KATALOG-2) |
