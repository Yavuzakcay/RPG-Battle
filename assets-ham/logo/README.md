# Logo kaynakları (Görev L)

Kaynak görseller (Gemini üretimi, beyaz ya da koyu zemin JPG); `npm run logo` bunlardan oyunun logo ve ikon dosyalarını üretir.

| Dosya | İçerik | Nerede |
|---|---|---|
| `logo-acilis.jpg` | Açık kanatlı, yazılı ("DICE & HEX"), geniş, beyaz zemin | Açılış animasyonu (`public/logo/acilis-*.webp` katmanları ve `logo-acilis.webp`) |
| `logo-masaustu.jpg` | Açık kanatlı, yazısız, geniş, beyaz zemin | Giriş ekranı başlığı, her düzen (`public/logo/logo-masaustu.webp`) |
| `logo-mobil.jpg` | Kanatları kapalı, kare, koyu kömür zemin | **Yalnızca uygulama ikonu** (`public/favicon.ico`, `public/ikon/apple-touch-icon.png`, `uretilen/ikon-1024.png`) |

## Yeniden üretme

```powershell
npm run logo
```

Çıktılar:

- `public/logo/logo-acilis.webp`, `public/logo/logo-masaustu.webp`: şeffaf logolar. Kenara bağlı yakın-beyaz zemin (tüm kanallar > 232) saydam olur, ön plan 1 px daralır, alfa σ 0,8 yumuşar. Yazı bandındaki harf boşlukları da saydam olur; logonun içindeki parlak vurgular korunur.
- `public/logo/acilis-kanat-sol.webp`, `acilis-kanat-sag.webp`, `acilis-govde.webp`, `acilis-yazi.webp`: açılış animasyonunun katmanları.
- `public/favicon.ico` (16/32/48), `public/ikon/apple-touch-icon.png` (180): web ikonları. `uretilen/ikon-1024.png`: 1024 opak ana ikon (sanat %68, zemin #1A1A1C).
- `data/logo.json`: katman kutuları, kanat kökleri, göz konumu, hale denetimi, ikon listesi. Elle düzenlenmez; testler (`src/ui/logo.test.tsx`) bunu okur.

Görsel değişince `npm run logo` çalıştırılır, `npm test` ile denetlenir. Altıgen çokgeni, kanat kökü ve göz arama kutusu `scripts/logo.ts` başındaki sabitlerdir (yeni görselde kompozisyon değişirse güncellenir). Açılış zamanlaması `data/acilis-ekrani.json`.

## Oyunun adı değişirse

1. `src/app/appName.ts` içinde `APP_NAME`'i değiştir: sekme başlığı, giriş ekranı başlığı ve açılış ekranının erişilebilir adı buradan okur.
2. Yazılı logo (`logo-acilis.jpg`) eski adı taşır: yeni adla yeniden üretilmiş görseli aynı adla koy ve `npm run logo` çalıştır. Yazı bandı otomatik bulunur.
3. Yazısız logo ve ikon adı içermez, değişmez.
4. `src/ui/logo.test.tsx` içindeki ad denetimini ("Dice &amp; Hex") güncelle.

## Platformlar

Proje şu an yalnızca web (Vite). PWA manifesti, Capacitor, Electron ya da Tauri eklenirse o platformun ikonları (iOS 1024 opak, Android adaptive ön plan + #1A1A1C arka plan ve mipmap boyutları, Windows çoklu .ico, PWA maskable) `uretilen/ikon-1024.png`'den `scripts/logo.ts`'e eklenerek üretilir.
