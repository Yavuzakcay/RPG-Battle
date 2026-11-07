# Kuyruk K65: Serbest şekil alan seçici, plan

Durum: **plan** (Aşama 1; kod, veri ve test değişmedi). Taban `wip/k64` (e68ff61, kural sürümü 48). Hedef kural sürümü **49**.

## 1. Envanter

SRD 5.2.1 metninde "contiguous / arrange as you like / up to N feet on a side" geçen büyüler taranıp savaşta kullanılanlar alındı. Savaş dışı olanlar (guards-and-wards, magnificent-mansion, fabricate, move-earth) kapsam dışı.

| Büyü | SRD alan kuralı | Bugünkü yaklaşıklık | Serbest şekilden fayda |
|---|---|---|---|
| fire-storm (7) | on adede dek 10 ft küp, "arrange as you like", her küp en az bir küple bitişik; 150 ft menzil | tek 25 ft küre (`area.shape: sphere`): yarıçap 5 altıgen, ≈91 altıgen; SRD alanının (1000 ft²) yaklaşık iki katı | **yüksek**: M1-FARKLAR'ın açık satırı |
| forcecage (7) | kafes "up to 20 feet on a side", kutu "up to 10 feet on a side"; seçilen alanın çevresinde | K62 ön ayarı: kutu 2×2 (hedef + ilk üç komşu), kafes yarıçap 2 (19 altıgen); boyut ve yön seçilemez | **orta**: "up to" boyutu ve konumu seçilemiyor |
| wall-of-stone (5), wall-of-ice (6), wall-of-force (5) | on adet 10 ft panel, her panel bir panelle bitişik (ya da kubbe/küre) | düz duvar (`shape: wall`, 100 ft) ya da halka; panel HP'si altıgen anahtarlı (`walls.ts` `panelId`) | **orta**: serbest panel yolu; panel kimlikleri değişir, risk yüksek |
| wind-wall (3) | "any way you choose so long as it makes one continuous path" | motor S2'den beri serbest yol (`wallPath` 10 altıgen, `cast_spell.targetHexes`); **arayüzde girişi yok** (düz/yay) | düşük maliyet: yalnızca arayüz |
| meteor-swarm (9) | dört ayrı nokta | motor A8'den beri `multiPoint` (`targetHexes`); YZ kullanıyor, **arayüzde tek nokta** | düşük maliyet: yalnızca arayüz |

Kapsam dışı (şekli serbest değil): blade-barrier, wall-of-fire (düz/halka; mevcut `wallShape`), prismatic-wall (düzlem/küre). Earthquake'in yarık/yapı parçası K66.

## 2. Hedef davranış

- **Boyama:** büyücü altıgenleri tek tek seçer.
  - İlk altıgen menzilde ve görüşte olmalı.
  - Sonraki her altıgen seçili kümeye bitişik olmalı (bitişiklik artımlı, küme her an bağlı).
  - Seçili bir altıgene yeniden dokunmak onu çıkarır; kümeyi ikiye bölecekse çıkarılmaz, uyarı verilir.
  - "Geri al" son eklemeyi, "Temizle" hepsini kaldırır.
  - "Onayla" en az bir altıgenle açılır; büyüye göre en az sayı yok.
- **Fire Storm:**
  - Üst sınır = küp sayısı × küp başına altıgen (Karar 1).
  - Her altıgen 150 ft menzilde. Görüş yalnızca ilk (çıkış) altıgende istenir; SRD "appears within range" der, küp başına görüş istemez (Karar 2).
  - Dost ateşi serbest (SRD: "each creature in the area").
