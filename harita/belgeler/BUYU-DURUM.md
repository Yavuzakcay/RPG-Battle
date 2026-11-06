# Büyü durumu (Kuyruk K58 G7)

`node scripts/buyu-denetimi.mjs` üretir; elle düzenlenmez. SRD 5.2.1'in 339 büyüsü (0–9). Ölçüt harita/belgeler/BUYU-KISMI.md ile aynı (`scripts/lib/buyu-durum.mjs`): tamamlama blokları (`a4`…`s2`) temel mekaniğin üstüne yazılır; **kısmi** = yaklaşıklık (`approx`) ya da yalnız Game Master notu (kapsam dışı, savaş dışı, sığmayan ya da Game Master notlu değilse); **yok** = kayıt yok ya da `unsupported`; **savaş dışı** = `offCombat` (kartta ve günlükte Game Master notu). "Oyuna uyar mı" kararları `data/buyu-durum-notlari.json`.

## Özet

Toplam 339 = savaşta kullanılan 227 + savaş dışı 112.

| Seviye | çalışır | kısmi | yok | savaş dışı | Toplam |
|---|---|---|---|---|---|
| 0–3 | 131 | 0 | 0 | 52 | 183 |
| 4–5 | 45 | 0 | 0 | 27 | 72 |
| 6–9 | 51 | 0 | 0 | 33 | 84 |
| **Toplam** | 227 | 0 | 0 | 112 | 339 |

Çalışır olanlardan: Game Master notlu 6, kapsam dışı notlu 29, sığmayan parça notlu 0. 6–9. seviye açıklaması (`text`) boş: 84 / 84 (kart SRD sayfa referansını gösterir; Dungeondex açıklamaları ileride bağlanacak).

## Game Master notlu (savaş etkisi tam, kalan parça Game Master'da)

| Kimlik | Sv | Not | Oyuna uyar mı? Neden |
|---|---|---|---|
| charm-person | 1 | Savaşta Charmed (büyüleyene saldıramaz, sosyal avantaj) uygulanır; dostluk tutumu ve büyü bitince hedefin büyülendiğini bilmesi savaş dışı: Game Master anlatır. | evet: Savaş etkisi (Charmed) tam; tutum ve büyü sonrası farkındalık sosyal sahne, Game Master'ın işi. |
| hideous-laughter | 1 | Savaşta Prone + Incapacitated, tur sonu ve hasarda yeniden save uygulanır; kahkahanın anlatımı Game Master'da. | evet: Mekanik tam; yalnız anlatım Game Master'da. |
| enhance-ability | 2 | Seçilen yetenekte kontrol avantajı savaşta uygulanır (İt, kurtulma, Gizlen…); savaş dışı kontroller Game Master'da. | evet: Savaşta kullanılan kontroller (İt, kurtulma, Gizlen) avantajlı; diğerleri savaş dışı. |
| see-invisibility | 2 | Görünmezi görme savaşta uygulanır; Ethereal düzlemi görmek savaş dışı (Ethereal yaratık zaten etkilenemez): Game Master. | evet: Ethereal yaratık savaşta zaten etkileşemez; görünmezi görme tam. |
| animal-shapes | 8 | İstekli dostlar hayvan biçimine (Polymorph yolu) girer; biçim seçimi ve savaş dışı süre Game Master'da. | kısmen: Biçime girme Polymorph yoluyla çalışır; çoklu biçim seçimi ve saatlik süre Game Master'a kalır. |
| wish | 9 | 8. seviye ya da altı bir büyüyü kopyalama savaşta (seçim listesi); serbest dilekler Game Master'da. | kısmen: Büyü kopyalama savaşta; serbest dilek tanım gereği Game Master kararı, kodlanamaz. |

## Kapsam dışı notlu (eksik parça savaş modelinin dışında)

