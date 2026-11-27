# KATALOG-F2: Kadim Yaratıklar ve Mücevher Ejderhası

Kaynak: "Dice & Hex — Kadim Yaratıklar ve Mücevher Ejderhası Kataloğu" PDF (11 sayfa; depo dışı, `docs/katalog/`).
Üretici: `node scripts/katalog-f2-kadim.mjs` (tek kaynak; tekrar çalıştırılabilir). Çıktılar:

- `data/canavarlar-kadim.json`: 20 `Monster` kaydı (yeni alan yok) ve yan tablolar: `dex` (tür, hizalanma, durum bağışıklığı),
  `yer` (tema "Kadim Yaratıklar"), `ozellikler` (Dungeondex özellik/eylem listesi), `ekler` (saldırı ekleri), `hatlar`.
- `data/aciklamalar-tr-canavar.json`, `data/aciklamalar-en-canavar.json`: 141 özellik/eylem açıklaması (yalnız bu kimlikler).
- `data/efsanevi.json`: 9 efsanevi eylem kaydı (yalnız bu kimlikler).

`data/monsters.json` değişmedi. Kayıtlar `loadMonsters()` ile ayrı dizide (`kadimMonsters`) gelir: Dungeondex'te görünür,
`getMonster` bulur, Game Master seçicisinde yoktur. Görsel yok (görseller Gemini bekliyor); avatar alanı boş, Dungeondex
vitrini "yedek" glifini gösterir.

Sığmayan mekanikler: `KATALOG-SIGMAYAN.md`. Kararlar: `DECISIONS.md` "Görev KATALOG-F2".

## Kayıtlar

Sayım: PDF 21 blok diyor; kayıt 20. Faz 2'ler (Anka +450, Yıldız-Kâbusu +550) ayrı stat bloğu değil, aynı kayıtta `faz2` bloğu.

| Kimlik | Ad (EN) | PDF adı | Boyut | CR | AC | HP | Rol |
|---|---|---|---|---|---|---|---|
| `continent-dragon` | Continent Dragon | Kıta Ejderhası — Versiyon I | Gargantuan | 31 | 25 | 740 | düşman |
| `ancient-continent-spirit` | Ancient Continent Spirit | Kadim Kıta Ruhu — Versiyon II | Gargantuan | 40 | 30 | 1850 | müttefik/koruyucu, sim hedefi değil |
| `cosmic-phoenix` | Cosmic Phoenix | Kozmik Anka Kuşu | Huge | 32 | 26 | 780 (+450) | müttefik |
| `ember-egg` | Ember Egg | Kozmik Kor Yumurtası | Medium* | 0* | 22 | 150 | Anka'nın dirilişi |
| `abyssal-star-nightmare` | Abyssal Star-Nightmare | Uçurumun Yıldız-Kâbusu | Gargantuan | 35 | 26 | 1150 (+550) | final bossu |
| `<hat>-jewel-dragon-wyrmling` | `<Hat>` Jewel Dragon Wyrmling | Yavru | Medium | 6–10* | 17–19* | 120–170* | yoldaş |
| `young-<hat>-jewel-dragon` | Young `<Hat>` Jewel Dragon | Genç binek | Large | 15–20 | 19–21 | 240–340 | binek |
| `adult-<hat>-jewel-dragon` | Adult `<Hat>` Jewel Dragon | Yetişkin efsanevi yoldaş | Huge | 25–30 | 22–25 | 480–650 | yoldaş |

\* türetildi (PDF vermiyor).

## Ad uyarlamaları (korumalı adlar)

Ticari marka ve D&D'ye özgü adlar veriye ve açıklamaya girmez; test (`src/data/katalogF2.test.ts`) tarar.

