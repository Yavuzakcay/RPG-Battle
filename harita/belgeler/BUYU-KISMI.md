# Kısmi büyüler (Kuyruk A4, A6)

`node scripts/a4-buyu-kismi.mjs` üretir; elle düzenlenmez. Savaşta kullanılan (savaş dışı olmayan) büyülerden yaklaşıklığı (`approx`) ya da yalnızca Game Master notu kalanlar "kısmi"dir. `kapsamDisi`: eksik parça savaş modelinin dışında (sosyal, düzlem, nesne, saatlik süre); gerekçeler DECISIONS.md (Kuyruk A4, A6). Sayım kural sürümü 32+ (`a4`) ve 35+ (`a6`) mekaniğiyle; `sigmayan`: SRD metninin oyuna sığmayan parçası (kart ve günlükte Game Master notu, satırı harita/belgeler/BUYU-SIGMAYAN.md).

## Özet

| | Sayı |
|---|---|
| Savaşta kullanılan büyü | 227 |
| A4 öncesi kısmi | 75 |
| A4 sonrası kısmi | 26 |
| Tamamlanan (sürüm 32, `a4`) | 10 |
| Tamamlanan (sürüm 35, `a6`; tam) | 19 |
| Tamamlanan (sürüm 35, `a6`; sığmayan parça notlu) | 12 |
| Kapsam dışı olarak çalışır sayılan | 11 |

## Kalan kısmiler: altyapıya göre

| Altyapı | Sayı | Büyüler |
|---|---|---|
| nesne ve el modeli (eşya bırakma, nesneye yapma) | 10 | command, faerie-fire, darkness, dragons-breath, enlarge-reduce, flame-blade, heat-metal, magic-weapon, daylight, dispel-magic |
| alan geometrisi ve taşıma (serbest çizim, rüzgârla dağılma) | 8 | dancing-lights, entangle, fog-cloud, plant-growth, slow, stinking-cloud, wind-wall, meteor-swarm |
| yükseklik/irtifa (uçuş katmanı yok) | 8 | jump, flaming-sphere, levitate, moonbeam, spider-climb, fly, gaseous-form, sleet-storm |

## Liste

