# Envanter: jeton, büyü ve zemin (ENV1)

> ENV1 (2026-11-06, dal `wip/env1`, `wip/a2` üstünden; kural sürümü 30). Salt okuma: oyun kodu, veri ve testler değişmedi; tek değişiklik bu belge. Ek paket (`icerik/ek-*.json`) bu bulut kopyasında yok (gitignore); yalnızca depodaki `icerik-liste.txt`'ten alt sınıf kimliği ve adı alındı, özellik metni okunmadı ve yazılmadı.

## Adım 0: doğrulama

| Denetim | Sonuç |
|---|---|
| `npm test` (tam paket, `vitest run`) | **yeşil**: 283 test dosyası, 2575 test, 0 başarısız (265 sn) |
| `npm run check:harita` | **yeşil**: 96 kontrol (harita × varyant, telefon yatay), 0 hata, 96 "tamam" |

## Yöntem

- Canavar jetonları: `data/monsters.json` kimlikleri ↔ `public/monsters/*.webp` dosya adları; ayrıca her görsel çözülüp piksel özeti alındı (aynı görünen dosyaları bulmak için).
- Çağrılar: `data/summons.json`, `src/battle/summons.ts`, büyü verisinde `kind: summon` / `zone` / `lingering`, `summoned` olayı üreten bütün motor yolları (`grep`), `src/ui/fx/fxPlan.ts` (`groundFx`), `data/efekt-baglama.json`.
- Büyüler: A0 envanterinin (`ENVANTER-BUYULER.md`) sınıflama kuralı aynen; A1 regresyon yoklaması (`src/battle/spellProbe.test.ts`) 339 büyü × 13 hedef biçimiyle bu dalda yeniden koşturuldu (olay türleri kaydedildi; geçici kopya testten sonra silindi, commit'e girmedi). Yoklama A0 ile tek tek karşılaştırıldı: ayrışan yalnızca A1/A2'de düzelen Heal ve Eyebite (ÇALIŞMIYOR → ÇALIŞIR). Koşullu büyüler (tepki, ritüel, silah gerektiren, ölmekte hedef, ağaç yanı) A0'daki gibi ÇALIŞIR. "ÇALIŞMIYOR" = A0'daki "YOK".
- Sınır: yoklama "savaşı değiştiren olay oluştu mu" sorusunu yanıtlar; sayıların SRD ile birebir doğruluğu `docs/BUYU-DENETIMI*.md` ve testlerde.

## Bölüm 1: canavar jetonları

- `public/monsters/`: **352** webp = 330 ana + 22 `-uyku` (ana dosyalardan `troll-limb` de bir canavar kimliği: Troll'ün Loathsome Limbs uzvu). Klasör 6.2 MB.
- `data/monsters.json`: **330** canavar (SRD 5.2.1). Boyut dağılımı: T 25, S 23, M 126, L 107, H 34, G 15.
- Veride hiçbir canavarın `avatar` alanı yok; yol her zaman `monsters/<id>.webp` (`src/battle/avatar.ts` `monsterAvatar`).
- `data/sprite-esleme.json` canavar jetonlarıyla ilgili değil: yüzey/büyü alanı (`zones`), nesne (`objects`), patlama (`effects`) ve E1 efekt sayfaları (`efektler`, `efektIkonlari`) içerir. Canavarla tek bağ yok.

**(a) Görseli olmayan canavar: 0.** 330 canavarın 330'unun ana jetonu var.

Not: görseli olmayan yaratık yolları başka yerde: Game Master'ın eklediği **özel canavar** (kimliği `monsters/` altında dosyası olmayan) ve `summons.json` dışındaki çağrı yaratıkları; bunlar yedek zincirin sonunda baş harfli daireye düşer (`AvatarCircle`).

**(b) Görseli olup veride olmayan dosya: 0.** Her `-uyku` dosyasının da ana canavarı veride var.

**(c) `-uyku` varyantı.** 22 dosya: adult-gold-dragon, adult-red-dragon, ancient-gold-dragon, ancient-red-dragon, bandit-captain, bandit, brown-bear, dire-wolf, goblin-warrior, gold-dragon-wyrmling, hell-hound, hill-giant, hobgoblin-warrior, minotaur-of-baphomet, ogre, owlbear, red-dragon-wyrmling, troll, wolf, wyvern, young-gold-dragon, young-red-dragon.

- Ne için: uyuyan düşman jetonu. Kaynak `Combatant.asleep`: (1) `sleepingDragon` harita kuralı (uyuyan ejderha, `src/battle/create.ts`), (2) Görev S4 alarm grupları: `groups_formed` olayında grup durumu `asleep` olan üyelere `asleep: true` (`src/battle/reduce.ts`). Uyanınca (`group_alarmed`, ejderha uyanışı) `asleep: false`.
- Nasıl seçilir: `monsterAvatar` her canavara `asleepSrc: monsters/<id>-uyku.webp` yazar (dosya olsun olmasın). `AvatarCircle` → `useImageChain(chainOf(avatar, asleep))`: uyurken zincir `[uyku, ana, eski yollar]`; uyku dosyası yoksa `onError` ile ana görsele düşer (bir 404 isteği). Sleep büyüsünün Unconscious'ı `asleep` değildir, uyku görseli kullanılmaz.
- Uyuyan grubu olan haritada `-uyku`su olmayan bir canavar ana görselle "uyur" (CSS `asleep` sınıfı + Zzz rozeti).

**(d) Ejderha yaşları.** 10 renk × 4 yaş = 40 ejderha kaydı, 40 ayrı dosya; ama aynı rengin dört yaşı **piksel piksel aynı** görsel (dosya baytları farklı, çözülmüş görüntü özdeş). Altın ve kırmızının `-uyku` dörtlüleri de kendi içinde aynı. Toplam 352 dosyada **316 farklı görsel** var (12 aynı-görsel grubu, 48 dosya).

| Yaş | Boyut | Görsel ölçeği (`data/token-sizes.json`) | multiHex açıkken altıgen |
|---|---|---|---|
| Wyrmling | M | 1 | 1 |
| Young | L | 1,5 | 3 |
| Adult | H | 2 | 7 |
| Ancient | G | 3 | 19 (21×11+ haritada) |

Ölçek yalnızca görsel: `src/ui/tokenSize.ts` `tokenScale` (canavarda boyut sınıfı, oyuncuda ırk); `AvatarCircle` görseli `2r × scale` çizer, `drawOrder` büyük jetonun taştığı küçükleri üste alır. Mekanik ayak izi `multiHex` (deneysel, varsayılan kapalı) açıkken `src/rules/footprint.ts`. Yani yaş farkı ekranda yalnızca boyla görünür; ayrı yaş görseli istenirse 30 yeni çizim (10 renk × young/adult/ancient) gerekir.

## Bölüm 2: çağrı ve yaratık jetonları

Çağrılan her yaratık sıradaki ayrı savaşçıdır (`summoned` olayı). Jeton yolu: `summons.json` yaratığında `avatar` (elle yazılmış ödünç yol), familiar ve Animate Dead biçimlerinde biçimin `monsters/<id>.webp`'si (`combatantFromMonster`). Seçim (`choice`: yaratık türü, hasar türü, biçim) **jetonu değiştirmez**; yalnızca arka plan rengi sahibinden (`avatar.bg`). Çağrı görsel olarak yalnızca E1 efektiyle ayrışır (`cagir-portal` / `cagir-ruh` / `cagir-dogal`, `data/efekt-baglama.json` `cagir`) ve çağrılmış filtresi (`statusFx`).

Boyut sütunu: veri boyutu. Altıgen: varsayılan (multiHex kapalı) her yaratık 1; multiHex açıkken L 3, H 7, G 19. "Yer kaplamaz" = dokunulamaz (`intangible`) ya da `noSpace`.

### 2a. Ayrı savaşçı (jetonlu) çağrılar

| Ad | Büyü / özellik | Jeton şu an | Boyut | Altıgen (kapalı / açık) | Arketip |
|---|---|---|---|---|---|
| Familiar (11 biçim: bat, cat, frog, hawk, lizard, octopus, owl, rat, raven, spider, weasel) | Find Familiar; Druid Wild Companion (`druid:wild-companion`); Warlock Pact of the Chain | kendi (biçimin canavar jetonu); Celestial/Fey/Fiend seçimi görünmez | T (octopus S) | 1 / 1 | kuş (hawk, owl, raven, bat), böcek (spider), diğer hayvan |
| Otherworldly Steed | Find Steed; Paladin Faithful Steed (`paladin:faithful-steed`) | ödünç `draft-horse`; Celestial/Fey/Fiend seçimi görünmez | L | 1 / 3 | diğer (binek at) |
| Draconic Spirit | Summon Dragon; Draconic Sorcery Dragon Companion (18) | ödünç `bronze-dragon-wyrmling` (M görsel L ölçekte); 5 hasar türü seçimi görünmez | L | 1 / 3 | ejderha |
| Skeleton / Zombie | Animate Dead (kurulumda; yukarı slotla 1 + 2/seviye) | kendi (`skeleton`, `zombie`) | M | 1 / 1 | iskelet, zombi |
| Zombi (ölen insansı) | Finger of Death (`riseZombie`, `src/battle/spells69.ts`) | kendi (`zombie`) | M | 1 / 1 | zombi |
| Flaming Sphere | Flaming Sphere | ödünç `magmin` | S | yer kaplamaz | element (ateş küresi) |
| Spirit Pack | Conjure Animals | ödünç `dire-wolf` | L | yer kaplamaz | kurt/köpek (ruh) |
| Giant Insect (örümcek / kırkayak / eşek arısı) | Giant Insect | ödünç `giant-spider` üç biçimde de (`giant-centipede`, `giant-wasp` jetonları var ama kullanılmıyor) | L | 1 / 3 | böcek |
| Animated Object (M / L / H) | Animate Objects | ödünç `animated-armor` üç boyutta da | M/L/H | 1 / 1-3-7 | golem/yapay |
| Arcane Hand | Arcane Hand | ödünç `animated-armor` | L | yer kaplamaz (`noSpace`) | diğer (kuvvet eli) |
| Elemental Spirit | Conjure Elemental | ödünç `air-elemental` dört seçimde de (`fire-`, `water-`, `earth-elemental` jetonları var, kullanılmıyor) | L | yer kaplamaz | element |
| Biçim değişimi (Beast) | Wild Shape, Polymorph, True Polymorph, Animal Shapes, Shapechange (`shape_changed`) | kendi (biçimin canavar jetonu, `monsterAvatar`) | biçimin | biçimin | (çağrı değil; jeton biçime geçer) |
| Örümcek biçimi | Karadul Çemberi `ev:karadul/spider` (giant-wolf-spider / giant-spider / phase-spider) | kendi (canavar jetonu) | M/L | 1 | böcek |
| Ağaç (Treant) | Treant Animate Trees (canavar yeteneği) | kendi `treant` (veride `awakened-tree` de var) | H | 1 / 7 | bitki |
| Specter | Wraith Create Specter | kendi | M | 1 | hayalet |
| Troll uzvu | Troll Loathsome Limbs | kendi `troll-limb` | S | 1 | diğer |
| Bölünen balçık | Split (balçıklar) | kendi (aynı canavar, küçük boy) | bir boy küçük | 1 | diğer |
| Harita çağrıları | Alarm boynuzu (ork), kemik yığını (Skeleton), kum pususu (Ankheg), buz mühür (Ice Mephit) | kendi (canavar jetonu) | M/L | 1 | zombi/iskelet, diğer |

### 2b. Haritada alan, aura ya da hiç temsil edilmeyen "yaratık" büyüleri

Bunlarda SRD bir yaratık/nesne tarif eder ama motor onu savaşçı yapmaz; jeton yok.

| Ad | Büyü | Şu an haritada | Boyut (SRD) | Altıgen | Arketip |
|---|---|---|---|---|---|
| Ruhani silah | Spiritual Weapon | hiç yok: bonus eylemle büyücüden saldırı (`lingering: weapon`), konum yok | — | 0 | diğer (büyülü silah) |
| Kuvvet kılıcı | Arcane Sword | hiç yok: bonus eylemle tekrar saldırı (`repeat`) | — | 0 | diğer (büyülü silah) |
| Muhafız | Guardian of Faith | yer tutucu: renkli altıgen + 🛡 (alan, `occupy`: altıgeni kaplar) | L | 1 | melek |
| Sadık tazı | Faithful Hound | yer tutucu: renkli altıgen + 🐕 (görünmez alan) | M | 0 (alan) | kurt/köpek (hayalet) |
| Ruh muhafızlar | Spirit Guardians | hiç yok: konsantrasyon aurası (`lingering: aura`); FX aura bağlı değil, yalnızca hasar sayıları | — | aura | melek/hayalet |
| Orman varlıkları | Conjure Woodland Beings | hiç yok: aura (Spirit Guardians yolu) | — | aura | peri |
| Fey ruhu | Conjure Fey | hiç yok: bonus eylemle büyü saldırısı (approx: ayrı yaratık değil) | M | 0 | peri |
| Göksel ışık sütunu | Conjure Celestial | yer tutucu: renkli altıgen + ✨ | L | alan | melek |
| Küçük elementaller | Conjure Minor Elementals | yer tutucu: büyücüyle yürüyen alan 🌀 | — | alan | element |
| Kara dokunaçlar | Black Tentacles | yer tutucu: renkli altıgen + 🐙 | — | alan | diğer (dokunaç) |
| Böcek sürüsü | Insect Plague | yer tutucu: renkli altıgen + 🦟 | — | alan | böcek |

Savaş dışı (savaşçı üretmez): Unseen Servant, Phantom Steed, Planar Ally, Planar Binding, Create Undead, Gate (ÇALIŞMIYOR), Simulacrum, Project Image (ÇALIŞMIYOR), Clone, Find Familiar'ın ritüel dışı yapımı.

**Veride olmayan adlar:** SRD 5.2.1 büyü verisinde Summon Beast/Fey/Undead/Elemental/Celestial/Construct/Fiend/Aberration ve Find Greater Steed **yok** (yalnızca Summon Dragon). `data/efekt-baglama.json` `cagir` listesi yine de `summon-beast`, `summon-undead`, `summon-celestial` kimliklerini anıyor (ölü bağ; zararsız).

**İmza ve ek paket çağrıları.** 11 imza alt sınıfı (`data/imza.json`) ve Karadul yaratık çağırmaz (Karadul biçim değiştirir, Harita Öğretisi engel çizer). Görevde adı geçen Melodi Kuklası, Gölge Tazısı, Mantar Zombisi, Ruhani Zombi, Hayalet, Küçük Ejderha, Dokunaç, totem hayvanları, peri ek paketten; paket bu kopyada yok, doğrulanamadı. Önemli: dış içerik şeması (`src/content/`) çağrı yaratığı tanımlamıyor (`summon` geçmiyor); ek paketteki çağrılar motorda yaratık olamaz, en çok başka bir etki ya da "planlı/hikâye" durumundadır. Bunlar için jeton çizmek ancak şemaya çağrı alanı eklenince anlam kazanır.

### 2c. Arketip başına çizilecek jeton listesi

"Türetme" = mevcut bir jetonun eşlemesi (veriye `avatar` ya da seçime göre görsel) ya da CSS filtresi/renk halkası; yeni çizim değil.

| Arketip | Gereken jeton | Yeni çizim | Türetme (mevcut jetondan) |
|---|---|---|---|
| Ejderha | 5 (Draconic Spirit × acid/cold/fire/lightning/poison) + ek Küçük Ejderha | 0 (+1 ek paket için) | 5: black/white/red/blue/green wyrmling + "ruh" filtresi (seçime göre görsel) |
| Element | 4 (Elemental Spirit × lightning/thunder/fire/cold) + 1 (Flaming Sphere) | 1 (ateş küresi) | 4: air/earth/fire/water-elemental + ruh filtresi |
| Kurt/köpek | 2 (Spirit Pack, Faithful Hound) + ek Gölge Tazısı | 1 (hayalet tazı; ek paketle de paylaşılır) | 1: Spirit Pack = dire-wolf + ruh filtresi |
| Böcek | 3 (Giant Insect × 3) | 0 | 3: giant-spider / giant-centipede / giant-wasp (seçime göre görsel) |
| Golem/yapay | 3 (Animated Object M/L/H) | 1 (canlanmış nesne: sandık/masa) | 2: aynı görsel L/H ölçekte (ölçek zaten boydan) |
| Diğer: büyülü silah/el | 3 (Spiritual Weapon, Arcane Sword, Arcane Hand) | 3 | 0 (Spiritual Weapon ve Arcane Sword önce konumlu savaşçı olmalı; bugün haritada yoklar) |
| Melek | 2 (Guardian of Faith, Conjure Celestial) + Spirit Guardians aurası | 1 (muhafız; Conjure Celestial ile paylaşılır) | 1: Spirit Guardians için aura sprite'ı (`aura-altin`) bağlanması (jeton değil) |
| Peri | 2 (Conjure Fey, Woodland Beings) + ek peri | 1 | 1: Woodland Beings aura sprite'ı |
| Binek (diğer) | 3 (Otherworldly Steed × Celestial/Fey/Fiend) | 0 | 3: draft-horse (ya da warhorse) + tür renk halkası/filtresi |
| Kuş / küçük hayvan | familiar 11 biçim × 3 tür | 0 | 3 tür filtresi (Celestial/Fey/Fiend), biçimler mevcut |
| Zombi / iskelet | mevcut (Animate Dead, Finger of Death) + ek Mantar Zombisi, Ruhani Zombi | 0 (+ ek paket: 2 türetme) | ek paket: zombie + yosun/ruh filtresi |
| Hayalet | ek Hayalet | 0 | ghost / specter mevcut |
| Bitki | Animate Trees | 0 | awakened-tree mevcut (şu an treant) |
| Diğer: dokunaç | Black Tentacles alanı + ek Dokunaç | 1 (alan sprite'ı ya da dokunaç jetonu) | 0 |

Toplam: **14 arketip**; SRD/çekirdek için **9 yeni çizim** (ateş küresi, hayalet tazı, canlanmış nesne, ruhani silah, kuvvet kılıcı, kuvvet eli, muhafız/melek, peri, dokunaç), **~26 türetme** (çoğu yalnızca veride seçime göre `avatar` eşlemesi + filtre).

## Bölüm 3: oyuncu karakteri jetonları

| Klasör | Dosya | Boyut | Ne |
|---|---|---|---|
| `public/characters/*.webp` | 240 | 5291 kB | 10 ırk × 2 cinsiyet × 12 sınıf, 256×256 |
| `kucuk/` | 240 | 845 kB | 96×96 rozet kopyası |
| `maske/` | 120 | 85 kB | ten maskesi PNG (dragonborn, elf, gnome, goliath, tiefling × 24) |
| `maske-el/` | 0 | — | elle maske hedefi (`assets/soy-maske-el/` boş) |
| `bas/` | 6 | 17 kB | Goliath kafa kaplaması (male/female × cleric/fighter/paladin) |

**(a) Seçim alanları.** Tek yer `characterTokenFile(raceId, gender, classId)` (`src/battle/avatar.ts`): `<ırk>-<male|female>-<sınıf>.webp`; cinsiyetsiz eski kayıt `male`. `sheetAvatar`: `sheet.avatar` verilmişse o; yoksa bu dosya, yedek `avatars/<ırk>-<sınıf>-<cinsiyet>.webp` (eski yol), en son baş harfli daire (`RACE_COLOR`, `CLASS_LABEL`). Soy (`lineageId`) görseli değiştirmez, yalnızca boyar (`lineageTint` → `tint`). **Alt sınıf görseli etkilemiyor** (`subclassId` jeton yolunda yok; `data/alt-sinif-gorunum.json` yalnızca seçim listesi görünümü). Tek istisna: Hapishane mahkûm kıyafeti `seruvenBattle.ts` sınıfı `HAPIS.kostum.sinif` ile değiştirir (`outfit: mahkum`).

**(b) kucuk / maske / bas.**
- `kucuk/`: 44–48 px rozetler (karakter listesi, oluşturucu, sıra şeridi). `badgeChain(a, size)`: boy ≤ `SMALL` ise önce `thumbOf(src)` (`characters/<ad>.webp` → `characters/kucuk/<ad>.webp`), sonra asıl görsel. Haritadaki jeton büyük görseli kullanır. Yükleme: giriş ekranında kayıtlı karakterlerin küçük jetonu boşta (`App.tsx` `preloadImages`), oluşturucuda seçili ırk+cinsiyetin 12 sınıf küçüğü (`Builder.tsx:156`).
- `maske/`: soy boyaması maskeli yoldaysa (`maskedTint(tint)`; K15 LCh/gradyan) `tintedUrl` jetonla aynı adlı maskeyi yükler (`maskUrlFor`); elle maske (`maske-el/`, `data/soy-maske-rapor.json`) önceliklidir. Yalnızca o jeton çizilirken ve boyalı soy seçiliyse; boyalı görsel nesne URL'si olarak bellekte önbelleklenir.
- `bas/`: Goliath kafa kaplaması (K22). `basUrlFor(url)`: `data/soy-bas.json` `sprites` içinde jeton adı varsa `characters/bas/<ad>.png` yüklenir, kafa kutusu temiz görselle değişip boyanır (`applyHeadOverlay`; `govdeBoya: false` Goliath Paladin/Fighter/Cleric).

**(c) Oluşturucu.** Irklar `data/races.json` sırasıyla 10: celestial, dragonborn, dwarf, elf, gnome, goliath, halfling, human, orc, tiefling (soylar `lineages`). Cinsiyet iki seçenek: erkek / kadın (`Builder.tsx`, `role="radio"`); veride `erkek|kadin`, dosyada `male|female`.

**(d) Ne zaman yüklenir.** Savaşta yalnızca sahadaki savaşçıların jetonu (`AvatarCircle` → `useImageChain`, `Image` ile tek tek; önbellek `cache`). Toplu önyükleme yok; yalnızca yukarıdaki iki küçük rozet önyüklemesi. Klasör boyutları: `public/monsters` 6.2 MB, `public/characters` 6.1 MB (ana 240 + küçük + maske + baş), `public/sprites` 2.4 MB; bütün `public/` 75.6 MB.

**(e) Alt sınıf jetonu eklemek (`<ırk>-<cinsiyet>-<sınıf>-<altsınıf>.webp`).** Bugün eşleme kuralında alt sınıf yok; gerekenler:
1. `src/battle/avatar.ts` `sheetAvatar`: `src` = alt sınıflı ad, `fallbacks` başına bugünkü `characterTokenFile(...)` (sonra eski `avatars/` yolu). Dosya yoksa `onError` zinciri sınıf jetonuna düşer; yeni kod yolu gerekmez. Ad kuralı tek yerde kalsın diye `characterTokenFile`'a isteğe bağlı `subclassId` parametresi.
2. Hapishane kıyafeti (`seruvenBattle.ts:235`) ve oluşturucu önizlemesi/önyüklemesi (`Builder.tsx:156`, `:309`) aynı fonksiyonu kullanıyor; alt sınıf geçirilmezse eski davranış.
3. Küçük kopya: `npm run karakter-kucuk` (`scripts/karakter-kucuk.mjs`) `public/characters/*.webp`'nin hepsini 96×96'ya küçültür; yeni dosyalar kendiliğinden girer. `thumbOf` regex'i (`characters/([^/]+\.webp)`) ada bakmaz, değişiklik gerekmez.
4. Soy boyaması: maske adı jeton adından (`maskUrlFor`, `spriteName`); alt sınıflı jetona maske yoksa maskeli soy boyaması o jetonda çalışmaz → `npm run soy-maske` yeni adlar için maske üretmeli (ya da maske adı sınıf jetonuna düşmeli). Goliath kafa kaplaması için `data/soy-bas.json` `sprites` kaydı (`npm run soy-bas`).
5. Test: `src/ui/avatar.test.ts` 240 adın varlığını denetler (fazla dosya serbest); envanter `scripts/varlik-envanter.mjs` addan türetilen yolları tanır, yeni kalıbı eklemezse "kullanılmayan" listesine düşer.
6. Kayıt: `subclassId` zaten karakterde; savaşçıya taşımaya gerek yok (avatar karakter sheet'inden kurulur).

## Bölüm 4: alt sınıflar

| Sınıf | SRD | İmza | Ev (Karadul) | Ek paket | Toplam |
|---|---|---|---|---|---|
| barbarian | 1 | 1 | 0 | 7 | 9 |
| bard | 1 | 1 | 0 | 7 | 9 |
| cleric | 1 | 1 | 0 | 7 | 9 |
| druid | 1 | 0 | 1 | 6 | 8 |
| fighter | 1 | 1 | 0 | 9 | 11 |
| monk | 1 | 1 | 0 | 9 | 11 |
| paladin | 1 | 1 | 0 | 8 | 10 |
| ranger | 1 | 1 | 0 | 7 | 9 |
| rogue | 1 | 1 | 0 | 8 | 10 |
| sorcerer | 1 | 1 | 0 | 7 | 9 |
| warlock | 1 | 1 | 0 | 9 | 11 |
| wizard | 1 | 1 | 0 | 13 | 15 |
| **Toplam** | 12 | 11 | 1 | 97 | 121 |

- "listeden gizli": `data/alt-sinif-gorunum.json` `kaldirilan` (K49 B5): 8 SRD alt sınıfı seçimde görünmez (veride ve kayıtlarda durur); Circle of the Land, Champion, Hunter, Thief görünür.
- İmza alt sınıflarında görünür değişiklik yapan özellik yok (Harita Öğretisi Çizili Duvar bir engel çizer, karakteri değiştirmez). Ek paketin özellik metni bu kopyada yok; etiketlenemedi (ek paket kimliklerini görsel açıdan etiketlemek için paket yerelde okunmalı).

| Sınıf | Kimlik | Ad | Kaynak | Görsel etiket |
|---|---|---|---|---|
| barbarian | path-of-the-berserker | Çılgın Savaşçı Yolu / Path of the Berserker | SRD (listeden gizli) |  |
| barbarian | element-yolu | Element Yolu | ek paket (ek-barbarian.json) | metin yok: etiketlenmedi |
| barbarian | heybet-yolu | Heybet Yolu | ek paket (ek-barbarian.json) | metin yok: etiketlenmedi |
| barbarian | ilkelligin-yolu | İlkelliğin Yolu | ek paket (ek-barbarian.json) | metin yok: etiketlenmedi |
| barbarian | kaos-yolu | Kaos Yolu | ek paket (ek-barbarian.json) | metin yok: etiketlenmedi |
| barbarian | saman-yolu | Şaman Yolu | ek paket (ek-barbarian.json) | metin yok: etiketlenmedi |
| barbarian | vahset-yolu | Vahşet Yolu | ek paket (ek-barbarian.json) | metin yok: etiketlenmedi |
| barbarian | varis-yolu | Varis Yolu | ek paket (ek-barbarian.json) | metin yok: etiketlenmedi |
| barbarian | imza_geride_kalan | Geride Kalanın Yolu / Path of the Survivor | imza (ev) |  |
| bard | college-of-lore | Bilgi Koleji / College of Lore | SRD (listeden gizli) |  |
| bard | agit-koleji | Ağıt Koleji | ek paket (ek-bard.json) | metin yok: etiketlenmedi |
| bard | akrobat-koleji | Akrobat Koleji | ek paket (ek-bard.json) | metin yok: etiketlenmedi |
| bard | arzu-koleji | Arzu Koleji | ek paket (ek-bard.json) | metin yok: etiketlenmedi |
| bard | harp-koleji | Harp Koleji | ek paket (ek-bard.json) | metin yok: etiketlenmedi |
| bard | hatip-koleji | Hatip Koleji | ek paket (ek-bard.json) | metin yok: etiketlenmedi |
| bard | islik-koleji | Islık Koleji | ek paket (ek-bard.json) | metin yok: etiketlenmedi |
| bard | varolus-koleji | Varoluş Koleji | ek paket (ek-bard.json) | metin yok: etiketlenmedi |
| bard | imza_sair | Şair Koleji / College of Poets | imza (ev) |  |
| cleric | life-domain | Yaşam Etki Alanı / Life Domain | SRD (listeden gizli) |  |
| cleric | aydin-alani | Aydın Alanı | ek paket (ek-cleric.json) | metin yok: etiketlenmedi |
| cleric | baris-alani | Barış Alanı | ek paket (ek-cleric.json) | metin yok: etiketlenmedi |
| cleric | demirci-alani | Demirci Alanı | ek paket (ek-cleric.json) | metin yok: etiketlenmedi |
| cleric | firtina-alani | Fırtına Alanı | ek paket (ek-cleric.json) | metin yok: etiketlenmedi |
| cleric | mezar-alani | Mezar Alanı | ek paket (ek-cleric.json) | metin yok: etiketlenmedi |
| cleric | savas-alani | Savaş Alanı | ek paket (ek-cleric.json) | metin yok: etiketlenmedi |
| cleric | yakamoz-alani | Yakamoz Alanı | ek paket (ek-cleric.json) | metin yok: etiketlenmedi |
| cleric | imza_birlik | Birlik Manastırı / Unity Monastery | imza (ev) |  |
| druid | circle-of-the-land | Toprak Çemberi / Circle of the Land | SRD |  |
| druid | anka-cemberi | Anka Çemberi | ek paket (ek-druid.json) | metin yok: etiketlenmedi |
| druid | cagri-cemberi | Çağrı Çemberi | ek paket (ek-druid.json) | metin yok: etiketlenmedi |
| druid | curuyus-cemberi | Çürüyüş Çemberi | ek paket (ek-druid.json) | metin yok: etiketlenmedi |
| druid | element-cemberi | Element Çemberi | ek paket (ek-druid.json) | metin yok: etiketlenmedi |
| druid | feza-cemberi | Feza Çemberi | ek paket (ek-druid.json) | metin yok: etiketlenmedi |
| druid | uyku-cemberi | Uyku Çemberi | ek paket (ek-druid.json) | metin yok: etiketlenmedi |
| druid | karadul-cemberi | Karadul Çemberi / Circle of the Black Widow | ev (Karadul) | [şekil değişimi/hayvan formu] (örümcek biçimi) |
| fighter | champion | Şampiyon / Champion | SRD |  |
| fighter | capkin-kavalye | Çapkın Kavalye | ek paket (ek-fighter.json) | metin yok: etiketlenmedi |
| fighter | cift-dikis | Çift Dikiş | ek paket (ek-fighter.json) | metin yok: etiketlenmedi |
| fighter | hissi-kablel | Hissi Kablel | ek paket (ek-fighter.json) | metin yok: etiketlenmedi |
| fighter | hokkabaz | Hokkabaz | ek paket (ek-fighter.json) | metin yok: etiketlenmedi |
| fighter | ninja | Ninja | ek paket (ek-fighter.json) | metin yok: etiketlenmedi |
| fighter | pehlivan | Pehlivan | ek paket (ek-fighter.json) | metin yok: etiketlenmedi |
| fighter | sahin-gozlu | Şahin Gözlü | ek paket (ek-fighter.json) | metin yok: etiketlenmedi |
| fighter | samuray | Samuray | ek paket (ek-fighter.json) | metin yok: etiketlenmedi |
| fighter | sancaktar | Sancaktar | ek paket (ek-fighter.json) | metin yok: etiketlenmedi |
| fighter | imza_imparator | İmparator / Emperor | imza (ev) |  |
| monk | warrior-of-the-open-hand | Açık El Savaşçısı / Warrior of the Open Hand | SRD (listeden gizli) |  |
| monk | astral-disiplini | Astral Disiplini | ek paket (ek-monk.json) | metin yok: etiketlenmedi |
| monk | ayyaslik-disiplini | Ayyaşlık Disiplini | ek paket (ek-monk.json) | metin yok: etiketlenmedi |
| monk | azizlik-disiplini | Azizlik Disiplini | ek paket (ek-monk.json) | metin yok: etiketlenmedi |
| monk | ejderha-disiplini | Ejderha Disiplini | ek paket (ek-monk.json) | metin yok: etiketlenmedi |
| monk | element-disiplini | Element Disiplini | ek paket (ek-monk.json) | metin yok: etiketlenmedi |
| monk | isik-disiplini | Işık Disiplini | ek paket (ek-monk.json) | metin yok: etiketlenmedi |
| monk | karanlik-disiplini | Karanlık Disiplini | ek paket (ek-monk.json) | metin yok: etiketlenmedi |
| monk | keskinlik-disiplini | Keskinlik Disiplini | ek paket (ek-monk.json) | metin yok: etiketlenmedi |
| monk | olumsuzluk-disiplini | Ölümsüzlük Disiplini | ek paket (ek-monk.json) | metin yok: etiketlenmedi |
| monk | imza_bilge | Yaşlı Bilge Disiplini / Elder Sage Discipline | imza (ev) |  |
| paladin | oath-of-devotion | Bağlılık Yemini / Oath of Devotion | SRD (listeden gizli) | [belirgin silah/kıyafet değişimi] (Sacred Weapon ışıyan silah; Holy Nimbus 20) |
| paladin | antik-yemin | Antik Yemin | ek paket (ek-paladin.json) | metin yok: etiketlenmedi |
| paladin | asi-yemin-bozan | Asi / Yemin Bozan | ek paket (ek-paladin.json) | metin yok: etiketlenmedi |
| paladin | biat-yemini | Biat Yemini | ek paket (ek-paladin.json) | metin yok: etiketlenmedi |
| paladin | fetih-yemini | Fetih Yemini | ek paket (ek-paladin.json) | metin yok: etiketlenmedi |
| paladin | intikam-yemini | İntikam Yemini | ek paket (ek-paladin.json) | metin yok: etiketlenmedi |
| paladin | kefaret-yemini | Kefaret Yemini | ek paket (ek-paladin.json) | metin yok: etiketlenmedi |
| paladin | muhafiz-yemini | Muhafız Yemini | ek paket (ek-paladin.json) | metin yok: etiketlenmedi |
| paladin | zafer-yemini | Zafer Yemini | ek paket (ek-paladin.json) | metin yok: etiketlenmedi |
| paladin | imza_hizir | Hızır Yemini / Oath of Hızır | imza (ev) |  |
| ranger | hunter | Avcı / Hunter | SRD |  |
| ranger | avare | Avare | ek paket (ek-ranger.json) | metin yok: etiketlenmedi |
| ranger | coban | Çoban | ek paket (ek-ranger.json) | metin yok: etiketlenmedi |
| ranger | ejder-muhafizi | Ejder Muhafızı | ek paket (ek-ranger.json) | metin yok: etiketlenmedi |
| ranger | ibliskiran | İbliskıran | ek paket (ek-ranger.json) | metin yok: etiketlenmedi |
| ranger | izci | İzci | ek paket (ek-ranger.json) | metin yok: etiketlenmedi |
| ranger | kovanci | Kovancı | ek paket (ek-ranger.json) | metin yok: etiketlenmedi |
| ranger | seyyah | Seyyah | ek paket (ek-ranger.json) | metin yok: etiketlenmedi |
| ranger | imza_ciftci | Çiftçi / Farmer | imza (ev) |  |
| rogue | thief | Hırsız / Thief | SRD |  |
| rogue | dedektif | Dedektif | ek paket (ek-rogue.json) | metin yok: etiketlenmedi |
| rogue | illuzyonist | İllüzyonist | ek paket (ek-rogue.json) | metin yok: etiketlenmedi |
| rogue | kamufle | Kamufle | ek paket (ek-rogue.json) | metin yok: etiketlenmedi |
| rogue | kasif | Kaşif | ek paket (ek-rogue.json) | metin yok: etiketlenmedi |
| rogue | psisik-hancerler-kirpi | Psişik Hançerler (Kirpi) | ek paket (ek-rogue.json) | metin yok: etiketlenmedi |
| rogue | silahsor | Silahşör | ek paket (ek-rogue.json) | metin yok: etiketlenmedi |
| rogue | suikastci | Suikastçi | ek paket (ek-rogue.json) | metin yok: etiketlenmedi |
| rogue | taktisyen | Taktisyen | ek paket (ek-rogue.json) | metin yok: etiketlenmedi |
| rogue | imza_infazci | İnfazcı / Vigilante | imza (ev) |  |
| sorcerer | draconic-sorcery | Ejderha Büyücülüğü / Draconic Sorcery | SRD (listeden gizli) | [kanat/uçuş görünümü] (Dragon Wings 14), [yaratık çağırır] (Dragon Companion 18: Summon Dragon); Draconic Resilience pullar |
| sorcerer | alevbaz | Alevbaz | ek paket (ek-sorcerer.json) | metin yok: etiketlenmedi |
| sorcerer | ceren-urperten | Ceren Ürperten | ek paket (ek-sorcerer.json) | metin yok: etiketlenmedi |
| sorcerer | ilahi-kan | İlahi Kan | ek paket (ek-sorcerer.json) | metin yok: etiketlenmedi |
| sorcerer | lanetli | Lanetli | ek paket (ek-sorcerer.json) | metin yok: etiketlenmedi |
| sorcerer | otonom-evren | Otonom Evren | ek paket (ek-sorcerer.json) | metin yok: etiketlenmedi |
| sorcerer | paratoner | Paratoner | ek paket (ek-sorcerer.json) | metin yok: etiketlenmedi |
| sorcerer | titan-kani | Titan Kanı | ek paket (ek-sorcerer.json) | metin yok: etiketlenmedi |
| sorcerer | imza_dunganga | Dunganga / Dunganga | imza (ev) |  |
| warlock | fiend-patron | İblis Hamisi / Fiend Patron | SRD (listeden gizli) |  |
| warlock | cin | Cin | ek paket (ek-warlock.json) | metin yok: etiketlenmedi |
| warlock | gulyabani | Gulyabani | ek paket (ek-warlock.json) | metin yok: etiketlenmedi |
| warlock | hortlak | Hortlak | ek paket (ek-warlock.json) | metin yok: etiketlenmedi |
| warlock | kargisci | Kargışçı | ek paket (ek-warlock.json) | metin yok: etiketlenmedi |
| warlock | kraken | Kraken | ek paket (ek-warlock.json) | metin yok: etiketlenmedi |
| warlock | melek | Melek | ek paket (ek-warlock.json) | metin yok: etiketlenmedi |
| warlock | muhterem | Muhterem | ek paket (ek-warlock.json) | metin yok: etiketlenmedi |
| warlock | paradoks | Paradoks | ek paket (ek-warlock.json) | metin yok: etiketlenmedi |
| warlock | ruhsar | Ruhsar | ek paket (ek-warlock.json) | metin yok: etiketlenmedi |
| warlock | imza_astrolog | Astrolog / Astrologer | imza (ev) |  |
| wizard | evoker | Evokasyon Ustası / Evoker | SRD (listeden gizli) |  |
| wizard | aldatma-ogretisi | Aldatma Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | anka-ogretisi | Anka Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | diriltme-ogretisi | Diriltme Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | harp-ogretisi | Harp Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | hattat-ogretisi | Hattat Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | kehanet-ogretisi | Kehanet Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | kilic-sarkisi-ogretisi | Kılıç Şarkısı Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | serap-ogretisi | Serap Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | siginak-ogretisi | Sığınak Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | simya-ogretisi | Simya Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | tezahur-ogretisi | Tezahür Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | uzay-bukme-ogretisi | Uzay Bükme Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | zamanalti-ogretisi | Zamanaltı Öğretisi | ek paket (ek-wizard.json) | metin yok: etiketlenmedi |
| wizard | imza_harita | Harita Öğretisi / Doctrine of the Map | imza (ev) |  |

## Bölüm 5: büyüler (339)

| Sınıf | Sayı | A0 |
|---|---|---|
| ÇALIŞIR | 153 | 151 |
| KISMİ | 74 | 74 |
| ÇALIŞMIYOR | 19 | 21 |
| SAVAŞ DIŞI | 93 | 93 |
| **Toplam** | 339 | 339 |

Fark: Heal ve Eyebite A1'de düzeldi (ÇALIŞMIYOR → ÇALIŞIR). Dosyalar: `spells.json` 185 (0–3 ve Cone of Cold, Summon Dragon), `spells-45.json` 70, `spells-69.json` 84.

**6–9. seviyede boş metin:** `spells-69.json`'daki **84 büyünün 84'ünde `text` alanı yok** (0–5. seviyede hepsi dolu). Kartta açıklama `mechanics`/`gmNote`/`k19` ya da SRD kaydından gelir.

### İstenen büyüler

| Büyü | Sv | Sınıf | Not |
|---|---|---|---|
| Sanctuary | 1 | KISMİ | Başarısız WIS save'de saldırı/büyü boşa gider (`wards.ts` `sanctuaryCheck`); eksik: yeni hedef seçme, alan etkileri, fırsat saldırısı dışı yollar. |
| Warding Bond | 2 | KISMİ | +1 AC/save, bütün türlere direnç, alınan hasar büyücüye (`bondEvents`, her komuttan sonra toplu); 0 HP / 60 ft bitişi var. KISMİ nedeni yalnızca aktarım zamanlaması; SRD'ye yakın. |
| Jump | 1 | KISMİ | Turda bir 30 ft düz atlama (2 altıgen), tek engel üstünden; eksik: yüksek atlama, yükseklik katmanıyla bağ. |
| Spider Climb | 2 | KISMİ | `climb` etkisi `flight.ts` tırmanıcı sayar (yükseklik farkı maliyeti yok); eksik: duvar/tavanda durma. approx metni K26 yükseklik katmanından eski. |
| Gaseous Form | 3 | KISMİ | uçuş 10 ft, direnç, Prone bağışıklığı, save avantajı; eksik: dar aralıktan geçme (altıgen ızgarada anlamsız). |
| Guardian of Faith | 4 | ÇALIŞIR | alan: altıgeni kaplar, 60 hasar bütçesi (K19); jeton yok, yer tutucu ikon. |
| Contagion | 5 | ÇALIŞIR | Poisoned + seçilen yetenekte save dezavantajı, 3 başarı/3 başarısızlık (K19). |
| Giant Insect | 4 | ÇALIŞIR | çağrı: 3 biçim, Web Bolt, Venomous Spew, uçuş (K19); jeton üç biçimde aynı. |
| Death Ward | 4 | ÇALIŞIR | hasarsız anında ölüm ve 0 HP'ye düşmeyi bir kez önler (K19, 41b). |
| Faithful Hound | 4 | ÇALIŞIR | görünmez alan, büyücü turu başında ısırık, 30 ft taşıma; havlama/parola savaş dışı. |
| Animate Objects | 5 | ÇALIŞIR | çağrı, boyut karışımı, bonus eylemle emir (K19); 0 HP'de nesneye dönüş yok. |
| Scrying | 5 | SAVAŞ DIŞI | Game Master notu. |
| Divination | 4 | SAVAŞ DIŞI | Game Master notu (ritüel). |

### KISMİ ve ÇALIŞMIYOR (neden: eksik mekanik)

| Büyü | Sv | Sınıf | Neden |
|---|---|---|---|
| Dancing Lights | 0 | KISMİ | Dört ışık yerine tek ışık noktası (çevresiyle 10 ft); taşıma bonus eylemle bir yaratığın altıgenine; insan biçimi yok |
| Light | 0 | KISMİ | Nesne yerine bir yaratık (büyücü ya da dost) taşır; yalnızca parlak ışık (20 ft = 4 altıgen), loş ışık ayrı değil; ışık yalnızca karanlık/gece haritalarında etkili |
| Minor Illusion | 0 | ÇALIŞMIYOR | yanılsama örtüsü yok |
| Produce Flame | 0 | KISMİ | SRD: alev bonus eylemle yaratılır, Magic eylemiyle 60 ft fırlatılır; oyunda yaratıp fırlatmak tek bonus eylem |
| Starry Wisp | 0 | KISMİ | Işık ve görünmezlik engeli sonraki turun sonuna dek (büyücünün sonraki turunun sonu yerine) |
| Charm Person | 1 | KISMİ | dostluk tutumu ve sosyal avantaj yok |
| Chromatic Orb | 1 | KISMİ | Sıçrama: aynı iki hasar zarında 30 ft içindeki en yakın düşmana yeni saldırı, slot seviyesi kadar (hedef seçimi yapay zekâda en yakın) |
| Color Spray | 1 | KISMİ | Kör kalma etkinin süresiyle (iki tur sınırı; büyücünün sonraki turunun sonu yerine) |
| Command | 1 | KISMİ | Drop: elde tutulan bırakılmaz (silah bırakma modeli yok), yalnızca turunu kaybeder; Approach ve Flee yürüyüşten sonra turu biter |
| Disguise Self | 1 | ÇALIŞMIYOR | görünüm değişimi (gizlenme) yok |
| Ensnaring Strike | 1 | KISMİ | Kurtulma eylemle STR (Athletics) kontrolü yerine tur başı hasardan sonra STR save; yalnızca bu tur yakın dövüş isabeti |
| Entangle | 1 | KISMİ | Kurtulma eylemle STR (Athletics) kontrolüyle; bitki sarmaşığının bitişik altıgenlere yayılması yok |
| Expeditious Retreat | 1 | KISMİ | Her turun bonus eylemle Dash'i yerine hız iki katı (bonus eylem harcanmaz) |
| Faerie Fire | 1 | KISMİ | Nesneler işaretlenmez; saldıranın hedefi görmesi ayrıca denetlenmez; ışık (10 ft) yalnızca karanlık/gece haritalarında |
| Fog Cloud | 1 | KISMİ | Rüzgârla dağılma yok |
| Goodberry | 1 | ÇALIŞMIYOR | meyveyle bonus eylem iyileştirme yok |
| Hex | 1 | KISMİ | Seçilen yeteneğin kontrollerinde dezavantaj yok (savaşta kontrol azdır) |
| Hideous Laughter | 1 | KISMİ | Prone kendi başına kaldırılamaz kuralı ayrıca denetlenmez (Incapacitated kalkmayı zaten engeller) |
| Jump | 1 | KISMİ | Turda bir 30 ft düz atlama 10 ft (2 altıgen) harcar, aradaki tek engel altıgeninin (hendek, sütun) üstünden geçer (Görev K9c); yüksek atlama yok |
| Mage Armor | 1 | KISMİ | Hedefin zırh giyip giymediği denetlenmez (temel AC zaten yüksekse etkisiz) |
| Protection from Evil and Good | 1 | KISMİ | Ele geçirme (possession) yok; zaten Charmed/Frightened olana yeni save avantajı yok |
| Sanctuary | 1 | KISMİ | Başarısız save'de saldırı ya da büyü boşa gider (yeni hedef seçme yok; büyü yuvası harcanmaz); alan etkileri ve fırsat saldırısı dışı yollar etkilenmez |
| Silent Image | 1 | ÇALIŞMIYOR | yanılsama yok |
| Sleep | 1 | KISMİ | İkinci başarısız save'de Unconscious (Görev WIZARD); hasar alınca uyanır; yanındakinin eylemle uyandırması yok |
| Alter Self | 2 | KISMİ | Yalnızca Natural Weapons (hasar türü Bludgeoning kalır); Aquatic Adaptation ve Change Appearance savaş dışı (Game Master) |
| Arcane Lock | 2 | ÇALIŞMIYOR | kapı kilitleme yok |
| Blindness/Deafness | 2 | KISMİ | Seçim komutta (choice); arayüzde ve yapay zekâda Blinded. Deafened yalnızca sözlü buyrukları (Command, Suggestion) engeller |
| Blur | 2 | KISMİ | Blindsight/Truesight ile görenler için istisna yok |
| Calm Emotions | 2 | KISMİ | Dostlara save yok (isteyerek başarısız sayılır); var olan Charmed/Frightened bastırılmaz, kalkar; kayıtsızlık "her turunu kaybeder" olarak |
| Continual Flame | 2 | KISMİ | Nesne yerine bir yaratık taşır; yalnızca parlak ışık (20 ft); süre savaş boyunca |
| Darkness | 2 | KISMİ | Nesneye bağlı yürüyen karanlık yok; Blindsight/Truesight yok; Darkvision bu alanı göremez ve ışık aydınlatamaz (karanlık/gece haritasında), her haritada yoğun örtü |
| Dragon's Breath | 2 | KISMİ | Nefesi dokunulan dost yerine büyücü verir; tür seçimi yapılırken (nefeste Fire); yukarı slot zarı uygulanmaz |
| Enhance Ability | 2 | KISMİ | Kontroller savaşta az (İt, Gizlen, kurtulma) |
| Enlarge/Reduce | 2 | KISMİ | Boyut yalnızca jeton etiketi (mekanik tek altıgen); STR kontrolleri ve nesneler yok |
| Enthrall | 2 | ÇALIŞMIYOR | Algı dezavantajı yok |
| Find Traps | 2 | ÇALIŞMIYOR | tuzak bulma yok (tuzak sistemi var) |
| Flame Blade | 2 | KISMİ | Kılıç el boşluğu denetlenmez; bırakıp yeniden çağırma yok; saldırı "Büyüyü sürdür" (eylem) ile |
| Flaming Sphere | 2 | KISMİ | Engellerin üstünden atlama ve ışık yok; çarpma yalnızca taşımanın sonunda bitişik yaratığa |
| Gust of Wind | 2 | KISMİ | Çizgide tur bitirene tekrar save ve hareket maliyeti yok; tekrar yeni bir esinti olarak |
| Heat Metal | 2 | KISMİ | Her yaratık metal taşıyor sayılır; silahı bırakma seçeneği yok, kontrol dezavantajı yok |
| Invisibility | 2 | KISMİ | Saldırı ve büyüyle biter; saldırısız hasar verince (aura, alan) bitmez |
| Knock | 2 | ÇALIŞMIYOR | kilitli kapı/sandık açma yok (nesne kilidi var) |
| Levitate | 2 | KISMİ | Yükseklik modeli yok: havadaki yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c) ama yürüyemez; 20 ft yükselme ve duvardan itinerek hareket yok; nesneye… |
| Magic Weapon | 2 | KISMİ | Büyücünün kendi silahlarına uygulanır |
| Mind Spike | 2 | KISMİ | Hedefin yerini her zaman bilme (gizlenme/görünmezlik) yok |
| Mirror Image | 2 | KISMİ | Blindsight/Truesight ayrımı yok (yalnızca Blinded saldıran etkilenmez) |
| Moonbeam | 2 | KISMİ | Taşıma 60 ft yerine büyü menzili içinde bir yaratığın altıgenine; biçim değiştirenlere ek etki yok; silindir yüksekliği yok |
| Phantasmal Force | 2 | KISMİ | Yanılsamanın biçimi ve konumu yok: her turda hasar verir; Study eylemiyle (Investigation) kurtulma yok |
| Protection from Poison | 2 | KISMİ | Poisoned'a karşı save avantajı yok |
| Ray of Enfeeblement | 2 | KISMİ | STR saldırısı yakın dövüş saldırısı sayılır (Finesse ve fırlatma ayrımı yok) |
| Rope Trick | 2 | ÇALIŞMIYOR | boyut cebine saklanma yok |
| See Invisibility | 2 | KISMİ | Ethereal Plane görüşü yok |
| Silence | 2 | KISMİ | Tepki büyüleri (Shield, Counterspell) sessizlikte denetlenmez; Deafened durumu verilmez (Thunder bağışıklığı var) |
| Spider Climb | 2 | KISMİ | Yükseklik modeli yok: tırmanma hızı haritadaki yükseklik farkı maliyetini kaldırır (Görev K9c); duvar/tavanda durma yok |
| Spike Growth | 2 | KISMİ | Gizlenmiş (fark edilmemiş) alan kuralı yok: herkes alanı görür |
| Suggestion | 2 | KISMİ | Öneri iki seçenekle: savaşı bırak (her turunu kaybeder) ya da uzaklaş (her tur kaçar); serbest metinli öneriler Game Master'a; duyma/anlama denetimi yok |
| Warding Bond | 2 | KISMİ | Hedefe +1 AC, +1 save, bütün hasar türlerine direnç; aldığı hasar kadar büyücüye (her komuttan sonra); büyücü 0 HP ya da 60 ft'ten uzak olunca biter. Hedefin kendisine y… |
| Web | 2 | KISMİ | Tutunma yeri kuralı (çökme) ve yanma yok; hafif örtünün oyunda etkisi yok |
| Animate Dead | 3 | KISMİ | Döküm süresi 1 dakika olduğu için yalnızca kurulumda; bonus eylemle komut yerine sahibinin ardından kendisi oynar |
| Beacon of Hope | 3 | KISMİ | Hedef sayısı 6 (SRD: menzildeki istenen sayıda yaratık); en yüksek iyileştirme yalnızca büyü iyileştirmesinde |
| Bestow Curse | 3 | KISMİ | Dört seçenek: yetenek (seçilen yetenekte save dezavantajı; kontrol dezavantajı yok), lanetleyene saldırılar dezavantajlı, tur başı WIS save ya da eylem yok, lanetleyenin… |
| Blink | 3 | KISMİ | Tur sonu d20 11+: sonraki turunun başına dek Ethereal (hedef alınamaz, alan ve saldırılardan etkilenmez); dönüşte aynı altıgen (10 ft içinde yer seçimi yok) |
| Call Lightning | 3 | KISMİ | Fırtınada ek zar yok; tekrarın noktası bir yaratığın altıgeni |
| Conjure Animals | 3 | KISMİ | Sürü büyücüyle birlikte değil, sahibinin bonus eylemiyle 30 ft taşınır; büyücünün STR save avantajı yok; sürü bir altıgen kaplar |
| Daylight | 3 | KISMİ | Nesneye bağlı yürüyen ışık yok; ek 60 ft loş ışık yok; gün ışığına duyarlı yaratık kuralları yok |
| Dispel Magic | 3 | KISMİ | Yaratıktaki süren büyü etkileri, büyüyle çağrılmış yaratık, silahtaki büyü güçlendirmesi (Magic Weapon, Divine Favor) ve altıgen hedefte büyü alanları; slotun üstündeki… |
| Fear | 3 | KISMİ | Tekrar save her tur sonunda (SRD: yalnızca büyücüyü göremezken); elindekini düşürme yok; kaçınca turu biter |
| Fly | 3 | KISMİ | Yükseklik modeli yok: uçan yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c); uçuş bitince düşme hasarı uygulanmaz |
| Gaseous Form | 3 | KISMİ | Yükseklik farkı maliyetini ve zemin engelini yok sayar (uçuş 10 ft; Görev K9c); dar aralıklardan geçme yok (harita altıgen) |
| Haste | 3 | KISMİ | Ek eylem asıl eylemden sonra alınır; Utilize yok |
| Hypnotic Pattern | 3 | KISMİ | Sarsarak uyandırma (eylemle) yok; hasarla ve konsantrasyonla biter |
| Major Image | 3 | ÇALIŞMIYOR | yanılsama (örtü/dikkat dağıtma) yok |
| Meld into Stone | 3 | ÇALIŞMIYOR | taşa girip gizlenme yok |
| Plant Growth | 3 | KISMİ | Alandan bölge çıkarma yok; Enrichment (8 saat) savaşta yok |
| Remove Curse | 3 | KISMİ | Yalnızca Bestow Curse etkisi kalkar (Hex büyücünün konsantrasyonunda kalır; lanetli eşya yok) |
| Sleet Storm | 3 | KISMİ | Silindir küre sayılır (yükseklik yok); alevlerin sönmesi yok |
| Slow | 3 | KISMİ | 40 ft küp yerine seçilen hedefler; büyü yapmadaki gecikme (d20) yok |
| Stinking Cloud | 3 | KISMİ | Eylem ve bonus eylem kaybı Incapacitated ile (tepki de gider); rüzgârla dağılma yok |
| Wind Wall | 3 | KISMİ | Duvar düz ya da büyücünün çevresinde yay (serbest çizim yok); dev kayaları ayrımı yok; sis dağıtma yok |
| Control Water | 4 | ÇALIŞMIYOR | veride savaş dışı; Kuyruk 19 girdap kodu var ama yapımda olay üretmedi |
| Stone Shape | 4 | ÇALIŞMIYOR | duvar/geçit şekillendirme yok |
| Passwall | 5 | ÇALIŞMIYOR | duvarda geçit açma yok (tile_changed ile) |
| Conjure Fey | 6 | KISMİ | Fey ruhu ayrı yaratık değil: yapımda ve sonraki turlarda bonus eylemle bir düşmana büyü saldırısı (3d12 Psychic) ve WIS save ya da Frightened |
| Mass Suggestion | 6 | KISMİ | Öneri savaşta "dur" olarak |
| Transport via Plants | 6 | ÇALIŞMIYOR | ağaçtan ağaca geçiş yok |
| Word of Recall | 6 | ÇALIŞMIYOR | kaçış ışınlanması yok |
| Plane Shift | 7 | KISMİ | İstemsiz hedef: melee büyü saldırısı + CHA save; başka düzleme gider (savaş boyunca sürgün) |
| Project Image | 7 | ÇALIŞMIYOR | yansıma yok |
| Teleport | 7 | ÇALIŞMIYOR | savaştan kaçış ışınlanması yok (K53 teleport ile) |
| Animal Shapes | 8 | KISMİ | Polymorph biçim olayıyla, istekli dostlar |
| Holy Aura | 8 | KISMİ | Fiend/Undead vurana CON save ya da Blinded yansıması yok |
| Gate | 9 | ÇALIŞMIYOR | çağırma (portal) yok |
| Meteor Swarm | 9 | KISMİ | Dört 40 ft küre yerine bir küre (büyü tek hedef altıgeni alır); yapay zekâ en kalabalık noktayı seçer |

### Bütün büyüler

| Büyü | Sv | Dosya | Tür | Sınıf | Neden / not |
|---|---|---|---|---|---|
| Acid Splash | 0 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Chill Touch | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Dancing Lights | 0 | spells.json | zone | KISMİ | Dört ışık yerine tek ışık noktası (çevresiyle 10 ft); taşıma bonus eylemle bir yaratığın altıgenine; insan biçimi yok |
| Druidcraft | 0 | spells.json | utility | SAVAŞ DIŞI | Hava tahmini, çiçek açtırma, duyusal etki; hasar ya da durum yok |
| Eldritch Blast | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Elementalism | 0 | spells.json | utility | SAVAŞ DIŞI | Seçilen küçük element etkisini uygula; hasar ya da durum yok |
| Fire Bolt | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Guidance | 0 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Light | 0 | spells.json | effect | KISMİ | Nesne yerine bir yaratık (büyücü ya da dost) taşır; yalnızca parlak ışık (20 ft = 4 altıgen), loş ışık ayrı değil; ışık yalnızca karanlık/gece haritalarında etkili |
| Mage Hand | 0 | spells.json | utility | SAVAŞ DIŞI | Hayali el 30 ft içinde nesne taşır (10 pound); saldıramaz, büyülü eşya etkinleştiremez |
| Mending | 0 | spells.json | utility | SAVAŞ DIŞI | Dokunulan nesnedeki tek kırık ya da yırtık onarılır (en çok 1 ft); büyülü eşyanın büyüsü geri gelmez. |
| Message | 0 | spells.json | utility | SAVAŞ DIŞI | Büyücü 120 ft içindeki bir yaratığa fısıltıyla ileti gönderir; yalnızca hedef duyar ve fısıltıyla yanıt verebilir. |
| Minor Illusion | 0 | spells.json | utility | ÇALIŞMIYOR | yanılsama örtüsü yok |
| Poison Spray | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Prestidigitation | 0 | spells.json | utility | SAVAŞ DIŞI | Seçilen küçük etkiyi uygula; hasar ya da durum yok |
| Produce Flame | 0 | spells.json | attack | KISMİ | SRD: alev bonus eylemle yaratılır, Magic eylemiyle 60 ft fırlatılır; oyunda yaratıp fırlatmak tek bonus eylem |
| Ray of Frost | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Resistance | 0 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Sacred Flame | 0 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Shillelagh | 0 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Shocking Grasp | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Sorcerous Burst | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Spare the Dying | 0 | spells.json | revive | ÇALIŞIR | olaylar: life_restored |
| Starry Wisp | 0 | spells.json | attack | KISMİ | Işık ve görünmezlik engeli sonraki turun sonuna dek (büyücünün sonraki turunun sonu yerine) |
| Thaumaturgy | 0 | spells.json | utility | SAVAŞ DIŞI | Seçilen küçük etkiyi uygula; Booming Voice Intimidation avantajı verir |
| True Strike | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Vicious Mockery | 0 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Alarm | 1 | spells.json | utility | SAVAŞ DIŞI | Kurulumda: 20 ft küp alana 8 saatlik alarm; büyücünün belirlemediği yaratık girerse zihinsel ya da sesli uyarı. |
| Animal Friendship | 1 | spells.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Bane | 1 | spells.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Bless | 1 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Burning Hands | 1 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Charm Person | 1 | spells.json | effect | KISMİ | dostluk tutumu ve sosyal avantaj yok |
| Chromatic Orb | 1 | spells.json | attack | KISMİ | Sıçrama: aynı iki hasar zarında 30 ft içindeki en yakın düşmana yeni saldırı, slot seviyesi kadar (hedef seçimi yapay zekâda en yakın) |
| Color Spray | 1 | spells.json | save | KISMİ | Kör kalma etkinin süresiyle (iki tur sınırı; büyücünün sonraki turunun sonu yerine) |
| Command | 1 | spells.json | effect | KISMİ | Drop: elde tutulan bırakılmaz (silah bırakma modeli yok), yalnızca turunu kaybeder; Approach ve Flee yürüyüşten sonra turu biter |
| Comprehend Languages | 1 | spells.json | utility | SAVAŞ DIŞI | Duyduğu ve dokunduğu yazıdaki dilleri anlar (1 saat) |
| Create or Destroy Water | 1 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 10 galon su yaratır (ya da yağmur) veya 30 ft küpteki açık suyu ya da sisi yok eder. |
| Cure Wounds | 1 | spells.json | heal | ÇALIŞIR | olaylar: healed |
| Detect Evil and Good | 1 | spells.json | utility | SAVAŞ DIŞI | 30 ft içindeki bu türlerin yerini ve türünü oyunculara söyle |
| Detect Magic | 1 | spells.json | utility | SAVAŞ DIŞI | 30 ft içindeki büyülü yaratık ve nesneleri ve okullarını oyunculara söyle |
| Detect Poison and Disease | 1 | spells.json | utility | SAVAŞ DIŞI | 30 ft içindeki zehir, zehirli yaratık ve hastalıkları söyle |
| Disguise Self | 1 | spells.json | utility | ÇALIŞMIYOR | görünüm değişimi (gizlenme) yok |
| Dissonant Whispers | 1 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Divine Favor | 1 | spells.json | buff | ÇALIŞIR | olaylar: buff_added |
| Divine Smite | 1 | spells.json | smite | ÇALIŞIR | olaylar: attack_resolved |
| Ensnaring Strike | 1 | spells.json | smite | KISMİ | Kurtulma eylemle STR (Athletics) kontrolü yerine tur başı hasardan sonra STR save; yalnızca bu tur yakın dövüş isabeti |
| Entangle | 1 | spells.json | save | KISMİ | Kurtulma eylemle STR (Athletics) kontrolüyle; bitki sarmaşığının bitişik altıgenlere yayılması yok |
| Expeditious Retreat | 1 | spells.json | effect | KISMİ | Her turun bonus eylemle Dash'i yerine hız iki katı (bonus eylem harcanmaz) |
| Faerie Fire | 1 | spells.json | save | KISMİ | Nesneler işaretlenmez; saldıranın hedefi görmesi ayrıca denetlenmez; ışık (10 ft) yalnızca karanlık/gece haritalarında |
| False Life | 1 | spells.json | effect | ÇALIŞIR | olaylar: temp_hp |
| Feather Fall | 1 | spells.json | utility | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Find Familiar | 1 | spells.json | summon | ÇALIŞIR | koşullu: ritüel: kurulumda |
| Floating Disk | 1 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 500 pound taşıyan disk büyücüyü izler |
| Fog Cloud | 1 | spells.json | zone | KISMİ | Rüzgârla dağılma yok |
| Goodberry | 1 | spells.json | utility | ÇALIŞMIYOR | meyveyle bonus eylem iyileştirme yok |
| Grease | 1 | spells.json | zone | ÇALIŞIR | olaylar: zone_created, save_resolved |
| Guiding Bolt | 1 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Healing Word | 1 | spells.json | heal | ÇALIŞIR | olaylar: healed |
| Hellish Rebuke | 1 | spells.json | save | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Heroism | 1 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Hex | 1 | spells.json | mark | KISMİ | Seçilen yeteneğin kontrollerinde dezavantaj yok (savaşta kontrol azdır) |
| Hideous Laughter | 1 | spells.json | effect | KISMİ | Prone kendi başına kaldırılamaz kuralı ayrıca denetlenmez (Incapacitated kalkmayı zaten engeller) |
| Hunter's Mark | 1 | spells.json | mark | ÇALIŞIR | koşullu: etki konsantrasyonda (işaret) |
| Ice Knife | 1 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved, save_resolved |
| Identify | 1 | spells.json | utility | SAVAŞ DIŞI | Dokunulan büyülü eşyanın özellikleri, kullanımı, uyum gerekip gerekmediği ve üzerindeki büyüler söylenir. |
| Illusory Script | 1 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: yalnızca belirlenen yaratıkların okuyabildiği gizli yazı (10 gün); diğerleri anlamsız görür. |
| Inflict Wounds | 1 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Jump | 1 | spells.json | effect | KISMİ | Turda bir 30 ft düz atlama 10 ft (2 altıgen) harcar, aradaki tek engel altıgeninin (hendek, sütun) üstünden geçer (Görev K9c); yüksek atlama yok |
| Longstrider | 1 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Mage Armor | 1 | spells.json | effect | KISMİ | Hedefin zırh giyip giymediği denetlenmez (temel AC zaten yüksekse etkisiz) |
| Magic Missile | 1 | spells.json | auto | ÇALIŞIR | olaylar: attack_resolved |
| Protection from Evil and Good | 1 | spells.json | buff | KISMİ | Ele geçirme (possession) yok; zaten Charmed/Frightened olana yeni save avantajı yok |
| Purify Food and Drink | 1 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 5 ft küredeki yiyecek ve içecek zehirsiz olur |
| Ray of Sickness | 1 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Sanctuary | 1 | spells.json | effect | KISMİ | Başarısız save'de saldırı ya da büyü boşa gider (yeni hedef seçme yok; büyü yuvası harcanmaz); alan etkileri ve fırsat saldırısı dışı yollar etkilenmez |
| Searing Smite | 1 | spells.json | smite | ÇALIŞIR | olaylar: attack_resolved, effect_added |
| Shield | 1 | spells.json | utility | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Shield of Faith | 1 | spells.json | buff | ÇALIŞIR | koşullu: etki konsantrasyonda (ward) |
| Silent Image | 1 | spells.json | utility | ÇALIŞMIYOR | yanılsama yok |
| Sleep | 1 | spells.json | save | KISMİ | İkinci başarısız save'de Unconscious (Görev WIZARD); hasar alınca uyanır; yanındakinin eylemle uyandırması yok |
| Speak with Animals | 1 | spells.json | utility | SAVAŞ DIŞI | Beast'lerle konuşma (10 dakika) |
| Thunderwave | 1 | spells.json | save | ÇALIŞIR | olaylar: save_resolved, pushed |
| Unseen Servant | 1 | spells.json | utility | SAVAŞ DIŞI | Hizmetkâr basit işler yapar; saldıramaz |
| Acid Arrow | 2 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved, effect_added |
| Aid | 2 | spells.json | effect | ÇALIŞIR | olaylar: hp_boosted |
| Alter Self | 2 | spells.json | effect | KISMİ | Yalnızca Natural Weapons (hasar türü Bludgeoning kalır); Aquatic Adaptation ve Change Appearance savaş dışı (Game Master) |
| Animal Messenger | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: Tiny Beast ileti taşır |
| Arcane Lock | 2 | spells.json | utility | ÇALIŞMIYOR | kapı kilitleme yok |
| Arcanist's Magic Aura | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: algılama büyülerini yanıltır |
| Augury | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 30 dakika içindeki bir eylem için iyi, kötü, iyi ve kötü ya da hiçbiri yanıtını Game Master verir. |
| Barkskin | 2 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Blindness/Deafness | 2 | spells.json | save | KISMİ | Seçim komutta (choice); arayüzde ve yapay zekâda Blinded. Deafened yalnızca sözlü buyrukları (Command, Suggestion) engeller |
| Blur | 2 | spells.json | effect | KISMİ | Blindsight/Truesight ile görenler için istisna yok |
| Calm Emotions | 2 | spells.json | effect | KISMİ | Dostlara save yok (isteyerek başarısız sayılır); var olan Charmed/Frightened bastırılmaz, kalkar; kayıtsızlık "her turunu kaybeder" olarak |
| Continual Flame | 2 | spells.json | effect | KISMİ | Nesne yerine bir yaratık taşır; yalnızca parlak ışık (20 ft); süre savaş boyunca |
| Darkness | 2 | spells.json | zone | KISMİ | Nesneye bağlı yürüyen karanlık yok; Blindsight/Truesight yok; Darkvision bu alanı göremez ve ışık aydınlatamaz (karanlık/gece haritasında), her haritada yoğun örtü |
| Darkvision | 2 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Detect Thoughts | 2 | spells.json | utility | SAVAŞ DIŞI | Seçilen yaratığın yüzeysel düşüncelerini söyle; derin sondada WIS save |
| Dragon's Breath | 2 | spells.json | save | KISMİ | Nefesi dokunulan dost yerine büyücü verir; tür seçimi yapılırken (nefeste Fire); yukarı slot zarı uygulanmaz |
| Enhance Ability | 2 | spells.json | effect | KISMİ | Kontroller savaşta az (İt, Gizlen, kurtulma) |
| Enlarge/Reduce | 2 | spells.json | effect | KISMİ | Boyut yalnızca jeton etiketi (mekanik tek altıgen); STR kontrolleri ve nesneler yok |
| Enthrall | 2 | spells.json | utility | ÇALIŞMIYOR | Algı dezavantajı yok |
| Find Steed | 2 | spells.json | summon | ÇALIŞIR | olaylar: summoned |
| Find Traps | 2 | spells.json | utility | ÇALIŞMIYOR | tuzak bulma yok (tuzak sistemi var) |
| Flame Blade | 2 | spells.json | attack | KISMİ | Kılıç el boşluğu denetlenmez; bırakıp yeniden çağırma yok; saldırı "Büyüyü sürdür" (eylem) ile |
| Flaming Sphere | 2 | spells.json | summon | KISMİ | Engellerin üstünden atlama ve ışık yok; çarpma yalnızca taşımanın sonunda bitişik yaratığa |
| Gentle Repose | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: ceset bozulmaz, dirilme süresi uzar |
| Gust of Wind | 2 | spells.json | save | KISMİ | Çizgide tur bitirene tekrar save ve hareket maliyeti yok; tekrar yeni bir esinti olarak |
| Heat Metal | 2 | spells.json | auto | KISMİ | Her yaratık metal taşıyor sayılır; silahı bırakma seçeneği yok, kontrol dezavantajı yok |
| Hold Person | 2 | spells.json | save | ÇALIŞIR | olaylar: save_resolved, condition_changed |
| Invisibility | 2 | spells.json | effect | KISMİ | Saldırı ve büyüyle biter; saldırısız hasar verince (aura, alan) bitmez |
| Knock | 2 | spells.json | utility | ÇALIŞMIYOR | kilitli kapı/sandık açma yok (nesne kilidi var) |
| Lesser Restoration | 2 | spells.json | cure | ÇALIŞIR | olaylar: condition_changed |
| Levitate | 2 | spells.json | effect | KISMİ | Yükseklik modeli yok: havadaki yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c) ama yürüyemez; 20 ft yükselme ve duvardan itinerek hareket yok; nesneye… |
| Locate Animals or Plants | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 5 mil içindeki en yakın türün yönü ve uzaklığı |
| Locate Object | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 1000 ft içindeki nesnenin yönü |
| Magic Mouth | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: nesneye 25 sözcüklük bir ileti bağlanır; belirlenen tetik gerçekleşince söylenir. |
| Magic Weapon | 2 | spells.json | buff | KISMİ | Büyücünün kendi silahlarına uygulanır |
| Mind Spike | 2 | spells.json | save | KISMİ | Hedefin yerini her zaman bilme (gizlenme/görünmezlik) yok |
| Mirror Image | 2 | spells.json | effect | KISMİ | Blindsight/Truesight ayrımı yok (yalnızca Blinded saldıran etkilenmez) |
| Misty Step | 2 | spells.json | teleport | ÇALIŞIR | olaylar: teleported |
| Moonbeam | 2 | spells.json | save | KISMİ | Taşıma 60 ft yerine büyü menzili içinde bir yaratığın altıgenine; biçim değiştirenlere ek etki yok; silindir yüksekliği yok |
| Pass without Trace | 2 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Phantasmal Force | 2 | spells.json | effect | KISMİ | Yanılsamanın biçimi ve konumu yok: her turda hasar verir; Study eylemiyle (Investigation) kurtulma yok |
| Prayer of Healing | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı (10 dakika): en çok 5 dost kısa dinlenme etkisi alır ve 2d8 + büyü değiştiricisi HP; karakter listesinde elle uygulanır. |
| Protection from Poison | 2 | spells.json | effect | KISMİ | Poisoned'a karşı save avantajı yok |
| Ray of Enfeeblement | 2 | spells.json | effect | KISMİ | STR saldırısı yakın dövüş saldırısı sayılır (Finesse ve fırlatma ayrımı yok) |
| Rope Trick | 2 | spells.json | utility | ÇALIŞMIYOR | boyut cebine saklanma yok |
| Scorching Ray | 2 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| See Invisibility | 2 | spells.json | effect | KISMİ | Ethereal Plane görüşü yok |
| Shatter | 2 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Shining Smite | 2 | spells.json | smite | ÇALIŞIR | olaylar: attack_resolved |
| Silence | 2 | spells.json | zone | KISMİ | Tepki büyüleri (Shield, Counterspell) sessizlikte denetlenmez; Deafened durumu verilmez (Thunder bağışıklığı var) |
| Spider Climb | 2 | spells.json | effect | KISMİ | Yükseklik modeli yok: tırmanma hızı haritadaki yükseklik farkı maliyetini kaldırır (Görev K9c); duvar/tavanda durma yok |
| Spike Growth | 2 | spells.json | auto | KISMİ | Gizlenmiş (fark edilmemiş) alan kuralı yok: herkes alanı görür |
| Spiritual Weapon | 2 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Suggestion | 2 | spells.json | effect | KISMİ | Öneri iki seçenekle: savaşı bırak (her turunu kaybeder) ya da uzaklaş (her tur kaçar); serbest metinli öneriler Game Master'a; duyma/anlama denetimi yok |
| Warding Bond | 2 | spells.json | effect | KISMİ | Hedefe +1 AC, +1 save, bütün hasar türlerine direnç; aldığı hasar kadar büyücüye (her komuttan sonra); büyücü 0 HP ya da 60 ft'ten uzak olunca biter. Hedefin kendisine y… |
| Web | 2 | spells.json | save | KISMİ | Tutunma yeri kuralı (çökme) ve yanma yok; hafif örtünün oyunda etkisi yok |
| Zone of Truth | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 15 ft yarıçaplı alanda CHA save başarısız olan yaratık bile bile yalan söyleyemez (10 dakika). |
| Animate Dead | 3 | spells.json | summon | KISMİ | Döküm süresi 1 dakika olduğu için yalnızca kurulumda; bonus eylemle komut yerine sahibinin ardından kendisi oynar |
| Beacon of Hope | 3 | spells.json | effect | KISMİ | Hedef sayısı 6 (SRD: menzildeki istenen sayıda yaratık); en yüksek iyileştirme yalnızca büyü iyileştirmesinde |
| Bestow Curse | 3 | spells.json | effect | KISMİ | Dört seçenek: yetenek (seçilen yetenekte save dezavantajı; kontrol dezavantajı yok), lanetleyene saldırılar dezavantajlı, tur başı WIS save ya da eylem yok, lanetleyenin… |
| Blink | 3 | spells.json | effect | KISMİ | Tur sonu d20 11+: sonraki turunun başına dek Ethereal (hedef alınamaz, alan ve saldırılardan etkilenmez); dönüşte aynı altıgen (10 ft içinde yer seçimi yok) |
| Call Lightning | 3 | spells.json | save | KISMİ | Fırtınada ek zar yok; tekrarın noktası bir yaratığın altıgeni |
| Clairvoyance | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 1 mil içinde bilinen bir yerde görünmez göz ya da kulak (10 dakika, konsantrasyon). |
| Conjure Animals | 3 | spells.json | summon | KISMİ | Sürü büyücüyle birlikte değil, sahibinin bonus eylemiyle 30 ft taşınır; büyücünün STR save avantajı yok; sürü bir altıgen kaplar |
| Counterspell | 3 | spells.json | utility | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Create Food and Water | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 45 pound yiyecek ve 30 galon su |
| Daylight | 3 | spells.json | zone | KISMİ | Nesneye bağlı yürüyen ışık yok; ek 60 ft loş ışık yok; gün ışığına duyarlı yaratık kuralları yok |
| Dispel Magic | 3 | spells.json | dispel | KISMİ | Yaratıktaki süren büyü etkileri, büyüyle çağrılmış yaratık, silahtaki büyü güçlendirmesi (Magic Weapon, Divine Favor) ve altıgen hedefte büyü alanları; slotun üstündeki… |
| Fear | 3 | spells.json | save | KISMİ | Tekrar save her tur sonunda (SRD: yalnızca büyücüyü göremezken); elindekini düşürme yok; kaçınca turu biter |
| Fireball | 3 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Fly | 3 | spells.json | effect | KISMİ | Yükseklik modeli yok: uçan yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c); uçuş bitince düşme hasarı uygulanmaz |
| Gaseous Form | 3 | spells.json | effect | KISMİ | Yükseklik farkı maliyetini ve zemin engelini yok sayar (uçuş 10 ft; Görev K9c); dar aralıklardan geçme yok (harita altıgen) |
| Glyph of Warding | 3 | spells.json | utility | SAVAŞ DIŞI | Kurulumda (1 saat): işaret tetiklenince patlar (20 ft küre, DEX save, 5d8 seçilen tür) ya da içine saklanan büyüyü yapar; Game Master elle uygular. |
| Haste | 3 | spells.json | effect | KISMİ | Ek eylem asıl eylemden sonra alınır; Utilize yok |
| Hypnotic Pattern | 3 | spells.json | save | KISMİ | Sarsarak uyandırma (eylemle) yok; hasarla ve konsantrasyonla biter |
| Lightning Bolt | 3 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Magic Circle | 3 | spells.json | utility | SAVAŞ DIŞI | Kurulumda (1 dakika): 10 ft yarıçaplı silindir; seçilen türler (Celestial, Elemental, Fey, Fiend, Undead) içeri giremez, içerdekilere saldırıları dezavantajlı. Game Mast… |
| Major Image | 3 | spells.json | utility | ÇALIŞMIYOR | yanılsama (örtü/dikkat dağıtma) yok |
| Mass Healing Word | 3 | spells.json | heal | ÇALIŞIR | olaylar: healed |
| Meld into Stone | 3 | spells.json | utility | ÇALIŞMIYOR | taşa girip gizlenme yok |
| Nondetection | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: hedef 8 saat kehanet büyüleri ve büyülü gözetleme sensörleriyle algılanamaz. |
| Phantom Steed | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı (1 dakika): yolculuk için hayalet at (1 saat, hız 100 ft); savaşta binek kuralı yok. |
| Plant Growth | 3 | spells.json | zone | KISMİ | Alandan bölge çıkarma yok; Enrichment (8 saat) savaşta yok |
| Protection from Energy | 3 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Remove Curse | 3 | spells.json | dispel | KISMİ | Yalnızca Bestow Curse etkisi kalkar (Hex büyücünün konsantrasyonunda kalır; lanetli eşya yok) |
| Revivify | 3 | spells.json | revive | ÇALIŞIR | olaylar: life_restored |
| Sending | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: ileti ve 25 sözcüklük yanıt |
| Sleet Storm | 3 | spells.json | zone | KISMİ | Silindir küre sayılır (yükseklik yok); alevlerin sönmesi yok |
| Slow | 3 | spells.json | effect | KISMİ | 40 ft küp yerine seçilen hedefler; büyü yapmadaki gecikme (d20) yok |
| Speak with Dead | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: cesede 5 soru |
| Speak with Plants | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 30 ft içindeki bitkiler büyücüyle konuşur ve sınırlı bilgi verir; bitkisel zorlu araziyi açabilir (Game Master). |
| Spirit Guardians | 3 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Stinking Cloud | 3 | spells.json | save | KISMİ | Eylem ve bonus eylem kaybı Incapacitated ile (tepki de gider); rüzgârla dağılma yok |
| Tiny Hut | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı (1 dakika, ritüel): 10 ft kubbe 8 saat; dışarıdaki yaratık ve büyüler geçemez. Dinlenme sırasında kullanılır. |
| Tongues | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: her dili anlar ve konuşur (1 saat) |
| Vampiric Touch | 3 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved, healed |
| Water Breathing | 3 | spells.json | utility | SAVAŞ DIŞI | Su altında nefes alma (24 saat); haritada derin su kuralları değişmez |
| Water Walk | 3 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Wind Wall | 3 | spells.json | zone | KISMİ | Duvar düz ya da büyücünün çevresinde yay (serbest çizim yok); dev kayaları ayrımı yok; sis dağıtma yok |
| Arcane Eye | 4 | spells-45.json | utility | SAVAŞ DIŞI | Görünmez göz 30 ft karanlık görüşle keşif (1 saat) |
| Aura of Life | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Banishment | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Black Tentacles | 4 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created, zone_triggered, save_resolved, effect_added |
| Blight | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved |
| Charm Monster | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Compulsion | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Confusion | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Conjure Minor Elementals | 4 | spells-45.json | buff | ÇALIŞIR | olaylar: buff_added, zone_created |
| Conjure Woodland Beings | 4 | spells-45.json | save | ÇALIŞIR | olaylar: effect_added, save_resolved |
| Control Water | 4 | spells-45.json | utility | ÇALIŞMIYOR | veride savaş dışı; Kuyruk 19 girdap kodu var ama yapımda olay üretmedi |
| Death Ward | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Dimension Door | 4 | spells-45.json | teleport | ÇALIŞIR | olaylar: teleported |
| Divination | 4 | spells-45.json | utility | SAVAŞ DIŞI | Bir hedef/olay hakkında doğru bir cevap (ritüel) |
| Dominate Beast | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Fabricate | 4 | spells-45.json | utility | SAVAŞ DIŞI | Ham maddeden nesne (10 dakika) |
| Faithful Hound | 4 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created |
| Fire Shield | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Freedom of Movement | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Giant Insect | 4 | spells-45.json | summon | ÇALIŞIR | olaylar: summoned |
| Greater Invisibility | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Guardian of Faith | 4 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created |
| Hallucinatory Terrain | 4 | spells-45.json | utility | SAVAŞ DIŞI | 150 ft küp arazi yanılsaması (24 saat) |
| Ice Storm | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, zone_created |
| Locate Creature | 4 | spells-45.json | utility | SAVAŞ DIŞI | 1000 ft içinde tanıdık yaratığın yönü (1 saat) |
| Phantasmal Killer | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Polymorph | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added, shape_changed, temp_hp |
| Private Sanctum | 4 | spells-45.json | utility | SAVAŞ DIŞI | 100 ft küp korunaklı alan (24 saat) |
| Resilient Sphere | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Secret Chest | 4 | spells-45.json | utility | SAVAŞ DIŞI | Sandığı Ethereal Plane'de saklar |
| Stone Shape | 4 | spells-45.json | utility | ÇALIŞMIYOR | duvar/geçit şekillendirme yok |
| Stoneskin | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Vitriolic Sphere | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Wall of Fire | 4 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created, zone_triggered, save_resolved |
| Animate Objects | 5 | spells-45.json | summon | ÇALIŞIR | olaylar: summoned |
| Antilife Shell | 5 | spells-45.json | zone | ÇALIŞIR | olaylar: zone_created |
| Arcane Hand | 5 | spells-45.json | summon | ÇALIŞIR | olaylar: summoned |
| Awaken | 5 | spells-45.json | utility | SAVAŞ DIŞI | Bitki ya da hayvana zekâ verir (8 saat) |
| Cloudkill | 5 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created, zone_triggered, save_resolved |
| Commune | 5 | spells-45.json | utility | SAVAŞ DIŞI | Tanrıya üç evet/hayır sorusu (ritüel) |
| Commune with Nature | 5 | spells-45.json | utility | SAVAŞ DIŞI | Çevredeki arazi bilgisi (ritüel) |
| Cone of Cold | 5 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Conjure Elemental | 5 | spells-45.json | summon | ÇALIŞIR | olaylar: summoned, zone_created |
| Contact Other Plane | 5 | spells-45.json | utility | SAVAŞ DIŞI | Başka düzlemden beş soru (ritüel; INT save) |
| Contagion | 5 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Creation | 5 | spells-45.json | utility | SAVAŞ DIŞI | Gölge maddesinden nesne (1 dakika) |
| Dispel Evil and Good | 5 | spells-45.json | buff | ÇALIŞIR | koşullu: etki konsantrasyonda (ward) |
| Dominate Person | 5 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Dream | 5 | spells-45.json | utility | SAVAŞ DIŞI | Uykudaki hedefe rüya mesajı |
| Flame Strike | 5 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved |
| Geas | 5 | spells-45.json | utility | SAVAŞ DIŞI | Hedefe uzun süreli emir (30 gün) |
| Greater Restoration | 5 | spells-45.json | cure | ÇALIŞIR | olaylar: exhaustion_changed |
| Hallow | 5 | spells-45.json | utility | SAVAŞ DIŞI | Kutsal alan (24 saat) |
| Hold Monster | 5 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, condition_changed |
| Insect Plague | 5 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created, zone_triggered, save_resolved |
| Legend Lore | 5 | spells-45.json | utility | SAVAŞ DIŞI | Efsane bilgisi |
| Mass Cure Wounds | 5 | spells-45.json | heal | ÇALIŞIR | olaylar: healed |
| Mislead | 5 | spells-45.json | effect | ÇALIŞIR | olaylar: zone_created, effect_added |
| Modify Memory | 5 | spells-45.json | utility | SAVAŞ DIŞI | Son 24 saatin anısını değiştirir |
| Passwall | 5 | spells-45.json | utility | ÇALIŞMIYOR | duvarda geçit açma yok (tile_changed ile) |
| Planar Binding | 5 | spells-45.json | utility | SAVAŞ DIŞI | Çağrılan yaratığı hizmete bağlar |
| Raise Dead | 5 | spells-45.json | utility | SAVAŞ DIŞI | 10 günden kısa süredir ölü yaratığı diriltir (1 saat) |
| Reincarnate | 5 | spells-45.json | utility | SAVAŞ DIŞI | Ölüyü yeni bedende diriltir (1 saat) |
| Scrying | 5 | spells-45.json | utility | SAVAŞ DIŞI | Uzaktaki hedefi gözetler (10 dakika) |
| Seeming | 5 | spells-45.json | utility | SAVAŞ DIŞI | Yaratıkların görünüşünü değiştirir (8 saat) |
| Summon Dragon | 5 | spells.json | summon | ÇALIŞIR | olaylar: summoned |
| Telekinesis | 5 | spells-45.json | save | ÇALIŞIR | olaylar: map_note, pushed, effect_added, map_effect |
| Telepathic Bond | 5 | spells-45.json | utility | SAVAŞ DIŞI | Sekiz yaratık arası telepati (ritüel) |
| Teleportation Circle | 5 | spells-45.json | utility | SAVAŞ DIŞI | Kalıcı çembere ışınlanma (1 dakika) |
| Tree Stride | 5 | spells-45.json | teleport | ÇALIŞIR | koşullu: ağaç yanı gerekir; A2 G2 (sürüm 30) ikinci ağaca ışınlanma düzeltmesi |
| Wall of Force | 5 | spells-45.json | zone | ÇALIŞIR | olaylar: zone_created, pushed |
| Wall of Stone | 5 | spells-45.json | zone | ÇALIŞIR | olaylar: zone_created, pushed, map_note |
| Blade Barrier | 6 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Chain Lightning | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Circle of Death | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Conjure Fey | 6 | spells-69.json | save | KISMİ | Fey ruhu ayrı yaratık değil: yapımda ve sonraki turlarda bonus eylemle bir düşmana büyü saldırısı (3d12 Psychic) ve WIS save ya da Frightened |
| Contingency | 6 | spells-69.json | utility | SAVAŞ DIŞI | Koşula bağlı büyü saklar (10 gün) |
| Create Undead | 6 | spells-69.json | utility | SAVAŞ DIŞI | Geceleyin cesetlerden Ghoul yaratır (1 dakika döküm) |
| Disintegrate | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved, map_effect |
| Eyebite | 6 | spells-69.json | save | ÇALIŞIR | A1 hedef denetimi düzeldi; A2 G4: Asleep hasarla biter, Panicked her tur Dash ile kaçar (yoklama: save_resolved, effect_added) |
| Find the Path | 6 | spells-69.json | utility | SAVAŞ DIŞI | Bir yere en kısa yolu sezer (1 gün) |
| Flesh to Stone | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Forbiddance | 6 | spells-69.json | utility | SAVAŞ DIŞI | Bölgeye ışınlanmayı yasaklar (1 gün) |
| Freezing Sphere | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Globe of Invulnerability | 6 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Guards and Wards | 6 | spells-69.json | utility | SAVAŞ DIŞI | Bir yapıyı korur (24 saat) |
| Harm | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved, max_hp_drained |
| Heal | 6 | spells-69.json | heal | ÇALIŞIR | A1 düzeltti: sabit 70 iyileştirme + Blinded/Deafened/Poisoned biter (yoklama: healed) |
| Heroes’ Feast | 6 | spells-69.json | utility | SAVAŞ DIŞI | Ziyafet (1 saat): 24 saat Poisoned ve Frightened bağışıklığı, +2d10 HP |
| Instant Summons | 6 | spells-69.json | utility | SAVAŞ DIŞI | Nesneyi çağırır |
| Irresistible Dance | 6 | spells-69.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Magic Jar | 6 | spells-69.json | utility | SAVAŞ DIŞI | Ruh kaba geçer (savaş dışı hazırlık) |
| Mass Suggestion | 6 | spells-69.json | effect | KISMİ | Öneri savaşta "dur" olarak |
| Move Earth | 6 | spells-69.json | utility | SAVAŞ DIŞI | Toprağı şekillendirir (10 dakikada bir) |
| Planar Ally | 6 | spells-69.json | utility | SAVAŞ DIŞI | Varlıktan yardım ister (pazarlık) |
| Programmed Illusion | 6 | spells-69.json | utility | SAVAŞ DIŞI | Tetiklenen yanılsama |
| Sunbeam | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Transport via Plants | 6 | spells-69.json | utility | ÇALIŞMIYOR | ağaçtan ağaca geçiş yok |
| True Seeing | 6 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Wall of Ice | 6 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created, pushed |
| Wall of Thorns | 6 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Wind Walk | 6 | spells-69.json | utility | SAVAŞ DIŞI | Bulut biçiminde yolculuk (8 saat) |
| Word of Recall | 6 | spells-69.json | utility | ÇALIŞMIYOR | kaçış ışınlanması yok |
| Arcane Sword | 7 | spells-69.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Conjure Celestial | 7 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Delayed Blast Fireball | 7 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Divine Word | 7 | spells-69.json | utility | ÇALIŞIR | olaylar: map_effect, effect_added |
| Etherealness | 7 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Finger of Death | 7 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved, summoned |
| Fire Storm | 7 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Forcecage | 7 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Magnificent Mansion | 7 | spells-69.json | utility | SAVAŞ DIŞI | Boyut ötesi konak (24 saat) |
| Mirage Arcane | 7 | spells-69.json | utility | SAVAŞ DIŞI | Arazi yanılsaması (10 gün) |
| Plane Shift | 7 | spells-69.json | effect | KISMİ | İstemsiz hedef: melee büyü saldırısı + CHA save; başka düzleme gider (savaş boyunca sürgün) |
| Prismatic Spray | 7 | spells-69.json | utility | ÇALIŞIR | olaylar: map_effect |
| Project Image | 7 | spells-69.json | utility | ÇALIŞMIYOR | yansıma yok |
| Regenerate | 7 | spells-69.json | utility | SAVAŞ DIŞI | 1 minute döküm: savaştan önce yapılır |
| Resurrection | 7 | spells-69.json | revive | SAVAŞ DIŞI | Bir yüzyıla kadar ölü yaratığı diriltir (1 saat) |
| Reverse Gravity | 7 | spells-69.json | utility | ÇALIŞIR | olaylar: map_effect, effect_added |
| Sequester | 7 | spells-69.json | utility | SAVAŞ DIŞI | Nesne/istekli yaratık saklanır |
| Simulacrum | 7 | spells-69.json | utility | SAVAŞ DIŞI | Kopya yaratık (12 saat döküm) |
| Symbol | 7 | spells-69.json | utility | SAVAŞ DIŞI | Tetiklenen glif (1 dakika döküm; tuzak olarak Game Master yerleştirir) |
| Teleport | 7 | spells-69.json | utility | ÇALIŞMIYOR | savaştan kaçış ışınlanması yok (K53 teleport ile) |
| Animal Shapes | 8 | spells-69.json | effect | KISMİ | Polymorph biçim olayıyla, istekli dostlar |
| Antimagic Field | 8 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Antipathy/Sympathy | 8 | spells-69.json | utility | SAVAŞ DIŞI | Yer/nesne itme-çekme (10 gün) |
| Befuddlement | 8 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Clone | 8 | spells-69.json | utility | SAVAŞ DIŞI | Yedek beden |
| Control Weather | 8 | spells-69.json | utility | SAVAŞ DIŞI | Hava durumu (8 saat) |
| Demiplane | 8 | spells-69.json | utility | SAVAŞ DIŞI | Yarı düzleme kapı |
| Dominate Monster | 8 | spells-69.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Earthquake | 8 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Glibness | 8 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Holy Aura | 8 | spells-69.json | effect | KISMİ | Fiend/Undead vurana CON save ya da Blinded yansıması yok |
| Incendiary Cloud | 8 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Maze | 8 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Mind Blank | 8 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Power Word Stun | 8 | spells-69.json | utility | ÇALIŞIR | olaylar: condition_changed |
| Sunburst | 8 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Tsunami | 8 | spells-69.json | utility | SAVAŞ DIŞI | 1 minute döküm: savaştan önce yapılır |
| Astral Projection | 9 | spells-69.json | utility | SAVAŞ DIŞI | Astral yolculuk |
| Foresight | 9 | spells-69.json | utility | SAVAŞ DIŞI | 1 minute döküm: savaştan önce yapılır |
| Gate | 9 | spells-69.json | utility | ÇALIŞMIYOR | çağırma (portal) yok |
| Imprisonment | 9 | spells-69.json | utility | SAVAŞ DIŞI | 1 minute döküm: savaştan önce yapılır |
| Mass Heal | 9 | spells-69.json | utility | ÇALIŞIR | olaylar: healed |
| Meteor Swarm | 9 | spells-69.json | save | KISMİ | Dört 40 ft küre yerine bir küre (büyü tek hedef altıgeni alır); yapay zekâ en kalabalık noktayı seçer |
| Power Word Heal | 9 | spells-69.json | utility | ÇALIŞIR | olaylar: healed |
| Power Word Kill | 9 | spells-69.json | utility | ÇALIŞIR | olaylar: map_effect |
| Prismatic Wall | 9 | spells-69.json | zone | ÇALIŞIR | olaylar: zone_created, pushed |
| Shapechange | 9 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added, shape_changed, temp_hp |
| Storm of Vengeance | 9 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Time Stop | 9 | spells-69.json | utility | ÇALIŞIR | olaylar: time_stop |
| True Polymorph | 9 | spells-69.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added, shape_changed, temp_hp |
| True Resurrection | 9 | spells-69.json | revive | SAVAŞ DIŞI | 200 yıla kadar ölüyü tam diriltir (1 saat) |
| Weird | 9 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Wish | 9 | spells-69.json | utility | ÇALIŞIR | koşullu: kopyalanacak büyü seçimi gerekir |

