# Goliath ten maskesi deliği (Görev TG1)

Yalnız görünüm: kural ve kayıt sürümü değişmedi, jeton ve maske dosyalarına dokunulmadı. Çizim tarafında `src/ui/maskClose.ts`
`fixSkinMask` (Tiefling'le aynı kod yolu) ve `data/soy-renkleri.json` `races.goliath.temizlik` kaydı.

## Sorun

Goliath otomatik ten maskesinde gölgedeki gri-mavi ten pikselleri maskenin içinde delik kalıyor; soy rengi (frost, cloud, stone…)
yanında bu pikseller özgün gri tonda "beyaz benek" gibi duruyordu. Örnek: `01-…` sayfası 2. pencere (yüz).

## Ayar (veride)

`temizlik`: `referans` 256, `delik` { `kapama` 1, `enCok` 12 px, `ekleOrani` 0,5 }, `kutu` { L 28–72, C 3–14, h 160–320° }.
Gölge bandı ve vurgu **yok** (aşağıda neden).

**Renk kutusu bağlamı Tiefling'den ayrı ve dar tutuldu**: Tiefling kaydı olduğu gibi (ırk maske kutusu L 18–96, `enCok` 80) açılsaydı
kafa kaplamasız 277 jetonda 30 612 px eklenirdi; bunun 9 829 px'i koyu mürekkep/çizgi (L < 28) ve 2 841 px'i çok açık (göz akı, rün, parlama; L > 72)
olurdu ("renk kutusu zırhı ve gözü boyuyor"). Yeni ayarla eklenen 14 746 px'in L < 28 olanı **0**, L > 72 olanı **0**.
Bağlam: yalnız maskenin tamamen çevrelediği (4-bağlantılı arka plan taramasıyla kenara ulaşılamayan) en çok 12 piksellik boşluk;
1 px kapama yalnız kutudaki pikseller için ve özgün maskenin yarısını aşmayacak biçimde. Göz akı (≥ 4 px), çizgi mürekkebi, zırh
köşesi ve rün/parlama pikselleri bu yüzden dışarıda kalır.

## Sonuç (283 jeton, `goliath-delik.csv`, `ozet.json`; 6'sında onarım atlanır, aşağıdaki piksel sayıları kalan 277 jeton için)

- Eklenen delik toplam 14 746 px (jeton başına medyan 43, p90 111, en çok 389; 13 jetonda 0).
- 6 jetonda onarım **atlanır**: `basKaplama.govdeBoya: false` (Görev K22/K23) Paladin/Fighter/Cleric temel jetonları
  (`goliath-male|female-paladin|fighter|cleric`). Bunlarda kafa kaplaması yolu aynen çalışır, gövdeye soy rengi gitmez
  (`bodyPaintOff`, `src/ui/tint.ts`); gerçek tarayıcıda eski/yeni çıktı bire bir aynı doğrulandı.
- 96 px kopyada alan ve kapama s² / s ile ölçeklenir (`enCok` 12 → 2).

## Sayfalar (8×, önce = şimdiki maske, sonra = onarım)

`01…10-<jeton>.png`: eklenen delik piksel sayısı en çok 10 jeton. Üstte tam jeton 1× [önce koyu | sonra koyu | önce açık | sonra açık];
altta değişimin en yoğun 3 penceresi 8×.

## Kalan açıklar

- **Vurgu (maskeyle çevrili 1–3 px açık benek) Goliath'ta kapalı.** Sıkı ölçüt bile (komşuların tamamı maskede, 1 px, L ≥ 72) 206 px / 84
  jeton yakalıyor ve bunun 13 px'i göz akı benzeri (L > 88, renksiz); göz akı/rün parlamasından ayırt etmek için yerel bağlam
  yetmiyor. Bu benekler özgün açık gri kalır (soy renginin açık ucuna yakın, belirgin değil).
- Otomatik maske bazı jetonlarda balta ağzı gibi buz-mavisi eşyaları da kapsıyor (TG1 öncesi de); onarım onların deliklerini de doldurur.
  Kalıcı çözüm elle maske (`assets/soy-maske-el/`).

Yeniden üretim: `python scripts/soy-golge-teshis.py --irk goliath` (numpy, scipy, Pillow; yalnız okur).
