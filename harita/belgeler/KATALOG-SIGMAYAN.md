# KATALOG-1 F: sığmayan ve yaklaşık güçler

Mühür Ruhu verisinde (`data/bosslar-muhur.json`, üretici `scripts/katalog-f-bosslar.mjs`) mevcut motora sığmayan ya da yaklaşık yazılan güçler. Tasarım: `KATALOG-F-TASARIM.md`. Yarı can fazı (Faz 2) KATALOG-F0'da (kural sürümü 107) motor kuralı oldu ve bu listede yok.

## Sığmayanlar (veride yok; `gmNot` ya da anlatımda)

| Boss | Güç (PDF/tasarım) | Neden | Önerilen yol |
|---|---|---|---|
| Hepsi (5 sanat) | "Alan N tur alev/buz/asit yüzeyi olur" | Canavar eylemi yüzey oluşturamaz | Canavar `save` yeteneğine `surface` |
| Hepsi | PDF Faz 2 arena dönüşümü (buz yarısı, yağmur, sis, ışık, yerçekimi, çağırma, sütun yıkımı) | Faz bloğu harita kuralı açamaz | Faz bloğuna `harita`/`cagir` alanları |
| Hepsi | Menzilli efsanevi ışının uzaktakini seçmesi | `rays` en yakın görüneni seçer | `rays` hedef kipi `far` |
| Hepsi | Faz 2 hamle sırası değişimi ("kuyruk önce") | Yapay zekâ önceliği veride yok | Yapay zekâ önceliği alanı |
| Mothraq | Kalıcı zehir bulutu, zehir direncini aşma | Canavar yeteneği kalıcı alan ve direnç aşma yapamaz | `zone` + `ignoreResist` |
| Gongar, Kongark | Zorla itilmeye/çekilmeye bağışıklık | Canavar pasifi yok | `forcedImmune` |
| Hydraxe | Yakın dövüşte saldırana asit | Dokunana hasar yalnız Fire Aura (1d10 ateş) | `meleeRetaliate {dice, type}` |
| Lightaur | 40 ft silindir, karanlık dağıtma | Canavar alanında silindir yok | Canavar alanına `cylinder` |
| Cerbones | İyileşmeyi yarıya indirme, maks. HP/noHeal bağışıklığı | Aura alanı yok | Aurada `healMult` |
| Kongark | Yıldız Çöküşü'nde "önce çek, sonra vur" tek eylemde | Yetenek tek adımlı | Yetenekte `then` |
| Mirage | Sahte gölge çağırma | — | `summon` (Faz 1, PDF) |

## Yaklaşık yazılanlar (veride var, tasarımdan farkı)

| Yaratık | Tasarım | Veride | Fark |
|---|---|---|---|
| Kongark | Yıldız Çöküşü: 30 ft çek + 10 ft 6d6 + Prone | Sanat 10 ft 6d6 + Prone; ayrı bonus eylem "Çekim" 15 ft | Çekme ayrı eylem |
| Hydraxe | Isırıkta zırh aşındırma (AC −1) | Yok | A2 aşındırma biçimi bu görevde bağlanmadı |
| Cimbombom | Bite'ta yanma (tur başı 2d6) | Yok | A2 `dot` bu görevde bağlanmadı |
| Wolfgang | Claw'da hız yarı | Yok; efsanevi Ayaz Halesi hızı yarıya indirir | — |
| Cerbones | Krematoryum Nefesi'nde noHeal | Yok; sanat (Kara Alev Kesiği) noHeal verir | — |
| Mirage | Misty Step 3/gün | Yok | Canavar büyüsü bu görevde bağlanmadı |
| Hydraxe | Sülfür Tufanı AC −3 "3 tur" | AC −3 "1 dk" | Süre |
| Bütün yaratıklar | `monster-ortamlari.json` kaydı | Kayıt içinde `ortam` alanı | Game Master seçicisi 330 SRD canavarını sayan testlere ve ana parçaya dokunmamak için; seçiciye bağlama ayrı iş |

## KATALOG-F2: Kadim Yaratıklar ve mücevher ejderhaları

Kayıtlar `data/canavarlar-kadim.json` (`node scripts/katalog-f2-kadim.mjs`; tek kaynak `KATALOG-F2-OZELLIKLER.md`), türetilenler
`KATALOG-F2-PROSPEKTUS.md`. Bir satır = bir güç: ne diyor, kod bugün ne yapıyor / yapamıyor, tek satır öneri. Kod yazılmadı.

### PDF'in motor kancaları

