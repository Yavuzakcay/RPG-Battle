# Kısmi büyüler (Kuyruk A4, A6, A7, A8, S1, S2)

`node scripts/a4-buyu-kismi.mjs` üretir; elle düzenlenmez. Savaşta kullanılan (savaş dışı olmayan) büyülerden yaklaşıklığı (`approx`) ya da yalnızca Game Master notu kalanlar "kısmi"dir. `kapsamDisi`: eksik parça savaş modelinin dışında (sosyal, düzlem, nesne, saatlik süre); gerekçeler DECISIONS.md (Kuyruk A4, A6). Sayım kural sürümü 32+ (`a4`) ve 35+ (`a6`) mekaniğiyle; `sigmayan`: SRD metninin oyuna sığmayan parçası (kart ve günlükte Game Master notu, satırı harita/belgeler/BUYU-SIGMAYAN.md).

## Özet

| | Sayı |
|---|---|
| Savaşta kullanılan büyü | 225 |
| A4 öncesi kısmi | 73 |
| A4 sonrası kısmi | 0 |
| Tamamlanan (sürüm 32, `a4`) | 10 |
| Tamamlanan (sürüm 35, `a6`; tam) | 31 |
| Tamamlanan (sürüm 35, `a6`; sığmayan parça notlu) | 0 |
| Tamamlanan (sürüm 36, `a7`; tam) | 13 |
| Tamamlanan (sürüm 36, `a7`; Game Master notlu) | 4 |
| Tamamlanan (sürüm 36, `a7`; sığmayan parça notlu) | 0 |
| Tamamlanan (sürüm 37, `a8`; tam) | 15 |
| Tamamlanan (sürüm 37, `a8`; Game Master notlu) | 0 |
| Tamamlanan (sürüm 37, `a8`; sığmayan parça notlu) | 0 |
| Tamamlanan (sürüm 40, `s1`; tam) | 12 |
| Tamamlanan (sürüm 40, `s1`; Game Master notlu) | 0 |
| Tamamlanan (sürüm 40, `s1`; sığmayan parça notlu) | 0 |
| Tamamlanan (sürüm 41, `s2`; tam) | 14 |
| Tamamlanan (sürüm 41, `s2`; Game Master notlu) | 0 |
| Tamamlanan (sürüm 41, `s2`; sığmayan parça notlu) | 0 |
| Kapsam dışı olarak çalışır sayılan (tamamlama bloğu olmadan) | 0 |
| A4 tamamlananlardan kapsam dışı notlu (yukarıdaki A4 sayısının içinde) | 3 (hex, fear, beacon-of-hope) |

## Kalan kısmiler: altyapıya göre

| Altyapı | Sayı | Büyüler |
|---|---|---|

## Liste

