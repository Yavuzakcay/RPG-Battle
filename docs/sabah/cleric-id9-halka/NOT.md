# Cleric ID9 halka önizlemesi: 3. tur (2026-11-19; jetonlara yazılmadı, onay bekliyor)

Kaynak: kullanıcı örnekleri `assets-ham/eksikler/halka-ornek-tiefling-erkek.png`, `halka-ornek-dragonborn-kadin.png` (1/4 indirgeme = jeton ölçeği).
Ölçülen kural (`scripts/cleric-id9-halka.py` `ORNEK`): halka = insan erkek halka yayı; eni kafatası eni × 0,48 (örneklerde 0,50 / 0,46), boy/en 0,68,
alt kenarı baş tepesinin 2 px altında (karakterin arkasında), yatay merkez baş merkezi + ırk payı (Tiefling −0,035, Dragonborn −0,11 × kafatası),
sonra ±12 px içinde boynuz kesişimini en aza indiren konum. **Figür küçültülmedi** (ölçek 1,0, ayak hizası aynı). Küçültmede incelen boncukların
alfası ×2 (örnekteki gibi tam parlak).

| Jeton | Halka kutusu | Yatay düzeltme px | Boynuz kesişimi px | Görünen oran | Pul maskesi ∩ halka |
|---|---|---|---|---|---|
| tiefling-erkek-cleric-ID9 | [114, 18, 149, 42] | 0 | 2 | 0.973 | — |
| tiefling-kadin-cleric-ID9 | [105, 5, 143, 31] | -8 | 2 | 0.99 | — |
| dragonborn-erkek-cleric-ID9 | [112, 37, 140, 56] | -5 | 10 | 0.892 | 0 |
| dragonborn-kadin-cleric-ID9 | [109, 29, 141, 51] | -2 | 3 | 0.97 | 0 |

Boynuz kesişimi 2–8 px: halkanın iki ucundaki ince kuyruk pikselleri boynuz kenarına değiyor (boncuklar değil); 4× görüntülerde boynuzlar halkanın
iki yanında. Dragonborn pul maskesiyle halka kesişimi 0 (eski halka silinen piksellerle de 0).

