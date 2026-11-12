# Sadeleştirme denetimi (Görev SD1)

> Durum: **yalnız denetim** (kod, veri ve test değişmedi; kural sürümü yok). Uygulama sonraki görevlerde.
> Tarih: 2026-11-12. Hedef kitle: D&D bilmeyen 10 yaşında bir çocuk.
> Yönelim A: **tek sade arayüz**. Uzman seçenekleri "Diğer / Gelişmiş" arkasına taşınır; ayrı mod ve yeni Ayarlar anahtarı yok.

## Özet tablo

Sayılar kodu çalıştırarak ölçüldü (yöntem aşağıda). "Bugün" sütunu ekranda **aynı anda görünen** seçenek/düğme/alan sayısıdır (en kötü durum parantezde); "Hedef" ilkelerin (≤ 5–6) ana düzeyidir, kalanı "Diğer / Gelişmiş" altına gider.

| # | Ekran | Bugünkü seçenek sayısı | Hedef sayı | Büyüklük |
|---|---|---|---|---|
| 1 | Savaş eylem menüsü (halka menü + alt şerit + büyü/hedef balonları) | Halka **9–26** düğme (Fighter 5: 11, Wizard 5: 9, Cleric 5: 12, Druid 5: 19, Druid 9: 21, Druid 20: 26); büyü balonu **16–28** satır; alt şerit 4–9 öğe; ekranda toplam 21–38 düğme | Halka ≤ 6; her alt menü ≤ 6; büyü ≤ 6 + "Hepsi" | **Büyük** (yalnız gruplama: orta) |
| 2 | Karakter oluşturucu (6–7 adım) | Adım başına **22–421**: Karakter 45 (Druid 9: 121), Puanlar 29, Beceriler 23, İlerleme 1–100, Donanım 206 (tümü 605), Büyüler 75–421 | Adım başına ≤ 6 ana seçenek; gerisi Gelişmiş | **Büyük** |
| 3 | Karakter listesi | Kart başına 2–**6** düğme (3 kartta 20, 6 kartta 38) + 5–9 metin satırı | Kart başına 3 (Düzenle, Dinlen ▾, ⋯) | Orta |
| 4 | Game Master kurulumu | İlk açılış **169** denetim (140'ı canavar −/+); tümü açık 281; en kötü harita 349; "Tüm canavarlar" 808 | 3 adım, her biri ≤ 6 + sabit "Savaşı kur" + Gelişmiş | **Büyük** |
| 5 | Ayarlar (+ savaş içi `≡`) | **48** denetim, 8 bölüm, düz liste; `≡` menüsü ≈ **21–33** düğme (ses/efekt/zar/tepki yalnız burada) | 5 grup + "Gelişmiş"; `≡` ≤ 6 + "Diğer" | Orta |
| 6 | Oda kur / ana menü | Ana menü **8** (10 koşullu); Oda kur ilk görünüm ~19 düğme + 140 canavar −/+ (→ §4) | Ana menü 5 + 3 çip; Oda kur 3 adım | Küçük (ana menü) / Büyük (Oda kur) |
| 7 | Serüven ekranı | Sayfa **9–10** düğme; "Serüven kuralları" **24** kutu; Dünya haritası **19**; düğüm kartı 2–5 | Üst çubuk 4 + "⋯ Diğer"; dünya haritası 5 | Orta |
| 8 | Yerleşim hub'ı + şehir görünümü | Hub **16** (Beyaz Şehir 20); şehir görünümü **21** bina (Liman 10) | Hub 5; şehir 6–7 aktif | Orta |
| 9 | Savaş sonu | 1 çıkış düğmesi + **6 sütun × 19 satır = 114 hücre** tablo; ekranda 10 düğme | 6 öğe: başlık, tek satır sonuç, hedef, "Devam", "Keşfe devam", "Ayrıntılar ▸" | Küçük–orta |
| 10 | Günlük, toast, önizleme kartı, tepki sorusu, zar istemi, çekmece, bilgi kutusu | Günlük **60 satır** (260 üretildi); toast **17–2014** karakter; önizleme kartı hedef başına ≤ **10** parça (Fireball: 12–16); tepki sorusu 3–6 düğme; zar istemi 3 düğme + alan; çekmece 12–18 satır; bilgi kutusu 3–10 parça | Günlük 8–10 olay cümlesi; toast tek cümle; kart hedef başına 3 parça + "Ayrıntı ▸"; tepki 1 cümle + ≤ 3 düğme | **Büyük** (çok dosya, çoğu metin işi) |

## İlkeler (denetimin ölçütü)

1. Bir ekran, bir karar; aynı anda en çok 5–6 seçenek.
2. Önce "ne yapmak istiyorsun"; ayrıntı (yuva, seviye, kural) ikinci adımda ya da bilgi simgesinde (ⓘ).
3. Oyun dili, kural dili değil; kısa, düz Türkçe.
4. Varsayılan seçili gelir; hiçbir şeyi değiştirmeden başlanabilir.
5. Kullanılamayan seçenek soluk bırakılmaz: iç listelerde gizlenir. Üst düzeydeki 5–6 sabit düğme yer değiştirmesin diye gizlenmez, dokununca nedenini söyler.
6. Uzman seçenekleri kaybolmaz, arkaya ("Diğer / Gelişmiş") gider.

> **Yorum notu (ilke 5):** "Kullanılamayan gizli, soluk bırakılmaz" cümlesi "yapılamayan seçenek gizlenir, soluk bırakılmaz" diye okundu. Bugün oyun tersini yapıyor: yapılamayan eylemler soluk kalır ve dokununca nedenini söyler (`aria-disabled`, `Y.*` neden metinleri). Bu davranış öğretici bir geri bildirim; gizlemek onu kaybettirir. Bu yüzden önerilerde **iç listelerde gizle, üst düzeyde sabit tut + neden söyle** ayrımı yapıldı; uygulama görevinden önce kullanıcı onayı istenmesi önerilir.

## Ölçüm yöntemi

- Sayılar **kodu çalıştırarak** alındı: geçici vitest dosyalarıyla gerçek ekran bileşenleri sunucu tarafında çizildi (`renderToStaticMarkup`) ve düğme/giriş/seçim sayıldı. Savaş menüsü için `data/sim-partiler.json` partileri `Çöl/gündüz` haritasında kuruldu, sırası gelen karakterin halka menüsü sayıldı.
- Geçici dosyalar silindi; depoya yalnız bu belge girdi. Çizim DOM gerektirdiğinde `window`/`localStorage` taklidi kullanıldı; ölçülemeyen yerler "koddan sayıldı" diye işaretli.
- Ekran görüntüsü alınmadı (isteğe bağlıydı); sayımlar çizilen işaretlemeden olduğu için görüntüye gerek kalmadı.
- Metin örnekleri gerçek karakter adı içermez. Satır numaraları 2026-11-12 tarihli `claude/game-ui-simplification-audit-lgrvrz` dalındaki dosyalara göredir.
- **Sınırlama:** savaş menüsü sayıları `data/sim-partiler.json` parti üyeleriyle (4 kişilik parti, Çöl/gündüz) ölçüldü; gerçek karakterlerde ırk, feat ve haritaya göre ±2 oynar. Oluşturucu, GM, Ayarlar, Serüven ve hub sayıları SSR çıktısındandır; açılır/duruma bağlı bölümler "koddan sayıldı" diye işaretlidir.

---

## 1. Savaş eylem menüsü (halka menü + alt şerit + büyü/hedef balonları)

**Dosyalar:** `src/MapBattle.tsx` (menü öğeleri `moveItems` :1399, `mainItems` :1410–1619, `POSS_KEYS`/`items` :1622, `radialLayout` çağrısı :1626, halka düğmeleri :2243–2270, açıklama balonu :2271–2281, büyü balonu :2283, hedef balonu :2344, alt şerit `.economy` :2826), `src/ui/hud.ts` (`radialLayout`, `spellMenu`, `slotChoices`), `src/ui/actionHints.ts`, metinler `src/i18n/strings.tr2.ts` (`battle.label` :236–252, `battle.hints` :389–), `strings.en.ts`.

### 1.1 Bugünkü durum (ölçüm)

Ölçüm yöntemi: geçici bir vitest dosyasıyla gerçek `Battle` bileşeni sunucu tarafında çizildi (`renderToStaticMarkup`), `Çöl/gündüz` haritasında, `data/sim-partiler.json` partilerinin sınıf üyesiyle (4 kişilik parti, bir düşman grubu), sırası gelen karakterin halka menüsündeki `.radial-btn` düğmeleri sayıldı. Geçici dosya silindi, depoya girmedi. Sayılar haritaya, ırka ve feat'e göre birkaç oynar (örn. `Atla` yalnız lav haritasında, `Nesne` yalnız bitişik nesnede, Stonecunning Cüce'de, `İnisiyatif değiş` Alert feat'inde).

| Sınıf | Sv. | Halka menü (toplam) | açık | soluk (yapılamaz) | Büyü balonu (tek liste) | Saldırı balonu (silah) | Ekrandaki tüm düğme |
|---|---|---|---|---|---|---|---|
| Fighter | 5 | 11 | 7 | 4 | – | 3 | 23 |
| Fighter | 20 | 11 | 7 | 4 | – | 3 | 23 |
| Wizard | 5 | 9 | 6 | 3 | 16 (0.sv 5, 1.sv 6, 2.sv 4, 3.sv 1) | 2 | 21 |
| Wizard | 9 | 9 | 6 | 3 | 21 | 2 | 21 |
| Cleric | 5 | 12 | 7 | 5 | 16 | 2 | 24 |
| Cleric | 9 | 12 | 7 | 5 | 22 | 2 | 24 |
| **Druid** | 5 | **19** | 15 | 4 | 17 | 2 | 31 |
| **Druid** | 9 | **21** | 17 | 4 | 24 | 2 | 33 |
| **Druid** | 20 | **26** | 21 | 5 | 19 | 2 | 38 |
| Sorcerer | 9 | 15 | 13 | 2 | 28 | 3 | – |
| Warlock | 9 | 9 | 7 | 2 | 27 | 3 | – |
| Monk | 5 / 20 | 14 / 17 | 11 / 13 | 3 / 4 | – | 5 | 26 / 29 |
| Rogue | 5 | 11 | 9 | 2 | – | 3 | – |
| Barbarian | 17 | 12 | 9 | 3 | – | – | – |
| Paladin | 9 | 13 | 11 | 2 | 16 | – | – |
| Ranger | 17 | 13 | 10 | 3 | 6 | – | – |
| Bard | 5 | 12 | 10 | 2 | 12 | – | – |

Özet: halka menü **9 (en az) – 26 (Druid 20)** düğme; hedef 6. Büyücülerde ikinci adımda **16–28 büyülük tek düz liste** (seviye/tür gruplaması yok, adlar İngilizce). Düğmelerin **%12–42'si soluk** (yapılamayan). Halka menü 12'den fazla düğmede tek yaya sığmaz, iç içe halkalara taşar (`hud.ts:38–`; `hud.test.ts` "çok düğmede (12)").

Alt şerit (`.economy`, :2826): her zaman 4 öğe: `Eylem` · `Bonus` · `Tepki` · `Hareket 6/6`; duruma göre +1–5 (irtifa, tavan, "Tırman…", elindekini bırak, yerden al). Şerit yalnız **durum** gösterir, düğme değildir; çocuk "Bonus" ve "Tepki"nin ne olduğunu menüden öğrenemez, çünkü halka menü eylem/bonus/serbest ayrımı yapmadan düz sıralanır (Fighter'da `Gizlen` eylem, `İkinci Soluk` bonus eylem; ikisi yan yana).

### 1.2 Kural dili taşıyan / uzun metinler (örnekler)

| # | Metin (TR, ekranda) | Yer | Anahtar |
|---|---|---|---|
| 1 | "Nature Magician: 1 Wild Shape → 2. seviye slot" (4 düğme: 1–4 → 2/4/6/8. sv) | `strings.tr2.ts:249`, menü `MapBattle.tsx:1527` | `battle.label.natureMagician` |
| 2 | "Wild Resurgence: slot → Wild Shape" / "Wild Resurgence: Wild Shape → 1. seviye slot" | `strings.tr2.ts:249` | `battle.label.resurgeShape`, `resurgeSlot` |
| 3 | "Wild Shape: Reef Shark (CR 1/2)" (her biçim ayrı düğme: Sv. 5'te 6, Sv. 9'da 8) | `strings.tr2.ts:248`, menü `MapBattle.tsx:1520` | `battle.label.shapeOn` |
| 4 | "1. seviye slot → Sorcery Point" / "Sorcery Point → 5. seviye slot" | `strings.tr2.ts:251` | `battle.label.fontToPoints`, `fontToSlot` |
| 5 | "Superior Defense (3 Focus)", "Flurry of Blows", "Wholeness of Body", "Quivering Palm" (İngilizce, açıklamasız) | `strings.tr2.ts:239`, `:252`; yoksa `f.name` (`MapBattle.tsx:1530`, `:1535`) | `battle.label.superiorDefense`, `focusName` |
| 6 | "Divine Spark", "Channel Divinity", "Abjure Foes", "Turn Undead", "Preserve Life", "Stonecunning", "Adrenaline Rush", "Intimidating Presence" (TR karşılığı `featureName`'de yok → ham İngilizce ad) | `strings.tr2.ts:241` (`featureName` yalnız 8 kayıt), geri düşüş `MapBattle.tsx:1530` | `battle.label.featureName` |
| 7 | "İnisiyatif değiş (Alert)" | `strings.tr2.ts:239`; ipucu :420 "Alert: 1. turda sırasını oynamamış gönüllü bir dostla inisiyatifini değiş tokuş et." | `battle.label.iswap`, `battle.hints.iswap` |
| 8 | İpucu "Gizlen": "Saklanma bölgesinde (yeşil kesikli çerçeve) Stealth zarıyla gizlen: 15'i ve seni gören düşmanların pasif Algısını geç. … gece ışıksız yerde avantajlı…" | `strings.tr2.ts:397` | `battle.hints.hide` |
| 9 | İpucu "Kaçın": "Kaçın (Dodge): sonraki turunun başına dek sana saldıranlar dezavantajlı olur, DEX kurtarma zarların avantajlı. Eylemini harcar; etkisiz kalırsan ya da hızın 0 olursa işe yaramaz." | `strings.tr2.ts:399` | `battle.hints.dodge` |
| 10 | Alt şeritte "longsword bırak" / "▲ Tırman 5 ft (Çeviklik DC 15, ×3)" (ham İngilizce silah kimliği; DC ve çarpan) | `strings.tr2.ts:343` (`s2.drop`), `:376` (`k71.climbStart`) | `battle.s2.drop`, `battle.k71.climbStart` |
| 11 | Büyü balonu: slot seçici "Slot: 1. (4) 2. (3) 3. (2)", "Yukarı slot etkisi oyunda henüz yok (yalnızca slot harcanır)", "Metamagic (3 SP)", "Slotsuz: Divine Intervention (1)" | `strings.tr2.ts:293–298`; `MapBattle.tsx:394–` | `battle.slotPick`, `slotLevel`, `upcastNotYet`, `metamagic`, `freeCast` |
| 12 | Saldırı balonu: "Brutal Strike" onay kutuları, "Çelme (Trip) (−1d6)", "Push ustalığı: Son saldırıda it / Her isabette it / İtme" | `strings.tr2.ts:244–246`; `MapBattle.tsx:2373–2395` | `battle.label.brutalName`, `cunningName`, `pushOpt` |

(Büyü adları da İngilizce: "Fire Bolt", "Magic Missile"… büyü verisi çevrilmemiş; bu denetim kapsamında yalnız not düşülür.)

### 1.3 İlk bakışta gereksiz → ikinci adıma / "Diğer"e gidebilecekler

- **Dodge, Hide, Shove, Help, Search, Object, Throw object, Distract, Stand, Pull, Escape…** (sürekli duran "genel eylemler", Fighter menüsünün 11 düğmesinin 6'sı) → **Diğer ▸**; yalnızca `Kaçın` ("Savun") üst düzeyde kalabilir.
- **Sınıf özellikleri** (İkinci Soluk, Atılım, Öfke, Pervasız, Şifalı Eller, Kutsal Silah, Sorcery Point çevirileri, Wild Resurgence ×2, Nature Magician ×4, Superior Defense, Alert değiş…) → tek **Yetenekler ▸** düğmesi; içinde ≤ 6 satır, fazlası "Daha fazla ▸".
- **Wild Shape'in 6–8 biçim düğmesi** → "Biçim değiştir ▸" tek düğme; ikinci adımda 6'lık kart ızgarası (jeton + ad), CR yazısı bilgi simgesinde.
- **Kaynak çevirme düğmeleri** (Font of Magic ×2, Wild Resurgence ×2, Nature Magician ×4) → "Gelişmiş" alt listesi; çocuğun ilk bakışta görmesi gerekmez.
- **Soluk düğmeler:** `İt`, `Yardım`, `Atılım`, `Turn Undead`, `Preserve Life` … o an yapılamayanlar menüde kalıp neden satırı gösteriyor (`aria-disabled`, :2243–2268). Hedef: iç listelerde **gizlenir** (ilke 5); üst düzey 5–6 sabit düğme hiç gizlenmez, dokununca nedeni söyler (örn. "Saldır: yakında düşman yok").
- **Büyü balonu:** düz 16–28 satır → seviye/tür başlıkları yok; ikinci adımda **kısa büyüler** (0. seviye) ve **yeterli yuvası olanlar** önce, ≤ 6 satır, "Hepsini göster ▸" ile tam liste. Slot seçici, Metamagic, Overchannel, "saklama" (P11) satırları → "Daha güçlü yap ▸" / "Büyüyü değiştir ▸" (hedef seçildikten sonra, varsayılan: en düşük yuva, değişiklik yok).
- **Saldırı balonundaki** Cunning Strike / Brutal Strike / Push seçici kutuları → "Özel vuruş ▸" (varsayılan: hiçbiri).
- **Alt şerit:** `Hareket 6/6` kalsın; `Eylem/Bonus/Tepki` → renkli üç nokta + ilk dokunuşta tek cümle ("Bu turda 1 eylem, 1 yardımcı eylem ve 1 tepki hakkın var"); irtifa/tavan/"bırak"/"al" parçaları şeritten çıkıp ilgili durumun içine ("Havadasın ▸").

### 1.4 Önerilen yeni yerleşim

**Üst düzey halka (en çok 6, sabit sıra):**

1. **Hareket** ▸ Yürü · Koş · Geri çekil (3)
2. **Saldır** ▸ hedef seç (şimdiki akış; silah ≥ 2 ise "Elinde ne var?" 2–5 kart)
3. **Büyü** ▸ (yalnız büyücülerde) ≤ 6 satır + "Hepsi"
4. **Yetenekler** ▸ (yalnız özelliği olanlarda; Druid: ilk satır "Biçim değiştir")
5. **Diğer** ▸ Kaçın, Gizlen, İt, Yardım, Ara, Nesne, … + yapılabilen gelişmişler ("Gelişmiş" alt başlığı)
6. **Turu bitir** (her zaman sabit, en altta/yeşil)

Büyü/özellik yoksa 5. düğme `Kaçın` ("Savun") olur: Fighter/Rogue/Barbarian/Monk: Hareket · Saldır · Savun · Diğer · Turu bitir (5). Kural: üst düzeyde ≤ 6, her ikinci adımda ≤ 6, "Daha fazla" ile sayfalanır (12 düğmelik `radialLayout` iç içe halkası gerekmez).

**Ne yap → nasıl yap → ayrıntı:** ilk dokunuşta eylem adı, ayrıntı (slot, DC, Focus, CR, kullanım sayısı) düğme içinde değil **ⓘ** simgesinde; İngilizce kural adları ("Wild Resurgence", "Nature Magician") yalnız ⓘ metninde parantezle. Düz Türkçe ad önerileri: "Biçim değiştir", "Büyü gücüne çevir/Büyüden güç al" (Font of Magic), "Doğanın gücü: büyü yuvası al", "Dostuna yardım et (iyileştir)".

**Alt şerit:** üç renkli nokta (Eylem · Yardımcı · Tepki) + "Hareket 6/6"; "Bonus" yerine oyun dili **"Yardımcı eylem"**; `Tepki` için ilk tepki sorusunda tek cümlelik açıklama.

### 1.5 Değişecek dosyalar ve büyüklük

| Dosya | Değişiklik |
|---|---|
| `src/MapBattle.tsx` | `mainItems` gruplandırması (kategori anahtarı), alt menü durumu (`moveMenu` genellemesi: `menuGroup`), halka çizimi, büyü balonu sayfalama/gruplama, `.economy` sadeleştirme |
| `src/ui/hud.ts` | `spellMenu` sıralama/gruplama yardımcıları (saf), `radialLayout` değişmez (≤ 6 düğme) |
| `src/i18n/strings.ts` / `strings.tr2.ts` / `strings.en.ts` | kategori başlıkları, düz Türkçe etiketler, ⓘ metinleri; `featureName` kayıtları (İngilizce adların Türkçesi), `hints` kısaltma |
| `src/ui/actionHints.ts` | kategori ipucu; kısa/uzun ipucu ayrımı |
| `src/styles.css` | kategori düğmesi, ⓘ, sayfalama |
| `data/class-features.json` | (isteğe bağlı) özellik başına `kisaAd`/`ozet` alanı; veride olmayan özellik adı için geri düşüş |

**Büyüklük: BÜYÜK** (`mainItems` ~210 satır, 50+ özel durum anahtarı; her yeni mekanik bu listeye eklenmiş). Önce yalnız **gruplama** (anahtar → kategori tablosu, mevcut `act` kapanışlarına dokunmadan) yapılırsa **orta**.

### 1.6 Testlere etkisi

- `src/ui/actionHints.test.ts`: `MapBattle.tsx` kaynağını `?raw` ile okuyup `const moveItems: Item[]` … `const actorPx` arasındaki `key: '…'` değerlerini tarar ve her birinin ipucu olmasını ister. **Kaynak metne bağlı**: `mainItems` yeniden düzenlenirse bu iki çapa ve `key: '[a-z_]+'` kalıbı korunmalı ya da test güncellenmeli.
- `src/ui/hud.test.ts`: `radialLayout` (12 düğmeli yerleşim, kenar/köşe), `spellMenu` türleri, `slotChoices`; saf fonksiyonlar değişmezse etkilenmez, yeni gruplama yardımcıları için test eklenir.
- `src/i18n/strings.test.ts`: TR/EN yapı eşliği; yeni anahtar iki dosyaya birden.
- `src/ui/binekMb6.test.tsx`, `movePreview.test.ts`, `summonView.test.ts`, `effectsView.test.ts`: `hints`/menü anahtarlarına dolaylı bağ; doğrulanmadı, uygulama görevinde çalıştırılıp bakılmalı.
- DOM'a (`.radial-btn`) bağlı birim testi yok; `scripts/ses-kontrol.mjs` yalnız `≡` ve "Kuruluma dön"e dokunur (halka menüye değil). `check:harita` menüye dokunmaz.

### 1.7 Risk

- **Kaynak düğmeleri:** `featureProblem`/`resourceLeft`/`why()` ile üretilen `reason` metinleri halka menüde soluk neden olarak gösteriliyor; gizleme (ilke 5) bu geri bildirimi kaybettirir → üst düzeyde nedeni söyleyen satır korunmalı (`Y.*` metinleri, `reasons.ts`).
- **Tepki sorusu / elle zar:** `run()` → `NeedDice`/`NeedReaction` akışı menü öğesinin `act` kapanışına bağlı; kapanışlar olduğu gibi taşınmalı, yalnız **nerede gösterildiği** değişmeli. `reset()` her `act` içinde `setMenuOpen(false)`/`setMode` çağırıyor; alt menü durumu da `reset()`'te sıfırlanmalı (yoksa ikinci tur menüsü açık kalır: `useEffect` :848).
- **Ele geçirme** (`POSS_KEYS` :1622) anahtar süzgeci: kategorileme anahtarları korumalı.
- **Soluk düğmenin dokununca açıklama göstermesi** (`tip` durumu, :2252–2260, uzun basış) ve fare üzerine gelince ipucu; yeni kategori düğmeleri aynı mekanizmayı kullanmalı.
- `reach` hesabı (:1382–1394) menü açıkken tüm savaşçılar için `execute` kuru çalıştırması yapar; gizleme/gruplama bunu **daha sık** çağırmamalı (kategoriye girince değil, menü açılınca bir kez).
- Replay/kayıt etkilenmez (yalnız arayüz; komutlar aynı).

---

## 2. Karakter oluşturucu (7 adımlı sihirbaz)

**Dosyalar:** `src/screens/Builder.tsx` (1701 satır; adımlar `wizardSteps` :95-102), `src/rules/builder.ts` (`characterIssues`, `newCharacter`, `switchClass` :288), metinler `src/i18n/strings.ts` `builder.*` ve `strings.en.ts`.

Ölçüm: `Builder` adım adım `renderToStaticMarkup` ile çizildi; sayı = `<button>` + `<select>` + `<input>`; adım gövdesi = `.wiz-card` içinden `.wiz-nav`'a kadar. Kapalı `<details class="item-group">` içindekiler "görünür" sayıma girmedi.

### 2.1 Bugünkü durum

Adımlar: Karakter, Puanlar, Beceriler, İlerleme, Donanım, Büyüler (yalnız büyü seçebilen sınıfta), Özet; hizalanma ev kuralı açıksa sonda +1. Fighter 6, büyücüler 7 adım (dosyadaki "9 adımlı" yorumu :121 bayat). Seviye 6+ için ayrı anahtar yok: oluşturucu her zaman 1–20 sunar (`Builder.tsx:376`).

| Adım | Fighter 1 | Fighter 5 | Fighter 20 | Wizard 1 | Wizard 20 | Druid 9 | Warlock 20 |
|---|---|---|---|---|---|---|---|
| Karakter | 45 | 46 | 46 | 45 | 50 | **121** | 79 |
| Puanlar (standart) | 29 | 29 | 29 | 29 | 29 | 29 | 29 |
| Beceriler | 23 | 23 | 23 | 23 | 25 | 24 | 22 |
| İlerleme | 1 | 15 | **100** (84 düğme + 14 radyo) | 0 | 70 | 28 | 70 |
| Donanım (görünür / tümü) | **206 / 605** | 206 / 605 | 206 / 605 | 72 / 471 | 72 / 471 | 168 / 567 (Cleric) | 72 / 471 |
| Büyüler | – | – | – | 75 | **421** | 93 | 50 |
| Özet | 1 | 1 | 1 | 1 | 1 | 1 | 2 |

Ek ölçümler:
- **Karakter adımı** (Fighter 1, 45 denetim): 10 tür kartı, 4 kültür kartı (Human), 3 ten tonu, 12 geçmiş kartı, 12 sınıf kartı, 2 cinsiyet düğmesi, seviye seçici (20 seçenek), ad kutusu, 3 sınıf özelliği satırı + ⓘ. Druid 9'da +72 Wild Shape hayvan kartı (`FormPicker`), Warlock 20'de 28 invocation düğmesi (`InvocationPicker`); Fighter 20'de 18 özellik satırı.
- **Puanlar:** point buy'da 27, zarda 23 denetim (3 yöntem düğmesi + 6 değer çipi + 6 kutu + 12 geçmiş +/− + yardımcı düğmeler).
- **İlerleme:** her ASI yuvası 12 düğme (6 yetenek × +/−) + ASI/feat radyo çifti; Fighter 20'de 7 yuva.
- **Donanım (Fighter):** 38 silah × (ana düğme + ★ + terim düğmeleri) = 108 terim düğmesi, 4 zırh + kalkan, arama kutusu, 8 tür çipi, 6 kademe çipi, 7 kapalı grupta 400 eşya onay kutusu.
- **Büyüler:** Wizard 5'te 218 satır DOM'da (4 grup açık, 6 grup kilitli); her büyüde "Kitaba ekle" + "Hazırla" iki düğme.
- **Aynı sorun listesi dört yerde:** adım altı `ul.problems` (:219), yan panel (:233), mobil alt çubuk (:237), Özet adımı (:215).
- **Çerçeve:** adım çubuğu 6–7 düğme + ‹, İptal, Geri, Devam; Puanlar sayfasında toplam 41 düğmenin 12'si çerçeve.

Hedef: adım başına ≤ 6 ana seçenek. Bugün en sade adım bile (Puanlar 29, Beceriler 23) 4–5 kat fazla; en kalabalık adımlar 121 / 206 / 421.

### 2.2 Kural dili / uzun metinler

| # | Metin (TR) | Yer | Anahtar |
|---|---|---|---|
| 1 | "Yetenek artışı (ASI) ya da feat yuvaları sınıf tablosundaki seviyelerde açılır. Boş bırakılan yuva skorları değiştirmez." | `strings.ts:184` | `builder.progressHelp` |
| 2 | "Bir skora +2 ya da iki skora +1; hiçbir skor 20'yi geçemez." | `strings.ts:212` | `builder.asiRule` |
| 3 | "Seçtiğin geçmiş sana bir başlangıç feat'i verir. Bu, ASI ve feat yuvalarından ayrıdır." (başlık "köken feat'i") | `strings.ts:187` | `builder.originHelp` |
| 4 | "Ustalığını kullanacağın silahları seç (yalnızca yakın dövüş silahları); her silahın ustalığı SRD silah tablosundan. Savaşta etkisi otomatik uygulanır. Uzun dinlenmede 1 seçim değiştirilebilir." | `strings.ts:222-223` | `builder.masteryHelp` |
| 5 | "Değerin altındaki kısa ad (WIS, CON…) o değerin şu an hangi kartta olduğunu gösterir; ona dokunursan iki kart değerlerini takas eder." | `strings.ts:280` | `builder.wiz.chipNote` |
| 6 | "Geçmiş; yetenek bonusunun hangi üç yeteneğe gideceğini, köken feat'ini ve iki beceriyi belirler." | `strings.ts:284` | `builder.wiz.backgroundHelp` |
| 7 | "⚠ Bu zırhta eğitimin yok: Güç ve Çeviklik d20 testleri (saldırı, save, kontrol) dezavantajlı, büyü yapılamaz." | `strings.ts:269` | `builder.wiz.armorUntrained` |
| 8 | "Attack eylemiyle Light bir silahla saldırınca yan eldeki Light silahla bonus eylemle bir ek saldırı (Nick ustalığıyla eylemin içinde). Hasara yetenek değiştiricisi eklenmez; Two-Weapon Fighting ekler. Versatile silah iki elle tutulmaz." | `strings.ts:143` | `builder.offHandHelp` |
| 9 | "Standart dizi (15, 14, 13, 12, 10, 8) her skora bir kez dağıtılmalı." ve "Uzmanlık: N seçim yalnızca şu becerilerden: …" — **i18n dışı, koda gömülü TR** | `src/rules/builder.ts:332`, `:419` | `characterIssues` (42 `push(`) |
| 10 | "Bu seviyede henüz oyunda olmayan özellikler: …" ve "6+ seviye deneysel: bazı sınıf özellikleri oyunda henüz yok, karakter olduğundan zayıf oynayabilir." | `strings.ts:228-229` | `builder.notYet`, `builder.experimental` |

Ek bulgular:
- `characterIssues` metinleri i18n'de değil `src/rules/builder.ts` içinde sabit TR; EN'e çevrilmiyor ve `wizard.test.tsx`, `k4`, `k5`, `k6`, `k20` bunları birebir sınıyor.
- `FeatNote` feat'in SRD faydasını İngilizce gösterir (`Builder.tsx:1495-1503`); beceri satırında TR adın yanında EN ad ("Akrobasi Acrobatics DEX", :815); silah terim düğmeleri İngilizce kısaltmasız (Finesse, Light, Heavy, Two-Handed, Versatile, Reach, Thrown, Ammunition, Loading, Nick, Vex, Sap, Topple, Cleave, Graze, Push, Slow; `strings.ts:268`).
- Geliştirici durum etiketleri ("savaşta çalışır / kısmen çalışır / savaşta etkisi yok / oyunda henüz yok", `strings.ts:169`) oyuncuya gösteriliyor.

### 2.3 İlk bakışta gereksiz → ikinci adıma / Gelişmiş'e

- **Geçmiş (12 kart, kart başına 3 satır), ten tonu, kültür/soy kartları:** varsayılan Soldier ve ilk soy zaten seçili.
- **Seviye seçici (20 seçenek):** küçük +/− ya da Gelişmiş.
- **Puan yöntemi (3 düğme), sıfırla/öner, çip açıklaması:** varsayılan sınıfa göre standart dizi; point buy ve zar Gelişmiş'te.
- **Geçmiş bonusu 6 × +/−:** önerilen dağılım otomatik gelsin (bugün yalnız yumuşak uyarı, :1193).
- **Beceriler:** 18 satır yerine sınıf listesinden seçilebilen 5–8'i; sınıf becerileri ön seçili; kalanı "Diğer".
- **ASI +/− (12 düğme/yuva):** varsayılan "en önemli yeteneğe +2"; elle dağıtım ve feat geçişi Gelişmiş'te.
- **Dövüş stili kartları:** 4 uzun açıklama aynı anda; seçili hariç kapalı.
- **Donanım:** 400 eşya, kademe/tür çipleri, ★ ustalık, silah terim düğmeleri, yan el seçici, uyum sayacı, `CarryBar` → Gelişmiş.
- **Büyüler:** tüm seviyeler tek sayfada, 2 düğmeli satırlar; kitap/hazırlama ayrımı, başka sınıf listeleri, kilitli gruplar → Gelişmiş.
- **Sınıf özellikleri listesi + renk lejandı, ek seçimler** (Metamagic, Invocation, Wild Shape biçimleri, Wish listesi) → Gelişmiş.

### 2.4 Önerilen yerleşim

Yeni Ayarlar anahtarı / mod yok. "Gelişmiş" yalnız ekran içi `<details>`; kayıt şeması aynı; yeni kayıtta alanlar önerilen değerle dolu gelir. Ana akış 5–7 ekran, her biri tek karar, ≤ 6 seçenek:

1. **"Kim olacaksın?"** — Ad (önerilen ad dolu) + Sınıf: 6 öne çıkan kart (Fighter, Wizard, Rogue, Cleric, Ranger, Barbarian) + "Diğer sınıflar (6)"; kartta tek cümle oyun dili ("Yakın dövüşte güçlü, zırhlı"). Tür: 6 kart + "Diğer türler (4)". **Gelişmiş:** seviye, soy/kültür, ten tonu, geçmiş (Soldier ön seçili; sınıfa uygun geçmiş önerilir).
2. **"Güçlü yönlerin"** — 6 yetenek salt okunur kartlar, sınıfa göre öneri dolu + geçmiş bonusu önerilen dağılımla uygulanmış. **Gelişmiş:** çipler, point buy, zar, geçmiş bonusu elle.
3. **"Becerilerin"** — sınıf listesinden 5–8 beceri, ön seçili (sayaç hak sayısını söyler). **Gelişmiş:** öteki beceriler, uzmanlık.
4. **"Eşyaların"** — sınıfa göre "Başlangıç takımı" tek kart. "Değiştir": 4 zırh + kalkan, silah listesi (yetkin olanlar). **Gelişmiş:** ustalık, yan el, 400 eşya, taşıma.
5. **Büyücülerde "Büyülerin"** — önerilen paket ön seçili; "Değiştir": seviye başına tek sekme, satırda tek düğme. **Gelişmiş:** kitap/hazırlama, başka listeler.
6. **Seviye 3+ ya da seviye-1 dövüş stili olanlarda "Ek güçler"** (ASI/feat/alt sınıf) — yuva başına tek kart, ön seçili "Yetenek +2 (önerilen)"; alt sınıf ön seçili.
7. **"Hazır!"** — iki satır özet + tek büyük Kaydet; eksik varsa tek yerde "Şunu tamamla: 2 beceri seç" (dört yerdeki tekrar kalkar).

Varsayılan akış: bugün taze karakterde yalnız ad + 2 beceri eksik; öneriler dolu geldiği için Devam → … → Kaydet hiçbir şeyi değiştirmeden bitebilir.

**İlke 5 notu (oluşturucu):** üst düzey sabit düğmeler (Kaydet, Geri, Devam, adım çubuğu, sınıf/tür kartları) gizlenmez. **Kaydet** bugün `disabled={problems.length > 0}` (`Builder.tsx:226`): soluk olmasın; dokununca "Önce şunları tamamla: 2 beceri seç" + ilk eksik adıma götüren düğme (dört yerdeki tekrarlı sorun listesi tek bu bildirime iner); `props.onSave` bu denetimden sonra çağrılmalı, yoksa eksikli karakter kaydedilir. İç listelerde gizlenir: kilitli seviye grupları ("🔒 4. seviye", `Builder.tsx:1074-1081`), sınıf dışı/`spell-row missing` satırları (:1041-1046), geçmiş dışı üç yetenek (`bg-bonus off`, :731), ASI'da yapılamayan yön (:771-773), `dim` beceri satırları (:814), uyum dolunca ek uyumlu eşya (:974), geçersiz yan el seçenekleri (:1431; hiç yoksa tek satır neden). Etki: `k5.test.tsx:27` (`<button class="cta" disabled="">Kaydet</button>`), `k4` (disabled onay kutuları), `k6` ("Hazırla" disabled), `k30` (disabled "Öğren"), `asi-ui` (`disabled(...)`) yeni davranışa göre yeniden yazılır.

### 2.5 Değişecek dosyalar / büyüklük — **BÜYÜK**
- `src/screens/Builder.tsx` (1701 satır): bölünmeli (örn. `src/screens/builder/*.tsx`); `AdvancementPanel`, `SpellsStep`, `EquipmentStep` yeniden düzenlenir.
- `src/rules/builder.ts`: `BuilderStep` tipi; `characterIssues` metinleri i18n'e; yeni saf öneri yardımcıları (`recommendedSkills`, `recommendedBonuses`, `recommendedKit`, `recommendedSpells`, `recommendedAsi`); `newCharacter` varsayılanları.
- `src/i18n/strings.ts`, `strings.en.ts` (`builder.wiz.*` sadeleşir), `src/styles.css` (`wiz-*`), `data/aciklamalar.json`, `data/backgrounds.json`, `src/ui/descriptions.ts`, `src/ui/equipmentText.ts`; gerekirse `src/rules/advancement.ts`, `src/App.tsx` (`onEdit`'e başlangıç adımı).

### 2.6 Testlere etkisi (çoğu SSR + metin/sınıf adı)
- `src/screens/wizard.test.tsx` (10 test): `wizardSteps` uzunluğu 6/7, "1 / 6 · Karakter", "2 / 7 · Puanlar", `coming-soon`, "Seçilmedi (zorunlu)", `score-box` ×6, "15 temel + 0 geçmiş", "Kalan puan 27 / 27", `skill-row`, "Sınıf becerisi 1/2".
- `src/rules/alignment.test.ts` (`wizardSteps`); `asi-ui.test.tsx` (`asi-card`, "Kalan puan: 2 / 2", aria-label'lar, `15 → <b class="asi-final">17`); `g1.test.tsx` (`pick-card background-card on`, geçmiş adları, `stepper bg-bonus off`, `<option value="skilled"`); `k4.test.tsx` (Puanlar'da `<select` yok, `value-chip` 6/1/5, `stepper bg-bonus` ×6, "uyum 3 / 3"); `k5.test.tsx` ("Taşınan 58 / 225 lb", `<button class="cta" disabled="">Kaydet</button>`); `k6.test.tsx` ("Cantrip 1 / 4", "Hazırlanan 3 / 9", `<details class="spell-group locked">`, aria-label "<ad>: Hazırla"); `k16.test.tsx` ("Sınıfa göre öner", "Sıfırla", `stepper`); `k18.test.tsx` ("Kitaba ekle", `term-btn`, "Ustalığı seç:", `feature-sum`); `k20.test.tsx` ("Skilled: 3 beceri seç", `feat-card selected`); `k30.test.tsx`; `celestial-ui.test.tsx`; `src/rules/altSoy41.test.tsx`; `src/rules/k2a.test.tsx` ("Zarları at", "Masa zarıyla gir"); `src/battle/paket/p12.test.tsx` (`feature-tag`, `aria-label="sans N. büyü"` ×8).
- `src/i18n/strings.test.ts`: TR/EN eşliği (+ `k18`: `STRINGS_TR.builder` içinde "unut" yasağı).
- Kural testleri `characterIssues` sabit TR metnine bağlı: `wizard.test.tsx` ("Ad boş olamaz."), `k4` ("en çok 3 eşya (4 seçildi)"), `k6` ("… büyü kitabında değil."), `k20` ("Skilled: 3 beceri seçilmeli …").
- Betikler: `scripts/k57-olcum.ts:59,66` (`main.builder`, "Yeni karakter"); `scripts/yukleme-olcum.mjs:138-148` zaten bayat seçiciler (`.builder-form`). `check:harita` ve `check:ses` oluşturucuya girmez.

### 2.7 Risk
- **Öneri varsayılanları** (`classSkills`, `otherSkills`, `backgroundBonuses`, ekipman, büyüler) kayda yazılır; yalnız yeni karakterde doldurulmalı. Eski kayıtlar `savableCharacter`/`classScoped`'tan geçer. `switchClass` (`rules/builder.ts:288`) sınıf değişince önerileri yeniden hesaplamalı.
- **Yeniden hesaplama zinciri:** seviye düşünce `advancements`, `expertise`, `weaponMasteries` kırpılır (`Builder.tsx:355-369`); öneri ile elle seçim ayrılmalı (kullanıcı seçimi ezilmesin).
- **Beceri/feat çakışması:** `backgroundSkills`, `otherSkillMax`, `featSkillCount` (Skilled), `normalizeFeatSkills` (:131-135) önerilen beceri setiyle çakışırsa "aynı beceri iki kaynaktan" sorunu.
- **`characterIssues` i18n'e taşınırsa** `characterProblems` eşitliği (`wizard.test.tsx:26`) ve `Screens.tsx:177` etkilenir.
- **Adım kimlikleri** (`BuilderStep`, `issues[].step`, `props.step`) testlerde ve `App.tsx`'te; adım sayısı/adı değişirse "!"/"✓" işaretleri, `StepBoundary`, `visited` yeniden bağlanmalı.
- **Ana parça sınırı (420 kB):** öneri yardımcıları `rules/builder.ts`'te kalırsa ana parçaya girer (`Screens.tsx` onu içe aktarır); büyük öneri tabloları JSON + tembel olmalı.
- **Eski kayıt göçleri** (`clearInvalidSubclass`, `migrateSubclasses`, `withAlignment` :256, dış paket alt sınıfı, Wish/Invocation/Metamagic/Wild Shape seçimleri) kaybolmamalı. Gelişmiş altına taşınan alanlar "eksik sorun" üretiyorsa (Metamagic seçilmeli, Pact silahı) görünür kalmalı; yoksa Kaydet nedeni gösterilmeden kilitlenir.
- EN çeviri eşitliği iki dosyada birlikte. Mobil düzen (`wiz-mobile-sum`, yapışkan önizleme) CSS'e bağlı; SSR ile doğrulanamaz, `check:harita` bu ekranı gezmez: **tarayıcıda doğrulanamadı**.

---

## 3. Karakter listesi (Oyuncular ekranı)

**Dosyalar:** `src/screens/Screens.tsx` (`PlayerScreen` :306, `CharacterCard` :175, `RestPanel` :209, `MasteryDrills` :271-303; hepsi ana parçada), metinler `strings.ts` `player.*`, `player.rest.*`.

### 3.1 Bugünkü durum

| Durum | Üst | Kart başına | Toplam |
|---|---|---|---|
| Boş liste | 2 (Ana ekran, Yeni karakter) | – | 2 + boş metin |
| 3 kart, dinlenmiş | 2 | 2 (Düzenle, Sil) | 8 |
| 3 kart, HP/slot harcanmış (ölçüldü) | 2 | **6** (zar −, zar +, Kısa dinlenme, Uzun dinlenme, Düzenle, Sil) | **20** |
| 6 kart, harcanmış (hesaplandı) | 2 | 6 | 38 |

Kart başına 5–9 metin satırı + kaynak çipleri: ad, "Human Fighter, 5. seviye · HP 44 · AC 11 · hız 30 ft", "Durum: HP 3/44 · HP zarı 3/5", "Kalan: Action Surge 1/1, Second Wind 3/3", "Slotlar: 1: 0/4 · 2: 0/3 · 3: 0/2", "Harcanacak HP zarı", "1 sorun", soy satırı, ağırlık rozeti, "Ustalık: …". Duruma göre: Warlock'ta "Magical Cunning" (:255), uzun dinlenme sonrası silah talimi (ustalık sayısı kadar seçici + "Ustalıkları kaydet" + "Değiştirme", :271-303), ölüde "Diriltildi say". Seviye değiştirme bu ekranda yok (oluşturucu Kimlik `Builder.tsx:373`, Game Master `GmScreen.tsx:253`).

### 3.2 Kural dili / uzun metinler

| # | Metin (TR) | Yer | Anahtar |
|---|---|---|---|
| 1 | "Durum: HP 3/44 · HP zarı 3/5" | `strings.ts:95` | `player.rest.status` |
| 2 | "Harcanacak HP zarı" (− 1 +) | `strings.ts:99` | `player.rest.dice` |
| 3 | "Kısa dinlenme: 5 + 3 → +8 HP; kısa dinlenmede yenilenen kaynaklar doldu." | `strings.ts:100` | `player.rest.shortDone` |
| 4 | "Uzun dinlenme: HP, slotlar ve kaynaklar doldu; HP zarlarının yarısı geri geldi." | `strings.ts:101` | `player.rest.longDone` |
| 5 | "Silah talimi: ustalık seçimlerinden en çok N tanesini değiştirebilirsin." | `strings.ts:103` | `player.rest.drills` |
| 6 | "0 HP: savaşa girmeden önce dinlenmeli." | `strings.ts:97` | `player.rest.down` |
| 7 | "Kalan: Action Surge 1/1, Second Wind 3/3" / "Slotlar: 1: 0/4 · 2: 0/3 · 3: 0/2" (İngilizce kaynak adı) | `strings.ts:95` | `player.rest.resources`, `player.rest.slots` |
| 8 | "Ustalık: Longsword: Sap (oyunda henüz çalışmıyor)" | `strings.ts:93` | `player.cardMastery`, `player.notWorking` |
| 9 | "⚖ <yük seviyesi> (N lb)" | `Screens.tsx:193` | `carry.level.*` |
| 10 | "Magical Cunning: harcanan Pact Magic slotlarının yarısı (yukarı) geri geldi." | `strings.ts:102` | `player.rest.cunningDone` |

### 3.3 İkinci adıma gidebilecekler
- HP zarı −/+ adımlayıcısı (kart başına 2 düğme) → kısa dinlenmenin ikinci adımı / varsayılan "gereken kadar" zar.
- Kısa ve Uzun dinlenme iki ayrı düğme → tek **Dinlen** düğmesi, içinde iki seçenek ve açıklamaları.
- Kaynak/slot metin satırları → "Ayrıntı ▾".
- **Sil** → "⋯" menüsüne, onaylı. "N sorun" pasif metni → tek **Tamamla** düğmesi (oluşturucuyu ilgili adımda açar).
- Ustalık, soy, yük rozeti satırları → ayrıntıya. Silah talimi (seçiciler) uzun dinlenmeden sonra ayrı ikinci adım, oyun dilinde.

### 3.4 Önerilen yerleşim (kart başına 3 düğme)
- **Üst:** Yeni karakter (birincil), Ana ekran.
- **Kart:** avatar + ad + "Human Fighter 5"; can çubuğu "HP 3/44" + durum çipi ("Hazır" / "Dinlenmeli" / "0 HP: dinlen"); **Düzenle** (eksik varsa **Tamamla**); **Dinlen ▾** → "Kısa mola: biraz iyileş" / "Uzun uyku: her şeyi doldur" (kısa molada "Kaç iyileşme zarı harcanacak?" varsayılan 1); **⋯** → Sil (onaylı).
- Kaynak, slot, ustalık, yük, soy: "Ayrıntı ▾"; karta yalnız "2 güç harcanmış" özeti.
- Silah talimi uzun uykudan sonra tek soru: "Silah ustalıklarını değiştirmek ister misin?" (Evet → Gelişmiş seçiciler).

**İlke 5 notu (liste):** "Yeni karakter" 6 karakterde bugün `disabled` (`Screens.tsx:322`): gizlenmez, dokununca "En fazla 6 karakter: yeni açmak için birini sil". "Dinlen" dinlenmiş karakterde bugün tamamen kayboluyor (`RestPanel` :220); yeni tasarımda kartta hep durur, dokununca "Zaten dinlenmişsin" / ölüde "Öldü, dinlenme diriltmez" (+ "Diriltildi say") / 0 HP'de "0 HP: dinlenmeli". Dinlen ▾ içinde yapılamayan seçenek çıkmaz (yalnız neden satırı); zar adımlayıcısı (:242-244) sınırda ilgili düğmeyi gizler; "Ustalıkları kaydet" (:298) geçerli değişiklik yoksa gizlenir. Dinlenmişte sabit "Dinlen" düğmesi kart yüksekliğini değiştirir (`scripts/yukleme-olcum.mjs`, `k57-olcum.ts` seçicileri: `.char-card`, `button.role.player`).

### 3.5 Değişecek dosyalar / büyüklük — **ORTA**
`src/screens/Screens.tsx` (`PlayerScreen`, `CharacterCard`, `RestPanel`, `MasteryDrills`; 420 kB sınırı için yeni kod tembel parçaya, örn. `src/screens/PlayerCards.tsx`), `src/i18n/strings.ts` + `strings.en.ts` (`player.*`), `src/styles.css` (`.char-card`, `.rest-panel`), `src/App.tsx` (`onEdit`'e başlangıç adımı), `src/rules/characterRest.ts` (belki varsayılan zar sayısı yardımcısı; doğrulanamadı).

### 3.6 Testlere etkisi
Doğrudan ekran testi yok (`PlayerScreen`/`RestPanel`/`CharacterCard` yalnız kaynak, CSS ve betiklerde). `scripts/yukleme-olcum.mjs:135` (`.char-card .avatar img`, "Yeni karakter") ve `scripts/k57-olcum.ts:53,58` (`button.role.player`) seçiciye bağlı. `strings.test.ts` TR/EN eşliği; `characterRest` mantık testleri (`status.test.ts`) davranışı sınar. Yeni tasarımın kendi SSR sayım testi eklenmeli.

### 3.7 Risk
- `onUpdate` bütün karakteri yazar (`status`, `hitDiceSpent`, slotlar, `alignmentLongRest`); dinlenme sonrası aynı alanlar yazılmalı, yoksa Game Master kurulumundaki dinlenme (`GmScreen.tsx:245-268`) ve savaş sonu uyumsuzlaşır.
- Uzun dinlenme + silah talimi sırası (`Screens.tsx:257-261`: önce `setDrills`, sonra `onUpdate`); değişirse ustalık seçimleri kaybolabilir.
- Ölü / 0 HP durumları (:233-238, :264) yeni tasarımda da nedenle açıklanmalı (ilke 5, üst düzey sabit düğme): "Dinlen" sessizce kapanmamalı.
- Dinlenme zarları `Math.random` kullanır (:248), fiziksel zar akışı yok; bu ekranda değişmemeli. `AlignmentBadge` tembel (`Suspense`) ve ev kuralıyla koşullu, kartta yeri korunmalı. Mobil düzen CSS'e bağlı, tarayıcıda doğrulanamadı.

---

## 4. Game Master kurulumu

**Dosyalar:** `src/screens/GmScreen.tsx` (557 satır), `src/ui/gm/MapRulesPanel.tsx`, `HouseRulesPanel.tsx`, `GoalsPanel.tsx`, `GroupsPanel.tsx`, veri `data/kural-kontrol.json` (113 kayıt), `data/ev-kurallari.json` (23 kayıt), metinler `src/i18n/strings.ts` `gm.*`.

Ölçüm: ekran `renderToStaticMarkup` ile çizildi; sayı = düğme + giriş + seçici.

### 4.1 Bugünkü durum
- **İlk açılış** (varsayılan harita Ada, 2 örnek karakter, `<details>` kapalı): **169 denetim** (159 düğme + 7 giriş + 3 açılır liste), 5 `<summary>`. Düğmelerin **140'ı** 70 canavar satırının −/+ düğmesi; kalan: Serüven 2, geri 1, bölge çipi 12, harita kartı 2, "Özel canavar ekle" 1, "Savaşı kur" 1.
- **Bölüm kırılımı** (açılır bölümler dahil, toplam 281): Serüven paneli 2 düğme; Parti 2 onay kutusu + 2 seviye listesi (40 seçenek); Harita 14 düğme (12 bölge + 2 kart) + 2 varyant radyosu; Düşmanlar 141 düğme + 7 giriş (arama, 5 kademe, "Tüm canavarlar"); son panel 7 düğme + 98 giriş + 5 liste (91 onay kutusu: **67 harita mekaniği, 22 ev kuralı**, 1 çok altıgen, 1 hedef "Herkes ulaşsın"; 5 sayı alanı; zar modu / zorluk / hedef listeleri).
- **Harita başına:**

| Harita | Denetim |
|---|---|
| Buzul Kayalık (gece) | 349 (78 mekanik, 24 parametre) |
| Dere Kenarı (`orman`) | 318 |
| `kale` | 284 |
| `magara` | 266 |
| Volkan | 235 |
| Taverna | 197 |
| Dungeon | 374 (113 canavar satırı) |
| Dungeon + "Tüm canavarlar" | **808** (330 satır) |
| Ortamlar Diyarı (vitrin) | 575 |

  Haritanın mekanik sayısı 67–78; 72'si "global" olduğu için her haritada çıkar. Hedefler paneli 14 haritada, gruplar paneli yalnız 5 haritada (Hapishane, Kale Baskını).
- Varsayılan zaten geçerli: `counts={wolf:2}` (`GmScreen.tsx:91`), ilk 4 hazır karakter partide (:89).

### 4.2 Kural dili / uzun metinler
1. "Altıgen etki çözücüsü: yüzey, gaz, duvar ve büyü tepkimeleri tek tablodan, sabit öncelik sırası, katman başına bir yüzey, zincir derinliği 3 (Kuyruk K55)" — `data/kural-kontrol.json:160` (`rules.hexResolver.tr`).
2. "Brutal Strike (Barbarian 9: Reckless'ta avantajdan vazgeç, isabette +1d10 ve itme ya da yavaşlatma)" — `data/kural-kontrol.json:118`.
3. "Aura of Protection dostlara (Paladin'in 10 ft içindeki dostlarının save'lerine CHA; kapalıysa yalnızca Paladin'e)" — `kural-kontrol.json:115`.
4. "Arazi × büyü: ateş ve soğuk büyüleri zemin türüne göre yüzey bırakır (kuru ot tutuşur, sığ su donar, kar erir; hasar zarı değişmez; Kuyruk K56; altıgen etki çözücüsü açıkken)" (174 karakter, en uzunu) — `kural-kontrol.json:159`.
5. "Moral (tam mod): 0'da Çökmüş, eşik cezaları, toparlama, zafer ödülü (data/moral.json; kural sürümü 20)" — `data/ev-kurallari.json:12`.
6. "Çarpma hasarı: zorla hareket engelde yarıda kalırsa kalan her altıgen için 1d6 kuvvet (en çok 3d6); çarpılan yaratık da aynısını ayrı zarla alır (SRD'de yok; kural sürümü 24+)" — `ev-kurallari.json:24`.
7. "İmza alt sınıf: <ad> (Fighter, ev kuralı; data/imza.json, kural sürümü 23)" — `ev-kurallari.json:14` (aynı biçimde 10 satır).
8. "Large 3, Huge 7, Gargantuan 19 altıgen kaplar: hareket, erişim, alanlar, zemin, itme ve görüş gövdeye göre. Gargantuan yalnız orta/geniş haritada (en az 21×11). Varsayılan kapalı." — `strings.ts:357` (`gm.multiHex.note`).
9. "Her mekanik açılıp kapanır, parametreleri düzenlenir; kapalıyken görsel, zemin ve nesneler aynı kalır, yalnızca kural etkisi durur. Seçimler savaş kaydına yazılır." — `strings.ts:351` (`gm.mapRules.note`).
10. Ham koordinat girişi "Altıgenler (sütun,satır; ör. 15,3 16,3)" ve "Yalnızca yen / Kaç (doğu kenarı) / 5 tur dayan" — `strings.ts:615-616` (`goals.gm.hexes`), giriş `GoalsPanel.tsx:100`.
- Ek: "Masumların yarısı ölürse kaybedilir (sıkı kural)" (`strings.ts:425`), "Düşmanlar ejderhayı asla uyandırmaz" (:430), "Usta (deneysel)" (:356), "Fiziksel zarlar: yalnızca oyuncu karakterleri" (:718); gruplar panelinde ham grup kimliği (`GroupsPanel.tsx:28`).

### 4.3 İlk bakışta gereksiz → ikinci adıma / Gelişmiş'e
- **Harita mekanikleri** (67–78 onay kutusu, `MapRulesPanel.tsx:23-47`): 65/67'si varsayılan açık, çoğu geliştirici etiketi (`aiPatrol`, `aiKeg`, "Kuyruk K53"…). Hepsi **Gelişmiş ▸ Harita mekanikleri**. Parametre alanları (:63-75) mekanik kapalıyken soluk `disabled` → kapalıyken gizlenir.
- **Ev kuralları** (22 onay kutusu, `HouseRulesPanel.tsx:12-24`): 13'ü "karakter" bayrağı (10 imza alt sınıf, Karadul, 2 hizalanma) ve Ayarlar'daki aynı anahtarların kopyası → Gelişmiş'te tek yerde.
- **Hedefler** (`GoalsPanel`: 8+ düğme, 5 liste, ham altıgen girişi) ve **Gruplar** → Gelişmiş.
- **Zar modu** (`GmScreen.tsx:495-500`), **zorluk ×2** (:501-509), **çok altıgen** (:510-513): varsayılan Otomatik / Normal / Kapalı; ilk ekranda gerekmez.
- **Düşman listesi:** 70–330 satır × 2 düğme; güç filtresi (:391-403), "Tüm canavarlar" (:404-407), **özel canavar formu** (13 alan, :436-489) → ikinci adım/Gelişmiş.
- **Masum sayısı / yerleşim / sıkı kural** (:315-342) ve **uyuyan ejderha** (:343-363): yalnız ilgili haritada; tek satır özet, ayrıntı altında. **Seviye değiştir** (:246-260), **hizalanma paneli** (:262): Parti'nin ikinci katmanı.
- Soluk iç öğeler (ilke 5): parti dolunca pasif çipler (:234-238) gizlenir ("En fazla 6 karakter: sınıra ulaşıldı." satırı kalır); ölü / 0 HP karakterler (:240-242) listeden çıkar, "N karakter dinlenmeli" + "Herkes uzun dinlensin" kalır.

### 4.4 Önerilen yerleşim
Tek ekranda 3 başlık (ya da 3 adım), her biri ≤ 6 ana öğe; hiçbir şeye dokunmadan "Savaşı kur" denebilir:
1. **Kim savaşacak?** İlk 4 hazır karakter seçili; parti çipleri ≤ 6; altında "Seviye ve dinlenme".
2. **Nerede?** 6'lık ana bölge çipi (ilk bölge + "Diğer bölgeler"; bugün 12) → harita kartları; Gündüz/Gece tek anahtar; ejderha/masum seçenekleri yalnız ilgili haritada tek satır özetle.
3. **Kime karşı?** Hazır paket çipleri **Kolay / Normal / Zor** (varsayılan Normal; bölge karşılaşma üreteci `src/journey/encounter.ts` `regionEncounter` ile örtüşür, uyarlanabilirliği doğrulanamadı); altında "Listeden seç" (arama + kademe çipi ≤ 5).
4. **Savaşı kur** sabit, gizlenmez; eksik varsa dokununca nedenini söyler (`problems`, :493).
5. **Gelişmiş** (`<details>`, hepsi bugünkü varsayılanlarla): Zar modu, Yapay zekâ zorluğu, Çok altıgen, Harita mekanikleri, Ev kuralları, Hedefler, Gruplar, Özel canavar, Güç filtresi.

Serüven paneli (:214-224) ana menüdeki Serüven girişiyle çakışıyor: taşıma/kaldırma kararı gerekli.

### 4.5 Değişecek dosyalar / büyüklük — **BÜYÜK**
`src/screens/GmScreen.tsx` bölünür; `MapRulesPanel`, `HouseRulesPanel`, `GoalsPanel`, `GroupsPanel` tek "Gelişmiş" kabına girer; `src/i18n/strings.ts`, `strings.en.ts`, `strings.tr2.ts`; mekanik etiketlerinin düz Türkçeye çevrilmesi `data/kural-kontrol.json` (113 kayıt) + `data/ev-kurallari.json` (23 kayıt) metin düzenlemesi (kimlik ve diğer alanlar aynı kalmalı: `ruleControl`, `k59uyum` testleri kimliklere bağlı).

### 4.6 Testlere etkisi
- **`src/screens/setup-ui.test.tsx` (en çok etkilenen):** tüm ekranı SSR + düzenli ifadeyle okur: `<h2>Harita</h2>` ve `<h2>Düşmanlar` sırası (:87-88), `aria-label="Varyant"` + `<input type="radio" name="variant">` (:14), "Güç seviyesi seçenekleri" ve beş kademe adı (:91-96), `monster-row`/`monster-tier` (:44-45), "Tüm canavarlar" (:57-58), Ejderha seçicileri, "Önce karakter oluştur" (:88), "En fazla 6 karakter" ve devre dışı onay kutusu sayısı (:98-107; "pasif çipler gizlenir" önerisi bunu doğrudan değiştirir). Adımlı arayüzde SSR yalnız 1. adımı çizer: testler `initial` ile adım seçmeli.
- `k25.test.tsx`, `src/app/g2-smoke.test.ts`, `src/map/colPaket.test.ts`, `k27bPaket.test.ts`: yalnız `mapRegions`, `dayNight`, `regionOf` dışa aktarımları (ad/imza korunursa etkilenmez). `modulBaslatma.test.ts` içe aktarma. `strings.test.ts:22` TR/EN eşliği, `:33` `t().gm.title === 'Game Master: savaşı kur'`. `ruleControl.test.ts`, `k59uyum.test.ts`, `y1smoke`, `y2smoke`: kural kimliklerine bağlı, arayüze değil.

### 4.7 Risk
- **e2e betikleri tek ekranlı akışı varsayar:** `scripts/kara-ekran.mjs:66-71,111,142`, `scripts/ses-kontrol.mjs:64-84`, `scripts/k57-olcum.ts:69-76` → `[data-region]` bekler, `[data-map="…"]` tıklar, sonra `button.cta`; adım eklenirse çalışmaz: aynı ekranda kalmalı ya da betikler güncellenmeli. `ses-kontrol.mjs:130-131`: `≡` ve "Kuruluma dön".
- **Savaş durumuna yazılan anahtarlar:** `createMapBattle` (`GmScreen.tsx:525`) `ruleToggles`, `ruleParams`, `houseRules`, `goals`, `groupStates`, `diceMode`, `multiHex`, `yz` alanlarını iletir; "Gelişmiş" kapalıyken de aynı değerler gitmeli. `houseRules ?? houseRuleDefaults(mapSefer, characterHouseRules())` Ayarlar'daki `rpg-battle-deneysel` değerini okur (`src/app/features.ts:2`).
- Harita/varyant değişince sıfırlayan `useEffect`'ler (:110-115, :124-128, :145) adımlı akışta yeniden denetlenmeli.

---

## 5. Ayarlar (+ savaş içi `≡` menüsü)

**Dosyalar:** `src/screens/SettingsScreen.tsx` (235 satır), `src/MapBattle.tsx:2127-2185` (`≡` / `hud-pop`), `src/screens/Screens.tsx:73-87` (ana menü çipi), `src/ui/SoundPanel.tsx`.

> Önemli bulgu: Ayarlar ekranında **ses, efekt, zar animasyonu ve tepki ayarı yok**; bunlar savaştaki `≡` menüsünde ve ana menü çipinde duruyor. Çocuk için "Ayarlar" tek yer olmalı.

### 5.1 Bugünkü durum
SSR: **28 düğme + 20 giriş = 48 denetim, 8 bölüm**, hepsi her zaman görünür (`<details>` yok).

| Bölüm (satır) | Denetim |
|---|---|
| "Deneysel: Yolculuk" (`SettingsScreen.tsx:66-92`) | 18 onay kutusu (Yolculuk, Üst seviye, Karadul, Karadul yalnız kadın, 10 imza alt sınıf, 4 hizalanma) |
| Taşıma yükü (:94-103) | 3 düğme |
| Savaş sonu videosu (:105-114) | 2 |
| Zar teması (:116-125) | 4 |
| Hamle önizlemesi + Keşif Defteri (:127-145) | 10 düğme + 1 giriş |
| Şehir görünümü (:147-156) | 2 |
| Harita rengi (:158-167) | 2 |
| Dış içerik (:168-231) | 4 düğme + 1 dosya girişi (yüklü paket başına +2) |

**`≡` menüsü** (koddan sayıldı; `optionsOpen` SSR'da açılmaz, `MapBattle.tsx:582`): her zaman 16 (Ses paneli 4 kaydırıcı + 4 sessiz düğmesi = 8; Kaydet, Yükle, Tema, Zar animasyonu, Zar teması, Oyuncu tepkileri, Düşman tepkileri, Çık); aktif savaşta +5 (yüzey aracı, nesne aracı, alanlar, tehlike katmanı, gizli alanlar); efektli haritada +3; filtreli haritada +1; haritaya göre 0–5 Game Master tetiği, kapı, grup alarmı, ejderha uyandırma, gizli jeton +1–2 → **≈ 21–33+ düğme**.

### 5.2 Kural dili / uzun metinler
1. "Karadul yalnız kadın karakterlere (karadulKadinKisiti)" — ham anahtar adı ekranda: `strings.ts:563` (`journey.karadulWomen`).
2. "Hizalanma ↔ Moral bağı (hizalanma ve Moral de açıkken)" — `strings.tr2.ts:467` (`view.hizalanma.moralFlag`).
3. "Başlangıç yalnız otomatik (kabul etmeme kapalı)" — `strings.tr2.ts:465` (`autoFlag`).
4. "SRD 5.2.1 dışı özgün alt sınıf. Açıkken oluşturucuda 3. seviye Druid seçebilir (Wild Shape yerine Örümcek Biçimi); yeni savaşlarda özellikleri çalışır." — `strings.ts:565` (`journey.karadulNote`).
5. "Dice & Hex’e özel alt sınıflar; açık olan oluşturucuda seçilir, yeni savaşlarda ev kuralı açık gelir. Birlik Manastırı (Cleric) her zaman açıktır. Planlı özellikler kartta görünür ama henüz çalışmaz." — `strings.ts:564` (`journey.imzaNote`).
6. "Güç × 5 lb üstü Yüklü (hız −10 ft), Güç × 10 lb üstü Ağır yüklü (hız −20 ft; STR/DEX/CON testleri, kurtarma zarları ve saldırılar dezavantajlı). İsteğe bağlı kural." — `strings.ts:488` (`carry.help.tiered`).
7. "Game Master ayarı: hedef seçilince onaydan önce isabet, hasar aralığı, kurtulma ve dost ateşi kartı. Kapalıyken eski akış. Ayrıntı: Kısa (tek satır) / Tam (kaynaklar ve durumlar)." — `strings.ts:468` (`previewSetting.help`).
8. "Açıkken yüzey tepkimeleri ilk kez yaşanınca öğrenilir; keşfedilmemiş tepkimenin sonucu önizlemede görünmez. Game Master her şeyi görür." — `strings.ts:469` (`previewSetting.discoveryHelp`).
9. Yanıltıcı bölüm başlığı "Deneysel: Yolculuk" (`strings.ts:568` `journey.flag`): altında Üst seviye, Karadul, imza ve hizalanma var.
10. "Kendi alt sınıf paketlerini (JSON) içe aktar. Yalnızca veri okunur, kod çalıştırılmaz. …" — `strings.ts:43` (`content.intro`).
- Ek: Ayarlar ve GM kurulumu aynı ev kuralı etiketini kullanır (`HOUSE_RULES[id].tr`, `data/ev-kurallari.json`): etiket düzeltmesi iki yeri birden düzeltir.

### 5.3 Gelişmiş'e / ikinci adıma
- **Soluk iç öğeler:** "Karadul yalnız kadın" (`SettingsScreen.tsx:74`) ve 3 hizalanma kutusu (:86-88) üst anahtar kapalıyken `disabled` → kapalıyken gizlenir, açılınca görünür.
- **Gelişmiş'e:** Yolculuk (deneme), Üst seviye (6–20), Karadul, 10 imza alt sınıf, 4 hizalanma, Önizleme ayrıntısı (Kısa/Tam), Keşif modu, İpucu rozetleri, Keşif Defteri, Dış içerik kopya politikası/klasör yükleme, Taşıma yükü (kural dili ağır; varsayılan Kapalı/SRD).
- **İlk bakışta kalanlar:** zar teması, savaş sonu videosu, hamle önizlemesi aç/kapa, şehir görünümü, harita rengi.
- İmza alt sınıf kutuları hem Ayarlar'da (:77-82) hem GM ev kuralları listesinde: bir yerde kalmalı.

### 5.4 Önerilen yerleşim (yeni anahtar yok, yalnız yer değişir)
1. **Görünüm:** Zar teması (4), Harita rengi (aç/kapa).
2. **Savaş yardımı:** Hamle önizlemesi (aç/kapa); Zar animasyonu, efektler, tepki ayarı ve Ses buraya bağlanır (bugün yalnız `≡`'de; karar bekliyor).
3. **Hikâye:** Savaş sonu videosu, Şehir görünümü.
4. **Dış içerik:** paket listesi + "Dosya seç"; kopya politikası iç satır.
5. **Gelişmiş** (`<details>`, kapalı): yukarıdaki liste.

`≡` menüsü: sabit ≤ 6 (Kaydet, Yükle, Ses, Zar, Tepkiler, Çık) + "Diğer" altında kalanlar; kayıtlı savaş yokken "Yükle" bugün `disabled` (`MapBattle.tsx:2154`): iç listede gizlenir.

### 5.5 Değişecek dosyalar / büyüklük — **ORTA**
`src/screens/SettingsScreen.tsx`, `src/MapBattle.tsx` `≡` bölümü (:2127-2185), `src/i18n/strings.ts` + `strings.en.ts` + `strings.tr2.ts`; `SoundPanel.tsx` zaten ayrı bileşen.

### 5.6 Testlere etkisi
`SettingsScreen` içeriğini sınayan test yok (tek bağ `src/app/modulBaslatma.test.ts:17`). `src/screens/m1.test.tsx:24-28` ana menüde "Ayarlar" metnini bekler: ana menü girişi değişmemeli. `celestial-ui.test.tsx` etkilenmez. `strings.test.ts:22` TR/EN eşliği. `≡` menüsünü (`hud-pop`, "Oyuncu tepkileri", "Zar animasyonu") sınayan birim test yok; yalnız e2e betiği.

### 5.7 Risk
- **localStorage anahtarları aynı kalmalı** (ayarlar sıfırlanmasın): `rpg-battle-deneysel` (yolculuk, ustSeviye, karadul, imza, hizalanma* tek JSON), `rpg-battle-tasima`, `rpg-battle-son-video`, `rpg-battle-dice-theme`, `rpg-battle-onizleme`, `rpg-battle-kesif`, `rpg-battle-sehir-gorunum`, `rpg-battle-harita-renk`, `rpg-battle-effects`, `rpg-battle-effects-density`, `rpg-battle-sprite-anim`, `rpg-battle-reactions`, `rpg-battle-tehlike`.
- Ev kuralı varsayılanları GM kurulumunda Ayarlar'daki imza/Karadul/hizalanma bayraklarından türer (`characterHouseRules()`); Gelişmiş'e taşınsa da okuma yolu bozulmamalı.
- `scripts/ses-kontrol.mjs:130-131` `≡` düğmesi ve "Kuruluma dön" metnine bağlı; "Diğer" katmanı eklenirse iki seçici güncellenmeli. ("Kuruluma dön" etiketini üreten metin satırı bulunamadı: doğrulanamadı.)

---

## 6. Oda kur / ana menü

**Dosyalar:** `src/screens/Screens.tsx` (`Home` :96-161), `src/App.tsx` (yönlendirme), `src/screens/GmScreen.tsx` ("Oda kur" = ana menüdeki "Game Master" girişi; iç ayrıntı §4'te, burada yalnız ana menü ve girişle ilgili bulgular).

### 6.1 Bugünkü durum
- **Ana menü** (`Screens.tsx:96-161`): **8 düğme** = 4 görünüm çipi (Tema, Ses, TR, EN; :106-113) + Oyuncu (:129) + Game Master (:133) + Serüven (:140) + Ayarlar (:153). "Kayıtlı savaşa devam et" (:123) ve "Yolculuk (deneme)" (:147; bayrak `App.tsx:190`) eklenince **10**.
- **Oda kur** (`GmScreen.tsx:73-536`; 2 karakterle, varsayılan harita): görünen 19 düğme (Ana ekran, 2 Serüven düğmesi, 12 bölge çipi, 2 harita kartı, "Özel canavar ekle"…) + 3 seçici (zar modu, 2 YZ zorluğu) + 7 giriş + **70 canavar satırı × (−/+) = 140 düğme**. DOM toplamı 165 düğme, 5–7 seçici, 107–109 giriş; geniş haritada (`orman-yolu`) 192 görünen düğme. Kapalı `<details>` içinde 5 bölüm (Seviye değiştir, Güç filtresi, Harita mekanikleri 67 kutu, Ev kuralları 22 kutu, Hedefler). **"Savaşı kur" sayfanın en altında** (:519-526), 70 satırın ve 5 ayar bölümünün ardından.
- **Varsayılanlar:** harita alfabetik ilk kimlik `ada` (Deniz; `GmScreen.tsx:99`, `maps.ts:515` `localeCompare`) — ilk açılışta çocuğa denizde bir ada geliyor, bilinçli görünmüyor; düşman varsayılanı `wolf:2` (:91) haritadan bağımsız.

### 6.2 Kural dili / uzun metinler
1. "Harita mekanikleri (65/67 açık)" + "Her mekanik açılıp kapanır, parametreleri düzenlenir; kapalıyken görsel, zemin ve nesneler aynı kalır, yalnızca kural etkisi durur. Seçimler savaş kaydına yazılır." — `strings.ts:351-352`, `gm.mapRules`.
2. "Ev kuralları (6 açık)" + "SRD 5.2.1 dışı kurallar; her biri ayrı açılıp kapanır. Serüven kuralları yalnızca serüven haritalarında açık gelir." — `strings.ts:359`, `gm.houseRules`.
3. "Çok altıgenli büyük yaratıklar (deneysel)" + "Large 3, Huge 7, Gargantuan 19 altıgen kaplar…" — `strings.ts:357-358`, `GmScreen.tsx:510-513`.
4. "Fiziksel zarlar: yalnızca oyuncu karakterleri" + "Fiziksel zarda oyun gereken zarı ister; sonucu girersin ya da "Otomatik at"a basarsın. Yapay zekâ ve denge simülasyonu her zaman otomatik atar." — `strings.ts:717-721`, `dice.mode`.
5. "Yapay zekâ zorluğu: Usta (deneysel)" — `strings.ts:356`, `gm.aiDifficulty`.
6. "Hedef yok: eski kural (bütün düşmanları yen)." ve "Altıgenler (sütun,satır; ör. 15,3 16,3)" — `strings.ts:614-615`, `goals.gm.none/hexes`.
7. "Masumların yarısı ölürse kaybedilir (sıkı kural)" (`strings.ts:425`); "Ejderhayı uyandırma (yapay zekâ düşmanları)" / "Düşmanlar şansa bağlı uyandırır" (`strings.ts:428,430`).
8. Canavar satırı "CR 3 · HP 45 · AC 13 · tema" (`GmScreen.tsx:415`); kademe başlığı "Giriş Seviye (CR 0–½) · 29" (:412); "Ara: ad ya da "CR 5" (n canavar)" (`strings.ts:435`).
9. Özel canavar formunda hasar türü ham İngilizce (`slashing`, `piercing`, `bludgeoning`…) — `GmScreen.tsx:454`.
10. Ana menü: "Altıgen haritalarda D&D 5. sürüm (SRD 5.2.1) kurallarıyla sıra tabanlı taktik savaşlar…" (`strings.ts:31`, `home.intro`); "Haritayı ve düşmanları seç, savaşı kur ve yönet" (:33); "Sürüm … · SRD 5.2.1 kurallarına dayanır" (:36); "Game Master" / "Oyuncu" kavramları çocuğa açıklanmıyor.

### 6.3 İkinci adıma / Gelişmiş'e
- Ayrıntılar §4.3'tedir (mekanik/ev kuralı/hedef/grup/zar modu/YZ zorluğu/çok altıgen/seviye değiştir/özel canavar).
- **Ana menü:** Tema / Ses / Dil çipleri ikincil kalsın (zaten küçük); **Yolculuk (deneme)** düğmesi ana menüden kalksın, mevcut bayrak Ayarlar'da "Gelişmiş" altında (yeni anahtar gerekmez).
- **Bölge çipleri 12** (Test ve vitrin, Yerleşimler dahil) → ilk 6 + "Diğer".
- İlk açılışta rastgele/alfabetik değil, **bölge sırasındaki ilk harita** varsayılan olsun.

### 6.4 Önerilen yerleşim
- **Ana menü (5 ana):** Devam et (kayıt varsa) · Serüven · **Savaş kur** (eski "Game Master") · **Karakterlerim** (eski "Oyuncu") · Ayarlar. Altta tema/ses/dil çipleri.
- **Oda kur — 3 adım + sabit "Savaşı başlat":** (1) Takımın: karakter çipleri ≤ 6, ilk 4 hazır karakter seçili, "Herkes dinlensin" (yorgun varsa); (2) Nerede: 6 bölge (Orman, Dağ, Buzul, Çöl, Bataklık, Yeraltı) + "Diğer" → ≤ 6 harita kartı, Gündüz/Gece tek anahtar; (3) Kime karşı: "Önerilen karşılaşma" (Kolay/Orta/Zor; `regionEncounter`, `src/journey/encounter.ts`) ya da "Düşmanı kendim seçeyim"; varsayılan seçili haritaya uyan önerilen grup. "Diğer / Gelişmiş": canavar listesi + filtre + özel canavar, zar modu, YZ zorluğu, çok altıgen, mekanikler, ev kuralları, gruplar, hedefler, seviye değiştir, masum/ejderha ayrıntıları.

### 6.5 Dosyalar / büyüklük — **BÜYÜK** (ana menü tek başına **küçük**)
`Screens.tsx` (`Home`): küçük. `GmScreen.tsx` (557 satır) 3 adıma bölünür, `src/ui/gm/*Panel.tsx`, `strings.ts` + `strings.en.ts`: büyük. `src/App.tsx`: ölü rota `status` (:239-240; `Home` `onStatus`'ı kullanmıyor, `Screens.tsx:96`) temizlenebilir.

### 6.6 Testlere etkisi
- `src/screens/m1.test.tsx`: 'Oyuncu', 'Game Master', 'Ayarlar', `role="radiogroup"`, `home2-panel`, `class="role home-card` tam 2 adet, `home-card resume` önce `home-card player`, "gece · 3. tur", sürüm metni, `<svg`. Etiket ve düğme sayısı değişince kırılır.
- `src/ui/logo.test.tsx:271-276`: Home logosu/başlığı (başlık kalırsa etkilenmez).
- `src/screens/setup-ui.test.tsx`: varyant `radiogroup`/`name="variant"`, "Ejderha" seçicileri, `monster-row`/`monster-tier`, `<h2>Harita</h2>` sırası `<h2>Düşmanlar`'dan önce (adım sırası değişirse kırılır), "Güç seviyesi seçenekleri" 5 kademe, "Önce karakter oluştur", "En fazla 6 karakter", devre dışı onay kutusu deseni (7 karakter), 'Hazır savaş|Örnek karakter|Aynala' yok.
- `k25.test.tsx`, `src/app/g2-smoke.test.ts`, `src/map/colPaket.test.ts`, `k27bPaket.test.ts`: `mapRegions`/`dayNight`/`regionOf` dışa aktarımları `GmScreen`'de kalmalı. `modulBaslatma.test.ts`, `strings.test.ts`.
- **Betikler** (`check:harita` / `check:ses`): `scripts/kara-ekran.mjs:66-71,110,138,142`, `scripts/ses-kontrol.mjs:56,64-71,84,124`, `scripts/yukleme-olcum.mjs:134-137` → `button.role >> nth=0/1`, `[data-region]`, `[data-map=…]`, `button.cta`, "Kayıtlı savaşa devam et", "Yeni karakter", `.home2-tools button.home-chip[aria-label^="Tema"]`.

### 6.7 Risk
- Betik seçicileri: Oda kur adımlara bölünürse `[data-region]` ve `[data-map]` aynı anda DOM'da olmalı, `button.cta` bulunmalı; yoksa `check:harita`/`check:ses` kırılır (ana menü etiketlerinin yeniden adlandırılması da `button.role` seçicisini etkileyebilir).
- `useEffect` sıfırlamaları (`GmScreen.tsx:110-115`, `:124-128`, `:145`) harita değişince ayarları sıfırlar; adımlara bölünürken kayıp/çift sıfırlama.
- Zar modu `useDiceFlow`/`DicePrompt` ve "Savaşı kur" tıklamasındaki `starting.current` yan etkisi: CTA taşınırsa korunmalı. Varsayılan düşman değişirse `plan`/`planProblems` ve `regenWarning` etkilenir. Kayıtlı savaştan devam akışı (`App.tsx:192-198`).

---

## 7. Serüven ekranı

**Dosyalar:** `src/screens/SeruvenScreen.tsx` (499 satır), `SeferMap.tsx`, `JourneyScreen.tsx` (bayrak arkası), `src/ui/world/WorldMapViewer.tsx` (Dünya haritası), `data/seruven.json`, metinler `strings.ts` `seruven.*`, `world.*`.

### 7.1 Bugünkü durum (SSR; Buzul başlangıcı, `irkBaslangic` kapalı)
- **Başlangıç formu** (:149-174): 2 düğme (Ana menü, Serüvene başla) + karakter başına 1 kutu + "Irka göre başlangıç". Varsayılan `picked=[]` (:151): karakter seçilmeden "Serüvene başla" kapalı (:167); karakter yoksa düğmesiz düz metin (`S.none`, :154).
- **Sayfa** (`PageView` :181) = **9 düğme**: Ana menü, Dünya haritası, Serüven kuralları (:260-265), 1 kapı (:314-325), 5 düğüm (:331-344). Irka göre başlangıçla Dağ sayfasında 10. Üst çubuk 3 düğme + 4 bilgi (sayfa n/N, Seviye, altın, iksir); **XP hiçbir yerde gösterilmiyor**, yalnızca eşik aşılınca "Seviye atla (n)" (:397-399).
- **Düğüm kartı** (`NodeCard` :420-470; koddan sayıldı): Gir/Al/İncele + Kapat = 2; savaş düğümünde Gündüz/Gece +2, test anahtarı "Savaşı kazanılmış say" +1, bağlantı/"Mağaraya gir" +1–2 → 2–5.
- **"Serüven kuralları" paneli** (:352-370): **24 onay kutusu** tek düz liste (`TOGGLE_KEYS`; 1'i `test`) + "Hapse at" + "Serüveni sil" (2 adım).
- **Dünya haritası** (`WorldMapViewer.tsx:439-491`): ilk bakışta **19 düğme** (14 bölge ön ayarı, "Bütün harita", Katmanlar, Kapat, +, −); "Katmanlar" açılınca +8 kutu, parti varsa +3 düğme (Uçuş/Gemi/Yüzme önizlemesi); merkez kartı 2–4 düğme; alt notta 5–6 cümle (:494-501).
- Yolculuk (bayrak arkası): başlangıç formu 7 düğme + 1 seçici + 2 kutu.

### 7.2 Kural dili / uzun metinler
1. `data/seruven.json:50` serbestGezinti: "Serbest gezinti (sayfa çıkışları her zaman açık; Orman → Çöl nehir yolu Bataklık'tan önce de açık)".
2. `data/seruven.json:101` dunyaGezinti: "Dünya haritasında tıkla-yürü (K47; zamana ve karşılaşmaya göre). Kapalıyken yalnızca düğümler arası" — görev kodu "K47" çocuğa görünüyor.
3. `data/seruven.json:121` moralTam: "Moral (tam): savaşa etkili (0'da Çökmüş, eşiklerde ceza, toparlama, zafer ödülü)…".
4. `data/seruven.json:70` savaslariAtla: "Savaşları atla (önizleme): savaş ve boss düğümünde "Savaşı kazanılmış say"; XP ve ödül normal, kayıtta "atlandı"".
5. `data/seruven.json:81` hapishaneKurallari: "Hapishane kuralları (emanet, büyü bastırıcı tasma, doğaçlama silahlar, mahkûm kıyafeti, bayıltan nöbetçiler)".
6. `strings.ts:546` `seruven.soonNote`: "Yerleşim: savaş haritası henüz yok (sonraki görevde dolacak). Yol buradan geçer." ve `soonGm`: "Game Master notu: yerleşim kartı Kuyruk 34’te dolacak." (geliştirici dili; `SeruvenScreen.tsx:440`).
7. `strings.ts:540` `seruven.levelGm`: "Seviye atlama Game Master işi: Serüven kurallarını açın." (devre dışı düğmenin `title`'ı; dokunmatikte görünmez).
8. `strings.ts:544` `collarHelp`: "Büyü yapılamaz; sınıf özellikleri çalışır. Anahtarı müdür kulesinde ya da Beyaz Şehir tapınağında çıkar."
9. `strings.ts:547` `riverFind`: "Yeraltı nehri girişini ara (Hayatta Kalma ya da Doğa, DC 15)".
10. `strings.ts:521,520,529` `world.noTiles`: "Harita karoları yok (npm run harita-karo, docs/harita/DUNYA-KARO.md); bölgeler yer tutucuyla gösteriliyor."; `world.travel`: "1 hücre = 50 mil · yaya 24 mil/gün · gemi 72 mil/gün"; `fogOff`: "Keşif sisi kapalı (Serüven kuralı)."
- Ek: "Sayfa 1/7", "Zorluk ★★★", "Güçlü düşman" (`strings.ts:549-556`); `prisonConfiscated`: "Emanette: n altın, n iksir, n eşya ve ekipman (iskeledeki sandıkta)." (:542).

### 7.3 İkinci adıma / Gelişmiş'e
- **"Serüven kuralları" düğmesi ve 24 anahtarlık panel:** Game Master panelinin adı ve içeriği çocuk için anlamsız. Gruplanıp tek "⋯ Diğer" altına: Dünya haritası (6: bolgeYukleme, haritaSisi, dunyaGezinti, hizliSeyahat, karsilasmaYok, serbestGezinti); Yerleşim (3: yerlesimler, yerlesimKapi, irkBaslangic); Hapishane (3: hapishaneKurallari, hapishaneKolay, hapishaneHaftalik); Savaş/ilerleme (7: kesfeDevam, bozgundaYenidenDene, koridorPususu, seviyeAtlama, ustSeviye, moralSistemi, moralTam); Diğer (4: yurumeAnimasyonu, otomatikGunduz, serbestAcilis, yeraltiNehriAc); Test (savaslariAtla, "Hapse at").
- Başlangıç formunda "Irka göre başlangıç" (varsayılan açık) → Gelişmiş. Üst çubukta sayfa n/N + üç sayaç → tek durum şeridi (bilgi, seçenek değil).
- Dünya haritası: 14 bölge ön ayarı + Bütün harita + Katmanlar (8 kutu) + animasyon önizlemeleri; dünya notundaki geliştirici cümleleri (`noTiles`, `fogOff`).

### 7.4 Önerilen yerleşim
- **Başlangıç:** karakter çipleri (varsayılan ilk ≤ 4 hazır karakter seçili, `GmScreen.tsx:89` ile aynı) + tek "Başla"; karakter yoksa düz cümle + "Karakter oluştur" düğmesi.
- **Sayfa üst çubuğu (4):** Geri · Dünya haritası · "⋯ Diğer" · durum şeridi (Seviye · altın · iksir · XP "120/300").
- **Düğüm kartı:** 1 birincil (Gir/Al/İncele) + Kapat; Gündüz/Gece tek anahtar.
- **"Seviye atla":** XP yeterince bir üst düzey düğme; Game Master kapısını kaldırmak ürün kararı (risk), yoksa dokununca nedenini söyleyen düz cümle; "Serüven kurallarını açın" metni gitsin.
- **"⋯ Diğer":** Serüveni sil (2 adım), Gelişmiş (gruplanmış anahtarlar), Test.
- **Dünya haritası:** Kapat, +, −, "Bölgeler ▾" (14 ön ayar bir listede), "⋯ Katmanlar"; alt not: saat + "Haritaya dokun: parti yürür". Moral/diriltme düğmeleri (:410-411) yalnız ölü üyede, koşullu kalır.

### 7.5 Dosyalar / büyüklük — **ORTA**
`SeruvenScreen.tsx`, `WorldMapViewer.tsx`, `data/seruven.json` (grup alanı, yalnız veri), `strings.ts` + `strings.en.ts`, `App.tsx` ("Karakter oluştur" geçişi); `SeferMap.tsx` ödül sahnesi küçük; `JourneyScreen.tsx` bayrak arkasında, dokunmak şart değil.

### 7.6 Testlere etkisi
`src/screens/seruven-ui.test.tsx`: `data-page`, `kita/<gorsel>`, `data-node` hepsi, `seruven-node open` ×2 / `locked` ×3 (Buzul), 'Açık Buzul', **'Sayfa 1/7'** (sayfa numarası kalkarsa kırılır), 'Dünya haritası' (üst çubuk), 'karakter oluşturun' (başlangıç formu), Home içinde 'Serüven'. `src/yerlesim/k44.test.tsx` (Serüven yerleşim akışı); `src/journey/sefer.test.ts:77,155` (`nodeState`); `modulBaslatma.test.ts`, `strings.test.ts`.

### 7.7 Risk
- "Sayfa n/N" ve düğüm `class` adları (`open`/`locked`) testlere ve `data-node` seçicilerine bağlı; korunmalı.
- `rules` bayrağı hem paneli hem "Seviye atla"yı açar (:397-399, :352): ayrıştırılırsa Game Master kapısı davranışı değişir (komut `level_up`, kayıt/olay değişmez).
- Dünya haritası ön ayarları `CAMERAS` anahtarlarından (`Object.keys(CAMERAS)`, :443); liste değişirse yalnız sıralama etkilenir. `run({type:'set_toggle'})` komutları aynen kalır; yalnız yerleşim değişir.

---

## 8. Yerleşim hub'ı ve şehir görünümü

**Dosyalar:** `src/screens/YerlesimHub.tsx` (143 satır; ortak `HubShop`/`HubInn`/`HubQuests`/`HubTemple`), `SehirGorunum.tsx` (87), `data/yerlesim.json`, `data/sehir-gorunum.json`, metinler `strings.ts` `city.*`, `seruven.*`.

### 8.1 Bugünkü durum (SSR, `YerlesimHub`; altın 200)
- **Kral Kalesi:** **16 düğme** (Haritalar 1 "Kale Önü", Dükkân 12 = 6 ürün × Al + Sat, Han 1 "Uzun dinlenme", Görevler 1 "Görevi al", "Yerleşimden çık" 1; `YerlesimHub.tsx:19-44`). **Beyaz Şehir: 20** (aynı + Görevler'de 2 "Görevi al" + 3 suç düğmesi: "Soylu cinayeti", "Saray soygunu", "Hazine mührü"; :102-104). Kasaba ve öteki kaleler 16, Liman 15.
- Dükkân ürünleri (`data/yerlesim.json:59-`): İyileştirme iksiri (50), Panzehir (50), Şifacı çantası (5), İp (1), Meşale (1), Erzak (1); 1 altınlık eşyada `floor(1×satisOrani)` = 0 → **"Sat (0)"** kapalı ama görünür (:62).
- **Şehir görünümü** (`SehirGorunum.tsx`): Beyaz Şehir **21 bina düğmesi** (11 npc, 3 yakında, 3 harita, 1 görev, 1 şifa, 1 han, 1 çıkış) + "Yerleşimden çık" çubuk düğmesi (:60); Liman 10. Karta tıklayınca hizmet panelleri (aynı Dükkân/Han/Görevler) açılır. Bu checkout'ta `gorsel` yok → sayılar `dugumHedefi` ile veriden (koddan sayıldı); hub çalışır.

### 8.2 Kural dili / uzun metinler
1. `strings.ts:533` `city.soonInfo`: "Bu bina henüz hazır değil (ekipman satın alma, kuşanma ve büyü rulosu envanteri yok)."
2. `strings.ts:533-535` `city.npc`: «Hoş geldin, yolcu. Burada şimdilik konuşacak pek bir şey yok.» (11 binada aynı cümle).
3. `strings.ts:537` `hubDoorHint`: "Kapı geçişi açık: sonraki harita kapı altıgenine yürüyerek geçilir."
4. `strings.ts:535` `city.mapLocked`: "Bu haritaya önce kapıdan yürüyerek ulaşılmalı."
5. `strings.ts:537` `hubType`: "kale / kasaba / şehir" başlıkta (`YerlesimHub.tsx:30`).
6. `strings.ts:538` `innRest`: "Uzun dinlenme" (kural dili; `city.heal` "Şifa evi: dinlen ve iyileş (uzun dinlenme)" aynı işi yapıyor).
7. `strings.ts:538` `price`/`sell`: "50 altın", "Sat (25)", "Sat (0)".
8. `strings.ts:546` `crimeStart/crimeResist/crimeSurrender`: "İşe başla", "Baskına karşı koy", "Teslim ol"; görev adları "Soylu cinayeti", "Saray soygunu", "Hazine mührü" (içerik uygunluğu ürün kararı; doğrulanamadı).
9. `strings.ts:544-545` `collarPay/collarServe`: "Tasmayı çıkar (n altın)", "Tapınağa hizmet et (tasma çıkar, zaman geçer)".
10. `data/yerlesim.json` `gorevler` açıklamaları ve `S.reward(g.odul.gold, 0)`: "Ödül: n altın, 0 iksir" (`YerlesimHub.tsx:120`; "0 iksir" gereksiz).

### 8.3 İkinci adıma gidebilecekler
- Dükkân: "Sat (n)" her satırda yan yana → "Eşyalarımı sat" ayrı alt görünüm, yalnız elde olanlar; sahip olunmayan ya da altın yetmeyen satırlar listeden çıkar ("Sat (0)" kalkar).
- İp, Meşale, Erzak (1 altın): ilk listede iksir + panzehir + çanta yeter (savaştaki işlevi doğrulanamadı).
- "Han: uzun dinlenme" ve "Şifa evi" ayrı kavram gibi → tek **Dinlen**.
- Şehir görünümünde 11 NPC + 3 "Yakında" bina dokununca hiçbir şey yapmayan etkileşimli düğmeler → dekor (aktif düğme 7'ye iner).
- Suç düğmeleri (3) "Görevler"in altında ayrı "Zor görevler" grubuna. Başlıktaki "· kale/kasaba/şehir" ve ayrı haritalar paragrafı; altın/iksir satırı Serüven durum şeridine (tekrar).

### 8.4 Önerilen yerleşim
- **Hub (5):** **Savaşa git** (harita listesi ≤ 4; kapı kilidi nedeniyle gizlenenler yerine tek satır "Önce kapıdan yürü") · **Dükkân** · **Dinlen** (han + şifa tek; tasma varken tapınak hizmeti de burada) · **Görevler** · **Ayrıl**.
- **Dükkân (ikinci adım):** alınabilir ürün tek düğme "İyileştirme iksiri · 50 altın"; yetmeyenler listeden çıkar, altta tek satır "Daha fazlası için altın topla"; "Eşyalarımı sat" ayrı alt görünüm.
- **Görevler:** "Görevi al / Ödülü al / Sürüyor"; suç görevleri "Zor görevler" alt listesinde.
- **Şehir görünümü:** harita + hizmet binaları aktif (Beyaz Şehir 6–7, Liman 6); NPC/Yakında binalar çizili ama düğme değil.

### 8.5 Dosyalar / büyüklük — **ORTA** (şehir görünümü tek başına küçük)
`YerlesimHub.tsx`, `SehirGorunum.tsx`, `strings.ts` + `strings.en.ts`, `data/sehir-gorunum.json` (npc/yakında alanı varsa).

### 8.6 Testlere etkisi
`src/yerlesim/k44.test.tsx:108-118`: eski hub 'seruven-hub', 'Haritalar', 'Dükkân', 'Han', 'Görevler', 'Yerleşimden çık'; şehir görünümü `class="sehir-dugum "` tam **21**, `sehir-dugum yakinda` **3**, `data-dugum="beyaz-sehir/saray"` — NPC/Yakında düğme olmaktan çıkarsa 21/3 sayıları kırılır. Son test (:121-124) komutları (`inn_rest` vb.) sınar, arayüzden bağımsız. `modulBaslatma.test.ts`, `strings.test.ts`.

### 8.7 Risk
- "Dinlen" birleşince `inn_rest` (han ücreti 0) ve şehir görünümündeki "Şifa evi" (`C.heal`) aynı komutu çağırır; birleştirmek komutu değiştirmez.
- Beyaz Şehir `sucById` zinciri (`state.suc`) sürerken "İşe başla / Karşı koy / Teslim ol" birincil düğme olmalı; ayrı gruba taşınırsa yarım kalan suç bulunamayabilir (görünür kalmalı).
- `yerlesimKapi` kilidi: kilitli harita şu an `maps` süzgeciyle gizli; "tek satır neden" metni gerekir (ilke 5).
- Hub ve şehir görünümü aynı `Hub*` bileşenlerini paylaşır; birini sadeleştirmek ikisini birden etkiler. Yerleşim görselleri bu depoda olmadığı için şehir görünümünün görsel doğrulaması yapılamadı.

---

## 9. Savaş sonu

Ölçüm: `col` senaryosu, 5. seviye standart parti (5 kişi) ve 15 düşman, tohum 3; savaş yapay zekâyla sonuna oynatıldı (327 olay, 6 tur, parti kazandı), bitmiş durum SSR ile çizildi.

### 9.1 Bugünkü durum
- Bitmiş savaş bandı (`hud-banner summary`, `src/MapBattle.tsx:2921-2949`): 1 çıkış düğmesi (`exitLabel`: Serüven'de "Serüven", Game Master kurulumunda "Kuruluma dön", aksi hâlde "Yeni savaş"), başlık, tur bilgisi; hedef sonucu varsa +1 satır, masum varsa +1, keşfedilecek yer varsa "Keşfe devam" düğmesi.
- **Tablo: 6 sütun × 19 satır = 114 hücre** (`strings.tr2.ts:382` `battle.summary.cols`: Savaşçı / Verdiği / Aldığı / İyileştirdiği / Düşürdüğü / Son HP). Satır sayısı savaşçı sayısı kadar; düşmanlar ve çağrılanlar da dahil.
- Ekranda toplam 10 düğme (6 şerit jetonu, "+13", "≡", banner düğmesi, "Günlük").
- Sıra: `EndVideo` tam ekran (:2909-2913) → `EndFx` 3,6 sn (:2914) → banner. Keşif varsa önce "Keşif" bandı (:2915-2920).
- XP ve seviye atlama bu ekranda yok; Serüven'e dönünce `src/screens/SeruvenScreen.tsx:388-398` (sonuç paneli + "Seviye atla"), yolculukta ödül ekranı "Geri ışınla" (`JourneyScreen.tsx:82`). Game Master kurulumunda sonuç sessizce kaydedilir (`src/App.tsx:225-230`).

### 9.2 Kural dili / uzun metinler
1. Tablo başlıkları "Savaşçı / Verdiği / Aldığı / İyileştirdiği / Düşürdüğü / Son HP" — `strings.tr2.ts:382`, `battle.summary.cols`.
2. Hücre içi "0/27 (düştü)" ve "38/38" — `MapBattle.tsx:2942`.
3. "6. turda bitti" — `strings.tr2.ts:380`, `battle.summary.rounds`.
4. "Hedefler: ✓ … · ✗ …" tek satırda birleşik — `MapBattle.tsx:2929-2932`, `goals.result`.
5. Keşif bandı: "Keşif: jetona dokunup seç, yürü; giriş altıgenine varınca Serüven'e dönülür." — `strings.tr2.ts:379`, `battle.explore.hint`.
6. "Sonuca geç (dokun)" — `strings.tr2.ts:283`, `battle.endVideoSkip`.
7. "Yeni savaş" ve "Kuruluma dön" aynı işlev için farklı kelimeler — `strings.tr2.ts:283`.

### 9.3 İkinci adıma gidebilecekler
- Tablonun tamamı (çocuğa "kim kazandı, kaç turda, bizden kim düştü" yeter); düşman satırları (15), çağrılanlar, "Düşürdüğü" sütunu → "Ayrıntılar ▸".
- "(masum)" eki ve masum sayacı yalnız masum varsa.
- İki çıkış düğmesi tek ana düğmeye; "Keşfe devam" ikincil.

### 9.4 Önerilen yerleşim (≤ 6)
1. Büyük başlık ("Kazandık!" / "Kaybettik").
2. Tek satır: "6. turda bitti · 4 arkadaş ayakta".
3. Hedefler varsa tek satır (✓/✗).
4. Ana düğme: **Devam** (Serüven, Yolculuk ya da Kuruluma dönüş).
5. İkincil: "Keşfe devam" (yalnız varsa).
6. "Ayrıntılar ▸": parti tablosu; düşmanlar ayrı katlanır; hasar/iyileştirme sütunları burada.

### 9.5 Değişecek dosyalar / büyüklük
`src/MapBattle.tsx:2921-2949`, `src/i18n/strings.ts` (`battle.summary`), `strings.tr2.ts:379-382`, `strings.en.ts`, `src/styles.css:430-432`. Veri ve motor değişmez. **Küçük–orta.**

### 9.6 Testlere etkisi
- `src/ui/endFx.test.tsx`, `src/ui/endVideoPlan.test.tsx`: yalnız efekt/video planı; `EndFx.tsx` değişmezse etkilenmez.
- `src/app/setup.test.ts:91,178`: `battleSummary` veri yapısına (satırlar, `civilians`) bağlı; fonksiyona dokunulmazsa kırılmaz.
- Metin/DOM sınayan test yok (`Parti kazandı`, `hud-banner`, `summary-head` grep boş). `strings.test.ts`: yeni anahtar iki dile de.

### 9.7 Risk
- `liveFinish`/`endVideo` akışı (`MapBattle.tsx:636-657`; ezgi/video sırası `end.fadeOutMs`).
- Banner koşulu `state.status === 'finished' && !endVideo && !exploreOn` ve `exploreOn` (:854) aynen korunmalı.
- `props.onExit(session.state)` Serüven (`App.tsx:219-222`) ve kayıt akışının girişi; düğme taşınsa da aynı argüman.
- Replay/kayıt etkilenmez: banner yalnız `battleSummary(events, state)` okur.

---

## 10. Günlük, toast, önizleme kartı, tepki sorusu, zar istemi, çekmece, bilgi kutusu

### 10.1 Bugünkü sayılar
- **Günlük** (327 olaylık savaş): 260 satır (203 normal, 55 tur sonu, 2 tepki); 123 satırın açılır ayrıntısı var (toplam 245 ayrıntı satırı); tur başına ortalama 5,7 satır, en çok 14. Panel son 60 satırı tersten çizer (`MapBattle.tsx:2965`); "Tur özeti" açılınca 260 → 315.
- **Toast:** son 2 olayın TAM metni (başlık + ayrıntı), en çok 3 toast, 4 sn (`MapBattle.tsx:179`, `:733-742`); 40 komutluk örnekte 17–2014 karakter (985 ve 2014 karakterlik toastlar görüldü). Günlük kapalıyken çıkar (:2959).
- **Önizleme kartı** (`PreviewCard`, SSR sayımı):

| Örnek | Hedef | Kısa kart | Tam kart |
|---|---|---|---|
| Silah saldırısı | 1 | 3 | 3 |
| İtme | 1 | 2 | 2 |
| Fire Bolt | 1 | 3 | 4 |
| Hold Person | 1 | 2 | 3 |
| Fireball | 3 (1 dost) | 12 | 16 |

  `movePreview` bir hedef satırı için en çok 9–12 alan üretir: `hitP, critP, saveP, dc, ability, damage, healing, killP, conditions, movedTo, teleportedTo, reasons` (`src/ui/preview/movePreview.ts:16-33`). Karta ek: kendine hasar, fırsat saldırıları (n), tepkime listesi, "?" (`PreviewCard.tsx:38-41`). Hareket önizlemesi ayrı balon: `moveRisk` + n × fırsat saldırısı + "Vazgeç"/"Yine de yürü" (`MapBattle.tsx:2490-2503`).
- **Tepki sorusu** (`src/ui/ReactionPrompt.tsx:39-63`): başlık + tetik satırı + seçenek düğmeleri (slotlu seçenek başına bir düğme; örn. Counterspell 3 slot + Shield = 4) + "Kullanma".
- **Zar istemi** (`src/ui/DicePrompt.tsx:44-63`): başlık, 2–4 küçük satır, zar sayısı kadar alan (1–8), 3 düğme: Tamam, Otomatik at, Vazgeç.
- **Çekmece** (`Drawer`, `MapBattle.tsx:222-327`; koddan sayıldı): her zaman 6 satır, koşullu 8–10 satır daha (12–18).
- **Bilgi kutusu** (`info-box`, `MapBattle.tsx:2992-3004`, `src/ui/mapView.ts:216-246`): tek satır, " · " ile birleşik 3–10 parça. Örnek: `sütun 7, satır 5 · "c" Ayakta sütun (kayalık) · yükseklik 0 · geçilmez · 3/4 siper · 15 ft, tırmanılır (Çeviklik DC 15, ×3) · Saklanılabilir: hayır (…)`.
- **Tur şeridi:** 6 jeton + "+N" + jeton başına en çok 2 durum simgesi + ◎; zaten ≤ 6, değişmez.

### 10.2 Kural dili / uzun metinler (10 örnek)
1. `ek etki uygulanmadı (lanet/kalıcı etki uygulanmıyor; ikinci aşama (second failure) uygulanmıyor; …): If the target is a creature, it is subjected to the following effect` + ham SRD ayrıntı satırları; 2014 karakterlik toastın kaynağı — `strings.tr2.ts:42`, `log.riderPartial`.
2. `zar 15 / 1 (avantaj), toplam 22 (AC 18, 3/4 siper +5 dahil): isabet` — `strings.tr2.ts:39`, `log.attackRoll`.
3. `hasar 2+5+4+5+4+1+6+2 = 29 → 14 fire` (tür İngilizce) — `strings.tr2.ts:33`, `log.damage`.
4. `DEX kurtarma zarı 9 / 15 (dezavantaj), toplam 10 / DC 15: başarısız`.
5. `Alan: 20 ft küre, merkez sütun 13, satır 3; etkilenen: <10 isim>.` (`src/ui/log.ts`).
6. Önizleme: `DEX kurtulma DC 15 · başarı %29`, `hasar 8–24–32`, `düşürme %91` — `strings.tr2.ts:312-313`, `preview.save/dmg/kill` (en az–ortalama–en çok üçlüsü).
7. Tam önizlemede `Sıcak alevi besler: disadvantage`, `Durum: Unconscious/Paralyzed` — sebep Türkçe, mod İngilizce (`movePreview.ts:48-53`, kaynak `data/environments.json:64`).
8. Tepki sorusu: `Tepki: <ad>`, `<kaynak> — <etiket>: 17, AC 16; isabet, hasar 8.`; düğme "Counterspell — 3. seviye slot" — `strings.ts:672-676`, `reactions.title/trigger.hit`; `ReactionPrompt.tsx:31-33`, `reactions.slot` `strings.ts:686`.
9. Zar istemi: `Saldırı: 2 adet d20 at (+5)`, `Avantaj: iki d20 at, yüksek olan sayılır.`, `iki d20'nin değerini gir`, `Kritik vuruş: hasar zarları iki katı.` — `strings.ts:700-716`, `dice.ask/advantage/enter/critical`.
10. Neden metinleri: `Hızın 0 (Grappled, Restrained, Paralyzed…).`, `Şu an yapılabilecek büyü yok (eylem ya da büyü slotu kalmadı).`, `Rage bu tur zaten sürüyor (saldırı ya da save yaptırma uzattı).`, `Önce eylemini kullan (Atılım ikinci bir eylem verir).` — `data/neden-metinleri.json:6,9,25,19` (32 arayüz + 98 motor kalıbı); motor metni `reasonText(msg,'tr')` ile (`src/ui/reasons.ts:22-26`) aynen geçtiği için `Dazed: …`, `Loading: …`, `Thirsting Blade: …` gibi İngilizce karışık hata metinleri de görünür.
- Ek bulgu (hata): `splitLine` günlükte "3. seviye slot harcandı" gibi ifadeyi "3" + "seviye slot…" diye başlık/ayrıntıya böler — `src/ui/logEntries.ts:23`.

### 10.3 Gereksiz / ikinci adıma gidebilecekler
- Kartta "kritik %", "düşürme %", min–ort–maks hasar aralığı, DC ve başarı yüzdesi.
- Günlükte "Sıra X (tur 1)", "yürüdü: sütun 9, satır 7 (5 altıgen)", `slot_spent`, `concentration_started`, bilgi satırları; hasar zarlarının tek tek yazılması; tur özeti sayıları (`turnSummary`, `strings.tr2.ts:12`).
- Toast olarak başlık + tüm ayrıntı: yalnız başlık yeter.
- Çekmecede Beceriler, Kurtarma zarları, Gizlenme/Algı, "Bu tur hareket".
- Bilgi kutusunda yükseklik, hareket türü, saklanma gerekçesi.
- Zar isteminde "Zarı atan: …" ve "Ortam (Game Master atar)" satırları.

### 10.4 Önerilen yerleşim
- **Günlük:** başlık "kim kime ne yaptı → sonuç" ("… vurdu: 7 hasar" / "ıska"); satır sonunda ⓘ ile zar/DC/siper. Sıra, yürüme, slot satırları varsayılan gizli ("Ayrıntılı günlük"). Geliştirici notları (`riderPartial`) yalnız ⓘ altında.
- **Toast:** yalnız başlık, en çok 1–2 satır.
- **Önizleme kartı:** hedef satırı = ad + tek ana bilgi ("Vurma şansı: yüksek (%88)" / "Kurtulma şansı %29") + "ortalama 24 hasar"; altında "Ayrıntı ▸". **Dost ateşi ve fırsat saldırısı uyarıları kırmızı, ayrı, her zaman görünür** (güvenlik bilgisi).
- **Tepki sorusu:** 1 cümle ("… saldırıyorlar! Korunmak ister misin?") + önerilen büyük düğme + "Hayır"; slot seçimi ikinci adımda ("Diğer ▸").
- **Zar istemi:** "Zarı at" ya da değeri gir; tek ana düğme + "Otomatik at"; avantaj/kritik açıklaması tek satır.
- **Çekmece:** üstte ad/HP/AC, 3 satır durum, altında "Ayrıntı ▸".
- **Bilgi kutusu:** ad + 1–2 önemli parça + ⓘ.
- Keşif Defteri (`DiscoveryBook`) yapı olarak değişmez; 32 satırlık adlar sade dile ("Alev + Yağ → yangın").

### 10.5 Değişecek dosyalar / büyüklük
`src/ui/logEntries.ts` (başlık/ayrıntı, `splitLine` hatası), `src/ui/log.ts`, `src/i18n/strings.tr2.ts` (log, preview, discovery, drawer), `strings.ts` (reactions, dice), `strings.en.ts`, `src/ui/preview/PreviewCard.tsx`, `movePreview.ts` (`reasonsOf` mod çevirisi), `src/ui/ReactionPrompt.tsx`, `src/ui/DicePrompt.tsx`, `src/MapBattle.tsx` (toast :733-742, günlük :2957-2979, `Drawer` :222-327, `info-box` :2992-3004), `src/ui/mapView.ts:216-246`, `data/neden-metinleri.json`, `src/styles.css`. **Büyük** (çok dosya, çoğu metin işi).

### 10.6 Testlere etkisi
- `src/ui/logEntries.test.ts`: başlık/ayrıntı ayrımı (`'… → Goblin: Uzun kılıç'`, `detail.length === 2`), tur özeti `kind`, `splitLine`.
- `src/ui/reasons.test.ts`: `whyTable` TR/EN anahtar eşitliği, `hasPattern`, `reasonText`; JSON'da kalıp silinirse kırılır.
- `src/ui/preview/movePreview.test.ts`, `k59preview.test.ts`: `TargetLine` alanlarına (`hitP, critP, dc, saveP, movedTo, opportunity, mystery, reactions, friendlyFire`) bağlı, metne değil.
- `src/ui/reaction.test.ts:31-39`: `reactionAskText` başlığında ad, `reactionButtons` anahtarları (`spells:shield:1`); anahtarlar sabit kalmalı.
- `src/ui/dice.test.ts`, `src/rules/manualDice.test.ts`: elle zar akışı, metin sınamaz. `src/ui/binekMb6.test.tsx`: yalnız irtifa seçici. `src/i18n/strings.test.ts`: TR/EN eşliği, boş metin yok.
- Çekmece, toast, bilgi kutusu için doğrudan test yok.

### 10.7 Risk
- **`NeedDice` / zar defteri:** `DicePrompt` yalnız `onEnter(values)`, `onAuto`, `onCancel` çağırır; `key={dice.pending.step}` (`MapBattle.tsx:3099`) ve `parseDiceInput` doğrulaması aynen kalmalı, yoksa adım aynı zarlarla yeniden çalışmaz.
- **`NeedReaction`:** `ReactionPrompt` `key` (`${reactorId}:${trigger}:${events.length}`, :3096), `onAnswer(null)` = "Kullanma" ve önerilen seçenek (`suggested`) korunmalı; "Diğer ▸" altındaki slot düğmeleri aynı `ReactionAnswer` değerini üretmeli.
- **Replay:** günlük/toast olay okur, durumu değiştirmez; `session.lines` (`src/ui/session.ts:17,48`) ve `logEntries` ikisi de `describeEvent` kullanır; tek kaynak kalmalı.
- **Dokun-önizle / dokun-onayla:** `moveTap` (`movePreview.ts:101-104`), `moveAim`, balon (`MapBattle.tsx:1244`, `:2490-2503`); kart sadeleşirken "Yine de yürü" ve kırmızı çentik görünür kalmalı.
- **Keşif defteri:** keşfedilmemiş tepkimenin sonucu karta sızmamalı (`k59preview.test.ts:73-86`); "?" rozeti/`visibleReactions` kalmalı; keşif toast'ı (`MapBattle.tsx:747-758`) 2×`TOAST_MS` sürer, kısaltılırsa oyuncu kaçırır.
- **Toast kısaltma:** `session.lines` hem toast hem günlük kaynağı; toast başlığa indirilirken `splitLine` mantığı paylaşılmalı (iki ayrı anlatım kodu doğmasın).
- **Neden metinleri:** `reasonText` motor hata iletisini geçirir; yalnız `arayuz` bölümü sadeleşirse motor iletilerindeki İngilizce SRD adları (Dazed, Thirsting Blade…) sızmaya devam eder: ayrı iş.
- Doğrulanamadı: çekmece satır sayısı (SSR'dan açılamadı, `drawerId` iç durum); EN metin uzunlukları ölçülmedi.

**İlke 5 notu (savaş sonu ve kartlar):** neden metinleri üst düzey sabit düğmeler için tek geri bildirim kanalıdır (`toast(text)`, `MapBattle.tsx:1089-1093`, 4 sn; `reasonOr`, `src/ui/reasons.ts:32`; genel yedek `data/neden-metinleri.json:3`): silinmez, tek kısa oyun cümlesine indirilir (örn. "Hızın 0 (Grappled, Restrained, Paralyzed…)." → "Şu an yürüyemezsin: yakalanmışsın."). Toast'ın tek cümle olması bu yüzden daha da önemli. Motor kalıplarındaki ham İngilizce SRD adları (küçük–orta ayrı iş). Çekmece GM bitkinlik −/+ düğmeleri sınırda `disabled` (`MapBattle.tsx` Drawer, `exhaustion-row`): sınırda gizlenir. Önizleme kartı `bad` durumu ("Yapılamaz: <neden>", `PreviewCard.tsx:21`, `strings.tr2.ts:315`) yedek olarak kalır; geçersiz hedefler zaten seçilebilir listede gizli. Tepki sorusu ve zar istemi yalnız geçerli seçenekleri sunar (soluk seçenek yok). "Keşfe devam" yalnız keşfedilecek yer varsa çizilir (`MapBattle.tsx:2933`). `src/ui/reasons.test.ts` kalıp/anahtar eşliğine bağlı: anahtarlar ve kalıplar silinmez, yalnız metinler değişir.

---

## Ekranlar arası ortak bulgular

1. **Ham İngilizce kural adı ekranda.** "Wild Shape", "Wild Resurgence", "Nature Magician", "Sorcery Point", "Superior Defense", "Divine Spark", "Channel Divinity", "Stonecunning" menüde; büyü adları ("Fire Bolt"), silah terimleri (Finesse, Versatile…), feat faydaları ve motor hata iletileri ("Dazed:", "Thirsting Blade:") çevrilmemiş. `battle.label.featureName` yalnız 8 kayıt içerir (`strings.tr2.ts:241`), gerisi `f.name`'e düşer. Düşük riskli ilk adım: düz Türkçe ad + ⓘ'de İngilizce kural adı.
2. **Soluk / pasif öğe kalıbı** (ilke 5) her ekranda var: halka menüde soluk düğmeler, Kaydet `disabled`, "Yeni karakter" 6 karakterde `disabled`, parti çipleri, "Yükle", "Sat (0)", Ayarlar'daki bağımlı kutular, Serüven "Seviye atla". Ortak kural: iç listede gizle; üst düzey sabit düğme gizlenmez, dokununca nedenini söyler (`reasonOr`, `data/neden-metinleri.json` kalır, metinleri sadeleşir).
3. **Aynı bilgi birden çok yerde:** oluşturucuda sorun listesi 4 yerde; imza alt sınıf / Karadul / hizalanma anahtarları hem Ayarlar'da hem GM ev kurallarında; Serüven "Seviye atla" Game Master anahtarına bağlı; altın/iksir hem hub'da hem Serüven başlığında.
4. **Geliştirici dili oyuncuya görünüyor:** "Kuyruk K47/K55/K56", "kural sürümü 24+", `karadulKadinKisiti`, "yerleşim kartı Kuyruk 34'te dolacak", `npm run harita-karo`, `riderPartial` ham SRD metni, "oyunda henüz çalışmıyor/kısmen çalışır" durum etiketleri.
5. **Gömülü TR metin:** `characterIssues` (`src/rules/builder.ts`, 42 `push(`) i18n dışı; EN'e çevrilmiyor ve 5 test birebir sınıyor.
6. **Hata:** `splitLine` "3. seviye slot harcandı" ifadesini "3" + "seviye slot…" diye böler (`src/ui/logEntries.ts:23`). Sadeleştirmeden bağımsız, küçük düzeltme.
7. **Çocuğa açıklanmayan kavramlar:** Game Master / Oyuncu, Eylem / Bonus / Tepki, DC, AC, HP zarı, Slot, Moral, Serüven kuralları. Önerilen adlar: "Savaş kur", "Karakterlerim", "Yardımcı eylem", "Dinlen".

## Test ve betik bağımlılıkları (toplu)

| Bağımlılık | Neye bağlı | Hangi ekran |
|---|---|---|
| `src/ui/actionHints.test.ts` | `MapBattle.tsx` kaynağını `?raw` ile okur, `const moveItems: Item[]` … `const actorPx` arasındaki `key: '…'` değerlerini tarar | 1 |
| `src/screens/setup-ui.test.tsx` | GM ekranı SSR + regex: `<h2>Harita` sırası, `monster-row`, kademe adları, devre dışı onay kutusu sayısı | 4, 6 |
| `src/screens/wizard.test.tsx`, `asi-ui`, `g1`, `k4`, `k5`, `k6`, `k16`, `k18`, `k20`, `k30` | adım adları/sırası, `score-box` ×6, `stepper`, "Kaydet" `disabled`, `<details class="spell-group locked">`, aria-label'lar, `characterIssues` metinleri | 2 |
| `src/screens/m1.test.tsx` | ana menüde 'Oyuncu', 'Game Master', 'Ayarlar', `home-card` sayısı ve sırası | 6 |
| `src/screens/seruven-ui.test.tsx` | 'Sayfa 1/7', `data-node`, `open`/`locked` sayısı | 7 |
| `src/yerlesim/k44.test.tsx` | `sehir-dugum` tam 21, `yakinda` 3 | 8 |
| `src/ui/logEntries.test.ts`, `reasons.test.ts`, `preview/movePreview.test.ts`, `k59preview.test.ts`, `reaction.test.ts` | başlık/ayrıntı ayrımı, `splitLine`, neden kalıpları TR/EN eşliği, `TargetLine` alanları, tepki düğme anahtarları | 9, 10 |
| `src/i18n/strings.test.ts` | TR/EN aynı anahtar yapısı, `t().gm.title` | hepsi |
| `scripts/kara-ekran.mjs`, `ses-kontrol.mjs`, `k57-olcum.ts`, `yukleme-olcum.mjs` (`check:harita`, `check:ses`) | `button.role`, `[data-region]`, `[data-map]`, `button.cta`, `≡` + "Kuruluma dön", "Yeni karakter", `.char-card` | 4, 5, 6 |

## Önerilen uygulama sırası

1. **Metin ve ad temizliği** (küçük, düşük risk): `featureName`/büyü-silah terimi adları, geliştirici dilinin temizlenmesi, `splitLine` düzeltmesi, `Kuruluma dön`/`Yeni savaş` tutarlılığı. Önce bu, çünkü sonraki her ekran aynı metinleri kullanır.
2. **Savaş menüsü gruplaması** (en kritik; yalnız gruplama orta): halka ≤ 6, alt menüler, büyü balonu. `actionHints.test.ts` çapaları birlikte güncellenir.
3. **Önizleme / günlük / toast / tepki / zar metinleri** ve savaş sonu (küçük–orta parçalar halinde).
4. **GM kurulumu + Oda kur** (3 adım + Gelişmiş) — betik seçicileri (`[data-region]`, `[data-map]`, `button.cta`) ve `setup-ui.test.tsx` aynı işte güncellenir.
5. **Ayarlar + `≡` menüsü + Serüven paneli** (aynı "Gelişmiş" kalıbı, localStorage anahtarları değişmez).
6. **Karakter oluşturucu + liste** (en büyük; öneri yardımcıları ve `characterIssues` i18n taşıması ayrı alt görevler, önce saf öneri fonksiyonları).
7. **Yerleşim hub'ı / şehir görünümü.**

## Kullanıcıdan karar bekleyenler

1. **İlke 5 yorumu** ("kullanılamayan gizli, soluk bırakılmaz"): bu belge "iç listede gizle, üst düzey sabit düğme gizlenmez ve dokununca neden söyler" diye okudu. Öğretici neden geri bildirimini kaybetme riski var; yanlışsa 1, 2, 3, 5 numaralı ekran önerileri değişir.
2. Serüven'de **"Seviye atla"nın Game Master anahtarına bağlı olması** (çocuk için kaldırılsın mı? Davranış değişir).
3. **Yolculuk (deneme)** düğmesi ana menüden Ayarlar ▸ Gelişmiş'e inebilir mi.
4. **Ses / efekt / zar animasyonu / tepki ayarı** bugün yalnız savaşta `≡` içinde: Ayarlar'a da bağlansın mı.
5. Yeni adlandırmalar (Savaş kur, Karakterlerim, Yardımcı eylem, Dinlen) ve Beyaz Şehir suç görevlerinin ("Soylu cinayeti", "Saray soygunu", "Hazine mührü") çocuk hedef kitlesine uygunluğu.
6. Oluşturucuda "önerilen" varsayılanlar (otomatik beceri/ASI/büyü seçimi) oyun tasarımı kararı.
