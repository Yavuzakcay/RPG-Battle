# Görsel döküm (seçilebilir bütün karakter görünüşleri)

Üretim: `npm run gorsel-dokum` (2026-11-21, commit 77fe3e69, süre 3274 sn). Bu dosyadaki bütün sayılar o çalıştırmadan; elle yazılmaz, betik yeniden yazar.

Araç: `scripts/gorsel-dokum.ts` (Playwright + Vite, `check:harita` altyapısı) → `/onizleme-dokum.html` (`src/preview/gorselDokum.tsx`; yalnız geliştirme sunucusu, build girdisi değil). Çizim oyunun kendi bileşenleriyle: `CharacterFigure` (karakter listesi kartı / sihirbaz önizlemesi), `LookFrame` + `AvatarBadge` (savaş çekmecesi 56 px, sıra şeridi 30 px: küçük kopya), `AvatarBadge` 84 (karakter sayfası portresi), `AvatarCircle` → `TokenFigure` (savaş jetonu; `tokenFilters`/`filterStyle`, `tokenScale`, `TOKEN_R`, `hexPoints`). Jeton, boya, maske, kafa kaplaması, kanat ve taç `sheetAvatar` → `lineageLook`/`tintedUrl`/`crownSpec` çözücülerinden; kopya çizici yok. Savaş jetonunun `.token` sarmalayıcısı `MapBattle.tsx`'teki jeton grubunun aynısıdır (dışa aktarılmış bileşen yok); öfke alevleri ve döngü efekt sprite'ları çizilmez.

## Nasıl açılır

```powershell
npm run gorsel-dokum
```

Sonra `gorsel-dokum/index.html` dosyasını tarayıcıda aç (git dışı; `.gitignore`). Kartlara tıklayınca sayfanın tam boy PNG'si açılır (kaydır; "Sığdır" düğmesi), altta süzülebilir kusur listesi. Tek sayfayı elle incelemek: `npm run dev` → `/onizleme-dokum.html?sayfa=<kimlik>` (ör. `sinif-wizard-rozet-K`). Yalnız bazı gruplar: `npm run gorsel-dokum -- --grup wizard,ozel` (rapor yazılmaz); yalnız tarama: `-- --tarama`.

## Kombinasyon sayıları (ölçülmüş)

