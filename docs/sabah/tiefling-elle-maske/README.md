# Tiefling: kıyafet maskeye giriyor (elle maske önerisi)

Yalnız öneri ve önizleme. `assets/soy-maske-el/`, `public/`, `data/` ve oyun kodu değişmedi; onayınla elle maske klasörüne yazılır.
Üretim: `npx vite-node scripts/tiefling-kalan-oyun.ts <geçici> abyssal` (oyunun şimdiki çizimi, TB1/TG1 onarımı dahil), sonra `python scripts/tiefling-kalan.py <geçici>`.

## Üç jetonun önerisi

| Jeton | Şimdiki maske (TG1 sonrası) | Öneri | Çıkan | Eklenen | Yöntem |
|---|---:|---:|---:|---:|---|
| `erkek-ranger-ID9` | 5236 | 2675 | 2561 | 0 | elle kutu (gömlek, kasket, sepet) + oyun maskesi |
| `erkek-wizard-GR` | 10421 | 2610 | 8082 | 271 | ton/kroma kuralı |
| `male-rogue` | 4420 | 1955 | 2625 | 160 | ton/kroma kuralı |

- `<jeton>.png`: orijinal / şimdiki maske (macenta) / önerilen maske (macenta) / oyun şimdi (Abyssal) / öneriyle (Abyssal), 2×.
- `oneri-maske-<jeton>.png`: önerilen maske (256 px, beyaz = ten). Onaylarsan `assets/soy-maske-el/` biçimine (gri ağırlık) çevrilip yazılır.
- **Wizard GR, Rogue (male):** ten tonu jetonun kendi doygun teninden örnekleniyor. Tona ±15° yakın ve kroması ≥ max(28, 0.55 × ten kroması) olan pikseller alınıyor; ardından 3×3 kapama, < 40 px bileşen atma, ≤ 12 px delik doldurma, göz hariç. Gri-mor cüppe, şapka, kapüşon ve yüz örtüsü (kroma 16–20) dışarıda kalıyor; yüz, boynuz, kuyruk ve eller kalıyor.
- **Ranger ID9:** gömlek ve kasketin bir kısmı tenle aynı tonda (≈ 5–14°), kural ayıramıyor. Bu yüzden öneri oyun maskesinden başlıyor ve elle kutular uygulanıyor:
  - Gömlek [75, 100, 185, 152] ve sepet [170, 168, 232, 202] kutularında maske silindi.
  - Kasket [88, 12, 190, 56] kutusunda yalnız ten tonundan 12°'den fazla sapan (turuncu) pikseller silindi.
  - Koordinatlar 256 px uzayında, [x0, y0, x1, y1].

## Aynı sorunu taşıyan jetonlar (59)

Ölçüt (TG1 `tiefling-golge.csv` mantığı, komşu-maske):
- **Düşük kroma:** oyun maskesindeki kroma < 25 bileşenleri (≥ 20 px) içinde bitişik maskesi doygun ten olmayanlar (medyan kroma < `kromaKomsu` 32) kıyafet sayılıyor. Toplamı ≥ 300 px ve maskenin ≥ %15'i olan jeton listeye giriyor.
- **Ton dışı:** kroma ≥ 25 ama ten tonundan > 20° sapan maske pikseli ≥ 300 olan jeton da listeye giriyor. Bunlar çoğunlukla kahverengi-kızıl saç, kırmızı kumaş ya da kasket.

Gözle doğrulandı (ilk 16): cüppe, takım elbise, şapka, zırh ve saç gerçekten maskede. Bazı jetonlar (ör. `kadin-sorcerer-SC-5` gölge biçimi, `kadin-warlock-WL-4` ölümsüz) bütün gövdesi boyanması tartışmalı özel biçimler.