## Bölüm 6: zemin ve alan türleri

Görsel katmanları: (1) harita arka plan görseli (zemin harfleri çizimin kendisi), (2) `SurfaceLayer` sprite'ları (`data/sprite-esleme.json` `zones`; listede yoksa **yer tutucu**: `--zone` renginde altıgen + ikon, `.spell-zone`), (3) E1 FX katmanı `groundFx` (`data/efekt-baglama.json`: `aura` yaratığa bağlı alan/aura etkisi, `duvar` engel ve duvar büyüsü), (4) harita efekt katmanı (`EffectsLayer`, varyantta `effects`: yağmur, kar, sis…), (5) `heightShow` tonu ve rampa okları, gizlenme bölgesi gösterimi.

### 6a. Zemin harfleri (`src/map/terrain.ts`, 34 tür)

Hepsinin görseli harita görselinin kendisi; zemine bağlı ayrı efekt sprite'ı **yok**. İstisnalar: `j` gizli tuzak (bulununca işaret; bulunmadan çizilmez), `e` ışıklı kristal ve ışık listesi (`litHexes`) yalnızca karanlık katmanını etkiler, `Y` yürüyen merdiven (varyant görseli).

| Harf | Ad | Hareket | Kural |
|---|---|---|---|
| `.` | Açık zemin | normal | — |
| `d` | Kum tepesi | normal | — |
| `r` | Kaya kümesi | difficult | shade |
| `c` | Ayakta sütun | blocked | shade |
| `k` | Yıkık sütun | difficult | shade |
| `t` | Taşlık | difficult | — |
| `H` | Yüksek bazalt | normal | — |
| `~` | Lav | deadly | — |
| `f` | Alev | normal | hazard |
| `#` | Dış kayalık | blocked | outOfBounds |
| `s` | Duvar | blocked | blocksSight |
| `h` | Yükseltili zemin | normal | — |
| `z` | Zirve, kule üstü | normal | — |
| `u` | Uçurum, yarık | blocked | flyersPass |
| `i` | Buz | normal | ice |
| `q` | Kar | difficult | — |
| `a` | Ağaç | blocked | blocksSight |
| `g` | Çalılık, sazlık | difficult | — |
| `v` | Sarkıt, dikit | blocked | — |
| `e` | Işıklı kristal | blocked | light |
| `n` | Sığ su, çamur | difficult | — |
| `b` | Derin batak | normal | bog |
| `w` | Derin su | difficult | deepWater |
| `C` | Çukur (kayalık boşluk) | difficult | pitFall |
| `p` | Tahta zemin, kaldırım, köprü | normal | — |
| `m` | Direk, sütun, çeşme | blocked | — |
| `x` | Varil, sandık, masa | difficult | — |
| `o` | Kapı, geçit | normal | — |
| `O` | Kapalı kapı | blocked | blocksSight |
| `l` | Alçak basamak | normal | stairs |
| `y` | Yüksek basamak, sahanlık | normal | stairs |
| `j` | Gizli tuzak | normal | trap, hidden |
| `Y` | Yürüyen merdiven | normal | stairs |
| `R` | Coşkun nehir | blocked | flyersPass |

