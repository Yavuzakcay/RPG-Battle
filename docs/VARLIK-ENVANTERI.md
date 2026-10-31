# Varlık envanteri

`npm run varlik-envanter` üretir (Kuyruk 19 D0; elle düzenlenmez). Depodaki görsel, ses, video, PDF ve veri dosyaları: 1512 dosya, 254.3 MB. Kullanılmayanlar: `docs/sabah/kullanilmayan-dosyalar.md`.

Başvuru türleri: **kod** (`src/`), **test**, **veri** (`data/`), **betik** (`scripts/`, `package.json`), **belge** (`docs/`, README). "Kullanılıyor": kod/veri/test/betik başvurusu ya da addan türetilen yol (`data/varlik-desenleri.json`); `docs/`, `assets/` ve `assets-ham/` altında belge başvurusu da sayılır. Metin araması sezgiseldir: aynı adı taşıyan başka bir dosya başvuruyu "görünür" yapabilir.

## Özet

| Klasör | Dosya | Boyut | Kullanılmayan | Kullanılmayan boyut |
|---|---:|---:|---:|---:|
| `assets-ham/acilis` | 4 | 1.3 MB | 0 | — |
| `assets-ham/efektler` | 12 | 19.1 MB | 0 | — |
| `assets-ham/engeller` | 1 | 2.1 MB | 0 | — |
| `assets-ham/haritalar` | 1 | 2.1 MB | 0 | — |
| `assets-ham/logo` | 6 | 6.2 MB | 0 | — |
| `assets-ham/masumlar` | 8 | 11.9 MB | 0 | — |
| `assets-ham/ses` | 50 | 27.8 MB | 0 | — |
| `assets-ham/son-videolar` | 8 | 2.6 MB | 0 | — |
| `assets-ham/zarlar` | 63 | 84.3 MB | 62 | 82.8 MB |
| `assets/soy-bas` | 2 | 5 kB | 0 | — |
| `data` | 51 | 1.1 MB | 1 | 2 kB |
| `data/maps` | 21 | 96 kB | 0 | — |
| `data/srd` | 12 | 1021 kB | 0 | — |
| `data/yolculuk` | 2 | 2 kB | 0 | — |
| `docs` | 1 | 5.8 MB | 0 | — |
| `docs/harita` | 32 | 7.6 MB | 11 | 2.2 MB |
| `docs/sabah` | 96 | 40.6 MB | 26 | 5.1 MB |
| `public` | 1 | 4 kB | 0 | — |
| `public/acilis` | 12 | 2.9 MB | 0 | — |
| `public/characters` | 606 | 6.1 MB | 0 | — |
| `public/efektler` | 13 | 716 kB | 0 | — |
| `public/ikon` | 1 | 25 kB | 0 | — |
| `public/logo` | 8 | 379 kB | 0 | — |
| `public/maps` | 30 | 2.5 MB | 0 | — |
| `public/masumlar` | 8 | 59 kB | 0 | — |
| `public/monsters` | 352 | 6.2 MB | 0 | — |
| `public/ses` | 67 | 16.8 MB | 0 | — |
| `public/son` | 12 | 4.5 MB | 0 | — |
| `public/sprites` | 25 | 293 kB | 0 | — |
| `public/zarlar` | 7 | 72 kB | 0 | — |

## `assets-ham/acilis`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `assets-ham/acilis/acilis-mobil-dark.mp4` | 611 kB | betik: ham kaynak (npm run acilis); test: `src/ui/menuBackground.test.ts` | kullanılıyor |
| `assets-ham/acilis/acilis-mobil-light.mp4` | 235 kB | betik: ham kaynak (npm run acilis) | kullanılıyor |
| `assets-ham/acilis/acilis-pc-dark.mp4` | 253 kB | betik: ham kaynak (npm run acilis) | kullanılıyor |
| `assets-ham/acilis/acilis-pc-light.mp4` | 229 kB | betik: ham kaynak (npm run acilis); test: `src/ui/menuBackground.test.ts` | kullanılıyor |

## `assets-ham/efektler`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `assets-ham/efektler/acid.jpg` | 1.6 MB | belge: `assets-ham/efektler/README.md` | kullanılıyor |
| `assets-ham/efektler/bleed.jpg` | 1.3 MB | belge: `assets-ham/efektler/README.md` | kullanılıyor |
| `assets-ham/efektler/burn.jpg` | 1.7 MB | belge: `assets-ham/efektler/README.md` | kullanılıyor |
| `assets-ham/efektler/charmed.jpg` | 1.6 MB | belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; veri: `data/efekt-sprites.json`; +9 | kullanılıyor |
| `assets-ham/efektler/freeze.jpg` | 2.0 MB | belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; veri: `data/efekt-sprites.json`; +10 | kullanılıyor |
| `assets-ham/efektler/frightened.jpg` | 1.7 MB | belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; veri: `data/efekt-sprites.json`; +9 | kullanılıyor |
| `assets-ham/efektler/grappled.jpg` | 1.9 MB | belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; veri: `data/efekt-sprites.json`; +13 | kullanılıyor |
| `assets-ham/efektler/incapacitated.jpg` | 1.6 MB | belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; veri: `data/efekt-sprites.json`; +8 | kullanılıyor |
| `assets-ham/efektler/paralyzed.jpg` | 1.7 MB | belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; veri: `data/efekt-sprites.json`; +8 | kullanılıyor |
| `assets-ham/efektler/poison.jpg` | 411 kB | belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; veri: `data/attack-riders.json`; +45 | kullanılıyor |
| `assets-ham/efektler/restrained.jpg` | 1.8 MB | belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; veri: `data/attack-riders.json`; +14 | kullanılıyor |
| `assets-ham/efektler/stunned.jpg` | 1.7 MB | belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; veri: `data/efekt-sprites.json`; +10 | kullanılıyor |

## `assets-ham/engeller`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `assets-ham/engeller/engel-melodi.jpg` | 2.1 MB | belge: `DECISIONS.md`; belge: `assets-ham/engeller/README.md`; veri: `data/efekt-sprites.json`; +2 | kullanılıyor |

## `assets-ham/haritalar`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `assets-ham/haritalar/orman-gece.jpg` | 2.1 MB | belge: `DECISIONS.md`; veri: `data/sim-senaryolar.json`; belge: `docs/harita/DENGE.md` | kullanılıyor |

## `assets-ham/logo`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `assets-ham/logo/logo-acilis.jpg` | 1.4 MB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; belge: `docs/SABAH-RAPORU.md`; +1 | kullanılıyor |
| `assets-ham/logo/logo-masaustu.jpg` | 1.4 MB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; betik: `scripts/logo.ts`; +1 | kullanılıyor |
| `assets-ham/logo/logo-mobil-zarsiz.jpg` | 1.4 MB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; belge: `docs/SABAH-RAPORU.md`; +1 | kullanılıyor |
| `assets-ham/logo/logo-mobil.jpg` | 1.4 MB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; betik: `scripts/logo.ts`; +1 | kullanılıyor |
| `assets-ham/logo/uretilen/acilis-kapali.webp` | 60 kB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; veri: `data/logo.json`; +2 | kullanılıyor |
| `assets-ham/logo/uretilen/ikon-1024.png` | 528 kB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; veri: `data/logo.json`; +1 | kullanılıyor |

## `assets-ham/masumlar`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `assets-ham/masumlar/masum-1.jpg` | 1.5 MB | belge: `DECISIONS.md`; veri: `data/masumlar.json`; betik: `scripts/masumlar.mjs` | kullanılıyor |
| `assets-ham/masumlar/masum-2.jpg` | 1.5 MB | veri: `data/masumlar.json` | kullanılıyor |
| `assets-ham/masumlar/masum-3.jpg` | 1.4 MB | veri: `data/masumlar.json`; test: `src/battle/civilians.test.ts` | kullanılıyor |
| `assets-ham/masumlar/masum-4.jpg` | 1.5 MB | veri: `data/masumlar.json` | kullanılıyor |
| `assets-ham/masumlar/masum-5.jpg` | 1.5 MB | veri: `data/masumlar.json` | kullanılıyor |
| `assets-ham/masumlar/masum-6.jpg` | 1.6 MB | veri: `data/masumlar.json` | kullanılıyor |
| `assets-ham/masumlar/masum-7.jpg` | 1.4 MB | veri: `data/masumlar.json` | kullanılıyor |
| `assets-ham/masumlar/masum-8.jpg` | 1.4 MB | veri: `data/masumlar.json` | kullanılıyor |

