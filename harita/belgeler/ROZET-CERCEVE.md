# Rozet çerçevesi kırpması (ROZET-CERCEVE-KIRPMA)

Görev: `JETON-DENETIM.md` bölüm 2b — rozet çerçevesi (`LookFrame` + `AvatarBadge`) 69 jetonda başın/şapkanın üstünü ≥ 10 px kesiyordu.
Yalnız görünüm: kural sürümü, kayıt sürümü, jeton/maske dosyaları değişmedi.

## Bulgu (önce)

Oyunun kendi bileşenleriyle gerçek tarayıcıda ölçüldü (`npx vite-node scripts/rozet-cerceve.ts`): 69 jetonun bütün görünüşleri (soy, ton,
uyanış, kanat; 293 görünüş) dört yerde, kırpmalı ve kırpmasız çizilip fark sayıldı (alfa > 60).

- Rozet dairesi (`.avatar`: `overflow: hidden` + `border-radius: 50%`, görsel içerik kutusunu doldurur) yalnız tepeyi değil, daha çok
  **alt köşeleri** kesiyordu: 84 px'te kesilen 5193 pikselin ≈ %83'ü alt yarıda (geniş duruş, etek, yere değen asa/balta sapı), ≈ %17'si
  üstte (şapka, kapüşon ucu, silah ucu). 256 px tuvalde figür boyu ≈ %90 olduğundan tepe ve ayak dairenin yay kısmına giriyor.
- Savaş jetonu (`TokenFigure`, harita SVG'si) ve oluşturucu figürü (`CharacterFigure`, taç/kanat kutusu dahil) hiç kesmiyor (0 px);
  değişmedi.
- Bütün 2876 jeton düz daireye sığdırılsaydı 1375'i küçülmek zorundaydı (84 px; %5 dilim ölçek 0,88, en az 0,74): boy tutarlılığı bozulurdu.

## Düzeltme

`src/ui/badgeFit.ts` (saf), `src/ui/badgeHull.ts` (tarayıcıda ölçüm), `AvatarBadge` + `styles.css`:

1. **Görünür alan kemer**: üst yarı içerik dairesi, alt yarı aynı genişlikte dik kenarlı (figür çerçevenin alt kenarında durur; ayak, etek
   ve aşağı bakan silah ucu kesilmez). Kemer rozet kutusunun içinde: figür kutunun dışına taşmaz (kanat ve Celestial tacı hariç; onlar
   eskiden de taşıyordu). Görselli rozette `.avatar.fit` dairesel taşma kırpmasını kaldırır, kırpma görselin kendi `clip-path`'i
   (`--fit-clip`, oran/ayna/sığdırma dönüşümünün tersiyle görselin koordinatına taşınmış kemer çokgeni). Kanatlı rozetteki
   `clip-path: circle(50%)` da aynı değişkene geçti.
2. **Alfa zarfı**: görsel yüklenince bir kez opak piksellerin (alfa > 60) dışbükey zarfı (`alphaHull`; boya alfayı değiştirmediği için
   boyasız yol anahtar). Canvas yoksa (test ortamı) zarf boş: yalnız kemer.
3. **En küçük gerekli değişiklik** (`badgeFit`): alt soy oranı (Halfling Kalın 1,07 × 0,93, Dwarf Tepe 1,04 × 1) ve yön aynası ayak
   çizgisinden uygulandıktan sonra zarf kemere sığıyorsa dokunulmaz; ölçek 1'de sığdıran en kısa kaydırma varsa yalnız kaydırılır; yoksa
   sığdıran en büyük ölçek (ayak çizgisinden) ve onda en kısa kaydırma. Sonuç `--fit` (`translate(x%, y%) scale(k)`); görsel, Celestial
   yıldız tacı ve rozet kanadı aynı dönüşümü izler (taç figürle birlikte iner, kanat kökü gövdede kalır).

Bütün jetonlarda (`npx vite-node scripts/rozet-sigdirma.ts`), 84 px, 1 × 1: **2007 dokunulmayan, 518 yalnız kaydırılan, 351 küçültülen**;
ölçek %5 dilimde 0,965, en az 0,836 (44 px: %5 0,945, en az 0,818; oranlı soylarda 84 px en az 0,823). Kemer, düz daireye göre gereken
küçültmeyi 1375 → 351 jetona indirdi.

## Ölçüm (önce → sonra)

Toplam (293 görünüş): rozet 44 px kesilen 1091 → 39 piksel (174 → 20 görünüş), rozet 84 px 5193 → 23 (210 → 14 görünüş), savaş jetonu
0 → 0, oluşturucu figürü 0 → 0. Jeton başına en çok kesilen ≥ 10 px olan jeton: rozet 84'te 31 → 0, rozet 44'te 12 → 0 (sonra en çok 6 ve
4 px). Kalan 1–6 px kenarda değil, figürün içinde (1 px'lik asa sapı gibi ince çizgilerde kırpma yolu açıkken pikselli örneklemenin alfa
eşiği gürültüsü; kontak sayfalarında kırmızı). Kanatsız/taçsız görünüşlerde rozet kutusunun dışına taşan opak piksel 0. Figür boyu 84 px
rozette 293 görünüşte önceki boyun ≥ %95,8'i (44 px'te ≥ %91,4; medyan ikisinde de %100).

