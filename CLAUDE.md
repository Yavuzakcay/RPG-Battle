# RPG-Battle

## Proje özeti

D&D 5e **SRD 5.2.1** (CC-BY-4.0) tabanlı, Türkçe arayüzlü altıgen haritalı savaş simülatörü (React + TypeScript + Vite).

- Oyuncular en çok 6 özel karakter oluşturur (`MAX_PARTY`, `src/app/limits.ts`) (ırk, sınıf, alt sınıf, seviye, cinsiyet; 240 pixel-art jeton). Seviye yuvalarında ASI ya da feat, köken feat'i ve uzmanlık seçilir; 6+ seviye "deneysel" uyarısı veriden. Savaş sonrası HP/kaynak/slot karakterde kalır; kısa ve uzun dinlenme karakter listesinde ve Game Master kurulumunda. Masumların 8 görünümü `data/masumlar.json` ve `public/masumlar/` altında (Gemini üretimi; `npm run masumlar` ile ham görsellerden üretilir).
- GM önce haritayı, sonra düşmanları seçer: 330 SRD canavarı, haritanın ortam listesine göre süzülür, güç kademelerine ayrılır (çoklu kademe filtresi). "Tüm canavarlar" hepsini açar. Özel canavar eklenip silinebilir; CR'si otomatik tahmin edilir. Örnek karakterler arayüzde yok, yalnızca `src/screens/fixtures.ts` (testler).
- Savaş 15×7 altıgen (flat-top, odd-q, 5 ft) haritalarda oynanır. 12 harita, varyantlar ve harita kuralları var: lav, bataklık, karanlık, gece, tuzak, kapı, uyuyan ejderha…
- Gizlenme (Hide): haritanın gizlenme yerlerinde, DC 15 ve onu gören düşmanların pasif Algısına karşı; gece ışıksız altıgende kolaylaşır. Saklanma bölgeleri haritada gösterilir.
- Zarlar otomatik ya da fiziksel: Game Master kurulumda "Zar modu" seçer (otomatik / yalnızca oyuncular / herkes); fiziksel zarda oyun gereken zarı ister. Atılan zarlar kısa bir animasyonla gösterilir (Normal / Hızlı / Kapalı); zar görselleri temalı (`data/zar-gorselleri.json`, şimdilik Klasik). Normal hızda ve yeterli cihazda zarlar 3D atılır (`src/ui/dice3d/`, three.js tembel parça), yoksa 2D.
- Ses (Web Audio): menülerde ve Game Master kurulumunda temaya göre menü müziği, savaş ekranında haritanın ortam sesi + savaş müziği, zar sesleri, savaş sonunda zafer/yenilgi ezgisi ve görsel efekt; "Ses" ayarları (ana, ortam, müzik, efekt). Eşleme `data/ses.json` (koşullu kurallar: Volkan'da ejderha → gece müziği), dosyalar `public/ses/` (`npm run ses`; ham `assets-ham/ses/`, Suno).
- Alan büyüleri, canavar nefesleri ve Dragonborn nefesi koni/çizgi/küre olarak haritada önizlenir; alandaki herkes save yapar.
- Büyücüler yaratık çağırabilir (Find Familiar kurulumda ritüelle, Find Steed, Summon Dragon); çağrılanı sahibinin oyuncusu oynatır ya da "Yapay zekâ oynasın".
- Yapay zekâ iki tarafı da oynayabilir. Denge simülasyonu `npm run sim` ile ölçülür (senaryolar paralel), sonuçlar `docs/harita/DENGE.md`'de seviye başına. Simülasyon partileri `data/sim-partiler.json` (üye başına 5. seviye sheet + `levels.<N>` seçimleri; SRD'ye göre eksiksiz: alt sınıf, köken feat'i, ASI, tablo kadar büyü — test denetler; yeni sınıf partisi buraya eklenir; alt sınıf boşsa motor SRD'nin tek alt sınıfını varsayar), senaryolar ve seviyeye göre düşman listeleri `data/sim-senaryolar.json` (`enemies.<seviye>`; 1/3/5 var, 8, 11… eklenebilir).

## Mimari kurallar

