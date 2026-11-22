# Sorcerer düzeltme sayfaları: hücre eşleşmesi (CC 2026-11-19)

Yöntem: her sayfadaki figürler okuma sırasıyla (soldan sağa, yukarıdan aşağı) bulundu (`scripts/cc-kesim.py` `cut_bodies`), sonra eski jetonla
(`public/characters/<ırk>-<cinsiyet>-sorcerer-SC-<n>.webp`) gözle karşılaştırıldı: ten rengi, saç, boynuz/kuyruk/kulak, el pozu, eşya düzeni.
Piksel benzerliği (otomatik) güvenilir çıkmadı (A'da gri Orc'u Halfling'e bağladı; yeni çizim eskisinden çok farklı), kullanılmadı.
Ölçek: eski jetonun figür boyu (aynı kompozisyon). Belirsiz olan uygulanmadı.

## A: `sorcerer-duzelt-A-sonuc.jpg` → hücre 2 (SC-2), 2×2

| Figür | Konum | Jeton | Gerekçe | Durum |
|---|---|---|---|---|
| 1 | sol üst (macenta) | orc-erkek-sorcerer-SC-2 | gri-yeşil ten, alt dişler, erkek | uygulandı |
| 2 | sağ üst | halfling-erkek-sorcerer-SC-2 | kıvırcık kahve saç, insan yüzlü küçük erkek | uygulandı |
| 3 | sol alt | human-kadin-sorcerer-SC-2 | uzun kahve saç, açık ten | uygulandı |
| 4 | sağ alt (macenta) | orc-kadin-sorcerer-SC-2 | koyu yeşil ten, örgülü saç, ellerde alev | uygulandı |

## B: `sorcerer-duzelt-B-sonuc.jpg` → hücre 3 (SC-3), 2×2

| Figür | Konum | Jeton | Gerekçe | Durum |
|---|---|---|---|---|
| 1 | sol üst | celestial-kadin-sorcerer-SC-3 | soluk beyaz ten; kitap solda, iki taş sağda, hançer sol altta (eski jetonla aynı düzen) | uygulandı |
| 2 | sağ üst | halfling-kadin-sorcerer-SC-3 | buğday ten, çıplak ayak; hançer sağda, taş/küre solda (eski jetonla aynı) | uygulandı |
| 3 | sol alt | human-kadin-sorcerer-SC-3 | soluk ten; hançer sağ üstte ve sol altta, taş sağ altta (eski jetonla aynı) | uygulandı |
| 4 | sağ alt | tiefling-kadin-sorcerer-SC-3 | kırmızı ten, boynuz, kuyruk | uygulandı |

## C: `sorcerer-duzelt-C-sonuc.jpg` → hücre 9 (SC-9), 3×3

| Figür | Konum | Jeton | Gerekçe | Durum |
|---|---|---|---|---|
| 1 | 1. satır sol | goliath-erkek-sorcerer-SC-9 *(liste sırasına göre)* | kel, kafatası yüzlü, sepet sağ elde | **belirsiz, uygulanmadı**: figür 7 ile aynı yüz ve kıyafet, cinsiyet ipucu yok; Goliath erkek ↔ kadın ayrılamıyor |
| 2 | 1. satır orta | elf-erkek-sorcerer-SC-9 | sivri kulak, uzun kahve saç, büyük parlayan ay (eski jetonla aynı) | uygulandı |
| 3 | 1. satır sağ | tiefling-erkek-sorcerer-SC-9 | boynuz, kuyruk, kısa siyah saç, erkek | uygulandı |
| 4 | 2. satır sol (macenta) | orc-erkek-sorcerer-SC-9 | alt dişler, kalkık pençe eli (eski jetonla aynı poz) | uygulandı |
| 5 | 2. satır orta | dragonborn-kadin-sorcerer-SC-9 | gagalı ejderha kafatası maskesi, beyaz kuyruk | uygulandı |
| 6 | 2. satır sağ | dwarf-kadin-sorcerer-SC-9 | turuncu örgülü saç (eski jetonla aynı) | uygulandı |
| 7 | 3. satır sol | goliath-kadin-sorcerer-SC-9 *(liste sırasına göre)* | kel, kafatası yüzlü, sepet sağ elde | **belirsiz, uygulanmadı** (bkz. figür 1) |
| 8 | 3. satır orta | human-kadin-sorcerer-SC-9 | uzun kahve saç, insan kulağı | uygulandı |
| 9 | 3. satır sağ | tiefling-kadin-sorcerer-SC-9 | boynuz, kuyruk, uzun saç, kadın | uygulandı |

Diğer yedi figür liste sırasıyla birebir örtüşüyor; 1 = Goliath erkek, 7 = Goliath kadın olması büyük olasılık ama görselden doğrulanamadı.
Onaylanırsa: `SORC_BELIRSIZ` kümesinden iki satırı silip `python3 scripts/cc-kesim.py diger` yeniden çalıştırılır.

Ay parıltısı kalıntısı (C): gövde dışındaki parçalarda (ay) zemin tonuna çalan yarı parlak pikseller silindi (`moon_clean`); silinen piksel sayıları `docs/sabah/cc-kesim/C-diger.json` `uyari`.