### 6b. Yüzeyler (`data/yuzeyler.json` `kinds`)

| Yüzey | Görsel |
|---|---|
| oil | sprite `yuzey-yag-1` (yag, anim shimmer) |
| water | sprite `yuzey-su-1` (su, anim shimmer) |
| ice | sprite `yuzey-buz-1` (buz, anim shimmer) |
| fire | sprite `yuzey-alev-1` (alev, anim flicker) |
| burningWeb | sprite `yuzey-alev-1` (alev, anim flicker) |
| steam | sprite `yuzey-buhar-1` (buhar, anim drift) |
| slick | sprite `yuzey-gres-1` (gres, anim shimmer) |
| poison | sprite `yuzey-zehir-1` (zehir, anim drift) |
| warning | **yok** (yer tutucu altıgen; çığ/sel uyarısı) |
| patlama (tepkime) | sprite `yuzey-patlama` (tek seferlik) |

### 6c. Büyü alanları (38 büyü: `mechanics.zone`, `lingering`, `buffZone`)

| Büyü | Sv | İkon | Görsel |
|---|---|---|---|
| Dancing Lights | 0 | ✨ | **yer tutucu** (renkli altıgen + ikon) |
| Entangle | 1 | 🌿 | **yer tutucu** (renkli altıgen + ikon) |
| Fog Cloud | 1 | 🌫 | sprite (sis) |
| Grease | 1 | 🛢 | sprite (gres) |
| Darkness | 2 | 🌑 | **yer tutucu** (renkli altıgen + ikon) |
| Flaming Sphere | 2 | 🔥 | FX aura (yaratığa bağlı alan) + yer tutucu |
| Moonbeam | 2 | 🌙 | **yer tutucu** (renkli altıgen + ikon) |
| Silence | 2 | 🔇 | **yer tutucu** (renkli altıgen + ikon) |
| Spike Growth | 2 | 🌵 | **yer tutucu** (renkli altıgen + ikon) |
| Spiritual Weapon | 2 |  | **yok** (haritada temsil yok) |
| Web | 2 | 🕸 | sprite (ag) |
| Conjure Animals | 3 | 🐺 | FX aura (yaratığa bağlı alan) + yer tutucu |
| Daylight | 3 | ☀ | **yer tutucu** (renkli altıgen + ikon) |
| Plant Growth | 3 | 🌱 | **yer tutucu** (renkli altıgen + ikon) |
| Sleet Storm | 3 | 🌨 | **yer tutucu** (renkli altıgen + ikon) |
| Spirit Guardians | 3 |  | **yok** (konsantrasyon aurası; FX bağlı değil) |
| Stinking Cloud | 3 | 🤢 | sprite (zehir) |
| Wind Wall | 3 | 💨 | FX duvar `duvar-kuvvet` |
| Black Tentacles | 4 | 🐙 | **yer tutucu** (renkli altıgen + ikon) |
| Conjure Minor Elementals | 4 | 🌀 | FX aura (yaratığa bağlı alan) + yer tutucu |
| Conjure Woodland Beings | 4 |  | **yok** (konsantrasyon aurası; FX bağlı değil) |
| Faithful Hound | 4 | 🐕 | **yer tutucu** (renkli altıgen + ikon) |
| Guardian of Faith | 4 | 🛡 | **yer tutucu** (renkli altıgen + ikon) |
| Wall of Fire | 4 | 🔥 | FX duvar `duvar-ates` |
| Antilife Shell | 5 | ✺ | **yer tutucu** (renkli altıgen + ikon) |
| Cloudkill | 5 | ☠ | **yer tutucu** (renkli altıgen + ikon) |
| Conjure Elemental | 5 | 🌀 | FX aura (yaratığa bağlı alan) + yer tutucu |
| Insect Plague | 5 | 🦟 | **yer tutucu** (renkli altıgen + ikon) |
| Wall of Force | 5 | ▦ | FX duvar `duvar-kuvvet` |
| Wall of Stone | 5 | 🧱 | **yer tutucu** (renkli altıgen + ikon) |
| Blade Barrier | 6 | ⚔ | **yer tutucu** (renkli altıgen + ikon) |
| Wall of Ice | 6 | 🧊 | FX duvar `duvar-buz` |
| Wall of Thorns | 6 | 🌿 | **yer tutucu** (renkli altıgen + ikon) |
| Conjure Celestial | 7 | ✨ | **yer tutucu** (renkli altıgen + ikon) |
| Earthquake | 8 | 🌋 | **yer tutucu** (renkli altıgen + ikon) |
| Incendiary Cloud | 8 | 🔥 | **yer tutucu** (renkli altıgen + ikon) |
| Prismatic Wall | 9 | 🌈 | **yer tutucu** (renkli altıgen + ikon) |
| Storm of Vengeance | 9 | ⛈ | **yer tutucu** (renkli altıgen + ikon) |

