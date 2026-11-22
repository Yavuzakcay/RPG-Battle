# Kesim yarığı taraması

Üretildi: `python scripts/kesim-yarik-tara.py` (eşik 10 px). **Yalnız rapor**; jeton değiştirilmedi.

Aranan kusur: toplu kesimin `drop_lines` adımı (`scripts/toplu-kesim.py`) ince yatay/dikey figür parçalarını (kabza, bilek, manşet) ızgara çizgisi sanıp siliyor; figürün içinde düz, ince saydam yarık ve çoğu zaman yanında kopuk küçük parça kalıyor (örnek `human-erkek-fighter-GR`). Ölçü: figürün içinde 1–6 px kalın saydam bölüm (iki ucu opak); ardışık sütunlarda üst ve alt kenarı aynı satırda (± 1 px), koşu uzunluğu ≥ eşik. Kopuk parça: gövdeye 4 px yakın ama ayrık 15–600 px bileşen. Doğal boşluklar da yakalanabilir: karar görselle.

Taranan: 2900 jeton (`public/characters/*.webp`, küçük kopyalar hariç); aday: **729**; kopuk parçalı aday: **223**.

Görsel: `gorsel-dokum/kesim-yarik/en-yuksek.png` (en yüksek 60).

| Jeton | Yön | Yarık (px) | Kopuk parça |
|---|---|---:|---:|
| `dragonborn-kadin-rogue-ID7` | yatay | 126 | 1 |
| `dragonborn-erkek-rogue-ID7` | yatay | 121 | 1 |
| `dragonborn-kadin-monk-ID8` | yatay | 89 | 1 |
| `halfling-kadin-sorcerer-SC-3` | yatay | 67 | 1 |
| `tiefling-kadin-bard-ID1` | yatay | 50 | 1 |
| `celestial-erkek-barbarian-ID8` | yatay | 33 | 2 |
| `elf-female-warlock` | dikey | 32 | 2 |
| `elf-male-warlock` | dikey | 32 | 3 |
| `dragonborn-kadin-druid-ID4` | dikey | 29 | 3 |
| `halfling-male-warlock` | dikey | 28 | 1 |
| `dragonborn-kadin-druid-ID2` | yatay | 25 | 3 |
| `elf-kadin-druid-ID7` | yatay | 24 | 2 |
| `tiefling-kadin-druid-GR` | dikey | 24 | 3 |
| `celestial-male-warlock` | dikey | 23 | 4 |
| `elf-erkek-warlock-WL-2` | yatay | 23 | 1 |
| `dragonborn-kadin-warlock-WL-2` | yatay | 22 | 1 |
| `gnome-erkek-warlock-WL-2` | yatay | 22 | 1 |
| `goliath-erkek-rogue-GR` | yatay | 22 | 1 |
| `halfling-kadin-barbarian-GR` | yatay | 22 | 1 |
| `halfling-kadin-fighter-GR` | dikey | 22 | 1 |
| `halfling-kadin-monk-GR` | yatay | 22 | 1 |
| `dragonborn-kadin-monk-ID9` | yatay | 21 | 3 |
| `dwarf-kadin-warlock-WL-2` | yatay | 21 | 1 |
| `elf-kadin-warlock-WL-2` | yatay | 21 | 1 |
| `gnome-erkek-druid-GR` | yatay | 21 | 1 |
| `human-erkek-warlock-WL-2` | yatay | 21 | 1 |
| `human-kadin-warlock-WL-2` | yatay | 21 | 2 |
| `tiefling-erkek-warlock-WL-1` | yatay | 21 | 1 |
| `tiefling-erkek-warlock-WL-4` | yatay | 21 | 1 |
| `celestial-erkek-warlock-WL-2` | yatay | 20 | 2 |
| `dragonborn-erkek-warlock-WL-2` | yatay | 20 | 1 |
| `human-erkek-wizard-WZ-A5` | dikey | 20 | 3 |
| `celestial-erkek-warlock-WL-1` | yatay | 19 | 1 |
| `dragonborn-kadin-paladin-ID10` | dikey | 19 | 1 |
| `dragonborn-kadin-warlock-WL-1` | yatay | 19 | 1 |
| `dwarf-erkek-druid-GR` | yatay | 19 | 1 |
| `dwarf-male-warlock` | yatay | 19 | 2 |
| `elf-erkek-warlock-WL-1` | yatay | 19 | 1 |
| `gnome-male-warlock` | dikey | 19 | 2 |
| `halfling-erkek-bard-GR` | yatay | 19 | 1 |
| `human-male-warlock` | dikey | 19 | 2 |
| `dragonborn-erkek-warlock-WL-4` | yatay | 18 | 1 |
| `dragonborn-kadin-paladin-ID2` | dikey | 18 | 1 |
| `goliath-erkek-sorcerer-SC-3` | dikey | 18 | 3 |
| `halfling-female-warlock` | dikey | 18 | 1 |
| `human-erkek-druid-ID7` | dikey | 18 | 1 |
| `orc-kadin-barbarian-GR` | yatay | 18 | 2 |
| `celestial-erkek-warlock-WL-4` | yatay | 17 | 2 |
| `dragonborn-kadin-fighter-ID3` | dikey | 17 | 1 |
| `gnome-erkek-ranger-GR` | dikey | 17 | 1 |
| `goliath-erkek-druid-ID7` | dikey | 17 | 1 |
| `goliath-kadin-cleric-ID7` | dikey | 17 | 1 |
| `goliath-kadin-monk-GR` | yatay | 17 | 1 |
| `halfling-erkek-druid-ID7` | dikey | 17 | 2 |
| `orc-kadin-warlock-GR` | dikey | 17 | 1 |
| `dragonborn-kadin-fighter-ID8` | dikey | 16 | 3 |
| `dragonborn-kadin-monk-GR` | yatay | 16 | 2 |
| `dragonborn-kadin-warlock-WL-4` | yatay | 16 | 1 |
| `dwarf-erkek-monk-GR` | yatay | 16 | 1 |
| `dwarf-erkek-warlock-WL-4` | yatay | 16 | 4 |
| `dwarf-kadin-druid-GR` | dikey | 16 | 2 |
| `elf-erkek-barbarian-ID3` | yatay | 16 | 2 |
| `elf-kadin-monk-GR` | dikey | 16 | 1 |
| `goliath-kadin-druid-GR` | yatay | 16 | 1 |
| `halfling-kadin-sorcerer-GR` | yatay | 16 | 1 |
| `human-kadin-monk-ID10` | yatay | 16 | 4 |
| `orc-kadin-cleric-ID6` | dikey | 16 | 2 |
| `orc-kadin-wizard-WZ-A5` | dikey | 16 | 1 |
| `tiefling-kadin-druid-ID7` | dikey | 16 | 2 |
| `tiefling-kadin-wizard-WZ-A1` | dikey | 16 | 1 |
| `celestial-kadin-wizard-WZ-A5` | dikey | 15 | 1 |
| `dragonborn-kadin-paladin-GR` | dikey | 15 | 1 |
| `dragonborn-kadin-sorcerer-SC-3` | yatay | 15 | 4 |
| `elf-erkek-warlock-WL-4` | dikey | 15 | 3 |
| `gnome-female-warlock` | dikey | 15 | 2 |
| `gnome-kadin-wizard-WZ-B5` | yatay | 15 | 1 |
| `goliath-kadin-druid-ID7` | dikey | 15 | 1 |
| `halfling-kadin-druid-GR` | yatay | 15 | 1 |
| `human-erkek-barbarian-ID8` | yatay | 15 | 2 |
| `human-kadin-warlock-WL-1` | yatay | 15 | 1 |
| `orc-kadin-warlock-WL-8` | dikey | 15 | 1 |
| `tiefling-kadin-monk-GR` | yatay | 15 | 1 |
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
| `elf-erkek-fighter-GR` | yatay | 14 | 1 |
| `elf-kadin-warlock-WL-4` | yatay | 14 | 3 |
| `gnome-erkek-wizard-WZ-A5` | dikey | 14 | 3 |
| `gnome-female-cleric` | yatay | 14 | 1 |
| `human-erkek-fighter-ID8` | yatay | 14 | 1 |
| `human-erkek-warlock-WL-1` | yatay | 14 | 1 |
| `human-erkek-warlock-WL-3` | dikey | 14 | 2 |
| `human-kadin-monk-GR` | yatay | 14 | 2 |
| `human-kadin-warlock-WL-6` | dikey | 14 | 1 |
| `tiefling-erkek-warlock-GR` | dikey | 14 | 1 |
| `tiefling-erkek-warlock-WL-11` | dikey | 14 | 1 |
| `tiefling-erkek-warlock-WL-6` | dikey | 14 | 2 |
| `tiefling-kadin-rogue-GR` | dikey | 14 | 1 |
| `celestial-erkek-barbarian-GR` | yatay | 13 | 1 |
| `dragonborn-erkek-bard-ID7` | yatay | 13 | 2 |
| `dragonborn-kadin-cleric-GR` | dikey | 13 | 1 |
| `dragonborn-kadin-cleric-ID6` | yatay | 13 | 1 |
| `dwarf-erkek-wizard-WZ-B5` | dikey | 13 | 1 |
| `elf-kadin-warlock-WL-3` | yatay | 13 | 1 |
| `gnome-erkek-druid-ID7` | dikey | 13 | 3 |
| `halfling-erkek-wizard-WZ-A5` | dikey | 13 | 1 |
| `halfling-female-sorcerer` | dikey | 13 | 2 |
| `human-erkek-sorcerer-SC-2` | dikey | 13 | 4 |
| `human-erkek-warlock-WL-4` | dikey | 13 | 3 |
| `human-kadin-fighter-ID7` | yatay | 13 | 1 |
| `human-kadin-paladin-GR` | yatay | 13 | 1 |
| `orc-erkek-wizard-WZ-A5` | dikey | 13 | 1 |
| … | | | (+609; `--hepsi`) |