## `assets-ham/ses`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `assets-ham/ses/menu-dark.mp3` | 4.5 MB | belge: `DECISIONS.md`; veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; +3 | kullanılıyor |
| `assets-ham/ses/menu-light.mp3` | 4.5 MB | belge: `DECISIONS.md`; veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; +3 | kullanılıyor |
| `assets-ham/ses/muzik-savas-gece.mp3` | 3.2 MB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json`; +2 | kullanılıyor |
| `assets-ham/ses/muzik-savas-gunduz.mp3` | 3.1 MB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json`; +2 | kullanılıyor |
| `assets-ham/ses/ortam-ada-firtinali-a.mp3` | 323 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-ada-firtinali-b.mp3` | 300 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-ada-gunesli-a.mp3` | 307 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-ada-gunesli-b.mp3` | 247 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-bataklik-a.mp3` | 232 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-bataklik-b.mp3` | 280 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-col-firtina-a.mp3` | 308 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-col-firtina-b.mp3` | 272 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-col-gunduz-a.mp3` | 301 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-col-gunduz-b.mp3` | 304 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-dag-kis-a.mp3` | 300 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-dag-kis-b.mp3` | 301 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-dag-yaz-a.mp3` | 367 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-dag-yaz-b.mp3` | 335 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-dungeon-a.mp3` | 320 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-dungeon-b.mp3` | 338 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-gemi-firtinali-a.mp3` | 301 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-gemi-firtinali-b.mp3` | 292 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-gemi-gunesli-a.mp3` | 314 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-gemi-gunesli-b.mp3` | 265 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-kale-gece-a.mp3` | 304 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-kale-gece-b.mp3` | 348 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-kale-gunduz-a.mp3` | 327 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-kale-gunduz-b.mp3` | 319 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-magara-a.mp3` | 340 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-magara-b.mp3` | 314 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-orman-gece-a.mp3` | 318 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-orman-gece-b.mp3` | 307 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-orman-gunduz-a.mp3` | 326 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-orman-gunduz-b.mp3` | 257 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-sehir-meydani-gece-a.mp3` | 302 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-sehir-meydani-gece-b.mp3` | 308 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-sehir-meydani-gunduz-a.mp3` | 298 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-sehir-meydani-gunduz-b.mp3` | 325 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-taverna-a.mp3` | 329 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-taverna-b.mp3` | 317 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `assets-ham/ses/ortam-volkan-a.mp3` | 302 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json`; betik: `scripts/ses-kontrol.mjs`; +1 | kullanılıyor |
| `assets-ham/ses/ortam-volkan-b.mp3` | 322 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json`; betik: `scripts/ses-kontrol.mjs`; +1 | kullanılıyor |
| `assets-ham/ses/son-yenilgi.mp3` | 148 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/ses-klipler.json`; +3 | kullanılıyor |
| `assets-ham/ses/son-zafer.mp3` | 102 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/ses-klipler.json`; +4 | kullanılıyor |
| `assets-ham/ses/zar-coklu.mp3` | 206 kB | belge: `DECISIONS.md`; veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; +3 | kullanılıyor |
| `assets-ham/ses/zar-dur.mp3` | 238 kB | belge: `DECISIONS.md`; veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; +4 | kullanılıyor |
| `assets-ham/ses/zar-kritik-hata.mp3` | 63 kB | belge: `DECISIONS.md`; veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; +1 | kullanılıyor |
| `assets-ham/ses/zar-kritik.mp3` | 88 kB | belge: `DECISIONS.md`; veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; +2 | kullanılıyor |
| `assets-ham/ses/zar-sekme.mp3` | 75 kB | belge: `DECISIONS.md`; veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; +2 | kullanılıyor |
| `assets-ham/ses/zar-tekli.mp3` | 83 kB | belge: `DECISIONS.md`; veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; +3 | kullanılıyor |

## `assets-ham/son-videolar`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `assets-ham/son-videolar/son-bozgun-poster.jpg` | 18 kB | betik: ham kaynak (npm run son-video); test: `src/ui/endVideo.test.tsx` | kullanılıyor |
| `assets-ham/son-videolar/son-bozgun.mp4` | 477 kB | betik: ham kaynak (npm run son-video); belge: `DECISIONS.md`; veri: `data/son-video.json` | kullanılıyor |
| `assets-ham/son-videolar/son-defeat-poster.jpg` | 9 kB | betik: ham kaynak (npm run son-video); test: `src/ui/endVideo.test.tsx` | kullanılıyor |
| `assets-ham/son-videolar/son-defeat.mp4` | 266 kB | betik: ham kaynak (npm run son-video); belge: `DECISIONS.md`; veri: `data/son-video.json`; test: `src/ui/endVideo.test.tsx` | kullanılıyor |
| `assets-ham/son-videolar/son-victory-poster.jpg` | 23 kB | betik: ham kaynak (npm run son-video) | kullanılıyor |
| `assets-ham/son-videolar/son-victory.mp4` | 892 kB | betik: ham kaynak (npm run son-video); belge: `DECISIONS.md`; veri: `data/son-video.json` | kullanılıyor |
| `assets-ham/son-videolar/son-zafer-poster.jpg` | 23 kB | betik: ham kaynak (npm run son-video); test: `src/ui/endVideo.test.tsx` | kullanılıyor |
| `assets-ham/son-videolar/son-zafer.mp4` | 995 kB | betik: ham kaynak (npm run son-video); belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/ses-klipler.json`; +5 | kullanılıyor |

## `assets-ham/zarlar`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `assets-ham/zarlar/zar-altin.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-bronz.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-beholder.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-bosluk.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-couatl.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-dev.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-devoruer.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-ejderha.jpg` | 1.7 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-flumph.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-gibbering.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-iblis.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-illithid.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-lich.jpg` | 1.7 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-dusman-tarrasque.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-elmas.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-epoksi.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-gokkusagi.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-gumus.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-ada.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-bataklik.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-col.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-coral.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-cyberpunk.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-dag.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-dungeon.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-gemi.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-kale.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-magara.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-orman.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-sehir.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-space.jpg` | 462 kB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-taverna.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-harita-volkan.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-inci.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-irk-celestial.jpg` | 1.4 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-irk-dragonborn.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-irk-dwarf.jpg` | 424 kB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-irk-elf.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-irk-gnome.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-irk-goliath.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-irk-halfling.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-irk-human.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-irk-orc.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-irk-tiefling.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-item-kum-saati.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-item-potion.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-klasik.jpg` | 1.6 MB | belge: `DECISIONS.md` | kullanılıyor |
| `assets-ham/zarlar/zar-oltu-tasi.jpg` | 1.4 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-safir.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-barbarian.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-bard.jpg` | 416 kB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-cleric.jpg` | 1.3 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-druid.jpg` | 1.3 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-fighter.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-monk.jpg` | 1.2 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-paladin.jpg` | 1.3 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-ranger.jpg` | 1.1 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-rogue.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-sorcerer.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-warlock.jpg` | 1.6 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-sinif-wizard.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-yakut.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |
| `assets-ham/zarlar/zar-zumrut.jpg` | 1.5 MB | betik: işlenmemiş zar teması (npm run zarlar; data/zar-gorselleri.json'da yok) | **kullanılmıyor** |

## `assets/soy-bas`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `assets/soy-bas/goliath-erkek.png` | 2 kB | veri: `data/soy-bas.json`; belge: `docs/soy-bas.md` | kullanılıyor |
| `assets/soy-bas/goliath-kadin.png` | 3 kB | veri: `data/soy-bas.json`; belge: `docs/soy-bas.md` | kullanılıyor |

## `data`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `data/aciklamalar.json` | 43 kB | belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; kod: `src/screens/Builder.tsx`; +2 | kullanılıyor |
| `data/acilis-ekrani.json` | 2 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; +6 | kullanılıyor |
| `data/alarm.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/maps/kale-baskini.json`; +6 | kullanılıyor |
| `data/armor.json` | 1 kB | belge: `DECISIONS.md`; belge: `docs/SEVIYE-DENETIMI.md`; betik: `scripts/srd-ayristir.mjs`; +3 | kullanılıyor |
| `data/attack-riders.json` | 63 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/harita/DENGE.md`; +7 | kullanılıyor |
| `data/backgrounds.json` | 3 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/srd/backgrounds.json`; +11 | kullanılıyor |
| `data/canavar-turleri.json` | 10 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; kod: `src/battle/create.ts`; +1 | kullanılıyor |
| `data/class-features.json` | 57 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/subclasses.json`; +23 | kullanılıyor |
| `data/classes.json` | 8 kB | belge: `DECISIONS.md`; veri: `data/sinif-buyuleri.json`; veri: `data/spells.json`; +28 | kullanılıyor |
| `data/condition-effects.json` | 5 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/attack-riders.json`; +9 | kullanılıyor |
| `data/conditions.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/aciklamalar.json`; +95 | kullanılıyor |
| `data/cr-tahmini.json` | 1 kB | belge: `DECISIONS.md`; test: `src/rules/crEstimate.test.ts`; kod: `src/rules/crEstimate.ts` | kullanılıyor |
| `data/efekt-sprites.json` | 3 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; +7 | kullanılıyor |
| `data/environments.json` | 7 kB | belge: `DECISIONS.md`; belge: `docs/harita/DENGE.md`; belge: `docs/harita/GOREV.md`; +6 | kullanılıyor |
| `data/ev-kurallari.json` | 2 kB | belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; kod: `src/battle/houseRules.ts`; +3 | kullanılıyor |
| `data/gecis.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; kod: `src/battle/phase.ts`; +2 | kullanılıyor |
| `data/harita-referans.json` | 10 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; +12 | kullanılıyor |
| `data/items.json` | 5 kB | belge: `DECISIONS.md`; belge: `docs/SEVIYE-DENETIMI.md`; kod: `src/data/index.ts`; +3 | kullanılıyor |
| `data/kural-surumu.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/DURUM-DENETIMI.md`; +2 | kullanılıyor |
| `data/logo.json` | 10 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; +4 | kullanılıyor |
| `data/masumlar.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/harita/DENGE.md`; +21 | kullanılıyor |
| `data/monster-ortamlari.json` | 68 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/canavar-turleri.json`; +4 | kullanılıyor |
| `data/monster-reactions.json` | 6 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/SEVIYE-DENETIMI.md`; +2 | kullanılıyor |
| `data/monsters.json` | 472 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/attack-riders.json`; +28 | kullanılıyor |
| `data/nesneler.json` | 4 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/spells.json`; +19 | kullanılıyor |
| `data/races.json` | 14 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/harita/ALT-IRK-GORSEL.md`; +4 | kullanılıyor |
| `data/seferler.json` | 7 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; +7 | kullanılıyor |
| `data/ses-adlari.json` | 2 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md` | **kullanılmıyor** |
| `data/ses-klipler.json` | 11 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/ses.json`; +4 | kullanılıyor |
| `data/ses.json` | 6 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/son-video.json`; +4 | kullanılıyor |
| `data/sim-partiler.json` | 32 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; +3 | kullanılıyor |
| `data/sim-senaryolar.json` | 17 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/seferler.json`; +6 | kullanılıyor |
| `data/sinif-buyuleri.json` | 30 kB | belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; kod: `src/rules/spellList.ts` | kullanılıyor |
| `data/son-video.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/varlik-desenleri.json`; +5 | kullanılıyor |
| `data/soy-bas.json` | 3 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/soy-renkleri.json`; +10 | kullanılıyor |
| `data/soy-maske-rapor.json` | 4 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; betik: `scripts/soy-bas.ts`; +4 | kullanılıyor |
| `data/soy-olcum.json` | 41 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; betik: `scripts/soy-maske.ts`; +1 | kullanılıyor |
| `data/soy-renkleri.json` | 16 kB | belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; belge: `docs/soy-bas.md`; +10 | kullanılıyor |
| `data/spell-slots.json` | 2 kB | belge: `DECISIONS.md`; belge: `docs/SEVIYE-DENETIMI.md`; kod: `src/data/index.ts`; +1 | kullanılıyor |
| `data/spells.json` | 120 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/aciklamalar.json`; +89 | kullanılıyor |
| `data/sprite-esleme.json` | 4 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; +3 | kullanılıyor |
| `data/sprite-mevcut.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/sprite-esleme.json`; +3 | kullanılıyor |
| `data/stealth.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/backgrounds.json`; +37 | kullanılıyor |
| `data/subclasses.json` | 57 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/aciklamalar.json`; +27 | kullanılıyor |
| `data/summons.json` | 8 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/srd/magic-items.json`; +15 | kullanılıyor |
| `data/tasima.json` | 1 kB | belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; test: `src/rules/carry.test.ts`; +2 | kullanılıyor |
| `data/token-sizes.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/harita/COKLU-ALTIGEN.md`; +6 | kullanılıyor |
| `data/varlik-desenleri.json` | 2 kB | betik: `scripts/varlik-envanter.mjs` | kullanılıyor |
| `data/weapons.json` | 8 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/aciklamalar.json`; +53 | kullanılıyor |
| `data/yuzeyler.json` | 3 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; +6 | kullanılıyor |
| `data/zar-gorselleri.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/varlik-desenleri.json`; +3 | kullanılıyor |