Özet: 38 alanın 4'ü sprite'lı (Web, Fog Cloud, Grease, Stinking Cloud), 4'ü FX duvarlı, 4'ü FX auralı; **26'sının özel görseli yok** (yer tutucu ya da hiç).

### 6d. Geçici engeller, auralar ve diğerleri

| Tür | Kaynak | Görsel |
|---|---|---|
| Çizili Duvar `cizili-duvar` | Harita Öğretisi (K53 engel) | FX duvar `duvar-cizili` (ton + kontur) |
| Dost Kalkanı `dost-kalkani` | K53 engel | **yok** (yer tutucu) |
| Enkaz Yığını `enkaz-yigini` | K53 nesne itme/enkaz | **yok** (yer tutucu); çarpma anında `carpma-enkaz` |
| Aura etkisi (`effect.aura`, K53) | Paladin auraları, imza auraları, canavar auraları | FX aura: hasar türüne göre `aura-kirmizi`/`aura-buz`, düşmanlara `aura-kirmizi`, yoksa `aura-altin` |
| Büyülü karanlık / ışık | Darkness, Daylight, Light… | karanlık katmanı (görüş), ayrıca sprite yok |
| Harita kuralı alanları | sel uyarısı (`warning`), çığ, sis/kar havası, rüzgâr | uyarı yer tutucu; hava `EffectsLayer` (`fog`, `snow`, `sandstorm`…) |
| Nesneler (26 tür, `data/nesneler.json`) | fıçı, sandık, kapı, ağaç, köprü… | yalnızca `oilBarrel`, `powderKeg` sprite'lı (`nesne-varil`, `nesne-barut-varili`); 24'ü emoji ikon |

