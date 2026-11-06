# Ek paket durumu (Kuyruk K58 G8)

Bu belge `npm run paket-durum` ile **yerelde** üretilir (varsayılan `icerik/`; paketler depoya girmez, bu yüzden bulut
ortamında üretilemedi). Paket metni girmez: kimlik, ad, sınıf/alt sınıf, seviye, durum, ilkel türleri ve kısmi nedeni.
Sayılar `npm run check:icerik` ile aynıdır (`src/content/paketDurum.ts`, test `src/content/paketDurum.test.ts`).

```powershell
npm run paket-durum
npm run check:icerik
```

Beklenen özet (kullanıcının son `check:icerik` çıktısı): çalışır 71, kısmi 264, çalışmıyor 0, hikâye 60.