## `data/maps`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `data/maps/ada.json` | 3 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob) | kullanılıyor |
| `data/maps/bataklik.json` | 3 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `assets-ham/harita/README.md`; veri: `data/monster-ortamlari.json`; veri: `data/ses.json`; +8 | kullanılıyor |
| `data/maps/col.json` | 2 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `docs/harita/GOREV.md` | kullanılıyor |
| `data/maps/dag.json` | 6 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob) | kullanılıyor |
| `data/maps/dungeon.json` | 10 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `DECISIONS.md`; veri: `data/monster-ortamlari.json`; veri: `data/ses-adlari.json`; +13 | kullanılıyor |
| `data/maps/gemi.json` | 5 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob) | kullanılıyor |
| `data/maps/isinlanma-salonu.json` | 4 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/harita-referans.json`; +8 | kullanılıyor |
| `data/maps/kale-avlu.json` | 3 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `DECISIONS.md`; veri: `data/harita-referans.json`; veri: `data/monster-ortamlari.json`; +10 | kullanılıyor |
| `data/maps/kale-baskini.json` | 8 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/harita-referans.json`; +12 | kullanılıyor |
| `data/maps/kale.json` | 6 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob) | kullanılıyor |
| `data/maps/kanyon-koprusu.json` | 4 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/harita-referans.json`; +8 | kullanılıyor |
| `data/maps/lav-tapinagi.json` | 3 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/harita-referans.json`; +8 | kullanılıyor |
| `data/maps/magara-genis.json` | 2 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `DECISIONS.md`; veri: `data/harita-referans.json`; veri: `data/monster-ortamlari.json`; +8 | kullanılıyor |
| `data/maps/magara.json` | 2 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `DECISIONS.md`; veri: `data/maps/magara-genis.json`; veri: `data/monster-ortamlari.json`; +14 | kullanılıyor |
| `data/maps/orman-yolu.json` | 3 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `DECISIONS.md`; veri: `data/harita-referans.json`; veri: `data/monster-ortamlari.json`; +12 | kullanılıyor |
| `data/maps/orman.json` | 4 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob) | kullanılıyor |
| `data/maps/ortamlar-diyari.json` | 7 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/monster-ortamlari.json`; +5 | kullanılıyor |
| `data/maps/sehir-meydani.json` | 5 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); veri: `data/monster-ortamlari.json`; veri: `data/ses.json`; belge: `docs/CANAVAR-KATEGORILERI.md`; +6 | kullanılıyor |
| `data/maps/taverna.json` | 4 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `DECISIONS.md`; veri: `data/monster-ortamlari.json`; veri: `data/ses-adlari.json`; +14 | kullanılıyor |
| `data/maps/volkan.json` | 8 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `assets-ham/harita/README.md`; +47 | kullanılıyor |
| `data/maps/volkanik-demirhane.json` | 5 kB | kod: harita kaydı (src/map/maps.ts import.meta.glob); belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/harita-referans.json`; +8 | kullanılıyor |

## `data/srd`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `data/srd/armor.json` | 5 kB | belge: `DECISIONS.md`; belge: `docs/SEVIYE-DENETIMI.md`; betik: `scripts/srd-ayristir.mjs`; +3 | kullanılıyor |
| `data/srd/backgrounds.json` | 2 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/backgrounds.json`; +11 | kullanılıyor |
| `data/srd/classes.json` | 218 kB | belge: `DECISIONS.md`; veri: `data/sinif-buyuleri.json`; veri: `data/spells.json`; +27 | kullanılıyor |
| `data/srd/feats.json` | 15 kB | belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md`; betik: `scripts/srd-ayristir.mjs`; +6 | kullanılıyor |
| `data/srd/gear.json` | 30 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; betik: `scripts/srd-ayristir.mjs`; +1 | kullanılıyor |
| `data/srd/magic-items.json` | 219 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/items.json`; +6 | kullanılıyor |
| `data/srd/progression.json` | 90 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/class-features.json`; +15 | kullanılıyor |
| `data/srd/rapor.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; betik: `scripts/srd-ayristir.mjs` | kullanılıyor |
| `data/srd/species.json` | 11 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/class-features.json`; +12 | kullanılıyor |
| `data/srd/spells.json` | 375 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/aciklamalar.json`; +89 | kullanılıyor |
| `data/srd/subclasses.json` | 39 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/aciklamalar.json`; +27 | kullanılıyor |
| `data/srd/weapons.json` | 16 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/aciklamalar.json`; +53 | kullanılıyor |

## `data/yolculuk`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `data/yolculuk/ayarlar.json` | 1 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/sprite-esleme.json`; +16 | kullanılıyor |
| `data/yolculuk/ilk-gun.json` | 1 kB | belge: `DECISIONS.md`; test: `src/journey/app.test.ts`; test: `src/journey/engine.test.ts`; +1 | kullanılıyor |

## `docs`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `docs/SRD_CC_v5.2.1.pdf` | 5.8 MB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/srd/armor.json`; +14 | kullanılıyor |