- **Command → `execute` → Events → reducer.**
  - Her oyun değişikliği bir komuttur (`src/battle/types.ts` `Command`).
  - `execute(state, cmd, ctx, rng)` doğrular ve olay listesi üretir.
  - Durum yalnızca `applyEvent` (reducer, `src/battle/reduce.ts`) ile değişir.
  - Olaylar baştan oynatılınca aynı durum çıkmalı (`replay`).
- **Saf kural modülleri.**
  - `src/rules/*` ve `src/battle/*` yan etkisizdir; React, DOM ya da `localStorage` içermez.
  - Arayüz (`src/MapBattle.tsx`, `src/screens/*`, `src/ui/*`) yalnızca komut gönderir ve durumu çizer.
- **Rng enjeksiyonu.**
  - Zar atan her fonksiyon `rng: Rng` parametresi alır; `Math.random` doğrudan çağrılmaz.
  - Testler `scripted(...)`, simülasyon `seeded(seed)` kullanır; sonuçlar tekrarlanabilir.
  - Zar çağrılarına kimin/ne için attığı `rollTag(rng, { by, kind })` ile iliştirilir; kancasız Rng'de etkisizdir.
  - Elle zar (`src/rules/manualDice.ts`): adım `(rng) => sonuç` olarak zar defteri üstünden çalışır; elle zar gerekince `NeedDice`, arayüz zarı ister ve adımı aynı zarlarla yeniden çalıştırır. Simülasyon her zaman otomatik atar; yapay zekâ turunun zarları zar moduna göre Game Master'dan istenir.
  - Arayüzden gelen her adımın zarları `dice_rolled` olayına yazılır (durumu değiştirmez; zar animasyonu ve elle girilen zarların kaydı).
