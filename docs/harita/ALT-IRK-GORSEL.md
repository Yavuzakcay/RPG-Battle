# Alt ırk (soy) görselleri: inceleme (Görev K8)

Yalnız inceleme: kod ve görsel değişmedi. Amaç, soyu (Görev K3, `data/races.json` `lineages`) jetonda göstermenin üç yolunu
karşılaştırmak.

## Bugünkü yapı

- **Jeton:** `public/characters/<ırk>-<male|female>-<sınıf>.webp`, 256×256 RGBA pixel art (Gemini üretimi), 240 dosya
  (10 ırk × 2 cinsiyet × 12 sınıf), ortalama **22 kB** (16–32 kB), toplam 6,8 MB. Küçük kopyalar
  `public/characters/kucuk/` 96×96, ortalama **3,6 kB** (`npm run karakter-kucuk`).
- **Yol:** `characterTokenFile(raceId, gender, classId)` (`src/battle/avatar.ts`); soy dosya adına girmez. Yedek zinciri:
  `avatars/…` → baş harfli renkli rozet (`RACE_COLOR`).
- **Yükleme:** savaşta yalnızca sahnedeki jetonlar (en çok 6 karakter); sihirbaz seçili ırk/cinsiyetin 12 küçük
  jetonunu önyükler (≈43 kB); karakter listesi kendi jetonlarını. Jeton görselleri ana parçaya girmez.
- **Görsel kural (CLAUDE.md, Görev V):** jeton halkaları yalnızca durum efektlerine ayrılmış; resimli jetonda takım halkası
  bile yok (silüet parıltısı). Bu yüzden "renk halkası" doğrudan kullanılamaz; ayrım köşe rozeti ya da kart üstü etiket
  olmalı.
- **Örnekler:** Dragonborn jetonları ten rengi (bakır/tan) pullu, boynuzlu ve kuyruklu; zırhı gri metal, kemer ve kalkan
  kahverengi, yani **pul rengi deri ve kahverengi kumaşla aynı ton ailesinde**. Tiefling mor/eflatun ten. Goliath gri ten
  ve koyu dövmeler. Elf/Gnome soyları renkten çok kıyafet ve ten farkı (Drow koyu ten, beyaz saç).

## Soyu olan ırklar

| Irk | Soy sayısı | Soylar | Görsel fark beklentisi |
|---|---:|---|---|
| Dragonborn | 10 | black, blue, brass, bronze, copper, gold, green, red, silver, white | Yüksek (pul rengi tanımlayıcı) |
| Goliath | 6 | cloud, fire, frost, hill, stone, storm | Düşük–orta (ten/dövme tonu, aksesuar) |
| Elf | 3 | drow, high-elf, wood-elf | Drow yüksek (ten, saç); High/Wood düşük |
| Tiefling | 3 | abyssal, chthonic, infernal | Orta (ten tonu, boynuz) |
| Gnome | 2 | forest-gnome, rock-gnome | Düşük |

Diğer ırklarda (Celestial, Dwarf, Halfling, Human, Orc) soy yok.

## Üç yol

### 1) Ek görsel yok: soy rozeti / renk etiketi

Jeton aynı kalır; köşede küçük bir rozet (Dragonborn: soy rengi dolgulu pul simgesi; Goliath: ata simgesi ❄ 🔥 ⛰ 🪨 ⚡ ☁;
Tiefling: üç simge; Elf/Gnome: harf ya da yaprak/dişli). Renk ve simge `races.json` `lineages[]`'e (`color`, `icon`) yazılır,
sihirbaz kartı ve karakter listesi aynı rozeti kullanır.

| | Değer |
|---|---|
| Gereken görsel | 0 |
| Yükleme etkisi | ≈0 kB görsel; ≈1–2 kB kod/CSS (ana parçada değil, savaş ve sihirbaz parçalarında) + veri alanları (<1 kB) |
| Kalite | Jeton değişmez; ayrım okunur ama küçük (haritada ≈12 px rozet). Durum halkalarıyla çakışmaz (köşe, halka değil) |
| Risk | Yok; geri alınması kolay |

### 2) Kodla renk kaydırma

İki alt seçenek:

- **2a, CSS `hue-rotate` / `filter`:** bütün görsel döner; zırh, kumaş ve silah da renk değiştirir. Dragonborn'da kırmızı
  ejderha soyu yeşil kılıç ve mor kalkan üretir. **Önerilmez.**
