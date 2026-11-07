# Kuyruk K64: Ele geçirme (possession), plan

Durum: **plan** (Aşama 1; kod, veri ve test değişmedi). Taban `wip/k63` (a8b4b9b, kural sürümü 47). Hedef kural sürümü **48**.

## 1. Mevcut durum

- **SRD'de ele geçirme yapan tek canavar Ghost** (`data/monsters.json` `ghost`, saldırı `Possession`, Recharge 6, CHA DC 13, 5 ft, Humanoid). Kural sözlüğündeki "Possession" girişi davranışı etkiye bırakıyor; PfEG engeller, Dispel Evil and Good bitirir. Demonic Possession bir lanet ya da çevre etkisi, canavar değil (kapsam dışı). Magic Jar `offCombat` (savaş dışı, öyle kalır).
- **Bugün oyunda:** Ghost'un Possession saldırısı `monsters.ts` save yolundan geçiyor: CHA save atılıyor, hasar yok, ek etki yok (`data/attack-riders.json` `ghost:Possession` `status: yok`, "yapışma/ele geçirme uygulanmıyor"). Yani yapay zekâ Recharge 6 eylemini boşa harcıyor. `harita/belgeler/ENVANTER-CANAVARLAR.md:103` "yeni sistem, büyük".
- **PfEG neden kısmi / kapsam dışı:** `wardedFrom` (mind.ts) yalnızca Charmed ve Frightened'ı süzüyor, `pfegRepeatAdv` yalnızca bu iki durumun tekrar save'ine avantaj veriyor. SRD metnindeki "can't be possessed" kolu `kapsamDisi: "Ele geçirme (possession) oyunda hiçbir canavarda yok."` notuyla kapatılmış (`data/spells.json:3258`, `data/buyu-durum-notlari.json:25`, `BUYU-DURUM.md:41`, `BUYU-ERTELENEN.md:43`). Gerekçe yanlış: Ghost var, ama ele geçirme sistemi yok.
- **Yeniden kullanılabilir altyapı:**
  - Kontrol devri: `syncAllegiance` (allegiance.ts; etkide `dominate`, asıl taraf `allegiance`, `homeSide`, GM anahtarı `allegianceSwap`, reducer sonrası tek yer, replay güvenli). YZ, hedefleme ve denetim `side`/`ownerId`'den okuyor.
  - Haritadan çekilme: `offFloor` (kat değişimi; S1 Plane Shift `offFloor: 'duzlem'`): `isTargetable` false, sırada atlanır, alan ve doluluk dışı.
  - İstatistik değişimi: `shape_changed` / `shapeCleanup` (Wild Shape, Polymorph; `shapeStats`).
  - Dispel Evil and Good Break Enchantment: `executeDispelEvil` (spells.ts:1863), şimdilik yalnızca Charmed/Frightened kaldırıyor.

## 2. SRD 5.2.1 hedef davranışı

**Ghost Possession (Recharge 6):** 5 ft içinde, Ghost'un gördüğü bir Humanoid CHA save (DC 13) yapar.
- **Başarı:** hedef bu Ghost'un Possession'ına 24 saat bağışık olur.
- **Başarısızlık:** hedef ele geçirilir. Ghost kaybolur. Hedef Incapacitated olur ve bedeninin kontrolünü kaybeder, ama farkındalığını korur. Bedeni Ghost yönetir.
  - Ghost'u hiçbir saldırı, büyü ya da etki hedef alamaz; özellikle Undead'i hedef alanlar hariç.
  - Ghost'un oyun değerleri aynı kalır. Yalnızca hız ve STR/DEX/CON değiştiricileri hedefinkidir.
