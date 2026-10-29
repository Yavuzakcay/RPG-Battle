# Büyü denetimi: SRD 5.2.1, 0–3. seviye (Görev S1)

`node scripts/buyu-denetimi.mjs` ile `data/srd/spells.json` ve `data/spells.json`'dan üretilir (elle düzenleme; betiği çalıştır). Durum: **tam** (mekanik var, sapma notu yok), **kısmi** (oyunda var, SRD'den sapma `approx` notunda), **yok** (kayıt yok, `unsupported` ya da yalnızca "etki elle uygulanır"). "Eksik sistem" kısmi ve yok büyülerde hangi motor parçasının eksik olduğu; B grubu ve sınıf görevlerinin kaynağı. Sınıf listesi SRD'den, büyü sınıftan bağımsız hazırlanır.

**Özet:** 183 büyü — tam 49, kısmi 32, yok 102.

| Eksik sistem | Büyü sayısı (kısmi + yok) |
|---|---:|
| özel mekanik | 30 |
| savaş dışı (mekân/zaman) | 13 |
| kalıcı zemin etkisi | 13 |
| nesne etkileşimi | 11 |
| zihin kontrolü/davranış | 11 |
| aydınlatma/karanlık | 9 |
| yanılsama | 8 |
| algılama/bilgi | 8 |
| süren etki | 7 |
| süreli tekrar (tur başı/sonu) | 7 |
| boyut | 6 |
| uçuş | 3 |
| iyileştirme | 3 |
| geçici engel hex'i | 2 |
| çağırma | 2 |
| itme/çarpma | 1 |

## Cantrip (0) — tam 12, kısmi 1, yok 14

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Acid Splash | `spells:acid-splash` | tam |  |  |
| Chill Touch | `spells:chill-touch` | tam |  |  |
| Dancing Lights | `spells:dancing-lights` | yok | aydınlatma/karanlık | oyunda kayıt yok |
| Druidcraft | `spells:druidcraft` | yok | özel mekanik | oyunda kayıt yok |
| Eldritch Blast | `spells:eldritch-blast` | tam |  |  |
| Elementalism | `spells:elementalism` | yok | nesne etkileşimi | oyunda kayıt yok |
| Fire Bolt | `spells:fire-bolt` | tam |  |  |
| Guidance | `spells:guidance` | tam |  |  |
| Light | `spells:light` | yok | aydınlatma/karanlık | oyunda kayıt yok |
| Mage Hand | `spells:mage-hand` | yok | nesne etkileşimi | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Mending | `spells:mending` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Message | `spells:message` | yok | geçici engel hex'i | oyunda kayıt yok |
| Minor Illusion | `spells:minor-illusion` | yok | yanılsama | oyunda kayıt yok |
| Poison Spray | `spells:poison-spray` | tam |  |  |
| Prestidigitation | `spells:prestidigitation` | yok | yanılsama | oyunda kayıt yok |
| Produce Flame | `spells:produce-flame` | kısmi | aydınlatma/karanlık | SRD: alev bonus eylemle yaratılır, Magic eylemiyle 60 ft fırlatılır; oyunda yaratıp fırlatmak tek bonus eylem |
| Ray of Frost | `spells:ray-of-frost` | tam |  |  |
| Resistance | `spells:resistance` | tam |  |  |
| Sacred Flame | `spells:sacred-flame` | tam |  |  |
| Shillelagh | `spells:shillelagh` | yok | süren etki | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Shocking Grasp | `spells:shocking-grasp` | tam |  |  |
| Sorcerous Burst | `spells:sorcerous-burst` | yok | nesne etkileşimi | oyunda kayıt yok |
| Spare the Dying | `spells:spare-the-dying` | tam |  |  |
| Starry Wisp | `spells:starry-wisp` | yok | aydınlatma/karanlık | oyunda kayıt yok |
| Thaumaturgy | `spells:thaumaturgy` | yok | nesne etkileşimi | oyunda kayıt yok |
| True Strike | `spells:true-strike` | yok | süren etki | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Vicious Mockery | `spells:vicious-mockery` | tam |  |  |

