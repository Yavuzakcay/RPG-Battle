# Geniş harita ham görselleri (Görev HG1)

Gemini çıktılarını buraya koyun: `<harita>.png` (ya da .jpg/.jpeg/.webp). `<harita>` harita kimliğidir (`orman-yolu`, `kale-avlu`, `magara-genis`); çok varyantlı haritada `<kimlik>-<varyant>`.

```powershell
npm run harita-gorsel -- orman-yolu
```

Boyut ve en-boy oranı denetlenir, görsel `public/maps/harita-<kimlik>.webp` olarak WebP'ye çevrilir. Hedef boyutlar, hizalama, prompt'lar ve referans görseller: `docs/harita/gorsel-sartnamesi.md`, `docs/harita/referans/`.
