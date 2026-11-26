# KATALOG-1 F — Mühür Ruhu bossları ve evrim çizgileri: tasarım (Aşama 1)

Görev KATALOG-1 F, Aşama 1. Bu dosya yalnızca belgedir: kod, veri ve test değişmedi.

Sıra:

1. Bu belgenin onayı.
2. **Faz 2 motor görevi** (§3; kural sürümü 107).
3. BOSS-GORSEL-1'in `birlesik`'e birleşmesi.
4. F Aşama 2 (30 yaratığın verisi ve denge). `public/boss/` ve `data/boss-gorsel.json` yoksa Aşama 2 durur.

- **Dal:** `claude/katalog-1-f-tasarim`, güncel `origin/birlesik` (6f9f177a) üstüne rebase edildi.
- **Sürümler (bugün):** kural sürümü 106, kayıt sürümü 27. Faz 2 görevi bunları 107 ve 28 yapar (§3.5). F Aşama 2 yalnızca veri ekler.
- **Ön durum:** KATALOG-1 A–E ve G (`birlesik`'te; G düzeltmesi 6f9f177a Mothraq ve Cimbombom adlarını işledi). SRD-TAMAMLAMA-1 A–C bitti.
- **Kaynak:** depo dışı `docs/katalog/`:
  - *Kaltakkıran'ın Paladin Zırhı ve On Mühür Taşı Sistemi*: §4 taş kademeleri, §5 on Seviye 3 taş, §6 bölge bossları ve fazları.
  - Kadim Yaratıklar PDF'i: F2'ye kaldı (§11).

## Onaylar ve kararlar (kullanıcı, 2026-11-26)

| Karar | İçerik |
|---|---|
| K1 | Sv.1 CR 2–3, Sv.2 CR 8–10 (Cimbom 10), Sv.3 CR 20–26. **Cimbombom CR 26, en güçlü.** Diğer dokuzu CR 20–25; hiçbirinin hasarı, canı ve saldırı sayısı Cimbombom'u geçmez |
| K2 | Fiend; ışıltı çizgisi (Lumbo, Lighty, Lightaur) Celestial |
| K3 (yeni) | **Faz 2 gerçek motor kuralı** (mekanik donmasına bilinçli istisna, DECISIONS.md). İptal edilenler: "Game Master elle", "efsanevi `buff`", "zayıflık hiç kalkmaz". PDF'in arena değişimleri (yüzey, çağırma, hava) Game Master notu olarak kalır |
| K4 | Efsanevi direnç 3/gün, efsanevi eylem 3 |
| K5 | Kadim yaratıklar F2'ye |
| K6 | Boyut tablosu (§2) |
| K7 | "Cimbombom, Lion of the Hell" (`cimbombom`); Sv.2 "Cimbom", Sv.1 "Cim" |
| K8 | Boss dengesi iki kolda ölçülür: dirençsiz (bilerek ezilir) ve hazırlıklı (sim başlangıcında elemente direnç etkisi; hedef Normal %45–65, Kolay %70–85) |
| K10 | Boss sim'i mevcut 12 sınıflık 20. seviye duman partileriyle (`k18-<sınıf>`, `k19smoke` yolu) |
| Ad | Zehir bossu **Mothraq** (`mothraq`). PDF eski adları yalnızca `eskiAd` alanında |
| Ek kurallar | Hazırlıklı parti varsayımı, karşı element zayıflığı, zayıflığın Faz 2'de kalkması, Soulslike desen |

**Onay bekleyen:** §3 Faz 2 mekaniği (tasarım), §5 ve §10 sayıları, §12 K11–K12.

## 0. Bulgular

1. **PDF'te bölge bosslarının stat bloğu yok.** Yalnızca şunlar var: element, bir cümlelik Faz 1 kimliği, Faz 2 arena değişimi, bossun taşından gelen bağışıklık ve taşın Savaş Sanatı (PDF: "bölge boss'undan miras"). CR, HP, AC, saldırı, nefes ve efsanevi eylemler bu belgenin önerisidir.
2. **Bugün motorda faz tetiği yok** ve hasar profilinden zayıflık kaldırılamıyor. Etkiler yalnızca ekler: `resist`, `vulnerable`, `immuneDamage`; bkz. `common.ts`. Çözüm §3'te.
3. **Canavar eylemleri yüzey oluşturamaz.** PDF'teki yüzey parçaları sığmıyor (§6) ve Game Master notunda kalıyor.
4. **Sim'de hazırlıklı parti yok.** K8 kolu (b) için yalnız sim kodunda bir başlangıç seçeneği gerekir (§7). Bu oyun mekaniği değildir.

## 1. Kimlik, sınıf ve dosya düzeni (F Aşama 2)

- **Sınıf etiketi:** "Mühür Ruhu" / "Seal Spirit". Ad ve unvan İngilizce (SD4), açıklama Türkçe.
- **Veri:** `data/bosslar-muhur.json`, 30 kayıt, `Monster` biçimi. `data/monsters.json`'a yazılmaz.
  - Ek alanlar: `kaynak: "katalog-1"`, `sinif`, `element`, `kademe`, `cizgi`, `eskiAd` (boss), `unvan`, `ganimet`, `faz2` (boss, §3), `gmNot` (PDF arena değişimi), `katalog`.
  - Jeton: `avatar: "boss/<kimlik>.webp"`.
- **Bağlamalar** (mevcut dosyalar, yeni anahtar): `efsanevi.json`, `canavar-yetenekleri.json`, `canavar-ekleri-a2.json`, `multiattack.json`. Ayrıca `unsupported` (durum bağışıklığı, duyular) ve `traits` ("Legendary Resistance (3/Day)").
- **Yeni kod:** yalnızca yükleyici. `loadMonsters()` boss dosyasını tembel yükler; yaratık türü kayıttan okunur. Ana parçaya girmez.
- **Ortam:** `monster-ortamlari.json`, `tema: "Mühür Ruhları"`. Düğüm yerleşimi Serüven'e kalır.
- **Görsel:** `public/boss/<kimlik>.webp`. Ham görseller depo dışında `assets-ham/boss/`: 26/30 var, `mirit`, `mirath`, `darkit`, `darkath` eksik. Görsel yoksa `Avatar`'ın `onError` yedeği devreye girer.

| # | Element | Çizgi (Sv.1 → Sv.2 → Sv.3) | Boss | `eskiAd` | Sv.3 ganimeti | Tür | `ortam` |
|---|---|---|---|---|---|---|---|
| 1 | Ateş | `cim` → `cimbom` → `cimbombom` | Cimbombom, Lion of the Hell | Erimiş Örs Muhafızı | `ember-core` | Fiend | `volkanik-demirhane`, `lav-tapinagi`, `derinlikler-lav-salonu`, `volkan` |
| 2 | Soğuk | `doggie` → `wolfie` → `wolfgang` | Wolfgang, Blizzard Wolf | Tipi Yutan Dev | `frost-heart` | Fiend | `buzul-kayalik`, `buzul-acik`, `buzul-tapinak`, `buzul-kamp` |
| 3 | Yıldırım | `sparkle` → `thunderse` → `stormer` | Stormer, Thunder Stallion | Şimşek Süvarisi | `storm-spire` | Fiend | `dag-kayalik`, `dag-kopru`, `dag-nobetci`, `dag` |
| 4 | Gürültü | `twinkle` → `gongi` → `gongar` | Gongar, Bell Shell Brute | Kör Çan Devi | `resonance-seal` | Fiend | `col-kanyon-nehri`, `col-sutun-harabesi`, `kanyon-koprusu` |
| 5 | Asit | `hydrop` → `hydras` → `hydraxe` | Hydraxe, Sulphur Hydra | Sülfür Hidrası | `dissolution-drop` | Fiend | `batak-cukur`, `batak-adalar`, `batak-kale`, `bataklik` |
| 6 | Zehir | `sporlet` → `mothcoon` → `mothraq` | Mothraq, Spore Moth | Spor Hükümdarı | `venom-essence` | Fiend | `derinlikler-mantar-magarasi`, `orman-kemik-acikligi`, `orman-heykel-golu` |
| 7 | Işıltı | `lumbo` → `lighty` → `lightaur` | Lightaur, Bull of Celestial | Kırık Hale Şövalyesi | `blinding-sun-shard` | Celestial | `kasaba-demirci-tapinak`, `buzul-tapinak`, `lav-tapinagi` |
| 8 | Nekrotik | `cerbit` → `cerbedo` → `cerbones` | Cerbones, Crematorium | Kemik Toplayıcı Lord | `sepulcher-orb` | Fiend | `orman-kemik-acikligi`, `derinlikler-mezar-labirenti` |
| 9 | Psişik | `mirit` → `mirath` → `mirage` | Mirage, Life Stealer | Ayna Zihin Avcısı | `whisper-crystal` | Fiend | `col-sutun-harabesi`, `isinlanma-salonu`, `beyaz-sehir-saray-avlusu` |
| 10 | Kuvvet | `darkit` → `darkath` → `darkape` | Darkape, Kong of the Void | Yörünge Nöbetçisi | `void-fracture` | Fiend | `dag-karakol`, `kanyon-koprusu`, `isinlanma-salonu` |

**Ganimet:** Sv.1 `cracked-elemental-stone-<tür>`, Sv.2 `awakened-elemental-stone-<tür>`, Sv.3 yukarıdaki taş. PDF §4 ile çelişmiyor: Sv.1 "elit ganimet", Sv.2 "zindan ara boss'ları", Sv.3 "yalnızca 10 Bölge Bossu". Motor ganimet düşürmez; taş Serüven düğümünün `reward.items` alanıyla verilir.

## 2. Boyut ve harita (K6)

`multiHex` kapalıyken her boyut tek altıgen kaplar; açıkken Large 3, Huge 7 altıgen kaplar.

| Boyut | Boss | Harita |
|---|---|---|
| Huge | Cimbombom, Wolfgang, Gongar, Hydraxe, Mothraq, Cerbones, Darkape | 21×11 ve üstü |
| Large | Stormer, Lightaur | 15×7 ve üstü |
| Medium | Mirage | 15×7 ve üstü |

Sv.1 Small; Sv.2 Large (Mirath Medium). Gargantuan yok.

## 3. Faz 2 mekaniği: yarı can fazı (tasarım; ayrı görevde uygulanır)

### 3.1 Kural

- **Genel ve veriden okunur.** Canavar kaydında isteğe bağlı `faz2` bloğu bulunur. Kodda boss ya da canavar adıyla koşul yazılmaz.
- **Tetik.** Komut sonunda (`turnHooks.ts` `registerCommandEnd`, mevcut kanca) şu koşulların hepsi sağlanırsa bir kez `phase_changed` olayı üretilir:
  - yaratıkta `faz2` bloğu var,
  - yaratık canlı (hp > 0),
  - Faz 2'ye henüz geçmemiş,
  - hp ≤ ⌊maxHp × `esik`⌋ (varsayılan 0,5).
- **Kapsam.** Yalnızca komut sonunda denetlenir. Başkasının turundaki hasar da (tepki, efsanevi eylem, alan, yüzey, tur başı/sonu etkileri) bir komutun içinde olduğundan aynı kancaya düşer.
- **Tek seferlik.** Reducer savaşçıya `faz: 2` yazar. Can sonradan eşiğin üstüne çıksa da geri dönmez; ikinci olay üretilmez.
- **Atlanan durumlar.**
  - Tek vuruşta 0 HP'ye düşen yaratık faza girmez (ölüdür).
  - Biçim değişimindeyse (Polymorph, `shape`) tetik biçim bitene dek bekler. Eşik yaratığın kendi `maxHp`'siyle hesaplanır.
- **Faz bloğu olmayan canavarda** kanca hemen döner. Olay, alan ya da sıra değişmez (regresyon testi §3.7).

### 3.2 Veri şeması (`faz2` bloğu)

```json
"faz2": {
  "esik": 0.5,
  "geciciCan": 0,
  "ac": 0,
  "saldiri": 0,
  "hasar": null,
  "hasarTuru": null,
  "direncEkle": [], "direncKaldir": [],
  "zayiflikEkle": [], "zayiflikKaldir": ["cold"],
  "bagisiklikEkle": [], "bagisiklikKaldir": [],
  "nefesDoldur": true,
  "nefesAlan": 1.25,
  "efsaneviEk": 0,
  "not": { "tr": "…", "en": "…" }
}
```

Alanların anlamları:

- `geciciCan`: sabit sayı ya da zar ("4d10"). Zar tetik anında bir kez atılır ve olaya yazılır.
- `hasar`: isabet başına ek hasar, zar ("1d6") ya da sabit (3). Türü `hasarTuru`'dur; boşsa saldırının türü kullanılır.
- `nefesAlan`: Recharge'lı alan saldırılarının boy çarpanı. Koni ve çizgi uzunluğuna, küre ve yayılım yarıçapına uygulanır, 5 ft'e aşağı yuvarlanır.
- `efsaneviEk`: tur başına ek efsanevi eylem hakkı.
- `not`: günlük ve kart metni.

Şema doğrulaması `src/data` yükleyicisindedir; bilinmeyen alan reddedilir.

### 3.3 Alanlar: motorda var mı?

| Alan | Bugün motorda | Faz 2 görevinde yapılacak |
|---|---|---|
| Geçici HP | **Var**: `temp_hp` olayı | Olayın içinde atılmış değer; reducer mevcut `temp_hp` mantığıyla (SRD: üst üste binmez, büyüğü) |
| AC | **Var**: `ActiveEffect.ac` | Reducer süresiz etki `faz2:<id>` ekler (`until` yok) |
| Saldırı bonusu (zar) | **Var**: `ActiveEffect.dice` (`on: ['attack']`) | Aynı etkiye yazılır |
| Saldırı bonusu (sabit) | **Yok** | Etkiye `attackFlat` alanı ve canavar saldırısında okunması (yeni, küçük) |
| Hasar artışı (zar) | **Var**: `ActiveEffect.hitDie` (canavar saldırısında 34+) | Aynı etkiye yazılır |
| Hasar artışı (sabit) | **Yok** | `hitDie` sabit sayıyı kabul eder ya da `hitFlat` alanı (yeni, küçük) |
| Direnç, zayıflık, bağışıklık **ekleme** | **Var**: etkide `resist`, `vulnerable`, `immuneDamage` (`common.ts` hasar profili) | Aynı etkiye yazılır |
| Direnç, zayıflık, bağışıklık **kaldırma** | **Yok** (etkiler yalnızca ekler) | Reducer, olaydaki listeleri savaşçının `resistances`/`vulnerabilities`/`immunities` dizilerinden çıkarır (yeni). Eşyadan gelen etki zayıflığı (Armor of Vulnerability) dokunulmadan kalır |
| Nefesi yeniden doldurma | **Kısmen**: durum `rechargeUsed` / `abilityRecharge` var, olay `recharge_rolled` zarla çalışır | Olayda `nefesDoldur`; reducer iki listeyi boşaltır (yeni dal) |
| Nefes alanı büyütme | **Yok** | Savaşçıda `areaScale`. Canavar alanının tek kaynağı `areaAttack.ts` `monsterAreaOf` onu okur (yeni). Yapay zekânın `bestAim`'i aynı işlevi kullandığı için büyük alan kendiliğinden hesaba girer |
| Ek efsanevi eylem hakkı | **Yok** | Savaşçıda `legendaryExtra`. `boss.ts` `legendaryLeft` ve tur başı yenilemesi `spec.uses + legendaryExtra` okur (yeni) |
| Faz işareti | **Yok** | Savaşçıda `faz?: 2` (yeni alan) |

### 3.4 Motor düzeni

- **Akış:** Komut → `execute` → komut sonu kancası `phaseEvents(before, next)` → olay `phase_changed` → reducer.
- **Olay çözülmüş değerleri taşır:**

  ```ts
  { type: 'phase_changed'; targetId; phase: 2;
    tempHp?; effect?: Partial<ActiveEffect>;
    remove?: { resistances?; vulnerabilities?; immunities? };
    rechargeReset?: boolean; areaScale?; legendaryExtra?; note? }
  ```

- **Replay:** Olay zar sonucunu içerdiği için reducer zar atmaz. Baştan oynatma aynı durumu verir.
- **Faz bloğunun kopyası.** Faz bloğu canavar kaydından savaşçıya oluşturulurken kopyalanır (`Combatant.faz2`; `paket` gibi). Bu kopya yalnız kural sürümü ≥ 107 olan savaşta yapılır. Replay ve kayıt, veri dosyası sonradan değişse de aynı sonucu verir.
- **Dosyalar:**
  - `src/battle/faz2Surum.ts` (`FAZ2_VERSION = 107`, `faz2On`)
  - `src/battle/faz2.ts` (kanca + olay üretimi, saf)
  - `reduce.ts` (`phase_changed` dalı)
  - `create.ts` (kopya)
  - `areaAttack.ts` (`areaScale`)
  - `boss.ts` (`legendaryExtra`)
  - `types.ts`

### 3.5 Kural ve kayıt sürümü

- **Kural sürümü 106 → 107** (`data/kural-surumu.json` notu, tek sabit `FAZ2_VERSION`).
  - 106 ve altındaki savaşta `faz2` kopyalanmaz, kanca çalışmaz: eski kayıt ve replay aynı kalır.
  - Faz bloğu olmayan canavarlarda 107 de 106'yla aynıdır: imza regresyonu §3.7.
- **Kayıt sürümü 27 → 28** (`SAVE_VERSION`), yeni olay türü `phase_changed`. `LOADABLE_VERSIONS` 3–28. 27 ve öncesi kayıtlar yüklenir; içlerinde bu olay yoktur.
- Çakışma riski: başka bir görev aynı anda 107'yi alırsa sürüm numarası uygulama anında yeniden alınır (tek sabit olduğu için bir satır).

### 3.6 Ana parça, arayüz, yapay zekâ

- **Ana parça (sınır 465 kB, şu an 460,93 kB).** Motor modülleri savaş parçasında. `MapBattle` ve `battle/index` `App.tsx`'te tembel; giriş ekranı onları statik içe aktarmıyor.
  - `faz2.ts` (~2–3 kB) ve değişen dosyalar savaş parçasına girer.
  - TR günlük metni tembel `strings.tr2.ts` (`log`), EN metni tembel `strings.en.ts`.
  - Jeton işareti `ui/damageFloats.ts` `statusIcons` ile çizilir; bu dosya savaş çizim koduna aittir.
  - **Beklenen ana parça artışı ≈ 0 kB.** Uygulamada `npm run build` sonundaki `paket-siniri.mjs` ölçümüyle doğrulanır; 465 kB aşılırsa durulur.
- **Arayüz** (yalnızca görünüm):
  - Günlükte tek satır: "{ad}: Taş Uyanışı — {not}" (EN "Stone Awakening"), açılır ayrıntıda değişenler listelenir (zayıflık kalktı, nefes doldu, alan ×1,25).
  - Jetonda küçük "Ⅱ" rozeti (`statusIcons`).
  - Metinler `strings.tr2.ts` ve `strings.en.ts`'e.
- **Yapay zekâ: kod değişmez.** Faz 2'nin etkisi mevcut kararlarla kendiliğinden yansır:
  - nefes dolunca yapay zekâ Recharge'lı alanı zaten tercih eder,
  - büyüyen alan `monsterAreaOf` üzerinden `bestAim`'e girer,
  - kalkan zayıflık hasar profilinden okunur (partinin önizlemesi ve yapay zekâsı da görür).

  Hamle değişimi (örn. "kuyruk önce") yapay zekâ önceliği gerektireceği için kapsam dışı; Game Master notunda kalır.

### 3.7 Test planı

1. **Tetiklenme:** eşiğin altına inen komutun sonunda tek `phase_changed`. Alanlar uygulanır: geçici HP, AC etkisi, zayıflık kalkar, `rechargeUsed` boş, alan ×1,25, efsanevi hak +N.
2. **Tek seferlik:** iyileşip yeniden yarının altına inince ikinci olay yok. Eşiğin üstüne çıkınca da Faz 2 değerleri kalır.
3. **0 HP'ye tek vuruş:** olay yok.
4. **Başkasının turunda tetik:** efsanevi eylem, tepki ve tur sonu hasarı.
5. **Replay:** olay günlüğü baştan oynatılınca aynı durum ve aynı imza.
6. **Faz bloğu olmayan canavar:** 4 senaryoluk hızlı regresyon (106 imzası = 107 imzası; `src/sim/faz2Regresyon.test.ts`, altın 106).
7. **Eski sürümde kapalı:** `kuralSurumu: 106` savaşında faz bloğu olan canavar da faza girmez.
8. **Kayıt:** sürüm 28 kaydı yüklenir, 27 kaydı yüklenir.
9. **Arayüz:** günlük satırı TR/EN, rozet görünür (tek ekran görüntüsü).

### 3.8 Uygulama görevinin yeri (öneri)

Ayrı görev: **KATALOG-F0 "yarı can fazı" (kural sürümü 107)**. F Aşama 2'den önce yapılır. KATALOG-2 kanca görevleriyle (O7, O9–O11) birleştirilmez:

- KATALOG-2 kancaları oyuncu eşyalarının saldırı/hasar yoludur. Faz 2 canavar ve durum yoludur; regresyon alanları farklı.
- Tek sürüm tek konu kalırsa sürüm notu ve regresyon altını temiz olur. Sorun çıkarsa 107 tek başına geri izlenir.
- F Aşama 2 yalnızca bu göreve bağımlıdır; KATALOG-2'yi beklemez.

## 4. Sayı modeli: hazırlıklı parti

- **Tablo.** SRD 5.2.1'de canavar yaratma tablosu yok. CR hedefleri DMG 2014 "Monster Statistics by CR" tablosundan; yalnızca hesapta kullanıldı.
- **Dirençli parti (kural 2).**
  - Bossun ham hasarının ≈ %72–76'sı element, kalanı fiziksel.
  - Dirençli partiye düşen etkin hasar ham × 0,625. CR'nin saldırı yarısı buna göre.
  - Dirençsiz parti 1,6 kat yer ve bilerek ezilir.
- **Karşı element.** Partinin hasarının f = %25'i bossun zayıf olduğu elementten gelir.
  - Faz 1'de parti ×1,25 hasar verir. Faz 2'de zayıflık kalkar, ×1,00 olur.
  - **Canın ikinci yarısı %25 daha uzun dayanır.** Faz 2'nin savunma kazancı budur ve hesaba bir kez eklenir.
  - Bu yüzden Faz 2 ayrıca geçici HP ya da AC almaz: **çift telafi yok**. İstisna Stormer: zayıflığı olmadığından aynı %25'i geçici HP ile alır (yarı canın %25'i).
