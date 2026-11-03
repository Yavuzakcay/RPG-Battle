# Görev: Su Altı Geçidi = mevcut `yeralti-nehri` haritası (Orman ↔ Çöl gizli geçidi)

DÜZELTME (2026-11-03): Bu harita YENİ DEĞİL. Repoda zaten `yeralti-nehri` (görsel `harita/col/gorsel/yeralti-nehri.jpg`, çöl klasörü) var ve Orman gölü ile Çöl vahası arasındaki su altı geçidi bu. Yeni harita, yeni id (`orman-su-alti-gecit`) ve yeni webp EKLENMEYECEK. Önceki sürümdeki 11 maddelik yeni harita görevi geçersiz.

## Kullanıcı değişikliği
Kullanıcı `yeralti-nehri.jpg` görselini kendisi AYNALADI (dünya haritasındaki yöne göre: şelale ve taş yüz SOLDA = Orman/Mielikki tarafı, sıcak kum SAĞDA = vaha/çöl tarafı). Dosya henüz commit edilmedi (git status: modified). CC kullanıcıyla bu konuda konuşuyor.

## CC'nin yaptıkları (2026-11-03 raporu)
Harita gerçekte 21×11 (15×7 değil). Zemin tablosu, startZones aynalandı; parti vaha (sağ) tarafında, pusu ortada. Bağlantı iki yönlü, gizli, beceri sınavsız, geri kilide takılmaz. Eski kayıtlarda yalnız çizim yönü çevrilir (mekanik aynı). Ara commit `wip/k19-yeralti-ayna` (9fa6067); görsel `wip/k19`'a gelince tek commit olacak.

## Karar: süre (2026-11-03 13:15)
Geçit KISA YOLDUR, ANINDA geçilir: `sureGun` = 0 (Serüven gün sayacı ilerlemez; düğmede "(3 gün)" yazısı yerine "Gizli geçit"). İki yönde de geçerli. Önceki 3 gün önerisi iptal.

## Hâlâ geçerli
- Gizli geçit Mielikki Gölü şelale geçidi (6170,2740) ↔ Çöl Vahası batı kıyısı (8850,4460), kuş uçuşu ≈139 mil (yürüyerek ~6 gün, geçit bunu sıfırlar; bu yüzden keşif ödülü).
- Keşif: Mielikki Gölü şelale geçidinden bulanlar (mevcut Heykel Mağarası keşif kuralı), seçicide görünmez.
- Orman'dan girenin başlangıcı şelale (sol), Çöl'den girenin vaha (sağ) tarafı.
- K47 serbest gezintide bu geçit bir "hub": dünya koordinatları ve ≈139 mil bilgisi o zaman depoya `docs/` altına konacak.
- Kabul: typecheck, testler, build, check:harita, check:ses temiz; ana parça ≤440 kB.

Ayrıntı: `komsuluk-grafi-ve-deniz-yollari.md` → `gizli_gecitler`.
