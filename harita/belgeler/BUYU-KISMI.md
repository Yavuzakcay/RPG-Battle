# Kısmi büyüler (Kuyruk A4, A6, A7, A8, S1)

`node scripts/a4-buyu-kismi.mjs` üretir; elle düzenlenmez. Savaşta kullanılan (savaş dışı olmayan) büyülerden yaklaşıklığı (`approx`) ya da yalnızca Game Master notu kalanlar "kısmi"dir. `kapsamDisi`: eksik parça savaş modelinin dışında (sosyal, düzlem, nesne, saatlik süre); gerekçeler DECISIONS.md (Kuyruk A4, A6). Sayım kural sürümü 32+ (`a4`) ve 35+ (`a6`) mekaniğiyle; `sigmayan`: SRD metninin oyuna sığmayan parçası (kart ve günlükte Game Master notu, satırı harita/belgeler/BUYU-SIGMAYAN.md).

## Özet

| | Sayı |
|---|---|
| Savaşta kullanılan büyü | 227 |
| A4 öncesi kısmi | 75 |
| A4 sonrası kısmi | 0 |
| Tamamlanan (sürüm 32, `a4`) | 10 |
| Tamamlanan (sürüm 35, `a6`; tam) | 28 |
| Tamamlanan (sürüm 35, `a6`; sığmayan parça notlu) | 3 |
| Tamamlanan (sürüm 36, `a7`; tam) | 9 |
| Tamamlanan (sürüm 36, `a7`; Game Master notlu) | 6 |
| Tamamlanan (sürüm 36, `a7`; sığmayan parça notlu) | 4 |
| Tamamlanan (sürüm 37, `a8`; tam) | 8 |
| Tamamlanan (sürüm 37, `a8`; Game Master notlu) | 0 |
| Tamamlanan (sürüm 37, `a8`; sığmayan parça notlu) | 7 |
| Tamamlanan (sürüm 40, `s1`; tam) | 12 |
| Tamamlanan (sürüm 40, `s1`; Game Master notlu) | 0 |
| Tamamlanan (sürüm 40, `s1`; sığmayan parça notlu) | 0 |
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
| command | 1 | spells.json | tamam (A7, sığmayan parça notlu) |  |  | Drop: elde tutulanın yere düşmesi ve geri alınması yok (eşya bırakma modeli yok); hedef yalnızca turunu kaybeder. |
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
| enhance-ability | 2 | spells.json | tamam (A7, Game Master notlu) |  |  |  |
| enlarge-reduce | 2 | spells.json | tamam (A7, sığmayan parça notlu) |  | Boyut, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). | Nesneye (taşınmayan) yapma yok: savaş nesneleri boyut taşımaz. |
| flame-blade | 2 | spells.json | tamam (A7, sığmayan parça notlu) |  |  | Bıçağı bırakıp bonus eylemle yeniden çağırma yok (elde silah değiştirme modeli yok); kalkan ya da yan el silahı taşıyan yapamaz. |
| flaming-sphere | 2 | spells.json | tamam (A8, sığmayan parça notlu) |  | Taşıma bonus eylemle (yuvarlama) ve çarpma hasarı Kuyruk 19 yoluyla; ışık 20 ft (4 altıgen). | Küre 5 ft'ten yüksek engelleri ve 10 ft genişliğinden geniş çukurları aşamaz, yaratığın altıgenine itilince durur; yanıcı nesneleri tutuşturur. |
| gust-of-wind | 2 | spells.json | tamam (S1) |  |  |  |
| heat-metal | 2 | spells.json | tamam (A7, sığmayan parça notlu) |  |  | Metal nesne seçimi ve bırakma yok: her hedef metal taşıyor sayılır, başarısız save'de nesneyi bırakamaz ve saldırı/kontrol dezavantajını alır. |
| invisibility | 2 | spells.json | tamam (A6) |  |  |  |
| levitate | 2 | spells.json | tamam (A8, sığmayan parça notlu) |  | Havada süzülen yürüyemez; zemin etkilerinden kurtulur. | Yükselme yüksekliği (20 ft'e dek, hareketle 20 ft yukarı/aşağı), duvara tutunarak itme ve 500 lb'ye dek nesneyi kaldırma. |
| magic-weapon | 2 | spells.json | tamam (S1) |  |  |  |
| mind-spike | 2 | spells.json | tamam (A6) |  |  |  |
| mirror-image | 2 | spells.json | tamam (A4) |  |  |  |
| moonbeam | 2 | spells.json | tamam (A8, sığmayan parça notlu) |  |  | Silindir 40 ft yüksekliğinde (uçanlar da etkilenir; oyunda katman yok) ve taşıma yalnızca boş/dolu altıgen merkezine; yaratığa taşınınca o tur save'i SRD'deki gibi bir kez. |
| phantasmal-force | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Yanılsamanın biçimi ve konumu yok: hedefin yanılsamanın 5 ft içinde olduğu varsayılır, hasar her turda verilir. |
| protection-from-poison | 2 | spells.json | tamam (A4) |  |  |  |
| ray-of-enfeeblement | 2 | spells.json | tamam (A6) |  |  |  |
| see-invisibility | 2 | spells.json | tamam (A7, Game Master notlu) |  |  |  |
| silence | 2 | spells.json | tamam (A6) |  |  |  |
| spider-climb | 2 | spells.json | tamam (A8) |  | Duvar ve tavanda yürüme yükseklik katmanında tırmanma maliyetini kaldırır (`climb`); tavan modeli yok, eller serbest kuralı savaş dışı. |  |
| spike-growth | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  |  | Kamufle alan: tek ekran paylaşımlı oyunda alan herkese görünür (gizli katman yok); yapay zekâ zaten büyü alanlarından kaçınmaz. |
| suggestion | 2 | spells.json | tamam (S1) |  |  |  |
| warding-bond | 2 | spells.json | tamam (A6) |  |  |  |
| web | 2 | spells.json | tamam (A6, sığmayan parça notlu) |  | Tutunma yeri: savaş haritasında ağ zemine serili sayılır (SRD: yere serilen ağ çökmez); yanma K55 çözücüsünde (yanan ağ). | Hafif örtü (görmeye dayalı Algı dezavantajı) uygulanmaz: oyunda Algı yalnız gizleneni bulmada kullanılır ve hafif örtü gizlenmeye izin vermez. |
| animate-dead | 3 | spells.json | tamam (A6) |  | Döküm süresi 1 dakika: yalnızca kurulumda; 24 saatlik kontrol yenileme savaş dışı. |  |
| beacon-of-hope | 3 | spells.json | tamam (A4) |  | En yüksek iyileştirme: savaşta iyileştirme yalnızca büyü, iksir ve özellik zarıyla; hepsi büyü yolundan geçmez (iksir zarı) |  |
| bestow-curse | 3 | spells.json | tamam (A6) |  |  |  |
| blink | 3 | spells.json | tamam (S1) |  |  |  |
| call-lightning | 3 | spells.json | tamam (A6) |  | Bulut büyücünün üstünde sayılır; nokta büyü menzilinde seçilir (silindir yüksekliği savaş modelinde yok). |  |
| conjure-animals | 3 | spells.json | tamam (A6) |  | Large sürü, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). |  |
| daylight | 3 | spells.json | tamam (A7) |  | Taşınmayan nesneye yapılan ışık nesnenin altıgeninde durur; ek 60 ft loş ışık ayrımı ışık modelinde yok (aydınlık/karanlık). |  |
| dispel-magic | 3 | spells.json | tamam (A7) |  | Sihirli eşyanın kendi büyüsü dağılmaz (SRD); nesnedeki süren büyü (Light, Continual Flame) altıgen hedefte kalkar. |  |
| fear | 3 | spells.json | tamam (A4) |  | Elindekini düşürme: silah bırakma modeli yok (tur zaten kaçışla geçer) |  |
| fly | 3 | spells.json | tamam (A8, sığmayan parça notlu) |  |  | Büyü bitince havadaki hedef düşer (yükseklik modeli yok: uçan her zaman zemin seviyesinde sayılır). |
| gaseous-form | 3 | spells.json | tamam (A8, sığmayan parça notlu) |  |  | Başka yaratığın alanından geçip durabilme ve küçük deliklerden geçme (yaratık alanında durmak kuralı yok). |
| haste | 3 | spells.json | tamam (A6) |  |  |  |
| hypnotic-pattern | 3 | spells.json | tamam (A6) |  |  |  |
| plant-growth | 3 | spells.json | tamam (A8, sığmayan parça notlu) |  |  | Alanın içindeki bölgeleri büyünün dışında bırakma (yalnızca tam daire) ve 8 saatlik Enrichment (savaş dışı). |
| remove-curse | 3 | spells.json | tamam (A6) |  | Lanetli sihirli eşyada bağlılığı koparma savaş dışı. |  |
| sleet-storm | 3 | spells.json | tamam (A8) |  | Silindir yüksekliği (20 ft) ve açık alevlerin sönmesi `douses` ile; konsantrasyon save'i alana giren/başlayanda. |  |
| slow | 3 | spells.json | tamam (A8) |  |  |  |
| stinking-cloud | 3 | spells.json | tamam (A8) |  | Kürenin dönmesi; rüzgârla dağılma yüzey sistemiyle. |  |
| wind-wall | 3 | spells.json | tamam (A8, sığmayan parça notlu) |  |  | Duvarın serbest biçimi (oyunda düz ya da büyücünün çevresinde yay) ve dev boyutlu kaya/kuşatma mermilerinin duvardan geçmesi. |
| conjure-fey | 6 | spells-69.json | tamam (A6) |  | Ruhun Fey görünüşü yalnızca görsel. |  |
| mass-suggestion | 6 | spells-69.json | tamam (S1) |  |  |  |
| plane-shift | 7 | spells-69.json | tamam (S1) |  |  |  |
| animal-shapes | 8 | spells-69.json | tamam (A7, Game Master notlu) |  |  |  |
| holy-aura | 8 | spells-69.json | tamam (A4) |  |  |  |
| meteor-swarm | 9 | spells-69.json | tamam (S1) |  |  |  |
| wish | 9 | spells-69.json | tamam (A7, Game Master notlu) |  |  |  |
