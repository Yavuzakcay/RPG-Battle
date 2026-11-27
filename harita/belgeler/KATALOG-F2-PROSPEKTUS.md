# KATALOG-F2: Kadim Yaratıklar ve mücevher ejderhaları

**Tek kaynak:** `harita/belgeler/KATALOG-F2-OZELLIKLER.md` (onaylı; PDF ile çelişirse belge kazanır). PDF depo dışı (`docs/katalog/`).
Üretici: `node scripts/katalog-f2-kadim.mjs` (tek kaynak kod; tekrar çalıştırılabilir; `-- --turetilen` türetilen saldırı tablosunu basar).

Çıktılar:

- `data/canavarlar-kadim.json`: 24 `Monster` kaydı, Mühür Ruhu kayıtlarıyla aynı katalog alanları (`creatureType`, `swim`,
  `kaynak: katalog-f2`, saldırı ekleri `riders`). Yan tablolar: `dex` (tür, hizalanma, durum bağışıklığı, tırmanma, süzülme, yön,
  gizli varyant), `dexGizli`, `yer` (tema "Kadim Yaratıklar"), `ozellikler` (Dungeondex özellik/eylem listesi), `hatlar`.
- `data/aciklamalar-tr-canavar.json`, `data/aciklamalar-en-canavar.json`: 231 özellik/eylem açıklaması (yalnız bu kimlikler; SRD 1318 anahtar aynı).
- `data/efsanevi.json`: 13 efsanevi eylem kaydı. `data/dungeondex-gorsel-esleme.json`: 22 yedek satırı ("görsel hazırlanıyor").

`data/monsters.json` değişmez. Kayıtlar `loadMonsters()` ile Mühür Ruhu'yla aynı `katalogMonsters` dizisine girer; `getMonster` bulur;
Game Master seçicisinde yoktur. Dungeondex'te 22 kayıt (gizli varyantlar `dragon-of-hexonia-b`, `kozmik-anka-savas` yok); kartta hız
satırı uçuş, yüzme, tırmanma ve süzülmeyi, "Kaplama" satırı altıgen sayısını gösterir.

Sığmayanlar: `KATALOG-SIGMAYAN.md` "KATALOG-F2". Kararlar: `DECISIONS.md` "KATALOG-F2-DUZELT".

## Kayıtlar

| Kimlik | Ad (EN) | Boyut | CR | AC | HP | Rol |
|---|---|---|---|---|---|---|
| `tutsak-dragon` | Captive Dragon | Gargantuan (19) | 30 | 24 | 697 | düşman |
| `dragon-of-hexonia-a` | Dragon of Hexonia | Gargantuan (19) | 40 | 30 | 2500 | yalnız dost; sağa bakar |
| `dragon-of-hexonia-b` | Dragon of Hexonia | Gargantuan (19) | 40 | 30 | 2500 | yalnız dost; sola bakar; Dungeondex'te gizli varyant |
| `kozmik-anka` | Cosmic Phoenix | Huge (7) | 32 | 26 | 780 (+450 Faz 2) | müttefik |
| `kozmik-anka-savas` | Cosmic Phoenix | Huge (7) | 32 | 26 | 780 (+450 Faz 2) | aynı değerler; Dungeondex'te gizli savaş varyantı |
| `ember-egg` | Ember Egg | Medium* | 0* | 22 | 150 | Anka'nın dirilişi; kırılırsa Anka ölür |
| `ocean-nightmare` | Ocean-Nightmare | Gargantuan (19) | 30 | 24 | 700 | Faz 1 (gemi); 0 HP'de gemi batar |
| `ocean-nightmare-open-sea` | Ocean-Nightmare (Open Sea) | Gargantuan (19) | 30 | 24 | 600 | Faz 2 (açık deniz); 0 HP'de ölmez |
| `titan-of-nightmare` | Titan of Nightmare | Gargantuan (19) | 35 | 26 | 1150 | Faz 3 (ada); tek can çubuğu; yarı canda The Sleeper Awakens |
| `sigmlet` / `sigmyr` / `sigmadrake` | Sigmlet / Sigmyr / Sigmadrake | M / L / H | 5 / 16 / 25 | 16 / 19 / 22 | 120 / 296 / 480 | mücevher, Sigma (altın) |
| `omeglet` / `omegyr` / `omegadrake` | Omeglet / Omegyr / Omegadrake | M / L / H | 6 / 17 / 26 | 16 / 19 / 23 | 135 / 311 / 515 | mücevher, Omega (kırmızı) |
| `deltlet` / `deltyr` / `deltadrake` | Deltlet / Deltyr / Deltadrake | M / L / H | 6 / 18 / 27 | 17 / 20 / 23 | 140 / 326 / 545 | mücevher, Delta (yeşil) |
| `alphlet` / `alphyr` / `alphadrake` | Alphlet / Alphyr / Alphadrake | M / L / H | 7 / 19 / 28 | 17 / 20 / 24 | 155 / 341 / 585 | mücevher, Alfa (mavi) |
| `gamlet` / `gammyr` / `gammadrake` | Gamlet / Gammyr / Gammadrake | M / L / H | 8 / 20 / 30 | 18 / 21 / 25 | 175 / 356 / 650 | mücevher, Gamma (gümüş) |

