# Engel sprite'ları (ham)

`engel-melodi.jpg`: bard bariyeri, 7 kare tek satır, macenta arka plan. Kare 1–4 belirme, 5–6 döngü, 7 yıkılma.

`npm run efektler` (Görev V) bu klasörü de işler: kareler içerik boşluklarından ayrılır (kare genişlikleri farklı),
arka plan yalnızca kenardan bağlantılı saf macenta (duvarın mor gövdesi ve parlayan taban korunur), kareler alta
oturur. Çıktı `public/efektler/engel-melodi.webp` (160×160 kareler) ve `data/efekt-sprites.json` (`kind: engel`,
`phases`: belirme/döngü/yıkılma, 0 tabanlı kare aralıkları).

Geçici engel altıgeni oyunda henüz yok (ayrı görev). Önizleme: `npm run dev` → `/onizleme-engel.html`
(build'e girmez).
