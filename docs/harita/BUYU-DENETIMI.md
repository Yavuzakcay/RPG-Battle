# Büyü denetimi: SRD 5.2.1, 0–3. seviye (Görev S1, B1, B2, B3, B4)

`node scripts/buyu-denetimi.mjs` ile `data/srd/spells.json` ve `data/spells.json`'dan üretilir (elle düzenleme; betiği çalıştır). Durum: **tam** (mekanik var, sapma notu yok), **kısmi** (oyunda var, SRD'den sapma `approx` notunda), **savaş dışı** (Görev B4: kartta "savaş dışı" etiketi, yapınca Game Master'a not; savaşta simüle edilmez), **yok** (kayıt yok, `unsupported` ya da yalnızca "etki elle uygulanır"). "Eksik sistem" kısmi ve yok büyülerde hangi motor parçasının eksik olduğu; B grubu ve sınıf görevlerinin kaynağı. Sınıf listesi SRD'den, büyü sınıftan bağımsız hazırlanır.

**Özet:** 183 büyü — tam 62, kısmi 68, savaş dışı 53, yok 0.

| Eksik sistem | Büyü sayısı (kısmi + yok) |
|---|---:|
| özel mekanik | 19 |
| kalıcı zemin etkisi | 10 |
| aydınlatma/karanlık | 9 |
| zihin kontrolü/davranış | 9 |
| süreli tekrar (tur başı/sonu) | 5 |
| süren etki | 4 |
| uçuş | 3 |
| yanılsama | 2 |
| çağırma | 2 |
| boyut | 1 |
| itme/çarpma | 1 |
| nesne etkileşimi | 1 |
| savaş dışı (mekân/zaman) | 1 |
| geçici engel hex'i | 1 |

## Cantrip (0) — tam 15, kısmi 4, savaş dışı 8, yok 0

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Acid Splash | `spells:acid-splash` | tam |  |  |
| Chill Touch | `spells:chill-touch` | tam |  |  |
| Dancing Lights | `spells:dancing-lights` | kısmi | aydınlatma/karanlık | Dört ışık yerine tek ışık noktası (çevresiyle 10 ft); taşıma bonus eylemle bir yaratığın altıgenine; insan biçimi yok |
| Druidcraft | `spells:druidcraft` | savaş dışı |  | Game Master'a not: Hava tahmini, çiçek açtırma, duyusal etki; hasar ya da durum yok |
| Eldritch Blast | `spells:eldritch-blast` | tam |  |  |
| Elementalism | `spells:elementalism` | savaş dışı |  | Game Master'a not: Seçilen küçük element etkisini uygula; hasar ya da durum yok |
| Fire Bolt | `spells:fire-bolt` | tam |  |  |
| Guidance | `spells:guidance` | tam |  |  |
| Light | `spells:light` | kısmi | aydınlatma/karanlık | Nesne yerine bir yaratık (büyücü ya da dost) taşır; yalnızca parlak ışık (20 ft = 4 altıgen), loş ışık ayrı değil; ışık yalnızca karanlık/gece haritalarında etkili |
| Mage Hand | `spells:mage-hand` | savaş dışı |  | Game Master'a not: Hayali el 30 ft içinde nesne taşır (10 pound); saldıramaz, büyülü eşya etkinleştiremez |
| Mending | `spells:mending` | savaş dışı |  | Game Master'a not: Dokunulan nesnedeki tek kırık ya da yırtık onarılır (en çok 1 ft); büyülü eşyanın büyüsü geri gelmez. |
| Message | `spells:message` | savaş dışı |  | Game Master'a not: Büyücü 120 ft içindeki bir yaratığa fısıltıyla ileti gönderir; yalnızca hedef duyar ve fısıltıyla yanıt verebilir. |
| Minor Illusion | `spells:minor-illusion` | savaş dışı |  | Game Master'a not: Yanılsamayı anlat; inceleyen INT (Investigation) ile anlar |
| Poison Spray | `spells:poison-spray` | tam |  |  |
| Prestidigitation | `spells:prestidigitation` | savaş dışı |  | Game Master'a not: Seçilen küçük etkiyi uygula; hasar ya da durum yok |
| Produce Flame | `spells:produce-flame` | kısmi | aydınlatma/karanlık | SRD: alev bonus eylemle yaratılır, Magic eylemiyle 60 ft fırlatılır; oyunda yaratıp fırlatmak tek bonus eylem |
| Ray of Frost | `spells:ray-of-frost` | tam |  |  |
| Resistance | `spells:resistance` | tam |  |  |
| Sacred Flame | `spells:sacred-flame` | tam |  |  |
| Shillelagh | `spells:shillelagh` | tam |  |  |
| Shocking Grasp | `spells:shocking-grasp` | tam |  |  |
| Sorcerous Burst | `spells:sorcerous-burst` | tam |  |  |
| Spare the Dying | `spells:spare-the-dying` | tam |  |  |
| Starry Wisp | `spells:starry-wisp` | kısmi | aydınlatma/karanlık | Işık ve görünmezlik engeli sonraki turun sonuna dek (büyücünün sonraki turunun sonu yerine) |
| Thaumaturgy | `spells:thaumaturgy` | savaş dışı |  | Game Master'a not: Seçilen küçük etkiyi uygula; Booming Voice Intimidation avantajı verir |
| True Strike | `spells:true-strike` | tam |  |  |
| Vicious Mockery | `spells:vicious-mockery` | tam |  |  |

## 1. seviye — tam 26, kısmi 16, savaş dışı 15, yok 0

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Alarm | `spells:alarm` | savaş dışı |  | Game Master'a not: Kurulumda: 20 ft küp alana 8 saatlik alarm; büyücünün belirlemediği yaratık girerse zihinsel ya da sesli uyarı. |
| Animal Friendship | `spells:animal-friendship` | tam |  |  |
| Bane | `spells:bane` | tam |  |  |
| Bless | `spells:bless` | tam |  |  |
| Burning Hands | `spells:burning-hands` | tam |  |  |
| Charm Person | `spells:charm-person` | kısmi | zihin kontrolü/davranış | dostluk tutumu ve sosyal avantaj yok |
| Chromatic Orb | `spells:chromatic-orb` | kısmi | özel mekanik | Sıçrama: aynı iki hasar zarında 30 ft içindeki en yakın düşmana yeni saldırı, slot seviyesi kadar (hedef seçimi yapay zekâda en yakın) |
| Color Spray | `spells:color-spray` | kısmi | özel mekanik | Kör kalma etkinin süresiyle (iki tur sınırı; büyücünün sonraki turunun sonu yerine) |
| Command | `spells:command` | kısmi | zihin kontrolü/davranış | Drop: elde tutulan bırakılmaz (silah bırakma modeli yok), yalnızca turunu kaybeder; Approach ve Flee yürüyüşten sonra turu biter |
| Comprehend Languages | `spells:comprehend-languages` | savaş dışı |  | Game Master'a not: Duyduğu ve dokunduğu yazıdaki dilleri anlar (1 saat) |
| Create or Destroy Water | `spells:create-or-destroy-water` | savaş dışı |  | Game Master'a not: Savaş dışı: 10 galon su yaratır (ya da yağmur) veya 30 ft küpteki açık suyu ya da sisi yok eder. |
| Cure Wounds | `spells:cure-wounds` | tam |  |  |
| Detect Evil and Good | `spells:detect-evil-and-good` | savaş dışı |  | Game Master'a not: 30 ft içindeki bu türlerin yerini ve türünü oyunculara söyle |
| Detect Magic | `spells:detect-magic` | savaş dışı |  | Game Master'a not: 30 ft içindeki büyülü yaratık ve nesneleri ve okullarını oyunculara söyle |
| Detect Poison and Disease | `spells:detect-poison-and-disease` | savaş dışı |  | Game Master'a not: 30 ft içindeki zehir, zehirli yaratık ve hastalıkları söyle |
| Disguise Self | `spells:disguise-self` | savaş dışı |  | Game Master'a not: Görünüş değişti; inceleyen INT (Investigation) ile anlar |
| Dissonant Whispers | `spells:dissonant-whispers` | tam |  |  |
| Divine Favor | `spells:divine-favor` | tam |  |  |
| Divine Smite | `spells:divine-smite` | tam |  |  |
| Ensnaring Strike | `spells:ensnaring-strike` | kısmi | süreli tekrar (tur başı/sonu) | Kurtulma eylemle STR (Athletics) kontrolü yerine tur başı hasardan sonra STR save; yalnızca bu tur yakın dövüş isabeti |
| Entangle | `spells:entangle` | kısmi | kalıcı zemin etkisi | Kurtulma eylemle STR (Athletics) kontrolüyle; bitki sarmaşığının bitişik altıgenlere yayılması yok |
| Expeditious Retreat | `spells:expeditious-retreat` | kısmi | özel mekanik | Her turun bonus eylemle Dash'i yerine hız iki katı (bonus eylem harcanmaz) |
| Faerie Fire | `spells:faerie-fire` | kısmi | aydınlatma/karanlık | Nesneler işaretlenmez; saldıranın hedefi görmesi ayrıca denetlenmez; ışık (10 ft) yalnızca karanlık/gece haritalarında |
| False Life | `spells:false-life` | tam |  |  |
| Feather Fall | `spells:feather-fall` | tam |  |  |
| Find Familiar | `spells:find-familiar` | tam |  |  |
| Floating Disk | `spells:floating-disk` | savaş dışı |  | Game Master'a not: Savaş dışı: 500 pound taşıyan disk büyücüyü izler |
| Fog Cloud | `spells:fog-cloud` | kısmi | kalıcı zemin etkisi | Rüzgârla dağılma yok |
| Goodberry | `spells:goodberry` | savaş dışı |  | Game Master'a not: Her meyve bonus eylemle yenir: 1 HP; savaşta Game Master uygular |
| Grease | `spells:grease` | tam |  |  |
| Guiding Bolt | `spells:guiding-bolt` | tam |  |  |
| Healing Word | `spells:healing-word` | tam |  |  |
| Hellish Rebuke | `spells:hellish-rebuke` | tam |  |  |
| Heroism | `spells:heroism` | tam |  |  |
| Hex | `spells:hex` | kısmi | özel mekanik | Seçilen yeteneğin kontrollerinde dezavantaj yok (savaşta kontrol azdır) |
| Hideous Laughter | `spells:hideous-laughter` | kısmi | zihin kontrolü/davranış | Prone kendi başına kaldırılamaz kuralı ayrıca denetlenmez (Incapacitated kalkmayı zaten engeller) |
| Hunter’s Mark | `spells:hunters-mark` | tam |  |  |
| Ice Knife | `spells:ice-knife` | tam |  |  |
| Identify | `spells:identify` | savaş dışı |  | Game Master'a not: Dokunulan büyülü eşyanın özellikleri, kullanımı, uyum gerekip gerekmediği ve üzerindeki büyüler söylenir. |
| Illusory Script | `spells:illusory-script` | savaş dışı |  | Game Master'a not: Savaş dışı: yalnızca belirlenen yaratıkların okuyabildiği gizli yazı (10 gün); diğerleri anlamsız görür. |
| Inflict Wounds | `spells:inflict-wounds` | tam |  |  |
| Jump | `spells:jump` | kısmi | özel mekanik | Turda bir 30 ft düz atlama 10 ft (2 altıgen) harcar, aradaki tek engel altıgeninin (hendek, sütun) üstünden geçer (Görev K9c); yüksek atlama yok |
| Longstrider | `spells:longstrider` | tam |  |  |
| Mage Armor | `spells:mage-armor` | kısmi | özel mekanik | Hedefin zırh giyip giymediği denetlenmez (temel AC zaten yüksekse etkisiz) |
| Magic Missile | `spells:magic-missile` | tam |  |  |
| Protection from Evil and Good | `spells:protection-from-evil-and-good` | kısmi | zihin kontrolü/davranış | Ele geçirme (possession) yok; zaten Charmed/Frightened olana yeni save avantajı yok |
| Purify Food and Drink | `spells:purify-food-and-drink` | savaş dışı |  | Game Master'a not: Savaş dışı: 5 ft küredeki yiyecek ve içecek zehirsiz olur |
| Ray of Sickness | `spells:ray-of-sickness` | tam |  |  |
| Sanctuary | `spells:sanctuary` | kısmi | özel mekanik | Başarısız save'de saldırı ya da büyü boşa gider (yeni hedef seçme yok; büyü yuvası harcanmaz); alan etkileri ve fırsat saldırısı dışı yollar etkilenmez |
| Searing Smite | `spells:searing-smite` | tam |  |  |
| Shield | `spells:shield` | tam |  |  |
| Shield of Faith | `spells:shield-of-faith` | tam |  |  |
| Silent Image | `spells:silent-image` | savaş dışı |  | Game Master'a not: Yanılsamayı anlat; Study eylemiyle INT (Investigation) anlaşılır |
| Sleep | `spells:sleep` | kısmi | zihin kontrolü/davranış | İkinci başarısız save'de Unconscious (Görev WIZARD); hasar alınca uyanır; yanındakinin eylemle uyandırması yok |
| Speak with Animals | `spells:speak-with-animals` | savaş dışı |  | Game Master'a not: Beast'lerle konuşma (10 dakika) |
| Thunderwave | `spells:thunderwave` | tam |  |  |
| Unseen Servant | `spells:unseen-servant` | savaş dışı |  | Game Master'a not: Hizmetkâr basit işler yapar; saldıramaz |

## 2. seviye — tam 13, kısmi 29, savaş dışı 15, yok 0

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Acid Arrow | `spells:acid-arrow` | tam |  |  |
| Aid | `spells:aid` | tam |  |  |
| Alter Self | `spells:alter-self` | kısmi | özel mekanik | Yalnızca Natural Weapons (hasar türü Bludgeoning kalır); Aquatic Adaptation ve Change Appearance savaş dışı (Game Master) |
| Animal Messenger | `spells:animal-messenger` | savaş dışı |  | Game Master'a not: Savaş dışı: Tiny Beast ileti taşır |
| Arcane Lock | `spells:arcane-lock` | savaş dışı |  | Game Master'a not: Kapıyı kilitle; kırma/açma DC'si +10; parola belirlenir |
| Arcanist’s Magic Aura | `spells:arcanists-magic-aura` | savaş dışı |  | Game Master'a not: Savaş dışı: algılama büyülerini yanıltır |
| Augury | `spells:augury` | savaş dışı |  | Game Master'a not: Savaş dışı: 30 dakika içindeki bir eylem için iyi, kötü, iyi ve kötü ya da hiçbiri yanıtını Game Master verir. |
| Barkskin | `spells:barkskin` | tam |  |  |
| Blindness/Deafness | `spells:blindness-deafness` | kısmi | süreli tekrar (tur başı/sonu) | Seçim komutta (choice); arayüzde ve yapay zekâda Blinded. Deafened yalnızca sözlü buyrukları (Command, Suggestion) engeller |
| Blur | `spells:blur` | kısmi | süren etki | Blindsight/Truesight ile görenler için istisna yok |
| Calm Emotions | `spells:calm-emotions` | kısmi | zihin kontrolü/davranış | Dostlara save yok (isteyerek başarısız sayılır); var olan Charmed/Frightened bastırılmaz, kalkar; kayıtsızlık "her turunu kaybeder" olarak |
| Continual Flame | `spells:continual-flame` | kısmi | aydınlatma/karanlık | Nesne yerine bir yaratık taşır; yalnızca parlak ışık (20 ft); süre savaş boyunca |
| Darkness | `spells:darkness` | kısmi | aydınlatma/karanlık | Nesneye bağlı yürüyen karanlık yok; Blindsight/Truesight yok; Darkvision bu alanı göremez ve ışık aydınlatamaz (karanlık/gece haritasında), her haritada yoğun örtü |
| Darkvision | `spells:darkvision` | tam |  |  |
| Detect Thoughts | `spells:detect-thoughts` | savaş dışı |  | Game Master'a not: Seçilen yaratığın yüzeysel düşüncelerini söyle; derin sondada WIS save |
| Dragon’s Breath | `spells:dragons-breath` | kısmi | özel mekanik | Nefesi dokunulan dost yerine büyücü verir; tür seçimi yapılırken (nefeste Fire); yukarı slot zarı uygulanmaz |
| Enhance Ability | `spells:enhance-ability` | kısmi | özel mekanik | Kontroller savaşta az (İt, Gizlen, kurtulma) |
| Enlarge/Reduce | `spells:enlarge-reduce` | kısmi | boyut | Boyut yalnızca jeton etiketi (mekanik tek altıgen); STR kontrolleri ve nesneler yok |
| Enthrall | `spells:enthrall` | savaş dışı |  | Game Master'a not: WIS save ya da büyücü dışındakileri algılamada dezavantaj (Perception); saldırı yok |
| Find Steed | `spells:find-steed` | tam |  |  |
| Find Traps | `spells:find-traps` | savaş dışı |  | Game Master'a not: Görüş hattındaki tuzakların varlığını ve genel niteliğini söyle (yeri değil) |
| Flame Blade | `spells:flame-blade` | kısmi | aydınlatma/karanlık | Kılıç el boşluğu denetlenmez; bırakıp yeniden çağırma yok; saldırı "Büyüyü sürdür" (eylem) ile |
| Flaming Sphere | `spells:flaming-sphere` | kısmi | kalıcı zemin etkisi | Engellerin üstünden atlama ve ışık yok; çarpma yalnızca taşımanın sonunda bitişik yaratığa |
| Gentle Repose | `spells:gentle-repose` | savaş dışı |  | Game Master'a not: Savaş dışı: ceset bozulmaz, dirilme süresi uzar |
| Gust of Wind | `spells:gust-of-wind` | kısmi | itme/çarpma | Çizgide tur bitirene tekrar save ve hareket maliyeti yok; tekrar yeni bir esinti olarak |
| Heat Metal | `spells:heat-metal` | kısmi | süreli tekrar (tur başı/sonu) | Her yaratık metal taşıyor sayılır; silahı bırakma seçeneği yok, kontrol dezavantajı yok |
| Hold Person | `spells:hold-person` | tam |  |  |
| Invisibility | `spells:invisibility` | kısmi | özel mekanik | Saldırı ve büyüyle biter; saldırısız hasar verince (aura, alan) bitmez |
| Knock | `spells:knock` | savaş dışı |  | Game Master'a not: Kilitli/sıkışmış kapı ya da kutu açılır; haritadaki kapı kuralı değişmez (karar bekliyor) |
| Lesser Restoration | `spells:lesser-restoration` | tam |  |  |
| Levitate | `spells:levitate` | kısmi | uçuş | Yükseklik modeli yok: havadaki yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c) ama yürüyemez; 20 ft yükselme ve duvardan itinerek hareket yok; nesneye yapılmaz |
| Locate Animals or Plants | `spells:locate-animals-or-plants` | savaş dışı |  | Game Master'a not: Savaş dışı: 5 mil içindeki en yakın türün yönü ve uzaklığı |
| Locate Object | `spells:locate-object` | savaş dışı |  | Game Master'a not: Savaş dışı: 1000 ft içindeki nesnenin yönü |
| Magic Mouth | `spells:magic-mouth` | savaş dışı |  | Game Master'a not: Savaş dışı: nesneye 25 sözcüklük bir ileti bağlanır; belirlenen tetik gerçekleşince söylenir. |
| Magic Weapon | `spells:magic-weapon` | kısmi | özel mekanik | Büyücünün kendi silahlarına uygulanır |
| Mind Spike | `spells:mind-spike` | kısmi | özel mekanik | Hedefin yerini her zaman bilme (gizlenme/görünmezlik) yok |
| Mirror Image | `spells:mirror-image` | kısmi | yanılsama | Blindsight/Truesight ayrımı yok (yalnızca Blinded saldıran etkilenmez) |
| Misty Step | `spells:misty-step` | tam |  |  |
| Moonbeam | `spells:moonbeam` | kısmi | kalıcı zemin etkisi | Taşıma 60 ft yerine büyü menzili içinde bir yaratığın altıgenine; biçim değiştirenlere ek etki yok; silindir yüksekliği yok |
| Pass without Trace | `spells:pass-without-trace` | tam |  |  |
| Phantasmal Force | `spells:phantasmal-force` | kısmi | yanılsama | Yanılsamanın biçimi ve konumu yok: her turda hasar verir; Study eylemiyle (Investigation) kurtulma yok |
| Prayer of Healing | `spells:prayer-of-healing` | savaş dışı |  | Game Master'a not: Savaş dışı (10 dakika): en çok 5 dost kısa dinlenme etkisi alır ve 2d8 + büyü değiştiricisi HP; karakter listesinde elle uygulanır. |
| Protection from Poison | `spells:protection-from-poison` | kısmi | özel mekanik | Poisoned'a karşı save avantajı yok |
| Ray of Enfeeblement | `spells:ray-of-enfeeblement` | kısmi | süreli tekrar (tur başı/sonu) | STR saldırısı yakın dövüş saldırısı sayılır (Finesse ve fırlatma ayrımı yok) |
| Rope Trick | `spells:rope-trick` | savaş dışı |  | Game Master'a not: Savaş dışı: ipin ucundaki görünmez boyut 1 saat 8 yaratığı saklar; savaş haritasında kullanılmaz. |
| Scorching Ray | `spells:scorching-ray` | tam |  |  |
| See Invisibility | `spells:see-invisibility` | kısmi | nesne etkileşimi | Ethereal Plane görüşü yok |
| Shatter | `spells:shatter` | tam |  |  |
| Shining Smite | `spells:shining-smite` | tam |  |  |
| Silence | `spells:silence` | kısmi | kalıcı zemin etkisi | Tepki büyüleri (Shield, Counterspell) sessizlikte denetlenmez; Deafened durumu verilmez (Thunder bağışıklığı var) |
| Spider Climb | `spells:spider-climb` | kısmi | özel mekanik | Yükseklik modeli yok: tırmanma hızı haritadaki yükseklik farkı maliyetini kaldırır (Görev K9c); duvar/tavanda durma yok |
| Spike Growth | `spells:spike-growth` | kısmi | kalıcı zemin etkisi | Gizlenmiş (fark edilmemiş) alan kuralı yok: herkes alanı görür |
| Spiritual Weapon | `spells:spiritual-weapon` | tam |  |  |
| Suggestion | `spells:suggestion` | kısmi | zihin kontrolü/davranış | Öneri iki seçenekle: savaşı bırak (her turunu kaybeder) ya da uzaklaş (her tur kaçar); serbest metinli öneriler Game Master'a; duyma/anlama denetimi yok |
| Warding Bond | `spells:warding-bond` | kısmi | özel mekanik | Hedefe +1 AC, +1 save, bütün hasar türlerine direnç; aldığı hasar kadar büyücüye (her komuttan sonra); büyücü 0 HP ya da 60 ft'ten uzak olunca biter. Hedefin kendisine yapılamaz |
| Web | `spells:web` | kısmi | kalıcı zemin etkisi | Tutunma yeri kuralı (çökme) ve yanma yok; hafif örtünün oyunda etkisi yok |
| Zone of Truth | `spells:zone-of-truth` | savaş dışı |  | Game Master'a not: Savaş dışı: 15 ft yarıçaplı alanda CHA save başarısız olan yaratık bile bile yalan söyleyemez (10 dakika). |

