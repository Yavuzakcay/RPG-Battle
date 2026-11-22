# Sahne katmanı: ön inceleme (SAHNE-ON-INCELEME)

Salt okuma incelemesi, 2026-11-22, `birlesik` @ `ed5d1e39`. Kod, veri, görsel ve test değişmedi; bu belge tek çıktı.
Test/build çalıştırılmadı. Proje taslağı (`claude/seruven-diyalog-sistemi-taslak.md`) bu oturumdan erişilemedi; görev
metnindeki özet esas alındı. Satır numaraları bu sürümden `grep`/`sed` ile alındı.

**Tasarım özeti (görevden).** Dünya haritasında bir noktaya girilince ayrı, detaylı üstten **sahne**: karakter yürür,
NPC/nesneye dokunulur, diyalog ve beceri sınavı olur; bilgi defteri ve görev günlüğü tutulur. Diyalog 6 seçenekli:
1–3 İd / Ego / Süperego (hep açık; İd → Kaos, Ego → Kötülük, Süperego → İyilik), 4 sahnenin istediği beceri (zar),
5 karakterin kendi becerisi (zar), 6 bilgi seçeneği (bilgi önceden öğrenildiyse). Başarısızlık işi zorlaştırır (savaş,
ölüm, işi yapamama); kazanım hikâye ilerlemesi, XP ya da bilgi. Sahneleri kullanıcı sahne editörüyle doldurur.
3D/giydirme yok.

## Kısa sonuç

**Yapılabilir; motor işi küçük, asıl iş içerik ve editör.** Serüven zaten komut → olay → reducer + replay kalıbında
(`src/journey/seruven.ts:234` `executeSeruven`, `:393` `reduceSeruven`, `:457` `replaySeruven`) ve K47 dünya
gezintisi bu kalıba **alt modül** olarak takılmış (`src/world/roam.ts`; bağ `seruven.ts:162`, `:195`, `:364-367`,
`:446`). Sahne aynı yoldan takılır: `src/scene/` saf modül, `SceneCommand`/`SceneEvent`, `executeSeruven`'de bir
`case`. Beceri sınavının iki hazır örneği var (`link_check` `seruven.ts:315-325`, `world_check` `roam.ts:121-132`:
zar komutta gelir, replay güvenli; kırmızı/beyaz tekrar kuralı hazır). A* yeniden kullanılabilir ama bugün modül
düzeyinde tek ızgaraya kilitli (`walk.ts:20-32`): çekirdeği parametreli işleve çıkarmak gerekir (küçük, saf).

**En büyük 3 risk**

1. **Hizalanma Serüven'e bağlı değil.** Değer `SavedCharacter.hizalanma`'da (`src/rules/builder.ts:51`), Serüven
   partisi yalnız `sheet` + `status` kopyası taşır (`src/journey/types.ts:49`), Karakterlerim'e geri yazmaz
   (`SERUVEN-AYRIM.md` §3.1) ve Serüven kodunda `hizalanma` hiç geçmez (grep boş). Ayrıca `alignment.ts` günlük
   kimliği saat + modül sayacıyla üretilir (`alignment.ts:197-198`): replay'de kimlik değişir. İd/Ego/Süperego
   etkisinin **nereye** yazılacağı (slot kahramanı) AYRIM S3 kararına bağlı.
2. **Editör ve içerik yeri.** Görsel yükleme + yürünebilir alan çizimi + NPC yerleştirme + diyalog ağacı en pahalı
   parça; ayrıca kullanıcı içeriğinin depoda mı (`data/`) yerelde mi (`icerik/` gibi, mobilde yok: AS2'deki aynı
   ürün sorunu) yaşayacağı karar ister. Görsel hattının darboğaz olduğuna dair kanıt: şehir görünümünün 12 yerleşiminin
   hiçbirinde görsel üretilmemiş (`data/sehir-gorunum.json` her kayıtta `gorsel: null`; `public/yerlesim/` yok).
3. **Kayıt modeli geçişte.** Serüven bugün tek yuva (`rpg-battle-yolculuk`, `src/app/seruvenSave.ts:17-21`);
   AYRIM S3 slot modeli (`SERUVEN-AYRIM.md:165-187`) henüz yok. Sahne durumu S3'ten önce `SeruvenState`'e girerse
   göç iki kez yapılır. Yürüyüş her adımda olay olursa günlük şişer (localStorage ≈5 MB, AYRIM §3.3 "doğrulanmadı").

**İlk dilim (prototip "Han" sahnesi):** S1 (şema + yükleyici + doğrulama testi) → S2a (A* çekirdeği + sahne ızgarası,
yalnız saf) → S3 (diyalog motoru, `src/scene/`) → S4a (zar + bayrak + XP, savaşsız) → S7 (tek han JSON'u, yer tutucu
görsel). Tahmini **6–8 prompt**; savaş/ölüm dalı, bilgi defteri arayüzü ve editör bu dilimin dışında.

---

## 1. Dünya yürüme altyapısı

### 1.1 Ne var

