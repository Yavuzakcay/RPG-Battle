# Kuyruk K45 + K46: dünya haritası karo aracı, zoomlu görüntüleyici ve keşif sisi (güncel 2026-11-03)

Başlık: K19 birleştirilmiş olmalı; yeni dal `wip/k45`. Her büyük görev sonrası commit+push. Goliath dosyalarına dokunma. Kural sürümüne dokunma: oyun kuralı değişmez, yalnızca arayüz, varlık hattı ve Serüven kayıt alanı (keşif).
Veri dosyaları bu pakette `data/harita/` altında hazır (komsuluk-grafi, deniz-yollari, yol-katmani, sis-poligonlari, kita-izgara, kamera-onayarlari, tum_dugumler_dunya + maske PNG'leri). Depoda aynı yola koy.
Etiket/isim katmanı (madde K46-2 ve `etiketler.json`) BU KUYRUKTA YOK: isimler kullanıcıda, sonra gelecek. Etiket katmanı için yalnızca kanca bırak (boş liste okuyan bileşen).

## Girdiler
- `assets-ham/harita/dunya/dunya-final-v47.png` (13704×5998, ~49 MB, depoya GİRMEZ, `.gitignore`). **Karoları kullanıcı yerelde üretir** (CC bulutta bu dosyayı göremez); CC aracı ve çalıştırma talimatını yazar, çıkan karolar (WebP, hafif) depoya girer. Git LFS yok. Windows'ta `sharp` için `npm install-scripts approve sharp` gerekebilir (kurulum uyarısı), talimata yaz.
- Veri (`data/harita/`): `kita-izgara.json`, `kamera-onayarlari.json`, `tum_dugumler_dunya.json`, `komsuluk-grafi.json` (geçitler, köprüler, gizli geçit), `deniz-yollari.json`, `yol-katmani.json`, `sis-poligonlari.json` + `sis-maskesi-1_8.png`, `hapishane-su-alti-katman.png`, `yurume-maliyet-1_4.png`.

## K45: karo üretim aracı
1. `npm run harita-karo` (Node, `sharp`): kaynak PNG'den 512 px WebP karo piramidi, 6 zoom (0 tüm harita, 5 1:1), kalite 80, kenar karoları kısmi boyutta, deterministik. Çıktı `public/maps/dunya/{z}/{x}/{y}.webp` + `manifest.json` (tuval boyu, karo boyu, seviye sayısı, kaynak SHA-256).
2. İlk yükleme ≤1 MB (z0–z2 + manifest). Toplam çıktı boyutunu raporla.
3. Bellek: 82 MP tek seferde decode edilmez (`sharp` limitInputPixels, akış); 4 GB altı RAM'de çalışır.
4. Test: manifest tutarlılığı, rastgele 20 karoyu kaynaktan kesip kıyas, yeniden üretimde bayt eşitliği. Windows ve Linux, `path.join`.

## K46: zoomlu dünya görüntüleyici
1. `WorldMapViewer`: kaydır, yakınlaştır (tekerlek, kıstırma, çift dokunma). Karo yükleme: görünür alan + 1 halka, LRU ≤200 karo, düşük zoom karo önce. Tek canvas ≤16,7 MP.
2. Üç anlamsal seviye (a bölge/ada/deniz adları, b yerleşimler, c yer etiketleri ve savaş düğümleri) için etiket katmanı bileşeni; veri dosyası `data/harita/etiketler.json` şimdilik BOŞ liste (TR/EN anahtarlı yapı: id, tr, en, x, y, seviye). Görsele gömülmez.
3. Kamera ön ayarları `kamera-onayarlari.json`, ırk başlangıç kamerası = yurt bölgesi.
4. Mini harita, pusula, ölçek çubuğu (1 hücre = 50 mil, yaya 24, gemi 72 mil/gün), ızgara katmanı (A–L × 1–6).
5. Katmanlar (kapatılabilir, veri yoksa gizli): yol, deniz yolu, köprü ve geçit işaretleri, gizli geçit (keşfedilene kadar yok), düğüm işaretleri, **keşif sisi** (aşağıda).
6. Kraken gözü (12386, 4782): 2 sn nabız parlaması, hareket azaltmaya uyar.
6b. **Hapishane yüzme animasyonu (haftalık):** Hapishane tamamen su altında, bulanık ve eşit (halka biçimli) bir silüettir. HAFTADA BİR (Serüven günü sayacı, her 7. gün) yalnızca yemek ve yeni suçlu götürülürken suyun üstüne çıkar, sonra iner. Katman `hapishane-su-alti-katman.png` (RGBA, 1200×1200, dünya koordinatı sol üst 10800,500) taban haritanın (v47, yüzeydeki hal) üstüne biner: alfa=1 su altı (gemi ve iskele de gider), alfa=0 yüzeyde. Çıkış ve iniş birkaç saniyelik yumuşak geçiş; yüzeyde kalma süresi 6 oyun saati (GM parametresi `hapishanePencereSaat`=6), her 7. günün başından itibaren. Serüven zaman modeli saat çözünürlüğü tutmuyorsa (yalnız gün sayıyorsa) önce bunu raporla ve şu yedeği uygula: pencere o günün ilk 6 saatidir, yolculuk süresi saatlere bölünerek hesaplanır (yaya 1 mil/saat, gemi 3 mil/saat); saat sayacı yoksa "gün başında bir kez gemi çıkarma hakkı". Gerçek zamanlı döngü YOK: durum Serüven gününden hesaplanır. Hareket azaltma açıkken geçiş anlık. GM anahtarı `hapishaneHaftalik` (varsayılan AÇIK; kapalıyken Hapishane hep yüzeyde, katman yok). Gemi ile Hapishane'ye yalnızca yüzeydeki günde çıkılır (diğer günler hedef kilitli, "Su altında" ipucu). Sis katmanından bağımsız: silüet sis altında bile görünür. Mevcut Hapishane seferi ve iç harita değişmez.
7. Düğüm dokunuşu: mevcut Serüven yönlendirmesine bağlan, yoksa boş kanca.
8. Performans: telefonda ≈60 fps hedef; cihaz testi kullanıcıda.

## Keşif sisi (Serüven modu: harita keşfedildikçe açılır)
- **Durumlar:** (1) bilinmeyen: koyu bulutlu sis, altındaki görsel görünmez, adlar gizli; (2) keşfedilmiş: görsel tam, etiketler görünür. Sis geçişi yumuşak kenarlı.
- **Veri:** ızgara tabanlı bit dizisi 96×42 (hücre ≈143 px), base64 ile Serüven kaydında `kesif` alanı. Alan yoksa (eski kayıt) = başlangıç durumu; kural sürümüne bağlı DEĞİL, savaş hesabını etkilemez.
- **Başlangıç:** parti kendi ırk yurdu bölgesi etrafında yarıçap ≈1500 px açık başlar. Geri kalan kıta ve tüm adalar sisli.
- **Açılma kuralları (parametre, kodda sabit değil):** yolculukta parti konumu çevresi yarıçap 600 px, gittiği yol boyunca iz bırakır; yerleşime girince 1200 px; kapı ve köprü geçişinde geçidin iki yanı 800 px; gemi yolculuğunda rota boyunca 800 px. Ada alanları (`sis-poligonlari.json`): Saklı Cennet, Göksel, Kemik (akrep_adasi), Kraken yalnızca ilgili keşif bayrağı ya da erişim (Korsan seferi, Göksel anahtarı, portal) ile TÜM poligon olarak açılır; kıyıdan geçerken sadece kenarı görünür kalır. Gizli geçit (Heykel Mağarası): yalnızca keşif bayrağı ile; sis kalkınca işaret belirir. İsteğe bağlı: "harita parçası" eşyası bölgeyi açar (kanca).
- **Çizim:** sis düşük çözünürlüklü canvas/maske (ızgara → bulanık alfa), karoların üstüne tek katman; yalnız değişen hücreler yeniden çizilir. Mini harita da aynı sisi gösterir.
- **GM ayarı:** `haritaSisi` anahtarı, Serüven'de varsayılan AÇIK, GM modunda ve Harita Keşfi için kapalı seçilebilir (tüm harita açık). Savaş kaydı etkilenmez.
- **Test:** parti hareketinde hücreler açılır, kayıt/yükleme sonrası aynı sis, eski kayıtta çökmez, anahtar kapalıyken tüm harita açık, ada poligonu bayrakla açılır, hareket azaltma.

## Dışı (YAPMA)
Serbest gezinti motoru, deniz paketi (gemi, Kraken karşılaşması), yeni oyun kuralı, bölge dengesi, isimler/etiket içeriği. K47+.

## Kabul
`npm run typecheck`, `npm test`, `npm run harita-karo` temiz; ilk yükleme ≤1 MB; K19 davranışları değişmez; kısa rapor: karo sayısı/boyut, kare hızı, açık kalanlar.
