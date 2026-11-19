# Dungeondex tasarımı (Türkçe sürüm)

Durum: 2026-11-19. Bu belge önce salt okunur envanter olarak yazıldı, sonra uygulama buna göre yapıldı. Kapsam
yalnız arayüz: kural sürümü ve kayıt sürümü değişmez; Dungeondex'ten savaşa eylem, karakter kâğıdına alan ve yeni
mekanik yok.

Ad kuralı (Görev SD4): adlar İngilizce (büyü, eşya, tür, sınıf, feat, Invocation, silah, sınıf özelliği); alt sınıf
ve Geçmiş adları Türkçe hâliyle; açıklamalar Türkçe. SRD'nin İngilizce ham metni hiçbir kartta gösterilmez. Kayıt
kimliği = mevcut SRD kimliği (yeni kimlik açılmaz).

## (a) Veri envanteri

Sayımlar bulut ortamında `loadClassData()` + `loadMonsters()` + `loadSimContent()` sonrası (`icerik/` yok →
alt sınıf fikstürü). Yerelde `icerik/` ile alt sınıf sayısı 120 olur.

| Kategori | Kayıt | Kimlik kaynağı | Türkçe açıklama kaynağı | TR kapsamı | Eksik |
|---|---|---|---|---|---|
| Büyü | 339 (0–9. seviye) | `data/spells*.json` `id` = `srd: spells:<id>` | `data/aciklamalar-tr.json` `buyu` (+ betimleme `data/buyu-betimleme.json` `tr`) | 339 | 0 |
| Sihirli eşya | 319 | `data/items*.json` `srd: magic-items:<id>` | `aciklamalar-tr.json` `esya` (174) yoksa `itemSummary` (Türkçe üretilen etki özeti) | 319 | 0 |
| Donanım (Adventuring Gear, alet) | 80 (79 gear + 1 tools) | `srd: gear:<id>` / `tools:<id>` | aynı (`esya` ya da `itemSummary`) | 80 | 0 |
| Silah | 38 | `data/weapons.json` `id` (`srd: weapons:<id>`) | özellik/ustalık metinleri `data/aciklamalar.json` `properties.tr`, `mastery.tr` (kartta üretilir) | 38 | 0 |
| Zırh | 12 (+ "Zırhsız" yer tutucu, gösterilmez) | `data/armor.json` `srd: armor:<id>` (kimlik = `srd` soneki) | kartta üretilir (AC, tür, STR, Gizlen) | 12 | 0 |
| Canavar | 330 | `data/monsters.json` `id` = `data/srd/monsters.json` | yok (SRD stat bloğu; `traits` notları karışık) → kartta Türkçe özet satırı üretilir | 0 (yalnız üretilen özet) | 330 düz açıklama |
| Tür (species) | 10 (9 SRD + Celestial) | `data/races.json` `id` (= `data/srd/species.json`) | tür özellikleri `aciklamalar-tr.json` `tur` (41 SRD özelliği), Celestial `data/celestial.json` `ozellikler[].metin.tr` | 10 | 0 |
| Alt soy | 41 = 38 tür soyu + 3 Celestial Göksel Uyanış | `races.json` `lineages[].id` (`<tür>/<soy>`), `celestial.json` `awakening.secenekler` | `lineages[].summary.tr` + `data/alt-soy-metin.json` buff/debuff `tr`; uyanış `metin.tr` + `debuff.tr` | 41 | 0 |
| Sınıf (Görev DX-S) | 12 sınıf + 28 Invocation + 10 Metamagic = 50 | `data/classes.json`, `data/srd/progression.json` (özellik satırı), `class-features.json` (Invocation, Metamagic) | özellik: `aciklamalar-tr.json` `yetenek` (2), yoksa `aciklamalar.json` `features.tr` (135); Invocation `aciklamalar-tr.json` `invocation` ya da `note`; Metamagic arayüz metni `builder.metamagicInfo` | 137/185 benzersiz özellik | 48 genel yer tutucu (alt sınıf seçimi, ASI, alt sınıf özelliği, Epic Boon) × 12 sınıf; kartta "Açıklama yok" |
| Alt sınıf | 120 (yerel; bulutta 24 = 12 fikstür + 12 bizim) | `SubclassDef.id` (`subclassesOf`) | `features[].description.tr` ya da `aciklamalar-tr.json` `altsinif` | 130/130 özellik (bulut) | 0 |
| Feat | 17 | `data/srd/feats.json` `id` | `aciklamalar.json` `feats.tr` {what, example} | 17 | 0 |
| Geçmiş | 12 (4 SRD + 8 özgün) | `data/backgrounds.json` `id` | `summary.tr` | 12 | 0 |
| Durum (conditions) | 15 (14 `data/conditions.json` + Exhaustion) | SRD durum adı küçük harf (`blinded`…, `exhaustion`) | yoktu → bu görevde `aciklamalar-tr.json` `durum` (15 kısa Türkçe kural özeti) | 15 | 0 |
| Invocation | 28 | `class-features.json` `invocations[].id` | `note` / `aciklamalar-tr.json` `invocation` | 28 | 0 (Görev DX-S: Sınıflar kategorisinde) |
| Yüzey/zemin | 7 yüzey + zemin etiketleri | `data/yuzeyler.json`, `data/zemin-etiketleri.json` | arayüz metinleri | — | kapsam dışı (kullanıcı kararı 2026-11-20) |

