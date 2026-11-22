# Görsel döküm (seçilebilir bütün karakter görünüşleri)

Üretim: `npm run gorsel-dokum` (2026-11-22, commit a8195c8f, süre (yeniden üretim)). Bu dosyadaki bütün sayılar o çalıştırmadan; elle yazılmaz, betik yeniden yazar.

Araç: `scripts/gorsel-dokum.ts` (Playwright + Vite, `check:harita` altyapısı) → `/onizleme-dokum.html` (`src/preview/gorselDokum.tsx`; yalnız geliştirme sunucusu, build girdisi değil). Çizim oyunun kendi bileşenleriyle: `CharacterFigure` (karakter listesi kartı / sihirbaz önizlemesi), `LookFrame` + `AvatarBadge` (savaş çekmecesi 56 px, sıra şeridi 30 px: küçük kopya), `AvatarBadge` 84 (karakter sayfası portresi), `AvatarCircle` → `TokenFigure` (savaş jetonu; `tokenFilters`/`filterStyle`, `tokenScale`, `TOKEN_R`, `hexPoints`). Jeton, boya, maske, kafa kaplaması, kanat ve taç `sheetAvatar` → `lineageLook`/`tintedUrl`/`crownSpec` çözücülerinden; kopya çizici yok. Savaş jetonunun `.token` sarmalayıcısı `MapBattle.tsx`'teki jeton grubunun aynısıdır (dışa aktarılmış bileşen yok); öfke alevleri ve döngü efekt sprite'ları çizilmez.

## Nasıl açılır

```powershell
npm run gorsel-dokum
```

Sonra `gorsel-dokum/index.html` dosyasını tarayıcıda aç (git dışı; `.gitignore`). Kartlara tıklayınca sayfanın tam boy PNG'si açılır (kaydır; "Sığdır" düğmesi), altta süzülebilir kusur listesi. Tek sayfayı elle incelemek: `npm run dev` → `/onizleme-dokum.html?sayfa=<kimlik>` (ör. `sinif-wizard-rozet-K`). Yalnız bazı gruplar: `npm run gorsel-dokum -- --grup wizard,ozel` (rapor yazılmaz); yalnız tarama: `-- --tarama`.

## Kombinasyon sayıları (ölçülmüş)

