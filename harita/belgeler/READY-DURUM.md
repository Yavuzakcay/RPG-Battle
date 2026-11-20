# Hazırla (Ready) eylemi: durum denetimi

Tarih: 2026-11-20. Salt okunur denetim; ürün koduna dokunulmadı. Ağaç: `birlesik` `9e36356e` (güncel kural sürümü 87, kayıt sürümü `SAVE_VERSION` 23).

> **Güncelleme 2026-11-20 (GENEL-SAVAS-DENETIM düzeltmeleri):** bu belge kural sürümü 87 anındaki durumu yazar ve **artık
> geçerli değil**. Ready eylemi kural sürümü 90'dan beri var (kayıt sürümü 24): komut ve tepki tetiği `src/battle/ready.ts`,
> veri `data/hazirla.json`, arayüz `src/ui/ReadyPanel.tsx`, testler `src/battle/ready.test.ts`, regresyon
> `src/sim/readyRegresyon.test.ts`; kararlar DECISIONS.md "Hazırla (Ready) eylemi: kural sürümü 90". Kalan: yapay zekâ Ready
> kullanmıyor (R3), yanıtlar yalnız tek saldırı / hareket / büyü (`harita/belgeler/GENEL-SAVAS-DENETIM.md` A23, A27). Aşağıdaki
> metin geçmiş kaydı olarak korunuyor.

## Sonuç (sürüm 87; eski)

**Ready eylemi oyunda yok.** Ne komutu, ne olayı, ne arayüz düğmesi, ne tetik türü, ne yapay zekâsı, ne de testi var. Kaynaklarda yalnızca "yok" kaydı ve 2026-10-16 tarihli, uygulanmamış bir tasarım önerisi bulunuyor. CLAUDE.md "Bilinen eksikler" satırı ("Hazırla (Ready) eylemi | yok") doğru.

## 1. Arama

Aranan: `ready`, `Ready`, `readied`, `ready_`, `Hazırla`, `hazırla` (`src/`, `data/`, `DECISIONS.md`, `CLAUDE.md`, `harita/belgeler/`, `docs/`).

| Yer | Bulunan | Ready eylemi mi? |
|---|---|---|
| `src/battle/types.ts` `Command` / `BattleEvent` | `ready` adlı komut ya da olay yok | — |
| `src/rules/reactionChoice.ts` `ReactionTrigger` | `hit`, `targeted`, `leave`, `cast`, `damaged`, `fall`, `redirect`, `turnStart`, `miss`, `ally`, `choice`; `ready` yok | — |
| `src/battle/reactions.ts` | Ready ile ilgili bir şey yok | — |
| `src/battle/paket/p9.ts`, `p10.ts` | iç yardımcı `ready(state, g, r, …)`: paket tepkisinin hakkı/menzili uygun mu | Hayır (adı rastlantı) |
| `src/ui/splashLogic.ts`, `Splash.tsx` | açılış ekranı durumu `{ type: 'ready' }` | Hayır |
| `src/screens/*`, `src/ui/*` (`setReady`, `monstersLoaded` …) | veri yüklendi bayrağı | Hayır |
| `src/i18n/strings.ts` `spellPrepTag: 'Hazırla'` | oluşturucuda büyü hazırlama düğmesi (Prepare) | Hayır |
| `src/i18n/strings.en.ts` `reactionRecharged`, `abilityRecharge` | "ready again / not ready" (Recharge zarı) | Hayır |
| `data/*.json` (`class-features.json`, `srd/*.json`, büyü verileri) | Ready eylemine bağlı mekanik kaydı yok | — |
| `src/**/*.test.ts(x)` | Ready eylemini sınayan test yok | — |
| `CLAUDE.md` "Bilinen eksikler" | "Hazırla (Ready) eylemi \| yok \| Tasarım önerisi DECISIONS.md'de …" | Durum kaydı |
| `DECISIONS.md` "2026-10-16 — Durum süreleri; Kaçın (Dodge) ve Yardım (Help); Hazırla (Ready) önerisi" | "Öneri — Hazırla (Ready), uygulanmadı" | Öneri (aşağıda) |
| `DECISIONS.md` "2026-10-16 — Savaşı kaydet/yükle" | "Yok (sonraya): … Help ve Ready eylemleri" | Eski not |
| `DECISIONS.md` (YZ bölümü) | "Ready yok; yapay zekâ Gizlen kullanmaz (eski)" | Durum kaydı |
| `harita/belgeler/YZ-DENETIM.md` | "Hazırla (Ready), Gizlen (yapay zekâ) \| yok (eski)" | Durum kaydı |
| `harita/belgeler/Y1-ENVANTER.md` #13 | "Ready eylemi … geçerli (mekanik yok) … kapsam dışı" | Durum kaydı |
| `harita/belgeler/GOREV.md` | eski görev listesinde "Help ve Ready eylemleri" | Eski not |
| `harita/belgeler/DURUM-2026-11-20.md` | "Ready eylemi yok" | Durum kaydı |

