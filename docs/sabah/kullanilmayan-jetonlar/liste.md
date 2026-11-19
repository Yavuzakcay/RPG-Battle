# Kullanılmayan jeton adayları (KJ1, salt rapor)

`public/characters/` altında **hiçbir yere bağlı olmayan** jeton dosyalarının listesi. **Hiçbir dosya silinmedi, taşınmadı, yeniden adlandırılmadı; jeton, maske, JSON ve kod değişmedi** (yalnız bu klasör eklendi). Kaynak: `birlesik` @ `c6095ad`.

Yeniden üretim (depo kökünden):

```bash
npx vite-node docs/sabah/kullanilmayan-jetonlar/betik/coz.ts
python docs/sabah/kullanilmayan-jetonlar/betik/uret.py
```

## Özet

| Ölçü | Sayı |
|---|---:|
| Toplam jeton (`public/characters/*.webp`) | **2880** |
| – sınıf-genel (`<ırk>-<male\|female>-<sınıf>`) | 240 |
| – alt sınıf / Gariban hücresi (`<ırk>-<erkek\|kadin>-<sınıf>-<hücre>`) | 2640 |
| Çözücüde **bağlı** (gerçek kod çalıştırılarak) | 2836 |
| – karakter jetonu olarak seçilen (ana yol) | 2812 |
| – yalnız yedek zinciri / Builder önyüklemesi (zayıf bağ) | 24 |
| Çözücüde bağlı değil ama **kullanıcı kararıyla bağlı sayılan** (Cleric ID3) | 20 |
| **Bağlı sayılan toplam** | **2856** |
| **Aday** (hiçbir yere bağlı değil) | **24** |
| – kesin aday | **0** |
| – riskli aday (Celestial Gariban `-GR`) | 24 |
| Zayıf bağlı, aday değil (Dragonborn sınıf-genel; yalnız yedek zinciri + önyükleme) | 24 |
| Kırık bağ (çözücü `characters/` çözümü, dosyası olmayan) | **0** |
| Kırık bağ (metinde adı geçen ama dosyası olmayan jeton adı; 2447 farklı ad) | **0** |
| (Bilgi) eski `avatars/` yedek yolu: son halka, dizin yok | 240 yol |
| Küçük kopya (`kucuk/`, 96 px) | 2880 (jetonla bire bir; eksik 0, yetim 0) |
| Ten maskesi (`maske/`) | 1692 (6 ırk; yetim 0); bağlı jetonda maske eksik: 36 (hepsi bilinçli, px < 30) |
| Elle maske (`maske-el/`) | 0 dosya |
| `maske-pul/` | dizin yok; `data/dragonborn-pul-duzeltme.json`: dosya yok |
| Kafa kaplaması (`bas/`) | 6 (yetim 0) |
| Yetim maske / yetim küçük kopya (jetonu olmayan) | **0 / 0** |

**Sonuç.** Çözücü yolu 44 dosyayı bağsız buldu: Celestial Gariban `-GR` ×24 ve Cleric ID3 ×20. Cleric ID3 isteğiniz üzerine bağlı sayıldı. Kalan 24 Celestial `-GR` jetonunun hiçbiri çözücüye bağlı değil, ama **bilinçli bağlanmamış** ("hale işi Gemini'de", `DECISIONS.md:155`) ve test, hale/taç verisi ve önizleme koduyla iç içe: bu yüzden hepsi **riskli**, **kesin aday yok**. Başka hiçbir sınıf, ırk, cinsiyet ya da seviye kombinasyonu bağsız jeton bırakmıyor.

| Sınıf | Toplam | Bağlı sayılan | Aday |
|---|---:|---:|---:|
| barbarian | 220 | 218 | 2 |
| bard | 220 | 218 | 2 |
| cleric | 220 | 218 | 2 |
| druid | 190 | 188 | 2 |
| fighter | 250 | 248 | 2 |
| monk | 260 | 258 | 2 |
| paladin | 240 | 238 | 2 |
| ranger | 220 | 218 | 2 |
| rogue | 240 | 238 | 2 |
| sorcerer | 220 | 218 | 2 |
| warlock | 260 | 258 | 2 |
| wizard | 340 | 338 | 2 |

## 1. Yöntem

