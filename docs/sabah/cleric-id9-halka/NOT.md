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
