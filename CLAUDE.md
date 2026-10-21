# RPG-Battle

## Proje özeti

D&D 5e **SRD 5.2.1** (CC-BY-4.0) tabanlı, Türkçe arayüzlü altıgen haritalı savaş simülatörü (React + TypeScript + Vite).

- Oyuncular en çok 5 özel karakter oluşturur (ırk, sınıf, seviye, cinsiyet; 240 pixel-art jeton). Masumların 5 jetonu `public/masumlar/` altında (şimdilik placeholder).
- GM düşmanları seçer: 330 SRD canavarı, haritanın ortam listesine göre süzülür, güç kademelerine ayrılır. "Tüm canavarlar" hepsini açar. Özel canavar da eklenebilir.
- Savaş 15×7 altıgen (flat-top, odd-q, 5 ft) haritalarda oynanır. 12 harita, varyantlar ve harita kuralları var: lav, bataklık, karanlık, tuzak, kapı, uyuyan ejderha…
- Yapay zekâ iki tarafı da oynayabilir. Denge simülasyonu `npm run sim` ile ölçülür, sonuçlar `docs/harita/DENGE.md`'de.

## Mimari kurallar

- **Command → `execute` → Events → reducer.**
  - Her oyun değişikliği bir komuttur (`src/battle/types.ts` `Command`).
  - `execute(state, cmd, ctx, rng)` doğrular ve olay listesi üretir.
  - Durum yalnızca `applyEvent` (reducer, `src/battle/reduce.ts`) ile değişir.
  - Olaylar baştan oynatılınca aynı durum çıkmalı (`replay`).
- **Saf kural modülleri.**
  - `src/rules/*` ve `src/battle/*` yan etkisizdir; React, DOM ya da `localStorage` içermez.
  - Arayüz (`src/MapBattle.tsx`, `src/screens/*`, `src/ui/*`) yalnızca komut gönderir ve durumu çizer.
- **Rng enjeksiyonu.**
  - Zar atan her fonksiyon `rng: Rng` parametresi alır; `Math.random` doğrudan çağrılmaz.
  - Testler `scripted(...)`, simülasyon `seeded(seed)` kullanır; sonuçlar tekrarlanabilir.
- **Canavar verisi tembel yüklenir:** `loadMonsters()` çağrılmadan `getMonster` çalışmaz. Testler `src/test-setup.ts` ile, simülasyon betikleri en üstte `await loadMonsters()` ile yükler.
- **Veri JSON'da, kodda değil.**
  - `data/*.json`: ırk, sınıf, büyü, canavar, silah, zırh, ortam, `monster-ortamlari.json`, `token-sizes.json`.
  - `data/maps/*.json`: haritalar; varyantlar ve kural parametreleri haritanın JSON'unda.
  - Yeni sabit değer önce JSON'a.
- **Harita kuralları** veriyle tanımlanır: `ruleOf(state, id)` ile okunur (`src/battle/maprules.ts`).
- **Görsel ile mekanik ayrı.** Jeton ölçeği yalnızca görseldir; her yaratık tek altıgen kaplar, tıklama alanı kendi altıgenidir.

## Komutlar

```powershell
npm install
npm run dev            # geliştirme sunucusu
npm test               # vitest (birim + arayüz testleri)
npm run typecheck      # tsc --noEmit
npm run build          # typecheck + vite build
npm run check:harita   # her harita/varyant için gerçek tarayıcıda kara ekran kontrolü (Playwright)
npm run sim -- 200 col volkan   # denge simülasyonu (200 tohum, isteğe bağlı senaryo kimlikleri)
```

## Çalışma şekli

- **Dil:** Yanıtlar, arayüz metinleri ve belgeler Türkçe. Kod tanımlayıcıları İngilizce olabilir; yorumlar Türkçe.
- **Komutlar:** Kullanıcıya verilen komutlar PowerShell sözdiziminde.
- **Küçük adımlar:** Her adımda `npm test`, `npm run typecheck` ve `npm run build` yeşil kalmalı; harita ve görsel değişikliklerinde `npm run check:harita` de.
- **Kararlar** `DECISIONS.md`'ye yazılır, en yeni karar en üstte. Denge ölçümleri `docs/harita/DENGE.md`'ye.
- **Commit mesajı tırnak içinde verilir:** `git commit -m "Kısa açıklama"`.
- Rapor kısa tutulur; arayüz değişikliklerinde ekran görüntüsü alınır.

## Yasaklar

