# Tiefling boynuz ve kuyruk gölge yarısı (Görev TG1)

Yalnız görünüm: kural ve kayıt sürümü değişmedi, jeton ve maske dosyalarına dokunulmadı. Çizim tarafında `src/ui/maskClose.ts`
`fixSkinMask` içindeki **gölge bandı** adımı (ayar `data/soy-renkleri.json` `races.tiefling.temizlik.golge`).

## Sorun

Otomatik ten maskesi boynuz, kuyruk, kulak ve parmakların yalnız **açık yarısını** kapsıyordu; koyu yarı maske dışında kalıp özgün
şarap/magenta tonunda duruyordu ("yarı boyalı"). Örnek: `01-…` sayfasındaki ağız çevresi, boynuz ve kuyruk (8×).

## Teşhis (285 jeton, `tiefling-golge.csv` jeton başına, `ozet.json`)

Maskede olmayan ama maskeye bitişik koyu ten piksellerinin (gölge bandı) **neden** maskede olmadığı, maske üretecinin
(`scripts/soy-maske.ts` `skinMask`; numpy portu 285 maske PNG'siyle piksel piksel aynı) aşamalarından okundu:

| Neden | Piksel | Pay |
|---|---:|---:|
| Gevşek ten kutusunun (renk kutusu) dışı | 64 | %0,04 |
| Paletin (en parlak kümeler, `bright` 20) ΔE ≤ 7 dışı | 160 269 | %96,6 |
| ↳ aslında bulunan bir kümeye yakın (küme palete alınmamış) | 65 393 | %39,4 |
| ↳ hiçbir kümeye ΔE ≤ 7 değil (daha koyu/farklı gölge) | 94 876 | %57,2 |
| Palette ama temizlikte (komşu ≥ 2) elenmiş | 5 585 | %3,4 |

Yani sebep **renk kutusu değil, maske üretimi**: palet yalnız en parlak kümeleri tutuyor, gölge yarısı ΔE eşiğinin dışında kalıyor.
Büyütülen toplam 165 918 px (jeton başına medyan 572, p90 1 022, en çok 2 040; 11 jetonda 0). İnce yapı (9×9 açılımda kalmayan çıkıntı:
boynuz, kuyruk, kulak, parmak) 122 722 px: üst bant (baş, boynuz) 53 113, orta (el, parmak) 36 322, alt (kuyruk) 33 287.

## Çözüm

Maskeye bağlı komşuluk (jeton başına yama yok, parametreler veride): maskeye bitişik, **aynı ton ailesinde koyu** piksellerin bileşeni
maskeye katılır. Kabul koşulları: bileşen ≤ 900 px ve maskeden ≤ 8 px uzak (ince), maskeyle en az 3 piksel temas, bileşen tonu bitişik
maske tonundan ≤ 12° ve global maske tonundan ≤ 26°, kroma 15–70, açıklık 18 (altı çizgi mürekkebi) ile maske ortalaması + 6 arası,
dış sınırının ≥ %60'ı çizgi mürekkebi ya da şeffaf, **bitişik maskenin ortalama kroması ≥ 32** (zırh, cüppe, saç kenarına oturmuş
yanlış maske büyümesin: 41 jetonda 7 290 px engellendi; en çok `erkek-fighter-ID2` 1 298, `erkek-wizard-GR` 949,
`kadin-warlock-WL-11` 683). Elle maske (`assets/soy-maske-el/`, ağırlıklı yol) önceliklidir: gölge bandı hiç çalışmaz.
96 px kopyada uzunluklar s = W/256 ile ölçeklenir (kroma ölçeklenmez).

## Boyanan piksellerin dağılımı (yasak kontrolü)

| Ölçüt | Değer |
|---|---|
| Ton sapması (maske ortalamasından) p50 / p90 / p99 / maks | 11,8° / 20,9° / 25,1° / 26,0° |
| Kroma p5 / p50 / p95 | 24,8 / 35,5 / 46,6 |
| Açıklık L p5 / p50 / p95 | 18,5 / 23,4 / 38,8 |
| Sarı-yeşil ton (55–120°) boyanan | 1 px |
| Maske tonundan > 40° sapan | 0 px |
| L > 70 (parlak: göz, rün, parlama) | 0 px |
| Sarı parlayan göz adayı (h 55–100°, C > 40, L > 55) boyanan | 0 px |

## Sayfalar (8×, önce = TB1 sonrası oyundaki şimdiki, sonra = TG1)

`01…10-<jeton>.png`: boynuz/kuyruğu en çok değişen 10 jeton (ince yapı piksel sayısına göre). Üstte tam jeton 1× [önce koyu | sonra koyu |
önce açık | sonra açık]; altta değişimin en yoğun olduğu üst (baş, boynuz), orta (el, gövde), alt (kuyruk) 32×32 pencereleri 8×.

## Kalan açıklar

- Otomatik maskenin **kıyafet/kasket** yanlış pozitifleri TG1 öncesi de vardı (ör. `erkek-ranger-ID9` kırmızı kasket ve gömlek,
  `erkek-wizard-GR` cüppe/şapka, `erkek-fighter-ID2` zırh kenarı, `male-rogue` kapüşon); bu pikseller zaten boyanıyordu. Gölge bandı yalnız
  bitişik maske doygun tense büyür; ama doygun ten tonuna yakın kıyafet (kasket, gömlek) maskedeyse onun koyu kenarı da büyür.
  Kalıcı çözüm: o jetonlar için elle maske (`assets/soy-maske-el/`) ya da maske üretecinin ayrı bir düzeltmesi.
- Koyu mor/gri tenli jetonlarda (maske kroması ≈ 16–24: `kadin-sorcerer-SC-5`, `kadin-monk-ID10`…) gölge bandı zaten aday bulmuyor ya da
  kroma kapısına takılıyor (zırh maskesinden ayırt edilemediği için muhafazakâr); bu jetonlarda "yarı boyalı" görünüm sürebilir.
- Ağız içi gibi koyu ten gölgesi kısmen boyanır (`kadin-barbarian-ID8` 1. pencere); göz akı, diş, alev, kürk, kıyafet rengi aynen.

Yeniden üretim: `python scripts/soy-golge-teshis.py --irk tiefling` (numpy, scipy, Pillow; yalnız okur).
