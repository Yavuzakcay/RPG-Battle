# BK1: Bataklık tanısı

Yalnız okuma ve ölçüm; kod, veri, test değişmedi, kural sürümü yok. Ölçüm gerçek motorda (`execute` `move`/`end_turn`, `turnStartMapEvents`, `wildsRoundEvents`), **kural sürümü 73** (güncel `data/kural-surumu.json`), Game Master anahtarı/parametresi değiştirilmeden (varsayılan açık). Geçici sonda testleri depoya girmedi. Tarih: 2026-11-12.

Karakterler: hafif ve orta zırhlı **aynı** sonuçtur; motor yalnız `heavyArmor` ayırır (`mediumArmor` bayrağı yalnız Kanat Süzülüşü kısıtında okunur, zemin kurallarında yok). Zar: "başarılı" = hepsi yüksek, "başarısız" = hepsi düşük (kaydırılmış rng). Hareket birimi: altıgen (hız 30 ft = 6).

## 1. Zemin harfleri ve kurallar

Harf anlamları (`src/map/terrain.ts`): `n` Sığ su/çamur (zorlu, siper 0), `w` Derin su (zorlu + kural `deepWater`), `g` Çalılık/sazlık (zorlu, siper 2), `t` Taşlık (zorlu), `b` Derin batak (kural `bog`), `a` ağaç (engel), `x` varil/sandık (zorlu), `p` tahta zemin/köprü, `k` yıkık sütun (zorlu), diğerleri engel/normal.

| Harita (231 hex; klasik 105) | `n` çamur/sığ su | `w` derin su | `g` | `t` | `b` | Not |
|---|---|---|---|---|---|---|
| batak-kamp (Cadının Kampı) | **15** | 15 (hepsi kıyıya 1) | 41 | 0 | 0 | `x` 2 |
| batak-kale (Batık Kale) | **0** | 22 (13 kıyıya 1, 9 kıyıya 2) | 77 | 4 | 0 | `s` 9, `r` 1 |
| batak-adalar (Kütük Adaları) | **12** | 132 (kıyıya 1/2/3/4: 56/39/29/8) | 18 | 0 | 0 | `p` 6 (köprü) |
| batak-cukur (Batık Çukur) | **0** | 35 (kıyıya 1/2/3: 19/13/3) | 0 | 41 | 0 | `k` 8; `t` = "loose stones" (prompt), çamur değil |
| bataklik (klasik, ek) | 5 | 0 | 10 | 0 | **48** | `p` 4 |

