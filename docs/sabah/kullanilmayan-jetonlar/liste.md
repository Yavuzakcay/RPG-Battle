# Kullanılmayan jeton adayları (KJ1, salt rapor)

`public/characters/` altında **hiçbir yere bağlı olmayan** jeton dosyalarının listesi. **Hiçbir dosya silinmedi, taşınmadı, yeniden adlandırılmadı; jeton, maske, JSON ve kod değişmedi** (yalnız bu klasör eklendi). Hesaplandığı durum: `origin/birlesik` @ `6a1b6d8`.

Yeniden üretim (depo kökünden):

```bash
npx vite-node docs/sabah/kullanilmayan-jetonlar/betik/coz.ts
python docs/sabah/kullanilmayan-jetonlar/betik/uret.py
```

## Özet

| Ölçü | Sayı |
|---|---:|
| Toplam jeton (`public/characters/*.webp`) | **2900** |
| – sınıf-genel (`<ırk>-<male\|female>-<sınıf>`) | 240 |
| – alt sınıf / Gariban hücresi (`<ırk>-<erkek\|kadin>-<sınıf>-<hücre>`) | 2660 |
| Çözücüde **bağlı** (gerçek kod çalıştırılarak) | **2900** |
| – karakter jetonu olarak seçilen (ana yol) | 2876 |
| – yalnız yedek zinciri / Builder önyüklemesi (zayıf bağ) | 24 |
| Kullanıcı kararıyla bağlı sayılan, çözücüde bağlı olmayan (Cleric ID3/ID9) | 0 |
| **Aday** (hiçbir yere bağlı değil) | **0** |
| – kesin aday | **0** |
| – riskli aday | **0** |
| Zayıf bağlı, aday değil (Dragonborn sınıf-genel) | 24 |
| Kırık bağ (çözücü `characters/` çözümü, dosyası olmayan) | **0** |
| Kırık bağ (metinde adı geçen ama dosyası olmayan jeton adı; 2498 farklı ad) | **0** (+ 2 ad yalnız önek/kalıp, §8) |
| (Bilgi) eski `avatars/` yedek yolu: son halka, dizin yok | 240 yol |
| Küçük kopya (`kucuk/`, 96 px) | 2900 (jetonla bire bir; eksik 0, yetim 0) |
| Ten maskesi (`maske/`) | 1704 (yetim 0) |
| Pul maskesi (`maske-pul/`, Dragonborn) | 266 (yetim 0) |
| Elle maske (`maske-el/`) | 0 dosya |
| Kafa kaplaması (`bas/`) | 6 (yetim 0) |
| Bağlı jetonda beklenen maskenin eksik olduğu | 34 |
| **Yetim maske / yetim küçük kopya** (jetonu olmayan) | **0 / 0** |

**Sonuç: aday yok.** `6a1b6d8` durumunda 2900 jetonun 2900'i çözücüde bağlı; iki bağımsız yol da aynı sonucu veriyor (§2). Bağsız dosya yok, kırık bağ yok, yetim maske/kopya yok. Silinecek aday listesi **boş**; bu yüzden 2. aşama için onaylanacak dosya çıkmadı.

Yöntem sınaması: aynı tarama bu raporun ilk hesabında (`c6095ad`, 2880 jeton) **44 bağsız dosya** bulmuştu: Celestial Gariban `-GR` ×24 ve Cleric ID3 ×20. İkisi de ben raporu yazarken başka oturumlarca bağlandı (`74e32da` Celestial Gariban bağlandı, `5cc08c1` Birlik Manastırı `formlar`: 3–16 ID3, 17+ ID9); tarama birleşen son duruma göre yeniden çalıştırıldı ve 0 çıktı (`kontak-2.png`, `kontak-3.png`).