## `docs/harita`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `docs/harita/ornek/col-aksam.jpg` | 252 kB | belge: `docs/harita/ornek/hareket-prototipi.html` | kullanılıyor |
| `docs/harita/ornek/col-gunduz.jpg` | 281 kB | belge: `docs/harita/ornek/hareket-prototipi.html` | kullanılıyor |
| `docs/harita/ornek/ver_ada.jpg` | 200 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/ver_bataklik.jpg` | 206 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/ver_buzul.jpg` | 171 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/ver_dag.jpg` | 203 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/ver_dungeon.jpg` | 180 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/ver_gemi.jpg` | 228 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/ver_hazine.jpg` | 313 kB | belge: `DECISIONS.md`; belge: `docs/harita/ornek/GOREV-DUNGEON-MERDIVEN-HAZINE.md` | kullanılıyor |
| `docs/harita/ornek/ver_kale.jpg` | 173 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/ver_magara.jpg` | 187 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/ver_merdiven.jpg` | 275 kB | belge: `DECISIONS.md`; belge: `docs/harita/ornek/GOREV-DUNGEON-MERDIVEN-HAZINE.md` | kullanılıyor |
| `docs/harita/ornek/ver_orman.jpg` | 192 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/ver_sehir-meydani.jpg` | 279 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/ver_taverna.jpg` | 227 kB | — | **kullanılmıyor** |
| `docs/harita/ornek/volkan.jpg` | 291 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `assets-ham/harita/README.md`; +47 | kullanılıyor |
| `docs/harita/referans/kale/kale-avlu-izgarasiz.png` | 188 kB | belge: `docs/harita/referans/kale/kale-avlu-prompt.md` | kullanılıyor |
| `docs/harita/referans/kale/kale-avlu.png` | 519 kB | belge: `DECISIONS.md`; veri: `data/harita-referans.json`; veri: `data/maps/kale-avlu.json`; +11 | kullanılıyor |
| `docs/harita/referans/kale/kale-baskini-izgarasiz.png` | 215 kB | belge: `docs/harita/referans/kale/kale-baskini-prompt.md` | kullanılıyor |
| `docs/harita/referans/kale/kale-baskini.png` | 536 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/harita-referans.json`; +13 | kullanılıyor |
| `docs/harita/referans/orman/orman-yol-izgarasiz.png` | 248 kB | belge: `docs/harita/referans/orman/orman-yol-prompt.md` | kullanılıyor |
| `docs/harita/referans/orman/orman-yol.png` | 576 kB | veri: `data/maps/orman-yolu.json`; belge: `docs/harita/referans/orman/orman-yol-prompt.md` | kullanılıyor |
| `docs/harita/referans/volkan/volkan-demirhane-izgarasiz.png` | 138 kB | belge: `docs/harita/referans/volkan/volkan-demirhane-prompt.md` | kullanılıyor |
| `docs/harita/referans/volkan/volkan-demirhane.png` | 486 kB | veri: `data/maps/volkanik-demirhane.json`; belge: `docs/harita/referans/volkan/volkan-demirhane-prompt.md`; betik: `scripts/sefer-haritalar.py` | kullanılıyor |
| `docs/harita/referans/volkan/volkan-kopru-izgarasiz.png` | 73 kB | belge: `docs/harita/referans/volkan/volkan-kopru-prompt.md` | kullanılıyor |
| `docs/harita/referans/volkan/volkan-kopru.png` | 239 kB | veri: `data/maps/kanyon-koprusu.json`; belge: `docs/harita/referans/volkan/volkan-kopru-prompt.md`; betik: `scripts/sefer-haritalar.py` | kullanılıyor |
| `docs/harita/referans/volkan/volkan-portal-salonu-izgarasiz.png` | 89 kB | belge: `docs/harita/referans/volkan/volkan-portal-salonu-prompt.md` | kullanılıyor |
| `docs/harita/referans/volkan/volkan-portal-salonu.png` | 253 kB | veri: `data/maps/isinlanma-salonu.json`; belge: `docs/harita/referans/volkan/volkan-portal-salonu-prompt.md`; betik: `scripts/sefer-haritalar.py`; +1 | kullanılıyor |
| `docs/harita/referans/volkan/volkan-tapinak-izgarasiz.png` | 75 kB | belge: `docs/harita/referans/volkan/volkan-tapinak-prompt.md` | kullanılıyor |
| `docs/harita/referans/volkan/volkan-tapinak.png` | 247 kB | veri: `data/maps/lav-tapinagi.json`; belge: `docs/harita/referans/volkan/volkan-tapinak-prompt.md`; betik: `scripts/sefer-haritalar.py` | kullanılıyor |
| `docs/harita/referans/yeralti/yeralti-magara-genis-izgarasiz.png` | 69 kB | belge: `docs/harita/referans/yeralti/yeralti-magara-genis-prompt.md` | kullanılıyor |
| `docs/harita/referans/yeralti/yeralti-magara-genis.png` | 220 kB | veri: `data/maps/magara-genis.json`; belge: `docs/harita/referans/yeralti/yeralti-magara-genis-prompt.md` | kullanılıyor |

## `docs/sabah`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `docs/sabah/b1-zirh-buyu.png` | 983 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/b4-savas-disi.jpg` | 155 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/cila-hizli-eylem.jpg` | 219 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/drow-paletleri.png` | 625 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/g1-gecmis.png` | 350 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/h-slot-ranger-buyu-menusu.jpg` | 173 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/h1-genis-1280.png` | 936 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/h1-genis-390.png` | 197 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/h1-genis-844.png` | 600 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/h2-genis-haritalar.png` | 1.3 MB | belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k1-puanlar-masaustu.jpg` | 148 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k1-puanlar-mobil.jpg` | 132 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k13-goliath-soy-rozeti.png` | 545 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k13b-yuzey-araci-masaustu.png` | 1.2 MB | — | **kullanılmıyor** |
| `docs/sabah/k13b-yuzey-araci-mobil.png` | 443 kB | — | **kullanılmıyor** |
| `docs/sabah/k15-soylar.png` | 1009 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k15c-oyun-ici.png` | 1.3 MB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k15c-patlama.png` | 886 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k15c-sprite-alanlar.png` | 909 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k15c-zehir-yakin.png` | 269 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16-puanlar.png` | 670 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16a-su-buz-sinir.png` | 881 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16a-yag-alev-sinir.png` | 471 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16a-yuzeyler.png` | 1015 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16a-zehir-yakin.png` | 314 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16b-col-magara.png` | 761 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16b-genel.png` | 841 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16b-kale-dag.png` | 723 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16b-kar-volkan.png` | 829 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16b-meydan-alt.png` | 617 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16b-meydan-ust.png` | 617 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k16b-orman-bataklik.png` | 663 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k18-ozellikler.png` | 366 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k18-ustalik.png` | 117 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k19-soylar.png` | 373 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k20-ilerleme.png` | 723 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k21-drow.png` | 301 kB | — | **kullanılmıyor** |
| `docs/sabah/k21-inceleme.png` | 398 kB | — | **kullanılmıyor** |
| `docs/sabah/k22-goliath.png` | 177 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k23-goliath.png` | 313 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k24-ham-maske.png` | 49 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k2a-zarla.png` | 673 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k3-karakter-masaustu.jpg` | 146 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k3-karakter-mobil.jpg` | 49 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k4-ilerleme-masaustu.jpg` | 146 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k4-ilerleme-mobil.jpg` | 46 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k5-donanim-masaustu.jpg` | 162 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k5-donanim-mobil.jpg` | 59 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k6-buyuler-masaustu.jpg` | 168 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k6-buyuler-mobil.jpg` | 46 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k8b-dragonborn-soy.png` | 539 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k9d-zirh-uyari.png` | 591 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/k9e-gecmis-bonusu.png` | 724 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/kb-kale-baskini.png` | 505 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/kb-kurulum.png` | 241 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/l6-kanat-koku-once.jpg` | 38 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-kanat-koku-sonra.jpg` | 38 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-once-masaustu-0060.jpg` | 52 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-once-masaustu-0120.jpg` | 51 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-once-masaustu-0700.jpg` | 63 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-once-masaustu-2000.jpg` | 67 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-once-mobil-0700.jpg` | 18 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-sonra-masaustu-0060.jpg` | 48 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-sonra-masaustu-0120.jpg` | 49 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-sonra-masaustu-0700.jpg` | 63 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-sonra-masaustu-2000.jpg` | 67 kB | — | **kullanılmıyor** |
| `docs/sabah/l6-sonra-mobil-0700.jpg` | 18 kB | — | **kullanılmıyor** |
| `docs/sabah/l7-deney-A-maske.jpg` | 207 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/l7-deney-B-zarsiz.jpg` | 224 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/l7-omuz-dark-masaustu.jpg` | 113 kB | — | **kullanılmıyor** |
| `docs/sabah/l7-omuz-dark-mobil.jpg` | 79 kB | — | **kullanılmıyor** |
| `docs/sabah/l7-omuz-light-masaustu.jpg` | 113 kB | — | **kullanılmıyor** |
| `docs/sabah/l7-omuz-light-mobil.jpg` | 79 kB | — | **kullanılmıyor** |
| `docs/sabah/l7-once-masaustu-koyu.jpg` | 134 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/l7-sonra-masaustu-koyu.jpg` | 134 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/m1-masaustu-acik.png` | 939 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/m1-masaustu.png` | 756 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/m1-mobil.png` | 314 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/m2-mini-harita-masaustu.png` | 403 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/m2-mini-harita-mobil.png` | 184 kB | — | **kullanılmıyor** |
| `docs/sabah/n1-ad.png` | 940 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/r1-rozetsiz.png` | 540 kB | — | **kullanılmıyor** |
| `docs/sabah/s2-nesneler.png` | 1.2 MB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/s3-hedefler.png` | 1.2 MB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/sorcerer-metamagic.png` | 43 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/sp1-sprite.png` | 937 kB | belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/u3-son-video.png` | 402 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/v1-isinlanma-salonu-izgara.png` | 253 kB | — | **kullanılmıyor** |
| `docs/sabah/v1-kanyon-koprusu-izgara.png` | 239 kB | — | **kullanılmıyor** |
| `docs/sabah/v1-lav-tapinagi-izgara.png` | 247 kB | — | **kullanılmıyor** |
| `docs/sabah/v1-volkanik-demirhane-izgara.png` | 486 kB | — | **kullanılmıyor** |
| `docs/sabah/v4-sefer-ekrani.png` | 273 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/warlock-invocations.png` | 89 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/y1-yolculuk.png` | 945 kB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/y1-yuzeyler.png` | 1.2 MB | belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `docs/sabah/z1-renk.png` | 449 kB | belge: `DECISIONS.md`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |

## `public`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/favicon.ico` | 4 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; +4 | kullanılıyor |

## `public/acilis`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/acilis/acilis-mobil-dark.mp4` | 581 kB | kod: menü videosu (src/ui/MenuBackground.tsx); test: `src/ui/menuBackground.test.ts` | kullanılıyor |
| `public/acilis/acilis-mobil-dark.webm` | 503 kB | kod: menü videosu (src/ui/MenuBackground.tsx); test: `src/ui/menuBackground.test.ts` | kullanılıyor |
| `public/acilis/acilis-mobil-dark.webp` | 57 kB | kod: menü videosu (src/ui/MenuBackground.tsx); kod: `index.html`; test: `src/ui/menuBackground.test.ts` | kullanılıyor |
| `public/acilis/acilis-mobil-light.mp4` | 370 kB | kod: menü videosu (src/ui/MenuBackground.tsx) | kullanılıyor |
| `public/acilis/acilis-mobil-light.webm` | 394 kB | kod: menü videosu (src/ui/MenuBackground.tsx) | kullanılıyor |
| `public/acilis/acilis-mobil-light.webp` | 39 kB | kod: menü videosu (src/ui/MenuBackground.tsx); kod: `index.html` | kullanılıyor |
| `public/acilis/acilis-pc-dark.mp4` | 239 kB | kod: menü videosu (src/ui/MenuBackground.tsx) | kullanılıyor |
| `public/acilis/acilis-pc-dark.webm` | 210 kB | kod: menü videosu (src/ui/MenuBackground.tsx) | kullanılıyor |
| `public/acilis/acilis-pc-dark.webp` | 26 kB | kod: menü videosu (src/ui/MenuBackground.tsx); kod: `index.html` | kullanılıyor |
| `public/acilis/acilis-pc-light.mp4` | 209 kB | kod: menü videosu (src/ui/MenuBackground.tsx); test: `src/ui/menuBackground.test.ts` | kullanılıyor |
| `public/acilis/acilis-pc-light.webm` | 258 kB | kod: menü videosu (src/ui/MenuBackground.tsx); test: `src/ui/menuBackground.test.ts` | kullanılıyor |
| `public/acilis/acilis-pc-light.webp` | 54 kB | kod: menü videosu (src/ui/MenuBackground.tsx); kod: `index.html`; test: `src/ui/menuBackground.test.ts` | kullanılıyor |