- **2b, palet değiştirme (ten maskesi):** pixel art az renkli; her jetonda ten/pul renk kümesi bulunur ve yalnızca o kümenin
  pikselleri hedef soya boyanır. Çalışma anında (tembel parçada canvas, jeton başına bir kez, 256×256 için <5 ms) ya da
  derlemede (betik, dosya üretir; boyut yol 3 ile aynı olur).

| | Çalışma anında (2b) | Derlemede (2b, dosya) |
|---|---|---|
| Gereken görsel | 0 | Yol 3 kadar dosya, ama üretim betikle |
| Yükleme etkisi | 0 kB görsel; ≈3–5 kB kod (tembel) | Yol 3 ile aynı (aşağıda) |
| Kalite | Orta–düşük: Dragonborn pul tonu deri kemer, kalkan ve saçla aynı aileden; maske 240 jetonun her birinde elle denetim ister. Tiefling ve Goliath'ta (ten rengi kumaştan ayrık) daha iyi | Aynı maske riski; ama sonuç gözle denetlenip kötüler elle düzeltilebilir |
| Risk | Çalışma anı hatası jetonu bozar; CORS/yerel dosyada canvas sorunları yok (aynı köken) | Depo büyür; betik bakım ister |

Elf ve Gnome soylarında fark renk değil (kıyafet, saç, kulak), palet değiştirme anlamlı ayrım üretmez (Drow hariç: koyu ten
ve beyaz saç iki kümeyle yapılabilir).

### 3) Tamamen ayrı görseller

Soy başına ırkın 24 jetonu (2 cinsiyet × 12 sınıf); mevcut set bir soyu temsil eder (Dragonborn için ten rengi en yakın
brass/copper; Tiefling için infernal; Goliath için stone; Elf için high-elf; Gnome için rock-gnome sayılabilir).

| Irk | Ek set | Ek görsel | Ek boyut (256 px, ≈22 kB) | Ek küçük kopya (≈3,6 kB) |
|---|---:|---:|---:|---:|
| Dragonborn | 9 | 216 | ≈4,8 MB | ≈0,8 MB |
| Goliath | 5 | 120 | ≈2,6 MB | ≈0,4 MB |
| Elf | 2 | 48 | ≈1,1 MB | ≈0,2 MB |
| Tiefling | 2 | 48 | ≈1,1 MB | ≈0,2 MB |
| Gnome | 1 | 24 | ≈0,5 MB | ≈0,1 MB |
| **Toplam** | 19 | **456** | **≈10 MB** | **≈1,6 MB** |

- **Sayfa başına yükleme:** değişmez (savaşta yalnızca kullanılan ≤6 jeton, ≈22 kB'ı; sihirbazda 12 küçük jeton). Etki
  depo/dağıtım boyutunda (6,8 → ≈18 MB) ve `npm run karakter-kucuk` süresinde.
- **Kalite:** en yüksek, ama üretim tutarlılığı (aynı poz, aynı sınıf silahı, aynı ölçek) 456 görselde zor; mevcut 240'ın
  üslubuyla eşleşmesi için aynı istem ve elle ayıklama gerekir. Goliath ve Gnome'da soylar arası fark zaten küçük olduğundan
  kazanç düşük.
- **Kod:** `characterTokenFile`'a soy (dosya adı `<ırk>-<soy>-<cinsiyet>-<sınıf>`; yoksa ırk dosyasına düşen yedek zinciri),
  `loading.test.ts` dosya listesi.

## Öneri

1. **Şimdi yol 1** (bütün soylu ırklar): rozet + veri rengi/simgesi. Sıfır görsel, sıfır yükleme etkisi, halka kuralını
   bozmaz; soy bilgisi zaten sihirbaz kartında ve ⓘ'de var, jetonda da okunur olur.
2. **Sonra yalnızca Dragonborn için yol 2b (derlemede palet değiştirme)**, betikle 216 jeton üretip gözle denetleyerek;
   başarısız olan jetonlar (pul tonu kumaşla karışan) için elle düzeltme ya da yol 3. Dragonborn'da soy rengi oyuncu için en
   tanımlayıcı fark (nefes türü de renge bağlı); ≈4,8 + 0,8 MB depo artışı, sayfa yükü değişmez.
3. **Drow** için istenirse yol 3 (24 görsel, ≈0,5 MB): koyu ten ve beyaz saç palet değiştirmeyle iyi çıkmaz, ayrı üretim
   daha temiz.
4. Goliath, Tiefling, High/Wood Elf ve Gnome soyları rozetle kalsın (görsel fark küçük, maliyet yüksek).

Karar kullanıcıda (görsel üretimi ve depo boyutu); `docs/SABAH-RAPORU.md` "Karar bekleyenler"de.
