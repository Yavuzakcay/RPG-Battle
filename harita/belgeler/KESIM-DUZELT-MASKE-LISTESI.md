# KESIM-DUZELT: maskesi eski kesime ait kalan jetonlar

Üretildi: `python scripts/kesim-yenile.py maske` (KESIM-DUZELT, 2026-11-22). Bu görevde maskeler **yeniden üretilmedi** (`npm run soy-maske`
tam çalıştırılmadı; ayrı görev). Aşağıdaki jetonların kesimi değişti; maske dosyaları eski kesimden.

- **tamamen eski** (yerleşim `sayfa`, `kardes`, `sigdir`: figürün ölçeği ya da konumu değişti): maske figürle hizalı değil; boyalı soyda
  ten yanlış yere düşer. Bu jetonlar için maske yeniden üretilmeli (ayrı görev: otomatik maske `npm run soy-maske -- <ırk>` ırk süzgeciyle;
  elle maske `assets/soy-maske-el/` kaynağı yeniden çizilir; Dragonborn pul `python scripts/dragonborn-pul-maske.py`).
- **kısmen eski** (yerleşim `eski`: eski jetona kayıt, yalnız kesim yarığında silinmiş pikseller geri eklendi; eski pikseller aynen):
  maske hizalı; yalnız eklenen pikseller (bilek, kabza, ayak tabanı, kontur, kanat kenarı) maskede yok. Eklenen pikselde ten varsa (bilek,
  el) boyalı soyda o pikseller boyanmaz; maske yenilenince düzelir.

Toplam yeniden kesilen: 126; maskesi olan: 79 (tamamen eski 18, kısmen eski 61); maske dosyası olmayan (soy filtresi ya da boyasız ırk): 47.

