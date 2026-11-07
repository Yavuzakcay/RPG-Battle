# Kuyruk K66 — Earthquake kalanı: yarık ve yapı hasarı (PLAN)

Dal `wip/k66` (`wip/k65` 75ecc8b üzerinden, kural sürümü 49). Bu belge yalnızca plandır; kod, veri ve test değişmedi.

## 1. Mevcut durum

**Bugün yapılanlar (`data/spells-69.json` `earthquake`, `k61` bloğu, sürüm 44+):**
- 100 ft yarıçaplı alan (`area` küre 100 ft; 15×7 haritada bütün harita).
- Alan zorlu arazi (`zone.difficult: 2`), 10 tur, konsantrasyonlu.
- Dökümde (`on: ['cast']`) ve büyücünün her tur sonunda (`casterEnd`, `zones.ts` `casterEndZoneEvents`, `commands.ts` tur sonu) alandaki zemindeki her yaratık DEX save atar (`altitudeInZone`: uçan muaf). Başarısızlıkta Prone ve konsantrasyonu bozulur (`breakConcentration`).
- Sürüm 43 ve altında eski zamanlama: dökümde save yok, hedefin tur başında atar. Test: `k61.test.ts` "K61 Earthquake".

**Yapılmayanlar** (`M1-FARKLAR.md`'deki tek satır):
- Yarıklar: 1d6 yarık, 1d10 × 10 ft derin, 10 ft geniş, alanın bir kenarından ötekine; yarıktaki yaratık DEX save atar, başarısızsa düşer.
- Yapılar: yere değen yapılara dökümde ve büyücünün tur sonlarında 50 Bludgeoning; 0 HP'de yapı çöker; çöküş yakınındakilere save, 12d6, Prone, enkaz altında kalma.

**Yeniden kullanılabilir altyapı:**

| Parça | Nerede | Ne için |
|---|---|---|
| `tile_changed` olayı ve reducer | `reduce.ts` | Yarık zemini. Kalıcı ve replay güvenli; yeni olay türü gerekmez. |
| Zemin `u` "Uçurum, yarık" | `terrain.ts` | Yürüyen giremez, uçan geçer (`flyersPass`). Yarık altıgeni olarak hazır. |
| `lineFrom` düz hat ve `restore` | `terraform.ts` | Control Water hendeği. Yön hattı mantığı yeniden kullanılır. Yarık kalıcı olduğu için `restore` gerekmez. |
| `zone_created` (konsantrasyonsuz, süresiz alan) | `zones.ts` | Haritada yarığın görünümü (`.spell-zone` rengi/simgesi) ve yarık başına derinlik. Ana görsel arka plan resmidir; `tile_changed` yalnızca mini haritada görünür, bu yüzden görünüm alandan gelir. |
| `fallEffect` + `fallReactions` | `maprules.ts`, `reactions.ts` | SRD düşme (10 ft başına 1d6, en çok 20d6, Prone; Slow Fall ve Feather Fall tepkileri). |
| `altitude_changed` + `reachFt` | `altitude.ts` | Yaratık irtifası. Yarıktaki yaratık için eksi irtifa: erişim derinlikle kesilir. |
| `vertical_move` | `altitude.ts` | Yarıktan tırmanma için genişletilecek. |
| `damageObjectEvents` / `destroyEvents` | `objects.ts` | Nesneye 50 hasar ve yıkım. |
| `panelDamageEvents` | `walls.ts` | Wall of Stone/Ice panelleri (Force bağışık). |
| `objectAreaEvents` | `objects.ts` | Alan hasarını nesnelere ve panellere dağıtan mevcut yol. |
| Süren etki `escapeCheck` + `escape` komutu | `mapcommands.ts`; YZ `ai.ts` ~1626 | Enkazdan kurtulma: DC 20 Athletics. |
| `spell_followup` + `choice` | Delayed Blast boncuğu, Telekinesis | Yarık yerleştirme. |
| `casterEnd` tur sonu kancası | `commands.ts` 547 | Yarıkların açılması ve yapı hasarı aynı noktada. |
| `collapseFallEvents` | `climb.ts` | `u`'ya dönen altıgende yükseklik katmanlı haritada düşürür. Çift düşmeyi önlemek için dikkat gerekir (§5 riskler). |

## 2. SRD hedef davranışı (`data/srd/spells.json` earthquake, s. 127)

- **Alan ve süre:** 100 ft yarıçap, zorlu arazi, konsantrasyon (1 dk). Dökümde ve büyücünün tur sonlarında zemindeki herkes DEX save atar; başarısızsa Prone ve konsantrasyon bozulur. *Var.*
- **Yarıklar:**
  - Toplam 1d6 yarık, döküm turunun sonunda açılır.
  - Yerlerini büyücü seçer; yapı altına açılamaz.
  - Her biri 1d10 × 10 ft derin, 10 ft geniş, alanın bir kenarından ötekine uzanır.
  - Yarığın altıgenindeki yaratık DEX save atar. Başarısızsa düşer; başarılıysa yarığın kenarıyla birlikte kayar (düşmez).
  - Yarıkların kapanması tanımlı değil, yani kalıcı.
  - Metin "You can also cause the effects below" diyor: yarık ve yapı etkileri isteğe bağlı.
- **Yapılar:**
  - Dökümde ve büyücünün her tur sonunda yere değen her yapıya 50 Bludgeoning; 0 HP'de çöker.
  - Çöken yapıya yüksekliğinin yarısı kadar uzaklıktaki yaratık DEX save atar.
    - Başarısızsa 12d6 Bludgeoning, Prone ve enkaz altında; kurtulmak için eylemle DC 20 STR (Athletics).
    - Başarılıysa yarı hasar, başka bir şey yok.
- **Savaş haritasında "yapı" (koddan):**
  - Harita duvarları zemin harfidir (`s` duvar, `c` sütun, `m` direk, `O` kapalı kapı); canları yoktur.
  - Canı olan şeyler `map.objects` (`data/nesneler.json`) ve büyü duvarı panelleri (`walls.ts`).
  - Nesnelerden yapı sayılabilecekler: `door` (18 HP), `gate` (27), `tent` (13), `crackedWall` (30).
  - Yapı sayılmayacaklar:
    - `bridge`: yere değmez, kendi kuralı `bridgeBreak` var.
    - `statueEye`, `plaque`: bulmaca nesneleri.
    - `ballista`, `oilBarrel`, `powderKeg`, `chest`, `table`: eşya; yapı değil.
    - `tree`, `boulderPile`: doğa.
  - Wall of Stone ve Wall of Ice panelleri yapı sayılabilir (zemine kurulu taş/buz duvar). Wall of Force hasara bağışık, değişmez.

## 3. Tasarım

### 3a. Yarık (K66a)

- **Sayı ve yerleştirme:**
  - Dökümde 1d6 atılır. Sayı Earthquake alanında saklanır: `SpellZone.fissures: { count, planned: Line[], turn }`.
  - Büyücü aynı turda `spell_followup` `choice: 'fissure:<eksen><yan>'` + `targetHex` ile yarıkları yerleştirir. Eylem harcanmaz; sayı kadar.
  - Tur sonunda (`commands.ts` `casterEnd` noktasında, Earthquake save'lerinden önce) planlananlar açılır. Yerleştirilmeyenler yitirilir (SRD: isteğe bağlı).
- **Geometri:**
  - Seçilen altıgenden geçen düz eksen hattı (flat-top ızgarada 3 eksen), iki yönde alanın ya da haritanın kenarına dek.
  - 10 ft = 2 altıgen (K65 kararı): hattın seçilen yandaki paralel komşusu da eklenir. Bu yüzden 3 eksen × 2 yan = 6 seçenek.
  - Hattın tamamı alan (100 ft) ve harita içinde.
- **Dönüşen altıgenler:**
  - Yalnızca yürünebilir zemin `u`'ya döner.
  - Duvar, engel, su, lav, nehir ve zaten uçurum olan altıgen değişmez (yarık oradan geçer, iz bırakmaz).
  - Yapı nesnesi ya da panel altıgeni içeren hat reddedilir: "Yarık yapı altından geçemez".
- **Kalıcı veri:**
  - `tile_changed` (`→ 'u'`) her altıgen için.
  - Ayrıca süresiz, konsantrasyonsuz `zone_created` (`spellId: 'earthquake:fissure'`, `fissure: { depthFt }`). Derinlik yarık başına 1d10 × 10 ft.
  - Alan büyü bitince kalır (konsantrasyon bağı yok). Görünüm: koyu renk, ⚡ benzeri simge, kenar.
- **Açılışta yarıktaki yaratık** (uçan muaf):
  - DEX save (büyücünün DC'si).
  - Başarısızsa düşer: `fallEffect(depthFt)` + `fallReactions`, Prone, `altitude_changed` ile `altitudeFt = −depthFt`.
  - Başarılıysa en yakın boş, yarık olmayan altıgene `moved` (fırsat saldırısı yok). Böyle altıgen yoksa düşer.
- **Yarıktaki yaratık:**
  - `altitudeOf` eksi değer döner. `reachFt` = max(yatay, |irtifa farkı|), yani yüzeyden yakın dövüşle erişilmez.
  - Görüş değişmez (sadeleştirme).
  - Tırmanma: `vertical_move` (yarıkta, uçmayan) yukarı. Maliyet tırmanma kuralıyla 2 × ft; Atletizm yok (SRD tırmanma zar istemez).
  - 0'a ulaşınca komuttaki `to` ile bitişik boş zemine çıkar. Bu komuta yeni isteğe bağlı alan; yeni komut türü değil.
  - Uçan yaratık yarığın üstünden geçer (`flyersPass`). Yarıktaki uçan yaratık `vertical_move` ile normal uçarak çıkar.
- **Sonraki tur sonları:**
  - Yarığın dibi "zemin" sayılır: Earthquake save'i oradakileri de kapsar (öneri 13).
  - Yeni yarık açılmaz (yalnızca döküm turu).
- **Zorla hareket:** zorla hareket bugün engel altıgende durur (değişmez); yarığa itme ile düşme açık kalır (§6 öneri 15).

### 3b. Yapı hasarı (K66b)

- **Veri:** `data/nesneler.json` türlerine `yapi: { yukseklikFt }` alanı. door 10, gate 15, tent 10, crackedWall 10. Panellerde 10 ft (SRD panel boyu).
- **Hasar:**
  - Dökümde ve `casterEnd`'de alandaki her yapıya 50 Bludgeoning, yalnızca Earthquake'in kendi alanı için.
  - Nesneye `damageObjectEvents`, panele `panelDamageEvents`.
  - Sonuç: Ice paneli ilk vuruşta kırılır (donuk hava perdesi, K62). Stone paneli (90 HP) ikinci tur sonunda kırılır. Force bağışık.
- **Çöküş** (0 HP; mevcut `object_destroyed` / panel kırılması):
  - Yarıçap = yükseklik / 2 → altıgen ⌊ft / 10⌋, en az 1 (10–15 ft = bitişik).
  - Çevredeki yaratıklar DEX save atar.
    - Başarısızsa 12d6 Bludgeoning, Prone ve enkaz etkisi `buried`: süren etki, `speedZero` + `escapeCheck { dc: 20, skill: 'athletics' }`, Restrained yok (öneri 11). Mevcut `escape` komutu ve YZ yolu.
    - Başarılıysa yarı hasar.
  - Çöken nesnenin altıgeni `tile_changed → 't'` (Taşlık, zorlu; enkaz).
- **Yeni olay türü yok:** `object_damaged` / `object_destroyed` / `map_effect` / `save_resolved` / `effect_applied` / `tile_changed`.

### 3c. Arayüz

- Earthquake dökümünden sonra balon: "Yarık: 2/4 yerleştirildi".
  - Altıgene dokun → 6 yön/yan düğmesi (mevcut yön okları gibi) → önizleme (dönüşecek altıgenler, içindeki yaratıklar dost/düşman sayısıyla).
  - "Yarığı aç" komutu gönderir (tur sonunda açılır). "Bitir" kalanları bırakır.
- Haritada yarık alanı görünümü. Rozetler "Yarıkta −40 ft" ve "Enkaz altında" (`efekt-baglama.json` `rozet`).
- Yarıkta "Tırman" düğmesi (`vertical_move`).
- Yapı nesnesi kartında can, Earthquake önizlemesinde "yapılar: 50 hasar".
- TR/EN metinler.

### 3d. Yapay zekâ

- **Yarık yerleştirme** (kural `k66:yarik`, Earthquake'i yapan YZ'nin döküm turunda, tur bitmeden):
  - 6 seçenek × aday altıgenler (düşman altıgenleri ve komşuları) arasından en çok düşmanı kesen, hiç dost/masum altıgeni içermeyen, yapı altından geçmeyen hatlar seçilir.
  - Açgözlü, sayı kadar; değer düşük kalırsa (0 düşman) yerleştirmez.
- **Yarıktan çıkma:** yarıktaki YZ önce tırmanır (`vertical_move` + `to`). Erişemediği hedef yoksa menzilli saldırı mevcut yoldan.
- **Enkaz:** mevcut `escape` yolu (`ai.ts` ~1626).
- **Yarığa düşmekten kaçınma:** yürüyen için `u` zaten geçilmez (yol bulma). Ek kaçınma gerekmez. Açılış save'i önceden bilinmez; YZ büyücüye mesafe almaz (öneri dışı).
- **Yapı yıkma:** Earthquake değerlendirmesine çöküş yarıçapındaki düşman sayısı eklenir (puan). YZ yapıya ayrıca saldırmaz.
- **Karar süresi:** 15×7, 8 düşman, `chooseCommand`; sürüm 49 ve 50 ölçülür.

## 4. Sürüm kapısı

- Büyü verisinde yeni `k66` bloğu, `>= 50`: `mechanicsAt`, `castSpell` `LATER`, `scripts/lib/buyu-durum.mjs` BLOCKS/BLOCK_VER.
- `data/kural-surumu.json` 50; `ruleVersion.test.ts` / `g6.test.ts` 49 → 50 (veriye bağlı, gerekçe commit'te).
- 49 ve altında `fissures`/`yapi` yok sayılır, `vertical_move` yarık dalı kapalı: bugünkü davranış aynen.
- K66b, K66a ile aynı sürümde (50) kalır; 50 yayınlanmadıysa K65 düzeni.
- `SAVE_VERSION` 22 kalır (yeni olay türü yok; yeni alanlar isteğe bağlı).

## 5. Parçalama, dosyalar, riskler

**Öneri:** iki kuyruk. K66a yarık (büyük: geometri, düşme, irtifa, tırmanma, seçici, YZ). K66b yapı hasarı (küçük: veri + hasar + çöküş + enkaz).

**K66a dosyaları (tahmini):**
- Veri: `data/spells-69.json` (`k66` bloğu; `text` dokunulmaz), `data/kural-surumu.json`, `data/yz-roller.json` (`k66:yarik`), `data/efekt-baglama.json` (rozet).
- Motor:
  - `src/data/types.ts` (`SpellZone.fissure*`, `vertical_move.to`).
  - `src/battle/fissure.ts` (yeni: geometri, doğrulama, açılış, YZ hattı), `spellVersion.ts`, `spells.ts`, `commands.ts` (tur sonu kancası), `altitude.ts` (eksi irtifa, tırmanma), `climb.ts` (çift düşme koruması), `ai.ts`.
  - `terraform.ts`: `lineFrom` paylaşımlı yardımcıya taşınırsa davranış aynen.
- Arayüz: `ui/hud.ts`, `MapBattle.tsx`, `i18n/strings.tr2.ts` / `strings.en.ts`.
- Betik: `scripts/lib/buyu-durum.mjs`.
- Test: `src/battle/k66a.test.ts`.
- Belgeler: DECISIONS, CLAUDE.md, M1-FARKLAR, BUYU-DURUM.

**K66b dosyaları (tahmini):**
- `data/nesneler.json` (`yapi`), `objectData.ts` (tip), `src/battle/quakeStructures.ts` (yeni), `walls.ts` (hasar yolu aynen kullanılır), `commands.ts`, `ai.ts` (puan), metinler, `k66b.test.ts`, belgeler.

**Riskler:**
- **Replay:** her şey mevcut olaylarla; zar sırası (1d6 sayı, derinlikler, save'ler) sabit sırada atılmalı. `run` her testte denetler.
- **Çift düşme:** `collapseFallEvents` `u`'ya dönen altıgende yükseklik katmanlı haritada düşürüyor. Yarık açılışı kendi düşmesini yapar; bu yaratıklar `handled` sayılmalı (`bridgeBreak` gibi) ya da yarık olayları ondan önce işlenmeli.
- **Eksi irtifa:**
  - `altitudeFt > 0` varsayan yerler: düşüş komut sonu, Levitate, `altitudeInZone`, alan tepe yüksekliği. Hepsi sürüm 50 + `fissure` koşuluyla gözden geçirilir.
  - Reducer `altitudeGentle` yalnızca > 0'da; eksi değer onu temizler, sorun yok.
- **Yol bulma ve YZ:** 2 altıgen genişlikli yarık haritayı ikiye bölebilir. Yürüyen YZ hedefe yol bulamazsa var olan geri dönüş (yaklaş/bekle) kullanılır; sıkışma duman testinde izlenir.
- **Önbellek:** derin su önbelleği (`deepWater.ts`) ve hareket maliyeti önbellekleri zemine göre anahtarlanmalı. `tile_changed` ile geçersizleştiğinden emin olunacak (Passwall'da çalışıyor).
- **Control Water / Passwall testleri:** `terraform.ts` davranışı değişmez. `lineFrom` taşınırsa aynı çıktı (mevcut testler).
- **Duvar/nesne testleri:**
  - K62 Wall of Ice, K19 Wall of Stone panel ve `attack_object` testleri aynen; yapı hasarı yalnızca Earthquake'ten.
  - Kapı yıkımı mevcut `destroyEvents` ile. K66b'de enkaz `t` yalnızca deprem çöküşünde.
- **Kayıt şeması:** yeni alanlar isteğe bağlı. Sürüm 49 kayıtları alanları görmez.

## 6. Senin kararın gereken maddeler (öneriyle)

1. **Yarık biçimi:** seçilen altıgenden geçen düz eksen hattı, kenardan kenara (6 seçenek). Alternatif: K65 serbest yol seçicisi. **Öneri: düz eksen** (SRD "bir kenardan ötekine"; seçici basit).
2. **Genişlik:** 2 altıgen (K65: 10 ft = 2 altıgen). Alternatif: 1 altıgen (küçük haritada daha az yıkıcı). **Öneri: 2.**
3. **Sayı:** 1d6 en fazla; büyücü 0…N arası yerleştirir, yerleştirmediği yitirilir. **Öneri: evet** (SRD isteğe bağlı).
4. **Dönüşen altıgenler:** yalnızca yürünebilir zemin. Duvar, su, lav, nehir aynen; yapı içeren hat reddedilir. **Öneri: evet.**
5. **Kalıcılık:** yarıklar büyü bitince de kalır. **Öneri: kalıcı** (SRD kapanma tanımlamıyor).
6. **Yarıktaki yaratık:** eksi irtifa (`altitudeFt`). Erişim derinlikle; görüş değişmez. **Öneri: evet** (sadeleştirme DECISIONS'a).
7. **Tırmanma:** `vertical_move` ile 2 × maliyet, zarsız, 0'da bitişik zemine çıkış. Alternatif: Atletizm DC (ör. 15). **Öneri: zarsız** (SRD tırmanma).
8. **Başarılı save:** en yakın boş kenar altıgenine kayar; yer yoksa düşer. **Öneri: evet.**
9. **Yapı tanımı:** `door`, `gate`, `tent`, `crackedWall` + Wall of Stone/Ice panelleri. Harita duvar harfleri, köprü, bulmaca nesneleri, eşya ve ağaç hariç. **Öneri: evet.** Haritaya veriyle yapı (`yapilar`) eklemek sonraya.
10. **Yükseklik değerleri:** door 10, gate 15, tent 10, crackedWall 10, panel 10 ft (çöküş yarıçapı bitişik). **Öneri: evet.**
11. **Enkaz altında:** hız 0 + Prone + DC 20 Athletics ile kurtulma; Restrained yok. **Öneri: evet** (SRD yalnızca "buried").
12. **Enkaz zemini:** çöken nesnenin altıgeni Taşlık (`t`, zorlu). **Öneri: evet.**
13. **Yarık dibindekiler** Earthquake tur sonu save'ine girer (dip de zemin). **Öneri: evet.**
14. **multiHex açıkken:** gövdenin herhangi bir altıgeni yarıktaysa save; düşen yaratığın merkezi yarık altıgenine. **Öneri: evet.**
15. **Yarığa zorla itme** (Thunderwave vb.): K66'da yok (itme engelde durur), açık madde. **Öneri: açık bırak.**
16. **Parçalama:** K66a yarık + K66b yapı, ikisi de sürüm 50. **Öneri: evet.**

## 7. Test planı

**K66a:**
- **Başarı:**
  - Dökümde 1d6 sayısı alana yazılır.
  - İki yarık yerleştirilir, tur sonunda açılır: altıgenler `u`, yarık alanı derinlikle, büyü bitince yarık kalır.
  - Yarıktaki düşman save'i başarısız: düşme hasarı (derinlik/10)d6, Prone, irtifa −derinlik.
  - Başarılı save: kenara kayar, hasar yok.
  - Uçan yaratık etkilenmez.
- **Kenar durumlar:**
  - Yapı altından geçen hat reddi.
  - Sayıdan fazla yerleştirme reddi; döküm turundan sonra yerleştirme reddi.
  - Duvar/su altıgeni değişmez.
  - Kenarda boş yer yoksa başarılı save'de bile düşer.
  - Feather Fall / Slow Fall tepkisi.
  - Yarıktaki yaratığa yüzeyden yakın dövüş erişimi yok.
  - Tırmanma maliyeti ve 0'da çıkış; uçan yaratık yarık üstünden geçer.
  - Yükseklik katmanlı haritada çift düşme yok.
  - Yerleştirilmeyen yarık yitirilir.
- **Sürüm 49:** aynı komutlar (followup) reddedilir ya da yok sayılır; Earthquake K61 gibi (mevcut `k61.test.ts` aynen).
- **YZ:** dostsuz, en çok düşmanı kesen hat; komut geçerli; karar süresi ölçümü.
- **Replay:** her testte `run`. Önizleme ve seçici motorla aynı ileti.

**K66b:**
- **Başarı:** dökümde kapıya 50 → yıkılır, enkaz `t`; bitişikteki düşman save'i başarısız: 12d6, Prone, `buried`; `escape` DC 20 ile kurtulur.
- **Kenar durumlar:**
  - Kafes (gate, 27 HP) ilk vuruşta yıkılır; çadır.
  - Wall of Stone paneli ilk vuruşta 40'a iner, büyücünün tur sonunda yıkılır.
  - Wall of Ice paneli kırılır, donuk hava perdesi; Wall of Force etkilenmez.
  - Alan dışındaki yapı etkilenmez.
  - Başarılı save'de yarı hasar, `buried` yok.
  - Konsantrasyon bitince tur sonu hasarı durur.
- **Sürüm 49:** yapı hasarı yok (mevcut nesne ve panel testleri aynen).
- **YZ:** Earthquake puanında çöküş yarıçapındaki düşmanlar; enkazdaki YZ `escape` dener.

**Her iki parça:** typecheck, ilgili testler, build, check:harita, check:ses; tam paket sonda bir kez; ana parça ≤ 420 kB.
