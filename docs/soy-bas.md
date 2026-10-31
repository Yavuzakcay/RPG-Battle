# Soy kafa kaplaması (Görev K22)

Goliath Paladin, Fighter ve Cleric jetonlarında (kadın ve erkek) kafa, temiz bir kafa görseliyle değiştirilir ve soy
rengiyle boyanır. Kapsam veride: `data/soy-renkleri.json` `basKaplama` (`{ "goliath": ["paladin", "fighter", "cleric"] }`).
Kafa görselleri: `assets/soy-bas/goliath-kadin.png`, `assets/soy-bas/goliath-erkek.png` (yalnızca okunur). Üretim:

```powershell
npm run soy-bas      # kafa kutuları, ölçek, public/characters/bas/<jeton>.png, data/soy-bas.json
npm run soy-maske    # (soy-bas'ı da çalıştırır) ölçüm: kaplanmış kafayla
npm run soy-incele   # inceleme sayfasında "KAFA: önce · sonra"
```

## Boyutlar

- Jetonlar 256 × 256 px (pixel art yaklaşık 2× ölçekli çizilmiş).
- Kafa kutusu: ten maskesinin en üstteki bağlı bileşeni (tepe → çene). Tipik kadın kafası ≈ 56 × 63 px, erkek ≈ 47 × 58 px.
- Gelen görseller: kadın 43 × 42 px, erkek 27 × 31 px; ikisinin de arka planı **opak siyahtı** (şeffaf değil). Kenara bağlı
  saf siyah zemin şeffaflaştırılınca opak kafa kadında 28 × 33 px, erkekte 26 × 29 px.
- Görev Z1: görselin opak boyutu kutuyla ±2 px içinde eşleşirse **ölçeklenmez** (×1); değilse kutuyu örtecek kadar en yakın komşuyla ölçeklenir (≈ ×2) ve uyarı yazılır; tepesi kutunun tepesine, yatayda ortasına hizalanır,
  kutuya kırpılır. Ölçek 1'den farklı olduğu için her jetonda uyarı yazılır. **Doğrudan kullanılacak boyut:** kadın kafası
  ≈ 56 × 64 px, erkek ≈ 48 × 59 px (2× çizim); ya da şimdiki gibi 1× çizip ×2 ölçeklenmesi.

| Jeton | Gereken (kutu) | Görsel (opak) | Ölçek | Kutu | Kutuda ten oranı |
|---|---|---|---|---|---|
| `goliath-female-paladin` | 57×64 | 28×33 | ×2.04 | (119, 10) – (175, 73) | %72 |
| `goliath-female-fighter` | 57×64 | 28×33 | ×2.04 | (103, 10) – (159, 73) | %70 |
| `goliath-female-cleric` | 55×62 | 28×33 | ×1.96 | (120, 18) – (174, 79) | %73 |
| `goliath-male-paladin` | 45×56 | 26×29 | ×1.93 | (140, 16) – (184, 71) | %66 |
| `goliath-male-fighter` | 48×59 | 26×29 | ×2.03 | (119, 11) – (166, 69) | %67 |
| `goliath-male-cleric` | 48×61 | 26×29 | ×2.1 | (117, 10) – (164, 70) | %70 |

## Kurallar

- Kutu içindeki ten maskesi pikselleri şeffaflaştırılır, kafa görseli üstüne konur; kaplamanın örtmediği ten pikseli eski
  hâlinde kalır (delik açılmaz). Kutu dışındaki hiçbir piksel değişmez.
- Boyama maskesi: kutu dışında eski ten maskesi (boyun altı, kollar), kutu içinde kafa görselinin opak pikselleri (göz ve
  işaretler dahil; LCh kaydırma açıklık farklarını koruduğu için kontrast kalır).
- Dekoratif öğe denetimi: kutudaki opak piksellerin en az %50'si ten değilse jeton atlanır (kask, başlık, saç). Altı jetonda
  da kafa çıplak, hiçbiri atlanmadı.
- Kafa görseli yoksa o cinsiyette kayıt üretilmez; boyama bit bit aynı.

## Gövde boyası (Görev K23)

Kapsam kaydında `govdeBoya: false` (şu an Goliath Paladin, Fighter, Cleric): kafa kaplaması dışında soy rengi uygulanmaz; gövde, boyun ve zırh orijinal kalır. Kafa ile boyanmayan ten arasında 2 piksellik yumuşak geçiş vardır. Tek bir jetonda gövde boyasını açmak için: `"govdeBoya": { "goliath-male-fighter": true }` (verilmeyen jetonlar kapalı). Sonra `npm run soy-bas` ve `npm run soy-maske` (ölçüm).
