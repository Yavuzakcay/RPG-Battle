# Kuyruk A notları (2026-11-20)

| İş | Sonuç | Not |
|---|---|---|
| 1. Ana parça artışı denetimi | bitti | `harita/belgeler/BUNDLE-ARTIS.md`: +10,6 kB'ın %82'si Dragonborn kanadı (KW1; `dragonborn-kanat-kok.json` 9,7 kB); tembel yükleme önerileri |
| 2. Kendi kanatlı Dragonborn jetonu | bitti | 4 jeton (Cleric ID1 ×2, Warlock WL-7 ×2); kuşkulu Ranger ID4 ×2 (kanatlı yoldaş) onay bekliyor; `harita/belgeler/DRAGONBORN-KENDI-KANAT.md` |
| 3. Control Water girdap efekti | **atlandı** | Kaynak sayfa bulunamadı (aşağıda) |
| 4. Canavar açıklamaları | bitti | 1318 özellik/eylem, 330/330 canavar, 7 parti (CR grupları + düzeltme partisi); `data/aciklamalar-tr.json` `canavar`, liste `data/canavar-ozellik.json` |

## İş 3: neden atlandı

Kullanıcının koyduğu "control-water" efekt sayfası bu bulut kapsayıcısında yok. Aranan yerler:
- `assets-ham/` (yalnız `eksikler/`, `karakter/` var; `efekt/` klasörü yok);
- `public/efekt/` (yalnız mevcut `efekt-zaman-girdap.webp`, `efekt-zemin-girdap.webp`);
- depo geçmişi (`birlesik`) ve dosya sistemi (`find / -iname "*control*water*"`).

`assets-ham/` depo dışı (gitignore). Sayfa kullanıcının bilgisayarında olmalı. Sayfa `assets-ham/efekt/` altına konup commit edilir ya da ayrı bir oturumda paylaşılırsa iş aynı tarifle yapılabilir:
- kesim `data/efekt-kesim.json`;
- canlandırma `scripts/efekt-canlandir.mjs` (halka/dönen 5–6 kare);
- bağlama `data/efekt-baglama.json` (`spellSlug` `control-water`, girdap alanı yarıçapına göre ölçek);
- renk varyantları CSS `hue-rotate`.

Mevcut `efekt-zemin-girdap.webp` yer tutucu olarak kullanılabilirdi, ama görev açıkça yeni sayfanın importunu istediği için uydurma bağlama yapılmadı.
