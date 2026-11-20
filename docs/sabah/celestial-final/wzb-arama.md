# Erkek Celestial Wizard WZ-B1, B2, B3, B4, B7: halesiz hâl araması (2026-11-19)

**Sonuç: `assets-ham/` altında bulunamadı.** Bu beş figürün hale silinmiş hâli `assets-ham/karakter/`, `assets-ham/eksikler/` ve `assets-ham/karakter/_eski/` altındaki hiçbir sayfada yok.

## Yöntem

- `scripts/celestial-wzb-ara.py`: `assets-ham/` altındaki 430 görselin hepsi (hale sayfaları 01–32 (30 yok), düzeltme sayfaları 01–03, sınıf sayfaları, yamalar, `_eski/`); her sayfada figürler ayrıldı (1778 figür).
- Her figürün alt gövdesi (üst %35 hariç: hale ve baş değişse de eşleşsin diye) beş jetonla karşılaştırıldı; en yakın adaylara gözle bakıldı.

## Adaylar ve gözle sonuç

| Jeton | En yakın adaylar | Gözle |
|---|---|---|
| WZ-B1, B2, B4, B7 | `hale-gemini-sayfa-32.png` figür 2, 3, 5, 8 (eksikler/ ve karakter/ aynı dosya) | **eşleşme değil**: sayfa 32 kadın Wizard (WZ-A8, B1–B7, GR); uzun beyaz saç, kıyafetler iki cinsiyette aynı olduğu için benzerlik yüksek. Ayrıca bu sayfadaki figürler de haleli. |
| WZ-B3, B4 | `assets-ham/karakter/wizard-male-celestial-b.jpg` figür 1, 2 | gerçek kaynak sayfa (erkek Celestial Wizard B), ama **bütün figürler haleli** |
| WZ-B7 | `assets-ham/karakter/wizard-yama-male-elf-b7.jpg` | Elf erkek yaması, Celestial değil |
| — | `wizard-yama-1.png.jpg` 3. hücre | Celestial erkek WZ-B5 yaması (kara delik), hedef beş jetondan değil; haleli |

Eski hale sayfası 30 (bu beş hücreyi içeren Gemini çıktısı) klasörde yok (`docs/sabah/hale-gemini-sayfa-30.png` kullanılmadı: başka dosyanın kesilmiş hâli).

## Not: git geçmişi (assets-ham değil, yalnız bilgi)

`2360265b` (KQ6-12) commit'inde `public/characters/halesiz/` altında bu beş jetonun **programla hale silinmiş eski varyantı** var; 21513975'te (Hale silme: güçlü yöntem) kaldırılmış. Görüntü: `eski-wzb-halesiz-2360265b.png`.

| Varyant | Gözle |
|---|---|
| WZ-B1 | hale görünmüyor (rüzgâr parçacıkları) |
| WZ-B2 | başın üstünde kısa çizgi: **hale kalıntısı** |
| WZ-B3 | başın üstünde kısa çizgi: **hale kalıntısı** |
| WZ-B4 | hale görünmüyor |
| WZ-B7 | hale görünmüyor |

Bunlar ham sayfa değil, eski otomatik silme çıktısıdır. Hiçbiri uygulanmadı.
