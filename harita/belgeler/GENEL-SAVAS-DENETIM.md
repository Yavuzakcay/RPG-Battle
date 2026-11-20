# Genel savaş kuralları denetimi: SRD 5.2.1 ↔ oyun (sınıf dışı kurallar)

> 2026-11-20, kural sürümü 94. Düzeltme durumu aşağıda (aynı gün, sürümsüz grup). **İlk denetim yalnız denetimdi:** kod, veri ve test değişmedi. Emin olunmayan satırlar geçici testle
> gerçekten çalıştırıldı (`src/battle/zzGenel*_*.test.ts`, iş bitince silindi; bu belge dışında depoya dosya girmedi).
> Kaynak: `docs/SRD_CC_v5.2.1.pdf` "Playing the Game" (s. 5–19) ve "Rules Glossary" (s. 176–191), `pdftotext` ile; gerekirse
> `data/srd/`. Sayfa numaraları PDF sayfasıdır.

## Düzeltme durumu (2026-11-20, GENEL-SAVAS-DENETIM düzeltmeleri)

Karar kuralı (kullanıcı): SRD 5.2.1 ölçüttür; çelişen madde SRD'ye hizalanır, tek istisna oyun mekaniğini kökten bozan madde
("ertelendi, karar gerekli"). SRD dışı yeni mekanik eklenmez; SRD'den doğrulanamayan uygulanmaz ("doğrulanmadı"). Karar DECISIONS.md
"GENEL-SAVAS-DENETIM düzeltmeleri, sürümsüz grup".

- **Yapıldı (sürümsüz, savaş dışı):**
  - G5 uzun dinlenme bütün HP zarları (SRD s. 185), G2 kısa dinlenmede zar başına en az 1 HP (s. 187), G1 0 HP'de kısa dinlenme yok
    (s. 187). `src/rules/rest.ts`, `src/rules/characterRest.ts`, karakter listesi düğmesi (`player.rest.shortNeedsHp`).
  - DECISIONS.md'deki yanlış "SRD 5.2.1" atfı (uzun dinlenmede yarı HP zarı) yeni kararla düzeltildi; eski satıra işaret.
  - Öneri 17 (belgeler): `READY-DURUM.md`, `Y1-ENVANTER.md` #13, `docs/SRD-DENETIM.md` "Durumlar (15)" kısmi
    (`scripts/srd-denetim.ts`), `ENVANTER-DIGER.md` durum satırı, DECISIONS Long Jump notu (zorlu araziye iniş zorunlu, s. 185).
  - Sayfa düzeltmesi: Short Rest girişi PDF s. 187'de (bu belgede önce s. 188 yazıyordu).
- **Bekliyor (sürümlü grup):** öneri 1–5, 7–12, 15 ve 13'ün Spare the Dying kolu. Kapı: `birlesik`'te kural sürümü 95 (Swarm)
  olmalı; düzeltme anında 94'tü, bu yüzden uygulanmadı. Sürüm o anki `data/kural-surumu.json` + 1, tek sabit.
- **Ertelendi, karar gerekli (uygulanmadı):**
  - G6/D21 0 HP'de uzun dinlenme yasağı (s. 185): doğrudan uygulanınca 0 HP karakter kalıcı kalır, Serüven bozgun tekrarı ve
    Hapishane `dragBack` kırılır; SRD çıkışı (stabil yaratık 1d4 saatte 1 HP, s. 18) ölmekte/stabil kaydı ve zaman modeli ister.
  - H3/H4/H12 `nightVision` varsayılanı ve `darkness` haritaları (Karar gerekli 3).
  - D10 Knocking Out (Karar gerekli 7).
  - A45 yapay zekânın Dash yapmaması (öneri 14; denge etkisi, `npm run sim` gerektirir).
  - Oyun mekaniğini kökten değiştirecek diğer maddeler: Karar gerekli listesi.
- **Doğrulanmadı:** G7 (savaşta azalan HP en çoğunun karaktere yazılması) değişmedi.

## Kapsam notu ve sınırlar

- Sınıf dışı savaş kuralları: eylemler, durumlar, saldırı, HP/ölüm, hareket, zar/kontroller, dinlenme, ışık/görüş. Sınıf, alt sınıf ve
  büyüye özgü kurallar sınıf denetimlerinde (`harita/belgeler/*-DENETIM.md`) ve `BUYU-DURUM.md`'de; burada tekrarlanmadı.
- **Bilinçli sapmalar** (ev kuralları, harita mekanikleri, Game Master anahtarları, kayıtlı DECISIONS kararları) "bilinçli sapma"
  diye işaretlenip geçildi; değerlendirilmedi. Altıgen/dikey sistem (K68–K73), binek (MB1–MB8) ve su altı (K73c) yalnız çekirdek SRD
  maddeleriyle satırlandı; ayrıntıları kendi denetimlerinde.
- Durum: **tam** / **kısmi** / **yok** / **bilinçli sapma** / **doğrulanmadı**. Yer: savaş içi, oluşturucu, dinlenme-Serüven, YZ,
  arayüz TR-EN. Kanıt: `dosya:satır`, mevcut test adı ya da probe (`PA#`/`PB#`/`PC#`/`PD#`, dökümü en sonda).
  "Bilinen" sütunu: daha önce belgelenmişse kaynağı, yoksa "—". "**hata**" = SRD'ye aykırı ve kayıtlı kararı olmayan, probe ile görülmüş davranış.