Ayrıca etiket ya da açıklama olarak da yok: arayüzde "Hazırla" adında bir savaş eylemi görünmüyor (tek "Hazırla" metni büyü hazırlama düğmesi).

## 2. Mevcut öneri (DECISIONS.md, 2026-10-16, uygulanmadı)

- Komut `ready { actorId, trigger, response }`: eylem harcar, tepkiyi ayırır, sonraki turunun başında biter.
- Tetikler: `enemyEntersReach`, `enemyEndsMoveInRange`, `allyAttacked`.
- Yanıtlar: tek saldırı (Extra Attack yok), hızın kadar yürüme, hazırlanan büyü (slot hemen harcanır, konsantrasyon gerekir).
- Uygulama yeri: hareket ve saldırı komutlarından sonra, fırsat saldırısının yanında `readyTriggers(state, events)`. Yapay zekâ ilk sürümde kullanmaz.

Bu öneri tepki sisteminden (Görev R1) önce yazıldı. Bugünkü altyapı onu daha az kodla karşılayabilir (bölüm 4).

## 3. SRD 5.2.1 kuralı (PDF s.186–187, "Ready [Action]")

- Kendi turunda eylem olarak alınır. Sonraki turunun başına kadar bir Reaction ile hareket etmeni sağlar.
- Önce **algılanabilir** bir tetik seçilir, sonra ona yanıt olarak yapılacak **eylem** ya da **hızın kadar hareket** seçilir.
- Tetik olunca tepki **tetik bittikten hemen sonra** kullanılır ya da tetik yok sayılır.
- Büyü hazırlanırsa:
  - Normal yapılır, kaynakları (slot) hemen harcanır ama enerjisi tutulur ve tetikte tepkiyle salınır.
  - Döküm süresi bir eylem olmalı.
  - Tutmak Concentration ister, en çok sonraki turunun başına dek.
  - Konsantrasyon bozulursa büyü etkisiz dağılır.
- Ek not (Fighter "Level 5: Extra Attack", s.48; diğer sınıflarda aynı metin): Extra Attack "Attack eylemini **kendi turunda** aldığında" ("whenever you take the Attack action on your turn"). Bu yüzden hazırlanan saldırı tek saldırıdır (önerideki gibi).

## 4. Uygulama önerisi

### 4.1 Mevcut altyapıdan kullanılacaklar

| Gerekli | Var olan |
|---|---|
| Tepki hakkı | `canReact`, `reactionUsed` → `reaction_used` (`reactions.ts`) |
| Oyuncuya sorma / YZ önerisi / zar defteri ve replay | `askReaction(rng, req)`, `NeedReaction`, `alwaysAnswer` (`reactionChoice.ts`); ayar `ui/reactionSetting.ts` |
| Yürüyüş adımında tetik (erişime girme) | `turnHooks.ts` `registerAfterStep` (P10; hızı 0 olanın yürüyüşü durur), fırsat saldırısı deseni `features.ts` `opportunityAttacks` / `leavesReach` |
| Komut sonu tetik (hareketini bitirdi, saldırdı, büyü yaptı) | `turnHooks.ts` `registerCommandEnd`, `reactions.ts` `registerAfterAttack`, `registerCastHook` |
| Sonraki tur başında bitiş | `turnHooks.ts` `registerTurnStart`; süren etkide `untilSourceTurn` |
| Tepkide saldırı | `reactions.ts` `registerStrikes` / `strikeApi` (döngüsel içe aktarma yok) |
| Konsantrasyon | savaşçıda `concentration`, `concentrationEvent` (`slots.ts`), bitiş olayları |
| 3B erişim, görüş, gizli/görünmez | `adjacency.ts` `adjacent3D`/`gap3D`, `range.ts` `checkReach`, `sight.ts` (`hiddenTo`, `truesightSees`) |
| Önizleme | `ui/preview/` (`previewCommand` kuru çalıştırma) |