- **Canavar ve sınıf verisi tembel yüklenir:** `loadMonsters()` çağrılmadan `getMonster`, `loadClassData()` çağrılmadan sınıf ilerlemesi (`getProgression`, `deriveStats`, `combatantFromSheet`) çalışmaz. Testler `src/test-setup.ts` ile, simülasyon betikleri en üstte `await Promise.all([loadMonsters(), loadClassData()])` ile yükler; uygulama karakter ekranlarından önce yükler.
- **Kimlik kuralı:** Yeni eklenen her büyü, özellik, tür özelliği (`species:<tür>/<özellik>`), feat, silah ve eşyanın sabit bir `id`'si olur ve bir `data/srd/` kaydıyla eşleşir. Silah, büyü ve eşyada `srd: "<dosya>:<kimlik>"` yazılır (`weapons:dagger`, `spells:fire-bolt`, `magic-items:potions-of-healing`, `gear:acid`). Feat ve sınıf özelliği anahtarları SRD kimliğidir. `src/data/srdIds.test.ts` kimliksiz, yinelenen ya da SRD karşılıksız kaydı reddeder. Kimlikler değişmez (ileride "Dungeondex" açıklamaları bunlara bağlanacak).
- **Sınıf özellikleri veriden** (`src/rules/classFeatures.ts`): hangi özelliğin hangi seviyede geldiği SRD tablosundan (`data/srd/progression.json`), ne yaptığı `data/class-features.json`'dan (tür: passive/resource/action/bonus/reaction/free; durum: ok/partial/none/missing). Kodda sınıf adıyla koşul yazılmaz (test tarar). Kaynaklar (Rage, Focus, Action Surge…) `resources` kaydı; yenilenme kuralı veride. Feat etkileri aynı dosyada `feats`.
- **Barbarian** (`src/battle/rage.ts`): Rage veride (`rage`: direnç, hasar sütunu, STR avantajı), kaynak `rage`; savaşçıda `rage`/`rageDamage`, Reckless işareti `marks` (`reckless`), avantajlı save'ler `saveAdvantage` (`saveMode` savaşçıyı alır), Primal Knowledge `skillBonus`/`checkMode` içinde. Simülasyonda `--parti barbar`.
- **Eller ve yan el** (`src/rules/hands.ts`, `src/battle/offhand.ts`): karakterde `offHand` (yan el silahı; Light, kalkansız, iki elli silah taşınmıyor, ana elde farklı Light silah). Attack eyleminde Light silah saldırısı `economy.lightAttack` açar; `offhand_attack` bonus eylem harcar, yan el silahında Nick varsa (`nickOffhand`) Attack eyleminin içinde. Hasara yetenek değiştiricisi eklenmez, Two-Weapon Fighting (`offhandModifier`) ekler. Versatile diğer el boşsa iki elle.
- **Paladin ve kutsal güçler** (`src/battle/divine.ts`, Görev P-Paladin): savaşta kullanılan sınıf özellikleri veriden (`FeatureMechanic.effect`: iyileştirme havuzu ya da güçlendirme) `use_feature` komutuyla; her zaman hazır büyüler `alwaysPrepared`; Fighting Style yuvası seçeneği `alternatives` (Blessed Warrior). Büyü türleri `smite` (bu tur yakın dövüş isabeti alan hedefe ek hasar, `economy.meleeHit`) ve `buff` (`selfBuff` savaşçının `buffs`'ı, `ward` konsantrasyon hedefinde: AC, avantaj, türlere dezavantaj; `effectiveAc`, `wardSources`). Yaratık türü `data/canavar-turleri.json` (SRD; okunamayanlar temadan). Alt sınıf boşsa alt sınıf özelliği yok; oluşturucu 3+ seviyede alt sınıf ister, eski kayıtlara SRD alt sınıfı atanıp bildirilir.
- **Monk ve dövüş sanatları** (`src/battle/martial.ts`, `stunning.ts`; Görev P-Monk): Martial Arts veriden (`martialArts`: zar sütunu, Monk silahları, bonus vuruş); Unarmed Strike yalnızca Martial Arts geçerliyken (zırhsız, kalkansız) seçenek. Bonus vuruş ve Flurry vuruşu `bonus_strike` (Flurry kalanı `economy.flurryLeft`), Focus eylemleri `focus_action` (`focusActions` verisi), Stunning Strike `stunning_strike` (bu tur Monk silahı isabeti: `meleeHit.martialArts`). Deflect Attacks canavar saldırısında kendiliğinden tepki, Slow Fall düşme hasarında, Uncanny Metabolism `start_battle`'da, Addled fırsat saldırısını engeller. Simülasyonda `--parti monk`.
- **Durumlar** (`src/rules/conditions.ts`, `data/conditions.json`; Görev H): Incapacitated (ve onu içeren Stunned, Paralyzed, Unconscious, Petrified) eylem, bonus eylem ve tepki engeller, konsantrasyonu keser; hareket komutları (`MOVE_ONLY_COMMANDS`) hızı 0 değilse serbest. Hız 0 tek listede (`speedZero`: Grappled, Restrained, Paralyzed, Petrified, Unconscious). Otomatik kritik "5 ft içinden" (`withinFiveFt`: haritada bitişik). Süreler `conditionTimers` (`durations.ts`). Jeton rozetleri `ui/damageFloats.ts` `statusIcons`.
- **Tepkiler** (`src/battle/reactions.ts`, `src/rules/reactionChoice.ts`; Görev R1): tepki hakkı tek yerde (`canReact`, `reactionUsed` → `reaction_used` olayı; kendi turunun başında yenilenir). Tetikler: isabet (Shield, Parry, Uncanny Dodge, Deflect Attacks…), hedef alınma (Redirect Attack, Shield/Magic Missile), erişimden çıkma (fırsat saldırısı), büyü (Counterspell), hasar (Hellish Rebuke, Retaliation), düşme (Slow Fall, Feather Fall), tur başı (Unnerving Gaze). Tepkiler veriden: sınıf özelliğinde ve büyüde `reaction` mekaniği, canavarda `data/monster-reactions.json`; savaşçıda `reactions`. Karar `askReaction(rng, istek)`: Rng'deki karar kancası (zar kancasıyla aynı yol); arayüz kararı zar defterine yazar, oyuncuya sorulacaksa `NeedReaction` (`runStep`, `enterReaction`) ve adım aynı zarlarla yeniden çalışır. Kancasız Rng'de (simülasyon, testler) motorun kural tabanlı önerisi (`suggested`). Ayar: oyuncu tepkileri Sor/Her zaman/Asla, düşman tepkileri Yapay zekâ/Her zaman/Asla (`ui/reactionSetting.ts`). Saldırı yapan tepkiler saldırıyı `registerStrikes` ile alır (döngüsel içe aktarma yok).
- **Süren etkiler** (`src/battle/effects.ts`, `effectDice.ts`; Görev R2): savaşçıda `effects` (kaynak, SRD kimliği, `until`, konsantrasyon bağı): zar eklentisi `dice` (Bless +1d4, Bane −1d4, Guidance), turda bir hasar azaltma `reduce` (Resistance), her tur başı geçici HP `tempHp` (Heroism; `tempHp` alanı, `damageEffects` önce harcar), bağışıklık `immune`, süregelen hasar `ongoing` (Searing Smite: tur başı zar, sonra save), tur kaybı `command`. Büyü verisinde `kind: effect` (`mechanics.effect`) ve smite'ta `ongoing`. Eklenti zarları `rules/attack.ts` `ExtraDie` ile d20'den sonra atılır, olaylarda `bonusDice`. Bitiş reducer'da (`pruneEffects`).
- **Çağırma ve yoldaş** (`src/battle/summons.ts`, `data/summons.json`; Görev R3): çağrılan yaratık sıradaki ayrı savaşçı (`summon` bağı: sahip, büyü, seviye). `turn: own` kendi inisiyatifi (Find Familiar), `after-owner` sahibinin hemen ardı (Find Steed, Summon Dragon). Stat blokları veride, büyü seviyesiyle ölçeklenir (yukarı slot = stat bloğundaki seviye); familiar biçimleri `monsters.json`'dan. Büyü verisinde `kind: summon`; Find Familiar ritüel (`castingTime: ritual`), yalnızca kurulumda. Olaylar `summoned` (yaratık olayın içinde, `index` sıradaki yeri) ve `summon_vanished`; kaybolma `summonCleanup` ile her komuttan sonra (0 HP, konsantrasyon, sahibin ölümü, süre; yenisi çağrılınca `replaced`). Kaybolan savaşçılarda kalır (`gone`), sırada atlanır. Çağrılmış yaratık ölüm save'i atmaz ve tarafı ayakta tutmaz. Sahibinin oyuncusu yönetir (düşman tarafında Game Master); yapay zekâ çağırma büyüsü yapmaz, çağrılanı oynatır (sahibine bitişik düşman önce; familiar Yardım/Kaçın). Wild Shape kapsam dışı.
- **Alan şekilleri** (`src/rules/area.ts`, `src/rules/areaParse.ts`, `src/battle/areaAttack.ts`; Görev R4): koni SRD genişliğiyle (genişlik = uzaklık; kenar payı 0,1 altıgen), çizgi genişlikli (10 ft = iki şerit), küre/küp/yayılım; çıkış altıgeni koni, çizgi ve yayılımda dahil değil. Alan büyüleri, canavar alan saldırıları (alan SRD metninden ayrıştırılır; elle yazılmış metinde saldırının `area` alanı), Dragonborn Breath Weapon (`breath_weapon` komutu, tür kaynağı `breathWeapon`) ve Draconic Spirit nefesi aynı yoldan: `pickArea` (menzil, görüş, siper, dost ateşi: `targets: all|enemies`) ve `areaSaveEvents` (hasar bir kez, hedef başına save, `area_used` olayı). Yapay zekâ `bestAim` ile koni/çizgide en çok düşmanı kapsayan, dost vurmayan yönü seçer; noktadan çıkan alanlar düşmanın altıgenine (akıllı nokta araması `anyPoint` kapalı, DECISIONS.md). Arayüz: "Nefes / alan" menüsü, önizleme (dost/düşman işareti, sayı), yön okları. Tür özellikleri `data/srd/species.json`'da (`species:<tür>/<özellik>`).
- **Weapon Mastery** (`src/rules/mastery.ts`, `src/battle/mastery.ts`): silahın ustalığı SRD silah tablosundan (`data/srd/weapons.json`), hak sayısı ve kısıtı SRD sınıf tablosundan (`stat: weaponMastery`), oyundaki durumu ve parametreleri `data/class-features.json` `masteries`ten. Karakterde `weaponMasteries` (silah kimlikleri). Etkiler saldırıdan sonra otomatik (`mastery_applied`); Sap/Slow/Vex savaşçıda süreli işaret (`marks`). Nick yan el saldırısının ekonomisini değiştirir.
- **Veri JSON'da, kodda değil.**
  - `data/ses.json`: ses eşlemesi (harita/varyant → ortam ve müzik, kurallar, seviyeler, zar grupları); `data/ses-klipler.json` `npm run ses` üretir; `data/ses-adlari.json` ham dosyaların eski adları.
  - `data/*.json`: ırk, sınıf, büyü, canavar, silah, zırh, ortam, `monster-ortamlari.json`, `monster-reactions.json` (canavar tepkileri), `token-sizes.json`, `stealth.json` (gizlenme genel kuralları), `class-features.json` (sınıf özelliği, kaynak ve feat mekaniği), `sim-partiler.json` ve `sim-senaryolar.json` (denge simülasyonu partileri ve seviyeye göre düşman listeleri).
  - `data/srd/*.json`: SRD 5.2.1 PDF'inden betikle üretilir (`npm run srd`; elle düzenlenmez): sınıf tabloları ve özellikleri, alt sınıflar, feat'ler, büyüler, sihirli eşyalar, silah/zırh ve silah ustalıkları, donanım (`gear.json`, Adventuring Gear), türler ve tür özellikleri (`species.json`), `progression.json`, `rapor.json`. Her kayıtta sayfa referansı.
  - `data/spells.json` mekaniği elle; seviye, sınıf, okul, konsantrasyon ve yukarı slot tanımı (`mechanics.upcast`) `npm run srd:buyu` ile SRD'den (rapor `docs/BUYU-ESITLEME.md`). Motor yalnızca `upcast.applied` olanları uygular.
  - `data/maps/*.json`: haritalar; varyantlar ve kural parametreleri haritanın JSON'unda. Hareketli efekt katmanı (`effects`: tür, `intensity`, `speed`, `params`) da varyantta; çizim `src/ui/EffectsLayer.tsx` (tembel parça, ızgara ve jetonların altında). Gizlenme yerleri haritanın `hide` alanında (zemin harfi → bonus, bitişik engel, örtü görüntüsü).
  - Işıklar tek yerde: `darkness` (görüş sınırı) ve `night` (gece gizlenmesi) aynı ışık listesini kullanır (`litHexes`); ışıkları iki kurala birden yazma.
  - Yeni sabit değer önce JSON'a.
- **Harita kuralları** veriyle tanımlanır: `ruleOf(state, id)` ile okunur (`src/battle/maprules.ts`).
- **Görsel ile mekanik ayrı.** Jeton ölçeği yalnızca görseldir; her yaratık tek altıgen kaplar, tıklama alanı kendi altıgenidir.
- **Ana parça 500 kB altında** (şu an ≈354 kB). Savaş (`MapBattle`), Game Master (`GmScreen`) ve durum (`StatusScreen`) ekranları `App.tsx`'te `lazy` ile ayrı parça; giriş ekranının yüklediği modüller bunları statik içe aktarmaz. Savaş motoru (`battle/index`, `app/battleSave`) da giriş ekranından statik içe aktarılmaz: jeton yolu `battle/avatar.ts`, kayıt var mı `app/saveKey.ts`; kayıt yükleme tembel import. Zar tepsisi (`DiceTray`), 3D zarlar (`Dice3D`, three.js), savaş sonu efekti (`EndFx`) ve ses motoru (`ui/audio/engine.ts`; sayfa açılınca yüklenir, müziği önyükler, tarayıcı izin verince ya da ilk dokunuşta başlar) da ayrı parça; three.js ana parçaya girmez.
- **Kayıt sürümü** (`src/app/battleSave.ts`): olay biçimi değişince `SAVE_VERSION` artar, eski sürümler `LOADABLE_VERSIONS`'ta kalır (şu an 16; 3–16 yüklenir).

## Komutlar

```powershell
npm install
npm run dev            # geliştirme sunucusu
npm test               # vitest (birim + arayüz testleri)
npm run typecheck      # tsc --noEmit
npm run build          # typecheck + vite build
npm run check:harita   # her harita/varyant için gerçek tarayıcıda kara ekran kontrolü (Playwright)
npm run masumlar       # assets-ham/masumlar/*.jpg → public/masumlar/*.webp (masum jetonları)
npm run efektler       # assets-ham/efektler/*.jpg → public/efektler/*.webp + data/efekt-sprites.json (hasar efektleri)
npm run acilis         # assets-ham/acilis/*.mp4 → public/acilis/ (çapraz geçişli döngü: mp4 + webm + poster; ffmpeg)
npm run karakter-kucuk # public/characters/*.webp → public/characters/kucuk/ (96 px rozet kopyaları)
npm run zarlar         # assets-ham/zarlar/zar-<tema>.jpg → public/zarlar/<tema>/d4..d100.webp (zar temaları, data/zar-gorselleri.json)
npm run ses            # assets-ham/ses/*.mp3 → public/ses/ (normalize, sessizlik kırpma, zar kliplerini bölme; ffmpeg) + data/ses-klipler.json
npm run ses:yer-tutucu # zafer/yenilgi ezgisi yer tutucuları (ffmpeg sentezi) → assets-ham/ses/son-*.mp3; sonra npm run ses -- son-zafer son-yenilgi
npm run check:ses      # gerçek tarayıcıda ses akışı kontrolü (bağlam, önyükleme, otomatik oynatma, kanallar, sahneler, zar sesleri; Playwright)
npm run olcum          # yükleme ölçümü (önce npm run build): arka plan, tema geçişi, karakter görselleri
npm run sim -- 200 --seviye 1 --parti standart   # denge simülasyonu, senaryolar paralel (200 tohum; isteğe bağlı senaryo kimlikleri; --seviye 1|3|5…, --parti standart|barbar|yanel|paladin|monk, --is N süreç); sonuç sim-sonuc/ altına da yazılır
npm run sim:tek -- 200 col      # aynı ölçüm tek süreçte
npm run srd            # docs/SRD_CC_v5.2.1.pdf → data/srd/*.json (sınıf, alt sınıf, feat, tür, büyü, eşya, silah, zırh)
npm run srd:buyu       # data/spells.json'u SRD ile eşitle, docs/BUYU-ESITLEME.md raporu (önce npm run srd)
```

## Çalışma şekli

- **Dil:** Yanıtlar, arayüz metinleri ve belgeler Türkçe. Kod tanımlayıcıları İngilizce olabilir; yorumlar Türkçe.
- **Ekran metinleri** `src/i18n/strings.ts`'te (TR ve EN, aynı yapı); arayüz `t()` ile okur, koda metin yazılmaz. "Game Master" yazılır, "GM" değil.
- **Komutlar:** Kullanıcıya verilen komutlar PowerShell sözdiziminde.
- **Küçük adımlar:** Her adımda `npm test`, `npm run typecheck` ve `npm run build` yeşil kalmalı; harita ve görsel değişikliklerinde `npm run check:harita` de.
- **Kararlar** `DECISIONS.md`'ye yazılır, en yeni karar en üstte. Denge ölçümleri `docs/harita/DENGE.md`'ye.
- **Commit mesajı tırnak içinde verilir:** `git commit -m "Kısa açıklama"`.
- Rapor kısa tutulur; arayüz değişikliklerinde ekran görüntüsü alınır.

## Yasaklar

- **PHB ya da "converting to SRD" PDF'lerini asla commit etme.** Depoda yalnızca CC lisanslı `docs/SRD_CC_v5.2.1.pdf` bulunur.
- **`npm audit fix --force` kullanma.**
- **`data/maps` içine harita dışı dosya koyma.** Test fikstürleri `src/map/fixtures/` altında.
- Görselleri (resim dosyalarını) testlere sokma; testler yalnızca dosya adlarını listeleyebilir (`import.meta.glob`, tembel).
- Mevcut testleri bozma. Bir test veriye bağlı bir değeri sınıyorsa, değeri güncellemenin gerekçesini commit'te yaz.
- Lisans ve atıf dosyalarına dokunma (`NOTICE`, lisans metinleri).
- Canavar verisini (`data/monsters.json`) denge için değiştirme. Denge, senaryodaki düşman listesiyle yapılır; canavar verisi için yalnızca öneri yazılır.

## Bilinen eksikler

Durum: **yok** ya da **kısmen**.

| Konu | Durum | Not |
|---|---|---|
| Hazırla (Ready) eylemi | yok | Tasarım önerisi DECISIONS.md'de; Kaçın ve Yardım var. Tepki sistemi (Görev R1) hazır: Ready bir tetik türü olarak eklenebilir |
| 4. seviye ve üstü büyüler | yok | `spells.json` 0–3. seviye (93 büyü; istisna 5. seviye Summon Dragon ve Cone of Cold; SRD'de 339, `data/srd/spells.json`); oluşturucu 1–20'ye izin veriyor, 6+ seviyede "deneysel" uyarısı |
| Sınıf özellikleri (Aşama 1+) | kısmen | Altyapı hazır (Görev N). Uygulanan: Extra Attack, Sneak Attack, Cunning Action, Action Surge, Second Wind, Favored Enemy, Unarmored Defense/Movement, Fast Movement, uzmanlık, Weapon Mastery (Görev P0; Nick Görev P1). **Barbarian 1–5 tam** (Rage, Danger Sense, Reckless Attack, Primal Knowledge kısmen, Frenzy; Görev P-Barbarian). **Paladin 1–5** (Görev P-Paladin): Lay On Hands, Paladin's Smite/Divine Smite, Blessed Warrior, Channel Divinity (Divine Sense etkisiz), Sacred Weapon (ışık yok), yemin büyüleri; Faithful Steed kısmen (Görev R3: Find Steed). **Monk 1–5** (Görev P-Monk): Martial Arts (Unarmed Strike, bonus vuruş), Focus (Flurry of Blows, Patient Defense, Step of the Wind; atlama ikilemesi yok), Uncanny Metabolism, Deflect Attacks (geri yöneltme yok), Slow Fall, Stunning Strike (hız yarılanması yok), Open Hand Technique. Diğer alt sınıf özellikleri yok (`data/class-features.json` durumları) |
| Weapon Mastery | kısmen | 8 ustalığın hepsi çalışıyor (Nick Görev P1'de yan el saldırısıyla). Push yakın dövüşte yalnızca eylemin son saldırısında; büyü saldırıları Sap/Vex'e bakmaz |
| Yukarı slot etkileri | kısmen | Slot seçimi var; etki verisi her büyüde (`mechanics.upcast`), uygulanan Spiritual Weapon, Spirit Guardians, smite büyüleri (Divine/Searing/Shining Smite) ve etki büyülerinin hedef sayısı / Aid HP'si (Görev R2) |
| Durum süreleri | kısmen | `conditionTimers` var (tur, başına/sonuna dek, save ends, süreli hasar `dot`); 20 elle tanımlı canavar etkisi + 6 büyü (`data/condition-effects.json`), ~30 rider'dan üretilen süreli durum. "Second failure", lanet ve HP-eşiği etkileri yok |
| Canavar saldırı ek etkileri (`rider`) | kısmen | `data/attack-riders.json` (`node scripts/riders-uret.cjs` ile üretilir): ek hasar, koşullu hasar, Grappled (kaçış DC, sürükleme), Prone (boyut, save), hücum (20+ ft düz koşu), süreli durumlar uygulanıyor (325'te 217 tam, 31 kısmen, 16 süreli etki). 61 rider uygulanmıyor: itme/çekme, lanet, yutma, ikinci aşama, HP eşiği, özel metin |
| Yakalama ve yere düşme | kısmen | Grappled (hız 0, kaçış eylemi, sürükleme yarı hız, yakalayan düşünce biter) ve Prone (kalkmak hızın yarısı) var. Yakalananın başka hedefe dezavantajı ve oyuncunun yakalama (Grapple) eylemi yok |
| Feat'ler (köken, ASI, Fighting Style, Epic Boon) | kısmen | Seçim var; uygulanan: ASI, Alert (inisiyatif), Skilled, Archery, Defense, Great Weapon Fighting, yetenek artışları. Two-Weapon Fighting (Görev P1). Magic Initiate, Savage Attacker ve Boon'ların özel etkileri yok. SRD'de Fighting Style feat'i yalnızca 4 tane (Dueling, Protection, Interception vb. yok) |
| Yan el ve eller | kısmen | Görev P1: Light ek saldırısı, Nick, Two-Weapon Fighting, Versatile iki el (kalkan ve geçerli yan el yoksa). Basitleştirmeler: taşınan her Two-Handed silah (yaylar dahil) yan eli engeller; aynı silahtan iki tane taşınamaz; elde silah değiştirme (Interact) yok |
| Oyuncu ırk özellikleri | kısmen | Görev R4: Dragonborn Breath Weapon (koni/çizgi, PB kadar, uzun dinlenmede dolar). Diğer tür özellikleri (Draconic Flight, Relentless Endurance, Luck, Stone's Endurance…) yok; ırk ayrıca puan, direnç, karanlık görüş ve jeton ölçeği veriyor |
| Kalıcı alan büyüleri | kısmen | Yalnızca Spirit Guardians ve Spiritual Weapon |
| Çağırma | kısmen | Görev R3: Find Familiar, Find Steed (Faithful Steed), Summon Dragon. Binek (mounted combat), Otherworldly Steed'in Life Bond ve bonus eylemleri, Draconic Spirit'in Shared Resistances'ı ve durum bağışıklıkları, familiar'ın dokunma büyüsü taşıması ve görüş paylaşımı yok. Animate Dead / Animate Objects yok; Wild Shape ayrı görev |
| Süren etkiler (buff/debuff) | kısmen | Görev R2: Bless, Bane, Guidance, Resistance, Heroism, Aid, Hex, Searing Smite (süregelen), Command (yalnızca Grovel/Halt). Hex'in kontrol dezavantajı ve ölüm save'ine Bless yok; Faerie Fire, Bestow Curse, Haste, Slow gibi diğer etkiler yok |
| Çok altıgenlik büyük canavarlar | yok | Ölçek yalnızca görsel; mekanik tek altıgen |
| Efsanevi eylem ve direnç | yok | 30 canavar; ejderhalar bu yüzden olduklarından zayıf |
| Canavar büyüleri ve tepkileri | kısmen | 73 büyü eylemi desteklenmiyor. 24 tepkiden 15'i çalışıyor (Parry ×7, Riposte, Protective Magic ×3, Unnerving Gaze; Whirlwind of Sand, Deflect Missile, Redirect Attack kısmen); 9'u `none` (Split, Ink Cloud, Pursuit…; `data/monster-reactions.json`) |
| Koni ve çizgi alanlar (nefes silahları) | kısmen | Görev R4: canavarların 86 alanlı saldırısı (koni, çizgi, yayılım, küre) alan olarak. Kısmen: silindir yükseklikli değil (küre sayılır); "saldırının yerine nefes" Multiattack seçenekleri ayrı eylem; Djinni Create Whirlwind ve Gelatinous Cube Engulf alan değil |
| Durum bağışıklığı | yok | 75 canavar |
| Canavar özellikleri (Pack Tactics, Magic Resistance…) | kısmen | Çoğu `unsupported` notu olarak duruyor |
| Dinlenme (kısa/uzun) | kısmen | Savaşlar arası (karakter listesi, Game Master kurulumu); Arcane Recovery, Sorcerous Restoration gibi dinlenme özellikleri yok |
| Tepkiler | kısmen | Görev R1: fırsat saldırısı, Shield, Counterspell, Hellish Rebuke, Feather Fall, Uncanny Dodge, Deflect Attacks, Slow Fall, Retaliation; Superior Hunter's Defense kısmen (yalnızca isabet). Cutting Words ve Countercharm yok (Bardic Inspiration ve save sonrası tetik yok). Hellish Rebuke Spirit Guardians ve harita hasarında tetiklenmez |
| Sabit hasar | kısmen | Sabit hasar "1d2 + (N − 1)" ile yaklaşıklanıyor (21 canavar) |
| GM'e gizli tuzak görünümü | yok | Bulunmamış tuzak kimseye çizilmiyor (gizli jeton katmanı kullanılabilir) |
| Ağ üzerinden çok oyunculu | yok | Tek ekran paylaşımlı |
| Yapay zekânın gizlenmesi | yok | Yapay zekâ Gizlen kullanmaz; gece kuralı bu yüzden simülasyonda etkisiz (Orman/Kale gece = gündüz) |
| İngilizce (EN) arayüz | kısmen | Ekran metinleri ve günlük çevrili; motor hata/gerekçe metinleri ve veri açıklamaları (tür özellikleri, eşya, harita/zemin adları) yalnızca Türkçe |

Önerilen sıra:
1. Aşama 1: seviye 1–5 sınıf özellikleri (altyapı Görev N'de hazır; `docs/SEVIYE-DENETIMI.md`)
2. Hazırla (Ready) eylemi
3. Efsanevi eylem/direnç (koni nefes Görev R4'te; sonra ejderha dengesi yeniden ölçülmeli)
4. 4.+ seviye büyüler (önce yukarı slot etkileri)
5. Canavar büyüleri, tepkileri, bağışıklıkları ve özellikleri
6. Kalıcı alan büyüleri
7. Dinlenmeyle çalışan sınıf özellikleri (Arcane Recovery…)
8. Çok altıgenlik canavarlar
9. GM tuzak görünümü
10. Ağ üzerinden çok oyunculu
