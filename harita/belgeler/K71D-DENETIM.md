# K71d denetimi: katman (layer) ile irtifa birlikte (Görev 0)

Taban `wip/k71c` bd7775e, kural sürümü 58. Kuyruk K71d (sürüm 59) katman ile irtifayı tek "mutlak yükseklik" altında birleştirir, K8 (yüksek zemin) ve K9 (zemin terimli uzaklık) kararlarını ve tepedeki okçu görüşünü getirir.

**Katmanlı haritalar (9):** buzul-acik, buzul-kamp, buzul-kayalik, buzul-tapinak, dag-karakol, dag-kayalik, dag-kopru, dag-nobetci, kale-taht-salonu.
- Seviye aralığı −3..+3; rampa listesi boş (geçişler zeminin `l` basamağıyla).
- Bitişik altıgen çiftleri: 1 seviye farkı 385, 2+ seviye (uçurum, çukur) 477.
- Regresyon senaryoları (Çöl, Kale, Mağara, Orman) ve duvarlı 6 harita katmansız: K71d onlara dokunmaz.

**Bugünkü sözleşme:**
- `altitudeFt` yaratığın **kendi altıgeninin zemininden** ölçülür.
- Katmanlı haritada zemin = `heightAt` × `levelFt`. `levelFt` 10, Game Master `heightFall` parametresi.
- `vertical.ts` `zeminFt` zemini verir: sürüm 56+, yalnız katmanlı haritada.

## Mutlak yükseklik önerisi (tek tanım)

- **Tanım:** yaratığın yüksekliği = bulunduğu altıgenin zemin/katman yüksekliği + irtifa.
  - Tek işlev `vertical.ts` `mutlakFt(state, c, at = c.pos, alt = irtifa)` = `zeminFt(state, at)` + `alt`.
  - Katmansız haritada zemin 0 olduğundan mutlak = irtifa; o haritalarda hiçbir şey değişmez.
- **İrtifa yine göreli kalır:** kayıt, komut ve olay biçimi aynı; `SAVE_VERSION` 22.
  - Uçan katmanlı haritada irtifayı kendi altıgeninin zemininden sayar: yatay uçuşta mutlak yüksekliği araziyi izler.
  - Uçuş üst sınırı (`ucusUstFt`) ve tavan (`tavanFt`, altıgen tavanı) aynı zeminden ölçülür. Bugün de öyle; değişmez.
- **Mutlak bant:** `bandOf(c, mutlakFt)`. Hücre (düzey) çözücüsü aynı altıgende göreli bantla çalışır; aynı altıgende zemin ortak olduğundan sonuç aynıdır.
  - Altıgenler arası karşılaştırmalar (erişim, fırsat saldırısı, YZ vuruş yeri) mutlak bantla yapılır.
- **Game Master anahtarlarıyla kapsam (sürüm 59+):**
  - K9 uzaklıktaki zemin terimi ve katman tırmanışı `heightMove`.
    - Katman fiziksel: anahtar kapalıyken uçurum yürünür, uzaklıkta zemin terimi de yoktur.
  - K10 görüşteki zemin `heightSight`. K68c/K71a'da da öyle.
  - K8 yüksek zemin `heightCombat`.
  - Düşme hasarı `heightFall`.

## Alan alan

Karar dili:
- **59:** sürüm 59'da değişen.
- **aynı:** değişmeyen.
- **açık:** sonraki kuyruğa kalan (K72 / K73).