| Kimlik | Sv | Kapsam dışı | Oyuna uyar mı? Neden |
|---|---|---|---|
| dancing-lights | 0 | Dört ayrı ışık yerine birleşik insansı biçim (SRD seçeneği); loş ışık ayrımı ışık modelinde yok. | evet: SRD'nin birleşik biçim seçeneği; loş ışık ayrımı yok. |
| light | 0 | Loş ışık ayrımı ışık modelinde yok (aydınlık/karanlık); 1 saatlik süre savaştan uzun. | evet: Işık modeli aydınlık/karanlık; loş ışık ayrımı savaşta küçük fark. |
| entangle | 1 | Bitkilerin büyü bitince çekilmesi görseldir; karede zemin zorlu arazi. | evet: Bitkilerin çekilmesi yalnız görsel; zorlu arazi ve Restrained tam. |
| faerie-fire | 1 | Loş ışık (10 ft) yalnızca karanlık/gece haritasında anlamlı (ışık modeli aydınlık/karanlık). | evet: Loş ışık ayrımı ışık modelinde yok; gece/karanlık haritada aydınlatır, ana etki (avantaj, görünmezlik iptali) tam. |
| fog-cloud | 1 | Kürenin yüksekliği ve köşeleri dönmesi (ızgarada küre, görüş katmansız); rüzgârla dağılma Kuyruk 18b rüzgârıyla. | evet: Küre ızgarada; rüzgârla dağılma rüzgâr kuralıyla. |
| hex | 1 | Seçilen yetenek: savaşta kontrol yalnızca STR/DEX (İt, yakalama, kurtulma); seçim yoksa hedefin güçlü olanı | evet: Savaşta yapılan kontroller STR/DEX; diğer yetenek seçimi savaşta karşılıksız. |
| jump | 1 | Zıplamanın havadaki yayı ve yükseklik katmansız haritada dikey zıplama (katmansız haritada yükseklik yok). | evet: Katmansız haritada dikey yükseklik yok; yatay uzunluk tam. |
| mage-armor | 1 | Zırh giyince bitme: savaşta zırh giyilmez. | evet: Savaşta zırh giyilmez; bitme koşulu hiç tetiklenmez. |
| protection-from-evil-and-good | 1 | Ele geçirme (possession) oyunda hiçbir canavarda yok. | evet: Ele geçirme yapan canavar oyunda yok. |
| alter-self | 2 | Change Appearance savaş dışı (Game Master). | evet: Change Appearance sosyal; savaş seçenekleri (Aquatic, Natural Weapons) tam. |
| blindness-deafness | 2 | Deafened'in duymaya bağlı yetenek kontrolleri savaşta yok; sözlü buyruklar (Command, Suggestion) duyulmaz. | evet: Deafened'in savaşta karşılığı (sözlü buyruğu duymama) uygulanır; duymaya bağlı kontroller savaşta yok. |
| continual-flame | 2 | Loş ışık ayrımı ışık modelinde yok (aydınlık/karanlık). | evet: Loş ışık ayrımı yok; aydınlatma tam. |
| darkness | 2 | Taşınmayan nesneye yapılan karanlık nesnenin altıgeninde durur (noktaya yapmakla aynı); nesnenin üstünü örtmek savaş dışı. | evet: Nesneye yapılan karanlık nesnenin altıgeninde; örtüyle kapatma savaş dışı. |
| enlarge-reduce | 2 | Boyut, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). | evet: Boyut etkileri (hasar zarı, STR avantajı) tam; altıgen sayısı çok altıgen bayrağına bağlı. |
| flaming-sphere | 2 | Taşıma bonus eylemle (yuvarlama) ve çarpma hasarı Kuyruk 19 yoluyla; ışık 20 ft (4 altıgen). | evet: Yuvarlama ve çarpma çalışır; ışık yarıçapı altıgene yuvarlanır. |
| spider-climb | 2 | Duvar ve tavanda yürüme yükseklik katmanında tırmanma maliyetini kaldırır (`climb`); tavan modeli yok, eller serbest kuralı savaş dışı. | evet: Tırmanma maliyeti kalkar; tavan modeli yok, eller serbest kuralı savaş dışı. |
| web | 2 | Tutunma yeri: savaş haritasında ağ zemine serili sayılır (SRD: yere serilen ağ çökmez); yanma K55 çözücüsünde (yanan ağ). | evet: Tutunma yeri haritada ağ zemine serili sayılır; yanma çözücüde. |
| animate-dead | 3 | Döküm süresi 1 dakika: yalnızca kurulumda; 24 saatlik kontrol yenileme savaş dışı. | evet: 1 dakikalık döküm kurulumda; 24 saatlik yenileme savaş dışı. |
| beacon-of-hope | 3 | En yüksek iyileştirme: savaşta iyileştirme yalnızca büyü, iksir ve özellik zarıyla; hepsi büyü yolundan geçmez (iksir zarı) | kısmen: İyileştirme maks. yalnız büyü yolunda; iksir ve bazı özellik zarları atılır (küçük fark). |
| call-lightning | 3 | Bulut büyücünün üstünde sayılır; nokta büyü menzilinde seçilir (silindir yüksekliği savaş modelinde yok). | evet: Silindir yüksekliği modelde yok; bulut büyücünün üstünde sayılır, hedef nokta menzilde. |
| conjure-animals | 3 | Large sürü, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). | evet: Çok altıgen bayrağı kapalıyken her yaratık tek altıgen (oyunun genel kuralı). |
| daylight | 3 | Taşınmayan nesneye yapılan ışık nesnenin altıgeninde durur; ek 60 ft loş ışık ayrımı ışık modelinde yok (aydınlık/karanlık). | kısmen: Ek 60 ft loş ışık yok: karanlık haritada aydınlattığı alan SRD'den dar. |
| dispel-magic | 3 | Sihirli eşyanın kendi büyüsü dağılmaz (SRD); nesnedeki süren büyü (Light, Continual Flame) altıgen hedefte kalkar. | evet: SRD'ye uygun: eşyanın kendi büyüsü dağılmaz. |
| fear | 3 | Elindekini düşürme: silah bırakma modeli yok (tur zaten kaçışla geçer) | kısmen: Elindekini düşürme yok; korkan yaratık kaçarak turunu geçirdiği için fark küçük (S2 el modeli ileride bağlanabilir). |
| plant-growth | 3 | Enrichment (8 saatlik döküm, bir yıl verim) savaş dışı. | evet: Enrichment 8 saatlik döküm, savaş dışı; Overgrowth tam. |
| remove-curse | 3 | Lanetli sihirli eşyada bağlılığı koparma savaş dışı. | evet: Lanetli eşyadan kopma savaş dışı; savaşta lanet kalkar. |
| sleet-storm | 3 | Silindir yüksekliği (20 ft) ve açık alevlerin sönmesi `douses` ile; konsantrasyon save'i alana giren/başlayanda. | evet: Silindir yüksekliği modelde yok; alev söndürme ve konsantrasyon save'i tam. |
| stinking-cloud | 3 | Kürenin dönmesi; rüzgârla dağılma yüzey sistemiyle. | evet: Kürenin köşeleri ızgaraya yuvarlanır; rüzgârla dağılma yüzey sisteminde. |
| conjure-fey | 6 | Ruhun Fey görünüşü yalnızca görsel. | evet: Fey görünüşü yalnız görsel. |

