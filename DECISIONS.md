# Kararlar

Projede alınan içerik ve kural kararlarının kaydı. En yeni karar en üstte.

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
