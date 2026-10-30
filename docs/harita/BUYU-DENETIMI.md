# Büyü denetimi: SRD 5.2.1, 0–3. seviye (Görev S1, B1, B2, B3, B4)

`node scripts/buyu-denetimi.mjs` ile `data/srd/spells.json` ve `data/spells.json`'dan üretilir (elle düzenleme; betiği çalıştır). Durum: **tam** (mekanik var, sapma notu yok), **kısmi** (oyunda var, SRD'den sapma `approx` notunda), **savaş dışı** (Görev B4: kartta "savaş dışı" etiketi, yapınca Game Master'a not; savaşta simüle edilmez), **yok** (kayıt yok, `unsupported` ya da yalnızca "etki elle uygulanır"). "Eksik sistem" kısmi ve yok büyülerde hangi motor parçasının eksik olduğu; B grubu ve sınıf görevlerinin kaynağı. Sınıf listesi SRD'den, büyü sınıftan bağımsız hazırlanır.

**Özet:** 183 büyü — tam 56, kısmi 57, savaş dışı 25, yok 45.

| Eksik sistem | Büyü sayısı (kısmi + yok) |
|---|---:|
| özel mekanik | 31 |
| savaş dışı (mekân/zaman) | 19 |
| zihin kontrolü/davranış | 10 |
| kalıcı zemin etkisi | 10 |
| aydınlatma/karanlık | 9 |
| süreli tekrar (tur başı/sonu) | 6 |
| süren etki | 5 |
| uçuş | 3 |
| nesne etkileşimi | 2 |
| yanılsama | 2 |
| çağırma | 2 |
| boyut | 1 |
| itme/çarpma | 1 |
| geçici engel hex'i | 1 |

## Cantrip (0) — tam 13, kısmi 6, savaş dışı 5, yok 3

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Acid Splash | `spells:acid-splash` | tam |  |  |
| Chill Touch | `spells:chill-touch` | tam |  |  |
| Dancing Lights | `spells:dancing-lights` | kısmi | aydınlatma/karanlık | Dört ışık yerine tek ışık noktası (çevresiyle 10 ft); taşıma bonus eylemle bir yaratığın altıgenine; insan biçimi yok |
| Druidcraft | `spells:druidcraft` | yok | özel mekanik | oyunda kayıt yok |
| Eldritch Blast | `spells:eldritch-blast` | tam |  |  |
| Elementalism | `spells:elementalism` | savaş dışı |  | Game Master'a not: Seçilen küçük element etkisini uygula; hasar ya da durum yok |
| Fire Bolt | `spells:fire-bolt` | tam |  |  |
| Guidance | `spells:guidance` | tam |  |  |
| Light | `spells:light` | kısmi | aydınlatma/karanlık | Nesne yerine bir yaratık (büyücü ya da dost) taşır; yalnızca parlak ışık (20 ft = 4 altıgen), loş ışık ayrı değil; ışık yalnızca karanlık/gece haritalarında etkili |
| Mage Hand | `spells:mage-hand` | savaş dışı |  | Game Master'a not: Hayali el 30 ft içinde nesne taşır (10 pound); saldıramaz, büyülü eşya etkinleştiremez |
| Mending | `spells:mending` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Message | `spells:message` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Minor Illusion | `spells:minor-illusion` | savaş dışı |  | Game Master'a not: Yanılsamayı anlat; inceleyen INT (Investigation) ile anlar |
| Poison Spray | `spells:poison-spray` | tam |  |  |
| Prestidigitation | `spells:prestidigitation` | savaş dışı |  | Game Master'a not: Seçilen küçük etkiyi uygula; hasar ya da durum yok |
| Produce Flame | `spells:produce-flame` | kısmi | aydınlatma/karanlık | SRD: alev bonus eylemle yaratılır, Magic eylemiyle 60 ft fırlatılır; oyunda yaratıp fırlatmak tek bonus eylem |
| Ray of Frost | `spells:ray-of-frost` | tam |  |  |
| Resistance | `spells:resistance` | tam |  |  |
| Sacred Flame | `spells:sacred-flame` | tam |  |  |
| Shillelagh | `spells:shillelagh` | tam |  |  |
| Shocking Grasp | `spells:shocking-grasp` | tam |  |  |
| Sorcerous Burst | `spells:sorcerous-burst` | kısmi | nesne etkileşimi | 8 gelince ek d8 (patlayan zar) yok; tür seçimi komutta (choice), arayüzde ve yapay zekâda Fire |
| Spare the Dying | `spells:spare-the-dying` | tam |  |  |
| Starry Wisp | `spells:starry-wisp` | kısmi | aydınlatma/karanlık | Işık ve görünmezlik engeli sonraki turun sonuna dek (büyücünün sonraki turunun sonu yerine) |
| Thaumaturgy | `spells:thaumaturgy` | savaş dışı |  | Game Master'a not: Seçilen küçük etkiyi uygula; Booming Voice Intimidation avantajı verir |
| True Strike | `spells:true-strike` | kısmi | süren etki | 5+ seviye ek Radiant zarı tek seferlik etki olarak; silahın büyülü bonusu saldırı zarına eklenmez |
| Vicious Mockery | `spells:vicious-mockery` | tam |  |  |

## 1. seviye — tam 25, kısmi 12, savaş dışı 7, yok 13

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Alarm | `spells:alarm` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Animal Friendship | `spells:animal-friendship` | kısmi | zihin kontrolü/davranış | Hasar alınca biter (SRD: yalnızca büyücü ya da dostları hasar verince) |
| Bane | `spells:bane` | tam |  |  |
| Bless | `spells:bless` | tam |  |  |
| Burning Hands | `spells:burning-hands` | tam |  |  |
| Charm Person | `spells:charm-person` | kısmi | zihin kontrolü/davranış | Hasar alınca biter (SRD: yalnızca büyücü ya da dostları hasar verince); dostluk tutumu ve sosyal avantaj yok |
| Chromatic Orb | `spells:chromatic-orb` | tam |  |  |
| Color Spray | `spells:color-spray` | yok | özel mekanik | oyunda kayıt yok |
| Command | `spells:command` | kısmi | zihin kontrolü/davranış | Drop: elde tutulan bırakılmaz (silah bırakma modeli yok), yalnızca turunu kaybeder; Approach ve Flee yürüyüşten sonra turu biter |
| Comprehend Languages | `spells:comprehend-languages` | yok | özel mekanik | oyunda kayıt yok |
| Create or Destroy Water | `spells:create-or-destroy-water` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Cure Wounds | `spells:cure-wounds` | tam |  |  |
| Detect Evil and Good | `spells:detect-evil-and-good` | savaş dışı |  | Game Master'a not: 30 ft içindeki bu türlerin yerini ve türünü oyunculara söyle |
| Detect Magic | `spells:detect-magic` | savaş dışı |  | Game Master'a not: 30 ft içindeki büyülü yaratık ve nesneleri ve okullarını oyunculara söyle |
| Detect Poison and Disease | `spells:detect-poison-and-disease` | savaş dışı |  | Game Master'a not: 30 ft içindeki zehir, zehirli yaratık ve hastalıkları söyle |
| Disguise Self | `spells:disguise-self` | savaş dışı |  | Game Master'a not: Görünüş değişti; inceleyen INT (Investigation) ile anlar |
| Dissonant Whispers | `spells:dissonant-whispers` | tam |  |  |
| Divine Favor | `spells:divine-favor` | tam |  |  |
| Divine Smite | `spells:divine-smite` | tam |  |  |
| Ensnaring Strike | `spells:ensnaring-strike` | kısmi | süreli tekrar (tur başı/sonu) | Kurtulma eylemle STR (Athletics) kontrolü yerine tur başı hasardan sonra STR save; yalnızca bu tur yakın dövüş isabeti |
| Entangle | `spells:entangle` | kısmi | kalıcı zemin etkisi | Kurtulma eylemle STR (Athletics) kontrolü yerine tur sonu STR save |
| Expeditious Retreat | `spells:expeditious-retreat` | yok | özel mekanik | oyunda kayıt yok |
| Faerie Fire | `spells:faerie-fire` | kısmi | aydınlatma/karanlık | Nesneler işaretlenmez; saldıranın hedefi görmesi ayrıca denetlenmez; ışık (10 ft) yalnızca karanlık/gece haritalarında |
| False Life | `spells:false-life` | tam |  |  |
| Feather Fall | `spells:feather-fall` | tam |  |  |
| Find Familiar | `spells:find-familiar` | tam |  |  |
| Floating Disk | `spells:floating-disk` | yok | özel mekanik | oyunda kayıt yok |
| Fog Cloud | `spells:fog-cloud` | kısmi | kalıcı zemin etkisi | Yukarı slotta yarıçap artmaz; rüzgârla dağılma yok; görüş yalnızca saldıranın ve hedefin altıgeninden |
| Goodberry | `spells:goodberry` | yok | özel mekanik | oyunda kayıt yok |
| Grease | `spells:grease` | tam |  |  |
| Guiding Bolt | `spells:guiding-bolt` | tam |  |  |
| Healing Word | `spells:healing-word` | tam |  |  |
| Hellish Rebuke | `spells:hellish-rebuke` | tam |  |  |
| Heroism | `spells:heroism` | tam |  |  |
| Hex | `spells:hex` | kısmi | özel mekanik | Seçilen yeteneğin kontrollerinde dezavantaj yok (savaşta kontrol azdır) |
| Hideous Laughter | `spells:hideous-laughter` | kısmi | zihin kontrolü/davranış | Prone kendi başına kaldırılamaz kuralı ayrıca denetlenmez (Incapacitated kalkmayı zaten engeller) |
| Hunter’s Mark | `spells:hunters-mark` | tam |  |  |
| Ice Knife | `spells:ice-knife` | yok | özel mekanik | oyunda kayıt yok |
| Identify | `spells:identify` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Illusory Script | `spells:illusory-script` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Inflict Wounds | `spells:inflict-wounds` | tam |  |  |
| Jump | `spells:jump` | yok | özel mekanik | oyunda kayıt yok |
| Longstrider | `spells:longstrider` | tam |  |  |
| Mage Armor | `spells:mage-armor` | kısmi | özel mekanik | Hedefin zırh giyip giymediği denetlenmez (temel AC zaten yüksekse etkisiz) |
| Magic Missile | `spells:magic-missile` | tam |  |  |
| Protection from Evil and Good | `spells:protection-from-evil-and-good` | kısmi | zihin kontrolü/davranış | Ele geçirme (possession) yok; zaten Charmed/Frightened olana yeni save avantajı yok |
| Purify Food and Drink | `spells:purify-food-and-drink` | savaş dışı |  | Game Master'a not: Savaş dışı: 5 ft küredeki yiyecek ve içecek zehirsiz olur |
| Ray of Sickness | `spells:ray-of-sickness` | tam |  |  |
| Sanctuary | `spells:sanctuary` | yok | özel mekanik | oyunda kayıt yok |
| Searing Smite | `spells:searing-smite` | tam |  |  |
| Shield | `spells:shield` | tam |  |  |
| Shield of Faith | `spells:shield-of-faith` | tam |  |  |
| Silent Image | `spells:silent-image` | savaş dışı |  | Game Master'a not: Yanılsamayı anlat; Study eylemiyle INT (Investigation) anlaşılır |
| Sleep | `spells:sleep` | kısmi | zihin kontrolü/davranış | SRD: başarısızlıkta Incapacitated, sonraki tur sonu ikinci başarısız save Unconscious; ikinci aşama yok, her tur sonu save ile biten Incapacitated |
| Speak with Animals | `spells:speak-with-animals` | yok | özel mekanik | oyunda kayıt yok |
| Thunderwave | `spells:thunderwave` | tam |  |  |
| Unseen Servant | `spells:unseen-servant` | savaş dışı |  | Game Master'a not: Hizmetkâr basit işler yapar; saldıramaz |

## 2. seviye — tam 10, kısmi 24, savaş dışı 7, yok 16

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Acid Arrow | `spells:acid-arrow` | kısmi | süreli tekrar (tur başı/sonu) | Yukarı slotta sonraki 2d4 artmaz |
| Aid | `spells:aid` | tam |  |  |
| Alter Self | `spells:alter-self` | yok | özel mekanik | oyunda kayıt yok |
| Animal Messenger | `spells:animal-messenger` | yok | özel mekanik | oyunda kayıt yok |
| Arcane Lock | `spells:arcane-lock` | savaş dışı |  | Game Master'a not: Kapıyı kilitle; kırma/açma DC'si +10; parola belirlenir |
| Arcanist’s Magic Aura | `spells:arcanists-magic-aura` | savaş dışı |  | Game Master'a not: Savaş dışı: algılama büyülerini yanıltır |
| Augury | `spells:augury` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Barkskin | `spells:barkskin` | tam |  |  |
| Blindness/Deafness | `spells:blindness-deafness` | kısmi | süreli tekrar (tur başı/sonu) | Yalnızca Blinded (Deafened motorda etkisiz) |
| Blur | `spells:blur` | kısmi | süren etki | Blindsight/Truesight ile görenler için istisna yok |
| Calm Emotions | `spells:calm-emotions` | kısmi | zihin kontrolü/davranış | Dostlara save yok (isteyerek başarısız sayılır); var olan Charmed/Frightened bastırılmaz, kalkar; kayıtsızlık "her turunu kaybeder" olarak |
| Continual Flame | `spells:continual-flame` | kısmi | aydınlatma/karanlık | Nesne yerine bir yaratık taşır; yalnızca parlak ışık (20 ft); süre savaş boyunca |
| Darkness | `spells:darkness` | kısmi | aydınlatma/karanlık | Nesneye bağlı yürüyen karanlık yok; Blindsight/Truesight yok; Darkvision bu alanı göremez ve ışık aydınlatamaz (karanlık/gece haritasında), her haritada yoğun örtü |
| Darkvision | `spells:darkvision` | yok | özel mekanik | oyunda kayıt yok |
| Detect Thoughts | `spells:detect-thoughts` | savaş dışı |  | Game Master'a not: Seçilen yaratığın yüzeysel düşüncelerini söyle; derin sondada WIS save |
| Dragon’s Breath | `spells:dragons-breath` | yok | özel mekanik | oyunda kayıt yok |
| Enhance Ability | `spells:enhance-ability` | yok | özel mekanik | oyunda kayıt yok |
| Enlarge/Reduce | `spells:enlarge-reduce` | kısmi | boyut | Boyut yalnızca jeton etiketi (mekanik tek altıgen); STR kontrolleri ve nesneler yok |
| Enthrall | `spells:enthrall` | yok | özel mekanik | oyunda kayıt yok |
| Find Steed | `spells:find-steed` | tam |  |  |
| Find Traps | `spells:find-traps` | savaş dışı |  | Game Master'a not: Görüş hattındaki tuzakların varlığını ve genel niteliğini söyle (yeri değil) |
| Flame Blade | `spells:flame-blade` | kısmi | aydınlatma/karanlık | Kılıç el boşluğu denetlenmez; bırakıp yeniden çağırma yok; saldırı "Büyüyü sürdür" (eylem) ile |
| Flaming Sphere | `spells:flaming-sphere` | kısmi | kalıcı zemin etkisi | Bonus eylemle taşıma yerine sahibinin ardından kendi sırasında 30 ft ve bitişiğe çarpma (eylem); engellerin üstünden atlama ve ışık yok |
| Gentle Repose | `spells:gentle-repose` | yok | özel mekanik | oyunda kayıt yok |
| Gust of Wind | `spells:gust-of-wind` | kısmi | itme/çarpma | Çizgide tur bitirene tekrar save ve hareket maliyeti yok; tekrar yeni bir esinti olarak |
| Heat Metal | `spells:heat-metal` | kısmi | süreli tekrar (tur başı/sonu) | Her yaratık metal taşıyor sayılır; silahı bırakma seçeneği yok, kontrol dezavantajı yok |
| Hold Person | `spells:hold-person` | tam |  |  |
| Invisibility | `spells:invisibility` | kısmi | özel mekanik | Saldırı ve büyüyle biter; saldırısız hasar verince (aura, alan) bitmez |
| Knock | `spells:knock` | savaş dışı |  | Game Master'a not: Kilitli/sıkışmış kapı ya da kutu açılır; haritadaki kapı kuralı değişmez (karar bekliyor) |
| Lesser Restoration | `spells:lesser-restoration` | tam |  |  |
| Levitate | `spells:levitate` | kısmi | uçuş | Yükseklik modeli yok, 20 ft yükselme ve duvardan itinerek hareket yok; nesneye yapılmaz |
| Locate Animals or Plants | `spells:locate-animals-or-plants` | savaş dışı |  | Game Master'a not: Savaş dışı: 5 mil içindeki en yakın türün yönü ve uzaklığı |
| Locate Object | `spells:locate-object` | savaş dışı |  | Game Master'a not: Savaş dışı: 1000 ft içindeki nesnenin yönü |
| Magic Mouth | `spells:magic-mouth` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Magic Weapon | `spells:magic-weapon` | kısmi | özel mekanik | Büyücünün kendi silahlarına uygulanır; 3+ slotla +2 yok (yukarı slot verisi) |
| Mind Spike | `spells:mind-spike` | kısmi | özel mekanik | Hedefin yerini her zaman bilme (gizlenme/görünmezlik) yok |
| Mirror Image | `spells:mirror-image` | kısmi | yanılsama | Blindsight/Truesight ayrımı yok (yalnızca Blinded saldıran etkilenmez) |
| Misty Step | `spells:misty-step` | tam |  |  |
| Moonbeam | `spells:moonbeam` | kısmi | kalıcı zemin etkisi | Taşıma 60 ft yerine büyü menzili içinde bir yaratığın altıgenine; biçim değiştirenlere ek etki yok; silindir yüksekliği yok |
| Pass without Trace | `spells:pass-without-trace` | yok | özel mekanik | oyunda kayıt yok |
| Phantasmal Force | `spells:phantasmal-force` | kısmi | yanılsama | Yanılsamanın biçimi ve konumu yok: her turda hasar verir; Study eylemiyle (Investigation) kurtulma yok |
| Prayer of Healing | `spells:prayer-of-healing` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Protection from Poison | `spells:protection-from-poison` | yok | özel mekanik | oyunda kayıt yok |
| Ray of Enfeeblement | `spells:ray-of-enfeeblement` | kısmi | süreli tekrar (tur başı/sonu) | STR kontrol ve STR saldırı zarı dezavantajı yok (yalnızca STR save) |
| Rope Trick | `spells:rope-trick` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Scorching Ray | `spells:scorching-ray` | tam |  |  |
| See Invisibility | `spells:see-invisibility` | kısmi | nesne etkileşimi | Ethereal Plane görüşü yok |
| Shatter | `spells:shatter` | tam |  |  |
| Shining Smite | `spells:shining-smite` | tam |  |  |
| Silence | `spells:silence` | kısmi | kalıcı zemin etkisi | Thunder bağışıklığı ve Deafened yok; tepki büyüleri (Shield, Counterspell) sessizlikte denetlenmez |
| Spider Climb | `spells:spider-climb` | yok | özel mekanik | oyunda kayıt yok |
| Spike Growth | `spells:spike-growth` | kısmi | kalıcı zemin etkisi | Gizlenmiş (fark edilmemiş) alan kuralı yok: herkes alanı görür |
| Spiritual Weapon | `spells:spiritual-weapon` | tam |  |  |
| Suggestion | `spells:suggestion` | kısmi | zihin kontrolü/davranış | Öneri iki seçenekle: savaşı bırak (her turunu kaybeder) ya da uzaklaş (her tur kaçar); serbest metinli öneriler Game Master'a; duyma/anlama denetimi yok |
| Warding Bond | `spells:warding-bond` | yok | özel mekanik | oyunda kayıt yok |
| Web | `spells:web` | kısmi | kalıcı zemin etkisi | Kurtulma eylemle STR (Athletics) yerine tur sonu STR save; tutunma yeri kuralı (çökme) ve yanma yok; hafif örtünün oyunda etkisi yok |
| Zone of Truth | `spells:zone-of-truth` | yok | savaş dışı (mekân/zaman) | Savaşta etkisi yok |

## 3. seviye — tam 8, kısmi 15, savaş dışı 6, yok 13

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Animate Dead | `spells:animate-dead` | kısmi | çağırma | Döküm süresi 1 dakika olduğu için yalnızca kurulumda; bonus eylemle komut yerine sahibinin ardından kendisi oynar |
| Beacon of Hope | `spells:beacon-of-hope` | kısmi | süren etki | Hedef sayısı 6 (SRD: menzildeki istenen sayıda yaratık); en yüksek iyileştirme yalnızca büyü iyileştirmesinde |
| Bestow Curse | `spells:bestow-curse` | yok | özel mekanik | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Blink | `spells:blink` | yok | savaş dışı (mekân/zaman) | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Call Lightning | `spells:call-lightning` | kısmi | süreli tekrar (tur başı/sonu) | Fırtınada ek zar yok; tekrarın noktası bir yaratığın altıgeni |
| Clairvoyance | `spells:clairvoyance` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Conjure Animals | `spells:conjure-animals` | kısmi | çağırma | Sürü büyücüyle birlikte değil, sahibinin ardından kendi sırasında 30 ft yürür; büyücünün STR save avantajı yok; sürü bir altıgen kaplar |
| Counterspell | `spells:counterspell` | tam |  |  |
| Create Food and Water | `spells:create-food-and-water` | savaş dışı |  | Game Master'a not: Savaş dışı: 45 pound yiyecek ve 30 galon su |
| Daylight | `spells:daylight` | kısmi | aydınlatma/karanlık | Nesneye bağlı yürüyen ışık yok; ek 60 ft loş ışık yok; gün ışığına duyarlı yaratık kuralları yok |
| Dispel Magic | `spells:dispel-magic` | yok | özel mekanik | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Fear | `spells:fear` | kısmi | zihin kontrolü/davranış | Tekrar save her tur sonunda (SRD: yalnızca büyücüyü göremezken); elindekini düşürme yok; kaçınca turu biter |
| Fireball | `spells:fireball` | tam |  |  |
| Fly | `spells:fly` | kısmi | uçuş | Yükseklik modeli yok; uçuş bitince düşme hasarı uygulanmaz |
| Gaseous Form | `spells:gaseous-form` | kısmi | uçuş | Dar aralıklardan geçme yok (harita altıgen) |
| Glyph of Warding | `spells:glyph-of-warding` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Haste | `spells:haste` | kısmi | süren etki | Ek eylem (yalnızca Attack/Dash/Disengage/Hide/Utilize) yok |
| Hypnotic Pattern | `spells:hypnotic-pattern` | kısmi | zihin kontrolü/davranış | Sarsarak uyandırma (eylemle) yok; hasarla ve konsantrasyonla biter |
| Lightning Bolt | `spells:lightning-bolt` | tam |  |  |
| Magic Circle | `spells:magic-circle` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Major Image | `spells:major-image` | savaş dışı |  | Game Master'a not: Yanılsamayı anlat; Study eylemiyle INT (Investigation) anlaşılır |
| Mass Healing Word | `spells:mass-healing-word` | tam |  |  |
| Meld into Stone | `spells:meld-into-stone` | savaş dışı |  | Game Master'a not: Taşa girmiş yaratık haritadan çıkar; savaşta Game Master yerleştirir |
| Nondetection | `spells:nondetection` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Phantom Steed | `spells:phantom-steed` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Plant Growth | `spells:plant-growth` | kısmi | kalıcı zemin etkisi | Alandan bölge çıkarma yok; Enrichment (8 saat) savaşta yok |
| Protection from Energy | `spells:protection-from-energy` | tam |  |  |
| Remove Curse | `spells:remove-curse` | yok | özel mekanik | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Revivify | `spells:revivify` | tam |  |  |
| Sending | `spells:sending` | savaş dışı |  | Game Master'a not: Savaş dışı: ileti ve 25 sözcüklük yanıt |
| Sleet Storm | `spells:sleet-storm` | kısmi | kalıcı zemin etkisi | Silindir küre sayılır (yükseklik yok); alevlerin sönmesi yok |
| Slow | `spells:slow` | kısmi | süren etki | 40 ft küp yerine seçilen hedefler; DEX save −2, eylem/bonus eylem kısıtı ve büyü gecikmesi yok |
| Speak with Dead | `spells:speak-with-dead` | yok | özel mekanik | oyunda kayıt yok |
| Speak with Plants | `spells:speak-with-plants` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Spirit Guardians | `spells:spirit-guardians` | tam |  |  |
| Stinking Cloud | `spells:stinking-cloud` | kısmi | kalıcı zemin etkisi | Eylem ve bonus eylem kaybı Incapacitated ile (tepki de gider); rüzgârla dağılma yok |
| Tiny Hut | `spells:tiny-hut` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Tongues | `spells:tongues` | yok | özel mekanik | oyunda kayıt yok |
| Vampiric Touch | `spells:vampiric-touch` | tam |  |  |
| Water Breathing | `spells:water-breathing` | savaş dışı |  | Game Master'a not: Su altında nefes alma (24 saat); haritada derin su kuralları değişmez |
| Water Walk | `spells:water-walk` | savaş dışı |  | Game Master'a not: Sıvı yüzeyinde yürüme; haritada su/bataklık kuralları değişmez (karar bekliyor) |
| Wind Wall | `spells:wind-wall` | kısmi | geçici engel hex'i | Duvar seçilen noktada büyücüye dik düz çizgi (serbest biçim yok); menzilli silah saldırısı otomatik ıska yerine yapılamaz; dev kayaları ayrımı yok; sis dağıtma yok |
