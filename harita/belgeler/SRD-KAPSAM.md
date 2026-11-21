# SRD 5.2.1 kapsam denetimi (SRD ↔ oyun)

Tarih: 2026-11-21 · Taban: `origin/birlesik` 9e8e2ce4 · Kural sürümü 99. **Yalnız okuma:** kod, veri ve test değişmedi; depoya yalnız bu belge girdi. Belge depo dışındaki bir tarama betiğiyle üretildi (SRD verisi × oyun verisi × test dosyaları × mevcut denetim belgeleri); elle düzenlenmiş bir tablo değildir, yeniden üretilirken değerler değişebilir.

**Amaç:** SRD 5.2.1'de olup oyunda hiç olmayan ya da eksik kalan her şeyi bulmak. Bölümler SRD'nin içindekiler sırasıyla: oynama kuralları (s. 5–18), karakter oluşturma (s. 19–27), 12 sınıf ve SRD alt sınıfları (s. 28–82), geçmişler ve türler (s. 83–86), feat'ler (s. 87–88), donanım (s. 89–103), büyüler (s. 104–175), kural sözlüğü (s. 176–191), oyun araç kutusu (s. 192–203), sihirli eşyalar (s. 204–253), canavarlar (s. 254–343) ve hayvanlar (s. 344–364). Sayfa numaraları PDF'teki basılı numaradır.

## Kaynaklar ve yöntem

- **SRD tarafı:** `docs/SRD_CC_v5.2.1.pdf` (pdftotext/pdfplumber: kural sözlüğünün 155 başlığı, araç kutusu ve donanım alt başlıkları, canavar stat bloklarındaki "Initiative" değerleri), `data/srd/*.json` (sınıf ilerlemesi, alt sınıflar, feat'ler, türler, geçmişler, silah/zırh/ustalık, donanım, aletler, 339 büyü, 258 sihirli eşya, 330 canavar; `rapor.json`: sorun yok, 8 atlanan yan kutu/stat blok), `data/canavar-ozellik.json` (canavar başına özellik ve eylem listesi).
- **Oyun tarafı:** `data/*.json` (canavarlar, eşyalar, sınıf özellikleri, feat/ustalık durumları), motor kodu (gerektiğinde dosya:satır).
- **Mevcut denetimler (durumlarının dayanağı):** `docs/SRD-DENETIM.md` (görev gereği `npx vite-node scripts/srd-denetim.ts` ile yeniden üretildi; çıktı depodakiyle birebir aynı, dosya değişmedi), `harita/belgeler/BUYU-DURUM.md`, `GENEL-SAVAS-DENETIM.md` (A–H satırları, GENEL96 düzeltmeleriyle), `TUR-FEAT-ESYA-DENETIM.md` (T/F/G/S/Z/D satırları, TE99 sonuç tablosu uygulanarak), 12 sınıf denetimi `*-DENETIM.md` (B93/B94/B95/B98/TE99 düzeltme bölümleri uygulanarak), `ESYA-SINIFLANDIRMA.md`, `ENVANTER-CANAVARLAR.md`, `SRD-VERI-DOGRULAMA.md`, `MEKANIK-MATRIS.md`, `docs/UPCAST.md`.
- **İstenen `harita/belgeler/EKSIK-TARAMA.md` depoda yok** (ne `birlesik`'te ne git geçmişinde; `git log --all -- '*EKSIK-TARAMA*'` boş). Yerine yukarıdaki envanter ve denetim belgeleri kullanıldı.
- **Test kanıtı:** 519 test dosyasından metin/görsel/kimlik testleri (açıklama, Dungeondex, glif, efekt, jeton, ses, i18n, `srdIds`; 34 dosya) çıkarıldı; kalan 485 mekanik test dosyasında öğenin kimliği ya da adı tırnak içinde aranır (büyülerde aynı satırda büyü/cast bağlamıyla). Kaynak denetimin kanıt sütununda adı geçen test dosyaları da sayılır. Bu bir **adlandırma eşlemesidir**: testin öğenin her kuralını sınadığını göstermez. Kanıt sütununda en çok iki dosya yazılır, kalanı "+N".
- **Sınıflar:** 12 sınıf denetiminin satırları, sonraki düzeltme bölümleri uygulanarak özellik başına güncel duruma indirildi (her satırın "kanıt" sütununun sonunda kaynak denetim satırları). Kod okumasıyla yeni fark edilen birkaç açık "Önemli bulgular"da ayrıca belirtildi.

## Durum sözlüğü

- **var-test edilmiş:** SRD'ye uygun çalışıyor ve en az bir mekanik test dosyası öğeyi adlandırıyor.
- **var-testsiz:** SRD'ye uygun çalışıyor (veri ya da denetim kanıtı var), adını taşıyan mekanik test yok (probe, mekanik matris ölçümü ya da kod okuması).
- **kısmi:** uygulanmış ama SRD'nin bir parçası eksik ya da farklı; **bilinçli sapmalar** (DECISIONS.md'de gerekçeli) ve kapsam dışı parçalar da burada, gerekçesi "Önerilen adım / açık kalan" sütununda. Canavarlarda: bir girişi kısmi/yok ya da SRD inisiyatifi DEX'ten farklı olan canavar kısmidir.
- **yok:** savaşla ilgili, oyunda uygulanmamış.
- **savaş dışı:** SRD kuralı savaş dışı (anlatı, keşif, sosyal, zaman). Oyunda karşılığı olup olmadığı kanıt sütununda; "karşılığı yok" olanlar "hiç olmayanlar" listesine de girer.
- Yapay zekâ ve arayüz eksikleri (`YZ:`, `Arayüz:`) durumu düşürmez, açık kalan sütununda yazılır.

## Bölüm bazlı sayı tablosu

| SRD bölümü | Sayfa | Satır | var-test edilmiş | var-testsiz | kısmi | yok | savaş dışı | hiç olmayan* |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 1. Oynama kuralları (Playing the Game) | s. 5–18 | 41 | 20 | 0 | 18 | 0 | 3 | 2 |
| 2. Karakter oluşturma (Character Creation) | s. 19–27 | 13 | 5 | 1 | 1 | 3 | 3 | 5 |
| 3. Sınıflar (Classes) | s. 28–82 | 280 | 158 | 11 | 104 | 0 | 7 | 5 |
| 4. Karakter kökenleri (Backgrounds, Species) | s. 83–86 | 72 | 28 | 27 | 14 | 3 | 0 | 3 |
| 5. Feat'ler (Feats) | s. 87–88 | 29 | 14 | 8 | 7 | 0 | 0 | 0 |
| 6. Donanım (Equipment) | s. 89–103 | 254 | 57 | 58 | 43 | 5 | 91 | 33 |
| 7. Büyüler (Spells) | s. 104–175 | 355 | 187 | 28 | 26 | 0 | 114 | 0 |
| 8. Kural sözlüğü (Rules Glossary) | s. 176–191 | 155 | 85 | 4 | 53 | 3 | 10 | 10 |
| 9. Oyun araç kutusu (Gameplay Toolbox) | s. 192–203 | 54 | 5 | 0 | 16 | 27 | 6 | 33 |
| 10. Sihirli eşyalar (Magic Items) | s. 204–253 | 267 | 27 | 142 | 17 | 0 | 81 | 3 |
| 11. Canavarlar (Monsters A–Z) | s. 254–343 | 254 | 78 | 51 | 123 | 0 | 2 | 1 |
| 12. Hayvanlar (Animals) | s. 344–364 | 96 | 51 | 40 | 5 | 0 | 0 | 0 |
| **Toplam** | | **1870** | **715** | **370** | **427** | **41** | **317** | **95** |

\* "hiç olmayan" = `yok` satırları + oyunda hiçbir karşılığı olmayan `savaş dışı` satırları (aşağıdaki listenin satırları). Canavar satırları canavar başına; canavarların hiç olmayan tek tek girişleri listede ayrıca.

## Önemli bulgular

Yeni (bu denetimden önce hiçbir belgede yazılı değil) olanlar **[YENİ]** işaretli.

1. **[YENİ] Canavar inisiyatifi SRD stat bloğundan değil, yalnız DEX'ten.** `src/battle/create.ts:560` `initiativeBonus: mods.dex`; `data/monsters.json`'da inisiyatif alanı yok. SRD 5.2.1 stat bloklarındaki "Initiative +X (skor)" değeri 330 canavarın **110**'unda DEX değiştiricisinden farklı (PDF taraması): Adult Black Dragon +12 (oyunda +2), Ancient Black Dragon +16 (+2), Balor +14 (+2), Aboleth +7 (−1), Assassin +10 (+4). Etki: güçlü ve efsanevi canavarlar SRD'ye göre geç davranıyor. Öneri: `monsters.json`'a SRD inisiyatif değeri, `create.ts`'te kural sürümüyle kullanım (100+; eski kayıt ve replay eski davranış).
2. **[YENİ] Adult ve Ancient Gold Dragon'da Weakening Breath eylemi yok.** `data/monsters.json` saldırıları Rend, Fire Breath, Spellcasting; `data/multiattack.json` `replace` listesi `Weakening Breath`'e işaret ediyor ama eylem tanımlı değil (Gold Dragon Wyrmling ve Young Gold Dragon'da var). Öneri: Young Gold Dragon kaydındaki biçimle iki ejderhaya eklemek (`damagePenalty` + `checkDis`, ENVANTER-CANAVARLAR "Özel hasar metni").
3. **[YENİ] Sphinx of Lore ve Sphinx of Valor'un "Weight of Years" efsanevi eylemi yok** (`data/efsanevi.json`'da yalnız Arcane Prowl).
4. Cloud Giant'ın **Misty Step** bonus eylemi yok (SRD-DENETIM'de "açık iş" olarak duruyordu).
5. **Karakter oluşturma:** çoklu sınıf (Multiclassing, s. 24–25) tamamen yok (karakterde tek `classId`); diller (Common + iki dil, Thieves' Cant/Druidic dilleri) yok; sınıf/geçmiş başlangıç donanımı A/B paketleri ve "Starting at Higher Levels" donanım tablosu yok; Human/Tiefling boyut seçimi (Small/Medium) yok.
6. **Sosyal ve keşif kuralları:** Influence eylemi, tutumlar (Friendly/Indifferent/Hostile), Charmed'ın sosyal avantajı, Help ile yetenek kontrolüne yardım, Search/Study'nin geniş kullanımı yok ya da kısmi.
7. **Oyun araç kutusu:** 14 örnek zehrin hiçbiri, zehir hasadı, üç büyülü salgın (Cackle Fever, Sewer Plague, Sight Rot), Extreme Heat, Mental Stress, zorlu yürüyüş (Extended Travel) ve tempo seçimi yok; 8 örnek tuzağın 5'i yok, 3'ü yalnız yaklaşık; tuzağı etkisiz kılma yok.
8. **Büyü bileşenleri:** motorda yalnız Verbal kısıtı var; Somatic (boş el) ve Material (odak, fiyatlı/tüketilen malzeme) yalnız bilgi (`src/rules/spellComponents.ts`).
9. **Kısmi satırlar içinde hiç uygulanmamış alt kurallar** (ayrıntı aşağıdaki listede): Knocking Out, isteğe bağlı yere yatma, baygının elindekini düşürmesi, dar açıklık zorlu arazisi, büyüsüz High Jump, 0 HP'de uzun dinlenme yasağı, dinlenme kesintileri, yapışma/likantropi/boğulma gibi canavar ekleri.
10. **[YENİ] Kod okumasıyla görülen, sınıf denetimlerinde yazılı olmayan açıklar** (çalıştırılmadı, doğrulama testi önerilir):
    - Gift of the Depths (Warlock): yüzme hızı veriyor (`deepWater.ts:80`) ama su altında soluma `breathesWater` (`underwaterCore.ts:52`) bu Invocation'a bakmıyor.
    - Evocation Savant: veride `maxBaseLevel: 2` var, `src/rules/builder.ts` `bookBonus` okumuyor (ilk iki bedelsiz büyüde seviye sınırı yok).
    - Empowered Evocation: büyünün Wizard büyüsü olup olmadığına bakılmıyor (Magic Initiate/soy kaynaklı Evocation büyüleri de +INT alıyor).
    - Reliable Talent: TE99'daki Thieves' Tools kilit açma kontrolüne uygulanmıyor.
    - Lore Bonus Proficiencies (Bard): Serüven seçim kipinde ek üç beceri seçilemiyor (`levelChoices.ts` `CHOICE_FIELDS`, Barbarian C6 ile aynı kök).
    - Improved Elemental Fury: +300 ft menzil Druid dışı cantrip'lere de uygulanıyor; `k19tier4b.test.ts` bunu doğru diye bekliyor.
    - Countercharm: B94 aura/alan genişlemesinin testi yok (B94 tablosunda adı geçen testte bulunamadı).

## SRD'de olup oyunda hiç olmayanlar

Bölüm sırasıyla. `yok`: savaşla ilgili, uygulanmamış. `savaş dışı, karşılık yok`: SRD kuralı savaş dışı ve oyunda (Serüven, oluşturucu, yerleşim dahil) hiçbir karşılığı yok.

### 1. Oynama kuralları (Playing the Game)

- s. 10 — Social Interaction: Roleplaying (savaş dışı, karşılık yok)
- s. 11 — Social Interaction: Ability Checks (Influence, tutumlar) (savaş dışı, karşılık yok): A19 yok: Influence; Attitude (Friendly/Indifferent/Hostile) modeli yok

### 2. Karakter oluşturma (Character Creation)

- s. 23 — Tiers of Play (savaş dışı, karşılık yok)
- s. 24 — Starting at Higher Levels: başlangıç donanımı tablosu (seviyeye göre altın ve sihirli eşya) (yok): seviye kademesine göre ek altın/sihirli eşya önerisi
- s. 24 — Multiclassing: önkoşullar (13 yetenek) (yok): çoklu sınıf modeli (sınıf başına seviye) gerektirir; büyük iş
- s. 25 — Multiclassing: XP, HP ve HP zarları, PB, yetkinlikler, sınıf özellikleri (Extra Attack, Unarmored Defense, çoklu büyücü slot tablosu, Pact Magic) (yok): önce karar: çoklu sınıf kapsamı
- s. 26 — Trinkets (d100 tablosu) (savaş dışı, karşılık yok): oluşturucuda isteğe bağlı rastgele biblo (salt metin)

### 3. Sınıflar (Classes)

- s. 62 — Rogue: Thieves' Cant (1. sv) (savaş dışı, karşılık yok): Dil sistemi yok: savaş dışında da mekanik karşılığı yok, yalnız açıklama (bilinçli, DECISIONS 4654).; Dil sistemi gelirse Thieves' Cant + bir dil seçimi.
- s. 73 — Warlock / seçenek: Mask of Many Faces (2. sv) (savaş dışı, karşılık yok): Savaşta Game Master notu; savaş dışında (Serüven) büyü yapımı yok, karşılığı yok.
- s. 74 — Warlock / seçenek: Misty Visions (2. sv) (savaş dışı, karşılık yok): Savaşta Game Master notu; savaş dışında karşılığı yok.
- s. 74 — Warlock / seçenek: Whispers of the Grave (7. sv) (savaş dışı, karşılık yok): Savaşta Game Master notu; savaş dışında karşılığı yok.
- s. 74 — Warlock / seçenek: Visions of Distant Realms (9. sv) (savaş dışı, karşılık yok): Savaşta Game Master notu; savaş dışında karşılığı yok.

### 4. Karakter kökenleri (Backgrounds, Species)

- s. 20 — Geçmiş kuralı: Başlangıç donanımı: A paketi ya da 50 GP; para hemen harcanabilir (s. 20, s. 83) (yok): G16 yok: ertelendi (başlangıç donanımı A/50 GP)
- s. 86 — Tür kuralı: Human ve Tiefling boyutu Small ya da Medium, tür seçilirken (yok): T2 yok: ertelendi (bu turun kapsamı dışında)
- s. 85 — Tür kuralı: High Elf: uzun dinlenmede cantrip'i başka Wizard cantrip'iyle değiştirme (yok): T13 yok: ertelendi (bu turun kapsamı dışında)

### 6. Donanım (Equipment)

- s. 220 — Zırh kuralı: Elven Chain: "considered trained" (yok): Z20 yok: ertelendi (bu turun kapsamı dışında)
- s. 93–94 — Alet (23, savaş dışı, karşılık yok): Alchemist’s Supplies, Brewer’s Supplies, Calligrapher’s Supplies, Carpenter’s Tools, Cartographer’s Tools, Cobbler’s Tools, Cook’s Utensils, Glassblower’s Tools, Jeweler’s Tools, Leatherworker’s Tools, Mason’s Tools, Painter’s Supplies, Potter’s Tools, Smith’s Tools, Tinker’s Tools, Weaver’s Tools, Woodcarver’s Tools, Disguise Kit, Forgery Kit, Gaming Set, Herbalism Kit, Musical Instrument, Navigator’s Tools. alet kontrolü ve Crafting ile birlikte
- s. 205 — Donanım kuralı: Uyum ön şartı: sınıf ya da "by a Spellcaster" (yok): D23 yok: ertelendi (bu turun kapsamı dışında)
- s. 100 — Barding (binek zırhı) (yok): bineğe zırh (AC) seçimi
- s. 100 — Saddles (Exotic, Military, Riding; askeri eyerde düşmemeye avantaj) (yok): Military Saddle avantajı `mounted.ts` düşme save'ine
- s. 100 — Large Vehicles (gemi, kızak, araba; hız, AC, HP, Damage Threshold) (yok): savaş dışı; araç istatistikleri yok
- s. 101 — Lifestyle Expenses (7 kademe) (savaş dışı, karşılık yok)
- s. 102 — Hirelings (vasıflı/vasıfsız, haberci) (savaş dışı, karşılık yok)
- s. 103 — Crafting Nonmagical Items (alet, ham madde, süre) (savaş dışı, karşılık yok)
- s. 103 — Brewing Potions of Healing (Herbalism Kit, 25 GP, 1 gün) (savaş dışı, karşılık yok)
- s. 103 — Scribing Spell Scrolls (süre ve maliyet tablosu) (savaş dışı, karşılık yok)

### 8. Kural sözlüğü (Rules Glossary)

- s. 177 — Attitude (savaş dışı, karşılık yok): Influence ile birlikte
- s. 180 — Damage Threshold (yok): SRD 5.2.1 canavarlarında yok; nesne/araç için
- s. 181 — Dehydration [Hazard] (savaş dışı, karşılık yok): Serüven yolculuğunda su/erzak modeli
- s. 182 — Friendly [Attitude] (savaş dışı, karşılık yok)
- s. 183 — Hostile [Attitude] (savaş dışı, karşılık yok)
- s. 184 — Indifferent [Attitude] (savaş dışı, karşılık yok)
- s. 184 — Influence [Action] (yok): A19 yok: Influence
- s. 184 — Knocking Out a Creature (yok): D10 yok: Knocking Out: yakın dövüş saldırısıyla 0 HP'ye indirecekken 1 HP + Unc…
- s. 185 — Malnutrition [Hazard] (savaş dışı, karşılık yok)
- s. 190 — Telepathy (savaş dışı, karşılık yok)

### 9. Oyun araç kutusu (Gameplay Toolbox)

- s. 192 — Travel Pace: Extended Travel (zorlu yürüyüş, CON save ya da Exhaustion) (yok): gezintide 8 saat üstü yürüyüş kuralı
- s. 192 — Creating a Background (yetenek, feat, beceri, alet, donanım adımları) (savaş dışı, karşılık yok): oluşturucuda özel geçmiş adımı
- s. 193 — Curses: Cursed Creatures (likantropi vb.) (yok): 0 HP'de taraf değiştirme (allegianceSwap) ya da Serüven laneti
- s. 193 — Curses: Narrative ve Environmental Curses (savaş dışı, karşılık yok)
- s. 194 — Magical Contagions: Rest and Recuperation (savaş dışı, karşılık yok)
- s. 194 — Magical Contagion (3, yok): Cackle Fever, Sewer Plague, Sight Rot. Serüven/dinlenme katmanında hastalık durumu
- s. 195 — Environmental Effects: Extreme Heat (su içmeyen, saatlik CON save) (yok): çöl/volkan için `heatExposure` harita kuralı
- s. 195 — Environmental Effects: High Altitude (10.000 ft üstü, Exhaustion) (savaş dışı, karşılık yok)
- s. 196 — Mental Stress Effects (Psychic hasar + zihinsel stres tablosu) (yok): Moral'e bağlanabilir
- s. 196 — Prolonged Effects (uzun süreli korku/stres) (savaş dışı, karşılık yok)
- s. 197 — Purchasing Poison (savaş dışı, karşılık yok)
- s. 197 — Harvesting Poison (DC 20 INT (Nature), Poisoner's Kit) (yok): savaş sonu ganimet adımı
- s. 197–198 — Sample Poison (14, yok): Assassin's Blood, Burnt Othur Fumes, Crawler Mucus, Essence of Ether, Malice, Midnight Tears, Oil of Taggit, Pale Tincture, Purple Worm Poison, Serpent Venom, Spider's Sting, Torpor, Truth Serum, Wyvern Poison. `data/items.json` `use` (save + durum) kalıbıyla
- s. 199–201 — Example Trap (5, yok): Falling Net, Fire-Casting Statue, Poisoned Darts, Poisoned Needle, Spiked Pit. tuzak şablonu olarak `data/` içine

### 10. Sihirli eşyalar (Magic Items)

- s. 206 — Magic Item Resilience (hasara dayanıklılık) (savaş dışı, karşılık yok)
- s. 206 — Crafting Magic Items (Arcana, alet, büyü, süre ve maliyet) (savaş dışı, karşılık yok)
- s. 207 — Sentient Magic Items (yetenekler, hizalanma, iletişim, duyular, amaç, çatışma) (savaş dışı, karşılık yok)

### 11. Canavarlar (Monsters A–Z)

- s. 256 — Stat Block: Languages ve Telepathy (savaş dışı, karşılık yok)
- Canavar girişleri (stat bloğunda olup oyun verisinde olmayan, 5):
  - s. 275 — Cloud Giant: Misty Step (bonus)
  - s. 291 — Adult Gold Dragon: Weakening Breath (action)
  - s. 292 — Ancient Gold Dragon: Weakening Breath (action)
  - s. 327 — Sphinx of Lore: Weight of Years (legendary)
  - s. 328 — Sphinx of Valor: Weight of Years (legendary)

### Kısmi satırların içinde hiç uygulanmamış alt kurallar

Yukarıdaki satırlar "kısmi" sayıldığı için listeye girmeyen, ama kendi başına hiç uygulanmamış SRD alt kuralları (kaynak denetimin satır kimliğiyle).

- GENEL-SAVAS-DENETIM A14 (s. 182): Help: Assist an Ability Check
- GENEL-SAVAS-DENETIM A19 (s. 184): Influence
- GENEL-SAVAS-DENETIM A27: Ready: YZ kullanımı
- GENEL-SAVAS-DENETIM A44 (s. 14): Dropping Prone: eylemsiz, hızsız, hız 0'da olmaz
- GENEL-SAVAS-DENETIM A45: YZ: Dash
- GENEL-SAVAS-DENETIM A49: YZ: Search, Stabilize, Influence, Study, Ready
- GENEL-SAVAS-DENETIM B10: Charmed: büyüleyenin sosyal kontrollerinde avantaj
- GENEL-SAVAS-DENETIM B30: Petrified: ağırlık ×10, yaşlanma durur
- GENEL-SAVAS-DENETIM B35: Prone: isteğe bağlı yere yatma (Dropping Prone, Speed kuralı)
- GENEL-SAVAS-DENETIM B40: Unconscious: elindekini düşürür
- GENEL-SAVAS-DENETIM D10 (s. 17): Knocking Out: yakın dövüş saldırısıyla 0 HP'ye indirecekken 1 HP + Unconscious bırakma seçeneği; Short Rest sonunda, HP kazanınca ya da DC 1…
- GENEL-SAVAS-DENETIM E6 (s. 181): Dar açıklık (bir boy küçük yaratığa göre) zorlu arazidir; 5.2.1'de ayrı Squeezing kuralı yok
- GENEL-SAVAS-DENETIM E9 (s. 14): Dropping Prone: eylemsiz ve hareketsiz, hız 0'da olmaz
- GENEL-SAVAS-DENETIM F15 (s. 183): High Jump: 3 + STR mod ft (koşuyla), durarak yarısı; ft başına hareket
- GENEL-SAVAS-DENETIM F20: Help (yetenek kontrolü): müttefikin seçilen beceri kontrolü avantajlı
- GENEL-SAVAS-DENETIM G6 (s. 185): Long Rest başlamak için en az 1 HP
- GENEL-SAVAS-DENETIM G11 (s. 185): Kesintiler (inisiyatif, cantrip dışı büyü, hasar, 1 saat efor); kesilen Short Rest yararsız (s.185, s.187)
- TUR-FEAT-ESYA T22 (s. 85): Rock Gnome: saat işi aygıt (AC 5, 1 HP; en çok 3) — ertelendi (bu turun kapsamı dışında)
- TUR-FEAT-ESYA T43 (s. 86): Otherworldly Presence: Thaumaturgy cantrip'i, Legacy yeteneğiyle — ertelendi (bu turun kapsamı dışında)
- TUR-FEAT-ESYA G14 (s. 83): Seçmeli alet: Soldier "one kind of Gaming Set" (s. 83); bizim Soylu (Gaming Set), Soytarı (Musical Instrument) — ertelendi (bu turun kapsamı dışında)
- TUR-FEAT-ESYA S9 (s. 89): Ammunition: tek elli silahı doldurmak için boş el gerekir — ertelendi (bu turun kapsamı dışında)
- TUR-FEAT-ESYA S33 (s. 183): Improvised: menzilli silahla yakın dövüş, Thrown'suz yakın silahı fırlatma (1d4, 20/60, PB yok) — ertelendi (bu turun kapsamı dışında)
- TUR-FEAT-ESYA Z9 (s. 92): Shield "Utilize Action to Don or Doff" — ertelendi (kalkan tak/çıkar komutu)
- TUR-FEAT-ESYA D16 (s. 98): Oil: yaratığa fırlatma (DEX save, ateşte +5 Fire), alana dökme ve yakma — ertelendi (Utilize eşyaları)
- TUR-FEAT-ESYA D17 (s. 96): Caltrops (DC 15, 1 Piercing, hız 0) ve Ball Bearings (DC 10 Prone), Utilize — ertelendi (Utilize eşyaları)
- TUR-FEAT-ESYA D18 (s. 97): Hunting Trap (DC 13, 1d4, zincir), Manacles (DC 13 bağlama) — ertelendi (Utilize eşyaları)
- Canavar saldırı ekleri (ENVANTER-CANAVARLAR "A2'de kalan"): yapışma/attach (Stirge Proboscis, Darkmantle Crush, Cloaker Attach), likantrop laneti (Werewolf, Wererat, Wereboar, Weretiger, Werebear), Aboleth Dominate Mind kalıcı kontrolü, Hurl Flame ile yanıcı nesne hedefleme, boğulma (Rug of Smothering, Water Elemental Whelm, Gelatinous Cube Engulf)

## 1. Oynama kuralları (Playing the Game) (s. 5–18)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Oynama kuralları s. 5 | Rhythm of Play (anlatım döngüsü) | savaş dışı | Game Master anlatımı; savaşta komut → olay döngüsü (`src/battle/execute`) | terim |
| Oynama kuralları s. 5 | Six Abilities: Ability Scores ve Ability Modifiers | var-test edilmiş | `src/rules/stats.ts` (`deriveStats`); `altSoy.test.ts`, `bard.test.ts` +11 |  |
| Oynama kuralları s. 6 | D20 Tests: Ability Checks (DC, doğal 1/20 otomatik değil) | var-test edilmiş | GENEL-SAVAS-DENETIM F1, F2, A16; `genel96.test.ts` |  |
| Oynama kuralları s. 7 | D20 Tests: Saving Throws | kısmi | GENEL-SAVAS-DENETIM F3 | F3 kısmi: Saving throw: doğal 20/1 otomatik değil; istersen zar atmadan başarısı…; isteyerek başarısız olma ve yeteneği olmayan otomatik başarısızlık |
| Oynama kuralları s. 7 | D20 Tests: Attack Rolls (doğal 20 isabet + kritik, doğal 1 ıska) | var-test edilmiş | GENEL-SAVAS-DENETIM C2, C3, F6; `combat.test.ts` |  |
| Oynama kuralları s. 7 | Advantage/Disadvantage | var-test edilmiş | GENEL-SAVAS-DENETIM C1, F4, F5; `combat.test.ts` | F5 doğrulanmadı: Avantajla yeniden atışta yalnız tek zar |
| Oynama kuralları s. 8 | Proficiency Bonus (tablo, birikmez) | var-test edilmiş | GENEL-SAVAS-DENETIM F7, F8; `abilities.test.ts`, `k19level20.test.ts` |  |
| Oynama kuralları s. 8 | Skill Proficiencies ve Expertise | var-test edilmiş | GENEL-SAVAS-DENETIM F9; `advancement.test.ts`, `classFeatures.test.ts` +4 |  |
| Oynama kuralları s. 9 | Saving Throw Proficiencies | var-test edilmiş | `src/rules/stats.ts` save yetkinliği; `a8spells.test.ts`, `altSoy.test.ts` +16 |  |
| Oynama kuralları s. 9 | Equipment Proficiencies (silah/zırh/alet) | kısmi | TUR-FEAT-ESYA S/Z/G satırları; silah ve zırh eğitimi motorda; `objects.test.ts`, `te99.test.ts` | genel alet yetkinliği yok (G13 bilinçli sapma); alet kontrolüne PB yalnız Thieves' Tools |
| Oynama kuralları s. 9 | Actions tablosu (Attack, Dash, Disengage, Dodge, Help, Hide, Influence, Magic, Ready, Search, Study, Utilize) | kısmi | GENEL-SAVAS-DENETIM A1, A6, A8, A9, A12, A14, A17, A19, A20, A22, A29, A30, A31; `a8spells.test.ts`, `b94paladin.test.ts` +5 | A14 yok: Help: Assist an Ability Check; A17 bilinçli sapma: Hide: DC 15 Stealth, yoğun örtü / ¾ siper, hiçbir düşmanın görüş hattı…; A19 yok: Influence; A29 kısmi: Search: WIS kontrolü (Insight, Medicine, Perception, Survival); A30 kısmi: Study: INT kontrolü; Influence ve Help (yetenek kontrolü) yok; Search/Study kısmi |
| Oynama kuralları s. 10 | One Thing at a Time (turda tek eylem, slotlu tek büyü) | var-test edilmiş | GENEL-SAVAS-DENETIM A1, A42; `economy.test.ts` |  |
| Oynama kuralları s. 10 | Bonus Actions | var-test edilmiş | GENEL-SAVAS-DENETIM A34, A35, A36, A37; `economy.test.ts`, `extraBonus.test.ts` +1 |  |
| Oynama kuralları s. 10 | Reactions | var-test edilmiş | GENEL-SAVAS-DENETIM A38, A39, A40; `binekMb2.test.ts`, `economy.test.ts` +2 |  |
| Oynama kuralları s. 10 | Social Interaction: Roleplaying | savaş dışı | oyunda karşılığı yok (sosyal sahne Game Master) |  |
| Oynama kuralları s. 11 | Social Interaction: Ability Checks (Influence, tutumlar) | savaş dışı | GENEL-SAVAS-DENETIM A19 | A19 yok: Influence; Attitude (Friendly/Indifferent/Hostile) modeli yok |
| Oynama kuralları s. 11 | Exploration: Adventuring Equipment | kısmi | bkz. 6. Donanım; savaşla ilgili eşyalar `data/items.json` | 81 SRD eşyasının 67'si savaş dışı işaretli |
| Oynama kuralları s. 11 | Exploration: Vision and Light (parlak/loş/karanlık, örtü, duyular) | kısmi | GENEL-SAVAS-DENETIM H1, H2, H3, H4, H5, H6, H7, H8, H9, H10, H11, H12; `ai.test.ts`, `altSoy.test.ts` +14 | H3 bilinçli sapma: Karanlık = Heavily Obscured: oradakini görmeye çalışan Blinded sayılır…; H4 bilinçli sapma: Gece dışarısı karanlıktır; H12 kısmi: Görülmeyen hedef ya da saldıran (ışık yönü): dezavantaj ve avantaj |
| Oynama kuralları s. 11 | Exploration: Hiding | kısmi | GENEL-SAVAS-DENETIM A17, A18, C12; `genel96.test.ts` | A17 bilinçli sapma: Hide: DC 15 Stealth, yoğun örtü / ¾ siper, hiçbir düşmanın görüş hattı…; A18 bilinçli sapma: Hide biter: fısıltıdan yüksek ses, bulunma, saldırı zarı, Verbal bileş… |
| Oynama kuralları s. 11 | Exploration: Interacting with Objects (turda bir serbest etkileşim) | kısmi | GENEL-SAVAS-DENETIM A31, A32, A33; `genel96.test.ts` | A32 kısmi: Turda bir serbest nesne etkileşimi; ikincisi Utilize |
| Oynama kuralları s. 12 | Exploration: Hazards (yanma, düşme, boğulma, susuzluk, açlık) | kısmi | düşme `fall.ts`, yanma `maprules.ts`/`items.ts`, boğulma `underwaterCore.ts`; `a6spells.test.ts`, `area-spells.test.ts` +11 | Dehydration ve Malnutrition yok |
| Oynama kuralları s. 12 | Exploration: Travel (yolculuk, keşif) | kısmi | Serüven/dünya gezintisi `src/world/roam.ts`, `data/harita/gezinti-kurallari.json`; `regions.test.ts`, `roam.test.ts` | SRD tempo seçimi (Fast/Normal/Slow) ve zorlu yürüyüş yok; bkz. 9. Travel Pace |
| Oynama kuralları s. 13 | Combat: The Order of Combat (inisiyatif, tur, sürpriz) | var-test edilmiş | GENEL-SAVAS-DENETIM F22, B23, A1; `economy.test.ts`, `ruleVersion.test.ts` | Surprise: yalnız uyuyan grup alarmı ve Incapacitated inisiyatifi; genel pusu kontrolü yok |
| Oynama kuralları s. 14 | Combat: Movement and Position (hareketi bölme, zorlu arazi, yaratık alanı, Prone) | kısmi | GENEL-SAVAS-DENETIM E1, E5, E6, E7, E8, E9, E21, E22, E23, E24, E25, E26; `genel96.test.ts` | E6 yok: Dar açıklık (bir boy küçük yaratığa göre) zorlu arazidir; 5.2.1'de ayr…; E8 kısmi: Sürünme: her ft 1 ek ft, zorlu arazide 2 ek ft; E9 yok: Dropping Prone: eylemsiz ve hareketsiz, hız 0'da olmaz; E26 kısmi: Tur başka yaratığın alanında biterse Prone (Tiny ya da daha büyük deği…; dar açıklık zorlu arazisi ve isteğe bağlı yere yatma yok |
| Oynama kuralları s. 14 | Combat: Making an Attack (hedef, görünmeyen hedef, değiştiriciler) | kısmi | GENEL-SAVAS-DENETIM C9, C10, C11, C12; `combat.test.ts`, `genel96.test.ts` +1 | C10 kısmi: Yeri tahmin edilen hedefe saldırı yapılabilir; hedef orada değilse ısk…; C11 bilinçli sapma: Karanlıktaki (görülmeyen) saldıran ya da hedef |
| Oynama kuralları s. 15 | Combat: Cover | var-test edilmiş | GENEL-SAVAS-DENETIM C6; `area-spells.test.ts`, `maprules.test.ts` +1 |  |
| Oynama kuralları s. 15 | Combat: Ranged Attacks (menzil, yakın düşman) | var-test edilmiş | GENEL-SAVAS-DENETIM C7, C8; `genel96.test.ts`, `range.test.ts` |  |
| Oynama kuralları s. 15 | Combat: Melee Attacks (erişim, fırsat saldırısı, Unarmed Strike) | kısmi | GENEL-SAVAS-DENETIM C13, C16, C17, C18; `classTraits.test.ts`, `features.test.ts` +3 | C17 kısmi: Unarmed Strike, Grapple: hedef STR ya da DEX save'i seçer, DC 8 + STR … |
| Oynama kuralları s. 15 | Combat: Mounted Combat | var-test edilmiş | GENEL-SAVAS-DENETIM C19, C20, C21, C22; `binekMb1.test.ts`, `binekMb2.test.ts` +8 |  |
| Oynama kuralları s. 16 | Combat: Underwater Combat | var-test edilmiş | GENEL-SAVAS-DENETIM C23, C24, C25; `combat.test.ts` |  |
| Oynama kuralları s. 16 | Damage and Healing: Hit Points, Bloodied | var-test edilmiş | GENEL-SAVAS-DENETIM D1, D2; `a2abilities.test.ts`, `classTraits.test.ts` +2 |  |
| Oynama kuralları s. 16 | Damage Rolls (çok hedefte tek zar, aynı tür parçalar) | kısmi | GENEL-SAVAS-DENETIM D3, D4, D9; `altSoy.test.ts`, `b2.test.ts` +1 | D9 kısmi: Aynı saldırıda aynı türden parçalar (silah + Sneak Attack) |
| Oynama kuralları s. 16 | Critical Hits | kısmi | GENEL-SAVAS-DENETIM C4, C5; `paladin.test.ts`, `riders.test.ts` | C5 kısmi: Genişletilmiş kritik aralığı (Improved Critical "can score a Critical … |
| Oynama kuralları s. 16 | Saving Throws and Damage (yarı hasar) | var-test edilmiş | GENEL-SAVAS-DENETIM D4; `altSoy.test.ts`, `b2.test.ts` +1 |  |
| Oynama kuralları s. 16 | Damage Types (13) | var-test edilmiş | GENEL-SAVAS-DENETIM D5; `a6spells.test.ts`, `a7spells.test.ts` +1 |  |
| Oynama kuralları s. 17 | Resistance and Vulnerability (sıra: değiştirici → direnç → zayıflık) | var-test edilmiş | GENEL-SAVAS-DENETIM D6, D7, D8; `combat.test.ts`, `genel96.test.ts` |  |
| Oynama kuralları s. 17 | Immunity (hasar ve durum) | kısmi | GENEL-SAVAS-DENETIM D6, B2, B3, B4; `combat.test.ts`, `genel96.test.ts` | B2 kısmi: Immunity: bağışık olunan durum hiç etkilemez |
| Oynama kuralları s. 17 | Healing | var-test edilmiş | GENEL-SAVAS-DENETIM D1, D22; `combat.test.ts`, `deathsaves.test.ts` |  |
| Oynama kuralları s. 17 | Dropping to 0 HP: anında ölüm, baygınlık, Knocking Out | kısmi | GENEL-SAVAS-DENETIM D10, D11, D12, D13, D14; `deathsaves.test.ts`, `genel96.test.ts` | D10 yok: Knocking Out: yakın dövüş saldırısıyla 0 HP'ye indirecekken 1 HP + Unc…; Knocking Out seçeneği yok (karar gerekli 7) |
| Oynama kuralları s. 17 | Death Saving Throws ve stabilize | kısmi | GENEL-SAVAS-DENETIM D15, D16, D17, D18, D19, D20, D21; `deathsaves.test.ts`, `economy.test.ts` +2 | D18 kısmi: Stabilize: Help eylemi + DC 10 WIS (Medicine); D21 kısmi: İyileşmeyen stabil yaratık 1d4 saat sonra 1 HP kazanır. 0 HP'deyken kı… |
| Oynama kuralları s. 18 | Temporary Hit Points | kısmi | GENEL-SAVAS-DENETIM D23, D24, D25, D26; `effects.test.ts` | D26 kısmi: Geçici HP tükenene ya da uzun dinlenmeye dek sürer |

## 2. Karakter oluşturma (Character Creation) (s. 19–27)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Karakter oluşturma s. 19 | Choose a Character Sheet | var-test edilmiş | karakter kâğıdı `src/screens/sheet/` (DECISIONS karakter kâğıdı); `ck1.test.tsx` |  |
| Karakter oluşturma s. 19 | Step 1: Choose Class (12 sınıf) | var-test edilmiş | sihirbaz `src/screens/Builder.tsx`, `data/classes.json`; `modulBaslatma.test.ts`, `b94bard.test.ts` +41 |  |
| Karakter oluşturma s. 19 | Step 2: Character Origin (geçmiş, tür, diller) | kısmi | geçmiş `src/rules/backgrounds.ts`, tür/soy `src/rules/lineage.ts`; `evaluate.test.ts`, `altSoy.test.ts` +25 | Diller (Common + iki dil; Standard/Rare Languages tabloları) karakterde yok |
| Karakter oluşturma s. 20 | Step 3: Ability Scores (Standard Array, Point Buy 27, 4d6) | var-test edilmiş | `src/rules/builder.ts` `ScoreMethod`, `POINT_BUY_BUDGET`, `rolledScores`; `builder.test.ts`, `k2a.test.tsx` +2 |  |
| Karakter oluşturma s. 21 | Step 4: Alignment (dokuz hizalanma) | savaş dışı | ev kuralı Alignment (iki eksen, `src/rules/alignment.ts`, varsayılan kapalı); SRD dokuz hizalanma etiketi değil | bilinçli sapma: kendi hizalanma modeli |
| Karakter oluşturma s. 22 | Step 5: Details (HP, PB, beceriler, AC, saldırılar, büyü DC) | var-test edilmiş | `deriveStats`, `combatantFromSheet`; `battleSave.test.ts`, `altSoy.test.ts` +110 |  |
| Karakter oluşturma s. 23 | Level Advancement: Gaining a Level (XP tablosu, HP artışı) | var-test edilmiş | XP eşikleri `data/yolculuk/ayarlar.json` `xpEsikleri` (SRD ile aynı), Serüven `level_up`; oluşturucuda seviye seçimi; `seruven32.test.ts`, `k38.test.ts` +2 |  |
| Karakter oluşturma s. 23 | Tiers of Play | savaş dışı | oyunda ayrı karşılığı yok (yalnız karşılaşma bütçesi seviyeye bakar) |  |
| Karakter oluşturma s. 24 | Starting at Higher Levels: karakter oluşturma | var-testsiz | oluşturucuda 1–20 (6+ "Üst seviye" anahtarı `upperLevelsEnabled`) |  |
| Karakter oluşturma s. 24 | Starting at Higher Levels: başlangıç donanımı tablosu (seviyeye göre altın ve sihirli eşya) | yok | oluşturucu yalnız 1. seviye donanım seçimleri (`builderDefaults.ts`); seviye tablosu yok | seviye kademesine göre ek altın/sihirli eşya önerisi |
| Karakter oluşturma s. 24 | Multiclassing: önkoşullar (13 yetenek) | yok | karakterde tek `classId`; `src/rules/advancement.ts` yalnız feat önkoşulunda çoklu sınıf notu | çoklu sınıf modeli (sınıf başına seviye) gerektirir; büyük iş |
| Karakter oluşturma s. 25 | Multiclassing: XP, HP ve HP zarları, PB, yetkinlikler, sınıf özellikleri (Extra Attack, Unarmored Defense, çoklu büyücü slot tablosu, Pact Magic) | yok | yok (tek sınıf) | önce karar: çoklu sınıf kapsamı |
| Karakter oluşturma s. 26 | Trinkets (d100 tablosu) | savaş dışı | oyunda karşılığı yok | oluşturucuda isteğe bağlı rastgele biblo (salt metin) |

## 3. Sınıflar (Classes) (s. 28–82)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Sınıflar s. 28 | Barbarian: Çekirdek özellikler (1. sv) | kısmi | `data/classes.json` (d12, STR/CON, 2/6 beceri, Simple+Martial, Light/Medium+Shield); `classFeatures.test.ts` (hitDie), `data.test.ts`; P1 (save); BARBARIAN-DENETIM S1, B1, B2, B9 | Başlangıç ekipmanı A/B yok: öneri Greataxe + Handaxe (4 Handaxe, Explorer's Pack, 15 GP / B: 75 GP yok; genel SD3); Ekipman paketi A/B seçimi ya da öneriyi SRD A seçeneğine eşitle (genel SD3 kararı) |
| Sınıflar s. 28 | Barbarian: Sınıf tablosu (Rages, Rage Damage, Weapon Mastery) (1. sv) | var-test edilmiş | `class-features.json` (`rage`, `weaponMastery` sütunları); `rage.test.ts`, `classFeatures.test.ts`, `mastery.test.ts`, `k10.test.ts`; P1 1–20; BARBARIAN-DENETIM S2, B3, B4 | Rage 4–6 ve Rage Damage +3/+4 (9/16. seviye) yalnız probe (P1); kalıcı 1–20 tablo testi yok; P1 tablolarını (Rage, Rage Damage, ustalık 1–20) kalıcı teste çevir (öneri 11) |
| Sınıflar s. 28 | Barbarian: Rage (1. sv) | var-test edilmiş | `rage.ts`, `reduce.ts` (`refreshRage`, `dropBrokenRage`), `class-features.json` `rage`; `rage.test.ts`, `b95barbarian.test.ts`, `k10.test.ts`; BARBARIAN-DENETIM A1–A10, C1, C7, C8, D1–D2, E1, E6–E7; B95-B (A6–A8), B98 (E1) | Serüven'de savaş sonrası Rage taşınması uçtan uca denenmedi (C8; genel K10 kaynak testi var) |
| Sınıflar s. 29 | Barbarian: Unarmored Defense (1. sv) | var-test edilmiş | `class-features.json` `unarmoredDefense`; `classFeatures.test.ts`, `stats.test.ts`; BARBARIAN-DENETIM A11, B10 |  |
| Sınıflar s. 29 | Barbarian: Weapon Mastery (1. sv) | var-test edilmiş | `rules/mastery.ts`, `battle/mastery.ts`, `data/secim-degisim.json`; `mastery.test.ts`, `levelChoices.test.ts`, `b95Secim.test.tsx`; BARBARIAN-DENETIM A12, B4, C4; B95-A |  |
| Sınıflar s. 29 | Barbarian: Danger Sense (2. sv) | var-test edilmiş | `class-features.json` (`saveAdvantage: dex`); `rage.test.ts`, `g01SaveWhy.test.ts`; BARBARIAN-DENETIM A13, E3 | Arayüz: TR açıklama 2014 metni ("Görebildiğin etkilere karşı"; 5.2.1: Incapacitated değilken) (E3); TR açıklamayı 5.2.1 metnine çevir (`data/aciklamalar.json`) |
| Sınıflar s. 29 | Barbarian: Reckless Attack (2. sv) | var-test edilmiş | `rage.ts` (`recklessProblem`), `reduce.ts`; `rage.test.ts`; BARBARIAN-DENETIM A14, D3, D8; B98 (E1) | YZ: taraf değiştirmiş (düşman tarafındaki) Barbarian Reckless/Rage kullanmaz (`ai.ts` `side === 'party'`; D8); YZ'deki taraf koşulunu kaldır (3–4 senaryolu hızlı regresyon) |
| Sınıflar s. 29 | Barbarian: Primal Knowledge (3. sv) | kısmi | `rules/skills.ts`, `class-features.json` (`extraClassSkills`); `rage.test.ts` "Primal Knowledge"; BARBARIAN-DENETIM A15, B5, C6; B95-C | Serüven'de 3. seviyedeki ek sınıf becerisi seçilemez: seçim kipinde beceri alanı yok (`CHOICE_FIELDS`; C6, B95-C ertelendi); Seçim kipinde eksik sınıf becerisini yalnız ekleme (ortak yardımcı; öneri 2) |
| Sınıflar s. 29 | Barbarian: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | `advancement.ts` (4/8/12/16, 19), `levelChoices.ts`; `advancement.test.ts`, `levelChoices.test.ts` (Barbarian 4, Epic Boon); BARBARIAN-DENETIM S10, B7, C5; B95-A |  |
| Sınıflar s. 29 | Barbarian: Extra Attack (5. sv) | var-test edilmiş | `classKit.attacksPerAction`; `classFeatures.test.ts`, `k38.test.ts`; BARBARIAN-DENETIM A16 |  |
| Sınıflar s. 29 | Barbarian: Fast Movement (5. sv) | var-test edilmiş | `class-features.json` (Heavy zırhsız +10 ft); `classFeatures.test.ts` (`speedBonus`), `stats.test.ts`; BARBARIAN-DENETIM A17, B10 |  |
| Sınıflar s. 29 | Barbarian: Feral Instinct (7. sv) | var-test edilmiş | `create.ts` (`feral-instinct` izi, inisiyatif avantajı); `k39.test.ts`; BARBARIAN-DENETIM A18, D7 |  |
| Sınıflar s. 29 | Barbarian: Instinctive Pounce (7. sv) | kısmi | `rage.ts` (Rage girişinde yarım hız ek hareket); `k18h3.test.ts`; BARBARIAN-DENETIM A19, D7 | bilinçli sapma: yarım hız ek hareket turun herhangi bir anında (SRD: Rage'in Bonus Action'ının parçası; DECISIONS 4741) |
| Sınıflar s. 29 | Barbarian: Brutal Strike (9. sv) | kısmi | `brutal.ts`, `features.ts`; `k18h3.test.ts`, `k19tier4a.test.ts`; P2; BARBARIAN-DENETIM A20, D4, E5 | Forceful Blow sonrası yarım hız takip yürüyüşü yok; iki Barbarian'ın Hamstring'i üst üste biner (A20); YZ: yalnız Forceful/Hamstring (D4); Arayüz: kutular Reckless yokken de görünür (E5); Brutal sonrası isteğe bağlı takip hareketi komutu; Hamstring'i hedefte tekil tut (öneri 9); kutuları Reckless yokken gizle |
| Sınıflar s. 30 | Barbarian: Relentless Rage (11. sv) | var-test edilmiş | `damage-effects.ts`, kaynak `relentlessRage`; `k19tier4a.test.ts`, `b95barbarian.test.ts`; BARBARIAN-DENETIM A24, A25, C2; B95-B |  |
| Sınıflar s. 30 | Barbarian: Improved Brutal Strike (13/17) (13. sv) | var-test edilmiş | `brutal.ts`, `divine.ts` (`effectiveAc(…, attacker)`), `reduce.ts`; `k19tier4a.test.ts`, `b95barbarian.test.ts`; BARBARIAN-DENETIM A21–A23, D4; B95-B | YZ: Staggering/Sundering hiç seçilmez, 17. seviyede ikinci etki yok (D4); YZ'ye Staggering/Sundering ve 17'de iki etki (öneri 8; sim regresyonu) |
| Sınıflar s. 30 | Barbarian: Persistent Rage (15. sv) | var-test edilmiş | `capstones.ts`, `reduce.ts` (`dropBrokenRage`); `k19tier4a.test.ts`, `b95barbarian.test.ts`; BARBARIAN-DENETIM A26, A27, C3, E3; B95-B | Arayüz: TR açıklama "ya da sen bitirince" diyor (SRD'de isteğe bağlı bitirme yok; Heavy zırh yazılmamış) (E3); TR açıklamayı SRD 5.2.1 metnine çevir |
| Sınıflar s. 30 | Barbarian: Indomitable Might (18. sv) | var-test edilmiş | `effectDice.ts` (`mightFloor`: STR save ve Athletics); `k19tier4a.test.ts`; BARBARIAN-DENETIM A28 |  |
| Sınıflar s. 30 | Barbarian: Primal Champion (20. sv) | var-test edilmiş | `stats.ts` (STR/CON +4, tavan 25); `k19tier4a.test.ts`; P1; BARBARIAN-DENETIM A29, B8 |  |
| Sınıflar s. 30 | Barbarian / alt sınıf: Frenzy (Path of the Berserker) (3. sv) | var-test edilmiş | `rage.ts` (`canFrenzy`), `features.ts`; `rage.test.ts` "Frenzy"; fikstür `srd-alt-siniflar.json` (gerçek paket `icerik/`); BARBARIAN-DENETIM A30 |  |
| Sınıflar s. 30 | Barbarian / alt sınıf: Mindless Rage (Path of the Berserker) (6. sv) | var-test edilmiş | `mind.ts` (`conditionAura`), `rage.ts` (`mindlessRageClear`); `k18h3.test.ts`, `k17g2.test.ts`; BARBARIAN-DENETIM A31 |  |
| Sınıflar s. 30 | Barbarian / alt sınıf: Retaliation (Path of the Berserker) (10. sv) | kısmi | `reactions.ts` (`retaliate`); `reactions.test.ts`, `b95barbarian.test.ts`; BARBARIAN-DENETIM A32, D6 | Alan/aura bölgesi hasarında (Spirit Guardians vb.) tetiklenmez (ortak tepki kısıtı, CLAUDE.md "Tepkiler"; denetim tam saymış); Bölge/aura hasarında kaynağı 5 ft içindeyse tepki önerisi (Hellish Rebuke ile ortak) |
| Sınıflar s. 30 | Barbarian / alt sınıf: Intimidating Presence (Path of the Berserker) (14. sv) | var-test edilmiş | `apex.ts` (`fearAura`); `k19tier4b.test.ts`, `b95barbarian.test.ts` (Rage uzatma); BARBARIAN-DENETIM A33, C3, D5, E2; B95-B, B95-C, B98 | YZ: hiç kullanmıyor (D5; B95-C ertelendi, denge kararı); YZ kuralı: 30 ft'te ≥ 2 düşman, Frightened bağışıklığı yok (öneri 8; sim regresyonu) |
| Sınıflar s. 31 | Bard: Çekirdek özellikler (1. sv) | kısmi | `data/classes.json` (d8, DEX/CHA, 3 serbest beceri, Simple, Light); `classFeatures.test.ts`, `data.test.ts`; BARD-DENETIM S1, B1–B3; B98 | 3 müzik aleti yetkinliği yok (alet modeli yok; B98 ertelendi); ekipman önerisi Rapier + Dagger (SRD A: Leather, 2 Dagger, enstrüman, Entertainer's Pack, 19 GP; paket/GP genel SD3); Öneriyi 2 Dagger yap (öneri 10); alet yetkinliği beceri/alet sistemiyle birlikte |
| Sınıflar s. 31 | Bard: Sınıf tablosu (Bardic Die, Cantrips, Prepared Spells, slotlar) (1. sv) | var-test edilmiş | `class-features.json` (`Bardic Die` sütunu), `spellLimits`; `classFeatures.test.ts` (slot 1–20), `k6.test.tsx` (1–5), `bard.test.ts` (d6/d8); BARD-DENETIM A8, B4–B6 | Bardic Die d10/d12 ve 6–20 cantrip/hazır sayıları yalnız probe; 1–20 tablo değerlerini kalıcı teste çevir |
| Sınıflar s. 31 | Bard: Bardic Inspiration (1. sv) | kısmi | `bard.ts`, `effectDice.ts`, `rules/attack.ts` (`secondChance` `ask`); `bard.test.ts`, `b94bard.test.ts`, `b98.test.ts`, `k19bard.test.ts`, `k48bard.test.ts`; BARD-DENETIM A1–A8, A10, C1, C5, D1, E1, E3; B94 (A2), B98 (A6, E1) | bilinçli sapma: yalnız ayakta dosta verilir (SRD "another creature"; A3, DECISIONS 5808); zar savaşlar arası taşınmaz (SRD 1 saat; C5, B98 kullanıcı kararı) |
| Sınıflar s. 32 | Bard: Spellcasting (1. sv) | kısmi | `data/classes.json` (CHA), `create.ts`, `builder.ts` (`spellLimits`), `levelChoices.ts`; `classFeatures.test.ts`, `k6.test.tsx`, `levelChoices.test.ts`; BARD-DENETIM A18–A20, B4–B6, B11, C2, C3; B94 | bilinçli sapma: Serüven dışında oluşturucuda serbest düzenleme (seviye başına 1 cantrip + 1 hazır büyü sınırı yok; B11); Serüven'de SRD penceresi (B94) |
| Sınıflar s. 33 | Bard: Büyü listesi (1. sv) | var-test edilmiş | `data/sinif-buyuleri.json` (130 = SRD; 10/23/23/17/10/17/8/11/6/5), `spellList.ts`; `k6.test.tsx` (SRD listesiyle aynı); BARD-DENETIM S12, B7 | Büyü mekaniği ayrı denetimde (`BUYU-DURUM.md`: 339 büyünün 225'i çalışır, 114'ü savaş dışı) |
| Sınıflar s. 32 | Bard: Expertise (2/9) (2. sv) | var-test edilmiş | `rules/skills.ts`, `builder.ts` (`expertiseMax`), `levelChoices.ts`; `classFeatures.test.ts` (2 → 4), `levelChoices.test.ts`; BARD-DENETIM S4, A14, B8, B14; B94 |  |
| Sınıflar s. 32 | Bard: Jack of All Trades (2. sv) | kısmi | `stats.ts` (`jack`), `rules/skills.ts`; `bard.test.ts`; BARD-DENETIM A11, A12, D5 | bilinçli sapma: inisiyatife de yarım yetkinlik ekler (SRD: inisiyatif ham DEX kontrolü, beceri değil; A12, DECISIONS 5809); İnisiyatiften çıkarmayı değerlendir (öneri 8; kural sürümü gerekir) |
| Sınıflar s. 32 | Bard: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | `advancement.ts` (4/8/12/16, 19); `advancement.test.ts`, `levelChoices.test.ts`, `k19tier4b.test.ts` (Boon of Spell Recall: Free Casting); BARD-DENETIM S6, A26, B12 | Bard'a özgü uçtan uca Epic Boon denemesi yok (A26); genel Boon testi var |
| Sınıflar s. 32 | Bard: Font of Inspiration (5. sv) | kısmi | `bard.ts`, `reactions.ts` (`cuttingPaid`), `inspirePayable`; `bard.test.ts`, `b94bard.test.ts`; BARD-DENETIM A9, A22, C1, D2, E2; B94 | Harcanacak slot seçilemez, hep en düşük; eylemsiz geri kazanım ayrı adım değil, verme ile birleşik (A9); YZ: slotla ilham vermez (D2); Slot seçici (arayüz + komutta isteğe bağlı slot seviyesi) |
| Sınıflar s. 33 | Bard: Countercharm (7. sv) | kısmi | `auras.ts`, `effectDice.ts`, `zones.ts` (`against`); `k18h3.test.ts`; BARD-DENETIM A13, D4; B94 | Harita/efsanevi `saveEffect` yolundaki Charmed/Frightened save'lerinde yok (A13, B94 ertelendi); B94 alan/aura uzantısına test bulunamadı; Ortak `saveEffect` yoluna ikinci şans zarı; alan/aura uzantısına kalıcı test |
| Sınıflar s. 33 | Bard: Magical Secrets (10. sv) | var-test edilmiş | `builder.ts` (`spellOptions`), `levelChoices.ts`; `b94bard.test.ts`, `k39.test.ts`, `k18h3.test.ts`; BARD-DENETIM S9, B10; B94 | "Yeni/değiştirilen büyü" kısıtı yalnız Serüven'de; oluşturucuda serbest düzenleme (Spellcasting satırı, B11) |
| Sınıflar s. 33 | Bard: Superior Inspiration (18. sv) | var-test edilmiş | `bard.ts` (`superiorInspirationEvents`), `commands.ts`; `bard.test.ts`; BARD-DENETIM A15, D5 |  |
| Sınıflar s. 33 | Bard: Words of Creation (20. sv) | var-test edilmiş | `spells69.ts`, `class-features.json` (`alwaysPrepared`); `b94bard.test.ts`; BARD-DENETIM A16, A17, D6; B94 | Arayüz: ikinci hedef seçicisi yok (motor `cast_spell.targetIds`; seçilmezse aynı taraftan en yakın; B94 ertelendi); Arayüzde ikinci hedef seçimi |
| Sınıflar s. 35 | Bard / alt sınıf: Bonus Proficiencies (College of Lore) (3. sv) | kısmi | `classSkills 3`; `bard.test.ts` "Bonus Proficiencies"; fikstür `srd-alt-siniflar.json` (gerçek paket `icerik/`); BARD-DENETIM A23 | Serüven'de 3. seviyede 3 ek beceri eklenemez: seçim kipinde beceri alanı yok (`levelChoices.ts` `CHOICE_FIELDS`; kod okuması, Barbarian C6 ile aynı; Bard denetiminde yazılmamış); Seçim kipinde eksik becerinin yalnız eklenmesi (Barbarian öneri 2 ile ortak) |
| Sınıflar s. 35 | Bard / alt sınıf: Cutting Words (College of Lore) (3. sv) | var-test edilmiş | `reactions.ts` (`cuttingWords`, `cuttingWordsDamage`, `cuttingWordsCheck`); `bard.test.ts`, `b94bard.test.ts`; BARD-DENETIM A21, A22, D3; B94 | Kapsam dışı: Game Master'ın istediği tekil beceri kontrolünde tetiklenmez (B94) |
| Sınıflar s. 35 | Bard / alt sınıf: Magical Discoveries (College of Lore) (6. sv) | var-test edilmiş | `builder.ts` (`discoveryCap`, `discoveredSpells`); `k18h3.test.ts`, `b94bard.test.ts`; BARD-DENETIM A24, B9; B94 | Bard seviyesi kazanınca birini değiştirme kısıtı yalnız Serüven'de; oluşturucuda serbest |
| Sınıflar s. 35 | Bard / alt sınıf: Peerless Skill (College of Lore) (14. sv) | var-test edilmiş | `effectDice.ts` (`onFail`, başarıda harcanır); `k19tier4b.test.ts`; BARD-DENETIM A25, D5 |  |
| Sınıflar s. 36 | Cleric: Çekirdek özellikler (1. sv) | kısmi | `data/classes.json` (d8, WIS/CHA, Simple, Light/Medium+Shield, 2/5 beceri), `onerilen-baslangic.json`; `classFeatures.test.ts`, `data.test.ts`; CLERIC-DENETIM S1, B6 | Ekipman: öneri Chain Shirt + Shield + Mace; Holy Symbol, Priest's Pack, 7 GP ve B seçeneği (110 GP) yok (genel SD3; denetim tam saymış); Genel ekipman paketi kararı (SD3) |
| Sınıflar s. 36 | Cleric: Sınıf tablosu (Channel Divinity, Cantrips, Prepared Spells, slotlar) (1. sv) | var-test edilmiş | `class-features.json` (`channelDivinity` sütunu), `spellLimits`; `cleric.test.ts` (CD 2), `k6.test.tsx` (1–5), `classFeatures.test.ts` (slot 1–20); CLERIC-DENETIM A4, B1–B3 | Channel Divinity 3/4 (6/18. seviye) ve 6–20 cantrip/hazır sayıları yalnız probe; 1–20 tablo değerlerini kalıcı teste çevir |
| Sınıflar s. 36 | Cleric: Spellcasting (1. sv) | kısmi | `builder.ts` (`spellLimits`: hazır sayısı tablodan), `levelChoices.ts`, `data/secim-degisim.json`; `k6.test.tsx`, `classFeatures.test.ts`, `levelChoices.test.ts`; CLERIC-DENETIM S2, B1–B3, B7, C5; B93-A | bilinçli sapma: Serüven dışında oluşturucuda serbest düzenleme (Bard B11 ile aynı karar); Serüven'de SRD penceresi (B93); Holy Symbol odağı takip edilmez (etkisiz) |
| Sınıflar s. 37 | Cleric: Divine Order (1. sv) | kısmi | `class-features.json` `cleric:divine-order` (Protector varsayılan, Thaumaturge +1 cantrip); `cleric.test.ts` "Divine Order"; CLERIC-DENETIM A1–A3, B2, B4 | bilinçli sapma: Thaumaturge'ün Arcana/Religion WIS bonusu yok (beceri kontrolü sistemi yok; A3, DECISIONS 4609); Beceri/kontrol sistemi gelince uygula |
| Sınıflar s. 38 | Cleric: Büyü listesi (1. sv) | var-test edilmiş | `data/sinif-buyuleri.json` (109 = SRD; 7/15/17/19/9/13/11/8/5/5), `spellList.ts`; `k6.test.tsx` (SRD listesiyle aynı); CLERIC-DENETIM S13, A29 | Büyü mekaniği ayrı denetimde (`BUYU-DURUM.md`) |
| Sınıflar s. 37 | Cleric: Channel Divinity (Divine Spark, Turn Undead) (2. sv) | kısmi | `cleric.ts`, `sourceDown.ts`, `canavar-turleri.json`; `cleric.test.ts`, `b93cleric.test.ts`, `b94ortak.test.ts`; CLERIC-DENETIM A4–A16, C1, D1–D3, D6, E1, E2, E6; D1/D3 (A12, A15), B93-B, B98 (E2) | bilinçli sapma: Turn Undead menzildeki bütün düşman Undead'i etkiler, alt küme seçilmez (A11, kullanıcı kararı); YZ: Divine Spark yalnız düşmüş dostu kaldırmak için (D3) |
| Sınıflar s. 37 | Cleric: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | `advancement.ts` (4/8/12/16, 19); `advancement.test.ts`, `levelChoices.test.ts`; CLERIC-DENETIM S11, B5 |  |
| Sınıflar s. 37 | Cleric: Sear Undead (5. sv) | var-test edilmiş | `cleric.ts` (tek zar, direnç uygulanır); `cleric.test.ts`, `b93cleric.test.ts`; CLERIC-DENETIM A16 |  |
| Sınıflar s. 38 | Cleric: Blessed Strikes (7. sv) | kısmi | `cleric.ts` (`divineStrikeHit`), `spells.ts` (Potent); `cleric.test.ts`, `b93.test.ts` (yalnız kendi turunda); CLERIC-DENETIM A17, A18, B4; B93-A | bilinçli sapma: Potent Spellcasting bütün hasar cantrip'lerine (Cleric listesi ayrımı yok; A18, DECISIONS 4613); Divine Strike hasar türü otomatik (hedefe iyi işleyen); `spell.classes` ∋ `Clr` süzgeci (ürün kararı; öneri 10) |
| Sınıflar s. 38 | Cleric: Divine Intervention (10. sv) | var-test edilmiş | `anyList.ts` (`freeSpellList.anyFromList`), `economy.ts`, `create.ts`; `b93cleric.test.ts`; CLERIC-DENETIM A21, A22, C2, D5; B93-B | YZ: yalnız son çare ve yalnız hazırlanan büyüyle (D5) |
| Sınıflar s. 38 | Cleric: Improved Blessed Strikes (14. sv) | kısmi | `cleric.ts` (Divine Strike 2d8), `spells.ts` (`potentTempHpEvents`); `b93cleric.test.ts`, `k19tier4b.test.ts`; CLERIC-DENETIM A19, A20; B93-B | bilinçli sapma: Potent'te Cleric listesi ayrımı yok (A18); geçici HP alıcısı otomatik (en yaralı; SRD: kendin ya da 60 ft'te seçtiğin yaratık) (A20); Alıcı seçimi (arayüz) ve liste süzgeci kararı |
| Sınıflar s. 38 | Cleric: Greater Divine Intervention (20. sv) | var-test edilmiş | `spells69.ts`, `ResourceDef.wait`, `CharacterStatus.waits`; `b93cleric.test.ts` (Wish sonrası 2d4 uzun dinlenme); CLERIC-DENETIM A23, C3; B93-B |  |
| Sınıflar s. 40 | Cleric / alt sınıf: Disciple of Life (Life Domain) (3. sv) | var-test edilmiş | `spells.ts`, `spells69.ts` (`massHealEvents`); `cleric.test.ts`, `b93cleric.test.ts`; fikstür `srd-alt-siniflar.json` (gerçek paket `icerik/`); CLERIC-DENETIM A24, A30, E5; B93-B | Power Word Heal bütün HP verdiği için etkisiz (tam can); Arayüz: alt sınıf TR adı üç farklı (E5, bilinçli); Life Domain TR adını tek yere bağla (öneri 11) |
| Sınıflar s. 40 | Cleric / alt sınıf: Life Domain Spells (3. sv) | var-test edilmiş | fikstür `alwaysPrepared` 3/5/7/9; `cleric.test.ts` (3, 5); CLERIC-DENETIM A28 | 7. ve 9. seviye büyüleri yalnız veri okuması (testte yok); 7/9 satırını teste ekle |
| Sınıflar s. 40 | Cleric / alt sınıf: Preserve Life (Life Domain) (3. sv) | kısmi | `cleric.ts` (CD harcar, 30 ft, Bloodied, yarı HP sınırı); `cleric.test.ts`; CLERIC-DENETIM A26, D1 | bilinçli sapma: iyileştirme bölüşümü otomatik (en yaralıdan), oyuncu dağıtamaz (A26, kullanıcı kararı); Bölüşüm arayüzü (öneri 9; YZ otomatik kalır) |
| Sınıflar s. 40 | Cleric / alt sınıf: Blessed Healer (Life Domain) (6. sv) | var-test edilmiş | `cleric.ts` (`healSelfAfter`), `spells69.ts`; `cleric.test.ts`, `b93cleric.test.ts`; CLERIC-DENETIM A25; B93-B |  |
| Sınıflar s. 40 | Cleric / alt sınıf: Supreme Healing (Life Domain) (17. sv) | var-test edilmiş | `healDice` (`NdM(±K)` kalıbında en yüksek); `cleric.test.ts`; CLERIC-DENETIM A27 | Karma zar ifadesinde en yüksek değer yerine zar atılır (kod okuması; etkilenen büyü sayılmadı); Karma ifadeyi de en yüksek değere çevir ya da kapsamı ölç |
| Sınıflar s. 41 | Druid: Çekirdek özellikler (1. sv) | kısmi | `data/classes.json` (d8, INT/WIS, Simple, Light+Shield, 2/8 beceri), `onerilen-baslangic.json`; `classFeatures.test.ts`, `data.test.ts`; DRUID-DENETIM S1, B1–B3; B94 (B3), B98 | bilinçli sapma: Herbalism Kit alet yetkinliği yok (alet modeli yok; B98 ertelendi); ekipman önerisi Leather + Shield + Quarterstaff + Sickle, paket/kit/9 GP ve B seçeneği yok (SD3); Alet yetkinliği beceri/alet sistemiyle birlikte (B98) |
| Sınıflar s. 41 | Druid: Sınıf tablosu (Wild Shape, Cantrips, Prepared Spells, slotlar) (1. sv) | var-test edilmiş | `class-features.json` (`wildShape` sütunu), `spellLimits`; `druid.test.ts`, `wildShape87.test.ts`, `k6.test.tsx` (1–5), `classFeatures.test.ts` (slot 1–20); DRUID-DENETIM B4, B5; WILD-SHAPE-DENETIM A3, A6–A8 | 6–20 cantrip/hazır sayıları yalnız probe (20/20 seviye SRD ile aynı); 1–20 tablo değerlerini kalıcı teste çevir |
| Sınıflar s. 41 | Druid: Spellcasting (1. sv) | kısmi | `builder.ts` (`spellLimits`), `levelChoices.ts`, `data/secim-degisim.json`; `k6.test.tsx`, `classFeatures.test.ts`, `levelChoices.test.ts`; DRUID-DENETIM S2, A1, B4, B5, B11–B13, C4, C5; B94 | bilinçli sapma: Serüven dışında oluşturucuda serbest düzenleme (B12; Serüven'de SRD penceresi B94); Druidic Focus/bileşen takibi yok (etkisiz, B13) |
| Sınıflar s. 42 | Druid: Druidic (1. sv) | savaş dışı | `class-features.json` `druid:druidic` (`alwaysPrepared`); `druid.test.ts` (Speak with Animals her zaman hazır); DRUID-DENETIM A2, A3 | Savaş dışında var: Speak with Animals her zaman hazır (oluşturucu/kit); gizli dil ve mesajlar hikâye (A3) |
| Sınıflar s. 42 | Druid: Primal Order (1. sv) | kısmi | `class-features.json` `druid:primal-order` (Warden varsayılan); `druid.test.ts` "Primal Order"; DRUID-DENETIM B7, B8; B98 | bilinçli sapma: Magician'ın Arcana/Nature WIS bonusu yok (beceri kontrolü sistemi yok; B8, B98 ertelendi); Beceri/kontrol sistemiyle birlikte (B98) |
| Sınıflar s. 44 | Druid: Büyü listesi (1. sv) | var-test edilmiş | `data/sinif-buyuleri.json` (124 = SRD; 11/18/21/13/18/15/10/6/8/4), `spellList.ts`; `k6.test.tsx` (SRD listesiyle aynı); DRUID-DENETIM S13, B6 | Büyü mekaniği ayrı denetimde (`BUYU-DURUM.md`) |
| Sınıflar s. 42 | Druid: Wild Shape (2. sv) | kısmi | `druid.ts`, `shapeMonster.ts`; `druid.test.ts`, `wildShape87.test.ts`, `shape91.test.ts`, `ws92.test.ts`, `ws92b.test.ts`, `ws92d.test.ts`, `swarm95.test.ts`; WILD-SHAPE-DENETIM A1–A47, C1–C11; WS92, SWARM95; DRUID-DENETIM D1 | bilinçli: süre sayacı yok, biçim/geçici HP savaş sonunda biter (A11, C11); tür direnci birleşimi ⚠ (A29); yok: nesne tutma (A43), multiHex sığması (A46, ertelendi); YZ: biçime yalnız slot bitince; multiHex açıkken `bodyFitProblem` ile sığma denetimi (öneri 1) |
| Sınıflar s. 43 | Druid: Wild Companion (2. sv) | kısmi | `summons.ts` (`wildFey`), `economy.ts`; `b94druid.test.ts`, `ws92b.test.ts`, `k19feat2.test.ts`; DRUID-DENETIM A4, A5, C7, D2; B94, WS92 | bilinçli sapma: familiar yalnız savaş süresince (Long Rest'e dek sürmez; C7); YZ: kullanmıyor (D2, ertelendi) |
| Sınıflar s. 42 | Druid: Wild Shape biçimleri (Beast Shapes) (2. sv) | kısmi | 69 biçim (`eligibleForms`), `shapeMonster.ts`, `data/ws92.json`; `ws92c.test.ts`, `shape91.test.ts`, `wildShape87.test.ts`, `swarm95.test.ts`; WILD-SHAPE-BICIMLER-DENETIM (WS92, SWARM95) | Savaşta etkili 134 SRD girdisinin 134'ü tam (3 savaş dışı); bilinçli sapma: Swarm biçimi geçici HP alır (⚠ yorum, kullanıcı kararı), SRD dışı Leap bonus yeteneği (Giant Frog/Toad) |
| Sınıflar s. 43 | Druid: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | `advancement.ts` (4/8/12/16, 19); `advancement.test.ts`, `levelChoices.test.ts`; DRUID-DENETIM S7, B9 |  |
| Sınıflar s. 43 | Druid: Wild Resurgence (5. sv) | kısmi | `druid.ts` (`toShape`/`toSlot`), `partyStatus.ts`; `druid.test.ts`, `ws92b.test.ts`; DRUID-DENETIM A6–A8, C2, C8, D2; WS92 (B6) | bilinçli sapma: harcanacak slot seçilemez, hep en düşük (A7); YZ: kullanmıyor (D2, ertelendi); Slot seçimi arayüzü (öneri 9) |
| Sınıflar s. 43 | Druid: Elemental Fury (7. sv) | kısmi | `cleric.ts` (`divineStrikeHit`, `bestType`), `spells.ts` (Potent); `druid.test.ts`, `b93.test.ts` (yalnız kendi turunda); DRUID-DENETIM A9–A12, B10, D3; B93-A | bilinçli sapma: Potent bütün hasar cantrip'lerine (Druid listesi ayrımı yok; A9); Primal Strike türü otomatik (A12); Produce Flame fırlatmasına Potent doğrulanmadı; `spell.classes` ∋ `Drd` süzgeci (öneri 6) |
| Sınıflar s. 43 | Druid: Improved Elemental Fury (15. sv) | kısmi | `range.ts` (`spellReach`), `cleric.ts` (2d8); `k19tier4b.test.ts`; DRUID-DENETIM A13, A14; B94 | +300 ft Druid listesinde olmayan cantrip'e de (Fire Bolt 120 → 420; A14, B94 ertelendi); Primal Strike 2d8 yalnız probe; Menzil hesabına sürüm ileterek `Drd` süzgeci (öneri 6); 2d8 için test |
| Sınıflar s. 43 | Druid: Beast Spells (18. sv) | var-test edilmiş | `spells.ts`, `spellComponents.ts` (`gp`/`consumed`); `ws92b.test.ts`, `druid.test.ts`; DRUID-DENETIM A15, A16; WS92; WILD-SHAPE-DENETIM B11, B12 |  |
| Sınıflar s. 43 | Druid: Archdruid (20. sv) | var-test edilmiş | `druid.ts` (`evergreenEvents`, `wild_resurgence` kipi `magician`); `k19tier4b.test.ts` (Nature Magician); DRUID-DENETIM A17–A19, C2; WILD-SHAPE-DENETIM B13–B15 | Evergreen Wild Shape testsiz (yalnız probe); Longevity savaş dışı (hikâye); Evergreen için kalıcı test |
| Sınıflar s. 46 | Druid / alt sınıf: Circle of the Land Spells (3. sv) | var-test edilmiş | fikstür `srd-alt-siniflar.json` (4 arazi, 3/5/7/9; gerçek paket `icerik/`); `druid.test.ts`, `k19feat2.test.ts`, `levelChoices.test.ts`; DRUID-DENETIM A20, B10, C6; B94 | Arazi değişimi Serüven'de uzun dinlenmeden sonra; oluşturucuda serbest |
| Sınıflar s. 46 | Druid / alt sınıf: Land's Aid (Circle of the Land) (3. sv) | kısmi | `druid.ts` (`healable`), `ai/b94.ts` (`druidChoice94`); `druid.test.ts`, `b94druid.test.ts`; DRUID-DENETIM A21–A23, D2; B94 | bilinçli sapma: iyileşen yaratık otomatik (en yaralı; SRD: seçtiğin; A23); İyileşen yaratık seçimi (komutta isteğe bağlı alan; öneri 9) |
| Sınıflar s. 46 | Druid / alt sınıf: Natural Recovery (Circle of the Land) (6. sv) | kısmi | `characterRest.ts` (`arcaneRecovery`), `freeSpellList.alwaysPreparedOnly`, `Screens.tsx` dinlenme paneli; `druid.test.ts`, `b94druid.test.ts`, `k19feat2.test.ts`; DRUID-DENETIM A24–A26, C3, D4; B93-C, B94 | bilinçli sapma: Serüven/yolculuk kısa dinlenmesinde slotlar otomatik, en yüksekten (A25; karakter listesinde seçilir/ertelenir, B93 ortak); YZ: slotsuz büyü kullanımı doğrulanmadı (D4); Serüven kısa dinlenmesinde de seçim/erteleme |
| Sınıflar s. 46 | Druid / alt sınıf: Nature's Ward (Circle of the Land) (10. sv) | var-test edilmiş | `classFeatures.ts`, `reduce.ts` (Poisoned bağışıklığı); `druid.test.ts`, `k18h3.test.ts`; DRUID-DENETIM A27; WILD-SHAPE-DENETIM B18 |  |
| Sınıflar s. 46 | Druid / alt sınıf: Nature's Sanctuary (Circle of the Land) (14. sv) | kısmi | `apex.ts`, `sourceDown.ts` (`endsIfCasterDown`), `ai/b94.ts`; `k19tier4b.test.ts`, `b94ortak.test.ts`, `b94druid.test.ts`; DRUID-DENETIM A28–A31, D2; B94 | bilinçli sapma: 15 ft küp yaklaşık 7 altıgen (merkez + 6 komşu; A29) |
| Sınıflar s. 47 | Fighter: Çekirdek özellikler (1. sv) | kısmi | data/classes.json (d10, STR/CON save, Simple+Martial, Light/Medium/Heavy + Shield, 2/9 beceri; HP 6 + CON); classFeatures.test.ts (isabet zarı), k38.test.ts (HP); FIGHTER-DENETIM B1, B2, B9 | Başlangıç ekipmanı A/B/C paket seçimi yok: öneri + serbest donanım (genel, SD3; TE99 C ertelendi); Başlangıç donanımı paket/altın seçimi (tüm sınıflara ortak, Serüven sonrası) |
| Sınıflar s. 47 | Fighter: Sınıf tablosu (1. sv) | var-test edilmiş | progression.json sütunları (Second Wind, Weapon Mastery) 20/20 SRD ile aynı (probe P1); classFeatures.test.ts (Second Wind 2/3/4, Action Surge 1→2, saldırı 1–4), mastery.test.ts (hak 3→4), advancement.test.ts; FIGHTER-DENETIM A2, A5, A7, A9, B5, B6 | Weapon Mastery 5/6 (10, 16) ve Indomitable 1/2/3 için kalıcı tablo testi (öneri 12) |
| Sınıflar s. 47 | Fighter: Fighting Style (1. sv) | kısmi | class-features.json fighter:fighting-style; advancement.ts (featSlot, featOnce); advancement.test.ts, mastery.test.ts (GWF), levelChoices.test.ts (Serüven `stil`), te99.test.ts; FIGHTER-DENETIM A23, B3, B4; B95 A | Oluşturucu: Defense önerisi yok, boş Fighting Style yuvası sorun sayılmaz (B3). Bilinçli sapma: karakter listesinde seviye başına bir değişim sınırı yok (B4); Serüven'de seviyede 1 değişim (B95); Yeni Fighter'a Defense önerisi ve boş yuva için oluşturucu uyarısı (öneri 10) |
| Sınıflar s. 48 | Fighter: Second Wind (1. sv) | var-test edilmiş | features.ts second_wind (bonus eylem, 1d10 + seviye); features.test.ts, classFeatures.test.ts (2/3/4), characterRest.test.ts (kısa dinlenmede +1); FIGHTER-DENETIM A1, A2, C1, D1, D7, E3, E6; B95 B | YZ: yalnız parti tarafı kullanır, düşman Fighter kullanmaz (D7, bilinçli). Arayüz: kaynak ikonu yok (E6) |
| Sınıflar s. 48 | Fighter: Weapon Mastery (1. sv) | kısmi | rules/mastery.ts, battle/mastery.ts; mastery.test.ts (8 ustalık, hak sayısı, değişim sınırı 1), offhand.test.ts (Nick), levelChoices.test.ts, b95Secim.test.tsx (Serüven seçici); FIGHTER-DENETIM A14–A22, B5, C4, D6, E8; B95 A; TE99 #10 | Bilinçli sapma: Cleave ikinci hedefi otomatik (en az HP), atlanamaz (A15, K2). Push seçimsiz yakın dövüşte yalnız eylemin son saldırısında; seçim pushChoice anahtarıyla (5 ft TE99); Cleave ikinci hedefini oyuncu seçsin/atlayabilsin (K2 karar) |
| Sınıflar s. 48 | Fighter: Action Surge (2. sv) | var-test edilmiş | features.ts, economy.ts (surged, Magic action yasağı); features.test.ts (ek eylem, turda bir, büyü yok), classFeatures.test.ts (17'de 2), characterRest.test.ts; FIGHTER-DENETIM A4–A6, C2, D2, D7, E2, E6 | Arayüz: ipucu 17. seviyedeki ikinci kullanımı yazmıyor, TR ipucunda hâlâ "Atılım" (E2); kaynak ikonu yok (E6). YZ: düşman tarafı kullanmaz (D7); İpucu metnini seviyeye göre düzelt (öneri 7) |
| Sınıflar s. 48 | Fighter: Tactical Mind (2. sv) | kısmi | effectDice.ts (reroll onFail, kaynak secondWind); classTraits.test.ts; FIGHTER-DENETIM A3, A10, D4 | Bilinçli sapma: oyuncuya sorulmadan kendiliğinden kullanılır (SRD "can"; DECISIONS 6390, K1). Tutmazsa kaynak harcanmaz (SRD ile aynı); İkinci şansları oyuncuya sorma kararı (K1; Stroke of Luck ile ortak) |
| Sınıflar s. 48 | Fighter: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | advancement.ts (SRD asiLevels 4/6/8/12/14/16, epic 19); advancement.test.ts, levelChoices.test.ts (Serüven'de ASI ve Boon of Combat Prowess), k19tier4b.test.ts (Peerless Aim); FIGHTER-DENETIM A32, B6, C5; B95 A; TE99 #9, #11 | Oluşturucu: Epic Boon önerisi (Boon of Combat Prowess) yok, yuva boş kalır (B6). Feat etkileri TUR-FEAT-ESYA-DENETIM'de (TE99: Fighting Style feat'i ASI/Epic yuvasında da); Epic Boon önerisi (öneri 10) |
| Sınıflar s. 48 | Fighter: Extra Attack (5. sv) | var-test edilmiş | class-features.json attacksPerAction; classFeatures.test.ts (1–20), k38.test.ts, features.test.ts (Action Surge ile 2 + 2); FIGHTER-DENETIM A7, D2 |  |
| Sınıflar s. 48 | Fighter: Tactical Shift (5. sv) | var-test edilmiş | shift.ts (shift_granted/shift_move); classTraits.test.ts, k19feat.test.ts (fırsat saldırısısız, hareketten düşmez); FIGHTER-DENETIM A8, D3, E3; B95 B | Yaklaşım: kayma bütçesi tur sonuna dek saklanır. Second Wind tam canda da menüde (B95, sürümsüz) |
| Sınıflar s. 48 | Fighter: Indomitable (9. sv) | kısmi | effectDice.ts (reroll d20 + Fighter seviyesi, skipHopeless 97); classTraits.test.ts, b95fighter.test.ts (ölüm save'i, umutsuzda harcanmaz); FIGHTER-DENETIM A9–A11, A29, C3, D4; B95 B | Bilinçli sapma: kendiliğinden kullanılır, oyuncuya sorulmaz (A10, K1). Champion'da sınırlı Indomitable her tur dolan Heroic Inspiration'dan önce harcanır (A29); Yenilenen ikinci şansı önce dene (öneri 6, sürüm); sorma kararı (K1) |
| Sınıflar s. 48 | Fighter: Tactical Master (9. sv) | var-test edilmiş | commands.ts (attack.mastery push/sap/slow), MapBattle.tsx tacticalPick (97); k18h3.test.ts, b95fighter.test.ts; FIGHTER-DENETIM A12, D5, E4; B95 B | YZ: hiç kullanmaz (D5; denge turuna ertelendi); YZ için Sap/Push kuralı + 3–4 senaryolu regresyon (öneri 9) |
| Sınıflar s. 48 | Fighter: Two Extra Attacks (11. sv) | var-test edilmiş | classFeatures.test.ts (11–19: 3 saldırı); probe P2 (Action Surge ile 3 + 3); FIGHTER-DENETIM A7 |  |
| Sınıflar s. 48 | Fighter: Studied Attacks (13. sv) | var-test edilmiş | classTraits.ts, mastery.ts (studied işareti); classTraits.test.ts; FIGHTER-DENETIM A13 |  |
| Sınıflar s. 48 | Fighter: Three Extra Attacks (20. sv) | var-test edilmiş | classFeatures.test.ts (20: 4 saldırı); probe P2 (4 + 4); FIGHTER-DENETIM A7 |  |
| Sınıflar s. 49 | Fighter / alt sınıf: Improved Critical (3. sv) | var-test edilmiş | features.ts critOn 19 (fikstür srd-alt-siniflar.json champion); classTraits.test.ts (kit, doğal 19 kritik); FIGHTER-DENETIM A24, B7, E7 | Ölçüt bizim sürüm (fikstür "Gladyatör"); gerçek icerik/ paketi ve adları görülmedi (Arayüz: E7 doğrulanmadı) |
| Sınıflar s. 49 | Fighter / alt sınıf: Remarkable Athlete (3. sv) | kısmi | create.ts (inisiyatif avantajı), skills.ts (Athletics), features.ts shift_granted; classTraits.test.ts, k19feat3.test.ts; FIGHTER-DENETIM A26, A27 | Başkasının turundaki kritikte (fırsat saldırısı) yarı hız kayması yazılır ama kullanılamadan kendi tur başında kaybolur (A27); Kaymayı o an iste (NeedReaction yolu) ya da DECISIONS'a bilinçli sapma yaz (öneri 8) |
| Sınıflar s. 49 | Fighter / alt sınıf: Additional Fighting Style (7. sv) | kısmi | fikstür featSlot 7; advancement.ts; probe P1/P5 (Defense + Archery AC 17, yinelenen feat reddi); kalıcı test yok; FIGHTER-DENETIM B8; B95 A (not) | Yaklaşık: Serüven'de `stil` iki Fighting Style yuvasını birlikte sayar, ek yuva da seviye başına değişime girer (B95 notu); 7. seviye ikinci yuva için kalıcı test |
| Sınıflar s. 49 | Fighter / alt sınıf: Heroic Warrior (10. sv) | kısmi | reduce.ts (turn_ended; 97: combat_started ile ilk tur), effectDice.ts; k18h3.test.ts, b95fighter.test.ts; FIGHTER-DENETIM A28, A29; B95 B; TE99 #11 | Save'de önce sınırlı Indomitable harcanır, tutmazsa Heroic Inspiration denenmez (A29). TE99'dan beri kullanım oyuncuya sorulur (Sor/Her zaman/Asla); İkinci şans sırası: her tur dolan kaynak önce (öneri 6, sürüm) |
| Sınıflar s. 49 | Fighter / alt sınıf: Superior Critical (15. sv) | var-test edilmiş | critOn 18; classTraits.test.ts (15. seviye kit 18); probe P2 (Unarmed doğal 18); FIGHTER-DENETIM A25 |  |
| Sınıflar s. 49 | Fighter / alt sınıf: Survivor (18. sv) | var-test edilmiş | commands.ts (Defy Death ölüm save'i avantajı + 18–20 → 20, Heroic Rally 5 + CON); classTraits.test.ts (Heroic Rally); FIGHTER-DENETIM A30, A31 | Defy Death yalnız probe P2 ile doğrulandı, kalıcı test yok; Defy Death testi (öneri 12) |
| Sınıflar s. 49 | Monk: Çekirdek özellikler (1. sv) | kısmi | data/classes.json (d8, STR/DEX save, Simple + Light Martial, zırh yok, 2/6 beceri); classFeatures.test.ts (isabet zarı); MONK-DENETIM B1–B3, B7 | Artisan's Tools ya da Musical Instrument yetkinliği yok (alet modeli yalnız Thieves' Tools, TE99 #12); başlangıç ekipmanı A/B paket seçimi yok (genel); Genel alet yetkinliği ve paket seçimi (TE99 C ertelendi) |
| Sınıflar s. 50 | Monk: Sınıf tablosu (1. sv) | var-test edilmiş | progression.json (Martial Arts, Focus Points, Unarmored Movement) 20/20 SRD ile aynı (probe); monk.test.ts (1d6/1d8, Focus), classFeatures.test.ts (Unarmored Movement 1–20); MONK-DENETIM A1, A10, A15 | Martial Arts 1d10/1d12 ve Focus 1–20 için kalıcı tablo testi (öneri 14) |
| Sınıflar s. 50 | Monk: Martial Arts (1. sv) | kısmi | weapons.ts martialArtsFor, economy.ts bonus_strike, forced.ts shoveDc; monk.test.ts (zar, DEX, zırh/kalkanla yok, bonus vuruş); MONK-DENETIM A1–A8, B7; B95 C | Bonus vuruş Monk silahı dışı silah taşırken de açık (A5; eldeki eşya modeli yok, karar K1). Fırlatılan Monk silahında DEX ve Martial Arts zarı yok (A6). Grapple/Shove DEX DC'si yalnız probe ile; A6: fırlatma seçeneğinde Martial Arts (sürümsüz, öneri 7); A5 için eldeki eşya kararı |
| Sınıflar s. 50 | Monk: Unarmored Defense (1. sv) | var-test edilmiş | class-features.json; classFeatures.test.ts, monk.test.ts; MONK-DENETIM A9, B7 |  |
| Sınıflar s. 50 | Monk: Monk's Focus (2. sv) | var-test edilmiş | martial.ts focus_action, economy.ts; monk.test.ts (Flurry 2 vuruş, Patient Defense, Step of the Wind, atlama ×2); MONK-DENETIM A10–A13, C1, D2, D4, E3; B95 C | YZ: Patient Defense ve Step of the Wind kullanmaz (D4; denge turuna ertelendi). Arayüz: Flurry/Patient Defense yardım metni seviye ve alt sınıfa bakmıyor (E3); YZ savunma kuralları (öneri 4), yardım metni (öneri 12) |
| Sınıflar s. 51 | Monk: Unarmored Movement (2. sv) | var-test edilmiş | classFeatures.test.ts (speedBonus 1–20, kalkanla 0); MONK-DENETIM A15 |  |
| Sınıflar s. 51 | Monk: Uncanny Metabolism (2. sv) | var-test edilmiş | martial.ts, commands.ts start_battle; monk.test.ts, k70.test.ts (Beacon of Hope en yüksek); MONK-DENETIM A16, C2 | Savaş başında kendiliğinden kullanılır (SRD "can"; otomatik harcama kararı K3) |
| Sınıflar s. 51 | Monk: Deflect Attacks (3. sv) | var-test edilmiş | reactions.ts (azaltma 1d10 + DEX + seviye, 1 FP ile geri yöneltme); monk.test.ts, reactions.test.ts (menzilli 60 ft); MONK-DENETIM A17, A18, D8 | Azaltma yalnız ana hasar türüne bakar (kod okuması) |
| Sınıflar s. 51 | Monk: Slow Fall (4. sv) | var-test edilmiş | reactions.ts fallReduction (5 × seviye); monk.test.ts, reactions.test.ts; MONK-DENETIM A19 |  |
| Sınıflar s. 51 | Monk: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | advancement.ts (SRD 4/8/12/16, epic 19); levelChoices.test.ts (Serüven'de Monk 4. seviye ASI), advancement.test.ts (genel); MONK-DENETIM B5, C3; B95 A |  |
| Sınıflar s. 51 | Monk: Extra Attack (5. sv) | var-test edilmiş | classFeatures.test.ts, k38.test.ts, k7.test.ts; MONK-DENETIM A20 |  |
| Sınıflar s. 51 | Monk: Stunning Strike (5. sv) | kısmi | stunning.ts, martial.ts (97: başarıda hız yarı, meleeHit.unarmed/monkWeapon); monk.test.ts, b95monk.test.ts; MONK-DENETIM A21–A23, A38, D1; B95 B | Yorum: isabet anı yerine "bu tur son vurulan hedef" (K2 karar bekliyor); fırsat saldırısındaki isabette kullanım doğrulanmadı (A38); K2 kararı; fırsat saldırısı senaryosunu teste çevir |
| Sınıflar s. 51 | Monk: Empowered Strikes (6. sv) | var-test edilmiş | create.ts altDamageType force; k17g2.test.ts; MONK-DENETIM A24 | Force/normal tür hedefe göre otomatik seçilir |
| Sınıflar s. 51 | Monk: Evasion (7. sv) | var-test edilmiş | classTraits.ts (Rogue ile ortak); k39.test.ts (7. seviye işaret), classTraits.test.ts (0/yarı, Incapacitated); MONK-DENETIM A25 |  |
| Sınıflar s. 51 | Monk: Acrobatic Movement (9. sv) | kısmi | flight.ts, deepWater.ts (featuresK19; kod okuması); kalıcı test yok; MONK-DENETIM A26 | Tur ayrımı yok: dikey yüzey ve sıvı üstünde yürüme başkasının turunda ve tur sonunda da sürer (SRD: yalnız kendi turunda); Sıvı üstü yürümeyi kendi turuna sınırla + test (öneri 11, sürüm) |
| Sınıflar s. 51 | Monk: Heightened Focus (10. sv) | kısmi | economy.ts (Flurry 3), martial.ts (Patient Defense geçici HP); k17g2.test.ts, k18h3.test.ts; MONK-DENETIM A11, A12, A14 | Step of the Wind ile 5 ft içindeki gönüllü Large/küçük yaratığı taşıma yok (A14, bilinen); Dost taşıma (öneri 10, sürüm) |
| Sınıflar s. 52 | Monk: Self-Restoration (10. sv) | kısmi | classTraits.ts; k17g2.test.ts, b95monk.test.ts (97: tur sonunda tek durum); MONK-DENETIM A27, C6; B95 B | Yaklaşık: kalkan durum listedeki ilk (Charmed, Frightened, Poisoned), oyuncu seçmez. Açlık/susuzluk Exhaustion kısmı yok (açlık sistemi yok; bilinçli sapma C6) |
| Sınıflar s. 52 | Monk: Deflect Energy (13. sv) | var-testsiz | reactions.ts:200 (her hasar türü); probe (12'de azaltma yok, 13'te 12 → 0); kalıcı test yok; MONK-DENETIM A28 | 12/13 farkı için test (öneri 14) |
| Sınıflar s. 52 | Monk: Disciplined Survivor (14. sv) | var-test edilmiş | effectDice.ts (1 FP ile yeniden atış), bütün save yetkinliği; k19tier4a.test.ts; MONK-DENETIM A29 | Yeniden atış başarısızlıkta kendiliğinden, Focus harcar (SRD "can"; K3). Save yetkinliği yalnız probe ile |
| Sınıflar s. 52 | Monk: Perfect Focus (15. sv) | var-test edilmiş | capstones.ts capstoneStartEvents; k19tier4a.test.ts; MONK-DENETIM A30 |  |
| Sınıflar s. 52 | Monk: Superior Defense (18. sv) | var-test edilmiş | capstones.ts (3 FP, Force hariç direnç; 97: 10 tur); k19tier4a.test.ts, b95monk.test.ts; MONK-DENETIM A31, D7; B95 B | YZ: kullanmaz (D7; denge turuna ertelendi); YZ kuralı (öneri 4) |
| Sınıflar s. 52 | Monk: Body and Mind (20. sv) | var-test edilmiş | k19tier4a.test.ts (DEX/WIS +4, en çok 25); MONK-DENETIM A32 |  |
| Sınıflar s. 52 | Monk / alt sınıf: Open Hand Technique (3. sv) | var-test edilmiş | martial.ts (Addle/Push/Topple; fikstür srd-alt-siniflar.json); monk.test.ts (Topple, Addle); MONK-DENETIM A33, D3, E2, E7 | Arayüz: hep Topple gönderir, Addle/Push seçilemez (E2, bilinçli). YZ: hep Topple (D3). Push 15 ft yalnız probe ile. Gerçek paket ("Sadelik Disiplini") görülmedi (E7); Flurry isabetinden sonra teknik seçici (öneri 13) |
| Sınıflar s. 52 | Monk / alt sınıf: Wholeness of Body (6. sv) | kısmi | divine.ts selfHeal; k18h3.test.ts; MONK-DENETIM A34, C2, D5; B95 C | WIS negatifken eklenmiyor (fikstür: zar + WIS, en az 1 HP) (A34). YZ: kullanmaz (D5); roll + WIS, en az 1 (öneri 9, sürüm) |
| Sınıflar s. 52 | Monk / alt sınıf: Fleet Step (11. sv) | var-test edilmiş | economy.ts (başka bonus eylemden sonra Step of the Wind, turda bir, Focus harcar); k19tier4b.test.ts; MONK-DENETIM A35, D4 | YZ: Step of the Wind'i (Fleet Step dahil) kullanmaz (D4) |
| Sınıflar s. 52 | Monk / alt sınıf: Quivering Palm (17. sv) | kısmi | apex.ts; k19tier4b.test.ts, b95monk.test.ts (97: yalnız Unarmed Strike); MONK-DENETIM A36, A37, D6; B95 B | Bilinçli sapma: titreşimi bitirmek ayrı eylem (SRD: Attack eyleminde bir saldırının yerine; fikstür notu da eylem) (A37). YZ: kurmaz ve bitirmez (D6) |
| Sınıflar s. 53 | Paladin: Çekirdek özellikler (1. sv) | kısmi | data/classes.json (d10, WIS/CHA save, Simple+Martial, Light/Medium/Heavy + Shield, 2/6 beceri); classFeatures.test.ts (isabet zarı); PALADIN-DENETIM B7 | Başlangıç ekipmanı A/B paket seçimi yok: öneri + serbest donanım (genel, SD3; denetim B7 "tam" saymış); Başlangıç donanımı paket/altın seçimi (genel) |
| Sınıflar s. 53 | Paladin: Sınıf tablosu (1. sv) | var-test edilmiş | progression.json (Channel Divinity, Prepared Spells, slot1–5) 20/20 (probe P1); classFeatures.test.ts (yarı büyücü slotları), paladin.test.ts (CD 2, LoH), balance.test.ts (hazır sayısı ≤ tablo), k38.test.ts; PALADIN-DENETIM A12, B1, B2 | Hazır büyü sayısı 1–20 için kalıcı test |
| Sınıflar s. 53 | Paladin: Lay On Hands (1. sv) | var-test edilmiş | divine.ts healPool (bonus eylem, dokunuş, 5 puanla Poisoned); paladin.test.ts, b98.test.ts (98: herhangi bir yaratık); PALADIN-DENETIM A1–A4, C1, D1, E1; B94, B98 | YZ: 0 HP olmayan yaralı dostu iyileştirmez (D1, basit kural); düşmanı iyileştirmez |
| Sınıflar s. 54 | Paladin: Spellcasting (1. sv) | kısmi | spellLimits/spellSlots (SRD tablosu, CHA, cantrip yok); classFeatures.test.ts (slotlar), paladin.test.ts (her zaman hazırlar sayıya girmez), levelChoices.test.ts (uzun dinlenmede 1 değişim); PALADIN-DENETIM B1–B4, B11, C6; B94 A1 | Bilinçli sapma (genel): karakter listesinde hazır büyü değişimi dinlenme şartsız serbest (B11); Serüven'de uzun dinlenmede 1 (B94) |
| Sınıflar s. 54 | Paladin: Weapon Mastery (1. sv) | kısmi | classKit weaponMastery 2; paladin.test.ts, mastery.test.ts (değişim: hepsi), levelChoices.test.ts; PALADIN-DENETIM A11, B8, B11, C4; B94 A1 | Bilinçli sapma (genel): karakter listesinde değişim dinlenme şartsız (B11); Cleave ikinci hedefi otomatik (FIGHTER-DENETIM A15) |
| Sınıflar s. 55 | Paladin: Büyü listesi (1. sv) | var-test edilmiş | data/spells*.json "Pal" 38 = SRD 38 (13/11/6/4/4; probe P1); spells.test.ts (sınıf kodları SRD ile aynı), data.test.ts; PALADIN-DENETIM A9, B5; B98 | Liste tam; büyü mekaniklerinin kapsamı ayrı (BUYU-DURUM.md). Divine Smite "isabetten hemen sonra" yerine "bu tur son vurulan hedef" (yaklaşım, B98) |
| Sınıflar s. 54 | Paladin: Fighting Style (2. sv) | kısmi | class-features.json paladin:fighting-style (feat ya da Blessed Warrior); paladin.test.ts (Blessed Warrior), levelChoices.test.ts (Serüven seviyede 1 değişim); PALADIN-DENETIM A10, B3, B9, C5; B94 A1 | Oluşturucuda Blessed Warrior cantrip'inin seviye başına 1 değişim sınırı doğrulanmadı (B9); Serüven'de uygulanıyor (B94); Oluşturucu kuralını doğrula ve teste bağla |
| Sınıflar s. 54 | Paladin: Paladin's Smite (2. sv) | var-test edilmiş | spells.ts executeSmite, kaynak paladinsSmite (ilk kullanım slotsuz); paladin.test.ts; PALADIN-DENETIM A6, A8, D2 | Divine Smite büyüsünün zamanlaması "Büyü listesi" satırında |
| Sınıflar s. 54 | Paladin: Channel Divinity (3. sv) | var-test edilmiş | kaynak channelDivinity (2/3, kısa +1, uzun hepsi); paladin.test.ts, k19feat2.test.ts ve b94paladin.test.ts (Divine Sense 10 dk, Incapacitated'da biter); PALADIN-DENETIM A12–A14, C2, D4; B94 | Divine Sense'in kutsanmış/lanetlenmiş yer ve nesne algısı savaş dışı, modelde yok |
| Sınıflar s. 55 | Paladin: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | advancement.ts (SRD 4/8/12/16, epic 19); advancement.test.ts (genel), levelChoices.test.ts (Serüven'de eklenir); probe P5; PALADIN-DENETIM B6, C5; B94 A1 |  |
| Sınıflar s. 55 | Paladin: Extra Attack (5. sv) | var-test edilmiş | classFeatures.test.ts, paladin.test.ts, k38.test.ts; PALADIN-DENETIM A15 |  |
| Sınıflar s. 55 | Paladin: Faithful Steed (5. sv) | var-test edilmiş | kaynak faithfulSteed (Find Steed hep hazır, slotsuz bir kez), summons.ts; summons.test.ts, paladin.test.ts; PALADIN-DENETIM A16, C3, D7 | Veri etiketi class-features.json'da hâlâ "partial" (eski). YZ: Find Steed yapmaz (D7, bilinçli); paladin:faithful-steed durumunu "ok" yap (öneri 10) |
| Sınıflar s. 55 | Paladin: Aura of Protection (6. sv) | var-test edilmiş | auras.ts (94: kendi bonusu aura yolundan, ownAuraOf/sourceDown); k18h3.test.ts, b94ortak.test.ts; PALADIN-DENETIM A17, E6; B94 A2 | Arayüz: savaşta aura halkası çizilmiyor (E6, bilinen) |
| Sınıflar s. 55 | Paladin: Abjure Foes (9. sv) | kısmi | cleric.ts abjure, etki oneEconomy (94); k18h3.test.ts, b94paladin.test.ts (tek ekonomi kısıtı, YZ); PALADIN-DENETIM A18, D5; B94 | Hedef seçimi: yalnız ilk hedef komuttan, kalanı otomatik (en çok HP); yalnız düşman; Bütün hedefleri oyuncu seçsin (öneri 5 kalan kısmı) |
| Sınıflar s. 55 | Paladin: Aura of Courage (10. sv) | kısmi | mind.ts conditionAura, frightenedNow; k17g2.test.ts, k19feat3.test.ts; PALADIN-DENETIM A19 | Aura mesafesi 2B (3B auraDist kullanılmıyor; dikey ve kat döşemesi ayrımı yok); auraDist'e bağla (öneri 8 kalan kısmı, sürüm) |
| Sınıflar s. 55 | Paladin: Radiant Strikes (11. sv) | var-test edilmiş | class-features.json; k19tier4a.test.ts, b98.test.ts (98: fırlatılan Melee silah); PALADIN-DENETIM A20; B98 |  |
| Sınıflar s. 55 | Paladin: Restoring Touch (14. sv) | kısmi | divine.ts curesOf (her durum 5 puan); k19tier4a.test.ts; PALADIN-DENETIM A5, E2 | Durumlar seçilemez: havuz yettikçe sırayla hepsi kalkar (motor ve arayüz; E2); Durum seçici (öneri 7 kalan kısmı) |
| Sınıflar s. 55 | Paladin: Aura Expansion (18. sv) | var-testsiz | auras.ts radiusOf (≥ 18 → 6 altıgen, üç aura); probe P2 (17: 0, 18: 6 altıgen); kalıcı test yok; PALADIN-DENETIM A21 | 17/18 mesafe testi |
| Sınıflar s. 56 | Paladin / alt sınıf: Oath of Devotion Spells (3. sv) | kısmi | fikstür srd-alt-siniflar.json (3: PEG, Shield of Faith; 5: Aid, Zone of Truth); paladin.test.ts; PALADIN-DENETIM A26, E7; B94 | Fikstürde 9/13/17. seviye büyüleri (Beacon of Hope, Dispel Magic, Freedom of Movement, Guardian of Faith, Commune, Flame Strike) yok; gerçek pakette doğrulanmadı (B94: kullanıcı kararı, ölçüt paket); icerik/ paketinde 9/13/17 satırlarını kontrol et |
| Sınıflar s. 56 | Paladin / alt sınıf: Sacred Weapon (3. sv) | var-test edilmiş | divine.ts (94: tek silah enchantBy, endsOnDrop, 20 + 20 ft ışık); paladin.test.ts, b94paladin.test.ts; PALADIN-DENETIM A22, D3; B94 | Radiant/normal tür seçimi otomatik (hedef dirençliyse Radiant) |
| Sınıflar s. 56 | Paladin / alt sınıf: Aura of Devotion (7. sv) | kısmi | mind.ts conditionAura, range.ts inProtectiveAura; k17g2.test.ts, k19feat3.test.ts; PALADIN-DENETIM A23 | Aura mesafesi 2B (Aura of Courage ile aynı kod yolu; 3B auraDist yok); auraDist'e bağla (sürüm) |
| Sınıflar s. 57 | Paladin / alt sınıf: Smite of Protection (15. sv) | var-test edilmiş | cover.ts grantedHalfCover, coverAura (94: aurada kaldıkça); k19tier4b.test.ts, b94paladin.test.ts; PALADIN-DENETIM A24; B94 |  |
| Sınıflar s. 57 | Paladin / alt sınıf: Holy Nimbus (20. sv) | var-test edilmiş | apex.ts, divine.ts (94: 5. seviye slotla yenileme, sunlight, Paladin düşmüşken durur); k19tier4b.test.ts, b94paladin.test.ts, b94ortak.test.ts; PALADIN-DENETIM A25, C3, D6; B94 | YZ: Holy Nimbus için slot harcamaz (bilinçli) |
| Sınıflar s. 57 | Ranger: Çekirdek özellikler (1. sv) | kısmi | data/classes.json (d10, STR/DEX save, Simple+Martial, Light/Medium + Shield, 3/8 beceri); classFeatures.test.ts (isabet zarı); RANGER-DENETIM B4, B11 | Başlangıç ekipmanı A/B paket seçimi yok: öneri + serbest donanım (genel, SD3); Başlangıç donanımı paket/altın seçimi (genel) |
| Sınıflar s. 58 | Ranger: Sınıf tablosu (1. sv) | var-test edilmiş | progression.json (Favored Enemy, Prepared Spells, slot1–5) 20/20 (probe); classFeatures.test.ts (Favored Enemy 2→6, slotlar), balance.test.ts, b94ranger.test.ts; RANGER-DENETIM A2, A4, B1 |  |
| Sınıflar s. 57 | Ranger: Spellcasting (1. sv) | kısmi | classes.json casting WIS; spellLimits/spellSlots (SRD tablosu); classFeatures.test.ts, b94ranger.test.ts, levelChoices.test.ts; RANGER-DENETIM A1–A3, B1, B2, C3, C4; B94 | Bilinçli sapma (genel, PALADIN-DENETIM B11 ile aynı): karakter listesinde hazır büyü değişimi dinlenme şartsız; Serüven'de uzun dinlenmede 1 (B94) |
| Sınıflar s. 58 | Ranger: Favored Enemy (1. sv) | var-test edilmiş | kaynak favoredEnemy (freeSpell, 94: alwaysPrepared); classFeatures.test.ts, features.test.ts (slotsuz HM), b94ranger.test.ts (hep hazır, sayıya girmez); RANGER-DENETIM A4–A6, B3, C1, D1, E4; B94 | Arayüz: slot seçicide Favored Enemy hakkı görünmez, hak varken en düşük slotla HM yapılamaz (E4, doğrulanmadı); Slot seçicide "Slotsuz: Favored Enemy (N)" düğmesi (öneri 7) |
| Sınıflar s. 58 | Ranger: Weapon Mastery (1. sv) | kısmi | classKit weaponMastery 2, değişim hepsi; mastery.test.ts, levelChoices.test.ts; RANGER-DENETIM A9, B5, C3; B94 | Bilinçli sapma: Cleave ikinci hedefi otomatik (FIGHTER-DENETIM A15); karakter listesinde değişim dinlenme şartsız (genel) |
| Sınıflar s. 60 | Ranger: Büyü listesi (1. sv) | var-test edilmiş | data/spells*.json "Rgr" 48 = SRD 48 (13/15/12/5/3); spells.test.ts (sınıf kodları SRD ile aynı), data.test.ts; RANGER-DENETIM A5–A8, A28, A29 | Liste tam; büyü mekaniklerinin kapsamı ayrı: 18 tam, 14 yaklaşık, 16 savaş dışı (A29, BUYU-DURUM.md). Hunter's Mark'ın izleme (Perception/Survival) avantajı yok (A8, bilinçli sapma) |
| Sınıflar s. 59 | Ranger: Deft Explorer (2. sv) | kısmi | kit.expertise 1 (2–8. seviye); classFeatures.test.ts; RANGER-DENETIM B6, B7 | Bilinçli sapma: iki dil yok (dil sistemi yok, savaş dışı) (B7) |
| Sınıflar s. 59 | Ranger: Fighting Style (2. sv) | kısmi | class-features.json (alternatives druidic-warrior); k19feat2.test.ts (Druidic Warrior), levelChoices.test.ts; RANGER-DENETIM A11, B8, C4; B94 | Bilinçli sapma: oluşturucuda Druidic Warrior cantrip değişimi seviye başına sınırsız (B8); Serüven'de seviyede 1 (B94) |
| Sınıflar s. 59 | Ranger: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | advancement.ts (SRD 4/8/12/16, epic 19); advancement.test.ts (genel), levelChoices.test.ts; RANGER-DENETIM B9 |  |
| Sınıflar s. 59 | Ranger: Extra Attack (5. sv) | var-test edilmiş | classFeatures.test.ts, k38.test.ts; probe (YZ iki saldırı); RANGER-DENETIM A10, D2 |  |
| Sınıflar s. 59 | Ranger: Roving (6. sv) | kısmi | classFeatures.ts (+10 ft, Heavy zırhta yok), flight.ts climbs/swimsByTrait; k19feat2.test.ts (çok derin su); RANGER-DENETIM A12, A13 | Duvar tırmanışı (K68b) ve sığ/derin suda yüzme maliyeti doğrulanmadı; tırmanma/yüzme yalnız featuresK19 anahtarıyla (A13); Tırmanma ve yüzme için test yaz, gerekirse düzelt (öneri 6) |
| Sınıflar s. 59 | Ranger: Expertise (9. sv) | var-test edilmiş | kit.expertise 3; classFeatures.test.ts, levelChoices.test.ts (Serüven'de eklenir); RANGER-DENETIM B6, C4; B94 |  |
| Sınıflar s. 59 | Ranger: Tireless (10. sv) | var-test edilmiş | divine.ts temp_hp, characterRest.ts tirelessAfter; k18h3.test.ts (kısa dinlenme Exhaustion −1), b94ranger.test.ts (YZ), classTraits.test.ts (kaynak); RANGER-DENETIM A14, C1, C2, D4; B94 | Geçici HP miktarı (1d8 + WIS) ve kullanım sayısı yalnız probe ile |
| Sınıflar s. 59 | Ranger: Relentless Hunter (13. sv) | var-testsiz | damage-effects.ts:90; probe (12'de konsantrasyon save'i var, 13'te yok); kalıcı test yok; RANGER-DENETIM A15 | 12/13 farkı için test (öneri 9) |
| Sınıflar s. 59 | Ranger: Nature's Veil (14. sv) | var-test edilmiş | class-features.json naturesVeil (bonus eylem, Invisible); b94ranger.test.ts (YZ, komut geçer), classTraits.test.ts (kaynak); RANGER-DENETIM A16, C1, D4; B94 | Invisible süresi (sonraki turun sonu) yalnız probe ile |
| Sınıflar s. 59 | Ranger: Precise Hunter (17. sv) | var-test edilmiş | classTraits.ts; classTraits.test.ts; RANGER-DENETIM A17 |  |
| Sınıflar s. 59 | Ranger: Feral Senses (18. sv) | var-test edilmiş | sight.ts, maprules.ts (30 ft Blindsight); k19feat2.test.ts, classTraits.test.ts; RANGER-DENETIM A18 |  |
| Sınıflar s. 59 | Ranger: Foe Slayer (20. sv) | var-test edilmiş | classTraits.ts markDie d10; classTraits.test.ts; RANGER-DENETIM A19 |  |
| Sınıflar s. 61 | Ranger / alt sınıf: Hunter's Lore (3. sv) | var-test edilmiş | spells.ts (HM yapılınca günlük notu, featuresK19; fikstür srd-alt-siniflar.json hunter); k19feat3.test.ts; RANGER-DENETIM A20, E2 | Arayüz: bilgi yalnız HM yapılınca günlükte; hedef kartında sürekli gösterim doğrulanmadı. Gerçek paket adları görülmedi |
| Sınıflar s. 61 | Ranger / alt sınıf: Hunter's Prey (3. sv) | var-test edilmiş | classTraits.ts (Colossus Slayer, horde_breaker; 94: aynı silah, bu tur saldırılmamış hedef); classTraits.test.ts, b94ranger.test.ts, levelChoices.test.ts (dinlenmede değişim); RANGER-DENETIM A21, A22, B10, C3, D2; B94 |  |
| Sınıflar s. 61 | Ranger / alt sınıf: Defensive Tactics (7. sv) | var-test edilmiş | classTraits.ts (Escape the Horde, Multiattack Defense); classTraits.test.ts; RANGER-DENETIM A23, A24, B10 |  |
| Sınıflar s. 61 | Ranger / alt sınıf: Superior Hunter's Prey (11. sv) | kısmi | classTraits.ts superiorPreyEvents (turda bir, 30 ft); k74.test.ts; RANGER-DENETIM A25 | İkinci hedef otomatik (en düşük HP'li düşman), oyuncu seçemez (A25); Komutta isteğe bağlı hedef seçimi (öneri 5) |
| Sınıflar s. 61 | Ranger / alt sınıf: Superior Hunter's Defense (15. sv) | kısmi | reactions.ts hunterDefenseEvents (94: save'li ve otomatik isabetli büyüde de); reactions.test.ts, k19tier4b.test.ts, b94ranger.test.ts; RANGER-DENETIM A26, D5; B94 | Süren hasar, büyü alanı/aura, harita mekaniği ve düşme hasarında tetiklenmez (ortak hasar girişi yok; B94'te ertelendi). YZ: öneri yalnız ağır hasarda (D5, bilinçli); Ortak hasar girişine tepki kancası (öneri 4, sürüm) |
| Sınıflar s. 61 | Rogue: Çekirdek özellikler (1. sv) | kısmi | data/classes.json rogue (d8, DEX/INT, 4/10 beceri, Simple + Finesse/Light Martial, Light zırh, tools thieves-tools); classFeatures.test.ts (HP zarı), advancement.test.ts (beceri), te99.test.ts (Thieves' Tools); ROGUE-DENETIM B1–B3; DECISIONS TE99-12 | Başlangıç donanımı A/B paketi yok (öneri genel, TE99'da ertelendi); Thieves' Tools envanter modeli yok (yetkin olan taşıyor sayılır, TE99 ⚠).; Oluşturucuya sınıf başlangıç paketi (A/B ya da GP); envanterle alet taşıma. |
| Sınıflar s. 62 | Rogue: Sınıf tablosu (1. sv) | var-test edilmiş | progression.json Sneak Attack sütunu → class-features.json sneakAttackDice; classFeatures.test.ts (1–20 ⌈sv/2⌉d6); ROGUE-DENETIM A1 |  |
| Sınıflar s. 61 | Rogue: Expertise (1. sv) | var-test edilmiş | classKit expertise 2 (1–5) / 4 (6+); classFeatures.test.ts, advancement.test.ts, levelChoices.test.ts (Serüven 6. sv, B95 A); ROGUE-DENETIM B4, C2; B95 (A) | Serüven dışında karakter ekranında serbest düzenlenir (K17, genel; Rogue denetiminde sapma sayılmadı). |
| Sınıflar s. 61 | Rogue: Sneak Attack (1. sv) | var-test edilmiş | features.ts canSneak/allyNextTo, sneakTurn; features.test.ts, b95rogue.test.ts (fırlatılan Javelin almaz, 97), classFeatures.test.ts; ROGUE-DENETIM A1–A6, D1; B95-B |  |
| Sınıflar s. 62 | Rogue: Thieves' Cant (1. sv) | savaş dışı | class-features.json rogue:thieves-cant status none (hikâye); ROGUE-DENETIM A31 | Dil sistemi yok: savaş dışında da mekanik karşılığı yok, yalnız açıklama (bilinçli, DECISIONS 4654).; Dil sistemi gelirse Thieves' Cant + bir dil seçimi. |
| Sınıflar s. 62 | Rogue: Weapon Mastery (1. sv) | var-test edilmiş | class-features.json weaponMastery count 2; src/battle/mastery.ts; mastery.test.ts, levelChoices.test.ts (uzun dinlenmede hepsi, B95 A); ROGUE-DENETIM A30, B5, C3; B95 (A) | Serüven dışında karakter ekranında serbest düzenlenir (K17, genel). |
| Sınıflar s. 62 | Rogue: Cunning Action (2. sv) | var-test edilmiş | economy.ts bonusActions (dash/disengage/hide); classFeatures.test.ts, economy.test.ts, stealth.test.ts, features.test.ts (YZ Disengage); ROGUE-DENETIM A7, D4–D6 | YZ: bonus Dash hiç üretmiyor (D5); savaşta avantaj için Hide yok (D6).; YZ'ye uzak hedefte bonus Dash ve gizlenme kararı (denge turu). |
| Sınıflar s. 62 | Rogue: Steady Aim (3. sv) | var-test edilmiş | commands.ts steady_aim, economy.speedZero (97); classTraits.test.ts, b95rogue.test.ts (Withdraw kayması 0); ROGUE-DENETIM A8–A9, D2–D3; B95-B | YZ: düşman tarafındaki Rogue karakteri Steady Aim kullanmıyor (D3).; YZ koşulunu taraftan bağımsız yap. |
| Sınıflar s. 63 | Rogue: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | advancement.ts (4/8/10/12/16 + 19); advancement.test.ts (Rogue 10. sv), levelChoices.test.ts (Serüven, B95 A); ROGUE-DENETIM B6, C2; B95 (A) | Boon etkileri feat denetiminde (TUR-FEAT-ESYA-DENETIM F30–F38). |
| Sınıflar s. 63 | Rogue: Cunning Strike (5. sv) | kısmi | classTraits.ts cunningEvents/cunningCost; classTraits.test.ts (Trip, Withdraw), k19feat.test.ts (Poison), b95rogue.test.ts (yan el, fırsat saldırısı, Ready); ROGUE-DENETIM A10–A14, D7; B95-B | bilinçli sapma: Withdraw kayması saldırının hemen ardından değil tur sonuna dek bütçe (A12, K3); Horde Breaker yolunda seçilemez; YZ: yalnız Trip/Withdraw seçer (D7).; K3 kararı (anlık Withdraw); Horde Breaker komutuna cunning alanı; YZ seçenekleri denge turunda. |
| Sınıflar s. 63 | Rogue: Uncanny Dodge (5. sv) | var-test edilmiş | reactions.ts (97: canSeeTarget, görünmez/Blinded'da yok); reactions.test.ts, b95rogue.test.ts; ROGUE-DENETIM A19–A20, D8; B95-B | YZ: yalnız ağır isabette kullanır (D8, bilinçli eşik). |
| Sınıflar s. 63 | Rogue: Evasion (7. sv) | var-test edilmiş | classTraits.ts saveDamage (tek yol, Incapacitated iken yok); classTraits.test.ts; ROGUE-DENETIM A21 |  |
| Sınıflar s. 63 | Rogue: Reliable Talent (7. sv) | kısmi | effectDice.ts checkNatural (yalnız yetkin beceri); classTraits.test.ts; ROGUE-DENETIM A22, B2; DECISIONS TE99-12 | Alet yetkinliği kısmı yok: TE99 Thieves' Tools kilit açma (objects.ts unlock) Reliable Talent'a bakmıyor (kod okuması).; Kilit açma zarına alet yetkinliği tabanı 10 (yeni kural sürümü). |
| Sınıflar s. 63 | Rogue: Improved Cunning Strike (11. sv) | var-test edilmiş | cunningOptions max 2, üçüncü seçim reddi; classTraits.test.ts (11. sv iki seçenek); ROGUE-DENETIM A15 |  |
| Sınıflar s. 63 | Rogue: Devious Strikes (14. sv) | var-test edilmiş | classTraits.ts, economy.ts/movement.ts (Dazed); classTraits.test.ts (14. sv seçenekleri), k19feat.test.ts (Knock Out hasarla biter); ROGUE-DENETIM A16–A18, D7 | Daze ve Obscure süreleri yalnız probe ile doğrulandı (P2e); YZ: hiç seçmiyor (D7).; Daze/Obscure süre testlerini kalıcı teste çevir. |
| Sınıflar s. 63 | Rogue: Slippery Mind (15. sv) | var-test edilmiş | class-features.json saveProficiency WIS/CHA; classTraits.test.ts; ROGUE-DENETIM A23 |  |
| Sınıflar s. 63 | Rogue: Elusive (18. sv) | kısmi | classTraits.ts elusiveFilter (features.ts, monsters.ts, spells.ts); classTraits.test.ts; ROGUE-DENETIM A24–A25 | Karadul (ev kuralı) Tatlı Tuzak avantajı elusiveFilter'dan sonra ekleniyor: Elusive'e rağmen avantaj (A25, düzeltilmedi).; features.ts'te Tatlı Tuzak avantajını filtreden önce ekle (yeni kural sürümü). |
| Sınıflar s. 63 | Rogue: Stroke of Luck (20. sv) | kısmi | effectDice.ts secondChances 'twenty', kaynak strokeOfLuck (kısa/uzun dinlenme); classTraits.test.ts; ROGUE-DENETIM A26–A29, C1, D9; B95 C | bilinçli sapma: oyuncuya sorulmaz, ilk başarısız d20 testinde kendiliğinden (A27, K1); ölüm save'ine uygulanmıyor (A29); 20'ye çevrilen saldırı kritik sayılıyor (A28, K4 yorum).; K1/K4 kararı (B98 'ask' deseni); ölüm save'ine ikinci şans (Indomitable deseni, commands.ts). |
| Sınıflar s. 64 | Rogue / alt sınıf: Fast Hands (3. sv) | kısmi | economy.ts:317 (Utilize bonus eylem, featuresK19); fikstür srd-alt-siniflar.json thief; test yok (P5 probe); ROGUE-DENETIM A32, E4 | Sleight of Hand (cep, tuzak) ve büyülü eşyanın Magic eylemi bonus eylemle yok (fikstür notu: savaş dışı); kilit açma Utilize yoluyla bonus. Arayüz: TR açıklama 'Cunning Action ile' (E4).; Magic eylemli eşya kullanımına Fast Hands bonus yolu; Utilize bonus eylem testi. |
| Sınıflar s. 64 | Rogue / alt sınıf: Second-Story Work (3. sv) | var-test edilmiş | flight.ts climbs (climber), movement.ts jumper-dex (97, data/ozellik-isaret.json); b95rogue.test.ts, k19feat3.test.ts; ROGUE-DENETIM A33–A34; B95-B |  |
| Sınıflar s. 64 | Rogue / alt sınıf: Supreme Sneak (9. sv) | kısmi | classTraits.ts Cunning Strike 'stealth' (1d6); k18h3.test.ts (¾ siperde gizli kalır); ROGUE-DENETIM A35, E3 | bilinçli sapma (fikstür notu 'yaklaşık'): siper saldırı anında bakılıyor, SRD'de turun sonunda; Arayüz: cunningName'de 'stealth' yok, balonda ham ad (E3).; Tur sonu siper denetimi; cunningName.stealth TR/EN 'Stealth Attack'. |
| Sınıflar s. 64 | Rogue / alt sınıf: Use Magic Device (13. sv) | kısmi | spells.ts feature_used item: 1d6 (kod); fikstür thief; test yok; ROGUE-DENETIM A36 | doğrulanmadı (test ya da probe yok); Attunement sınırı 4 ve her Spell Scroll'u kullanma (Arcana DC) savaş dışı/yok.; Şarjda 1d6 = 6 harcanmaz testi; parşömen kuralı kararı. |
| Sınıflar s. 64 | Rogue / alt sınıf: Thief's Reflexes (17. sv) | var-test edilmiş | common.ts nextActor yansıma turu (inisiyatif − 10); k19tier4b.test.ts; ROGUE-DENETIM A37 |  |
| Sınıflar s. 64 | Sorcerer: Çekirdek özellikler (1. sv) | kısmi | data/classes.json sorcerer (d6, CON/CHA, 2/6 beceri, Simple, zırh yok); classFeatures.test.ts (HP zarı); SORCERER-DENETIM S1–S2 | Başlangıç donanımı A/B paketi yok (öneri yalnız Dagger; genel, SD3/TE99 ertelendi).; Sınıf başlangıç paketi (A/B ya da GP). |
| Sınıflar s. 65 | Sorcerer: Sınıf tablosu (1. sv) | var-test edilmiş | progression.json; spellLimits, deriveStats, kaynak sorceryPoints; classFeatures.test.ts (slotlar 1–20), k6.test.tsx (cantrip/hazır 1–5), sorcerer.test.ts (SP tavanı); SORCERER-DENETIM S3–S6, F1 | 6+ seviye cantrip/hazır sayıları yalnız geçici testle doğrulandı. |
| Sınıflar s. 67 | Sorcerer: Büyü listesi (1. sv) | var-test edilmiş | data/sinif-buyuleri.json sorcerer 140 büyü; src/rules/spellList.ts; k6.test.tsx (SRD ile aynı); SORCERER-DENETIM S8 | Büyü bazlı mekanik farklar büyü denetimlerinde (BUYU-DURUM.md). |
| Sınıflar s. 64 | Sorcerer: Spellcasting (1. sv) | kısmi | classes.json casting cha; builder.ts spellLimits; levelChoices.ts (Serüven'de seviyede bir değişim, B93 A2); k6.test.tsx, levelChoices.test.ts; SORCERER-DENETIM S3–S7; B93 A2 | bilinçli sapma: Serüven dışında cantrip/hazır büyü serbest düzenlenir, 'seviyede bir değişim' yok (S3/S4, K17); Arcane Focus/bileşen savaşta modellenmez (genel).; İsteğe bağlı uyarı (öneri 12) ya da kararı DECISIONS'ta tut. |
| Sınıflar s. 65 | Sorcerer: Innate Sorcery (1. sv) | kısmi | sorcerer.ts innateFor/castWithMetamagic, classSpellsAlways (93); sorcerer.test.ts, b93sorcerer.test.ts (Draconic Spells), k19tier4b.test.ts; SORCERER-DENETIM I1–I4, I7; B93 E | doğrulanmadı: +1 DC'nin tur sonu tekrar save'lerinde de geçerli olması (I4; kod okumasıyla yapım DC'si saklanıyor, test yok).; Hold Person + Innate Sorcery tekrar save DC testi. |
| Sınıflar s. 66 | Sorcerer: Font of Magic (2. sv) | var-test edilmiş | sorcerer.ts executeFontOfMagic; partyStatus.ts createdSlots (93), fontOfMagicStatus (dinlenme paneli); sorcerer.test.ts, b93sorcerer.test.ts; SORCERER-DENETIM F1–F6; B93 E | Arayüz: SP tavanında slot → puan uyarısı yok (F2), savaşta slot seviyesi seçilemez (F6), Serüven dinlenme ekranında yok. YZ: kullanmıyor.; Seviye seçici, tavan uyarısı, Serüven dinlenmesine düğme. |
| Sınıflar s. 66 | Sorcerer: Metamagic (2. sv) | kısmi | class-features.json sorcerer:metamagic counts 2/4/6 (2/10/17), metamagicProblem/metamagicLimit; sorcerer.test.ts (oluşturucu, tek seçenek), levelChoices.test.ts; SORCERER-DENETIM M0, M11–M12; B93 A2 | bilinçli sapma: Serüven dışında seçenekler serbest düzenlenir, seviyede bir değişim yok (M0, K17; Serüven'de B93 ile kurallı). Seçenekler ayrı satırlarda. |
| Sınıflar s. 66 | Sorcerer: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | advancement.ts (4/8/12/16 + 19); advancement.test.ts, levelChoices.test.ts (Serüven, B93 A2); SORCERER-DENETIM R3 | Boon etkileri feat denetiminde (TUR-FEAT-ESYA-DENETIM; Free Casting kısmi/ertelendi); sınıf denetiminde 'kısmi (genel)'. |
| Sınıflar s. 66 | Sorcerer: Sorcerous Restoration (5. sv) | var-test edilmiş | characterRest.ts sorcerousRestoration (seviye/2, uzun dinlenmeye dek bir); sorcerer.test.ts; SORCERER-DENETIM R1 |  |
| Sınıflar s. 66 | Sorcerer: Sorcery Incarnate (7. sv) | var-test edilmiş | sorcerer.ts innateSorceryEvents (2 SP), metamagicLimit 2; sorcerer.test.ts; SORCERER-DENETIM I5 | YZ: iki Metamagic'i birlikte seçmiyor. |
| Sınıflar s. 66 | Sorcerer: Arcane Apotheosis (20. sv) | var-test edilmiş | sorcerer.ts apotheosisDiscount (kendi turunda bir, featuresK19); k19tier4b.test.ts; SORCERER-DENETIM I6 | YZ: indirimi kararında gözetmiyor. |
| Sınıflar s. 66 | Sorcerer / seçenek: Careful Spell (2. sv) | kısmi | spells.ts sculpt + mm-careful; sorcerer.test.ts (Fireball alanındaki dost); SORCERER-DENETIM M1, M12; B93 E | Yalnız alan yolunda ve yalnız dostlar, seçim yok (ilk N dost); düşman/tarafsız korunamaz; tek hedefli save büyüsünde etkisiz ama puan gider (M1, ertelendi).; Hedef seçici (herhangi yaratık); tek hedef yolunda uygula ya da reddet. |
| Sınıflar s. 67 | Sorcerer / seçenek: Distant Spell (2. sv) | var-test edilmiş | sorcerer.ts; hud.ts spellTargets/areaActSpec metamagic (93), kendinden çıkan alanda ret; b93sorcerer.test.ts; SORCERER-DENETIM M2, M12; B93 E | YZ: kullanmıyor (ertelendi). |
| Sınıflar s. 67 | Sorcerer / seçenek: Empowered Spell (2. sv) | var-test edilmiş | sorcerer.ts empowerCount/empowerRolls; sorcerer.test.ts, b93.test.ts (Magic Missile), b93sorcerer.test.ts (hasarsızda ret); SORCERER-DENETIM M3, M12; B93 A1, E | Yeniden atılacak zarlar sorulmaz: ortalamanın altındaki en düşükler otomatik (oyuncu seçimi yok). |
| Sınıflar s. 67 | Sorcerer / seçenek: Extended Spell (2. sv) | kısmi | uygunluk SRD süresinden, effect/failEffect/zone.rounds ×2, konsantrasyon avantajı concAdv (93); b93sorcerer.test.ts; SORCERER-DENETIM M4; B93 E | Koşul zamanlayıcısıyla süren büyülerde (Hold Person) 1 dk tavanı ikiye katlanmıyor (⚠ B93); YZ: kullanmıyor.; conditionTimers azami süresine Extended çarpanı. |
| Sınıflar s. 67 | Sorcerer / seçenek: Heightened Spell (2. sv) | kısmi | spells.ts (tek hedef ve alan yolu); sorcerer.test.ts, y1.test.ts (YZ); SORCERER-DENETIM M5; DECISIONS Y1(d) | Alanda hedef seçilemez (ilk düşman); çok hedefli yapımda (Twinned + Heightened) uygulanmaz, puan gider (M5, bilinen).; Hedef seçimi ve çok hedefli yolda uygulama. |
| Sınıflar s. 67 | Sorcerer / seçenek: Quickened Spell (2. sv) | var-test edilmiş | economy.ts leveledCast/quickened (93), yapım süresi SRD kaydından; sorcerer.test.ts, b93sorcerer.test.ts; SORCERER-DENETIM M6; B93 E |  |
| Sınıflar s. 67 | Sorcerer / seçenek: Seeking Spell (2. sv) | var-test edilmiş | spells.ts ıskada bir kez, puan yalnız kullanılınca; sorcerer.test.ts, b93sorcerer.test.ts (YZ); SORCERER-DENETIM M7 | Yorum: çok ışınlı büyüde yalnız ilk ıskada (K11 sadelik). |
| Sınıflar s. 67 | Sorcerer / seçenek: Subtle Spell (2. sv) | var-testsiz | sorcerer.ts noVerbal + Counterspell tetiklenmez (spells.ts); testlerde yalnız seçenek birleşimi, etki testi yok; SORCERER-DENETIM M8 | Somatik/malzeme bileşeni savaşta modellenmediğinden fark sözlü bileşen (Silence) ve Counterspell kadar; YZ: kullanmıyor.; Silence ve Counterspell ile Subtle testi. |
| Sınıflar s. 67 | Sorcerer / seçenek: Transmuted Spell (2. sv) | kısmi | sorcerer.ts TRANSMUTE_TYPES; sorcerer.test.ts; SORCERER-DENETIM M9 | İki hasar türlü büyüde yalnız ana tür değişir; damageType verisi olmayan Fire Shield, Ice Knife, Web seçilemez (28 uygunun 25'i, M9).; Büyü verisine ikinci hasar türü/damageType. |
| Sınıflar s. 67 | Sorcerer / seçenek: Twinned Spell (2. sv) | var-test edilmiş | spells.ts upcast.targets (etkin seviye +1); sorcerer.test.ts (Hold Person iki hedef); SORCERER-DENETIM M10 | Yorum: Scorching Ray/Chain Lightning ek ışın/şimşek kapsam dışı (M10). |
| Sınıflar s. 69 | Sorcerer / alt sınıf: Draconic Resilience (3. sv) | var-test edilmiş | fikstür draconic-sorcery (unarmoredDefense cha, hpPerLevel 1); stats.ts; sorcerer.test.ts; SORCERER-DENETIM D1 | ⚠ yorum: kalkanla da AC 10 + DEX + CHA (shield: true; SRD 'zırh giymiyorken'). |
| Sınıflar s. 70 | Sorcerer / alt sınıf: Draconic Spells (3. sv) | var-test edilmiş | fikstür alwaysPrepared 3/5/7/9; b93sorcerer.test.ts (Innate Sorcery ile DC +1 ve avantaj); SORCERER-DENETIM D2, I2–I3; B93 E |  |
| Sınıflar s. 70 | Sorcerer / alt sınıf: Elemental Affinity (6. sv) | var-test edilmiş | fikstür options (direnç), oneDieBonus.ts (93, bir hasar zarına +CHA); sorcerer.test.ts, b93.test.ts (Scorching Ray bir kez); SORCERER-DENETIM D3; B93 A1 |  |
| Sınıflar s. 70 | Sorcerer / alt sınıf: Dragon Wings (14. sv) | kısmi | apex.ts wings (600 tur, Fly 60, kullanım yoksa 3 SP); k19tier4b.test.ts; SORCERER-DENETIM D4; B93 E | Kanatlar istenince kapatılamaz (SRD 'until you dismiss them'; D4 ertelendi); YZ: kullanmıyor.; Eylemsiz kapatma komutu (yeni kural sürümü). |
| Sınıflar s. 70 | Sorcerer / alt sınıf: Dragon Companion (18. sv) | kısmi | summons.ts dragonCompanion (slotsuz yapımda konsantrasyonsuz); k19tier4b.test.ts; SORCERER-DENETIM D5; B93 E | Slotlu Summon Dragon yapımında 'konsantrasyonsuz (1 dk)' seçeneği yok (D5, ertelendi); YZ: kullanmıyor.; cast_spell'e konsantrasyonsuz seçeneği. |
| Sınıflar s. 70 | Warlock: Çekirdek özellikler (1. sv) | kısmi | data/classes.json warlock (d8, WIS/CHA, 2/7 beceri, Simple, Light zırh); classFeatures.test.ts (HP zarı); WARLOCK-DENETIM 0.1, 0.5 | Başlangıç donanımı A/B paketi yok (denetlenmedi; genel eksik, TE99 ertelendi).; Sınıf başlangıç paketi (A/B ya da GP). |
| Sınıflar s. 71 | Warlock: Sınıf tablosu (1. sv) | var-test edilmiş | invocationSlots, spellLimits, spellSlotsFor; classFeatures.test.ts (Pact slotları 1–20), k6.test.tsx (cantrip/hazır 1–5), warlock.test.ts (Invocation 1/3/5); WARLOCK-DENETIM 0.2–0.4 |  |
| Sınıflar s. 74 | Warlock: Büyü listesi (1. sv) | var-test edilmiş | data/sinif-buyuleri.json warlock 72 büyü; k6.test.tsx (SRD ile aynı); WARLOCK-DENETIM B13 |  |
| Sınıflar s. 70 | Warlock: Eldritch Invocations (1. sv) | kısmi | invocations.ts invocationProblems; class-features.json warlock:eldritch-invocations (status partial); warlock.test.ts, b93warlock.test.ts, levelChoices.test.ts; WARLOCK-DENETIM B1–B5, B3b, E2–E4; B93 D | bilinçli sapma: Serüven dışında serbest düzenleme, 'seviyede bir değişim' yok (B5, K17; Serüven'de B93 ile kurallı). Seçenekler ayrı satırlarda. |
| Sınıflar s. 71 | Warlock: Pact Magic (1. sv) | kısmi | spellSlotsFor pact; characterRest.ts kısa dinlenme, pactShift (93); warlock.test.ts, b93warlock.test.ts, classFeatures.test.ts, slots.test.ts; WARLOCK-DENETIM A1–A2, B9–B10, C2, C9; B93 D | bilinçli sapma: Serüven dışında cantrip/hazır büyü serbest düzenlenir (B10, K17); çoklu sınıf yok. |
| Sınıflar s. 72 | Warlock: Magical Cunning (2. sv) | kısmi | magicalCunningStatus min(harcanan, ⌈azami/2⌉) (93), Screens.tsx RestPanel; b93warlock.test.ts, warlock.test.ts; WARLOCK-DENETIM A3, A7, C5–C6, E5; B93 D | bilinçli sapma: savaşta yok, yalnız karakter listesi dinlenme panelinde (A3); Arayüz: Serüven/yolculuk/kurulum dinlenmesinde düğme yok (C6, ertelendi).; Serüven ve kurulum dinlenme kartına düğme. |
| Sınıflar s. 72 | Warlock: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | advancement.ts (4/8/12/16 + 19); advancement.test.ts, levelChoices.test.ts; WARLOCK-DENETIM B11 | Boon etkileri feat denetiminde; Boon of Spell Recall Warlock'ta ön koşulu tutmaz (TE99-9); sınıf denetiminde 'kısmi (genel)'. |
| Sınıflar s. 72 | Warlock: Contact Patron (9. sv) | kısmi | class-features.json warlock:contact-patron alwaysPrepared 9 (Contact Other Plane, savaş dışı); test yok; WARLOCK-DENETIM C3 | Slotsuz bir kez yapım ve save'in otomatik başarısı yok: yapım Pact slotu harcar (C3); büyü savaş dışı (Game Master notu).; Uzun dinlenmeli kaynak + freeSpellList ile slotsuz yapım. |
| Sınıflar s. 72 | Warlock: Mystic Arcanum (11. sv) | kısmi | create.ts arcanumPicks, kaynaklar arcanum6–9, freeSpellList; k19spells69.test.ts, levelChoices.test.ts (seviyede bir değişim); WARLOCK-DENETIM B12, C4; B93 A2 | bilinçli sapma: seçilmezse ilk uygun savaş büyüsü otomatik atanır (B12). |
| Sınıflar s. 72 | Warlock: Eldritch Master (20. sv) | var-test edilmiş | characterRest.ts Magical Cunning'de harcananın hepsi; k19tier4b.test.ts; WARLOCK-DENETIM A8 | Magical Cunning gibi yalnız dinlenme panelinde (A3). |
| Sınıflar s. 72 | Warlock / seçenek: Armor of Shadows (1. sv) | var-test edilmiş | atWill Mage Armor + preCast; warlock.test.ts (AC 13 + DEX), te99.test.ts (acBase); WARLOCK-DENETIM A16 |  |
| Sınıflar s. 72 | Warlock / seçenek: Eldritch Mind (1. sv) | var-testsiz | damage-effects.ts konsantrasyon CON save avantajı; testlerde yalnız seçim listesinde, davranış testi yok; WARLOCK-DENETIM A14 | Konsantrasyon save avantajı testi. |
| Sınıflar s. 74 | Warlock / seçenek: Pact of the Blade (1. sv) | kısmi | create.ts pact silahı (CHA, yetkinlik, pactBladeTypes); warlock.test.ts, b93warlock.test.ts (menzilli silah uyarısı); WARLOCK-DENETIM A11, B8; B93 D | bilinçli sapma: silah elde başlar; bonus eylemle çağırma ve büyülü silaha bağlanma yok (A11). |
| Sınıflar s. 74 | Warlock / seçenek: Pact of the Chain (1. sv) | var-test edilmiş | atWill Find Familiar (kurulum ritüeli), özel biçimler, familiar_strike; k19chain.test.ts; WARLOCK-DENETIM A12 |  |
| Sınıflar s. 74 | Warlock / seçenek: Pact of the Tome (1. sv) | var-test edilmiş | invocations.ts TOME_RITUALS, tomeCantrips (93, her sınıf listesi); b93warlock.test.ts, k19chain.test.ts; WARLOCK-DENETIM B6; B93 D | Ritüeller savaş dışı (Find Familiar kurulumda); Book of Shadows nesnesi ve yenileme töreni yok (hikâye). |
| Sınıflar s. 72 | Warlock / seçenek: Agonizing Blast (2. sv) | var-test edilmiş | cantripMods.ability (her ışına CHA); warlock.test.ts, b93warlock.test.ts (Tome cantrip'i); WARLOCK-DENETIM A5, B3, B3b |  |
| Sınıflar s. 72 | Warlock / seçenek: Devil's Sight (2. sv) | var-test edilmiş | trait devils-sight, darkvision 120, maprules.ts büyülü karanlık; k67a.test.ts (Algı cezasız); WARLOCK-DENETIM A15 | Büyülü karanlıkta görme testle ayrıca doğrulanmadı (kod okuması). |
| Sınıflar s. 73 | Warlock / seçenek: Eldritch Spear (2. sv) | var-testsiz | cantripMods.rangePerLevel 30; yalnız geçici test (silindi); WARLOCK-DENETIM A18 | Menzil + 30 × seviye testi. |
| Sınıflar s. 73 | Warlock / seçenek: Fiendish Vigor (2. sv) | var-test edilmiş | atWill False Life, zarın en yükseği; warlock.test.ts; WARLOCK-DENETIM A17 |  |
| Sınıflar s. 73 | Warlock / seçenek: Lessons of the First Ones (2. sv) | var-test edilmiş | invocations.ts LESSON_FEATS (4 köken feat'i, tekrarlanabilir); k19chain.test.ts; WARLOCK-DENETIM B7 |  |
| Sınıflar s. 73 | Warlock / seçenek: Mask of Many Faces (2. sv) | savaş dışı | atWill Disguise Self (spells.json offCombat); WARLOCK-DENETIM A23 | Savaşta Game Master notu; savaş dışında (Serüven) büyü yapımı yok, karşılığı yok. |
| Sınıflar s. 74 | Warlock / seçenek: Misty Visions (2. sv) | savaş dışı | atWill Silent Image (spells.json offCombat); WARLOCK-DENETIM A23 | Savaşta Game Master notu; savaş dışında karşılığı yok. |
| Sınıflar s. 74 | Warlock / seçenek: Otherworldly Leap (2. sv) | var-testsiz | atWill Jump (kendine); doğrudan test yok; WARLOCK-DENETIM A17, D6 | YZ: denenmedi (D6).; Slotsuz Jump testi. |
| Sınıflar s. 74 | Warlock / seçenek: Repelling Blast (2. sv) | kısmi | cantripMods.pushFt 10 (her isabet eden ışın); warlock.test.ts; WARLOCK-DENETIM A6 | Basitleştirme (denetimde 'tam'): her isabette tam 10 ft, SRD 'en çok 10 ft' mesafe seçimi yok.; Push ustalığındaki mesafe seçimi (pushFeet) deseni. |
| Sınıflar s. 72 | Warlock / seçenek: Ascendant Step (5. sv) | var-testsiz | atWill Levitate (kendine); doğrudan test yok (genel atWill yolu warlock.test.ts); WARLOCK-DENETIM A17, D6 | YZ: slotsuz Invocation büyülerinin kullanımı denenmedi (D6).; Slotsuz Levitate testi. |
| Sınıflar s. 72 | Warlock / seçenek: Eldritch Smite (5. sv) | var-test edilmiş | eldritch_smite komutu (Pact slotu, (1 + slot)d8 Force, Prone); warlock.test.ts; WARLOCK-DENETIM A4, D3 |  |
| Sınıflar s. 73 | Warlock / seçenek: Gaze of Two Minds (5. sv) | var-test edilmiş | gaze komutu (bonus eylem, 60 ft büyü çıkışı); k19chain.test.ts; WARLOCK-DENETIM A20 | Dokunma bitişik gönüllü dostla yaklaşıklanır. |
| Sınıflar s. 73 | Warlock / seçenek: Gift of the Depths (5. sv) | kısmi | deepWater.ts yüzme (trait); srdD2.test.ts (işaret); WARLOCK-DENETIM A22; B93 D | Water Breathing günde bir sayaçsız (savaş dışı, etkisiz; ertelendi); kod okuması: su altında soluma breathesWater'da bu işarete bağlı değil (doğrulanmadı).; breathesWater'a gift-of-the-depths; Water Breathing sayacı. |
| Sınıflar s. 73 | Warlock / seçenek: Investment of the Chain Master (5. sv) | kısmi | trait chain-master (uçuş/yüzme 40, bonus Attack, tür, DC); k19chain.test.ts; WARLOCK-DENETIM A13 | Direnç tepkisi yalnız isabet hasarında; save'li hasarda sorulmaz (A13, bilinen).; Save'li hasardan önce tepki zinciri. |
| Sınıflar s. 73 | Warlock / seçenek: Master of Myriad Forms (5. sv) | var-testsiz | atWill Alter Self (kendine); doğrudan test yok; WARLOCK-DENETIM A17, D6 | YZ: denenmedi (D6).; Slotsuz Alter Self testi. |
| Sınıflar s. 74 | Warlock / seçenek: One with Shadows (5. sv) | var-test edilmiş | atWill Invisibility, ışık koşulu oneWithShadows; warlock.test.ts; WARLOCK-DENETIM A17 |  |
| Sınıflar s. 74 | Warlock / seçenek: Thirsting Blade (5. sv) | var-test edilmiş | pactAttacks 2, economy.pactOnly; warlock.test.ts (K13); WARLOCK-DENETIM A9, D2 |  |
| Sınıflar s. 74 | Warlock / seçenek: Whispers of the Grave (7. sv) | savaş dışı | atWill Speak with Dead (spells.json offCombat); WARLOCK-DENETIM A23 | Savaşta Game Master notu; savaş dışında karşılığı yok. |
| Sınıflar s. 73 | Warlock / seçenek: Gift of the Protectors (9. sv) | kısmi | chainPact.ts protectorsGiftEvents; k19chain.test.ts; WARLOCK-DENETIM A21 | bilinçli sapma: kitaba ad yazma yok, savaş başında CHA kadar dost otomatik; ilk tetikte hepsi düşer (A21). |
| Sınıflar s. 73 | Warlock / seçenek: Lifedrinker (9. sv) | kısmi | warlock.ts lifedrinker (lifedrinkerFull); warlock.test.ts; WARLOCK-DENETIM A10 | bilinçli sapma: hasar türü hedefe göre otomatik, HP zarı eksik HP yeterse otomatik harcanır (oyuncu seçimi yok; A10). |
| Sınıflar s. 74 | Warlock / seçenek: Visions of Distant Realms (9. sv) | savaş dışı | atWill Arcane Eye (spells.json offCombat); WARLOCK-DENETIM A23 | Savaşta Game Master notu; savaş dışında karşılığı yok. |
| Sınıflar s. 72 | Warlock / seçenek: Devouring Blade (12. sv) | var-testsiz | effect attacks 3, economy.pactOnly; test yok (Thirsting Blade testi warlock.test.ts); WARLOCK-DENETIM A9 | 12. seviye pact silahıyla üç saldırı testi. |
| Sınıflar s. 74 | Warlock / seçenek: Witch Sight (15. sv) | var-test edilmiş | senses.truesight 30 ft; warlock.test.ts; WARLOCK-DENETIM A19 |  |
| Sınıflar s. 76 | Warlock / alt sınıf: Dark One's Blessing (3. sv) | var-test edilmiş | warlock.ts blessingEvents (10 ft = 2 altıgen); warlock.test.ts; WARLOCK-DENETIM F1 |  |
| Sınıflar s. 76 | Warlock / alt sınıf: Fiend Spells (3. sv) | var-testsiz | fikstür fiend-patron alwaysPrepared 3/5/7/9; yalnız geçici test (silindi), kalıcı test yok; WARLOCK-DENETIM F2 | classKit('warlock', 9, 'fiend-patron').alwaysPrepared testi (paladin.test.ts deseni). |
| Sınıflar s. 76 | Warlock / alt sınıf: Dark One's Own Luck (6. sv) | kısmi | effectDice.ts reroll onFail, kaynak darkOnesLuck max(1, CHA); warlock.test.ts; WARLOCK-DENETIM F3; B93 D | bilinçli sapma: kullanım yalnız zar tutarsa harcanır (SRD: eklenince) ve oyuncuya sorulmaz (F3, ertelendi; denge ölçümü gerekir).; Karar + B98 'ask' deseni. |
| Sınıflar s. 76 | Warlock / alt sınıf: Fiendish Resilience (10. sv) | kısmi | fikstür options (Force yok), levelChoices (Serüven uzun dinlenmede değişir); warlock.test.ts, levelChoices.test.ts; WARLOCK-DENETIM B14, C7, F4; B93 D | Kısa dinlenmede tür değişimi yok (Serüven'de yalnız uzun dinlenme; dışarıda serbest düzenleme, C7 bilinçli).; Kısa dinlenme seçim penceresi (Memorize Spell ile ortak). |
| Sınıflar s. 76 | Warlock / alt sınıf: Hurl Through Hell (14. sv) | kısmi | apex.ts hurlEvents (silah ve büyü saldırısı, 93); k19tier4b.test.ts, b93warlock.test.ts; WARLOCK-DENETIM F5–F5c, D5; B93 D | bilinçli sapma: isabette kendiliğinden (sorulmaz), hedef ortadan kalkmaz, yerinde kalır (F5, D5); Pact slotuyla yenileme yok (F5c; bizim sürüm metninde yok).; Kullanım sorusu ve slotla yenileme kararı. |
| Sınıflar s. 77 | Wizard: Çekirdek özellikler (1. sv) | kısmi | data/classes.json wizard (d6, INT/WIS, 2/7 beceri, Simple, zırh yok; eğitimsiz zırhta büyü yok); classFeatures.test.ts (HP zarı); WIZARD-DENETIM A1, A9 | Başlangıç donanımı A/B paketi (Spellbook, Quarterstaff odak, Robe…) yok (genel, TE99 ertelendi).; Sınıf başlangıç paketi (A/B ya da GP). |
| Sınıflar s. 77 | Wizard: Sınıf tablosu (1. sv) | var-test edilmiş | spellLimits, deriveStats.spellSlots; classFeatures.test.ts (slotlar 1–20), k6.test.tsx (cantrip/hazır/kitap 1–5); WIZARD-DENETIM A2, A4, A5, B1 | 6+ seviye sayıları yalnız geçici testle (T8) doğrulandı. |
| Sınıflar s. 79 | Wizard: Büyü listesi (1. sv) | var-test edilmiş | data/sinif-buyuleri.json wizard 218 büyü; k6.test.tsx (SRD ile aynı, hepsi oyunda kayıtlı); WIZARD-DENETIM geçici test dökümü (betik) | Büyü bazlı mekanik farklar büyü denetimlerinde (BUYU-DURUM.md). |
| Sınıflar s. 77 | Wizard: Büyü kitabı (1. sv) | kısmi | builder.ts spellbook 6 + 2 × (sv − 1), spellOptions slot sınırı, hazırla yalnız kitaptan; k6.test.tsx (kitap 1–5), b93wizard.test.ts (Savant); WIZARD-DENETIM B1–B4, B10, B12; B93 A2 | bilinçli sapma: kopyalama ekonomisi (altın/zaman, parşömenden Arcana DC) ve kitap nesnesi/kaybı yok (B10); kitaba eklemenin seviyesi izlenmez (B12).; Kapsam dışı kararını DECISIONS'a yaz (öneri 11). |
| Sınıflar s. 104 | Wizard: Ritüel yapımı (genel kural) (1. sv) | kısmi | data/spells.json castingTime 'ritual' (Find Familiar, Animate Dead); Ritual Adept SRD Ritual etiketinden (93); b93wizard.test.ts; WIZARD-DENETIM A10–A11; B93 C | bilinçli sapma: oyun verisinde ritüel bayrağı yok; SRD'de ritüel olmayan Animate Dead savaşta yapılmasın diye ritüel sayılıyor (A11, ertelendi); ritüel döküm yalnız kurulumda.; spells.json'a SRD ritual alanı; Animate Dead için ayrı bayrak. |
| Sınıflar s. 77 | Wizard: Spellcasting (1. sv) | kısmi | create.ts spellSaveDc INT, spellNames = hazırlananlar; levelChoices.ts (Serüven: cantrip dinlenmede 1, hazır liste hepsi); k6.test.tsx, levelChoices.test.ts; WIZARD-DENETIM A1, A3, A6–A8, B11, C7; B93 A2 | bilinçli sapma: Serüven dışında hazır liste/cantrip dinlenme şartsız serbest düzenlenir (B11, K17); yukarı slot etkisi 8 Wizard büyüsünde yok (A7, büyü denetimi kapsamı). |
| Sınıflar s. 78 | Wizard: Ritual Adept (1. sv) | var-test edilmiş | Combatant.ritualOnly, ritualFromBook (93; SRD Ritual etiketi); b93wizard.test.ts; WIZARD-DENETIM A10, E6; B93 C | Ritüel yalnız savaş kurulumunda; diğer ritüel büyüler savaş dışı ve Serüven'de savaş dışı büyü yapımı yok. |
| Sınıflar s. 78 | Wizard: Arcane Recovery (1. sv) | var-test edilmiş | characterRest.ts shortRestStatus(..., recover), recoveryOptions (93), outOfCombat çip; wizard.test.ts, b93wizard.test.ts; WIZARD-DENETIM C1–C3, C5, E4–E5; B93 C | Arayüz: Serüven ve yolculuk kısa dinlenmesinde seçim yok, otomatik (en yüksek slottan; eksik slot varsa hakkı yakar).; Serüven kısa dinlenmesine slot seçimi/erteleme. |
| Sınıflar s. 78 | Wizard: Scholar (2. sv) | var-test edilmiş | class-features.json wizard:scholar (SRD listesi, yetkinlik şartı); builder.ts; k19feat3.test.ts; WIZARD-DENETIM B6 |  |
| Sınıflar s. 79 | Wizard: ASI / Epic Boon yuvaları (4. sv) | var-test edilmiş | advancement.ts (4/8/12/16 + 19); advancement.test.ts (Wizard), levelChoices.test.ts; WIZARD-DENETIM A21, B8 | Boon etkileri feat denetiminde (Boon of Spell Recall/Free Casting kısmi, TUR-FEAT-ESYA F35); sınıf denetiminde 'kısmi'. |
| Sınıflar s. 79 | Wizard: Memorize Spell (5. sv) | savaş dışı | class-features.json wizard:memorize-spell (not: serbest düzenleme kapsar); test yok; WIZARD-DENETIM B11; B93 A2 | Kendi mekanizması yok: Serüven dışında hazır liste her an serbest (bilinçli, B11); Serüven'de kısa dinlenme seçim penceresi yok (ertelendi).; Serüven kısa dinlenmesine tek büyü değişimi. |
| Sınıflar s. 79 | Wizard: Spell Mastery (18. sv) | var-test edilmiş | kaynak spellMastery (slotsuz), spellPicks fromBook, castingTime action (93), Serüven'de dinlenmede bir değişim; b93wizard.test.ts, k19tier4b.test.ts, k18h3.test.ts; WIZARD-DENETIM A12–A14, B7; B93 C | Arayüz: slot seçicide varsayılan düğme slotsuz yapımı belirsiz gösteriyor (E3). |
| Sınıflar s. 79 | Wizard: Signature Spells (20. sv) | var-test edilmiş | kaynaklar signatureSpells / signatureSpells2 (pickSlot, kısa dinlenme; 93), fromBook; b93wizard.test.ts, k18h3.test.ts; WIZARD-DENETIM A15, C3; B93 C | Arayüz: slot harcayıp serbest kullanımı saklamak slot seçicide belirsiz (E3).; Slot seçici varsayılanını düzelt. |
| Sınıflar s. 82 | Wizard / alt sınıf: Evocation Savant (3. sv) | kısmi | class-features.json wizard/evoker:evocation-savant spellbookBonus; builder.ts bookBonus (93); b93wizard.test.ts, k6.test.tsx; WIZARD-DENETIM B5; B93 C | İlk iki büyünün 'en çok 2. seviye' sınırı veride (maxBaseLevel) var, kod okumuyor (kod okuması; bizim sürüm metninde sınır yok).; bookBonus'a maxBaseLevel denetimi. |
| Sınıflar s. 82 | Wizard / alt sınıf: Potent Cantrip (3. sv) | var-test edilmiş | spells.ts potentCantrip (save başarısı ve ıskada yarı hasar, ek etki yok; 93); wizard.test.ts, b93wizard.test.ts; WIZARD-DENETIM A16–A17; B93 C |  |
| Sınıflar s. 82 | Wizard / alt sınıf: Sculpt Spells (6. sv) | kısmi | spells.ts sculpt (executeAreaCast); wizard.test.ts; WIZARD-DENETIM A18; B93 C | bilinçli sapma: seçim otomatik, yalnız dostlar (büyücü dahil), 'görebildiğin' denetimi yok, yalnız alan yapımında (kalıcı alan/duvar/boncuk tetiklerinde yok) (A18, kullanıcı kararı bekliyor).; Kullanıcı kararı; ardından hedef seçimi ve kalıcı alan kapsamı. |
| Sınıflar s. 82 | Wizard / alt sınıf: Empowered Evocation (10. sv) | kısmi | oneDieBonus.ts (93, bir hasar zarına +INT); b93.test.ts (Magic Missile bir kez), wizard.test.ts; WIZARD-DENETIM A19; B93 A1 | 'Wizard büyüsü' koşulu yok: okul + işaret yeter, başka kaynaktan (Magic Initiate, soy) Evocation büyüsüne de +INT (A19 kalanı, kod okuması).; oneDieBonus'a sınıf listesi denetimi. |
| Sınıflar s. 82 | Wizard / alt sınıf: Overchannel (14. sv) | var-test edilmiş | apex.ts overchannel (azami zar, 2./3./4. kullanımda Necrotic bedel), MapBattle aç/kapa; k19tier4b.test.ts; WIZARD-DENETIM A20, D2, E2 | YZ: hiç kullanmıyor (D2, ertelendi).; YZ Overchannel kararı (denge ölçümüyle). |

## 4. Karakter kökenleri (Backgrounds, Species) (s. 83–86)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Karakter kökenleri s. 83 | Geçmiş: Acolyte (yetenekler, köken feat'i magic-initiate, beceriler, alet, donanım) | var-test edilmiş | `data/backgrounds.json` acolyte; `f1.test.ts`, `alignment.test.ts` +3; TUR-FEAT-ESYA G3 |  |
| Karakter kökenleri s. 83 | Geçmiş: Criminal (yetenekler, köken feat'i alert, beceriler, alet, donanım) | var-test edilmiş | `data/backgrounds.json` criminal; `alignment.test.ts`, `altSoy41.test.tsx` +2; TUR-FEAT-ESYA G4 |  |
| Karakter kökenleri s. 83 | Geçmiş: Sage (yetenekler, köken feat'i magic-initiate, beceriler, alet, donanım) | var-test edilmiş | `data/backgrounds.json` sage; `k42.test.ts`, `g1.test.tsx`; TUR-FEAT-ESYA G5 |  |
| Karakter kökenleri s. 83 | Geçmiş: Soldier (yetenekler, köken feat'i savage-attacker, beceriler, alet, donanım) | kısmi | `data/backgrounds.json` soldier; `savage.test.ts`, `te99.test.ts` +4; TUR-FEAT-ESYA G6, G14 | G14 yok: ertelendi (bu turun kapsamı dışında) |
| Karakter kökenleri s. 83 | Geçmiş kuralı: Yetenek artışı yalnız geçmişin üç yeteneğine, +2/+1 ya da +1/+1/+1, hiçbiri 20'yi aşamaz (s. 83, s. 21) | var-testsiz | TUR-FEAT-ESYA G1 |  |
| Karakter kökenleri s. 21 | Geçmiş kuralı: Artış zorunlu ("increase one by 2…", s. 21) | var-testsiz | TUR-FEAT-ESYA G2 |  |
| Karakter kökenleri s. 20 | Geçmiş kuralı: Köken feat'i geçmişten gelir ("specified Origin feat", s. 20, s. 83) | var-testsiz | TUR-FEAT-ESYA G7 |  |
| Karakter kökenleri s. 87 | Geçmiş kuralı: Magic Initiate: listeden 2 cantrip + 1. seviye büyü, INT/WIS/CHA seçimi, uzun dinlenmede bir kez slotsuz, slotla da | var-testsiz | TUR-FEAT-ESYA G8 |  |
| Karakter kökenleri s. 87 | Geçmiş kuralı: Alert ve Savage Attacker savaşta | var-testsiz | TUR-FEAT-ESYA G9 |  |
| Karakter kökenleri s. 87 | Geçmiş kuralı: Skilled: "üç beceri ya da alet" | kısmi | TUR-FEAT-ESYA G10 | G10 kısmi: ertelendi (bu turun kapsamı dışında) |
| Karakter kökenleri s. 20 | Geçmiş kuralı: İki beceri yeterliliği (s. 20, s. 83); sınıf becerisiyle çakışma | var-testsiz | TUR-FEAT-ESYA G11 |  |
| Karakter kökenleri s. 85 | Geçmiş kuralı: Tür becerisi yalnız Human Skillful (her beceri) ve Elf Keen Senses (Insight/Perception/Survival) | var-testsiz | TUR-FEAT-ESYA G12 |  |
| Karakter kökenleri s. 20 | Geçmiş kuralı: Alet yetkinliği: alet kullanan kontrole PB, beceri de yetkinse avantaj (s. 20, s. 93) | kısmi | TUR-FEAT-ESYA G13 | G13 bilinçli sapma: ertelendi (genel alet yetkinliği; yalnız Thieves' Tools savaşta) |
| Karakter kökenleri s. 94 | Geçmiş kuralı: Thieves' Tools ile kilit açma: DEX, DC 15, aleti gerektirir | kısmi | TUR-FEAT-ESYA G15; `te99.test.ts` | G15 kısmi: kısmen düzeldi (99: DEX + PB, avantaj; envanter yok) |
| Karakter kökenleri s. 20 | Geçmiş kuralı: Başlangıç donanımı: A paketi ya da 50 GP; para hemen harcanabilir (s. 20, s. 83) | yok | TUR-FEAT-ESYA G16 | G16 yok: ertelendi (başlangıç donanımı A/50 GP) |
| Karakter kökenleri s. 83 | Geçmiş kuralı: Geçmiş değişince geçersiz seçimler (bonus, beceri, MI listesi) | var-testsiz | TUR-FEAT-ESYA G17 |  |
| Karakter kökenleri s. 83 | Geçmiş kuralı: Geçmişsiz eski kayıt (SRD'de karşılığı yok) | kısmi | TUR-FEAT-ESYA G18 | G18 bilinçli sapma: değişmedi (bilinçli sapma) |
| Karakter kökenleri s. 83 | Geçmiş kuralı: Yeni karakter: varsayılan geçmiş ve öneri (oluşturucu) | var-testsiz | TUR-FEAT-ESYA G19 |  |
| Karakter kökenleri s. 84 | Tür Dragonborn: Draconic Ancestry | var-test edilmiş | `species:dragonborn/draconic-ancestry`; TUR-FEAT-ESYA T5 |  |
| Karakter kökenleri s. 84 | Tür Dragonborn: Breath Weapon | var-test edilmiş | `species:dragonborn/breath-weapon`; `areaAttack.test.ts`, `b95barbarian.test.ts` +2; TUR-FEAT-ESYA T6 |  |
| Karakter kökenleri s. 84 | Tür Dragonborn: Damage Resistance | var-test edilmiş | `species:dragonborn/damage-resistance`; TUR-FEAT-ESYA T5 |  |
| Karakter kökenleri s. 84 | Tür Dragonborn: Darkvision | var-testsiz | `species:dragonborn/darkvision`; TUR-FEAT-ESYA T4 |  |
| Karakter kökenleri s. 84 | Tür Dragonborn: Draconic Flight | kısmi | `species:dragonborn/draconic-flight`; `k19items.test.ts`, `k73a.test.ts` +2; TUR-FEAT-ESYA T7 | T7 kısmi: kısmen düzeldi (99: kaynak uzun dinlenmeye bağlı); Incapacitated olunca bitme ertelendi |
| Karakter kökenleri s. 84 | Tür Dwarf: Darkvision | var-testsiz | `species:dwarf/darkvision`; TUR-FEAT-ESYA T4 |  |
| Karakter kökenleri s. 84 | Tür Dwarf: Dwarven Resilience | var-test edilmiş | `species:dwarf/dwarven-resilience`; TUR-FEAT-ESYA T8, T9 |  |
| Karakter kökenleri s. 84 | Tür Dwarf: Dwarven Toughness | var-test edilmiş | `species:dwarf/dwarven-toughness`; `stats.test.ts`; TUR-FEAT-ESYA T10 |  |
| Karakter kökenleri s. 84 | Tür Dwarf: Stonecunning | kısmi | `species:dwarf/stonecunning`; TUR-FEAT-ESYA T11 | T11 kısmi: kısmen düzeldi (99: kaynak kalıcı); Tremorsense ↔ yeri bilme ertelendi |
| Karakter kökenleri s. 84 | Tür Elf: Darkvision | var-testsiz | `species:elf/darkvision`; TUR-FEAT-ESYA T4 |  |
| Karakter kökenleri s. 84 | Tür Elf: Elven Lineage | var-test edilmiş | `species:elf/elven-lineage`; TUR-FEAT-ESYA T12 |  |
| Karakter kökenleri s. 84 | Tür Elf: Fey Ancestry | var-test edilmiş | `species:elf/fey-ancestry`; TUR-FEAT-ESYA T16 |  |
| Karakter kökenleri s. 84 | Tür Elf: Keen Senses | var-testsiz | `species:elf/keen-senses`; TUR-FEAT-ESYA T17 |  |
| Karakter kökenleri s. 84 | Tür Elf: Trance | var-testsiz | `species:elf/trance`; TUR-FEAT-ESYA T18 |  |
| Karakter kökenleri s. 85 | Tür Gnome: Darkvision | var-testsiz | `species:gnome/darkvision`; TUR-FEAT-ESYA T4 |  |
| Karakter kökenleri s. 85 | Tür Gnome: Gnomish Cunning | var-test edilmiş | `species:gnome/gnomish-cunning`; `g01SaveWhy.test.ts`, `girdapSecenek.test.ts`; TUR-FEAT-ESYA T19 |  |
| Karakter kökenleri s. 85 | Tür Gnome: Gnomish Lineage | var-testsiz | `species:gnome/gnomish-lineage` |  |
| Karakter kökenleri s. 85 | Tür Gnome: Forest Gnome | var-test edilmiş | `species:gnome/forest-gnome`; `altSoy.test.ts`, `lineage.test.ts` +1; TUR-FEAT-ESYA T20 |  |
| Karakter kökenleri s. 85 | Tür Gnome: Rock Gnome | kısmi | `species:gnome/rock-gnome`; `altSoy.test.ts`, `lineage.test.ts` +1; TUR-FEAT-ESYA T21, T22 | T22 yok: ertelendi (bu turun kapsamı dışında) |
| Karakter kökenleri s. 85 | Tür Goliath: Giant Ancestry | var-test edilmiş | `species:goliath/giant-ancestry`; `lineage.test.ts`, `te99.test.ts`; TUR-FEAT-ESYA T23 |  |
| Karakter kökenleri s. 85 | Tür Goliath: Cloud’s Jaunt (Cloud Giant) | var-test edilmiş | `species:goliath/clouds-jaunt`; `evaluate.test.ts`, `altSoy.test.ts` +1 |  |
| Karakter kökenleri s. 85 | Tür Goliath: Fire’s Burn (Fire Giant) | var-testsiz | `species:goliath/fires-burn` |  |
| Karakter kökenleri s. 85 | Tür Goliath: Frost’s Chill (Frost Giant) | var-testsiz | `species:goliath/frosts-chill` |  |
| Karakter kökenleri s. 85 | Tür Goliath: Hill’s Tumble (Hill Giant) | var-testsiz | `species:goliath/hills-tumble` |  |
| Karakter kökenleri s. 85 | Tür Goliath: Stone’s Endurance (Stone Giant) | var-testsiz | `species:goliath/stones-endurance` |  |
| Karakter kökenleri s. 85 | Tür Goliath: Storm’s Thunder (Storm Giant) | var-testsiz | `species:goliath/storms-thunder` |  |
| Karakter kökenleri s. 85 | Tür Goliath: Large Form | kısmi | `species:goliath/large-form`; `k19items.test.ts`; TUR-FEAT-ESYA T29 | T29 kısmi: kısmen düzeldi (99: kaynak kalıcı); multiHex sığma ertelendi |
| Karakter kökenleri s. 85 | Tür Goliath: Powerful Build | var-test edilmiş | `species:goliath/powerful-build`; `k19f.test.ts`, `carry.test.ts`; TUR-FEAT-ESYA T30, T31 |  |
| Karakter kökenleri s. 86 | Tür Halfling: Brave | var-test edilmiş | `species:halfling/brave`; TUR-FEAT-ESYA T32 |  |
| Karakter kökenleri s. 86 | Tür Halfling: Halfling Nimbleness | var-test edilmiş | `species:halfling/halfling-nimbleness`; `k19items.test.ts`; TUR-FEAT-ESYA T33 |  |
| Karakter kökenleri s. 86 | Tür Halfling: Luck | kısmi | `species:halfling/luck`; TUR-FEAT-ESYA T34 | T34 kısmi: ertelendi (bu turun kapsamı dışında) |
| Karakter kökenleri s. 86 | Tür Halfling: Naturally Stealthy | kısmi | `species:halfling/naturally-stealthy`; `k19items.test.ts`; TUR-FEAT-ESYA T35 | T35 kısmi: ertelendi (bu turun kapsamı dışında) |
| Karakter kökenleri s. 86 | Tür Human: Resourceful | var-test edilmiş | `species:human/resourceful`; TUR-FEAT-ESYA T36 |  |
| Karakter kökenleri s. 86 | Tür Human: Skillful | var-testsiz | `species:human/skillful`; TUR-FEAT-ESYA T37 |  |
| Karakter kökenleri s. 86 | Tür Human: Versatile | var-testsiz | `species:human/versatile`; TUR-FEAT-ESYA T38 |  |
| Karakter kökenleri s. 86 | Tür Orc: Adrenaline Rush | var-test edilmiş | `species:orc/adrenaline-rush`; `k19items.test.ts`, `te99.test.ts`; TUR-FEAT-ESYA T39 |  |
| Karakter kökenleri s. 86 | Tür Orc: Darkvision | var-testsiz | `species:orc/darkvision`; TUR-FEAT-ESYA T4 |  |
| Karakter kökenleri s. 86 | Tür Orc: Relentless Endurance | var-test edilmiş | `species:orc/relentless-endurance`; `k19items.test.ts`, `te99.test.ts`; TUR-FEAT-ESYA T40 |  |
| Karakter kökenleri s. 86 | Tür Tiefling: Darkvision | var-testsiz | `species:tiefling/darkvision`; TUR-FEAT-ESYA T4 |  |
| Karakter kökenleri s. 86 | Tür Tiefling: Fiendish Legacy | var-test edilmiş | `species:tiefling/fiendish-legacy`; TUR-FEAT-ESYA T41, T42 |  |
| Karakter kökenleri s. 86 | Tür Tiefling: Otherworldly Presence | kısmi | `species:tiefling/otherworldly-presence`; TUR-FEAT-ESYA T43 | T43 yok: ertelendi (bu turun kapsamı dışında) |
| Karakter kökenleri s. 84 | Tür kuralı: Boyut: Dragonborn, Dwarf, Elf, Goliath, Orc Medium; Gnome, Halfling Small | var-testsiz | TUR-FEAT-ESYA T1 |  |
| Karakter kökenleri s. 86 | Tür kuralı: Human ve Tiefling boyutu Small ya da Medium, tür seçilirken | yok | TUR-FEAT-ESYA T2 | T2 yok: ertelendi (bu turun kapsamı dışında) |
| Karakter kökenleri s. 84 | Tür kuralı: Hız 30 ft; Goliath 35; Wood Elf 35 | var-test edilmiş | TUR-FEAT-ESYA T3; `lineage.test.ts` |  |
| Karakter kökenleri s. 85 | Tür kuralı: High Elf: uzun dinlenmede cantrip'i başka Wizard cantrip'iyle değiştirme | yok | TUR-FEAT-ESYA T13 | T13 yok: ertelendi (bu turun kapsamı dışında) |
| Karakter kökenleri s. 84 | Tür kuralı: Soy/Legacy 3. ve 5. seviye büyüsü: hep hazır, uzun dinlenmede bir kez slotsuz, slotla da | var-test edilmiş | TUR-FEAT-ESYA T14; `lineage.test.ts` |  |
| Karakter kökenleri s. 85 | Tür kuralı: Soy büyülerinin yeteneği INT/WIS/CHA, soy seçilirken seçilir | var-testsiz | TUR-FEAT-ESYA T15 |  |
| Karakter kökenleri s. 85 | Tür kuralı: Cloud's Jaunt: bonus eylem, görülen boş altıgene 30 ft ışınlanma | var-test edilmiş | TUR-FEAT-ESYA T24; `lineage.test.ts` |  |
| Karakter kökenleri s. 85 | Tür kuralı: Fire's Burn / Frost's Chill / Hill's Tumble: saldırı zarıyla isabette, seçimli, tur sınırı yok | var-test edilmiş | TUR-FEAT-ESYA T25; `te99.test.ts` |  |
| Karakter kökenleri s. 85 | Tür kuralı: Frost's Chill hız −10 ft sonraki turun başına dek; Hill's Tumble Large ve küçüğü Prone | var-test edilmiş | TUR-FEAT-ESYA T26; `lineage.test.ts` |  |
| Karakter kökenleri s. 85 | Tür kuralı: Stone's Endurance: hasar alınca tepki, 1d12 + CON azaltma | kısmi | TUR-FEAT-ESYA T27 | T27 bilinçli sapma: ertelendi (hasar öncesi ortak azaltma kancası yeni sistem ister) |
| Karakter kökenleri s. 86 | Tür kuralı: Storm's Thunder: 60 ft içinden hasar verene tepkiyle 1d8 Thunder | var-test edilmiş | TUR-FEAT-ESYA T28; `lineage.test.ts` |  |
| Karakter kökenleri s. 84 | Tür kuralı: Tür kaynaklarının savaşlar arası takibi (s. 84–86 "regain… when you finish a Long/Short Rest") | var-test edilmiş | TUR-FEAT-ESYA T44; `te99.test.ts` |  |
| Karakter kökenleri s. 84 | Tür kuralı: Aasimar (SRD 5.2.1'de yok; ölçülen PDF'te geçmiyor) | kısmi | TUR-FEAT-ESYA T45 | T45 bilinçli sapma: değişmedi (bilinçli sapma) |

## 5. Feat'ler (Feats) (s. 87–88)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Feat'ler s. 87 | Alert (Origin) | kısmi | `class-features.json` feats.alert (ok); `f1.test.ts`, `k19chain.test.ts` +6; TUR-FEAT-ESYA F16, F17 | F17 kısmi: ertelendi (bu turun kapsamı dışında) |
| Feat'ler s. 87 | Magic Initiate (Origin) | kısmi | `class-features.json` feats.magic-initiate (ok); `f1.test.ts`, `te99.test.ts` +4; TUR-FEAT-ESYA F12, F18, F19 | F19 bilinçli sapma: değişmedi (bilinçli sapma) |
| Feat'ler s. 87 | Savage Attacker (Origin) | kısmi | `class-features.json` feats.savage-attacker (ok); `f1.test.ts`, `savage.test.ts` +4; TUR-FEAT-ESYA F20, F21 | F21 bilinçli sapma: değişmedi (bilinçli sapma) |
| Feat'ler s. 87 | Skilled (Origin) | var-test edilmiş | `class-features.json` feats.skilled (ok); `f1.test.ts`, `advancement.test.ts` +3; TUR-FEAT-ESYA F11, F22 |  |
| Feat'ler s. 87 | Ability Score Improvement (General) | var-test edilmiş | `class-features.json` feats.ability-score-improvement (ok); `advancement.test.ts`, `levelChoices.test.ts` +3 |  |
| Feat'ler s. 87 | Grappler (General) | kısmi | `class-features.json` feats.grappler (ok); `k19feat.test.ts`, `te99.test.ts` +2; TUR-FEAT-ESYA F4, F5, F14, F23, F24, F25 | F5 kısmi: ertelendi (bu turun kapsamı dışında); F25 doğrulanmadı: doğrulandı (test, hata yok) |
| Feat'ler s. 87 | Archery (Fighting Style) | var-test edilmiş | `class-features.json` feats.archery (ok); `advancement.test.ts`; TUR-FEAT-ESYA F26 |  |
| Feat'ler s. 88 | Defense (Fighting Style) | var-test edilmiş | `class-features.json` feats.defense (ok); `advancement.test.ts`, `levelChoices.test.ts` +1; TUR-FEAT-ESYA F27, F33 |  |
| Feat'ler s. 88 | Great Weapon Fighting (Fighting Style) | var-test edilmiş | `class-features.json` feats.great-weapon-fighting (ok); `binekMb1.test.ts`, `mastery.test.ts` +1; TUR-FEAT-ESYA F28 |  |
| Feat'ler s. 88 | Two-Weapon Fighting (Fighting Style) | var-test edilmiş | `class-features.json` feats.two-weapon-fighting (ok); `offhand.test.ts`; TUR-FEAT-ESYA F29 |  |
| Feat'ler s. 88 | Boon of Combat Prowess (Epic Boon) | var-test edilmiş | `class-features.json` feats.boon-of-combat-prowess (ok); `k19tier4b.test.ts`, `levelChoices.test.ts`; TUR-FEAT-ESYA F30 |  |
| Feat'ler s. 88 | Boon of Dimensional Travel (Epic Boon) | var-test edilmiş | `class-features.json` feats.boon-of-dimensional-travel (ok); `k19tier4b.test.ts`; TUR-FEAT-ESYA F31 |  |
| Feat'ler s. 88 | Boon of Fate (Epic Boon) | var-test edilmiş | `class-features.json` feats.boon-of-fate (ok); `k19tier4b.test.ts`; TUR-FEAT-ESYA F32 |  |
| Feat'ler s. 88 | Boon of Irresistible Offense (Epic Boon) | var-test edilmiş | `class-features.json` feats.boon-of-irresistible-offense (ok); `k19tier4b.test.ts` |  |
| Feat'ler s. 88 | Boon of Spell Recall (Epic Boon) | kısmi | `class-features.json` feats.boon-of-spell-recall (ok); `k19tier4b.test.ts`, `te99.test.ts` +1; TUR-FEAT-ESYA F6, F35 | F35 kısmi: ertelendi (bu turun kapsamı dışında) |
| Feat'ler s. 88 | Boon of the Night Spirit (Epic Boon) | var-test edilmiş | `class-features.json` feats.boon-of-the-night-spirit (ok); `k19tier4b.test.ts` |  |
| Feat'ler s. 88 | Boon of Truesight (Epic Boon) | var-test edilmiş | `class-features.json` feats.boon-of-truesight (ok); `k19tier4b.test.ts`; TUR-FEAT-ESYA F38 |  |
| Feat'ler s. 47 | Feat kuralı: ASI/feat yuvaları 4/8/12/16, Fighter +6/14, Rogue +10, 19 Epic Boon; Fighting Style yuvası (Fighter 1, Paladin/Ranger 2, Champion 7) (s. 47, s. 61, s. 87) | var-testsiz | TUR-FEAT-ESYA F1 |  |
| Feat'ler s. 47 | Feat kuralı: ASI özelliği "ASI feat'i ya da koşulunu sağladığın başka bir feat"; Fighting Style feat'i (ön koşul: Fighting Style özelliği) de buna dahil (s. 47, s. 87) | var-testsiz | TUR-FEAT-ESYA F2 |  |
| Feat'ler s. 87 | Feat kuralı: Epic Boon yuvası: Epic Boon ya da koşulunu sağladığın başka bir feat (ASI dahil); ASI yuvasına Boon girmez (s. 87, Level 19+) | var-testsiz | TUR-FEAT-ESYA F3 |  |
| Feat'ler s. 87 | Feat kuralı: Fighting Style feat'i yalnız Fighting Style özelliğiyle; yuvada yalnız Fighting Style kategorisi | var-testsiz | TUR-FEAT-ESYA F7 |  |
| Feat'ler s. 83 | Feat kuralı: Köken feat'i geçmişten gelir (s. 83, s. 87 Origin) | var-test edilmiş | TUR-FEAT-ESYA F8; `g1.test.tsx` |  |
| Feat'ler s. 86 | Feat kuralı: Human Versatile: seçilen ek bir köken feat'i | var-testsiz | TUR-FEAT-ESYA F9 |  |
| Feat'ler s. 87 | Feat kuralı: Tekrarsız feat ikinci kez alınamaz ("Repeatable" yoksa bir kez) | var-testsiz | TUR-FEAT-ESYA F10 |  |
| Feat'ler s. 87 | Feat kuralı: ASI: bir skora +2 ya da iki skora +1, 20'yi aşmaz | var-testsiz | TUR-FEAT-ESYA F13 |  |
| Feat'ler s. 88 | Feat kuralı: Epic Boon +1, en çok 30; Spell Recall INT/WIS/CHA, Irresistible Offense STR/DEX | var-testsiz | TUR-FEAT-ESYA F15 |  |
| Feat'ler s. 88 | Feat kuralı: Irresistible Offense, Overwhelming Strike: saldırı zarında 20 → artırılan skor kadar ek hasar | var-test edilmiş | TUR-FEAT-ESYA F34; `te99.test.ts` |  |
| Feat'ler s. 88 | Feat kuralı: Night Spirit, Merge with Shadows: loşta/karanlıkta bonus eylemle Invisible, eylem/bonus/tepkiyle biter | kısmi | TUR-FEAT-ESYA F36; `k19tier4b.test.ts` | F36 bilinçli sapma: değişmedi (bilinçli sapma) |
| Feat'ler s. 88 | Feat kuralı: Night Spirit, Shadowy Form: loşta/karanlıkta Psychic/Radiant dışı direnç | kısmi | TUR-FEAT-ESYA F37; `k19tier4b.test.ts` | F37 bilinçli sapma: değişmedi (bilinçli sapma) |

## 6. Donanım (Equipment) (s. 89–103)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Donanım s. 89 | Coins (CP, SP, EP, GP, PP ve kur) | kısmi | Serüven altını (GP) ve dükkân `data/yerlesim.json` `dukkan`; `k44.test.tsx` | yalnız GP; diğer sikkeler ve çevrim yok |
| Donanım s. 89 | Weapon Proficiency (yetkinliksiz silahta PB yok) | var-test edilmiş | `src/rules/attack.ts`, TUR-FEAT-ESYA S satırları; `b1.test.ts`, `b2.test.ts` +8 |  |
| Donanım s. 91 | Silah: Club (1d4 Bludgeoning; Light; ustalık Slow) | var-test edilmiş | `data/weapons.json` club; `s2spells.test.ts` |  |
| Donanım s. 91 | Silah: Dagger (1d4 Piercing; Finesse, Light, Thrown (Range 20/60); ustalık Nick) | kısmi | `data/weapons.json` dagger; `b95rogue.test.ts`, `k19feat.test.ts` +4; TUR-FEAT-ESYA S13 | S13 bilinçli sapma: değişmedi (bilinçli sapma) |
| Donanım s. 91 | Silah: Greatclub (1d8 Bludgeoning; Two-Handed; ustalık Push) | var-testsiz | `data/weapons.json` greatclub |  |
| Donanım s. 91 | Silah: Handaxe (1d6 Slashing; Light, Thrown (Range 20/60); ustalık Vex) | var-test edilmiş | `data/weapons.json` handaxe; `s1spells.test.ts` |  |
| Donanım s. 91 | Silah: Javelin (1d6 Piercing; Thrown (Range 30/120); ustalık Slow) | var-test edilmiş | `data/weapons.json` javelin; `b95rogue.test.ts`, `te99.test.ts` |  |
| Donanım s. 91 | Silah: Light Hammer (1d4 Bludgeoning; Light, Thrown (Range 20/60); ustalık Nick) | var-testsiz | `data/weapons.json` light-hammer |  |
| Donanım s. 91 | Silah: Mace (1d6 Bludgeoning; —; ustalık Sap) | var-test edilmiş | `data/weapons.json` mace; `b93.test.ts`, `k62acik.test.ts` +3 |  |
| Donanım s. 91 | Silah: Quarterstaff (1d6 Bludgeoning; Versatile (1d8); ustalık Topple) | var-test edilmiş | `data/weapons.json` quarterstaff; `b1.test.ts`, `mastery.test.ts` +1 |  |
| Donanım s. 91 | Silah: Sickle (1d4 Slashing; Light; ustalık Nick) | var-testsiz | `data/weapons.json` sickle |  |
| Donanım s. 91 | Silah: Spear (1d6 Piercing; Thrown (Range 20/60), Versatile (1d8); ustalık Sap) | var-testsiz | `data/weapons.json` spear |  |
| Donanım s. 91 | Silah: Dart (1d4 Piercing; Finesse, Thrown (Range 20/60); ustalık Vex) | var-testsiz | `data/weapons.json` dart; TUR-FEAT-ESYA S2 |  |
| Donanım s. 91 | Silah: Light Crossbow (1d8 Piercing; Ammunition (Range 80/320; Bolt), Loading, Two-Handed; ustalık Slow) | var-test edilmiş | `data/weapons.json` light-crossbow; `te99.test.ts`; TUR-FEAT-ESYA S2 |  |
| Donanım s. 91 | Silah: Shortbow (1d6 Piercing; Ammunition (Range 80/320; Arrow), Two-Handed; ustalık Vex) | var-test edilmiş | `data/weapons.json` shortbow; `mastery.test.ts`, `levelChoices.test.ts` +1; TUR-FEAT-ESYA S2 |  |
| Donanım s. 91 | Silah: Sling (1d4 Bludgeoning; Ammunition (Range 30/120; Bullet); ustalık Slow) | var-testsiz | `data/weapons.json` sling; TUR-FEAT-ESYA S2 |  |
| Donanım s. 91 | Silah: Battleaxe (1d8 Slashing; Versatile (1d10); ustalık Topple) | var-testsiz | `data/weapons.json` battleaxe |  |
| Donanım s. 91 | Silah: Flail (1d8 Bludgeoning; —; ustalık Sap) | var-testsiz | `data/weapons.json` flail |  |
| Donanım s. 91 | Silah: Glaive (1d10 Slashing; Heavy, Reach, Two-Handed; ustalık Graze) | var-testsiz | `data/weapons.json` glaive |  |
| Donanım s. 91 | Silah: Greataxe (1d12 Slashing; Heavy, Two-Handed; ustalık Cleave) | var-test edilmiş | `data/weapons.json` greataxe; `b95fighter.test.ts`, `mastery.test.ts` +1 |  |
| Donanım s. 91 | Silah: Greatsword (2d6 Slashing; Heavy, Two-Handed; ustalık Graze) | var-test edilmiş | `data/weapons.json` greatsword; `mastery.test.ts`, `te99.test.ts` +3 |  |
| Donanım s. 91 | Silah: Halberd (1d10 Slashing; Heavy, Reach, Two-Handed; ustalık Cleave) | var-testsiz | `data/weapons.json` halberd |  |
| Donanım s. 91 | Silah: Lance (1d10 Piercing; Heavy, Reach, Two-Handed (unless mounted); ustalık Topple) | var-test edilmiş | `data/weapons.json` lance; `binekMb1.test.ts`, `binekMb2.test.ts`; TUR-FEAT-ESYA S21 |  |
| Donanım s. 91 | Silah: Longsword (1d8 Slashing; Versatile (1d10); ustalık Sap) | var-test edilmiş | `data/weapons.json` longsword; `b1.test.ts`, `b2.test.ts` +34 |  |
| Donanım s. 91 | Silah: Maul (2d6 Bludgeoning; Heavy, Two-Handed; ustalık Topple) | var-test edilmiş | `data/weapons.json` maul; `mastery.test.ts` |  |
| Donanım s. 91 | Silah: Morningstar (1d8 Piercing; —; ustalık Sap) | var-testsiz | `data/weapons.json` morningstar |  |
| Donanım s. 91 | Silah: Pike (1d10 Piercing; Heavy, Reach, Two-Handed; ustalık Push) | var-testsiz | `data/weapons.json` pike |  |
| Donanım s. 91 | Silah: Rapier (1d8 Piercing; Finesse; ustalık Vex) | var-test edilmiş | `data/weapons.json` rapier; `mastery.test.ts`, `levelChoices.test.ts` |  |
| Donanım s. 91 | Silah: Scimitar (1d6 Slashing; Finesse, Light; ustalık Nick) | var-test edilmiş | `data/weapons.json` scimitar; `levelChoices.test.ts` |  |
| Donanım s. 91 | Silah: Shortsword (1d6 Piercing; Finesse, Light; ustalık Vex) | var-test edilmiş | `data/weapons.json` shortsword; `b94paladin.test.ts`, `mastery.test.ts` +2 |  |
| Donanım s. 91 | Silah: Trident (1d8 Piercing; Thrown (Range 20/60), Versatile (1d10); ustalık Topple) | var-testsiz | `data/weapons.json` trident |  |
| Donanım s. 91 | Silah: Warhammer (1d8 Bludgeoning; Versatile (1d10); ustalık Push) | var-test edilmiş | `data/weapons.json` warhammer; `mastery.test.ts`, `sd3.test.tsx` |  |
| Donanım s. 91 | Silah: War Pick (1d8 Piercing; Versatile (1d10); ustalık Sap) | var-testsiz | `data/weapons.json` war-pick |  |
| Donanım s. 91 | Silah: Whip (1d4 Slashing; Finesse, Reach; ustalık Slow) | var-testsiz | `data/weapons.json` whip |  |
| Donanım s. 91 | Silah: Blowgun (1 Piercing; Ammunition (Range 25/100; Needle), Loading; ustalık Vex) | var-testsiz | `data/weapons.json` blowgun; TUR-FEAT-ESYA S4 |  |
| Donanım s. 91 | Silah: Hand Crossbow (1d6 Piercing; Ammunition (Range 30/120; Bolt), Light, Loading; ustalık Vex) | var-test edilmiş | `data/weapons.json` hand-crossbow; `te99.test.ts` |  |
| Donanım s. 91 | Silah: Heavy Crossbow (1d10 Piercing; Ammunition (Range 100/400; Bolt), Heavy, Loading, Two-Handed; ustalık Push) | var-testsiz | `data/weapons.json` heavy-crossbow |  |
| Donanım s. 91 | Silah: Longbow (1d8 Piercing; Ammunition (Range 150/600; Arrow), Heavy, Two-Handed; ustalık Slow) | var-test edilmiş | `data/weapons.json` longbow; `b2.test.ts`, `b3.test.ts` +13 |  |
| Donanım s. 91 | Silah: Musket (1d12 Piercing; Ammunition (Range 40/120; Bullet), Loading, Two-Handed; ustalık Slow) | var-testsiz | `data/weapons.json` musket |  |
| Donanım s. 91 | Silah: Pistol (1d10 Piercing; Ammunition (Range 30/90; Bullet), Loading; ustalık Vex) | var-testsiz | `data/weapons.json` pistol |  |
| Donanım s. 89 | Silah özelliği: Ammunition | kısmi | `src/rules/weapons.ts`, `hands.ts`; `k18.test.tsx`, `reasons.test.ts`; TUR-FEAT-ESYA S7, S8, S9 | S8 bilinçli sapma: değişmedi (bilinçli sapma); S9 yok: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 89 | Silah özelliği: Finesse | var-test edilmiş | `src/rules/weapons.ts`, `hands.ts`; `features.test.ts`, `k19feat.test.ts` +3; TUR-FEAT-ESYA S10 |  |
| Donanım s. 89 | Silah özelliği: Heavy | var-test edilmiş | `src/rules/weapons.ts`, `hands.ts`; `cleric.test.ts`, `k19feat2.test.ts` +14; TUR-FEAT-ESYA S11 |  |
| Donanım s. 89 | Silah özelliği: Light | kısmi | `src/rules/weapons.ts`, `hands.ts`; `a6spells.test.ts`, `a7spells.test.ts` +45; TUR-FEAT-ESYA S12, S25 | S25 kısmi: ertelendi (metin belirsiz: Nick hangi silahta, K-S2) |
| Donanım s. 89 | Silah özelliği: Loading | var-test edilmiş | `src/rules/weapons.ts`, `hands.ts`; `te99.test.ts`, `k18.test.tsx`; TUR-FEAT-ESYA S14 |  |
| Donanım s. 89 | Silah özelliği: Range | var-test edilmiş | `src/rules/weapons.ts`, `hands.ts`; `diceUnlock.test.ts`, `k18h10.test.ts` +150; TUR-FEAT-ESYA S15 |  |
| Donanım s. 89 | Silah özelliği: Reach | kısmi | `src/rules/weapons.ts`, `hands.ts`; `diceUnlock.test.ts`, `setup.test.ts` +73; TUR-FEAT-ESYA S17 | S17 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 89 | Silah özelliği: Thrown | kısmi | `src/rules/weapons.ts`, `hands.ts`; `paladin.test.ts`, `range.test.ts` +1; TUR-FEAT-ESYA S18, S19, S33 | S19 bilinçli sapma: değişmedi (bilinçli sapma); S33 yok: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 89 | Silah özelliği: Two-Handed | var-test edilmiş | `src/rules/weapons.ts`, `hands.ts`; TUR-FEAT-ESYA S20 |  |
| Donanım s. 89 | Silah özelliği: Versatile | var-test edilmiş | `src/rules/weapons.ts`, `hands.ts`; `range.test.ts`, `data.test.ts` +2; TUR-FEAT-ESYA S22 |  |
| Donanım s. 90 | Weapon Mastery: Cleave | var-test edilmiş | `src/battle/mastery.ts`; class-features masteries.cleave (ok); `mastery.test.ts`, `k18.test.tsx`; TUR-FEAT-ESYA S23 |  |
| Donanım s. 90 | Weapon Mastery: Graze | var-test edilmiş | `src/battle/mastery.ts`; class-features masteries.graze (ok); `mastery.test.ts`, `k18.test.tsx`; TUR-FEAT-ESYA S24 |  |
| Donanım s. 90 | Weapon Mastery: Nick | var-test edilmiş | `src/battle/mastery.ts`; class-features masteries.nick (ok); `mastery.test.ts`, `k18.test.tsx` |  |
| Donanım s. 90 | Weapon Mastery: Push | var-test edilmiş | `src/battle/mastery.ts`; class-features masteries.push (ok); `binekMb1.test.ts`, `binekMb2.test.ts` +16; TUR-FEAT-ESYA S26 |  |
| Donanım s. 90 | Weapon Mastery: Sap | kısmi | `src/battle/mastery.ts`; class-features masteries.sap (ok); `b95fighter.test.ts`, `k18h3.test.ts` +2; TUR-FEAT-ESYA S27 | S27 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 90 | Weapon Mastery: Slow | var-test edilmiş | `src/battle/mastery.ts`; class-features masteries.slow (ok); `k19spells.test.ts`, `lineage.test.ts` +2; TUR-FEAT-ESYA S28 |  |
| Donanım s. 90 | Weapon Mastery: Topple | var-test edilmiş | `src/battle/mastery.ts`; class-features masteries.topple (ok); `mastery.test.ts`, `monk.test.ts` +1; TUR-FEAT-ESYA S29 |  |
| Donanım s. 90 | Weapon Mastery: Vex | kısmi | `src/battle/mastery.ts`; class-features masteries.vex (ok); `mastery.test.ts`, `k18.test.tsx`; TUR-FEAT-ESYA S30 | S30 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 91 | Silah kuralı: Simple Melee 10 silah: zar, tür, özellikler | var-testsiz | TUR-FEAT-ESYA S1 |  |
| Donanım s. 91 | Silah kuralı: Martial Melee 18 silah | var-testsiz | TUR-FEAT-ESYA S3 |  |
| Donanım s. 91 | Silah kuralı: Her silahın ustalığı (Mastery sütunu) | var-testsiz | TUR-FEAT-ESYA S5 |  |
| Donanım s. 89 | Silah kuralı: Weapon Proficiency: yetkin değilse PB eklenmez; Melee STR, Ranged DEX | var-testsiz | TUR-FEAT-ESYA S6 |  |
| Donanım s. 15 | Silah kuralı: Yakın düşman: 5 ft içinde seni gören, Incapacitated olmayan düşman varken menzilli saldırı dezavantajlı | var-testsiz | TUR-FEAT-ESYA S16 |  |
| Donanım s. 89 | Silah kuralı: Ustalık yalnız özelliği açan karaktere; seçilen silahlar, hak sayısı | var-test edilmiş | TUR-FEAT-ESYA S31; `mastery.test.ts` |  |
| Donanım s. 183 | Silah kuralı: Improvised Weapons: PB yok, 1d4, GM benzer silahı o silah sayabilir | kısmi | TUR-FEAT-ESYA S32; `te99.test.ts` | S32 kısmi: kısmen düzeldi (99: nesne silahı 1d4; eşdeğer silah yetkinliği ertelendi) |
| Donanım s. 183 | Silah kuralı: Nesne fırlatma ≈ doğaçlama fırlatma | kısmi | TUR-FEAT-ESYA S34 | S34 bilinçli sapma: değişmedi (bilinçli sapma) |
| Donanım s. 98 | Silah kuralı: Net: Attack'in bir saldırısı yerine, 15 ft, görülen yaratık, DEX save DC 8+DEX+PB, Restrained, Huge+ otomatik başarı; kaçış DC 10 STR (Athletics) kendisi ya da 5 ft içindeki; ağ AC 10, 5 HP | kısmi | TUR-FEAT-ESYA S35 | S35 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 49 | Silah kuralı: Martial Arts: Monk silahlarında DEX ve Martial Arts zarı (yakın dövüşle sınırlı değil) | kısmi | TUR-FEAT-ESYA S36 | S36 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 92 | Zırh: Padded Armor (AC 11 + Dex modifier) | var-test edilmiş | `data/armor.json`; `altSoy.test.ts`, `data.test.ts` |  |
| Donanım s. 92 | Zırh: Leather Armor (AC 11 + Dex modifier) | var-test edilmiş | `data/armor.json`; `altSoy.test.ts`, `b94ranger.test.ts` +10 |  |
| Donanım s. 92 | Zırh: Studded Leather Armor (AC 12 + Dex modifier) | var-test edilmiş | `data/armor.json`; `data.test.ts`, `stats.test.ts` |  |
| Donanım s. 92 | Zırh: Hide Armor (AC 12 + Dex modifier (max 2)) | var-test edilmiş | `data/armor.json`; `altSoy.test.ts`, `data.test.ts` |  |
| Donanım s. 92 | Zırh: Chain Shirt (AC 13 + Dex modifier (max 2)) | var-test edilmiş | `data/armor.json`; `b1zirh.test.ts`, `b93cleric.test.ts` +6; TUR-FEAT-ESYA Z2 |  |
| Donanım s. 92 | Zırh: Scale Mail (AC 14 + Dex modifier (max 2)) | var-test edilmiş | `data/armor.json`; `data.test.ts` |  |
| Donanım s. 92 | Zırh: Breastplate (AC 14 + Dex modifier (max 2)) | var-test edilmiş | `data/armor.json`; `altSoy.test.ts`, `stealth.test.ts` +1; TUR-FEAT-ESYA Z2 |  |
| Donanım s. 92 | Zırh: Half Plate Armor (AC 15 + Dex modifier (max 2)) | var-test edilmiş | `data/armor.json`; `stealth.test.ts`, `data.test.ts` |  |
| Donanım s. 92 | Zırh: Ring Mail (AC 14) | var-test edilmiş | `data/armor.json`; `data.test.ts` |  |
| Donanım s. 92 | Zırh: Chain Mail (AC 16) | var-test edilmiş | `data/armor.json`; `altSoy.test.ts`, `areaAttack.test.ts` +22; TUR-FEAT-ESYA Z4 |  |
| Donanım s. 92 | Zırh: Splint Armor (AC 17) | var-test edilmiş | `data/armor.json`; `data.test.ts` |  |
| Donanım s. 92 | Zırh: Plate Armor (AC 18) | var-test edilmiş | `data/armor.json`; `altSoy.test.ts`, `stealth.test.ts` +5 |  |
| Donanım s. 92 | Zırh: Shield (AC +2) | kısmi | `data/armor.json`; `a6spells.test.ts`, `b93wizard.test.ts` +21; TUR-FEAT-ESYA Z9, Z10, Z11 | Z9 yok: ertelendi (kalkan tak/çıkar komutu) |
| Donanım s. 92 | Zırh kuralı: Light zırh: Padded 11, Leather 11, Studded 12 + DEX, sınırsız | var-testsiz | TUR-FEAT-ESYA Z1 |  |
| Donanım s. 92 | Zırh kuralı: Heavy zırh: Ring 14, Chain 16, Splint 17, Plate 18, DEX eklenmez | var-testsiz | TUR-FEAT-ESYA Z3 |  |
| Donanım s. 92 | Zırh kuralı: Strength cezası her giyene | kısmi | TUR-FEAT-ESYA Z5 | Z5 bilinçli sapma: değişmedi (bilinçli sapma) |
| Donanım s. 92 | Zırh kuralı: Stealth sütunu: Padded, Scale, Half Plate, Ring, Chain, Splint, Plate "Disadvantage" | var-testsiz | TUR-FEAT-ESYA Z6 |  |
| Donanım s. 92 | Zırh kuralı: Stealth dezavantajı Dexterity (Stealth) kontrollerinde | var-testsiz | TUR-FEAT-ESYA Z7 |  |
| Donanım s. 92 | Zırh kuralı: Giyme/çıkarma: Light 1 dk, Medium 5/1 dk, Heavy 10/5 dk | var-testsiz | TUR-FEAT-ESYA Z8 |  |
| Donanım s. 92 | Zırh kuralı: Eğitimsiz kalkanda hiçbir AC faydası yok | kısmi | TUR-FEAT-ESYA Z12 | Z12 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 92 | Zırh kuralı: Tek zırh, tek kalkan (s. 92 One at a Time) | var-testsiz | TUR-FEAT-ESYA Z13 |  |
| Donanım s. 92 | Zırh kuralı: Eğitimsiz zırh: büyü yapılamaz (s. 92, s. 177) | var-testsiz | TUR-FEAT-ESYA Z14 |  |
| Donanım s. 92 | Zırh kuralı: Eğitimsiz zırh: STR/DEX save'leri dezavantajlı (s. 92 "any D20 Test") | var-testsiz | TUR-FEAT-ESYA Z15 |  |
| Donanım s. 92 | Zırh kuralı: Eğitimsiz zırh: STR ya da DEX içeren saldırı zarı dezavantajlı | var-test edilmiş | TUR-FEAT-ESYA Z16; `te99.test.ts` |  |
| Donanım s. 92 | Zırh kuralı: Eğitimsiz zırh: DEX (Stealth) kontrolü dezavantajlı | var-test edilmiş | TUR-FEAT-ESYA Z17; `te99.test.ts` |  |
| Donanım s. 13 | Zırh kuralı: Eğitimsiz zırh: Initiative (DEX kontrolü, s. 13) dezavantajlı | var-test edilmiş | TUR-FEAT-ESYA Z18; `te99.test.ts` |  |
| Donanım s. 28 | Zırh kuralı: Eğitim kaynağı: sınıf "Armor Training" (s. 28–63), Divine Order Protector, paket `yetkinlik` | var-testsiz | TUR-FEAT-ESYA Z19 |  |
| Donanım s. 220 | Zırh kuralı: Elven Chain: "considered trained" | yok | TUR-FEAT-ESYA Z20 | Z20 yok: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 92 | Zırh kuralı: Oluşturucu: eğitimsiz zırh/kalkan uyarısı | var-testsiz | TUR-FEAT-ESYA Z21 |  |
| Donanım s. 29 | Zırh kuralı: Barbarian Unarmored Defense: zırhsız 10 + DEX + CON, kalkanla geçerli | var-testsiz | TUR-FEAT-ESYA Z22 |  |
| Donanım s. 50 | Zırh kuralı: Monk Unarmored Defense: zırh ve kalkan yokken 10 + DEX + WIS (s. 50); Unarmored Movement, Martial Arts aynı şart | var-testsiz | TUR-FEAT-ESYA Z23 |  |
| Donanım s. 177 | Zırh kuralı: Birden fazla taban AC hesabı: biri seçilir, birleşmez | var-testsiz | TUR-FEAT-ESYA Z24 |  |
| Donanım s. 145 | Zırh kuralı: Mage Armor: taban AC 13 + DEX; kalkan ve diğer bonuslar tabana eklenir (s. 145, s. 177) | var-test edilmiş | TUR-FEAT-ESYA Z25; `te99.test.ts` |  |
| Donanım s. 145 | Zırh kuralı: Mage Armor yalnız zırhsız hedefe | var-testsiz | TUR-FEAT-ESYA Z26 |  |
| Donanım s. 112 | Zırh kuralı: Barkskin: AC 17'den düşükse 17 | var-testsiz | TUR-FEAT-ESYA Z27 |  |
| Donanım s. 88 | Zırh kuralı: Defense (Fighting Style): Light/Medium/Heavy zırh giyerken +1 | var-testsiz | TUR-FEAT-ESYA Z28 |  |
| Donanım s. 210 | Zırh kuralı: Sihirli zırh +N: yalnız o zırh türüne (Armor, +N "any"; Dwarven Plate = Plate; Elven Chain = Chain) | kısmi | TUR-FEAT-ESYA Z29 | Z29 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 231 | Zırh kuralı: Mithral Armor: Stealth dezavantajı ve Strength şartı kalkar | kısmi | TUR-FEAT-ESYA Z30 | Z30 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 90 | Zırh kuralı: Two-Handed silah iki el ister: kalkanla saldırılamaz | var-test edilmiş | TUR-FEAT-ESYA Z31; `te99.test.ts` |  |
| Donanım s. 28 | Zırh kuralı: Rage: Heavy zırhla başlatılamaz, Heavy giyilince biter | var-testsiz | TUR-FEAT-ESYA Z32 |  |
| Donanım s. 92 | Zırh kuralı: Canavar: stat bloğundaki zırhta eğitimli, AC bloktan (s. 92 Armor Training) | var-testsiz | TUR-FEAT-ESYA Z33 |  |
| Donanım s. 93 | Tool Proficiency (alet kontrolüne PB, beceriyle avantaj) | kısmi | TUR-FEAT-ESYA G13 (bilinçli sapma: yalnız Thieves' Tools savaşta) | genel alet yetkinliği; yetenek kontrolü sistemi savaş dışı |
| Donanım s. 93 | Alet: Alchemist’s Supplies | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Brewer’s Supplies | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Calligrapher’s Supplies | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Carpenter’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Cartographer’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Cobbler’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Cook’s Utensils | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Glassblower’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Jeweler’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Leatherworker’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Mason’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Painter’s Supplies | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Potter’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 93 | Alet: Smith’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 94 | Alet: Tinker’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 94 | Alet: Weaver’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 94 | Alet: Woodcarver’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 94 | Alet: Disguise Kit | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 94 | Alet: Forgery Kit | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 94 | Alet: Gaming Set | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 94 | Alet: Herbalism Kit | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 94 | Alet: Musical Instrument | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 94 | Alet: Navigator’s Tools | savaş dışı | yalnız geçmiş yetkinliği adı (`data/backgrounds.json`); alet kullanımı/yapım yok | alet kontrolü ve Crafting ile birlikte |
| Donanım s. 94 | Alet: Poisoner’s Kit | var-test edilmiş | `data/esya-siniflandirma.json` kod: Cunning Strike Poison; `k19feat.test.ts` | zehir hasadı ve zehir hazırlama yok (bkz. 9. Poison) |
| Donanım s. 94 | Alet: Thieves’ Tools | kısmi | `src/battle/objects.ts` (`toolProfs` thieves-tools, kilit açma); TUR-FEAT-ESYA G15; `te99.test.ts` | G15 kısmi: kısmen düzeldi (99: DEX + PB, avantaj; envanter yok); envanterde alet yok |
| Donanım s. 94 | Eşya: Acid | var-test edilmiş | `data/items*.json` acid (kullanım throw); `altSoy.test.ts`, `b1.test.ts` +11; TUR-FEAT-ESYA D11 |  |
| Donanım s. 94 | Eşya: Alchemist’s Fire | var-testsiz | `data/items*.json` alchemists-fire (kullanım throw) |  |
| Donanım s. 94 | Eşya: Ammunition | kısmi | `data/items*.json` ammunition: cephane savaşta sayılır (silah verisi, 20 adet); TUR-FEAT-ESYA D21, D27, D30 | D21 kısmi: ertelendi (cephane stoku); D27 kısmi: kısmen düzeldi (99: yalnız cephaneli silah; parçanın tek kullanımı ertelendi); D30 kısmi: kısmen düzeldi (99: yalnız cephaneli silah; tür, DC 17 CON, Force, tek kullanım ertelendi) |
| Donanım s. 96 | Eşya: Antitoxin | var-testsiz | `data/items*.json` antitoxin (kullanım effect); TUR-FEAT-ESYA D10 |  |
| Donanım s. 96 | Eşya: Arcane Focus | savaş dışı | `data/items*.json` arcane-focus: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 96 | Eşya: Backpack | savaş dışı | `data/items*.json` backpack: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 96 | Eşya: Ball Bearings | kısmi | `data/items*.json` ball-bearings: Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri; TUR-FEAT-ESYA D17 | D17 yok: ertelendi (Utilize eşyaları) |
| Donanım s. 96 | Eşya: Barrel | savaş dışı | `data/items*.json` barrel: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 96 | Eşya: Basket | savaş dışı | `data/items*.json` basket: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 96 | Eşya: Bedroll | savaş dışı | `data/items*.json` bedroll: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 96 | Eşya: Bell | savaş dışı | `data/items*.json` bell: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 96 | Eşya: Blanket | savaş dışı | `data/items*.json` blanket: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 96 | Eşya: Block and Tackle | savaş dışı | `data/items*.json` block-and-tackle: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 96 | Eşya: Book | savaş dışı | `data/items*.json` book: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 96 | Eşya: Bottle, Glass | savaş dışı | `data/items*.json` bottle-glass: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 96 | Eşya: Bucket | savaş dışı | `data/items*.json` bucket: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 96 | Eşya: Burglar’s Pack | savaş dışı | `data/items*.json` burglars-pack: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 96 | Eşya: Caltrops | savaş dışı | `data/items*.json` caltrops: Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri |  |
| Donanım s. 96 | Eşya: Candle | var-testsiz | `data/items*.json` candle (taşınırken etki) |  |
| Donanım s. 96 | Eşya: Case, Crossbow Bolt | savaş dışı | `data/items*.json` case-crossbow-bolt: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 96 | Eşya: Case, Map or Scroll | savaş dışı | `data/items*.json` case-map-or-scroll: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 96 | Eşya: Chain | savaş dışı | `data/items*.json` chain: Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri |  |
| Donanım s. 97 | Eşya: Chest | savaş dışı | `data/items*.json` chest: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 97 | Eşya: Climber’s Kit | savaş dışı | `data/items*.json` climbers-kit: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 97 | Eşya: Clothes, Fine | savaş dışı | `data/items*.json` clothes-fine: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 97 | Eşya: Clothes, Traveler’s | savaş dışı | `data/items*.json` clothes-travelers: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 97 | Eşya: Component Pouch | savaş dışı | `data/items*.json` component-pouch: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 97 | Eşya: Costume | savaş dışı | `data/items*.json` costume: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 97 | Eşya: Crowbar | savaş dışı | `data/items*.json` crowbar: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 97 | Eşya: Diplomat’s Pack | savaş dışı | `data/items*.json` diplomats-pack: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 97 | Eşya: Druidic Focus | savaş dışı | `data/items*.json` druidic-focus: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 97 | Eşya: Dungeoneer’s Pack | savaş dışı | `data/items*.json` dungeoneers-pack: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 97 | Eşya: Entertainer’s Pack | savaş dışı | `data/items*.json` entertainers-pack: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 97 | Eşya: Explorer’s Pack | savaş dışı | `data/items*.json` explorers-pack: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 97 | Eşya: Flask | savaş dışı | `data/items*.json` flask: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 97 | Eşya: Grappling Hook | savaş dışı | `data/items*.json` grappling-hook: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 97 | Eşya: Healer’s Kit | var-testsiz | `data/items*.json` healers-kit (taşınırken etki) |  |
| Donanım s. 97 | Eşya: Holy Symbol | savaş dışı | `data/items*.json` holy-symbol: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 97 | Eşya: Holy Water | var-testsiz | `data/items*.json` holy-water (kullanım throw); TUR-FEAT-ESYA D13 |  |
| Donanım s. 97 | Eşya: Hunting Trap | kısmi | `data/items*.json` hunting-trap: Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri; TUR-FEAT-ESYA D18 | D18 yok: ertelendi (Utilize eşyaları) |
| Donanım s. 98 | Eşya: Ink | savaş dışı | `data/items*.json` ink: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 98 | Eşya: Ink Pen | savaş dışı | `data/items*.json` ink-pen: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 98 | Eşya: Jug | savaş dışı | `data/items*.json` jug: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 98 | Eşya: Ladder | savaş dışı | `data/items*.json` ladder: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 98 | Eşya: Lamp | var-testsiz | `data/items*.json` lamp (taşınırken etki) |  |
| Donanım s. 98 | Eşya: Lantern, Bullseye | var-testsiz | `data/items*.json` lantern-bullseye (taşınırken etki) |  |
| Donanım s. 98 | Eşya: Lantern, Hooded | var-testsiz | `data/items*.json` lantern-hooded (taşınırken etki) |  |
| Donanım s. 98 | Eşya: Lock | savaş dışı | `data/items*.json` lock: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 98 | Eşya: Magnifying Glass | savaş dışı | `data/items*.json` magnifying-glass: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 98 | Eşya: Manacles | savaş dışı | `data/items*.json` manacles: Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri |  |
| Donanım s. 98 | Eşya: Map | savaş dışı | `data/items*.json` map: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 98 | Eşya: Mirror | savaş dışı | `data/items*.json` mirror: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 98 | Eşya: Net | kısmi | `data/items*.json` net (kullanım throw); TUR-FEAT-ESYA D14 | D14 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 98 | Eşya: Oil | kısmi | `data/items*.json` oil: Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri; TUR-FEAT-ESYA D9, D16 | D9 doğrulanmadı: doğrulandı (44 kayıt testi, hata yok); D16 yok: ertelendi (Utilize eşyaları) |
| Donanım s. 99 | Eşya: Paper | savaş dışı | `data/items*.json` paper: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 99 | Eşya: Parchment | savaş dışı | `data/items*.json` parchment: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 99 | Eşya: Perfume | savaş dışı | `data/items*.json` perfume: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 99 | Eşya: Poison, Basic | var-testsiz | `data/items*.json` poison-basic (kullanım coat) |  |
| Donanım s. 99 | Eşya: Pole | savaş dışı | `data/items*.json` pole: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 99 | Eşya: Pot, Iron | savaş dışı | `data/items*.json` pot-iron: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 99 | Eşya: Potion of Healing | var-test edilmiş | sihirli eşya olarak (bkz. 10); `diceUnlock.test.ts`, `evaluate.test.ts` +4; TUR-FEAT-ESYA D1 |  |
| Donanım s. 99 | Eşya: Pouch | savaş dışı | `data/items*.json` pouch: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 99 | Eşya: Priest’s Pack | savaş dışı | `data/items*.json` priests-pack: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 99 | Eşya: Quiver | savaş dışı | `data/items*.json` quiver: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 99 | Eşya: Ram, Portable | savaş dışı | `data/items*.json` ram-portable: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 99 | Eşya: Rations | savaş dışı | `data/items*.json` rations: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 99 | Eşya: Robe | savaş dışı | `data/items*.json` robe: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 99 | Eşya: Rope | savaş dışı | `data/items*.json` rope: Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri |  |
| Donanım s. 99 | Eşya: Sack | savaş dışı | `data/items*.json` sack: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 99 | Eşya: Scholar’s Pack | savaş dışı | `data/items*.json` scholars-pack: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 99 | Eşya: Shovel | savaş dışı | `data/items*.json` shovel: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 99 | Eşya: Signal Whistle | savaş dışı | `data/items*.json` signal-whistle: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 99 | Eşya: Spell Scroll | kısmi | sihirli eşya olarak (bkz. 10); TUR-FEAT-ESYA D37 | D37 bilinçli sapma: ertelendi (Game Master eşyalarının `bonus`'u) |
| Donanım s. 100 | Eşya: Spikes, Iron | savaş dışı | `data/items*.json` spikes-iron: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 100 | Eşya: Spyglass | savaş dışı | `data/items*.json` spyglass: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 100 | Eşya: String | savaş dışı | `data/items*.json` string: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 100 | Eşya: Tent | savaş dışı | `data/items*.json` tent: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 100 | Eşya: Tinderbox | savaş dışı | `data/items*.json` tinderbox: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 100 | Eşya: Torch | kısmi | `data/items*.json` torch (taşınırken etki); TUR-FEAT-ESYA D20 | D20 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 100 | Eşya: Vial | savaş dışı | `data/items*.json` vial: kap/giysi/araç; savaşta mekanik karşılığı yok |  |
| Donanım s. 100 | Eşya: Waterskin | savaş dışı | `data/items*.json` waterskin: keşif/yolculuk eşyası (hikâye) |  |
| Donanım s. 236 | Donanım kuralı: Potions of Healing: 2d4+2 / 4d4+4 / 8d4+8 / 10d4+20 | var-test edilmiş | TUR-FEAT-ESYA D2; `items.test.ts` |  |
| Donanım s. 204 | Donanım kuralı: İksir sarf edilir, "used up" (s. 204); envanterde birden çok iksir | kısmi | TUR-FEAT-ESYA D3 | D3 kısmi: ertelendi (gerçek envanterden iksir düşmesi) |
| Donanım s. 236 | Donanım kuralı: Potion of Heroism: 10 geçici HP + Bless, 1 saat | var-testsiz | TUR-FEAT-ESYA D4 |  |
| Donanım s. 236 | Donanım kuralı: Potion of Invisibility: 1 saat, saldırı/hasar/büyüyle biter | var-testsiz | TUR-FEAT-ESYA D5 |  |
| Donanım s. 236 | Donanım kuralı: Potion of Speed: Haste etkisi 1 dakika, konsantrasyonsuz, uyuşukluk dalgası yok | var-test edilmiş | TUR-FEAT-ESYA D6; `te99.test.ts` |  |
| Donanım s. 236 | Donanım kuralı: Potion of Poison: 4d6 Poison her durumda; DC 13 CON save başarısızsa 1 saat Poisoned | var-test edilmiş | TUR-FEAT-ESYA D7; `te99.test.ts` |  |
| Donanım s. 235 | Donanım kuralı: Potion of Giant Strength (6 tür): STR skoru 1 saat X olur | kısmi | TUR-FEAT-ESYA D8 | D8 bilinçli sapma: değişmedi (bilinçli sapma) |
| Donanım s. 94 | Donanım kuralı: Alchemist's Fire: 1d4 Fire + Burning; Burning tur başı 1d4, söndürme eylem + Prone (s. 94, s. 178) | var-test edilmiş | TUR-FEAT-ESYA D12; `te99.test.ts` |  |
| Donanım s. 99 | Donanım kuralı: Basic Poison: Bonus Action, yalnız Piercing/Slashing hasarda +1d4 Poison, 1 dakika ya da ilk hasara dek | kısmi | TUR-FEAT-ESYA D15 | D15 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 97 | Donanım kuralı: Healer's Kit: Utilize ile zarsız stabilize, 10 kullanım | kısmi | TUR-FEAT-ESYA D19 | D19 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 177 | Donanım kuralı: Attunement: aynı anda en çok 3 eşya | var-testsiz | TUR-FEAT-ESYA D22 |  |
| Donanım s. 205 | Donanım kuralı: Uyum ön şartı: sınıf ya da "by a Spellcaster" | yok | TUR-FEAT-ESYA D23 | D23 yok: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 210 | Donanım kuralı: Armor/Shield +1..+3, Ring/Cloak of Protection (+1 AC ve save), Bracers of Defense (+2 zırhsız ve kalkansız) | var-testsiz | TUR-FEAT-ESYA D24 |  |
| Donanım s. 211 | Donanım kuralı: Yetenek skoru ayarlayan eşyalar: Belt of Giant Strength ×6, Gauntlets of Ogre Power, Headband of Intellect, Amulet of Health (skor yüksekse etkisiz) | var-testsiz | TUR-FEAT-ESYA D25 |  |
| Donanım s. 253 | Donanım kuralı: Weapon +1/+2/+3: o silahla saldırı ve hasar | kısmi | TUR-FEAT-ESYA D26 | D26 kısmi: ertelendi (eşya ↔ silah bağı yeni şema ister, K-D2) |
| Donanım s. 223 | Donanım kuralı: Flame Tongue: Bonus Action ile tutuşur, tutuşukken +2d6 Fire, 40 ft parlak + 40 ft loş | kısmi | TUR-FEAT-ESYA D28; `k19items.test.ts` | D28 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 228 | Donanım kuralı: Javelin of Lightning: isabette Lightning'e çevir; Lightning Bolt: 120 ft 5 ft çizgi, DC 13 DEX, 4d6 yarı, şafakta bir | kısmi | TUR-FEAT-ESYA D29; `te99.test.ts` | D29 kısmi: kısmen düzeldi (99: +4d6 kalktı, Javelin Lightning türü; Lightning Bolt ertelendi) |
| Donanım s. 209 | Donanım kuralı: Diğer isabet ekli silahlar (24 `onHit`; Dragon/Giant Slayer, Holy Avenger, Mace of Disruption, Sun Blade, Frost Brand, Vicious Weapon…) | kısmi | TUR-FEAT-ESYA D31 | D31 kısmi: ertelendi (eşya ↔ silah bağı, K-D2) |
| Donanım s. 233 | Donanım kuralı: Yüklü büyü eşyaları: Wand of Magic Missiles (1–3 yük, yük başına +1 seviye), Wand of Fireballs (DC 15), Necklace of Fireballs, Staff of Healing (büyü başına farklı yük) | kısmi | TUR-FEAT-ESYA D32; `k19items.test.ts`, `te99.test.ts` | D32 kısmi: kısmen düzeldi (yük kalıcı; yükle yukarı seviye ertelendi) |
| Donanım s. 206 | Donanım kuralı: Şarjların kalıcılığı ve şafakta yenilenme (1d6+1 vb.), son yükte 1d20 (s. 206 "Charges", s. 250–251) | var-testsiz | TUR-FEAT-ESYA D33 |  |
| Donanım s. 214 | Donanım kuralı: Boots of Speed: Bonus Action ile hız ×2 ve fırsat saldırısına dezavantaj, toplam 10 dakika, kapatılabilir | kısmi | TUR-FEAT-ESYA D34 | D34 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 215 | Donanım kuralı: Cloak of Displacement: saldırılara dezavantaj; hasar alınca sonraki turuna dek, hız 0'da bastırılır | kısmi | TUR-FEAT-ESYA D35 | D35 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 251 | Donanım kuralı: Wand of the War Mage +N: yalnız büyü saldırısına +N ve yarım siperi yok sayma | kısmi | TUR-FEAT-ESYA D36 | D36 kısmi: ertelendi (bu turun kapsamı dışında) |
| Donanım s. 94 | Donanım kuralı: Yapay zekânın eşya kullanması (SRD kuralı değil; oyun) | kısmi | TUR-FEAT-ESYA D38 | D38 bilinçli sapma: değişmedi (bilinçli sapma) |
| Donanım s. 100 | Mounts and Cargo (binek hayvanları, taşıma) | kısmi | binek kuralları MB1–MB8 (`mounted.ts`, `data/binek.json` 7 SRD bineği + Mastiff); satın alma/yük taşıma yok | bineği Serüven dükkânında satma; yük hayvanı taşıma kapasitesi |
| Donanım s. 100 | Barding (binek zırhı) | yok | veride yok | bineğe zırh (AC) seçimi |
| Donanım s. 100 | Saddles (Exotic, Military, Riding; askeri eyerde düşmemeye avantaj) | yok | veride yok; binek DEX 10 save'inde eyer avantajı yok | Military Saddle avantajı `mounted.ts` düşme save'ine |
| Donanım s. 100 | Large Vehicles (gemi, kızak, araba; hız, AC, HP, Damage Threshold) | yok | dünya haritasında gemi yolculuğu hızı var (`gezinti-kurallari.json` `gemiMilSaat`), araç kaydı yok | savaş dışı; araç istatistikleri yok |
| Donanım s. 101 | Lifestyle Expenses (7 kademe) | savaş dışı | oyunda karşılığı yok |  |
| Donanım s. 101 | Food, Drink, and Lodging | kısmi | han ücreti `data/yerlesim.json` `hanUcreti` (Serüven hanı) | SRD fiyat tablosu (yemek, içki, oda kademesi) yok |
| Donanım s. 102 | Hirelings (vasıflı/vasıfsız, haberci) | savaş dışı | oyunda karşılığı yok |  |
| Donanım s. 102 | Spellcasting services (büyü hizmeti fiyatları) | kısmi | tapınak diriltmesi `moral_dirilt` ve hub tapınağı (`HubTemple`); `moral.test.ts` | SRD seviye başına fiyat tablosu yok |
| Donanım s. 102 | Magic Items: satın alma ve tanımlama (Identify, kısa dinlenmede inceleme) | kısmi | dükkân sihirli eşya satar; tanımlama adımı yok (eşyalar bilinir); `k44.test.tsx` | bilinçli sapma olarak yazılabilir |
| Donanım s. 102 | Attunement (en çok 3, kısa dinlenme) | var-test edilmiş | `MAX_ATTUNED` `src/rules/stats.ts`; fazlası savaşa girmez; `k4.test.tsx`, `sd3.test.tsx` |  |
| Donanım s. 103 | Wearing and Wielding Items (boyuta uyma, çoklu yüzük/pelerin) | var-testsiz | eşya yuvaları oluşturucuda (`src/screens/builder/Equipment.tsx`) | doğrulanmadı: aynı türden iki eşya kısıtı |
| Donanım s. 103 | Crafting Nonmagical Items (alet, ham madde, süre) | savaş dışı | oyunda karşılığı yok |  |
| Donanım s. 103 | Brewing Potions of Healing (Herbalism Kit, 25 GP, 1 gün) | savaş dışı | oyunda karşılığı yok |  |
| Donanım s. 103 | Scribing Spell Scrolls (süre ve maliyet tablosu) | savaş dışı | oyunda karşılığı yok; Spell Scroll eşyası var ama içindeki büyü Game Master'da (ESYA-SINIFLANDIRMA) |  |

## 7. Büyüler (Spells) (s. 104–175)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Büyüler s. 104 | Gaining Spells: Preparing Spells (hazırlanan sayısı tablodan) | var-test edilmiş | `src/rules/builder.ts` `spellCounts`, `SpellLimits.prepared`; `b94bard.test.ts`, `b94ranger.test.ts` +5 |  |
| Büyüler s. 104 | Always-Prepared Spells (sayıya girmez) | var-test edilmiş | `alwaysPrepared` (Paladin, Cleric, Ranger…; B94); `b94ranger.test.ts`, `druid.test.ts` +2 |  |
| Büyüler s. 104 | Spell Level ve Spell Slots (slot tablosu, slot harcama) | var-test edilmiş | `data/spell-slots.json`, `spendSlot`; `diceUnlock.test.ts`, `a1.test.ts` +60 |  |
| Büyüler s. 104 | Casting at higher levels (yukarı slot) | kısmi | `mechanics.upcast` (`applied`), `docs/UPCAST.md`: 61 büyünün 57'si uygulanıyor, 2 savaşta etkisiz, 2 karar/ayrı iş; `b1.test.ts`, `b2.test.ts` +5 | UPCAST.md "karar/ayrı iş" satırları |
| Büyüler s. 104 | Cantrips ve cantrip güçlenmesi (5/11/17) | var-test edilmiş | cantrip zarı karakter seviyesiyle; `b93cleric.test.ts`, `b93warlock.test.ts` +23 |  |
| Büyüler s. 105 | School of Magic (8 okul; Illusion ↔ Truesight) | var-testsiz | büyü verisinde `school`; K63 illusion otomatik save |  |
| Büyüler s. 105 | Class Spell Lists | var-test edilmiş | `data/sinif-buyuleri.json`, SRD `classes` alanı; `k6.test.tsx` |  |
| Büyüler s. 105 | Casting Time: Action, Bonus Action, Reaction; turda tek slotlu büyü; uzun döküm süresi | kısmi | GENEL-SAVAS-DENETIM A20, A21, A42; `economy.test.ts` | A21 bilinçli sapma: Magic: 1 dakika+ döküm süresi her tur Magic + Konsantrasyon; 1 dakika+ döküm süresi bilinçli sapma (kurulumda/ritüelde) |
| Büyüler s. 105 | Range (Self, Touch, ft; menzil dışı yok) | var-test edilmiş | `pickArea`, `checkReach`; `a8spells.test.ts`, `k59ai.test.ts` +32 |  |
| Büyüler s. 105 | Components: Verbal (Silence, sessizlikte V yok) | var-test edilmiş | `castBarrier.ts`, `noVerbal`; `a6spells.test.ts`, `b2.test.ts` +1 |  |
| Büyüler s. 105 | Components: Somatic (boş el) ve Material (odak, fiyatlı/tüketilen malzeme) | kısmi | `src/rules/spellComponents.ts`: "Motorda yalnız V kısıtı çalışır; S ve M yalnız bilgidir"; `spellComponents.test.ts` | S için boş el (el modeli `heldItems.ts`), M için fiyatlı malzeme/odak kontrolü |
| Büyüler s. 106 | Duration ve Concentration (hasar DC, Incapacitated, tek konsantrasyon) | var-test edilmiş | `src/battle/effects.ts`, SRD-DENETIM "Concentration tam"; `a1.test.ts`, `a2leftovers.test.ts` +57 |  |
| Büyüler s. 106 | Effects: Targets (görülen hedef, açık yol, kendini hedefleme) | var-testsiz | D2 görülmeyen hedef reddi `data/gorme-gerekir.json`, `seenTargets.ts`; siper |  |
| Büyüler s. 106 | Effects: Areas of Effect (koni, küp, silindir, çizgi, küre, yayılım) | var-test edilmiş | `src/rules/area.ts`, `areaParse.ts`; `a7spells.test.ts`, `areaAttack.test.ts` +12 |  |
| Büyüler s. 106 | Effects: Saving Throws ve Attack Rolls (büyü DC, büyü saldırısı) | var-test edilmiş | büyü DC = 8 + yetenek + PB; `a1.test.ts`, `a2leftovers.test.ts` +75 |  |
| Büyüler s. 106 | Combining Magical Effects (aynı büyü birikmez, en güçlüsü) | var-testsiz | alanlarda en yüksek DC (`zones.ts`), auralarda en güçlüsü (`auraCore.ts`) | doğrulanmadı: aynı büyünün iki süren etkisi (ör. iki Bless) tek sayılıyor mu |
| Büyüler s. 107 | Acid Arrow (2. sv, Evocation) | var-test edilmiş | `spells.json`; `b1.test.ts`, `cila.test.ts` |  |
| Büyüler s. 107 | Acid Splash (cantrip, Evocation) | var-test edilmiş | `spells.json`; `levelChoices.test.ts` |  |
| Büyüler s. 107 | Aid (2. sv, Abjuration) | var-test edilmiş | `spells.json`; `cleric.test.ts`, `effects.test.ts` |  |
| Büyüler s. 107 | Alarm (1. sv, Abjuration) | savaş dışı | `spells.json` |  |
| Büyüler s. 107 | Alter Self (2. sv, Transmutation) | kısmi | `spells.json` (s1 (sürüm 40)); `b5.test.ts`, `s1spells.test.ts` | kapsam dışı: Change Appearance savaş dışı (Game Master). |
| Büyüler s. 107 | Animal Friendship (1. sv, Enchantment) | var-test edilmiş | `spells.json`; `b3.test.ts` |  |
| Büyüler s. 108 | Animal Messenger (2. sv, Enchantment) | savaş dışı | `spells.json` |  |
| Büyüler s. 108 | Animal Shapes (8. sv, Transmutation) | savaş dışı | `spells-69.json` (a7 (sürüm 36)); `g6.test.ts` |  |
| Büyüler s. 108 | Animate Dead (3. sv, Necromancy) | kısmi | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `b2.test.ts` +2 | kapsam dışı: Döküm süresi 1 dakika: yalnızca kurulumda; 24 saatlik kontrol yenileme savaş dışı. |
| Büyüler s. 108 | Animate Objects (5. sv, Transmutation) | var-test edilmiş | `spells-45.json`; `b1spells.test.ts`, `k19spells.test.ts` +2 |  |
| Büyüler s. 109 | Antilife Shell (5. sv, Abjuration) | var-test edilmiş | `spells-45.json`; `k18h2.test.ts`, `k19spells.test.ts` |  |
| Büyüler s. 109 | Antimagic Field (8. sv, Abjuration) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 109 | Antipathy/Sympathy (8. sv, Enchantment) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 110 | Arcane Eye (4. sv, Divination) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 110 | Arcane Hand (5. sv, Evocation) | var-test edilmiş | `spells-45.json`; `k18h2.test.ts`, `k19spells.test.ts` +1 |  |
| Büyüler s. 110 | Arcane Lock (2. sv, Abjuration) | savaş dışı | `spells.json` |  |
| Büyüler s. 110 | Arcane Sword (7. sv, Evocation) | var-test edilmiş | `spells-69.json`; `matris83.test.ts` |  |
| Büyüler s. 110 | Arcanist’s Magic Aura (2. sv, Illusion) | savaş dışı | `spells.json` |  |
| Büyüler s. 111 | Astral Projection (9. sv, Necromancy) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 111 | Augury (2. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 111 | Aura of Life (4. sv, Abjuration) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts` |  |
| Büyüler s. 111 | Awaken (5. sv, Transmutation) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 112 | Bane (1. sv, Enchantment) | var-test edilmiş | `spells.json`; `b5.test.ts`, `effects.test.ts` +3 |  |
| Büyüler s. 112 | Banishment (4. sv, Abjuration) | var-test edilmiş | `spells-45.json`; `k17g1.test.ts`, `k19spells.test.ts` |  |
| Büyüler s. 112 | Barkskin (2. sv, Transmutation) | var-test edilmiş | `spells.json`; `s1.test.ts` |  |
| Büyüler s. 112 | Beacon of Hope (3. sv, Abjuration) | var-test edilmiş | `spells.json` (g6 (sürüm 43)); `b1.test.ts`, `g6.test.ts` +1 |  |
| Büyüler s. 112 | Befuddlement (8. sv, Enchantment) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 112 | Bestow Curse (3. sv, Necromancy) | var-test edilmiş | `spells.json` (a6 (sürüm 35)); `a4spells.test.ts`, `a6spells.test.ts` +4 |  |
| Büyüler s. 113 | Black Tentacles (4. sv, Conjuration) | var-testsiz | `spells-45.json` |  |
| Büyüler s. 113 | Blade Barrier (6. sv, Evocation) | var-test edilmiş | `spells-69.json` (k61 (sürüm 44)); `k61.test.ts`, `matris83.test.ts` |  |
| Büyüler s. 113 | Bless (1. sv, Enchantment) | var-test edilmiş | `spells.json`; `evaluate.test.ts`, `k59ai.test.ts` +19 |  |
| Büyüler s. 113 | Blight (4. sv, Necromancy) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts`, `k40.test.ts` |  |
| Büyüler s. 113 | Blindness/Deafness (2. sv, Transmutation) | kısmi | `spells.json` (a6 (sürüm 35)); `cila.test.ts`, `durations.test.ts` +3 | kapsam dışı: Deafened'in duymaya bağlı yetenek kontrolleri savaşta yok; sözlü buyruklar (Command, Suggestion) duyulmaz. |
| Büyüler s. 113 | Blink (3. sv, Transmutation) | var-test edilmiş | `spells.json` (s1 (sürüm 40)); `a6spells.test.ts`, `wizard.test.ts` |  |
| Büyüler s. 114 | Blur (2. sv, Illusion) | var-test edilmiş | `spells.json` (a4 (sürüm 32)); `a4spells.test.ts`, `b1.test.ts` |  |
| Büyüler s. 114 | Burning Hands (1. sv, Evocation) | var-test edilmiş | `spells.json`; `a6spells.test.ts`, `area-spells.test.ts` +5 |  |
| Büyüler s. 114 | Call Lightning (3. sv, Conjuration) | kısmi | `spells.json` (k73c (sürüm 64)); `a6spells.test.ts`, `b1.test.ts` +4 | kapsam dışı: Açık gökte fırtınanın içindeyken (harita fırtınası ya da Storm of Vengeance) yeni bulut kurulmaz, fırtına devralınır: şimşek noktası fırtınanın altında, hasar +1d10, taban açık gökteki uçuş üst sınırı. Fırtınasızken bulut döküm yerinin üstünde sabit (taban açık gökte 30 ft, tavanlı yerde tavan − 10 ft). Havadaki nokta yaratık seçilince onun irtifasında, değilse merkez yüksekliğiyle (sürüm 64+). |
| Büyüler s. 114 | Calm Emotions (2. sv, Enchantment) | var-test edilmiş | `spells.json` (s1 (sürüm 40)); `a6spells.test.ts`, `b3.test.ts` +1 |  |
| Büyüler s. 114 | Chain Lightning (6. sv, Evocation) | var-test edilmiş | `spells-69.json`; `k19spells69.test.ts`, `matris83.test.ts` |  |
| Büyüler s. 114 | Charm Monster (4. sv, Enchantment) | var-testsiz | `spells-45.json` |  |
| Büyüler s. 115 | Charm Person (1. sv, Enchantment) | var-test edilmiş | `spells.json` (g6 (sürüm 43)); `b3.test.ts`, `g6.test.ts` +3 | Game Master notu: Savaşta hedef büyücünün tarafına geçer (Dominate ile aynı taraf değiştirme); büyücü ya da müttefikleri ona zarar verirse ya da süre bitince eski tarafına döner. Dostluk tutumu ve büyü bitince büyülendiğini bilmesi savaş dışı: Game Master anlatır. |
| Büyüler s. 115 | Chill Touch (cantrip, Necromancy) | var-test edilmiş | `spells.json`; `lineage.test.ts`, `sorcerer.test.ts` +2 |  |
| Büyüler s. 115 | Chromatic Orb (1. sv, Evocation) | var-test edilmiş | `spells.json` (s1 (sürüm 40)); `a6spells.test.ts`, `evaluate.test.ts` +4 |  |
| Büyüler s. 115 | Circle of Death (6. sv, Necromancy) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 115 | Clairvoyance (3. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 115 | Clone (8. sv, Necromancy) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 116 | Cloudkill (5. sv, Conjuration) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts`, `k40.test.ts` +1 |  |
| Büyüler s. 116 | Color Spray (1. sv, Illusion) | var-test edilmiş | `spells.json` (a4 (sürüm 32)); `a4spells.test.ts`, `b5.test.ts` |  |
| Büyüler s. 116 | Command (1. sv, Enchantment) | var-test edilmiş | `spells.json` (s2 (sürüm 41)); `a7spells.test.ts`, `b3.test.ts` +4 |  |
| Büyüler s. 116 | Commune (5. sv, Divination) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 116 | Commune with Nature (5. sv, Divination) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 117 | Comprehend Languages (1. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 117 | Compulsion (4. sv, Enchantment) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts`, `matris83.test.ts` |  |
| Büyüler s. 117 | Cone of Cold (5. sv, Evocation) | var-test edilmiş | `spells.json`; `areaAttack.test.ts`, `k19items.test.ts` +1 |  |
| Büyüler s. 117 | Confusion (4. sv, Enchantment) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts` |  |
| Büyüler s. 117 | Conjure Animals (3. sv, Conjuration) | kısmi | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `b2.test.ts` | kapsam dışı: Large sürü, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). |
| Büyüler s. 118 | Conjure Celestial (7. sv, Conjuration) | var-test edilmiş | `spells-69.json` (k73c (sürüm 64)); `k67b.test.ts`, `matris83.test.ts` |  |
| Büyüler s. 118 | Conjure Elemental (5. sv, Conjuration) | var-test edilmiş | `spells-45.json`; `k18h2.test.ts`, `k19spells.test.ts` +1 |  |
| Büyüler s. 118 | Conjure Fey (6. sv, Conjuration) | kısmi | `spells-69.json` (k61 (sürüm 44)); `a6spells.test.ts`, `k61.test.ts` | kapsam dışı: Ruhun Fey görünüşü yalnızca görsel. |
| Büyüler s. 118 | Conjure Minor Elementals (4. sv, Conjuration) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts` |  |
| Büyüler s. 118 | Conjure Woodland Beings (4. sv, Conjuration) | var-testsiz | `spells-45.json` |  |
| Büyüler s. 119 | Contact Other Plane (5. sv, Divination) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 119 | Contagion (5. sv, Necromancy) | var-test edilmiş | `spells-45.json`; `b1spells.test.ts`, `k19spells.test.ts` +1 |  |
| Büyüler s. 119 | Contingency (6. sv, Abjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 119 | Continual Flame (2. sv, Evocation) | kısmi | `spells.json` (k67 (sürüm 51)); `a7spells.test.ts`, `k67a.test.ts` | kapsam dışı: Nesne yerine yaratık da taşır (SRD: nesne); süre savaş boyunca. |
| Büyüler s. 119 | Control Water (4. sv, Transmutation) | savaş dışı | `spells-45.json`; `girdap.test.ts`, `girdapSecenek.test.ts` +1; savaş dışı (Game Master anahtarı `spellsK19` açıkken savaşta) |  |
| Büyüler s. 120 | Control Weather (8. sv, Transmutation) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 120 | Counterspell (3. sv, Abjuration) | var-test edilmiş | `spells.json`; `b2.test.ts`, `b93wizard.test.ts` +5 |  |
| Büyüler s. 120 | Create Food and Water (3. sv, Conjuration) | savaş dışı | `spells.json` |  |
| Büyüler s. 121 | Create or Destroy Water (1. sv, Transmutation) | savaş dışı | `spells.json` |  |
| Büyüler s. 121 | Create Undead (6. sv, Necromancy) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 121 | Creation (5. sv, Illusion) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 121 | Cure Wounds (1. sv, Abjuration) | var-test edilmiş | `spells.json`; `b93cleric.test.ts`, `b94druid.test.ts` +19 |  |
| Büyüler s. 121 | Dancing Lights (cantrip, Illusion) | var-test edilmiş | `spells.json` (k67 (sürüm 51)); `a7spells.test.ts`, `b4.test.ts` +4 |  |
| Büyüler s. 122 | Darkness (2. sv, Evocation) | kısmi | `spells.json` (a7 (sürüm 36)); `a7spells.test.ts`, `b4.test.ts` +4 | kapsam dışı: Taşınmayan nesneye yapılan karanlık nesnenin altıgeninde durur (noktaya yapmakla aynı); nesnenin üstünü örtmek savaş dışı. |
| Büyüler s. 122 | Darkvision (2. sv, Transmutation) | var-test edilmiş | `spells.json`; `b5.test.ts`, `k67b.test.ts` |  |
| Büyüler s. 122 | Daylight (3. sv, Evocation) | kısmi | `spells.json` (k67 (sürüm 51)); `a7spells.test.ts`, `b4.test.ts` +1 | kapsam dışı: Taşınmayan nesneye yapılan ışık nesnenin altıgeninde durur (nesneyle yürümez); Sunlight Sensitivity yalnız parlak alanda. |
| Büyüler s. 122 | Death Ward (4. sv, Abjuration) | var-test edilmiş | `spells-45.json`; `b1spells.test.ts`, `k19drain.test.ts` +2 |  |
| Büyüler s. 122 | Delayed Blast Fireball (7. sv, Evocation) | var-test edilmiş | `spells-69.json` (k62 (sürüm 46)); `k62.test.ts`, `k62acik.test.ts` |  |
| Büyüler s. 122 | Demiplane (8. sv, Conjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 123 | Detect Evil and Good (1. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 123 | Detect Magic (1. sv, Divination) | savaş dışı | `spells.json`; `b4.test.ts`, `b93wizard.test.ts` +2 |  |
| Büyüler s. 123 | Detect Poison and Disease (1. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 123 | Detect Thoughts (2. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 123 | Dimension Door (4. sv, Conjuration) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts`, `k40.test.ts` |  |
| Büyüler s. 124 | Disguise Self (1. sv, Illusion) | savaş dışı | `spells.json` |  |
| Büyüler s. 124 | Disintegrate (6. sv, Transmutation) | var-test edilmiş | `spells-69.json` (y1 (sürüm 55)); `k19spells69.test.ts`, `k70.test.ts` +1 |  |
| Büyüler s. 124 | Dispel Evil and Good (5. sv, Abjuration) | var-test edilmiş | `spells-45.json` (k64 (sürüm 48)); `k19spells.test.ts`, `k64.test.ts` +1 |  |
| Büyüler s. 124 | Dispel Magic (3. sv, Abjuration) | kısmi | `spells.json` (a7 (sürüm 36)); `a7spells.test.ts`, `b5.test.ts` +4 | kapsam dışı: Sihirli eşyanın kendi büyüsü dağılmaz (SRD); nesnedeki süren büyü (Light, Continual Flame) altıgen hedefte kalkar. |
| Büyüler s. 124 | Dissonant Whispers (1. sv, Enchantment) | var-testsiz | `spells.json` |  |
| Büyüler s. 125 | Divination (4. sv, Divination) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 125 | Divine Favor (1. sv, Transmutation) | var-test edilmiş | `spells.json`; `paladin.test.ts` |  |
| Büyüler s. 125 | Divine Smite (1. sv, Evocation) | var-test edilmiş | `spells.json`; `paladin.test.ts` |  |
| Büyüler s. 125 | Divine Word (7. sv, Evocation) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 125 | Dominate Beast (4. sv, Enchantment) | var-test edilmiş | `spells-45.json`; `k18h1.test.ts` |  |
| Büyüler s. 125 | Dominate Monster (8. sv, Enchantment) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 126 | Dominate Person (5. sv, Enchantment) | var-test edilmiş | `spells-45.json`; `k18h1.test.ts`, `k19spells.test.ts` |  |
| Büyüler s. 126 | Dragon’s Breath (2. sv, Transmutation) | var-testsiz | `spells.json` (a7 (sürüm 36)) |  |
| Büyüler s. 126 | Dream (5. sv, Illusion) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 126 | Druidcraft (cantrip, Transmutation) | savaş dışı | `spells.json`; `b5.test.ts`, `lineage.test.ts` +1 |  |
| Büyüler s. 127 | Earthquake (8. sv, Transmutation) | var-test edilmiş | `spells-69.json` (k66 (sürüm 50)); `k61.test.ts`, `k66a.test.ts` +4 |  |
| Büyüler s. 127 | Eldritch Blast (cantrip, Evocation) | var-test edilmiş | `spells.json`; `b93warlock.test.ts`, `effects.test.ts` +7 |  |
| Büyüler s. 127 | Elementalism (cantrip, Transmutation) | savaş dışı | `spells.json`; `levelChoices.test.ts` |  |
| Büyüler s. 127 | Enhance Ability (2. sv, Transmutation) | savaş dışı | `spells.json` (a7 (sürüm 36)); `b5.test.ts`, `g6.test.ts` +1 |  |
| Büyüler s. 127 | Enlarge/Reduce (2. sv, Transmutation) | kısmi | `spells.json` (s2 (sürüm 41)); `a7spells.test.ts`, `b1.test.ts` +1 | kapsam dışı: Boyut, çok altıgen bayrağı kapalıyken tek altıgen (oyunun genel kuralı). |
| Büyüler s. 128 | Ensnaring Strike (1. sv, Conjuration) | var-test edilmiş | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `b1.test.ts` +1 |  |
| Büyüler s. 128 | Entangle (1. sv, Conjuration) | kısmi | `spells.json` (a8 (sürüm 37)); `a8spells.test.ts`, `altSoy.test.ts` +4 | kapsam dışı: Bitkilerin büyü bitince çekilmesi görseldir; karede zemin zorlu arazi. |
| Büyüler s. 128 | Enthrall (2. sv, Enchantment) | savaş dışı | `spells.json` |  |
| Büyüler s. 128 | Etherealness (7. sv, Conjuration) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 129 | Expeditious Retreat (1. sv, Transmutation) | var-test edilmiş | `spells.json` (a4 (sürüm 32)); `a4spells.test.ts`, `b5.test.ts` |  |
| Büyüler s. 129 | Eyebite (6. sv, Necromancy) | var-test edilmiş | `spells-69.json`; `a1.test.ts`, `a2leftovers.test.ts` |  |
| Büyüler s. 129 | Fabricate (4. sv, Transmutation) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 129 | Faerie Fire (1. sv, Evocation) | var-test edilmiş | `spells.json` (k67 (sürüm 51)); `a7spells.test.ts`, `b4.test.ts` +4 |  |
| Büyüler s. 129 | Faithful Hound (4. sv, Conjuration) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts` |  |
| Büyüler s. 129 | False Life (1. sv, Necromancy) | var-test edilmiş | `spells.json`; `lineage.test.ts`, `s1.test.ts` +1 |  |
| Büyüler s. 130 | Fear (3. sv, Illusion) | var-test edilmiş | `spells.json` (g6 (sürüm 43)); `a4spells.test.ts`, `altSoy.test.ts` +3 |  |
| Büyüler s. 130 | Feather Fall (1. sv, Transmutation) | var-test edilmiş | `spells.json`; `k66a.test.ts`, `matris83.test.ts` +1 |  |
| Büyüler s. 130 | Find Familiar (1. sv, Conjuration) | var-test edilmiş | `spells.json`; `b1zirh.test.ts`, `b93wizard.test.ts` +9 |  |
| Büyüler s. 130 | Find Steed (2. sv, Conjuration) | var-test edilmiş | `spells.json`; `binekMb3.test.ts`, `binekMb4.test.ts` +8 |  |
| Büyüler s. 131 | Find the Path (6. sv, Divination) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 131 | Find Traps (2. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 131 | Finger of Death (7. sv, Necromancy) | var-test edilmiş | `spells-69.json`; `srdD2.test.ts` |  |
| Büyüler s. 131 | Fireball (3. sv, Evocation) | var-test edilmiş | `spells.json`; `evaluate.test.ts`, `k59ai.test.ts` +30 |  |
| Büyüler s. 132 | Fire Bolt (cantrip, Evocation) | var-test edilmiş | `spells.json`; `a6spells.test.ts`, `a8spells.test.ts` +49 |  |
| Büyüler s. 132 | Fire Shield (4. sv, Evocation) | var-test edilmiş | `spells-45.json` (k67 (sürüm 51)); `k19spells.test.ts`, `k67b.test.ts` |  |
| Büyüler s. 132 | Fire Storm (7. sv, Evocation) | var-test edilmiş | `spells-69.json` (k65 (sürüm 49)); `k65.test.ts` |  |
| Büyüler s. 132 | Flame Blade (2. sv, Evocation) | var-test edilmiş | `spells.json` (k67 (sürüm 51)); `a7spells.test.ts`, `b4.test.ts` +2 |  |
| Büyüler s. 132 | Flame Strike (5. sv, Evocation) | var-test edilmiş | `spells-45.json` (k73c (sürüm 64)); `k19spells.test.ts`, `k41b.test.ts` +3 |  |
| Büyüler s. 132 | Flaming Sphere (2. sv, Conjuration) | kısmi | `spells.json` (k67 (sürüm 51)); `a8spells.test.ts`, `b1zirh.test.ts` +3 | kapsam dışı: Taşıma bonus eylemle (yuvarlama) ve çarpma hasarı Kuyruk 19 yoluyla; ışık 20 ft (4 altıgen). |
| Büyüler s. 133 | Flesh to Stone (6. sv, Transmutation) | var-test edilmiş | `spells-69.json` (k70 (sürüm 54)); `k61.test.ts`, `k70.test.ts` |  |
| Büyüler s. 133 | Floating Disk (1. sv, Conjuration) | savaş dışı | `spells.json` |  |
| Büyüler s. 133 | Fly (3. sv, Transmutation) | var-test edilmiş | `spells.json` (s2 (sürüm 41)); `a8spells.test.ts`, `k68b.test.ts` +5 |  |
| Büyüler s. 133 | Fog Cloud (1. sv, Conjuration) | kısmi | `spells.json` (k68 (sürüm 52)); `a8spells.test.ts`, `b2.test.ts` +10 | kapsam dışı: Kürenin merkezi zeminde (havada merkezli küre yok); rüzgârla dağılma Kuyruk 18b rüzgârıyla. |
| Büyüler s. 133 | Forbiddance (6. sv, Abjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 134 | Forcecage (7. sv, Evocation) | var-test edilmiş | `spells-69.json` (y1 (sürüm 55)); `binekMb3.test.ts`, `k62.test.ts` +3 |  |
| Büyüler s. 134 | Foresight (9. sv, Divination) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 134 | Freedom of Movement (4. sv, Abjuration) | var-test edilmiş | `spells-45.json`; `k19feat2.test.ts`, `k19spells.test.ts` +1 |  |
| Büyüler s. 134 | Freezing Sphere (6. sv, Evocation) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 134 | Gaseous Form (3. sv, Transmutation) | var-test edilmiş | `spells.json` (s2 (sürüm 41)); `a8spells.test.ts`, `b1.test.ts` +1 |  |
| Büyüler s. 135 | Gate (9. sv, Conjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 135 | Geas (5. sv, Enchantment) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 135 | Gentle Repose (2. sv, Necromancy) | savaş dışı | `spells.json` |  |
| Büyüler s. 135 | Giant Insect (4. sv, Conjuration) | var-test edilmiş | `spells-45.json`; `b1spells.test.ts`, `k19spells.test.ts` +1 |  |
| Büyüler s. 136 | Glibness (8. sv, Enchantment) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 136 | Globe of Invulnerability (6. sv, Abjuration) | var-test edilmiş | `spells-69.json`; `k19spells69.test.ts` |  |
| Büyüler s. 136 | Glyph of Warding (3. sv, Abjuration) | savaş dışı | `spells.json` |  |
| Büyüler s. 137 | Goodberry (1. sv, Conjuration) | savaş dışı | `spells.json`; `b5.test.ts` |  |
| Büyüler s. 137 | Grease (1. sv, Conjuration) | var-test edilmiş | `spells.json`; `b2.test.ts`, `ignite.test.ts` +3 |  |
| Büyüler s. 137 | Greater Invisibility (4. sv, Illusion) | var-test edilmiş | `spells-45.json`; `k40.test.ts` |  |
| Büyüler s. 137 | Greater Restoration (5. sv, Abjuration) | var-test edilmiş | `spells-45.json`; `k19drain.test.ts` |  |
| Büyüler s. 137 | Guardian of Faith (4. sv, Conjuration) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts` |  |
| Büyüler s. 137 | Guards and Wards (6. sv, Abjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 138 | Guidance (cantrip, Divination) | var-test edilmiş | `spells.json`; `b93warlock.test.ts`, `effects.test.ts` +5 |  |
| Büyüler s. 138 | Guiding Bolt (1. sv, Evocation) | var-test edilmiş | `spells.json`; `f1.test.ts`, `freeHex.test.ts` +4 |  |
| Büyüler s. 138 | Gust of Wind (2. sv, Evocation) | var-test edilmiş | `spells.json` (s1 (sürüm 40)); `a6spells.test.ts`, `b1.test.ts` +2 |  |
| Büyüler s. 138 | Hallow (5. sv, Abjuration) | savaş dışı | `spells-45.json` (k64 (sürüm 48)); `k62acik.test.ts`, `k64b.test.ts` +1 |  |
| Büyüler s. 139 | Hallucinatory Terrain (4. sv, Illusion) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 139 | Harm (6. sv, Necromancy) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 139 | Haste (3. sv, Transmutation) | var-test edilmiş | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `b1.test.ts` +5 |  |
| Büyüler s. 139 | Heal (6. sv, Abjuration) | var-test edilmiş | `spells-69.json`; `a1.test.ts`, `a5esya.test.ts` |  |
| Büyüler s. 139 | Healing Word (1. sv, Abjuration) | var-test edilmiş | `spells.json`; `b1.test.ts`, `b93cleric.test.ts` +6 |  |
| Büyüler s. 139 | Heat Metal (2. sv, Transmutation) | var-test edilmiş | `spells.json` (s2 (sürüm 41)); `a7spells.test.ts`, `b1.test.ts` +1 |  |
| Büyüler s. 140 | Hellish Rebuke (1. sv, Evocation) | var-test edilmiş | `spells.json`; `lineage.test.ts`, `matris83.test.ts` +2 |  |
| Büyüler s. 140 | Heroes’ Feast (6. sv, Conjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 140 | Heroism (1. sv, Enchantment) | var-test edilmiş | `spells.json`; `effects.test.ts` |  |
| Büyüler s. 140 | Hex (1. sv, Enchantment) | kısmi | `spells.json` (a4 (sürüm 32)); `a4spells.test.ts`, `a6spells.test.ts` +5 | kapsam dışı: Seçilen yetenek: savaşta kontrol yalnızca STR/DEX (İt, yakalama, kurtulma); seçim yoksa hedefin güçlü olanı |
| Büyüler s. 140 | Hideous Laughter (1. sv, Enchantment) | var-test edilmiş | `spells.json` (a7 (sürüm 36)); `b3.test.ts`, `durations.test.ts` +3 | Game Master notu: Savaşta Prone + Incapacitated, tur sonu ve hasarda yeniden save uygulanır; kahkahanın anlatımı Game Master'da. |
| Büyüler s. 140 | Hold Monster (5. sv, Enchantment) | var-testsiz | `spells-45.json` |  |
| Büyüler s. 141 | Hold Person (2. sv, Enchantment) | var-test edilmiş | `spells.json`; `b93cleric.test.ts`, `b93sorcerer.test.ts` +13 |  |
| Büyüler s. 141 | Holy Aura (8. sv, Abjuration) | var-test edilmiş | `spells-69.json` (a4 (sürüm 32)); `a4spells.test.ts`, `matris83.test.ts` |  |
| Büyüler s. 141 | Hunter’s Mark (1. sv, Divination) | var-testsiz | `spells.json` |  |
| Büyüler s. 141 | Hypnotic Pattern (3. sv, Illusion) | var-test edilmiş | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `b2.test.ts` +1 |  |
| Büyüler s. 141 | Ice Knife (1. sv, Conjuration) | var-test edilmiş | `spells.json`; `b5.test.ts`, `k9b.test.ts` |  |
| Büyüler s. 141 | Ice Storm (4. sv, Evocation) | var-test edilmiş | `spells-45.json` (k73c (sürüm 64)); `k19spells.test.ts` |  |
| Büyüler s. 142 | Identify (1. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 142 | Illusory Script (1. sv, Illusion) | savaş dışı | `spells.json` |  |
| Büyüler s. 142 | Imprisonment (9. sv, Abjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 142 | Incendiary Cloud (8. sv, Conjuration) | var-test edilmiş | `spells-69.json`; `matris83.test.ts` |  |
| Büyüler s. 143 | Inflict Wounds (1. sv, Necromancy) | var-testsiz | `spells.json` |  |
| Büyüler s. 143 | Insect Plague (5. sv, Conjuration) | var-testsiz | `spells-45.json` |  |
| Büyüler s. 143 | Instant Summons (6. sv, Conjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 143 | Irresistible Dance (6. sv, Enchantment) | var-test edilmiş | `spells-69.json` (k61 (sürüm 44)); `k61.test.ts`, `matris83.test.ts` |  |
| Büyüler s. 143 | Invisibility (2. sv, Illusion) | var-test edilmiş | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `k19items.test.ts` +2 |  |
| Büyüler s. 143 | Jump (1. sv, Transmutation) | kısmi | `spells.json` (k68 (sürüm 52)); `a8spells.test.ts`, `b5.test.ts` +3 | kapsam dışı: Zıplamanın havadaki yayı; katmansız haritada dikey zıplama yalnız yüksek erişim (yerinde zıplama: bu tur yakın dövüşte dikeyde +30 ft erişim, tavanla sınırlı; havada kalınmaz). |
| Büyüler s. 143 | Knock (2. sv, Transmutation) | savaş dışı | `spells.json` |  |
| Büyüler s. 144 | Legend Lore (5. sv, Divination) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 144 | Lesser Restoration (2. sv, Abjuration) | var-test edilmiş | `spells.json`; `cleric.test.ts`, `s1.test.ts` |  |
| Büyüler s. 144 | Levitate (2. sv, Transmutation) | var-test edilmiş | `spells.json` (s2 (sürüm 41)); `a8spells.test.ts`, `b1.test.ts` +3 |  |
| Büyüler s. 144 | Light (cantrip, Evocation) | kısmi | `spells.json` (k67 (sürüm 51)); `a7spells.test.ts`, `b4.test.ts` +6 | kapsam dışı: 1 saatlik süre savaştan uzun; nesne yerine yaratık da taşır (SRD: nesne). |
| Büyüler s. 144 | Lightning Bolt (3. sv, Evocation) | var-test edilmiş | `spells.json`; `area-spells.test.ts`, `b93wizard.test.ts` +2 |  |
| Büyüler s. 144 | Locate Animals or Plants (2. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 145 | Locate Creature (4. sv, Divination) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 145 | Locate Object (2. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 145 | Longstrider (1. sv, Transmutation) | var-test edilmiş | `spells.json`; `s1.test.ts` |  |
| Büyüler s. 145 | Mage Armor (1. sv, Abjuration) | kısmi | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `p9.test.ts` +3 | kapsam dışı: Zırh giyince bitme: savaşta zırh giyilmez. |
| Büyüler s. 145 | Mage Hand (cantrip, Conjuration) | savaş dışı | `spells.json`; `b93wizard.test.ts`, `levelChoices.test.ts` |  |
| Büyüler s. 145 | Magic Circle (3. sv, Abjuration) | savaş dışı | `spells.json` (k64 (sürüm 48)); `k62acik.test.ts`, `k64b.test.ts` |  |
| Büyüler s. 146 | Magic Jar (6. sv, Necromancy) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 146 | Magic Missile (1. sv, Evocation) | var-test edilmiş | `spells.json`; `b93.test.ts`, `b93sorcerer.test.ts` +13 |  |
| Büyüler s. 146 | Magic Mouth (2. sv, Illusion) | savaş dışı | `spells.json` |  |
| Büyüler s. 146 | Magic Weapon (2. sv, Transmutation) | var-test edilmiş | `spells.json` (s1 (sürüm 40)); `a7spells.test.ts`, `k9b.test.ts` +3 |  |
| Büyüler s. 147 | Magnificent Mansion (7. sv, Conjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 147 | Major Image (3. sv, Illusion) | savaş dışı | `spells.json` |  |
| Büyüler s. 147 | Mass Cure Wounds (5. sv, Abjuration) | var-test edilmiş | `spells-45.json`; `k40.test.ts` |  |
| Büyüler s. 147 | Mass Heal (9. sv, Abjuration) | var-test edilmiş | `spells-69.json`; `b93cleric.test.ts`, `k19spells69.test.ts` |  |
| Büyüler s. 148 | Mass Healing Word (3. sv, Abjuration) | var-test edilmiş | `spells.json`; `b1.test.ts`, `b93cleric.test.ts` +1 |  |
| Büyüler s. 148 | Mass Suggestion (6. sv, Enchantment) | var-test edilmiş | `spells-69.json` (s1 (sürüm 40)); `a6spells.test.ts`, `s1spells.test.ts` |  |
| Büyüler s. 148 | Maze (8. sv, Conjuration) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 148 | Meld into Stone (3. sv, Transmutation) | savaş dışı | `spells.json` |  |
| Büyüler s. 148 | Mending (cantrip, Transmutation) | savaş dışı | `spells.json`; `lineage.test.ts`, `levelChoices.test.ts` |  |
| Büyüler s. 148 | Message (cantrip, Transmutation) | savaş dışı | `spells.json`; `levelChoices.test.ts` |  |
| Büyüler s. 149 | Meteor Swarm (9. sv, Evocation) | var-test edilmiş | `spells-69.json` (s1 (sürüm 40)); `a8spells.test.ts`, `s1spells.test.ts` |  |
| Büyüler s. 149 | Mind Blank (8. sv, Abjuration) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 149 | Mind Spike (2. sv, Divination) | var-test edilmiş | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `b2.test.ts` +1 |  |
| Büyüler s. 149 | Minor Illusion (cantrip, Illusion) | savaş dışı | `spells.json`; `b93warlock.test.ts`, `lineage.test.ts` +1 |  |
| Büyüler s. 149 | Mirage Arcane (7. sv, Illusion) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 150 | Mirror Image (2. sv, Illusion) | var-test edilmiş | `spells.json` (a4 (sürüm 32)); `a4spells.test.ts`, `b3.test.ts` |  |
| Büyüler s. 150 | Mislead (5. sv, Illusion) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts`, `k41b.test.ts` |  |
| Büyüler s. 150 | Misty Step (2. sv, Conjuration) | var-test edilmiş | `spells.json`; `b93wizard.test.ts`, `b94druid.test.ts` +9 |  |
| Büyüler s. 150 | Modify Memory (5. sv, Enchantment) | savaş dışı | `spells-45.json`; `k19terraform.test.ts`; savaş dışı (Game Master anahtarı `spellsK19` açıkken savaşta) |  |
| Büyüler s. 150 | Moonbeam (2. sv, Evocation) | var-test edilmiş | `spells.json` (k67 (sürüm 51)); `a8spells.test.ts`, `b2.test.ts` +3 |  |
| Büyüler s. 151 | Move Earth (6. sv, Transmutation) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 151 | Nondetection (3. sv, Abjuration) | savaş dışı | `spells.json` |  |
| Büyüler s. 151 | Passwall (5. sv, Transmutation) | savaş dışı | `spells-45.json`; `k19terraform.test.ts`; savaş dışı (Game Master anahtarı `spellsK19` açıkken savaşta) |  |
| Büyüler s. 151 | Pass without Trace (2. sv, Abjuration) | var-test edilmiş | `spells.json`; `b5.test.ts` |  |
| Büyüler s. 151 | Phantasmal Force (2. sv, Illusion) | var-test edilmiş | `spells.json` (k63 (sürüm 47)); `a6spells.test.ts`, `b3.test.ts` +2 |  |
| Büyüler s. 152 | Phantasmal Killer (4. sv, Illusion) | var-test edilmiş | `spells-45.json` (k63 (sürüm 47)); `k19spells.test.ts` |  |
| Büyüler s. 152 | Phantom Steed (3. sv, Illusion) | savaş dışı | `spells.json`; `binekMb2.test.ts`, `binekMb7.test.ts` +1 |  |
| Büyüler s. 152 | Planar Ally (6. sv, Conjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 152 | Planar Binding (5. sv, Abjuration) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 153 | Plane Shift (7. sv, Conjuration) | var-test edilmiş | `spells-69.json` (s1 (sürüm 40)); `a6spells.test.ts`, `s1spells.test.ts` |  |
| Büyüler s. 153 | Plant Growth (3. sv, Transmutation) | kısmi | `spells.json` (s2 (sürüm 41)); `a8spells.test.ts`, `b2.test.ts` +1 | kapsam dışı: Enrichment (8 saatlik döküm, bir yıl verim) savaş dışı. |
| Büyüler s. 153 | Poison Spray (cantrip, Necromancy) | var-test edilmiş | `spells.json`; `lineage.test.ts`, `k17.test.ts` +1 |  |
| Büyüler s. 153 | Polymorph (4. sv, Transmutation) | var-test edilmiş | `spells-45.json`; `a8spells.test.ts`, `k18h2.test.ts` +2 |  |
| Büyüler s. 154 | Power Word Heal (9. sv, Enchantment) | var-test edilmiş | `spells-69.json`; `b93cleric.test.ts` |  |
| Büyüler s. 154 | Power Word Kill (9. sv, Enchantment) | var-test edilmiş | `spells-69.json`; `b1spells.test.ts`, `b94bard.test.ts` +2 |  |
| Büyüler s. 154 | Power Word Stun (8. sv, Enchantment) | var-test edilmiş | `spells-69.json`; `k19spells69.test.ts` |  |
| Büyüler s. 154 | Prayer of Healing (2. sv, Abjuration) | savaş dışı | `spells.json` |  |
| Büyüler s. 154 | Prestidigitation (cantrip, Transmutation) | savaş dışı | `spells.json`; `lineage.test.ts`, `levelChoices.test.ts` |  |
| Büyüler s. 154 | Prismatic Spray (7. sv, Evocation) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 155 | Prismatic Wall (9. sv, Abjuration) | var-test edilmiş | `spells-69.json`; `k71b.test.ts` |  |
| Büyüler s. 156 | Private Sanctum (4. sv, Abjuration) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 156 | Produce Flame (cantrip, Conjuration) | var-test edilmiş | `spells.json` (k67 (sürüm 51)); `a6spells.test.ts`, `druid.test.ts` +4 |  |
| Büyüler s. 156 | Programmed Illusion (6. sv, Illusion) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 156 | Project Image (7. sv, Illusion) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 157 | Protection from Energy (3. sv, Abjuration) | var-test edilmiş | `spells.json`; `b1.test.ts`, `matris83.test.ts` |  |
| Büyüler s. 157 | Protection from Evil and Good (1. sv, Abjuration) | var-test edilmiş | `spells.json` (k64 (sürüm 48)); `b3.test.ts`, `k64.test.ts` +1 |  |
| Büyüler s. 157 | Protection from Poison (2. sv, Abjuration) | var-test edilmiş | `spells.json` (a4 (sürüm 32)); `a4spells.test.ts`, `b5.test.ts` |  |
| Büyüler s. 157 | Purify Food and Drink (1. sv, Transmutation) | savaş dışı | `spells.json` |  |
| Büyüler s. 157 | Raise Dead (5. sv, Necromancy) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 157 | Ray of Enfeeblement (2. sv, Necromancy) | var-test edilmiş | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `b1.test.ts` +1 |  |
| Büyüler s. 157 | Ray of Frost (cantrip, Evocation) | var-test edilmiş | `spells.json`; `b94bard.test.ts`, `freeHex.test.ts` +7 |  |
| Büyüler s. 158 | Regenerate (7. sv, Transmutation) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 158 | Ray of Sickness (1. sv, Necromancy) | var-test edilmiş | `spells.json`; `lineage.test.ts` |  |
| Büyüler s. 158 | Reincarnate (5. sv, Necromancy) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 158 | Remove Curse (3. sv, Abjuration) | kısmi | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `b5.test.ts` | kapsam dışı: Lanetli sihirli eşyada bağlılığı koparma savaş dışı. |
| Büyüler s. 158 | Resilient Sphere (4. sv, Abjuration) | var-test edilmiş | `spells-45.json`; `k17g1.test.ts`, `k18h2.test.ts` +2 |  |
| Büyüler s. 158 | Resistance (cantrip, Abjuration) | var-test edilmiş | `spells.json`; `effects.test.ts`, `paladin.test.ts` +1 |  |
| Büyüler s. 158 | Resurrection (7. sv, Necromancy) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 159 | Reverse Gravity (7. sv, Transmutation) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 159 | Revivify (3. sv, Necromancy) | var-test edilmiş | `spells.json`; `b1.test.ts`, `cleric.test.ts` +2 |  |
| Büyüler s. 159 | Rope Trick (2. sv, Transmutation) | savaş dışı | `spells.json` |  |
| Büyüler s. 159 | Sacred Flame (cantrip, Evocation) | var-test edilmiş | `spells.json`; `a6spells.test.ts`, `preview.test.ts` +20 |  |
| Büyüler s. 159 | Sanctuary (1. sv, Abjuration) | var-test edilmiş | `spells.json` (s1 (sürüm 40)); `a6spells.test.ts`, `b5.test.ts` +3 |  |
| Büyüler s. 159 | Scorching Ray (2. sv, Evocation) | var-test edilmiş | `spells.json`; `evaluate.test.ts`, `b93.test.ts` +2 |  |
| Büyüler s. 160 | Scrying (5. sv, Divination) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 160 | Searing Smite (1. sv, Evocation) | var-test edilmiş | `spells.json`; `b1.test.ts`, `b2.test.ts` +1 |  |
| Büyüler s. 160 | Secret Chest (4. sv, Conjuration) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 160 | See Invisibility (2. sv, Divination) | var-test edilmiş | `spells.json` (a7 (sürüm 36)); `a7spells.test.ts`, `b4.test.ts` +2 | Game Master notu: Görünmezi görme savaşta uygulanır; Ethereal düzlemi görmek savaş dışı (Ethereal yaratık zaten etkilenemez): Game Master. |
| Büyüler s. 160 | Seeming (5. sv, Illusion) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 161 | Sending (3. sv, Divination) | savaş dışı | `spells.json` |  |
| Büyüler s. 161 | Sequester (7. sv, Transmutation) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 161 | Shapechange (9. sv, Transmutation) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 161 | Shatter (2. sv, Evocation) | var-test edilmiş | `spells.json`; `cila.test.ts`, `k73c.test.ts` |  |
| Büyüler s. 161 | Shield (1. sv, Abjuration) | var-test edilmiş | `spells.json`; `a6spells.test.ts`, `b93wizard.test.ts` +13 |  |
| Büyüler s. 162 | Shield of Faith (1. sv, Abjuration) | var-test edilmiş | `spells.json`; `k41b.test.ts`, `k43b.test.ts` +1 |  |
| Büyüler s. 162 | Shillelagh (cantrip, Transmutation) | var-test edilmiş | `spells.json`; `b1.test.ts`, `levelChoices.test.ts` |  |
| Büyüler s. 162 | Shining Smite (2. sv, Transmutation) | var-test edilmiş | `spells.json` (k67 (sürüm 51)); `k67b.test.ts`, `matris83.test.ts` +2 |  |
| Büyüler s. 162 | Shocking Grasp (cantrip, Evocation) | var-test edilmiş | `spells.json`; `freeHex.test.ts`, `p11.test.ts` +3 |  |
| Büyüler s. 162 | Silence (2. sv, Illusion) | var-test edilmiş | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `b2.test.ts` +1 |  |
| Büyüler s. 162 | Silent Image (1. sv, Illusion) | savaş dışı | `spells.json` |  |
| Büyüler s. 162 | Simulacrum (7. sv, Illusion) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 163 | Sleep (1. sv, Enchantment) | var-test edilmiş | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `area-spells.test.ts` +5 |  |
| Büyüler s. 163 | Sleet Storm (3. sv, Conjuration) | var-test edilmiş | `spells.json` (k68 (sürüm 52)); `a8spells.test.ts`, `b2.test.ts` +3 |  |
| Büyüler s. 163 | Slow (3. sv, Transmutation) | var-test edilmiş | `spells.json` (a8 (sürüm 37)); `a8spells.test.ts`, `b1.test.ts` +2 |  |
| Büyüler s. 163 | Sorcerous Burst (cantrip, Evocation) | var-test edilmiş | `spells.json`; `b4.test.ts`, `sorcerer.test.ts` +1 |  |
| Büyüler s. 163 | Spare the Dying (cantrip, Necromancy) | var-test edilmiş | `spells.json`; `genel96.test.ts`, `s1.test.ts` +1 |  |
| Büyüler s. 164 | Speak with Animals (1. sv, Divination) | savaş dışı | `spells.json`; `lineage.test.ts` |  |
| Büyüler s. 164 | Speak with Dead (3. sv, Necromancy) | savaş dışı | `spells.json`; `b5.test.ts` |  |
| Büyüler s. 164 | Speak with Plants (3. sv, Transmutation) | savaş dışı | `spells.json` |  |
| Büyüler s. 164 | Spider Climb (2. sv, Transmutation) | kısmi | `spells.json` (k68 (sürüm 52)); `a8spells.test.ts`, `b5.test.ts` +1 | kapsam dışı: Eller serbest kuralı savaş dışı; açık alanda duvar boyu 20 ft (duvarın üstüne çıkılmaz); tavanda düşman altıgeninin üstünden geçilmez. |
| Büyüler s. 164 | Spike Growth (2. sv, Transmutation) | var-test edilmiş | `spells.json` (s2 (sürüm 41)); `b2.test.ts`, `s2spells.test.ts` |  |
| Büyüler s. 164 | Spirit Guardians (3. sv, Conjuration) | var-test edilmiş | `spells.json`; `area-spells.test.ts`, `features.test.ts` +2 |  |
| Büyüler s. 165 | Spiritual Weapon (2. sv, Evocation) | var-test edilmiş | `spells.json`; `features.test.ts`, `matris83.test.ts` |  |
| Büyüler s. 165 | Starry Wisp (cantrip, Evocation) | var-test edilmiş | `spells.json` (k67 (sürüm 51)); `b4.test.ts`, `k67b.test.ts` +1 |  |
| Büyüler s. 165 | Stinking Cloud (3. sv, Conjuration) | kısmi | `spells.json` (k68 (sürüm 52)); `a8spells.test.ts`, `b2.test.ts` +3 | kapsam dışı: Kürenin merkezi zeminde (havada merkezli küre yok); rüzgârla dağılma yüzey sistemiyle. |
| Büyüler s. 165 | Stone Shape (4. sv, Transmutation) | savaş dışı | `spells-45.json`; `k19terraform.test.ts`; savaş dışı (Game Master anahtarı `spellsK19` açıkken savaşta) |  |
| Büyüler s. 165 | Stoneskin (4. sv, Transmutation) | var-test edilmiş | `spells-45.json`; `k40.test.ts`, `ws92b.test.ts` |  |
| Büyüler s. 165 | Storm of Vengeance (9. sv, Conjuration) | var-test edilmiş | `spells-69.json`; `k73c.test.ts`, `matris83.test.ts` |  |
| Büyüler s. 166 | Suggestion (2. sv, Enchantment) | var-test edilmiş | `spells.json` (s1 (sürüm 40)); `a6spells.test.ts`, `b3.test.ts` +1 |  |
| Büyüler s. 166 | Summon Dragon (5. sv, Conjuration) | var-test edilmiş | `spells.json`; `binekMb7.test.ts`, `srdD2.test.ts` +3 |  |
| Büyüler s. 166 | Sunbeam (6. sv, Evocation) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 167 | Sunburst (8. sv, Evocation) | var-test edilmiş | `spells-69.json`; `k61.test.ts` |  |
| Büyüler s. 167 | Symbol (7. sv, Abjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 167 | Telekinesis (5. sv, Transmutation) | var-test edilmiş | `spells-45.json`; `k18h2.test.ts`, `k19spells.test.ts` |  |
| Büyüler s. 168 | Telepathic Bond (5. sv, Divination) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 168 | Teleport (7. sv, Conjuration) | savaş dışı | `spells-69.json`; `s1.test.ts` |  |
| Büyüler s. 168 | Teleportation Circle (5. sv, Conjuration) | savaş dışı | `spells-45.json` |  |
| Büyüler s. 169 | Thaumaturgy (cantrip, Transmutation) | savaş dışı | `spells.json`; `levelChoices.test.ts` |  |
| Büyüler s. 169 | Thunderwave (1. sv, Evocation) | var-test edilmiş | `spells.json`; `dragon.test.ts`, `forced.test.ts` +1 |  |
| Büyüler s. 169 | Time Stop (9. sv, Transmutation) | var-test edilmiş | `spells-69.json`; `diceUnlock.test.ts`, `k19spells69.test.ts` |  |
| Büyüler s. 169 | Tiny Hut (3. sv, Evocation) | savaş dışı | `spells.json` |  |
| Büyüler s. 169 | Tongues (3. sv, Divination) | savaş dışı | `spells.json`; `b5.test.ts` |  |
| Büyüler s. 170 | Transport via Plants (6. sv, Conjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 170 | Tree Stride (5. sv, Conjuration) | var-test edilmiş | `spells-45.json`; `b94druid.test.ts`, `k18h2.test.ts` +2 |  |
| Büyüler s. 170 | True Polymorph (9. sv, Transmutation) | var-testsiz | `spells-69.json` |  |
| Büyüler s. 170 | True Resurrection (9. sv, Necromancy) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 171 | True Seeing (6. sv, Divination) | var-test edilmiş | `spells-69.json` (k63 (sürüm 47)); `k63.test.ts` |  |
| Büyüler s. 171 | True Strike (cantrip, Divination) | var-test edilmiş | `spells.json`; `b1.test.ts`, `b2.test.ts` +2 |  |
| Büyüler s. 171 | Tsunami (8. sv, Conjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 171 | Unseen Servant (1. sv, Conjuration) | savaş dışı | `spells.json` |  |
| Büyüler s. 171 | Vampiric Touch (3. sv, Necromancy) | var-test edilmiş | `spells.json`; `b1.test.ts` |  |
| Büyüler s. 171 | Vicious Mockery (cantrip, Enchantment) | var-test edilmiş | `spells.json`; `g01SaveWhy.test.ts` |  |
| Büyüler s. 172 | Vitriolic Sphere (4. sv, Evocation) | var-test edilmiş | `spells-45.json`; `k19spells.test.ts` |  |
| Büyüler s. 172 | Wall of Fire (4. sv, Evocation) | var-test edilmiş | `spells-45.json` (k67 (sürüm 51)); `k19spells.test.ts`, `k67a.test.ts` +1 |  |
| Büyüler s. 172 | Wall of Force (5. sv, Evocation) | var-test edilmiş | `spells-45.json` (y1 (sürüm 55)); `k17g1.test.ts`, `k18h2.test.ts` +5 |  |
| Büyüler s. 172 | Wall of Ice (6. sv, Evocation) | var-test edilmiş | `spells-69.json` (k65 (sürüm 49)); `k62.test.ts`, `k62acik.test.ts` +3 |  |
| Büyüler s. 173 | Wall of Stone (5. sv, Evocation) | var-test edilmiş | `spells-45.json` (k65 (sürüm 49)); `k17g1.test.ts`, `k19spells.test.ts` +4 |  |
| Büyüler s. 173 | Wall of Thorns (6. sv, Conjuration) | var-test edilmiş | `spells-69.json`; `matris83.test.ts` |  |
| Büyüler s. 173 | Warding Bond (2. sv, Abjuration) | var-test edilmiş | `spells.json` (a6 (sürüm 35)); `a6spells.test.ts`, `b5.test.ts` +1 |  |
| Büyüler s. 173 | Water Breathing (3. sv, Transmutation) | savaş dışı | `spells.json` |  |
| Büyüler s. 173 | Water Walk (3. sv, Transmutation) | var-test edilmiş | `spells.json`; `k19f.test.ts` |  |
| Büyüler s. 174 | Web (2. sv, Conjuration) | kısmi | `spells.json` (s2 (sürüm 41)); `b2.test.ts`, `durations.test.ts` +5 | kapsam dışı: Tutunma yeri: savaş haritasında ağ zemine serili sayılır (SRD: yere serilen ağ çökmez); yanma K55 çözücüsünde (yanan ağ). |
| Büyüler s. 174 | Weird (9. sv, Illusion) | var-test edilmiş | `spells-69.json` (k63 (sürüm 47)); `matris83.test.ts` |  |
| Büyüler s. 174 | Wind Walk (6. sv, Transmutation) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 174 | Wind Wall (3. sv, Evocation) | var-test edilmiş | `spells.json` (s2 (sürüm 41)); `a8spells.test.ts`, `b2.test.ts` +3 |  |
| Büyüler s. 175 | Wish (9. sv, Conjuration) | var-test edilmiş | `spells-69.json` (a7 (sürüm 36)); `g6.test.ts`, `k19spells69.test.ts` | Game Master notu: 8. seviye ya da altı bir büyüyü kopyalama savaşta (seçim listesi); serbest dilekler Game Master'da. |
| Büyüler s. 175 | Word of Recall (6. sv, Conjuration) | savaş dışı | `spells-69.json` |  |
| Büyüler s. 175 | Zone of Truth (2. sv, Enchantment) | savaş dışı | `spells.json` |  |

## 8. Kural sözlüğü (Rules Glossary) (s. 176–191)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Kural sözlüğü s. 176 | Ability Check | var-test edilmiş | GENEL-SAVAS-DENETIM F1, F2, A16; `genel96.test.ts` |  |
| Kural sözlüğü s. 176 | Ability Score and Modifier | var-test edilmiş | `src/rules/stats.ts`; `altSoy.test.ts`, `bard.test.ts` +11 |  |
| Kural sözlüğü s. 176 | Action | var-test edilmiş | GENEL-SAVAS-DENETIM A1, A51; `economy.test.ts` |  |
| Kural sözlüğü s. 176 | Advantage | var-test edilmiş | GENEL-SAVAS-DENETIM C1, F4, F5; `combat.test.ts` | F5 doğrulanmadı: Avantajla yeniden atışta yalnız tek zar |
| Kural sözlüğü s. 176 | Adventure | savaş dışı | terim; Serüven ekranı `src/screens/SeruvenScreen.tsx` |  |
| Kural sözlüğü s. 176 | Alignment | savaş dışı | ev kuralı Alignment `src/rules/alignment.ts` (iki eksen; SRD dokuz etiketi değil) | bilinçli sapma |
| Kural sözlüğü s. 176 | Ally | var-test edilmiş | `side`/`allegiance` (`src/battle/allegiance.ts`); `g6.test.ts`, `k18h1.test.ts` +3 |  |
| Kural sözlüğü s. 177 | Area of Effect | var-test edilmiş | `src/rules/area.ts` (çıkış altıgeni dahil değil); `b2.test.ts`, `k69.test.ts` +3 |  |
| Kural sözlüğü s. 177 | Armor Class | var-test edilmiş | `effectiveAc`; `b1.test.ts`, `paladin.test.ts` +3 |  |
| Kural sözlüğü s. 177 | Armor Training | var-test edilmiş | eğitimsiz zırh: STR/DEX D20 dezavantajı, büyü yok (TE99 sürüm 99); `k9d.test.ts`, `objects.test.ts` +1 |  |
| Kural sözlüğü s. 177 | Attack [Action] | kısmi | GENEL-SAVAS-DENETIM A3, A4, A5 | A4 bilinçli sapma: Attack: saldırıda bir silahı takma/çıkarma |
| Kural sözlüğü s. 177 | Attack Roll | var-test edilmiş | GENEL-SAVAS-DENETIM C2, C3, F6, C6, C7; `area-spells.test.ts`, `combat.test.ts` +3 |  |
| Kural sözlüğü s. 177 | Attitude | savaş dışı | tutum (Friendly/Indifferent/Hostile) modeli yok | Influence ile birlikte |
| Kural sözlüğü s. 177 | Attunement | var-test edilmiş | `MAX_ATTUNED` (3); `k4.test.tsx`, `sd3.test.tsx` |  |
| Kural sözlüğü s. 177 | Blinded [Condition] | kısmi | GENEL-SAVAS-DENETIM B6, B7, B8 | B7 kısmi: Blinded: görme gerektiren kontrolde otomatik başarısız |
| Kural sözlüğü s. 177 | Blindsight | var-test edilmiş | GENEL-SAVAS-DENETIM H9; `k19vision.test.ts`, `k67b.test.ts` |  |
| Kural sözlüğü s. 177 | Bloodied | var-test edilmiş | GENEL-SAVAS-DENETIM D2; `a2abilities.test.ts`, `classTraits.test.ts` +1 |  |
| Kural sözlüğü s. 177 | Bonus Action | var-test edilmiş | GENEL-SAVAS-DENETIM A34, A35, A36; `economy.test.ts`, `extraBonus.test.ts` |  |
| Kural sözlüğü s. 177 | Breaking Objects | var-test edilmiş | nesne AC/HP `src/battle/objects.ts`, `attack_object`; panel canı `walls.ts`; `aiObjectives.test.ts`, `alarm.test.ts` +12 |  |
| Kural sözlüğü s. 178 | Bright Light | var-test edilmiş | GENEL-SAVAS-DENETIM H1; `k67a.test.ts` |  |
| Kural sözlüğü s. 178 | Burning [Hazard] | var-test edilmiş | Burning durumu: tur başı 1d4 Fire, söndürme eylemi (TE99 99+; `items.ts`, `maprules.ts`); `a6spells.test.ts`, `area-spells.test.ts` +8 |  |
| Kural sözlüğü s. 178 | Burrow Speed | var-test edilmiş | GENEL-SAVAS-DENETIM E29; `binekMb1.test.ts`, `binekMb3.test.ts` +1 |  |
| Kural sözlüğü s. 178 | Campaign | savaş dışı | terim; Serüven (kıta sayfaları, yolculuk kaydı) |  |
| Kural sözlüğü s. 178 | Cantrip | var-test edilmiş | slotsuz, seviyeyle güçlenir; `b93cleric.test.ts`, `b93warlock.test.ts` +23 |  |
| Kural sözlüğü s. 178 | Carrying Capacity | kısmi | GENEL-SAVAS-DENETIM F16, F17 | F17 kısmi: Taşıma sınırının üstünde sürükleme/kaldırma/itme: Speed en çok 5 ft |
| Kural sözlüğü s. 178 | Challenge Rating | var-test edilmiş | canavar CR, XP, PB; özel canavarda CR tahmini `data/cr-tahmini.json`; `setup.test.ts`, `srdD2.test.ts` +4 |  |
| Kural sözlüğü s. 178 | Character Sheet | var-test edilmiş | karakter kâğıdı `src/screens/sheet/`; `ck1.test.tsx` |  |
| Kural sözlüğü s. 178 | Charmed [Condition] | kısmi | GENEL-SAVAS-DENETIM B9, B10 | B9 kısmi: Charmed: büyüleyene saldıramaz / zarar veren etkiyle hedefleyemez; B10 yok: Charmed: büyüleyenin sosyal kontrollerinde avantaj |
| Kural sözlüğü s. 178 | Climbing | kısmi | GENEL-SAVAS-DENETIM E14 | E14 bilinçli sapma: Tırmanma: her ft 1 ek ft (zorluda 2); tırmanma hızı ek maliyeti kaldır… |
| Kural sözlüğü s. 179 | Climb Speed | kısmi | GENEL-SAVAS-DENETIM E14 | E14 bilinçli sapma: Tırmanma: her ft 1 ek ft (zorluda 2); tırmanma hızı ek maliyeti kaldır… |
| Kural sözlüğü s. 179 | Concentration | var-test edilmiş | GENEL-SAVAS-DENETIM B43; `incapacitated.test.ts` | hasar save DC max(10, yarı) |
| Kural sözlüğü s. 179 | Condition | kısmi | GENEL-SAVAS-DENETIM B1, B2, B5; `incapacitated.test.ts` | B2 kısmi: Immunity: bağışık olunan durum hiç etkilemez |
| Kural sözlüğü s. 179 | Cone [Area of Effect] | var-test edilmiş | `src/rules/area.ts` koni (genişlik = uzaklık); `a7spells.test.ts`, `areaAttack.test.ts` +4 |  |
| Kural sözlüğü s. 179 | Cover | var-test edilmiş | GENEL-SAVAS-DENETIM C6; `area-spells.test.ts`, `maprules.test.ts` +1 |  |
| Kural sözlüğü s. 179 | Crawling | kısmi | GENEL-SAVAS-DENETIM E8 | E8 kısmi: Sürünme: her ft 1 ek ft, zorlu arazide 2 ek ft |
| Kural sözlüğü s. 179 | Creature | var-test edilmiş | terim; savaşçı (`Combatant`); `diceUnlock.test.ts`, `a1.test.ts` +242 |  |
| Kural sözlüğü s. 179 | Creature Type | var-test edilmiş | `data/canavar-turleri.json` (D1 düzeltmeleri sonrası); `diceUnlock.test.ts`, `a2abilities.test.ts` +29 |  |
| Kural sözlüğü s. 179 | Critical Hit | kısmi | GENEL-SAVAS-DENETIM C2, C4, C5; `combat.test.ts`, `paladin.test.ts` +1 | C5 kısmi: Genişletilmiş kritik aralığı (Improved Critical "can score a Critical … |
| Kural sözlüğü s. 179 | Cube [Area of Effect] | var-test edilmiş | `src/rules/area.ts` küp; `ridersA2.test.ts`, `area.test.ts` |  |
| Kural sözlüğü s. 179 | Curses | kısmi | Bestow Curse/Remove Curse büyüleri; lanetli eşyalar Game Master (ESYA-SINIFLANDIRMA); `a4spells.test.ts`, `a6spells.test.ts` +1 | lanetli yaratık (likantropi) ve eşya laneti ilkeli yok |
| Kural sözlüğü s. 180 | Cylinder [Area of Effect] | var-testsiz | `cylinderFt`, havadaki silindir K73c |  |
| Kural sözlüğü s. 180 | D20 Test | var-test edilmiş | GENEL-SAVAS-DENETIM F1; `genel96.test.ts` |  |
| Kural sözlüğü s. 180 | Damage | var-test edilmiş | GENEL-SAVAS-DENETIM D1, D3; `combat.test.ts` |  |
| Kural sözlüğü s. 180 | Damage Roll | kısmi | GENEL-SAVAS-DENETIM D3, D4, D9; `altSoy.test.ts`, `b2.test.ts` +1 | D9 kısmi: Aynı saldırıda aynı türden parçalar (silah + Sneak Attack) |
| Kural sözlüğü s. 180 | Damage Threshold | yok | nesne/araç hasar eşiği yok (nesne HP'si eşiksiz) | SRD 5.2.1 canavarlarında yok; nesne/araç için |
| Kural sözlüğü s. 180 | Damage Types | var-test edilmiş | GENEL-SAVAS-DENETIM D5; `a6spells.test.ts`, `a7spells.test.ts` +1 |  |
| Kural sözlüğü s. 180 | Darkness | kısmi | GENEL-SAVAS-DENETIM H3, H4, H8 | H3 bilinçli sapma: Karanlık = Heavily Obscured: oradakini görmeye çalışan Blinded sayılır…; H4 bilinçli sapma: Gece dışarısı karanlıktır |
| Kural sözlüğü s. 180 | Darkvision | var-test edilmiş | GENEL-SAVAS-DENETIM H7; `ai.test.ts`, `altSoy.test.ts` +1 |  |
| Kural sözlüğü s. 180 | Dash [Action] | kısmi | GENEL-SAVAS-DENETIM A6, A7, E2; `economy.test.ts` | A7 kısmi: Dash: özel hızlardan birini seçme |
| Kural sözlüğü s. 180 | Dead | var-test edilmiş | GENEL-SAVAS-DENETIM D11, D12, G13; `deathsaves.test.ts` |  |
| Kural sözlüğü s. 181 | Deafened [Condition] | kısmi | GENEL-SAVAS-DENETIM B11 | B11 kısmi: Deafened: duyma gerektiren kontrolde otomatik başarısız |
| Kural sözlüğü s. 181 | Death Saving Throw | var-test edilmiş | GENEL-SAVAS-DENETIM D15, D16, D17; `deathsaves.test.ts`, `genel96.test.ts` |  |
| Kural sözlüğü s. 181 | Dehydration [Hazard] | savaş dışı | oyunda karşılığı yok | Serüven yolculuğunda su/erzak modeli |
| Kural sözlüğü s. 181 | Difficult Terrain | kısmi | GENEL-SAVAS-DENETIM E5, E6 | E6 yok: Dar açıklık (bir boy küçük yaratığa göre) zorlu arazidir; 5.2.1'de ayr… |
| Kural sözlüğü s. 181 | Difficulty Class | var-test edilmiş | terim; DC her save/kontrolde; `a6spells.test.ts`, `ai.test.ts` +88 |  |
| Kural sözlüğü s. 181 | Dim Light | var-test edilmiş | GENEL-SAVAS-DENETIM H1, H2; `k19tier4b.test.ts`, `k40.test.ts` +1 |  |
| Kural sözlüğü s. 181 | Disadvantage | var-test edilmiş | GENEL-SAVAS-DENETIM C1, F4; `combat.test.ts` |  |
| Kural sözlüğü s. 181 | Disengage [Action] | var-test edilmiş | GENEL-SAVAS-DENETIM A8, A40; `binekMb2.test.ts`, `economy.test.ts` +2 |  |
| Kural sözlüğü s. 181 | Dodge [Action] | var-test edilmiş | GENEL-SAVAS-DENETIM A9, A10, A11; `a8spells.test.ts`, `b94paladin.test.ts` +2 |  |
| Kural sözlüğü s. 181 | Emanation [Area of Effect] | var-test edilmiş | aura altyapısı `src/battle/auraCore.ts` (Spirit Guardians, auralar); `areaAttack.test.ts`, `k53systems.test.ts` +4 |  |
| Kural sözlüğü s. 181 | Encounter | var-test edilmiş | Game Master kurulumu, bölge karşılaşma üreteci `src/journey/encounter.ts`; `encounter.test.ts` |  |
| Kural sözlüğü s. 181 | Enemy | var-test edilmiş | terim; taraf `side`; `battleSave.test.ts`, `diceUnlock.test.ts` +275 |  |
| Kural sözlüğü s. 181 | Exhaustion [Condition] | kısmi | GENEL-SAVAS-DENETIM B12, B13, B14, B15, E28, F12; `s1.test.ts` | B13 kısmi: Exhaustion: D20 Testi −2 × seviye; F12 kısmi: Exhaustion −2×seviye bütün yetenek kontrollerine |
| Kural sözlüğü s. 182 | Experience Points | var-test edilmiş | XP eşikleri SRD ile aynı; CR → XP; `seruven32.test.ts`, `k38.test.ts` +2 |  |
| Kural sözlüğü s. 182 | Expertise | var-test edilmiş | GENEL-SAVAS-DENETIM F9; `advancement.test.ts`, `content.test.ts` +1 |  |
| Kural sözlüğü s. 182 | Falling [Hazard] | var-test edilmiş | GENEL-SAVAS-DENETIM E17, E18; `effects.test.ts`, `k66b.test.ts` +1 |  |
| Kural sözlüğü s. 182 | Flying | var-test edilmiş | GENEL-SAVAS-DENETIM E19; `shape91.test.ts` |  |
| Kural sözlüğü s. 182 | Fly Speed | var-test edilmiş | GENEL-SAVAS-DENETIM E19, E4; `shape91.test.ts` |  |
| Kural sözlüğü s. 182 | Friendly [Attitude] | savaş dışı | tutum modeli yok |  |
| Kural sözlüğü s. 182 | Frightened [Condition] | kısmi | GENEL-SAVAS-DENETIM B16, B17; `ruleVersion.test.ts` | B16 kısmi: Frightened: kaynak görüş hattındayken saldırıda ve kontrolde dezavanta… |
| Kural sözlüğü s. 182 | Grappled [Condition] | kısmi | GENEL-SAVAS-DENETIM B18, B19, B20 | B20 kısmi: Grappled: yakalayan sürükler, her ft +1 ft; hedef Tiny ya da iki+ boy … |
| Kural sözlüğü s. 182 | Grappling | kısmi | GENEL-SAVAS-DENETIM B21, C17; `k19feat.test.ts` | B21 kısmi: Grappling: biter: kaçış (Athletics/Acrobatics vs DC), yakalayan Incapa…; C17 kısmi: Unarmed Strike, Grapple: hedef STR ya da DEX save'i seçer, DC 8 + STR … |
| Kural sözlüğü s. 182 | Hazard | kısmi | harita tehlikeleri (lav, çamur, ince buz, tuzak), düşme, yanma, boğulma; `as1a77.test.ts`, `k74.test.ts` +3 | Dehydration ve Malnutrition yok |
| Kural sözlüğü s. 182 | Healing | var-test edilmiş | GENEL-SAVAS-DENETIM D1, D22; `combat.test.ts`, `deathsaves.test.ts` |  |
| Kural sözlüğü s. 182 | Heavily Obscured | kısmi | GENEL-SAVAS-DENETIM H3, H5 | H3 bilinçli sapma: Karanlık = Heavily Obscured: oradakini görmeye çalışan Blinded sayılır… |
| Kural sözlüğü s. 182 | Help [Action] | kısmi | GENEL-SAVAS-DENETIM A12, A13, A14, A15, F19, F20; `genel96.test.ts` | A14 yok: Help: Assist an Ability Check; A15 kısmi: Help: ilk yardım / stabilize, DC 10 WIS (Medicine) (s.18, glossary); F20 yok: Help (yetenek kontrolü): müttefikin seçilen beceri kontrolü avantajlı |
| Kural sözlüğü s. 183 | Heroic Inspiration | kısmi | GENEL-SAVAS-DENETIM F21 | F21 kısmi: Heroic Inspiration: herhangi bir zarı hemen yeniden at, yeniyi kullan;… |
| Kural sözlüğü s. 183 | Hide [Action] | kısmi | GENEL-SAVAS-DENETIM A17, A18 | A17 bilinçli sapma: Hide: DC 15 Stealth, yoğun örtü / ¾ siper, hiçbir düşmanın görüş hattı…; A18 bilinçli sapma: Hide biter: fısıltıdan yüksek ses, bulunma, saldırı zarı, Verbal bileş… |
| Kural sözlüğü s. 183 | High Jump | kısmi | GENEL-SAVAS-DENETIM E13, F15 | E13 kısmi: High Jump: koşarak 3 + STR değiştiricisi ft, yerinde yarısı; F15 yok: High Jump: 3 + STR mod ft (koşuyla), durarak yarısı; ft başına hareket |
| Kural sözlüğü s. 183 | Hit Point Dice | kısmi | GENEL-SAVAS-DENETIM G2, G3, G4; `b93wizard.test.ts`, `druid.test.ts` +2 | G3 kısmi: Her zardan sonra yenisini harcamaya karar verilir |
| Kural sözlüğü s. 183 | Hit Points | var-test edilmiş | GENEL-SAVAS-DENETIM D1, D2; `a2abilities.test.ts`, `classTraits.test.ts` +2 |  |
| Kural sözlüğü s. 183 | Hostile [Attitude] | savaş dışı | tutum modeli yok |  |
| Kural sözlüğü s. 183 | Hover | var-test edilmiş | GENEL-SAVAS-DENETIM E19; `shape91.test.ts` | Hover canavarları düşmez |
| Kural sözlüğü s. 183 | Illusions | kısmi | Illusion okulu; Truesight otomatik save (K63); Phantasmal Force/Killer | fiziksel temasla yanılsamayı fark etme (Study) yok |
| Kural sözlüğü s. 183 | Immunity | kısmi | GENEL-SAVAS-DENETIM D6, B2, B3, B4; `combat.test.ts`, `genel96.test.ts` | B2 kısmi: Immunity: bağışık olunan durum hiç etkilemez |
| Kural sözlüğü s. 183 | Improvised Weapons | var-test edilmiş | doğaçlama silah nesneleri (`object_changed.arm`, Kuyruk 36), 1d4; `te99.test.ts`, `hapishane.test.ts` +2 |  |
| Kural sözlüğü s. 184 | Incapacitated [Condition] | var-test edilmiş | GENEL-SAVAS-DENETIM B22, A37; `incapacitated.test.ts` |  |
| Kural sözlüğü s. 184 | Indifferent [Attitude] | savaş dışı | tutum modeli yok |  |
| Kural sözlüğü s. 184 | Influence [Action] | yok | GENEL-SAVAS-DENETIM A19 | A19 yok: Influence |
| Kural sözlüğü s. 184 | Initiative | var-test edilmiş | GENEL-SAVAS-DENETIM F22, B23; `ruleVersion.test.ts` | canavarlarda SRD "Initiative +X" yerine DEX kullanılıyor (bkz. 11) |
| Kural sözlüğü s. 184 | Invisible [Condition] | var-test edilmiş | GENEL-SAVAS-DENETIM B23, B24, B25; `ruleVersion.test.ts` |  |
| Kural sözlüğü s. 184 | Jumping | kısmi | GENEL-SAVAS-DENETIM E10, E13 | E13 kısmi: High Jump: koşarak 3 + STR değiştiricisi ft, yerinde yarısı |
| Kural sözlüğü s. 184 | Knocking Out a Creature | yok | GENEL-SAVAS-DENETIM D10 | D10 yok: Knocking Out: yakın dövüş saldırısıyla 0 HP'ye indirecekken 1 HP + Unc… |
| Kural sözlüğü s. 184 | Lightly Obscured | var-test edilmiş | GENEL-SAVAS-DENETIM H2, H6; `b2.test.ts`, `b93wizard.test.ts` +4 |  |
| Kural sözlüğü s. 184 | Line [Area of Effect] | var-test edilmiş | `src/rules/area.ts` çizgi (genişlikli); `areaAttack.test.ts`, `k65c.test.ts` +1 |  |
| Kural sözlüğü s. 184 | Long Jump | kısmi | GENEL-SAVAS-DENETIM E10, E11, E12; `genel96.test.ts` | E12 bilinçli sapma: Long Jump alçak engel: Game Master seçeneğiyle DC 10 Athletics |
| Kural sözlüğü s. 185 | Long Rest | kısmi | GENEL-SAVAS-DENETIM G5, G6, G7, G8, G9, G10; `areaAttack.test.ts`, `b1spells.test.ts` +6 | G6 yok: Long Rest başlamak için en az 1 HP; G7 doğrulanmadı: Long Rest: azalan HP en çoğu ve yetenek skorları normale döner; G10 kısmi: Long Rest'ten sonra yenisi için en az 16 saat |
| Kural sözlüğü s. 185 | Magic [Action] | kısmi | GENEL-SAVAS-DENETIM A20, A21 | A21 bilinçli sapma: Magic: 1 dakika+ döküm süresi her tur Magic + Konsantrasyon |
| Kural sözlüğü s. 185 | Magical Effect | var-test edilmiş | Dispel Magic/antimagic etkileri büyü kaynağına bakar; `b4.test.ts`, `b5.test.ts` +2 |  |
| Kural sözlüğü s. 185 | Malnutrition [Hazard] | savaş dışı | oyunda karşılığı yok |  |
| Kural sözlüğü s. 185 | Monster | var-test edilmiş | terim; `data/monsters.json` 330 kayıt; `battleSave.test.ts`, `g2-smoke.test.ts` +76 |  |
| Kural sözlüğü s. 185 | Nonplayer Character | var-test edilmiş | masumlar (`data/masumlar.json`), yerleşim NPC'leri; `battleSave.test.ts`, `diceUnlock.test.ts` +11 |  |
| Kural sözlüğü s. 185 | Object | var-test edilmiş | nesneler `src/battle/objects.ts`, `data/nesneler.json`; `a1.test.ts`, `a2leftovers.test.ts` +17 |  |
| Kural sözlüğü s. 185 | Occupied Space | kısmi | GENEL-SAVAS-DENETIM E21, E22, E23, E24, E25, E26; `genel96.test.ts` | E26 kısmi: Tur başka yaratığın alanında biterse Prone (Tiny ya da daha büyük deği… |
| Kural sözlüğü s. 185 | Opportunity Attacks | var-test edilmiş | GENEL-SAVAS-DENETIM C13, A26, A40; `binekMb2.test.ts`, `classTraits.test.ts` +5 |  |
| Kural sözlüğü s. 186 | Paralyzed [Condition] | var-test edilmiş | GENEL-SAVAS-DENETIM B26; `incapacitated.test.ts` |  |
| Kural sözlüğü s. 186 | Passive Perception | var-test edilmiş | GENEL-SAVAS-DENETIM F10, F11; `altSoy.test.ts`, `extraBonus.test.ts` +1 |  |
| Kural sözlüğü s. 186 | Per Day | var-test edilmiş | kaynak yenilenmesi (uzun dinlenme; canavarda N/Day savaşta N kez); `reactions.test.ts` |  |
| Kural sözlüğü s. 186 | Petrified [Condition] | var-test edilmiş | GENEL-SAVAS-DENETIM B27, B28, B29; `genel96.test.ts`, `incapacitated.test.ts` +1 | ağırlık ×10 ve yaşlanma savaş dışı (B30) |
| Kural sözlüğü s. 186 | Player Character | var-test edilmiş | terim; en çok 6 karakter `MAX_PARTY`; `setup.test.ts`, `ck1.test.tsx` +2 |  |
| Kural sözlüğü s. 186 | Poisoned [Condition] | var-test edilmiş | GENEL-SAVAS-DENETIM B31, B32; `a1.test.ts`, `a4spells.test.ts` +2 |  |
| Kural sözlüğü s. 186 | Possession | var-test edilmiş | Kuyruk K64a `src/battle/possession.ts`, `data/ele-gecirme.json`; `k64.test.ts`, `k64b.test.ts` +1 |  |
| Kural sözlüğü s. 186 | Proficiency | var-test edilmiş | GENEL-SAVAS-DENETIM F7, F8; `abilities.test.ts`, `k19level20.test.ts` |  |
| Kural sözlüğü s. 186 | Prone [Condition] | kısmi | GENEL-SAVAS-DENETIM B33, B34, B35, E7, E9; `genel96.test.ts`, `ruleVersion.test.ts` | B35 yok: Prone: isteğe bağlı yere yatma (Dropping Prone, Speed kuralı); E9 yok: Dropping Prone: eylemsiz ve hareketsiz, hız 0'da olmaz |
| Kural sözlüğü s. 186 | Reach | var-test edilmiş | `reachFt`, Reach silahları, 3B erişim (K73b); `setup.test.ts`, `a6spells.test.ts` +58 |  |
| Kural sözlüğü s. 186 | Reaction | var-test edilmiş | GENEL-SAVAS-DENETIM A38, A39; `economy.test.ts`, `ready.test.ts` |  |
| Kural sözlüğü s. 186 | Ready [Action] | kısmi | GENEL-SAVAS-DENETIM A22, A23, A24, A25, A26, A28; `genel96.test.ts`, `ready.test.ts` | A23 kısmi: Ready: yanıt "the action you will take" (her eylem); A24 bilinçli sapma: Ready: tetik "perceivable circumstance"; YZ kullanmaz (A27) |
| Kural sözlüğü s. 187 | Resistance | var-test edilmiş | GENEL-SAVAS-DENETIM D6, D7, D8; `combat.test.ts`, `genel96.test.ts` |  |
| Kural sözlüğü s. 187 | Restrained [Condition] | var-test edilmiş | GENEL-SAVAS-DENETIM B36, B37; `g01SaveWhy.test.ts` |  |
| Kural sözlüğü s. 187 | Ritual | kısmi | ritüel büyüler yalnız kurulumda (Find Familiar, Phantom Steed); diğer ritüeller savaş dışı; `b93wizard.test.ts`, `features.test.ts` +4 | savaş dışı ritüel kullanımı (Detect Magic vb.) Serüven'de yok |
| Kural sözlüğü s. 187 | Round Down | var-testsiz | yarı değerler aşağı (hasar, hız) |  |
| Kural sözlüğü s. 187 | Save | kısmi | GENEL-SAVAS-DENETIM F3 | F3 kısmi: Saving throw: doğal 20/1 otomatik değil; istersen zar atmadan başarısı… |
| Kural sözlüğü s. 187 | Saving Throw | kısmi | GENEL-SAVAS-DENETIM F3 | F3 kısmi: Saving throw: doğal 20/1 otomatik değil; istersen zar atmadan başarısı… |
| Kural sözlüğü s. 187 | Search [Action] | kısmi | GENEL-SAVAS-DENETIM A29 | A29 kısmi: Search: WIS kontrolü (Insight, Medicine, Perception, Survival) |
| Kural sözlüğü s. 187 | Shape-Shifting | kısmi | Wild Shape/Polymorph (`polymorph.ts`, WS91); CLAUDE.md "Wild Shape / Polymorph biçimi kısmen"; `a8spells.test.ts`, `druid.test.ts` +21 | biçimdeki eşya, biçim aurası, YZ kullanımı |
| Kural sözlüğü s. 187 | Short Rest | kısmi | GENEL-SAVAS-DENETIM G1, G2, G3, G11, G12; `b93wizard.test.ts`, `druid.test.ts` +2 | G3 kısmi: Her zardan sonra yenisini harcamaya karar verilir; G11 yok: Kesintiler (inisiyatif, cantrip dışı büyü, hasar, 1 saat efor); kesile…; G12 bilinçli sapma: Short Rest sayısında sınır yok (s.16, s.187) |
| Kural sözlüğü s. 187 | Simultaneous Effects | kısmi | aynı anda tetiklenenler kodda sabit sırayla | sırayı tur sahibinin seçmesi yok (doğrulanmadı) |
| Kural sözlüğü s. 188 | Size | kısmi | GENEL-SAVAS-DENETIM E20 | E20 bilinçli sapma: Boyut ve alan: Tiny 2½ ft … Gargantuan 20 ft; çok altıgen gövde `multiHex` deneysel |
| Kural sözlüğü s. 188 | Skill | var-test edilmiş | `src/rules/skills.ts`; `a6spells.test.ts`, `altSoy.test.ts` +47 |  |
| Kural sözlüğü s. 188 | Speed | kısmi | GENEL-SAVAS-DENETIM E1, E3, E4, E27 | E3 kısmi: Birden çok hız: hareket sırasında geçiş, gidilen yol yeni hızdan düşül… |
| Kural sözlüğü s. 188 | Spell | var-test edilmiş | 339 SRD büyüsü (bkz. 7); `a1.test.ts`, `a2leftovers.test.ts` +135 |  |
| Kural sözlüğü s. 188 | Spell Attack | var-test edilmiş | büyü saldırı zarı (yetenek + PB); `a1.test.ts`, `a2leftovers.test.ts` +75 |  |
| Kural sözlüğü s. 188 | Spellcasting Focus | kısmi | `spellComponents.ts`: M bileşeni yalnız bilgi; `spellComponents.test.ts` | odak/fiyatlı malzeme denetimi yok |
| Kural sözlüğü s. 188 | Sphere [Area of Effect] | var-test edilmiş | `src/rules/area.ts` küre; havada merkezli küre K73c; `areaAttack.test.ts`, `b2.test.ts` +9 |  |
| Kural sözlüğü s. 188 | Stable | kısmi | GENEL-SAVAS-DENETIM D16, D18, D20, D21; `deathsaves.test.ts`, `economy.test.ts` +1 | D18 kısmi: Stabilize: Help eylemi + DC 10 WIS (Medicine); D21 kısmi: İyileşmeyen stabil yaratık 1d4 saat sonra 1 HP kazanır. 0 HP'deyken kı… |
| Kural sözlüğü s. 188 | Stat Block | var-test edilmiş | canavar stat blokları `data/monsters.json` (SRD-VERI-DOGRULAMA); `battleSave.test.ts`, `g2-smoke.test.ts` +76 |  |
| Kural sözlüğü s. 189 | Study [Action] | kısmi | GENEL-SAVAS-DENETIM A30 | A30 kısmi: Study: INT kontrolü |
| Kural sözlüğü s. 189 | Stunned [Condition] | var-test edilmiş | GENEL-SAVAS-DENETIM B38; `incapacitated.test.ts` |  |
| Kural sözlüğü s. 189 | Suffocation [Hazard] | var-test edilmiş | nefes 1 + CON dakika, sonra tur sonu Exhaustion (`underwaterCore.ts`, K73c); `a7spells.test.ts`, `altSoy.test.ts` +9 | yalnız su altında; Stinking Cloud vb. dışında boğulma yok |
| Kural sözlüğü s. 189 | Surprise | kısmi | Incapacitated inisiyatif dezavantajı (`create.ts:880`), uyuyan grup alarmı (`alarm.ts`); `aiObjectives.test.ts`, `alarm.test.ts` +7 | savaş başında gizlenen tarafın genel sürpriz kontrolü yok |
| Kural sözlüğü s. 189 | Swimming | kısmi | GENEL-SAVAS-DENETIM E15, E16; `altSoy.test.ts`, `forced.test.ts` +1 | E16 bilinçli sapma: (SRD'de yok) Kıyıdan uzak derin suya yalnızca yüzücü girer |
| Kural sözlüğü s. 189 | Swim Speed | var-test edilmiş | GENEL-SAVAS-DENETIM E15; `altSoy.test.ts`, `forced.test.ts` +1 |  |
| Kural sözlüğü s. 190 | Target | var-testsiz | terim; hedefleme `seenTargets.ts` |  |
| Kural sözlüğü s. 190 | Telepathy | savaş dışı | oyunda karşılığı yok (iletişim) |  |
| Kural sözlüğü s. 190 | Teleportation | var-test edilmiş | `src/battle/teleport.ts`, `motion.ts` `withArrival` (fırsat saldırısı yok); `a2abilities.test.ts`, `k19legendary.test.ts` +12 |  |
| Kural sözlüğü s. 190 | Temporary Hit Points | kısmi | GENEL-SAVAS-DENETIM D23, D24, D25, D26; `effects.test.ts` | D26 kısmi: Geçici HP tükenene ya da uzun dinlenmeye dek sürer |
| Kural sözlüğü s. 190 | Tremorsense | var-test edilmiş | GENEL-SAVAS-DENETIM H10; `genel96.test.ts`, `k73c.test.ts` +2 |  |
| Kural sözlüğü s. 190 | Truesight | var-test edilmiş | GENEL-SAVAS-DENETIM H11; `k19tier4b.test.ts`, `k19vision.test.ts` +1 |  |
| Kural sözlüğü s. 190 | Unarmed Strike | kısmi | GENEL-SAVAS-DENETIM C16, C17, C18; `forced.test.ts`, `k19feat.test.ts` | C17 kısmi: Unarmed Strike, Grapple: hedef STR ya da DEX save'i seçer, DC 8 + STR … |
| Kural sözlüğü s. 191 | Unconscious [Condition] | kısmi | GENEL-SAVAS-DENETIM B39, B40, B41, B42; `genel96.test.ts` | B40 yok: Unconscious: elindekini düşürür |
| Kural sözlüğü s. 191 | Unoccupied Space | var-testsiz | boş altıgen (`appearSpot`, `landingSpot`) |  |
| Kural sözlüğü s. 191 | Utilize [Action] | kısmi | GENEL-SAVAS-DENETIM A31, A32, A33; `genel96.test.ts` | A32 kısmi: Turda bir serbest nesne etkileşimi; ikincisi Utilize |
| Kural sözlüğü s. 191 | Vulnerability | var-test edilmiş | GENEL-SAVAS-DENETIM D6, D8; `combat.test.ts`, `genel96.test.ts` |  |
| Kural sözlüğü s. 191 | Weapon | var-test edilmiş | 38 SRD silahı (bkz. 6); `evaluate.test.ts`, `k59ai.test.ts` +52 |  |
| Kural sözlüğü s. 191 | Weapon Attack | var-test edilmiş | silah saldırısı (yetenek + PB, ustalık); `setup.test.ts`, `a1.test.ts` +111 |  |

## 9. Oyun araç kutusu (Gameplay Toolbox) (s. 192–203)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Oyun araç kutusu s. 192 | Travel Pace (Fast/Normal/Slow; günlük mil) | kısmi | dünya gezintisi tek tempo: yaya 1 mil/saat, 24 mil/gün (`data/harita/gezinti-kurallari.json`); `regions.test.ts`, `roam.test.ts` | tempo seçimi ve etkileri (Fast: Algı −5; Slow: Gizlilik) yok |
| Oyun araç kutusu s. 192 | Travel Pace: Good Roads, Slower Travelers | kısmi | yol katmanı maliyeti (`yolMaliyet`); grubun en yavaşı kuralı yok |  |
| Oyun araç kutusu s. 192 | Travel Pace: Extended Travel (zorlu yürüyüş, CON save ya da Exhaustion) | yok | yok | gezintide 8 saat üstü yürüyüş kuralı |
| Oyun araç kutusu s. 192 | Travel Pace: Special Movement (uçuş, yüzme hızıyla yolculuk) | kısmi | uçuş `ucusMilSaat`, göl/nehirde yüzme (K49 `swimAt`); `regions.test.ts` |  |
| Oyun araç kutusu s. 192 | Travel Pace: Vehicles (gemi tempoları) | kısmi | gemi yolculuğu `gemiMilSaat` 3; araç tablosu yok |  |
| Oyun araç kutusu s. 192 | Creating a Background (yetenek, feat, beceri, alet, donanım adımları) | savaş dışı | 8 özgün geçmiş veride (`data/backgrounds.json` `ozgun`), oyuncu için geçmiş oluşturucu yok | oluşturucuda özel geçmiş adımı |
| Oyun araç kutusu s. 193 | Curses: Bestow Curse | var-test edilmiş | büyü verisi (bkz. 7); `a4spells.test.ts`, `a6spells.test.ts` +1 |  |
| Oyun araç kutusu s. 193 | Curses: Cursed Creatures (likantropi vb.) | yok | likantrop laneti yok (ENVANTER-CANAVARLAR "A2'de kalan": 5 canavar) | 0 HP'de taraf değiştirme (allegianceSwap) ya da Serüven laneti |
| Oyun araç kutusu s. 193 | Curses: Cursed Magic Items | kısmi | lanetli eşyalar Game Master'a bırakıldı (Berserker Axe vb., ESYA-SINIFLANDIRMA (c)) | eşya laneti ilkeli |
| Oyun araç kutusu s. 193 | Curses: Narrative ve Environmental Curses | savaş dışı | oyunda karşılığı yok |  |
| Oyun araç kutusu s. 194 | Magical Contagions: Rest and Recuperation | savaş dışı | oyunda karşılığı yok |  |
| Oyun araç kutusu s. 194 | Magical Contagion: Cackle Fever | yok | yok (Contagion büyüsü ayrı; bkz. 7) | Serüven/dinlenme katmanında hastalık durumu |
| Oyun araç kutusu s. 194 | Magical Contagion: Sewer Plague | yok | yok (Contagion büyüsü ayrı; bkz. 7) | Serüven/dinlenme katmanında hastalık durumu |
| Oyun araç kutusu s. 194 | Magical Contagion: Sight Rot | yok | yok (Contagion büyüsü ayrı; bkz. 7) | Serüven/dinlenme katmanında hastalık durumu |
| Oyun araç kutusu s. 195 | Environmental Effects: Deep Water (yüzme hızı yoksa her saat DC 10 CON ya da Exhaustion) | kısmi | derin su `deepWater.ts` (bilinçli sapma E16: kıyıdan uzak derin suya yalnız yüzücü), su altı nefes K73c; `deepWater.test.ts`, `k19feat2.test.ts` +5 | saatlik yüzme yorgunluğu yok (savaş süresi kısa) |
| Oyun araç kutusu s. 195 | Environmental Effects: Extreme Cold (saatlik CON save, Exhaustion) | kısmi | harita kuralı `coldExposure` (`highlands.ts`; varsayılan kapalı; her N turda); `k26.test.ts` | saat yerine tur ölçeği |
| Oyun araç kutusu s. 195 | Environmental Effects: Extreme Heat (su içmeyen, saatlik CON save) | yok | yok (çöl haritalarında sıcak kuralı yok) | çöl/volkan için `heatExposure` harita kuralı |
| Oyun araç kutusu s. 195 | Environmental Effects: Frigid Water (dakikalık CON save, Exhaustion) | kısmi | yalnız ince buz kırılınca buzlu su hasarı + Restrained (`wilds.ts` `thinIce`); `as1a77.test.ts`, `wilds.test.ts` | soğuk suda kalma süresi kuralı |
| Oyun araç kutusu s. 195 | Environmental Effects: Heavy Precipitation (Lightly Obscured, Algı dezavantajı, alev söner) | kısmi | `stormRules` (yağmurda Algı −5), kar yağışı `snowfall`; `k19vision.test.ts`, `wilds.test.ts` | açık alevin sönmesi doğrulanmadı |
| Oyun araç kutusu s. 195 | Environmental Effects: High Altitude (10.000 ft üstü, Exhaustion) | savaş dışı | oyunda karşılığı yok |  |
| Oyun araç kutusu s. 195 | Environmental Effects: Slippery Ice (DC 10 DEX ya da Prone, zorlu arazi) | kısmi | buz yüzeyi (`data/yuzeyler.json` ice; Ice Walk canavar özelliği); `freeHex.test.ts`, `freeHexHizli.test.ts` +9 | doğrulanmadı: buz zeminde DEX save/Prone |
| Oyun araç kutusu s. 195 | Environmental Effects: Strong Wind (menzilli dezavantaj, uçuş biter, alev söner) | var-test edilmiş | rüzgâr `wind` (`againstStrongWind`, sürüm 7), `stormRules` uçuş maliyeti; `a6spells.test.ts`, `ai.test.ts` +19 |  |
| Oyun araç kutusu s. 195 | Environmental Effects: Thin Ice (ağırlık, kırılma) | var-test edilmiş | `thinIce` (`wilds.ts`); `as1a77.test.ts`, `wilds.test.ts` |  |
| Oyun araç kutusu s. 196 | Fear Effects (Frightened, korku save'leri) | var-test edilmiş | Frightened durumu (B16, B17); `a1.test.ts`, `a2leftovers.test.ts` +31 |  |
| Oyun araç kutusu s. 196 | Mental Stress Effects (Psychic hasar + zihinsel stres tablosu) | yok | yok; Moral ev kuralı (`src/rules/moral.ts`) benzer amaçlı ama SRD tablosu değil | Moral'e bağlanabilir |
| Oyun araç kutusu s. 196 | Prolonged Effects (uzun süreli korku/stres) | savaş dışı | oyunda karşılığı yok |  |
| Oyun araç kutusu s. 197 | Poison: dört tür (Contact, Ingested, Inhaled, Injury) ve uygulama (Injury: bonus eylem) | kısmi | Basic Poison eşyası ve Cunning Strike Poison; türler ayrılmıyor; `a4spells.test.ts`, `k59ai.test.ts` +24 | zehir türü ve silaha sürme eylemi |
| Oyun araç kutusu s. 197 | Purchasing Poison | savaş dışı | oyunda karşılığı yok |  |
| Oyun araç kutusu s. 197 | Harvesting Poison (DC 20 INT (Nature), Poisoner's Kit) | yok | yok | savaş sonu ganimet adımı |
| Oyun araç kutusu s. 197 | Sample Poison: Assassin's Blood | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 197 | Sample Poison: Burnt Othur Fumes | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 197 | Sample Poison: Crawler Mucus | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 197 | Sample Poison: Essence of Ether | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 197 | Sample Poison: Malice | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 197 | Sample Poison: Midnight Tears | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 198 | Sample Poison: Oil of Taggit | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 198 | Sample Poison: Pale Tincture | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 198 | Sample Poison: Purple Worm Poison | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 198 | Sample Poison: Serpent Venom | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 198 | Sample Poison: Spider's Sting | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 198 | Sample Poison: Torpor | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 198 | Sample Poison: Truth Serum | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 198 | Sample Poison: Wyvern Poison | yok | eşya verisinde yok | `data/items.json` `use` (save + durum) kalıbıyla |
| Oyun araç kutusu s. 199 | Traps: Parts of a Trap (tetik, süre, sezme/etkisiz kılma) | kısmi | harita tuzak kuralı `trap` (gizli, `perceptionDc`, save, hasar, `once`; `maprules.ts` `trapHexes`), sarmaşık kapanı `vineTrap`; `dungeon.test.ts`, `forest.test.ts` +2 | tuzağı etkisiz kılma (Thieves' Tools/Sleight of Hand) ve "GM'e gizli tuzak görünümü" yok |
| Oyun araç kutusu s. 199 | Example Trap: Collapsing Roof | kısmi | Earthquake çöküşü `quake.ts` yaklaşık | tuzak şablonu olarak `data/` içine |
| Oyun araç kutusu s. 199 | Example Trap: Falling Net | yok | yok (genel `trap` kuralıyla yalnız hasar/save) | tuzak şablonu olarak `data/` içine |
| Oyun araç kutusu s. 199 | Example Trap: Fire-Casting Statue | yok | yok (genel `trap` kuralıyla yalnız hasar/save) | tuzak şablonu olarak `data/` içine |
| Oyun araç kutusu s. 200 | Example Trap: Hidden Pit | kısmi | genel tuzak kuralı ve Dış Halka çukuru `pitFall` yaklaşık | tuzak şablonu olarak `data/` içine |
| Oyun araç kutusu s. 200 | Example Trap: Poisoned Darts | yok | yok (genel `trap` kuralıyla yalnız hasar/save) | tuzak şablonu olarak `data/` içine |
| Oyun araç kutusu s. 200 | Example Trap: Poisoned Needle | yok | yok (genel `trap` kuralıyla yalnız hasar/save) | tuzak şablonu olarak `data/` içine |
| Oyun araç kutusu s. 201 | Example Trap: Rolling Stone | kısmi | kaya yuvarlama nesnesi `boulderPile` (rockRoll) yaklaşık | tuzak şablonu olarak `data/` içine |
| Oyun araç kutusu s. 201 | Example Trap: Spiked Pit | yok | yok (genel `trap` kuralıyla yalnız hasar/save) | tuzak şablonu olarak `data/` içine |
| Oyun araç kutusu s. 202 | Combat Encounter Difficulty: zorluk, XP bütçesi, harcama | var-test edilmiş | `src/rules/budget.ts`, `data/butce.json`, `src/journey/encounter.ts` (SRD XP bütçesi); `encounter.test.ts`, `k38.test.ts` +1 |  |
| Oyun araç kutusu s. 203 | Troubleshooting (çok yaratık, CR 0, stat blok sayısı, güçlü yaratık) | kısmi | üreteçte en çok 6 düşman ve 1 efsanevi, lider CR ≤ seviye; `encounter.test.ts` | Game Master tavsiyesi; kalanı savaş dışı |

## 10. Sihirli eşyalar (Magic Items) (s. 204–253)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Sihirli eşyalar s. 204 | Magic Item Categories (Armor, Potions, Rings, Rods, Scrolls, Staffs, Wands, Weapons, Wondrous) | var-test edilmiş | kategori `src/rules/itemCategory.ts`, `data/esya-kategori.json`; `itemCategory.test.ts` |  |
| Sihirli eşyalar s. 205 | Magic Item Rarity ve Values by Rarity | kısmi | nadirlik veride; dükkân fiyatı `data/yerlesim.json` | doğrulanmadı: fiyatın SRD nadirlik tablosuna uyumu |
| Sihirli eşyalar s. 206 | Activating: Command Word, Consumable Items | var-test edilmiş | `use_item` (bonus eylem; `src/battle/items.ts`); `evaluate.test.ts`, `g6.test.ts` +4 |  |
| Sihirli eşyalar s. 206 | Activating: Spells Cast from Items, Charges | var-testsiz | yüklü büyü `spells`/`charges`, yük `src/rules/itemCharges.ts` (TE99) |  |
| Sihirli eşyalar s. 206 | "The Next Dawn" (yük yenilenmesi) | kısmi | `itemCharges.ts`: SRD "daily at dawn", oyunda uzun dinlenme | bilinçli sapma (zaman modeli yok) |
| Sihirli eşyalar s. 206 | Cursed Items | kısmi | Game Master'a bırakıldı (eşya laneti ilkeli yok) | eşya laneti ilkeli |
| Sihirli eşyalar s. 206 | Magic Item Resilience (hasara dayanıklılık) | savaş dışı | oyunda karşılığı yok (eşyalar hedef alınmaz) |  |
| Sihirli eşyalar s. 206 | Crafting Magic Items (Arcana, alet, büyü, süre ve maliyet) | savaş dışı | oyunda karşılığı yok |  |
| Sihirli eşyalar s. 207 | Sentient Magic Items (yetenekler, hizalanma, iletişim, duyular, amaç, çatışma) | savaş dışı | oyunda karşılığı yok |  |
| Sihirli eşyalar s. 209 | Adamantine Armor — Uncommon | var-test edilmiş | `data/items*.json` (passive); `k19items.test.ts` |  |
| Sihirli eşyalar s. 209 | Ammunition, +1, +2, or +3 (3 çeşit) — Varies | var-testsiz | `data/items*.json` (bonus) |  |
| Sihirli eşyalar s. 209 | Ammunition of Slaying — Very Rare | var-test edilmiş | `data/items*.json` (onHit); `te99.test.ts` |  |
| Sihirli eşyalar s. 209 | Amulet of Health — Rare | var-test edilmiş | `data/items*.json` (effects); `stats.test.ts`, `k4.test.tsx` |  |
| Sihirli eşyalar s. 209 | Amulet of Proof against Detection and Location — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 209 | Amulet of the Planes — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 209 | Animated Shield — Very Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 210 | Apparatus of the Crab — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 210 | Armor, +1, +2, or +3 (3 çeşit) — Varies | var-testsiz | `data/items*.json` (effects) |  |
| Sihirli eşyalar s. 210 | Armor of Invulnerability — Legendary | var-testsiz | `data/items*.json` (passive, use) |  |
| Sihirli eşyalar s. 210 | Armor of Resistance (13 çeşit) — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 211 | Armor of Vulnerability (3 çeşit) — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 211 | Arrow-Catching Shield — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 211 | Bag of Beans — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 212 | Bag of Devouring — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 212 | Bag of Holding — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 212 | Bag of Tricks — Uncommon | var-test edilmiş | `data/items*.json` (paket); `p7.test.ts` |  |
| Sihirli eşyalar s. 212 | Bead of Force — Rare | var-test edilmiş | `data/items*.json` (spells); `te99.test.ts` |  |
| Sihirli eşyalar s. 213 | Bead of Nourishment — Common | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 213 | Belt of Dwarvenkind — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 213 | Belt of Giant Strength (6 çeşit) — Varies | var-test edilmiş | `data/items*.json` (effects); `stats.test.ts` |  |
| Sihirli eşyalar s. 213 | Berserker Axe — Rare | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: lanet (uyum bozulmaz, kana susama WIS save) — eşya laneti ilkeli yok |
| Sihirli eşyalar s. 213 | Boots of Elvenkind — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 213 | Boots of Levitation — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 214 | Boots of Speed — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 214 | Boots of Striding and Springing — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 214 | Boots of the Winterlands — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 214 | Bowl of Commanding Water Elementals — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 214 | Bracers of Archery — Uncommon | var-testsiz | `data/items*.json` (onHit) |  |
| Sihirli eşyalar s. 214 | Bracers of Defense — Rare | var-test edilmiş | `data/items*.json` (effects); `stats.test.ts` |  |
| Sihirli eşyalar s. 214 | Brazier of Commanding Fire Elementals — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 214 | Brooch of Shielding — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 214 | Broom of Flying — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 214 | Candle of Invocation — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 215 | Cape of the Mountebank — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 215 | Carpet of Flying — Very Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 215 | Censer of Controlling Air Elementals — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 215 | Chime of Opening — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 215 | Circlet of Blasting — Uncommon | var-testsiz | `data/items*.json` (spells, attack) |  |
| Sihirli eşyalar s. 215 | Cloak of Arachnida — Very Rare | var-testsiz | `data/items*.json` (passive, spells) |  |
| Sihirli eşyalar s. 215 | Cloak of Displacement — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 215 | Cloak of Elvenkind — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 215 | Cloak of Invisibility — Legendary | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 216 | Cloak of Protection — Uncommon | var-test edilmiş | `data/items*.json` (effects); `ws92b.test.ts`, `stats.test.ts` +1 |  |
| Sihirli eşyalar s. 216 | Cloak of the Bat — Rare | var-testsiz | `data/items*.json` (passive, spells) |  |
| Sihirli eşyalar s. 216 | Cloak of the Manta Ray — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 216 | Crystal Ball — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 216 | Crystal Ball of Mind Reading — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 216 | Crystal Ball of Telepathy — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 216 | Crystal Ball of True Seeing — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 216 | Cube of Force — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 216 | Cubic Gate — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 216 | Dagger of Venom — Rare | var-testsiz | `data/items*.json` (bonus, onHit) |  |
| Sihirli eşyalar s. 217 | Dancing Sword — Very Rare | var-testsiz | `data/items*.json` (bonus, onHit) |  |
| Sihirli eşyalar s. 217 | Decanter of Endless Water — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 217 | Deck of Illusions — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 218 | Defender — Legendary | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: silah bonusunu tur başında AC'ye aktarma seçimi — eşya seçim kancası yok |
| Sihirli eşyalar s. 218 | Demon Armor — Very Rare | var-testsiz | `data/items*.json` (onHit, effects) |  |
| Sihirli eşyalar s. 218 | Dimensional Shackles — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 218 | Dragon Orb — Artifact | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 218 | Dragon Scale Mail — Very Rare | var-testsiz | `data/items*.json` (passive, effects) |  |
| Sihirli eşyalar s. 219 | Dragon Slayer — Rare | var-testsiz | `data/items*.json` (bonus, onHit) |  |
| Sihirli eşyalar s. 219 | Dust of Disappearance — Uncommon | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 219 | Dust of Dryness — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 219 | Dust of Sneezing and Choking — Uncommon | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 219 | Dwarven Plate — Very Rare | var-testsiz | `data/items*.json` (effects) |  |
| Sihirli eşyalar s. 219 | Dwarven Thrower — Very Rare | var-testsiz | `data/items*.json` (bonus, onHit) |  |
| Sihirli eşyalar s. 219 | Efficient Quiver — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 220 | Efreeti Bottle — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 220 | Elemental Gem — Uncommon | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 220 | Elixir of Health — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 220 | Elven Chain — Rare | var-testsiz | `data/items*.json` (effects) |  |
| Sihirli eşyalar s. 220 | Energy Bow — Very Rare | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: enerji oku (ok yaratma, menzil seçimi) — eşya saldırı biçimi kancası yok |
| Sihirli eşyalar s. 220 | Eversmoking Bottle — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 221 | Eyes of Charming — Uncommon | var-test edilmiş | `data/items*.json` (spells); `te99.test.ts` |  |
| Sihirli eşyalar s. 221 | Eyes of Minute Seeing — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 221 | Eyes of the Eagle — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 221 | Feather Token — Varies | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 221 | Figurine of Wondrous Power — Varies | var-testsiz | `data/items*.json` (paket) |  |
| Sihirli eşyalar s. 223 | Flame Tongue — Rare | var-test edilmiş | `data/items*.json` (passive, onHit); `k19items.test.ts` |  |
| Sihirli eşyalar s. 223 | Folding Boat — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 223 | Frost Brand — Very Rare | var-testsiz | `data/items*.json` (passive, onHit) |  |
| Sihirli eşyalar s. 223 | Gauntlets of Ogre Power — Uncommon | var-test edilmiş | `data/items*.json` (effects); `stats.test.ts` |  |
| Sihirli eşyalar s. 223 | Gem of Brightness — Uncommon | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 223 | Gem of Seeing — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 223 | Giant Slayer — Rare | var-testsiz | `data/items*.json` (bonus, onHit) |  |
| Sihirli eşyalar s. 223 | Glamoured Studded Leather — Rare | var-testsiz | `data/items*.json` (effects) |  |
| Sihirli eşyalar s. 224 | Gloves of Missile Snaring — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 224 | Gloves of Swimming and Climbing — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 224 | Gloves of Thievery — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 224 | Goggles of Night — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 224 | Hammer of Thunderbolts — Legendary | var-testsiz | `data/items*.json` (bonus, onHit, effects) |  |
| Sihirli eşyalar s. 224 | Handy Haversack — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 224 | Hat of Disguise — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 224 | Hat of Many Spells — Very Rare | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: rastgele büyü tablosu — eşya büyüsünde rastgele sonuç yok |
| Sihirli eşyalar s. 225 | Headband of Intellect — Uncommon | var-test edilmiş | `data/items*.json` (effects); `k4.test.tsx` |  |
| Sihirli eşyalar s. 225 | Helm of Brilliance — Very Rare | var-testsiz | `data/items*.json` (passive, spells) |  |
| Sihirli eşyalar s. 226 | Helm of Comprehending Languages — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 226 | Helm of Telepathy — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 226 | Helm of Teleportation — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 226 | Holy Avenger — Legendary | var-testsiz | `data/items*.json` (passive, bonus, onHit) |  |
| Sihirli eşyalar s. 226 | Horn of Blasting — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 226 | Horn of Valhalla — Varies | var-testsiz | `data/items*.json` (paket) |  |
| Sihirli eşyalar s. 226 | Horseshoes of a Zephyr — Very Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 227 | Horseshoes of Speed — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 227 | Immovable Rod — Uncommon | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: havada sabit nesne — K53 geçici engelini eşyaya bağlama yok |
| Sihirli eşyalar s. 227 | Instant Fortress — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 227 | Ioun Stone — Varies | var-testsiz | `data/items*.json` (effects) |  |
| Sihirli eşyalar s. 228 | Iron Bands — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 228 | Iron Flask — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 228 | Javelin of Lightning — Uncommon | var-test edilmiş | `data/items*.json` (onHit); `te99.test.ts`, `a5esya.test.ts` |  |
| Sihirli eşyalar s. 228 | Lantern of Revealing — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 229 | Luck Blade — Legendary | var-testsiz | `data/items*.json` (bonus, effects) |  |
| Sihirli eşyalar s. 229 | Mace of Disruption — Rare | var-testsiz | `data/items*.json` (passive, onHit) |  |
| Sihirli eşyalar s. 229 | Mace of Smiting — Rare | var-testsiz | `data/items*.json` (bonus, onHit) |  |
| Sihirli eşyalar s. 229 | Mace of Terror — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 229 | Mantle of Spell Resistance — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 229 | Manual of Bodily Health — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 229 | Manual of Gainful Exercise — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 229 | Manual of Golems — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 230 | Manual of Quickness of Action — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 230 | Marvelous Pigments — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 230 | Medallion of Thoughts — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 230 | Mirror of Life Trapping — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 231 | Mithral Armor — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 231 | Mysterious Deck — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 232 | Necklace of Adaptation — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 233 | Necklace of Fireballs — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 233 | Necklace of Prayer Beads — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 233 | Nine Lives Stealer — Very Rare | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: anında öldürme (HP ≤ 100, CON save, yük) — eşya isabet kancasında ölüm yok |
| Sihirli eşyalar s. 233 | Oathbow — Very Rare | var-testsiz | `data/items*.json` (onHit) |  |
| Sihirli eşyalar s. 233 | Oil of Etherealness — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 233 | Oil of Sharpness — Very Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 233 | Oil of Slipperiness — Uncommon | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 234 | Pearl of Power — Uncommon | savaş dışı | `offCombat`: Pearl of Power: bir slot geri (savaş dışı ayin değil: bonus eylem — Game Master |  |
| Sihirli eşyalar s. 234 | Periapt of Health — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 234 | Periapt of Proof against Poison — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 234 | Periapt of Wound Closure — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 234 | Philter of Love — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 234 | Pipes of Haunting — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 234 | Pipes of the Sewers — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 234 | Plate Armor of Etherealness — Legendary | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 234 | Portable Hole — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 235 | Potion of Animal Friendship — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 235 | Potion of Clairvoyance — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 235 | Potion of Climbing — Common | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 235 | Potion of Diminution — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 235 | Potion of Flying — Very Rare | var-test edilmiş | `data/items*.json` (use); `k19items.test.ts` |  |
| Sihirli eşyalar s. 235 | Potion of Gaseous Form — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 235 | Potion of Giant Strength (6 çeşit) — Varies | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 235 | Potion of Growth — Uncommon | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 236 | Potions of Healing (4 çeşit) — Varies | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 236 | Potion of Heroism — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 236 | Potion of Invisibility — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 236 | Potion of Invulnerability — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 236 | Potion of Longevity — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 236 | Potion of Mind Reading — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 236 | Potion of Poison — Uncommon | var-test edilmiş | `data/items*.json` (use); `te99.test.ts` |  |
| Sihirli eşyalar s. 236 | Potion of Resistance (13 çeşit) — Uncommon | var-test edilmiş | `data/items*.json` (use); `te99.test.ts` |  |
| Sihirli eşyalar s. 236 | Potion of Speed — Very Rare | var-test edilmiş | `data/items*.json` (use); `te99.test.ts` |  |
| Sihirli eşyalar s. 236 | Potion of Vitality — Very Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 236 | Potion of Water Breathing — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 237 | Quarterstaff of the Acrobat — Very Rare | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: biçim değiştirme (sırık, yay) ve Acrobatics — eşya biçim kancası yok |
| Sihirli eşyalar s. 237 | Ring of Animal Influence — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 237 | Ring of Djinni Summoning — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 237 | Ring of Elemental Command — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 238 | Ring of Evasion — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 238 | Ring of Feather Falling — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 238 | Ring of Free Action — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 238 | Ring of Invisibility — Legendary | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 238 | Ring of Jumping — Uncommon | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 238 | Ring of Mind Shielding — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 238 | Ring of Protection — Rare | var-test edilmiş | `data/items*.json` (effects); `items.test.ts`, `te99.test.ts` +4 |  |
| Sihirli eşyalar s. 238 | Ring of Regeneration — Very Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 238 | Ring of Resistance (13 çeşit) — Rare | var-test edilmiş | `data/items*.json` (passive); `k19items.test.ts` |  |
| Sihirli eşyalar s. 238 | Ring of Shooting Stars — Very Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 239 | Ring of Spell Storing — Rare | savaş dışı | `offCombat`: dolduran büyücünün büyüleri; savaşta Game Master notu (büyü listesine eklenir) |  |
| Sihirli eşyalar s. 239 | Ring of Spell Turning — Legendary | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 239 | Ring of Swimming — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 239 | Ring of Telekinesis — Very Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 239 | Ring of the Ram — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 239 | Ring of Three Wishes — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 239 | Ring of Warmth — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 239 | Ring of Water Walking — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 239 | Ring of X-ray Vision — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 240 | Robe of Eyes — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 240 | Robe of Scintillating Colors — Very Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 240 | Robe of Stars — Very Rare | var-testsiz | `data/items*.json` (spells, effects) |  |
| Sihirli eşyalar s. 240 | Robe of the Archmagi — Legendary | var-testsiz | `data/items*.json` (passive, bonus, effects) |  |
| Sihirli eşyalar s. 240 | Robe of Useful Items — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 241 | Rod of Absorption — Very Rare | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: büyüyü tepkiyle emme, yük biriktirme — eşya tepkisi yok (Counterspell yolu) |
| Sihirli eşyalar s. 241 | Rod of Alertness — Very Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 241 | Rod of Lordly Might — Legendary | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: altı düğmeli biçim değişimi (silah, merdiven, kilit) — eşya biçim kancası yok |
| Sihirli eşyalar s. 242 | Rod of Resurrection — Legendary | var-test edilmiş | `data/items*.json` (spells); `a5esya.test.ts` |  |
| Sihirli eşyalar s. 242 | Rod of Rulership — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 242 | Rod of Security — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 242 | Rope of Climbing — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 242 | Rope of Entanglement — Rare | var-testsiz | `data/items*.json` (use) |  |
| Sihirli eşyalar s. 243 | Scarab of Protection — Legendary | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 243 | Scimitar of Speed — Very Rare | var-test edilmiş | `data/items*.json` (bonus, paket); `p7.test.ts` |  |
| Sihirli eşyalar s. 243 | Sending Stones — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 243 | Sentinel Shield — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 243 | Shield, +1, +2, or +3 (3 çeşit) — Varies | var-testsiz | `data/items*.json` (effects) |  |
| Sihirli eşyalar s. 243 | Shield of Missile Attraction — Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 243 | Shield of the Cavalier — Very Rare | var-testsiz | `data/items*.json` (effects) |  |
| Sihirli eşyalar s. 244 | Slippers of Spider Climbing — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 244 | Sovereign Glue — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 244 | Spellguard Shield — Very Rare | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 244 | Spell Scroll — Varies | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: parşömen: içerdiği büyü envanter kaydında değil (eşya başına büyü seçimi gerekir) — Game Master |
| Sihirli eşyalar s. 244 | Sphere of Annihilation — Legendary | savaş dışı | `offCombat`: Game Master nesnesi (2d10 × 4 force); oyuncu envanteri değil |  |
| Sihirli eşyalar s. 245 | Staff of Charming — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 245 | Staff of Fire — Very Rare | var-testsiz | `data/items*.json` (passive, spells) |  |
| Sihirli eşyalar s. 245 | Staff of Frost — Very Rare | var-testsiz | `data/items*.json` (passive, spells) |  |
| Sihirli eşyalar s. 245 | Staff of Healing — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 245 | Staff of Power — Very Rare | var-testsiz | `data/items*.json` (bonus, spells, effects) |  |
| Sihirli eşyalar s. 246 | Staff of Striking — Very Rare | var-testsiz | `data/items*.json` (bonus, onHit) |  |
| Sihirli eşyalar s. 246 | Staff of Swarming Insects — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 246 | Staff of the Magi — Legendary | var-testsiz | `data/items*.json` (passive, bonus, spells) |  |
| Sihirli eşyalar s. 247 | Staff of the Python — Uncommon | var-test edilmiş | `data/items*.json` (paket); `p7.test.ts`, `srdD2.test.ts` |  |
| Sihirli eşyalar s. 247 | Staff of the Woodlands — Rare | var-testsiz | `data/items*.json` (bonus, spells) |  |
| Sihirli eşyalar s. 247 | Staff of Thunder and Lightning — Very Rare | var-testsiz | `data/items*.json` (bonus, spells) |  |
| Sihirli eşyalar s. 248 | Staff of Withering — Rare | var-testsiz | `data/items*.json` (onHit) |  |
| Sihirli eşyalar s. 248 | Stone of Controlling Earth Elementals — Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 248 | Stone of Good Luck (Luckstone) — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 248 | Sun Blade — Rare | var-testsiz | `data/items*.json` (passive, bonus, onHit) |  |
| Sihirli eşyalar s. 248 | Sword of Life Stealing — Rare | var-testsiz | `data/items*.json` (onHit) |  |
| Sihirli eşyalar s. 248 | Sword of Sharpness — Very Rare | var-testsiz | `data/items*.json` (onHit) |  |
| Sihirli eşyalar s. 248 | Sword of Wounding — Rare | var-testsiz | `data/items*.json` (onHit) |  |
| Sihirli eşyalar s. 248 | Talisman of Pure Good — Legendary | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: kötü uyumlu tutana hasar, uçurum açma yükü — hizalanma savaşa girmez |
| Sihirli eşyalar s. 249 | Talisman of the Sphere — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 249 | Talisman of Ultimate Evil — Legendary | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: iyi uyumlu tutana hasar, uçurum yükü — hizalanma savaşa girmez |
| Sihirli eşyalar s. 249 | Thunderous Greatclub — Very Rare | var-testsiz | `data/items*.json` (onHit, effects) |  |
| Sihirli eşyalar s. 249 | Tome of Clear Thought — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 249 | Tome of Leadership and Influence — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 250 | Tome of Understanding — Very Rare | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 250 | Trident of Fish Command — Uncommon | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 250 | Universal Solvent — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 250 | Vicious Weapon — Rare | var-testsiz | `data/items*.json` (onHit) |  |
| Sihirli eşyalar s. 250 | Vorpal Sword — Legendary | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c); `a5esya.test.ts` | savaşta uygulanmaz: doğal 20'de kafa kesme — eşya isabet kancasında ölüm yok |
| Sihirli eşyalar s. 250 | Wand of Binding — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 250 | Wand of Enemy Detection — Rare | kısmi | `data/items*.json`; ESYA-SINIFLANDIRMA (c) | savaşta uygulanmaz: 60 ft içindeki düşmanları sezme — gizlenme bilgisini eşyaya bağlama yok |
| Sihirli eşyalar s. 250 | Wand of Fear — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 250 | Wand of Fireballs — Rare | var-test edilmiş | `data/items*.json` (spells); `k19items.test.ts`, `te99.test.ts` |  |
| Sihirli eşyalar s. 251 | Wand of Lightning Bolts — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 251 | Wand of Magic Detection — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 251 | Wand of Magic Missiles — Uncommon | var-test edilmiş | `data/items*.json` (spells); `te99.test.ts` |  |
| Sihirli eşyalar s. 251 | Wand of Paralysis — Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 251 | Wand of Polymorph — Very Rare | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 251 | Wand of Secrets — Uncommon | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 251 | Wand of the War Mage, +1, +2, or +3 (3 çeşit) — Varies | var-testsiz | `data/items*.json` (bonus) |  |
| Sihirli eşyalar s. 251 | Wand of Web — Uncommon | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 251 | Wand of Wonder — Rare | var-test edilmiş | `data/items*.json` (spells); `a5esya.test.ts` |  |
| Sihirli eşyalar s. 253 | Weapon, +1, +2, or +3 (3 çeşit) — Varies | var-testsiz | `data/items*.json` (bonus) |  |
| Sihirli eşyalar s. 253 | Weapon of Warning — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 253 | Well of Many Worlds — Legendary | savaş dışı | `offCombat`: savaşta mekanik etkisi yok (hikâye, keşif, yolculuk) |  |
| Sihirli eşyalar s. 253 | Wind Fan — Uncommon | var-testsiz | `data/items*.json` (spells) |  |
| Sihirli eşyalar s. 253 | Winged Boots — Uncommon | var-testsiz | `data/items*.json` (passive) |  |
| Sihirli eşyalar s. 253 | Wings of Flying — Rare | var-testsiz | `data/items*.json` (use) |  |

## 11. Canavarlar (Monsters A–Z) (s. 254–343)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Canavarlar s. 254 | Stat Block: Size (boyut, çok altıgen) | kısmi | boyut veride; her yaratık tek altıgen, `multiHex` deneysel (varsayılan kapalı); `binekMb2.test.ts`, `binekMb4.test.ts` +7 | bilinçli sapma (E20) |
| Canavarlar s. 254 | Stat Block: Creature Type ve Descriptive Tags | var-test edilmiş | `data/canavar-turleri.json` (D1, sürüm 86); etiketler savaş dışı; `diceUnlock.test.ts`, `a2abilities.test.ts` +29 |  |
| Canavarlar s. 254 | Stat Block: Alignment | savaş dışı | canavar hizalanması savaşta kullanılmaz (Talisman lanetleri Game Master) |  |
| Canavarlar s. 254 | Stat Block: Armor Class | var-test edilmiş | `monsters.json` `ac` (SRD-VERI-DOGRULAMA doğru); `battleSave.test.ts`, `g2-smoke.test.ts` +76 |  |
| Canavarlar s. 254 | Stat Block: Initiative (+X ve skor) | kısmi | oyunda canavar inisiyatifi yalnız DEX (`src/battle/create.ts:560` `initiativeBonus: mods.dex`); SRD stat bloğundaki değer 110/330 canavarda DEX'ten farklı (ör. Adult Black Dragon +12, oyunda +2) | `monsters.json`'a SRD inisiyatif değeri ve `create.ts`'te kullanım (kural sürümüyle) |
| Canavarlar s. 255 | Stat Block: Hit Points, Speed (yürüme, uçma, yüzme, tırmanma, kazma, Hover) | var-test edilmiş | D1/D3 sonrası doğru; hızlar `monsterTraits.ts`; `binekMb1.test.ts`, `binekMb3.test.ts` +12 |  |
| Canavarlar s. 255 | Stat Block: Ability Scores, Saves, Skills | var-test edilmiş | `monsters.json` (SRD-VERI-DOGRULAMA 7078 doğru alan); `battleSave.test.ts`, `g2-smoke.test.ts` +76 |  |
| Canavarlar s. 255 | Stat Block: Resistances, Vulnerabilities, Immunities (hasar ve durum) | var-test edilmiş | `monsterTraits.ts`, durum bağışıklığı D1 (sürüm 86); `k19spells.test.ts`, `k53systems.test.ts` +6 |  |
| Canavarlar s. 255 | Stat Block: Gear (cephane, eşya donatma) | kısmi | saldırılar veride; canavar cephanesi ve eşya donatma yok | canavar envanteri |
| Canavarlar s. 256 | Stat Block: Senses (Blindsight, Darkvision, Tremorsense, Truesight, pasif Algı) | var-test edilmiş | `monsterSenses` (`create.ts`), K74 Truesight; `k19f.test.ts`, `k19tier4b.test.ts` +9 |  |
| Canavarlar s. 256 | Stat Block: Languages ve Telepathy | savaş dışı | oyunda karşılığı yok (iletişim) |  |
| Canavarlar s. 256 | Stat Block: Challenge Rating, XP, Proficiency Bonus | var-test edilmiş | CR ve XP veride; bütçe `budget.ts`; `battleSave.test.ts`, `diceOwn.test.tsx` +483 |  |
| Canavarlar s. 256 | Stat Block: Traits | kısmi | `data/canavar-ozellik.json` × `monsters.json` (`unsupported` sınıflaması, `canavar-yetenekleri.json`, `monsterTraits.ts`); savaş dışı özellikler gerekçeli | aşağıdaki canavar satırlarında "yok"lar |
| Canavarlar s. 256 | Stat Block: Actions (saldırı, save etkisi, hasar gösterimi) | var-test edilmiş | saldırılar `monsters.json` `attacks`; mekanik matris 579 saldırı / 4085 satır doğru (`MEKANIK-MATRIS.md`, sürüm 91); `ridersA2.test.ts` |  |
| Canavarlar s. 257 | Stat Block: Multiattack (bileşim, yerine geçen) | var-test edilmiş | `data/multiattack.json` (96 canavar); `classTraits.test.ts`, `economy.test.ts` +9 |  |
| Canavarlar s. 257 | Stat Block: Spellcasting (canavar büyüleri) | var-testsiz | `data/canavar-buyuleri.json` |  |
| Canavarlar s. 257 | Stat Block: Bonus Actions | var-test edilmiş | `bonusActions`, `monster_ability`; `a2abilities.test.ts`, `k19abilities.test.ts` +5 |  |
| Canavarlar s. 257 | Stat Block: Reactions | var-test edilmiş | `data/monster-reactions.json` (srdK19: hepsi); `reactions.test.ts` |  |
| Canavarlar s. 257 | Stat Block: Legendary Actions (ve "in Lair" kullanımları) | var-test edilmiş | `data/efsanevi.json` (30 canavar, `yuva`), `boss.ts`; `boss.test.ts`, `k19legendary.test.ts` +1 |  |
| Canavarlar s. 257 | Stat Block: Limited Usage (X/Day, Recharge X–Y, Recharge after a Rest) | var-test edilmiş | savaşta N kez; Recharge zarı; `areaAttack.test.ts`, `druid.test.ts` +8 |  |
| Canavarlar s. 258 | Aboleth (CR 10) | kısmi | 11 giriş: var 7, kısmi 1, yok 0, savaş dışı 3 | Dominate Mind (2/Day) (kısmi: kalıcı zihin kontrolü/telepati yok); inisiyatif SRD +7, oyunda DEX -1; savaş dışı: Amphibious, Eldritch Restoration, Probing Telepathy |
| Canavarlar s. 264 | Adult Black Dragon (CR 14) | kısmi | 9 giriş: var 8, kısmi 0, yok 0, savaş dışı 1; `k19legendary.test.ts` | inisiyatif SRD +12, oyunda DEX +2; savaş dışı: Amphibious |
| Canavarlar s. 266 | Adult Blue Dragon (CR 16) | kısmi | 8 giriş: var 8, kısmi 0, yok 0, savaş dışı 0; `k19legendary.test.ts` | inisiyatif SRD +10, oyunda DEX +0 |
| Canavarlar s. 268 | Adult Brass Dragon (CR 13) | kısmi | 9 giriş: var 9, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +10, oyunda DEX +0 |
| Canavarlar s. 270 | Adult Bronze Dragon (CR 15) | kısmi | 10 giriş: var 9, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +10, oyunda DEX +0; savaş dışı: Amphibious |
| Canavarlar s. 276 | Adult Copper Dragon (CR 14) | kısmi | 9 giriş: var 9, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +11, oyunda DEX +1 |
| Canavarlar s. 291 | Adult Gold Dragon (CR 17) | kısmi | 10 giriş: var 8, kısmi 0, yok 1, savaş dışı 1 | Weakening Breath (yok); inisiyatif SRD +14, oyunda DEX +2; savaş dışı: Amphibious |
| Canavarlar s. 294 | Adult Green Dragon (CR 15) | kısmi | 9 giriş: var 8, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +11, oyunda DEX +1; savaş dışı: Amphibious |
| Canavarlar s. 318 | Adult Red Dragon (CR 17) | kısmi | 8 giriş: var 8, kısmi 0, yok 0, savaş dışı 0; `boss.test.ts`, `dragon.test.ts` +1 | inisiyatif SRD +12, oyunda DEX +0 |
| Canavarlar s. 324 | Adult Silver Dragon (CR 16) | kısmi | 9 giriş: var 9, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +10, oyunda DEX +0 |
| Canavarlar s. 340 | Adult White Dragon (CR 13) | kısmi | 8 giriş: var 8, kısmi 0, yok 0, savaş dışı 0; `srdD1.test.ts` | inisiyatif SRD +10, oyunda DEX +0 |
| Canavarlar s. 258 | Air Elemental (CR 5) | var-testsiz | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 265 | Ancient Black Dragon (CR 21) | kısmi | 9 giriş: var 8, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +16, oyunda DEX +2; savaş dışı: Amphibious |
| Canavarlar s. 267 | Ancient Blue Dragon (CR 23) | kısmi | 8 giriş: var 8, kısmi 0, yok 0, savaş dışı 0; `areaAttack.test.ts` | inisiyatif SRD +14, oyunda DEX +0 |
| Canavarlar s. 269 | Ancient Brass Dragon (CR 20) | kısmi | 9 giriş: var 9, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +12, oyunda DEX +0 |
| Canavarlar s. 271 | Ancient Bronze Dragon (CR 22) | kısmi | 10 giriş: var 9, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +14, oyunda DEX +0; savaş dışı: Amphibious |
| Canavarlar s. 277 | Ancient Copper Dragon (CR 21) | kısmi | 9 giriş: var 9, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +15, oyunda DEX +1 |
| Canavarlar s. 292 | Ancient Gold Dragon (CR 24) | kısmi | 10 giriş: var 8, kısmi 0, yok 1, savaş dışı 1 | Weakening Breath (yok); inisiyatif SRD +16, oyunda DEX +2; savaş dışı: Amphibious |
| Canavarlar s. 294 | Ancient Green Dragon (CR 22) | kısmi | 9 giriş: var 8, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +15, oyunda DEX +1; savaş dışı: Amphibious |
| Canavarlar s. 319 | Ancient Red Dragon (CR 24) | kısmi | 8 giriş: var 8, kısmi 0, yok 0, savaş dışı 0; `boss.test.ts`, `dragon.test.ts` +1 | inisiyatif SRD +14, oyunda DEX +0 |
| Canavarlar s. 325 | Ancient Silver Dragon (CR 23) | kısmi | 9 giriş: var 9, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +14, oyunda DEX +0 |
| Canavarlar s. 341 | Ancient White Dragon (CR 20) | kısmi | 8 giriş: var 8, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +12, oyunda DEX +0 |
| Canavarlar s. 259 | Animated Armor (CR 1) | kısmi | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +2, oyunda DEX +0 |
| Canavarlar s. 259 | Animated Flying Sword (CR 1/4) | kısmi | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +4, oyunda DEX +2 |
| Canavarlar s. 259 | Animated Rug of Smothering (CR 2) | kısmi | 1 giriş: var 0, kısmi 1, yok 0, savaş dışı 0 | Smother (kısmi: hasar yerine yakalama seçimi, boğulma yok); inisiyatif SRD +4, oyunda DEX +2 |
| Canavarlar s. 259 | Ankheg (CR 2) | var-testsiz | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 305 | Archmage (CR 12) | kısmi | 6 giriş: var 6, kısmi 0, yok 0, savaş dışı 0; `k19items.test.ts`, `shape91.test.ts` +1 | inisiyatif SRD +7, oyunda DEX +2 |
| Canavarlar s. 260 | Assassin (CR 8) | kısmi | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `grapple.test.ts` | inisiyatif SRD +10, oyunda DEX +4 |
| Canavarlar s. 260 | Awakened Shrub (CR 0) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 260 | Awakened Tree (CR 2) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 260 | Axe Beak (CR 1/4) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 261 | Azer Sentinel (CR 2) | var-testsiz | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 261 | Balor (CR 19) | kısmi | 8 giriş: var 8, kısmi 0, yok 0, savaş dışı 0; `ridersA2.test.ts` | inisiyatif SRD +14, oyunda DEX +2 |
| Canavarlar s. 261 | Bandit (CR 1/8) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `evaluate.test.ts`, `k59ai.test.ts` +10 |  |
| Canavarlar s. 261 | Bandit Captain (CR 2) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `k19legendary.test.ts`, `srdD1.test.ts` +6 |  |
| Canavarlar s. 262 | Barbed Devil (CR 5) | kısmi | 7 giriş: var 5, kısmi 1, yok 0, savaş dışı 1; `wildShape87.test.ts`, `ws87Regresyon.test.ts` | Hurl Flame (kısmi: yanıcı nesne hedeflenmez); savaş dışı: Diabolical Restoration |
| Canavarlar s. 262 | Basilisk (CR 3) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 262 | Bearded Devil (CR 3) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `grapple.test.ts` |  |
| Canavarlar s. 263 | Behir (CR 11) | var-test edilmiş | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts` |  |
| Canavarlar s. 263 | Berserker (CR 2) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `forest.test.ts` |  |
| Canavarlar s. 263 | Black Dragon Wyrmling (CR 2) | kısmi | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +4, oyunda DEX +2; savaş dışı: Amphibious |
| Canavarlar s. 265 | Black Pudding (CR 4) | var-test edilmiş | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1; `k19vision.test.ts` | savaş dışı: Amorphous |
| Canavarlar s. 266 | Blink Dog (CR 1/4) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 266 | Blue Dragon Wyrmling (CR 3) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +2, oyunda DEX +0 |
| Canavarlar s. 267 | Bone Devil (CR 9) | kısmi | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +7, oyunda DEX +3; savaş dışı: Diabolical Restoration |
| Canavarlar s. 268 | Brass Dragon Wyrmling (CR 1) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `ridersA2.test.ts` | inisiyatif SRD +2, oyunda DEX +0 |
| Canavarlar s. 269 | Bronze Dragon Wyrmling (CR 2) | kısmi | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +2, oyunda DEX +0; savaş dışı: Amphibious |
| Canavarlar s. 271 | Bugbear Stalker (CR 3) | var-test edilmiş | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `matrisRegresyon.test.ts`, `readyRegresyon.test.ts` |  |
| Canavarlar s. 272 | Bugbear Warrior (CR 1) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `grapple.test.ts`, `app.test.ts` +2 |  |
| Canavarlar s. 272 | Bulette (CR 5) | var-testsiz | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 272 | Centaur Trooper (CR 2) | var-testsiz | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 272 | Chain Devil (CR 8) | kısmi | 6 giriş: var 5, kısmi 0, yok 0, savaş dışı 1; `reactions.test.ts` | inisiyatif SRD +5, oyunda DEX +2; savaş dışı: Diabolical Restoration |
| Canavarlar s. 273 | Chimera (CR 6) | var-testsiz | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 273 | Chuul (CR 4) | var-test edilmiş | 5 giriş: var 3, kısmi 0, yok 0, savaş dışı 2; `k73f.test.ts`, `te99.test.ts` | savaş dışı: Amphibious, Sense Magic |
| Canavarlar s. 274 | Clay Golem (CR 9) | kısmi | 7 giriş: var 7, kısmi 0, yok 0, savaş dışı 0; `srdD1.test.ts` | inisiyatif SRD +3, oyunda DEX -1 |
| Canavarlar s. 274 | Cloaker (CR 8) | kısmi | 6 giriş: var 5, kısmi 1, yok 0, savaş dışı 0 | Attach (kısmi: yapışma (attach) yok); inisiyatif SRD +5, oyunda DEX +2 |
| Canavarlar s. 275 | Cloud Giant (CR 9) | kısmi | 5 giriş: var 4, kısmi 0, yok 1, savaş dışı 0 | Misty Step (yok); inisiyatif SRD +4, oyunda DEX +0 |
| Canavarlar s. 275 | Cockatrice (CR 1/2) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `srdD1.test.ts`, `twostage.test.ts` |  |
| Canavarlar s. 275 | Commoner (CR 0) | var-test edilmiş | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1; `monsterEnv.test.ts` | savaş dışı: Training |
| Canavarlar s. 275 | Copper Dragon Wyrmling (CR 1) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `ridersA2.test.ts` | inisiyatif SRD +3, oyunda DEX +1 |
| Canavarlar s. 277 | Couatl (CR 4) | var-test edilmiş | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1; `diceUnlock.test.ts`, `grapple.test.ts` | savaş dışı: Shielded Mind |
| Canavarlar s. 278 | Cultist (CR 1/8) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `ridersA2.test.ts` |  |
| Canavarlar s. 278 | Cultist Fanatic (CR 2) | var-testsiz | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 278 | Darkmantle (CR 1/2) | kısmi | 2 giriş: var 1, kısmi 1, yok 0, savaş dışı 0 | Crush (kısmi: yapışma (attach) yok); inisiyatif SRD +3, oyunda DEX +1 |
| Canavarlar s. 279 | Death Dog (CR 1) | kısmi | 2 giriş: var 1, kısmi 1, yok 0, savaş dışı 0; `srdD1.test.ts`, `wildShape87.test.ts` +5 | Bite (kısmi: HP maksimumu/24 saat save savaş dışı) |
| Canavarlar s. 279 | Deva (CR 10) | var-testsiz | 6 giriş: var 5, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Exalted Restoration |
| Canavarlar s. 280 | Djinni (CR 11) | kısmi | 8 giriş: var 5, kısmi 1, yok 0, savaş dışı 2; `ridersA2.test.ts` | Create Whirlwind (kısmi: hedef kasırgayla taşınmaz); savaş dışı: Elemental Restoration, Wishes |
| Canavarlar s. 280 | Doppelganger (CR 3) | var-testsiz | 5 giriş: var 3, kısmi 0, yok 0, savaş dışı 2 | savaş dışı: Read Thoughts, Shape-Shift |
| Canavarlar s. 281 | Dragon Turtle (CR 17) | kısmi | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1; `srdD1.test.ts` | inisiyatif SRD +6, oyunda DEX +0; savaş dışı: Amphibious |
| Canavarlar s. 281 | Dretch (CR 1/4) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 281 | Drider (CR 6) | var-testsiz | 7 giriş: var 7, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 282 | Druid (CR 2) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `diceUnlock.test.ts`, `b1spells.test.ts` +38 |  |
| Canavarlar s. 282 | Dryad (CR 1) | var-test edilmiş | 7 giriş: var 6, kısmi 0, yok 0, savaş dışı 1; `a2abilities.test.ts` | savaş dışı: Speak with Beasts and Plants |
| Canavarlar s. 307 | Dust Mephit (CR 1/2) | var-testsiz | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 282 | Earth Elemental (CR 5) | var-testsiz | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 283 | Efreeti (CR 11) | var-test edilmiş | 7 giriş: var 5, kısmi 0, yok 0, savaş dışı 2; `srdD1.test.ts` | savaş dışı: Elemental Restoration, Wishes |
| Canavarlar s. 283 | Erinyes (CR 12) | kısmi | 7 giriş: var 4, kısmi 1, yok 0, savaş dışı 2 | Entangling Rope (Requires Magic Rope) (kısmi: ipin AC/HP'si, bonus eylemle bırakma yok); inisiyatif SRD +7, oyunda DEX +3; savaş dışı: Diabolical Restoration, Magic Rope |
| Canavarlar s. 284 | Ettercap (CR 2) | var-test edilmiş | 7 giriş: var 7, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts` |  |
| Canavarlar s. 284 | Ettin (CR 4) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `ridersA2.test.ts` |  |
| Canavarlar s. 284 | Fire Elemental (CR 5) | var-test edilmiş | 6 giriş: var 6, kısmi 0, yok 0, savaş dışı 0; `ws92c.test.ts` |  |
| Canavarlar s. 285 | Fire Giant (CR 9) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +3, oyunda DEX -1 |
| Canavarlar s. 285 | Flesh Golem (CR 5) | var-test edilmiş | 7 giriş: var 7, kısmi 0, yok 0, savaş dışı 0; `k19abilities.test.ts` |  |
| Canavarlar s. 285 | Frost Giant (CR 8) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +2, oyunda DEX -1 |
| Canavarlar s. 286 | Gargoyle (CR 2) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +2, oyunda DEX +0 |
| Canavarlar s. 286 | Gelatinous Cube (CR 2) | kısmi | 4 giriş: var 2, kısmi 1, yok 0, savaş dışı 1; `ridersA2.test.ts` | Engulf (kısmi: boğulma, sözlü büyü yasağı, küple taşınma yok); savaş dışı: Ooze Cube |
| Canavarlar s. 287 | Ghast (CR 2) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `k19items.test.ts` |  |
| Canavarlar s. 287 | Ghost (CR 4) | var-test edilmiş | 7 giriş: var 6, kısmi 0, yok 0, savaş dışı 1; `k64.test.ts`, `k64b.test.ts` +1 | savaş dışı: Ethereal Sight |
| Canavarlar s. 288 | Ghoul (CR 1) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `durations.test.ts`, `riders.test.ts` +1 |  |
| Canavarlar s. 288 | Gibbering Mouther (CR 2) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `diceUnlock.test.ts`, `areaAttack.test.ts` +2 |  |
| Canavarlar s. 289 | Glabrezu (CR 9) | kısmi | 6 giriş: var 5, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +6, oyunda DEX +2; savaş dışı: Demonic Restoration |
| Canavarlar s. 289 | Gladiator (CR 5) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +5, oyunda DEX +2 |
| Canavarlar s. 289 | Gnoll Warrior (CR 1/2) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts`, `matrisRegresyon.test.ts` +6 |  |
| Canavarlar s. 290 | Goblin Boss (CR 1) | var-test edilmiş | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `k19reactions.test.ts`, `reactions.test.ts` |  |
| Canavarlar s. 290 | Goblin Minion (CR 1/8) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `shape91Regresyon.test.ts`, `srdD1Regresyon.test.ts` +1 |  |
| Canavarlar s. 290 | Goblin Warrior (CR 1/4) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `diceUnlock.test.ts`, `ai.test.ts` +20 |  |
| Canavarlar s. 290 | Gold Dragon Wyrmling (CR 3) | kısmi | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1; `ridersA2.test.ts` | inisiyatif SRD +4, oyunda DEX +2; savaş dışı: Amphibious |
| Canavarlar s. 292 | Gorgon (CR 5) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts`, `ridersA2.test.ts` |  |
| Canavarlar s. 293 | Gray Ooze (CR 1/2) | var-test edilmiş | 3 giriş: var 2, kısmi 0, yok 0, savaş dışı 1; `ridersA2.test.ts`, `shape91Regresyon.test.ts` +2 | savaş dışı: Amorphous |
| Canavarlar s. 293 | Green Dragon Wyrmling (CR 2) | kısmi | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +3, oyunda DEX +1; savaş dışı: Amphibious |
| Canavarlar s. 295 | Green Hag (CR 3) | var-test edilmiş | 6 giriş: var 3, kısmi 0, yok 0, savaş dışı 3; `k73f.test.ts`, `wilds.test.ts` | savaş dışı: Amphibious, Coven Magic, Mimicry |
| Canavarlar s. 295 | Grick (CR 2) | var-testsiz | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 295 | Griffon (CR 2) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `monsterEnv.test.ts` |  |
| Canavarlar s. 296 | Grimlock (CR 1/4) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 296 | Guard (CR 1/8) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 296 | Guard Captain (CR 4) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +4, oyunda DEX +2 |
| Canavarlar s. 296 | Guardian Naga (CR 10) | var-testsiz | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Celestial Restoration |
| Canavarlar s. 297 | Half-Dragon (CR 5) | kısmi | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +5, oyunda DEX +2; savaş dışı: Draconic Origin |
| Canavarlar s. 297 | Harpy (CR 1) | kısmi | 2 giriş: var 1, kısmi 1, yok 0, savaş dışı 0 | Luring Song (kısmi: harpiye yürüme ve şarkı bitişi yok) |
| Canavarlar s. 297 | Hell Hound (CR 3) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `monsterEnv.test.ts` |  |
| Canavarlar s. 298 | Hezrou (CR 8) | kısmi | 6 giriş: var 5, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +6, oyunda DEX +3; savaş dışı: Demonic Restoration |
| Canavarlar s. 298 | Hill Giant (CR 5) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `forced.test.ts`, `mastery.test.ts` +3 | inisiyatif SRD +2, oyunda DEX -1 |
| Canavarlar s. 298 | Hippogriff (CR 1) | var-testsiz | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 299 | Hobgoblin Captain (CR 3) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `matrisRegresyon.test.ts`, `readyRegresyon.test.ts` +3 | inisiyatif SRD +4, oyunda DEX +2 |
| Canavarlar s. 298 | Hobgoblin Warrior (CR 1/2) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `data.test.ts`, `matrisRegresyon.test.ts` +1 | inisiyatif SRD +3, oyunda DEX +1 |
| Canavarlar s. 299 | Homunculus (CR 0) | var-testsiz | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Telepathic Bond |
| Canavarlar s. 299 | Horned Devil (CR 11) | kısmi | 6 giriş: var 4, kısmi 1, yok 0, savaş dışı 1 | Hurl Flame (kısmi: yanıcı nesne hedeflenmez); inisiyatif SRD +7, oyunda DEX +3; savaş dışı: Diabolical Restoration |
| Canavarlar s. 300 | Hydra (CR 8) | kısmi | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1; `k19abilities.test.ts`, `k73f.test.ts` +1 | inisiyatif SRD +4, oyunda DEX +1; savaş dışı: Hold Breath |
| Canavarlar s. 300 | Ice Devil (CR 14) | kısmi | 6 giriş: var 4, kısmi 1, yok 0, savaş dışı 1 | Ice Spear (kısmi: 'hareket ya da eylem, ikisi değil' kısıtı yok); inisiyatif SRD +7, oyunda DEX +2; savaş dışı: Diabolical Restoration |
| Canavarlar s. 307 | Ice Mephit (CR 1/2) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `srdD1.test.ts` |  |
| Canavarlar s. 300 | Imp (CR 1) | var-testsiz | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Shape-Shift |
| Canavarlar s. 301 | Incubus (CR 4) | kısmi | 5 giriş: var 3, kısmi 1, yok 0, savaş dışı 1 | Restless Touch (kısmi: ek etki savaş dışı); savaş dışı: Succubus Form |
| Canavarlar s. 301 | Invisible Stalker (CR 6) | kısmi | 5 giriş: var 4, kısmi 1, yok 0, savaş dışı 0 | Vortex (kısmi: sözlü büyü yasağı yok); inisiyatif SRD +7, oyunda DEX +4 |
| Canavarlar s. 302 | Iron Golem (CR 16) | kısmi | 7 giriş: var 7, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +9, oyunda DEX -1 |
| Canavarlar s. 302 | Knight (CR 3) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `k19reactions.test.ts`, `reactions.test.ts` |  |
| Canavarlar s. 302 | Kobold Warrior (CR 1/8) | var-testsiz | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 303 | Kraken (CR 23) | kısmi | 10 giriş: var 9, kısmi 0, yok 0, savaş dışı 1; `k73f.test.ts`, `roam.test.ts` | inisiyatif SRD +14, oyunda DEX +0; savaş dışı: Amphibious |
| Canavarlar s. 303 | Lamia (CR 4) | var-testsiz | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 304 | Lemure (CR 0) | var-testsiz | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Hellish Restoration |
| Canavarlar s. 304 | Lich (CR 21) | kısmi | 10 giriş: var 9, kısmi 0, yok 0, savaş dışı 1; `diceUnlock.test.ts`, `k19legendary.test.ts` | inisiyatif SRD +17, oyunda DEX +3; savaş dışı: Spirit Jar |
| Canavarlar s. 305 | Mage (CR 6) | var-test edilmiş | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `k19items.test.ts`, `reactions.test.ts` |  |
| Canavarlar s. 307 | Magma Mephit (CR 1/2) | var-testsiz | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 305 | Magmin (CR 1/2) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `ridersA2.test.ts` |  |
| Canavarlar s. 306 | Manticore (CR 3) | var-testsiz | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 306 | Marilith (CR 16) | kısmi | 8 giriş: var 7, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +10, oyunda DEX +5; savaş dışı: Demonic Restoration |
| Canavarlar s. 306 | Medusa (CR 6) | kısmi | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `k19abilities.test.ts`, `wildShape87.test.ts` | inisiyatif SRD +6, oyunda DEX +3 |
| Canavarlar s. 308 | Merfolk Skirmisher (CR 1/8) | var-test edilmiş | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1; `k73f.test.ts` | savaş dışı: Amphibious |
| Canavarlar s. 308 | Merrow (CR 2) | var-test edilmiş | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1; `durations.test.ts`, `ridersA2.test.ts` +1 | savaş dışı: Amphibious |
| Canavarlar s. 308 | Mimic (CR 2) | kısmi | 4 giriş: var 2, kısmi 0, yok 0, savaş dışı 2 | inisiyatif SRD +3, oyunda DEX +1; savaş dışı: Adhesive (Object Form Only), Shape-Shift |
| Canavarlar s. 326 | Minotaur Skeleton (CR 2) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 309 | Minotaur of Baphomet (CR 3) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `data.test.ts` |  |
| Canavarlar s. 309 | Mummy (CR 3) | kısmi | 3 giriş: var 2, kısmi 1, yok 0, savaş dışı 0; `ridersA2.test.ts` | Rotting Fist (kısmi: 24 saat HP maks. azalması savaş dışı) |
| Canavarlar s. 309 | Mummy Lord (CR 15) | kısmi | 12 giriş: var 10, kısmi 1, yok 0, savaş dışı 1; `k19reactions.test.ts`, `k19vision.test.ts` | Rotting Fist (kısmi: HP maks. azalması, uzun dinlenme yasağı savaş dışı); inisiyatif SRD +10, oyunda DEX +0; savaş dışı: Undead Restoration |
| Canavarlar s. 310 | Nalfeshnee (CR 13) | kısmi | 7 giriş: var 6, kısmi 0, yok 0, savaş dışı 1; `k19reactions.test.ts` | inisiyatif SRD +5, oyunda DEX +0; savaş dışı: Demonic Restoration |
| Canavarlar s. 311 | Night Hag (CR 5) | kısmi | 8 giriş: var 4, kısmi 0, yok 0, savaş dışı 4; `srdD1.test.ts` | inisiyatif SRD +5, oyunda DEX +2; savaş dışı: Coven Magic, Soul Bag, Nightmare Haunting (1/Day; Requires Soul Bag), Shape-Shift |
| Canavarlar s. 311 | Nightmare (CR 3) | var-testsiz | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Confer Fire Resistance |
| Canavarlar s. 312 | Noble (CR 1/8) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 312 | Ochre Jelly (CR 2) | var-test edilmiş | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1; `k19abilities.test.ts`, `reactions.test.ts` | savaş dışı: Amorphous |
| Canavarlar s. 312 | Ogre (CR 2) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `evaluate.test.ts`, `durations.test.ts` +20 |  |
| Canavarlar s. 312 | Oni (CR 7) | var-testsiz | 7 giriş: var 6, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Shape-Shift |
| Canavarlar s. 313 | Otyugh (CR 5) | kısmi | 4 giriş: var 3, kısmi 1, yok 0, savaş dışı 0 | Bite (kısmi: ek etki savaş dışı) |
| Canavarlar s. 313 | Owlbear (CR 3) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `k59ai.test.ts`, `data.test.ts` +6 |  |
| Canavarlar s. 313 | Pegasus (CR 2) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 313 | Phase Spider (CR 3) | var-test edilmiş | 6 giriş: var 5, kısmi 0, yok 0, savaş dışı 1; `ridersA2.test.ts` | savaş dışı: Ethereal Sight |
| Canavarlar s. 314 | Pirate (CR 1) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `monsterEnv.test.ts` | inisiyatif SRD +5, oyunda DEX +3 |
| Canavarlar s. 314 | Pirate Captain (CR 6) | kısmi | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `reactions.test.ts`, `ridersA2.test.ts` | inisiyatif SRD +7, oyunda DEX +4 |
| Canavarlar s. 314 | Pit Fiend (CR 20) | kısmi | 9 giriş: var 8, kısmi 0, yok 0, savaş dışı 1; `a2abilities.test.ts` | inisiyatif SRD +14, oyunda DEX +2; savaş dışı: Diabolical Restoration |
| Canavarlar s. 315 | Planetar (CR 16) | kısmi | 8 giriş: var 6, kısmi 0, yok 0, savaş dışı 2 | inisiyatif SRD +10, oyunda DEX +5; savaş dışı: Divine Awareness, Exalted Restoration |
| Canavarlar s. 316 | Priest (CR 2) | var-testsiz | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 316 | Priest Acolyte (CR 1/4) | var-testsiz | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 316 | Pseudodragon (CR 1/4) | var-testsiz | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 316 | Purple Worm (CR 15) | kısmi | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts`, `srdD1.test.ts` | inisiyatif SRD +3, oyunda DEX -2 |
| Canavarlar s. 317 | Quasit (CR 1) | var-testsiz | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Shape-Shift |
| Canavarlar s. 317 | Rakshasa (CR 13) | kısmi | 6 giriş: var 4, kısmi 1, yok 0, savaş dışı 1; `areaAttack.test.ts` | Cursed Touch (kısmi: ek etki savaş dışı); inisiyatif SRD +8, oyunda DEX +3; savaş dışı: Fiendish Restoration |
| Canavarlar s. 318 | Red Dragon Wyrmling (CR 4) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `dragon.test.ts`, `sefer.test.ts` +1 | inisiyatif SRD +2, oyunda DEX +0 |
| Canavarlar s. 319 | Remorhaz (CR 11) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts`, `srdD1.test.ts` | inisiyatif SRD +5, oyunda DEX +1 |
| Canavarlar s. 320 | Roc (CR 11) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts` | inisiyatif SRD +8, oyunda DEX +0 |
| Canavarlar s. 320 | Roper (CR 5) | kısmi | 5 giriş: var 4, kısmi 1, yok 0, savaş dışı 0; `a2abilities.test.ts`, `ridersA2.test.ts` | Tentacle (kısmi: dokunaç AC/HP yok); inisiyatif SRD +5, oyunda DEX -1 |
| Canavarlar s. 320 | Rust Monster (CR 1/2) | var-test edilmiş | 6 giriş: var 4, kısmi 0, yok 0, savaş dışı 2; `k19reactions.test.ts`, `matris83.test.ts` | savaş dışı: Iron Scent, Destroy Metal |
| Canavarlar s. 321 | Sahuagin Warrior (CR 1/2) | var-test edilmiş | 6 giriş: var 4, kısmi 0, yok 0, savaş dışı 2; `a2abilities.test.ts` | savaş dışı: Limited Amphibiousness, Shark Telepathy |
| Canavarlar s. 321 | Salamander (CR 5) | var-testsiz | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 321 | Satyr (CR 1/2) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `ridersA2.test.ts` |  |
| Canavarlar s. 322 | Scout (CR 1/2) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `k59ai.test.ts` |  |
| Canavarlar s. 322 | Sea Hag (CR 2) | var-test edilmiş | 6 giriş: var 3, kısmi 0, yok 0, savaş dışı 3; `ridersA2.test.ts` | savaş dışı: Amphibious, Coven Magic, Illusory Appearance |
| Canavarlar s. 322 | Shadow (CR 1/2) | var-test edilmiş | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1; `diceUnlock.test.ts`, `a2abilities.test.ts` +2 | savaş dışı: Amorphous |
| Canavarlar s. 323 | Shambling Mound (CR 5) | kısmi | 4 giriş: var 3, kısmi 1, yok 0, savaş dışı 0 | Engulf (kısmi: yığınla birlikte taşınma yok) |
| Canavarlar s. 323 | Shield Guardian (CR 7) | var-test edilmiş | 6 giriş: var 4, kısmi 0, yok 0, savaş dışı 2; `k19reactions.test.ts` | savaş dışı: Bound, Spell Storing |
| Canavarlar s. 286 | Shrieker Fungus (CR 0) | var-testsiz | 1 giriş: var 0, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Shriek |
| Canavarlar s. 324 | Silver Dragon Wyrmling (CR 2) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `ridersA2.test.ts` | inisiyatif SRD +2, oyunda DEX +0 |
| Canavarlar s. 325 | Skeleton (CR 1/4) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `a6spells.test.ts`, `b2.test.ts` +4 |  |
| Canavarlar s. 326 | Solar (CR 21) | kısmi | 11 giriş: var 9, kısmi 0, yok 0, savaş dışı 2 | inisiyatif SRD +20, oyunda DEX +6; savaş dışı: Divine Awareness, Exalted Restoration |
| Canavarlar s. 327 | Specter (CR 1) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts`, `srdD1.test.ts` +1 |  |
| Canavarlar s. 327 | Sphinx of Lore (CR 11) | kısmi | 8 giriş: var 6, kısmi 0, yok 1, savaş dışı 1 | Weight of Years (yok); inisiyatif SRD +10, oyunda DEX +2; savaş dışı: Inscrutable |
| Canavarlar s. 328 | Sphinx of Valor (CR 17) | kısmi | 8 giriş: var 6, kısmi 0, yok 1, savaş dışı 1 | Weight of Years (yok); inisiyatif SRD +12, oyunda DEX +0; savaş dışı: Inscrutable |
| Canavarlar s. 327 | Sphinx of Wonder (CR 1) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `k19reactions.test.ts` |  |
| Canavarlar s. 329 | Spirit Naga (CR 8) | var-testsiz | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Fiendish Restoration |
| Canavarlar s. 329 | Sprite (CR 1/4) | kısmi | 4 giriş: var 3, kısmi 1, yok 0, savaş dışı 0; `as1cGorunum.test.tsx` | Heart Sight (kısmi: ek etki savaş dışı) |
| Canavarlar s. 329 | Spy (CR 1) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +4, oyunda DEX +2 |
| Canavarlar s. 308 | Steam Mephit (CR 1/4) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `k19abilities.test.ts` |  |
| Canavarlar s. 329 | Stirge (CR 1/8) | kısmi | 1 giriş: var 0, kısmi 1, yok 0, savaş dışı 0 | Proboscis (kısmi: yapışma (attach) yok) |
| Canavarlar s. 330 | Stone Giant (CR 7) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `k19reactions.test.ts`, `reactions.test.ts` +1 | inisiyatif SRD +5, oyunda DEX +2 |
| Canavarlar s. 330 | Stone Golem (CR 10) | kısmi | 6 giriş: var 6, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +3, oyunda DEX -1 |
| Canavarlar s. 330 | Storm Giant (CR 13) | kısmi | 6 giriş: var 5, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +7, oyunda DEX +2; savaş dışı: Amphibious |
| Canavarlar s. 331 | Succubus (CR 4) | var-testsiz | 6 giriş: var 4, kısmi 0, yok 0, savaş dışı 2 | savaş dışı: Incubus Form, Shape-Shift |
| Canavarlar s. 278 | Swarm of Crawling Claws (CR 3) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `monsterEnv.test.ts` |  |
| Canavarlar s. 331 | Tarrasque (CR 30) | kısmi | 12 giriş: var 12, kısmi 0, yok 0, savaş dışı 0; `diceUnlock.test.ts`, `a2abilities.test.ts` | inisiyatif SRD +18, oyunda DEX +0 |
| Canavarlar s. 332 | Tough (CR 1/2) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `forest.test.ts`, `data.test.ts` |  |
| Canavarlar s. 332 | Tough Boss (CR 4) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `srdD2Regresyon.test.ts` |  |
| Canavarlar s. 333 | Treant (CR 9) | kısmi | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts` | inisiyatif SRD +3, oyunda DEX -1 |
| Canavarlar s. 333 | Troll (CR 5) | var-test edilmiş | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `ai.test.ts`, `battle.test.ts` +10 |  |
| Canavarlar s. 333 | Troll Limb (CR 1/2) | var-test edilmiş | 3 giriş: var 2, kısmi 0, yok 0, savaş dışı 1; `monsterEnv.test.ts`, `encounter.test.ts` | savaş dışı: Troll Spawn |
| Canavarlar s. 334 | Unicorn (CR 5) | kısmi | 9 giriş: var 9, kısmi 0, yok 0, savaş dışı 0; `k19legendary.test.ts` | inisiyatif SRD +8, oyunda DEX +2 |
| Canavarlar s. 335 | Vampire (CR 13) | kısmi | 11 giriş: var 9, kısmi 1, yok 0, savaş dışı 1; `diceUnlock.test.ts`, `srdD3.test.ts` | Bite (Bat or Vampire Form Only) (kısmi: ek etki savaş dışı); inisiyatif SRD +14, oyunda DEX +4; savaş dışı: Shape-Shift |
| Canavarlar s. 334 | Vampire Familiar (CR 3) | kısmi | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1; `srdD3.test.ts` | inisiyatif SRD +5, oyunda DEX +3; savaş dışı: Vampiric Connection |
| Canavarlar s. 334 | Vampire Spawn (CR 5) | var-testsiz | 6 giriş: var 6, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 286 | Violet Fungus (CR 1/4) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 336 | Vrock (CR 6) | var-testsiz | 6 giriş: var 5, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Demonic Restoration |
| Canavarlar s. 326 | Warhorse Skeleton (CR 1/2) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 336 | Warrior Infantry (CR 1/8) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 337 | Warrior Veteran (CR 3) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `matrisRegresyon.test.ts`, `readyRegresyon.test.ts` | inisiyatif SRD +3, oyunda DEX +1 |
| Canavarlar s. 337 | Water Elemental (CR 5) | kısmi | 5 giriş: var 4, kısmi 1, yok 0, savaş dışı 0 | Whelm (Recharge 4–6) (kısmi: boğulma yok) |
| Canavarlar s. 337 | Werebear (CR 5) | kısmi | 5 giriş: var 3, kısmi 1, yok 0, savaş dışı 1 | Bite (Bear or Hybrid Form Only) (kısmi: likantrop laneti yok); inisiyatif SRD +3, oyunda DEX +0; savaş dışı: Shape-Shift |
| Canavarlar s. 338 | Wereboar (CR 4) | kısmi | 5 giriş: var 3, kısmi 1, yok 0, savaş dışı 1 | Gore (Boar or Hybrid Form Only) (kısmi: likantrop laneti yok); inisiyatif SRD +2, oyunda DEX +0; savaş dışı: Shape-Shift |
| Canavarlar s. 338 | Wererat (CR 2) | kısmi | 5 giriş: var 3, kısmi 1, yok 0, savaş dışı 1; `riders.test.ts` | Bite (Rat or Hybrid Form Only) (kısmi: likantrop laneti yok); savaş dışı: Shape-Shift |
| Canavarlar s. 339 | Weretiger (CR 4) | kısmi | 6 giriş: var 4, kısmi 1, yok 0, savaş dışı 1 | Bite (Tiger or Hybrid Form Only) (kısmi: likantrop laneti yok); savaş dışı: Shape-Shift |
| Canavarlar s. 339 | Werewolf (CR 3) | kısmi | 6 giriş: var 4, kısmi 1, yok 0, savaş dışı 1 | Bite (Wolf or Hybrid Form Only) (kısmi: likantrop laneti yok); inisiyatif SRD +4, oyunda DEX +2; savaş dışı: Shape-Shift |
| Canavarlar s. 339 | White Dragon Wyrmling (CR 2) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +2, oyunda DEX +0 |
| Canavarlar s. 341 | Wight (CR 3) | kısmi | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `k19drain.test.ts`, `srdD1.test.ts` | inisiyatif SRD +4, oyunda DEX +2 |
| Canavarlar s. 341 | Will-o’-Wisp (CR 2) | var-test edilmiş | 6 giriş: var 5, kısmi 0, yok 0, savaş dışı 1; `a2abilities.test.ts`, `k19abilities.test.ts` | savaş dışı: Ephemeral |
| Canavarlar s. 342 | Winter Wolf (CR 3) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `monsterEnv.test.ts` |  |
| Canavarlar s. 342 | Worg (CR 1/2) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Canavarlar s. 342 | Wraith (CR 5) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts`, `srdD1.test.ts` +1 |  |
| Canavarlar s. 343 | Wyvern (CR 6) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `durations.test.ts`, `monsters.test.ts` +3 |  |
| Canavarlar s. 343 | Xorn (CR 5) | var-testsiz | 6 giriş: var 5, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Treasure Sense |
| Canavarlar s. 264 | Young Black Dragon (CR 7) | kısmi | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +5, oyunda DEX +2; savaş dışı: Amphibious |
| Canavarlar s. 266 | Young Blue Dragon (CR 9) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `k19smoke.test.ts` | inisiyatif SRD +4, oyunda DEX +0 |
| Canavarlar s. 268 | Young Brass Dragon (CR 6) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +3, oyunda DEX +0 |
| Canavarlar s. 270 | Young Bronze Dragon (CR 8) | kısmi | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +3, oyunda DEX +0; savaş dışı: Amphibious |
| Canavarlar s. 276 | Young Copper Dragon (CR 7) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +4, oyunda DEX +1 |
| Canavarlar s. 291 | Young Gold Dragon (CR 10) | kısmi | 5 giriş: var 4, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +6, oyunda DEX +2; savaş dışı: Amphibious |
| Canavarlar s. 293 | Young Green Dragon (CR 8) | kısmi | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1 | inisiyatif SRD +4, oyunda DEX +1; savaş dışı: Amphibious |
| Canavarlar s. 318 | Young Red Dragon (CR 10) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `diceUnlock.test.ts`, `areaAttack.test.ts` +8 | inisiyatif SRD +4, oyunda DEX +0 |
| Canavarlar s. 324 | Young Silver Dragon (CR 9) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +4, oyunda DEX +0 |
| Canavarlar s. 340 | Young White Dragon (CR 6) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `k19abilities.test.ts`, `srdD1.test.ts` +1 | inisiyatif SRD +3, oyunda DEX +0 |
| Canavarlar s. 343 | Zombie (CR 1/4) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `monsters.test.ts`, `s1.test.ts` +4 |  |

## 12. Hayvanlar (Animals) (s. 344–364)

| SRD bölümü + sayfa | Kural / öğe | Durum | Kanıt | Önerilen adım / açık kalan |
|---|---|---|---|---|
| Hayvanlar s. 344 | Allosaurus (CR 2) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 344 | Ankylosaurus (CR 3) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 344 | Ape (CR 1/2) | var-testsiz | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 344 | Archelon (CR 4) | var-test edilmiş | 3 giriş: var 2, kısmi 0, yok 0, savaş dışı 1; `k73f.test.ts`, `srdD1.test.ts` | savaş dışı: Amphibious |
| Hayvanlar s. 345 | Baboon (CR 0) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 345 | Badger (CR 0) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `ws92c.test.ts` |  |
| Hayvanlar s. 345 | Bat (CR 0) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `k19abilities.test.ts`, `srdD2.test.ts` |  |
| Hayvanlar s. 345 | Black Bear (CR 1/2) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `druid.test.ts`, `k73f.test.ts` |  |
| Hayvanlar s. 345 | Blood Hawk (CR 1/8) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 346 | Boar (CR 1/4) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `grapple.test.ts`, `ws92d.test.ts` |  |
| Hayvanlar s. 346 | Brown Bear (CR 1) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `druid.test.ts`, `p7.test.ts` +4 |  |
| Hayvanlar s. 346 | Camel (CR 1/8) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 346 | Cat (CR 0) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `srdD1.test.ts`, `srdD2.test.ts` +2 |  |
| Hayvanlar s. 346 | Constrictor Snake (CR 1/4) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 347 | Crab (CR 0) | var-testsiz | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Amphibious |
| Hayvanlar s. 347 | Crocodile (CR 1/2) | var-test edilmiş | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1; `deepWater.test.ts`, `grapple.test.ts` +5 | savaş dışı: Hold Breath |
| Hayvanlar s. 347 | Deer (CR 0) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 347 | Dire Wolf (CR 1) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `matrisRegresyon.test.ts`, `readyRegresyon.test.ts` |  |
| Hayvanlar s. 347 | Draft Horse (CR 1/4) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 348 | Eagle (CR 0) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `srdD2.test.ts` |  |
| Hayvanlar s. 348 | Elephant (CR 4) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts`, `srdD1.test.ts` |  |
| Hayvanlar s. 348 | Elk (CR 1/4) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 348 | Flying Snake (CR 1/8) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 348 | Frog (CR 0) | var-test edilmiş | 3 giriş: var 2, kısmi 0, yok 0, savaş dışı 1; `srdD2.test.ts`, `ws92c.test.ts` | savaş dışı: Amphibious |
| Hayvanlar s. 349 | Giant Ape (CR 7) | kısmi | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +5, oyunda DEX +2 |
| Hayvanlar s. 349 | Giant Badger (CR 1/4) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 349 | Giant Bat (CR 1/4) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `shape91.test.ts` |  |
| Hayvanlar s. 349 | Giant Boar (CR 2) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 349 | Giant Centipede (CR 1/4) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `b1spells.test.ts`, `srdD1.test.ts` +3 |  |
| Hayvanlar s. 350 | Giant Constrictor Snake (CR 2) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `p7.test.ts`, `srdD2.test.ts` |  |
| Hayvanlar s. 350 | Giant Crab (CR 1/8) | var-test edilmiş | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1; `yuzme.test.ts` | savaş dışı: Amphibious |
| Hayvanlar s. 350 | Giant Crocodile (CR 5) | var-testsiz | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Hold Breath |
| Hayvanlar s. 350 | Giant Eagle (CR 1) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `karadul.test.ts`, `shape91.test.ts` +2 |  |
| Hayvanlar s. 351 | Giant Elk (CR 2) | kısmi | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `wildShape87.test.ts` | inisiyatif SRD +6, oyunda DEX +4 |
| Hayvanlar s. 351 | Giant Fire Beetle (CR 0) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `ws92c.test.ts` |  |
| Hayvanlar s. 351 | Giant Frog (CR 1/4) | var-test edilmiş | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1; `a2abilities.test.ts`, `srdD1.test.ts` +6 | savaş dışı: Amphibious |
| Hayvanlar s. 351 | Giant Goat (CR 1/2) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 352 | Giant Hyena (CR 1) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts`, `ws92c.test.ts` +3 |  |
| Hayvanlar s. 352 | Giant Lizard (CR 1/4) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 352 | Giant Octopus (CR 1) | var-test edilmiş | 3 giriş: var 2, kısmi 0, yok 0, savaş dışı 1; `k19reactions.test.ts`, `yuzme.test.ts` | savaş dışı: Water Breathing |
| Hayvanlar s. 352 | Giant Owl (CR 1/4) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `srdD1.test.ts`, `wildShape87.test.ts` |  |
| Hayvanlar s. 353 | Giant Rat (CR 1/8) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 353 | Giant Scorpion (CR 3) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `matrisRegresyon.test.ts`, `readyRegresyon.test.ts` +3 |  |
| Hayvanlar s. 353 | Giant Seahorse (CR 1/2) | var-test edilmiş | 3 giriş: var 2, kısmi 0, yok 0, savaş dışı 1; `a2abilities.test.ts` | savaş dışı: Water Breathing |
| Hayvanlar s. 353 | Giant Shark (CR 5) | kısmi | 3 giriş: var 2, kısmi 0, yok 0, savaş dışı 1; `srdD1.test.ts` | inisiyatif SRD +3, oyunda DEX +0; savaş dışı: Water Breathing |
| Hayvanlar s. 353 | Giant Spider (CR 1) | var-test edilmiş | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0; `b1spells.test.ts`, `druid.test.ts` +6 |  |
| Hayvanlar s. 354 | Giant Toad (CR 1) | var-test edilmiş | 4 giriş: var 3, kısmi 0, yok 0, savaş dışı 1; `a2abilities.test.ts`, `shape91.test.ts` +5 | savaş dışı: Amphibious |
| Hayvanlar s. 354 | Giant Venomous Snake (CR 1/4) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `srdD1.test.ts` |  |
| Hayvanlar s. 354 | Giant Vulture (CR 1) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 354 | Giant Wasp (CR 1/2) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `b1spells.test.ts` |  |
| Hayvanlar s. 355 | Giant Weasel (CR 1/8) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 355 | Giant Wolf Spider (CR 1/4) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 355 | Goat (CR 0) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `ws92d.test.ts` |  |
| Hayvanlar s. 355 | Hawk (CR 0) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `srdD2.test.ts` |  |
| Hayvanlar s. 355 | Hippopotamus (CR 4) | var-testsiz | 3 giriş: var 2, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Hold Breath |
| Hayvanlar s. 356 | Hunter Shark (CR 2) | var-testsiz | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Water Breathing |
| Hayvanlar s. 356 | Hyena (CR 0) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 356 | Jackal (CR 0) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 356 | Killer Whale (CR 3) | var-testsiz | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Hold Breath |
| Hayvanlar s. 356 | Lion (CR 1) | var-test edilmiş | 5 giriş: var 5, kısmi 0, yok 0, savaş dışı 0; `shape91.test.ts`, `ws92c.test.ts` |  |
| Hayvanlar s. 357 | Lizard (CR 0) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `srdD2.test.ts` |  |
| Hayvanlar s. 357 | Mammoth (CR 6) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `a2abilities.test.ts` | inisiyatif SRD +2, oyunda DEX -1 |
| Hayvanlar s. 357 | Mastiff (CR 1/8) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `binekMb2.test.ts`, `ws92d.test.ts` |  |
| Hayvanlar s. 357 | Mule (CR 1/8) | var-testsiz | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Beast of Burden |
| Hayvanlar s. 357 | Octopus (CR 0) | var-test edilmiş | 4 giriş: var 2, kısmi 0, yok 0, savaş dışı 2; `k19reactions.test.ts`, `srdD2.test.ts` +2 | savaş dışı: Compression, Water Breathing |
| Hayvanlar s. 344 | Ogre Zombie (CR 2) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 358 | Owl (CR 0) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `b1zirh.test.ts`, `hataFamiliar.test.ts` +3 |  |
| Hayvanlar s. 358 | Panther (CR 1/4) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 358 | Piranha (CR 0) | var-test edilmiş | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1; `ws92c.test.ts` | savaş dışı: Water Breathing |
| Hayvanlar s. 358 | Plesiosaurus (CR 2) | var-testsiz | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Hold Breath |
| Hayvanlar s. 359 | Polar Bear (CR 2) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `k73f.test.ts`, `srdD1.test.ts` |  |
| Hayvanlar s. 359 | Pony (CR 1/8) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `ws92d.test.ts` |  |
| Hayvanlar s. 359 | Pteranodon (CR 1/4) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 359 | Rat (CR 0) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `hataFamiliar.test.ts`, `srdD2.test.ts` +2 |  |
| Hayvanlar s. 359 | Raven (CR 0) | var-test edilmiş | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1; `srdD2.test.ts`, `summons.test.ts` | savaş dışı: Mimicry |
| Hayvanlar s. 360 | Reef Shark (CR 1/2) | var-test edilmiş | 3 giriş: var 2, kısmi 0, yok 0, savaş dışı 1; `k73c.test.ts`, `k73e.test.ts` +3 | savaş dışı: Water Breathing |
| Hayvanlar s. 360 | Rhinoceros (CR 2) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 360 | Riding Horse (CR 1/4) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `binekMb7.test.ts`, `summons.test.ts` |  |
| Hayvanlar s. 360 | Saber-Toothed Tiger (CR 2) | var-testsiz | 4 giriş: var 4, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 360 | Scorpion (CR 0) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 361 | Seahorse (CR 0) | var-test edilmiş | 2 giriş: var 1, kısmi 0, yok 0, savaş dışı 1; `a2abilities.test.ts`, `k73f.test.ts` +1 | savaş dışı: Water Breathing |
| Hayvanlar s. 361 | Spider (CR 0) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `b1spells.test.ts`, `hataFamiliar.test.ts` +4 |  |
| Hayvanlar s. 361 | Swarm of Bats (CR 1/4) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `srdD1.test.ts`, `swarm95.test.ts` +1 |  |
| Hayvanlar s. 361 | Swarm of Insects (CR 1/2) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `shape91Regresyon.test.ts`, `srdD1Regresyon.test.ts` +1 |  |
| Hayvanlar s. 362 | Swarm of Piranhas (CR 1) | var-testsiz | 3 giriş: var 2, kısmi 0, yok 0, savaş dışı 1 | savaş dışı: Water Breathing |
| Hayvanlar s. 362 | Swarm of Rats (CR 1/4) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `riders.test.ts`, `shape91.test.ts` +6 |  |
| Hayvanlar s. 362 | Swarm of Ravens (CR 1/4) | var-test edilmiş | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0; `ws92c.test.ts` |  |
| Hayvanlar s. 362 | Swarm of Venomous Snakes (CR 2) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 363 | Tiger (CR 1) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 363 | Triceratops (CR 5) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 363 | Tyrannosaurus Rex (CR 8) | kısmi | 3 giriş: var 3, kısmi 0, yok 0, savaş dışı 0 | inisiyatif SRD +3, oyunda DEX +0 |
| Hayvanlar s. 363 | Venomous Snake (CR 1/8) | var-testsiz | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 363 | Vulture (CR 0) | var-testsiz | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0 |  |
| Hayvanlar s. 364 | Warhorse (CR 1/2) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `binekMb2.test.ts`, `binekMb6b.test.ts` |  |
| Hayvanlar s. 364 | Weasel (CR 0) | var-test edilmiş | 1 giriş: var 1, kısmi 0, yok 0, savaş dışı 0; `srdD2.test.ts` |  |
| Hayvanlar s. 364 | Wolf (CR 1/4) | var-test edilmiş | 2 giriş: var 2, kısmi 0, yok 0, savaş dışı 0; `g2-smoke.test.ts`, `k19aynalama.test.ts` +39 |  |
