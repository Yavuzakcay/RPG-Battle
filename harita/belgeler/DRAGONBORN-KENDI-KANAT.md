# Kendi çiziminde kanatlı Dragonborn jetonları (Kuyruk A İş 2)

Tarih: 2026-11-20. Yalnız görünüm; kural ve kayıt sürümü değişmedi.

## Yöntem

- **Siluet ölçümü** (290 jeton: `public/characters/dragonborn*.webp`, 266 alt sınıf + 24 sınıf-genel):
  - Alfa > 128 siluet alınır.
  - Omuz üstü bant: jeton yüksekliğinin %10–48'i.
  - Gövde merkezi: kalça altı medyanı.
  - Merkezden jeton genişliğinin %22'sinden uzak iki dış yan şeritte opak piksel sayılır.
  - Puan iki yanın küçüğüdür. Kanat iki yana simetrik açılır; silah, kalkan ve asa tek tarafta kaldığı için puanı düşük çıkar.
- **Kontak sayfası:** puana göre ilk 140 jeton gözle incelendi. Aşağıdakilerin hepsi ince silüetli; ilk 140'ta kanat görünen yalnız aşağıdaki 4 jeton var.

## Kesin (veride `data/kanat-esleme.json` `slotlar.dragonborn.kanatsiz`)

| Jeton | Puan | Not |
|---|---|---|
| `dragonborn-erkek-cleric-ID1` | 3197 | Cleric Yaşam Alanı (Life Domain), altın tüylü kanat |
| `dragonborn-kadin-cleric-ID1` | 1062 | Kadın Cleric Yaşam Alanı, açık altın tüylü kanat |
| `dragonborn-erkek-warlock-WL-7` | 2204 | beyaz tüylü kanat (Melek tipi) |
| `dragonborn-kadin-warlock-WL-7` | 2635 | beyaz tüylü kanat |

Bu jetonlarda ejderha kanadı hiç çizilmez: rozet (`LookFrame` + `AvatarBadge`), savaş jetonu (`TokenFigure`; Draconic Flight uçuşu dahil) ve karakter figürü. Tek yardımcı `ownWingToken` (`src/ui/lineageLook.ts`).

## Kuşkulu (listeye alınmadı; gözle onay bekliyor)

| Jeton | Neden |
|---|---|
| `dragonborn-erkek-ranger-ID4`, `dragonborn-kadin-ranger-ID4` | Omzunda kanatlı küçük ejderha yoldaşı var, karakterin kendi kanadı yok. Ejderha kanadı yoldaşın kanadıyla üst üste biniyor. İstenirse listeye bir satırla eklenir |
| `dragonborn-erkek-monk-ID2`, `dragonborn-kadin-monk-ID2` | Dört kol (puan yüksek), kanat değil |
| `dragonborn-kadin-barbarian-ID1` | Yanında yeşil ruh figürü, kanat değil |

Görüntüler: `docs/sabah/dragonborn-kanat/kendi-kanat-once-sonra.webp` (üst: önce, alt: sonra; her jetonda 96 px rozet + havada savaş jetonu; sağdaki `cleric-ID2` kanatsız jeton karşılaştırma için).