## Bölüm 7: sonuç tabloları

### 7a. Çizilecek jetonlar (arketip bazında)

| # | Jeton | Arketip | Boyut | Kullanan | Görünüm notu |
|---|---|---|---|---|---|
| 1 | Ateş küresi | element | S | Flaming Sphere | yüzen alev topu, yüzü yok; şu an magmin |
| 2 | Hayalet tazı | kurt/köpek | M | Faithful Hound (+ ek Gölge Tazısı türetmesi) | yarı saydam mavi-gri spektral köpek |
| 3 | Canlanmış nesne | golem/yapay | M (L/H ölçekle) | Animate Objects | bacaklı sandık/masa; şu an animated-armor |
| 4 | Ruhani silah | diğer: büyülü silah | M (Small olabilir) | Spiritual Weapon | havada süzülen ışık-mavi topuz/kılıç; önce konumlu savaşçı olmalı |
| 5 | Kuvvet kılıcı | diğer: büyülü silah | M | Arcane Sword | mor kuvvet kılıcı; önce konumlu savaşçı olmalı |
| 6 | Kuvvet eli | diğer: büyülü el | L | Arcane Hand | saydam mor dev el (yumruk/açık) |
| 7 | Muhafız | melek | L | Guardian of Faith, Conjure Celestial | altın zırhlı, kılıçlı, yüzü gölgeli göksel muhafız |
| 8 | Fey ruhu | peri | M | Conjure Fey (+ ek peri) | boynuzlu/kanatlı yeşil-mor peri |
| 9 | Dokunaç | diğer: dokunaç | alan (her altıgen) ya da M | Black Tentacles (+ ek Dokunaç) | yerden çıkan kara dokunaçlar; alan sprite'ı olarak |

