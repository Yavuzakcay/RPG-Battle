# Kesim yarığı taraması

Üretildi: `python scripts/kesim-yarik-tara.py` (eşik 14 px). **Yalnız rapor**; jeton değiştirilmedi.

Aranan kusur: toplu kesimin `drop_lines` adımı (`scripts/toplu-kesim.py`) ince yatay/dikey figür parçalarını (kabza, bilek, manşet) ızgara çizgisi sanıp siliyor; figürün içinde düz, ince saydam yarık ve çoğu zaman yanında kopuk küçük parça kalıyor (örnek `human-erkek-fighter-GR`). Ölçü: figürün içinde 1–6 px kalın saydam bölüm (iki ucu opak); ardışık sütunlarda üst ve alt kenarı aynı satırda (± 1 px), koşu uzunluğu ≥ eşik. Kopuk parça: gövdeye 4 px yakın ama ayrık 15–600 px bileşen. Doğal boşluklar da yakalanabilir: karar görselle.

Taranan: 2876 jeton (`public/characters/*.webp`, küçük kopyalar hariç); aday: **192**; kopuk parçalı aday: **61**.

Görsel: `gorsel-dokum/kesim-yarik/en-yuksek.png` (en yüksek 60).

| Jeton | Yön | Yarık (px) | Kopuk parça |
|---|---|---:|---:|
| `halfling-kadin-sorcerer-SC-3` | yatay | 67 | 1 |
| `tiefling-kadin-bard-ID1` | yatay | 50 | 1 |
| `celestial-erkek-barbarian-ID8` | yatay | 33 | 2 |
| `elf-female-warlock` | dikey | 32 | 2 |
| `elf-male-warlock` | dikey | 32 | 3 |
| `dragonborn-kadin-druid-ID4` | dikey | 29 | 3 |
| `halfling-male-warlock` | dikey | 28 | 1 |
| `elf-kadin-druid-ID7` | yatay | 24 | 2 |
| `tiefling-kadin-druid-GR` | dikey | 24 | 3 |
| `celestial-male-warlock` | dikey | 23 | 4 |
| `human-erkek-wizard-WZ-A5` | dikey | 20 | 3 |
| `dragonborn-kadin-paladin-ID10` | dikey | 19 | 1 |
| `dwarf-male-warlock` | yatay | 19 | 2 |
| `gnome-male-warlock` | dikey | 19 | 2 |
| `human-male-warlock` | dikey | 19 | 2 |
| `dragonborn-kadin-paladin-ID2` | dikey | 18 | 1 |
| `goliath-erkek-sorcerer-SC-3` | dikey | 18 | 3 |
| `halfling-female-warlock` | dikey | 18 | 1 |
| `human-erkek-druid-ID7` | dikey | 18 | 1 |
| `dragonborn-kadin-fighter-ID3` | dikey | 17 | 1 |
| `gnome-erkek-ranger-GR` | dikey | 17 | 1 |
| `goliath-erkek-druid-ID7` | dikey | 17 | 1 |
| `goliath-kadin-cleric-ID7` | dikey | 17 | 1 |
| `halfling-erkek-druid-ID7` | dikey | 17 | 2 |
| `orc-kadin-warlock-GR` | dikey | 17 | 1 |
| `dragonborn-kadin-fighter-ID8` | dikey | 16 | 3 |
| `dwarf-kadin-druid-GR` | dikey | 16 | 2 |
| `elf-erkek-barbarian-ID3` | yatay | 16 | 2 |
| `elf-kadin-monk-GR` | dikey | 16 | 1 |
| `halfling-kadin-sorcerer-GR` | yatay | 16 | 1 |
| `human-kadin-monk-ID10` | yatay | 16 | 4 |
| `orc-kadin-cleric-ID6` | dikey | 16 | 2 |
| `orc-kadin-wizard-WZ-A5` | dikey | 16 | 1 |
| `tiefling-kadin-wizard-WZ-A1` | dikey | 16 | 1 |
| `celestial-kadin-wizard-WZ-A5` | dikey | 15 | 1 |
| `dragonborn-kadin-paladin-GR` | dikey | 15 | 1 |
| `dragonborn-kadin-sorcerer-SC-3` | yatay | 15 | 4 |
| `elf-erkek-warlock-WL-4` | dikey | 15 | 3 |
| `gnome-female-warlock` | dikey | 15 | 2 |
| `gnome-kadin-wizard-WZ-B5` | yatay | 15 | 1 |
| `goliath-kadin-druid-ID7` | dikey | 15 | 1 |
| `orc-kadin-warlock-WL-8` | dikey | 15 | 1 |
| `tiefling-kadin-warlock-WL-1` | dikey | 15 | 1 |
| `celestial-erkek-cleric-ID4` | dikey | 14 | 1 |
| `celestial-erkek-druid-ID7` | dikey | 14 | 2 |
| `celestial-kadin-cleric-ID3` | yatay | 14 | 1 |
| `dragonborn-erkek-fighter-ID3` | dikey | 14 | 1 |
| `dragonborn-erkek-sorcerer-SC-1` | dikey | 14 | 1 |
| `dragonborn-erkek-sorcerer-SC-3` | yatay | 14 | 1 |
| `dragonborn-erkek-warlock-WL-3` | dikey | 14 | 1 |
| `dragonborn-kadin-druid-ID8` | yatay | 14 | 1 |
| `dragonborn-kadin-ranger-ID6` | yatay | 14 | 1 |
| `elf-erkek-barbarian-ID1` | dikey | 14 | 1 |
| `gnome-erkek-wizard-WZ-A5` | dikey | 14 | 3 |
| `gnome-female-cleric` | yatay | 14 | 1 |
| `human-erkek-fighter-ID8` | yatay | 14 | 1 |
| `human-erkek-warlock-WL-3` | dikey | 14 | 2 |
| `tiefling-erkek-warlock-GR` | dikey | 14 | 1 |
| `tiefling-erkek-warlock-WL-11` | dikey | 14 | 1 |
| `tiefling-erkek-warlock-WL-6` | dikey | 14 | 2 |
| `tiefling-kadin-rogue-GR` | dikey | 14 | 1 |
| `dwarf-erkek-sorcerer-SC-3` | yatay | 56 | 0 |
| `celestial-kadin-sorcerer-SC-3` | yatay | 43 | 0 |
| `tiefling-male-wizard` | dikey | 40 | 0 |
| `halfling-erkek-sorcerer-SC-3` | yatay | 37 | 0 |
| `orc-male-wizard` | yatay | 27 | 0 |
| `celestial-female-wizard` | yatay | 26 | 0 |
| `celestial-male-wizard` | yatay | 26 | 0 |
| `dwarf-erkek-druid-ID7` | dikey | 26 | 0 |
| `halfling-erkek-fighter-ID10` | dikey | 26 | 0 |
| `orc-erkek-fighter-ID3` | dikey | 26 | 0 |
| `orc-erkek-sorcerer-SC-6` | yatay | 26 | 0 |
| `orc-erkek-sorcerer-SC-9` | dikey | 25 | 0 |
| `tiefling-erkek-cleric-ID4` | dikey | 25 | 0 |
| `celestial-erkek-sorcerer-SC-3` | yatay | 23 | 0 |
| `dwarf-kadin-fighter-ID10` | dikey | 23 | 0 |
| `dwarf-erkek-fighter-ID9` | dikey | 22 | 0 |
| `dwarf-erkek-wizard-WZ-A5` | dikey | 22 | 0 |
| `dwarf-female-warlock` | dikey | 22 | 0 |
| `dwarf-kadin-barbarian-ID7` | dikey | 22 | 0 |
| `tiefling-kadin-ranger-ID5` | dikey | 22 | 0 |
| `dwarf-erkek-fighter-ID11` | dikey | 21 | 0 |
| `human-kadin-rogue-ID4` | dikey | 21 | 0 |
| `orc-erkek-druid-ID7` | dikey | 21 | 0 |
| `celestial-erkek-cleric-ID7` | dikey | 20 | 0 |
| `celestial-kadin-cleric-ID1` | dikey | 20 | 0 |
| `dragonborn-erkek-paladin-ID10` | yatay | 20 | 0 |
| `dwarf-erkek-sorcerer-SC-6` | dikey | 20 | 0 |
| `dwarf-kadin-sorcerer-SC-6` | yatay | 20 | 0 |
| `human-erkek-sorcerer-SC-3` | yatay | 20 | 0 |
| `orc-kadin-fighter-ID9` | yatay | 20 | 0 |
| `tiefling-kadin-sorcerer-SC-3` | yatay | 20 | 0 |
| `dwarf-male-wizard` | dikey | 19 | 0 |
| `elf-erkek-sorcerer-SC-9` | dikey | 19 | 0 |
| `gnome-kadin-sorcerer-SC-4` | yatay | 19 | 0 |
| `goliath-erkek-cleric-ID3` | dikey | 19 | 0 |
| `goliath-kadin-fighter-ID12` | dikey | 19 | 0 |
| `celestial-kadin-warlock-WL-8` | dikey | 18 | 0 |
| `dragonborn-erkek-druid-ID7` | dikey | 18 | 0 |
| `dragonborn-kadin-bard-ID5` | yatay | 18 | 0 |
| `dwarf-kadin-sorcerer-SC-3` | yatay | 18 | 0 |
| `human-erkek-druid-ID4` | dikey | 18 | 0 |
| `orc-erkek-fighter-ID10` | dikey | 18 | 0 |
| `tiefling-female-warlock` | dikey | 18 | 0 |
| `celestial-kadin-rogue-ID9` | dikey | 17 | 0 |
| `dragonborn-erkek-rogue-ID9` | dikey | 17 | 0 |
| `elf-kadin-fighter-ID12` | dikey | 17 | 0 |
| `gnome-erkek-druid-ID6` | dikey | 17 | 0 |
| `halfling-kadin-cleric-ID1` | dikey | 17 | 0 |
| `halfling-kadin-druid-ID7` | dikey | 17 | 0 |
| `human-kadin-bard-ID5` | yatay | 17 | 0 |
| `human-male-barbarian` | dikey | 17 | 0 |
| `tiefling-kadin-paladin-GR` | dikey | 17 | 0 |
| `dragonborn-erkek-paladin-ID8` | dikey | 16 | 0 |
| `dwarf-kadin-warlock-WL-7` | dikey | 16 | 0 |
| `dwarf-kadin-warlock-WL-8` | dikey | 16 | 0 |
| `elf-erkek-druid-ID7` | yatay | 16 | 0 |
| `gnome-erkek-rogue-ID8` | dikey | 16 | 0 |
| `goliath-kadin-monk-ID7` | dikey | 16 | 0 |
| `halfling-erkek-bard-ID9` | dikey | 16 | 0 |
| … | | | (+72; `--hepsi`) |