- Sayfa: **84**, hücre (sayfalardaki toplam çizim): **37463**, ayrı görünüş (taranan kimlik): **16343**; ayrı jeton dosyası: 2775; boyalı: 10503; karakter ekranında kanatlı: 6462.
- Sınıf tablosu (bölüm 1): **10560** kombinasyon = alt sınıf satırı (Gariban seviye 1, alt sınıflar seviye 5, ikinci formlar eşikte) × ırk/soy sütunu × cinsiyet; bunların 0'i "cinsiyet sonradan değişti" (Karadul/İmparator gibi kısıtlı alt sınıf seçildikten sonra cinsiyet değişirse seçim kalır).
- Sınıf başına: barbarian 800, bard 800, cleric 720, druid 680, fighter 1000, monk 960, paladin 880, ranger 800, rogue 880, sorcerer 800, warlock 960, wizard 1280.
- Sınıf tablosu satırları: **119** alt sınıf (`visibleSubclasses`, barbarian 9, bard 9, cleric 7, druid 8, fighter 11, monk 11, paladin 10, ranger 9, rogue 10, sorcerer 9, warlock 11, wizard 15) + 12 Gariban + 2 ikinci form (cleric/imza_birlik@17, fighter/pehlivan@10); sütunlar: **40** ırk/soy görünüşü × 2 cinsiyet (Human ten başına bir sütun; Human'ın 10 UI yolu özel bölümde).

| Bölüm | Sayfa | Hücre |
|---|---:|---:|
| sinif | 60 | 31680 |
| ozel | 18 | 5292 |
| durum | 1 | 132 |
| ek | 5 | 359 |

| Sayfa | Hücre |
|---|---:|
| Human: kültür + Sürgün → ten tonu (Gariban, seviye 1) (`ozel-human`) | 240 |
| Drow paleti A–D (veri ayarı `soy-renkleri.json` elf.drowPalet; oyuncu seçmez) (`ozel-drow`) | 192 |
| Celestial: Göksel Uyanış 3 biçim × seviye eşiği (`ozel-celestial`) | 144 |
| Goliath kafa kaplaması (soy-bas.json kayıtlı jetonlar) × soy (`ozel-goliath-bas`) | 36 |
| Soy maskeli ırklar: orijinal | maske | boyalı (`ozel-maske`) | 1056 |
| Görünüm çerçeveli soylar: çekmece rozeti (LookFrame) | karakter sayfası portresi (SheetPortrait 84) (`ozel-portre`) | 456 |
| barbarian · kanatlılar savaşta havada (flying: açık kanat) (`kanat-barbarian`) | 240 |
| bard · kanatlılar savaşta havada (flying: açık kanat) (`kanat-bard`) | 240 |
| cleric · kanatlılar savaşta havada (flying: açık kanat) (`kanat-cleric`) | 216 |
| druid · kanatlılar savaşta havada (flying: açık kanat) (`kanat-druid`) | 204 |
| fighter · kanatlılar savaşta havada (flying: açık kanat) (`kanat-fighter`) | 300 |
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

Toplam **0** kusur kaydı, **0** ayrı neden (aynı dosya/maske/slot bir kez). Bilgi satırları kusur sayılmaz.

| Kod | Açıklama | Kayıt | Neden |
|---|---|---:|---:|
| `ayirt-edilemez-soy` | Farklı soy/uyanış seçimleri aynı görünüşü veriyor (bilgi) | 9 | 9 |
| `yedek-filtre` | Maske yok: soy rengi yedek CSS filtresiyle (data/soy-filtre-yedek.json) (bilgi) | 74 | 32 |
| `tensiz-jeton` | Maske bilerek boş: jetonda çıplak ten yok (ten tonu görünmez) (bilgi) | 10 | 5 |

### Yedek filtreyle çizilenler (maske yok)

- **74** görünüş (32 jeton/neden) soy boyası yerine yedek CSS filtresiyle çiziliyor (`data/soy-filtre-yedek.json`; karar `src/ui/tint.ts` `fallbackFilterFor`). Maske eklenince yedek kendiliğinden kalkar.
- Seçim bekleyen soy: **20**/20 (geçici olarak 1. aday): dragonborn/black, dragonborn/blue, dragonborn/brass, dragonborn/bronze, dragonborn/copper, dragonborn/gold, dragonborn/green, dragonborn/red, dragonborn/silver, dragonborn/white, tiefling/abyssal, tiefling/chthonic, tiefling/winged, elf/drow, elf/high-elf, gnome/subterranean, goliath/cloud, goliath/fire, goliath/frost, goliath/storm. Seçim: `npm run dev` → `/onizleme-filtre.html` → Kaydet.
- Bilerek boş maske (çıplak ten yok): 10 görünüş (5 jeton).

### İlk 15 kusur (önem sırasıyla, neden başına)

Kusur bulunmadı.

### `ayirt-edilemez-soy`: Farklı soy/uyanış seçimleri aynı görünüşü veriyor (9 neden)

- celestial: gece-gozyasi ≡ kirik-kanat ≡ parlayan-ruh (24 hücre grubunda; Gariban) · tasarım gereği (orijinal soylar / uyanış seviye < 3)
- elf: drow ≡ high-elf ≡ wood-elf (3 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
- elf: drow ≡ wood-elf (6 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
- gnome: forest-gnome ≡ rock-gnome (254 hücre grubunda; Gariban, alt sınıf) · tasarım gereği (orijinal soylar / uyanış seviye < 3)
- gnome: forest-gnome ≡ rock-gnome ≡ subterranean (10 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
- goliath: cloud ≡ fire ≡ frost ≡ hill ≡ stone ≡ storm (5 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
- goliath: hill ≡ stone (259 hücre grubunda; Gariban, alt sınıf) · tasarım gereği (orijinal soylar / uyanış seviye < 3)
- human: ten-dogu-asyali ≡ ten-orijinal ≡ ten-siyahi (5 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)
- tiefling: abyssal ≡ chthonic ≡ infernal (3 hücre grubunda; alt sınıf) · BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)

### `yedek-filtre`: Maske yok: soy rengi yedek CSS filtresiyle (data/soy-filtre-yedek.json) (32 neden)

- maske yok (pul): /characters/maske-pul/dragonborn-female-monk.png → yedek filtre (dragonborn/gold) (10 görünüş)
- maske yok (pul): /characters/maske-pul/dragonborn-male-monk.png → yedek filtre (dragonborn/copper) (10 görünüş)
- maske yok (ten): /characters/maske/goliath-erkek-paladin-ID8.png → yedek filtre (goliath/cloud) (4 görünüş)
- maske yok (ten): /characters/maske/goliath-kadin-fighter-ID5.png → yedek filtre (goliath/fire) (4 görünüş)
- maske yok (ten): /characters/maske/goliath-kadin-paladin-ID8.png → yedek filtre (goliath/fire) (4 görünüş)
- maske yok (ten): /characters/maske/goliath-kadin-warlock-WL-4.png → yedek filtre (goliath/storm) (4 görünüş)
- maske yok (ten): /characters/maske/goliath-kadin-warlock-WL-8.png → yedek filtre (goliath/frost) (4 görünüş)
- maske yok (ten): /characters/maske/tiefling-erkek-druid-ID4.png → yedek filtre (tiefling/chthonic) (4 görünüş)
- maske yok (ten): /characters/maske/tiefling-erkek-sorcerer-SC-5.png → yedek filtre (tiefling/abyssal) (4 görünüş)
- maske yok (ten): /characters/maske/tiefling-kadin-druid-ID4.png → yedek filtre (tiefling/winged) (4 görünüş)
- maske yok (ten): /characters/maske/elf-erkek-monk-ID10.png → yedek filtre (elf/drow)
- maske yok (ten): /characters/maske/elf-erkek-paladin-ID3.png → yedek filtre (elf/drow)
- maske yok (ten): /characters/maske/elf-erkek-sorcerer-SC-5.png → yedek filtre (elf/drow)
- maske yok (ten): /characters/maske/elf-erkek-sorcerer-SC-9.png → yedek filtre (elf/drow)
- maske yok (ten): /characters/maske/elf-erkek-warlock-WL-10.png → yedek filtre (elf/drow)
- maske yok (ten): /characters/maske/elf-kadin-monk-ID10.png → yedek filtre (elf/drow)
- maske yok (ten): /characters/maske/elf-kadin-paladin-ID3.png → yedek filtre (elf/drow)
- maske yok (ten): /characters/maske/elf-kadin-sorcerer-SC-5.png → yedek filtre (elf/drow)
- maske yok (ten): /characters/maske/elf-kadin-warlock-WL-10.png → yedek filtre (elf/drow)
- maske yok (ten): /characters/maske/gnome-erkek-cleric-ID6.png → yedek filtre (gnome/subterranean)
- maske yok (ten): /characters/maske/gnome-erkek-paladin-ID3.png → yedek filtre (gnome/subterranean)
- maske yok (ten): /characters/maske/gnome-erkek-paladin-ID8.png → yedek filtre (gnome/subterranean)
- maske yok (ten): /characters/maske/gnome-erkek-sorcerer-SC-5.png → yedek filtre (gnome/subterranean)
- maske yok (ten): /characters/maske/gnome-erkek-sorcerer-SC-9.png → yedek filtre (gnome/subterranean)
- maske yok (ten): /characters/maske/gnome-erkek-warlock-WL-10.png → yedek filtre (gnome/subterranean)
- maske yok (ten): /characters/maske/gnome-kadin-monk-ID10.png → yedek filtre (gnome/subterranean)
- maske yok (ten): /characters/maske/gnome-kadin-paladin-ID3.png → yedek filtre (gnome/subterranean)
- maske yok (ten): /characters/maske/gnome-kadin-sorcerer-SC-5.png → yedek filtre (gnome/subterranean)
- maske yok (ten): /characters/maske/gnome-kadin-warlock-WL-10.png → yedek filtre (gnome/subterranean)
- maskesiz boya hiçbir pikseli değiştirmedi: characters/elf-erkek-warlock-WL-10.webp → yedek filtre (elf/high-elf)
- maskesiz boya hiçbir pikseli değiştirmedi: characters/elf-kadin-sorcerer-SC-5.webp → yedek filtre (elf/high-elf)
- maskesiz boya hiçbir pikseli değiştirmedi: characters/elf-kadin-warlock-WL-10.webp → yedek filtre (elf/high-elf)

### `tensiz-jeton`: Maske bilerek boş: jetonda çıplak ten yok (ten tonu görünmez) (5 neden)

- maske bilerek boş (çıplak ten yok): characters/human-erkek-paladin-ID3.webp (2 görünüş)
- maske bilerek boş (çıplak ten yok): characters/human-erkek-sorcerer-SC-5.webp (2 görünüş)
- maske bilerek boş (çıplak ten yok): characters/human-erkek-warlock-WL-10.webp (2 görünüş)
- maske bilerek boş (çıplak ten yok): characters/human-kadin-paladin-ID3.webp (2 görünüş)
- maske bilerek boş (çıplak ten yok): characters/human-kadin-warlock-WL-10.webp (2 görünüş)