- Sayfa: **84**, hücre (sayfalardaki toplam çizim): **37991**, ayrı görünüş (taranan kimlik): **16551**; ayrı jeton dosyası: 2812; boyalı: 10621; karakter ekranında kanatlı: 6477.
- Sınıf tablosu (bölüm 1): **10720** kombinasyon = alt sınıf satırı (Gariban seviye 1, alt sınıflar seviye 5, ikinci formlar eşikte) × ırk/soy sütunu × cinsiyet; bunların 80'i "cinsiyet sonradan değişti" (Karadul/İmparator gibi kısıtlı alt sınıf seçildikten sonra cinsiyet değişirse seçim kalır).
- Sınıf başına: barbarian 800, bard 800, cleric 800, druid 720, fighter 1040, monk 960, paladin 880, ranger 800, rogue 880, sorcerer 800, warlock 960, wizard 1280.
- Sınıf tablosu satırları: **120** alt sınıf (`visibleSubclasses`, barbarian 9, bard 9, cleric 8, druid 8, fighter 11, monk 11, paladin 10, ranger 9, rogue 10, sorcerer 9, warlock 11, wizard 15) + 12 Gariban + 2 ikinci form (cleric/imza_birlik@17, fighter/pehlivan@10); sütunlar: **40** ırk/soy görünüşü × 2 cinsiyet (Human ten başına bir sütun; Human'ın 10 UI yolu özel bölümde).

| Bölüm | Sayfa | Hücre |
|---|---:|---:|
| sinif | 60 | 32160 |
| ozel | 18 | 5340 |
| durum | 1 | 132 |
| ek | 5 | 359 |

| Sayfa | Hücre |
|---|---:|
| Human: kültür + Sürgün → ten tonu (Gariban, seviye 1) (`ozel-human`) | 240 |
| Drow paleti A–D (veri ayarı `soy-renkleri.json` elf.drowPalet; oyuncu seçmez) (`ozel-drow`) | 192 |
| Celestial: Göksel Uyanış 3 biçim × seviye eşiği (`ozel-celestial`) | 144 |
| Goliath kafa kaplaması (soy-bas.json kayıtlı jetonlar) × soy (`ozel-goliath-bas`) | 36 |
| Soy maskeli ırklar: orijinal | maske | boyalı (`ozel-maske`) | 1056 |
| Görünüm çerçeveli soylar: çekmece rozeti (LookFrame) | karakter sayfası portresi (AvatarBadge 84, çerçevesiz) (`ozel-portre`) | 456 |
| barbarian · kanatlılar savaşta havada (flying: açık kanat) (`kanat-barbarian`) | 240 |
| bard · kanatlılar savaşta havada (flying: açık kanat) (`kanat-bard`) | 240 |
| cleric · kanatlılar savaşta havada (flying: açık kanat) (`kanat-cleric`) | 240 |
| druid · kanatlılar savaşta havada (flying: açık kanat) (`kanat-druid`) | 216 |
| fighter · kanatlılar savaşta havada (flying: açık kanat) (`kanat-fighter`) | 312 |
| monk · kanatlılar savaşta havada (flying: açık kanat) (`kanat-monk`) | 288 |
| paladin · kanatlılar savaşta havada (flying: açık kanat) (`kanat-paladin`) | 264 |
| ranger · kanatlılar savaşta havada (flying: açık kanat) (`kanat-ranger`) | 240 |
| rogue · kanatlılar savaşta havada (flying: açık kanat) (`kanat-rogue`) | 264 |
| sorcerer · kanatlılar savaşta havada (flying: açık kanat) (`kanat-sorcerer`) | 240 |
| warlock · kanatlılar savaşta havada (flying: açık kanat) (`kanat-warlock`) | 288 |
| wizard · kanatlılar savaşta havada (flying: açık kanat) (`kanat-wizard`) | 384 |
| Durum filtreleri (tokenFilters → filterStyle), jeton ×1,6 (`durum-filtre`) | 132 |
| Seviye eşikleri: Gariban (< 3) / alt sınıf (≥ 3) / kanat (Dragonborn ≥ 5) / uyanış (≥ 3) (`ek-seviye`) | 120 |
| Biçimler: Wild Shape / Polymorph (bütün Beast canavarları) + Karadul örümcek biçimi (`ek-bicim`) | 93 |
| Çağrılan yaratıklar (summons.json, familiar/ölü/binek biçimleri, paket ve eşya yaratıkları): çağrılmış filtresiyle (`ek-cagri`) | 58 |
| Masum jetonları (data/masumlar.json) (`ek-masum`) | 8 |
| Mahkûm kıyafeti: monk jetonu + turuncu hale (soy rengi ve görünüm karakterden) (`ek-mahkum`) | 80 |

Kombinasyon kuralları (veriden): ırk/soy `data/races.json` (tür kartı ilk soyu seçer; yalnız yeni karakterin Human'ı soysuz başlar: özel bölüm); Human görünüşünü yalnız ten tonu belirler (alt soyları `orijinal`): sınıf tablosunda ton başına bir sütun, bütün kültür/Sürgün yolları özel bölümde; Celestial 3 Göksel Uyanış; alt sınıflar `visibleSubclasses` (dış paket + imza + Karadul) ve `genderVisible`; Drow paleti veri ayarıdır (oyuncu seçmez), A–D yalnız karşılaştırma için. Görünüşü etkileyen diğer girdiler (bölüm 4): seviye eşikleri (Gariban < 3, Dragonborn kanadı ≥ 5, uyanış ≥ 3, ikinci jeton formu), Wild Shape/Polymorph biçimi (canavar jetonu; oyuncu tarafında ölçek ırktan), çağrılan yaratıklar (`spirit` filtresi, paket ton/halka), masum jetonları, Hapishane mahkûm kıyafeti. Donanım (silah/zırh/kalkan) görünüşü değiştirmez: `Avatar` alanlarında donanım yok (`src/battle/types.ts`).

## Kusurlar

Toplam **628** kusur kaydı, **60** ayrı neden (aynı dosya/maske/slot bir kez). Bilgi satırları kusur sayılmaz.

| Kod | Açıklama | Kayıt | Neden |
|---|---|---:|---:|
| `maske-eksik` | Maskeli soy boyasının maskesi yok (jeton boyasız) | 85 | 36 |
| `boya-etkisiz` | Soy boyası hiçbir pikseli değiştirmedi | 3 | 3 |
| `portre-cercevesiz` | Karakter sayfası portresi soy görünümünü (filtre/oran/kanat) çizmiyor | 436 | 19 |
| `cinsiyet-yedek` | Cinsiyet kısıtlı alt sınıf, cinsiyet sonradan değişince yedek jeton | 104 | 2 |
| `ayirt-edilemez-soy` | Farklı soy/uyanış seçimleri aynı görünüşü veriyor (bilgi) | 9 | 9 |

### İlk 15 kusur (önem sırasıyla, neden başına)

1. `maske-eksik`: maske yok (pul): /characters/maske-pul/dragonborn-female-monk.png (10 görünüşte)
2. `maske-eksik`: maske yok (pul): /characters/maske-pul/dragonborn-male-monk.png (10 görünüşte)
3. `maske-eksik`: maske yok (ten): /characters/maske/goliath-erkek-paladin-ID8.png (4 görünüşte)
4. `maske-eksik`: maske yok (ten): /characters/maske/goliath-kadin-fighter-ID5.png (4 görünüşte)
5. `maske-eksik`: maske yok (ten): /characters/maske/goliath-kadin-paladin-ID8.png (4 görünüşte)
6. `maske-eksik`: maske yok (ten): /characters/maske/goliath-kadin-warlock-WL-4.png (4 görünüşte)
7. `maske-eksik`: maske yok (ten): /characters/maske/goliath-kadin-warlock-WL-8.png (4 görünüşte)
8. `maske-eksik`: maske yok (ten): /characters/maske/tiefling-erkek-druid-ID4.png (4 görünüşte)
9. `maske-eksik`: maske yok (ten): /characters/maske/tiefling-erkek-sorcerer-SC-5.png (4 görünüşte)
10. `maske-eksik`: maske yok (ten): /characters/maske/tiefling-kadin-druid-ID4.png (4 görünüşte)
11. `maske-eksik`: maske yok (ten): /characters/maske/human-erkek-paladin-ID3.png (2 görünüşte)
12. `maske-eksik`: maske yok (ten): /characters/maske/human-erkek-sorcerer-SC-5.png (2 görünüşte)
13. `maske-eksik`: maske yok (ten): /characters/maske/human-erkek-sorcerer-SC-9.png (2 görünüşte)
14. `maske-eksik`: maske yok (ten): /characters/maske/human-erkek-warlock-WL-10.png (2 görünüşte)
15. `maske-eksik`: maske yok (ten): /characters/maske/human-kadin-monk-ID10.png (2 görünüşte)

### `maske-eksik`: Maskeli soy boyasının maskesi yok (jeton boyasız) (36 neden)

- maske yok (pul): /characters/maske-pul/dragonborn-female-monk.png (10 görünüş)
- maske yok (pul): /characters/maske-pul/dragonborn-male-monk.png (10 görünüş)
- maske yok (ten): /characters/maske/goliath-erkek-paladin-ID8.png (4 görünüş)
- maske yok (ten): /characters/maske/goliath-kadin-fighter-ID5.png (4 görünüş)
- maske yok (ten): /characters/maske/goliath-kadin-paladin-ID8.png (4 görünüş)
- maske yok (ten): /characters/maske/goliath-kadin-warlock-WL-4.png (4 görünüş)
- maske yok (ten): /characters/maske/goliath-kadin-warlock-WL-8.png (4 görünüş)
- maske yok (ten): /characters/maske/tiefling-erkek-druid-ID4.png (4 görünüş)
- maske yok (ten): /characters/maske/tiefling-erkek-sorcerer-SC-5.png (4 görünüş)
- maske yok (ten): /characters/maske/tiefling-kadin-druid-ID4.png (4 görünüş)
- maske yok (ten): /characters/maske/human-erkek-paladin-ID3.png (2 görünüş)
- maske yok (ten): /characters/maske/human-erkek-sorcerer-SC-5.png (2 görünüş)
- maske yok (ten): /characters/maske/human-erkek-sorcerer-SC-9.png (2 görünüş)
- maske yok (ten): /characters/maske/human-erkek-warlock-WL-10.png (2 görünüş)
- maske yok (ten): /characters/maske/human-kadin-monk-ID10.png (2 görünüş)
- maske yok (ten): /characters/maske/human-kadin-paladin-ID3.png (2 görünüş)
- maske yok (ten): /characters/maske/human-kadin-warlock-WL-10.png (2 görünüş)
- maske yok (ten): /characters/maske/elf-erkek-monk-ID10.png
- maske yok (ten): /characters/maske/elf-erkek-paladin-ID3.png
- maske yok (ten): /characters/maske/elf-erkek-sorcerer-SC-5.png
- maske yok (ten): /characters/maske/elf-erkek-sorcerer-SC-9.png
- maske yok (ten): /characters/maske/elf-erkek-warlock-WL-10.png
- maske yok (ten): /characters/maske/elf-kadin-monk-ID10.png
- maske yok (ten): /characters/maske/elf-kadin-paladin-ID3.png
- maske yok (ten): /characters/maske/elf-kadin-sorcerer-SC-5.png
- maske yok (ten): /characters/maske/elf-kadin-warlock-WL-10.png
- maske yok (ten): /characters/maske/gnome-erkek-cleric-ID6.png
- maske yok (ten): /characters/maske/gnome-erkek-paladin-ID3.png
- maske yok (ten): /characters/maske/gnome-erkek-paladin-ID8.png
- maske yok (ten): /characters/maske/gnome-erkek-sorcerer-SC-5.png
- maske yok (ten): /characters/maske/gnome-erkek-sorcerer-SC-9.png
- maske yok (ten): /characters/maske/gnome-erkek-warlock-WL-10.png
- maske yok (ten): /characters/maske/gnome-kadin-monk-ID10.png
- maske yok (ten): /characters/maske/gnome-kadin-paladin-ID3.png
- maske yok (ten): /characters/maske/gnome-kadin-sorcerer-SC-5.png
- maske yok (ten): /characters/maske/gnome-kadin-warlock-WL-10.png

### `boya-etkisiz`: Soy boyası hiçbir pikseli değiştirmedi (3 neden)

- boya hiçbir pikseli değiştirmedi: characters/elf-erkek-warlock-WL-10.webp
- boya hiçbir pikseli değiştirmedi: characters/elf-kadin-sorcerer-SC-5.webp
- boya hiçbir pikseli değiştirmedi: characters/elf-kadin-warlock-WL-10.webp

### `portre-cercevesiz`: Karakter sayfası portresi soy görünümünü (filtre/oran/kanat) çizmiyor (19 neden)

- celestial/gece-gozyasi: karakter sayfası portresinde yok: filtre (grayscale(1) contrast(1.12)) (SheetView AvatarBadge 84, LookFrame yok) (24 görünüş)
- celestial/kirik-kanat: karakter sayfası portresinde yok: kanat celestial-kirik-kanat (SheetView AvatarBadge 84, LookFrame yok) (24 görünüş)
- dwarf/crag: karakter sayfası portresinde yok: filtre (saturate(0.6) brightness(0.94) hue-rotate(14deg)) (SheetView AvatarBadge 84, LookFrame yok) (24 görünüş)
- dwarf/knoll: karakter sayfası portresinde yok: oran 1.04×1 (SheetView AvatarBadge 84, LookFrame yok) (24 görünüş)
- dwarf/undervault: karakter sayfası portresinde yok: filtre (brightness(0.78) saturate(0.75) hue-rotate(-12deg)) (SheetView AvatarBadge 84, LookFrame yok) (24 görünüş)
- halfling/sturdy: karakter sayfası portresinde yok: oran 1.07×0.93 (SheetView AvatarBadge 84, LookFrame yok) (24 görünüş)
- orc/fen: karakter sayfası portresinde yok: filtre (hue-rotate(-28deg) saturate(0.9) brightness(0.88)) (SheetView AvatarBadge 84, LookFrame yok) (24 görünüş)
- orc/glacier: karakter sayfası portresinde yok: filtre (hue-rotate(75deg) saturate(0.65) brightness(1.06)) (SheetView AvatarBadge 84, LookFrame yok) (24 görünüş)
- tiefling/winged: karakter sayfası portresinde yok: kanat tiefling-kanatli (SheetView AvatarBadge 84, LookFrame yok) (24 görünüş)
- dragonborn/black: karakter sayfası portresinde yok: kanat dragonborn (SheetView AvatarBadge 84, LookFrame yok) (22 görünüş)
- dragonborn/blue: karakter sayfası portresinde yok: kanat dragonborn (SheetView AvatarBadge 84, LookFrame yok) (22 görünüş)
- dragonborn/brass: karakter sayfası portresinde yok: kanat dragonborn (SheetView AvatarBadge 84, LookFrame yok) (22 görünüş)
- dragonborn/bronze: karakter sayfası portresinde yok: kanat dragonborn (SheetView AvatarBadge 84, LookFrame yok) (22 görünüş)
- dragonborn/copper: karakter sayfası portresinde yok: kanat dragonborn (SheetView AvatarBadge 84, LookFrame yok) (22 görünüş)
- dragonborn/gold: karakter sayfası portresinde yok: kanat dragonborn (SheetView AvatarBadge 84, LookFrame yok) (22 görünüş)
- dragonborn/green: karakter sayfası portresinde yok: kanat dragonborn (SheetView AvatarBadge 84, LookFrame yok) (22 görünüş)
- dragonborn/red: karakter sayfası portresinde yok: kanat dragonborn (SheetView AvatarBadge 84, LookFrame yok) (22 görünüş)
- dragonborn/silver: karakter sayfası portresinde yok: kanat dragonborn (SheetView AvatarBadge 84, LookFrame yok) (22 görünüş)
- dragonborn/white: karakter sayfası portresinde yok: kanat dragonborn (SheetView AvatarBadge 84, LookFrame yok) (22 görünüş)

### `cinsiyet-yedek`: Cinsiyet kısıtlı alt sınıf, cinsiyet sonradan değişince yedek jeton (2 neden)

- karadul-cemberi yalnız kadin; erkek karakterde GR (52 görünüş)
- imza_imparator yalnız erkek; kadin karakterde genel (52 görünüş)

### `ayirt-edilemez-soy`: Farklı soy/uyanış seçimleri aynı görünüşü veriyor (9 neden)

- celestial: gece-gozyasi ≡ kirik-kanat ≡ parlayan-ruh (24 hücre grubunda; Gariban) · tasarım gereği (orijinal soylar / uyanış seviye < 3)
- elf: drow ≡ high-elf ≡ wood-elf (3 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
- elf: drow ≡ wood-elf (6 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
- gnome: forest-gnome ≡ rock-gnome (258 hücre grubunda; Gariban, alt sınıf) · tasarım gereği (orijinal soylar / uyanış seviye < 3)
- gnome: forest-gnome ≡ rock-gnome ≡ subterranean (10 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
- goliath: cloud ≡ fire ≡ frost ≡ hill ≡ stone ≡ storm (5 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
- goliath: hill ≡ stone (263 hücre grubunda; Gariban, alt sınıf) · tasarım gereği (orijinal soylar / uyanış seviye < 3)
- human: ten-dogu-asyali ≡ ten-orijinal ≡ ten-siyahi (7 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
- tiefling: abyssal ≡ chthonic ≡ infernal (3 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