- **Etkin can:** ham HP × 0,90 + 90 (efsanevi direnç 3/gün). Lightaur'da +30 (yenilenme 10 × 3 tur). Stormer'da çarpan 1 + 0,125 (geçici HP payı).
- **Faz 2 hücumu:** nefes anında yeniden dolar ve alan ×1,25 olur. Ek hasar zarı, saldırı bonusu ve ek efsanevi hak yok.
  - Tur başına ham artış:
    - nefes ortalaması 2 hedeften 2,5 hedefe (+B/6),
    - artı yeniden dolumun payı: dolu olmama olasılığı ⅔ × 2,5 hedef × B, Faz 2'nin ≈ 4 turuna yayılmış (+0,42 B).
  - Toplam ≈ hamın +%17'si.
- **CR denetimi.** Saldırı yarısı, iki fazın süreye göre ağırlıklı etkin tur hasarıyla hesaplanır:
  - Faz 1 ağırlığı 1 / 2,25, Faz 2 ağırlığı 1,25 / 2,25.
  - Faz 1 sayıları, ağırlıklı ortalama CR bandına oturacak kadar düşürüldü. Önceki sürümde Faz 1 doğrudan bandın ortasındaydı; Faz 2 artışı onu bandın üstüne çıkarırdı.
- **Diğer değerler:**
  - Saldırı bonusu: CR 20'de +10, CR 21–23'te +11, CR 24–26'da +12.
  - Bossun kendi DC'si 19 / 20 / 21.
  - PDF taş sanatı DC 16 ve Faz 2 aura DC 15 birebir kalır.
  - AC 19; Gongar 20.

