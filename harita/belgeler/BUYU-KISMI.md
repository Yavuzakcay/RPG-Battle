# Kısmi büyüler (Kuyruk A4)

`node scripts/a4-buyu-kismi.mjs` üretir; elle düzenlenmez. Savaşta kullanılan (savaş dışı olmayan) büyülerden yaklaşıklığı (`approx`) ya da yalnızca Game Master notu kalanlar "kısmi"dir. `kapsamDisi`: eksik parça savaş modelinin dışında (sosyal, düzlem, nesne, saatlik süre); gerekçeler DECISIONS.md (Kuyruk A4). Sayım kural sürümü 32+ mekaniğiyle (`a4`).

## Özet

| | Sayı |
|---|---|
| Savaşta kullanılan büyü | 227 |
| A4 öncesi kısmi | 75 |
| A4 sonrası kısmi | 57 |
| Tamamlanan (sürüm 32, `a4`) | 10 |
| Kapsam dışı olarak çalışır sayılan | 11 |

## Kalan kısmiler: altyapıya göre

| Altyapı | Sayı | Büyüler |
|---|---|---|
| tekil (büyüye özgü) | 17 | produce-flame, chromatic-orb, mage-armor, protection-from-evil-and-good, sanctuary, alter-self, blindness-deafness, gust-of-wind, invisibility, ray-of-enfeeblement, warding-bond, web, bestow-curse, blink, call-lightning, remove-curse, plane-shift |
| nesne ve el modeli (eşya bırakma, nesneye yapma) | 10 | command, faerie-fire, darkness, dragons-breath, enlarge-reduce, flame-blade, heat-metal, magic-weapon, daylight, dispel-magic |
| alan geometrisi ve taşıma (serbest çizim, rüzgârla dağılma) | 8 | dancing-lights, entangle, fog-cloud, plant-growth, slow, stinking-cloud, wind-wall, meteor-swarm |
| yükseklik/irtifa (uçuş katmanı yok) | 8 | jump, flaming-sphere, levitate, moonbeam, spider-climb, fly, gaseous-form, sleet-storm |
| eylem ekonomisi (ek eylem, gecikme, uyandırma) | 4 | ensnaring-strike, sleep, haste, hypnotic-pattern |
| buyruk/öneri metni | 4 | calm-emotions, silence, suggestion, mass-suggestion |
| yanılsama ve algı (biçim, Study, yerini bilme) | 3 | mind-spike, phantasmal-force, spike-growth |
| çağırma ve sürü | 3 | animate-dead, conjure-animals, conjure-fey |

## Liste