- SRD 5.2.1 metin notları (2014'ten farklı olduğu için yanlış beklenebilecekler): dost alanı zorlu arazi **değil** (s. 14); ayrı
  "Squeezing" kuralı yok, yalnız dar açıklık zorlu arazi (s. 181); uzun dinlenme harcanan **bütün** Hit Point Dice'ı verir (s. 185);
  kısa dinlenmede zar başına **en az 1 HP** (s. 187); su altında yakın dövüş istisnası yalnız Piercing silah, menzilli istisna yok (s. 16);
  yetenek kontrolü ve save'de doğal 1/20 otomatik değil (s. 7, yalnız saldırı zarı).
- **Ready (Hazırla)** kural sürümü 90'dan beri var (`src/battle/ready.ts`). Diskteki `CLAUDE.md` "Bilinen eksikler" satırı "kısmen"
  diyor (doğru); `harita/belgeler/READY-DURUM.md` ve `harita/belgeler/Y1-ENVANTER.md` #13 hâlâ "yok" diyor (eski).
  **Güncellendi 2026-11-20:** iki belge de düzeltildi (READY-DURUM başına güncelleme notu, Y1-ENVANTER #13).

Sayı özeti, en önemli bulgular, düzeltme önerileri ve "Karar gerekli" tabloların ardında; probe dökümü en sonda.

## 1. Eylemler (A)

SRD s. 7, 10, 13–15, 18 (Actions tablosu, Bonus Actions, Reactions, Your Turn, Breaking Up Your Move) ve Glossary `[Action]` girişleri. Çapraz: A7 = E3 (Dash/uçuş hızı), A13 = F19 (Yardım edenin kendisi), A15/A16 = F2/F24 = D18 (stabilize), A44 = B35 = E9 (yere yatma).

| # | SRD kuralı (sayfa) | Oyunda | Durum | Yer | Kanıt | Bilinen |
|---|---|---|---|---|---|---|
| A1 | Turunda hızın kadar hareket + bir eylem (s.13 "Your Turn") | `economy.action` + `movementUsed`/`speedHexes`; başarısız komut harcamaz | tam | savaş içi | `economy.ts:120-131` (`spend`); test `economy.test.ts` "saldırı eylemi harcar; ikinci saldırı reddedilir…" | — |
| A2 | Hareketi bölme: eylem/bonus/tepki öncesi ve sonrası (s.14) | Hareket eylemden bağımsız bütçe | tam | savaş içi | PA5 | — |
| A3 | Attack: Extra Attack saldırıları arasında hareket (s.177) | `attacksLeft` hareketle sıfırlanmıyor | tam | savaş içi | PA5 (saldırı → yürü → 2. saldırı ok, `attacksLeft=0`) | — |
| A4 | Attack: saldırıda bir silahı takma/çıkarma (s.177) | Silah değiştirme yok; bütün silah seçenekleri elde sayılır; yalnız `drop_item`/`pick_up` | bilinçli sapma | savaş içi | `heldItems.ts:1-75` | CLAUDE.md "Yan el ve eller" satırı ("elde silah değiştirme (Interact) yok") |
| A5 | Grapple/Shove Attack eyleminin bir saldırısı (Unarmed Strike) | `grapple`/`shove` Attack sayacından düşer | tam | savaş içi | `economy.ts:192-220` (case `grapple`/`shove` → `attacksLeft`) | — |
| A6 | Dash: ek hareket = değiştirilmiş hız (s.181) | `economy.dashes`, bütçe `floor(ft/5)·(1+dashes)` canlı hızdan | tam | savaş içi | `reduce.ts:73`; test `economy.test.ts` "Dash bu tur hızı bir kez daha ekler" | — |
| A7 | Dash: özel hızlardan birini seçme (s.181) | Uçuş hızı olan her zaman uçuş hızını kullanır (yürüme daha yüksekse de) | kısmi | savaş içi | `reduce.ts:69`; PA15 (yürüme 40/uçuş 30 → 6 altıgen, Dash 12; yürümeyle 8/16 olmalıydı) | — (hareket bölümüyle örtüşür) |
| A8 | Disengage: "for the rest of the current turn" (s.181) | `economy.disengaged` yalnız kendi turunun başında temizleniyor; başkasının turunda da geçerli kalıyor | kısmi | savaş içi | **hata** · `features.ts:484`, `reduce.ts:636-639` (yalnız sıradaki savaşçıya `FRESH_ECONOMY`); PA13: bonus Disengage + Hazırla(hareket) → düşman turunda tepkiyle yürürken fırsat saldırısı 0 | — |
| A9 | Dodge: saldırılara dezavantaj, DEX save avantajı, sonraki turun başına dek (s.181) | `Dodge` işareti `end: turnStart` | tam | savaş içi | `durations.ts:200-203`, `rules/conditions.ts:90`, `durations.ts:164` | DECISIONS 7584–7588 |
| A10 | Dodge: yalnız "saldıranı görebiliyorsan" | Yalnız Invisible saldıran hariç; kör (Blinded) kaçınan yine dezavantaj veriyor | kısmi | savaş içi | `rules/conditions.ts:90-92`; PA3a (Blinded + Dodge → `normal`, gerekçe "Hedef Blinded","Hedef kaçınıyor"; SRD'ye göre avantaj olmalı) | DECISIONS 7587 ("görünmez saldıran hariç") |
| A11 | Dodge: Incapacitated ya da hız 0 iken kaybedilir | Yalnız Incapacitated ve Grappled/Restrained bakılır; etkiden gelen hız 0 (`speedZero` etkisi) sayılmaz | kısmi | savaş içi | `durations.ts:132-134`, `rules/conditions.ts:90-91`; PA3b (`speedZero` etkili kaçınan → `disadvantage`) | DECISIONS 7588 (yalnız Grappled/Restrained yazılı) |
| A12 | Help (saldırı): 5 ft içindeki düşman, sonraki dost saldırısı avantajlı, yardım edenin sonraki turunun başında biter (s.183) | `Help:<taraf>` işareti, ilk saldırıda kalkar | tam | savaş içi | `durations.ts:210-234`, `reduce.ts:588-593` | DECISIONS 7591–7595 |
| A13 | Help: avantaj "one of your allies"e | Taraf işareti yardım edenin kendi saldırısına da avantaj veriyor | kısmi | savaş içi, arayüz EN | PA2 (A Yardım → A'nın saldırısı `advantage` "Yardım"); EN ipucu "your side's first attack" | DECISIONS 7593 ("o tarafın" — yardım eden dışlanmamış) |
| A14 | Help: Assist an Ability Check (s.182–183) | Yok (dost-bitişik Yardım = sarsma/kurtarma; Entangle `allyHelp`) | yok | savaş içi | `durations.ts:213-228` | DECISIONS 3677 (Yardım = sarsma) |
| A15 | Help: ilk yardım / stabilize, DC 10 WIS (Medicine) (s.18, glossary) | Motorda `stabilize` eylemi var (Medicine yalnız `srdK19` açıkken, yoksa çıplak WIS); **arayüzde düğme yok (TR/EN), YZ kullanmıyor** | kısmi | savaş içi, arayüz TR-EN, YZ | `commands.ts:679-695`; `type: 'stabilize'` `MapBattle.tsx`/`src/ui`/`ai*` içinde yok (grep) | — |
| A16 | Ability check'te doğal 20/1 otomatik değil (s.7 "Rolling 20 or 1": yalnız saldırı zarı) | Stabilize doğal 20'de otomatik başarı, doğal 1'de otomatik başarısızlık | kısmi | savaş içi | **hata** · `commands.ts:692`; PA4 (Medicine +12, doğal 1 → toplam 13 ≥ 10 ama `success:false`); aynı kalıp haritasız tırmanma `commands.ts:830` | — |
| A17 | Hide: DC 15 Stealth, yoğun örtü / ¾ siper, hiçbir düşmanın görüş hattında olmamak; başarıda Invisible, toplam = bulma DC'si (s.183) | Gizlenme yerleri veride; DC = max(15, görenlerin en yüksek pasif Algısı); bitişikte gören düşman varken gizlenilemez; "Gizli" = hedef alınamaz + avantaj | bilinçli sapma | savaş içi | `stealth.ts:96-160` | DECISIONS 7107–7140 (Görev K tablosu) |
| A18 | Hide biter: fısıltıdan yüksek ses, bulunma, saldırı zarı, Verbal bileşenli büyü | Her büyü, itme, (grupsuz haritada) yürüme/atlama da bitirir | bilinçli sapma | savaş içi | `stealth.ts:221-256` (`REVEALING`) | DECISIONS 7137–7139, 5447 |
| A19 | Influence (s.184) | Komut, arayüz, Serüven karşılığı yok (GM `skill_check` var ama arayüzü yok, eylem harcamaz) | yok | savaş içi, dinlenme-Serüven | grep `Influence` `src/battle`: yok; `checks.ts:28-36` | — |
| A20 | Magic: eylemlik büyü / Magic eylemli özellik / eşya (s.185) | `cast_spell` döküm süresine göre eylem/bonus/tepki; `use_feature` veriden; `use_item` verideki maliyet | tam | savaş içi | `economy.ts:385-415`, `economy.ts:339-346`, `economy.ts:231-242` | — |
| A21 | Magic: 1 dakika+ döküm süresi her tur Magic + Konsantrasyon | Uzun dökümler `offCombat`/ritüel (kurulumda); savaş menüsünde gizli; motor yine de tek eylemle kabul ediyor (GM notu) | bilinçli sapma | savaş içi, arayüz | `ui/hud.ts:157-158`, `MapBattle.tsx:1611`, `spells.ts:822-826` | DECISIONS 1322 |
| A22 | Ready: eylem, tetik, tepkiyle yanıt ya da yok sayma, sonraki turun başında biter; büyü: eylem süreli, slot hazırlarken, tutma Konsantrasyon (s.186–187) | Sürüm 90+: `ready.ts` | tam | savaş içi | `ready.ts:66-125`, `ready.ts:303-328`; `ready.test.ts` (ör. "düşman erişime girince tek saldırı…", "fırsat saldırısı ile aynı tepki hakkı…") | DECISIONS 295–314 |
| A23 | Ready: yanıt "the action you will take" (her eylem) | Yalnız tek saldırı, hareket, büyü | kısmi | savaş içi | `data/hazirla.json` `yanitlar`; `ready.ts:85-101` | DECISIONS 314; CLAUDE.md satır 221 |
| A24 | Ready: tetik "perceivable circumstance" | Veri listesindeki 8 tetik, yalnız karşı taraf tetikler | bilinçli sapma | savaş içi | `ready.ts:79-82`; PA11 (dost kaynak → "Tetikleyen bir düşman olmalı.") | DECISIONS 301, 314 |
| A25 | Ready hareket: "move up to your Speed" | Kendi turunda yapılan Dash'in katı (`economy.dashes`) tepki hareketine taşınıyor | kısmi | savaş içi | **hata** · `ready.ts:260` (`movementUsed: 0` ama `dashes` kalıyor), `reduce.ts:73`; PA14 (hız 15 ft = 3 altıgen, bonus Dash + Hazırla → tepkiyle 5 altıgen, cost 5) | — |
| A26 | Tepkiyle hareket edip erişimden çıkan fırsat saldırısı tetikler (s.15 Opportunity Attacks; glossary s.185) | Hazırlanan hareket normal yürüyüş gibi OA doğurur | tam | savaş içi | PA8 (OA 1, B'nin tepkisi harcandı) — A8 istisnası hariç | DECISIONS 304 |
| A27 | Ready: YZ kullanımı | Yok | yok | YZ | `ready.ts:14`; grep `type: 'ready'` `ai*`: yok | DECISIONS 313; CLAUDE.md 254 |
| A28 | Ready: arayüz | "Hazırla" paneli, TR/EN metinler, tepki sorusu; savaş dışı büyüler süzülür | tam | arayüz TR-EN | `MapBattle.tsx:1643-1646`, `ui/ReadyPanel.tsx:23`, `strings.en.ts:19` (`readyUi`), `:1450` | DECISIONS 313 |
| A29 | Search: WIS kontrolü (Insight, Medicine, Perception, Survival) (s.188) | Yalnız Perception: gizli yaratık (görüş hattında), tuzak (6 altıgen), gizli alan | kısmi | savaş içi | `stealth.ts:178-206` | — |
| A30 | Study: INT kontrolü (s.189) | Genel komut yok; yalnız Phantasmal Force'tan INT (Investigation) ile kurtulma | kısmi | savaş içi | `mapcommands.ts:40` | DECISIONS 3684; SRD-DENETIM 726 |
| A31 | Utilize: eylem gerektiren nesne kullanımı (s.191) | `object_use` "Utilize" eylemi (kilit, masa, mangal, kol); Fast Hands bonus; Haste ek eylemiyle (35+) | tam | savaş içi | `economy.ts:296-306`, `economy.ts:174` | DECISIONS 4640, 3678 |
| A32 | Turda bir serbest nesne etkileşimi; ikincisi Utilize (s.13) | Kapı aç/kapa, `take`, `put` sınırsız ve sayaçsız serbest; yalnız `pick_up` `interacted` sayar (ortak bütçe yok) | kısmi | savaş içi | `economy.ts:298-300`; PA1 (aç/kapa ×5 → `action:false`, `interacted` yok); `heldItems.ts:70` | DECISIONS 3586 (yalnız `pick_up`), 5492 |
| A33 | İkinci etkileşim eylem gerektirir (eylem kuralları geçerli) | `pick_up`'ın ikinci etkileşimi `action_used`'u `economyCost` dışında yazıyor: Dazed/Slow/Stinking Cloud/Haste kısıtı atlanıyor | kısmi | savaş içi | **hata** · `heldItems.ts:70-73`; PA10 (Dazed + yürümüş: Dash reddedildi, ikinci `pick_up` eylemle geçti) | — |
| A34 | Bonus eylem yalnız bir kural verirse (s.10, glossary s.178) | Hide/Dash/Disengage bonusla yalnız `bonusOptionsOf`; diğerleri özellikten | tam | savaş içi | `economy.ts:150-153`, `:288-294`; test `economy.test.ts` "bonus eylemle yalnızca özelliği olan yapar…" | — |
| A35 | Turda tek bonus eylem | İkinci bonus reddedilir; ek bonus yalnız özellik/etki verirse (`extraBonus`) | tam | savaş içi | `economy.ts:122-127`; PA6 ("Bonus eylem bu tur kullanıldı."); `extraBonus.test.ts` | — |
| A36 | Bonus eylemin zamanını oyuncu seçer, özellik belirtmedikçe | Light ek saldırısı Attack'tan sonra; diğerleri serbest | tam | savaş içi | `economy.ts:42-47`, `:222-229` | — |
| A37 | Eylem yoksunluğu bonus eylemi de engeller; Incapacitated: eylem/bonus/tepki yok, hareket serbest (glossary s.184) | `checkActor` + `canReact`; `MOVE_ONLY_COMMANDS` | tam | savaş içi | `common.ts:129-135`, `reactions.ts:53-58`; PA7; `incapacitated.test.ts` "eylem, bonus eylem yok; tepki yok; yürüyebilir…" | DECISIONS 6445 |
| A38 | Tepki: bir tane, kendi turunun başına dek; kendi turunda eylem/bonusla birlikte de (s.10, glossary s.187) | `economy.reaction`; sıradaki savaşçıya `FRESH_ECONOMY` | tam | savaş içi | `reduce.ts:754-760`, `reduce.ts:636-639`; test `economy.test.ts` "tepki büyüsü (Shield) başkasının turunda yapılır…" | — |
| A39 | Tepki tetikten hemen sonra; kesilen yaratık turuna devam eder | Ready adımdan/saldırıdan/komuttan sonra; OA erişimden çıkmadan önce | tam | savaş içi | `ready.ts:304-322`, `features.ts:472-520`; `ready.test.ts` "…yürüyüş sürer" | DECISIONS 302 |
| A40 | OA: tepki harcar; Disengage, ışınlanma ve zorla hareket tetiklemez (s.15) | Yalnız kendi yürüyüş/tırmanma/atlama yollarından `opportunityAttacks` | tam | savaş içi | `features.ts:483-520`; çağrılar `movement.ts:555`, `airMove.ts:257`, `climb.ts`, `drop.ts:87` | — (A8 istisnası) |
| A41 | Action Surge: ek eylem, Magic hariç | Yalnız `cast_spell` (eylemlik) reddedilir; Magic eylemli `use_feature`/eşya denetlenmiyor | kısmi | savaş içi | `economy.ts:409`; PA9 (cantrip reddi doğru); özellik/eşya kolu denetlenmedi | doğrulanmadı (Magic kolu) |
| A42 | Turda tek slotlu büyü (Spellcasting; ekonomi) | `slotTurn`; Ready büyüsü de sayılır | tam | savaş içi | `economy.ts:271-276`, `:413-414`; `economy.test.ts` "bonus eylem büyüsü (Healing Word) + eylemle cantrip…" | DECISIONS 309 |
| A43 | Hiçbir şey yapmama (s.14) | `end_turn` | tam | savaş içi, arayüz | `commands.ts` `end_turn` | — |
| A44 | Dropping Prone: eylemsiz, hızsız, hız 0'da olmaz (s.14) | Komut yok | yok | savaş içi | grep `drop_prone`/`yere yat`: yok | CLAUDE.md "Yakalama ve yere düşme" satırı |
| A45 | YZ: Dash | **Ertelendi 2026-11-20 (denge etkisi, karar bekliyor).** Hiçbir savaşçı Dash eylemi seçmiyor (yalnız canavar yeteneği `grant: dash`, kontrollü binek) | yok | YZ | PA12 (hız 30, hedef 11 altıgen: `move,end_turn`, 5 altıgen kala durdu); grep `type: 'dash'` `ai.ts`: yok | — |
| A46 | YZ: Disengage | Yalnız bonus eylemle (Cunning Action), yürüyüş OA yedirecekse | kısmi | YZ | `ai.ts:1710-1719` (`guardMove`) | — |
| A47 | YZ: Dodge / Help | Familiar (Yardım, yoksa Kaçın), kontrollü binek, dostu sarsma | kısmi | YZ | `ai.ts:3064-3076`, `ai.ts:1921-1929`, `ai.ts:1895` | Y1-ENVANTER #11; DECISIONS 6475 |
| A48 | YZ: Hide | Yalnız sızma (uyuyan/habersiz grup) haritalarında | kısmi | YZ | `ai.ts:2545-2556` | Y1-ENVANTER #12; DECISIONS 5447 |
| A49 | YZ: Search, Stabilize, Influence, Study, Ready | Kullanmıyor | yok | YZ | grep `type: 'search'`/`'stabilize'`/`'ready'` `ai.ts`, `ai/`: yok | DECISIONS 313 (Ready) |
| A50 | YZ: Utilize / eşya | Kapı açma, tutuşturma, taşıma, nesne fırlatma, iksir | kısmi | YZ | `ai.ts:2355`, `:2443`, `:2577`; `ai/behaviors.ts:161`, `itemCands` | DECISIONS 5449 |
| A51 | Arayüz: temel eylem düğmeleri | Saldır, Hareket ▸ Yürü/Koş/Geri Çekil, Kaçın, Yardım, Gizlen, Ara, Hazırla, Nesne, Eşya, Dikkat dağıt, Kalk, Kaçmaya çalış; TR ve EN | tam | arayüz TR-EN | `MapBattle.tsx:1594-1661`; `strings.tr2.ts:467-468`, `strings.en.ts:1253-1254`, ipuçları `strings.en.ts:1445-1460` | — |
| A52 | Arayüz: eksik eylem girişleri | İlk yardım/stabilize, Influence, Study, yere yatma, GM beceri kontrolü (`skill_check`) için düğme yok | yok | arayüz TR-EN | grep `type: 'stabilize'`/`skill_check` `MapBattle.tsx`, `src/ui`, `*.tsx`: yok | — |

## 2. Durumlar (B)

SRD Glossary s. 176–191 durum maddeleri; Condition (s. 179), Immunity (s. 183). Çapraz: B33 = E7 (kalkma maliyeti), B39–B41 = D14 (baygının Prone'u). `docs/SRD-DENETIM.md:493` ve `harita/belgeler/ENVANTER-DIGER.md:49` 15 durumu "tam/ÇALIŞIR" gösteriyor; B3, B4, B28, B29, B32, B39–B41 bu kaydı yanlışlıyor.

Durum rozetleri ve adlar: rozetler `src/ui/damageFloats.ts:62` (`statusIcons`; Blinded/Petrified/Unconscious savaş rozetinde bilinçli olarak yok, E1 kararı, `harita/belgeler/GORSEL-ENVANTER.md:200`), bitkinlik kum saati + seviye; durum adları SD4 gereği iki dilde İngilizce (`strings.ts:116`, `strings.en.ts:447`). Sorun bulunmadı.

| # | SRD kuralı (sayfa) | Oyunda | Durum | Yer | Kanıt | Bilinen |
|---|---|---|---|---|---|---|
| B1 | Condition: durum kendisiyle birikmez; Exhaustion istisna (s.179) | `condition_changed` var olan durumu yeniden eklemez; süreli sayaç eskisinin yerine geçer; Exhaustion sayısal alan | tam | savaş içi | `src/battle/reduce.ts:1074-1084` | — |
| B2 | Immunity: bağışık olunan durum hiç etkilemez (s.183) | Canavar durum bağışıklığı savaş başında etki (`immune`); `condition_changed`, saldırı `conditionsAdded`, süren etki `grants` (89+) süzülür | kısmi | savaş içi | `monsterTraits.ts:32-33`, `reduce.ts:165-167, 778, 985, 1076`; istisnalar B3, B4 | SRD-DENETIM "Durum bağışıklığı (75) tam" |
| B3 | Immunity → Exhaustion bağışıklığı | Zombie'de `immune: [Exhaustion, Poisoned]` var ama `exhaustion_changed` hiçbir yerde bağışıklığa bakmıyor (dondurucu soğuk, boğulma, Loathsome Limbs, boss) | yok | savaş içi | PB6; `reduce.ts:1404-1409`, `deathWard.ts:9-15` | — |
| B4 | Immunity → Prone bağışıklığı (itme) | Shove "Prone" seçeneği `shove_resolved` reducer'ında bağışıklığa bakmadan Prone ekliyor (canavar rider'ları ise `condition_changed` yolundan süzülüyor) | yok | savaş içi | PB7; `reduce.ts:1089-1095` | — |
| B5 | Süre / kurtarma ile bitiş (durum tanımları "how to end") | Tur sayısı, sahibinin turu başı/sonu, "save ends" (tur sonu save), iki aşamalı `escalate`, `wakeOnDamage` | tam | savaş içi | `durations.ts:68-137`; `incapacitated.test.ts` "kurtarma zarıyla çıkış (Hold Person)" | — |
| B6 | Blinded: göremez (s.177) | `canSeeTarget` Blinded'da yalnız Blindsight/Truesight menzilinde görür; "görülen hedef" isteyen büyüler reddedilir (83+) | tam | savaş içi | `sight.ts:106-112`, `spells.ts:234` | — |
| B7 | Blinded: görme gerektiren kontrolde otomatik başarısız | Pasif Algı Blinded'da düşmüyor; Blinded gözcü bitişikteki gizleneni "görerek" buluyor ve Gizlen DC'sini yükseltiyor (`canSee` Blinded'a bakmıyor) | kısmi | savaş içi | PB2, PB13; `stealth.ts:78-91, 127-131, 180-185`, `maprules.ts:754-779` | — |
| B8 | Blinded: ona saldırılar avantajlı, onun saldırıları dezavantajlı | `TARGET_ADVANTAGE` / `ATTACKER_DISADVANTAGE` | tam | savaş içi | `conditions.ts:33-34` | — |
| B9 | Charmed: büyüleyene saldıramaz / zarar veren etkiyle hedefleyemez (s.178) | Yalnız `charm` işaretli süren etkide (Charm Person, Suggestion, Karadul…); zarar vermeyen büyü serbest (83+). Rider'dan gelen süreli Charmed durumu (pirate Enthralling Panache, sprite Enchanting Bow, lamia Corrupting Touch) kaynağa saldırıyı engellemiyor | kısmi | savaş içi | PB14; `range.ts:53-56, 84-87`; `data/attack-riders.json` (pirate, sprite), `data/canavar-ekleri-a2.json` (lamia) | DECISIONS K01 (83, yalnız "harmless") |
| B10 | Charmed: büyüleyenin sosyal kontrollerinde avantaj | Savaşta sosyal (Influence) kontrolü yok | yok | savaş içi | `rg` "Influence" sonuçsuz (savaş komutlarında yok) | — |
| B11 | Deafened: duyma gerektiren kontrolde otomatik başarısız (s.180) | Duyma kontrolü kavramı yok; yalnız sözlü buyruk büyüleri (Command, Suggestion) sağır hedefe işlemez; Silence içi Deafened sayılır | kısmi | savaş içi | `spells.ts:1817-1819`, `auras.ts:153` | — |
| B12 | Exhaustion: birikir, her alışta +1 seviye; 6'da ölüm (s.181) | Seviye 0–6, `exhaustion_changed`; 6'da hp 0 + ölü | tam | savaş içi | `reduce.ts:1404-1409`; `s1.test.ts` "Game Master ayarlar; … 6. seviyede ölüm" | — |
| B13 | Exhaustion: D20 Testi −2 × seviye | Saldırı, save, `checkDice` kullanan kontroller, inisiyatif, ölüm save'i; sabit kontrol yolları (stabilize, Dispel/Counterspell kontrolü, haritasız tırmanma) dışarıda | kısmi | savaş içi | `effectDice.ts:107-138`, `create.ts:834`, `commands.ts:149-151`; eksik: PB16, `spells.ts:1419, 1431`, `commands.ts:828` | — |
| B14 | Exhaustion: Speed −5 × seviye | `speedHexes` içinde | tam | savaş içi | `reduce.ts:76`; PB10 (30 ft, sv 2 → 4 altıgen) | — |
| B15 | Exhaustion: uzun dinlenme −1; 0'da biter | Karakter dinlenmesinde −1 | tam | dinlenme-Serüven | `rules/characterRest.ts:197`, `rules/exhaustion.ts:14` | — |
| B16 | Frightened: kaynak görüş hattındayken saldırıda ve kontrolde dezavantaj (s.182) | `frightenedNow` + `checkBase` (sürüm 2+); kontrollerin bir kısmı `checkBase`'den geçmiyor (stabilize, Dispel kontrolü, nesne/ejderha kontrolleri) | kısmi | savaş içi | `ruleVersion.ts:50-58, 72-78`; `ruleVersion.test.ts` "kaynak görünürken…", "yetenek kontrolünde dezavantaj"; eksik yollar `commands.ts:691, 828`, `spells.ts:1419` | DURUM-DENETIMI (K16E) |
| B17 | Frightened: kaynağa isteyerek yaklaşamaz | `fearBlocksStep` → `moveCostFn` | tam | savaş içi, YZ | `ruleVersion.ts:64-69`, `movement.ts:264`; `ruleVersion.test.ts` "kaynağa isteyerek yaklaşamaz" | — |
| B18 | Grappled: Speed 0, artamaz (s.182) | `speedZero` | tam | savaş içi | `conditions.ts:38-43`, `reduce.ts:62` | — |
| B19 | Grappled: yakalayan dışındaki hedefe saldırıda dezavantaj | A1 (sürüm 29+) | tam | savaş içi | `sight.ts:126-128`, `ruleVersion.ts:18` | DECISIONS A1 |
| B20 | Grappled: yakalayan sürükler, her ft +1 ft; hedef Tiny ya da iki+ boy küçükse ek maliyet yok | Sürükleme her adım ×2; Tiny/iki boy küçük istisnası yok (yalnız Grappler feat'i ve Bugbear Abduct) | kısmi | savaş içi | PB8; `movement.ts:308-314, 416` | — |
| B21 | Grappling: biter: kaçış (Athletics/Acrobatics vs DC), yakalayan Incapacitated, mesafe; yakalayan istediği an bırakır (s.182) | Kaçış ve otomatik bitişler var; "bırak" komutu yok | kısmi | savaş içi | `grapple.ts:61-102`; Command birliğinde bırakma komutu yok (`types.ts` taraması) | — |
| B22 | Incapacitated: eylem/bonus/tepki yok; konsantrasyon kırılır; konuşamaz; inisiyatifte dezavantaj (s.183) | `isIncapacitated`, `canReact`, `dropBrokenConcentration`, inisiyatif dezavantajı | tam | savaş içi, YZ | `reduce.ts:154-160`, `create.ts:821-827`; `incapacitated.test.ts` (6 test) | DURUM-DENETIMI |
| B23 | Invisible: inisiyatifte avantaj (s.183) | Sürüm 2+ | tam | savaş içi | `create.ts:823-825`; `ruleVersion.test.ts` "sürüm 2: inisiyatif … Invisible" | — |
| B24 | Invisible: görülmesi gereken etkilerden etkilenmez | `canSeeTarget` (83+, B02) | tam | savaş içi | `sight.ts:100-112`, `spells.ts:234` | DURUM-DENETIMI (eski "kalan sapma", 83'te kapandı) |
| B25 | Invisible: ona saldırı dezavantajlı, onunki avantajlı; gören için yok | `sightConditions` Invisible'ı gören/açığa çıkmış/duyuyla düşürür | tam | savaş içi | `sight.ts:119-130`, `conditions.ts:69-78` | — |
| B26 | Paralyzed: Incapacitated, Speed 0, STR/DEX save otomatik başarısız, saldırılar avantajlı, 5 ft içinden isabet kritik (s.186) | Hepsi | tam | savaş içi | `conditions.ts:34-38, 104-115`, `data/conditions.json`; `incapacitated.test.ts` "5 ft içinden isabet kritik…" | — |
| B27 | Petrified: Incapacitated, Speed 0, saldırılar avantajlı, STR/DEX save otomatik başarısız (s.186) | Var | tam | savaş içi | `conditions.ts:34-38`, `data/conditions.json` | — |
| B28 | Petrified: bütün hasara Resistance | Yok: Petrified hedef tam hasar alıyor | yok | savaş içi | PB5 (7 hasar, yarısı olmalı 3); `common.ts:207-219` | — |
| B29 | Petrified: Poisoned'a Immunity | Yok: Petrified hedefe Poisoned ekleniyor | yok | savaş içi | PB5; `reduce.ts:165-167` | — |
| B30 | Petrified: ağırlık ×10, yaşlanma durur | Yaratık ağırlığı modeli yok (taşıma yalnız nesne) | yok | savaş içi | `nesneAgirlik.ts:1-9` | — |
| B31 | Poisoned: saldırıda dezavantaj (s.186) | `ATTACKER_DISADVANTAGE` | tam | savaş içi | `conditions.ts:33` | — |
| B32 | Poisoned: yetenek kontrollerinde dezavantaj | Yok: `checkBase` yalnız Frightened ve alt soy; Poisoned kontrol "normal" atılıyor (kaçış, Algı/Arama, Gizlen, tırmanma, GM kontrolü…) | yok | savaş içi | PB1; `ruleVersion.ts:72-78` | — |
| B33 | Prone: yalnız sürünme ya da hızın yarısıyla kalkma; Speed 0'da kalkamaz (s.186) | Sürünme ×2 (sürüm 2+), `standUpCost`, `standUpProblem`; maliyet temel `speed`'den (bitkinlik/Slow düşmüş hızdan değil) | kısmi | savaş içi | `grapple.ts:41-49`, `movement.ts:347`; PB10 (sv 2 bitkin: kalkma 3 altıgen, SRD 2) | DURUM-DENETIMI (A2 sürünme) |
| B34 | Prone: kendi saldırısı dezavantajlı; 5 ft içinden ona avantaj, dışından dezavantaj | Sürüm 2+ mesafeyle (`proneWithin5`) | tam | savaş içi | `conditions.ts:79-85`, `sight.ts:129`; `ruleVersion.test.ts` "sürüm 2: 10 ft erişimden…" | DURUM-DENETIMI |
| B35 | Prone: isteğe bağlı yere yatma (Dropping Prone, Speed kuralı) | Komut yok | yok | savaş içi | Command birliğinde yok | DURUM-DENETIMI "kalan sapmalar"; CLAUDE.md bilinen eksikler |
| B36 | Restrained: Speed 0; saldırılar ona avantajlı, onunki dezavantajlı (s.187) | Var | tam | savaş içi | `conditions.ts:33-38` | — |
| B37 | Restrained: DEX save'lerde dezavantaj | Sürüm 83+ (`srd83`) | tam | savaş içi | `durations.ts:185`; `g01SaveWhy.test.ts` "durum: Restrained DEX save dezavantajı (sürüm 83+)" | DECISIONS B01 |
| B38 | Stunned: Incapacitated, STR/DEX save otomatik başarısız, saldırılar avantajlı; hız düşmez (s.189) | Var | tam | savaş içi | `conditions.ts:34-35`; `incapacitated.test.ts` | — |
| B39 | Unconscious: Incapacitated + **Prone** (s.191) | 0 HP'de ve Sleep/Knock Out/GM yoluyla yalnız `Unconscious` eklenir, Prone eklenmez. Sonuç: 5 ft dışından saldırı **avantajlı** (SRD: avantaj + Prone dezavantajı = normal) | yok | savaş içi | PB3, PB4; `reduce.ts:343-353, 1338-1341`, `spells.ts:288-289` | — |
| B40 | Unconscious: elindekini düşürür | Silahlar elde kalıyor (el modeli S2'de var ama bağlı değil) | yok | savaş içi | PB4 (`weapons` aynı, `dropped: null`); `heldItems.ts:46` | — |
| B41 | Unconscious: durum bitince Prone kalır | İyileşince Unconscious düşer, Prone yok | yok | savaş içi | PB4; `reduce.ts:1045-1049` | — |
| B42 | Unconscious: Speed 0, saldırılar avantajlı, STR/DEX otomatik başarısız, 5 ft içinden kritik | Var | tam | savaş içi | `conditions.ts:34-38` | — |
| B43 | Concentration: Incapacitated ya da ölüm kırar (s.179) | Her olaydan sonra | tam | savaş içi | `reduce.ts:154-160`; `incapacitated.test.ts` "konsantrasyon kesilir (Bless biter)…" | — |

## 3. Saldırı (C)

SRD s. 7, 14–16 (Making an Attack, Cover, Ranged/Melee Attacks, Mounted Combat, Underwater Combat), Glossary Unarmed Strike (s. 190). Su altı satırları 5.2.1 metnine göre (yakın dövüş istisnası yalnız Piercing; menzilli istisna yok).

| # | SRD kuralı (sayfa) | Oyunda | Durum | Yer | Kanıt | Bilinen |
|---|---|---|---|---|---|---|
| C1 | Avantaj/dezavantaj: aynı türden birden çok kaynak birikmez. Avantajla dezavantaj, sayısına bakılmadan birbirini götürür (s. 7, 176, 181) | `combineModes`: herhangi bir avantaj + herhangi bir dezavantaj = normal | tam | savaş içi | `src/rules/modes.ts:14-20`; `combat.test.ts:34` "avantaj ve dezavantaj birbirini iptal eder" | — |
| C2 | Doğal 20 her zaman isabet eder ve Critical Hit olur (s. 7, 179) | `resolveAttack` `crit(natural)` | tam | savaş içi | `src/rules/attack.ts:188-190,199`; `combat.test.ts:148`; PC8b | — |
| C3 | Doğal 1 her zaman ıskalar (s. 7) | `fumble` | tam | savaş içi | `attack.ts:188-190`; `combat.test.ts:143`; PC8c (+50 bonusla bile ıska) | — |
| C4 | Kritik: saldırının bütün hasar zarları iki kez atılır, değiştirici bir kez eklenir. Sneak Attack gibi ek zarlar da iki kez (s. 16) | `rollDice(..., critical)` zar sayısını ikiye katlar; ek hasarlar `result.critical` ile atılır | tam | savaş içi | `attack.ts:200`; `src/rules/dice.ts:119`; `riders.test.ts:45`; `paladin.test.ts:125` | — |
| C5 | Genişletilmiş kritik aralığı (Improved Critical "can score a Critical Hit on a roll of 19 or 20"; "hits regardless" yalnız 20 için yazılı) | `crit(natural)` doğal 19'a da AC'ye bakmadan isabet veriyor | kısmi | savaş içi | `attack.ts:189-190`; PC8 (AC 30, doğal 19: isabet + kritik) | — (yorum, "Karar gerekli") |
| C6 | Siper: yarım +2, dörtte üç +5 (AC ve DEX save). Tam siperdeki hedeflenemez. Yalnız en koruyucu derece sayılır, toplanmaz. Araya giren yaratık yarım siper verir (s. 15) | `lineOfFire` en yüksek siperi alır; siper AC'ye ve alanın DEX save'ine eklenir; tam siper = hedeflenemez | tam | savaş içi | `cover.ts:183,213-218`; `range.ts:123-124,139`; `features.ts:273`; `areaAttack.ts:129`; `matris83.test.ts:184`; `maprules.test.ts:312`; `area-spells.test.ts:64` | `docs/SRD-DENETIM.md:496` |
| C7 | Menzil: normal menzilin ötesinde dezavantaj, uzun menzilin ötesine saldırı yok. Tek menzilli saldırıda (büyü) menzil dışına saldırı yok (s. 15) | `checkReach` | tam | savaş içi | `range.ts:115-118,164-168`; `range.test.ts:54` | — |
| C8 | Menzilli saldırıda 5 ft içinde **seni görebilen** ve Incapacitated olmayan bir düşman varsa dezavantaj (s. 15) | `enemyAdjacent` Incapacitated'a bakıyor, görmeye bakmıyor | kısmi | savaş içi | `range.ts:39-47,119`; PC4a (yanında Blinded düşman: dezavantaj kalıyor), PC4b (saldıran Invisible: avantaj + dezavantaj = normal; SRD'de avantaj), PC4c (Stunned düşman: dezavantaj yok, doğru) | — |
| C9 | Göremediğin hedefe saldırıda dezavantaj. Seni göremeyen hedefe saldırıda avantaj (Invisible, Blinded) (s. 14, 184) | `attackSources` + `sightConditions` (açığa çıkma, See Invisibility, Blindsight/Truesight) | tam | savaş içi | `src/rules/conditions.ts:66-78`; `sight.ts:119-130`; `combat.test.ts:95,99`; `warlock.test.ts:211` | — |
| C10 | Yeri tahmin edilen hedefe saldırı yapılabilir; hedef orada değilse ıska (s. 14) | Gizlenmiş hedef hedeflenemiyor ("önce Ara ile bulunmalı") | kısmi | savaş içi | `range.ts:88-90` | — (kayıtlı karar bulunamadı) |
| C11 | Karanlıktaki (görülmeyen) saldıran ya da hedef | Gece görüşü kuralı `nightVision` Game Master anahtarında, varsayılan kapalı | bilinçli sapma | savaş içi | CLAUDE.md Kuyruk 19 `nightVision` | CLAUDE.md |
| C12 | Gizlenmiş yaratık saldırı zarı atınca (isabet de ıska da) açığa çıkar (s. 14, 183 Hide) | `attack`, `monster_attack`, `multiattack`, `cast_spell` açığa çıkarıyor. `bonus_strike` (Martial Arts / Flurry), `spell_followup`, tepki saldırıları açığa çıkarmıyor | kısmi | savaş içi | `stealth.ts:221-230`; PC5m (haritada gizli Monk iki `bonus_strike` attı, ikisi de "Gizlenmiş saldıran" avantajlı, ikisinden sonra da `hidden` duruyor) | — |
| C13 | Fırsat saldırısı: görebildiğin yaratık kendi hareketiyle erişiminden çıkınca tepkiyle bir yakın dövüş saldırısı. Disengage, ışınlanma ve zorla hareket tetiklemez (s. 15) | `opportunityAttacks` (görme denetimi, `disengaged`, yalnız yürüyüş adımında) | tam | savaş içi + YZ | `features.ts:480-504`; `forced.test.ts:131`; `s1.test.ts:69`; `features.test.ts:300,307`; `classTraits.test.ts:205` | `docs/SRD-DENETIM.md:495` |
| C14 | Light: Attack eyleminde Light silahla saldırınca, aynı tur bonus eylemle farklı bir Light silahla ek saldırı. Hasara değiştirici eklenmez, negatifse eklenir. Two-Weapon Fighting ekler (s. 89, feat) | `offhand_attack`, `economy.lightAttack`, `dmgMod = Math.min(0, mod)` | tam | savaş içi + oluşturucu | `weapons.ts:46`; `economy.ts:50-55`; `offhand.test.ts:71,80`; PC10 (DEX −1 ile "1d4-1") | CLAUDE.md "Yan el" (aynı silahtan iki tane taşınamaz, Interact yok) |
| C15 | Nick: Light ek saldırısı bonus eylem değil, Attack eyleminin parçası; turda bir (s. 90) | `nickOffhand` | tam | savaş içi | `offhand.test.ts:101,133` | — |
| C16 | Unarmed Strike, hasar: saldırı STR + PB, isabette 1 + STR Bludgeoning (s. 190) | `unarmedStrikeOption` (en az 0) | tam | oluşturucu + savaş içi | `weapons.ts:126-135` | — |
| C17 | Unarmed Strike, Grapple: hedef STR ya da DEX save'i seçer, DC 8 + STR + PB, hedef en çok bir boy büyük, **boş el gerekir**, el başına bir yakalama (s. 190, 182) | Boyut, bitişiklik, DC ve yüksek save var. Boş el ve el başına bir yakalama denetlenmiyor | kısmi | savaş içi | `forced.ts:52-56,258-289`; `k19feat.test.ts:59`; PC7 (kalkan + yan el silahlı savaşçı yakalayabildi) | — |
| C18 | Unarmed Strike, Shove: STR/DEX save, 5 ft itme ya da Prone, en çok bir boy büyük (s. 190) | `executeShove` | tam | savaş içi | `forced.ts:291-330`; `forced.test.ts:43,53,61,71` | — |
| C19 | Binme ve inme: hızın yarısı (aşağı yuvarlanır), binek 5 ft içinde, binekten en az bir boy büyük (s. 15) | `mounted.ts`; altıgene aşağı yuvarlanıyor | tam | savaş içi | `mounted.ts:48,65,88,93`; `binekMb1.test.ts:148` | `BINEK-PLAN.md` §8 B3 |
| C20 | Kontrollü binek: inisiyatifi binicininki, yalnız Dash/Disengage/Dodge, bindiği tur hareket eder. Bağımsız binek kendi sırasında oynar (s. 16) | MB2 | tam | savaş içi + YZ | `binekMb2.test.ts:64,113,139` | `BINEK-PLAN.md` §17 |
| C21 | Düşme: binek isteği dışında hareket ettirilince ya da binici/binek Prone olunca DEX 10; başarısızsa 5 ft içine Prone düşer (s. 16) | MB1 | tam | savaş içi | `binekMb1.test.ts:93,107,124,154` | `BINEK-PLAN.md` §8 B8–B10 (⚠ yorumlar) |
| C22 | Binekte fırsat saldırısı: 5.2.1'de "binici ya da binek" seçimi yok, yalnız hareket eden binek tetikler | Yalnız binek | tam | savaş içi | `binekMb1.test.ts:200`; `binekMb2.test.ts:161` | `BINEK-PLAN.md` §8 B7 |
| C23 | Su altı, yakın dövüş: yüzme hızı olmayanın silah saldırısı, hasarı Piercing değilse dezavantajlı (s. 16) | `underwaterSources`; yüzme hızı istisnası | tam | savaş içi | `modes.ts:28-38`; `features.ts:232-237`; `combat.test.ts:70` | `K73C-DENETIM.md` |
| C24 | Su altı, menzilli silah: normal menzilin ötesinde otomatik ıska, içinde dezavantaj (s. 16) | `autoMiss` + dezavantaj | tam | savaş içi | `modes.ts:30-33`; `features.ts:291`; `combat.test.ts:70` | — |
| C25 | Su altındaki her şey Fire hasarına dirençli (s. 16) | Silahta `tprof1`; sürüm 64+ batıklık (K73c) | tam | savaş içi | `features.ts:299`; K73c | `K73C-DENETIM.md` |

## 4. HP ve ölüm (D)

SRD s. 16–18 (Hit Points, Damage and Healing, Dropping to 0 HP, Death Saving Throws, Stabilizing, Temporary HP), Glossary Knocking Out (s. 184). Çapraz: D14 = B39–B41, D18 = A15/A16, D21 = G1/G6.

| # | SRD kuralı (sayfa) | Oyunda | Durum | Yer | Kanıt | Bilinen |
|---|---|---|---|---|---|---|
| D1 | HP 0'ın altına inmez; iyileşme maksimumu aşmaz (s. 16–17) | `applyDamage` / `applyHealing` | tam | savaş içi | `src/rules/damage.ts:37-43`; `combat.test.ts` "HP 0'ın altına inmez…" | — |
| D2 | Bloodied: HP yarı ya da daha az (s. 16) | Heroic Rally vb. koşulu | tam | savaş içi | `commands.ts:160` | — |
| D3 | Hasar zarı + değiştirici; ceza hasarı 0'a indirebilir ama eksiye düşüremez (s. 16) | Ceza ham hasardan düşer (`damagePenalty`); Unarmed Strike en az 0 | tam | savaş içi | `features.ts:293-294` (`damagePenalty`, `rawDamage`); `weapons.ts:132` | — |
| D4 | Çok hedefli save'li hasar bir kez atılır; yarı hasar aşağı yuvarlanır (s. 16) | `areaSaveEvents`, `halfDamage` | tam | savaş içi | `areaAttack.ts:106-107`; `damage.ts:33-35` | — |
| D5 | 13 hasar türü (s. 180) | `DAMAGE_TYPES` (13) | tam | savaş içi + veri | `src/content/ilkelSema.ts:10` | — |
| D6 | Direnç: yarısı (aşağı). Zayıflık: iki katı. Bağışıklık: 0 (s. 17) | `adjustDamage` | tam | savaş içi | `damage.ts:18-30`; `combat.test.ts:190` | — |
| D7 | Aynı türe birden çok direnç ya da zayıflık tek sayılır (s. 17) | Set birleşimi, `has` | tam | savaş içi | `common.ts:207-219` | — |
| D8 | Uygulama sırası: önce değiştiriciler, sonra direnç, en son zayıflık. Aynı türde hem direnç hem zayıflık varsa yarıya iner, sonra ikiye katlanır (s. 17 örneği: 28 → 23 → 11 → 22) | Zayıflık varsa direnç hiç uygulanmıyor: ×2 | kısmi | savaş içi | `damage.ts:27-28`; `src/rules/combat.test.ts:196` yanlış beklentiyi (20) sabitliyor; PC1 (10 fire, direnç + zayıflık → 20, SRD 10; 11 → 22, SRD 10; savaşta 10 slashing → 20 "vulnerable") | — |
| D9 | Aynı saldırıda aynı türden parçalar (silah + Sneak Attack) | Her parça ayrı yarıya iniyor: dirençli hedefte 5 + 3 piercing → 2 + 1 = 3 (toplu yuvarlamada 4) | kısmi | savaş içi | `features.ts:146` (`hitExtras` parça başına `adjustDamage`); PC9 | — (SRD "instance" tanımı açık değil; "Karar gerekli") |
| D10 | Knocking Out: yakın dövüş saldırısıyla 0 HP'ye indirecekken 1 HP + Unconscious bırakma seçeneği; Short Rest sonunda, HP kazanınca ya da DC 10 Medicine ilk yardımla biter (s. 17, 184) | Yok. Yalnız Rogue Cunning Strike "Knock Out" var | yok | savaş içi + arayüz | `attack` komutunda böyle bir seçenek yok; `classTraits.ts:144-150` yalnız Cunning Strike | — |
| D11 | Canavar 0 HP'de ölür (Game Master isterse karakter gibi davranabilir) (s. 17) | Düşman tarafı 0 HP: hedeflenemez, etkileri düşer, ölüm save'i yok | tam | savaş içi | `damage-effects.ts:114`; `reduce.ts:228`; `deathsaves.test.ts:42`; PC12 | — |
| D12 | HP maksimumu 0'a inen yaratık ölür; HP maksimumu düşünce HP de düşer (s. 17) | `max_hp_drained` | tam | savaş içi | `reduce.ts:1006-1012`; PC12b | — |
| D13 | Massive Damage: 0 HP'ye indiren hasarın artanı HP maksimumuna eşit ya da büyükse ölüm (s. 17) | `instant_death` | tam | savaş içi | `damage-effects.ts:122-123`; `deathsaves.test.ts:37` | — |
| D14 | 0 HP'ye düşen karakter Unconscious olur (Unconscious = Incapacitated + **Prone**; koşul bitince Prone kalır) ve ölüm save'lerine başlar (s. 17, 191) | `Unconscious` ekleniyor, `Prone` eklenmiyor ve Unconscious onu kapsamıyor. Uzaktan saldırı avantajlı (SRD: Unconscious avantajı + Prone uzaktan dezavantajı = normal). Uyanınca ayakta | kısmi | savaş içi | `reduce.ts:342-346`; `conditions.ts:34` (`TARGET_ADVANTAGE`); PC3 (40 ft menzilli: avantaj; 0 HP durumları `['Unconscious']`; iyileşince `[]`) | — |
| D15 | Ölüm save'i: d20 ≥ 10 başarı; 3 başarı stabil, 3 başarısızlık ölüm; doğal 1 iki başarısızlık; doğal 20 1 HP (s. 17–18) | `startOfTurnEvents` | tam | savaş içi | `commands.ts:131-158`; `deathsaves.test.ts:73,79,87,94` | — |
| D16 | Sayaçlar Stable olunca ya da HP kazanınca sıfırlanır (s. 17) | HP kazanınca ve Medicine/Spare the Dying ile stabil olunca sıfırlanıyor. **Ölüm save'iyle** stabil olunca 3 başarı ve eski başarısızlıklar kalıyor; stabilken alınan ilk hasar onların üstüne ekleniyor | kısmi | savaş içi | `commands.ts:152-156`; `reduce.ts:348-352,1063-1064`; PC2 (2/2 iken stabil → `{successes:3, failures:2}`; kritiksiz 1 hasar → **ölü** `{3,3}`, SRD'de ölmekte, 1 başarısızlık); PC2b (Medicine ile stabilde aynı hasar → ölmekte, `{0,1}`, doğru) | — |
| D17 | 0 HP'deyken hasar: 1 başarısızlık, kritikse 2; hasar HP maksimumuna eşit ya da büyükse ölüm (s. 18) | | tam | savaş içi | `damage-effects.ts:115-121`; `deathsaves.test.ts:52,65` | — |
| D18 | Stabilize: Help eylemi + DC 10 WIS (Medicine) (s. 18) | `stabilize` komutu (eylem; Medicine; Healer's Kit zarsız). Mesafe denetimi yok; yetenek kontrolüne doğal 20/1 kuralı uygulanıyor (SRD'de bu kural yalnız saldırı zarında) | kısmi | savaş içi | `commands.ts:679-694`; `economy.test.ts:40`; `deathsaves.test.ts:119`; PC6a (55 ft'ten stabilize başarılı); PC6b (doğal 1 + Medicine 9 = 10: başarısız) | — |
| D19 | Spare the Dying: 15 ft; 0 HP'deki, ölmemiş **herhangi bir** yaratık; cantrip yükseltmesi menzili 30/60/120 ft yapar (s. 163) | 15 ft sabit; yalnız dosta | kısmi | savaş içi | `data/spells.json` `spare-the-dying` `rangeFt: 15`; `spells.ts:2016-2017`; `s1.test.ts:177`; PC14 (5. seviyede 25 ft: "menzil 15 ft") | — |
| D20 | Stabil yaratık hasar alınca stabil olmaktan çıkar, yeniden save atar (s. 18) | | tam | savaş içi | `damage-effects.ts:115`; PC2b | — |
| D21 | İyileşmeyen stabil yaratık 1d4 saat sonra 1 HP kazanır. 0 HP'deyken kısa ve uzun dinlenme başlatılamaz (en az 1 HP gerekir) (s. 18, 185, 187) | Savaş sonunda ölmekte ve stabil ayrımı yazılmıyor (HP 0). Uzun dinlenme 0 HP'den tam HP veriyor | kısmi | dinlenme-Serüven | `partyStatus.ts:40-66`; `rest.ts:53-60`; `characterRest.ts:188-198`; PC13 (0 HP → uzun dinlenme → 28/28); PC15 (ölmekte olan karakter `hp: 0` olarak yazılıyor) | Kolay zorlukta `reviveOneHp` ev kuralı (`journey/engine.ts:154-155`) |
| D22 | İyileşme 0 HP'den uyandırır ve save sayaçlarını sıfırlar (s. 17) | `healed` | tam | savaş içi | `reduce.ts:1039-1050`; `deathsaves.test.ts:108` | — |
| D23 | Geçici HP önce harcanır, artan hasar HP'den düşer (s. 18) | `temp_absorbed` | tam | savaş içi | `damage-effects.ts:34-39`; `effects.test.ts:117` | — |
| D24 | Geçici HP birikmez; sahibi hangisini tutacağını seçer (s. 18) | Büyüğü otomatik tutulur (makul otomasyon) | tam | savaş içi | `reduce.ts:795-799`; PC11 (10 + 5 → 10, 10 + 12 → 12) | — |
| D25 | Geçici HP iyileşme sayılmaz, 0 HP'de uyandırmaz, tam HP'de de alınır (s. 18) | | tam | savaş içi | PC11 (0 HP + 8 geçici: ölmekte, Unconscious kalıyor) | — |
| D26 | Geçici HP tükenene ya da uzun dinlenmeye dek sürer (s. 18) | Savaş sonunda karaktere yazılmıyor, kayboluyor | kısmi | dinlenme-Serüven | `partyStatus.ts:46-66` (geçici HP alanı yok); PC15 (`tempHp: 9` → durumda yok) | — |

## 5. Hareket (E)

SRD s. 14 (Movement and Position, Creature Size, Moving Around Other Creatures), Glossary Climbing/Crawling/Difficult Terrain/Falling/Jumps/Speed/Swimming. Çapraz: E3 = A7, E7 = B33, E9 = A44, E11 = F14, E13 = F15.

| # | SRD kuralı (sayfa) | Oyunda | Durum | Yer | Kanıt | Bilinen |
|---|---|---|---|---|---|---|
| E1 | Hızın kadar hareket, hareketi eylemlerin öncesine ve sonrasına bölme (s.14) | Tur bütçesi altıgen (`speedHexes`), `movementUsed` ile parça parça harcanır | tam | savaş içi | `src/battle/reduce.ts:54-73` | — |
| E2 | Dash: değiştiricilerden sonraki hız kadar ek hareket; özel hızla da (s.181) | `(1 + dashes)` çarpanı azaltılmış hıza uygulanır | tam | savaş içi | `reduce.ts:73`; PD9 (6 → 12 altıgen) | — |
| E3 | Birden çok hız: hareket sırasında geçiş, gidilen yol yeni hızdan düşülür (s.188 Speed) | Uçuş hızı olan yaratık yerde yürürken de bütçesini uçuş hızından alır; yürüme ve uçuş ayrı sayılmaz | kısmi | savaş içi | `reduce.ts:68` (`base = … fly > 0 ? fly : …`); PD18 (yürüme 30, uçuş 60 → 12 altıgen) | — |
| E4 | Hızı değiştiren etki özel hızları da aynı ölçüde değiştirir (s.188) | Çarpan/ek/Exhaustion seçilen tabana uygulanır | tam | savaş içi | `reduce.ts:66-72` | — |
| E5 | Zorlu arazi: her ft 1 ek ft, birikmez (s.14, s.181) | Zorlu altıgen 2; büyü alanı ile zemin maliyeti `Math.max` (birikmez) | tam | savaş içi | `src/map/terrain.ts:127`, `movement.ts:456` | — |
| E6 | Dar açıklık (bir boy küçük yaratığa göre) zorlu arazidir; 5.2.1'de ayrı Squeezing kuralı yok (s.181) | Varsayılan tek altıgen modelinde dar açıklık verisi yok. Çok altıgende sığmayan gövde geçemez (zorlu arazi değil) | yok | savaş içi | `movement.ts:133` (`bodyFitProblem`), probe yok | `harita/belgeler/COKLU-ALTIGEN.md` |
| E7 | Prone'dan kalkma: hızın yarısı (aşağı yuvarlanır); hız 0'sa kalkamaz (s.186) | Hız 0 denetimi tam. Maliyet **temel** hızdan (`c.speed`, varsa uçuş hızı), altıgende yukarı yuvarlanır. Exhaustion, Slow ve Longstrider sayılmaz | kısmi | savaş içi | `grapple.ts:41`, `:46`; PD7: hız 30 + Exhaustion 2 (gerçek hız 20 ft = 4 altıgen) → maliyet 3 altıgen (SRD 10 ft = 2) | — |
| E8 | Sürünme: her ft 1 ek ft, **zorlu arazide 2 ek ft** (s.180) | Prone yürüyüş ×2 doğru. Zorlu arazide ×2 × 2 = 4 (SRD 3) | kısmi | savaş içi | `movement.ts:347`, `:464`; PD6 (normal 2, zorlu 4) | DECISIONS.md:5258 (sürünme, sürüm 2; zorlu arazi bileşimi yazılmamış) |
| E9 | Dropping Prone: eylemsiz ve hareketsiz, hız 0'da olmaz (s.14) | Komut yok | yok | savaş içi | `grep drop_prone` sonuçsuz | CLAUDE.md "Bilinen eksikler" (Yakalama ve yere düşme) |
| E10 | Long Jump: koşarak (10 ft) STR skoru kadar, yerinde yarısı, her ft 1 ft (s.184-185) | Koşu = aynı yönde 2 altıgen; menzil kanal genişliği; maliyet aradaki altıgenler + iniş | tam | savaş içi | `movement.ts:669-677`, `:768` | — |
| E11 | Long Jump zorlu araziye iniş: DC 10 DEX (Acrobatics) ya da Prone (s.185; zorunlu, Game Master seçeneği değil) | Kontrol yok, Prone yok | yok | savaş içi | PD8 (zorlu `t` altıgenine iniş: yalnız `jumped`, Prone yok) | DECISIONS.md:3106 (⚠ "Game Master seçeneği" diye geçiyor; SRD'de zorunlu) |
| E12 | Long Jump alçak engel: Game Master seçeneğiyle DC 10 Athletics (s.185) | Engel ≤ mesafe/4 zarsız aşılır | bilinçli sapma | savaş içi | `movement.ts:745-747` | DECISIONS.md:2784 (K71b K7) |
| E13 | High Jump: koşarak 3 + STR değiştiricisi ft, yerinde yarısı (s.183) | Büyüsüz yüksek atlama yok; yalnızca Jump büyüsü ve Standing Leap. Katmanlı haritada tırmanma kullanılır | kısmi | savaş içi | `movement.ts:657-659` ("Yerinde zıplamak için Jump etkisi gerekir") | — |
| E14 | Tırmanma: her ft 1 ek ft (zorluda 2); tırmanma hızı ek maliyeti kaldırır; Game Master seçeneğiyle DC 15 Athletics (s.178-179) | Tırmanışın başında bir Çeviklik kontrolü (DC 10/12/15), çarpan ×2/×2/×3. Tırmanma hızı olan zarsız ve ek maliyetsiz | bilinçli sapma | savaş içi | `climbing.ts:1-12`, `data/dikey.json` `tirmanma.not` (⚠) | DECISIONS.md:2731 (K71b kullanıcı kararı) |
| E15 | Yüzme: her ft 1 ek ft; yüzme hızı ek maliyeti kaldırır; dalgalı suda Game Master seçeneğiyle DC 15 (s.189) | Su altıgenleri zorlu (×2). Yüzme hızlı canavar normal maliyetle (82+). Oyuncunun yüzme hızı etkiden (`swim`) | tam | savaş içi | `terrain.ts:72-74`, `movement.ts:448`, `yuzmeSurum.ts` | SU-HEX-DENETIM.md |
| E16 | (SRD'de yok) Kıyıdan uzak derin suya yalnızca yüzücü girer | `deepWaterLimit` Game Master anahtarı | bilinçli sapma | savaş içi | `movement.ts:349`, `deepWater.ts` | CLAUDE.md (Kuyruk 24c) |
| E17 | Düşme: her 10 ft 1d6, en çok 20d6; hasar alırsa Prone (s.182) | Doğru. Kırık Kanat ×2 çarpanı sınırdan sonra uygulanır (ev kuralı, AS1b) | tam | savaş içi | `maprules.ts:181`, `:188`; PD10 (250 ft → 20 zar, Prone) | — |
| E18 | Sıvıya düşme: tepkiyle DC 15 Athletics/Acrobatics → yarı hasar (s.182) | 63+ tam; 57–62'de derin suya iniş hasarsızdı | tam | savaş içi | `fall.ts:52-66` | K73B-DENETIM.md |
| E19 | Uçuş: Incapacitated, Prone ya da uçuş hızı 0 → düşer; Hover hariç (s.183) | Komut sonunda düşüş. Hover 91+ | tam | savaş içi | `altitude.ts:448-458`; `shape91.test.ts:214` | 90 ve altında Hover sayılmaz |
| E20 | Boyut ve alan: Tiny 2½ ft … Gargantuan 20 ft (s.14) | Her yaratık bir altıgen. `multiHex` deneysel ve varsayılan kapalı: L 3, H 7, G 19 altıgen | bilinçli sapma | savaş içi / oluşturucu | `src/rules/footprint.ts`, `body.ts` | CLAUDE.md "Görsel ile mekanik ayrı", COKLU-ALTIGEN.md |
| E21 | Dostun alanından geçilir, dost alanı zorlu arazi değil (s.14) | Yalnız düşmanlar engel sayılır; dost altıgeni maliyet 1 | tam | savaş içi | `movement.ts:323-324`; PD5 (dost 1) | — |
| E22 | Incapacitated yaratığın alanından geçilir, alan zorlu arazidir (s.14, s.181) | Maliyet en az 2 | tam | savaş içi | `movement.ts:462`; PD4 (2) | — |
| E23 | **Tiny** yaratığın alanından geçilir, alan zorlu arazi değil (s.14, s.181) | Tiny düşmanın altıgeni geçilmez | yok | savaş içi / YZ (yol bulma aynı işlev) | `movement.ts:462`; PD1 (Tiny düşman → `null`) | — |
| E24 | **İki boy büyük ya da küçük** yaratığın alanından geçilir, alan zorlu arazidir (s.14) | Yalnızca Halfling Nimbleness (bir boy büyük), Incapacitated, faz ve sürü geçer | yok | savaş içi / YZ | `movement.ts:459-462`; PD2 (M → Huge düşman `null`; Large `null`, doğru) | — |
| E25 | Başka yaratığın alanında hareket isteyerek bitirilmez (s.14) | Dolu altıgende yürüyüş bitmez | tam | savaş içi | `movement.ts:594` | — |
| E26 | Tur başka yaratığın alanında biterse Prone (Tiny ya da daha büyük değilse) (s.14) | Paylaşım oluşmaz; zorunlu dönüşte (Banishment) en yakın boş altıgen, Prone yok | kısmi | savaş içi | `reduce.ts:95` (`unstack`), probe yok | — |
| E27 | Hız 0: hareket yok, kalkamaz (s.180, s.181, s.186) | `speedZero` ve etkiden hız 0 | tam | savaş içi | `reduce.ts:61`, `grapple.ts:46` | — |
| E28 | Exhaustion: hız −5 ft × seviye (s.182) | Doğru | tam | savaş içi | `reduce.ts:72` | — |
| E29 | Burrow Speed: kum, toprak, çamur, buz; katı kaya yok (s.178) | Kazılabilir zemin listesiyle (K73c) | tam | savaş içi / YZ | `burrow.ts`, `data/dikey.json` `kazma` | K73C-DENETIM.md |

## 6. Zar ve kontroller (F)

SRD s. 6–8 (D20 Tests, Rolling 20 or 1, Advantage/Disadvantage, Proficiency), Glossary Passive Perception, Expertise, Long/High Jump, Carrying Capacity, Heroic Inspiration, Help. Çapraz: F2/F24 = A16/D18, F14 = E11, F15 = E13, F19 = A13. Lav atlamasının doğal 20/1 kuralı harita kuralı (F2 içinde bilinçli).

| # | SRD kuralı (sayfa) | Oyunda | Durum | Yer | Kanıt | Bilinen |
|---|---|---|---|---|---|---|
| F1 | D20 Testi = yetenek kontrolü, save, saldırı; d20 + yetenek değiştiricisi + ilgiliyse PB + durum ekleri ≥ hedef (s.6) | Üç yol ayrı ama aynı yapıda | tam | savaş içi | `checks.ts:14-24`, `rules/attack.ts:257-279` | — |
| F2 | Yetenek kontrolünde doğal 20/1 otomatik değil (s.7 yalnız saldırı) | Genel yol doğru; **stabilize** doğal 20'yi başarı, doğal 1'i başarısızlık sayıyor; haritasız `change_height` aynı kalıp; lav atlaması harita kuralı parametresi | kısmi | savaş içi | PB9 (doğal 1 + Medicine 9 = 10 → başarısız); `commands.ts:692`; `commands.ts:830` (probe edilmedi); `jumprisk.ts:174-175` (harita kuralı `natural20`/`natural1`, bilinçli) | — |
| F3 | Saving throw: doğal 20/1 otomatik değil; istersen zar atmadan başarısız olabilirsin; yeteneği olmayan otomatik başarısız (s.187) | Doğal 20/1 kuralı yok (doğru). İsteyerek başarısız olma yok | kısmi | savaş içi | `rules/attack.ts:257-279`; `spells.ts:1677` yorumu ("SRD'de isteyerek başarısız olma yok") | `spells.ts:1677` |
| F4 | Advantage/Disadvantage: iki d20; birikmez; ikisi birlikte normal (s.8) | `combineModes`, `saveModeWhy` | tam | savaş içi | `rules/modes.ts:14-20`, `durations.ts:190-192` | — |
| F5 | Avantajla yeniden atışta yalnız tek zar (s.8) | İkinci şans yolları ayrı (`secondChance`) | doğrulanmadı | savaş içi | `rules/attack.ts` `secondChanceAll` (probe edilmedi) | — |
| F6 | Saldırı: doğal 20 isabet + kritik, doğal 1 ıska (s.7) | Var | tam | savaş içi | `battle/monsters.ts:194-195`, `rules/attack.ts` | — |
| F7 | Proficiency Bonus tablosu (seviye/CR) (s.8) | Seviye 1–4 +2 … 17–20 +6; CR 0–4 +2 … 29–30 +9 | tam | oluşturucu, savaş içi | `rules/abilities.ts:13-18`, `battle/create.ts:470-473` | — |
| F8 | PB birikmez; en çok bir kez çarpılır/bölünür (s.8) | Beceri başına tek kayıt; Jack of All Trades yalnız yetkinsiz beceriye | tam | oluşturucu | `rules/skills.ts:45-58, 72` | — |
| F9 | Expertise: PB iki kat; yalnız yetkin olunan beceride; ikinci kez alınmaz (s.182) | ×2; yetkinsiz uzmanlık hata | tam | oluşturucu | `rules/skills.ts:51-53`, `rules/stats.ts:228-231` | — |
| F10 | Passive Perception = 10 + Algı bonusu (s.186) | Var (+ gece, hafif örtü, loş ışık, alt soy cezaları) | tam | savaş içi | `stealth.ts:78-91` | — |
| F11 | Passive: Algıda avantaj +5, dezavantaj −5 | Yalnız alt soy dezavantajı ve görmeye dayalı (örtü/loş) −5; **avantaj +5 yok** (Enhance Ability WIS), **Poisoned/Frightened −5 yok**, Blinded etkisiz | kısmi | savaş içi | PB2 (normal 14, Poisoned 14, WIS avantajı 14, Blinded 14) | DECISIONS K67a (yalnız loş) |
| F12 | Exhaustion −2×seviye bütün yetenek kontrollerine | `checkDice` kullanan yollarda; stabilize, Dispel/Counterspell kontrolü, haritasız tırmanmada yok | kısmi | savaş içi | PB16 (stabilize doğal 15, sv 5: başarılı; aynı zar GM kontrolünde 5 → başarısız) | — |
| F13 | Long Jump: 10 ft koşuyla STR skoru kadar ft; durarak yarısı; her ft 1 ft hareket (s.184-185) | Koşu = aynı yönde ≥ 2 altıgen; mesafe kanal genişliği; maliyet ara altıgenler + iniş | tam | savaş içi | `movement.ts:669-677, 766-775` | — |
| F14 | Long Jump: zorlu araziye inişte DC 10 DEX (Acrobatics) ya da Prone | Zar yok, Prone yok | yok | savaş içi | PB11 (`t` Taşlık'a iniş: yalnız `jumped`) | DECISIONS.md:3106 (⚠ "yok, değişmedi") |
| F15 | High Jump: 3 + STR mod ft (koşuyla), durarak yarısı; ft başına hareket (s.183) | Karakterde yok; yalnız Jump büyüsü ve canavar Standing Leap; katmanlı haritada tırmanma/`climb` | yok | savaş içi | PB11b ("Yerinde zıplamak için Jump etkisi gerekir.") | DECISIONS.md:3083 (dolaylı) |
| F16 | Carrying Capacity: STR × 15 (Small/Medium), boyut tablosu Tiny ×7,5 … Gargantuan ×120; Drag/Lift/Push ×2 (s.178) | Değerler doğru (`tasima.json`); kademeli yük GM ayarı (2014 isteğe bağlı kural) | tam | oluşturucu, savaş içi | `rules/carry.ts:44-58`, `data/tasima.json`, `nesneAgirlik.ts:36-38` | DECISIONS (Powerful Build, K5) |
| F17 | Taşıma sınırının üstünde sürükleme/kaldırma/itme: Speed en çok 5 ft | Sürükleme sınırı yalnız hesapta; savaşta kullanılmıyor (kapasite aşılırsa alma reddedilir) | kısmi | savaş içi | `dragLimitOf` hiçbir yerde çağrılmıyor (`nesneAgirlik.ts:38`, grep) | DECISIONS (Powerful Build: "şimdilik yalnızca hesapta") |
| F18 | Contest (karşılıklı kontrol) | SRD 5.2.1'de genel kural yok; Grapple/Shove hedefin save'i (yüksek olanı seçer) | tam | savaş içi | `forced.ts:316-319`; paket `zarYarisi` SRD dışı dış içerik (`paket/index.ts:354-355`) | — |
| F19 | Help (saldırı): 5 ft içindeki düşmana karşı **bir müttefikin** sonraki saldırısı avantajlı; yardım edenin sonraki turu başında biter (s.182-183) | İşaret tarafa bağlı; ilk saldırıda kalkar; süre doğru. Yardım eden kendisi de (ek saldırı hakkı olursa) avantaj alıyor | kısmi | savaş içi | `durations.ts:219-233`, `reduce.ts:588-594`; PB15b | DECISIONS.md:7594 |
| F20 | Help (yetenek kontrolü): müttefikin seçilen beceri kontrolü avantajlı | Yok (dosta Help yalnız sarsma/sarmaşıktan kurtarma) | yok | savaş içi | `durations.ts:205-218` | — |
| F21 | Heroic Inspiration: herhangi bir zarı hemen yeniden at, yeniyi kullan; tek kopya (s.8, s.183); Human her uzun dinlenmede | Yalnız başarısız d20'de otomatik yeniden atış (Resourceful, Heroic Warrior); Human'a **her savaş başında** yeniden 1 (taşınan değer eziliyor) | kısmi | savaş içi, dinlenme-Serüven | PB12; `species.ts:38`, `create.ts:86-91`, `effectDice.ts:71-75` | — |
| F22 | İnisiyatif = DEX kontrolü (D20 Testi; bitkinlik dahil) | Bitkinlik cezası, Invisible avantajı, Incapacitated dezavantajı | tam | savaş içi | `create.ts:820-834` | — |
| F23 | Yakalamadan kaçış: STR (Athletics) ya da DEX (Acrobatics) kontrolü vs kaçış DC | Yüksek olan beceri; Frightened/bitkinlik dahil | tam | savaş içi | `grapple.ts:61-86`; `grapple.test.ts` "kaçış: eylem…" | — |
| F24 | Stabilize: Help eylemi, DC 10 WIS (Medicine) (s.18) | Kontrol var ama F2 ve F12 sapmaları | kısmi | savaş içi | PB9, PB16; `commands.ts:676-694` | — |

## 7. Dinlenme ve iyileşme (G)

SRD Glossary Short Rest (s. 187), Long Rest (s. 185), Hit Point Dice, Exhaustion. Bunlar savaş dışı (`src/rules/rest.ts`, `src/rules/characterRest.ts`, `src/journey/`): düzeltmeleri kural sürümü gerektirmez, ama `sim:zincir` sonuçlarını değiştirir. Çapraz: G1/G6 = D21.

| # | SRD kuralı (sayfa) | Oyunda | Durum | Yer | Kanıt | Bilinen |
|---|---|---|---|---|---|---|
| G1 | Short Rest 1 saat; başlamak için **en az 1 HP** (s.187) | Süre yolculukta 1 saat. **Düzeltildi 2026-11-20 (sürümsüz):** 0 HP'de kısa dinlenme başlamaz (`rest.ts` `shortRest`, `characterRest.ts` `shortRestStatus`; düğme kapalı). Uzun dinlenme yasağı G6'da (ertelendi) | tam | dinlenme-Serüven / arayüz | `characterRest.ts:118`, `data/yolculuk/ayarlar.json:4`; PD13 (0 HP → 6) | — |
| G2 | HP zarı: zar + CON, **en az 1 HP** (s.187) | **Düzeltildi 2026-11-20 (sürümsüz):** zar başına en az 1 (eskiden 0) | tam | dinlenme-Serüven | `src/rules/rest.ts:37`; PD11 (d6 = 1, CON −3 → 0; SRD 2); test `rest.test.ts:32` bunu sabitliyor | — |
| G3 | Her zardan sonra yenisini harcamaya karar verilir (s.187) | Sayı önceden seçilir (karakter listesinde sayaç, yolculukta otomatik öneri) | kısmi | arayüz TR-EN | `src/screens/Screens.tsx:254-264` | DECISIONS.md:5428 |
| G4 | HP zarı sayısı = seviye (s.183, Character Creation) | `hitDiceLeft = level − spent` | tam | dinlenme-Serüven | `characterRest.ts:108` | — |
| G5 | Long Rest: tüm HP ve **harcanan HP zarlarının tamamı** (s.185) | **Düzeltildi 2026-11-20 (sürümsüz):** tamamı geri gelir (eskiden yarısı, 2014 kuralı); DECISIONS atfı yeni kararla düzeltildi | tam | dinlenme-Serüven | `rest.ts:53`; PD12 (6. seviye, 6 harcanmış → 3 geri); testler `rest.test.ts:48`, `characterRest.test.ts:28` | DECISIONS.md:7029 (yanlış atıf: "harcanan HP zarlarının yarısı geri gelir (SRD 5.2.1)") |
| G6 | Long Rest başlamak için **en az 1 HP** (s.185) | 0 HP'deki (ölü olmayan) karakter tam HP'ye döner. Geçerli olduğu yerler: karakter listesi, Game Master "Hepsini dinlendir", yolculuk, Serüven dinlenme düğümü ve han. **Ertelendi, karar gerekli (2026-11-20):** doğrudan yasak 0 HP karakteri kalıcı bırakır, Serüven `bozgundaYenidenDene` ve Hapishane `dragBack`'i kırar; SRD çıkışı (stabil 1d4 saatte 1 HP, s.18) D21 kaydını ve zaman modelini ister | yok | dinlenme-Serüven | `characterRest.ts:191`; PD13 (0 HP → 40) | — |
| G7 | Long Rest: azalan HP en çoğu ve yetenek skorları normale döner (s.185) | Kalıcı durumda HP en çoğu tablodan (`hpMax`); savaşta azalan en çok değer karaktere yazılıyor mu denenmedi | doğrulanmadı | dinlenme-Serüven | `characterRest.ts:72-80` | — |
| G8 | Long Rest Exhaustion'ı 1 azaltır (s.182, s.185) | Doğru | tam | dinlenme-Serüven | `characterRest.ts:197`, `rules/exhaustion.ts:14` | — |
| G9 | Özellikler kısa/uzun dinlenmede açıklamasındaki gibi yenilenir (s.185, s.187) | Veriden `rechargeResources` (`short`/`long`), Arcane/Natural Recovery, Sorcerous Restoration, Magical Cunning, Greater Divine Intervention beklemesi | tam | dinlenme-Serüven | `characterRest.ts:131`, `:195` | sınıf denetimleri (B93/B94) |
| G10 | Long Rest'ten sonra yenisi için en az 16 saat (s.185) | Yolculukta tam (`longRestGapHours` 16). Karakter listesinde, Game Master kurulumunda ve Serüven düğümünde saat yok, her an yapılabilir | kısmi | dinlenme-Serüven / arayüz | `src/journey/engine.ts:136`, `ayarlar.json:6`, `seruven.ts:298` | — |
| G11 | Kesintiler (inisiyatif, cantrip dışı büyü, hasar, 1 saat efor); kesilen Short Rest yararsız (s.185, s.187) | Dinlenme anlık; kesinti modeli yok | yok | dinlenme-Serüven | `rest.ts`, `characterRest.ts` (zaman modeli yok) | — |
| G12 | Short Rest sayısında sınır yok (s.16, s.187) | Ev kuralı: iki uzun dinlenme arası en çok 2 (Normal/Zor), Kolay'da sınırsız; Serüven "Dinlenme" durağında sınıra sayılmayan bir kısa dinlenme | bilinçli sapma | dinlenme-Serüven | `ayarlar.json:7`, `engine.ts:122` | DECISIONS.md:5428, :5293 |
| G13 | Dead: dinlenmeyle HP kazanılmaz (s.181) | `dead` durumda dinlenme etkisiz | tam | dinlenme-Serüven | `characterRest.ts:118`, `:191` | — |
| G14 | (SRD dışı) Serüven bozgununda uzun dinlenip yeniden deneme | Serüven anahtarı `bozgundaYenidenDene` | bilinçli sapma | dinlenme-Serüven | `seruven.ts:343-346` | CLAUDE.md (Serüven anahtarları) |

## 8. Işık ve görüş (H)

SRD s. 10 (Vision and Light), Glossary Blindsight, Darkvision, Heavily/Lightly Obscured, Tremorsense, Truesight. **`nightVision` kapalıyken (varsayılan)** gece haritasında herkes herkesi görür ve saldırıya karanlıktan avantaj/dezavantaj eklenmez; ışık modeli yalnız Algı/Gizlenme tarafında işler (PD14). Bu ve `darkness` haritalarının "görülmeyen hedef seçilemez" kuralı (H3) bilinçli sapma sayıldı, ama SRD'den farkı büyük olduğu için "Karar gerekli"de de var.

| # | SRD kuralı (sayfa) | Oyunda | Durum | Yer | Kanıt | Bilinen |
|---|---|---|---|---|---|---|
| H1 | Parlak, loş ve karanlık üç seviye (s.10) | 51+: kaynak başına parlak + ek loş, çakışmada en parlak. Gündüz haritası parlak | tam | savaş içi | `maprules.ts:644-678`; `k67a.test.ts` | DECISIONS (K67a) |
| H2 | Loş ışık = Lightly Obscured: görmeye dayalı Algı dezavantajlı (s.10, s.184) | Pasif −5, aktif Ara dezavantajlı; hafif örtüyle (Web) birikmez | tam | savaş içi | `stealth.ts:85-88`, `:199` | — |
| H3 | Karanlık = Heavily Obscured: oradakini görmeye çalışan Blinded sayılır, saldırıda dezavantaj (s.10, s.183, s.15) | `darkness` haritalarında (13 varyant): görülmeyen hedef **seçilemez** (SRD: dezavantajla saldırılabilir). Karanlık görüşü olmayan, ışıksız altıgende `unlitSightHexes` (3–4 altıgen) kadar görür (SRD: 0) | bilinçli sapma | savaş içi / YZ | `maprules.ts:793`, `:754-780`; PD15 (7 altıgende "Karanlık: B görülmüyor." saldırı reddi; 3 altıgende görür, kaynak yok) | harita kuralı verisi (`unseenTargetsUntargetable: true`); K67-PLAN.md:29 |
| H4 | Gece dışarısı karanlıktır (s.10) | **`nightVision` kapalı (varsayılan):** gece haritasında herkes herkesi görür (`canSee` true), saldırıya karanlık kaynağı eklenmez. Işık modeli yalnız Algı/Gizlenme tarafında işler: ışıksız altıgende karanlık görüşsüz gözcüye pasif −5, Gizlen avantajı, karanlık görüşlüye loş −5, One with Shadows, Sunlight Sensitivity. **Açık:** görülmeyen hedefe dezavantaj, görülmeyen saldıran avantajlı, ışıksız görüş 2 altıgen (SRD 0) | bilinçli sapma | savaş içi | `maprules.ts:526-534`; PD14 (kapalı: `canSee` true, `sources: []`, pasif Algı 5; açık: `canSee` false, dezavantaj + avantaj) | DECISIONS.md:4394, :4462; ENVANTER-OZET.md satır 23 |
| H5 | Yoğun örtü alanı (Fog Cloud, Darkness, Sleet Storm…): içindeki görülmez, aradaki örtü görüşü keser (s.10, s.15) | Hedef içerideyse dezavantaj, saldıran içerideyse avantaj, aradaysa ikisi; Blindsight/Truesight menzilinde kesmez | tam | savaş içi | `zones.ts:520-532` | — |
| H6 | Hafif örtü alanı (Web): Algı dezavantajı (s.184) | Pasif −5 / Ara dezavantajı | tam | savaş içi | `stealth.ts:85` | — |
| H7 | Darkvision: menzilde loşu parlak, karanlığı loş görür (s.181) | Doğru; menzil yaratığın kendi değeri (`darkvisionRange`, 17+) | tam | savaş içi | `maprules.ts:692`, `:774-777` | — |
| H8 | Büyülü karanlık: karanlık görüş görmez, ışık aydınlatmaz; Devil's Sight görür (Darkness, s.124) | Doğru | tam | savaş içi | `maprules.ts:671`, `:688`, `:771-776` | — |
| H9 | Blindsight: menzilde körken ya da karanlıkta görür, Invisible'ı görür; Total Cover arkasını görmez (s.177) | Menzil tam (`specialSenses` anahtarı varsayılan açık); `senseSees` Total Cover'a bakmıyor (saldırıda görüş hattı ayrıca denetlenir) | tam | savaş içi | `sight.ts:65-75`; `k19vision.test.ts:46`, `k67b.test.ts` | — |
| H10 | Tremorsense: yer belirler, **görme sayılmaz**, havadakini algılamaz, aynı yüzeye temas gerekir (s.190) | Canavar tremorsense'i yalnızca yer altındakini hedeflemede (doğru, görme değil). Stonecunning'in süreli tremorsense'i `senseSees` içinde **görme gibi**: Invisible hedefin saldırı etkisini kaldırır ve karanlıkta görür. Gizlenmişin yerini belirleme (`knowsWhere`) yok | kısmi | savaş içi | `sight.ts:72`, `species.ts:30`, `burrow.ts:42-54`; PD16 (Stonecunning: hedef durumlarından Invisible düştü; canavar duyusu: Invisible kaldı) | — |
| H11 | Truesight: normal ve büyülü karanlık, Invisible, görsel yanılsama (otomatik save), gerçek biçim, Ethereal (s.191) | 47+ tek sorgu `truesightSees`. Ethereal görüşü denenmedi | tam | savaş içi / YZ | `sight.ts:41-57`, `maprules.ts:684-686` | K63 (DECISIONS) |
| H12 | Görülmeyen hedef ya da saldıran (ışık yönü): dezavantaj ve avantaj (s.15) | Yoğun örtü alanında tam. `darkness` haritasında hedef seçilemez (H3). Gece haritasında yalnız `nightVision` açıkken (H4) | kısmi | savaş içi | `maprules.ts:793-799`, `zones.ts:520-532`; PD14, PD15 | H3, H4 |
| H13 | Işık kaynakları: Torch 20 ft parlak + 20 ft loş (Equipment) | Harita meşale ve mangalları 10 + 5 ft (2 + 1 altıgen); Şehir Meydanı fenerleri 30 + 30 | bilinçli sapma | savaş içi | `scripts/k67b-isik.py`, `maprules.ts:581-587` | CLAUDE.md K67c "⚠ SRD'den sapma" |
| H14 | Büyü ışıkları (Light ve Continual Flame 20 + 20, Daylight 60 + 60, Faerie Fire 10 loş…) | Veride `k67` blokları | tam | savaş içi | `k67a.test.ts` "K67a veri" | — |
| H15 | (SRD dışı) Gece kuralı: ışıksız altıgende Gizlen avantajlı, karanlık görüşsüz gözcüye pasif −5. SRD'de karanlık = Heavily Obscured (Blinded) | Harita kuralı `night` (`hideAdvantage`, `passivePerceptionPenalty` 5) | bilinçli sapma | savaş içi | `maprules.ts:744-752`, `stealth.ts:80`; PD17 (açık zeminde gece gizlenme mümkün, avantajlı, DC 15) | harita verisi (28 kural) |
| H16 | Sunlight Sensitivity yalnızca parlak ışıkta | `lightLevelAt === 'bright'` | tam | savaş içi | `soyEtki.ts:73`; `k67a.test.ts` (Daylight) | — |
| H17 | (arayüz) Altıgen bilgisinde ışık seviyesi | "parlak / loş / karanlık", TR ve EN | tam | arayüz TR-EN | `src/ui/stealthView.ts:90` | — |

## Sayı özeti ve en önemli bulgular

Toplam **230** satır: **tam 126**, **kısmi 57**, **yok 29**, **bilinçli sapma 16**, **doğrulanmadı 2** (2026-11-20 sürümsüz düzeltmelerden sonra; ilk denetimde tam 123, kısmi 60).
Yaklaşık 10 konu iki ya da üç bölümde ayrı satır olarak geçer (çapraz başvuru notlu; ör. baygının Prone'u B39 = D14, stabilize
A15/A16 = F2/F24 = D18); tekil bulgu sayısı satır sayısından azdır.

| Bölüm | tam | kısmi | yok | bilinçli sapma | doğrulanmadı | Toplam |
|---|---|---|---|---|---|---|
| 1. Eylemler (A) | 22 | 18 | 7 | 5 | 0 | 52 |
| 2. Durumlar (B) | 23 | 9 | 11 | 0 | 0 | 43 |
| 3. Saldırı (C) | 19 | 5 | 0 | 1 | 0 | 25 |
| 4. HP ve ölüm (D) | 17 | 8 | 1 | 0 | 0 | 26 |
| 5. Hareket (E) | 15 | 5 | 5 | 4 | 0 | 29 |
| 6. Zar ve kontroller (F) | 12 | 8 | 3 | 0 | 1 | 24 |
| 7. Dinlenme ve iyileşme (G) | 7 | 2 | 2 | 2 | 1 | 14 |
| 8. Işık ve görüş (H) | 11 | 2 | 0 | 4 | 0 | 17 |
| **Toplam** | **126** | **57** | **29** | **16** | **2** | **230** |

**En önemli bulgular** (hepsi probe ile çalıştırıldı ve kodda yeniden okundu; ayrıntı tablolarda ve "Düzeltme önerileri"nde):

1. **Ölüm save'iyle stabil olunca sayaçlar sıfırlanmıyor** (D16): 2 başarısızlıkla stabil olan karakter, stabilken aldığı tek kritiksiz
   hasarla **ölüyor** (SRD: yeniden ölmekte, 1 başarısızlık). `reduce.ts:1062-1065` stabil sonucunda sayaçları olduğu gibi yazıyor
   (Medicine/Spare the Dying yolu doğru sıfırlıyor). PC2.
2. **Unconscious, Prone'u içermiyor** (B39–B41, D14): 0 HP, Sleep, Knock Out, GM yolunda yalnız `Unconscious`; 5 ft dışından baygına
   saldırı **avantajlı** (SRD: normal), uyanan ayakta, elindekini düşürmüyor. `reduce.ts:343`. PB3, PB4, PC3.
3. **Direnç + zayıflık aynı türde ×2** (D8): zayıflık varken direnç hiç uygulanmıyor (10 → 20; SRD s. 17 sırası: direnç, sonra zayıflık
   → 10). `rules/damage.ts:27-28`; `src/rules/combat.test.ts:196` hatalı değeri (20) sabitliyor. PC1.
4. **Poisoned yetenek kontrollerinde dezavantaj vermiyor; pasif Algı'da ±5 yok** (B32, F11): `checkBase` (`ruleVersion.ts:72-78`)
   yalnız Frightened ve alt soyu biliyor. Petrified'ın hasar direnci ve Poisoned bağışıklığı da yok (B28, B29); Exhaustion bağışıklığı
   hiç denetlenmiyor, Shove Prone bağışık hedefi yere düşürüyor (B3, B4). PB1, PB2, PB5–PB7.
5. **Dinlenme 2014 kuralında** (G5, G2, G1, G6): uzun dinlenme harcanan HP zarlarının **yarısını** veriyor (`rules/rest.ts:53`;
   DECISIONS.md:7029 bunu yanlışlıkla "SRD 5.2.1" diye anıyor), kısa dinlenmede zar başına en az 1 HP yok (`rest.ts:37`), 0 HP'deki
   karakter dinlenebiliyor (uzun dinlenme 0'dan tam HP). Savaş dışı: kural sürümü gerekmez. PD11–PD13.
6. Ayrıca sonucu değiştiren hatalar: gizlenmiş Monk `bonus_strike`/`spell_followup`/tepki saldırısıyla açığa çıkmıyor (C12);
   Disengage ve Dash bayrakları tur dışına (Ready hareketine) taşınıyor (A8, A25); Tiny ve iki boy farklı yaratığın altıgeninden
   geçilemiyor (E23, E24); stabilize doğal 1/20'yi otomatik sayıyor ve arayüzde düğmesi yok (A15, A16); YZ hiç Dash yapmıyor (A45);
   Stonecunning'in Tremorsense'i görme gibi işliyor (H10).

## Düzeltme önerileri (sıralı)

Etki = oyuncunun hissedeceği fark. "Kural sürümü" = savaş sonucu ya da olay akışı değiştiği için yeni sürüm (95) ve eski kayıt/replay
kapısı gerekir mi. Sürümlü maddeler tek toplu sürümde birleştirilirse replay ve hızlı regresyon (3–4 senaryo) bir kez ölçülür.
Yalnız SRD 5.2.1 maddeleri; yeni mekanik önerilmedi.

| Sıra | Öneri | Satırlar | Etki | Kural sürümü | Tahmini iş |
|---|---|---|---|---|---|
| 1 | Ölüm save'iyle stabil olunca sayaçları 0/0 yaz (Medicine yolu gibi) | D16 | **yüksek** (ölümcül; sık yol) | evet | 0,5 saat + test |
| 2 | Direnç ve zayıflık sırası: önce direnç, sonra zayıflık; `combat.test.ts:196` beklentisini SRD örneğine göre düzelt (gerekçe commit'te) | D8 | orta (Rage, Stoneskin, Warding Bond, su altı Fire direnci + zayıflık) | evet | 0,5 gün |
| 3 | 0 HP / Unconscious ile Prone (ve bitince Prone kalma); elindekini düşürme S2 el modeline bağlanacaksa karar | B39–B41, D14 | yüksek (uzaktan baygına saldırı avantajı her savaşta) | evet | 0,5–1 gün |
| 4 | Ortak yetenek kontrolü yolu: Poisoned dezavantajı `checkBase`'e; stabilize, haritasız tırmanma, Dispel/Counterspell kontrolü `checkDice`/`checkBase`'ten (bitkinlik, Frightened, Poisoned); doğal 1/20 otomatik sonucu kaldır; pasif Algı'ya avantaj +5 / dezavantaj −5 | B32, F11, F2, F12, B13, B16, A16, D18 | orta-yüksek | evet | 1 gün |
| 5 | Durum ayrıntıları: Petrified tüm hasara direnç + Poisoned bağışıklığı; Exhaustion bağışıklığı `exhaustion_changed`'de; Shove Prone bağışıklığa bakar; rider Charmed büyüleyene saldırıyı engeller | B28, B29, B3, B4, B9 | orta | evet | 1 gün |
| 6 | Dinlenme SRD 5.2.1: uzun dinlenme bütün HP zarları, kısa dinlenmede zar başına en az 1 HP, 0 HP'de dinlenme yok (Kolay `reviveOneHp` ile birlikte); DECISIONS.md:7029 atfını düzelt; `rest.test.ts:32,48`, `characterRest.test.ts:28` beklentileri | G5, G2, G1, G6, D21 | orta-yüksek (Serüven/yolculuk kaynak ekonomisi; kısa dinlenme ev kuralı sınırı ile birlikte ölçülmeli) | hayır (savaş dışı; `sim:zincir` değişir) | 0,5 gün + ölçüm |
| 7 | Gizlenme açığa çıkması: `bonus_strike`, `spell_followup` saldırısı ve tepki saldırıları `REVEALING`'e | C12 | orta (gizli Monk sürekli avantajlı) | evet | 0,5 gün |
| 8 | "Bu tur" bayrakları: `economy.disengaged`/`dashes` yalnız sahibinin turunda; Ready hareketi bütçesi hız | A8, A25 | düşük-orta (yalnız Ready'li elle oyun; YZ Ready kullanmıyor) | evet | 0,5 gün |
| 9 | Başka yaratığın alanı: Tiny (zorlu değil) ve iki boy farkı (zorlu) geçiş; tur sonunda başkasının alanında Prone | E23, E24, E26 | orta (yol bulma, YZ) | evet | 1 gün + hızlı regresyon |
| 10 | Hareket maliyetleri: kalkma şu anki hızın yarısı; sürünme + zorlu arazi 3 (4 değil); Tiny/iki boy küçük sürükleme ek maliyetsiz; Dash/bütçede yürüme ve uçuş hızları ayrı | E7/B33, E8, B20, E3/A7 | düşük-orta | evet | 1 gün |
| 11 | Saldırı ayrıntıları: menzilli saldırıda yanındaki düşman "seni görebilen" olmalı; Grapple boş el (el başına bir yakalama); Dodge göremediği saldırana ve hız 0'da işlemez; Yardım eden kendi saldırısında avantaj almaz; `pick_up` ikinci etkileşimi ekonomi kısıtlarından geçsin; serbest etkileşim tek bütçe | C8, C17, A10, A11, A13/F19, A33, A32 | düşük-orta | evet | 1–1,5 gün |
| 12 | Stonecunning Tremorsense'i görme listesinden (`senseSees`) çıkar | H10 | düşük | evet | 0,5 saat |
| 13 | Stabilize (Yardım: ilk yardım) düğmesi TR/EN; Spare the Dying cantrip menzil ölçeği ve herhangi bir yaratık | A15, A52, D19 | orta (arayüzde hiç yok) | düğme hayır; Spare the Dying evet | 0,5 gün |
| 14 | YZ: Dash (yürüyerek yetişemiyorsa), ölmekte olan dostu stabilize | A45, A49 | orta (denge) | YZ sürüm kapısı + `npm run sim` 100 tohum | 1 gün |
| 15 | Long Jump zorlu araziye iniş DC 10 Acrobatics / Prone; büyüsüz High Jump (3 + STR mod) | E11/F14, E13/F15 | düşük | evet | 0,5–1 gün |
| 16 | Savaş sonu: geçici HP uzun dinlenmeye dek karakterde; ölmekte/stabil ayrımı kayda | D26, D21 | düşük | hayır | 0,5 gün |
| 17 | Belgeler: `READY-DURUM.md`, `Y1-ENVANTER.md` #13 (Ready var), `docs/SRD-DENETIM.md:493` ve `ENVANTER-DIGER.md:49` (15 durum "tam" değil), DECISIONS.md:3106 (Long Jump inişi SRD'de zorunlu, "GM seçeneği" değil) | — | bilgi | hayır | 0,5 saat |

**Durum (2026-11-20):** 6 yapıldı, yalnız 0 HP uzun dinlenme kolu ertelendi (G6/D21); 17 yapıldı; 13'ün düğme kolu ve 16 sürümsüz ama
savaş sonu kaydı/arayüz işi, sürümlü grupla birlikte ele alınacak; 1–5, 7–12, 15 sürümlü grubu bekliyor; 14 ertelendi (denge).

Öneri sırası: 1–3 (ölüm ve baygın: en ağır sonuçlar) → 4–5 (durum/kontrol tek yolu) → 6 (sürümsüz, ölçümle) → 7–12 (tek toplu
sürümde) → 13–14 (arayüz/YZ) → 15–17.

## Karar gerekli

1. **Baygının Prone'u ve eşya düşürme** (B39–B41, D14): SRD'ye uygun, ama ölmekte olan karaktere uzak saldırıyı zayıflatır ve uyanınca
   kalkma hareketi harcatır; elindekini düşürme S2 el modeline bağlanacak mı?
2. **[Kısmen çözüldü 2026-11-20: G5, G2, G1 uygulandı; G6 0 HP uzun dinlenme ertelendi]** **Dinlenme SRD 5.2.1'e** (G5, G2, G1, G6): bütün HP zarları geri gelirse kısa dinlenme ev kuralı sınırı (2) ve Serüven dengesi yeniden
   ölçülmeli; 0 HP dinlenme yasağı Kolay zorluğun "1 HP ile kalk" (`reviveOneHp`) ev kuralıyla birlikte karara bağlanmalı. Ayrıca
   Long Rest'in 16 saat beklemesi ve kesinti modeli (G10, G11) yalnız yolculukta: karakter listesi/GM/Serüven düğümü için kapsam dışı mı?
3. **[Ertelendi 2026-11-20, karar bekliyor]** **`nightVision` ve `darkness` haritaları** (H3, H4, H12): gece haritasında `nightVision` kapalıyken (varsayılan) karanlık saldırıda hiç
   etkisiz; `darkness` haritalarında görülmeyen hedef hiç seçilemiyor ve karanlık görüşsüz 3–4 altıgen görüyor (SRD: dezavantajla
   saldırılır, görüş 0). Bilerek mi (DECISIONS.md:4394 yalnız denge gerekçesi), yoksa varsayılan değişsin mi?
4. **Gizlenmiş hedefe tahminle saldırı** (C10): şimdi hedeflenemiyor; SRD tahmin edilen yere dezavantajlı saldırıya izin verir.
   Sadeleştirme olarak kayda mı geçsin?
5. **Genişletilmiş kritik aralığı** (C5): Improved/Superior Critical'da doğal 19 (18) AC'ye bakmadan isabet sayılıyor; SRD "hits
   regardless" yalnız doğal 20 için der. Yorum DECISIONS'a yazılmalı.
6. **Dirençte yuvarlama** (D9): aynı saldırının aynı türden parçaları (silah + Sneak Attack) birlikte mi, ayrı mı yarıya insin?
7. **[Ertelendi 2026-11-20, karar bekliyor]** **Knocking Out** (D10): SRD'de yakın dövüşle 0'a indirirken "bayılt" seçeneği var, oyunda yok (yalnız Cunning Strike). Eklensin mi?
8. **Stabilize menzili** (D18): SRD menzil yazmıyor (Help eylemi); bitişik (5 ft) koşulu yazılsın mı?
9. **Heroic Inspiration** (F21): Human'a savaş başına mı (şimdi) uzun dinlenme başına mı (SRD); "herhangi bir zarı yeniden at" yerine
   otomatik başarısız-d20 yaklaşığı bilinçli sapma olarak mı kayda geçsin?
10. **Blinded gözcü** (B7): Blinded yaratık bitişikteki gizleneni bulabilsin mi, Gizlen DC'sini yükseltsin mi?
11. **Serbest nesne etkileşimi bütçesi** (A32): kapı/taşıma/yerden alma tek "turda bir" bütçeyi paylaşırsa Kale/sızma haritalarında YZ
    kapı akışı etkilenir.
12. **Eksik eylem girişleri** (A14, A19, A30, A44, F20): Influence, Study, Help'in yetenek kontrolü kolu, isteğe bağlı yere yatma
    (Dropping Prone) SRD eylemleri; hangileri savaş içinde anlamlı, hangileri bilinçli kapsam dışı (DECISIONS'a tek satır)?
13. **Toplu sürüm**: 1–5, 7–12. öneriler tek kural sürümünde (95) mi, ayrı sürümlerde mi?

## Ek: geçici test (probe) dökümü

Probe adı: `PA#` eylemler, `PB#` durumlar + kontroller, `PC#` saldırı + HP, `PD#` hareket + dinlenme + ışık. Hepsi `npx vitest run` ile geçici `src/battle/zzGenel*_*.test.ts` dosyalarında çalıştırıldı ve silindi; kurulum `src/battle/ready.test.ts` kalıbı (`volkan` kimliği, 15×7 açık zemin, kural sürümü 94, `multiHex` kapalı).

### PA: eylemler

Hepsi `src/battle/zzGenelA_*.test.ts` içinde çalıştırıldı (vitest), sonra silindi. Harita `volkan` kimliği, zemin 15×7 açık (`ready.test.ts` kalıbı).

- **PA1** Kapı yerleştir (GM), A aynı turda `open, close, open, close, open`. Sonuç: hepsi geçti, `economy` `{action:false, bonus:false}`, `interacted` yok. Serbest etkileşimin sınırı yok.
- **PA2** A bitişik B'ye Yardım, sonra (eylemi yapay tazelenmiş) A, B'ye saldırır. Sonuç: B'de `Help:party`; A'nın saldırısı `advantage`, gerekçe "Yardım". Yardım eden kendisi yararlanıyor.
- **PA3a** A Kaçın + Blinded; B, A'ya saldırır. Sonuç: `normal` ("Hedef Blinded" + "Hedef kaçınıyor"). SRD'de saldıranı göremeyen kaçınan dezavantaj vermez; sonuç avantaj olmalıydı.
- **PA3b** A Kaçın + `speedZero` etkisi. Sonuç: `disadvantage` ("Hedef kaçınıyor"). SRD'de hız 0 iken Kaçın yararı kaybolur.
- **PA4** Ölmekte olan C'ye A stabilize (`srdK19` açık, Medicine +12). Doğal 1 → `success:false` (toplam 13 ≥ 10); doğal 20 → başarı. Yetenek kontrolünde doğal 1/20 kuralı uygulanıyor (SRD yalnız saldırı zarında).
- **PA5** Extra Attack (2): saldır → yürü → saldır. Sonuç: yürüme ok, 2. saldırı ok, `attacksLeft=0`.
- **PA6** Cunning Action: bonus Dash → bonus Disengage. Sonuç: "Bonus eylem bu tur kullanıldı."; eylem hâlâ boş, eylemle Dash → `dashes=2`.
- **PA7** Incapacitated A: bonus Dash → "Aksiyon yapamaz: Incapacitated"; yürüme ok.
- **PA8** A, "bana saldırırsa → (1,3)'e yürü" hazırlar; bitişik B saldırır. Sonuç: A yürüdü (1 `moved`), B 1 fırsat saldırısı yaptı, B'nin tepkisi harcandı. Doğru.
- **PA9** Action Surge sonrası Fire Bolt → "Action Surge'ün ek eylemiyle büyü yapılamaz." Doğru. Magic eylemli özellik/eşya kolu denenmedi.
- **PA10** A Dazed, yürümüş (`movementUsed 1`): 1. `pick_up` ok (serbest), 2. `pick_up` ok (eylem harcandı, `action=true`); aynı durumda `dash` → "Dazed: bu tur yalnızca birini yapabilir…". `pick_up` ikinci etkileşimi ekonomi kısıtlarını atlıyor.
- **PA11** Dost C kaynaklı Hazırla → "Tetikleyen bir düşman olmalı."
- **PA12** YZ düşman B (hız 30), A 11 altıgen uzakta, B'nin turu döngüyle: `move,end_turn`, B (6,1)'de; Dash ile bitişiğe varabilirdi. YZ Dash kullanmıyor.
- **PA13** A: bonus Disengage + Hazırla(hareket, "bana saldırırsa"), tur sonu; B'nin turunda A'da `economy.disengaged=true`; B saldırır, A tepkiyle uzaklaşır → fırsat saldırısı **0**. Disengage sonraki yaratıkların turuna taşınıyor.
- **PA14** A hız 15 ft (3 altıgen): bonus Dash + Hazırla(hareket (0,3)'e, 5 altıgen), tur sonu; B saldırır → A 5 altıgen yürüdü (cost 5). Tepki hareketi hızın iki katı.
- **PA15** `speedHexes` yürüme 40 + uçuş 30: 6 altıgen (Dash 12); yürüme hızı (8) seçilemiyor.

Silme doğrulaması: `ls src/battle/zzGenelA_*` → "No such file or directory".

### PB: durumlar ve kontroller

Hepsi `src/battle/zzGenelB_probe.test.ts` içinde, `volkan` haritası açık zeminle (`ready.test.ts` kurulum kalıbı), güncel kural sürümü. 17 test çalıştı, hepsi geçti (yalnız değer döktü; iddia sınamadı).

| P | Ne denendi | Sonuç |
|---|---|---|
| PB1 | `rollSkillCheck` (Athletics): Poisoned ve (kontrol olarak) kaynaksız Frightened savaşçı | Poisoned `normal`, Frightened `disadvantage` → Poisoned kontrol dezavantajı yok |
| PB2 | `passivePerception` (Algı +4): normal / Poisoned / Enhance Ability `checkAdv: ['wis']` / Blinded | 14 / 14 / 14 / 14 → +5 ve −5 yok, Blinded etkisiz |
| PB3 | GM `set_condition` Unconscious → durum listesi; 35 ft'ten Longbow saldırısı | `["Unconscious"]` (Prone yok); kip `advantage` (SRD: Prone ile normal) |
| PB4 | 2 HP karakter kılıçla 0 HP'ye; sonra `healed` | `life: dying`, `["Unconscious"]`, silahlar elde, `dropped: null`; iyileşince `[]` (Prone yok) |
| PB5 | Petrified hedefe kılıç isabeti (d8 = 4, +3); Petrified hedefe Poisoned | 60 → 53 (7 hasar; direnç yok); `["Petrified","Poisoned"]` |
| PB6 | Zombie (`immune: Exhaustion, Poisoned`): `exhaustionGain` + reducer; kontrol olarak Poisoned | Exhaustion 1 oldu; Poisoned süzüldü (`[]`) |
| PB7 | Air Elemental (Prone bağışık) itme Prone, save doğal 1 | `shove_resolved success: false`, durum `["Prone"]` |
| PB8 | Medium yakalayan Tiny yakalananı 2 altıgen sürüklüyor; kontrol Medium | Tiny: maliyet 4; Medium: 4 → Tiny istisnası yok |
| PB9 | Stabilize: doğal 1 + Medicine 9 (= 10); doğal 20 + Medicine −5 | Doğal 1: başarısız (SRD: başarılı); doğal 20: başarılı (15 ≥ 10, ayırt edici değil) |
| PB10 | `standUpCost` / `speedHexes`: hız 30, Exhaustion 2, Prone | maliyet 3, hız 4 altıgen (SRD: 20 ft'in yarısı = 2 altıgen) |
| PB11 | STR 20, durarak 10 ft (2 altıgen) atlama, iniş `t` (Taşlık, zorlu); High Jump sorusu | Yalnız `jumped`, Prone/zar yok; High Jump: "Yerinde zıplamak için Jump etkisi gerekir." |
| PB12 | Human, kayıtta `heroicInspiration: 0`, savaş başlatma | 1 (savaş başında yenilenir) |
| PB13 | Gizlenmiş A'nın yanında Blinded B: `noticeEvents`; 20 ft'te Blinded B (Algı +9) `hideCheck` | `revealed`; gözcü B, pasif 19 (Gizlen DC'si yükseliyor) |
| PB14 | A'ya kaynaklı (B) süreli Charmed `condition_changed`, A B'ye saldırıyor | Kabul edildi (SRD: saldıramaz) |
| PB15 | A, B'ye Help; A'nın eylemi yapay açılıp A B'ye saldırıyor | İşaret `Help:party`; A'nın kendi saldırısı `advantage` |
| PB16 | Stabilize: Exhaustion 5 (−10), doğal 15, Medicine 0; aynı zarla GM kontrolü | Stabilize başarılı (15); GM kontrolü toplam 5, başarısız → stabilize bitkinliği uygulamıyor |

Geçici dosya silindi (`ls src/battle/zzGenelB_*` → "No such file or directory").

### PC: saldırı, HP ve ölüm

Hepsi `npx vitest run` ile çalıştırıldı. Dosyalar silindi.

- **PC1:** `adjustDamage(10,'fire',{resistances:['fire'],vulnerabilities:['fire']})` sonucu `{amount:20, note:'vulnerable'}`; 11 için 22. SRD'de ikisi de 10 olmalı. Savaşta B'ye etki direnci (`resist: ['slashing']`) ve zayıflık verildi; 10 slashing → `appliedDamage 20`.
- **PC2:** A (0 HP, 2 başarı / 2 başarısızlık) tur başında 14 attı ve stabil oldu: `{successes:3, failures:2}`. E'nin kritiksiz menzilli 1 isabetinden sonra **dead** `{3,3}`. SRD'ye göre sonuç ölmekte, `{0,1}` olmalı. **PC2b:** sayaçlar sıfırken stabil olan aynı isabetle ölmekte `{0,1}` (doğru).
- **PC3:** Haritada 40 ft'ten Unconscious (ölmekte) hedefe menzilli saldırı: `mode: advantage` ("Hedef Unconscious"). 3 HP'deki A 0'a düşünce durumlar `['Unconscious']`, Prone yok; `healed` sonrası `[]`, `alive`.
- **PC4:** a) Yanında Blinded düşman varken menzilli saldırı: `disadvantage` ("Yanında düşman"). b) Saldıran Invisible: avantaj ve dezavantaj birlikte, `normal`. c) Yanında Stunned düşman: dezavantaj yok (doğru).
- **PC5 / PC5m:** Haritasız düzende gizli Monk `bonus_strike` attı, `hidden` kaldı. Haritada iki ardışık `bonus_strike` ikisinde de "Gizlenmiş saldıran" avantajıyla çözüldü ve ikisinden sonra `hidden: {dc:18}` duruyor. Ardından `attack` atınca `hidden: null`.
- **PC6:** a) 55 ft'teki ölmekte olan dosta `stabilize`: `stabilized: true`. b) Doğal 1 + Medicine 9 = 10: başarısız (SRD'de yetenek kontrolünde doğal 1 kuralı yok, 10 geçer).
- **PC7:** `shieldHeld: true` ve yan el silahı taşıyan savaşçı `grapple` yaptı: `condition_save`, `grappled` (boş el denetimi yok).
- **PC8:** `critOn: 19`, AC 30, doğal 19: isabet + kritik (2d8+3). Doğal 20 ve AC 30: isabet + kritik. Doğal 1 ve +50: ıska, fumble.
- **PC9:** Dirençli (piercing) hedefe Rapier 5 + Sneak Attack 3: ana parça 2, Sneak 1, `appliedDamage 3`. Toplu yuvarlamada 4 olurdu.
- **PC10:** DEX −1 savaşçının yan el Dagger seçeneği `1d4-1` (negatif değiştirici eklenmiş, doğru).
- **PC11:** Geçici HP: 10 varken 5 gelince 10, 12 gelince 12. 0 HP'deki karaktere 8 geçici HP: `dying`, Unconscious kalıyor.
- **PC12:** 3 HP'deki düşman 0'a indi: `hp 0`, artık hedeflenemiyor. `max_hp_drained` maksimumu 0'a indirince `dead`.
- **PC13:** `longRestStatus` HP 0 iken uzun dinlenmeden sonra HP 28/28 verdi.
- **PC14:** Spare the Dying 25 ft'te 1. ve 5. seviyede reddedildi ("menzil 15 ft"); cantrip menzil yükseltmesi yok.
- **PC15:** `applyBattleResult`: geçici HP'si 9 olan A'nın durumunda geçici HP yok. Ölmekte olan C `hp: 0` yazıldı, stabil/ölmekte bilgisi yok.

### PD: hareket, dinlenme, ışık

Hepsi `src/battle/zzGenelD_probe.test.ts` içinde (kural sürümü 94, `volkan` haritası 15×7 düz zemin, `multiHex` kapalı) çalıştırıldı, sonra silindi.

- **PD1–PD5 (`moveCostFn`, Medium oyuncu A):** Tiny düşman altıgeni `null`, Huge düşman `null`, Large düşman `null`, Incapacitated düşman 2, dost 1. Tiny ve iki boy farkı (E23, E24) SRD'ye aykırı. Bir boy fark, Incapacitated ve dost doğru.
- **PD6 (sürünme):** Prone, normal zemin 2; Prone, zorlu (`t`) 4; ayakta zorlu 2. SRD'ye göre sürünerek zorlu arazi 3 olmalı (E8).
- **PD7 (`standUpCost`):** hız 30 + Exhaustion 2 → maliyet 3 altıgen, `speedHexes` 4. Hız 25 → maliyet 3, `speedHexes` 5. Maliyet temel hızdan; SRD şu anki hızın yarısı (E7).
- **PD8 (Long Jump):** STR 16, (2,1) → (2,3), iniş zorlu `t` altıgeni. Olaylar yalnızca `jumped`, Prone yok, zar yok (E11).
- **PD9 (Dash):** 6 → 12 altıgen (E2).
- **PD10 (`fallEffect`):** 250 ft → 20 zar (120 hasar), Prone (E17). 30 ft geçici HP denemesi alan adı nedeniyle anlamlı değil, değerlendirmeye alınmadı.
- **PD11 (`shortRest`):** d6, CON −3, iki zar da 1 → iyileşme 0. SRD'ye göre zar başına en az 1, toplam 2 (G2).
- **PD12 (`longRest`):** 6. seviye, harcanmayan HP zarı 0 → dinlenmeden sonra 3. SRD'ye göre 6 (G5).
- **PD13:** 0 HP'de uzun dinlenme HP 40'a çıkar; 0 HP'de kısa dinlenme HP 6 olur. SRD ikisinde de en az 1 HP ister (G1, G6).
- **PD14 (`col-sutun-harabesi` gece, A ile B 4 altıgen arada):** `nightVision` kapalıyken `canSee` true, `mapAttackSources` `sources: []`, B'nin pasif Algısı 5 (10 − 5 gece cezası), ışık seviyesi `dark`. Karanlık görüşlü gözcü: `perceivedLevel` `dim`, pasif 5. `nightVision` açıkken `canSee` false, kaynaklar "Görülmeyen hedef (karanlık)" dezavantaj ve "Karanlıktan saldıran" avantaj (H4). İlk denemede `batak-adalar`ın sis kuralı sonucu karıştırdığı için harita değiştirildi.
- **PD15 (`dungeon` `mesale` + `darkness`):** 7 altıgendeki hedef: `mapAttackSources` "Karanlık: B görülmüyor." ile başarısız, `attack` komutu da aynı hatayla reddedildi. 3 altıgendeki hedef karanlık görüşsüz saldırana görünür, kaynak yok (H3).
- **PD16 (`sightConditions`):** Stonecunning etkisi (`tremorsense: 60`) olan A, bitişik Invisible B'ye: hedef durumları `[]` (Invisible düştü). Canavar duyusu `senses.tremorsense: 60` ile: `['Invisible']` (H10).
- **PD17 (`hideCheck`, gece, açık zemin):** `nightVision` kapalı: `ok: true`, `unlit: true`, avantaj, DC 15. Açık: `ok: true`, DC 15 (H15).
- **PD18 (`speedHexes`):** yürüme 30, uçuş 60 → 12 altıgen (E3).