| Kimlik | Sv | Dosya | Durum | Eksik | Kapsam dışı | Sığmayan parça (BUYU-SIGMAYAN.md) |
|---|---|---|---|---|---|---|
| dancing-lights | 0 | spells.json | kısmi | Dört ışık yerine tek ışık noktası (çevresiyle 10 ft); taşıma bonus eylemle bir yaratığın altıgenine; insan biçimi yok |  |  |
| command | 1 | spells.json | kısmi | Drop: elde tutulan bırakılmaz (silah bırakma modeli yok), yalnızca turunu kaybeder; Approach ve Flee yürüyüşten sonra turu biter |  |  |
| entangle | 1 | spells.json | kısmi | Kurtulma eylemle STR (Athletics) kontrolüyle; bitki sarmaşığının bitişik altıgenlere yayılması yok |  |  |
| faerie-fire | 1 | spells.json | kısmi | Nesneler işaretlenmez; saldıranın hedefi görmesi ayrıca denetlenmez; ışık (10 ft) yalnızca karanlık/gece haritalarında |  |  |
| fog-cloud | 1 | spells.json | kısmi | Rüzgârla dağılma yok |  |  |
| jump | 1 | spells.json | kısmi | Turda bir 30 ft düz atlama 10 ft (2 altıgen) harcar, aradaki tek engel altıgeninin (hendek, sütun) üstünden geçer (Görev K9c); yüksek atlama yok |  |  |
| darkness | 2 | spells.json | kısmi | Nesneye bağlı yürüyen karanlık yok; Blindsight/Truesight yok; Darkvision bu alanı göremez ve ışık aydınlatamaz (karanlık/gece haritasında), her haritada yoğun örtü |  |  |
| dragons-breath | 2 | spells.json | kısmi | Nefesi dokunulan dost yerine büyücü verir; tür seçimi yapılırken (nefeste Fire); yukarı slot zarı uygulanmaz |  |  |
| enlarge-reduce | 2 | spells.json | kısmi | Boyut yalnızca jeton etiketi (mekanik tek altıgen); STR kontrolleri ve nesneler yok |  |  |
| flame-blade | 2 | spells.json | kısmi | Kılıç el boşluğu denetlenmez; bırakıp yeniden çağırma yok; saldırı "Büyüyü sürdür" (eylem) ile |  |  |
| flaming-sphere | 2 | spells.json | kısmi | Engellerin üstünden atlama ve ışık yok; çarpma yalnızca taşımanın sonunda bitişik yaratığa |  |  |
| heat-metal | 2 | spells.json | kısmi | Her yaratık metal taşıyor sayılır; silahı bırakma seçeneği yok, kontrol dezavantajı yok |  |  |
| levitate | 2 | spells.json | kısmi | Yükseklik modeli yok: havadaki yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c) ama yürüyemez; 20 ft yükselme ve duvardan itinerek hareket yok; nesneye yapılmaz |  |  |
| magic-weapon | 2 | spells.json | kısmi | Büyücünün kendi silahlarına uygulanır |  |  |
| moonbeam | 2 | spells.json | kısmi | Taşıma 60 ft yerine büyü menzili içinde bir yaratığın altıgenine; biçim değiştirenlere ek etki yok; silindir yüksekliği yok |  |  |
| spider-climb | 2 | spells.json | kısmi | Yükseklik modeli yok: tırmanma hızı haritadaki yükseklik farkı maliyetini kaldırır (Görev K9c); duvar/tavanda durma yok |  |  |
| daylight | 3 | spells.json | kısmi | Nesneye bağlı yürüyen ışık yok; ek 60 ft loş ışık yok; gün ışığına duyarlı yaratık kuralları yok |  |  |
| dispel-magic | 3 | spells.json | kısmi | Yaratıktaki süren büyü etkileri, büyüyle çağrılmış yaratık, silahtaki büyü güçlendirmesi (Magic Weapon, Divine Favor) ve altıgen hedefte büyü alanları; slotun üstündeki büyüde yetenek kontrolü DC 10 + seviye. Nesne büyüleri (eşya) yok |  |  |
| fly | 3 | spells.json | kısmi | Yükseklik modeli yok: uçan yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c); uçuş bitince düşme hasarı uygulanmaz |  |  |
| gaseous-form | 3 | spells.json | kısmi | Yükseklik farkı maliyetini ve zemin engelini yok sayar (uçuş 10 ft; Görev K9c); dar aralıklardan geçme yok (harita altıgen) |  |  |
| plant-growth | 3 | spells.json | kısmi | Alandan bölge çıkarma yok; Enrichment (8 saat) savaşta yok |  |  |
| sleet-storm | 3 | spells.json | kısmi | Silindir küre sayılır (yükseklik yok); alevlerin sönmesi yok |  |  |
| slow | 3 | spells.json | kısmi | 40 ft küp yerine seçilen hedefler; büyü yapmadaki gecikme (d20) yok |  |  |
| stinking-cloud | 3 | spells.json | kısmi | Eylem ve bonus eylem kaybı Incapacitated ile (tepki de gider); rüzgârla dağılma yok |  |  |
| wind-wall | 3 | spells.json | kısmi | Duvar düz ya da büyücünün çevresinde yay (serbest çizim yok); dev kayaları ayrımı yok; sis dağıtma yok |  |  |
| meteor-swarm | 9 | spells-69.json | kısmi | Dört 40 ft küre yerine bir küre (büyü tek hedef altıgeni alır); yapay zekâ en kalabalık noktayı seçer |  |  |
| light | 0 | spells.json | çalışır (kapsam dışı) |  | Nesne yerine yaratık taşır; loş ışık ayrımı oyunun ışık modelinde yok (aydınlık/karanlık) |  |
| produce-flame | 0 | spells.json | tamam (A6) |  |  |  |
| starry-wisp | 0 | spells.json | tamam (A4) |  |  |  |
| charm-person | 1 | spells.json | çalışır (kapsam dışı) |  | Dostluk tutumu ve sosyal avantaj (savaş dışı; Game Master) |  |
| chromatic-orb | 1 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Sıçrama hedefini arayüz sormaz: komut targetIds sırasıyla seçer; oyuncu arayüzü ve yapay zekâ en yakın düşmanı alır. |
| color-spray | 1 | spells.json | tamam (A4) |  |  |  |
| ensnaring-strike | 1 | spells.json | tamam (A6) |  |  |  |
| expeditious-retreat | 1 | spells.json | tamam (A4) |  |  |  |
| hex | 1 | spells.json | tamam (A4) |  | Seçilen yetenek: savaşta kontrol yalnızca STR/DEX (İt, yakalama, kurtulma); seçim yoksa hedefin güçlü olanı |  |
| hideous-laughter | 1 | spells.json | çalışır (kapsam dışı) |  | Prone'dan kalkamama: Incapacitated zaten kalkmayı engeller (kural eşdeğeri) |  |
| mage-armor | 1 | spells.json | tamam (A6) |  | Zırh giyince bitme: savaşta zırh giyilmez. |  |
| protection-from-evil-and-good | 1 | spells.json | tamam (A6) |  | Ele geçirme (possession) oyunda hiçbir canavarda yok. |  |
| sanctuary | 1 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Save'i kaçıran saldıranın eylemi harcanmaz ve yeni hedef seçer; hiç hedef seçmeyip başka bir eylem yaparsa SRD'deki 'saldırı/büyü boşa gider' uygulanmaz. |
| sleep | 1 | spells.json | tamam (A6) |  |  |  |
| alter-self | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  | Change Appearance savaş dışı (Game Master). | Seçeneği Magic eylemiyle değiştirme yok: başka seçenek için büyü yeniden yapılır. |
| blindness-deafness | 2 | spells.json | tamam (A6) |  | Deafened'in duymaya bağlı yetenek kontrolleri savaşta yok; sözlü buyruklar (Command, Suggestion) duyulmaz. |  |
| blur | 2 | spells.json | tamam (A4) |  |  |  |
| calm-emotions | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Var olan Charmed/Frightened bastırılmaz, kalkar: durum sayaçları bastırmayı tutmuyor, büyü bitince geri gelmez. |
| continual-flame | 2 | spells.json | çalışır (kapsam dışı) |  | Nesne yerine yaratık taşır, süre savaş boyunca (kalıcı ışık savaş içinde eşdeğer) |  |
| enhance-ability | 2 | spells.json | çalışır (kapsam dışı) |  | Kontrol avantajı uygulanır; savaşta kontrol azdır (İt, Gizlen, kurtulma) — not, eksik değil |  |
| gust-of-wind | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Rüzgâr çizgisi büyücü yürüyünce onunla gitmez (bonus eylemle yeni yöne yeniden çizilir); büyücüye yaklaşma maliyeti adım adım değil, başlangıç yerine göre. |
| invisibility | 2 | spells.json | tamam (A6) |  |  |  |
| mind-spike | 2 | spells.json | tamam (A6) |  |  |  |
| mirror-image | 2 | spells.json | tamam (A4) |  |  |  |
| phantasmal-force | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Yanılsamanın biçimi ve konumu yok: hedefin yanılsamanın 5 ft içinde olduğu varsayılır, hasar her turda verilir. |
| protection-from-poison | 2 | spells.json | tamam (A4) |  |  |  |
| ray-of-enfeeblement | 2 | spells.json | tamam (A6) |  |  |  |
| see-invisibility | 2 | spells.json | çalışır (kapsam dışı) |  | Ethereal Plane görüşü: oyunda düzlem modeli yok; Ethereal hedef zaten etkilenemez (SRD) |  |
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
| fear | 3 | spells.json | tamam (A4) |  | Elindekini düşürme: silah bırakma modeli yok (tur zaten kaçışla geçer) |  |
| haste | 3 | spells.json | tamam (A6) |  |  |  |
| hypnotic-pattern | 3 | spells.json | tamam (A6) |  |  |  |
| remove-curse | 3 | spells.json | tamam (A6) |  | Lanetli sihirli eşyada bağlılığı koparma savaş dışı. |  |
| conjure-fey | 6 | spells-69.json | tamam (A6) |  | Ruhun Fey görünüşü yalnızca görsel. |  |
| mass-suggestion | 6 | spells-69.json | tamam (A6, sığmayan parça notlu) |  |  | Serbest metinli öneri (en çok 25 sözcük) savaşta iki seçenekle: savaşı bırak (her tur durur) ya da uzaklaş; başka öneri Game Master'da. |
| plane-shift | 7 | spells-69.json | tamam (A6, sığmayan parça notlu) |  |  | Düzlem yolculuğu savaş modelinde yok: SRD 5.2.1'de istemsiz hedefe sürgün kolu yok, büyü yalnızca isteklileri götürür; oyunda yapılınca Game Master notu düşer. |
| animal-shapes | 8 | spells-69.json | çalışır (kapsam dışı) |  | Polymorph biçim olayıyla istekli dostlar (SRD ile aynı; not) |  |
| holy-aura | 8 | spells-69.json | tamam (A4) |  |  |  |
| wish | 9 | spells-69.json | çalışır (kapsam dışı) |  | Kopyalama savaşta; diğer dilekler savaş dışı (Game Master) |  |