\* türetildi (belge vermiyor).

## Ad kuralları

- Ticari marka, D&D'ye özgü ad ve PDF'in esin kaynağı adları veriye, açıklamaya, test ve dosya adlarına girmez; eski "Continent Dragon",
  "Jewel Dragon" ve "Gem Dragon" adları kalktı. Tarama: `src/data/katalogF2.test.ts` `PROTECTED`.
- Belgedeki yeniden adlandırmalar: Continent Tail, Continent Judgment Breath, Continent Scale.
- Belgedeki "Sapphire Resonance" → **Alpha Resonance** (taş adı yasak; kullanıcı onayı).
- Mücevher açıklamalarında taş adı yok; hat adı ve rengi kullanılır (Alfa mavi, Omega kırmızı, Delta yeşil, Sigma altın, Gamma gümüş).
- Adlar İngilizce (SD4), açıklamalar Türkçe.

## Mücevher hatları

**Nefes türü tek yerde:** betikteki `HATLAR.<hat>.hasar`. Evre değerleri (CR, AC, HP, nefes DC/zar, Yavru dahil) belge §6 tablosundan
birebir; hızlar görev metninden. Yavru 30 ft, Genç 60 ft, Yetişkin 90 ft koni.

| Hat | Renk | Nefes | Tip | Hız (Yavru / Genç / Yetişkin, ft) | Kanat |
|---|---|---|---|---|---|
| Alfa (`alpha`) | mavi | thunder | deniz ejderi, Amphibious, Sea Camouflage | yürüme 20/30/30, yüzme 60/80/90 | yok (Body Sweep) |
| Omega (`omega`) | kırmızı | necrotic | kara ejderi | yürüme 40/40/50, tırmanma 30/40/40 | yok (Body Sweep) |
| Delta (`delta`) | yeşil | psychic | Doğu ejderi, Wingless Flight | yürüme 30, uçuş (hover) 60/80/100 | yok (Body Sweep) |
| Sigma (`sigma`) | altın | radiant | gök ejderi | yürüme 30/40/40, uçuş 60/80/80 | var (Wing Buffet) |
| Gamma (`gamma`) | gümüş | force | gök ejderi | yürüme 30/40/40, uçuş 60/80/80 | var (Wing Buffet) |

Genç: Mount Bond (belgedeki bağ metni). Yetişkin: Attribute 20 Lock (belgedeki pasif), 2 efsanevi eylem hakkı (SRD 5.2.1: her eylem 1 hak; KATALOG-LA-SRD:
belgedeki 3 puanın bedelli hasarına (Tail 1, Body Sweep/Wing Buffet 2, Elemental Pulse 2) ±%15 içinde eş olsun diye 3 → 2). Ertelenenler: yumurta kuluçka sistemi, Taşıyıcı'ya göre Save DC, Mühür taşları.

## Türetilen değerler

### Mücevher saldırıları (Mühür Ruhu yöntemi)

KATALOG-F-TASARIM §4 gibi DMG 2014 "Monster Statistics by CR" tablosu: saldırı bonusu tablodan; tur hasarı bandının orta noktasının
**%60'ı** yakın dövüşe (kalanı nefes ve efsanevi eylem). Multiattack = Bite + 2 Claw. Bite payı %40 (üçte biri hattın türünde d6),
her Claw %30. Zar sayısı = (pay − STR) / zar ortalaması, yuvarlanır. Yetişkin Tail = Bite'ın fiziksel zarı (ezici, 20 ft).
Efsanevi: Body Sweep / Wing Buffet = Claw zarı ezici + Prone, DEX, 10 ft yayılım; Elemental Pulse = nefes zar sayısının dörtte biri d10,
hattın türü, CON, 20 ft yayılım, yarı hasar. DC'ler hattın nefes DC'si. Erişim Yavru 5, Genç 10, Yetişkin 15 ft.