## `public/characters`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/characters/bas/goliath-female-cleric.png` | 3 kB | kod: kafa kaplaması (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/bas/goliath-female-fighter.png` | 3 kB | kod: kafa kaplaması (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/bas/goliath-female-paladin.png` | 3 kB | kod: kafa kaplaması (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/bas/goliath-male-cleric.png` | 3 kB | kod: kafa kaplaması (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/bas/goliath-male-fighter.png` | 3 kB | kod: kafa kaplaması (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +6 | kullanılıyor |
| `public/characters/bas/goliath-male-paladin.png` | 3 kB | kod: kafa kaplaması (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +4 | kullanılıyor |
| `public/characters/celestial-female-barbarian.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-bard.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-cleric.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-druid.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-fighter.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-monk.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-paladin.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-ranger.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-rogue.webp` | 18 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-sorcerer.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-warlock.webp` | 26 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-female-wizard.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-barbarian.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-bard.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-cleric.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-druid.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-fighter.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-monk.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-paladin.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); test: `src/ui/avatar.test.ts` | kullanılıyor |
| `public/characters/celestial-male-ranger.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-rogue.webp` | 17 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-sorcerer.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-warlock.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/celestial-male-wizard.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dragonborn-female-barbarian.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/dragonborn-female-bard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/dragonborn-female-cleric.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/dragonborn-female-druid.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/dragonborn-female-fighter.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/dragonborn-female-monk.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/dragonborn-female-paladin.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/ui/headOverlay.test.ts` | kullanılıyor |
| `public/characters/dragonborn-female-ranger.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/dragonborn-female-rogue.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/dragonborn-female-sorcerer.webp` | 26 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/dragonborn-female-warlock.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/dragonborn-female-wizard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/dragonborn-male-barbarian.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/dragonborn-male-bard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/dragonborn-male-cleric.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/dragonborn-male-druid.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/dragonborn-male-fighter.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/dragonborn-male-monk.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/dragonborn-male-paladin.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/dragonborn-male-ranger.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/dragonborn-male-rogue.webp` | 18 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/dragonborn-male-sorcerer.webp` | 26 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/dragonborn-male-warlock.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/dragonborn-male-wizard.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/dwarf-female-barbarian.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-bard.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-cleric.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-druid.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-fighter.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-monk.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-paladin.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-ranger.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-rogue.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-sorcerer.webp` | 29 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-warlock.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-female-wizard.webp` | 28 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-barbarian.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-bard.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-cleric.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-druid.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-fighter.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); test: `src/ui/avatar.test.ts` | kullanılıyor |
| `public/characters/dwarf-male-monk.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-paladin.webp` | 27 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-ranger.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-rogue.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-sorcerer.webp` | 27 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-warlock.webp` | 26 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/dwarf-male-wizard.webp` | 28 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/elf-female-barbarian.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/elf-female-bard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-female-cleric.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-female-druid.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-female-fighter.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-female-monk.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/elf-female-paladin.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-female-ranger.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-female-rogue.webp` | 17 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-female-sorcerer.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/elf-female-warlock.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-female-wizard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/ui/avatar.test.ts`; +1 | kullanılıyor |
| `public/characters/elf-male-barbarian.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/elf-male-bard.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-male-cleric.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-male-druid.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-male-fighter.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/screens/wizard.test.tsx` | kullanılıyor |
| `public/characters/elf-male-monk.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/elf-male-paladin.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-male-ranger.webp` | 18 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-male-rogue.webp` | 17 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-male-sorcerer.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/elf-male-warlock.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/elf-male-wizard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/ui/avatar.test.ts` | kullanılıyor |
| `public/characters/gnome-female-barbarian.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/gnome-female-bard.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-female-cleric.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-female-druid.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-female-fighter.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-female-monk.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-female-paladin.webp` | 28 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-female-ranger.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/gnome-female-rogue.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-female-sorcerer.webp` | 33 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-female-warlock.webp` | 30 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-female-wizard.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-barbarian.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-bard.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-cleric.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-druid.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-fighter.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-monk.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-paladin.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-ranger.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-rogue.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-sorcerer.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-warlock.webp` | 29 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/gnome-male-wizard.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-female-barbarian.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/goliath-female-bard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-female-cleric.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/goliath-female-druid.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-female-fighter.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/goliath-female-monk.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-female-paladin.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/goliath-female-ranger.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-female-rogue.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/goliath-female-sorcerer.webp` | 27 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-female-warlock.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-female-wizard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-male-barbarian.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +4 | kullanılıyor |
| `public/characters/goliath-male-bard.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-male-cleric.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/goliath-male-druid.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-male-fighter.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +6 | kullanılıyor |
| `public/characters/goliath-male-monk.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-male-paladin.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/goliath-male-ranger.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-male-rogue.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/goliath-male-sorcerer.webp` | 26 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-male-warlock.webp` | 27 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/goliath-male-wizard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/halfling-female-barbarian.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-bard.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-cleric.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-druid.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-fighter.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-monk.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-paladin.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-ranger.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-rogue.webp` | 18 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-sorcerer.webp` | 26 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-warlock.webp` | 30 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-female-wizard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-barbarian.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-bard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-cleric.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-druid.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-fighter.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-monk.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-paladin.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-ranger.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-rogue.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-sorcerer.webp` | 27 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-warlock.webp` | 32 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/halfling-male-wizard.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-barbarian.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-bard.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-cleric.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-druid.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-fighter.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); test: `src/screens/wizard.test.tsx` | kullanılıyor |
| `public/characters/human-female-monk.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-paladin.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-ranger.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-rogue.webp` | 17 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-sorcerer.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-warlock.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-female-wizard.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-barbarian.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-bard.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-cleric.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-druid.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-fighter.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); test: `src/screens/wizard.test.tsx` | kullanılıyor |
| `public/characters/human-male-monk.webp` | 18 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-paladin.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-ranger.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-rogue.webp` | 17 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-sorcerer.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-warlock.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/human-male-wizard.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); test: `src/screens/wizard.test.tsx` | kullanılıyor |
| `public/characters/kucuk/celestial-female-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-bard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-cleric.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-female-wizard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); test: `src/ui/avatar.test.ts` | kullanılıyor |
| `public/characters/kucuk/celestial-male-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-rogue.webp` | 2 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-sorcerer.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/celestial-male-wizard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-cleric.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-paladin.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/ui/headOverlay.test.ts` | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-warlock.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-female-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-barbarian.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-cleric.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-paladin.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/dragonborn-male-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/kucuk/dwarf-female-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-bard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-cleric.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-fighter.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-ranger.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-sorcerer.webp` | 5 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-female-wizard.webp` | 5 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-bard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-cleric.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-fighter.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); test: `src/ui/avatar.test.ts` | kullanılıyor |
| `public/characters/kucuk/dwarf-male-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-ranger.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/dwarf-male-wizard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/elf-female-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/kucuk/elf-female-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-female-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-female-druid.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-female-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-female-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/kucuk/elf-female-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-female-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-female-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-female-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/kucuk/elf-female-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-female-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/ui/avatar.test.ts`; +1 | kullanılıyor |
| `public/characters/kucuk/elf-male-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/kucuk/elf-male-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-male-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-male-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-male-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/screens/wizard.test.tsx` | kullanılıyor |
| `public/characters/kucuk/elf-male-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/kucuk/elf-male-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-male-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-male-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-male-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/kucuk/elf-male-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/elf-male-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/ui/avatar.test.ts` | kullanılıyor |
| `public/characters/kucuk/gnome-female-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-bard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-cleric.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-fighter.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-monk.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-paladin.webp` | 5 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-sorcerer.webp` | 6 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-warlock.webp` | 5 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-female-wizard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-bard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-cleric.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-fighter.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-monk.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-ranger.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-warlock.webp` | 5 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/gnome-male-wizard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-female-barbarian.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/kucuk/goliath-female-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-female-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/kucuk/goliath-female-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-female-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/kucuk/goliath-female-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-female-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/kucuk/goliath-female-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-female-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/kucuk/goliath-female-sorcerer.webp` | 5 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-female-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-female-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-male-barbarian.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +4 | kullanılıyor |
| `public/characters/kucuk/goliath-male-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-male-cleric.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/kucuk/goliath-male-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-male-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +6 | kullanılıyor |
| `public/characters/kucuk/goliath-male-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-male-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/kucuk/goliath-male-ranger.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-male-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/kucuk/goliath-male-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-male-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/goliath-male-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/halfling-female-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-paladin.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-warlock.webp` | 5 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-female-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-paladin.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-ranger.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-sorcerer.webp` | 5 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-warlock.webp` | 5 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/halfling-male-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-bard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); test: `src/screens/wizard.test.tsx` | kullanılıyor |
| `public/characters/kucuk/human-female-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-rogue.webp` | 2 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-female-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-bard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); test: `src/screens/wizard.test.tsx` | kullanılıyor |
| `public/characters/kucuk/human-male-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-paladin.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-sorcerer.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/human-male-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); test: `src/screens/wizard.test.tsx` | kullanılıyor |
| `public/characters/kucuk/orc-female-barbarian.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-druid.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-sorcerer.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-female-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/orc-male-wizard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx) | kullanılıyor |
| `public/characters/kucuk/tiefling-female-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-bard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-cleric.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-paladin.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-warlock.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/ui/avatar.test.ts` | kullanılıyor |
| `public/characters/kucuk/tiefling-female-wizard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-barbarian.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-bard.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-cleric.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-druid.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-fighter.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-monk.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-paladin.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-ranger.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-rogue.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-sorcerer.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-warlock.webp` | 3 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/kucuk/tiefling-male-wizard.webp` | 4 kB | kod: küçük rozet (src/ui/Avatar.tsx); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/dragonborn-female-barbarian.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md`; +1 | kullanılıyor |
| `public/characters/maske/dragonborn-female-bard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/dragonborn-female-cleric.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/dragonborn-female-druid.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/maske/dragonborn-female-fighter.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/dragonborn-female-monk.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/maske/dragonborn-female-paladin.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/ui/headOverlay.test.ts` | kullanılıyor |
| `public/characters/maske/dragonborn-female-ranger.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/dragonborn-female-rogue.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/dragonborn-female-sorcerer.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/maske/dragonborn-female-warlock.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/dragonborn-female-wizard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/dragonborn-male-barbarian.png` | 2 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/maske/dragonborn-male-bard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/maske/dragonborn-male-cleric.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/dragonborn-male-druid.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/maske/dragonborn-male-fighter.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/dragonborn-male-monk.png` | 2 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/maske/dragonborn-male-paladin.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/dragonborn-male-ranger.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/dragonborn-male-rogue.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/dragonborn-male-sorcerer.png` | 2 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/dragonborn-male-warlock.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/dragonborn-male-wizard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/elf-female-barbarian.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/maske/elf-female-bard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-female-cleric.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-female-druid.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-female-fighter.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-female-monk.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/maske/elf-female-paladin.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-female-ranger.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-female-rogue.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/soy-maske-el.md` | kullanılıyor |
| `public/characters/maske/elf-female-sorcerer.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/maske/elf-female-warlock.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-female-wizard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-male-barbarian.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/maske/elf-male-bard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-male-cleric.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-male-druid.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-male-fighter.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-male-monk.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/maske/elf-male-paladin.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-male-ranger.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-male-rogue.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-male-sorcerer.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/characters/maske/elf-male-warlock.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/elf-male-wizard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-female-barbarian.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/gnome-female-bard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-female-cleric.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-female-druid.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-female-fighter.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-female-monk.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-female-paladin.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-female-ranger.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/gnome-female-rogue.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-female-sorcerer.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-female-warlock.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-female-wizard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-barbarian.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-bard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-cleric.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-druid.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-fighter.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-monk.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-paladin.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-ranger.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-rogue.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-sorcerer.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-warlock.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/gnome-male-wizard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-female-barbarian.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +1 | kullanılıyor |
| `public/characters/maske/goliath-female-bard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-female-cleric.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/maske/goliath-female-druid.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-female-fighter.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/maske/goliath-female-monk.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-female-paladin.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/maske/goliath-female-ranger.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-female-rogue.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/goliath-female-sorcerer.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-female-warlock.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-female-wizard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-male-barbarian.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json`; +4 | kullanılıyor |
| `public/characters/maske/goliath-male-bard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-male-cleric.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +3 | kullanılıyor |
| `public/characters/maske/goliath-male-druid.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-male-fighter.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +6 | kullanılıyor |
| `public/characters/maske/goliath-male-monk.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-male-paladin.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-bas.json`; veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; +4 | kullanılıyor |
| `public/characters/maske/goliath-male-ranger.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-male-rogue.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/goliath-male-sorcerer.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-male-warlock.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/goliath-male-wizard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-barbarian.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-bard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-cleric.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-druid.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-fighter.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-monk.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-paladin.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-ranger.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-rogue.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-sorcerer.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-warlock.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-female-wizard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-barbarian.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-bard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-cleric.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-druid.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-fighter.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-monk.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-paladin.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-ranger.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-rogue.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-sorcerer.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-warlock.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/maske/tiefling-male-wizard.png` | 1 kB | kod: ten maskesi (src/ui/tint.ts); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/orc-female-barbarian.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-bard.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-cleric.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-druid.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-fighter.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-monk.webp` | 18 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-paladin.webp` | 26 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-ranger.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-rogue.webp` | 17 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-sorcerer.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-warlock.webp` | 26 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-female-wizard.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-barbarian.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-bard.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-cleric.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-druid.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-fighter.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-monk.webp` | 18 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-paladin.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-ranger.webp` | 18 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-rogue.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-sorcerer.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-warlock.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/orc-male-wizard.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile) | kullanılıyor |
| `public/characters/tiefling-female-barbarian.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-female-bard.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-female-cleric.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-female-druid.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-female-fighter.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-female-monk.webp` | 18 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-female-paladin.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-female-ranger.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-female-rogue.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-female-sorcerer.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-female-warlock.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; test: `src/ui/avatar.test.ts` | kullanılıyor |
| `public/characters/tiefling-female-wizard.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |
| `public/characters/tiefling-male-barbarian.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-bard.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-cleric.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-druid.webp` | 25 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-fighter.webp` | 21 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-monk.webp` | 19 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-paladin.webp` | 23 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-ranger.webp` | 20 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-rogue.webp` | 18 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-sorcerer.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-warlock.webp` | 22 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json` | kullanılıyor |
| `public/characters/tiefling-male-wizard.webp` | 24 kB | kod: jeton yolu (src/battle/avatar.ts characterTokenFile); veri: `data/soy-maske-rapor.json`; veri: `data/soy-olcum.json`; veri: `data/soy-renkleri.json` | kullanılıyor |

