# K73c denetimi: kazma, su altı, havada merkezli alan, Call Lightning, çok altıgen, 3B aura (Görev 0)

Taban `wip/k73b` 62773e6, kural sürümü 63. K73c (sürüm 64) altı boşluğu kapatır. Kullanıcı kararları kesin:
- **(1)** kazan yaratık yer altında sayılır, saldırı alamaz, yalnız yüzeye çıkarken saldırır;
- **(2)** tam SRD su altı savaşı;
- **(3)** uçan yakalayanın taşıması yok (ertelendi).

Değişiklikler ve kararlar DECISIONS.md "Kuyruk K73c" girdisinde.

## 1. Kazma (burrow)

**Veri:** `data/monsters.json` hızı yalnız `speed` (yürüme) ve `fly`. Kazma ve yüzme metin notunda: `unsupported` "Hız: Burrow N ft (yalnızca yürüme/uçma kullanılır)".
- 21 canavar kazar:
  - mavi, pirinç, beyaz ejderhalar (yavru, genç, yetişkin, kadim);
  - ankheg, bulette, earth-elemental, tarrasque, badger, giant-badger, xorn, remorhaz, purple-worm.
- Tremorsense 6 canavarda (`Duyu:` notu → savaşçıda `senses.tremorsense`, `create.ts` `monsterSenses`): ankheg, bulette, earth-elemental, xorn, remorhaz, purple-worm.

**Kod (63):**
- `monsterAbilities.ts` (`srdK19`): kazma notu olan canavara pasif etki `burrow` (+ `passCreatures`).
- `movement.ts`: etkideki `burrow` → `freeMove`: zorlu arazi yok, yaratıkların altından geçer.
  - Hız yürüme hızı.
  - Yer altı durumu, hedeflenmezlik, kazılabilir zemin, duvar/döşeme engeli yok.
- Earth Glide / Tunneler (`earthGlide`, `tunneler`): `phase` (taşın içinden).

**Zemin:** kazılabilir harf verisi yok. SRD 5.2.1 Burrow Speed: kum, toprak, çamur, buz; katı kaya yalnız özel özellikle.
- Harf tablosu (öneri):
  - kazılır: `.` açık zemin, `d` kum tepesi, `g` çalılık, `n` sığ su/çamur, `q` kar, `i` buz;
  - kazılmaz: `t` taşlık, `r` kaya kümesi, `H` bazalt, `p` tahta/kaldırım, duvar, sütun, su, lav, uçurum.
- ⚠ Aynı `.` harfi zindan/kale haritasında taş döşeme. Ortam (`environmentId`) ayrımı gerekir:
  - `yeralt-ma-ara` (mağara/zindan) ve `kasaba` haritalarında `.` kazılmaz;
  - açık ortamlarda kazılır.

## 2. Su altı

**Veri:**

| Harf | Ad | Kural | Not |
|---|---|---|---|
| `w` | Derin su | `deepWater` | Derinlik verisi yok. Kıyıdan uzaklık eşiği "çok derin" (`data/derin-su.json` `esik` 3). Yüzücü listesi `swimmers`. |
| `n` | Sığ su, çamur | — | Zorlu arazi |
| `b` | Derin batak | `bog` | Saplanma, boğulma sayacı |
| `R` | Coşkun nehir | geçilmez (Game Master anahtarı) | — |

- Yüzme hızı: `derin-su.json` `swimmers` + `swimsByTrait` (Alter Self, Roving, Gift of the Depths).
- Su soluma: canavar notunda "Trait: Water Breathing" / "Amphibious"; timsahta "Hold Breath" (savaş boyunca yeter). Verinin geri kalanında yok.

**Kod (63):**
- `maprules.ts` `isUnderwater`: derin su altıgeninde uçmayan (süzülen dahil değil) "su altında". Yüzeyde ve batıkta ayrım yok.
- `rules/modes.ts` `underwaterSources` (SRD 5.2.1):
  - yüzme hızı olmayanın Piercing olmayan yakın dövüş silahı dezavantajlı;
  - menzilli silah normal menzil ötesi otomatik ıska, içinde dezavantaj.
  - Yalnız saldıranın konumuna bakar; hedef su altındayken su dışından atış etkilenmez.
- Ateş direnci (SRD "Anything underwater has Resistance to Fire") **yok**.
- Nefes tutma ve boğulma (SRD Suffocation: 1 + CON dakika, en az 30 sn; sonra her tur sonu 1 Exhaustion; nefes alınca o seviyeler gider) **yok**.
  - Yalnız ağır zırhla batma: `deepWater.heavyArmorSink` Atletizm, N tur sonra "boğuldu" (HP 0; ev kuralı).
- Dalış yok: derin suda irtifa 0 (yüzey). Eksi düzey yalnız yarıkta (K66a) ve şemada (K71c).
- ⚠ Kullanıcı listesindeki silah adları (hançer, cirit, kısa kılıç, mızrak, trident) ve menzilli istisnalar (hafif tatar yayı, ağ, cirit, mızrak, trident, dart) SRD 5.1 kuralıdır. Projenin tabanı SRD 5.2.1'de:
  - yakın dövüş istisnası "Piercing hasar veren silah" (listedekilerin hepsi Piercing);
  - menzilli istisna yok.

## 3. Havada merkezli alan

