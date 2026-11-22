# Serüven ayrımı: inceleme ve plan (SERUVEN-AYRIM-INCELEME)

Salt okuma incelemesi, 2026-11-22, `birlesik` @ `c8555710` (S1 notu `59f8998b` sonrası); **yeniden doğrulama**
`b159635e` (S1 birleştikten sonra; bu sürümde §4'e fork seçeneği (c), §6'ya fork hazırlığı eklendi, eskimiş satır
numaraları ve harita sayıları düzeltildi). Kod, veri ve test değişmedi; bu belge tek çıktı.
Kullanıcı kararları (2026-11-22): Serüven ayrı oyun (aynı motor, kıta ve haritalar; açık dünya), Dice & Hex menüsünden
gizlenir, slot modeli (slot = bir sefer), slot başında yalnız 1 karakter (seviye 1), parti oyun içi yoldaşlardan, aktif
parti en çok 4, bölünmüş parti ileride, üs (kamp) seçimli tema.

**Yöntem.** İçe aktarma grafiği betikle tarandı (`src/**/*.ts(x)`; ilk tarama 1125, yeniden doğrulamada 1129 dosya,
9141 kenar; statik, `import type` ve `import()` ayrı; göreli yollar çözüldü; betik depo dışında, oturum geçici
klasöründe). Dosya/satır iddiaları `grep` ile doğrulandı. Ölçümler ilk incelemede, tek süreç (`sim:yz-sure`, `sim:tek`;
sonuçlar `DENGE.md`'ye yazılmadı). Yeniden doğrulamada yeniden koşulmadı (konteynerde `node_modules` yok); geçerli
sayılır çünkü `c8555710..b159635e` arasında `src/battle`, `src/rules`, `src/sim` ve `data/` hiç değişmedi (`git diff
--stat` boş) ve sim tohumlu. "Doğrulanmadı" yazan yer kanıtsızdır.

**Belgedeki güncel sayılar** (CLAUDE.md'den yeni): kural sürümü **103** (`data/kural-surumu.json`), savaş kaydı
`SAVE_VERSION` **25**, yolculuk kaydı `JOURNEY_VERSION` **2**, ana parça sınırı **500 kB**
(`data/paket-siniri.json`, 2026-11-19 kararı), `MAX_PARTY` **6**, `LEVEL_CAP` **20** (`src/app/limits.ts`).

**Kısa sonuç.** Önerilen mimari (aynı depo, ortak motor, iki giriş) **doğrulandı**: Serüven kodu zaten neredeyse tek
yönlü bağımlı. Ortak koddan Serüven'e giden yalnız 3 uygulama bağı (`App.tsx`, `diceUnlock.ts` tip, `GmScreen.tsx`)
ve 4 sim betiği var (§1.2); savaş motorunda Serüven için eklenmiş yalnız `explore` / `explore_move` / `explore_step`
(ve genel sonuç bayrağı `flags`) var. Ana parçanın statik kapanışında (`main.tsx`'ten 106 modül: 67 TS/TSX + 39
JSON/CSS) hiçbir Serüven modülü yok. Ayrımın asıl işi kod taşımak değil: **kayıt modeli** (tek parti, tek kayıt, savaş otomatik kaydının
paylaşılması) ve **yeni katmanlar** (yoldaş, havuz, üs). Ayrı depoya çatallamak (fork, §4 c) bugün pahalı: son 16 günde
commit'lerin %37'si motora dokundu, kural sürümü 69 kez arttı; fork motor yavaşladıktan sonra, sınır testi ve
`src/seruven/` klasörü (S2) hazırken yapılmalı (kullanıcının planıyla uyumlu).

---

## 1. Modül envanteri ve bağımlılık

### 1.1 Serüven tarafı (üretim dosyaları; testler hariç)

Sınıf: **Ö** = Serüven-özel, **O** = ortak, **K** = karışık. "İçeri" = bu dosyayı içe aktaran üretim/test dosyası sayısı.

| Dosya | Satır | Sınıf | Dışarıya (Serüven dışı) bağımlılık | İçeri (üretim/test) | Not |
|---|---:|---|---|---:|---|
| `journey/types.ts` | 105 | Ö (paylaşılan tip) | `rules/stats`, `rules/characterRest` (tip) | 12/3 | `JourneyMember`, `JourneyState.party: JourneyMember[]` |
| `journey/engine.ts` | 220 | Ö | `rules/dice`, `data/index`, `rules/characterRest`; veri `yolculuk/ayarlar.json` | 6/4 | Yolculuk/sefer motoru (komut → olay → reducer) |
| `journey/sefer.ts` | 53 | **K** | veri `seferler.json` | 6/1 | `GmScreen.tsx` "Sefer" paneli içe aktarır |
| `journey/seruven.ts` | 816 | Ö | `battle/create`, `battle/druid`, `rules/{characterRest,classFeatures,skills,moral,levelChoices,builder,stats}`, `app/limits`, `data/index`; veri `seruven.json` | 12/23 | Serüven motoru; durum, komut, olay, reducer. Tek parti varsayımının merkezi |
| `journey/hapishane.ts` | 53 | Ö | `rules/characterRest`, `rules/stats`; veri `hapishane.json` | 4/2 | `preview/gorselDokum.tsx` veriyi okur (geliştirme önizlemesi) |
| `journey/moral.ts` | 112 | Ö | `rules/stats`, `rules/moral`, `rules/characterRest` | 2/1 | Serüven Moral'ı (hafif mod); savaş içi Moral `battle/morale.ts` ortak |
| `journey/encounter.ts` | 91 | Ö | `data/monsterEnv`, `rules/budget`, `data/index`; veri `bolge-karsilasma.json`, `butce.json` | 3/1 | `sim/bolgeRun.ts` (dinamik) |
| `journey/seruvenEnemies.ts` | 51 | **K** | `sim/balance` | 1/2 | Serüven düşmanı sim senaryolarından |
| `journey/kitaIzgara.ts` | 27 | Ö | veri `kita-izgara.json` | 1/1 | |
| `world/*.ts` (9 dosya) | 848 | Ö | yalnız `rules/dice` (`roam`, `walk`) | — | Dünya haritası, sis, gezinti, bölgeler, Hapishane takvimi. `roam/seruvenFog/prison` → `journey/seruven` yalnız `import type` (döngü yok) |
| `yerlesim/yerlesim.ts` | 66 | Ö | veri `yerlesim.json` | 7/5 | Hub verisi, `kopya` çözümü |
| `yerlesim/sehirGorunum.ts` | 84 | Ö | veri `sehir-gorunum.json` | 2/2 | |
| `app/journeySave.ts` | 37 | Ö | — | 2/4 | Anahtar `rpg-battle-yolculuk` |
| `app/seruvenSave.ts` | 29 | Ö | — | 1/2 | Aynı dosyada `seruven` alanı |
| `app/journeyBattle.ts` | 58 | **K** | `battle/index`, `battle/goals`, `sim/balance`, `app/partyStatus`, `app/setup`, `data/index` | 4/3 | Durak → savaş oturumu köprüsü |
| `app/seruvenBattle.ts` | 362 | **K** | `battle/*`, `map/maps`, `sim/balance`, `ui/session`, `app/setup`, `battle/avatar`; veri `sim-boss.json` | 2/11 | Düğüm → savaş oturumu (`seruvenBattleSession`, `linkSession`, `yerlesimSession`, `sucSession`, `hapisSession`) |
| `screens/SeruvenScreen.tsx` | 566 | Ö | `screens/Builder` (tembel), `ui/{MoralBar,DiceThemePicker,cityViewSetting}`, `app/{partyStatus,limits,diceUnlock}`, `rules/*`, `i18n` | 1/2 | Başlangıç formu Karakterlerim'den seçer |
| `screens/JourneyScreen.tsx` | 188 | Ö | `app/partyStatus`, `rules/characterRest`, `app/limits`, `i18n` | 1/1 | Deneysel yolculuk (`journeyEnabled`) |
| `screens/SeferMap.tsx` | 123 | Ö | `i18n` | 1/3 | |
| `screens/YerlesimHub.tsx` | 143 | Ö | `i18n` | 2/2 | `HubShop`, `HubInn`, `HubQuests`, `HubTemple` dışa açık |
| `screens/SehirGorunum.tsx` | 87 | Ö | `i18n` | 1/2 | |
| `ui/world/*` (3 dosya + css) | 623 | Ö | `i18n` | — | `WorldMapViewer` (tembel), `RegionLoading`, `markers` |

Satır sayıları ve "İçeri" yeniden doğrulamada aynı çıktı (±1 satır). Serüven klasörlerinde 21 test dosyası
(`src/journey`, `src/world`, `src/yerlesim`, `src/ui/world`) + `screens/seruven-ui.test.tsx`; ayrıca Serüven'i içe
aktaran 8 ortak test (§1.2 son satır + `sim/seruvenYuksekDuman.test.ts`).

### 1.2 Ortak koddan Serüven'e giden bağlar (sızıntı)

| Kaynak (ortak) | Hedef (Serüven) | Tür | Nasıl ayrılır |
|---|---|---|---|
| `src/App.tsx` | `JourneyScreen`, `SeruvenScreen`, `ui/world/WorldMapViewer` | `lazy(import())` | Serüven kökü ayrı giriş bileşenine (`SeruvenApp`) taşınır; Dice & Hex `App` yalnız bayrakla ona bağlanır (S1/S2) |
| `src/app/diceUnlock.ts` | `journey/seruven.ts` | `import type` (`SeruvenEvent`) | Zar açılımı Serüven olaylarından (`unlocksFromSeruven`). Ortak profil kalır; tip, Serüven tarafındaki küçük bir arayüze (`{type,key,...}`) indirgenir ya da fonksiyon Serüven'e taşınır |
| `src/screens/GmScreen.tsx` | `journey/sefer.ts` (`SEFERLER`) | statik | "Sefer" paneli Dice & Hex'te kalacaksa `sefer.ts` ortak kalır (veri okuyucu); kalmayacaksa panel bayrakla kalkar. **Tasarım kararı** (§7) |
| `src/sim/chain.ts`, `chainRun.ts`, `hapishaneRun.ts`, `bolgeRun.ts` | `journey/*`, `app/journeyBattle`, `app/seruvenBattle` | statik/dinamik | Sim betikleri iki oyunu ölçer; taşınmaz, yalnız içe aktarma yolu güncellenir (klasör taşınırsa) |
| Testler: `app/dragonbornEskiJeton`, `modulBaslatma`, `battle/ws92d`, `map/maps`, `rules/k38`, `rules/levelChoices`, `screens/seviyeSiniri`, `sim/seruvenYuksekDuman` | `journey/*`, `app/seruven*` | test | Yerinde kalır; klasör taşınırsa yol güncellenir. Fork'ta (§4 c) Dice & Hex deposunda kalanlar Serüven'i test etmeye devam eder: hangi depoda kalacakları kararı |

Ters yönde Serüven, ortak motoru serbestçe kullanıyor (`battle/create`, `battle/druid`, `rules/*`, `map/maps`,
`app/setup`, `app/partyStatus`, `ui/session`); bu doğru yön.

**İki gizli karışıklık** (içe aktarma grafiğinde görünmez, veri bağı):

1. **`sim/balance.ts` = Serüven'in karşılaşma tablosu.** `journeyBattle.ts`, `seruvenBattle.ts`, `seruvenEnemies.ts`
   `SCENARIOS`/`enemiesAt`/`scenarioXp`'yi `sim/balance.ts`'ten alır; Serüven düğümlerinin `senaryo` alanı
   `data/sim-senaryolar.json` kimlikleridir. Denge ölçümü için yapılan düşman listesi ayarı Serüven'i de değiştirir.
   Ayrım: `SCENARIOS` okuyucusunu `sim/` dışına (ör. `data/senaryolar.ts`) çıkarmak; veri dosyası yerinde kalır.
2. **Savaş otomatik kaydı ortak tek yuva.** `MapBattle.tsx:559` her tur sonunda `saveBattle(session)` →
   `rpg-battle-save`. Serüven savaşı da buraya yazar; ana menüdeki "Devam et" (`App.tsx:225`) ve S1 ile gelen Oda
   kur'daki odasız devam (`App.tsx:264` `onResumeUnbound`) kaydı **düz savaş** olarak açar (`seruven` düğüm bağı yok),
   sonuç Serüven'e işlenmez ve Dice & Hex'in kayıtlı savaşı ezilir. Ayrımda Serüven savaşının kaydı slot dosyasına
   girmeli (§3).

### 1.3 Savaş motoru içindeki Serüven parçaları

| Parça | Yer | Sınıf | Not |
|---|---|---|---|
| `BattleState.explore { exits }`, `explore_move` komutu, `explore_step` olayı | `battle/types.ts:1502, 1744, 2452`, `battle/create.ts:805,927`, `battle/commands.ts`, `battle/reduce.ts`, `battle/possession.ts`, `ui/log.ts`, `MapBattle.tsx` | O (genel "savaş sonrası serbest yürüyüş") | Kural sürümüne bağlı değil; motor içinde kalır. Serüven'e özel adı yok, Dice & Hex de kullanabilir |
| `BattleState.flags` (harita `map_note.flag`) | `battle/types.ts:1544`, orman mekanikleri | O | Sonuç bayrağı; Serüven okur |
| `Avatar.outfit: 'mahkum'` | `battle/types.ts:775` | O (yalnız görünüm) | Hapishane oturumu kurar |
| `link_check`, `link_cross`, `hapse_at`, `hapis_kapi`, `suc_*`, `teslim_ol`, `level_up`, `moral_dirilt`, `world_walk`, `fast_travel`, `world_check`, `seruven_*` | yalnız `journey/seruven.ts`, `world/roam.ts`, `journey/moral.ts`, `screens/SeruvenScreen.tsx`, `YerlesimHub.tsx`, `app/seruvenBattle.ts`, `app/diceUnlock.ts` | Ö | **Savaş motorunda değil**: Serüven'in kendi komut/olay döngüsü. Doğrulandı (`grep`, `src/battle` içinde yok) |
| Düğüm önekleri `link:`, `yer:`, `hapis:`, `suc:` | `App.tsx:278-281`, `SeruvenScreen.tsx:98-155` | K | Savaştan dönüşte Serüven sonucu nasıl işleyeceğini öneke göre seçer; `SeruvenApp`'e taşınır |
| Moral savaş içi (`battle/morale.ts`, ev kuralı `moralSistemi`) | `battle/` | O | Serüven anahtarı `moralTam` savaşa `houseRules` ile geçer (`seruvenBattle.ts` `moralHouse`) |
| Hizalanma | `rules/alignment*.ts`, `ui/gm/AlignmentPanel.tsx`, `GmScreen.tsx` | O (Dice & Hex) | **Serüven'e bağlı değil**: `src/journey`, `src/world`, `src/yerlesim`, Serüven ekranlarında hiç geçmiyor (doğrulandı) |

---

## 2. Veri ve varlıklar

| Varlık | Sınıf | Kullanan | Not |
|---|---|---|---|
| `data/seruven.json` (9 sayfa, 52 düğüm, 23 anahtar, `baglantilar`) | Ö | `journey/seruven.ts`, `world/seruvenFog.ts` | Düğümde `kapilar`/`girisler` (hapishane), `senaryo`, `requires`, `bayrak` |
| `data/yerlesim.json` (12 yerleşim; 8'i `kopya`), `data/sehir-gorunum.json` | Ö | `yerlesim/*` | Haritalarda `kapilar`, `girisler` burada (harita JSON'unda değil, doğrulandı) |
| `data/hapishane.json` | Ö | `journey/hapishane.ts` (+ önizleme) | |
| `data/seferler.json`, `data/yolculuk/` (`ayarlar.json`, `ilk-gun.json`) | **K** | `journey/sefer.ts`, `journey/engine.ts`, `GmScreen` | Dice & Hex Sefer paneli kararına bağlı |
| `data/kita-izgara.json`, `data/harita/*` (14 JSON + 3 PNG katman: kamera, komşuluk, deniz/yol, sis, düğüm eşleme, keşif, gezinti, yürüme/bölge ızgarası, etiketler) | Ö | `world/*`, `journey/kitaIzgara.ts` | `data/harita/` yalnız Serüven okuyor (doğrulandı) |
| `data/bolge-karsilasma.json` | Ö | `journey/encounter.ts` | |
| `data/sim-boss.json` | **K** | `app/seruvenBattle.ts` + sim | Boss listeleri hem sim hem Serüven |
| `data/sim-senaryolar.json`, `data/sim-partiler.json` | **K** / sim | `sim/balance.ts` → Serüven | §1.2 (1) |
| `data/butce.json`, canavar/sınıf/büyü/SRD verisi | O | motor | |
| `public/kita/` (9 webp, 4,7 MB) | Ö | Serüven kıta sayfaları | |
| `public/maps/dunya/` (karolar, 18 MB) | Ö | `WorldMapViewer` | Kaynak depo dışı (`assets-ham/harita/dunya/`) |
| `public/yerlesim/` | Ö | şehir görünümü | **Klasör yok** (doğrulandı): şehir görünümü görselsiz, eski hub'a düşüyor |
| `public/maps/<bolge>/` (15 MB), `harita/<bolge>/*.json` (57 harita) | O | iki oyun | Taşınmaz |
| `public/characters/` (99 MB), `monsters/`, `efekt*`, `sprites/`, `ses/` (17 MB), `zarlar/`, `son/`, `acilis/`, `logo/` | O | iki oyun | Taşınmaz; aynı kökten (`public/`) servis |

**Harita JSON'larındaki Serüven bağları** (57 harita): harita düzeyinde `gizli: true` **11** harita (Hapishane 4,
Heykel Mağarası, Yeraltı Nehri, klasik Çöl `col`, `kale-baskini`, geniş haritalar `kale-avlu`/`orman-yolu`/`magara-genis`);
ilk sürümdeki "13" yanlıştı: `dag-nobetci` ve Heykel Gölü'nde `gizli` yalnız **nesnelerde** (gizli keşif nesnesi, Kuyruk
30), harita gizli değil. `sefer` 8 harita (`volkan` 4, `derinlikler` 4); `seferKurallari` 5; `goals` 14; `groups` 6
(5 harita düzeyinde, Ork Kampı varyantta); `floorLink` 2. Bunlar haritanın verisi:
`gizli` yalnız Dice & Hex seçicisini süzer, `sefer` seçici grubu ve ev kuralı varsayılanı. **Taşınmaz**; Serüven
haritaları kimlikle çağırır. Yeni dünya haritası eklemek bugünkü kalıpla (harita JSON + `seruven.json` düğümü) yalnız
veri.