### 4.2 Model

- **Komut:** `ready { actorId, trigger: ReadyTrigger, response: ReadyResponse }`. Eylem harcar (`economy.ts`). Doğrulama: yanıt şu an geçerli mi (saldırı seçeneği var mı, büyü eylem süreli mi, slot var mı).
- **Durum:** savaşçıda `readied?: { trigger, response, round, spell?: { name, slotLevel, choice? } }`. Bir anda tek hazırlık.
- **Olaylar:**
  - `readied`: hazırlık kuruldu. Büyüde slot ve konsantrasyon olayları da buraya gelir.
  - `ready_released`: tetik oldu, tepki harcandı; ardından yanıtın kendi olayları gelir.
  - `ready_lapsed`: sebepleri `turnStart`, `concentration`, `incapacitated`, `died`.
- **Tetikler (ilk sürüm, veriyle genişler):**
  - `entersReach`: seçilen yaratık ya da herhangi bir düşman erişimime ya da X ft içine girer. Adım kancası, tetik "adım bittikten sonra".
  - `endsMoveWithin`: hareketini X ft içinde bitirir. Komut sonu.
  - `attacks`: seçilen dosta saldırı yapılır. `registerAfterAttack`, saldırı bittikten sonra.
  - `casts`: büyü yapılır. Büyü çözüldükten sonra; Counterspell'den farklı olarak iptal etmez.
  - Hepsinde "algılanabilir" koşulu: tetikleyeni görebiliyor olmak (`hiddenTo` / Truesight / karanlık).
- **Yanıtlar:**
  - `attack`: tek saldırı, seçilen silah ya da canavar saldırısı. Extra Attack ve Multiattack yok (SRD).
  - `move`: hızın kadar, hedef altıgen. Fırsat saldırısı ve zemin kuralları normal yürüyüşle aynı.
  - `spell` (ikinci aşama): döküm süresi eylem; slot `ready` anında harcanır.
    - Konsantrasyon: tutmak var olan konsantrasyonu bitirir (arayüz uyarır).
    - Salınınca büyü slotsuz uygulanır (`free`/önceden harcanmış bayrağı).
    - Konsantrasyon bozulursa ya da bitiş gelirse `ready_lapsed`, etki yok.
    - Konsantrasyonlu bir büyü salınınca, kendi konsantrasyonu tutmanın yerini alır (⚠ yorum, karar gerekir).
  - Diğer eylemler (Dash, Disengage, Dodge, Help, Hide, eşya): sonraya.
- **Karar:** tetik oluşunca `askReaction(rng, { trigger: 'ready', … })`. Oyuncu "Sor / Her zaman / Asla" ayarına uyar. Kancasız Rng'de (sim, test) öneri her zaman "kullan".
- **Yapay zekâ:** ilk sürümde kullanmaz (Dodge ve Help gibi). Böylece sim imzaları değişmez. Sonra:
  - menzilli büyücü için "yakın dövüşçü erişimime girerse vur";
  - koruyucu için "dosta saldırılırsa".

### 4.3 Dosyalar

| Dosya | Değişiklik |
|---|---|
| `src/battle/readySurum.ts` (yeni) | `READY_VERSION` (bir sonraki boş kural sürümü, şu an 88), `readyOn` |
| `src/battle/ready.ts` (yeni) | `executeReady`, tetik algılama (adım/komut sonu/saldırı/büyü kancaları), salınma, bitiş |
| `src/battle/types.ts` | `Command` `ready`, olaylar `readied`/`ready_released`/`ready_lapsed`, `Combatant.readied` |
| `src/battle/commands.ts`, `economy.ts` | komut dağıtımı, eylem maliyeti, kapı (sürüm, Incapacitated, kontrollü binek yasak) |
| `src/battle/reduce.ts` | `readied` yaz/sil |
| `src/rules/reactionChoice.ts` | `ReactionTrigger` += `'ready'` |
| `src/battle/turnHooks.ts` kayıtları | adım, komut sonu, tur başı (yeni kod `ready.ts` içinde kaydolur) |
| `src/battle/spells.ts` (+ `slots.ts`) | ikinci aşama: döküm yolunu "harca + tut" ve "sal" diye ikiye ayırma |
| `src/ui/hud.ts`, `src/MapBattle.tsx`, `src/ui/log.ts`, `src/ui/preview/` | "Hazırla" menüsü (tetik → yanıt → hedef), jeton rozeti, günlük satırları, tepki sorusu metni |
| `src/i18n/strings.ts`/`strings.tr2.ts`/`strings.en.ts` | TR/EN metinler |
| `data/kural-surumu.json`, `data/kural-kontrol.json` | sürüm notu; isteğe bağlı Game Master anahtarı `readyAction` |
| `src/app/battleSave.ts` | `SAVE_VERSION` 23 → 24 (yeni olay türleri; 3–23 yüklenmeye devam) |
| Testler | `src/battle/ready.test.ts` (tetik × yanıt, tepki harcanmış, tur başı bitişi, konsantrasyon bozulması, replay), hızlı regresyon (eski sürüm imzası aynı), matrise Ready satırları (isteğe bağlı) |

