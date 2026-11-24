# KESIM-TEPE: tepesi kesik jetonlar (2026-11-23; yalnız görünüm, kural/kayıt sürümü değişmedi)

Şikâyet: bazı jetonların tepesi (saç, kapüşon, şapka) kesik; kullanıcı Dark Elf kadın Barbarian, Cleric, Warlock, Sorcerer, Rogue ekran
görüntüleri verdi. Kesik jeton karesinin KENARINDA değil, figürün üst konturunda: saç kubbesi düz bir çizgiyle bitiyor, üst kontur yok.
(İlk tarama yalnız kare kenarına baktığı için bunu kaçırdı; ilk "ham çizim basık" sonucu yanlış ölçekte yapılmış bir bakıştı, geri alındı.)

## Kök neden

**Kesim içeriği kesiyordu; ham sayfada içerik hücre dışına taşmıyor.** Ham sayfada (örnek `warlock-female-elf.jpg` WL-9) saç yuvarlak
kubbe, hücre çizgisinin ~40 px altında. KESIM-DUZELT (2026-11-22, 102538ec) öncesi `scripts/toplu-kesim.py` şerit silmesi
(`trim_lines`/`drop_lines`) figürün üst kenarındaki koyu kontur satırlarını (ve altındaki 1–2 saç satırını) ızgara çizgisi artığı sanıp
siliyordu. Kanıt: 11-19 kodu (`bf3f183b`) ile aynı ham sayfadan WL-9 yeniden kesildiğinde mevcut jetonun alfası birebir çıkıyor (0 px
fark); güncel kodla aynı kesimde tepe konturu var. Kod 11-22'de düzeltilmişti ama o gün yalnız 126 jeton yeniden kesildi; 11-16 toplu
kesiminden ve CC kesiminden kalanlar eski kesimdeydi. Aynı hasar kalkan/kanat/asa kenarlarında da (dikey kontur şeridi).

## Tarama (`python scripts/kesim-tepe.py olc`, yazmaz)

Her jeton güncel kodla ham sayfadan kesilip eski jetona alt piksel kaydedildi (`kesim-yenile.py` `register`); geri gelen piksellerden eski
siluetin üstüne eklenenler sayıldı (`tepeKazanc`). Kaynak: defter (`data/cc-kesim-kaynak.json`) ya da ad → sayfa/hücre (Gariban dahil).

- Ölçülen 2342 jeton (2126 + 216 Gariban), tepesi kesik (≥ 6 px) **748**. Kapsam dışı: Wizard WZ (296, ayrı betik), sınıf-genel (205, ham
  sayfa yok), 11 ELLE hücre.
- Düzeltilmeyen 158: iou < 0,97 (kayıt güvenilmez: farklı ham sürüm, macenta haleli beyaz pelerin) 70, Celestial ada göre (sınıf sayfası
  haleli, jeton halesiz: hale geri eklenirdi) 69, Hızır Paladin ID10 (ayrı sayfa) 15, diğer 4.

## Düzeltme

`python scripts/kesim-tepe.py isler` → `data/kesim-duzelt.json` 590 iş (`grup: tepe`, `yerlesim: eski`, `cizgiSuz`), sonra
`python scripts/kesim-yenile.py uygula --kuru`, gözle bakıldı, `uygula --kurudan`. **Eski yerleşim**: eski jetonun pikselleri değişmez,
yalnız güncel kesimde geri gelen pikseller (tepe konturu, saç; kalkan/kanat kenarı) eklenir; jetonun yeri ve ölçeği aynı, bu yüzden ten
maskesi hizası bozulmaz (maske yeniden üretilmedi). Yeni süzgeç `drop_detached_lines`: eklenenlerden figüre değmeyen ince uzun parçalar
(ızgara/çerçeve çizgisi artığı) ve küçük koyu kırıntılar alınmaz; 13 jetonda 1784 px (Elf/Orc Barbarian GR alt çubuğu, Tiefling/Dwarf/Elf
Rogue ID4 çerçeve, Halfling Fighter ID10 dikey çizgi…). Kopuk parlak efektler (yıldız, kıvılcım) kalır.

- **590 jeton** (erkek 324, kadın 266; Dragonborn 118, Tiefling 105, Human 75, Elf 62, Dwarf 51, Gnome 50, Orc 45, Halfling 39, Goliath 35,
  Celestial 10 (defterdeki halesiz kaynak)); küçük kopyalar `npm run karakter-kucuk -- <adlar>`. Eski dosyalar
  `public/characters/_yedek-kesim-2026-11-22/` (git dışı). Defterde kaynak `duzeltme`, not "KESIM-TEPE 2026-11-23 (eski)".
- **Değişmeyenler:** `git status` ile değişen jetonlar = iş listesi (başka jeton yok). Düzeltilenlerde eski opak piksellerin alfası korunuyor
  (590 jetonda toplam 60 px düşüş; webp q92 yeniden kodlaması, ortalama renk farkı 2,95).
- **Sonra ölçü** (`gorsel-dokum/kesim-tepe/sonra/`): 590'ın 64'ünde tepeKazanc ≥ 6 kalıyor: 13'ü bilerek alınmayan çizgi parçası (kesik
  değil), 51'i küçük kalıntı (en çok 54, çoğu 6–25 px: siluete yapışık 1 px ince kenar, araç bilerek eklemez).
- Önce/sonra: `gorsel-dokum/kesim-tepe/dark-elf-once-sonra.png` (kullanıcının ekran görüntülerindeki Dark Elf jetonları; Sorcerer SC-6
  ölçüde kesik çıkmadı, düzeltilmedi). Kontak sayfaları `gorsel-dokum/kesim-duzelt/uygula-tepe-*.jpg`, `gorsel-dokum/kesim-tepe/`.

Yeniden üretim (ham klasör: wip/karakter-ham karakter/ + eksikler/ birleşik, `CC_HAM`):

```powershell
$env:PYTHONUTF8=1; $env:CC_HAM="<birleşik ham klasör>"; python scripts/kesim-tepe.py olc
```

## Düzeltilen jetonlar (590)