Her kural `surum: 8` (73'te açık), Game Master anahtarı varsayılan açık, hiçbir haritada `ruleToggles`/`optional` yok. Gündüz ve gece aynı kurallar; gecede ek `night` (ışık), sis şiddeti 1 → 2.

| Harita | Kurallar (varyant) |
|---|---|
| batak-kamp | `deepWater`(w), `mudNote`(n, yalnız not), `fog` (gündüz 1, gece 2), **`sinkMud`**(n, DC 10), **`witchCauldron`** (DC 12, kazan nesnesi 19,5), gece `night` |
| batak-kale | `deepWater`, `mudNote`, `fog`, **`sinkMud`(n: haritada yok)**, `boneRise` (3 kemik yığını; gündüz 2 tur, gece 1) |
| batak-adalar | `deepWater`, `mudNote`, `fog`, `sinkMud`(n), `bridgeBreak` (iki kütük köprü), **`leeches`**(n, CON DC 10, 1d4 piercing) |
| batak-cukur | `deepWater`, `mudNote`, `fog`, **`sinkMud`(n: haritada yok)**, **`pitGas`** (her 3 turda: tur 4, 7, …; 8 hex, CON DC 12) |
| bataklik (klasik) | `bog`(b), `mudNote`(n) |

`mudNote` yalnız notdur, motor kodu yok. Çok derin su (`deepWaterLimit`, genel, eşik 3): kıyıya ≥ 4 uzaklıktaki `w` yalnız yüzücü/uçan/suda yürüyene açık (doğrulandı: dist 3'e girilir, dist 4'e "yol yok"); yalnız Kütük Adaları'nda 8 hex bu yüzden kapalı.

## 2. Gerçek motor ölçümü

Kolon (a) = `n` hexe yürüyerek girer, (b) = orada turunu bitirir (`end_turn`), (c) = derin su `w`'ye girer + sonraki tur başı. "Hasar/durum yok" = olay üretilmedi. Hafif = orta.

### n (sığ su/çamur)

| Harita | Zırh | (a) giriş | (b) turu bitirir |
|---|---|---|---|
| Kamp (gündüz+gece) | hafif/orta | yalnız zorlu zemin: **2** hareket; hasar/durum/save yok | olay yok |
| Kamp | ağır | `sinkMud` Atletizm DC 10. Başarısız: **yürüyüş biter** (hareketin tamamı yanar, 6/6), hasar yok, durum yok, sayaç yok. Başarılı: yalnız maliyet 2 | olay yok |
| Adalar (gündüz+gece) | hafif/orta | zorlu 2; hasar/durum yok | **`leeches`** CON DC 10: başarısız 1d4 piercing (denemede 1), başarılı yok; durum yok |
| Adalar | ağır | `sinkMud` (Kamp ile aynı) | `leeches` (aynı) |
| Klasik | her ikisi | zorlu 2, hasar yok (`mudNote`) | olay yok |
| Kale, Çukur | — | haritada `n` yok: ölçülecek hex yok | — |

### w (derin su; yalnız kıyıya ≤ 3 olanlara girilir)

| Zırh | Giriş | Tur başı |
|---|---|---|
| hafif/orta | zorlu zemin (2); **bedel yok, yüzme hızı gerekmiyor** | olay yok |
| ağır | aynı | `deepWater` Atletizm DC 12; başarısız: batma sayacı +1 (3. başarısızlıkta boğulma, HP 0); başarılı yok |

`w`'ye giriş ve `w`'de tur sonu bu üç haritada hiçbir zırhta tur sonu bedeli üretmedi. `g` (sazlık) ve `t` (taşlık) yalnız zorlu zemindir, hiçbir olay yok.

### Diğer kurallar (kısa)

- Kazan (Kamp): her yeni turda kazan çevresinde 6 hex zehir yüzeyi (CON DC 12), kazan sağlam olduğu sürece; söndürülür ya da yıkılır.
- Çukur gazı: tur 1–3'te yok, tur 4'te 8 hexlik bulut (yalnız o tur), 7, 10, …; 8 hexin hepsi `w`, hepsine girilir (dist 1–3). Yani gaz yalnız suya girenleri vurur.
- Klasik `b` (karşılaştırma): giriş anında hafif/ağır fark etmeden Poisoned + saplanma ("batağa saplandı"), yürüyüş biter. Bu haritadaki tek gerçek bedel.

## 3. Beklenen (tasarım) ile gerçek

Tasarım listesi gerçekle örtüşür: sis dört haritada ✓, batıran çamur Kamp/Adalar ✓, sülük yalnız Adalar ✓, gaz yalnız Çukur ✓, kütük köprü Adalar ✓, kemik yığını Kale ✓, kazan Kamp ✓.

### HATA (kural olması gerektiği yerde çalışmıyor)

1. **Ölü kural: Kale ve Çukur'da `sinkMud` (n) tanımlı, haritada `n` yok** (Kale 0, Çukur 0; her iki varyant). Kural hiç tetiklenmez; Game Master panelinde "Batıran çamur" anahtarı bu haritalarda anlamsız görünür. Çamur ortak kural olacaksa bu haritalarda çamur hex'i yok; ya kural satırı fazla ya da çamur eksik.

Başka gerçek hata saptanmadı: kural tetiklenmesi gereken yerde (Kamp/Adalar n, Adalar leeches, Çukur gazı, Kamp kazanı) çalışıyor.

### TASARIM BOŞLUĞU (kural yok ya da yalnız ağır zırhlıya)

1. **Hafif ve orta zırhlı için çamur bedeli yok.** `sinkMud` yalnız `heavyArmor`; hafif/orta yalnız zorlu zemin 2 öder (Kamp 15 hex = %6). Oyuncu için `n` hex'inden kaçınmak için neden yok. Orta zırh ayrımı motorda zemin için hiç kullanılmıyor.
2. **Ağır zırhlı için bile "batma" cezası zayıf:** `sinkMud` başarısızlığı yalnız o turun kalan hareketini bitirir (HP, durum, sayaç yok); sonraki turda serbest. Atletizm modifiyesi düşükse bile bedel "bir tur kayıp hareket".
3. **Sülük yalnız Adalar'da ve yalnız tur sonu** (tasarım gereği); girip aynı turda çıkan hiçbir şey ödemez, Kamp'ta `n` tamamen bedelsiz.
4. **`w` derin su, hafif/orta zırhlı için bedelsiz yüzme.** Kale (22), Kamp (15), Çukur (35) hex'i yüzülür; zırhsız oyuncu "sığ bataklık gölü"nde yürür gibi 2 maliyetle geçer. Boğulma/yüzme kontrolü yalnız ağır zırhlıda.
5. **Çukur gazı yalnız suya giren kişiyi vurur:** 8 hexin hepsi `w`; kuru zeminde oyuncuyu hiçbir şey zorlamaz. Gaz süre: yalnız o tur.
6. **Tehlike katmanı (≡ menüsü) zemin harfi göstermez:** `src/ui/hazardLayer.ts` yalnız yüzey, aura, engel, alev yayılımı, hareket, fırsat saldırısı, tehdit; `n`/`w`/`sinkMud`/`leeches` hex'leri katmanda görünmez, oyuncu riski ancak görselden ya da denemekten öğrenir.
7. **Kale ve Çukur'da çamur teması yok** (HATA 1'in tasarım yüzü): iki haritada oyuncuyu bataklıktan alıkoyan tek tehlike su (ağır zırh) + boneRise/gaz.

