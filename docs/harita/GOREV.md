# Görev: Altıgen harita sistemi (Çöl ve Volkan)

Bu dosya Claude Code için. Önce CLAUDE.md ve DECISIONS.md'yi oku, çalışma düzenine (küçük adımlar, Türkçe, PowerShell, tırnaklı commit mesajı, kararları DECISIONS.md'ye yaz) uy.

## Amaç

Savaş şu an "karşılıklı kartlar" mantığıyla çalışıyor. Bunu **altıgen ızgaralı yatay bir harita** mantığına çeviriyoruz. Karakterler ve düşmanlar haritada bir altıgene yerleşir, yürür, mesafeye göre saldırır. Her haritanın zemin türleri (siper, zorlu zemin, lav, yükseklik) ve kendine özel kuralları (sıcak, fırtına, lav) vardır. Yeni harita eklemek **sadece veri eklemek** olmalı, kod değişmemeli.

İlk iki harita hazır: **Çöl** (`maps/col.json`) ve **Volkan** (`maps/volkan.json`). Görseller `public-maps/` içinde. Kurallar ve gerekçeler `harita_sistemi_ve_ilk_haritalar.md` dosyasında. Hareketli görsel katmanın çalışan örneği `ornek/hareket-prototipi.html` (açıp bakabilirsin).

## Önce oku ve rapor ver (kod yazmadan)

1. Bugünkü savaş durumunda **konum** diye bir kavram var mı? Yükseklik avantajı (`environments.json`, ortam ve koşul avantajı) bugün nasıl hesaplanıyor?
2. Silahların ve büyülerin **menzil** bilgisi (ft) veride var mı, yoksa eklenmesi mi gerekiyor?
3. Yaratıkların **uçma** özelliği (lavdan etkilenmemek için) veride var mı?
4. Mevcut komut/olay (Command, event, reducer) düzenine en az değişiklikle nasıl oturtursun? Kısa bir plan yaz, onay bekle.

## Kararlar (bu görev için kesin)

