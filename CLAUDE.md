# RPG-Battle

## Proje özeti

D&D 5e **SRD 5.2.1** (CC-BY-4.0) tabanlı, Türkçe arayüzlü altıgen haritalı savaş simülatörü (React + TypeScript + Vite).

- Oyuncular en çok 6 özel karakter oluşturur (`MAX_PARTY`, `src/app/limits.ts`) (ırk, sınıf, alt sınıf, seviye, cinsiyet; 240 pixel-art jeton). Seviye yuvalarında ASI ya da feat, köken feat'i ve uzmanlık seçilir; 6+ seviye "deneysel" uyarısı veriden. Savaş sonrası HP/kaynak/slot karakterde kalır; kısa ve uzun dinlenme karakter listesinde ve Game Master kurulumunda. Masumların 8 görünümü `data/masumlar.json` ve `public/masumlar/` altında (Gemini üretimi; `npm run masumlar` ile ham görsellerden üretilir).
- GM önce haritayı, sonra düşmanları seçer: 330 SRD canavarı, haritanın ortam listesine göre süzülür, güç kademelerine ayrılır (çoklu kademe filtresi). "Tüm canavarlar" hepsini açar. Özel canavar eklenip silinebilir; CR'si otomatik tahmin edilir. Örnek karakterler arayüzde yok, yalnızca `src/screens/fixtures.ts` (testler).
- Savaş 15×7 altıgen (flat-top, odd-q, 5 ft) haritalarda oynanır. 12 harita, varyantlar ve harita kuralları var: lav, bataklık, karanlık, gece, tuzak, kapı, uyuyan ejderha…
- Gizlenme (Hide): haritanın gizlenme yerlerinde, DC 15 ve onu gören düşmanların pasif Algısına karşı; gece ışıksız altıgende kolaylaşır. Saklanma bölgeleri haritada gösterilir.
- Zarlar otomatik ya da fiziksel: Game Master kurulumda "Zar modu" seçer (otomatik / yalnızca oyuncular / herkes); fiziksel zarda oyun gereken zarı ister. Atılan zarlar kısa bir animasyonla gösterilir (Normal / Hızlı / Kapalı); zar görselleri temalı (`data/zar-gorselleri.json`, şimdilik Klasik). Normal hızda ve yeterli cihazda zarlar 3D atılır (`src/ui/dice3d/`, three.js tembel parça), yoksa 2D.
- Ses (Web Audio): menülerde ve Game Master kurulumunda temaya göre menü müziği, savaş ekranında haritanın ortam sesi + savaş müziği, zar sesleri; "Ses" ayarları (ana, ortam, müzik, efekt). Eşleme `data/ses.json` (koşullu kurallar: Volkan'da ejderha → gece müziği), dosyalar `public/ses/` (`npm run ses`; ham `assets-ham/ses/`, Suno).
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
- **Kimlik kuralı:** Yeni eklenen her büyü, özellik, feat, silah ve eşyanın sabit bir `id`'si olur ve bir `data/srd/` kaydıyla eşleşir. Silah, büyü ve eşyada `srd: "<dosya>:<kimlik>"` yazılır (`weapons:dagger`, `spells:fire-bolt`, `magic-items:potions-of-healing`, `gear:acid`). Feat ve sınıf özelliği anahtarları SRD kimliğidir. `src/data/srdIds.test.ts` kimliksiz, yinelenen ya da SRD karşılıksız kaydı reddeder. Kimlikler değişmez (ileride "Dungeondex" açıklamaları bunlara bağlanacak).
- **Sınıf özellikleri veriden** (`src/rules/classFeatures.ts`): hangi özelliğin hangi seviyede geldiği SRD tablosundan (`data/srd/progression.json`), ne yaptığı `data/class-features.json`'dan (tür: passive/resource/action/bonus/reaction/free; durum: ok/partial/none/missing). Kodda sınıf adıyla koşul yazılmaz (test tarar). Kaynaklar (Rage, Focus, Action Surge…) `resources` kaydı; yenilenme kuralı veride. Feat etkileri aynı dosyada `feats`.
- **Barbarian** (`src/battle/rage.ts`): Rage veride (`rage`: direnç, hasar sütunu, STR avantajı), kaynak `rage`; savaşçıda `rage`/`rageDamage`, Reckless işareti `marks` (`reckless`), avantajlı save'ler `saveAdvantage` (`saveMode` savaşçıyı alır), Primal Knowledge `skillBonus`/`checkMode` içinde. Simülasyonda `--parti barbar`.
- **Eller ve yan el** (`src/rules/hands.ts`, `src/battle/offhand.ts`): karakterde `offHand` (yan el silahı; Light, kalkansız, iki elli silah taşınmıyor, ana elde farklı Light silah). Attack eyleminde Light silah saldırısı `economy.lightAttack` açar; `offhand_attack` bonus eylem harcar, yan el silahında Nick varsa (`nickOffhand`) Attack eyleminin içinde. Hasara yetenek değiştiricisi eklenmez, Two-Weapon Fighting (`offhandModifier`) ekler. Versatile diğer el boşsa iki elle.
- **Paladin ve kutsal güçler** (`src/battle/divine.ts`, Görev P-Paladin): savaşta kullanılan sınıf özellikleri veriden (`FeatureMechanic.effect`: iyileştirme havuzu ya da güçlendirme) `use_feature` komutuyla; her zaman hazır büyüler `alwaysPrepared`; Fighting Style yuvası seçeneği `alternatives` (Blessed Warrior). Büyü türleri `smite` (bu tur yakın dövüş isabeti alan hedefe ek hasar, `economy.meleeHit`) ve `buff` (`selfBuff` savaşçının `buffs`'ı, `ward` konsantrasyon hedefinde: AC, avantaj, türlere dezavantaj; `effectiveAc`, `wardSources`). Yaratık türü `data/canavar-turleri.json` (SRD; okunamayanlar temadan). Alt sınıf boşsa alt sınıf özelliği yok; oluşturucu 3+ seviyede alt sınıf ister, eski kayıtlara SRD alt sınıfı atanıp bildirilir.
- **Weapon Mastery** (`src/rules/mastery.ts`, `src/battle/mastery.ts`): silahın ustalığı SRD silah tablosundan (`data/srd/weapons.json`), hak sayısı ve kısıtı SRD sınıf tablosundan (`stat: weaponMastery`), oyundaki durumu ve parametreleri `data/class-features.json` `masteries`ten. Karakterde `weaponMasteries` (silah kimlikleri). Etkiler saldırıdan sonra otomatik (`mastery_applied`); Sap/Slow/Vex savaşçıda süreli işaret (`marks`). Nick yan el saldırısının ekonomisini değiştirir.
- **Veri JSON'da, kodda değil.**
  - `data/ses.json`: ses eşlemesi (harita/varyant → ortam ve müzik, kurallar, seviyeler, zar grupları); `data/ses-klipler.json` `npm run ses` üretir; `data/ses-adlari.json` ham dosyaların eski adları.
  - `data/*.json`: ırk, sınıf, büyü, canavar, silah, zırh, ortam, `monster-ortamlari.json`, `token-sizes.json`, `stealth.json` (gizlenme genel kuralları), `class-features.json` (sınıf özelliği, kaynak ve feat mekaniği), `sim-partiler.json` ve `sim-senaryolar.json` (denge simülasyonu partileri ve seviyeye göre düşman listeleri).
  - `data/srd/*.json`: SRD 5.2.1 PDF'inden betikle üretilir (`npm run srd`; elle düzenlenmez): sınıf tabloları ve özellikleri, alt sınıflar, feat'ler, büyüler, sihirli eşyalar, silah/zırh ve silah ustalıkları, donanım (`gear.json`, Adventuring Gear), `progression.json`, `rapor.json`. Her kayıtta sayfa referansı.
  - `data/spells.json` mekaniği elle; seviye, sınıf, okul, konsantrasyon ve yukarı slot tanımı (`mechanics.upcast`) `npm run srd:buyu` ile SRD'den (rapor `docs/BUYU-ESITLEME.md`). Motor yalnızca `upcast.applied` olanları uygular.
  - `data/maps/*.json`: haritalar; varyantlar ve kural parametreleri haritanın JSON'unda. Hareketli efekt katmanı (`effects`: tür, `intensity`, `speed`, `params`) da varyantta; çizim `src/ui/EffectsLayer.tsx` (tembel parça, ızgara ve jetonların altında). Gizlenme yerleri haritanın `hide` alanında (zemin harfi → bonus, bitişik engel, örtü görüntüsü).
  - Işıklar tek yerde: `darkness` (görüş sınırı) ve `night` (gece gizlenmesi) aynı ışık listesini kullanır (`litHexes`); ışıkları iki kurala birden yazma.
  - Yeni sabit değer önce JSON'a.
- **Harita kuralları** veriyle tanımlanır: `ruleOf(state, id)` ile okunur (`src/battle/maprules.ts`).
- **Görsel ile mekanik ayrı.** Jeton ölçeği yalnızca görseldir; her yaratık tek altıgen kaplar, tıklama alanı kendi altıgenidir.
- **Ana parça 500 kB altında** (şu an ≈336 kB). Savaş (`MapBattle`), Game Master (`GmScreen`) ve durum (`StatusScreen`) ekranları `App.tsx`'te `lazy` ile ayrı parça; giriş ekranının yüklediği modüller bunları statik içe aktarmaz. Savaş motoru (`battle/index`, `app/battleSave`) da giriş ekranından statik içe aktarılmaz: jeton yolu `battle/avatar.ts`, kayıt var mı `app/saveKey.ts`; kayıt yükleme tembel import. Zar tepsisi (`DiceTray`), 3D zarlar (`Dice3D`, three.js) ve ses motoru (`ui/audio/engine.ts`, ilk dokunuşta) da ayrı parça; three.js ana parçaya girmez.
- **Kayıt sürümü** (`src/app/battleSave.ts`): olay biçimi değişince `SAVE_VERSION` artar, eski sürümler `LOADABLE_VERSIONS`'ta kalır (şu an 12; 3–12 yüklenir).

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
npm run check:ses      # gerçek tarayıcıda ses akışı kontrolü (bağlam, kanallar, sahneler, zar sesleri; Playwright)
npm run olcum          # yükleme ölçümü (önce npm run build): arka plan, tema geçişi, karakter görselleri
npm run sim -- 200 --seviye 1 --parti standart   # denge simülasyonu, senaryolar paralel (200 tohum; isteğe bağlı senaryo kimlikleri; --seviye 1|3|5…, --parti standart|barbar|yanel, --is N süreç); sonuç sim-sonuc/ altına da yazılır
npm run sim:tek -- 200 col      # aynı ölçüm tek süreçte
npm run srd            # docs/SRD_CC_v5.2.1.pdf → data/srd/*.json (sınıf, alt sınıf, feat, büyü, eşya, silah, zırh)
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
| Hazırla (Ready) eylemi | yok | Tasarım önerisi DECISIONS.md'de; Kaçın ve Yardım var |
| 4. seviye ve üstü büyüler | yok | `spells.json` 0–3. seviye (82 büyü; SRD'de 339, `data/srd/spells.json`); oluşturucu 1–20'ye izin veriyor, 6+ seviyede "deneysel" uyarısı |
| Sınıf özellikleri (Aşama 1+) | kısmen | Altyapı hazır (Görev N). Uygulanan: Extra Attack, Sneak Attack, Cunning Action, Action Surge, Second Wind, Favored Enemy, Unarmored Defense/Movement, Fast Movement, uzmanlık, Weapon Mastery (Görev P0; Nick Görev P1). **Barbarian 1–5 tam** (Rage, Danger Sense, Reckless Attack, Primal Knowledge kısmen, Frenzy; Görev P-Barbarian). **Paladin 1–5** (Görev P-Paladin): Lay On Hands, Paladin's Smite/Divine Smite, Blessed Warrior, Channel Divinity (Divine Sense etkisiz), Sacred Weapon (ışık yok), yemin büyüleri; Faithful Steed çalışmıyor (çağırma yok). Martial Arts vb. ve diğer alt sınıf özellikleri yok (`data/class-features.json` durumları) |
| Weapon Mastery | kısmen | 8 ustalığın hepsi çalışıyor (Nick Görev P1'de yan el saldırısıyla). Push yakın dövüşte yalnızca eylemin son saldırısında; büyü saldırıları Sap/Vex'e bakmaz |
| Yukarı slot etkileri | kısmen | Slot seçimi var; etki verisi her büyüde (`mechanics.upcast`), uygulanan Spiritual Weapon, Spirit Guardians ve smite büyüleri (Divine/Searing/Shining Smite) |
| Durum süreleri | kısmen | `conditionTimers` var (tur, başına/sonuna dek, save ends, süreli hasar `dot`); 20 elle tanımlı canavar etkisi + 6 büyü (`data/condition-effects.json`), ~30 rider'dan üretilen süreli durum. "Second failure", lanet ve HP-eşiği etkileri yok |
| Canavar saldırı ek etkileri (`rider`) | kısmen | `data/attack-riders.json` (`node scripts/riders-uret.cjs` ile üretilir): ek hasar, koşullu hasar, Grappled (kaçış DC, sürükleme), Prone (boyut, save), hücum (20+ ft düz koşu), süreli durumlar uygulanıyor (325'te 217 tam, 31 kısmen, 16 süreli etki). 61 rider uygulanmıyor: itme/çekme, lanet, yutma, ikinci aşama, HP eşiği, özel metin |
| Yakalama ve yere düşme | kısmen | Grappled (hız 0, kaçış eylemi, sürükleme yarı hız, yakalayan düşünce biter) ve Prone (kalkmak hızın yarısı) var. Yakalananın başka hedefe dezavantajı ve oyuncunun yakalama (Grapple) eylemi yok |
| Feat'ler (köken, ASI, Fighting Style, Epic Boon) | kısmen | Seçim var; uygulanan: ASI, Alert (inisiyatif), Skilled, Archery, Defense, Great Weapon Fighting, yetenek artışları. Two-Weapon Fighting (Görev P1). Magic Initiate, Savage Attacker ve Boon'ların özel etkileri yok. SRD'de Fighting Style feat'i yalnızca 4 tane (Dueling, Protection, Interception vb. yok) |
| Yan el ve eller | kısmen | Görev P1: Light ek saldırısı, Nick, Two-Weapon Fighting, Versatile iki el (kalkan ve geçerli yan el yoksa). Basitleştirmeler: taşınan her Two-Handed silah (yaylar dahil) yan eli engeller; aynı silahtan iki tane taşınamaz; elde silah değiştirme (Interact) yok |
| Oyuncu ırk özellikleri (Dragonborn Breath Weapon…) | yok | Irk yalnızca puan, direnç, karanlık görüş ve jeton ölçeği veriyor; "Nefes" butonu bu yüzden yok |
| Kalıcı alan büyüleri | kısmen | Yalnızca Spirit Guardians ve Spiritual Weapon |
| Çok altıgenlik büyük canavarlar | yok | Ölçek yalnızca görsel; mekanik tek altıgen |
| Efsanevi eylem ve direnç | yok | 30 canavar; ejderhalar bu yüzden olduklarından zayıf |
| Canavar büyüleri ve tepkileri | yok | 73 eylem, 24 tepki desteklenmiyor |
| Koni ve çizgi alanlar (nefes silahları) | kısmen | Tek hedefe indirgeniyor |
| Durum bağışıklığı | yok | 75 canavar |
| Canavar özellikleri (Pack Tactics, Magic Resistance…) | kısmen | Çoğu `unsupported` notu olarak duruyor |
| Dinlenme (kısa/uzun) | kısmen | Savaşlar arası (karakter listesi, Game Master kurulumu); Arcane Recovery, Sorcerous Restoration gibi dinlenme özellikleri yok |
| Oyuncu tepkileri (Shield vb.) | kısmen | Fırsat saldırısı var, tepki büyüsü akışı yok |
| Sabit hasar | kısmen | Sabit hasar "1d2 + (N − 1)" ile yaklaşıklanıyor (21 canavar) |
| GM'e gizli tuzak görünümü | yok | Bulunmamış tuzak kimseye çizilmiyor (gizli jeton katmanı kullanılabilir) |
| Ağ üzerinden çok oyunculu | yok | Tek ekran paylaşımlı |
| Yapay zekânın gizlenmesi | yok | Yapay zekâ Gizlen kullanmaz; gece kuralı bu yüzden simülasyonda etkisiz (Orman/Kale gece = gündüz) |
| İngilizce (EN) arayüz | kısmen | Ekran metinleri ve günlük çevrili; motor hata/gerekçe metinleri ve veri açıklamaları (tür özellikleri, eşya, harita/zemin adları) yalnızca Türkçe |

Önerilen sıra:
1. Aşama 1: seviye 1–5 sınıf özellikleri (altyapı Görev N'de hazır; `docs/SEVIYE-DENETIMI.md`)
2. Hazırla (Ready) eylemi
3. Efsanevi eylem/direnç ve koni nefes (sonra ejderha dengesi yeniden ölçülmeli)
4. 4.+ seviye büyüler (önce yukarı slot etkileri)
5. Canavar büyüleri, tepkileri, bağışıklıkları ve özellikleri
6. Kalıcı alan büyüleri ve oyuncu tepkileri
7. Dinlenmeyle çalışan sınıf özellikleri (Arcane Recovery…)
8. Çok altıgenlik canavarlar
9. GM tuzak görünümü
10. Ağ üzerinden çok oyunculu