## 4. Bugünkü cevap: "Oyuncu neden bataklığa girmekten kaçınmalı?"

| Harita | Cevap |
|---|---|
| Kamp | Yalnız **kazan çevresi** (6 hex her tur CON DC 12 zehir) ve ağır zırhla `n`/`w`. Hafif/orta için `n` zorlu zemin dışında bedelsiz. Sis: görüş 6 (gün) / 4 (gece), uzak menzilli dezavantaj |
| Kale | Pratikte yok: sis, ağır zırhlı için `w`, kemik yığınlarına yaklaşmak (2/1 tur sonra iskelet). Çamur yok |
| Adalar | **En iyi cevap:** sığ `n` hex'inde turu bitirmek = sülük (1d4, CON 10); ağır zırhla `w`/`n`; kütük köprüler yıkılabilir; 8 hex çok derin (yasak) |
| Çukur | Yalnız çukura girmek: 3 turda bir gaz (CON DC 12). Çevresindeki `t` 41 hex normal zorlu taşlık. Kuru taraf güvenli |
| Klasik | `b` derin batak (Poisoned, saplanma, boğulma) güçlü caydırıcı; `n` 5 hex bedelsiz |

## 5. Öneriler

### Mevcut mekanikle (yeni komut/olay/kural türü gerekmez)

1. **Tehlike katmanına zemin** (yalnız arayüz, kural sürümü yok): `hazardLayer` `hazardHexes`'a, açık kural `terrain` harfi olan hex'ler için (`sinkMud.terrain`, `leeches.terrain`, `pitGas.hexes`, `deepWater.terrain`) yeni görsel tür; mevcut `HazardKind` listesine eklenir, ≡ menüsünde "Zemin tehlikesi". Aynı veri `ruleOf` üstünden okunur; durum değişmez.
2. **Ölü `sinkMud`'ı temizle** (veri; haritanın kural listesi değiştiği için eski kayıt etkilenmesin diye `surum` kapılı bir sürümle ya da yalnız `kural-kontrol` panelinde gizleme): Kale ve Çukur'dan kural satırı kaldırılır, ya da çamur tasarlanıyorsa hex ekleyip kuralı korumak. Yeni kural türü yok.
3. **`sinkMud` başarısızlığına mevcut ilkellerle gerçek bedel** (kod + veri, kural sürümü 74; yeni olay/durum yok): `vineTrap`'in kullandığı `effect_added` (`grants: Restrained`, `escapeCheck`) kalıbı çamura da uygulanır; ağır zırhlıda başarısızlık Restrained + Atletizm kurtulma, hafif/orta için aynı kural daha düşük DC ya da yalnız `stopMovement` (`mediumArmor` bayrağı hazır). Böylece `n` hex'i her zırhta zorlu zeminden fazlasını ister.

### K57 donması kalkarsa (yeni komut/olay ya da yeni kural türü gerektirir)

`CLAUDE.md`'ye göre mekanik donması 2026-11-12'de kalktı (K57-KALDIR); yine de aşağıdakiler yeni kural türü/durum olduğu için ayrı sürüm şeridi ister (güncel 73, tek şerit):

- **Zemin tehlike tablosu** (`terrainHazard` kural türü): harf başına giriş/tur sonu bedeli veride (`n` hafif zırhlıya DEX/STR save, `w` yüzme Atletizm kontrolü her zırhta, Çukur çevresi), böylece her haritaya ayrı kural yazmak gerekmez.
- **"Çamurlu" süren etki** (yeni etki alanı): `n`'den çıkınca bir tur hız −5 ft ya da hasar azaltan koşul.
- **Sülüğün girişte tetiklenmesi** (yeni olay yolu) ve **sığ suda kalıcı sülük durumu**: tur sonu tek zar yerine yapışan sülük (kurtulma eylemi).
- **Çukur gazının kuru zemine taşması** (alan genişlemesi/rüzgâra göre kayma), kazan buharında benzer.

## Yöntem

Geçici vitest sondaları (depoya girmedi): her `n`/`w`/`t`/`g`/`b` hex'i için komşu açık zeminden `move` + `end_turn`, hafif (`heavyArmor: false`) ve ağır, rng yüksek/düşük; `turnStartMapEvents` (derin su tur başı), `wildsRoundEvents` (gaz, kazan), `shoreDistances` (çok derin su). Ham çıktı özeti bu belgede.
