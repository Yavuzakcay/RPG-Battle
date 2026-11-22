# KESIM-DUZELT: şerit silme düzeltmesi ve yeniden kesim

Üretildi: `python scripts/kesim-yenile.py rapor` (2026-11-22). Görsel kanıtlar `gorsel-dokum/kesim-duzelt/` (git dışı): `uygula-<grup>-<n>.jpg`
(ham hücre | eski | yeni | fark: yeşil eklenen, kırmızı kaybolan), `regresyon-<n>.jpg`, `belirsiz-<n>.jpg`, `wzb2-dogrulama.jpg`. Eski jetonlar
`public/characters/_yedek-kesim-2026-11-22/` (git dışı). Kural ve ölçüm ayrıntısı DECISIONS.md "KESIM-DUZELT"; maskeler `harita/belgeler/KESIM-DUZELT-MASKE-LISTESI.md`.

Bütün jetonlarda düz yarık taraması (`python scripts/kesim-yarik-tara.py`, eşik 14 px; 2876 jeton): aday 275 → **192**, kopuk parçalı 106 → **61** (kalanların çoğu doğal boşluk; belirsizler ve kapsam dışılar değiştirilmedi).

## Yeniden kesilen jetonlar

Yazılan: **126** jeton (hata 0, öncelikten ezilmeyen 0).

| Grup | Jeton | Yerleşim | Sonuç |
|---|---:|---|---|
| a: kesim yarığı | 96 | eski | yarık ölçüsü (≥ 10 px) önce 96 → sonra 24; tuval kenarına değen 1; eklenen piksel ortanca 449 (en çok 1461) |
| b: yanlış oran (Gnome kadın / Halfling erkek Barbarian) | 18 | kardes, sayfa | yarık ölçüsü (≥ 10 px) önce 1 → sonra 3; tuval kenarına değen 0 |
| c: kesik şapka | 1 | sigdir | yarık ölçüsü (≥ 10 px) önce 0 → sonra 0; tuval kenarına değen 0 |
| d: düz kesik yan kanat/kalkan | 3 | eski, sigdir | yarık ölçüsü (≥ 10 px) önce 2 → sonra 2; tuval kenarına değen 0; eklenen piksel ortanca 401 (en çok 401) |
| e: eski Tiefling Druid kesimi | 8 | sayfa | yarık ölçüsü (≥ 10 px) önce 3 → sonra 1; tuval kenarına değen 0 |

Yarık ölçüsü `jeton-denetim.py` ile aynı (düz saydam yarık ≥ 10 px; doğal boşluklar da girer). Ölçünün sonra da bulduğu yarık: aynı yerde ve
yeni kesim hiç piksel eklemediyse kaynak ham çizim ya da renk anahtarıdır (şerit silme değil); başka yerde ve kısaysa belgelenen yarık
kapanmış, ölçü doğal bir boşluğu (bacak arası, kol-gövde, dokunaç arası) buluyor. Hepsine kontak sayfasında bakıldı.