**"Bağlı"** = jeton şu yollardan biriyle oyunda ya da test/üretimde kullanılıyor: alt sınıf jeton tabloları (`data/*-jeton.json`, `formlar`, `imza.json`, paket alt sınıflarının eşlemeleri), ırk × sınıf × cinsiyet varsayılanları ve Builder önerisi, soy/ten eşlemeleri, `import.meta.glob`/addan türetilen yollar, elle yazılmış adlar. Hedef: hiçbirine bağlı olmayanlar.

**1. yol: çözücü taraması** (`betik/coz.ts`, `npx vite-node`; dosya adı eşleştirmesi yok). `src/battle/avatar.ts` `sheetAvatar` gerçekten çalıştırıldı: 10 ırk × 2 cinsiyet × 12 sınıf × (120 alt sınıf kimliği + alt sınıfsız + bilinmeyen kimlik) × seviye 1–20 = **585.600** çağrı; her sınıf her alt sınıf kimliğiyle çaprazlandı (yanlış sınıfın kimliği çözülmemeli). Üstüne 236.160 doğrudan `subclassTokenFile`/`garibanTokenFile` çağrısı (seviye eşikleri 1, 2, 3, 9, 10, 16, 17, 20: `formlar` ikinci hücreleri dahil) ve çözücü dışında addan kurulan girişler: Builder'ın sınıf jetonu ön yüklemesi (`characterTokenFile`, `src/screens/Builder.tsx:191`) ve Hapishane mahkûm kıyafeti (`src/app/seruvenBattle.ts:235`, sınıf `monk`). Birleşim = bağlı küme: **2836** jeton (`bagli-kume.tsv`: jeton başına ana/yedek/genel çözülme sayısı, seviye aralığı, ilk örnek kombinasyon). Alt sınıf kimlikleri 12 jeton tablosundan ve `imza.json`'dan toplandı (120; paket klasörü `icerik/` bu depoda yok, ama paket alt sınıflarının jeton eşlemeleri zaten bu tablolarda). `formlar` yalnız Fighter Pehlivan'da var (ID5, seviye ≥ 10); Cleric tablosunda `formlar` yok.

**2. yol: tablo yeniden kurulumu + `rg`** (`betik/uret.py`). (a) Çözücü koduna bakmadan `data/*-jeton.json` tablolarından erişim kümesi yeniden hesaplandı (`irklar` × cinsiyet kısıtı × `altSiniflar` hücreleri + `formlar` ikinci hücreleri + Gariban (Celestial hariç) + ırk × cinsiyet × sınıf varsayılanı): **2836** jeton. (b) `rg` ile `src`, `data`, `scripts`, `tests`, `docs` vb. bütün metin dosyalarında jeton adı kalıbı (`<ırk>-<cinsiyet>-<sınıf>[-<hücre>]`) tarandı: **2447** farklı ad, 8.049 eşleşme. Dağılım (dosya türüne göre farklı ad): kod 3, test 75, betik 26, veri tablosu 23, üretim raporu (`*-rapor.json`, `soy-olcum.json`, `hale-*.json`, `kesim-yeniden.json`) 1983, belge 1837. Üretim raporları ve belgeler her dosyayı listelediği için jetonu **bağlamaz**; yalnız kod, test, betik ve veri tablolarında aynen geçen ad "elle yazılmış ad" kanıtı sayıldı.

## 2. Doğrulama: iki bağımsız yol

| Yol | Bağlı | Bağsız (ham) | Cleric ID3/ID9 kararı sonrası aday |
|---|---:|---:|---:|
| 1. çözücü taraması (gerçek kod) | 2836 | 44 | **24** |
| 2a. tablolardan yeniden kurulum (kod yok) | 2836 | 44 | **24** |
| 2b. 2a + `rg`: kod/test/betik/veri tablosunda adı aynen geçen jeton bağlı sayılırsa | – | – | **23** |

Fark: 1. yol ile 2a **aynı kümeyi** veriyor (çözücüde olup tabloda olmayan 0, tabloda olup çözücüde olmayan 0; aday kümeleri özdeş: evet). 2b'de 1 jeton daha düşüyor: `celestial-erkek-monk-GR.webp` (`scripts/hale-alternatif.py`). Bu adın aynen geçtiği yer bir üretim betiği (Gariban örnek listesi), oyun yolu değil; çözücüye göre aday olmaya devam ediyor, yalnız "elle yazılmış ad" riski taşıyor (§4).
Kırık bağ taraması: çözücü 0 (585.600 çözümün hiçbiri dosyasız jeton üretmiyor); metin taraması 0 (kod, test, betik, veri tablosu, rapor, belge: adı geçen 2447 jetonun hepsi diskte var).