## Yardımcı (utility) büyülerin koddaki karşılığı

Mekanik türü `utility` olan ve özel anahtarla işlenen büyüler; anahtar `src/battle/` kaynağında aranır (betik her çalıştığında).

| Kimlik | Sv | Durum | Mekanik anahtarı | İşleyen dosyalar |
|---|---|---|---|---|
| power-word-kill | 9 | çalışır | `powerWord` | src/battle/spells69.ts |
| time-stop | 9 | çalışır | `timeStop` | src/battle/commands.ts, src/battle/common.ts, src/battle/reduce.ts, src/battle/spells69.ts, src/battle/types.ts |
| mass-heal | 9 | çalışır | `massHeal` | src/battle/spells69.ts |
| prismatic-spray | 7 | çalışır | `prismatic` | src/battle/spells69.ts |
| reverse-gravity | 7 | çalışır | `reverseGravity` | src/battle/spells69.ts |
| divine-word | 7 | çalışır | `hpTiers` | src/battle/spells69.ts |
| control-water | 4 | savaş dışı (Game Master anahtarı `spellsK19` açıkken savaşta) | `terraform` | src/battle/spells.ts, src/battle/terraform.ts |
| stone-shape | 4 | savaş dışı (Game Master anahtarı `spellsK19` açıkken savaşta) | `terraform` | src/battle/spells.ts, src/battle/terraform.ts |
| modify-memory | 5 | savaş dışı (Game Master anahtarı `spellsK19` açıkken savaşta) | `upgrade` | src/battle/spells.ts, src/battle/zones.ts |
| passwall | 5 | savaş dışı (Game Master anahtarı `spellsK19` açıkken savaşta) | `terraform` | src/battle/spells.ts, src/battle/terraform.ts |

## Liste

