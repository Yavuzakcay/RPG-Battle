# Komşuluk grafı, köprüler, deniz yolları, sis, yol katmanı (özet; veri `data/harita/` altında)

Dünya pikseli, tuval 13704×5998, 12×6 hücre (A–L × 1–6, hücre ≈1142×1000 px, 1 hücre = 50 mil). Yaya 24 mil/gün, gemi 72 mil/gün. Mil = piksel/1142×50.
Dosyalar: `komsuluk-grafi.json` (kenarlar, köprüler, ırk başlangıçları, özel erişim, gizli geçit, Derinlikler girişleri), `deniz-yollari.json` (7 rota + iskeleler), `sis-poligonlari.json` + `sis-maskesi-1_8.png`, `yol-katmani.json` (13 yol), `tum_dugumler_dunya.json` (savaş düğümleri), `kita-izgara.json`, `kamera-onayarlari.json`, `yurume-maliyet-1_4.png` (taslak), `hapishane-su-alti-katman.png`.

## Notlar
- Batıda iki ayrı liman: **Beyaz Şehir iskelesi** (3600,2040) ve **Liman** (büyük duvarlı liman kasabası, iskele ağzı 3696,3400, bölge `bati_liman`). Kral Kalesi iskelesi 4120,5104. Hapishane iskelesi (12176,1528) ve Saklı Cennet lagün ağzı (12728,3920) tahmindir. Hapishane ve Saklı Cennet'e iskele GÖRSELİ eklenmez.
- Deniz yolları: beyaz_sehir_iskelesi-liman 118 mil; liman-kral_kalesi 115; liman-korsan 68; beyaz_sehir_iskelesi-hapishane 476; kral_kalesi-hapishane 458; korsan-saklı_cennet 513; korsan-kemik 318. Korsan–Saklı Cennet ve Korsan–Kemik yalnız Korsan seferi. Hapishane yalnız yüzeydeki günde.
- Özel erişim: Volkan adası portal; Göksel anahtar/uçan binek; Hapishane gemi; Korsan gemi; Saklı Cennet ve Kemik (akrep_adasi) yalnız Korsan seferi; Kraken tehdit bölgesi.
- **Gizli geçit Heykel Mağarası** = mevcut `yeralti-nehri` haritası: Mielikki şelale arkası (6170,2740) ↔ Vaha batı kıyısı (8850,4460), kuş uçuşu ≈139 mil (yaya ≈6 gün), anında geçilir (`sureGun` 0, kullanıcı kararı 2026-11-03).
- Derinlikler girişi (Tiefling): çöl kanyonundaki taş kapılı mağara (8490,4025). Eski plandaki Bataklık krateri girişi (4980,4155) doğrulanmadı.
- Orman–Çöl geçidi iki parça (köprü → Oduncu kampı → kumullar). Ejderha Kalesi (Volkan) ve Tiefling kasabası yer altında/adada, kıta yolunda yok.