## 1. seviye — tam 24, kısmi 8, yok 25

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Alarm | `spells:alarm` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Animal Friendship | `spells:animal-friendship` | yok | zihin kontrolü/davranış | oyunda kayıt yok |
| Bane | `spells:bane` | tam |  |  |
| Bless | `spells:bless` | tam |  |  |
| Burning Hands | `spells:burning-hands` | tam |  |  |
| Charm Person | `spells:charm-person` | kısmi | zihin kontrolü/davranış | Hasar alınca bitme yok; savaşta etkisi Charmed durumuyla sınırlı |
| Chromatic Orb | `spells:chromatic-orb` | tam |  |  |
| Color Spray | `spells:color-spray` | yok | özel mekanik | oyunda kayıt yok |
| Command | `spells:command` | kısmi | zihin kontrolü/davranış | Yalnızca Grovel (yere düşer, turunu kaybeder) ve Halt (turunu kaybeder); Approach, Drop, Flee yok |
| Comprehend Languages | `spells:comprehend-languages` | yok | özel mekanik | oyunda kayıt yok |
| Create or Destroy Water | `spells:create-or-destroy-water` | yok | boyut | oyunda kayıt yok |
| Cure Wounds | `spells:cure-wounds` | tam |  |  |
| Detect Evil and Good | `spells:detect-evil-and-good` | yok | algılama/bilgi | oyunda kayıt yok |
| Detect Magic | `spells:detect-magic` | yok | kalıcı zemin etkisi | oyunda kayıt yok |
| Detect Poison and Disease | `spells:detect-poison-and-disease` | yok | algılama/bilgi | oyunda kayıt yok |
| Disguise Self | `spells:disguise-self` | yok | yanılsama | oyunda kayıt yok |
| Dissonant Whispers | `spells:dissonant-whispers` | tam |  |  |
| Divine Favor | `spells:divine-favor` | tam |  |  |
| Divine Smite | `spells:divine-smite` | tam |  |  |
| Ensnaring Strike | `spells:ensnaring-strike` | yok | boyut | oyunda kayıt yok |
| Entangle | `spells:entangle` | kısmi | kalıcı zemin etkisi | Alan yalnızca yapıldığı anda: kalıcı zorlu arazi ve sonraki turlarda alana girenlere save yok; kaçış her tur STR kontrolüyle değil |
| Expeditious Retreat | `spells:expeditious-retreat` | yok | özel mekanik | oyunda kayıt yok |
| Faerie Fire | `spells:faerie-fire` | yok | aydınlatma/karanlık | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| False Life | `spells:false-life` | tam |  |  |
| Feather Fall | `spells:feather-fall` | tam |  |  |
| Find Familiar | `spells:find-familiar` | tam |  |  |
| Floating Disk | `spells:floating-disk` | yok | özel mekanik | oyunda kayıt yok |
| Fog Cloud | `spells:fog-cloud` | yok | kalıcı zemin etkisi | oyunda kayıt yok |
| Goodberry | `spells:goodberry` | yok | özel mekanik | oyunda kayıt yok |
| Grease | `spells:grease` | yok | kalıcı zemin etkisi | oyunda kayıt yok |
| Guiding Bolt | `spells:guiding-bolt` | tam |  |  |
| Healing Word | `spells:healing-word` | tam |  |  |
| Hellish Rebuke | `spells:hellish-rebuke` | tam |  |  |
| Heroism | `spells:heroism` | tam |  |  |
| Hex | `spells:hex` | kısmi | özel mekanik | Seçilen yeteneğin kontrollerinde dezavantaj yok (savaşta kontrol azdır) |
| Hideous Laughter | `spells:hideous-laughter` | kısmi | zihin kontrolü/davranış | Her tur sonu ve hasar alınca tekrar save (avantajlı) yok |
| Hunter’s Mark | `spells:hunters-mark` | tam |  |  |
| Ice Knife | `spells:ice-knife` | yok | özel mekanik | oyunda kayıt yok |
| Identify | `spells:identify` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Illusory Script | `spells:illusory-script` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Inflict Wounds | `spells:inflict-wounds` | tam |  |  |
| Jump | `spells:jump` | yok | özel mekanik | oyunda kayıt yok |
| Longstrider | `spells:longstrider` | tam |  |  |
| Mage Armor | `spells:mage-armor` | kısmi | özel mekanik | Hedefin zırh giyip giymediği denetlenmez (temel AC zaten yüksekse etkisiz) |
| Magic Missile | `spells:magic-missile` | tam |  |  |
| Protection from Evil and Good | `spells:protection-from-evil-and-good` | kısmi | zihin kontrolü/davranış | Charmed/Frightened/ele geçirme bağışıklığı yok |
| Purify Food and Drink | `spells:purify-food-and-drink` | yok | nesne etkileşimi | oyunda kayıt yok |
| Ray of Sickness | `spells:ray-of-sickness` | tam |  |  |
| Sanctuary | `spells:sanctuary` | yok | özel mekanik | oyunda kayıt yok |
| Searing Smite | `spells:searing-smite` | tam |  |  |
| Shield | `spells:shield` | tam |  |  |
| Shield of Faith | `spells:shield-of-faith` | tam |  |  |
| Silent Image | `spells:silent-image` | yok | yanılsama | oyunda kayıt yok |
| Sleep | `spells:sleep` | kısmi | zihin kontrolü/davranış | SRD: başarısızlıkta Incapacitated, sonraki tur sonu ikinci başarısız save Unconscious; ikinci aşama yok, her tur sonu save ile biten Incapacitated |
| Speak with Animals | `spells:speak-with-animals` | yok | özel mekanik | oyunda kayıt yok |
| Thunderwave | `spells:thunderwave` | tam |  |  |
| Unseen Servant | `spells:unseen-servant` | yok | zihin kontrolü/davranış | oyunda kayıt yok |

