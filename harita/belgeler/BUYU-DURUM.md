# Büyü durumu (Kuyruk K58 G7)

`node scripts/buyu-denetimi.mjs` üretir; elle düzenlenmez. SRD 5.2.1'in 339 büyüsü (0–9). Ölçüt harita/belgeler/BUYU-KISMI.md ile aynı (`scripts/lib/buyu-durum.mjs`): tamamlama blokları (`a4`…`s2`) temel mekaniğin üstüne yazılır; **kısmi** = yaklaşıklık (`approx`) ya da yalnız Game Master notu (kapsam dışı, savaş dışı, sığmayan ya da Game Master notlu değilse); **yok** = kayıt yok ya da `unsupported`; **savaş dışı** = `offCombat` (kartta ve günlükte Game Master notu). "Oyuna uyar mı" kararları `data/buyu-durum-notlari.json`.

## Özet

Toplam 339 = savaşta kullanılan 225 + savaş dışı 114.

| Seviye | çalışır | kısmi | yok | savaş dışı | Toplam |
|---|---|---|---|---|---|
| 0–3 | 130 | 0 | 0 | 53 | 183 |
| 4–5 | 45 | 0 | 0 | 27 | 72 |
| 6–9 | 50 | 0 | 0 | 34 | 84 |
| **Toplam** | 225 | 0 | 0 | 114 | 339 |

Çalışır olanlardan: Game Master notlu 4, kapsam dışı notlu 23, sığmayan parça notlu 0. 6–9. seviye açıklaması (`text`) boş: 0 / 84 (kart SRD sayfa referansını gösterir; Dungeondex açıklamaları ileride bağlanacak).

## Game Master notlu (savaş etkisi tam, kalan parça Game Master'da)

| Kimlik | Sv | Not | Oyuna uyar mı? Neden |
|---|---|---|---|
| charm-person | 1 | Savaşta hedef büyücünün tarafına geçer (Dominate ile aynı taraf değiştirme); büyücü ya da müttefikleri ona zarar verirse ya da süre bitince eski tarafına döner. Dostluk tutumu ve büyü bitince büyülendiğini bilmesi savaş dışı: Game Master anlatır. | evet: Savaşta hedef büyücünün tarafına geçer (Dominate'in taraf değiştirmesi, tepki bağı olmadan: K61; zarar görünce ya da süre bitince döner); tutum ve büyü sonrası farkındalık sosyal sahne, Game Master'ın işi. |
| hideous-laughter | 1 | Savaşta Prone + Incapacitated, tur sonu ve hasarda yeniden save uygulanır; kahkahanın anlatımı Game Master'da. | evet: Mekanik tam; yalnız anlatım Game Master'da. |
| see-invisibility | 2 | Görünmezi görme savaşta uygulanır; Ethereal düzlemi görmek savaş dışı (Ethereal yaratık zaten etkilenemez): Game Master. | evet: Ethereal yaratık savaşta zaten etkileşemez; görünmezi görme tam. |
| wish | 9 | 8. seviye ya da altı bir büyüyü kopyalama savaşta (seçim listesi); serbest dilekler Game Master'da. | evet: Savaşta düşmanın yaptığı büyüyü kopyalama (arayüzde seçici; SRD'ye göre ≤ 8. seviye); serbest dilek tanım gereği Game Master kararı. |

## Kapsam dışı notlu (eksik parça savaş modelinin dışında)

Bu parçaların tetikleyiciye göre gruplu kaydı ve ne zaman ele alınacakları: harita/belgeler/BUYU-ERTELENEN.md (Kuyruk G6).

