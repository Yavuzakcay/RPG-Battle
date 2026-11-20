# Dragonborn kanadı gövdeye bağlandı + palet uyumu (Kuyruk KW1, 2026-11-19)

Yalnız görünüm; kural ve kayıt sürümü değişmedi. Sorun: kanat çifti jeton ortasından çiziliyordu, rozette bütün zemin dairesi kanadın üstündeydi; kanatlar dairenin iki yanında gövdeden kopuk, soluk gri-pastel duruyordu. Şimdi tek (sağ) kanat iki yana ayna çiziliyor, kökü gövde siluetinde **omuz hizasında (jeton yüksekliğinin %40'ı)**, kanat figürün **arkasından** çıkıyor ve rengi gövdenin boyanmış rengine yakın.

## Görüntüler

| Dosya | İçerik |
|---|---|
| `once-sonra.webp` | Önce (sol) / sonra (sağ): 10 soy × (Erkek Fighter Gladyatör `ID12`, Kadın Wizard Evoker `WZ-A1`) × (256 px, 96 px rozet); gerçek bileşenler (`LookFrame` + `AvatarBadge`) |
| `kok-kontrol.webp` | 4 farklı sınıf/poz kök kontrolü (Bard `ID3` açık kollu, Monk `ID2` dört kollu, Fighter `ID12` kalkanlı, Sorcerer `SC-3` kambur), kök noktaları kırmızı halkayla, savaş jetonu çizimi |
| `kontak-290.webp` | 290 Dragonborn jetonunun (266 hücreli + 24 sınıf-genel) hepsi, savaş jetonu çizimi, havada; %70 küçültülmüş |
| `kontrol.webp` | (eski) önceki durum kontrolü |

Üretim: `npm run dev`, sonra `http://localhost:5173/onizleme-kanat.html?m=ab` (önce/sonra tablosu; önce görüntüsü `d7e212a` ağacında aynı sayfadan), `?m=kok&soy=gold`, `?m=hepsi&soy=gold`, `?m=figur` (karakter ekranı figürü), `?m=renk` (gövde Lab ölçümü).

## Yerleşim

- Görsel: `public/kanat/dragonborn.webp` artık TEK kanat (364×279); kök (omuz eklemi) görselde (21, 125) = `capa` [0,0577, 0,448]. Çift görselin sağ yarısı `scripts/dragonborn-kanat-tek.py` ile kırpıldı (sol yarı sağın birebir aynası, betik alfa farkını 0 olarak doğrular).
- Kanat genişliği jeton genişliğinin 0,60'ı (`olcek`), kök etrafında 20° dışa/yukarı (`ayna.aci`), kök yüksekliği `omuz` = 0,40 (kullanıcının tarif ettiği omuz–dirsek bandının [%38–55] omuz tarafı; boyun tabanı ortancası 0,33, omuz üstü ≈ 0,40). Geçmiş: ilk deneme 0,44; "biraz daha omuz hizasına çekelim" geri bildirimi yanlış yönde (aşağı) okundu, 0,47 ve 0,50 denendi; kullanıcı düzeltti ("biraz daha yukarı al, %10 kadar"): 0,50 − 0,10 = 0,40, kanat jeton yüksekliğinin %10'u kadar yukarı çıktı.
- Kök x'i jeton başına: gövde silüetinin (alfa > 128, 21 px yatay açma ile kol/asa/kuyruk ucu atılır) omuz bandındaki (`omuz` ± 0,04: 0,36–0,44) orta koşu kenarının 6 px içi; kenar merkezden 0,24 genişlikten uzaksa (pelerin, kalkan, açık kol) merkezden 0,17. `data/dragonborn-kanat-kok.json`: 72 grup (`<sınıf>-<erkek|kadin>[-gr|-genel]` medyanı) + gruptan > 5 px sapan 170 jeton kaydı.
- Katman sırası: kanat figürün arkasında. SVG yolu (savaş jetonu, karakter figürü) zaten figürden önce çizer. Rozet: kanat `AvatarBadge` içinde, kendi zemin dairesi ile figür görseli arasında; figür `clip-path: circle()` ile daireye kırpılır, kanat dairenin dışına taşar. Siluet maskesi (figür alfasını zeminden ayırmak) ya da kökü siluetle kırpmak gerekmedi: jeton saydam sprite olduğu için figürün kendisi örtendir; kanat, figür görselinin altındaki katmandır.

## Bağlantı ölçümü (290 jeton, sol + sağ kanat)

Kanadın dönmüş, aynalı maskesi jeton silüetiyle karşılaştırıldı (aynı geometri, Python):

| Ölçü | Sonuç |
|---|---|
| Kanat siluete değmeyen (1 px genişletmeyle) | **0 / 290** |
| Kanat ∩ siluet örtüşmesi (px) min / p5 / ortanca | 161 / 365 / 1306 |
| Kanadın görünen oranı (gövde dışında kalan) min / p5 / ortanca / p75 | 0,46 / 0,68 / 0,87 / 0,92 |
| Kök noktası omuz satırında siluet dışında kalan | 26 jeton (boyun hizasında gövde dar; kanat yine siluete değiyor: örtüşme ≥ 161 px) |

Testte (`src/ui/kanatKok.test.tsx`): her jetonda sol ve sağ kök, omuz bandında (±6 satır) siluetin 3 px yakınında; sol < sağ, aralarında 16–140 px (en ince gövde, iskelet Warlock ≈ 21 px).

Derin kök: pelerin/kalkan/açık kol gibi geniş siluetlerde (ölçülen jetonların ~%10'unda kök dış kenara 27 px'ten uzak) kanat o nesnenin arkasından çıkar; bağlantı korunur, kanadın görünen başlangıcı nesnenin üst-dış hattıdır.

## Palet

Gövde: oyundaki boyama (`scalePixels`, pul maskesi) ile 54 örnek jeton, maske pikselleri, Lab ortalaması (tarayıcıda `tintedUrl` ile aynı sayı). Kanat: `dragonborn.webp` nötr gri (luma 0,72–1,0); SVG filtresi luma'yı `esik` = 0,76'dan gerer, golge→isik arasına eşler. Hedef kanat ortalaması = gövde ortalaması; White (sıcak parlak beyaz) ve Silver (soğuk metalik gri-mavi) hedefi elle.

| Soy | Gövde L a b | Kanat L a b | ΔE | Eski palet ΔE | golge | isik |
|---|---|---|---:|---:|---|---|
| Black | 22,7 2,2 −5,6 | 22,6 2,3 −5,7 | 0,2 | 27,1 | `#15151d` | `#484852` |
| Blue | 34,7 −1,9 −22,8 | 34,5 −1,8 −22,8 | 0,2 | 36,3 | `#002a48` | `#4c6c8f` |
| Brass | 55,6 2,1 40,6 | 55,7 2,1 40,9 | 0,3 | 20,1 | `#6b540e` | `#bb9d57` |
| Bronze | 39,7 13,9 30,4 | 39,7 13,9 30,4 | 0,1 | 21,5 | `#4e2900` | `#9c6d45` |
| Copper | 40,0 27,6 34,3 | 40,1 27,6 34,3 | 0,1 | 27,0 | `#5e1e00` | `#b1643d` |
| Gold | 64,7 3,8 53,9 | 64,5 3,9 53,8 | 0,2 | 19,5 | `#876800` | `#dcb355` |
| Green | 42,2 −33,1 24,7 | 42,6 −33,2 24,8 | 0,4 | 25,9 | `#00430f` | `#4d8c52` |
| Red | 32,7 43,0 37,0 | 32,7 43,0 36,8 | 0,2 | 29,2 | `#5b0000` | `#ae3c1e` |
| Silver | 56,7 −1,6 −7,0 | 61,3 −2,6 −9,4 | 5,2 | 24,7 | `#576774` | `#a1b1c0` |
| White | 76,5 −0,4 −5,2 | 88,0 0,7 5,4 | 15,7 | 13,4 | `#c4beb4` | `#f4ede4` |

Ölçütler: kanat–gövde ΔE ≤ 15 (Black ve White ≤ 20; CIE76): 8 soyda ≤ 0,4, Silver 5,2, White 15,7 (sıcak beyaz kasıtlı). White ↔ Silver kanat ΔE = 30,7 (≥ 12). Eski palet (`esik` yok, iki uçlu düz luma): kanat–gövde ΔE Black 27,1 (gövde L 22,7, kanat L 49,7), Blue 36,3, Red 29,2, Copper 27,0; yalnız White 13,4 ≤ 15 idi (gri-pastel görünümün nedeni: kanat luma'sı 0,72–1,0'da yoğun, düz eşleme paletin üst ucuna yapışıyordu).

Test (`src/ui/kanatKok.test.tsx`) aynı ölçümü (9 jetonda bir) yapar ve yukarıdaki ölçütleri kontrol eder.

## Yeniden üretme

```bash
python3 scripts/dragonborn-kanat-tek.py                   # tek kanat görseli (çift görsel git geçmişinden)
python3 scripts/dragonborn-kanat-kok.py                   # data/dragonborn-kanat-kok.json
npx vite-node scripts/dragonborn-kanat-palet.ts --yaz     # data/kanat-esleme.json renkPaletleri
```

## KW2/KW3: pembe karışımlı zar + beyaz pençe uçları ve kanat ucu kemikleri

İstek (ekran görüntülerine daireler çizilerek): pençe uçları boynuzlarla aynı beyazlıkta; kanatların iç kısmı (zar) soy renginin pembeyle karışımı ("sarı ise sarı ile pembe"); kanadın en ucundaki kemik uçları da beyaz. İki hal gösterildi (karışımsız / pembe karışımlı); kullanıcı pembe karışımlıyı seçti, diğer hal bırakıldı.

| Dosya | İçerik |
|---|---|
| `karisim-ozet.webp` | Erkek Fighter Gladyatör, 10 soy, 256 px |
| `karisim-tam.webp` | 10 soy × (Erkek Fighter Gladyatör, Kadın Wizard) × (256, 96 px) |
| `kok-kontrol.webp` | 4 farklı sınıf/poz kök kontrolü (Gold, kök noktaları kırmızı halka) |

- **Katmanlar.** Taban görsel (`dragonborn.webp`: kol, el bileği düğümü, ön kenar kemiği) soy renginde kalır. Üstüne aynı kutuda iki saydam katman: `dragonborn-zar.webp` (kanat zarı) soy rengi + pembe karışımı, `dragonborn-pence.webp` beyaz. Her biri kendi palet filtresiyle (`renkPaletleri.<soy>.zar`, `katmanlar.pence.palet`).
- **Pençe katmanı (beyaz):** üç bölge, 1282 piksel: büyük kanca (kol düğümünün üstü), ön kenardaki küçük pençe, kanadın en ucundaki kemik ucu (ön kenar kemiğinin parlak düğümü + sivri uç). Rengi jetonların boyanmamış boynuz pikselleri: 24 Gariban jetonu, 12,7 bin piksel, Lab (80,4 / 0,2 / 2,8); palet gölge `#999590`, ışık `#f0ede8`, eşik 0,639, ortalama Lab (80,4 / 0,3 / 2,9).
- **Zar katmanı (pembe karışımı):** çerçeve (kol, el bileği düğümü, ön kenar şeridi 16 px) ve pençeler dışındaki bütün kanat. Pembe Lab (75, 30, 4); soyun taban paletiyle ölçülen zar ortalaması, a* ve b* yarı yarıya (`pembe.ab` 0,5), açıklık %15 (`pembe.aciklik`) pembeye kaydırılır; pembenin kroması açıklıkla ölçeklenir (koyu soylarda koyu pembe). Zar ortalaması (karışımsız → karışımlı, Lab): Black (23,2 / 2,3 / −5,8) → (31,2 / 8,8 / −1,8); Blue (35,2 / −1,8 / −22,8) → (41,5 / 7,2 / −10,2); Brass (56,4 / 2,1 / 40,9) → (59,4 / 12,9 / 21,9); Bronze → (45,9 / 15,9 / 16,4); Copper → (46,2 / 22,9 / 18,2); Gold (65,2 / 3,9 / 53,7) → (66,8 / 15,6 / 28,5) şeftali-somon; Green (43,2 / −33,2 / 24,8) → (48,2 / −7,2 / 13,6) soluk hakî; Red → (39,7 / 29,6 / 19,4); Silver → (64,2 / 11,5 / −3,2); White (88,4 / 0,7 / 5,4) → (86,4 / 15,0 / 4,6) açık pembe. Oranlar veride (`pembe`): daha pembe istenirse `ab` artırılıp `npx vite-node scripts/dragonborn-kanat-palet.ts --yaz` yeniden koşulur.
- İnce parmak kemikleri zar bölgesinde kaldığı için pembe karışımlı (parlaklık gölgesiyle seçilir). `katmanlar.zar.etkin: false` zarı soy renginde bırakır.
- Bölgeler elle çokgen (`scripts/dragonborn-kanat-katman.py`, `--onizleme <png>` bölgeleri renkli gösterir).
- Kapsam dışı: alttaki üç parmak ucu taban renginde (daire içinde değildi).
