# Görev: 11 yeni harita (veri ekleme + yeni kurallar)

Bu paket 11 haritanın görsellerini (WebP 1280×715), 15×7 zemin tablolarını (JSON) ve kural taslaklarını içerir. Çöl ve volkan gibi: harita eklemek **sadece veri eklemektir**; aşağıdaki yeni kurallar motorda küçük eklemeler ister.

## Dosyalar
- `maps/*.json` → `data/maps/` (çöl ve volkan JSON'ları ile aynı biçim; ek alan: `startZones.*.hexes` hazır liste, `notes`).
- `public-maps/*.webp` → `public/maps/`.
- `terrain-ek.json` → zemin kataloğuna eklenecek yeni harfler (mevcut: `. d r c k t H ~ f #`).
- `onizleme/ver_*.jpg` → her haritada harflerin görsele oturduğunu gösterir (doğrulama için; kod gerekmez).

## Haritalar
| id | ad | varyantlar | başlangıç (oyuncu / düşman) | aynalanabilir |
|---|---|---|---|---|
| `ada` | Ada | gunes, firtina | 8 / 11 | evet |
| `bataklik` | Bataklık | bataklik | 10 / 9 | evet |
| `dag` | Dağ | yaz (11 / 12), kis (12 / 11; eski `buzul`) | varyanta göre | evet |
| `dungeon` | Dungeon | mesale | 13 / 14 | evet |
| `gemi` | Güverte | gunes, firtina | 17 / 15 | hayır |
| `kale` | Kale | gunduz, gece | 15 / 18 | hayır |
| `magara` | Mağara | magara | 8 / 8 | hayır |
| `orman` | Orman | orman | 14 / 15 | evet |
| `sehir-meydani` | Şehir Meydanı | gun, gece | 9 / 10 | evet |
| `taverna` | Taverna | ic-mekan | 11 / 9 | hayır |

Not: Zemin tabloları görsele bakılarak elle atandı. Birkaç altıgen yanlış görünürse JSON'daki tek bir harf düzeltilir (görseli yeniden üretmek gerekmez).

## Yeni zemin harfleri
`terrain-ek.json` içinde. Özet: `s` duvar, `h` yükseltili (yükseklik 1), `z` zirve/kule (yükseklik 2), `u` uçurum/yarık, `i` buz, `q` kar, `a` ağaç, `g` çalılık/sazlık, `v` sarkıt-dikit, `e` kristal (ışık), `n` sığ su-çamur, `b` derin batak, `w` derin su, `p` güverte/kaldırım/köprü, `m` direk-sütun-çeşme, `x` varil-sandık-masa, `o` kapı/geçit, `j` gizli tuzak.
Karar gereken: motor yükseklik ölçeği -1/0/1. `z` (2) için ölçeği genişletin ya da `z`'yi 1'e eşitleyin ve DECISIONS.md'ye yazın.

## Yeni kural kimlikleri (Adım 8 kural motoruna eklenecek)
Parametreler (DC, hasar, tur) JSON'dadır, kodda sabit olmasın.
1. `climb`: bir seviye çıkmak 2 hareket (mevcut yükseklik kuralı + zorlu zemin gibi).
2. `deepWater` (w): zorlu zemin; ağır zırhlı her tur başı Atletizm DC 12, başarısızsa batma sayacı; sayaç 3'te boğulma.
3. `bog` (b): girince Zehirli + sayaç 1; her kendi turunun başında 1d6 zehir, sayaç +1; hareket maliyeti 3; çıkış Atletizm DC 12 (en yakın sağlam altıgene); sayaç 3'te HP 0 (boğulma). Müttefik komutu `pull` (bitişik, Atletizm DC 12). Çıktıktan sonra kalıcı zehir: tur başı 1d4, tur sonu CON DC 12 ile biter.
4. `storm`: 4 altıgenden uzağa menzilli saldırı dezavantaj; ateş büyüleri dezavantaj. `swell` (isteğe bağlı, GM tetikler): her 3 turda DEX DC 12, başarısızsa yere düşer.
5. `ice` (i): altıgene giren DEX DC 10, başarısızsa Prone ve hareket biter. `cold`: tur sonunda barınakta değilse CON DC 12, 1d4 soğuk.
6. `darkness` (mağara, dungeon, gece şehir): ışıksız altıgende görüş 3 altıgen, karanlık görüşü 12; ışık kaynakları (`lights`, `e` kristal) 4 yarıçap aydınlatır; görülmeyen hedef seçilemez, görünmeyen saldırgan avantajlı.
7. `trap` (j): gizli, Algı DC 13 ile fark edilir; basan DEX DC 13, başarısız 2d6 delici; bir kez.
8. `stealth` (orman): `g` hexinde ve `a` bitişiğinde gizlenme; `g` +2; `a` görüş hattını keser.
9. `gate` (kale kapısı 9,4): aç/kapa/kır (AC 15, HP 30). `crenel`: sur/kuleden (`h`,`z`) saldırana alttan menzilli saldırıda 3/4 siper.
10. `objective` (taverna, şehir; isteğe bağlı): GM 4-6 sivil ekler (HP 4, AC 10, hız 6 altıgen); arayüzde "Masumlar: x/n hayatta". **Değişti:** masum ölümü bilgi amaçlıdır, sonucu etkilemez (GM hikâyede işler); "en az yarısı hayatta kalmalı" (`minSurvivorsRatio`) yalnızca GM'in kurulumda açtığı sıkı kuralda kaybettirir. Masumlar varsayılan olarak düşmanlardan en uzak, yürünebilir altıgenlere yerleşir; "ortada" seçenek.

## Başlangıç bölgeleri
`startZones.*.hexes` hazırdır. Birkaç harita dar olduğu için colRange geniştir (ada 2-7 / 9-14, mağara 1-4 / 12-15, bataklık 1-4 / 12-15, dungeon 1-4 / 12-15). Yükleyici testi: her bölge boş olmamalı, hex'ler tabloda geçilebilir olmalı.

## Yükleyici testi
7×15, yalnızca katalog harfleri, `image` dosyası var, başlangıç hex'leri geçilebilir ve çakışmıyor.
Sonra demo senaryoları: kale (kapı kapat/aç), bataklık (batma sayacı, `pull`), mağara (görüş), gemi (denize itme), Dağ kış (kayma).