### 4.4 Tahmini boyut

- **R1, saldırı ve hareket yanıtı + 3 tetik + arayüz + testler: orta.** Yaklaşık 600–900 satır, testler dahil. Tepki altyapısı hazır olduğu için motor kısmı küçük; asıl iş arayüz akışı (tetik ve yanıt seçimi).
- **R2, büyü hazırlama: orta–büyük.** Döküm yolunu bölmek, konsantrasyon tutma, salınma anında hedef ve alan seçimi gerekiyor. Yaklaşık +400–600 satır.
- **R3, yapay zekâ kullanımı: küçük–orta.** Sim imzalarını değiştirir; denge ölçümü gerekir.

Toplam büyük. Üç ayrı görev olarak önerilir (R1 → R2 → R3).

### 4.5 Riskler

- **Konsantrasyon:**
  - Büyü tutmak var olan konsantrasyonu bitirir. Hasar alınınca CON save ile bozulabilir; bozulursa slot boşa gider (SRD).
  - Salınan konsantrasyonlu büyünün tutmanın yerini alması bir yorum (⚠). Kullanıcı kararı gerekir.
- **Slot:** `ready` anında harcanır, tetik hiç gelmezse geri gelmez (SRD). Arayüz bunu açıkça söylemeli.
- **Hedef seçimi zamanı:** SRD büyünün "normal yapıldığını" söylüyor; hedefin hazırlıkta mı, salınmada mı seçileceği açık değil (⚠). Öneri: hedef ve alan salınmada seçilir, menzil ve görüş de o anda denetlenir. Kullanıcı kararı.
- **Tepki çakışması:**
  - Aynı adımda fırsat saldırısı ve Ready tetiği olabilir. Fırsat saldırısı adımdan önce (erişimden çıkarken), Ready adımdan sonra (erişime girince) değerlendirilir.
  - Tek tepki hakkı: önce gelen harcar.
  - Ready ancak tepki hakkı varken salınır.
- **Replay uyumu:**
  - Salma kararı zar defterine yazılır (`askReaction`), adım aynı zarlarla yeniden çalışır.
  - Eski kayıtlarda `ready` komutu ya da olayı olmadığı için baştan oynatma değişmez.
  - Kancalar `readied` alanı olmayan savaşta hiçbir şey yapmaz. Yine de sürüm kapısı (`readyOn`) güvenlik için önerilir.
  - Yeni olay türleri yüzünden `SAVE_VERSION` artmalı: eski uygulama yeni kaydı açamaz.
- **Kural sürümü:** komut yalnız ≥ 88'de kabul edilir. YZ ilk sürümde kullanmadığı için `npm run sim` imzaları 87 ile aynı kalmalı (hızlı regresyonla sınanır).
- **Durumlar:**
  - Incapacitated tepki engeller; tutulan büyünün konsantrasyonu da biter, hazırlık düşer.
  - Time Stop, ele geçirme (bedende), kontrollü binek (yalnız Dash/Disengage/Dodge) ve Polymorph/Wild Shape biçimi (büyü yanıtı yok, `beast-spells` hariç) için kapılar gerekir.
- **Algılanabilirlik:** görünmez, saklanan, karanlıkta ya da yoğun örtüde tetikleyen görülmüyorsa tetik olmamalı. Var olan görüş sorgularıyla yapılır, ama test kapsamı geniş.
- **Dikey ve çok altıgen:** "erişime girme" 3B bitişiklik (`gap3D`) ve gövde (`multiHex`) ile hesaplanmalı. Fırsat saldırısındaki `leavesReach` deseni ters yönde kullanılabilir.
- **Ana parça boyutu:** savaş kodu zaten tembel parçada (`MapBattle`, motor). Ana parça (≈449 kB / 500) etkilenmez.