| Kimlik | Sv | Dosya | Durum | Eksik | Kapsam dışı | Sığmayan parça (BUYU-SIGMAYAN.md) |
|---|---|---|---|---|---|---|
| dancing-lights | 0 | spells.json | tamam (A7) |  | Dört ayrı ışık yerine birleşik insansı biçim (SRD seçeneği); loş ışık ayrımı ışık modelinde yok. |  |
| light | 0 | spells.json | tamam (A7) |  | Loş ışık ayrımı ışık modelinde yok (aydınlık/karanlık); 1 saatlik süre savaştan uzun. |  |
| produce-flame | 0 | spells.json | tamam (A6) |  |  |  |
| starry-wisp | 0 | spells.json | tamam (A4) |  |  |  |
| charm-person | 1 | spells.json | tamam (A7, Game Master notlu) |  |  |  |
| chromatic-orb | 1 | spells.json | tamam (S1) |  |  |  |
| color-spray | 1 | spells.json | tamam (A4) |  |  |  |
| command | 1 | spells.json | tamam (S2) |  |  |  |
| ensnaring-strike | 1 | spells.json | tamam (A6) |  |  |  |
| entangle | 1 | spells.json | tamam (A8) |  | Bitkilerin büyü bitince çekilmesi görseldir; karede zemin zorlu arazi. |  |
| expeditious-retreat | 1 | spells.json | tamam (A4) |  |  |  |
| faerie-fire | 1 | spells.json | tamam (S1) |  | Loş ışık (10 ft) yalnızca karanlık/gece haritasında anlamlı (ışık modeli aydınlık/karanlık). |  |
| fog-cloud | 1 | spells.json | tamam (A8) |  | Kürenin yüksekliği ve köşeleri dönmesi (ızgarada küre, görüş katmansız); rüzgârla dağılma Kuyruk 18b rüzgârıyla. |  |
| hex | 1 | spells.json | tamam (A4) |  | Seçilen yetenek: savaşta kontrol yalnızca STR/DEX (İt, yakalama, kurtulma); seçim yoksa hedefin güçlü olanı |  |
| hideous-laughter | 1 | spells.json | tamam (A7, Game Master notlu) |  |  |  |
| jump | 1 | spells.json | tamam (A8) |  | Zıplamanın havadaki yayı ve yükseklik katmansız haritada dikey zıplama (katmansız haritada yükseklik yok). |  |
| mage-armor | 1 | spells.json | tamam (A6) |  | Zırh giyince bitme: savaşta zırh giyilmez. |  |
| protection-from-evil-and-good | 1 | spells.json | tamam (A6) |  | Ele geçirme (possession) oyunda hiçbir canavarda yok. |  |
| sanctuary | 1 | spells.json | tamam (S1) |  |  |  |
| sleep | 1 | spells.json | tamam (A6) |  |  |  |
| alter-self | 2 | spells.json | tamam (S1) |  | Change Appearance savaş dışı (Game Master). |  |
| blindness-deafness | 2 | spells.json | tamam (A6) |  | Deafened'in duymaya bağlı yetenek kontrolleri savaşta yok; sözlü buyruklar (Command, Suggestion) duyulmaz. |  |
| blur | 2 | spells.json | tamam (A4) |  |  |  |
| calm-emotions | 2 | spells.json | tamam (S1) |  |  |  |
| continual-flame | 2 | spells.json | tamam (A7) |  | Loş ışık ayrımı ışık modelinde yok (aydınlık/karanlık). |  |
| darkness | 2 | spells.json | tamam (A7) |  | Taşınmayan nesneye yapılan karanlık nesnenin altıgeninde durur (noktaya yapmakla aynı); nesnenin üstünü örtmek savaş dışı. |  |
| dragons-breath | 2 | spells.json | tamam (A7) |  |  |  |
| enlarge-reduce | 2 | spells.json | tamam (S2) |  | Boyut, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). |  |
| flame-blade | 2 | spells.json | tamam (S2) |  |  |  |
| flaming-sphere | 2 | spells.json | tamam (S2) |  | Taşıma bonus eylemle (yuvarlama) ve çarpma hasarı Kuyruk 19 yoluyla; ışık 20 ft (4 altıgen). |  |
| gust-of-wind | 2 | spells.json | tamam (S1) |  |  |  |
| heat-metal | 2 | spells.json | tamam (S2) |  |  |  |
| invisibility | 2 | spells.json | tamam (A6) |  |  |  |
| levitate | 2 | spells.json | tamam (S2) |  |  |  |
| magic-weapon | 2 | spells.json | tamam (S1) |  |  |  |
| mind-spike | 2 | spells.json | tamam (A6) |  |  |  |
| mirror-image | 2 | spells.json | tamam (A4) |  |  |  |
| moonbeam | 2 | spells.json | tamam (S2) |  |  |  |
| phantasmal-force | 2 | spells.json | tamam (S2) |  |  |  |
| protection-from-poison | 2 | spells.json | tamam (A4) |  |  |  |
| ray-of-enfeeblement | 2 | spells.json | tamam (A6) |  |  |  |
| see-invisibility | 2 | spells.json | tamam (A7, Game Master notlu) |  |  |  |
| silence | 2 | spells.json | tamam (A6) |  |  |  |
| spider-climb | 2 | spells.json | tamam (A8) |  | Duvar ve tavanda yürüme yükseklik katmanında tırmanma maliyetini kaldırır (`climb`); tavan modeli yok, eller serbest kuralı savaş dışı. |  |
| spike-growth | 2 | spells.json | tamam (S2) |  |  |  |
| suggestion | 2 | spells.json | tamam (S1) |  |  |  |
| warding-bond | 2 | spells.json | tamam (A6) |  |  |  |
| web | 2 | spells.json | tamam (S2) |  | Tutunma yeri: savaş haritasında ağ zemine serili sayılır (SRD: yere serilen ağ çökmez); yanma K55 çözücüsünde (yanan ağ). |  |
| animate-dead | 3 | spells.json | tamam (A6) |  | Döküm süresi 1 dakika: yalnızca kurulumda; 24 saatlik kontrol yenileme savaş dışı. |  |
| beacon-of-hope | 3 | spells.json | tamam (A4) |  | En yüksek iyileştirme: savaşta iyileştirme yalnızca büyü, iksir ve özellik zarıyla; hepsi büyü yolundan geçmez (iksir zarı) |  |
| bestow-curse | 3 | spells.json | tamam (A6) |  |  |  |
| blink | 3 | spells.json | tamam (S1) |  |  |  |
| call-lightning | 3 | spells.json | tamam (A6) |  | Bulut büyücünün üstünde sayılır; nokta büyü menzilinde seçilir (silindir yüksekliği savaş modelinde yok). |  |
| conjure-animals | 3 | spells.json | tamam (A6) |  | Large sürü, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). |  |
| daylight | 3 | spells.json | tamam (A7) |  | Taşınmayan nesneye yapılan ışık nesnenin altıgeninde durur; ek 60 ft loş ışık ayrımı ışık modelinde yok (aydınlık/karanlık). |  |
| dispel-magic | 3 | spells.json | tamam (A7) |  | Sihirli eşyanın kendi büyüsü dağılmaz (SRD); nesnedeki süren büyü (Light, Continual Flame) altıgen hedefte kalkar. |  |
| fear | 3 | spells.json | tamam (A4) |  | Elindekini düşürme: silah bırakma modeli yok (tur zaten kaçışla geçer) |  |
| fly | 3 | spells.json | tamam (S2) |  |  |  |
| gaseous-form | 3 | spells.json | tamam (S2) |  |  |  |
| haste | 3 | spells.json | tamam (A6) |  |  |  |
| hypnotic-pattern | 3 | spells.json | tamam (A6) |  |  |  |
| plant-growth | 3 | spells.json | tamam (S2) |  | Enrichment (8 saatlik döküm, bir yıl verim) savaş dışı. |  |
| remove-curse | 3 | spells.json | tamam (A6) |  | Lanetli sihirli eşyada bağlılığı koparma savaş dışı. |  |
| sleet-storm | 3 | spells.json | tamam (A8) |  | Silindir yüksekliği (20 ft) ve açık alevlerin sönmesi `douses` ile; konsantrasyon save'i alana giren/başlayanda. |  |
| slow | 3 | spells.json | tamam (A8) |  |  |  |
| stinking-cloud | 3 | spells.json | tamam (A8) |  | Kürenin dönmesi; rüzgârla dağılma yüzey sistemiyle. |  |
| wind-wall | 3 | spells.json | tamam (S2) |  |  |  |
| conjure-fey | 6 | spells-69.json | tamam (A6) |  | Ruhun Fey görünüşü yalnızca görsel. |  |
| mass-suggestion | 6 | spells-69.json | tamam (S1) |  |  |  |
| plane-shift | 7 | spells-69.json | tamam (S1) |  |  |  |
| holy-aura | 8 | spells-69.json | tamam (A4) |  |  |  |
| meteor-swarm | 9 | spells-69.json | tamam (S1) |  |  |  |
| wish | 9 | spells-69.json | tamam (A7, Game Master notlu) |  |  |  |