Türetmeler (yeni çizim yok; veride seçime göre `avatar` + CSS filtre): Draconic Spirit × 5 (wyrmling renkleri), Elemental Spirit × 4 (air/earth/fire/water-elemental), Giant Insect × 3 (spider/centipede/wasp), Otherworldly Steed × 3 (tür halkası), Spirit Pack (dire-wolf + ruh), familiar × 3 tür filtresi, Animated Object L/H, Animate Trees → awakened-tree. Motor tarafında gereken tek iş: `summons.json`'a seçime göre görsel alanı (ör. `avatarByChoice`) ve `summonCreature` içinde okunması.

### 7b. Görseli olmayan zemin/alan türleri

- Zemin harfleri (34): hepsi harita görselinde; ayrı efekt gerekmez.
- Yüzey: `warning` (sel/çığ uyarısı).
- Büyü alanları (26): Dancing Lights, Entangle, Darkness, Moonbeam, Silence, Spike Growth, Spiritual Weapon, Daylight, Plant Growth, Sleet Storm, Spirit Guardians, Black Tentacles, Conjure Woodland Beings, Faithful Hound, Guardian of Faith, Antilife Shell, Cloudkill, Insect Plague, Wall of Stone, Blade Barrier, Wall of Thorns, Conjure Celestial, Earthquake, Incendiary Cloud, Prismatic Wall, Storm of Vengeance.
- Engeller: Dost Kalkanı, Enkaz Yığını.
- Nesneler: 24 tür emoji ikonla (sprite yok).