| Kanca | Metin ne diyor | Kod ne yapıyor / yapamıyor | Öneri |
|---|---|---|---|
| Ten Stones Resonance (PDF kancası "seal shift") | 10 Mühür Taşı sunağa bırakılınca Captive Dragon, Dragon of Hexonia'ya evrilir | İki ayrı kayıt; savaş içi biçim değişimi yok | Serüven düğümünde sonuç: Captive savaşı biter, Hexonia sonraki savaşa dost olarak eklenir (Mühür taşları ertelendi) |
| Continent Judgment Breath seçici nefes (PDF kancası "selective breath") | Dostlara ve şehirlere sıfır hasar, düşmana tam yıkım | Alan `targets: 'enemies'` (dost ateşi yok, çalışıyor); yapı ayrımı ve atomlarına ayırma yok | Disintegrate'in 0 HP kuralını canavar alanına veriyle aç |
| Rebirth from Ashes (`phoenixRebirthEgg`) | 0 HP'de Supernova, merkezde Ember Egg (AC 22, 150 HP); yumurta bir tur dayanırsa Anka 450 HP ile kalkar, kırılırsa ölür | Faz 2 (%5 can eşiği) 450 geçici can + nefes dolumu verir; Supernova, yumurta yaratma ve "kırılırsa ölür" yok | `faz2`'ye "0 HP'de tetik + yaratık çağır + çatlayınca HP ver" alanları |
| Mücevher yumurta izleyicisi (`gemEggResonanceTracker`) | Taşıyıcının Alignment kararları ve en sık nitelik/beceri zarları yumurtanın hattını açar | **Ertelendi** (kuluçka sistemi); hat kaydı elle seçilir | Hizalanma günlüğü + zar defterinden hat skoru (Serüven katmanı) |
| Mücevher binek bağı (`gemDragonMountBond`) | Genç ve Yetişkin binek; Taşıyıcı'nın niteliğine göre Save DC; Genç bağları, Yetişkin 20 nitelik pasifleri | Bağlar ve pasifler yazılı özellik (Mount Bond, Attribute 20 Lock); eğitimli binek listesinde değil; DC kayıtta sabit (**Taşıyıcı'ya göre DC ertelendi**) | Kayda binek kuralı (`summons.json` `mount.kontrol` gibi) + bağ etkisini binicide süren etki olarak ver |
| Non-Euclidean Aura (PDF kancası "madness aura") | Titan of Nightmare: 60/90 ft DC 26 WIS, −1d6, tepki yok, 1–2'de dosta saldırı | Canavar aurası yok; yazılı özellik | `auraCore`'a canavar aurası girişi: tur başı save + `dice` −1d6 + `noReactions` |
| The Sleeper Awakens (`abyssalMythicVortex`) | Titan yarı canın altına inince bir kez: su/kıyı zorlu arazi, tur başı 15 ft çekim (DC 26 STR), aura 90 ft, 4 dokunaç; ek can yok | Faz 2 bloğu (eşik 0,5) yalnız günlük notu ve jeton rozeti; arazi, çekim, aura büyümesi ve dokunaç sayısı yok | `faz2`'ye `multiattackEk` ve tur başı `forcedMove` çekimi |

### Diğer sığmayanlar