Kontak sayfaları (git dışı): `gorsel-dokum/rozet-cerceve/kontak-ozet-1…2.png` (jeton başına en çok kesilen görünüş), `kontak-1…8.png`
(bütün görünüşler); her satırda rozet 44, rozet 84, savaş jetonu, oluşturucu figürü önce | sonra; kesilen pikseller kırmızı.
Yeniden üretme: `npx vite-node scripts/rozet-cerceve.ts -- --etiket once` (düzeltmeden önceki ağaçta), `-- --etiket sonra`,
`-- --karsilastir once,sonra`.

Test: `src/ui/badgeFit.test.ts` — listedeki 69 jetonun zarfı (`src/ui/fixtures/rozet-kirpma.json`, yalnız sayılar) her boyda (16–110 px),
her alt soy oranında ve aynada kemerin dışına 0,25 px'ten fazla taşmıyor, ölçek ≥ 0,8; kırpma çokgeni dönüşümle kemere oturuyor.

Jeton başına en çok kesilen piksel (bütün görünüşlerin en kötüsü), önce → sonra:

| Jeton | rozet 44 | rozet 84 | savaş jetonu 96 | oluşturucu figürü 200 |
|---|---:|---:|---:|---:|
| `dwarf-male-wizard` | 23 → 0 | 107 → 0 | 0 → 0 | 0 → 0 |
| `halfling-male-warlock` | 20 → 1 | 92 → 0 | 0 → 0 | 0 → 0 |
| `dwarf-male-warlock` | 23 → 0 | 87 → 1 | 0 → 0 | 0 → 0 |
| `orc-male-wizard` | 16 → 0 | 85 → 0 | 0 → 0 | 0 → 0 |
| `orc-erkek-rogue-ID10` | 18 → 0 | 84 → 0 | 0 → 0 | 0 → 0 |
| `goliath-male-warlock` | 15 → 0 | 76 → 0 | 0 → 0 | 0 → 0 |
| `dwarf-female-wizard` | 21 → 0 | 74 → 0 | 0 → 0 | 0 → 0 |
| `orc-male-warlock` | 16 → 0 | 74 → 0 | 0 → 0 | 0 → 0 |
| `goliath-female-warlock` | 18 → 1 | 69 → 1 | 0 → 0 | 0 → 0 |
| `dragonborn-erkek-rogue-ID10` | 9 → 0 | 50 → 0 | 0 → 0 | 0 → 0 |
| `tiefling-erkek-rogue-ID10` | 10 → 0 | 46 → 0 | 0 → 0 | 0 → 0 |
| `gnome-male-warlock` | 7 → 1 | 37 → 0 | 0 → 0 | 0 → 0 |
| `halfling-erkek-rogue-ID10` | 8 → 0 | 32 → 0 | 0 → 0 | 0 → 0 |
| `tiefling-kadin-druid-ID4` | 14 → 0 | 32 → 0 | 0 → 0 | 0 → 0 |
| `tiefling-erkek-rogue-ID9` | 2 → 0 | 30 → 0 | 0 → 0 | 0 → 0 |
| `dwarf-erkek-rogue-ID10` | 8 → 0 | 29 → 1 | 0 → 0 | 0 → 0 |
| `goliath-erkek-rogue-ID10` | 6 → 0 | 27 → 1 | 0 → 0 | 0 → 0 |
| `goliath-female-wizard` | 6 → 1 | 27 → 0 | 0 → 0 | 0 → 0 |
| `halfling-erkek-druid-ID6` | 5 → 0 | 27 → 0 | 0 → 0 | 0 → 0 |
| `human-erkek-rogue-ID10` | 10 → 0 | 27 → 0 | 0 → 0 | 0 → 0 |
| `dragonborn-kadin-rogue-ID10` | 5 → 0 | 24 → 0 | 0 → 0 | 0 → 0 |
| `goliath-erkek-druid-ID6` | 5 → 0 | 24 → 0 | 0 → 0 | 0 → 0 |
| `elf-erkek-rogue-ID10` | 7 → 0 | 22 → 0 | 0 → 0 | 0 → 0 |
| `halfling-male-wizard` | 5 → 0 | 21 → 0 | 0 → 0 | 0 → 0 |
| `celestial-kadin-sorcerer-SC-9` | 4 → 3 | 20 → 0 | 0 → 0 | 0 → 0 |
| `orc-female-wizard` | 3 → 0 | 18 → 0 | 0 → 0 | 0 → 0 |
| `gnome-female-warlock` | 4 → 0 | 14 → 0 | 0 → 0 | 0 → 0 |
| `human-erkek-druid-ID6` | 4 → 0 | 14 → 0 | 0 → 0 | 0 → 0 |
| `human-male-warlock` | 4 → 0 | 12 → 0 | 0 → 0 | 0 → 0 |
| `tiefling-male-wizard` | 5 → 0 | 12 → 0 | 0 → 0 | 0 → 0 |
| `gnome-female-wizard` | 2 → 0 | 10 → 0 | 0 → 0 | 0 → 0 |
| `human-male-wizard` | 2 → 2 | 9 → 0 | 0 → 0 | 0 → 0 |
| `dragonborn-erkek-rogue-ID9` | 5 → 3 | 8 → 5 | 0 → 0 | 0 → 0 |
| `dwarf-kadin-rogue-ID9` | 1 → 0 | 8 → 0 | 0 → 0 | 0 → 0 |
| `goliath-erkek-rogue-ID9` | 0 → 3 | 8 → 0 | 0 → 0 | 0 → 0 |
| `human-erkek-rogue-ID9` | 0 → 0 | 8 → 6 | 0 → 0 | 0 → 0 |
| `tiefling-erkek-druid-ID6` | 5 → 0 | 7 → 0 | 0 → 0 | 0 → 0 |
| `dragonborn-kadin-druid-ID6` | 4 → 0 | 4 → 0 | 0 → 0 | 0 → 0 |
| `dragonborn-kadin-rogue-ID9` | 0 → 4 | 4 → 0 | 0 → 0 | 0 → 0 |
| `elf-female-wizard` | 3 → 0 | 4 → 0 | 0 → 0 | 0 → 0 |
| `orc-erkek-rogue-ID9` | 1 → 0 | 3 → 0 | 0 → 0 | 0 → 0 |
| `orc-kadin-warlock-WL-11` | 1 → 0 | 3 → 0 | 0 → 0 | 0 → 0 |
| `tiefling-erkek-warlock-WL-11` | 0 → 0 | 3 → 0 | 0 → 0 | 0 → 0 |
| `tiefling-female-wizard` | 0 → 1 | 3 → 0 | 0 → 0 | 0 → 0 |
| `dragonborn-erkek-warlock-WL-11` | 0 → 0 | 2 → 1 | 0 → 0 | 0 → 0 |
| `elf-male-wizard` | 1 → 0 | 2 → 0 | 0 → 0 | 0 → 0 |
| `halfling-erkek-warlock-WL-11` | 1 → 1 | 2 → 0 | 0 → 0 | 0 → 0 |
| `dragonborn-erkek-druid-ID5` | 1 → 0 | 1 → 0 | 0 → 0 | 0 → 0 |
| `human-kadin-druid-ID4` | 1 → 0 | 1 → 0 | 0 → 0 | 0 → 0 |
| `human-kadin-druid-ID5` | 1 → 0 | 1 → 1 | 0 → 0 | 0 → 0 |
| `tiefling-erkek-druid-ID5` | 0 → 0 | 1 → 0 | 0 → 0 | 0 → 0 |
| `tiefling-male-warlock` | 0 → 0 | 1 → 0 | 0 → 0 | 0 → 0 |
| `celestial-kadin-druid-ID5` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `celestial-male-wizard` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `dragonborn-kadin-druid-ID5` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `dragonborn-kadin-warlock-WL-11` | 1 → 2 | 0 → 0 | 0 → 0 | 0 → 0 |
| `dwarf-kadin-warlock-WL-11` | 1 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `elf-erkek-warlock-WL-11` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `elf-kadin-druid-ID5` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `gnome-erkek-druid-ID5` | 3 → 3 | 0 → 0 | 0 → 0 | 0 → 0 |
| `gnome-erkek-warlock-WL-11` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `goliath-kadin-druid-ID5` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `halfling-erkek-druid-ID5` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `halfling-kadin-druid-ID4` | 5 → 3 | 0 → 0 | 0 → 0 | 0 → 0 |
| `halfling-kadin-druid-ID5` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `human-erkek-druid-ID5` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `human-erkek-warlock-WL-11` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `orc-kadin-druid-ID5` | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| `tiefling-kadin-druid-ID5` | 1 → 1 | 0 → 0 | 0 → 0 | 0 → 0 |
