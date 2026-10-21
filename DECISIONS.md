# Kararlar

Projede alınan içerik ve kural kararlarının kaydı. En yeni karar en üstte.

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
