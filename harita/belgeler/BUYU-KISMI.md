# Kısmi büyüler (Kuyruk A4, A6, A7, A8)

`node scripts/a4-buyu-kismi.mjs` üretir; elle düzenlenmez. Savaşta kullanılan (savaş dışı olmayan) büyülerden yaklaşıklığı (`approx`) ya da yalnızca Game Master notu kalanlar "kısmi"dir. `kapsamDisi`: eksik parça savaş modelinin dışında (sosyal, düzlem, nesne, saatlik süre); gerekçeler DECISIONS.md (Kuyruk A4, A6). Sayım kural sürümü 32+ (`a4`) ve 35+ (`a6`) mekaniğiyle; `sigmayan`: SRD metninin oyuna sığmayan parçası (kart ve günlükte Game Master notu, satırı harita/belgeler/BUYU-SIGMAYAN.md).

## Özet

| | Sayı |
|---|---|
| Savaşta kullanılan büyü | 227 |
| A4 öncesi kısmi | 75 |
| A4 sonrası kısmi | 15 |
| Tamamlanan (sürüm 32, `a4`) | 10 |
| Tamamlanan (sürüm 35, `a6`; tam) | 19 |
| Tamamlanan (sürüm 35, `a6`; sığmayan parça notlu) | 12 |
| Tamamlanan (sürüm 36, `a7`; tam) | 7 |
| Tamamlanan (sürüm 36, `a7`; Game Master notlu) | 6 |
| Tamamlanan (sürüm 36, `a7`; sığmayan parça notlu) | 6 |
| Tamamlanan (sürüm 37, `a8`; tam) | 0 |
| Tamamlanan (sürüm 37, `a8`; Game Master notlu) | 0 |
| Tamamlanan (sürüm 37, `a8`; sığmayan parça notlu) | 0 |
| Kapsam dışı olarak çalışır sayılan | 3 |

## Kalan kısmiler: altyapıya göre

| Altyapı | Sayı | Büyüler |
|---|---|---|
| yükseklik/irtifa (uçuş katmanı yok) | 8 | jump, flaming-sphere, levitate, moonbeam, spider-climb, fly, gaseous-form, sleet-storm |
| alan geometrisi ve taşıma (serbest çizim, rüzgârla dağılma) | 7 | entangle, fog-cloud, plant-growth, slow, stinking-cloud, wind-wall, meteor-swarm |

## Liste