### 7c. KISMİ/ÇALIŞMIYOR büyülerin ortak eksik mekanikleri (P0 ilkel adayları)

| # | İlkel | Büyüler | Sayı |
|---|---|---|---|
| 1 | Yanılsama nesnesi (görüş keser, geçilir, Study/Investigation ile bozulur; K53 geçici engel `blocksSight` üstüne) | Minor Illusion, Silent Image, Major Image, Phantasmal Force, Project Image, Disguise Self | 6 |
| 2 | Dikey hareket ve yükseklik katmanı bağı (K26 `heights` ile tırmanma/uçuş/atlama, düşme, silindir yüksekliği) | Jump, Spider Climb, Levitate, Fly, Gaseous Form, Flaming Sphere (atlama), Moonbeam, Sleet Storm | 8 |
| 3 | Nesneye bağlı / taşınan ışık-karanlık ve loş ışık | Light, Continual Flame, Daylight, Darkness, Dancing Lights, Faerie Fire | 6 |
| 4 | Duyu ayrımı (Blindsight, Truesight, Ethereal görüş, konum bilme) | Blur, Mirror Image, Darkness, See Invisibility, Mind Spike | 5 |
| 5 | Elde tutulan eşya modeli (silah bırakma/düşürme, metal taşıma, zırh denetimi, el boşluğu, Finesse/fırlatma) | Command (Drop), Fear, Heat Metal, Mage Armor, Flame Blade, Magic Weapon, Ray of Enfeeblement | 7 |
| 6 | Alan şekli ve hareketi (rüzgârla dağılma, serbest çizim, çok noktalı alan, alan yerine küp, alandan bölge çıkarma) | Fog Cloud, Stinking Cloud, Wind Wall, Meteor Swarm, Slow, Plant Growth, Gust of Wind, Web (çökme/yanma) | 8 |
| 7 | Kontrol çözülmesi (eylemle Athletics kurtulma, eylemle uyandırma, ikinci aşama) | Ensnaring Strike, Entangle, Sleep, Hypnotic Pattern, Hideous Laughter | 5 |
| 8 | Süre bitişi "büyücünün sonraki turunun sonu" | Starry Wisp, Color Spray | 2 |
| 9 | Eylem ekonomisi ayrıntısı (yarat + Magic ile fırlat, bonus Dash, Utilize, "sürdür" eylemi) | Produce Flame, Expeditious Retreat, Haste, Flame Blade | 4 |
| 10 | Sosyal tutum ve serbest buyruk (dostluk, öneri metni, duyma/anlama, Algı dezavantajı) | Charm Person, Suggestion, Mass Suggestion, Calm Emotions, Enthrall | 5 |
| 11 | Harita/nesne değiştirme (kilit, tuzak bulma, `tile_changed` geçit/duvar, su seviyesi, taşa girme) | Arcane Lock, Knock, Find Traps, Stone Shape, Passwall, Control Water, Meld into Stone | 7 |
| 12 | Savaştan çıkış / harita dışı (kaçış ışınlanması, cep boyut, portal çağrısı) | Teleport, Word of Recall, Transport via Plants, Rope Trick, Gate, Plane Shift | 6 |
| 13 | Çağrının ayrı ve konumlu yaratık olması / büyücüyle yürüme / bonus eylem emri | Conjure Animals, Conjure Fey, Animate Dead, (ÇALIŞIR ama jetonsuz: Spiritual Weapon, Arcane Sword) | 5 |
| 14 | Yeniden hedefleme (saldırı/büyünün yeni hedefe yönelmesi, sıçrama hedefi seçimi) | Sanctuary, Chromatic Orb | 2 |
| 15 | Boyut değişiminin mekaniği (multiHex ve STR kontrolleri) | Enlarge/Reduce, Alter Self | 2 |
| 16 | Yetenek kontrolü yüzeyi (kontrol dezavantajı/avantajı, Poisoned save avantajı) | Hex, Enhance Ability, Bestow Curse, Protection from Poison | 4 |
| 17 | Büyü kaldırma kapsamı (eşya büyüleri, konsantrasyondaki işaret) | Dispel Magic, Remove Curse | 2 |
| 18 | Ele geçirme (possession) ve vurana yansıma | Protection from Evil and Good, Holy Aura | 2 |
| 19 | Sarf eşyası olarak büyü ürünü (`consumables` + `use_item`) | Goodberry | 1 |
| 20 | Tek tek kalanlar | Beacon of Hope (hedef sayısı), Blink (yer seçimi), Dragon's Breath (dokunulan dost), Call Lightning (fırtına), Spike Growth (gizli alan), Silence (tepki büyüleri), Blindness/Deafness, Invisibility (saldırısız hasar), Animal Shapes, Continual Flame süresi | 10 |

