# Sabah raporu

**Gece kuyruğu 8 (K19 → A1 → A2 → A3 → A4 → A5 → A6):** yedisi de bitti (A6 kısmen, bayrak arkasında), her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: K19 `20cd688`, A1 `c71fd6a`, A2 `90b1dc4`, A3 `c261da9`, A4 `0e5357e`, A5 `1988134`, A6 `8bb5d1e`. Kayıt sürümü 19 kaldı (yalnızca yeni olay türleri ve isteğe bağlı alanlar). Son tam paket: 131 dosya / 1337 test yeşil; ana parça 441,4 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi değişmedi (tam 62, kısmi 68, savaş dışı 53, yok 0). Hızlı regresyon (4 senaryo × standart/paladin × 3./5. seviye, 100 tohum): A1, A2–A5 ve A6 sonrası birebir aynı (A1'de paladin 5 zaman sınırına takıldı, A2–A5 ölçümünde tam).
- **K19:** Dragonborn kadın maskesi delik doldurma + kapatma + sınırlı büyütme + açma (benek kalmadı, K8b'ye dönülmedi); erkek Blue/Brass/Bronze/Copper/Gold/Red/Silver K8b yönteminde (Copper tonu 14 → 20), Black/Green/White K15 yolunda; Goliath kadın Cloud dövme kontrastı; Drow ≈%32 koyu (en açık L 46). ΔE ≥ 15 her yerde (12'ye inmek gerekmedi). Rozetler cinsiyete göre. Ekran görüntüsü `docs/sabah/k19-soylar.png`.
- **A1:** ortak can havuzu (`create_hp_pool`, komut sonunda eşitleme). **A2:** engelden geçme (`phase`, Incorporeal Movement). **A3:** iki aşamalı durumlar veriyle (Sleep, Cockatrice). **A4:** tasma (`leash`). **A5:** ek bonus eylem kancası. **A6:** ayak izi + motor entegrasyonu, `multiHex` bayrağı varsayılan kapalı (tasarım ve kalanlar `docs/harita/COKLU-ALTIGEN.md`).
- **Değişen eski testler:** `tint.test` (rozetler cinsiyete göre), `riders.test` (Cockatrice: yok 61 → 60, süreli etki 16 → 17), `content.test` (kitteki yeni `extraBonus` alanı özet dışında, SRD'de 0).

**Gece kuyruğu 7 (K17 → K16 → K18 → K15):** dördü de bitti, her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: K17 `a63ddf1`, K16 `7949349`, K18 `0d5bb3f`, K15 `4e92373`, kuyruk sonu `c186d59`. Kayıt sürümü 19 kaldı. Son tam paket: 124 dosya / 1304 test yeşil; ana parça 440,2 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi yeniden üretildi, değişmedi (183: tam 62, kısmi 68, savaş dışı 53, yok 0).
- **K17:** sınıf değişince sınıfa bağlı seçimler sınıf başına taslakta saklanır, geri dönünce yalnızca seviyeye ve sınırlara uyanlar gelir; başka sınıfın seçimleri uyarı vermez, kayda yazılmaz.
- **K16:** Puanlar adımında yer değiştirme, "Önerilen dağılım" ve "Sıfırla" (`docs/sabah/k16-puanlar.png`).
- **K18:** Öğren/Hazırla/Kitaba ekle etiketleri, terim ipuçları, ustalık yıldızı, 137 özellik özeti ve renk açıklaması (tembel `data/aciklamalar.json`), Wild Shape biçim kartları (`docs/sabah/k18-ozellikler.png`, `k18-ustalik.png`).
- **K15:** sprite başına ten maskesi (120 maske, `npm run soy-maske`), LCh kaydırma, Drow üç duraklı gradyan, Wood Elf boyamasız, High Elf aynı; erkek Goliath artık değişiyor. Lab ΔE eşiği 15: eşik altında kalan yok (`docs/sabah/k15-soylar.png`). Rozetler: Dragonborn Brass/Bronze/Copper/Gold/Silver, Goliath Frost, Wood Elf.
- **Değişen eski testler:** `builder.test` ve `paladin.test` (K17: başka sınıfın büyüsü artık uyarı değil, sessizce düşer), `k6.test` (etiket "Hazır" → "Hazırla"), `tint.test` (HSL aralık testleri maskeli yola göre yeniden yazıldı; Wood Elf boyamasız; rozet listesi ölçüme göre).

**Gece kuyruğu 6 (K13 → K14 → DENGE-4 → U3):** dördü de bitti, her biri ayrı commit, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: K13 `79768fe`, K14 `d583380`, DENGE-4 `3283fab`, U3 `5565846` (videolar uzak dala `1c68b78` ile eklenmişti; `e5b1193` birleştirme). Kayıt sürümü 19 kaldı (olaya isteğe bağlı alan: `action_used.pactOnly`). Son tam paket: 121 dosya / 1286 test yeşil; ana parça 432,0 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi yeniden üretildi, 0–3 aynı (183: tam 62, kısmi 68, savaş dışı 53, yok 0); yeni `BUYU-DENETIMI-4-5.md`: 72 büyü, oyunda 2; 27 savaş dışı, 16 yalnızca veri, 18 küçük ek, 9 yeni sistem.
- **K13:** Thirsting Blade yalnızca pact silahıyla; soy rozeti 12 zayıf soyda (Goliath 6, Gnome 2, Dragonborn Brass/Bronze/Gold, Wood Elf; `docs/sabah/k13-goliath-soy-rozeti.png`); Wild Shape biçim saldırılarında canavar ek etkileri (Prone, zehir/ek hasar, yakalama, hücum, süreli durum).
- **DENGE-4:** `--parti buyucu` (6 kişi). 3. ve 5. seviyede çoğu senaryo %90–100 (parti 6 kişi). Teşhiste Bard'ın slotla ilham verip kontrol büyüsü yapmadığı bulundu; iki yapay zekâ düzeltmesi (DECISIONS). Hızlı regresyon birebir aynı.
- **U3:** savaş sonu başlık videosu (`docs/sabah/u3-son-video.png`); dosyalar mp4 266–995 kB + webm yedeği 229–616 kB + poster; tek seferde yalnızca bir dosya indirilir. EndVideo tembel parça (1,7 kB).
- **Değişen eski testler:** `warlock.test` (Thirsting Blade: `attacksPerAction` 2 → 1 ve `pactAttacks` 2; SRD "with your pact weapon"). Diğer değişiklikler yeni testler.

**Gece kuyruğu 5 (K11 → K12 → WARLOCK → BARD → DRUID → U4 → U3):** altısı bitti, U3 atlandı (`assets-ham/son-videolar/` yok); hepsi bu dalda ve gönderildi, `wip/` dalı yok. Commit'ler: K11 `4ff57bd`, K12 `03dc696`, WARLOCK `dabdfe1` (+ ekran görüntüsü commit'i), BARD `5c896e3`, DRUID `e945d8e`, U4 `05accfb`. Kayıt sürümü 19 kaldı. Son tam paket: 120 dosya / 1276 test yeşil; ana parça 430,8 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi yeniden üretildi, değişmedi (183: tam 62, kısmi 68, savaş dışı 53, yok 0). U4 açılış zar sesi `public/ses/acilis-zar.mp3`: 1,54 sn, 25 kB.
- **Değişen eski testler:** `classFeatures.test` (Bard 1–5 artık eksiksiz; `wildShape` kaynağı artık savaşta kullanılabilir), `content.test` alt sınıf regresyon özeti (Warlock, Bard, Druid bilerek değişti: listeye eklendi, aynı kalması gereken kayıt sayısı 60).
- **Denge** (DENGE.md "Görev K12" ve "Gece kuyruğu 5"): K12 Cleric kazancının tamamı Channel Divinity yapay zekâsından (Preserve Life); SRD'ye uygun, değiştirilmedi. WARLOCK, BARD, DRUID sonrası regresyon birebir aynı.
- Ekran görüntüsü: `docs/sabah/warlock-invocations.png`.

**Gece kuyruğu 4 (K8b → K9d-kalkan → K10 → CLERIC → WIZARD → SORCERER):** altı görev de bitti, bu dalda ve gönderildi; `wip/` dalı yok. Commit'ler: K8b `dea0ae9`, K9d-kalkan `29b6446`, K10 `5d37bbe`, CLERIC `cd807b6` + `9a518e0` + `3d4cfd4`, WIZARD `6e2a2d8`, SORCERER `c1d21c8`, büyü denetimi `9ff62e8`, Hold Person düzeltmesi `4ff59e6`, kuyruk sonu `fabd4fd`. Kayıt sürümü 19 kaldı. Son tam paket: 117 dosya / 1250 test yeşil; ana parça 423,6 kB; check:harita 160/0, check:ses 15/0. Büyü denetimi: 183 büyü, tam 62, kısmi 68, savaş dışı 53, **yok 0**.
- **Değişen eski testler:** `characterRest.test` (K10: kaynak en çoğu), `k4.test`, `b5.test`, `spells.test` (CLERIC/WIZARD verisi), `content.test` alt sınıf regresyon özeti (Cleric, Wizard, Sorcerer bilerek değişti: 240 içinde 120 kayıt aynı kalmalı; yeni kit alanları diğer sınıflarda varsayılan değerde denetlenir).
- **Denge** (DENGE.md "Gece kuyruğu 4"): Cleric (Life Domain) +3…+23 puan; WIZARD + SORCERER ±1. Kuyruk sonu regresyonu WIZARD'ın Hold Person sezgisinin Kale 5'i 87 → 68 düşürdüğünü buldu; kural ≤3 düşmana sınırlandı, geri döndü.
- Ekran görüntüleri: `docs/sabah/k8b-dragonborn-soy.png`, `docs/sabah/sorcerer-metamagic.png`.

**Gece kuyruğu 3 (K9 → K2 → K8-inceleme):** dokuz görev de bitti, her biri ayrı commit, bu dalda; `wip/` dalı yok. Kayıt sürümü 19 kaldı (olaylara yalnızca isteğe bağlı alanlar: `jumped.traitTurns`). Ayrıntı aşağıda "Kuyruk 3" bölümünde.

**Gece kuyruğu 2 (K5 → K6 → K7):** üç görev de bitti, bu dalda ve gönderildi; `wip/` dalı yok. Öncesinde aynı oturumda L7, K3, H-SLOT ve K4 de bitti. Kayıt sürümü 19 kaldı (yalnızca isteğe bağlı alanlar). Son tam paket: 107 dosya / 1184 test yeşil; ana parça 402,3 kB (sınır 500); check:harita 160/0, check:ses 15/0.

**Gece kuyruğu 1 (K1 → L6 → B3 → B4 → B5 → CILA):** önceki gece bitti (aşağıdaki bölümler).

## YARIM KALANLAR

Kuyruk 2'den (kısmi kalanlar; ayrıntı ilgili bölümde):
- **K5 — SRD sınırının savaştaki etkisi:** kapasiteyi aşan (yalnızca eski kayıtta olabilir) karakter savaşta cezasız; kademeli kuralda ağır yüklü sayılır.
- **K7 — Warlock Eldritch Invocations:** yok (Thirsting Blade'in ek saldırısı, Agonizing Blast…); denetimde ⚠️.
- **K7 — Flurry of Blows 10. seviye üçüncü vuruş** ve **Push** yalnızca son saldırıda (bilinen kısmi).

Kuyruk 1'den; görev bitti ama şu parçalar kısmi kaldı (ayrıntı ilgili bölümde ve `DECISIONS.md`'de):
- **CILA 4 — Wind Wall biçimi:** düz ve yay biçimi var; serbest çizim (50 ft'lik istenen yol) yok.
- **CILA 5 — Blindness/Deafness seçimi:** motor `choice` ile Deafened alır; arayüzde ve yapay zekâda seçim düğmesi yok (her zaman Blinded).
- **CILA 6 — Flaming Sphere çarpması:** yalnızca taşımanın sonunda bitişik yaratığa (yol üstündeki ilk yaratıkta durma yok).
- **B4 — Water Walk, Knock**: karar bekliyor (aşağıda). (B3 Sleep, B5 Sanctuary, Warding Bond ve Bestow Curse kuyruk 4'te çözüldü.)


## Karar bekleyenler (özet)

**Kuyruk 9:**

- **K22 — Kafa görselleri:** gelen dosyaların arka planı opak siyahtı (şeffaf değil) ve kafalar 1× çizilmiş (opak kafa kadın 28×33, erkek 26×29 px); ≈ ×2 en yakın komşuyla ölçekleniyor. Seçenekler: (a) böyle kalsın; (b) 2× boyutta (kadın ≈ 56×64, erkek ≈ 48×59 px) şeffaf zeminli yeniden çizim (`docs/soy-bas.md`). Fighter ve Paladin'de omuz plakaları hâlâ ten rengine boyanıyor (kafa dışında, bu görevin kapsamı dışında): `goliath-female-fighter`, `goliath-male-fighter`, `goliath-female-paladin`, `goliath-male-paladin`, `goliath-female-cleric`, `goliath-male-cleric` için elle maske önerilir (K21 akışı).
- **M1 — Oyunun adı:** `APP_NAME` şimdi "Hex & Dice" (istek). Kalıcı ad seçilince yalnızca `src/app/appName.ts` değişir; logo görsellerinde yazı yok. Açık temada başlık metni parlak arka plan görselinde (açık tema görseli) yalnızca beyaz gölgeyle okunuyor; istenirse başlığa da cam zemin verilebilir.
- **K20 — Geçmiş (background) seçimi:** uygulamada geçmiş seçilemiyor, bu yüzden "geçmişin önerisi/verdiği feat" gösterilemiyor; köken feat'i serbest seçim. Seçenekler: (a) böyle kalsın; (b) SRD 5.2.1'in dört geçmişi (Acolyte, Criminal, Sage, Soldier) seçilebilir olsun: feat, beceriler ve yetenek bonusu kalıbı geçmişten gelsin, feat kilitli bilgi olsun (sihirbazda yeni alan, eski kayıtlar için göç).

**K21 (soy maskeleri) — kullanıcının yapması gerekenler:** `npm run soy-incele`, sayfayı açıp kırmızı örtüsü taşan jetonlara `docs/soy-maske-el.md`'deki gibi elle maske çizmek. Örtüsü ten dışına taşan (muhtemel) jetonlar:
- Goliath: `goliath-female-fighter`, `goliath-male-fighter`, `goliath-female-paladin`, `goliath-male-paladin`, `goliath-female-cleric`, `goliath-male-cleric` (omuz plakaları); `goliath-male-barbarian` (kürk/kemer), `goliath-female-barbarian` (balta sapı).
- Dragonborn: `dragonborn-male-barbarian`, `dragonborn-male-monk`, `dragonborn-female-monk` (kıyafet), `dragonborn-female-barbarian`, `dragonborn-female-sorcerer`, `dragonborn-female-druid` (saç, kürk), `dragonborn-male-druid`, `dragonborn-male-bard` (el/çalgı sınırı).
- Drow (elf): `elf-female-monk`, `elf-male-monk` (turuncu kıyafet), `elf-female-barbarian`, `elf-male-barbarian` (kürk/kemer), `elf-female-sorcerer`, `elf-male-sorcerer` (saç ucu).
Bu liste 128 px görüntüden; kesin karar inceleme sayfasında.

**Kuyruk 8:**

- **A6 — Çok altıgenli boyutu açmak:** motor bayrağı `multiHex` hazır ama varsayılan kapalı ve arayüzde yok; kalan işler `docs/harita/COKLU-ALTIGEN.md` "Kalanlar" (kurulumda otomatik yerleşim, zemin etkileri, itme, görüş hattı, yapay zekâ hedef sırası). Açılınca simülasyon senaryolarındaki Large+ canavarlar (ogre, ejderhalar…) değişir; denge yeniden ölçülmeli. Seçenekler: (a) kalanlar bitince Game Master kurulumunda "deneysel" anahtar, varsayılan kapalı; (b) kalanlar bitince varsayılan açık + denge turu; (c) kapalı kalsın.
- **A4 — Biat Yemini verisi:** SRD'de yok; genel `leash` etkisi ve özellik türü hazır. İçerik paketinde Biat Yemini S3 şöyle yazılır: `"effect": { "type": "action", "status": "ok", "effect": { "kind": "leash", "rangeFt": 30, "radiusFt": 30, "save": "wis", "rounds": 10 } }` (kaynak/kullanım sayısı paketin metnine göre). Kullanım bedeli (Channel Divinity mi?) ve süresi kitabın metninden doğrulanmalı.
- **A5 — Harp Koleji S10:** genel kanca hazır (`stat: extraBonusActions`, `value`). Harp verisi depoda yok; içerik paketinde S10 özelliğine bu satır eklenmeli; "her turda mı, kısa dinlenmede bir mi" kitaptan doğrulanmalı (kanca her tur yenileniyor).
- **K19 — erkek Dragonborn White:** istekte hem "eski yönteme dönsün" listesinde hem "yeni yolda kalsın" cümlesinde; yeni yolda (K15) bırakıldı. Eski yönteme almak tek satır veri (`byGender.male.lineages.white`: K8b `{h 200, s 0.03, l 1.45}`). Erkek Copper K8b değerinden tek sapma: ton 14 → 20 (Red ile ayrışsın diye).

**Kuyruk 7:**

- **K15 — Eşik altında kalan soy yok** (ΔE ≥ 15, 120 jetonun hepsinde). Sınırda kalanlar: Dragonborn Brass/Gold 16,0, Black/Silver 16,5, Brass/Copper 17,4 (rozet duruyor). Maske sınırları: Dragonborn boynuz ve kuyruğu, Tiefling boynuzları ten paletine yakın olduğu için boyanıyor; Goliath Cleric/Fighter/Paladin'de yalnızca baş boyanıyor (kol ve el zırhla aynı renkte); erkek Dragonborn Ranger ve kadın Druid'de el, asa/yay dışlama kutusunda kaldığı için boyanmıyor. Seçenekler: (a) böyle kalsın; (b) sorunlu jetonlar için elle çizilmiş maske; (c) soy başına ayrı görsel seti.
- **K17 — Taslağın kalıcılığı:** sınıf değişince eski seçimler yalnızca sihirbaz açıkken taslakta tutuluyor; kaydedip yeniden açınca eski sınıfın seçimleri yok (kayıt biçimi bozulmasın diye). Seçenekler: (a) böyle kalsın; (b) taslağı karaktere yaz (kayıt biçimi değişir).

**Kuyruk 6:**

- **DENGE-4 — Büyücü partisinin büyüklüğü:** görev "dört sınıf + Fighter ve Cleric" dediği için parti 6 kişi; senaryo bütçeleri 5 kişiye göre olduğundan sonuçlar diğer partilerle doğrudan karşılaştırılamaz. Seçenekler: (a) böyle kalsın (sınıf teşhisi üye başına hasarla yapıldı); (b) 5 kişilik varyant (ör. Bor çıkar) ekleyip yeniden ölç; (c) 6 kişilik partiler için senaryo düşmanlarını ölçekle.
- **DENGE-4 — Sorcerer yapay zekâsı Metamagic ve Font of Magic kullanmıyor:** Sorcerer zaten Wizard düzeyinde hasar verdiği için eklenmedi. Seçenekler: (a) kalsın; (b) basit kural (Quickened + cantrip, Careful dost alandayken) ve yeniden ölçüm.

- **K13 — Wild Shape biçim saldırılarında kapsam dışı kalanlar:** recharge'lı ve save'li saldırılar (Giant Spider Web, Swarm of Ravens Cacophony, Lion Roar, Constrictor Snake Constrict) ve alan saldırıları biçimde seçenek değil; Death Dog ısırığının hastalığı (lanet/ikinci aşama; canavarda da yok); sürülerin "kendi Bloodied" hasar değişimi Druid'in HP'sine bakar (biçimin ayrı HP'si yok, SRD 5.2.1). Seçenekler: (a) kalsın; (b) save'li biçim saldırıları için `monster_attack` benzeri ayrı komut.

**Kuyruk 5:**

- **U3 — Savaş sonu başlık videoları:** kuyruk 5'te klasör yoktu, atlandı; videolar eklendi, **kuyruk 6'da yapıldı** (aşağıda).
- **Yeni sınıflar için denge partisi:** Warlock, Bard ve Druid (ve Sorcerer) denge partilerinde yok; mevcut partiler birebir aynı sonuç verdi (DENGE.md). Seçenekler: (a) böyle kalsın; (b) dört sınıftan oluşan "büyücü" partisi (`data/sim-partiler.json`, SRD'ye göre eksiksiz 1/3/5 sayfaları) + 100 tohum.
- **DRUID — Wild Shape kuralı:** görevde "biçimin HP havuzu, taşan hasar asıl HP'ye" yazıyordu; bu 2014 kuralı. SRD 5.2.1'de Druid kendi HP'sini korur ve seviyesi kadar geçici HP alır; uygulama SRD 5.2.1'i izliyor. Seçenekler: (a) SRD 5.2.1 kalsın (önerilen; kaynak yalnızca SRD 5.2.1); (b) eski kural (SRD dışı, önerilmez).
- **DRUID — Beast saldırılarının ek etkileri:** biçimdeyken saldırılar silah seçeneği olarak; canavarın saldırı ek etkileri (Wolf'un yere düşürmesi, Giant Spider'ın zehri), recharge'lı ve save'li saldırılar yok. Seçenekler: (a) kalsın; (b) biçim saldırılarını canavar saldırısı yolundan (`monster_attack`, rider'lar) yürütmek.
- **WARLOCK — Thirsting/Devouring Blade:** ek saldırı pact silahıyla sınırlanmıyor. Seçenekler: (a) kalsın (Warlock'un tek yakın silahı çoğunlukla pact silahı); (b) saldırı başına silah denetimi.
- **BARD — Cutting Words zar seçimi:** SRD'de tepki anında saldırı ya da hasar zarı seçilir; oyunda zar atıldıktan sonra yararlı olana uygulanıyor; kontrol başarısı ve büyü hasarı tetikleri yok. Seçenekler: (a) kalsın; (b) oyuncuya "saldırı / hasar" seçimi sorulsun.
- **Song of Rest** SRD 5.2.1'de yok (2014 kuralı); eklenmedi.

**Kuyruk 4:**

- **CLERIC — Divine Intervention (10) ve Greater Divine Intervention (20):** veride `none`, Aşama 2 (5. seviyeye dek herhangi bir Cleric büyüsü / Wish; oyunda 4.+ seviye büyü yok). Seçenekler: (a) 4.+ seviye büyüler gelene dek kalsın; (b) şimdilik 0–3. seviye büyülerden birini slotsuz yapma (eksik bir uyarlama).
- **WIZARD — Spell Mastery (18) ve Signature Spells (20), Overchannel (Evoker 14):** veride Aşama 2 (1–3. seviye büyüler slotsuz / en yüksek hasar; Overchannel 1–5. seviye). Seçenekler: (a) kalsın; (b) Spell Mastery ve Signature Spells oluşturucuda büyü seçimiyle şimdi (büyüler 1–3. seviye olduğu için mümkün), Overchannel 1–3. seviyeye sınırlı.
- ~~**SORCERER — Seeking Spell ve Transmuted Spell:**~~ **Çözüldü (K11):** (b). SRD 5.2.1'de 10 Metamagic var; oyunda 8. Seeking (ıskalayan büyü saldırısını yeniden at, 1 SP) ve Transmuted (Acid/Cold/Fire/Lightning/Poison/Thunder arasında tür değiştir, 1 SP). Görevde yazılmadığı için eklenmedi. Seçenekler: (a) kalsın; (b) ikisi de eklensin (Seeking: saldırı yolunda ikinci d20; Transmuted: `damageChoices` kalıbıyla).
- **SORCERER — Elemental Affinity "renk":** SRD 5.2.1'de ejderha rengi yok; beş hasar türünden biri seçilir (tek seçim, varsayılan Fire). Seçenekler: (a) böyle kalsın; (b) Dragonborn soyuyla eşleşen tür varsayılan olsun (yalnızca öneri; seçim yine serbest).
- ~~**SORCERER — Innate Sorcery kapsamı:**~~ **Çözüldü (K11):** (b) `classSpells`. SRD "Sorcerer büyüleri"; oyunda karakterin bütün büyüleri (soy büyüleri dahil). Seçenekler: (a) kalsın (küçük sapma); (b) büyünün kaynağı (sınıf/soy) izlenip yalnızca sınıf büyülerine.
- **SORCERER — Font of Magic ve Metamagic yapay zekâsı:** yapay zekâ yalnızca Innate Sorcery kullanır. Seçenekler: (a) kalsın (denge partilerinde Sorcerer yok); (b) Sorcerer'lı yeni denge partisi + basit Metamagic sezgisi (Quickened cantrip, Twinned Hold Person, Careful Fireball).
- **K8b — Renk farkı yetersiz kalan soylar** (rozet mi, ek görsel mi): **Goliath'ın 6 soyu** (gri ten metal zırhla aynı tonda: ten az değişiyor, zırh renkleniyor; en zayıf), **Gnome Rock / Forest** (fark küçük, Rock temel görünüme çok yakın), **Dragonborn Brass / Bronze / Gold** (birbirine yakın sarı-kahve tonlar; altın süslü zırhta zırh da boyanıyor), **Wood Elf** (temel görünüme yakın). İyi ayrışanlar: Dragonborn Black/Blue/Green/Red/Copper/Silver/White, Tiefling üç soy, Drow, High Elf. Seçenekler: (a) böyle kalsın; (b) zayıf soylara köşe rozeti (yedek; veri rengi hazır); (c) Goliath (ve istenirse Gnome) için ayrı görsel seti (Goliath 120 görsel, ≈2,6 MB).

**Kuyruk 3:**

- **K8 — Alt ırk görselleri** (`docs/harita/ALT-IRK-GORSEL.md`): (1) yalnızca soy rozeti (0 görsel, ≈0 kB); (2) kodla palet değiştirme (CSS hue-rotate önerilmez; ten maskesiyle derlemede Dragonborn için 216 jeton, ≈5,6 MB depo); (3) tamamen ayrı görseller (456 görsel, ≈10 + 1,6 MB depo). Sayfa başına yük üçünde de değişmez. **Öneri:** şimdi (1), sonra yalnızca Dragonborn için (2) derlemede, Drow için istenirse (3).
- ~~**K9b — Karmaşık yukarı slot etkileri:**~~ **Çözüldü (WIZARD):** (b) yapıldı (`targetIds` ile çok hedefli save, Chromatic Orb sıçraması). Eski metin: Hold Person ve Blindness/Deafness slot başına +1 hedef (tek hedefli save komutu; çok hedef seçimi ve yapay zekâ hedef seçimi gerekir), Chromatic Orb sıçraması (aynı zar iki kez gelince yeni hedefe; slot seviyesi kadar). Seçenekler: (a) kalsın (veride, `applied` yok); (b) save büyülerine `targetIds` (Bless'teki çok hedef kalıbı) + Chromatic Orb için zincir hedef komutu.
- ~~**K9d — Kalkan:**~~ **Çözüldü (K9d-kalkan):** SRD metni birebir alıntılandı (DECISIONS.md): kalkan yalnızca AC'yi kaybettirir; davranış kaldı.
- **K9c — Jump maliyeti:** SRD "10 ft hareket harcayarak 30 ft'e kadar zıpla"; oyunda büyülü zıplama 2 altıgen harcar, yalnızca gerekince (engel, menzil ya da daha ucuz) ve turda bir kez. Seçenekler: (a) böyle kalsın; (b) zıplama her zaman yürüme maliyetiyle (görevdeki "ek maliyet yok" sözünün dar okuması).

**Önceki kuyruklar:**

Kuyruk 2 ve aynı gecenin görevleri: K3 (adım sayısı, soy büyüsü yeteneği, Goliath isabet yetenekleri, Stone's Endurance kapsamı, oyunda olmayan soy özellikleri), K4 (yetkin olunmayan zırh cezası, dağıtılmamış geçmiş bonusu), K7 (Eldritch Invocations; aşağıda). K5 ve K6'da karar bekleyen yok (sınıf tabloları eksiksiz).

- **K7 — Warlock Eldritch Invocations:** SRD 5.2.1'de 1. seviyeden seçilen yetenekler (Agonizing Blast, Pact of the Blade, Thirsting Blade: 5. seviyede Pact silahıyla Extra Attack…). Oyunda yok. Seçenekler: (a) yok kalsın (Warlock büyüleriyle oynar); (b) sihirbazda Invocation seçimi + en çok kullanılan birkaçının mekaniği (Agonizing Blast: Eldritch Blast hasarına CHA; Thirsting Blade: `attacksPerAction` 2; Repelling Blast: itme), diğerleri "oyunda yok" ⓘ ile.

- ~~**K1 — "Zarla" yöntemi:**~~ **Çözüldü (K2a):** (b) yapıldı, 4d6 en düşük atılır; otomatik ya da masa zarı.
- **K1 — "Aynı 4 alakasız alt sınıf" dolgusu depoda bulunamadı:** her sınıfın tam bir SRD alt sınıfı var. Olası kaynak tarayıcıdaki dış içerik paketi (Ayarlar → Dış içerik) ya da yerel `icerik/` klasörü. Sihirbaz kuralı genel uygulandı (veride alt sınıf yoksa "Yakında"; açılışta sınıfta olmayan alt sınıf temizlenir). Kaynak dış içerikse paketi Ayarlar'dan kaldırman yeterli.

- ~~**L6 — Açılış katman çözünürlüğü:**~~ **Çözüldü (K2b):** (b) 1800 px (kapalı katmanlar 1200).
- ~~**B3 — Sleep ikinci aşaması:**~~ **Çözüldü (WIZARD):** (b) `escalate` + `wakeOnDamage`. Eski metin: SRD 5.2.1'de başarısız save Incapacitated, sonraki tur sonunda ikinci başarısız save Unconscious. Oyunda yalnızca tur sonu save'le biten Incapacitated. Seçenekler: (a) böyle kalsın; (b) iki aşamalı zamanlayıcı (`conditionTimers`'a "ikinci başarısızlıkta durum değişir" alanı; "second failure" kalıbını canavar etkileri de kullanır, Bilinen eksikler'de).
- **B3 — Suggestion serbest metin:** oyunda iki öneri var ("savaşı bırak", "uzaklaş"). Seçenekler: (a) böyle kalsın; (b) Game Master'ın yazdığı öneri günlüğe yazılır, etki yine "turunu kaybeder" olur; (c) öneri listesi veride genişletilir (ör. "silahını bırak", "dostuna yaklaş").
- ~~**B3 — Charm Person/Animal Friendship hasarla bitme kaynağı:**~~ **Çözüldü (K2c):** (b) `casterSide`.
- **B4 — Water Walk:** haritalarda su, bataklık ve lav altıgenleri var (derin su geçilmez, bataklık zorlu). Seçenekler: (a) savaş dışı not kalsın (şimdiki); (b) süren etki `waterWalk`: sıvı altıgenleri düz zemin sayılır (derin su/bataklık kuralı atlanır, lavın hasarı sürer), 10 dosta kadar.
- **B4 — Knock:** Kale haritasında kapı kuralı (`gate`) var. Seçenekler: (a) savaş dışı not kalsın; (b) Knock kapıyı açar (kapı kuralına "açıldı" olayı; 300 ft'lik gürültü yok sayılır).
- **B4 — Ana parça büyüdü:** büyü verisi (`data/spells.json`; B3–B5'te 109 → 168 kayıt) ana parçada; 358 → 385 kB (sınır 500). Seçenekler: (a) böyle kalsın; (b) büyü verisini tembel yüklemeye geçir (`loadSpells()`, canavar ve sınıf verisi gibi; çağrı yerlerinde yükleme sırası gerekir).
- ~~**B5 — Sanctuary:**~~ **Çözüldü (CLERIC):** (b). Eski metin: seçenekler: (a) karar bekliyor kalsın; (b) saldırı/büyü hedeflenirken saldıran WIS save, başarısızsa saldırı boşa gider (eylem/saldırı harcanır; silah, canavar ve büyü yollarına ortak bir "hedef alma" denetimi); (c) basit yaklaşık: korunana saldırılar dezavantajlı (SRD'den uzak).
- ~~**B5 — Warding Bond:**~~ **Çözüldü (CLERIC):** (b). Eski metin: seçenekler: (a) karar bekliyor kalsın; (b) hedefe +1 AC/save ve direnç, hedef hasar alınca büyücüye aynı miktarda ikinci hasar olayı (bütün hasar yollarında ortak kanca); (c) bölüşmesiz (yalnızca güçlendirme; dengesiz).
- ~~**B5 — Jump / Spider Climb:**~~ **Çözüldü (K9c):** (b) yapıldı (ayrıntı DECISIONS.md).
- ~~**B5 — Bestow Curse'ün diğer üç seçeneği**~~ **Çözüldü (CLERIC):** (b). (saldırıya dezavantaj, tur başı WIS save ya da eylem kaybı, büyücünün isabetlerinde +1d8 necrotic): seçenekler: (a) yalnızca ilk seçenek kalsın; (b) üçü de `variants` ile eklensin (tur başı save için B3 zorlama kalıbına "save ile" eki gerekir).

- **K3 — Sihirbaz adım sayısı:** kimlik + tür + sınıf birleşince büyücüde 7, büyücü olmayanda 6 adım oldu (görevde 8/7 yazıyordu; üç adım birleşince iki adım düşer). Seçenekler: (a) 7/6 kalsın; (b) "Soy ve özellikler" gibi ayrı bir adım eklenip 8/7'ye çıkılsın.
- **K3 — Soy büyülerinin yeteneği:** SRD'de soy seçilirken INT/WIS/CHA seçilir; oyunda büyücü sınıfta sınıfın yeteneği, değilse en yükseği. Seçenekler: (a) böyle kalsın; (b) sihirbaza "soy büyüsü yeteneği" seçimi (kayıtta yeni isteğe bağlı alan; büyücü sınıfta ayrı DC gerekir).
- **K3 — Goliath isabet yetenekleri (Fire's Burn, Frost's Chill, Hill's Tumble):** oyunda silah isabetinde otomatik, turda bir kez; oyuncuya sorulmuyor, büyü saldırısında yok. Seçenekler: (a) böyle kalsın; (b) isabette oyuncuya sor (tepki istemi kalıbıyla "kullan / sakla"; yapay zekâ kural tabanlı); (c) büyü saldırılarına da açılsın.
- **K3 — Stone's Endurance kapsamı:** yalnızca saldırı isabetinin hasarında; büyü save'i, alan ve zemin hasarında yok. Seçenekler: (a) böyle kalsın; (b) bütün hasar yollarına ortak "hasar alınca" tepki kancası (Warding Bond ile aynı kanca).
- **K3 — Oyunda olmayan soy özellikleri:** Goliath Large Form (5. seviye) ve Powerful Build, High Elf'in uzun dinlenmede cantrip değiştirmesi, Rock Gnome'un mekanik aletleri. Seçenekler: (a) ⓘ notuyla kalsın; (b) Large Form süren etki olarak (boyut L, hız +10, STR avantajı; yalnızca görsel ölçek değişir), cantrip değiştirme dinlenme ekranında seçim.

- ~~**K4 — Yetkin olunmayan zırhın cezası:**~~ **Çözüldü (K9d):** (b) motorda ceza + sihirbaz uyarısı.
- ~~**K4 — Dağıtılmamış geçmiş bonusu:**~~ **Çözüldü (K9e):** (c) yumuşak uyarı, kaydı engellemez.

---

## K1: Karakter oluşturma sihirbazı

- Tek uzun form 9 adımlı sihirbaza çevrildi (Kimlik, Irk, Sınıf, Puanlar, Beceriler, İlerleme, Donanım, Büyüler, Özet); büyü seçemeyen sınıfta 8 adım.
- Veri, kayıt biçimi ve kurallar aynı: sorunlar `characterIssues` ile adımlara bağlandı (metinler aynı). Eksik "Devam"ı engellemez; Kaydet yalnızca Özet'te ve eksik yoksa çalışır. Eksikler kırmızı düğme, ilgili adıma götürür.
- Masaüstü: üstte adım çubuğu (✓ yeşil / turuncu geçerli / kırmızı "!"), sağda 290 px özet paneli. Mobil: "4 / 9 · Puanlar" başlığı, ilerleme çubuğu, alt özet çubuğu ("N eksik" açılır liste), 48 px Geri/Devam.
- Puanlar: altı kutu tek sırada (mobilde 2 sütun), "N temel + M geçmiş", standart dizide değer tek kutuda (yer değiştirme), puan satın almada "Kalan puan X / 27" çubuğu; geçmiş bonusu ve seviye artışı alttaki kutuda.
- Beceriler: 18 becerilik tek liste, Sınıf (turuncu) / Geçmiş (yeşil, kilitli) rozetleri, sayaçlar. Donanım: zırh türü düğmeleri + Kalkan, silah kartlarında ustalık düğmesi ("★ Nick"), "Silahlar: seçili N · Ustalık X / Y". Geliştirici etiketleri ⓘ ipucunda.
- Alt sınıfı veride olmayan sınıfta "Yakında" kutusu, eksik sayılmaz; kayıtlı geçersiz alt sınıf açılırken boşa çevrilir (bir kerelik not).
- Sihirbaz ayrı parça (`Builder`, 31,9 kB): ana parça **383 → 358 kB**.
- Testler: 7 yeni sihirbaz testi; tam paket 96 dosya / 1097 test; check:harita 160/0, check:ses 15/0.
- Ekran görüntüleri: `docs/sabah/k1-puanlar-masaustu.jpg`, `docs/sabah/k1-puanlar-mobil.jpg`.
- Commit 60186b6.
- Sapmalar: "Zarla" yöntemi yok (karar bekliyor); oyunda ayrı bir "geçmiş" varlığı olmadığı için geçmiş becerilerini oyuncu seçer (en çok 3), seçildiğinde kilitli rozetle gösterilir.

---

## L6: Açılışta kapalıdan açık kanada geçiş

- Kanıt toplandı: açılış dondurulup (Web Animations API) 2x ekran görüntüsü ve katman opaklık/z-sıraları alındı (masaüstü 1280×800, mobil 390×844).
- (a) Kapalı ve açık kanat ilk ≈160 ms'de aynı karede (0,9/0,06 → 0,1/1). Düzeltme: kapalı kanatlar açık kanatlardan önce tamamen söner (140 ms, `wing-at`'ta biter), açık kanatlar katlı pozdan ≈110 ms'de belirir. Sonra: 0 ms 0/0, 60 ms 0/0,84; iki siluet yok.
- (b) Kaynak görselde şerit/çentik yok. Canlı katmanda `will-change: transform` katlı pozda rasterleştirip büyütüyordu; kaldırıldı. Katman çözünürlüğü (1400 px) karar bekliyor.
- (c) Son logo karesinde çentik yok; açılış sırasında kanat katmanının kök kenarındaki dikey kesik (katman kutusu sınırı) kapalı gövdenin üstünde basamak gibi görünüyordu. Kök kenarına %3'lük yumuşak maske; tam açık görünüm aynı. Canlı zarın silueti bu bölgenin dışında (sorun zardan değil).
- Önce/sonra kareleri: `docs/sabah/l6-once-*.jpg`, `docs/sabah/l6-sonra-*.jpg` (0060 çift kanat, 0700 kök basamağı, 2000 son kare, mobil 0700), yakın plan `l6-kanat-koku-once/sonra.jpg`.
- Commit 5bc7f7d.
- Testler: açılış testleri (soğuk açılış, dönüş, atlama, hareketi azalt) yeşil + 1 yeni (kanat devri süresi). Tam paket 96 dosya / 1098 test; check:harita 160/0, check:ses 15/0. Ana parça 357,9 kB.

---

## B3: Zihin kontrolü ve yanılsama

- Yeni motor parçaları (`src/battle/mind.ts` + süren etki alanları): büyüleme (`charm`: büyüleyene saldırı yok), hasarla bitme (`breakOnDamage`), hasarla yeniden save (`damageSave`, Hideous Laughter avantajlı), zorlama hareketi (`compelEvents`: Command Approach/Flee, Fear kaçışı Dash ile, Suggestion "uzaklaş"; tur başında motorca, sonra tur biter), süren zorlama (`commandPersist`), büyücünün turunda hasar (`sourceTurnDamage`), Mirror Image kopyaları (`images`; isabette d6 ≥ 3 kopyaya), Protection from Evil and Good'un Charmed/Frightened koruması (`wardedFrom`, reducer).
- Büyüler: Charm Person, Animal Friendship (yeni), Command (5 sözcük; Drop yalnızca tur kaybı), Hideous Laughter, Fear, Hypnotic Pattern, Calm Emotions (yeni), Suggestion (yeni; iki seçenek), Mirror Image, Phantasmal Force (yeni), Protection from Evil and Good. Büyü sayısı 109 → 113.
- Savaş dışı işaretlenenler (denetimde "savaş dışı"): Minor Illusion, Prestidigitation, Disguise Self, Unseen Servant, Arcanist's Magic Aura, Silent Image, Major Image.
- **Denetim (0–3. seviye, 183 büyü):** önce tam 56 / kısmi 42 / yok 85 → sonra tam 56 / kısmi 47 / yok 80. Zihin kontrolü grubundaki büyülerin hepsi artık kısmi (sapmalar `approx` notunda); hiçbiri "tam" değil çünkü her birinde SRD'den küçük bir sapma var.
- Testler: `src/battle/b3.test.ts` 12 test (her büyü; konsantrasyon, süre, hasarla bitme, zorlama hareketi, replay). Kayıt uyumluluğu: olay biçimi değişmedi (yalnızca süren etkiye isteğe bağlı alanlar ve yeni hasar etkisi `effect_save`); `SAVE_VERSION` 19 kaldı, eski kayıt testleri yeşil.
- Teknik düzeltme: hasar profili takma adları (`const profileOf = damageProfile`) yeni döngüsel içe aktarmayla modül yüklenirken tanımsız kalıyordu; tembel sarmalayıcı yapıldı (7 dosya, davranış aynı).
- Hızlı regresyon (HEAD'e karşı, 100 tohum; standart ve paladin, 3. ve 5. seviye; Mağara, Dungeon, Kale, Volkan): **16 satırın hepsi aynı** (simülasyon partileri yeni büyüleri kullanmıyor).
- Commit d386872. Tam paket 97 dosya / 1110 test yeşil. Ana parça 361,3 kB. check:harita 160/0, check:ses 15/0.
- **Eksik sprite/ikon:** durum sprite'ları Charmed, Frightened, Incapacitated için var. Eksik: Mirror Image kopyaları (jetonda kopya göstergesi yok, yalnızca etki simgesi 👥), Phantasmal Force yanılsaması, Calm Emotions kayıtsızlığı, zorlama hareketi (Command/Fear kaçışı) için ayrı görsel; şimdilik etki simgeleri (emoji).

---

## B4: Aydınlatma, algılama, nesne büyüleri

- Işık: büyü ışıkları karanlık/gece haritalarının ışık listesine (`litHexes`) eklendi: süren etkide `light` (Light, Continual Flame, Flame Blade, Faerie Fire, Starry Wisp) ve alanda `zone.light` (Dancing Lights, Daylight). Yalnızca parlak ışık; ışıksız haritada etkisiz.
- Darkness: yoğun örtü alanı + büyülü karanlık (ışık aydınlatamaz, karanlık görüş içini göremez); Daylight örtüşen Darkness'ı kaldırır.
- Görünmezlik: Faerie Fire (DEX save; saldırılar avantajlı, Invisible yararı yok, ışık), Starry Wisp (isabette aynı işaret), See Invisibility (görünmeze dezavantaj yok). Ortak yer `src/battle/sight.ts`.
- Flame Blade (bonus eylemle hazır, saldırı "Büyüyü sürdür" ile aynı turda da; 3d6 + yetenek, slot başına +1d6), Sorcerous Burst (tür seçimi; patlayan zar yok).
- **Savaş dışı (Game Master'a not):** 25 büyü (Mage Hand, Thaumaturgy, Elementalism, Purify Food and Drink, Arcane Lock, Create Food and Water, Detect Magic, Detect Evil and Good, Detect Poison and Disease, Detect Thoughts, Find Traps, Locate Animals or Plants, Locate Object, Sending, Meld into Stone, Water Breathing, Water Walk, Knock + B3'ün 7 yanılsaması). Sihirbaz çipinde "savaş dışı" etiketi, savaş menüsünde "savaş dışı · Game Master", günlükte not. Ekran görüntüsü: `docs/sabah/b4-savas-disi.jpg`.
- **Denetim:** önce tam 56 / kısmi 47 / yok 80 → sonra tam 56 / kısmi 57 / savaş dışı 25 / yok 45 (yeni durum: savaş dışı). Büyü sayısı 113 → 145.
- Testler: `src/battle/b4.test.ts` 9 test (ışık, karanlık + Daylight, Dancing Lights konsantrasyonu, Faerie Fire, See Invisibility, Starry Wisp, Flame Blade, Sorcerous Burst, savaş dışı notu; replay). `spells.test.ts` yukarı slot listesine Flame Blade eklendi (veri değişikliği). Kayıt sürümü 19 kaldı (yalnızca isteğe bağlı alanlar ve `zone_ended` nedeni `dispelled`).
- Hızlı regresyon (HEAD'e karşı, 100 tohum; standart ve paladin, 3. ve 5. seviye; Mağara, Dungeon, Kale, Volkan): **16 satırın hepsi aynı** (Mağara karanlık haritası dahil; simülasyon partileri yeni büyüleri kullanmıyor).
- Commit f869fbf. Tam paket 98 dosya / 1119 test yeşil. Ana parça 373,8 kB (+12,5 kB büyü verisi; karar bekliyor). check:harita 160/0, check:ses 15/0.

---

## B5: Özel mekanikli büyüler

- Denetimdeki "özel mekanik" grubunun 31 büyüsü (+ Alter Self; Detect Magic B4'te) tek tek ele alındı:
  - **Çalışıyor (14):** Color Spray, Expeditious Retreat, Ice Knife, Alter Self, Darkvision, Dragon's Breath, Enhance Ability, Pass without Trace, Protection from Poison, Bestow Curse, Dispel Magic, Remove Curse (çoğu kısmi, sapmalar `approx`'ta); Darkvision ve Pass without Trace tam.
  - **Savaş dışı (10):** Druidcraft, Comprehend Languages, Floating Disk, Goodberry, Speak with Animals, Animal Messenger, Enthrall, Gentle Repose, Speak with Dead, Tongues.
  - **Karar bekliyor (4):** Sanctuary, Warding Bond, Jump, Spider Climb (yukarıda seçenekler).
  - **Kısmi kaldı (5):** Hex, Mage Armor, Invisibility, Magic Weapon, Mind Spike.
- Küçük motor kancaları: `darkvisionOf`, `checkAdv` (`checkMode`), `stealthAuraFor`, `cureOnCast`, `burst`, `kind: dispel`. Yeni geniş sistem yok.
- **Denetim:** önce tam 56 / kısmi 57 / savaş dışı 25 / yok 45 → sonra tam 58 / kısmi 67 / savaş dışı 35 / yok 23. Büyü sayısı 145 → 168.
- Testler: `src/battle/b5.test.ts` 12 test (veri sınıflaması, Ice Knife patlaması ıskada da, Color Spray süresi, Dragon's Breath, Expeditious Retreat, Alter Self, Darkvision, Enhance Ability, Pass without Trace konsantrasyonu, Protection from Poison, Bestow Curse + Remove Curse, Dispel Magic; replay). Kayıt sürümü 19 kaldı (yalnızca isteğe bağlı alanlar ve `effect_ended` nedeni `dispelled`).
- Hızlı regresyon (HEAD'e karşı, 100 tohum; standart ve paladin, 3. ve 5. seviye; Mağara, Dungeon, Kale, Volkan): **16 satırın hepsi aynı**.
- Commit 62eeb18. Tam paket 99 dosya / 1131 test yeşil. Ana parça 382,9 kB (büyü verisi +23 kayıt). check:harita 160/0, check:ses 15/0.

---

## CILA: B1/B2 sapmalarının düzeltmeleri

1. **Haste / Slow / Ray of Enfeeblement:** Haste'in ek eylemi ("Hızlı eylem", eylemden sonra; tek silah saldırısı, Dash, Disengage, Hide; yapay zekâ kullanır). Slow: DEX save −2, eylem ya da bonus eylem (ikisi değil), Attack tek saldırı. Ray of Enfeeblement: yakın dövüş (STR) saldırıları ve STR kontrolleri dezavantajlı. Ekran görüntüsü: `docs/sabah/cila-hizli-eylem.jpg`.
2. **Entangle/Web:** tur sonu save'i kalktı; eylemle ("Kurtul") Athletics kontrolü büyünün DC'sine karşı. Yapay zekâ tutulunca önce kurtulmayı dener.
3. **Sis içinden görüş:** iki taraf da örtünün dışındayken aradaki yoğun örtü iki tarafı görünmez yapar (avantaj ve dezavantaj birbirini götürür).
4. **Wind Wall:** menzilli silah saldırısı duvardan geçerken otomatik ıskalar (günlükte neden; yapay zekâ boşa atmaz); duvar düz ya da yay biçiminde (önizleme balonunda seçim).
5. **Acid Arrow** yukarı slotta gecikmeli hasar da +1d4; **Silence** içindeki yaratık Thunder'a bağışık; **Blindness/Deafness** Deafened seçilebilir (motor), Deafened Command ve Suggestion'ı engeller.
6. **Flaming Sphere ve ruh sürüsü:** kendi turları yok; sahibi bonus eylemle 30 ft taşır ("Çağrıyı taşı"); küre bitişik düşmana çarptırılır. Yapay zekâ basit kuralla taşır.
7. **Yapay zekâ zemin büyüleri:** Entangle, Web, Grease, Spike Growth, Sleet Storm, Stinking Cloud, Moonbeam: alanda en az iki düşman ve hiç dost yoksa.
- **Denetim:** önce tam 58 / kısmi 67 / savaş dışı 35 / yok 23 → sonra tam 59 / kısmi 66 / savaş dışı 35 / yok 23 (Acid Arrow tam). Kısmi kalanlardaki notlar daraldı (Haste, Slow, Ray of Enfeeblement, Entangle, Web, Fog Cloud, Wind Wall, Silence, Blindness/Deafness, Flaming Sphere, Conjure Animals).
- Testler: `src/battle/cila.test.ts` 11 test (her madde; replay). `b2.test.ts` ve `spells.test.ts` bilerek değişen davranışa göre güncellendi (commit mesajında gerekçe).
- **Hızlı regresyon** (HEAD'e karşı, 100 tohum; standart ve paladin × 3./5. seviye; Mağara, Dungeon, Kale, Volkan): en büyük fark ±2 puan (standart 3 Volkan 62 → 63, Dungeon 91 → 90; paladin 5 Volkan 89 → 91); aralık dışı satırlar önceden de dışındaydı (`docs/harita/DENGE.md`).
- Tam paket 100 dosya / 1142 test yeşil. Ana parça 384,8 kB. check:harita 160/0, check:ses 15/0. Kayıt sürümü 19 (yeni olaylar `haste_action`, `summon_steered`; eski kayıtlar yüklenir).
- Commit 1c745ed.

---

## L7: Son logo karesinde zarın omuzlarındaki çentik

- Kanıt (2x, son kare, koyu/açık, masaüstü/mobil): (A) L6'nın kök kenarı maskesi kaldırılınca omuzlardaki açık kırmızı çentik kayboluyor; fark yalnızca kanat kökünün %3'lük şeridinde (maske şeridi yarı saydam bırakıp alttaki geniş gövdenin hafif kaymış konturunu gösteriyordu). (B) Canlı zar/parlama/göz gizlenince omuzlarda değişen piksel yok. (C) Canlı zar son karede sönmüş (devir), silueti çentiğe katkı vermiyor; kaynak `logo-acilis.webp` omuzlarda temiz. **Neden: A (L6 maskesi).**
- Düzeltme: maske yalnızca kanatlar açılırken; tam açılınca maske kutusu büyüyüp saydam şerit katmanın dışına çıkıyor (`splash.css`, `splash-mask-off`). L6'nın açılış sırasındaki kök basamağı düzeltmesi korunuyor.
- Önce–sonra: `docs/sabah/l7-omuz-{dark,light}-{masaustu,mobil}.jpg` (2x, 5x/10x büyütme), tam kare `l7-once-masaustu-koyu.jpg` / `l7-sonra-masaustu-koyu.jpg`, deneyler `l7-deney-A-maske.jpg`, `l7-deney-B-zarsiz.jpg`.
- Açılış testleri 21/21 yeşil; typecheck ve build yeşil; check:harita 160 kontrol 0 hata, check:ses 15 kontrol 0 hata. Ana parça 384,8 kB (değişmedi). Kaynak görselde kusur yok (karar bekleyen yok).

## K3: Tek ilk adım ve tür soyları

- **İlk adım "Karakter":** kimlik (ad, seviye, görünüm), tür kartları ("Yetenek puanı bonusu türden değil, geçmişten gelir." notuyla), soy kartları, sınıf kartları, alt sınıf ve özellikler tek adımda. Adım sayısı büyücüde 7, büyücü olmayanda 6 (karar bekleyenlerde). Adım çubuğu, ilerleme çubuğu ve eksik düğmeleri yeni adıma gidiyor ("Ad boş" → Karakter).
- **Jeton önizlemesi:** jetonu tür, görünüm ve sınıf belirliyor; üçü de anında değiştiriyor (test). Masaüstünde sağ panelde büyük (200 px), mobilde üstte küçük yapışkan şerit. Görüntüler: `docs/sabah/k3-karakter-masaustu.jpg`, `docs/sabah/k3-karakter-mobil.jpg`.
- **Soy seçici:** açılır liste yerine kartlar (masaüstünde yan yana, mobilde alt alta); kartta ad ve yalnızca ayıran özelliklerin kısa özeti (veride `summary`, TR/EN). Aynı özet özet panelinde ve karakter kartında.
- **Dragonborn:** 10 ata türü nefes türünü ve direnci zaten doğru veriyordu (test eklendi). **Tiefling:** direnç vardı; soy büyüleri (Abyssal, Chthonic, Infernal; 3. ve 5. seviye) eklendi, Hellish Rebuke slotsuz tepki.
- **Elf** (Drow: karanlık görüş 120 ft, Dancing Lights, Faerie Fire, Darkness; High Elf: Prestidigitation, Detect Magic, Misty Step; Wood Elf: hız 35 ft, Druidcraft, Longstrider, Pass without Trace), **Gnome** (Forest: Minor Illusion, Speak with Animals yetkinlik bonusu kadar; Rock: Mending, Prestidigitation), **Goliath** (6 ata, yetkinlik bonusu kadar): mevcut sistemlerle bağlandı. Seviyeli soy büyüsü uzun dinlenmede bir kez slotsuz; büyücü olmayan karakterde büyü yeteneği INT/WIS/CHA'nın en yükseği.
- **Goliath:** Fire/Frost/Hill silah isabetinde otomatik (turda bir), Stone ve Storm tepki, Cloud bonus eylemle 30 ft ışınlanma (savaş menüsünde altıgen seçilir). Kısmi olanlar yalnızca ⓘ ipucunda.
- **Soy yetenekleri** özette ve savaş kartında soy adıyla ("Drow: Faerie Fire"); savaş dışı ya da oyunda olmayanlar ⓘ ile.
- **Eski kayıt:** soyu boş Elf/Gnome/Goliath karakter ilk soyu alır, bir kerelik not. Kayıt sürümü 19.
- **Celestial:** veride alt seçeneği yok, dokunulmadı.
- **Testler:** `src/battle/lineage.test.ts` (10: özet verisi, 10 Dragonborn atası, Tiefling/Elf/Gnome büyü ve kaynakları, Drow slotsuz Faerie Fire + replay, Goliath isabet/tepki/ışınlanma + replay, eski kayıt), `wizard.test.tsx` (+3: eksiklerin adımı, jeton önizlemesi, soy kartları ve özette soy). Değişen eski testler: adım adları ve sayıları, "miras" → "soy" metni.
- **Doğrulama:** typecheck, tam paket 101 dosya / 1155 test yeşil, build (ana parça 384,8 → 394,2 kB: tür ve kaynak verisi + soy modülü; sınır 500), check:harita 160/0, check:ses 15/0. Hızlı regresyon (HEAD'e karşı, 100 tohum, standart ve paladin, 3. ve 5. seviye, Mağara/Dungeon/Kale/Volkan): kazanma oranları ±2 puan içinde (Elf üyelere soy yazıldı).

## H-SLOT: Yarım büyücünün (Ranger, Paladin) büyü yuvası yok

- **Yeniden üretim:** (a) sihirbazla yeni Ranger/Paladin 1/3/5 ve (b) hazır örnekler savaşa doğru yuvayla giriyor (1: 2, 3: 3, 5: 4 + 2); (c) **kayıtlı durumu olan** karakter (boş formun varsayılanı Fighter iken dinlenmiş ya da savaşmış, sonra Ranger/Paladin yapılmış ya da seviye atlamış) savaşa 0 yuvayla giriyordu: menüde her büyü "slot yok".
- **Neden:** yuvalar kayda yazılmıyor, savaşa girişte sınıf tablosundan hesaplanıyor (tablo doğru, 1. seviyeden başlıyor; sihirbaz alanı yazmıyor). Savaşlar arası durum kalan yuvayı tutup yeni tabloyla "en az" alındığından kazanılan yuvalar kayboluyordu.
- **Düzeltme:** durumda en çok yuvalar da (`slotMax`) tutuluyor; harcanan düşülüyor. Eski kayıtlarda yuvalar açılışta bir kez tamamlanıyor, kısa not ("Büyü yuvaları sınıf ve seviyeye göre tamamlandı"). Kayıt sürümü 19.
- **Testler:** `src/rules/slots.test.ts` (her sınıf ve seviye 1–20 için yuva tablosu, sihirbazla oluşturulan Ranger/Paladin 1/3/5 savaşta, Fighter → Ranger ve seviye atlama, eski kayıt onarımı). Değişen eski test: savaş sonucu durumu artık `slotMax` içeriyor.
- **Ekran görüntüsü:** `docs/sabah/h-slot-ranger-buyu-menusu.jpg` (eski kayıtlı 5. seviye Ranger, onarımdan sonra büyü menüsü: hepsi seçilebilir).
- **Doğrulama:** typecheck, tam paket 102 dosya / 1159 test yeşil, build (ana parça 395,0 kB), check:harita 160/0, check:ses 15/0; hızlı regresyon (standart ve paladin, 3. ve 5. seviye, 4 senaryo) HEAD ile birebir aynı.

## K4: Karakter sihirbazı cilası

- **İlerleme adımı:** yetenek artışı her ASI yuvasının kendi kartında (altı yetenek −/+, "Kalan puan n / 2", önce → sonra skoru; +2 / +1+1, 20 sınırı aynı). Puanlar adımında yalnızca temel puan ve geçmiş bonusu.
- **Puanlar:** standart dizide açılır liste yok; kutuya dokun, değer çipini seç (başka kutudaki değer soluk, seçilirse yer değiştirir). Geçmiş bonusu tek satır; mobilde ≥ 44 px.
- **Beceriler:** Türkçe adlar (İngilizce adı yanında küçük), düğmeler ≥ 44 px, mobilde okunaklı düzen.
- **Donanım:** zırh/kalkan/silahta "yetkin / yetkin değil" rozeti (zırh eğitimi SRD sınıf tablosundan `armorTraining`), "Yalnızca yetkin olduklarım" süzgeci (varsayılan açık). Zırh cezası motorda olmadığı için uyarı konmadı (karar bekleyenlerde).
- **Uyum sınırı:** motor bütün uyumlu eşyaları uyguluyordu; artık en çok 3 (ilk 3). Dördüncü seçilemez, sayaç "uyum n / 3"; eski kayıtta fazlası Donanım eksiği.
- **Özet:** tek Kaydet; dağıtılmamış geçmiş bonusu satırı kaldırıldı (eksik sayılmıyor; karar bekleyenlerde).
- **Alt sınıf adları:** "Evokasyon Ustası (Evoker)", "Yaşam Etki Alanı (Life Domain)", "Bilgi Koleji (College of Lore)"; listede TR + SRD adı.
- **Testler:** `src/screens/k4.test.tsx` (8: değer çipleri, uyum sınırı sorun/etki/arayüz, zırh eğitimi, rozet ve süzgeç, tek Kaydet, Türkçe adlar), `asi-ui.test.tsx` yeni yere göre yeniden yazıldı; wizard testinde beceri adı ve kutu sınıfı güncellendi. Tam paket 103 dosya / 1168 test yeşil; build (ana parça 396,7 kB), check:harita 160/0, check:ses 15/0; hızlı regresyon HEAD ile birebir aynı.
- **Ekran görüntüleri:** `docs/sabah/k4-ilerleme-masaustu.jpg`, `docs/sabah/k4-ilerleme-mobil.jpg`.

## K5: Taşıma kapasitesi

- **Veri:** bütün silah, zırh ve eşyalarda `weight` (lb); silah/zırh SRD tablolarından, eşyalar SRD Adventuring Gear tablosundan; SRD'de ağırlığı olmayan sihirli eşyalarda varsayım `weightApprox: true` (DECISIONS.md). Kalkan 6 lb ve eşikler `data/tasima.json`.
- **Kural:** kapasite Güç × 15 lb. Ayarlar'da "Taşıma yükü kuralı": Kapalı / SRD sınırı (varsayılan) / Kademeli (Güç × 5 üstü Yüklü −10 ft; Güç × 10 üstü Ağır yüklü −20 ft + STR/DEX/CON testleri, kurtarmalar ve saldırılarda dezavantaj).
- **Sihirbaz:** Donanım adımında "Taşınan x / y lb" çubuğu (kademelide eşik çizgileri), aşınca kırmızı uyarı; kartlarda ağırlık. SRD sınırında aşan karakter Özet'te eksik (Kaydet kapalı). Eski kayıt açılır, listede ve savaş kartında "⚖" rozeti.
- **Testler:** `src/rules/carry.test.ts` (5: veri, kapasite/yük, SRD sınırı ve eski kayıt, kademeli hız ve dezavantaj, kapalı kural), `src/screens/k5.test.tsx` (2: çubuk ve ağırlıklar, aşınca uyarı ve Özet'te eksik). Tam paket 105 dosya / 1175 test; check:harita 160/0, check:ses 15/0. Hızlı regresyon HEAD ile birebir aynı (simülasyonda kural kapalı).
- **Boyut:** ana parça 396,7 → 400,4 kB (ağırlık verisi, taşıma modülü ve metinler).
- **Sapmalar:** savaşta SRD sınırının (kapasiteyi aşmanın) etkisi yok; aşan karakter yalnızca eski kayıtta olabilir.
- **Ekran görüntüleri:** `docs/sabah/k5-donanim-masaustu.jpg` (kademeli kural), `docs/sabah/k5-donanim-mobil.jpg` (SRD sınırı).

## K6: Büyü seçim sınırları ve sınıf büyü listeleri

- **Sınırlar SRD sınıf tablolarından** (eksik tablo yok): Cantrip, Hazırlanan (Prepared Spells), en yüksek büyü seviyesi; Wizard büyü kitabı 6 + 2/seviye; Warlock'ta 2024 kuralı (Prepared Spells sütunu, Pact Magic yuvaları).
- **Büyüler adımı:** cantrip ve seviye grupları, sayaçlar ("Cantrip 3 / 4", "Hazırlanan 7 / 9", "Büyü kitabı 10 / 14"), sınırda seçim kapalı, erişilemeyen seviyeler kilitli, oyunda olmayan SRD büyüleri soluk ("oyunda yok"). Wizard'da Kitap → Hazır. `savaş dışı` etiketleri ve büyü kartları aynı.
- **Sınıf listeleri:** 8 sınıfın SRD 5.2.1 listesi kimlikle bağlı (`data/sinif-buyuleri.json`, yalnızca oluşturucu parçasında).
- **Fazla seçim:** seviye/sınıf değişince ayıklanmıyor; Özet'te "Hazırlanan büyü fazla (n / m)" eksiği (eski kayıt da açılır, eksik olarak işaretlenir).
- **Savaş:** menü yalnızca hazırlanan + cantrip (+ her zaman hazır, soy). Bonus eylem büyü kuralı: SRD 5.2.1'deki karşılığı "turda tek yuvalı büyü" zaten uygulanıyordu (test eklendi); 2014'teki "yalnızca eylemlik cantrip" kısıtı 5.2.1'de yok (DECISIONS.md).
- **Testler:** `src/screens/k6.test.tsx` (6: 8 sınıf × 1–5 tablo sayıları, listelerin SRD ile aynılığı, Wizard 5 sayaçları ve kilitli seviyeler, sınırda kapalı düğmeler ve kitap şartı, eski kayıtta fazla seçim, turda tek yuvalı büyü). Tam paket 106 dosya / 1181 test; check:harita 160/0, check:ses 15/0; hızlı regresyon HEAD ile birebir aynı.
- **Boyut:** ana parça 402,3 kB; oluşturucu parçası 68,5 kB (sınıf listeleri burada).
- **Ekran görüntüleri:** `docs/sabah/k6-buyuler-masaustu.jpg`, `docs/sabah/k6-buyuler-mobil.jpg` (Wizard 5).

## Kuyruk 3: K9a–K9e, K2a–K2c, K8

| Görev | Commit | Özet |
|---|---|---|
| K9a | `553c464` | 18 savaş dışı büyü, Game Master notu TR/EN (`gmNoteEn`); denetimde "yok" 23 → 5 |
| K9b | `c6a0f05` | `docs/harita/UPCAST.md` (61 büyü: 54 uygulanıyor, 1 kısmen, 2 yalnızca süre, 4 karar/ayrı iş, 0 uygulanmayan). Fireball, Cure Wounds, Bless… kod hazırdı, `applied` bayrağı eksikti; Fog Cloud yarıçapı, Ice Knife patlaması, Dragon's Breath, Enhance Ability, Magic Weapon +2/+3, Bestow Curse süre/konsantrasyon |
| K9c | `4d0444c` | Dikey hareket bayrağı (`ignoresHeight`/`climbs`); Spider Climb ve Jump süren etki; Fly/Levitate/Gaseous Form zaten yükseklik ve zemin engelini yok sayıyordu |
| K9d | `25f1736` | Eğitimsiz zırh: STR/DEX saldırı/save/kontrol dezavantajı, büyü yok; eğitimsiz kalkan AC vermez (SRD); sihirbaz uyarısı. **Örnek karakter:** Tavi (Cleric) Chain Mail → Half Plate (AC 18 → 17) |
| K9e | `cc4d78f` | Özet'te yumuşak uyarı, kaydı engellemez, eksik sayılmaz |
| K2a | `0eb251f` | "Zarla (4d6)": otomatik ya da masa zarı (elle zar defteri), yeniden atma yok, kutu seçimiyle yerleştirme |
| K2b | `1ce29d6` | Açılış 1400 → 1800 px, kapalı katmanlar 900 → 1200; açılış dosyaları 243 → 328 kB; ana parça etkilenmedi |
| K2c | `165fe75` | Charm Person / Animal Friendship `breakOnDamage: 'casterSide'` |
| K8 | `6bfcb23` | `docs/harita/ALT-IRK-GORSEL.md` (yalnız inceleme) |

- **Değişen eski testler:** `spells.test.ts` (uygulanan yukarı slot listesi 18 → 55; Fireball beklentisinde `applied`), `b5.test.ts` (Jump/Spider Climb artık süren etki), `k6.test.tsx` ("oyunda yok" örneği kilitli 4+ seviyede), `k4.test.tsx` (eğitimsiz zırh uyarısı var; geçmiş bonusu yumuşak uyarısı var), `logo.test.tsx` (logo-acilis genişliği 1800), `b3.test.ts` (Animal Friendship `breakOnDamage: 'casterSide'`).
- **Denge** (`docs/harita/DENGE.md`): K9b 16 satır ±2 içinde. K9d aralık dışı iki satır: standart 3 Kale %84 → %78 (−6), paladin 3 Kale %90 → %86 (−4); neden Tavi'nin AC'si. K9c ve K2c sim partilerini etkilemiyor (ölçülmedi, gerekçe DECISIONS.md'de).
- **Ekran görüntüleri:** `docs/sabah/k2a-zarla.png`, `k9d-zirh-uyari.png`, `k9e-gecmis-bonusu.png`.
- **Kuyruk sonu:** tam paket 111 dosya / 1205 test yeşil; check:harita 160/0, check:ses 15/0; ana parça 412,9 kB (sınır 500).
- **Not:** gece boyunca bir kez işçi süreci yeniden başladı (bellek); yarıda kalan K9d regresyonu ve kontroller baştan, sırayla koşuldu. Kayıp yok.

---

## K7: Saldırı ve büyü sayısı denetimi

- **Denetim:** `docs/harita/SALDIRI-DENETIMI.md` (her sınıf 1–5. seviye Attack eylemi saldırısı, Fighter 11/20; bonus eylem ve tepki saldırıları, ustalıklar; cantrip ölçeği, ışın sayıları, tur sınırları, Haste/Slow, turda tek yuva).
- **Sonuç:** Extra Attack sayıları, Light/Nick, Martial Arts/Flurry, fırsat saldırısı, Cleave, Sneak Attack turda bir, Spirit Guardians, Divine Smite, Haste tek saldırı, cantrip ölçeği ve Eldritch Blast ışınları SRD ile uyumlu.
- **Düzeltilen:** Magic Missile ve Scorching Ray'in yukarı slot dartı/ışını uygulanmıyordu (slot başına +1); düzeltildi, test `src/battle/k7.test.ts` (dart/ışın sayıları, Eldritch Blast 1/5/11/17, Extra Attack tablosu).
- **Regresyon:** paladin 5 Mağara 70 → 74 (+4; `docs/harita/DENGE.md`), diğer satırlar ±1 içinde.
- **Değişen eski test:** `spells.test.ts` uygulanan yukarı slot listesi (Magic Missile, Scorching Ray eklendi).
- **Karar bekleyen:** Eldritch Invocations (yukarıda). Tam paket 107 dosya / 1184 test; ana parça 402,3 kB; check:harita 160/0, check:ses 15/0.

