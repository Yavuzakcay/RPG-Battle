# HS1 — Harita temizliği (plan; silmeden önce)

Kararlar (kullanıcı, 2026-11-15). Bu belge silme ve bağlama commit'lerinden önce yazıldı; silinecekler, bağlanacak yerler ve bulunan kullanımlar:

## 1. SİL: klasik Kale (`kale`, Gündüz/Gece, 15×7)

- **Silinecek:** `harita/kale/kale-klasik.json` (kimlik `kale`; varyantlar `gunduz`, `gece`), `harita/kale/onizleme/kale-klasik-oda.png`, `public/maps/kale/kale-klasik.webp`, `public/maps/kale/kale-klasik-gece.webp`, `harita/kale/README.md` ve `public/maps/kale/README.md` satırları, `data/ses.json` `kale` girişi (harita kimliği; diğer Kale haritaları `kale-avlu`, `kale-baskini` kendi girişleri/yedekle çalışır).
- **KALIR:** "Kale ve avlu" (`kale-avlu`, geniş 31×17), Kale Baskını (`kale-baskini`), Yerleşim kale haritaları (`kale-onu`, `kale-ic-avlu`, `kale-taht-salonu`). `kale` ortam etiketi (`data/monster-ortamlari.json`, canavar ortamı) harita değil, kalır.
- **Bulunan kullanımlar ve bağlama:**
  - Sim senaryoları `kale` ve `kale-gece` (`data/sim-senaryolar.json`, `map.mapId: "kale"`): senaryo kimlikleri ve düşman listeleri (`enemies.1…20`) aynen kalır; harita **`kale-avlu`** (gündüz) olur (`kale-gece` için `kale-avlu`'nun gece varyantı varsa o, yoksa gündüz). Bu senaryolara dayanan yerler: `data/sim-a2.json` (`senaryolar`, `kolay`), `src/sim/k59Duman.ts` (`ENEMY_LISTS`, `kale-gece`), `k58ImzaKullanim.ts`, `k59PaketKapsam.ts`, `yzSureRun.ts`, onlarca regresyon testi (senaryo kimliğiyle; sürüm A = B karşılaştırmaları göreli, harita değişince de geçer).
  - Doğrudan `{ map: { id: 'kale' } }` kullanan testler (`features`, `mastery`, `k59etkilesim`, `maprules`, `night`, `maps.test`, `kaleBaskini.test`, `m1.test` sahte durum) başka bir mevcut haritaya taşınır (gerekçe commit'te).
  - **Denge:** `kale-avlu` 31×17 (Klasik Kale 15×7): senaryo sonuçları değişir. **Denge farkı ölçülmedi** (hafif doğrulama modu; tam ölçüm "Dungeondex öncesi tam test turu"na kalır) — `harita/belgeler/DENGE.md`'ye not düşülür.
  - Eski kayıt güvenliği: savaş kaydında harita `kale` ise yükleme çökmemeli → `getMap` bilinmeyen/silinmiş kimliği güvenli eşlemeyle (`kale` → `kale-avlu`) çözer (uyarı); Serüven/yerleşim kayıtlarında `kale` harita kimliği bulunmadı.

## 2. SİL: Ortamlar Diyarı (`ortamlar-diyari`, "Test ve vitrin" grubu, 31×17)

- **Silinecek:** `harita/vitrin/` (JSON, `onizleme/`, `prompt/`, README), `public/maps/vitrin/`, `data/ses.json` `ortamlar-diyari`, `data/zar-esleme.json` `ortamlar-diyari`, `src/i18n/strings.ts`/`strings.en.ts` harita adı/açıklaması, `harita/_ortak/harita-bolgeleri.json` `vitrin` bölgesi (seçicide "Test ve vitrin" çipi boş kalır → kaldırılır), `src/map/maps.ts` vitrin gruplama (varsa), `docs/VARLIK-HARITASI.md` (`npm run varlik-indeks`).
- **Bulunan kullanımlar (hepsi test/duman):** `src/sim/k18bsmoke`, `k54bsmoke`, `k55smoke`, `y1smoke`, `y2smoke`, `k59Duman.ts` (`vitrin` haritası), `k59PaketKapsam.ts`, `src/battle/ai/k58.test.ts`, `src/map/genis.test.ts` (31×17 ve vitrin beklentileri), `src/map/maps.test.ts` (kimlik listesi, `vitrin` filtresi), `src/map/mapArt.test.ts`, `src/app/diceUnlock.test.ts`. Bunlar başka bir mevcut haritaya (31×17 gerekenler için `kale-avlu` ya da `orman-genis-yol`; yüzey/tepkime dumanları için büyük, çok zeminli bir harita) taşınır; vitrine özgü olanlar fikstüre çevrilir ya da kaldırılır.

## 3. DOKUNMA: Deniz haritaları (Ada, Güverte)

Olduğu gibi kalır; silme, dünya haritasına bağlama ya da eşleme yapılmaz. **Kullanıcı bağlayacak.**

## 4. SİL: Dungeon'un düz "Merdiven" varyantı (`yeralti-zindan.json` → `variants[].id = "merdiven"`)

- **KALIR:** "Yürüyen merdiven" (`merdiven-yuruyen`), "Meşaleli koridor" (`mesale`), "Hazine odası" (`hazine`).
- **Silinecek:** yalnız `merdiven` varyantı (JSON bloğu), `data/ses.json` `dungeon.merdiven`, `data/sim-senaryolar.json` `dungeon-merdiven` (→ `merdiven-yuruyen` varyantına yönlendirilir; senaryo kimliği `k59Duman.ts` listesinde kullanıldığı için kalır).
- **SilinMEYEN (paylaşımlı):** `public/maps/yeralti/yeralti-zindan-merdiven.webp` ve `harita/yeralti/gorsel/yeralti-zindan-merdiven-ornek.jpg`: Yürüyen merdiven varyantı da aynı görseli kullanıyor (`image`), Serüven "Yürüyen Merdiven" durağının küçük resmi (`data/seferler.json`) ona bağlı. Varyanta özel görsel/önizleme/prompt dosyası yok (`yeralti/prompt` ve `onizleme` yalnız `magara-genis`).
- **Bulunan kullanımlar:** `src/battle/dungeon.test.ts` (merdiven varyantının kuralları `highGround`, `stairwellFall`, `stairShove` ve zemin sınamaları: Yürüyen merdiven varyantı aynı üç kuralı ve aynı zemini taşıdığı için testler ona taşınır), `src/battle/conveyor.test.ts` (eski `merdiven` zemin karşılaştırması: yürüyen varyantın `conveyor` kuralı olmadan aynı zeminle karşılaştırılacak biçime çevrilir), `src/ui/audio/sound.test.ts`, `src/sim/k59Duman.ts`, `src/journey/seruven.test.ts` ve `sefer.test.ts` (Serüven/sefer **durak** kimliği `merdiven` — varyantla ilgisiz, zaten `derin-merdiven` senaryosu = Yürüyen merdiven; dokunulmaz).
- Eski kayıt: savaş kaydında `variantId: 'merdiven'` → `merdiven-yuruyen` eşlemesi.

## Genel

Her silme için: harita JSON'u/varyantı, `gorsel`/`onizleme`/`prompt`/`duzeltme`, `public/maps` webp, `data/ses.json`, sim senaryo satırları, testlerdeki sayı beklentileri, `harita-bolgeleri.json`, `npm run varlik-indeks`. Ham kaynaklara (`assets-ham`, `harita/belgeler` ham dosyaları) dokunulmaz. Silme ve bağlama ayrı commit.