Notlar:
- Canavarların düz Türkçe açıklaması yok; kart SRD stat bloğunu sayı/etiket olarak (tür, boyut, Alignment, AC, HP,
  hız, yetenekler, CR, saldırı adları, durum bağışıklıkları) ve "Türkçe açıklama henüz yok" notuyla gösterir. Eksik
  sayısı 330 (ileride `aciklamalar-tr.json` `canavar`).
- Rol yapma (hikâye) özellikleri: alt sınıf özelliğinde `status: hikaye` ya da `mechanic.story` → kartta "Hikâye"
  etiketi; Celestial tür kartında `hikaye.tr`. Alignment satırı canavar kartında (SRD `alignment`, ad İngilizce).
- Alt sınıflar: yüklü olan her alt sınıf görünür; beklenen 120'den azsa liste başında "içerik eksik (N/120)" notu.

## (b) Ekran taslağı

Giriş: ana menüde "Dungeondex" kartı → tembel `src/screens/Dungeondex.tsx`.

```
┌ ← Geri   Dungeondex ─────────────────────────┐
│ [ Ara (TR / EN ad) …                     ]   │
│ Kategoriler:                                  │
│  Büyüler 339 · Eşyalar 449 · Canavarlar 330  │
│  Türler 10 · Alt soylar 41 · Sınıflar 50     │
│  Alt sınıflar 120                            │
│  Feat'ler 17 · Geçmişler 12 · Durumlar 15    │
│  Lisanslar ve atıf                           │
└───────────────────────────────────────────────┘
Liste (kategori seçili):
  [Ara]  [Seviye ▾] [Okul ▾] [Sınıf ▾]   (en çok 6 süzgeç görünür, kalanı "Diğer süzgeçler" katında)
  Fireball          3. seviye · Evocation
  Fire Bolt         Cantrip · Evocation
  … 40'lık sayfa, "Daha fazla göster (N kaldı)"
Kart:
  ← Geri    Fireball
  3. seviye Evocation · Sorcerer, Wizard
  Kısa özet satırı (Türkçe)
  Türkçe açıklama
  Bağlantılar: [Sorcerer] [Wizard] (yalnız verideki bağlar)
```

- Arama: ad (İngilizce ad + varsa Türkçe ad), büyük/küçük harf ve Türkçe aksan duyarsız.
- Süzgeçler: büyü seviye/okul/sınıf; canavar CR kademesi/tür; eşya türü (sihirli eşya, donanım, silah, zırh);
  alt sınıf sınıf; alt soy tür. Görünen süzgeç ≤ 6 (SD3 kalıbı).
- Bağlantılar (veride olan): büyü → sınıf (SRD sınıf listesi); canavar → büyüleri (`canavar-buyuleri.json`),
  durum bağışıklıkları → durum, ortamlar (etiket); alt sınıf → sınıf (etiket); alt soy ↔ tür; tür → alt soylar;
  geçmiş → köken feat'i; feat → kategori; büyünün uyguladığı durum (mekanik `condition`) → durum.
- Kaynak sayfa referansı gösterilmez.
- "Lisanslar ve atıf": `NOTICE` metni (değiştirilmeden) + Türkçe açıklama; "D&D" yalnız mekanik kaynağı anlatırken;
  uygulama adı `APP_NAME`.
- EN arayüz: başlıklar `strings.en.ts`; açıklama Türkçe metin + "Description available in Turkish only" notu.
  Açıklama erişimi dil anahtarlı (`dexDescription(lang, …)`): ileride `data/aciklamalar-en.json` aynı kimliklerle
  eklenince EN metni gelir; bu görevde EN dosyası yazılmaz.

## (c) Yerleşim

- Mobil (dar, < 760 px): tek sütun; kategori → liste → kart ayrı görünümler; üstte büyük "← Geri" (≥ 44 px
  dokunma alanı); satırlar ≥ 48 px; arama kutusu üstte yapışık.
- Masaüstü (≥ 760 px): iki sütun: solda kategori + arama + liste, sağda seçili kayıt kartı; geri düğmesi kategori
  listesine döner.
- Uzun listeler 40'lık sayfalarla ("Daha fazla göster"); sanal liste gerekmez (en uzun liste 449).
- Veri: ekran ve katalog tembel parça (`src/screens/Dungeondex.tsx`, `src/dungeondex/`); ana parçaya girmez. Veri
  `loadClassData()` + `loadMonsters()` ile (APK içinde gömülü, ağ yok).