---

## 3. Kayıt

### 3.1 Bugün

| Anahtar | İçerik | Not |
|---|---|---|
| `rpg-battle-yolculuk` | `{ version: 2, savedAt, events: JourneyEvent[], seruven?: SeruvenEvent[] }` | Yolculuk ve Serüven **aynı dosya, tek yuva**. Yalnız olay günlüğü; durum `replaySeruven` ile kurulur |
| `rpg-battle-save` | Savaş oturumu (`SAVE_VERSION` 25) | Dice & Hex ve Serüven savaşları paylaşır (§1.2 (2)) |
| `rpg-battle-dugum` | Düğüm aracı (geliştirme) | |
| `rpg-battle-characters` | Karakterlerim | Serüven başlangıçta **kopyalar**, geri yazmaz (`SeruvenScreen` `onUpdateCharacters` almaz, doğrulandı) |
| `rpg-battle-zar-acilanlar` | Zar temaları profili | Serüven olayları zar açar (`unlocksFromSeruven`): oyunlar arası tek bağ |

`SeruvenState` (`journey/seruven.ts:71`): `party: JourneyMember[]` (sheet + status kopyası), `level` (**partiye tek
seviye**; `seruven_leveled` herkesi yükseltir), `xp`/`gold`/`potions`/`items` ortak, konum tek (`page`, `at`,
`konum`, `yerlesim`, `hapis`), `flags`, `done`, `night`, `toggles`, `kesif` (sis), `saat`, `hublar`, `kontroller`,
`karsilasma`, `suc`, `tasma`, `formSwaps`, `choiceUse`. `seruven_started` olayı başlangıç durumunun tamamını taşır
(replay Karakterlerim'den bağımsız).

### 3.2 Tek parti varsayımının sabit olduğu yerler

| Yer | Varsayım | Bölünmüş parti için |
|---|---|---|
| `SeruvenState.party`, `.page/.at/.konum/.yerlesim/.hapis` | Tek parti, tek konum | `parties: { id, members: string[], page, at, konum, yerlesim, hapis }[]` + `roster` |
| `seruven.ts` (28 `.party` kullanımı), `moral.ts` (6), `roam.ts` (2), `seruvenBattle.ts` (7), `SeruvenScreen.tsx` (7) | Komut partiyi örtük alır | Komutlara `partyId` (yoksa etkin parti) |
| `JourneyState.party` + `journeyBattle.ts` `fighters(j)` | Savaş katılımcıları tek diziden (`pc1..pcN`, `ownerId = üye kimliği`) | Değişmez: Serüven savaş için seçili partiden geçici `JourneyState` kurar (`nodeJourney`, `partyJourney` bugün de böyle) |
| `seruven_leveled` | Parti seviyesi | Üye başına seviye (§5.1) |
| `App.tsx` ekran durumu `{ name: 'battle'; session }` | Aynı anda tek savaş | Sıralı cephe yeterli (§5.3) |
| `rpg-battle-save` | Tek savaş yuvası | Slot dosyasında `activeBattle?` |

### 3.3 Önerilen slot modeli

```text
seruven-index           → { v: 1, slots: [{ n, ad, kahraman, sayfa, oynamaSaat, savedAt, son: 'oto'|'elle' }] }
seruven-slot-<n>-oto    → SlotFile
seruven-slot-<n>-elle-<k> → SlotFile   (elle kayıt; slot başına k ≤ K)

SlotFile = { v: SLOT_VERSION, savedAt, events: SeruvenEvent[], activeBattle?: { node, session } }
SeruvenState (slot) = {
  ...dünya: page/kesif/flags/done/hublar/saat/toggles/quests/suc,
  roster: CompanionMember[]            // yoldaş havuzu; oyuncu karakteri de burada, hero: true
  parties: { id, members: string[], at, page, konum, yerlesim, hapis }[]   // ilk sürümde uzunluk 1
  activeParty: string, us: { tema, ... } | null
}
```

- Parti **baştan dizi** (`parties`), ilk sürümde tek öğe: bölünmüş partide kayıt göçü gerekmez.
- Olay günlüğü kalıbı korunur (`battleSave`/`journeySave` kalıbı, `LOADABLE_*` listesi).
- Slot sayısı parametre (`data/seruven.json` ya da yeni `data/seruven-slot.json` `slotSayisi`, öneri 10).
- "Devam et" = `seruven-index`'te en yeni `savedAt`. Otomatik kayıt: her Serüven komutundan sonra (bugün de öyle) +
  savaş turu sonunda `activeBattle`.
- **Depolama sınırı doğrulanmadı.** localStorage köken başına ≈5 MB; 10 slot × (Serüven günlüğü + yarım savaş
  günlüğü + elle kayıtlar) sığar mı ölçülmedi. S3'te gerçek bir uzun kaydın boyutu ölçülmeli; gerekirse IndexedDB.

### 3.4 Eski kayıtlar ve çakışma

| Konu | Durum | Öneri |
|---|---|---|
| Eski `rpg-battle-yolculuk` Serüven kaydı (çok karakterli, Karakterlerim kopyası, parti seviyesi) | Yeni modele uymaz (tek kahraman + yoldaş yok) | **Kullanıcı kararı.** Önerim: göç etme; eski kaydı "Eski Serüven (salt okunur/eski kurallar)" olarak bırak ya da yalnız slot 1'e "eski" etiketiyle yükle. Göç edilecekse: ilk üye kahraman, diğerleri `roster`'a "yoldaş" olarak |
| Anahtar çakışması | Tüm anahtarlar `rpg-battle-*` (kaynakta 33 sabit anahtar adı; `-oda` dahil, bazıları kalıpla kuruluyor olabilir, doğrulanmadı) | Yeni anahtarlar `seruven-*` ön ekiyle; Dice & Hex anahtarlarına dokunulmaz |
| Ortak ayarlar | `rpg-battle-lang`, `-theme`, `-ses`, `-dice-anim`, `-effects`, `-reactions` | Aynı köken: iki giriş de okur. Ayrı ayar isteniyorsa ön ek ayrılır (karar §7) |
| Savaş kaydı | `rpg-battle-save` paylaşılıyor | Serüven savaşı `MapBattle`'a `saveKey`/`onAutosave` ile slotuna yazdırılır (S3) |

---

## 4. Giriş noktaları

Bugün: tek `index.html`, Vite çok sayfalı değil (`vite.config.ts`'te `rollupOptions.input` yok; kökteki
`onizleme-*.html` yalnız `dev`'de). Hash rotası örneği var: `#dunya` (Harita Keşfi), `#galeri` (`App.tsx:79-84`).
Paket denetimi yalnız `dist/assets/index-*.js`'e bakar (`scripts/paket-siniri.mjs`). Ana parça statik kapanışında
Serüven modülü **yok**; Serüven'den ana parçada kalan yalnız `strings.ts` blokları: `seruven` 7,3 k + `journey` 2,5 k
karakter (dosya 84,8 k).

| Seçenek | Kurulum | Artı | Eksi / risk | İş |
|---|---|---|---|---|
| **a1. Tek `index.html`, kök seçici** (hash/bayrak: `#seruven` ya da ayrı yayın bayrağı) | `main.tsx` kökü seçer: `App` ya da tembel `SeruvenApp` | Build ve paket denetimi değişmez; `#dunya` kalıbı var; en ucuz | Tek uygulama paketi (APK'da iki ayrı oyun değil); Dice & Hex ana parçası Serüven'in ilk ekranına yine yüklenir | Küçük |
| **a2. Vite çok sayfalı** (`index.html` + `seruven.html`) | `rollupOptions.input`; ortak parçalar otomatik bölünür | Gerçek ayrı giriş; her oyunun kendi ana parçası ve açılışı; ayrı yayınlanabilir | `paket-siniri.mjs` ikinci girişi bilmez (desen genişletilmeli); ortak parça adlandırması `index-*.js` desenine çakışabilir (doğrulanmadı, build ile görülür); `appShell` eklentisi `index.html`'e özel; `check:harita`/Playwright başlangıç yolu | Orta |
| **b. Workspaces** (`packages/motor`, `apps/dice-hex`, `apps/seruven`) | Motor ayrı paket | Sınır derleyiciyle zorlanır | `src/battle` ↔ `src/rules` ↔ `src/data` ↔ `src/map` ↔ `src/ui/session` iç içe; 1125 dosyada yol değişimi, `import.meta.glob` (`harita/*/*.json`, `icerik/`), `data/` ve `public/` kök yolları, `vite-node` sim betikleri, tsconfig/vitest kurulumu. Kural sürümü zinciri ve sim betikleri kırılma riski yüksek | Büyük |

| **c. Fork / klon** (Serüven ayrı depoda, Dice & Hex `upstream`; motor değişiklikleri `git merge upstream/birlesik` ile çekilir) | Yeni depo; Serüven'e özgü klasörler yalnız orada gelişir | Ayrı yayın, ayrı köken (localStorage çakışması kendiliğinden biter), ayrı CLAUDE.md/DECISIONS; Dice & Hex'ten Serüven tamamen kalkabilir | Motor bugün çok hızlı değişiyor (aşağıdaki ölçüm): her birleştirmede kural sürümü, `strings.ts`, `MapBattle.tsx`, `DECISIONS.md`/`CLAUDE.md` tepe girişleri çakışır; iki depoda motor düzeltmesi yapılırsa ayrışır; `.git` 959 MB (sığ klonda bile), `public/` varlıkları iki kez | Kurulum küçük, **sürdürme büyük** (motor hızına bağlı) |

**Fork (c) için ölçüm** (sığ klon, görünen geçmiş 2026-11-06 – 11-22, 16 gün, 596 commit):

| Yol | Commit | Fork'a etkisi |
|---|---:|---|
| `src/battle`, `src/rules` | 222 (%37) | Motor her gün değişiyor; fork bunları birleştirmeden alamaz |
| `data/kural-surumu.json` | 69 | Günde ≈4 kural sürümü; Serüven deposunda motora dokunulursa sürüm numarası çakışır (iki depo aynı numarayı farklı kurala verir) |
| `DECISIONS.md` / `CLAUDE.md` | 353 / 119 | Tepeye yazılan belgeler: her birleştirmede metin çakışması (fork'ta ayrı dosya adı ya da `merge=union` gerekir) |
| `src/MapBattle.tsx` / `src/i18n/strings.ts` | 76 / 45 | Ortak arayüz; Serüven'in savaş kaydı kancası (S3) ve metinleri bu dosyalara dokunur |
| `harita/` | 236 | Ortak; Serüven haritaları kimlikle çağırır, ayrı yerde geliştirilirse kimlik çakışması riski |
| Serüven klasörleri + `seruven.json` + `yerlesim.json` | 12 | Serüven tarafı bugün yavaş; fork'un kazandırdığı bağımsızlık şimdilik küçük |

Okuma: kullanıcının planı (fork'u görsel tur ve mekanikler bittikten sonra yapmak) bu ölçümle **doğru**: motor
yavaşlamadan fork, iş yükünü birleştirme çakışmasına çevirir. Fork'tan önce a1 + sınır testi + `src/seruven/` klasörü
(S2) kurulursa fork günü Serüven kodu temiz bir alt ağaç olur ve iki depo arasındaki fark yalnız giriş ve Serüven
klasörleri kalır. Fork sonrası kural: **motor değişikliği yalnız Dice & Hex deposunda** (Serüven deposu motoru salt
okur, `upstream`'den birleştirir); Serüven'e motor değişikliği gerekirse önce Dice & Hex'e yapılır. APK yapılandırması
depoda yok (Capacitor/Android dosyası bulunmadı; doğrulandı): ayrı uygulama kimliği depo dışında kurulur.

**Öneri:** a1 ile başla (S1–S2), ürün ayrı yayın istediğinde a2'ye geç (S8); c, motor yavaşladıktan sonra (S10,
kullanıcının zamanlaması). b yapılmaz; yerine **sınır testi**:
`src/` dışındaki ortak koddan Serüven klasörlerine giden bağları izin listesiyle sabitleyen bir vitest (bu belgedeki
tarayıcının küçük hâli). Böylece workspaces'in faydası (sınır) maliyetsiz alınır ve fork (c) hazırlığı olur.

**Paylaşım** (iki girişte ortak, yeri değişmez): `src/i18n` (Serüven metinleri tembel `strings.seruven.ts`'e
taşınabilir; ana parçadan ≈10 k karakter iner), `ui/theme`, `ui/audio`, `ui/Splash` (açılış; Serüven'in kendi
logo/zamanlaması `data/acilis-ekrani.json`'a ikinci kayıt), Ayarlar ekranı (`SettingsScreen` tembel; Serüven'de
yalnız ilgili sekmeler), `MapBattle`, `Builder`, zar tepsisi. Ortak bileşenler `src/ui`, `src/screens` içinde kalır;
Serüven'e özgü ekranlar `src/seruven/` (yeni) altına.

**Klasör taşıma önerisi:** `src/journey`, `src/world`, `src/yerlesim` **yerinde kalsın** (12+23 içe aktaran test ve sim
betikleri var; taşıma yalnız yol değişimi üretir). Yeni kod `src/seruven/` (giriş, slot, yoldaş, üs). Ekranları
(`Seruven*`, `YerlesimHub`, `SehirGorunum`, `SeferMap`) taşımak isteğe bağlı, S2'de tek commit.

---

## 5. Yoldaş, havuz ve üs: boşluk analizi

### 5.1 Parti bugün nasıl kuruluyor

- **Serüven:** `StartForm` (`SeruvenScreen.tsx:159`) Karakterlerim'den en çok `MAX_PARTY` = 6 karakter seçtirir;
  `start` komutu sheet + status kopyalar; seviye = en yüksek üye seviyesi ya da `cmd.level`; ırk başlangıcı ilk
  karakterin türünden (`irkBaslangic`).
- **Savaş:** `stopParticipants` (`journeyBattle.ts:23`) canlı üyelerden `combatantFromSheet(..., { id: 'pc<i>',
  ownerId: m.id })`; `partyStart` düğümün 1 tabanlı altıgenleri ya da haritanın `startZones.players` (sütun aralığı;
  Klasik Çöl notunda 15 altıgen). Game Master bağlamı kurulumda yerleştirme içindir.
- **Kim oynatır:** arayüzde parti tarafı hep oyuncu; YZ otomatik oynatma yalnız düşmana (`autoplayEnemyTurns`) ve
  partinin **çağrılan** yaratığına (`autoplaySummonTurn`, `actor.summon` koşulu; `ui/autoplay.ts:45`). Motorun
  `chooseCommand` her tarafı oynayabiliyor (sim). Yoldaşı YZ'ye vermek: `autoplaySummonTurn`'ün `summon` koşulunu
  "yoldaş YZ'de" işaretiyle genişletmek (yalnız arayüz; kural sürümü gerekmez).
- **Oluşturucu:** `Builder` `suggest` (SD3 önerileri) ve `choices` (Serüven seviye seçimleri, `lockClass`) kiplerini
  biliyor; **seviye kilidi yok** (seviye 1–20 serbest).

| Gereksinim | Durum | Not |
|---|---|---|
| Kahraman yaratma (1 karakter, seviye 1) | **Eksik** | `Builder`'a `lockLevel: 1` (+ tek karakter akışı); `suggest` hazır |
| Karakterlerim'den bağımsızlık | **Hazır** | Kopya modeli; yalnız `StartForm` değişir (Karakterlerim listesi Serüven'de hiç gösterilmez) |
| Yoldaş veri şeması | **Eksik** | Öneri `data/yoldaslar.json`: `id`, ad TR/EN, `tanitim` TR/EN, `sheet` (ırk, sınıf, alt sınıf, geçmiş, seçimler; `data/sim-partiler.json` biçimi: seviye 1 sheet + `levels.<N>` seçimleri), `jeton`, `katilim: { sayfa, dugum, kosul: requires/bayrak }`, `kisilik` (Moral/Hizalanma eğilimi, isteğe bağlı). Doğrulama: `sim-partiler` testi kalıbı (SRD'ye göre eksiksiz) |
| Yoldaş seviyesi | **Tasarım kararı** | Bugün parti tek seviye (`seruven_leveled`). En ucuzu: yoldaş = kahraman seviyesi (havuzdakiler dahil; `levels.<N>` seçimleri veriden). Kendi eğrisi: üye başına `xp`/`level` alanı gerekir |
| Aktif parti 4 | **Kısmen** | Motor ve `MAX_PARTY` 6; Serüven'e ayrı sabit `SERUVEN_PARTY_MAX = 4` (veride) |
| Ayrılma / geri çağırma | **Eksik** | Komutlar `companion_join`, `companion_leave`, `party_set`; olaylar `seruven_companion_*` |
| Ölüm ve diriltme | **Kısmen** | `status.dead`, `moral_dirilt` (tapınak/büyü) üye başına çalışıyor; havuzdaki ölü yoldaş için aynı. Kalıcı ölüm **karar** |
| Moral | **Hazır** (üye başına) | `CharacterStatus.moral`/`moralOlum` (`rules/characterRest.ts:49-51`); kampta bekleyen yoldaşın Moral'ı donar mı **karar** |
| Hizalanma | **Bağlı değil** | Serüven'de hiç yok; yoldaşta ilk sürümde kapalı önerilir |
| Yoldaşı YZ mi oyuncu mu | **Kısmen** | §5.1 "Kim oynatır"; yoldaş başına "YZ oynasın" anahtarı |

### 5.2 Havuz ve parti seçimi

| Konu | Durum | Not |
|---|---|---|
| Havuz büyüklüğü | **Karar** | Veri parametresi; bütün yoldaşlar (sınırsız) ya da sınır |
| Görev öncesi seçim ekranı | **Eksik** | Üs ekranında; düğüm `partiSec: true` ise savaştan önce |
| Bekleyen yoldaşın durumu | **Eksik** | Öneri: havuzdakiler uzun dinlenmiş sayılır (`longRestStatus`), seviye kahramanla; kaynaklar savaşta harcanmaz |

### 5.3 Bölünmüş parti

Motor: `Side = 'party' | 'enemies'` (`battle/types.ts:28`), tek savaş tek parti tarafı; `App` ekran durumunda tek
`session`; savaş kaydı tek yuva.

| Seçenek | Fizibilite | Maliyet | Not |
|---|---|---|---|
| **Sıralı** (cephe A biter, sonra cephe B; sonuç bayrakları paylaşılır) | Bugünkü motorla olur | **En ucuz**: yalnız Serüven katmanı (`parties[]`, düğümde `cepheler`) | Önerilen ilk yol |
| İki gruplu tek savaş (8 kişi, iki başlangıç bölgesi) | Olur: iki grup da `party` tarafı, `partyStart` serbest altıgen listesi | Orta: haritada ikinci başlangıç bölgesi verisi; YZ ve denge 8 kişiyle ölçülmedi | Kural sürümü gerekmez (yerleşim verisi) |
| Paralel (iki harita, iki oturum, sırayla tur) | Motor gerekmez ama `App`/`MapBattle` iki oturum, iki kayıt, dönüşümlü tur | Büyük | İlk sürümde değil |

Mevcut çok adımlı akışlar: `linkSession` (koridor), `yerlesimSession` (kapıdan haritaya), `hapisSession` (hücre →
kapılar), `sucSession` hepsi `state.party`'yi tek parti olarak okur ve sonucu düğüm önekiyle (`link:`, `yer:`,
`hapis:`, `suc:`) geri işler. Bölünmüş partide hepsi "etkin parti"yi okumalı; Hapishane parti-geneli bir durum
(`hapis`, `tasma`) olduğundan parti başına taşınmalı. Sıralı modelde yeterli.

**Parti büyüklüğü ölçümü** (5. seviye; `k18-wizard` = standart çekirdek 4 kişi, `standart` = aynı + Kael 5 kişi,
`buyucu` = farklı dizilişte 6 kişi; bileşim farkı sonucu etkiler).

YZ karar süresi (`npm run sim:yz-sure -- 3 <senaryo> --parti <p> --seviye 5`; iki taraf YZ, 3 savaş):

| Senaryo | Parti | Kişi | Karar | Ort. ms | p95 ms | En çok ms | YZ süresi / savaş |
|---|---|---:|---:|---:|---:|---:|---:|
| Çöl | k18-wizard | 4 | 556 | 27,8 | 109,7 | 696,6 | ≈5,2 sn |
| Çöl | standart | 5 | 536 | 32,1 | 117,0 | 613,5 | ≈5,7 sn |
| Çöl | buyucu | 6 | 324 | 34,6 | 135,5 | 434,7 | ≈3,7 sn |
| Kale | k18-wizard | 4 | 572 | 22,1 | 69,3 | 665,1 | ≈4,2 sn |
| Kale | standart | 5 | 878 | 25,4 | 92,5 | 1175,5 | ≈7,4 sn |
| Kale | buyucu | 6 | 772 | 45,7 | 163,3 | 3218,8 | ≈11,8 sn |

Okuma: karar başına süre parti büyüdükçe artıyor (Kale 22 → 25 → 46 ms); 4 kişide YZ bütçesi (ort. ≤ 60 ms, p95 ≤ 200
ms, `DENGE.md`) rahat. Serüven'de yoldaşlar YZ'ye verilirse oyuncu turu dışında YZ payı artar ama 4 kişi 6'dan ucuz.

Denge (`npm run sim:tek -- 30 col kale magara orman --seviye 5 --parti <p>`; 30 tohum, göstergedir, `DENGE.md`'ye
yazılmadı):

| Senaryo | 4 kişi (k18-wizard) kazanma / ort. tur / düşmüş PC | 5 kişi (standart) | 6 kişi (buyucu) |
|---|---|---|---|
| Çöl — Gündüz | %40 / 7,9 / 2,10 | %83 / 9,0 / 1,13 | %100 / 4,5 / 0,00 |
| Orman | %30 / 5,3 / 2,67 | %67 / 6,5 / 1,87 | %100 / 3,8 / 0,03 |
| Mağara — karanlık | %43 / 11,1 / 1,87 | %73 / 8,8 / 1,07 | %100 / 3,6 / 0,00 |
| Kale — Gündüz | %7 / 6,5 / 3,53 | %17 / 8,0 / 4,00 | %100 / 6,8 / 0,00 |

Okuma: aynı çekirdekten bir üye eksilince (5 → 4) kazanma %30–45 puan düşüyor (Kale hariç); 6 kişilik büyücü partisi
her senaryoda %100 (bileşim de farklı, `DENGE.md` K41 bulgusuyla uyumlu). Mevcut 5. seviye senaryo listeleri **4
kişilik aktif parti için ağır**: Serüven 4 kişiyle oynanacaksa düşman listeleri parti büyüklüğüyle ölçeklenmeli
(aşağıdaki boşluk).

Senaryoların XP bütçesi 5 kişilik partiye göre (`DENGE.md` 1846. satır). Serüven'de parti büyüklüğü yalnız **6+
seviyede** hesaba katılıyor: `seruvenEnemies` (`seruvenBattle.ts:35-41`) `s.level <= DEFAULT_LEVEL` (5) iken
`undefined` döner ve senaryonun sabit listesi kullanılır; 6+ seviyede `seruvenEnemyPlan(..., { partySize })`.
**Boşluk:** yeni model seviye 1'de tek kahramanla başlıyor; 1–5. seviye düğümleri 5 kişilik listeyle gelir. S5'te
1–5. seviye için de parti büyüklüğüne göre ölçek (ya da düğüm başına tek kişi/2 kişi listeleri) gerekir.

### 5.4 Üs (kamp)

| Gereksinim | Durum | Not |
|---|---|---|
| Hub bölümleri (dükkân, han, görevler, tapınak) | **Hazır** | `YerlesimHub.tsx` `HubShop`/`HubInn`/`HubQuests`/`HubTemple` (`HubPartProps` = `state`, `run`) |
| Yalnız JSON ile yeni yerleşim | **Hazır** | `yerlesim.json` `kopya` (8 yerleşim böyle) + `gorunumler` filtresi |
| Üs görseli/arka planı | **Kısmen** | `sehirGorunum` tek üstten görsel + bina düğümleri; `public/yerlesim/` bugün yok (görselsiz eski hub) |
| Üs teması seçimi (kamp, gemi, mağara) | **Eksik** | `data/us.json`: `tema`, görsel, bina/bölüm listesi (hub bölümleri + "Yoldaşlar", "Parti", "Dinlen") |
| Yoldaşların üste görünmesi | **Eksik** | Jeton listesi (`Avatar`/`TokenFigure` hazır); yerleşim düzeni yeni |
| Havuz ve parti seçimi ekranı | **Eksik** | §5.2 |
| Üssün slota kaydı | **Eksik** | `SeruvenState.us`; olay `seruven_us_*` |
| Dinlenme | **Hazır** | `inn_rest`, `seruven_rested`, `longRestStatus` |
| Yeni üs türü yalnız veri mi | **Olabilir** | Üs = yerleşim şablonunun bir türü (`sablon: 'us'`) yapılırsa evet (JSON + görsel); mekanik farkı olan tema (ör. gemi = hızlı seyahat) kod ister |

---

## 6. Adım planı

Her adım: typecheck + ilgili testler + build yeşil. Boyut: K küçük (≤ 1 gün), O orta, B büyük.

| Adım | İçerik | Boyut | Bağımlılık | Kural sürümü | Kayıt sürümü | Regresyon riski |
|---|---|---|---|---|---|---|
| **S1** Bayrakla gizleme | **Yapıldı** (`c77fb4c9` ANA-MENU-SADELESTIR, bu incelemeden sonra birleşti): `features.ts` `seruvenMenuEnabled` (varsayılan kapalı, Ayarlar ▸ Gelişmiş ▸ Geliştirici); `seruven-ui.test` bayrakla, yeni `anaMenu.test.tsx`. Kalan: `#seruven` ile doğrudan açılış (S2'ye) | — | — | yok | yok | — |
| **S2** Giriş noktası | `src/seruven/SeruvenApp.tsx` (kök; savaş dönüşü önek işleme `App.tsx:278-281`'ten taşınır); `main.tsx` kök seçici (a1); Serüven metinleri tembel `strings.seruven.ts`; sınır testi (izin listesi: §1.2; fork (S10) hazırlığı da budur) | O | S1 | yok | yok | Orta (App ekran akışı) |
| **S2b** Karışıkların çözümü | `SCENARIOS` okuyucusu `sim/` dışına; `diceUnlock` tip bağı; Sefer paneli kararı | K | S2 | yok | yok | Düşük |
| **S3** Slot kaydı | `seruven-index`, `seruven-slot-<n>-*`; `SeruvenState.roster` + `parties[]` (dizi, uzunluk 1) + `activeParty`; `MapBattle` otomatik kaydı enjekte (`saveKey`); `activeBattle` slotta; depolama boyutu ölçümü | O | S2 | yok (savaş olayı değişmez) | **yeni** `SLOT_VERSION` 1; `JOURNEY_VERSION` 2 eski kayıt için kalır | Orta (eski kayıt) |
| **S4** Tek karakter yaratma | Slot başında `Builder` `suggest` + `lockLevel: 1`; `StartForm` kalkar; kahraman `roster`'da `hero` | K–O | S3 | yok | S3 içinde | Düşük |
| **S5** Yoldaşlar + katılma + havuz | `data/yoldaslar.json` + doğrulama testi (SRD eksiksiz, `sim-partiler` kalıbı); düğüm/bayrakla katılma; `companion_*` komutları; aktif parti ≤ 4; yoldaş başına "YZ oynasın" (`autoplaySummonTurn` genelleme); 1–5. seviyede parti büyüklüğüne göre düşman ölçeği (§5.3) | O | S3, S4 | yok (YZ ve arayüz) | olay eklenir, sürüm aynı (alanlar isteğe bağlı) | Orta |
| **S6** Otomatik + elle kayıt | Elle kayıt yuvaları, "Devam et" = son kayıt, slot listesi ekranı | K | S3 | yok | yok | Düşük |
| **S7** Üs | `data/us.json`, tema seçimi, hub bölümlerinin yeniden kullanımı, yoldaş/parti ekranı | O–B | S5 | yok | olay eklenir | Düşük |
| **S8** Ayrı yayın (isteğe bağlı) | a2: `seruven.html`, `rollupOptions.input`, `paket-siniri.mjs` iki giriş | O | S2 | yok | yok | Orta (build) |
| **S9** Bölünmüş parti (sıralı) | `parties.length > 1`, düğümde `cepheler`, Hapishane/hapis parti başına | B | S5, S7 | yok (sıralı modelde) | olay eklenir | Orta–yüksek |
| **S10** Fork (isteğe bağlı, §4 c) | Motor yavaşladıktan sonra: yeni depo, `upstream` = Dice & Hex; Serüven deposunda Dice & Hex girişi ve `#seruven` dışı ekranlar kapatılır (silinmez, birleştirme kolay kalsın); Dice & Hex'te `seruvenMenu` ve Serüven klasörleri kalır ya da kaldırılır (karar); `DECISIONS.md`/`CLAUDE.md` Serüven deposunda ayrı ad (çakışmasız birleştirme) | O (kurulum) + sürekli birleştirme | S2 (sınır testi şart), S3 | **motor yalnız upstream'de** | Serüven deposu kendi `SLOT_VERSION`'ı | Yüksek (birleştirme çakışması) |

**Taşınmayacaklar / dokunulmayacaklar**

- Savaş motoru (`src/battle`, `src/rules`) ve **kural sürümü zinciri** (103; `ruleVersion.ts`, sürüm sabitleri,
  regresyon testleri). Ayrım hiçbir adımda kural sürümü gerektirmez.
- `SAVE_VERSION` (25) ve savaş olay biçimi; `explore`/`explore_move`/`explore_step` motorda kalır.
- `sim` betikleri ve `package.json` sim komutları (yalnız içe aktarma yolu değişebilir).
- `harita/` yapısı, harita JSON'ları (`gizli`, `sefer`, `goals`, `groups`), `public/maps/`, `MAP_FILES` yükleyici.
- `data/srd/`, canavar verisi, `icerik/` dış paket akışı.
- Dice & Hex anahtarları (`rpg-battle-*`) ve Karakterlerim.

---

## 7. Açık kararlar (kullanıcıya)

1. **Slot sayısı:** 10 mu? Elle kayıt slot başına kaç (öneri 3 + 1 otomatik)?
2. **Havuz sınırı:** bütün yoldaşlar mı, sınırlı mı (ör. 12)?
3. **Bölünmüş görevler:** cephe sayısı en çok 2 mi; ilk uygulama **sıralı** cephe olabilir mi (önerim)?
4. **Yoldaş seviyesi:** kahramanla eşit mi (önerim; havuzdakiler dahil), kendi XP eğrisi mi? Kampta bekleyen seviye alır mı?
5. **Yoldaş ölümü:** kalıcı mı, tapınak/büyüyle diriltme (bugünkü `moral_dirilt`) geçerli mi? Kahraman ölünce slot biter mi?
6. **Yoldaşı kim oynatır:** varsayılan oyuncu mu, YZ mi; yoldaş başına değiştirilebilir mi?
7. **Üs seçimi:** slot başında mı, oyun içinde mi (taşınabilir mi)? Temalar arasında mekanik fark var mı (gemi = hızlı seyahat, mağara = gizlenme)?
8. **Karakterlerim'den Serüven'e hiç aktarım olmaması** onayı (önerim: yok; ters yönde de yok).
9. **Eski Serüven kaydı** (`rpg-battle-yolculuk` `seruven` alanı): göç mü, salt okunur bırakma mı, silme mi?
10. **Dice & Hex'teki "Sefer" paneli ve deneysel Yolculuk** (`journeyEnabled`, `GmScreen` Sefer paneli): Dice & Hex'te kalsın mı, Serüven'e mi geçsin?
11. **Ortak ayarlar ve zar profili:** dil/tema/ses ve zar açılımları iki oyunda ortak mı (önerim: ortak), ayrı mı?
12. **Yayın biçimi:** ilk aşamada aynı uygulamada rota (a1) yeterli mi, ayrı uygulama (a2, ayrı APK) ne zaman?
13. **Hizalanma Serüven'de:** yoldaşlarda ve kahramanda açılacak mı (bugün Serüven'e bağlı değil)?
14. **Aktif parti 4 ile denge:** 5. seviye senaryo listeleri 4 kişiye ağır (§5.3: %7–43). Serüven listeleri parti büyüklüğüyle ölçeklensin mi (önerim: evet, 1–5. seviyede de), yoksa aktif parti 5 mi olsun?
15. **Fork zamanı ve kuralı (§4 c):** fork ne zaman (öneri: kural sürümü değişimi haftada birkaç kereye inince)? Fork
    sonrası motor yalnız Dice & Hex deposunda mı değişsin (öneri: evet)? Dice & Hex deposundan Serüven klasörleri
    fork'tan sonra silinsin mi, kalsın mı?
