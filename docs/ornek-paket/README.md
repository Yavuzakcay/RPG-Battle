# Örnek dış içerik paketi (kurgusal)

`ornek-paket.json` tamamen uydurma iki alt sınıf içerir (Kehribar Muhafızı, Sis Yolcusu); gerçek bir oyunun içeriği değildir. Biçimi gösterir: `format: "rpg-battle-icerik"`, `version: 1`, paket kimliği, TR/EN adlar, alt sınıflar ve özellikler (seviye 1–20, durum `calisir` / `planli` / `hikaye` / `calismiyor`, isteğe bağlı `effect` = `data/class-features.json` mekaniği).

Kullanım:

- Uygulamada **Ayarlar → Dış içerik → Dosya seç** (mobil dahil) ya da **Klasörden yükle** (masaüstü Chromium).
- Yerel çalıştırmada (`npm run dev`) depo kökündeki `icerik/` klasörüne konan `.json` paketleri açılışta kendiliğinden yüklenir. `icerik/` ve `data/custom/` `.gitignore`'dadır: kişisel içerik depoya girmez.
- Denetim: `npm run check:icerik -- docs/ornek-paket`.

Kural: ETKİN SEVİYE = max(özellik seviyesi, 3) (alt sınıf 3. seviyede seçilir; 1–2. seviye özellikleri 3. seviyede açılır). Kod çalıştırılmaz; bilinmeyen etki türü reddedilir.

Bu dosya testteki fikstürle aynıdır (`src/content/fixtures/ornek-paket.json`; test denetler).
