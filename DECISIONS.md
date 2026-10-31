# Kararlar

Projede alınan içerik ve kural kararlarının kaydı. En yeni karar en üstte.

## 2026-10-31 — Kural sürümü ve SRD durum düzeltmeleri (Kuyruk 16, Görev K16E)

- **Kural sürümü:** savaş durumunda `kuralSurumu` (başlangıç olayının içinde); güncel sürüm `data/kural-surumu.json` (2). Yeni savaş (arayüz, simülasyon) güncel sürümle başlar; alan yoksa 1 (eski kayıt, replay) ve eski kurallar. Sürüm 1 durumuna alan yazılmaz: eski senaryolar bit bit aynı (`KURAL_SURUMU=1` ile Çöl/Orman/Kale/Mağara HEAD ile aynı). Simülasyon `--kural-surumu N` ya da ortam değişkeni `KURAL_SURUMU` (paralel süreçlere geçer).
- **Kayıt sürümü artırılmadı:** yeni alan isteğe bağlı; eski kayıtta yokluğu sürüm 1 demek. Eski uygulama yeni kaydı açarsa alanı yok sayar ve eski kurallarla oynar (bozulma yok).
- **Prone:** saldırı zarı mesafeyle (5 ft içi avantaj, dışı dezavantaj). **Frightened:** saldırı ve yetenek kontrollerinde dezavantaj yalnızca korku kaynağı görüş hattındayken (görüş hattı: `lineOfFire`; haritasızda hep); kaynağa yaklaşan adım yasak (`moveCostFn`). Kaynağı bilinmeyen korku eskisi gibi hep geçerli. **Invisible:** inisiyatifte avantaj.
- Test değeri: `spells.test.ts` Fire Bolt gerekçe metni "Hedef yerde (uzaktan)" → "Hedef yerde (5 ft dışından)" (kip aynı, dezavantaj).
- Sürünme ve isteğe bağlı yere yatma uygulanmadı (rapor `docs/DURUM-DENETIMI.md`).

## 2026-10-31 — Yapay zekâ hedef paketi: devriye, taşıyıcı/çıkış kesme, barut fıçısı (Kuyruk 16, Görev K16D)

- **Devriye:** harita grubunda `route` (1 tabanlı noktalar) ve `pause` (tur; varsayılan `data/alarm.json` `patrolPauseRounds` 1). Rotalı habersiz grubun üyesi turunu atlamaz, yalnızca yürür (`patrolOf`; başka komut reddedilir), kendi hızıyla sıradaki noktaya (`moveToward`). Noktaya (ya da bitişiğine) varınca `patrol_moved` olayı sıradaki noktayı ve bekleme turunu yazar (yürüyüşte ya da tur bitirirken). Fark etme mevcut alarm tetikleriyle (SRD pasif Algı, görüş 60 ft); alarmlı grup rotayı bırakır, uyanık kalır (alarm geri dönmez). Rotasız habersiz grup eskisi gibi bekler.
- **Taşıyıcıyı ve çıkışı kesme:** açık "al ve çıkar" hedefinde nesneyi taşıyan kahraman, yoksa açık "ulaş"/"al ve çıkar" çıkışına en yakın (12 altıgen içinde) kahraman "koşucu" (`objectiveRunner`). Düşmanın hedef sırasında koşucu önce (`byPriority`); bu tur yürüyüp vurabiliyorsa oraya yürür; kimseyle boğuşmuyorsa koşucuya ya da çıkışa yürür (yol kapatma). Hedefsiz haritada etkisiz.
- **Barut fıçısı:** patlama ev kuralı (`barutPatlama`) açıkken, fıçının patlama yarıçapında (`OBJECT_DATA.keg.radiusHexes`) en az `kegMinFoes` (2) kahraman ve hiç müttefik (kendisi dahil) yoksa menzildeki fıçıya saldırır; hasar ve patlama mevcut nesne sisteminden.
- **Kale Baskını:** avludaki devriye grubuna 4 noktalı rota (1 tur durak). Ölçüm `docs/harita/DENGE.md` (ayar yapılmadı): 3. seviye %53/%50, 5. seviye %87/%80.

## 2026-10-31 — "Ortamlar Diyarı" test ve vitrin haritası (Kuyruk 16, Görev K16B)

- `data/maps/ortamlar-diyari.json`, 31×17. Bütün zemin türleri (`src/map/terrain.ts`'teki 31 harfin hepsi; uydurma yok) sekiz bölgede: orman (kuzeybatı, parti), bataklık/su (güneybatı), kale avlusu ve dağ geçidi (kuzey bant), kar/buz (kuzeydoğu, düşman), volkan (güneydoğu), çöl harabesi ve mağara (güney bant, düşman). Ortada 17×7 yüzey meydanı: su, buz, yağ, alev, gres (üst sıra; su+buz ve yağ+alev bitişik), sis, zehir, buhar, ağ (alt sıra); her biri 3×3. Nesneler: iki yağ fıçısı, iki barut fıçısı, kapı, kilitli kapı (DC 15).
- **Bölge boyutu:** sol ve sağ sütun bölgeleri 7×8 / 7×9; üst ve alt banttaki dört bölge 9×5 / 8×5 (≥ 40 altıgen). 17 sütunluk meydana iki sıra yüzey (7 satır) sığdırmak için bantlar 5 satır kaldı; 6×6 kare yerine alan ölçütü (≥ 36) uygulandı.
- **Harita verisinde yeni alan `surfaces`** (`kind`: yüzey türü ya da `spell`: kalıcı alan büyüsü; 1 tabanlı altıgenler). Savaş başında sahipsiz (`casterId: harita`), süresiz, konsantrasyonsuz alan olur (`presetZones`, `src/battle/create.ts`). Yalnızca bu alanı olan haritada; eski haritalar ve senaryolar bit bit aynı (Çöl/Orman/Kale/Mağara).
- **`vitrin: true`:** Game Master seçicisinde ayrı "Test ve vitrin" grubu; Klasik (12) ve Geniş (4) sayıları değişmedi. Sim senaryolarında yok (denge ölçümlerine katılmaz). Görsel `npm run harita-gorsel -- ortamlar-diyari` yer tutucusu (Gemini referansı yok, HG1 testinden muaf).
- Erişilebilirlik testi: bütün geçilebilir altıgenler parti başlangıcından ulaşılabilir; yapay zekâ savaşı 5 tohumda 7–9 turda bitirdi.
- Ek (kuyruk sonu tam testinde yakalandı): ses eşlemesi (`data/ses.json`, orman ortamı + gündüz müziği) ve canavar ortamları (`data/monster-ortamlari.json`: geniş haritalardan ya da Volkan'dan birinde olan 217 canavar vitrin haritasında da listelenir).

## 2026-10-31 — Sprite alan çizimi kalite düzeltmesi (Kuyruk 16, Görev K16A)

- **Tek katman, tür önceliği:** bütün sprite'lı alanlar `SurfaceLayer`'da (`src/ui/SpriteZone.tsx`). Her altıgen yalnızca en yüksek öncelikli türe ait (`surfaceOwners`; sıra veride `oncelik`: alev > patlama > yağ > gres > buz > su > zehir > buhar > sis > ağ); düşük öncelikli türün yaması o altıgene girmez. Motor aynı altıgende zaten tek yüzey tutuyor (yeni yüzey eskisini kaldırır); öncelik yüzey + büyü alanı (sis, ağ, zehir bulutu) bindiğinde devreye girer.
- **Taban:** önbellekli tuval (`drawBase`), yalnızca alanlar değişince yeniden çizilir (imza: alan kimliği + tür + altıgenler); PNG veri adresi olarak tek `<image>`. Sıvı/katıda (`dolgu: opak`: su, buz, yağ, gres, alev) tam opak, birleşim tek yol (dikiş yok); yağ 0,95 ve neredeyse siyah (`#1c191c`), gres opak. Sis/buhar/zehir/ağ yarı saydam (`tabanOpak`). Tuvalsiz ortamda (test) SVG çokgenleri.
- **Kenar:** sınır altıgenlerinden dışa 0,12–0,25 altıgenlik bulanık hale (en altta; komşu türün dolgusu örter); sıvı/katıda sınırın 1,5 px içinde kenar çizgisi (`kenar`: su/buz açık, yağ/gres koyu). Yama: komşusu boş zeminse ×0,82 ve 0,6 saydam; komşusu başka türse altıgen eninde (taşmaz).
- **Başarım:** önceki bulanık SVG filtresi ve maske kaldırıldı. Sis/zehir/buharın ikinci (aynalı, zıt kayan) kopyası altıgenlerin yarısında (faz < 0,5): yamalar örtüştüğü için zıt kayma her yerde görünüyor, 48×28'de 34 → 23,6 ms.
- **`sprite-ice` magenta anahtarı:** köşe rengi magentaysa yeşil hale adımının eşi çalışır: şeffafa (8 komşu) değen halkada, 4 tura dek içe doğru, magentaya yakın piksel silinir; anahtarla karışmış piksel (R ve B, G'den 10+ yüksek) içerideki magentasız komşuların ortalamasıyla boyanır (sprite'ın kendi tonu korunur). Sentetik zeytin/magenta testi: kenarda 0 magenta, 0 ton dışı piksel.
- Depodaki zehir sprite'ları eski araçla işlenmiş; magenta çizgiler sprite'ın içinde duruyor. Yeniden işleme kullanıcıda (`npm run sprite-ice`).

## 2026-10-31 — Durum denetimi: inisiyatifte Incapacitated dezavantajı (Kuyruk 17, Görev H)

- Incapacitated, Stunned, Paralyzed SRD 5.2.1 metnine karşı yeniden denetlendi (`docs/DURUM-DENETIMI.md`). Görev H'de (`ef17f1c`) eylem/tepki engeli, konsantrasyon, hız, STR/DEX otomatik başarısızlık, saldırı avantajı, 5 ft kritik ve bitiş koşulları uygulanmış ve testliydi.
- Eksik bulunan tek madde eklendi: "Surprised" — inisiyatif atılırken Incapacitated (ve onu içeren durumlar) dezavantajlı atar; Remarkable Athlete avantajıyla götürür. Durumsuz yaratıkta zar sayısı aynı; Çöl/Orman/Kale/Mağara bit bit aynı.
- "Konuşamaz" ayrıca uygulanmadı: eylemsiz yaratık zaten büyü yapamıyor (eylem, bonus eylem ve tepki yok).
- Frightened, Prone, Invisible yalnızca raporlandı (istenen buydu); sapmalar raporda, düzeltme ayrı görev.

## 2026-10-31 — E1 yeniden denetimi (Kuyruk 17)

- Görev E1 (`410cfa7`) maddeleri koda karşı denetlendi: şema (`src/content/schema.ts`), 12 SRD alt sınıfı (`data/subclasses.json`), yükleyici (Ayarlar > Dış içerik; dosya ve klasör seçici, aç/kapa, sil), sınırlar (`LIMITS`: dosya 256 KB, 20 paket, paket başına 24 alt sınıf, alt sınıf başına 30 özellik), `.gitignore` (`data/custom/`, `icerik/`), kurgusal örnek paket, "içerik eksik" davranışı ve testleri yerinde. Baştan yazılmadı.
- Bulunan kusur: `npm run check:icerik` çöküyordu (EN metinleri ayrı parçaya ayrılınca `STRINGS` dışa aktarımı kalktı). `STRINGS_TR` ile düzeltildi; betiği gerçekten çalıştıran test eklendi. Betikte ana blok yok (üst düzey çalışır), Windows `file://` kalıbı yok.
- **Kayıt sürümü artırılmadı:** dış içerik alanı kayda Görev E1'de girdi ve sürüm o zaman 16 → 17 arttı (şimdi 20; 3–20 yüklenir). Bu turda kayıt biçimi değişmedi; biçim değişmeden sürüm artırmak eski sürümle aynı dosyayı yeni numarayla yazar, kazancı yok.

## 2026-10-31 — Sprite alan doldurma, animasyon, ağırlık (Kuyruk 15, Görev K15C / SP2)

- Eşleme gerçek dosya adlarıyla (`data/sprite-esleme.json`); eksiz ad ile `-1` aynı varyant (`resolveSprite`). Varyantta isteğe bağlı `agirlik` (varsayılan 1; `yuzey-su-3` 0,3) ve `anim`; seçim sütun/satır hash'iyle ağırlıklı ve deterministik.
- Alan çizimi (`src/ui/SpriteZone.tsx`): taban = kapsanan altıgenlerin birleşimi, sprite'ın baskın renginde (`renk`, alfa ağırlıklı ortalama), bulanık kenarlı (sis/buhar/zehir yarı saydam); üstte altıgenden %50–75 büyük, örtüşen yamalar; dönüş (60° katı; alev ve yükselen buhar dik), ayna, varyant hash'ten.
- Sınır: maske yerine kenar yaması (komşusu alanda olmayan) ×0,82 boy ve 0,6 saydamlık. Bulanık birleşim maskesi denendi: animasyonla her adımda yeniden hesaplandığı için 15×7 kare süresi 17 → 71 ms (yazılım çizimi) oluyordu.
- Animasyon yalnızca CSS ve adımlı, ortak 1/6 sn tıkına hizalı (`TICK_MS`; faz tık katı): sis/zehir iki kopya zıt kayma + nefes, alev 3 varyant döngüsü (167 ms) + ölçek/parlaklık titremesi, su/buz/yağ hafif parlama, buhar-1 kayma, buhar-2 1,5 sn yükselme. Patlama tek seferlik (0,3 → 1,2, 400 ms): `surface_reacted` (söndürme hariç) ve barut fıçısının yıkılması. Motor, replay ve kayıt değişmedi.
- Başarım: geniş haritada yalnızca görünen altıgenlerin yaması çizilir; sekme gizliyken ve ayar kapalıyken durur; "hareketi azalt" kapatır. Ayar "Efekt animasyonu" (savaş menüsü, varsayılan açık, `rpg-battle-sprite-anim`).
- Betikler Windows'ta: `import.meta.url === file://…` kalıbı yasak, ana blok `pathToFileURL` ile (`src/data/scriptsWindows.test.ts`).

## 2026-10-31 — Yolculuk zinciri: yol saatleri ve hafif Mağara (Kuyruk 15, Görev K15B)

- Hedef aralık ikiye ayrıldı: Kolay %70–85, Normal %45–65 (TASARIM'ın tek aralığı zorlukları ayırmıyordu).
- Durak arası yolculuk oyun içi saat harcar (`travelHours`); "Kuzey yolu: ilk gün"de kamp → mağara 5, mağara → han 6 saat: uzun dinlenme ikinci duraktan sonra (handa) SRD 5.2.1'in 16 saat kuralıyla mümkün. Kısa dinlenme sınırı aynı (en çok 2, Kolay'da kapalı).
- Mağara durağı kendi düşman listesini taşır (`JourneyStop.enemies`, senaryonunkinin yerine): bir bugbear eksik. Sim senaryosu `magara` değişmedi.
- Ölçüm (30 tohum): yalnızca (a) Normal %43 / Kolay %53, yalnızca (b) %23 / %43, ikisi %63 / %80 → ikisi uygulandı.

## 2026-10-31 — Kale Baskını alarm sayacı 6 tur (Kuyruk 15, Görev K15A)

- Alarm sayacı {6, 7, 8} × parti yapay zekâsı gizlenmesi {kapalı, açık} matrisi 3. ve 5. seviyede, iki grupla, 30 tohum ölçüldü (`docs/harita/DENGE.md`). Hedef aralıklara en yakın: **6 tur + gizlenme açık** (3. seviye %40/%57, 5. seviye %93/%80; toplam sapma 5 puan). Uygulanan tek değişiklik `data/alarm.json` `failRounds` 8 → 6.
- Matris için veri anahtarı `aiHide` (`data/alarm.json`, açık) ve sim bayrakları `--alarm-tur N`, `--yz-gizlen acik|kapali` (yalnızca `sim:tek`) eklendi; davranış varsayılanlarla aynı.

## 2026-10-31 — Yolculuk ilk dilimi Y0 + Y1 + Y4 (Kuyruk 14)

- **Y0 — motor** (`src/journey/`): `JourneyState`, komutlar (`start`, `battle_result`, `short_rest`, `long_rest`, `advance`, `drink_potion`), olaylar ve saf `executeJourney` / `reduceJourney` / `replayJourney` (savaştaki Command → Events → reducer kalıbı; her test adımında replay aynı). Kayıt ayrı anahtar `rpg-battle-yolculuk`, `JOURNEY_VERSION` 1, yüklenebilir sürüm listesi (`src/app/journeySave.ts`); yalnızca olay günlüğü saklanır. Kurallar veride (`data/yolculuk/ayarlar.json`).
- **Y1 — doğrusal güzergâh** (`data/yolculuk/ilk-gun.json`, 5 durak: 3 savaş + 2 dinlenme yeri; TASARIM'ın MVP 4–6 durak kararı). Savaş durakları sim senaryolarını partinin seviyesindeki listeyle kullanır; savaş normal kurulum ekranıyla (Game Master yerleştirir, başlatır), sonuç `applyBattleResult` ile (normal savaştakiyle aynı) yolculuğa döner.
  - Saat sayacı: 06:00 yola çıkış, yürüyüş durak verisinden, kısa dinlenme 1 sa, uzun dinlenme 8 sa; uzun dinlenme yalnızca dinlenme yerinde ve son uzun dinlenmeden en az 16 saat sonra (SRD "24 saatte bir").
  - Kısa dinlenme sınırı ev kuralı: iki uzun dinlenme arası en çok 2 (Normal/Zor), Kolay'da sınır yok. HP zarı önerisi otomatik (HP'yi %80'e yaklaştıracak kadar).
  - Ölüm kalıcı (tapınak Y3'te; bu dilimde diriltme yok). Kolay'da düşen ya da ölen durak sonunda (ilerlerken) 1 HP ile kalkar (ev kuralı).
  - İlerleme: kilometre taşı varsayılan (`levelUp` düğümünde; MVP güzergâhında yok ki zincir ölçümü 3. seviyede kalsın), XP seçilebilir (SRD eşikleri, seviye uzun dinlenmede).
  - Ganimet yalnızca altın (XP × 0,2) ve iksir (SRD Potion of Healing 2d4+2). Süren etkiler savaş sonunda biter (savaş kaydı zaten taşımıyor; yalnızca HP/kaynak/slot/bitkinlik döner). Yüzeyler duraklar arasında taşınmaz.
  - **Karakter deposu değişmez:** yolculuk, başlangıçtaki karakter kopyalarıyla ilerler (seviye atlayan kopya sihirbazda ayrıca güncellenmez; Y2+ kararı). Yolculuk savaşında zarlar otomatik (fiziksel zar modu yolculukta yok).
  - **Bayrak:** Ayarlar → "Deneysel: Yolculuk" (`rpg-battle-deneysel`, varsayılan kapalı). Kapalıyken ana menüde giriş yok, başka hiçbir yol değişmez. Ekran tembel parça (`JourneyScreen`, ≈40 kB); ana parça 418,4 kB.
- **Y4 — zincir simülasyonu** (`src/sim/chain.ts`, `npm run sim:zincir -- 30 [--parti] [--zorluk] [--guzergah]`): aynı parti güzergâhı yolculuk motoruyla oynar; savaşlar yapay zekâyla (`playBattle`, `simulate`'ten ayrıldı; davranış aynı), aralarda kural tabanlı dinlenme ve iksir. Sonuçlar DENGE.md.
- Bulut kaydı (Y8), düğümlü güzergâh (Y2), olay/tüccar/tapınak (Y3) ve tek kişilik varyant bu dilimde yok.

## 2026-10-31 — Sprite içe aktarma aracı ve eşleme (Kuyruk 14, Görev SP1)

- **Araç** `npm run sprite-ice [klasör]` (`scripts/sprite-ice.mjs`, varsayılan `assets-ham/sprite/`): zemin rengi dört köşeden (tolerans `--tolerans`, varsayılan 70; yeşilimsi pikseller için daha geniş), kenardan doldurma + iç boşluklar (ağ delikleri; daha sıkı tolerans), şeffafa komşu yeşil hale silinir ve kalan yeşil taşma bastırılır, `--golge-sil` koyu yeşil düşme gölgesini siler, içeriğe kırpma (+2 px), en yakın komşuyla küçültme (büyütme yok), kayıpsız WebP `public/sprites/<ad>.webp`, üretilenlerin listesi `data/sprite-mevcut.json`. Ad kuralı `yuzey-<ad>[-n]`, `nesne-<ad>`; uymayan atlanır. Boyut ve oran sorunlarında uyarır, düzeltmez. Hedef: yüzey 128 px, nesne 96 px (`docs/sprite-boyutlari.md`).
- **Eşleme** `data/sprite-esleme.json`: yüzey `surface:<tür>`, büyü alanı `spells:<kimlik>` (sis = Fog Cloud, ağ = Web, gres = Grease ve kaygan yüzey), nesne türü → varyant listesi, opaklık, ölçek. Patlama tek seferlik efekt olarak eşlemede; çizimi sonraki görev (Karar bekleyenler).
- **Çizim:** sprite yalnızca `data/sprite-mevcut.json`'da varsa; altıgen başına varyant sütun/satır hash'iyle; yamalar altıgen eninin ×1,15–1,2'si (komşularla birleşir); `image-rendering: pixelated`. Yoksa eski yer tutucu, görüntü aynı. Eşleme yalnızca savaş ekranı parçasında (ana parça değişmedi).
- **Deneme:** kodla üretilmiş sentetik PNG/JPG'ler (yeşil ve soluk yeşil zemin, delikli ağ, koyu yeşil gölge, hatalı ad): köşeler ve ağ deliği şeffaf, gölge silindi, yeşil piksel kalmadı, hatalı ad atlandı. Ekran görüntüsü sentetik sprite'larla (`docs/sabah/sp1-sprite.png`); sentetik dosyalar depoya girmedi.

## 2026-10-31 — Kale Baskını dengesi, yapay zekâ gizlenmesi ve kapı açma (Kuyruk 14, Görev K14A)

- **Alarm sayacı** 6 → 8 tur, veride (`data/alarm.json` `failRounds`; hedefteki `alarm` başarısızlığı `rounds` vermezse bu kullanılır). Kale Baskını haritası artık sayıyı yazmıyor.
- **Gizlenme ve yürüme (SRD 5.2.1 Hide):** SRD'de gizlenme ses, saldırı zarı, sözlü büyü ya da "bir düşman bulursa" biter; yürümek bitirmez. Motor eskiden yürüyeni hep ortaya çıkarıyordu (Görev K basitleştirmesi). Eski senaryoları bozmamak için yalnızca uyuyan/habersiz grup olan haritalarda SRD'ye geçildi: gizli yürüyen, ancak uyanık bir düşman görüş hattından pasif Algısıyla (≥ gizlenme DC'si) bulursa ortaya çıkar; habersiz/uyuyan gözcülerin fark etmesi alarm yolundan. Diğer haritalarda eski kural (Karar bekleyenlerde: her yerde SRD'ye geçilsin mi?).
- **Parti yapay zekâsı:** açık sızma hedefi ve uyuyan/habersiz grup varken, gözcü (görüş 60 ft + kendi hızı) yakındaysa gizlenme yerinde Gizlen (Rogue bonus eylemle); gizlenemiyorsa fark edilmeyen bir gizlenme yerine yürür. Gizliyken hedefe gözcülerin fark etmeyeceği altıgenlerden ilerler; öyle yer yoksa yine de ilerler. İnsan oyuncuyu etkilemez.
- **Düşman yapay zekâsı:** bitişikteki kapalı (kilitsiz) kapı en yakın kahramana kendisinden daha yakınsa serbest etkileşimle açar; kilitliyi açmaz, kırmaz. Yalnızca nesneli haritalarda.
- **Ölçüm:** 3. seviye %60/%73 (beklenen %35–55), 5. seviye %93/%90 (beklenen %70–90); ayar yapılmadı, öneri DENGE.md'de.

## 2026-10-31 — Eğitimsiz zırhta büyü: uyarı ve takılma (Kuyruk 14, Görev B1)

- **Kural değişmedi** (SRD 5.2.1 Armor Training, doğrulandı): eğitimsiz Light/Medium/Heavy zırhta STR/DEX d20 testleri dezavantajlı ve büyü yapılamaz; eğitimsiz kalkan yalnızca AC bonusunu vermez. Bu yüzden kalkan uyarısı kullanıcının önerdiği metinden farklı ve SRD'ye göre: "kalkanın AC bonusunu alamazsın".
- **Takılmanın nedeni:** büyü menüsü engeli bilmiyordu; Flaming Sphere çağırma kipine giriyor, motor her altıgeni reddettiği için "Menzilde boş yer yok" çıkıyordu ve kipten çıkış yalnızca üstteki ✕ ile oluyordu.
- **Düzeltme:** engel tek yerde (`src/battle/castBarrier.ts` `castBarrierKind`: eğitimsiz zırh, Silence). Büyü menüsünde engellenen büyü gri ve tek satır neden; hedef/yer seçimine girilmez. Çağırma panelinde "boş yer yok" yalnızca engel yokken. Esc, harita üstünde geçersiz altıgene dokunma ve panellerdeki "Vazgeç" düğmesi her seçim kipinden çıkarır.
- **Tutarsızlık bulundu:** kurulumdaki ritüel (Find Familiar) eğitimsiz zırh engelini atlıyordu; artık aynı denetim. Eşya/tılsım ile büyü yolu oyunda yok (iksirler büyü değil).
- **Oluşturucu:** eğitimsiz zırh ya da kalkan seçilince kuşanmadan önce uyarı ve "Yine de kuşan / Vazgeç" (engel yok). Savaşta karakter kartında "⚠ Eğitimsiz zırh" rozeti.

## 2026-10-31 — Kale Baskını, sefer haritası 1 (Görev KB)

- **Harita** `data/maps/kale-baskini.json` (31×17), Kale ve avlu türevi; Klasik `kale` ve H2 `kale-avlu` değişmedi. Batıda orman kenarı (ağaç ve çalı saklanma yerleri), hendek ve açık dış kapı, avluda kuyu (çevresi sığ su: yıldırım/buhar/donma için su), iç binanın kuzeybatı odası koğuş, güneybatı odası mahzen (3 yağ fıçısı, 1 barut fıçısı), kuzeydoğu kulesi (yükseklik 2) hedef, güneydoğu kulesinde gözcü.
- **İç kapı:** SRD Large dayanıklı demir nesne (AC 19, HP 27; yeni nesne türü `gate`, kapı kurallarıyla). Binanın güney duvarında, mahzene açılır; dış kapının hizasında değil (orman kenarından görünmez, test). İlk taslakta iç kapı dış kapıyla aynı hizadaydı ve okçular ormandan 2 turda kırıyordu.
- **Nesneye saldırıda görüş hattı** (`sightBlockedBetween`) eklendi: duvar ya da kapalı kapı arkasındaki nesneye saldırılmaz (S2 açığı).
- **Hedef:** any(iç kapıyı kır, kuzeydoğu kulesine çık); başarısızlık: alarmdan 6 tur sonra. **Sefer bayrağı:** `barutPatlama`, `alarmKosusu` (yalnızca bu harita).
- **Gruplar:** koğuş (uyuyor, 9 altıgen), devriye (habersiz, avluda), kule (habersiz, güneydoğu kulesi); devriye koğuşa ve kuleye, kule koğuşa haber verir (ev kuralı açık). Devriye yürümez (S4 kararı).
- **Karşılaşmalar** (genel adlı SRD canavarları; 5 kişilik parti bütçesi, SRD 5.2.1 XP): 
  - Hobgoblin kalesi: 3. seviye 4 hobgoblin warrior, 2 guard, 2 bugbear warrior, 1 spy, 1 hobgoblin captain = 1750 XP (orta 1125 – yüksek 2000); 5. seviye 4 hobgoblin warrior, 2 bugbear warrior, 2 warrior veteran, 2 hobgoblin captain = 3600 XP (orta 3750'nin altı).
  - İnsan muhafızlar: 3. seviye 6 guard, 2 spy, 1 priest acolyte, 1 guard captain = 1700 XP; 5. seviye 6 guard, 2 warrior veteran, 1 priest, 1 guard captain = 3100 XP.
  - 1. seviye listeleri de var (test kuralı). Scout kale ortamında olmadığı için spy kullanıldı.
- **Başlangıç sırası:** düşmanlar `preferred` sırasıyla koğuşa (6), devriyeye (2), kuleye (2) düşer; Game Master kurulumda değiştirir.
- **Görsel:** HG1 süreci: yer tutucu `public/maps/harita-kale-baskini.webp`, referans paketi `docs/harita/referans/kale-baskini*.png` + `-prompt.md` (`data/harita-referans.json`).

## 2026-10-31 — Uyuyan gruplar ve alarm (Görev S4)

- **Model:** grup alanı harita verisinde (`groups[]`: kimlik, durum asleep/calm/alarmed, 1 tabanlı altıgenler, komşular). Savaş başında alanda duran düşmanlar grubun üyesi olur (`groups_formed`); Game Master kurulumda yerleşimle üyeliği belirler. Uyuyan üye mevcut `asleep` (turu atlanır, yakın dövüş avantajlı), habersiz üye `unaware` (turu atlanır, jetonda "?").
- **Kazanma:** uyuyan grup üyesi ayakta sayılır (uyanabilir); uyuyan ejderha kuralı (ayakta sayılmaz) değişmedi.
- **Tetikler** (her komutun sonunda, `alarmEvents`): üyenin HP'si düşerse; gürültü kaynağı yarıçap içindeyse (gök gürültüsü hasarı 100 ft, kırılan kapı 60 ft, barut patlaması 120 ft — SRD'de sayı yok, `data/alarm.json`); pasif Algı: habersiz üye 60 ft içinde görüş çizgisindeki gizlenmemiş kahramanı fark eder, gizlenmişi pasif Algı ≥ gizlenme DC'siyle; uyuyan üye yalnızca 10 ft içinden ve pasif Algı −5 ile (gizlenmemişe karşı eşik 10). Zarsız (pasif değerler), replay'de aynı.
- **Sıraya girme:** alarmlanan grubun üyeleri inisiyatifi dezavantajla atar (SRD 5.2.1 Surprise) ve sıraya inisiyatiflerine göre girer; sırası gelen değişmez (sıranın gerisine düşen bu tur, önüne düşen gelecek tur oynar). `alarmRound` S3'ün `alarm` başarısızlığını besler.
- **Komşuya haber:** yalnızca ev kuralı `alarmKosusu` açıkken (sefer bayrağı ya da Game Master), alarmdan `linkDelayRounds` (1) tur sonra tur başında. Kapalıyken bağlantılar etkisiz.
- **Devriye:** habersiz grup yerinde durur (devriye yürüyüşü yok; Karar bekleyenlerde).
- **Yapay zekâ:** uyuyan/habersiz düşmanın turu atlanır. Parti, açık bir sızma hedefi (ulaş, yok et, al ve çıkar) varken habersiz düşmana saldırmaz ve hedefe yürür; uyuyanlara zaten saldırmaz (eski kural).
- **Simülasyon:** `--alarm hemen` (bütün gruplar baştan alarmda) ve `--alarm yok` (tetikler kapalı; `alarmEnabled: false`); yalnızca `sim:tek`. İki uç ilk grup kullanan haritada (Kale Baskını, Görev KB) ölçülür; S4'te grup kullanan harita yok.
- **Arayüz:** Game Master kurulumunda `GroupsPanel` (durum ve komşular), savaş ekranında kurulumda grup alanları (ad + durum), savaşta uyuyan/habersiz grupların alanı ve ≡ menüsünde "grubunu alarmla" (`alarm_group`). Ekran görüntüsü grup verisi olan ilk haritayla (KB) alınır.
- **Hızlı regresyon:** Çöl, Orman, Volkan uyuyan ejderha (seviye 3, 30 tohum) S4 öncesiyle bit bit aynı.

## 2026-10-31 — Hedef sistemi (Görev S3)

- **Model:** `state.goals` (`Goals`: `mode` all/any, `list`, `fail`, kilitli `status`). Türler: `defeat` (bütün ya da seçili düşmanlar), `reach` (bir kahraman ya da herkes, `who`), `protect` (masumlar, kimlikler ya da nesne; `rounds` varsa o tura dek), `destroy` (S2 nesnesi), `survive` (N tur), `retrieve` (taşınabilir nesneyi al ve çıkış altıgenine götür). Başarısızlık: `rounds`, `civilians`, `object`, `down`, `alarm` (S4'ün `alarmRound`u + N tur).
- **Değerlendirme:** her komutun sonunda (`execute`): anlık başarılar (ulaşma, çıkış, yıkım, dayanma) ve kalıcı başarısızlıklar `goal_changed` ile kilitlenir; `defeat` ve tur sınırsız `protect` anlık hesaplanır. `winnerOf` önce hedeflere bakar; düşmanların hepsi düşünce yine parti, parti düşünce düşman kazanır (açık hedef kalsa da; Game Master hikâyede işler).
- **all modunda tur sınırsız protect** engel değildir: korunanlar ayakta kaldıkça sağlanmış sayılır; en az bir hedefin gerçekten bitmesi gerekir.
- **Taşıma:** `object_use` `take` (serbest nesne etkileşimi; yalnızca `carryable`, şimdilik sandık); taşınan nesne haritada yer kaplamaz; taşıyıcı düşer ya da kaybolursa nesne onun altıgenine düşer.
- **Geriye uyum:** `state.goals` yoksa hiçbir yol değişmez; eski `objective` (masumlar, sıkı kural) aynen. Taverna, Taverna arka, Kale, Mağara (seviye 3, 30 tohum) S3 öncesiyle bit bit aynı.
- **Yapay zekâ:** parti tarafında açık hedefler sırayla: al ve çıkar (nesneye en yakın üye alır, taşıyan çıkışa yürür), ulaş (bu tur ulaşabiliyorsa; `who: all`ta boğuşmuyorsa yaklaşır), yok et (vurabiliyorsa vurur, değilse boğuşmuyorsa yanına yürür). Düşman tarafında hedef davranışı yok; masumlara yönelme eskisi gibi. Taşıyıcıyı ya da çıkışı kesme düşman davranışı Karar bekleyenlerde.
- **Arayüz:** üst solda hedef şeridi (✓/✗/•, birleşim, başarısızlık koşulları), hedef altıgenlerinde mavi hüzme (`beam-goal`; jeton hüzmesi önceliğine girmez), sonuç ekranında hedef sonuçları, günlükte `goal_changed`. Game Master kurulumunda `GoalsPanel` (`src/ui/gm/GoalsPanel.tsx`): hedef ekle/kaldır, birleşim, başarısızlık, hazırlar (haritanın hedefleri, yalnızca yen, kaç: doğu kenarı, 5 tur dayan); harita JSON'unda `goals` (1 tabanlı altıgenler, nesne kimlikleri `objects[].id` ya da `tür:sıra`).

## 2026-10-31 — Nesne katmanı (Görev S2)

- **Model:** `map.objects` (`MapObject`: tür, altıgen, HP, durum, kilit DC). Veri `data/nesneler.json`; olaylar `object_placed/removed/damaged/destroyed/changed` (replay ve zar defteriyle uyumlu). Nesne altıgenin etkin zeminini değiştirir (`withObject` → `terrainAt`): hareket, örtü ve görüş kesme tek yerden; böylece siper, görüş, yol bulma ve yapay zekâ ayrıca kod gerektirmez.
- **SRD değerleri:** AC tahta 15, demir 19; HP Small dayanıklı 10, Medium dayanıklı 18 (SRD "Objects"). Zehir ve psişik hasara bağışık.
- **Nesneler:**
  - Yağ fıçısı: kırılınca 3 altıgen yağ (`oilSpill`); ateş hasarı alınca anında yıkılıp alev olur (basitleştirme: HP beklemeden tutuşur).
  - Barut fıçısı (ev kuralı `barutPatlama`, yalnızca sefer haritası bayrağıyla ya da Game Master açarsa): SRD tuzak ölçeğinden "Collapsing Roof" (Deadly, 1–4. seviye) değeri alındı: **DEX DC 13, 2d10 ateş, başarıda yarı, 10 ft (2 altıgen)**. Patlama alandaki yağı tutuşturur, diğer nesnelere hasar verir (zincir derinliği ≤ 3). Bayrak kapalıyken yalnızca kırılır.
  - Sandık (zorlu zemin, yarım örtü), masa (zorlu zemin; devrilince yarım örtü), mangal (geçilmez, yarım örtü; dökülünce bitişik altıgende alev, oradaki yağı tutuşturur).
  - Kapı: kale kapısı kuralının genellemesi. Aç/kapa serbest (SRD "bir nesneyle etkileşim" turda bir; hareket ekonomisinde ayrı sayaç tutulmadı), kilit açma eylem: DEX (Sleight of Hand) DC 15 (`lockDc`); kapalı ya da kilitli kapı geçilmez ve görüşü keser; kırılınca kalkar.
- **Alan hasarı:** alan büyüleri ve canavar alan saldırıları alandaki nesnelere de işler (`objectAreaEvents`, `execute` sonrası, yüzey tepkimesinden sonra). Nesnelere save yok (SRD: nesneler save'de başarısız sayılır, burada tam hasar).
- **Yapay zekâ:** nesneyi siper ve engel olarak zeminden görür; patlayabilen fıçının 2 altıgen yakını `objectRisk` (bayrak kapalıyken 0). Yapay zekâ nesneye saldırmaz (S3 `destroy` hedefiyle gelecek).
- **Arayüz:** Game Master "Nesne yerleştir" aracı (`src/ui/gm/ObjectTool.tsx`; savaşta ve yerleştirme aşamasında: haritanın hazır nesneleri burada görülür, değiştirilir, kaldırılır). Oyuncu: saldırı kipinde nesneye dokunmak `attack_object`; "Nesne" eylemi bitişik kapı/masa/mangal için varsayılan işlem (`src/ui/gm/objectActions.ts`). Harita verisinde `objects` (1 tabanlı) hazır yerleşim.
- **Eksik sprite'lar** (yer tutucu: renkli altıgen + emoji): yağ fıçısı, barut fıçısı, sandık, masa (dik/devrik), kapı (açık/kapalı/kilitli), mangal (yanan/devrik), kırılma/patlama efekti.
- **Hızlı regresyon:** Klasik haritalarda nesne yok; Çöl, Mağara, Orman (seviye 3, standart, 50 tohum) S2 öncesiyle birebir aynı.

## 2026-10-31 — Yüzey düzeltmeleri ve ev kuralı bayrakları (Görev K13B)

- **Yapay zekâ buhar farkındalığı:**
  - Suda duran hedefe ateş büyüsünün puanı yarıya iner (`aiSteamPenalty` 0,5, `data/yuzeyler.json`). Büyü hedefi öldürecekse ceza yok; tek seçenekse yine atılır.
  - Alan büyüsü buhar bırakacaksa (motor denemesinde `steam` tepkimesi) en az 3 düşman gerekir; buharsız alanda 2.
  - Ölçüm aşağıda; ayar yapılmadı.
- **Stinking Cloud = zehir bulutu yüzeyi:**
  - Büyü verisinde `zone.surface: "poison"`; alan `surface: 'poison'` taşır.
  - Kural yüzey verisinden gelir; SRD ile aynı: yoğun örtü, tur başı CON ya da Poisoned + eylem/bonus eylem yok. DC büyücüden, konsantrasyon büyüden.
  - Patlama, yapay zekâ riski ve bilgi baloncuğu yüzey yolundan çalışır.
- **Ev kuralı bayrakları** (`data/ev-kurallari.json`, `houseRule`):
  - Varsayılan açık: suYildirim, buhar, donma, erime, zehirPatlama.
  - Sefer kuralları (barutPatlama, alarmKosusu, lair, asitHavuzu) varsayılan kapalı; yalnızca haritanın `seferKurallari` alanıyla ya da Game Master açarsa çalışır. yuksekAvantaj da kapalı.
  - Game Master kurulumunda tek liste (`HouseRulesPanel`); harita değişince liste haritanın varsayılanına döner.
  - Tutuşma, yanan ağ ve söndürme SRD olduğundan bayraksız.
  - Y1 davranışı değişmedi: bayraklar açıkken sonuçlar aynı.
- **Yeni yüzey "kaygan"** (Game Master aracı için): Grease kuralı (yanmaz, zorlu zemin, giren ya da turunu bitiren DEX ya da Prone, DC 10).
- **Game Master "Yüzey yerleştir"** (savaş ekranı, ≡ menüsü; `src/ui/gm/SurfaceTool.tsx`):
  - Tür seçilir, dokunulan altıgene `place_surface` gider; "Kaldır" o altıgendeki yüzeyleri siler.
  - Zar istemez; olay tabanlı ve replay uyumlu.
  - Kısa ekranda tek satır, yatay kaydırılır.
  - Günlükte kaynak "Game Master" yazar.

## 2026-10-31 — J0/S0 kararları güncellendi (Görev K13A; Z3'ün Claude kararlarının yerine)

- **S0** (`docs/harita/SEFER-TASARIMI.md` "Kararlar"):
  - Ev kuralları veride ayrı bayrak, Game Master kurulumunda tek liste.
  - Su yıldırımı yayar (≤ 7) ve ateş+su / soğuk+su / ateş+buz tepkimeleri açık, her biri ayrı bayrak.
  - Islak zayıflığı ve alev yayılması kapalı.
  - Asit havuzu yalnızca harita nesnesi (ev kuralı).
  - Yağ fıçısı SRD'ye uygun (kırılınca yağ). Barut fıçısı ayrı nesne, patlaması ev kuralı ve yalnızca sefer haritalarında.
  - Yükseklik yalnızca yarım örtü; avantaj ev kuralı kapalı.
  - Lair olayları ev kuralı, yalnızca Ejder Yuvası bayrağıyla. Alarm koşusu eklenir, sefer haritası bayrağıyla.
  - Kuşatma ilk sürümde yok; yüzeyler durağa taşınmaz.
  - Yeni ev kuralları varsayılan kapalı; Klasik haritalar ve mevcut senaryolar etkilenmez.
  - "İlk dilim" düzeltildi: Kale Baskını için S1+S2+S3+S4.
  - "Gece B" yalnızca ışık/gece görseli; boss/efsanevi eylem/A6 "Boss paketi".
- **J0** (`docs/yolculuk/TASARIM.md` "Kararlar"):
  - Kilometre taşı varsayılan (XP ayarla); süren etkiler savaş sonunda düşer (ev kuralı).
  - Saat sayacı kalır. "İki uzun dinlenme arası en çok 2 kısa dinlenme" ev kuralı Normal/Zor'da açık, Kolay'da kapalı.
  - Ölüm kalıcı, tapınakta diriltme; Kolay'da 1 HP ile kalkma.
  - Zincir hedefi %70–85; ilk sürüm 4–6 durak.
  - Bulut kaydı Y8 (hesap sisteminden sonra); ganimet altın + iksir.
  - Tek oyunculu (Game Master'sız) varyant MVP dışı.

## 2026-10-31 — Yüzey sistemi çekirdeği (Görev Y1)

- **Model:** yüzeyler büyü alanlarıyla aynı katmanda (`map.zones`, `SpellZone.surface`, `spellId = surface:<tür>`); kuralları `data/yuzeyler.json` (ZoneSpec biçimi: tetik, save, hasar, durum, zorlu zemin, örtü). Böylece girme, tur başı/sonu tetikleri, zorlu zemin, yoğun örtü ve görünüm `zones.ts` yolundan çalışır; yeni bir sistem kurulmadı. Türler:
  - yağ: SRD Oil; etkisi yok, tutuşur.
  - su: ev kuralı; zemin suyu (`n`, `w`) da su sayılır.
  - buz: ev kuralı; zorlu zemin, girişte DEX DC 10 ya da Prone.
  - alev: SRD yanan yağ; giren ya da turunu bitiren 5 ateş, turda bir, 2 tur.
  - yanan ağ: SRD Web; tur başı 2d4 ateş, 1 tur.
  - buhar: ev kuralı; 1 tur yoğun örtü.
  - zehir bulutu: Stinking Cloud kuralı, DC 13.
- **Tepkimeler** (her komutun sonunda, o komutun ateş/soğuk/yıldırım hasar olaylarından; `src/battle/surfaces.ts`):
  - yağ + ateş → bütün birikinti alev;
  - ağ + ateş → değen altıgenler yanan ağ (SRD);
  - buz + ateş → su;
  - su + ateş → buhar;
  - zehir bulutu (yüzey ya da Stinking Cloud) + ateş → patlama (bulutta herkese DEX save, 2d6 ateş, yarıya) ve bulut kalkar;
  - su + soğuk → buz (su yüzeyi ve sığ su; derin su donmaz);
  - su + yıldırım → bağlı su altıgenlerinde (≤ 7) zaten vurulmamış yerdeki yaratıklar aynı hasarla DEX save;
  - Sleet Storm alevleri söndürür (SRD "exposed flames … doused").
- **Tepkimeye giren kaynaklar:** alan büyüsü (`spell_cast.area`), alanlı saldırı ve nefes (`area_used`, artık hasar türü/DC/zar taşır), isabet eden ateş/soğuk/yıldırım saldırısının hedef altıgeni. Iskalayan saldırı tepkime yapmaz (Fire Bolt SRD: "hit by this spell").
- **Tepkime derinliği 1:** tepkimenin ürettiği hasar ya da yüzey aynı komutta yeniden tepkimeye girmez. Sıra olay sırası; aynı olayda söndürme → tutuşma → ağ → erime → buhar → patlama.
- **Zar ve replay:** zarlar rng'den (`rollTag`), elle zar modunda istenir; sonuçlar olaylarda (`surface_reacted` günlük olayı + `zone_*` + `save_resolved`), replay aynı durumu verir. `SAVE_VERSION` 20 kaldı: yalnızca yeni olay türü ve isteğe bağlı alanlar eklendi (önceki A1–A5 kalıbı).
- **Bayrak** `yuzeyEtkilesimi`: varsayılan açık; `false` tepkimeleri kapatır, yüzeylerin kendi kuralları sürer. `startBattle` seçeneği ve simülasyonda `--yuzey-kapali`.
- **Yapay zekâ:** yüzey riski `risk()`e eklendi: alev, yanan ağ ve zehir bulutu 20, buz 6, yağ 4. Risk 50'nin altında; yakınlık kazancı yeterliyse yapay zekâ yine girer. Uçan yaratık zemin yüzeylerinden etkilenmez. Yapay zekâ yüzey yaratmayı ve itmeyle tehlikeye sokmayı henüz bilerek seçmiyor (Z3 kararı izin veriyor; sonraki adım).
- **SRD'ye uyum ve sapmalar:**
  - Grease SRD'de "Nonflammable"; yağ değil, tutuşmaz, kaygan alan olarak kalır. Görev metni Grease'i yüzey kaynağı sayıyordu; SRD uygulandı.
  - Yağ ve zehir bulutunun mevcut büyülerde kaynağı yok. Game Master komutu `place_surface` ile yerleştirilir (arayüzde düğme yok, yalnızca motor ve kayıt).
  - Ice Storm ve Wall of Fire oyunda yok (4. seviye); yeni büyü eklenmedi.
  - Lightning Bolt verisinde hasar türü eksikti (türsüz hasar); SRD'ye göre `lightning` eklendi. Bu yüzden yıldırım direnci/bağışıklığı artık uygulanıyor; regresyon farkının bir kısmı bundan.
  - Gust of Wind bulutları dağıtmıyor (S0'da vardı; sonraki adım). Alanın kendisine değen ateş, buluttaki yaratık hasar almasa da patlatır.
  - Ağ yanınca ağın Restrained etkisi kalan altıgenlerde sürer; yanan altıgendeki yaratığın tutulması bitmez (sadeleştirme).

## 2026-10-31 — Yolculuk (J0) ve sefer (S0) kararları; dış alt sınıf paketi (Görev Z3)

- **Yolculuk** (`docs/yolculuk/TASARIM.md` "Kararlar"):
  - İlerleme kilometre taşı (seviye belirli düğümlerde).
  - Ölüm seçilebilir: varsayılan SRD gibi kalıcı (geri getirme büyüsüyle); "kolay mod" ev kuralıyla düşenler dinlenme düğümünde kalkar.
  - Dinlenme yalnızca dinlenme düğümlerinde, düğüm başına bir kısa ya da bir uzun; rota başına sınırlı düğüm.
  - Kayıt MVP'de yalnızca yerel; bulut çevrimiçi odalarla.
  - MVP hazır şablon rota; tek oyunculu varyant ve eşya/ödül sistemi MVP dışı.
  - Claude kararları: savaş sonunda süren etkiler düşer (ev kuralı); şablon 6–8 durak; zincir dengesi hedefi %70–85.
- **Sefer** (`docs/harita/SEFER-TASARIMI.md` "Kararlar"):
  - Islak zayıflığı kapalı.
  - Su yıldırımı yayar (7 altıgen), buhar/donma/erime açık (ev kuralları).
  - Lair olayları ev kuralı, yalnızca sefer haritaları/boss'larda, etiketli.
  - Yüzey hasarı zar modunu izler.
  - Yapay zekâ tehlikeli yüzeyden kaçınır, kazanç yeterliyse girer, itme/zorlamayı bilerek kullanabilir.
  - Y1'in eklediği zehir bulutu + ateş = patlama (ev kuralı).
  - Claude kararları: alev yayılması, fıçı patlaması, alarm koşusu, kuşatma yok; asit havuzu yalnızca harita nesnesi; yükseklik yalnızca örtü; yüzeyler durağa taşınmaz.
- **Dış alt sınıf paketi:** SRD dışı 97 alt sınıf varsayılan pakete GİRMEZ. Depoda ve oyunda yalnızca SRD alt sınıfları var; kullanıcı kendi verisini yalnızca dış içerik yükleyicisiyle (Ayarlar → Dış içerik, Görev E1) yükler. Bu içerik depoya girmez (`icerik/`, `data/custom/` gitignore).

## 2026-10-31 — Powerful Build, Thirsting Blade, Cutting Words (Görev Z2)

- **Powerful Build** (SRD 5.2.1 Goliath: "count as one size larger when determining your carrying capacity"): taşıma kapasitesi SRD tablosundaki boyut çarpanıyla (Small/Medium ×1, Large ×2, Huge ×4, Gargantuan ×8, Tiny ×0,5; `data/tasima.json` `sizeCarry`); Goliath Medium → Large, kapasite Güç × 30. Sürükleme/kaldırma/itme sınırı taşımanın iki katı (`dragLimit`; şimdilik yalnızca hesapta, arayüzde gösterilmiyor). Kademeli kuralın (2014 isteğe bağlı) eşikleri de aynı çarpanla ölçeklenir. Hangi türün "bir boy büyük" sayıldığı `sizeUp` (tür → SRD özellik kimliği); test SRD tür metnini tarayıp listeyle karşılaştırır. Boyutla ilgili ev kuralı yok; Powerful Build'in Grappled'dan kurtulma avantajı bu görevde yok (oyuncunun yakalama eylemi zaten yok).
- **Thirsting Blade:** zaten K13'te (79768fe) SRD'ye göre: Extra Attack yalnızca pact silahıyla; Attack eylemi başka silahla başlarsa tek saldırı, pact silahıyla başlayıp başka silaha geçmek reddedilir (`economy.pactOnly`). `warlock.test` bunu sınıyor; kod değişmedi.
- **Cutting Words zamanlaması:** SRD 5.2.1 metni iki ayrı tetik verir: yaratık **hasar zarı attığında** ya da **saldırı/yetenek zarında başarılı olduğunda**; tepkiyle Bardic Inspiration zarı atılır ve o zardan düşülür. Yani Bard zarı atmadan önce hangi atışa uygulayacağına karar verir. Eskiden zar atılıp sonuca göre en yararlısı (isabeti çevirebiliyorsa saldırıdan, yoksa hasardan) seçiliyordu; bu SRD'den cömertti. Artık tepki seçeneğinde iki seçim var ("saldırı zarından düş" / "hasardan düş"), zar seçimden sonra atılır. Saldırı zarına uygulanan zar isabeti çeviremezse hasar azalmaz. Kritik isabette yalnızca hasar seçeneği var (doğal 20 hep isabet). Bizim motorda saldırı zarı ve hasar aynı adımda atıldığından istemde hasar da görünür; SRD'de hasar tetiğinde Bard hasar zarını görür, saldırı tetiğinde görmez. Bu bilgi farkı kabul edildi. Yapay zekâ önerisi: isabeti çevirme olasılığı ≥ %50 ya da hasar ağırsa kullan; uygulama yeri beklenen önlenen hasara göre (olasılık × hasar ve ortalama zar).

## 2026-10-31 — Renk kararları uygulandı, renk işi kapandı (Görev Z1)

- Kullanıcı kararları; bundan sonra renk işi yapılmaz:
  - `elf.drowPalet` ve `paletler.drow.varsayilan` = **D** (gece-mavi). A–C veride seçilebilir kalır; geçersiz anahtar artık D'ye düşer.
  - **Erkek Dragonborn White** eski K8b yöntemine döndü (maskesiz HSL `{ h: 200, s: 0.03, l: 1.45 }`, commit 4e92373 öncesi değer): `byGender.male.lineages` içine tek satır. Diğer erkek soyları ve kadınlar değişmedi. ΔE ≥ 15 ve soy çifti testleri geçiyor. Eski yol maskesiz olduğundan beyazlık kıyafete de yansır (K8b'deki gibi; bilerek).
  - Drow Barbarian, Goliath Barbarian ve Dragonborn'daki maske taşmalarına dokunulmadı.
- **Goliath kafa görselleri:** kafa görselinin opak boyutu kafa kutusuyla her iki eksende ±2 px içinde eşleşirse ölçeklenmez (×1, en yakın komşu da yok; `headScale`, `src/ui/headOverlay.ts`; tolerans `data/soy-renkleri.json` `basOlcekToleransPx`). Eşleşmezse eski ölçekleme ve uyarı (`±2 px dışında`). Mevcut 1× görseller yerinde (×1,93–2,1 ölçekleniyor); kullanıcı yeniden çizince `npm run soy-maske` (soy-bas'ı da çalıştırır) yeterli.
- Ekran görüntüsü `docs/sabah/z1-renk.png` (Drow D 12 sınıf × iki cinsiyet; erkek Dragonborn White 6 sınıf + orijinaller).

## 2026-10-31 — Geniş harita görsel şartnamesi ve referanslar (Görev HG1)

- Kullanıcı görselleri Gemini ile kendisi üretecek. Şartname `docs/harita/gorsel-sartnamesi.md`: hedef boyut savaş ekranının dünya boyutu (31×17 → 2616×1668, 21×11 → 1781×1096; formül `artSize`, `src/map/mapArt.ts`, `worldOf` ile aynı), flat-top odd-q hizası, kenar boşluğu yok, görselde ızgara çizgisi yok (oyun çizer), stil Klasik görseller.
- Görsel savaşta dünya boyutuna gerildiği için doğrulamanın ölçütü en-boy oranı: fark ≤ %0,5 sessiz, %0,5–3 uyarı (kenarda kaç px kayacağı), > %3 hata ve dosya yazılmaz (`--zorla`). Çözünürlük yalnızca uyarı (< 0,75× bulanık, > 3× küçültülür); çıktı her zaman tam hedef boyutta WebP (kalite 82), > 1024 kB uyarı. Sınırlar `data/harita-referans.json` `tolerance`.
- İçe aktarma ayrı komut değil, mevcut `npm run harita-gorsel`: `assets-ham/harita/<ad>.(png|jpg|jpeg|webp)` varsa onu kullanır, yoksa yer tutucu üretir (`--yer-tutucu` zorlar). Dosya adı ve veri satırı değişmez (varyantın `image` yolu); kullanıcı yalnızca dosyayı koyup komutu çalıştırır.
- Referanslar `npm run harita-referans` ile veriden (`data/harita-referans.json`: zemin harfi → belirgin renk, TR/EN ad, İngilizce çizim tarifi; harita → tema, ışık, stil örneği): ızgaralı (kontrol için), ızgarasız düz renk (Gemini'ye yerleşim; ızgara dışı köşeler kenardaki zemin renginde ki görsel kenardan kenara dolsun) ve prompt dosyası. Prompt İngilizce (görsel modeller İngilizce talimata daha sadık), açıklamalar Türkçe. Yeni geniş harita eklenince test referans dosyalarını ister.
- Yer tutucu görseller yerinde kaldı. Yer tutucu yeniden üretildiğinde dosya birebir aynı çıkmıyor (kayıplı WebP; piksel farkı en çok 18/255, gözle aynı); bu yüzden içe aktarma denemesinden sonra commit'li dosya geri kondu.

## 2026-10-31 — Mini harita sürükleme (Görev M2)

- Mini haritadaki görünür pencere dikdörtgeninden başlayan işaretçi (fare, dokunma, kalem) pencereyi sürükler: dikdörtgen tutulduğu noktayla birlikte kayar, kamera dünya sınırında durur, yakınlaştırma değişmez (`dragViewTo`, `inView`, `src/ui/camera.ts`). Dikdörtgen dışına tek dokunuş eskisi gibi oraya gider. Sürükleme kameraya "elle" yazar: o tur otomatik takip durur; "Tümünü göster" açıksa kapanır. "Tümünü göster" açıkken pencere bütün haritayı kapladığından sürükleme başlamaz, dokunuş oraya gider.
- Çakışma yok: mini harita HUD içinde, ana haritanın kaydırma/seçme jestleri onu zaten atlıyor (`skip`); mini harita olayları ayrıca yayılmayı durdurur, `touch-action: none` sayfanın kaymasını engeller. Sürüklemeden sonra gelen tık (fare) yutulur; dokunmatikte tık gelmediği için yutma işareti her yeni dokunuşta sıfırlanır (aksi hâlde sonraki dokunuş kaybolurdu; tarayıcı denemesinde bulundu).
- Not: mobil öykünmede betiğin bıraktığı sanal fare imleci kamera kayarken altına giren altıgenin bilgi kutusunu açıyordu (fare hover'ı); gerçek dokunmatikte fare olmadığından yok, ölçüm saf dokunuşla tekrarlandı.

## 2026-10-30 — Üç geniş harita (Görev H2)

- **Haritalar** (Klasik 12 haritaya dokunulmadı): Orman yolu 31×17 (`orman-yolu`; yol, ağaç kümeleri, çalı = örtü + zorlu, dere ve sığ geçit, açık çayır, iki yanda pusu çalıları; aynalanabilir), Kale ve avlu 31×17 (`kale-avlu`; sur, kapı, avlu, kule tepesi `z`, kapalı odalar ve koridorlar, hendek; merdiven/kat yok; kale kuralları climb/moat/crenel; aynalanamaz), Mağara (orta) 21×11 (`magara-genis`; dar geçitler, geniş oda, yan cepler, ışıklı kristal; aynalanabilir). Görseller `npm run harita-gorsel` ile zemin harflerinden (yeraltında açık zemin taş renginde); elle çizim gelince değiştirilir. Efekt katmanı Klasik eşlerinden (orman gündüz, kale gündüz, mağara).
- **Seçici:** Game Master harita listesinde "Klasik haritalar" / "Geniş haritalar" grupları; geniş haritada ad, boyut ve açıklama TR + EN (`gm.mapInfo`).
- **Ortam:** canavar ortam listeleri Klasik eşlerinden kopyalandı (orman → orman-yolu, kale → kale-avlu, magara → magara-genis; 216 kayıt), böylece düşman süzgeci ve denge testi aynı çalışır.
- **Örnek karşılaşmalar** (mevcut bütçe sistemi, `data/sim-senaryolar.json`, 1/3/5. seviye): orman-yolu-pusu, orman-yolu-avcilar, kale-avlu-savunma, kale-avlu-garnizon, magara-genis-derinlik, magara-genis-gulyabani.
- **Doğrulama** (`src/map/genis.test.ts`): taraf başına ≥ 6 başlangıç altıgeni, geçilebilir her altıgen oyuncu başlangıcından ulaşılabilir (ulaşılamaz bölge ve çıkmaz başlangıç yok), en yakın rakip başlangıçlar arası ≥ 12 altıgen, köşede alan geometrisi taşmaz, her karşılaşma kurulur.
- **Başlangıç mesafesi** (altıgen; en az / ortalama / en çok): Orman yolu 26 / 27,9 / 31 (41 + 44 başlangıç), Kale ve avlu 12 / 19,5 / 30 (67 + 157; savunucu avlu ve odalarda), Mağara (orta) 13 / 17,0 / 20 (19 + 23).
- **Hızlı denge** (standart 5 kişilik parti, 3. seviye, 30 tohum; ince ayar yapılmadı): Orman yolu pusu 850 XP — %100 kazanma, 6,7 tur, ölüm %0; Kale ve avlu muhafızlar 900 XP — %100, 8,0 tur, en az 1 ölüm %10; Mağara derinlik 850 XP — %100, 3,5 tur, ölüm %0. Geniş haritada savaşlar uzun (yaklaşma), mağara kısa; liste ayarı "Dungeondex öncesi tam test turu"na kalır.
- Ekran görüntüsü (Tümünü göster): `docs/sabah/h2-genis-haritalar.png`.

## 2026-10-30 — Kaydırılabilir geniş harita altyapısı (Görev H1)

- **Boyut veride serbest:** `size` 5×5 … 48×28 (`MIN_GRID`, `MAX_GRID`; aşılırsa "boyut 49×10 geçersiz (en az 5×5, en çok 48×28)"). Kademeler `MAP_SIZES`: standart 15×7, orta 21×11, geniş 31×17. Satır/sütun ve başlangıç aralıkları haritanın kendi boyutuna göre denetlenir; aynalanabilir harita tek sütunlu olmalı (odd-q kayması korunur). Motor boyutu zaten zemin tablosundan türetiyordu (yol bulma, görüş, alan, yapay zekâ, kurallar): savaş durumunda yeni alan yok, **kayıt biçimi ve sürümü değişmedi**.
- **Çizim:** altıgen boyutu sabit; dünya boyutu `worldOf(size)` (15×7'de tam eski `VIEW` 1280×715). Pencere standart haritanın oranında ekrana sığar (eski `useStage`). Geniş haritada dünya katmanları (görsel, efekt, ızgara) kırpan bir görüş alanında kaydırılır; HUD ekran koordinatında kalır ve balonlar `px()` ile kameraya göre konumlanır. 15×7'de sarmalayıcı ve olay dinleyicisi yok: savaş ekranı `.mb-stage` HTML'i eski sürümle aynı tohumla birebir aynı (Ada, Çöl, Mağara; 1280×800 ve 844×390 karşılaştırıldı).
- **Kamera** (`src/ui/camera.ts` saf, `src/ui/MapCamera.tsx`): konum + yakınlaştırma; alt sınır ekrandaki altıgen ≥ 44 px (en çok 1'e iner), üst 2,5; "Tümünü göster" sınırı aşar (yalnızca bakış, ilk etkileşimde normal görünüme döner). Kamera durumu yereldir, kayda girmez; takip ayarı `localStorage` (`rpg-battle-kamera-takip`).
- **Kaydırma:** tekerlek (imleç altı sabit), orta/sağ tuş ya da Space + sol tuşla sürükleme, ok tuşları/WASD (yazı alanında değil); dokunmatik: jeton, HUD ve menü dışından sürükleme (8 px eşiği; altı dokunma), iki parmakla yakınlaştırma. **Mevcut etkileşimle çakışmalar ve çözümü:** (1) altıgen uzun basma (450 ms bilgi kutusu) sürükleme sırasında tetiklenebiliyordu → sürükleme varsa zamanlayıcı yok sayılır; (2) sürüklemenin sonundaki tık altıgen seçimine gidiyordu → yakalama aşamasında yutulur; (3) kurulumdaki jeton sürükle-bırak sol tuşla → jeton üstünden başlayan hareket kaydırma değildir; (4) sağ tık menüsü geniş haritada kapalı (sağ tuşla kaydırma).
- **Takip:** sıra yeni yaratığa geçince kamera onu pencereye alır (en az kaydırma); elle kaydırılan turda durur. Hedef/nişan seçerken seçili yaratık ve hedef pencerede tutulur. Mini harita (sağ alt, dokununca oraya gider) ve son komutun etkilediği ekran dışı yaratıklar için kenarda ok.
- **Performans** (geçici 31×17 ve 48×28 deneme haritalarıyla; commit edilmedi): yalnızca görünen altıgenler çizilir (≈145–155 altıgen; 31×17'de 527, 48×28'de 1344 altıgenden). Kaydırma karesi ≈31 ms (iki rAF), savaş açılışı 31×17 ≈1,4 sn, 48×28 ≈1,9 sn (yürünebilir altıgen önizlemesi menzille sınırlandı: önce 48×28'de 5,1 sn idi). Yapay zekâ tur süresi (3 tohum, 4 goblin + 2 kurt, 5. seviye parti): 15×7 ort. 12,6 ms (en uzun 54), 31×17 ort. 17,9 ms (64), 48×28 ort. 25,1 ms (77).
- Dikey telefonda (390×844) uygulama önceki gibi "Telefonu yatay çevirin" der; sahne küçük çizilir, kamera yine çalışır. Yatay telefon (844×390) ve masaüstü görüntüleri `docs/sabah/h1-genis-*.png`.
- **Görselsiz geniş haritalar:** `npm run harita-gorsel -- <kimlik>` zemin harflerinden dünya boyutunda arka plan üretir (`TERRAIN_COLOR`, basit işaretler); elle çizilmiş görsel gelince değiştirilir. Efekt katmanı (Adım 10c) standart oran için; geniş haritalarda efekt tanımlanmadı.

## 2026-10-30 — Soy rozetleri kaldırıldı (Görev R1)

- Kullanıcı kararı: jetonlardaki soy rozetleri (K13/K19/K22) kaldırıldı. Silinenler: `Avatar.badge` alanı ve `lineageBadge`, jeton (HTML ve SVG) ve sihirbaz soy kartlarındaki nokta çizimi, `.lineage-badge`/`.lineage-dot` stilleri, `data/soy-renkleri.json` içindeki bütün `badges` kayıtları (Dragonborn erkek Copper/Gold/Silver, kadın Brass/Copper/Silver; Elf kadın Wood Elf; Goliath kadın Frost/Hill, erkek Hill). Boyama ve maske çıktısı değişmedi (`soy-olcum.json` aynı).
- Testler: "ΔE < 20 ise rozet gerekir" testi kaldırıldı; ΔE ≥ 15 testi kaldı; yeni test hiçbir soyda rozet olmadığını denetler. İnceleme sayfasında rozet sütunu yoktu (değişiklik gerekmedi).
- ΔE'si 15–20 arasında kalan çiftler (yalnızca renkle ayrışıyor; sabah raporunda da):
  - dragonborn kadın: brass/copper en düşük ΔE 17.4 (cleric)
  - dragonborn kadın: brass/gold en düşük ΔE 18.6 (sorcerer)
  - dragonborn kadın: black/silver en düşük ΔE 19.2 (wizard)
  - dragonborn kadın: bronze/copper en düşük ΔE 19.7 (bard)
  - dragonborn erkek: copper/red en düşük ΔE 16.5 (barbarian)
  - dragonborn erkek: black/silver en düşük ΔE 17.0 (ranger)
  - dragonborn erkek: silver/white en düşük ΔE 17.7 (barbarian)
  - dragonborn erkek: brass/gold en düşük ΔE 19.7 (barbarian)
  - elf kadın: high-elf/wood-elf en düşük ΔE 19.4 (cleric)
  - goliath kadın: cloud/frost en düşük ΔE 18.5 (fighter)
  - goliath kadın: hill/stone en düşük ΔE 18.8 (paladin)
  - goliath kadın: fire/hill en düşük ΔE 19.1 (fighter)
  - goliath erkek: hill/stone en düşük ΔE 18.2 (fighter)
  - goliath erkek: fire/hill en düşük ΔE 18.5 (paladin)

## 2026-10-30 — Drow paletleri (Görev DROW-PALET)

- **Yöntem:** maskedeki ten pikselinin açıklığı (jetonun %5–%95 aralığı) 7 duraklı Lab gradyanına parçalı doğrusal eşlenir (eski skala 4 duraklıydı). `contrast` 0,35: orta tonlarda S-eğrisi (t − k·sin 2πt / 2π; tekdüze, uçlar korunur). `chromaKeep` 0,35: orijinal pikselin a/b değerinin ten ortalamasından sapması korunur (gölgedeki sıcaklık, vurgudaki soğukluk). Bu alanlar verilmezse gradyan eskisiyle bit bit aynı (test). Saç ve giysi maskeyle korunur (otomatik ya da elle maske).
- **Paletler** (`data/soy-renkleri.json` `elf.drowPalet`, seçenekler `elf.paletler.drow.secenekler`; açıklık durakları ortak: 3, 8, 14, 21, 29, 40, 56): A kömür-mavi, B mor-mavi, C kül-gri, D gece-mavi. Geçersiz anahtar → varsayılan A, konsolda bir kez uyarı (`resolvePalette`).
- **Ölçüm** (`data/soy-olcum.json` `paletler['elf/drow']`; dört palet için ayrı): ortalama ten açıklığı ≈38 (eski skala 31,6); ortalama kroma A 10,4, B 14,6, C 3,2, D 20,4; High/Wood Elf'e en küçük ΔE A 49,6, B 50,1, C 46,3, D 55,3 (eşik 15). En açık durak 56 (≤ 60). Diğer bütün ırk ve soyların ölçümü bit bit aynı.
- **Varsayılan A (kömür-mavi):** soğuk mavi-gri ten klasik Drow algısına en yakın. Detay ve canlılık eski skaladan belirgin iyi, siyah giysi ve kapüşonla (Rogue) yine ayrışıyor. B'nin moru Tiefling'e yaklaşıyor. C en az doygun; Goliath'ın gri teniyle karışıyor ve "mat" sorununu tam çözmüyor. D en canlısı ama doygun mavi çizgi film gibi duruyor ve Dragonborn Blue'ya yaklaşıyor.
- Eski testler: Drow ortalama açıklık sınırı 33 → 40 ve en açık piksel 55 → 60 (K19 kuralı L ≈ 60; yeni skala bilerek daha geniş ve detaylı).

## 2026-10-30 — Ana parça boyutu: İngilizce metinler tembel (Görev F1)

- Ölçüm (kaynak haritasıyla, modül başına): ana parça 464,5 kB'ın ≈227 kB'ı react-dom, ≈109 kB'ı çeviri tablosu (`strings.ts`, TR + EN). Diğer adaylar küçük: builder 11 kB, Screens 10 kB, classFeatures 10 kB, backgrounds 2,4 kB, tint 4,5 kB, headOverlay 0,8 kB; harita adları zaten tembel (M1).
- Karar: İngilizce tablo `src/i18n/strings.en.ts` ayrı parçaya (56 kB). `t()` yüklü tabloyu döner (yoksa Türkçe); `setLang('en')` önce yükler, sonra dili değiştirir; kayıtlı dil EN ise `main.tsx` ilk çizimden önce `ensureLang()` bekler (açılış ekranının statik karesi bu sırada görünür; Türkçede bekleme yok). Testler `test-setup.ts`'te EN'i önceden yükler.
- Sonuç: ana parça 464,5 → 408,8 kB (hedef ≤ 440). Feat açıklamaları, geçmiş verisi ve K22/K24 yardımcıları ana parçada kaldı: küçükler (toplam < 10 kB) ve taşımaları karakter listesindeki eşzamanlı denetimleri (`characterIssues`, jeton boyama) tembel yapmayı gerektirirdi; hedef zaten aşıldı.
- Davranış: TR açılış aynı; EN açılış ve TR→EN geçişi gerçek tarayıcıda denendi (önizleme sunucusu).

## 2026-10-30 — Savage Attacker (Görev F1)

- **SRD 5.2.1 metni:** "Once per turn when you hit a target with a weapon, you can roll the weapon's damage dice twice and use either roll against the target." Metin "either" diyor (iyisi değil, ikisinden biri); oyun **büyük olanı** kullanır: düşüğünü seçmenin oyunda yararı yok, bu yüzden oyuncuya sorulmaz. Eşitse ilk atış.
- Veride feat mekaniği `trait: savage-attacker` (`featEffects().traits` → savaşçının `traits`'i). Turda bir kez: `traitTurns['savage-attacker']` (Colossus Slayer ile aynı mekanizma); yalnızca isabette yazılır, ıskada hak harcanmaz.
- Yalnızca silah saldırısı (büyü saldırısı ve Wild Shape biçiminin saldırısı değil). İki atış silahın kendi hasar ifadesi (yetenek değiştiricisi sabit olduğundan sonucu etkilemez); Great Weapon Fighting her iki atışta. Sneak Attack, Divine Smite gibi ek zarlar bir kez.
- İkinci atış aynı `rollTag(kind: damage)` yolundan: elle zarda ayrıca istenir, zar defterine yazılır; `attack_resolved.savage` (iki atış, toplamlar, kullanılan) günlükte görünür; replay aynı durumu verir.

## 2026-10-30 — Magic Initiate tam (Görev F1)

- **SRD 5.2.1 metni (data/srd/feats.json):** iki cantrip + bir 1. seviye büyü aynı listeden (Cleric, Druid, Wizard); yetenek INT/WIS/CHA "feat'i seçerken"; 1. seviye büyü her zaman hazır, uzun dinlenmede bir kez slotsuz, slotla da yapılabilir; Spell Change (yeni seviyede bir büyüyü değiştirme); Repeatable (her seferinde farklı liste). Kullanıcı özetiyle çelişki yok.
- **Kaynak:** liste başına veri kaynağı `magic-initiate-<liste>` (`data/class-features.json` resources; `feat`, `featList`, 1 kullanım, uzun dinlenmede dolar). Sınıf tablosundan gelmez: `featResources(sheet)` savaşçıya ve karakter durumuna (dinlenme) eklenir. Seçilen büyü savaşçıda `freeSpells` (büyü → kaynak); `freeSpellResource` önce buna bakar, böylece büyü yapma, tepki büyüleri (Shield) ve yapay zekâ aynı yoldan slotsuz hakkı kullanır. Slotu olmayan sınıfta (Fighter) da çalışır; hak bitince slot gerekir.
- **Yetenek:** seçimde `magicInitiate[liste].ability`; yoksa listeye uygun varsayılan (Cleric/Druid → WIS, Wizard → INT). Büyü başına zorluk sınıfı ve saldırı bonusu savaşçıda `spellStats`; `executeCast` bu yapım için uygular. Aynı büyü sınıf büyüsü olarak da biliniyorsa sınıfınki geçerli.
- **Seviye yuvası:** SRD'de ASI özelliği "Ability Score Improvement feat'i ya da koşulunu sağladığın başka bir feat" verir; köken feat'lerinin ön koşulu yok. Bu yüzden ASI ve Epic Boon yuvalarında Origin feat'leri de seçilebilir (önceki kod yalnızca General'a izin veriyordu). Yuvadaki Magic Initiate listesini seçer (`Advancement.list`); aynı liste ikinci kez seçilirse eksik.
- **Spell Change:** seviye geçmişi tutulmadığından oluşturucuda Magic Initiate seçimleri her zaman değiştirilebilir (kuraldan geniş; bilerek). Geçmişsiz eski kayıttaki serbest köken Magic Initiate'inin listesi yok: çalışmaz, "Geçmiş seç" önerisi kalır.
- Savaş menüsünde hak kaldıkça "bir kez, slotsuz" işareti. Açıklama kartları SRD'ye göre düzeltildi: Magic Initiate (yetenek seçimi, her zaman hazır, slotla da, tekrar alınabilir eksikti) ve Alert (Incapacitated iken takas yok eksikti).

## 2026-10-30 — Yapay zekâ ham maskesi içe aktarma (Görev K24)

- Kullanıcı ilk K24'ü (hazır renkli jetonlar) iptal etti; yerine ham maske içe aktarma aracı yapıldı. Hazır jeton kodu commit edilmeden silindi.
- `npm run soy-maske-ice` (`scripts/soy-maske-ice.ts`, saf çekirdek `src/ui/rawMask.ts`): `assets/soy-maske-ham/<jeton>.png|jpg` → `assets/soy-maske-el/<jeton>.png` (jetonla aynı boyut, 256×256, gri 0/255; K21 doğrulamasından geçer). Bu, "betikler elle maske klasörüne yazmaz" kuralının **tek istisnası**: kullanıcı açıkça istedi; var olan dosya `--zorla` olmadan ezilmez (bu araçla yazılmış ve değişmemişse, sha1 kaydıyla, yenilenir).
- Hizalama: (1) kenardaki tekdüze gri/beyaz çerçeve kırpılır; (2) en-boy farkında uzun kenardaki siyah boşluk iki uçtan kırpılır, uyarı verilir; (3) ham oran jetonun opak kutusuna uyup tuvale uymuyorsa (karakter kırpılmış) opak kutuya oturtulur. Kayma otomatik düzeltilmez (yanlış düzeltme riskli); IoU < 0,3 "büyük olasılıkla hizasız" uyarısı verir.
- Temizlik: eşik varsayılan 128 (`--esik`), saydam piksellerde sıfır, < 4 piksel beyaz bileşen silinir (4 komşuluk), dört yanı beyaz tek piksel delik doldurulur.
- Kayıt `data/soy-maske-yz.json` (ölçümler, uyarılar, yazılan dosyanın sha1'i); önizleme `docs/sabah/soy-inceleme/ham/` (gitignore). İnceleme sayfası: kaynak "ELLE (yapay zekâ)" (dosya özeti kayıtla aynıysa), "ham maske" sütunu, renkli etiketler.
- Depoda ham görsel ve yapay zekâ maskesi yok (kullanıcı ekleyecek); araç bir deneme girdisiyle (otomatik maskeden 1024 px, gri çerçeveli JPG) doğrulandı: IoU 0,985; deneme dosyaları silindi.

## 2026-10-30 — Goliath Paladin/Fighter/Cleric gövde boyası kapalı (Görev K23)

- Veri: `data/soy-renkleri.json` `basKaplama.goliath` artık `{ siniflar: [paladin, fighter, cleric], govdeBoya: false }`; jeton başına açmak için `govdeBoya: { "<jeton>": true }` biçimi de okunur. `npm run soy-bas` bayrağı `data/soy-bas.json` kaydına yazar (`govdeBoya: false`); kafa görselleri değişmedi.
- Motor: `applyHeadOverlay(..., { body: false })` maskeyi yalnızca kaplamanın opak piksellerine indirir; kafa dışı ve kaplamanın örtmediği eski ten boyanmaz. Boyun/kafa geçişinde dikiş olmasın diye boyanmayan tene 1 ve 2 piksel uzaklıktaki kafa pikselleri kısmen boyanır (ağırlık 85, 170). Oyundaki boyama (`tintedUrl`), ölçüm (`soy-maske`) ve inceleme sayfası aynı yolu kullanır.
- Kapsam yalnızca bu 6 jeton: yeniden ölçümde `data/soy-olcum.json`'da yalnızca bu 6 jetonun değerleri değişti; diğer Goliath sınıfları ve ırklar aynı.
- ΔE artık bu jetonlarda yalnızca kafada ölçülüyor: en düşük ΔE 18,9 → 18,5 (kadın), 19,0 → 18,2 (erkek); ≥ 15 kuralı geçiyor. ΔE < 20 kalan çiftler aynı (kadın Cloud/Frost, Hill/Stone, Fire/Hill; erkek Hill/Stone, Fire/Hill), rozet listesi değişmedi.
- Açık ten taraması: kafa kutusu dışındaki maske bileşenleri ten değil, gri omuz zırhı (Goliath teniyle aynı gri; otomatik maskenin yanlış pozitifi). Eller eldivenli; yüz dışında açık ten yok, el maskesi önerisi gerekmez. Gövde boyası kapanınca omuz zırhının yanlışlıkla boyanması da bitti.
- Not: SRD'de Goliath'ın 6 dev soyu var (Cloud, Fire, Frost, Hill, Stone, Storm); ekran görüntüsünde orijinal + 6 soy = 7 sütun.

## 2026-10-30 — Geçmiş seçimi (Görev G1)

- **SRD denetimi:** dört geçmiş SRD 5.2.1 s. 83 (Character Origins > Background Descriptions) ile kullanıcı beklentisinin aynısı: Acolyte INT/WIS/CHA, Magic Initiate (Cleric), Insight + Religion; Criminal DEX/CON/INT, Alert, Sleight of Hand + Stealth; Sage CON/INT/WIS, Magic Initiate (Wizard), Arcana + History; Soldier STR/DEX/CON, Savage Attacker, Athletics + Intimidation. Ayrıştırıcı bölümü ekledi (`data/srd/backgrounds.json`, `npm run srd`; diğer SRD dosyaları değişmedi); oyun verisi `data/backgrounds.json` (TR/EN ad, özet, alet metni; `srd: backgrounds:<id>`, kimlik testi SRD ile yetenek/feat/beceriyi karşılaştırır). Türkçe adlar: Mürit, Suçlu, Bilge, Asker.
- **Kural modülü** `src/rules/backgrounds.ts`: karakterde `backgroundId`. Bonus yalnızca geçmişin üç yeteneğine (`bonusesOf`); köken feat'i geçmişten (`originFeatOf`, `sheetFeats` ve `advancementProblems` bunu okur; serbest seçim kalktı); iki beceri kilitli (`backgroundSkills`), serbest "geçmiş ve tür" hakkı 3 − 2 = 1 (`otherSkillsOf`).
- **Geçersiz kalan seçimler silinmez:** başka geçmişin yeteneğindeki bonus yok sayılır; düşüş sonrası yarım kalan kalıp (+2 tek başına) da yok sayılır ve bonus "dağıtılmamış" görünür (yumuşak uyarı). Serbest becerilerden geçmişle aynı olanlar ve hakkı aşanlar yok sayılır. Magic Initiate seçimleri büyü listesi başına (`magicInitiate.cleric`, `.wizard`) saklanır. Geçmiş geri seçilince hepsi döner.
- **Çakışma:** geçmiş becerisi sınıftan da seçilmişse Beceriler adımında uyarı (satır + eksik listesi); Skilled seçimi geçmiş becerisini alırsa K20 uyarısı. Serbest "geçmiş ve tür" listesindeki aynı beceri sessizce yok sayılır (eski kayıtlarda bunlar zaten geçmiş becerileriydi).
- **Magic Initiate:** İlerleme adımında listenin cantrip'leri (2) ve 1. seviye büyüleri (1); eksik seçim kaydı engeller. Büyüler savaşçının bilinenlerine soy büyüleri gibi eklenir; büyü yeteneği büyücü sınıfta sınıfınki, değilse INT/WIS/CHA'nın en yükseği (soy büyüleriyle aynı yaklaşım). **Eksik:** 1. seviye büyünün uzun dinlenmede bir kez slotsuz yapılması yok (slotu olan slotla yapar); feat'in yetenek seçimi yok.
- **Savage Attacker** veride `missing` kalır (geçmiş kartı ne yaptığını anlatır, feat kartı "çalışmıyor" etiketi gösterir). Alet yetkinliği ve donanım paketi yalnızca metin.
- **Yeni karakter** sihirbazda Soldier ile başlar (`newCharacter`; varsayılan Fighter'a uygun). `blankCharacter` (testler) geçmişsiz kalır.
- **Eski kayıt (geçmişsiz):** köken feat'i, bonus ve beceriler olduğu gibi; kayıt engellenmez. Karakter adımında "Geçmiş seçilmemiş (eski kayıt)", İlerleme adımında "Geçmiş seç" önerisi.
- **Kayıt sürümü 20:** savaşçıda `backgroundId` (bilgi) ve Magic Initiate büyüleri `spellNames`'te. 3–19 yüklenmeye devam eder.

## 2026-10-30 — Oyunun adı "Dice & Hex" (Görev N1)

- Kullanıcının son kararı: ad "Dice & Hex". Tek kaynak `APP_NAME` (`src/app/appName.ts`); başlık çubuğu (`index.html`, vite eklentisi), ana menü başlığı, açılış ekranının erişilebilir adı buradan okur. Çeviri tablosunda (`strings.ts`) ad geçmiyor.
- Ana menü başlığı büyük harfle çizilir (`text-transform: uppercase`): "DICE & HEX", "&" vurgu renginde ayrı span; erişilebilir ad ("Dice & Hex") `aria-label`'da.
- Kayıt anahtarları (`rpg-battle-*`), depo/dosya adları ve paket kimliği değişmedi; eski kayıtlar etkilenmez.
- Gömülü yazı denetimi: logo görselleri (`public/logo/logo-acilis.webp`, `acilis-yazi.webp`, kaynak `assets-ham/logo/logo-acilis.jpg`) zaten "DICE & HEX" yazıyor; yeni adla uyumlu, değişiklik gerekmez. `logo-masaustu.webp` ve kare ikonlar yazısız. Savaş sonu videoları ve posterleri (U3) yalnızca "ZAFER/BOZGUN/VICTORY/DEFEAT" yazıyor; oyun adı yok.

## 2026-10-30 — Goliath kafa kaplaması (Görev K22)

- **Kapsam veride** (`data/soy-renkleri.json` `basKaplama`: Goliath Paladin, Fighter, Cleric); başka sınıf ve ırk değişmez.
- **Çevrimdışı hazırlık** (`npm run soy-bas`, `npm run soy-maske` de çağırır): kafa kutusu ten maskesinin en üstteki bağlı bileşeni; kafa görselinin kenara bağlı saf siyah zemini şeffaflaştırılır (gelen dosyalar opak siyah zeminliydi), kutuyu örtecek kadar en yakın komşuyla ölçeklenir (≈ ×2), tepe ve yatay orta hizalı, kutuya kırpılır; jetonla aynı boyutta `public/characters/bas/<jeton>.png` ve `data/soy-bas.json` (kutu, ölçek, boyutlar, atlanan, uyarılar). Ayrıntı ve boyut tablosu `docs/soy-bas.md`.
- **Çalışma anı** (`src/ui/headOverlay.ts`, `tint.ts`): boyamadan önce kutudaki ten pikselleri şeffaflaştırılıp kafa konur, boyama maskesi kutuda kafanın opak pikselleri; kaplamanın örtmediği ten pikseli eski hâlinde kalır (delik açılmaz; istekteki "önce şeffaflaştır" sırası korunup boşluk eski piksele döner). Kutu dışı hiç değişmez.
- **Rozet:** kaplamayla Goliath Hill çiftleri (kadın Hill/Stone 19,3, Fire/Hill 19,4; erkek Hill/Stone 19,0, Fire/Hill 19,4) 20'nin altına indi; K19 kuralına göre Hill'e rozet (kadın Frost + Hill, erkek Hill). ΔE ≥ 15 her yerde tutuyor.
- **Dikiş:** boyun kutunun altında eski maskeyle boyanmaya devam ediyor; kafa ile boyun aynı soy tonuyla boyandığı için ayrı geçiş eklenmedi.

## 2026-10-30 — Ana menü yeni tasarım (Görev M1)

- **Yazı tipi çakışması:** uygulamanın mevcut sistemi gövdede Atkinson Hyperlegible, başlıkta Cinzel yığını (dış yazı tipi yüklenmiyor, sistem yedekleri). İstekteki Inter / Libre Baskerville bu sistemle çakıştığı için kurala uyuldu: mevcut sistem kullanıldı (dış yazı tipi yükleme ve ana parçaya ek yük yok).
- **Ad:** `APP_NAME` "Dice & Hex" → "Hex & Dice" (başlık, açılış ekranının erişilebilir adı, sekme başlığı tek yerden); "&" vurgu renginde ayrı `span`. İsim kararı henüz verilmedi; tek yerden değişir (SABAH-RAPORU "Karar bekleyenler").
- **Arka plan:** görseller değişmedi; bu ekranda menü arka planının karartma katmanı (`.menu-bg-shade`) gizli (`body:has(.home-screen)`), filtre ya da bulanıklık yok. Okunabilirlik cam paneller (panel, çipler, açıklama) ve başlıkta metin gölgesiyle. Açık temada açık cam (rgba(250,248,244,0.82)), koyu metin #1a2027 (kontrast > 12:1); koyu temada rgba(16,22,28,0.74), açık metin.
- **Düzen:** ≥ 900 px genişlik ve ≥ 620 px yükseklikte masaüstü (sol logo bloğu, sağ üstte tema/ses/dil çipleri, sağda 460 px cam panel, sol altta sürüm); daha dar ya da kısa ekranda (mobil dikey, yatay telefon, kısa dizüstü) mobil düzen: üst çubuk (40 px yuvarlak tema/ses, TR/EN), ortada logo ve başlık, alta yapışık panel; içerik dikey kaydırılabilir, yatay taşma yok (844×390, 1024×560, 320×568 denetlendi).
- **Kayıt özeti:** `savedBattleSummary` (`app/saveKey.ts`; motor yüklenmez) kayıt dosyasından harita kimliği, varyant (gece/gündüz: varyant kimliğinde "gece"), en yüksek tur ve kayıt zamanı; harita adı yalnızca kayıt varken o haritanın JSON'undan tembel (`import.meta.glob`, `import: 'name'`; ilk denemede bütün haritalar ana parçaya girip 479 kB'ye çıkmıştı). Sürüm `package.json`'dan (ilk iki hane).
- **Simgeler:** çizgi tipinde satır içi SVG (`src/ui/icons.tsx`); emoji yok. İşlevler ve seçiciler aynı (`button.role`, `.lang-switch`, "Kayıtlı savaşa devam et"): check:harita ve check:ses akışları değişmedi.

## 2026-10-30 — İlerleme adımı: köken feat'i ekranı (Görev K20)

- **Köken feat'i ayrı kutu** ("Geçmişinden gelen başlangıç yeteneği"); ASI/feat yuvaları "Seviye yuvaları" başlığı altında.
- **Geçmiş önerisi yok:** uygulamada geçmiş (background) seçimi yok (yalnızca geçmiş puan bonusu ve beceriler) ve `data/srd/` geçmiş kaydı ayrıştırmıyor. SRD 5.2.1'de her geçmiş feat'ini sabit verir (Acolyte → Magic Initiate (Cleric), Criminal → Alert, Sage → Magic Initiate (Wizard), Soldier → Savage Attacker); bu bilgi kutuda not olarak yazılı, seçim serbest kaldı. Geçmiş seçimi eklenince feat kilitli bilgi olur (SABAH-RAPORU "Karar bekleyenler").
- **Feat kartları:** "Ne yapar?" ve "Örnek" bütün 18 SRD feat'i için elle (TR ve EN), `data/aciklamalar.json` `feats` (K18'deki açıklama tablosu; yalnızca Builder parçası yükler, ana parçaya girmez: strings.ts yerine burada). Çevirisi olmayan feat'te (dış içerik) SRD metni ve "Türkçe çeviri yok". Dövüş Stili yuvasında her seçeneğin kartı, seçili olan vurgulu.
- **Skilled becerileri ayrı alan** (`SavedCharacter.featSkills`; feat başına 3, İlerleme adımında seçilir). Önceden "diğer beceriler" sayacına +3 ekleniyordu (Beceriler adımında); artık orada en çok 3. Başka kaynaktan (sınıf, geçmiş/tür) gelen beceri seçilemez; eksik/fazla/çakışan seçim kaydı engeller (`featSkillProblems`, adım "progress"). Eski kayıtlar: `featSkills` yoksa diğer becerilerin 3'ü aşan kısmı Skilled'a taşınır (`normalizeFeatSkills`; sihirbaz açılışı, `characterIssues`, `withSkills`). Alet (tool) yetkinlikleri oyunda yok; yalnızca beceri.
- **Terim etiketleri:** bu ekranda Türkçe ad + İngilizce terim: "Dövüş Stili (Fighting Style)", "Yetenek Artışı (Ability Score Improvement)", "Destansı Lütuf (Epic Boon)", "Köken feat'i (Origin feat)". Ekranda Weapon Mastery/Metamagic/Invocation/Order etiketi yok (onlar başka adımlarda); uygulama geneli taranmadı.
- **Sınıf değişimi:** Skilled ve köken feat'i sınıfa bağlı değil; Dövüş Stili yuvaları K17 kuralıyla (sessizce yok sayılır, geri dönünce gelir).
- **Hata sınırı:** sihirbaz adımları `StepBoundary` ile sarıldı; çökmede "Bu adımda bir sorun oluştu, Geri'ye bas." ve bağlam (adım, sınıf, ırk, soy, alt sınıf, seviye, köken feat'i, geçmiş bonusu), mesaj ve stack konsola ve hata günlüğüne (`src/ui/errorLog.ts`, localStorage `rpg-battle-hatalar`, son 20) yazılır. Durum ekranında "Hata günlüğü" bölümü (Ayarlar'da Durum bölümü yok; ana menüdeki Durum ekranı). Duman testi: 12 sınıf × seviye 1/5/9 × 5 ırk (180 kombinasyon) İlerleme adımı: çöken yok.

## 2026-10-30 — Soy renkleri: elle maske önceliği, inceleme sayfası, Drow skalası (Görev K21)

- **Sıra:** görev "kuyruk 9'da K20 ve M1'den sonra" diye geldi; K20 ve M1 henüz verilmediği için beklemeden çalıştırıldı (dokunduğu yerler soy boyaması ve betikleri; K20/M1 bunlarla çakışırsa onlar sonra uyarlanır).
- **Elle maske:** `assets/soy-maske-el/<ırk>-<male|female>-<sınıf>.png` (jetonla aynı ad ve boyut, gri tonlu; saydam = siyah). Geçerliyse otomatik maskenin önüne geçer. Doğrulama `src/ui/handMask.ts` (ad, boyut, gri ton; renkli dosya = muhtemelen şablon); kurala uymayan dosya yok sayılır, uyarı konsola ve `data/soy-maske-rapor.json` `uyarilar`'a yazılır, çökme yok. Geçerli elle maskeler gri ağırlık olarak `public/characters/maske-el/`'e kopyalanır (çalışma anı yalnızca `public/`'ten okur); kaynak listesi tek yerde `data/soy-maske-rapor.json` (`sprites`: el/oto). Otomatik maskeler `public/characters/maske/`'de kalır. Betikler `assets/soy-maske-el/`'e yazmaz ve oradan silmez (klasörler `scripts/soy-maske-yollar.ts`'te tek yerde; test denetler).
- **Kısmi ağırlık:** `tintPixels(…, weights)` gri değeri karışım oranı olarak kullanır (255 tam, 0 yok); elle maskeye morfoloji uygulanmaz. Otomatik maske eski ikili yoldan geçer: elle maske yokken sonuç bit bit aynı (`npm run soy-maske` sonrası otomatik maskelerde ve Goliath/Dragonborn/Tiefling/Gnome/High/Wood Elf ölçümlerinde fark yok; yalnızca Drow değişti).
- **İnceleme:** `npm run soy-incele` → `docs/sabah/soy-inceleme/index.html` (internetsiz; Goliath ve Dragonborn'un bütün soyları, Drow; 72 jeton: orijinal, kırmızı örtülü maske, kaynak, boyanmış soylar; ad ve dosya yolları yazılı) ve `sablon/<ad>.png` çizim şablonları (siyah zemin + %35 jeton; renkli olduğu için elle maske klasörüne konursa reddedilir). Klasör üretilir, depoya girmez (`.gitignore`). Kılavuz `docs/soy-maske-el.md`.
- **Drow skalası:** dört duraklı soğuk mavi-gri (`[3,1,−6]`, `[13,0,−11]`, `[27,−2,−11]`, `[46,−3,−8]`; Lab, `data/soy-renkleri.json`), mor yok. Ten ortalama L 30,9 → 31,6 (en açık durak 46 ≤ 55). Elf soylarına ΔE ≥ 55.
- **Goliath ve Dragonborn:** K19 ton ve rozet ayarlarına dokunulmadı; yalnızca altyapı.

## 2026-10-30 — Çok altıgenli boyut (Görev A6)

- **Tasarım** `docs/harita/COKLU-ALTIGEN.md`: Large 3 altıgen üçgen (çapa sol üst), Huge 7 altıgen çiçek, Gargantuan 19 altıgen (yarıçap 2), çapa orta; sabit şekil, döndürme yok. Konum çapadır (kayıt biçimi aynı); gövde `bodyOf`, mesafe en yakın iki altıgen (`gap`).
- **Bayrakla, varsayılan kapalı** (`BattleState.multiHex`; `startBattle` seçeneği): kapalıyken bütün yardımcılar eski hesapla birebir aynı (`gap` → `distance`, `covers` → `sameHex`, `moveCostFn` → tek altıgen); mevcut testler ve hızlı regresyon değişmedi. Simülasyon senaryolarında Large ve daha büyük canavarlar olduğu için bayrağı açmak dengeyi değiştirir; bu yüzden ayrı bir karar (SABAH-RAPORU).
- **Uygulanan (bayrak açıkken):** yerleştirme, doluluk, hareket maliyeti (gövdenin en kötü altıgeni) ve bitişi, yol bulma ve yapay zekânın yürünebilir altıgenleri, yakın dövüş erişimi ve menzil, fırsat saldırısı, tepki menzili, Pack Tactics komşuluğu, alan büyüleri/nefesler (gövdenin bir altıgeni alandaysa), jeton çizimi (gövde ortası, her altıgen tıklanır).
- **Kalan** (belgede liste): kurulumda otomatik yerleşim, zemin etkileri ve büyü alanları, itme/çarpma, görüş hattı ve siper, yapay zekâ hedef sıralaması, atlama/ışınlanma/yakalama sürüklemesi, görsel taban, arayüz anahtarı. Bunlar bitmeden bayrak arayüze konmadı; yarım uygulama kapalı bayrağın arkasında, `wip/` dalı gerekmedi.

## 2026-10-30 — Ek bonus eylem kancası (Görev A5)

- **Harp Koleji SRD 5.2.1'de yok** (dış içerik; verisi depoda yok). Motorda ek bonus eylem veren genel bir kanca yoktu (yalnızca Haste'in ek eylemi vardı); eklendi.
- **Kanca:** turdaki ek bonus eylem sayısı `extraBonusOf` = savaşçının `extraBonus`'u (sınıf/alt sınıf özelliği `stat: extraBonusActions`, `value` kadar; `classKit.extraBonus`, dış içerik şemasında) + süren etkilerin `extraBonus`'u (büyü etkisinde `mechanics.effect.extraBonus`). Bonus eylem zaten kullanılmışsa ve ek hak kalmışsa `action_used` olayı `extraBonus: true` taşır, `economy.bonusExtraUsed` bir artar; tur başında ekonomi sıfırlanınca yenilenir. Dazed ve Slow kısıtları aynen geçerli.
- **Test:** kurgusal bir alt sınıf (Rogue, `stat: extraBonusActions`) şemadan geçer, kitte ve savaşçıda görünür; Cunning Action ile turda iki bonus eylem (Dash + Disengage), üçüncüsü yok; ek hakkı olmayan ikinciyi yapamaz; yeniden oynatma aynı.
- **Eski test:** `content.test` alt sınıf regresyon özeti kite eklenen `extraBonus` alanını özetin dışında tutar ve SRD verisinde her yerde 0 olduğunu denetler (özetler değişmedi).

## 2026-10-30 — Tasma / hareket sınırı (Görev A4)

- **Biat Yemini SRD 5.2.1'de yok** (dış içerik; depoda tanımı yok). Bu yüzden genel bir etki olarak yazıldı; içerik paketi bunu JSON'la kullanır.
- **Etki:** `ActiveEffect.leash: { centerId, radius }` (altıgen). `leashOf` en dar tasmayı verir; merkez ölür ya da kaybolursa kalkar (yere düşmüş ama ölmemiş merkezde sürer). Süre etkinin `until`'i.
- **Hareket:** bir adım, merkezden yarıçapın dışında ve öncekinden uzak bir altıgene gidiyorsa yasak (`leashBlocks`, `moveCostFn` içinde). Böylece içeride serbest; merkez uzaklaşıp yaratık dışarıda kalırsa uzaklaşamaz ama yaklaşabilir. Atlama da aynı denetimle. Yapay zekâ, zorlama hareketi ve arayüzün yürünebilir altıgenleri `moveCostFn`'i kullandığı için kendiliğinden sayar. İtme/çekme (zorunlu hareket) ve ışınlanma sınırlanmaz (SRD'de "kendi hareketi" kısıtları gibi).
- **Kaynaklar:** özellik etkisi `kind: 'leash'` (`rangeFt`, `radiusFt`, `save`, `rounds`): menzildeki düşman save atar (DC: kullananın büyü save DC'si, yoksa 8 + yetkinlik + CHA), başarısızsa tasma; dış içerik şemasına eklendi (`EFFECT_KINDS`). Büyü etkisinde `mechanics.effect.leash: { radiusFt }` (merkez büyücü). Savaş menüsünde hedef seçimi Bardic Inspiration gibi.

## 2026-10-30 — İki aşamalı durumlar (Görev A3)

- **Mevcut durum:** Sleep'in ikinci aşaması (Görev WIZARD) zaten veriyle tanımlıydı (`condition-effects.json` `escalate: "Unconscious"`, `durations.ts` `timerEvents`), ama yalnızca B durumunun adını alıyordu (süre hep A'nın kalanı, B'de save yok).
- **Genel şema:** `escalate` artık `{ condition, rounds?, saveEnds? }` (`StageSpec`): A durumu `condition`, kurtarma türü ve DC `saveEnds` (ya da saldırının/büyünün save'i: DC kaynağı), A'nın süresi `maxRounds`; A'nın tekrar save'i başarısız olunca B durumu, B'nin süresi `rounds` (yoksa A'nın kalanı), `saveEnds: true` ise B'de aynı save sürer. `wakeOnDamage` iki aşamada da geçerli. Eski dize biçimi aynı anlamla okunur (`stageOf`): kayıtlardaki eski sayaçlar bozulmaz.
- **Sleep** yeni biçimde (`{ condition: "Unconscious" }`); davranış aynı, Sleep testleri değişmeden geçti.
- **İkinci örnek: Cockatrice Petrifying Bite** (SRD 5.2.1): CON DC 11; ilk başarısızlık Restrained, sonraki turunun sonunda tek tekrar save (`maxRounds: 1`; başarıda biter), ikinci başarısızlık 24 saat Petrified (14400 tur: savaş boyunca). `scripts/riders-uret.cjs` elle tanımlı ikinci aşamayı "uygulanmıyor" saymaz; rider durumu yok → süreli etki (riders.test sayımı 61/16 → 60/17). Hypnotic Pattern SRD 5.2.1'de iki aşamalı değil; dokunulmadı.

## 2026-10-30 — Engelden geçme (Görev A2)

- **Veri:** `data/gecis.json`: canavar özelliği → geçiş kuralı (`Incorporeal Movement` → `{ difficult: true }`; SRD 5.2.1: "move through other creatures and objects as if they were Difficult Terrain"). Süreli etki olarak `ActiveEffect.phase` (büyü/özellik verisinde `mechanics.effect.phase: true | { difficult }`); 0–3. seviye SRD büyülerinde bunu veren yok, alan hazır. Canavar verisi değişmedi; özellik adı canavarın `traits` metninden okunur (Specter, Will-o'-Wisp, Ghost, Wraith; hiçbiri simülasyon senaryolarında yok).
- **Hareket:** `moveCostFn` geçen yaratık için duvar/engel altıgenlerini (harita dışı `#` ve uçanların geçtiği uçurum `u` hariç: uçurum nesne değil) ve düşman altıgenlerini geçilebilir sayar; maliyet 1, `difficult`'ta 2 (müttefik altıgeni de 2). Yol bulma, Dijkstra (`costsFrom`), yapay zekâ ve arayüzün yürünebilir altıgenleri aynı fonksiyonu kullandığı için hepsi kendiliğinden destekler.
- **Bitiş:** hedef altıgen boş ve geçilebilir olmalı (eski denetim). Yürüyüş yarıda kesilirse (fırsat saldırısı, tuzak) yaratık geçtiği son boş ve geçilebilir altıgende kalır (ya da başladığı yerde); kesilmeden sonraki adımların olayları (zemin, alan) yazılmış kalır: yaklaşık. SRD'nin "nesnenin içinde turu bitirirse 1d10 force" kuralı bu yüzden gerekmez (içinde bitirilemez).
- **Yapay zekâ ve zorlama hareketi:** aday bitiş altıgenlerinden engel altıgenleri çıkarıldı (`ai.ts` `reachable`, `mind.ts` zorlama, `summons.ts` çağrı yönlendirme). Geçmeyen yaratıklarda bu altıgenler zaten erişilemezdi; davranış değişmez.
- **Kapsam dışı:** itme/çekme (forced) engele çarpınca durur (geçen yaratık da); ışınlanma zaten bağımsız.

## 2026-10-30 — Ortak can havuzu (Görev A1)

- **Depoda gereksinim notu yok** (docs/, DECISIONS, SABAH-RAPORU, alt sınıf verisi tarandı; yalnızca Sleep'in eski "HP havuzu" ve Wild Shape'in 2014 kuralı geçiyor, ikisi ilgisiz). İstekteki tanım uygulandı.
- **Model:** `BattleState.hpPools` (kimlik, `hp`, `max`, isteğe bağlı ad), savaşçıda `poolId`. Üyenin kendi HP'si yok: `hp`/`maxHp` havuzunki; jeton ve kart bunu gösterir (ek arayüz gerekmedi).
- **Olaylar:** `hp_pool_created` (üyeler, HP, azami) ve `hp_pool_synced`. Hasar ve iyileştirme için yeni olay yok: reducer her olaydan sonra (`trackPools`) üyelerin HP farkını havuza yansıtır (0 ile azami arasında); havuz 0 olunca bütün üyeler `dead`. Böylece bütün hasar/iyileştirme yolları (saldırı, save, alan, süregelen etki, zemin, Game Master) kendiliğinden havuza işler.
- **Komut içinde eşitleme yok:** alan büyüsü gibi çok hedefli komutlar her hedefin hasarını komutun başındaki HP'den hesaplar; üyeler olay olay eşitlenseydi ikinci üyenin hasarı kaybolurdu. Eşitleme komutun sonunda `hp_pool_synced` olayıyla (`execute`'un son adımı). Üyenin ham HP'si havuzunkinin altına inemediği için (havuz = başlangıç − bütün hasar) tek üyeye gelen büyük hasar da havuzu doğru düşürür.
- **Kurulum:** Game Master komutu `create_hp_pool` (en az iki canlı, havuzsuz yaratık; HP/azami verilmezse üyelerin toplamı). Çağırma verisine (`summons.json`) havuz bağlantısı henüz yok; SRD 5.2.1'in 0–3. seviye çağırmalarında ortak HP'li sürü bulunmuyor, ileride `summon` verisinde aynı olayla bağlanabilir.
- **Kayıt sürümü 19 kaldı:** yalnızca yeni olay türleri ve isteğe bağlı alanlar; eski kayıtlar aynen yüklenir.

## 2026-10-30 — Soy renk düzeltmesi (Görev K19; K15'in düzeltmesi)

- **Cinsiyete göre kayıt:** `data/soy-renkleri.json` ırk kaydında `byGender.<male|female>` (`lineages`, `badges`) ortak kaydın önüne geçer; `lineageTint`/`lineageBadge` cinsiyeti alır (cinsiyetsiz eski kayıt erkek). Sprite ve maske altyapısı K15'teki gibi.
- **Dragonborn kadın:** maskedeki delikler (pulun koyu pikselleri) giderildi; ilk denemede benek kalmadığı için K8b yöntemine dönülmedi. Maske adımları (`mask.fill`, yalnızca kadın): 3×3 morfolojik kapatma (yalnızca ten tonundaki pikseller eklenebilir), maskeye bitişik ten tonlu ve yeterince açık/doygun piksellerle 3 adım büyütme (kuyruğun koyu şeridi), 2 piksellik açma ve 60 pikselden küçük parçaları atma (yüze bitişik saç tutamları), en çok 60 piksellik ten tonlu deliklerin doldurulması; kadın aday aralığı `mask.byGender.female` (L 42–95, C 8–62: yanak tonu C≈55 eski sınırın dışındaydı, koyu saç L<40 dışarıda). Kenar yumuşatma yok. Bard kadında lavta, kol şeritleri ve tüy; Monk kadında aynı renkteki giysi kutuyla dışlandı.
- **Dragonborn erkek:** Black, Green ve White K15 yolunda. İstekte White hem eski yönteme dönecekler listesinde hem "yeni yolda kalsın" cümlesinde geçiyordu; son ve açık cümle (Black, Green, White yeni yolda) esas alındı. Blue, Brass, Bronze, Copper, Gold, Red, Silver K15 öncesi K8b HSL değerleriyle (`4e92373^`). Tek sapma: Copper tonu 14 → 20 (K8b değerleriyle Copper/Red ΔE 11,4 idi, 12'nin bile altında; 20 ile 16,5).
- **Goliath:** yalnızca kadın Cloud değişti: `lch.contrast` 1,5 (açıklığın ten ortalamasından sapması büyür; dövmeler belirgin), `chromaKeep` 2, c 6, gain 0,9, dL 26. Diğer soylar ve erkek Cloud aynı.
- **Drow:** gradyan [[4,4,−10],[15,20,−28],[46,18,−24]]: ten ortalama açıklığı 45,4 → 30,9 (≈%32 koyu), en açık durak L 46 (≤60). Saç maskede yok, değişmez. High Elf ve Wood Elf aynı.
- **ΔE eşiği:** 15 her soyda tuttu (en yakın: erkek Copper/Red 16,5, erkek Black/Silver 17,0, kadın Brass/Copper 17,4); eski yönteme dönen soylar için 12'ye indirmek gerekmedi.
- **Rozetler** (cinsiyete göre, yalnızca o cinsiyette ΔE < 20 kalan çiftlerin bir tarafı): kadın Dragonborn Brass, Copper, Silver; erkek Dragonborn Copper, Gold, Silver; kadın Wood Elf (High/Wood 19,4; erkekte 20,5); kadın Goliath Frost (Cloud/Frost 19,5; erkekte 20,0). Erkek Elf ve erkek Goliath'ta rozet yok; Bronze ve Gnome rozetleri kalktı.

## 2026-10-30 — Soy renkleri yalnızca ten bölgesinde (Görev K15; K8b düzeltmesi)

- **Neden yanlıştı:** K8b ırk başına sabit bir HSL ton aralığını boyuyordu: aynı tondaki saç, deri giysi, asa ve zırh da boyanıyordu. **Erkek Goliath'larda etkisizdi** çünkü erkek jetonların gri-mavi teni (Lab kroma ≈3–6) aralığın doygunluk alt sınırının (HSL 0,12) altında kalıyordu; kadın jetonlarda ten biraz daha doygundu, kısmen boyanıyordu.
- **Yeni yol:** her soylu ırk jetonu (5 ırk × 2 cinsiyet × 12 sınıf = 120) için çevrimdışı ten maskesi (`npm run soy-maske` → `public/characters/maske/*.png`, toplam ≈480 kB disk, jeton başına 1–4 kB; yalnızca soylu karakter gösterilince indirilir). Maske sprite'ın gerçek ten paletinden: ırkın gevşek aday rengi (Lab), baş bölgesindeki tohum bileşeni, tohumun en parlak kümelerinden palet (saç gibi koyu bölgeler girmez), paletten ΔE eşiği. Renkle ayrılamayan yerler için sprite başına düzeltme (`maskFix`): Goliath'ta ten ile metal zırh aynı renkte (kroma ve ton istatistikleri çakışıyor) → Cleric/Fighter/Paladin'de yalnızca baş, balta ve hançerler dışlandı; Tiefling Wizard ve bazı Gnome/Dragonborn'larda tohum yüz kutusundan; asa, kalkan, yay ve bir saç bölgesi dışlandı. Dragonborn'un boynuz ve kuyruğu ile Tiefling'in boynuzları ten paletine yakın: pul/ten sayıldı.
- **Boyama** (`src/ui/tint.ts`, aynı fonksiyon ölçümde de kullanılır): maskede LCh kaydırma: ton ve kroma hedefe, orijinal ton/kroma sapmasının bir payı korunur, açıklık `L·gain + dL` (eğri sıkıştırılmaz; Black'te gain 0,75 ile gölgeler düz siyahın üstünde kalır). Drow: üç duraklı gradyan haritası (gölge siyah-indigo, orta koyu mor, vurgu soluk menekşe; saç maskede değil). Green: daha koyu ve az doygun zümrüt (ton 150°, kroma 26, −18 açıklık). Wood Elf: boyama yok (klasik elf). **High Elf:** eski K8b yolu, değer ve kod aynı.
- **Ölçüm ve eşik:** her ırk, cinsiyet ve 12 sınıfın her jetonunda, soy boyamasından sonra maskedeki ortalama Lab; soy çiftleri arası **CIE76 ΔE ≥ 15** (≈ açıkça fark edilir renk farkı). Sonuç `data/soy-olcum.json`; test (`tint.test`) görsel değil bu dosyayı okur (kural: testlere görsel girmez). Bütün çiftler eşiğin üstünde; en yakınlar Dragonborn Brass/Gold 16,0, Black/Silver 16,5, Brass/Copper 17,4, Bronze/Copper 19,8, Goliath Cloud/Frost 19,2, High/Wood Elf 19,4.
- **Rozetler:** ΔE < 20 kalan çiftlerin bir tarafında kaldı: Dragonborn Brass, Bronze, Copper, Gold, Silver; Goliath Frost; Wood Elf. Kaldırılanlar: Goliath Cloud, Fire, Hill, Stone, Storm; Gnome Forest ve Rock.
- Ana parça etkisi: renk dönüşümleri (`color.ts`) ≈2 kB.

## 2026-10-30 — Sihirbaz açıklamaları ve etiketleri (Görev K18)

- **Düğmeler:** cantrip "Öğren" / "Öğrenildi", hazırlanan büyü "Hazırla" / "Hazırlandı", Wizard kitabı "Kitaba ekle" / "Kitapta" (EN Learn/Learned, Prepare/Prepared, Add to book/In book); tekrar dokununca kaldırılır, "unut" yok.
- **Weapon Mastery ve silah özellikleri:** silah kartında her özellik (Finesse, Light, Heavy, Two-Handed, Reach, Versatile, Thrown, Ammunition, Loading) ve ustalık adı dokununca kısa açıklama açan düğme (`TermTip`; farede `title`). Ustalığı seçmek artık ayrı yıldız düğmesi (☆/★, erişilebilir ad "Ustalığı seç: …"): ada dokunmak seçim yapmaz. Metinler SRD 5.2.1'e göre, kullanıcının verdiği Türkçe tanımlarla.
- **Sınıf özelliği özetleri:** her özellik adının altında tek cümlelik özet (dokunmadan; ⓘ ayrıntı için kaldı). Sınıf özellikleri için 137 Türkçe özet elle yazıldı (SRD 5.2.1 metninden), İngilizcesi SRD metninin ilk cümlesi; alt sınıf özellikleri `data/subclasses.json` açıklamasının ilk cümlesi. Veri `data/aciklamalar.json`, yalnızca Builder parçası yükler (`src/ui/descriptions.ts`): ana parça büyümez (açıklamalar ≈30 kB Builder parçasında).
- **Renklerin gerçek anlamı** (koddan, `class-features.json` durumu): turkuaz çerçeve/kalın = `ok` (savaşta çalışır), turuncu çerçeve = `partial` (kısmen), soluk gri = `none` (savaşta etkisi yok, savaş dışı), kesik çizgili gri = `missing` (oyunda henüz yok). "Bu seviyede açılmaz" anlamında renk yok: listede yalnızca bu seviyeye kadar açılmış özellikler var. Altına bu dört anlamla gösterge eklendi.
- **Wild Shape biçim seçicisi vardı ama boş görünüyordu:** seçici (`FormPicker`) canavar verisini kullanıyor; canavar verisi tembel ve yalnızca Game Master/savaş ekranında yükleniyordu, sihirbazda liste boş kalıp yalnızca "en çok 8 (0/8…)" satırı görünüyordu. Seçici artık açılınca canavar verisini yükler; her biçim ad, CR, hız (uçma) ve küçük jetonla kart; sayaç yalnızca liste varken; "Boş bırakırsan savaşta en güçlü uygun biçimler otomatik seçilir." notu açık. Değişen eski test: `k6.test` ("Hazır" etiketi → "Hazırla").

## 2026-10-30 — Puanlar adımı: açıklama, öneri, sıfırlama, takas (Görev K16)

- **Takas zaten vardı** (seçili karta başka karttaki değer verilince iki kart yer değiştiriyordu); saf fonksiyona çıkarıldı (`assignScore`) ve test edildi. Puan satın almada takas yok (değer doğrudan yazılır).
- **Sınıfa göre öner** (`suggestScores`): standart dizide sınıfın SRD önerisi (`data/classes.json` `abilityPriority`, ana yetenek 15); zarla yöntemde atılan değerler aynı sırayla büyükten küçüğe. Puan satın almada düğme yok (SRD'de dizi önerisi yalnızca standart dizi için). **Sıfırla** (`resetScores`): standartta STR'den CHA'ya 15…8, zarla atılanlar büyükten küçüğe aynı sırayla, puan satın almada hepsi 8. Dağıtım yöntemlerinde "boş kart" durumu olmadığı için sıfırlama boş bırakmaz, sabit sıraya döner.
- Açıklama metni ve çip notu (çipin altındaki kısa ad değerin hangi kartta olduğunu gösterir, dokununca takas) TR/EN.
- **Taşıma kapasitesi kontrolü:** Güç'e bağlı çalışıyor (`carryLoad`: final STR × 15; Güç 8 → 120 lb, 18 → 270 lb); hata yok, kurala dokunulmadı. Not: geçmiş bonusu geçersizken (`finalScores` hata verir) Güç 10 varsayılır; bu ayrı bir durum, değiştirilmedi.

## 2026-10-30 — Sınıfa bağlı seçimler sınıf değişince (Görev K17)

- **Tek mekanizma** (`src/rules/builder.ts`): `CLASS_BOUND` alanları (büyüler ve büyü kitabı, Invocation, Metamagic, pact silahı, Wild Shape biçimleri, alt sınıf, seviye yuvaları ve savaş stili, uzmanlık, silah ustalıkları) ve sınıf becerileri sınıf değişince taslağa (`SavedCharacter.classDrafts[sınıf]`) taşınır (`switchClass`). Eski sınıfa dönünce geri gelir; yalnızca o anki seviye, ön koşul ve sayı sınırına uyanlar kalır (`fitRestored`: seviyede açılmayan büyü, ön koşulu olmayan Invocation, fazlası listenin sonundan düşer).
- **Etkin değerler aktif sınıftan** (`classScoped`): sınıfın listesinde hiç olmayan seçimler (başka sınıfın büyüsü, Invocation'ı, Metamagic'i, biçimi; anahtarı başka sınıfa ait `featureChoices`: Divine Order, Primal Order, arazi) uyarı üretmez, eksik listesine girmez, kaydı engellemez ve kayda yazılmaz (`savableCharacter`; taslak alanı da yazılmaz). Seçenekli özellikler zaten sınıf anahtarlı olduğu için taslağa taşınmaz, sheet'te kalır ve yalnızca kayıtta süzülür.
- **Uyarı kalanlar:** sınıfın listesinde olup sayıyı aşan ya da seviyede açılmayan seçimler (aynı sınıfta seviye düşürme dahil; K6) ve zorunlu seçim eksikleri (sınıf becerileri, Metamagic/Invocation sayısı). Eski kayıtlardaki başka sınıfa ait seçimler sihirbaz açılınca düşer.
- **Kayıt biçimi değişmedi:** taslak yalnızca sihirbazın belleğinde; `SAVE_VERSION` (savaş kaydı) ve karakter listesi biçimi aynı. Eski test `builder.test` "Fighter + Fireball uyarısı" artık uyarısız (kullanıcı kuralı a); yerine Wizard 1 + Fireball uyarısı sınanıyor.

## 2026-10-30 — Savaş sonu başlık videoları (Görev U3)

- **Varlıklar:** `assets-ham/son-videolar/` (ham, değişmez) → `npm run son-video` → `public/son/`: mp4 olduğu gibi (1280×720, H.264, sessiz, 6,2 sn; son-zafer 995 kB, son-bozgun 477 kB, son-victory 892 kB, son-defeat 266 kB) + H.264 çözmeyen tarayıcılar için VP9 .webm yedeği (616 / 472 / 585 / 229 kB; açılış videolarıyla aynı yol: önce mp4 kaynağı, sonra webm) + 4 jpg poster (9–23 kB). Oynatılan dile ve sonuca göre tek dosya (≈0,3–1 MB) indirilir. Ana parçaya girmez: video ve posterler ayrı istek, bileşen `EndVideo` tembel parça (savaş ekranının içinden `lazy`). Dile göre dosya `data/son-video.json` (`tr`: zafer/bozgun, `en`: victory/defeat).
- **Sıra:** canlı bitişte (`liveFinish`; kayıttan açılan bitmiş savaş ve simülasyon değil, oyunda ayrı "yeniden oynatma" ekranı yok) müzik ve ortam `end.fadeOutMs` (650 ms) içinde söner; video o anda tam ekran açılır (önce poster karesi); ezgi videonun başından `jingleAfterStartMs` (300 ms) sonra (U2 düzenindeki `BattleEndSound.finish` gecikmesi parametreli). Video bitince ya da dokununca mevcut sonuç ekranı ve EndFx; dokunarak geçişte ezgi `end.jingleStopMs` ile söner (`EndVideoGate` → `leaveBattleEnd`). Video sürerken sonuç bandı gizli.
- **Hata yolu:** `play()` reddi (iOS/Android otomatik oynatma), `error` olayı ya da `startTimeoutMs` (2,5 sn) içinde `playing` gelmezse doğrudan sonuç ekranı; hata metni yok. Video sessiz (`muted`), `playsInline`, `autoPlay`.
- **Ayar:** Ayarlar ekranında "Savaş sonu başlık videosu" Açık (varsayılan) / Kapalı (`rpg-battle-son-video`). "Hareketi azalt" açıksa video yerine poster kare `posterHoldMs` (2 sn).

## 2026-10-30 — Büyücü denge partisi ve iki yapay zekâ düzeltmesi (Görev DENGE-4)

- **Parti `buyucu`** (`data/sim-partiler.json`): Bor (Fighter), Tavi (Cleric) + yeni üyeler Vex (Sorcerer, Draconic, Dragonborn Red; Metamagic Quickened/Careful), Mor (Warlock, Fiend, Tiefling Infernal; Eldritch Blast yapısı: Armor of Shadows, Agonizing, Repelling, Eldritch Mind, Fiendish Vigor), Lira (Bard, Lore), Yara (Druid, Land/Temperate). Görev "dört sınıf + Fighter ve Cleric" dediği için **6 kişi** (MAX_PARTY); diğer partiler 5 kişi, senaryo XP bütçeleri 5 kişiye göre. 1/3/5. seviye sayfaları SRD tablosu kadar cantrip ve hazır büyüyle (balance.test denetler); oluşturucu sorunu yok.
- **Sonuç** (DENGE.md): neredeyse her senaryo %90–100. Neden parti büyüklüğü (6 kişi, +%20 eylem ve HP); sınıf başına teşhiste anormallik yok: Sorcerer'ın hasarı standart partideki Wizard'la aynı düzeyde (≈22 bin / ≈22 bin), Warlock ve Druid Ranger/Rogue düzeyinde, Bard destek rolünde.
- **Yapay zekâ düzeltmeleri (SRD'ye aykırı değil, yalnızca sezgi):** (1) Bard Font of Inspiration'la **slot harcamıyordu, her tur ilham veriyordu** (Hypnotic Pattern, Slow için slot kalmıyordu): yapay zekâ artık yalnızca kullanım varken ilham verir. (2) `controlArea` listedeki **ilk** uygun kontrol büyüsünü seçiyordu (Faerie Fire), Hypnotic Pattern'e hiç sıra gelmiyordu: artık en yüksek seviyeli olan önce. Sonra Lira 75 savaşta 77 Hypnotic Pattern yapıyor. Hızlı regresyon (standart/paladin 3/5) birebir aynı.
- **Yapılmayan:** Sorcerer yapay zekâsı Metamagic ve Font of Magic kullanmıyor; Sorcerer zaten Wizard düzeyinde olduğu için eklenmedi (gücü artırırdı). Warlock'un kısa dinlenmesi tek savaşlık simülasyonda anlamsız (her savaş dolu slotla başlar).

## 2026-10-30 — 4–5. seviye büyü denetimi (Görev K14; Aşama 2 boyutu)

- `scripts/buyu-denetimi.mjs` 4–5. seviye SRD büyülerini de denetler ve `docs/harita/BUYU-DENETIMI-4-5.md`'yi yazar; 0–3. seviye çıktısı (`BUYU-DENETIMI.md`) bayt bayt aynı kaldı. Oyun verisine dokunulmadı.
- **Sonuç:** 72 büyü (34 + 38); oyunda 2 (Cone of Cold, Summon Dragon). Kalan 70'in tahmini işi elle sınıflandı (anahtar sözcük tahmini 4–5'te yanıltıcıydı): 27 savaş dışı (yalnızca not), 16 mevcut motorla yalnızca veri, 18 küçük motor eki, 9 yeni sistem. Yeni sistemler: sürgün (Banishment), tam yönetim / taraf değiştirme (Dominate Beast/Person), hapsetme (Resilient Sphere), telekinezi, yönetilen ikiz (Mislead), uzun süreli hastalık (Contagion), geçilmez/kalıcı duvarlar (Wall of Force, Wall of Stone). Polymorph Wild Shape biçim altyapısıyla "küçük ek" sayıldı.
- Sınıflandırma betikte (`M45`); yeni SRD 4–5 büyüsü sınıflanmadan betik hata verir.

## 2026-10-30 — Küçük düzeltmeler: Thirsting Blade, soy rozeti, biçim saldırısı ek etkileri (Görev K13)

- **Thirsting Blade yalnızca pact silahıyla** (SRD 5.2.1: "attack twice instead of once with your pact weapon"): savaşçıda sınıf saldırı sayısı (`attacksPerAction`) ve pact silahıyla sayı (`pactAttacks`) ayrıldı. Attack eylemi pact silahıyla başlarsa ek saldırılar açılır ve ekonomide `pactOnly` işaretlenir: kalan saldırılar yalnızca pact silahıyla (başka silah reddedilir, "Thirsting Blade: ek saldırı yalnızca pact silahıyla"). Başka silahla başlayan Attack eylemi tek saldırıdır. Push'un "son saldırı" sayımı da aynı kuralı kullanır (`actionAttacks`). Yapay zekâ ilk saldırıda pact silahının ek saldırısını puana katar. Olaya isteğe bağlı alan (`action_used.pactOnly`); kayıt sürümü 19.
- **Soy rozeti yalnızca renk farkı yetersiz soylarda** (K8b raporu): Goliath'ın 6 soyu (Cloud, Fire, Frost, Hill, Stone, Storm), Gnome Forest ve Rock, Dragonborn Brass, Bronze ve Gold, Wood Elf. Rozet renkleri `data/soy-renkleri.json` `badges` (ırk içinde hepsi farklı); diğer soylarda (Dragonborn Black/Blue/Copper/Green/Red/Silver/White, Tiefling, Drow, High Elf) rozet yok. Tek kaynak `sheetAvatar` → `Avatar.badge`: sihirbaz önizlemesi, karakter listesi kartı, sıra şeridi/çekmece (`AvatarBadge`) ve savaş jetonu (`AvatarCircle`) aynı rozeti gösterir; soy kartında aynı renkte nokta. Yer: sağ alt köşe (sol üst durum simgeleri, sağ üst Zzz / hedef işareti, alt orta Prone gölgesi ve HP çubuğu dolu). Özel avatarda rozet yok.
- **Wild Shape biçim saldırılarında canavarın ek etkileri** (`AttackOption.beast`): canavar saldırısıyla aynı veri ve fonksiyonlar (`attack-riders.json`, `condition-effects.json`): ek hasar (zehir: Giant Spider, Giant Wasp, Venomous Snake, Scorpion…), koşullu hasar değişimi (Blood Hawk, sürüler), hücum (Boar, Elk, Giant Goat, Warhorse), yere düşürme (Wolf, Mastiff, Dire Wolf, Brown Bear, Tiger), yakalama (Giant Crab, Giant Frog, Crocodile, Giant Octopus, Giant Toad), süreli durum (Giant Centipede Poisoned). Süreli etkinin save'i `attackEffectEvents` (canavar yoluyla ortak, davranış aynı). Recharge'lı, save'li ve alan saldırıları biçimde yok (kapsam dışı listesi SABAH-RAPORU'nda).

## 2026-10-30 — Druid, Wild Shape ve Circle of the Land (Görev DRUID)

- **Wild Shape uygulandı** (veride 94 SRD Beast istatistik bloğu var; `src/battle/druid.ts`, komut `wild_shape`, bonus eylem). **SRD 5.2.1 kuralı izlendi, görevdeki "HP havuzu / taşan hasar" tarifi değil:** 5.2.1'de biçimin ayrı HP'si yok; Druid kendi HP'sini korur ve biçime girince Druid seviyesi kadar **geçici HP** alır. Biçimden: AC, hız, uçuş, boyut, STR/DEX/CON (ve bu save'ler), saldırılar (Beast saldırıları silah seçeneği olarak; Multiattack'ta saldırı sayısı tekrarların toplamı; recharge'lı ve save'li saldırılar ile saldırı ek etkileri yok), jeton (canavarın jetonu). Korunan: HP, INT/WIS/CHA, sınıf özellikleri, WIS/INT save'leri. Büyü yapılamaz (Beast Spells 18 hariç), süren konsantrasyon bozulmaz. Biçim bonus eylemle bırakılır; Incapacitated ya da 0 HP'de biter (her komutun sonunda). Biçim değerleri olayda (`shape_changed`), reducer eskilerini `shape.prev`te tutar: tekrar oynatma tutarlı. Bilinen biçimler oluşturucuda (Beast Shapes tablosu: 2. seviye 4 biçim CR 1/4, 4. seviye 6 biçim CR 1/2, 8. seviye 8 biçim CR 1 ve uçuş); seçilmezse savaşta en yüksek CR'li uygun biçimler. Saat cinsinden süre savaşta sınırsız sayılır.
- **Wild Resurgence** (`wild_resurgence`): kullanım yoksa en düşük slotla bir kullanım (turda bir, eylemsiz); kullanımla 1. seviye slot (uzun dinlenmede bir). **Primal Order:** Warden (varsayılan; Medium zırh, Martial silah) / Magician (ek cantrip; Arcana/Nature bonusu savaş dışı). **Elemental Fury:** Primal Strike (varsayılan; Divine Strike yolu: turda bir silah ya da Beast saldırısı isabetine 1d8, hedefe en iyi işleyen Cold/Fire/Lightning/Thunder; 15'te 2d8) ya da Potent Spellcasting. **Druidic:** Speak with Animals her zaman hazır. **Wild Companion:** Find Familiar kurulumda ritüelle zaten yapılır (`none`). **Archdruid:** Evergreen Wild Shape çalışıyor; Nature Magician Aşama 2.
- **Circle of the Land:** arazi seçimi oluşturucuda (varsayılan Temperate; uzun dinlenmede değişim = düzenleme): 3. ve 5. seviye arazi büyüleri her zaman hazır (seçeneğe bağlı `alwaysPrepared`), 7./9. Aşama 2. **Land's Aid** (eylem, Wild Shape kullanımı, 60 ft içindeki noktada 10 ft küre): düşmanlar CON save, 2d6 Necrotic (başarıda yarı; 10: 3d6, 14: 4d6); alandaki en yaralı dost aynı zarla iyileşir (SRD "seçtiğin yaratıklar"; oyunda düşmanlar ve en yaralı dost). **Natural Recovery:** Arcane Recovery ile aynı kısa dinlenme kuralı; daire büyüsünü slotsuz yapma Aşama 2. **Nature's Ward** (10): arazinin direnci; Poisoned bağışıklığı yok (durum bağışıklığı sistemi yok). Nature's Sanctuary Aşama 2.
- **Yapay zekâ:** zemin büyüleri mevcut kuralla, hasar veren alan (Moonbeam) artık tek güçlü (20+ HP) düşmana da; iyileştirme mevcut kuralla; slotu kalmamış Druid en güçlü bilinen biçime girer.
- Denge partilerinde Druid yok; yeni parti eklenmedi.

## 2026-10-30 — Bard ve College of Lore (Görev BARD)

- **Bardic Inspiration** (yeni etki türü `inspire`; veriden, zar SRD tablosunun "Bardic Die" sütunundan): bonus eylem, 60 ft içindeki başka bir dosta (kendine değil; bir yaratıkta bir zar) 1 saatlik süren etki. Zar dostun **başarısız** D20 Testinde (saldırı, save, kontrol) ikinci şans yolunda atılır ve eklenir (SRD: "fails a D20 Test"), atılınca etki biter. Oyuncuya sorulmaz, başarısızlıkta kendiliğinden (yapay zekâ ve oyuncu aynı; DECISIONS önceki ikinci şans kuralı). Font of Inspiration (5): kısa dinlenmede dolar (kaynak verisi `shortFrom: 5`) ve kullanım yoksa en düşük slot harcanarak (eylemsiz) verilir.
- **Jack of All Trades** (`stat: jackOfAllTrades`): yetkin olunmayan beceri kontrollerine ve inisiyatife (SRD 5.2.1'de inisiyatif DEX kontrolü) yetkinliğin yarısı (aşağı). Expertise mevcut yoldan.
- **Song of Rest SRD 5.2.1'de yok** (2014 kuralı); eklenmedi.
- 6+: Countercharm (7) Aşama 2 (save başarısızlığı tetiği yok), Magical Secrets (10) Aşama 2 (oluşturucuda liste genişlemesi), Superior Inspiration (18) **çalışıyor** (savaş başında en az 2), Words of Creation (20) Aşama 2.
- **College of Lore:** Bonus Proficiencies (+3 beceri, `classSkills`), **Cutting Words** (yeni tepki türü `cutting`; hedefin kendi tepkisinden sonra, hedefin tarafındaki Bard 60 ft içinde ve saldıranı görüyorsa; Bardic Inspiration kullanımı): zar isabeti çevirebiliyorsa (kritik değilse) saldırı zarından, yoksa hasardan düşülür. SRD'de hangi zara uygulanacağı tepki anında seçilir; oyunda atıştan sonra yararlı olana (sadelik). Kontrol başarısına ve büyü hasarına ayrı tetik yok (yalnızca saldırı isabeti). Yapay zekâ önerisi: ortalama zar isabeti çevirebiliyorsa ya da hasar ağırsa. Magical Discoveries (6) ve Peerless Skill (14) Aşama 2.
- **Yapay zekâ:** bonus eylem boşken en çok saldıran, zarı olmayan dosta Bardic Inspiration; hasarsız alan kontrol büyüsü (Hypnotic Pattern, Fear) en az üç düşmanı alıp dostu almıyorsa (konsantre değilken); iyileştirme ve Hold Person mevcut kurallarla.
- Denge partilerinde Bard yok; yeni parti eklenmedi.

## 2026-10-30 — Warlock ve Fiend Patron (Görev WARLOCK)

- **Pact Magic:** slotlar zaten tek seviyede (`spellSlotsFor`) ve kısa dinlenmede doluyordu; slot kaydı H-SLOT kalıbında (en çok + harcanan). **Magical Cunning** savaş dışı 1 dakikalık ayin olduğu için savaşta değil, dinlenme panelinde düğme: harcanan Pact slotlarının yarısı (yukarı), uzun dinlenmeye dek bir kez (`magicalCunningStatus`). Contact Patron (Contact Other Plane), Mystic Arcanum (6.–9. seviye), Eldritch Master: veride Aşama 2.
- **Eldritch Invocations** (veriden, `data/class-features.json` `invocations`; SRD 5.2.1'in 28 seçeneği; sayı tablonun "Eldritch Invocations" sütunundan; seviye ve ön koşul veriden; seçim karakterde `invocations`, tekrarlanabilenlerde `kimlik:Cantrip`). Savaşta: Agonizing Blast (her ışının hasarına CHA), Repelling Blast (her isabet eden ışında Large ve küçüğü 10 ft itme), Eldritch Spear (menzil + 30 × seviye), Armor of Shadows (Mage Armor kendine slotsuz; **zırhsızsa savaştan önce yapılmış sayılır**, 8 saat), Fiendish Vigor (False Life slotsuz, zarın en yükseği), Ascendant Step / Master of Myriad Forms / One with Shadows / Otherworldly Leap (kendine slotsuz Levitate, Alter Self, Invisibility, Jump), Devil's Sight (120 ft, büyülü karanlık dahil), Eldritch Mind (konsantrasyonda avantaj), Pact of the Blade (seçilen taşınan yakın dövüş silahı: yetkin, CHA; bonus eylemle çağırma ve hasar türü değişimi yok), Thirsting Blade / Devouring Blade (2/3 saldırı; **pact silahıyla sınırlanmaz**, sadelik), Eldritch Smite (`eldritch_smite` komutu: bu tur pact silahı isabetinden sonra, turda bir, en yüksek Pact slotu, (1 + slot seviyesi)d8 Force, kritikte iki katı, Gargantuan değilse Prone), Lifedrinker (turda bir pact isabetinde +1d6 Necrotic; HP zarıyla iyileşme yok), Pact of the Chain (Find Familiar slotsuz, özel biçimler Aşama 2), Pact of the Tome (+3 cantrip; ritüeller yok), Witch Sight (kısmi). Savaş dışı olanlar (Mask of Many Faces, Misty Visions, Whispers of the Grave, Gift of the Depths, Gaze of Two Minds, Gift of the Protectors) ⓘ'de Game Master notuyla; Lessons of the First Ones ve Investment of the Chain Master Aşama 2; Visions of Distant Realms Arcane Eye (4. seviye) olmadığı için Aşama 2.
- Slotsuz büyüler savaşçıda `atWill` (`self`: yalnızca kendine; yukarı slot seçilirse slot harcanır). Cantrip değişiklikleri `cantripMods`.
- **Fiend:** Dark One's Blessing (her komutun sonunda: düşman 0 HP'ye düşünce, düşüren Warlock'sa ya da düşman 10 ft içindeyse CHA + seviye geçici HP, en az 1), Fiend Spells (3. ve 5. seviye her zaman hazır; 7. ve 9. Aşama 2), Dark One's Own Luck (ikinci şans yolunda: başarısız kontrol ya da save'e 1d10, tutarsa kullanım; CHA kadar, uzun dinlenme; alt sınıf kaynakları için `classResources` alt sınıf alır), Fiendish Resilience (oluşturucuda Force dışı 12 türden biri, varsayılan Fire; dinlenmede değişim = oluşturucuda düzenleme), Hurl Through Hell Aşama 2 (veride).
- **Yapay zekâ:** Eldritch Blast puanı ışın sayısı ve Agonizing ile (ışınlar artık sayılıyor; denge partilerinde Warlock yok, eski partileri etkilemez); Hex büyü saldırısı yapabilen büyücüde de (işaret büyü saldırısına da ek zar verir); pact isabetinden sonra hedef 20+ HP'liyse ya da kritikte Eldritch Smite; Hold Person mevcut kuralla.
- Denge partilerinde Warlock yok; yeni parti eklenmedi (karar bekleyen: Warlock'lu parti).

## 2026-10-30 — Cleric dengesinin kaynağı (Görev K12)

- CLERIC'ten sonraki +3…+23 puanlık artışı ayırmak için kopyalarda özellikler tek tek kapatıldı (100 tohum, standart parti, 3. ve 5. seviye; tablo DENGE.md "K12"). Sanctuary ve Warding Bond denge partisinde yok (Tavi'nin listesinde değil): etkileri sıfır.
- **Farkın tamamı Channel Divinity yapay zekâsından** (Preserve Life + Divine Spark ile düşmüş dostu kaldırma): ikisi kapanınca değerler CLERIC öncesine döner (standart 3 Volkan 87 → 60; taban 64). Preserve Life tek başına kapanınca kısmen düşer (Volkan 74), Divine Spark tek başına kapanınca fark yok (Preserve kullanılmayınca Channel Divinity hakları Divine Spark kaldırmalarına gider). Life Domain pasifleri (Disciple of Life, Blessed Healer) ve her zaman hazır büyüler ±2 içinde.
- **Değişiklik yok:** Preserve Life ve Divine Spark SRD 5.2.1'e uygun (savaşta 2 kullanım, kısa dinlenmede 1 geri; Preserve Life en çok yarı HP'ye); sezgi her turu tekrarlamıyor (kullanım sınırlı; Preserve Life yalnızca iki Bloodied dost ya da biri çeyrek HP altındayken). Artış, partinin artık gerçek bir şifacı Cleric'e sahip olmasının sonucu; düşman listesi ayarı "Dungeondex öncesi tam test turu"na kaldı.

## 2026-10-30 — Seeking ve Transmuted Spell, Innate Sorcery kapsamı (Görev K11)

- **Seeking Spell** (1 SP, SRD 5.2.1 s. 67): büyü yapılırken seçilir; büyü saldırısı ıskalarsa d20 bir kez yeniden atılır, yeni sonuç geçerli ve puan yalnızca o zaman harcanır. Çok ışınlı büyüde (Scorching Ray) büyünün **ilk** ıskasında (her ışında ayrı ödeme yok; sadelik). Başka Metamagic ile birlikte (Empowered gibi sınıra sayılmaz). Yalnızca saldırı zarı olan büyüde.
- **Transmuted Spell** (1 SP): Acid, Cold, Fire, Lightning, Poison, Thunder hasarı bu listedeki başka türe; savaş ekranında tür düğmeleri, komutta `transmute` (verilmezse listede ilk farklı tür). Seçimli büyüde (Chromatic Orb, Sorcerous Burst) seçim yerine geçer.
- **Innate Sorcery yalnızca Sorcerer büyülerine:** savaşçıda `classSpells` (karakterin seçtiği ve sınıfın SRD listesinde olan büyüler). Soy büyüleri ve alt sınıfın her zaman hazır büyüleri (Draconic Spells) seçilmemişse dışarıda; ikisi de seçilmiş ve listedeyse sayılır. `classSpells` olmayan (canavar, test) savaşçıda eskisi gibi bütün büyüler.

## 2026-10-30 — Sorcerer ve Draconic Sorcery, Sorcerous Burst, True Strike (Görev SORCERER)

- **Veriden** (`src/battle/sorcerer.ts`; kodda sınıf adı yok): yeni etki türü `innate`, işaretler `sorcery-incarnate`, `affinity-<tür>`; kaynaklar `sorceryPoints` (veride `cap` ve `slotCost`: SRD Creating Spell Slots tablosu), `sorcerousRestoration`; Metamagic sayıları (2/10/17 → 2/4/6) ve bedelleri özelliğin `metamagic` verisinde.
- **Innate Sorcery:** bonus eylem, 10 tur: büyü save DC'si +1, büyü saldırılarında avantaj. SRD "Sorcerer büyüleri" der; karakterin bütün büyülerine uygulanır (soy büyüleri dahil; küçük sapma).
- **Font of Magic:** slot → puan eylemsiz (SRD'de eylem yok), tavan (`resourceCap`) aşılmaz; puan → slot bonus eylem, 1–5. seviye, seviye sınırı tablodan. Arayüzde iki düğme: en düşük dolu slotu puana, alınabilen en yüksek slotu yarat. Savaşta yaratılan slot savaş sonunda slot en çoğuna kırpılır (SRD: uzun dinlenmede kaybolur).
- **Metamagic** (sihirbazda seçim, `sheet.metamagic`; büyüde `cast_spell.metamagic`): Careful (CHA kadar, en az 1, dost alanda etkilenmez: Sculpt Spells yolu; SRD "save'i geçer, yarı hasar almaz" ile aynı sonuç), Distant (menzil ×2, dokunuş 30 ft; kendinden menzilde yok), Empowered (CHA kadar ortalamanın altındaki en düşük zar yeniden; başka seçenekle birlikte), Extended (≥1 dakikalık etkinin süresi ×2; konsantrasyon avantajı yok), Heightened (tek hedefte hedefin, alanda ilk düşmanın save'i dezavantajlı), Quickened (eylemlik büyü bonus eylemle; turda bir slotlu büyü kuralı sürer), Subtle (Counterspell tetiklenmez, sessizlik engellemez), Twinned (yukarı slotta ek hedef alan büyüde etkin seviye +1). Bir büyüye tek seçenek; Sorcery Incarnate + Innate Sorcery etkinken iki. **Seeking ve Transmuted Spell yok** (karar bekliyor: Seeking ıskada yeniden atış, Transmuted tür değişimi; ikisi de eklenebilir).
- **Sorcerous Restoration:** kısa dinlenmede seviye/2 (aşağı) puan, uzun dinlenmeye dek bir kez; puan eksik değilse harcanmaz. **Sorcery Incarnate (7):** Innate Sorcery kullanımı bitince 2 puanla. **Arcane Apotheosis (20):** `none`, Aşama 2 (tur başı kaynak yenilenmesi yok).
- **Draconic Sorcery:** Resilience (HP +1 × seviye, `hpPerLevel`; zırhsız AC 10 + DEX + CHA, Unarmored Defense yolu genişletildi: her yetenek), Draconic Spells (3: Alter Self, Chromatic Orb, Command, Dragon's Breath; 5: Fear, Fly; 9: Summon Dragon; 7. seviye Arcane Eye ve Charm Monster ile Legend Lore oyunda yok), Elemental Affinity (6; **tek seçim**: SRD 5.2.1'de soy rengi yok, beş hasar türünden biri; varsayılan Fire; direnç `options[].resist`; türdeki büyünün hasarına CHA bir kez), Dragon Wings ve Dragon Companion `none` (Aşama 2).
- **Sorcerous Burst:** patlayan zar (`explode: 8`): 8 gelen her zar için ek d8, zincirleme, en çok büyü değiştiricisi kadar; ek zarlar isabet olayında ayrı satır. Yapay zekâ hedefe en çok işleyen türü seçer (eşitse Fire).
- **True Strike:** silahın büyülü bonusu (`AttackOption.enchant`) saldırı ve hasarda korunur; 5+ seviye ek Radiant zarı süren etki yerine saldırının kendi ek zarı (`hitExtra`): yalnızca isabette, savaşçıda iz bırakmaz.
- **Yapay zekâ:** Innate Sorcery bonus eylemle, eylem duruyor ve hasar büyüsü varken; Metamagic ve Font of Magic kullanmaz (basit sezgi; denge partilerinde Sorcerer yok, yeni parti eklenmedi).
- Kayıt sürümü 19 kaldı: yeni olay `slot_created` ve komut alanları ekleme.

## 2026-10-30 — Wizard ve Evoker, Wizard büyüleri (Görev WIZARD)

- **Sınıf:** Arcane Recovery kısa dinlenmede otomatik (uzun dinlenmeye dek bir kez; `arcaneRecovery` kaynağı): toplam seviyesi Wizard seviyesinin yarısını (yukarı) aşmayan, 6. seviyenin altındaki slotlar **en yüksekten başlayarak** geri gelir (seçim arayüzü yok; en değerli slot önce). Ritual Adept kısmi (ritüeller kurulumda), Scholar önceki gibi (uzmanlık), Memorize Spell savaş dışı, Spell Mastery (18) ve Signature Spells (20) Aşama 2 (seçim arayüzü yok).
- **Evoker:** Potent Cantrip (save'li cantrip başarıda yarı hasar), Sculpt Spells (6; Evocation alan büyüsünde 1 + büyü seviyesi kadar dost etkilenmez, **otomatik**: alandaki dostlar sırayla, büyücü dahil), Empowered Evocation (10; Evocation hasarına INT, büyü başına bir kez: tek zar toplamına eklenir), Overchannel (14) Aşama 2. Evocation Savant savaş dışı.
- **Blink:** kendine, 1 dakika, konsantrasyonsuz. Tur sonu d20 11+ → sonraki turunun başına dek Ethereal (`isTargetable` false: saldırı, büyü ve alanlar etkilemez); dönüşte aynı altıgen (SRD: 10 ft içinde boş yer; yer seçimi yok).
- **Sleep ikinci aşaması:** süreli durumda `escalate` + `wakeOnDamage` (`data/condition-effects.json`): başarısız save Incapacitated, tur sonu tekrar save; ikinci başarısızlıkta save'siz Unconscious (kalan süre), hasar alınca uyanır (reducer). Yanındakinin eylemle uyandırması yok.
- **Dispel Magic:** yaratıktaki etkilerin yanında büyüyle çağrılmış yaratık (`summon_vanished`, neden `dispelled`), silahtaki büyü güçlendirmesi (`buff_removed`) ve **altıgen hedefte** o altıgeni kaplayan büyü alanları (`zone_ended`). Slotun üstündeki büyüde yetenek kontrolü DC 10 + seviye, her biri ayrı. Eşya/nesne büyüleri yok.
- **Hold Person, Blindness/Deafness yukarı slotta ek hedef:** `targetIds` ile çok hedefli save (`executeSaveMany`): yuva ve konsantrasyon bir kez, her hedef ayrı save. SRD'nin "hedefler birbirine 30 ft içinde" kuralı denetlenmez (her hedef menzilde olmalı). Arayüzde hedef seçimi mevcut çoklu hedef kipiyle (etki büyüleri gibi).
- **Chromatic Orb:** tür seçimi (`damageChoices`; Acid, Cold, Fire, Lightning, Poison, Thunder) ve sıçrama (`leap`): hasar zarlarından ikisi aynıysa 30 ft içindeki en yakın, daha önce vurulmamış düşmana yeni saldırı; slot seviyesi kadar. Hedef seçimi otomatik (en yakın).
- **Yapay zekâ:** Hold Person güçlü (≥20 HP) humanoid düşmanlara, en yüksek uygun slotta mümkün olduğunca çok hedef; yalnızca en çok 3 düşman ayaktayken, konsantre değilken ve sürdürülen daha güçlü büyü (Spirit Guardians) yokken (kuyruk sonu regresyonu: kısıtsız kural Kale 5'te paladin partisini 87% → 68% düşürüyordu, büyücü Fireball yerine tek hedef felç seçiyordu). Sleep ve Fireball mevcut alan büyüsü kuralıyla, Counterspell tepki önerisiyle.
- Büyü denetiminde "yok" 0 (Blink eklendi).

## 2026-10-30 — Rahip yapay zekâsı (Görev CLERIC, 3. kısım)

- Basit sezgiler (`clericChoice`, veriden; iki tarafta da çalışır, çünkü canavarlarda bu özellikler yok): eylem varken iki ya da daha çok Bloodied dost (ya da biri çeyrek HP'nin altında) → Preserve Life; 30 ft içindeki Undead'lerin toplam HP'si ≥ 15 → Turn Undead; 30 ft içinde düşmüş dost → Divine Spark ile kaldır. Bonus eylem varken: kendisi üçte bir HP'nin altında ve 10 ft içinde düşman varsa Sanctuary kendine. İyileştirme büyüleri ve Bless önceki kurallarla (düşmüş dosta iyileştirme, Bless iki ya da daha çok dosta).
- Düşman tarafında rahip yok: canavarların büyü eylemleri desteklenmiyor (Bilinen eksikler); kural iki tarafa açık, düşman tarafında sınıf karakteri olursa çalışır.

## 2026-10-30 — Sanctuary, Warding Bond, Bestow Curse seçenekleri (Görev CLERIC, 2. kısım)

- **Sanctuary** (`src/battle/wards.ts`, `execute` içinde komuttan önce): korunanı saldırı (silah, yan el, bonus vuruş, canavar saldırısı, Multiattack, Horde Breaker, Haste) ya da zararlı tek/çok hedefli büyüyle hedef alan **düşman** önce WIS save yapar (DC büyücününki; `sanctuary_save` olayı). Başarısızsa **saldırı/büyü boşa gider**: eylem/saldırı harcanır, büyü yuvası harcanmaz, hedef değiştirme seçimi yok (SRD "yeni hedef seç ya da kaybet"; oyunda kaybet). Alan etkileri ve fırsat saldırısı (komut değil, tepki) etkilenmez. Korunan saldırınca, büyü yapınca ya da hasar verince biter (`breakOnAct`).
- **Warding Bond:** hedefe +1 AC, bütün save'lere +1 (`saveMod`), bütün hasar türlerine direnç; 1 saat, konsantrasyonsuz. Her komutun sonunda (bütün hasar yolları dahil: saldırı, büyü, alan, harita, tur başı/sonu etkileri) bağlı hedefin HP + geçici HP kaybı kadar büyücüye `bond_damage` (geçici HP'den düşen de "hasar alma" sayılır; aynı komuttaki iyileştirme net kayıpla birlikte hesaplanır). Büyücü 0 HP'ye düşünce ya da 60 ft'ten uzaklaşınca biter. Büyücünün kendisine yapılması engellenmedi (kısmi).
- **Bestow Curse:** dört seçenek tek seçim listesinde (`choices`: altı yetenek + `attack`, `turn`, `damage`; seçim yoksa ilk yetenek, eski davranış). `attack`: lanetleyene saldırılar dezavantajlı (`attackDisVs`). `turn`: tur başında WIS save, başarısızsa o tur eylem yok (`curse_save`; hareket ve bonus eylem serbest; SRD "action"). `damage`: lanetleyenin saldırı isabetlerine (silah ve büyü saldırısı) +1d8 Necrotic; save'li büyülere eklenmez (kısmi). Yukarı slot süreleri K9b'de. Remove Curse dört seçeneği de kaldırır (aynı etki kimliği).
- Kayıt sürümü 19 kaldı: yeni olaylar (`sanctuary_save`, `bond_damage`, `curse_save`) ekleme; eski kayıtlarda yok.

## 2026-10-30 — Cleric çekirdeği ve Life Domain (Görev CLERIC, 1. kısım)

- **Veriden** (`data/class-features.json`, `data/subclasses.json`; kodda sınıf adı yok): yeni etki türleri `divineSpark`, `turnUndead`, `preserveLife` (`src/battle/cleric.ts`), yeni işaretler (protector, thaumaturge, sear-undead, divine-strike, potent-spellcasting, improved-blessed-strikes, disciple-of-life, blessed-healer, supreme-healing). Bir kaynağı harcayan birden çok eylem için `FeatureMechanic.actions` (Channel Divinity → `cleric:channel-divinity/divine-spark`, `/turn-undead`).
- **Divine Order:** seçenek verisinde eğitim (`options[].armor`, `martialWeapons`, `cantrips`; `optionTraining`). Varsayılan **Protector** (SRD'de sıra yok; savaş oyununda zırh/silah eğitimi daha belirleyici). Thaumaturge: +1 cantrip; Arcana/Religion WIS bonusu savaş dışı (beceri kontrolü yok). `armorProficient`/`weaponProficient`/`spellLimits` isteğe bağlı `featureChoices` alır; sihirbaz, motor ve K9d uyarısı aynı sonucu gösterir.
- **Divine Spark:** dosta iyileştirme (zar + WIS), düşmana CON save'li hasar (başarıda yarı); tür seçilmezse hedefe daha çok işleyen (Necrotic/Radiant). Zar sayısı SRD eşikleri 2/7/13/18 → 1–4d8.
- **Turn Undead:** 30 ft içindeki her Undead WIS save; başarısızsa 1 dakika Frightened + Incapacitated, hasar alınca biter (`breakOnDamage: true`; SRD "takes damage"). "Senden uzaklaş" zorlaması yapay zekânın Frightened davranışına bırakıldı. **Sear Undead (5):** başarısızlara WIS değiştiricisi kadar d8 (en az 1) Radiant, tek zar bütün hedeflere.
- **Blessed Strikes (7):** seçenek (varsayılan Divine Strike): turda bir silah isabetine +1d8 Necrotic/Radiant (hedefe iyi işleyeni), Improved (14) 2d8. Potent Spellcasting: cantrip ölçekli hasar büyülerine WIS (Cleric listesi ayrımı yapılmadı; Cleric'in cantrip'leri neredeyse hep Cleric listesinden). Improved Potent Spellcasting'in geçici HP'si yok (kısmi).
- **Life Domain:** Disciple of Life (+2 + slot, her iyileştirilen hedefe), Blessed Healer (6), Supreme Healing (17; Divine Spark iyileştirmesi dahil en yüksek zar), Preserve Life (5 × seviye, en yaralıdan başlayarak yarı HP'ye dek; Bloodied = yarı HP'nin altında), alan büyüleri 3 ve 5. seviyede her zaman hazır; 7 ve 9. seviye büyüleri Aşama 2.
- **Divine Intervention (10)** ve **Greater Divine Intervention (20):** veride `status: none`, "Aşama 2" (5. seviyeye dek Cleric büyüsü / Wish; oyunda 4.+ seviye büyü yok). Karar bekleyen.
- Arayüz: Divine Spark hedef seçer (Lay On Hands kipiyle aynı); Turn Undead ve Preserve Life tek tık. Seçenek adları TR/EN.

## 2026-10-30 — Sınıf kaynakları ve HP için en çok + harcanan (Görev K10)

- **Bulgu:** kayıtlı durumda kaynaklar "kalan" olarak tutuluyor, seviye/sınıf değişince `min(yeni en çok, kalan)` ile kısılıyordu: Rage 2'si dolu Barbarian 3. seviyeye çıkınca 2'de kalıyor, hepsi harcanmışsa yeni hak 0'da takılıyordu (dinlenene dek). HP'de de aynı: dolu karakter seviye atlayınca eski en çokta kalıyordu.
- **Düzeltme (H-SLOT kalıbı):** `CharacterStatus.resourceMax` ve `hpMax` (kayıt anındaki en çoklar). Harcanan = en çok − kalan; yeni tablodan yalnızca harcanan düşer, yeni kazanılan kaynak dolu gelir. HP: alınan hasar korunur, 0 HP 0 kalır (savaş dışı ya da ölü). Savaş sonu (`applyBattleResult`), kısa/uzun dinlenme en çokları taşır. Bütün kaynaklar ortak yoldan (Rage, Channel Divinity, Second Wind, Action Surge, Focus, Lay On Hands, Bardic Inspiration, Sorcery Points…); kaynak listesi `classResources`.
- **Eski kayıt:** açılışta bir kez (`repairSlots`, App): en çoğu olmayan durumda kaynaklar tabloya tamamlanır (H-SLOT'taki slot onarımıyla aynı cömert seçim: eski "kalan" hangi seviyeye ait bilinmiyor), HP olduğu gibi kalır ve `hpMax` yazılır. Bildirim metni "Büyü yuvaları ve sınıf kaynakları … tamamlandı". Karakter kaydı (`rpg-battle-karakterler`) savaş kaydından ayrı; savaş kaydı sürümü (19) değişmedi.

## 2026-10-30 — Eğitimsiz kalkan: SRD doğrulaması (Görev K9d-kalkan)

SRD 5.2.1, s. 92, "Armor Training" (depodaki `docs/SRD_CC_v5.2.1.pdf`, `pdftotext -raw` çıktısından birebir):

> Armor Training
> Anyone can don armor or hold a Shield, but only those with training can use them effectively, as explained below. A character's class and other features determine the character's armor training.
> A monster has training with any armor in its stat block.
> Light, Medium, or Heavy Armor
> If you wear Light, Medium, or Heavy armor and lack training with it, you have Disadvantage on any D20 Test that involves Strength or Dexterity, and you can't cast spells.
> Shield
> You gain the Armor Class benefit of a Shield only if you have training with it.

- **Sonuç:** dezavantaj ve büyü yasağı yalnızca Light/Medium/Heavy zırh için; kalkan bölümü yalnızca AC bonusunu kaldırır. Metin eğitimsiz kalkanı dezavantaj/büyü yasağıyla **kapsamıyor**; K9d'deki davranış (eğitimsiz kalkan AC vermez, başka ceza yok) kalır. Motor değişmediği için regresyon koşulmadı; davranışı sabitleyen test eklendi (`k9d.test.ts`). Sihirbaz uyarısı zaten "kalkan AC vermez" diyor.

## 2026-10-30 — Soy renkleri: çalışma anında palet değiştirme (Görev K8b)

- **Kullanıcı kararı:** soyu olan bütün ırklar renkle ayrışır, yeni görsel üretilmez. **Seçilen yol: çalışma anında** (`src/ui/tint.ts`): jeton görseli bir kez canvas'a çizilir, ırkın ton aralığındaki pikseller (ten/pul) soyun hedef tonuna, doygunluğuna ve açıklığına taşınır (ton farkının yarısı korunur, gölgeler kalır), sonuç nesne URL'si olarak bellekte önbelleklenir. Derleme yolu 456 yeni dosya (≈10 + 1,6 MB) üretirdi; çalışma anı **sıfır ek indirme**, ana parçaya ≈3 kB (veri `data/soy-renkleri.json` + dönüşüm). Ana parça 412,9 → 415,9 kB.
- **Tek kaynak:** `sheetAvatar` soy rengini avatara (`Avatar.tint`) yazar; savaş jetonu (SVG), sıra şeridi/çekmece, karakter listesi ve sihirbaz önizlemesi aynı `useTinted` kancasıyla aynı rengi gösterir. Soy değişince önizleme anında yeniden boyanır (256 px jeton <5 ms). Yalnızca `characters/` görselleri boyanır; özel avatar (`sheet.avatar`) ve baş harfli yedek olduğu gibi. Boyama başarısız olursa asıl görsel gösterilir.
- **Eşleme** (`data/soy-renkleri.json`): Dragonborn ejderha rengi (pul; Black koyu, Blue, Brass, Bronze, Copper, Gold, Green, Red, Silver çelik mavisi, White); Tiefling Abyssal mavi, Chthonic koyu mor-gri, Infernal kırmızı; Elf Drow koyu mor ten, High Elf açık, Wood Elf bronz; Gnome Forest zeytin, Rock pembe-kızıl; Goliath atasına göre (Fire kızıl, Frost buz mavisi, Hill toprak, Storm koyu mavi, Cloud açık, Stone temel gri). Ton aralığı 360°'yi sarabilir (Gnome).
- **Sınırlar:** ten/pul tonuna yakın eşyalar da boyanır (Dragonborn'da altın zırh süsleri, deri kemer, asa; Tiefling'de magenta cüppe). Goliath'ta gri ten ile metal zırh aynı ton/doygunlukta: ten az değişir, zırh renklenir. Yetersiz kalanlar SABAH-RAPORU'nda (rozet ya da ek görsel kararı kullanıcıda). Rozet yedeği uygulanmadı.

## 2026-10-30 — Büyülenme yalnızca büyücü tarafının hasarıyla biter (Görev K2c)

- SRD 5.2.1 Charm Person ve Animal Friendship: büyü, büyücü ya da dostları hedefe hasar verince biter. Süren etkide `breakOnDamage: 'casterSide'` (eski `true` davranışı Suggestion, Hypnotic Pattern ve Calm Emotions'ta aynen sürer; onlarda SRD "herhangi bir hasar" der).
- **Hasarın kaynağı reducer'da olaydan okunur** (`damageSourceId`): saldırı (`attack_resolved`), save'li hasar (`save_resolved`, alan büyüleri ve nefesler dahil), ek hasar (`extra_damage`), süregelen etki (`effect_tick` → etkinin sahibi), büyü alanı (`zone_triggered` → alanın büyücüsü). Kaynağın tarafı etkiyi koyanın tarafıyla aynıysa biter (büyücünün çağırdığı yaratık da dost sayılır). Harita/ortam hasarı (lav, tuzak, düşme) ve kaynağı belirsiz hasar bitirmez. Olay biçimi değişmedi; kayıt sürümü 19.
- Denetim: Animal Friendship "tam", Charm Person yalnızca "dostluk tutumu ve sosyal avantaj yok" notuyla kısmi.

## 2026-10-30 — Açılış katmanlarının çözünürlüğü (Görev K2b)

- **Ölçüm:** açılış sahnesi `min(90vw, 900px, 70vh × oran)`; geniş logo sahnenin tam enini kaplar. 1400 px'lik `logo-acilis` 1× ekranda 1,56×, 3× telefonda (390 px ekran → ≈350 px sahne → ≈1050 aygıt pikseli) yeterliydi; **2× masaüstünde (900 CSS px = 1800 aygıt pikseli) 0,78× yoğunlukla büyütülüyordu** (L6'daki "kanatlar ≈1,3 kat büyütülüyor" notu). Kapalı logo katmanları (900 px kare) da sahne yüksekliğinde 2×'te yetmiyordu.
- **Karar:** `WIDTH.acilis` 1400 → 1800, `CLOSED_WIDTH` 900 → 1200 (kaynaklar 2624 ve 2048 px; büyütme yok). `npm run logo` yeniden üretti; `data/logo.json`'da yalnızca piksel ölçüleri ve bayt sayıları değişti, oransal kutular/noktalar aynı (hizalama korunur). 3× masaüstü (nadir) için 2700 px gerekir; kaynak 2624 px olduğundan yapılmadı.
- **Boyut:** açılış dosyaları toplam 243 → 328 kB (logo-acilis 84 → 112, kapalı gövde 32 → 45, kapalı kanat 31 → 42, gövde 32 → 42, kanatlar 2×20 → 26+27, yazı 24 → 31 kB). Ana parça değişmedi (413,0 kB; görseller `public/`'te, ayrı istek). Açılışta yalnızca koyu zemin gösterildiği, logo çözülünce başladığı için daha büyük dosya ilk boyamayı geciktirmez; 600 ms içinde gelmezse statik logo kuralı sürer.

## 2026-10-30 — "Zarla 4d6" yöntemi (Görev K2a)

- Puanlar adımına üçüncü yöntem: **Zarla (4d6)** (SRD 5.2.1 Random Generation: 4d6, en düşük atılır, 6 kez). Saf adım `rollAbilityScores(rng)` (`src/rules/builder.ts`), zarlar `kind: 'ability'` etiketiyle.
- **İki yol, tek fonksiyon:** "Zarları at" (Math.random, otomatik) ve "Masa zarıyla gir" (elle zar defteri `useDiceFlow`: her 4d6 grubu `DicePrompt` ile istenir, grupta "Otomatik at" da var). Sihirbazda Game Master zar modu yok (savaş kurulumunda seçilir), bu yüzden seçim oyuncuya bırakıldı.
- **Yeniden atma yok:** atılan altı değer karakterde `rolled` olarak kalır (isteğe bağlı alan; eski kayıtlar etkilenmez); yöntemi değiştirip geri dönmek aynı değerleri getirir, yeni atış düğmesi bir daha çıkmaz. Yeni karakter oluşturmak yeni atıştır (engel yok; masa kuralı Game Master'a kalır).
- **Yerleştirme** standart dizideki gibi: kutuya dokun, çip seç, iki kutu yer değiştirir. Tekrarlanan değerler ayrı çip. İlk dağılım sınıfın yetenek önceliğiyle (büyükten küçüğe). Denetim: `usesRolled` (değerlerin bir dağılımı), atılmadan "Skorlar için zar atılmalı (4d6)" eksiği. Puan sınırı yok (3–18).

## 2026-10-30 — Dağıtılmamış geçmiş bonusu (Görev K9e)

- Kaydı engellemez ve "Eksikler" listesine girmez (K4 kararı sürüyor). Özet adımında yumuşak uyarı satırı: "⚠ Geçmiş bonusu dağıtılmadı (kaydı engellemez; Puanlar adımında +2/+1 ya da +1/+1/+1)". Geçerli dağılım (+2/+1 ya da +1/+1/+1) yapılınca uyarı kalkar; yarım dağılım da uyarı sayılır. Eski kayıtlar etkilenmez (yalnızca sihirbazın Özet görünümü).

## 2026-10-30 — Eğitimsiz zırh cezası (Görev K9d)

- **SRD 5.2.1 "Armor Training" (s. 92):** Light/Medium/Heavy zırhta eğitim yoksa Güç ya da Çeviklik içeren her d20 Testinde dezavantaj ve büyü yapılamaz. **Kalkan farklı:** eğitim yoksa kalkanın AC'si alınmaz (dezavantaj yok). Görevde "kalkan dahil" yazıyordu; SRD'ye uyuldu: eğitimsiz kalkan yalnızca AC vermez (`deriveStats`; özet ve savaş aynı AC'yi gösterir). Kalkana da dezavantaj istenirse tek satırlık değişiklik (`create.ts` `untrained` koşuluna kalkan eklenir).
- **Motor:** `combatantFromSheet` eğitimsiz zırhta kalıcı etki `armor:untrained` ekler (Görev K5 ağır yük etkisiyle aynı kalıp): saldırılar dezavantajlı (`attackDis`; oyunda saldırılar STR ya da DEX'le yapılır, büyü saldırısı zaten yok), STR/DEX save ve kontrolleri dezavantajlı (`saveDis`, `checkDis`), `noCast` (her büyü reddedilir: cantrip, soy büyüsü, kaynaklı büyü dahil). Eğitim yalnızca sınıftan (`armorTraining`); SRD 5.2.1'de zırh eğitimi veren köken feat'i yok, Cleric Divine Order (Protector) oyunda yok.
- **Yapay zekâ:** `castable` eğitimsiz zırhta boş; dezavantaj zar katmanında olduğu için ayrıca kural gerekmedi.
- **Sihirbaz:** Donanım adımında yetkinlik rozetinin altında uyarı ("Bu zırhta eğitimin yok…", kalkanda "kalkan AC vermez"); kaydı engellemez.
- **Örnek karakter düzeltmesi:** simülasyon partisindeki Tavi (Cleric) Chain Mail (Heavy) giyiyordu; Cleric'in SRD eğitimi Light, Medium ve Shield. Half Plate Armor'a (Medium, AC 15) geçirildi; AC 18 → 17. `src/demo.ts` ve test fikstürleri uyumlu.

## 2026-10-30 — Dikey hareket bayrağı (Görev K9c)

- **Yeni yükseklik modeli yok.** Haritadaki yükseklik farkı maliyeti (`climb` kuralı) ve zemin engeli için iki bayrak (`src/battle/flight.ts`): havada olan (`isAirborne`: Fly, Levitate, Gaseous Form, uçuş hızı) yükseklik farkı maliyetini ve zemin engelini (zorlu arazi, yer etkileri; `flyersPass` engeller) yok sayar; bu zaten S1'den beri böyleydi, yalnızca belgelendi. Tırmanan (`climbs`: Spider Climb etkisi `climb`, Thief Second-Story Work) yalnızca yükseklik farkı maliyetini yok sayar; zorlu zemin, engel ve yer etkileri sürer.
- **Diğer SRD sınırları kalır:** Levitate yürütmez (yalnızca itme/çekme), Gaseous Form uçuş hızı 10 ft ve saldıramaz.
- **Spider Climb:** süren etki (konsantrasyon, 1 saat, yukarı slotta +1 hedef). Duvarda/tavanda durma yok (harita altıgen).
- **Jump:** süren etki (1 dakika, konsantrasyonsuz, bonus eylem, yukarı slotta +1 hedef) `jumpFt: 30`. SRD 5.2.1: turda bir kez 10 ft hareket harcayarak 30 ft'e kadar zıplar. Oyunda mevcut atlama komutuna bağlandı: menzil 30 ft, maliyet 2 altıgen (iniş zemininden bağımsız), aradaki **tek** engel altıgeninin (sütun, ağaç, kapı…) üstünden geçer; hendek ve derin su zaten engel değil (menzil yeterse atlanır). Büyü yalnızca gerekince harcanır (normal atlama yetmiyorsa ya da daha pahalıysa); turda bir kez `traitTurns` (`spell:jump`, `jumped` olayında isteğe bağlı alan; kayıt sürümü değişmedi). Yüksek atlama ve lav adası atlaması değişmedi.
- **Yapay zekâ:** Jump ve Spider Climb'ı kendisi yapmaz; etkisi varsa yol ve atlama arayışı aynı motor denetiminden geçtiği için kullanır. Simülasyon partilerinde bu büyüler yok; davranış değişmediği için regresyon koşulmadı.

## 2026-10-30 — Yukarı slot etkileri (Görev K9b)

- **Tarama:** `docs/harita/UPCAST.md` (`node scripts/upcast-tarama.cjs`): SRD'de "Using a Higher-Level Spell Slot" metni olan, savaşta kullanılan 61 büyü. Uygulanan 52, kısmen 1 (Chromatic Orb: zar ölçeği var, aynı zarla sıçrama yok), savaşta etkisiz 2 (Hunter's Mark, Hex: yalnızca süre), karar/ayrı iş 6, uygulanmayan 0.
- **Bulgu:** zar ve hedef ölçeği olan büyülerin çoğunda (Fireball, Lightning Bolt, Cure Wounds, Healing Word, Bless, Command, Invisibility…) kod yolu `upcast`'i zaten geçiriyordu ama veride `applied` bayrağı yoktu; motor bu yüzden yukarı slotu yok sayıyordu. Bayrak eklendi; iyileştirme yolu da artık `damageExpr`'e slotu geçiriyor.
- **Yeni ölçekler (veride `mechanics.upcast`, motor `atSlot(spell, slot)`):** `radiusFt` (Fog Cloud +20 ft yarıçap), `burstDice` (Ice Knife patlaması +1d6), `bonusBySlot` (Magic Weapon 3–5. slot +2, 6+ +3), `durationBySlot` (Bestow Curse 4. slot 10 dk, 5+ 8 saat ve konsantrasyonsuz; 7+ "Until Dispelled" 8 saat sayılır, savaşta fark yok). Dragon's Breath nefes zarı +1d6 (süreli tekrarda da), Enhance Ability ve Gaseous Form +1 hedef.
- **Ayrı iş/karar:** Hold Person ve Blindness/Deafness çok hedef (tek hedefli save komutu; çok hedef arayüzü gerekir), Animate Dead sayı denetimi, Dispel Magic kendi kuralında, Jump ve Spider Climb K9c.

## 2026-10-30 — 18 savaş dışı büyü (Görev K9a)

- Mending, Message, Alarm, Create or Destroy Water, Identify, Illusory Script, Augury, Magic Mouth, Prayer of Healing, Rope Trick, Zone of Truth, Clairvoyance, Glyph of Warding, Magic Circle, Nondetection, Phantom Steed, Speak with Plants, Tiny Hut `offCombat` + Game Master notu (TR `gmNote`, EN yeni `gmNoteEn`). Prayer of Healing (10 dk), Glyph of Warding (1 saat yazım) ve Magic Circle (1 dk, alan hazırlığı) savaş süresine sığmadığı için savaş dışı; Tiny Hut ritüel ve 1 dk.
- Denetimde "yok" 23 → 5 (Jump, Sanctuary, Spider Climb, Warding Bond, Blink); Wizard'ın 0–3. seviye SRD büyülerinin hepsi oyunda (k6 testi artık kilitli 4+ seviyedeki soluk satıra bakıyor).

## 2026-10-30 — Saldırı ve büyü sayısı denetimi (Görev K7)

- Denetim `docs/harita/SALDIRI-DENETIMI.md`: 12 sınıfın 1–5. seviye Attack eylemi saldırı sayıları (Fighter 11/20 dahil), bonus eylem ve tepki saldırıları, ustalıklar, cantrip ölçeği, ışın sayıları, tur sınırları SRD 5.2.1 ile karşılaştırıldı.
- **Düzeltilen:** Magic Missile ve Scorching Ray'in yukarı slottaki ek dartı/ışını uygulanmıyordu (`upcast.rays` vardı, `applied` yoktu). Artık ışın sayısı = temel + yukarı slot × `upcast.rays` (`applied: true`). Hızlı regresyonda paladin 5 Mağara +4 puan (DENGE.md).
- **Uyumlu bulunan, değiştirilmeyen:** Extra Attack, Light/Nick ek saldırısı, Martial Arts ve Flurry (2 vuruş), fırsat saldırısı, Cleave turda bir, Sneak Attack turda bir, Spirit Guardians yaratık başına turda bir, Divine Smite bonus eylem + turda tek yuva, Haste ek eylemi tek saldırı, cantrip ölçeği 5/11/17, Eldritch Blast ışınları.
- **Karar bekleyen:** Warlock Eldritch Invocations (Thirsting Blade ile Extra Attack, Agonizing Blast…) sistemi yok.

## 2026-10-30 — Büyü seçim sınırları ve sınıf büyü listeleri (Görev K6)

- **Sayılar SRD sınıf tablolarından** (`data/srd/classes.json`, eksik tablo yok): "Cantrips", "Prepared Spells" sütunları ve yuva tablosundan en yüksek büyü seviyesi (`spellLimits`). Warlock'ta 2024 SRD'de "bilinen büyü" yok, tablo "Prepared Spells" sütunu sayılır; Pact Magic yuvaları mevcut hesapla. Wizard büyü kitabı 6 + seviye başına 2 (`data/classes.json` `spellbook`; karakterde isteğe bağlı `spellbook`, eski kayıtta hazırlananlar kitapta sayılır).
- **Sayılmayanlar:** her zaman hazır büyüler (Paladin yemin büyüleri, Divine Smite), soy büyüleri ve Blessed Warrior gibi seçenekten gelen cantrip'ler (ayrı sınırı var).
- **Sınıf listeleri:** `data/sinif-buyuleri.json`, SRD büyü verisinin `classes` alanından türetilir (test SRD ile aynılığını denetler; 30 kB, yalnızca oluşturucu parçasında). Oyunda kaydı olan büyü kimlikle bağlı; olmayan "oyunda yok" diye soluk ve seçilemez. SRD'de alt sınıfa bağlı ek büyü listesi (ör. Wizard listesini kullanan alt sınıf) yok.
- **Sihirbaz:** Büyüler adımı cantrip ve seviye grupları; sayaçlar (Cantrip, Hazırlanan, Wizard'da Büyü kitabı); sınıra gelince seçilmemiş düğmeler kapalı; erişilemeyen seviyeler kilitli (açılır, salt okunur). Wizard'da önce "Kitap", sonra "Hazır". Seviye düşünce ya da sınıf değişince büyüler artık **ayıklanmıyor**: fazla seçim Özet'te "Hazırlanan büyü fazla (n / m)", liste dışı büyü "… seçilemez" eksiği.
- **Savaş menüsü:** zaten yalnızca hazırlanan büyüler + cantrip'ler + her zaman hazır + soy büyüleri (büyü kitabı savaşa girmez).
- **Bonus eylem büyü kuralı:** SRD 5.2.1'de 2014'teki "bonus eylemle büyüden sonra yalnızca 1 eylemlik cantrip" kuralı yok; yerine "turda yalnızca bir yuva harcanır" (One Spell with a Spell Slot per Turn). Bu kural motorda zaten var (`economy.slotTurn`): ikinci yuvalı büyü reddedilir, cantrip ve yuvasız (kaynaklı) büyü serbest; yapay zekâ adayları komut denetiminden geçtiği için uyuyor. Konsantrasyon tek (yenisi eskisini bitirir). Test eklendi.

## 2026-10-30 — Taşıma kapasitesi (Görev K5)

- **Ağırlık verisi:** silah ve zırh ağırlıkları SRD 5.2.1 tablolarından (`data/srd/weapons.json`, `armor.json`), kalkan 6 lb (`data/tasima.json`). Eşyalar SRD Adventuring Gear tablosundan (PDF'ten okundu): Acid, Alchemist's Fire, Holy Water 1 lb; Antitoxin —(0); Healer's Kit 3 lb; Potion of Healing 1/2 lb; Bag of Holding 5 lb (eşya metni). **Varsayımlar (`weightApprox: true`):** Greater/Superior/Supreme Healing iksirleri 0,5 lb; yüzük, pelerin, bilezik, muska, eldiven, kafa bandı, kemer, çizme 0; asa 4 lb (Quarterstaff/Staff), değnekler 1 lb (Wand odağı). Paralar sayılmaz.
- **Kural ayarı** (Ayarlar → "Taşıma yükü kuralı", bu cihazda): Kapalı / SRD sınırı (varsayılan) / Kademeli. Yük = giyilen zırh + kalkan + seçili silahlar + eşyalar; kapasite Güç × 15 lb (geçmiş bonusu, ASI ve eşya etkileri dahil son Güç).
- **SRD sınırı:** aşan karakter oluşturucuda Donanım eksiği (Kaydet kapalı). Kayıtlı karakter **engellenmez**: liste ve Game Master kurulumu bu denetimi yapmaz; karakter kartında "⚖ Aşırı yüklü" rozeti. Savaşta SRD sınırının etkisi yok (SRD 5.2.1'de kapasiteyi aşınca yük taşınamaz; oyunda bu durum yalnızca eski kayıtta olur).
- **Kademeli (2014 SRD isteğe bağlı kuralı):** Güç × 5 lb üstü Yüklü (hız −10 ft), Güç × 10 lb üstü Ağır yüklü (hız −20 ft; STR/DEX/CON d20 testleri ve kurtarma zarları ile saldırılarda dezavantaj, mevcut süren etki alanlarıyla: `attackDis`, `saveDis`, `checkDis`; kalıcı etki "Ağır yüklü"). Kapasiteyi aşan Ağır yüklü sayılır. Kural savaş kurulurken plana yazılır (`BattlePlan.carryRule`); simülasyon ve testlerde varsayılan kapalı (denge değişmez).
- **Arayüz:** Donanım adımında üstte "Taşınan x / y lb" çubuğu (kademelide iki eşik çizgisi), aşınca kırmızı uyarı; zırh, silah ve eşya kartlarında ağırlık (varsayım olan "≈"). Savaş kartında yük rozeti. Kayıt sürümü 19 (savaşçıda isteğe bağlı `load`).

## 2026-10-30 — Karakter sihirbazı cilası (Görev K4)

- **Seviye artışı İlerleme adımında:** her ASI yuvası kendi kartında altı yetenek için −/+ ve "Kalan puan: n / 2" ile (bir skora +2 ya da iki skora +1; skor 20'yi geçmez; önceki yuvaların artışı ve geçmiş bonusu "önce" skorunda). Kurallar aynı (`asiStep`, `asiCanRaise`); Puanlar adımındaki tek havuz sayacı kalktı (havuz işlevleri kural modülünde duruyor).
- **Puanlar adımı:** standart dizide açılır liste yerine değer atama: kutuya dokunulur (seçili kutu vurgulu), altı değer çipinden biri seçilir. Dizi her zaman tam bir dağıtım olduğu için "kullanılan" değer başka kutuda olandır: soluk görünür, üstünde kutunun kısaltması yazar, seçilirse iki kutu yer değiştirir. Geçmiş bonusu tek satır (altı küçük −/+). Mobilde düğmeler ≥ 44 px.
- **Beceriler:** Türkçe adlar `strings.ts` `skillNames` (TR/EN); Türkçede İngilizce SRD adı küçük yazıyla yanında. Satır düğmeleri ≥ 44 px, mobilde ad tam satır, düğmeler altında.
- **Donanım:** zırh eğitimi SRD sınıf tablosundan veriye alındı (`data/classes.json` `armorTraining`; `armorProficient`). Zırh, kalkan ve silah kartlarında "yetkin / yetkin değil" rozeti; silah listesinde "Yalnızca yetkin olduklarım" süzgeci (varsayılan açık; seçili silahlar her zaman görünür). Yetkin olunmayan zırhın cezası (büyü yok, STR/DEX d20 testlerinde dezavantaj) motorda **uygulanmıyor**, bu yüzden uyarı konmadı (Karar bekleyenler). Taşıma sınırı yok.
- **Uyum (attunement):** SRD'ye göre en çok 3 eşya (`MAX_ATTUNED`). Daha önce motor bütün eşyaların etkisini uyguluyordu; artık uyum gerektirenlerden listedeki ilk 3'ü (`activeItemNames`: skor, AC, save). Oluşturucuda dördüncü uyumlu eşya seçilemiyor, "uyum n / 3" sayacı; eski kayıtta fazlası sorun olarak (Donanım) görünüyor ve etkisiz.
- **Özet:** tek "Kaydet" (alttaki gezinme düğmesi). Dağıtılmamış geçmiş bonusu **eksik sayılmaz** (kaydı engellemez; mevcut kural ve kayıtlar bozulmasın) ve "Eksik yok" ile çelişmesin diye özet satırı gösterilmez; Puanlar adımında yardım metni zaten görünüyor.
- **Alt sınıf adları:** listede Türkçe ad ve SRD adı birlikte ("Evokasyon Ustası (Evoker)"). Düzeltilen karışıklıklar: Evoker "Çağırıcı" → "Evokasyon Ustası" (conjurer ile karışıyordu); Life Domain "Yaşam Alanı" → "Yaşam Etki Alanı" (oyunda "alan" alan büyüsü demek); College of Lore "Bilgi Okulu" → "Bilgi Koleji" (oyunda "okul" büyü okulu demek). Anlam değişmiyor; diğer adlar (Çılgın Savaşçı Yolu, Toprak Çemberi, Şampiyon, Açık El Savaşçısı, Bağlılık Yemini, Avcı, Hırsız, Ejderha Büyücülüğü, İblis Hamisi) karışıklık yaratmıyor.

## 2026-10-30 — Yarım büyücünün büyü yuvaları (H-SLOT)

- **Yeniden üretim:** sihirbazla yeni oluşturulan Ranger/Paladin (1, 3, 5) ve hazır örnekler (simülasyon partileri) savaşa yuvayla giriyor (Ranger/Paladin 1: 2; 3: 3; 5: 4 + 2; SRD 5.2.1 tablosu 1. seviyeden başlıyor, `data/spell-slots.json` doğru). Hata **kayıtlı karakter durumunda**: savaşlar arası durum (`status.slots`) kalan yuvaları tutuyor ve açılışta "en çok yeni tablo, en çok kayıtlı değer" diye kırpılıyordu. Durum yuvasız bir hâldeyken kaydedildiyse (boş formun varsayılanı Fighter iken dinlenme/savaş, ya da daha düşük seviye) sonradan Ranger/Paladin yapılan ya da seviye atlayan karakter savaşa 0 yuvayla giriyordu; menüde her büyü "slot yok".
- **Neden:** yuvalar karakter kaydına yazılmıyor, savaşa girişte sınıf tablosundan hesaplanıyor (`deriveStats` → `spellSlotsFor`); sihirbaz da yazmıyor. Kayıtlı durum ise harcanan yerine kalan yuvayı tuttuğundan tablo değişince kazanılan yuvaları kaybediyordu.
- **Düzeltme:** durumda kayıt anındaki en çok yuvalar da tutuluyor (`slotMax`); açılışta harcanan (`slotMax − slots`) yeni tablodan düşülüyor, böylece sınıf/seviye değişince kazanılan yuvalar dolu geliyor. Dinlenme ve savaş sonucu `slotMax`ı taşıyor. Kayıt sürümü değişmedi (isteğe bağlı alan).
- **Eski kayıt onarımı:** `slotMax`ı olmayan durumlarda yuvalar açılışta bir kez sınıf ve seviyenin tablosuna tamamlanıyor (`repairSlots`); eksik yuvası olanlar kısa, kapatılabilir bir notta adıyla. Yan etki: son savaşta harcanıp dinlenmeden kalan yuvalar da bir kez dolar (harcanan ile hiç olmayan ayırt edilemiyor).
- **Kapsam dışı:** kaynaklar (`resources`) aynı kırpma kalıbını kullanıyor; eksik kaynak kimliği zaten en çok değerle geliyor, yalnızca seviye atlamada artan en çok değer (ör. Favored Enemy 2 → 3) eski kayıttaki değerde kalabilir. Ayrı iş.

## 2026-10-30 — Sihirbazın tek ilk adımı ve tür soyları (Görev K3)

- **Tek ilk adım "Karakter":** kimlik (ad, seviye, görünüm), tür + soy kartları ve sınıf kartları (alt sınıf ve özellikler altında, "Yakında" kuralı aynı) tek adımda. Adım sayısı büyücüde **7**, büyücü olmayanda **6**: üç adım (Kimlik, Irk, Sınıf) birleşince iki adım düşüyor; görevde yazan "9→8, 8→7" üç adımın birleşmesiyle tutmuyor, birleşme esas alındı. `BuilderStep`: `identity`/`race`/`class` → `character`; "Ad boş", tür, soy, sınıf, seviye ve alt sınıf sorunları bu adıma bağlı (metinler aynı; "miras seçilmeli" → "soy seçilmeli").
- **Jeton önizlemesi:** jeton tür, görünüm (erkek/kadın) ve sınıftan oluşuyor (`characterTokenFile`), üçü de anında değiştiriyor; soy ve seviye jetonu değiştirmiyor (altyazıda yazıyor). Masaüstünde sağ panelin üstünde 200 px, mobilde adımın üstünde 64 px yapışkan şerit. Görsel yoksa tür renkli rozet (mevcut yedek zinciri).
- **Soy verisi:** `data/races.json` `lineages` genelleşti: her seçenekte TR/EN `summary` (yalnızca ayıran özellikler; seçim kartı, özet paneli, karakter kartı aynı metni kullanır), isteğe bağlı `darkvision`, `speed`, `spells` (karakter seviyesi eşiğiyle), `giant`, `extras` (oyunda olmayan özellik, yalnızca ⓘ). Kayıt alanı `lineageId` aynı, kayıt sürümü 19. Elf (Drow, High Elf, Wood Elf), Gnome (Forest, Rock), Goliath (6 ata) eklendi; varsayılan soy ilk seçenek.
- **Eski kayıt:** soyu boş ya da bulunmayan karakter açılışta türün varsayılan soyunu (Elf/Gnome/Goliath'ta ilk seçenek, Tiefling'de Infernal) alır ve bir kerelik not gösterilir (`migrateLineages`, alt sınıf notuyla aynı yer).
- **Dragonborn:** 10 ata türü nefes hasar türünü ve direnci zaten doğru veriyordu (test eklendi). **Tiefling:** direnç vardı, soy büyüleri yoktu; eklendi.
- **Soy büyüleri:** cantrip her zaman, seviyeli büyü eşik seviyesinden; seviyeli büyü uzun dinlenmede bir kez slotsuz (kaynak `<soy>:<büyü>`, `race` + `lineage` + `minLevel`; Forest Gnome Speak with Animals yetkinlik bonusu kadar), slotu olan büyücü slotla da yapabilir. Aynı büyüyü iki kaynak verebildiği için slotsuz kaynak karakterin elindekilerden seçiliyor. Tepki büyüsü (Infernal: Hellish Rebuke) slotsuz kullanımı önce harcıyor. **Büyü yeteneği:** SRD'de soy seçilirken INT/WIS/CHA seçilir; oyunda büyücü sınıfta sınıfın yeteneği, değilse üçünün en yükseği (yaklaşık; seçim alanı eklenmedi). Mending (Rock Gnome) savaş dışı büyü olarak eklendi.
- **Goliath Giant Ancestry** (kaynak `giantAncestry`, yetkinlik bonusu kadar, uzun dinlenme): Fire's Burn (+1d10 Fire), Frost's Chill (+1d6 Cold ve hedefte Slow işareti −10 ft), Hill's Tumble (Large ve küçüğü Prone) **silah isabetinde otomatik, turda bir kez** (oyuncuya sorulmuyor; büyü saldırısında yok). Stone's Endurance tepki (`reduce`, 1d12 + CON; yalnızca saldırı isabetinin hasarı), Storm's Thunder tepki (yeni tür `thunder`: 60 ft içinde hasar verene 1d8 Thunder), Cloud's Jaunt bonus eylemle 30 ft ışınlanma (`use_feature` + `to`, etki `teleport`; yapay zekâ kullanmıyor). Tepkiler kaynağı `resource` alanıyla harcar (`reaction_used.resource`). Large Form ve Powerful Build yok.
- **Görünüm:** soy yetenekleri karakterin özetinde ve savaş kartında soy adıyla ("Drow: Faerie Fire"); oyunda olmayan ya da kısmi olan yalnızca ⓘ ipucunda (savaş dışı büyü, mekanik aletler, cantrip değiştirme, Goliath sınırları).
- **Simülasyon partileri:** üç Elf üyeye soy yazıldı (Mira High Elf, Kael ve Nix Wood Elf); örnek karakter Mira High Elf.
- **Celestial:** veride alt seçeneği ya da seviyeye bağlı seçimi yok; dokunulmadı.

## 2026-10-30 — Son logo karesinde zarın omuzlarındaki çentik (Görev L7)

- **Kanıt** (Playwright, 2x ekran, son kare logo sahnesinin 2,6. saniyesinde, koyu ve açık tema, masaüstü ve mobil; `docs/sabah/l7-*.jpg`):
  - (A) L6'nın kök kenarı maskesi kaldırılınca zarın iki omzundaki fark belirgin: maskeli karede kanat kökünün son %3'lük şeridi yarı saydam ve altındaki geniş gövdenin (yaklaşık birkaç piksel kaymış) kontur çizgileri ve kırmızı dolgusu görünüyor; fark görüntüsü yalnızca o dikey şeritte, omuzlarda açık kırmızı kama/basamak olarak çıkıyor.
  - (B) Canlı zar, parlama ve göz ışığı gizlenince omuzlarda hiçbir piksel değişmiyor (fark yalnızca göz ışığında): son karede canlı zar devirle sönmüş; çentik zardan değil. Zarsız logo katmanlarında o bölge temiz.
  - (C) Canlı zarın son pozu devirden sonra opaklık 0; logodaki zarla siluet farkı son kareye katkı vermiyor (B'de omuz farkı 0). Kaynak görsel (`logo-acilis.webp`) omuzlarda çentiksiz.
  - Sonuç: çentiği L6'nın kök maskesi üretiyor (L6'dan sonra belirginleşmesi bununla uyumlu).
- **Düzeltme:** kök maskesi yalnızca kanatlar açılırken (kapalı gövde alttayken; L6'nın amacı) etkin. Kanatlar tam açılınca (`wing-at + wing-ms`) maske kutusu %110'a büyür ve saydam şerit katmanın dışına çıkar (`splash-mask-off`, 1 ms). Son karede masaüstünde omuzlar maskesiz kareyle aynı (renk farkı ≤ 13/255, görünmez); mobilde ≤ 23/255 (alt piksel ölçekleme gürültüsü). Kaynak görselde sorun olmadığı için yeniden üretim gerekmiyor.

## 2026-10-30 — B1/B2 sapmalarının düzeltmeleri (gece kuyruğu CILA)

- **Haste:** ek eylem `haste_action` komutuyla, eylem kullanıldıktan sonra (Action Surge kalıbı; turda bir). O eylemle yalnızca tek silah saldırısı, Dash, Disengage, Hide (Utilize yok); büyü yapılamaz. Yapay zekâ eylemden sonra vurabileceği hedef varsa kullanır.
- **Slow:** DEX save'e −2 (`saveMod`; `saveDice` artık yeteneği alır, sabit eklenti olarak), eylem ya da bonus eylem (ikisi birden değil), Attack eylemiyle tek saldırı (`slowed`; ekonomi). Büyü gecikmesi (d20) yok.
- **Ray of Enfeeblement:** başarısız save'de yakın dövüş saldırıları (STR saldırısı sayıldı) ve STR kontrolleri dezavantajlı (`attackDis.melee`, `checkDis`).
- **Entangle/Web:** tur sonu STR save'i kalktı; tutulan yaratık eylemle (Kurtul / `escape`) Athletics kontrolüyle büyünün DC'sini geçer (`escapeCheck`). Yapay zekâ tutulunca önce kurtulmayı dener (yakalanma kalıbı).
- **Sis içinden görüş:** saldıran ve hedef örtünün dışındayken aradaki yoğun örtü (Fog Cloud, Stinking Cloud, Sleet Storm, Darkness) iki tarafı da görünmez yapar: dezavantaj ve avantaj birlikte (birbirini götürür; SRD Unseen Attackers and Targets). Uçlardan biri örtüdeyse B2 kuralı (yalnızca o tarafın etkisi) aynı. Görülmeyen hedefe büyü hedeflemesi engellenmedi.
- **Wind Wall:** menzilli silah saldırısı duvardan geçerken yapılabilir ama otomatik ıskalar (olayda `autoMiss`; günlükte neden); yapay zekâ boşa gidecek saldırıyı seçmez. Duvar düz ya da yay biçiminde (`wallShape: 'arc'`: büyücüden seçilen noktanın uzaklığındaki halkada kesintisiz yay); serbest çizim yok.
- **Acid Arrow:** yukarı slot ilk ve gecikmeli hasara slot başına +1d4 (`upcast.applied`).
- **Silence:** içindeki yaratık Thunder hasarına bağışık (`profileIn`: büyü, alan ve canavar saldırılarında). Deafened verilmez.
- **Blindness/Deafness:** durum seçilir (`conditionChoices`, komutta `choice`; arayüz ve yapay zekâ Blinded). Deafened sözlü buyrukları (Command, Suggestion; `needsHearing`) engeller.
- **Flaming Sphere ve ruh sürüsü:** kendi turları yok (`summon.ownerBonus`, sırada atlanır); sahibi bonus eylemle 30 ft taşır (`summon_move`); küre taşımanın sonunda bitişik yaratığa çarptırılabilir (alanın save'i ve hasarı). Arayüzde "Çağrıyı taşı", yapay zekâda basit kural (küre en düşük HP'li bitişik düşmana, sürü alanında en çok düşman toplayan yere).
- **Yapay zekânın zemin büyüleri:** Entangle, Web, Grease, Spike Growth, Sleet Storm, Stinking Cloud, Moonbeam: alanda en az iki düşman ve hiç dost yoksa (en çok düşman kapsayan nişan), hasar alan büyülerinden sonra, tek hedefli saldırılardan önce. Görüş/örtü alanları ve duvar yapılmaz. Büyü listesi olan düşman tarafı da kullanır.

## 2026-10-30 — Özel mekanikli büyüler (Görev B5)

- **Çalışanlar (mevcut sistemlerle, yeni geniş sistem yok):** Color Spray (koni, CON save ya da Blinded; `failEffect`), Expeditious Retreat (hız iki katı; her tur bonus eylemle Dash'in yerine), Ice Knife (saldırıdan sonra hedefin altıgeni ve çevresine 5 ft küre DEX save, `burst`; alan yolu slotsuz yeniden kullanılır), Alter Self (yalnızca Natural Weapons: Shillelagh'ın `weaponOverride`'ı silahsız vuruşa), Darkvision (süren etkide `darkvision`; `darkvisionOf` türün ve etkinin büyüğü), Dragon's Breath (Flame Blade'in `castOnly` + `repeat` kalıbı; nefesi büyücü verir), Enhance Ability (`checkAdv`: seçilen yetenekte kontrol avantajı; `checkMode`), Pass without Trace (`stealthAura`: taşıyanın 30 ft içindeki dostlar Gizlen'de +10), Protection from Poison (Poisoned kalkar + poison direnci; `cureOnCast`), Bestow Curse (yalnızca ilk seçenek: seçilen yetenekte save dezavantajı), Dispel Magic ve Remove Curse (`kind: dispel`: yaratıktaki süren büyü etkileri biter, `effect_ended` nedeni `dispelled`; slotun üstündeki seviyede DC 10 + seviye büyü yeteneği kontrolü).
- **Savaş dışı (Game Master'a not):** Druidcraft, Comprehend Languages, Floating Disk, Goodberry, Speak with Animals, Animal Messenger, Enthrall, Gentle Repose, Speak with Dead, Tongues.
- **Karar bekleyen (kayıt var, "oyunda henüz çalışmıyor"):** Sanctuary (saldırı öncesi save ve "saldırı boşa gider" yolu üç saldırı türünde yok), Warding Bond (hasar bölüşme ikinci hasar olayı ister; bölüşmesiz hali dengesiz), Jump ve Spider Climb (harita zıplama/tırmanma kurallarıyla ilişki). Seçenekler SABAH-RAPORU'nda.
- **Kısmi kalanlar (değişmedi):** Hex, Mage Armor, Invisibility, Magic Weapon, Mind Spike (sapmalar `approx` notunda).

## 2026-10-30 — Aydınlatma, algılama, nesne büyüleri (Görev B4)

- **Işık tek yerde:** büyü ışıkları `litHexes`'e eklenir (karanlık/gece haritalarının görüş ve gece gizlenmesi kuralı; ayrı ışık sistemi yok). Kaynaklar: süren etkide `light` (taşıyanın çevresinde altıgen; Light, Continual Flame, Flame Blade, Faerie Fire, Starry Wisp) ve alanda `zone.light` (alan altıgenleri + çevresi; Dancing Lights, Daylight). Yalnızca parlak ışık sayılır; loş ışık ayrı değil (oyunun ışık modeli tek kademeli). Işıksız haritada ışığın etkisi yok.
- **Darkness:** B2 alanı (`obscured: heavy`, her haritada saldırıda görülmeyen hedef/saldıran) + `dark`: altıgenleri ışıksız (ışık aydınlatamaz) ve karanlık haritasında karanlık görüş içini göremez (`canSee`'de karanlık görüş menzili yerine ışıksız görüş menzili). Daylight oluşunca örtüşen Darkness alanlarını kaldırır (`dispels`, `zone_ended` nedeni `dispelled`); Darkness'ı yapanın konsantrasyonu sürer (SRD'de büyü biter; konsantrasyonu dışarıdan bitiren olay yok, etkisi aynı).
- **Görünmezlik:** saldırı bağlamına verilen durumlardan Invisible çıkarılır (`sightConditions`, `src/battle/sight.ts`): işaretli yaratık (`revealed`: Faerie Fire, Starry Wisp) yararlanamaz, See Invisibility'li (`seeInvisible`) görür. Durumun kendisi kalır (gizlenme ve görünürlük ayrı). Faerie Fire'da ayrıca `attackedAdv` (saldırılar avantajlı; "görebiliyorsa" denetimi yok).
- **Flame Blade:** `castOnly` (bonus eylemle yapılır, saldırı yok, büyücüde ışık) + süreli tekrar (`repeat` eylem): saldırı "Büyüyü sürdür" ile, aynı turda da. Hasar 3d6 + yetenek, yukarı slotta +1d6 (`upcast.applied`).
- **Sorcerous Burst:** tür seçimi komutta (`choice`, `damageChoices`); arayüzde ve yapay zekâda varsayılan Fire. Patlayan zar (8 gelince ek d8) yok.
- **Savaş dışı:** mekanik karşılığı olmayan 25 büyü (algılama, nesne, iletişim, B3'ün yanılsamaları) `kind: utility` + `offCombat` + `gmNote`. Sihirbazdaki büyü çipinde "savaş dışı" etiketi, savaş menüsünde "savaş dışı · Game Master" notu; yapınca günlüğe "Savaş dışı, Game Master'a not: …". Denetimde ayrı durum (**savaş dışı**). Eylem ve slot harcanır (SRD'de de büyü yapmak eylemdir).
- **Karar bekleyen:** Water Walk (haritadaki su/bataklık/lav altıgenleri), Knock (Kale kapısı kuralı): şimdilik savaş dışı not; seçenekler SABAH-RAPORU'nda.

## 2026-10-30 — Zihin kontrolü ve yanılsama büyüleri (Görev B3)

- **Büyüleme (Charmed):** süren etkide `charm` işareti; büyülenen, büyüleyeni saldırıyla hedef alamaz (`checkReach`). Charm Person ve Animal Friendship (`onlyTypes`: humanoid / beast; tür verisi olmayan yaratık humanoid sayılır) savaşta avantajlı save (`saveAdvantage`, SRD: "you or your allies are fighting it"). Etki **hedef herhangi bir hasar alınca** biter (`breakOnDamage`; SRD yalnızca büyücü ya da dostları hasar verince bitirir; kaynak ayrımı eklenmedi, savaşta hasar neredeyse hep karşı taraftan).
- **Zorlama hareketi** (`src/battle/mind.ts` `compelEvents`): Command Approach/Flee, Fear kaçışı (önce Dash) ve Suggestion "uzaklaş" yaratığın kendi sırasının başında motorca yürütülür (yapay zekâ ve oyuncu aynı), sonra tur biter (`turn_lost`). Hedef altıgen: ulaşılabilir boş altıgenlerden kaynağa en yakın/en uzak, eşitlikte en ucuz. Fırsat saldırısı ve zemin yürüyüşün kendisinde (SRD: Flee'de fırsat saldırısı tetiklenir). `commandPersist` etkisi her turunda yineler (Fear, Suggestion, Calm Emotions kayıtsızlığı). Command Drop: silah bırakma modeli yok, yalnızca turunu kaybeder.
- **Hasarla yeniden save** (`damageSave`): Hideous Laughter avantajlı WIS save; başarıda etki biter (`effect_save` hasar etkisi, reducer `withEffects`).
- **Protection from Evil and Good** (`wardedFrom`): korunan, büyünün `ward.disadvantageFromTypes` türlerinden gelen Charmed ve Frightened'ı almaz (reducer `effect_added` ve `save_resolved` süzer). Zaten olan durum bastırılmaz; ele geçirme yok.
- **Fear ve Hypnotic Pattern:** alan büyüsünde `failEffect` (save'i kaçırana süren etki: durumlar, hız 0, hasarla bitme, zorlama). Fear tekrar save'i her tur sonunda (SRD: yalnızca büyücüyü görmüyorken; görüş denetimi eklenmedi, bu yüzden SRD'den biraz zayıf).
- **Calm Emotions:** dostlara (save'siz, isteyerek başarısız) Charmed/Frightened kalkar ve süre boyunca bağışık; düşmana CHA save, başarısızlıkta "kayıtsız": her turunu kaybeder, hasarla biter. SRD'de tek seçenek seçilir; iki etki tek dökümde uygulanır (dost/düşman ayrımı).
- **Suggestion:** serbest metin yerine iki seçenek: "savaşı bırak" (her turunu kaybeder) ve "uzaklaş" (her tur kaçar); hasarla biter. Diğer öneriler Game Master'a.
- **Mirror Image:** isabetten önce her kopya için d6, biri 3+ ise isabet kopyaya gider, kopya yok olur (saldıran Blinded ise etkisiz; Blindsight/Truesight yok). Tepki hakkı harcanmaz.
- **Phantasmal Force:** INT save; başarısızlıkta büyücünün her turunun başında 2d8 psychic (`sourceTurnDamage`). Yanılsamanın biçimi/konumu ve Study ile kurtulma yok.
- **Savaş dışı (simüle edilmez):** Minor Illusion, Silent Image, Major Image, Disguise Self, Prestidigitation, Unseen Servant, Arcanist's Magic Aura; denetimde "savaş dışı". Sleep'in ikinci aşaması (Unconscious) karar bekliyor (SABAH-RAPORU).
- **Teknik:** hasar profili takma adları (`const profileOf = damageProfile`) modül yüklenirken değer kopyalıyordu; yeni döngüsel içe aktarma (`mind.ts` → `reduce.ts`) sırasını değiştirince tanımsız kaldı. Takma adlar tembel sarmalayıcı yapıldı (davranış aynı).

## 2026-10-30 — Açılışta kapalıdan açık kanada geçiş (Görev L6)

- **Kanıt** (Playwright, Web Animations API ile dondurulmuş kareler, 2x; `docs/sabah/l6-*.jpg`):
  - (a) Logo sahnesinin ilk ≈160 ms'sinde kapalı kanatlar (opaklık 0,9 → 0,1) ile açık kanatlar (0,06 → 1) aynı karede: iki kanat silueti. Z-sırası ikisinde de çerçevenin önünde (kapalı 3, açık 4); sorun sıra değil, çakışan crossfade.
  - (b) Kaynak görselde (`assets-ham/logo/logo-acilis.jpg`) şerit ya da çentik yok (büyütülmüş kırpımla bakıldı). Dişli kenarın canlı katmandaki nedeni: kanatlarda `will-change: transform` katmanı katlı (küçük ölçekli) pozda rasterleştirip açılırken büyütüyordu. Ayrıca katmanlar 1400 px genişlikten dışa aktarılıyor; 2x ekranda kanat ≈1,3 kat büyütülüyor (yumuşaklık).
  - (c) Son karede (geniş gövde altta) kanat kökünde çentik yok. Çentik, kanat katmanının kök kenarının katman kutusu sınırında (x ≈ 0,443, `WING_X.sol`) dikey kesilmesinden; açılış sırasında altta kapalı gövde olduğu için basamak olarak görünüyordu. Canlı zarın silueti bu bölgenin dışında.
- **Düzeltmeler:** kapalı kanatlar açık kanatlar başlamadan tamamen söner (`closedWingsOutMs` 140 ms, `wing-at`'ta biter), açık kanatlar katlı pozdan 0'dan ≈110 ms'de belirir: hiçbir karede iki siluet yok, devir iki opaklık da sıfıra yakınken. Kanatlarda `will-change` kaldırıldı. Kanat kök kenarına %3'lük yumuşak maske (tam açıkta alttaki geniş gövde aynı pikselleri taşır, görünüm aynı). Zamanlamanın geri kalanı (L4–L5: gövde geçişi kanatlar açılınca, zar devri) değişmedi.
- **Değişmeyen / karar bekleyen:** katman çözünürlüğü (1400 px) `npm run logo`'yu yeniden çalıştırmayı ve `data/logo.json`'u değiştirmeyi gerektirir; yapılmadı (karar bekliyor). Canlı CSS 3D zarın rakam kenarlarındaki pürüz zar katmanından (bu görevin kapsamı dışı).

## 2026-10-30 — Karakter oluşturma sihirbazı (Görev K1)

- **9 adım** (Kimlik, Irk, Sınıf, Puanlar, Beceriler, İlerleme, Donanım, Büyüler, Özet); büyü seçemeyen karakterde Büyüler adımı yok (8 adım). Karakter verisi, kayıt biçimi ve doğrulama kuralları aynı: sorunlar `characterIssues` ile adımlara bağlandı (`characterProblems` aynı metinleri döndürür). Eksik "Devam"ı engellemez; yalnızca Özet'teki Kaydet eksik varken kapalı. Eksikler kırmızı düğme, ilgili adıma götürür. Adım çubuğundan geri dönülür, veri kaybolmaz (tek durum).
- **Düzen:** masaüstünde solda ana kart, sağda 290 px özet (Can/AC/Hız/İnisiyatif, skorlar, kurtarma, beceriler, eksikler) ve üstte adım çubuğu (✓ yeşil, geçerli turuncu, eksikli geçilmiş adım kırmızı "!"). Mobilde (≤760 px) başlıkta "N / M · Adım", ince ilerleme çubuğu, altta özet çubuğu (ad, sv/sınıf, Can, AC, "N eksik" düğmesi açılır liste), Geri/Devam ≥ 48 px, dokunma alanları ≥ 44 px.
- **Alt sınıf:** depoda her sınıfın tam bir SRD alt sınıfı var; "aynı 4 alakasız alt sınıf" dolgusu **depoda bulunamadı** (olası kaynak: tarayıcıdaki dış içerik paketi `rpg-battle-icerik` ya da yerel `icerik/`). Kural genel uygulandı: veride alt sınıfı olmayan sınıfta seçici yerine kesikli "Yakında" kutusu; alt sınıf eksik sayılmaz (`needsSubclass` veride alt sınıf arar). Sihirbaz açılırken kayıtlı alt sınıf o sınıfta yoksa boşa çevrilir ve bir kerelik not gösterilir (`clearInvalidSubclass`); karakter listesindeki E1 "içerik eksik" davranışı değişmedi.
- **Puanlar:** altı kutu tek sırada (mobilde 2 sütun): toplam, değiştirici, "N temel + M geçmiş". Standart dizide bir değer yalnızca bir kutuda (seçilen değer başka kutudaysa ikisi yer değiştirir). Puan satın almada "Kalan puan X / 27" çubuğu. Geçmiş bonusu ve seviye artışı (ASI havuzu) kutuların altındaki kutuda. **"Zarla" yöntemi yok** (oyunda hiç yoktu; eklemek kayıt biçimine yeni yöntem ekler): karar bekliyor.
- **Beceriler:** 18 becerilik tek liste, sınıf rozeti (turuncu), geçmiş rozeti (yeşil; seçilen geçmiş becerisi kilitli, sınıftan seçilemez), sınıf listesinde olmayan soluk; sayaçlar sınıf/geçmiş/uzmanlık. Oyunda ayrı bir "geçmiş" varlığı olmadığı için geçmiş becerileri oyuncu seçer (en çok 3; eski kural).
- **Donanım:** zırh türü düğmeleri (Zırhsız/Hafif/Orta/Ağır) + Kalkan, seçilen türün zırh kartları; silahlar kart ızgarası, her kartta ustalık düğmesi ("★ Nick"), üstte "Silahlar: seçili N · Ustalık X / Y". Ustalık kuralları (hak sayısı, uygun silah) aynı; ayrı ustalık bölümü kaldırıldı.
- **Geliştirici etiketleri** ("kısmen", "oyunda henüz yok", "uygulanıyor") metinden kaldırıldı, ⓘ ipucuna alındı.
- Sihirbaz ayrı parça (lazy); bütün "yeni karakter" ve düzenleme girişleri aynı sihirbaza gider.

## 2026-10-29 — Savaş sonu ses düzeni (Görev U2)

- **Akış:** savaş canlı olarak bitince (zafer ya da yenilgi) savaş ekranının ses sahnesi sessiz sahneye geçer (`endSilenceScene`): savaş müziği ve ortam sesi motorun mevcut sahne geçişiyle (`setScene`, gidenler kısılıp durur) `end.fadeOutMs` = **650 ms** içinde kısılır; bunun için sahneye isteğe bağlı `exitFade` eklendi (yeni paralel mekanizma yok). Ezgi (son-zafer, son-yenilgi) kısılma başladıktan `end.jingleDelayMs` = **300 ms** sonra efekt kanalından tam seviyede çalar. Süreler `data/ses.json` `end` içinde.
- **Sonrası:** bitmiş savaşın sahnesi her zaman sessiz: ezgi bitince savaş müziği ve ortam geri gelmez, savaş sonu ekranı sessiz kalır. Zar efektleri (son vuruşun zarı) efekt kanalında normal çalar. Menüye dönünce menü müziği kuralları, yeni savaşta savaş müziği ve ortam normal başlar (yeni savaş yeni sahne).
- **Erken kapatma:** savaş ekranı ezgi bitmeden kapanırsa ezgi `end.jingleStopMs` = **300 ms** içinde kısılıp durur (motora `stopEffect` eklendi; yüklenmekte olan ezgi de çalmaz); ezgi henüz başlamadıysa hiç çalmaz. Savaş müziği ve ortam geri gelmez (menü sahnesi geçer).
- **Ayarlar (mevcut kural korundu):** ezgi efekt kanalındadır; ana ses ya da efektler kapalıysa çalmaz. Müzik kapalı olması ezgiyi etkilemez. Ses seviyeleri kanal kazancıyla (ana ses, efekt seviyesi) uygulanır.
- **Bir kez:** ezgi yalnızca canlı geçişte (önceki durum bitmemiş, şimdiki bitmiş; `liveFinish`) ve savaş ekranının her açılışı için bir kez (`BattleEndSound`, ekran anahtarı; savaş kimliği her savaşta `harita` olduğu için ekran açılışına özgü anahtar). Kayıttan açılan bitmiş savaşta ezgi çalmaz, sahne yine sessizdir.
- Mantık `src/ui/audio/battleEnd.ts` (motor ve zamanlayıcı enjekte edilir; sahte motorla test edilir).

## 2026-10-29 — Büyü sistemleri, bölüm 2: kalıcı zemin etkisi, geçici engel, çağırma (Görev B2)

**Kapsam listesi** (`node scripts/buyu-denetimi.mjs`, B2 öncesi: 183 büyüde tam 55, kısmi 36, yok 92):

| Kategori | Büyü (önceki durum) | B2 sonrası |
|---|---|---|
| Kalıcı zemin | Entangle, Moonbeam, Spike Growth, Web, Stinking Cloud (kısmi), Fog Cloud, Grease, Silence, Plant Growth, Sleet Storm (yok) | Grease tam; diğerleri çalışıyor, küçük sapma notuyla kısmi |
| Kalıcı zemin (B1'den) | Flaming Sphere (kısmi) | çağırma yoluyla yürüyen küre (kısmi) |
| Kalıcı zemin (yanlış sınıflanmış) | Detect Magic (yok) | **B3–B5'e kaldı** (algılama; denetimde "algılama/bilgi") |
| Kalıcı zemin (yanlış sınıflanmış) | Zone of Truth, Speak with Plants (yok) | savaş dışı; denetimde "savaş dışı" |
| Geçici engel | Wind Wall (yok) | çalışıyor (kısmi) |
| Geçici engel (yanlış sınıflanmış) | Message (yok) | savaş dışı |
| Çağırma | Animate Dead (kısmi), Conjure Animals (yok) | ikisi de çalışıyor (kısmi) |

**Sonuç:** 183 büyüde tam 56, kısmi 42, yok 85. Bu kategorilerde "yok" kalmadı; kalan 13 kısmi (kalıcı zemin 10, çağırma 2, geçici engel 1) yalnızca not edilmiş küçük sapmalar.

- **Tek yeni yapı: haritada büyü alanı** (`map.zones`, `SpellZone`; `src/battle/zones.ts`). Paralel sistem değil: kalıp Spirit Guardians yayılımı (girişte/tur sonunda save, turda bir kez), alanı R4'ün `pickArea`/`areaHexes`'i, durumlar R2 etkisi (`grants`, konsantrasyon bağı, B1 `repeatSave`), uçuş S1 `isAirborne`, çağrılar R3. Kural büyü verisinde (`mechanics.zone`: süre, zorlu arazi maliyeti, `ground`, yoğun örtü, sessizlik, rüzgâr duvarı, tetikler `cast/enter/start/end/move/anchorMove`, `once`, save/hasar/durumlar, `hold`, `escape`, `dropConcentration`, `targets`, renk ve simge). Olaylar `zone_created`, `zone_moved`, `zone_triggered` (turda bir kez kaydı), `zone_ended`; bitiş reducer'da (`pruneZones`: süre, konsantrasyon, bağlı yaratık). Kayıt sürümü 19.
- **Üst üste binme:** aynı büyünün alanları çakışırsa yaratık yalnızca en yüksek DC'li olandan etkilenir; farklı büyüler ayrı ayrı. Zorlu arazi birikmez (altıgen maliyeti zeminin ve alanların en büyüğü; Plant Growth 4).
- **Uçanlar:** zemin alanlarının tetikleri (Grease, Entangle, Spike Growth, Plant Growth) uçan yaratığa işlemez; alanların zorlu arazisi hiçbir uçana işlemez (motorun zorlu arazi kuralıyla aynı). Bulut/sis/duvar/ışın uçanı da etkiler.
- **Yoğun örtü** (Fog Cloud, Sleet Storm, Stinking Cloud): saldırı denetiminde (`checkReach`) hedef yoğun örtüdeyse dezavantaj, saldıran yoğun örtüdeyse avantaj (ikisi birbirini götürür). Görüş çizgisi bulutun içinden geçince kesilmez (yalnızca iki ucun altıgeni).
- **Wind Wall:** yeni alan şekli `wall` (seçilen noktadan geçen, büyücüden noktaya yöne dik, 50 ft = 10 altıgen; önizleme aynı yoldan). Menzilli silah saldırısı duvarın içinden geçemez (otomatik ıska yerine saldırı yapılamaz), büyü saldırısı geçer; Small ve küçük uçan yaratık ve Gaseous Form'daki yaratık duvara giremez; oluşunca içindekiler STR save 4d8.
- **Silence:** büyücü sessiz alandaysa sözlü (V) bileşenli büyü yapılamaz; sözsüz büyüler veride `noVerbal` (SRD'den: True Strike, Counterspell, Hypnotic Pattern, Mind Spike).
- **Flaming Sphere ve Conjure Animals R3 çağırmasıyla:** dokunulamaz (`intangible`) çağrılar; hedef alınmaz, alanlardan ve alan büyülerinden etkilenmez, tepki yapmaz, içinden geçilir, yapay zekâ hedef saymaz. Yaratıkla yürüyen alan (`anchorId`, yarıçap): küre bitişikte tur bitirene DEX save 2d6 (yukarı slot +1d6), ruh sürüsü 10 ft içinde giren/tur bitiren/yaklaşılan düşmana DEX save 3d10 (turda bir kez). Sahibinin ardından kendi sırasında yürür (SRD: bonus eylemle/büyücüyle birlikte); küre bitişiğe çarpar (save'li saldırı). Yapay zekâ: alanına en çok düşman, en az dost alan yere yürür, sonra çarpar.
- **Animate Dead:** yukarı slotta slot başına +2 yaratık (`count`). **Moonbeam** sonraki turlarda eylemle (B1 süreli tekrar komutu `spell_followup`) taşınır; taşınan alan içindekileri yeniden tetikler.
- **Gaseous Form düzeltmesi (B1 hatası):** etkinin "yürüyemez" işareti uçuşu da sıfırlıyordu; artık etkiden uçuş hızı varsa o kullanılır.
- **Yapay zekâ ve denge:** parti yapay zekâsı zemin büyülerini kendiliğinden yapmaz (hasarlı alan büyüsü seçicisi save'li hasar bekler). Spike Growth eskiden tek hedefe hasar olarak yapılıyordu; artık alan büyüsü olduğu için simülasyondaki ranger (Kael, Rook) onu kullanmaz.
- **Görsel:** yalnızca yer tutucular. Alanlar renkli altıgen dolgusu ve simge (büyü verisinde `color`, `icon`); rüzgâr duvarı kesikli çerçeve; küre ve sürü jetonu mevcut canavar görselleriyle (Magmin, Dire Wolf). **Eksik sprite listesi** (Gemini ile üretilebilir): sis/bulut dokusu (Fog Cloud, Stinking Cloud, Sleet Storm), ağ (Web), dikenler (Spike Growth), yağ (Grease), sarmaşık (Entangle, Plant Growth), ay ışını (Moonbeam), sessizlik halkası (Silence), rüzgâr duvarı (`engel-melodi` engel sprite'ı önizlemede kaldı; alan çizimine bağlanmadı), alev küresi jetonu, ruh sürüsü jetonu.
- **Sapmalar** (`approx`): Entangle ve Web'de kurtulma eylemle STR (Athletics) kontrolü yerine tur sonu STR save; Web'in çökme ve yanma kuralı yok; Moonbeam 60 ft yerine büyü menzili içinde bir yaratığın altıgenine taşınır; Silence'ta Thunder bağışıklığı/Deafened yok; Spike Growth'un gizlenmiş alan kuralı yok; Stinking Cloud eylem kaybı Incapacitated ile; Sleet Storm ve Moonbeam silindiri küre; Fog Cloud yukarı slot yarıçapı yok; Plant Growth'ta bölge çıkarma yok; Wind Wall serbest biçimli değil; Conjure Animals'ta büyücüye STR save avantajı yok.

## 2026-10-29 — Büyü sistemleri, bölüm 1: süren etki, süreli tekrar, iyileştirme, itme, boyut, uçuş (Görev B1)

**Kapsam listesi** (`node scripts/buyu-denetimi.mjs`, B1 öncesi: 183 büyüde tam 49, kısmi 32, yok 102; bu kategorilerde "kısmi" ya da "yok" olan 27 büyü):

| Kategori | Büyü (önceki durum) | B1 sonrası |
|---|---|---|
| Süren etki | Shillelagh (yok), True Strike (yok), Blur (yok), Beacon of Hope (yok), Protection from Energy (yok), Haste (kısmi), Slow (kısmi) | Shillelagh, Protection from Energy tam; True Strike, Blur, Beacon of Hope, Haste, Slow kısmi (küçük sapma notu) |
| Süreli tekrar | Acid Arrow, Blindness/Deafness, Heat Metal, Hold Person, Call Lightning (kısmi), Ray of Enfeeblement (yok), Ensnaring Strike (yok) | Hold Person tam; diğerleri kısmi (not); Ray of Enfeeblement ve Ensnaring Strike yeni |
| Süreli tekrar | Flaming Sphere (kısmi) | **B2–B5'e kaldı** (kalıcı, hareket ettirilen nesne/zemin; denetimde "kalıcı zemin etkisi") |
| İyileştirme | Mass Healing Word, Revivify, Vampiric Touch (kısmi) | üçü de tam |
| İtme | Gust of Wind (yok) | kısmi (yeni) |
| Boyut | Enlarge/Reduce (yok) | kısmi (yeni; boyut yalnızca jeton etiketi) |
| Boyut | Alter Self (yok) | **B2–B5'e kaldı** (biçim seçenekleri özel mekanik; denetimde "özel mekanik") |
| Boyut (yanlış sınıflanmış) | Create or Destroy Water, Rope Trick, Nondetection (yok) | savaş dışı; denetimde "savaş dışı" kategorisine taşındı (B1 işi değil) |
| Uçuş | Levitate, Fly (kısmi), Gaseous Form (yok) | Levitate dosta save'siz; Gaseous Form yeni; üçü kısmi (yükseklik modeli yok, S1 kararı) |

**Sonuç:** 183 büyüde tam 55, kısmi 36, yok 92 (B1 kategorilerinde kalan "yok" sıfır; kısmi olanların notu yalnızca küçük sapma).

- **Yeni sistem yok, mevcutlar genişledi.** Hepsi R2 süren etkisi (`ActiveEffect`), H durumları, S1 uçuşu ve komut → olay → reducer yolundan. Etkiye yeni alanlar: avantajlı/dezavantajlı save (`saveAdv`/`saveDis`; avantaj ve dezavantaj birbirini götürür), direnç (`resist`; `damageProfile` tek yerde, yedi kopya kaldırıldı), saldırılana/saldırana dezavantaj (`attackedDis`, `attackDis` `single`), silah isabetinde ek zar (`hitDie`/`hitType`), hasardan düşülen zar (`damagePenalty`; olayda `penalty` notu, ham hasar cezadan sonra), silah zarı ve yeteneği (`weaponOverride`), tur sonu tekrar save (`repeatSave`), gecikmeli hasar (`delayed`), tepki yok (`noReactions`), saldırı/büyü yok (`noAttack`), ölüm save'i avantajı ve en yüksek iyileştirme (`deathSaveAdv`, `maxHeal`), boyut etiketi (`size`, `icon`), Haste uyuşukluğu (`lethargy`), koyanın sonraki turunun başında biten (`untilSourceTurn`), 0 HP'de biten (`dropAtZero`). Büyü verisinde seçenekli biçimler (`variants`: Enlarge/Reduce), başarılı save'in hafif etkisi (`onSave`), `side: 'any'` (dosta save'siz, düşmana save'li).
- **Süreli tekrar tek komutla:** var olan `spell_followup` genişledi; büyü verisinde `repeat: { cost, target }` (Heat Metal bonus eylem/aynı hedef, Call Lightning ve Vampiric Touch eylem, Gust of Wind bonus eylem). Slot ve konsantrasyon yeniden harcanmaz, ilk turda yapılamaz; arayüzdeki "sürdür" düğmesi ve hedef parlatması değişmeden çalışır. Yapay zekâ tekrarı dost vurmayan ilk düşmana yapar.
- **Tur başı/sonu:** tur sonu `effectTurnEndEvents` (gecikmeli hasar bir kez, sonra biter; tekrar save, başarıda biter), atlanan turda da sayılır; tur başında koyanın `untilSourceTurn` etkileri biter.
- **İyileştirme:** Mass Healing Word altı hedefe ayrı zarla (`healTargets`); Beacon of Hope'ta zar atılmaz, en yüksek değer; Revivify son 10 turda ölene (savaşçıda `diedRound`, reducer'da ölüm anında yazılır, kalkınca silinir; eski kayıtta yoksa izin verilir). 0 HP'den kalkma ve en çok HP sınırı mevcut `applyHealing`'den.
- **İtme:** Gust of Wind çizgisi 60×10 ft (`area.widthFt`), başarısız STR save'de büyücüden uzağa 15 ft, mevcut `pushAwayEvents` (fırsat saldırısı yok, engelde/kenarda durur, düşme yok).
- **Boyut:** Enlarge/Reduce dosta Enlarge (save yok), düşmana Reduce (CON save); seçim verilirse o. Boyut mekanikte tek altıgen kalır; jetonda ⬆/⬇ etiketi.
- **Yaklaşıklıklar (verideki `approx`):** Heat Metal'de her yaratık metal taşır sayılır; Ensnaring Strike'tan kurtulma eylemle Athletics yerine tur başı hasarın ardından STR save, yalnızca bu tur yakın dövüş isabeti (smite yolu); True Strike'ın 5+ seviye Radiant zarı tek seferlik etki; Ray of Enfeeblement'ta STR saldırı/kontrol dezavantajı yok; Slow'da DEX −2 ve eylem kısıtı, Haste'te ek eylem yok; Blindness/Deafness yalnızca Blinded.
- **Hold Person** "tur sonu tekrar save yok" notu eskiydi (save ends zaten `condition-effects.json`'da çalışıyordu); not silindi.
- **Veri koruması:** büyü verisi alan alan karşılaştırıldı (yalnızca dört `approx` bilerek silindi); `applied` dahil yukarı slot alanları testle korunuyor (`b1.test.ts`, `spells.test.ts`).

## 2026-10-29 — Göz parıltısı gerçek gözde; 3D zar logodaki zara benzetildi (Görev L5)

- **Göz konumu elle (gözle) belirlendi.** Otomatik analiz başta "en parlak turuncu nokta"yı alıyordu; geniş logoda bu gözün sağ üstündeki parıltıydı (kullanıcının kaydında parıltı gözün 15–25 px yukarı-sağında). Ejderha başı yüksek çözünürlükte ızgarayla kırpılıp incelendi, göz merkezi yerel renk analiziyle doğrulandı: **geniş logo** gözü koyu badem yarık, merkezi (0,5288; 0,2227) (koyu kırmızı piksellerin ağırlık merkezi 0,5288/0,2227; eski 0,5362/0,2102: 19 px sağda, 20 px yukarıda); **zarsız kapalı logo** gözü parlayan sarı badem, merkezi kare kaynakta (0,5480; 0,2389) (eski otomatik değer 0,5479/0,2378 zaten doğruydu; sahnede 0,5226/0,2435). Değerler `data/acilis-ekrani.json` `eyes` altında elle girilir (`npm run logo` değiştirmez); otomatik değer `data/logo.json`'da yalnızca bilgi.
- **Doğrulama:** üç ekranda (390×844, 1600×900, 1280×720) kapalı gözde patlama anı ve geniş gözde son durum; hesaplanan göz noktasına kırmızı işaret; ışık merkezi ile göz noktası farkı en çok 0,02 px (logo boyunun %0,01'inden az). Işık patlama anında kapalı logodaki gözde, gövde geçişinde aynı eğri ve sürede kayıp (L4) son parıltıyı geniş logodaki gözde yapar.
- **3D zar logodaki zara benzetildi (devirde şekil değişimi yok):** logodaki zar düzgün bir ikosahedronun izdüşümü değil (stilize çizim: ön yüz gerçek geometriye göre ≈%11 dar, silüet biraz uzun). Bu yüzden son poz yalnızca dönüşümle (matrix3d/ölçek/öteleme) oturtulamaz; bunun yerine ağ deforme edildi: `npm run logo` logodaki zarı ölçer (`data/logo.json` `acilis.dieModel`): gri yüz bölgeleri iki eşikte bulunur (açık üst, koyu alt yüzler), her yüzün üç köşesi; gri üçgen siyah çizginin yarısı (6 px) kadar dışa kaydırılıp köşe noktaları (paylaşan yüzlerin ortalaması) çıkarılır: T (0,5005; 0,2913), UL (0,4187; 0,3693), UR (0,5826; 0,3696), LL (0,4188; 0,5206), LR (0,5819; 0,5206), B (0,5004; 0,597), 20 yüzü Fa (0,5006; 0,3537), Fl (0,4521; 0,4906), Fr (0,5488; 0,4906). 3D ağda son pozda (R0) görünen 9 köşenin ekran konumu bunlara eşitlenir (perspektif 7 em hesaba katılarak; derinlik düzenli ikosahedronunki), arkadaki 3 köşe ortalama ölçekle büyür (`fittedVertices`). Dönüş boyunca hafif düzensiz bir ikosahedron; durunca logodaki çizim (köşe hatası < 10⁻⁶ em, testte).
- **Görünüm:** yüz başına ölçülen renkler (üst ve alt bölge ortalaması, açık kenar bandı) — üstten alta gradyan, aynı `<svg>` içinde tanımlı (L4'teki ortak, başka svg'deki gradyana başvuru kopabiliyordu); siyah çizgi logodaki kalınlıkta (yüz başına 6 px'in em karşılığı; L2–L4'te kalındı); 5 px açık kenar bandı. Rakamlar logodaki merkezde ve boyda (ölçülen); açılar gözle belirlendi (logodaki baskı): 20, 18, 4, 6 dik; 8 −8°; 2 +25°; 14 +45°; 12 −97°; 10 −156°; 16 +140°; 18 italik. Yüzün son pozdaki eğikliği rakamın dönüşümünde ters matrisle telafi edilir (ekranda eğilmemiş yazı). Yazı tipi Arial kalın (logodaki rakamlar Arial Black'ten ince). Logoda görünmeyen arka 10 yüz eski basit görünümde.
- **Yönelim ve numaralar:** 20 ortada, 18-4 üstte, 2 sol, 14 sağ, 12 ve 8 yanlarda, 10-6-16 altta — logodaki sıra; L2'deki numaralama zaten buydu, gerçek d20 (karşılıklı toplam 21) korundu. Logodaki 2B baskı ile 3B yönelim arasındaki fark (stilize oranlar) ağın deformasyonuyla giderildi; ek bir yönelim seçimi gerekmedi.
- **Devir farkı ölçüsü** (son pozda 3D zarlı ve yalnız logodaki zarlı iki ekran görüntüsü, zar kutusu, piksel başına ortalama mutlak fark, 0–255; ve 40'tan fazla farklı piksel oranı): **1600×900 önce 44,5 / %38,2 → sonra 13,7 / %11,0**; 390×844 sonra 14,9 / %12. Kalan fark logodaki yumuşak ışıltı (20 yüzünün üstündeki parlama, kenar bandı geçişleri) ve JPEG yumuşaklığı; şekil, kenar ve rakamlar örtüşüyor (yan yana yakın kesitler). Devir 0,2 → 0,4 sn, yalnızca zar bölgesinde (3D zar katmanı solar).
- Kapalı logodaki zar boşluğu için ayrı son poz kullanılmadı: zar geniş logodaki zara devreder; kapalı logodaki boşluk L3 ölçümüne göre ±9 px içinde ve iç siyahla dolu (görünmez).
- **Paket:** ana parça 373,3 kB (değişmedi); `Splash` parçası 11,3 → 15,5 kB (zar modeli verisi ve yüz çizimi).

## 2026-10-29 — Açılış animasyonu düzeltmeleri: önde açılan kanatlar, gözü izleyen ışık, hazır olma bekleme, opak zar (Görev L4)

- **Kanat z-sırası ve açılışı:** sorun, açık kanat katmanının yalnızca altıgenin dışındaki parçası olması ve gövdenin (altıgen) altında çizilmesiydi: kanat altıgenin arkasından çıkıyordu. Çözüm: (1) Açık kanat katmanı artık kanadın tamamı: altıgenin dışındaki her şey ve kanat bölgesinde (sol x < 0,443, sağ x > 0,557; altıgenin içinde y < 0,43 — zarın yanındaki kuyruk y ≈ 0,45'ten başlar, boyun x ≈ 0,447'den) kanat rengindeki ya da kanada 10 px yakın koyu (kontur, kemik) pikseller; en büyük bağlı parça (boynuz/kuyruk kırıntıları atılır). Altıgenin üstünden geçen kol ve zar dahil. (2) Z-sırası: kapalı gövde < geniş gövde < kapalı kanatlar < açık kanatlar (altıgen çerçevesinin önünde; geniş logodaki gibi kökler altıgen kenarını örter) < zar < parlama < göz ışığı < yazı. (3) Kapalı logo gövde ve kanat olarak ikiye ayrıldı (`acilis-kapali-govde.webp`, `acilis-kapali-kanat.webp`; kanat çokgenleri kuyruğu dışarıda bırakacak biçimde, çokgende kanat rengi ya da kanada yakın koyu piksel; gövdede kanatların yeri altıgenin iç siyahıyla dolu). (4) Katlı başlangıç pozu ölçülür (`data/logo.json` `acilis.fold`): açık kanadın kökü (gövdeye en yakın uç) ve ucu (kökten en uzak piksel), kapalı kanadın kökü ve ucu; açık kanat kökten döner (sol −70,7°, sağ +71,0°), küçülür (0,441 / 0,446) ve kökü kapalı köke ötelenir — uç kapalı kanadın ucuna, kök kapalı kanadın köküne gelir. Açılışta açık kanat bu pozdan (ilk %18'de belirerek) dönüp büyüyerek açılır (0,9 sn), kapalı kanatlar 0,2 sn'de solar. Kanat tam açıkken gövdedeki aynı piksellerle çakışır; kökte dikiş yok (yakın kesitle bakıldı). Ek maske/clip-path gerekmedi.
- **Göz ışığı gözü izler:** kapalı gövdeden geniş gövdeye geçiş artık kanatlar tam açılınca (logo sahnesinde 1,1–1,4 sn; önce kapalı gövde görünür kalır, açık kanatlar onun önünde açılır). Işık kapalı logodaki gözde patlar ve geçişte geniş logodaki göze, gövde katmanlarının opaklık geçişiyle aynı eğri (ease-in-out) ve sürede (0,3 sn) kayar; ışık logo katmanlarıyla aynı nefes kapsayıcısında. Geçiş bitince geniş gözde ikinci küçük keskin parıltı (0,38 sn). L3'te ışığın kayması kanat açılışının başına bağlıydı (0,45 sn), gövdeler o sırada üst üste solduğu için ışık geride kalmış görünüyordu. Ölçüm (gerçek zamanlı, ileri sarma yok; ≈100 ms aralık; "görünen göz" = iki gövdenin opaklığıyla ağırlıklı göz konumu):

Masaüstü 1600×900 (hazırlık 166 ms; kapalı göz 820.3,306.0 px, geniş göz 832.6,287.8 px)
| ms (logo sahnesi) | kapalı gövde | geniş gövde | açık kanat | ışık (px) | görünen göz (px) | fark (px) |
|---|---|---|---|---|---|---|
| 106 | 1.00 | 0.00 | 0.00 | 820.3, 306.0 | 820.3, 306.0 | 0.0 |
| 203 | 1.00 | 0.00 | 0.66 | 820.3, 306.0 | 820.3, 306.0 | 0.0 |
| 304 | 1.00 | 0.00 | 1.00 | 820.3, 306.0 | 820.3, 306.0 | 0.0 |
| 408 | 1.00 | 0.00 | 1.00 | 820.3, 306.0 | 820.3, 306.0 | 0.0 |
| 513 | 1.00 | 0.00 | 1.00 | 820.3, 306.0 | 820.3, 306.0 | 0.0 |
| 642 | 1.00 | 0.00 | 1.00 | 820.3, 306.0 | 820.3, 306.0 | 0.0 |
| 744 | 1.00 | 0.00 | 1.00 | 820.3, 306.0 | 820.3, 306.0 | 0.0 |
| 883 | 1.00 | 0.00 | 1.00 | 820.3, 306.0 | 820.3, 306.0 | 0.0 |
| 1005 | 1.00 | 0.00 | 1.00 | 820.3, 306.0 | 820.3, 306.0 | 0.0 |
| 1129 | 0.90 | 0.10 | 1.00 | 821.6, 304.1 | 821.6, 304.1 | 0.0 |
| 1268 | 0.31 | 0.69 | 1.00 | 828.7, 293.5 | 828.7, 293.5 | 0.0 |
| 1412 | 0.00 | 1.00 | 1.00 | 832.6, 287.8 | 832.6, 287.8 | 0.0 |
| 1531 | 0.00 | 1.00 | 1.00 | 832.6, 287.8 | 832.6, 287.8 | 0.0 |
| 1700 | 0.00 | 1.00 | 1.00 | 832.6, 287.8 | 832.6, 287.8 | 0.0 |

Mobil 390×844 (hazırlık 155 ms; kapalı göz 202.9,365.8 px, geniş göz 207.7,358.7 px)
| ms (logo sahnesi) | kapalı gövde | geniş gövde | açık kanat | ışık (px) | görünen göz (px) | fark (px) |
|---|---|---|---|---|---|---|
| 59 | 1.00 | 0.00 | 0.00 | 202.9, 365.8 | 202.9, 365.8 | 0.0 |
| 162 | 1.00 | 0.00 | 0.47 | 202.9, 365.8 | 202.9, 365.8 | 0.0 |
| 259 | 1.00 | 0.00 | 1.00 | 202.9, 365.8 | 202.9, 365.8 | 0.0 |
| 365 | 1.00 | 0.00 | 1.00 | 202.9, 365.8 | 202.9, 365.8 | 0.0 |
| 462 | 1.00 | 0.00 | 1.00 | 202.9, 365.8 | 202.9, 365.8 | 0.0 |
| 565 | 1.00 | 0.00 | 1.00 | 202.9, 365.8 | 202.9, 365.8 | 0.0 |
| 648 | 1.00 | 0.00 | 1.00 | 202.9, 365.8 | 202.9, 365.8 | 0.0 |
| 762 | 1.00 | 0.00 | 1.00 | 202.9, 365.8 | 202.9, 365.8 | 0.0 |
| 866 | 1.00 | 0.00 | 1.00 | 202.9, 365.8 | 202.9, 365.8 | 0.0 |
| 966 | 1.00 | 0.00 | 1.00 | 202.9, 365.8 | 202.9, 365.8 | 0.0 |
| 1081 | 0.94 | 0.06 | 1.00 | 203.2, 365.4 | 203.2, 365.4 | 0.0 |
| 1165 | 0.50 | 0.50 | 1.00 | 205.3, 362.3 | 205.3, 362.3 | 0.0 |
| 1282 | 0.06 | 0.94 | 1.00 | 207.4, 359.1 | 207.4, 359.1 | 0.0 |
| 1399 | 0.00 | 1.00 | 1.00 | 207.7, 358.7 | 207.7, 358.7 | 0.0 |

- **Hazır olma bekleme:** soğuk açılışta yeni hazırlık aşaması: kapalı kanatlı logonun gövde ve kanat görselleri indirilip `Image.decode()` ile çözülene dek saat başlamaz, ekran yalnızca koyu zemin (index.html'deki statik kare de artık yalnızca zemin; zar logosuz görünmez). Hazır olunca logo ve zar birlikte belirir (0,22 sn) ve zar dönmeye başlar. 600 ms'de hazır olmazsa (`prepTimeoutMs`) zar sahnesi atlanır, doğrudan statik geniş logo ve fade. Ölçülen hazırlık: masaüstü 166 ms, mobil 155 ms (yerel sunucu, önbellek ısınmış); yavaş ağ denemesi (kapalı logo 1,2 sn gecikmeli): 0,6 sn'de statik logo. Zar sahnesi boyunca logo görünür. Hazırlıkta dokunma statik logoya geçirir.
- **Zar opak:** yüzler L2/L3'te ortak bir SVG gradyanına (`url(#d20g)`) başvuruyordu; gradyan statik karede ve bileşende aynı kimlikle iki kez tanımlıydı ve statik kare kaldırılınca bazı tarayıcılarda başvuru kopup yüzler yalnızca yarı saydam gölge örtüsüyle kalıyordu (telefondaki "hayalet" görünüm). Artık yüz rengi her yüz için doğrudan opak renk (gümüş-gri #b4b6bb × ışık katsayısı), üstünde ortada daha açık opak iç üçgen; gradyan başvurusu ve `fill-opacity` yok (testte denetlenir). Zar logo üstünde (z-sırasında kuyruk ve kanatların önünde); geniş logodaki zara devir yalnızca geniş gövde tamamen göründükten sonra, kısa (0,2 sn).
- **Sahne süreleri (soğuk açılış, hazırlıktan sonra ≈4,47 sn):** 0–1,7 sn zar döner (logo içinde), 1,7–2,0 sn 20 önde, parlama; 2,0 sn göz ışığı; 2,2–3,1 sn kanatlar açılır; 3,1–3,4 sn gövde geçişi ve ışık takibi; 3,4 sn ikinci parıltı, 3,4–3,6 sn zar devri; 3,3 sn yazı; 4,05 sn fade.
- Tek parça kapalı logo (`acilis-kapali.webp`) uygulamada kullanılmıyor: dağıtımdan çıkarıldı, `assets-ham/logo/uretilen/` altında denetim için üretiliyor. `data/acilis-ekrani.json` `closedLogo` yerine `closedLayers` (gövde, kanat).
- **Paket:** ana parça 373,1 → 373,3 kB; `Splash` parçası 10,6 → 11,3 kB; index.html 23 → 14 kB (statik zar kaldırıldı). Görseller: kapalı gövde 33 kB + kapalı kanat 32 kB (tek parça 44 kB yerine), açık kanatlar 21 + 21 kB (kol dahil).

## 2026-10-29 — Açılış: logo içinde dönen zar, kapalı kanatlı logodan açık kanatlıya geçiş, keskin göz ışığı (Görev L3)

- **Sahne sırası (soğuk açılış, ≈4,47 sn):** 0–1,7 sn koyu zeminde kapalı kanatlı (zarsız) logo 0,26 sn'de belirir, logonun zarının yerinde 3D d20 ease-in döner; 1,7–2,0 sn 20 önde durur, küçük sert merkezli parlama (0,3 sn). 2,0 sn gözden keskin ışık (0,15 sn patlama); 2,22 sn kapalı logo 0,45 sn'de solarken açık kanatlar köklerinden dönerek ve büyüyerek açılır (0,9 sn, ≈3,12 sn'de tam açık), geniş logonun gövdesi belirir; 2,32–2,70 sn 3D zar geniş logodaki zara crossfade ile devreder (altıgen ve zar yerinde kalır). 3,3 sn "DICE & HEX" (0,5 sn), nefes %1,2; 4,05 sn 0,42 sn fade. Dokunma her an: zar sahnesinde logo sahnesine, logo sahnesinde kapanışa. Arka plandan dönüş ve hareketi azalt: zar ve kapalı sahne yok, statik geniş logo ve kısa fade (değişmedi). Logo görselleri 1,5 sn'de inmezse de statik logo. Masaüstü ve mobil tek bileşen, tek sıra.
- **Zarsız zemin:** kullanıcının ürettiği `assets-ham/logo/logo-mobil-zarsiz.jpg` (2048×2048; görevde 2000 deniyordu, dosya 2048 geldi). `npm run logo` koyu zemini kenardan bağlantılı flood-fill ile saydam yapar (zemin = dört köşenin ortalaması ≈ (34,32,35), kanal başına ±9; logonun siyah dış konturu ≈#000 korunur), 1 px daraltma, alfa σ 0,8 (beyaz logolarla aynı yöntem). Zarın eski yerindeki açık gri altıgen leke ((34,32,37) civarı) merkezden bağlı düşük doygunluklu bölge olarak bulunur (421 bin piksel), 12 px genişletilip σ 3 ile yumuşatılan maskeyle altıgenin iç siyahına ((4,4,5); altıgen içindeki koyu piksellerin ortancası) karıştırılır; doygun pikseller (kuyruk, kanat) ağırlıksız kalır (doygunluk 12'ye dek tam, 48'de sıfır). Sınırda iz yok (3 kat parlatılmış görüntüde yalnızca çok silik bir iz). Çıktı `public/logo/acilis-kapali.webp` (900 px, 44 kB). Yolu `data/acilis-ekrani.json` `closedLogo`: gerçek zarsız logo gelirse yalnızca dosya değişir. Zarı boyamadık.
- **Hizalama ölçümleri** (geniş logo tuvali 2624×1632 px; `data/logo.json` `acilis.closed.align`, testte): altıgen dış sınırı (üst/alt köşe x = 0,5 sütununda ilk/son opak; sol/sağ dikey kenar geniş logoda 0,55, kare logoda 0,5 satırında) — geniş: sol 870, sağ 1758, üst 178, alt 1248; kapalı (2048 px): sol 268, sağ 1781, üst 123, alt 1909; zarlı `logo-mobil.jpg` ile ±1 px aynı (iki kare logo aynı kompozisyon). Ölçek x 0,5869, y 0,5991 (ayrı; iki çizimde altıgen oranı %2 farklı), öteleme altıgen sol üst köşesinden. Zar yüz kutusu (kontursuz): kapalıdan dönüşümle 1105,9–1522,1 × 492,5–962,8; geniş logoda 1103–1523 × 487–954 (yatayda ≤3 px, dikeyde ≤9 px fark). Göz (en parlak turuncu nokta): kapalı 0,5226/0,2427, geniş 0,5362/0,2102 (sahne oranı; ejderhanın başı iki çizimde farklı durduğu için tek dönüşümle çakıştırılamaz). Bu yüzden ışık kapalı logodaki gözden çıkar ve kanatlar açılırken (0,45 sn) geniş logodaki göze kayar. 3D zar geniş logodaki zar kutusunda (L2) kalır.
- **Kanat uçlarındaki ince siyah çizgiler:** orijinal sanatın kemik çizgisi değil, L'deki kesim artığı. Kanat katmanının 6 px'lik bindirmesi altıgenin siyah dış konturunu da alıyordu: altıgenin sol/sağ ve alt kenarları boyunca ince bir siyah şerit kanat katmanına giriyor, kanat katlanırken kanatla birlikte dönüp uçlarda çizgi gibi görünüyordu (son karede gövdeyle üst üste bindiği için görünmüyordu). Çözüm: kanat = altıgen sınırından 3 px dışarıda kalan her şey; sınır bandında (3 px dışarıdan 6 px içeriye) yalnızca kanat rengindeki (kırmızı/turuncu: R > 90, R − B > 50, R ≥ G) pikseller kanata da girer (gövdenin altında kalan bindirme, dikiş yok). Altıgen konturu yalnızca gövdede. Logo gövdesi değişmedi.
- **"Kopuk" kanatlar:** açılış artık kapalı kanatlı logonun gerçek kanatlarından başlıyor (geniş logonun katmanları katlı poza döndürülmüyor). Açık kanat kökte (altıgenin sol üst kenarında, 0,385/0,218; sağda aynası) %18 boyda ve gövdeye 38° dönük, saydam başlar; kapalı logo (üstte) solarken döner ve büyür. Kök altıgen kenarında olduğundan kanat gövdeden kopmadan çıkar.
- **Göz ışığı (keskin):** göz noktasında çok küçük beyaz-turuncu çekirdek (sahne eninin ≈%1,1'i), ince yatay (kutu boyu) ve dikey (%62) ışık çizgileri (uçlara doğru sönen linear-gradient), 0,15 sn'de patlayan iki kısa çapraz ışın (sonra söner); çizgiler patlamadan sonra kısalıp ince kalır, çekirdek hafifçe parıldar. Yumuşak geniş hale kaldırıldı. Kutu sahne eninin %32'si, kare; her şey yüzde (sahneyle ölçeklenir). Zar durunca parlama da küçültüldü (%22, sert merkez).
- **Sahne ölçüsü:** geniş logo kutusu; eni min(90vw, 900px), boyu min(70vh, 640px) (en = min(90vw, 900px, min(70vh, 640px) × 1,6078)). Kapalı logo, zar, göz ışığı ve kanatlar bu kutuya göre yüzde; 390×844 ve 1600×900'de aynı oran. Zemin her iki temada #1A1A1C.
- **Küçük zarın kenar tırtığı:** düşük maliyetli bir iyileştirme bulunamadı. Zarı 2× çizip ölçeklemek Chrome'da işe yaramıyor (3D katmanı zaten son ekran ölçeğinde çizer); yüzler L2'den beri SVG ve saydam paylı. Tırtık başsız (yazılımsal) Chromium'da küçük boyutta görünüyor; GPU'lu cihazda beklenmiyor. Gerçek telefonda görülürse ayrı görev.
- **Paket:** ana parça 373,0 → 373,1 kB. `Splash` parçası 9,8 → 10,6 kB. index.html 18 → 23 kB (satır içi CSS: göz ışığı, kapalı logo). Yeni görsel `acilis-kapali.webp` 44 kB (index.html'de yüksek öncelikle önyüklenir). Kanat ve gövde webp'leri yeniden üretildi (bindirme değişti).

## 2026-10-29 — Açılışa dönen 3D d20 (Görev L2)

- **Sahne sırası (soğuk açılış, ≈4,1 sn):** (1) kömür zeminde CSS 3D d20, 1,6 sn ease-in dönüş (4,5 tur; kalan açı Φ(1 − t²): yavaş başlar, sonda hızlı), eğik ve zamanla kayan eksen; 20 yüzü kameraya bakar, tepesi yukarıda durur. (2) 0,52 sn turuncu-beyaz radyal parlama; zar 0,38 sn'de logoya crossfade (dönüş animasyonu son yönelimde kalır). (3) Görev L'nin logo sahnesi logo sahnesinin başından: göz ışığı 0,08 sn, kanatlar 0,38–1,28 sn (0,9 sn), yazı 1,2 sn (0,55 sn), nefes 1,35 sn; 2,05 sn'de 0,42 sn fade. L'nin süreleri sığdırmak için kısaltıldı (kanat başlangıcı 0,65 → 0,38 sn, yazı 1,5 → 1,2 sn, kapanış 2,85 → 2,05 sn); kanat açılışı yine 0,9 sn. Zamanlama `data/acilis-ekrani.json` (`die`, `logo`, `resume`, `reduced`).
- **Zarın boyutu ve konumu:** `npm run logo` logodaki d20'yi görüntü analiziyle bulur (`findDie`: altıgenin %80'e küçültülmüş içinde gümüş-gri, düşük doygunluklu pikseller; dış siyah kontur için 10 kaynak pikseli eklenir): kutu x 0,4165, y 0,2923, en 0,1677, boy 0,2984 (kaynakta ≈440×487 px; `data/logo.json` `acilis.die`). 3D zarın son yönelimdeki izdüşümü (perspektif 7 em dahil) bu kutunun merkezine oturur; ölçek eni ve boyu ayrı oturtan iki ölçeğin ortalaması (en %99,1, boy %100,9). Logodaki çizim tam düzgün ikosahedron değil ve hafif eğik (alt yüzler daha büyük): geçişte iki "20" arasında birkaç piksellik dikey kayma kalıyor; 0,38 sn'lik crossfade ve parlama bunu örtüyor. Zarı eğip logodakine benzetmek "20 kameraya baksın" isteğiyle çeliştiği için yapılmadı.
- **3D zar yalnızca CSS:** saf geometri `src/ui/d20.ts` (ikosahedron köşeleri, 20 yüz, her yüz için `translate3d(em) matrix3d(dönme)`; dönme matrisleri yüz köşelerinden hesaplanır). Gövde `preserve-3d`, yüzler `backface-visibility: hidden`. Dönüş @keyframes'i derleme anında üretilir (31 anahtar kare, eşit açı adımlı, ardışık iki yönelim arası < 55°: tarayıcının matris ara değeri doğru yönde döner; kareler arası doğrusal, aralıklar sona doğru kısalır, böylece ease-in). Yalnızca transform ve opacity canlanır; canvas, WebGL ve three.js yok. Yüzler satır içi SVG (siyah dış üçgen = kalın kenar, ortak gümüş-gri gradyanlı iç üçgen, ışığa göre koyulaştıran örtü; `clip-path` 3D dönüşümde kenar yumuşatmadığı için SVG; katman sınırında tırtık olmasın diye yüz div'inde 0,06 em saydam pay). Rakamlar siyah kalın.
- **Numaralar gerçek d20:** karşılıklı yüzler toplamı 21. 20'nin çevresi logodaki dizilime göre (kenar komşuları 2 sol, 14 sağ, 6 alt; tepe köşesinde 18 ve 4; sol altta 12 ve 10; sağ altta 8 ve 16); arka yarı 21 − n.
- **İlk kare:** zarın ilk yönelimi index.html'de `#splash-static` olarak (React ağacının dışında, görselsiz; JavaScript'ten önce). Açılış bileşeni tembel parça (`Splash`, 9,8 kB): aynı zar HTML'ini (`dieHtml`, statik karede ve bileşende aynı metin) çizer ve ilk karesinden sonra statik kareyi kaldırır. Logo katmanları index.html'de önyüklenir ve zar dönerken çözülür; dönüş bitince hazır değilse en çok 1,5 sn beklenir, sonra statik logo. Açılış kapalıysa (`?acilis=0`, `rpg-battle-acilis=off`) statik kare hemen kalkar. "Hareketi azalt"ta statik karede zar gizlenir (CSS).
- **Soğuk açılış ve dönüş:** tam animasyon yalnızca sayfa yüklenince (yeniden yükleme de soğuk açılış sayılır). Arka plandan dönüş: sekme/uygulama en az 5 dakika gizli kaldıysa (`resume.afterHiddenMs`) ya da sayfa geri-ileri önbelleğinden döndüyse (`pageshow` persisted), kısa sürüm (zar yok, statik logo 0,22 sn belirme, 0,65 sn, 0,3 sn fade). Kısa gizlenmede (sekme değişimi) açılış yok. Hareketi azalt: her durumda zar ve animasyon yok, statik logo ve kısa fade.
- **Atlama:** zar sahnesinde dokunma ya da Esc/Enter/Boşluk logo sahnesine geçirir (zar dönerek söner, parlama ve logo sahnesi baştan); logo sahnesinde kapanışa. Logo görselleri hazır değilken atlanırsa statik logo.
- **Ses:** dönüş başında mevcut zar atma sesi bir kez (`emitDiceSound` → motorun "single" grubu; motor yüklenmemişse, tarayıcı sesi açmadıysa ya da efekt kapalıysa sessiz). Logo sahnesinde Görev L'nin `acilis` kancası aynen.
- **Ekran görüntüsü kancası:** `window.__acilisDur = true` sahne geçişini dondurur (yalnızca tarayıcı betikleri; kullanıcı ayarı değil).
- **Paket:** ana parça 376,6 → 373,0 kB (açılış bileşeni ve mantığı tembel parçaya taşındı; ana parçada yalnızca `splashBoot`: açık mı, dönüş algılama, statik kareyi kaldırma). `Splash` parçası 9,8 kB (gzip 4,3). index.html 5 → 18 kB (gzip 4,5 kB: zar HTML'i ve dönüş @keyframes'i).

## 2026-10-29 — Logo hattı, uygulama ikonu, animasyonlu açılış ekranı (Görev L)

- **Oyun adı geçici: "Dice & Hex".** Tek kaynak `APP_NAME` (`src/app/appName.ts`): sekme başlığı (`index.html` `%APP_NAME%`, vite eklentisi), giriş ekranı başlığı, açılış ekranının erişilebilir adı. **Logo görsellerindeki yazı ("DICE & HEX") değişmez**: görselin parçası; ad değişirse `APP_NAME` yalnızca canlı metni değiştirir, yazılı logo (`logo-acilis.jpg`) yeniden üretilmelidir (adımlar `assets-ham/logo/README.md`).
- **Nerede hangi logo:** kanatları kapalı kare logo (`logo-mobil.jpg`) **yalnızca uygulama ikonunda** (favicon, apple-touch-icon, 1024 ana ikon). Uygulamanın içinde her düzende (masaüstü ve mobil) açık kanatlı geniş logo: giriş ekranı başlığında yazısız sürüm (`public/logo/logo-masaustu.webp`) + canlı "DICE & HEX" başlığı (APP_NAME, Cinzel benzeri serif); açılış animasyonunda yazılı sürüm (`logo-acilis` katmanları; hareketi azalt'ta tek parça `logo-acilis.webp`). Diğer menü ekranlarının başlıkları değişmedi (giriş ekranı = ana menü).
- **Şeffaflaştırma** (`npm run logo`, `scripts/logo.ts`, saf işlemler `src/ui/logoKey.ts`): kenardan bağlantılı yakın-beyaz (tüm kanallar > 232) flood-fill, ön plan 1 px daralma, alfa Gauss σ 0,8; saydam piksellerin rengi en yakın ön plan rengiyle doldurulur (yumuşak kenarda beyaz kalmasın). Zar yüzlerindeki parlak vurgular kenara bağlı olmadığından korunur (rapor `checks.*.keptWhite`). **Görevle fark:** yazılı logoda "D" ve "&" harflerinin iç boşlukları kenara bağlı değil, yalnızca flood-fill'le beyaz kalıyordu; bu yüzden **yalnızca yazı bandında** (logo ile yazı arasındaki boş satırların altı) kapalı yakın-beyaz bölgeler de saydam yapılır (2 bölge). Logo gövdesinde böyle bir işlem yok. Hale denetimi: yarı saydam kenar piksellerinde beyaz kalıntı oranı 0 (iki logo); koyu (#1A1A1C) ve açık zeminde ekran görüntüsüyle bakıldı. Çıktı WebP (alfa kalitesi 100): `logo-acilis` 1400 px (86 kB), `logo-masaustu` 1200 px (53 kB).
- **Açılış katmanları:** kanatlar altıgenin dışında kalan pikseller (altıgen ölçümle sabit çokgen, `HEX`; boynuzlar gövdede kalır), gövde (altıgen, ejderha, zar, kanatların altıgen üstündeki kısmı), yazı bandı. Kanadın altıgen içindeki kısmı gövdede kaldığı için katlanınca gövdede delik açılmaz; açılan kanat kesik kenarı gövdenin arkasına girer (kanat katmanı altta). Kanat katmanı sınırdan 6 kaynak pikseli içeri taşar: ölçeklemede yarı saydam kenarlar üst üste binip dikiş göstermesin. Dönme noktası kanadın altıgene girdiği kök (0,385, 0,218; sağda aynası). **Göz:** baş kutusunda en parlak turuncu nokta (5×5 ortalama) bulundu (0,536, 0,210); gözün hemen üstündeki parıltı, ışık oradan çıkar. Bulunamazsa sabit oran (0,53, 0,215).
- **Animasyon** (yalnızca CSS transform/opacity, canvas ve kütüphane yok; zamanlama `data/acilis-ekrani.json`): kanat görselleri yüklenene dek ilk statik kare (kömür zemin + gövde; `index.html`'de, JavaScript'ten önce; React aynı yapıyı çizip devralır). Sonra 0–0,65 sn katlı kanatlar (kökten 52° dönmüş, 0,3×0,62 ölçek), 0,12 sn'de gözden radyal ışık patlar (0,62 sn) ve hafif nabızla kalır; 0,65–1,55 sn kanatlar açılır (0,9 sn, hafif aşmalı eğri); 1,5 sn'de yazı alttan belirir (0,65 sn), 1,7 sn'den sonra logo nefes alır (%1,2, 3,4 sn); 2,85 sn'de 0,45 sn fade ile ana akış. Dokunma, Esc/Enter/Boşluk her an atlar. Görseller 1,5 sn'de yüklenmezse ya da "hareketi azalt" açıksa statik tam logo (0,25 sn belirme, 1,2 sn, 0,3 sn fade). Giriş ekranı altta hemen hazırlanır (menü müziği ve arka plan açılışı beklemez).
- **Açılış her açılışta.** Tarayıcı denetim betikleri için kapatma: `?acilis=0` ya da `localStorage rpg-battle-acilis=off` (kullanıcı ayarı değil; `check:harita` kapatır, `check:ses` açık bırakır ve dokunarak atlar).
- **Ses kancası:** `data/ses.json` `splash: "acilis"`; ana ses ve efekt kanalı açıksa ve tarayıcı sesi zaten açtıysa (otomatik oynatma izni) efekt kanalından bir kez çalar. Dosya yok (yer tutucu üretilmedi): motor yüklemede null alıp sessiz geçer. Dosya varlığını ana parçada denetlemek için `ses-klipler.json`'un tamamı ana parçaya girecekti (+8 kB); bu yüzden denetim motorda.
- **İkon:** `logo-mobil.jpg`'nin sanatı (altıgen dahil, uzun kenarı) 1024 tuvalin %68'i, #1A1A1C zemine ortalı; kaynağın zemini hedeften ~4 düzey açık olduğundan fark bütün görüntüden düşülür (birleşim izi yok). **Projede yalnızca web var** (Vite; PWA manifesti, Capacitor, Electron, Tauri yok): üretilen `public/favicon.ico` (16/32/48, PNG gömülü) ve `public/ikon/apple-touch-icon.png` (180, opak; Safari "Ana ekrana ekle" web özelliği). iOS uygulaması (1024 opak), Android adaptive/mipmap, Windows .ico (uygulama), PWA maskable üretilmedi; 1024 ana ikon `assets-ham/logo/uretilen/ikon-1024.png` olarak saklanır (dağıtıma girmez).
- **Başlık yazı tipi:** dış yazı tipi yüklenmez (çevrimdışı ve açılış hızı); Cinzel, Trajan Pro, Cormorant SC varsa onlar, yoksa Georgia/Times serif, büyük harf ve harf aralığı. `text-transform` Türkçe dilde "i"yi "İ" yaptığından başlık `lang="en"`.
- **Paket:** ana parça 371,0 → 376,6 kB (+5,6 kB: açılış bileşeni, mantık, katman yerleşimi). Görseller tembel değil ama küçük: ilk kare için yalnızca gövde (33 kB) önyüklenir; kanat ve yazı katmanları (17+18+24 kB) bileşen açılınca. Açılış CSS'i `index.html`'de satır içi (~2 kB).

## 2026-10-29 — Büyü altyapısı, 0–3. seviye denetimi, ışınlanma, uçuş, Exhaustion (Görev S1)

- **Denetim** (`docs/harita/BUYU-DENETIMI.md`, `node scripts/buyu-denetimi.mjs` üretir): SRD 5.2.1'in 183 adet 0–3. seviye büyüsü — tam 49, kısmi 32, yok 102. Durum `data/spells.json`'dan çıkar (kayıt yok / `unsupported` / yalnızca "elle uygulanır" = yok; `approx` = kısmi). Eksik sistem elle atanmış ya da SRD metninden anahtar sözcükle tahmin; en kalabalıklar: özel mekanik, kalıcı zemin etkisi, savaş dışı, nesne etkileşimi, aydınlatma/karanlık, zihin kontrolü, algılama, yanılsama. Daha önce "tam" görünen tek seferlik yaklaşıklamalara (Web, Moonbeam, Stinking Cloud, Flaming Sphere, Heat Metal, Call Lightning, Hypnotic Pattern, Fear, Hold Person…) `approx` notu yazıldı: denetim bunları kısmi sayar.
- **Işınlanma** (`src/battle/teleport.ts`, büyü türü `teleport`, olay `teleported`): yalnızca `pos` değişir; yürüme olmadığından fırsat saldırısı, zemin girişi, tuzak ve aura adımı tetiklenmez; sıra, konsantrasyon ve ekonomi korunur. Hedef: harita içi, geçilebilir, boş, menzilde, görüş gerekiyorsa görüş hattı açık (iki yandan da kesik değilse) ve karanlıkta görülebilir. Haritasız savaşta yok. Misty Step bununla; SRD canavarlarında ışınlanma eylemi yok (yalnızca "can't teleport" metni). Arayüz: büyü menüsünden seçince ışınlanılabilecek altıgenler çağırma vurgusuyla.
- **Uçuş** (`src/battle/flight.ts`): uçuş hızı kendi `fly` alanından ya da süren etkiden (`effect.fly`: Fly 60 ft); `isAirborne` (uçuş hızı ya da Levitate'in `airborne`'u) eski `fly > 0` denetimlerinin yerine (zorlu arazi, zemin etkileri, atlama riski, itme). Yükseklik modeli ayrı kaldı. **Uçuş bitince düşme hasarı yok** (yükseklik modeli olmadığından yer seviyesine iner sayılır). Levitate yalnızca istemeyen düşmana: CON save, başarısızsa havada ve yürüyemez (`speedZero`). Gaseous Form çalışmıyor (direnç ve eylem kısıtı yok). Jetonda 🪽 rozeti (yalnızca etkiyle uçana; kendi uçuş hızı olan canavarda yok).
- **Exhaustion** (`src/rules/exhaustion.ts`; savaşçıda `exhaustion`, olay `exhaustion_changed`): SRD 5.2.1 — her seviye d20 Testlerine −2 (saldırı, save, kontrol, inisiyatif, ölüm save'i; sabit eklenti olarak günlükte), hıza −5 ft; 6'da ölüm; uzun dinlenme 1 azaltır; savaş sonu karaktere yazılır. Kaynak şimdilik Game Master (kart çekmecesinde −/+, `set_exhaustion`): 0–3. seviye SRD büyülerinde bitkinlik veren yok. Durum bağışıklığı modellenmediği için Exhaustion'a bağışık canavar da etkilenir (Game Master'ın kararı). V'deki soluk filtre artık bu seviyeden çalışır; rozet 😩N.
- **Etki modeline eklenenler** (R2 `EffectSpec`/`ActiveEffect`): `fly`, `airborne`, `speedZero`, `grants` (süresince durum; Invisibility → Invisible, biten etkinin durumu başka kaynak yoksa düşer), `breakOnAct` (saldırı ya da büyüyle biter), `ac`, `acMin` (Barkskin 17, Mage Armor 13 + DEX), `speedMult` (Haste ×2, Slow ×0,5), `speedFt` (Longstrider), `tempHpNow` (False Life). Yeni büyü türleri `cure` (Lesser Restoration), `revive` (Spare the Dying: stabil; Revivify: 1 HP, olay `life_restored`).
- **Uygulanan büyüler:** Misty Step, Fly, Levitate (kısmi), Invisibility (kısmi: saldırısız hasarla bitmez), Haste (kısmi: ek eylem, DEX save avantajı, bitişteki uyuşukluk yok), Slow (kısmi: hedef seçimi, DEX/tepki/eylem kısıtları yok), Barkskin, Mage Armor (kısmi: zırh denetimi yok), Lesser Restoration, Spare the Dying, Revivify (kısmi: "son bir dakika" denetimi yok; ölü dost çizilmediği için hedefsiz yapılır, bitişikteki ölü dost seçilir), Animate Dead (kısmi: R3 çağırmasıyla, kurulumda slot harcayarak tek Skeleton/Zombie), False Life, Longstrider, Mind Spike (kısmi: konum bilme yok).
- **Animate Dead:** döküm süresi 1 dakika olduğu için savaşta yapılmaz; Find Familiar gibi kurulumda (`setup`), ama slot harcar (`setupSlot`). Kurulumdaki çağırma seçicisi artık her kurulum çağırma büyüsü için ayrı satır.
- **Yapay zekâ (basit):** HP yarının altında, bitişiğinde düşman olan menzilli büyücü bonus eylemle Misty Step yapar (düşmanlardan en uzak, eşitse oradan saldırabileceği altıgen). Yürüyerek hiçbir düşmana yetişemeyen ama uçarak yetişebilecek büyücü kendine Fly yapar. Diğer yeni etki büyülerini yapay zekâ kendiliğinden yapmaz (yalnızca Bless türü saldırı zarı etkileri, R2).
- **Simülasyon partileri:** Kael ve Rook 3. seviyede Longstrider'ı da hazırlar (yeni büyüyle Ranger'ın 1. seviye büyü havuzu 4 oldu; test tablo kadar hazır büyü ister). Etkisi yok: yapay zekâ Longstrider yapmaz.
- Kayıt sürümü değişmedi (18): yeni olaylar ve alanlar eski kayıtlarda yok, eski olaylar aynı yorumlanır.
- Ana parça 364 → 371 kB: artış büyük ölçüde ana parçadaki büyü verisi (`data/spells.json` +7 kB; açıklama ve `approx` notları). Motor kodu savaş parçasında (tembel).

## 2026-10-29 — Jeton işaretleri: ışık hüzmesi, halka düzeni, tek döngü efekti (Görev V2)

- **Hata (Görev V'den):** figür filtre grubuna (`token-filter`) alınınca `.token .fig ~ .ring` eşleşmiyordu; resimli jetonlarda halka görünüyordu. Halka artık figürle aynı grubun içinde, `AvatarCircle`'ın hemen ardında: resimli jetonda gizli, resimsiz (baş harfli) jetonda takım rengiyle kalır. Takım rengi resimli jetonda yalnızca figür silüetine parıltı.
- **Halkalar yalnızca durum efektlerinin.** Oyun akışı işaretleri halka yerine altıgen tabanından yukarı solan ışık hüzmesi (SVG `linearGradient` + taban elipsi; blur ve filtre yok). Hüzmeler bütün jetonların arkasında ayrı bir katmanda (`.beams`), böylece aşağıdaki jetonun hüzmesi yukarıdakini örtmez. Yükseklik ~1,15 altıgen (alan önizlemesinde ~0,75, daha sönük, animasyonsuz). Kaldırılan işaret halkaları: `.pick-ring`, `.area-mark`, `.token.turn/target/selected/glow/picked .ring`, sıra/hedef/seçili/seçilebilir figür parıltıları. Uyuyan yaratığın kesikli halkası (resimsiz jetonda) ve Zzz rozeti kaldı. Seçilebilir hedefin nişangâh rozeti ve kırmızı altıgen dolgusu kaldı (halka değil; renk körlüğü için simge).
- **Hüzme renkleri ve öncelik** (`beamFor`, `BEAM_PRIORITY`; jetonda yalnızca en öncelikli biri): sırası gelen (altın, hafif nabız) > kurulumda seçili (sarı, ince, kesikli taban) > seçili hedef (beyaz) > etki büyüsünde seçilmiş (yeşil) > seçilebilir (kırmızı, ince, yavaş yanıp söner) > alan önizlemesi düşman (kırmızı, kısa, sönük) > alan önizlemesi dost (sarı, kısa, sönük). Kurulumdaki seçim savaşta sıra işaretiyle aynı anda olmadığı için öncelik sırasına ikinci olarak eklendi (görevde yerini belirtmemişti).
- **Efekt varken yalnızca efekt:** durum efekti oynayan jetonda (`has-fx`) takım parıltısı yok, yalnızca ince koyu kontur; efekt bitince parıltı döner. Hüzmeler efektten bağımsız.
- **Tek döngü efekti:** jetonda aynı anda yalnızca biri; birden çok durumda öncelik sırasıyla (paralyzed > stunned > incapacitated > frightened > charmed > restrained > grappled) 2,5 sn'de bir sıradakine geçer (`ROTATE_MS`, 0,3 sn belirme). Sayaç yalnızca çok durumlu jeton varken çalışır. V'deki "en çok 2 eşzamanlı efekt" kalktı. Bütçe (8 animasyon) ve "hareketi azalt" (statik ilk kare, sıra değişmez) aynı.
- **Hasar efektiyle çakışma:** tek seferlik hasar efekti (yanma, zehir, donma, asit, kanama) oynarken o jetonun döngü efekti gizlenir (o anki hasar animasyonu listesinden; animasyon bitince döngü sıfırdan başlar). Gerekçe: iki halka/patlama üst üste okunmuyor; hasar anlık ve önemli.
- Kayıt sürümü değişmedi (18); motor değişmedi.

## 2026-10-29 — Durum efektleri, jeton filtreleri ve engel görseli (Görev V)

- **Birleştirme:** origin/main (yeni ham görseller: 7 durum efekti, engel, zar görselleri) dala birleştirildi, çakışma yok. `Stunned.jpg` → `stunned.jpg`.
- **Sheet kesimi** (`scripts/efekt-kesim.mjs`, saf; `scripts/efektler.mjs` kullanır): sheet'ler farklı biçimde geldi (4×2 etiketli gri zeminli ızgara, ince ayraçlı şerit, ayraçsız şerit, düzensiz genişlikli engel). Macenta bantları satırlardan, hücreler macentası olmayan (ayraç/gri) sütunlardan; ayraçsız şeritte kare sayısı içerik profilinin öz-ilinti periyodundan (kareler kare değil: frightened 275×346); katı periyot (2 kare) seçilmesin diye en yüksek tepenin %80'ine ulaşan en kısa periyot. Boş hücreler atılır. Hasar efektlerinin eski hattı değişmedi (çıktı dosyaları birebir aynı).
- **Tespit:** paralyzed 8 (4×2), stunned 8 (4×2), incapacitated **8** (beklenen 7; 10 hücrenin ilk ve sonu boş, kalan 8'in hepsinde duman var, sondaki solan kare de alındı), frightened/charmed/restrained/grappled 10, engel 7.
- **Şeffaflık:** durum efektlerinde geniş toleranslı macenta + iki geçişte halo + kenarda despill. Engelde duvarın mor gövdesi ve tabanın parlak moru macentaya çok yakın: geniş tolerans gövdeyi deliyordu, bu yüzden engelde yalnızca kenardan bağlantılı saf macenta silinir.
- **Döngü kuralı** (`src/ui/statusFx.ts`): jeton başına en çok 2 döngü efekti, öncelik veride (`priority`); Incapacitated'ı içeren durumlar (Paralyzed, Stunned, Unconscious, Petrified) varken ayrıca incapacitated efekti yok (rozetteki gibi). Ekranda en çok 8 animasyon (`MAX_ANIMATED`): önce her jetonun ilk efekti, sonra ikincisi; aşan statik ilk kare. "Hareketi azalt"ta hepsi statik. Ayar: savaş menüsündeki efekt düğmesi ("Efektler (harita, durum)") durum efektlerini de kapatır; rozetler kalır. Halka çapı jetonun %115'i, ikinci efekt %131 (iç içe halkalar). Görseller jeton çizilince yüklenir (önden yükleme yalnızca hasar efektlerinde); ana parça +0,3 kB.
- **Rozetler:** Restrained, Charmed, Frightened ve kanama (Infernal Wound) rozetleri eklendi. Hasar efektleri (yanma, zehir, asit, kanama, donma) eskisi gibi tik anında bir kez; asidin kalıcı durumu motor tarafında yok, rozeti de yok.
- **Jeton filtreleri** (CSS filtresi, figüre; birden çoğu birleşir): Petrified gri tonlama + kontrast %85; Invisible %45 saydam; Unconscious (ya da 0 HP'de ölmekte/stabil) %60 parlaklık; Prone %82 küçülme + koyu gölge halkası; Exhaustion (motor henüz uygulamıyor; "Exhaustion" ile başlayan durum adı) soluk renk; çağrılmış yaratık hayalet (mavimsi, %70 saydam).
- **Görünmez düşman:** Invisible durumundaki jeton herkese yarı saydam görünür, gizlenmez. Gerekçe: oyunda konum herkese açık (tek ekran) ve Invisible yaratık hedef alınabilir (SRD: saldırı dezavantajlı); gizli konum gizlenmeyle (`hidden`, Hide) zaten ayrı modellenmiş, onu değiştirmedik.
- **Engel:** yalnızca sprite hattı ve önizleme sayfası (`onizleme-engel.html`, geliştirme sunucusunda; build girdisi değil). Oyunda kullanılmıyor.
- Kayıt sürümü değişmedi (18): durumlar zaten kayıttaki savaşçılarda. Denge etkisi yok: standart parti 3. seviye Mağara, Koridor, Kale × 200, HEAD ile birebir aynı.

## 2026-10-29 — Fighter, Rogue, Ranger 1–20 ve Champion, Thief, Hunter (Görev F)

- **Yarım iş korundu:** stash ve `gorev-f-wip.patch` önce `wip/gorev-f` dalına "WIP" commit'i olarak itildi; ana dalda E1 sonrası koda uyarlandı. Champion/Thief/Hunter mekanikleri `data/subclasses.json` `effect` alanlarında (jenerik şema), sınıf düzeyi özellikler `data/class-features.json`'da.
- **Özellik işaretleri veriden:** mekanikte `trait` (savaşçıda `traits`), `stat: critOn` (Improved/Superior Critical), `stat: saveProficiency` (Slippery Mind), seçenekli özellik `options` + `default` (Hunter's Prey, Defensive Tactics; karakterde `featureChoices`, oluşturucuda açılır liste; anahtar `sınıf/altsınıf:özellik`). Kurallar tek modülde: `src/battle/classTraits.ts` (kodda sınıf adı yok). Dış içerik şeması aynı alanları tanır (`KNOWN_TRAITS`).
- **İkinci şans zarları** (`ExtraDie.reroll`, `rules/attack.ts` `secondChance`): Indomitable (başarısız save yeniden, + Fighter seviyesi), Stroke of Luck (başarısız D20 Testi 20 olur), Tactical Mind (başarısız kontrole 1d10; tutmazsa Second Wind harcanmaz). Hepsi kendiliğinden kullanılır (karar sorulmaz; yapay zekâ ve oyuncu için aynı), kaynak reducer'da düşer, günlükte zar eklentisi olarak görünür.
- **Cunning Strike** (`attack.cunning`): Sneak Attack isabetinde seçilen seçenekler zar düşer; DC 8 + DEX + yetkinlik. Trip (Large ya da küçük, DEX, Prone), Withdraw (yaklaşık: bu tur Disengage; SRD'de hemen yarı hızla hareket), Daze (CON, sonraki turunun sonuna dek Dazed: turunda yalnızca biri — hareket, eylem ya da bonus eylem), Knock Out (CON, Unconscious, tur sonunda CON save ile biter, en çok 10 tur; SRD'deki "hasar alınca uyanır" yok), Obscure (DEX, Blinded). Improved Cunning Strike iki seçenek. Poison yok (alet verisi yok). Arayüz: saldırı balonunda onay kutuları (yetmeyen zar soluk).
- **Steady Aim** (`steady_aim` komutu, bonus eylem, bu tur hareket etmemişse): bu turun sonraki saldırısı avantajlı, hız 0 (`movementUsed` 999). **Horde Breaker** (`horde_breaker`): turda bir kez, bu tur silahla saldırılan yaratığın 5 ft yakınındaki başka yaratığa aynı silahla ek saldırı (`economy.lastTargetId`). Colossus Slayer, Superior Hunter's Prey (`extra_damage` olayı; ikinci hedef kendiliğinden en düşük HP'li), Foe Slayer (d10), Precise Hunter (avantaj), Relentless Hunter (hasar Hunter's Mark konsantrasyonunu bozmaz), Escape the Horde, Multiattack Defense (`mdefense` işareti), Studied Attacks (`studied` işareti).
- **Savunma:** Evasion (`saveDamage`; bütün save'li hasar yolları: büyü, alan, aura, canavar), Elusive (avantaj kaynakları düşer), Reliable Talent (yetkin beceride 9↓ → 10), Survivor (ölüm save'i avantajlı, 18–20 doğal 20; Bloodied iken tur başı 5 + CON), Remarkable Athlete (inisiyatif ve Athletics avantajlı).
- **Herkesin silahsız vuruşu** (SRD Unarmed Strike): 1 + STR (en az 0) bludgeoning, STR + yetkinlik; Monk'ta Martial Arts sürümü. Sabit hasar ifadesi zar atmaz (`parseDice("3")`).
- **Yapay zekâ:** Steady Aim (bitişik düşman yokken, saldırıdan önce), Cunning Strike (Trip: hedefe bitişik bir müttefik varsa, hedef Large ya da küçükse ve Sneak Attack ≥ 3d6; Withdraw: yakın dövüşte HP yarının altındaysa), Horde Breaker (Attack ve Action Surge sonrası), Indomitable/Stroke of Luck kendiliğinden.
- **Çalışmayanlar (yeni sistem açılmadı):** Tactical Master (saldırı başına ustalık seçimi), Heroic Warrior (Heroic Inspiration), Thieves' Cant, Fast Hands ve Use Magic Device (eşya eylemi), Supreme Sneak (Invisible koşulu gizlenmeden ayrı değil), Thief's Reflexes (ilk turda çift sıra), Hunter's Lore (bilgi). Kısmi: Tactical Shift ve Remarkable Athlete'in yarım hızlı hareketi (Disengage yaklaşığı), Second-Story Work'ün atlama mesafesi, Roving'in tırmanma/yüzme hızı, Tireless'ın Exhaustion'ı, Feral Senses'in görünmezlik etkisi, Deft Explorer'ın dilleri, Ranger Fighting Style'ın Druidic Warrior seçeneği, Superior Hunter's Defense (yalnızca isabet).
- **Kayıt sürümü 18** (3–18 yüklenir): yeni olaylar `mark_added`, `steady_aim_used`, `extra_damage`; `attack_resolved` yeni alanlar (`traitTurns`, `steadyAim`, `cunning`). Elle zar: ikinci şans ve Cunning Strike save'leri aynı zar defterinden.
- **Simülasyon partileri:** `fighter` (Bor yerine Dain: Greatsword + Great Weapon Fighting, Champion), `rogue` (Bor yerine Nix: ikinci Thief), `ranger` (Bor yerine Rook: yakın dövüş Hunter, Longsword + kalkan, Horde Breaker). Kael'e Deft Explorer uzmanlığı (Perception) eklendi.
- **Denge (gözetimsiz):** eski partilerin hızlı regresyonu atlandı (Bor/Sela/Kael bilerek değişti), doğrudan tam ölçüm yapıldı. Ortak listelerde birden çok partinin aralık dışında kaldığı 6 senaryo düzeltildi (2 deneme, `docs/harita/DENGE.md`); tek partide aralık dışı kalanlar (Rogue partisi Düz %52, Ranger birkaç senaryoda 86–91, standart 3. seviye Koridor %94) bırakıldı, çünkü ortak listeyi değiştirmek diğer partileri aralık dışına itiyor. Haritaya 9'dan fazla düşman sığmadığından 5. seviye Kale ve Taverna'da düşman eklemek yerine türü güçlendirildi.

## 2026-10-29 — Jenerik alt sınıf şeması ve dış içerik yükleyici (Görev E1)

- **Şema** (`data/subclasses.json`, `SubclassDef` / `SubclassFeatureDef`, `src/data/types.ts`): alt sınıf `id` (bütün alt sınıflar arasında benzersiz; aynı görünen ad iki sınıfta olabilir), `class`, `srd` (yalnızca SRD alt sınıflarında), `pack` (dış içerik paketinin kimliği; yükleyici yazar), TR/EN `name` ve `role`, `features`. Özellik: `id`, `level` (1–20), TR/EN `name` ve `description`, `status` (`calisir` / `planli` / `hikaye` / `calismiyor`), `effect` (data/class-features.json özellik mekaniğiyle aynı biçim; yeni etki türü yok). Anahtar `sınıf/altsınıf:özellik` (SRD kimliği, değişmez).
- **Etkin seviye** max(özellik seviyesi, alt sınıf seviyesi = 3): alt sınıf 3. seviyede seçilir, daha önceki seviyedeki özellikler 3'te birlikte açılır. SRD'de 3'ten önce alt sınıf özelliği yok.
- **12 SRD alt sınıfı taşındı:** adlar ve roller (SRD'nin "flavor" satırı) TR/EN, açıklama EN = SRD metni, TR = kısa özet. Alt sınıf mekanikleri (7 kayıt: Frenzy, Retaliation, Cutting Words, Open Hand Technique, yemin büyüleri, Sacred Weapon, Superior Hunter's Defense) `class-features.json`'dan `effect` alanına taşındı; sınıf özellikleri yerinde. Etkisi olmayan özelliklerin etiketi: `planli` (durum bağışıklığı, Bardic Inspiration, Wild Shape/dinlenme, uçuş, Heroic Inspiration gibi listede bekleyen sistemler), `hikaye` (savaş dışı: Hunter's Lore, Fast Hands, Use Magic Device, Evocation Savant), diğerleri `calismiyor`. **Regresyon:** taşımadan önce 12 alt sınıf × 20 seviyenin `gainedFeatures` + `classKit` çıktısının SHA-256 özeti fikstüre yazıldı (`src/rules/fixtures/alt-sinif-oncesi.json`); test birebir aynılığı denetler. Simülasyon (4 parti × 3/5. seviye × 4 senaryo × 200) HEAD ile aynı.
- **Görev F ile ilişki:** F'nin yarım işi (Fighter/Rogue/Ranger) `class-features.json`'a Champion/Thief/Hunter mekanikleri ekliyordu; Görev F'de bunlar `data/subclasses.json`'daki `effect` alanlarına yazıldı.
- **Dış içerik paketi** (`src/content/schema.ts`): `{ "format": "rpg-battle-icerik", "version": 1, "id", "name": {tr,en}, "author"?, "subclasses": [...] }`. Yalnızca JSON okunur; kod çalıştırılmaz, ifade değerlendirilmez. Doğrulama: biçim/sürüm, kimlik deseni (küçük harf, rakam, tire; 2–48), SRD ve yüklü paketlerle alt sınıf kimliği çakışması, paket kimliği çakışması (önce silinmeli), paket içinde yinelenen kimlik, bilinen sınıf, seviye 1–20, durum etiketi, etki alanları yalnızca `FeatureMechanic` alanları ve bilinen değerler (tür, durum, stat, kaynak, komut, feat kategorisi, tepki/etki türü, büyü adları), "çalışır" ⇔ ok/partial etki. Hatalar kod + konum; metinleri TR/EN (`strings.ts` `content.errors`).
- **Sınırlar:** dosya 256 kB, en çok 20 paket, pakette en çok 24 alt sınıf, alt sınıfta en çok 30 özellik, ad 60 / açıklama 4000 karakter. Bozuk JSON ve büyük dosya hata olarak döner; diğer dosyalar etkilenmez.
- **Yükleme:** tarayıcı belirli bir klasörü kendiliğinden okuyamaz. Masaüstünde (Chromium) "Klasörden yükle" klasör seçiciyle klasördeki bütün .json dosyalarını okur (önerilen klasör `icerik/`); her yerde (mobil dahil) dosya seçici. Paketler bu tarayıcının localStorage'ında (`rpg-battle-icerik`), açılışta sınıf verisinden sonra yeniden doğrulanıp uygulanır. Ayarlar ekranı (ana ekranda "Ayarlar"; tembel parça) "Dış içerik": liste, özet (alt sınıf ve "çalışmıyor" sayısı), tek tek aç/kapa, sil (onaylı).
- **İçerik eksik:** paket silinir ya da kapatılırsa onu kullanan karakter değişmez (alt sınıf kimliği kalır), listede "içerik eksik" görünür, oluşturucuda seçenek olarak durur, alt sınıf özellikleri olmadan savaşa girer. Bilinmeyen alt sınıf artık karakter sorunu sayılmaz (eskiden "Bilinmeyen alt sınıf" kaydetmeyi engelliyordu).
- **Depoya girmez:** `.gitignore`'a `data/custom/` ve `icerik/`. Test için yalnızca kurgusal örnek paket (`src/content/fixtures/ornek-paket.json`: "Kehribar Muhafızı", "Sis Yolcusu"). `npm run check:icerik [klasör]` (varsayılan `icerik/`): paketleri sırayla doğrular, çakışma, eksik alan, bilinmeyen etki, seviye aralığı, alt sınıf başına durum sayıları ve "çalışmıyor" toplamı; hata varsa çıkış 1.
- **Kayıt sürümü 17** (3–17 yüklenir): kayda o an açık dış içerik paketlerinin kimlikleri (`content`) yazılır; yüklerken eksik olanlar `missingContent` olarak döner, savaş yine oynar (alt sınıf özellikleri olaylardaki savaşçılarda).
- Alt sınıf özelliğinden gelen uzmanlık bir kez sayılır (sınıf tablosunda birden çok kez gelen Expertise sayımı yalnızca sınıf özelliklerinde).

## 2026-10-29 — Arayüz düzeltmeleri (Görev U)

- **Savaş menüsü (≡, sol üst):** açıkken katmanı eylem düğmelerinin (radial, z 4) ve açıklamalarının (z 7) üstünde (z 9). Yüksekliği savaş alanıyla sınırlı, sığmazsa dikey kaydırılır (dokunmatikte de). ≡ düğmesi artık menü genişliğine yayılmıyor. 360×640 (dikey; uygulama yatay çevirmeyi ister, menü şeritte kaydırılır), 640×360 ve 1280×800'de en alttaki düğme ("Kuruluma dön") erişilebilir ve üstünde başka öğe yok (Playwright).
- **Özel canavar adı:** en fazla 50 karakter (`CUSTOM_NAME_MAX`, `app/limits.ts`): giriş alanı sınırlar, sayaç gösterir (TR/EN erişilebilir etiket), listeye eklerken de denetlenir. Özel canavarlar yalnızca o kurulumda tutulur; kayıtlı savaşlardaki adlar (savaşçı adı) kırpılmaz, `customMonster` uzun adı değiştirmez.
- **Ölü hedef:** hedef listesi (`attackChoices`) yalnızca erişime bakıyordu; 0 HP canavar (altıgende kalan, `life: alive`) ve ölü karakter kırmızı hedef olarak görünüyordu. Artık hedef olabilmek `isTargetable` (ayakta, yenilenmeyi bekleyen, ölmekte ya da stabil): baygın karakter (SRD Unconscious) hedef olabilir, ölü canavar ya da kaybolan çağrı olamaz. Seçili hedef ölünce işareti de kalkar.
- **Savaş sonu:** bu ekranda savaş bitince bir kez görsel efekt (`ui/EndFx.tsx`, tembel parça ≈0,7 kB: zaferde altın parıltı ve 26 konfeti, yenilgide kızıl karartma; yalnızca CSS dönüşüm/saydamlık, tıklamayı yutmaz, 3,6 sn'de kaybolur, hareket azaltmada konfeti yok) ve ezgi (efekt kanalı, `data/ses.json` `end`). Ana ses ya da efektler kapalıysa ezgi istenmez bile. Kayıttan yüklenen bitmiş savaşta oynamaz.
- **Ezgi dosyaları yer tutucu:** projede ses sentezi yok; ham sesler `assets-ham/ses/` altında (görevdeki "assets/ses" bu klasör sayıldı). `npm run ses:yer-tutucu` ffmpeg ile iki kısa ezgi üretir (`son-zafer`: majör arpej, `son-yenilgi`: inen minör; var olanın üstüne yazmaz). Gerçek ses aynı ASCII adla konup `npm run ses -- son-zafer son-yenilgi` çalıştırılır; `npm run ses` artık ad verilince yalnızca o dosyaları işler (diğer çıktılar ve kayıtları korunur). Yeni kategori `son-*`: bölünmez, tepe −1 dBFS.
- **Giriş müziği gecikmesi:** ses motoru eskiden ilk dokunuşta yükleniyor, menü müziğini (3 MB) o anda indirip çözüyordu. Artık motor sayfa açılınca (ayrı parça, ≈5,8 kB) yüklenir, sahnenin dosyalarını bağlamsız önyükler (`prefetch`), ve tarayıcı izin veriyorsa (otomatik oynatma serbest ya da site etkileşimi yüksek) dokunuşsuz başlar (`tryAutoStart`: bağlamı sürdürmeyi dener, 400 ms'de çalışmıyorsa bekler). Kısıt varsa ilk dokunuşta yalnızca çözme kalır. `check:ses`: kısıtlı tarayıcıda dokunuştan önce çalmıyor ama önyüklenmiş, serbest tarayıcıda dokunuşsuz çalıyor (headless kabuk bayrağı yok saydığı için kısıt sayfa içinde taklit edildi).
- Kayıt sürümü değişmedi (16).

## 2026-10-29 — Durum denetimi: Incapacitated, Stunned, Paralyzed (Görev H)

- **Kaynak SRD 5.2.1 Rules Glossary** (Incapacitated, Stunned, Paralyzed; karşılaştırma için Unconscious, Petrified). Durum tanımları `data/srd/` altında ayrı dosya değil; metin `docs/SRD_CC_v5.2.1.pdf`'ten okundu. Etkisiz bırakan durumların listesi `data/conditions.json` `incapacitating` (değişmedi).
- **Denetim sonucu:**

  | Kural | Önceden | Görev H |
  |---|---|---|
  | Incapacitated: eylem ve bonus eylem yok | vardı (`checkActor`) | aynı |
  | Incapacitated: tepki yok | vardı (`canReact`, fırsat saldırısı) | aynı |
  | Incapacitated: konsantrasyon kesilir | vardı (reducer; çağrılan yaratık kaybolur) | aynı |
  | Incapacitated: hareket | **yanlış**: her komut reddediliyordu | yürü, atla, kalk, yükseklik değiştir serbest (hızı 0 değilse) |
  | Incapacitated: inisiyatifte dezavantaj, konuşamaz | yok | uygulanmaz: savaş durumsuz başlar, konuşma sistemi yok |
  | Stunned: STR/DEX save otomatik başarısız, ona saldırılar avantajlı | vardı | aynı |
  | Paralyzed: STR/DEX save, avantaj | vardı | aynı |
  | Paralyzed (ve Unconscious, Petrified): hız 0 | dolaylı (her komut reddediliyordu) | `speedZero` (Grappled ve Restrained ile tek liste); `speedHexes` 0 |
  | Paralyzed/Unconscious: 5 ft içinden isabet kritik | **yanlış**: "yakın dövüş saldırısı" sayılıyordu | haritada bitişik altıgen (menzilli de kritik; 10 ft erişimli yakın dövüş kritik değil), haritasızda yakın dövüş |
  | Süre (1 tur, sonraki tura dek, kurtarma) | vardı (`conditionTimers`) | aynı; testler eklendi |
  | Rozet | yoktu (yalnızca kart listesi) | jetonda Paralyzed ⛓ / Stunned 💫 / Incapacitated ⊘ simgesi, TR/EN açıklama |
- **Hareket:** SRD 5.2.1'de Incapacitated ve Stunned hızı düşürmez ("can't take any action, Bonus Action, or Reaction"); bu yüzden oyuncu sersemlemiş karakteriyle yürüyebilir. Dash ve Disengage eylem olduğu için yine yok. Yapay zekâ etkisizken yürümeyi denemez, turunu bitirir (eskiden de hiçbir şey yapamıyordu; denge aynı kalsın diye).
- **Spiritual Weapon** saldırısı gücün hedefe bitişik altıgeninden yapıldığı için 5 ft içinde sayılır (eskisi gibi).
- Olay biçimi değişmedi: kayıt sürümü artmadı (16).

## 2026-10-28 — Koni ve çizgi alan şekilleri (Görev R4)

- **Kaynak SRD 5.2.1 "Area of Effect"** (s. 179 vd.): Cone — genişliği her noktada çıkıştan uzaklığına eşit, çıkış noktası alanda değil (yaratan istemedikçe); Line — uzunluk ve genişlik etkiden, çıkış dahil değil; Emanation — yaratıktan, yaratık dahil değil; Sphere — noktadan yarıçap; Cube — çıkış bir yüzde. 1 altıgen = 5 ft.
- **Koni geometrisi:** eskiden 30° yarım açı (15 ft koni 7 altıgen; ideal alan ≈ 5,2). Şimdi SRD genişliği: altıgen merkezinin yön eksenindeki izdüşümü p ∈ (0, L], eksene uzaklığı ≤ p/2 + 0,1 altıgen. 0,1 kenar payı her yönde ideale yakın sonuç veriyor (15 ft → 5, 30 ft → 17–22, 60 ft → 80–86; ideal 5,2 / 20,8 / 83). Eksenler arası yönde payısız 15 ft koni 3 altıgene düşüyordu. Burning Hands ve Fear da bu geometriyle küçüldü (7 → 5 altıgen).
- **Çizgi genişliği:** 5 ft tek şerit (altıgen çizgisi). 10 ft çizgi (Ancient dragon nefesleri) iki paralel şerit: ikinci şerit yöne en dik komşu yönde kaydırılmış; ızgarada 10 ft simetrik olamadığı için sağa kaydırılır (15 ft olsa sola da).
- **Ortak yol** (`src/battle/areaAttack.ts`): alan büyüleri, canavar alan saldırıları, Dragonborn Breath Weapon ve Draconic Spirit nefesi `pickArea` (menzil, görüş, siper; tam siper arkasındaki etkilenmez) ve `areaSaveEvents` ile. Hasar bir kez atılır (SRD: alanın hasarı bütün hedefler için aynı); her hedef ayrı save yapar, elle zarda her hedefin save'i ayrı istenir; başarıda yarım hasar; save başarısızsa canavar saldırısının süreli etkisi ve rider durumları; hasar alanın tepkisi (Hellish Rebuke) her hedeften sonra. Olay `area_used` (şekil, ölçü, nişan, altıgenler, etkilenenler) ardından hedef başına `save_resolved`.
- **Dost ateşi:** "each creature" alandaki herkes (canavarın kendi tarafı ve masumlar dahil), "each enemy" yalnızca düşmanlar. Büyülerin `area.targets` alanı aynı anlamda (Sleep ve Spirit Guardians yalnızca düşman).
- **Canavar verisi:** alan, saldırı metninden ayrıştırılır (`rules/areaParse.ts`): 86 saldırı (50 koni, 22 çizgi, 10 yayılım, 4 küre/silindir). Silindir yüksekliksiz küre sayıldı. Ayrıştırılamayan: Djinni Create Whirlwind (hareketli kasırga, Restrained) ve Gelatinous Cube Engulf (hareket) — alan değil, eskisi gibi. Young Red Dragon'un metni elle kısaltılmış olduğu için Fire Breath'e SRD'deki alan (`30 ft Cone`) veri olarak yazıldı; sayısal değer değişmedi. `monsters.json`'daki 64 eskimiş "alan şekli → tek hedef" bilgi notu kaldırıldı (istatistik değişmedi).
- **Dragonborn Breath Weapon** (SRD tür özelliği): Attack eyleminin bir saldırısının yerine, 15 ft koni ya da 30 ft × 5 ft çizgi, DEX save (DC 8 + CON + yetkinlik), 1d10 (5: 2d10, 11: 3d10, 17: 4d10), hasar türü Draconic Ancestry'nin direnci, yetkinlik bonusu kadar kullanım, uzun dinlenmede dolar (tür kaynağı `breathWeapon`). Draconic Flight yok. Tür özelliklerinin SRD kaydı için `npm run srd` artık `data/srd/species.json` da üretir (kimlik `species:dragonborn/breath-weapon`).
- **Cone of Cold** eklendi (5. seviye, 60 ft koni, CON, 8d8 cold); sim partilerinde 5. seviye slot yok, dengeye etkisi yok.
- **Draconic Spirit (Summon Dragon) nefesi** 30 ft koni (R3'te tek hedefti); Multiattack'ın içinde hedefin yönüne.
- **Yapay zekâ** (`bestAim`): yaratıktan çıkan koni/çizgide alanın boyu kadar uzaklıktaki her altıgen yön olarak denenir; dost vurmayan ve en çok görünen düşmanı kapsayan yön, eşitlikte daha küçük alan. Noktadan çıkan alanlar (Fireball, Acid Splash, canavarların noktada küresi) eskisi gibi yalnızca düşmanların altıgenine atılır.
- **Akıllı nokta hedeflemesi kapalı:** `bestAim`'in `anyPoint` seçeneği menzildeki her altıgeni dener (Fireball'u en çok düşmanı kapsayan boş altıgene atar). Açıkken standart parti 5. seviyede denge dışı güçlendi (Kale %80 → %97, Hazine odası %85 → %98, Taverna 8 masum %71 → %99). Kodda kaldı; ileride isteğe bağlı akıllı hedefleme olarak açılabilir. Denge ölçümleri bu yüzden eski davranışla yapıldı. Canavar: Recharge'lı nefes bir düşman için bile (eskisi gibi önce nefes), Recharge'sız alan saldırısı en az iki düşmanda; dost vuracaksa kullanmaz. Parti alan büyüsü ve Dragonborn nefesi en az iki düşmanda, dost vurmadan.
- **Arayüz:** "Nefes / alan" menüsü (canavarın alanlı saldırıları, Dragonborn nefesinin iki şekli), alan büyüleri aynı önizlemeyle: kaplanan altıgenler, alandaki düşman kırmızı, dost sarı kesikli halka, sayılar ve adlar, altı yön oku (44 px; yaratıktan çıkan alanda nişan harita dışında olabilir, yalnızca yön verir), onay. Balon alanın karşı kenarına yaslanır. Haritalı savaşta alanlı canavar saldırısı hedef seçeneklerinde yok (yanlışlıkla dost vurmasın).
- **SRD'den farklar:** silindir yüksekliği yok; "saldırılardan birinin yerine nefes" Multiattack seçenekleri (Chimera, metal ejderhalar) ayrı eylem olarak; koni ve çizginin çıkışı her zaman yaratığın altıgeninin merkezi (büyük yaratığın kenarından değil; çok altıgenlik yaratık yok).
- Kayıt sürümü 16 (3–16 yüklenir).
- **Denge:** 4 parti × 1/3/5 tam ölçüldü; ejderha senaryoları nefes konisiyle zorlaştı. 6 senaryo-seviye düşman listesiyle düzeltildi (3. seviye Volkan, Wyrmling, Orman ×2; 5. seviye Wyrmling, Young); ayrıntı `docs/harita/DENGE.md`.

## 2026-10-28 — Çağırma ve yoldaş (Görev R3)

- **Kaynak SRD 5.2.1.** SRD'de yaratık çağıran büyüler: Find Familiar (1, Wizard, ritüel), Find Steed (2, Paladin; Faithful Steed), Summon Dragon (5, Wizard). SRD'de başka "Summon …" büyüsü yok. 2024'te Conjure Animals / Elemental / Fey / Woodland Beings / Minor Elementals stat bloklu yaratık değil, yayılım/spektral etki; bu görevin dışında. Animate Dead (ceset ister) ve Animate Objects (5. seviye, nesne) yapılmadı. Wild Shape kapsam dışı (ayrı "biçim değiştirme" görevi; `druid:wild-shape` notu).
- **Model** (`src/battle/summons.ts`, `data/summons.json`): çağrılan yaratık sıradaki ayrı bir savaşçı (`summon`: sahip, büyü, seviye, seçim, bağlar). Sıradaki yeri veriden: `own` (familiar: "rolls its own Initiative") ya da `after-owner` (at ve ejderha ruhu: "shares your Initiative count"; ruh "takes its turn immediately after yours"). Sahibiyle aynı taraf ve aynı oyuncu (`ownerId`); düşman tarafının çağrısını Game Master yönetir (mevcut `canControl`).
- **Olaylar:** `summoned` yaratığı olduğu gibi taşır (replay bunu ekler) ve sıradaki yerini (`index`). `summon_vanished`: 0 HP (SRD: kaybolur, ölüm save'i yok), konsantrasyon (Summon Dragon), sahibin ölümü (Find Steed), süre (Summon Dragon 1 saat = 600 tur), yenisi (tek familiar, tek at, yeni ruh). Kaybolma `summonCleanup` ile her komuttan sonra olay olarak yazılır (yakalama temizliği gibi); kaybolan savaşçılarda kalır (`gone`; günlük adları), sırada atlanır, haritada ve sıra şeridinde görünmez.
- **Stat blokları** veride, büyü seviyesi formülüyle (base + perLevel × (seviye − fromLevel)); yukarı slotta slot seviyesi kullanılır (SRD "Use the spell slot's level for the spell's level in the stat block"; `upcast.applied`). Saldırı bonusu sahibinin büyü saldırısı, DC'si büyü DC'si, yetkinlik bonusu sahibininki. Otherworldly Steed: AC 10+L, HP 5+10L, 4+ seviyede uçuş, Slam 1d8+L (tür seçimiyle radiant/psychic/necrotic). Draconic Spirit: AC 14+L, HP 50+10(L−5), Rend ×⌊L/2⌋ (1d6+4+L, 10 ft) + nefes (DEX, 2d6 seçilen tür). Familiar: seçilen CR 0 hayvanın `monsters.json` bloğu, tür Celestial/Fey/Fiend, saldırısı yok.
- **SRD'den farklar (basitleştirme):** binek (mounted combat) yok, at sahibinin turunda değil hemen ardından oynar; Life Bond, Fell Glare, Fey Step, Healing Touch yok; Draconic Spirit'in Shared Resistances'ı, durum bağışıklıkları, Blindsight'ı ve yüzme hızı yok, nefes 30 ft koni yerine tek hedef (canavar nefesleriyle aynı kural); familiar'ın telepatisi, görüş paylaşımı, dokunma büyüsü taşıması ve cep boyutuna gönderme yok. Ritüel Find Familiar savaşta yapılmaz, yalnızca kurulumda (slotsuz). Çağrılmış yaratık tarafı ayakta tutmaz: bütün karakterler düşünce savaş biter (masumlar gibi).
- **Faithful Steed** kısmen: Find Steed her zaman hazır ve uzun dinlenmede yenilenen bir slotsuz kullanım (`faithfulSteed` kaynağı, `freeSpell`).
- **Yapay zekâ** çağırma büyüsü yapmaz (partiler aynı kalsın; çağrıyı oyuncu ya da Game Master yapar), çağrılanı basit oynar: canavar saldırıları, sahibine bitişik düşman önce, en yakın düşman; familiar dostla yakın dövüşteki düşmana Yardım, yoksa sahibinin yanında Kaçın. Arayüzde çağrılanın turunda "Yapay zekâ oynasın" düğmesi.
- **Arayüz:** büyü menüsünde çağırma kipi (menzildeki boş altıgenler vurgulanır; tür / nefes türü ve slot seçimi), kurulumda Find Familiar paneli (biçim, tür), kartta "Çağıran". Kayıt sürümü 15 (3–15 yüklenir).
- **Büyü eşitleme:** `srd-buyu-esitle.mjs` "1 hour or Ritual" süresini `ritual` yazar; eşitleme Magic Weapon'a `upcast.other` ekledi (yalnızca bilgi).

## 2026-10-24 — Süren etkiler ve zar eklentileri (Görev R2)

- **Kaynak SRD 5.2.1 (büyü metinleri `data/srd/spells.json`). Beklenen listenin doğrulaması:**
  - SRD'de var ve uygulandı: Bless, Bane, Guidance, Heroism, Resistance, Hunter's Mark, Hex, Searing Smite, Command, Aid.
  - Bane `spells.json`'da yoktu, eklendi (84 büyü).
  - 2024 farkları:
    - Guidance tek kullanımlık değil: konsantrasyon (1 dakika), seçilen beceriyle yapılan her kontrole +1d4.
    - Resistance save'e değil hasara: seçilen türde hasarı turda bir kez 1d4 azaltır (konsantrasyon).
    - Searing Smite konsantrasyon değil (1 dakika): her tur başında 1d6 fire, ardından CON save, başarıda biter.
  - Tek kullanımlık zar eklentisi altyapıda var (`dice.single`; ilk kullanımda biter). SRD'nin bu dört büyüsünde kullanan yok.
- **Etki modeli** (`Combatant.effects`; `src/battle/effects.ts`, `effectDice.ts`): her etki kaynak (büyücü), kimlik (SRD büyü kimliği), bitiş turu (`until`; 1 dakika = 10 tur) ve konsantrasyon bağı taşır.
  - Zar eklentisi `dice`: ±zar; saldırı, save ya da kontrol; beceri seçimi.
  - Diğer etkiler: hasar azaltma `reduce` (turda bir), her tur başı geçici HP `tempHp`, bağışıklık `immune`, süregelen hasar `ongoing` (tur başında zar, sonra save), tur kaybı `command`.
  - Bitiş reducer'da (`pruneEffects`), her olaydan sonra: süre geçti, kaynağın o büyüdeki konsantrasyonu bitti, taşıyan öldü ya da düşman 0 HP'ye indi. Aynı büyücü büyüyü yeniden yapınca eski hedeflerdeki etki biter.
- **Zar eklentisi akışı:**
  - `rules/attack.ts` `ExtraDie`: d20'den sonra atılır, toplama eklenir; doğal 20/1 değişmez. Olaylarda `bonusDice` (etiket ve işaretli değer) günlükte görünür.
  - Elle zar modunda eklenti zarı da istenir (d20'den sonra, aynı tür ve aynı atan).
  - Uygulandığı yerler: bütün saldırılar (silah, canavar, büyü, Spiritual Weapon) ve save'ler (büyü, canavar, süreli durum, ustalık, itme, yakalama, tepki, harita kuralı, konsantrasyon). Kontroller: beceri kontrolü, gizlenme, arama, yakalamadan kaçış, harita kontrolleri.
  - Ölüm save'lerine Bless eklenmiyor (kısmen).
- **Geçici HP:** `damageEffects` içinde hasardan önce harcanır (`temp_absorbed`). Yığılmaz, yüksek olan kalır. Konsantrasyon DC'si alınan hasarın tamamıyla.
- **Büyüler:**
  - Bless / Bane: 3 hedef (slot başına +1). Bane'de CHA save, başarısızsa −1d4.
  - Heroism: dokunuş, slot başına +1 hedef. Her tur başı büyü modifier'ı kadar geçici HP, Frightened bağışıklığı (durum eklenmez).
  - Aid: 3 dost, en çok HP ve HP +5 (slot başına +5); 8 saat sürdüğü için etki listesine girmez, savaş sonunda en çok HP'de kalır.
  - Command (kısmen): WIS save; Grovel (yere düşer, turunu kaybeder) ve Halt (turunu kaybeder). Approach, Drop, Flee yok: yönlü zorunlu hareket ve eşya bırakma modellenmedi.
  - Hex: Hunter's Mark gibi işaret (`kind: mark`), +1d6 necrotic, taşınabilir. Seçilen yeteneğin kontrollerinde dezavantaj yok (kısmen; savaşta kontrol az).
  - Searing Smite: isabette 1d6 (yukarı slotla artar), sonra süregelen hasar ve CON save; yukarı slot süregelen zarı da artırır (SRD "All the damage").
- **Yapay zekâ (basit):**
  - Bless'i (veriden: dostlara saldırı zarı eklentisi veren etki büyüsü) eylemi duruyorsa, konsantre değilse ve sürdürülen konsantrasyon büyüsü (Spirit Guardians, Spiritual Weapon) yoksa menzildeki dostlara yapar.
  - Hex ve Hunter's Mark işaret kuralıyla (saldırabilecekken). Searing Smite smite kuralıyla.
  - Konsantrasyondayken yeni konsantrasyon büyüsü yapmaz (konsantrasyonu bozmaz).
- **Arayüz:**
  - Jetonda etki simgeleri (✨ Bless, ⛓ Bane, 🦁 Heroism, 🔥 Searing Smite, 🎯 işaret, 💠 geçici HP).
  - Kartta "Etkiler" listesi: kaynak, kalan tur ya da konsantrasyon; tıklayınca açıklama.
  - Etki büyüsünde çoklu hedef kipi: hedefler jetonlara tıklayarak seçilir (sarı halka). Seçim (beceri, hasar türü, komut) ve slot baloncukta.
- **Denge:**
  - Dört parti 1/3/5. seviyede tam ölçüldü. Yalnızca Paladin partisi değişti (Aria'nın Bless'i).
  - Volkan 3. seviyeye Steam Mephit eklendi (3 deneme). Paladin %90 → 81; standart %74 → 55, sınırda.
  - Ayrıntı `docs/harita/DENGE.md`.
- **Kayıt sürümü 14** (3–14 yüklenir).

## 2026-10-24 — Tepki sistemi (Görev R1)

- **Kaynak SRD 5.2.1.** Tepki: turda bir; kendi turunun başında yenilenir. Aksiyon yapamayan (Incapacitated) tepki veremez.
  - SRD'deki tepki büyüleri (hepsi 1–3. seviye): Shield, Counterspell, Hellish Rebuke, Feather Fall. Feather Fall `spells.json`'a eklendi (83 büyü).
  - SRD'deki tepkili sınıf özellikleri: Deflect Attacks, Slow Fall (Monk), Uncanny Dodge (Rogue 5), Retaliation (Berserker 10), Superior Hunter's Defense (Hunter 15), Countercharm (Bard 7), Cutting Words (Lore 3).
  - SRD 5.2.1'de olmayan Absorb Elements, Protection/Interception (Fighting Style) ve Sentinel eklenmedi.
- **Ekonomi tek yerde** (`src/battle/reactions.ts`): `canReact` ve `reactionUsed` (`reaction_used` olayı). Fırsat saldırısı, Deflect Attacks ve Slow Fall da bunu kullanır. Eski kayıtların `action_used` (fırsat saldırısı) ve `deflected` alanı reducer'da okunmaya devam eder.
- **Karar akışı:** zar isteme kalıbıyla aynı.
  - Motor tetikte `askReaction(rng, istek)` çağırır. İstekte tepkiyi verecek yaratık, tetik, seçenekler (hedef ya da slot seviyesi seçimi) ve kural tabanlı öneri (yapay zekâ) var.
  - Rng'deki karar kancası (`rules/reactionChoice.ts`, `dice.ts` `rollTag` iletir) kararı verir. Arayüzün kaydedici Rng'si kararı zar defterine yazar; oyuncuya sorulacaksa `NeedReaction` fırlatır, karar girilince adım aynı zarlarla baştan çalışır (`runStep`, `enterReaction`).
  - Kancasız Rng'de (simülasyon, testler) öneri uygulanır. Kararın sonucu olaylara yazılır; replay aynı durumu verir.
  - Hasar zarları karar sorulmadan önce atılır: oyuncu Shield/Uncanny Dodge/Deflect'i hasarı görerek seçer (SRD'de tepki "isabet edince"; masa düzeninde yaygın kullanım).
- **Ayar ("hızlı mod"):** oyuncu tepkileri Sor (varsayılan) / Her zaman / Asla; Game Master'ın düşmanları Yapay zekâ (varsayılan) / Her zaman / Asla. Savaş menüsünde, cihazda hatırlanır. "Her zaman" öneriyi, öneri yoksa ilk seçeneği kullanır.
- **Yapay zekâ önerisi (kural tabanlı):**
  - Fırsat saldırısı: her zaman (eski davranış).
  - Shield/Parry: yalnızca isabeti ıskaya çevirecekse; önce bedava olan (Parry).
  - Deflect Attacks, Deflect Missile: her isabette. Geri yöneltme: Focus varsa, saldırana (yoksa ilk uygun hedefe).
  - Uncanny Dodge, Superior Hunter's Defense: hasar en az 5 ve kalan HP'nin üçte biri ya da öldürecekse.
  - Counterspell: slotlu büyülere (cantrip'e değil). Hellish Rebuke, Retaliation: her zaman, en düşük slot.
  - Slow Fall her düşmede; Feather Fall 20 ft ve üstü düşmede.
- **Tepkiler ve sınırlar:**
  - Shield: +5 AC (tetikleyen saldırı dahil) sonraki turunun başına dek (`marks` `shield`); Magic Missile'ın hasarını keser (`blocks`). Kritik vuruş AC'yle ıskalatılamaz, bu yüzden sorulmaz.
  - Counterspell: büyücü CON save (karşı büyücünün DC'si); başarısızsa büyü boşa gider, eylemi harcanır, slotu harcanmaz. Geçersiz komut boşa durdurulmasın diye büyü önce zarsız denenir. Canavarlar büyü yapmadığı için oyuncunun Counterspell'i yalnızca büyü yapan karakter düşmana karşı (sıkı kurulum) tetiklenir; asıl kullanım Mage/Archmage/Lich'in Protective Magic'i.
  - Hellish Rebuke: saldırı ve büyü hasarında (60 ft, görülen). Spirit Guardians, ustalık (Graze) ve harita hasarında tetiklenmez (kısmen).
  - Deflect Attacks: hasarın tamamını (ek hasarlar dahil, SRD "total damage") azaltır; 0'a inerse 1 Focus ile geri yöneltme (DEX save, Monk DC'si, iki Martial Arts zarı + DEX).
  - Slow Fall ve Feather Fall: zorunlu hareketle düşmede (itilme, uçurum). Feather Fall'ı düşen ya da 60 ft içindeki dostu yapar; yalnızca düşeni korur (SRD: 5 yaratık).
  - Superior Hunter's Defense (kısmen): yalnızca saldırı isabetinde, o saldırının hasarı yarıya iner; tur sonuna dek süren direnç yok.
  - Countercharm ve Cutting Words `none`: tetikleri (save sonrası, kontrol/zar sonrası) motorda tek noktadan geçmiyor; Bardic Inspiration yok.
- **Canavar tepkileri** (`data/monster-reactions.json`; 24 tepki): 15'i çalışıyor, 9'u `none` ve nedenli.
  - Parry ×7 (+2…+5, yalnızca yakın dövüş; "silah tutarken" koşulu her zaman sağlanmış sayılır), Riposte (ıskada Rapier saldırısı).
  - Protective Magic: Mage/Archmage (3/Day havuz, `reactionUses`), Lich (sınırsız); Shield ya da Counterspell, DC canavar bloğundan.
  - Unnerving Gaze: tur başında; başarılı save'de bu savaş boyunca bağışık (SRD 24 saat).
  - Kısmen: Whirlwind of Sand (yalnızca AC +2; ışınlanma yok), Deflect Missile (Recharge 5–6, `reactionSpent`; geri yöneltme yok), Redirect Attack (yalnızca silah saldırılarında yer değiştirme, `swapped` olayı).
  - `none`: Split ×2 (yaratık doğurma yok), Ink Cloud ×2 (karartılmış alan yok), Pursuit (Teleport yok), Shriek (mekanik etkisi yok), Reflexive Antennae (Antennae yok), Burst of Ingenuity (kontrol/save sonrası tetik yok), Protection (muska sahibi yok).
- **Retaliation, Riposte** gibi saldırı yapan tepkiler saldırıyı `registerStrikes` ile alır (silah ve canavar saldırı modülleri `reactions.ts`'i içe aktarır; ters yön döngü yaratırdı).
- **Kimlik:** tepki kimlikleri SRD kimliği (`spells:shield`, `rogue:uncanny-dodge`, `monk:deflect-attacks`); canavar tepkisi `<canavar>:<tepki>`. Fırsat saldırısı `opportunity-attack`.
- **Kayıt sürümü 13** (3–13 yüklenir): `reaction_used`, `reaction_recharged`, `swapped`, `attack_resolved.reacted`.
- **Denge:** dört parti 1/3/5. seviyede tam ölçüldü. Uncanny Dodge (Sela, 5. seviye) ve Parry 5. seviyede kaymaya yol açtı. 7 senaryo-seviyede düşman listesi değişti (3 deneme; Volkan şans denendi, geri alındı). Ayrıntı `docs/harita/DENGE.md`.
- **Arayüz:** tepki istemi (Evet/Hayır; slot ya da hedef seçimi ayrı düğme; öneri vurgulu), sırası olmayan oyuncu için de. Karakter kartında "Tepki: hazır/kullanıldı" ve tepki listesi. Tepki büyüleri büyü menüsünde yok (tetikte sorulur). Yapay zekâ tepki büyülerini kendi turunda atmaz.

## 2026-10-24 — Monk 1–5 (Görev P-Monk)

- **Kaynak SRD 5.2.1** (Monk, Warrior of the Open Hand).
  - 1–5. seviye özellikleri: Martial Arts, Unarmored Defense (1); Monk's Focus (Flurry of Blows, Patient Defense, Step of the Wind), Unarmored Movement, Uncanny Metabolism (2); Deflect Attacks, alt sınıf (3); ASI, Slow Fall (4); Extra Attack, Stunning Strike (5).
  - Open Hand Technique 3. seviyede.
  - Hafızadaki listeyle aynı. Farklar ayrıntıda:
    - Deflect Attacks 3. seviyede ve yalnızca B/P/S hasarında.
    - Patient Defense ve Step of the Wind'in Focus'suz hâli var (bonus eylemle Disengage / Dash).
    - Stunning Strike'ın başarılı save'inde de etki var (hız yarılanır, sonraki saldırı avantajlı).
    - Monk'ta Weapon Mastery yok.
- **Veriden** (`data/class-features.json`), kodda sınıf adı yok. Yeni mekanik alanlar:
  - `martialArts` (Monk silahları, bonus vuruş; zar SRD sütunu).
  - `focusActions` (Focus eylemleri), `metabolism`, `deflect`, `fallReduction`, `stunningStrike`, `openHand`.
  - Focus Points mevcut kaynak modelinde (`focus`, kısa dinlenmede dolar).
- **Martial Arts:**
  - Zırhsız ve kalkansızken geçerli. Unarmed Strike seçeneği: zar Martial Arts zarı, yetenek DEX ya da STR.
  - Monk silahlarında (basit yakın dövüş, Light martial yakın dövüş) zar büyükse Martial Arts zarı, DEX ya da STR.
  - Bonus vuruş `bonus_strike` komutuyla: yan el saldırısıyla aynı düzenek (`weaponAttackEvents`); Attack eylemi gerektirmez (SRD 2024).
  - Basitleştirme: öbür karakterlerin 1 + STR silahsız vuruşu oyunda yok; Unarmed Strike yalnızca Martial Arts'la seçenek.
- **Monk's Focus:**
  - Flurry of Blows: 1 Focus, bonus eylem, sonra iki bedava vuruş (`economy.flurryLeft`; vuruşlar ayrı hedefe gidebilir).
  - Patient Defense: Disengage + Dodge. Step of the Wind: Disengage + Dash.
  - Focus'suz bonus Dash/Disengage Cunning Action gibi (`grants`).
  - Step of the Wind'in atlama ikilemesi yok.
- **Uncanny Metabolism:** savaş başında (`start_battle`, inisiyatif) Focus eksikse ya da yaralıysa kullanılır. Focus dolar, Martial Arts zarı + seviye HP; uzun dinlenmede bir kez.
- **Deflect Attacks (kısmen):**
  - Canavar saldırısının B/P/S hasarlı isabetinde, tepki duruyorsa kendiliğinden kullanılır: hasar 1d10 + DEX + seviye azalır.
  - Hasar 0'a inince Focus ile geri yöneltme yok: hedef seçen bir tepki akışı gerekir, bu görevin kapsamı dışında.
- **Slow Fall (kısmen):** düşme hasarı 5 × seviye azalır; tepki harcanmaz (düşme kendiliğinden çözülür).
- **Stunning Strike:**
  - Bu tur Monk silahı ya da Unarmed Strike ile vurulan hedefe, turda bir kez, 1 Focus. CON save, DC 8 + WIS + yetkinlik.
  - Başarısızsa Monk'un sonraki turunun başına dek Stunned.
  - Başarılıysa ona sonraki saldırı avantajlı (Yardım işareti). Hız yarılanması yok (kısmen).
- **Open Hand Technique:** Flurry vuruşu isabet edince Addle (fırsat saldırısı yok, hedefin sonraki turunun başına dek), Push (STR save, 15 ft) ya da Topple (DEX save, Prone). Arayüz ve yapay zekâ Topple seçer; komut üçünü de alır.
- **Ortak kod (guard'lı):** fırsat saldırısı (Addled), canavar saldırısı (Deflect), düşme hasarı (Slow Fall), savaş başı (Uncanny Metabolism), silah seçeneği (Martial Arts). Eski partiler tam ölçüldü (`docs/harita/DENGE.md`).
- **Yapay zekâ (basit):**
  - Monk silahı isabetinden sonra Stunning Strike (hedef 15 HP'den fazlaysa ya da kritikse).
  - Attack eylemi bitince Focus varsa Flurry of Blows (Topple), yoksa bonus Unarmed Strike.
  - Patient Defense ve Step of the Wind'i yapay zekâ kullanmaz.
- **Kayıt sürümü 12** (3–12 yüklenir).
- **Denge:** Monk partisi (`--parti monk`, Bor yerine Lin) 1/3/5. seviyede ölçüldü; 13 senaryo-seviyede düşman listesi değişti (3 deneme, standart parti aralıkta kaldı). Aralık dışı kalanlar: Volkan 5 (%89), Volkan Adult/Ancient 1 (%58), Volkan Young 3 (%57), Taverna ortada 5 (%86). Eski partilerin tam regresyonu birebir aynı. Ayrıntı `docs/harita/DENGE.md`.

## 2026-10-24 — Paladin 1–5 ve alt sınıf düzeltmesi (Görev P-Paladin)

- **Kaynak SRD 5.2.1** (Paladin, s. 52–57; Oath of Devotion s. 56).
  - 1–5. seviye özellikleri: Lay On Hands, Spellcasting, Weapon Mastery (1); Fighting Style, Paladin's Smite (2); Channel Divinity, alt sınıf (3); ASI (4); Extra Attack, Faithful Steed (5).
  - Oath of Devotion (3): Oath of Devotion Spells, Sacred Weapon.
  - Hafızadaki listeyle aynı. Farklar ayrıntıda:
    - Divine Smite 2024'te bir büyü: yakın dövüş isabetinden sonra bonus eylemle yapılır. Paladin's Smite onu her zaman hazır tutar ve uzun dinlenmede bir kez slotsuz yaptırır.
    - Channel Divinity 3. seviyede gelir (2 kullanım). Sınıfın kendi etkisi Divine Sense; Sacred Weapon alt sınıftan gelir.
    - Faithful Steed, Find Steed büyüsünü her zaman hazır tutar ve uzun dinlenmede bir kez slotsuz yaptırır.
- **Veriden** (`data/class-features.json`), kodda sınıf adı yok. Yeni mekanik alanlar:
  - `effect`: savaşta `use_feature` komutuyla kullanılan özellik (iyileştirme havuzu ya da güçlendirme).
  - `alwaysPrepared`: seviye → her zaman hazır büyüler.
  - `alternatives`: Fighting Style yuvasında feat yerine seçenek (Blessed Warrior: 2 Cleric cantrip'i, CHA ile).
  - `when: attackAction`: Attack eylemiyle kullanılan özellik.
  - Kaynaklar: Lay On Hands (`layOnHands`, 5 × seviye), Channel Divinity (mevcut kaynak, SRD sütunu), yeni `paladinsSmite` (1, uzun dinlenme, `freeSpell: Divine Smite`).
- **Uygulama:**
  - **Lay On Hands:** bonus eylem, dokunuş (kendisi ya da bitişik). Havuzdan istenen kadar HP. 5 puanla Poisoned kalkar.
  - **Divine Smite:** bu tur yakın dövüş silahıyla vurulan hedefe 2d8 Radiant. Her yukarı slot +1d8; Fiend ve Undead +1d8. Vuruş kritikse zarlar iki kat.
  - **Sacred Weapon:** eylemsiz, Attack eylemiyle; Channel Divinity harcar. Yakın dövüş silah saldırılarına CHA (en az +1). Hedef silahın türüne dirençli ya da bağışıksa hasar Radiant olur.
  - **Yemin büyüleri:** 3. seviyede Protection from Evil and Good ve Shield of Faith, 5. seviyede Aid ve Zone of Truth. Her zaman hazır, hazır büyü sayısına girmez.
- **Kısmen çalışanlar:**
  - Channel Divinity: Divine Sense savaşta etkisiz (algılama yok).
  - Sacred Weapon: ışık yayma yok.
- **Çalışmayanlar:** Faithful Steed (çağrılan yaratık yok, "çalışmıyor" işaretli).
- **Paladin büyüleri (1–2):**
  - Çalışanlar:
    - Divine Smite, Divine Favor (+1d4 radiant), Shield of Faith (konsantrasyon hedefine +2 AC).
    - Shining Smite (hasar; konsantrasyon boyunca hedefe saldırılar avantajlı).
    - Protection from Evil and Good (Aberration, Celestial, Elemental, Fey, Fiend ve Undead saldırıları dezavantajlı).
    - Magic Weapon (+1).
    - Searing Smite: yalnızca isabet hasarı; sonraki turlardaki yanma yok.
    - Cure Wounds zaten vardı.
  - "Oyunda henüz çalışmıyor" işaretliler: Bless, Command, Heroism, Aid, Lesser Restoration, Zone of Truth, Find Steed.
  - Veride olmayanlar: Detect* büyüleri, Purify Food and Drink, Gentle Repose, Locate Object, Prayer of Healing, Protection from Poison, Warding Bond. Savaş dışı oldukları için eklenmedi.
- **Ortak motor değişikliği:**
  - Hedefin AC'si ve saldırı kaynakları konsantrasyon korumalarına bakıyor (`effectiveAc`, `wardSources`): silah, canavar ve büyü saldırılarında.
  - Silah saldırısı süren güçlendirmeleri uyguluyor (`buffs`).
  - Yakın dövüş isabeti `economy.meleeHit`'e yazılıyor.
  - Eski partilerin tam ölçümü B2 ile birebir aynı çıktı.
- **Yaratık türü:** `data/canavar-turleri.json`. SRD stat block satırından 263 canavar; 67'sinin satırı PDF metninden okunamadı, onlar `monster-ortamlari.json` temasından (`temadan` listesi).
- **Alt sınıf (tüm sınıflar):**
  - Motor alt sınıf boşken varsayılan vermiyor; alt sınıf özelliği uygulanmaz.
  - Oluşturucu 3. seviye ve üstünde alt sınıf seçmeden kaydetmez.
  - Eski kayıtlı karakterlerde boş alt sınıfa SRD'deki tek alt sınıf atanır ve ekranda bildirilir.
  - Kayıtlı savaşlar etkilenmez: savaşçı kurulmuş olarak olaylarda durur.
- **Yapay zekâ (basit):**
  - Yanındaki düşmüş dostu Lay On Hands ile yarı HP'sine dek kaldırır; kendi HP'si üçte birin altındaysa kendini iyileştirir.
  - Yakın dövüş isabetinden sonra slotsuz Divine Smite'ı hep, slotlu olanı kritikte ya da hedef 10 HP'den fazlaysa yapar.
  - Saldırmadan önce, yakında düşman varsa Sacred Weapon.
  - Divine Favor, Shield of Faith ve Magic Weapon'ı yapay zekâ kullanmaz.
- **Kayıt sürümü 11** (`use_feature`, `buff_added`, `attack_resolved.melee`; 3–11 yüklenir).

## 2026-10-24 — Simülasyon partileri tamamlandı (Görev B2)

- **Partiler SRD'ye göre eksiksiz** (`data/sim-partiler.json`, kod değişmedi):
  - Alt sınıf: Champion, Evoker, Life Domain, Thief, Hunter, Berserker.
  - Köken feat'i: Savage Attacker, Magic Initiate, Alert. SRD geçmişine göre seçildi; uygulananı tercih edildi.
  - 4. seviye ASI (ana skor +2).
  - SRD tablosu kadar cantrip ve hazır büyü; Scholar uzmanlığı.
  - Test her seviyede denetliyor.
- **Frenzy düzeltmesi:**
  - B1'deki "Frenzy çalışmıyor" yanlıştı: `gainedFeatures` alt sınıf seçilmemişse SRD'nin tek alt sınıfını kullanır.
  - Sayaç testi eklendi.
  - Not: oluşturucuda alt sınıf boş bırakılan her karakter de aynı biçimde varsayılan alt sınıfın özelliklerini alır.
- **Veride çözülemeyenler:** Divine Order seçimi (Protector varsayılıyor), Deft Explorer uzmanlığı, insanın ikinci köken feat'i. Savage Attacker, Magic Initiate ve Frenzy dışındaki alt sınıf özelliklerinin etkisi yok.
- **Denge:**
  - Parti güçlenince 13 senaryo/seviye aralık dışına çıktı; düşman listeleri değiştirildi (en çok 3 deneme). Standart partide 57 ölçümün hepsi aralıkta.
  - Haritadaki düşman yeri sınırı (Taverna 9, Merdiven ve Hazine 12) yüzünden sayı yerine canavar değişti.
  - Barbarian partisi şişirilmedi; zayıf ve güçlü yerleri `docs/harita/DENGE.md`'de.

## 2026-10-23 — Seviyeli senaryolar ve gerçek 1/3/5. seviye partiler (Görev B1)

- **Partiler veride** (`data/sim-partiler.json`):
  - `members`: üye başına 5. seviye sheet ve `levels.<N>` (o seviyede sheet'in üstüne yazılan alanlar).
  - `parties`: üye listeleri (standart, barbar, yanel).
  - Tanımsız seviyede (8, 11…) 5. seviye sheet'inden üretilir: seçilemeyen büyüler, gelmemiş yuvalar ve hakkı aşan ustalıklar kesilir.
  - Yeni sınıf partisi: üye ve parti eklenir, kod değişmez.
- **1. ve 3. seviye seçimleri:**
  - Büyüler SRD tablosundaki cantrip ve hazır büyü sayısı kadar; oyunda çalışan, savaşta işe yarayan büyülerden.
  - Skorlar aynı (ilk ASI 4. seviyede).
  - Donanım SRD başlangıç altınıyla alınabilir (ayrıntı veri dosyasının notlarında).
- **5. seviye partisi bilerek değiştirilmedi** (sonuçlar birebir aynı kalsın diye). Kalan eksikler:
  - Mira 2 cantrip (tablo 4), hazır büyüleri tablodan az.
  - 4. seviye ASI yuvaları boş.
  - Alt sınıf yok. (Görev B2 düzeltmesi: Frenzy yine de çalışıyordu, motor varsayılan alt sınıfı kullanıyor.)
  - Öneri: ayrı görevde 5. seviye partisi tamamlanıp yeniden ölçülsün.
- **Senaryolar veride** (`data/sim-senaryolar.json`):
  - Her senaryoda `enemies.<seviye>`: 1, 3, 5. 8, 11 gibi seviyeler anahtar olarak eklenir.
  - 1. ve 3. seviye listeleri haritanın ortam listesinden; test denetler.
  - Her listenin başlangıç bölgesine sığdığı test ediliyor.
  - Uyuyan ejderha senaryolarında ejderha her seviyede aynı; seviyeye göre yalnızca eşlik edenler değişir.
- **Paralel simülasyon:**
  - `npm run sim` senaryoları ayrı süreçlerde çalıştırır (`scripts/sim-paralel.mjs`, `--is N`); tablo `sim-sonuc/` altına da yazılır (git dışı).
  - `npm run sim:tek` eski tek süreçli çalıştırma.
  - Hatalı senaryo tabloyu düşürmez, satırına HATA yazılır.
- **Denge:**
  - Standart partide 57 senaryo/seviye ölçümünden 56'sı aralıkta.
  - Aralık dışı: 3. seviye Adult/Ancient %59 (3 deneme bitti).
  - Barbarian partisi şişirilmedi; zayıf yerleri `docs/harita/DENGE.md`'de.

## 2026-10-23 — Yan el, Nick, Two-Weapon Fighting, Versatile (Görev P1)

- **Kaynak SRD 5.2.1** (Weapons: Light, Versatile, Two-Handed, Nick; Feats: Two-Weapon Fighting). Silah verisindeki `light`, `twoHanded`, `versatileDamage` SRD silah tablosuyla karşılaştırıldı, fark yok.
- **Eller** (`src/rules/hands.ts`): karakterde `offHand` (yan el silahı). Geçerli olması için:
  - Silah taşınıyor ve Light.
  - Kalkan yok.
  - Two-Handed yakın dövüş silahı taşınmıyor.
  - Ana elde kullanılacak, yan eldekinden farklı bir Light silah var.
  - Oluşturucu geçersiz seçenekleri kapalı gösterir, nedenini yazar; kalkan ya da iki elli silah eklenince yan el seçimi düşer.
- **Basitleştirmeler:**
  - Elde silah değiştirme (Interact, Equipping and Unequipping Weapons) yok. Two-Handed menzilli silah (yay, arbalet) yan eli engellemez: SRD'de saldırıyla birlikte çekilip kaldırılabilir; okçu yakına gelince çift silaha geçer.
  - Two-Handed yakın dövüş silahı (Greatsword, Greataxe…) taşınıyorsa yan el seçilemez: karakterin "ana silahı" belirsizleşir.
  - Aynı silahtan iki tane taşınamaz (silah listesi ad bazlı); yan el ana el Light silahından farklı olmalı.
- **Light ek saldırısı:**
  - Attack eyleminde, yan el silahı dışındaki bir Light silahla saldırı (`action_used.light`) `economy.lightAttack` açar.
  - `offhand_attack` komutu bonus eylem harcar, turda bir kez (`offhandUsed`).
  - Hasara yetenek değiştiricisi eklenmez, negatifse eklenir. Saldırı zarı, Sneak Attack ve silahın ustalığı normal saldırı gibi.
- **Nick:**
  - Yan el silahının ustalığı Nick ise ve karakter o silahın ustalığını seçtiyse (`nickOffhand`), ek saldırı Attack eyleminin içinde yapılır: bonus eylem boş kalır, turda yine bir kez.
  - SRD "Attack eyleminin parçası" diyor; motor ek saldırıyı Light saldırısından sonra turun herhangi bir anında kabul eder.
- **Two-Weapon Fighting:** feat verisinde `offhandModifier`; yan el hasarına yetenek değiştiricisi eklenir.
- **Versatile:**
  - Diğer el boşsa (kalkan yok, geçerli yan el silahı yok) yakın dövüşte iki elle, parantezdeki zarla vurur.
  - Fırlatma tek elle (normal zar). Great Weapon Fighting iki elle tutulan Versatile'da da geçerli.
  - Oluşturucu özetinde ve savaş seçeneklerinde "(iki elle)" yazar.
  - Bor (kalkanlı) ve Tavi değişmedi. Mira'nın Quarterstaff'ı 1d6 yerine 1d8 oldu.
- **Yapay zekâ:**
  - Yan el silahı olan birim, ek saldırının ortalama hasarını Light seçeneklerin puanına ekler, böylece Light silahı seçmeye eğilimli olur.
  - Nick'te ilk Light saldırının hemen ardından yan el saldırısını yapar. Nick yoksa eylem bittiğinde ve bonus eylem boşsa yapar.
  - Hedef sırası normal saldırıyla aynıdır (`byPriority`).
- **Kayıt sürümü 10** (`action_used.light`/`offhand`, ekonomide yeni alanlar). 3–10 yüklenir.
- **Simülasyon:** `--parti yanel` eklendi: Sela, Rapier yerine Shortsword (Vex) ile yan elde Dagger (Nick) kullanır. Standart parti değişmedi. Sonuçlar `docs/harita/DENGE.md`'de.

## 2026-10-23 — Barbarian 1–5 (Görev P-Barbarian)

- **Kaynak SRD 5.2.1.** Barbarian 1–5: Rage, Unarmored Defense, Weapon Mastery (1); Danger Sense, Reckless Attack (2); Primal Knowledge, alt sınıf (3); ASI (4); Extra Attack, Fast Movement (5). Path of the Berserker 3. seviyede Frenzy verir; alt sınıfın 5. seviye özelliği yok (Mindless Rage 6).
- **Veriden:**
  - `data/class-features.json`'da yeni girdiler: `rage` (direnç, hasar sütunu "Rage Damage", STR avantajı), `stat: saveAdvantage` (Danger Sense), `command: reckless`, `stat: classSkills` + `skills` (Primal Knowledge), `stat: frenzy`.
  - Kodda sınıf adı yok. Rage kaynağı SRD'ye göre yenilenir: kısa dinlenmede 1, uzun dinlenmede hepsi (görevdeki "uzun dinlenmede" ifadesi SRD'yle birlikte geçerli).
- **Rage:**
  - Bonus eylemle başlar; ağır zırhla başlatılamaz. B/P/S direnci eklenir; Rage bitince yalnızca Rage'in eklediği direnç kalkar.
  - STR saldırısının hasarına Rage hasarı eklenir (isabette).
  - STR save'leri ve Athletics avantajlı. Büyü yapılamaz, konsantrasyon biter.
  - Süre: sonraki turunun sonuna dek. O tur düşmana saldırı zarı atmak, düşmana save yaptırmak (Shove, Topple) ya da bonus eylem ("Öfkeyi sürdür") Rage'i uzatır; uzatılmazsa tur sonunda biter. Incapacitated olunca ya da 0 HP'de biter.
- **Reckless Attack:** turun ilk saldırısından önce seçilen eylemsiz komut ("Pervasız"). Sonraki turunun başına dek kendi STR saldırıları avantajlı, ona yapılan saldırılar avantajlı (işaret `reckless`, Weapon Mastery işaretleriyle aynı düzenek).
- **Danger Sense:** DEX save'leri avantajlı (Incapacitated değilken). `saveMode` artık durum listesi yerine savaşçıyı alıyor.
- **Primal Knowledge (kısmen):**
  - 3. seviyede bir sınıf becerisi daha seçilir.
  - Rage sürerken Acrobatics, Intimidation, Perception, Stealth ve Survival kontrolleri, STR daha iyiyse STR ile yapılır ve Strength avantajını alır (Gizlen, Ara, harita kontrolleri).
  - Intimidation ve Survival savaşta kullanılmıyor.
- **Frenzy:** Rage + kendi Reckless işareti, kendi turunda STR saldırısıyla ilk isabete Rage hasarı kadar d6 (turda bir kez).
- **Yapay zekâ (basit kural):**
  - Rage: yaralıysa ya da 10 ft içinde düşman varsa; eylemi bitmiş ve Rage o tur uzamamışsa bonus eylemle uzatır.
  - Reckless: HP yarıdan fazlaysa ve en iyi seçenek STR ile silah saldırısıysa.
- **Kayıt sürümü 9** (Rage olayları; 3–9 yüklenir).
- **Simülasyon:** `--parti barbar`, Bor yerine Grum (AC 14).
  - Dört senaryoya 1. ve 3. seviye için `byLevel` listesi eklendi.
  - Düşman listesi düzeltmeleri: Volkan, Merdiven, Düz, Adult/Ancient. Ayrıntı ve kabul edilen sapmalar `docs/harita/DENGE.md`'de.

## 2026-10-22 — Seviye artışı skor satırlarında, tek havuz (Görev M4)

- **Havuz:** Oluşturucudaki ayrı ASI seçim bölmesi ("bir skora +2 / iki skora +1" ve yetenek seçimi) kalktı.
  - Yetenek artışı seçili ya da boş her ASI yuvası havuza 2 puan ekler: seviye arttıkça puan kendiliğinden eklenir (Fighter 8: 4, 6, 8 → 6 puan).
  - Kalan puan skorların üstünde tek sayaçta ("Kalan: N"). Kullanıcının isteğiyle yuva sekmeleri yok.
- **Sayaç:** Her skor satırında "Geçmiş" sayacının altında "Seviye" sayacı var.
  - + puanı en erken uygun yuvaya koyar; − en son yuvadaki artışı geri alır, yalnızca seviyeden gelen artış kadar.
- **Kurallar korunuyor:** yuva başına toplam 2, hiçbir skor 20'yi geçmez.
  - Puan bitince ya da skor 20'deyken + pasif.
  - Yarım harcanmış yuva (kalan 1) kaydı engeller (mevcut `increaseProblem`).
- **Yetenek artışı / Feat geçişi:** yuva başına "Seviye ilerlemesi" bölümünde.
  - Feat seçilen yuva havuzdan düşer.
  - Feat'in kendi +1'i (Grappler vb.) o yuvada seçilir ve skorda "+1" rozetiyle görünür.
- **Fark gösterimi:** oluşturma skoru → seviye sonrası skor ve "+n" rozeti (ör. "17 → 20 +3").
- **Kayıt şeması değişmedi:** `advancements[].abilities`; hesap mevcut ASI kodunda (`applyIncreases`, yeni `poolRaise` / `poolLower` / `poolLeft`). Sürüm aynı.

## 2026-10-22 — Orman varyant adları: Gündüz / Gece

- Görünen adlar "Gündüz" / "Gece", İngilizcede "Day" / "Night"; "Orman açıklığı" adı kalktı.
  - Varyant verisine isteğe bağlı `nameEn` eklendi; `variantLabel` dile göre seçer.
  - Varyant kimlikleri (`orman`, `gece`) değişmedi. Kayıtlar, ses eşlemesi ve kontroller kimlik kullandığı için uyarlama gerekmedi; kayıtta ad saklanmıyor.
- Diğer haritalarda gündüz/gece adlandırması tutarsız; yalnızca raporlandı, düzeltilmedi:
  - Şehir meydanı: "Gün" / "Gece". Sonradan karar: "Gündüz" yapıldı (kimlik `gun` aynı).
  - Çöl: "Gündüz" / "Akşam fırtınası". Karar: olduğu gibi kalır.
  - Öteki varyantların İngilizce adı yok.

## 2026-10-22 — Orman efektleri güçlendi (Görev M2)

- **Yoğunluk ölçeği:** düşük / orta / yüksek = 1× / 2× / 3,5×. Varsayılan "orta".
  - Yeni ölçek yalnızca varyant verisinde `"scale": "strong"` olan efektlere uygulanır; şimdilik bunlar Orman'ın gündüz ve gece katmanları.
  - Çöl, Volkan ve diğer haritalar eski 0,5× / 1× / 1,5× ölçekte kaldı. Daha az riskli seçenek buydu: o haritaların görünüşü ve okunabilirliği (kum fırtınası, lav parıltısı) değişmedi.
- **Çarpanın uygulandığı değerler:**
  - Yaprak sayısı: gündüz 10 / 20 / 35; gece tek yaprak 1 / 2 / 4.
  - Kuş gölgesi sıklığı: aralık [28, 52] sn çarpana bölünür; yüksekte 8–15 sn'de bir.
  - Toz/polen sayısı: 10 / 20 / 35.
  - Yer sisi ve ışık huzmesi opaklığı: `params.alpha` × çarpan, en çok 0,4.
    - Sis: 0,11 / 0,22 / 0,385.
    - Işık huzmesi: 0,09 / 0,18 / 0,315.
- **Taban değerler arttı:**
  - Yapraklar ve toz noktaları 2×2 tuval pikseli boyutunda (`params.size`).
  - Yaprak opaklığı 0,9; kuş gölgesi 0,28.
  - Işık huzmesi artık veriden belirgin bir opaklıkla çiziliyor (eskiden ≈0,05).
- **Gece kuralı aynı:**
  - Parlak ya da yanıp sönen tür yok.
  - Toz opaklığı ayarla artmaz (yalnızca sayısı artar).
  - Gece efektlerinin veri opaklığı ≤ 0,55 kaldı; sis en yüksekte 0,4'ü aşmaz. Test bunları denetliyor; eşik gevşetilmedi.
- **Katman ve performans değişmedi:** ızgara ve jetonların altında, tıklamaya kapalı; 320×179 tuval, en çok 30 kare/sn; "hareketi azalt" ve pil kuralları geçerli. `EffectsLayer` tembel parça (10,2 kB), ana parça değişmedi (316 kB).
- **`check:harita`:** güçlü ölçekli efekti olan varyantlar "orta" ve "yüksek" yoğunlukta ayrı açılıp denetlenir. Görüntüler `test-results/kara-ekran/orman-*-efekt-{orta,yuksek}-{telefon,pc}.png` olarak saklanır.

## 2026-10-22 — Weapon Mastery, Fighting Style, kimlik kuralı (Görev P0)

- **Kaynak:** Yalnızca SRD 5.2.1 (`data/srd/`). Mastery metinleri, silah → mastery tablosu ve sınıf hakları SRD'den doğrulandı.
  - SRD 5.2.1'de **Fighting Style feat'i yalnızca 4 tane**: Archery, Defense, Great Weapon Fighting, Two-Weapon Fighting.
  - Dueling, Thrown Weapon Fighting, Unarmed Fighting, Blind Fighting, Protection ve Interception SRD'de yok (PHB 2024); eklenmedi.
- **Kimlik kuralı:** `data/weapons.json`, `data/spells.json` ve `data/items.json` kayıtları sabit `id` (ad slug'ı) ve `srd: "<dosya>:<kimlik>"` taşır.
  - Silah id'si SRD silah id'siyle aynıdır.
  - Healing iksirleri `magic-items:potions-of-healing`, Hill Giant kemeri `magic-items:belt-of-giant-strength` varyantına bağlanır.
  - Alchemist's fire, Acid, Holy water, Antitoxin ve Healer's kit SRD "Adventuring Gear" listesine bağlanır; liste `npm run srd` ile ayrıştırılıyor (`data/srd/gear.json`, 81 kayıt).
  - Feat ve sınıf özelliği anahtarları zaten SRD kimliği.
  - `src/data/srdIds.test.ts` kimliksiz, yinelenen ya da SRD karşılıksız kaydı yakalar.
- **Weapon Mastery verisi:**
  - Silahın mastery'si `data/srd/weapons.json`'dan okunur; sınıf verisiyle tembel yüklenir.
  - Hak sayısı SRD sınıf tablosundan gelir: Barbarian ve Fighter "Weapon Mastery" sütunu, Paladin/Ranger/Rogue 2 (`data/class-features.json` `stat: weaponMastery`).
  - Barbarian yalnızca yakın dövüş silahı seçebilir (`melee: true`). Seçilebilen silahlar sınıfın yetkin olduğu silahlardır.
  - Mastery'lerin oyundaki durumu ve parametreleri `masteries` bölümünde: itme 10 ft ve en çok Large, Slow 10 ft, Topple CON, yapay zekâ önceliği. Kodda sınıf adı yok.
- **Uzun dinlenme:** SRD'ye göre Barbarian/Fighter bir seçimi, Paladin/Ranger/Rogue hepsini değiştirebilir (`swap`).
  - Karakter listesinde uzun dinlenmeden sonra "Silah talimi" çıkar; kural `masterySwapProblem` ile denetlenir.
  - Oluşturucuda (karakteri düzenlemek oyun dışı) seçim serbesttir; yalnızca sayı ve uygunluk denetlenir.
- **Savaşta (otomatik, olay + günlük):**
  - Ustalık yalnızca seçilen silahta ve oyunda çalışıyorsa seçeneğe yazılır.
  - **Cleave:** isabette ilk hedefin 5 ft yakınındaki ve erişimdeki ikinci düşmana ek saldırı.
    - İkinci hedef otomatik seçilir: en az HP'li, eşitse sırada önce gelen.
    - Hasara yetenek değiştiricisi eklenmez (negatifse eklenir); büyülü bonus eklenir. Turda bir kez.
  - **Graze:** ıskada değiştirici kadar aynı türde hasar (direnç uygulanır).
  - **Push:** isabette `pushAwayEvents` ile 10 ft (en çok Large).
    - SRD'de itme isteğe bağlı ("can"). Otomatik kural: yakın dövüşte yalnızca Attack eyleminin son saldırısında iter, böylece Extra Attack'ın ikinci saldırısı boşa gitmez.
    - Menzilli saldırıda ve fırsat saldırısında her zaman iter. Haritasız savaşta etkisiz.
  - **Sap / Slow / Vex:** savaşçıda süreli işaret (`marks`).
    - Süre, işareti koyanın tur başı ya da tur sonu sayısıyla reducer'ın `turn_ended` adımında düşer.
    - Sap ve Slow saldıranın sonraki turunun başına dek sürer.
    - Vex saldıranın sonraki turunun sonuna dek sürer: kendi turunda konduysa 2, başkasının turunda konduysa 1 tur sonu.
    - Sap işaretlinin bir sonraki saldırı zarı (silah ya da canavar saldırısı) dezavantajlı olur ve işaret kalkar.
    - Vex işaretli hedefe bir sonraki saldırı avantajlı olur ve işaret kalkar.
    - Slow hızı 10 ft azaltır (`speedHexes`) ve üst üste binmez.
  - **Topple:** CON save (DC 8 + değiştirici + yetkinlik); başarısızsa Prone (`condition_changed`).
  - **Nick: oyunda henüz çalışmıyor.** Light silahla ek saldırı (ikinci el) motorda yok. Oluşturucu, kart ve özellik notunda "oyunda henüz çalışmıyor" yazar; Weapon Mastery özelliği bu yüzden `partial`.
  - Spell saldırıları Sap/Vex işaretine bakmaz (yalnızca silah ve canavar saldırıları).
- **Yapay zekâ:** basit ve deterministik.
  - Silah seçiminde ortalama hasara verideki mastery öncelik puanı eklenir (`ai`: Topple 1,5; Cleave, Graze, Sap ve Vex 1; Push ve Slow 0,5).
  - Vex işaretli hedef, hedef sırasında öne geçer.
  - Etkiler motor tarafından otomatik uygulanır.
- **Fighting Style:**
  - Great Weapon Fighting uygulanıyor: iki elle tutulan yakın dövüş silahında (Two-Handed ya da kalkansız Versatile) silahın hasar zarındaki 1 ve 2, 3 sayılır.
    - Sneak Attack gibi ek zarlara uygulanmaz; fırlatmada uygulanmaz.
    - Versatile silahın iki el hasar zarı (`versatileDamage`) motorda hâlâ kullanılmıyor: önceden de böyleydi, ayrı iş.
  - Two-Weapon Fighting "oyunda henüz çalışmıyor" (ikinci el saldırısı yok).
  - Oluşturucu Fighter 1, Paladin 2, Ranger 2'de Fighting Style yuvası açar (Görev N'den; veriden).
- **Denge:** parti (Bor Defense, Kael Archery; Bor/Kael/Sela mastery) ortalama +7 puan güçlendi.
  - Aralık dışına çıkan dört senaryo yalnızca düşman listesiyle (ortam listesinden, canavar verisi aynı) düzeltildi: Dungeon Koridor 89→79, Hazine 87→80, Wyrmling 93→75, Taverna ortada 89→76.
  - Taverna değişikliği "uzakta" senaryolarında %51 verdiği için yalnızca "ortada"da; ayrıntı `docs/harita/DENGE.md`.
- **Kayıt sürümü 8:** `mastery_applied` ve `mastery_mark_used` olayları eklendi; 3–8 yüklenir.
- **Ana parça:** Giriş ekranı savaş motorunu statik içe aktarıyordu (`sheetAvatar` için `battle/index`, kayıt için `battleSave`).
  - Jeton yolu `battle/avatar.ts`'e, kayıt anahtarı `app/saveKey.ts`'e taşındı; kayıt yükleme tembel import oldu.
  - Motor artık ayrı `session` parçasında (≈123 kB). Ana parça 465 → 318 kB.

## 2026-10-22 — Orman hareketli ortam katmanı (Görev M)

- **Düzenek:** Mevcut harita efekt katmanı (Adım 10c: çöl sıcağı/kum fırtınası, volkan lav parıltısı) kullanıldı.
  - Yeni türler: `fallingLeaves` (1–4 piksel yaprak şekli, yavaş düşüp savrulur), `birdShadow` (ara sıra, hızlı geçen tek kuş gölgesi), `groundFog` (yer bandında yavaş kayan soluk sis), `motes` (seyrek, soluk, yanıp sönmeyen toz/polen).
- **Parametreler veride**, haritanın varyant JSON'unda: `intensity`, `speed` (zaman çarpanı, bütün türlerde), `params` (`count`, `shapes`, `everySec`, `band`, `alpha`); `effectErrors` doğrular. Başka haritaya eklemek yalnızca veri.
- **Orman gündüz:** hafif ışık huzmesi (yavaş), 14 yaprak, 18–40 sn'de bir kuş gölgesi.
- **Orman gece:** yer sisi (görselin alt %45'i, opaklık ≤ 0,14), 10 soluk nokta, tek yaprak.
  - Önceki ateşböceği ve genel sis kaldırıldı: gece görüş kuralı ve ışıklı altıgenlerle karışmasın diye parlak ya da yanıp sönen efekt yok (testle denetleniyor).
- **Katman:** harita görseliyle ızgara/jeton katmanı arasında; jetonların, vurguların ve tıklamanın altında, `pointer-events: none`.
- **Performans:**
  - 320×179 tuval, en çok 30 kare/sn.
  - Durduğu durumlar: sekme gizliyken, ekran dışındayken (IntersectionObserver), pil ≤ %20 ve şarjda değilken.
  - "Hareketi azalt" açıkken çizim yok, harita statik.
- **Ayarlar:** savaş menüsünde "Harita efektleri: Açık/Kapalı" ve "Efekt yoğunluğu: düşük/orta/yüksek" (sayı ve opaklık ×0,5/×1/×1,5), bu cihazda hatırlanır.
- **Tembel yükleme:** Katman (`EffectsLayer`) artık ayrı tembel parça (9,9 kB). Ayar kancası küçük `effectsSetting.ts`'e taşındı; menü arka planı artık çizim kodunu ana parçaya çekmiyor. Ana parça 476 → 465 kB.
- **Kontrol:** `check:harita` Orman gündüz ve gece efektli açılışta katmanın çizdiğini denetler ve ekran görüntüsünü `test-results/kara-ekran/orman-*-efekt-*.png` olarak saklar.

## 2026-10-22 — Ses eşlemesinden "düz zemin" kaldırıldı

- `data/ses.json`'daki `duz` kaydı hiçbir harita ya da kurulum seçeneğinde kullanılmıyordu (haritasız savaş yalnızca simülasyon ve testlerde). Kaldırıldı.
- Eşlemesi olmayan savaş hata vermeden sessiz kalır.
- Ortam kimliği `d-z-zemin` ("Düz zemin" kural ortamı; Ada, Gemi, Kale, Şehir meydanı, Taverna) ayrı bir şey, değişmedi.

## 2026-10-22 — Kurulum ekranında ortam sesi kalktı (Görev T)

- Game Master kurulumunda (harita/varyant değişse de) yalnızca menü müziği çalar. Savaş ekranına girince (savaşı başlat ya da kayıtlı savaşa devam) menü müziği çapraz geçişle kapanır; ortam sesi ve savaş müziği `data/ses.json`'a göre başlar (Volkan kuralı dahil). Savaştan çıkınca menü müziği döner.
- Eşleme `SCREEN_SOUND` (`src/ui/audio/soundPlan.ts`).
- Seviyeler, ayarlar, simülasyon ve kayıt sürümü değişmedi.

## 2026-10-22 — Ses sistemi: ortam sesi, müzik, zar sesleri (Görev S)

- **Kaynak:** `assets-ham/ses/`, **Suno ile üretildi**.
  - **Ticari kullanım:** Suno'nun güncel kullanım koşulları (abonelik türüne göre ticari kullanım hakkı) ve olası üçüncü taraf hakları mağaza/yayın öncesi kontrol edilecek. SRD içeriği değil; atıf dosyalarına girmez.
- **Temizlik ve adlar:** `AlbumArtSmall.jpg` ve `Folder.jpg` silindi. Türkçe harfli ve düzensiz adlar `git mv` ile ASCII adlara çevrildi; eşleme `data/ses-adlari.json`'da.
  - menü-dark → menu-dark; muzik-gunduz-a/gece-a → muzik-savas-gunduz/gece.
  - orman-* → ortam-orman-*; ortam-guverte-* → ortam-gemi-*; ı/ğ → i/g.
  - zar-*-a → zar-*.
- **İşleme** (`npm run ses`, `scripts/ses.mjs`, ffmpeg): `assets-ham/ses` → `public/ses` (ham dosyalar build'e girmez).
  - Biçim: MP3 44,1 kHz (iOS dahil). Ortam 96 kbps mono, müzik 128 kbps stereo, efekt 128 kbps mono.
  - Ortam ve müzik: baş/son sessizlik kırpılır; iki geçişli EBU R128 normalizasyonu: ortam −20 LUFS, müzik −18 LUFS.
  - Zar dosyaları: sessizlik algılamasıyla (−40 dB, en az 0,3 sn) ayrı kliplere bölünür. Her klip tepe −1 dBFS'e çekilir (kısa klipte LUFS güvenilmez). Kısa kırıntılar atılır (zar-dur'da 0,05 sn, diğerlerinde 0,25 sn altı).
  - Suno dosyalarındaki gömülü kapak resmi çıktıdan atılır (dosyaları iki katına çıkarıyordu).
  - Manifest `data/ses-klipler.json` (dosya, süre, boyut, zar klip grupları).
- **Sonuç:** 64 dosya, toplam 16,6 MB.
  - Müzik: 4 dosya, 10,4 MB (menu-dark 208 sn, menu-light 190 sn, savaş gündüz/gece 141/142 sn).
  - Ortam: 38 dosya, 5,9 MB; her biri 10–15 sn, 118–179 kB.
  - Efekt: 22 klip, 0,3 MB; 3–82 kB.
  - Zar: 22 klip. zar-tekli 1 (0,24 sn'lik başlangıç tıkırtısı atıldı), zar-coklu 3, zar-sekme 2, zar-dur 14, zar-kritik 1, zar-kritik-hata 1.
- **Eksikler:**
  - `ortam-duz-zemin` yok: haritasız savaş sessiz ("silent" işaretli).
  - Varyanta özel dosyası olmayanlar ortak kliple çalar:
    - Dungeon Merdiven ve Hazine odası → dungeon;
    - Volkan uyuyan ejderha → volkan;
    - Şehir meydanı "Gün" → sehir-meydani-gunduz;
    - Çöl "Akşam fırtınası" → col-firtina.
- **Eşleme veride** (`data/ses.json`): harita → varyant → ortam klipleri (a ve b) ve savaş müziği (gündüz/gece).
  - Varsayılan atamalar görevdeki liste.
  - Koşullu kurallar (`rules`): `map`, `variant`, `dragon` (uyuyan ejderha ayarı ya da canavar kimliği `enemyPattern`'e uyan düşman), `enemyPattern`.
  - Kural: Volkan'da ejderha varsa gece müziği.
  - Testler: her dosyanın varlığı, her harita/varyantın eşlemesi, Volkan + ejderha (gerçek savaş durumundan da).
- **Motor** (`src/ui/audio/engine.ts`, Web Audio):
  - Ayrı parça (5 kB), ilk dokunuşta yüklenir; tarayıcı zaten ilk dokunuştan önce ses çaldırmaz.
  - Kanallar: ortam, müzik (menü müziği kendi seviyesiyle), efekt → ana ses.
  - Sekme gizlenince askıya alınır, dönünce devam eder.
  - Ortam: a ve b ayrı döngülerde, kendi uzunluklarında. İkincisi yarısından başlar ki dikişler çakışmasın. Dikiş 2,5 sn eşit güçlü çapraz geçişle gizlenir.
  - Müzik: 4 sn çapraz geçişli döngü.
  - Klipler ihtiyaç olunca yüklenir; sahne değişince kullanılmayanlar bellekten atılır (zar klipleri kalır).
- **Ne zaman ne çalar:**
  - Menüler: temaya göre menu-light/menu-dark (2 sn geçiş).
  - Game Master kurulumu: yalnızca seçili haritanın ortamı.
  - Savaş yerleşimi: ortam sürer.
  - Savaş başlayınca: müzik 6 sn'de açılır.
  - Savaştan çıkınca: müzik ve ortam 1,5 sn'de kapanır, menü müziği döner.
- **Seviyeler** (veride, `levels`):
  - Ortam 0 dB (referans), savaş müziği −9 dB, menü müziği −6 dB, efekt +1 dB.
  - Müzik −18, ortam −20 LUFS'e normalize edildiği için savaşta müzik ortamın yaklaşık 7 dB altında.
  - Zar klipleri tepe −1 dBFS ile ortamdan ve müzikten net duyulur. Kulakla ince ayar `data/ses.json`'dan.
- **Ayarlar:** "Ses" düğmesi (ana menü başlığında ve savaş menüsünde): Ana ses, Ortam, Müzik, Efekt kaydırıcıları ve her birinin kapatma düğmesi. Bu tarayıcıda hatırlanır (`rpg-battle-ses`).
- **Zar sesleri** (`src/ui/diceSound.ts` tetikleri; yeni `throw` olayı):
  - Atış anında zar sayısına göre zar-tekli/zar-coklu.
  - 3D'de sekmelerde zar-sekme (sekme şiddetine göre seviye).
  - Durmada zar-dur; doğal 20'de ayrıca zar-kritik, doğal 1'de zar-kritik-hata.
  - Klip rastgele seçilir, art arda aynı klip gelmez. Aynı klip 40 ms içinde iki kez çalmaz (birden çok zar aynı anda durunca).
  - 2D'de ve zar animasyonu Kapalı'yken yalnızca atış ve durma.
- **Doğrulama:**
  - `npm run check:ses` (`scripts/ses-kontrol.mjs`, gerçek tarayıcı): dokunmadan bağlam yok → dokununca çalışıyor; kanallar kurulu; menü müziği ve tema geçişi; kurulumda ortam; savaşta ortam + gece müziği (uyuyan ejderha); zar sesleri; sekme gizlenince askı ve dönüş.
  - Gerçek dinleme kullanıcıda.
- **Ana parça:** 466,8 → 476,2 kB.

## 2026-10-22 — Seviye ilerlemesi, Aşama 0: ortak altyapı (Görev N)

### SRD verisi betikle (elle yazılmadı)
- `npm run srd` (`scripts/srd-ayristir.mjs`, `scripts/srd/pdf.mjs`): `docs/SRD_CC_v5.2.1.pdf` pdfjs-dist ile okunur.
  - Başlık düzeyi yazı tipi ve boyuttan çıkarılır: GillSans-SemiBold 26/18/14/12 bölüm başlıkları; Cambria gövde; GillSans tablo.
  - İki sütun okuma sırasına dizilir. Tablolar konumlu hücrelerden kurulur; sütun adları başlık sözcüklerinin en yakın veri sütununa atanmasıyla bulunur.
- Çıktı `data/srd/`, her kayıtta `source: { page, section }`:
  - `classes.json`: 12 sınıf; temel özellikler, 1–20 tablo (bütün sütunlar), özellik metinleri, Metamagic ve Eldritch Invocation seçenekleri.
  - `subclasses.json`: 12 alt sınıf. `feats.json`: 17 feat. `spells.json`: 339 büyü.
  - `magic-items.json`: 258 eşya (nadirliği değişken olanlar `Varies`). `weapons.json`: 38 silah + 8 mastery. `armor.json`: 13 kayıt.
  - `progression.json`: motorun kullandığı metinsiz özet.
  - `rapor.json`: sorunlar ve atlananlar.
- **Ayrıştırma sorunu yok.** Kendi kendini denetliyor:
  - Tablodaki her özelliğin metni bulunuyor; alt sınıf seviyeleri tabloyla tutarlı.
  - Slot tabloları `data/spell-slots.json` ile birebir (test).
- **Bilerek atlananlar:** büyü ve eşya içindeki yaratık stat blokları (7), sınıf metnindeki iki yan kutu (Paladin "Breaking your oath", Wizard "Expanding and replacing a spellbook").
- **Yazım düzeltmesi:** SRD'deki Barkskin "Component:" yazım hatası "Components" olarak okunur.
- **Kaybedilen içerik:** Özellik metinlerinin içindeki küçük tablolar (ör. Sorcerer "Creating Spell Slots") metne alınmadı.
- **Harici veri yok:** 5e-srd-api gibi harici veri kullanılmadı. PHB'ye özgü içerik yok.

### Büyü verisi SRD 5.2.1'e eşitlendi
- `npm run srd:buyu` (`scripts/srd-buyu-esitle.mjs`) kendiliğinden kopyalar: seviye, sınıflar, eylem türü, konsantrasyon, okul, SRD sayfası.
- `mechanics.upcast`, "Using a Higher-Level Spell Slot" metninden yapılandırılır: `dice`, `rays`, `targets`, `hp` ya da `duration`.
- Mekaniği karşılaştırıp `docs/BUYU-ESITLEME.md` raporunu yazar.
- Bileşen ve süre metni ana parçaya girmesin diye yalnızca `data/srd/spells.json`'da.
- **Elle düzeltilen mekanikler** (2014 değerleri):
  - Cure Wounds 2d8; Healing Word 2d4; Mass Healing Word 2d4 iyileştirme (önceden yanlışlıkla hasar türündeydi).
  - Chill Touch 1d10; Vicious Mockery 1d6.
  - Inflict Wounds: CON save, 2d10, başarıda yarı. Poison Spray: büyü saldırısı (save değil).
  - Sleep: WIS save → Incapacitated, her tur sonu save. SRD'deki ikinci başarısızlıkta Unconscious aşaması yok (`approx`).
- **Kalan farklar** (raporda): Produce Flame (yarat + fırlat tek bonus eylem), Mass Healing Word tek hedef, Dispel Magic yukarı slot etkisi metin olarak. Ayrıca 36 `utility` büyü.

### Özellik motoru (`src/rules/classFeatures.ts`)
- **Seviye bilgisi:** Hangi özelliğin hangi seviyede geldiği SRD tablosundan okunur.
- **Mekanik:** Ne yaptığı `data/class-features.json`'da (elle yazılan tek katman; anahtar `sınıf:özellik`). Türler:
  - `passive`: Extra Attack, Sneak Attack zarı (tablo sütunu), hız, Unarmored Defense, uzmanlık.
  - `resource`; `action` / `bonus` / `reaction`; `free` (Action Surge).
- **Durum:** `status`: `ok`, `partial`, `none` (savaşta etkisi yok) ya da `missing`. Dosyada olmayan özellik `missing` sayılır.
- **Sınıf adı koşulu kalmadı:** `economy.ts`, `create.ts` ve `stats.ts`'te kalmadı. Test kaynak kodu tarar.
- **Taşınanlar, davranış aynı:** Extra Attack, Sneak Attack, Cunning Action, Unarmored Defense, Fast Movement, Unarmored Movement, Favored Enemy'nin her zaman hazır Hunter's Mark'ı. Test eski elle yazılmış formüllerle 1–20 karşılaştırır.

### Kaynak modeli
- **Tanım:** `Combatant.resources` artık kimlik → sayı kaydı.
  - Tanımlar `data/class-features.json` `resources`: kullanım (tablo sütunu, seviye tablosu, seviye × n, yetenek değiştiricisi, sabit) ve yenilenme (kısa/uzun dinlenme, tur başı; sayı ya da hepsi; `shortFrom` eşiği).
- **Tanımlı kaynaklar:** Action Surge, Second Wind, Favored Enemy, Indomitable, Rage, Bardic Inspiration, Channel Divinity (Cleric ve Paladin), Wild Shape, Focus, Uncanny Metabolism, Lay on Hands, Sorcery Points, Innate Sorcery, Magical Cunning, Arcane Recovery.
- **Kullanılabilenler:** Savaşta yalnızca özelliği uygulananlar kullanılır ve HUD'da görünür (Action Surge, Second Wind, Favored Enemy). Diğerleri sayılıp dinlenmede yenilenir; eylemleri Aşama 1'de.
- **Slotsuz büyü:** Kaynak tanımındaki `freeSpell` (Favored Enemy → Hunter's Mark).
- **Tur başı yenilenme:** `rechargeResources` destekliyor, henüz bağlı değil.

### Alt sınıf, ASI/feat, uzmanlık, deneysel uyarı
- **Alt sınıf:** `CharacterSheet.subclassId`, 3. seviyede seçilir. SRD'de her sınıfın tek alt sınıfı var; boşsa o sayılır. Alt sınıf özellikleri seviyeye bağlı listelenir; hiçbiri henüz uygulanmıyor.
- **Seviye yuvaları** (`src/rules/advancement.ts`) SRD tablosundan:
  - ASI satırları (Fighter 6/14, Rogue 10 dahil);
  - Epic Boon (19);
  - Fighting Style özelliği (Fighter 1, Paladin 2, Ranger 2).
- **Seçim:** Yuvaya ASI (+2 ya da +1/+1, tavan 20) ya da ön koşulu tutan feat seçilir. Köken (Origin) feat'i ayrı seçilir.
- **Boş yuva sorun değil:** Eski kayıtlı karakterler bozulmasın; skorlar 1. seviyedeki gibi kalır.
- **Feat etkileri veriden** (`class-features.json` `feats`):
  - Uygulananlar: ASI, Alert (inisiyatife yetkinlik), Skilled (+3 beceri), Archery (+2 menzilli), Defense (zırhla +1 AC), Grappler ve Epic Boon'ların yetenek artışı (Boon tavanı 30).
  - Yalnızca not (`missing`/`partial`): Magic Initiate, Savage Attacker, Great Weapon Fighting, Two-Weapon Fighting, Grappler'ın ve Boon'ların diğer faydaları, Alert'in Initiative Swap'ı.
- **Uzmanlık:** Hakkı veriden: Rogue 1 ve 6, Bard 2 ve 9, Ranger 9, Scholar 1 (liste kısıtı denetlenmiyor). Oluşturucu seçtirir ve fazlası sorun sayılır.
- **Deneysel uyarı:** "Sınıf özellikleri" paneli bu seviyeye dek gelen özellikleri durumlarıyla gösterir.
  - Uyarı seviyesi: `max(6, tamamlanan son seviye + 1)`.
  - Tamamlanan seviye veriden hesaplanır: bütün özellikleri `ok`/`partial`/`none`. Sınıflar tamamlandıkça uyarı kendiliğinden daralır. Bugün her sınıfta 1. seviyede bile eksik var (Weapon Mastery, Rage…), uyarı 6'dan başlıyor.

### Yukarı slot ve dinlenme
- **Slot seçimi:** Büyünün hedef ve alan balonunda slot düğmeleri var; seçilmezse en düşük uygun slot kullanılır.
  - Motorun henüz uygulamadığı yukarı slot etkisi açıkça yazılır ("oyunda henüz yok, yalnızca slot harcanır").
  - Yapay zekâ slot seviyesi yazmaz: en düşük uygun slot.
  - Uygulanan yukarı slot etkileri yalnızca `upcast.applied` olanlar: Spiritual Weapon, Spirit Guardians. Yenileri Aşama 1'de; sim çıktısı bu yüzden değişmedi.
- **Savaşlar arası durum** (`src/rules/characterRest.ts`, `src/app/partyStatus.ts`):
  - Biten savaşta oyuncu karakterlerinin HP'si, kaynakları ve slotları kayıtlı karaktere yazılır. Sonraki savaş bu durumla başlar.
  - 0 HP'deki ya da ölü karakter partiye alınamaz. Ölü için "Diriltildi say" düğmesi var.
- **Kısa dinlenme:** HP zarı harcanır (zar + CON); kısa dinlenmede yenilenen kaynaklar dolar; Warlock slotları dolar.
- **Uzun dinlenme:** Her şey dolar; harcanan HP zarlarının yarısı geri gelir (SRD 5.2.1).
- **Arayüz:** Karakter listesi ve Game Master kurulumu ("Herkes uzun dinlensin").
- **Kayıt sürümü 7:** kaynak kaydı biçimi. 3–7 yüklenir; eski üç alanlı kaynak nesnesi aynı okunur (test).

### Simülasyon
- **`--seviye N`:** `npm run sim -- 200 --seviye 11 kale`.
- **Parti üreteci iskeleti `partyAt(level)`:**
  - 5. seviyede `PARTY` birebir döner.
  - Diğer seviyelerde aynı üyeler, skorlar, donanım ve büyüler kullanılır; yalnızca seviye değişir ve o seviyede seçilemeyen büyüler çıkar. ASI, donanım ve büyü seçimi Aşama 1.
  - Senaryoya seviyeli düşman listesi (`byLevel`) eklenebilir; boşsa 5. seviye listesi.
- **Ölçüm** (`docs/harita/DENGE.md`): büyü düzeltmeleri dışında çıktı birebir aynı.

### Tembel yükleme ve boyut
- **Ayrı parçada:** Sınıf ilerlemesi (49 kB), özellik mekaniği (9 kB) ve feat'ler (13 kB) `loadClassData()` ile ayrı parçada.
  - Uygulama açılışta boşta yükler; giriş ekranı beklemez, karakter ve Game Master ekranları bekler.
  - Testler `test-setup.ts`, simülasyon `await loadClassData()`.
- **Ana parça:** 439,6 → 466,6 kB (yeni oluşturucu panelleri, motor, dinlenme, büyü verisine okul ve yukarı slot). 500 kB altında.

### Kontrol betiği
- `npm run check:harita` 3D zar tepsisi (J3) haritayı örttüğü anda ölçüm yapınca zamanlamaya bağlı hata veriyordu. Kontrolde zar animasyonu kapatıldı.

## 2026-10-22 — 3D zar atışı, seçenek A (Görev J3, deneme)

- **Ne:** Zar tepsisinde düşük çözünürlüklü 3D zarlar (192×128 WebGL tuvali, iki kat büyütülüp piksel keskin gösteriliyor).
  - Zar türleri: d4, d6, d8, d10, d12, d20; d100 iki d10 (onlar "00".."90", birler "0".."9").
  - Zarlar soldan fırlatılır, dört kez azalan sekmelerle seker, yuvarlanır, gölge düşürür ve önceden belli sonuca oturur.
  - Yalnızca sunum: motor, kayıt ve elle zar girişi değişmedi.
- **Sahte fizik:** Dönüş, durma yöneliminden geriye hesaplanıyor: `q(t) = dönüş(eksen, açı·(1 − t)²) · q_son`. t = 1'de zar tam istenen yüzde durur (testte her zar ve her değer için doğrulandı). Konum ease-out ile, yükseklik parçalı parabollerle. Saf hesap `src/ui/dice3d/throw.ts` ve `shapes.ts`'te, three.js'ten bağımsız.
- **Yüzler:** Sayılar tuval dokusu. d4'te gerçek d4 gibi köşelerde; sonuç üstteki köşe. d6'da karşılıklı yüzlerin toplamı 7. 8 ve üstü yüzlü zarlarda 6 ile 9 altı çizgili. Doku küçültmede mipmap'li, büyütmede piksel keskin; küçük d20 yüzü de okunur.
- **Kamera** neredeyse tepeden (~72°): sonuç yüzü en büyük ve okunur; yan yüzler derinlik verir.
- **Çoklu zar:** Ayrı hücrelere dizilir (≤4 tek sıra, fazlası iki sıra), birbirine değmez; her biri kendi eğrisiyle iner.
- **Vurgular:**
  - Avantaj/dezavantajda sayılan d20'nin altında halka, öteki soluk.
  - Doğal 20 altın, doğal 1 kırmızı parıltı. Tepsi kenarı ve "KRİTİK" yazısı önceki gibi.
- **Süre:** Normal 1,5 sn (atış 0,75 + okuma 0,75; eskiden 1,6). Hızlı 0,75 sn ve her zaman 2D.
- **Ne zaman 3D, ne zaman 2D** (`src/ui/dice3dSupport.ts`):
  - 3D: Normal hız, hareket azaltma kapalı, WebGL var, cihaz belleği ≥ 4 GB ve ≥ 4 çekirdek (tarayıcı bildirmiyorsa yeterli sayılır).
  - Art arda iki atış 24 kare/sn altındaysa bu oturumda 2D. Tek takılma yetmez: yapay zekâ turuyla çakışan bir atış yanlışlıkla düşürmesin.
  - Hareket azaltmada animasyonsuz sonuç (değişmedi).
- **Tembel yükleme:**
  - three.js (0.186.1) yalnızca `Dice3D` parçasında; ilk 3D atışta yüklenir, yüklenene dek o atış 2D.
  - Parça 529,8 kB (gzip 134,7 kB). Ana parça değişmedi: 439,6 kB.
  - Vite bu tembel parça için "500 kB üstü" uyarısı veriyor; ana parça kuralı etkilenmiyor.
- **Tema:** Renkler veriden (`data/zar-gorselleri.json`, `three` alanı: gövde, yüz, kenar, sayı, doğal 20/1 parıltısı, halka). Yeni tema yalnızca veri girdisi.
- **Ses tetik noktası:** `src/ui/diceSound.ts`, `onDiceSound` ile dinlenir. Olaylar: "bounce" (sekme, şiddetiyle) ve "settle" (durdu; kritik/kritik hata bilgisiyle). Şimdilik dinleyen yok.
- **Ölçüm** (headless Chromium, yazılım WebGL/SwiftShader; gerçek GPU daha hızlı olur):
  - Masaüstü 1280×720: atış başına 44–58 kare/sn.
  - Orta düzey telefon taklidi (CPU 4 kat yavaş, 844×390, DPR 2): 35–52 kare/sn. Yapay zekâ turuyla çakışan tek atış 14–17.
- **B seçeneği (gelişmiş 2D) ile karşılaştırma:**
  - B'nin önceden çizilmiş dönme kareleri (sprite) çok hafif (kütüphane yok, birkaç kB) ve her cihazda akıcı olurdu.
  - Ama sonuç yüzü elle ayarlanan son kareyle sınırlı; d20/d12 gibi çok yüzlü zarlarda her değer için ayrı son kare ya da üst üste sayı gerekir.
  - A gerçek yönelimle sonuca oturuyor ve tema/renk değişimi bedava.
  - Bedeli 135 kB (gzip) tembel parça ve WebGL.
- **Öneri:**
  - A'yı tutmak.
  - Sonraki adım: three.js yerine bu sahne için ~10 kB'lık yalın bir WebGL çizici yazmak. Tek gölgelendirici, doku, Lambert ışığı ve disk gölgeler yetiyor; tembel parça 135 kB → ~10 kB olur, görünüm aynı kalır.
  - Beğenilmezse bu commit tek başına geri alınabilir (`git revert`).

## 2026-10-22 — Zar görselleri, klasik tema (Görev J2)

- **Kaynak:** `assets-ham/zarlar/zar-klasik.jpg`, **Gemini ile üretildi**. Macenta zeminde yan yana 7 boş yüzlü piksel sanatı zar (d4, d6, d8, d10, d12, d20, d100).
  - **Ticari kullanım kontrolü:** Masum ve efekt görsellerindeki gibi, ticari yayından önce Google'ın güncel üretken yapay zekâ kullanım koşulları ve olası üçüncü taraf hakları gözden geçirilmeli. SRD'den gelen içerik değil; atıf dosyalarına girmez.
- **İşleme:** `npm run zarlar` (`scripts/zarlar.mjs`), masum ve efekt betikleriyle aynı yöntem.
  - Arka plan: kenardan flood-fill, kapalı boşluk temizliği, despill.
  - Ayırma: bağlı bileşen analizi; en büyüğün %5'inden küçük lekeler atılır. Zar sayısı koddan bulunur: 7, atılan leke 0. 7 değilse betik nedenini yazıp durur.
  - Adlandırma: soldan sağa sıralanıp d4..d100.
  - Çıktı: hepsine aynı ölçek (0,2822; en büyük kenar 116 px), nearest-neighbor. Alt kenar 122 px'te hizalı, yatayda ortalı. 128×128 kayıpsız WebP: `public/zarlar/klasik/<zar>.webp`.
- **Veri:** `data/zar-gorselleri.json`.
  - İçerik: tema kimliği, görünen ad (TR/EN), sayı yazısının rengi, kenar rengi ve boyu; her zar türü için görsel yolu ve sayının konumu.
  - Yeni tema (altın, gümüş, elmas…) = `assets-ham/zarlar/zar-<tema>.jpg` → `npm run zarlar` + bu dosyaya yeni girdi; kod değişmez.
- **Tepsi:**
  - Zar temanın görseliyle çizilir: 64 px, piksel keskin. Dönme ve sallanma CSS ile; sayı görselin üstüne yazılır.
  - Doğal 20'de altın parıltı ve "KRİTİK", doğal 1'de kırmızı ve "KRİTİK HATA". Avantajda sayılmayan d20 soluk.
  - Görsel yüklenemezse o zar türü eski SVG şekle düşer.
  - Görseller tepsi ilk açılınca yüklenir (tembel); ana parça değişmedi (439,6 kB).
  - Hareket azaltma, animasyon ayarı ve kayıt davranışı aynı.
  - Savaş menüsünde "Zar teması: Klasik" seçici; şimdilik tek tema, bu cihazda hatırlanır.

## 2026-10-22 — Gizlenme netleştirme, gece kuralı, Orman gece (Görev K)

### Denetim: önceki davranış
- **Nerede:** Gizlenme yeri olan altıgende.
  - Zemin kataloğunda (kodda) kum tepesi `d` (+0) ve çalılık `g` (+2).
  - Çöl'ün `hideTerrain` alanında açık kum `.`.
  - Orman'ın `stealth` kuralında ağaca (`a`) bitişik altıgenler.
  - Kale, Şehir meydanı, Taverna, Dungeon, Gemi, Mağara, Dağ, Ada'da hiç gizlenme yeri yoktu.
- **Zar:** d20 + Stealth + yer bonusu, sabit DC 15'e karşı. Kum fırtınasında avantaj, Stealth dezavantajlı zırhta dezavantaj.
- **Kime karşı:** Hiç kimsenin Algısına karşı değil. Düşmanın görüş hattı ve pasif Algısı bakılmıyordu; düşman yanı başındayken bile gizlenilebiliyordu.
- **Etkisi:** Başarıda toplam bulunma DC'si olur. Düşmanlar gizliyi hedef alamaz; gizlinin saldırısı avantajlı.
- **Ortaya çıkma:** Saldırı, büyü, itme, yürüme, atlama, ya da Ara (Search) ile toplamı geçen bir düşman.
- **Gösterim:**
  - Sahibine yarı saydam jeton, örtü (yaprak/kum/gölge), kapalı göz ve kodda Türkçe yazılı "Gizli (DC n)".
  - Düşmana görünmez; Game Master "gizli jetonları göster" ile soluk görür.
  - Boşta, ulaşılabilir gizlenme yerleri ince mavi kesikli çerçeveyle gösteriliyordu; neden ve bonus yazılmıyordu.

### SRD 5.2.1 Hide ile karşılaştırma ve sapmalar
SRD 5.2.1 Hide eylemi şunları söyler:
- DC 15 Dexterity (Stealth) gerekir.
- Yoğun örtüde (Heavily Obscured) ya da 3/4 veya tam siper arkasında olmalısın.
- Hiçbir düşmanın görüş hattında olmamalısın.
- Başarıda Invisible olursun; toplam, seni bulmak için gereken Wisdom (Perception) DC'sidir.
- Fısıltıdan yüksek ses, bulunmak, saldırı zarı atmak ya da sözlü bileşenli büyü yapmak bunu bitirir.

| Konu | SRD | Bu oyunda | Neden |
|---|---|---|---|
| Örtü/siper şartı | Yoğun örtü ya da 3/4 siper | Haritanın gizlenme yerleri (veri): çalılık, kum, ağaç/direk/sandık/kaya arkası | Altıgen haritada yöne bağlı siper hesabı yerine yer listesi; tasarımcı veride ayarlar |
| Görüş hattı dışında olmak | Şart | Görüş hattındaki düşmanlar engel değil, ama toplam onların en yüksek pasif Algısını da geçmeli (DC = en az 15) | Taktik oyunda "kimse görmüyor" nadir; pasif Algı aynı fikri ölçülebilir kılar |
| Bitişik düşman | (görüş hattı şartına girer) | Bitişikte seni gören düşman varken gizlenilemez; gizliyken düşman yanına gelirse turunun başında fark eder | Gece de dahil "yanı başındakini fark eder" |
| Yürümek | Bitirmez | Bitirir (değişmedi) | Gizlenme yerinden çıkınca siper kalmaz; ayrıca dengeyi korur |
| İtme (Shove) | Saldırı zarı değil | Bitirir (değişmedi) | Fiziksel temas |
| Sözlü olmayan büyü | Bitirmez | Her büyü bitirir (değişmedi) | Büyü bileşenleri modellenmiyor |
| Invisible koşulu | Verir | "Gizli" durumu: hedef alınamaz, saldırısı avantajlı | Aynı sonuç |

### Yeni kurallar
- **Gizlenme yerleri veriden.**
  - Genel kurallar `data/stealth.json`: DC 15, çalılık +2, kum tepesi, örtü görüntüsü, pasif Algı tabanı 10, bitişik düşman kuralı.
  - Her haritanın kendi harfleri `data/maps/*.json` içindeki `hide` alanında (`terrain`, `adjacentTo`, `cover`).
  - Kodda zemin harfi sabiti kalmadı (zemin kataloğundaki `hide` ve Çöl'ün `hideTerrain` alanı taşındı).
  - Yeni yerler, SRD'nin 3/4 siper şartına göre engel arkası:
    - Kale: kaya, direk, sandık arkası.
    - Şehir meydanı: çeşme/direk, tezgâh/sandık, ağaç arkası.
    - Taverna, Dungeon, Gemi: direk ve sandık/masa arkası.
    - Mağara: sarkıt ve kaya arkası. Dağ: kaya arkası. Ada: kaya ve ağaç arkası.
  - Volkan'da gizlenme yeri yok.
- **Pasif Algı:** Gözcü = gizlenene görüş hattı olan, uyanık ve aklı başında düşman. Pasif Algısı 10 + Algı. Gizlenme toplamı en az 15 ve en keskin gözcünün pasif Algısı olmalı. Olay gözcüyü yazar (`hide_attempted.watcherId`).
- **Gece** (`night` kuralı; Kale gece, Şehir meydanı gece, Orman gece):
  - Işıksız altıgende gizlenene karşı karanlık görüşü olmayan gözcünün pasif Algısı −5.
  - Işıksız altıgende Gizlen zarı avantajlı.
  - Işıklı altıgen ve karanlık görüşlü gözcü gündüz gibi.
  - Parametreler (`passivePerceptionPenalty`, `hideAdvantage`, `lights`, `lightRadiusHexes`) harita JSON'unda.
  - Bitişik düşman kuralı gecede de geçerli; gece gizlenmeyi kolaylaştırır, imkânsızı mümkün kılmaz.
- **Karanlıkla birleşim:** Işıklar tek yerde.
  - `darkness` (görüş sınırı) ile `night` (gizlenme) aynı ışık listesini kullanır (`litHexes`).
  - Şehir meydanı gecenin fenerleri isteğe bağlı karanlık kuralından gece kuralına taşındı; karanlık açılınca da aynı ışıklar geçerli.
  - Gece haritasına görüş sınırı eklenmedi (Kale gece ve Orman gece görüşü kısıtlamıyor).
- **Kayıt sürümü 6** (`watcherId`, bitişikteki düşmanın fark etmesi). Sürüm 3–5 yüklenmeye devam ediyor.

### Sayısal etki (gizlenme olasılığı; ışıksız altıgen, karanlık görüşsüz gözcü)
| Stealth | Gözcünün pasif Algısı | Gündüz | Gece | Gece, karanlık görüşlü gözcü |
|---|---:|---:|---:|---:|
| +3 | 13–15 | %45 | %70 | %70 |
| +3 | 18 | %30 | %70 | %51 |
| +5 | 13–15 | %55 | %80 | %80 |
| +5 | 18 | %40 | %80 | %64 |
| +7 | 13–15 | %65 | %88 | %88 |
| +7 | 18 | %50 | %88 | %75 |

Önceki kuralda (pasif Algı yok) gündüz değerleri yalnızca DC 15'e göreydi; keskin gözlü gözcüye karşı gündüz gizlenmek artık daha zor.

### Arayüz
- **Saklanma bölgeleri:**
  - Boşta, ulaşılabilir ve gizlenilebilir yerler yeşil kesikli çerçeve ve göz-çizgili simgeyle gösterilir.
  - Menüdeki "Saklanma bölgelerini göster" bütün yerleri gösterir; ulaşılamayan ya da düşmanın gözü önündekiler gri, seyrek kesikli ve soluk.
  - Gizlen yapılamazken düğmeye basınca bölgeler açılır.
  - Renk körü için desen ve simge de var.
- **Bilgi kutusu:** "Saklanılabilir: evet (çalılık, sazlık +2)" ya da "hayır (Açık zemin: örtü yok)" / "hayır (Wolf hemen yanında, seni görüyor)". Ek notlar: "karanlık: Gizlen zarı avantajlı", "geçilmesi gereken 18 (Wolf pasif Algısı)", "ışıksız (gece)".
- **Gizli jeton:** Sahibine göz-çizgili simge ve "Gizli (Stealth: 19)" etiketi (dil dosyasından). Karakter çekmecesinde de aynı.
- **Orman gece:**
  - `public/maps/orman-gece.webp`: `assets-ham/haritalar/orman-gece.jpg` 1280×715'e küçültüldü, 71 kB.
  - Zemin gündüzle aynı.
  - İki ay ışıklı açıklık (1 altıgen), ateşböceği ve sis efekti.
- **Yapılmadı:** Gizli tuzakların Game Master görünümü (isteğe bağlıydı).
- **Yapay zekâ gizlenmiyor** (bilinen eksiklerde).

## 2026-10-22 — Zar animasyonu ve elle zar girişi (Görev J)

- **Elle zar: "zar iste, aynı değerlerle yeniden çalıştır".** ManualRng (bir sonraki sayıyı bekleyen Rng) yerine bu seçildi.
  - Neden: `Rng` eşzamanlı bir fonksiyon (`() => number`); motor yarıda bekleyemez. Komutlar saf olduğu için yeniden çalıştırmak ucuz ve güvenli.
  - Adım (komut, yapay zekâ turu, savaş kurulumu) `(rng) => sonuç` olarak zar defteri (`DiceBook`) üstünden çalışır (`src/rules/manualDice.ts`, `runWithDice`).
  - Elle atılacak grup defterde yoksa `NeedDice` fırlar, hiçbir durum değişmez. Arayüz zarı ister, değerleri deftere ekler ve adımı baştan çalıştırır.
  - Otomatik zarlar (canavar zarları "yalnızca oyuncular" kipinde) deftere yazılır, yeniden çalıştırmada aynı gelir.
  - Sonuç: yalnızca gereken zarlar istenir. Iskada hasar zarı yok; kritikte iki kat zar; avantajda iki d20.
- **Rng sözleşmesi bozulmadı.**
  - Zar fonksiyonları (`rollDie`, `rollDice`, `rollD20`) Rng'nin üstünde isteğe bağlı bir `dice` kancası varsa bütün grubu ona sorar; yoksa eskisi gibi atar.
  - Kimin/ne için attığı `rollTag(rng, { by, kind, bonus })` ile iliştirilir; kancasız Rng'de aynı fonksiyonu döndürür.
  - Kurtarma zarını hedef, saldırı ve hasarı saldıran atar; içteki bilgi önceliklidir (`resolveSave` 'save' der).
  - Ejderhanın uyanma zarı `floor(rng()·100)` yerine `rollDie(100) − 1`: aynı dağılım, aynı dizi.
  - Doğrulama: `npm run sim -- 30` çıktısı değişiklikten önce ve sonra birebir aynı (17 senaryo).
- **Zar modu** savaş durumunda (`state.diceMode`, `battle_started` ile kaydedilir). Değerler: otomatik (varsayılan), fiziksel zarlar yalnızca oyuncu karakterleri, fiziksel zarlar herkes.
  - "Yalnızca oyuncular": zarı atan oyuncu karakteriyse (masum değil) istenir. Oyuncunun kurtarma zarı canavar turunda da istenir.
  - "Herkes": canavarların ve ortamın zarları da Game Master'dan istenir; yapay zekâ turu ("Düşmanları oynat") da zar ister.
  - Fiziksel zarda inisiyatif zarları kurulumda ("Savaşı kur") istenir.
  - Simülasyon ve testler her zaman otomatik (kancasız Rng).
- **İstem:** "Saldırı: 1 adet d20 at (+5)", "Hasar: 4 adet d10 at" ve kritik notu, avantaj notu, zarı atanın adı.
  - Her alan 1..yüz sayısı arasında tam sayı olmalı (tarayıcı doğrulaması kapalı, kendi iletimiz).
  - "Otomatik at" yalnızca o grubu atar; "Vazgeç" adımı bırakır (durum değişmez).
- **Kayıt:** Arayüzden gelen her adımın zarları `dice_rolled` olayına yazılır: değerler, kimin attığı, amaç, bonus, avantaj, kritik, elle mi.
  - Olay durumu değiştirmez; sonuçlar zaten ardından gelen olaylarda.
  - Kayıt sürümü 5. Sürüm 3 ve 4 yüklenmeye devam ediyor (zar modu yok, otomatik).
  - Düz Rng ile (testler, simülasyon) zar olayı yazılmaz; eski olay akışı aynı.
- **Zar animasyonu** yalnızca sunum (`src/ui/DiceTray.tsx`, tembel parça, 2,3 kB).
  - Ekranın üst ortasında tepsi. Zar türüne göre şekil: d4 üçgen, d6 kare, d8 eşkenar dörtgen, d10/d100 uçurtma, d12 beşgen, d20 altıgen.
  - Normal: 0,8 sn döner, 0,8 sn sonucu gösterir ("d20: 14 +5 = 19"). Hızlı: 0,3 + 0,45 sn. Kapalı: yok.
  - Doğal 20 altın ve "KRİTİK"; doğal 1 kırmızı ve "KRİTİK HATA". Avantaj/dezavantajda iki d20, sayılmayan soluk.
  - Hareketi azalt açıksa dönme yok, yalnızca sonuç.
  - Kuyruk sırayla oynar. Tepsi tıklamaları engellemez (pointer-events: none); ekrana herhangi bir dokunuş kuyruğu atlar, tıklama oyunda da işler.
  - Yalnızca canlı zarlar oynar: kayıttan yüklenen oturumun eski zarları oynamaz, yeni kurulan savaşta inisiyatif zarları oynar.
  - Çakışma: isabet/hasar işaretleri ve hasar efektleri bu adımın zarları bitince başlar (en çok 3,2 sn gecikme).
  - Ayar savaş menüsünde ("Zar animasyonu: Normal/Hızlı/Kapalı"), bu cihazda hatırlanıyor.

## 2026-10-22 — Yükleme ve görseller (Görev I)

- **Giriş videosu döngüsü:** Arka planlar video (`public/acilis/*.mp4`, 10 sn, 24 kare/sn).
  - Sorun: ilk ve son kare birbirini tutmuyordu. Dikiş SSIM'i 0,90–0,97, komşu karelerde 0,93–0,999; `loop` her 10 saniyede sıçrıyordu.
  - Çözüm: çapraz geçişli döngü (`npm run acilis`, ffmpeg). Video 1. saniyeden başlıyor; son 1 saniyesi baştaki ilk saniyeye karışıyor. Süre 9 sn.
  - Dikiş SSIM'i artık komşu kare düzeyinde, örneğin pc-dark 0,910 → 0,983 (komşu 0,989), pc-light 0,950 → 0,997.
  - Ham videolar `assets-ham/acilis/` altında. Bit hızı özgün videoyla sınırlı; dosyalar küçüldü.
  - Poster artık videonun ilk karesi, poster → video geçişinde sıçrama yok.
  - MP4 (H.264) yanında WebM (VP9) yedeği var. H.264 oynatamayan Chromium/Linux önceden hep posterde kalıyordu.
  - Hata düzeltmesi: React `<source>` hatasını `<video onError>`'a da iletiyordu; ilk kaynak açılamayınca video tümden kaldırılıyordu. Artık yalnızca son kaynak da açılamazsa düşüyor.
- **Tema geçişi:** İki temanın katmanı da çiziliyor.
  - İki poster `index.html`'de ekran yönüne göre önyükleniyor.
  - Görünmeyen temanın videosu, görünen video oynayınca (en geç 4 sn sonra) arka planda yükleniyor ve duraklatılmış bekliyor. Veri tasarrufu açıksa yüklenmiyor.
  - Geçişte yeni katman 0,4 sn'de beliriyor, eski katman o bitene dek altında kalıyor; boş kare yok.
  - Bedeli: iki temanın videosu da iniyor. pc 548 kB, telefon 901 kB (mobil-dark videosu tek başına ~500 kB).
- **Karakter görselleri:**
  - Rozetler (44–48 px) artık 96 px kopyayı kullanıyor (`public/characters/kucuk/`, `npm run karakter-kucuk`): ortalama 22 kB → 3,5 kB. Haritadaki jeton büyük görselde kaldı.
  - Rozet `<img loading="lazy">`; ilk ekrandakiler (oyuncu listesi, oluşturucu) `eager`. Yüklenene dek iskelet (kayan parıltı), görsel gelince yumuşakça beliriyor.
  - Önyükleme: giriş ekranında kayıtlı karakterlerin küçük jetonları; oluşturucuda türün ve görünümün bütün sınıf jetonları (boşta).
- **Ana parça:** Savaş, Game Master ve durum ekranları ayrı parça (`React.lazy`); Game Master ekranına girilince savaş parçası önceden indiriliyor. Ana parça 549,6 kB → 424,9 kB (gzip 173,5 → 136,3 kB).
- **Ölçüm** (`npm run olcum`): üretim derlemesi, Chromium (headless), CDP ağ kısıtlaması, boş önbellek, 3 tekrarın ortancası.
  - "Video oynar" önceden ölçülemiyordu: headless Chromium H.264 oynatmaz, eski sürümde yedek yoktu.

| Ağ | Ekran | Arka plan görünür | Video oynar | Tema geçişinde boşluk | Liste (5 görsel) | Yeni karakter | Sınıf değişimi | Karakter görselleri |
|---|---|---|---|---|---|---|---|---|
| Hızlı 3G | pc | 1966 → 1496 ms | — → 2483 ms | 411 → 0 ms | 782 → 71 ms | 81 → 77 ms | 313 → 50 ms | 128 → 57 kB |
| Hızlı 3G | telefon | 1995 → 1671 ms | — → 2632 ms | 677 → 0 ms | 775 → 73 ms | 79 → 69 ms | 315 → 50 ms | 128 → 57 kB |
| 4G | pc | 497 → 379 ms | — → 684 ms | 111 → 0 ms | 229 → 66 ms | 69 → 73 ms | 129 → 48 ms | 128 → 57 kB |
| 4G | telefon | 502 → 416 ms | — → 687 ms | 160 → 0 ms | 230 → 75 ms | 78 → 71 ms | 134 → 50 ms | 128 → 57 kB |

## 2026-10-22 — Karakter yaratma ve metin düzeni (Görev H)

- **Dil (TR/EN):**
  - Bütün ekran metinleri tek dosyada: `src/i18n/strings.ts`. `tr` kaynak, `en` aynı tipte; TypeScript eksik ya da fazla anahtarı yakalıyor.
  - Okuma `t()` ile. Seçim giriş ekranında; tarayıcı belleğinde (`rpg-battle-lang`) hatırlanıyor, yoksa Türkçe.
  - Dil değişince kök yeniden çiziliyor. Savaş günlüğü olaylardan yeniden yazıldığı için eski satırlar da yeni dile geçiyor.
  - Çevrilen yerler: giriş, oyuncu, karakter oluşturucu, Game Master kurulumu, durum, savaş ekranı (menü, ipuçları, balonlar, bilgi kutusu, özet), savaş günlüğü, tema düğmesi.
  - **Henüz çevrilmeyenler** (EN'de Türkçe görünür):
    - motorun hata ve gerekçe metinleri (`src/battle`, `src/rules`'ta ~160 `fail(...)`; olayların `reason`, `note`, `text` alanları);
    - veri metinleri: tür özellikleri, eşya açıklamaları, harita, varyant ve zemin adları, harita kural notları.
  - Oyun terimleri SRD'deki İngilizce adlarıyla: sınıf, tür, beceri, büyü, durum, silah özellikleri (Finesse, Heavy…).
- **"GM" → "Game Master"** bütün ekran metinlerinde. Kod kimliği (`gm`) aynı.
- **Donanım açıklamaları** (`src/ui/equipmentText.ts`) yalnızca veri alanlarından üretiliyor.
  - SRD 5.2.1 tablosundan eksik alanlar eklendi:
    - zırh Güç şartı: Chain Mail 13, Plate Armor 15;
    - silah özellikleri Heavy, Two-Handed, Loading, Ammunition.
  - Zırh seçim listesinde bir satır özet (AC, DEX sınırı, Güç, Gizlenme dezavantajı), altında ayrıntı.
  - Silah ve eşya çiplerinde bir satır özet; üzerine gelince ayrıntı. Seçilenlerin ayrıntısı listenin altında (dokunmatik için).
  - Mastery özelliği gösterilmiyor; oyunda uygulanmıyor.
- **Zırh Güç şartı artık uygulanıyor:** Güç skoru düşükse hız 10 ft azalıyor (SRD 5.2.1 Armor: Strength). Simülasyon partisinde şartı karşılamayan yok; denge değişmedi.
- **Özet:** Ad, seviye, tür ve sınıf; HP (zar); hız, yetkinlik, inisiyatif.
  - AC bileşenleriyle gösteriliyor, örneğin "AC 19 = zırh 16 (Chain Mail) + kalkan 2 + Ring of Protection +1".
  - Gizlenme dezavantajı ve Güç uyarısı da yazıyor.
  - Ana saldırı: seçilen silahlardan ortalama hasarı en yüksek olan.
  - Ana büyüler (en çok 5, DC ve saldırı), geçmiş bonusu ve geçmiş becerileri.
- **Geçmiş bonusu:** Her skorda −/+ sayacı var.
  - Yalnızca +2/+1 ya da +1/+1/+1 kalıbına götüren artışlar açık (`canRaiseBonus`).
  - Bir skora en fazla +2; üç +1 verilince +2 kapanır.
- **Giriş metni** (onay bekliyor): "Altıgen haritalarda D&D 5. sürüm (SRD 5.2.1) kurallarıyla sıra tabanlı taktik savaşlar. Oyuncular karakterlerini oluşturur, Game Master haritayı ve düşmanları seçip savaşı yönetir; hepsi tek cihazda."

## 2026-10-21 — Hasar efekti sprite'ları (Görev D ek parça)

- **Görseller:** 5 efekt şeridi Gemini ile üretildi (`assets-ham/efektler/*.jpg`). **Mağazaya çıkmadan önce ticari kullanım koşulları kontrol edilecek.**
- **İşleme** (`npm run efektler`, `scripts/efektler.mjs`, sharp):
  - **Kare tespiti:** çerçeve dikdörtgenlerinden; sabit eşit bölme yok.
    - Uzun dikey koyu çizgiler (yüksekliğin ≥ %20'si ve ≥ 100 px) dikey kenar sayılıyor.
    - İki kenar arası, üstte ve altta yatay koyu kenar varsa kare; macenta aralıklar ve dosyalardaki tam genişlik süs çizgileri kare sayılmıyor.
    - Asidin zeytin rengi çerçevesi de koyu sayılıyor.
  - **Bulunan:** burn 8 kare (genişlikler 510–636 px, eşit değil), poison, freeze, acid ve bleed 6'şar kare. Kareler çerçevenin içinden, kenar + 4 px payla kırpılıyor.
  - **Arka plan:** macenta/pembe ton siliniyor: R ve B yüksek ve neredeyse eşit (|R−B| ≤ 25), G belirgin düşük. JPG gürültüsü, son karelerdeki açık pembe zemin ve iç parazitler (poison 5. karenin sağ kenarındaki şerit) bu kurala giriyor.
  - **Despill:** arka plana komşu parlak pembe kenar pikselleri siliniyor; koyu mor dış çizgiler korunuyor.
  - **Zehir:** mor kabarcık ve duman gerçek içerik (B, R'den ~40 fazla); korunuyor.
  - **Buz ve kan:** mor/pembe gerçek içerik olmadığından, macentaya karışmış pikseller renk olarak düzeltiliyor:
    - buzda kırmızı yeşile çekiliyor (lavanta → buz mavisi);
    - kanda mavi kırmızıya göre sınırlanıyor (pembe → kan kırmızısı).
  - Parçacık efektleri olduğu için küçük parçalar atılmıyor.
  - **Ölçek:** her efektte bütün karelere tek ölçek ve tek çıpa; kare başına ortalama yok.
    - Pencere, içeriklerin kare çerçevesine göre birleşik sınırı.
    - Asit ve kanamada pencerenin üstü karenin üstüne sabit (damla üstten başlıyor).
    - Kareler 128×128, nearest-neighbor; efekt başına tek yatay şerit `public/efektler/<ad>.webp`.
  - `data/efekt-sprites.json` kare sayısı, kare boyutu, kare süresi (110 ms) ve eşlemeyi tutuyor.
- **Oyunda:**
  - Tur başı/sonu durum ve zemin hasarında jetonun üstünde bir kez oynuyor. Eşleme: ateş → burn, zehir → poison, soğuk → freeze, asit → acid.
  - Kanama hasarı olarak Infernal Wound (Bearded/Horned Devil) süreli hasarı → bleed; oyunda başka kanama yok.
  - Sprite jeton çapının ~1,3 katı; altıgenden taşabiliyor, tıklamayı engellemiyor. CSS `steps()` ile kare kare kayıyor; son karede görünmez oluyor.
  - Hasar sayısı kalıyor; emoji ve CSS animasyonunun yerine sprite geçiyor.
  - Hareket azaltmada yalnızca sayı görünüyor.
  - Sprite önceden yükleniyor; yüklenemezse eski emoji ve CSS animasyonuna düşüyor (tarayıcıda dosyalar engellenerek doğrulandı).
  - Kayıt yüklenince eski hasarlar oynamıyor (aynı sistem).

## 2026-10-21 — GM ekranı düzeltmeleri (Görev G)

- **Örnek karakterler:** Oyuncu ekranındaki "Örnek karakterleri ekle" ve GM ekranındaki "Hazır savaş" kaldırıldı.
  - Örnek karakterler `src/screens/fixtures.ts`'e taşındı; uygulama bu dosyayı içe aktarmıyor, yalnızca testler ve `check:harita` kullanıyor.
  - Karakter yokken iki ekranda da "Önce karakter oluştur" boş durum metni görünüyor.
- **Parti sınırı:** `MAX_PARTY = 6` (`src/app/limits.ts`, tek yer).
  - Oyuncu ekranında 6 karakterde "Yeni karakter" pasif oluyor; "En fazla 6 karakter (n/6)" bilgisi var. Karakter oluşturucuda da bilgi satırı var.
  - GM ekranında 6 seçilince diğer karakterler pasif oluyor. `planProblems` 6'dan fazlasını reddediyor.
  - Kodda eski bir 5 sınırı yoktu; yalnızca CLAUDE.md'de yazıyordu.
- **Düzen:** Harita bölümü Düşmanlar'ın üstüne taşındı. Ortam filtresi (haritaya uyanlar, "Tüm canavarlar") aynı kaldı.
- **Güç seviyesi filtresi:** Aramanın yanında çoklu seçim açılır menü var; hiçbiri seçili değilse hepsi gelir. Seçili canavarlar filtreden bağımsız hep listede.
  - Kademeler `src/data/monsterEnv.ts` `TIERS`'ta tanımlı; `monster-ortamlari.json`'da değil.
  - "Ufak" yalnızca görünen adda "Giriş Seviye" oldu; kimlik `ufak` aynı.
- **Özel canavar:**
  - Saldırı alanı en fazla 300 karakter (`CUSTOM_ATTACK_MAX`); sayaç gösteriliyor.
  - Eklenen özel canavar onayla silinebiliyor.
  - CR artık "?" değil, otomatik hesaplanıyor; GM açılır listeden düzeltebiliyor.
- **CR formülü** (`src/rules/crEstimate.ts`, tablo `data/cr-tahmini.json`; DMG yönteminin basitleştirilmiş yaklaşığı):
  - **Savunma CR'si:**
    - HP'den: ≤6 → 0, ≤35 → 1/8, ≤49 → 1/4, ≤70 → 1/2, sonra 71 HP'de CR 1 ve her 15 HP'de +1.
    - AC, o CR için beklenen AC'den her 2 puan fark için bir basamak kayar. Beklenen AC: CR ≤3: 13, 4: 14, 5–7: 15, 8–9: 16, 10–12: 17, 13–16: 18, 17+: 19.
  - **Saldırı CR'si:**
    - Tur başına ortalama hasardan (zar ortalaması × saldırı sayısı; özel canavarda 1): ≤1 → 0, ≤3 → 1/8, ≤5 → 1/4, ≤8 → 1/2, sonra 9'da CR 1 ve her 6 hasarda +1.
    - Saldırı bonusu, beklenenden her 2 puan fark için bir basamak kayar. Beklenen bonus: CR ≤2: +3, 3: +4, 4: +5, 5–7: +6, 8–10: +7, 11–15: +8, 16: +9, 17–20: +10, 21–23: +11, 24–26: +12, 27–29: +13, 30: +14.
  - **Sonuç:** İki CR'nin sayısal ortalamasına en yakın CR basamağı (eşitlikte küçük olan). Sınırlar 0 ve 30.
- **Aynala:**
  - Kaldırılan şey, GM ekranının Harita bölümündeki "Aynala" onay kutusu (haritayı ve başlangıç bölgelerini yatay çevirme). Harita ön izlemesindeki çevirme de kaldırıldı; yeni savaşlar hep aynasız.
  - Motor aynalamayı desteklemeye devam ediyor (`mirrored`); eski aynalı kayıtlar açılıyor.
  - `check:harita` aynalı haritaları artık eski kayıt yoluyla sınıyor: aynalı bir savaş kaydı üretip "Kayıtlı savaşa devam et" ile açıyor.
  - Denge simülasyonu zaten aynasızdı.
- **Değişen testler:** "Ufak" kademe adı → "Giriş Seviye" (istenen değişiklik). GM ekranı testleri artık `onAddCharacters` vermiyor. Örnek karakterler `fixtures.ts`'ten geliyor.

## 2026-10-21 — Ham görseller public/ dışında

- Ham (işlenmemiş) görseller `assets-ham/` altında; Vite yalnızca `public/`'i kopyaladığı için build çıktısına girmez (önceden 8 masum JPG'si, ~12 MB, dağıtılan oyuna giriyordu).
- Masumlar: `assets-ham/masumlar/masum-1..8.jpg` → `npm run masumlar` → `public/masumlar/*.webp` (git mv ile taşındı, geçmiş korunur).
- Efekt sprite'ları (Görev D ek parça, bekliyor): ham `assets-ham/efektler/` (burn, poison, freeze, acid, bleed `.jpg`) → `npm run efektler` → `public/efektler/`. Görev D ek tanımındaki "public/efektler-ham/" yolunun yerine bu yol geçerli.

## 2026-10-21 — Masum görselleri (8) ve GM seçimi (Görev F ek)

- **Görseller:** 8 masum görseli Gemini ile üretildi (`assets-ham/masumlar/*.jpg`). **Mağazaya çıkmadan önce ticari kullanım koşulları kontrol edilecek.**
- **İşleme** (`npm run masumlar`, `scripts/masumlar.mjs`, sharp):
  - Arka plan, kenardan başlayan flood-fill ile siliniyor. Eşik sıkı ve tona göre: G ≤ 45, R ve B ≥ 150 ve birbirine yakın. Koyulaşmış macenta lekeler de bu tona giriyor (masum-1'in üst kenarındaki leke).
  - Kol ile gövde arası ve kova sapının içi gibi kapalı boşluklar yalnızca saf arka plan rengindeki piksellerden tohumlanıyor. Ten ve giysi renklerine dokunulmuyor.
  - Despill iki aşamalı: arka plana 2 px içindeki macentaya kaymış pikseller siliniyor; küçültülmüş tuvalde kalan koyu macenta kenar pikseli de siliniyor ya da griye çevriliyor.
  - Ana figüre bağlı olmayan küçük lekeler atılıyor.
  - Bütün figürlere aynı sabit ölçek uygulanıyor: en uzun figür (Tüccar) 120 px; çocuklar 105 ve 90 px kalıyor. Görüntüler 128×128, nearest-neighbor.
  - Ayak hizası 124 px. Yatayda kütlenin medyanına göre ortalanıyor; ince baston ve sepet merkezi kaydırmıyor.
- **Veri:** `data/masumlar.json` kimlik, görünen ad ve görsel yolunu tutuyor (masum-1..8). Önceki 5 placeholder ve `data/masum-jetonlar.json` kaldırıldı.
- **GM seçimi:**
  - Kurulumda bir masuma dokununca 8 görselli küçük resim ızgarası açılıyor, her resim adıyla.
  - Seçim `choose_civilian_art` komutu ve `civilian_art` olayıyla yapılıyor; olay günlüğe giriyor. Aynı görsel birden çok masumda kullanılabiliyor.
  - GM seçmezse görsel, savaşın tohumuyla karışık atanıyor (`civilianArtSeed`) ve başlangıç olayında saklanıyor.
- **Kayıt sürümü 4:**
  - Yeni olay `civilian_art` ve masumdaki `gorselId` alanı geldi.
  - Sürüm 3 kayıtlar yüklenmeye devam ediyor (olayları sürüm 4'ün alt kümesi). `gorselId` alanı olmayan masum, baştan oynatmada tohum 1'le N. sıradaki görsele düşüyor.
- **Bilgi kutusu ve ayrıntı paneli** masumu görünüm adıyla gösteriyor ("Masum: Tüccar").

## 2026-10-21 — Savaş alanı düzeltmeleri (Görev F)

- **Yerleşim:**
  - Kurulumda GM herkesi (karakterler dahil) haritanın her geçerli altıgenine koyar: jetonu sürükleyip bırakarak ya da jetona, sonra altıgene dokunarak.
  - Geçersiz altıgenler: engel, lav, derin su, harita dışı ve dolu altıgen. Alev ve tuzak GM'in kararına bırakıldı.
  - Oyuncu bağlamı eskisi gibi yalnızca kendi bölgesine yerleştirir.
  - Varsayılan konumlar değişmedi. Bütün harita, varyant, aynalama ve masum kipleri eski ve yeni kodla karşılaştırıldı; konumlar birebir aynı. Denge simülasyonları varsayılanı kullanıyor.
  - Yerleşim zaten bir olaydı (`placed`), günlüğe girer. Kayıt biçimi değişmedi; eski kayıtlar açılıyor.
- **Masumlar:**
  - Hiçbir eylem yapmazlar; motor masumun `end_turn` dışındaki her komutunu reddeder. Yapay zekâ onlara tur vermez.
  - Sıraları uyuyan ejderha gibi atlanır. Sıra bir masumla başlıyorsa savaş başlarken atlanır.
  - Yerinde dururlar ve hasar alırlar. Tur başı etkileri (yanma gibi) sürer.
- **Masum jetonları:** `public/masumlar/masum-1..5.webp` şimdilik placeholder siluetler (köylü, çocuk, tüccar, yaşlı, kadın); gerçek görseller aynı adlarla değişecek. Liste `data/masum-jetonlar.json`'da.
  - Masumlara tohumla karışık atanır (`civilianArtSeed`). Arayüz her yeni savaşta rastgele bir tohum verir; simülasyon 1 kullanır.
  - Atanan görsel savaşın başlangıç olayında saklanır, yüklenen kayıtta değişmez. Savaşın kendi zarlarını tüketmez.
- **Eylem butonları:**
  - O an yapılamayan buton pasif: `aria-disabled`, tıklanmaz. Dokununca ya da üzerine gelince açıklamada nedeni görünür.
  - Eskiden "nedenli" butonlar tıklanabiliyordu (uyarı gösteriyordu): Gizlen, Yardım, Kalk, Atla, yakalanmışken Hareket. Saldır, İt ve İşaret/Silah menzilde hedef yokken tıklanabiliyordu.
  - Karakterin hiç yapamayacağı butonlar gösterilmez:
    - Büyü yalnızca büyüsü olan karakterde.
    - Atılım ve İkinci Soluk yalnızca Fighter'da. Hak bitince artık gizlenmiyor, nedeniyle pasif.
  - Kalk, Kaçmaya çalış, Çık, Çek ve Atla yalnızca durumu varken görünür (eskisi gibi).
- **Nefes kararı:**
  - Menüdeki "Nefes" butonu Dragonborn nefesi değil, Fighter'ın Second Wind özelliğiydi. Adı "İkinci Soluk" oldu.
  - Oyuncu Dragonborn'larının Breath Weapon'ı oyunda yok; bu yüzden hiçbir karakterde "Nefes" butonu yok.
  - Canavar nefesi ve yapay zekâ değişmedi.
  - Öneri: SRD 5.2.1 Dragonborn Breath Weapon (Attack eyleminde bir saldırının yerine, 15 ft koni ya da 30 ft çizgi, DEX save, 1d10 ve seviyeyle artan, uzun dinlenmeye kadar PB kez) ayrı görev olarak eklenirse "Nefes" butonu yalnızca Dragonborn'da görünür.
- **Hareket menüsü:**
  - Hareket butonu Yürü, Koş ve Geri Çekil alt menüsünü açar; "‹ Geri" ana menüye döner.
  - Üst seviyeden Koş ve Ayrıl kalktı. "Ayrıl" metni her yerde "Geri Çekil" oldu (buton, açıklama, günlük). Kod kimliği `disengage` aynı kaldı.
  - Koş ve Geri Çekil'in eylem kuralları aynı: eylem, Rogue'da bonus eylem.
- **Hedef seçimi:**
  - Saldır, Büyü, İt, Yardım, Çek ve İşaret/Silah kipinde seçilebilir hedefin altıgeni kırmızı dolguyla, kalın, kesikli ve yanıp sönen çerçeveyle işaretlenir. Jetonunda kesikli halka ve nişangâh simgesi var.
  - Seçilemeyen jetonlar soluk ve gri.
  - Renk körü için kalınlık, kesik çizgi ve simge de ayırt eder. Hareket azaltmada yanıp sönme yok.
- **Sonuç animasyonu:**
  - Hedefin (ya da zarı atanın) üstünde ~1 sn rozet çıkar:
    - saldırı: ✔ İsabet / ✔ Kritik / ✖ Iska;
    - kurtarma: ✔ Kurtardı / ✖ Kurtaramadı;
    - itme: ✔ Direndi / ✖ Yere düştü ya da İtildi;
    - yakalamadan kaçış, beceri kontrolü ve riskli atlama.
  - ✔ yeşil düz çerçeve, ✖ kırmızı kesikli çerçeve.
  - Hasar animasyonunun sistemini kullanır: yalnızca canlı olaylarda oynar, kayıt yüklenince oynamaz. Hareket azaltmada yalnızca metin görünür.
- **Denge:**
  - Masumlar kaçmayınca Taverna "4 masum ortada" %86'ya çıktı (sınırın 1 üstü).
  - 9 düşman yeri dolu olduğu için 1 Tough, Spy oldu. Sonuç %82 / %60 / %61 (`docs/harita/DENGE.md`).
- **Değişen test:** "GM karakteri yerleştiremez" testi artık GM'in yerleştirebildiğini sınıyor (istenen davranış).

## 2026-10-21 — Yakalama, Prone, hücum ve süreli hasar (Görev E)

- **Grappled (SRD 5.2.1):**
  - Hedefin hızı 0; yürüyemez, atlayamaz, ayağa kalkamaz. Durum süresiz, kendi kurallarıyla biter.
  - Kaçış: eylem (`escape_grapple`). d20 + Athletics ya da Acrobatics (yüksek olan) ≥ kaçış DC'si.
  - Yakalayan yürürse hedefi peşinden sürükler (yolun bir önceki altıgenine). Sürüklerken her adım iki kat hareket harcar (yarı hız). Hedefin yeri doluysa yakalama biter.
  - Yakalayan düşer, ölür, uyur ya da etkisiz (Incapacitated) kalırsa, ya da araya mesafe girerse (itme gibi) yakalama biter. Her komuttan sonra denetlenir.
  - "Until the grapple ends, the target has the Restrained condition" olanlarda Restrained da eklenir ve yakalamayla birlikte kalkar (Couatl, Salamander, Chain Devil, Crocodile, Giant Octopus, Kraken, Roc, Tarrasque).
  - Boyut sınırı ("Medium or smaller") uygulanır. Zaten yakalanmış hedef yeniden yakalanmaz.
  - Yapılmadı: yakalananın yakalayan dışındaki hedeflere dezavantajı; oyuncunun kendi yakalama eylemi; bir canavarın aynı anda tutabileceği hedef sayısı.
- **Prone:**
  - Ayağa kalkmak hızın yarısı kadar hareket harcar (`stand_up`, "Kalk" düğmesi). Yerdeyken yürümeye ya da atlamaya başlayınca kendiliğinden kalkar. Hareket yetmezse kalkamaz.
  - Önceden Prone kalıcıydı (kalkma yoktu).
  - Yakın saldırı avantajlı, uzak saldırı dezavantajlı, yerdekinin kendi saldırısı dezavantajlı (bunlar zaten vardı).
  - Rider'daki boyut sınırı ve kurtarma zarı uygulanır.
- **Hücum (charge):** 18 rider'da "X+ ft düz koşup hemen vurursa" var (2'si hasar değişimi: Goat, Giant Seahorse). Turdaki son düz koşu (`run`) en az X ft ve hedef koşu yönünde bitişikse tutar: ek hasar ve/veya Prone.
  - Görevdeki 23 sayısının rider dışındaki kısmı bonus eylem olarak duruyor: Troll ve Xorn "Charge", Sahuagin "Aquatic Charge", Centaur "Trampling Charge". Bunlar rider değil, uygulanmadı.
- **Süreli hasar:** `ConditionTimer.dot` alanı süreli durumun her tur başında hasar vermesini sağlar.
  - Pit Fiend Bite: Poisoned, save ends, tur başı 6d6 zehir.
  - Vrock Spores: tur başı 1d10 zehir.
  - Bearded Devil Infernal Glaive (CON DC 12) ve Horned Devil Infernal Tail: Infernal Wound, 1 dakika, tur başı 1d10 / 3d6.
  - Otyugh Bite: Poisoned 1 saat. Kalıcı HP azalması yok.
  - Hasar animasyonu (Görev D) bu hasarda da oynar.
- **Rider üretimi:** `scripts/riders-uret.cjs` metinden `data/attack-riders.json` üretir.
  - Elle yazılan `condition-effects.json` önceliklidir.
  - "Until the start/end of X's next turn", "for 1 minute/hour" ve "repeats the save" kalıpları süreli duruma çevrilir.
- **Sayılar (325 rider):**
  - 217 uygulandı (Görev C'de 109).
  - 31 kısmen, 16 süreli etki (elle).
  - 61 hiç uygulanmıyor. Nedenler (bir rider birden çok neden taşıyabilir):
    - süresi ayrıştırılamayan durum 26,
    - lanet 17,
    - özel metin 14,
    - hız ya da eylem kısıtı 12,
    - ikinci aşama 11,
    - itme/çekme 11,
    - HP eşiğiyle öldürme 8,
    - sürekli hasar 8,
    - özel hasar 7,
    - 0 HP'de tetiklenen 6,
    - yapışma/ele geçirme 4,
    - yutma 2.
- **Yapay zekâ:**
  - Yakalanan önce kaçmayı dener. Yerdeyken, hareketi yetiyorsa önce kalkar.
  - Yakalayan önce yakaladığına vurur.
  - Kaçın ve Yardım kullanılmaz.
- **Arayüz:**
  - Jetonda ✊ (yakalandı) ve ⤵ (yerde) simgeleri.
  - "Kaçmaya çalış" ve "Kalk" düğmeleri, açıklamalı. Yakalanmışken "Hareket" gerekçeyle kapalı.
- **Kayıt sürümü 3:** Yeni olaylar (`grappled`, `grapple_ended`, `grapple_escape`, `stood_up`) var. Sürüm 2 kayıtlar yüklenmez.
- **Denge:**
  - Yalnızca Düz aralık dışına düştü (%51). 4 Wolf yerine 2 Wolf ile %66.
  - Çöl %64'ten %57'ye indi, aralıkta.
  - Ayrıntı `docs/harita/DENGE.md`'de.
- **Değişen testler:**
  - Hill Giant Tree Club artık yere düşürüyor (multiattack olay listesi).
  - Wolf Bite Prone'u artık uygulanıyor; günlük örneği Wererat lanetine taşındı.
  - Buzda kayan karakterin hata metni değişti: yürümeden önce kalkmak gerekiyor.
  - Düz XP'si 1800'den 1700'e indi.

## 2026-10-21 — Tur başı hasar animasyonu, jetonlar tam ortada (Görev D)

- **Motor incelemesi:** Tur başı ve sonu hasar veren durumlar zaten vardı. Hepsi `map_effect` olayı üretir; hasar `damage.applied`, türü `damage.type`'ta.
  - Burning: tur başı ateş, sonra DEX save ile söner.
  - Lav kenarı: tur başı ateş.
  - Batak: tur başı zehir ve süren batak zehri.
  - Alevde turu bitirme (ateş), kavurucu sıcak (ateş), dondurucu soğuk (soğuk).
  - Spirit Guardians'ın tur sonu hasarı `save_resolved` + `aura`.
  - `condition-effects.json`'daki durumlar hasar vermez.
- **Animasyon** (`src/ui/damageFloats.ts`, yalnızca arayüz):
  - Bu olaylardan jetonun üstünde ~0,9 sn tek seferlik animasyon ve hasar sayısı (-N):
    - ateş 🔥 (yükselir, titrer),
    - zehir ☠ (baloncuk),
    - soğuk ❄ (kristal),
    - asit 💧 (damla),
    - diğer türler kırmızı -N.
  - Birden çok jetonda aynı anda olursa 220 ms arayla sırayla.
  - Yalnızca canlı gelen yeni olaylarda oynar. Kayıt yüklenince eski olaylar oynamaz (tarayıcıda doğrulandı).
  - Hareket azaltmada yalnızca sayı ve simge. `pointer-events: none`.
- **Kalıcı simgeler:** Yanıyor 🔥 (Burning), zehirli ☠ (Poisoned ya da batak zehri). Oyunda "donmuş" durumu yok; `Frozen` eklenirse ❄ gösterilir.
- **Jeton merkezi:** Resimlerdeki figür iki eksende de ortalı (en çok %0,2). Kayma iki kaynaktan geliyordu:
  - Nefes animasyonu alt-ortadan ölçekliyordu (`transform-origin: 50% 90%`); figür nefeste yukarı kayıyordu (PC'de ejderha 3,2 px, Tiny 0,3 px).
  - Zemin gölgesi aşağı kaydırılmıştı (4–6 px).
  - Nefes artık merkezden ölçekleniyor, gölge simetrik. Ölçüm: PC, dar telefon ve yatay telefonda, animasyon açıkken, Tiny'den Gargantuan'a ve 4 ırk ölçeğinde fark en çok 0,03 px.

## 2026-10-21 — Canavar saldırı ek etkileri (rider) uygulanıyor (Görev C)

- **Veri:** `data/attack-riders.json` (monsters.json'a dokunulmadı; metinden tek seferlik betikle yapılandırıldı). Canavar verisiyle birlikte tembel yüklenir.
  - `extra`: her isabette ek hasar; kritikte zarlar ikiye katlanır; hedefin direnç ve bağışıklığı uygulanır.
  - `conditional`: avantajlı isabette ek hasar (Goblin Warrior, Goblin Boss).
  - `replace`: koşul tutarsa hasar ifadesi değişir: avantajlı Chimera, Bloodied (yarı canın altında) sürüler, Bloodied hedefe Blood Hawk.
  - Süreli durumlar `condition-effects.json`'da kaldı. Aynı saldırıda hem ek hasar hem durum varsa (Wyvern +7d6 poison ve Poisoned) ikisi de birer kez uygulanır.
- **Sayılar:**
  - 236 canavarın 325 saldırısında rider var.
  - Tam uygulanan: 109 ek hasar + 13 süreli etki.
  - Kısmen: 35 (hasar uygulanıyor, kalan metin uygulanmıyor).
  - Hiç uygulanmayan: 168.
  - Uygulanmama nedenleri:
    - durum etkisi `condition-effects.json`'da tanımlı değil: 45
    - Grappled: 39
    - Prone: 29
    - özel metin: 24
    - hücum (20 ft düz koşu) izlenmiyor: 23
    - lanet ya da kalıcı etki: 18
    - hız/eylem kısıtı: 12
    - sürekli hasar (her tur): 7
    - itme: 3
    - HP eşiğiyle öldürme: 3
  - Kurtarma zarlı ek hasarların üçü de (Pit Fiend, Bearded Devil, Otyugh) her tur süren hasar; uygulanmadı.
- **Günlük:** Uygulanan ek hasar "ek necrotic: …" diye yazılır. Uygulanamayan kısım "ek etki uygulanmadı (neden): metin" diye yazılır.
- **Kayıt sürümü 2 kaldı:** Olay biçimi değişmedi; `attack_resolved.extra` zaten vardı.
- **Denge:**
  - 6 senaryo aralık dışına düştü; ortam listesinden yeniden kuruldu (DENGE.md).
  - Wyrmling %88 kabul edilen sapma (iki deneme).
  - Şans kipi ve Wyrmling'te Harpy yerine Volkan canavarları.
- **Yapay zekâ:** Davranışı değişmedi; Kaçın ve Yardım'ı kullanmıyor.

## 2026-10-16 — Durum süreleri; Kaçın (Dodge) ve Yardım (Help); Hazırla (Ready) önerisi

**Durum süreleri** (`src/battle/durations.ts`):
- **Biçim:**
  - `Combatant.conditions` (durum adları) kaldı; kural, arayüz ve yapay zekânın hepsi onu okuyor.
  - Süre yanında: `conditionTimers: ConditionTimer[]` (`condition`, `ownerId`, `end: turnStart|turnEnd`, `count`, isteğe bağlı `save`).
  - Durum hangi yolla kalkarsa kalksın (konsantrasyon, iyileşme, Burning), sayacı da düşer (`pruneTimers`).
- **Süre türleri:**
  - Belirli tur sayısı (`count`).
  - "Sahibinin sonraki turunun başına dek" (`turnStart`, `count` 1).
  - "Sonraki turunun sonuna dek" (`turnEnd`; sahibi şu an sıradaysa bu turun sonu sayılmaz, `count` 2).
  - "Save ends": hedef her kendi turunun sonunda yetenek ve DC ile kurtarma zarı atar.
  - Süresiz: sayaçsız durum, eskisi gibi.
- **Kancalar:**
  - Sırası biten savaşçının tur sonu ve sırası gelenin tur başı sayaçları işler.
  - Atlanan (ölü, uyuyan) savaşçının tur sonu da sayılır; sahibi ölen etki takılı kalmaz.
- **Yeni olaylar:**
  - `condition_timer`: sayaç azaldı.
  - `condition_save`: kurtarma zarı.
  - `condition_ended`: durum bitti; nedeni "süre doldu" ya da "kurtarma zarı başarılı".
  - `condition_changed` olayına isteğe bağlı `timer` alanı.
- **Etki tanımları:** `data/condition-effects.json`. `monsters.json` ve `spells.json` değişmedi.
  - **Canavar saldırıları (15):**
    - Wyvern Sting: Poisoned, wyvernin sonraki turunun başına dek.
    - Ghoul ve Ghast Claw: CON DC 10, Paralyzed, hedefin sonraki turunun sonuna dek.
    - Mummy Dreadful Glare: Frightened.
    - Ettercap Bite: Poisoned.
    - Giant Vulture Gouge: Poisoned.
    - Merrow Bite: Poisoned.
    - Homunculus Bite: CON DC 12, Poisoned.
    - Lion Roar: Frightened.
    - Quasit Scare: Frightened, save ends.
    - Dretch Fetid Cloud: Poisoned.
    - Otyugh Tentacle Slam: Stunned.
    - Vrock Stunning Screech: Stunned.
    - Giant Spider Web ve Ettercap Web Strand: Restrained, her tur sonu STR save (yaklaşık; SRD'de ağ kırılana dek).
  - **Büyüler ("save ends", en çok 10 tur):** Hold Person, Hideous Laughter, Blindness/Deafness, Fear (yaklaşık), Entangle ve Web (STR save, yaklaşık). Konsantrasyon bağı ayrıca sürer.
  - **Yapılmayanlar:**
    - 1 saat ya da 1 dakika süren ve "0 HP'de" tetiklenen zehirler (Pseudodragon, Phase Spider, Vampire Familiar).
    - Grappled (kaçış DC'si; süre değil) ve Prone (anlık).
    - Saldırıların ek hasar metinleri (`rider`), uygulanmıyor.
- **Değişen test:** `monsters.test` "hasarsız save saldırısı (Web)" artık Restrained'in uygulandığını da bekliyor (önceden "etkisi elle uygulanır" idi).
- **Kayıt sürümü 2:** Eski kayıtlar "yüklenemedi".

**Kaçın (Dodge):**
- Eylem; `Dodge` durumu, sonraki turunun başına dek.
- Saldıranlar dezavantajlı (görünmez saldıran hariç). DEX save'leri avantajlı (`saveMode`, bütün save noktalarında).
- Etkisizken (incapacitated) ya da hızı 0 iken (Grappled, Restrained) işe yaramaz.

**Yardım (Help):**
- Eylem; bitişik bir düşman seçilir (haritasız savaşta mesafe yok). Düşmana `Help:<taraf>` işareti konur.
- O tarafın o düşmana ilk saldırısı avantajlı; işaret saldırıda kalkar.
- Kullanılmazsa yardım edenin sonraki turunun başında biter.
- Görev metni "senin turunun sonuna kadar" diyordu; SRD 5.2.1'deki gibi "sonraki turunun başına dek" uygulandı, çünkü müttefikler yardım edenin turu bittikten sonra oynuyor.

**Yapay zekâ:** Kaçın ve Yardım'ı kullanmıyor. Saldırmaktan iyi olduğu durumlar dar, ve denge ölçümleri karşılaştırılabilir kalsın. Oyuncu ve GM elle kullanabilir.

**Öneri — Hazırla (Ready), uygulanmadı:**
- **Komut:** `ready { actorId, trigger, response }`. Eylem harcar, tepki (reaction) ayırır; sonraki turunun başında biter.
- **Tetikleyiciler (ilk sürüm):**
  - `enemyEntersReach`: bir düşman erişimime girerse.
  - `enemyEndsMoveInRange`: menzilimdeki bir düşman hareketini bitirirse.
  - `allyAttacked`: belirli bir müttefike saldırılırsa.
- **Yanıtlar:**
  - Tek saldırı (Attack eyleminin bir saldırısı, Extra Attack yok).
  - Yürüme (hızın kadar).
  - Hazırlanan büyü: slot hemen harcanır, konsantrasyon gerekir.
- **Uygulama:** Hareket ve saldırı komutlarından sonra (fırsat saldırısının yanında) `readyTriggers(state, events)`. Tetiklenince tepki harcanır. Yapay zekâ ilk sürümde kullanmaz.

## 2026-10-16 — Savaşı kaydet/yükle; canavar verisi tembel yüklenir

**Kaydet/yükle** (`src/app/battleSave.ts`):
- Tek kayıt yuvası (`localStorage`, anahtar `rpg-battle-save`).
- Yalnızca olay günlüğü saklanır: `{ version: 1, savedAt, events }`. Yüklerken olaylar baştan oynatılır (`replay`) ve aynı durum çıkar.
- Bütün mevcut senaryolarda günlük oynatılınca kurulumda ve oyun sırasında aynı durumun çıktığı kontrol edildi.
- Kayıt ne zaman yazılır:
  - Otomatik: her tur (round) değişiminde ve savaş bitince.
  - Elle: savaş menüsünde (≡) "Kaydet"; aynı menüde "Yükle".
  - Ana ekranda kayıt varsa "Kayıtlı savaşa devam et".
- Bilinmeyen sürüm, bozuk JSON, boş ya da oynatılamayan günlük hata fırlatmaz; "Kayıt yüklenemedi: …" mesajı gösterilir.
- Testler: kaydet → yükle → aynı durum ve aynı günlük; yüklenen savaş aynı komutla aynı yere gider; bozuk ve eski kayıtlar.

**Canavar verisi tembel** (`src/data/index.ts`):
- `monsters.json` (~480 KB) dinamik import ile ayrı parçada (build: ~320 kB, gzip 44 kB). Ana parça ~474 kB, büyük parça uyarısı gitti.
- Nasıl yüklenir:
  - `monsters` aynı dizi nesnesi, `loadMonsters()` içini doldurur.
  - Yüklenmeden `getMonster` "henüz yüklenmedi" hatası verir.
- Kim yükler:
  - Uygulama: yalnızca GM ekranına ya da savaşa girilince yükler; o sırada "Canavarlar yükleniyor…" gösterir. Ana ekranda yüklenmediği gerçek build'de doğrulandı.
  - Testler: `src/test-setup.ts` (vitest `setupFiles`).
  - Simülasyon betikleri: en üstte `await loadMonsters()`.

## 2026-10-16 — Eylem düğmesi açıklamaları

- Eylem menüsündeki her düğmenin kısa Türkçe açıklaması var (`src/ui/actionHints.ts`).
  - PC'de fareyle üzerine gelince, telefonda uzun basınca (450 ms) çıkar.
  - Uzun basış tıklama sayılmaz, eylemi çalıştırmaz.
  - Kullanılamayan düğmede neden de yazılır ("Şu an kullanılamaz: …").
- Devre dışı düğmeler artık `disabled` değil `aria-disabled`: Chrome devre dışı düğmede fare ve dokunma olaylarını iletmediği için açıklama gösterilemiyordu. Tıklama yine işlemez, görünüm aynı.
- Üst kenara yakın düğmede açıklama düğmenin altında gösterilir.

## 2026-10-16 — Adım 11 son tur: hedef aralık %55–85, Mağara ve Dungeon rosterleri

- **Hedef aralık:** normal senaryolarda %55–85; ejderha senaryolarında %60–80 kalıyor.
- **Mağara** (4100 XP): Troll, 2 Giant Spider, Ghoul, Darkmantle, Ettercap, Ogre, Phase Spider → %63.
- **Dungeon Koridor** (8400 XP, 14 düşman): 2 Wight, 2 Bugbear Stalker, 2 Mummy, 2 Ghast, 2 Ghoul, 2 Bugbear Warrior, Minotaur of Baphomet, Wraith → %58.
- **Dungeon Hazine odası** (7750 XP, 12 düşman) → %69.
- **Durum:**
  - Bütün normal senaryolar aralıkta.
  - Taverna "4 masum ortada" %86 (kabul edilen sapma, +1).
  - Merdiven %85, sınırda.

## 2026-10-16 — Adım 11: senaryo düşmanları ortam listesinden; altıgen bilgi kutusu

**Senaryolar** (`src/sim/balance.ts`; ayrıntı DENGE.md):
- Düz, Çöl, Volkan normal, Orman, Mağara, Dungeon (3), Kale ve Taverna (3) düşmanları kendi haritasının `monster-ortamlari.json` listesinden kuruldu. Düz için `duz-zemin`.
- Ejderha senaryolarına dokunulmadı. Canavar verisi ve ortam dosyası değişmedi.
- En çok 2 deneme.
  - Hedefte: Düz %69, Çöl %72, Orman %63, Taverna uzakta %71 / %67.
  - Kabul edilen sapma: Volkan %81, Merdiven %85, Kale %56, Taverna ortada %86, Hazine %95, Koridor %97, Mağara %98.
- Taverna'nın 3 senaryosu aynı düşman listesiyle; fark yalnızca masum yerleşiminden.
- `balance.test`: Düz XP beklentisi yeni rostere göre 1800.

**Altıgen bilgi kutusu:**
- Genişlik `min(40vw, kenar boşluklu)`; metin satır kaydırır, kesilmez.
- Telefon yatay ve PC'de kontrol edildi.

## 2026-10-16 — Jeton boyut ölçekleri (data/token-sizes.json)

- **Ölçekler JSON'da:** Tiny 0.3, Small 0.5, Medium 1, Large 1.5, Huge 2, Gargantuan 3.
  - 1, önceki Medium jeton boyu.
  - Oyuncu karakterleri ırka göre (aynı JSON, `race`): halfling 0.5, gnome 0.5, dwarf 0.75, human 1, elf 1, tiefling 1, celestial 1.05, orc 1.2, dragonborn 1.25, goliath 1.4. Tabloda olmayan ırk ve masumlar 1.
  - Mekanik boyut değişmez: karakter yine tek altıgen. Irk, `Combatant.raceId` olarak karakter sayfasından gelir; eski kayıtlarda yoksa 1.
  - Tıklama, çizim sırası, HP çubuğu ve merkez sabitleme kuralları karakterler için de aynı. 1'den küçük ölçekli jetonlar (halfling, gnome, dwarf) güçlü silüet parıltısını alır.
  - Eski `SIZE_SCALE` sabiti ve ejderhaya özel `tokenScale` (varyant JSON'u ve Combatant alanı) kaldırıldı; ejderha da boyut sınıfıyla çiziliyor (Young Large 1.5, Adult Huge 2, Ancient Gargantuan 3).
- **Merkez sabitleme** (önceki "ayak sabitleme"nin yerine; küçük jetonlar altıgenin altında kalıyordu):
  - Bütün jetonlar (karakter ve canavar, her boyut) altıgen merkezinde yatay ve dikey ortalı; büyük jeton merkezden her yöne eşit büyür.
  - Dikey ortalama görünen figürün sınırlarına göre doğrulandı: 590 resimde (240 karakter, 350 canavar ve uyku) saydam olmayan piksellerin dikey merkezi resim merkezinden en çok %0.2 sapıyor. Ayrı bir kaydırma değeri gerekmedi.
  - Nefes animasyonunun merkezi figürün alt-ortası (50% 90%); ortalı jetonda ayaklar yerinde kalıp gövde kabarıyor, merkezden ölçeklemeden daha doğal.
  - Zzz rozeti figürün tepesine göre (merkez − yarı yükseklik).
- **Tıklama:** Her jetonun yalnızca kendi altıgenindeki saydam daire. Bu daireler bütün jetonların üstündeki ayrı katmanda (`.token-hits`), böylece büyük jetonun figürü komşu altıgeni kapatmıyor.
- **Çizim sırası** (`drawOrder`, `src/ui/tokenSize.ts`):
  - Ekranda daha aşağıdaki jeton üstte.
  - Daha büyük bir jeton taşma menzilinde (Large ve Huge 1, Gargantuan 2 altıgen) bir küçük jetonun üstüne binecekse, küçük olan ondan sonra çizilir.
- **HP çubuğu, Zzz ve durum işaretleri sabit boyda, altıgene bağlı.** Bu seçim daha okunur:
  - Gargantuan'da çubuk komşu jetonların çubuklarına binmiyor.
  - Tiny'de 0.3'e küçülüp okunmaz olmuyor.
  - Zzz rozeti figürün tepesine yakın ama sabit boyda.
- **Parıltı:** Sıra ve takım parıltısı figürün silüetinde drop-shadow olarak kalıyor (piksel cinsinden, ölçekle küçülmüyor).
- **Tiny ve Small için asgari parıltı:** `tiny` sınıfına daha güçlü takım parıltısı verildi; figürün kendisi 0.3 kalıyor.
- Nefes animasyonu ve saydam jetonlar değişmedi.

## 2026-10-16 — Volkan: Wyrmling 2 Wyvern, şans kipi varsayılanı %2

- Wyrmling sim eşlikçisi 2 Wyvern (Harpy yok); `dragonWake: chance` varsayılanı %2 (JSON ve kod yedeği).
- 200 tohum: Wyrmling %76, şans kipi %60. Bütün ejderha seçenekleri %60–80 içinde; ikinci deneme gerekmedi.

## 2026-10-16 — Volkan: Wyrmling Wyvern + 3 Harpy, şans kipi varsayılanı %5

- Wyrmling sim eşlikçisi Wyvern + 3 Harpy; `dragonWake: chance` varsayılanı %5 (JSON ve kod yedeği).
- 200 tohum: Wyrmling %89, şans kipi %49; ikisi de %60–80 dışında. Yeni öneriler DENGE.md'de (2 Wyvern; %2), uygulanmadı.

## 2026-10-16 — Buzul ortamı Dağ'a katıldı; Volkan ejderha eşlikçileri

**Canavar ortamları:**
- `data/monster-ortamlari.json` içinde `buzul` ortamı `dag` oldu (25 canavar; 9'unda `dag` zaten vardı, tekrar eklenmedi).
- Bu 25 canavar `"kis": true` ile işaretlendi. Birleştirmede kaybolmasın diye eklendi.
- `docs/CANAVAR-KATEGORILERI.md`: Buzul dağı bölümü kaldırıldı, Dağ geçidi aynı üretim sırasıyla 88 canavar.
- Test: her ortam kimliği gerçek bir harita ya da `duz-zemin` olmalı (`envProblems`); bilinmeyen kimlik hata listesine düşer.
- Kurulum ekranı: Dağ'ın kış varyantı seçiliyken `kis` canavarları her güç kademesinin başında ve ❄ işaretli. Yaz varyantında sıra değişmiyor.

**Volkan ejderha (DENGE.md):**
- Adult Red eşlikçisi Wyvern + 2 Harpy, Wyrmling 2 Wyvern + 2 Harpy (sim senaryosu).
- `dragonWake: chance` varsayılanı %10 (JSON ve kod yedeği).
- 200 tohum sonuç: Young %70, Adult %66, Ancient %66 aralıkta; Wyrmling %53 ve şans kipi %35 altında. Yeni öneriler yazıldı, uygulanmadı.

## 2026-10-16 — Canavar ortamları ve güç kademeleri; uyuyan ejderha teşhisi, Ancient Red

**Canavar ortamları (`data/monster-ortamlari.json`, `docs/CANAVAR-KATEGORILERI.md`):**
- Kullanıcıdan geldi; `monsters.json` ile doğrulandı.
  - 330 kayıt, kimliklerin hepsi eşleşiyor.
  - Dört CR yanlıştı, gerçek değerle düzeltildi: Pirate 1/8 → 1, Spider 1/4 → 0, Swarm of Crawling Claws 1/2 → 3, Troll Limb 1 → 1/2.
  - MD'deki kademe listeleri ve tema aralıkları buna göre güncellendi; başka satır değişmedi.
  - Ad farkları yalnızca yazım: Saber-Toothed Tiger, Will-o’-Wisp, Half-Dragon.
- GM kurulumu, Düşmanlar listesi:
  - Varsayılan olarak seçili haritaya uyan canavarlar gösteriliyor, güç kademelerine ayrılmış (Ufak 0–½, Orta 1–3, Güçlü 4–8, Boss 9–14, Efsanevi 15+), CR ve ada göre sıralı.
  - "Tüm canavarlar" kutusu 330 canavarın hepsini açıyor.
  - Seçili canavarlar ve özel canavarlar her zaman listede; arama mevcut kapsamda çalışıyor.
  - Kademe `monsters.json` CR'ından hesaplanıyor (`src/data/monsterEnv.ts`).
- `buzul` (Buzul dağı) ortamının haritası yok. Bu canavarlar yalnızca diğer ortamlarında ya da "Tüm canavarlar"da görünüyor. `duz-zemin` haritasız savaş için.

**Uyuyan ejderha:**
- Teşhis için `src/sim/ejderTeshis.ts` yazıldı. Ölçülenler: uyanma turu, uyanık tur, hasar, düşürme, nefes kullanımı, hedefe varma, uyumadan bitme.
- Sebep ejderhanın yapay zekâsı değil:
  - Uyanınca uçarak hedefe varıyor ve nefes kullanıyor.
  - Savaşların çoğu ejderha uyanmadan bitiyor.
  - Adult'un %97'si zayıf eşlikçiden (3 Harpy); Wyrmling'in %95'i güçten.
- Savaş gürültüsü uyanma kuralı denendi; ejderhalar hep uyanıp parti %0–8 kazandığı için geri alındı.
- Ejderha seçeneklerine Ancient Red Dragon eklendi (Young, Adult, Wyrmling'in yanında); sim senaryosu `volkan-ejder-ancient` (Wyvern + 2 Harpy) %66.
- Eşlikçi önerileri DENGE.md'de, uygulanmadı.

## 2026-10-16 — Eski Volkan kaldırıldı, "Volkan Adaları" artık "Volkan"; saydam jetonlar

**Harita:**
- Eski `data/maps/volkan.json` ve tek kullanıcısı olan `public/maps/harita-volkan.webp` silindi.
- `volkan-adalar.json` → `volkan.json`: kimlik `volkan`, ad "Volkan". Varyantlar `normal` ve `uyuyan-ejderha`. Görsel adı `harita-volkan-adalar.webp` olarak kaldı.
- Eski kimlikler: `volkan-adalar` → `volkan` (`MAP_ALIASES`).
  - `resolveMapChoice`: bilinmeyen harita kataloğun ilk haritasına (Ada), bilinmeyen varyant haritanın ilk varyantına düşer; çökmez.
  - Eski "volkan" kaydı (`varsayilan` varyantı) yeni haritanın `normal` varyantını açar.
  - Kayıtlarda (localStorage) harita kimliği tutulmuyor; bu yalnızca güvenlik ağı.
- Eski Volkan düzenine bağlı testler `src/map/fixtures/eskiVolkan.ts` fikstürüne taşındı (katalogda değil; `vi.mock` ile yalnızca "eski-volkan" kimliği).
  - `movement.test.ts`: yerleştirme, kurulum ve hareket testleri.
  - `maps.test.ts`: sütun aralığıyla 16/16 başlangıç, hatalı harita doğrulaması, `tileAt`.
  - Assertion'lar değişmedi.
  - "bilinmeyen varyant reddedilir" testi yeni davranışa çevrildi: düşme ve eski kimlik eşlemesi sınanıyor.
  - Diğer harita testleri (jumprisk, maprules, ai, cover, range, forced, stealth, dragon) zaten kendi zeminini (`board`, `tiles`) veriyordu; değişmedi.
- Sim: Volkan ölçümleri yeni haritada (DENGE.md). Ejderha senaryolarının eşlikçileri ve canavar verisi değişmedi.

**Saydam jetonlar:**
- Resimli jetonda arka plan dairesi, kırpma ve halka yok; yalnızca pixel-art figür (`.fig`).
  - Takım: silüete ince drop-shadow parıltısı (parti mavi, düşman kırmızı) ve altında ince koyu kontur, böylece koyu ve açık haritada okunuyor.
  - Sıra, hedef, seçili ve seçilebilir durumları daha güçlü silüet parıltısı. Uyuyan jeton biraz soluk.
- Resimsiz (baş harfli) jeton daire ve halkasını koruyor.
- Can çubuğu, Zzz, nefes animasyonu ve boyut ölçeği aynı.
- Tıklama: her jetonda jeton boyunda saydam `.hit` dairesi (büyük ejderhada yalnızca kendi altıgeni). Figürün kutusu tıklamayı yutmuyor.
- Volkan, Çöl ve Şehir Meydanı'nda ekran görüntüsüyle kontrol edildi.

## 2026-10-16 — Yeni harita "Volkan Adaları" (`volkan-adalar`; sonra `volkan` oldu, yukarıya bkz.); bilgi kutusu

**Harita:**
- `data/maps/volkan-adalar.json`, 15×7, flat-top, odd-q, 5 ft.
  - Zemin ve başlangıç bölgeleri görev metninden: oyuncular sol adada, düşmanlar sağ adada, 10'ar altıgen. `mirrorable: true`.
  - Biçim, ortam (`volkan-lav`), kurallar ve efektler eski Volkan'dan kopyalandı: lav ölümcül (uçan hariç), lav kenarı sıcak dalgası, patlama, lav yükselmesi, ada bazlı `lavJump` (`jumpTargets`).
- Üç büyük ada, aralarında 2 sütun lav. Altı adacık: (5,1)+(5,2), (11,1)+(11,2), (4,7)+(5,7), (11,7)+(12,7), (9,1), (8,7).
- Testler:
  - Bağlı kara parçaları tam olarak 3 büyük ada + bu 6 adacık; hiçbir adacık başka karaya bitişik değil.
  - Yürüyerek adalar arasında geçiş yok.
  - Sol adanın içinden orta adaya ve adacıklara atlanır; sağ adaya doğrudan atlanamaz (orta ada hattı keser).
  - Lavın karşısına büyü atılır.
- **Varyantlar:**
  - `normal`: ejderhasız.
  - `uyuyan-ejderha`: eski Volkan'ın ejderha ayarlarıyla aynı (Young varsayılan; Adult, Wyrmling; `dragonWake` never/chance/gm; GM düğmesi). Ejderha (8,3) kraterinde.
  - Ancient Red seçeneği "ileride" olarak bırakıldı.
- Eski `volkan` haritası aynen kaldı; listede ayrı "Volkan Adaları" görünüyor.
- **Görsel ve yerleşim:**
  - `public/maps/harita-volkan-adalar.webp` kullanıcıdan geldi. Harf overlay'i görselle örtüşüyor: üç ada, krater (H) ve altı adacık doğru yerde.
  - `npm run check:harita` 160 kontrol, 0 hata.
  - `docs/harita/ornek/volkan-adalar.yerlesim.json` görev metninden üretildi; orijinal yerleşim dosyası gelmedi.

**Bilgi kutusu:** Altıgen bilgisi sağ alttan sağ üste (sıra şeridinin altına) alındı. Gövdesi tıklamayı yutmuyor, yalnızca ✕ tıklanıyor. Önceden fareyle bir altıgenin üstünden geçince "Düşmanı oynat" düğmesini kapatıyordu.

## 2026-10-16 — Volkan: ada atlaması yeniden (basit model, `jumpTargets`)

**Teşhis (`src/sim/volkanTeshis.ts`):**
- Karakterler adalarının içinden başlıyor. Önceki kural, atlayanın kendi adasının karasını da engel sayıyordu; adanın içinden hiçbir adaya atlanamıyordu (31 hedef "düz hat yok").
- Kenara yürünen tur da atlanamıyordu, çünkü atlama hareketin yerine geçiyor. Sonuçta karakterler adada bekliyor, düşmanlar geliyordu.

**Kural (kullanıcı):**
- Hedef, atlayanın adasından farklı bir adanın boş kara altıgeni.
- Kalkıştan hedefe düz hex hattında:
  - lav altıgenleri sayılır, DC = 10 + 2 × (lav − 1);
  - kalkış adasına ve hedef adaya ait kara altıgenleri sayılmaz ve engel olmaz;
  - üçüncü bir adaya ait kara ya da kaya hattı keser: o hedef geçersiz, adayı atlayıp ileri gidilemez.
- Hat yalnızca zemine bakar; yaratık hattı etkilemez. Düşmanlı adaya atlanır, dolu altıgene inilmez.
- Değişmeyenler: her atlama ayrı zar atar, doğal 1 lava düşürür, başarısızlık sonuçları aynı. Uçan zarsız, ama aynı hat kuralı geçerli. Atlama hareketin yerine geçer: bu tur yürünmemiş olmalı, tüm hareketi harcar.
- **Tek kaynak:** `jumpTargets(state, unit)` (`src/battle/jumprisk.ts`). Atla kipindeki turuncu altıgenler ve yapay zekânın atlama adayları bundan gelir; komut aynı `lavaLine` kuralıyla doğrular. Altıgenin üzerine gelince "DC X, N lav hex, doğal 1: %5 lava düşme" yazar.
- **Yapay zekâ:**
  - Düşük başarı şansında (güvenli iniş < %60) ve HP %40 ve altındayken atlamaz.
  - Uyuyan ejderhanın yanına (herkes) ya da Algı menziline (parti) atlamaz. Bu olmadan parti orta adaya atlayıp ejderhayı uyandırıyordu: Young %33, Adult %46.
- **Ölçüm:** DENGE.md. Eşlikler: Adult 3 Harpy, Wyrmling Wyvern + 2 Harpy.

## 2026-10-16 — Karakter jetonları (pixel art)

- **Resim:** Karakter jetonu, oluşturucu önizlemesi, sıra şeridi ve profil aynı resmi gösterir: `public/characters/<ırk>-<male|female>-<sınıf>.webp` (10 ırk × 2 cinsiyet × 12 sınıf = 240, 256×256 saydam WebP).
- **Cinsiyet:** Oluşturucuda zaten vardı (Erkek/Kadın; kayıtta `erkek`/`kadin`). Dosya adında `male`/`female` olur. Cinsiyeti olmayan eski kayıtlar erkek (`male`) sayılır.
- **Dosya adı tek yerde:** `characterTokenFile(ırk, cinsiyet, sınıf)` (`src/battle/create.ts`). Dosya adı kodda başka biçimde kurulmaz. 240 dosya testi de adları bu fonksiyonla, koddaki ırk × cinsiyet × sınıf listesinden üretir. Geçici boş dosyalarla denendi: 240'ı varken geçiyor, biri eksikken o adı yazarak düşüyor.
- **Yedek zinciri:** `characters/...` → eski `avatars/<ırk>-<sınıf>-<cinsiyet>.webp` → ırk renkli, baş harfli rozet. Uyuyan yaratıkta zincirin başına uyku resmi eklenir.
- **Tembel yükleme:** Görsel yalnızca ekranda gösterilen avatar için, gerektiğinde yüklenir ve önbelleğe alınır. Oyunda olmayan karakterlerin resmi indirilmez.
- **Görünüm:**
  - Karakter resimleri karşıdan çizili; canavarlardaki "karakterlere dön" aynası onlara uygulanmaz.
  - Bütün jeton resimleri (karakter ve canavar) hafifçe "nefes alır" (CSS, 3.2 sn); hareket azaltma tercihinde kapalı.
  - Boy: karakterler hep Medium ölçeğinde, ırk boyu resimde çizili. Canavarlarda dairenin içinde küçük boy farkı var (Tiny 0.7, Small 0.85, Medium 1, Large 1.1, Huge 1.15, Gargantuan 1.2). Büyük ejderha `tokenScale` ile ayrı.
- **Irk kimliği:** `celestial`. Veride, arayüzde ve testlerde "Aasimar" geçmiyor (testle denetleniyor); göç gerekmedi.
- **Testler:**
  - Dosya adı kuralı, cinsiyetsiz kaydın `male` olması, yedek zinciri (resim yok → eski yol → rozet).
  - 240 dosyanın hepsi: `public/characters` depoya eklenince etkin, şimdilik klasör boş olduğu için atlanıyor.
- **Lisans notu:** Karakter (ve canavar) jeton resimleri Gemini ile üretildi. Mağaza yayınından önce ticari kullanım şartları kontrol edilecek. SRD 5.2.1 atıf metinlerine dokunulmadı.

## 2026-10-16 — Kurulum: varyantlar hep görünen düğmeler

- Kullanıcı Volkan'da "Uyuyan ejderha" seçeneklerini göremedi. Varyant seçici açılır listeydi; kapalıyken yalnızca seçili varyant ("Volkan") görünüyordu ve ejderha ayarları yalnızca "Uyuyan ejderha" seçilince çıkıyor. Varyantın varlığı gözden kaçıyordu.
- Varyantlar artık hep görünen radyo düğmeleri (`role="radiogroup"`, aria-label "Varyant"). Ejderhalı varyantta 🐉 işareti var.
- Kara ekran kontrolü ve UI testi yeni seçiciye göre güncellendi.
- Büyük jeton (ejderha) saydam: arka plan dairesi ve dairesel kırpma yok, resim (zaten saydam WebP) gölgeyle çizilir. Halka yalnızca sırası gelince, hedefken ya da seçilebilirken görünür.

## 2026-10-16 — Volkan: ada atlaması ada bazlı; kurulum ekranı UI testi

**Atlama (kullanıcının kuralı, "yalnızca ilk karaya" kuralının yerine):**
- Hedef, atlayanın adasından farklı bir adada olmalı. Aynı adaya lav körfezi üstünden atlanmaz, yürünür.
- Atlayandan hedef adanın en az bir altıgenine, arası yalnızca lav olan düz bir hat bulunmalı: hattın ilk karası hedef adadan.
- Başka bir adanın (ya da atlayanın kendi adasının) üstünden geçilmez. İki adayı atlayıp üçüncüye geçmek yasak; ada içinden atlanmaz, önce kenara yürünür.
- Hat yalnızca zemine bakar: kenardaki altıgende duran düşman ya da başka yaratık hattı kesmez.
- Hedef adanın herhangi bir boş altıgenine inilir, düşmanın bulunduğu ada da dahil. Dolu altıgene inilmez.
- DC = 10 + 2 × (lav − 1).
  - Lav sayısı, hedef altıgene giden düz hat temizse onun ilk karaya kadarki lavı.
  - Değilse (ör. kaya kesiyorsa) hedef adaya en az lavla ulaşan temiz hattın lavı. Adanın içindeki kara sayılmaz.
- Değişmeyenler: uçanlar zarsız, `foeIsland: allow`, hareketin yerine geçme. Yapay zekâ kuralları aynı; her atlamada doğal 1 riskini hesaba katıyor.
- Ada başına en kısa temiz hat, durum başına önbellekte tutuluyor.

**Kurulum ekranı (uyuyan ejderha seçenekleri görünmüyor bildirimi):**
- Kodda varyant listesini süzen bir koşul yok: seçici `map.variants`'ın hepsini gösteriyor (`src/screens/Screens.tsx`).
- `be03d30` ve sonrasında gerçek tarayıcıda (telefon ve PC boyutu) Volkan seçilince "Uyuyan ejderha" varyantı, ejderha seçimi ve `dragonWake` kipi çıkıyor. Hata burada üretilemedi; yerel ortamın (eski dev sunucusu ya da tarayıcı önbelleği, eksik çekilmiş dosya) denetlenmesi istendi.
- UI testi eklendi (`src/screens/setup-ui.test.tsx`): GM kurulum ekranı sunucuda çizilir ve şunlar denetlenir:
  - Volkan'da iki varyant;
  - uyuyan-ejderha seçilince üç ejderha (Young varsayılan) ve `never`/`chance`/`gm`;
  - `chance`'ta yüzde alanı (25).
- `GmScreen`'e açılış seçimi için `initial` (harita, varyant, kip) eklendi. Harita/varyant değişince ejderha ayarları sıfırlanıyor; ilk açılışta sıfırlanmıyor.

## 2026-10-16 — Canavar jeton resimleri

- `public/monsters/<id>.webp`: 330 canavarın hepsi için jeton resmi var (kullanıcı ekledi). Canavar avatarının varsayılan yolu `avatars/canavar-<id>.webp` yerine `monsters/<id>.webp` oldu.
- `<id>-uyku.webp` (22 tane: ejderhalar, bazı canavarlar): yaratık uyurken (uyuyan ejderha) jetonda bu resim gösterilir, uyanınca normal resme döner. Uyku resmi yoksa normal resim kullanılır.
- Test: her canavarın `<id>.webp` dosyası var. Yalnızca dosya adlarına bakılır; resimler testlere girmez.
- Yön: Canavar resimleri sağa bakıyor. Haritadaki düşman jetonu en yakın karaktere dönük çizilir: karakter soldaysa resim yatayda aynalanır. Konum değişince yön de değişir. Sıra çubuğundaki küçük rozetler aynalanmaz.

## 2026-10-16 — Volkan: "Uyuyan ejderha" varyantı (`uyuyan-ejderha`)

**Karar (kullanıcının kuralı; değerler `volkan.json` → `sleepingDragon`):**

- **Varyant:** Normal Volkan aynen kaldı. Yeni varyant aynı zemin, görsel ve kurallar (lav kenarı, patlama, lav yükselmesi, ada atlaması) artı `sleepingDragon`.
- **Ejderha seçimi ve yeri:** `dragon` ile seçilir: `young-red-dragon` (varsayılan), `adult-red-dragon`, `red-dragon-wyrmling` (canavar listesindeki kimlikler).
  - Ortadaki büyük adanın tepesine (H, sütun 8 satır 3) uyur halde, düşman tarafında yerleşir. Aynalıda aynalanır.
- **Uyku:**
  - Turunu atlar; sırası gelse de komut veremez.
  - Hareket etmez.
  - Yakın dövüş saldırıları ona avantajlı ("Hedef uyuyor (yakından)"); menzilli değil.
  - Legendary Resistance zaten yok sayıldığı için uykuda özel bir şey yok.
- **Uyanma** (herhangi biri; günlüğe "X uyandı (sebep)"):
  - Hasar: HP düşerse; bağışık olduğu ateş uyandırmaz.
  - Gürültü: 25 ft içinde gürültülü büyü ya da yetenek. Hasar türü `thunder`, adı listede (Thunderwave, Shatter, Thunderclap, Thunder Step) ya da adında roar/screech/shriek/howl/thunder geçen. Büyücü ya da hedef/alan merkezi 25 ft içindeyse sayılır.
  - Yanına girme: bitişik altıgene bir yaratık girerse; yürürken yanından geçmek, atlayıp yanına inmek ve itilmek dahil.
  - Algı: her tur (round) sonunda, 25 ft içindeki gizlenmemiş her karakter için ejderhanın Algı zarı (d20 + Perception ≥ 12). İlk başarıda uyanır. "Tur sonu" round sonu olarak uygulandı.
- **Kazanma:** Uyanık düşmanların hepsi yenilince parti kazanır; ejderha uyurken sıvışılır. Uyuyan ejderha "ayakta düşman" sayılmaz.
- **`dragonWake` (GM kurulumunda; varsayılan JSON'da `never`):** Yalnızca yapay zekânın yönettiği düşmanlar için geçerli.
  - `never`: Yapay zekâ ejderhayı uyandıracak hiçbir komutu seçmez. Yanına giren ya da yolu yanından geçen yürüyüş/atlama elenir; uyandıracak saldırı ya da büyü yerine turu bitirir.
  - `chance`: Her düşman turunun başında, ejderha uyurken, d100 < yüzde (GM seçer, 0–100, varsayılan 25) zarı atılır. Zar tohumludur, simülasyonda tekrarlanabilir. Tutarsa günlüğe "X ejderhayı uyandırmaya çalıştı" yazılır: 25 ft içindeyse bağırır (uyanır), değilse o tur ejderhanın yanına yürür.
  - `gm`: Yapay zekâ dokunmaz; yalnızca GM uyandırır.
- **GM:**
  - "GM: Ejderhayı uyandır" düğmesi her kipte, her an GM menüsünde. Onay ister; günlüğe "GM ejderhayı uyandırdı".
  - GM bir düşmanı elle yönetirken kısıt yok: ejderhaya saldırmak, yanına girmek, gürültülü büyü normal kurallarla uyandırır.
  - Elle yönetim zaten var: düşmanın turunda GM "Düşmanı oynat" yerine menüden komut verir. "Yapay zekâ düşmanını devralma" için ayrı bir özellik gerekmedi.
  - Uygulama tek cihaz olduğundan GM düğmeleri (patlama, lav yükselmesi gibi) GM menüsünde "GM:" önekiyle duruyor; ayrı bir GM oturumu ileride.
- **Oyuncular:** `dragonWake`'ten etkilenmez; kendi kararlarıyla uyandırabilir. Zarla uyanma kuralları herkes için aynı işler.
- **Parti yapay zekâsı (simülasyon):**
  - Uyuyan ejderhayı hedef almaz ve yanına girmekten kaçınır.
  - Ejderha uyurken Algı menzilindeyse (yakın dövüşte değilse) önce menzilden çıkar. Yakın dövüşe girmiş karakter yerinde kalır.
- **Çok hex'li boyut ertelendi:** Ejderha mekanik olarak tek altıgen. Jeton görsel olarak büyütüldü (`tokenScale` 2.4, yaklaşık 2–3 altıgen); tıklama yalnızca kendi altıgeninde. Büyük jetonlar önce çizilir, komşudakiler üstte kalır.
- **Arayüz:**
  - Uyuyan jetonda "Zzz" rozeti ve kesikli halka.
  - Bilgi panelinde (jetona uzun bas) uyanma koşulları, varyantın değerleriyle.
  - Kurulumda ejderha seçimi, `dragonWake` kipi ve `chance` yüzdesi.
- **Denge (DENGE.md, 200 tohum, `never`):**

  | Ejderha | Eşlik | Parti kazandı | Uyanma | Uyanınca kazanma |
  |---|---|---:|---:|---:|
  | Young Red | 3 Harpy | %75 | %26 | %2 |
  | Adult Red | 3 Harpy | %70 | %30 | %0 |
  | Wyrmling | Wyvern + Harpy | %79 | %53 | %59 |

## 2026-10-16 — SRD 5.2.1 bestiary: 314 canavar eklendi (toplam 330)

**Karar:**

- `data/monsters.json` SRD 5.2.1'in "Monsters A–Z" ve "Animals" bölümlerindeki bütün stat bloklarını içeriyor: 330 canavar.
  - Elle girilmiş ilk 16 kayıt (Türkçe notlar dahil) aynen kaldı; yalnızca `unsupported` alanı eklendi.
  - Yeni 314 kayıt öncelik sırasıyla geliyor:
    - 39 ejderha (Young Red zaten vardı; 10 renk × Wyrmling/Young/Adult/Ancient tamam).
    - 142 uçan ya da menzilli saldırılı canavar.
    - 133 diğer.
  - Gruplar kendi içinde CR'ye göre sıralı.
- Veri SRD PDF'inin sütun metninden betikle ayrıştırıldı ve mevcut şemaya çevrildi:
  - Temel değerler: AC, HP, yürüme ve uçma hızı, 6 yetenek, farklı save'ler, beceriler, Darkvision, hasar direnç/bağışıklık/zaafları, CR.
  - Saldırılar: saldırı bonusu, erişim ya da menzil, hasar zarı ve türü, ek hasar (rider). Recharge ve Multiattack'taki tekrar sayıları da aktarıldı.
  - Save'li eylemler (nefes vb.): yetenek, DC, yarım hasar, menzil.
  - Pack Tactics, Undead Fortitude, Regeneration ve Nimble Escape motorun mevcut alanlarına bağlandı.
- **`unsupported: [...]`:** Motorun desteklemediği her özellik canavar kaydında listeleniyor (311/330 kayıtta var). Özellik canavarı kullanılamaz yapmıyor; aşağıdaki karşılıklar kullanılıyor.

**Eksik özellikler (kayıt sayısı) ve karşılıkları:**

| Eksik özellik | Kayıt | Karşılık |
|---|---:|---|
| Çok hex'li boyut: Large / Huge / Gargantuan | 107 / 34 / 15 | Tek hex. Boyut yalnızca İt (Shove) sınırında kullanılıyor. |
| Alan şekilleri (Cone, Line, Sphere, Emanation…; nefesler dahil) | 54 | Tek hedefe save'li saldırı. Menzil = alan uzunluğu ya da yarıçapı. |
| Legendary Actions | 30 | Yok sayılır. |
| Legendary Resistance | 32 | Yok sayılır. |
| Lair | – | SRD 5.2.1 stat bloklarında ayrı Lair Actions yok; yalnızca "in Lair" kullanım sayısı (yok sayılır). |
| Spellcasting | 49 kayıtta; 46'sında eksik listesine eklendi | Yok sayılır. Büyü saldırısı olan eylemler (Arcane Burst gibi) saldırı olarak var. |
| Multiattack (kısmi) | 96 | Adı geçen saldırılar sayısınca. "X veya Y" → ilki. "Büyü/başka eylem kullanır" kısmı yok sayılır. Hydra: baş sayısı kadar Bite. |
| Diğer özellikler (Trait) | 176 | Yok sayılır, adları `traits` metninde. |
| Bonus eylemler (Nimble Escape dışında) | 66 | Yok sayılır. |
| Tepkiler (Parry vb.) | 24 | Yok sayılır. |
| Saldırı/save olmayan eylemler (Teleport, Change Shape…) | 25 | Yok sayılır. |
| Swim / Climb / Burrow hızı | 128 | Yalnızca yürüme ve uçma kullanılır. |
| Hover | 16 | Yok sayılır. |
| Blindsight / Truesight / Tremorsense | 101 | Yok sayılır; Darkvision kullanılır. |
| Durum bağışıklığı | 75 | Yok sayılır; hasar bağışıklıkları kullanılır. |
| Ek hasar ve durum etkileri (rider) | tümü | Motor genelinde metin olarak taşınır, elle uygulanır (önceki 16 canavarda da böyle). |
| X/Day kullanım | 4 | Recharge 6 (1/Day) ya da 5 (2–3/Day) olarak. |
| Sabit hasar ("1 Piercing") | 21 | Zar motoru d1 kabul etmediği için 1d2 + (N − 1) yaklaşığı. |
| Hiç saldırısı yok (Shrieker Fungus, Seahorse) | 2 | Basit "Vuruş" (1d4 + STR) karşılığı. |

**Diğer:**
- Testler: 330 kayıt; ilk 16 yerinde; 40 ejderhanın hepsi var; her zar ifadesi geçerli; her canavardan savaşçı oluşuyor; büyük boyutlu canavarlarda boyut notu var.
- Ayrıca 330 canavarın her biri tek başına bir simülasyon savaşında hatasız oynatıldı.
- Kurulum ekranındaki düşman listesine arama eklendi: ad ya da "CR 5" yazılır, seçilenler hep görünür.
- Simülasyonun XP tablosu bütün CR'lere genişletildi.
- Lisans: SRD 5.2.1 CC-BY-4.0. Mevcut atıf metinlerine (NOTICE, README, `public/atiflar.txt`) dokunulmadı.
- Paket boyutu 418 → 733 kB (gzip 135 → 178 kB); Vite 500 kB uyarısı veriyor. Gerekirse canavar verisi ayrı parçaya (lazy) alınabilir.

## 2026-10-16 — Volkan: ada atlaması yalnızca en yakın karaya

**Karar (kullanıcı):**
- Lav atlamasının hattı (iki altıgen arası düz çizgi) kalkıştan inişe baştan sona lav olmalı. İniş, lav bittikten sonraki ilk kara.
- Hatta kara varsa, aynı ya da başka adanın karası fark etmez, atlama o karada biter. Ötesine atlama reddedilir: bir adayı atlayıp ötekine geçmek yasak, her ada kendi atlamasıyla geçilir.
  - Ada içinden atlanmaz: önce kenara yürünür.
  - Lav altıgenine inilmez.
  - Çizgi iki altıgenin tam sınırından geçerse iki yol da denenir.
- Aradaki lav sayısı sınırsız; DC = 10 + 2 × (lav − 1) aynen kalıyor.
- Uçan zarsız ama o da ilk karaya iner.
- Değişmeyenler: düşmanlı adaya atlama (`foeIsland: allow`), dolu hedef reddi, hareketin yerine geçme (bu tur yürünmemiş olmalı).
- **Arayüz:** Atla kipinde yalnızca geçerli ilk-kara altıgenleri yanar (motor denenerek), uzak adalar yanmaz.
- **Yapay zekâ:**
  - Atlama adayları motorun kuralıyla üretilir. Her atlamada doğal 1 riski (40 × P(düşme)) ve yanma (6 × P(yanma)) maliyete eklenir.
  - Güvenli iniş %60'ın altında ya da HP %40 ve altında ise atlamaz.
  - Atlama maliyeti artık "tüm hız" değil, aşılan mesafe (lav + iniş) + risk. Lav yürünemediği için atlama tek yoldur.
  - Uzak ada için tur tur ilerler: kenara yürü → atla → karşı kenara yürü → atla. Ortadaki adada en çok iki tur kalır (testte).
- **Ölçüm:** Volkan %100'e döndü (DENGE.md). Düşman listesine dokunulmadı.

## 2026-10-16 — Volkan: düşmanlı adaya atlama açıldı (`foeIsland: allow`)

**Karar (kullanıcı):**
- Volkan'da `lavJump.foeIsland` = `allow`: düşmanlı adaya da atlanır.
- Dolu hedef altıgen reddi kaldı; yapay zekâ kuralları değişmedi.
- `reject` seçeneği motorda duruyor ve testte veriyle sınanıyor.
- Ölçüm: parti %87 (önce %100). Hedef ~%87 tuttu, düşman listesine dokunulmadı (DENGE.md).

## 2026-10-16 — Kara ekran kontrolü: yeniden deneme

Windows'ta `npm run check:harita` 127. kontrolde durdu: sayfa 30 sn içinde açılmadı ("text=GM" zaman aşımı) ve yakalanmayan istisna betiği bitirdi; sonraki haritalar (taverna, volkan) hiç kontrol edilmedi. Uygulama hatası değil, yerel ortamın anlık yavaşlığı.

- Her kontrol bir istisnada bir kez yeniden denenir (yeni sayfa).
- İkinci denemede de olmazsa o satır `HATA` yazılır ve ekran görüntüsü alınır; betik durmadan sıradakine geçer.
- Hata varsa çıkış kodu 1 (değişmedi).

## 2026-10-16 — Volkan: sınırsız ada atlaması (`lavJump` genişletildi)

**Karar (kullanıcının kuralı):**

- Lav üstünden geçen atlama artık "ada atlaması": herhangi bir adanın herhangi bir boş altıgenine.
  - Mesafe, hız ve koşu sınırı ve düz doğrultu şartı kalktı.
  - Aradaki altıgenler lav ya da kara olabilir; engel (`#`) atlamayı keser.
  - Yol, iki altıgen arasındaki düz çizgi (`line`).
- DC = 10 + 2 × (aradaki lav altıgeni − 1), d20 + Athletics, üst sınır yok.
  - Uçan zarsız; doğal 20 güvenli.
  - Başarısızlıkta 2d6 ateş + Burning; doğal 1 lava düşer (yolun ortasındaki lav altıgeninde).
  - Değerler `volkan.json` → `lavJump` içinde.
- **Hareketin yerine geçer:** bu tur hiç yürünmemiş olmalı ve atlama tüm hareketi harcar. Eylem harcanmaz.
- Hedef altıgen doluysa reddedilir. Hedef adada (lav ve engel dışı, bağlı kara parçası) düşman varsa da reddedilir. Bu, veride `foeIsland: "reject"`.
- Lav üstünden geçmeyen atlama değişmedi: 5e uzun atlama, zarsız. Eski 5e atlama testleri `lavJump`'sız haritaya (Orman) taşındı.
- **Arayüz:**
  - Menüde "Atla" (yalnızca `lavJump` olan haritada). Bu tur yürüdüysen düğme sebebini söyler.
  - Atla kipinde seçilebilir ada altıgenleri turuncu yanar ve üstünde DC yazar. Üzerine gelince bilgi kutusunda "DC X, N lav hex" görünür.
  - Dokununca balon çıkar: şanslar ve "tüm hareketini harcar" bilgisi, ardından "Atla" onayı.
- **Yapay zekâ:**
  - Güvenli iniş şansı %60'ın altındaysa (DC çok yüksek) ya da HP %40 ve altındaysa atlamaz.
  - Atlama, risk kadar ek maliyetle aday olur. Yalnızca yürüyüşün ulaştıramadığı bir saldırı yeri ya da yaklaşma sağlıyorsa seçilir.
  - Doğal 1'in %5 ölüm riski bu yüzden boşuna alınmaz.
- **Ölçüm (DENGE.md):**
  - Uygulanan kuralla Volkan %100. Taraf adaları kara ile bağlı olmadığından kara düşmanları partinin adasına atlayamıyor.
  - `foeIsland` kapalı denemede %87, ölen PC 0.68.
  - Karar kullanıcıda.

## 2026-10-16 — Satır sonları: CRLF uyumu ve .gitattributes

**Karar:**

- `parseStatus` (Durum sayfası) GOREV.md'yi satırlara `/\r?\n/` ile bölüyor. Windows'ta CRLF ile çekilen dosyada `\r` kalıyordu ve "## Adımlar" başlığı bulunamadığı için liste boş dönüyordu.
- Testte aynı içeriğin CRLF hâli de aynı adımları vermek zorunda.
- `.gitattributes`:
  - `* text=auto eol=lf`: depoda ve çalışma kopyasında LF.
  - Görseller (png, jpg, webp…), video (mp4, webm), pdf ve fontlar `binary`.
- Depoyu yeniden normalleştirmek dosya değiştirmedi (hepsi zaten LF).

## 2026-10-16 — Dungeon: Merdiven ve Hazine odası varyantları

**Karar (GOREV-DUNGEON-MERDIVEN-HAZINE, kullanıcının verisi):**

- `data/maps/dungeon.json` artık üç varyant içeriyor: Koridor (meşale), Merdiven ve Hazine odası.
  Koridor değişmedi. Yeni iki varyantın kendi `tiles`, `startZones` ve `mirrorable` değerleri var.
  Doğrulayıcı bu varyantlarda da aynalamayı ve başlangıç bölgelerini denetliyor.
  `npm run check:harita` ikisini de kapsıyor.
- **Yeni arazi harfleri:**
  - `l`: alçak basamak, yükseklik 1.
  - `y`: yüksek basamak veya sahanlık, yükseklik 2.

  İkisi de normal maliyetli ve tırmanma gerektirmiyor (`stairs: true`).
  Basamaktan basamağa yukarı yürünüyor ve itilebiliyor. Basamaktan aşağı inişte düşme hasarı yok.
- **Harflerin anlamı korundu.** Mevcut harfler (u, m, x, k, h, j, o) katalogdaki anlamlarını korudu:
  - `x`: zor zemin ve yarım siper.
  - `k`: zor zemin.

  Görev metnindeki "raf/sandık" ve "altın yığını" açıklamaları bu kurallarla uyuşuyor.
- **`highGround`:** Kural yeni bir hesap eklemiyor. Mevcut genel yükseklik kuralı (≥1 kademe yüksekten avantaj) uygulanıyor; JSON'daki kural bunu belgeliyor.
- **`stairwellFall`:**
  - `u` altıgenine itilen ya da düşen yaratık 2d6 ezici hasar alır ve Prone olur.
  - Alt kata inmez. Aynı odada en yakın boş `l` altıgenine yerleşir (oda tek kat).
  - Sayılar JSON'da.
- **`stairShove`:** İt komutuyla basamakta yüksekten alçağa itilen hedef ek olarak 1d4 ezici hasar alır ve Prone olur.
- **Hazine odası:**
  - `j` altıgenleri mevcut `trap` kuralını kullanıyor (DC ve hasar JSON'da).
  - **`hiddenTrap`:** Tur başında partinin masum olmayan üyeleri pasif Algıyla tuzağı fark edebilir. Pasif Algı 10 + Algı bonusu; tuzağın DC'sine eşit ya da üstündeyse ve tuzak 3 altıgen içindeyse fark edilir.
  - **`loot`:** Yalnızca bilgi. Altıgen bilgisinde "hazine" yazıyor, oyun kuralı yok; ödülü GM hikâyede verir.
- Simülasyona `dungeon`, `dungeon-merdiven` ve `dungeon-hazine` senaryoları eklendi (sonuçlar docs/harita/DENGE.md'de).
- **Görsel ve önizleme dosyaları:** Görseller `public/maps/` altında. Önizlemeler ve görev verisi `docs/harita/ornek/` altında.
  Overlay kontrolü yapıldı: JSON'daki harfler gerçek görselin üstüne çizildi ve `ver_merdiven.jpg` / `ver_hazine.jpg` önizlemeleriyle karşılaştırıldı.
  Harfler altıgen altıgen aynı. Kontrol `npm run check:harita -- dungeon` ile yapıldı: 24 kontrol, 0 hata.

## 2026-10-16 — Volkan: lav üstünden riskli atlama (`lavJump`)

**Karar (kullanıcının taslağı; sayılar veride, kodda sabit yok):**

- Atlamanın üstünden geçtiği altıgenlerden biri kuraldaki zemindense (`over: ["~"]`) ve
  atlayan uçmuyorsa beceri zarı: d20 + Athletics (yetkinlik `skillBonus`). DC = `dcBase` 10 +
  `dcPerExtraHex` 2 × (lav altıgeni − 1). Kanalsız/normal zemin atlaması eskisi gibi zarsız.
- Doğal 20 (`natural20: "safe"`) her zaman güvenli; toplam ≥ DC güvenli iniş; toplam < DC
  hedefe iner ama kenarda yanar (`onFail`: 2d6 ateş + Burning); doğal 1 (`natural1: "fall"`)
  lava düşer, `fall: "deadly"` lav kuralı (anında ölüm). Genel tutuldu: ileride uçurum için
  `fall: "fall"` düşme hasarı (şimdilik yalnızca Volkan'da, lav için).
- **Burning (`lavJump.burning`):** tur başında 1d6 ateş, sonra DEX DC 10 save ile söner. SRD
  5.2.1 Burning (Rules Glossary, s. 178) 1d4 ateş ve söndürmek için eylem + Prone diyor;
  kullanıcının taslağı (1d6, DC 10 DEX) veride uygulandı, SRD'ye dönmek veride iki sayı.
- Zar komutun zar akışından (tohumlu simülasyonda tekrarlanabilir); sonuç `jump_check`
  olayında, günlükte "Mira lava atladı: 14 vs DC 10, başarılı, güvenle indi."
- **Arayüz:** riskli atlama altıgenleri turuncu; dokununca balonda Athletics/DC ve şanslar
  ("başarı ~%65, yanma %30, lava düşme %5"), riskliyse turuncu çerçeve, "Atla" onayı.
- **Yapay zekâ (iki taraf):** HP %40 ve altındaysa riskli atlamaz; değilse riskli atlama
  4 + 40 × P(düşme) + 6 × P(yanma) altıgen ek maliyet sayılır: yürüyerek benzer yere
  varılabiliyorsa yürür, yalnızca başka yol yoksa ya da çok uzunsa atlar.

## 2026-10-16 — Masum sayısı ve yerleşim modları (Taverna, Şehir Meydanı)

**Karar:**

- **Sayı:** GM kurulumunda +/− sayaç. Varsayılan haritanın kuralından (`civilians.default`:
  Taverna 4, Şehir Meydanı 6), aralık 0–12 (`min`/`max` veride); üst sınır ayrıca uygun
  (yürünebilir ve tehlikesiz, düşman başlangıç bölgesi dışı) altıgen sayısını aşamaz. Masum
  özellikleri (HP 4, AC 10, hız 6 altıgen) veriden gelmeye devam eder. 0 masum: masum ve
  sayaç yok.
- **Yerleşim modları:** Otomatik, düşmandan en uzak (varsayılan) · Ortada (önceki karar,
  kaldı) · Rastgele (tohumlu: aynı tohum aynı yerleşim; uygun ve partiden yürüyerek
  ulaşılabilen altıgenlerden; "Yeniden at" yeni tohum) · Elle (GM kurulum ekranındaki küçük
  haritada boş altıgene dokununca masum konur, masuma dokununca kalkar; sayaç kadar
  yerleşene dek "Savaşı kur" kapalı ve eksik sayı yazar).
- **Geçersiz altıgenler:** engel, lav, alev, derin batak, tuzak ve düşman başlangıç bölgesi.
  Partinin bölgesi geçerli (masumlar partinin arkasında durabilir); elle yerleşimde masumlar
  önce yerleşir, savaşçılar bölgelerinin boş kalanına.
- **Aynalama:** elle konan masumlar zeminle birlikte aynalanır (sütun c → 14 − c); aynalı
  haritada geçersiz kalanlar sayılmaz.
- Özet ve "Masumlar: x/n hayatta" seçilen sayıyla çalışır; masum ölümü yine kaybettirmez.
- Denge ölçümüne 8 masumlu taverna senaryosu eklendi (`taverna-8`).

## 2026-10-16 — Ortamın yay dezavantajı düzeltildi; su altı kuralları motorda

**Karar (kullanıcı onayıyla; gerekçe docs/harita/DENGE.md "Yay dezavantajı nereden geliyor"):**

- **`weapon` kategorisi** artık yalnızca silah saldırısına uygulanır (önceden etiketteki kelime
  büyü ve save'li etkilerde de eşleşebiliyordu). Kurala `ranged` alanı eklendi: yalnızca
  menzilli ya da yalnızca yakın dövüş silah saldırısı. Cirit'in yakın dövüş saldırısı artık
  dezavantaj almaz.
- **Çöl, orman, mağara (yeraltı):** harita boyu yay dezavantajı kaldırıldı (SRD 5.2.1'de
  karşılığı yok). Bu ortamlarda atışı haritanın kendi kuralları bozar: siper, karanlık, kum
  fırtınası.
- **Fırtına ve dağ:** kalır, yalnızca menzilli silah saldırısına (SRD 5.2.1 Environmental
  Effects, Strong Wind, s. 195).
- **Su altı (SRD 5.2.1 Underwater Combat, s. 16):** ortam verisinden çıkarıldı ve motora
  genel kural olarak taşındı. Saldıran derin sudaysa (`w`, uçmuyorsa; haritasız savaşta ortam
  "Sualtı / bataklık" ise) ortam ne olursa olsun: piercing olmayan yakın dövüş saldırısı
  dezavantajlı (yüzme hızı modellenmediği için kimsede yok sayılır), menzilli silah saldırısı
  dezavantajlı, normal menzil ötesinde otomatik ıska. Bataklık haritasında derin su olmadığı
  için orada artık silah dezavantajı yok.

## 2026-10-16 — İtme (Shove) ve zorunlu hareket

**Karar (SRD 5.2.1):**

- **Shove** (Rules Glossary → Unarmed Strike, **s. 191**): hedef STR ya da DEX save'i yapar
  (kendisi seçer: motorda yüksek olanı), DC = 8 + saldıranın STR modifier'ı + yetkinlik
  bonusu; başarısızsa saldıran 5 ft itmeyi ya da Prone'u seçer (komutta önceden seçilir).
  Hedef en çok bir boyut büyük olabilir. Attack eylemindeki bir saldırının yerine geçer
  (Extra Attack ile itme + saldırı). Paralyzed/Stunned/Unconscious hedef save'i otomatik kaçırır.
- **Boyut ve yetkinlik:** canavarlara SRD boyutu (`size`: Goblin Warrior Small; Giant
  Spider, Ogre, Owlbear, Minotaur, Troll, Wyvern, Young Red Dragon Large; Hill Giant Huge;
  diğerleri Medium) ve CR'den yetkinlik bonusu eklendi. Karakterin boyutu türünden (Medium
  seçilebiliyorsa Medium, yoksa Small).
- **Haritada yön:** saldıranın altıgeninden hedefinkine giden eksen yönünün devamı. Geçilmez
  zemin, kapalı kapı, başka yaratık, harita dışı ya da **daha yüksek zemin** arkadaysa
  itilmez (SRD'de yokuş yukarı itme yok; 10 ft'lik basamağa itme yerine engel sayıldı);
  yalnızca Prone seçilebilir. Haritasız savaşta konum olmadığından yalnızca Prone uygulanır.
- **Zorunlu hareket** (ortak fonksiyon `battle/forced.ts`): fırsat saldırısı tetiklemez.
  İtilen altıgene girmiş sayılır: lav anında ölüm (uçan hariç), alev, buz, batak (batma
  sayacı, zehir), bilinen/gizli tuzak, derin su (batma kuralları tur başı/sonu işler),
  Spirit Guardians yayılımı.
- **Düşme** (Falling, **s. 182**): her 10 ft için 1d6 bludgeoning (en çok 20d6), hasar
  alırsa Prone. Yükseklik altıgenden: bir seviye = 10 ft (tırmanmanın 2 altıgen = 10 ft
  harcamasıyla aynı ölçek); `h` (1) → `.` (0) 10 ft, `z` (2) → `.` 20 ft. **Uçurum/yarık
  (`u`)** 30 ft derin sayıldı (+ başlangıç altıgeninin yüksekliği); itilen dibine (o
  altıgene) düşer, sonra komşu altıgene yürüyerek çıkar (tırmanma basitleştirildi). Uçan
  yaratık düşmez. Suya düşmede SRD'deki tepkiyle yarı hasar seçeneği yok (su altıgenine
  düşme olmadığı için).
- **Büyüyle itme:** Thunderwave (`pushFt: 10`) başarısız save'de büyücüden uzağa iki adım
  aynı fonksiyonla iter (her adımda büyücüden uzaklaşan ve doğrultuya en uygun komşu; engelde
  durur; lavda ölür).
- **Arayüz:** yüzen menüde "İt"; bitişik itilebilir hedefler parlar; hedefe dokununca balonda
  itileceği altıgen ve sonuç ("Lav! Düşerse ölür", "Uçurum! 40 ft düşer (4d6)", "İtilemez:
  arkada duvar"), hedefin save'i ve DC; altıgen haritada vurgulanır. Save sonucu günlüğe.
- **Yapay zekâ (iki taraf):** bitişik hedefin arkası lav, uçurum, derin batak (saplanır, zehirlenir, boğulabilir) ya da en az 20 ft düşüşse ve
  hedefin save'i kaçırma şansı en az %30 ise (DC − hedefin en iyi STR/DEX save'i ≥ 6) önce
  iter; değilse eskisi gibi saldırır.

## 2026-10-16 — Gizlenme haritada görünür (Adım 10d)

**Karar:**

- **Gizlenme yerleri:** sırası gelen oyuncu karakterinin kendi altıgeni ve bu tur yürüyebildiği
  altıgenlerden gizlenme yeri olanlar kesik çizgili iç altıgenle işaretlenir (katalogdaki
  `hide`, haritanın `hideTerrain`'i, ormanın ağaç yanı). Gizlen kapalıysa düğme soluk durur,
  dokununca nedeni yazar ("Burada gizlenilemez (Açık zemin); işaretli bir altıgene yürü.",
  "Zaten gizli (DC n).", eylem ekonomisi).
- **Motor düzeltmesi:** ormanın `stealth` kuralındaki `hideAdjacentTo: ["a"]` (ağacın yanında
  gizlenme) veride vardı ama uygulanmıyordu; artık uygulanıyor (bonus `hideBonus`'tan, yoksa 0).
- **Gizli jeton:** zemine uygun örtü (kumda kum yığını, çalılık ve ağaç yanında yaprak, başka
  yerde gölge), kapalı göz simgesi, yarı saydam; sahibinin ekranında "Gizli (DC n)" etiketi.
- **Perde (tek cihaz):** ekran sırası gelenin gözünden çizilir. Oyuncu karakterinin turunda
  düşmanın gizli jetonu hiç çizilmez; düşman/masum turunda ve kurulumda (GM ekranı) oyuncunun
  gizli jetonu çizilmez. Sıra şeridinde karşı tarafın gizlisi "?" görünür. GM ekranında ≡
  menüsünde "Gizli jetonları göster" anahtarı (varsayılan kapalı). Günlük satırları ortak
  kalır (gizlenme zarı yazılır); online sürümde oyuncuya göre süzülecek.
- **Ortaya çıkma:** bulununca, saldırınca, büyü yapınca (ya da yürüyünce) jetonda kısa toz
  veya yaprak savrulması (0,8 sn); "hareketi azalt" açıksa yok. Tam animasyonlar Adım 12'de.

## 2026-10-16 — Harita adları, Dağ (yaz/kış), kara ekran kontrolü, mağara ışığı

**Karar:**

- **Görünen adlar sadeleşti** (kimlikler ve dosya adları aynı): Ada, Bataklık, Çöl, Dağ,
  Dungeon, Güverte, Kale, Mağara, Orman, Şehir Meydanı, Taverna, Volkan. Parantezli varyant
  adları da sadeleşti (Kale: Gündüz/Gece; Şehir Meydanı: Gün/Gece). Simülasyon senaryo adları
  "Harita — varyant" biçiminde.
- **Dağ ve Buzul birleşti:** tek harita `dag` ("Dağ"), varyantlar `yaz` (eski Dağ geçidi:
  görsel, zemin, kurallar) ve `kis` (eski Buzul dağı: kendi zemini, başlangıç bölgeleri,
  `ice`/`cold` kuralları ve Buzul ortamı). Görseller `harita-dag-yaz.webp` ve
  `harita-dag-kis.webp`. Harita sayısı 13 → 12; `buzul` kimliği kalktı.
- **Varyant düzeni:** harita şemasında varyant başına isteğe bağlı `tiles`, `startZones`,
  `mirrorable` (ve önceden olan `rules`, `environmentId`); verilirse haritanınkini ezer.
  `getMap(id, { variantId, mirrored })` varyantın düzenini yükler; aynalama varyantın kendi
  zemini ve başlangıç bölgeleriyle yapılır; doğrulama her varyantın düzenini ayrı denetler.
- **Kara ekran (fırtınalı Çöl, Güverte, Ada, Mağara):** kullanıcının ekran kaydında efekt ve
  altıgen katmanları çiziliyor, harita görseli hiç görünmüyordu. Burada (başsız ve tam
  Chromium, telefon ve PC, açık/koyu tema, aynalı/aynasız, kurulum ve savaş) yeniden
  üretilemedi; dosyalar sağlam (aynı WebP yapısı, 1280×715) ve kod yolu bütün varyantlarda
  aynı. Sonuç: o tarayıcıda görsel yüklenemedi ya da çözülemedi (kullanıcıda sonra kendiliğinden
  düzeldi; büyük olasılıkla önbellek veya yerel dosya). Koruma: harita görseli SVG `<image>`
  yerine düz `<img>`; yüklenemezse sahnede "Harita görseli yüklenemedi: …" uyarısı ve konsol
  hatası; efekt çizimi hata verirse ya da tuval bağlamı kaybolursa efektler durur, harita kalır.
- **Otomatik kara ekran kontrolü:** `npm run check:harita` (Playwright; ilk sefer
  `npx playwright install chromium`). Her harita × varyant × aynasız/aynalı × efekt
  kapalı/açık × telefon/PC için savaş ekranını açar; sahnenin ortalama parlaklığını ve boş
  piksel oranını harita görselinin kendisiyle karşılaştırır (sahne ≥ görselin %55'i, boş
  piksel en çok +%20, mutlak alt sınırlar), görsel uyarısını ve sayfa hatalarını yakalar.
  Bozuk ve eksik görselle denendi, ikisini de yakalıyor. Menü videosu (H.264) savaş ekranında
  olmadığı için başsız tarayıcıda oynatılamaması etkilemiyor.
- **Karanlık gölgesi:** görülmeyen altıgenlerin gölgesi %55 → %38 opaklık; harita ve jetonlar
  okunur.
- **Mağara ışığı:** meşale yarıçapı 2; kristaller loş, yarıçap 1 (kurala yeni
  `tileLightRadiusHexes`, katalogdaki kristal ışığı başka haritalarda 4 kalır); 4 meşale
  (kristallerin üstündeki 5 ve bir yinelenen ışık kaldırıldı). Yürünebilir altıgenlerin
  %54'ü aydınlık (hedef %40–60). Kristaller de yarıçap 2 olsa meşalesiz bile %63 olurdu.
- **Yüzen menü:** düğmeler tek yaya sığmayınca (savaşçıda 10 düğme, kenardaki jeton) iç içe
  halkalara, birbirine değmeden yerleşir; önceden kenara itilip üst üste biniyordu.

## 2026-10-15 — Masumları koru: masum ölümü bilgi amaçlı, yerleşim düşmandan uzak

**Karar:**

- **Masumların ölümü savaşı kaybettirmez;** GM hikâyede işler. Kazanma/kaybetme eskisi gibi:
  düşmanlar yenilirse parti kazanır, parti (masumlar hariç) düşerse kaybeder. Haritanın
  `minSurvivorsRatio` (en az yarısı hayatta) değeri yalnızca GM'in kurulumda açtığı **sıkı
  kural** ("Masumların yarısı ölürse kaybedilir", varsayılan kapalı) ile kaybettirir
  (`map.objective.strict`).
- **Sayım sürer (bilgi amaçlı):** ekranda "Masumlar: x/n hayatta" (sıkı kuralda gereken sayı
  da yazılır); savaş sonu özetinde kurtarılan ve ölen masum.
- **Varsayılan yerleşim:** masumlar düşmanlardan en uzak, partinin bir üyesinden yürüyerek
  ulaşılabilen ve tehlikesiz (alev, batak, buz, tuzak olmayan) altıgenlere. Eski "ortada"
  yerleşimi GM kurulumunda seçenek.
- **Yapay zekâ değişmedi:** masumlar düşmandan kaçar; düşmanlar onları (en yakın hedef
  olarak) hedef alabilir.
- **Denge ölçümü:** parti galibiyeti yalnızca düşmanların yenilmesine göre; "ortalama
  kurtarılan masum" sütunu eklendi. Simülasyondaki eski "masumları parti arkasına koy" ara
  çözümü kaldırıldı (artık varsayılan yerleşim).

## 2026-10-15 — Sınıf özellikleri, konsantrasyon ve fırsat saldırısı

**Karar (SRD 5.2.1):**

- **Sneak Attack (Rogue):** 5. seviyede 3d6 (seviyenin yarısı, yukarı). Turda bir kez
  (başkasının turu ayrı tur sayılır: fırsat saldırısında da olur), Finesse veya menzilli
  silahla, saldırı avantajlıysa ya da dezavantaj yokken hedefin 5 ft yakınında Incapacitated
  olmayan bir müttefik varsa. Ek hasar silahın türünde, kritikte zarlar iki kat.
- **Fighter:** Action Surge (2. seviyede 1, 17'de 2): eylemini kullandıktan sonra bir eylem
  daha, turda bir kez; o eylemle büyü (Magic eylemi) yapılamaz. Second Wind: bonus eylem,
  1d10 + seviye HP; 1–3: 2, 4–9: 3, 10+: 4 kullanım. Kullanımlar savaş içinde yenilenmez.
- **Hunter's Mark (Ranger):** bonus eylem, 90 ft, konsantrasyon; işaretli hedefe her saldırı
  isabetinde 1d6 force. Hedef 0 HP'ye düşünce bonus eylemle işaret taşınır. Favored Enemy:
  Hunter's Mark her zaman hazır, slotsuz kullanım 1–4: 2, 5–8: 3, 9–12: 4, 13–16: 5, 17+: 6
  (önce bunlar harcanır; slot seviyesi açıkça istenirse slot).
- **Konsantrasyon:** veride `concentration` işareti (SRD süresi "Concentration" olan büyüler).
  Yeni konsantrasyon büyüsü eskisini bitirir. Hasar alan CON save yapar (DC 10 veya hasarın
  yarısı, en çok 30); başarısızsa biter. 0 HP'ye düşen veya Incapacitated olan yaratığın
  konsantrasyonu biter. Büyünün koyduğu durumlar (Hold Person: Paralyzed, Sleep: Unconscious)
  konsantrasyon bitince kalkar.
- **Spiritual Weapon:** konsantrasyon (5.2.1). Güç hedefin yanında belirir: yakın dövüş büyü
  saldırısı (menzil 60 ft + gücün 5 ft'i; "yanında düşman" dezavantajı yok). Sonraki
  turlarda bonus eylemle güç 20 ft (4 altıgen) uçar ve yanındakine yeniden saldırır. Gücün
  altıgeni hedefin, eski yerine en yakın komşusu. Üst slotta her seviye +1d8.
- **Spirit Guardians:** konsantrasyon, 15 ft yayılım büyücüyle yürür, yalnızca düşmanlar.
  Düşman yayılıma girince, yayılım ona girince (büyücü yürüyünce) ve turunu yayılımda
  bitirince WIS save; 3d8 radiant (iyi/tarafsız büyücü), başarıda yarısı; yaratık turda
  yalnızca bir kez save yapar. Yayılımda hız yarıya iner (altıgen maliyeti iki kat). Büyü
  yapıldığında içindekiler de save yapar (yayılım onların alanına "girer" yorumu; önceki
  davranış korundu). Üst slotta her seviye +1d8.
- **Fırsat saldırısı:** gördüğü bir yaratık kendi hareketiyle erişiminden çıkarken, tepkisi
  duran ve aksiyon yapabilen düşman, hareketten hemen önce en iyi yakın dövüş saldırısıyla
  (karakterde en yüksek ortalamalı yakın dövüş silahı, canavarda save'siz yakın dövüş
  saldırısı) bir kez saldırır; tepki harcanır. Ayrılma (Disengage) yapan tetiklemez. Düşen
  yürüyemez. **Tepkiler otomatik kullanılır** (oyuncuya sorulmaz; arayüzde tepki penceresi yok).
- **Haritasız savaş:** konum olmadığından "yanında" ve "yayılımın içinde" aynı yükseklik
  bandı sayılır: Sneak Attack yandaşı hedefle aynı yükseklikte yakın dövüşçü müttefik;
  Spirit Guardians büyücüyle aynı yükseklikteki düşmanlar; yükseklik değiştiren, aynı
  banttaki düşmanlardan fırsat saldırısı yer (tırmanma başarılıysa, yer değiştirmeden önce).
- **Yapay zekâ:** yaralıyken (HP yarı veya altı) Second Wind; saldırabilecekken önce Hunter's
  Mark, işaretli hedef düşünce işareti taşıma; Spiritual Weapon'ı bonus eylemle önce (turda
  tek slot kuralı: eyleme cantrip kalır), Spirit Guardians en az iki düşmanı alacaksa o
  yeğlenir; sonraki turlarda güçle saldırı. Eylemini harcayıp hâlâ vurabileceği hedef varsa
  Action Surge. Haydut Sneak Attack'ın tuttuğu hedefi ve (yakındaysa) yeri yeğler; fırsat
  saldırısı yiyecek yürüyüşten önce Cunning Action ile ayrılır. Konsantre olan yeni
  konsantrasyon büyüsü yapmaz.
- **Arayüz:** radyal menüde Atılım (Action Surge), Nefes (Second Wind) ve konsantrasyon
  sürdürme (Silah / İşaret: parlayan hedefe dokunulur). Çekmece kalan kullanımları ve
  konsantrasyonu gösterir.

**Kapsam dışı:** Hold Person'ın tur sonu tekrar save'i, 2024 Sleep'in yeni işleyişi (motor
eski HP havuzunu kullanır), Steady Aim ve diğer alt sınıf özellikleri.

## 2026-10-15 — Denge ölçümü altyapısı (Adım 11)

**Karar:**

- **Simülasyon:** `npm run sim -- [savaş sayısı] [senaryo...]` (`src/sim/`). Her senaryo
  1..N tohumlarıyla (mulberry32) oynanır; aynı tohum aynı savaşı verir. İki taraf da
  `battle/ai.ts` ile oynar; 20 turda bitmeyen savaş "berabere" sayılır.
- **Parti (5. seviye, oluşturucu kurallarına uygun):** Bor (Dwarf Fighter, Chain Mail +
  kalkan, Longsword, Light crossbow), Mira (Elf Wizard: Fire Bolt, Ray of Frost, Magic
  Missile, Sleep, Scorching Ray, Hold Person, Fireball), Tavi (Human Cleric: Sacred Flame,
  Guiding Bolt, Healing Word, Cure Wounds, Spiritual Weapon, Spirit Guardians), Sela
  (Halfling Rogue, Rapier, Shortbow), Kael (Elf Ranger, Longbow, Shortsword, Cure Wounds).
- **Senaryolar** XP bütçesiyle (SRD 5.2.1 CR → XP): Düz (haritasız), Çöl gündüz, Volkan,
  Orman, Mağara karanlıkta, Kale gündüz, Taverna masumlarla (masumlar ortada ve parti
  arkasında iki çeşit).
- **Yapay zekâ partiye genişletildi:** ölmekte olan ya da çok yaralı müttefiki iyileştirme,
  en az iki düşmanı vuran ve hiç müttefik vurmayan alan büyüsü, en yüksek ortalama hasarlı
  saldırı (slotlu büyü yalnızca HP'si 12 ve üstü hedefe). Masumlar düşmandan uzaklaşır.
- **Ölçümde bulunan yapay zekâ kusurları düzeltildi:** (1) iki taraf 3/4 siper arkasından
  karşılıklı dezavantajlı atışla kilitleniyordu (Çöl'de savaşların %15'i 20 turda
  bitmiyordu): kötü koşullu atışta (dezavantaj ya da 3/4 siper) önce daha iyi bir yere
  yürür, yoksa yine atar. Ortam her yerde dezavantaj veriyorsa (çöl, orman, mağara, dağ,
  fırtınada yaylar) yakın dövüşe geçer. (2) Atlama kullanmıyordu: Volkan'da kara
  düşmanları adasından çıkamıyordu; artık lav kanalı ve yarık üstünden atlar.
- **Ölçümde bulunan motor hatası:** kendi turunda 0 HP'ye düşen savaşçı (alevli altıgene
  yürüyen masum, tuzağa basan) turunu bitiremiyordu ve savaş kilitleniyordu (arayüzde de).
  Artık 0 HP'deki savaşçı yalnızca turunu bitirebilir. Kaçan masum tehlikeli altıgene girmez.
- **Hız:** yürünebilir altıgenler tek Dijkstra ile (`costsFrom`, `moveCostFn` yürüyüşle
  ortak), yalnızca seçilen yer motorda denenir.
- Sayılar (canavar istatistikleri, senaryo düşmanları) ölçüme göre değiştirilmedi; öneriler
  kullanıcıya soruldu.

## 2026-10-15 — Menü arka planı: açılış videoları

**Karar:**

- Giriş, oyuncu, oluşturucu, GM kurulum ve durum ekranlarının arka planı `public/acilis/`
  altındaki video ve posterler: geniş/yatay ekranda `acilis-pc-*`, dikey ekranda
  `acilis-mobil-*` (`(orientation: portrait)` medya sorgusu, döndürünce değişir); açık temada
  `*-light`, koyuda `*-dark` (otomatik temada sistem ayarı; tema değişince arka plan da değişir).
- `<video autoplay muted loop playsinline>`, poster `.webp`, `object-fit: cover`; üstte
  okunaklılık degradesi (açıkta beyaz %20→%40, koyuda koyu %30→%60; gerçek videolarla
  denendi, önceki %35→%55 açık temada görseli fazla soldurdu), kart ve formlar kendi yarı
  saydam panellerinde. Panel dışında kalan alt başlık ve çerçeveli (ghost) düğmeler de panel
  zemini alır (açık temada dikey telefonda vitray üstünde okunmuyordu).
- "Hareketi azalt" açıksa veya "Efektleri kapat" seçiliyse video yok, yalnızca poster.
  Video yüklenemezse (dosya yok, tarayıcı H.264 oynatamıyor) poster; poster de yoksa düz renk.
- Haritalı savaş ekranında arka plan bileşeni hiç yok (video çözülmez).
- Önceki yer tutucu arka planlar (`public/backgrounds/`) silindi. Eski arena videosu repoda ve
  uygulamada yoktu, dokunulmadı.

## 2026-10-15 — Haritada düşman yapay zekâsı (Adım 9)

**Karar:**

- **Adım adım tur:** `src/battle/ai.ts` sırası gelen düşman için bir sonraki komutu seçer;
  "Düşmanı oynat" turu, `end_turn` gelene kadar (en çok 6 komut) oynar. Her komuttan sonra
  durum yeniden okunur (zar sonuçları sonraki kararı etkiler).
- **Sıra:** (1) batağa saplandıysa Çık; (2) bulunduğu yerden saldırabiliyorsa saldırır;
  (3) saldıramıyorsa saldırabileceği en ucuz ve en güvenli altıgene yürür ve saldırır;
  (4) o da yoksa en yakın hedefe mesafeyi kısaltan güvenli altıgene yaklaşır; (5) turu
  bitirir. Eylemi harcandıysa yürümez, turu bitirir (geri çekilme yok).
- **Saldırı önceliği:** yenilenen (Recharge) save saldırısı > Multiattack > ilk uygun saldırı.
  Menzilli saldırısı olan (Goblin Warrior) yerinden ateş eder. Hedef: en yakın, eşitse HP
  oranı düşük parti üyesi (masumlar dahil); gizlenmiş veya karanlıkta görülmeyen hedef
  seçilmez.
- **Kaçındıkları:** alev, batak, buz, bilinen tuzak (yürüme zaten önce bunlardan geçmeyen yolu
  seçer), lav uyarısı olan altıgen (+100), lav kenarı (+8, lav kenarı kuralı varsa).
  Gönüllü lava girmek motorda zaten yasak. Uçan yaratık zeminden etkilenmez.
- **Kural kopyalanmaz:** yürünebilir altıgenler ve saldırının yapılıp yapılamayacağı motorda
  zarsız denenerek bulunur (menzil, görüş, siper, eylem ekonomisi aynen geçerli).
- **Haritasız savaş** eski davranış: en düşük HP oranlı hedefe saldırı.
- **Yok (sonraya):** konum taktiği (siper arkası, yükseklik arama, kuşatma), masum-öncelikli
  düşmanlar, büyü yapan düşman, geri çekilme ve Dash/Disengage kullanımı.

## 2026-10-15 — Kart savaşı arayüzü kaldırıldı; haritasız motor yolu testler için duruyor

**Karar:**

- Giriş ekranındaki "Hızlı demo" ve "Kart savaşı" düğmeleri, kart savaşı ekranı
  (`CardBattle`, kartlar, sekmeler), harita seçici (`MapPicker`), haritalı ekranın ≡
  menüsündeki "Kart savaşı" ve yalnızca bunlara ait stiller silindi. Kullanılmayan arayüz
  yardımcısı `src/ui/actions.ts` (kart ekranının eylem listesi) ve testleri de silindi.
- **Motor değişmedi:** haritasız savaş desteği (soyut yükseklik, `change_height`) ve testleri
  duruyor. `src/demo.ts` (Mira, Bor, Troll, Wolf; `createDemoSession`, `createMapSession`)
  testlerde fixture olarak ve oluşturucunun örnek karakterleri için kalıyor; arayüze ait
  senaryo etiket listesi silindi.
- **Hızlı denemenin yerine** GM ekranında "Hazır savaş": örnek karakterleri (kayıtlı değilse
  ekler) partiye, Çöl haritasını (Gündüz) ve bir Troll ile iki Wolf'u seçili getirir; GM
  "Savaşı kur" ile tek tıkla kurar.

## 2026-10-15 — Bütünleşik uygulama (Adım 13, C)

**Karar:**

- **Giriş ekranı, iki rol, tek cihaz:** Oyuncu ve GM düğmeleri yalnızca hangi ekranın
  açılacağını seçer; kimlik/oturum yok (online sonra). Ayrıca hızlı demo (Mira ve Bor),
  kart savaşı ve Durum.
- **Karakter oluşturucu** (React, tek uzun form): kimlik ve avatar, tür (miras) ve sınıf,
  skorlar (standart dizi veya point buy 27 puan, 8–15), geçmiş bonusu (+2/+1 veya
  +1/+1/+1, skor seçiminin yanında), sınıf becerileri (SRD sayı ve listesi) ve geçmiş/tür
  becerileri (en çok 3), zırh, kalkan, silah, eşya, büyüler (sınıf listesi ve slot
  seviyesine göre). Sağda türetilen değerler ve sorunlar canlı; sorun varken kaydedilmez.
  Kurallar `src/rules/builder.ts`'te (saf, testli). Geçmiş ve köken yetenekleri (origin feat)
  ayrı seçim olarak yok; geçmiş yalnızca bonus ve beceri olarak giriliyor.
- **Kayıtlı karakterler** tarayıcı belleğinde (bu cihaz). Yoksa yalnızca oturumda kalır.
  "Örnek karakterleri ekle": Mira ve Bor'un kurallara uyan kopyaları (standart dizi; Mira'da
  Cure Wounds yok, wizard büyüsü değil). Hızlı demodaki Mira ve Bor değişmedi (denge ölçümü
  onlarla yapıldı).
- **GM ekranı:** parti seçimi (hazır karakterler), canavar listesi ve adet, özel canavar
  (ad, AC, HP, hız, tek saldırı: bonus, hasar zarı, tür, yakın/menzilli 80/320), harita,
  varyant, aynalama, isteğe bağlı kurallar ve masum sayısı. Sorunlar (boş parti, düşman yok,
  başlangıç bölgesine sığmıyor) çözülmeden kurulmaz. Kurulan savaş haritalı ekranda açılır;
  herkes otomatik yerleşir, GM "Savaşı başlat" der.
- **Düşman turları:** sırası düşmandayken sağ altta "Düşmanı oynat": mevcut basit yapay zekâ
  (hedef seçer, saldırır, turu bitirir). Haritada yürüme ve menzil düşünmüyor; erişimde
  değilse yalnızca turu bitirir. Haritalı yapay zekâ Adım 9.
- **Savaş sonu özeti:** kazanan, tur sayısı ve savaşçı başına verilen/alınan hasar,
  iyileştirme, düşürme, son HP (olaylardan hesaplanır; harita etkilerinin hasarı "aldığı"na
  sayılır, kimsenin "verdiği"ne değil).
- **Durum sayfası:** `docs/harita/GOREV.md`'nin "Adımlar" bölümü okunur; satırın sonunda
  "(tamam)" olan adımlar tamam sayılır. Adım bitince yalnızca bu işaret eklenir.

## 2026-10-15 — Harita efektleri (Adım 10c, B)

**Karar:**

- **Veri güdümlü:** her varyantta `effects` listesi: `type`, `intensity` (0–1), isteğe bağlı
  `color` ("#rrggbb") ve `points` (görsel pikseli, 1280×715; aynalı haritada yatay çevrilir).
  19 tür: rain, lightning, waveGlint, waterSparkle, fog, bubbles, fireflies, sparks, snow,
  iceGlint, dust, lightShafts, leaves, flicker (meşale/şömine), crystalFlicker, drip,
  heatHaze, sandstorm, lavaGlow. Yükleyici türü, yoğunluğu, rengi ve noktaları doğrular.
- **Zemine bağlı türler** `points` verilmezse ilgili harflere oturur: dalga parıltısı `w`, su
  parıltısı `w n`, kabarcık `b n`, ateşböceği `b g a`, kıvılcım `~ f`, buz parıltısı `i q`,
  titreme `f`, kristal `e`, damlama `v e`, lav parıltısı `~`. Lav yükselince lav parıltısı
  yeni lav altıgenlerine geçer. Diğerleri bütün görsele yayılır.
- **Meşale/fener/şömine konumları** görsellerden piksel olarak alındı (zindan 6, kale gece 9,
  şehir gece 7, taverna şömine + 9 mum). Görsel değişirse yalnızca `points` güncellenir.
- **Varyantlar:** ada/gemi fırtına: yağmur + şimşek + dalga; ada/gemi güneş: su parıltısı;
  bataklık: sis + kabarcık + ateşböceği; mağara: kristal + damlama; zindan: meşale + toz;
  kale ve şehir gece: meşale/fener; kale ve şehir gündüz: hafif toz; buzul: kar + buz
  parıltısı; dağ: sis; orman: ışık huzmesi + yaprak; taverna: şömine + mum + toz;
  çöl gündüz: sıcak dalgası + toz; çöl akşam: kum fırtınası + toz; volkan: lav parıltısı +
  kıvılcım + sıcak dalgası.
- **Performans:** canvas, görselin dörtte biri çözünürlükte (320×179) çizilir ve CSS ile
  büyütülür (piksel görünüm); en çok 30 kare/sn; sekme gizliyken çizmez; parçacık sayısı
  yoğunlukla ölçeklenir (en çok ~320). Katman harita görseliyle altıgen/jeton katmanı
  arasındadır, dokunmayı engellemez.
- **Erişilebilirlik:** sistemde "hareketi azalt" açıksa efektler varsayılan kapalı; ≡
  menüsünde "Efektleri kapat/aç" (cihazda hatırlanır). Efektler yalnızca görünüştür,
  kurallara dokunmaz (prototipteki SVG ısı bozulması filtresi kullanılmadı: telefonda pahalı).

## 2026-10-15 — Tema ve menü arka planı (A)

**Karar:**

- **Tema:** varsayılan sistem ayarı (`prefers-color-scheme`). Düğme sırayla otomatik → açık
  → koyu; seçim `<html data-theme>` ile CSS'e geçer, cihazda hatırlanır (tarayıcı belleği
  yoksa yalnızca oturumda). İlk çizimden önce uygulanır. Düğme harita seçiminde, kart
  ekranında ve haritalı ekranın ≡ menüsünde.
- **Arka plan:** menü ve oluşturucu ekranlarında (`.menu-screen`) tek açık ve tek koyu görsel:
  `public/backgrounds/menu-light.webp` ve `menu-dark.webp` (1280×720, ~7 KB yer tutucu,
  piksel desen). Görseli değiştirmek için aynı adla dosyayı koymak yeterli; kod değişmez.
  Haritalı savaş ekranı kendi harita görselini kullanır, temadan etkilenmez (yüzen arayüz
  her iki temada koyu).

## 2026-10-15 — Harita kuralları (Adım 8c: karanlık, mazgal, kapı, masumları koru)

**Karar:**

- **Karanlık (`darkness`):** hedef aydınlık altıgendeyse görülür; değilse görüş mesafesi
  karanlık görüşü olan için `darkvisionHexes` (12), olmayan için `unlitSightHexes` (3).
  Karanlık görüş evet/hayır: ırktan (`races.json`) ve canavardan (`monsters.json` →
  `darkvision`, SRD 5.2.1 Senses satırı); mesafe kuralın değeri (yaratığın 120 ft'i
  sayılmıyor). Işık: kuraldaki `lights` ve ışık veren zemin (kristal `e`), yarıçap
  `lightRadiusHexes`. Görülmeyen hedef seçilemez; hedefin göremediği saldıran avantajlı.
  Zindan ve gece şehrinde karanlık isteğe bağlı; bu iki etkinin bayrakları JSON'a eklendi
  (mağaradakiyle aynı). **Veri sorunu:** mağaradaki 10 ışık 4 yarıçapla haritanın tamamını
  aydınlatıyor, yani mağarada karanlık şu an hiçbir şey değiştirmiyor. Öneri: ışık
  yarıçapını 2 yapmak veya ışık sayısını azaltmak (kullanıcı kararı).
- **Mazgal (`crenel`):** `fromTerrain` (sur `h`, kule `z`) üstündeki hedefe daha alçaktan
  menzilli saldırıda 3/4 siper (+5 AC); yakın dövüşte yok.
- **Kapı (`gate`):** GM açar/kapatır (`gate` komutu); kapalı kapı yeni katalog harfi `O`
  (geçilmez, görüşü keser), altında biri varken kapanmaz. Kapalı kapı silahla kırılır
  (`attack_gate`, Attack eylemi gibi Extra Attack'tan düşer): AC 15'e karşı saldırı zarı,
  hasar kapının 30 HP'sinden düşer, 0'da kırılır ve bir daha kapanmaz.
- **Masumları koru (`objective`, isteğe bağlı):** kurulumda açılınca 4–6 masum eklenir
  (kuraldaki HP 4, AC 10, 6 altıgen hız, silahsız). GM yönetir ve yerleştirir (düşman
  bölgesi dışında tehlikesiz bir altıgen). 0 HP'de ölür (ölüm save'i yok). Masumlar partiyi
  ayakta tutmaz; hayatta kalan masum `minSurvivorsRatio` (yarısı, yukarı yuvarlanır) altına
  düşünce düşmanlar kazanır.
- **Yürüme yolu:** önce alev, batak, buz ve bulunmuş tuzaktan geçmeyen yol aranır; yoksa en
  ucuzu. Hedefin kendisi tehlikeli olabilir (bilerek girilir).
- **Harita ekranı:** kurulumda isteğe bağlı kurallar (Karanlık, Masumları koru ve masum sayısı)
  seçilir; masumlar ortaya yakın yerleşir, GM taşıyabilir. ≡ menüsünde haritaya göre GM
  olayları (patlama: altıgene dokun, lav yükselmesi, dalga, kapıyı aç/kapat). Lav uyarısı
  kırmızı yanıp söner, bulunmuş tuzak ⚠, karanlık altıgenler koyu. Batağa saplanana yüzen
  menüde "Çık", yanında saplanmış müttefik olana "Çek". Saldır kipinde kapalı kapıya dokununca
  silahla "Vur" balonu. Masumları korurken sol üstte "Hayatta kalan masum: x/n".

## 2026-10-15 — Harita kuralları (Adım 8b: batak, su, buz, soğuk, tuzak)

**Karar:**

- **Batak (`bog`, `b`):** girmek `moveCostPerHex` (3) altıgen; girince Poisoned, batma sayacı
  `onEnter.sinkCounter` (1) ve yürüyüş biter. Saplanan yürüyemez ve atlayamaz. Kendi turunun
  başında 1d6 zehir ve sayaç +1; sayaç `drownAtCounter` (3) olunca boğulur: HP 0 (oyuncu ölüm
  save'lerine başlar). **Çık** (`escape`, eylem): Athletics DC 12; başarıda en yakın sağlam ve
  boş altıgene çıkar. **Çek** (`pull`, eylem): bitişik müttefik, çekenin Athletics DC 12'si;
  çekilen, çekene yakın sağlam altıgene çıkar. Çıkınca **kalıcı zehir**: tur başı 1d4, tur sonu
  CON DC 12 başarılıysa biter ve Poisoned kalkar (Lesser Restoration ile bitirme elle).
- **Derin su (`deepWater`, `w`) ve hendek (`moat`, kale `n`):** ağır zırhlı, kendi turunun
  başında Athletics DC 12; başarısızsa batma sayacı +1, `drownAfterRounds` (3) olunca boğulur.
  Başarı sayacı düşürmez; sudan çıkınca sıfırlanır. Hendek kuralına JSON'da aynı parametreler
  eklendi (önceden yalnızca not vardı).
- **Buz (`ice`, `i`):** girince DEX DC 10; başarısızsa Prone ve bu turun hareketi biter.
- **Soğuk (`cold`):** tur sonunda barınakta değilse CON DC 12, 1d4 soğuk. Barınak: gölge veren
  zemin (altıgen veya komşu) ya da yanında daha yüksek zemin.
- **Tuzak (`trap`, `j`):** basan DEX DC 13, başarısızsa 2d6 delici; yürüyüş orada biter; bir
  kez çalışır. Ara (Search) toplamı Perception DC 13'ü geçerse 6 altıgen içindeki tuzaklar
  bulunur (harita ekranında gösterilecek). Bulunmuş tuzağa basan yine tetikler.

## 2026-10-15 — Harita kuralları motoru (Adım 8a: çatı, çöl, volkan, tırmanma)

**Karar:**

- **Kurallar veri:** Varyantın `rules` listesi; DC, hasar, tur sayısı JSON'dan okunur (eksik
  parametre hata verir, kodda varsayılan yok). `src/battle/maprules.ts` dört kancada çalışır:
  tur başı (sırası gelen), tur sonu (sırası biten), altıgene giriş (yürürken her adım),
  saldırı (menzil denetiminde). Yeni tura geçiş ayrıca bir kanca (lav yükselmesi).
- **Olaylar:** `map_effect` (save/beceri zarı, hasar, durum, sayaç, yer değiştirme, hareketi
  bitirme), `tile_changed`, `lava_warning`, `map_note`. Hasar direnç/bağışıklık ve 0 HP
  kurallarından (ölüm save'i, Undead Fortitude, yenilenme) geçer.
- **GM tetiklemeli:** `map_trigger` komutu: `eruption` (merkez altıgen; herkese aynı 4d6, DEX
  save'de yarısı), `lavaRise` (`startRound`'dan önce reddedilir; lava bitişik kara altıgenleri
  uyarılır, bir sonraki tur başında lav olur, üstündeki uçmayan ölür), `swell` (gemi fırtına:
  herkes DEX save, başarısızsa Prone). `everyRounds` aralığını GM izler (zorlanmıyor).
- **İsteğe bağlı edilgen kurallar** (`optional: true`, tetiklemesiz: karanlık, masumları koru)
  kurulumda `MapState.options` ile açılır; kapalıysa hiç çalışmaz.
- **Çöl gündüz (`heat`):** ağır zırhlı ve gölgesizse tur sonunda CON save. Gölge: altıgen veya
  komşusu gölge veren zemin (`r`, `c`, `k`). Ağır zırh `Combatant.heavyArmor` (zırh türünden).
- **Çöl akşam (`sandstorm`), fırtına (`storm`):** görüş sınırı dışındaki hedef seçilemez;
  4 altıgenden uzağa menzilli saldırı dezavantajlı; kum fırtınasında gizlenme zarı avantajlı.
  Fırtınadaki "ateş büyüsü dezavantajı" fırtına ortamından (`environments.json`) zaten geliyor.
- **Lav kenarı (`lavaEdge`):** lava bitişik altıgende tur başında 1d6 ateş, save yok; uçan
  etkilenmez. **Alev (`f`):** girince ve turu içinde bitirince 1d6 ateş (her haritada, zemin
  kataloğundan).
- **Tırmanma (`climb`):** yükseğe geçerken çıkılan her seviye için `heightDiffCost` (2) altıgen,
  zemin maliyetinden büyükse o; inmek normal. Uçan yaratık etkilenmez. Atlama inişinde yok.
- **Yürüyüş adım adım:** girilen altıgenin kuralı yürüyüşü kesebilir (buz, batak, tuzak, 0 HP);
  o zaman yalnızca o ana kadarki yol ve maliyet yazılır.

## 2026-10-15 — Tur içi eylem ekonomisi (Adım 5d)

**Karar:**

- **Bir eylem, bir bonus eylem, bir tepki ve hareket** (SRD 5.2.1). `Combatant.economy` neyin
  harcandığını tutar. Eylem, bonus eylem, kalan saldırılar, koşma ve ayrılma kendi turunun
  başında yenilenir; tepki de kendi turunun başında (turlar arası bir tepki).
- **Eylem harcayanlar:** silah saldırısı (Attack), canavar saldırısı, Multiattack (tek eylem),
  eylem süreli büyü, Hide, Search, Dash, Disengage, stabilize. Hareket, yükseklik değiştirme
  (haritasız) ve turu bitirme eylem harcamaz. GM'in beceri kontrolü ve kurulum da harcamaz.
- **Extra Attack:** Attack eylemi `attacksPerAction` saldırı içerir (Fighter 5/11/20: 2/3/4;
  Barbarian, Monk, Paladin, Ranger 5: 2). İlk saldırı eylemi harcar, kalanlar aynı eylemden
  düşer; arada yürünebilir. Canavarlar Multiattack ile tek eylemde çok saldırır.
- **Büyü süresi:** `spells.json` → `castingTime` (SRD 5.2.1 Casting Time): 65 eylem, 14 bonus
  eylem (Healing Word, Misty Step, Spiritual Weapon, Shield of Faith, Hunter's Mark, Hex…),
  3 tepki (Shield, Counterspell, Hellish Rebuke). Tepki büyüleri başkasının turunda da
  yapılabilir (etkileri hâlâ elle uygulanır). **Turda yalnızca bir büyü slotu harcanır**
  (SRD 5.2.1 kuralı; 2014'teki "bonus eylem büyüsünden sonra yalnızca cantrip" kuralı yok).
- **Bonus eylemle Hide/Dash/Disengage:** Rogue 2. seviye (Cunning Action) ve Goblin Warrior
  (Nimble Escape: Disengage, Hide). Arayüz, bonus eylem duruyorsa bunları bonusla yapar ki
  eylem saldırıya kalsın.
- **Dash:** bu tur hız bir kez daha eklenir (uçan yaratıkta uçuş hızı).
- **Olay:** başarılı komutun olaylarının ardına `action_used` eklenir (günlükte yalnızca bonus
  eylem ve tepki yazılır); başarısız komut hiçbir şey harcamaz.
- **Arayüz:** kart ekranında harcanmış eyleme bağlı seçenekler nedeniyle devre dışı; harita
  ekranında yüzen menüye Koş ve Ayrıl eklendi, altta bu turun eylem/bonus/tepki/hareket şeridi.
- **Yok (sonraya):** fırsat saldırısı (Disengage şimdilik yalnızca işaret), iki silahla dövüş
  (Light silahla bonus saldırı), Action Surge, Help ve Ready eylemleri.

## 2026-10-15 — Beceri yetkinlikleri (Adım 5c)

**Karar:**

- **18 SRD becerisi** (`src/rules/skills.ts`), her biri bir ability'ye bağlı. Beceri bonusu =
  ability modifier + proficiency (yetkinse), uzmanlıkta (Expertise) 2 × proficiency.
- **Karakter formu:** `skills` (yetkin olunan bütün beceriler) ve `expertise`. Kaynakları
  (sınıf, geçmiş, tür) ayrı tutulmuyor; form yalnızca adları, tekrarı ve "uzmanlık yalnızca
  yetkin olunan beceride" kuralını denetler. Sınıfın 1. seviye seçimi (sayı ve liste)
  `classes.json` → `skillChoices` alanında, SRD 5.2.1 sınıf tablolarından; oluşturucu
  `classSkillProblem` ile denetleyecek (Adım 13). Uzmanlık sayısı sınıfa göre denetlenmiyor.
- **Canavarlar:** SRD 5.2.1 stat bloklarındaki Skills satırı `monsters.json` → `skills`
  (toplam bonus). Olmayan becerinin bonusu ability modifier'ı. Örnek: Wolf Perception +5,
  Stealth +4; Troll Perception +5; Goblin Warrior Stealth +6.
- **Savaşta:** `Combatant.skills` yalnızca yetkin olunan becerileri tutar, `skillBonus` eksikte
  ability modifier'ına düşer (eski kayıtlar ve test savaşçıları bozulmaz). Gizlenme Stealth,
  arama Perception kullanır. Haritasız savaştaki tırmanma kontrolü (`climbMod`) artık
  Athletics ile Acrobatics'in yükseği (önce STR/DEX modifier'ının yükseğiydi).
- **GM beceri kontrolü:** `skill_check` komutu (yalnızca GM, sıra beklemez, durumu
  değiştirmez) ve `skill_checked` olayı. Ağır zırh Stealth'te dezavantaj. Adım 8'de bataklık
  (Athletics DC 12) ve tuzak (Perception DC 13) aynı yardımcıyı (`rollSkillCheck`) kullanacak.
- **Demo:** Mira (Wizard, Sage, Elf): Arcana, Investigation, History, Insight, Perception.
  Bor (Fighter, Soldier): Athletics, Perception, Intimidation, Survival. Geçmişle çakışan
  beceri yerine başka biri seçildi (SRD kuralı).
- **Yok:** Pasif Perception (SRD 5.2.1 Hide kuralında bulunma yalnızca Search ile), Jack of
  All Trades, Remarkable Athlete gibi sınıf özellikleri.

## 2026-10-15 — Harita içi arayüz (HUD) ve avatarlar (Adım 10b)

**Karar:**

- **Tam ekran, kaydırma yok:** Harita görsel oranını koruyarak pencereye sığdırılır; 10a'daki
  yakınlaştırma ve kaydırma kaldırıldı. Telefon yatayda (844×390) altıgen ~52 px yüksekliğinde.
  Üstteki sekmeler haritalı ekranda yok; kart savaşına sol üstteki ≡ menüsünden geçilir.
- **Yüzen eylem menüsü:** Sırası gelenin jetonunun çevresinde 56 px yuvarlak düğmeler
  (Hareket, Saldır, Büyü, Gizlen, Ara, Turu bitir). Düğmeler, sahnenin içinde kalan açılar
  arasından jetondan ortaya bakan yöne en yakın yaya dizilir; sığmazsa yarıçap büyür. Menü
  dokununca kapanmaz; jetona dokunmak menüyü açıp kapatır. Bir kipten çıkınca veya bir eylem
  yapılınca menü yeniden açılır. Yürüme 10a'daki gibi yeşil altıgene dokunarak.
- **Saldırı ve büyü akışı:** Saldır → vurulabilecek düşmanlar parlar → hedefe dokun → yanında
  balon (her saldırı için mesafe, siper, yükseklik, avantaj/dezavantaj) ve "Vur". Büyü →
  büyü listesi balonu → tek hedefli büyüde aynı akış ("Yap"), alan büyüsünde altıgene dokun,
  alan boyanır, balonda etkilenenler ve "Yap". Hedefsiz (elle uygulanan) büyü doğrudan yapılır.
- **Günlük ve toast:** Yeni günlük satırlarından son ikisi ve hatalar sol altta 4 sn toast
  olarak görünür (en çok 2 satır). "Günlük" düğmesi tam günlüğü açar.
- **Sıra şeridi ve çekmece:** Üstte avatarlı ince sıra şeridi; sırası gelen sarı halkalı, düşen
  soluk. Bir avatara dokununca sağdan karakter çekmecesi (HP, AC, hız, save'ler, saldırılar,
  büyüler, slotlar, durumlar).
- **Avatar:** `Combatant.avatar = { src, bg, label }`. Karakterde yol
  `avatars/<ırk>-<sınıf>-<erkek|kadin>.webp` (karakter sayfasında `gender`, yoksa `erkek`;
  `avatar` alanı verilirse o), canavarda `avatars/canavar-<id>.webp` (veya `avatar` alanı).
  Dosyalar `public/avatars/` altında, kare 256×256 WebP. Görsel tarayıcıda yüklenmeye çalışılır;
  yoksa ırk rengi zemin üstünde sınıfın iki harfi (Wi, Fi…) veya canavar adının baş harfleri.
  Jetonda çerçeve rengi tarafı gösterir (parti yeşil-mavi, düşman kırmızı). Henüz hiç avatar
  görseli yok; hepsi yer tutucu.
- **Testler:** Yerleşim (menü yayı, balon), parlayan hedefler ve büyü listesi saf fonksiyonlar
  olarak `src/ui/hud.ts`'te; testleri görselsiz.

## 2026-10-15 — Animasyon en sona bırakıldı

**Karar:** Saldırı ve büyü animasyonları en son adım (Adım 12). Önce kurallar, yapay zekâ ve
denge bitecek; animasyon olayların üstüne ayrı bir katman olarak eklenecek (olay kaydı zaten
her vuruşu, save'i ve hareketi içeriyor).

## 2026-10-15 — Haritalı savaş ekranı (Adım 10a)

**Karar:**

- **Izgara görselin pikselinde:** Görsel 1280×715; altıgen yarı genişliği görsel genişliği/23,
  yüksekliği görsel yüksekliği/7,5 (prototip ve `ver_*.jpg` önizlemeleriyle aynı yerleşim).
  Altıgenler bu yüzden tam düzgün değil, görsele oturuyor. SVG içinde çizilir; görsel
  `image-rendering: pixelated`, aynalı haritada görsel yatay çevrilir.
- **Boyut ve kaydırma:** Altıgen yüksekliği en az 44 px olacak şekilde harita en az ~591 px
  genişlikte; yakınlaştırma (+/−, 1×–3×) ve kaydırma (taşan kutunun kendi kaydırması) basit
  tutuldu. Dar dikey ekranda "yatay çevirin" notu.
- **Kurallar kopyalanmadı:** Yürünebilir ve atlanabilir altıgenler motorun `move`/`jump`
  komutları her altıgende denenerek bulunur (zar atmadıkları için yan etkisiz); saldırı
  önizlemesi motorun menzil/siper/görüş denetimini (`checkReach`) ve yüksekliği kullanır;
  alan önizlemesi `areaHexes`. Böylece ekran ve motor aynı sonucu verir.
- **Demo:** Haritalı savaş Mira, Bor, Troll ve iki Wolf ile kurulur; herkes kendi başlangıç
  bölgesine (haritanın ortasına yakın altıgenler önce) otomatik yerleşir, kurulumda jetona ve
  sonra kendi bölgesinde bir altıgene dokunarak değiştirilir; GM "Savaşı başlat" der.
- **Tek cihaz:** Mevcut kart ekranı gibi herkes (düşmanlar dahil, GM olarak) aynı ekrandan
  yönetilir. Düşman yapay zekâsı haritada henüz hareket etmediği için (Adım 9) haritalı
  ekranda otomatik düşman turu yok.
- **Eski ekran duruyor:** Üstte "Haritalı savaş" (varsayılan) ve "Kart savaşı" sekmeleri.

## 2026-10-15 — Alan şekilleri ve patlama noktası (Adım 5b)

**Karar:** (yalnızca haritalı savaş; haritasız savaşta alan büyüleri eskisi gibi tek hedefe)

- **Veri:** Büyülere `area` alanı (SRD 5.2.1 açıklamalarından): şekil, boyut (ft), çıkış
  (`point` seçilen nokta / `self` büyücü), etkilenenler (`all` herkes / `enemies` büyücünün
  seçtiği düşmanlar). Küre: Acid Splash 5, Shatter 10, Fireball 20, Stinking Cloud 20,
  Moonbeam 5 (silindir), Call Lightning 5 (noktanın 5 ft çevresi), Sleep 5 (yalnızca
  düşmanlar). Küp: Web 20, Hypnotic Pattern 30, Entangle 20 (20 ft kare), Thunderwave 15
  (büyücüden). Koni: Burning Hands 15, Fear 30. Çizgi: Lightning Bolt 100 ft × 5 ft.
  Yayılım: Spirit Guardians 15 (yalnızca düşmanlar).
- **Altıgende şekiller** (`src/rules/area.ts`, 1 altıgen = 5 ft): küre = merkezden
  yarıçap/5 altıgen; küp = kenar/10 (aşağı) yarıçaplı öbek (kare ızgaradaki küpe en yakın
  altıgen karşılığı; büyücüden çıkan küpün merkezi hedef yönünde kenar/10 (yukarı) altıgen
  ileride, büyücü dahil değil); koni = uzunluk/5 altıgen içinde, hedef yönüyle en fazla 30°
  açı yapan altıgen merkezleri (5e: koninin genişliği uzaklığa eşit; 15 ft koni 7
  altıgen); çizgi = hedef yönünde uzunluk/5 altıgen, 1 altıgen genişliğinde; yayılım =
  büyücünün çevresinde boyut/5 halka, büyücü dahil değil.
- **Hedef altıgen:** `cast_spell` komutu `targetHex` alır (arayüzde Adım 10'da altıgene
  tıklanarak seçilecek); verilmezse `targetId`nin altıgeni kullanılır. Noktadan çıkan
  alanlarda nokta menzil içinde ve büyücünün görüşünde olmalı, duvar/ağaç/dış kayalık
  içinde olamaz. Büyücüden çıkan alanlarda nokta yalnızca yön verir (menzil sınırı yok,
  büyücünün kendi altıgeni seçilemez). Bir yaratık hedef verilmiş ama alanın dışında veya
  tam siper arkasındaysa komut reddedilir.
- **Etkilenenler:** Alandaki bütün yaratıklar (büyücü ve müttefikler dahil; Fireball
  büyücüyü de yakar), "yalnızca düşmanlar" büyülerinde yalnızca karşı taraf. Gizlenmiş
  yaratıklar da etkilenir.
- **Siper ve görüş patlama/çıkış noktasından:** Noktadan hedefe çizgi; arada görüşü kesen
  zemin varsa (tam siper) o yaratık etkilenmez; aradaki zemin ve yaratıklardan gelen siper
  DEX save'ine eklenir. Patlama hedefin kendi altıgenindeyse siper yok. Büyücüden çıkan
  alanlarda çıkış büyücünün altıgeni.
- **Hasar bir kez atılır:** Save'li alan etkisinde hasar bütün hedefler için bir kez atılır,
  her hedef ayrı save yapar (SRD 5.2.1 "Saving Throws and Damage").
- **Uyku:** Zar toplamı (5d8) alandaki düşmanları en düşük HP'den başlayarak uyutur
  (motorun mevcut uyku kuralı alana genişletildi).
- **Kapsam dışı:** Kalıcı alanların sonraki turlardaki etkisi (Web, Entangle, Moonbeam,
  Stinking Cloud, Spirit Guardians, Call Lightning) şimdilik yalnızca büyü yapıldığı an
  uygulanıyor; tur başı/sonu etkileri ayrı iş. Faerie Fire, Slow gibi alanlı ama elle
  uygulanan (utility) büyülere alan bağlanmadı.

## 2026-10-15 — Adım 7 sonrası kullanıcı kararları ve yeni adımlar

- **Gizlenme yeri altıgene bağlı kalır** (SRD'nin ağır karanlık/3/4 siper şartı yerine).
- **Adım 5c — beceri yetkinlikleri** (5b'den sonra, Adım 8'den önce): Stealth, Perception,
  Athletics vb. yetkinlikler ve yetkinlik bonusunun kontrollere eklenmesi. `bog`
  (Athletics DC 12), `trap` (Perception DC 13) ve `stealth` buna bağlı.
- **Adım 5d — eylem ekonomisi** (Adım 11'deki denge ölçümünden önce, mümkünse Adım 8'den
  önce): eylem, bonus eylem, tepki, hareket; saldırı, büyü, gizlenme, arama, koşma ve
  ayrılma eylem harcar; Extra Attack ve Multiattack tek eylem. Eylem ekonomisinin olmaması
  ciddi bir açık olarak kayda geçti.
- **Sonraya kalanlar:** Büyü bileşenleri; yalnızca V bileşenli büyü gizlenmeyi bozsun
  (şu an her büyü bozuyor). GOREV.md "Sonraya kalanlar" listesinde.

## 2026-10-15 — Gizlenme (Adım 7)

**Kaynak:** SRD 5.2.1 Hide eylemi (DC 15 Dexterity (Stealth); toplam, bulmak için gereken
Wisdom (Perception) DC'si olur; saldırınca veya büyü yapınca biter) ve zırh tablosunun
Stealth sütunu (PDF s. 92).

**Karar:**

- **Genel mekanik — gizlenme yeri:** Altıgen gizlenme yeriyse `hide` komutu denenebilir.
  Gizlenme yeri iki kaynaktan gelir: zemin kataloğundaki `hide: { bonus }` (kum tepesi `d`
  +0, çalılık/sazlık `g` +2; her haritada geçerli) ve haritanın JSON'daki `hideTerrain`
  listesi (harf → bonus). Çöl, açık kumu (`.`) böyle gizlenme yeri yapar; aynı harf başka
  haritada (Volkan'da bazalt zemin) gizlenme yeri değildir. Ormandaki "ağacın yanında
  gizlenme" ve fırtınadaki avantaj gibi haritaya özel kurallar Adım 8'de `stealth` ve
  `sandstorm` kurallarıyla bağlanacak.
- **Zar:** d20 + DEX modifier'ı + zemin bonusu, DC 15. Başarılıysa toplam bulunma DC'si olur.
  Motor beceri yetkinliği tutmadığı için Stealth ve Perception yalnızca yetenek modifier'ı.
- **Zırh:** Stealth dezavantajı SRD zırh tablosundan (`stealthDisadvantage`): bizdeki
  zırhlardan Half Plate Armor, Chain Mail ve Plate Armor. GOREV.md "ağır zırh" diyordu;
  SRD'de orta zırhlardan Half Plate da dezavantajlı, ağırlardan hepsi.
- **Gizlenmenin şartı:** SRD'deki "ağır karanlık veya 3/4 siper ve düşmanın görüşü dışında
  olma" şartı yerine gizlenme yeri kullanılır (kumun altına girmek, çalılığa saklanmak).
- **Gizlenmiş yaratık:** Düşmanlarca hedef alınamaz (silah, büyü, canavar saldırısı; hata
  mesajıyla reddedilir); müttefikler hedef alabilir (iyileştirme gibi). Saldırı zarında
  avantaj alır ("Gizlenmiş saldıran"). Saldırınca, büyü yapınca, yürüyünce veya atlayınca
  ortaya çıkar (`revealed` olayı). Büyü bileşenleri veride olmadığı için her büyü ortaya
  çıkarır. Düşman yapay zekâsı gizlenmiş karakteri hedef seçmez.
- **Arama:** `search` komutu: d20 + WIS modifier'ı; görüş hattındaki gizlenmiş düşmanlardan
  bulunma DC'si toplamı aşmayanlar bulunur ve ortaya çıkar. Menzil sınırı yok (karanlık
  Adım 8'de).
- **Eylem ekonomisi yok:** Motor tur içinde eylem saymıyor (saldırı da öyle); gizlenme ve
  arama bir eylem harcamıyor. Eylem ekonomisi ayrı bir iş.
- Haritasız savaşta gizlenme yok.

## 2026-10-15 — Yükseklik ve siper (Adım 6)

**Karar:** (yalnızca haritalı savaş; haritasız savaşta siper ve görüş hesaplanmaz, yükseklik
eskisi gibi savaşçının soyut değerinden gelir)

- **Siper çizgisi:** Saldıranın altıgen merkezinden hedefin altıgen merkezine çizgi çekilir,
  aradaki altıgenlere (uçlar hariç) bakılır. Çizgi iki altıgenin tam sınırından geçerse
  her iki yan da denenir ve saldıran için en iyisi seçilir: önce görüşü açık olan, sonra
  siperi az olan (SRD'de saldıranın en elverişli köşeyi seçmesine karşılık gelir).
- **Siper değerleri:** Zemin kataloğundaki değer: yarım (+2) `x`, `g`, `d`, `k`; 3/4 (+5)
  `v`, `e`, `m`, `r`, `c`. Aradaki her yaratık (hangi tarafta olursa olsun) yarım siper.
  `d`, `k`, `r`, `c` kullanıcı önerisinde yoktu; ilk katalogda (GOREV.md) siper değerleri
  olduğu için aynen geçerli.
- **Hedefin altıgeni:** Hedefin durduğu altıgenin siperi de sayılır (çalılıkta duran yarım
  siper alır); saldıranın altıgeni sayılmaz.
- **Toplanmaz:** Birden fazla siper varsa en iyisi geçer.
- **Uygulama:** Siper saldırı zarlarında AC'ye, DEX save'lerinde save'e eklenir (karakter
  saldırısı, canavar saldırısı ve nefesi, büyü saldırısı ve DEX save'li büyüler). Yakın
  dövüş de etkilenir (5e); bitişik saldırıda arada altıgen olmadığı için yalnızca hedefin
  altıgeni sayılır. GOREV.md'deki "yakın dövüş etkilenmesin" ilk taslağı bu öneriyle
  değişti. Alan büyülerinde siper şimdilik patlama noktasından değil büyücüden hesaplanıyor.
- **Görüş hattı:** Aradaki altıgenlerde duvar (`s`), ağaç (`a`) veya dış kayalık (`#`) varsa
  hedef görülemez ve saldırı/büyü reddedilir (save'li etkiler dahil). Lav, su ve uçurum
  görüşü kesmez.
- **Ağaç (`a`) — kullanıcı onayı:** Hem 3/4 siper hem görüş kesici olarak kalır. Aradaki ağaç
  saldırıyı engeller; ormanda okçuluk, ağaçların arasındaki boş altıgenlerden geçen bir
  çizgi bulunarak mümkündür (sınırdan geçen çizgide saldıran açık yanı seçer). Bu davranış
  bilerek böyle bırakıldı.
- **Kullanıcı onayı:** `d`, `k` (yarım) ve `r`, `c` (3/4) ilk katalogdaki değerleriyle
  kalır; siper yakın dövüşte de geçerli kalır (5e kuralı).
- **Ertelendi — Adım 5b:** Alan şekilleri (koni, küre, çizgi, yayılım) ve alan büyülerinde
  siper/görüşün patlama noktasından hesaplanması ayrı bir adım (GOREV.md, Adım 8'den önce).
- **Yükseklik:** Haritada savaşçının yüksekliği durduğu altıgenden gelir (0/1/2). Mevcut
  kural aynen: yüksekteki avantajlı, alçaktaki dezavantajlı; kuleden (`z`) surdakine (`h`)
  atış avantajlı. Haritalı savaşta savaşçının soyut `height` değeri kullanılmaz.
- **`crenel`** (surdaki/kuledeki saldırgana aşağıdan menzilli saldırıda 3/4 siper) Adım 8'de;
  şimdilik yalnızca veri.

## 2026-10-15 — Büyü saldırısı: yakın dövüş veya menzilli; Trident

**Karar:**

- **Büyü saldırısı türü:** Menzili dokunma (5 ft) olan büyü saldırısı yakın dövüş, diğerleri
  menzilli saldırı sayılır (SRD: melee spell attack / ranged spell attack). Yerdeki (Prone)
  hedefe menzilli büyü saldırısı dezavantaj, yakın dövüş büyü saldırısı avantaj alır;
  Paralyzed veya Unconscious hedefe otomatik kritik yalnızca yakın dövüş büyü saldırısında.
- **Haritasız savaşta davranış değişti:** Önceden büyü saldırıları Prone kuralından muaftı
  ve hepsi yakın dövüş sayıldığı için uzaktan atılan Fire Bolt gibi büyüler baygın hedefe
  otomatik kritik vuruyordu. Artık iki durumda da yukarıdaki kural geçerli. Eski "büyüde
  etkisiz" testi bu kurala göre güncellendi, yeni testler eklendi.
- **Trident:** SRD 5.2.1'e göre hasar 1d8, iki elle (Versatile) 1d10 (önceden 1d6/1d8).
  Hiçbir karakter ve test Trident'e bağlı değildi.

## 2026-10-15 — Menzil (Adım 5)

**Karar:**

- **Birim:** Veride menzil ve erişim yalnızca feet olarak durur (tek kaynak); hesap anında
  5'e bölünür (1 altıgen = 5 ft). Veride ayrı bir "altıgen" alanı yok.
- **Yakın dövüş:** Erişim 5 ft (1 altıgen); Reach özelliği olan silahlar (Glaive, Halberd,
  Whip) 10 ft (2 altıgen). Erişim dışındaki hedef reddedilir.
- **Menzilli silahlar** (SRD 5.2.1 PDF s. 91 silah tablosu): Light Crossbow ve Shortbow
  80/320, Hand Crossbow 30/120, Heavy Crossbow 100/400, Longbow 150/600. Normal menzilin
  ötesinde dezavantaj ("Uzun menzil"), uzun menzilin ötesi reddedilir.
- **Fırlatma:** Thrown silahlar (Dagger, Handaxe, Light Hammer, Spear, Trident 20/60;
  Javelin 30/120) ikinci bir seçenek verir: "(fırlatma)", aynı yetenek modifier'ı,
  menzilli saldırı (SRD 5.2.1 Thrown özelliği).
- **Yanında düşman:** Menzilli saldırıda (silah, fırlatma, menzilli büyü saldırısı,
  canavarın menzilli saldırısı) saldıranın 1 altıgen yakınında aksiyon yapabilen
  (Incapacitated olmayan) bir düşman varsa dezavantaj. Müttefik ve Incapacitated düşman
  sayılmaz.
- **Büyüler:** `rangeFt` SRD'deki Range satırından: sayısal menzil olduğu gibi, Touch 5,
  Self 0. Kendinden çıkan alan veya fırlatmada etkinin ulaştığı uzaklık menzil sayılır:
  Burning Hands 15 (koni), Thunderwave 15 (küp), Fear 30 (koni), Lightning Bolt 100
  (çizgi), Spirit Guardians 15 (yayılım), Produce Flame 60 (fırlatılan alev), Vampiric
  Touch 5 (dokunma). Alan şekli (koni, küre, çizgi) şimdilik hesaplanmıyor; yalnızca hedef
  menzil içinde mi diye bakılıyor. Büyülerde uzun menzil yok. Menzili 5 ft'ten uzun saldırı
  büyüleri "yanında düşman" dezavantajını alır. Menzili 0 olan büyü başkasını hedefleyemez.
- **Canavarlar:** Bütün saldırıların erişimi veya menzili SRD 5.2.1 stat bloklarından
  dolduruldu; doldurulamayan yok. Save'li saldırılar (Fire Breath 30 ft koni, Web 60 ft)
  yalnızca menzil sınırına bakar. Ogre'nin Javelin'i ("Melee or Ranged") menzilli saldırı
  olarak kaldı (30/120). Multiattack'ta saldırılardan biri hedefe ulaşamıyorsa komut
  bütünüyle reddedilir.
- **Haritasız savaş:** Konum olmadığı için menzil hiç denetlenmez, eski davranış aynen.
- **Düzeltme:** Zombie'nin Slam saldırısındaki "Grappled" ek etkisi SRD'de yok, kaldırıldı.

## 2026-10-15 — 11 yeni harita ve zemin kataloğu eki

**Bağlam:** `docs/harita/GOREV-YENI-HARITALAR.md`: ada, bataklık, buzul, dağ, dungeon, gemi,
kale, mağara, orman, şehir meydanı, taverna.

**Karar:**

- **Veri:** JSON'lar `data/maps/`, görseller `public/maps/`. Yükleyici `data/maps/*.json`
  dosyalarının hepsini kendisi bulur (kimliğe göre sıralı); yeni harita eklemek gerçekten
  yalnızca JSON ve görsel eklemek, kod değişmez.
- **Ortamlar:** Her haritaya `environmentId`: bataklık → Sualtı / bataklık, buzul → Buzul,
  dağ → Dağ / uçurum, dungeon ve mağara → Yeraltı / mağara, orman → Orman; ada, gemi,
  kale, şehir meydanı ve taverna → Düz zemin. Varyant kendi ortamını verebilir: Ada ve
  Gemi'nin `firtina` varyantı → Fırtına / yağmur. Savaşın ortamı seçilen varyanttan gelir.
- **Hazır başlangıç listeleri:** `startZones.*.hexes` (1 tabanlı [sütun, satır]) varsa o
  kullanılır, yoksa sütun aralığından hesaplanır (Çöl, Volkan). Yükleyici denetler: liste
  boş değil, her altıgen kendi sütun aralığında ve başlangıca uygun, tekrar yok, iki taraf
  çakışmıyor, iki taraf da liste veriyor. Aynalanabilir hazır listeli haritada sütun
  aralıkları birbirinin aynası olmalı; aynalamada oyuncular düşmanların listesinin
  aynasını, düşmanlar oyuncularınkini alır (oyuncular yine solda).
- **Zemin kataloğu eki** (`terrain-ek.json`): `s` duvar (engel, görüşü keser), `h`
  yükseltili (1, çıkış 2), `z` zirve/kule üstü (2, çıkış 2), `u` uçurum (engel; yalnızca
  uçan geçer), `i` buz, `q` kar (zorlu), `a` ağaç (engel, 3/4, görüşü keser), `g` çalılık
  (zorlu, yarım, gizlenme), `v` sarkıt (engel, 3/4), `e` kristal (engel, 3/4, ışık 4),
  `n` sığ su (zorlu), `b` derin batak, `w` derin su (zorlu), `p` tahta/kaldırım, `m` direk
  (engel, 3/4), `x` varil/masa (zorlu, yarım), `o` kapı, `j` gizli tuzak.
- **Yükseklik ölçeği:** Zemin yüksekliği 0/1/2 (`z` = 2), `z` 1'e eşitlenmedi; böylece
  kuledeki okçu surdakine göre de yüksekte sayılır. Mevcut avantaj kuralı yalnızca kimin
  daha yüksekte olduğuna bakar, fark büyüklüğü önemsizdir; Adım 6'da saldırı kuralı
  sayısal yüksekliği kabul edecek. Haritasız savaşın soyut ölçeği (-1/0/1,
  `change_height`) aynen kalıyor.
- **Yeni kurallar şimdilik yalnızca veri:** `bog`, `deepWater`, `ice`, `cold`, `storm`,
  `darkness`, `trap`, `stealth`, `gate`, `crenel`, `objective` (ve `climb`, `swell`,
  `moat`, `mudNote`) JSON'da ve zeminlerde `rule` bağı olarak duruyor; motor davranışı
  Adım 8'de. Bu yüzden bugün `b` (derin batak) normal maliyetli, `i` normal zemin, `j`
  görünmez değil; batağın 3 hareket maliyeti, buzda kayma ve tuzak Adım 8'de gelecek.

## 2026-10-15 — Atlama (uzun atlama)

**Bağlam:** Kaynak belge (`harita_sistemi_ve_ilk_haritalar.md`) "mesafe yetmiyorsa atlamak
lava düşmektir" diyor. Yanlışlıkla ölüm olmasın diye bunun yerine komut reddedilir.

**Karar:** `jump` komutu (yalnızca haritalı savaş), 5e uzun atlama kuralıyla:

- **Doğrultu:** Hedef, bulunulan altıgenden düz bir eksen üzerinde olmalı; komşu
  altıgene atlanmaz (yürünür).
- **Menzil kanal genişliğiyle ölçülür:** aradaki altıgen sayısı × 5 ft, atlama menzilini
  aşmamalı; iniş altıgeni mesafeye sayılmaz. Menzil koşarak STR skoru kadar ft, koşusuz
  yarısı (aşağı yuvarlanır). Örnek: STR 8 koşarak 1 altıgenlik kanalı, STR 10 2, STR 15 3
  altıgenlik kanalı atlar.
- **Koşu:** O turda, atlamayla aynı yönde, art arda en az 2 altıgen yürümüş olmak. Koşu
  tur başında ve atlamadan sonra sıfırlanır; yön değiştiren yürüyüş koşuyu yeniden başlatır.
- **Hareket maliyeti:** kalkıştan inişe geçilen altıgenler, yani kanal + iniş altıgeni
  (inişin zemin maliyeti dahil: taşlığa iniş 2). Bütçe yetmezse reddedilir.
- **Aradaki altıgenler:** sütun (`c`) veya dış kayalık (`#`) varsa reddedilir; lav, zemin
  ve yaratıklar engel değildir.
- **İniş altıgeni:** lav, engel veya dolu ise reddedilir. Menzil dışı atlama da hata
  mesajıyla reddedilir; lava düşüş yalnızca zorla hareket ve lav yükselmesiyle olur.
- Savaşçıya STR skoru (`strScore`) ve son düz koşu (`run`) alanları eklendi.

## 2026-10-15 — Haritada konum, kurulum ve yürüme

**Karar:**

- **Harita isteğe bağlı:** `startBattle`'a harita verilirse savaş `setup` (yerleştirme)
  aşamasında başlar, ortam haritanın `environmentId`'sinden gelir ve altıgenler durumda
  (`state.map.tiles`) tutulur. Haritasız savaş ve eski testler aynen çalışır.
- **Kurulum:** `place` yalnızca kurulumda, kendi tarafının başlangıç bölgesine, boş
  altıgene; yeniden yerleştirme serbest. Otomatik başlama yok: GM `start_battle` verir,
  herkes yerleşmeden reddedilir. Kurulumda tur komutları reddedilir.
- **Komut adları:** Soyut yükseklik komutu `change_height` (yalnızca haritasız savaş,
  tırmanma kontrolüyle). `move` haritada hedef altıgene en ucuz yoldan yürür.
- **Yürüme:** Bütçe hız / 5 altıgen (30 ft = 6), tur içinde parça parça harcanabilir,
  yaratığın kendi turu gelince sıfırlanır. Zorlu zemin 2, engel geçilmez, harita dışı
  reddedilir. Restrained ve Grappled yürüyemez.
- **Başka yaratıkların altıgeni** (kaynak: SRD 5.2.1, PDF s. 14, "Moving around Other
  Creatures"): müttefikin altıgeninden geçilir ve orası zorlu zemin değildir;
  Incapacitated düşmanın altıgeninden geçilir ama orası zorlu zemindir (2 altıgen);
  diğer düşmanların altıgeninden geçilmez; dolu altıgende gönüllü durulmaz. SRD'deki
  Tiny yaratık ve "iki boy büyük veya küçük" istisnaları, motorda boyut olmadığı için
  şimdilik uygulanmıyor (bütün yaratıklar aynı boyda sayılıyor).
- **Lav:** Gönüllü `move` ile lava girmek reddedilir; yol bulucu lavı geçilmez sayar.
  `fell_into_lava` olayı (HP 0, doğrudan ölü, ölüm kurtarması yok) yalnızca zorla hareket
  (ileride itme) ve lav yükselmesiyle (`tile_changed`) üretilecek.
- **Uçma:** Canavarlarda `fly` (ft); Wyvern ve Young Red Dragon 80. Uçuş hızı olan
  yaratık her zaman uçuyor sayılır: hareket bütçesi uçuş hızından gelir, lav ve zorlu
  zemin 1 altıgen, engel geçilmez. Karakterlerde şimdilik uçma yok.
- **Yükseklik:** Haritalı savaşta yükseklik ileride altıgenden gelecek (Adım 6); bu adımda
  savaşçının `height` değeri değişmiyor.

## 2026-10-15 — Zemin kataloğu ve harita verisi

**Karar:**

- **Zemin kataloğu** (`src/map/terrain.ts`), bütün haritalar paylaşır: `.` açık zemin,
  `d` kum tepesi (yarım siper), `r` kaya kümesi (zorlu, 3/4 siper, gölge), `c` ayakta
  sütun (engel, 3/4 siper, gölge), `k` yıkık sütun (zorlu, yarım siper, gölge), `t` taşlık
  (zorlu), `H` yüksek bazalt (yükseklik 1), `~` lav (ölümcül), `f` alev (1d6 ateş),
  `#` dış kayalık (oyun alanı dışı). Siper: yarım +2 AC, 3/4 +5 AC. Zorlu zemine girmek
  2 altıgenlik hareket harcar. Uçan yaratık zorlu zeminden ve lavdan etkilenmez,
  engelden etkilenir. Yükseklik motorun -1/0/1 ölçeğinde (`H` = 1, diğerleri 0).
  Kaynak belgedeki `L`, `M`, `o` harfleri hiçbir haritada kullanılmadığı için şimdilik
  katalogda yok; gereken harita gelince eklenir.
- **Haritalar veri:** `data/maps/*.json` (her haritada ilgili ortamın `environmentId`'si),
  görseller `public/maps/*.webp`. Kuralların parametreleri (DC, hasar, tur sayısı) JSON'da.
  Yükleyici doğrular: 15×7 boyut, flat-top/odd-q, yalnızca katalog harfleri, var olan
  ortam, geçerli sütun aralıkları, boş olmayan başlangıç bölgeleri, görsel dosyasının
  varlığı (görsel listesi testte verilir; dosyalar testlere yüklenmez).
- **Başlangıç bölgeleri:** JSON'daki 1 tabanlı sütun aralığındaki altıgenler; engel, lav,
  alev ve 3/4 siperli kaya kümesi (`r`) başlangıç yeri sayılmaz, taşlık (`t`) ve moloz
  (`k`) sayılır. Katalogda `r` için `noStart` işareti. Volkan 16'şar, Çöl oyuncu 15,
  düşman 20.
- **Aynalama:** Yatay aynalama her satırı ters çevirir (sütun c → 14 - c; 14 çift olduğu
  için komşuluk bozulmaz). Başlangıç sütun aralıkları aynı kalır (oyuncular hep solda),
  altıgenleri aynalı zeminden yeniden hesaplanır; böylece Çöl'de taraflar zeminin öbür
  yarısında başlar. Arayüz aynalı haritada görseli de yatay çevirmeli (`mirrored`).

## 2026-10-15 — Altıgen ızgara geometrisi

**Bağlam:** Savaş, karşılıklı kartlardan altıgen ızgaralı yatay haritaya geçiyor
(`docs/harita/GOREV.md`).

**Karar:** Izgara 15 sütun × 7 satır, düz üstlü (flat-top) altıgen, odd-q offset düzeni
(0 tabanlı tek sütunlar yarım altıgen aşağı kayık), 1 altıgen = 5 ft (hız 30 ft = 6
altıgen). Kodda koordinatlar 0 tabanlı, kullanıcıya 1 tabanlı gösterilir. Hesaplar
eksenel (axial) koordinatta: `q = col`, `r = row - (col - (col & 1)) / 2`; mesafe
`(|dq| + |dq + dr| + |dr|) / 2`. Geometri `src/rules/hex.ts` içinde saf bir modül: harita
biçimini bilmez, zemin maliyeti yol bulucuya fonksiyon olarak verilir (normal 1, zorlu 2,
engel null). Eşit maliyetli yollar arasında seçim sabit (komşu ve keşif sırası), böylece
olaylar baştan oynatılınca aynı yol çıkar.

## 2026-10-15 — SRD 5.2.1 atıf metni eklendi

**Bağlam:** CC-BY-4.0'ın tek şartı atıf. SRD 5.2.1'in ilk sayfası atıf metnini verir ve
Wizards'a başka bir atıf yapılmamasını ister; "5E compatible" ifadesine izin verir.

**Karar:** İlk sayfadaki atıf metni olduğu gibi `NOTICE`, `README.md` ve uygulamanın
"Hakkında / Atıflar" metni `public/atiflar.txt` içine kondu (ekran sonra gelecek; dosya
build ile birlikte yayınlanır). "5E uyumlu (5E compatible)" ifadesi kullanılır.
Onay veya ortaklık izlenimi veren hiçbir ifade kullanılmaz; kod yorumlarındaki "PHB"
ve "D&D" anmaları "SRD 5.2.1" / "5E" olarak değiştirildi. `src/legal.test.ts` metnin
üç dosyada da birebir durduğunu denetler.

## 2026-10-15 — Tüm canavarlar SRD 5.2.1 istatistiklerine güncellendi

**Karar:** 16 canavarın AC, HP, hız, yetenek skorları, saldırıları, Multiattack düzeni,
yenilenme, bağışıklıklar ve save bonusları SRD 5.2.1 stat bloklarına göre güncellendi.
Öne çıkanlar: Troll 94 HP, tur başı 15 yenilenme, üç Rend; Young Red Dragon üç Rend +
Fire Breath; Owlbear iki Rend; Ghoul iki Bite; Bandit Captain iki saldırı ve Pistol;
Hobgoblin Warrior Pack Tactics; Giant Spider Web artık DEX save (DC 13); Wolf AC 12,
Bite 1d6+2 ve koşulsuz Prone. Canavarlara stat bloğundaki SAVE sütunu için `saves`
alanı eklendi (ör. ejderhanın DEX ve WIS save'i +4).

**Motor sınırı:** Motor bir saldırıda tek hasar türü uygular. "plus 2d6 Poison" gibi
ikinci hasarlar, koşullar (Prone, Poisoned, Restrained) ve durum bağışıklıkları şimdilik
`rider`/`traits` metninde durur ve elle uygulanır. Demo dengesi de değişti (Troll daha
güçlü); yeniden ölçülmedi.

## 2026-10-15 — Büyü, zırh ve canavar adları SRD 5.2.1'e çevrildi

**Bağlam:** Bazı içerik SRD 5.2.1'de farklı adla yer alıyor ya da hiç yer almıyor.
Henüz kayıt sistemi olmadığı için ad değişikliğinin en ucuz olduğu an şimdi; ileride
kayıtlı karakterler eski adları (ör. "Plate") içerseydi bozulurdu.

**Karar:**

- **Büyüler** (aynı büyü, yeniden adlandırıldı; seviye ve sınıf SRD'ye göre):
  - Branding Smite → Shining Smite (2. seviye, yalnızca Paladin)
  - Tasha's Hideous Laughter → Hideous Laughter (1. seviye, Bard, Warlock, Wizard)
- **Zırhlar:** Leather → Leather Armor, Studded leather → Studded Leather Armor,
  Hide → Hide Armor, Chain shirt → Chain Shirt, Half plate → Half Plate Armor,
  Chain mail → Chain Mail, Plate → Plate Armor. "Zırhsız" oyunun kendi seçeneği.
- **Canavarlar:** Goblin → Goblin Warrior, Hobgoblin → Hobgoblin Warrior,
  Minotaur → Minotaur of Baphomet (id'ler de değişti). Yalnız ad değişti, istatistikler
  henüz SRD 5.2.1 değerlerine güncellenmedi.
- **Orc canavarı kaldırıldı**, SRD'nin önerdiği **Tough** eklendi (SRD 5.2.1 istatistikleriyle:
  AC 12, HP 32, Mace, Heavy Crossbow, Pack Tactics). "Orc" adı artık yalnızca oyuncu türü.

## 2026-10-15 — Büyülerin sınıf listeleri SRD 5.2.1'e göre düzeltildi

**Bağlam:** Ortak büyülerin bazılarında sınıf listesi SRD 5.2.1'den farklıydı. Bu
lisanstan çok doğruluk meselesi: bir büyünün hangi sınıfın listesinde olduğu,
karakterlerin oyunda ne yapabileceğini değiştirir.

**Karar:** 12 büyünün sınıf listesi SRD 5.2.1'e eşitlendi:

| Büyü | Eklenen | Çıkarılan |
|---|---|---|
| Spare the Dying | Druid | |
| Command | Bard | |
| Entangle | Ranger | |
| Mirror Image | Bard | |
| Flaming Sphere | Sorcerer | |
| Slow | Bard | |
| Vampiric Touch | Sorcerer | |
| Mass Healing Word | Bard | |
| Revivify | Druid, Ranger | |
| Aid | Bard, Druid, Ranger | |
| Dispel Magic | Ranger | |
| Shatter | | Warlock |

Bu düzeltmeden sonra veride kalan her büyünün seviyesi ve sınıf listesi SRD 5.2.1
ile birebir aynı. İstisna: Branding Smite ve Tasha's Hideous Laughter; bunların
SRD'deki adları farklı (Shining Smite, Hideous Laughter) ve karar bekliyor.

## 2026-10-15 — SRD 5.2.1'de olmayan büyüler çıkarıldı

**Bağlam:** Oyun verisi ticari sürümde yalnızca SRD 5.2.1 (CC-BY-4.0) kapsamındaki
içeriğe dayanmalı. `data/spells.json`, `docs/SRD_CC_v5.2.1.pdf` ile büyü büyü
karşılaştırıldı.

**Karar:** SRD 5.2.1'de bulunmayan 9 büyü veriden çıkarıldı:

| Büyü | Seviye | Sınıf |
|---|---|---|
| Blade Ward | 0 | Bard, Sorcerer, Warlock, Wizard |
| Armor of Agathys | 1 | Warlock |
| Thunderous Smite | 1 | Paladin |
| Witch Bolt | 1 | Sorcerer, Warlock, Wizard |
| Wrathful Smite | 1 | Paladin |
| Blinding Smite | 3 | Paladin |
| Crusader's Mantle | 3 | Paladin |
| Elemental Weapon | 3 | Paladin |
| Lightning Arrow | 3 | Ranger |

**Gerekçe:** Çıkarmak en basit ve en güvenli yol. Bir büyüyü özgün hâle getirmek
yeniden adlandırmaktan fazlası: kendi adı, hikâyesi ve dengesi olmalı; bu ayrı bir iş.

**İleride:** Bu büyülerin yerine özgün büyüler yazılabilir. Demo karakterleri
(Mira, Bor) bu büyülerin hiçbirini kullanmıyordu. `src/data/data.test.ts` bu
büyülerin veriye geri girmesini engelleyen bir test içerir; özgün büyüler farklı
adlarla eklenmeli.
