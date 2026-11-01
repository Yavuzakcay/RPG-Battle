# Yerleşim sistemi (Kuyruk 34b)

Veri `data/yerlesim.json`, saf yardımcılar `src/yerlesim/yerlesim.ts`, durum Serüven katmanında (`src/journey/seruven.ts`), keşif oturumu `src/app/seruvenBattle.ts` (`yerlesimSession`, `yerlesimCrossCommand`), hub `src/screens/YerlesimHub.tsx`. Hepsi Serüven ekranının tembel parçasında (ana parçaya yalnızca metinler).

## Model
- **Şablon:** `kale`, `kasaba`, `sehir`. **Yerleşim:** kimlik, TR/EN ad, şablon, görünüm (`gorunumler`: şimdilik yalnızca CSS renk filtresi; `insan` varsayılan, `test-cuce` deneme), başlangıç haritası, hub ayarı, harita listesi.
- **Harita düğümü:** `mapId`/`variantId`, kapılar (`hexes` 1 tabanlı → `to`: aynı yerleşimin haritası; `null` = hub), varış altıgenleri (`girisler[gelinen harita | hub]`; yoksa haritanın parti başlangıcı).
- **Yerleşimler:** `kral-kalesi` (Kale Önü → kapı → Kale Avlusu `kale-ic-avlu` → donjon kapısı (`donjon-kapi` nesnesinin önü) → Taht Salonu; zindan atlandı), `beyaz-sehir` (Dış Kapı → Pazar Meydanı `sehir-meydani` → Saray Avlusu; lağım `dungeon`/`mesale` Pazar'ın batı kapısından), `kasaba-ornek` (test: meydan `sehir-meydani`, taverna, Kasaba Hanı).

## Akış
1. Serüven'de yerleşim düğümünde (Batı Kıyısı: Kral Kalesi, Beyaz Şehir; Liman "Yakında") "Yerleşime gir" → hub (`yerlesim_enter`).
2. Hub: **Haritalar** (kapı geçişi açıkken başlangıç ve kapıdan ulaşılmış haritalar), **Dükkân** (sabit fiyat; satış yarı fiyat), **Han** (uzun dinlenme; ücret veride, 0), **Görevler** (şablon, yer tutucu NPC; al → hedef düğüm tamamlanınca ödül), **Yerleşimden çık**.
3. Harita: düşmansız keşif oturumu (`explore`, çıkışlar = kapı altıgenleri). Bir parti üyesi kapı altıgenine varınca ("Gir") sonraki harita hemen açılır (`yerlesim_map via: kapi`); HP/kaynak/durum korunur. Kapıya varmadan ayrılınca hub'a dönülür. Savaş sırasında keşif kapalı (çıkış yok).

## Anahtarlar (Serüven kuralları paneli, kayıtta)
- `yerlesimler` (açık): kapalıyken yerleşim düğümleri "Yakında" (K33 davranışı).
- `yerlesimKapi` (açık): kapalıyken kapı geçişi yok; haritalar hub'dan, çıkış = başlangıç altıgenleri (hub'a dönüş).
- `irkBaslangic` (açık; yeni Serüven formunda): ilk karakterin türünün yurdu (`irkBaslangic` verisi): İnsan → Batı Kıyısı/Beyaz Şehir, Cüce → Dağ, Elf/Yarımcık/Ork → Orman, Gnom → Bataklık, Goliath → Buzul, Ejderha Doğumlu → Volkan Adası, Tiefling → Derinlikler; yurdu tanımsız tür (Celestial) ve anahtar kapalı → eski Buzul girişi.

## Sayfa sırası (ırka göre başlangıçta)
Durumda `startPage` varsa: sayfa çıkışları her zaman açık, giriş oku önceki sayfaya geri götürür (o sayfanın çıkışına varılır). Düğüm koşulları (boss dahil), Volkan portalı ve yeraltı nehri bağlantısı aynı. `startPage` yoksa (anahtar kapalı, eski kayıtlar) eski kural.