- Nokta alanı (`origin: 'point'`, küre/küp/silindir): `pickArea` yatay altıgenler. Dikey kapsam:
  - `areaReachesAltitude`, yukarı göreli;
  - K71d'den beri çıkış yüksekliğinden `areaOriginFt`: nokta = altıgenin zemini.
- Merkez yerde. İstisna Call Lightning: yaratık seçilince nokta onun irtifasında (K68b).
- Kalıcı alanlar (`altitudeInZone`): yerden `zoneTopFt`'e. Yalnız yürüyen alanda bağlı yaratık tabanı (K73b döşeme kesimi).
- Komutta merkez irtifası alanı yok (`cast_spell.targetHex` yalnız altıgen).

## 4. Call Lightning

- `cloud.ts` (K68b): bulut büyücünün altıgeninin üstünde sabit. Taban açık gökte `openBaseFt` 30, tavanlı yerde tavan − 10; yarıçap 60 ft.
- Fırtına (`a6.stormBonus`): harita kuralı `storm` varsa hasar +1d10. Yine de yeni bulut kurulur ve şimşek bulut yarıçapıyla sınırlı.
- SRD: "If you're outdoors in a storm … the spell gives you control over that storm instead of creating a new one. … damage increases by 1d10." Devralma yok.
- Storm of Vengeance (`spells-69.json`) bir alan (`zone`, ⛈): Call Lightning onu fırtına saymıyor.
- Fırtınalı harita: `deniz-ada`, `deniz-gemi` (`storm` kuralı).

## 5. Çok altıgenli gövde (K69) ve farklı zemin

- Gövde (`bodyAt`, `footprintOf`) 18 modülde. Yükseklik hep çapanın zemininden:
  - `vertical.ts` `k9Ft`/`mutlakFt`/`absBand`;
  - `cover.ts` K8 `attackHeights`;
  - `ai/k73a.ts` `groundOf`;
  - düşme iniş yüzeyi;
  - K72 `standingOn`.
- Gövde farklı zeminli (katman) ya da farklı katlı altıgenlere yayılırsa bant çapanın zemininden. Sur/kat kenarında yarısı boşlukta kalan gövde geçerli sayılır.
- Uygulama noktaları, K73B-DENETIM'e eklendi (§8):
  - K9 uzaklık ve erişim, fırsat saldırısı, `adjacent3D`;
  - K8 yüksek zemin;
  - düşme;
  - duruş yüzeyi;
  - hareket sığması (`bodyFitProblem`);
  - YZ yüksek zemin.

## 6. Paket/imza auraları ve tepki menzilleri (63'te 2B)

| Yer | Ölçü |
|---|---|
| `paket/sans.ts` (`pkSans`), `paket/core.ts` (`menzilFt`, `dostBitisik`), `paket/index.ts`, `paket/p9.ts`, `paket/p10.ts` | `gap` |
| `imza.ts`, `imzaCore.ts` (Taht aurası), `imzaBirlik.ts`, `celestial.ts`, `karadul.ts` | `gap` |
| `reactions.ts` `feetBetween` (Protection, Interception, Feather Fall 60 ft, Counterspell 60 ft, Silvery Barbs…) | `gap × 5` |
| `auras.ts` `burstOf` (Burst of Ingenuity 30 ft) | `gap` |

Fırsat saldırısı (K71c/K73b) zaten 3B.

## 7. Çelişkiler

1. Kazma notu yalnız hareketi kolaylaştırıyor (zorlu arazi yok), hız yürüme hızı. Kazan yaratık her zaman yerde, hedeflenebilir; duvarın, taşın ve döşemenin içinden geçmez ama zemin ayrımı da yok.
2. Tremorsense yalnız görüşte (`sight.ts` YZ "görür" listesi). Yer altı kavramı olmadığı için hedeflemede rolü yok.
3. Su altı tek katman: yüzeyde yüzen ile batık aynı. Nefes yok; ateş direnci yok.
4. Su altı menzilli kuralı yalnız saldırana bakar: kıyıdaki okçu derin sudaki yaratığa cezasız atar, sudaki kıyıdakine cezalı.
5. Süzülen su altı sayılmaz (U1a kararı); derin suda süzülen ateşten korunmaz. (Değişmez.)
6. Alan merkezi hep yerde: 30 ft'te uçan sürüye Fireball merkezini yalnız yerden (20 ft yarıçap) ulaştırabilir, sürünün ortasına koyamaz.
7. Call Lightning fırtınada da yeni bulut kurar (bulut yarıçapı sınırı), SRD fırtınayı devralmayı söyler.
8. Çok altıgenli gövdede zemin çapadan: Huge yaratığın bir ayağı 10 ft'lik basamağın üstündeyken K8 ve K9 çapanın zemininden.
9. Paket/imza aurası ve tepki menzilleri 2B (K73b'de çekirdek auralar 3B oldu): aynı türden iki aura farklı ölçüyle.

## 8. Değişmeyenler (sürüm 63 ve altı)

- 63 ve altı birebir: yeni kurallar `k73cOn` (64+) kapılı.
- Kayıt biçimi:
  - yeni olay türü yok;
  - yeni isteğe bağlı alanlar: `altitude_changed.burrow`, `cast_spell.targetFt`, `SpellZone.centerFt`, `MapStatus.breath`/`suffocation`.