| Kimlik | CR | Bonus | Yakın dövüş hedefi | Bite | Claw (×2) | Tail | Sweep/Buffet | Elemental Pulse |
|---|---|---|---|---|---|---|---|---|
| `sigmlet` | 5 | +6 | 21 | 1d10+4 + 1d6 radiant | 1d8+4 | | | |
| `sigmyr` | 16 | +9 | — | 3d10+6 + 3d6 radiant | 5d8+6 | | | |
| `sigmadrake` | 25 | +12 | 133 | 5d10+8 + 5d6 radiant | 7d8+8 | 5d10+8 | 7d8+8 | 4d10 |
| `omeglet` | 6 | +6 | 25 | 1d10+4 + 1d6 necrotic | 1d8+4 | | | |
| `omegyr` | 17 | +10 | — | 3d10+6 + 3d6 necrotic | 5d8+6 | | | |
| `omegadrake` | 26 | +12 | 144 | 6d10+8 + 5d6 necrotic | 8d8+8 | 6d10+8 | 8d8+8 | 4d10 |
| `deltlet` | 6 | +6 | 25 | 1d10+4 + 1d6 psychic | 1d8+4 | | | |
| `deltyr` | 18 | +10 | — | 4d10+6 + 4d6 psychic | 5d8+6 | | | |
| `deltadrake` | 27 | +13 | 155 | 6d10+8 + 6d6 psychic | 9d8+8 | 6d10+8 | 9d8+8 | 5d10 |
| `alphlet` | 7 | +6 | 29 | 1d10+6 + 1d6 thunder | 1d8+6 | | | |
| `alphyr` | 19 | +10 | — | 3d10+8 + 4d6 thunder | 5d8+8 | | | |
| `alphadrake` | 28 | +13 | 165 | 6d10+10 + 6d6 thunder | 9d8+10 | 6d10+10 | 9d8+10 | 5d10 |
| `gamlet` | 8 | +7 | 32 | 1d10+4 + 1d6 force | 1d8+4 | | | |
| `gammyr` | 20 | +10 | — | 4d10+6 + 4d6 force | 6d8+6 | | | |
| `gammadrake` | 30 | +14 | 187 | 8d10+8 + 7d6 force | 11d8+8 | 8d10+8 | 11d8+8 | 5d10 |

### Diğer türetilenler

| Kayıt | Türetilen |
|---|---|
| Mücevher (15) | yetenek puanları (evre tabanı Yavru 19/12/17/12/12/14, Genç 23/12/21/14/13/17, Yetişkin 27/14/25/16/15/21 + 1. baskın nitelik +4, 2. +2); DEX/WIS kurtarması (yeterlilik CR'den); Perception = WIS + 2 × yeterlilik, Stealth = DEX + yeterlilik; kendi nefes türüne bağışıklık; karanlık görüş 120 ft; Recharge 5–6, başarıda yarı hasar. Legendary Resistance yok (belge vermiyor). Boyut: 1×1 Medium, 2×2 Large, 3×3 Huge (7 altıgen) |
| Captive Dragon | Bite/Claw erişimi 15 ft (Tail 25 ft belgeden); Crushing Presence alanı 60 ft |
| Dragon of Hexonia | World-Breaker Bite / Continent-Shaper Claw erişimi 20 ft, Continent Tail 30 ft; Crushing Continental Presence alanı 60 ft; Lightning Spear Rain "4 altıgen" → 10 ft küre, 120 ft menzil |
| Cosmic Phoenix | gaga/pençe erişimi 10 ft; Ember Wing Flap için DC 27 DEX kurtarma, yarı hasar |
| Ember Egg | boyut Medium, CR 0, yetenek puanları, ateş/ışıltı bağışıklığı, durum bağışıklıkları |
| Ocean-Nightmare | Abyssal Swallow menzili 30 ft (dokunaç erişimi); Storm Bolt / Tidal Surge efsanevi kurtarmaları yarı hasarsız |
| Titan of Nightmare | Abyssal Swallow menzili 45 ft |
| Hepsi | inisiyatif DEX değiştiricisi (belge vermiyor); Perception = pasif Algı − 10 (belgeden) |

**KATALOG-DENGE-DUZELT (2026-11-27):** Genç evresinin (sigmyr, omegyr, deltyr, alphyr, gammyr) HP'si DMG bandının alt sınırına çıktı ve
Bite, Claw ve nefes zarları aynı çarpanla büyüdü (3 turluk tur hasarı DMG bandının alt sınırı; yöntem `scripts/katalog-f2-kadim.mjs`
`GENC_DENGE`, karşılaştırma `KATALOG-DENGE-TABLO.md`). Yukarıdaki tablolarda Genç satırları yeni değerde; "T" sütunu (yakın dövüş hedefi)
çarpanla değiştiği için "—".