- **Tiefling kadın ID9 yeni çizim** (`tiefling-kadin-cleric-ID9-yeni.jpg`): yeşil anahtarlandı, açık yeşil buhar korundu, ölçek = Tiefling kadın
  Cleric ID1–ID8 ortanca boyu (232 px), ayak 247. satırda (diğer ID9'larla aynı). Eski jeton commit geçmişinde (`public/` değişmedi).
  **Ten maskesi:** Tiefling'de var (`public/characters/maske/tiefling-kadin-cleric-ID9.png`, eski çizimden); onaylanıp jeton yazılınca
  `npm run soy-maske -- --alt tiefling` ile yeniden üretilecek (şimdi public'e yazılmadığı için üretilmedi).
- **Elf kadın:** küçük halka saç tepesinin üstüne sığmadı (saç tepesi 8. satırda; halka kutusu [111, -9, 139, 10], üstten kırpık, görünen oran
  0.875). 2. turun 0,86 ölçekli önizlemesi kaldı (onaylanırsa ten maskesi yeniden üretilmeli).
- **Diğer 12 jeton** (insan, elf erkek, cüce, ork, gnome, goliath, halfling): 2. turla piksel piksel aynı.
- Görseller: `once-sonra-3x.png` (18 jeton), `yakin-4x-<jeton>.png` (Tiefling erkek/kadın, Dragonborn erkek/kadın, elf kadın).

## Tiefling kadın Cleric jetonları (`tiefling-kadin-cleric-kontak.png`)

2. tur tespiti: genel, ID1–ID8, GR kadın; eski ID9 erkek (yaşlı kel çizim) → yeni çizimle değiştirilecek.

## Yazıldı (2026-11-19, onaylı)

`python3 scripts/cleric-id9-yaz.py`: `aday/` içindeki 18 jeton `public/characters/` ve 96 px kopyaları `kucuk/` altına yazıldı (defter önceliği `duzeltme`).

- Dragonborn erkek: başın çevresindeki sönük yeşil kırıntılar silindi (395 px; yalnız baş bölgesi, halka kutusu ve buhar hariç).
- Elf kadın: büyük halkalı 0,86 ölçekli önizleme. Tiefling kadın: yeni çizim. İkisinin ten maskesi `npm run soy-maske -- --alt` ile yeniden üretildi (elf 2424 → 1887 px, tiefling 2574 → 3438 px). Toplu çalıştırmanın değiştirdiği kapsam dışı 8 ID9 maskesi ve rapor satırları eski hâline döndürüldü.
- Dragonborn pul maskesi ∩ halka: erkek 0 (halka 81 px), kadın 0 (halka 112 px).

## 96 px rozette halka görünürlüğü

Ölçüm: baş üstündeki sarı boncuk pikselleri (alfa > 60). Görüntü `kucuk-96px-3x.png`.

| Jeton | 256 px halka | 96 px halka | 96 px kutu | ort. alfa |
|---|---|---|---|---|
| tiefling-erkek | 136 px | 33 px | 13×8 | 139 |
| dragonborn-erkek | 87 px | 22 px | 10×6 | 134 |
| dragonborn-kadin | 125 px | 35 px | 21×11 | 141 |
| (karşılaştırma: human-erkek, büyük halka) | 804 px | 177 px | 42×22 | 174 |

Halka üçünde de seçiliyor ama soluk (yarı saydam, tek piksellik çizgi); Dragonborn erkek en zayıfı. **Öneri (uygulanmadı):** küçük halkada boncuk kalınlığı 256 px'te 1 px artırılsın (≈ 2 → 3 px) ve alfa ×2 yerine tam opak yapılsın; bu 96 px'te çizgiyi ≈ 1 px tam opak yapar, halka pikselini yaklaşık 1,5–2 katına çıkarır. Halka boyu (en %48) değişmeden boynuz kesişimi aynı kalır.

## Kalın halka (2026-11-19, öneri uygulandı)

`python3 scripts/cleric-id9-kalin.py` (rapor `kalin.json`, görüntü `kalin-96px-once-sonra.png`: üst önce, alt sonra, 96 px kopyanın baş bölgesi 6×): Tiefling erkek, Dragonborn erkek ve kadın.
Boncuk çizgisi 256 px'te içe doğru 1 px kalınlaştı, halka tam opak (yumuşak kenar atıldı). Halka kutusu ve yatay konum aynı; boynuz altına düşen yeni piksel eklenmedi, boynuz kesişimi aynı (2 / 10 / 3 px). Jetonda yalnız halka kutusu (±1 px) değişti.

| Jeton | 256 px'te eklenen | 96 px halka px (önce → sonra) | 96 px ort. alfa (önce → sonra) | Pul ∩ halka |
|---|---|---|---|---|
| tiefling-erkek | 64 px | 33 → 43 | 139 → 193 | — |
| dragonborn-erkek | 47 px | 22 → 30 | 134 → 195 | 0 |
| dragonborn-kadin | 55 px | 35 → 37 | 141 → 198 | 0 |

Dragonborn: halka kutusundaki baş pikselleri arasında pul maskesine düşen değişiklikler (yeniden birleştirmenin sıkıştırma farkı; erkek 19, kadın 15 px) yayımlı jetondaki değerine geri bırakıldı, pul maskesine dokunulmadı.

## Pul maskesi kalın halkadan sonra (2026-11-19)

`python scripts/dragonborn-pul-maske.py` (bütün Dragonborn jetonları; iki Cleric ID9 jetonu ne `dragonborn-pul-kapali.json`'da ne el düzeltmesinde, atlanmadı). Değişen dosyalar yalnız bu iki maske ve `harita/belgeler/DRAGONBORN-PUL-KAPI.md` satırları; diğer 264 maske aynı.
Görüntü `pul-maske-kalin-halka.png` (jeton | maske pembe, halka ∩ maske yeşil: yok).

| Jeton | Halka px (256) | Maske px (önce → sonra) | Değişen maske px | Pul ∩ halka |
|---|---|---|---|---|
| dragonborn-erkek-cleric-ID9 | 156 | 6262 → 5763 | 555 | **0** |
| dragonborn-kadin-cleric-ID9 | 202 | 5134 → 4843 | 425 | **0** |

Renk kapısı ikisinde de uygulandı ("kapı: taşma azaldı"; taşma tahmini erkek %6,8 → %3,4, kadın %6,7 → %5,7).