| PDF | Bizim |
|---|---|
| Kıta Ejderhası (V1) | Continent Dragon |
| Kadim Kıta Ruhu (V2) | Ancient Continent Spirit |
| V2'nin kuyruk saldırısı (PDF'te esin kaynağı adıyla) | Continent Tail (Kıta Kuyruğu) |
| V2'nin nefesi (PDF'te esin kaynağı adıyla) | Continent Judgment Breath (Kıta Hükmü Nefesi) |
| V2'nin ölçek özelliği (PDF'te esin kaynağı adıyla) | Continent Scale (Kıta Ölçeği) |
| Uçurumun Yıldız-Kâbusu (PDF alt başlığında esin kaynağı adıyla) | Abyssal Star-Nightmare |
| Mücevher ejderhası türleri (PDF'te D&D türleri) | Jewel Dragon, beş hat (aşağıda) |
| "Safir Ejderhası Rezonansı" (Kraken) | Alpha Resonance (Alfa hattı) |
| Alfa pasifinde "Uzay/Far Realm yaratıkları" | uzay kökenli (Aberration) yaratıklar |
| Kozmik Anka Kuşu | Cosmic Phoenix |
| Kozmik Kor Yumurtası | Ember Egg |

Türkçe özellik adları İngilizceye çevrildi (SD4): Mahmurluk Perdesi → Veil of Slumber, Zırhın Psikolojik İhaneti → Armor's Betrayal,
On Taş Rezonansı → Ten-Stone Resonance, Ezici Varlık → Crushing Presence, Ezici Kıta Varlığı → Crushing Continental Presence,
Kanat Fırtınası → Wing Storm, Mühür Çekimi → Seal Pull, On Mühür Çekirdeği → Ten-Seal Core, Zaman-Dışı Fırtına Hâkimiyeti →
Timeless Storm Dominion, Büyü Yansıtan Kristal Kabuk → Spell-Reflecting Crystal Shell, Karanlığı Söken Mühür → Curse-Breaking Seal,
Tektonik Kayma → Tectonic Shift, Yıldırım Mızrağı Yağmuru → Lightning Spear Rain, On Mühür Patlaması → Ten-Seal Burst,
Kozmik Yıldız Alevi → Cosmic Starfire, Perdeyi ve Uykuyu Yakan Hale → Halo That Burns Veil and Slumber, Avcı ile Ruh Bağı → Soul Bond
with the Hunter, Küllerden Yeniden Doğuş → Rebirth from Ashes, Köz Kanat Çırpışı → Ember Wingbeat, Mühür Eriten Pençe → Seal-Melting
Talon, Yıldız Gözyaşı → Star Tear, Akıl Bükücü Varlık → Mind-Bending Presence, Uykudaki Tanrının Uyanışı → Awakening of the Sleeping
God, Rüya Çağrısı → Dream Call. PDF'teki İngilizce adlar aynen (Bite, Claw, Tail, Continent Roar Breath, World-Breaker Bite,
Continent-Shaper Claws, Cosmic Beak, Starfire Talons, Celestial Glide, Eldritch Tentacle, Cosmic Fling, Void-Lightning Strike,
Abyssal Swallow, Maddening Gaze, Eldritch Storm Bolt, Abyssal Toxic Ink).

## Mücevher hatları

Kullanıcı kararı: hat adları bizim. **Nefes türü tek yerde**: betikteki `HATLAR` sabiti (`hasar`); değiştirip betiği yeniden
çalıştırmak kayıtları, bağışıklığı, nefes adını ve açıklamaları günceller. Omega, Sigma, Gamma türleri **öneridir** (`oneri: true`).

| Hat | Taş | Nefes türü | Hizalanma | Baskın | PDF satırı |
|---|---|---|---|---|---|
| Alfa (`alpha`) | Safir | thunder | Lawful Neutral (Savaş / Strateji) | STR + CON | Gök Gürültüsü |
| Omega (`omega`) | Yakut | necrotic (öneri) | Chaotic Neutral (Entropi / Yalnızlık) | CON + CHA | Nekrotik |
| Delta (`delta`) | Zümrüt | psychic | Lawful Neutral (Gizem / Kontrol) | INT + WIS | Psişik |
| Sigma (`sigma`) | Altın | radiant (öneri) | Chaotic Neutral (Umut / Özgürlük) | CHA + DEX | Parlaklık |
| Gamma (`gamma`) | Gümüş | force (öneri) | True Neutral (Kozmik Denge) | WIS + INT | Güç |