| Kimlik | Sv | Dosya | Durum | Eksik | Kapsam dışı |
|---|---|---|---|---|---|
| dancing-lights | 0 | spells.json | kısmi | Dört ışık yerine tek ışık noktası (çevresiyle 10 ft); taşıma bonus eylemle bir yaratığın altıgenine; insan biçimi yok |  |
| produce-flame | 0 | spells.json | kısmi | SRD: alev bonus eylemle yaratılır, Magic eylemiyle 60 ft fırlatılır; oyunda yaratıp fırlatmak tek bonus eylem |  |
| chromatic-orb | 1 | spells.json | kısmi | Sıçrama: aynı iki hasar zarında 30 ft içindeki en yakın düşmana yeni saldırı, slot seviyesi kadar (hedef seçimi yapay zekâda en yakın) |  |
| command | 1 | spells.json | kısmi | Drop: elde tutulan bırakılmaz (silah bırakma modeli yok), yalnızca turunu kaybeder; Approach ve Flee yürüyüşten sonra turu biter |  |
| ensnaring-strike | 1 | spells.json | kısmi | Kurtulma eylemle STR (Athletics) kontrolü yerine tur başı hasardan sonra STR save; yalnızca bu tur yakın dövüş isabeti |  |
| entangle | 1 | spells.json | kısmi | Kurtulma eylemle STR (Athletics) kontrolüyle; bitki sarmaşığının bitişik altıgenlere yayılması yok |  |
| faerie-fire | 1 | spells.json | kısmi | Nesneler işaretlenmez; saldıranın hedefi görmesi ayrıca denetlenmez; ışık (10 ft) yalnızca karanlık/gece haritalarında |  |
| fog-cloud | 1 | spells.json | kısmi | Rüzgârla dağılma yok |  |
| jump | 1 | spells.json | kısmi | Turda bir 30 ft düz atlama 10 ft (2 altıgen) harcar, aradaki tek engel altıgeninin (hendek, sütun) üstünden geçer (Görev K9c); yüksek atlama yok |  |
| mage-armor | 1 | spells.json | kısmi | Hedefin zırh giyip giymediği denetlenmez (temel AC zaten yüksekse etkisiz) |  |
| protection-from-evil-and-good | 1 | spells.json | kısmi | Ele geçirme (possession) yok; zaten Charmed/Frightened olana yeni save avantajı yok |  |
| sanctuary | 1 | spells.json | kısmi | Başarısız save'de saldırı ya da büyü boşa gider (yeni hedef seçme yok; büyü yuvası harcanmaz); alan etkileri ve fırsat saldırısı dışı yollar etkilenmez |  |
| sleep | 1 | spells.json | kısmi | İkinci başarısız save'de Unconscious (Görev WIZARD); hasar alınca uyanır; yanındakinin eylemle uyandırması yok |  |
| alter-self | 2 | spells.json | kısmi | Yalnızca Natural Weapons (hasar türü Bludgeoning kalır); Aquatic Adaptation ve Change Appearance savaş dışı (Game Master) |  |
| blindness-deafness | 2 | spells.json | kısmi | Seçim komutta (choice); arayüzde ve yapay zekâda Blinded. Deafened yalnızca sözlü buyrukları (Command, Suggestion) engeller |  |
| calm-emotions | 2 | spells.json | kısmi | Dostlara save yok (isteyerek başarısız sayılır); var olan Charmed/Frightened bastırılmaz, kalkar; kayıtsızlık "her turunu kaybeder" olarak |  |
| darkness | 2 | spells.json | kısmi | Nesneye bağlı yürüyen karanlık yok; Blindsight/Truesight yok; Darkvision bu alanı göremez ve ışık aydınlatamaz (karanlık/gece haritasında), her haritada yoğun örtü |  |
| dragons-breath | 2 | spells.json | kısmi | Nefesi dokunulan dost yerine büyücü verir; tür seçimi yapılırken (nefeste Fire); yukarı slot zarı uygulanmaz |  |
| enlarge-reduce | 2 | spells.json | kısmi | Boyut yalnızca jeton etiketi (mekanik tek altıgen); STR kontrolleri ve nesneler yok |  |
| flame-blade | 2 | spells.json | kısmi | Kılıç el boşluğu denetlenmez; bırakıp yeniden çağırma yok; saldırı "Büyüyü sürdür" (eylem) ile |  |
| flaming-sphere | 2 | spells.json | kısmi | Engellerin üstünden atlama ve ışık yok; çarpma yalnızca taşımanın sonunda bitişik yaratığa |  |
| gust-of-wind | 2 | spells.json | kısmi | Çizgide tur bitirene tekrar save ve hareket maliyeti yok; tekrar yeni bir esinti olarak |  |
| heat-metal | 2 | spells.json | kısmi | Her yaratık metal taşıyor sayılır; silahı bırakma seçeneği yok, kontrol dezavantajı yok |  |
| invisibility | 2 | spells.json | kısmi | Saldırı ve büyüyle biter; saldırısız hasar verince (aura, alan) bitmez |  |
| levitate | 2 | spells.json | kısmi | Yükseklik modeli yok: havadaki yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c) ama yürüyemez; 20 ft yükselme ve duvardan itinerek hareket yok; nesneye yapılmaz |  |
| magic-weapon | 2 | spells.json | kısmi | Büyücünün kendi silahlarına uygulanır |  |
| mind-spike | 2 | spells.json | kısmi | Hedefin yerini her zaman bilme (gizlenme/görünmezlik) yok |  |
| moonbeam | 2 | spells.json | kısmi | Taşıma 60 ft yerine büyü menzili içinde bir yaratığın altıgenine; biçim değiştirenlere ek etki yok; silindir yüksekliği yok |  |
| phantasmal-force | 2 | spells.json | kısmi | Yanılsamanın biçimi ve konumu yok: her turda hasar verir; Study eylemiyle (Investigation) kurtulma yok |  |
| ray-of-enfeeblement | 2 | spells.json | kısmi | STR saldırısı yakın dövüş saldırısı sayılır (Finesse ve fırlatma ayrımı yok) |  |
| silence | 2 | spells.json | kısmi | Tepki büyüleri (Shield, Counterspell) sessizlikte denetlenmez; Deafened durumu verilmez (Thunder bağışıklığı var) |  |
| spider-climb | 2 | spells.json | kısmi | Yükseklik modeli yok: tırmanma hızı haritadaki yükseklik farkı maliyetini kaldırır (Görev K9c); duvar/tavanda durma yok |  |
| spike-growth | 2 | spells.json | kısmi | Gizlenmiş (fark edilmemiş) alan kuralı yok: herkes alanı görür |  |
| suggestion | 2 | spells.json | kısmi | Öneri iki seçenekle: savaşı bırak (her turunu kaybeder) ya da uzaklaş (her tur kaçar); serbest metinli öneriler Game Master'a; duyma/anlama denetimi yok |  |
| warding-bond | 2 | spells.json | kısmi | Hedefe +1 AC, +1 save, bütün hasar türlerine direnç; aldığı hasar kadar büyücüye (her komuttan sonra); büyücü 0 HP ya da 60 ft'ten uzak olunca biter. Hedefin kendisine yapılamaz |  |
| web | 2 | spells.json | kısmi | Tutunma yeri kuralı (çökme) ve yanma yok; hafif örtünün oyunda etkisi yok |  |
| animate-dead | 3 | spells.json | kısmi | Döküm süresi 1 dakika olduğu için yalnızca kurulumda; bonus eylemle komut yerine sahibinin ardından kendisi oynar |  |
| bestow-curse | 3 | spells.json | kısmi | Hasar seçeneği yalnızca saldırı isabetlerinde (save'li büyülerin hasarına ek 1d8 yok) |  |
| blink | 3 | spells.json | kısmi | Tur sonu d20 11+: sonraki turunun başına dek Ethereal (hedef alınamaz, alan ve saldırılardan etkilenmez); dönüşte aynı altıgen (10 ft içinde yer seçimi yok) |  |
| call-lightning | 3 | spells.json | kısmi | Fırtınada ek zar yok; tekrarın noktası bir yaratığın altıgeni |  |
| conjure-animals | 3 | spells.json | kısmi | Sürü büyücüyle birlikte değil, sahibinin bonus eylemiyle 30 ft taşınır; büyücünün STR save avantajı yok; sürü bir altıgen kaplar |  |
| daylight | 3 | spells.json | kısmi | Nesneye bağlı yürüyen ışık yok; ek 60 ft loş ışık yok; gün ışığına duyarlı yaratık kuralları yok |  |
| dispel-magic | 3 | spells.json | kısmi | Yaratıktaki süren büyü etkileri, büyüyle çağrılmış yaratık, silahtaki büyü güçlendirmesi (Magic Weapon, Divine Favor) ve altıgen hedefte büyü alanları; slotun üstündeki büyüde yetenek kontrolü DC 10 + seviye. Nesne büyüleri (eşya) yok |  |
| fly | 3 | spells.json | kısmi | Yükseklik modeli yok: uçan yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c); uçuş bitince düşme hasarı uygulanmaz |  |
| gaseous-form | 3 | spells.json | kısmi | Yükseklik farkı maliyetini ve zemin engelini yok sayar (uçuş 10 ft; Görev K9c); dar aralıklardan geçme yok (harita altıgen) |  |
| haste | 3 | spells.json | kısmi | Ek eylem asıl eylemden sonra alınır; Utilize yok |  |
| hypnotic-pattern | 3 | spells.json | kısmi | Sarsarak uyandırma (eylemle) yok; hasarla ve konsantrasyonla biter |  |
| plant-growth | 3 | spells.json | kısmi | Alandan bölge çıkarma yok; Enrichment (8 saat) savaşta yok |  |
| remove-curse | 3 | spells.json | kısmi | Yalnızca Bestow Curse etkisi kalkar (Hex büyücünün konsantrasyonunda kalır; lanetli eşya yok) |  |
| sleet-storm | 3 | spells.json | kısmi | Silindir küre sayılır (yükseklik yok); alevlerin sönmesi yok |  |
| slow | 3 | spells.json | kısmi | 40 ft küp yerine seçilen hedefler; büyü yapmadaki gecikme (d20) yok |  |
| stinking-cloud | 3 | spells.json | kısmi | Eylem ve bonus eylem kaybı Incapacitated ile (tepki de gider); rüzgârla dağılma yok |  |
| wind-wall | 3 | spells.json | kısmi | Duvar düz ya da büyücünün çevresinde yay (serbest çizim yok); dev kayaları ayrımı yok; sis dağıtma yok |  |
| conjure-fey | 6 | spells-69.json | kısmi | Fey ruhu ayrı yaratık değil: yapımda ve sonraki turlarda bonus eylemle bir düşmana büyü saldırısı (3d12 Psychic) ve WIS save ya da Frightened |  |
| mass-suggestion | 6 | spells-69.json | kısmi | Öneri savaşta "dur" olarak |  |
| plane-shift | 7 | spells-69.json | kısmi | İstemsiz hedef: melee büyü saldırısı + CHA save; başka düzleme gider (savaş boyunca sürgün) |  |
| meteor-swarm | 9 | spells-69.json | kısmi | Dört 40 ft küre yerine bir küre (büyü tek hedef altıgeni alır); yapay zekâ en kalabalık noktayı seçer |  |
| light | 0 | spells.json | çalışır (kapsam dışı) |  | Nesne yerine yaratık taşır; loş ışık ayrımı oyunun ışık modelinde yok (aydınlık/karanlık) |
| starry-wisp | 0 | spells.json | tamam (A4) |  |  |
| charm-person | 1 | spells.json | çalışır (kapsam dışı) |  | Dostluk tutumu ve sosyal avantaj (savaş dışı; Game Master) |
| color-spray | 1 | spells.json | tamam (A4) |  |  |
| expeditious-retreat | 1 | spells.json | tamam (A4) |  |  |
| hex | 1 | spells.json | tamam (A4) |  | Seçilen yetenek: savaşta kontrol yalnızca STR/DEX (İt, yakalama, kurtulma); seçim yoksa hedefin güçlü olanı |
| hideous-laughter | 1 | spells.json | çalışır (kapsam dışı) |  | Prone'dan kalkamama: Incapacitated zaten kalkmayı engeller (kural eşdeğeri) |
| blur | 2 | spells.json | tamam (A4) |  |  |
| continual-flame | 2 | spells.json | çalışır (kapsam dışı) |  | Nesne yerine yaratık taşır, süre savaş boyunca (kalıcı ışık savaş içinde eşdeğer) |
| enhance-ability | 2 | spells.json | çalışır (kapsam dışı) |  | Kontrol avantajı uygulanır; savaşta kontrol azdır (İt, Gizlen, kurtulma) — not, eksik değil |
| mirror-image | 2 | spells.json | tamam (A4) |  |  |
| protection-from-poison | 2 | spells.json | tamam (A4) |  |  |
| see-invisibility | 2 | spells.json | çalışır (kapsam dışı) |  | Ethereal Plane görüşü: oyunda düzlem modeli yok; Ethereal hedef zaten etkilenemez (SRD) |
| beacon-of-hope | 3 | spells.json | tamam (A4) |  | En yüksek iyileştirme: savaşta iyileştirme yalnızca büyü, iksir ve özellik zarıyla; hepsi büyü yolundan geçmez (iksir zarı) |
| fear | 3 | spells.json | tamam (A4) |  | Elindekini düşürme: silah bırakma modeli yok (tur zaten kaçışla geçer) |
| animal-shapes | 8 | spells-69.json | çalışır (kapsam dışı) |  | Polymorph biçim olayıyla istekli dostlar (SRD ile aynı; not) |
| holy-aura | 8 | spells-69.json | tamam (A4) |  |  |
| wish | 9 | spells-69.json | çalışır (kapsam dışı) |  | Kopyalama savaşta; diğer dilekler savaş dışı (Game Master) |
