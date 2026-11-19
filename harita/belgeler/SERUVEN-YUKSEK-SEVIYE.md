# Serüven 6–20 seviye düşman seçimi

Üretim: `npx vite-node scripts/seruven-yuksek-seviye.ts` (yalnız rapor). Kod `src/journey/seruvenEnemies.ts`, bağlantı `src/app/seruvenBattle.ts` `seruvenEnemies`.

Kurallar (6+ seviye): el yazması tam liste (**L**) → en yakın alt 6+ liste (**A**, 8 → 7, 12 → 11; 5. seviyeye inmez) → yalnız sıradan
düğümde ve haritanın ortam havuzu varsa bölge karşılaşma üreteci (**Ü**, `regionEncounter`: SRD XP bütçesi parti seviyesine göre, lider CR ≤ seviye, en çok 6) →
yoksa 5. seviye listesi (**5**). Özel savaşlar (boss, sefer, Hapishane, Büyük suç, koridor) üreteç almaz. 1–5. seviye değişmedi (2 ve 4 için eskisi gibi 5. seviye listesi).

Sefer düğümlerinde durağın kendi `dusmanlar` listesi varsa (en yakın sefer seviyesinden) o kullanılır; yoksa aşağıdaki senaryo satırı.

Özet (74 senaryo × 6–20 = 1110 hücre): 5. seviye yedeği 1085 → 320; sonra L 25, A 101, Ü 664, 5 320. Ortam havuzu olan senaryo: 73/74.

Notlar:
- Kurulum ve sonuç aynı listeyi görür (tohum: Serüven kimliği + düğüm + seviye; üreteç bütçesi savaşabilen üye sayısıyla).
- Kayıtlı savaş eski listesiyle sürer: savaş kaydı olay günlüğü, düşmanlar ilk olayda yazılı. 6+ seviyede kazanılan düğüm savaşının XP'si savaştaki düşmanlardan (`battleEnemyXp`).
- Kalan **5** hücreler özel savaşlar: boss (`volkan-ejder` vb.), sefer durakları (Volkan, Derinlikler, Kale Baskını), Hapishane, Büyük suç, koridor; el yazması 6+ listeleri yok. Sefer düğümünde durağın `dusmanlar` listesi en yakın sefer seviyesinden (`nodeStop`) ve değişmedi. Denge turunda bunlara 6+ liste yazılmalı.
- "yok" kullanımı: Serüven'de kullanılmayan senaryo (sıradan sayıldı; sim ölçümü `enemiesAt`'i aynen kullanır, değişmedi).
- Denge ölçülmedi; duman: 12 sınıf × 6/12/20 × orman-ork, magara (`src/sim/seruvenYuksekDuman.test.ts`).

| Senaryo | Serüven kullanımı | Önce 1–20 | Sonra 1–20 | 6+ 5. seviye yedeği (önce → sonra) |
|---|---|---|---|---|
| duz | yok | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| col | yok | `L5L5L5L5L5L555L5555L` | `L5L5LÜLALALAAALAAAAL` | 10 → 0 |
| volkan | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| volkan-ejder | boss | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| volkan-ejder-adult | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| volkan-ejder-ancient | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| volkan-ejder-wyrmling | sefer | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| volkan-ejder-sans | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| orman | düğüm | `L5L5L5L5L5L555L5555L` | `L5L5LÜLALALAAALAAAAL` | 10 → 0 |
| orman-gece | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| magara | yok | `L5L5L5L5L5L555L5555L` | `L5L5LÜLALALAAALAAAAL` | 10 → 0 |
| dungeon | sefer | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| dungeon-merdiven | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| derin-merdiven | sefer | `L5L5L5L5555555555555` | `L5L5L5LAAAAAAAAAAAAA` | 14 → 1 |
| dungeon-hazine | sefer | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| kale | yok | `L5L5L5L5L5L555L5555L` | `L5L5LÜLALALAAALAAAAL` | 10 → 0 |
| kale-gece | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| taverna | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| taverna-arka | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| taverna-8 | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| orman-yolu-pusu | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| orman-yolu-avcilar | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| orman-heykel | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| orman-oduncu | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| orman-ork | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| orman-kemik | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| orman-magara | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| kale-avlu-savunma | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| kale-avlu-garnizon | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| magara-genis-derinlik | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| magara-genis-gulyabani | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| kale-baskini | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| kale-baskini-muhafiz | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| sefer-salon | sefer | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| sefer-tapinak | sefer | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| sefer-kopru | sefer | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| sefer-demirhane | sefer | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| derin-karakol | sefer | `L5L5L5L5555555555555` | `L5L5L5LAAAAAAAAAAAAA` | 14 → 1 |
| derin-mezar | sefer | `L5L5L5L5555555555555` | `L5L5L5LAAAAAAAAAAAAA` | 14 → 1 |
| derin-mantar | sefer | `L5L5L5L5555555555555` | `L5L5L5LAAAAAAAAAAAAA` | 14 → 1 |
| derin-lav | sefer | `L5L5L5L5555555555555` | `L5L5L5LAAAAAAAAAAAAA` | 14 → 1 |
| k29-buzul-acik | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-buzul-kamp | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-dag-kopru | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-dag-nobetci | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-batak-kamp | boss | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k29-batak-cukur | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-col-kanyon-nehri | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-col-gemi-enkazi | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-col-vaha | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-col-sutun-harabesi | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-buzul-kayalik | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-buzul-tapinak | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-dag-karakol | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-dag-kayalik | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-batak-kale | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k29-batak-adalar | düğüm | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k32-yeralti-nehri | koridor | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k34-kale-onu | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k34-kale-ic-avlu | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k34-kale-taht-salonu | boss | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k34-kasaba-han | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k34-beyaz-sehir-dis-kapi | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k34-beyaz-sehir-saray-avlusu | boss | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k35-kasaba-demirci-tapinak | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k35-kasaba-lagim | yok | `L5L5L555555555555555` | `L5L5LÜÜÜÜÜÜÜÜÜÜÜÜÜÜÜ` | 15 → 0 |
| k36-suc-soylu | suç | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k36-suc-soygun | suç | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k36-suc-muhur | suç | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k36-baskin | suç | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k36-hucre | hapishane | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k36-dis-halka | hapishane | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k36-mudur | hapishane | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
| k36-iskele | hapishane | `L5L5L555555555555555` | `L5L5L555555555555555` | 15 → 15 |
