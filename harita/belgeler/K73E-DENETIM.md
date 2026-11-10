# K73e denetimi: YZ kazma ve dalış neden seçilmiyordu (Görev 0)

Taban `wip/k73d` cbc5798, kural sürümü 64. K73e (sürüm 65) yalnız yapay zekâ kararı ekler; kural motoru 64 ile aynı.
Değişiklikler ve kararlar DECISIONS.md "Kuyruk K73e" girdisinde.

## 1. Kazma: aday vardı, tetikleyici hiç sağlanmıyordu

- Karar `src/battle/ai.ts` `burrowCommand` (K73c), `decide` içinde `waterCommand`'den sonra. Kural kapısı açıktı (`k73cOn`).
- Yalnız düşman tarafı, yalnız bu tur saldıramıyorken ve **yürüyerek hiçbir düşmanın yanına yol yokken** (`approachField` sonsuz) kazıyordu.
- K73d'nin açık kum haritasında (Çöl) her zaman yürüme yolu var: koşul hiç doğmadı, kazma olayı 0.
- Yer altında yaklaşma ve bitişikte çıkış kodu vardı; ama yer altına hiç inilmediği için çalışmadı.
- Kaçış (canı az olanın yer altına inmesi) hiç yoktu.
- Puan sorunu değil: kazma bir aday puanlamasına girmiyor, önce gelen kural tabanlı bir karar.

## 2. Dalış: aday hiç üretilmiyordu

- `waterCommand` (K73c) yalnız batıkken çalışıyordu: nefes bitmek üzereyken ya da saldıramıyorken **yüzeye çıkış**.
- Yüzeydeki yaratık için hiçbir yerde `vertical_move` (eksi irtifa) adayı yok. Kural kapısı açık, puan yok: aday yok.
- K73d su altı senaryosunda herkes batık başlatıldı (64'te), dalış zaten gerekmedi. 64'te batık ve saldıramayanlar yüzeye çıktı (sudan çıkış 45 / 4 tohum), sonra kimse dalmadı.
- Ek bulgu: batıkken `jump` (atlama) adayı üretiliyordu. Motor batık atlamada varış hücresini denetlemiyor: atlayan, aynı −5 ft hücredeki düşmanın üstüne iniyor (iki yaratık tek hücrede). Sonra yüzeye çıkış hücre denetimine takılıyor ve yaratık boğuluyor. ⚠ Motor açığı (K73c, sürüm 64). Kural motoru değişmediği için 65'te yalnız YZ atlama adayını keser (batık ve yer altındayken). Motor düzeltmesi ayrı görev.

## 3. Veri

| Hız | Canavar | Not |
|---|---:|---|
| Burrow | 21 | Mavi, pirinç, beyaz ejderhalar (yavru → kadim, 12), Ankheg, Bulette, Earth Elemental, Tarrasque, Badger, Giant Badger, Xorn, Remorhaz, Purple Worm. Kazma hızı `create.ts` `monsterBurrowFt`. |
| Tremorsense | 6 | Ankheg, Bulette, Earth Elemental, Xorn, Remorhaz, Purple Worm (`senses.tremorsense`). |
| Swim (veride) | 63 | Hız satırında "Swim N ft". |
| Swim (kuralın listesi) | 46 | `data/derin-su.json` `swimmers` (`hasSwimSpeed`). |

- ⚠ Veride yüzme hızı olan 17 canavar kuralın listesinde yok: adult/ancient/young/wyrmling white dragon, archelon, black bear, chuul, flying snake, gibbering mouther, green hag, guardian naga, hydra, kraken, merfolk skirmisher, polar bear, seahorse, shambling mound.
- Bunlar 64'te ve 65'te yüzme hızı yokmuş gibi davranır: derin su sınırı, su altı silah kuralı, dalışın 2 kat maliyeti. YZ de bunları dalmaz.
- Liste bir kural verisi; YZ görevi kapsamında değiştirilmedi. Açık kalan.

## 4. Süre bütçesi

- K73d ölçümü (63 ↔ 64): en yüksek fark duvarlı yerde 2,20 → 2,36 ms (+%7).
- Kazan düşman 1,44 → 1,47 ms; su altı (düşman/parti) 0,41/1,26 → 0,41/1,25 ms.
- K73e'nin ek maliyeti:
  - kazma kararı: kazıcı başına bir yer altı yol alanı (`foeField`, yalnız yaklaşmada);
  - dalış kararı: menzilli tehdit taraması (düşman sayısı kadar).
  - İkisi de yalnız kazma hızı olan ya da derin suda yüzen yaratıkta çalışır.

## 5. Değişmeyenler

- 64 ve altı birebir: K73e kararları `k73eOn` (65+) kapılı. 64'te K73c kararları aynen.
- Kural motoru, kayıt biçimi aynı: yeni olay ya da alan yok; `SAVE_VERSION` 22.
