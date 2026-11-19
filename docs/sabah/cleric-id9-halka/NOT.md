# Cleric ID9 halka önizlemesi: 2. tur (2026-11-19; jetonlara yazılmadı, onay bekliyor)

- `once-sonra-3x.png`: 17 jeton (Tiefling kadın ID9 hariç). 4× yakın: `yakin-4x-<jeton>.png` (Tiefling erkek, Dragonborn erkek/kadın, elf kadın).
- Boynuzlu ırklar ve elf kadın: halka boynuz/saçla kesişmesin diye yukarı alındı; tuvale sığmadığı için figür küçüldü (ayak hizası sabit):
  Tiefling erkek 0,82, elf kadın 0,86, Dragonborn erkek 0,87, Dragonborn kadın 0,92. Küçültmeden en iyi yerleşimde bile kesişim kalıyordu
  (elf kadın 1096 px, Tiefling erkek 203, Dragonborn erkek 53, kadın 24). Diğer 13 jeton bir önceki önizlemeyle piksel piksel aynı.
- **Onaylanırsa ek iş:** küçülen 4 jetonun maskeleri figürle hizalı kalmaz; ten maskesi (`npm run soy-maske -- --alt`) ve Dragonborn pul maskesi
  (`python scripts/dragonborn-pul-maske.py`; bu iki jetonun `dragonborn-pul-duzeltme.json` kaydı yok) yeniden üretilmeli. Halka maskeye girmez
  (sarı-yeşil, ten/pul tonu değil). Küçültme istenmezse alternatif: bu 4 jetonda halkayı kesişimi kabul ederek bırakmak.

## Tiefling kadın Cleric jetonları (`tiefling-kadin-cleric-kontak.png`)

| Jeton | Çizim | Not |
|---|---|---|
| tiefling-female-cleric (genel) | kadın | zırh, kalkan, gürz |
| ID1 Yaşam | kadın | kanatlı beyaz cüppe |
| ID2 Aydın | kadın | güneş |
| ID3 Barış (bağlı değil) | kadın | güvercinli açık mavi cüppe |
| ID4 Demirci | kadın | çekiç |
| ID5 Fırtına | kadın | zırh, şimşek |
| ID6 Mezar | kadın | kafatası maskesi |
| ID7 Savaş | kadın | zırh, kalkan |
| ID8 Yakamoz | kadın | fener |
| ID9 Birlik Manastırı | **erkek** (yaşlı, kel, gözlüklü) | çay seti; yanlış cinsiyet |
| GR Gariban | kadın | kahverengi kaba cüppe, sopa |

**Uygun kadın Birlik Manastırı çizimi yok:** hiçbir kadın jetonda çay seti yok. Temaya en yakınlar: ID3 (barışçıl manastır cüppesi, güvercin; ama
çaydanlık/fincan yok, Barış Alanı çizimi) ve GR (kahverengi keşiş cüppesi; sopa taşıyor). İkisi de çay setini taşımıyor; Gemini'den yeniden üretim
gerekli. Jeton kopyalanmadı, uydurulmadı.