| Sınıf | Toplam | Bağlı sayılan | Aday |
|---|---:|---:|---:|
| barbarian | 220 | 220 | 0 |
| bard | 220 | 220 | 0 |
| cleric | 220 | 220 | 0 |
| druid | 190 | 190 | 0 |
| fighter | 270 | 270 | 0 |
| monk | 260 | 260 | 0 |
| paladin | 240 | 240 | 0 |
| ranger | 220 | 220 | 0 |
| rogue | 240 | 240 | 0 |
| sorcerer | 220 | 220 | 0 |
| warlock | 260 | 260 | 0 |
| wizard | 340 | 340 | 0 |

## 1. Yöntem

**"Bağlı"** = jeton şu yollardan biriyle oyunda ya da test/üretimde kullanılıyor: alt sınıf jeton tabloları (`data/*-jeton.json`, `formlar`, `imza.json`, paket alt sınıflarının eşlemeleri), ırk × sınıf × cinsiyet varsayılanları ve Builder önerisi, soy/ten eşlemeleri, `import.meta.glob`/addan türetilen yollar, elle yazılmış adlar. Hedef: hiçbirine bağlı olmayanlar.

**1. yol: çözücü taraması** (`betik/coz.ts`, `npx vite-node`; dosya adı eşleştirmesi yok). `src/battle/avatar.ts` `sheetAvatar` gerçekten çalıştırıldı: 10 ırk × 2 cinsiyet × 12 sınıf × (121 alt sınıf kimliği + alt sınıfsız + bilinmeyen kimlik) × seviye 1–20 = **590.400** çağrı; her sınıf her alt sınıf kimliğiyle çaprazlandı (yanlış sınıfın kimliği çözülmemeli). Üstüne 238.080 doğrudan `subclassTokenFile`/`garibanTokenFile` çağrısı (seviye eşikleri 1, 2, 3, 9, 10, 16, 17, 20: `formlar` ikinci hücreleri dahil) ve çözücü dışında addan kurulan girişler: Builder'ın sınıf jetonu ön yüklemesi (`characterTokenFile`, `src/screens/Builder.tsx:191`) ve Hapishane mahkûm kıyafeti (`src/app/seruvenBattle.ts:235`, sınıf `monk`). Birleşim = bağlı küme: **2900** jeton (`bagli-kume.tsv`: jeton başına ana/yedek/genel çözülme sayısı, seviye aralığı, ilk örnek kombinasyon). Alt sınıf kimlikleri 12 jeton tablosundan ve `imza.json`'dan toplandı (121; paket klasörü `icerik/` bu depoda yok, ama paket alt sınıflarının jeton eşlemeleri zaten bu tablolarda). `formlar`: Fighter Pehlivan (ID4 → ID5, seviye ≥ 10) ve Cleric Birlik Manastırı / Barış Alanı (ID3 → ID9, seviye ≥ 17).

**2. yol: tablo yeniden kurulumu + `rg`** (`betik/uret.py`). (a) Çözücü koduna bakmadan `data/*-jeton.json` tablolarından erişim kümesi yeniden hesaplandı (`irklar` × cinsiyet kısıtı × `altSiniflar` hücreleri + `formlar` ikinci hücreleri + Gariban + ırk × cinsiyet × sınıf varsayılanı): **2900** jeton. (b) `rg` ile `src`, `data`, `scripts`, `tests`, `docs` vb. bütün metin dosyalarında jeton adı kalıbı (`<ırk>-<cinsiyet>-<sınıf>[-<hücre>]`) tarandı: **2498** farklı ad, 9.858 eşleşme. Dağılım (dosya türüne göre farklı ad): kod 3, test 84, betik 48, veri tablosu 23, üretim raporu (`*-rapor.json`, `soy-olcum.json`, `hale-*.json`, `kesim-yeniden.json`, `cc-kesim-kaynak.json`, `dragonborn-pul-duzeltme.json`) 2058, belge 1956. Üretim raporları ve belgeler her dosyayı listelediği için jetonu **bağlamaz**; yalnız kod, test, betik ve veri tablolarında aynen geçen ad "elle yazılmış ad" kanıtı sayıldı. `maske-pul/`, soy maskeleri ve kafa kaplaması jetonu bağlamaz, yalnız maske dosyalarının sahibini gösterir (§7).