## 5. On boss

Ortak iskelet (Soulslike, yalnızca mevcut mekanik):

- **Multiattack:** 2–3 ağır saldırı, sabit sıra (`multiattack.json`; oyuncu ezberler).
- **Nefes:** Recharge 5–6, savaşa dolu başlar. Telegraf yok; Game Master nefes dolunca cümleyi okur.
- **Efsanevi eylemler** (3/tur, her biri turda bir, `oncePerTurn`): yakın ceza (10 ft yayılım, element + çizgi durumu), menzilli ceza (120 ft ışın), geri vuruş (10 ft yayılım, arka ve yanlar dahil, fiziksel + Prone ya da itme).
  - Menzilli ışın yaklaşık: yapay zekâ en yakın hedefi seçer, Game Master oynatırsa uzaktakini.
- **Sanat:** PDF taşı, savaşta 1 kez (`uses: 1`), DC 16.
- **Faz 2 (`faz2`, §3; motor uygular):** zayıflık kalkar, nefes dolar, alan ×1,25. PDF arena değişimi `gmNot`'ta kalır (Game Master elle uygular, motorda sığmıyor).

Bloklarda "vuruş" Multiattack'ın tek saldırısıdır; ortalama parantez içinde.

### 5.1 `cimbombom`: Cimbombom, Lion of the Hell (Ateş, CR 26)

