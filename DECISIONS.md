# Kararlar

Projede alınan içerik ve kural kararlarının kaydı. En yeni karar en üstte.

## 2026-10-29 — Fighter, Rogue, Ranger 1–20 ve Champion, Thief, Hunter (Görev F)

- **Yarım iş korundu:** stash ve `gorev-f-wip.patch` önce `wip/gorev-f` dalına "WIP" commit'i olarak itildi; ana dalda E1 sonrası koda uyarlandı. Champion/Thief/Hunter mekanikleri `data/subclasses.json` `effect` alanlarında (jenerik şema), sınıf düzeyi özellikler `data/class-features.json`'da.
- **Özellik işaretleri veriden:** mekanikte `trait` (savaşçıda `traits`), `stat: critOn` (Improved/Superior Critical), `stat: saveProficiency` (Slippery Mind), seçenekli özellik `options` + `default` (Hunter's Prey, Defensive Tactics; karakterde `featureChoices`, oluşturucuda açılır liste; anahtar `sınıf/altsınıf:özellik`). Kurallar tek modülde: `src/battle/classTraits.ts` (kodda sınıf adı yok). Dış içerik şeması aynı alanları tanır (`KNOWN_TRAITS`).
- **İkinci şans zarları** (`ExtraDie.reroll`, `rules/attack.ts` `secondChance`): Indomitable (başarısız save yeniden, + Fighter seviyesi), Stroke of Luck (başarısız D20 Testi 20 olur), Tactical Mind (başarısız kontrole 1d10; tutmazsa Second Wind harcanmaz). Hepsi kendiliğinden kullanılır (karar sorulmaz; yapay zekâ ve oyuncu için aynı), kaynak reducer'da düşer, günlükte zar eklentisi olarak görünür.
- **Cunning Strike** (`attack.cunning`): Sneak Attack isabetinde seçilen seçenekler zar düşer; DC 8 + DEX + yetkinlik. Trip (Large ya da küçük, DEX, Prone), Withdraw (yaklaşık: bu tur Disengage; SRD'de hemen yarı hızla hareket), Daze (CON, sonraki turunun sonuna dek Dazed: turunda yalnızca biri — hareket, eylem ya da bonus eylem), Knock Out (CON, Unconscious, tur sonunda CON save ile biter, en çok 10 tur; SRD'deki "hasar alınca uyanır" yok), Obscure (DEX, Blinded). Improved Cunning Strike iki seçenek. Poison yok (alet verisi yok). Arayüz: saldırı balonunda onay kutuları (yetmeyen zar soluk).
- **Steady Aim** (`steady_aim` komutu, bonus eylem, bu tur hareket etmemişse): bu turun sonraki saldırısı avantajlı, hız 0 (`movementUsed` 999). **Horde Breaker** (`horde_breaker`): turda bir kez, bu tur silahla saldırılan yaratığın 5 ft yakınındaki başka yaratığa aynı silahla ek saldırı (`economy.lastTargetId`). Colossus Slayer, Superior Hunter's Prey (`extra_damage` olayı; ikinci hedef kendiliğinden en düşük HP'li), Foe Slayer (d10), Precise Hunter (avantaj), Relentless Hunter (hasar Hunter's Mark konsantrasyonunu bozmaz), Escape the Horde, Multiattack Defense (`mdefense` işareti), Studied Attacks (`studied` işareti).
- **Savunma:** Evasion (`saveDamage`; bütün save'li hasar yolları: büyü, alan, aura, canavar), Elusive (avantaj kaynakları düşer), Reliable Talent (yetkin beceride 9↓ → 10), Survivor (ölüm save'i avantajlı, 18–20 doğal 20; Bloodied iken tur başı 5 + CON), Remarkable Athlete (inisiyatif ve Athletics avantajlı).
- **Herkesin silahsız vuruşu** (SRD Unarmed Strike): 1 + STR (en az 0) bludgeoning, STR + yetkinlik; Monk'ta Martial Arts sürümü. Sabit hasar ifadesi zar atmaz (`parseDice("3")`).
- **Yapay zekâ:** Steady Aim (bitişik düşman yokken, saldırıdan önce), Cunning Strike (Trip: hedefe bitişik bir müttefik varsa, hedef Large ya da küçükse ve Sneak Attack ≥ 3d6; Withdraw: yakın dövüşte HP yarının altındaysa), Horde Breaker (Attack ve Action Surge sonrası), Indomitable/Stroke of Luck kendiliğinden.
- **Çalışmayanlar (yeni sistem açılmadı):** Tactical Master (saldırı başına ustalık seçimi), Heroic Warrior (Heroic Inspiration), Thieves' Cant, Fast Hands ve Use Magic Device (eşya eylemi), Supreme Sneak (Invisible koşulu gizlenmeden ayrı değil), Thief's Reflexes (ilk turda çift sıra), Hunter's Lore (bilgi). Kısmi: Tactical Shift ve Remarkable Athlete'in yarım hızlı hareketi (Disengage yaklaşığı), Second-Story Work'ün atlama mesafesi, Roving'in tırmanma/yüzme hızı, Tireless'ın Exhaustion'ı, Feral Senses'in görünmezlik etkisi, Deft Explorer'ın dilleri, Ranger Fighting Style'ın Druidic Warrior seçeneği, Superior Hunter's Defense (yalnızca isabet).
- **Kayıt sürümü 18** (3–18 yüklenir): yeni olaylar `mark_added`, `steady_aim_used`, `extra_damage`; `attack_resolved` yeni alanlar (`traitTurns`, `steadyAim`, `cunning`). Elle zar: ikinci şans ve Cunning Strike save'leri aynı zar defterinden.
- **Simülasyon partileri:** `fighter` (Bor yerine Dain: Greatsword + Great Weapon Fighting, Champion), `rogue` (Bor yerine Nix: ikinci Thief), `ranger` (Bor yerine Rook: yakın dövüş Hunter, Longsword + kalkan, Horde Breaker). Kael'e Deft Explorer uzmanlığı (Perception) eklendi.
- **Denge (gözetimsiz):** eski partilerin hızlı regresyonu atlandı (Bor/Sela/Kael bilerek değişti), doğrudan tam ölçüm yapıldı. Ortak listelerde birden çok partinin aralık dışında kaldığı 6 senaryo düzeltildi (2 deneme, `docs/harita/DENGE.md`); tek partide aralık dışı kalanlar (Rogue partisi Düz %52, Ranger birkaç senaryoda 86–91, standart 3. seviye Koridor %94) bırakıldı, çünkü ortak listeyi değiştirmek diğer partileri aralık dışına itiyor. Haritaya 9'dan fazla düşman sığmadığından 5. seviye Kale ve Taverna'da düşman eklemek yerine türü güçlendirildi.

## 2026-10-29 — Jenerik alt sınıf şeması ve dış içerik yükleyici (Görev E1)

- **Şema** (`data/subclasses.json`, `SubclassDef` / `SubclassFeatureDef`, `src/data/types.ts`): alt sınıf `id` (bütün alt sınıflar arasında benzersiz; aynı görünen ad iki sınıfta olabilir), `class`, `srd` (yalnızca SRD alt sınıflarında), `pack` (dış içerik paketinin kimliği; yükleyici yazar), TR/EN `name` ve `role`, `features`. Özellik: `id`, `level` (1–20), TR/EN `name` ve `description`, `status` (`calisir` / `planli` / `hikaye` / `calismiyor`), `effect` (data/class-features.json özellik mekaniğiyle aynı biçim; yeni etki türü yok). Anahtar `sınıf/altsınıf:özellik` (SRD kimliği, değişmez).
- **Etkin seviye** max(özellik seviyesi, alt sınıf seviyesi = 3): alt sınıf 3. seviyede seçilir, daha önceki seviyedeki özellikler 3'te birlikte açılır. SRD'de 3'ten önce alt sınıf özelliği yok.
- **12 SRD alt sınıfı taşındı:** adlar ve roller (SRD'nin "flavor" satırı) TR/EN, açıklama EN = SRD metni, TR = kısa özet. Alt sınıf mekanikleri (7 kayıt: Frenzy, Retaliation, Cutting Words, Open Hand Technique, yemin büyüleri, Sacred Weapon, Superior Hunter's Defense) `class-features.json`'dan `effect` alanına taşındı; sınıf özellikleri yerinde. Etkisi olmayan özelliklerin etiketi: `planli` (durum bağışıklığı, Bardic Inspiration, Wild Shape/dinlenme, uçuş, Heroic Inspiration gibi listede bekleyen sistemler), `hikaye` (savaş dışı: Hunter's Lore, Fast Hands, Use Magic Device, Evocation Savant), diğerleri `calismiyor`. **Regresyon:** taşımadan önce 12 alt sınıf × 20 seviyenin `gainedFeatures` + `classKit` çıktısının SHA-256 özeti fikstüre yazıldı (`src/rules/fixtures/alt-sinif-oncesi.json`); test birebir aynılığı denetler. Simülasyon (4 parti × 3/5. seviye × 4 senaryo × 200) HEAD ile aynı.
- **Görev F ile ilişki:** F'nin yarım işi (Fighter/Rogue/Ranger) `class-features.json`'a Champion/Thief/Hunter mekanikleri ekliyordu; Görev F'de bunlar `data/subclasses.json`'daki `effect` alanlarına yazıldı.
- **Dış içerik paketi** (`src/content/schema.ts`): `{ "format": "rpg-battle-icerik", "version": 1, "id", "name": {tr,en}, "author"?, "subclasses": [...] }`. Yalnızca JSON okunur; kod çalıştırılmaz, ifade değerlendirilmez. Doğrulama: biçim/sürüm, kimlik deseni (küçük harf, rakam, tire; 2–48), SRD ve yüklü paketlerle alt sınıf kimliği çakışması, paket kimliği çakışması (önce silinmeli), paket içinde yinelenen kimlik, bilinen sınıf, seviye 1–20, durum etiketi, etki alanları yalnızca `FeatureMechanic` alanları ve bilinen değerler (tür, durum, stat, kaynak, komut, feat kategorisi, tepki/etki türü, büyü adları), "çalışır" ⇔ ok/partial etki. Hatalar kod + konum; metinleri TR/EN (`strings.ts` `content.errors`).
- **Sınırlar:** dosya 256 kB, en çok 20 paket, pakette en çok 24 alt sınıf, alt sınıfta en çok 30 özellik, ad 60 / açıklama 4000 karakter. Bozuk JSON ve büyük dosya hata olarak döner; diğer dosyalar etkilenmez.
- **Yükleme:** tarayıcı belirli bir klasörü kendiliğinden okuyamaz. Masaüstünde (Chromium) "Klasörden yükle" klasör seçiciyle klasördeki bütün .json dosyalarını okur (önerilen klasör `icerik/`); her yerde (mobil dahil) dosya seçici. Paketler bu tarayıcının localStorage'ında (`rpg-battle-icerik`), açılışta sınıf verisinden sonra yeniden doğrulanıp uygulanır. Ayarlar ekranı (ana ekranda "Ayarlar"; tembel parça) "Dış içerik": liste, özet (alt sınıf ve "çalışmıyor" sayısı), tek tek aç/kapa, sil (onaylı).
- **İçerik eksik:** paket silinir ya da kapatılırsa onu kullanan karakter değişmez (alt sınıf kimliği kalır), listede "içerik eksik" görünür, oluşturucuda seçenek olarak durur, alt sınıf özellikleri olmadan savaşa girer. Bilinmeyen alt sınıf artık karakter sorunu sayılmaz (eskiden "Bilinmeyen alt sınıf" kaydetmeyi engelliyordu).
- **Depoya girmez:** `.gitignore`'a `data/custom/` ve `icerik/`. Test için yalnızca kurgusal örnek paket (`src/content/fixtures/ornek-paket.json`: "Kehribar Muhafızı", "Sis Yolcusu"). `npm run check:icerik [klasör]` (varsayılan `icerik/`): paketleri sırayla doğrular, çakışma, eksik alan, bilinmeyen etki, seviye aralığı, alt sınıf başına durum sayıları ve "çalışmıyor" toplamı; hata varsa çıkış 1.
- **Kayıt sürümü 17** (3–17 yüklenir): kayda o an açık dış içerik paketlerinin kimlikleri (`content`) yazılır; yüklerken eksik olanlar `missingContent` olarak döner, savaş yine oynar (alt sınıf özellikleri olaylardaki savaşçılarda).
- Alt sınıf özelliğinden gelen uzmanlık bir kez sayılır (sınıf tablosunda birden çok kez gelen Expertise sayımı yalnızca sınıf özelliklerinde).

## 2026-10-29 — Arayüz düzeltmeleri (Görev U)