- **PHB ya da "converting to SRD" PDF'lerini asla commit etme.** Depoda yalnızca CC lisanslı `docs/SRD_CC_v5.2.1.pdf` bulunur.
- **`npm audit fix --force` kullanma.**
- **`data/maps` içine harita dışı dosya koyma.** Test fikstürleri `src/map/fixtures/` altında.
- Görselleri (resim dosyalarını) testlere sokma; testler yalnızca dosya adlarını listeleyebilir (`import.meta.glob`, tembel).
- Mevcut testleri bozma. Bir test veriye bağlı bir değeri sınıyorsa, değeri güncellemenin gerekçesini commit'te yaz.
- Lisans ve atıf dosyalarına dokunma (`NOTICE`, lisans metinleri).
- Canavar verisini (`data/monsters.json`) denge için değiştirme. Denge, senaryodaki düşman listesiyle yapılır; canavar verisi için yalnızca öneri yazılır.

## Bilinen eksikler

Durum: **yok** ya da **kısmen**.

| Konu | Durum | Not |
|---|---|---|
| Hazırla (Ready) eylemi | yok | Tasarım önerisi DECISIONS.md'de; Kaçın ve Yardım var |
| Elle zar girişi | yok | Bütün zarlar `Rng` ile otomatik |
| 4. seviye ve üstü büyüler | yok | `spells.json` 0–3. seviye (82 büyü); oluşturucu 1–20. seviyeye izin veriyor (tutarsız) |
| Durum süreleri | kısmen | `conditionTimers` var (tur, başına/sonuna dek, save ends, süreli hasar `dot`); 20 elle tanımlı canavar etkisi + 6 büyü (`data/condition-effects.json`), ~30 rider'dan üretilen süreli durum. "Second failure", lanet ve HP-eşiği etkileri yok |
| Canavar saldırı ek etkileri (`rider`) | kısmen | `data/attack-riders.json` (`node scripts/riders-uret.cjs` ile üretilir): ek hasar, koşullu hasar, Grappled (kaçış DC, sürükleme), Prone (boyut, save), hücum (20+ ft düz koşu), süreli durumlar uygulanıyor (325'te 217 tam, 31 kısmen, 16 süreli etki). 61 rider uygulanmıyor: itme/çekme, lanet, yutma, ikinci aşama, HP eşiği, özel metin |
| Yakalama ve yere düşme | kısmen | Grappled (hız 0, kaçış eylemi, sürükleme yarı hız, yakalayan düşünce biter) ve Prone (kalkmak hızın yarısı) var. Yakalananın başka hedefe dezavantajı ve oyuncunun yakalama (Grapple) eylemi yok |
| Köken (origin) feat seçimi | yok | Yalnızca geçmiş puan bonusu |
| Oyuncu ırk özellikleri (Dragonborn Breath Weapon…) | yok | Irk yalnızca puan, direnç, karanlık görüş ve jeton ölçeği veriyor; "Nefes" butonu bu yüzden yok |
| Kalıcı alan büyüleri | kısmen | Yalnızca Spirit Guardians ve Spiritual Weapon |
| Çok altıgenlik büyük canavarlar | yok | Ölçek yalnızca görsel; mekanik tek altıgen |
| Efsanevi eylem ve direnç | yok | 30 canavar; ejderhalar bu yüzden olduklarından zayıf |
| Canavar büyüleri ve tepkileri | yok | 73 eylem, 24 tepki desteklenmiyor |
| Koni ve çizgi alanlar (nefes silahları) | kısmen | Tek hedefe indirgeniyor |
| Durum bağışıklığı | yok | 75 canavar |
| Canavar özellikleri (Pack Tactics, Magic Resistance…) | kısmen | Çoğu `unsupported` notu olarak duruyor |
| Dinlenme (kısa/uzun) | kısmen | `src/rules/rest.ts` var, oyunda kullanılmıyor |
| Oyuncu tepkileri (Shield vb.) | kısmen | Fırsat saldırısı var, tepki büyüsü akışı yok |
| Sabit hasar | kısmen | Sabit hasar "1d2 + (N − 1)" ile yaklaşıklanıyor (21 canavar) |
| GM'e gizli tuzak görünümü | yok | Bulunmamış tuzak kimseye çizilmiyor |
| Ağ üzerinden çok oyunculu | yok | Tek ekran paylaşımlı |

Önerilen sıra:
1. Elle zar girişi
2. Büyü seviyesi tutarlılığı
3. Hazırla (Ready) eylemi
4. Efsanevi eylem/direnç ve koni nefes (sonra ejderha dengesi yeniden ölçülmeli)
5. Köken feat seçimi
6. Canavar büyüleri, tepkileri, bağışıklıkları ve özellikleri
7. Kalıcı alan büyüleri ve oyuncu tepkileri
8. Dinlenme arayüzü
9. Çok altıgenlik canavarlar
10. GM tuzak görünümü
11. Ağ üzerinden çok oyunculu
