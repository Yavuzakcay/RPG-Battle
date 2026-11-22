# Celestial jeton kaynak denetimi

Üretildi: `python scripts/celestial-kaynak-denetim.py` (2026-11-22). **Yalnız rapor**: hiçbir jeton yazılmadı, yeniden kesim yapılmadı.

Oyundaki Celestial jetonu: **290** (`public/characters/celestial-*.webp`; hale eşleme listesindeki 288 + 2 Gladyatör ID12). Ham kaynaklar depo dışında: `RPG-Battle-ham/assets-ham/eksikler/` (dal `wip/karakter-ham`).

Yöntem: her jeton aday ham kaynak hücreleriyle karşılaştırılır (zemin ayıklanır, ana figür alınır; skor 0–100 = bütün figürün ve "baş" bölgesinin (figürün üst %30'u: saç, alın, göz) renk dağılımı farkının ortalaması; kırpma ve ölçekten bağımsız; aynı çizim ≈ 2–20, farklı baş ≈ 25–75). En yeni kabul edilen kaynak: tek hücre düzeltmesi > yeniden çizilmiş tam sayfa > hale düzeltme sayfası > hale sayfası. Oyundaki jeton en yeni kaynağa değil de eskisine daha yakınsa **ESKİ KESİM**. Ölçünün işaretleyip göz denetiminde aynı çizim çıkanlar "güncel (göz denetimi)" (gerekçe tabloda).

## Özet

| Sonuç | Jeton |
|---|---:|
| ESKİ KESİM | 7 |
| güncel | 260 |
| güncel (göz denetimi) | 15 |
| kaynak sayfası yok | 8 |

**Eski kesimde kalan: 7**: `celestial-erkek-cleric-ID1.webp`, `celestial-erkek-cleric-ID2.webp`, `celestial-erkek-cleric-ID3.webp`, `celestial-erkek-cleric-ID4.webp`, `celestial-erkek-cleric-ID5.webp`, `celestial-erkek-cleric-ID6.webp`, `celestial-erkek-cleric-ID8.webp`.

## Cleric erkek: clerik-male-celestial.jpg (kabul edilen son çizim, 3×3)

Hücre → jeton: Cleric alt sınıf eşlemesinden (`data/cleric-jeton.json`, hücre adları `data/jeton-hucre-sirasi.json`): 1 Yaşam (life-domain, kullanılmıyor), 2 Aydın, 3 Birlik Manastırı 3–16, 4 Demirci, 5 Fırtına, 6 Mezar, 7 Savaş, 8 Yakamoz, 9 Birlik Manastırı 17+. Ham sayfa: `eksikler/clerik-male-celestial.jpg` (2048×2048; dosya tarihi 2026-11-17 23:19; ham depoya b345279d "Eksikler ham sayfalari (2026-11-19)"). Eski çizim: `eksikler/hale-gemini-sayfa-06.png` (özgün `karakter/cleric-male-celestial.jpg` 2026-11-16 sayfasının halesi silinmiş hâli; kahverengi kısa saç, yıldız yok).

| Hücre | Jeton | Sonuç | Kabul edilen sayfa skor (baş) | Eski sayfa skor (baş) | Kesim defteri (`data/cc-kesim-kaynak.json`) | Dosya tarihi | Git geçmişi (yeniden eskiye) |
|---:|---|---|---|---|---|---|---|
| 1 | `celestial-erkek-cleric-ID1.webp` | ESKİ KESİM | 33.2 (43.4) | 3.8 (4.4) | kayıt yok (CC kesimi dokunmadı) | 2026-11-17 17:46 | d58f314f 2026-11-17 Celestial hale: yıldız tacı<br>987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| 2 | `celestial-erkek-cleric-ID2.webp` | ESKİ KESİM | 49.4 (73.2) | 3.5 (4.1) | kayıt yok (CC kesimi dokunmadı) | 2026-11-17 17:46 | d58f314f 2026-11-17 Celestial hale: yıldız tacı<br>987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| 3 | `celestial-erkek-cleric-ID3.webp` | ESKİ KESİM | 51.9 (72.6) | 4.4 (5.4) | kayıt yok (CC kesimi dokunmadı) | 2026-11-17 17:46 | d58f314f 2026-11-17 Celestial hale: yıldız tacı<br>987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| 4 | `celestial-erkek-cleric-ID4.webp` | ESKİ KESİM | 49.2 (75.9) | 3.4 (3.6) | kayıt yok (CC kesimi dokunmadı) | 2026-11-17 17:46 | d58f314f 2026-11-17 Celestial hale: yıldız tacı<br>987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| 5 | `celestial-erkek-cleric-ID5.webp` | ESKİ KESİM | 43.7 (66.2) | 2.2 (2.3) | kayıt yok (CC kesimi dokunmadı) | 2026-11-17 17:46 | d58f314f 2026-11-17 Celestial hale: yıldız tacı<br>987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| 6 | `celestial-erkek-cleric-ID6.webp` | ESKİ KESİM | 24.3 (28.2) | 11.6 (9.4) | kayıt yok (CC kesimi dokunmadı) | 2026-11-17 17:46 | d58f314f 2026-11-17 Celestial hale: yıldız tacı<br>987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| 7 | `celestial-erkek-cleric-ID7.webp` | güncel | 10.4 (11.4) | 40.2 (55.6) | clerik-male-celestial.jpg h7 | 2026-11-19 19:32 | 456a7d6d 2026-11-19 CC kesim C: Bard hokkabaz 20, Sorcerer 15, Barbarian aurasız 16, Human Fighter 21, Druid/Cleric Tiefling, Celestial Cleric 2<br>fd1fc974 2026-11-19 CC kesim adım 1: Gemini hale tabanı 146 Celestial jeton (sayfa 30 yok)<br>987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| 8 | `celestial-erkek-cleric-ID8.webp` | ESKİ KESİM | 45.7 (60.8) | 3.3 (3.1) | kayıt yok (CC kesimi dokunmadı) | 2026-11-17 17:46 | d58f314f 2026-11-17 Celestial hale: yıldız tacı<br>987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| 9 | `celestial-erkek-cleric-ID9.webp` | güncel | 9.4 (9.7) | 41.4 (61.4) | clerik-male-celestial.jpg h9 | 2026-11-19 19:32 | 456a7d6d 2026-11-19 CC kesim C: Bard hokkabaz 20, Sorcerer 15, Barbarian aurasız 16, Human Fighter 21, Druid/Cleric Tiefling, Celestial Cleric 2<br>fd1fc974 2026-11-19 CC kesim adım 1: Gemini hale tabanı 146 Celestial jeton (sayfa 30 yok)<br>987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |

Görsel: `gorsel-dokum/celestial-kaynak/cleric-erkek-9-hucre.png` (eski çizim | kabul edilen | oyunda).

**Kök neden:** `scripts/cc-kesim.py` `diger` adımı (commit 456a7d6d "… Celestial Cleric 2") bu sayfadan yalnız hücre 7 ve 9'u kesti; koddaki gerekçe (satır 607): "hale-gemini sayfa 06'nın yeniden yapılmışı; yalnız haleli hücreler 7 ve 9, halesiz-temiz dokunulmaz". Sayfa yalnız hale için değil Celestial başı (kısa dikenli sarı saç, altın göz, alında yıldız) için yeniden çizilmişti; "halesiz-temiz" sayılan 7 hücre (ID1–ID6, ID8) hiç kesilmedi, oyunda 2026-11-17 d58f314f'teki eski kesim duruyor.

## Kesim sırası denetimi

Git sırası (`public/characters/celestial-*`, hepsi 2026-11-19): fd1fc974 adım 1 taban (hale sayfaları, 15:01) → bf3f183b adım 2 yeni (Gladyatör + Warlock, 15:11) → 09f2ec04 adım 3 hale düzeltme 01–03 (15:14) → 456a7d6d C diğer (5'li Bard, Sorcerer düzeltme, clerik-male-celestial, 15:30) → a7634e45 kadın Rogue ID3 tek hücre (17:03) → 3c1d443d erkek Wizard WZ-B halesiz (17:18). Hale düzeltme sayfaları Gladyatör ve Warlock'tan sonra geldi. C adımı düzeltmeden sonra çalıştı ama `ONCELIK` (düzeltme 3 > diğer 2) düzeltmenin yazdığı jetonu ezemez; Celestial'de C adımının yazdığı jetonların (Bard ID3 ×2, Cleric ID7/ID9, kadın SC-3) hiçbiri düzeltme sayfasında yok.

- Defterde öncelik yüzünden reddedilen yazım (Celestial): 0.
- Son commit'i defterdeki kazanan kaynağın adımı olmayan jeton (sonradan üstüne yazılmış ya da defter dışı kesim): 0.

## Birden çok kaynağı olan diğer jetonlar

| Jeton | Sonuç | En yeni kaynak (skor, baş) | En yakın kaynak (skor, baş) | Kesim defteri | Son commit | Not |
|---|---|---|---|---|---|---|
| `celestial-erkek-barbarian-ID3.webp` | güncel | hale düzeltme 01 h1 (10.5, 10.7) | hale düzeltme 01 h1 (10.5, 10.7) | duzeltme: hale-gemini-duzeltme-sayfa-01.jpg h1 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-erkek-barbarian-ID8.webp` | güncel (göz denetimi) | hale düzeltme 02 h1 (25.7, 26.4) | hale sayfa 01 h9 (18.9, 22.3) | duzeltme: hale-gemini-duzeltme-sayfa-02.jpg h1 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) | düzeltme hücresinin figürü + kaynak jetondan geri konan öfke aurası (cc-kesim.py düzeltme adımının tasarımı); yüz düzeltmeyle aynı |
| `celestial-erkek-bard-ID3.webp` | güncel | erkek-5'li h1 (8.6, 8.7) | erkek-5'li h1 (8.6, 8.7) | diger: erkek-5'li.jpg h1 | 456a7d6d 2026-11-19 CC kesim C: Bard hokkabaz 20, Sorcerer 15, Barbarian aurasız 16, Human Fighter 21, Druid/Cleric Tiefling, Celestial Cleric 2 |  |
| `celestial-erkek-fighter-ID10.webp` | güncel | hale düzeltme 03 h1 (8.7, 8.5) | hale düzeltme 03 h1 (8.7, 8.5) | duzeltme: hale-gemini-duzeltme-sayfa-03.jpg h1 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-erkek-monk-ID11.webp` | güncel | hale düzeltme 01 h2 (9.1, 10.1) | hale düzeltme 01 h2 (9.1, 10.1) | duzeltme: hale-gemini-duzeltme-sayfa-01.jpg h2 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-erkek-monk-ID9.webp` | güncel | hale düzeltme 02 h2 (9.3, 9.4) | hale düzeltme 02 h2 (9.3, 9.4) | duzeltme: hale-gemini-duzeltme-sayfa-02.jpg h2 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-erkek-paladin-ID8.webp` | güncel | hale düzeltme 03 h3 (10.7, 10.1) | hale düzeltme 03 h3 (10.7, 10.1) | duzeltme: hale-gemini-duzeltme-sayfa-03.jpg h3 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-erkek-rogue-ID10.webp` | güncel | hale düzeltme 02 h4 (7.8, 8.5) | hale düzeltme 02 h4 (7.8, 8.5) | duzeltme: hale-gemini-duzeltme-sayfa-02.jpg h4 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-erkek-rogue-ID3.webp` | güncel | hale düzeltme 03 h4 (6.7, 7.1) | hale düzeltme 03 h4 (6.7, 7.1) | duzeltme: hale-gemini-duzeltme-sayfa-03.jpg h4 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-erkek-rogue-ID5.webp` | güncel | hale düzeltme 01 h5 (9.7, 10.8) | hale düzeltme 01 h5 (9.7, 10.8) | duzeltme: hale-gemini-duzeltme-sayfa-01.jpg h5 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-erkek-rogue-ID7.webp` | güncel | hale düzeltme 02 h5 (5.8, 5.8) | hale düzeltme 02 h5 (5.8, 5.8) | duzeltme: hale-gemini-duzeltme-sayfa-02.jpg h5 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-erkek-rogue-ID9.webp` | güncel | hale düzeltme 03 h5 (6.9, 7.2) | hale düzeltme 03 h5 (6.9, 7.2) | duzeltme: hale-gemini-duzeltme-sayfa-03.jpg h5 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-erkek-warlock-WL-1.webp` | güncel | warlock-male-celestial h1 (11.5, 11.9) | warlock-male-celestial h1 (11.5, 11.9) | yeni: warlock-male-celestial.jpg h1 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-erkek-warlock-WL-10.webp` | güncel | warlock-male-celestial h10 (8.7, 9.9) | warlock-male-celestial h10 (8.7, 9.9) | yeni: warlock-male-celestial.jpg h10 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-erkek-warlock-WL-11.webp` | güncel | warlock-male-celestial h11 (8.1, 8.0) | warlock-male-celestial h11 (8.1, 8.0) | yeni: warlock-male-celestial.jpg h11 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-erkek-warlock-WL-2.webp` | güncel | warlock-male-celestial h2 (9.9, 11.2) | warlock-male-celestial h2 (9.9, 11.2) | yeni: warlock-male-celestial.jpg h2 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-erkek-warlock-WL-3.webp` | güncel | warlock-male-celestial h3 (8.4, 8.7) | warlock-male-celestial h3 (8.4, 8.7) | yeni: warlock-male-celestial.jpg h3 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-erkek-warlock-WL-4.webp` | güncel | warlock-male-celestial h4 (7.7, 8.5) | warlock-male-celestial h4 (7.7, 8.5) | yeni: warlock-male-celestial.jpg h4 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-erkek-warlock-WL-5.webp` | güncel | warlock-male-celestial h5 (10.0, 9.3) | warlock-male-celestial h5 (10.0, 9.3) | yeni: warlock-male-celestial.jpg h5 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-erkek-warlock-WL-6.webp` | güncel | warlock-male-celestial h6 (10.9, 12.3) | warlock-male-celestial h6 (10.9, 12.3) | yeni: warlock-male-celestial.jpg h6 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-erkek-warlock-WL-7.webp` | güncel | warlock-male-celestial h7 (7.7, 8.9) | warlock-male-celestial h7 (7.7, 8.9) | yeni: warlock-male-celestial.jpg h7 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-erkek-warlock-WL-8.webp` | güncel | warlock-male-celestial h8 (18.5, 17.3) | warlock-male-celestial h8 (18.5, 17.3) | yeni: warlock-male-celestial.jpg h8 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-erkek-warlock-WL-9.webp` | güncel | warlock-male-celestial h9 (14.0, 9.9) | warlock-male-celestial h9 (14.0, 9.9) | yeni: warlock-male-celestial.jpg h9 | bf3f183b 2026-11-19 CC kesim adım 2: Gladyatör (champion, fighter ID12) 20 jeton ve Warlock 10 sayfa (110 jeton) |  |
| `celestial-kadin-bard-ID3.webp` | güncel | kadin-5'li h1 (7.5, 7.1) | kadin-5'li h1 (7.5, 7.1) | diger: kadin-5'li.jpg h1 | 456a7d6d 2026-11-19 CC kesim C: Bard hokkabaz 20, Sorcerer 15, Barbarian aurasız 16, Human Fighter 21, Druid/Cleric Tiefling, Celestial Cleric 2 |  |
| `celestial-kadin-monk-ID10.webp` | güncel | hale düzeltme 03 h2 (8.6, 8.3) | hale düzeltme 03 h2 (8.6, 8.3) | duzeltme: hale-gemini-duzeltme-sayfa-03.jpg h2 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-kadin-monk-ID3.webp` | güncel | hale düzeltme 01 h3 (8.6, 9.4) | hale düzeltme 01 h3 (8.6, 9.4) | duzeltme: hale-gemini-duzeltme-sayfa-01.jpg h3 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-kadin-monk-ID5.webp` | güncel | hale düzeltme 02 h3 (7.3, 6.6) | hale düzeltme 02 h3 (7.3, 6.6) | duzeltme: hale-gemini-duzeltme-sayfa-02.jpg h3 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-kadin-paladin-ID1.webp` | güncel | hale düzeltme 01 h4 (11.5, 11.9) | hale düzeltme 01 h4 (11.5, 11.9) | duzeltme: hale-gemini-duzeltme-sayfa-01.jpg h4 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-kadin-rogue-ID3.webp` | güncel | celestial-kadin-rogue-ID3-duzeltme (13.5, 13.2) | celestial-kadin-rogue-ID3-duzeltme (13.5, 13.2) | duzeltme: celestial-kadin-rogue-ID3-duzeltme.jpg h1 | a7634e45 2026-11-19 Kadın Celestial Rogue ID3: düzeltme hücresinden yeniden kesim (şapka tepesindeki hale kalıntısı gitti) |  |
| `celestial-kadin-sorcerer-SC-3.webp` | güncel | sorcerer-duzelt-B-sonuc h1 (defter) (11.6, 8.4) | sorcerer-duzelt-B-sonuc h1 (defter) (11.6, 8.4) | diger: sorcerer-duzelt-B-sonuc.jpg h1 | 456a7d6d 2026-11-19 CC kesim C: Bard hokkabaz 20, Sorcerer 15, Barbarian aurasız 16, Human Fighter 21, Druid/Cleric Tiefling, Celestial Cleric 2 | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-kadin-warlock-WL-10.webp` | güncel (göz denetimi) | hale düzeltme 01 h6 (7.9, 8.3) | hale sayfa 28 h9 (7.3, 8.5) | duzeltme: hale-gemini-duzeltme-sayfa-01.jpg h6 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) | iki kaynak aynı çizim (düzeltme yalnız haleyi kaldırdı); defter düzeltme, git uyumlu |
| `celestial-kadin-warlock-WL-2.webp` | güncel | hale düzeltme 02 h6 (20.1, 27.0) | hale düzeltme 02 h6 (20.1, 27.0) | duzeltme: hale-gemini-duzeltme-sayfa-02.jpg h6 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-kadin-warlock-WL-3.webp` | güncel | hale düzeltme 03 h6 (9.5, 10.6) | hale düzeltme 03 h6 (9.5, 10.6) | duzeltme: hale-gemini-duzeltme-sayfa-03.jpg h6 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |
| `celestial-kadin-warlock-WL-4.webp` | güncel | hale düzeltme 01 h7 (8.9, 9.8) | hale düzeltme 01 h7 (8.9, 9.8) | duzeltme: hale-gemini-duzeltme-sayfa-01.jpg h7 | 09f2ec04 2026-11-19 CC kesim adım 3: hale düzeltme sayfaları 01-03, 20 Celestial jeton (kesin yetkili) |  |

Görsel: `gorsel-dokum/celestial-kaynak/cok-kaynakli.png`.

## Tek kaynaklı jetonlar (yalnız hale sayfası)

239 jetonun hale sayfasından başka ham kaynağı yok: ham klasörde bu jetonlar için yeniden çizilmiş sayfa bulunmadı (kadın Cleric dahil: `eksikler/` altında kadın Celestial Cleric sayfası yok). Hepsi hale sayfasındaki çizimle aynı (ölçü ya da göz denetimi).

| Jeton | Hale sayfası skor (baş) | Not |
|---|---|---|
| `celestial-erkek-bard-ID7.webp` | 25.6 (25.6) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-erkek-monk-ID8.webp` | 50.4 (32.1) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-erkek-paladin-ID3.webp` | 37.4 (44.7) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-erkek-sorcerer-SC-5.webp` | 41.4 (41.1) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-erkek-sorcerer-SC-9.webp` | 39.5 (40.6) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-kadin-bard-ID7.webp` | 25.8 (25.6) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-kadin-monk-ID8.webp` | 50.2 (34.3) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-kadin-paladin-ID3.webp` | 37.3 (44.1) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-kadin-rogue-ID7.webp` | 47.0 (43.2) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-kadin-sorcerer-SC-5.webp` | 85.9 (83.3) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-kadin-sorcerer-SC-9.webp` | 43.2 (51.0) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-kadin-warlock-WL-1.webp` | 26.8 (8.7) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |
| `celestial-kadin-warlock-WL-5.webp` | 39.2 (31.1) | aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması |

Görsel: `gorsel-dokum/celestial-kaynak/supheli.png`.

## Ham kaynağı bulunamayanlar

Hale sayfa 30 (`hale-gemini-sayfa-30.png`) ham klasörde yok (fd1fc974 "sayfa 30 yok"); bu sayfanın jetonları (erkek Wizard WZ-A7…B7) karşılaştırılamadı. Kesim defteri: WZ-B1/B2/B3/B4/B7 2360265b halesiz hâlinden (3c1d443d), WZ-B5 hale düzeltme 03 h7 (09f2ec04), WZ-A7/A8/B6 CC öncesi kesim (d58f314f).

- `celestial-erkek-wizard-WZ-A7.webp` (son commit d58f314f 2026-11-17 Celestial hale: yıldız tacı)
- `celestial-erkek-wizard-WZ-A8.webp` (son commit d58f314f 2026-11-17 Celestial hale: yıldız tacı)
- `celestial-erkek-wizard-WZ-B1.webp` (son commit 3c1d443d 2026-11-19 Erkek Celestial Wizard WZ-B1/B2/B3/B4/B7: 2360265b halesiz hâli uygulandı, B2/B3 çizgi kalıntısı silindi)
- `celestial-erkek-wizard-WZ-B2.webp` (son commit 3c1d443d 2026-11-19 Erkek Celestial Wizard WZ-B1/B2/B3/B4/B7: 2360265b halesiz hâli uygulandı, B2/B3 çizgi kalıntısı silindi)
- `celestial-erkek-wizard-WZ-B3.webp` (son commit 3c1d443d 2026-11-19 Erkek Celestial Wizard WZ-B1/B2/B3/B4/B7: 2360265b halesiz hâli uygulandı, B2/B3 çizgi kalıntısı silindi)
- `celestial-erkek-wizard-WZ-B4.webp` (son commit 3c1d443d 2026-11-19 Erkek Celestial Wizard WZ-B1/B2/B3/B4/B7: 2360265b halesiz hâli uygulandı, B2/B3 çizgi kalıntısı silindi)
- `celestial-erkek-wizard-WZ-B6.webp` (son commit d58f314f 2026-11-17 Celestial hale: yıldız tacı)
- `celestial-erkek-wizard-WZ-B7.webp` (son commit 3c1d443d 2026-11-19 Erkek Celestial Wizard WZ-B1/B2/B3/B4/B7: 2360265b halesiz hâli uygulandı, B2/B3 çizgi kalıntısı silindi)

Bütün jetonların göz denetimi: `gorsel-dokum/celestial-kaynak/butun-celestial.png` (sınıf × cinsiyet sıraları).
