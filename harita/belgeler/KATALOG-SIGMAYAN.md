# Katalog: motora sığmayan güçler

Kaynak katalogların motorun bugünkü mekaniklerine sığmayan parçaları. Bir satır = bir güç: ne diyor, kod bugün ne yapıyor /
yapamıyor, tek satır öneri. Kod yazılmadı (mekanik donması; kural sürümü ve kayıt sürümü değişmedi). Veri kaydının
`unsupported` listesi aynı şeyleri kayıt başına sayar.

## KATALOG-F2: Kadim Yaratıklar ve Mücevher Ejderhası

Kayıtlar `data/canavarlar-kadim.json` (`node scripts/katalog-f2-kadim.mjs`); türetilen değerler `KATALOG-F2-PROSPEKTUS.md`.

### PDF'in yedi motor kancası

| Kanca | Metin ne diyor | Kod ne yapıyor / yapamıyor | Öneri |
|---|---|---|---|
| `continentDragonSealShift` | 10 Mühür Taşı arıtılınca Continent Dragon (CR 31) Ancient Continent Spirit (CR 40) biçimine evrilir | İki ayrı kayıt; savaş içi biçim değişimi yok (Faz 2 aynı kaydın sayılarını değiştirir, kaydı değiştirmez) | Serüven düğümünde sonuç olarak V1 savaşı biter, V2 müttefik olarak sonraki savaşa eklenir |
| `zettaflareSelectiveBreath` | Continent Judgment Breath dostlara ve yapılara sıfır hasar, düşmana tam yıkım | Alan `targets: 'enemies'` ile dost ateşi yok (çalışıyor); yapı/şehir ayrımı ve "atomlarına ayırma" yok | Atomlara ayırma için Disintegrate'in 0 HP kuralını canavar alanına veriyle aç |
| `phoenixRebirthEgg` | 0 HP'de 60 ft Süpernova, merkezde Ember Egg (AC 22, 150 HP), sonraki tur 450 HP ile diriliş | Faz 2 (%5 can eşiği) 450 geçici can + nefes dolumu verir; Süpernova, yumurta yaratma ve "yumurta yok edilirse diriliş yok" yok | `faz2`'ye "0 HP'de tetik + yaratık çağır + çatlayınca HP ver" alanları |
| `gemEggResonanceTracker` | Taşıyıcının Alignment kararları ve en sık nitelik/beceri zarları yumurtanın 5 hattından birini açar | Hat kaydı seçilir, izleyici yok; nefes DC'si kayıtta sabit (taşıyıcıya göre ölçeklenmez) | Hizalanma ev kuralı günlüğü + zar defterinden hat skoru (Serüven katmanı, savaş dışı) |
| `gemDragonMountBond` | Genç (2×2) ve Yetişkin (3×3) binek taşır; binicinin niteliğine göre DC ve 20 nitelik pasifi | Genç/Yetişkin kayıtları çağrılan binek değil; `data/binek.json` eğitimli listesinde değil; bağ kazanımları yok | Kayda `summons.json` benzeri binek kuralı (`mount.kontrol`) + bağ etkisini binicide süren etki olarak ver |
| `cthulhuMadnessAura` | 60/90 ft aurada DC 26 WIS: −1d6 saldırı/kurtarma, tepki yok, 1–2'de dosta saldırı | Canavar aurası yok (`auraCore` oyuncu/paket aurası); Mind-Bending Presence yalnız metin | `auraCore`'a canavar aurası girişi: tur başı save + `dice` −1d6 + `noReactions` etkisi |
| `abyssalMythicVortex` | 0 HP'de 550 HP 2. faz: su/kıyı zorlu arazi, tur başı 15 ft çekim, aura 90 ft, 4 dokunaç | Faz 2 (%5 can eşiği) yalnız 550 geçici can verir; arazi, çekim, aura büyümesi ve dokunaç sayısı yok | `faz2`'ye `multiattackEk` ve tur başı `forcedMove` çekimi |

### Diğer sığmayanlar