## 2. Doğrulama: iki bağımsız yol

| Yol | Bağlı | Bağsız (ham) | Aday |
|---|---:|---:|---:|
| 1. çözücü taraması (gerçek kod) | 2900 | 0 | **0** |
| 2a. tablolardan yeniden kurulum (kod yok) | 2900 | 0 | **0** |
| 2b. 2a + `rg`: kod/test/betik/veri tablosunda adı aynen geçen jeton bağlı sayılırsa | – | – | **0** |

Fark: **yok**. 1. yol ile 2a aynı kümeyi veriyor (çözücüde olup tabloda olmayan 0, tabloda olup çözücüde olmayan 0; aday kümeleri özdeş); `rg` adı geçen ek bağlantı bulmadı (2b = 0).

Yöntemin duyarlılığı (aynı üç yol, `c6095ad` durumunda): çözücü 2836 bağlı / 44 bağsız, tablo yeniden kurulumu 2836 / 44, `rg` adı taraması 23 aday (tek fark `celestial-erkek-monk-GR`: `scripts/hale-alternatif.py` içinde elle yazılmış ad). Bağsız 44 dosya: Celestial Gariban `-GR` ×24 (`garibanTokenFile` Celestial'ı dışlıyordu) ve Cleric ID3 ×20 (`cleric-jeton.json`'da hiçbir alt sınıf ID3'e bağlı değildi). Bunlar `74e32da` (`garibanTokenFile` Celestial dahil) ve `5cc08c1` (Cleric `formlar`) ile bağlandı; güncel sonuç aşağıdaki gibi.

Kırık bağ taraması: çözücü 0 (590.400 çözümün hiçbiri dosyasız jeton üretmiyor); metin taraması 0 (adı geçen 2498 jeton adından 2 tanesi diskte yok ama ikisi de önek/kalıp kullanımı, §8; gerisi diskte var).

## 3. Aday tablosu

**Boş.** Çözücüde hiçbir yola bağlı olmayan jeton yok; aday tablosu, riskli ve kesin aday listeleri (§4, §5) boş. En zayıf bağlı jetonlar §6'da ayrı gösteriliyor (aday değil).

## 4. Riskli adaylar

Yok (aday yok). Risk ölçütleri: kodda dinamik yolla ulaşılabilir görünen (`import.meta.glob`), soy/ten varyantı olan, test fikstürü olan jetonlar kesin listesine alınmazdı.

## 5. Kesin adaylar

**Yok.** Emin olamadığım hiçbir dosyayı "kesin" listesine koymadım.

## 6. Zayıf bağlı (aday değil): Dragonborn sınıf-genel jetonlar (24)

`sheetAvatar` Dragonborn için her zaman Gariban/alt sınıf jetonu seçiyor (`src/battle/avatar.ts:177`, "eski insansı genel jeton yerine"); sınıf-genel jeton yalnız yedek zincirinde (ilk görsel yüklenemezse) ve Builder'ın sınıf ön yüklemesinde (`kucuk/` kopyaları indirilir ama gösterilmez) çözülüyor. Tanımınıza göre **bağlı** (ırk × sınıf × cinsiyet varsayılanı + test fikstürü: `src/ui/avatar.test.ts:46` 240 sınıf-genel jetonun hepsinin var olmasını bekliyor), bu yüzden aday değil; 2. aşamada isterseniz karar vermeniz için ayrı gösteriyorum. Kontrol sayfası: `kontak-1.png`.

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

Hepsinin 96 px kopyası (24/24) ve ten maskesi (24/24; pul maskesi yok: genel jetonlar beyaz taban değil) var; kayıtlar: `soy-maske-rapor`, `soy-olcum`, `soy-renkleri` (maskFix). Ham kaynak: `data/cc-kesim-kaynak.json` ve `assets-ham/karakter/` içinde bu jetonlara ait kayıt/dosya bulunamadı (eski genel set).

## 7. Maske ve küçük kopya envanteri

- **Küçük kopya (`public/characters/kucuk/`)**: 2900 dosya, jeton kümesiyle birebir aynı; bağlı jetonda eksik 0, yetim 0.
- **Ten maskesi (`maske/`)**: 1704 dosya: dragonborn 288, elf 281, gnome 280, goliath 285, human 283, tiefling 287. Yetim maske 0.
- **Pul maskesi (`maske-pul/`)**: 266 dosya (Dragonborn beyaz taban jetonları: 266 hücre jetonunun 266'i); yetim 0. Veri: `data/dragonborn-pul.json`, `data/dragonborn-pul-duzeltme.json` (49 jeton yaması), `data/dragonborn-pul-kapali.json` (0 jeton).
- **Elle maske (`maske-el/`)**: 0 dosya (`data/soy-maske-rapor.json` `sprites` içinde "el" yok); yetim 0.
- **Kafa kaplaması (`bas/`)**: 6 dosya (`data/soy-bas.json`: Goliath Paladin/Fighter/Cleric temel jetonları), hepsinin sahibi jeton var.

### Bağlı jetonda beklenen maske eksik (34)

Beklenen maske: Goliath/Tiefling/Elf/Human/Gnome ve Dragonborn sınıf-genel için `maske/`, Dragonborn hücre jetonları için `maske-pul/`. Eksikler:

| Hücre | Jeton (maske türü: px) |
|---|---|
| cleric-ID6 | gnome-erkek (maske: 11) |
| druid-ID4 | tiefling-erkek (maske: 0), tiefling-kadin (maske: 0) |
| fighter-ID5 | goliath-kadin (maske: 2) |
| monk-ID10 | elf-erkek (maske: 3), elf-kadin (maske: 0), gnome-kadin (maske: 0), human-kadin (maske: 0) |
| paladin-ID3 | elf-erkek (maske: 3), elf-kadin (maske: 0), gnome-erkek (maske: 0), gnome-kadin (maske: 0), human-erkek (maske: 14), human-kadin (maske: 0) |
| paladin-ID8 | gnome-erkek (maske: 25), goliath-erkek (maske: 0), goliath-kadin (maske: 0) |
| sorcerer-SC-5 | elf-erkek (maske: 0), elf-kadin (maske: 0), gnome-erkek (maske: 0), gnome-kadin (maske: 0), human-erkek (maske: 5), tiefling-erkek (maske: 7) |
| sorcerer-SC-9 | elf-erkek (maske: 7), gnome-erkek (maske: 0), human-erkek (maske: 0) |
| warlock-WL-10 | elf-erkek (maske: 0), elf-kadin (maske: 0), gnome-erkek (maske: 0), gnome-kadin (maske: 0), human-erkek (maske: 0), human-kadin (maske: 0) |
| warlock-WL-4 | goliath-kadin (maske: 4) |
| warlock-WL-8 | goliath-kadin (maske: 0) |

Karşılığı veride: `data/soy-maske-alt-rapor.json` otomatik maske piksel sayısı 30'un altındaysa "maske yok = boyanmaz" (`DECISIONS.md` KQ6; `src/battle/baglamaKq6.test.ts` sınıyor); eksiklerin hepsi bu ölçütte (hepsi 30'un altında). Jeton yine çözülüyor, yalnız soy rengi/ten tonu uygulanmıyor.

### Bilgi: yetim olmayan ama çalışma anında okunmuyor görünen maskeler

Dragonborn beyaz taban jetonları artık `pul` boyamasıyla `maske-pul/` kullanıyor (`src/ui/tint.ts` `maskUrlFor`). Eski `maske/dragonborn-<cinsiyet>-<sınıf>-<hücre>.png` dosyalarının (264 adet) çalışma anındaki tek okuyucusu `lineageTint(…, 'maske')` yolu (`lineagesAltMaske`); bunu yalnız `scripts/dragonborn-renk-sayfa.ts` çağırıyor, `src` içinde çağıran yok. Jetonları olduğu için **yetim değiller** ve silme listesine alınmadı; yalnız bilgi.

## 8. Kırık bağlar

- Çözücü: **0**. 590.400 çağrının hiçbiri `public/characters/` altında olmayan bir dosyaya çözülmüyor.
- Metin referansı: **0**. Adı geçen 2498 jeton adından 2 tanesi diskte yok, ama ikisi de dosya adı değil önek/kalıp: `celestial-erkek-wizard` (scripts/celestial-final.py, scripts/celestial-wzb-ara.py, scripts/wzb-halesiz.py); `tiefling-kadin-cleric` (docs/sabah/cleric-id9-halka/NOT.md) (örn. `celestial-erkek-wizard-WZ-{c}` biçimli f-string, belge başlığındaki `…-kontak.png` adı). Gerisi diskte var.
- Bilgi: `sheetAvatar` yedek zincirinin son halkası eski `avatars/<ırk>-<sınıf>-<cinsiyet>.webp` yolu; 240 yol, `public/avatars/` dizini yok. Bilinçli son yedek (ardından baş harfli rozet; `src/ui/avatar.test.ts:36`), kırık bağ sayılmadı.

## 9. Ham kaynaklar (yalnız bilgi; silme listesinde değil)

Aday olmadığı için ham kaynağı listelenecek jeton yok. İleride aday çıkarsa: `data/cc-kesim-kaynak.json` (374/2900 jeton için kaynak geçmişi: kaynak, dosya, hücre) ve `assets-ham/karakter/` (284 dosya, depo dışı/`.gitignore`; `gariban-<male|female>-<ırk>.jpg` hücre 1–12 = barbarian … wizard, `<sınıf>-<male|female>-<ırk>.jpg` hücre = ID/WL/SC numarası; sıra `data/jeton-hucre-sirasi.json`, kesim kaydı `data/toplu-kesim-yeni-rapor.json`). Zayıf bağlı Dragonborn sınıf-genel jetonların ham kaynağı bu kayıtlarda yok.

## 10. 2. aşama için notlar

Aday listesi boş: **silinecek dosya yok**, 96 px kopya/maske tarafında yetim yok. Yalnız isterseniz Dragonborn sınıf-genel jetonlar (§6) konuşulabilir; silinirse şunlar etkilenir: `src/ui/avatar.test.ts:46-48` (240 sınıf-genel jetonun var olması), `src/ui/loading.test.ts:15` (toplam jeton sayısı ve `small == big`), `data/soy-renkleri.json` maskFix kayıtları, `data/soy-maske-rapor.json`, `data/soy-olcum.json`; Builder ön yüklemesi (`Builder.tsx:191`) ve yedek zinciri bu dosyaları artık bulamaz (zararsız: görsel yüklenemezse bir sonraki halka).

## 11. Dosyalar

| Dosya | İçerik |
|---|---|
| `liste.md` | Bu rapor |
| `kontak-1.png` | Zayıf bağlı Dragonborn sınıf-genel 24 jeton (aday değil), 8 sütun |
| `kontak-2.png` | Bilgi: ilk taramada bağsız çıkıp sonradan bağlanan Celestial Gariban 24 jeton |
| `kontak-3.png` | Bilgi: ilk taramada bağsız çıkıp sonradan bağlanan Cleric ID3 20 jeton |
| `adaylar.csv` | Aday ve zayıf bağlı jetonların ayrıntıları (neden, kardeş, kopya, maske, kayıt, ham kaynak) |
| `bagli-kume.tsv` | Çözücünün bağladığı 2900 jeton: ana/yedek/genel çözülme sayısı, seviye aralığı, ilk örnek kombinasyon |
| `coz-ozet.json` | Çözücü taraması özeti (çağrı sayıları, alt sınıf kimlikleri, `avatars/` yedek yolları) |
| `betik/coz.ts`, `betik/uret.py` | Yeniden üretim betikleri (yalnız okur) |