- **Savaş menüsü (≡, sol üst):** açıkken katmanı eylem düğmelerinin (radial, z 4) ve açıklamalarının (z 7) üstünde (z 9). Yüksekliği savaş alanıyla sınırlı, sığmazsa dikey kaydırılır (dokunmatikte de). ≡ düğmesi artık menü genişliğine yayılmıyor. 360×640 (dikey; uygulama yatay çevirmeyi ister, menü şeritte kaydırılır), 640×360 ve 1280×800'de en alttaki düğme ("Kuruluma dön") erişilebilir ve üstünde başka öğe yok (Playwright).
- **Özel canavar adı:** en fazla 50 karakter (`CUSTOM_NAME_MAX`, `app/limits.ts`): giriş alanı sınırlar, sayaç gösterir (TR/EN erişilebilir etiket), listeye eklerken de denetlenir. Özel canavarlar yalnızca o kurulumda tutulur; kayıtlı savaşlardaki adlar (savaşçı adı) kırpılmaz, `customMonster` uzun adı değiştirmez.
- **Ölü hedef:** hedef listesi (`attackChoices`) yalnızca erişime bakıyordu; 0 HP canavar (altıgende kalan, `life: alive`) ve ölü karakter kırmızı hedef olarak görünüyordu. Artık hedef olabilmek `isTargetable` (ayakta, yenilenmeyi bekleyen, ölmekte ya da stabil): baygın karakter (SRD Unconscious) hedef olabilir, ölü canavar ya da kaybolan çağrı olamaz. Seçili hedef ölünce işareti de kalkar.
- **Savaş sonu:** bu ekranda savaş bitince bir kez görsel efekt (`ui/EndFx.tsx`, tembel parça ≈0,7 kB: zaferde altın parıltı ve 26 konfeti, yenilgide kızıl karartma; yalnızca CSS dönüşüm/saydamlık, tıklamayı yutmaz, 3,6 sn'de kaybolur, hareket azaltmada konfeti yok) ve ezgi (efekt kanalı, `data/ses.json` `end`). Ana ses ya da efektler kapalıysa ezgi istenmez bile. Kayıttan yüklenen bitmiş savaşta oynamaz.
- **Ezgi dosyaları yer tutucu:** projede ses sentezi yok; ham sesler `assets-ham/ses/` altında (görevdeki "assets/ses" bu klasör sayıldı). `npm run ses:yer-tutucu` ffmpeg ile iki kısa ezgi üretir (`son-zafer`: majör arpej, `son-yenilgi`: inen minör; var olanın üstüne yazmaz). Gerçek ses aynı ASCII adla konup `npm run ses -- son-zafer son-yenilgi` çalıştırılır; `npm run ses` artık ad verilince yalnızca o dosyaları işler (diğer çıktılar ve kayıtları korunur). Yeni kategori `son-*`: bölünmez, tepe −1 dBFS.
- **Giriş müziği gecikmesi:** ses motoru eskiden ilk dokunuşta yükleniyor, menü müziğini (3 MB) o anda indirip çözüyordu. Artık motor sayfa açılınca (ayrı parça, ≈5,8 kB) yüklenir, sahnenin dosyalarını bağlamsız önyükler (`prefetch`), ve tarayıcı izin veriyorsa (otomatik oynatma serbest ya da site etkileşimi yüksek) dokunuşsuz başlar (`tryAutoStart`: bağlamı sürdürmeyi dener, 400 ms'de çalışmıyorsa bekler). Kısıt varsa ilk dokunuşta yalnızca çözme kalır. `check:ses`: kısıtlı tarayıcıda dokunuştan önce çalmıyor ama önyüklenmiş, serbest tarayıcıda dokunuşsuz çalıyor (headless kabuk bayrağı yok saydığı için kısıt sayfa içinde taklit edildi).
- Kayıt sürümü değişmedi (16).

## 2026-10-29 — Durum denetimi: Incapacitated, Stunned, Paralyzed (Görev H)

- **Kaynak SRD 5.2.1 Rules Glossary** (Incapacitated, Stunned, Paralyzed; karşılaştırma için Unconscious, Petrified). Durum tanımları `data/srd/` altında ayrı dosya değil; metin `docs/SRD_CC_v5.2.1.pdf`'ten okundu. Etkisiz bırakan durumların listesi `data/conditions.json` `incapacitating` (değişmedi).
- **Denetim sonucu:**

  | Kural | Önceden | Görev H |
  |---|---|---|
  | Incapacitated: eylem ve bonus eylem yok | vardı (`checkActor`) | aynı |
  | Incapacitated: tepki yok | vardı (`canReact`, fırsat saldırısı) | aynı |
  | Incapacitated: konsantrasyon kesilir | vardı (reducer; çağrılan yaratık kaybolur) | aynı |
  | Incapacitated: hareket | **yanlış**: her komut reddediliyordu | yürü, atla, kalk, yükseklik değiştir serbest (hızı 0 değilse) |
  | Incapacitated: inisiyatifte dezavantaj, konuşamaz | yok | uygulanmaz: savaş durumsuz başlar, konuşma sistemi yok |
  | Stunned: STR/DEX save otomatik başarısız, ona saldırılar avantajlı | vardı | aynı |
  | Paralyzed: STR/DEX save, avantaj | vardı | aynı |
  | Paralyzed (ve Unconscious, Petrified): hız 0 | dolaylı (her komut reddediliyordu) | `speedZero` (Grappled ve Restrained ile tek liste); `speedHexes` 0 |
  | Paralyzed/Unconscious: 5 ft içinden isabet kritik | **yanlış**: "yakın dövüş saldırısı" sayılıyordu | haritada bitişik altıgen (menzilli de kritik; 10 ft erişimli yakın dövüş kritik değil), haritasızda yakın dövüş |
  | Süre (1 tur, sonraki tura dek, kurtarma) | vardı (`conditionTimers`) | aynı; testler eklendi |
  | Rozet | yoktu (yalnızca kart listesi) | jetonda Paralyzed ⛓ / Stunned 💫 / Incapacitated ⊘ simgesi, TR/EN açıklama |
- **Hareket:** SRD 5.2.1'de Incapacitated ve Stunned hızı düşürmez ("can't take any action, Bonus Action, or Reaction"); bu yüzden oyuncu sersemlemiş karakteriyle yürüyebilir. Dash ve Disengage eylem olduğu için yine yok. Yapay zekâ etkisizken yürümeyi denemez, turunu bitirir (eskiden de hiçbir şey yapamıyordu; denge aynı kalsın diye).
- **Spiritual Weapon** saldırısı gücün hedefe bitişik altıgeninden yapıldığı için 5 ft içinde sayılır (eskisi gibi).
- Olay biçimi değişmedi: kayıt sürümü artmadı (16).

## 2026-10-28 — Koni ve çizgi alan şekilleri (Görev R4)

- **Kaynak SRD 5.2.1 "Area of Effect"** (s. 179 vd.): Cone — genişliği her noktada çıkıştan uzaklığına eşit, çıkış noktası alanda değil (yaratan istemedikçe); Line — uzunluk ve genişlik etkiden, çıkış dahil değil; Emanation — yaratıktan, yaratık dahil değil; Sphere — noktadan yarıçap; Cube — çıkış bir yüzde. 1 altıgen = 5 ft.
- **Koni geometrisi:** eskiden 30° yarım açı (15 ft koni 7 altıgen; ideal alan ≈ 5,2). Şimdi SRD genişliği: altıgen merkezinin yön eksenindeki izdüşümü p ∈ (0, L], eksene uzaklığı ≤ p/2 + 0,1 altıgen. 0,1 kenar payı her yönde ideale yakın sonuç veriyor (15 ft → 5, 30 ft → 17–22, 60 ft → 80–86; ideal 5,2 / 20,8 / 83). Eksenler arası yönde payısız 15 ft koni 3 altıgene düşüyordu. Burning Hands ve Fear da bu geometriyle küçüldü (7 → 5 altıgen).
- **Çizgi genişliği:** 5 ft tek şerit (altıgen çizgisi). 10 ft çizgi (Ancient dragon nefesleri) iki paralel şerit: ikinci şerit yöne en dik komşu yönde kaydırılmış; ızgarada 10 ft simetrik olamadığı için sağa kaydırılır (15 ft olsa sola da).
- **Ortak yol** (`src/battle/areaAttack.ts`): alan büyüleri, canavar alan saldırıları, Dragonborn Breath Weapon ve Draconic Spirit nefesi `pickArea` (menzil, görüş, siper; tam siper arkasındaki etkilenmez) ve `areaSaveEvents` ile. Hasar bir kez atılır (SRD: alanın hasarı bütün hedefler için aynı); her hedef ayrı save yapar, elle zarda her hedefin save'i ayrı istenir; başarıda yarım hasar; save başarısızsa canavar saldırısının süreli etkisi ve rider durumları; hasar alanın tepkisi (Hellish Rebuke) her hedeften sonra. Olay `area_used` (şekil, ölçü, nişan, altıgenler, etkilenenler) ardından hedef başına `save_resolved`.
- **Dost ateşi:** "each creature" alandaki herkes (canavarın kendi tarafı ve masumlar dahil), "each enemy" yalnızca düşmanlar. Büyülerin `area.targets` alanı aynı anlamda (Sleep ve Spirit Guardians yalnızca düşman).
- **Canavar verisi:** alan, saldırı metninden ayrıştırılır (`rules/areaParse.ts`): 86 saldırı (50 koni, 22 çizgi, 10 yayılım, 4 küre/silindir). Silindir yüksekliksiz küre sayıldı. Ayrıştırılamayan: Djinni Create Whirlwind (hareketli kasırga, Restrained) ve Gelatinous Cube Engulf (hareket) — alan değil, eskisi gibi. Young Red Dragon'un metni elle kısaltılmış olduğu için Fire Breath'e SRD'deki alan (`30 ft Cone`) veri olarak yazıldı; sayısal değer değişmedi. `monsters.json`'daki 64 eskimiş "alan şekli → tek hedef" bilgi notu kaldırıldı (istatistik değişmedi).
- **Dragonborn Breath Weapon** (SRD tür özelliği): Attack eyleminin bir saldırısının yerine, 15 ft koni ya da 30 ft × 5 ft çizgi, DEX save (DC 8 + CON + yetkinlik), 1d10 (5: 2d10, 11: 3d10, 17: 4d10), hasar türü Draconic Ancestry'nin direnci, yetkinlik bonusu kadar kullanım, uzun dinlenmede dolar (tür kaynağı `breathWeapon`). Draconic Flight yok. Tür özelliklerinin SRD kaydı için `npm run srd` artık `data/srd/species.json` da üretir (kimlik `species:dragonborn/breath-weapon`).
- **Cone of Cold** eklendi (5. seviye, 60 ft koni, CON, 8d8 cold); sim partilerinde 5. seviye slot yok, dengeye etkisi yok.
- **Draconic Spirit (Summon Dragon) nefesi** 30 ft koni (R3'te tek hedefti); Multiattack'ın içinde hedefin yönüne.
- **Yapay zekâ** (`bestAim`): yaratıktan çıkan koni/çizgide alanın boyu kadar uzaklıktaki her altıgen yön olarak denenir; dost vurmayan ve en çok görünen düşmanı kapsayan yön, eşitlikte daha küçük alan. Noktadan çıkan alanlar (Fireball, Acid Splash, canavarların noktada küresi) eskisi gibi yalnızca düşmanların altıgenine atılır.
- **Akıllı nokta hedeflemesi kapalı:** `bestAim`'in `anyPoint` seçeneği menzildeki her altıgeni dener (Fireball'u en çok düşmanı kapsayan boş altıgene atar). Açıkken standart parti 5. seviyede denge dışı güçlendi (Kale %80 → %97, Hazine odası %85 → %98, Taverna 8 masum %71 → %99). Kodda kaldı; ileride isteğe bağlı akıllı hedefleme olarak açılabilir. Denge ölçümleri bu yüzden eski davranışla yapıldı. Canavar: Recharge'lı nefes bir düşman için bile (eskisi gibi önce nefes), Recharge'sız alan saldırısı en az iki düşmanda; dost vuracaksa kullanmaz. Parti alan büyüsü ve Dragonborn nefesi en az iki düşmanda, dost vurmadan.
- **Arayüz:** "Nefes / alan" menüsü (canavarın alanlı saldırıları, Dragonborn nefesinin iki şekli), alan büyüleri aynı önizlemeyle: kaplanan altıgenler, alandaki düşman kırmızı, dost sarı kesikli halka, sayılar ve adlar, altı yön oku (44 px; yaratıktan çıkan alanda nişan harita dışında olabilir, yalnızca yön verir), onay. Balon alanın karşı kenarına yaslanır. Haritalı savaşta alanlı canavar saldırısı hedef seçeneklerinde yok (yanlışlıkla dost vurmasın).
- **SRD'den farklar:** silindir yüksekliği yok; "saldırılardan birinin yerine nefes" Multiattack seçenekleri (Chimera, metal ejderhalar) ayrı eylem olarak; koni ve çizginin çıkışı her zaman yaratığın altıgeninin merkezi (büyük yaratığın kenarından değil; çok altıgenlik yaratık yok).
- Kayıt sürümü 16 (3–16 yüklenir).
- **Denge:** 4 parti × 1/3/5 tam ölçüldü; ejderha senaryoları nefes konisiyle zorlaştı. 6 senaryo-seviye düşman listesiyle düzeltildi (3. seviye Volkan, Wyrmling, Orman ×2; 5. seviye Wyrmling, Young); ayrıntı `docs/harita/DENGE.md`.

## 2026-10-28 — Çağırma ve yoldaş (Görev R3)

- **Kaynak SRD 5.2.1.** SRD'de yaratık çağıran büyüler: Find Familiar (1, Wizard, ritüel), Find Steed (2, Paladin; Faithful Steed), Summon Dragon (5, Wizard). SRD'de başka "Summon …" büyüsü yok. 2024'te Conjure Animals / Elemental / Fey / Woodland Beings / Minor Elementals stat bloklu yaratık değil, yayılım/spektral etki; bu görevin dışında. Animate Dead (ceset ister) ve Animate Objects (5. seviye, nesne) yapılmadı. Wild Shape kapsam dışı (ayrı "biçim değiştirme" görevi; `druid:wild-shape` notu).
- **Model** (`src/battle/summons.ts`, `data/summons.json`): çağrılan yaratık sıradaki ayrı bir savaşçı (`summon`: sahip, büyü, seviye, seçim, bağlar). Sıradaki yeri veriden: `own` (familiar: "rolls its own Initiative") ya da `after-owner` (at ve ejderha ruhu: "shares your Initiative count"; ruh "takes its turn immediately after yours"). Sahibiyle aynı taraf ve aynı oyuncu (`ownerId`); düşman tarafının çağrısını Game Master yönetir (mevcut `canControl`).
- **Olaylar:** `summoned` yaratığı olduğu gibi taşır (replay bunu ekler) ve sıradaki yerini (`index`). `summon_vanished`: 0 HP (SRD: kaybolur, ölüm save'i yok), konsantrasyon (Summon Dragon), sahibin ölümü (Find Steed), süre (Summon Dragon 1 saat = 600 tur), yenisi (tek familiar, tek at, yeni ruh). Kaybolma `summonCleanup` ile her komuttan sonra olay olarak yazılır (yakalama temizliği gibi); kaybolan savaşçılarda kalır (`gone`; günlük adları), sırada atlanır, haritada ve sıra şeridinde görünmez.
- **Stat blokları** veride, büyü seviyesi formülüyle (base + perLevel × (seviye − fromLevel)); yukarı slotta slot seviyesi kullanılır (SRD "Use the spell slot's level for the spell's level in the stat block"; `upcast.applied`). Saldırı bonusu sahibinin büyü saldırısı, DC'si büyü DC'si, yetkinlik bonusu sahibininki. Otherworldly Steed: AC 10+L, HP 5+10L, 4+ seviyede uçuş, Slam 1d8+L (tür seçimiyle radiant/psychic/necrotic). Draconic Spirit: AC 14+L, HP 50+10(L−5), Rend ×⌊L/2⌋ (1d6+4+L, 10 ft) + nefes (DEX, 2d6 seçilen tür). Familiar: seçilen CR 0 hayvanın `monsters.json` bloğu, tür Celestial/Fey/Fiend, saldırısı yok.
- **SRD'den farklar (basitleştirme):** binek (mounted combat) yok, at sahibinin turunda değil hemen ardından oynar; Life Bond, Fell Glare, Fey Step, Healing Touch yok; Draconic Spirit'in Shared Resistances'ı, durum bağışıklıkları, Blindsight'ı ve yüzme hızı yok, nefes 30 ft koni yerine tek hedef (canavar nefesleriyle aynı kural); familiar'ın telepatisi, görüş paylaşımı, dokunma büyüsü taşıması ve cep boyutuna gönderme yok. Ritüel Find Familiar savaşta yapılmaz, yalnızca kurulumda (slotsuz). Çağrılmış yaratık tarafı ayakta tutmaz: bütün karakterler düşünce savaş biter (masumlar gibi).
- **Faithful Steed** kısmen: Find Steed her zaman hazır ve uzun dinlenmede yenilenen bir slotsuz kullanım (`faithfulSteed` kaynağı, `freeSpell`).
- **Yapay zekâ** çağırma büyüsü yapmaz (partiler aynı kalsın; çağrıyı oyuncu ya da Game Master yapar), çağrılanı basit oynar: canavar saldırıları, sahibine bitişik düşman önce, en yakın düşman; familiar dostla yakın dövüşteki düşmana Yardım, yoksa sahibinin yanında Kaçın. Arayüzde çağrılanın turunda "Yapay zekâ oynasın" düğmesi.
- **Arayüz:** büyü menüsünde çağırma kipi (menzildeki boş altıgenler vurgulanır; tür / nefes türü ve slot seçimi), kurulumda Find Familiar paneli (biçim, tür), kartta "Çağıran". Kayıt sürümü 15 (3–15 yüklenir).
- **Büyü eşitleme:** `srd-buyu-esitle.mjs` "1 hour or Ritual" süresini `ritual` yazar; eşitleme Magic Weapon'a `upcast.other` ekledi (yalnızca bilgi).

## 2026-10-24 — Süren etkiler ve zar eklentileri (Görev R2)

- **Kaynak SRD 5.2.1 (büyü metinleri `data/srd/spells.json`). Beklenen listenin doğrulaması:**
  - SRD'de var ve uygulandı: Bless, Bane, Guidance, Heroism, Resistance, Hunter's Mark, Hex, Searing Smite, Command, Aid.
  - Bane `spells.json`'da yoktu, eklendi (84 büyü).
  - 2024 farkları:
    - Guidance tek kullanımlık değil: konsantrasyon (1 dakika), seçilen beceriyle yapılan her kontrole +1d4.
    - Resistance save'e değil hasara: seçilen türde hasarı turda bir kez 1d4 azaltır (konsantrasyon).
    - Searing Smite konsantrasyon değil (1 dakika): her tur başında 1d6 fire, ardından CON save, başarıda biter.
  - Tek kullanımlık zar eklentisi altyapıda var (`dice.single`; ilk kullanımda biter). SRD'nin bu dört büyüsünde kullanan yok.
- **Etki modeli** (`Combatant.effects`; `src/battle/effects.ts`, `effectDice.ts`): her etki kaynak (büyücü), kimlik (SRD büyü kimliği), bitiş turu (`until`; 1 dakika = 10 tur) ve konsantrasyon bağı taşır.
  - Zar eklentisi `dice`: ±zar; saldırı, save ya da kontrol; beceri seçimi.
  - Diğer etkiler: hasar azaltma `reduce` (turda bir), her tur başı geçici HP `tempHp`, bağışıklık `immune`, süregelen hasar `ongoing` (tur başında zar, sonra save), tur kaybı `command`.
  - Bitiş reducer'da (`pruneEffects`), her olaydan sonra: süre geçti, kaynağın o büyüdeki konsantrasyonu bitti, taşıyan öldü ya da düşman 0 HP'ye indi. Aynı büyücü büyüyü yeniden yapınca eski hedeflerdeki etki biter.
- **Zar eklentisi akışı:**
  - `rules/attack.ts` `ExtraDie`: d20'den sonra atılır, toplama eklenir; doğal 20/1 değişmez. Olaylarda `bonusDice` (etiket ve işaretli değer) günlükte görünür.
  - Elle zar modunda eklenti zarı da istenir (d20'den sonra, aynı tür ve aynı atan).
  - Uygulandığı yerler: bütün saldırılar (silah, canavar, büyü, Spiritual Weapon) ve save'ler (büyü, canavar, süreli durum, ustalık, itme, yakalama, tepki, harita kuralı, konsantrasyon). Kontroller: beceri kontrolü, gizlenme, arama, yakalamadan kaçış, harita kontrolleri.
  - Ölüm save'lerine Bless eklenmiyor (kısmen).
- **Geçici HP:** `damageEffects` içinde hasardan önce harcanır (`temp_absorbed`). Yığılmaz, yüksek olan kalır. Konsantrasyon DC'si alınan hasarın tamamıyla.
- **Büyüler:**
  - Bless / Bane: 3 hedef (slot başına +1). Bane'de CHA save, başarısızsa −1d4.
  - Heroism: dokunuş, slot başına +1 hedef. Her tur başı büyü modifier'ı kadar geçici HP, Frightened bağışıklığı (durum eklenmez).
  - Aid: 3 dost, en çok HP ve HP +5 (slot başına +5); 8 saat sürdüğü için etki listesine girmez, savaş sonunda en çok HP'de kalır.
  - Command (kısmen): WIS save; Grovel (yere düşer, turunu kaybeder) ve Halt (turunu kaybeder). Approach, Drop, Flee yok: yönlü zorunlu hareket ve eşya bırakma modellenmedi.
  - Hex: Hunter's Mark gibi işaret (`kind: mark`), +1d6 necrotic, taşınabilir. Seçilen yeteneğin kontrollerinde dezavantaj yok (kısmen; savaşta kontrol az).
  - Searing Smite: isabette 1d6 (yukarı slotla artar), sonra süregelen hasar ve CON save; yukarı slot süregelen zarı da artırır (SRD "All the damage").
- **Yapay zekâ (basit):**
  - Bless'i (veriden: dostlara saldırı zarı eklentisi veren etki büyüsü) eylemi duruyorsa, konsantre değilse ve sürdürülen konsantrasyon büyüsü (Spirit Guardians, Spiritual Weapon) yoksa menzildeki dostlara yapar.
  - Hex ve Hunter's Mark işaret kuralıyla (saldırabilecekken). Searing Smite smite kuralıyla.
  - Konsantrasyondayken yeni konsantrasyon büyüsü yapmaz (konsantrasyonu bozmaz).
- **Arayüz:**
  - Jetonda etki simgeleri (✨ Bless, ⛓ Bane, 🦁 Heroism, 🔥 Searing Smite, 🎯 işaret, 💠 geçici HP).
  - Kartta "Etkiler" listesi: kaynak, kalan tur ya da konsantrasyon; tıklayınca açıklama.
  - Etki büyüsünde çoklu hedef kipi: hedefler jetonlara tıklayarak seçilir (sarı halka). Seçim (beceri, hasar türü, komut) ve slot baloncukta.
- **Denge:**
  - Dört parti 1/3/5. seviyede tam ölçüldü. Yalnızca Paladin partisi değişti (Aria'nın Bless'i).
  - Volkan 3. seviyeye Steam Mephit eklendi (3 deneme). Paladin %90 → 81; standart %74 → 55, sınırda.
  - Ayrıntı `docs/harita/DENGE.md`.
- **Kayıt sürümü 14** (3–14 yüklenir).

## 2026-10-24 — Tepki sistemi (Görev R1)

- **Kaynak SRD 5.2.1.** Tepki: turda bir; kendi turunun başında yenilenir. Aksiyon yapamayan (Incapacitated) tepki veremez.
  - SRD'deki tepki büyüleri (hepsi 1–3. seviye): Shield, Counterspell, Hellish Rebuke, Feather Fall. Feather Fall `spells.json`'a eklendi (83 büyü).
  - SRD'deki tepkili sınıf özellikleri: Deflect Attacks, Slow Fall (Monk), Uncanny Dodge (Rogue 5), Retaliation (Berserker 10), Superior Hunter's Defense (Hunter 15), Countercharm (Bard 7), Cutting Words (Lore 3).
  - SRD 5.2.1'de olmayan Absorb Elements, Protection/Interception (Fighting Style) ve Sentinel eklenmedi.
- **Ekonomi tek yerde** (`src/battle/reactions.ts`): `canReact` ve `reactionUsed` (`reaction_used` olayı). Fırsat saldırısı, Deflect Attacks ve Slow Fall da bunu kullanır. Eski kayıtların `action_used` (fırsat saldırısı) ve `deflected` alanı reducer'da okunmaya devam eder.
- **Karar akışı:** zar isteme kalıbıyla aynı.
  - Motor tetikte `askReaction(rng, istek)` çağırır. İstekte tepkiyi verecek yaratık, tetik, seçenekler (hedef ya da slot seviyesi seçimi) ve kural tabanlı öneri (yapay zekâ) var.
  - Rng'deki karar kancası (`rules/reactionChoice.ts`, `dice.ts` `rollTag` iletir) kararı verir. Arayüzün kaydedici Rng'si kararı zar defterine yazar; oyuncuya sorulacaksa `NeedReaction` fırlatır, karar girilince adım aynı zarlarla baştan çalışır (`runStep`, `enterReaction`).
  - Kancasız Rng'de (simülasyon, testler) öneri uygulanır. Kararın sonucu olaylara yazılır; replay aynı durumu verir.
  - Hasar zarları karar sorulmadan önce atılır: oyuncu Shield/Uncanny Dodge/Deflect'i hasarı görerek seçer (SRD'de tepki "isabet edince"; masa düzeninde yaygın kullanım).
- **Ayar ("hızlı mod"):** oyuncu tepkileri Sor (varsayılan) / Her zaman / Asla; Game Master'ın düşmanları Yapay zekâ (varsayılan) / Her zaman / Asla. Savaş menüsünde, cihazda hatırlanır. "Her zaman" öneriyi, öneri yoksa ilk seçeneği kullanır.
- **Yapay zekâ önerisi (kural tabanlı):**
  - Fırsat saldırısı: her zaman (eski davranış).
  - Shield/Parry: yalnızca isabeti ıskaya çevirecekse; önce bedava olan (Parry).
  - Deflect Attacks, Deflect Missile: her isabette. Geri yöneltme: Focus varsa, saldırana (yoksa ilk uygun hedefe).
  - Uncanny Dodge, Superior Hunter's Defense: hasar en az 5 ve kalan HP'nin üçte biri ya da öldürecekse.
  - Counterspell: slotlu büyülere (cantrip'e değil). Hellish Rebuke, Retaliation: her zaman, en düşük slot.
  - Slow Fall her düşmede; Feather Fall 20 ft ve üstü düşmede.
- **Tepkiler ve sınırlar:**
  - Shield: +5 AC (tetikleyen saldırı dahil) sonraki turunun başına dek (`marks` `shield`); Magic Missile'ın hasarını keser (`blocks`). Kritik vuruş AC'yle ıskalatılamaz, bu yüzden sorulmaz.
  - Counterspell: büyücü CON save (karşı büyücünün DC'si); başarısızsa büyü boşa gider, eylemi harcanır, slotu harcanmaz. Geçersiz komut boşa durdurulmasın diye büyü önce zarsız denenir. Canavarlar büyü yapmadığı için oyuncunun Counterspell'i yalnızca büyü yapan karakter düşmana karşı (sıkı kurulum) tetiklenir; asıl kullanım Mage/Archmage/Lich'in Protective Magic'i.
  - Hellish Rebuke: saldırı ve büyü hasarında (60 ft, görülen). Spirit Guardians, ustalık (Graze) ve harita hasarında tetiklenmez (kısmen).
  - Deflect Attacks: hasarın tamamını (ek hasarlar dahil, SRD "total damage") azaltır; 0'a inerse 1 Focus ile geri yöneltme (DEX save, Monk DC'si, iki Martial Arts zarı + DEX).
  - Slow Fall ve Feather Fall: zorunlu hareketle düşmede (itilme, uçurum). Feather Fall'ı düşen ya da 60 ft içindeki dostu yapar; yalnızca düşeni korur (SRD: 5 yaratık).
  - Superior Hunter's Defense (kısmen): yalnızca saldırı isabetinde, o saldırının hasarı yarıya iner; tur sonuna dek süren direnç yok.
  - Countercharm ve Cutting Words `none`: tetikleri (save sonrası, kontrol/zar sonrası) motorda tek noktadan geçmiyor; Bardic Inspiration yok.
- **Canavar tepkileri** (`data/monster-reactions.json`; 24 tepki): 15'i çalışıyor, 9'u `none` ve nedenli.
  - Parry ×7 (+2…+5, yalnızca yakın dövüş; "silah tutarken" koşulu her zaman sağlanmış sayılır), Riposte (ıskada Rapier saldırısı).
  - Protective Magic: Mage/Archmage (3/Day havuz, `reactionUses`), Lich (sınırsız); Shield ya da Counterspell, DC canavar bloğundan.
  - Unnerving Gaze: tur başında; başarılı save'de bu savaş boyunca bağışık (SRD 24 saat).
  - Kısmen: Whirlwind of Sand (yalnızca AC +2; ışınlanma yok), Deflect Missile (Recharge 5–6, `reactionSpent`; geri yöneltme yok), Redirect Attack (yalnızca silah saldırılarında yer değiştirme, `swapped` olayı).
  - `none`: Split ×2 (yaratık doğurma yok), Ink Cloud ×2 (karartılmış alan yok), Pursuit (Teleport yok), Shriek (mekanik etkisi yok), Reflexive Antennae (Antennae yok), Burst of Ingenuity (kontrol/save sonrası tetik yok), Protection (muska sahibi yok).
- **Retaliation, Riposte** gibi saldırı yapan tepkiler saldırıyı `registerStrikes` ile alır (silah ve canavar saldırı modülleri `reactions.ts`'i içe aktarır; ters yön döngü yaratırdı).
- **Kimlik:** tepki kimlikleri SRD kimliği (`spells:shield`, `rogue:uncanny-dodge`, `monk:deflect-attacks`); canavar tepkisi `<canavar>:<tepki>`. Fırsat saldırısı `opportunity-attack`.
- **Kayıt sürümü 13** (3–13 yüklenir): `reaction_used`, `reaction_recharged`, `swapped`, `attack_resolved.reacted`.
- **Denge:** dört parti 1/3/5. seviyede tam ölçüldü. Uncanny Dodge (Sela, 5. seviye) ve Parry 5. seviyede kaymaya yol açtı. 7 senaryo-seviyede düşman listesi değişti (3 deneme; Volkan şans denendi, geri alındı). Ayrıntı `docs/harita/DENGE.md`.
- **Arayüz:** tepki istemi (Evet/Hayır; slot ya da hedef seçimi ayrı düğme; öneri vurgulu), sırası olmayan oyuncu için de. Karakter kartında "Tepki: hazır/kullanıldı" ve tepki listesi. Tepki büyüleri büyü menüsünde yok (tetikte sorulur). Yapay zekâ tepki büyülerini kendi turunda atmaz.

## 2026-10-24 — Monk 1–5 (Görev P-Monk)

- **Kaynak SRD 5.2.1** (Monk, Warrior of the Open Hand).
  - 1–5. seviye özellikleri: Martial Arts, Unarmored Defense (1); Monk's Focus (Flurry of Blows, Patient Defense, Step of the Wind), Unarmored Movement, Uncanny Metabolism (2); Deflect Attacks, alt sınıf (3); ASI, Slow Fall (4); Extra Attack, Stunning Strike (5).
  - Open Hand Technique 3. seviyede.
  - Hafızadaki listeyle aynı. Farklar ayrıntıda:
    - Deflect Attacks 3. seviyede ve yalnızca B/P/S hasarında.
    - Patient Defense ve Step of the Wind'in Focus'suz hâli var (bonus eylemle Disengage / Dash).
    - Stunning Strike'ın başarılı save'inde de etki var (hız yarılanır, sonraki saldırı avantajlı).
    - Monk'ta Weapon Mastery yok.
- **Veriden** (`data/class-features.json`), kodda sınıf adı yok. Yeni mekanik alanlar:
  - `martialArts` (Monk silahları, bonus vuruş; zar SRD sütunu).
  - `focusActions` (Focus eylemleri), `metabolism`, `deflect`, `fallReduction`, `stunningStrike`, `openHand`.
  - Focus Points mevcut kaynak modelinde (`focus`, kısa dinlenmede dolar).
- **Martial Arts:**
  - Zırhsız ve kalkansızken geçerli. Unarmed Strike seçeneği: zar Martial Arts zarı, yetenek DEX ya da STR.
  - Monk silahlarında (basit yakın dövüş, Light martial yakın dövüş) zar büyükse Martial Arts zarı, DEX ya da STR.
  - Bonus vuruş `bonus_strike` komutuyla: yan el saldırısıyla aynı düzenek (`weaponAttackEvents`); Attack eylemi gerektirmez (SRD 2024).
  - Basitleştirme: öbür karakterlerin 1 + STR silahsız vuruşu oyunda yok; Unarmed Strike yalnızca Martial Arts'la seçenek.
- **Monk's Focus:**
  - Flurry of Blows: 1 Focus, bonus eylem, sonra iki bedava vuruş (`economy.flurryLeft`; vuruşlar ayrı hedefe gidebilir).
  - Patient Defense: Disengage + Dodge. Step of the Wind: Disengage + Dash.
  - Focus'suz bonus Dash/Disengage Cunning Action gibi (`grants`).
  - Step of the Wind'in atlama ikilemesi yok.
- **Uncanny Metabolism:** savaş başında (`start_battle`, inisiyatif) Focus eksikse ya da yaralıysa kullanılır. Focus dolar, Martial Arts zarı + seviye HP; uzun dinlenmede bir kez.
- **Deflect Attacks (kısmen):**
  - Canavar saldırısının B/P/S hasarlı isabetinde, tepki duruyorsa kendiliğinden kullanılır: hasar 1d10 + DEX + seviye azalır.
  - Hasar 0'a inince Focus ile geri yöneltme yok: hedef seçen bir tepki akışı gerekir, bu görevin kapsamı dışında.
- **Slow Fall (kısmen):** düşme hasarı 5 × seviye azalır; tepki harcanmaz (düşme kendiliğinden çözülür).
- **Stunning Strike:**
  - Bu tur Monk silahı ya da Unarmed Strike ile vurulan hedefe, turda bir kez, 1 Focus. CON save, DC 8 + WIS + yetkinlik.
  - Başarısızsa Monk'un sonraki turunun başına dek Stunned.
  - Başarılıysa ona sonraki saldırı avantajlı (Yardım işareti). Hız yarılanması yok (kısmen).
- **Open Hand Technique:** Flurry vuruşu isabet edince Addle (fırsat saldırısı yok, hedefin sonraki turunun başına dek), Push (STR save, 15 ft) ya da Topple (DEX save, Prone). Arayüz ve yapay zekâ Topple seçer; komut üçünü de alır.
- **Ortak kod (guard'lı):** fırsat saldırısı (Addled), canavar saldırısı (Deflect), düşme hasarı (Slow Fall), savaş başı (Uncanny Metabolism), silah seçeneği (Martial Arts). Eski partiler tam ölçüldü (`docs/harita/DENGE.md`).
- **Yapay zekâ (basit):**
  - Monk silahı isabetinden sonra Stunning Strike (hedef 15 HP'den fazlaysa ya da kritikse).
  - Attack eylemi bitince Focus varsa Flurry of Blows (Topple), yoksa bonus Unarmed Strike.
  - Patient Defense ve Step of the Wind'i yapay zekâ kullanmaz.
- **Kayıt sürümü 12** (3–12 yüklenir).
- **Denge:** Monk partisi (`--parti monk`, Bor yerine Lin) 1/3/5. seviyede ölçüldü; 13 senaryo-seviyede düşman listesi değişti (3 deneme, standart parti aralıkta kaldı). Aralık dışı kalanlar: Volkan 5 (%89), Volkan Adult/Ancient 1 (%58), Volkan Young 3 (%57), Taverna ortada 5 (%86). Eski partilerin tam regresyonu birebir aynı. Ayrıntı `docs/harita/DENGE.md`.

## 2026-10-24 — Paladin 1–5 ve alt sınıf düzeltmesi (Görev P-Paladin)

- **Kaynak SRD 5.2.1** (Paladin, s. 52–57; Oath of Devotion s. 56).
  - 1–5. seviye özellikleri: Lay On Hands, Spellcasting, Weapon Mastery (1); Fighting Style, Paladin's Smite (2); Channel Divinity, alt sınıf (3); ASI (4); Extra Attack, Faithful Steed (5).
  - Oath of Devotion (3): Oath of Devotion Spells, Sacred Weapon.
  - Hafızadaki listeyle aynı. Farklar ayrıntıda:
    - Divine Smite 2024'te bir büyü: yakın dövüş isabetinden sonra bonus eylemle yapılır. Paladin's Smite onu her zaman hazır tutar ve uzun dinlenmede bir kez slotsuz yaptırır.
    - Channel Divinity 3. seviyede gelir (2 kullanım). Sınıfın kendi etkisi Divine Sense; Sacred Weapon alt sınıftan gelir.
    - Faithful Steed, Find Steed büyüsünü her zaman hazır tutar ve uzun dinlenmede bir kez slotsuz yaptırır.
- **Veriden** (`data/class-features.json`), kodda sınıf adı yok. Yeni mekanik alanlar:
  - `effect`: savaşta `use_feature` komutuyla kullanılan özellik (iyileştirme havuzu ya da güçlendirme).
  - `alwaysPrepared`: seviye → her zaman hazır büyüler.
  - `alternatives`: Fighting Style yuvasında feat yerine seçenek (Blessed Warrior: 2 Cleric cantrip'i, CHA ile).
  - `when: attackAction`: Attack eylemiyle kullanılan özellik.
  - Kaynaklar: Lay On Hands (`layOnHands`, 5 × seviye), Channel Divinity (mevcut kaynak, SRD sütunu), yeni `paladinsSmite` (1, uzun dinlenme, `freeSpell: Divine Smite`).
- **Uygulama:**
  - **Lay On Hands:** bonus eylem, dokunuş (kendisi ya da bitişik). Havuzdan istenen kadar HP. 5 puanla Poisoned kalkar.
  - **Divine Smite:** bu tur yakın dövüş silahıyla vurulan hedefe 2d8 Radiant. Her yukarı slot +1d8; Fiend ve Undead +1d8. Vuruş kritikse zarlar iki kat.
  - **Sacred Weapon:** eylemsiz, Attack eylemiyle; Channel Divinity harcar. Yakın dövüş silah saldırılarına CHA (en az +1). Hedef silahın türüne dirençli ya da bağışıksa hasar Radiant olur.
  - **Yemin büyüleri:** 3. seviyede Protection from Evil and Good ve Shield of Faith, 5. seviyede Aid ve Zone of Truth. Her zaman hazır, hazır büyü sayısına girmez.
- **Kısmen çalışanlar:**
  - Channel Divinity: Divine Sense savaşta etkisiz (algılama yok).
  - Sacred Weapon: ışık yayma yok.
- **Çalışmayanlar:** Faithful Steed (çağrılan yaratık yok, "çalışmıyor" işaretli).
- **Paladin büyüleri (1–2):**
  - Çalışanlar:
    - Divine Smite, Divine Favor (+1d4 radiant), Shield of Faith (konsantrasyon hedefine +2 AC).
    - Shining Smite (hasar; konsantrasyon boyunca hedefe saldırılar avantajlı).
    - Protection from Evil and Good (Aberration, Celestial, Elemental, Fey, Fiend ve Undead saldırıları dezavantajlı).
    - Magic Weapon (+1).
    - Searing Smite: yalnızca isabet hasarı; sonraki turlardaki yanma yok.
    - Cure Wounds zaten vardı.
  - "Oyunda henüz çalışmıyor" işaretliler: Bless, Command, Heroism, Aid, Lesser Restoration, Zone of Truth, Find Steed.
  - Veride olmayanlar: Detect* büyüleri, Purify Food and Drink, Gentle Repose, Locate Object, Prayer of Healing, Protection from Poison, Warding Bond. Savaş dışı oldukları için eklenmedi.
- **Ortak motor değişikliği:**
  - Hedefin AC'si ve saldırı kaynakları konsantrasyon korumalarına bakıyor (`effectiveAc`, `wardSources`): silah, canavar ve büyü saldırılarında.
  - Silah saldırısı süren güçlendirmeleri uyguluyor (`buffs`).
  - Yakın dövüş isabeti `economy.meleeHit`'e yazılıyor.
  - Eski partilerin tam ölçümü B2 ile birebir aynı çıktı.
- **Yaratık türü:** `data/canavar-turleri.json`. SRD stat block satırından 263 canavar; 67'sinin satırı PDF metninden okunamadı, onlar `monster-ortamlari.json` temasından (`temadan` listesi).
- **Alt sınıf (tüm sınıflar):**
  - Motor alt sınıf boşken varsayılan vermiyor; alt sınıf özelliği uygulanmaz.
  - Oluşturucu 3. seviye ve üstünde alt sınıf seçmeden kaydetmez.
  - Eski kayıtlı karakterlerde boş alt sınıfa SRD'deki tek alt sınıf atanır ve ekranda bildirilir.
  - Kayıtlı savaşlar etkilenmez: savaşçı kurulmuş olarak olaylarda durur.
- **Yapay zekâ (basit):**
  - Yanındaki düşmüş dostu Lay On Hands ile yarı HP'sine dek kaldırır; kendi HP'si üçte birin altındaysa kendini iyileştirir.
  - Yakın dövüş isabetinden sonra slotsuz Divine Smite'ı hep, slotlu olanı kritikte ya da hedef 10 HP'den fazlaysa yapar.
  - Saldırmadan önce, yakında düşman varsa Sacred Weapon.
  - Divine Favor, Shield of Faith ve Magic Weapon'ı yapay zekâ kullanmaz.
- **Kayıt sürümü 11** (`use_feature`, `buff_added`, `attack_resolved.melee`; 3–11 yüklenir).

## 2026-10-24 — Simülasyon partileri tamamlandı (Görev B2)

- **Partiler SRD'ye göre eksiksiz** (`data/sim-partiler.json`, kod değişmedi):
  - Alt sınıf: Champion, Evoker, Life Domain, Thief, Hunter, Berserker.
  - Köken feat'i: Savage Attacker, Magic Initiate, Alert. SRD geçmişine göre seçildi; uygulananı tercih edildi.
  - 4. seviye ASI (ana skor +2).
  - SRD tablosu kadar cantrip ve hazır büyü; Scholar uzmanlığı.
  - Test her seviyede denetliyor.
- **Frenzy düzeltmesi:**
  - B1'deki "Frenzy çalışmıyor" yanlıştı: `gainedFeatures` alt sınıf seçilmemişse SRD'nin tek alt sınıfını kullanır.
  - Sayaç testi eklendi.
  - Not: oluşturucuda alt sınıf boş bırakılan her karakter de aynı biçimde varsayılan alt sınıfın özelliklerini alır.
- **Veride çözülemeyenler:** Divine Order seçimi (Protector varsayılıyor), Deft Explorer uzmanlığı, insanın ikinci köken feat'i. Savage Attacker, Magic Initiate ve Frenzy dışındaki alt sınıf özelliklerinin etkisi yok.
- **Denge:**
  - Parti güçlenince 13 senaryo/seviye aralık dışına çıktı; düşman listeleri değiştirildi (en çok 3 deneme). Standart partide 57 ölçümün hepsi aralıkta.
  - Haritadaki düşman yeri sınırı (Taverna 9, Merdiven ve Hazine 12) yüzünden sayı yerine canavar değişti.
  - Barbarian partisi şişirilmedi; zayıf ve güçlü yerleri `docs/harita/DENGE.md`'de.

## 2026-10-23 — Seviyeli senaryolar ve gerçek 1/3/5. seviye partiler (Görev B1)

- **Partiler veride** (`data/sim-partiler.json`):
  - `members`: üye başına 5. seviye sheet ve `levels.<N>` (o seviyede sheet'in üstüne yazılan alanlar).
  - `parties`: üye listeleri (standart, barbar, yanel).
  - Tanımsız seviyede (8, 11…) 5. seviye sheet'inden üretilir: seçilemeyen büyüler, gelmemiş yuvalar ve hakkı aşan ustalıklar kesilir.
  - Yeni sınıf partisi: üye ve parti eklenir, kod değişmez.
- **1. ve 3. seviye seçimleri:**
  - Büyüler SRD tablosundaki cantrip ve hazır büyü sayısı kadar; oyunda çalışan, savaşta işe yarayan büyülerden.
  - Skorlar aynı (ilk ASI 4. seviyede).
  - Donanım SRD başlangıç altınıyla alınabilir (ayrıntı veri dosyasının notlarında).
- **5. seviye partisi bilerek değiştirilmedi** (sonuçlar birebir aynı kalsın diye). Kalan eksikler:
  - Mira 2 cantrip (tablo 4), hazır büyüleri tablodan az.
  - 4. seviye ASI yuvaları boş.
  - Alt sınıf yok. (Görev B2 düzeltmesi: Frenzy yine de çalışıyordu, motor varsayılan alt sınıfı kullanıyor.)
  - Öneri: ayrı görevde 5. seviye partisi tamamlanıp yeniden ölçülsün.
- **Senaryolar veride** (`data/sim-senaryolar.json`):
  - Her senaryoda `enemies.<seviye>`: 1, 3, 5. 8, 11 gibi seviyeler anahtar olarak eklenir.
  - 1. ve 3. seviye listeleri haritanın ortam listesinden; test denetler.
  - Her listenin başlangıç bölgesine sığdığı test ediliyor.
  - Uyuyan ejderha senaryolarında ejderha her seviyede aynı; seviyeye göre yalnızca eşlik edenler değişir.
- **Paralel simülasyon:**
  - `npm run sim` senaryoları ayrı süreçlerde çalıştırır (`scripts/sim-paralel.mjs`, `--is N`); tablo `sim-sonuc/` altına da yazılır (git dışı).
  - `npm run sim:tek` eski tek süreçli çalıştırma.
  - Hatalı senaryo tabloyu düşürmez, satırına HATA yazılır.
- **Denge:**
  - Standart partide 57 senaryo/seviye ölçümünden 56'sı aralıkta.
  - Aralık dışı: 3. seviye Adult/Ancient %59 (3 deneme bitti).
  - Barbarian partisi şişirilmedi; zayıf yerleri `docs/harita/DENGE.md`'de.

## 2026-10-23 — Yan el, Nick, Two-Weapon Fighting, Versatile (Görev P1)

- **Kaynak SRD 5.2.1** (Weapons: Light, Versatile, Two-Handed, Nick; Feats: Two-Weapon Fighting). Silah verisindeki `light`, `twoHanded`, `versatileDamage` SRD silah tablosuyla karşılaştırıldı, fark yok.
- **Eller** (`src/rules/hands.ts`): karakterde `offHand` (yan el silahı). Geçerli olması için:
  - Silah taşınıyor ve Light.
  - Kalkan yok.
  - Two-Handed yakın dövüş silahı taşınmıyor.
  - Ana elde kullanılacak, yan eldekinden farklı bir Light silah var.
  - Oluşturucu geçersiz seçenekleri kapalı gösterir, nedenini yazar; kalkan ya da iki elli silah eklenince yan el seçimi düşer.
- **Basitleştirmeler:**
  - Elde silah değiştirme (Interact, Equipping and Unequipping Weapons) yok. Two-Handed menzilli silah (yay, arbalet) yan eli engellemez: SRD'de saldırıyla birlikte çekilip kaldırılabilir; okçu yakına gelince çift silaha geçer.
  - Two-Handed yakın dövüş silahı (Greatsword, Greataxe…) taşınıyorsa yan el seçilemez: karakterin "ana silahı" belirsizleşir.
  - Aynı silahtan iki tane taşınamaz (silah listesi ad bazlı); yan el ana el Light silahından farklı olmalı.
- **Light ek saldırısı:**
  - Attack eyleminde, yan el silahı dışındaki bir Light silahla saldırı (`action_used.light`) `economy.lightAttack` açar.
  - `offhand_attack` komutu bonus eylem harcar, turda bir kez (`offhandUsed`).
  - Hasara yetenek değiştiricisi eklenmez, negatifse eklenir. Saldırı zarı, Sneak Attack ve silahın ustalığı normal saldırı gibi.
- **Nick:**
  - Yan el silahının ustalığı Nick ise ve karakter o silahın ustalığını seçtiyse (`nickOffhand`), ek saldırı Attack eyleminin içinde yapılır: bonus eylem boş kalır, turda yine bir kez.
  - SRD "Attack eyleminin parçası" diyor; motor ek saldırıyı Light saldırısından sonra turun herhangi bir anında kabul eder.
- **Two-Weapon Fighting:** feat verisinde `offhandModifier`; yan el hasarına yetenek değiştiricisi eklenir.
- **Versatile:**
  - Diğer el boşsa (kalkan yok, geçerli yan el silahı yok) yakın dövüşte iki elle, parantezdeki zarla vurur.
  - Fırlatma tek elle (normal zar). Great Weapon Fighting iki elle tutulan Versatile'da da geçerli.
  - Oluşturucu özetinde ve savaş seçeneklerinde "(iki elle)" yazar.
  - Bor (kalkanlı) ve Tavi değişmedi. Mira'nın Quarterstaff'ı 1d6 yerine 1d8 oldu.
- **Yapay zekâ:**
  - Yan el silahı olan birim, ek saldırının ortalama hasarını Light seçeneklerin puanına ekler, böylece Light silahı seçmeye eğilimli olur.
  - Nick'te ilk Light saldırının hemen ardından yan el saldırısını yapar. Nick yoksa eylem bittiğinde ve bonus eylem boşsa yapar.
  - Hedef sırası normal saldırıyla aynıdır (`byPriority`).
- **Kayıt sürümü 10** (`action_used.light`/`offhand`, ekonomide yeni alanlar). 3–10 yüklenir.
- **Simülasyon:** `--parti yanel` eklendi: Sela, Rapier yerine Shortsword (Vex) ile yan elde Dagger (Nick) kullanır. Standart parti değişmedi. Sonuçlar `docs/harita/DENGE.md`'de.

## 2026-10-23 — Barbarian 1–5 (Görev P-Barbarian)

- **Kaynak SRD 5.2.1.** Barbarian 1–5: Rage, Unarmored Defense, Weapon Mastery (1); Danger Sense, Reckless Attack (2); Primal Knowledge, alt sınıf (3); ASI (4); Extra Attack, Fast Movement (5). Path of the Berserker 3. seviyede Frenzy verir; alt sınıfın 5. seviye özelliği yok (Mindless Rage 6).
- **Veriden:**
  - `data/class-features.json`'da yeni girdiler: `rage` (direnç, hasar sütunu "Rage Damage", STR avantajı), `stat: saveAdvantage` (Danger Sense), `command: reckless`, `stat: classSkills` + `skills` (Primal Knowledge), `stat: frenzy`.
  - Kodda sınıf adı yok. Rage kaynağı SRD'ye göre yenilenir: kısa dinlenmede 1, uzun dinlenmede hepsi (görevdeki "uzun dinlenmede" ifadesi SRD'yle birlikte geçerli).
- **Rage:**
  - Bonus eylemle başlar; ağır zırhla başlatılamaz. B/P/S direnci eklenir; Rage bitince yalnızca Rage'in eklediği direnç kalkar.
  - STR saldırısının hasarına Rage hasarı eklenir (isabette).
  - STR save'leri ve Athletics avantajlı. Büyü yapılamaz, konsantrasyon biter.
  - Süre: sonraki turunun sonuna dek. O tur düşmana saldırı zarı atmak, düşmana save yaptırmak (Shove, Topple) ya da bonus eylem ("Öfkeyi sürdür") Rage'i uzatır; uzatılmazsa tur sonunda biter. Incapacitated olunca ya da 0 HP'de biter.
- **Reckless Attack:** turun ilk saldırısından önce seçilen eylemsiz komut ("Pervasız"). Sonraki turunun başına dek kendi STR saldırıları avantajlı, ona yapılan saldırılar avantajlı (işaret `reckless`, Weapon Mastery işaretleriyle aynı düzenek).
- **Danger Sense:** DEX save'leri avantajlı (Incapacitated değilken). `saveMode` artık durum listesi yerine savaşçıyı alıyor.
- **Primal Knowledge (kısmen):**
  - 3. seviyede bir sınıf becerisi daha seçilir.
  - Rage sürerken Acrobatics, Intimidation, Perception, Stealth ve Survival kontrolleri, STR daha iyiyse STR ile yapılır ve Strength avantajını alır (Gizlen, Ara, harita kontrolleri).
  - Intimidation ve Survival savaşta kullanılmıyor.
- **Frenzy:** Rage + kendi Reckless işareti, kendi turunda STR saldırısıyla ilk isabete Rage hasarı kadar d6 (turda bir kez).
- **Yapay zekâ (basit kural):**
  - Rage: yaralıysa ya da 10 ft içinde düşman varsa; eylemi bitmiş ve Rage o tur uzamamışsa bonus eylemle uzatır.
  - Reckless: HP yarıdan fazlaysa ve en iyi seçenek STR ile silah saldırısıysa.
- **Kayıt sürümü 9** (Rage olayları; 3–9 yüklenir).
- **Simülasyon:** `--parti barbar`, Bor yerine Grum (AC 14).
  - Dört senaryoya 1. ve 3. seviye için `byLevel` listesi eklendi.
  - Düşman listesi düzeltmeleri: Volkan, Merdiven, Düz, Adult/Ancient. Ayrıntı ve kabul edilen sapmalar `docs/harita/DENGE.md`'de.

## 2026-10-22 — Seviye artışı skor satırlarında, tek havuz (Görev M4)

- **Havuz:** Oluşturucudaki ayrı ASI seçim bölmesi ("bir skora +2 / iki skora +1" ve yetenek seçimi) kalktı.
  - Yetenek artışı seçili ya da boş her ASI yuvası havuza 2 puan ekler: seviye arttıkça puan kendiliğinden eklenir (Fighter 8: 4, 6, 8 → 6 puan).
  - Kalan puan skorların üstünde tek sayaçta ("Kalan: N"). Kullanıcının isteğiyle yuva sekmeleri yok.
- **Sayaç:** Her skor satırında "Geçmiş" sayacının altında "Seviye" sayacı var.
  - + puanı en erken uygun yuvaya koyar; − en son yuvadaki artışı geri alır, yalnızca seviyeden gelen artış kadar.
- **Kurallar korunuyor:** yuva başına toplam 2, hiçbir skor 20'yi geçmez.
  - Puan bitince ya da skor 20'deyken + pasif.
  - Yarım harcanmış yuva (kalan 1) kaydı engeller (mevcut `increaseProblem`).
- **Yetenek artışı / Feat geçişi:** yuva başına "Seviye ilerlemesi" bölümünde.
  - Feat seçilen yuva havuzdan düşer.
  - Feat'in kendi +1'i (Grappler vb.) o yuvada seçilir ve skorda "+1" rozetiyle görünür.
- **Fark gösterimi:** oluşturma skoru → seviye sonrası skor ve "+n" rozeti (ör. "17 → 20 +3").
- **Kayıt şeması değişmedi:** `advancements[].abilities`; hesap mevcut ASI kodunda (`applyIncreases`, yeni `poolRaise` / `poolLower` / `poolLeft`). Sürüm aynı.

## 2026-10-22 — Orman varyant adları: Gündüz / Gece

- Görünen adlar "Gündüz" / "Gece", İngilizcede "Day" / "Night"; "Orman açıklığı" adı kalktı.
  - Varyant verisine isteğe bağlı `nameEn` eklendi; `variantLabel` dile göre seçer.
  - Varyant kimlikleri (`orman`, `gece`) değişmedi. Kayıtlar, ses eşlemesi ve kontroller kimlik kullandığı için uyarlama gerekmedi; kayıtta ad saklanmıyor.
- Diğer haritalarda gündüz/gece adlandırması tutarsız; yalnızca raporlandı, düzeltilmedi:
  - Şehir meydanı: "Gün" / "Gece". Sonradan karar: "Gündüz" yapıldı (kimlik `gun` aynı).
  - Çöl: "Gündüz" / "Akşam fırtınası". Karar: olduğu gibi kalır.
  - Öteki varyantların İngilizce adı yok.

## 2026-10-22 — Orman efektleri güçlendi (Görev M2)

- **Yoğunluk ölçeği:** düşük / orta / yüksek = 1× / 2× / 3,5×. Varsayılan "orta".
  - Yeni ölçek yalnızca varyant verisinde `"scale": "strong"` olan efektlere uygulanır; şimdilik bunlar Orman'ın gündüz ve gece katmanları.
  - Çöl, Volkan ve diğer haritalar eski 0,5× / 1× / 1,5× ölçekte kaldı. Daha az riskli seçenek buydu: o haritaların görünüşü ve okunabilirliği (kum fırtınası, lav parıltısı) değişmedi.
- **Çarpanın uygulandığı değerler:**
  - Yaprak sayısı: gündüz 10 / 20 / 35; gece tek yaprak 1 / 2 / 4.
  - Kuş gölgesi sıklığı: aralık [28, 52] sn çarpana bölünür; yüksekte 8–15 sn'de bir.
  - Toz/polen sayısı: 10 / 20 / 35.
  - Yer sisi ve ışık huzmesi opaklığı: `params.alpha` × çarpan, en çok 0,4.
    - Sis: 0,11 / 0,22 / 0,385.
    - Işık huzmesi: 0,09 / 0,18 / 0,315.
- **Taban değerler arttı:**
  - Yapraklar ve toz noktaları 2×2 tuval pikseli boyutunda (`params.size`).
  - Yaprak opaklığı 0,9; kuş gölgesi 0,28.
  - Işık huzmesi artık veriden belirgin bir opaklıkla çiziliyor (eskiden ≈0,05).
- **Gece kuralı aynı:**
  - Parlak ya da yanıp sönen tür yok.
  - Toz opaklığı ayarla artmaz (yalnızca sayısı artar).
  - Gece efektlerinin veri opaklığı ≤ 0,55 kaldı; sis en yüksekte 0,4'ü aşmaz. Test bunları denetliyor; eşik gevşetilmedi.
- **Katman ve performans değişmedi:** ızgara ve jetonların altında, tıklamaya kapalı; 320×179 tuval, en çok 30 kare/sn; "hareketi azalt" ve pil kuralları geçerli. `EffectsLayer` tembel parça (10,2 kB), ana parça değişmedi (316 kB).
- **`check:harita`:** güçlü ölçekli efekti olan varyantlar "orta" ve "yüksek" yoğunlukta ayrı açılıp denetlenir. Görüntüler `test-results/kara-ekran/orman-*-efekt-{orta,yuksek}-{telefon,pc}.png` olarak saklanır.

## 2026-10-22 — Weapon Mastery, Fighting Style, kimlik kuralı (Görev P0)

- **Kaynak:** Yalnızca SRD 5.2.1 (`data/srd/`). Mastery metinleri, silah → mastery tablosu ve sınıf hakları SRD'den doğrulandı.
  - SRD 5.2.1'de **Fighting Style feat'i yalnızca 4 tane**: Archery, Defense, Great Weapon Fighting, Two-Weapon Fighting.
  - Dueling, Thrown Weapon Fighting, Unarmed Fighting, Blind Fighting, Protection ve Interception SRD'de yok (PHB 2024); eklenmedi.
- **Kimlik kuralı:** `data/weapons.json`, `data/spells.json` ve `data/items.json` kayıtları sabit `id` (ad slug'ı) ve `srd: "<dosya>:<kimlik>"` taşır.
  - Silah id'si SRD silah id'siyle aynıdır.
  - Healing iksirleri `magic-items:potions-of-healing`, Hill Giant kemeri `magic-items:belt-of-giant-strength` varyantına bağlanır.
  - Alchemist's fire, Acid, Holy water, Antitoxin ve Healer's kit SRD "Adventuring Gear" listesine bağlanır; liste `npm run srd` ile ayrıştırılıyor (`data/srd/gear.json`, 81 kayıt).
  - Feat ve sınıf özelliği anahtarları zaten SRD kimliği.
  - `src/data/srdIds.test.ts` kimliksiz, yinelenen ya da SRD karşılıksız kaydı yakalar.
- **Weapon Mastery verisi:**
  - Silahın mastery'si `data/srd/weapons.json`'dan okunur; sınıf verisiyle tembel yüklenir.
  - Hak sayısı SRD sınıf tablosundan gelir: Barbarian ve Fighter "Weapon Mastery" sütunu, Paladin/Ranger/Rogue 2 (`data/class-features.json` `stat: weaponMastery`).
  - Barbarian yalnızca yakın dövüş silahı seçebilir (`melee: true`). Seçilebilen silahlar sınıfın yetkin olduğu silahlardır.
  - Mastery'lerin oyundaki durumu ve parametreleri `masteries` bölümünde: itme 10 ft ve en çok Large, Slow 10 ft, Topple CON, yapay zekâ önceliği. Kodda sınıf adı yok.
- **Uzun dinlenme:** SRD'ye göre Barbarian/Fighter bir seçimi, Paladin/Ranger/Rogue hepsini değiştirebilir (`swap`).
  - Karakter listesinde uzun dinlenmeden sonra "Silah talimi" çıkar; kural `masterySwapProblem` ile denetlenir.
  - Oluşturucuda (karakteri düzenlemek oyun dışı) seçim serbesttir; yalnızca sayı ve uygunluk denetlenir.
- **Savaşta (otomatik, olay + günlük):**
  - Ustalık yalnızca seçilen silahta ve oyunda çalışıyorsa seçeneğe yazılır.
  - **Cleave:** isabette ilk hedefin 5 ft yakınındaki ve erişimdeki ikinci düşmana ek saldırı.
    - İkinci hedef otomatik seçilir: en az HP'li, eşitse sırada önce gelen.
    - Hasara yetenek değiştiricisi eklenmez (negatifse eklenir); büyülü bonus eklenir. Turda bir kez.
  - **Graze:** ıskada değiştirici kadar aynı türde hasar (direnç uygulanır).
  - **Push:** isabette `pushAwayEvents` ile 10 ft (en çok Large).
    - SRD'de itme isteğe bağlı ("can"). Otomatik kural: yakın dövüşte yalnızca Attack eyleminin son saldırısında iter, böylece Extra Attack'ın ikinci saldırısı boşa gitmez.
    - Menzilli saldırıda ve fırsat saldırısında her zaman iter. Haritasız savaşta etkisiz.
  - **Sap / Slow / Vex:** savaşçıda süreli işaret (`marks`).
    - Süre, işareti koyanın tur başı ya da tur sonu sayısıyla reducer'ın `turn_ended` adımında düşer.
    - Sap ve Slow saldıranın sonraki turunun başına dek sürer.
    - Vex saldıranın sonraki turunun sonuna dek sürer: kendi turunda konduysa 2, başkasının turunda konduysa 1 tur sonu.
    - Sap işaretlinin bir sonraki saldırı zarı (silah ya da canavar saldırısı) dezavantajlı olur ve işaret kalkar.
    - Vex işaretli hedefe bir sonraki saldırı avantajlı olur ve işaret kalkar.
    - Slow hızı 10 ft azaltır (`speedHexes`) ve üst üste binmez.
  - **Topple:** CON save (DC 8 + değiştirici + yetkinlik); başarısızsa Prone (`condition_changed`).
  - **Nick: oyunda henüz çalışmıyor.** Light silahla ek saldırı (ikinci el) motorda yok. Oluşturucu, kart ve özellik notunda "oyunda henüz çalışmıyor" yazar; Weapon Mastery özelliği bu yüzden `partial`.
  - Spell saldırıları Sap/Vex işaretine bakmaz (yalnızca silah ve canavar saldırıları).
- **Yapay zekâ:** basit ve deterministik.
  - Silah seçiminde ortalama hasara verideki mastery öncelik puanı eklenir (`ai`: Topple 1,5; Cleave, Graze, Sap ve Vex 1; Push ve Slow 0,5).
  - Vex işaretli hedef, hedef sırasında öne geçer.
  - Etkiler motor tarafından otomatik uygulanır.
- **Fighting Style:**
  - Great Weapon Fighting uygulanıyor: iki elle tutulan yakın dövüş silahında (Two-Handed ya da kalkansız Versatile) silahın hasar zarındaki 1 ve 2, 3 sayılır.
    - Sneak Attack gibi ek zarlara uygulanmaz; fırlatmada uygulanmaz.
    - Versatile silahın iki el hasar zarı (`versatileDamage`) motorda hâlâ kullanılmıyor: önceden de böyleydi, ayrı iş.
  - Two-Weapon Fighting "oyunda henüz çalışmıyor" (ikinci el saldırısı yok).
  - Oluşturucu Fighter 1, Paladin 2, Ranger 2'de Fighting Style yuvası açar (Görev N'den; veriden).
- **Denge:** parti (Bor Defense, Kael Archery; Bor/Kael/Sela mastery) ortalama +7 puan güçlendi.
  - Aralık dışına çıkan dört senaryo yalnızca düşman listesiyle (ortam listesinden, canavar verisi aynı) düzeltildi: Dungeon Koridor 89→79, Hazine 87→80, Wyrmling 93→75, Taverna ortada 89→76.
  - Taverna değişikliği "uzakta" senaryolarında %51 verdiği için yalnızca "ortada"da; ayrıntı `docs/harita/DENGE.md`.
- **Kayıt sürümü 8:** `mastery_applied` ve `mastery_mark_used` olayları eklendi; 3–8 yüklenir.
- **Ana parça:** Giriş ekranı savaş motorunu statik içe aktarıyordu (`sheetAvatar` için `battle/index`, kayıt için `battleSave`).
  - Jeton yolu `battle/avatar.ts`'e, kayıt anahtarı `app/saveKey.ts`'e taşındı; kayıt yükleme tembel import oldu.
  - Motor artık ayrı `session` parçasında (≈123 kB). Ana parça 465 → 318 kB.

## 2026-10-22 — Orman hareketli ortam katmanı (Görev M)

- **Düzenek:** Mevcut harita efekt katmanı (Adım 10c: çöl sıcağı/kum fırtınası, volkan lav parıltısı) kullanıldı.
  - Yeni türler: `fallingLeaves` (1–4 piksel yaprak şekli, yavaş düşüp savrulur), `birdShadow` (ara sıra, hızlı geçen tek kuş gölgesi), `groundFog` (yer bandında yavaş kayan soluk sis), `motes` (seyrek, soluk, yanıp sönmeyen toz/polen).
- **Parametreler veride**, haritanın varyant JSON'unda: `intensity`, `speed` (zaman çarpanı, bütün türlerde), `params` (`count`, `shapes`, `everySec`, `band`, `alpha`); `effectErrors` doğrular. Başka haritaya eklemek yalnızca veri.
- **Orman gündüz:** hafif ışık huzmesi (yavaş), 14 yaprak, 18–40 sn'de bir kuş gölgesi.
- **Orman gece:** yer sisi (görselin alt %45'i, opaklık ≤ 0,14), 10 soluk nokta, tek yaprak.
  - Önceki ateşböceği ve genel sis kaldırıldı: gece görüş kuralı ve ışıklı altıgenlerle karışmasın diye parlak ya da yanıp sönen efekt yok (testle denetleniyor).
- **Katman:** harita görseliyle ızgara/jeton katmanı arasında; jetonların, vurguların ve tıklamanın altında, `pointer-events: none`.
- **Performans:**
  - 320×179 tuval, en çok 30 kare/sn.
  - Durduğu durumlar: sekme gizliyken, ekran dışındayken (IntersectionObserver), pil ≤ %20 ve şarjda değilken.
  - "Hareketi azalt" açıkken çizim yok, harita statik.
- **Ayarlar:** savaş menüsünde "Harita efektleri: Açık/Kapalı" ve "Efekt yoğunluğu: düşük/orta/yüksek" (sayı ve opaklık ×0,5/×1/×1,5), bu cihazda hatırlanır.
- **Tembel yükleme:** Katman (`EffectsLayer`) artık ayrı tembel parça (9,9 kB). Ayar kancası küçük `effectsSetting.ts`'e taşındı; menü arka planı artık çizim kodunu ana parçaya çekmiyor. Ana parça 476 → 465 kB.
- **Kontrol:** `check:harita` Orman gündüz ve gece efektli açılışta katmanın çizdiğini denetler ve ekran görüntüsünü `test-results/kara-ekran/orman-*-efekt-*.png` olarak saklar.

## 2026-10-22 — Ses eşlemesinden "düz zemin" kaldırıldı

- `data/ses.json`'daki `duz` kaydı hiçbir harita ya da kurulum seçeneğinde kullanılmıyordu (haritasız savaş yalnızca simülasyon ve testlerde). Kaldırıldı.
- Eşlemesi olmayan savaş hata vermeden sessiz kalır.
- Ortam kimliği `d-z-zemin` ("Düz zemin" kural ortamı; Ada, Gemi, Kale, Şehir meydanı, Taverna) ayrı bir şey, değişmedi.

## 2026-10-22 — Kurulum ekranında ortam sesi kalktı (Görev T)

- Game Master kurulumunda (harita/varyant değişse de) yalnızca menü müziği çalar. Savaş ekranına girince (savaşı başlat ya da kayıtlı savaşa devam) menü müziği çapraz geçişle kapanır; ortam sesi ve savaş müziği `data/ses.json`'a göre başlar (Volkan kuralı dahil). Savaştan çıkınca menü müziği döner.
- Eşleme `SCREEN_SOUND` (`src/ui/audio/soundPlan.ts`).
- Seviyeler, ayarlar, simülasyon ve kayıt sürümü değişmedi.

## 2026-10-22 — Ses sistemi: ortam sesi, müzik, zar sesleri (Görev S)

- **Kaynak:** `assets-ham/ses/`, **Suno ile üretildi**.
  - **Ticari kullanım:** Suno'nun güncel kullanım koşulları (abonelik türüne göre ticari kullanım hakkı) ve olası üçüncü taraf hakları mağaza/yayın öncesi kontrol edilecek. SRD içeriği değil; atıf dosyalarına girmez.
- **Temizlik ve adlar:** `AlbumArtSmall.jpg` ve `Folder.jpg` silindi. Türkçe harfli ve düzensiz adlar `git mv` ile ASCII adlara çevrildi; eşleme `data/ses-adlari.json`'da.
  - menü-dark → menu-dark; muzik-gunduz-a/gece-a → muzik-savas-gunduz/gece.
  - orman-* → ortam-orman-*; ortam-guverte-* → ortam-gemi-*; ı/ğ → i/g.
  - zar-*-a → zar-*.
- **İşleme** (`npm run ses`, `scripts/ses.mjs`, ffmpeg): `assets-ham/ses` → `public/ses` (ham dosyalar build'e girmez).
  - Biçim: MP3 44,1 kHz (iOS dahil). Ortam 96 kbps mono, müzik 128 kbps stereo, efekt 128 kbps mono.
  - Ortam ve müzik: baş/son sessizlik kırpılır; iki geçişli EBU R128 normalizasyonu: ortam −20 LUFS, müzik −18 LUFS.
  - Zar dosyaları: sessizlik algılamasıyla (−40 dB, en az 0,3 sn) ayrı kliplere bölünür. Her klip tepe −1 dBFS'e çekilir (kısa klipte LUFS güvenilmez). Kısa kırıntılar atılır (zar-dur'da 0,05 sn, diğerlerinde 0,25 sn altı).
  - Suno dosyalarındaki gömülü kapak resmi çıktıdan atılır (dosyaları iki katına çıkarıyordu).
  - Manifest `data/ses-klipler.json` (dosya, süre, boyut, zar klip grupları).
- **Sonuç:** 64 dosya, toplam 16,6 MB.
  - Müzik: 4 dosya, 10,4 MB (menu-dark 208 sn, menu-light 190 sn, savaş gündüz/gece 141/142 sn).
  - Ortam: 38 dosya, 5,9 MB; her biri 10–15 sn, 118–179 kB.
  - Efekt: 22 klip, 0,3 MB; 3–82 kB.
  - Zar: 22 klip. zar-tekli 1 (0,24 sn'lik başlangıç tıkırtısı atıldı), zar-coklu 3, zar-sekme 2, zar-dur 14, zar-kritik 1, zar-kritik-hata 1.
- **Eksikler:**
  - `ortam-duz-zemin` yok: haritasız savaş sessiz ("silent" işaretli).
  - Varyanta özel dosyası olmayanlar ortak kliple çalar:
    - Dungeon Merdiven ve Hazine odası → dungeon;
    - Volkan uyuyan ejderha → volkan;
    - Şehir meydanı "Gün" → sehir-meydani-gunduz;
    - Çöl "Akşam fırtınası" → col-firtina.
- **Eşleme veride** (`data/ses.json`): harita → varyant → ortam klipleri (a ve b) ve savaş müziği (gündüz/gece).
  - Varsayılan atamalar görevdeki liste.
  - Koşullu kurallar (`rules`): `map`, `variant`, `dragon` (uyuyan ejderha ayarı ya da canavar kimliği `enemyPattern`'e uyan düşman), `enemyPattern`.
  - Kural: Volkan'da ejderha varsa gece müziği.
  - Testler: her dosyanın varlığı, her harita/varyantın eşlemesi, Volkan + ejderha (gerçek savaş durumundan da).
- **Motor** (`src/ui/audio/engine.ts`, Web Audio):
  - Ayrı parça (5 kB), ilk dokunuşta yüklenir; tarayıcı zaten ilk dokunuştan önce ses çaldırmaz.
  - Kanallar: ortam, müzik (menü müziği kendi seviyesiyle), efekt → ana ses.
  - Sekme gizlenince askıya alınır, dönünce devam eder.
  - Ortam: a ve b ayrı döngülerde, kendi uzunluklarında. İkincisi yarısından başlar ki dikişler çakışmasın. Dikiş 2,5 sn eşit güçlü çapraz geçişle gizlenir.
  - Müzik: 4 sn çapraz geçişli döngü.
  - Klipler ihtiyaç olunca yüklenir; sahne değişince kullanılmayanlar bellekten atılır (zar klipleri kalır).
- **Ne zaman ne çalar:**
  - Menüler: temaya göre menu-light/menu-dark (2 sn geçiş).
  - Game Master kurulumu: yalnızca seçili haritanın ortamı.
  - Savaş yerleşimi: ortam sürer.
  - Savaş başlayınca: müzik 6 sn'de açılır.
  - Savaştan çıkınca: müzik ve ortam 1,5 sn'de kapanır, menü müziği döner.
- **Seviyeler** (veride, `levels`):
  - Ortam 0 dB (referans), savaş müziği −9 dB, menü müziği −6 dB, efekt +1 dB.
  - Müzik −18, ortam −20 LUFS'e normalize edildiği için savaşta müzik ortamın yaklaşık 7 dB altında.
  - Zar klipleri tepe −1 dBFS ile ortamdan ve müzikten net duyulur. Kulakla ince ayar `data/ses.json`'dan.
- **Ayarlar:** "Ses" düğmesi (ana menü başlığında ve savaş menüsünde): Ana ses, Ortam, Müzik, Efekt kaydırıcıları ve her birinin kapatma düğmesi. Bu tarayıcıda hatırlanır (`rpg-battle-ses`).
- **Zar sesleri** (`src/ui/diceSound.ts` tetikleri; yeni `throw` olayı):
  - Atış anında zar sayısına göre zar-tekli/zar-coklu.
  - 3D'de sekmelerde zar-sekme (sekme şiddetine göre seviye).
  - Durmada zar-dur; doğal 20'de ayrıca zar-kritik, doğal 1'de zar-kritik-hata.
  - Klip rastgele seçilir, art arda aynı klip gelmez. Aynı klip 40 ms içinde iki kez çalmaz (birden çok zar aynı anda durunca).
  - 2D'de ve zar animasyonu Kapalı'yken yalnızca atış ve durma.
- **Doğrulama:**
  - `npm run check:ses` (`scripts/ses-kontrol.mjs`, gerçek tarayıcı): dokunmadan bağlam yok → dokununca çalışıyor; kanallar kurulu; menü müziği ve tema geçişi; kurulumda ortam; savaşta ortam + gece müziği (uyuyan ejderha); zar sesleri; sekme gizlenince askı ve dönüş.
  - Gerçek dinleme kullanıcıda.
- **Ana parça:** 466,8 → 476,2 kB.

## 2026-10-22 — Seviye ilerlemesi, Aşama 0: ortak altyapı (Görev N)

### SRD verisi betikle (elle yazılmadı)
- `npm run srd` (`scripts/srd-ayristir.mjs`, `scripts/srd/pdf.mjs`): `docs/SRD_CC_v5.2.1.pdf` pdfjs-dist ile okunur.
  - Başlık düzeyi yazı tipi ve boyuttan çıkarılır: GillSans-SemiBold 26/18/14/12 bölüm başlıkları; Cambria gövde; GillSans tablo.
  - İki sütun okuma sırasına dizilir. Tablolar konumlu hücrelerden kurulur; sütun adları başlık sözcüklerinin en yakın veri sütununa atanmasıyla bulunur.
- Çıktı `data/srd/`, her kayıtta `source: { page, section }`:
  - `classes.json`: 12 sınıf; temel özellikler, 1–20 tablo (bütün sütunlar), özellik metinleri, Metamagic ve Eldritch Invocation seçenekleri.
  - `subclasses.json`: 12 alt sınıf. `feats.json`: 17 feat. `spells.json`: 339 büyü.
  - `magic-items.json`: 258 eşya (nadirliği değişken olanlar `Varies`). `weapons.json`: 38 silah + 8 mastery. `armor.json`: 13 kayıt.
  - `progression.json`: motorun kullandığı metinsiz özet.
  - `rapor.json`: sorunlar ve atlananlar.
- **Ayrıştırma sorunu yok.** Kendi kendini denetliyor:
  - Tablodaki her özelliğin metni bulunuyor; alt sınıf seviyeleri tabloyla tutarlı.
  - Slot tabloları `data/spell-slots.json` ile birebir (test).
- **Bilerek atlananlar:** büyü ve eşya içindeki yaratık stat blokları (7), sınıf metnindeki iki yan kutu (Paladin "Breaking your oath", Wizard "Expanding and replacing a spellbook").
- **Yazım düzeltmesi:** SRD'deki Barkskin "Component:" yazım hatası "Components" olarak okunur.
- **Kaybedilen içerik:** Özellik metinlerinin içindeki küçük tablolar (ör. Sorcerer "Creating Spell Slots") metne alınmadı.
- **Harici veri yok:** 5e-srd-api gibi harici veri kullanılmadı. PHB'ye özgü içerik yok.

### Büyü verisi SRD 5.2.1'e eşitlendi
- `npm run srd:buyu` (`scripts/srd-buyu-esitle.mjs`) kendiliğinden kopyalar: seviye, sınıflar, eylem türü, konsantrasyon, okul, SRD sayfası.
- `mechanics.upcast`, "Using a Higher-Level Spell Slot" metninden yapılandırılır: `dice`, `rays`, `targets`, `hp` ya da `duration`.
- Mekaniği karşılaştırıp `docs/BUYU-ESITLEME.md` raporunu yazar.
- Bileşen ve süre metni ana parçaya girmesin diye yalnızca `data/srd/spells.json`'da.
- **Elle düzeltilen mekanikler** (2014 değerleri):
  - Cure Wounds 2d8; Healing Word 2d4; Mass Healing Word 2d4 iyileştirme (önceden yanlışlıkla hasar türündeydi).
  - Chill Touch 1d10; Vicious Mockery 1d6.
  - Inflict Wounds: CON save, 2d10, başarıda yarı. Poison Spray: büyü saldırısı (save değil).
  - Sleep: WIS save → Incapacitated, her tur sonu save. SRD'deki ikinci başarısızlıkta Unconscious aşaması yok (`approx`).
- **Kalan farklar** (raporda): Produce Flame (yarat + fırlat tek bonus eylem), Mass Healing Word tek hedef, Dispel Magic yukarı slot etkisi metin olarak. Ayrıca 36 `utility` büyü.

### Özellik motoru (`src/rules/classFeatures.ts`)
- **Seviye bilgisi:** Hangi özelliğin hangi seviyede geldiği SRD tablosundan okunur.
- **Mekanik:** Ne yaptığı `data/class-features.json`'da (elle yazılan tek katman; anahtar `sınıf:özellik`). Türler:
  - `passive`: Extra Attack, Sneak Attack zarı (tablo sütunu), hız, Unarmored Defense, uzmanlık.
  - `resource`; `action` / `bonus` / `reaction`; `free` (Action Surge).
- **Durum:** `status`: `ok`, `partial`, `none` (savaşta etkisi yok) ya da `missing`. Dosyada olmayan özellik `missing` sayılır.
- **Sınıf adı koşulu kalmadı:** `economy.ts`, `create.ts` ve `stats.ts`'te kalmadı. Test kaynak kodu tarar.
- **Taşınanlar, davranış aynı:** Extra Attack, Sneak Attack, Cunning Action, Unarmored Defense, Fast Movement, Unarmored Movement, Favored Enemy'nin her zaman hazır Hunter's Mark'ı. Test eski elle yazılmış formüllerle 1–20 karşılaştırır.

### Kaynak modeli
- **Tanım:** `Combatant.resources` artık kimlik → sayı kaydı.
  - Tanımlar `data/class-features.json` `resources`: kullanım (tablo sütunu, seviye tablosu, seviye × n, yetenek değiştiricisi, sabit) ve yenilenme (kısa/uzun dinlenme, tur başı; sayı ya da hepsi; `shortFrom` eşiği).
- **Tanımlı kaynaklar:** Action Surge, Second Wind, Favored Enemy, Indomitable, Rage, Bardic Inspiration, Channel Divinity (Cleric ve Paladin), Wild Shape, Focus, Uncanny Metabolism, Lay on Hands, Sorcery Points, Innate Sorcery, Magical Cunning, Arcane Recovery.
- **Kullanılabilenler:** Savaşta yalnızca özelliği uygulananlar kullanılır ve HUD'da görünür (Action Surge, Second Wind, Favored Enemy). Diğerleri sayılıp dinlenmede yenilenir; eylemleri Aşama 1'de.
- **Slotsuz büyü:** Kaynak tanımındaki `freeSpell` (Favored Enemy → Hunter's Mark).
- **Tur başı yenilenme:** `rechargeResources` destekliyor, henüz bağlı değil.

### Alt sınıf, ASI/feat, uzmanlık, deneysel uyarı
- **Alt sınıf:** `CharacterSheet.subclassId`, 3. seviyede seçilir. SRD'de her sınıfın tek alt sınıfı var; boşsa o sayılır. Alt sınıf özellikleri seviyeye bağlı listelenir; hiçbiri henüz uygulanmıyor.
- **Seviye yuvaları** (`src/rules/advancement.ts`) SRD tablosundan:
  - ASI satırları (Fighter 6/14, Rogue 10 dahil);
  - Epic Boon (19);
  - Fighting Style özelliği (Fighter 1, Paladin 2, Ranger 2).
- **Seçim:** Yuvaya ASI (+2 ya da +1/+1, tavan 20) ya da ön koşulu tutan feat seçilir. Köken (Origin) feat'i ayrı seçilir.
- **Boş yuva sorun değil:** Eski kayıtlı karakterler bozulmasın; skorlar 1. seviyedeki gibi kalır.
- **Feat etkileri veriden** (`class-features.json` `feats`):
  - Uygulananlar: ASI, Alert (inisiyatife yetkinlik), Skilled (+3 beceri), Archery (+2 menzilli), Defense (zırhla +1 AC), Grappler ve Epic Boon'ların yetenek artışı (Boon tavanı 30).
  - Yalnızca not (`missing`/`partial`): Magic Initiate, Savage Attacker, Great Weapon Fighting, Two-Weapon Fighting, Grappler'ın ve Boon'ların diğer faydaları, Alert'in Initiative Swap'ı.
- **Uzmanlık:** Hakkı veriden: Rogue 1 ve 6, Bard 2 ve 9, Ranger 9, Scholar 1 (liste kısıtı denetlenmiyor). Oluşturucu seçtirir ve fazlası sorun sayılır.
- **Deneysel uyarı:** "Sınıf özellikleri" paneli bu seviyeye dek gelen özellikleri durumlarıyla gösterir.
  - Uyarı seviyesi: `max(6, tamamlanan son seviye + 1)`.
  - Tamamlanan seviye veriden hesaplanır: bütün özellikleri `ok`/`partial`/`none`. Sınıflar tamamlandıkça uyarı kendiliğinden daralır. Bugün her sınıfta 1. seviyede bile eksik var (Weapon Mastery, Rage…), uyarı 6'dan başlıyor.

### Yukarı slot ve dinlenme
- **Slot seçimi:** Büyünün hedef ve alan balonunda slot düğmeleri var; seçilmezse en düşük uygun slot kullanılır.
  - Motorun henüz uygulamadığı yukarı slot etkisi açıkça yazılır ("oyunda henüz yok, yalnızca slot harcanır").
  - Yapay zekâ slot seviyesi yazmaz: en düşük uygun slot.
  - Uygulanan yukarı slot etkileri yalnızca `upcast.applied` olanlar: Spiritual Weapon, Spirit Guardians. Yenileri Aşama 1'de; sim çıktısı bu yüzden değişmedi.
- **Savaşlar arası durum** (`src/rules/characterRest.ts`, `src/app/partyStatus.ts`):
  - Biten savaşta oyuncu karakterlerinin HP'si, kaynakları ve slotları kayıtlı karaktere yazılır. Sonraki savaş bu durumla başlar.
  - 0 HP'deki ya da ölü karakter partiye alınamaz. Ölü için "Diriltildi say" düğmesi var.
- **Kısa dinlenme:** HP zarı harcanır (zar + CON); kısa dinlenmede yenilenen kaynaklar dolar; Warlock slotları dolar.
- **Uzun dinlenme:** Her şey dolar; harcanan HP zarlarının yarısı geri gelir (SRD 5.2.1).
- **Arayüz:** Karakter listesi ve Game Master kurulumu ("Herkes uzun dinlensin").
- **Kayıt sürümü 7:** kaynak kaydı biçimi. 3–7 yüklenir; eski üç alanlı kaynak nesnesi aynı okunur (test).

### Simülasyon
- **`--seviye N`:** `npm run sim -- 200 --seviye 11 kale`.
- **Parti üreteci iskeleti `partyAt(level)`:**
  - 5. seviyede `PARTY` birebir döner.
  - Diğer seviyelerde aynı üyeler, skorlar, donanım ve büyüler kullanılır; yalnızca seviye değişir ve o seviyede seçilemeyen büyüler çıkar. ASI, donanım ve büyü seçimi Aşama 1.
  - Senaryoya seviyeli düşman listesi (`byLevel`) eklenebilir; boşsa 5. seviye listesi.
- **Ölçüm** (`docs/harita/DENGE.md`): büyü düzeltmeleri dışında çıktı birebir aynı.

### Tembel yükleme ve boyut
- **Ayrı parçada:** Sınıf ilerlemesi (49 kB), özellik mekaniği (9 kB) ve feat'ler (13 kB) `loadClassData()` ile ayrı parçada.
  - Uygulama açılışta boşta yükler; giriş ekranı beklemez, karakter ve Game Master ekranları bekler.
  - Testler `test-setup.ts`, simülasyon `await loadClassData()`.
- **Ana parça:** 439,6 → 466,6 kB (yeni oluşturucu panelleri, motor, dinlenme, büyü verisine okul ve yukarı slot). 500 kB altında.

### Kontrol betiği
- `npm run check:harita` 3D zar tepsisi (J3) haritayı örttüğü anda ölçüm yapınca zamanlamaya bağlı hata veriyordu. Kontrolde zar animasyonu kapatıldı.

## 2026-10-22 — 3D zar atışı, seçenek A (Görev J3, deneme)

- **Ne:** Zar tepsisinde düşük çözünürlüklü 3D zarlar (192×128 WebGL tuvali, iki kat büyütülüp piksel keskin gösteriliyor).
  - Zar türleri: d4, d6, d8, d10, d12, d20; d100 iki d10 (onlar "00".."90", birler "0".."9").
  - Zarlar soldan fırlatılır, dört kez azalan sekmelerle seker, yuvarlanır, gölge düşürür ve önceden belli sonuca oturur.
  - Yalnızca sunum: motor, kayıt ve elle zar girişi değişmedi.
- **Sahte fizik:** Dönüş, durma yöneliminden geriye hesaplanıyor: `q(t) = dönüş(eksen, açı·(1 − t)²) · q_son`. t = 1'de zar tam istenen yüzde durur (testte her zar ve her değer için doğrulandı). Konum ease-out ile, yükseklik parçalı parabollerle. Saf hesap `src/ui/dice3d/throw.ts` ve `shapes.ts`'te, three.js'ten bağımsız.
- **Yüzler:** Sayılar tuval dokusu. d4'te gerçek d4 gibi köşelerde; sonuç üstteki köşe. d6'da karşılıklı yüzlerin toplamı 7. 8 ve üstü yüzlü zarlarda 6 ile 9 altı çizgili. Doku küçültmede mipmap'li, büyütmede piksel keskin; küçük d20 yüzü de okunur.
- **Kamera** neredeyse tepeden (~72°): sonuç yüzü en büyük ve okunur; yan yüzler derinlik verir.
- **Çoklu zar:** Ayrı hücrelere dizilir (≤4 tek sıra, fazlası iki sıra), birbirine değmez; her biri kendi eğrisiyle iner.
- **Vurgular:**
  - Avantaj/dezavantajda sayılan d20'nin altında halka, öteki soluk.
  - Doğal 20 altın, doğal 1 kırmızı parıltı. Tepsi kenarı ve "KRİTİK" yazısı önceki gibi.
- **Süre:** Normal 1,5 sn (atış 0,75 + okuma 0,75; eskiden 1,6). Hızlı 0,75 sn ve her zaman 2D.
- **Ne zaman 3D, ne zaman 2D** (`src/ui/dice3dSupport.ts`):
  - 3D: Normal hız, hareket azaltma kapalı, WebGL var, cihaz belleği ≥ 4 GB ve ≥ 4 çekirdek (tarayıcı bildirmiyorsa yeterli sayılır).
  - Art arda iki atış 24 kare/sn altındaysa bu oturumda 2D. Tek takılma yetmez: yapay zekâ turuyla çakışan bir atış yanlışlıkla düşürmesin.
  - Hareket azaltmada animasyonsuz sonuç (değişmedi).
- **Tembel yükleme:**
  - three.js (0.186.1) yalnızca `Dice3D` parçasında; ilk 3D atışta yüklenir, yüklenene dek o atış 2D.
  - Parça 529,8 kB (gzip 134,7 kB). Ana parça değişmedi: 439,6 kB.
  - Vite bu tembel parça için "500 kB üstü" uyarısı veriyor; ana parça kuralı etkilenmiyor.
- **Tema:** Renkler veriden (`data/zar-gorselleri.json`, `three` alanı: gövde, yüz, kenar, sayı, doğal 20/1 parıltısı, halka). Yeni tema yalnızca veri girdisi.
- **Ses tetik noktası:** `src/ui/diceSound.ts`, `onDiceSound` ile dinlenir. Olaylar: "bounce" (sekme, şiddetiyle) ve "settle" (durdu; kritik/kritik hata bilgisiyle). Şimdilik dinleyen yok.
- **Ölçüm** (headless Chromium, yazılım WebGL/SwiftShader; gerçek GPU daha hızlı olur):
  - Masaüstü 1280×720: atış başına 44–58 kare/sn.
  - Orta düzey telefon taklidi (CPU 4 kat yavaş, 844×390, DPR 2): 35–52 kare/sn. Yapay zekâ turuyla çakışan tek atış 14–17.
- **B seçeneği (gelişmiş 2D) ile karşılaştırma:**
  - B'nin önceden çizilmiş dönme kareleri (sprite) çok hafif (kütüphane yok, birkaç kB) ve her cihazda akıcı olurdu.
  - Ama sonuç yüzü elle ayarlanan son kareyle sınırlı; d20/d12 gibi çok yüzlü zarlarda her değer için ayrı son kare ya da üst üste sayı gerekir.
  - A gerçek yönelimle sonuca oturuyor ve tema/renk değişimi bedava.
  - Bedeli 135 kB (gzip) tembel parça ve WebGL.
- **Öneri:**
  - A'yı tutmak.
  - Sonraki adım: three.js yerine bu sahne için ~10 kB'lık yalın bir WebGL çizici yazmak. Tek gölgelendirici, doku, Lambert ışığı ve disk gölgeler yetiyor; tembel parça 135 kB → ~10 kB olur, görünüm aynı kalır.
  - Beğenilmezse bu commit tek başına geri alınabilir (`git revert`).

## 2026-10-22 — Zar görselleri, klasik tema (Görev J2)

- **Kaynak:** `assets-ham/zarlar/zar-klasik.jpg`, **Gemini ile üretildi**. Macenta zeminde yan yana 7 boş yüzlü piksel sanatı zar (d4, d6, d8, d10, d12, d20, d100).
  - **Ticari kullanım kontrolü:** Masum ve efekt görsellerindeki gibi, ticari yayından önce Google'ın güncel üretken yapay zekâ kullanım koşulları ve olası üçüncü taraf hakları gözden geçirilmeli. SRD'den gelen içerik değil; atıf dosyalarına girmez.
- **İşleme:** `npm run zarlar` (`scripts/zarlar.mjs`), masum ve efekt betikleriyle aynı yöntem.
  - Arka plan: kenardan flood-fill, kapalı boşluk temizliği, despill.
  - Ayırma: bağlı bileşen analizi; en büyüğün %5'inden küçük lekeler atılır. Zar sayısı koddan bulunur: 7, atılan leke 0. 7 değilse betik nedenini yazıp durur.
  - Adlandırma: soldan sağa sıralanıp d4..d100.
  - Çıktı: hepsine aynı ölçek (0,2822; en büyük kenar 116 px), nearest-neighbor. Alt kenar 122 px'te hizalı, yatayda ortalı. 128×128 kayıpsız WebP: `public/zarlar/klasik/<zar>.webp`.
- **Veri:** `data/zar-gorselleri.json`.
  - İçerik: tema kimliği, görünen ad (TR/EN), sayı yazısının rengi, kenar rengi ve boyu; her zar türü için görsel yolu ve sayının konumu.
  - Yeni tema (altın, gümüş, elmas…) = `assets-ham/zarlar/zar-<tema>.jpg` → `npm run zarlar` + bu dosyaya yeni girdi; kod değişmez.
- **Tepsi:**
  - Zar temanın görseliyle çizilir: 64 px, piksel keskin. Dönme ve sallanma CSS ile; sayı görselin üstüne yazılır.
  - Doğal 20'de altın parıltı ve "KRİTİK", doğal 1'de kırmızı ve "KRİTİK HATA". Avantajda sayılmayan d20 soluk.
  - Görsel yüklenemezse o zar türü eski SVG şekle düşer.
  - Görseller tepsi ilk açılınca yüklenir (tembel); ana parça değişmedi (439,6 kB).
  - Hareket azaltma, animasyon ayarı ve kayıt davranışı aynı.
  - Savaş menüsünde "Zar teması: Klasik" seçici; şimdilik tek tema, bu cihazda hatırlanır.

## 2026-10-22 — Gizlenme netleştirme, gece kuralı, Orman gece (Görev K)

### Denetim: önceki davranış
- **Nerede:** Gizlenme yeri olan altıgende.
  - Zemin kataloğunda (kodda) kum tepesi `d` (+0) ve çalılık `g` (+2).
  - Çöl'ün `hideTerrain` alanında açık kum `.`.
  - Orman'ın `stealth` kuralında ağaca (`a`) bitişik altıgenler.
  - Kale, Şehir meydanı, Taverna, Dungeon, Gemi, Mağara, Dağ, Ada'da hiç gizlenme yeri yoktu.
- **Zar:** d20 + Stealth + yer bonusu, sabit DC 15'e karşı. Kum fırtınasında avantaj, Stealth dezavantajlı zırhta dezavantaj.
- **Kime karşı:** Hiç kimsenin Algısına karşı değil. Düşmanın görüş hattı ve pasif Algısı bakılmıyordu; düşman yanı başındayken bile gizlenilebiliyordu.
- **Etkisi:** Başarıda toplam bulunma DC'si olur. Düşmanlar gizliyi hedef alamaz; gizlinin saldırısı avantajlı.
- **Ortaya çıkma:** Saldırı, büyü, itme, yürüme, atlama, ya da Ara (Search) ile toplamı geçen bir düşman.
- **Gösterim:**
  - Sahibine yarı saydam jeton, örtü (yaprak/kum/gölge), kapalı göz ve kodda Türkçe yazılı "Gizli (DC n)".
  - Düşmana görünmez; Game Master "gizli jetonları göster" ile soluk görür.
  - Boşta, ulaşılabilir gizlenme yerleri ince mavi kesikli çerçeveyle gösteriliyordu; neden ve bonus yazılmıyordu.

### SRD 5.2.1 Hide ile karşılaştırma ve sapmalar
SRD 5.2.1 Hide eylemi şunları söyler:
- DC 15 Dexterity (Stealth) gerekir.
- Yoğun örtüde (Heavily Obscured) ya da 3/4 veya tam siper arkasında olmalısın.
- Hiçbir düşmanın görüş hattında olmamalısın.
- Başarıda Invisible olursun; toplam, seni bulmak için gereken Wisdom (Perception) DC'sidir.
- Fısıltıdan yüksek ses, bulunmak, saldırı zarı atmak ya da sözlü bileşenli büyü yapmak bunu bitirir.

| Konu | SRD | Bu oyunda | Neden |
|---|---|---|---|
| Örtü/siper şartı | Yoğun örtü ya da 3/4 siper | Haritanın gizlenme yerleri (veri): çalılık, kum, ağaç/direk/sandık/kaya arkası | Altıgen haritada yöne bağlı siper hesabı yerine yer listesi; tasarımcı veride ayarlar |
| Görüş hattı dışında olmak | Şart | Görüş hattındaki düşmanlar engel değil, ama toplam onların en yüksek pasif Algısını da geçmeli (DC = en az 15) | Taktik oyunda "kimse görmüyor" nadir; pasif Algı aynı fikri ölçülebilir kılar |
| Bitişik düşman | (görüş hattı şartına girer) | Bitişikte seni gören düşman varken gizlenilemez; gizliyken düşman yanına gelirse turunun başında fark eder | Gece de dahil "yanı başındakini fark eder" |
| Yürümek | Bitirmez | Bitirir (değişmedi) | Gizlenme yerinden çıkınca siper kalmaz; ayrıca dengeyi korur |
| İtme (Shove) | Saldırı zarı değil | Bitirir (değişmedi) | Fiziksel temas |
| Sözlü olmayan büyü | Bitirmez | Her büyü bitirir (değişmedi) | Büyü bileşenleri modellenmiyor |
| Invisible koşulu | Verir | "Gizli" durumu: hedef alınamaz, saldırısı avantajlı | Aynı sonuç |

### Yeni kurallar
- **Gizlenme yerleri veriden.**
  - Genel kurallar `data/stealth.json`: DC 15, çalılık +2, kum tepesi, örtü görüntüsü, pasif Algı tabanı 10, bitişik düşman kuralı.
  - Her haritanın kendi harfleri `data/maps/*.json` içindeki `hide` alanında (`terrain`, `adjacentTo`, `cover`).
  - Kodda zemin harfi sabiti kalmadı (zemin kataloğundaki `hide` ve Çöl'ün `hideTerrain` alanı taşındı).
  - Yeni yerler, SRD'nin 3/4 siper şartına göre engel arkası:
    - Kale: kaya, direk, sandık arkası.
    - Şehir meydanı: çeşme/direk, tezgâh/sandık, ağaç arkası.
    - Taverna, Dungeon, Gemi: direk ve sandık/masa arkası.
    - Mağara: sarkıt ve kaya arkası. Dağ: kaya arkası. Ada: kaya ve ağaç arkası.
  - Volkan'da gizlenme yeri yok.
- **Pasif Algı:** Gözcü = gizlenene görüş hattı olan, uyanık ve aklı başında düşman. Pasif Algısı 10 + Algı. Gizlenme toplamı en az 15 ve en keskin gözcünün pasif Algısı olmalı. Olay gözcüyü yazar (`hide_attempted.watcherId`).
- **Gece** (`night` kuralı; Kale gece, Şehir meydanı gece, Orman gece):
  - Işıksız altıgende gizlenene karşı karanlık görüşü olmayan gözcünün pasif Algısı −5.
  - Işıksız altıgende Gizlen zarı avantajlı.
  - Işıklı altıgen ve karanlık görüşlü gözcü gündüz gibi.
  - Parametreler (`passivePerceptionPenalty`, `hideAdvantage`, `lights`, `lightRadiusHexes`) harita JSON'unda.
  - Bitişik düşman kuralı gecede de geçerli; gece gizlenmeyi kolaylaştırır, imkânsızı mümkün kılmaz.
- **Karanlıkla birleşim:** Işıklar tek yerde.
  - `darkness` (görüş sınırı) ile `night` (gizlenme) aynı ışık listesini kullanır (`litHexes`).
  - Şehir meydanı gecenin fenerleri isteğe bağlı karanlık kuralından gece kuralına taşındı; karanlık açılınca da aynı ışıklar geçerli.
  - Gece haritasına görüş sınırı eklenmedi (Kale gece ve Orman gece görüşü kısıtlamıyor).
- **Kayıt sürümü 6** (`watcherId`, bitişikteki düşmanın fark etmesi). Sürüm 3–5 yüklenmeye devam ediyor.

### Sayısal etki (gizlenme olasılığı; ışıksız altıgen, karanlık görüşsüz gözcü)
| Stealth | Gözcünün pasif Algısı | Gündüz | Gece | Gece, karanlık görüşlü gözcü |
|---|---:|---:|---:|---:|
| +3 | 13–15 | %45 | %70 | %70 |
| +3 | 18 | %30 | %70 | %51 |
| +5 | 13–15 | %55 | %80 | %80 |
| +5 | 18 | %40 | %80 | %64 |
| +7 | 13–15 | %65 | %88 | %88 |
| +7 | 18 | %50 | %88 | %75 |

Önceki kuralda (pasif Algı yok) gündüz değerleri yalnızca DC 15'e göreydi; keskin gözlü gözcüye karşı gündüz gizlenmek artık daha zor.

### Arayüz
- **Saklanma bölgeleri:**
  - Boşta, ulaşılabilir ve gizlenilebilir yerler yeşil kesikli çerçeve ve göz-çizgili simgeyle gösterilir.
  - Menüdeki "Saklanma bölgelerini göster" bütün yerleri gösterir; ulaşılamayan ya da düşmanın gözü önündekiler gri, seyrek kesikli ve soluk.
  - Gizlen yapılamazken düğmeye basınca bölgeler açılır.
  - Renk körü için desen ve simge de var.
- **Bilgi kutusu:** "Saklanılabilir: evet (çalılık, sazlık +2)" ya da "hayır (Açık zemin: örtü yok)" / "hayır (Wolf hemen yanında, seni görüyor)". Ek notlar: "karanlık: Gizlen zarı avantajlı", "geçilmesi gereken 18 (Wolf pasif Algısı)", "ışıksız (gece)".
- **Gizli jeton:** Sahibine göz-çizgili simge ve "Gizli (Stealth: 19)" etiketi (dil dosyasından). Karakter çekmecesinde de aynı.
- **Orman gece:**
  - `public/maps/orman-gece.webp`: `assets-ham/haritalar/orman-gece.jpg` 1280×715'e küçültüldü, 71 kB.
  - Zemin gündüzle aynı.
  - İki ay ışıklı açıklık (1 altıgen), ateşböceği ve sis efekti.
- **Yapılmadı:** Gizli tuzakların Game Master görünümü (isteğe bağlıydı).
- **Yapay zekâ gizlenmiyor** (bilinen eksiklerde).

## 2026-10-22 — Zar animasyonu ve elle zar girişi (Görev J)

- **Elle zar: "zar iste, aynı değerlerle yeniden çalıştır".** ManualRng (bir sonraki sayıyı bekleyen Rng) yerine bu seçildi.
  - Neden: `Rng` eşzamanlı bir fonksiyon (`() => number`); motor yarıda bekleyemez. Komutlar saf olduğu için yeniden çalıştırmak ucuz ve güvenli.
  - Adım (komut, yapay zekâ turu, savaş kurulumu) `(rng) => sonuç` olarak zar defteri (`DiceBook`) üstünden çalışır (`src/rules/manualDice.ts`, `runWithDice`).
  - Elle atılacak grup defterde yoksa `NeedDice` fırlar, hiçbir durum değişmez. Arayüz zarı ister, değerleri deftere ekler ve adımı baştan çalıştırır.
  - Otomatik zarlar (canavar zarları "yalnızca oyuncular" kipinde) deftere yazılır, yeniden çalıştırmada aynı gelir.
  - Sonuç: yalnızca gereken zarlar istenir. Iskada hasar zarı yok; kritikte iki kat zar; avantajda iki d20.
- **Rng sözleşmesi bozulmadı.**
  - Zar fonksiyonları (`rollDie`, `rollDice`, `rollD20`) Rng'nin üstünde isteğe bağlı bir `dice` kancası varsa bütün grubu ona sorar; yoksa eskisi gibi atar.
  - Kimin/ne için attığı `rollTag(rng, { by, kind, bonus })` ile iliştirilir; kancasız Rng'de aynı fonksiyonu döndürür.
  - Kurtarma zarını hedef, saldırı ve hasarı saldıran atar; içteki bilgi önceliklidir (`resolveSave` 'save' der).
  - Ejderhanın uyanma zarı `floor(rng()·100)` yerine `rollDie(100) − 1`: aynı dağılım, aynı dizi.
  - Doğrulama: `npm run sim -- 30` çıktısı değişiklikten önce ve sonra birebir aynı (17 senaryo).
- **Zar modu** savaş durumunda (`state.diceMode`, `battle_started` ile kaydedilir). Değerler: otomatik (varsayılan), fiziksel zarlar yalnızca oyuncu karakterleri, fiziksel zarlar herkes.
  - "Yalnızca oyuncular": zarı atan oyuncu karakteriyse (masum değil) istenir. Oyuncunun kurtarma zarı canavar turunda da istenir.
  - "Herkes": canavarların ve ortamın zarları da Game Master'dan istenir; yapay zekâ turu ("Düşmanları oynat") da zar ister.
  - Fiziksel zarda inisiyatif zarları kurulumda ("Savaşı kur") istenir.
  - Simülasyon ve testler her zaman otomatik (kancasız Rng).
- **İstem:** "Saldırı: 1 adet d20 at (+5)", "Hasar: 4 adet d10 at" ve kritik notu, avantaj notu, zarı atanın adı.
  - Her alan 1..yüz sayısı arasında tam sayı olmalı (tarayıcı doğrulaması kapalı, kendi iletimiz).
  - "Otomatik at" yalnızca o grubu atar; "Vazgeç" adımı bırakır (durum değişmez).
- **Kayıt:** Arayüzden gelen her adımın zarları `dice_rolled` olayına yazılır: değerler, kimin attığı, amaç, bonus, avantaj, kritik, elle mi.
  - Olay durumu değiştirmez; sonuçlar zaten ardından gelen olaylarda.
  - Kayıt sürümü 5. Sürüm 3 ve 4 yüklenmeye devam ediyor (zar modu yok, otomatik).
  - Düz Rng ile (testler, simülasyon) zar olayı yazılmaz; eski olay akışı aynı.
- **Zar animasyonu** yalnızca sunum (`src/ui/DiceTray.tsx`, tembel parça, 2,3 kB).
  - Ekranın üst ortasında tepsi. Zar türüne göre şekil: d4 üçgen, d6 kare, d8 eşkenar dörtgen, d10/d100 uçurtma, d12 beşgen, d20 altıgen.
  - Normal: 0,8 sn döner, 0,8 sn sonucu gösterir ("d20: 14 +5 = 19"). Hızlı: 0,3 + 0,45 sn. Kapalı: yok.
  - Doğal 20 altın ve "KRİTİK"; doğal 1 kırmızı ve "KRİTİK HATA". Avantaj/dezavantajda iki d20, sayılmayan soluk.
  - Hareketi azalt açıksa dönme yok, yalnızca sonuç.
  - Kuyruk sırayla oynar. Tepsi tıklamaları engellemez (pointer-events: none); ekrana herhangi bir dokunuş kuyruğu atlar, tıklama oyunda da işler.
  - Yalnızca canlı zarlar oynar: kayıttan yüklenen oturumun eski zarları oynamaz, yeni kurulan savaşta inisiyatif zarları oynar.
  - Çakışma: isabet/hasar işaretleri ve hasar efektleri bu adımın zarları bitince başlar (en çok 3,2 sn gecikme).
  - Ayar savaş menüsünde ("Zar animasyonu: Normal/Hızlı/Kapalı"), bu cihazda hatırlanıyor.

## 2026-10-22 — Yükleme ve görseller (Görev I)

- **Giriş videosu döngüsü:** Arka planlar video (`public/acilis/*.mp4`, 10 sn, 24 kare/sn).
  - Sorun: ilk ve son kare birbirini tutmuyordu. Dikiş SSIM'i 0,90–0,97, komşu karelerde 0,93–0,999; `loop` her 10 saniyede sıçrıyordu.
  - Çözüm: çapraz geçişli döngü (`npm run acilis`, ffmpeg). Video 1. saniyeden başlıyor; son 1 saniyesi baştaki ilk saniyeye karışıyor. Süre 9 sn.
  - Dikiş SSIM'i artık komşu kare düzeyinde, örneğin pc-dark 0,910 → 0,983 (komşu 0,989), pc-light 0,950 → 0,997.
  - Ham videolar `assets-ham/acilis/` altında. Bit hızı özgün videoyla sınırlı; dosyalar küçüldü.
  - Poster artık videonun ilk karesi, poster → video geçişinde sıçrama yok.
  - MP4 (H.264) yanında WebM (VP9) yedeği var. H.264 oynatamayan Chromium/Linux önceden hep posterde kalıyordu.
  - Hata düzeltmesi: React `<source>` hatasını `<video onError>`'a da iletiyordu; ilk kaynak açılamayınca video tümden kaldırılıyordu. Artık yalnızca son kaynak da açılamazsa düşüyor.
- **Tema geçişi:** İki temanın katmanı da çiziliyor.
  - İki poster `index.html`'de ekran yönüne göre önyükleniyor.
  - Görünmeyen temanın videosu, görünen video oynayınca (en geç 4 sn sonra) arka planda yükleniyor ve duraklatılmış bekliyor. Veri tasarrufu açıksa yüklenmiyor.
  - Geçişte yeni katman 0,4 sn'de beliriyor, eski katman o bitene dek altında kalıyor; boş kare yok.
  - Bedeli: iki temanın videosu da iniyor. pc 548 kB, telefon 901 kB (mobil-dark videosu tek başına ~500 kB).
- **Karakter görselleri:**
  - Rozetler (44–48 px) artık 96 px kopyayı kullanıyor (`public/characters/kucuk/`, `npm run karakter-kucuk`): ortalama 22 kB → 3,5 kB. Haritadaki jeton büyük görselde kaldı.
  - Rozet `<img loading="lazy">`; ilk ekrandakiler (oyuncu listesi, oluşturucu) `eager`. Yüklenene dek iskelet (kayan parıltı), görsel gelince yumuşakça beliriyor.
  - Önyükleme: giriş ekranında kayıtlı karakterlerin küçük jetonları; oluşturucuda türün ve görünümün bütün sınıf jetonları (boşta).
- **Ana parça:** Savaş, Game Master ve durum ekranları ayrı parça (`React.lazy`); Game Master ekranına girilince savaş parçası önceden indiriliyor. Ana parça 549,6 kB → 424,9 kB (gzip 173,5 → 136,3 kB).
- **Ölçüm** (`npm run olcum`): üretim derlemesi, Chromium (headless), CDP ağ kısıtlaması, boş önbellek, 3 tekrarın ortancası.
  - "Video oynar" önceden ölçülemiyordu: headless Chromium H.264 oynatmaz, eski sürümde yedek yoktu.

| Ağ | Ekran | Arka plan görünür | Video oynar | Tema geçişinde boşluk | Liste (5 görsel) | Yeni karakter | Sınıf değişimi | Karakter görselleri |
|---|---|---|---|---|---|---|---|---|
| Hızlı 3G | pc | 1966 → 1496 ms | — → 2483 ms | 411 → 0 ms | 782 → 71 ms | 81 → 77 ms | 313 → 50 ms | 128 → 57 kB |
| Hızlı 3G | telefon | 1995 → 1671 ms | — → 2632 ms | 677 → 0 ms | 775 → 73 ms | 79 → 69 ms | 315 → 50 ms | 128 → 57 kB |
| 4G | pc | 497 → 379 ms | — → 684 ms | 111 → 0 ms | 229 → 66 ms | 69 → 73 ms | 129 → 48 ms | 128 → 57 kB |
| 4G | telefon | 502 → 416 ms | — → 687 ms | 160 → 0 ms | 230 → 75 ms | 78 → 71 ms | 134 → 50 ms | 128 → 57 kB |

## 2026-10-22 — Karakter yaratma ve metin düzeni (Görev H)

- **Dil (TR/EN):**
  - Bütün ekran metinleri tek dosyada: `src/i18n/strings.ts`. `tr` kaynak, `en` aynı tipte; TypeScript eksik ya da fazla anahtarı yakalıyor.
  - Okuma `t()` ile. Seçim giriş ekranında; tarayıcı belleğinde (`rpg-battle-lang`) hatırlanıyor, yoksa Türkçe.
  - Dil değişince kök yeniden çiziliyor. Savaş günlüğü olaylardan yeniden yazıldığı için eski satırlar da yeni dile geçiyor.
  - Çevrilen yerler: giriş, oyuncu, karakter oluşturucu, Game Master kurulumu, durum, savaş ekranı (menü, ipuçları, balonlar, bilgi kutusu, özet), savaş günlüğü, tema düğmesi.
  - **Henüz çevrilmeyenler** (EN'de Türkçe görünür):
    - motorun hata ve gerekçe metinleri (`src/battle`, `src/rules`'ta ~160 `fail(...)`; olayların `reason`, `note`, `text` alanları);
    - veri metinleri: tür özellikleri, eşya açıklamaları, harita, varyant ve zemin adları, harita kural notları.
  - Oyun terimleri SRD'deki İngilizce adlarıyla: sınıf, tür, beceri, büyü, durum, silah özellikleri (Finesse, Heavy…).
- **"GM" → "Game Master"** bütün ekran metinlerinde. Kod kimliği (`gm`) aynı.
- **Donanım açıklamaları** (`src/ui/equipmentText.ts`) yalnızca veri alanlarından üretiliyor.
  - SRD 5.2.1 tablosundan eksik alanlar eklendi:
    - zırh Güç şartı: Chain Mail 13, Plate Armor 15;
    - silah özellikleri Heavy, Two-Handed, Loading, Ammunition.
  - Zırh seçim listesinde bir satır özet (AC, DEX sınırı, Güç, Gizlenme dezavantajı), altında ayrıntı.
  - Silah ve eşya çiplerinde bir satır özet; üzerine gelince ayrıntı. Seçilenlerin ayrıntısı listenin altında (dokunmatik için).
  - Mastery özelliği gösterilmiyor; oyunda uygulanmıyor.
- **Zırh Güç şartı artık uygulanıyor:** Güç skoru düşükse hız 10 ft azalıyor (SRD 5.2.1 Armor: Strength). Simülasyon partisinde şartı karşılamayan yok; denge değişmedi.
- **Özet:** Ad, seviye, tür ve sınıf; HP (zar); hız, yetkinlik, inisiyatif.
  - AC bileşenleriyle gösteriliyor, örneğin "AC 19 = zırh 16 (Chain Mail) + kalkan 2 + Ring of Protection +1".
  - Gizlenme dezavantajı ve Güç uyarısı da yazıyor.
  - Ana saldırı: seçilen silahlardan ortalama hasarı en yüksek olan.
  - Ana büyüler (en çok 5, DC ve saldırı), geçmiş bonusu ve geçmiş becerileri.
- **Geçmiş bonusu:** Her skorda −/+ sayacı var.
  - Yalnızca +2/+1 ya da +1/+1/+1 kalıbına götüren artışlar açık (`canRaiseBonus`).
  - Bir skora en fazla +2; üç +1 verilince +2 kapanır.
- **Giriş metni** (onay bekliyor): "Altıgen haritalarda D&D 5. sürüm (SRD 5.2.1) kurallarıyla sıra tabanlı taktik savaşlar. Oyuncular karakterlerini oluşturur, Game Master haritayı ve düşmanları seçip savaşı yönetir; hepsi tek cihazda."

## 2026-10-21 — Hasar efekti sprite'ları (Görev D ek parça)

- **Görseller:** 5 efekt şeridi Gemini ile üretildi (`assets-ham/efektler/*.jpg`). **Mağazaya çıkmadan önce ticari kullanım koşulları kontrol edilecek.**
- **İşleme** (`npm run efektler`, `scripts/efektler.mjs`, sharp):
  - **Kare tespiti:** çerçeve dikdörtgenlerinden; sabit eşit bölme yok.
    - Uzun dikey koyu çizgiler (yüksekliğin ≥ %20'si ve ≥ 100 px) dikey kenar sayılıyor.
    - İki kenar arası, üstte ve altta yatay koyu kenar varsa kare; macenta aralıklar ve dosyalardaki tam genişlik süs çizgileri kare sayılmıyor.
    - Asidin zeytin rengi çerçevesi de koyu sayılıyor.
  - **Bulunan:** burn 8 kare (genişlikler 510–636 px, eşit değil), poison, freeze, acid ve bleed 6'şar kare. Kareler çerçevenin içinden, kenar + 4 px payla kırpılıyor.
  - **Arka plan:** macenta/pembe ton siliniyor: R ve B yüksek ve neredeyse eşit (|R−B| ≤ 25), G belirgin düşük. JPG gürültüsü, son karelerdeki açık pembe zemin ve iç parazitler (poison 5. karenin sağ kenarındaki şerit) bu kurala giriyor.
  - **Despill:** arka plana komşu parlak pembe kenar pikselleri siliniyor; koyu mor dış çizgiler korunuyor.
  - **Zehir:** mor kabarcık ve duman gerçek içerik (B, R'den ~40 fazla); korunuyor.
  - **Buz ve kan:** mor/pembe gerçek içerik olmadığından, macentaya karışmış pikseller renk olarak düzeltiliyor:
    - buzda kırmızı yeşile çekiliyor (lavanta → buz mavisi);
    - kanda mavi kırmızıya göre sınırlanıyor (pembe → kan kırmızısı).
  - Parçacık efektleri olduğu için küçük parçalar atılmıyor.
  - **Ölçek:** her efektte bütün karelere tek ölçek ve tek çıpa; kare başına ortalama yok.
    - Pencere, içeriklerin kare çerçevesine göre birleşik sınırı.
    - Asit ve kanamada pencerenin üstü karenin üstüne sabit (damla üstten başlıyor).
    - Kareler 128×128, nearest-neighbor; efekt başına tek yatay şerit `public/efektler/<ad>.webp`.
  - `data/efekt-sprites.json` kare sayısı, kare boyutu, kare süresi (110 ms) ve eşlemeyi tutuyor.
- **Oyunda:**
  - Tur başı/sonu durum ve zemin hasarında jetonun üstünde bir kez oynuyor. Eşleme: ateş → burn, zehir → poison, soğuk → freeze, asit → acid.
  - Kanama hasarı olarak Infernal Wound (Bearded/Horned Devil) süreli hasarı → bleed; oyunda başka kanama yok.
  - Sprite jeton çapının ~1,3 katı; altıgenden taşabiliyor, tıklamayı engellemiyor. CSS `steps()` ile kare kare kayıyor; son karede görünmez oluyor.
  - Hasar sayısı kalıyor; emoji ve CSS animasyonunun yerine sprite geçiyor.
  - Hareket azaltmada yalnızca sayı görünüyor.
  - Sprite önceden yükleniyor; yüklenemezse eski emoji ve CSS animasyonuna düşüyor (tarayıcıda dosyalar engellenerek doğrulandı).
  - Kayıt yüklenince eski hasarlar oynamıyor (aynı sistem).

## 2026-10-21 — GM ekranı düzeltmeleri (Görev G)

- **Örnek karakterler:** Oyuncu ekranındaki "Örnek karakterleri ekle" ve GM ekranındaki "Hazır savaş" kaldırıldı.
  - Örnek karakterler `src/screens/fixtures.ts`'e taşındı; uygulama bu dosyayı içe aktarmıyor, yalnızca testler ve `check:harita` kullanıyor.
  - Karakter yokken iki ekranda da "Önce karakter oluştur" boş durum metni görünüyor.
- **Parti sınırı:** `MAX_PARTY = 6` (`src/app/limits.ts`, tek yer).
  - Oyuncu ekranında 6 karakterde "Yeni karakter" pasif oluyor; "En fazla 6 karakter (n/6)" bilgisi var. Karakter oluşturucuda da bilgi satırı var.
  - GM ekranında 6 seçilince diğer karakterler pasif oluyor. `planProblems` 6'dan fazlasını reddediyor.
  - Kodda eski bir 5 sınırı yoktu; yalnızca CLAUDE.md'de yazıyordu.
- **Düzen:** Harita bölümü Düşmanlar'ın üstüne taşındı. Ortam filtresi (haritaya uyanlar, "Tüm canavarlar") aynı kaldı.
- **Güç seviyesi filtresi:** Aramanın yanında çoklu seçim açılır menü var; hiçbiri seçili değilse hepsi gelir. Seçili canavarlar filtreden bağımsız hep listede.
  - Kademeler `src/data/monsterEnv.ts` `TIERS`'ta tanımlı; `monster-ortamlari.json`'da değil.
  - "Ufak" yalnızca görünen adda "Giriş Seviye" oldu; kimlik `ufak` aynı.
- **Özel canavar:**
  - Saldırı alanı en fazla 300 karakter (`CUSTOM_ATTACK_MAX`); sayaç gösteriliyor.
  - Eklenen özel canavar onayla silinebiliyor.
  - CR artık "?" değil, otomatik hesaplanıyor; GM açılır listeden düzeltebiliyor.
- **CR formülü** (`src/rules/crEstimate.ts`, tablo `data/cr-tahmini.json`; DMG yönteminin basitleştirilmiş yaklaşığı):
  - **Savunma CR'si:**
    - HP'den: ≤6 → 0, ≤35 → 1/8, ≤49 → 1/4, ≤70 → 1/2, sonra 71 HP'de CR 1 ve her 15 HP'de +1.
    - AC, o CR için beklenen AC'den her 2 puan fark için bir basamak kayar. Beklenen AC: CR ≤3: 13, 4: 14, 5–7: 15, 8–9: 16, 10–12: 17, 13–16: 18, 17+: 19.
  - **Saldırı CR'si:**
    - Tur başına ortalama hasardan (zar ortalaması × saldırı sayısı; özel canavarda 1): ≤1 → 0, ≤3 → 1/8, ≤5 → 1/4, ≤8 → 1/2, sonra 9'da CR 1 ve her 6 hasarda +1.
    - Saldırı bonusu, beklenenden her 2 puan fark için bir basamak kayar. Beklenen bonus: CR ≤2: +3, 3: +4, 4: +5, 5–7: +6, 8–10: +7, 11–15: +8, 16: +9, 17–20: +10, 21–23: +11, 24–26: +12, 27–29: +13, 30: +14.
  - **Sonuç:** İki CR'nin sayısal ortalamasına en yakın CR basamağı (eşitlikte küçük olan). Sınırlar 0 ve 30.
- **Aynala:**
  - Kaldırılan şey, GM ekranının Harita bölümündeki "Aynala" onay kutusu (haritayı ve başlangıç bölgelerini yatay çevirme). Harita ön izlemesindeki çevirme de kaldırıldı; yeni savaşlar hep aynasız.
  - Motor aynalamayı desteklemeye devam ediyor (`mirrored`); eski aynalı kayıtlar açılıyor.
  - `check:harita` aynalı haritaları artık eski kayıt yoluyla sınıyor: aynalı bir savaş kaydı üretip "Kayıtlı savaşa devam et" ile açıyor.
  - Denge simülasyonu zaten aynasızdı.
- **Değişen testler:** "Ufak" kademe adı → "Giriş Seviye" (istenen değişiklik). GM ekranı testleri artık `onAddCharacters` vermiyor. Örnek karakterler `fixtures.ts`'ten geliyor.

## 2026-10-21 — Ham görseller public/ dışında

- Ham (işlenmemiş) görseller `assets-ham/` altında; Vite yalnızca `public/`'i kopyaladığı için build çıktısına girmez (önceden 8 masum JPG'si, ~12 MB, dağıtılan oyuna giriyordu).
- Masumlar: `assets-ham/masumlar/masum-1..8.jpg` → `npm run masumlar` → `public/masumlar/*.webp` (git mv ile taşındı, geçmiş korunur).
- Efekt sprite'ları (Görev D ek parça, bekliyor): ham `assets-ham/efektler/` (burn, poison, freeze, acid, bleed `.jpg`) → `npm run efektler` → `public/efektler/`. Görev D ek tanımındaki "public/efektler-ham/" yolunun yerine bu yol geçerli.

## 2026-10-21 — Masum görselleri (8) ve GM seçimi (Görev F ek)

- **Görseller:** 8 masum görseli Gemini ile üretildi (`assets-ham/masumlar/*.jpg`). **Mağazaya çıkmadan önce ticari kullanım koşulları kontrol edilecek.**
- **İşleme** (`npm run masumlar`, `scripts/masumlar.mjs`, sharp):
  - Arka plan, kenardan başlayan flood-fill ile siliniyor. Eşik sıkı ve tona göre: G ≤ 45, R ve B ≥ 150 ve birbirine yakın. Koyulaşmış macenta lekeler de bu tona giriyor (masum-1'in üst kenarındaki leke).
  - Kol ile gövde arası ve kova sapının içi gibi kapalı boşluklar yalnızca saf arka plan rengindeki piksellerden tohumlanıyor. Ten ve giysi renklerine dokunulmuyor.
  - Despill iki aşamalı: arka plana 2 px içindeki macentaya kaymış pikseller siliniyor; küçültülmüş tuvalde kalan koyu macenta kenar pikseli de siliniyor ya da griye çevriliyor.
  - Ana figüre bağlı olmayan küçük lekeler atılıyor.
  - Bütün figürlere aynı sabit ölçek uygulanıyor: en uzun figür (Tüccar) 120 px; çocuklar 105 ve 90 px kalıyor. Görüntüler 128×128, nearest-neighbor.
  - Ayak hizası 124 px. Yatayda kütlenin medyanına göre ortalanıyor; ince baston ve sepet merkezi kaydırmıyor.
- **Veri:** `data/masumlar.json` kimlik, görünen ad ve görsel yolunu tutuyor (masum-1..8). Önceki 5 placeholder ve `data/masum-jetonlar.json` kaldırıldı.
- **GM seçimi:**
  - Kurulumda bir masuma dokununca 8 görselli küçük resim ızgarası açılıyor, her resim adıyla.
  - Seçim `choose_civilian_art` komutu ve `civilian_art` olayıyla yapılıyor; olay günlüğe giriyor. Aynı görsel birden çok masumda kullanılabiliyor.
  - GM seçmezse görsel, savaşın tohumuyla karışık atanıyor (`civilianArtSeed`) ve başlangıç olayında saklanıyor.
- **Kayıt sürümü 4:**
  - Yeni olay `civilian_art` ve masumdaki `gorselId` alanı geldi.
  - Sürüm 3 kayıtlar yüklenmeye devam ediyor (olayları sürüm 4'ün alt kümesi). `gorselId` alanı olmayan masum, baştan oynatmada tohum 1'le N. sıradaki görsele düşüyor.
- **Bilgi kutusu ve ayrıntı paneli** masumu görünüm adıyla gösteriyor ("Masum: Tüccar").

## 2026-10-21 — Savaş alanı düzeltmeleri (Görev F)

- **Yerleşim:**
  - Kurulumda GM herkesi (karakterler dahil) haritanın her geçerli altıgenine koyar: jetonu sürükleyip bırakarak ya da jetona, sonra altıgene dokunarak.
  - Geçersiz altıgenler: engel, lav, derin su, harita dışı ve dolu altıgen. Alev ve tuzak GM'in kararına bırakıldı.
  - Oyuncu bağlamı eskisi gibi yalnızca kendi bölgesine yerleştirir.
  - Varsayılan konumlar değişmedi. Bütün harita, varyant, aynalama ve masum kipleri eski ve yeni kodla karşılaştırıldı; konumlar birebir aynı. Denge simülasyonları varsayılanı kullanıyor.
  - Yerleşim zaten bir olaydı (`placed`), günlüğe girer. Kayıt biçimi değişmedi; eski kayıtlar açılıyor.
- **Masumlar:**
  - Hiçbir eylem yapmazlar; motor masumun `end_turn` dışındaki her komutunu reddeder. Yapay zekâ onlara tur vermez.
  - Sıraları uyuyan ejderha gibi atlanır. Sıra bir masumla başlıyorsa savaş başlarken atlanır.
  - Yerinde dururlar ve hasar alırlar. Tur başı etkileri (yanma gibi) sürer.
- **Masum jetonları:** `public/masumlar/masum-1..5.webp` şimdilik placeholder siluetler (köylü, çocuk, tüccar, yaşlı, kadın); gerçek görseller aynı adlarla değişecek. Liste `data/masum-jetonlar.json`'da.
  - Masumlara tohumla karışık atanır (`civilianArtSeed`). Arayüz her yeni savaşta rastgele bir tohum verir; simülasyon 1 kullanır.
  - Atanan görsel savaşın başlangıç olayında saklanır, yüklenen kayıtta değişmez. Savaşın kendi zarlarını tüketmez.
- **Eylem butonları:**
  - O an yapılamayan buton pasif: `aria-disabled`, tıklanmaz. Dokununca ya da üzerine gelince açıklamada nedeni görünür.
  - Eskiden "nedenli" butonlar tıklanabiliyordu (uyarı gösteriyordu): Gizlen, Yardım, Kalk, Atla, yakalanmışken Hareket. Saldır, İt ve İşaret/Silah menzilde hedef yokken tıklanabiliyordu.
  - Karakterin hiç yapamayacağı butonlar gösterilmez:
    - Büyü yalnızca büyüsü olan karakterde.
    - Atılım ve İkinci Soluk yalnızca Fighter'da. Hak bitince artık gizlenmiyor, nedeniyle pasif.
  - Kalk, Kaçmaya çalış, Çık, Çek ve Atla yalnızca durumu varken görünür (eskisi gibi).
- **Nefes kararı:**
  - Menüdeki "Nefes" butonu Dragonborn nefesi değil, Fighter'ın Second Wind özelliğiydi. Adı "İkinci Soluk" oldu.
  - Oyuncu Dragonborn'larının Breath Weapon'ı oyunda yok; bu yüzden hiçbir karakterde "Nefes" butonu yok.
  - Canavar nefesi ve yapay zekâ değişmedi.
  - Öneri: SRD 5.2.1 Dragonborn Breath Weapon (Attack eyleminde bir saldırının yerine, 15 ft koni ya da 30 ft çizgi, DEX save, 1d10 ve seviyeyle artan, uzun dinlenmeye kadar PB kez) ayrı görev olarak eklenirse "Nefes" butonu yalnızca Dragonborn'da görünür.
- **Hareket menüsü:**
  - Hareket butonu Yürü, Koş ve Geri Çekil alt menüsünü açar; "‹ Geri" ana menüye döner.
  - Üst seviyeden Koş ve Ayrıl kalktı. "Ayrıl" metni her yerde "Geri Çekil" oldu (buton, açıklama, günlük). Kod kimliği `disengage` aynı kaldı.
  - Koş ve Geri Çekil'in eylem kuralları aynı: eylem, Rogue'da bonus eylem.
- **Hedef seçimi:**
  - Saldır, Büyü, İt, Yardım, Çek ve İşaret/Silah kipinde seçilebilir hedefin altıgeni kırmızı dolguyla, kalın, kesikli ve yanıp sönen çerçeveyle işaretlenir. Jetonunda kesikli halka ve nişangâh simgesi var.
  - Seçilemeyen jetonlar soluk ve gri.
  - Renk körü için kalınlık, kesik çizgi ve simge de ayırt eder. Hareket azaltmada yanıp sönme yok.
- **Sonuç animasyonu:**
  - Hedefin (ya da zarı atanın) üstünde ~1 sn rozet çıkar:
    - saldırı: ✔ İsabet / ✔ Kritik / ✖ Iska;
    - kurtarma: ✔ Kurtardı / ✖ Kurtaramadı;
    - itme: ✔ Direndi / ✖ Yere düştü ya da İtildi;
    - yakalamadan kaçış, beceri kontrolü ve riskli atlama.
  - ✔ yeşil düz çerçeve, ✖ kırmızı kesikli çerçeve.
  - Hasar animasyonunun sistemini kullanır: yalnızca canlı olaylarda oynar, kayıt yüklenince oynamaz. Hareket azaltmada yalnızca metin görünür.
- **Denge:**
  - Masumlar kaçmayınca Taverna "4 masum ortada" %86'ya çıktı (sınırın 1 üstü).
  - 9 düşman yeri dolu olduğu için 1 Tough, Spy oldu. Sonuç %82 / %60 / %61 (`docs/harita/DENGE.md`).
- **Değişen test:** "GM karakteri yerleştiremez" testi artık GM'in yerleştirebildiğini sınıyor (istenen davranış).

## 2026-10-21 — Yakalama, Prone, hücum ve süreli hasar (Görev E)

- **Grappled (SRD 5.2.1):**
  - Hedefin hızı 0; yürüyemez, atlayamaz, ayağa kalkamaz. Durum süresiz, kendi kurallarıyla biter.
  - Kaçış: eylem (`escape_grapple`). d20 + Athletics ya da Acrobatics (yüksek olan) ≥ kaçış DC'si.
  - Yakalayan yürürse hedefi peşinden sürükler (yolun bir önceki altıgenine). Sürüklerken her adım iki kat hareket harcar (yarı hız). Hedefin yeri doluysa yakalama biter.
  - Yakalayan düşer, ölür, uyur ya da etkisiz (Incapacitated) kalırsa, ya da araya mesafe girerse (itme gibi) yakalama biter. Her komuttan sonra denetlenir.
  - "Until the grapple ends, the target has the Restrained condition" olanlarda Restrained da eklenir ve yakalamayla birlikte kalkar (Couatl, Salamander, Chain Devil, Crocodile, Giant Octopus, Kraken, Roc, Tarrasque).
  - Boyut sınırı ("Medium or smaller") uygulanır. Zaten yakalanmış hedef yeniden yakalanmaz.
  - Yapılmadı: yakalananın yakalayan dışındaki hedeflere dezavantajı; oyuncunun kendi yakalama eylemi; bir canavarın aynı anda tutabileceği hedef sayısı.
- **Prone:**
  - Ayağa kalkmak hızın yarısı kadar hareket harcar (`stand_up`, "Kalk" düğmesi). Yerdeyken yürümeye ya da atlamaya başlayınca kendiliğinden kalkar. Hareket yetmezse kalkamaz.
  - Önceden Prone kalıcıydı (kalkma yoktu).
  - Yakın saldırı avantajlı, uzak saldırı dezavantajlı, yerdekinin kendi saldırısı dezavantajlı (bunlar zaten vardı).
  - Rider'daki boyut sınırı ve kurtarma zarı uygulanır.
- **Hücum (charge):** 18 rider'da "X+ ft düz koşup hemen vurursa" var (2'si hasar değişimi: Goat, Giant Seahorse). Turdaki son düz koşu (`run`) en az X ft ve hedef koşu yönünde bitişikse tutar: ek hasar ve/veya Prone.
  - Görevdeki 23 sayısının rider dışındaki kısmı bonus eylem olarak duruyor: Troll ve Xorn "Charge", Sahuagin "Aquatic Charge", Centaur "Trampling Charge". Bunlar rider değil, uygulanmadı.
- **Süreli hasar:** `ConditionTimer.dot` alanı süreli durumun her tur başında hasar vermesini sağlar.
  - Pit Fiend Bite: Poisoned, save ends, tur başı 6d6 zehir.
  - Vrock Spores: tur başı 1d10 zehir.
  - Bearded Devil Infernal Glaive (CON DC 12) ve Horned Devil Infernal Tail: Infernal Wound, 1 dakika, tur başı 1d10 / 3d6.
  - Otyugh Bite: Poisoned 1 saat. Kalıcı HP azalması yok.
  - Hasar animasyonu (Görev D) bu hasarda da oynar.
- **Rider üretimi:** `scripts/riders-uret.cjs` metinden `data/attack-riders.json` üretir.
  - Elle yazılan `condition-effects.json` önceliklidir.
  - "Until the start/end of X's next turn", "for 1 minute/hour" ve "repeats the save" kalıpları süreli duruma çevrilir.
- **Sayılar (325 rider):**
  - 217 uygulandı (Görev C'de 109).
  - 31 kısmen, 16 süreli etki (elle).
  - 61 hiç uygulanmıyor. Nedenler (bir rider birden çok neden taşıyabilir):
    - süresi ayrıştırılamayan durum 26,
    - lanet 17,
    - özel metin 14,
    - hız ya da eylem kısıtı 12,
    - ikinci aşama 11,
    - itme/çekme 11,
    - HP eşiğiyle öldürme 8,
    - sürekli hasar 8,
    - özel hasar 7,
    - 0 HP'de tetiklenen 6,
    - yapışma/ele geçirme 4,
    - yutma 2.
- **Yapay zekâ:**
  - Yakalanan önce kaçmayı dener. Yerdeyken, hareketi yetiyorsa önce kalkar.
  - Yakalayan önce yakaladığına vurur.
  - Kaçın ve Yardım kullanılmaz.
- **Arayüz:**
  - Jetonda ✊ (yakalandı) ve ⤵ (yerde) simgeleri.
  - "Kaçmaya çalış" ve "Kalk" düğmeleri, açıklamalı. Yakalanmışken "Hareket" gerekçeyle kapalı.
- **Kayıt sürümü 3:** Yeni olaylar (`grappled`, `grapple_ended`, `grapple_escape`, `stood_up`) var. Sürüm 2 kayıtlar yüklenmez.
- **Denge:**
  - Yalnızca Düz aralık dışına düştü (%51). 4 Wolf yerine 2 Wolf ile %66.
  - Çöl %64'ten %57'ye indi, aralıkta.
  - Ayrıntı `docs/harita/DENGE.md`'de.
- **Değişen testler:**
  - Hill Giant Tree Club artık yere düşürüyor (multiattack olay listesi).
  - Wolf Bite Prone'u artık uygulanıyor; günlük örneği Wererat lanetine taşındı.
  - Buzda kayan karakterin hata metni değişti: yürümeden önce kalkmak gerekiyor.
  - Düz XP'si 1800'den 1700'e indi.

## 2026-10-21 — Tur başı hasar animasyonu, jetonlar tam ortada (Görev D)

- **Motor incelemesi:** Tur başı ve sonu hasar veren durumlar zaten vardı. Hepsi `map_effect` olayı üretir; hasar `damage.applied`, türü `damage.type`'ta.
  - Burning: tur başı ateş, sonra DEX save ile söner.
  - Lav kenarı: tur başı ateş.
  - Batak: tur başı zehir ve süren batak zehri.
  - Alevde turu bitirme (ateş), kavurucu sıcak (ateş), dondurucu soğuk (soğuk).
  - Spirit Guardians'ın tur sonu hasarı `save_resolved` + `aura`.
  - `condition-effects.json`'daki durumlar hasar vermez.
- **Animasyon** (`src/ui/damageFloats.ts`, yalnızca arayüz):
  - Bu olaylardan jetonun üstünde ~0,9 sn tek seferlik animasyon ve hasar sayısı (-N):
    - ateş 🔥 (yükselir, titrer),
    - zehir ☠ (baloncuk),
    - soğuk ❄ (kristal),
    - asit 💧 (damla),
    - diğer türler kırmızı -N.
  - Birden çok jetonda aynı anda olursa 220 ms arayla sırayla.
  - Yalnızca canlı gelen yeni olaylarda oynar. Kayıt yüklenince eski olaylar oynamaz (tarayıcıda doğrulandı).
  - Hareket azaltmada yalnızca sayı ve simge. `pointer-events: none`.
- **Kalıcı simgeler:** Yanıyor 🔥 (Burning), zehirli ☠ (Poisoned ya da batak zehri). Oyunda "donmuş" durumu yok; `Frozen` eklenirse ❄ gösterilir.
- **Jeton merkezi:** Resimlerdeki figür iki eksende de ortalı (en çok %0,2). Kayma iki kaynaktan geliyordu:
  - Nefes animasyonu alt-ortadan ölçekliyordu (`transform-origin: 50% 90%`); figür nefeste yukarı kayıyordu (PC'de ejderha 3,2 px, Tiny 0,3 px).
  - Zemin gölgesi aşağı kaydırılmıştı (4–6 px).
  - Nefes artık merkezden ölçekleniyor, gölge simetrik. Ölçüm: PC, dar telefon ve yatay telefonda, animasyon açıkken, Tiny'den Gargantuan'a ve 4 ırk ölçeğinde fark en çok 0,03 px.

## 2026-10-21 — Canavar saldırı ek etkileri (rider) uygulanıyor (Görev C)

- **Veri:** `data/attack-riders.json` (monsters.json'a dokunulmadı; metinden tek seferlik betikle yapılandırıldı). Canavar verisiyle birlikte tembel yüklenir.
  - `extra`: her isabette ek hasar; kritikte zarlar ikiye katlanır; hedefin direnç ve bağışıklığı uygulanır.
  - `conditional`: avantajlı isabette ek hasar (Goblin Warrior, Goblin Boss).
  - `replace`: koşul tutarsa hasar ifadesi değişir: avantajlı Chimera, Bloodied (yarı canın altında) sürüler, Bloodied hedefe Blood Hawk.
  - Süreli durumlar `condition-effects.json`'da kaldı. Aynı saldırıda hem ek hasar hem durum varsa (Wyvern +7d6 poison ve Poisoned) ikisi de birer kez uygulanır.
- **Sayılar:**
  - 236 canavarın 325 saldırısında rider var.
  - Tam uygulanan: 109 ek hasar + 13 süreli etki.
  - Kısmen: 35 (hasar uygulanıyor, kalan metin uygulanmıyor).
  - Hiç uygulanmayan: 168.
  - Uygulanmama nedenleri:
    - durum etkisi `condition-effects.json`'da tanımlı değil: 45
    - Grappled: 39
    - Prone: 29
    - özel metin: 24
    - hücum (20 ft düz koşu) izlenmiyor: 23
    - lanet ya da kalıcı etki: 18
    - hız/eylem kısıtı: 12
    - sürekli hasar (her tur): 7
    - itme: 3
    - HP eşiğiyle öldürme: 3
  - Kurtarma zarlı ek hasarların üçü de (Pit Fiend, Bearded Devil, Otyugh) her tur süren hasar; uygulanmadı.
- **Günlük:** Uygulanan ek hasar "ek necrotic: …" diye yazılır. Uygulanamayan kısım "ek etki uygulanmadı (neden): metin" diye yazılır.
- **Kayıt sürümü 2 kaldı:** Olay biçimi değişmedi; `attack_resolved.extra` zaten vardı.
- **Denge:**
  - 6 senaryo aralık dışına düştü; ortam listesinden yeniden kuruldu (DENGE.md).
  - Wyrmling %88 kabul edilen sapma (iki deneme).
  - Şans kipi ve Wyrmling'te Harpy yerine Volkan canavarları.
- **Yapay zekâ:** Davranışı değişmedi; Kaçın ve Yardım'ı kullanmıyor.

## 2026-10-16 — Durum süreleri; Kaçın (Dodge) ve Yardım (Help); Hazırla (Ready) önerisi

**Durum süreleri** (`src/battle/durations.ts`):
- **Biçim:**
  - `Combatant.conditions` (durum adları) kaldı; kural, arayüz ve yapay zekânın hepsi onu okuyor.
  - Süre yanında: `conditionTimers: ConditionTimer[]` (`condition`, `ownerId`, `end: turnStart|turnEnd`, `count`, isteğe bağlı `save`).
  - Durum hangi yolla kalkarsa kalksın (konsantrasyon, iyileşme, Burning), sayacı da düşer (`pruneTimers`).
- **Süre türleri:**
  - Belirli tur sayısı (`count`).
  - "Sahibinin sonraki turunun başına dek" (`turnStart`, `count` 1).
  - "Sonraki turunun sonuna dek" (`turnEnd`; sahibi şu an sıradaysa bu turun sonu sayılmaz, `count` 2).
  - "Save ends": hedef her kendi turunun sonunda yetenek ve DC ile kurtarma zarı atar.
  - Süresiz: sayaçsız durum, eskisi gibi.
- **Kancalar:**
  - Sırası biten savaşçının tur sonu ve sırası gelenin tur başı sayaçları işler.
  - Atlanan (ölü, uyuyan) savaşçının tur sonu da sayılır; sahibi ölen etki takılı kalmaz.
- **Yeni olaylar:**
  - `condition_timer`: sayaç azaldı.
  - `condition_save`: kurtarma zarı.
  - `condition_ended`: durum bitti; nedeni "süre doldu" ya da "kurtarma zarı başarılı".
  - `condition_changed` olayına isteğe bağlı `timer` alanı.
- **Etki tanımları:** `data/condition-effects.json`. `monsters.json` ve `spells.json` değişmedi.
  - **Canavar saldırıları (15):**
    - Wyvern Sting: Poisoned, wyvernin sonraki turunun başına dek.
    - Ghoul ve Ghast Claw: CON DC 10, Paralyzed, hedefin sonraki turunun sonuna dek.
    - Mummy Dreadful Glare: Frightened.
    - Ettercap Bite: Poisoned.
    - Giant Vulture Gouge: Poisoned.
    - Merrow Bite: Poisoned.
    - Homunculus Bite: CON DC 12, Poisoned.
    - Lion Roar: Frightened.
    - Quasit Scare: Frightened, save ends.
    - Dretch Fetid Cloud: Poisoned.
    - Otyugh Tentacle Slam: Stunned.
    - Vrock Stunning Screech: Stunned.
    - Giant Spider Web ve Ettercap Web Strand: Restrained, her tur sonu STR save (yaklaşık; SRD'de ağ kırılana dek).
  - **Büyüler ("save ends", en çok 10 tur):** Hold Person, Hideous Laughter, Blindness/Deafness, Fear (yaklaşık), Entangle ve Web (STR save, yaklaşık). Konsantrasyon bağı ayrıca sürer.
  - **Yapılmayanlar:**
    - 1 saat ya da 1 dakika süren ve "0 HP'de" tetiklenen zehirler (Pseudodragon, Phase Spider, Vampire Familiar).
    - Grappled (kaçış DC'si; süre değil) ve Prone (anlık).
    - Saldırıların ek hasar metinleri (`rider`), uygulanmıyor.
- **Değişen test:** `monsters.test` "hasarsız save saldırısı (Web)" artık Restrained'in uygulandığını da bekliyor (önceden "etkisi elle uygulanır" idi).
- **Kayıt sürümü 2:** Eski kayıtlar "yüklenemedi".

**Kaçın (Dodge):**
- Eylem; `Dodge` durumu, sonraki turunun başına dek.
- Saldıranlar dezavantajlı (görünmez saldıran hariç). DEX save'leri avantajlı (`saveMode`, bütün save noktalarında).
- Etkisizken (incapacitated) ya da hızı 0 iken (Grappled, Restrained) işe yaramaz.

**Yardım (Help):**
- Eylem; bitişik bir düşman seçilir (haritasız savaşta mesafe yok). Düşmana `Help:<taraf>` işareti konur.
- O tarafın o düşmana ilk saldırısı avantajlı; işaret saldırıda kalkar.
- Kullanılmazsa yardım edenin sonraki turunun başında biter.
- Görev metni "senin turunun sonuna kadar" diyordu; SRD 5.2.1'deki gibi "sonraki turunun başına dek" uygulandı, çünkü müttefikler yardım edenin turu bittikten sonra oynuyor.

**Yapay zekâ:** Kaçın ve Yardım'ı kullanmıyor. Saldırmaktan iyi olduğu durumlar dar, ve denge ölçümleri karşılaştırılabilir kalsın. Oyuncu ve GM elle kullanabilir.

**Öneri — Hazırla (Ready), uygulanmadı:**
- **Komut:** `ready { actorId, trigger, response }`. Eylem harcar, tepki (reaction) ayırır; sonraki turunun başında biter.
- **Tetikleyiciler (ilk sürüm):**
  - `enemyEntersReach`: bir düşman erişimime girerse.
  - `enemyEndsMoveInRange`: menzilimdeki bir düşman hareketini bitirirse.
  - `allyAttacked`: belirli bir müttefike saldırılırsa.
- **Yanıtlar:**
  - Tek saldırı (Attack eyleminin bir saldırısı, Extra Attack yok).
  - Yürüme (hızın kadar).
  - Hazırlanan büyü: slot hemen harcanır, konsantrasyon gerekir.
- **Uygulama:** Hareket ve saldırı komutlarından sonra (fırsat saldırısının yanında) `readyTriggers(state, events)`. Tetiklenince tepki harcanır. Yapay zekâ ilk sürümde kullanmaz.

## 2026-10-16 — Savaşı kaydet/yükle; canavar verisi tembel yüklenir

**Kaydet/yükle** (`src/app/battleSave.ts`):
- Tek kayıt yuvası (`localStorage`, anahtar `rpg-battle-save`).
- Yalnızca olay günlüğü saklanır: `{ version: 1, savedAt, events }`. Yüklerken olaylar baştan oynatılır (`replay`) ve aynı durum çıkar.
- Bütün mevcut senaryolarda günlük oynatılınca kurulumda ve oyun sırasında aynı durumun çıktığı kontrol edildi.
- Kayıt ne zaman yazılır:
  - Otomatik: her tur (round) değişiminde ve savaş bitince.
  - Elle: savaş menüsünde (≡) "Kaydet"; aynı menüde "Yükle".
  - Ana ekranda kayıt varsa "Kayıtlı savaşa devam et".
- Bilinmeyen sürüm, bozuk JSON, boş ya da oynatılamayan günlük hata fırlatmaz; "Kayıt yüklenemedi: …" mesajı gösterilir.
- Testler: kaydet → yükle → aynı durum ve aynı günlük; yüklenen savaş aynı komutla aynı yere gider; bozuk ve eski kayıtlar.

**Canavar verisi tembel** (`src/data/index.ts`):
- `monsters.json` (~480 KB) dinamik import ile ayrı parçada (build: ~320 kB, gzip 44 kB). Ana parça ~474 kB, büyük parça uyarısı gitti.
- Nasıl yüklenir:
  - `monsters` aynı dizi nesnesi, `loadMonsters()` içini doldurur.
  - Yüklenmeden `getMonster` "henüz yüklenmedi" hatası verir.
- Kim yükler:
  - Uygulama: yalnızca GM ekranına ya da savaşa girilince yükler; o sırada "Canavarlar yükleniyor…" gösterir. Ana ekranda yüklenmediği gerçek build'de doğrulandı.
  - Testler: `src/test-setup.ts` (vitest `setupFiles`).
  - Simülasyon betikleri: en üstte `await loadMonsters()`.

## 2026-10-16 — Eylem düğmesi açıklamaları

- Eylem menüsündeki her düğmenin kısa Türkçe açıklaması var (`src/ui/actionHints.ts`).
  - PC'de fareyle üzerine gelince, telefonda uzun basınca (450 ms) çıkar.
  - Uzun basış tıklama sayılmaz, eylemi çalıştırmaz.
  - Kullanılamayan düğmede neden de yazılır ("Şu an kullanılamaz: …").
- Devre dışı düğmeler artık `disabled` değil `aria-disabled`: Chrome devre dışı düğmede fare ve dokunma olaylarını iletmediği için açıklama gösterilemiyordu. Tıklama yine işlemez, görünüm aynı.
- Üst kenara yakın düğmede açıklama düğmenin altında gösterilir.

## 2026-10-16 — Adım 11 son tur: hedef aralık %55–85, Mağara ve Dungeon rosterleri

- **Hedef aralık:** normal senaryolarda %55–85; ejderha senaryolarında %60–80 kalıyor.
- **Mağara** (4100 XP): Troll, 2 Giant Spider, Ghoul, Darkmantle, Ettercap, Ogre, Phase Spider → %63.
- **Dungeon Koridor** (8400 XP, 14 düşman): 2 Wight, 2 Bugbear Stalker, 2 Mummy, 2 Ghast, 2 Ghoul, 2 Bugbear Warrior, Minotaur of Baphomet, Wraith → %58.
- **Dungeon Hazine odası** (7750 XP, 12 düşman) → %69.
- **Durum:**
  - Bütün normal senaryolar aralıkta.
  - Taverna "4 masum ortada" %86 (kabul edilen sapma, +1).
  - Merdiven %85, sınırda.

## 2026-10-16 — Adım 11: senaryo düşmanları ortam listesinden; altıgen bilgi kutusu

**Senaryolar** (`src/sim/balance.ts`; ayrıntı DENGE.md):
- Düz, Çöl, Volkan normal, Orman, Mağara, Dungeon (3), Kale ve Taverna (3) düşmanları kendi haritasının `monster-ortamlari.json` listesinden kuruldu. Düz için `duz-zemin`.
- Ejderha senaryolarına dokunulmadı. Canavar verisi ve ortam dosyası değişmedi.
- En çok 2 deneme.
  - Hedefte: Düz %69, Çöl %72, Orman %63, Taverna uzakta %71 / %67.
  - Kabul edilen sapma: Volkan %81, Merdiven %85, Kale %56, Taverna ortada %86, Hazine %95, Koridor %97, Mağara %98.
- Taverna'nın 3 senaryosu aynı düşman listesiyle; fark yalnızca masum yerleşiminden.
- `balance.test`: Düz XP beklentisi yeni rostere göre 1800.

**Altıgen bilgi kutusu:**
- Genişlik `min(40vw, kenar boşluklu)`; metin satır kaydırır, kesilmez.
- Telefon yatay ve PC'de kontrol edildi.

## 2026-10-16 — Jeton boyut ölçekleri (data/token-sizes.json)

- **Ölçekler JSON'da:** Tiny 0.3, Small 0.5, Medium 1, Large 1.5, Huge 2, Gargantuan 3.
  - 1, önceki Medium jeton boyu.
  - Oyuncu karakterleri ırka göre (aynı JSON, `race`): halfling 0.5, gnome 0.5, dwarf 0.75, human 1, elf 1, tiefling 1, celestial 1.05, orc 1.2, dragonborn 1.25, goliath 1.4. Tabloda olmayan ırk ve masumlar 1.
  - Mekanik boyut değişmez: karakter yine tek altıgen. Irk, `Combatant.raceId` olarak karakter sayfasından gelir; eski kayıtlarda yoksa 1.
  - Tıklama, çizim sırası, HP çubuğu ve merkez sabitleme kuralları karakterler için de aynı. 1'den küçük ölçekli jetonlar (halfling, gnome, dwarf) güçlü silüet parıltısını alır.
  - Eski `SIZE_SCALE` sabiti ve ejderhaya özel `tokenScale` (varyant JSON'u ve Combatant alanı) kaldırıldı; ejderha da boyut sınıfıyla çiziliyor (Young Large 1.5, Adult Huge 2, Ancient Gargantuan 3).
- **Merkez sabitleme** (önceki "ayak sabitleme"nin yerine; küçük jetonlar altıgenin altında kalıyordu):
  - Bütün jetonlar (karakter ve canavar, her boyut) altıgen merkezinde yatay ve dikey ortalı; büyük jeton merkezden her yöne eşit büyür.
  - Dikey ortalama görünen figürün sınırlarına göre doğrulandı: 590 resimde (240 karakter, 350 canavar ve uyku) saydam olmayan piksellerin dikey merkezi resim merkezinden en çok %0.2 sapıyor. Ayrı bir kaydırma değeri gerekmedi.
  - Nefes animasyonunun merkezi figürün alt-ortası (50% 90%); ortalı jetonda ayaklar yerinde kalıp gövde kabarıyor, merkezden ölçeklemeden daha doğal.
  - Zzz rozeti figürün tepesine göre (merkez − yarı yükseklik).
- **Tıklama:** Her jetonun yalnızca kendi altıgenindeki saydam daire. Bu daireler bütün jetonların üstündeki ayrı katmanda (`.token-hits`), böylece büyük jetonun figürü komşu altıgeni kapatmıyor.
- **Çizim sırası** (`drawOrder`, `src/ui/tokenSize.ts`):
  - Ekranda daha aşağıdaki jeton üstte.
  - Daha büyük bir jeton taşma menzilinde (Large ve Huge 1, Gargantuan 2 altıgen) bir küçük jetonun üstüne binecekse, küçük olan ondan sonra çizilir.
- **HP çubuğu, Zzz ve durum işaretleri sabit boyda, altıgene bağlı.** Bu seçim daha okunur:
  - Gargantuan'da çubuk komşu jetonların çubuklarına binmiyor.
  - Tiny'de 0.3'e küçülüp okunmaz olmuyor.
  - Zzz rozeti figürün tepesine yakın ama sabit boyda.
- **Parıltı:** Sıra ve takım parıltısı figürün silüetinde drop-shadow olarak kalıyor (piksel cinsinden, ölçekle küçülmüyor).
- **Tiny ve Small için asgari parıltı:** `tiny` sınıfına daha güçlü takım parıltısı verildi; figürün kendisi 0.3 kalıyor.
- Nefes animasyonu ve saydam jetonlar değişmedi.

## 2026-10-16 — Volkan: Wyrmling 2 Wyvern, şans kipi varsayılanı %2

- Wyrmling sim eşlikçisi 2 Wyvern (Harpy yok); `dragonWake: chance` varsayılanı %2 (JSON ve kod yedeği).
- 200 tohum: Wyrmling %76, şans kipi %60. Bütün ejderha seçenekleri %60–80 içinde; ikinci deneme gerekmedi.

## 2026-10-16 — Volkan: Wyrmling Wyvern + 3 Harpy, şans kipi varsayılanı %5

- Wyrmling sim eşlikçisi Wyvern + 3 Harpy; `dragonWake: chance` varsayılanı %5 (JSON ve kod yedeği).
- 200 tohum: Wyrmling %89, şans kipi %49; ikisi de %60–80 dışında. Yeni öneriler DENGE.md'de (2 Wyvern; %2), uygulanmadı.

## 2026-10-16 — Buzul ortamı Dağ'a katıldı; Volkan ejderha eşlikçileri

**Canavar ortamları:**
- `data/monster-ortamlari.json` içinde `buzul` ortamı `dag` oldu (25 canavar; 9'unda `dag` zaten vardı, tekrar eklenmedi).
- Bu 25 canavar `"kis": true` ile işaretlendi. Birleştirmede kaybolmasın diye eklendi.
- `docs/CANAVAR-KATEGORILERI.md`: Buzul dağı bölümü kaldırıldı, Dağ geçidi aynı üretim sırasıyla 88 canavar.
- Test: her ortam kimliği gerçek bir harita ya da `duz-zemin` olmalı (`envProblems`); bilinmeyen kimlik hata listesine düşer.
- Kurulum ekranı: Dağ'ın kış varyantı seçiliyken `kis` canavarları her güç kademesinin başında ve ❄ işaretli. Yaz varyantında sıra değişmiyor.

**Volkan ejderha (DENGE.md):**
- Adult Red eşlikçisi Wyvern + 2 Harpy, Wyrmling 2 Wyvern + 2 Harpy (sim senaryosu).
- `dragonWake: chance` varsayılanı %10 (JSON ve kod yedeği).
- 200 tohum sonuç: Young %70, Adult %66, Ancient %66 aralıkta; Wyrmling %53 ve şans kipi %35 altında. Yeni öneriler yazıldı, uygulanmadı.

## 2026-10-16 — Canavar ortamları ve güç kademeleri; uyuyan ejderha teşhisi, Ancient Red

**Canavar ortamları (`data/monster-ortamlari.json`, `docs/CANAVAR-KATEGORILERI.md`):**
- Kullanıcıdan geldi; `monsters.json` ile doğrulandı.
  - 330 kayıt, kimliklerin hepsi eşleşiyor.
  - Dört CR yanlıştı, gerçek değerle düzeltildi: Pirate 1/8 → 1, Spider 1/4 → 0, Swarm of Crawling Claws 1/2 → 3, Troll Limb 1 → 1/2.
  - MD'deki kademe listeleri ve tema aralıkları buna göre güncellendi; başka satır değişmedi.
  - Ad farkları yalnızca yazım: Saber-Toothed Tiger, Will-o’-Wisp, Half-Dragon.
- GM kurulumu, Düşmanlar listesi:
  - Varsayılan olarak seçili haritaya uyan canavarlar gösteriliyor, güç kademelerine ayrılmış (Ufak 0–½, Orta 1–3, Güçlü 4–8, Boss 9–14, Efsanevi 15+), CR ve ada göre sıralı.
  - "Tüm canavarlar" kutusu 330 canavarın hepsini açıyor.
  - Seçili canavarlar ve özel canavarlar her zaman listede; arama mevcut kapsamda çalışıyor.
  - Kademe `monsters.json` CR'ından hesaplanıyor (`src/data/monsterEnv.ts`).
- `buzul` (Buzul dağı) ortamının haritası yok. Bu canavarlar yalnızca diğer ortamlarında ya da "Tüm canavarlar"da görünüyor. `duz-zemin` haritasız savaş için.

**Uyuyan ejderha:**
- Teşhis için `src/sim/ejderTeshis.ts` yazıldı. Ölçülenler: uyanma turu, uyanık tur, hasar, düşürme, nefes kullanımı, hedefe varma, uyumadan bitme.
- Sebep ejderhanın yapay zekâsı değil:
  - Uyanınca uçarak hedefe varıyor ve nefes kullanıyor.
  - Savaşların çoğu ejderha uyanmadan bitiyor.
  - Adult'un %97'si zayıf eşlikçiden (3 Harpy); Wyrmling'in %95'i güçten.
- Savaş gürültüsü uyanma kuralı denendi; ejderhalar hep uyanıp parti %0–8 kazandığı için geri alındı.
- Ejderha seçeneklerine Ancient Red Dragon eklendi (Young, Adult, Wyrmling'in yanında); sim senaryosu `volkan-ejder-ancient` (Wyvern + 2 Harpy) %66.
- Eşlikçi önerileri DENGE.md'de, uygulanmadı.

## 2026-10-16 — Eski Volkan kaldırıldı, "Volkan Adaları" artık "Volkan"; saydam jetonlar

**Harita:**
- Eski `data/maps/volkan.json` ve tek kullanıcısı olan `public/maps/harita-volkan.webp` silindi.
- `volkan-adalar.json` → `volkan.json`: kimlik `volkan`, ad "Volkan". Varyantlar `normal` ve `uyuyan-ejderha`. Görsel adı `harita-volkan-adalar.webp` olarak kaldı.
- Eski kimlikler: `volkan-adalar` → `volkan` (`MAP_ALIASES`).
  - `resolveMapChoice`: bilinmeyen harita kataloğun ilk haritasına (Ada), bilinmeyen varyant haritanın ilk varyantına düşer; çökmez.
  - Eski "volkan" kaydı (`varsayilan` varyantı) yeni haritanın `normal` varyantını açar.
  - Kayıtlarda (localStorage) harita kimliği tutulmuyor; bu yalnızca güvenlik ağı.
- Eski Volkan düzenine bağlı testler `src/map/fixtures/eskiVolkan.ts` fikstürüne taşındı (katalogda değil; `vi.mock` ile yalnızca "eski-volkan" kimliği).
  - `movement.test.ts`: yerleştirme, kurulum ve hareket testleri.
  - `maps.test.ts`: sütun aralığıyla 16/16 başlangıç, hatalı harita doğrulaması, `tileAt`.
  - Assertion'lar değişmedi.
  - "bilinmeyen varyant reddedilir" testi yeni davranışa çevrildi: düşme ve eski kimlik eşlemesi sınanıyor.
  - Diğer harita testleri (jumprisk, maprules, ai, cover, range, forced, stealth, dragon) zaten kendi zeminini (`board`, `tiles`) veriyordu; değişmedi.
- Sim: Volkan ölçümleri yeni haritada (DENGE.md). Ejderha senaryolarının eşlikçileri ve canavar verisi değişmedi.

**Saydam jetonlar:**
- Resimli jetonda arka plan dairesi, kırpma ve halka yok; yalnızca pixel-art figür (`.fig`).
  - Takım: silüete ince drop-shadow parıltısı (parti mavi, düşman kırmızı) ve altında ince koyu kontur, böylece koyu ve açık haritada okunuyor.
  - Sıra, hedef, seçili ve seçilebilir durumları daha güçlü silüet parıltısı. Uyuyan jeton biraz soluk.
- Resimsiz (baş harfli) jeton daire ve halkasını koruyor.
- Can çubuğu, Zzz, nefes animasyonu ve boyut ölçeği aynı.
- Tıklama: her jetonda jeton boyunda saydam `.hit` dairesi (büyük ejderhada yalnızca kendi altıgeni). Figürün kutusu tıklamayı yutmuyor.
- Volkan, Çöl ve Şehir Meydanı'nda ekran görüntüsüyle kontrol edildi.

## 2026-10-16 — Yeni harita "Volkan Adaları" (`volkan-adalar`; sonra `volkan` oldu, yukarıya bkz.); bilgi kutusu

**Harita:**
- `data/maps/volkan-adalar.json`, 15×7, flat-top, odd-q, 5 ft.
  - Zemin ve başlangıç bölgeleri görev metninden: oyuncular sol adada, düşmanlar sağ adada, 10'ar altıgen. `mirrorable: true`.
  - Biçim, ortam (`volkan-lav`), kurallar ve efektler eski Volkan'dan kopyalandı: lav ölümcül (uçan hariç), lav kenarı sıcak dalgası, patlama, lav yükselmesi, ada bazlı `lavJump` (`jumpTargets`).
- Üç büyük ada, aralarında 2 sütun lav. Altı adacık: (5,1)+(5,2), (11,1)+(11,2), (4,7)+(5,7), (11,7)+(12,7), (9,1), (8,7).
- Testler:
  - Bağlı kara parçaları tam olarak 3 büyük ada + bu 6 adacık; hiçbir adacık başka karaya bitişik değil.
  - Yürüyerek adalar arasında geçiş yok.
  - Sol adanın içinden orta adaya ve adacıklara atlanır; sağ adaya doğrudan atlanamaz (orta ada hattı keser).
  - Lavın karşısına büyü atılır.
- **Varyantlar:**
  - `normal`: ejderhasız.
  - `uyuyan-ejderha`: eski Volkan'ın ejderha ayarlarıyla aynı (Young varsayılan; Adult, Wyrmling; `dragonWake` never/chance/gm; GM düğmesi). Ejderha (8,3) kraterinde.
  - Ancient Red seçeneği "ileride" olarak bırakıldı.
- Eski `volkan` haritası aynen kaldı; listede ayrı "Volkan Adaları" görünüyor.
- **Görsel ve yerleşim:**
  - `public/maps/harita-volkan-adalar.webp` kullanıcıdan geldi. Harf overlay'i görselle örtüşüyor: üç ada, krater (H) ve altı adacık doğru yerde.
  - `npm run check:harita` 160 kontrol, 0 hata.
  - `docs/harita/ornek/volkan-adalar.yerlesim.json` görev metninden üretildi; orijinal yerleşim dosyası gelmedi.

**Bilgi kutusu:** Altıgen bilgisi sağ alttan sağ üste (sıra şeridinin altına) alındı. Gövdesi tıklamayı yutmuyor, yalnızca ✕ tıklanıyor. Önceden fareyle bir altıgenin üstünden geçince "Düşmanı oynat" düğmesini kapatıyordu.

## 2026-10-16 — Volkan: ada atlaması yeniden (basit model, `jumpTargets`)

**Teşhis (`src/sim/volkanTeshis.ts`):**
- Karakterler adalarının içinden başlıyor. Önceki kural, atlayanın kendi adasının karasını da engel sayıyordu; adanın içinden hiçbir adaya atlanamıyordu (31 hedef "düz hat yok").
- Kenara yürünen tur da atlanamıyordu, çünkü atlama hareketin yerine geçiyor. Sonuçta karakterler adada bekliyor, düşmanlar geliyordu.

**Kural (kullanıcı):**
- Hedef, atlayanın adasından farklı bir adanın boş kara altıgeni.
- Kalkıştan hedefe düz hex hattında:
  - lav altıgenleri sayılır, DC = 10 + 2 × (lav − 1);
  - kalkış adasına ve hedef adaya ait kara altıgenleri sayılmaz ve engel olmaz;
  - üçüncü bir adaya ait kara ya da kaya hattı keser: o hedef geçersiz, adayı atlayıp ileri gidilemez.
- Hat yalnızca zemine bakar; yaratık hattı etkilemez. Düşmanlı adaya atlanır, dolu altıgene inilmez.
- Değişmeyenler: her atlama ayrı zar atar, doğal 1 lava düşürür, başarısızlık sonuçları aynı. Uçan zarsız, ama aynı hat kuralı geçerli. Atlama hareketin yerine geçer: bu tur yürünmemiş olmalı, tüm hareketi harcar.
- **Tek kaynak:** `jumpTargets(state, unit)` (`src/battle/jumprisk.ts`). Atla kipindeki turuncu altıgenler ve yapay zekânın atlama adayları bundan gelir; komut aynı `lavaLine` kuralıyla doğrular. Altıgenin üzerine gelince "DC X, N lav hex, doğal 1: %5 lava düşme" yazar.
- **Yapay zekâ:**
  - Düşük başarı şansında (güvenli iniş < %60) ve HP %40 ve altındayken atlamaz.
  - Uyuyan ejderhanın yanına (herkes) ya da Algı menziline (parti) atlamaz. Bu olmadan parti orta adaya atlayıp ejderhayı uyandırıyordu: Young %33, Adult %46.
- **Ölçüm:** DENGE.md. Eşlikler: Adult 3 Harpy, Wyrmling Wyvern + 2 Harpy.

## 2026-10-16 — Karakter jetonları (pixel art)

- **Resim:** Karakter jetonu, oluşturucu önizlemesi, sıra şeridi ve profil aynı resmi gösterir: `public/characters/<ırk>-<male|female>-<sınıf>.webp` (10 ırk × 2 cinsiyet × 12 sınıf = 240, 256×256 saydam WebP).
- **Cinsiyet:** Oluşturucuda zaten vardı (Erkek/Kadın; kayıtta `erkek`/`kadin`). Dosya adında `male`/`female` olur. Cinsiyeti olmayan eski kayıtlar erkek (`male`) sayılır.
- **Dosya adı tek yerde:** `characterTokenFile(ırk, cinsiyet, sınıf)` (`src/battle/create.ts`). Dosya adı kodda başka biçimde kurulmaz. 240 dosya testi de adları bu fonksiyonla, koddaki ırk × cinsiyet × sınıf listesinden üretir. Geçici boş dosyalarla denendi: 240'ı varken geçiyor, biri eksikken o adı yazarak düşüyor.
- **Yedek zinciri:** `characters/...` → eski `avatars/<ırk>-<sınıf>-<cinsiyet>.webp` → ırk renkli, baş harfli rozet. Uyuyan yaratıkta zincirin başına uyku resmi eklenir.
- **Tembel yükleme:** Görsel yalnızca ekranda gösterilen avatar için, gerektiğinde yüklenir ve önbelleğe alınır. Oyunda olmayan karakterlerin resmi indirilmez.
- **Görünüm:**
  - Karakter resimleri karşıdan çizili; canavarlardaki "karakterlere dön" aynası onlara uygulanmaz.
  - Bütün jeton resimleri (karakter ve canavar) hafifçe "nefes alır" (CSS, 3.2 sn); hareket azaltma tercihinde kapalı.
  - Boy: karakterler hep Medium ölçeğinde, ırk boyu resimde çizili. Canavarlarda dairenin içinde küçük boy farkı var (Tiny 0.7, Small 0.85, Medium 1, Large 1.1, Huge 1.15, Gargantuan 1.2). Büyük ejderha `tokenScale` ile ayrı.
- **Irk kimliği:** `celestial`. Veride, arayüzde ve testlerde "Aasimar" geçmiyor (testle denetleniyor); göç gerekmedi.
- **Testler:**
  - Dosya adı kuralı, cinsiyetsiz kaydın `male` olması, yedek zinciri (resim yok → eski yol → rozet).
  - 240 dosyanın hepsi: `public/characters` depoya eklenince etkin, şimdilik klasör boş olduğu için atlanıyor.
- **Lisans notu:** Karakter (ve canavar) jeton resimleri Gemini ile üretildi. Mağaza yayınından önce ticari kullanım şartları kontrol edilecek. SRD 5.2.1 atıf metinlerine dokunulmadı.

## 2026-10-16 — Kurulum: varyantlar hep görünen düğmeler

- Kullanıcı Volkan'da "Uyuyan ejderha" seçeneklerini göremedi. Varyant seçici açılır listeydi; kapalıyken yalnızca seçili varyant ("Volkan") görünüyordu ve ejderha ayarları yalnızca "Uyuyan ejderha" seçilince çıkıyor. Varyantın varlığı gözden kaçıyordu.
- Varyantlar artık hep görünen radyo düğmeleri (`role="radiogroup"`, aria-label "Varyant"). Ejderhalı varyantta 🐉 işareti var.
- Kara ekran kontrolü ve UI testi yeni seçiciye göre güncellendi.
- Büyük jeton (ejderha) saydam: arka plan dairesi ve dairesel kırpma yok, resim (zaten saydam WebP) gölgeyle çizilir. Halka yalnızca sırası gelince, hedefken ya da seçilebilirken görünür.

## 2026-10-16 — Volkan: ada atlaması ada bazlı; kurulum ekranı UI testi

**Atlama (kullanıcının kuralı, "yalnızca ilk karaya" kuralının yerine):**
- Hedef, atlayanın adasından farklı bir adada olmalı. Aynı adaya lav körfezi üstünden atlanmaz, yürünür.
- Atlayandan hedef adanın en az bir altıgenine, arası yalnızca lav olan düz bir hat bulunmalı: hattın ilk karası hedef adadan.
- Başka bir adanın (ya da atlayanın kendi adasının) üstünden geçilmez. İki adayı atlayıp üçüncüye geçmek yasak; ada içinden atlanmaz, önce kenara yürünür.
- Hat yalnızca zemine bakar: kenardaki altıgende duran düşman ya da başka yaratık hattı kesmez.
- Hedef adanın herhangi bir boş altıgenine inilir, düşmanın bulunduğu ada da dahil. Dolu altıgene inilmez.
- DC = 10 + 2 × (lav − 1).
  - Lav sayısı, hedef altıgene giden düz hat temizse onun ilk karaya kadarki lavı.
  - Değilse (ör. kaya kesiyorsa) hedef adaya en az lavla ulaşan temiz hattın lavı. Adanın içindeki kara sayılmaz.
- Değişmeyenler: uçanlar zarsız, `foeIsland: allow`, hareketin yerine geçme. Yapay zekâ kuralları aynı; her atlamada doğal 1 riskini hesaba katıyor.
- Ada başına en kısa temiz hat, durum başına önbellekte tutuluyor.

**Kurulum ekranı (uyuyan ejderha seçenekleri görünmüyor bildirimi):**
- Kodda varyant listesini süzen bir koşul yok: seçici `map.variants`'ın hepsini gösteriyor (`src/screens/Screens.tsx`).
- `be03d30` ve sonrasında gerçek tarayıcıda (telefon ve PC boyutu) Volkan seçilince "Uyuyan ejderha" varyantı, ejderha seçimi ve `dragonWake` kipi çıkıyor. Hata burada üretilemedi; yerel ortamın (eski dev sunucusu ya da tarayıcı önbelleği, eksik çekilmiş dosya) denetlenmesi istendi.
- UI testi eklendi (`src/screens/setup-ui.test.tsx`): GM kurulum ekranı sunucuda çizilir ve şunlar denetlenir:
  - Volkan'da iki varyant;
  - uyuyan-ejderha seçilince üç ejderha (Young varsayılan) ve `never`/`chance`/`gm`;
  - `chance`'ta yüzde alanı (25).
- `GmScreen`'e açılış seçimi için `initial` (harita, varyant, kip) eklendi. Harita/varyant değişince ejderha ayarları sıfırlanıyor; ilk açılışta sıfırlanmıyor.

## 2026-10-16 — Canavar jeton resimleri

- `public/monsters/<id>.webp`: 330 canavarın hepsi için jeton resmi var (kullanıcı ekledi). Canavar avatarının varsayılan yolu `avatars/canavar-<id>.webp` yerine `monsters/<id>.webp` oldu.
- `<id>-uyku.webp` (22 tane: ejderhalar, bazı canavarlar): yaratık uyurken (uyuyan ejderha) jetonda bu resim gösterilir, uyanınca normal resme döner. Uyku resmi yoksa normal resim kullanılır.
- Test: her canavarın `<id>.webp` dosyası var. Yalnızca dosya adlarına bakılır; resimler testlere girmez.
- Yön: Canavar resimleri sağa bakıyor. Haritadaki düşman jetonu en yakın karaktere dönük çizilir: karakter soldaysa resim yatayda aynalanır. Konum değişince yön de değişir. Sıra çubuğundaki küçük rozetler aynalanmaz.

## 2026-10-16 — Volkan: "Uyuyan ejderha" varyantı (`uyuyan-ejderha`)

**Karar (kullanıcının kuralı; değerler `volkan.json` → `sleepingDragon`):**

- **Varyant:** Normal Volkan aynen kaldı. Yeni varyant aynı zemin, görsel ve kurallar (lav kenarı, patlama, lav yükselmesi, ada atlaması) artı `sleepingDragon`.
- **Ejderha seçimi ve yeri:** `dragon` ile seçilir: `young-red-dragon` (varsayılan), `adult-red-dragon`, `red-dragon-wyrmling` (canavar listesindeki kimlikler).
  - Ortadaki büyük adanın tepesine (H, sütun 8 satır 3) uyur halde, düşman tarafında yerleşir. Aynalıda aynalanır.
- **Uyku:**
  - Turunu atlar; sırası gelse de komut veremez.
  - Hareket etmez.
  - Yakın dövüş saldırıları ona avantajlı ("Hedef uyuyor (yakından)"); menzilli değil.
  - Legendary Resistance zaten yok sayıldığı için uykuda özel bir şey yok.
- **Uyanma** (herhangi biri; günlüğe "X uyandı (sebep)"):
  - Hasar: HP düşerse; bağışık olduğu ateş uyandırmaz.
  - Gürültü: 25 ft içinde gürültülü büyü ya da yetenek. Hasar türü `thunder`, adı listede (Thunderwave, Shatter, Thunderclap, Thunder Step) ya da adında roar/screech/shriek/howl/thunder geçen. Büyücü ya da hedef/alan merkezi 25 ft içindeyse sayılır.
  - Yanına girme: bitişik altıgene bir yaratık girerse; yürürken yanından geçmek, atlayıp yanına inmek ve itilmek dahil.
  - Algı: her tur (round) sonunda, 25 ft içindeki gizlenmemiş her karakter için ejderhanın Algı zarı (d20 + Perception ≥ 12). İlk başarıda uyanır. "Tur sonu" round sonu olarak uygulandı.
- **Kazanma:** Uyanık düşmanların hepsi yenilince parti kazanır; ejderha uyurken sıvışılır. Uyuyan ejderha "ayakta düşman" sayılmaz.
- **`dragonWake` (GM kurulumunda; varsayılan JSON'da `never`):** Yalnızca yapay zekânın yönettiği düşmanlar için geçerli.
  - `never`: Yapay zekâ ejderhayı uyandıracak hiçbir komutu seçmez. Yanına giren ya da yolu yanından geçen yürüyüş/atlama elenir; uyandıracak saldırı ya da büyü yerine turu bitirir.
  - `chance`: Her düşman turunun başında, ejderha uyurken, d100 < yüzde (GM seçer, 0–100, varsayılan 25) zarı atılır. Zar tohumludur, simülasyonda tekrarlanabilir. Tutarsa günlüğe "X ejderhayı uyandırmaya çalıştı" yazılır: 25 ft içindeyse bağırır (uyanır), değilse o tur ejderhanın yanına yürür.
  - `gm`: Yapay zekâ dokunmaz; yalnızca GM uyandırır.
- **GM:**
  - "GM: Ejderhayı uyandır" düğmesi her kipte, her an GM menüsünde. Onay ister; günlüğe "GM ejderhayı uyandırdı".
  - GM bir düşmanı elle yönetirken kısıt yok: ejderhaya saldırmak, yanına girmek, gürültülü büyü normal kurallarla uyandırır.
  - Elle yönetim zaten var: düşmanın turunda GM "Düşmanı oynat" yerine menüden komut verir. "Yapay zekâ düşmanını devralma" için ayrı bir özellik gerekmedi.
  - Uygulama tek cihaz olduğundan GM düğmeleri (patlama, lav yükselmesi gibi) GM menüsünde "GM:" önekiyle duruyor; ayrı bir GM oturumu ileride.
- **Oyuncular:** `dragonWake`'ten etkilenmez; kendi kararlarıyla uyandırabilir. Zarla uyanma kuralları herkes için aynı işler.
- **Parti yapay zekâsı (simülasyon):**
  - Uyuyan ejderhayı hedef almaz ve yanına girmekten kaçınır.
  - Ejderha uyurken Algı menzilindeyse (yakın dövüşte değilse) önce menzilden çıkar. Yakın dövüşe girmiş karakter yerinde kalır.
- **Çok hex'li boyut ertelendi:** Ejderha mekanik olarak tek altıgen. Jeton görsel olarak büyütüldü (`tokenScale` 2.4, yaklaşık 2–3 altıgen); tıklama yalnızca kendi altıgeninde. Büyük jetonlar önce çizilir, komşudakiler üstte kalır.
- **Arayüz:**
  - Uyuyan jetonda "Zzz" rozeti ve kesikli halka.
  - Bilgi panelinde (jetona uzun bas) uyanma koşulları, varyantın değerleriyle.
  - Kurulumda ejderha seçimi, `dragonWake` kipi ve `chance` yüzdesi.
- **Denge (DENGE.md, 200 tohum, `never`):**

  | Ejderha | Eşlik | Parti kazandı | Uyanma | Uyanınca kazanma |
  |---|---|---:|---:|---:|
  | Young Red | 3 Harpy | %75 | %26 | %2 |
  | Adult Red | 3 Harpy | %70 | %30 | %0 |
  | Wyrmling | Wyvern + Harpy | %79 | %53 | %59 |

## 2026-10-16 — SRD 5.2.1 bestiary: 314 canavar eklendi (toplam 330)

**Karar:**

- `data/monsters.json` SRD 5.2.1'in "Monsters A–Z" ve "Animals" bölümlerindeki bütün stat bloklarını içeriyor: 330 canavar.
  - Elle girilmiş ilk 16 kayıt (Türkçe notlar dahil) aynen kaldı; yalnızca `unsupported` alanı eklendi.
  - Yeni 314 kayıt öncelik sırasıyla geliyor:
    - 39 ejderha (Young Red zaten vardı; 10 renk × Wyrmling/Young/Adult/Ancient tamam).
    - 142 uçan ya da menzilli saldırılı canavar.
    - 133 diğer.
  - Gruplar kendi içinde CR'ye göre sıralı.
- Veri SRD PDF'inin sütun metninden betikle ayrıştırıldı ve mevcut şemaya çevrildi:
  - Temel değerler: AC, HP, yürüme ve uçma hızı, 6 yetenek, farklı save'ler, beceriler, Darkvision, hasar direnç/bağışıklık/zaafları, CR.
  - Saldırılar: saldırı bonusu, erişim ya da menzil, hasar zarı ve türü, ek hasar (rider). Recharge ve Multiattack'taki tekrar sayıları da aktarıldı.
  - Save'li eylemler (nefes vb.): yetenek, DC, yarım hasar, menzil.
  - Pack Tactics, Undead Fortitude, Regeneration ve Nimble Escape motorun mevcut alanlarına bağlandı.
- **`unsupported: [...]`:** Motorun desteklemediği her özellik canavar kaydında listeleniyor (311/330 kayıtta var). Özellik canavarı kullanılamaz yapmıyor; aşağıdaki karşılıklar kullanılıyor.

**Eksik özellikler (kayıt sayısı) ve karşılıkları:**

| Eksik özellik | Kayıt | Karşılık |
|---|---:|---|
| Çok hex'li boyut: Large / Huge / Gargantuan | 107 / 34 / 15 | Tek hex. Boyut yalnızca İt (Shove) sınırında kullanılıyor. |
| Alan şekilleri (Cone, Line, Sphere, Emanation…; nefesler dahil) | 54 | Tek hedefe save'li saldırı. Menzil = alan uzunluğu ya da yarıçapı. |
| Legendary Actions | 30 | Yok sayılır. |
| Legendary Resistance | 32 | Yok sayılır. |
| Lair | – | SRD 5.2.1 stat bloklarında ayrı Lair Actions yok; yalnızca "in Lair" kullanım sayısı (yok sayılır). |
| Spellcasting | 49 kayıtta; 46'sında eksik listesine eklendi | Yok sayılır. Büyü saldırısı olan eylemler (Arcane Burst gibi) saldırı olarak var. |
| Multiattack (kısmi) | 96 | Adı geçen saldırılar sayısınca. "X veya Y" → ilki. "Büyü/başka eylem kullanır" kısmı yok sayılır. Hydra: baş sayısı kadar Bite. |
| Diğer özellikler (Trait) | 176 | Yok sayılır, adları `traits` metninde. |
| Bonus eylemler (Nimble Escape dışında) | 66 | Yok sayılır. |
| Tepkiler (Parry vb.) | 24 | Yok sayılır. |
| Saldırı/save olmayan eylemler (Teleport, Change Shape…) | 25 | Yok sayılır. |
| Swim / Climb / Burrow hızı | 128 | Yalnızca yürüme ve uçma kullanılır. |
| Hover | 16 | Yok sayılır. |
| Blindsight / Truesight / Tremorsense | 101 | Yok sayılır; Darkvision kullanılır. |
| Durum bağışıklığı | 75 | Yok sayılır; hasar bağışıklıkları kullanılır. |
| Ek hasar ve durum etkileri (rider) | tümü | Motor genelinde metin olarak taşınır, elle uygulanır (önceki 16 canavarda da böyle). |
| X/Day kullanım | 4 | Recharge 6 (1/Day) ya da 5 (2–3/Day) olarak. |
| Sabit hasar ("1 Piercing") | 21 | Zar motoru d1 kabul etmediği için 1d2 + (N − 1) yaklaşığı. |
| Hiç saldırısı yok (Shrieker Fungus, Seahorse) | 2 | Basit "Vuruş" (1d4 + STR) karşılığı. |

**Diğer:**
- Testler: 330 kayıt; ilk 16 yerinde; 40 ejderhanın hepsi var; her zar ifadesi geçerli; her canavardan savaşçı oluşuyor; büyük boyutlu canavarlarda boyut notu var.
- Ayrıca 330 canavarın her biri tek başına bir simülasyon savaşında hatasız oynatıldı.
- Kurulum ekranındaki düşman listesine arama eklendi: ad ya da "CR 5" yazılır, seçilenler hep görünür.
- Simülasyonun XP tablosu bütün CR'lere genişletildi.
- Lisans: SRD 5.2.1 CC-BY-4.0. Mevcut atıf metinlerine (NOTICE, README, `public/atiflar.txt`) dokunulmadı.
- Paket boyutu 418 → 733 kB (gzip 135 → 178 kB); Vite 500 kB uyarısı veriyor. Gerekirse canavar verisi ayrı parçaya (lazy) alınabilir.

## 2026-10-16 — Volkan: ada atlaması yalnızca en yakın karaya

**Karar (kullanıcı):**
- Lav atlamasının hattı (iki altıgen arası düz çizgi) kalkıştan inişe baştan sona lav olmalı. İniş, lav bittikten sonraki ilk kara.
- Hatta kara varsa, aynı ya da başka adanın karası fark etmez, atlama o karada biter. Ötesine atlama reddedilir: bir adayı atlayıp ötekine geçmek yasak, her ada kendi atlamasıyla geçilir.
  - Ada içinden atlanmaz: önce kenara yürünür.
  - Lav altıgenine inilmez.
  - Çizgi iki altıgenin tam sınırından geçerse iki yol da denenir.
- Aradaki lav sayısı sınırsız; DC = 10 + 2 × (lav − 1) aynen kalıyor.
- Uçan zarsız ama o da ilk karaya iner.
- Değişmeyenler: düşmanlı adaya atlama (`foeIsland: allow`), dolu hedef reddi, hareketin yerine geçme (bu tur yürünmemiş olmalı).
- **Arayüz:** Atla kipinde yalnızca geçerli ilk-kara altıgenleri yanar (motor denenerek), uzak adalar yanmaz.
- **Yapay zekâ:**
  - Atlama adayları motorun kuralıyla üretilir. Her atlamada doğal 1 riski (40 × P(düşme)) ve yanma (6 × P(yanma)) maliyete eklenir.
  - Güvenli iniş %60'ın altında ya da HP %40 ve altında ise atlamaz.
  - Atlama maliyeti artık "tüm hız" değil, aşılan mesafe (lav + iniş) + risk. Lav yürünemediği için atlama tek yoldur.
  - Uzak ada için tur tur ilerler: kenara yürü → atla → karşı kenara yürü → atla. Ortadaki adada en çok iki tur kalır (testte).
- **Ölçüm:** Volkan %100'e döndü (DENGE.md). Düşman listesine dokunulmadı.

## 2026-10-16 — Volkan: düşmanlı adaya atlama açıldı (`foeIsland: allow`)

**Karar (kullanıcı):**
- Volkan'da `lavJump.foeIsland` = `allow`: düşmanlı adaya da atlanır.
- Dolu hedef altıgen reddi kaldı; yapay zekâ kuralları değişmedi.
- `reject` seçeneği motorda duruyor ve testte veriyle sınanıyor.
- Ölçüm: parti %87 (önce %100). Hedef ~%87 tuttu, düşman listesine dokunulmadı (DENGE.md).

## 2026-10-16 — Kara ekran kontrolü: yeniden deneme

Windows'ta `npm run check:harita` 127. kontrolde durdu: sayfa 30 sn içinde açılmadı ("text=GM" zaman aşımı) ve yakalanmayan istisna betiği bitirdi; sonraki haritalar (taverna, volkan) hiç kontrol edilmedi. Uygulama hatası değil, yerel ortamın anlık yavaşlığı.

- Her kontrol bir istisnada bir kez yeniden denenir (yeni sayfa).
- İkinci denemede de olmazsa o satır `HATA` yazılır ve ekran görüntüsü alınır; betik durmadan sıradakine geçer.
- Hata varsa çıkış kodu 1 (değişmedi).

## 2026-10-16 — Volkan: sınırsız ada atlaması (`lavJump` genişletildi)

**Karar (kullanıcının kuralı):**

- Lav üstünden geçen atlama artık "ada atlaması": herhangi bir adanın herhangi bir boş altıgenine.
  - Mesafe, hız ve koşu sınırı ve düz doğrultu şartı kalktı.
  - Aradaki altıgenler lav ya da kara olabilir; engel (`#`) atlamayı keser.
  - Yol, iki altıgen arasındaki düz çizgi (`line`).
- DC = 10 + 2 × (aradaki lav altıgeni − 1), d20 + Athletics, üst sınır yok.
  - Uçan zarsız; doğal 20 güvenli.
  - Başarısızlıkta 2d6 ateş + Burning; doğal 1 lava düşer (yolun ortasındaki lav altıgeninde).
  - Değerler `volkan.json` → `lavJump` içinde.
- **Hareketin yerine geçer:** bu tur hiç yürünmemiş olmalı ve atlama tüm hareketi harcar. Eylem harcanmaz.
- Hedef altıgen doluysa reddedilir. Hedef adada (lav ve engel dışı, bağlı kara parçası) düşman varsa da reddedilir. Bu, veride `foeIsland: "reject"`.
- Lav üstünden geçmeyen atlama değişmedi: 5e uzun atlama, zarsız. Eski 5e atlama testleri `lavJump`'sız haritaya (Orman) taşındı.
- **Arayüz:**
  - Menüde "Atla" (yalnızca `lavJump` olan haritada). Bu tur yürüdüysen düğme sebebini söyler.
  - Atla kipinde seçilebilir ada altıgenleri turuncu yanar ve üstünde DC yazar. Üzerine gelince bilgi kutusunda "DC X, N lav hex" görünür.
  - Dokununca balon çıkar: şanslar ve "tüm hareketini harcar" bilgisi, ardından "Atla" onayı.
- **Yapay zekâ:**
  - Güvenli iniş şansı %60'ın altındaysa (DC çok yüksek) ya da HP %40 ve altındaysa atlamaz.
  - Atlama, risk kadar ek maliyetle aday olur. Yalnızca yürüyüşün ulaştıramadığı bir saldırı yeri ya da yaklaşma sağlıyorsa seçilir.
  - Doğal 1'in %5 ölüm riski bu yüzden boşuna alınmaz.
- **Ölçüm (DENGE.md):**
  - Uygulanan kuralla Volkan %100. Taraf adaları kara ile bağlı olmadığından kara düşmanları partinin adasına atlayamıyor.
  - `foeIsland` kapalı denemede %87, ölen PC 0.68.
  - Karar kullanıcıda.

## 2026-10-16 — Satır sonları: CRLF uyumu ve .gitattributes

**Karar:**

- `parseStatus` (Durum sayfası) GOREV.md'yi satırlara `/\r?\n/` ile bölüyor. Windows'ta CRLF ile çekilen dosyada `\r` kalıyordu ve "## Adımlar" başlığı bulunamadığı için liste boş dönüyordu.
- Testte aynı içeriğin CRLF hâli de aynı adımları vermek zorunda.
- `.gitattributes`:
  - `* text=auto eol=lf`: depoda ve çalışma kopyasında LF.
  - Görseller (png, jpg, webp…), video (mp4, webm), pdf ve fontlar `binary`.
- Depoyu yeniden normalleştirmek dosya değiştirmedi (hepsi zaten LF).

## 2026-10-16 — Dungeon: Merdiven ve Hazine odası varyantları

**Karar (GOREV-DUNGEON-MERDIVEN-HAZINE, kullanıcının verisi):**

- `data/maps/dungeon.json` artık üç varyant içeriyor: Koridor (meşale), Merdiven ve Hazine odası.
  Koridor değişmedi. Yeni iki varyantın kendi `tiles`, `startZones` ve `mirrorable` değerleri var.
  Doğrulayıcı bu varyantlarda da aynalamayı ve başlangıç bölgelerini denetliyor.
  `npm run check:harita` ikisini de kapsıyor.
- **Yeni arazi harfleri:**
  - `l`: alçak basamak, yükseklik 1.
  - `y`: yüksek basamak veya sahanlık, yükseklik 2.

  İkisi de normal maliyetli ve tırmanma gerektirmiyor (`stairs: true`).
  Basamaktan basamağa yukarı yürünüyor ve itilebiliyor. Basamaktan aşağı inişte düşme hasarı yok.
- **Harflerin anlamı korundu.** Mevcut harfler (u, m, x, k, h, j, o) katalogdaki anlamlarını korudu:
  - `x`: zor zemin ve yarım siper.
  - `k`: zor zemin.

  Görev metnindeki "raf/sandık" ve "altın yığını" açıklamaları bu kurallarla uyuşuyor.
- **`highGround`:** Kural yeni bir hesap eklemiyor. Mevcut genel yükseklik kuralı (≥1 kademe yüksekten avantaj) uygulanıyor; JSON'daki kural bunu belgeliyor.
- **`stairwellFall`:**
  - `u` altıgenine itilen ya da düşen yaratık 2d6 ezici hasar alır ve Prone olur.
  - Alt kata inmez. Aynı odada en yakın boş `l` altıgenine yerleşir (oda tek kat).
  - Sayılar JSON'da.
- **`stairShove`:** İt komutuyla basamakta yüksekten alçağa itilen hedef ek olarak 1d4 ezici hasar alır ve Prone olur.
- **Hazine odası:**
  - `j` altıgenleri mevcut `trap` kuralını kullanıyor (DC ve hasar JSON'da).
  - **`hiddenTrap`:** Tur başında partinin masum olmayan üyeleri pasif Algıyla tuzağı fark edebilir. Pasif Algı 10 + Algı bonusu; tuzağın DC'sine eşit ya da üstündeyse ve tuzak 3 altıgen içindeyse fark edilir.
  - **`loot`:** Yalnızca bilgi. Altıgen bilgisinde "hazine" yazıyor, oyun kuralı yok; ödülü GM hikâyede verir.
- Simülasyona `dungeon`, `dungeon-merdiven` ve `dungeon-hazine` senaryoları eklendi (sonuçlar docs/harita/DENGE.md'de).
- **Görsel ve önizleme dosyaları:** Görseller `public/maps/` altında. Önizlemeler ve görev verisi `docs/harita/ornek/` altında.
  Overlay kontrolü yapıldı: JSON'daki harfler gerçek görselin üstüne çizildi ve `ver_merdiven.jpg` / `ver_hazine.jpg` önizlemeleriyle karşılaştırıldı.
  Harfler altıgen altıgen aynı. Kontrol `npm run check:harita -- dungeon` ile yapıldı: 24 kontrol, 0 hata.

## 2026-10-16 — Volkan: lav üstünden riskli atlama (`lavJump`)

**Karar (kullanıcının taslağı; sayılar veride, kodda sabit yok):**

- Atlamanın üstünden geçtiği altıgenlerden biri kuraldaki zemindense (`over: ["~"]`) ve
  atlayan uçmuyorsa beceri zarı: d20 + Athletics (yetkinlik `skillBonus`). DC = `dcBase` 10 +
  `dcPerExtraHex` 2 × (lav altıgeni − 1). Kanalsız/normal zemin atlaması eskisi gibi zarsız.
- Doğal 20 (`natural20: "safe"`) her zaman güvenli; toplam ≥ DC güvenli iniş; toplam < DC
  hedefe iner ama kenarda yanar (`onFail`: 2d6 ateş + Burning); doğal 1 (`natural1: "fall"`)
  lava düşer, `fall: "deadly"` lav kuralı (anında ölüm). Genel tutuldu: ileride uçurum için
  `fall: "fall"` düşme hasarı (şimdilik yalnızca Volkan'da, lav için).
- **Burning (`lavJump.burning`):** tur başında 1d6 ateş, sonra DEX DC 10 save ile söner. SRD
  5.2.1 Burning (Rules Glossary, s. 178) 1d4 ateş ve söndürmek için eylem + Prone diyor;
  kullanıcının taslağı (1d6, DC 10 DEX) veride uygulandı, SRD'ye dönmek veride iki sayı.
- Zar komutun zar akışından (tohumlu simülasyonda tekrarlanabilir); sonuç `jump_check`
  olayında, günlükte "Mira lava atladı: 14 vs DC 10, başarılı, güvenle indi."
- **Arayüz:** riskli atlama altıgenleri turuncu; dokununca balonda Athletics/DC ve şanslar
  ("başarı ~%65, yanma %30, lava düşme %5"), riskliyse turuncu çerçeve, "Atla" onayı.
- **Yapay zekâ (iki taraf):** HP %40 ve altındaysa riskli atlamaz; değilse riskli atlama
  4 + 40 × P(düşme) + 6 × P(yanma) altıgen ek maliyet sayılır: yürüyerek benzer yere
  varılabiliyorsa yürür, yalnızca başka yol yoksa ya da çok uzunsa atlar.

## 2026-10-16 — Masum sayısı ve yerleşim modları (Taverna, Şehir Meydanı)

**Karar:**

- **Sayı:** GM kurulumunda +/− sayaç. Varsayılan haritanın kuralından (`civilians.default`:
  Taverna 4, Şehir Meydanı 6), aralık 0–12 (`min`/`max` veride); üst sınır ayrıca uygun
  (yürünebilir ve tehlikesiz, düşman başlangıç bölgesi dışı) altıgen sayısını aşamaz. Masum
  özellikleri (HP 4, AC 10, hız 6 altıgen) veriden gelmeye devam eder. 0 masum: masum ve
  sayaç yok.
- **Yerleşim modları:** Otomatik, düşmandan en uzak (varsayılan) · Ortada (önceki karar,
  kaldı) · Rastgele (tohumlu: aynı tohum aynı yerleşim; uygun ve partiden yürüyerek
  ulaşılabilen altıgenlerden; "Yeniden at" yeni tohum) · Elle (GM kurulum ekranındaki küçük
  haritada boş altıgene dokununca masum konur, masuma dokununca kalkar; sayaç kadar
  yerleşene dek "Savaşı kur" kapalı ve eksik sayı yazar).
- **Geçersiz altıgenler:** engel, lav, alev, derin batak, tuzak ve düşman başlangıç bölgesi.
  Partinin bölgesi geçerli (masumlar partinin arkasında durabilir); elle yerleşimde masumlar
  önce yerleşir, savaşçılar bölgelerinin boş kalanına.
- **Aynalama:** elle konan masumlar zeminle birlikte aynalanır (sütun c → 14 − c); aynalı
  haritada geçersiz kalanlar sayılmaz.
- Özet ve "Masumlar: x/n hayatta" seçilen sayıyla çalışır; masum ölümü yine kaybettirmez.
- Denge ölçümüne 8 masumlu taverna senaryosu eklendi (`taverna-8`).

## 2026-10-16 — Ortamın yay dezavantajı düzeltildi; su altı kuralları motorda

**Karar (kullanıcı onayıyla; gerekçe docs/harita/DENGE.md "Yay dezavantajı nereden geliyor"):**

- **`weapon` kategorisi** artık yalnızca silah saldırısına uygulanır (önceden etiketteki kelime
  büyü ve save'li etkilerde de eşleşebiliyordu). Kurala `ranged` alanı eklendi: yalnızca
  menzilli ya da yalnızca yakın dövüş silah saldırısı. Cirit'in yakın dövüş saldırısı artık
  dezavantaj almaz.
- **Çöl, orman, mağara (yeraltı):** harita boyu yay dezavantajı kaldırıldı (SRD 5.2.1'de
  karşılığı yok). Bu ortamlarda atışı haritanın kendi kuralları bozar: siper, karanlık, kum
  fırtınası.
- **Fırtına ve dağ:** kalır, yalnızca menzilli silah saldırısına (SRD 5.2.1 Environmental
  Effects, Strong Wind, s. 195).
- **Su altı (SRD 5.2.1 Underwater Combat, s. 16):** ortam verisinden çıkarıldı ve motora
  genel kural olarak taşındı. Saldıran derin sudaysa (`w`, uçmuyorsa; haritasız savaşta ortam
  "Sualtı / bataklık" ise) ortam ne olursa olsun: piercing olmayan yakın dövüş saldırısı
  dezavantajlı (yüzme hızı modellenmediği için kimsede yok sayılır), menzilli silah saldırısı
  dezavantajlı, normal menzil ötesinde otomatik ıska. Bataklık haritasında derin su olmadığı
  için orada artık silah dezavantajı yok.

## 2026-10-16 — İtme (Shove) ve zorunlu hareket

**Karar (SRD 5.2.1):**

- **Shove** (Rules Glossary → Unarmed Strike, **s. 191**): hedef STR ya da DEX save'i yapar
  (kendisi seçer: motorda yüksek olanı), DC = 8 + saldıranın STR modifier'ı + yetkinlik
  bonusu; başarısızsa saldıran 5 ft itmeyi ya da Prone'u seçer (komutta önceden seçilir).
  Hedef en çok bir boyut büyük olabilir. Attack eylemindeki bir saldırının yerine geçer
  (Extra Attack ile itme + saldırı). Paralyzed/Stunned/Unconscious hedef save'i otomatik kaçırır.
- **Boyut ve yetkinlik:** canavarlara SRD boyutu (`size`: Goblin Warrior Small; Giant
  Spider, Ogre, Owlbear, Minotaur, Troll, Wyvern, Young Red Dragon Large; Hill Giant Huge;
  diğerleri Medium) ve CR'den yetkinlik bonusu eklendi. Karakterin boyutu türünden (Medium
  seçilebiliyorsa Medium, yoksa Small).
- **Haritada yön:** saldıranın altıgeninden hedefinkine giden eksen yönünün devamı. Geçilmez
  zemin, kapalı kapı, başka yaratık, harita dışı ya da **daha yüksek zemin** arkadaysa
  itilmez (SRD'de yokuş yukarı itme yok; 10 ft'lik basamağa itme yerine engel sayıldı);
  yalnızca Prone seçilebilir. Haritasız savaşta konum olmadığından yalnızca Prone uygulanır.
- **Zorunlu hareket** (ortak fonksiyon `battle/forced.ts`): fırsat saldırısı tetiklemez.
  İtilen altıgene girmiş sayılır: lav anında ölüm (uçan hariç), alev, buz, batak (batma
  sayacı, zehir), bilinen/gizli tuzak, derin su (batma kuralları tur başı/sonu işler),
  Spirit Guardians yayılımı.
- **Düşme** (Falling, **s. 182**): her 10 ft için 1d6 bludgeoning (en çok 20d6), hasar
  alırsa Prone. Yükseklik altıgenden: bir seviye = 10 ft (tırmanmanın 2 altıgen = 10 ft
  harcamasıyla aynı ölçek); `h` (1) → `.` (0) 10 ft, `z` (2) → `.` 20 ft. **Uçurum/yarık
  (`u`)** 30 ft derin sayıldı (+ başlangıç altıgeninin yüksekliği); itilen dibine (o
  altıgene) düşer, sonra komşu altıgene yürüyerek çıkar (tırmanma basitleştirildi). Uçan
  yaratık düşmez. Suya düşmede SRD'deki tepkiyle yarı hasar seçeneği yok (su altıgenine
  düşme olmadığı için).
- **Büyüyle itme:** Thunderwave (`pushFt: 10`) başarısız save'de büyücüden uzağa iki adım
  aynı fonksiyonla iter (her adımda büyücüden uzaklaşan ve doğrultuya en uygun komşu; engelde
  durur; lavda ölür).
- **Arayüz:** yüzen menüde "İt"; bitişik itilebilir hedefler parlar; hedefe dokununca balonda
  itileceği altıgen ve sonuç ("Lav! Düşerse ölür", "Uçurum! 40 ft düşer (4d6)", "İtilemez:
  arkada duvar"), hedefin save'i ve DC; altıgen haritada vurgulanır. Save sonucu günlüğe.
- **Yapay zekâ (iki taraf):** bitişik hedefin arkası lav, uçurum, derin batak (saplanır, zehirlenir, boğulabilir) ya da en az 20 ft düşüşse ve
  hedefin save'i kaçırma şansı en az %30 ise (DC − hedefin en iyi STR/DEX save'i ≥ 6) önce
  iter; değilse eskisi gibi saldırır.

## 2026-10-16 — Gizlenme haritada görünür (Adım 10d)

**Karar:**

- **Gizlenme yerleri:** sırası gelen oyuncu karakterinin kendi altıgeni ve bu tur yürüyebildiği
  altıgenlerden gizlenme yeri olanlar kesik çizgili iç altıgenle işaretlenir (katalogdaki
  `hide`, haritanın `hideTerrain`'i, ormanın ağaç yanı). Gizlen kapalıysa düğme soluk durur,
  dokununca nedeni yazar ("Burada gizlenilemez (Açık zemin); işaretli bir altıgene yürü.",
  "Zaten gizli (DC n).", eylem ekonomisi).
- **Motor düzeltmesi:** ormanın `stealth` kuralındaki `hideAdjacentTo: ["a"]` (ağacın yanında
  gizlenme) veride vardı ama uygulanmıyordu; artık uygulanıyor (bonus `hideBonus`'tan, yoksa 0).
- **Gizli jeton:** zemine uygun örtü (kumda kum yığını, çalılık ve ağaç yanında yaprak, başka
  yerde gölge), kapalı göz simgesi, yarı saydam; sahibinin ekranında "Gizli (DC n)" etiketi.
- **Perde (tek cihaz):** ekran sırası gelenin gözünden çizilir. Oyuncu karakterinin turunda
  düşmanın gizli jetonu hiç çizilmez; düşman/masum turunda ve kurulumda (GM ekranı) oyuncunun
  gizli jetonu çizilmez. Sıra şeridinde karşı tarafın gizlisi "?" görünür. GM ekranında ≡
  menüsünde "Gizli jetonları göster" anahtarı (varsayılan kapalı). Günlük satırları ortak
  kalır (gizlenme zarı yazılır); online sürümde oyuncuya göre süzülecek.
- **Ortaya çıkma:** bulununca, saldırınca, büyü yapınca (ya da yürüyünce) jetonda kısa toz
  veya yaprak savrulması (0,8 sn); "hareketi azalt" açıksa yok. Tam animasyonlar Adım 12'de.

## 2026-10-16 — Harita adları, Dağ (yaz/kış), kara ekran kontrolü, mağara ışığı

**Karar:**

- **Görünen adlar sadeleşti** (kimlikler ve dosya adları aynı): Ada, Bataklık, Çöl, Dağ,
  Dungeon, Güverte, Kale, Mağara, Orman, Şehir Meydanı, Taverna, Volkan. Parantezli varyant
  adları da sadeleşti (Kale: Gündüz/Gece; Şehir Meydanı: Gün/Gece). Simülasyon senaryo adları
  "Harita — varyant" biçiminde.
- **Dağ ve Buzul birleşti:** tek harita `dag` ("Dağ"), varyantlar `yaz` (eski Dağ geçidi:
  görsel, zemin, kurallar) ve `kis` (eski Buzul dağı: kendi zemini, başlangıç bölgeleri,
  `ice`/`cold` kuralları ve Buzul ortamı). Görseller `harita-dag-yaz.webp` ve
  `harita-dag-kis.webp`. Harita sayısı 13 → 12; `buzul` kimliği kalktı.
- **Varyant düzeni:** harita şemasında varyant başına isteğe bağlı `tiles`, `startZones`,
  `mirrorable` (ve önceden olan `rules`, `environmentId`); verilirse haritanınkini ezer.
  `getMap(id, { variantId, mirrored })` varyantın düzenini yükler; aynalama varyantın kendi
  zemini ve başlangıç bölgeleriyle yapılır; doğrulama her varyantın düzenini ayrı denetler.
- **Kara ekran (fırtınalı Çöl, Güverte, Ada, Mağara):** kullanıcının ekran kaydında efekt ve
  altıgen katmanları çiziliyor, harita görseli hiç görünmüyordu. Burada (başsız ve tam
  Chromium, telefon ve PC, açık/koyu tema, aynalı/aynasız, kurulum ve savaş) yeniden
  üretilemedi; dosyalar sağlam (aynı WebP yapısı, 1280×715) ve kod yolu bütün varyantlarda
  aynı. Sonuç: o tarayıcıda görsel yüklenemedi ya da çözülemedi (kullanıcıda sonra kendiliğinden
  düzeldi; büyük olasılıkla önbellek veya yerel dosya). Koruma: harita görseli SVG `<image>`
  yerine düz `<img>`; yüklenemezse sahnede "Harita görseli yüklenemedi: …" uyarısı ve konsol
  hatası; efekt çizimi hata verirse ya da tuval bağlamı kaybolursa efektler durur, harita kalır.
- **Otomatik kara ekran kontrolü:** `npm run check:harita` (Playwright; ilk sefer
  `npx playwright install chromium`). Her harita × varyant × aynasız/aynalı × efekt
  kapalı/açık × telefon/PC için savaş ekranını açar; sahnenin ortalama parlaklığını ve boş
  piksel oranını harita görselinin kendisiyle karşılaştırır (sahne ≥ görselin %55'i, boş
  piksel en çok +%20, mutlak alt sınırlar), görsel uyarısını ve sayfa hatalarını yakalar.
  Bozuk ve eksik görselle denendi, ikisini de yakalıyor. Menü videosu (H.264) savaş ekranında
  olmadığı için başsız tarayıcıda oynatılamaması etkilemiyor.
- **Karanlık gölgesi:** görülmeyen altıgenlerin gölgesi %55 → %38 opaklık; harita ve jetonlar
  okunur.
- **Mağara ışığı:** meşale yarıçapı 2; kristaller loş, yarıçap 1 (kurala yeni
  `tileLightRadiusHexes`, katalogdaki kristal ışığı başka haritalarda 4 kalır); 4 meşale
  (kristallerin üstündeki 5 ve bir yinelenen ışık kaldırıldı). Yürünebilir altıgenlerin
  %54'ü aydınlık (hedef %40–60). Kristaller de yarıçap 2 olsa meşalesiz bile %63 olurdu.
- **Yüzen menü:** düğmeler tek yaya sığmayınca (savaşçıda 10 düğme, kenardaki jeton) iç içe
  halkalara, birbirine değmeden yerleşir; önceden kenara itilip üst üste biniyordu.

## 2026-10-15 — Masumları koru: masum ölümü bilgi amaçlı, yerleşim düşmandan uzak

**Karar:**

- **Masumların ölümü savaşı kaybettirmez;** GM hikâyede işler. Kazanma/kaybetme eskisi gibi:
  düşmanlar yenilirse parti kazanır, parti (masumlar hariç) düşerse kaybeder. Haritanın
  `minSurvivorsRatio` (en az yarısı hayatta) değeri yalnızca GM'in kurulumda açtığı **sıkı
  kural** ("Masumların yarısı ölürse kaybedilir", varsayılan kapalı) ile kaybettirir
  (`map.objective.strict`).
- **Sayım sürer (bilgi amaçlı):** ekranda "Masumlar: x/n hayatta" (sıkı kuralda gereken sayı
  da yazılır); savaş sonu özetinde kurtarılan ve ölen masum.
- **Varsayılan yerleşim:** masumlar düşmanlardan en uzak, partinin bir üyesinden yürüyerek
  ulaşılabilen ve tehlikesiz (alev, batak, buz, tuzak olmayan) altıgenlere. Eski "ortada"
  yerleşimi GM kurulumunda seçenek.
- **Yapay zekâ değişmedi:** masumlar düşmandan kaçar; düşmanlar onları (en yakın hedef
  olarak) hedef alabilir.
- **Denge ölçümü:** parti galibiyeti yalnızca düşmanların yenilmesine göre; "ortalama
  kurtarılan masum" sütunu eklendi. Simülasyondaki eski "masumları parti arkasına koy" ara
  çözümü kaldırıldı (artık varsayılan yerleşim).

## 2026-10-15 — Sınıf özellikleri, konsantrasyon ve fırsat saldırısı

**Karar (SRD 5.2.1):**

- **Sneak Attack (Rogue):** 5. seviyede 3d6 (seviyenin yarısı, yukarı). Turda bir kez
  (başkasının turu ayrı tur sayılır: fırsat saldırısında da olur), Finesse veya menzilli
  silahla, saldırı avantajlıysa ya da dezavantaj yokken hedefin 5 ft yakınında Incapacitated
  olmayan bir müttefik varsa. Ek hasar silahın türünde, kritikte zarlar iki kat.
- **Fighter:** Action Surge (2. seviyede 1, 17'de 2): eylemini kullandıktan sonra bir eylem
  daha, turda bir kez; o eylemle büyü (Magic eylemi) yapılamaz. Second Wind: bonus eylem,
  1d10 + seviye HP; 1–3: 2, 4–9: 3, 10+: 4 kullanım. Kullanımlar savaş içinde yenilenmez.
- **Hunter's Mark (Ranger):** bonus eylem, 90 ft, konsantrasyon; işaretli hedefe her saldırı
  isabetinde 1d6 force. Hedef 0 HP'ye düşünce bonus eylemle işaret taşınır. Favored Enemy:
  Hunter's Mark her zaman hazır, slotsuz kullanım 1–4: 2, 5–8: 3, 9–12: 4, 13–16: 5, 17+: 6
  (önce bunlar harcanır; slot seviyesi açıkça istenirse slot).
- **Konsantrasyon:** veride `concentration` işareti (SRD süresi "Concentration" olan büyüler).
  Yeni konsantrasyon büyüsü eskisini bitirir. Hasar alan CON save yapar (DC 10 veya hasarın
  yarısı, en çok 30); başarısızsa biter. 0 HP'ye düşen veya Incapacitated olan yaratığın
  konsantrasyonu biter. Büyünün koyduğu durumlar (Hold Person: Paralyzed, Sleep: Unconscious)
  konsantrasyon bitince kalkar.
- **Spiritual Weapon:** konsantrasyon (5.2.1). Güç hedefin yanında belirir: yakın dövüş büyü
  saldırısı (menzil 60 ft + gücün 5 ft'i; "yanında düşman" dezavantajı yok). Sonraki
  turlarda bonus eylemle güç 20 ft (4 altıgen) uçar ve yanındakine yeniden saldırır. Gücün
  altıgeni hedefin, eski yerine en yakın komşusu. Üst slotta her seviye +1d8.
- **Spirit Guardians:** konsantrasyon, 15 ft yayılım büyücüyle yürür, yalnızca düşmanlar.
  Düşman yayılıma girince, yayılım ona girince (büyücü yürüyünce) ve turunu yayılımda
  bitirince WIS save; 3d8 radiant (iyi/tarafsız büyücü), başarıda yarısı; yaratık turda
  yalnızca bir kez save yapar. Yayılımda hız yarıya iner (altıgen maliyeti iki kat). Büyü
  yapıldığında içindekiler de save yapar (yayılım onların alanına "girer" yorumu; önceki
  davranış korundu). Üst slotta her seviye +1d8.
- **Fırsat saldırısı:** gördüğü bir yaratık kendi hareketiyle erişiminden çıkarken, tepkisi
  duran ve aksiyon yapabilen düşman, hareketten hemen önce en iyi yakın dövüş saldırısıyla
  (karakterde en yüksek ortalamalı yakın dövüş silahı, canavarda save'siz yakın dövüş
  saldırısı) bir kez saldırır; tepki harcanır. Ayrılma (Disengage) yapan tetiklemez. Düşen
  yürüyemez. **Tepkiler otomatik kullanılır** (oyuncuya sorulmaz; arayüzde tepki penceresi yok).
- **Haritasız savaş:** konum olmadığından "yanında" ve "yayılımın içinde" aynı yükseklik
  bandı sayılır: Sneak Attack yandaşı hedefle aynı yükseklikte yakın dövüşçü müttefik;
  Spirit Guardians büyücüyle aynı yükseklikteki düşmanlar; yükseklik değiştiren, aynı
  banttaki düşmanlardan fırsat saldırısı yer (tırmanma başarılıysa, yer değiştirmeden önce).
- **Yapay zekâ:** yaralıyken (HP yarı veya altı) Second Wind; saldırabilecekken önce Hunter's
  Mark, işaretli hedef düşünce işareti taşıma; Spiritual Weapon'ı bonus eylemle önce (turda
  tek slot kuralı: eyleme cantrip kalır), Spirit Guardians en az iki düşmanı alacaksa o
  yeğlenir; sonraki turlarda güçle saldırı. Eylemini harcayıp hâlâ vurabileceği hedef varsa
  Action Surge. Haydut Sneak Attack'ın tuttuğu hedefi ve (yakındaysa) yeri yeğler; fırsat
  saldırısı yiyecek yürüyüşten önce Cunning Action ile ayrılır. Konsantre olan yeni
  konsantrasyon büyüsü yapmaz.
- **Arayüz:** radyal menüde Atılım (Action Surge), Nefes (Second Wind) ve konsantrasyon
  sürdürme (Silah / İşaret: parlayan hedefe dokunulur). Çekmece kalan kullanımları ve
  konsantrasyonu gösterir.

**Kapsam dışı:** Hold Person'ın tur sonu tekrar save'i, 2024 Sleep'in yeni işleyişi (motor
eski HP havuzunu kullanır), Steady Aim ve diğer alt sınıf özellikleri.

## 2026-10-15 — Denge ölçümü altyapısı (Adım 11)

**Karar:**

- **Simülasyon:** `npm run sim -- [savaş sayısı] [senaryo...]` (`src/sim/`). Her senaryo
  1..N tohumlarıyla (mulberry32) oynanır; aynı tohum aynı savaşı verir. İki taraf da
  `battle/ai.ts` ile oynar; 20 turda bitmeyen savaş "berabere" sayılır.
- **Parti (5. seviye, oluşturucu kurallarına uygun):** Bor (Dwarf Fighter, Chain Mail +
  kalkan, Longsword, Light crossbow), Mira (Elf Wizard: Fire Bolt, Ray of Frost, Magic
  Missile, Sleep, Scorching Ray, Hold Person, Fireball), Tavi (Human Cleric: Sacred Flame,
  Guiding Bolt, Healing Word, Cure Wounds, Spiritual Weapon, Spirit Guardians), Sela
  (Halfling Rogue, Rapier, Shortbow), Kael (Elf Ranger, Longbow, Shortsword, Cure Wounds).
- **Senaryolar** XP bütçesiyle (SRD 5.2.1 CR → XP): Düz (haritasız), Çöl gündüz, Volkan,
  Orman, Mağara karanlıkta, Kale gündüz, Taverna masumlarla (masumlar ortada ve parti
  arkasında iki çeşit).
- **Yapay zekâ partiye genişletildi:** ölmekte olan ya da çok yaralı müttefiki iyileştirme,
  en az iki düşmanı vuran ve hiç müttefik vurmayan alan büyüsü, en yüksek ortalama hasarlı
  saldırı (slotlu büyü yalnızca HP'si 12 ve üstü hedefe). Masumlar düşmandan uzaklaşır.
- **Ölçümde bulunan yapay zekâ kusurları düzeltildi:** (1) iki taraf 3/4 siper arkasından
  karşılıklı dezavantajlı atışla kilitleniyordu (Çöl'de savaşların %15'i 20 turda
  bitmiyordu): kötü koşullu atışta (dezavantaj ya da 3/4 siper) önce daha iyi bir yere
  yürür, yoksa yine atar. Ortam her yerde dezavantaj veriyorsa (çöl, orman, mağara, dağ,
  fırtınada yaylar) yakın dövüşe geçer. (2) Atlama kullanmıyordu: Volkan'da kara
  düşmanları adasından çıkamıyordu; artık lav kanalı ve yarık üstünden atlar.
- **Ölçümde bulunan motor hatası:** kendi turunda 0 HP'ye düşen savaşçı (alevli altıgene
  yürüyen masum, tuzağa basan) turunu bitiremiyordu ve savaş kilitleniyordu (arayüzde de).
  Artık 0 HP'deki savaşçı yalnızca turunu bitirebilir. Kaçan masum tehlikeli altıgene girmez.
- **Hız:** yürünebilir altıgenler tek Dijkstra ile (`costsFrom`, `moveCostFn` yürüyüşle
  ortak), yalnızca seçilen yer motorda denenir.
- Sayılar (canavar istatistikleri, senaryo düşmanları) ölçüme göre değiştirilmedi; öneriler
  kullanıcıya soruldu.

## 2026-10-15 — Menü arka planı: açılış videoları

**Karar:**

- Giriş, oyuncu, oluşturucu, GM kurulum ve durum ekranlarının arka planı `public/acilis/`
  altındaki video ve posterler: geniş/yatay ekranda `acilis-pc-*`, dikey ekranda
  `acilis-mobil-*` (`(orientation: portrait)` medya sorgusu, döndürünce değişir); açık temada
  `*-light`, koyuda `*-dark` (otomatik temada sistem ayarı; tema değişince arka plan da değişir).
- `<video autoplay muted loop playsinline>`, poster `.webp`, `object-fit: cover`; üstte
  okunaklılık degradesi (açıkta beyaz %20→%40, koyuda koyu %30→%60; gerçek videolarla
  denendi, önceki %35→%55 açık temada görseli fazla soldurdu), kart ve formlar kendi yarı
  saydam panellerinde. Panel dışında kalan alt başlık ve çerçeveli (ghost) düğmeler de panel
  zemini alır (açık temada dikey telefonda vitray üstünde okunmuyordu).
- "Hareketi azalt" açıksa veya "Efektleri kapat" seçiliyse video yok, yalnızca poster.
  Video yüklenemezse (dosya yok, tarayıcı H.264 oynatamıyor) poster; poster de yoksa düz renk.
- Haritalı savaş ekranında arka plan bileşeni hiç yok (video çözülmez).
- Önceki yer tutucu arka planlar (`public/backgrounds/`) silindi. Eski arena videosu repoda ve
  uygulamada yoktu, dokunulmadı.

## 2026-10-15 — Haritada düşman yapay zekâsı (Adım 9)

**Karar:**

- **Adım adım tur:** `src/battle/ai.ts` sırası gelen düşman için bir sonraki komutu seçer;
  "Düşmanı oynat" turu, `end_turn` gelene kadar (en çok 6 komut) oynar. Her komuttan sonra
  durum yeniden okunur (zar sonuçları sonraki kararı etkiler).
- **Sıra:** (1) batağa saplandıysa Çık; (2) bulunduğu yerden saldırabiliyorsa saldırır;
  (3) saldıramıyorsa saldırabileceği en ucuz ve en güvenli altıgene yürür ve saldırır;
  (4) o da yoksa en yakın hedefe mesafeyi kısaltan güvenli altıgene yaklaşır; (5) turu
  bitirir. Eylemi harcandıysa yürümez, turu bitirir (geri çekilme yok).
- **Saldırı önceliği:** yenilenen (Recharge) save saldırısı > Multiattack > ilk uygun saldırı.
  Menzilli saldırısı olan (Goblin Warrior) yerinden ateş eder. Hedef: en yakın, eşitse HP
  oranı düşük parti üyesi (masumlar dahil); gizlenmiş veya karanlıkta görülmeyen hedef
  seçilmez.
- **Kaçındıkları:** alev, batak, buz, bilinen tuzak (yürüme zaten önce bunlardan geçmeyen yolu
  seçer), lav uyarısı olan altıgen (+100), lav kenarı (+8, lav kenarı kuralı varsa).
  Gönüllü lava girmek motorda zaten yasak. Uçan yaratık zeminden etkilenmez.
- **Kural kopyalanmaz:** yürünebilir altıgenler ve saldırının yapılıp yapılamayacağı motorda
  zarsız denenerek bulunur (menzil, görüş, siper, eylem ekonomisi aynen geçerli).
- **Haritasız savaş** eski davranış: en düşük HP oranlı hedefe saldırı.
- **Yok (sonraya):** konum taktiği (siper arkası, yükseklik arama, kuşatma), masum-öncelikli
  düşmanlar, büyü yapan düşman, geri çekilme ve Dash/Disengage kullanımı.

## 2026-10-15 — Kart savaşı arayüzü kaldırıldı; haritasız motor yolu testler için duruyor

**Karar:**

- Giriş ekranındaki "Hızlı demo" ve "Kart savaşı" düğmeleri, kart savaşı ekranı
  (`CardBattle`, kartlar, sekmeler), harita seçici (`MapPicker`), haritalı ekranın ≡
  menüsündeki "Kart savaşı" ve yalnızca bunlara ait stiller silindi. Kullanılmayan arayüz
  yardımcısı `src/ui/actions.ts` (kart ekranının eylem listesi) ve testleri de silindi.
- **Motor değişmedi:** haritasız savaş desteği (soyut yükseklik, `change_height`) ve testleri
  duruyor. `src/demo.ts` (Mira, Bor, Troll, Wolf; `createDemoSession`, `createMapSession`)
  testlerde fixture olarak ve oluşturucunun örnek karakterleri için kalıyor; arayüze ait
  senaryo etiket listesi silindi.
- **Hızlı denemenin yerine** GM ekranında "Hazır savaş": örnek karakterleri (kayıtlı değilse
  ekler) partiye, Çöl haritasını (Gündüz) ve bir Troll ile iki Wolf'u seçili getirir; GM
  "Savaşı kur" ile tek tıkla kurar.

## 2026-10-15 — Bütünleşik uygulama (Adım 13, C)

**Karar:**

- **Giriş ekranı, iki rol, tek cihaz:** Oyuncu ve GM düğmeleri yalnızca hangi ekranın
  açılacağını seçer; kimlik/oturum yok (online sonra). Ayrıca hızlı demo (Mira ve Bor),
  kart savaşı ve Durum.
- **Karakter oluşturucu** (React, tek uzun form): kimlik ve avatar, tür (miras) ve sınıf,
  skorlar (standart dizi veya point buy 27 puan, 8–15), geçmiş bonusu (+2/+1 veya
  +1/+1/+1, skor seçiminin yanında), sınıf becerileri (SRD sayı ve listesi) ve geçmiş/tür
  becerileri (en çok 3), zırh, kalkan, silah, eşya, büyüler (sınıf listesi ve slot
  seviyesine göre). Sağda türetilen değerler ve sorunlar canlı; sorun varken kaydedilmez.
  Kurallar `src/rules/builder.ts`'te (saf, testli). Geçmiş ve köken yetenekleri (origin feat)
  ayrı seçim olarak yok; geçmiş yalnızca bonus ve beceri olarak giriliyor.
- **Kayıtlı karakterler** tarayıcı belleğinde (bu cihaz). Yoksa yalnızca oturumda kalır.
  "Örnek karakterleri ekle": Mira ve Bor'un kurallara uyan kopyaları (standart dizi; Mira'da
  Cure Wounds yok, wizard büyüsü değil). Hızlı demodaki Mira ve Bor değişmedi (denge ölçümü
  onlarla yapıldı).
- **GM ekranı:** parti seçimi (hazır karakterler), canavar listesi ve adet, özel canavar
  (ad, AC, HP, hız, tek saldırı: bonus, hasar zarı, tür, yakın/menzilli 80/320), harita,
  varyant, aynalama, isteğe bağlı kurallar ve masum sayısı. Sorunlar (boş parti, düşman yok,
  başlangıç bölgesine sığmıyor) çözülmeden kurulmaz. Kurulan savaş haritalı ekranda açılır;
  herkes otomatik yerleşir, GM "Savaşı başlat" der.
- **Düşman turları:** sırası düşmandayken sağ altta "Düşmanı oynat": mevcut basit yapay zekâ
  (hedef seçer, saldırır, turu bitirir). Haritada yürüme ve menzil düşünmüyor; erişimde
  değilse yalnızca turu bitirir. Haritalı yapay zekâ Adım 9.
- **Savaş sonu özeti:** kazanan, tur sayısı ve savaşçı başına verilen/alınan hasar,
  iyileştirme, düşürme, son HP (olaylardan hesaplanır; harita etkilerinin hasarı "aldığı"na
  sayılır, kimsenin "verdiği"ne değil).
- **Durum sayfası:** `docs/harita/GOREV.md`'nin "Adımlar" bölümü okunur; satırın sonunda
  "(tamam)" olan adımlar tamam sayılır. Adım bitince yalnızca bu işaret eklenir.

## 2026-10-15 — Harita efektleri (Adım 10c, B)

**Karar:**

- **Veri güdümlü:** her varyantta `effects` listesi: `type`, `intensity` (0–1), isteğe bağlı
  `color` ("#rrggbb") ve `points` (görsel pikseli, 1280×715; aynalı haritada yatay çevrilir).
  19 tür: rain, lightning, waveGlint, waterSparkle, fog, bubbles, fireflies, sparks, snow,
  iceGlint, dust, lightShafts, leaves, flicker (meşale/şömine), crystalFlicker, drip,
  heatHaze, sandstorm, lavaGlow. Yükleyici türü, yoğunluğu, rengi ve noktaları doğrular.
- **Zemine bağlı türler** `points` verilmezse ilgili harflere oturur: dalga parıltısı `w`, su
  parıltısı `w n`, kabarcık `b n`, ateşböceği `b g a`, kıvılcım `~ f`, buz parıltısı `i q`,
  titreme `f`, kristal `e`, damlama `v e`, lav parıltısı `~`. Lav yükselince lav parıltısı
  yeni lav altıgenlerine geçer. Diğerleri bütün görsele yayılır.
- **Meşale/fener/şömine konumları** görsellerden piksel olarak alındı (zindan 6, kale gece 9,
  şehir gece 7, taverna şömine + 9 mum). Görsel değişirse yalnızca `points` güncellenir.
- **Varyantlar:** ada/gemi fırtına: yağmur + şimşek + dalga; ada/gemi güneş: su parıltısı;
  bataklık: sis + kabarcık + ateşböceği; mağara: kristal + damlama; zindan: meşale + toz;
  kale ve şehir gece: meşale/fener; kale ve şehir gündüz: hafif toz; buzul: kar + buz
  parıltısı; dağ: sis; orman: ışık huzmesi + yaprak; taverna: şömine + mum + toz;
  çöl gündüz: sıcak dalgası + toz; çöl akşam: kum fırtınası + toz; volkan: lav parıltısı +
  kıvılcım + sıcak dalgası.
- **Performans:** canvas, görselin dörtte biri çözünürlükte (320×179) çizilir ve CSS ile
  büyütülür (piksel görünüm); en çok 30 kare/sn; sekme gizliyken çizmez; parçacık sayısı
  yoğunlukla ölçeklenir (en çok ~320). Katman harita görseliyle altıgen/jeton katmanı
  arasındadır, dokunmayı engellemez.
- **Erişilebilirlik:** sistemde "hareketi azalt" açıksa efektler varsayılan kapalı; ≡
  menüsünde "Efektleri kapat/aç" (cihazda hatırlanır). Efektler yalnızca görünüştür,
  kurallara dokunmaz (prototipteki SVG ısı bozulması filtresi kullanılmadı: telefonda pahalı).

## 2026-10-15 — Tema ve menü arka planı (A)

**Karar:**

- **Tema:** varsayılan sistem ayarı (`prefers-color-scheme`). Düğme sırayla otomatik → açık
  → koyu; seçim `<html data-theme>` ile CSS'e geçer, cihazda hatırlanır (tarayıcı belleği
  yoksa yalnızca oturumda). İlk çizimden önce uygulanır. Düğme harita seçiminde, kart
  ekranında ve haritalı ekranın ≡ menüsünde.
- **Arka plan:** menü ve oluşturucu ekranlarında (`.menu-screen`) tek açık ve tek koyu görsel:
  `public/backgrounds/menu-light.webp` ve `menu-dark.webp` (1280×720, ~7 KB yer tutucu,
  piksel desen). Görseli değiştirmek için aynı adla dosyayı koymak yeterli; kod değişmez.
  Haritalı savaş ekranı kendi harita görselini kullanır, temadan etkilenmez (yüzen arayüz
  her iki temada koyu).

## 2026-10-15 — Harita kuralları (Adım 8c: karanlık, mazgal, kapı, masumları koru)

**Karar:**

- **Karanlık (`darkness`):** hedef aydınlık altıgendeyse görülür; değilse görüş mesafesi
  karanlık görüşü olan için `darkvisionHexes` (12), olmayan için `unlitSightHexes` (3).
  Karanlık görüş evet/hayır: ırktan (`races.json`) ve canavardan (`monsters.json` →
  `darkvision`, SRD 5.2.1 Senses satırı); mesafe kuralın değeri (yaratığın 120 ft'i
  sayılmıyor). Işık: kuraldaki `lights` ve ışık veren zemin (kristal `e`), yarıçap
  `lightRadiusHexes`. Görülmeyen hedef seçilemez; hedefin göremediği saldıran avantajlı.
  Zindan ve gece şehrinde karanlık isteğe bağlı; bu iki etkinin bayrakları JSON'a eklendi
  (mağaradakiyle aynı). **Veri sorunu:** mağaradaki 10 ışık 4 yarıçapla haritanın tamamını
  aydınlatıyor, yani mağarada karanlık şu an hiçbir şey değiştirmiyor. Öneri: ışık
  yarıçapını 2 yapmak veya ışık sayısını azaltmak (kullanıcı kararı).
- **Mazgal (`crenel`):** `fromTerrain` (sur `h`, kule `z`) üstündeki hedefe daha alçaktan
  menzilli saldırıda 3/4 siper (+5 AC); yakın dövüşte yok.
- **Kapı (`gate`):** GM açar/kapatır (`gate` komutu); kapalı kapı yeni katalog harfi `O`
  (geçilmez, görüşü keser), altında biri varken kapanmaz. Kapalı kapı silahla kırılır
  (`attack_gate`, Attack eylemi gibi Extra Attack'tan düşer): AC 15'e karşı saldırı zarı,
  hasar kapının 30 HP'sinden düşer, 0'da kırılır ve bir daha kapanmaz.
- **Masumları koru (`objective`, isteğe bağlı):** kurulumda açılınca 4–6 masum eklenir
  (kuraldaki HP 4, AC 10, 6 altıgen hız, silahsız). GM yönetir ve yerleştirir (düşman
  bölgesi dışında tehlikesiz bir altıgen). 0 HP'de ölür (ölüm save'i yok). Masumlar partiyi
  ayakta tutmaz; hayatta kalan masum `minSurvivorsRatio` (yarısı, yukarı yuvarlanır) altına
  düşünce düşmanlar kazanır.
- **Yürüme yolu:** önce alev, batak, buz ve bulunmuş tuzaktan geçmeyen yol aranır; yoksa en
  ucuzu. Hedefin kendisi tehlikeli olabilir (bilerek girilir).
- **Harita ekranı:** kurulumda isteğe bağlı kurallar (Karanlık, Masumları koru ve masum sayısı)
  seçilir; masumlar ortaya yakın yerleşir, GM taşıyabilir. ≡ menüsünde haritaya göre GM
  olayları (patlama: altıgene dokun, lav yükselmesi, dalga, kapıyı aç/kapat). Lav uyarısı
  kırmızı yanıp söner, bulunmuş tuzak ⚠, karanlık altıgenler koyu. Batağa saplanana yüzen
  menüde "Çık", yanında saplanmış müttefik olana "Çek". Saldır kipinde kapalı kapıya dokununca
  silahla "Vur" balonu. Masumları korurken sol üstte "Hayatta kalan masum: x/n".

## 2026-10-15 — Harita kuralları (Adım 8b: batak, su, buz, soğuk, tuzak)

**Karar:**

- **Batak (`bog`, `b`):** girmek `moveCostPerHex` (3) altıgen; girince Poisoned, batma sayacı
  `onEnter.sinkCounter` (1) ve yürüyüş biter. Saplanan yürüyemez ve atlayamaz. Kendi turunun
  başında 1d6 zehir ve sayaç +1; sayaç `drownAtCounter` (3) olunca boğulur: HP 0 (oyuncu ölüm
  save'lerine başlar). **Çık** (`escape`, eylem): Athletics DC 12; başarıda en yakın sağlam ve
  boş altıgene çıkar. **Çek** (`pull`, eylem): bitişik müttefik, çekenin Athletics DC 12'si;
  çekilen, çekene yakın sağlam altıgene çıkar. Çıkınca **kalıcı zehir**: tur başı 1d4, tur sonu
  CON DC 12 başarılıysa biter ve Poisoned kalkar (Lesser Restoration ile bitirme elle).
- **Derin su (`deepWater`, `w`) ve hendek (`moat`, kale `n`):** ağır zırhlı, kendi turunun
  başında Athletics DC 12; başarısızsa batma sayacı +1, `drownAfterRounds` (3) olunca boğulur.
  Başarı sayacı düşürmez; sudan çıkınca sıfırlanır. Hendek kuralına JSON'da aynı parametreler
  eklendi (önceden yalnızca not vardı).
- **Buz (`ice`, `i`):** girince DEX DC 10; başarısızsa Prone ve bu turun hareketi biter.
- **Soğuk (`cold`):** tur sonunda barınakta değilse CON DC 12, 1d4 soğuk. Barınak: gölge veren
  zemin (altıgen veya komşu) ya da yanında daha yüksek zemin.
- **Tuzak (`trap`, `j`):** basan DEX DC 13, başarısızsa 2d6 delici; yürüyüş orada biter; bir
  kez çalışır. Ara (Search) toplamı Perception DC 13'ü geçerse 6 altıgen içindeki tuzaklar
  bulunur (harita ekranında gösterilecek). Bulunmuş tuzağa basan yine tetikler.

## 2026-10-15 — Harita kuralları motoru (Adım 8a: çatı, çöl, volkan, tırmanma)

**Karar:**

- **Kurallar veri:** Varyantın `rules` listesi; DC, hasar, tur sayısı JSON'dan okunur (eksik
  parametre hata verir, kodda varsayılan yok). `src/battle/maprules.ts` dört kancada çalışır:
  tur başı (sırası gelen), tur sonu (sırası biten), altıgene giriş (yürürken her adım),
  saldırı (menzil denetiminde). Yeni tura geçiş ayrıca bir kanca (lav yükselmesi).
- **Olaylar:** `map_effect` (save/beceri zarı, hasar, durum, sayaç, yer değiştirme, hareketi
  bitirme), `tile_changed`, `lava_warning`, `map_note`. Hasar direnç/bağışıklık ve 0 HP
  kurallarından (ölüm save'i, Undead Fortitude, yenilenme) geçer.
- **GM tetiklemeli:** `map_trigger` komutu: `eruption` (merkez altıgen; herkese aynı 4d6, DEX
  save'de yarısı), `lavaRise` (`startRound`'dan önce reddedilir; lava bitişik kara altıgenleri
  uyarılır, bir sonraki tur başında lav olur, üstündeki uçmayan ölür), `swell` (gemi fırtına:
  herkes DEX save, başarısızsa Prone). `everyRounds` aralığını GM izler (zorlanmıyor).
- **İsteğe bağlı edilgen kurallar** (`optional: true`, tetiklemesiz: karanlık, masumları koru)
  kurulumda `MapState.options` ile açılır; kapalıysa hiç çalışmaz.
- **Çöl gündüz (`heat`):** ağır zırhlı ve gölgesizse tur sonunda CON save. Gölge: altıgen veya
  komşusu gölge veren zemin (`r`, `c`, `k`). Ağır zırh `Combatant.heavyArmor` (zırh türünden).
- **Çöl akşam (`sandstorm`), fırtına (`storm`):** görüş sınırı dışındaki hedef seçilemez;
  4 altıgenden uzağa menzilli saldırı dezavantajlı; kum fırtınasında gizlenme zarı avantajlı.
  Fırtınadaki "ateş büyüsü dezavantajı" fırtına ortamından (`environments.json`) zaten geliyor.
- **Lav kenarı (`lavaEdge`):** lava bitişik altıgende tur başında 1d6 ateş, save yok; uçan
  etkilenmez. **Alev (`f`):** girince ve turu içinde bitirince 1d6 ateş (her haritada, zemin
  kataloğundan).
- **Tırmanma (`climb`):** yükseğe geçerken çıkılan her seviye için `heightDiffCost` (2) altıgen,
  zemin maliyetinden büyükse o; inmek normal. Uçan yaratık etkilenmez. Atlama inişinde yok.
- **Yürüyüş adım adım:** girilen altıgenin kuralı yürüyüşü kesebilir (buz, batak, tuzak, 0 HP);
  o zaman yalnızca o ana kadarki yol ve maliyet yazılır.

## 2026-10-15 — Tur içi eylem ekonomisi (Adım 5d)

**Karar:**

- **Bir eylem, bir bonus eylem, bir tepki ve hareket** (SRD 5.2.1). `Combatant.economy` neyin
  harcandığını tutar. Eylem, bonus eylem, kalan saldırılar, koşma ve ayrılma kendi turunun
  başında yenilenir; tepki de kendi turunun başında (turlar arası bir tepki).
- **Eylem harcayanlar:** silah saldırısı (Attack), canavar saldırısı, Multiattack (tek eylem),
  eylem süreli büyü, Hide, Search, Dash, Disengage, stabilize. Hareket, yükseklik değiştirme
  (haritasız) ve turu bitirme eylem harcamaz. GM'in beceri kontrolü ve kurulum da harcamaz.
- **Extra Attack:** Attack eylemi `attacksPerAction` saldırı içerir (Fighter 5/11/20: 2/3/4;
  Barbarian, Monk, Paladin, Ranger 5: 2). İlk saldırı eylemi harcar, kalanlar aynı eylemden
  düşer; arada yürünebilir. Canavarlar Multiattack ile tek eylemde çok saldırır.
- **Büyü süresi:** `spells.json` → `castingTime` (SRD 5.2.1 Casting Time): 65 eylem, 14 bonus
  eylem (Healing Word, Misty Step, Spiritual Weapon, Shield of Faith, Hunter's Mark, Hex…),
  3 tepki (Shield, Counterspell, Hellish Rebuke). Tepki büyüleri başkasının turunda da
  yapılabilir (etkileri hâlâ elle uygulanır). **Turda yalnızca bir büyü slotu harcanır**
  (SRD 5.2.1 kuralı; 2014'teki "bonus eylem büyüsünden sonra yalnızca cantrip" kuralı yok).
- **Bonus eylemle Hide/Dash/Disengage:** Rogue 2. seviye (Cunning Action) ve Goblin Warrior
  (Nimble Escape: Disengage, Hide). Arayüz, bonus eylem duruyorsa bunları bonusla yapar ki
  eylem saldırıya kalsın.
- **Dash:** bu tur hız bir kez daha eklenir (uçan yaratıkta uçuş hızı).
- **Olay:** başarılı komutun olaylarının ardına `action_used` eklenir (günlükte yalnızca bonus
  eylem ve tepki yazılır); başarısız komut hiçbir şey harcamaz.
- **Arayüz:** kart ekranında harcanmış eyleme bağlı seçenekler nedeniyle devre dışı; harita
  ekranında yüzen menüye Koş ve Ayrıl eklendi, altta bu turun eylem/bonus/tepki/hareket şeridi.
- **Yok (sonraya):** fırsat saldırısı (Disengage şimdilik yalnızca işaret), iki silahla dövüş
  (Light silahla bonus saldırı), Action Surge, Help ve Ready eylemleri.

## 2026-10-15 — Beceri yetkinlikleri (Adım 5c)

**Karar:**

- **18 SRD becerisi** (`src/rules/skills.ts`), her biri bir ability'ye bağlı. Beceri bonusu =
  ability modifier + proficiency (yetkinse), uzmanlıkta (Expertise) 2 × proficiency.
- **Karakter formu:** `skills` (yetkin olunan bütün beceriler) ve `expertise`. Kaynakları
  (sınıf, geçmiş, tür) ayrı tutulmuyor; form yalnızca adları, tekrarı ve "uzmanlık yalnızca
  yetkin olunan beceride" kuralını denetler. Sınıfın 1. seviye seçimi (sayı ve liste)
  `classes.json` → `skillChoices` alanında, SRD 5.2.1 sınıf tablolarından; oluşturucu
  `classSkillProblem` ile denetleyecek (Adım 13). Uzmanlık sayısı sınıfa göre denetlenmiyor.
- **Canavarlar:** SRD 5.2.1 stat bloklarındaki Skills satırı `monsters.json` → `skills`
  (toplam bonus). Olmayan becerinin bonusu ability modifier'ı. Örnek: Wolf Perception +5,
  Stealth +4; Troll Perception +5; Goblin Warrior Stealth +6.
- **Savaşta:** `Combatant.skills` yalnızca yetkin olunan becerileri tutar, `skillBonus` eksikte
  ability modifier'ına düşer (eski kayıtlar ve test savaşçıları bozulmaz). Gizlenme Stealth,
  arama Perception kullanır. Haritasız savaştaki tırmanma kontrolü (`climbMod`) artık
  Athletics ile Acrobatics'in yükseği (önce STR/DEX modifier'ının yükseğiydi).
- **GM beceri kontrolü:** `skill_check` komutu (yalnızca GM, sıra beklemez, durumu
  değiştirmez) ve `skill_checked` olayı. Ağır zırh Stealth'te dezavantaj. Adım 8'de bataklık
  (Athletics DC 12) ve tuzak (Perception DC 13) aynı yardımcıyı (`rollSkillCheck`) kullanacak.
- **Demo:** Mira (Wizard, Sage, Elf): Arcana, Investigation, History, Insight, Perception.
  Bor (Fighter, Soldier): Athletics, Perception, Intimidation, Survival. Geçmişle çakışan
  beceri yerine başka biri seçildi (SRD kuralı).
- **Yok:** Pasif Perception (SRD 5.2.1 Hide kuralında bulunma yalnızca Search ile), Jack of
  All Trades, Remarkable Athlete gibi sınıf özellikleri.

## 2026-10-15 — Harita içi arayüz (HUD) ve avatarlar (Adım 10b)

**Karar:**

- **Tam ekran, kaydırma yok:** Harita görsel oranını koruyarak pencereye sığdırılır; 10a'daki
  yakınlaştırma ve kaydırma kaldırıldı. Telefon yatayda (844×390) altıgen ~52 px yüksekliğinde.
  Üstteki sekmeler haritalı ekranda yok; kart savaşına sol üstteki ≡ menüsünden geçilir.
- **Yüzen eylem menüsü:** Sırası gelenin jetonunun çevresinde 56 px yuvarlak düğmeler
  (Hareket, Saldır, Büyü, Gizlen, Ara, Turu bitir). Düğmeler, sahnenin içinde kalan açılar
  arasından jetondan ortaya bakan yöne en yakın yaya dizilir; sığmazsa yarıçap büyür. Menü
  dokununca kapanmaz; jetona dokunmak menüyü açıp kapatır. Bir kipten çıkınca veya bir eylem
  yapılınca menü yeniden açılır. Yürüme 10a'daki gibi yeşil altıgene dokunarak.
- **Saldırı ve büyü akışı:** Saldır → vurulabilecek düşmanlar parlar → hedefe dokun → yanında
  balon (her saldırı için mesafe, siper, yükseklik, avantaj/dezavantaj) ve "Vur". Büyü →
  büyü listesi balonu → tek hedefli büyüde aynı akış ("Yap"), alan büyüsünde altıgene dokun,
  alan boyanır, balonda etkilenenler ve "Yap". Hedefsiz (elle uygulanan) büyü doğrudan yapılır.
- **Günlük ve toast:** Yeni günlük satırlarından son ikisi ve hatalar sol altta 4 sn toast
  olarak görünür (en çok 2 satır). "Günlük" düğmesi tam günlüğü açar.
- **Sıra şeridi ve çekmece:** Üstte avatarlı ince sıra şeridi; sırası gelen sarı halkalı, düşen
  soluk. Bir avatara dokununca sağdan karakter çekmecesi (HP, AC, hız, save'ler, saldırılar,
  büyüler, slotlar, durumlar).
- **Avatar:** `Combatant.avatar = { src, bg, label }`. Karakterde yol
  `avatars/<ırk>-<sınıf>-<erkek|kadin>.webp` (karakter sayfasında `gender`, yoksa `erkek`;
  `avatar` alanı verilirse o), canavarda `avatars/canavar-<id>.webp` (veya `avatar` alanı).
  Dosyalar `public/avatars/` altında, kare 256×256 WebP. Görsel tarayıcıda yüklenmeye çalışılır;
  yoksa ırk rengi zemin üstünde sınıfın iki harfi (Wi, Fi…) veya canavar adının baş harfleri.
  Jetonda çerçeve rengi tarafı gösterir (parti yeşil-mavi, düşman kırmızı). Henüz hiç avatar
  görseli yok; hepsi yer tutucu.
- **Testler:** Yerleşim (menü yayı, balon), parlayan hedefler ve büyü listesi saf fonksiyonlar
  olarak `src/ui/hud.ts`'te; testleri görselsiz.

## 2026-10-15 — Animasyon en sona bırakıldı

**Karar:** Saldırı ve büyü animasyonları en son adım (Adım 12). Önce kurallar, yapay zekâ ve
denge bitecek; animasyon olayların üstüne ayrı bir katman olarak eklenecek (olay kaydı zaten
her vuruşu, save'i ve hareketi içeriyor).

## 2026-10-15 — Haritalı savaş ekranı (Adım 10a)

**Karar:**

- **Izgara görselin pikselinde:** Görsel 1280×715; altıgen yarı genişliği görsel genişliği/23,
  yüksekliği görsel yüksekliği/7,5 (prototip ve `ver_*.jpg` önizlemeleriyle aynı yerleşim).
  Altıgenler bu yüzden tam düzgün değil, görsele oturuyor. SVG içinde çizilir; görsel
  `image-rendering: pixelated`, aynalı haritada görsel yatay çevrilir.
- **Boyut ve kaydırma:** Altıgen yüksekliği en az 44 px olacak şekilde harita en az ~591 px
  genişlikte; yakınlaştırma (+/−, 1×–3×) ve kaydırma (taşan kutunun kendi kaydırması) basit
  tutuldu. Dar dikey ekranda "yatay çevirin" notu.
- **Kurallar kopyalanmadı:** Yürünebilir ve atlanabilir altıgenler motorun `move`/`jump`
  komutları her altıgende denenerek bulunur (zar atmadıkları için yan etkisiz); saldırı
  önizlemesi motorun menzil/siper/görüş denetimini (`checkReach`) ve yüksekliği kullanır;
  alan önizlemesi `areaHexes`. Böylece ekran ve motor aynı sonucu verir.
- **Demo:** Haritalı savaş Mira, Bor, Troll ve iki Wolf ile kurulur; herkes kendi başlangıç
  bölgesine (haritanın ortasına yakın altıgenler önce) otomatik yerleşir, kurulumda jetona ve
  sonra kendi bölgesinde bir altıgene dokunarak değiştirilir; GM "Savaşı başlat" der.
- **Tek cihaz:** Mevcut kart ekranı gibi herkes (düşmanlar dahil, GM olarak) aynı ekrandan
  yönetilir. Düşman yapay zekâsı haritada henüz hareket etmediği için (Adım 9) haritalı
  ekranda otomatik düşman turu yok.
- **Eski ekran duruyor:** Üstte "Haritalı savaş" (varsayılan) ve "Kart savaşı" sekmeleri.

## 2026-10-15 — Alan şekilleri ve patlama noktası (Adım 5b)

**Karar:** (yalnızca haritalı savaş; haritasız savaşta alan büyüleri eskisi gibi tek hedefe)

- **Veri:** Büyülere `area` alanı (SRD 5.2.1 açıklamalarından): şekil, boyut (ft), çıkış
  (`point` seçilen nokta / `self` büyücü), etkilenenler (`all` herkes / `enemies` büyücünün
  seçtiği düşmanlar). Küre: Acid Splash 5, Shatter 10, Fireball 20, Stinking Cloud 20,
  Moonbeam 5 (silindir), Call Lightning 5 (noktanın 5 ft çevresi), Sleep 5 (yalnızca
  düşmanlar). Küp: Web 20, Hypnotic Pattern 30, Entangle 20 (20 ft kare), Thunderwave 15
  (büyücüden). Koni: Burning Hands 15, Fear 30. Çizgi: Lightning Bolt 100 ft × 5 ft.
  Yayılım: Spirit Guardians 15 (yalnızca düşmanlar).
- **Altıgende şekiller** (`src/rules/area.ts`, 1 altıgen = 5 ft): küre = merkezden
  yarıçap/5 altıgen; küp = kenar/10 (aşağı) yarıçaplı öbek (kare ızgaradaki küpe en yakın
  altıgen karşılığı; büyücüden çıkan küpün merkezi hedef yönünde kenar/10 (yukarı) altıgen
  ileride, büyücü dahil değil); koni = uzunluk/5 altıgen içinde, hedef yönüyle en fazla 30°
  açı yapan altıgen merkezleri (5e: koninin genişliği uzaklığa eşit; 15 ft koni 7
  altıgen); çizgi = hedef yönünde uzunluk/5 altıgen, 1 altıgen genişliğinde; yayılım =
  büyücünün çevresinde boyut/5 halka, büyücü dahil değil.
- **Hedef altıgen:** `cast_spell` komutu `targetHex` alır (arayüzde Adım 10'da altıgene
  tıklanarak seçilecek); verilmezse `targetId`nin altıgeni kullanılır. Noktadan çıkan
  alanlarda nokta menzil içinde ve büyücünün görüşünde olmalı, duvar/ağaç/dış kayalık
  içinde olamaz. Büyücüden çıkan alanlarda nokta yalnızca yön verir (menzil sınırı yok,
  büyücünün kendi altıgeni seçilemez). Bir yaratık hedef verilmiş ama alanın dışında veya
  tam siper arkasındaysa komut reddedilir.
- **Etkilenenler:** Alandaki bütün yaratıklar (büyücü ve müttefikler dahil; Fireball
  büyücüyü de yakar), "yalnızca düşmanlar" büyülerinde yalnızca karşı taraf. Gizlenmiş
  yaratıklar da etkilenir.
- **Siper ve görüş patlama/çıkış noktasından:** Noktadan hedefe çizgi; arada görüşü kesen
  zemin varsa (tam siper) o yaratık etkilenmez; aradaki zemin ve yaratıklardan gelen siper
  DEX save'ine eklenir. Patlama hedefin kendi altıgenindeyse siper yok. Büyücüden çıkan
  alanlarda çıkış büyücünün altıgeni.
- **Hasar bir kez atılır:** Save'li alan etkisinde hasar bütün hedefler için bir kez atılır,
  her hedef ayrı save yapar (SRD 5.2.1 "Saving Throws and Damage").
- **Uyku:** Zar toplamı (5d8) alandaki düşmanları en düşük HP'den başlayarak uyutur
  (motorun mevcut uyku kuralı alana genişletildi).
- **Kapsam dışı:** Kalıcı alanların sonraki turlardaki etkisi (Web, Entangle, Moonbeam,
  Stinking Cloud, Spirit Guardians, Call Lightning) şimdilik yalnızca büyü yapıldığı an
  uygulanıyor; tur başı/sonu etkileri ayrı iş. Faerie Fire, Slow gibi alanlı ama elle
  uygulanan (utility) büyülere alan bağlanmadı.

## 2026-10-15 — Adım 7 sonrası kullanıcı kararları ve yeni adımlar

- **Gizlenme yeri altıgene bağlı kalır** (SRD'nin ağır karanlık/3/4 siper şartı yerine).
- **Adım 5c — beceri yetkinlikleri** (5b'den sonra, Adım 8'den önce): Stealth, Perception,
  Athletics vb. yetkinlikler ve yetkinlik bonusunun kontrollere eklenmesi. `bog`
  (Athletics DC 12), `trap` (Perception DC 13) ve `stealth` buna bağlı.
- **Adım 5d — eylem ekonomisi** (Adım 11'deki denge ölçümünden önce, mümkünse Adım 8'den
  önce): eylem, bonus eylem, tepki, hareket; saldırı, büyü, gizlenme, arama, koşma ve
  ayrılma eylem harcar; Extra Attack ve Multiattack tek eylem. Eylem ekonomisinin olmaması
  ciddi bir açık olarak kayda geçti.
- **Sonraya kalanlar:** Büyü bileşenleri; yalnızca V bileşenli büyü gizlenmeyi bozsun
  (şu an her büyü bozuyor). GOREV.md "Sonraya kalanlar" listesinde.

## 2026-10-15 — Gizlenme (Adım 7)

**Kaynak:** SRD 5.2.1 Hide eylemi (DC 15 Dexterity (Stealth); toplam, bulmak için gereken
Wisdom (Perception) DC'si olur; saldırınca veya büyü yapınca biter) ve zırh tablosunun
Stealth sütunu (PDF s. 92).

**Karar:**

- **Genel mekanik — gizlenme yeri:** Altıgen gizlenme yeriyse `hide` komutu denenebilir.
  Gizlenme yeri iki kaynaktan gelir: zemin kataloğundaki `hide: { bonus }` (kum tepesi `d`
  +0, çalılık/sazlık `g` +2; her haritada geçerli) ve haritanın JSON'daki `hideTerrain`
  listesi (harf → bonus). Çöl, açık kumu (`.`) böyle gizlenme yeri yapar; aynı harf başka
  haritada (Volkan'da bazalt zemin) gizlenme yeri değildir. Ormandaki "ağacın yanında
  gizlenme" ve fırtınadaki avantaj gibi haritaya özel kurallar Adım 8'de `stealth` ve
  `sandstorm` kurallarıyla bağlanacak.
- **Zar:** d20 + DEX modifier'ı + zemin bonusu, DC 15. Başarılıysa toplam bulunma DC'si olur.
  Motor beceri yetkinliği tutmadığı için Stealth ve Perception yalnızca yetenek modifier'ı.
- **Zırh:** Stealth dezavantajı SRD zırh tablosundan (`stealthDisadvantage`): bizdeki
  zırhlardan Half Plate Armor, Chain Mail ve Plate Armor. GOREV.md "ağır zırh" diyordu;
  SRD'de orta zırhlardan Half Plate da dezavantajlı, ağırlardan hepsi.
- **Gizlenmenin şartı:** SRD'deki "ağır karanlık veya 3/4 siper ve düşmanın görüşü dışında
  olma" şartı yerine gizlenme yeri kullanılır (kumun altına girmek, çalılığa saklanmak).
- **Gizlenmiş yaratık:** Düşmanlarca hedef alınamaz (silah, büyü, canavar saldırısı; hata
  mesajıyla reddedilir); müttefikler hedef alabilir (iyileştirme gibi). Saldırı zarında
  avantaj alır ("Gizlenmiş saldıran"). Saldırınca, büyü yapınca, yürüyünce veya atlayınca
  ortaya çıkar (`revealed` olayı). Büyü bileşenleri veride olmadığı için her büyü ortaya
  çıkarır. Düşman yapay zekâsı gizlenmiş karakteri hedef seçmez.
- **Arama:** `search` komutu: d20 + WIS modifier'ı; görüş hattındaki gizlenmiş düşmanlardan
  bulunma DC'si toplamı aşmayanlar bulunur ve ortaya çıkar. Menzil sınırı yok (karanlık
  Adım 8'de).
- **Eylem ekonomisi yok:** Motor tur içinde eylem saymıyor (saldırı da öyle); gizlenme ve
  arama bir eylem harcamıyor. Eylem ekonomisi ayrı bir iş.
- Haritasız savaşta gizlenme yok.

## 2026-10-15 — Yükseklik ve siper (Adım 6)

**Karar:** (yalnızca haritalı savaş; haritasız savaşta siper ve görüş hesaplanmaz, yükseklik
eskisi gibi savaşçının soyut değerinden gelir)

- **Siper çizgisi:** Saldıranın altıgen merkezinden hedefin altıgen merkezine çizgi çekilir,
  aradaki altıgenlere (uçlar hariç) bakılır. Çizgi iki altıgenin tam sınırından geçerse
  her iki yan da denenir ve saldıran için en iyisi seçilir: önce görüşü açık olan, sonra
  siperi az olan (SRD'de saldıranın en elverişli köşeyi seçmesine karşılık gelir).
- **Siper değerleri:** Zemin kataloğundaki değer: yarım (+2) `x`, `g`, `d`, `k`; 3/4 (+5)
  `v`, `e`, `m`, `r`, `c`. Aradaki her yaratık (hangi tarafta olursa olsun) yarım siper.
  `d`, `k`, `r`, `c` kullanıcı önerisinde yoktu; ilk katalogda (GOREV.md) siper değerleri
  olduğu için aynen geçerli.
- **Hedefin altıgeni:** Hedefin durduğu altıgenin siperi de sayılır (çalılıkta duran yarım
  siper alır); saldıranın altıgeni sayılmaz.
- **Toplanmaz:** Birden fazla siper varsa en iyisi geçer.
- **Uygulama:** Siper saldırı zarlarında AC'ye, DEX save'lerinde save'e eklenir (karakter
  saldırısı, canavar saldırısı ve nefesi, büyü saldırısı ve DEX save'li büyüler). Yakın
  dövüş de etkilenir (5e); bitişik saldırıda arada altıgen olmadığı için yalnızca hedefin
  altıgeni sayılır. GOREV.md'deki "yakın dövüş etkilenmesin" ilk taslağı bu öneriyle
  değişti. Alan büyülerinde siper şimdilik patlama noktasından değil büyücüden hesaplanıyor.
- **Görüş hattı:** Aradaki altıgenlerde duvar (`s`), ağaç (`a`) veya dış kayalık (`#`) varsa
  hedef görülemez ve saldırı/büyü reddedilir (save'li etkiler dahil). Lav, su ve uçurum
  görüşü kesmez.
- **Ağaç (`a`) — kullanıcı onayı:** Hem 3/4 siper hem görüş kesici olarak kalır. Aradaki ağaç
  saldırıyı engeller; ormanda okçuluk, ağaçların arasındaki boş altıgenlerden geçen bir
  çizgi bulunarak mümkündür (sınırdan geçen çizgide saldıran açık yanı seçer). Bu davranış
  bilerek böyle bırakıldı.
- **Kullanıcı onayı:** `d`, `k` (yarım) ve `r`, `c` (3/4) ilk katalogdaki değerleriyle
  kalır; siper yakın dövüşte de geçerli kalır (5e kuralı).
- **Ertelendi — Adım 5b:** Alan şekilleri (koni, küre, çizgi, yayılım) ve alan büyülerinde
  siper/görüşün patlama noktasından hesaplanması ayrı bir adım (GOREV.md, Adım 8'den önce).
- **Yükseklik:** Haritada savaşçının yüksekliği durduğu altıgenden gelir (0/1/2). Mevcut
  kural aynen: yüksekteki avantajlı, alçaktaki dezavantajlı; kuleden (`z`) surdakine (`h`)
  atış avantajlı. Haritalı savaşta savaşçının soyut `height` değeri kullanılmaz.
- **`crenel`** (surdaki/kuledeki saldırgana aşağıdan menzilli saldırıda 3/4 siper) Adım 8'de;
  şimdilik yalnızca veri.

## 2026-10-15 — Büyü saldırısı: yakın dövüş veya menzilli; Trident

**Karar:**

- **Büyü saldırısı türü:** Menzili dokunma (5 ft) olan büyü saldırısı yakın dövüş, diğerleri
  menzilli saldırı sayılır (SRD: melee spell attack / ranged spell attack). Yerdeki (Prone)
  hedefe menzilli büyü saldırısı dezavantaj, yakın dövüş büyü saldırısı avantaj alır;
  Paralyzed veya Unconscious hedefe otomatik kritik yalnızca yakın dövüş büyü saldırısında.
- **Haritasız savaşta davranış değişti:** Önceden büyü saldırıları Prone kuralından muaftı
  ve hepsi yakın dövüş sayıldığı için uzaktan atılan Fire Bolt gibi büyüler baygın hedefe
  otomatik kritik vuruyordu. Artık iki durumda da yukarıdaki kural geçerli. Eski "büyüde
  etkisiz" testi bu kurala göre güncellendi, yeni testler eklendi.
- **Trident:** SRD 5.2.1'e göre hasar 1d8, iki elle (Versatile) 1d10 (önceden 1d6/1d8).
  Hiçbir karakter ve test Trident'e bağlı değildi.

## 2026-10-15 — Menzil (Adım 5)

**Karar:**

- **Birim:** Veride menzil ve erişim yalnızca feet olarak durur (tek kaynak); hesap anında
  5'e bölünür (1 altıgen = 5 ft). Veride ayrı bir "altıgen" alanı yok.
- **Yakın dövüş:** Erişim 5 ft (1 altıgen); Reach özelliği olan silahlar (Glaive, Halberd,
  Whip) 10 ft (2 altıgen). Erişim dışındaki hedef reddedilir.
- **Menzilli silahlar** (SRD 5.2.1 PDF s. 91 silah tablosu): Light Crossbow ve Shortbow
  80/320, Hand Crossbow 30/120, Heavy Crossbow 100/400, Longbow 150/600. Normal menzilin
  ötesinde dezavantaj ("Uzun menzil"), uzun menzilin ötesi reddedilir.
- **Fırlatma:** Thrown silahlar (Dagger, Handaxe, Light Hammer, Spear, Trident 20/60;
  Javelin 30/120) ikinci bir seçenek verir: "(fırlatma)", aynı yetenek modifier'ı,
  menzilli saldırı (SRD 5.2.1 Thrown özelliği).
- **Yanında düşman:** Menzilli saldırıda (silah, fırlatma, menzilli büyü saldırısı,
  canavarın menzilli saldırısı) saldıranın 1 altıgen yakınında aksiyon yapabilen
  (Incapacitated olmayan) bir düşman varsa dezavantaj. Müttefik ve Incapacitated düşman
  sayılmaz.
- **Büyüler:** `rangeFt` SRD'deki Range satırından: sayısal menzil olduğu gibi, Touch 5,
  Self 0. Kendinden çıkan alan veya fırlatmada etkinin ulaştığı uzaklık menzil sayılır:
  Burning Hands 15 (koni), Thunderwave 15 (küp), Fear 30 (koni), Lightning Bolt 100
  (çizgi), Spirit Guardians 15 (yayılım), Produce Flame 60 (fırlatılan alev), Vampiric
  Touch 5 (dokunma). Alan şekli (koni, küre, çizgi) şimdilik hesaplanmıyor; yalnızca hedef
  menzil içinde mi diye bakılıyor. Büyülerde uzun menzil yok. Menzili 5 ft'ten uzun saldırı
  büyüleri "yanında düşman" dezavantajını alır. Menzili 0 olan büyü başkasını hedefleyemez.
- **Canavarlar:** Bütün saldırıların erişimi veya menzili SRD 5.2.1 stat bloklarından
  dolduruldu; doldurulamayan yok. Save'li saldırılar (Fire Breath 30 ft koni, Web 60 ft)
  yalnızca menzil sınırına bakar. Ogre'nin Javelin'i ("Melee or Ranged") menzilli saldırı
  olarak kaldı (30/120). Multiattack'ta saldırılardan biri hedefe ulaşamıyorsa komut
  bütünüyle reddedilir.
- **Haritasız savaş:** Konum olmadığı için menzil hiç denetlenmez, eski davranış aynen.
- **Düzeltme:** Zombie'nin Slam saldırısındaki "Grappled" ek etkisi SRD'de yok, kaldırıldı.

## 2026-10-15 — 11 yeni harita ve zemin kataloğu eki

**Bağlam:** `docs/harita/GOREV-YENI-HARITALAR.md`: ada, bataklık, buzul, dağ, dungeon, gemi,
kale, mağara, orman, şehir meydanı, taverna.

**Karar:**

- **Veri:** JSON'lar `data/maps/`, görseller `public/maps/`. Yükleyici `data/maps/*.json`
  dosyalarının hepsini kendisi bulur (kimliğe göre sıralı); yeni harita eklemek gerçekten
  yalnızca JSON ve görsel eklemek, kod değişmez.
- **Ortamlar:** Her haritaya `environmentId`: bataklık → Sualtı / bataklık, buzul → Buzul,
  dağ → Dağ / uçurum, dungeon ve mağara → Yeraltı / mağara, orman → Orman; ada, gemi,
  kale, şehir meydanı ve taverna → Düz zemin. Varyant kendi ortamını verebilir: Ada ve
  Gemi'nin `firtina` varyantı → Fırtına / yağmur. Savaşın ortamı seçilen varyanttan gelir.
- **Hazır başlangıç listeleri:** `startZones.*.hexes` (1 tabanlı [sütun, satır]) varsa o
  kullanılır, yoksa sütun aralığından hesaplanır (Çöl, Volkan). Yükleyici denetler: liste
  boş değil, her altıgen kendi sütun aralığında ve başlangıca uygun, tekrar yok, iki taraf
  çakışmıyor, iki taraf da liste veriyor. Aynalanabilir hazır listeli haritada sütun
  aralıkları birbirinin aynası olmalı; aynalamada oyuncular düşmanların listesinin
  aynasını, düşmanlar oyuncularınkini alır (oyuncular yine solda).
- **Zemin kataloğu eki** (`terrain-ek.json`): `s` duvar (engel, görüşü keser), `h`
  yükseltili (1, çıkış 2), `z` zirve/kule üstü (2, çıkış 2), `u` uçurum (engel; yalnızca
  uçan geçer), `i` buz, `q` kar (zorlu), `a` ağaç (engel, 3/4, görüşü keser), `g` çalılık
  (zorlu, yarım, gizlenme), `v` sarkıt (engel, 3/4), `e` kristal (engel, 3/4, ışık 4),
  `n` sığ su (zorlu), `b` derin batak, `w` derin su (zorlu), `p` tahta/kaldırım, `m` direk
  (engel, 3/4), `x` varil/masa (zorlu, yarım), `o` kapı, `j` gizli tuzak.
- **Yükseklik ölçeği:** Zemin yüksekliği 0/1/2 (`z` = 2), `z` 1'e eşitlenmedi; böylece
  kuledeki okçu surdakine göre de yüksekte sayılır. Mevcut avantaj kuralı yalnızca kimin
  daha yüksekte olduğuna bakar, fark büyüklüğü önemsizdir; Adım 6'da saldırı kuralı
  sayısal yüksekliği kabul edecek. Haritasız savaşın soyut ölçeği (-1/0/1,
  `change_height`) aynen kalıyor.
- **Yeni kurallar şimdilik yalnızca veri:** `bog`, `deepWater`, `ice`, `cold`, `storm`,
  `darkness`, `trap`, `stealth`, `gate`, `crenel`, `objective` (ve `climb`, `swell`,
  `moat`, `mudNote`) JSON'da ve zeminlerde `rule` bağı olarak duruyor; motor davranışı
  Adım 8'de. Bu yüzden bugün `b` (derin batak) normal maliyetli, `i` normal zemin, `j`
  görünmez değil; batağın 3 hareket maliyeti, buzda kayma ve tuzak Adım 8'de gelecek.

## 2026-10-15 — Atlama (uzun atlama)

**Bağlam:** Kaynak belge (`harita_sistemi_ve_ilk_haritalar.md`) "mesafe yetmiyorsa atlamak
lava düşmektir" diyor. Yanlışlıkla ölüm olmasın diye bunun yerine komut reddedilir.

**Karar:** `jump` komutu (yalnızca haritalı savaş), 5e uzun atlama kuralıyla:

- **Doğrultu:** Hedef, bulunulan altıgenden düz bir eksen üzerinde olmalı; komşu
  altıgene atlanmaz (yürünür).
- **Menzil kanal genişliğiyle ölçülür:** aradaki altıgen sayısı × 5 ft, atlama menzilini
  aşmamalı; iniş altıgeni mesafeye sayılmaz. Menzil koşarak STR skoru kadar ft, koşusuz
  yarısı (aşağı yuvarlanır). Örnek: STR 8 koşarak 1 altıgenlik kanalı, STR 10 2, STR 15 3
  altıgenlik kanalı atlar.
- **Koşu:** O turda, atlamayla aynı yönde, art arda en az 2 altıgen yürümüş olmak. Koşu
  tur başında ve atlamadan sonra sıfırlanır; yön değiştiren yürüyüş koşuyu yeniden başlatır.
- **Hareket maliyeti:** kalkıştan inişe geçilen altıgenler, yani kanal + iniş altıgeni
  (inişin zemin maliyeti dahil: taşlığa iniş 2). Bütçe yetmezse reddedilir.
- **Aradaki altıgenler:** sütun (`c`) veya dış kayalık (`#`) varsa reddedilir; lav, zemin
  ve yaratıklar engel değildir.
- **İniş altıgeni:** lav, engel veya dolu ise reddedilir. Menzil dışı atlama da hata
  mesajıyla reddedilir; lava düşüş yalnızca zorla hareket ve lav yükselmesiyle olur.
- Savaşçıya STR skoru (`strScore`) ve son düz koşu (`run`) alanları eklendi.

## 2026-10-15 — Haritada konum, kurulum ve yürüme

**Karar:**

- **Harita isteğe bağlı:** `startBattle`'a harita verilirse savaş `setup` (yerleştirme)
  aşamasında başlar, ortam haritanın `environmentId`'sinden gelir ve altıgenler durumda
  (`state.map.tiles`) tutulur. Haritasız savaş ve eski testler aynen çalışır.
- **Kurulum:** `place` yalnızca kurulumda, kendi tarafının başlangıç bölgesine, boş
  altıgene; yeniden yerleştirme serbest. Otomatik başlama yok: GM `start_battle` verir,
  herkes yerleşmeden reddedilir. Kurulumda tur komutları reddedilir.
- **Komut adları:** Soyut yükseklik komutu `change_height` (yalnızca haritasız savaş,
  tırmanma kontrolüyle). `move` haritada hedef altıgene en ucuz yoldan yürür.
- **Yürüme:** Bütçe hız / 5 altıgen (30 ft = 6), tur içinde parça parça harcanabilir,
  yaratığın kendi turu gelince sıfırlanır. Zorlu zemin 2, engel geçilmez, harita dışı
  reddedilir. Restrained ve Grappled yürüyemez.
- **Başka yaratıkların altıgeni** (kaynak: SRD 5.2.1, PDF s. 14, "Moving around Other
  Creatures"): müttefikin altıgeninden geçilir ve orası zorlu zemin değildir;
  Incapacitated düşmanın altıgeninden geçilir ama orası zorlu zemindir (2 altıgen);
  diğer düşmanların altıgeninden geçilmez; dolu altıgende gönüllü durulmaz. SRD'deki
  Tiny yaratık ve "iki boy büyük veya küçük" istisnaları, motorda boyut olmadığı için
  şimdilik uygulanmıyor (bütün yaratıklar aynı boyda sayılıyor).
- **Lav:** Gönüllü `move` ile lava girmek reddedilir; yol bulucu lavı geçilmez sayar.
  `fell_into_lava` olayı (HP 0, doğrudan ölü, ölüm kurtarması yok) yalnızca zorla hareket
  (ileride itme) ve lav yükselmesiyle (`tile_changed`) üretilecek.
- **Uçma:** Canavarlarda `fly` (ft); Wyvern ve Young Red Dragon 80. Uçuş hızı olan
  yaratık her zaman uçuyor sayılır: hareket bütçesi uçuş hızından gelir, lav ve zorlu
  zemin 1 altıgen, engel geçilmez. Karakterlerde şimdilik uçma yok.
- **Yükseklik:** Haritalı savaşta yükseklik ileride altıgenden gelecek (Adım 6); bu adımda
  savaşçının `height` değeri değişmiyor.

## 2026-10-15 — Zemin kataloğu ve harita verisi

**Karar:**

- **Zemin kataloğu** (`src/map/terrain.ts`), bütün haritalar paylaşır: `.` açık zemin,
  `d` kum tepesi (yarım siper), `r` kaya kümesi (zorlu, 3/4 siper, gölge), `c` ayakta
  sütun (engel, 3/4 siper, gölge), `k` yıkık sütun (zorlu, yarım siper, gölge), `t` taşlık
  (zorlu), `H` yüksek bazalt (yükseklik 1), `~` lav (ölümcül), `f` alev (1d6 ateş),
  `#` dış kayalık (oyun alanı dışı). Siper: yarım +2 AC, 3/4 +5 AC. Zorlu zemine girmek
  2 altıgenlik hareket harcar. Uçan yaratık zorlu zeminden ve lavdan etkilenmez,
  engelden etkilenir. Yükseklik motorun -1/0/1 ölçeğinde (`H` = 1, diğerleri 0).
  Kaynak belgedeki `L`, `M`, `o` harfleri hiçbir haritada kullanılmadığı için şimdilik
  katalogda yok; gereken harita gelince eklenir.
- **Haritalar veri:** `data/maps/*.json` (her haritada ilgili ortamın `environmentId`'si),
  görseller `public/maps/*.webp`. Kuralların parametreleri (DC, hasar, tur sayısı) JSON'da.
  Yükleyici doğrular: 15×7 boyut, flat-top/odd-q, yalnızca katalog harfleri, var olan
  ortam, geçerli sütun aralıkları, boş olmayan başlangıç bölgeleri, görsel dosyasının
  varlığı (görsel listesi testte verilir; dosyalar testlere yüklenmez).
- **Başlangıç bölgeleri:** JSON'daki 1 tabanlı sütun aralığındaki altıgenler; engel, lav,
  alev ve 3/4 siperli kaya kümesi (`r`) başlangıç yeri sayılmaz, taşlık (`t`) ve moloz
  (`k`) sayılır. Katalogda `r` için `noStart` işareti. Volkan 16'şar, Çöl oyuncu 15,
  düşman 20.
- **Aynalama:** Yatay aynalama her satırı ters çevirir (sütun c → 14 - c; 14 çift olduğu
  için komşuluk bozulmaz). Başlangıç sütun aralıkları aynı kalır (oyuncular hep solda),
  altıgenleri aynalı zeminden yeniden hesaplanır; böylece Çöl'de taraflar zeminin öbür
  yarısında başlar. Arayüz aynalı haritada görseli de yatay çevirmeli (`mirrored`).

## 2026-10-15 — Altıgen ızgara geometrisi

**Bağlam:** Savaş, karşılıklı kartlardan altıgen ızgaralı yatay haritaya geçiyor
(`docs/harita/GOREV.md`).

**Karar:** Izgara 15 sütun × 7 satır, düz üstlü (flat-top) altıgen, odd-q offset düzeni
(0 tabanlı tek sütunlar yarım altıgen aşağı kayık), 1 altıgen = 5 ft (hız 30 ft = 6
altıgen). Kodda koordinatlar 0 tabanlı, kullanıcıya 1 tabanlı gösterilir. Hesaplar
eksenel (axial) koordinatta: `q = col`, `r = row - (col - (col & 1)) / 2`; mesafe
`(|dq| + |dq + dr| + |dr|) / 2`. Geometri `src/rules/hex.ts` içinde saf bir modül: harita
biçimini bilmez, zemin maliyeti yol bulucuya fonksiyon olarak verilir (normal 1, zorlu 2,
engel null). Eşit maliyetli yollar arasında seçim sabit (komşu ve keşif sırası), böylece
olaylar baştan oynatılınca aynı yol çıkar.

## 2026-10-15 — SRD 5.2.1 atıf metni eklendi

**Bağlam:** CC-BY-4.0'ın tek şartı atıf. SRD 5.2.1'in ilk sayfası atıf metnini verir ve
Wizards'a başka bir atıf yapılmamasını ister; "5E compatible" ifadesine izin verir.

**Karar:** İlk sayfadaki atıf metni olduğu gibi `NOTICE`, `README.md` ve uygulamanın
"Hakkında / Atıflar" metni `public/atiflar.txt` içine kondu (ekran sonra gelecek; dosya
build ile birlikte yayınlanır). "5E uyumlu (5E compatible)" ifadesi kullanılır.
Onay veya ortaklık izlenimi veren hiçbir ifade kullanılmaz; kod yorumlarındaki "PHB"
ve "D&D" anmaları "SRD 5.2.1" / "5E" olarak değiştirildi. `src/legal.test.ts` metnin
üç dosyada da birebir durduğunu denetler.

## 2026-10-15 — Tüm canavarlar SRD 5.2.1 istatistiklerine güncellendi

**Karar:** 16 canavarın AC, HP, hız, yetenek skorları, saldırıları, Multiattack düzeni,
yenilenme, bağışıklıklar ve save bonusları SRD 5.2.1 stat bloklarına göre güncellendi.
Öne çıkanlar: Troll 94 HP, tur başı 15 yenilenme, üç Rend; Young Red Dragon üç Rend +
Fire Breath; Owlbear iki Rend; Ghoul iki Bite; Bandit Captain iki saldırı ve Pistol;
Hobgoblin Warrior Pack Tactics; Giant Spider Web artık DEX save (DC 13); Wolf AC 12,
Bite 1d6+2 ve koşulsuz Prone. Canavarlara stat bloğundaki SAVE sütunu için `saves`
alanı eklendi (ör. ejderhanın DEX ve WIS save'i +4).

**Motor sınırı:** Motor bir saldırıda tek hasar türü uygular. "plus 2d6 Poison" gibi
ikinci hasarlar, koşullar (Prone, Poisoned, Restrained) ve durum bağışıklıkları şimdilik
`rider`/`traits` metninde durur ve elle uygulanır. Demo dengesi de değişti (Troll daha
güçlü); yeniden ölçülmedi.

## 2026-10-15 — Büyü, zırh ve canavar adları SRD 5.2.1'e çevrildi

**Bağlam:** Bazı içerik SRD 5.2.1'de farklı adla yer alıyor ya da hiç yer almıyor.
Henüz kayıt sistemi olmadığı için ad değişikliğinin en ucuz olduğu an şimdi; ileride
kayıtlı karakterler eski adları (ör. "Plate") içerseydi bozulurdu.

**Karar:**

- **Büyüler** (aynı büyü, yeniden adlandırıldı; seviye ve sınıf SRD'ye göre):
  - Branding Smite → Shining Smite (2. seviye, yalnızca Paladin)
  - Tasha's Hideous Laughter → Hideous Laughter (1. seviye, Bard, Warlock, Wizard)
- **Zırhlar:** Leather → Leather Armor, Studded leather → Studded Leather Armor,
  Hide → Hide Armor, Chain shirt → Chain Shirt, Half plate → Half Plate Armor,
  Chain mail → Chain Mail, Plate → Plate Armor. "Zırhsız" oyunun kendi seçeneği.
- **Canavarlar:** Goblin → Goblin Warrior, Hobgoblin → Hobgoblin Warrior,
  Minotaur → Minotaur of Baphomet (id'ler de değişti). Yalnız ad değişti, istatistikler
  henüz SRD 5.2.1 değerlerine güncellenmedi.
- **Orc canavarı kaldırıldı**, SRD'nin önerdiği **Tough** eklendi (SRD 5.2.1 istatistikleriyle:
  AC 12, HP 32, Mace, Heavy Crossbow, Pack Tactics). "Orc" adı artık yalnızca oyuncu türü.

## 2026-10-15 — Büyülerin sınıf listeleri SRD 5.2.1'e göre düzeltildi

**Bağlam:** Ortak büyülerin bazılarında sınıf listesi SRD 5.2.1'den farklıydı. Bu
lisanstan çok doğruluk meselesi: bir büyünün hangi sınıfın listesinde olduğu,
karakterlerin oyunda ne yapabileceğini değiştirir.

**Karar:** 12 büyünün sınıf listesi SRD 5.2.1'e eşitlendi:

| Büyü | Eklenen | Çıkarılan |
|---|---|---|
| Spare the Dying | Druid | |
| Command | Bard | |
| Entangle | Ranger | |
| Mirror Image | Bard | |
| Flaming Sphere | Sorcerer | |
| Slow | Bard | |
| Vampiric Touch | Sorcerer | |
| Mass Healing Word | Bard | |
| Revivify | Druid, Ranger | |
| Aid | Bard, Druid, Ranger | |
| Dispel Magic | Ranger | |
| Shatter | | Warlock |

Bu düzeltmeden sonra veride kalan her büyünün seviyesi ve sınıf listesi SRD 5.2.1
ile birebir aynı. İstisna: Branding Smite ve Tasha's Hideous Laughter; bunların
SRD'deki adları farklı (Shining Smite, Hideous Laughter) ve karar bekliyor.

## 2026-10-15 — SRD 5.2.1'de olmayan büyüler çıkarıldı

**Bağlam:** Oyun verisi ticari sürümde yalnızca SRD 5.2.1 (CC-BY-4.0) kapsamındaki
içeriğe dayanmalı. `data/spells.json`, `docs/SRD_CC_v5.2.1.pdf` ile büyü büyü
karşılaştırıldı.

**Karar:** SRD 5.2.1'de bulunmayan 9 büyü veriden çıkarıldı:

| Büyü | Seviye | Sınıf |
|---|---|---|
| Blade Ward | 0 | Bard, Sorcerer, Warlock, Wizard |
| Armor of Agathys | 1 | Warlock |
| Thunderous Smite | 1 | Paladin |
| Witch Bolt | 1 | Sorcerer, Warlock, Wizard |
| Wrathful Smite | 1 | Paladin |
| Blinding Smite | 3 | Paladin |
| Crusader's Mantle | 3 | Paladin |
| Elemental Weapon | 3 | Paladin |
| Lightning Arrow | 3 | Ranger |

**Gerekçe:** Çıkarmak en basit ve en güvenli yol. Bir büyüyü özgün hâle getirmek
yeniden adlandırmaktan fazlası: kendi adı, hikâyesi ve dengesi olmalı; bu ayrı bir iş.

**İleride:** Bu büyülerin yerine özgün büyüler yazılabilir. Demo karakterleri
(Mira, Bor) bu büyülerin hiçbirini kullanmıyordu. `src/data/data.test.ts` bu
büyülerin veriye geri girmesini engelleyen bir test içerir; özgün büyüler farklı
adlarla eklenmeli.