| Kimlik | Sv | Dosya | Durum | Eksik | Kapsam dışı | Sığmayan parça (BUYU-SIGMAYAN.md) |
|---|---|---|---|---|---|---|
| entangle | 1 | spells.json | kısmi | Kurtulma eylemle STR (Athletics) kontrolüyle; bitki sarmaşığının bitişik altıgenlere yayılması yok |  |  |
| fog-cloud | 1 | spells.json | kısmi | Rüzgârla dağılma yok |  |  |
| jump | 1 | spells.json | kısmi | Turda bir 30 ft düz atlama 10 ft (2 altıgen) harcar, aradaki tek engel altıgeninin (hendek, sütun) üstünden geçer (Görev K9c); yüksek atlama yok |  |  |
| flaming-sphere | 2 | spells.json | kısmi | Engellerin üstünden atlama ve ışık yok; çarpma yalnızca taşımanın sonunda bitişik yaratığa |  |  |
| levitate | 2 | spells.json | kısmi | Yükseklik modeli yok: havadaki yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c) ama yürüyemez; 20 ft yükselme ve duvardan itinerek hareket yok; nesneye yapılmaz |  |  |
| moonbeam | 2 | spells.json | kısmi | Taşıma 60 ft yerine büyü menzili içinde bir yaratığın altıgenine; biçim değiştirenlere ek etki yok; silindir yüksekliği yok |  |  |
| spider-climb | 2 | spells.json | kısmi | Yükseklik modeli yok: tırmanma hızı haritadaki yükseklik farkı maliyetini kaldırır (Görev K9c); duvar/tavanda durma yok |  |  |
| fly | 3 | spells.json | kısmi | Yükseklik modeli yok: uçan yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c); uçuş bitince düşme hasarı uygulanmaz |  |  |
| gaseous-form | 3 | spells.json | kısmi | Yükseklik farkı maliyetini ve zemin engelini yok sayar (uçuş 10 ft; Görev K9c); dar aralıklardan geçme yok (harita altıgen) |  |  |
| plant-growth | 3 | spells.json | kısmi | Alandan bölge çıkarma yok; Enrichment (8 saat) savaşta yok |  |  |
| sleet-storm | 3 | spells.json | kısmi | Silindir küre sayılır (yükseklik yok); alevlerin sönmesi yok |  |  |
| slow | 3 | spells.json | kısmi | 40 ft küp yerine seçilen hedefler; büyü yapmadaki gecikme (d20) yok |  |  |
| stinking-cloud | 3 | spells.json | kısmi | Eylem ve bonus eylem kaybı Incapacitated ile (tepki de gider); rüzgârla dağılma yok |  |  |
| wind-wall | 3 | spells.json | kısmi | Duvar düz ya da büyücünün çevresinde yay (serbest çizim yok); dev kayaları ayrımı yok; sis dağıtma yok |  |  |
| meteor-swarm | 9 | spells-69.json | kısmi | Dört 40 ft küre yerine bir küre (büyü tek hedef altıgeni alır); yapay zekâ en kalabalık noktayı seçer |  |  |
| dancing-lights | 0 | spells.json | tamam (A7) |  | Dört ayrı ışık yerine birleşik insansı biçim (SRD seçeneği); loş ışık ayrımı ışık modelinde yok. |  |
| light | 0 | spells.json | tamam (A7) |  | Loş ışık ayrımı ışık modelinde yok (aydınlık/karanlık); 1 saatlik süre savaştan uzun. |  |
| produce-flame | 0 | spells.json | tamam (A6) |  |  |  |
| starry-wisp | 0 | spells.json | tamam (A4) |  |  |  |
| charm-person | 1 | spells.json | tamam (A7, Game Master notlu) |  |  |  |
| chromatic-orb | 1 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Sıçrama hedefini arayüz sormaz: komut targetIds sırasıyla seçer; oyuncu arayüzü ve yapay zekâ en yakın düşmanı alır. |
| color-spray | 1 | spells.json | tamam (A4) |  |  |  |
| command | 1 | spells.json | tamam (A7, sığmayan parça notlu) |  |  | Drop: elde tutulanın yere düşmesi ve geri alınması yok (eşya bırakma modeli yok); hedef yalnızca turunu kaybeder. |
| ensnaring-strike | 1 | spells.json | tamam (A6) |  |  |  |
| expeditious-retreat | 1 | spells.json | tamam (A4) |  |  |  |
| faerie-fire | 1 | spells.json | tamam (A7, sığmayan parça notlu) |  | Loş ışık (10 ft) yalnızca karanlık/gece haritasında anlamlı (ışık modeli aydınlık/karanlık). | Küpteki nesneler işaretlenmez: nesneye saldırı avantajı yok (nesneler yalnızca AC/HP ile). |
| hex | 1 | spells.json | tamam (A4) |  | Seçilen yetenek: savaşta kontrol yalnızca STR/DEX (İt, yakalama, kurtulma); seçim yoksa hedefin güçlü olanı |  |
| hideous-laughter | 1 | spells.json | tamam (A7, Game Master notlu) |  |  |  |
| mage-armor | 1 | spells.json | tamam (A6) |  | Zırh giyince bitme: savaşta zırh giyilmez. |  |
| protection-from-evil-and-good | 1 | spells.json | tamam (A6) |  | Ele geçirme (possession) oyunda hiçbir canavarda yok. |  |
| sanctuary | 1 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Save'i kaçıran saldıranın eylemi harcanmaz ve yeni hedef seçer; hiç hedef seçmeyip başka bir eylem yaparsa SRD'deki 'saldırı/büyü boşa gider' uygulanmaz. |
| sleep | 1 | spells.json | tamam (A6) |  |  |  |
| alter-self | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  | Change Appearance savaş dışı (Game Master). | Seçeneği Magic eylemiyle değiştirme yok: başka seçenek için büyü yeniden yapılır. |
| blindness-deafness | 2 | spells.json | tamam (A6) |  | Deafened'in duymaya bağlı yetenek kontrolleri savaşta yok; sözlü buyruklar (Command, Suggestion) duyulmaz. |  |
| blur | 2 | spells.json | tamam (A4) |  |  |  |
| calm-emotions | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Var olan Charmed/Frightened bastırılmaz, kalkar: durum sayaçları bastırmayı tutmuyor, büyü bitince geri gelmez. |
| continual-flame | 2 | spells.json | tamam (A7) |  | Loş ışık ayrımı ışık modelinde yok (aydınlık/karanlık). |  |
| darkness | 2 | spells.json | tamam (A7) |  | Taşınmayan nesneye yapılan karanlık nesnenin altıgeninde durur (noktaya yapmakla aynı); nesnenin üstünü örtmek savaş dışı. |  |
| dragons-breath | 2 | spells.json | tamam (A7) |  |  |  |
| enhance-ability | 2 | spells.json | tamam (A7, Game Master notlu) |  |  |  |
| enlarge-reduce | 2 | spells.json | tamam (A7, sığmayan parça notlu) |  | Boyut, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). | Nesneye (taşınmayan) yapma yok: savaş nesneleri boyut taşımaz. |
| flame-blade | 2 | spells.json | tamam (A7, sığmayan parça notlu) |  |  | Bıçağı bırakıp bonus eylemle yeniden çağırma yok (elde silah değiştirme modeli yok); kalkan ya da yan el silahı taşıyan yapamaz. |
| gust-of-wind | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Rüzgâr çizgisi büyücü yürüyünce onunla gitmez (bonus eylemle yeni yöne yeniden çizilir); büyücüye yaklaşma maliyeti adım adım değil, başlangıç yerine göre. |
| heat-metal | 2 | spells.json | tamam (A7, sığmayan parça notlu) |  |  | Metal nesne seçimi ve bırakma yok: her hedef metal taşıyor sayılır, başarısız save'de nesneyi bırakamaz ve saldırı/kontrol dezavantajını alır. |
| invisibility | 2 | spells.json | tamam (A6) |  |  |  |
| magic-weapon | 2 | spells.json | tamam (A7, sığmayan parça notlu) |  |  | Tek silah seçimi yok: güçlendirme dokunulanın bütün silah saldırılarına; silahın zaten büyülü olup olmadığı denetlenmez. |
| mind-spike | 2 | spells.json | tamam (A6) |  |  |  |
| mirror-image | 2 | spells.json | tamam (A4) |  |  |  |
| phantasmal-force | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Yanılsamanın biçimi ve konumu yok: hedefin yanılsamanın 5 ft içinde olduğu varsayılır, hasar her turda verilir. |
| protection-from-poison | 2 | spells.json | tamam (A4) |  |  |  |
| ray-of-enfeeblement | 2 | spells.json | tamam (A6) |  |  |  |
| see-invisibility | 2 | spells.json | tamam (A7, Game Master notlu) |  |  |  |
| silence | 2 | spells.json | tamam (A6) |  |  |  |
| spike-growth | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Kamufle alan: tek ekran paylaşımlı oyunda alan herkese görünür (gizli katman yok); yapay zekâ zaten büyü alanlarından kaçınmaz. |
| suggestion | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Serbest metinli öneri (en çok 25 sözcük) savaşta iki seçenekle: savaşı bırak (her tur durur) ya da uzaklaş; başka öneri Game Master'da. |
| warding-bond | 2 | spells.json | tamam (A6) |  |  |  |
| web | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  | Tutunma yeri: savaş haritasında ağ zemine serili sayılır (SRD: yere serilen ağ çökmez); yanma K55 çözücüsünde (yanan ağ). | Hafif örtü (görmeye dayalı Algı dezavantajı) uygulanmaz: oyunda Algı yalnız gizleneni bulmada kullanılır ve hafif örtü gizlenmeye izin vermez. |
| animate-dead | 3 | spells.json | tamam (A6) |  | Döküm süresi 1 dakika: yalnızca kurulumda; 24 saatlik kontrol yenileme savaş dışı. |  |
| beacon-of-hope | 3 | spells.json | tamam (A4) |  | En yüksek iyileştirme: savaşta iyileştirme yalnızca büyü, iksir ve özellik zarıyla; hepsi büyü yolundan geçmez (iksir zarı) |  |
| bestow-curse | 3 | spells.json | tamam (A6) |  |  |  |
| blink | 3 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Dönüş yeri seçimi (10 ft içinde) yok: yaratık aynı altıgene döner (Ethereal'deyken altıgeni boş tutulur). |
| call-lightning | 3 | spells.json | tamam (A6) |  | Bulut büyücünün üstünde sayılır; nokta büyü menzilinde seçilir (silindir yüksekliği savaş modelinde yok). |  |
| conjure-animals | 3 | spells.json | tamam (A6) |  | Large sürü, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). |  |
| daylight | 3 | spells.json | tamam (A7) |  | Taşınmayan nesneye yapılan ışık nesnenin altıgeninde durur; ek 60 ft loş ışık ayrımı ışık modelinde yok (aydınlık/karanlık). |  |
| dispel-magic | 3 | spells.json | tamam (A7) |  | Sihirli eşyanın kendi büyüsü dağılmaz (SRD); nesnedeki süren büyü (Light, Continual Flame) altıgen hedefte kalkar. |  |
| fear | 3 | spells.json | tamam (A4) |  | Elindekini düşürme: silah bırakma modeli yok (tur zaten kaçışla geçer) |  |
| haste | 3 | spells.json | tamam (A6) |  |  |  |
| hypnotic-pattern | 3 | spells.json | tamam (A6) |  |  |  |
| remove-curse | 3 | spells.json | tamam (A6) |  | Lanetli sihirli eşyada bağlılığı koparma savaş dışı. |  |
| conjure-fey | 6 | spells-69.json | tamam (A6) |  | Ruhun Fey görünüşü yalnızca görsel. |  |
| mass-suggestion | 6 | spells-69.json | tamam (A6, sığmayan parça notlu) |  |  | Serbest metinli öneri (en çok 25 sözcük) savaşta iki seçenekle: savaşı bırak (her tur durur) ya da uzaklaş; başka öneri Game Master'da. |
| plane-shift | 7 | spells-69.json | tamam (A6, sığmayan parça notlu) |  |  | Düzlem yolculuğu savaş modelinde yok: SRD 5.2.1'de istemsiz hedefe sürgün kolu yok, büyü yalnızca isteklileri götürür; oyunda yapılınca Game Master notu düşer. |
| animal-shapes | 8 | spells-69.json | tamam (A7, Game Master notlu) |  |  |  |
| holy-aura | 8 | spells-69.json | tamam (A4) |  |  |  |
| wish | 9 | spells-69.json | tamam (A7, Game Master notlu) |  |  |  |