- **Kimlik:** Huge Fiend; eskiAd Erimiş Örs Muhafızı.
- **HP / AC / hız:** 627 HP (38d12+380) / AC 19 / 50 ft.
- **Yetenekler:** STR 30, DEX 16, CON 30, WIS 18, CHA 22. Yeterlilik +8. Kurtarma DEX +11, CON +18, WIS +12.
- **Savunma:** ateş bağışıklığı; **zayıflık soğuk**. Darkvision 120.
- **Hasar dağılımı:** %73 element / %27 fiziksel.
- **Multiattack:** Bite → Claw → Claw.
  - Her vuruş +12: 2d8+10 + 7d10 ateş (57,5).
  - Bite'ta yanma eki: tur başı 2d6 ateş, DC 21 CON ile biter (A2 `dot`, doğrulanacak).
- **Nefes, Cehennem Kükremesi:** 60 ft koni, DEX 21, 19d10 ateş (104,5).
- **Efsanevi eylemler:**
  - Kor Halesi: 10 ft, DEX 21, 4d8 ateş.
  - Alev Tükürüğü: 120 ft, +12, 6d10 ateş.
  - Kuyruk Süpürmesi: 10 ft, DEX 21, 2d8+10 ezici + Prone.
- **Sanat:** Erimiş Örs Patlaması. 15 ft, DC 16 DEX, 5d6 ateş + 10 ft itme. Birebir; 2 tur alev yüzeyi sığmıyor.
- **Desen:**
  - T1: nefes.
  - T2: Bite → Claw → Claw.
  - T3: nefes dolduysa nefes, değilse Multiattack.
  - Efsanevi eylemler: yakına Hale, uzağa Tükürük, arkaya Kuyruk.
- **Faz 1:** "Lav yeleli aslan dişlerini gösterir. Soğuk değen yerde pulları çatlıyor."
- **Faz 2 (`faz2`):** `zayiflikKaldir: ["cold"]`, nefes dolar, nefes 75 ft koni.
  - `gmNot` (PDF): kenar altıgenler 3 tur alev yüzeyi (`place_surface`); her tur başı 15 ft'e 2d6 ateş dalgası.
  - Anlatım: "Göğsündeki Kor Çekirdeği yarılıyor; alev artık soğukla sönmüyor."

### 5.2 `darkape`: Darkape, Kong of the Void (Kuvvet, CR 25)

- **Kimlik:** Huge Fiend; eskiAd Yörünge Nöbetçisi.
- **HP / AC / hız:** 578 HP (35d12+350) / AC 19 / 40 ft, tırmanma 40.
- **Yetenekler:** STR 30, CON 30, WIS 16. Kurtarma STR +18, CON +18, WIS +11.
- **Savunma:** kuvvet bağışıklığı; **zayıflık psişik**.
- **Hasar dağılımı:** %73 element / %27 fiziksel.
- **Multiattack:** Fist → Fist → Grab.
  - Her vuruş +12: 2d8+10 + 6d10 kuvvet (52).
  - Fist eki 10 ft itme; Grab eki Grappled (kaçış DC 21).
- **Nefes, Boşluk Kükremesi:** 60 ft koni, STR 21, 18d10 kuvvet (99) + Prone.
- **Efsanevi eylemler:**
  - Yerçekimi Halkası: 10 ft, STR 21, 4d8 kuvvet + Prone.
  - Boşluk Taşı: 120 ft, 6d10 kuvvet.
  - Arka Kol Savuruşu: 10 ft, DEX 21, 1d8+10 ezici + 15 ft itme.
- **Sanat:** Yıldız Çöküşü. 15 ft çekme (STR 16), sonra 10 ft'te 6d6 kuvvet + Prone. Yaklaşık: iki yetenek.
- **Desen:**
  - T1: nefes.
  - T2: Fist → Fist → Grab.
  - T3: nefes ya da Multiattack.
  - Efsanevi eylemler: Halka yakına, Taş uzağa, Savuruş arkaya.
- **Faz 1:** "Kara kürklü dev yerçekimini yumruğunda tutuyor; fısıltılar onu sendeletiyor."
- **Faz 2:** `zayiflikKaldir: ["psychic"]`, nefes dolar, nefes 75 ft.
  - `gmNot`: düşük yerçekimi (itme/çekme +5 ft); her 2 turda merkez çekim 15 ft.
  - Anlatım: "Boşluk Kırığı göğsünde açılıyor; artık hiçbir ses aklına ulaşmıyor."

### 5.3 `cerbones`: Cerbones, Crematorium (Nekrotik, CR 24)

- **Kimlik:** Huge Fiend, üç başlı; eskiAd Kemik Toplayıcı Lord.
- **HP / AC / hız:** 527 HP (34d12+306) / AC 19 / 50 ft.
- **Yetenekler:** STR 30, CON 28. Kurtarma CON +16, WIS +10.
- **Savunma:** nekrotik bağışıklığı; **zayıflık ışıltı**.
- **Hasar dağılımı:** %74 element / %26 fiziksel.
- **Multiattack:** Bite × 3, sabit.
  - SRD `heads` kullanılmaz: baş çoğalırsa Cimbombom'un 3 saldırısını aşar.
  - Her vuruş +12: 1d8+10 + 6d10 nekrotik (47,5).
  - Can emme: `monsterDrain` (yaklaşık).
- **Nefes, Krematoryum Nefesi:** 60 ft koni, CON 21, 16d10 nekrotik (88) + noHeal 1 tur.
- **Efsanevi eylemler:**
  - Kül Halesi: 10 ft, CON 21, 3d8 nekrotik.
  - Kara Kıvılcım: 120 ft, 5d10.
  - Kuyruk Süpürmesi: 10 ft, DEX 21, 1d8+10 + Prone.
