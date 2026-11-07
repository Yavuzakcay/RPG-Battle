# Ertelenen büyü parçaları (Kuyruk G6)

Savaş modelinin dışında kalan ya da bilerek ertelenen büyü parçalarının kaydı, **tetikleyiciye göre gruplu**: tetikleyici gelince o gruptaki parçalar birlikte ele alınır. Mekanik donması (`docs/MEKANIK-DONMA.md`) yürürlükte olduğu sürece hiçbiri yapılmaz; donmayı yalnızca kullanıcı kaldırır. Güncel durum tablosu `harita/belgeler/BUYU-DURUM.md` ("Kapsam dışı notlu" bölümü bu belgeye işaret eder).

> Not: Görev metni bu belgenin kaynağı olarak `claude/buyu-kapsam-disi-ertelenen.md` dosyasını anıyordu; depoda ve oturum ortamında böyle bir dosya yoktu. Bu belge `BUYU-DURUM.md`'nin kapsam dışı satırlarından (`data/spells*.json` `kapsamDisi`) ve G6'da çıkan kalanlardan derlendi; kaynak dosya sonradan verilirse buradaki gruplara eklenir.

## 1. Işık modeline "loş ışık" eklenirse

Işık modeli bugün aydınlık/karanlık (`litHexes`). Tetikleyici: loş ışık katmanı.

- `light` (0): loş ışık ayrımı; 1 saatlik süre savaştan uzun.
- `dancing-lights` (0): dört ayrı ışık yerine birleşik insansı biçim (SRD seçeneği).
- `faerie-fire` (1): 10 ft loş ışık yalnız karanlık/gece haritasında anlamlı.
- `continual-flame` (2): loş ışık ayrımı.
- `daylight` (3): ek 60 ft loş ışık (karanlık haritada aydınlattığı alan SRD'den dar; "kısmen" kararı).

## 2. Savaş modeline dikey geometri (silindir yüksekliği, tavan) eklenirse

- `call-lightning` (3), `sleet-storm` (3): silindir yüksekliği; bulut büyücünün üstünde sayılır.
- `fog-cloud` (1), `stinking-cloud` (3): kürenin yüksekliği ve ızgaraya yuvarlanması.
- `jump` (1): havadaki yay ve katmansız haritada dikey zıplama.
- `spider-climb` (2): tavan modeli; eller serbest kuralı savaş dışı.

## 3. Çok altıgen bayrağı (`multiHex`) varsayılan açılırsa

- `enlarge-reduce` (2): boyut etkisi altıgen sayısını değiştirir (bayrak kapalıyken tek altıgen).
- `conjure-animals` (3): Large sürü.

## 4. Kurulum / dinlenme / uzun süreli sahne modeli eklenirse (savaş dışı süreler)

- `animate-dead` (3): 1 dakika döküm, 24 saatlik kontrol yenileme.
- `plant-growth` (3): Enrichment (8 saatlik döküm, bir yıl verim).
- `remove-curse` (3): lanetli eşyada bağlılığı koparma.
- `alter-self` (2): Change Appearance.
- `mage-armor` (1): zırh giyince bitme (savaşta zırh giyilmez).
- `darkness` (2): nesnenin üstünü örtmek.
- `dispel-magic` (3): eşyanın kendi büyüsü dağılmaz (SRD ile uyumlu; ek iş yok).

## 5. Seçim ya da ek durum gerektiren parçalar (her biri ayrı küçük mekanik)

- `hex` (1): seçilen yeteneğin STR/DEX dışı kontrolü (savaşta karşılığı yok).
- `blindness-deafness` (2): Deafened'in duymaya bağlı yetenek kontrolleri.
- `protection-from-evil-and-good` (1): ele geçirme (possession) yapan canavar oyunda yok; canavar eklenirse.
- `web` (2): tutunma yeri (haritada zemine serili sayılır).
- `flaming-sphere` (2): ışık yarıçapı altıgene yuvarlanır.
- `entangle` (1), `conjure-fey` (6): yalnız görsel (bitkilerin çekilmesi, ruhun görünüşü).

## 6. G6'dan kalanlar (kullanıcı kararıyla)

- `wish` (9): serbest dilek tanım gereği Game Master kararı; yalnız büyü kopyalama kolu savaşta (G6: seçici arayüzde).
- `animal-shapes` (8): kullanıcı kararı (2026-11-07) ile **vazgeçildi**, savaş dışı; ertelenmiş değil, kapalı.
- `enhance-ability` (2): kullanıcı kararı ile savaş dışı; kapalı.
- `see-invisibility` (2): kamuflaj/gizlenmeyi açığa çıkarma SRD'de yok; ev kuralı olarak ele alınacak (kullanıcı kararı bekliyor, motorda şimdi yalnızca `Invisible` durumunu etkiler).
- `beacon-of-hope` (3): en yüksek iyileştirme kalan tek yol: Uncanny Metabolism (Monk; `metabolismEvents` savaş durumunu almıyor, kural sürümü kapısı için imza değişikliği gerekir) ve paket iyileştirme zarları (`paket/p11.ts`, kendi zar değiştirme yolu). İkisi küçük; tetikleyici: bir sonraki iyileştirme dokunuşu.
- `charm-person` (1): K61'de kapandı (sürüm 44: tepki bağı yalnız Dominate'te, `reactionLink`).
