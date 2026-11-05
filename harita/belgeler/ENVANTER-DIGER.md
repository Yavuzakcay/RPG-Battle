# Envanter: sınıf, ırk, feat, durum, kural, ev kuralı, arayüz

> A0 envanter denetimi (2026-11-05, dal `wip/a0`, kural sürümü 27). Salt-okunur: oyun kodu, veri ve testler değişmedi. Yoklama betikleri repo dışında çalıştırıldı.

## 1. Sınıf ve SRD alt sınıf özellikleri

Yöntem: `gainedFeatures(sınıf, 20, altSınıf)` ile 12 sınıfın ve SRD alt sınıflarının bütün özellikleri (195 kayıt). Her `ok` kaydın mekanik kimliği (`stat`, `trait`, `effect.kind`, `reaction.kind`) motor kodunda arandı (150 kimlik). `use_feature` ile kullanılan 19 eylem özelliği 5/11/20. seviyede gerçek savaşta denendi.

| Kaynak | ÇALIŞIR | KISMİ | YOK | SAVAŞ DIŞI | Toplam |
|---|---|---|---|---|---|
| Sınıf özellikleri (`class-features.json`) | 131 | 2 | 0 | 4 | 137 |
| SRD alt sınıf özellikleri (`subclasses.json`) | 56 | 1 | 0 | 1 | 58 |
| İmza alt sınıflar (`imza.json`, ev kuralı) | 57 | 0 | 9 | 0 | 66 |

- **Kancası bulunamayan `ok` kimliği (1, KISMİ sayıldı):** `sorcerer/draconic-sorcery:dragon-companion` (`trait: dragon-companion` kodda geçmiyor; Summon Dragon slotsuz kullanımı büyü yolunda olabilir, doğrulanmadı).
- **Mekaniksiz `ok` (5):** Divine Intervention (büyü düğmesi yolu, `freeSpellList`) ve Aura Expansion (aura yarıçapı aura kodunda) ÇALIŞIR; Eldritch Master, Ritual Adept, Memorize Spell dinlenme/hazırlık: SAVAŞ DIŞI.
- **KISMİ:** Faithful Steed (Find Steed slotsuz bir kez), Eldritch Invocations (savaşa etkisi olmayanlar Game Master notu).
- **SAVAŞ DIŞI:** Thieves' Cant (`none`, hikâye), Evocation Savant (`missing`; büyü kopyalama).
- **`use_feature` yoklaması:** 19 eylem özelliğinin 15'i ilk denemede olay üretti; 4'ü koşul istedi (Turn Undead: Undead yok; Wild Shape kendi komutuyla; Wholeness of Body: tam can; Quivering Palm: önce silahsız isabet). Hata yok.
- **İmza YOK (9, `planli`):** İmparator Ferman; Astrolog Gök Rehberi, Yazgı Değişir; Geride Kalan Öfkeyle Ayakta, Dostunun Yası; Şair Gece Şiiri, Nakarat, Ölümsüz Dize, Usta Şair. Bunlar K54c'nin kapsamı.

## 2. Irk ve tür özellikleri

Kaynak: `data/srd/species.json` (41 tür özelliği), `data/races.json` (darkvision, direnç, hız, `hpPerLevel`, `breathWeapon`, soylar), `src/battle/species.ts` (`srdK19`), `src/rules/lineage.ts`, `src/battle/giant.ts`, `src/battle/celestial.ts`.