- **Sanat:** Kara Alev Kesiği. 25 ft çizgi, DC 16 CON, 5d6 + noHeal. Maks. HP törpüleme sığmıyor.
- **Desen:**
  - T1: nefes.
  - T2: sol, orta, sağ baş.
  - T3: nefes ya da üç baş.
- **Faz 1:** "Üç kafatası aynı anda nefes alıyor; ışık kemiklerindeki külü dağıtıyor."
- **Faz 2:** `zayiflikKaldir: ["radiant"]`, nefes dolar, nefes 75 ft.
  - `gmNot`: her tur başı 2 iskelet (Game Master çağırır); +1d8 kara alev ve 10 ft iyileşme yarılaması elle.
  - Anlatım: "Mezar Küresi kararıyor; ışık artık kemiğe işlemiyor."

### 5.4 `mirage`: Mirage, Life Stealer (Psişik, CR 24)

- **Kimlik:** Medium Fiend; eskiAd Ayna Zihin Avcısı.
- **HP / AC / hız:** 525 HP (50d8+300) / AC 19 / 40 ft.
- **Yetenekler:** STR 30, DEX 18, INT 20, CHA 22. Kurtarma DEX +11, INT +12, CHA +13.
- **Savunma:** psişik bağışıklığı; Charmed ve Frightened bağışıklığı; **zayıflık kuvvet**.
- **Hasar dağılımı:** %74 element / %26 fiziksel.
- **Multiattack:** Soul Claw × 3.
  - Her vuruş +12: 1d8+10 + 6d10 psişik (47,5).
  - İlk pençede Charmed (WIS 21, sonraki turunun sonuna dek).
- **Nefes, Zihin Dalgası:** 60 ft koni, INT 21, 16d10 psişik (88) + Charmed.
- **Efsanevi eylemler:**
  - Ayna Çığlığı: 10 ft, INT 21, 3d8 + Stunned (sonraki turunun sonuna dek).
  - Zihin İğnesi: 120 ft, 5d10.
  - Yansıma Süpürmesi: 10 ft, DEX 21, 1d8+10 kesici + 10 ft itme.
  - Misty Step 3/gün (bonus).
- **Sanat:** Zihin Kıran Çığlık. 20 ft, DC 16 INT, 5d6 + Stunned. Birebir.
- **Desen:**
  - T1: nefes.
  - T2: üç pençe.
  - T3: Misty Step ile arkaya geçer, sonra nefes ya da pençe.
- **Faz 1:** "Yüzünde senin yüzün var. Bir kılıç darbesi görüntüsünü titretiyor."
- **Faz 2:** `zayiflikKaldir: ["force"]`, nefes dolar, nefes 75 ft.
  - `gmNot`: Mirror Image 3 suret (canavar büyüsü); her tur başı bir oyuncuya Frightened; sis.
  - Anlatım: "Vesvese Kristali çatlıyor; suretlerin hangisinin gerçek olduğunu artık kuvvet de göstermiyor."

### 5.5 `gongar`: Gongar, Bell Shell Brute (Gürültü, CR 23)

- **Kimlik:** Huge Fiend; eskiAd Kör Çan Devi.
- **HP / AC / hız:** 465 HP (30d12+270) / AC 20 / 30 ft.
- **Yetenekler:** STR 28, CON 28. Kurtarma STR +16, CON +16.
- **Savunma:** gürültü bağışıklığı; Deafened bağışıklığı. Blindsight 60. **Zayıflık yıldırım** (tunç kabuk). `siegeMonster`.
- **Hasar dağılımı:** %76 element / %24 fiziksel.
- **Multiattack:** Bell Slam → Bell Slam → Shell Ram.
  - Her vuruş +11: 1d8+9 + 6d10 gürültü (46,5).
  - Slam eki 10 ft itme; Ram eki Deafened.
- **Nefes, Çan Kükremesi:** 60 ft koni, CON 20, 15d10 gürültü (82,5) + 15 ft itme + Prone.
- **Efsanevi eylemler:**
  - Çan Titreşimi: 10 ft, CON 20, 3d8 + Deafened.
  - Yankı Mermisi: 120 ft, 5d10.
  - Kabuk Dönüşü: 10 ft, DEX 20, 1d8+9 + Prone.
- **Sanat:** Kanyon Yırtığı. 30 ft çizgi, DC 16 CON, 5d6 + 15 ft itme + Prone + Deafened.
- **Desen:**
  - T1: nefes.
  - T2: Slam → Slam → Ram.
  - T3: nefes ya da Multiattack.
- **Faz 1:** "Kabuğu çalan her darbe kanyonda yankılanıyor; şimşek tuncunu kızartıyor."
- **Faz 2:** `zayiflikKaldir: ["lightning"]`, nefes dolar, nefes 75 ft.
  - `gmNot`: tur başı 10 ft DC 15 CON yoksa Prone (`set_condition`); sütunlar yıkılır.
  - Anlatım: "Çınlama Mührü kabuğu kaplıyor; yıldırım artık metale tutunmuyor."

### 5.6 `lightaur`: Lightaur, Bull of Celestial (Işıltı, CR 23)

- **Kimlik:** Large Celestial; eskiAd Kırık Hale Şövalyesi.
- **HP / AC / hız:** 432 HP (32d10+256) / AC 19 / 50 ft.
- **Yetenekler:** STR 28, CON 26, WIS 18, CHA 20. Kurtarma CON +15, WIS +11, CHA +12.
- **Savunma:** ışıltı bağışıklığı; Blinded bağışıklığı. `illumination` 20. **Zayıflık nekrotik.**
- **Kendini iyileştirme:** `regeneration` 10. Etkin cana +30 sayıldı; ham HP bu yüzden Gongar'dan düşük.
- **Hasar dağılımı:** %76 element / %24 fiziksel.
- **Multiattack:** Gore → Hoof → Hoof.
  - Her vuruş +11: 1d8+9 + 6d10 ışıltı (46,5).
  - Gore eki Blinded (CON 20); hücum eki.
- **Nefes, Göksel Nefes:** 60 ft koni, CON 20, 15d10 ışıltı (82,5) + Blinded.
- **Efsanevi eylemler:**
  - Hale Parıltısı: 10 ft, CON 20, 3d8 + Blinded.
  - Işın Mızrağı: 120 ft, 5d10.
  - Arka Toynak: 10 ft, DEX 20, 1d8+9 + 10 ft itme.
- **Sanat:** Altın Yargı Sütunu. 10 ft küre, DC 16 CON, 6d6 + Blinded. 40 ft silindir ve karanlık dağıtma sığmıyor.
- **Desen:**
  - T1: hücumlu Gore → Hoof → Hoof.
  - T2: nefes.
  - T3: Multiattack.
- **Faz 1:** "Kırık halesi boynuzlarında yanıyor; gölge değen yerden ışığı sızıyor."
- **Faz 2:** `zayiflikKaldir: ["necrotic"]`, nefes dolar, nefes 75 ft.
  - `gmNot`: parlak arena; tur başı 15 ft DC 15 CON yoksa Blinded.
  - Anlatım: "Kör Güneş Parçası tavanı yırtıyor; artık hiçbir gölge onu yaralamıyor."

### 5.7 `hydraxe`: Hydraxe, Sulphur Hydra (Asit, CR 22)

- **Kimlik:** Huge Fiend, çok başlı görünüm; sabit 3 ısırık. eskiAd Sülfür Hidrası.
- **HP / AC / hız:** 419 HP (27d12+243) / AC 19 / 30 ft, yüzme 40.
- **Yetenekler:** STR 28, CON 28. Kurtarma CON +16.
- **Savunma:** asit bağışıklığı; **zayıflık ateş** (başlar ateşle dağlanır).
- **Hasar dağılımı:** %73 element / %27 fiziksel.
- **Multiattack:** Bite × 3.
  - Her vuruş +11: 1d8+9 + 5d10 asit (41).
  - Her ısırıkta zırh aşındırma (A2, AC −1).