| Jeton | Maske px | Düşük kroma (kıyafet) | Ton dışı (saç/kumaş) |
|---|---:|---:|---:|
| `erkek-wizard-GR` | 10421 | 7707 (74%) | 82 |
| `kadin-bard-ID3` | 7389 | 2635 (36%) | 398 |
| `kadin-sorcerer-SC-5` | 3156 | 2942 (93%) | 0 |
| `erkek-bard-ID3` | 7979 | 2827 (35%) | 106 |
| `kadin-rogue-ID3` | 2318 | 2191 (95%) | 0 |
| `erkek-rogue-ID3` | 8815 | 1218 (14%) | 886 |
| `kadin-paladin-ID3` | 4438 | 1905 (43%) | 15 |
| `kadin-sorcerer-SC-6` | 4695 | 1301 (28%) | 597 |
| `kadin-warlock-WL-4` | 3221 | 1752 (54%) | 24 |
| `kadin-fighter-ID7` | 4007 | 1612 (40%) | 37 |
| `kadin-warlock-WL-11` | 4981 | 0 (0%) | 1430 |
| `kadin-warlock-WL-9` | 4898 | 0 (0%) | 1346 |
| `kadin-barbarian-ID3` | 4717 | 1089 (23%) | 248 |
| `kadin-monk-ID2` | 3704 | 1151 (31%) | 73 |
| `kadin-bard-ID1` | 4206 | 1144 (27%) | 76 |
| `erkek-warlock-WL-11` | 4506 | 552 (12%) | 616 |
| `erkek-fighter-ID2` | 1449 | 1156 (80%) | 0 |
| `kadin-warlock-WL-5` | 5307 | 0 (0%) | 1121 |
| `kadin-monk-ID8` | 3159 | 1086 (34%) | 21 |
| `kadin-warlock-WL-8` | 1763 | 994 (56%) | 111 |
| `erkek-warlock-WL-9` | 4655 | 41 (1%) | 1023 |
| `erkek-paladin-ID7` | 4169 | 0 (0%) | 1043 |
| `kadin-warlock-WL-2` | 4950 | 0 (0%) | 1017 |
| `kadin-monk-ID1` | 4549 | 947 (21%) | 55 |
| `kadin-bard-ID7` | 4487 | 966 (22%) | 22 |
| `kadin-monk-ID7` | 4358 | 934 (21%) | 50 |
| `erkek-warlock-WL-7` | 4065 | 30 (1%) | 923 |
| `female-rogue` | 2937 | 946 (32%) | 6 |
| `kadin-warlock-WL-3` | 4594 | 501 (11%) | 408 |
| `erkek-warlock-WL-5` | 4895 | 0 (0%) | 899 |
| `kadin-warlock-WL-1` | 4603 | 0 (0%) | 881 |
| `kadin-warlock-WL-7` | 3430 | 724 (21%) | 156 |
| `kadin-paladin-ID5` | 3938 | 72 (2%) | 770 |
| `kadin-paladin-ID7` | 3299 | 27 (1%) | 812 |
| `kadin-wizard-WZ-B5` | 3901 | 0 (0%) | 805 |
| `kadin-paladin-ID6` | 3278 | 25 (1%) | 769 |
| `female-warlock` | 3922 | 165 (4%) | 608 |
| `erkek-ranger-ID9` | 5236 | 0 (0%) | 759 |
| `kadin-paladin-ID10` | 4186 | 424 (10%) | 324 |
| `kadin-rogue-ID2` | 4386 | 410 (9%) | 338 |
| `kadin-rogue-ID10` | 4736 | 281 (6%) | 465 |
| `female-paladin` | 3457 | 414 (12%) | 316 |
| `kadin-wizard-WZ-A3` | 3561 | 580 (16%) | 147 |
| `female-sorcerer` | 4341 | 93 (2%) | 610 |
| `kadin-wizard-WZ-A2` | 4638 | 66 (1%) | 621 |
| `kadin-bard-ID4` | 3650 | 574 (16%) | 107 |
| `kadin-barbarian-ID7` | 3327 | 551 (17%) | 108 |
| `kadin-wizard-WZ-B6` | 4158 | 0 (0%) | 612 |
| `erkek-warlock-WL-1` | 4027 | 43 (1%) | 564 |
| `kadin-rogue-ID9` | 4032 | 132 (3%) | 475 |
| `erkek-warlock-WL-2` | 5096 | 27 (1%) | 552 |
| `kadin-rogue-ID6` | 4520 | 72 (2%) | 487 |
| `kadin-wizard-WZ-A1` | 4465 | 0 (0%) | 548 |
| `kadin-rogue-ID1` | 3770 | 227 (6%) | 313 |
| `kadin-wizard-WZ-B3` | 3761 | 0 (0%) | 534 |
| `kadin-paladin-ID9` | 3255 | 100 (3%) | 430 |
| `kadin-wizard-WZ-B2` | 2979 | 0 (0%) | 393 |
| `erkek-wizard-WZ-A8` | 4034 | 0 (0%) | 321 |
| `erkek-fighter-ID4` | 4811 | 0 (0%) | 314 |

## Goliath

1–3 px açık benekler boyanmıyor, olduğu gibi bırakıldı (göz akından ayırt edilemiyor; TG1 kararı).