| Jeton | Grup | Yerleşim | Kaynak | Yarık önce → sonra | Eklenen / fark | Not |
|---|---|---|---|---|---|---|
| `celestial-erkek-barbarian-GR` | a | eski | hale-gemini-sayfa-02.png h2 | 13 → 13 | +0 | aynı yer, piksel eklenmedi: ham çizim/anahtarlama |
| `celestial-erkek-barbarian-ID8` | a | eski | hale-gemini-duzeltme-sayfa-02.jpg h1 | 33 → 33 | +0 | aynı yer, piksel eklenmedi: ham çizim/anahtarlama |
| `celestial-erkek-cleric-ID8` | a | eski | clerik-male-celestial.jpg h8 | 14 → 0 | +344 |  |
| `celestial-erkek-warlock-WL-1` | a | eski | warlock-male-celestial.jpg h1 | 19 → 0 | +366 |  |
| `celestial-erkek-warlock-WL-2` | a | eski | warlock-male-celestial.jpg h2 | 20 → 0 | +485 |  |
| `celestial-erkek-warlock-WL-4` | a | eski | warlock-male-celestial.jpg h4 | 17 → 0 | +803 |  |
| `celestial-erkek-warlock-WL-6` | a | eski | warlock-male-celestial.jpg h6 | 16 → 0 | +269 |  |
| `celestial-female-wizard` | a | eski | hale-gemini-sayfa-31.png h2 | 26 → 26 | +0 | kuşak ham çizimde macenta (zemin anahtarıyla aynı renk): anahtarlama siler, şerit silmeyle ilgisiz |
| `celestial-kadin-barbarian-ID1` | a | eski | hale-gemini-sayfa-02.png h4 | 15 → 15 | +7 | doğal boşluk |
| `celestial-male-warlock` | a | eski | hale-gemini-sayfa-26.png h4 | 23 → 23 | +0 | aynı yer, piksel eklenmedi: ham çizim/anahtarlama |
| `celestial-male-wizard` | a | eski | hale-gemini-sayfa-29.png h3 | 26 → 26 | +0 | aynı yer, piksel eklenmedi: ham çizim/anahtarlama |
| `dragonborn-erkek-fighter-ID8` | a | eski | fighter-male-dragonborn.jpg h8 | 14 → 0 | +401 |  |
| `dragonborn-erkek-monk-ID9` | a | eski | monk-male-dragonborn.jpeg h9 | 24 → 0 | +375 |  |
| `dragonborn-erkek-rogue-ID7` | a | eski | rogue-male-dragonborn.jpg h7 | 121 → 0 | +1143 |  |
| `dragonborn-erkek-sorcerer-SC-5` | a | eski | sorcerer-male-dragonborn.jpg h5 | 84 → 0 | +433 |  |
| `dragonborn-erkek-warlock-WL-1` | a | eski | warlock-male-dragonborn.jpg h1 | 19 → 0 | +363 |  |
| `dragonborn-erkek-warlock-WL-2` | a | eski | warlock-male-dragonborn.jpg h2 | 20 → 0 | +225 |  |
| `dragonborn-erkek-warlock-WL-4` | a | eski | warlock-male-dragonborn.jpg h4 | 18 → 11 | +807 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `dragonborn-erkek-warlock-WL-6` | a | eski | warlock-male-dragonborn.jpg h6 | 17 → 0 | +152 |  |
| `dragonborn-kadin-bard-ID5` | a | eski | bard-female-dragonborn.jpg h5 | 18 → 18 | +58 | figür ile davul arası doğal boşluk |
| `dragonborn-kadin-bard-ID9` | a | eski | bard-female-dragonborn.jpg h9 | 26 → 12 | +268 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `dragonborn-kadin-druid-ID2` | a | eski | druid-female-dragonborn.jpg h2 | 25 → 11 | +162 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `dragonborn-kadin-fighter-GR` | a | eski | gariban-female-dragonborn.jpg h5 | 12 → 0 | +368 |  |
| `dragonborn-kadin-monk-GR` | a | eski | gariban-female-dragonborn.jpg h6 | 16 → 0 | +595 |  |
| `dragonborn-kadin-monk-ID8` | a | eski | monk-female-dragonborn.jpg h8 | 89 → 0 | +682 |  |
| `dragonborn-kadin-monk-ID9` | a | eski | monk-female-dragonborn.jpg h9 | 21 → 0 | +446 |  |
| `dragonborn-kadin-rogue-ID7` | a | eski | rogue-female-dragonborn.jpg h7 | 126 → 0 | +1461 |  |
| `dragonborn-kadin-warlock-WL-1` | a | eski | warlock-female-dragonborn.jpg h1 | 19 → 0 | +378 |  |
| `dragonborn-kadin-warlock-WL-2` | a | eski | warlock-female-dragonborn.jpg h2 | 22 → 0 | +330 |  |
| `dragonborn-kadin-warlock-WL-4` | a | eski | warlock-female-dragonborn.jpg h4 | 16 → 0 | +316 |  |
| `dwarf-erkek-barbarian-GR` | a | eski | gariban-male-dwarf.jpg h1 | 33 → 0 | +624 |  |
| `dwarf-erkek-druid-GR` | a | eski | gariban-male-dwarf.jpg h4 | 19 → 0 | +609 |  |
| `dwarf-erkek-monk-GR` | a | eski | gariban-male-dwarf.jpg h6 | 16 → 0 | +734 |  |
| `dwarf-erkek-sorcerer-GR` | a | eski | gariban-male-dwarf.jpg h10 | 22 → 0 | +644 |  |
| `dwarf-erkek-warlock-WL-4` | a | eski | warlock-male-dwarf.jpg h4 | 16 → 0 | +727 |  |
| `dwarf-kadin-barbarian-GR` | a | eski | gariban-female-dwarf.jpg h1 | 15 → 0 | +389 |  |
| `dwarf-kadin-barbarian-ID7` | a | eski | barbarian-female-dwarf.jpg h7 | 22 → 22 | +0 | aynı yer, piksel eklenmedi: ham çizim/anahtarlama |
| `dwarf-kadin-bard-GR` | a | eski | gariban-female-dwarf.jpg h2 | 19 → 0 | +536 |  |
| `dwarf-kadin-fighter-GR` | a | eski | gariban-female-dwarf.jpg h5 | 14 → 0 | +412 |  |
| `dwarf-kadin-monk-GR` | a | eski | gariban-female-dwarf.jpg h6 | 17 → 0 | +803 |  |
| `dwarf-kadin-warlock-WL-2` | a | eski | warlock-female-dwarf.jpg h2 | 21 → 0 | +331 |  |
| `dwarf-kadin-warlock-WL-6` | a | eski | warlock-female-dwarf.jpg h6 | 15 → 10 | +365 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `elf-erkek-barbarian-ID3` | a | eski | barbarian-male-elf.jpg h3 | 16 → 16 | +26 | doğal boşluk |
| `elf-erkek-fighter-GR` | a | eski | gariban-male-elf.jpg h5 | 14 → 0 | +849 |  |
| `elf-erkek-monk-GR` | a | eski | gariban-male-elf.jpg h6 | 18 → 11 | +741 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `elf-erkek-paladin-GR` | a | eski | gariban-male-elf.jpg h7 | 15 → 0 | +281 |  |
| `elf-erkek-warlock-WL-1` | a | eski | warlock-male-elf.jpg h1 | 19 → 0 | +430 |  |
| `elf-erkek-warlock-WL-2` | a | eski | warlock-male-elf.jpg h2 | 23 → 0 | +603 |  |
| `elf-erkek-warlock-WL-6` | a | eski | warlock-male-elf.jpg h6 | 14 → 10 | +507 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `elf-kadin-druid-ID7` | a | eski | druid-female-elf.jpg h7 | 24 → 24 | +0 | figür ile çizimdeki ince zemin çizgisi arası doğal boşluk |
| `elf-kadin-fighter-GR` | a | eski | gariban-female-elf.jpg h5 | 14 → 0 | +1189 |  |
| `elf-kadin-warlock-WL-2` | a | eski | warlock-female-elf.jpg h2 | 21 → 0 | +452 |  |
| `elf-kadin-warlock-WL-4` | a | eski | warlock-female-elf.jpg h4 | 14 → 10 | +825 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `elf-kadin-warlock-WL-6` | a | eski | warlock-female-elf.jpg h6 | 18 → 12 | +431 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `gnome-erkek-druid-GR` | a | eski | gariban-male-gnome.jpg h4 | 21 → 0 | +831 |  |
| `gnome-erkek-fighter-GR` | a | eski | gariban-male-gnome.jpg h5 | 43 → 0 | +771 |  |
| `gnome-erkek-warlock-WL-2` | a | eski | warlock-male-gnome.jpg h2 | 22 → 0 | +389 |  |
| `gnome-erkek-warlock-WL-6` | a | eski | warlock-male-gnome.jpg h6 | 16 → 0 | +367 |  |
| `gnome-erkek-warlock-WL-7` | a | eski | warlock-male-gnome.jpg h7 | 15 → 0 | +413 |  |
| `gnome-kadin-druid-GR` | a | eski | gariban-female-gnome.jpg h4 | 14 → 0 | +388 |  |
| `gnome-kadin-monk-GR` | a | eski | gariban-female-gnome.jpg h6 | 16 → 0 | +557 |  |
| `goliath-erkek-monk-GR` | a | eski | gariban-male-goliath.jpg h6 | 24 → 0 | +584 |  |
| `goliath-erkek-rogue-GR` | a | eski | gariban-male-goliath.jpg h9 | 22 → 0 | +538 |  |
| `goliath-kadin-bard-GR` | a | eski | gariban-female-goliath.jpg h2 | 18 → 0 | +398 |  |
| `goliath-kadin-druid-GR` | a | eski | gariban-female-goliath.jpg h4 | 16 → 0 | +653 |  |
| `goliath-kadin-monk-GR` | a | eski | gariban-female-goliath.jpg h6 | 17 → 0 | +620 |  |
| `halfling-erkek-barbarian-GR` | a | eski | gariban-male-halfling.jpg h1 | 16 → 0 | +383 |  |
| `halfling-erkek-bard-GR` | a | eski | gariban-male-halfling.jpg h2 | 19 → 0 | +545 |  |
| `halfling-erkek-druid-GR` | a | eski | gariban-male-halfling.jpg h4 | 13 → 11 | +293 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `halfling-erkek-fighter-GR` | a | eski | gariban-male-halfling.jpg h5 | 29 → 0 | +475 |  |
| `halfling-kadin-barbarian-GR` | a | eski | gariban-female-halfling.jpg h1 | 22 → 0 | +763 |  |
| `halfling-kadin-druid-GR` | a | eski | gariban-female-halfling.jpg h4 | 15 → 0 | +483 |  |
| `halfling-kadin-fighter-GR` | a | eski | gariban-female-halfling.jpg h5 | 22 → 0 | +689 |  |
| `halfling-kadin-monk-GR` | a | eski | gariban-female-halfling.jpg h6 | 22 → 0 | +392 |  |
| `human-erkek-barbarian-ID8` | a | eski | barbarian-male-aurasiz.jpg h1 | 15 → 0 | +603 |  |
| `human-erkek-druid-GR` | a | eski | gariban-male-human.jpg h4 | 23 → 12 | +1167 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `human-erkek-sorcerer-GR` | a | eski | gariban-male-human.jpg h10 | 19 → 0 | +499 |  |
| `human-erkek-warlock-WL-1` | a | eski | warlock-male-human.jpg h1 | 14 → 0 | +476 |  |
| `human-erkek-warlock-WL-2` | a | eski | warlock-male-human.jpg h2 | 21 → 0 | +696 |  |
| `human-erkek-warlock-WL-6` | a | eski | warlock-male-human.jpg h6 | 15 → 0 | +382 |  |
| `human-kadin-bard-ID5` | a | eski | bard-female-human.jpg h5 | 17 → 17 | +0 | figür ile davul arası doğal boşluk |
| `human-kadin-monk-GR` | a | eski | gariban-female-human.jpg h6 | 14 → 0 | +601 |  |
| `human-kadin-paladin-GR` | a | eski | gariban-female-human.jpg h7 | 13 → 0 | +544 |  |
| `human-kadin-warlock-WL-1` | a | eski | warlock-female-human.jpg h1 | 15 → 0 | +688 |  |
| `human-kadin-warlock-WL-2` | a | eski | warlock-female-human.jpg h2 | 21 → 0 | +610 |  |
| `human-kadin-warlock-WL-6` | a | eski | warlock-female-human.jpg h6 | 14 → 0 | +405 |  |
| `orc-erkek-bard-GR` | a | eski | gariban-male-orc.jpg h2 | 22 → 0 | +290 |  |
| `orc-erkek-monk-GR` | a | eski | gariban-male-orc.jpg h6 | 16 → 0 | +488 |  |
| `orc-erkek-sorcerer-GR` | a | eski | gariban-male-orc.jpg h10 | 19 → 0 | +545 |  |
| `orc-kadin-barbarian-GR` | a | eski | gariban-female-orc.jpg h1 | 18 → 12 | +722 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `orc-kadin-druid-GR` | a | eski | gariban-female-orc.jpg h4 | 16 → 0 | +627 |  |
| `tiefling-erkek-warlock-WL-1` | a | eski | warlock-male-tiefling.jpg h1 | 21 → 0 | +360 |  |
| `tiefling-erkek-warlock-WL-4` | a | eski | warlock-male-tiefling.jpg h4 | 21 → 10 | +519 | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `tiefling-kadin-monk-GR` | a | eski | gariban-female-tiefling.jpg h6 | 15 → 0 | +280 |  |
| `tiefling-kadin-warlock-WL-2` | a | eski | warlock-female-tiefling.jpg h2 | 14 → 0 | +461 |  |
| `tiefling-kadin-warlock-WL-6` | a | eski | warlock-female-tiefling.jpg h6 | 14 → 14 | +344 | doğal boşluk |
| `gnome-kadin-barbarian-ID1` | b | sayfa | barbarian-female-gnome.jpg h1 | 0 → 0 | +19958 / −1057 (yeniden yerleşim) |  |
| `gnome-kadin-barbarian-ID2` | b | sayfa | barbarian-female-gnome.jpg h2 | 0 → 0 | +14014 / −1177 (yeniden yerleşim) |  |
| `gnome-kadin-barbarian-ID3` | b | sayfa | barbarian-female-gnome.jpg h3 | 0 → 0 | +15489 / −1216 (yeniden yerleşim) |  |
| `gnome-kadin-barbarian-ID4` | b | sayfa | barbarian-female-gnome.jpg h4 | 10 → 11 | +22301 / −1115 (yeniden yerleşim) | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `gnome-kadin-barbarian-ID5` | b | sayfa | barbarian-female-gnome.jpg h5 | 0 → 0 | +17412 / −533 (yeniden yerleşim) |  |
| `gnome-kadin-barbarian-ID6` | b | sayfa | barbarian-female-gnome.jpg h6 | 0 → 0 | +15595 / −431 (yeniden yerleşim) |  |
| `gnome-kadin-barbarian-ID7` | b | sayfa | barbarian-female-gnome.jpg h7 | 0 → 0 | +18725 / −1438 (yeniden yerleşim) |  |
| `gnome-kadin-barbarian-ID9` | b | sayfa | barbarian-female-gnome.jpg h9 | 0 → 0 | +18206 / −1003 (yeniden yerleşim) |  |
| `halfling-erkek-barbarian-ID1` | b | sayfa | barbarian-male-halfling.jpg h1 | 0 → 0 | +21543 / −796 (yeniden yerleşim) |  |
| `halfling-erkek-barbarian-ID2` | b | sayfa | barbarian-male-halfling.jpg h2 | 0 → 11 | +15401 / −1014 (yeniden yerleşim) | doğal boşluk |
| `halfling-erkek-barbarian-ID3` | b | sayfa | barbarian-male-halfling.jpg h3 | 0 → 0 | +16730 / −1070 (yeniden yerleşim) |  |
| `halfling-erkek-barbarian-ID4` | b | sayfa | barbarian-male-halfling.jpg h4 | 0 → 0 | +20293 / −903 (yeniden yerleşim) |  |
| `halfling-erkek-barbarian-ID5` | b | sayfa | barbarian-male-halfling.jpg h5 | 0 → 0 | +18314 / −572 (yeniden yerleşim) |  |
| `halfling-erkek-barbarian-ID6` | b | sayfa | barbarian-male-halfling.jpg h6 | 0 → 0 | +16861 / −1433 (yeniden yerleşim) |  |
| `halfling-erkek-barbarian-ID7` | b | sayfa | barbarian-male-halfling.jpg h7 | 0 → 0 | +19949 / −1305 (yeniden yerleşim) |  |
| `halfling-erkek-barbarian-ID9` | b | sayfa | barbarian-male-halfling.jpg h9 | 0 → 0 | +17807 / −989 (yeniden yerleşim) |  |
| `celestial-kadin-sorcerer-SC-9` | c | sigdir | hale-gemini-sayfa-26.png h2 | 0 → 0 | +3906 / −8367 (yeniden yerleşim) |  |
| `gnome-kadin-cleric-ID1` | d | sigdir | cleric-female-gnome.jpg h1 | 11 → 12 | +415 / −352 (yeniden yerleşim) | sol kanat artık tuvalden taşmıyor; sağ kanat ham çizimde hücre sınırındaki ızgara çizgisine dek uzanıp orada biter (kaynak sınırı) |
| `tiefling-kadin-warlock-WL-7` | d | eski | warlock-female-tiefling.jpg h7 | 14 → 14 | +401 | doğal boşluk |
| `celestial-kadin-cleric-ID7` | d | sigdir | hale-gemini-sayfa-07.png h9 | 0 → 0 | +3306 / −3289 (yeniden yerleşim) |  |
| `tiefling-kadin-druid-ID1` | e | sayfa | druid-female-tiefling.jpg h1 | 0 → 0 | +2696 / −2468 (yeniden yerleşim) |  |
| `tiefling-kadin-druid-ID2` | e | sayfa | druid-female-tiefling.jpg h2 | 0 → 0 | +2429 / −2617 (yeniden yerleşim) |  |
| `tiefling-kadin-druid-ID3` | e | sayfa | druid-female-tiefling.jpg h3 | 0 → 0 | +646 / −690 (yeniden yerleşim) |  |
| `tiefling-kadin-druid-ID5` | e | sayfa | druid-female-tiefling.jpg h5 | 10 → 0 | +446 / −277 (yeniden yerleşim) |  |
| `tiefling-kadin-druid-ID6` | e | sayfa | druid-female-tiefling.jpg h6 | 0 → 0 | +1899 / −1683 (yeniden yerleşim) |  |
| `tiefling-kadin-druid-ID7` | e | sayfa | druid-female-tiefling.jpg h7 | 16 → 0 | +312 / −172 (yeniden yerleşim) |  |
| `tiefling-kadin-druid-ID8` | e | sayfa | druid-female-tiefling.jpg h8 | 0 → 0 | +4500 / −6340 (yeniden yerleşim) |  |
| `tiefling-erkek-druid-ID7` | e | sayfa | druid-male-tiefling.jpg h7 | 16 → 12 | +2392 / −2458 (yeniden yerleşim) | belgelenen yarık kapandı; ölçü başka yerde doğal boşluk buluyor |
| `gnome-kadin-barbarian-ID8` | b | kardes | barbarian-female-aurasiz.jpg h5 | 0 → 10 | +19445 / −1732 (yeniden yerleşim) | doğal boşluk |
| `halfling-erkek-barbarian-ID8` | b | kardes | barbarian-male-aurasiz.jpg h4 | 0 → 0 | +18531 / −1703 (yeniden yerleşim) |  |

