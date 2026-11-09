# K73a denetimi: YZ'nin dikey kararları (kural sürümü 61 tabanı)

Durum: `wip/u1a` 58c6227 (sürüm 61). K73a'nın çıkış noktası: YZ'nin bugün dikeyde ne yaptığı, parti YZ'sinin neyi yapmadığı,
Buzul — Kamp kilitlenmesinin kök nedeni ve çelişkiler. Değişiklikler ve kararlar DECISIONS.md "Kuyruk K73a" girdisinde.

## 1. Bugünkü dikey kararlar

| Karar | Yer | Kim | Davranış |
|---|---|---|---|
| Uçanın yer/düşük düzey seçimi (K71c) | `ai.ts` `airSpots`, `airLowSpots`, `strikeAt` | Yalnız düşman (parti ve çağrı hariç) | Havadaki uçan yakın dövüş için yer ya da "düşük" düzeye (yerdekilerin boyunun hemen üstü) iner. Yerdeki uçan, yerden saldıramazsa düşük düzey yerlerine çıkar. Yakın dövüşü olmayan uçanın hava yeri yok. |
| Seyir (K71c) | `cruiseMove` | Yalnız düşman | Yerden ve düşük düzeyden yaklaşamıyorsa en çok 30 ft'te uçarak yaklaşır. |
| Uçan boss (Kuyruk 33) | `bossFlightMove` | Efsanevi uçan | Eylemden sonra yerdeki düşmanların erişiminden kalkar (tercihen lav üstü). |
| Kendine Fly (S1) | `flyToReach` | Parti | Yürüyerek hiçbir düşmana yetişemiyor, uçarak yetişebiliyorsa Fly büyüsü. Özellik uçuşları (Draconic Flight, paket `ucus`) yok. |
| Uçurum tırmanışı (K17, K71d) | `climbToward` | Herkes | Yaklaşma yeri yoksa yaklaştıran, daha yüksek komşu uçuruma `climb`; SRD maliyeti yetmezse yüzde yükselir. |
| Duvar tırmanışı (K71b, K15) | `ai/climbAi.ts` `wallClimbCommand` | Çeviklik tırmanıcısı | Duvarsız yol yoksa ya da tırmanma yolunun iki katıysa duvara tırmanır, öte yana geçer. Sur tepesinde durma yok. |
| Kat (K72) | `floorRoute` | Uçmayan | Yalnız bütün düşmanlar başka kattaysa merdivene yürür, merdivende kat değiştirir. |
| Yüksek zemin (Y1 G2, K26) | `decide` `lift`, `moveToward` | Menzilli, yerde | Saldırı yeri puanında katman seviyesi başına 1 maliyet indirimi (`heightAt`). K8'in mutlak yükseklik farkı (≥ 10 ft) ve sur/kat duruş yüksekliği bakılmaz. |
| Vuruş yeri (K71d K9) | `strikeAt` mutlak bant | Uçan düşman | 3B erişim mutlak bantla. |
| Süzülme (U1a) | `paket` aday üreteci | Paket düğmesi olan | Geçerli komut olarak tanınır; değerlendirici puanı düşük, kullanılmaz. |
| Risk (U1a) | `risk` | Herkes | Süzülen yer yüzeylerine açık sayılır. |

## 2. Parti YZ'sinin yapmadıkları

1. **Hava düzeyi seçmiyor.** Fly'lı büyücü 0 ft'te kalır, yerdeki yakın dövüşçü ona yetişir. `airSpots`/`airLowSpots`/`cruiseMove` partiye kapalı.
2. **Uçuş süresi bitmeden inmiyor.** Kısa süreli uçuş, Kırık Kanat ve konsantrasyon kaybında düşme hasarı riski. Bugün parti zaten yükselmediği için pratikte görünmüyor.
3. **Özellik uçuşlarını açmıyor.** Draconic Flight ve paket `ucus` düğmeleri yürüyerek yetişilemeyen hedefe karşı kullanılmıyor (yalnız Fly büyüsü).
4. **K8 yüksek zemin aramıyor.** Puan katman seviyesine bakıyor; sur tepesi ve kat yüksekliği yok.
5. **Sur tepesine çıkmıyor.** `climbToward` yalnız katman yüksekliği artan komşuya bakar. Sur tepesi aynı katman seviyesinde olduğu için elenir.
6. **Kat seçimi kaba.** Aynı katta tek bir düşman varken, en yakın hedef başka katta olsa da merdivene gitmez.