## 3. seviye — tam 8, kısmi 19, savaş dışı 15, yok 0

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Animate Dead | `spells:animate-dead` | kısmi | çağırma | Döküm süresi 1 dakika olduğu için yalnızca kurulumda; bonus eylemle komut yerine sahibinin ardından kendisi oynar |
| Beacon of Hope | `spells:beacon-of-hope` | kısmi | süren etki | Hedef sayısı 6 (SRD: menzildeki istenen sayıda yaratık); en yüksek iyileştirme yalnızca büyü iyileştirmesinde |
| Bestow Curse | `spells:bestow-curse` | kısmi | özel mekanik | Dört seçenek: yetenek (seçilen yetenekte save dezavantajı; kontrol dezavantajı yok), lanetleyene saldırılar dezavantajlı, tur başı WIS save ya da eylem yok, lanetleyenin saldırı isabetlerine +1d8 Necrotic (save'li büyülerde yok) |
| Blink | `spells:blink` | kısmi | savaş dışı (mekân/zaman) | Tur sonu d20 11+: sonraki turunun başına dek Ethereal (hedef alınamaz, alan ve saldırılardan etkilenmez); dönüşte aynı altıgen (10 ft içinde yer seçimi yok) |
| Call Lightning | `spells:call-lightning` | kısmi | süreli tekrar (tur başı/sonu) | Fırtınada ek zar yok; tekrarın noktası bir yaratığın altıgeni |
| Clairvoyance | `spells:clairvoyance` | savaş dışı |  | Game Master'a not: Savaş dışı: 1 mil içinde bilinen bir yerde görünmez göz ya da kulak (10 dakika, konsantrasyon). |
| Conjure Animals | `spells:conjure-animals` | kısmi | çağırma | Sürü büyücüyle birlikte değil, sahibinin bonus eylemiyle 30 ft taşınır; büyücünün STR save avantajı yok; sürü bir altıgen kaplar |
| Counterspell | `spells:counterspell` | tam |  |  |
| Create Food and Water | `spells:create-food-and-water` | savaş dışı |  | Game Master'a not: Savaş dışı: 45 pound yiyecek ve 30 galon su |
| Daylight | `spells:daylight` | kısmi | aydınlatma/karanlık | Nesneye bağlı yürüyen ışık yok; ek 60 ft loş ışık yok; gün ışığına duyarlı yaratık kuralları yok |
| Dispel Magic | `spells:dispel-magic` | kısmi | özel mekanik | Yaratıktaki süren büyü etkileri, büyüyle çağrılmış yaratık, silahtaki büyü güçlendirmesi (Magic Weapon, Divine Favor) ve altıgen hedefte büyü alanları; slotun üstündeki büyüde yetenek kontrolü DC 10 + seviye. Nesne büyüleri (eşya) yok |
| Fear | `spells:fear` | kısmi | zihin kontrolü/davranış | Tekrar save her tur sonunda (SRD: yalnızca büyücüyü göremezken); elindekini düşürme yok; kaçınca turu biter |
| Fireball | `spells:fireball` | tam |  |  |
| Fly | `spells:fly` | kısmi | uçuş | Yükseklik modeli yok: uçan yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c); uçuş bitince düşme hasarı uygulanmaz |
| Gaseous Form | `spells:gaseous-form` | kısmi | uçuş | Yükseklik farkı maliyetini ve zemin engelini yok sayar (uçuş 10 ft; Görev K9c); dar aralıklardan geçme yok (harita altıgen) |
| Glyph of Warding | `spells:glyph-of-warding` | savaş dışı |  | Game Master'a not: Kurulumda (1 saat): işaret tetiklenince patlar (20 ft küre, DEX save, 5d8 seçilen tür) ya da içine saklanan büyüyü yapar; Game Master elle uygular. |
| Haste | `spells:haste` | kısmi | süren etki | Ek eylem asıl eylemden sonra alınır; Utilize yok |
| Hypnotic Pattern | `spells:hypnotic-pattern` | kısmi | zihin kontrolü/davranış | Sarsarak uyandırma (eylemle) yok; hasarla ve konsantrasyonla biter |
| Lightning Bolt | `spells:lightning-bolt` | tam |  |  |
| Magic Circle | `spells:magic-circle` | savaş dışı |  | Game Master'a not: Kurulumda (1 dakika): 10 ft yarıçaplı silindir; seçilen türler (Celestial, Elemental, Fey, Fiend, Undead) içeri giremez, içerdekilere saldırıları dezavantajlı. Game Master uygular. |
| Major Image | `spells:major-image` | savaş dışı |  | Game Master'a not: Yanılsamayı anlat; Study eylemiyle INT (Investigation) anlaşılır |
| Mass Healing Word | `spells:mass-healing-word` | tam |  |  |
| Meld into Stone | `spells:meld-into-stone` | savaş dışı |  | Game Master'a not: Taşa girmiş yaratık haritadan çıkar; savaşta Game Master yerleştirir |
| Nondetection | `spells:nondetection` | savaş dışı |  | Game Master'a not: Savaş dışı: hedef 8 saat kehanet büyüleri ve büyülü gözetleme sensörleriyle algılanamaz. |
| Phantom Steed | `spells:phantom-steed` | savaş dışı |  | Game Master'a not: Savaş dışı (1 dakika): yolculuk için hayalet at (1 saat, hız 100 ft); savaşta binek kuralı yok. |
| Plant Growth | `spells:plant-growth` | kısmi | kalıcı zemin etkisi | Alandan bölge çıkarma yok; Enrichment (8 saat) savaşta yok |
| Protection from Energy | `spells:protection-from-energy` | tam |  |  |
| Remove Curse | `spells:remove-curse` | kısmi | özel mekanik | Yalnızca Bestow Curse etkisi kalkar (Hex büyücünün konsantrasyonunda kalır; lanetli eşya yok) |
| Revivify | `spells:revivify` | tam |  |  |
| Sending | `spells:sending` | savaş dışı |  | Game Master'a not: Savaş dışı: ileti ve 25 sözcüklük yanıt |
| Sleet Storm | `spells:sleet-storm` | kısmi | kalıcı zemin etkisi | Silindir küre sayılır (yükseklik yok); alevlerin sönmesi yok |
| Slow | `spells:slow` | kısmi | süren etki | 40 ft küp yerine seçilen hedefler; büyü yapmadaki gecikme (d20) yok |
| Speak with Dead | `spells:speak-with-dead` | savaş dışı |  | Game Master'a not: Savaş dışı: cesede 5 soru |
| Speak with Plants | `spells:speak-with-plants` | savaş dışı |  | Game Master'a not: Savaş dışı: 30 ft içindeki bitkiler büyücüyle konuşur ve sınırlı bilgi verir; bitkisel zorlu araziyi açabilir (Game Master). |
| Spirit Guardians | `spells:spirit-guardians` | tam |  |  |
| Stinking Cloud | `spells:stinking-cloud` | kısmi | kalıcı zemin etkisi | Eylem ve bonus eylem kaybı Incapacitated ile (tepki de gider); rüzgârla dağılma yok |
| Tiny Hut | `spells:tiny-hut` | savaş dışı |  | Game Master'a not: Savaş dışı (1 dakika, ritüel): 10 ft kubbe 8 saat; dışarıdaki yaratık ve büyüler geçemez. Dinlenme sırasında kullanılır. |
| Tongues | `spells:tongues` | savaş dışı |  | Game Master'a not: Savaş dışı: her dili anlar ve konuşur (1 saat) |
| Vampiric Touch | `spells:vampiric-touch` | tam |  |  |
| Water Breathing | `spells:water-breathing` | savaş dışı |  | Game Master'a not: Su altında nefes alma (24 saat); haritada derin su kuralları değişmez |
| Water Walk | `spells:water-walk` | savaş dışı |  | Game Master'a not: Sıvı yüzeyinde yürüme; haritada su/bataklık kuralları değişmez (karar bekliyor) |
| Wind Wall | `spells:wind-wall` | kısmi | geçici engel hex'i | Duvar düz ya da büyücünün çevresinde yay (serbest çizim yok); dev kayaları ayrımı yok; sis dağıtma yok |