| Dosya:satır | Ne yapar | Sahneye uygunluk |
|---|---|---|
| `src/world/walk.ts:6` | `yurume-izgara.json` modül tepesinde içe aktarılır | **Uyarlanır**: tek ızgaraya kilitli |
| `walk.ts:20-32` | `CELL`, `GW`, `GH` sabit; `grid()` RLE çözer, modül önbelleği `costs` | Sahne başına ızgara gerekir → parametre |
| `walk.ts:34-37` | `cellOf`, `costAt`, `walkable` (0 = geçilmez, değer = maliyet) | Kalıp aynen; ızgarayı argüman alacak biçimde |
| `walk.ts:40-53` | `snap`: dokunulan noktaya en yakın yürünebilir hücre (`yakalamaHucre` yarıçapı) | **Doğrudan**: sahnede "duvara dokundum" durumu aynı |
| `walk.ts:71-121` | `findPath`: 8 yön A*, ikili yığın, köşe kesme yasağı (`:97`), maliyet ortalaması (`:98`) | **Çekirdek doğrudan**, işlev imzası değişir |
| `walk.ts:106-118` | Süre: mil/saat (dünya ölçeği) | Sahnede yok (süre yerine animasyon) |
| `walk.ts:120` | Yol düzleştirme: her 4 hücrede bir nokta | Sahnede 2'de bir ya da görüş hattıyla düzleştirme |
| `walk.ts:123-139` | Gece saati, karşılaşma | Sahnede yok |
| `src/world/roam.ts:51-57` | `passiveHints`: pasif Algı ≥ eşik, yakında, bayrak yoksa ipucu | **Kalıp doğrudan** (gizli nesne/ipucu) |
| `roam.ts:156-159` | `nodeTapAction`: dokunuş → kart / yürü / hiçbir şey | **Kalıp doğrudan** (NPC'ye dokun → yürü + diyalog) |
| `src/world/regions.ts:1-15` | Bölge ızgarası, yüzme, `REGION_RULES` | Sahnede yok; yalnız "sahneye giriş" noktası dünya düğümünden |
| `src/world/worldData.ts:94` | `inPolygon` | **Doğrudan**: yürünebilir çokgeni ızgaraya dökmek için |
| `src/ui/world/WorldMapViewer.tsx:374-429` | Pointer: tek parmak kaydır, iki parmak kıstır, çift dokun yakınlaş, kısa dokunuş (< 4–8 px) → işaret/ipucu/yürü | **Kalıp** (canvas'a bağlı; sahne DOM ile daha basit) |
| `src/ui/world/RegionLoading.tsx` | Bölge geçişinde yükleme ekranı | Sahne girişinde aynı kalıp (görsel önyükleme) |

### 1.2 Ölçek: aynı A* çalışır mı

Dünya ızgarası 429 × 188 = 80 652 hücre (`yurume-izgara.json` `genislik`/`yukseklik`, hücre 32 dünya pikseli) ve
bugün telefonda kullanılıyor. Sahne görseli 1920 × 1080 (şehir görünümüyle aynı sınır `scripts/sehir-gorunum.mjs:17`
`MAX_W = 1920`) ve 16 px hücreyle **120 × 68 = 8 160 hücre**: dünya ızgarasının ≈ %10'u. 8 px hücrede bile 32 640.
A* (`walk.ts:85-101`) `Float64Array`/`Int32Array` ile hücre sayısına doğrusal bellek ayırır; bu ölçekte sorun yok.

**Gereken uyarlama (S2a, saf, ≈1 prompt):** `walk.ts:71-121` gövdesini `astar(g: Uint8Array, w: number, h: number,
a: [x,y], b: [x,y]): cells | null` olarak `src/world/astar.ts`'ye çıkar; `findPath` onu çağırır (davranış bit bit
aynı; `src/world/world.test.ts`, `roam.test.ts` bekçi). Sahne `src/scene/walk.ts` aynı çekirdeği kendi ızgarasıyla
çağırır. Dünya yolu değişmez → kural/kayıt sürümü yok.

### 1.3 Yürünebilir alan veriyle nasıl tanımlanır

| Seçenek | Artı | Eksi | Öneri |
|---|---|---|---|
| (a) Maske PNG (dünyadaki gibi `scripts/yurume-izgara.py:1-5`, 0 = geçilmez) | Ressam dostu | Python betiği + ikinci dosya; tarayıcı editörü çizemez; test görsel okuyamaz (CLAUDE.md yasağı) | Hayır |
| (b) **Çokgenler JSON'da**: `yurunur: Pt[][]` + `engel: Pt[][]`, yüklemede `inPolygon` ile ızgaraya dökülür (önbellek) | Küçük, elle/araçla düzenlenir, testte doğrulanır, editörde çizilir | Karmaşık kenarlarda nokta sayısı artar | **Evet** |
| (c) Hazır RLE ızgara JSON'da | Hızlı yükleme | Elle düzenlenemez | Yalnız (b)'nin önbelleği olarak gerekirse |

Koordinat birimi: görsel pikseli + `boyut: [w, h]` (şehir görünümü 0–1 kullanıyor `src/yerlesim/sehirGorunum.ts:11-12`;
0–1 oran değişiminde bozulmaz ama editörde piksel daha okunur). **Öneri: 0–1** (şehir görünümüyle tek biçim, görsel
yeniden boyutlanınca veri bozulmaz); ızgara hücresi `boyut`'tan türetilir.

Derinlik (Disco Elysium'daki gibi uzağa giden karakterin küçülmesi): isteğe bağlı `olcek: { ust: 0.7, alt: 1.0 }`
(y'ye göre doğrusal jeton ölçeği). Yalnız görünüm; S2b'de.

## 2. Sınav ve bayrak altyapısı

### 2.1 Ne var

| Yer | Biçim | Sahne için |
|---|---|---|
| `link_check` `seruven.ts:133` (komut), `:315-325` (yürütme), `:187` (olay), `:433` (reducer) | `{ link, roll }`; `bestSkill` partide en iyi bonus (`:504-517`); başarısızlık `linkTry` = dinlenme sayısı, yeniden deneme uzun dinlenmeden sonra | **Kalıp**: zar komutta, sonuç olayda |
| `world_check` `roam.ts:28` (komut), `:121-132`, `:145-147` (reducer) | `{ id, roll }`; `tur: 'kirmizi' | 'beyaz'`; kırmızı bir kez (`:126`), beyaz "durum imzası" değişince (`checkSignature` `:48`: seviye, eşya, parti); başarıda `bayrak` | **Doğrudan alınır**: diyalog seçeneğinin tekrar kuralı |
| UI zarı `src/screens/SeruvenScreen.tsx:326` | `roll: 1 + Math.floor(Math.random() * 20)` arayüzde; motor saf | Aynı (elle zar istenirse `src/rules/manualDice.ts` kalıbı ileride) |
| Pasif Algı `roam.ts:51-57` | `10 + perception` ≥ `pasifEsik` | Sahnede gizli nesne/ipucu |
| `SeruvenState.flags` `seruven.ts:78` | `string[]` | Hikâye ilerlemesi, seçenek koşulu |
| Gizli düğüm `nodeVisible` `seruven.ts:469-470` | `node.bayrak` yoksa görünmez | Sahne girişinin bayrakla açılması |
| `BattleState.flags` `src/battle/types.ts:1543-1544`, `JourneyState.flags` `src/journey/types.ts:78` | Savaştan Serüven'e sonuç bayrağı (`seruvenBattle.ts:129`) | Diyalog → savaş → sonuç bayrağı zinciri hazır |
| Görevler `SeruvenState.quests` `seruven.ts:101`, `data/yerlesim.json` `gorevler` (npc, açıklama, hedef, ödül) | `'taken' | 'done'` | Görev günlüğünün veri tabanı |
| Genel yama olayı `seruven_hapis` `seruven.ts:117` (`SeruvenPatch`), `:443` | Seçili alanları değiştiren olay | Sahne sonucu için örnek (ama yeni ad: `seruven_sahne`) |

### 2.2 Altı seçenek bunun üstüne nasıl oturur

Önerilen düğüm şeması (S1):

```text
SahneDiyalog = { id, kok: DugumId, dugumler: Record<DugumId, Dugum> }
Dugum = { metin: {tr,en}, konusan?: NpcId, secenekler: Secenek[] (≤ 6), bitis?: Sonuc }
Secenek = {
  yuva: 1..6,                       // 1 id, 2 ego, 3 superego, 4 sahne becerisi, 5 kendi becerisi, 6 bilgi
  metin: {tr,en},
  kosul?: { bayrak?, bayrakYok?, bilgi?, gorev? },   // 6. yuva için bilgi zorunlu
  egilim?: { duzen?: number, iyilik?: number },       // 1–3; yoksa yuvanın varsayılanı (§3)
  sinav?: { beceri: string[], dc: number, tur: 'kirmizi'|'beyaz' },  // 4–5
  basari: Sonuc, basarisiz?: Sonuc  // sınavsız seçenekte yalnız basari
}
Sonuc = { git?: DugumId, bayrak?: string[], bilgi?: string[], xp?, altin?, esya?, gorev?,
          savas?: string /* senaryo */, hasar?: zar, olum?: boolean, kapat?: boolean }
```

- **Yuva 4** (sahnenin becerisi): `bestSkill(state, beceri)` (`seruven.ts:504`) gibi partinin en iyisi.
- **Yuva 5** (kendi becerisi): konuşan karakterin (AYRIM kararıyla slot kahramanı) en iyi becerisi; beceri listesi
  veride değil karakterden (`skillBonus` `src/rules/skills.ts`, `combatantFromSheet` — `bestSkill` içi aynı yol
  `seruven.ts:508-512`). Hangi beceri: kahramanın en yüksek bonuslu becerisi mi, oyuncu mu seçer? → Karar 5.
- **Zar**: komutta `roll` (link/world_check kalıbı). Olay `sahne_secildi { sahne, dugum, yuva, total, dc, success,
  by }`; reducer sonucu uygular. Replay saf.
- **Tekrar**: `tur` `kirmizi` (bir kez; başarısızlık kalıcı dal) / `beyaz` (durum imzası değişince; `roam.ts:48`).
- **Başarısızlık → savaş**: `savas` alanı sahneden yolculuk durağı kurar; `nodeJourney` (`src/app/seruvenBattle.ts:62`)
  ve `seruvenBattleSession` (`:89`) senaryo kimliğiyle çalışıyor; dönüşte `seruvenResultCommand` (`:123`) kalıbında
  `sahne_savas_sonucu` (Büyük suç zinciri `suc_basla` → savaş → `suc_sonuc` `seruven.ts:146-147` aynı biçim).
- **Başarısızlık → hasar/ölüm**: parti `status` (`CharacterStatus.hp`, `dead` `src/rules/characterRest.ts:19-45`);
  olayda yalnız değişen üyelerin durumu (`seruven_moral` kalıbı `seruven.ts:179`). Ölümün kalıcılığı AYRIM §7.5
  kararına bağlı.
- **İşi yapamama**: `kapat: true` → diyalog düğümü kilitlenir (bayrak `sahne:<id>/<dugum>:kapali`).

## 3. Hizalanma

### 3.1 Hazır giriş noktaları

| Yer | Ne | Sahne için |
|---|---|---|
| `src/rules/alignment.ts:211-220` `addEvent(a, olayId, kim, zaman, oturum?, gerekce?, carpan?)` | Hazır olay (`data/hizalanma-olaylari.json`, 15 olay: `merhamet` +3 İyilik, `soz-tuttu` +3 Düzen…); tekrar azalımı (`:200-208`) | Yuva 1–3 hazır bir olaya bağlanabilir (`egilim.olay`) |
| `alignment.ts:222-228` `addFree(a, eksen, miktar, gerekce, …)` | Serbest giriş, tek eksen, ±`serbestEnCok` (`data/hizalanma.json`) | Yuva 1–3'ün varsayılan etkisi (eksen + küçük miktar) |
| `src/rules/alignmentMoral.ts:41` `applyAlignAct` | Hizalanma + Moral bağı (vicdan, huzur, yeni yol) | Moral açıkken bunu çağırmak gerekir |
| `alignmentMoral.ts:22` `alignmentMoralOn` | `hizalanma && moralSistemi && hizalanmaMoral` | |

### 3.2 Sorunlar

1. **Değer Serüven'de yok.** `SavedCharacter.hizalanma` (`builder.ts:51`), `JourneyMember` yalnız `sheet` (`types.ts:49`).
   Serüven `hizalanma`'yı hiç okumuyor/yazmıyor. AYRIM S3'te kahraman slotta yaşayacak (`roster`, `SERUVEN-AYRIM.md:173-178`):
   alignment kahramanın slot kopyasına girmeli (`CompanionMember.hizalanma?`).
2. **Anahtar ayrı yerde.** Hizalanma Serüven anahtarı değil, profil özelliği (`src/app/features.ts:54` `alignmentEnabled`,
   localStorage `rpg-battle-deneysel`); Serüven anahtarları `data/seruven.json` `anahtarlar` (`moralSistemi`, `moralTam`
   varsayılan kapalı). Replay'in profil ayarına bağlı olmaması için Serüven'e **slot başına** anahtar (`hizalanma`)
   eklenmeli; motor `toggleOn(state, 'hizalanma')` okur (`seruven.ts:201`).
3. **Determinizm.** `entryId` saat + modül sayacı (`alignment.ts:197-198`): aynı günlük iki kez oynatılınca kimlikler
   farklı (geri alma kimliğe bakar `:230`). Sahne olayı kimliği (`<sahne>/<dugum>/<yuva>/<n>`) ve `zaman`'ı (Serüven
   saati `roam.ts:31` `clock`) taşımalı; `alignment.ts`'ye isteğe bağlı `id` parametresi küçük bir ek (motor dışı, saf).

### 3.3 "Hizalanma başta kapalı" kararının etkisi

- Yuva 1–3 **hep açık** kalır (tasarım gereği); kapalıyken etkileri yalnız sahne durumunda **eğilim sayacı** olarak
  tutulur (`SeruvenState.sahne.egilim: { duzen, iyilik }`), Alignment'a yazılmaz. Açılınca yalnız ileriye uygulanır
  (geçmişi geriye yazmak "başta kapalı" seçiminin anlamını bozar). → Karar 2.
- Eşleme asimetrik: İd → Düzen −, Ego → İyilik −, Süperego → İyilik +. **Düzen + yönüne giden yuva yok**: uzun oyunda
  Hizalanma Kaotik'e kayar. Veride yuva başına varsayılan + seçenek başına ezme (`egilim`) önerilir. → Karar 1.
- Moral kapalıyken `applyAlignAct(..., ctx: null)` Moral'sız çalışır (`alignmentMoral.ts:41` imzası `ctx | null`).

## 4. Bilgi defteri ve görev günlüğü

| Var olan | Uygun mu |
|---|---|
| Keşif defteri `src/app/discovery.ts:1-5`, `:24` (`rpg-battle-kesif`, profil başına, yüzey tepkimesi satırları) | **Hayır**: profil düzeyi, kayda ve replay'e girmez (dosya başlığı açıkça söylüyor). Kalıbı (normalize, bilinmeyen kimliği at `:37`) alınabilir |
| `SeruvenState.flags` (`seruven.ts:78`) | Bilgi bayrak olarak tutulabilir ama defterde metin, kaynak, sıra gerekir |
| `SeruvenState.quests` (`seruven.ts:101`) + `data/yerlesim.json` `gorevler` | **Görev günlüğünün temeli**: durum var; aşama/not yok |
| `SeruvenState.done` (`seruven.ts:77`) | Düğüm geçmişi |

**Öneri (S5):**

- Katalog `data/sahne/bilgiler.json`: `{ id, ad: {tr,en}, metin: {tr,en}, etiket?: string[] }`; kimlik kuralı
  CLAUDE.md'deki gibi sabit (değişmez; doğrulama testi yinelenen/bilinmeyen kimliği reddeder).
- Durum: `SeruvenState.bilgi?: Array<{ id, sahne, gun }>` (yoksa boş; eski kayıt bozulmaz). Yuva 6 koşulu
  `kosul.bilgi` bu listeye bakar.
- Görev günlüğü: `quests` aynen + isteğe bağlı `gorevNot?: Record<string, string[]>` (aşama kimlikleri). Ayrı bir
  ikinci görev sistemi kurulmaz.
- Arayüz: defter Serüven ekranında tembel panel (Bilgiler / Görevler sekmeleri).

## 5. Kayıt ve olay modeli

### 5.1 Hangi model

| Seçenek | Değerlendirme |
|---|---|
| Savaş motoru (`Command → execute → Events → reducer`, `src/battle/`) | **Hayır**: tur, ekonomi, kural sürümü zinciri gereksiz; kural sürümü artırır |
| **`src/journey` kalıbı (Serüven komut/olayı)** | **Evet**: Serüven zaten bu (`seruven.ts:1-5`); K47 aynı yoldan alt modül (`roam.ts:1-5`) |
| Ayrı bağımsız günlük | Hayır: iki günlüğün sırası bozulur (sahne savaş başlatır, savaş Serüven'e döner) |

Sahne `src/scene/` altında saf modül (`sceneEvents(state, cmd, deps): SceneEvent[] | string`, `reduceScene`), tıpkı
`roamEvents`/`reduceRoam` (`roam.ts:68`, `:135`). Bağ: `SeruvenCommand | SceneCommand` (`seruven.ts:162` yanına),
`SeruvenEvent | SceneEvent` (`:195`), `executeSeruven`'de bir `case` (`:364-367` kalıbı), `reduceBase`'de bir `case`
(`:446` kalıbı). Kural sürümü ve `SAVE_VERSION` (25) etkilenmez.

### 5.2 Kayda ne girer

```text
SeruvenState.sahne?: {
  acik: { id, dugum: DugumId | null, giris: string } | null   // sahnedeyken; null = dünyada
  gorulen: Record<SahneId, { secilen: string[], kapali: string[] }>  // seçilen/kilitlenen yuvalar (kırmızı/beyaz)
  egilim?: { duzen, iyilik }                                  // Hizalanma kapalıyken sayaç (§3.3)
}
SeruvenState.bilgi?: Array<{ id, sahne, gun }>
```

- **Yürüyüş kayda girmez** (yalnız arayüz durumu, kamera gibi; `src/world/camera.ts:1-3` "Görünüm kayda girmez"
  ilkesi). Sahneye dönüşte giriş noktasında başlanır. Günlük şişmez.
- Olaylar: `sahne_girildi`, `sahne_cikildi`, `sahne_secildi` (zar sonucu dahil), `sahne_sonuc` (bayrak, bilgi, XP,
  altın, eşya, durumlar), `sahne_savas_sonucu`. Her olay kendi uygulanacak değerlerini taşır (replay, veri değişse de
  aynı sonucu verir; `seruven_started`'ın tüm durumu taşıması gibi `seruven.ts:168`).
- **Veri sürümü**: sahne JSON'u değişince eski kayıttaki `dugum` kimliği yok olabilir → sahneye girişte
  `dugum` bulunamazsa kök düğüme dön (bilgi notu).
- `busy` korumaları (`roam.ts:65`): sahnedeyken yürüme/seyahat/yerleşim komutları reddedilir; tersi de.
- AYRIM S3 ile ilişki: alanlar isteğe bağlı olduğundan bugünkü tek yuvaya da eklenebilir; ama Hizalanma (§3.2) slot
  kahramanı gerektirir. **S1–S3 S3'ten bağımsız, S4b (Hizalanma bağı) S3'ten sonra.**

## 6. Sahne editörü

### 6.1 Depodaki benzer araçlar

| Araç | Dosya:satır | Ne yapıyor | Sahneye katkı |
|---|---|---|---|
| Serüven düğüm aracı `#dugum` | `SeruvenScreen.tsx:58` (`toolOn`: hash ya da `rpg-battle-dugum`), `:205-206`, `:252`, `:369`, `:395-400` | Görsele dokun → 0–1 nokta listesi, kopyala, `npm run seruven-dugum` komutu üret | **En yakın kalıp**: tıkla-nokta-al + JSON kopyala |
| `scripts/seruven-dugum.mjs` (32 satır), `npm run seruven-dugum -- sehir …` | Koordinatı JSON'a yazar | Betikle yazma kalıbı |
| Şehir görünümü `src/screens/SehirGorunum.tsx:1-5`, `src/yerlesim/sehirGorunum.ts:1-12` | Tek üstten görsel + 0–1 bina düğümleri, düğüme dokun → kart; `komsular` "ileride yürüme modu için" | **Sahnenin atası**: görsel + dokunulabilir düğüm + kart. Sahne bunu yürüme + diyalogla genişletir |
| `scripts/sehir-gorunum.mjs:92-105` | Ham görsel → `public/yerlesim/<id>.webp` (≤1920 px, WebP q80) + veri boyutu | **Görsel hattı doğrudan** |
| Nesne paneli `src/ui/gm/ObjectPanel.tsx:1-4` (eski ObjectTool; görevdeki yol artık yok) | Katalog kartı → altıgene dokun → yerleştir | NPC/nesne yerleştirme etkileşimi kalıbı (altıgene bağlı; sahnede serbest nokta) |
| Altıgen harita "editörü" | Yok: haritalar Python betikleriyle (`scripts/*-haritalar.py`) ve `harita-zemin` önerisiyle | Tarayıcı harita editörü yok |

### 6.2 En küçük uygulanabilir yol

| Aşama | İçerik | Yeterli mi |
|---|---|---|
| E0 — **Yalnız JSON + doğrulama** | Kullanıcı `data/sahne/<id>.json` yazar; `src/scene/sahne.test.ts` şemayı, kimlikleri, düğüm erişilebilirliğini (ölü dal, kök), yuva kurallarını denetler; `#dugum` aracıyla görsel üstünde nokta alır | Prototip için **evet**; çokgen çizmek elle zor |
| E1 — **Tarayıcıda geometri aracı** (`#sahne-editor`, tembel parça, geliştirici bayrağı) | Görsel yükle (`<input type=file>` → objectURL, depoya yazılmaz), yürünebilir/engel çokgeni çiz, NPC/nesne/giriş/çıkış noktası koy, canlı A* önizleme; çıktı JSON (kopyala/indir) | Önerilen ilk editör |
| E2 — Diyalog formu | Düğüm listesi + seçenek formu (yuva, koşul, sınav, sonuç), ağaç görünümü, "oyna" düğmesi | Sonra |
| E3 — Kullanıcı içeriği içe aktarma (Ayarlar "Dış içerik" gibi, localStorage/IndexedDB) | Mobilde dosya yok sorunu | Yalnız karar 3 "yerel" çıkarsa |

**Öneri:** E0 → E1; diyalog başta JSON'da (doğrulama testi hatayı satırıyla söyler, `check:icerik` kalıbı). E2 ancak
ilk 2–3 sahneden sonra, gerçek ihtiyaç görülünce.

## 7. Görsel hattı

| Konu | Bugün | Sahne önerisi |
|---|---|---|
| Boyut | Şehir görünümü ≤1920 px genişlik (`sehir-gorunum.mjs:17`, `:102`); savaş haritaları altıgene hizalı (`gorsel-sartnamesi.md` §1–2) | 1920 × 1080 (16:9) üst sınır; dikey telefon için kamera kaydırır (§8). Altıgen hizası **gerekmez** |
| Format | WebP q80 (şehir `:103`), q82 (harita `gorsel-sartnamesi.md:136`) | WebP q80; ≈ 300–600 kB/görsel (ölçülmedi) |
| Yerleşim | `public/maps/<bolge>/…`, `public/yerlesim/<id>.webp`, `public/kita/` | `public/sahne/<id>.webp`; ham `assets-ham/sahne/` (depo dışı, gitignore); `npm run sahne-gorsel` (`sehir-gorunum.mjs`'in kopyası) |
| Paket sınırı | Ana parça sınırı 500 kB (`data/paket-siniri.json` `anaParcaKb`), ≈436 kB (`docs/BUNDLE.md:6-9`); Serüven modülleri ana parçada değil (`SERUVEN-AYRIM.md` kısa sonuç) ama Serüven metinleri ana `strings.ts:601`'de | Görseller `public/`'te: pakete girmez. `src/scene/` ve sahne ekranı `lazy` (WorldMapViewer gibi `SeruvenScreen.tsx:44`). Sahne JSON'ları `import.meta.glob` ile tembel; sahne metinleri tembel dosyada (AYRIM S2'nin `strings.seruven.ts`'i) |
| Gemini hattı | Şartname altıgen/ızgara odaklı (`gorsel-sartnamesi.md` §1–3), stil §4, prompt dosyaları `harita/<bolge>/prompt/` | Şartnameye "Sahne" bölümü: üstten/eğik, ızgarasız, yürünebilir zemin okunur, alt %30 diyalog paneli için sade, NPC'ler görselde **yok** (jeton olarak eklenir) |
| Testler | Görsel testlere girmez (CLAUDE.md) | Test yalnız dosya adını listeler (`import.meta.glob`), çokgen verisini denetler |
| Darboğaz kanıtı | 12 yerleşimin 12'si `gorsel: null` (`data/sehir-gorunum.json`) | Yer tutucu zorunlu: görsel yoksa düz renk + çokgen çizimi (şehir `onFail` → eski hub `SehirGorunum.tsx:4` kalıbı) |

## 8. Mobil / dokunmatik

| Parça | Kaynak | Sahnede |
|---|---|---|
| Kamera | `src/world/camera.ts` saf (`clampCamera`, `zoomAt`, `panBy`, `toWorld`/`toScreen`) ama `WORLD` sabitine bağlı (`:5`, `:11`, `:16-21`) | **Uyarlanır**: dünya boyutu parametre (`world: {w,h}`) — küçük saf değişiklik; ya da sahne için 30 satırlık kopya |
| Savaş kamerası | `src/ui/camera.ts` (altıgen `VIEW`'e bağlı `:6`), `MapCamera.tsx:73` `useMapCamera(state: BattleState, …)` | **Kullanılmaz** (BattleState'e bağlı) |
| Eşikler | `DRAG_PX = 8` (`ui/camera.ts:21`), dokunma hedefi ≥ 44 px (`MIN_HEX_PX` `:19`), dünya kısa dokunuş < 4–8 px (`WorldMapViewer.tsx:405`, `:414`, `:420`) | Aynı sayılar: kısa dokunuş = eylem, uzun = kaydır |
| Etkileşim | `nodeTapAction` (`roam.ts:156-159`) | Zemine dokun → `snap` + A* → yürü; NPC/nesneye dokun → yanındaki etkileşim noktasına yürü, varınca diyalog; yürürken dokun → animasyonu atla (`WorldMapViewer.tsx:421` kalıbı) |
| Diyalog | — | Alt çekmece (alt %40, dikeyde %55), 6 seçenek tek sütun, her biri ≥ 44 px; yuva simgesi + sınav DC'si ve başarı yüzdesi (önizleme kartı fikri `src/ui/preview/`); kapatılamayan düğümde geri yok |
| Hareketi azalt | WorldMapViewer'da nabız/geçiş yok (`:4-5`) | Yürüyüş animasyonu yerine anında yer değiştirme |
| Dikey ekran | Savaş: `scaleScreen` (`ui/camera.ts:9-11`) | Görsel yüksekliğe sığar, yatay kaydırma; kamera karaktere yumuşak izler |

## 9. Eksik listesi ve adım planı

### 9.1 Eksikler

| # | Eksik | Bugünkü en yakın şey |
|---|---|---|
| 1 | Sahne veri şeması + yükleyici + doğrulama | `data/sehir-gorunum.json`, `sehirGorunum.ts` |
| 2 | Parametreli A* çekirdeği | `walk.ts:71-121` (tek ızgara) |
| 3 | Çokgen → ızgara dökümü | `worldData.ts:94` `inPolygon` |
| 4 | Sahne ekranı (görsel, jeton, yürüyüş animasyonu) | `SehirGorunum.tsx`, `WorldMapViewer.tsx` |
| 5 | Diyalog düğüm motoru (koşul, yuva, geçiş) | Yok |
| 6 | Sınav + sonuç uygulama | `link_check`, `world_check` |
| 7 | Sahne → savaş → sahne | `suc_basla`/`suc_sonuc`, `seruvenBattle.ts:62-135` |
| 8 | Hizalanma bağı (slot kahramanı, Serüven anahtarı, deterministik kimlik) | `alignment.ts:211-228`, ama Serüven'de değer yok |
| 9 | Bilgi kataloğu + `SeruvenState.bilgi` + defter arayüzü | `discovery.ts` (uygun değil), `quests` |
| 10 | Dünya/Serüven düğümünden sahneye giriş (`SeruvenNode.sahne?`, dünya hub'ı) | `node.yerlesim` (`seruven.ts:35`) ve şehir görünümü girişi |
| 11 | Editör (geometri, sonra diyalog) | `#dugum` aracı |
| 12 | Görsel hattı + şartname bölümü | `sehir-gorunum.mjs`, `gorsel-sartnamesi.md` |
| 13 | TR/EN metin (sahne arayüzü tembel dosyada; sahne içeriği JSON'da iki dilli) | `strings.ts`/`strings.en.ts` |

### 9.2 Adımlar

Prompt sayısı: bir prompt = bir görev turu (typecheck + ilgili test + build yeşil).

| Adım | İçerik | Prompt | Bağımlılık | Kural / kayıt sürümü | Risk |
|---|---|---|---|---|---|
| **S1** Şema + yükleyici | `src/scene/types.ts`, `data/sahne/*.json` (`import.meta.glob` tembel), `sahne.test.ts` (kimlik, kök, ölü dal, yuva kuralları, çokgen geçerliliği) | 1–2 | — | yok / yok | Düşük |
| **S2a** A* çekirdeği | `src/world/astar.ts` çıkarımı (dünya bit bit aynı), `src/scene/grid.ts` (çokgen → ızgara, önbellek), `snap` | 1 | S1 | yok / yok | Düşük (dünya testleri bekçi) |
| **S2b** Sahne ekranı + yürüme | Tembel `SceneScreen.tsx`: görsel/yer tutucu, jeton, dokun-yürü, kamera (`world/camera.ts` parametreli), derinlik ölçeği, hareketi azalt | 2–3 | S2a | yok / yok | Orta (mobil his) |
| **S3** Diyalog motoru | `src/scene/dialog.ts` saf: düğüm, koşul, yuva görünürlüğü, 6. yuva bilgi koşulu; `SceneCommand`/`SceneEvent`, `executeSeruven` bağı; diyalog çekmecesi | 2 | S1 | yok / alanlar isteğe bağlı | Orta |
| **S4a** Sınav + kazanım (savaşsız) | Zar komutta, kırmızı/beyaz, sonuç: bayrak, XP, altın, eşya, görev, `kapat` | 1–2 | S3 | yok / yok | Düşük |
| **S4b** Başarısızlık: hasar, ölüm, savaş | Durum olayı, `savas` → `nodeJourney`/`seruvenBattleSession` kalıbı, dönüş olayı | 2 | S4a | yok / yok | Orta (savaş dönüş akışı `App.tsx`) |
| **S4c** Hizalanma bağı | Serüven anahtarı `hizalanma`, eğilim sayacı, slot kahramanına `addFree`/`addEvent` (deterministik kimlik), Moral açıkken `applyAlignAct` | 1–2 | S3, **AYRIM S3** | yok / yok | Orta (karar 1–2) |
| **S5** Bilgi defteri + görev günlüğü | `data/sahne/bilgiler.json`, `SeruvenState.bilgi`, defter paneli, `quests` notları | 1–2 | S4a | yok / yok | Düşük |
| **S6a** Geometri editörü | `#sahne-editor` tembel: görsel yükle, çokgen çiz, nokta koy, A* önizleme, JSON indir | 3–4 | S2b | yok / yok | Orta–yüksek (en büyük arayüz işi) |
| **S6b** Diyalog formu | Düğüm/seçenek formu, ağaç, "oyna" | 3–5 | S6a, S3 | yok / yok | Yüksek |
| **S7** İlk örnek sahne (Han) | 1 sahne JSON (3 NPC, ~12 düğüm, her yuvadan örnek), yer tutucu görsel, Serüven düğümünden giriş | 1–2 | S3, S4a (S2b görsel için) | yok / yok | Düşük |
| **S8** Görsel hattı | `npm run sahne-gorsel`, şartname "Sahne" bölümü, `public/sahne/` | 1 | S1 | yok / yok | Düşük (görseli kullanıcı üretir) |

Toplam ≈ 19–28 prompt. Hiçbir adım savaş motoruna dokunmaz → **kural sürümü (103) ve `SAVE_VERSION` (25) değişmez**.

### 9.3 En küçük prototip dilimi ("Han")

S1 → S2a → S3 → S4a → S7, S2b'nin yalın hâliyle (görsel yerine düz zemin + çokgen çizimi, dokun-yürü, kamerasız):
**≈ 6–8 prompt**. Sonunda: Serüven'de bir düğümden hana girilir, hancıya yürünür, 6 yuvalı diyalog açılır, Ego seçeneği
eğilim sayacını değiştirir, Persuasion sınavı zar ister, başarıda bilgi + bayrak + XP, başarısızlıkta düğüm kapanır,
6. yuva ikinci NPC'de bu bilgiyle açılır; kayıt kapatılıp açılınca (replay) aynı durum. Savaş, ölüm, Hizalanma'ya
yazma ve editör dilimin dışında.

## 10. Karar bekleyen sorular

| # | Soru | Önerim |
|---|---|---|
| 1 | **Eksen eşlemesi.** İd → Kaos, Ego → Kötülük, Süperego → İyilik; Düzen (+) yönüne giden yuva yok, uzun oyunda Kaotik'e kayma olur. Nasıl dengelenir? | Veride yuva başına varsayılan (İd: Düzen −2; Ego: İyilik −2; Süperego: İyilik +2 **ve** Düzen +1) + seçenek başına `egilim` ezmesi; sahne yazarı gerektiğinde Düzen +'yı açıkça verir |
| 2 | **Hizalanma kapalıyken** yuva 1–3'ün etkisi ne olur, sonradan açılınca geçmiş uygulanır mı? | Hep eğilim sayacına yaz (kayıtta), Alignment'a yazma; açılınca yalnız ileriye. Hizalanma'yı profil ayarı değil **Serüven (slot) anahtarı** yap (replay profil ayarına bağlı kalmasın) |
| 3 | **Sahne içeriği nerede yaşar?** Depoda (`data/sahne/`, `public/sahne/`, git'te) mi, yerel/içe aktarılan içerik mi (`icerik/` gibi; mobilde yok)? | Depoda: kimlik kuralı, test ve replay güvencesi; kullanıcı sahneyi editörde hazırlayıp JSON'u depoya koyar. İçe aktarma (E3) ancak paylaşım gerekirse |
| 4 | **Editör biçimi ve sırası.** İlk sürüm yalnız JSON + doğrulama mı, tarayıcı aracı mı? | E0 (JSON + test) prototipte; ardından yalnız geometri aracı `#sahne-editor` (görsel yükle, çokgen, nokta, JSON indir). Diyalog formu ilk 2–3 sahneden sonra |
| 5 | **Yuva 5 "kendi becerin":** kimin, hangi becerisi? Kahramanın en yüksek becerisi mi, oyuncu her seferinde mi seçer, sahne mi önerir? | Konuşan = slot kahramanı (AYRIM kararı: tek kahraman); kahramanın **uzman/yetkin olduğu becerilerden** oyuncu seçer, varsayılan en yüksek bonus; DC sahnenin yuva-4 DC'si |
| 6 | **Başarısızlık ve tekrar kuralı:** her sınav kırmızı (bir kez) mi, beyaz (durum değişince) mi; ölüm doğrudan sonuç olabilir mi? | Seçenek başına `tur` (varsayılan beyaz, `world_check` modeli `roam.ts:121-132`); ölüm doğrudan değil "savaş" ya da "hasar" sonucu üzerinden (0 HP'ye düşen mevcut ölüm/diriltme kuralına girer; AYRIM §7.5 ile tek karar) |

**Sıra önerisi (karar değil):** S1–S3 AYRIM S3'ten bağımsız başlayabilir; Hizalanma'ya yazan S4c AYRIM S3 (slot kaydı)
bittikten sonra.
