# Dragonborn pul deseni — önizleme raporu

Durum: **onay bekliyor**. Oyuna bağlanmadı; `public/` ve `data/` değişmedi. Referans görseller depoya konmadı, desen sıfırdan kodla üretildi.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `renk-tablosu.md`, `renk-tablosu.json`, `renk-kareleri.png` | 10 soy × açık/orta/koyu, başlangıç değerleriyle yan yana; oyun tablosuyla karşılaştırma |
| `karo/kucuk/desen-<soy>.png` (16×16), `karo/orta/desen-<soy>.png` (20×20) | ham tek karo, 1 piksel = 1 jeton pikseli |
| `karo/<seçenek>/doseme-4x4-<soy>.png` | 4×4 döşeme testi (×6 büyütülmüş) |
| `desen-sayfa-kucuk.png`, `desen-sayfa-orta.png` | 10 karonun yan yana sayfası (×8) |
| `jeton/<jeton>.png` | 4 örnek jeton × 10 soy: orijinal, küçük desen, orta desen, düz renk |
| `tum-jetonlar-kirmizi-kucuk.png`, `tum-jetonlar-mavi-kucuk.png` | 264 jetonun hepsi; desen uygulanmayanlar beyaz + kırmızı çerçeve |
| `kirpma/boynuz-*.png`, `kirpma/kiyafet-*.png` | boynuz ve kıyafet kenarı ×8: orijinal, desen, maske |
| `savas-boyutu.png` | jeton 64/96/128 px'te (savaş ekranı boyutu) |
| `jeton-durumu.json` | jeton başına uygulandı mı, nedeni, maske ölçümü |
| `inceleme/maske-*.png`, `maske-olcum.json` | maske inceleme sayfaları |

Üretim: `python scripts/dragonborn-desen-renk.py`, `python scripts/dragonborn-desen-maske.py`, `python scripts/dragonborn-desen.py` (yalnız bu klasöre yazar).

## Şekil

- Damla pul, tuğla dizilim: pul genişliği W, satır aralığı W, satırlar W/2 kaydırılmış, pul boyu 1,75W, yanlar dışbükey, alt uç sivri; üst satır alttakinin üstüne biner. Karo 2W×2W, dikişsiz (modüler hesap; 4×4 testte dikiş yok).
- Üç ton: koyu = alt V kenarı ve uç (1 px), orta = üst kısım (üst pulun altında kalan), açık = uca yakın iç bölge (hafif sola kaymış). Siyah çizgi ve kavşak noktası yok; doku, parlama lekesi ve renk referanstan alınmadı. 10 soyda geometri aynı.
- Seçenekler: **küçük** pul 8 px (karo 16×16), **orta** pul 10 px (karo 20×20). Orta için 24×24 karo pul genişliğini 12 px'e çıkarırdı (8–10 kuralının dışında), bu yüzden 20×20 seçildi; istenirse 24×24/12 px de üretilebilir.

## Piksel boyutu (Ek 1)

- Jetonlar 256×256; sanat düzgün bir piksel ızgarasında değil (yeniden örneklenmiş). Kontur basamakları çoğunlukla 1 px, görünen sanat pikseli ≈ 1–2 görüntü pikseli. Desen jetonun kendi 256 px uzayında, 1 desen pikseli = 1 jeton pikseli olarak basılıyor; jeton ekranda nasıl ölçeklenirse desen de aynı oranda ölçeklenir, iki farklı piksel yoğunluğu karışmaz.
- Ölçek: baş (yüz) genişliği ≈ 55–70 px → küçükte 7–9, ortada 6–7 pul; el ≈ 10–14 px → 1–1,5 pul (iki seçenekte de elde pul iri kalıyor, küçük biraz daha iyi); kuyruk 12–20 px kalınlıkta → 2 pul.
- Savaşta jeton 256 px'ten küçük çiziliyor (altıgen ekranda en az ~44 px). 64 px'te pul 2 ekran pikseline düşüyor ve desen doku gibi okunuyor (bkz. `savas-boyutu.png`); 96–128 px'te pul seçilebiliyor. Karakter ekranları ve rozetlerde tam okunur.

## Uygulama alanı ve maske

