# Alt sınıf seçici denetimi

Üreten: `npx vite-node scripts/alt-sinif-secici-denetimi.ts`. Beklenen: 120 = 108 dış paket (`icerik/ek-<sınıf>.json`, Barış Alanı hariç) + 12 bizim (11 imza + Karadul); cinsiyet kuralları: İmparator yalnız erkek, Karadul yalnız kadın (tabloda iki cinsiyetin birleşimi sayılır).

## Durum A: icerik/ yok (mobil/APK, temiz kopya)

| Sınıf | Pakette kayıtlı | Seçicide görünen (bizim dahil) | Görünmeyenler (kimlik, TR ad, neden) |
|---|---|---|---|
| barbarian | 0 | 1 | — |
| bard | 0 | 1 | — |
| cleric | 0 | 1 | — |
| druid | 0 | 1 | — |
| fighter | 0 | 1 | — |
| monk | 0 | 1 | — |
| paladin | 0 | 1 | — |
| ranger | 0 | 1 | — |
| rogue | 0 | 1 | — |
| sorcerer | 0 | 1 | — |
| warlock | 0 | 1 | — |
| wizard | 0 | 1 | — |
| **Toplam** | **0** | **12** | |

## Durum B: icerik/ yüklü

| Sınıf | Pakette kayıtlı | Seçicide görünen (bizim dahil) | Görünmeyenler (kimlik, TR ad, neden) |
|---|---|---|---|
| barbarian | 8 | 9 | — |
| bard | 8 | 9 | — |
| cleric | 8 | 8 | `baris-alani` Barış Alanı — kaldirilan (Barış Alanı) |
| druid | 7 | 8 | — |
| fighter | 10 | 11 | — |
| monk | 10 | 11 | — |
| paladin | 9 | 10 | — |
| ranger | 8 | 9 | — |
| rogue | 9 | 10 | — |
| sorcerer | 8 | 9 | — |
| warlock | 10 | 11 | — |
| wizard | 14 | 15 | — |
| **Toplam** | **109** | **120** | |

Paket doğrulaması:

- `ek-barbarian`: geçerli
- `ek-bard`: geçerli
- `ek-cleric`: geçerli
- `ek-druid`: geçerli
- `ek-fighter`: geçerli
- `ek-monk`: geçerli
- `ek-paladin`: geçerli
- `ek-ranger`: geçerli
- `ek-rogue`: geçerli
- `ek-sorcerer`: geçerli
- `ek-warlock`: geçerli
- `ek-wizard`: geçerli

## Durum C: depodaki SRD fikstürü (12 SRD alt sınıfı) + bizim 12

| Sınıf | Pakette kayıtlı | Seçicide görünen (bizim dahil) | Görünmeyenler (kimlik, TR ad, neden) |
|---|---|---|---|
| barbarian | 1 | 2 | — |
| bard | 1 | 2 | — |
| cleric | 1 | 2 | — |
| druid | 1 | 2 | — |
| fighter | 1 | 2 | — |
| monk | 1 | 2 | — |
| paladin | 1 | 2 | — |
| ranger | 1 | 2 | — |
| rogue | 1 | 2 | — |
| sorcerer | 1 | 2 | — |
| warlock | 1 | 2 | — |
| wizard | 1 | 2 | — |
| **Toplam** | **12** | **24** | |

SRD 12 alt sınıfının hepsi kendi sınıfının seçicisinde görünür (kod yolunda süzülen yok).

## Ad / kimlik denetimi

- (bilgi) bard/imza_sair: 1 özellik çalışmıyor/planlı
- (bilgi) warlock/imza_astrolog: 1 özellik çalışmıyor/planlı