| Kimlik | Sv | Dosya | Durum | Son tamamlama bloğu | Not (kısmi/yok nedeni, sığmayan parça) | 6–9 açıklama boş |
|---|---|---|---|---|---|---|
| acid-splash | 0 | spells.json | çalışır |  |  |  |
| chill-touch | 0 | spells.json | çalışır |  |  |  |
| dancing-lights | 0 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| druidcraft | 0 | spells.json | savaş dışı |  |  |  |
| eldritch-blast | 0 | spells.json | çalışır |  |  |  |
| elementalism | 0 | spells.json | savaş dışı |  |  |  |
| fire-bolt | 0 | spells.json | çalışır |  |  |  |
| guidance | 0 | spells.json | çalışır |  |  |  |
| light | 0 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| mage-hand | 0 | spells.json | savaş dışı |  |  |  |
| mending | 0 | spells.json | savaş dışı |  |  |  |
| message | 0 | spells.json | savaş dışı |  |  |  |
| minor-illusion | 0 | spells.json | savaş dışı |  |  |  |
| poison-spray | 0 | spells.json | çalışır |  |  |  |
| prestidigitation | 0 | spells.json | savaş dışı |  |  |  |
| produce-flame | 0 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| ray-of-frost | 0 | spells.json | çalışır |  |  |  |
| resistance | 0 | spells.json | çalışır |  |  |  |
| sacred-flame | 0 | spells.json | çalışır |  |  |  |
| shillelagh | 0 | spells.json | çalışır |  |  |  |
| shocking-grasp | 0 | spells.json | çalışır |  |  |  |
| sorcerous-burst | 0 | spells.json | çalışır |  |  |  |
| spare-the-dying | 0 | spells.json | çalışır |  |  |  |
| starry-wisp | 0 | spells.json | çalışır | a4 (sürüm 32) |  |  |
| thaumaturgy | 0 | spells.json | savaş dışı |  |  |  |
| true-strike | 0 | spells.json | çalışır |  |  |  |
| vicious-mockery | 0 | spells.json | çalışır |  |  |  |
| alarm | 1 | spells.json | savaş dışı |  |  |  |
| animal-friendship | 1 | spells.json | çalışır |  |  |  |
| bane | 1 | spells.json | çalışır |  |  |  |
| bless | 1 | spells.json | çalışır |  |  |  |
| burning-hands | 1 | spells.json | çalışır |  |  |  |
| charm-person | 1 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| chromatic-orb | 1 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| color-spray | 1 | spells.json | çalışır | a4 (sürüm 32) |  |  |
| command | 1 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| comprehend-languages | 1 | spells.json | savaş dışı |  |  |  |
| create-or-destroy-water | 1 | spells.json | savaş dışı |  |  |  |
| cure-wounds | 1 | spells.json | çalışır |  |  |  |
| detect-evil-and-good | 1 | spells.json | savaş dışı |  |  |  |
| detect-magic | 1 | spells.json | savaş dışı |  |  |  |
| detect-poison-and-disease | 1 | spells.json | savaş dışı |  |  |  |
| disguise-self | 1 | spells.json | savaş dışı |  |  |  |
| dissonant-whispers | 1 | spells.json | çalışır |  |  |  |
| divine-favor | 1 | spells.json | çalışır |  |  |  |
| divine-smite | 1 | spells.json | çalışır |  |  |  |
| ensnaring-strike | 1 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| entangle | 1 | spells.json | çalışır | a8 (sürüm 37) |  |  |
| expeditious-retreat | 1 | spells.json | çalışır | a4 (sürüm 32) |  |  |
| faerie-fire | 1 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| false-life | 1 | spells.json | çalışır |  |  |  |
| feather-fall | 1 | spells.json | çalışır |  |  |  |
| find-familiar | 1 | spells.json | çalışır |  |  |  |
| floating-disk | 1 | spells.json | savaş dışı |  |  |  |
| fog-cloud | 1 | spells.json | çalışır | a8 (sürüm 37) |  |  |
| goodberry | 1 | spells.json | savaş dışı |  |  |  |
| grease | 1 | spells.json | çalışır |  |  |  |
| guiding-bolt | 1 | spells.json | çalışır |  |  |  |
| healing-word | 1 | spells.json | çalışır |  |  |  |
| hellish-rebuke | 1 | spells.json | çalışır |  |  |  |
| heroism | 1 | spells.json | çalışır |  |  |  |
| hex | 1 | spells.json | çalışır | a4 (sürüm 32) |  |  |
| hideous-laughter | 1 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| hunters-mark | 1 | spells.json | çalışır |  |  |  |
| ice-knife | 1 | spells.json | çalışır |  |  |  |
| identify | 1 | spells.json | savaş dışı |  |  |  |
| illusory-script | 1 | spells.json | savaş dışı |  |  |  |
| inflict-wounds | 1 | spells.json | çalışır |  |  |  |
| jump | 1 | spells.json | çalışır | a8 (sürüm 37) |  |  |
| longstrider | 1 | spells.json | çalışır |  |  |  |
| mage-armor | 1 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| magic-missile | 1 | spells.json | çalışır |  |  |  |
| protection-from-evil-and-good | 1 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| purify-food-and-drink | 1 | spells.json | savaş dışı |  |  |  |
| ray-of-sickness | 1 | spells.json | çalışır |  |  |  |
| sanctuary | 1 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| searing-smite | 1 | spells.json | çalışır |  |  |  |
| shield | 1 | spells.json | çalışır |  |  |  |
| shield-of-faith | 1 | spells.json | çalışır |  |  |  |
| silent-image | 1 | spells.json | savaş dışı |  |  |  |
| sleep | 1 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| speak-with-animals | 1 | spells.json | savaş dışı |  |  |  |
| thunderwave | 1 | spells.json | çalışır |  |  |  |
| unseen-servant | 1 | spells.json | savaş dışı |  |  |  |
| acid-arrow | 2 | spells.json | çalışır |  |  |  |
| aid | 2 | spells.json | çalışır |  |  |  |
| alter-self | 2 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| animal-messenger | 2 | spells.json | savaş dışı |  |  |  |
| arcane-lock | 2 | spells.json | savaş dışı |  |  |  |
| arcanists-magic-aura | 2 | spells.json | savaş dışı |  |  |  |
| augury | 2 | spells.json | savaş dışı |  |  |  |
| barkskin | 2 | spells.json | çalışır |  |  |  |
| blindness-deafness | 2 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| blur | 2 | spells.json | çalışır | a4 (sürüm 32) |  |  |
| calm-emotions | 2 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| continual-flame | 2 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| darkness | 2 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| darkvision | 2 | spells.json | çalışır |  |  |  |
| detect-thoughts | 2 | spells.json | savaş dışı |  |  |  |
| dragons-breath | 2 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| enhance-ability | 2 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| enlarge-reduce | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| enthrall | 2 | spells.json | savaş dışı |  |  |  |
| find-steed | 2 | spells.json | çalışır |  |  |  |
| find-traps | 2 | spells.json | savaş dışı |  |  |  |
| flame-blade | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| flaming-sphere | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| gentle-repose | 2 | spells.json | savaş dışı |  |  |  |
| gust-of-wind | 2 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| heat-metal | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| hold-person | 2 | spells.json | çalışır |  |  |  |
| invisibility | 2 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| knock | 2 | spells.json | savaş dışı |  |  |  |
| lesser-restoration | 2 | spells.json | çalışır |  |  |  |
| levitate | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| locate-animals-or-plants | 2 | spells.json | savaş dışı |  |  |  |
| locate-object | 2 | spells.json | savaş dışı |  |  |  |
| magic-mouth | 2 | spells.json | savaş dışı |  |  |  |
| magic-weapon | 2 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| mind-spike | 2 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| mirror-image | 2 | spells.json | çalışır | a4 (sürüm 32) |  |  |
| misty-step | 2 | spells.json | çalışır |  |  |  |
| moonbeam | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| pass-without-trace | 2 | spells.json | çalışır |  |  |  |
| phantasmal-force | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| prayer-of-healing | 2 | spells.json | savaş dışı |  |  |  |
| protection-from-poison | 2 | spells.json | çalışır | a4 (sürüm 32) |  |  |
| ray-of-enfeeblement | 2 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| rope-trick | 2 | spells.json | savaş dışı |  |  |  |
| scorching-ray | 2 | spells.json | çalışır |  |  |  |
| see-invisibility | 2 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| shatter | 2 | spells.json | çalışır |  |  |  |
| shining-smite | 2 | spells.json | çalışır |  |  |  |
| silence | 2 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| spider-climb | 2 | spells.json | çalışır | a8 (sürüm 37) |  |  |
| spike-growth | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| spiritual-weapon | 2 | spells.json | çalışır |  |  |  |
| suggestion | 2 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| warding-bond | 2 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| web | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| zone-of-truth | 2 | spells.json | savaş dışı |  |  |  |
| animate-dead | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| beacon-of-hope | 3 | spells.json | çalışır | a4 (sürüm 32) |  |  |
| bestow-curse | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| blink | 3 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| call-lightning | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| clairvoyance | 3 | spells.json | savaş dışı |  |  |  |
| conjure-animals | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| counterspell | 3 | spells.json | çalışır |  |  |  |
| create-food-and-water | 3 | spells.json | savaş dışı |  |  |  |
| daylight | 3 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| dispel-magic | 3 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| fear | 3 | spells.json | çalışır | a4 (sürüm 32) |  |  |
| fireball | 3 | spells.json | çalışır |  |  |  |
| fly | 3 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| gaseous-form | 3 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| glyph-of-warding | 3 | spells.json | savaş dışı |  |  |  |
| haste | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| hypnotic-pattern | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| lightning-bolt | 3 | spells.json | çalışır |  |  |  |
| magic-circle | 3 | spells.json | savaş dışı |  |  |  |
| major-image | 3 | spells.json | savaş dışı |  |  |  |
| mass-healing-word | 3 | spells.json | çalışır |  |  |  |
| meld-into-stone | 3 | spells.json | savaş dışı |  |  |  |
| nondetection | 3 | spells.json | savaş dışı |  |  |  |
| phantom-steed | 3 | spells.json | savaş dışı |  |  |  |
| plant-growth | 3 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| protection-from-energy | 3 | spells.json | çalışır |  |  |  |
| remove-curse | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| revivify | 3 | spells.json | çalışır |  |  |  |
| sending | 3 | spells.json | savaş dışı |  |  |  |
| sleet-storm | 3 | spells.json | çalışır | a8 (sürüm 37) |  |  |
| slow | 3 | spells.json | çalışır | a8 (sürüm 37) |  |  |
| speak-with-dead | 3 | spells.json | savaş dışı |  |  |  |
| speak-with-plants | 3 | spells.json | savaş dışı |  |  |  |
| spirit-guardians | 3 | spells.json | çalışır |  |  |  |
| stinking-cloud | 3 | spells.json | çalışır | a8 (sürüm 37) |  |  |
| tiny-hut | 3 | spells.json | savaş dışı |  |  |  |
| tongues | 3 | spells.json | savaş dışı |  |  |  |
| vampiric-touch | 3 | spells.json | çalışır |  |  |  |
| water-breathing | 3 | spells.json | savaş dışı |  |  |  |
| water-walk | 3 | spells.json | çalışır |  |  |  |
| wind-wall | 3 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| arcane-eye | 4 | spells-45.json | savaş dışı |  |  |  |
| aura-of-life | 4 | spells-45.json | çalışır |  |  |  |
| banishment | 4 | spells-45.json | çalışır |  |  |  |
| black-tentacles | 4 | spells-45.json | çalışır |  |  |  |
| blight | 4 | spells-45.json | çalışır |  |  |  |
| charm-monster | 4 | spells-45.json | çalışır |  |  |  |
| compulsion | 4 | spells-45.json | çalışır |  |  |  |
| confusion | 4 | spells-45.json | çalışır |  |  |  |
| conjure-minor-elementals | 4 | spells-45.json | çalışır |  |  |  |
| conjure-woodland-beings | 4 | spells-45.json | çalışır |  |  |  |
| control-water | 4 | spells-45.json | savaş dışı |  |  |  |
| death-ward | 4 | spells-45.json | çalışır |  |  |  |
| dimension-door | 4 | spells-45.json | çalışır |  |  |  |
| divination | 4 | spells-45.json | savaş dışı |  |  |  |
| dominate-beast | 4 | spells-45.json | çalışır |  |  |  |
| fabricate | 4 | spells-45.json | savaş dışı |  |  |  |
| faithful-hound | 4 | spells-45.json | çalışır |  |  |  |
| fire-shield | 4 | spells-45.json | çalışır |  |  |  |
| freedom-of-movement | 4 | spells-45.json | çalışır |  |  |  |
| giant-insect | 4 | spells-45.json | çalışır |  |  |  |
| greater-invisibility | 4 | spells-45.json | çalışır |  |  |  |
| guardian-of-faith | 4 | spells-45.json | çalışır |  |  |  |
| hallucinatory-terrain | 4 | spells-45.json | savaş dışı |  |  |  |
| ice-storm | 4 | spells-45.json | çalışır |  |  |  |
| locate-creature | 4 | spells-45.json | savaş dışı |  |  |  |
| phantasmal-killer | 4 | spells-45.json | çalışır |  |  |  |
| polymorph | 4 | spells-45.json | çalışır |  |  |  |
| private-sanctum | 4 | spells-45.json | savaş dışı |  |  |  |
| resilient-sphere | 4 | spells-45.json | çalışır |  |  |  |
| secret-chest | 4 | spells-45.json | savaş dışı |  |  |  |
| stone-shape | 4 | spells-45.json | savaş dışı |  |  |  |
| stoneskin | 4 | spells-45.json | çalışır |  |  |  |
| vitriolic-sphere | 4 | spells-45.json | çalışır |  |  |  |
| wall-of-fire | 4 | spells-45.json | çalışır |  |  |  |
| animate-objects | 5 | spells-45.json | çalışır |  |  |  |
| antilife-shell | 5 | spells-45.json | çalışır |  |  |  |
| arcane-hand | 5 | spells-45.json | çalışır |  |  |  |
| awaken | 5 | spells-45.json | savaş dışı |  |  |  |
| cloudkill | 5 | spells-45.json | çalışır |  |  |  |
| commune | 5 | spells-45.json | savaş dışı |  |  |  |
| commune-with-nature | 5 | spells-45.json | savaş dışı |  |  |  |
| cone-of-cold | 5 | spells.json | çalışır |  |  |  |
| conjure-elemental | 5 | spells-45.json | çalışır |  |  |  |
| contact-other-plane | 5 | spells-45.json | savaş dışı |  |  |  |
| contagion | 5 | spells-45.json | çalışır |  |  |  |
| creation | 5 | spells-45.json | savaş dışı |  |  |  |
| dispel-evil-and-good | 5 | spells-45.json | çalışır |  |  |  |
| dominate-person | 5 | spells-45.json | çalışır |  |  |  |
| dream | 5 | spells-45.json | savaş dışı |  |  |  |
| flame-strike | 5 | spells-45.json | çalışır |  |  |  |
| geas | 5 | spells-45.json | savaş dışı |  |  |  |
| greater-restoration | 5 | spells-45.json | çalışır |  |  |  |
| hallow | 5 | spells-45.json | savaş dışı |  |  |  |
| hold-monster | 5 | spells-45.json | çalışır |  |  |  |
| insect-plague | 5 | spells-45.json | çalışır |  |  |  |
| legend-lore | 5 | spells-45.json | savaş dışı |  |  |  |
| mass-cure-wounds | 5 | spells-45.json | çalışır |  |  |  |
| mislead | 5 | spells-45.json | çalışır |  |  |  |
| modify-memory | 5 | spells-45.json | savaş dışı |  |  |  |
| passwall | 5 | spells-45.json | savaş dışı |  |  |  |
| planar-binding | 5 | spells-45.json | savaş dışı |  |  |  |
| raise-dead | 5 | spells-45.json | savaş dışı |  |  |  |
| reincarnate | 5 | spells-45.json | savaş dışı |  |  |  |
| scrying | 5 | spells-45.json | savaş dışı |  |  |  |
| seeming | 5 | spells-45.json | savaş dışı |  |  |  |
| summon-dragon | 5 | spells.json | çalışır |  |  |  |
| telekinesis | 5 | spells-45.json | çalışır |  |  |  |
| telepathic-bond | 5 | spells-45.json | savaş dışı |  |  |  |
| teleportation-circle | 5 | spells-45.json | savaş dışı |  |  |  |
| tree-stride | 5 | spells-45.json | çalışır |  |  |  |
| wall-of-force | 5 | spells-45.json | çalışır |  |  |  |
| wall-of-stone | 5 | spells-45.json | çalışır |  |  |  |
| blade-barrier | 6 | spells-69.json | çalışır |  |  | evet |
| chain-lightning | 6 | spells-69.json | çalışır |  |  | evet |
| circle-of-death | 6 | spells-69.json | çalışır |  |  | evet |
| conjure-fey | 6 | spells-69.json | çalışır | a6 (sürüm 35) |  | evet |
| contingency | 6 | spells-69.json | savaş dışı |  |  | evet |
| create-undead | 6 | spells-69.json | savaş dışı |  |  | evet |
| disintegrate | 6 | spells-69.json | çalışır |  |  | evet |
| eyebite | 6 | spells-69.json | çalışır |  |  | evet |
| find-the-path | 6 | spells-69.json | savaş dışı |  |  | evet |
| flesh-to-stone | 6 | spells-69.json | çalışır |  |  | evet |
| forbiddance | 6 | spells-69.json | savaş dışı |  |  | evet |
| freezing-sphere | 6 | spells-69.json | çalışır |  |  | evet |
| globe-of-invulnerability | 6 | spells-69.json | çalışır |  |  | evet |
| guards-and-wards | 6 | spells-69.json | savaş dışı |  |  | evet |
| harm | 6 | spells-69.json | çalışır |  |  | evet |
| heal | 6 | spells-69.json | çalışır |  |  | evet |
| heroes-feast | 6 | spells-69.json | savaş dışı |  |  | evet |
| instant-summons | 6 | spells-69.json | savaş dışı |  |  | evet |
| irresistible-dance | 6 | spells-69.json | çalışır |  |  | evet |
| magic-jar | 6 | spells-69.json | savaş dışı |  |  | evet |
| mass-suggestion | 6 | spells-69.json | çalışır | s1 (sürüm 40) |  | evet |
| move-earth | 6 | spells-69.json | savaş dışı |  |  | evet |
| planar-ally | 6 | spells-69.json | savaş dışı |  |  | evet |
| programmed-illusion | 6 | spells-69.json | savaş dışı |  |  | evet |
| sunbeam | 6 | spells-69.json | çalışır |  |  | evet |
| transport-via-plants | 6 | spells-69.json | savaş dışı |  |  | evet |
| true-seeing | 6 | spells-69.json | çalışır |  |  | evet |
| wall-of-ice | 6 | spells-69.json | çalışır |  |  | evet |
| wall-of-thorns | 6 | spells-69.json | çalışır |  |  | evet |
| wind-walk | 6 | spells-69.json | savaş dışı |  |  | evet |
| word-of-recall | 6 | spells-69.json | savaş dışı |  |  | evet |
| arcane-sword | 7 | spells-69.json | çalışır |  |  | evet |
| conjure-celestial | 7 | spells-69.json | çalışır |  |  | evet |
| delayed-blast-fireball | 7 | spells-69.json | çalışır |  |  | evet |
| divine-word | 7 | spells-69.json | çalışır |  |  | evet |
| etherealness | 7 | spells-69.json | çalışır |  |  | evet |
| finger-of-death | 7 | spells-69.json | çalışır |  |  | evet |
| fire-storm | 7 | spells-69.json | çalışır |  |  | evet |
| forcecage | 7 | spells-69.json | çalışır |  |  | evet |
| magnificent-mansion | 7 | spells-69.json | savaş dışı |  |  | evet |
| mirage-arcane | 7 | spells-69.json | savaş dışı |  |  | evet |
| plane-shift | 7 | spells-69.json | çalışır | s1 (sürüm 40) |  | evet |
| prismatic-spray | 7 | spells-69.json | çalışır |  |  | evet |
| project-image | 7 | spells-69.json | savaş dışı |  |  | evet |
| regenerate | 7 | spells-69.json | savaş dışı |  |  | evet |
| resurrection | 7 | spells-69.json | savaş dışı |  |  | evet |
| reverse-gravity | 7 | spells-69.json | çalışır |  |  | evet |
| sequester | 7 | spells-69.json | savaş dışı |  |  | evet |
| simulacrum | 7 | spells-69.json | savaş dışı |  |  | evet |
| symbol | 7 | spells-69.json | savaş dışı |  |  | evet |
| teleport | 7 | spells-69.json | savaş dışı |  |  | evet |
| animal-shapes | 8 | spells-69.json | çalışır | a7 (sürüm 36) |  | evet |
| antimagic-field | 8 | spells-69.json | çalışır |  |  | evet |
| antipathy-sympathy | 8 | spells-69.json | savaş dışı |  |  | evet |
| befuddlement | 8 | spells-69.json | çalışır |  |  | evet |
| clone | 8 | spells-69.json | savaş dışı |  |  | evet |
| control-weather | 8 | spells-69.json | savaş dışı |  |  | evet |
| demiplane | 8 | spells-69.json | savaş dışı |  |  | evet |
| dominate-monster | 8 | spells-69.json | çalışır |  |  | evet |
| earthquake | 8 | spells-69.json | çalışır |  |  | evet |
| glibness | 8 | spells-69.json | çalışır |  |  | evet |
| holy-aura | 8 | spells-69.json | çalışır | a4 (sürüm 32) |  | evet |
| incendiary-cloud | 8 | spells-69.json | çalışır |  |  | evet |
| maze | 8 | spells-69.json | çalışır |  |  | evet |
| mind-blank | 8 | spells-69.json | çalışır |  |  | evet |
| power-word-stun | 8 | spells-69.json | çalışır |  |  | evet |
| sunburst | 8 | spells-69.json | çalışır |  |  | evet |
| tsunami | 8 | spells-69.json | savaş dışı |  |  | evet |
| astral-projection | 9 | spells-69.json | savaş dışı |  |  | evet |
| foresight | 9 | spells-69.json | savaş dışı |  |  | evet |
| gate | 9 | spells-69.json | savaş dışı |  |  | evet |
| imprisonment | 9 | spells-69.json | savaş dışı |  |  | evet |
| mass-heal | 9 | spells-69.json | çalışır |  |  | evet |
| meteor-swarm | 9 | spells-69.json | çalışır | s1 (sürüm 40) |  | evet |
| power-word-heal | 9 | spells-69.json | çalışır |  |  | evet |
| power-word-kill | 9 | spells-69.json | çalışır |  |  | evet |
| prismatic-wall | 9 | spells-69.json | çalışır |  |  | evet |
| shapechange | 9 | spells-69.json | çalışır |  |  | evet |
| storm-of-vengeance | 9 | spells-69.json | çalışır |  |  | evet |
| time-stop | 9 | spells-69.json | çalışır |  |  | evet |
| true-polymorph | 9 | spells-69.json | çalışır |  |  | evet |
| true-resurrection | 9 | spells-69.json | savaş dışı |  |  | evet |
| weird | 9 | spells-69.json | çalışır |  |  | evet |
| wish | 9 | spells-69.json | çalışır | a7 (sürüm 36) |  | evet |