| Durum | Sayı | Özellikler |
|---|---|---|
| ÇALIŞIR | 34 | Darkvision ×6, Draconic Ancestry, Breath Weapon, Damage Resistance, Draconic Flight; Dwarven Resilience, Toughness, Stonecunning; Elven Lineage, Fey Ancestry; Gnomish Cunning; Giant Ancestry + 6 dev soyu, Large Form; Brave, Luck, Halfling Nimbleness, Naturally Stealthy; Resourceful; Adrenaline Rush, Relentless Endurance; Fiendish Legacy; Celestial (Light, Şifa Eli, Göksel Uyanış) |
| KISMİ | 2 | Rock Gnome (büyüler var, mekanik oyuncaklar yok), Forest Gnome (büyüler savaş dışı) |
| YOK | 0 | |
| SAVAŞ DIŞI | 5 | Keen Senses ve Skillful/Versatile (oluşturucuda beceri/feat), Trance, Otherworldly Presence (Thaumaturgy), Powerful Build (taşıma) |

Not: CLAUDE.md "Bilinen eksikler" tablosundaki "Relentless Endurance, Luck, Stone's Endurance… yok" satırı eskimiş: Kuyruk 19 (`srdK19`) ile kodda var.

## 3. Geçmişler, feat'ler, silah ustalıkları

| Kaynak | ÇALIŞIR | KISMİ | YOK | SAVAŞ DIŞI | Not |
|---|---|---|---|---|---|
| Geçmişler (4 SRD + 8 özgün) | 12 | 0 | 0 | 0 | Savaşa etkisi köken feat'i ve beceriler; `backgrounds.ts` |
| Feat'ler (17 SRD) | 17 | 0 | 0 | 0 | `class-features.json` `feats` hepsi `ok`; Boon'lar Kuyruk 19 `boons.ts` |
| Silah ustalıkları (8) | 6 | 2 | 0 | 0 | Push yakın dövüşte yalnız eylemin son saldırısında; büyü saldırıları Sap/Vex'e bakmaz |

## 4. Durumlar (15 SRD durumu)

Kaynak: `src/rules/conditions.ts`, `data/conditions.json`, `src/rules/exhaustion.ts`; her durum motorda 7–47 yerde okunuyor.

| Durum | Sınıf | Neden |
|---|---|---|
| Blinded, Charmed, Deafened, Incapacitated, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious, Exhaustion | ÇALIŞIR | kural sürümü 2 (K16E) ve sonrası |
| Frightened | ÇALIŞIR | görüş hattı koşulu, kontrol dezavantajı, yaklaşma yasağı (sürüm 2) |
| Invisible | KISMİ | "görmeyi gerektiren etki" denetimi genel değil (büyü hedeflemesi yalnız görüş hattına bakar) |
| Grappled | KISMİ | **yakalananın, yakalayan dışındaki hedeflere saldırı dezavantajı yok** (`conditions.ts` saldırı kipi listesinde yok). Hız 0, kaçış, sürükleme ve oyuncu yakalama komutu var |

İsteğe bağlı yere yatma (Dropping Prone) komutu yok (DURUM-DENETIMI.md).

## 5. Harita ve global kurallar (`data/kural-kontrol.json`, 111 kural)

- 41 harita kuralı + 70 global kural. **Hepsi motor kodunda kimlikle okunuyor; her harita kuralı en az bir harita JSON'unda kullanılıyor.** Ölü kural yok.
- Kuşatma, yükseklik (`heightMove/Fall/Combat/Sight/Show`), ışık/görüş (`nightVision`, `darkness`, `night`), fırtına (`stormRules`) ve K53/K55 anahtarları (`teleportArrival`, `objectMotion`, `tempBarriers`, `auraCore`, `hexResolver`) Game Master kurulumundaki harita kuralları panelinde görünüyor (`MapRulesPanel`, `controllableRules`).
- Varsayılan kapalı: `nightVision`, `stormRules`, `riverBlocked`, `coldExposure` ve `multiHex` (kurulum anahtarı). Bunlar açılmadıkça SRD görüş/fırtına kuralları uygulanmıyor.

## 6. Ev kuralları (`data/ev-kurallari.json`, 25 anahtar)

