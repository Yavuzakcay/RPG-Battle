# Yerleşim sistemi (Kuyruk 34b, 35)

Veri `data/yerlesim.json`, saf yardımcılar `src/yerlesim/yerlesim.ts`, durum Serüven katmanında (`src/journey/seruven.ts`), keşif oturumu `src/app/seruvenBattle.ts` (`yerlesimSession`, `yerlesimCrossCommand`), hub `src/screens/YerlesimHub.tsx`. Hepsi Serüven ekranının tembel parçasında (ana parçaya yalnızca metinler).

## Model
- **Şablon:** `kale`, `kasaba`, `sehir`. **Yerleşim:** kimlik, TR/EN ad, şablon, sahibi ırk (`irk`), görünüm (`gorunum` → `gorunumler`: şablon + CSS renk filtresi), başlangıç haritası, hub ayarı, harita listesi. Kuyruk 35: `kopya` → başka yerleşimin haritaları, hub'ı ve başlangıcı (yeni yerleşim yalnızca JSON eklemesi).
- **Harita düğümü:** `mapId`/`variantId`, kapılar (`hexes` 1 tabanlı → `to`: aynı yerleşimin haritası; `null` = hub), varış altıgenleri (`girisler[gelinen harita | hub]`; yoksa haritanın parti başlangıcı).
- **Yerleşimler:** `kral-kalesi` (Kale Önü → kapı → Kale Avlusu `kale-ic-avlu` → donjon kapısı (`donjon-kapi` nesnesinin önü) → Taht Salonu; isteğe bağlı zindan dalı: avlunun batı kapısı (7,3) → `dungeon`/`mesale`, geri avluya), `beyaz-sehir` (Dış Kapı → Pazar Meydanı `sehir-meydani` → Saray Avlusu; lağım `dungeon`/`mesale` Pazar'ın batı kapısından), `kasaba-ornek` ("Kasaba": meydan `sehir-meydani` → batı taverna, doğu Kasaba Hanı, kuzey Demirci ve Tapınak `kasaba-demirci-tapinak` (kuzey yolu hub'a), güney Kasaba Lağımı `kasaba-lagim`; hepsinden meydana dönüş).
- **Irk görünümleri (Kuyruk 35):** İnsan (şehir, Beyaz Şehir, filtresiz varsayılan), Cüce (kale, soğuk taş-bakır), Goliath (kale, buz mavisi-gri), Ejderha Doğumlu (kale, kızıl-kor), Elf (kasaba, yeşil-altın), Gnom (kasaba, çamurlu yeşil-kahve), Yarımcık/Hobbit (kasaba, sıcak toprak), Ork (kasaba, soluk yeşil-kızıl), Tiefling (kasaba, mor-mavi). Sekiz ırk kopyası tanımlı (`cuce-kalesi`, `goliath-kalesi`, `ejder-kalesi`, `elf-kasabasi`, `gnom-kasabasi`, `yarimcik-kasabasi`, `ork-kasabasi`, `tiefling-kasabasi`); kıta düğümüne bağlı değil.
- **Filtre:** hub başlığı ve savaş haritası görseli (yalnızca `<img>`; ızgara ve jetonlar değil). Ayarlar → "Yerleşim görünümü" ve savaş menüsü kapatır (`rpg-battle-harita-renk`).

## Akış
1. Serüven'de yerleşim düğümünde (Batı Kıyısı: Kral Kalesi, Beyaz Şehir; Liman "Yakında") "Yerleşime gir" → hub (`yerlesim_enter`).
2. Hub: **Haritalar** (kapı geçişi açıkken başlangıç ve kapıdan ulaşılmış haritalar), **Dükkân** (sabit fiyat; satış yarı fiyat), **Han** (uzun dinlenme; ücret veride, 0), **Görevler** (şablon, yer tutucu NPC; al → hedef düğüm tamamlanınca ödül), **Yerleşimden çık**.
3. Harita: düşmansız keşif oturumu (`explore`, çıkışlar = kapı altıgenleri). Bir parti üyesi kapı altıgenine varınca ("Gir") sonraki harita hemen açılır (`yerlesim_map via: kapi`); HP/kaynak/durum korunur. Kapıya varmadan ayrılınca hub'a dönülür. Varış altıgenleri Game Master bağlamıyla yerleştirilir (haritanın oyuncu bölgesi dışında da); partiden azsa kalanlar parti bölgesine, kapı altıgenine değil. Savaş sırasında keşif kapalı (çıkış yok).

## Anahtarlar (Serüven kuralları paneli, kayıtta)
- `yerlesimler` (açık): kapalıyken yerleşim düğümleri "Yakında" (K33 davranışı).
- `yerlesimKapi` (açık): kapalıyken kapı geçişi yok; haritalar hub'dan, çıkış = başlangıç altıgenleri (hub'a dönüş).
- `irkBaslangic` (açık; yeni Serüven formunda): ilk karakterin türünün yurdu (`irkBaslangic` verisi): İnsan → Batı Kıyısı/Beyaz Şehir, Cüce → Dağ, Elf/Yarımcık/Ork → Orman, Gnom → Bataklık, Goliath → Buzul, Ejderha Doğumlu → Volkan Adası, Tiefling → Derinlikler; Celestial → Batı Kıyısı/Beyaz Şehir (Kuyruk 35); anahtar kapalı → eski Buzul girişi.
- `savaslariAtla` (kapalı; "Test" bölümü, Kuyruk 35): savaş ve boss düğümünde "Savaşı kazanılmış say"; XP/ödül normal yoldan, parti değişmez, kayıtta `skipped` ("atlandı").

## Sayfa sırası (ırka göre başlangıçta)
Durumda `startPage` varsa: sayfa çıkışları her zaman açık, giriş oku önceki sayfaya geri götürür (o sayfanın çıkışına varılır). Düğüm koşulları (boss dahil), Volkan portalı ve yeraltı nehri bağlantısı aynı. `startPage` yoksa (anahtar kapalı, eski kayıtlar) eski kural.
