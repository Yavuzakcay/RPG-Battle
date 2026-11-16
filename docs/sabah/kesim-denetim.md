# Kesim denetimi (İŞ 1, kesmeden)

`python3 scripts/kesim-denetim.py` — public/characters/*.webp (kucuk hariç) **2400 jeton** ölçüldü.

Ölçütler: (a) alfa kanvas kenarına değiyor (>3 px), (b) ana figür dışında ikinci büyük bağlı parça (> %6 alan; 5 px kaynaştırma sonrası), (c) genişlik aynı ırk-cinsiyet-sınıf kardeşlerinin medyanının %62'sinden dar (yarım kesik), (d) kenar pikselinin %4'ünden fazlası zemin tonlu (yeşil/magenta hue, doygun).

| Ölçüt | Jeton |
|---|---|
| sızıntı | 54 |
| dar | 31 |
| ikinci | 25 |
| kenara | 16 |
| **Toplam sorunlu jeton** | **125** |
| Sorunlu sayfa (sınıf×cinsiyet×ırk) | 95 |

Karşılaştırma: toplu-kesim özetindeki "kenara değen" sayfa 59; denetimde sorunlu sayfa 95; ortak 26. Özetin kenara-değen sayfalarının çoğu denetimde işaretlenmedi: özet, hücre kutusuna değmeyi ölçüyordu (figür hücre kutusunun kenarına yakın çizilmiş olabilir); bu denetim son jetonun kanvasına bakar. Denetimin yeni yakaladıkları sızıntı (hale/bant) ve yarım kesiklerdir.

## Sorunlu jetonlar (sayfa / hücre / neden)

| Sayfa | Hücre | Neden |
|---|---|---|
| barbarian-erkek-dwarf | ID8 | sızıntı 0.437 |
| barbarian-erkek-human | ID1 | sızıntı 0.083 |
| barbarian-erkek-orc | ID8 | sızıntı 0.288 |
| barbarian-erkek-tiefling | ID8 | sızıntı 0.571 |
| barbarian-kadin-celestial | ID1 | sızıntı 0.163 |
| barbarian-kadin-celestial | ID8 | sızıntı 0.268 |
| barbarian-kadin-dwarf | ID8 | sızıntı 0.406 |
| barbarian-kadin-elf | ID1 | sızıntı 0.117 |
| barbarian-kadin-elf | ID8 | sızıntı 0.125 |
| barbarian-kadin-halfling | ID1 | sızıntı 0.155 |
| barbarian-kadin-human | ID1 | sızıntı 0.162 |
| barbarian-kadin-human | ID8 | sızıntı 0.059 |
| cleric-erkek-elf | ID8 | sızıntı 0.048 |
| cleric-erkek-elf | ID9 | dar 0.37 |
| cleric-erkek-human | ID8 | sızıntı 0.174 |
| cleric-kadin-elf | ID8 | sızıntı 0.051 |
| cleric-kadin-goliath | ID9 | sızıntı 0.069 |
| cleric-kadin-human | ID8 | sızıntı 0.062 |
| cleric-kadin-tiefling | ID8 | sızıntı 0.071 |
| fighter-erkek-dwarf | ID7 | sızıntı 0.151 |
| fighter-erkek-dwarf | ID9 | sızıntı 0.266 |
| fighter-erkek-halfling | ID7 | sızıntı 0.063 |
| fighter-kadin-gnome | ID3 | ikinci parça 0.122 |
| fighter-kadin-gnome | ID9 | sızıntı 0.081 |
| fighter-kadin-goliath | ID3 | ikinci parça 0.076 |
| fighter-kadin-orc | ID3 | sızıntı 0.048 |
| monk-erkek-gnome | ID10 | dar 0.61 |
| monk-erkek-goliath | ID10 | dar 0.61 |
| monk-erkek-halfling | ID10 | dar 0.61 |
| monk-erkek-human | ID10 | dar 0.61 |
| monk-erkek-orc | ID10 | dar 0.61 |
| monk-erkek-tiefling | ID10 | dar 0.61 |
| monk-kadin-celestial | ID10 | dar 0.61 |
| monk-kadin-elf | ID10 | dar 0.61 |
| monk-kadin-gnome | ID10 | dar 0.61 |
| monk-kadin-halfling | ID10 | dar 0.61 |
| monk-kadin-human | ID10 | dar 0.6 |
| monk-kadin-orc | ID10 | dar 0.57 |
| paladin-erkek-celestial | ID10 | sızıntı 0.061 |
| paladin-erkek-dwarf | ID10 | sızıntı 0.049 |
| paladin-erkek-elf | ID10 | sızıntı 0.088 |
| paladin-erkek-gnome | ID10 | sızıntı 0.083 |
| paladin-erkek-goliath | ID10 | sızıntı 0.05 |
| paladin-erkek-halfling | ID10 | sızıntı 0.078 |
| paladin-erkek-human | ID10 | sızıntı 0.06 |
| paladin-erkek-orc | ID10 | sızıntı 0.071 |
| paladin-kadin-celestial | ID10 | sızıntı 0.12 |
| paladin-kadin-dwarf | ID10 | sızıntı 0.126 |
| paladin-kadin-elf | ID10 | sızıntı 0.076 |
| paladin-kadin-gnome | ID10 | sızıntı 0.14 |
| paladin-kadin-goliath | ID10 | sızıntı 0.123 |
| paladin-kadin-halfling | ID10 | sızıntı 0.152 |
| paladin-kadin-human | ID10 | sızıntı 0.118 |
| rogue-erkek-dwarf | ID3 | ikinci parça 0.064 |
| rogue-erkek-halfling | ID3 | ikinci parça 0.064 |
| sorcerer-erkek-dwarf | SC-8 | ikinci parça 0.062 |
| sorcerer-erkek-elf | SC-3 | ikinci parça 0.065 |
| sorcerer-erkek-elf | SC-9 | sızıntı 0.174 |
| sorcerer-erkek-gnome | SC-9 | ikinci parça 0.072 |
| sorcerer-erkek-goliath | SC-9 | ikinci parça 0.083 |
| sorcerer-erkek-orc | SC-3 | ikinci parça 0.173 |
| sorcerer-erkek-orc | SC-9 | ikinci parça 0.061 |
| sorcerer-erkek-tiefling | SC-3 | sızıntı 0.13 |
| sorcerer-kadin-celestial | SC-9 | ikinci parça 0.065 |
| sorcerer-kadin-dwarf | SC-9 | ikinci parça 0.076 |
| sorcerer-kadin-elf | SC-3 | ikinci parça 0.097 |
| sorcerer-kadin-elf | SC-9 | ikinci parça 0.061; sızıntı 0.09 |
| sorcerer-kadin-goliath | SC-9 | sızıntı 0.17 |
| sorcerer-kadin-halfling | SC-3 | ikinci parça 0.079 |
| sorcerer-kadin-halfling | SC-9 | ikinci parça 0.067 |
| sorcerer-kadin-orc | SC-3 | ikinci parça 0.07 |
| sorcerer-kadin-orc | SC-9 | ikinci parça 0.082 |
| warlock-erkek-celestial | WL-8 | dar 0.56 |
| warlock-erkek-dwarf | WL-8 | dar 0.57 |
| warlock-erkek-elf | WL-8 | dar 0.59 |
| warlock-erkek-gnome | WL-8 | dar 0.56 |
| warlock-erkek-goliath | WL-8 | dar 0.55 |
| warlock-erkek-halfling | WL-8 | dar 0.54 |
| warlock-erkek-human | WL-8 | dar 0.56 |
| warlock-erkek-orc | WL-8 | dar 0.55 |
| warlock-erkek-tiefling | WL-8 | dar 0.55 |
| warlock-kadin-celestial | WL-8 | dar 0.55 |
| warlock-kadin-dwarf | WL-8 | dar 0.54 |
| warlock-kadin-elf | WL-8 | dar 0.56 |
| warlock-kadin-gnome | WL-8 | dar 0.55 |
| warlock-kadin-goliath | WL-8 | dar 0.55 |
| warlock-kadin-halfling | WL-8 | dar 0.55 |
| warlock-kadin-human | WL-8 | dar 0.57 |
| warlock-kadin-orc | WL-8 | dar 0.55 |
| warlock-kadin-tiefling | WL-8 | dar 0.53 |
| wizard-erkek-celestial | WZ-B5 | ikinci parça 0.074 |
| wizard-erkek-dwarf | WZ-A2 | sızıntı 0.057 |
| wizard-erkek-dwarf | WZ-B1 | kenara değiyor sol |
| wizard-erkek-elf | WZ-A2 | sızıntı 0.051 |
| wizard-erkek-elf | WZ-B1 | kenara değiyor sol |
| wizard-erkek-gnome | WZ-A2 | sızıntı 0.044 |
| wizard-erkek-gnome | WZ-B1 | kenara değiyor sol |
| wizard-erkek-goliath | WZ-A2 | sızıntı 0.042 |
| wizard-erkek-goliath | WZ-B1 | kenara değiyor sol |
| wizard-erkek-goliath | WZ-B4 | ikinci parça 0.18 |
| wizard-erkek-goliath | WZ-B5 | ikinci parça 0.063 |
| wizard-erkek-halfling | WZ-A2 | sızıntı 0.052 |
| wizard-erkek-halfling | WZ-B1 | kenara değiyor sol |
| wizard-erkek-halfling | WZ-B7 | kenara değiyor sag |
| wizard-erkek-human | WZ-A2 | sızıntı 0.17 |
| wizard-erkek-human | WZ-B1 | kenara değiyor sol |
| wizard-erkek-human | WZ-B5 | sızıntı 0.052 |
| wizard-erkek-human | WZ-B7 | kenara değiyor sag |
| wizard-erkek-orc | WZ-A2 | sızıntı 0.065 |
| wizard-erkek-orc | WZ-B4 | ikinci parça 0.178 |
| wizard-erkek-tiefling | WZ-B5 | ikinci parça 0.061 |
| wizard-kadin-celestial | WZ-A2 | sızıntı 0.041 |
| wizard-kadin-dwarf | WZ-A2 | sızıntı 0.055 |
| wizard-kadin-dwarf | WZ-B1 | kenara değiyor sol |
| wizard-kadin-dwarf | WZ-B7 | kenara değiyor sag |
| wizard-kadin-elf | WZ-B1 | kenara değiyor sol |
| wizard-kadin-gnome | WZ-B1 | kenara değiyor sol |
| wizard-kadin-goliath | WZ-B1 | kenara değiyor sol |
| wizard-kadin-goliath | WZ-B4 | ikinci parça 0.178 |
| wizard-kadin-goliath | WZ-B5 | ikinci parça 0.061 |
| wizard-kadin-halfling | WZ-A2 | sızıntı 0.051 |
| wizard-kadin-halfling | WZ-B1 | kenara değiyor sol |
| wizard-kadin-human | WZ-A2 | sızıntı 0.054 |
| wizard-kadin-human | WZ-B1 | kenara değiyor sol |
| wizard-kadin-human | WZ-B7 | kenara değiyor sag |