- **Nefes, Sülfür Fışkırması:** 60 ft çizgi (10 ft), DEX 20, 13d10 asit (71,5) + AC −2 (1 dk).
- **Efsanevi eylemler:**
  - Asit Salyası: 10 ft, DEX 20, 3d8.
  - Asit Tükürüğü: 120 ft, 4d10.
  - Kuyruk Süpürmesi: 10 ft, DEX 20, 1d8+9 + Prone.
- **Sanat:** Sülfür Tufanı. 15 ft küre, DC 16 DEX, 5d6 + AC −3. Yüzey sığmıyor.
- **Desen:**
  - T1: nefes.
  - T2: üç ısırık aynı hedefe.
  - T3: nefes ya da ısırık.
- **Faz 1:** "Başlarından duman tütüyor; meşale yaklaştıkça boyunlar geriliyor."
- **Faz 2:** `zayiflikKaldir: ["fire"]`, nefes dolar, nefes 75 ft çizgi.
  - `gmNot`: kopan başın 10 ft'i asit yüzeyi; yakın dövüşte saldırana 1d8 asit.
  - Anlatım: "Erime Damlası boyunlara yayılıyor; ateş artık dağlamıyor."

### 5.8 `mothraq`: Mothraq, Spore Moth (Zehir, CR 22)

- **Kimlik:** Huge Fiend; eskiAd Spor Hükümdarı.
- **HP / AC / hız:** 421 HP (29d12+232) / AC 19 / 20 ft, uçuş 60.
- **Yetenekler:** STR 28, DEX 18, CON 26. Kurtarma DEX +11, CON +15.
- **Savunma:** zehir bağışıklığı; Poisoned bağışıklığı. **Zayıflık ışıltı.**
- **Hasar dağılımı:** %73 element / %27 fiziksel.
- **Multiattack:** Proboscis → Wing → Wing.
  - Her vuruş +11: 1d8+9 + 5d10 zehir (41).
  - Proboscis eki Poisoned, ikinci başarısızlıkta Paralyzed (A2 `escalate`).
- **Nefes, Spor Fırtınası:** 60 ft koni, CON 20, 13d10 zehir (71,5) + Poisoned.
- **Efsanevi eylemler:**
  - Spor Patlaması: 10 ft, CON 20, 3d8 + Poisoned.
  - Zehir İğnesi: 120 ft, 4d10.
  - Kanat Süpürmesi: 10 ft, DEX 20, 1d8+9 + 10 ft itme.
  - Bonus: Poisoned hedefi 30 ft çekme (`pull`).
- **Sanat:** Veba Bulutu. 15 ft küre, DC 16 CON, 4d6 + Poisoned. Kalıcı bulut ve direnç aşma sığmıyor.
- **Desen:**
  - T1: nefes.
  - T2: Proboscis → Wing → Wing.
  - T3: zehirliyi çeker, sonra Multiattack.
- **Faz 1:** "Kanatlarından spor yağıyor; meşalenin ışığı tozunu yakıyor."
- **Faz 2:** `zayiflikKaldir: ["radiant"]`, nefes dolar, nefes 75 ft.
  - `gmNot`: 3 hareketli zehir bulutu; 20 ft'teki ölüler spor hizmetkârı.
  - Anlatım: "Ağu Özü kanatlara işliyor; ışık artık sporları yakmıyor."

### 5.9 `stormer`: Stormer, Thunder Stallion (Yıldırım, CR 21)

- **Kimlik:** Large Fiend; eskiAd Şimşek Süvarisi.
- **HP / AC / hız:** 338 HP (25d10+200) / AC 19 / 90 ft.
- **Yetenekler:** STR 28, DEX 20, CON 26. Kurtarma DEX +12, CON +15.
- **Savunma:** yıldırım bağışıklığı. **Zayıflık yok:** SRD türlerinde yıldırımın doğal karşıtı yok, gürültü aynı fırtınanın parçası; zorla eklenmedi.
- **Hasar dağılımı:** %72 element / %28 fiziksel.
- **Multiattack:** Hoof → Hoof.
  - Her vuruş +11: 2d8+9 + 7d10 yıldırım (56,5; Cimbombom'un 57,5'inin altında).
  - Hücum eki; bonus Dash/Disengage.
- **Nefes, Şimşek Yeli:** 100 ft çizgi (10 ft), DEX 20, 12d10 yıldırım (66) + tepki yok. Suda zincir.
- **Efsanevi eylemler:**
  - Şimşek Toynağı: 10 ft, DEX 20, 2d8.
  - Zincir Şimşek: 120 ft, 3 ışın × 2d6.
  - Arka Tekme: 10 ft, DEX 20, 1d8+9 + 10 ft itme.
- **Sanat:** Gök Mızrağı. 10 ft küre, DC 16 DEX, 6d6 + tepki yok; su zinciri. Birebir.
- **Desen:**
  - T1: koşup nefes.
  - T2: Hoof → Hoof, Disengage ile uzaklaşır.
  - T3: nefes ya da Multiattack.