| Kimlik | Sv | Kapsam dışı | Oyuna uyar mı? Neden |
|---|---|---|---|
| light | 0 | 1 saatlik süre savaştan uzun; nesne yerine yaratık da taşır (SRD: nesne). | evet: Işık modeli aydınlık/karanlık; loş ışık ayrımı savaşta küçük fark. |
| entangle | 1 | Bitkilerin büyü bitince çekilmesi görseldir; karede zemin zorlu arazi. | evet: Bitkilerin çekilmesi yalnız görsel; zorlu arazi ve Restrained tam. |
| fog-cloud | 1 | Kürenin merkezi zeminde (havada merkezli küre yok); rüzgârla dağılma Kuyruk 18b rüzgârıyla. | evet: Küre ızgarada; rüzgârla dağılma rüzgâr kuralıyla. |
| hex | 1 | Seçilen yetenek: savaşta kontrol yalnızca STR/DEX (İt, yakalama, kurtulma); seçim yoksa hedefin güçlü olanı | evet: Savaşta yapılan kontroller STR/DEX; diğer yetenek seçimi savaşta karşılıksız. |
| jump | 1 | Zıplamanın havadaki yayı; katmansız haritada dikey zıplama yalnız yüksek erişim (yerinde zıplama: bu tur yakın dövüşte dikeyde +30 ft erişim, tavanla sınırlı; havada kalınmaz). | evet: Yatay uzunluk tam; katmansız haritada dikey zıplama sürüm 52'de (K68b) yüksek erişim olarak (yerinde zıplama), havada kalınmaz. |
| mage-armor | 1 | Zırh giyince bitme: savaşta zırh giyilmez. | evet: Savaşta zırh giyilmez; bitme koşulu hiç tetiklenmez. |
| alter-self | 2 | Change Appearance savaş dışı (Game Master). | evet: Change Appearance sosyal; savaş seçenekleri (Aquatic, Natural Weapons) tam. |
| blindness-deafness | 2 | Deafened'in duymaya bağlı yetenek kontrolleri savaşta yok; sözlü buyruklar (Command, Suggestion) duyulmaz. | evet: Deafened'in savaşta karşılığı (sözlü buyruğu duymama) uygulanır; duymaya bağlı kontroller savaşta yok. |
| continual-flame | 2 | Nesne yerine yaratık da taşır (SRD: nesne); süre savaş boyunca. | evet: Loş ışık ayrımı yok; aydınlatma tam. |
| darkness | 2 | Taşınmayan nesneye yapılan karanlık nesnenin altıgeninde durur (noktaya yapmakla aynı); nesnenin üstünü örtmek savaş dışı. | evet: Nesneye yapılan karanlık nesnenin altıgeninde; örtüyle kapatma savaş dışı. |
| enlarge-reduce | 2 | Boyut, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). | evet: Boyut etkileri (hasar zarı, STR avantajı) tam; altıgen sayısı çok altıgen bayrağına bağlı. |
| flaming-sphere | 2 | Taşıma bonus eylemle (yuvarlama) ve çarpma hasarı Kuyruk 19 yoluyla; ışık 20 ft (4 altıgen). | evet: Yuvarlama ve çarpma çalışır; ışık yarıçapı altıgene yuvarlanır. |
| spider-climb | 2 | Eller serbest kuralı savaş dışı; açık alanda duvar boyu 20 ft (duvarın üstüne çıkılmaz); tavanda düşman altıgeninin üstünden geçilmez. | evet: Sürüm 52 (K68b): duvarda ve tavanda tırmanma, yürüme ve durma; büyü biterse düşer. Eller serbest kuralı savaş dışı. |
| web | 2 | Tutunma yeri: savaş haritasında ağ zemine serili sayılır (SRD: yere serilen ağ çökmez); yanma K55 çözücüsünde (yanan ağ). | evet: Tutunma yeri haritada ağ zemine serili sayılır; yanma çözücüde. |
| animate-dead | 3 | Döküm süresi 1 dakika: yalnızca kurulumda; 24 saatlik kontrol yenileme savaş dışı. | evet: 1 dakikalık döküm kurulumda; 24 saatlik yenileme savaş dışı. |
| call-lightning | 3 | Bulut döküm yerinin üstünde sabit (taban açık gökte 30 ft, tavanlı yerde tavan − 10 ft); havadaki nokta yalnız yaratık seçilince; fırtına kontrolü yalnız +1d10. | evet: Sürüm 52 (K68b): bulut döküm yerinin üstünde sabit, nokta bulutun altında, alçak tavanda yapılmaz, yaratık seçilince şimşek onun irtifasında; fırtına kontrolü yalnız +1d10. |
| conjure-animals | 3 | Large sürü, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). | evet: Çok altıgen bayrağı kapalıyken her yaratık tek altıgen (oyunun genel kuralı). |
| daylight | 3 | Taşınmayan nesneye yapılan ışık nesnenin altıgeninde durur (nesneyle yürümez); Sunlight Sensitivity yalnız parlak alanda. | kısmen: Ek 60 ft loş ışık yok: karanlık haritada aydınlattığı alan SRD'den dar. |
| dispel-magic | 3 | Sihirli eşyanın kendi büyüsü dağılmaz (SRD); nesnedeki süren büyü (Light, Continual Flame) altıgen hedefte kalkar. | evet: SRD'ye uygun: eşyanın kendi büyüsü dağılmaz. |
| plant-growth | 3 | Enrichment (8 saatlik döküm, bir yıl verim) savaş dışı. | evet: Enrichment 8 saatlik döküm, savaş dışı; Overgrowth tam. |
| remove-curse | 3 | Lanetli sihirli eşyada bağlılığı koparma savaş dışı. | evet: Lanetli eşyadan kopma savaş dışı; savaşta lanet kalkar. |
| stinking-cloud | 3 | Kürenin merkezi zeminde (havada merkezli küre yok); rüzgârla dağılma yüzey sistemiyle. | evet: Kürenin köşeleri ızgaraya yuvarlanır; rüzgârla dağılma yüzey sisteminde. |
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
| dancing-lights | 0 | spells.json | çalışır | k67 (sürüm 51) |  |  |
| druidcraft | 0 | spells.json | savaş dışı |  |  |  |
| eldritch-blast | 0 | spells.json | çalışır |  |  |  |
| elementalism | 0 | spells.json | savaş dışı |  |  |  |
| fire-bolt | 0 | spells.json | çalışır |  |  |  |
| guidance | 0 | spells.json | çalışır |  |  |  |
| light | 0 | spells.json | çalışır | k67 (sürüm 51) |  |  |
| mage-hand | 0 | spells.json | savaş dışı |  |  |  |
| mending | 0 | spells.json | savaş dışı |  |  |  |
| message | 0 | spells.json | savaş dışı |  |  |  |
| minor-illusion | 0 | spells.json | savaş dışı |  |  |  |
| poison-spray | 0 | spells.json | çalışır |  |  |  |
| prestidigitation | 0 | spells.json | savaş dışı |  |  |  |
| produce-flame | 0 | spells.json | çalışır | k67 (sürüm 51) |  |  |
| ray-of-frost | 0 | spells.json | çalışır |  |  |  |
| resistance | 0 | spells.json | çalışır |  |  |  |
| sacred-flame | 0 | spells.json | çalışır |  |  |  |
| shillelagh | 0 | spells.json | çalışır |  |  |  |
| shocking-grasp | 0 | spells.json | çalışır |  |  |  |
| sorcerous-burst | 0 | spells.json | çalışır |  |  |  |
| spare-the-dying | 0 | spells.json | çalışır |  |  |  |
| starry-wisp | 0 | spells.json | çalışır | k67 (sürüm 51) |  |  |
| thaumaturgy | 0 | spells.json | savaş dışı |  |  |  |
| true-strike | 0 | spells.json | çalışır |  |  |  |
| vicious-mockery | 0 | spells.json | çalışır |  |  |  |
| alarm | 1 | spells.json | savaş dışı |  |  |  |
| animal-friendship | 1 | spells.json | çalışır |  |  |  |
| bane | 1 | spells.json | çalışır |  |  |  |
| bless | 1 | spells.json | çalışır |  |  |  |
| burning-hands | 1 | spells.json | çalışır |  |  |  |
| charm-person | 1 | spells.json | çalışır | g6 (sürüm 43) |  |  |
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
| faerie-fire | 1 | spells.json | çalışır | k67 (sürüm 51) |  |  |
| false-life | 1 | spells.json | çalışır |  |  |  |
| feather-fall | 1 | spells.json | çalışır |  |  |  |
| find-familiar | 1 | spells.json | çalışır |  |  |  |
| floating-disk | 1 | spells.json | savaş dışı |  |  |  |
| fog-cloud | 1 | spells.json | çalışır | k68 (sürüm 52) |  |  |
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
| jump | 1 | spells.json | çalışır | k68 (sürüm 52) |  |  |
| longstrider | 1 | spells.json | çalışır |  |  |  |
| mage-armor | 1 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| magic-missile | 1 | spells.json | çalışır |  |  |  |
| protection-from-evil-and-good | 1 | spells.json | çalışır | k64 (sürüm 48) |  |  |
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
| continual-flame | 2 | spells.json | çalışır | k67 (sürüm 51) |  |  |
| darkness | 2 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| darkvision | 2 | spells.json | çalışır |  |  |  |
| detect-thoughts | 2 | spells.json | savaş dışı |  |  |  |
| dragons-breath | 2 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| enhance-ability | 2 | spells.json | savaş dışı | a7 (sürüm 36) |  |  |
| enlarge-reduce | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| enthrall | 2 | spells.json | savaş dışı |  |  |  |
| find-steed | 2 | spells.json | çalışır |  |  |  |
| find-traps | 2 | spells.json | savaş dışı |  |  |  |
| flame-blade | 2 | spells.json | çalışır | k67 (sürüm 51) |  |  |
| flaming-sphere | 2 | spells.json | çalışır | k67 (sürüm 51) |  |  |
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
| moonbeam | 2 | spells.json | çalışır | k67 (sürüm 51) |  |  |
| pass-without-trace | 2 | spells.json | çalışır |  |  |  |
| phantasmal-force | 2 | spells.json | çalışır | k63 (sürüm 47) |  |  |
| prayer-of-healing | 2 | spells.json | savaş dışı |  |  |  |
| protection-from-poison | 2 | spells.json | çalışır | a4 (sürüm 32) |  |  |
| ray-of-enfeeblement | 2 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| rope-trick | 2 | spells.json | savaş dışı |  |  |  |
| scorching-ray | 2 | spells.json | çalışır |  |  |  |
| see-invisibility | 2 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| shatter | 2 | spells.json | çalışır |  |  |  |
| shining-smite | 2 | spells.json | çalışır | k67 (sürüm 51) |  |  |
| silence | 2 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| spider-climb | 2 | spells.json | çalışır | k68 (sürüm 52) |  |  |
| spike-growth | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| spiritual-weapon | 2 | spells.json | çalışır |  |  |  |
| suggestion | 2 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| warding-bond | 2 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| web | 2 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| zone-of-truth | 2 | spells.json | savaş dışı |  |  |  |
| animate-dead | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| beacon-of-hope | 3 | spells.json | çalışır | g6 (sürüm 43) |  |  |
| bestow-curse | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| blink | 3 | spells.json | çalışır | s1 (sürüm 40) |  |  |
| call-lightning | 3 | spells.json | çalışır | k68 (sürüm 52) |  |  |
| clairvoyance | 3 | spells.json | savaş dışı |  |  |  |
| conjure-animals | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| counterspell | 3 | spells.json | çalışır |  |  |  |
| create-food-and-water | 3 | spells.json | savaş dışı |  |  |  |
| daylight | 3 | spells.json | çalışır | k67 (sürüm 51) |  |  |
| dispel-magic | 3 | spells.json | çalışır | a7 (sürüm 36) |  |  |
| fear | 3 | spells.json | çalışır | g6 (sürüm 43) |  |  |
| fireball | 3 | spells.json | çalışır |  |  |  |
| fly | 3 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| gaseous-form | 3 | spells.json | çalışır | s2 (sürüm 41) |  |  |
| glyph-of-warding | 3 | spells.json | savaş dışı |  |  |  |
| haste | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| hypnotic-pattern | 3 | spells.json | çalışır | a6 (sürüm 35) |  |  |
| lightning-bolt | 3 | spells.json | çalışır |  |  |  |
| magic-circle | 3 | spells.json | savaş dışı | k64 (sürüm 48) |  |  |
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
| sleet-storm | 3 | spells.json | çalışır | k68 (sürüm 52) |  |  |
| slow | 3 | spells.json | çalışır | a8 (sürüm 37) |  |  |
| speak-with-dead | 3 | spells.json | savaş dışı |  |  |  |
| speak-with-plants | 3 | spells.json | savaş dışı |  |  |  |
| spirit-guardians | 3 | spells.json | çalışır |  |  |  |
| stinking-cloud | 3 | spells.json | çalışır | k68 (sürüm 52) |  |  |
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
| fire-shield | 4 | spells-45.json | çalışır | k67 (sürüm 51) |  |  |
| freedom-of-movement | 4 | spells-45.json | çalışır |  |  |  |
| giant-insect | 4 | spells-45.json | çalışır |  |  |  |
| greater-invisibility | 4 | spells-45.json | çalışır |  |  |  |
| guardian-of-faith | 4 | spells-45.json | çalışır |  |  |  |
| hallucinatory-terrain | 4 | spells-45.json | savaş dışı |  |  |  |
| ice-storm | 4 | spells-45.json | çalışır |  |  |  |
| locate-creature | 4 | spells-45.json | savaş dışı |  |  |  |
| phantasmal-killer | 4 | spells-45.json | çalışır | k63 (sürüm 47) |  |  |
| polymorph | 4 | spells-45.json | çalışır |  |  |  |
| private-sanctum | 4 | spells-45.json | savaş dışı |  |  |  |
| resilient-sphere | 4 | spells-45.json | çalışır |  |  |  |
| secret-chest | 4 | spells-45.json | savaş dışı |  |  |  |
| stone-shape | 4 | spells-45.json | savaş dışı |  |  |  |
| stoneskin | 4 | spells-45.json | çalışır |  |  |  |
| vitriolic-sphere | 4 | spells-45.json | çalışır |  |  |  |
| wall-of-fire | 4 | spells-45.json | çalışır | k67 (sürüm 51) |  |  |
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
| dispel-evil-and-good | 5 | spells-45.json | çalışır | k64 (sürüm 48) |  |  |
| dominate-person | 5 | spells-45.json | çalışır |  |  |  |
| dream | 5 | spells-45.json | savaş dışı |  |  |  |
| flame-strike | 5 | spells-45.json | çalışır |  |  |  |
| geas | 5 | spells-45.json | savaş dışı |  |  |  |
| greater-restoration | 5 | spells-45.json | çalışır |  |  |  |
| hallow | 5 | spells-45.json | savaş dışı | k64 (sürüm 48) |  |  |
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
| wall-of-force | 5 | spells-45.json | çalışır | k65 (sürüm 49) |  |  |
| wall-of-stone | 5 | spells-45.json | çalışır | k65 (sürüm 49) |  |  |
| blade-barrier | 6 | spells-69.json | çalışır | k61 (sürüm 44) |  | hayır |
| chain-lightning | 6 | spells-69.json | çalışır |  |  | hayır |
| circle-of-death | 6 | spells-69.json | çalışır |  |  | hayır |
| conjure-fey | 6 | spells-69.json | çalışır | k61 (sürüm 44) |  | hayır |
| contingency | 6 | spells-69.json | savaş dışı |  |  | hayır |
| create-undead | 6 | spells-69.json | savaş dışı |  |  | hayır |
| disintegrate | 6 | spells-69.json | çalışır |  |  | hayır |
| eyebite | 6 | spells-69.json | çalışır |  |  | hayır |
| find-the-path | 6 | spells-69.json | savaş dışı |  |  | hayır |
| flesh-to-stone | 6 | spells-69.json | çalışır | k70 (sürüm 54) |  | hayır |
| forbiddance | 6 | spells-69.json | savaş dışı |  |  | hayır |
| freezing-sphere | 6 | spells-69.json | çalışır |  |  | hayır |
| globe-of-invulnerability | 6 | spells-69.json | çalışır |  |  | hayır |
| guards-and-wards | 6 | spells-69.json | savaş dışı |  |  | hayır |
| harm | 6 | spells-69.json | çalışır |  |  | hayır |
| heal | 6 | spells-69.json | çalışır |  |  | hayır |
| heroes-feast | 6 | spells-69.json | savaş dışı |  |  | hayır |
| instant-summons | 6 | spells-69.json | savaş dışı |  |  | hayır |
| irresistible-dance | 6 | spells-69.json | çalışır | k61 (sürüm 44) |  | hayır |
| magic-jar | 6 | spells-69.json | savaş dışı |  |  | hayır |
| mass-suggestion | 6 | spells-69.json | çalışır | s1 (sürüm 40) |  | hayır |
| move-earth | 6 | spells-69.json | savaş dışı |  |  | hayır |
| planar-ally | 6 | spells-69.json | savaş dışı |  |  | hayır |
| programmed-illusion | 6 | spells-69.json | savaş dışı |  |  | hayır |
| sunbeam | 6 | spells-69.json | çalışır |  |  | hayır |
| transport-via-plants | 6 | spells-69.json | savaş dışı |  |  | hayır |
| true-seeing | 6 | spells-69.json | çalışır | k63 (sürüm 47) |  | hayır |
| wall-of-ice | 6 | spells-69.json | çalışır | k65 (sürüm 49) |  | hayır |
| wall-of-thorns | 6 | spells-69.json | çalışır |  |  | hayır |
| wind-walk | 6 | spells-69.json | savaş dışı |  |  | hayır |
| word-of-recall | 6 | spells-69.json | savaş dışı |  |  | hayır |
| arcane-sword | 7 | spells-69.json | çalışır |  |  | hayır |
| conjure-celestial | 7 | spells-69.json | çalışır | k67 (sürüm 51) |  | hayır |
| delayed-blast-fireball | 7 | spells-69.json | çalışır | k62 (sürüm 46) |  | hayır |
| divine-word | 7 | spells-69.json | çalışır |  |  | hayır |
| etherealness | 7 | spells-69.json | çalışır |  |  | hayır |
| finger-of-death | 7 | spells-69.json | çalışır |  |  | hayır |
| fire-storm | 7 | spells-69.json | çalışır | k65 (sürüm 49) |  | hayır |
| forcecage | 7 | spells-69.json | çalışır | k65 (sürüm 49) |  | hayır |
| magnificent-mansion | 7 | spells-69.json | savaş dışı |  |  | hayır |
| mirage-arcane | 7 | spells-69.json | savaş dışı |  |  | hayır |
| plane-shift | 7 | spells-69.json | çalışır | s1 (sürüm 40) |  | hayır |
| prismatic-spray | 7 | spells-69.json | çalışır |  |  | hayır |
| project-image | 7 | spells-69.json | savaş dışı |  |  | hayır |
| regenerate | 7 | spells-69.json | savaş dışı |  |  | hayır |
| resurrection | 7 | spells-69.json | savaş dışı |  |  | hayır |
| reverse-gravity | 7 | spells-69.json | çalışır |  |  | hayır |
| sequester | 7 | spells-69.json | savaş dışı |  |  | hayır |
| simulacrum | 7 | spells-69.json | savaş dışı |  |  | hayır |
| symbol | 7 | spells-69.json | savaş dışı |  |  | hayır |
| teleport | 7 | spells-69.json | savaş dışı |  |  | hayır |
| animal-shapes | 8 | spells-69.json | savaş dışı | a7 (sürüm 36) |  | hayır |
| antimagic-field | 8 | spells-69.json | çalışır |  |  | hayır |
| antipathy-sympathy | 8 | spells-69.json | savaş dışı |  |  | hayır |
| befuddlement | 8 | spells-69.json | çalışır |  |  | hayır |
| clone | 8 | spells-69.json | savaş dışı |  |  | hayır |
| control-weather | 8 | spells-69.json | savaş dışı |  |  | hayır |
| demiplane | 8 | spells-69.json | savaş dışı |  |  | hayır |
| dominate-monster | 8 | spells-69.json | çalışır |  |  | hayır |
| earthquake | 8 | spells-69.json | çalışır | k66 (sürüm 50) |  | hayır |
| glibness | 8 | spells-69.json | çalışır |  |  | hayır |
| holy-aura | 8 | spells-69.json | çalışır | a4 (sürüm 32) |  | hayır |
| incendiary-cloud | 8 | spells-69.json | çalışır |  |  | hayır |
| maze | 8 | spells-69.json | çalışır |  |  | hayır |
| mind-blank | 8 | spells-69.json | çalışır |  |  | hayır |
| power-word-stun | 8 | spells-69.json | çalışır |  |  | hayır |
| sunburst | 8 | spells-69.json | çalışır |  |  | hayır |
| tsunami | 8 | spells-69.json | savaş dışı |  |  | hayır |
| astral-projection | 9 | spells-69.json | savaş dışı |  |  | hayır |
| foresight | 9 | spells-69.json | savaş dışı |  |  | hayır |
| gate | 9 | spells-69.json | savaş dışı |  |  | hayır |
| imprisonment | 9 | spells-69.json | savaş dışı |  |  | hayır |
| mass-heal | 9 | spells-69.json | çalışır |  |  | hayır |
| meteor-swarm | 9 | spells-69.json | çalışır | s1 (sürüm 40) |  | hayır |
| power-word-heal | 9 | spells-69.json | çalışır |  |  | hayır |
| power-word-kill | 9 | spells-69.json | çalışır |  |  | hayır |
| prismatic-wall | 9 | spells-69.json | çalışır |  |  | hayır |
| shapechange | 9 | spells-69.json | çalışır |  |  | hayır |
| storm-of-vengeance | 9 | spells-69.json | çalışır |  |  | hayır |
| time-stop | 9 | spells-69.json | çalışır |  |  | hayır |
| true-polymorph | 9 | spells-69.json | çalışır |  |  | hayır |
| true-resurrection | 9 | spells-69.json | savaş dışı |  |  | hayır |
| weird | 9 | spells-69.json | çalışır | k63 (sürüm 47) |  | hayır |
| wish | 9 | spells-69.json | çalışır | a7 (sürüm 36) |  | hayır |