### 7d. A2'de kalan 17 canavar kalemi × büyü ilkelleri

| Canavar kalemi | Eksik | Büyülerle ortak ilkel |
|---|---|---|
| stirge:Proboscis, darkmantle:Crush, cloaker:Attach | yapışma (attach): hedefle birlikte hareket, her tur hasar, eylemle sökme; Cloaker hasar paylaşımı | **evet**: hasar paylaşımı Warding Bond `bondEvents`; birlikte hareket Arcane Hand Grasping / Conjure Elemental tutsak (`captive`) / yakalama sürüklemesi |
| wererat, werewolf, wereboar, weretiger, werebear: Bite (5) | likantrop laneti: 0 HP'de dönüşüp taraf değiştirme | **evet**: taraf değiştirme `allegianceSwap` (Dominate), dönüşüm `shape_changed` (Polymorph), kalıcı lanet Bestow Curse / Remove Curse |
| ghost:Possession | ele geçirme: bedenin kontrolü | **evet**: `allegianceSwap` (Dominate Person/Monster), Protection from Evil and Good'un eksik "possession" kısmı, Dispel Evil and Good, Magic Jar (savaş dışı) |
| aboleth:Dominate Mind | kalıcı zihin kontrolü + telepati, ölüm/uzaklık koşulu | **evet**: `allegianceSwap` (Dominate Monster) + süren etki koşulu |
| barbed-devil, horned-devil: Hurl Flame | giyilmeyen yanıcı nesneyi hedefleme | **evet**: büyü tarafında var (`freeHexTarget`, `ignite.ts` `fireHexProblem`, `cast_spell.targetHex`); canavar saldırısına taşınması gerek |
| sprite:Heart Sight, incubus:Restless Touch, rakshasa:Cursed Touch, otyugh:Bite, vampire:Bite (5) | savaş dışı (duygu bilgisi, dinlenme yararı, gömülme sonrası) | kısmen: HP maksimumu azalması savaş içinde büyüde var (`max_hp_drained`, Harm/Vampiric); dinlenme yasağı Contagion'un savaş dışı kısmıyla aynı tür |

Kısmi bağlanan 14 kalemin kalanlarında da ortak yol var: boğulma (Rug of Smothering, Water Elemental, Gelatinous Cube; büyüde karşılığı yok, Control Water ile yeni ilkel), sözlü bileşen yasağı (Invisible Stalker Vortex, Gelatinous Cube → Silence `noVerbal` hazır), birlikte taşınma/yutma (Shambling Mound, Gelatinous Cube, Djinni Whirlwind → Conjure Elemental tutsağı, A2 Swallow), "hareket ya da eylem" kısıtı (Ice Devil → Slow `slowed`), yürütme + şarkı konsantrasyonu (Harpy → Command `compelEvents`), hedeflenebilir parça AC/HP (Erinyes ipi, Roper dokunacı → K53 engel `hp/ac` altıgen başına).

Özet: 17 kalemin **12'si** (yapışma 3, likantrop 5, ele geçirme 1, zihin kontrolü 1, Hurl Flame 2) büyülerle ortak bir ilkel paylaşıyor; 5'i savaş dışı.
