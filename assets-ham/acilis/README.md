# Menü arka plan videoları (ham)

`acilis-{pc,mobil}-{light,dark}.mp4`: menü ekranlarının özgün arka plan videoları (10 sn, 24 kare/sn; pc 960×540,
mobil 540×960). İlk ve son kareleri birbirini tutmadığı için doğrudan döngüye alınınca her 10 saniyede bir sıçrama
görünür. `npm run acilis` buradan okuyup çapraz geçişli döngü üretir: `public/acilis/*.mp4` (H.264), `*.webm` (VP9,
H.264 oynatamayan tarayıcılar için) ve ilk karenin aynısı olan poster `*.webp`. `assets-ham/` build çıktısına girmez.