## `public/efektler`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/efektler/acid.webp` | 28 kB | veri: `data/efekt-sprites.json` | kullanılıyor |
| `public/efektler/bleed.webp` | 12 kB | veri: `data/efekt-sprites.json` | kullanılıyor |
| `public/efektler/burn.webp` | 31 kB | veri: `data/efekt-sprites.json` | kullanılıyor |
| `public/efektler/charmed.webp` | 36 kB | belge: `DECISIONS.md`; veri: `data/efekt-sprites.json`; veri: `data/spells.json`; +8 | kullanılıyor |
| `public/efektler/engel-melodi.webp` | 166 kB | belge: `DECISIONS.md`; belge: `assets-ham/engeller/README.md`; veri: `data/efekt-sprites.json`; +2 | kullanılıyor |
| `public/efektler/freeze.webp` | 39 kB | belge: `DECISIONS.md`; veri: `data/efekt-sprites.json`; belge: `docs/SABAH-RAPORU.md`; +9 | kullanılıyor |
| `public/efektler/frightened.webp` | 76 kB | belge: `DECISIONS.md`; veri: `data/efekt-sprites.json`; veri: `data/spells.json`; +8 | kullanılıyor |
| `public/efektler/grappled.webp` | 91 kB | belge: `DECISIONS.md`; veri: `data/efekt-sprites.json`; betik: `scripts/efektler.mjs`; +12 | kullanılıyor |
| `public/efektler/incapacitated.webp` | 29 kB | belge: `DECISIONS.md`; veri: `data/efekt-sprites.json`; veri: `data/spells.json`; +7 | kullanılıyor |
| `public/efektler/paralyzed.webp` | 60 kB | belge: `DECISIONS.md`; veri: `data/efekt-sprites.json`; veri: `data/spells.json`; +7 | kullanılıyor |
| `public/efektler/poison.webp` | 21 kB | belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/condition-effects.json`; +44 | kullanılıyor |
| `public/efektler/restrained.webp` | 95 kB | belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/efekt-sprites.json`; +13 | kullanılıyor |
| `public/efektler/stunned.webp` | 32 kB | belge: `DECISIONS.md`; veri: `data/efekt-sprites.json`; betik: `scripts/efektler.mjs`; +9 | kullanılıyor |

## `public/ikon`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/ikon/apple-touch-icon.png` | 25 kB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; veri: `data/logo.json`; +4 | kullanılıyor |

## `public/logo`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/logo/acilis-govde.webp` | 43 kB | belge: `assets-ham/logo/README.md`; veri: `data/logo.json`; kod: `index.html`; +1 | kullanılıyor |
| `public/logo/acilis-kanat-sag.webp` | 26 kB | belge: `assets-ham/logo/README.md`; veri: `data/logo.json`; kod: `index.html`; +1 | kullanılıyor |
| `public/logo/acilis-kanat-sol.webp` | 27 kB | belge: `assets-ham/logo/README.md`; veri: `data/logo.json`; kod: `index.html`; +1 | kullanılıyor |
| `public/logo/acilis-kapali-govde.webp` | 45 kB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; veri: `data/acilis-ekrani.json`; +5 | kullanılıyor |
| `public/logo/acilis-kapali-kanat.webp` | 42 kB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; veri: `data/acilis-ekrani.json`; +5 | kullanılıyor |
| `public/logo/acilis-yazi.webp` | 31 kB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; veri: `data/logo.json`; +2 | kullanılıyor |
| `public/logo/logo-acilis.webp` | 112 kB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; veri: `data/logo.json`; +5 | kullanılıyor |
| `public/logo/logo-masaustu.webp` | 52 kB | belge: `DECISIONS.md`; belge: `assets-ham/logo/README.md`; veri: `data/logo.json`; +2 | kullanılıyor |

## `public/maps`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/maps/bataklik/bataklik-klasik.webp` | 118 kB | veri: `data/maps/bataklik.json` | kullanılıyor |
| `public/maps/col/col-klasik-aksam.webp` | 67 kB | veri: `data/maps/col.json` | kullanılıyor |
| `public/maps/col/col-klasik.webp` | 80 kB | veri: `data/maps/col.json` | kullanılıyor |
| `public/maps/dag/dag-klasik-kis.webp` | 72 kB | veri: `data/maps/dag.json` | kullanılıyor |
| `public/maps/dag/dag-klasik.webp` | 101 kB | veri: `data/maps/dag.json` | kullanılıyor |
| `public/maps/deniz/deniz-ada-firtina.webp` | 84 kB | veri: `data/maps/ada.json` | kullanılıyor |
| `public/maps/deniz/deniz-ada.webp` | 108 kB | veri: `data/maps/ada.json` | kullanılıyor |
| `public/maps/deniz/deniz-gemi-firtina.webp` | 99 kB | veri: `data/maps/gemi.json` | kullanılıyor |
| `public/maps/deniz/deniz-gemi.webp` | 126 kB | veri: `data/maps/gemi.json` | kullanılıyor |
| `public/maps/kale/kale-avlu.webp` | 73 kB | belge: `DECISIONS.md`; veri: `data/harita-referans.json`; veri: `data/maps/kale-avlu.json`; +11 | kullanılıyor |
| `public/maps/kale/kale-baskini.webp` | 78 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/harita-referans.json`; +13 | kullanılıyor |
| `public/maps/kale/kale-klasik-gece.webp` | 56 kB | veri: `data/maps/kale.json` | kullanılıyor |
| `public/maps/kale/kale-klasik.webp` | 70 kB | veri: `data/harita-referans.json`; veri: `data/maps/kale.json`; belge: `docs/harita/gorsel-sartnamesi.md`; +2 | kullanılıyor |
| `public/maps/orman/orman-klasik-gece.webp` | 72 kB | veri: `data/maps/orman.json` | kullanılıyor |
| `public/maps/orman/orman-klasik.webp` | 102 kB | veri: `data/harita-referans.json`; veri: `data/maps/orman.json`; belge: `docs/harita/gorsel-sartnamesi.md`; +1 | kullanılıyor |
| `public/maps/orman/orman-yol.webp` | 95 kB | veri: `data/maps/orman-yolu.json` | kullanılıyor |
| `public/maps/sehir/sehir-meydani-gece.webp` | 132 kB | veri: `data/maps/sehir-meydani.json` | kullanılıyor |
| `public/maps/sehir/sehir-meydani.webp` | 231 kB | veri: `data/maps/sehir-meydani.json`; veri: `data/monster-ortamlari.json`; veri: `data/ses.json`; +7 | kullanılıyor |
| `public/maps/sehir/sehir-taverna.webp` | 109 kB | veri: `data/maps/taverna.json` | kullanılıyor |
| `public/maps/vitrin/vitrin-ortamlar-diyari.webp` | 78 kB | veri: `data/maps/ortamlar-diyari.json` | kullanılıyor |
| `public/maps/volkan/volkan-boss.webp` | 112 kB | veri: `data/harita-referans.json`; veri: `data/maps/volkan.json`; veri: `data/seferler.json`; +4 | kullanılıyor |
| `public/maps/volkan/volkan-demirhane.webp` | 62 kB | veri: `data/maps/volkanik-demirhane.json`; veri: `data/seferler.json`; betik: `scripts/sefer-haritalar.py` | kullanılıyor |
| `public/maps/volkan/volkan-kopru.webp` | 34 kB | veri: `data/maps/kanyon-koprusu.json`; veri: `data/seferler.json`; betik: `scripts/sefer-haritalar.py` | kullanılıyor |
| `public/maps/volkan/volkan-portal-salonu.webp` | 34 kB | veri: `data/maps/isinlanma-salonu.json`; veri: `data/seferler.json`; betik: `scripts/sefer-haritalar.py`; +1 | kullanılıyor |
| `public/maps/volkan/volkan-tapinak.webp` | 31 kB | veri: `data/maps/lav-tapinagi.json`; veri: `data/seferler.json`; betik: `scripts/sefer-haritalar.py` | kullanılıyor |
| `public/maps/yeralti/yeralti-magara-genis.webp` | 26 kB | veri: `data/maps/magara-genis.json` | kullanılıyor |
| `public/maps/yeralti/yeralti-magara.webp` | 91 kB | veri: `data/harita-referans.json`; veri: `data/maps/magara.json`; belge: `docs/harita/gorsel-sartnamesi.md`; +1 | kullanılıyor |
| `public/maps/yeralti/yeralti-zindan-hazine.webp` | 103 kB | veri: `data/maps/dungeon.json` | kullanılıyor |
| `public/maps/yeralti/yeralti-zindan-merdiven.webp` | 62 kB | veri: `data/maps/dungeon.json` | kullanılıyor |
| `public/maps/yeralti/yeralti-zindan.webp` | 69 kB | veri: `data/maps/dungeon.json` | kullanılıyor |

## `public/masumlar`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/masumlar/masum-1.webp` | 8 kB | belge: `DECISIONS.md`; veri: `data/masumlar.json`; betik: `scripts/masumlar.mjs` | kullanılıyor |
| `public/masumlar/masum-2.webp` | 7 kB | veri: `data/masumlar.json` | kullanılıyor |
| `public/masumlar/masum-3.webp` | 9 kB | veri: `data/masumlar.json`; test: `src/battle/civilians.test.ts` | kullanılıyor |
| `public/masumlar/masum-4.webp` | 8 kB | veri: `data/masumlar.json` | kullanılıyor |
| `public/masumlar/masum-5.webp` | 6 kB | veri: `data/masumlar.json` | kullanılıyor |
| `public/masumlar/masum-6.webp` | 9 kB | veri: `data/masumlar.json` | kullanılıyor |
| `public/masumlar/masum-7.webp` | 6 kB | veri: `data/masumlar.json` | kullanılıyor |
| `public/masumlar/masum-8.webp` | 5 kB | veri: `data/masumlar.json` | kullanılıyor |