## Kapsam dışı (yeniden kesilmedi)

| Jeton | Neden |
|---|---|
| `dragonborn-male-warlock` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `dwarf-female-warlock` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `dwarf-male-warlock` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `dwarf-male-wizard` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `elf-female-warlock` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `elf-male-warlock` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `gnome-male-warlock` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `halfling-female-warlock` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `halfling-male-warlock` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `human-male-warlock` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `orc-male-wizard` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `tiefling-female-warlock` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |
| `tiefling-male-wizard` | sınıf-genel eski jeton (5f34ed3a, ham sayfası yok) |

## WZ-B2 altıgen kalkan (bütün ırklar): kesim kusuru yok

Altıgen kalkanın sağ kenarı çizimde dikey ve düzdür (ham sayfada da öyle; koyu kahve konturu yerinde, ızgara çizgisine 35–60 px uzak). Jetonlar wizard-kesim.py ile kesildi (şerit silme yok); yeniden üretimi birebir (Human erkek: alfa farkı 0). Yeni hatla kesip kaydedince kalkanın sağ kenarına eklenecek piksel aşağıda: hepsinde 0, kesim kusuru yok, jetonlar değiştirilmedi. (Celestial ve Dragonborn satırlarındaki eklenebilir piksel kalkanda değil: Celestial’de bilerek silinmiş hale, Dragonborn’da eski trim_lines’ın şapka/ayak konturu.)