| # | Alan | Dosya / işlev | Bugün (58) | 59 kararı |
|---|---|---|---|---|
| 1 | Katmanlı haritada uçan | `heightStepFn` muaf; `airMove.ts` düzeyleri göreli | İrtifa altıgen zemininden; görüş zemin + göz (yalnız biri havadayken) | **aynı:** göreli irtifa, araziyi izleyen uçuş. Mutlak yükseklik görüşte, erişimde ve yüksek zeminde tek işlevden |
| 2 | Katman geçişi (1 seviye) | `movement.ts` `heightStepFn` | Çıkış 1 + `levelCost` × fark; rampa normal | **aynı** (yürünür basamak soyutlaması); tırmanma sayılmaz |
| 3 | Uçurum tırmanışı (`climb`) | `climb.ts` `executeClimb` | 57+: Çeviklik DC 10 (kaba), maliyet 1 + `levelCost` × seviye × 2; başarısızsa bütün maliyet yanar | **59:** SRD: 1 altıgen + tırmanılan her 5 ft için yüzey çarpanı (kaba ×2; zorlu arazili varışta ×3). Zar ve yanma K71b iç işleviyle aynı (yalnız ilk 5 ft yanar). Tırmanılan ft mutlak farktan |
| 4 | Aşağı atlama (`climb` aşağı) | `climb.ts` | Seviye farkı × `levelFt`; irtifa yok sayılır | **59:** düşülen = başlangıç mutlak − varış zemini (irtifa dahil), tek `fall` |
| 5 | İtmede katman kenarı | `forced.ts` `pushOutcome` | Seviye farkı kadar düşme; irtifadaki tırmanıcı komut sonunda ikinci kez düşer | **59:** seviye farkı + irtifa tek düşme, irtifa 0'a; çift hasar yok |
| 6 | Zemin çökmesi | `climb.ts` `collapseFallEvents` | Katman dibine (en az 30 ft) düşme; irtifa yok sayılır | **59:** düşme + irtifa tek `fall`, irtifa 0'a |
| 7 | Havadan düşüş (komut sonu) | `altitude.ts` komut sonu | İrtifa kadar (göreli) | **aynı:** göreli irtifa zaten mutlak − kendi zemini |
| 8 | Görüş (iki uç yerde) | `cover.ts` `endsOf` | Hızlı yol: 2B kod (seviye sırtı `heightSightBlock`, kenar siperi `ledgeCover`) | **59:** katmanlı haritada iki uç farklı zeminde ya da yol üstünde daha yüksek zemin varsa K10 çekirdeği (`evaluateAlt`: zemin + göz + engel tepesi). Aynı zemin ve yolda yüksek altıgen yoksa hızlı yol aynen |
| 9 | Görüş (biri havada) | `evaluateAlt` | Zemin + göz; sırt geometrik; kenar siperi 2B | **59:** kenar siperi geometrik: göz–göz hattı açık ama gözden hedefin ayağına hat zeminde kesiliyorsa yarım siper ("kaya basamağı") |
| 10 | Hedefleme uzaklığı | `altitude.ts` `reachFt` | max(yatay, göreli bant aralığı) | **59 (K9):** max(yatay, mutlak bant aralığı) |
| 11 | Menzil eki (yüksekten) | `heights.ts` `rangeBonusFt` | 2+ seviye fark | **59:** iki uç yerde ve mutlak zemin farkı ≥ 20 ft |
| 12 | Fırsat saldırısı | `features.ts` `leavesReach` | 3B yol yalnız biri havadayken; zemin yok sayılır | **59:** katmanlı haritada her zaman 3B, mutlak bantla |
| 13 | Yüksek zemin | `cover.ts` `heightOf`, `rules/conditions.ts` | Katman seviyesi farkı (her fark); uçanın irtifası yok sayılır | **59 (K8):** mutlak zemin farkı ≥ 10 ft; yalnız iki uç yerdeyken (irtifa 0); uçan, tırmanan ve yarıktaki sayılmaz |
| 14 | Alan büyüsünün dikey kapsamı | `altitude.ts` `areaReachesAltitude` | Yaratığın irtifası ile alan boyu | **59:** fark = yaratığın mutlak yüksekliği − alan çıkış altıgeninin zemini; küre/küp/koni boyut, çizgi 5 ft, silindir tabandan yukarı |
| 15 | Kalıcı alanlar (bulut, yüzey) | `altitudeInZone` | Altıgen başına göreli | **aynı:** alan her altıgenin zeminine yayılır |
| 16 | Hücre çözücüsü | `cells.ts` `fillsBand` | Göreli bant | **aynı:** aynı altıgende zemin ortak (test edildi) |
| 17 | Tavan ve üst sınır | `altitudeCapFt`, `ceilingFt` | Altıgen zemininden | **aynı** |
| 18 | YZ yol bulma | `ai.ts` `reachable`, `airSpots`, `climbToward` | Yürüme `moveCostFn` (katman adımı); vuruş yeri `bestNow` kuru çalıştırması; uçan `strikeAt` göreli bant | **59:** `strikeAt` mutlak bant; `climbToward` yeni maliyeti `tryCmd` ile; menzilli yüksek zemin tercihi uçanda yok. Yeni taktik yok |
| 19 | Arayüz | `MapBattle.tsx`, `ui/mapView.ts` | Uçurumda "⇡DC12" (`heightMove.climbDc`); hedef bilgisinde "yüksekten: avantaj" seviye farkıyla | **59:** uçurumda gerçek DC ve maliyet. Yüksek zemin satırı K8 sonucuyla ve ft farkıyla, TR/EN tek satır |
| 20 | Kayıt | `battleSave.ts` | Göreli irtifa | **aynı:** yeni olay/alan yok; `SAVE_VERSION` 22 |
| 21 | Bitişiklik eylemleri | Grapple, Shove, Help, otomatik kritik `withinFiveFt` | 2B `gap` | **açık** (K73): 2B kalır |
| 22 | Aura | `auraCore`, Spirit Guardians | 2B | **açık** (K73) |
| 23 | Canavar nefesi, Dragonborn alanı | `areaAttack.ts` `pickArea` | İrtifaya hiç bakmaz (K68 açığı) | **59:** büyüyle aynı dikey kapsam (#14) |
| 24 | Çok altıgen | `bodyAt` | Gövde farklı zeminli altıgenlere yayılabilir; bant çapanın zemininden | **açık:** multiHex varsayılan kapalı |
| 25 | Klasik harita zemin yüksekliği | `terrainAt().height` (H, h, z) | Yüksek zemin her sürümde, anahtarsız, uçan dahil | **aynı** (K8 yalnız katmanlı haritada); ⚠ açık |

## Çelişkiler (bugün, sürüm 58)

1. **Erişim göreli, görüş mutlak:**
   - Bir uçurumun dibindeki yaratık 20 ft yukarıdaki (2 seviye) bitişik yaratığa 5 ft erişimle yakın dövüş yapar.
   - Görüş hattı ise o iki yaratığı 20 ft ayrı çizer.
2. **Görüşte süreksizlik:**
   - İki uç yerdeyken 2B kural çalışır (seviye sırtı, kenar siperi).
   - Biri 5 ft havalanınca geometrik kural çalışır (zemin + göz).
   - Aynı konumda sonuç değişebilir: platonun bir altıgen gerisindeki okçu, uçurum dibindekini 2B'de yarım siperle görür; geometride göremez.
3. **Yüksek zemin uçanı yanlış sayar:**
   - Alçak altıgen üstünde 30 ft'te uçan, platodaki hedefe "alçak zemin dezavantajı" alır.
   - Plato altıgeninin üstündeki uçan ise aşağıdakine avantaj alır.
   - İkisinde de irtifa yok sayılır.
4. **Yüksek zemin seviyeyle, ft'siz:** `levelFt` 5'e indirilse de 1 seviye (5 ft) avantaj verir. PLAN K8: ≥ 10 ft.
5. **İki tırmanma maliyeti:**
   - Katman tırmanışı soyut (1 + seviye × 2). Duvar tırmanışı (K71b) ft başına.
   - 20 ft'lik uçurum 5 altıgen tutar. Aynı yükseklikteki duvar 8 altıgen tutar.
   - Başarısız zarda katmanda bütün maliyet yanar, duvarda yalnız ilk 5 ft.
6. **`climb` irtifayı yok sayar:** duvarda tutunan (irtifa > 0) Çeviklik tırmanıcısı katman adımı atarsa irtifa korunur. Ya yanlış mutlak yükseklik olur ya da komut sonunda ikinci düşme.
7. **İtmede çift düşme:**
   - Duvarda (irtifa 10 ft) tırmanan, katman kenarından itilirse önce seviye farkı kadar düşer.
   - Komut sonunda tutunacak yüzey yoksa irtifası kadar bir kez daha düşer: iki hasar zarı, iki Prone olayı.
8. **Çökme aynı:** irtifadaki tırmanıcı çöken altıgende iki ayrı düşme alabilir.
9. **Arayüz DC'si yanlış:** uçurum altıgeninde "⇡DC12" yazar (`heightMove.climbDc`). Sürüm 57+'da zar Çeviklik DC 10'dur (`katmanUcurum` = kaba).
10. **Alan büyüsü katmanı yok sayar:** alçak zemindeki 20 ft yarıçaplı Fireball, 30 ft yukarıdaki platodaki yaratığı da yakar (görüş açıksa). Dikey kapsam yalnız irtifaya bakar.
11. **Canavar nefesi irtifaya bakmaz** (K68 açığı): 60 ft'teki uçan da 15 ft konide.
12. **Fırsat saldırısı:** katmanlı haritada yerdekiler 2B ölçülür. 2 seviyelik basamak boyunca yürüyen, 20 ft yukarıdakinin erişiminden "çıkmaz", çünkü zaten 2B'de içindedir.
13. **Kenar siperi yorumu ile kod uyuşmuyor** (`heights.ts`):
    - Yorum: "saldırandan yüksek değil".
    - Kod: `saldıran ≤ kenar`. Pratikte yalnız "kenar = saldıranın seviyesi" durumunda işler; daha yüksek kenar zaten sırttır.
    - Sürüm 59'da geometrik kural yerine geçer; eski sürümler aynen.
14. **Klasik haritada yüksek zemin (H, h, z):** anahtarsız ve ft'siz; uçan da sayılır. K8 yalnız katmanlı haritada uygulanır; klasik haritalar ve onların dengesi aynen (açık).
15. **Çok altıgen katmanlı haritada:** gövdenin bir kısmı daha yüksek zeminli altıgendedir, bant ise çapanın zemininden. multiHex varsayılan kapalı (açık).

## Sürüm 59 dışı (değişmeyen)

- Katmansız haritalar: mutlak = irtifa, bütün yollar 58 ile aynı.
- Katmanlı haritada iki uç aynı zeminde ve yolda daha yüksek zemin yoksa görüş, siper ve yüksek zemin 58 ile aynı (2B hızlı yol).
- Yürüme maliyeti (1 seviye basamak), rampa, aşağı itme kuralı (yalnız irtifa eklenir), yüzme ve derin su aynı.