## 3. Buzul — Kamp kilitlenmesi (tohum 1, K26 kuralları açık, 3. seviye)

**Yeniden üretim:** `simulate(k29-buzul-kamp, 1, 20, 3)`, `setDefaultRuleToggles(K26_RULES açık)`. Sürüm 59, 60, 61'de 21 turda zaman aşımı. Süreç geçmişine bağlı değil. Tek başına koşu ilk denemede 8 turda bitti ama nedeni günlük döngüsündeki fazladan bir `end_turn` çalıştırmasıydı (paylaşılan zarlardan sayı tüketir); `playBattle`'la birebir döngüde tek başına da zaman aşımı.

**Tur tur günlük (sürüm 61, 13.–20. tur):**
- Parti okçuları pc4 (Shortbow) ve pc1 (Light crossbow) her tur 2. katmandaki keşifçilere (scout-2, 19,0) ve haydutlara uzaktan atış yapıyor; çoğu ıska.
  - Nedenler: uzun menzil, kenar siperi, yüksek zemin (K8). Ayrıca dondurucu soğuktan (`coldExposure`) bitkinlik 2 → d20 −4, hız −10 ft.
- pc3 (Tavi, Cleric, Sacred Flame 60 ft): 13–15. ve 18–20. turlarda **hiçbir şey yapmadan `end_turn`**; 16–17. turlarda cebe girip çıkıp iyileştirme.
- Düşman keşifçisi yükseklikten pc1'e atış yapıyor, o da ıskalıyor. İki taraf da öldüremiyor. 20. turda keşifçi 2 HP'de.

**Kök neden: açgözlü yaklaşma, yerel minimum.** `decide`'ın "yaklaş" adımı (`nearest`) düz altıgen mesafesini (`gapFrom`) kısaltan yeri arıyor.
- Tavi ağaçların ardındaki cepte (6,7; kuzey ve doğu ağaç: `aaaa`, `aaa`).
- Bitkinlikle 4 altıgenlik bütçede ulaşabildiği yerlerin hiçbiri en yakın düşmana düz mesafeyi 11'in altına indirmiyor: çıkış batıdan dolanıyor (Python denetimi: 11 yerin en iyisi 11).
- `climbToward` ve `cruiseMove` de bir şey bulamıyor. Sonuç: her tur `end`.
- Menzile giremeyen tek büyücü olduğu için savaş okçuların düşük isabetiyle sürüyor.

**İkincil etkenler (kilitlenme değil, uzama):**
- Soğuktan bitkinlik birikiyor (`coldExposure`): her N turda CON save ya da 1 Exhaustion.
- Keşifçiler 2. katmanda: K8 avantajı + kenar siperi.
- Melee parti üyeleri (pc2, pc5) 7. turda düşmüş.

## 4. Çelişkiler

1. **Yaklaşma ölçüsü düz mesafe, yürüyüş yol mesafesi.** Engel arkasında yerel minimum (kilitlenme).
2. **`airSpots` taraf kısıtı.** Uçuş kuralları (K71c) iki tarafa da aynı; YZ'si yalnız düşmanda. Çağrılan ejderha (U1a) uçar ama irtifa seçmez.
3. **Yüksek zemin iki ölçü.**
   - Kural K8: mutlak zemin + duruş yüksekliği farkı ≥ 10 ft.
   - YZ: katman seviyesi (`heightAt`). Katmansız haritada sur tepesi K8 verir ama YZ bilmez.
4. **`flyToReach` yalnız büyü.** Özellik uçuşları (U1a kademeleri) bu kurala girmez.
5. **`floorRoute` "hepsi başka katta" koşulu.** En yakın hedef başka kattayken aynı kattaki uzak bir düşman merdiven kararını engeller.
6. **Sur tepesi tırmanışı tek turda.** K72 `executeWallClimb` maliyeti 1 + (yükseklik / 5) × çarpan. 30 ft hızla 15 ft'lik sur bile 7 altıgen: tek turda çıkılamaz, YZ ancak alçak (10 ft) sura ya da uçarak çıkabilir.
7. **Süzülme/kısa süreli kaynak.** Değerlendirici uçuş etkisini puanlamıyor. Doğru davranış "yalnız fayda varsa aç"; fayda yalnız yürüyerek yetişilemeyen hedefte tanımlı (K73a).
8. **Bitişik uçana yükselme fırsat saldırısı açar** (K71c 3B erişimden çıkış). Yükselme kararı bitişik düşman varken verilmemeli.