- **Faz 1:** "Yelesi şimşek; durduğu yerde hiç kalmıyor."
- **Faz 2:** kaldırılacak zayıflık yok.
  - Yerine `geciciCan: 42` (yarı canın %25'i; diğerlerinin zayıflık kazancına eş). Nefes dolar, nefes 125 ft çizgi.
  - `gmNot`: yağmur, tepeye ya da metal zırhlıya yıldırım.
  - Anlatım: "Fırtına Mili yeleye saplanıyor; gök artık onun için çakıyor."

### 5.10 `wolfgang`: Wolfgang, Blizzard Wolf (Soğuk, CR 20)

- **Kimlik:** Huge Fiend; eskiAd Tipi Yutan Dev.
- **HP / AC / hız:** 319 HP (22d12+176) / AC 19 / 50 ft, tırmanma 30.
- **Yetenekler:** STR 26, CON 26. Kurtarma CON +14, WIS +8.
- **Savunma:** soğuk bağışıklığı; Ice Walk. **Zayıflık ateş.**
- **Hasar dağılımı:** %73 element / %27 fiziksel.
- **Multiattack:** Bite → Claw.
  - Her vuruş +10: 1d8+8 + 6d10 soğuk (45,5).
  - Bite eki Restrained (STR 19); Claw eki hız yarı.
- **Nefes, Tipi Nefesi:** 60 ft koni, CON 19, 10d10 soğuk (55) + Restrained.
- **Efsanevi eylemler:**
  - Ayaz Halesi: 10 ft, CON 19, 2d8 + hız yarı.
  - Buz Mızrağı: 120 ft, 3d10.
  - Kuyruk Süpürmesi: 10 ft, DEX 19, 1d8+8 + Prone.
- **Sanat:** Kırağı Nefesi. 20 ft koni, DC 16 CON, 5d6 + Restrained. Birebir.
- **Desen:**
  - T1: nefes.
  - T2: Bite (tutar) → Claw (yavaşlatır).
  - T3: nefes ya da Multiattack.
- **Faz 1:** "Tipi onunla geliyor; meşale yaklaşınca geri çekiliyor."
- **Faz 2:** `zayiflikKaldir: ["fire"]`, nefes dolar, nefes 75 ft.
  - `gmNot`: haritanın yarısı buz; tipi görüşü 30 ft.
  - Anlatım: "Ayaz Kalbi kükrüyor; alev artık buzunu eritmiyor."

### 5.11 Güç sıralaması

Sıra Serüven'in doğudan batıya akışını izler: Buzul → Dağ → Orman ve Bataklık → Çöl ve Katedral → Derinlikler → Gözlemevi → Volkan (final).

| CR | Boss | Gerekçe |
|---|---|---|
| 26 | Cimbombom | Final; her değerin tavanı |
| 25 | Darkape | Volkan portalından önceki son eşik |
| 24 | Cerbones, Mirage | **Paylaşılan:** Derinliklerin iki kapısı, sırası serbest |
| 23 | Gongar, Lightaur | **Paylaşılan:** Çöl kanyonu ve katedral aynı aşamada |
| 22 | Hydraxe, Mothraq | **Paylaşılan:** Orman ve Bataklık komşu, ikisi de yıpratma bossu |
| 21 | Stormer | Dağ |
| 20 | Wolfgang | Buzul, ilk bölge bossu |

CR 20–25 arasında dokuz boss için 6 değer var; en az 3 eş gerekir. Eşler, sırası serbest olan aynı aşamadaki bölgelerden seçildi.

## 6. Sığmayanlar (F Aşama 2'de `KATALOG-SIGMAYAN.md`)

Faz tetiği ve zayıflığın kalkması artık §3'te (KATALOG-F0). Kalanlar:

| Boşluk | Boss | Yaklaşık yol | Önerilen yol |
|---|---|---|---|
| Canavar eylemiyle yüzey | 5 | `place_surface` (Game Master) | Canavar `save` yeteneğine `surface` |
| PDF Faz 2 arena dönüşümü (buz, yağmur, sis, ışık, yerçekimi, çağırma) | 10 | `gmNot` | Faz bloğuna `harita`/`cagir` alanları (ayrı görev) |
| Kalıcı bulut, direnç aşma | Mothraq | anlık save | `zone` + `ignoreResist` |
| Zorla hareket bağışıklığı | Gongar, Darkape | yok | `forcedImmune` |
| Dokunana asit | Hydraxe | elle | `meleeRetaliate` |
| Silindir alan, karanlık dağıtma | Lightaur | küre | canavar alanına `cylinder` |
| İyileşme yarılama, maks. HP bağışıklığı | Cerbones | elle | aurada `healMult` |
| Tek eylemde çek + vur | Darkape | iki yetenek | yetenekte `then` |
| Uzaktakini seçen ışın | 10 | yapay zekâ en yakını seçer | `rays` hedef kipi `far` |
| Sahte gölge çağırma | Mirage | `summon` Shadow | — |
| Hamle değişimi (örn. "kuyruk önce") | 10 | `gmNot` | yapay zekâ önceliği alanı |

## 7. Denge planı (F Aşama 2; KATALOG-F0'dan sonra)

`npm run sim:boss -- 100`, yeni parti yok.

| Kademe | Parti | Normal | Kolay | Kol |
|---|---|---|---|---|
| Sv.1 (CR 2–3) | `standart`, seviye 3 | Sv.1 ×2 | Sv.1 ×1 | yalnız dirençsiz (olağan karşılaşma) |
| Sv.2 (CR 8–10) | `standart`, seviye 9 | Sv.2 ×1 + Sv.1 ×2 | Sv.2 ×1 | yalnız dirençsiz |
| Sv.3 (CR 20–26) | 12 sınıflık `k18-<sınıf>` duman partileri, seviye 20 (K10) | boss ×1 + Sv.2 ×1 | boss ×1 | (a) dirençsiz (b) hazırlıklı |

- **Kol (b), hazırlıklı:** yalnız sim kodunda bir seçenek, örneğin `bossRun.ts` `--hazirlik`. Savaş başında parti üyelerine mevcut olayla (`effect_added`, `resist: [<element>]`) süresiz direnç verilir. Motor mekaniği değildir; yeni parti sayılmaz.
  - Sim partisi karşı elementi bilerek getirmez (f = 0). Bu yüzden Faz 1 ölçümü belgedeki varsayımdan biraz daha zordur; DENGE.md'ye not düşülür.
- **Hedef:** yalnız kol (b) için Normal %45–65, Kolay %70–85. Kol (a) "dirençsiz parti ezilir (bilerek)" notuyla yazılır.
- **Satır sayısı:**
  - Sv.1 ve Sv.2: 20 çizgi-kademe × 2 zorluk = 40 satır.
  - Boss: 10 boss × 12 parti × 2 kol × 2 zorluk = 480 koşu satırı. DENGE.md'de boss başına 12 partinin ortalaması ve en düşük/en yüksek değeri yazılır.
- **Süre riski (K11):** 20. seviyede 48.000 savaş uzun sürebilir.
- Aralık dışı satırlar DENGE.md'ye yazılır, düzeltilmez.

## 8. Evrim çizgileri: Sv.1 ve Sv.2 (20 yaratık)

PDF'te yok, kullanıcının tasarımı. Kimlik = dosya adı. Görünen ad kimliğin büyük harfle başlayan hâli. Tür, element bağışıklığı ve zayıflık bossunkiyle aynı. Faz 2 bloğu, efsanevi direnç ve efsanevi eylem yok. Olağan karşılaşma, hazırlıksız parti, element payı ≈ %50.

| Alan | Sv.1 (CR 2–3) | Sv.2 (CR 8–10) |
|---|---|---|
| HP / AC | CR 2: 60 / 13; CR 3: 75 / 14 | CR 8: 150 / 16; CR 9: 170 / 16; CR 10: 190 / 17 |
| Saldırı / DC | +5 / 12 | +7 (CR 10: +8) / 16 |
| Saldırı | CR 2: 1 saldırı 1d10+3 + 2d6 element (≈ 15); CR 3: 2 × (1d8+3 + 1d6) (≈ 22) | 2 saldırı: CR 8 2d8+5 + 2d8 (≈ 46); CR 9 2d8+5 + 2d10 (≈ 52); CR 10 2d8+6 + 3d8 (≈ 57) |
| Küçük sanat | yok | Bossun nefes şeklinin yarısı, Recharge 5–6, DC 16, 4d6 (CR 10: 5d6) |
| Durum bağışıklığı | yok (zehirde Poisoned) | bossunki |
| Ganimet | Çatlak Taş | Uyanmış Taş |

| Çizgi | Sv.1 | Sv.2 |
|---|---|---|
| Ateş | **`cim`** CR 3, Small, 40 ft; 2 Bite (yanma eki 1d4); zayıflık soğuk | **`cimbom`** CR 10, Large, 50 ft; Bite → Claw; Küçük Cehennem Kükremesi 30 ft koni DEX |
| Soğuk | **`doggie`** CR 2, Small, 40 ft; Bite (hız yarı); Ice Walk; zayıflık ateş | **`wolfie`** CR 8, Large, 50 ft, tırmanma 20; Bite (Restrained) → Claw; 30 ft koni CON + Restrained |
| Yıldırım | **`sparkle`** CR 2, Small, 60 ft; Hoof; bonus Disengage; zayıflık yok | **`thunderse`** CR 8, Large, 70 ft; Hoof → Hoof (hücum); 50 ft çizgi DEX + tepki yok |
| Gürültü | **`twinkle`** CR 3, Small, 25 ft; 2 Bell Tap (5 ft itme); Blindsight 30; zayıflık yıldırım | **`gongi`** CR 9, Large, 30 ft; Slam (10 ft itme) → Ram (Deafened); 30 ft koni CON + Prone; `siegeMonster` |
| Asit | **`hydrop`** CR 2, Small, 20 ft, yüzme 30; Bite; zayıflık ateş | **`hydras`** CR 8, Large, 30 ft, yüzme 40; 2 Bite (AC −1 aşındırma); 30 ft çizgi DEX |
| Zehir | **`sporlet`** CR 2, Small, 10 ft, uçuş 30; Proboscis (Poisoned, DC 12); zayıflık ışıltı | **`mothcoon`** CR 8, Large, 20 ft, uçuş 50; Proboscis (Poisoned → Paralyzed) → Wing; 20 ft çekme; 30 ft koni CON |
| Işıltı | **`lumbo`** CR 3, Small, 40 ft; 2 Gore; `illumination` 10; zayıflık nekrotik; Celestial | **`lighty`** CR 9, Large, 50 ft; Gore (Blinded) → Hoof; `regeneration` 5; 30 ft koni CON + Blinded; Celestial |
| Nekrotik | **`cerbit`** CR 3, Small, 40 ft; 2 Bite; zayıflık ışıltı | **`cerbedo`** CR 9, Large, 50 ft; 2 Bite (`monsterDrain`); 30 ft koni CON + noHeal |
| Psişik | **`mirit`** CR 3, Small, 35 ft; 2 Soul Claw; zayıflık kuvvet | **`mirath`** CR 9, Medium, 40 ft; Soul Claw (Charmed, WIS 16) → Soul Claw; Misty Step 1/gün; 30 ft koni INT (Stunned yok) |
| Kuvvet | **`darkit`** CR 3, Small, 30 ft, tırmanma 30; 2 Fist (5 ft itme); zayıflık psişik | **`darkath`** CR 9, Large, 40 ft, tırmanma 40; Fist (10 ft itme) → Grab (Grappled DC 16); 15 ft çekme; 30 ft koni STR + Prone |

- Sv.1: ilk dört bölge (Buzul, Dağ, Orman, Bataklık) CR 2, diğerleri CR 3.
- Sv.2: ilk dört bölge CR 8, diğerleri CR 9, Cimbom CR 10.
- Ortam bossunkiyle aynı; Sv.1 ayrıca bölgenin ilk haritasına eklenir.
- Hepsi mevcut veri alanlarıyla birebir; sığmayan parça yok.

## 9. `gmNot`: Faz 2'nin Game Master payı

Faz 2'nin mekanik kısmını (zayıflık, nefes, alan, Stormer'ın geçici canı) motor uygular. `gmNot` yalnızca PDF arena değişimini taşır. Kart ve günlükte "Game Master notu" olarak görünür. Örnek (Cimbombom):

