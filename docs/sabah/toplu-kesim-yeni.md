# Toplu kesim tek tur (KQ6-14)

`python3 scripts/toplu-kesim.py --yeni` (kısmi: `--yeni <dosya-adı-parçası>`). Ham sayfalar `wip/karakter-ham` dalından (`git checkout origin/wip/karakter-ham -- assets-ham/karakter`; depoya girmez). Kontak sayfaları `docs/sabah/toplu-kesim-yeni/`, ham sonuç `data/toplu-kesim-yeni-rapor.json`.

**48 sayfa kesildi, 498 jeton; 0 hücre figürsüz, 0 hücre kesilemeyen.** 2 hücre (Bard Dragonborn hücre 3, iki cinsiyet) iki büyük parça (figür + süzülen hançerler) olduğundan parçalar birleştirilerek kesildi (ELLE notlu, gözle kontrol); başka ELLE hücre çıkmadı. Klasördeki 52 dosya: 48 kesildi + 4 referans (aşağıda).

| Sayfa | Yerleşim | Jeton |
|---|---|---:|
| warlock-female-dragonborn.jpg | warlock | 11 |
| warlock-male-dragonborn.jpg | warlock | 11 |
| sorcerer-female-dragonborn.png | sorcerer | 9 |
| sorcerer-male-dragonborn.jpg | sorcerer | 9 |
| barbarian-female-dragonborn.jpg | barbarian | 9 |
| barbarian-male-dragonborn.jpg | barbarian | 9 |
| bard-female-dragonborn.jpg | bard | 9 |
| bard-male-dragonborn.jpg | bard | 9 |
| cleric-female-dragonborn.jpg | cleric | 9 |
| cleric-male-dragonborn.jpg | cleric | 9 |
| druid-female-dragonborn.jpg | druid | 8 |
| druid-male-dragonborn.jpg | druid | 7 |
| fighter-female-dragonborn.jpg | fighter | 10 |
| fighter-male-dragonborn.jpg | fighter | 11 |
| monk-female-dragonborn.jpg | monk | 11 |
| monk-male-dragonborn.jpeg | monk | 11 |
| paladin-female-dragonborn.png | paladin | 10 |
| paladin-male-dragonborn.png | paladin | 10 |
| ranger-female-dragonborn.jpg | ranger | 9 |
| ranger-male-dragonborn.jpg | ranger | 9 |
| rogue-female-dragonborn.jpg | rogue | 10 |
| rogue-male-dragonborn.jpg | rogue | 10 |
| wizard-female-dragonborn-a.jpg | wizard_a | 8 |
| wizard-female-dragonborn-b.jpg | wizard_b | 7 |
| wizard-male-dragonborn-a.jpg | wizard_a | 8 |
| wizard-male-dragonborn-b.jpg | wizard_b | 7 |
| gariban-female-human.jpg | gariban | 12 |
| gariban-male-human.jpg | gariban | 12 |
| gariban-female-elf.jpg | gariban | 12 |
| gariban-male-elf.jpg | gariban | 12 |
| gariban-female-dwarf.jpg | gariban | 12 |
| gariban-male-dwarf.jpg | gariban | 12 |
| gariban-female-halfling.jpg | gariban | 12 |
| gariban-male-halfling.jpg | gariban | 12 |
| gariban-female-gnome.jpg | gariban | 12 |
| gariban-male-gnome.jpg | gariban | 12 |
| gariban-female-orc.jpg | gariban | 12 |
| gariban-male-orc.jpg | gariban | 12 |
| gariban-female-tiefling.jpg | gariban | 12 |
| gariban-male-tiefling.jpg | gariban | 12 |
| gariban-female-goliath.jpg | gariban | 12 |
| gariban-male-goliath.jpg | gariban | 12 |
| gariban-female-celestial.jpg | gariban | 12 |
| gariban-male-celestial.jpg | gariban | 12 |
| gariban-female-dragonborn.jpg | gariban | 12 |
| gariban-male-dragonborn.jpg | gariban | 12 |
| hizir-sayfa1.jpg | hizir | 9 |
| hizir-sayfa2.jpg | hizir | 9 |

## Kesilmeyenler (referans)

- wizard-female-human-a.png: yalnız referans, kesilmedi
- wizard-female-human-b.png: yalnız referans, kesilmedi
- wizard-male-human-a.png: yalnız referans, kesilmedi
- wizard-male-human-b.png: yalnız referans, kesilmedi

## Notlar

- Ham zemin: sayfa başına gerçek zemin tonu algılanır (`sheet_bg`; #00FF00/#FF00FF'e yakın ama sapmış yeşil/magenta, karışık hücre zeminli wizard sayfaları dahil). Sayfa zemini dışında kalan sayfa çerçeve çizgileri yalnız iki yanı da zemin olan uzun çizgilerde silinir; koyu pelerinli figürler zarar görmez (kesim öncesi/sonrası piksel karşılaştırması: ≤ %1,4).
- Çıktı adları: Dragonborn sınıf `dragonborn-<erkek|kadin>-<sınıf>-<KOD>`, Wizard Dragonborn `…-wizard-WZ-A<n>|WZ-B<n>`, Gariban `<irk>-<cinsiyet>-<sınıf>-GR` (240), Hızır `<irk>-<cinsiyet>-paladin-ID10` (18; mevcut dosyaların yerine yazıldı, Dragonborn Paladin ID10 kendi sayfasından).
- Beklenen boş hücreler: Druid erkek 8 (Karadul, kadın kısıtlı), Fighter kadın 11 (İmparator, erkek kısıtlı): Dragonborn dahil jeton yok.
- Kullanıcı ELLE listesindeki yarı saydam duman/kıvılcım hücreleri (Monk/Fighter/Bard/Barbarian/Cleric/Warlock/Gariban) el kesimi yapılmadı; otomatik sonuç kontak sayfalarında. Gözle bakılacaklar: Monk Dragonborn 10 (duman), Warlock Dragonborn 10-11, Cleric kadın 6-9, Fighter 7/9, Bard 2/4/7, Barbarian 1/2/4, Gariban Sorcerer 10 (kıvılcım) ve Warlock 11 (duman).
- Oyuna bağlama: Dragonborn jetonları boyası gerektiği için (ten maskesi bu görevde yok) alt sınıf jetonu olarak bağlanmadı, sınıf-genel jeton kalır; Hızır Paladin ID10 mevcut bağda (dosya güncellendi); Gariban (GR) bağlanmadı (seviye < 3 görevi ayrı); İmparator (Fighter erkek ID11) ve Karadul (Druid kadın ID8) kısıtlı alt sınıflar atlandı.
