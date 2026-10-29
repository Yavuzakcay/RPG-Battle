# Efekt sprite'ları (ham)

Ham görseller (Gemini üretimi), macenta (#FF00FF) arka planda. `npm run efektler` buradan okuyup
`public/efektler/*.webp` (128×128 karelerden tek yatay şerit) ve `data/efekt-sprites.json` üretir. `assets-ham/`
build çıktısına girmez (Vite yalnızca `public/`'i kopyalar).

**Hasar efektleri** (tek seferlik, `kind: damage`, `loop: false`; hasar anında jetonda bir kez oynar): `burn.jpg`
(8 kare), `poison.jpg`, `freeze.jpg`, `acid.jpg`, `bleed.jpg` (6'şar kare). Kareler siyah çerçeve dikdörtgenlerinden.

**Durum efektleri** (döngü, `kind: status`, `loop: true`; durum sürerken jetonun üstünde, halka biçiminde ortası boş).
Dosya adı küçük harf (durum adı). Kare sayısı, ızgara ve kırpma payı `scripts/efekt-kesim.mjs` ile otomatik bulunur
(macenta bantları, ince koyu ayraçlar, gri zemin ve alttaki etiketler dışarıda; ayraçsız şeritte kare sayısı içerik
profilinin periyodundan; boş hücreler atılır). `npm run efektler` her sheet için kare sayısını, ızgarayı ve beklenenle
uyuşmazlığı yazar.

| Dosya | Durum | Tespit | Not |
|---|---|---|---|
| `paralyzed.jpg` | Paralyzed | 8 kare, 4×2 | gri zemin, etiketli |
| `stunned.jpg` | Stunned | 8 kare, 4×2 | gri zemin, etiketli (eski adı `Stunned.jpg`) |
| `incapacitated.jpg` | Incapacitated | 8 kare, tek satır | beklenen 7; 10 hücrenin ilk ve sonu boş, sondaki solan kare de içerik |
| `frightened.jpg` | Frightened | 10 kare | ayraçsız şerit (kareler 275×346) |
| `charmed.jpg` | Charmed | 10 kare | ince ayraçlı |
| `restrained.jpg` | Restrained | 10 kare | ayraçsız şerit |
| `grappled.jpg` | Grappled | 10 kare | ayraçsız şerit (3168 px geniş) |

Şeffaflık: macenta geniş toleransla (JPG gürültüsü), arka plana komşu macentaya kaymış pikseller iki geçişte (halo),
kalan kenar piksellerinden macenta payı çıkarılır (despill). Yeni durum efekti: görseli buraya koy, `scripts/efektler.mjs`
`STATUS` listesine durum adı, öncelik ve beklenen kare sayısıyla ekle, `npm run efektler`.