- Desen yalnızca maskeye basılıyor (renge göre seçim yok): kaynak oyunun Dragonborn pul bölgesi maskesi `public/characters/maske/<jeton>.png` (baş, boyun, kuyruk, eller ve maskeye giren çıplak kol/bacak/gövde). Üstüne: boynuz pikselleri (sarımsı ya da gri; ten lavanta-beyaz) ve koyu kontur çıkarıldı, maske **1 px içeri çekildi** (3×3 erozyon), 12 px'ten küçük kırıntılar atıldı, parlama delikleri dolduruldu. Boynuz ve kıyafet orijinal hâlinde kalıyor (`kirpma/`).
- Uygulama: normalize çarpma (multiply). Jetonun ten ortancası 1 kabul edilir, böylece lavanta-beyaz taban rengi kaydırmaz, jetonun gölge-ışığı korunur. "Düz renk" sütunu aynı maskeye orta tonun çarpılmış hâli.
- Bilinen eksik: oyun maskesi büyük gövde bileşenlerini atıyor; çıplak gövde ve kol bazı jetonlarda (ör. `erkek-barbarian-ID2` göğsü) desensiz kalıyor. Kanat: jeton sanatındaki ejderha kanatları (ör. Ranger-ID4) oyun maskesinde yok, desensiz kalıyor; kanat katmanı (`public/kanat/`) ayrı ve bu adımda boyanmadı.

## Desen uygulanmayan jetonlar (64 / 264; beyaz bırakıldı)

Uygulanan: 200. Liste elle inceleme (`inceleme/`) ve otomatik ölçütle:

- **maske yok** (3): `erkek-rogue-ID4`, `kadin-rogue-ID4`, `kadin-druid-ID4`
- **boynuz ten renginde, maske boynuzu ayıramıyor** (9): `erkek-fighter-ID7`, `erkek-warlock-WL-1`, `erkek-warlock-WL-2`, `erkek-warlock-WL-5`, `kadin-warlock-WL-1`, `kadin-warlock-WL-2`, `kadin-warlock-WL-5`, `kadin-warlock-WL-9`, `kadin-sorcerer-SC-3`
- **açık renkli kıyafet/zırh/eşya maskeye karışıyor** (31): `erkek-barbarian-ID4`, `erkek-barbarian-ID7`, `erkek-barbarian-ID8`, `erkek-cleric-ID7`, `erkek-fighter-ID3`, `erkek-fighter-ID10`, `erkek-monk-ID9`, `erkek-paladin-ID10`, `erkek-ranger-ID8`, `erkek-rogue-ID10`, `erkek-sorcerer-SC-6`, `erkek-warlock-WL-7`, `erkek-wizard-WZ-A1`, `erkek-wizard-WZ-A2`, `erkek-wizard-WZ-A5`, `erkek-wizard-WZ-A6`, `erkek-wizard-WZ-A8`, `erkek-wizard-WZ-B5`, `kadin-cleric-ID3`, `kadin-cleric-ID7`, `kadin-paladin-ID10`, `kadin-rogue-ID10`, `kadin-sorcerer-SC-6`, `kadin-warlock-WL-7`, `kadin-wizard-WZ-A5`, `kadin-wizard-WZ-B5`, `erkek-cleric-ID5`, `kadin-cleric-ID5`, `kadin-wizard-WZ-A1`, `kadin-wizard-WZ-A6`, `kadin-fighter-ID10`
- **kostüm/ruh/ölümsüz biçim: yüz ya da gövde ejderha teni değil** (21): `erkek-bard-ID7`, `kadin-bard-ID7`, `erkek-cleric-ID6`, `kadin-cleric-ID6`, `erkek-druid-ID4`, `erkek-monk-ID2`, `kadin-monk-ID2`, `erkek-monk-ID10`, `kadin-monk-ID10`, `erkek-sorcerer-SC-3`, `erkek-sorcerer-SC-5`, `kadin-sorcerer-SC-5`, `erkek-sorcerer-SC-9`, `kadin-sorcerer-SC-9`, `erkek-warlock-WL-4`, `kadin-warlock-WL-4`, `erkek-warlock-WL-8`, `kadin-warlock-WL-8`, `erkek-warlock-WL-10`, `kadin-warlock-WL-10`, `kadin-fighter-ID7`

## Onay için sorular

1. Ölçek: küçük (8 px) mı, orta (10 px) mı?
2. Renk: eşitlenmiş değerler uygun mu? Oyundaki çarpma rengiyle çelişen Mavi (oyunda canlı mor-mavi #5f84e8) ve Beyaz (oyunda boyasız) için hangisi geçerli?
3. Uygulanmayan 64 jeton beyaz mı kalsın, yoksa elle maske (`data/soy-maske-dragonborn-el.json`) yazılsın mı?