- **Forcecage:** bitişik küme; boyut sınırı kutu ≤ 4 altıgen ve çap ≤ 2, kafes ≤ 19 altıgen ve çap ≤ 4. K62 ön ayarları en büyük geçerli şekiller olarak kalır.
- **ft → altıgen:** projenin iki geleneği çelişiyor. `area.ts` küpü "yarıçap S/10" sayar (10 ft küp = 7 altıgen); çok altıgen gövdede Large (10 ft) = 3 altıgen. Fire Storm için üç seçenek:
  - 3/küp: 30 altıgen, gövde geleneği.
  - 4/küp: 40 altıgen, kare ızgaradaki 2×2 sayımı; SRD alanı 1000 ft² ÷ altıgen alanı ≈ 46'ya yakın.
  - 7/küp: 70 altıgen, `area.ts` küp geleneği.
  - **Öneri: 4/küp = 40 altıgen**: SRD alanına en yakın ve elle boyamada anlaşılır ("40/40").

## 3. Veri modeli ve komut

- **Komut:** yeni komut yok. `cast_spell.targetHexes` (Meteor Swarm ve Wind Wall'da zaten var) seçili kümeyi taşır; `targetHex` kümenin ilk altıgeni (çıkış).
- **Veri:** büyü verisinde `k65` bloğu (sürüm 49), `freeShape: { maxHexes, rangeAll: true, sightFirst: true, diameterMax? }`. Fire Storm `freeShape.maxHexes` 40 (Karar 1). Forcecage `freeShape` kutu/kafes başına sınır (`choice` box/cage kalır).
- **Motor:**
  - Tek doğrulayıcı `src/battle/freeShape.ts`, `freeShapeHexes(state, actor, spell, hexes)`: harita içi, tekrarsız, bağlı (BFS), sayı ve çap sınırı, menzil, ilk altıgen görüşü. Wind Wall'un `wallPathHexes`'i yol (sıralı) içindir; küme doğrulaması ayrı fonksiyon, ortak yardımcılar (`isInside`, `distance`) aynı.
  - Fire Storm'un save/hasar yolu bugünkü alan yolundan (`pickArea` → `areaSaveEvents`) geçer; tek fark: altıgen listesi `pickArea` yerine `freeShapeHexes`'ten gelir. Meteor Swarm'ın `multiPoint` birleşimi de aynı noktadan geçiyor (`spells.ts:169`).
  - Forcecage: `castCageHexes` (`zones.ts`), sürüm 49'da `targetHexes` varsa onu doğrulayıp kullanır.
- **Replay ve kayıt:** olaylar sonucu taşır (`area_used`, `save_resolved`, `zone_created.zone.hexes`); komut kaydedilmez. Replay belirlenimci. Kayıt boyutu: en çok 40 offset ≈ 1 kB. `SAVE_VERSION` değişmez (yeni olay yok).

## 4. Arayüz

- **Yeni mod `paint`** (`MapBattle.tsx`), saf yardımcıları `src/ui/freeShapeView.ts`'te (aday altıgenler, bağlılık, çıkarma sonrası bölünme; birim testli).
- **Dokunma:** mobilde sürüklemek kamerayı kaydırıyor (`MapCamera` `onPointerDown`/`onPointerMove`), bu yüzden **dokun-ekle/dokun-çıkar** kullanılır, sürükleyerek boyama yok. Masaüstünde de aynı.
- **Göstergeler:**
  - Seçili altıgenler alan renginde.
  - Eklenebilir altıgenler ince çerçeveli, eklenemeyenler soluk.
  - Sayaç "7/40".
  - Alttaki çubukta "Geri al", "Temizle", "Onayla", "Vazgeç".
- **Önizleme:** etkilenecek dost/düşman sayısı mevcut alan önizlemesiyle aynı biçimde (`areaActPreview` dost/düşman işareti).
- **Uyarılar (`battle.why` yolu):** "menzil dışında", "seçili alana bitişik değil", "sınır doldu (40)", "çıkarınca alan bölünür".
- **Metin:** TR/EN `battle.k65`.
- **Kurulum ekranı:** K64b koruma alanı düğmeleri dokunulmaz (merkez + yarıçap; serbest şekil değil).
- **Wind Wall ve Meteor Swarm (K65b):**
  - Wind Wall aynı boyacının "yol" kipini kullanır (sıralı, uçtan uca).
  - Meteor Swarm "nokta" kipini kullanır (bitişiklik yok, 4 nokta).
  - Motorları değişmez.

## 5. Yapay zekâ

- **Fire Storm** (`k65:firtina`, kural eylemi): açgözlü büyütme.
  - Tohum: en çok düşmanı kapsayan, dostsuz, menzilde ve görüşte düşman altıgeni.
  - Her adımda kapsanmamış en yakın düşmana dostsuz en kısa bitişik yol (BFS) eklenir; yol bütçeye sığmazsa atlanır.
  - Bütçe bitince ya da düşman kalmayınca durur.
  - Kalan bütçe kullanılmaz: alan boşuna büyütülmez.
  - Dost içeren küme seçilmez (YZ dost ateşinden kaçınır, bugünkü `bestAim` gibi).
- **Hesap sınırı:** düşman başına bir BFS. Haritada ≤ 48×28 = 1344 altıgen, en çok 10 düşman → ≈ 13 bin adım. `sim:yz-sure` ile ölçülür, hedef karar süresinde +%10'dan az.
- **Forcecage:** K62 kuralı (20+ HP düşman, kutu) aynen. Sürüm 49'da kutu, hedefi içeren ve dost içermeyen en büyük geçerli küme (≤ 4 altıgen); bulunamazsa ön ayar.

## 6. Sürüm kapısı

- `kural-surumu.json` 49. `freeShape` yalnızca `k65` bloğunda (`mechanicsAt`, `castSpell` `LATER`, `buyu-durum.mjs` BLOCKS: `k65` → 49).
- Sürüm ≤ 48: Fire Storm 25 ft küre, Forcecage K62 ön ayarı aynen. `targetHexes` verilse de yok sayılır (bugünkü gibi).
- Arayüz boyacıyı yalnızca sürüm 49 savaşında açar.

## 7. Parçalama

**Öneri: iki kuyruk.**

- **K65a (sürüm 49), boyacı + Fire Storm:**
  - Yeni dosyalar: `src/battle/freeShape.ts`, `src/ui/freeShapeView.ts` (+ test), `src/battle/k65.test.ts`.
  - Değişecekler: `src/battle/spells.ts` (alan yolu), `src/battle/spellVersion.ts`, `scripts/lib/buyu-durum.mjs`, `src/data/types.ts` (`freeShape`), `data/spells-69.json` (fire-storm `k65`), `data/kural-surumu.json`, `src/battle/ai.ts` (`k65:firtina`), `data/yz-roller.json` (öncelik), `src/MapBattle.tsx` (`paint` modu), i18n TR/EN, `ruleVersion.test.ts`/`g6.test.ts` sürüm değeri.
  - Belgeler: DECISIONS, CLAUDE.md, M1-FARKLAR (fire-storm satırı kapanır), BUYU-DURUM.
- **K65b (aynı sürüm 49; yayınlanmadıysa), Forcecage serbest boyut + Wind Wall yol kipi + Meteor Swarm nokta kipi:**
  - Değişecekler: `src/battle/zones.ts` (`castCageHexes`), `src/battle/forcecage.ts`, Forcecage `k65` bloğu, boyacının yol/nokta kipleri.
- **Panelli duvarlar (Wall of Stone/Ice/Force serbest panel yolu): öneri K66'ya.** Panel HP'si altıgen anahtarlı (`walls.ts`, K62 testleri), geometrisi değişince panel kimliği ve "kesilen yaratık itilir" yolu yeniden ele alınmalı.

**Riskler:**
- (a) Replay: sonuç olaylarda, belirlenimci; her testte `replay` denetimi.
- (b) Kayıt şeması: değişmez.
- (c) Mevcut büyü testleri (Fire Storm, Forcecage, Wind Wall, Meteor Swarm) sürüm ≤ 48'de aynen; 49 kolu ayrı test.
- (d) Kamera dokunuşu: dokunma ile sürükleme ayrımı `MapCamera`'nın `draggedFlag`'ine dayanır; boyacı dokunmayı yalnızca sürükleme olmadıysa alır (mevcut altıgen tıklama yolu).
- (e) Ana parça: boyacı `MapBattle` (tembel) parçasında, ana parça etkilenmez.
- (f) Denge: Fire Storm 91 → en çok 40 altıgen (zayıflar, ama hedefli). Denge ayarı yapılmaz, yalnız not.

## 8. Senin kararın gerekenler (öneri ilk sırada)

1. **Küp başına altıgen (Fire Storm):** 4 → 40 altıgen (öneri). Alternatifler: 3 → 30 (gövde geleneği), 7 → 70 (`area.ts` küp geleneği).
2. **Menzil ve görüş:** her altıgen menzilde, görüş yalnızca ilk altıgende (öneri). Alternatif: her altıgen görüşte (daha sıkı, ama duvar arkasına "yayılan fırtına" yapılamaz).
3. **Boyama girişi:** dokun-ekle/dokun-çıkar (öneri; mobilde kamera sürüklemesiyle çakışmaz). Alternatif: basılı tutup sürükle (kamera kilidi gerekir).
4. **Forcecage boyutu:** serbest bitişik küme, kutu ≤ 4 / çap ≤ 2, kafes ≤ 19 / çap ≤ 4 (öneri). Alternatif: yalnız hazır boyutlar (kutu 1/3/4, kafes yarıçap 0–2) ve yön.
5. **Parçalama:** K65a + K65b, panelli duvarlar K66 (öneri).
6. **YZ dost ateşi:** Fire Storm'da dost içeren küme hiç seçilmez (öneri). Alternatif: dost kaybı düşman kazancından küçükse kabul.

## 9. Test planı

**K65a, `src/battle/k65.test.ts`; her komutta `replay` denetimi:**
1. Sürüm 49:
   - 40 altıgenlik bağlı küme geçer, 41. reddedilir.
   - Bağlı olmayan küme reddedilir.
   - Tekrarlanan altıgen reddedilir.
   - Menzil dışı altıgen reddedilir.
   - Görüşsüz ilk altıgen reddedilir.
2. Kümedeki her yaratık bir kez DEX save atar, hasar bir kez atılır; kümenin dışındaki komşu etkilenmez.
3. Sürüm 48: aynı komut eski 25 ft küre davranışını verir (`targetHexes` yok sayılır).
4. YZ:
   - İki ayrık düşman grubunu bütçe yetiyorsa birleştirir.
   - Dost içeren kümeyi seçmez.
   - Bütçe yetmezse en kalabalık grubu alır.
   - Karar süresi sınırı (`sim:yz-sure` tek senaryo).
5. Arayüz yardımcıları (`freeShapeView`): aday altıgenler, çıkarma sonrası bölünme uyarısı, sayaç.

**Kenar durumlar:**
- Harita kenarı.
- Yaratık dolu altıgen (alan yaratığı kapsar, engel değil).
- Engel altıgeni (SRD: alan duvarla kesilmez; öneri: engel altıgeni boyanabilir ama orada yaratık yok).
- `multiHex` açıkken büyük gövdenin bir altıgeni kümede (yaratık etkilenir: `bodyInZone`).
- Boş küme ile "Onayla" kapalı.

**K65b:**
- Forcecage kutu/kafes sınırları ve tutsaklık (K62 testleri aynen).
- Wind Wall yol kipi.
- Meteor Swarm 4 nokta.
- Sürüm 48'de ön ayar.

**Doğrulama:** typecheck, ilgili testler, build, `check:harita`, `check:ses`, tam `npm test` görev sonunda; arayüz değiştiği için tek ekran görüntüsü.
