# Kuyruk N1: oyun adı "Dice & Hex" (görünen her yer)

Karar (kullanıcı, 2026-11-03): oyunun adı **Dice & Hex**. Değiştirilebilen her yerde bu ad kullanılır. Uygulamada şu an geçici olarak "Hex & Dice" ya da başka eski ad yazıyor olabilir; hepsi taranıp değişecek. Yeni dal `wip/n1` (Su Altı Geçidi commit'inden sonra, K45'ten önce; küçük iş, çakışma olmasın).

## Değişecekler
1. `src/app/appName.ts` (`APP_NAME`) = "Dice & Hex". Adın başka bir yerde sabit yazıldığı her yeri bu sabite bağla (bulursan listele).
2. Arayüz metinleri (i18n TR/EN): açılış ekranı, başlık çubuğu, hakkında/SRD atıf metni, Game Master ve Serüven ekranı başlıkları, paylaşım metinleri, hata/boş durum metinleri.
3. Tarayıcı: `index.html` `<title>`, meta açıklaması, `manifest.webmanifest`/PWA `name` ve `short_name` ("Dice & Hex"), service worker adı varsa, kısa ad.
4. `package.json` `name`/`description` (npm adı küçük harf, boşluksuz: `dice-and-hex`), README, `CLAUDE.md`, `docs/` belgeleri, CHANGELOG/DECISIONS başlıkları. Geçmiş kayıt satırlarını (tarihli kararlar) değiştirme; yalnızca güncel metinler.
5. Mobil (varsa Capacitor/Cordova ayarı): görünen ad. **Bundle id / applicationId'yi DEĞİŞTİRME**; yalnızca ayrı onayla (yayın öncesi karar).
6. Test beklentileri (eski ada bağlı testler), ekran görüntüsü karşılaştırmaları, `check:harita` ve `check:ses` metinleri.
7. Mağaza metni taslakları ve sanat görsellerindeki yazılı logo bu görevde YOK (adı görsellere gömme kuralı: görünen ad yalnızca metin).

## DOKUNMA
- Kayıt/depolama anahtarları (localStorage, IndexedDB, kayıt alanları, olay adları, kural sürümü, veri kimlikleri, harita/düğüm id'leri). Değişirse mevcut kayıtlar ve eski savaş kayıtları açılmaz.
- Dosya/klasör adları ve import yolları (yalnızca klasör kökü kullanıcı tarafından ayrıca yeniden adlandırılır, aşağıda).
- Üçüncü taraf lisans/atıf metinleri (SRD atfı aynen kalır; yalnızca ürün adı geçen cümlede ad güncellenir).

## Kullanıcı tarafında (CC yapmaz)
- GitHub depo adı (`RPG-Battle` → `Dice-and-Hex`) ve yerel klasör adı; CC oturumları kapalıyken. GitHub eski adresi yönlendirir; yine de `git remote set-url origin ...` ile güncellenir.

## Test ve kabul
`npm run typecheck`, testler, build, check:harita, check:ses temiz; ana parça ≤440 kB; depoda `rg -i "hex ?& ?dice|hexa ?dice"` ve eski ad aramasında kayıt anahtarları dışında sonuç kalmamalı (sonuçları raporla); kısa rapor: değişen dosya sayısı, bilerek bırakılanlar.