| Jeton | Grup | Yerleşim | Maske dosyaları | Durum |
|---|---|---|---|---|
| `dragonborn-erkek-fighter-ID8` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 401 px maskesiz |
| `dragonborn-erkek-monk-ID9` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 375 px maskesiz |
| `dragonborn-erkek-rogue-ID7` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 1143 px maskesiz |
| `dragonborn-erkek-sorcerer-SC-5` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 433 px maskesiz |
| `dragonborn-erkek-warlock-WL-1` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 363 px maskesiz |
| `dragonborn-erkek-warlock-WL-2` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 225 px maskesiz |
| `dragonborn-erkek-warlock-WL-4` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 807 px maskesiz |
| `dragonborn-erkek-warlock-WL-6` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 152 px maskesiz |
| `dragonborn-kadin-bard-ID5` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 58 px maskesiz |
| `dragonborn-kadin-bard-ID9` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 268 px maskesiz |
| `dragonborn-kadin-druid-ID2` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 162 px maskesiz |
| `dragonborn-kadin-fighter-GR` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 368 px maskesiz |
| `dragonborn-kadin-monk-GR` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 595 px maskesiz |
| `dragonborn-kadin-monk-ID8` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 682 px maskesiz |
| `dragonborn-kadin-monk-ID9` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 446 px maskesiz |
| `dragonborn-kadin-rogue-ID7` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 1461 px maskesiz |
| `dragonborn-kadin-warlock-WL-1` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 378 px maskesiz |
| `dragonborn-kadin-warlock-WL-2` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 330 px maskesiz |
| `dragonborn-kadin-warlock-WL-4` | a | eski | maske-pul | kısmen eski: maske hizalı, eklenen 316 px maskesiz |
| `elf-erkek-barbarian-ID3` | a | eski | maske | kısmen eski: maske hizalı, eklenen 26 px maskesiz |
| `elf-erkek-fighter-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 849 px maskesiz |
| `elf-erkek-monk-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 741 px maskesiz |
| `elf-erkek-paladin-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 281 px maskesiz |
| `elf-erkek-warlock-WL-1` | a | eski | maske | kısmen eski: maske hizalı, eklenen 430 px maskesiz |
| `elf-erkek-warlock-WL-2` | a | eski | maske | kısmen eski: maske hizalı, eklenen 603 px maskesiz |
| `elf-erkek-warlock-WL-6` | a | eski | maske | kısmen eski: maske hizalı, eklenen 507 px maskesiz |
| `elf-kadin-druid-ID7` | a | eski | maske | kısmen eski: maske hizalı, eklenen 0 px maskesiz |
| `elf-kadin-fighter-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 1189 px maskesiz |
| `elf-kadin-warlock-WL-2` | a | eski | maske | kısmen eski: maske hizalı, eklenen 452 px maskesiz |
| `elf-kadin-warlock-WL-4` | a | eski | maske | kısmen eski: maske hizalı, eklenen 825 px maskesiz |
| `elf-kadin-warlock-WL-6` | a | eski | maske | kısmen eski: maske hizalı, eklenen 431 px maskesiz |
| `gnome-erkek-druid-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 831 px maskesiz |
| `gnome-erkek-fighter-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 771 px maskesiz |
| `gnome-erkek-warlock-WL-2` | a | eski | maske | kısmen eski: maske hizalı, eklenen 389 px maskesiz |
| `gnome-erkek-warlock-WL-6` | a | eski | maske | kısmen eski: maske hizalı, eklenen 367 px maskesiz |
| `gnome-erkek-warlock-WL-7` | a | eski | maske | kısmen eski: maske hizalı, eklenen 413 px maskesiz |
| `gnome-kadin-druid-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 388 px maskesiz |
| `gnome-kadin-monk-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 557 px maskesiz |
| `goliath-erkek-monk-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 584 px maskesiz |
| `goliath-erkek-rogue-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 538 px maskesiz |
| `goliath-kadin-bard-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 398 px maskesiz |
| `goliath-kadin-druid-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 653 px maskesiz |
| `goliath-kadin-monk-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 620 px maskesiz |
| `human-erkek-barbarian-ID8` | a | eski | maske | kısmen eski: maske hizalı, eklenen 603 px maskesiz |
| `human-erkek-druid-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 1167 px maskesiz |
| `human-erkek-sorcerer-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 499 px maskesiz |
| `human-erkek-warlock-WL-1` | a | eski | maske | kısmen eski: maske hizalı, eklenen 476 px maskesiz |
| `human-erkek-warlock-WL-2` | a | eski | maske | kısmen eski: maske hizalı, eklenen 696 px maskesiz |
| `human-erkek-warlock-WL-6` | a | eski | maske | kısmen eski: maske hizalı, eklenen 382 px maskesiz |
| `human-kadin-bard-ID5` | a | eski | maske | kısmen eski: maske hizalı, eklenen 0 px maskesiz |
| `human-kadin-monk-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 601 px maskesiz |
| `human-kadin-paladin-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 544 px maskesiz |
| `human-kadin-warlock-WL-1` | a | eski | maske | kısmen eski: maske hizalı, eklenen 688 px maskesiz |
| `human-kadin-warlock-WL-2` | a | eski | maske | kısmen eski: maske hizalı, eklenen 610 px maskesiz |
| `human-kadin-warlock-WL-6` | a | eski | maske | kısmen eski: maske hizalı, eklenen 405 px maskesiz |
| `tiefling-erkek-warlock-WL-1` | a | eski | maske | kısmen eski: maske hizalı, eklenen 360 px maskesiz |
| `tiefling-erkek-warlock-WL-4` | a | eski | maske | kısmen eski: maske hizalı, eklenen 519 px maskesiz |
| `tiefling-kadin-monk-GR` | a | eski | maske | kısmen eski: maske hizalı, eklenen 280 px maskesiz |
| `tiefling-kadin-warlock-WL-2` | a | eski | maske | kısmen eski: maske hizalı, eklenen 461 px maskesiz |
| `tiefling-kadin-warlock-WL-6` | a | eski | maske | kısmen eski: maske hizalı, eklenen 344 px maskesiz |
| `gnome-kadin-barbarian-ID1` | b | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `gnome-kadin-barbarian-ID2` | b | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `gnome-kadin-barbarian-ID3` | b | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `gnome-kadin-barbarian-ID4` | b | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `gnome-kadin-barbarian-ID5` | b | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `gnome-kadin-barbarian-ID6` | b | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `gnome-kadin-barbarian-ID7` | b | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `gnome-kadin-barbarian-ID9` | b | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `gnome-kadin-barbarian-ID8` | b | kardes | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `gnome-kadin-cleric-ID1` | d | sigdir | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `tiefling-kadin-warlock-WL-7` | d | eski | maske | kısmen eski: maske hizalı, eklenen 401 px maskesiz |
| `tiefling-kadin-druid-ID1` | e | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `tiefling-kadin-druid-ID2` | e | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `tiefling-kadin-druid-ID3` | e | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `tiefling-kadin-druid-ID5` | e | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `tiefling-kadin-druid-ID6` | e | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `tiefling-kadin-druid-ID7` | e | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `tiefling-kadin-druid-ID8` | e | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |
| `tiefling-erkek-druid-ID7` | e | sayfa | maske | tamamen eski: yerleşim/ölçek değişti, maske kaymış |

Maske dosyası olmayanlar (değişiklik gerekmez): `celestial-erkek-barbarian-GR`, `celestial-erkek-barbarian-ID8`, `celestial-erkek-cleric-ID8`, `celestial-erkek-warlock-WL-1`, `celestial-erkek-warlock-WL-2`, `celestial-erkek-warlock-WL-4`, `celestial-erkek-warlock-WL-6`, `celestial-female-wizard`, `celestial-kadin-barbarian-ID1`, `celestial-male-warlock`, `celestial-male-wizard`, `dwarf-erkek-barbarian-GR`, `dwarf-erkek-druid-GR`, `dwarf-erkek-monk-GR`, `dwarf-erkek-sorcerer-GR`, `dwarf-erkek-warlock-WL-4`, `dwarf-kadin-barbarian-GR`, `dwarf-kadin-barbarian-ID7`, `dwarf-kadin-bard-GR`, `dwarf-kadin-fighter-GR`, `dwarf-kadin-monk-GR`, `dwarf-kadin-warlock-WL-2`, `dwarf-kadin-warlock-WL-6`, `halfling-erkek-barbarian-GR`, `halfling-erkek-bard-GR`, `halfling-erkek-druid-GR`, `halfling-erkek-fighter-GR`, `halfling-kadin-barbarian-GR`, `halfling-kadin-druid-GR`, `halfling-kadin-fighter-GR`, `halfling-kadin-monk-GR`, `orc-erkek-bard-GR`, `orc-erkek-monk-GR`, `orc-erkek-sorcerer-GR`, `orc-kadin-barbarian-GR`, `orc-kadin-druid-GR`, `halfling-erkek-barbarian-ID1`, `halfling-erkek-barbarian-ID2`, `halfling-erkek-barbarian-ID3`, `halfling-erkek-barbarian-ID4`, `halfling-erkek-barbarian-ID5`, `halfling-erkek-barbarian-ID6`, `halfling-erkek-barbarian-ID7`, `halfling-erkek-barbarian-ID9`, `halfling-erkek-barbarian-ID8`, `celestial-kadin-sorcerer-SC-9`, `celestial-kadin-cleric-ID7`

Kanat kökü (`data/dragonborn-kanat-kok.json`) ve soy ölçümleri (`data/soy-olcum.json`, `data/soy-maske-rapor.json`) de jeton dosyasından
üretilir; `eski` yerleşimde siluet değişmediği için kök geçerli, öteki yerleşimlerde ilgili üretici yeniden çalıştırılmalı (bu görevde çalıştırılmadı).