`celestial-erkek-cleric-ID2` `celestial-erkek-cleric-ID4` `celestial-erkek-cleric-ID5` `celestial-erkek-cleric-ID7` `celestial-erkek-cleric-ID9` `celestial-erkek-warlock-WL-10` `celestial-erkek-warlock-WL-11` `celestial-erkek-warlock-WL-7` `celestial-erkek-warlock-WL-8` `celestial-kadin-bard-ID3` `dragonborn-erkek-barbarian-GR` `dragonborn-erkek-barbarian-ID1` `dragonborn-erkek-barbarian-ID2` `dragonborn-erkek-barbarian-ID3` `dragonborn-erkek-barbarian-ID4` `dragonborn-erkek-barbarian-ID5` `dragonborn-erkek-barbarian-ID6` `dragonborn-erkek-barbarian-ID7` `dragonborn-erkek-barbarian-ID8` `dragonborn-erkek-bard-GR` `dragonborn-erkek-bard-ID1` `dragonborn-erkek-bard-ID2` `dragonborn-erkek-bard-ID3` `dragonborn-erkek-bard-ID4` `dragonborn-erkek-bard-ID5` `dragonborn-erkek-bard-ID6` `dragonborn-erkek-bard-ID7` `dragonborn-erkek-bard-ID8` `dragonborn-erkek-bard-ID9` `dragonborn-erkek-cleric-GR` `dragonborn-erkek-cleric-ID2` `dragonborn-erkek-cleric-ID4` `dragonborn-erkek-cleric-ID5` `dragonborn-erkek-cleric-ID7` `dragonborn-erkek-cleric-ID8` `dragonborn-erkek-druid-GR` `dragonborn-erkek-druid-ID1` `dragonborn-erkek-druid-ID2` `dragonborn-erkek-druid-ID3` `dragonborn-erkek-druid-ID5` `dragonborn-erkek-druid-ID6` `dragonborn-erkek-druid-ID7` `dragonborn-erkek-fighter-GR` `dragonborn-erkek-fighter-ID1` `dragonborn-erkek-fighter-ID10` `dragonborn-erkek-fighter-ID11` `dragonborn-erkek-fighter-ID2` `dragonborn-erkek-fighter-ID4` `dragonborn-erkek-fighter-ID5` `dragonborn-erkek-fighter-ID6` `dragonborn-erkek-fighter-ID7` `dragonborn-erkek-monk-GR` `dragonborn-erkek-paladin-GR` `dragonborn-erkek-ranger-GR` `dragonborn-erkek-ranger-ID1` `dragonborn-erkek-ranger-ID2` `dragonborn-erkek-ranger-ID3` `dragonborn-erkek-ranger-ID4` `dragonborn-erkek-ranger-ID5` `dragonborn-erkek-ranger-ID6` `dragonborn-erkek-ranger-ID7` `dragonborn-erkek-ranger-ID8` `dragonborn-erkek-ranger-ID9` `dragonborn-erkek-rogue-GR` `dragonborn-erkek-rogue-ID10` `dragonborn-erkek-rogue-ID3` `dragonborn-erkek-rogue-ID4` `dragonborn-erkek-rogue-ID5` `dragonborn-erkek-rogue-ID8` `dragonborn-erkek-sorcerer-GR` `dragonborn-erkek-sorcerer-SC-1` `dragonborn-erkek-sorcerer-SC-2` `dragonborn-erkek-sorcerer-SC-4` `dragonborn-erkek-sorcerer-SC-6` `dragonborn-erkek-sorcerer-SC-7` `dragonborn-erkek-sorcerer-SC-9` `dragonborn-erkek-warlock-GR` `dragonborn-erkek-warlock-WL-11` `dragonborn-erkek-warlock-WL-3` `dragonborn-erkek-warlock-WL-5` `dragonborn-erkek-warlock-WL-7` `dragonborn-erkek-wizard-GR` `dragonborn-kadin-barbarian-ID2` `dragonborn-kadin-barbarian-ID4` `dragonborn-kadin-bard-GR` `dragonborn-kadin-bard-ID3` `dragonborn-kadin-bard-ID4` `dragonborn-kadin-bard-ID7` `dragonborn-kadin-bard-ID8` `dragonborn-kadin-cleric-GR` `dragonborn-kadin-cleric-ID1` `dragonborn-kadin-cleric-ID4` `dragonborn-kadin-cleric-ID5` `dragonborn-kadin-cleric-ID6` `dragonborn-kadin-cleric-ID7` `dragonborn-kadin-druid-ID7` `dragonborn-kadin-druid-ID8` `dragonborn-kadin-fighter-ID1` `dragonborn-kadin-fighter-ID4` `dragonborn-kadin-fighter-ID5` `dragonborn-kadin-monk-ID1` `dragonborn-kadin-monk-ID10` `dragonborn-kadin-monk-ID2` `dragonborn-kadin-monk-ID3` `dragonborn-kadin-monk-ID4` `dragonborn-kadin-monk-ID5` `dragonborn-kadin-monk-ID6` `dragonborn-kadin-monk-ID7` `dragonborn-kadin-paladin-GR` `dragonborn-kadin-ranger-ID2` `dragonborn-kadin-ranger-ID3` `dragonborn-kadin-ranger-ID4` `dragonborn-kadin-ranger-ID8` `dragonborn-kadin-ranger-ID9` `dragonborn-kadin-rogue-GR` `dragonborn-kadin-rogue-ID10` `dragonborn-kadin-rogue-ID2` `dragonborn-kadin-rogue-ID3` `dragonborn-kadin-rogue-ID4` `dragonborn-kadin-rogue-ID5` `dragonborn-kadin-rogue-ID6` `dragonborn-kadin-sorcerer-SC-9` `dragonborn-kadin-warlock-WL-11` `dragonborn-kadin-warlock-WL-3` `dragonborn-kadin-warlock-WL-6` `dragonborn-kadin-warlock-WL-7` `dragonborn-kadin-warlock-WL-8` `dragonborn-kadin-wizard-GR` `dwarf-erkek-barbarian-ID8` `dwarf-erkek-bard-GR` `dwarf-erkek-bard-ID3` `dwarf-erkek-cleric-GR` `dwarf-erkek-fighter-GR` `dwarf-erkek-fighter-ID9` `dwarf-erkek-paladin-ID1` `dwarf-erkek-paladin-ID5` `dwarf-erkek-paladin-ID6` `dwarf-erkek-ranger-GR` `dwarf-erkek-rogue-GR` `dwarf-erkek-rogue-ID10` `dwarf-erkek-rogue-ID3` `dwarf-erkek-rogue-ID4` `dwarf-erkek-rogue-ID6` `dwarf-erkek-warlock-GR` `dwarf-erkek-warlock-WL-1` `dwarf-erkek-warlock-WL-10` `dwarf-erkek-warlock-WL-11` `dwarf-erkek-warlock-WL-3` `dwarf-erkek-warlock-WL-5` `dwarf-erkek-warlock-WL-6` `dwarf-erkek-warlock-WL-7` `dwarf-erkek-warlock-WL-8` `dwarf-erkek-warlock-WL-9` `dwarf-kadin-bard-ID3` `dwarf-kadin-bard-ID9` `dwarf-kadin-cleric-GR` `dwarf-kadin-cleric-ID8` `dwarf-kadin-fighter-ID1` `dwarf-kadin-fighter-ID10` `dwarf-kadin-paladin-GR` `dwarf-kadin-paladin-ID1` `dwarf-kadin-paladin-ID5` `dwarf-kadin-paladin-ID6` `dwarf-kadin-ranger-GR` `dwarf-kadin-ranger-ID4` `dwarf-kadin-rogue-GR` `dwarf-kadin-rogue-ID1` `dwarf-kadin-rogue-ID10` `dwarf-kadin-rogue-ID4` `dwarf-kadin-rogue-ID6` `dwarf-kadin-sorcerer-SC-9` `dwarf-kadin-warlock-GR` `dwarf-kadin-warlock-WL-1` `dwarf-kadin-warlock-WL-11` `dwarf-kadin-warlock-WL-3` `dwarf-kadin-warlock-WL-7` `dwarf-kadin-warlock-WL-8` `dwarf-kadin-warlock-WL-9` `dwarf-kadin-wizard-GR` `elf-erkek-barbarian-GR` `elf-erkek-barbarian-ID8` `elf-erkek-bard-GR` `elf-erkek-bard-ID1` `elf-erkek-bard-ID2` `elf-erkek-bard-ID3` `elf-erkek-bard-ID4` `elf-erkek-bard-ID6` `elf-erkek-bard-ID7` `elf-erkek-bard-ID8` `elf-erkek-cleric-GR` `elf-erkek-cleric-ID8` `elf-erkek-druid-GR` `elf-erkek-monk-ID10` `elf-erkek-paladin-ID1` `elf-erkek-paladin-ID6` `elf-erkek-paladin-ID9` `elf-erkek-ranger-GR` `elf-erkek-rogue-GR` `elf-erkek-rogue-ID1` `elf-erkek-rogue-ID10` `elf-erkek-rogue-ID2` `elf-erkek-rogue-ID9` `elf-erkek-sorcerer-GR` `elf-erkek-sorcerer-SC-5` `elf-erkek-warlock-GR` `elf-erkek-warlock-WL-10` `elf-erkek-warlock-WL-11` `elf-erkek-warlock-WL-3` `elf-erkek-warlock-WL-4` `elf-erkek-warlock-WL-5` `elf-erkek-warlock-WL-7` `elf-erkek-warlock-WL-8` `elf-erkek-warlock-WL-9` `elf-erkek-wizard-GR` `elf-kadin-barbarian-GR` `elf-kadin-barbarian-ID8` `elf-kadin-bard-ID3` `elf-kadin-cleric-GR` `elf-kadin-cleric-ID6` `elf-kadin-cleric-ID8` `elf-kadin-druid-GR` `elf-kadin-fighter-ID2` `elf-kadin-monk-GR` `elf-kadin-paladin-ID1` `elf-kadin-paladin-ID5` `elf-kadin-ranger-GR` `elf-kadin-rogue-ID1` `elf-kadin-rogue-ID10` `elf-kadin-rogue-ID4` `elf-kadin-rogue-ID9` `elf-kadin-sorcerer-GR` `elf-kadin-sorcerer-SC-9` `elf-kadin-warlock-GR` `elf-kadin-warlock-WL-1` `elf-kadin-warlock-WL-11` `elf-kadin-warlock-WL-3` `elf-kadin-warlock-WL-5` `elf-kadin-warlock-WL-7` `elf-kadin-warlock-WL-8` `elf-kadin-warlock-WL-9` `elf-kadin-wizard-GR` `gnome-erkek-barbarian-GR` `gnome-erkek-barbarian-ID8` `gnome-erkek-bard-GR` `gnome-erkek-bard-ID3` `gnome-erkek-bard-ID5` `gnome-erkek-bard-ID6` `gnome-erkek-cleric-GR` `gnome-erkek-cleric-ID1` `gnome-erkek-druid-ID5` `gnome-erkek-fighter-ID1` `gnome-erkek-fighter-ID10` `gnome-erkek-fighter-ID2` `gnome-erkek-fighter-ID4` `gnome-erkek-fighter-ID7` `gnome-erkek-fighter-ID8` `gnome-erkek-monk-GR` `gnome-erkek-paladin-GR` `gnome-erkek-paladin-ID1` `gnome-erkek-paladin-ID6` `gnome-erkek-ranger-GR` `gnome-erkek-rogue-GR` `gnome-erkek-rogue-ID3` `gnome-erkek-rogue-ID7` `gnome-erkek-sorcerer-GR` `gnome-erkek-sorcerer-SC-9` `gnome-erkek-warlock-GR` `gnome-erkek-warlock-WL-1` `gnome-erkek-warlock-WL-10` `gnome-erkek-warlock-WL-11` `gnome-erkek-warlock-WL-5` `gnome-erkek-warlock-WL-8` `gnome-erkek-wizard-GR` `gnome-kadin-bard-GR` `gnome-kadin-fighter-GR` `gnome-kadin-fighter-ID3` `gnome-kadin-paladin-GR` `gnome-kadin-paladin-ID1` `gnome-kadin-paladin-ID5` `gnome-kadin-paladin-ID6` `gnome-kadin-paladin-ID9` `gnome-kadin-ranger-GR` `gnome-kadin-rogue-GR` `gnome-kadin-rogue-ID10` `gnome-kadin-rogue-ID3` `gnome-kadin-rogue-ID4` `gnome-kadin-rogue-ID7` `gnome-kadin-sorcerer-SC-9` `gnome-kadin-warlock-GR` `gnome-kadin-warlock-WL-8` `gnome-kadin-wizard-GR` `goliath-erkek-barbarian-ID3` `goliath-erkek-barbarian-ID8` `goliath-erkek-bard-GR` `goliath-erkek-bard-ID3` `goliath-erkek-cleric-GR` `goliath-erkek-cleric-ID7` `goliath-erkek-druid-GR` `goliath-erkek-druid-ID2` `goliath-erkek-fighter-GR` `goliath-erkek-paladin-GR` `goliath-erkek-paladin-ID1` `goliath-erkek-paladin-ID5` `goliath-erkek-ranger-GR` `goliath-erkek-rogue-ID10` `goliath-erkek-rogue-ID8` `goliath-erkek-sorcerer-GR` `goliath-erkek-sorcerer-SC-9` `goliath-erkek-warlock-GR` `goliath-erkek-warlock-WL-3` `goliath-erkek-warlock-WL-8` `goliath-kadin-barbarian-GR` `goliath-kadin-barbarian-ID4` `goliath-kadin-barbarian-ID8` `goliath-kadin-cleric-GR` `goliath-kadin-fighter-GR` `goliath-kadin-fighter-ID7` `goliath-kadin-paladin-GR` `goliath-kadin-paladin-ID1` `goliath-kadin-paladin-ID6` `goliath-kadin-ranger-GR` `goliath-kadin-rogue-GR` `goliath-kadin-rogue-ID10` `goliath-kadin-sorcerer-GR` `goliath-kadin-warlock-GR` `goliath-kadin-warlock-WL-8` `halfling-erkek-bard-ID7` `halfling-erkek-bard-ID8` `halfling-erkek-fighter-ID11` `halfling-erkek-fighter-ID7` `halfling-erkek-paladin-GR` `halfling-erkek-paladin-ID1` `halfling-erkek-paladin-ID6` `halfling-erkek-ranger-GR` `halfling-erkek-ranger-ID5` `halfling-erkek-rogue-GR` `halfling-erkek-rogue-ID10` `halfling-erkek-rogue-ID3` `halfling-erkek-rogue-ID8` `halfling-erkek-sorcerer-GR` `halfling-erkek-sorcerer-SC-4` `halfling-erkek-warlock-GR` `halfling-erkek-warlock-WL-8` `halfling-kadin-barbarian-ID5` `halfling-kadin-bard-GR` `halfling-kadin-bard-ID2` `halfling-kadin-bard-ID6` `halfling-kadin-cleric-GR` `halfling-kadin-fighter-ID10` `halfling-kadin-fighter-ID5` `halfling-kadin-fighter-ID7` `halfling-kadin-paladin-ID1` `halfling-kadin-paladin-ID5` `halfling-kadin-paladin-ID9` `halfling-kadin-ranger-GR` `halfling-kadin-rogue-GR` `halfling-kadin-rogue-ID10` `halfling-kadin-rogue-ID3` `halfling-kadin-rogue-ID4` `halfling-kadin-rogue-ID7` `halfling-kadin-sorcerer-GR` `halfling-kadin-sorcerer-SC-9` `halfling-kadin-warlock-GR` `halfling-kadin-warlock-WL-8` `halfling-kadin-wizard-GR` `human-erkek-barbarian-ID1` `human-erkek-bard-GR` `human-erkek-bard-ID3` `human-erkek-cleric-GR` `human-erkek-cleric-ID8` `human-erkek-fighter-GR` `human-erkek-fighter-ID1` `human-erkek-fighter-ID10` `human-erkek-fighter-ID11` `human-erkek-fighter-ID2` `human-erkek-fighter-ID3` `human-erkek-fighter-ID4` `human-erkek-fighter-ID5` `human-erkek-fighter-ID6` `human-erkek-fighter-ID7` `human-erkek-fighter-ID8` `human-erkek-fighter-ID9` `human-erkek-monk-ID1` `human-erkek-monk-ID2` `human-erkek-paladin-GR` `human-erkek-paladin-ID1` `human-erkek-paladin-ID5` `human-erkek-paladin-ID9` `human-erkek-ranger-GR` `human-erkek-rogue-GR` `human-erkek-rogue-ID1` `human-erkek-rogue-ID10` `human-erkek-rogue-ID4` `human-erkek-rogue-ID6` `human-erkek-rogue-ID9` `human-erkek-sorcerer-SC-8` `human-erkek-warlock-GR` `human-erkek-warlock-WL-10` `human-erkek-warlock-WL-11` `human-erkek-warlock-WL-3` `human-erkek-warlock-WL-5` `human-erkek-warlock-WL-7` `human-erkek-warlock-WL-8` `human-erkek-warlock-WL-9` `human-erkek-wizard-GR` `human-kadin-barbarian-GR` `human-kadin-barbarian-ID8` `human-kadin-bard-GR` `human-kadin-bard-ID3` `human-kadin-cleric-GR` `human-kadin-cleric-ID7` `human-kadin-cleric-ID8` `human-kadin-fighter-ID1` `human-kadin-fighter-ID2` `human-kadin-fighter-ID3` `human-kadin-fighter-ID4` `human-kadin-fighter-ID5` `human-kadin-fighter-ID6` `human-kadin-fighter-ID7` `human-kadin-fighter-ID8` `human-kadin-fighter-ID9` `human-kadin-monk-ID11` `human-kadin-monk-ID9` `human-kadin-paladin-ID1` `human-kadin-paladin-ID5` `human-kadin-paladin-ID6` `human-kadin-paladin-ID9` `human-kadin-rogue-GR` `human-kadin-rogue-ID1` `human-kadin-rogue-ID6` `human-kadin-rogue-ID7` `human-kadin-sorcerer-SC-9` `human-kadin-warlock-WL-11` `human-kadin-warlock-WL-3` `human-kadin-warlock-WL-4` `human-kadin-warlock-WL-5` `human-kadin-warlock-WL-7` `human-kadin-warlock-WL-8` `human-kadin-warlock-WL-9` `human-kadin-wizard-GR` `orc-erkek-barbarian-GR` `orc-erkek-barbarian-ID1` `orc-erkek-barbarian-ID8` `orc-erkek-cleric-GR` `orc-erkek-cleric-ID7` `orc-erkek-druid-GR` `orc-erkek-fighter-GR` `orc-erkek-fighter-ID1` `orc-erkek-fighter-ID11` `orc-erkek-fighter-ID2` `orc-erkek-monk-ID10` `orc-erkek-paladin-GR` `orc-erkek-paladin-ID1` `orc-erkek-paladin-ID5` `orc-erkek-paladin-ID9` `orc-erkek-ranger-GR` `orc-erkek-rogue-GR` `orc-erkek-rogue-ID3` `orc-erkek-warlock-GR` `orc-erkek-warlock-WL-4` `orc-erkek-warlock-WL-8` `orc-erkek-wizard-GR` `orc-kadin-bard-GR` `orc-kadin-bard-ID3` `orc-kadin-cleric-GR` `orc-kadin-cleric-ID4` `orc-kadin-cleric-ID7` `orc-kadin-druid-ID2` `orc-kadin-fighter-ID3` `orc-kadin-fighter-ID5` `orc-kadin-monk-GR` `orc-kadin-monk-ID10` `orc-kadin-monk-ID3` `orc-kadin-monk-ID9` `orc-kadin-paladin-ID1` `orc-kadin-rogue-GR` `orc-kadin-rogue-ID10` `orc-kadin-rogue-ID3` `orc-kadin-rogue-ID7` `orc-kadin-sorcerer-GR` `orc-kadin-sorcerer-SC-2` `orc-kadin-sorcerer-SC-9` `orc-kadin-warlock-GR` `orc-kadin-warlock-WL-8` `orc-kadin-wizard-GR` `tiefling-erkek-barbarian-ID1` `tiefling-erkek-barbarian-ID2` `tiefling-erkek-barbarian-ID3` `tiefling-erkek-barbarian-ID5` `tiefling-erkek-barbarian-ID6` `tiefling-erkek-barbarian-ID7` `tiefling-erkek-barbarian-ID9` `tiefling-erkek-bard-GR` `tiefling-erkek-bard-ID1` `tiefling-erkek-bard-ID2` `tiefling-erkek-bard-ID4` `tiefling-erkek-bard-ID5` `tiefling-erkek-bard-ID6` `tiefling-erkek-bard-ID7` `tiefling-erkek-bard-ID8` `tiefling-erkek-cleric-GR` `tiefling-erkek-druid-GR` `tiefling-erkek-druid-ID4` `tiefling-erkek-fighter-GR` `tiefling-erkek-monk-GR` `tiefling-erkek-monk-ID3` `tiefling-erkek-paladin-ID1` `tiefling-erkek-paladin-ID2` `tiefling-erkek-paladin-ID3` `tiefling-erkek-paladin-ID5` `tiefling-erkek-paladin-ID6` `tiefling-erkek-ranger-GR` `tiefling-erkek-ranger-ID8` `tiefling-erkek-ranger-ID9` `tiefling-erkek-rogue-GR` `tiefling-erkek-rogue-ID1` `tiefling-erkek-rogue-ID10` `tiefling-erkek-rogue-ID2` `tiefling-erkek-rogue-ID3` `tiefling-erkek-rogue-ID4` `tiefling-erkek-rogue-ID5` `tiefling-erkek-rogue-ID6` `tiefling-erkek-rogue-ID7` `tiefling-erkek-rogue-ID8` `tiefling-erkek-rogue-ID9` `tiefling-erkek-sorcerer-GR` `tiefling-erkek-sorcerer-SC-9` `tiefling-erkek-warlock-GR` `tiefling-erkek-warlock-WL-10` `tiefling-erkek-warlock-WL-11` `tiefling-erkek-warlock-WL-2` `tiefling-erkek-warlock-WL-5` `tiefling-erkek-warlock-WL-6` `tiefling-erkek-warlock-WL-7` `tiefling-erkek-warlock-WL-8` `tiefling-erkek-warlock-WL-9` `tiefling-erkek-wizard-GR` `tiefling-kadin-barbarian-GR` `tiefling-kadin-barbarian-ID1` `tiefling-kadin-barbarian-ID2` `tiefling-kadin-barbarian-ID8` `tiefling-kadin-barbarian-ID9` `tiefling-kadin-bard-GR` `tiefling-kadin-bard-ID1` `tiefling-kadin-bard-ID2` `tiefling-kadin-bard-ID3` `tiefling-kadin-bard-ID4` `tiefling-kadin-bard-ID5` `tiefling-kadin-bard-ID6` `tiefling-kadin-bard-ID7` `tiefling-kadin-bard-ID8` `tiefling-kadin-bard-ID9` `tiefling-kadin-cleric-GR` `tiefling-kadin-cleric-ID1` `tiefling-kadin-cleric-ID2` `tiefling-kadin-cleric-ID3` `tiefling-kadin-cleric-ID4` `tiefling-kadin-cleric-ID5` `tiefling-kadin-cleric-ID6` `tiefling-kadin-cleric-ID7` `tiefling-kadin-cleric-ID8` `tiefling-kadin-fighter-GR` `tiefling-kadin-fighter-ID5` `tiefling-kadin-paladin-GR` `tiefling-kadin-paladin-ID1` `tiefling-kadin-paladin-ID2` `tiefling-kadin-paladin-ID3` `tiefling-kadin-paladin-ID4` `tiefling-kadin-paladin-ID5` `tiefling-kadin-paladin-ID6` `tiefling-kadin-paladin-ID7` `tiefling-kadin-paladin-ID9` `tiefling-kadin-ranger-ID8` `tiefling-kadin-rogue-GR` `tiefling-kadin-rogue-ID10` `tiefling-kadin-rogue-ID2` `tiefling-kadin-rogue-ID4` `tiefling-kadin-rogue-ID9` `tiefling-kadin-sorcerer-GR` `tiefling-kadin-sorcerer-SC-4` `tiefling-kadin-sorcerer-SC-6` `tiefling-kadin-sorcerer-SC-8` `tiefling-kadin-sorcerer-SC-9` `tiefling-kadin-warlock-WL-11` `tiefling-kadin-warlock-WL-3` `tiefling-kadin-warlock-WL-4` `tiefling-kadin-warlock-WL-5` `tiefling-kadin-warlock-WL-8` `tiefling-kadin-warlock-WL-9` `tiefling-kadin-wizard-GR`