Genç ve Yetişkin AC/HP/nefes (DC, zar, koni boyu, ek etki) PDF'ten birebir. CR sırası PDF satır sırasıyla: Sigma 15/25,
Omega 16/26, Delta 17/27, Alfa 18/28, Gamma 20/30.

## Türetilen değerler

PDF'in vermediği değerler SRD 5.2.1 ejderha kalıbından (Young/Adult Dragon stat blokları) türetildi. Kayıtta `unsupported`
satırı "Türetilen değerler…" bunları sayar.

### Mücevher ejderhası (15 blok)

| Değer | Kural | Örnek |
|---|---|---|
| Yetenek puanları | Evre tabanı (Yavru 19/12/17/12/12/14, Genç 23/12/21/14/13/17, Yetişkin 27/14/25/16/15/21; STR/DEX/CON/INT/WIS/CHA) + hattın 1. baskın niteliği +4, 2. baskın +2 (en çok 30) | Yetişkin Alfa STR 30, CON 27 |
| Yeterlilik | CR tablosu (CR 6–8 +3 … 29–30 +9) | Genç Delta (CR 17) +6 |
| Rend | SRD kalıbı: üç Rend (Multiattack); zar Yavru 2d6, Genç 2d8, Yetişkin 2d10 + STR; isabet = yeterlilik + STR; erişim Yavru 5, Genç/Yetişkin 10 ft | Genç Alfa +14, 2d8 + 8 |
| Hız | 40 ft, uçuş 80 ft | — |
| Duyu | Karanlık görüş 120 ft (Blindsight yok) | — |
| Kurtarma | DEX ve WIS yetkin | Yetişkin Sigma DEX +11, WIS +10 |
| Beceri | Perception = WIS + 2 × yeterlilik, Stealth = DEX + yeterlilik | — |
| Bağışıklık | kendi nefes türü | Delta: psychic |
| Nefes | Recharge 5–6, başarıda yarı hasar | — |
| Yetişkin | Legendary Resistance 3/gün; efsanevi eylem Pounce (PDF "Efsanevi 3 puan" diyor, eylem vermiyor) | — |
| Boyut | Yavru 1×1 Medium, Genç 2×2 Large, Yetişkin "Gargantuan 3×3" → Huge (7 altıgen) | — |
| Yavru (tamamı) | CR 6–10 hat sırasıyla; AC = Genç AC − 2; HP = Genç HP / 2 (5'e yuvarlı); nefes 30 ft koni, zar = Genç zar sayısı − 3 (d8), DC = 8 + yeterlilik + CON; ek etki Genç'inki | Yavru Gamma CR 10, AC 19, 170 HP, 9d8, DC 15 |

### Kadim yaratıklar

| Kayıt | Türetilen |
|---|---|
| Continent Dragon | Bite/Claw erişimi 15 ft (Tail 25 ft PDF'ten); Crushing Presence alanı 60 ft (PDF menzil vermiyor); Wing Storm'da yarı hasar yok (PDF söylemiyor) |
| Ancient Continent Spirit | World-Breaker Bite / Claws erişimi 20 ft, Continent Tail 30 ft; Crushing Continental Presence alanı 60 ft; Lightning Spear Rain "4 altıgen" → 10 ft küre, 120 ft menzil |
| Cosmic Phoenix | Gaga/pençe erişimi 10 ft; Ember Wingbeat için DC 27 DEX kurtarma, yarı hasar (PDF kurtarma vermiyor; Celestial Glide DC'si) |
| Ember Egg | boyut Medium, CR 0, yetenek puanları (STR 1, DEX 1, CON 24, INT 1, WIS 10, CHA 10), ateş/ışıltı bağışıklığı, durum bağışıklıkları, hız 0 |
| Abyssal Star-Nightmare | Abyssal Swallow menzili 45 ft (dokunaç erişimi) |
| Hepsi | inisiyatif DEX değiştiricisi (PDF vermiyor); Perception = pasif Algı − 10 (PDF'ten) |