- **Bitiş:** beden 0 HP'ye düşünce ya da Ghost bonus eylemle çıkınca. Ghost hedefin 5 ft içinde boş bir altıgende belirir; hedef bu Ghost'a 24 saat bağışık olur.
- **PfEG:** Aberration, Celestial, Elemental, Fey, Fiend ve Undead türlerinin saldırıları korunana dezavantajlıdır (var). Korunan bu türlerce ele geçirilemez (**yeni**). Zaten ele geçirilmişse "yeni save"lerde avantaj alır; Ghost'un tekrar save'i olmadığı için bu kolun Ghost'ta etkisi yok.
- **Dispel Evil and Good, Break Enchantment:** dokunulan yaratığın bu türlerin ele geçirmesi biter (**yeni kol**).
- **Magic Circle** (silindir içinde ele geçirilemez) ve **Hallow** Hallowed Ward (alandayken ele geçirme bastırılır): ikinci parça (K64b).

## 3. Tasarım

**Veri modeli (iki atomik olay, reducer'da):**
- `possessed { possessorId, hostId, label }`:
  - **Ev sahibi** (beden): etki `{ id: 'possess:<g>', possessed: true, sourceId: g }`.
  - **Ele geçiren:** `possessing: hostId` ve `offFloor: 'beden'`. Haritadan çekilir, hedef alınmaz, sırada atlanır, alan ve doluluk dışı kalır; mevcut `offFloor` yolu.
- `possession_ended { possessorId, hostId, reason: 'hp0'|'leave'|'dispel'|'ward'|'gone', to }`: etki kalkar. Ele geçiren `to` altıgenine döner (5 ft içinde boş altıgen; `withArrival` ile seçilir, olaya yazılır, böylece replay sabit kalır). Ev sahibine `possessionImmune: [g]` yazılır.
- **Bağışıklık:** ev sahibinde `possessionImmune: string[]` (savaş sonuna dek; başarılı save'de de yazılır).

**Kontrol devri:** `syncAllegiance` genelleşir. Kontrol eden etki `e.dominate || e.possessed` olur (`controllerEffect(c)`; ele geçirme baskın). Beden ele geçirenin `side`/`ownerId`'sine geçer, `homeSide` asıl tarafı korur. Dominate kolu bit bit aynı kalır. Kuyruk 18'deki karar burada da geçerli: sıra değişmez, beden kendi inisiyatifinde ele geçirenin tarafıyla oynar. Ghost'un sırası atlanır (offFloor). Karar 1'e bakın.

**Bedenin değerleri:** `shape_changed` ile `possession: true` biçimi (`possessionStats(ghost, host)`; Wild Shape'in tersi).
- Ghost'tan gelenler: saldırılar, Multiattack, INT/WIS/CHA değerleri ve save'leri, canavar yetenekleri (Possession hariç).
- Ev sahibinden kalanlar: hız, STR/DEX/CON değiştiricileri, HP (geçici HP verilmez), AC ve hasar profili (Karar 2).
- Ev sahibinin büyüleri, sınıf özellikleri ve tepkileri kapanır. Konsantrasyonu `possessed` olayında düşer; bu, Incapacitated'ın etkisidir.
- Bitişte mevcut `shapeCleanup` ile geri döner.

**Incapacitated:** durum olarak eklenmez (eklense beden hiç eylem yapamaz). Etkileri modellenir: konsantrasyon düşer, ev sahibinin kendi tepkileri ve özellikleri kapanır (Karar 3). Rozet "Ele geçirilmiş" ile gösterilir.

**Bitiş yolları:**
- `possessionCleanup` her komuttan sonra çalışır (summonCleanup gibi). Şu durumlarda bitirir: beden HP ≤ 0, ele geçiren yok olmuş ya da sürgün edilmiş, ev sahibi PfEG ile korunur hâle gelmiş, GM zorlaması.
- Komut `possession_leave` (aktör beden, bonus eylem; "Bedeni bırak").
- Break Enchantment kolu.
- Beden 0 HP'de ev sahibinin kendi kurallarıyla düşer: ölüm save'i atar ve kendi tarafına döner.

**Engeller (save'den önce, olaysız red):**
- Hedef Humanoid değil (güncel `creatureType`; biçim değiştirmiş hedef tür dışı kalır).
- Hedef görülmüyor ya da 5 ft dışında.
- Hedef `possessionImmune` içeriyor.
- `wardedFrom(state, host, g, 'possessed')` true: PfEG; `wardedFrom` yeni koşulu tanır.
- Hedef zaten ele geçirilmiş.

**Zafer sayımı:** `winnerOf` ele geçireni (offFloor) tarafı için ayakta sayar. Bedeni ise ev sahibinin tarafında ayakta saymaz (çağrılmışın "tarafı ayakta tutmaz" emsali; Karar 4).

**Yapay zekâ:**
- K64a: Possession'ın puanı `preview.ts` `DISABLE` içine `possess` bayrağıyla girer (tur kaybı ve taraf kazancı). Engelli hedef aday olmaz. Bedeni oynatmak mevcut YZ'nin işi (taraf değişmiş).
- K64b: bırakma kararı. Beden HP %25 altına inince ya da erişimde düşman kalmayınca bırakır.

**Arayüz:**
- Bedende rozet `possessed` (`statusIcons`) ve ele geçirenin adı.
- Eylem menüsünde "Bedeni bırak" (bonus eylem).
- Game Master çekmecesinde "Ele geçirmeyi bitir" (`possession_leave`, `ctx.gm`).
- Günlük metinleri TR/EN (`strings.ts`, `strings.en.ts` `k64`).
- Ele geçiren jetonu çizilmez (offFloor).

**Dominate ve Charm ile ortak parça:** yalnızca `syncAllegiance`/`controllerEffect` ve `homeSide`. Tepki bağı (`linksReaction`, K61) ele geçirmede yok: beden tepkisizdir (ghost'un tepkisi yok).

**Kayıt/replay:** olaylar ekleme niteliğinde, durum alanları isteğe bağlı. `SAVE_VERSION` 22 kalır (K62–K63'teki yeni olaylarda da artmadı). Dönüş altıgeni olayda olduğu için replay belirlenimci.

## 4. Sürüm kapısı

- `kural-surumu.json` 48. Her yeni yol `ruleVersion(state) >= 48` **ve** global GM anahtarı `possession` ile çalışır (`data/kural-kontrol.json`, `surum: 48`, varsayılan açık).
- Sürüm < 48 ya da anahtar kapalı: Possession bugünkü gibi hasarsız save'dir, PfEG ve Break Enchantment eski davranışı korur.
- Kontrol devri `allegianceSwap` kapalıyken de ele geçirmede çalışır, çünkü anahtar `possession`'dır.

## 5. Parçalama

**Öneri: iki kuyruk.**

- **K64a, çekirdek (sürüm 48):**
  - Yeni dosyalar: `data/ele-gecirme.json` (canavar saldırısı → kurallar: `ghost:Possession` türler `humanoid`, `reachFt` 5, bırakma `bonus`, `appearFt` 5, fiziksel değerler; `monsters.json`'a dokunulmaz), `src/battle/possession.ts` (`possessionProblem`, `possessionEvents`, `possessionStats`, `possessionEndEvents`, `possessionCleanup`), `src/battle/k64.test.ts`.
  - Dokunulacaklar: `src/battle/monsters.ts` (save başarısızlığı → `possessionEvents`), `reduce.ts` (iki olay, bağışıklık), `allegiance.ts`, `mind.ts` (`wardedFrom` 'possessed'), `spells.ts` (Break Enchantment kolu), `commands.ts` (`possession_leave`, cleanup), `types.ts`, `goals.ts`/`winnerOf`, `ai/preview.ts`, `data/kural-surumu.json`, `data/kural-kontrol.json`.
  - Arayüz ve metin: `src/MapBattle.tsx` (rozet, düğme), `src/ui/damageFloats.ts`, i18n TR/EN.
  - PfEG/attack-riders durum notları, belgeler (DECISIONS, CLAUDE.md, BUYU-DURUM, ENVANTER-CANAVARLAR, M1-FARKLAR).
- **K64b, alanlar ve incelik:** Magic Circle silindiri ve Hallow Hallowed Ward bastırması (alan içinde ele geçirme askıya alınır; `zone` alanı `noPossession`), "Undead'i hedef alan" istisnası (Turn Undead, Dismissal), YZ bırakma kararı, `multiHex` ile büyük beden, `sim:liste` ile Ghost dumanı.

**Riskler:**
- (a) Replay: dönüş altıgeni ve stat değişimi olayda, cleanup belirlenimci; replay testi zorunlu.
- (b) Kayıt şeması: yalnızca isteğe bağlı alanlar; eski kayıt yükleme testi.
- (c) Dominate testleri (`k18h1.test.ts` 6, `k61.test.ts` reactionLink): `controllerEffect` dominate için değişmez; iki dosya her adımda çalıştırılır.
- (d) `offFloor` kullanıcıları (floors.ts kat dönüşü yalnızca `floorLink` kimliklerini taşımalı, `'beden'`i değil).
- (e) Ana parça: possession.ts savaş parçasında, ana parça etkilenmez.

## 6. Kullanıcı ve Game Master kararları (öneri ilk sırada)

1. **Bedenin sırası:** ev sahibinin inisiyatifi, ghost'un sırası atlanır (öneri; Dominate ile aynı, sıra motoruna dokunmaz). Alternatif: beden ghost'un sırasında oynar, ev sahibinin sırası atlanır (SRD'ye daha yakın, `checkActor` ve tur başı ekonomisi değişir, risk yüksek).
2. **Bedenin AC'si ve direnci:** ev sahibininki (öneri; zırh bedende). Alternatif: ghost'unki (AC 11, ghost dirençleri).
3. **Incapacitated:** durum eklenmez, etkileri (konsantrasyon, ev sahibi tepkisi ve özellikleri) modellenir (öneri).
4. **Yalnız ele geçirilmiş üyesi kalan taraf:** yenilir (öneri). Alternatif: savaş sürer, beden 0 HP'ye ya da bırakılana dek.
5. **24 saat bağışıklık:** savaş sonuna dek (öneri). Yolculuk ve Serüven katmanına taşınmaz.
6. **GM anahtarı `possession`:** varsayılan açık (öneri). Mekanik donması bu kuyruk için kullanıcı isteğiyle kalkar.
7. **Parçalama:** K64a + K64b (öneri). Tek kuyruk da olur, ama Magic Circle ve Hallow alan katmanına dokunduğu için ayrı tutmak riski böler.

## 7. Test planı (`src/battle/k64.test.ts`, `scripted` zarlar)

**Başarı yolu:**
1. Başarısız CHA save: ghost offFloor ve hedef alınamaz. Beden ghost tarafında, `homeSide` asıl taraf. Ghost saldırıları var, hız ve STR/DEX/CON ev sahibinin. Konsantrasyon düştü.
2. Başarılı save: bağışıklık yazıldı. İkinci deneme olaysız reddedildi.
3. Beden kendi sırasında ghost'un Withering Touch'ıyla eski dostuna saldırır (YZ ve oyuncu komutu).
4. `possession_leave`: bonus eylem harcar. Ghost 5 ft içinde boş altıgende, beden asıl tarafta, biçim döndü, bağışıklık yazıldı.
5. Beden 0 HP: ele geçirme biter. Ev sahibi ölüm save'i atar (oyuncu), ghost belirir.
6. Break Enchantment: bitirir, büyü biter. PfEG'li hedef: Possession reddedilir (save yok).
7. `replay(events)` aynı durumu üretir. Kayıt/yükleme sırasında ele geçirme sürer.

**Kenar durumlar:**
- Humanoid olmayan, Polymorph/Wild Shape'li hedef reddedilir.
- Zaten Dominate'li hedef: ele geçirme baskın, bitince Dominate kaldığı yerden sürer.
- Ghost'a alan büyüsü değmez. Sürüm 47 kaydı ve anahtar kapalı: eski davranış (hasarsız save).
- Yalnız ele geçirilmiş üye kalan taraf: Karar 4.
- `multiHex` açıkken dönüş altıgeni.
- Dominate testleri (`k18h1`, `k61`) değişmeden yeşil.
- Doğrulama: typecheck, ilgili testler, build, `check:harita`, `check:ses`; tam `npm test` görev sonunda bir kez.