| Jeton | Eklenecek piksel | Kalkanın sağ kenarında |
|---|---:|---:|
| `celestial-erkek-wizard-WZ-B2` | 374 | 0 |
| `celestial-kadin-wizard-WZ-B2` | 452 | 0 |
| `dragonborn-erkek-wizard-WZ-B2` | 102 | 0 |
| `dragonborn-kadin-wizard-WZ-B2` | 138 | 0 |
| `dwarf-erkek-wizard-WZ-B2` | 0 | 0 |
| `dwarf-kadin-wizard-WZ-B2` | 0 | 0 |
| `elf-erkek-wizard-WZ-B2` | 0 | 0 |
| `elf-kadin-wizard-WZ-B2` | 0 | 0 |
| `gnome-erkek-wizard-WZ-B2` | 0 | 0 |
| `gnome-kadin-wizard-WZ-B2` | 0 | 0 |
| `goliath-erkek-wizard-WZ-B2` | 0 | 0 |
| `goliath-kadin-wizard-WZ-B2` | 0 | 0 |
| `halfling-erkek-wizard-WZ-B2` | 0 | 0 |
| `halfling-kadin-wizard-WZ-B2` | 0 | 0 |
| `human-erkek-wizard-WZ-B2` | 0 | 0 |
| `human-kadin-wizard-WZ-B2` | 0 | 0 |
| `orc-erkek-wizard-WZ-B2` | 0 | 0 |
| `orc-kadin-wizard-WZ-B2` | 4 | 0 |
| `tiefling-erkek-wizard-WZ-B2` | 0 | 0 |
| `tiefling-kadin-wizard-WZ-B2` | 0 | 0 |