## Kare kenarı taraması (`python scripts/kesim-tepe-tara.py`, düzeltme sonrası)

Kare kenarına değen jetonlar (2 px şerit, alfa > 32). Yandan değenler Wizard WZ-B1/B7 efekti ve Gnome Cleric ID1 kanadı (kapsam dışı,
figürü küçültmeyi gerektirir); üstten değen 4 jetonda geri gelen tepe kenara ulaştı.

### Büyük jetonlar (256 px): 31 / 2876 jeton kenara değiyor

Kenar başına: üst 4, alt 0, sol 14, sağ 13.

| Irk | Sınıf | Alt sınıf | Jeton | Üst | Alt | Sol | Sağ |
|---|---|---|---|---:|---:|---:|---:|
| dwarf | cleric | ID9 | `dwarf-kadin-cleric-ID9` | 7 | 0 | 0 | 0 |
| dwarf | fighter | ID10 | `dwarf-kadin-fighter-ID10` | 33 | 0 | 0 | 0 |
| dwarf | wizard | WZ-B1 | `dwarf-erkek-wizard-WZ-B1` | 0 | 0 | 36 | 0 |
| dwarf | wizard | WZ-B1 | `dwarf-kadin-wizard-WZ-B1` | 0 | 0 | 38 | 0 |
| dwarf | wizard | WZ-B7 | `dwarf-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 7 |
| dwarf | wizard | WZ-B7 | `dwarf-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 14 |
| elf | wizard | WZ-B1 | `elf-erkek-wizard-WZ-B1` | 0 | 0 | 38 | 0 |
| elf | wizard | WZ-B1 | `elf-kadin-wizard-WZ-B1` | 0 | 0 | 40 | 0 |
| elf | wizard | WZ-B7 | `elf-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 6 |
| gnome | cleric | ID1 | `gnome-erkek-cleric-ID1` | 0 | 0 | 0 | 41 |
| gnome | wizard | WZ-B1 | `gnome-erkek-wizard-WZ-B1` | 0 | 0 | 38 | 0 |
| gnome | wizard | WZ-B1 | `gnome-kadin-wizard-WZ-B1` | 0 | 0 | 36 | 0 |
| gnome | wizard | WZ-B7 | `gnome-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 7 |
| gnome | wizard | WZ-B7 | `gnome-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 6 |
| goliath | cleric | ID7 | `goliath-erkek-cleric-ID7` | 72 | 0 | 0 | 0 |
| goliath | wizard | WZ-B1 | `goliath-erkek-wizard-WZ-B1` | 0 | 0 | 35 | 0 |
| goliath | wizard | WZ-B1 | `goliath-kadin-wizard-WZ-B1` | 0 | 0 | 37 | 0 |
| goliath | wizard | WZ-B7 | `goliath-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 7 |
| goliath | wizard | WZ-B7 | `goliath-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 7 |
| halfling | wizard | WZ-B1 | `halfling-erkek-wizard-WZ-B1` | 0 | 0 | 37 | 0 |
| halfling | wizard | WZ-B1 | `halfling-kadin-wizard-WZ-B1` | 0 | 0 | 32 | 0 |
| halfling | wizard | WZ-B7 | `halfling-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 14 |
| halfling | wizard | WZ-B7 | `halfling-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 6 |
| human | cleric | ID7 | `human-kadin-cleric-ID7` | 70 | 0 | 0 | 0 |
| human | wizard | WZ-B1 | `human-erkek-wizard-WZ-B1` | 0 | 0 | 38 | 0 |
| human | wizard | WZ-B1 | `human-kadin-wizard-WZ-B1` | 0 | 0 | 36 | 0 |
| human | wizard | WZ-B7 | `human-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 12 |
| human | wizard | WZ-B7 | `human-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 13 |
| orc | barbarian | ID8 | `orc-erkek-barbarian-ID8` | 0 | 0 | 47 | 0 |
| orc | wizard | WZ-B1 | `orc-kadin-wizard-WZ-B1` | 0 | 0 | 17 | 0 |
| orc | wizard | WZ-B7 | `orc-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 7 |