## 2. seviye — tam 9, kısmi 12, yok 36

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Acid Arrow | `spells:acid-arrow` | kısmi | süreli tekrar (tur başı/sonu) | Sonraki turun sonundaki 2d4 ve ıskada yarı hasar yok |
| Aid | `spells:aid` | tam |  |  |
| Alter Self | `spells:alter-self` | yok | boyut | oyunda kayıt yok |
| Animal Messenger | `spells:animal-messenger` | yok | özel mekanik | oyunda kayıt yok |
| Arcane Lock | `spells:arcane-lock` | yok | nesne etkileşimi | oyunda kayıt yok |
| Arcanist’s Magic Aura | `spells:arcanists-magic-aura` | yok | yanılsama | oyunda kayıt yok |
| Augury | `spells:augury` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Barkskin | `spells:barkskin` | tam |  |  |
| Blindness/Deafness | `spells:blindness-deafness` | kısmi | süreli tekrar (tur başı/sonu) | Yalnızca Blinded; tur sonu tekrar save yok |
| Blur | `spells:blur` | yok | süren etki | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Calm Emotions | `spells:calm-emotions` | yok | zihin kontrolü/davranış | oyunda kayıt yok |
| Continual Flame | `spells:continual-flame` | yok | aydınlatma/karanlık | oyunda kayıt yok |
| Darkness | `spells:darkness` | yok | aydınlatma/karanlık | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Darkvision | `spells:darkvision` | yok | özel mekanik | oyunda kayıt yok |
| Detect Thoughts | `spells:detect-thoughts` | yok | algılama/bilgi | oyunda kayıt yok |
| Dragon’s Breath | `spells:dragons-breath` | yok | özel mekanik | oyunda kayıt yok |
| Enhance Ability | `spells:enhance-ability` | yok | özel mekanik | oyunda kayıt yok |
| Enlarge/Reduce | `spells:enlarge-reduce` | yok | boyut | oyunda kayıt yok |
| Enthrall | `spells:enthrall` | yok | özel mekanik | oyunda kayıt yok |
| Find Steed | `spells:find-steed` | tam |  |  |
| Find Traps | `spells:find-traps` | yok | algılama/bilgi | oyunda kayıt yok |
| Flame Blade | `spells:flame-blade` | yok | aydınlatma/karanlık | oyunda kayıt yok |
| Flaming Sphere | `spells:flaming-sphere` | kısmi | süreli tekrar (tur başı/sonu) | Tek seferlik: küre olarak kalma, bonus eylemle taşıma ve bitişikte tur sonu hasarı yok |
| Gentle Repose | `spells:gentle-repose` | yok | özel mekanik | oyunda kayıt yok |
| Gust of Wind | `spells:gust-of-wind` | yok | itme/çarpma | oyunda kayıt yok |
| Heat Metal | `spells:heat-metal` | kısmi | süreli tekrar (tur başı/sonu) | Tek seferlik hasar: sonraki turlarda bonus eylemle tekrar ve silah bırakma/dezavantaj yok |
| Hold Person | `spells:hold-person` | kısmi | süreli tekrar (tur başı/sonu) | Her tur sonu tekrar save yok (konsantrasyonla biter) |
| Invisibility | `spells:invisibility` | kısmi | özel mekanik | Saldırı ve büyüyle biter; saldırısız hasar verince (aura, alan) bitmez |
| Knock | `spells:knock` | yok | nesne etkileşimi | oyunda kayıt yok |
| Lesser Restoration | `spells:lesser-restoration` | tam |  |  |
| Levitate | `spells:levitate` | kısmi | uçuş | Yalnızca istemeyen düşmana (dosta ve nesneye yapılmaz); yükseklik modeli yok, 20 ft yükselme ve duvardan itinerek hareket yok |
| Locate Animals or Plants | `spells:locate-animals-or-plants` | yok | algılama/bilgi | oyunda kayıt yok |
| Locate Object | `spells:locate-object` | yok | algılama/bilgi | oyunda kayıt yok |
| Magic Mouth | `spells:magic-mouth` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Magic Weapon | `spells:magic-weapon` | kısmi | özel mekanik | Büyücünün kendi silahlarına uygulanır; 3+ slotla +2 yok (yukarı slot verisi) |
| Mind Spike | `spells:mind-spike` | kısmi | özel mekanik | Hedefin yerini her zaman bilme (gizlenme/görünmezlik) yok |
| Mirror Image | `spells:mirror-image` | yok | yanılsama | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Misty Step | `spells:misty-step` | tam |  |  |
| Moonbeam | `spells:moonbeam` | kısmi | kalıcı zemin etkisi | Tek seferlik: kalıcı ışın, tur başında/alana girince hasar ve ışının taşınması yok |
| Pass without Trace | `spells:pass-without-trace` | yok | özel mekanik | oyunda kayıt yok |
| Phantasmal Force | `spells:phantasmal-force` | yok | yanılsama | oyunda kayıt yok |
| Prayer of Healing | `spells:prayer-of-healing` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Protection from Poison | `spells:protection-from-poison` | yok | özel mekanik | oyunda kayıt yok |
| Ray of Enfeeblement | `spells:ray-of-enfeeblement` | yok | süreli tekrar (tur başı/sonu) | oyunda kayıt yok |
| Rope Trick | `spells:rope-trick` | yok | boyut | oyunda kayıt yok |
| Scorching Ray | `spells:scorching-ray` | tam |  |  |
| See Invisibility | `spells:see-invisibility` | yok | nesne etkileşimi | oyunda kayıt yok |
| Shatter | `spells:shatter` | tam |  |  |
| Shining Smite | `spells:shining-smite` | tam |  |  |
| Silence | `spells:silence` | yok | kalıcı zemin etkisi | oyunda kayıt yok |
| Spider Climb | `spells:spider-climb` | yok | özel mekanik | oyunda kayıt yok |
| Spike Growth | `spells:spike-growth` | kısmi | kalıcı zemin etkisi | Alan ve yürüdükçe hasar yok: hedefe tek seferlik hasar |
| Spiritual Weapon | `spells:spiritual-weapon` | tam |  |  |
| Suggestion | `spells:suggestion` | yok | zihin kontrolü/davranış | oyunda kayıt yok |
| Warding Bond | `spells:warding-bond` | yok | özel mekanik | oyunda kayıt yok |
| Web | `spells:web` | kısmi | kalıcı zemin etkisi | Alan yalnızca yapıldığı anda: kalıcı ağ (zorlu arazi, ağır örtü, alana girene save, yanma) yok |
| Zone of Truth | `spells:zone-of-truth` | yok | kalıcı zemin etkisi | Savaşta etkisi yok |

