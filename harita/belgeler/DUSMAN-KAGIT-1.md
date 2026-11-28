# DUSMAN-KAGIT-1: karakter kâğıdını düşman tarafına koymak

Tarih: 2026-11-28. Kural sürümü ve kayıt sürümü **değişmedi** (110 / 28). Boss davranışı sonraki görev.

Genel yetenek: kod hiçbir karakter adı ya da kimliği bilmez. Herhangi bir kayıtlı karakter (ya da veride verilen bir kâğıt)
düşman olarak seçilebilir.

## Ne yapıldı

| Parça | Dosya | Not |
|---|---|---|
| Taraf parametresi | `src/battle/create.ts` | `combatantFromSheet(sheet, { …, side })`; varsayılan parti, savaşçı aynen. `side: 'enemies'` → `ownerId: null` (Game Master'ın tarafı). Yüklem `sheetFoe(c)`: düşman tarafında, canavar kimliği yok, çağrı/masum/yönetilen değil, seviyeli. Savaşçıda yeni alan yok. |
| Kurulum | `src/app/setup.ts`, `src/app/sheetFoe.ts` | `BattlePlan.sheetEnemies` (`{ id, sheet, count }`); kâğıt düşmanlar canavarlardan sonra `foeN` numarasıyla, aynı kâğıttan birden çoksa "Ad 1, Ad 2". Kâğıdın **tam kopyası** (tam can, dolu kaynak/slot; kayıtlı durum okunmaz). `planProblems`: "X hem partide hem düşman olamaz." |
| Game Master ekranı | `src/screens/GmScreen.tsx`, `strings.ts`, `strings.en.ts` | Düşmanlar panelinde açılır "Karakter düşmanlar (N)" grubu: geçerli kayıtlı karakterler, sınıf etiketi, tahmini CR, partideyse ⚠, adet sayacı. Görüntü `docs/gorev-dusman-kagit/gm-karakter-dusmanlar.png`. |
| Savaş sonu | (değişiklik yok) | `applyBattleResult` yalnız `side === 'party'` ve `ownerId === karakter` olan savaşçıyı yazar; kâğıt düşman sahipsiz, kayıt bozulmaz (testte doğrulandı). |
| Serüven/yolculuk | `src/app/journeyBattle.ts`, `src/app/seruvenBattle.ts`, `data/kagit-dusmanlar.json` | Düşman listesinde `kagit:<kimlik>` anahtarı `data/kagit-dusmanlar.json` `kagitlar` kaydından kâğıt düşman kurar (kayıt yoksa atlanır). Kayıt şu an **boş**; boss ve rakip parti kâğıtları buraya veri olarak eklenecek. XP: kâğıt anahtarı yoksa eskisi gibi; varsa canavarlar eski yoldan + kâğıtlar CR tahmininden. 6+ seviye `battleEnemyXp` kâğıt düşmanları da sayar. |
| Kayıt/replay | (değişiklik yok) | Kayıt olay günlüğüdür; `battle_started` savaşçının tamamını taşır. Kayıt sürümü gerekmedi; eski kayıtlar aynen yüklenir. |
| Yapay zekâ | `src/battle/ai.ts` | Sınıf özelliği sezgilerinin kapısı `side === 'party'` → `pcSide(c)` (parti ya da kâğıt düşman): parti dalı (`partyBranch`: iyileştirme, alan büyüsü, Power Word…), bonus özellikler (Second Wind, Hunter's Mark…), Steady Aim, Horde Breaker, yan el, smite, Stunning Strike, Flurry/bonus vuruş, süren güçlendirme, Bless türü, Reckless, saldırı için yürüme, menzilli yer seçimi; haritasız savaşta kâğıt düşman canavar yolunu kullanmaz. `healAlly` dostları aktörün tarafından seçer (parti için aynı). Harita/hedef sezgileri (sızma, çadır, hedef koşucusu, uyuyan ejderha, keşif) tarafa bağlı kaldı. Tepkiler motor tarafında zaten tarafsız. |
| CR tahmini | `src/app/sheetFoe.ts` | `estimateCr` (özel canavar tahmini) aynen: savaştaki can, AC ve en iyi saldırı (silah × Attack eylemi saldırı sayısı; hasar cantrip'i SRD ölçeğiyle, büyü saldırı bonusu). Örnek: Wizard 5 → CR 1, Fighter 5 → CR 2. Veride `cr` verilirse o kullanılır. |

Gözlem (yalnız test, ölçüm değil): kâğıt düşman Wizard Fireball ve Hold Person, Cleric Spiritual Weapon, Preserve Life,
Sacred Flame ve Cure Wounds, Fighter Action Surge ve Second Wind kullandı; Shield bilen Sorcerer kâğıdı Shield tepkisi aldı.

## Testler (gerçek durum)

- `npm run typecheck`: yeşil.
- `src/app/sheetFoe.test.ts` (yeni, 5 test): savaşçı kurulumu, adet/çakışma, CR, 3 tohum çökmesiz savaş (2 kişilik parti ↔
  Wizard kâğıdı + 2 kurt; kâğıt düşman eylem yapar, en az bir büyü), `replay` = son durum, `serializeSession`/`restoreSession`
  aynı durum, düşman seçilen kayıtlı karakter değişmez, parti üyesine durum yazılır; Shield tepkisi. Geçti.
- İlgili testler: `setup.test.ts`, `setup-ui.test.tsx`, `od1-oda.test.tsx`, `k25.test.tsx`, `modulBaslatma.test.ts`,
  `g2-smoke.test.ts`, `seruven.test.ts`, `seruvenEnemies.test.ts`, `journey/app.test.ts`, `hapishane.test.ts`,
  `ai/evaluate.test.ts`, `ai/y2.test.ts`, `ai.test.ts`: geçti.
- 3 tohumlu hızlı regresyon `src/sim/katalog110Regresyon.test.ts` (`K110_TOHUM=3`): tek sınıflı savaşçı hash'leri altınla aynı;
  Çöl/Kale/Mağara/Orman imzası 109 = 110 = altın. Geçti (parti savaşçıları ve yapay zekâ kâğıt düşman yokken aynen).
- `npm run build`: yeşil; ana parça 464,13 kB / 500 kB (bu görevin katkısı +0,3 kB: TR metinleri; kod `setup` ve `GmScreen`
  parçalarında).
- `check:harita`, `check:ses`: dokunulmadı (harita verisi/görseli/yükleyicisi, savaş çizimi ve ses dosyalarına dokunulmadı),
  çalıştırılmadı. Tam `npm test` çalıştırılmadı (hafif mod).

## Yapılamayan / sınırlar

- Odada (çevrimiçi) kâğıt düşman seçimi Game Master cihazında yerel; oda kaydına yazılmaz (canavar adetleri gibi).
- Yapay zekâ rol türetmesi (`ai/evaluate.ts` `roleOf`): şifacı kâğıt düşman "destek" rolü almaz (parti tarafına bağlı; dosya
  bütçesi nedeniyle dokunulmadı). Etkisi: değerlendiricinin rol ağırlıkları; kural sezgileri yine çalışır.
- Kâğıt düşman kayıtlı durumuyla (yaralı) başlatılamaz; hep tam kopya.

## KARAR GEREKİYOR

1. **0 HP'de ölüm save'i:** kâğıt düşman canavar gibi 0 HP'de düşer, ölüm save'i atmaz (SRD 5.2.1 "Monsters and Death"
   Game Master'a bırakır). Adlı düşmanlar (boss) için ölüm save'i ya da "bayılır, ölmez" seçeneği istenir mi?
2. **CR tahmini:** slotlu büyüler (Fireball vb.) ve sınıf özellikleri (Sneak Attack, Action Surge) hesaba girmiyor; büyücüler
   düşük çıkabilir (Wizard 5 → CR 1). Seviyeye bağlı alt sınır ya da DMG benzeri tablo istenirse ayrı karar (SRD 5.2.1'de
   CR hesaplama tablosu yok). Şimdilik veride `cr` elle verilebilir.
3. **Serüven başvurusu:** düşman listesi `kagit:<kimlik>` → `data/kagit-dusmanlar.json`. Kullanıcının yerel kayıtlı
   karakterlerine (localStorage) Serüven verisinden başvuru yok; boss/rakip parti kâğıtları veri dosyasına yazılmalı.