| Güç | Metin ne diyor | Kod ne yapıyor / yapamıyor | Öneri |
|---|---|---|---|
| Size Shift (Dragon of Hexonia) | Serbest eylemle (turda en çok 2) boyutunu sınırsız büyütür/küçültür; haritada 19 altıgen üst sınır (Tiny–Medium 1, Large 3, Huge 7, Gargantuan 19); hasar ve saldırı bonusu değişmez | Boyut kayıtta sabit Gargantuan; savaş içi boyut değişimi yok (Enlarge/Reduce yalnız bir kademe) | Serbest eylem komutu `size_shift` + `bodySize` güncellemesi + sığma denetimi (`bodyFitProblem`) |
| Yalnız dost (Dragon of Hexonia) | Düşman olmaz, simülasyon hedefi değil | Game Master seçicisinde yok (katalog dizisi seçiciye bağlı değil); duman testinde kullanılmıyor | Seçiciye bağlanırken "yalnız dost" kuralı |
| Out-of-Time Storm (Hexonia) | Turda iki inisiyatif (30 ve 15); turda bir tepkisiz büyü/saldırı iptali | Bir yaratık sırada tek kez; iptal yok | Sıraya ikinci giriş (gölge kimlik) + tur başı yenilenen iptal kaynağı |
| Ten Seals Core (Hexonia) | Hasarı her direnç ve bağışıklığı yok sayar; 300 ft dost aurası (+6 kurtarma, 50 geçici can, korku/zihin bağışıklığı) | Hasar profili hep uygulanır; dost aurası yok | Canavar saldırısına `ignoreResist` + canavar aurası girişi |
| Spell-Reflecting Crystal Shell (Hexonia) | Hedef büyüde kurtarmayı geçerse büyü atıcısına seker | Yok | Kurtarma başarısında büyüyü atıcıya yeniden çöz |
| Legendary Resistance'ın etki silmesi (Hexonia) | Başarıya çevirir ve bir olumsuz etkiyi siler | Yalnız başarıya çevirir | `reroll: 'success'` ekine `cleanse: 1` |
| Continent Scale (Hexonia) | Kapladığı altıgenler dosta sığınak, düşmana zorlu arazi; zorla hareket bağışıklığı | Yok | Gövde altıgenlerine taraflı `difficult` alanı + `forcedMove` boy denetimi |
| Yön işareti (Hexonia a/b) | a sağa, b sola bakar; b ayrı varyant | Yan tabloda `yon`; görsel yokken çizime etkisi yok (jeton yönü motorda en yakın düşmana göre) | Görseller gelince jeton yön alanı |
| Groggy Veil (Captive) | İlk 2 tur uçuş yarı, INT kurtarma dezavantajı | Yok | Savaş başı süren etki (`speedMult`, `saveDis: ['int']`, 3. tura dek) |
| Armor's Betrayal (Captive) — Kaltakkıran zırhı kancası | 60 ft içinde zırhı giyen DC 24 WIS; başarısızsa hız 0, ejderhaya dezavantaj, ejderhadan avantaj | Eşya ↔ canavar kancası yok | KATALOG-1 zırh bağı kancasına canavar kimliği koşulu |
| Seal Pull (Captive efsanevi) | Taş taşıyan hedefi DC 25 STR ile 30 ft çekme | Efsanevi eylemde çekme ve "taş taşıyan" koşulu yok; kayda girmedi | Efsanevi eyleme `pull` + `needsItem` |
| Efsanevi eylem puan bedelleri | 1/2/3 puanlık eylemler | Kapandı, mekanik eklenmedi (KATALOG-LA-SRD): SRD 5.2.1'e uyuldu, her eylem 1 hak; kart metninden bedel kalktı, denge hak sayısıyla (Ocean-Nightmare ve Yetişkin mücevher 3 → 2) | — |
| Save'li saldırının ikinci hasar türü | Roar 15d8 + 8d8, Judgment 30d10 + 20d10, Cosmic Fling, Void-Lightning | Save yolu yalnız ana zarı atar | Save yolunda `riderExtras` çağrısı |
| Savrulma, itme, çekme | Roar 30 ft, Tail 20 ft, Continent Tail 40 ft, Alfa nefesi 10/15/30 ft, Gamma çekme 10/15/30 ft (Tidal Surge efsanevide itme çalışır) | Saldırı ekinde itme/çekme yok (yalnız Prone) | `canavar-ekleri-a2.json` itme kalıbı kadim saldırılarına |
| Kalıcı yüzeyler | Roar: Çatlak Kaya; Celestial Glide: 3 tur Kozmik Anka Alevi | Canavar eylemi yüzey oluşturamaz | Canavar saldırısına `surface` |
| Cosmic Star Flame (Anka) | Ateş hasarı Ateş + Işıltı; direnci yok sayar, bağışıklığı dirence indirir | Tür `fire`; profil normal | Çift türlü hasar + `ignoreResist` |
| Halo That Burns Veil and Sleep (Anka) | 40 ft illüzyon/Invisible dağıtma, dostlardan Frightened silme | Yok | Canavar aurası + `seeInvisible` |
| Hunter Soul Bond (Anka) | Avcı'nın ardından oynar, Avcı'nın hasarının yarısını üstlenir, konsantrasyon avantajı | Yok | Kurulumda `summon` bağı + ortak can yarı paylaşım |
| Star Mark (Anka saldırıları) | 1 tur: görünmez olamaz, mesafe dezavantajı veremez, konsantrasyon bonusu yok | Yok | Saldırı ekine `mark` |
| Seal-Melting Talon, Star Tear (Anka efsanevi) | Hedef 1 tur 0 HP'de ölüm kurtarması atmaz ama iyileşemez (varsayılan karar); dosta iyileşme + temizleme | Efsanevi eylemde bu türler yok; kayda girmedi | Efsanevi `kind: 'heal'`, `kind: 'seal'` |
| Ember Wing Flap kurtarması | Belge kurtarma vermiyor (25 ft 4d8) | Kurtarmasız alan yok; DC 27 DEX türetildi | — |
| Ember Egg | Merkezde durur, hareket etmez, eylemi yok; kırılırsa Anka ölür | Kayıt var (AC 22, 150 HP, hız 0); motor yumurtayı yaratmaz, Anka'ya bağlamaz | `phoenixRebirthEgg` ile birlikte |
| kozmik-anka-savas | Savaş varyantı (aynı değerler) | Ayrı kayıt; Dungeondex'te gizli; savaşta kozmik-anka ile aynı | Varyant farkı belirlenince ayrıştır |
| Ocean-Nightmare fazları | Faz 1 gemide 700 HP (0 HP'de gemi batar), Faz 2 denizde 600 HP (0 HP'de ölmez, Faz 3 başlar) | İki ayrı kayıt; fazlar ayrı savaş ve harita; motor faz/harita geçişi yapmaz | Serüven düğüm zinciri (gemi → deniz → ada) |
| Hull Crusher, Ship Sinks, Wounded Dreamer, Dreamer Stirs | Gemi gövdesine vuruş; 700 HP'de batış; 600 HP başlangıç; 0 HP'de serbest bırakma ve ada | Yazılı özellik | Gemi nesnesi + düğüm sonucu |
| Dread Tide (Ocean-Nightmare) | 30 ft aura DC 23 WIS, 1 tur −1d4 | Canavar aurası yok | Non-Euclidean Aura ile aynı giriş |
| Freedom of Movement (Ocean-Nightmare) | Büyüyle yavaşlatılamaz, tutulamaz, bağlanamaz | Yok (durum bağışıklığı yalnız Dungeondex) | Kurulumda Freedom of Movement süren etkisi |
| Alpha Resonance (Ocean-Nightmare, Titan) | Alfa hattı (mavi) ejderha varsa gök gürültüsü hasarı direnci yok sayar | Yok | Hasar profilinde kaynak kimliğine göre direnç atlama |
| Ink Cloud (Ocean-Nightmare Faz 2) | 30 ft kalıcı bulut; içinde tur başlatan DC 24 CON | Bonus eylem, tek seferlik alan kurtarması (Blinded + Poisoned 1 tur) | Canavar eylemine kalıcı alan (`zone`) |
| Abyssal Swallow (Ocean-Nightmare Faz 2, Titan) | Tutulan hedefi yutma, tur başı asit (+ psişik), içeriden hasarla kusma | Tek hedef save + hasar; yutma yok | Yutma verisi (`swallow92.ts`) kadim kimliklerine |
| Fling / Cosmic Fling | Tutulan hedefi 60/90 ft fırlatma | Tek hedef save + Prone; fırlatma yok | `forcedMove` serbest yön |
| Storm Lightning / Void-Lightning Strike | En çok 3 hedef | Tek hedef | Saldırıya `targets: 3` |
| Dokunaç hedef sınırı | Ocean-Nightmare en çok 8, Titan en çok 12 yakalama | Sınır yok | — |
| Abyssal Toxic Ink Silenced, Dream Call (Titan) | Sessizlik; 30 ft yaklaştırma + silah düşürme | Silenced durumu yok; Dream Call kayda girmedi | Efsanevi `save`'e `effect: { command: 'approach' }` |
| Siege Monster | Yapılara iki kat hasar | SRD canavarlarında SRD verisinden; kadim kayıtta yazılı | `traits` ayrıştırmasına katalog kayıtlarını ekle |
| Büyüsüz fiziksel bağışıklık/direnç | Captive, Hexonia, Titan bağışık; Ocean-Nightmare dirençli | Canavarda büyüsüz bağışıklık/direnç yok; listeye girmedi | `nonmagicalResist` kalıbı canavar kaydına |
| Duyular ve hızlar | Truesight, Tremorsense, Blindsight, telepati; kazma, Hover; mücevherde tırmanma ve süzülme | Yüzme hızı artık savaşta (`Monster.swim`, Mühür Ruhu alanı); diğerleri yazılı (Dungeondex hız satırı tırmanma/süzülmeyi gösterir) | Katalog kaydına `senses`/`burrow`/`climb` alanları ve `monsterTraits` okuması |
| Durum bağışıklıkları | Her kadim kayıtta liste | Savaş SRD tablosundan okur; kadim liste yalnız Dungeondex'te | Aynı yan tabloyu `monsterTraits.ts` okusun |
| Sea Camouflage (Alfa) | Suda gizlenme avantajı | Yazılı özellik | `stealth.json`'a yaratık başına su bonusu |
| Wingless Flight (Delta) | Kanatsız uçar, süzülür | Uçuş hızı var; süzülme (Hover) yok | `hover` işaretini katalog kaydına aç |
| Mücevher nefes ekleri | Omega iyileşme yasağı, Delta −1d4/−1d6 ve direnç kaybı, Sigma dostlara 30 geçici can, Alfa konsantrasyon kırma, Gamma hız 0 / uçuş iptali | Yalnız Blinded, Stunned, Prone ve en yüksek can düşüşü (`drainMax`) veriyle bağlı | Saldırı ekine süren etki (`effect`) alanı |
| Body Sweep / Wing Buffet, Elemental Pulse (Yetişkin) | Belge yalnız adları ve puanları verir | Değerler türetildi (prospektüs) | — |