### Küçük kopyalar (96 px): 148 / 2876 jeton kenara değiyor

Kenar başına: üst 10, alt 87, sol 25, sağ 46.

| Irk | Sınıf | Alt sınıf | Jeton | Üst | Alt | Sol | Sağ |
|---|---|---|---|---:|---:|---:|---:|
| celestial | barbarian | ID8 | `celestial-erkek-barbarian-ID8` | 0 | 7 | 0 | 10 |
| celestial | monk | ID3 | `celestial-kadin-monk-ID3` | 5 | 0 | 0 | 0 |
| celestial | warlock | WL-6 | `celestial-erkek-warlock-WL-6` | 0 | 10 | 0 | 0 |
| celestial | wizard | WZ-B1 | `celestial-erkek-wizard-WZ-B1` | 0 | 0 | 7 | 0 |
| celestial | wizard | WZ-B7 | `celestial-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 3 |
| dragonborn | bard | GR | `dragonborn-kadin-bard-GR` | 0 | 9 | 0 | 0 |
| dragonborn | cleric | ID5 | `dragonborn-erkek-cleric-ID5` | 0 | 7 | 0 | 0 |
| dragonborn | cleric | ID7 | `dragonborn-erkek-cleric-ID7` | 0 | 8 | 0 | 0 |
| dragonborn | fighter | GR | `dragonborn-kadin-fighter-GR` | 0 | 4 | 0 | 0 |
| dragonborn | fighter | ID10 | `dragonborn-erkek-fighter-ID10` | 0 | 6 | 0 | 0 |
| dragonborn | fighter | ID11 | `dragonborn-erkek-fighter-ID11` | 0 | 10 | 0 | 0 |
| dragonborn | fighter | ID2 | `dragonborn-erkek-fighter-ID2` | 0 | 8 | 0 | 0 |
| dragonborn | monk | ID4 | `dragonborn-kadin-monk-ID4` | 0 | 26 | 0 | 0 |
| dragonborn | monk | ID6 | `dragonborn-kadin-monk-ID6` | 0 | 7 | 0 | 0 |
| dragonborn | paladin | GR | `dragonborn-kadin-paladin-GR` | 0 | 10 | 0 | 0 |
| dragonborn | ranger | ID1 | `dragonborn-erkek-ranger-ID1` | 0 | 9 | 0 | 0 |
| dragonborn | ranger | ID6 | `dragonborn-erkek-ranger-ID6` | 0 | 3 | 0 | 0 |
| dragonborn | rogue | ID3 | `dragonborn-kadin-rogue-ID3` | 0 | 10 | 0 | 0 |
| dragonborn | rogue | ID8 | `dragonborn-erkek-rogue-ID8` | 0 | 10 | 0 | 0 |
| dragonborn | warlock | GR | `dragonborn-erkek-warlock-GR` | 0 | 10 | 0 | 0 |
| dwarf | barbarian | ID9 | `dwarf-erkek-barbarian-ID9` | 0 | 0 | 4 | 0 |
| dwarf | cleric | ID9 | `dwarf-kadin-cleric-ID9` | 10 | 0 | 0 | 0 |
| dwarf | fighter | ID10 | `dwarf-kadin-fighter-ID10` | 12 | 0 | 0 | 0 |
| dwarf | sorcerer | SC-7 | `dwarf-kadin-sorcerer-SC-7` | 0 | 0 | 12 | 0 |
| dwarf | warlock | WL-2 | `dwarf-kadin-warlock-WL-2` | 0 | 9 | 0 | 0 |
| dwarf | warlock | WL-6 | `dwarf-erkek-warlock-WL-6` | 0 | 9 | 0 | 0 |
| dwarf | warlock | WL-6 | `dwarf-kadin-warlock-WL-6` | 0 | 10 | 0 | 0 |
| dwarf | wizard | WZ-B1 | `dwarf-erkek-wizard-WZ-B1` | 0 | 0 | 20 | 7 |
| dwarf | wizard | WZ-B1 | `dwarf-kadin-wizard-WZ-B1` | 0 | 0 | 22 | 7 |
| dwarf | wizard | WZ-B7 | `dwarf-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 11 |
| dwarf | wizard | WZ-B7 | `dwarf-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 10 |
| elf | barbarian | ID6 | `elf-erkek-barbarian-ID6` | 0 | 0 | 0 | 1 |
| elf | barbarian | ID8 | `elf-erkek-barbarian-ID8` | 0 | 0 | 14 | 14 |
| elf | bard | GR | `elf-erkek-bard-GR` | 0 | 10 | 0 | 0 |
| elf | cleric | GR | `elf-erkek-cleric-GR` | 0 | 9 | 0 | 0 |
| elf | cleric | GR | `elf-kadin-cleric-GR` | 0 | 1 | 0 | 0 |
| elf | cleric | ID4 | `elf-kadin-cleric-ID4` | 0 | 0 | 0 | 1 |
| elf | cleric | ID8 | `elf-erkek-cleric-ID8` | 0 | 7 | 0 | 0 |
| elf | cleric | ID8 | `elf-kadin-cleric-ID8` | 0 | 9 | 0 | 0 |
| elf | cleric | ID9 | `elf-erkek-cleric-ID9` | 4 | 0 | 0 | 0 |
| elf | cleric | ID9 | `elf-kadin-cleric-ID9` | 8 | 0 | 0 | 0 |
| elf | monk | GR | `elf-erkek-monk-GR` | 0 | 17 | 0 | 0 |
| elf | ranger | GR | `elf-kadin-ranger-GR` | 0 | 9 | 0 | 0 |
| elf | rogue | GR | `elf-erkek-rogue-GR` | 0 | 9 | 0 | 0 |
| elf | sorcerer | GR | `elf-erkek-sorcerer-GR` | 0 | 10 | 0 | 0 |
| elf | sorcerer | GR | `elf-kadin-sorcerer-GR` | 0 | 9 | 0 | 0 |
| elf | warlock | GR | `elf-erkek-warlock-GR` | 0 | 9 | 0 | 0 |
| elf | warlock | GR | `elf-kadin-warlock-GR` | 0 | 9 | 0 | 0 |
| elf | warlock | WL-2 | `elf-erkek-warlock-WL-2` | 0 | 9 | 0 | 0 |
| elf | warlock | WL-2 | `elf-kadin-warlock-WL-2` | 0 | 9 | 0 | 0 |
| elf | warlock | WL-5 | `elf-erkek-warlock-WL-5` | 0 | 9 | 0 | 0 |
| elf | warlock | WL-6 | `elf-erkek-warlock-WL-6` | 0 | 10 | 0 | 0 |
| elf | warlock | WL-6 | `elf-kadin-warlock-WL-6` | 0 | 10 | 0 | 0 |
| elf | wizard | WZ-B1 | `elf-erkek-wizard-WZ-B1` | 0 | 0 | 21 | 7 |
| elf | wizard | WZ-B1 | `elf-kadin-wizard-WZ-B1` | 0 | 0 | 22 | 8 |
| elf | wizard | WZ-B7 | `elf-erkek-wizard-WZ-B7` | 0 | 0 | 10 | 8 |
| elf | wizard | WZ-B7 | `elf-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 11 |
| gnome | barbarian | ID8 | `gnome-erkek-barbarian-ID8` | 0 | 0 | 3 | 0 |
| gnome | cleric | ID1 | `gnome-erkek-cleric-ID1` | 0 | 0 | 0 | 43 |
| gnome | cleric | ID5 | `gnome-erkek-cleric-ID5` | 0 | 0 | 9 | 8 |
| gnome | fighter | GR | `gnome-erkek-fighter-GR` | 0 | 11 | 0 | 0 |
| gnome | fighter | ID3 | `gnome-kadin-fighter-ID3` | 0 | 8 | 0 | 0 |
| gnome | monk | GR | `gnome-kadin-monk-GR` | 0 | 10 | 0 | 0 |
| gnome | paladin | GR | `gnome-erkek-paladin-GR` | 0 | 11 | 0 | 0 |
| gnome | paladin | GR | `gnome-kadin-paladin-GR` | 0 | 10 | 0 | 0 |
| gnome | ranger | GR | `gnome-erkek-ranger-GR` | 0 | 11 | 0 | 0 |
| gnome | warlock | WL-6 | `gnome-erkek-warlock-WL-6` | 0 | 10 | 0 | 0 |
| gnome | wizard | GR | `gnome-kadin-wizard-GR` | 0 | 9 | 0 | 0 |
| gnome | wizard | WZ-B1 | `gnome-erkek-wizard-WZ-B1` | 0 | 0 | 20 | 7 |
| gnome | wizard | WZ-B1 | `gnome-kadin-wizard-WZ-B1` | 0 | 0 | 21 | 7 |
| gnome | wizard | WZ-B7 | `gnome-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 10 |
| gnome | wizard | WZ-B7 | `gnome-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 10 |
| goliath | barbarian | GR | `goliath-kadin-barbarian-GR` | 0 | 10 | 0 | 0 |
| goliath | bard | GR | `goliath-kadin-bard-GR` | 0 | 10 | 0 | 0 |
| goliath | cleric | ID7 | `goliath-erkek-cleric-ID7` | 26 | 0 | 0 | 0 |
| goliath | cleric | ID9 | `goliath-erkek-cleric-ID9` | 3 | 0 | 0 | 0 |
| goliath | fighter | ID7 | `goliath-erkek-fighter-ID7` | 0 | 0 | 1 | 0 |
| goliath | paladin | GR | `goliath-kadin-paladin-GR` | 0 | 9 | 0 | 0 |
| goliath | rogue | ID6 | `goliath-kadin-rogue-ID6` | 0 | 0 | 0 | 1 |
| goliath | sorcerer | GR | `goliath-kadin-sorcerer-GR` | 0 | 8 | 0 | 0 |
| goliath | warlock | WL-2 | `goliath-erkek-warlock-WL-2` | 0 | 0 | 0 | 1 |
| goliath | warlock | WL-3 | `goliath-erkek-warlock-WL-3` | 0 | 0 | 0 | 5 |
| goliath | wizard | WZ-B1 | `goliath-erkek-wizard-WZ-B1` | 0 | 0 | 21 | 7 |
| goliath | wizard | WZ-B1 | `goliath-kadin-wizard-WZ-B1` | 0 | 0 | 22 | 7 |
| goliath | wizard | WZ-B7 | `goliath-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 12 |
| goliath | wizard | WZ-B7 | `goliath-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 10 |
| halfling | barbarian | GR | `halfling-kadin-barbarian-GR` | 0 | 10 | 0 | 0 |
| halfling | barbarian | ID8 | `halfling-erkek-barbarian-ID8` | 0 | 0 | 8 | 8 |
| halfling | cleric | GR | `halfling-kadin-cleric-GR` | 0 | 9 | 0 | 0 |
| halfling | paladin | GR | `halfling-erkek-paladin-GR` | 0 | 12 | 0 | 0 |
| halfling | ranger | GR | `halfling-erkek-ranger-GR` | 0 | 12 | 0 | 0 |
| halfling | ranger | GR | `halfling-kadin-ranger-GR` | 0 | 10 | 0 | 0 |
| halfling | sorcerer | SC-3 | `halfling-kadin-sorcerer-SC-3` | 0 | 24 | 0 | 0 |
| halfling | warlock | WL-2 | `halfling-erkek-warlock-WL-2` | 0 | 0 | 0 | 2 |
| halfling | warlock | WL-2 | `halfling-kadin-warlock-WL-2` | 0 | 0 | 0 | 1 |
| halfling | warlock | WL-3 | `halfling-erkek-warlock-WL-3` | 0 | 0 | 0 | 5 |
| halfling | wizard | WZ-A6 | `halfling-kadin-wizard-WZ-A6` | 0 | 0 | 1 | 0 |
| halfling | wizard | WZ-B1 | `halfling-erkek-wizard-WZ-B1` | 0 | 0 | 24 | 6 |
| halfling | wizard | WZ-B1 | `halfling-kadin-wizard-WZ-B1` | 0 | 0 | 18 | 7 |
| halfling | wizard | WZ-B7 | `halfling-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 12 |
| halfling | wizard | WZ-B7 | `halfling-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 10 |
| human | barbarian | GR | `human-kadin-barbarian-GR` | 0 | 8 | 0 | 0 |
| human | barbarian | ID8 | `human-kadin-barbarian-ID8` | 0 | 9 | 0 | 0 |
| human | bard | GR | `human-kadin-bard-GR` | 0 | 7 | 0 | 0 |
| human | cleric | GR | `human-kadin-cleric-GR` | 0 | 7 | 0 | 0 |
| human | cleric | ID1 | `human-erkek-cleric-ID1` | 0 | 0 | 0 | 9 |
| human | cleric | ID7 | `human-kadin-cleric-ID7` | 32 | 0 | 0 | 0 |
| human | cleric | ID8 | `human-erkek-cleric-ID8` | 0 | 8 | 0 | 0 |
| human | druid | GR | `human-erkek-druid-GR` | 0 | 8 | 0 | 0 |
| human | fighter | ID2 | `human-erkek-fighter-ID2` | 0 | 8 | 0 | 0 |
| human | fighter | ID6 | `human-erkek-fighter-ID6` | 0 | 9 | 0 | 0 |
| human | fighter | ID8 | `human-kadin-fighter-ID8` | 0 | 10 | 0 | 0 |
| human | ranger | GR | `human-erkek-ranger-GR` | 0 | 10 | 0 | 0 |
| human | sorcerer | SC-3 | `human-kadin-sorcerer-SC-3` | 0 | 28 | 0 | 0 |
| human | warlock | GR | `human-erkek-warlock-GR` | 0 | 9 | 0 | 0 |
| human | warlock | WL-2 | `human-kadin-warlock-WL-2` | 0 | 9 | 0 | 0 |
| human | warlock | WL-6 | `human-erkek-warlock-WL-6` | 0 | 9 | 0 | 0 |
| human | warlock | WL-6 | `human-kadin-warlock-WL-6` | 0 | 10 | 0 | 0 |
| human | warlock | WL-7 | `human-erkek-warlock-WL-7` | 0 | 8 | 0 | 0 |
| human | wizard | GR | `human-kadin-wizard-GR` | 0 | 6 | 0 | 0 |
| human | wizard | WZ-B1 | `human-erkek-wizard-WZ-B1` | 0 | 0 | 21 | 7 |
| human | wizard | WZ-B1 | `human-kadin-wizard-WZ-B1` | 0 | 0 | 20 | 7 |
| human | wizard | WZ-B7 | `human-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 10 |
| human | wizard | WZ-B7 | `human-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 11 |
| orc | barbarian | ID8 | `orc-erkek-barbarian-ID8` | 0 | 0 | 21 | 15 |
| orc | cleric | GR | `orc-kadin-cleric-GR` | 0 | 9 | 0 | 0 |
| orc | rogue | ID9 | `orc-erkek-rogue-ID9` | 0 | 0 | 0 | 2 |
| orc | warlock | WL-2 | `orc-kadin-warlock-WL-2` | 0 | 0 | 0 | 1 |
| orc | wizard | WZ-B1 | `orc-erkek-wizard-WZ-B1` | 0 | 0 | 8 | 16 |
| orc | wizard | WZ-B1 | `orc-kadin-wizard-WZ-B1` | 0 | 0 | 19 | 6 |
| orc | wizard | WZ-B7 | `orc-erkek-wizard-WZ-B7` | 0 | 0 | 0 | 7 |
| orc | wizard | WZ-B7 | `orc-kadin-wizard-WZ-B7` | 0 | 0 | 0 | 8 |
| tiefling | barbarian | ID8 | `tiefling-kadin-barbarian-ID8` | 0 | 7 | 0 | 0 |
| tiefling | bard | GR | `tiefling-erkek-bard-GR` | 0 | 9 | 0 | 0 |
| tiefling | bard | GR | `tiefling-kadin-bard-GR` | 0 | 6 | 0 | 0 |
| tiefling | cleric | GR | `tiefling-kadin-cleric-GR` | 0 | 7 | 0 | 0 |
| tiefling | cleric | ID8 | `tiefling-kadin-cleric-ID8` | 0 | 7 | 0 | 0 |
| tiefling | cleric | ID9 | `tiefling-kadin-cleric-ID9` | 1 | 0 | 0 | 0 |
| tiefling | fighter | GR | `tiefling-erkek-fighter-GR` | 0 | 10 | 0 | 0 |
| tiefling | fighter | GR | `tiefling-kadin-fighter-GR` | 0 | 15 | 0 | 0 |
| tiefling | paladin | GR | `tiefling-kadin-paladin-GR` | 0 | 6 | 0 | 0 |
| tiefling | ranger | GR | `tiefling-erkek-ranger-GR` | 0 | 9 | 0 | 0 |
| tiefling | ranger | ID9 | `tiefling-erkek-ranger-ID9` | 1 | 0 | 0 | 0 |
| tiefling | rogue | GR | `tiefling-kadin-rogue-GR` | 0 | 8 | 0 | 0 |
| tiefling | sorcerer | GR | `tiefling-kadin-sorcerer-GR` | 0 | 7 | 0 | 0 |
| tiefling | sorcerer | SC-3 | `tiefling-kadin-sorcerer-SC-3` | 0 | 22 | 0 | 0 |
| tiefling | warlock | WL-2 | `tiefling-erkek-warlock-WL-2` | 0 | 9 | 0 | 0 |
| tiefling | warlock | WL-6 | `tiefling-erkek-warlock-WL-6` | 0 | 9 | 0 | 0 |