| Güç | Metin ne diyor | Kod ne yapıyor / yapamıyor | Öneri |
|---|---|---|---|
| Boyut 37/31 altıgen | V2 "7×7 (37 altıgen)", Yıldız-Kâbusu "6×6 (31 altıgen)" | En büyük boyut Gargantuan = 19 altıgen (multiHex deneysel, 21×11+ harita); ikisi de 19'a indirildi | Boyut tablosuna "Colossal" (37) yalnız 31×17 haritada |
| V2 "5×5+" ile "7×7" | Özet tablosu 5×5+, stat bloğu 7×7; ikisi de 37 altıgen | 37 altıgen yarıçapı 3 (genişlik 7) olduğundan 7×7 okundu; motorda yine 19 | — |
| Mücevher Yetişkin "Gargantuan 3×3" | Yetişkin evre Gargantuan, 3×3 | 3×3 = 7 altıgen = Huge; Huge yazıldı | — |
| Zaman-Dışı Fırtına Hâkimiyeti (V2) | Turda iki inisiyatif (30 ve 15); turda bir tepkisiz büyü/saldırı iptali | Bir yaratık sırada tek kez; iptal yok | Sıraya ikinci giriş (`order`'da gölge kimlik) + tur başı yenilenen iptal kaynağı |
| On Mühür Çekirdeği (V2) | Verdiği hasar her direnç ve bağışıklığı yok sayar; 300 ft dost aurası (+6 kurtarma, 50 geçici can, korku/zihin bağışıklığı) | Hasar profili hep uygulanır; dost aurası yok | Canavar saldırısına `ignoreResist` bayrağı + canavar aurası girişi |
| Büyü Yansıtan Kristal Kabuk (V2) | Hedef büyüde kurtarmayı geçerse büyü atıcısına seker | Tarrasque Reflective Carapace gibi bir yansıtma yok (yalnız metin) | Kurtarma başarısında büyüyü atıcıya yeniden çöz (tepki kancası) |
| Legendary Resistance'ın etki silmesi (V2) | Başarıya çevirir ve bir olumsuz etkiyi siler | Yalnız başarıya çevirir | `reroll: 'success'` ekine `cleanse: 1` |
| Kıta Ölçeği (V2) | Altındaki altıgenler dosta sığınak, düşmana zorlu arazi; zorla hareket bağışıklığı | Yok | Gövde altıgenlerine taraflı `difficult` alanı + `forcedMove` boy denetimi |
| Mahmurluk Perdesi (V1) | İlk 2 tur uçuş yarı, INT kurtarma dezavantajı; 3. turda tam hız | Yok | Savaş başı süren etki (`speedMult`, `saveDis: ['int']`, `until: round 3`) |
| Zırhın Psikolojik İhaneti (V1) — Kaltakkıran zırhı kancası | 60 ft içinde Kaltakkıran zırhını giyen DC 24 WIS; başarısızsa hız 0, ejderhaya dezavantaj, ejderhadan avantaj | Eşya ↔ canavar kancası yok | KATALOG-1 kanca listesindeki zırh bağı kancasına canavar kimliği koşulu |
| On Taş Rezonansı (V1) | 10 taş sunağa bırakılınca V2'ye evrilir | Yok (bkz. `continentDragonSealShift`) | Serüven düğümü |
| Mühür Çekimi (V1 efsanevi) | Taş taşıyan hedefi DC 25 STR ile 30 ft çekme | Efsanevi `save`'de çekme ve "taş taşıyan" koşulu yok; eylem kayda girmedi | Efsanevi eyleme `pull` + `needsItem` |
| Efsanevi eylem puan bedelleri | 1/2/3 puanlık eylemler | SRD 5.2.1'de bedel yok: her eylem 1 kullanım; `uses` = puan sayısı, pahalı eylemler `oncePerTurn` | `LegendaryAction.cost` |
| Save'li saldırının ikinci hasar türü | Continent Roar Breath 16d8 kuvvet **+ 8d8 gök gürültüsü**, Judgment 30d10 + 20d10, Fling, Void-Lightning | Save yolu yalnız ana zarı atar (saldırı eki `extra` yalnız isabet yolunda) | Save yolunda `riderExtras` çağrısı |
| Savrulma ve itme | Roar 30 ft, Tail 20 ft, Continent Tail 40 ft, Alfa nefesi 15/30 ft, Gamma çekme | Saldırı ekinde itme/çekme yok (yalnız Prone) | `canavar-ekleri-a2.json` itme kalıbı (`forcedMove`) kadim saldırılarına |
| Kalıcı yüzeyler | Roar: kalıcı Çatlak Kaya; Glide: 3 tur Kozmik Anka Alevi (düşmana hasar, dosta iyileşme) | Canavar eylemi yüzey oluşturamaz | Canavar saldırısına `surface` (KATALOG-F-TASARIM §6 ile aynı öneri) |
| Kozmik Yıldız Alevi (Anka) | Ateş hasarı Ateş + Işıltı; direnci yok sayar, bağışıklığı dirence indirir | Tür `fire` yazıldı; profil normal | Çift türlü hasar (`damageType: 'fire+radiant'`) ve `ignoreResist` |
| Perdeyi ve Uykuyu Yakan Hale (Anka) | 40 ft illüzyon/Invisible dağıtma, dostlardan Frightened silme, Kâbus Sisi → Anka Alevi | Yok | Canavar aurası (`auraCore`) + `seeInvisible` |
| Avcı ile Ruh Bağı (Anka) | Avcı'nın ardından oynar, Avcı'nın hasarının yarısını üstlenir, konsantrasyon avantajı | Sıra bağı yalnız çağrılanda (`after-owner`); hasar paylaşımı yok | Kurulumda `summon` bağı + ortak can (`hpPool`) yarı paylaşım |
| Yıldız İşareti (Anka saldırıları) | 1 tur: görünmez olamaz, uzaklık dezavantajı veremez, konsantrasyon bonusu yok | Yok | Saldırı ekine `mark` (Faerie Fire `outlined` benzeri) |
| Seal-Melting Talon, Star Tear (Anka efsanevi) | 0 HP kurtarmayı mühürleme; dosta iyileşme + temizleme | Efsanevi eylemde dost iyileştirme / mühür türü yok; kayda girmedi | Efsanevi `kind: 'heal'` |
| Ember Wingbeat kurtarması | PDF kurtarma vermiyor (25 ft 4d8) | Kurtarmasız alan yok; DC 27 DEX türetildi | — |
| Ezici Varlık / Ezici Kıta Varlığı | Multiattack'ın parçası (DC 25 / DC 32 WIS, 1 dk Frightened / Paralyzed) | Ayrı eylem (`repeat: 0`); alan 60 ft türetildi; tekrar kurtarması yok (PDF yok) | Multiattack planında hasarsız save eylemi |
| Yıldız-Kâbusu dokunacı en çok 12 hedef | Aynı anda en çok 12 yakalama | Yakalama sınırı yok | — |
| Cosmic Fling / Abyssal Swallow | Yalnız yakalanan hedef; fırlatma, yutma (en çok 6), tur başı 8d6 + 6d6, 80 hasarda kusma | Tek hedef save; fırlatma ve yutma kadim kayıtta yok | Yutma, SRD canavarlarının yutma verisine (`swallow92.ts`) kadim kimlikle bağlanabilir |
| Void-Lightning Strike | En çok 3 hedef; 1 tur konsantrasyon yasağı | Tek hedef | Saldırıya `targets: 3` |
| Abyssal Toxic Ink Silenced, Dream Call | Sessizlik; 30 ft yaklaştırma + silah düşürme | Silenced durumu yok; Dream Call kayda girmedi | Efsanevi `save`'e `effect: { command: 'approach' }` |
| Alpha Resonance (Yıldız-Kâbusu) | Alfa hattı ejderha varsa onun gök gürültüsü saldırıları direnci yok sayar | Yok | Hasar profilinde kaynak kimliğine göre direnç atlama |
| Siege Monster (Yıldız-Kâbusu) | Yapılara iki kat hasar | SRD canavarlarında SRD verisinden; kadim kayıtta yok | `traits` ayrıştırmasına kadim kaydı ekle |
| Büyüsüz fiziksel bağışıklık | V1, V2, Yıldız-Kâbusu "büyülü olmayan fiziksel" bağışıklık | Canavarda büyüsüz bağışıklık yok (yalnız paket yaratığında büyüsüz direnç); bağışıklık listesine girmedi | `nonmagicalResist` kalıbının bağışıklık eşi |
| Duyular ve hızlar | Truesight, Tremorsense, Blindsight, telepati; yüzme, kazma, Hover | Kadim kayıtlar SRD stat bloğu tablosunda yok; savaşta yok (yalnız Dungeondex `unsupported` satırı) | Kadim dosyasına `srd/monsters.json` biçiminde `senses`/`speed` yan tablosu ve `monsterTraits` okuması |
| Durum bağışıklıkları | Her kadim kayıtta liste | Savaş SRD tablosundan okur; kadim liste yalnız Dungeondex'te | Aynı yan tabloyu `monsterTraits.ts` okusun |
| Yaratık türü | Dragon, Celestial, Aberration | `canavar-turleri.json` SRD'den üretilir; kadim tür yalnız Dungeondex'te (savaşta Dragon/Aberration koşulları işlemez) | `creatureTypeAt` kadim `dex.type`'a baksın |
| Karanlığı Söken Mühür (V2, 1/UD) | 300 ft lanet silme; Kaltakkıran zırhını parçalar, partiye Koruyucu Ejderha Mührü | Anlatı; savaşta yok | Serüven ödülü (`reward.items`) |
| Tektonik Kayma (V2 efsanevi) | 60 ft alanı ±30 ft yükseltir/çökertir + Prone | `quake` (60 ft, Prone/konsantrasyon) ile yaklaşık; yükseklik değişmez | Yükseklik katmanına `tile_changed` |
| On Mühür Patlaması (V2 efsanevi) | 60 ft 12d10 + 12d10, Dispel, dostlara 100 HP | Tek tür 12d10 kuvvet; Dispel ve dost iyileşmesi yok; alanda dost varsa eylem seçilmez | — |
| Mücevher nefes ekleri | Omega iyileşme yasağı ve en yüksek can düşüşü, Delta −1d6 ve direnç kaybı, Sigma dostlara 30 geçici can, Alfa konsantrasyon kırma, Gamma hız 0 / uçuş iptali | Yalnız Blinded, Stunned, Prone ve en yüksek can düşüşü (`drainMax`) veriyle bağlı | Saldırı ekine süren etki (`effect`) alanı |
| Binek bağı ve 20 nitelik pasifi | Binicinin kazanımları; taşıyıcının nitelik 20 kilidi; boss sinerjileri | Yok (anlatı + Serüven) | `gemDragonMountBond` ile birlikte |