## 3. Aday tablosu (çözücüde hiçbir yola bağlı değil: 24)

Hepsi **Celestial Gariban** (`celestial-<erkek|kadin>-<sınıf>-GR`). Bağlı olmama nedeni hepsinde aynı: `garibanTokenFile` Celestial'ı özellikle dışlıyor (`src/battle/avatar.ts:158`); seviye < 3 Celestial karakter sınıf-genel jeton kullanıyor. "En yakın bağlı kardeş": aynı ırk-cinsiyet-sınıfta çözücünün kullandığı hücreler ve L1–2'de Gariban yerine kullanılan sınıf-genel jeton. Kontrol sayfası: `kontak-1.png`.

| Dosya | Neden bağlı değil; en yakın bağlı kardeş | 96 px | maske / maske-el / maske-pul | Yama ve kayıtlar (`data/`) | Ham kaynak (bilgi) |
|---|---|:---:|:---:|---|---|
| `celestial-erkek-barbarian-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-barbarian.webp`; hücreler: ID1–ID9 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 1 |
| `celestial-erkek-bard-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-bard.webp`; hücreler: ID1–ID9 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 2 |
| `celestial-erkek-cleric-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-cleric.webp`; hücreler: ID1–ID2, ID4–ID9 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 3 |
| `celestial-erkek-druid-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-druid.webp`; hücreler: ID1–ID7 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 4 |
| `celestial-erkek-fighter-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-fighter.webp`; hücreler: ID1–ID11 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 5 |
| `celestial-erkek-monk-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-monk.webp`; hücreler: ID1–ID11 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 6 |
| `celestial-erkek-paladin-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-paladin.webp`; hücreler: ID1–ID10 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 7 |
| `celestial-erkek-ranger-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-ranger.webp`; hücreler: ID1–ID9 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 8 |
| `celestial-erkek-rogue-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-rogue.webp`; hücreler: ID1–ID10 | var | yok / yok / dizin yok | toplu-kesim-yeni-rapor, hale-konum (taç konumu `rogue-erkek-gr`) | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 9 |
| `celestial-erkek-sorcerer-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-sorcerer.webp`; hücreler: SC-1–SC-9 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 10 |
| `celestial-erkek-warlock-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-warlock.webp`; hücreler: WL-1–WL-11 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 11 |
| `celestial-erkek-wizard-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-male-wizard.webp`; hücreler: WZ-A1–WZ-A8, WZ-B1–WZ-B7 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-male-celestial.jpg` hücre 12 |
| `celestial-kadin-barbarian-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-barbarian.webp`; hücreler: ID1–ID9 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 1 |
| `celestial-kadin-bard-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-bard.webp`; hücreler: ID1–ID9 | var | yok / yok / dizin yok | toplu-kesim-yeni-rapor, hale-konum (taç konumu `bard-kadin-gr`) | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 2 |
| `celestial-kadin-cleric-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-cleric.webp`; hücreler: ID1–ID2, ID4–ID9 | var | yok / yok / dizin yok | toplu-kesim-yeni-rapor, hale-konum (taç konumu `cleric-kadin-gr`) | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 3 |
| `celestial-kadin-druid-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-druid.webp`; hücreler: ID1–ID8 | var | yok / yok / dizin yok | toplu-kesim-yeni-rapor, hale-konum (taç konumu `druid-kadin-gr`) | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 4 |
| `celestial-kadin-fighter-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-fighter.webp`; hücreler: ID1–ID10 | var | yok / yok / dizin yok | toplu-kesim-yeni-rapor, hale-konum (taç konumu `fighter-kadin-gr`) | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 5 |
| `celestial-kadin-monk-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-monk.webp`; hücreler: ID1–ID11 | var | yok / yok / dizin yok | toplu-kesim-yeni-rapor, hale-konum (taç konumu `monk-kadin-gr`) | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 6 |
| `celestial-kadin-paladin-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-paladin.webp`; hücreler: ID1–ID10 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 7 |
| `celestial-kadin-ranger-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-ranger.webp`; hücreler: ID1–ID9 | var | yok / yok / dizin yok | toplu-kesim-yeni-rapor, hale-konum (taç konumu `ranger-kadin-gr`) | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 8 |
| `celestial-kadin-rogue-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-rogue.webp`; hücreler: ID1–ID10 | var | yok / yok / dizin yok | toplu-kesim-yeni-rapor, hale-konum (taç konumu `rogue-kadin-gr`) | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 9 |
| `celestial-kadin-sorcerer-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-sorcerer.webp`; hücreler: SC-1–SC-9 | var | yok / yok / dizin yok | hale-elle, hale-halesiz, toplu-kesim-yeni-rapor | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 10 |
| `celestial-kadin-warlock-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-warlock.webp`; hücreler: WL-1–WL-11 | var | yok / yok / dizin yok | toplu-kesim-yeni-rapor, hale-konum (taç konumu `warlock-kadin-gr`) | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 11 |
| `celestial-kadin-wizard-GR.webp` | Celestial Gariban dışlanmış; L1–2: `celestial-female-wizard.webp`; hücreler: WZ-A1–WZ-A8, WZ-B1–WZ-B7 | var | yok / yok / dizin yok | toplu-kesim-yeni-rapor, hale-konum (taç konumu `wizard-kadin-gr`) | `assets-ham/karakter/gariban-female-celestial.jpg` hücre 12 |

Celestial ırkının ten maskesi yok (ırk CSS filtresi ve hale/taç ile görünür), bu yüzden `maske` sütunu "yok" beklenen durum. 96 px kopyaların hepsi var.

## 4. Riskli adaylar (24 adayın hepsi)

Aşağıdaki risklerden en az birini taşıyan aday "kesin" listesine alınmaz; §3'teki 24 adayın hepsi hepsini taşıyor (tek istisna son satır):

| Risk türü | Kapsadığı aday | Kanıt |
|---|---:|---|
| Bilinçli bağlanmamış, bağlama bekleyen iş | 24 | `DECISIONS.md:155`, `src/preview/soyGaleriListe.ts:58`, `DECISIONS.md:188` |
| Kodda dinamik yolla ulaşılabilir (geliştirme önizlemesi) | 24 | `src/preview/haleOnizleme.tsx:10` (`import.meta.glob`) |
| Test fikstürü | 24 | `src/data/haleVaryant.test.ts:15`, `src/ui/loading.test.ts:15` |
| Soy / ten / hale varyantı | 24 | `src/ui/haloCrown.ts`, `data/hale-konum.json`, `data/hale-halesiz.json`, `data/hale-elle.json` |
| Elle yazılmış dosya adı | 1 | `celestial-erkek-monk-GR` ← `scripts/hale-alternatif.py:15` |

1. **Bilinçli bağlanmamış, bağlama bekleyen iş.** `DECISIONS.md:155`: "Gariban … `garibanTokenFile`, Celestial hariç: hale işi Gemini'de"; `src/preview/soyGaleriListe.ts:58`: "Celestial Gariban bağlı değil". `DECISIONS.md:188`: 24 Gariban `-GR` (+ 2 Hızır Paladin ID10) için halesiz varyant yöntemi (`scripts/hale-yeni.py:20`) uygulandı; 10 Gariban jetonun taç konumu `data/hale-konum.json` varsayılanlarında hazır, 14 tanesi `data/hale-halesiz.json` bekleyen listesinde (sanat halesi kalan: taç çizilmez, Gemini/karar bekliyor).
2. **Kodda dinamik yolla ulaşılabilir.** `src/preview/haleOnizleme.tsx:10` `import.meta.glob('/public/characters/celestial-*.webp')` bütün Celestial jetonları (Gariban dahil) listeliyor; yalnız geliştirme önizleme sayfası, oyun yolu değil.
3. **Test fikstürü.** `src/data/haleVaryant.test.ts:15` Celestial jeton sayısını **288** bekliyor (264 + 24 Gariban) ve 96 px kopyalarının hepsini; bekleyen listelerinde adı geçen Gariban jetonlar diskte olmalı. `src/ui/loading.test.ts:15` toplam jeton sayısını (2880) ve küçük kopya eşitliğini sınıyor.
4. **Soy/ten varyantı.** Celestial uyanış görünümleri (Gece Gözyaşı gri filtre, Kırık Kanat, yıldız tacı) bu ırkın bütün jetonlarına uygulanıyor (`src/ui/haloCrown.ts`, `lineageLook`); `data/hale-elle.json` kararları ve `scripts/hale-*.py` üretim hattı Gariban jetonlarını kapsıyor.
5. **Elle yazılmış ad.** `celestial-erkek-monk-GR` adı `scripts/hale-alternatif.py:15` içinde aynen geçiyor (hale alternatif önizlemesi, üretim betiği; oyun yolu değil).

## 5. Kesin adaylar

**Yok.** Çözücüde bağsız çıkan 44 dosyanın 24'ü (Celestial Gariban) yukarıdaki risklerin hepsini taşıyor, 20'si (Cleric ID3) isteğiniz üzerine bağlı sayıldı. Emin olamadığım hiçbir dosyayı "kesin" listesine koymadım.

## 6. Çözücüde bağlı olmayan, kullanıcı kararıyla bağlı sayılanlar: Cleric ID3 (20) ve ID9 (20)

`cleric-jeton.json` hücreleri: life-domain→ID1, aydin-alani→ID2, demirci-alani→ID4, firtina-alani→ID5, mezar-alani→ID6, savas-alani→ID7, yakamoz-alani→ID8, imza_birlik→ID9, baris-alani→ID9; `formlar` yok. `jeton-hucre-sirasi.json`: hücre 3 = **Barış** (kaldırılan Barış Alanı; `baris-alani` eski kimliği `imza_birlik` ile birlikte ID9'a yönleniyor), hücre 9 = **Birlik Manastırı**. Sonuç: **ID9** ×20 çözücüde bağlı (Birlik/Barış), **ID3** ×20 hiçbir kimliğe bağlı değil. İsteğiniz üzerine ikisi de bağlı sayıldı ve aday listesine alınmadı. (Cleric `formlar` ile 17+ için ID9 eşlemesi henüz veride yok; eklenirse ID3 çözücüde de bağlı olur.) Kontrol sayfası: `kontak-2.png`.

| Irk | ID3 erkek | ID3 kadın | 96 px / maske (erkek, kadın) |
|---|---|---|---|
| celestial | `celestial-erkek-cleric-ID3.webp` | `celestial-kadin-cleric-ID3.webp` | var/yok, var/yok |
| dragonborn | `dragonborn-erkek-cleric-ID3.webp` | `dragonborn-kadin-cleric-ID3.webp` | var/var, var/var |
| dwarf | `dwarf-erkek-cleric-ID3.webp` | `dwarf-kadin-cleric-ID3.webp` | var/yok, var/yok |
| elf | `elf-erkek-cleric-ID3.webp` | `elf-kadin-cleric-ID3.webp` | var/var, var/var |
| gnome | `gnome-erkek-cleric-ID3.webp` | `gnome-kadin-cleric-ID3.webp` | var/var, var/var |
| goliath | `goliath-erkek-cleric-ID3.webp` | `goliath-kadin-cleric-ID3.webp` | var/var, var/var |
| halfling | `halfling-erkek-cleric-ID3.webp` | `halfling-kadin-cleric-ID3.webp` | var/yok, var/yok |
| human | `human-erkek-cleric-ID3.webp` | `human-kadin-cleric-ID3.webp` | var/var, var/var |
| orc | `orc-erkek-cleric-ID3.webp` | `orc-kadin-cleric-ID3.webp` | var/yok, var/yok |
| tiefling | `tiefling-erkek-cleric-ID3.webp` | `tiefling-kadin-cleric-ID3.webp` | var/var, var/var |

Ham kaynak: `assets-ham/karakter/cleric-<male|female>-<ırk>.jpg` hücre 3 (20/20 dosya bulundu).

## 7. Zayıf bağlı (aday değil): Dragonborn sınıf-genel jetonlar (24)

`sheetAvatar` Dragonborn için her zaman Gariban/alt sınıf jetonu seçiyor (`src/battle/avatar.ts:177`, "eski insansı genel jeton yerine"); sınıf-genel jeton yalnız yedek zincirinde (ilk görsel yüklenemezse) ve Builder'ın sınıf ön yüklemesinde (`kucuk/` kopyaları indirilir ama gösterilmez) çözülüyor. Tanımınıza göre **bağlı** (ırk × sınıf × cinsiyet varsayılanı + test fikstürü: `src/ui/avatar.test.ts:46` 240 sınıf-genel jetonun hepsinin var olmasını bekliyor), bu yüzden aday değil; 2. aşamada karar vermeniz için ayrı gösteriyorum. Kontrol sayfası: `kontak-3.png`.

| Sınıf | Erkek | Kadın |
|---|---|---|
| barbarian | `dragonborn-male-barbarian.webp` | `dragonborn-female-barbarian.webp` |
| bard | `dragonborn-male-bard.webp` | `dragonborn-female-bard.webp` |
| cleric | `dragonborn-male-cleric.webp` | `dragonborn-female-cleric.webp` |
| druid | `dragonborn-male-druid.webp` | `dragonborn-female-druid.webp` |
| fighter | `dragonborn-male-fighter.webp` | `dragonborn-female-fighter.webp` |
| monk | `dragonborn-male-monk.webp` | `dragonborn-female-monk.webp` |
| paladin | `dragonborn-male-paladin.webp` | `dragonborn-female-paladin.webp` |
| ranger | `dragonborn-male-ranger.webp` | `dragonborn-female-ranger.webp` |
| rogue | `dragonborn-male-rogue.webp` | `dragonborn-female-rogue.webp` |
| sorcerer | `dragonborn-male-sorcerer.webp` | `dragonborn-female-sorcerer.webp` |
| warlock | `dragonborn-male-warlock.webp` | `dragonborn-female-warlock.webp` |
| wizard | `dragonborn-male-wizard.webp` | `dragonborn-female-wizard.webp` |

Hepsinin 96 px kopyası (24/24) ve ten maskesi (24/24) var; kayıtlar: `soy-maske-rapor`, `soy-olcum`, `soy-renkleri` (maskFix). Ham kaynak: `assets-ham/karakter/` içinde bu jetonlara ait ayrı dosya bulunamadı (eski genel set).

## 8. Maske ve küçük kopya envanteri

- **Küçük kopya (`public/characters/kucuk/`)**: 2880 dosya, jeton kümesiyle birebir aynı; bağlı jetonda eksik 0, yetim 0. Aday 24 jetonun hepsinin kopyası var.
- **Ten maskesi (`maske/`)**: 1692 dosya: dragonborn 286, elf 280, gnome 278, goliath 283, human 280, tiefling 285. Yetim maske 0. Celestial, Dwarf, Halfling, Orc maskesiz ırklar.
- **Elle maske (`maske-el/`)**: 0 dosya (`data/soy-maske-rapor.json` `sprites` içinde "el" yok); yetim 0.
- **`maske-pul/`**: dizin yok; **`data/dragonborn-pul-duzeltme.json`**: dosya yok (depoda hiçbir yerde başvurusu da yok; Dragonborn pul çalışması `docs/sabah/dragonborn-desen*` altında).
- **Kafa kaplaması (`bas/`)**: 6 dosya (`data/soy-bas.json`: Goliath Paladin/Fighter/Cleric temel jetonları), hepsinin sahibi jeton var.

### Bağlı jetonda maske eksik (36; hepsi bilinçli)

Ten maskesi olan 6 ırkın 1728 jetonundan 36'sında maske dosyası yok. Hepsinin otomatik maske piksel sayısı 30'un altında (`data/soy-maske-alt-rapor.json`; Dragonborn'da `data/soy-maske-dragonborn-rapor.json` tohum 0; "maske yok = boyanmaz", `DECISIONS.md` KQ6); `src/battle/baglamaKq6.test.ts:42-45` bunu sınıyor. Jeton yine çözülüyor, yalnız soy rengi/ten tonu uygulanmıyor.

| Hücre | Jeton (px) |
|---|---|
| cleric-ID6 | gnome-erkek: 11 |
| druid-ID4 | tiefling-erkek: 4, tiefling-kadin: 0 |
| fighter-ID4 | human-erkek: 0 |
| fighter-ID5 | goliath-kadin: 2 |
| monk-ID10 | elf-erkek: 3, elf-kadin: 0, gnome-kadin: 0, human-kadin: 0 |
| paladin-ID3 | elf-erkek: 3, elf-kadin: 0, gnome-erkek: 0, gnome-kadin: 0, human-erkek: 14, human-kadin: 0 |
| paladin-ID8 | gnome-erkek: 25, goliath-erkek: 0, goliath-kadin: 0 |
| rogue-ID4 | dragonborn-erkek: 0, dragonborn-kadin: 0 |
| sorcerer-SC-5 | elf-erkek: 0, elf-kadin: 0, gnome-erkek: 0, gnome-kadin: 0, human-erkek: 5, tiefling-erkek: 7 |
| sorcerer-SC-9 | gnome-erkek: 0, human-erkek: 0 |
| warlock-WL-10 | elf-erkek: 0, elf-kadin: 0, gnome-erkek: 0, gnome-kadin: 0, human-erkek: 0, human-kadin: 0 |
| warlock-WL-4 | goliath-kadin: 4 |
| warlock-WL-8 | goliath-kadin: 0 |

## 9. Kırık bağlar

- Çözücü: **0**. 585.600 çağrının hiçbiri `public/characters/` altında olmayan bir dosyaya çözülmüyor.
- Metin referansı: **0**. Adı geçen 2447 jeton adının hepsi diskte var.
- Bilgi: `sheetAvatar` yedek zincirinin son halkası eski `avatars/<ırk>-<sınıf>-<cinsiyet>.webp` yolu; 240 yol, `public/avatars/` dizini yok. Bilinçli son yedek (ardından baş harfli rozet; `src/ui/avatar.test.ts:36`), kırık bağ sayılmadı.

## 10. Ham kaynaklar (yalnız bilgi; silme listesinde değil)

`assets-ham/karakter/` (284 dosya, depo dışı/`.gitignore`). Aday jetonların ham sayfaları (hücre sırası `data/jeton-hucre-sirasi.json` ve `data/toplu-kesim-yeni-rapor.json`):

| Aday grubu | Ham sayfa | Hücre |
|---|---|---|
| Celestial Gariban erkek (12 jeton) | `assets-ham/karakter/gariban-male-celestial.jpg` | 1–12 (barbarian … wizard, alfabetik) |
| Celestial Gariban kadın (12 jeton) | `assets-ham/karakter/gariban-female-celestial.jpg` | 1–12 (barbarian … wizard, alfabetik) |
| Cleric ID3 (20 jeton, bağlı sayıldı) | `assets-ham/karakter/cleric-<male\|female>-<ırk>.jpg` | 3 (Barış) |

## 11. 2. aşama için notlar (silme etkisi; şimdi bir şey yapılmadı)

Bir jeton silinirse aynı listeyle 96 px kopyası (`kucuk/`), varsa maskesi ve `data/` kayıtları da gider; ayrıca şu testler/veriler güncellenmeli:

- `src/ui/loading.test.ts:15`: toplam jeton sayısı (2880) ve `small == big` eşitliği.
- Celestial Gariban silinirse: `src/data/haleVaryant.test.ts:15-20` (288 jeton, bekleyen listeleri: 14 Gariban adı `data/hale-halesiz.json` ve `data/hale-elle.json` bekleyen listelerinde), `data/hale-konum.json` taç konumları, `data/toplu-kesim-yeni-rapor.json`, `docs/sabah/celestial-denetim/`, `scripts/hale-alternatif.py:15`.
- Dragonborn sınıf-genel silinirse: `src/ui/avatar.test.ts:46-48` (240 genel jeton), `data/soy-renkleri.json` maskFix kayıtları, `data/soy-maske-rapor.json`, `data/soy-olcum.json`; Builder ön yüklemesi (`Builder.tsx:191`) ve yedek zinciri bu dosyaları artık bulamaz (zararsız: görsel yüklenemezse bir sonraki halka).
- Cleric ID3: bağlı sayıldı, silinmez; `formlar` eklenince çözücü de bağlayacak.

## 12. Dosyalar

| Dosya | İçerik |
|---|---|
| `liste.md` | Bu rapor |
| `kontak-1.png` | Aday (riskli) 24 jeton, 8 sütun |
| `kontak-2.png` | Cleric ID3 20 jeton (bağlı sayıldı, bilgi) |
| `kontak-3.png` | Dragonborn sınıf-genel 24 jeton (zayıf bağlı, bilgi) |
| `adaylar.csv` | Aday, kararla bağlı ve zayıf bağlı jetonların ayrıntıları (neden, kardeş, kopya, maske, kayıt, ham kaynak) |
| `bagli-kume.tsv` | Çözücünün bağladığı 2836 jeton: ana/yedek/genel çözülme sayısı, seviye aralığı, ilk örnek kombinasyon |
| `coz-ozet.json` | Çözücü taraması özeti (çağrı sayıları, alt sınıf kimlikleri, `avatars/` yedek yolları) |
| `betik/coz.ts`, `betik/uret.py` | Yeniden üretim betikleri (yalnız okur) |