> Taş Uyanışı: arena kenarındaki altıgenleri 3 tur alev yüzeyi yap (`place_surface`); bossun her tur başında 15 ft içindekilere 2d6 ateş uygula.

## 10. On boss: özet tablo (dirençli ve hazırlıklı parti)

- **Tur hasarı:** Multiattack + nefes (Faz 1'de 2 hedef, 3 turda bir) + 3 efsanevi eylem; sanat dahil değil. "Dirençli" = ham × 0,625.
- **Faz 2:** nefes 2,5 hedef ve yeniden dolumun 4 tura yayılmış payı.
- **Ağırlıklı:** Faz 1 × 1/2,25 + Faz 2 × 1,25/2,25 (Faz 2 %25 uzun sürer). Bu değer CR'nin saldırı bandına oturur.
- **Dayanıklılık:** yarı canın etkin değeri. Faz 1 = yarı can / 1,25 (zayıflık açık), Faz 2 = yarı can (+ Stormer'da geçici can).

| Sıra | Boss | CR | HP | Etkin HP | Vuruş (ort.) | Saldırı | Faz 1 tur hasarı ham / **dirençli** | Faz 2 tur hasarı ham / **dirençli** | Ağırlıklı dirençli (DMG bandı) | Dayanıklılık Faz 1 → Faz 2 | Zayıflık (Faz 2'de) | Faz 2 değişimi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **1** | **Cimbombom** | **26** | **627** | **654** | **57,5** | **3** | **349 / 218** | **410 / 256** | **239** (231–248) | 251 → 314 | soğuk (kalkar) | nefes dolar, 75 ft |
| 2 | Darkape | 25 | 578 | 610 | 52 | 3 | 320 / 200 | 378 / 236 | 220 (213–230) | 231 → 289 | psişik (kalkar) | nefes dolar, 75 ft |
| 3 | Cerbones | 24 | 527 | 564 | 47,5 | 3 | 285 / 178 | 336 / 210 | 196 (195–212) | 211 → 264 | ışıltı (kalkar) | nefes dolar, 75 ft |
| 3 | Mirage | 24 | 525 | 563 | 47,5 | 3 | 285 / 178 | 336 / 210 | 196 (195–212) | 210 → 263 | kuvvet (kalkar) | nefes dolar, 75 ft |
| 5 | Gongar | 23 | 465 | 509 | 46,5 | 3 | 276 / 173 | 324 / 203 | 189 (177–194) | 186 → 233 | yıldırım (kalkar) | nefes dolar, 75 ft |
| 5 | Lightaur | 23 | 432 | 509 | 46,5 | 3 | 276 / 173 | 324 / 203 | 189 (177–194) | 173 → 216 (+10/tur yenilenme) | nekrotik (kalkar) | nefes dolar, 75 ft |
| 7 | Hydraxe | 22 | 419 | 467 | 41 | 3 | 247 / 154 | 288 / 180 | 169 (159–176) | 168 → 210 | ateş (kalkar) | nefes dolar, 75 ft çizgi |
| 7 | Mothraq | 22 | 421 | 469 | 41 | 3 | 247 / 154 | 288 / 180 | 169 (159–176) | 169 → 211 | ışıltı (kalkar) | nefes dolar, 75 ft |
| 9 | Stormer | 21 | 338 | 428 | 56,5 | 2 | 223 / 139 | 262 / 163 | 152 (141–158) | 169 → 211 (geçici 42) | yok | geçici 42, nefes dolar, 125 ft çizgi |
| 10 | Wolfgang | 20 | 319 | 377 | 45,5 | 2 | 187 / 117 | 219 / 137 | 128 (123–140) | 128 → 160 | ateş (kalkar) | nefes dolar, 75 ft |

- **Bütün bosslarda Faz 2 dayanıklılığı Faz 1'in 1,25 katı:** zayıflığın kalkmasından ya da Stormer'ın geçici canından, bir kez.
- **Faz 2 hasarı Faz 1'in ≈ 1,17 katı:** nefesten.
- Ek AC, saldırı, hasar zarı ve efsanevi hak yok; çift telafi yok.
- **Cimbombom bütün sütunlarda zirvede:** HP, etkin HP, vuruş başı hasar, saldırı sayısı, nefes (19d10), iki fazın tur hasarı ve ağırlıklı hasar. Aynı fazlar karşılaştırıldığında her boss Cimbombom'un altında kalır: Darkape Faz 1'de 200 < 218, Faz 2'de 236 < 256. Bir bossun Faz 2'si Cimbombom'un Faz 1'ini aşabilir (Darkape 236 > 218), ama o anda Cimbombom da Faz 2'deyse 256'dır.

## 11. Kadim yaratıklar (K5: F2)

PDF'te var: Kıta Ejderhası V-I ve V-II, Kozmik Anka Kuşu, beş Mücevher Ejderhası, Uçurumun Yıldız-Kâbusu. Uyum tablosu bu belgenin ilk sürümünde (commit 8aa87011) ve F2'ye taşınır. Kozmik Anka'nın "Küllerden Yeniden Doğuş" ve Kraken'in "0 HP'de 2. faz" güçleri §3'teki faz kuralına benzer. F2'de faz bloğu eşik 0 ve "canlan" alanıyla genişletilebilir (o görevin kararı).

## 12. Açık sorular

- **K11. Boss sim süresi.** 12 parti × 10 boss × 2 kol × 2 zorluk × 100 tohum = 48.000 savaş, 20. seviyede.
  - Öneri: önce tek boss (Wolfgang) ile süreyi ölç. Bir saati aşacaksa 4 temsilci partiye in (`k18-fighter`, `k18-cleric`, `k18-wizard`, `k18-rogue`).
- **K12. Faz 2 motor görevi ayrı mı?** Öneri: ayrı görev KATALOG-F0 (kural sürümü 107, kayıt sürümü 28), F Aşama 2'den önce; KATALOG-2 kancalarıyla birleşmez (§3.8).
