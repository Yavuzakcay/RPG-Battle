# Savaş modeline sığmayan büyü parçaları

Kuyruk A6'dan beri (A7, A8 aynı kuralla; satırlar `a7`/`a8` bloklarının `sigmayan` alanıyla): bir büyünün SRD 5.2.1 metnindeki savaşla ilgili bir parçası oyunun savaş modeline sığmıyorsa sığan kısım
uygulanır, sığmayan parça sessizce atlanmaz. Büyü verisinde `sigmayan` alanı (kural sürümü 35+ `a6` bloğu) yapınca günlüğe
"Game Master notu — …" olarak düşer; savaş ekranındaki büyü kartında da not görünür. BUYU-KISMI.md bu büyüleri
"tamam (sığmayan parça notlu)" sayar. Elle tutulur; yeni satır yalnızca büyünün `sigmayan` alanıyla birlikte eklenir.

Kuyruk S1 (kural sürümü 40, `s1` bloğu): 12 satır kapatıldı ve tablodan çıktı (chromatic-orb, blink, meteor-swarm, alter-self,
calm-emotions, plane-shift, suggestion, mass-suggestion, sanctuary, magic-weapon, faerie-fire, gust-of-wind; çözümler
DECISIONS.md "Kuyruk S1"). Kalan 14 satır Kuyruk S2'ye.

| Büyü kimliği | SRD'deki eksik parça | Neden sığmıyor | Şu an oyunda ne yapıyor | CC alternatif önerisi |
|---|---|---|---|---|
| web | Ağın içi hafif örtülü (görmeye dayalı Algı dezavantajı) | Oyunda Algı yalnız gizleneni bulmada kullanılır; hafif örtü gizlenmeye izin vermez (SRD) | Zorlu arazi, Restrained, kaçış, yanma (K55) çalışır; hafif örtünün etkisi yok | Pasif Algıya hafif örtüde −5 (gizlenme kuralı genişlerse) |
| phantasmal-force | Yanılsamanın biçimi ve konumu (hasar yalnız alanında ya da 5 ft yakınında) | Yalnız hedefin gördüğü görünmez nesne/alan katmanı yok | Hasar her tur verilir (yanında sayılır); Study eylemiyle INT (Investigation) kurtulma çalışır | Hedefe özel görünür alan (`zone.visibleTo`) ve hasar koşulu |
| spike-growth | Kamufle alan: görmeyen Search ile fark eder | Tek ekran paylaşımlı oyunda gizli katman yok (Bilinen eksikler: GM'e gizli tuzak görünümü) | Alan herkese görünür; yapay zekâ büyü alanlarından zaten kaçınmaz, yani düşman için gizlilik pratikte korunur | Gizli jeton katmanı gelince alanı `hiddenFrom` ile çiz; Search ile `seenBy`'a ekle |
| command | Drop: hedef elinde tuttuğunu düşürür | Elden düşen silahın yerde nesne olması ve geri alınması (Interact) modeli yok | Hedef turunu kaybeder (Approach büyücüye varamazsa artık turuna devam eder) | Düşen silahı `map.objects`'e silah nesnesi olarak koy, alma eylemi `object_use` |
| enlarge-reduce | Taşınmayan nesneyi büyütme/küçültme | Savaş nesneleri boyut taşımıyor | Yalnızca yaratık; Enlarge STR save/kontrol avantajı + 1d4, Reduce tersi | Nesne türüne boyut ve hasar/AC ölçeği |
| flame-blade | Bıçağı bırakınca kaybolur, bonus eylemle yeniden çağrılır | Elde silah değiştirme (Interact) ve bırakma yok | Saldırı "Büyüyü sürdür" (Magic eylemi); kalkan ya da yan el silahı taşıyan yapamaz | El durumu (`hands`) savaşçıya taşınınca bırak/çağır komutu |
| heat-metal | Metal nesne seçimi; tutan bırakabilir ya da dezavantaj alır | Eşyanın malzemesi ve elden bırakma modeli yok | Her hedef metal taşıyor sayılır; başarısız save'de saldırı ve kontrol dezavantajı | Eşya verisine `metal`, bırakma seçeneği tepki istemiyle |
| flaming-sphere | Küre 5 ft'ten yüksek engeli ve 10 ft'ten geniş çukuru aşamaz; yanıcı nesneleri tutuşturur | Engel yüksekliği ve nesnelerin yanıcılığı modelde yok (yalnızca Grease yanıcı alanı) | Bonus eylemle 30 ft yuvarlanır, çarptığına DEX save 2d6; 20 ft ışık saçar (A8) | Nesneye `flammable` bayrağı ve engel yüksekliği (`heights` katmanıyla) |
| levitate | Yükselme yüksekliği (20 ft'e dek), duvara tutunarak itme, 500 lb'ye dek nesne | Yükseklik katmanı yalnızca altıgen zemin seviyesidir, havada irtifa tutulmaz | Hedef havada süzülür (yürüyemez, zemin etkilerinden kurtulur); CON save'le direnir | Savaşçıya `altitude` (ft) ve dikey hareket komutu |
| moonbeam | 40 ft yükseklikli silindir; yaratık altıgenine taşınınca o tur tek save | İrtifa modeli yok; taşıma altıgen merkezine | Alan Magic eylemiyle en çok 60 ft taşınır, biçim değiştiren başarısız save'de gerçek biçimine döner (A8) | Silindir alanına `heightFt`, uçanın irtifasıyla karşılaştırma |
| fly | Büyü bitince havadaki hedef düşer | Uçan yaratık hep zemin seviyesinde sayılır (irtifa yok) | Uçuş hızı 60 ft; büyü bitince düşme hasarı yok | `altitude` gelince büyü bitişinde `heightFall` düşmesi |
| gaseous-form | Başka yaratığın alanında durabilme, dar delikten geçme | Bir altıgende tek yaratık kuralı; nesne delik modeli yok | Uçuş 10 ft, direnç, saldırı ve büyü yasak (A8), Prone bağışıklığı | Yaratık altıgeninde durmaya izin veren `phase` benzeri etki |
| plant-growth | Alanın içindeki bölgeleri dışarıda bırakma; 8 saatlik Enrichment | Alan seçicide delikli şekil yok; Enrichment savaş dışı | 100 ft yarıçapta 4 kat zorlu arazi | Alan seçiciye "altıgen çıkar" adımı |
| wind-wall | Serbest biçimli duvar; dev kaya ve kuşatma mermileri geçer | Duvar düz ya da büyücünün çevresinde yay; mermi boyutu ayrımı yok | Menzilli silah oku otomatik ıskalar, gaz bulutlarını dağıtır (A8), içindekiler STR save | Duvar çiziminde altıgen altıgen yol; saldırıya `siege` etiketi |
