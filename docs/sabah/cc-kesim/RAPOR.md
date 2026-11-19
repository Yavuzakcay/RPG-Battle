# CC toplu kesim ve yerleştirme (2026-11-19)

Kaynak: `wip/karakter-ham` dalı `assets-ham/eksikler/` (commit b345279d) → yerelde `assets-ham/karakter/`; aynı adlı eski 15 ham sayfa
(10 Warlock, Cleric erkek Tiefling, Druid Tiefling ×2, Human Fighter ×2) `assets-ham/karakter/_eski/` içinde. `wip/karakter-ham` dalında değişiklik yapılmadı.
Betik `scripts/cc-kesim.py` (adımlar `taban`, `yeni`, `duzeltme`, `diger`), defter `data/cc-kesim-kaynak.json`.

## Ne kesildi (351 jeton)

| Adım | Kaynak | Jeton | Kontak sayfası |
|---|---|---|---|
| 1 taban | `hale-gemini-sayfa-01…32` (30 yok) | 146 Celestial (haleli + halesiz-supheli) | `adim1-taban.jpg` |
| 2 yeni | 13 `gladiator-*` + 10 `warlock-*` | 20 Gladyatör (`fighter-ID12`) + 110 Warlock | `adim2-gladyator.jpg`, `adim2-warlock.jpg`, `../gladyator-sayfa/kesim-onizleme/` |
| 3 düzeltme | `hale-gemini-duzeltme-sayfa-01…03` | 20 Celestial (kesin yetkili) | `adim3-duzeltme.jpg` |
| C | Bard, Sorcerer, Druid, Cleric, Barbarian aurasız, Human Fighter | 77 | `C-*.jpg` |

Her sayfada hücre sayısı tam bulundu (beklenen boşlar: Druid erkek 8, Fighter kadın 11). Sayfa başına hücre, zemin (yeşil/macenta) ve uyarılar `adim*.json` / `C-diger.json`.

## Ne ezildi (Celestial öncelik)

Kural kodda (`ONCELIK`, `write_token`): **düzeltme > yeni sayfa > taban**; düşük öncelikli adım yüksek öncelikli kaynağın yazdığı jetonu ezmez.
Tablo `docs/sabah/celestial-oncelik.md`: 18 jetonda düzeltme tabanı, 2 jetonda (Celestial erkek Cleric ID7, ID9) `clerik-male-celestial` tabanı, 2 jetonda (Celestial Bard ID3 erkek/kadın) Bard düzeltmesi tabanı ezdi. Erkek Celestial Warlock (11) tabandan hiç işlenmedi, yeni sayfadan geldi.

## Taç (yıldız tacı) listesi

`data/hale-halesiz.json` bekleyen 149 → 8. Kalanlar: sayfa 30'un 5 hücresi (erkek Wizard WZ-B1, B2, B3, B4, B7), kadın Fighter ID3 ve ID4 (aşağıda), erkek Warlock WL-8 (Gulyabani: kullanıcı kararı, taç yok). `data/hale-konum.json` yeniden üretildi; `scripts/hale-konum.py` artık elle girilen `tac` anahtarını koruyor (önceden siliyordu).

## Eksik / belirsiz (uygulanmadı, tahmin yok)

1. **Sayfa 30 taban dosyası yok:** WZ-B1, B2, B3, B4, B7 (erkek Wizard, hücre 3, 4, 5, 6, 9) haleli kaldı. Hücre 7 (WZ-B5) düzeltme sayfa 03'ün 7. figüründen geldi.
2. **celestial-kadin-fighter-ID4** (taban 12/4): Gemini çıktısında hale silinmiş görünmüyor; kaynakta da hale gözle görülmüyor (yanlış "haleli" olabilir). Uygulanmadı; elle bakılmalı.
3. **celestial-kadin-fighter-ID3** (taban 12/3): mor kristaller macenta zeminle karışıyor, ayak hücre kenarında kırpık; kaynakla uyum 0,62. Uygulanmadı.
4. **Düzeltme sayfa 02 figür 7** (mantarlı ağaç Druid): eşleşme CSV'sinde yok; uygulanmadı.
5. **Sorcerer C figür 1 ve 7** (iki kel kafatası yüzlü Goliath): erkek ↔ kadın ayırt edilemedi; `goliath-erkek-sorcerer-SC-9` ve `goliath-kadin-sorcerer-SC-9` eski hâliyle kaldı (`docs/sabah/sorcerer-eslesme.md`).
6. **celestial-erkek-rogue-ID3** tabanda uyum düşüktü; düzeltme sayfa 03'ten geldi (çözüldü).
7. Ten maskesi: `elf-erkek-sorcerer-SC-9` yeni çizimde (zombi yüz) ten maskesi çıkmadı → Elf soy boyaması bu jetonda uygulanmaz.

## Ten kayması (Gladyatör, yalnız rapor)

`ten-denetim.md`: Tiefling kadın ΔE 15,5 (BÜYÜK, Gladyatör belirgin koyu); Orc erkek/kadın ΔE 8,5 (eşik altında ama Fighter'ların kendi aralarındaki sapmanın 2–5 katı); Goliath ve Dragonborn olağan. Düzeltme yapılmadı.

## Özel işlemler

- Barbarian ID8 erkek Celestial (düzeltme 02/1): notu "kırmızı aura tam olsun"; pembe aura Gemini sayfasında macenta zeminle birleştiği için anahtarda gidiyordu, kaynak jetondan geri kondu (7038 px).
- Taban/düzeltme: her hücre kaynak jetona alt gövde hizalamasıyla oturtuldu (Gemini'nin hafif ölçek/kayması düzeltildi); anahtarla silinen mor/pembe sanat pikselleri (kapalı bölgede) kaynaktan kurtarıldı.
- Sorcerer C: ay parıltısı kalıntısı silindi (ay kaldı).
- Dragonborn Gladyatör beyaz pullu taban; oyunda çarpma filtresi, yedek pul maskesi üretildi (pul v2 boyaması yalnız önizleme betiğinde).

## Doğrulama

- `npm run typecheck`: temiz. `npm run build`: geçti, ana parça 448,27 kB (sınır 450).
- İlgili testler (`src/ui`, `src/data`, `wizardJeton`, `baglamaKq6`): 629/629 geçti. Veri sayısı güncellenen testler: loading (+20), haleVaryant (288 → 290, bekleyen kontrolü defterden), as1cGorunum (taç yok listesi), wizardJeton (champion → ID12), baglamaKq6 (alt maske +10).
- `npm run check:harita` (PW_CHROMIUM=/opt/pw-browsers/chromium): 92/92 geçti.
- `npm run check:ses`: bulutta çalıştırılmadı (CLAUDE.md: bulutta TimeoutError); **yerelde çalıştırılacak**. Ses dosyası/verisi değişmedi.