| Anahtar | Varsayılan | `houseRule()` okuması | Diğer okuma | Durum |
|---|---|---|---|---|
| suYildirim, buhar, donma, erime, zehirPatlama | açık | 0 (çözücü tablosu `gate` ile, `hexResolver.ts`) | `yuzey-etkilesimleri.json` | canlı |
| barutPatlama | kapalı | 4 | | canlı |
| alarmKosusu | kapalı | 1 | | canlı |
| moralSistemi | kapalı | 1 | 12 (Serüven, Moral) | canlı |
| karadulCemberi | kapalı | 1 | 3 | canlı |
| carpmaHasari | açık | 1 | 8 | canlı |
| imza_* (10) | kapalı | 0 doğrudan | `imzaOn` → `houseRule(state, evKurali)` (veriden) | canlı |
| hizalanma, hizalanmaMoral | kapalı | 0 | Ayarlar `rpg-battle-deneysel` bayrağı (savaşa girmez) | canlı (ayar yolu) |
| **lair** | kapalı | **0** | 0 (in olayı harita kuralı `lairEruption` ile çalışıyor) | **ölü** |
| **asitHavuzu** | kapalı | **0** | 0 (yalnız `surfaces.test.ts`) | **ölü** |
| **yuksekAvantaj** | kapalı | **0** | 0 (yükseklik avantajı global `heightCombat` ile) | **ölü** |

Ölü üç anahtar Game Master ev kuralı panelinde görünüyor ama açmak hiçbir şeyi değiştirmiyor.

## 7. K48–K55 sistemlerinin arayüzden erişimi

| Sistem | Oyunda yapılabilir mi | Nerede | Eksik |
|---|---|---|---|
| Moral (K48) hafif + tam | evet | Serüven anahtarları (`moralSistemi`, `moralTam`), Game Master ev kuralı paneli; savaşta `moral_rally` düğmesi | `moral_dirilt` yalnız Serüven'de |
| Karadul (K48) | evet | Ayarlar → oluşturucu; savaş menüsü | |
| Hizalanma + Moral bağı (K51/K52) | evet | Ayarlar deneysel; oluşturucu son adım; Game Master paneli `AlignmentPanel`; kart rozeti | savaşa girmez (tasarım) |
| K53 ışınlanma/zorla hareket/nesne/engel/aura | evet (dolaylı) | harita kuralları panelinde anahtarlar; etkileri büyü/özellik/Shove ve imza eylemleriyle | oyuncunun doğrudan "nesne fırlat" komutu yok (yalnız Zihin Gücü) |
| K55 çözücü | evet (otomatik) | harita kuralları panelinde `hexResolver` | önizleme (`previewHexEffects`) arayüzde gösterilmiyor; yalnız YZ kullanıyor (K58'e bırakılmıştı) |
| K54/K54b imza komutları | evet | savaş menüsünde imza eylemleri; altıgen seçimi (`imzaHex`), yaratık + altıgen; Muhtaç Sezgisi jeton işareti | imza ev kuralları Ayarlar'da açılmadıkça oluşturucuda görünmez |
| Sarf eşyası (`use_item`) | evet (oyuncu) | savaş menüsü "Eşya" | YZ kullanmaz |
| Nesne saldırısı / kullanımı | evet | `objectActions.ts` | |

Yalnız testte/simde olan: yok. Bütün sistemlerin bir arayüz yolu var; erişilemeyen kısım K55 önizlemesinin oyuncuya gösterilmesi.

## 8. Ek paket (`icerik/ek-*.json`)

**Ölçülemedi.** `icerik/` depo dışında (gitignore) ve bu bulut ortamında yok; 97 alt sınıf / 395 özellik bilgisi doğrulanamadı. İçerik metni rapora yazılmadı. Kullanıcının makinesinde alt sınıf başına durum sayıları için:

```powershell
npm run check:icerik
```

(`scripts/icerik-kontrol.ts` her alt sınıf için çalışır/kısmi/çalışmıyor/planlı/hikâye özetini yazar.)