## `public/monsters`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/monsters/aboleth.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/adult-black-dragon.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/adult-blue-dragon.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/adult-brass-dragon.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/adult-bronze-dragon.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/adult-copper-dragon.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/adult-gold-dragon-uyku.webp` | 24 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/adult-gold-dragon.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/adult-green-dragon.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/adult-red-dragon-uyku.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/adult-red-dragon.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; +7 | kullanılıyor |
| `public/monsters/adult-silver-dragon.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/adult-white-dragon.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/air-elemental.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/allosaurus.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ancient-black-dragon.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ancient-blue-dragon.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/ancient-brass-dragon.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ancient-bronze-dragon.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ancient-copper-dragon.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ancient-gold-dragon-uyku.webp` | 24 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/ancient-gold-dragon.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ancient-green-dragon.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ancient-red-dragon-uyku.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/ancient-red-dragon.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/maps/volkan.json`; +5 | kullanılıyor |
| `public/monsters/ancient-silver-dragon.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ancient-white-dragon.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/animated-armor.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/animated-flying-sword.webp` | 11 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/animated-rug-of-smothering.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ankheg.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ankylosaurus.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ape.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/archelon.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/archmage.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monster-reactions.json`; +1 | kullanılıyor |
| `public/monsters/assassin.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/awakened-shrub.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/awakened-tree.webp` | 24 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/axe-beak.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/azer-sentinel.webp` | 25 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/baboon.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/badger.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/balor.webp` | 26 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/bandit-captain-uyku.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/bandit-captain.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monster-reactions.json`; +3 | kullanılıyor |
| `public/monsters/bandit-uyku.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/bandit.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/barbed-devil.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/basilisk.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/bat.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/bearded-devil.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +3 | kullanılıyor |
| `public/monsters/behir.webp` | 26 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/berserker.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/black-bear.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/black-dragon-wyrmling.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/black-pudding.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/blink-dog.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/blood-hawk.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/blue-dragon-wyrmling.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/boar.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/bone-devil.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/brass-dragon-wyrmling.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/bronze-dragon-wyrmling.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/brown-bear-uyku.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/brown-bear.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/bugbear-stalker.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/bugbear-warrior.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +5 | kullanılıyor |
| `public/monsters/bulette.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/camel.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/cat.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/centaur-trooper.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/chain-devil.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +3 | kullanılıyor |
| `public/monsters/chimera.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/chuul.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/clay-golem.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/cloaker.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/cloud-giant.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/cockatrice.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +4 | kullanılıyor |
| `public/monsters/commoner.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/constrictor-snake.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/copper-dragon-wyrmling.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/couatl.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/crab.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/crocodile.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/cultist-fanatic.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; +4 | kullanılıyor |
| `public/monsters/cultist.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; +5 | kullanılıyor |
| `public/monsters/darkmantle.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +3 | kullanılıyor |
| `public/monsters/death-dog.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/deer.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/deva.webp` | 27 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/dire-wolf-uyku.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/dire-wolf.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +3 | kullanılıyor |
| `public/monsters/djinni.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/doppelganger.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/draft-horse.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/dragon-turtle.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/dretch.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +2 | kullanılıyor |
| `public/monsters/drider.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/druid.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/dryad.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/dust-mephit.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/eagle.webp` | 12 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/earth-elemental.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/efreeti.webp` | 24 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/elephant.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/elk.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/erinyes.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/ettercap.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +4 | kullanılıyor |
| `public/monsters/ettin.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/fire-elemental.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/fire-giant.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/flesh-golem.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/flying-snake.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/frog.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/frost-giant.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/gargoyle.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/gelatinous-cube.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ghast.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/ghost.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/ghoul.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/giant-ape.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-badger.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/giant-bat.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/giant-boar.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-centipede.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-constrictor-snake.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-crab.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-crocodile.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-eagle.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-elk.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-fire-beetle.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/giant-frog.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-goat.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-hyena.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/giant-lizard.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/giant-octopus.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/giant-owl.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/giant-rat.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/giant-scorpion.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/giant-seahorse.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-shark.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/giant-spider.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +7 | kullanılıyor |
| `public/monsters/giant-toad.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-venomous-snake.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-vulture.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +2 | kullanılıyor |
| `public/monsters/giant-wasp.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/giant-weasel.webp` | 12 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/giant-wolf-spider.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/gibbering-mouther.webp` | 24 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/glabrezu.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/gladiator.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/gnoll-warrior.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/goat.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/goblin-boss.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +4 | kullanılıyor |
| `public/monsters/goblin-minion.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/goblin-warrior-uyku.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/goblin-warrior.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +8 | kullanılıyor |
| `public/monsters/gold-dragon-wyrmling-uyku.webp` | 24 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/gold-dragon-wyrmling.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/gorgon.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/gray-ooze.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/green-dragon-wyrmling.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/green-hag.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/grick.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/griffon.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +3 | kullanılıyor |
| `public/monsters/grimlock.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/guard-captain.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/guard.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/guardian-naga.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/half-dragon.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/harpy.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/hawk.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/hell-hound-uyku.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/hell-hound.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; +7 | kullanılıyor |
| `public/monsters/hezrou.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/hill-giant-uyku.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/hill-giant.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +6 | kullanılıyor |
| `public/monsters/hippogriff.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/hippopotamus.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/hobgoblin-captain.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/hobgoblin-warrior-uyku.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/hobgoblin-warrior.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +3 | kullanılıyor |
| `public/monsters/homunculus.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +2 | kullanılıyor |
| `public/monsters/horned-devil.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +2 | kullanılıyor |
| `public/monsters/hunter-shark.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/hydra.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/hyena.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/ice-devil.webp` | 24 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/ice-mephit.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/imp.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/incubus.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/invisible-stalker.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/iron-golem.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/jackal.webp` | 12 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/killer-whale.webp` | 11 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/knight.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +7 | kullanılıyor |
| `public/monsters/kobold-warrior.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +3 | kullanılıyor |
| `public/monsters/kraken.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/lamia.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/lemure.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/lich.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/lion.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/lizard.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/mage.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/magma-mephit.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; +4 | kullanılıyor |
| `public/monsters/magmin.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; +5 | kullanılıyor |
| `public/monsters/mammoth.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/manticore.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/marilith.webp` | 25 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/mastiff.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/medusa.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/merfolk-skirmisher.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/merrow.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +3 | kullanılıyor |
| `public/monsters/mimic.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/minotaur-of-baphomet-uyku.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/minotaur-of-baphomet.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +3 | kullanılıyor |
| `public/monsters/minotaur-skeleton.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; +4 | kullanılıyor |
| `public/monsters/mule.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/mummy-lord.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/mummy.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/nalfeshnee.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/night-hag.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/nightmare.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +3 | kullanılıyor |
| `public/monsters/noble.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/ochre-jelly.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monster-reactions.json`; +2 | kullanılıyor |
| `public/monsters/octopus.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monster-reactions.json`; +2 | kullanılıyor |
| `public/monsters/ogre-uyku.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/ogre-zombie.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/ogre.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/oni.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/otyugh.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +2 | kullanılıyor |
| `public/monsters/owl.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/owlbear-uyku.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/owlbear.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +2 | kullanılıyor |
| `public/monsters/panther.webp` | 12 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/pegasus.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/phase-spider.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/piranha.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/pirate-captain.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +3 | kullanılıyor |
| `public/monsters/pirate.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/pit-fiend.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +2 | kullanılıyor |
| `public/monsters/planetar.webp` | 26 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/plesiosaurus.webp` | 12 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/polar-bear.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/pony.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/priest-acolyte.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/priest.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; +4 | kullanılıyor |
| `public/monsters/pseudodragon.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/pteranodon.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/purple-worm.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/quasit.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +2 | kullanılıyor |
| `public/monsters/rakshasa.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/rat.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/raven.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/red-dragon-wyrmling-uyku.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/red-dragon-wyrmling.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; +9 | kullanılıyor |
| `public/monsters/reef-shark.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/remorhaz.webp` | 28 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/rhinoceros.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/riding-horse.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/roc.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/roper.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/rust-monster.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/saber-toothed-tiger.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/sahuagin-warrior.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/salamander.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/satyr.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/scorpion.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/scout.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/sea-hag.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/seahorse.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/shadow.webp` | 13 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +13 | kullanılıyor |
| `public/monsters/shambling-mound.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/shield-guardian.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/shrieker-fungus.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monster-reactions.json`; +1 | kullanılıyor |
| `public/monsters/silver-dragon-wyrmling.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/skeleton.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/aciklamalar.json`; veri: `data/canavar-turleri.json`; +12 | kullanılıyor |
| `public/monsters/solar.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/specter.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/sphinx-of-lore.webp` | 24 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/sphinx-of-valor.webp` | 25 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/sphinx-of-wonder.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/spider.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +6 | kullanılıyor |
| `public/monsters/spirit-naga.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/sprite.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `CLAUDE.md`; belge: `DECISIONS.md`; belge: `assets-ham/efektler/README.md`; +31 | kullanılıyor |
| `public/monsters/spy.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/steam-mephit.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/stirge.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/stone-giant.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +3 | kullanılıyor |
| `public/monsters/stone-golem.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/storm-giant.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/succubus.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/swarm-of-bats.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/swarm-of-crawling-claws.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/swarm-of-insects.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/swarm-of-piranhas.webp` | 29 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/swarm-of-rats.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/swarm-of-ravens.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/swarm-of-venomous-snakes.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/tarrasque.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/tiger.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/tough-boss.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/tough.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/treant.webp` | 23 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/triceratops.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/troll-limb.webp` | 8 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/troll-uyku.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/troll.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); test: `src/ui/loading.test.ts` | kullanılıyor |
| `public/monsters/tyrannosaurus-rex.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/unicorn.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/vampire-familiar.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/vampire-spawn.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/vampire.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/venomous-snake.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/violet-fungus.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/vrock.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/vulture.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/warhorse-skeleton.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/warhorse.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/warrior-infantry.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/warrior-veteran.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monster-reactions.json`; +2 | kullanılıyor |
| `public/monsters/water-elemental.webp` | 25 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/weasel.webp` | 12 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +1 | kullanılıyor |
| `public/monsters/werebear.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/wereboar.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/wererat.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/weretiger.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/werewolf.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/white-dragon-wyrmling.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/wight.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/will-o-wisp.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json` | kullanılıyor |
| `public/monsters/winter-wolf.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/wolf-uyku.webp` | 15 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/wolf.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/worg.webp` | 14 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/wraith.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/wyvern-uyku.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/wyvern.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/condition-effects.json`; +11 | kullanılıyor |
| `public/monsters/xorn.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/young-black-dragon.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/young-blue-dragon.webp` | 17 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +2 | kullanılıyor |
| `public/monsters/young-brass-dragon.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/young-bronze-dragon.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/young-copper-dragon.webp` | 19 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/young-gold-dragon-uyku.webp` | 24 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/young-gold-dragon.webp` | 22 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/young-green-dragon.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/young-red-dragon-uyku.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts) | kullanılıyor |
| `public/monsters/young-red-dragon.webp` | 18 kB | kod: canavar jetonu (src/battle/avatar.ts); belge: `DECISIONS.md`; veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; +14 | kullanılıyor |
| `public/monsters/young-silver-dragon.webp` | 20 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/young-white-dragon.webp` | 21 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/attack-riders.json`; veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; +1 | kullanılıyor |
| `public/monsters/zombie.webp` | 16 kB | kod: canavar jetonu (src/battle/avatar.ts); veri: `data/canavar-turleri.json`; veri: `data/monster-ortamlari.json`; veri: `data/monsters.json`; +6 | kullanılıyor |

## `public/ses`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/ses/acilis-zar.mp3` | 25 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/ses/menu-dark.mp3` | 3.2 MB | belge: `DECISIONS.md`; veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; +3 | kullanılıyor |
| `public/ses/menu-light.mp3` | 2.9 MB | belge: `DECISIONS.md`; veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; +3 | kullanılıyor |
| `public/ses/muzik-savas-gece.mp3` | 2.2 MB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json`; +2 | kullanılıyor |
| `public/ses/muzik-savas-gunduz.mp3` | 2.2 MB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json`; +2 | kullanılıyor |
| `public/ses/ortam-ada-firtinali-a.mp3` | 172 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-ada-firtinali-b.mp3` | 164 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-ada-gunesli-a.mp3` | 157 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-ada-gunesli-b.mp3` | 159 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-bataklik-a.mp3` | 118 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-bataklik-b.mp3` | 170 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-col-firtina-a.mp3` | 160 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-col-firtina-b.mp3` | 143 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-col-gunduz-a.mp3` | 155 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-col-gunduz-b.mp3` | 153 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-dag-kis-a.mp3` | 146 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-dag-kis-b.mp3` | 150 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-dag-yaz-a.mp3` | 179 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-dag-yaz-b.mp3` | 164 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-dungeon-a.mp3` | 156 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-dungeon-b.mp3` | 163 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-gemi-firtinali-a.mp3` | 157 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-gemi-firtinali-b.mp3` | 169 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-gemi-gunesli-a.mp3` | 162 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-gemi-gunesli-b.mp3` | 160 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-kale-gece-a.mp3` | 160 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-kale-gece-b.mp3` | 177 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-kale-gunduz-a.mp3` | 169 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-kale-gunduz-b.mp3` | 160 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-magara-a.mp3` | 170 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-magara-b.mp3` | 156 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-orman-gece-a.mp3` | 156 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-orman-gece-b.mp3` | 156 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-orman-gunduz-a.mp3` | 156 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-orman-gunduz-b.mp3` | 160 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-sehir-meydani-gece-a.mp3` | 154 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-sehir-meydani-gece-b.mp3` | 152 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-sehir-meydani-gunduz-a.mp3` | 148 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-sehir-meydani-gunduz-b.mp3` | 160 kB | veri: `data/ses-adlari.json`; veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-taverna-a.mp3` | 174 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-taverna-b.mp3` | 151 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json` | kullanılıyor |
| `public/ses/ortam-volkan-a.mp3` | 151 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json`; betik: `scripts/ses-kontrol.mjs`; +1 | kullanılıyor |
| `public/ses/ortam-volkan-b.mp3` | 153 kB | veri: `data/ses-klipler.json`; veri: `data/ses.json`; betik: `scripts/ses-kontrol.mjs`; +1 | kullanılıyor |
| `public/ses/son-yenilgi.mp3` | 116 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/ses-klipler.json`; +3 | kullanılıyor |
| `public/ses/son-zafer.mp3` | 79 kB | belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/ses-klipler.json`; +4 | kullanılıyor |
| `public/ses/zar-coklu-1.mp3` | 18 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-coklu-2.mp3` | 82 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-coklu-3.mp3` | 13 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-1.mp3` | 5 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-10.mp3` | 8 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-11.mp3` | 9 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-12.mp3` | 3 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-13.mp3` | 5 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-14.mp3` | 3 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-2.mp3` | 4 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-3.mp3` | 5 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-4.mp3` | 5 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-5.mp3` | 4 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-6.mp3` | 4 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-7.mp3` | 3 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-8.mp3` | 4 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-dur-9.mp3` | 4 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-kritik-1.mp3` | 45 kB | veri: `data/ses-klipler.json`; test: `src/ui/audio/sound.test.ts` | kullanılıyor |
| `public/ses/zar-kritik-hata-1.mp3` | 18 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-sekme-1.mp3` | 8 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-sekme-2.mp3` | 31 kB | veri: `data/ses-klipler.json` | kullanılıyor |
| `public/ses/zar-tekli-1.mp3` | 31 kB | veri: `data/ses-klipler.json`; betik: `scripts/ses.mjs` | kullanılıyor |

## `public/son`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/son/son-bozgun-poster.jpg` | 18 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); test: `src/ui/endVideo.test.tsx` | kullanılıyor |
| `public/son/son-bozgun.mp4` | 477 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); belge: `DECISIONS.md`; veri: `data/son-video.json` | kullanılıyor |
| `public/son/son-bozgun.webm` | 472 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); belge: `DECISIONS.md`; veri: `data/son-video.json` | kullanılıyor |
| `public/son/son-defeat-poster.jpg` | 9 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); test: `src/ui/endVideo.test.tsx` | kullanılıyor |
| `public/son/son-defeat.mp4` | 266 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); belge: `DECISIONS.md`; veri: `data/son-video.json`; test: `src/ui/endVideo.test.tsx` | kullanılıyor |
| `public/son/son-defeat.webm` | 229 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); belge: `DECISIONS.md`; veri: `data/son-video.json` | kullanılıyor |
| `public/son/son-victory-poster.jpg` | 23 kB | veri: savaş sonu videosu (data/son-video.json files + -poster) | kullanılıyor |
| `public/son/son-victory.mp4` | 892 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); belge: `DECISIONS.md`; veri: `data/son-video.json` | kullanılıyor |
| `public/son/son-victory.webm` | 585 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); belge: `DECISIONS.md`; veri: `data/son-video.json` | kullanılıyor |
| `public/son/son-zafer-poster.jpg` | 23 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); test: `src/ui/endVideo.test.tsx` | kullanılıyor |
| `public/son/son-zafer.mp4` | 995 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/ses-klipler.json`; +5 | kullanılıyor |
| `public/son/son-zafer.webm` | 616 kB | veri: savaş sonu videosu (data/son-video.json files + -poster); belge: `CLAUDE.md`; belge: `DECISIONS.md`; veri: `data/ses-klipler.json`; +5 | kullanılıyor |

## `public/sprites`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/sprites/nesne-barut-varili.webp` | 9 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; belge: `docs/sprite-boyutlari.md`; +1 | kullanılıyor |
| `public/sprites/nesne-varil.webp` | 9 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; belge: `docs/sprite-boyutlari.md`; +1 | kullanılıyor |
| `public/sprites/yuzey-ag-1.webp` | 10 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-ag-2.webp` | 9 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; belge: `docs/sprite-boyutlari.md` | kullanılıyor |
| `public/sprites/yuzey-alev-1.webp` | 9 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-alev-2.webp` | 9 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-alev-3.webp` | 8 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-buhar-1.webp` | 7 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-buhar-2.webp` | 5 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; test: `src/ui/sprites.test.ts` | kullanılıyor |
| `public/sprites/yuzey-buz-1.webp` | 17 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-buz-2.webp` | 17 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-buz-3.webp` | 16 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-gres-1.webp` | 10 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; belge: `docs/sprite-boyutlari.md`; +1 | kullanılıyor |
| `public/sprites/yuzey-patlama.webp` | 13 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; test: `src/ui/sprites.test.ts` | kullanılıyor |
| `public/sprites/yuzey-sis-1.webp` | 9 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; test: `src/ui/sprites.test.ts` | kullanılıyor |
| `public/sprites/yuzey-sis-2.webp` | 10 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; test: `src/ui/sprites.test.ts` | kullanılıyor |
| `public/sprites/yuzey-sis-3.webp` | 17 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-su-1.webp` | 12 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-su-2.webp` | 10 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-su-3.webp` | 14 kB | belge: `DECISIONS.md`; veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; +1 | kullanılıyor |
| `public/sprites/yuzey-yag-1.webp` | 8 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-yag-2.webp` | 14 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-yag-3.webp` | 14 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json` | kullanılıyor |
| `public/sprites/yuzey-zehir-1.webp` | 17 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |
| `public/sprites/yuzey-zehir-2.webp` | 18 kB | veri: `data/sprite-esleme.json`; veri: `data/sprite-mevcut.json`; belge: `docs/SABAH-RAPORU.md` | kullanılıyor |

## `public/zarlar`

| Dosya | Boyut | Başvuran | Durum |
|---|---:|---|---|
| `public/zarlar/klasik/d10.webp` | 9 kB | veri: `data/zar-gorselleri.json` | kullanılıyor |
| `public/zarlar/klasik/d100.webp` | 13 kB | veri: `data/zar-gorselleri.json`; betik: `scripts/zarlar.mjs` | kullanılıyor |
| `public/zarlar/klasik/d12.webp` | 11 kB | veri: `data/zar-gorselleri.json` | kullanılıyor |
| `public/zarlar/klasik/d20.webp` | 11 kB | veri: `data/zar-gorselleri.json`; test: `src/ui/diceTheme.test.tsx` | kullanılıyor |
| `public/zarlar/klasik/d4.webp` | 8 kB | veri: `data/zar-gorselleri.json`; betik: `scripts/zarlar.mjs` | kullanılıyor |
| `public/zarlar/klasik/d6.webp` | 10 kB | veri: `data/zar-gorselleri.json` | kullanılıyor |
| `public/zarlar/klasik/d8.webp` | 9 kB | veri: `data/zar-gorselleri.json` | kullanılıyor |