## Regresyon: 200 sağlam jeton (yalnız ölçü, hiçbiri yazılmadı)

Defterden (`data/cc-kesim-kaynak.json`) JETON-DENETIM'de adı geçmeyen ve ham sayfası bulunan 271 jetondan rastgele 200 (tohum 20261122).
Her biri yeni hatla ham sayfadan kesildi, mevcut jetona alt piksel kaydedildi (Nelder–Mead) ve birleştirmesiz karşılaştırıldı; aynı kesim eski hatla
(`toplu-kesim.py` 18a311bc öncesi) da yapıldı. Kayıp/kazanç: ≥ 4 px bağlı, eski opak (≥ 128) → yeni saydam (< 32) çekirdek ve tersi.

- Ölçülen: 200; hata: 0. Kaynak: ucte-bir 87, govde 17, sayfa 57, duzeltme 13, figur 17, tek 1, izgara 8.
- **Eski hata göre figür pikseli kaybı: 0 jeton.** Kazanç (geri gelen kontur, ayak tabanı, asa, kanat kenarı): 74 jeton.
- Mevcut jetona göre kayıp: 23 jeton (ucte-bir 22, duzeltme 1); hepsinde eski hat da aynı pikselleri vermiyor: taban/düzeltme adımının `rescue`'su (git kaynağından geri konan iç kontur) ölçüye girmez. Uygulamada `eski` yerleşim eski pikselleri hiç silmez.
- Kayıt uyumu (IoU) en düşük: `tiefling-erkek-warlock-WL-3` 0.954, `gnome-erkek-warlock-WL-3` 0.9649, `celestial-erkek-warlock-WL-3` 0.969, `dwarf-kadin-warlock-WL-4` 0.9693, `elf-kadin-barbarian-ID8` 0.9708 (kazancı en büyük olanlar).