## 3. seviye — tam 4, kısmi 11, yok 27

| Büyü | Kimlik | Durum | Eksik sistem | Not |
|---|---|---|---|---|
| Animate Dead | `spells:animate-dead` | kısmi | çağırma | Döküm süresi 1 dakika olduğu için yalnızca kurulumda; tek yaratık (yukarı slotla +2 yaratık yok); bonus eylemle komut yerine sahibinin ardından kendisi oynar |
| Beacon of Hope | `spells:beacon-of-hope` | yok | süren etki | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Bestow Curse | `spells:bestow-curse` | yok | özel mekanik | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Blink | `spells:blink` | yok | savaş dışı (mekân/zaman) | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Call Lightning | `spells:call-lightning` | kısmi | süreli tekrar (tur başı/sonu) | Tek seferlik: sonraki turlarda eylemle yeni şimşek ve fırtınada ek zar yok |
| Clairvoyance | `spells:clairvoyance` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Conjure Animals | `spells:conjure-animals` | yok | çağırma | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Counterspell | `spells:counterspell` | tam |  |  |
| Create Food and Water | `spells:create-food-and-water` | yok | nesne etkileşimi | oyunda kayıt yok |
| Daylight | `spells:daylight` | yok | aydınlatma/karanlık | oyunda kayıt yok |
| Dispel Magic | `spells:dispel-magic` | yok | özel mekanik | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Fear | `spells:fear` | kısmi | zihin kontrolü/davranış | Korkup kaçma (Dash ile uzaklaşma) ve görüşten çıkınca tekrar save yok; elindekini düşürme yok |
| Fireball | `spells:fireball` | tam |  |  |
| Fly | `spells:fly` | kısmi | uçuş | Yükseklik modeli yok; uçuş bitince düşme hasarı uygulanmaz |
| Gaseous Form | `spells:gaseous-form` | yok | uçuş | oyunda kayıt yok |
| Glyph of Warding | `spells:glyph-of-warding` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Haste | `spells:haste` | kısmi | süren etki | Ek eylem, DEX save avantajı ve bitince bir turluk uyuşukluk yok |
| Hypnotic Pattern | `spells:hypnotic-pattern` | kısmi | zihin kontrolü/davranış | Hasar alınca ya da sarsılınca bitme ve hız 0 yok (durumlar konsantrasyonla biter) |
| Lightning Bolt | `spells:lightning-bolt` | tam |  |  |
| Magic Circle | `spells:magic-circle` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Major Image | `spells:major-image` | yok | yanılsama | oyunda kayıt yok |
| Mass Healing Word | `spells:mass-healing-word` | kısmi | iyileştirme | SRD: altı hedefe kadar; oyunda tek hedef |
| Meld into Stone | `spells:meld-into-stone` | yok | algılama/bilgi | oyunda kayıt yok |
| Nondetection | `spells:nondetection` | yok | boyut | oyunda kayıt yok |
| Phantom Steed | `spells:phantom-steed` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Plant Growth | `spells:plant-growth` | yok | kalıcı zemin etkisi | oyunda kayıt yok |
| Protection from Energy | `spells:protection-from-energy` | yok | süren etki | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Remove Curse | `spells:remove-curse` | yok | özel mekanik | yalnızca günlüğe yazılır ("etki elle uygulanır") |
| Revivify | `spells:revivify` | kısmi | iyileştirme | "Son bir dakikada ölmüş" denetimi yok (savaş bir dakikadan kısa sayılır) |
| Sending | `spells:sending` | yok | algılama/bilgi | oyunda kayıt yok |
| Sleet Storm | `spells:sleet-storm` | yok | kalıcı zemin etkisi | oyunda kayıt yok |
| Slow | `spells:slow` | kısmi | süren etki | 40 ft küp yerine seçilen hedefler; DEX save cezası, tepki yasağı, eylem/bonus eylem kısıtı ve tur sonu save yok |
| Speak with Dead | `spells:speak-with-dead` | yok | özel mekanik | oyunda kayıt yok |
| Speak with Plants | `spells:speak-with-plants` | yok | kalıcı zemin etkisi | oyunda kayıt yok |
| Spirit Guardians | `spells:spirit-guardians` | tam |  |  |
| Stinking Cloud | `spells:stinking-cloud` | kısmi | kalıcı zemin etkisi | Tek seferlik Poisoned: kalıcı bulut, tur başı save ve eylem kaybı yok |
| Tiny Hut | `spells:tiny-hut` | yok | savaş dışı (mekân/zaman) | oyunda kayıt yok |
| Tongues | `spells:tongues` | yok | özel mekanik | oyunda kayıt yok |
| Vampiric Touch | `spells:vampiric-touch` | kısmi | iyileştirme | Hasarın yarısı kadar iyileşme ve sonraki turlarda eylemle tekrar dokunma yok |
| Water Breathing | `spells:water-breathing` | yok | nesne etkileşimi | oyunda kayıt yok |
| Water Walk | `spells:water-walk` | yok | nesne etkileşimi | oyunda kayıt yok |
| Wind Wall | `spells:wind-wall` | yok | geçici engel hex'i | oyunda kayıt yok |