- **Izgara:** 15 sütun × 7 satır, düz üstlü (flat-top) altıgen, 1 altıgen = 5 ft. Hız 30 ft = 6 altıgen.
- **Veri koordinatı:** `tiles` dizisinde satır satır, sütun 1 solda, satır 1 üstte (kullanıcıya görünen numaralar 1'den başlar). **Odd-q** düzeni: 0 tabanlı sütun numarası tek olan sütunlar yarım altıgen aşağı kayar (yani 1 tabanlı çift numaralı sütunlar).
- **Dönüşüm (odd-q ↔ axial):** `q = col`, `r = row - (col - (col & 1)) / 2` ve tersi `col = q`, `row = r + (col - (col & 1)) / 2` (0 tabanlı col/row). Mesafe: `(|dq| + |dq + dr| + |dr|) / 2`.
- **Yeni harita = yeni veri.** Zemin türleri koddaki bir katalogda durur (aşağıda), haritalar sadece harfleri kullanır.
- **Aynalama:** Her harita yatay aynalanabilir (`mirrorable`). Aynalama satırları ters çevirir (arazi aynalanır); başlangıç sütun aralıkları sabit kalır (oyuncular hep solda), altıgenleri aynalı araziden yeniden hesaplanır. Arayüz görseli de yatay çevirir. Çöl simetrik olmadığı için GM'e bu seçenek gerekli.

## Onaylanan kararlar (Claude Code'un ilk raporuna cevap)

1. **Genel plan onaylandı.** Harita isteğe bağlı olsun, haritasız savaşlar ve mevcut 205 test aynen çalışsın. Haritalar `data/maps/*.json`, görseller `public/maps/*.webp`, her haritaya `environmentId` eklensin.
2. **Komut adları:** Soyut yükseklik komutu `change_height` olsun (sadece haritasız savaşta), `move` haritadaki hareket olsun. Haritalı savaşta tırmanma zarı yok: yükseklik altıgenden gelir (`H` = 1, diğerleri 0), mevcut "yüksek saldıran avantajlı, alçak dezavantajlı" kuralı aynen işler.
3. **Kurulum aşaması:** Otomatik başlamasın. GM `start_battle` komutu versin. Herkes yerleşmeden komut reddedilsin.
4. **Atlama ve lav:** Atlamada sadece iniş altıgeni sayılır, aradaki altıgenlerin üstünden geçilir. Gönüllü `move` ile lava girmek ve lav altıgenine inen `jump` komutları **reddedilir** (yanlışlıkla ölüm olmasın). `fell_into_lava` olayı sadece zorla hareket (ileride itme) ve `tile_changed` (lav yükselmesi) ile gelir. `move` yol bulucusu lavı varsayılan olarak geçilmez sayar.
5. **Uçma:** Canavarlara `fly?: number` alanı eklensin, SRD'deki uçuş hızları girilsin. Uçan yaratık lavdan ve zorlu zeminden etkilenmez, engellerden (`c`, `#`) etkilenir. Karakterlerde şimdilik uçma yok.

## Zemin türü kataloğu (`terrain.ts`)

| Harf | Ad | Yükseklik | Hareket | Siper | Özel |
|---|---|---|---|---|---|
| `.` | Açık zemin / kum | 0 | normal | yok | Çölde gizlenme yapılabilir (`hideable`) |
| `d` | Kum tepesi | 0 | normal | yarım | Gizlenme yapılabilir |
| `r` | Kaya kümesi | 0 | zorlu | 3/4 | Gölge verir (`shade`) |
| `c` | Ayakta sütun | 0 | engel | 3/4 | Gölge verir |
| `k` | Yıkık sütun / moloz | 0 | zorlu | yarım | Gölge verir |
| `t` | Taşlık | 0 | zorlu | yok | Gizlenme yapılamaz |
| `H` | Yüksek bazalt | 1 | normal | yok | Yüksek zemin (motorun -1/0/1 ölçeğiyle uyumlu) |
| `~` | Lav | - | ölümcül | - | Girene anında ölüm, uçan yaratık hariç |
| `f` | Alev | 0 | normal | yok | Girince veya turu orada bitirince 1d6 ateş hasarı |
| `#` | Dış kayalık | - | engel | - | Oyun alanı dışı |

- **Zorlu zemin:** Girmek 2 altıgenlik hareket harcar.
- **Siper:** yarım = +2 AC, 3/4 = +5 AC (5e kuralı).
- **Gölge:** `shade` taşıyan altıgen ve ona bitişik altıgenler gölgedir (çöl sıcağı için).

## Harita verisi biçimi

`maps/col.json` ve `maps/volkan.json` örnek biçimdir. Alanlar: `id`, `name`, `size`, `orientation`, `offset`, `tiles` (7 satır, 15 karakter), `startZones` (sütun aralığı; sadece geçilebilir ve tehlikesiz altıgenler; engel, lav, alev ve 3/4 siperli kaya kümesi (`r`) başlangıç yeri sayılmaz, `t` ve `k` sayılır), `variants` (her varyantın görseli ve kuralları), `mirrorable`. Kuralların parametreleri (DC, hasar, tur sayısı) JSON'dadır, kodda sabit olmasın.

Yükleyici doğrulasın: 7×15 boyut, sadece katalogdaki harfler, başlangıç bölgeleri boş değil, görsel dosyası var.

## Adımlar (her adım ayrı commit ve test, adım sonunda dur ve rapor ver)

**İlk oturumda sadece Adım 1-4'ü yap.**

1. **`hex.ts`** (saf modül, test dosyasıyla): axial ve offset dönüşümleri, mesafe, komşular, halka (ring), menzildeki altıgenler, iki altıgen arası çizgi (görüş hattı için), yol bulma (hareket maliyeti ve engellerle, zorlu zemin 2). Testler: bilinen koordinatlar, 15×7 köşeler, tek ve çift sütun kayması.
2. **`terrain.ts` ve harita yükleyici:** Katalog, JSON yükleme, doğrulama, başlangıç bölgesi hesabı, aynalama. Testler: her iki harita yüklenir, başlangıç bölgesi sayıları (Volkan 16'şar, Çöl oyuncu 15 düşman 20), aynalama iki kez uygulanınca orijinale döner.
3. **Konum modeli:** Her savaşçıya `pos` ekle. Komutlar: `place` (kendi başlangıç bölgesine yerleştir, sadece kurulum aşamasında), `move` (yol, hareket bütçesi, zorlu zemin 2, engel geçilmez). Olaylar: `placed`, `moved`. Lav altıgenine giren (kendi isteğiyle ya da itilerek) anında ölür: HP 0 ve ölüm kurtarması yok, uçan yaratıklar etkilenmez. Zaten var olan oyuncu/GM yetki kuralı (oyuncu sadece kendi karakterini, GM sadece düşmanları yönetir) korunsun.
4. **Atlama:** Komut `jump`. 5e uzun atlama kuralı: o turda en az 10 ft (2 altıgen) düz koşu yapıldıysa STR skoru kadar ft, koşusuz yarısı. Mesafe hareketten düşer. **Menzil dışı atlama komutu reddedilir** (hata mesajıyla). Lav inilen altıgendeyse komut yine reddedilir (yukarıdaki Onaylanan kararlar, madde 4). (Dikkat: `harita_sistemi_ve_ilk_haritalar.md` "mesafe yetmiyorsa lava düşer" diyor. Komutu reddetmek daha güvenli, bunu DECISIONS.md'ye yaz.)

**Sonraki oturumlar (şimdi yapma, sırayla):**

5. Menzil: saldırı ve büyülerde mesafe kontrolü (yakın dövüş 1 altıgen, uzun erişim 2, menzilli silahlar kendi menzilinde, normal ve uzun menzil).
5b. **Alan şekilleri ve patlama noktası** (Adım 8'den önce): koni, küre, çizgi ve yayılım (emanation) alanları; alandaki bütün yaratıklar etkilenir. Alan büyülerinde siper ve görüş hattı büyücüden değil patlama/çıkış noktasından hesaplanır (şu an büyücüden hesaplanıyor ve yalnızca tek hedefin menzil içinde olduğuna bakılıyor).
5c. **Beceri yetkinlikleri** (5b'den sonra, Adım 8'den önce): beceri yetkinlikleri (Stealth, Perception, Athletics vb.) ve yetkinlik bonusunun kontrollere eklenmesi. Bağlı olanlar: `bog` (Athletics DC 12), `trap` (Perception DC 13), `stealth` ve mevcut gizlenme/arama zarları.
5d. **Tur içi eylem ekonomisi** (Adım 11'deki denge ölçümünden önce, mümkünse Adım 8'den önce): eylem, bonus eylem, tepki ve hareket; saldırı, büyü, gizlenme, arama, koşma (Dash) ve ayrılma (Disengage) bir eylem harcasın; Extra Attack ve Multiattack tek eylem sayılsın.
6. Yükseklik ve siper: Altıgenin yüksekliği mevcut yükseklik avantajı kuralını beslesin. Hedefin altıgenindeki siper, uzaktan saldırılarda AC'ye eklensin (yakın dövüş etkilenmesin). Bunu DECISIONS.md'ye öneri olarak yaz, kullanıcıya sor.
7. Gizlenme (çöl): `hide` komutu, Gizlenme (Stealth) zarı, ağır zırhta dezavantaj. Gizli yaratık hedeflenemez, saldırınca veya yürüyünce ortaya çıkar, saldırıda avantaj alır.
8. Harita kuralları motoru: `MapRule` arayüzü ve tur başı/sonu kancaları (hook). Kurallar: `heat`, `sandstorm`, `lavaEdge`, `eruption`, `lavaRise`. GM tetiklemeli olanlar komutla çalışır (`eruption` merkez altıgeni parametre alır). `lavaRise` bir tur önce uyarı olayı üretir, sonra altıgenleri lava çevirir (`tile_changed` olayı). RNG enjekte edilebilir kalsın.
9. Düşman yapay zekâsı: hedefe yaklaş, lavdan kaçın, menzile girince saldır (mevcut `chooseEnemyCommand`i genişlet).
10. Arayüz: Yatay harita ekranı, görsel + altıgen ızgara (SVG veya canvas), karakter jetonları, dokununca seç, yürüme yolu önizlemesi, atlama menzili, altıgen bilgisi (tür, siper, yükseklik). Piksel görsel `image-rendering: pixelated`. Telefon yatay kilitli, minimum altıgen yüksekliği 44 piksel, gerekirse yakınlaştırma ve kaydırma. Hareketli katman (`ornek/hareket-prototipi.html`) için küçük düşük çözünürlüklü tuval ve pil tasarrufunda kapatma.
11. Demo senaryoları: Mira, Bor ve kurtlarla her iki haritada bir savaş. Dengeyi yeniden ölç (SRD canavarları sonrası ölçülmedi).

## Sonraya kalanlar

- Büyü bileşenleri (V, S, M): yalnızca sözlü (V) bileşenli büyü gizlenmeyi bozsun (şu an her büyü bozuyor).
- Kalıcı alanların sonraki turlardaki etkisi: Web, Moonbeam, Stinking Cloud, Spirit Guardians (ve Entangle, Call Lightning) şimdilik yalnızca büyü yapıldığı an etki ediyor; tur başı/sonu ve alana giriş etkileri eklenecek.
- Faerie Fire ve Slow gibi alanlı ama elle uygulanan büyülere alan bağlanması.

## Gelen dosyalar

- `maps/col.json`, `maps/volkan.json`: harita verisi (koda yakın bir yere koy, `environments.json` ile uyumlu olsun).
- `public-maps/*.webp`: 1280×715, yarım boy piksel sanatı. Dosya adları JSON'daki `image` alanlarıyla eşleşir (`maps/` önekiyle sun).
- `ornek/hareket-prototipi.html` ve jpg'ler: hareket katmanı örneği (sıcak titreşimi, kum fırtınası, lav parıltısı). Sadece referans, doğrudan kopyalama.
- `harita_sistemi_ve_ilk_haritalar.md`: kuralların kaynağı.

## DECISIONS.md'ye yazılacaklar

- Altıgen ızgara 15×7, flat-top, odd-q, 1 altıgen = 5 ft.
- Zemin türü kataloğu ve siper/zorlu zemin kuralları.
- Lav girene ölüm (uçan hariç); gönüllü hareket ve atlama lava reddedilir, ölüm sadece zorla hareket ve lav yükselmesiyle.
- Atlama: 5e uzun atlama kuralı, menzil dışı komut reddedilir.
- Haritalar veri, kurallar parametreli (JSON).
- Aynalama seçeneği.

## Yapma

- Görselleri testlere sokma (büyük dosya). Testler sadece veri ve mantıkla çalışsın.
- Mevcut 205 testi bozma. Her adımdan sonra `npm test` ve tip kontrolü temiz olsun.
- Lisans metinleri ve atıf dosyalarına dokunma.