## Belirsiz yarık adayları (113; DEĞİŞTİRİLMEDİ, yalnız ölçü)

Yeni hatla kesilip eski jetona kaydedildi, yalnız geri gelen pikseller eklenerek yarık yeniden ölçüldü. yarık kapandı: 53, piksel eklendi, yarık aynı: 21, değişmedi: 18, yarık kısaldı: 11, kapsam dışı: 10.

Uyarı: Celestial jetonlarının bir kısmında hale bilerek silinmiştir (yıldız tacı oyunda çizilir); ham sayfada hale olduğundan yeni kesim onu
geri ekler. Bu adaylar "iyileşme" sayılmaz (Not sütunu); başka bir Celestial yeniden kesiminde de hale kaynağı denetlenmeli.

| Jeton | Sonuç | Eklenecek piksel | Yarık önce → sonra | Not |
|---|---|---:|---|---|
| `celestial-erkek-bard-GR` | değişmedi | 0 | 12 → 12 |  |
| `celestial-erkek-cleric-ID4` | piksel eklendi, yarık aynı | 196 | 14 → 14 |  |
| `celestial-erkek-cleric-ID6` | yarık kapandı | 1650 | 12 → 0 |  |
| `celestial-erkek-cleric-ID7` | yarık kapandı | 165 | 20 → 0 |  |
| `celestial-erkek-sorcerer-SC-9` | değişmedi | 0 | 11 → 11 |  |
| `celestial-kadin-cleric-ID3` | piksel eklendi, yarık aynı | 747 | 14 → 14 | yeni kesim jetonda bilerek silinmiş hale halkasını geri ekler: iyileşme değil |
| `celestial-kadin-fighter-GR` | piksel eklendi, yarık aynı | 1043 | 11 → 31 | yeni kesim bilerek silinmiş haleyi geri ekler (başın üstünde): iyileşme değil |
| `celestial-kadin-ranger-GR` | değişmedi | 0 | 12 → 12 |  |
| `celestial-kadin-rogue-ID9` | piksel eklendi, yarık aynı | 655 | 17 → 30 | yeni kesim bilerek silinmiş haleyi geri ekler (başın üstünde): iyileşme değil |
| `celestial-kadin-wizard-GR` | yarık kapandı | 317 | 15 → 0 |  |
| `celestial-male-bard` | değişmedi | 0 | 10 → 10 |  |
| `dragonborn-erkek-barbarian-ID9` | yarık kapandı | 139 | 12 → 0 |  |
| `dragonborn-erkek-bard-GR` | yarık kapandı | 391 | 13 → 0 |  |
| `dragonborn-erkek-bard-ID7` | yarık kısaldı | 531 | 13 → 11 |  |
| `dragonborn-erkek-fighter-ID2` | yarık kapandı | 437 | 11 → 0 |  |
| `dragonborn-erkek-fighter-ID3` | yarık kapandı | 665 | 14 → 0 |  |
| `dragonborn-erkek-paladin-GR` | yarık kapandı | 239 | 11 → 0 |  |
| `dragonborn-erkek-paladin-ID10` | yarık kapandı | 234 | 20 → 0 |  |
| `dragonborn-erkek-paladin-ID6` | yarık kapandı | 291 | 10 → 0 |  |
| `dragonborn-erkek-paladin-ID9` | yarık kapandı | 416 | 13 → 0 |  |
| `dragonborn-kadin-bard-GR` | yarık kapandı | 475 | 11 → 0 |  |
| `dragonborn-kadin-bard-ID6` | yarık kapandı | 492 | 14 → 0 |  |
| `dragonborn-kadin-cleric-ID6` | piksel eklendi, yarık aynı | 134 | 13 → 13 |  |
| `dragonborn-kadin-druid-ID8` | yarık kapandı | 248 | 14 → 0 |  |
| `dragonborn-kadin-fighter-ID10` | yarık kısaldı | 799 | 11 → 10 |  |
| `dragonborn-kadin-fighter-ID3` | yarık kapandı | 280 | 17 → 0 |  |
| `dragonborn-kadin-paladin-ID2` | yarık kısaldı | 182 | 18 → 13 |  |
| `dragonborn-kadin-ranger-ID4` | yarık kapandı | 351 | 11 → 0 |  |
| `dragonborn-kadin-ranger-ID5` | piksel eklendi, yarık aynı | 198 | 12 → 14 |  |
| `dragonborn-kadin-ranger-ID6` | yarık kısaldı | 108 | 14 → 11 |  |
| `dragonborn-kadin-rogue-ID10` | yarık kapandı | 496 | 13 → 0 |  |
| `dragonborn-kadin-sorcerer-SC-3` | yarık kısaldı | 430 | 15 → 13 |  |
| `dwarf-erkek-barbarian-ID4` | değişmedi | 0 | 11 → 11 |  |
| `dwarf-erkek-cleric-GR` | yarık kapandı | 490 | 14 → 0 |  |
| `dwarf-female-bard` | kapsam dışı (sınıf-genel eski jeton (5f34ed3a, ham sayfası yok)) | | | |
| `dwarf-kadin-barbarian-ID4` | piksel eklendi, yarık aynı | 15 | 12 → 12 |  |
| `dwarf-kadin-cleric-GR` | yarık kapandı | 393 | 12 → 0 |  |
| `dwarf-kadin-druid-GR` | yarık kapandı | 676 | 16 → 0 |  |
| `dwarf-kadin-paladin-GR` | yarık kapandı | 326 | 11 → 0 |  |
| `dwarf-kadin-warlock-GR` | yarık kapandı | 421 | 10 → 0 |  |
| `dwarf-kadin-warlock-WL-1` | yarık kapandı | 455 | 11 → 0 |  |
| `dwarf-kadin-warlock-WL-7` | yarık kısaldı | 491 | 16 → 14 |  |
| `dwarf-kadin-wizard-WZ-B5` | piksel eklendi, yarık aynı | 6 | 11 → 11 |  |
| `elf-erkek-bard-GR` | yarık kapandı | 463 | 13 → 0 |  |
| `elf-erkek-rogue-ID9` | piksel eklendi, yarık aynı | 156 | 14 → 14 |  |
| `elf-erkek-warlock-WL-4` | yarık kapandı | 617 | 15 → 0 |  |
| `elf-kadin-bard-GR` | yarık kapandı | 553 | 11 → 0 |  |
| `elf-kadin-monk-GR` | yarık kapandı | 370 | 16 → 0 |  |
| `elf-kadin-warlock-WL-3` | yarık kısaldı | 514 | 13 → 11 |  |
| `gnome-erkek-ranger-GR` | yarık kapandı | 432 | 17 → 0 |  |
| `gnome-female-bard` | kapsam dışı (sınıf-genel eski jeton (5f34ed3a, ham sayfası yok)) | | | |
| `gnome-female-paladin` | kapsam dışı (sınıf-genel eski jeton (5f34ed3a, ham sayfası yok)) | | | |
| `gnome-female-warlock` | kapsam dışı (sınıf-genel eski jeton (5f34ed3a, ham sayfası yok)) | | | |
| `gnome-kadin-bard-GR` | yarık kapandı | 456 | 11 → 0 |  |
| `gnome-kadin-fighter-ID9` | piksel eklendi, yarık aynı | 1221 | 11 → 15 |  |
| `gnome-kadin-paladin-GR` | yarık kısaldı | 465 | 13 → 11 |  |
| `gnome-kadin-sorcerer-GR` | yarık kapandı | 500 | 11 → 0 |  |
| `gnome-kadin-warlock-GR` | yarık kapandı | 417 | 11 → 0 |  |
| `gnome-kadin-wizard-WZ-B5` | piksel eklendi, yarık aynı | 9 | 15 → 15 |  |
| `goliath-erkek-cleric-GR` | yarık kapandı | 341 | 10 → 0 |  |
| `goliath-erkek-cleric-ID1` | değişmedi | 0 | 14 → 14 |  |
| `goliath-erkek-cleric-ID3` | değişmedi | 0 | 19 → 19 |  |
| `goliath-erkek-sorcerer-SC-9` | yarık kısaldı | 206 | 12 → 10 |  |
| `goliath-female-bard` | kapsam dışı (sınıf-genel eski jeton (5f34ed3a, ham sayfası yok)) | | | |
| `goliath-kadin-cleric-ID7` | piksel eklendi, yarık aynı | 3092 | 17 → 17 |  |
| `goliath-kadin-fighter-ID12` | değişmedi | 0 | 19 → 19 |  |
| `goliath-kadin-fighter-ID8` | yarık kapandı | 23 | 14 → 0 |  |
| `goliath-kadin-wizard-GR` | yarık kapandı | 624 | 14 → 0 |  |
| `goliath-male-warlock` | kapsam dışı (sınıf-genel eski jeton (5f34ed3a, ham sayfası yok)) | | | |
| `halfling-erkek-bard-ID6` | değişmedi | 0 | 15 → 15 |  |
| `halfling-erkek-druid-ID7` | değişmedi | 0 | 17 → 17 |  |
| `halfling-erkek-rogue-ID3` | piksel eklendi, yarık aynı | 257 | 10 → 10 |  |
| `halfling-female-bard` | kapsam dışı (sınıf-genel eski jeton (5f34ed3a, ham sayfası yok)) | | | |
| `halfling-kadin-bard-GR` | yarık kapandı | 366 | 16 → 0 |  |
| `halfling-kadin-bard-ID7` | piksel eklendi, yarık aynı | 95 | 16 → 16 |  |
| `halfling-kadin-cleric-ID8` | değişmedi | 0 | 12 → 12 |  |
| `halfling-kadin-sorcerer-GR` | yarık kapandı | 213 | 16 → 0 |  |
| `halfling-kadin-warlock-WL-4` | piksel eklendi, yarık aynı | 93 | 10 → 10 |  |
| `human-erkek-barbarian-ID6` | değişmedi | 0 | 13 → 13 |  |
| `human-erkek-fighter-ID3` | yarık kapandı | 418 | 16 → 0 |  |
| `human-erkek-fighter-ID8` | yarık kapandı | 365 | 14 → 0 |  |
| `human-erkek-paladin-GR` | yarık kapandı | 185 | 12 → 0 |  |
| `human-erkek-rogue-ID4` | piksel eklendi, yarık aynı | 39 | 10 → 10 |  |
| `human-erkek-warlock-WL-11` | piksel eklendi, yarık aynı | 430 | 14 → 14 |  |
| `human-erkek-warlock-WL-7` | yarık kapandı | 615 | 16 → 0 |  |
| `human-kadin-fighter-GR` | yarık kapandı | 879 | 11 → 0 |  |
| `human-kadin-fighter-ID6` | yarık kapandı | 228 | 13 → 0 |  |
| `human-kadin-fighter-ID7` | yarık kapandı | 354 | 13 → 0 |  |
| `human-kadin-monk-ID10` | yarık kapandı | 416 | 16 → 0 |  |
| `human-kadin-sorcerer-GR` | yarık kapandı | 689 | 12 → 0 |  |
| `human-kadin-warlock-GR` | yarık kapandı | 774 | 12 → 0 |  |
| `human-male-barbarian` | kapsam dışı (sınıf-genel eski jeton (5f34ed3a, ham sayfası yok)) | | | |
| `orc-erkek-barbarian-GR` | piksel eklendi, yarık aynı | 277 | 11 → 11 |  |
| `orc-erkek-bard-ID5` | değişmedi | 0 | 12 → 12 |  |
| `orc-erkek-fighter-ID10` | yarık kısaldı | 27 | 18 → 17 |  |
| `orc-erkek-fighter-ID2` | yarık kapandı | 492 | 11 → 0 |  |
| `orc-erkek-monk-ID4` | piksel eklendi, yarık aynı | 362 | 13 → 13 |  |
| `orc-erkek-rogue-ID4` | değişmedi | 0 | 10 → 10 |  |
| `orc-erkek-sorcerer-SC-9` | değişmedi | 0 | 25 → 25 |  |
| `orc-kadin-barbarian-ID4` | piksel eklendi, yarık aynı | 6 | 12 → 12 |  |
| `orc-kadin-cleric-ID4` | yarık kapandı | 137 | 11 → 0 |  |
| `orc-kadin-fighter-GR` | yarık kapandı | 801 | 11 → 0 |  |
| `orc-kadin-paladin-GR` | yarık kapandı | 678 | 13 → 0 |  |
| `orc-kadin-warlock-GR` | yarık kapandı | 293 | 17 → 0 |  |
| `orc-kadin-warlock-WL-3` | piksel eklendi, yarık aynı | 44 | 16 → 16 |  |
| `orc-kadin-warlock-WL-6` | değişmedi | 0 | 15 → 15 |  |
| `orc-male-warlock` | kapsam dışı (sınıf-genel eski jeton (5f34ed3a, ham sayfası yok)) | | | |
| `tiefling-erkek-cleric-ID4` | değişmedi | 0 | 25 → 25 |  |
| `tiefling-erkek-druid-ID7` | değişmedi | 0 | 16 → 16 |  |
| `tiefling-erkek-sorcerer-SC-9` | yarık kapandı | 118 | 15 → 0 |  |
| `tiefling-female-bard` | kapsam dışı (sınıf-genel eski jeton (5f34ed3a, ham sayfası yok)) | | | |
| `tiefling-kadin-bard-ID1` | yarık kapandı | 433 | 50 → 0 |  |
| `tiefling-kadin-ranger-ID5` | yarık kısaldı | 95 | 22 → 10 |  |
