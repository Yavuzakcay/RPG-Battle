# Jeton denetimi (JETON-DENETIM)

Üretildi: `python scripts/jeton-denetim.py` (2026-11-22, commit 9b194591). **Yalnız rapor**: hiçbir jeton, maske, filtre ya da `data/` dosyası değişmedi.
Çizim oyunun kendi kodu ve bileşenleriyle (`scripts/jeton-denetim-cizim.ts` + `jeton-denetim-sayfa.tsx`, Vite + Chromium): `sheetAvatar` → `tintedUrl` (maske, maske onarımı, kafa kaplaması) → `TokenFigure` (savaş jetonu) ve `LookFrame` + `AvatarBadge` (rozet 84 px, kırpmalı/kırpmasız). Kontak sayfaları `gorsel-dokum/jeton-denetim/kontak/` (git dışı).

## Kapsam ve yöntem

- Görünüş: **11760** kombinasyon (12 sınıf × Gariban + her alt sınıf hücre kimliği + ikinci form + alt sınıfsız 5. seviye × 10 ırk/40 soy-ton-uyanış sütunu × 2 cinsiyet; jeton tabloları `data/<sınıf>-jeton.json` doğrudan, `icerik/` gerekmez). Ayrı jeton dosyası: 2876 (oyunda kullanılan) / 2900 (`public/characters/`).
- Boyalı jeton (jeton × soy boyası): 6720; savaş jetonu çizimi 11309; rozet çizimi 11600 (kırpmalı + kırpmasız); açık kanat 144.
- Otomatik eleme (dosya: yarık, düz/konturuz kenar, kenara değme, kopuk parça, zemin kalıntısı, boy; boya: ham rengi ten mi, boyanmamış ten; çizim: alfa kaybı, rozet kırpması, kanat rengi) + **gözle**: aşağıdaki kontak sayfalarının hepsine bizzat bakıldı.
- Bakılan sayfalar: `irk-<ırk>.png` (10 ırk × 290 ham jeton), `yarik-1…8.png` (729 yarık adayının hepsi, yakın görüntü), `boya-tum-<soy>-1…4.png` (Drow, Human Koyu, Tiefling Abyssal, Gnome Yeraltı: her maskeli jetonun boya haritası + oyundaki hâli; High Elf yalnız 1. sayfa), `boya-drow-rogue.png`, `boya-drow-sorcerer.png`, `ten-human-1…2.png` (Orijinal | Koyu | Altın), `ten-human-el-aday.png`, `bas-tepe.png`, `kesik-kenar*.png`, `rozet-bas.png`, `rozet-kirpma-en.png`, `kanat-0.png`.

### Bilinen kötü örnekler (denetim yakalıyor mu)

| Örnek | Sonuç |
|---|---|
| Human erkek Fighter GR, eski kesim (git `e6b1fc3a`): bilek/kabza yarığı | **Yakalandı**: yatay yarık 17 px (satır 162, kalınlık 3,8 px, üst kenar %94 dolu renk). Güncel dosyada yarık yok (düzeltilmiş). |
| Human erkek Fighter GR, düzeltilmiş: eller yüzden koyu | **Yakalandı (ölçü + göz)**: maske yalnız yüz ve boyun; eller maskesiz. Altın tonda yüz L 81, el L ≈ 26–30 (ΔL −52…−56), Koyu (Tenhausser) tonda ΔL −19…−25, Orijinal ΔL ≈ −45. Kontak `ten-human-2.png` #78. Not: aynı otomatik ölçü saç örgüsünü de "el" sanıyor (`ten-human-el-aday.png`): el uyumsuzluğu için tek başına güvenilir değil, göz gerekli. |
| Celestial erkek Cleric ID1–ID6, ID8 eski çizim | **Kaynak sayfası olmadan yakalanamaz** (ham sayfalar bu ortamda yok; aşağıda "Kapsam dışı"). Önceki `CELESTIAL-KAYNAK-DENETIM.md` yakalamıştı; dosyalar 4bdedcaf (2026-11-22) ile yenilendi. |
| Dragonborn beyaz kanat (düzeltme öncesi) | Eski hâl çizim yarışıydı (kanat filtresi geç yüklenince beyaz); dosyada değil. Gerçek tarayıcıda açık kanat çizilip renk ölçüldü: 10 Dragonborn soyunun hepsi kendi tonunda (Black #57464e … Red #944940, White #f7d2d2); beyaz kalan yok. Ölçü (doygunluk < 0,10 ve beyaz olmayan soy) eski hatayı yakalardı; eski kod geri alınmadan gösterilemedi. |
| Elf Drow "Sorcerer": gülen elf, mor tunik ve şapka boyanmış, yüz boyasız | **Yakalandı**, ama jeton Sorcerer değil **Bard ID7** (korkuluk kılıklı gülen elf; erkek ve kadın): maske şapka ve tuniği kapsıyor, yüz dışarıda. Sorcerer'da aynı tarif yok; Sorcerer'da ayrıca kadın SC-9 (yalnız sepet boyalı, yüz boyasız) ve kadın SC-3 bozuk. |
| Elf Drow Rogue "19": kapüşon ve zırh boyanmış, yüz doğal | **Yakalandı**: Rogue **ID8** (boya sayfasında #199/#200), erkek ve kadın: maske kapüşonu ve göğüs zırhını kapsıyor, yüz dışarıda. |
| İyi örnek: monokllü Elf Drow | Temiz: Rogue ID1 (erkek/kadın) yüz ve eller boyalı, giysi siyah (ten dışı boya oranı %3–4). |
| Kafası kesik jetonlar | **Bulundu**: dosyada `celestial-kadin-sorcerer-SC-9` (silindir şapka tuvalin üst kenarında düz kesik, 164 opak piksel satır 0'da); oyunda rozet çerçevesi 69 jetonda başın/şapkanın üstünü ≥ 10 px kesiyor (aşağıda). |

## Özet tablo (ırk × sınıf)

Hücre: bozuk / şüpheli jeton sayısı (bütün jetonlara bakıldı; "temiz" = 0/0). Bir jeton birden çok sorun taşıyabilir.

| Irk | barbarian | bard | cleric | druid | fighter | monk | paladin | ranger | rogue | sorcerer | warlock | wizard |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| celestial | 3/0 | 0/2 | 1/4 | 0/1 | 0/1 | temiz | temiz | 0/1 | 0/1 | 1/1 | 5/0 | 2/1 |
| dragonborn | 0/1 | 2/4 | 0/1 | 1/4 | 2/4 | 4/0 | 0/5 | 0/3 | 2/4 | 1/1 | 8/2 | temiz |
| dwarf | 3/2 | 1/1 | 0/3 | 1/1 | 1/0 | 2/0 | 0/1 | temiz | 0/2 | 1/0 | 5/4 | 1/2 |
| elf | 2/1 | 2/2 | 0/1 | 1/4 | 3/0 | 1/1 | 1/4 | temiz | 4/2 | 2/0 | 9/4 | 0/2 |
| gnome | 9/1 | 0/5 | temiz | 2/3 | 3/2 | 1/0 | 0/2 | 0/1 | 4/0 | 2/2 | 4/6 | 1/2 |
| goliath | temiz | 1/1 | 0/4 | 1/2 | 0/2 | 2/0 | temiz | temiz | 1/2 | 0/1 | 0/2 | 0/2 |
| halfling | 11/0 | 1/4 | 0/1 | 2/5 | 2/0 | 1/0 | temiz | temiz | 0/2 | 0/1 | 2/2 | 0/1 |
| human | 2/3 | 1/1 | 0/2 | 1/5 | 4/6 | 1/1 | 1/4 | temiz | 2/4 | 4/2 | 9/5 | 1/1 |
| orc | 1/2 | 1/1 | 0/1 | 1/1 | 0/3 | 1/1 | 0/1 | temiz | 0/3 | 1/1 | 0/5 | 1/1 |
| tiefling | 0/2 | 1/2 | 0/2 | 8/3 | 1/4 | 1/3 | temiz | 0/1 | 2/2 | 4/0 | 7/2 | 2/1 |

Toplam: bozuk **180** jeton, şüpheli **210** jeton (sınıf-genel jetonlar dahil; oyunda yalnız alt sınıfsız eski kayıtta kullanılır).

## 1. Kesim

### 1a. Yarık (bilek, kabza, kol, asa, etek düz biçilmiş): gerçek kusur

729 adayın hepsi yakın görüntüde (`yarik-1…8.png`) tek tek sınıflandı: **109 gerçek kusur**, 113 belirsiz, geri kalanı doğal boşluk (bacak arası, kuyruk/pelerin şeridi, halka, kemer). Gariban (GR) ve Warlock WL-1/WL-2/WL-4 kusurların çoğunluğu (kullanıcının gördüğü bilek/el kopukluğu).
Tahmini neden: eski `trim_lines` (2026-11-22 öncesi her yöndeki koyu şeridi kutunun herhangi bir bandına değince siliyordu) ve `drop_lines` (renkten bağımsız 60 px ince uzun parçayı siliyor). Toplu kesim ve `cc-kesim.py` aynı işlevi kullanır (`tk.trim_lines`); Warlock 110 jeton (bf3f183b) ve Gariban sayfaları düzeltmeden önce kesildi. Önerilen düzeltme: bu jetonları düzeltilmiş `trim_lines` ile ham sayfadan yeniden kesmek; `drop_lines`'i yalnız koyu çizgiye ve yalnız kutu dış bandına sınırlamak (bkz. 1d).

| Jeton | Yön | Yarık px | Satır/sütun | Kaynak (sayfa, hücre) |
|---|---|---|---|---|
| `celestial-erkek-barbarian-GR` | yatay | 13 | 233 | hale-gemini-sayfa-02.png h2 |
| `celestial-erkek-barbarian-ID8` | yatay | 33 | 19 | hale-gemini-duzeltme-sayfa-02.jpg h1 |
| `celestial-erkek-cleric-ID8` | yatay | 14 | 170 | clerik-male-celestial.jpg h8 |
| `celestial-erkek-warlock-WL-1` | yatay | 19 | 236 | warlock-male-celestial.jpg h1 |
| `celestial-erkek-warlock-WL-2` | yatay | 20 | 230 | warlock-male-celestial.jpg h2 |
| `celestial-erkek-warlock-WL-4` | yatay | 17 | 241 | warlock-male-celestial.jpg h4 |
| `celestial-erkek-warlock-WL-6` | dikey | 16 | 151 | warlock-male-celestial.jpg h6 |
| `celestial-female-wizard` | yatay | 26 | 165 | hale-gemini-sayfa-31.png h2 |
| `celestial-kadin-barbarian-ID1` | yatay | 15 | 225 | hale-gemini-sayfa-02.png h4 |
| `celestial-male-warlock` | dikey | 23 | 59 | hale-gemini-sayfa-26.png h4 |
| `celestial-male-wizard` | yatay | 26 | 164 | hale-gemini-sayfa-29.png h3 |
| `dragonborn-erkek-fighter-ID8` | yatay | 14 | 209 | fighter-male-dragonborn.jpg h8 (tahmin) |
| `dragonborn-erkek-monk-ID9` | yatay | 24 | 240 | monk-male-dragonborn.jpg h9 (tahmin) |
| `dragonborn-erkek-rogue-ID7` | yatay | 121 | 60 | rogue-male-dragonborn.jpg h7 (tahmin) |
| `dragonborn-erkek-sorcerer-SC-5` | yatay | 84 | 120 | sorcerer-male-dragonborn.jpg h5 (tahmin) |
| `dragonborn-erkek-warlock-WL-1` | yatay | 19 | 233 | warlock-male-dragonborn.jpg h1 (tahmin) |
| `dragonborn-erkek-warlock-WL-2` | yatay | 20 | 230 | warlock-male-dragonborn.jpg h2 (tahmin) |
| `dragonborn-erkek-warlock-WL-4` | yatay | 18 | 240 | warlock-male-dragonborn.jpg h4 (tahmin) |
| `dragonborn-erkek-warlock-WL-6` | dikey | 17 | 151 | warlock-male-dragonborn.jpg h6 (tahmin) |
| `dragonborn-kadin-bard-ID5` | yatay | 18 | 142 | bard-female-dragonborn.jpg h5 (tahmin) |
| `dragonborn-kadin-bard-ID9` | yatay | 26 | 122 | bard-female-dragonborn.jpg h9 (tahmin) |
| `dragonborn-kadin-druid-ID2` | yatay | 25 | 145 | druid-female-dragonborn.jpg h2 (tahmin) |
| `dragonborn-kadin-fighter-GR` | yatay | 12 | 236 | Gariban sayfası (dragonborn female) (tahmin) |
| `dragonborn-kadin-monk-GR` | yatay | 16 | 219 | Gariban sayfası (dragonborn female) (tahmin) |
| `dragonborn-kadin-monk-ID8` | yatay | 89 | 93 | monk-female-dragonborn.jpg h8 (tahmin) |
| `dragonborn-kadin-monk-ID9` | yatay | 21 | 241 | monk-female-dragonborn.jpg h9 (tahmin) |
| `dragonborn-kadin-rogue-ID7` | yatay | 126 | 56 | rogue-female-dragonborn.jpg h7 (tahmin) |
| `dragonborn-kadin-warlock-WL-1` | yatay | 19 | 240 | warlock-female-dragonborn.jpg h1 (tahmin) |
| `dragonborn-kadin-warlock-WL-2` | yatay | 22 | 230 | warlock-female-dragonborn.jpg h2 (tahmin) |
| `dragonborn-kadin-warlock-WL-4` | yatay | 16 | 240 | warlock-female-dragonborn.jpg h4 (tahmin) |
| `dragonborn-male-warlock` | dikey | 31 | 123 | eski sınıf-genel (dragonborn-male-warlock) |
| `dwarf-erkek-barbarian-GR` | yatay | 33 | 225 | Gariban sayfası (dwarf male) (tahmin) |
| `dwarf-erkek-druid-GR` | yatay | 19 | 154 | Gariban sayfası (dwarf male) (tahmin) |
| `dwarf-erkek-monk-GR` | yatay | 16 | 227 | Gariban sayfası (dwarf male) (tahmin) |
| `dwarf-erkek-sorcerer-GR` | yatay | 22 | 228 | Gariban sayfası (dwarf male) (tahmin) |
| `dwarf-erkek-warlock-WL-4` | yatay | 16 | 235 | warlock-male-dwarf.jpg h4 |
| `dwarf-female-warlock` | dikey | 22 | 25 | eski sınıf-genel (dwarf-female-warlock) |
| `dwarf-kadin-barbarian-GR` | yatay | 15 | 166 | Gariban sayfası (dwarf female) (tahmin) |
| `dwarf-kadin-barbarian-ID7` | dikey | 22 | 163 | barbarian-female-dwarf.jpg h7 (tahmin) |
| `dwarf-kadin-bard-GR` | yatay | 19 | 128 | Gariban sayfası (dwarf female) (tahmin) |
| `dwarf-kadin-fighter-GR` | yatay | 14 | 235 | Gariban sayfası (dwarf female) (tahmin) |
| `dwarf-kadin-monk-GR` | yatay | 17 | 227 | Gariban sayfası (dwarf female) (tahmin) |
| `dwarf-kadin-warlock-WL-2` | yatay | 21 | 232 | warlock-female-dwarf.jpg h2 |
| `dwarf-kadin-warlock-WL-6` | dikey | 15 | 150 | warlock-female-dwarf.jpg h6 |
| `dwarf-male-warlock` | yatay | 19 | 92 | eski sınıf-genel (dwarf-male-warlock) |
| `dwarf-male-wizard` | dikey | 19 | 36 | eski sınıf-genel (dwarf-male-wizard) |
| `elf-erkek-barbarian-ID3` | yatay | 16 | 242 | barbarian-male-elf.jpg h3 (tahmin) |
| `elf-erkek-fighter-GR` | yatay | 14 | 172 | Gariban sayfası (elf male) (tahmin) |
| `elf-erkek-monk-GR` | yatay | 18 | 226 | Gariban sayfası (elf male) (tahmin) |
| `elf-erkek-paladin-GR` | yatay | 15 | 231 | Gariban sayfası (elf male) (tahmin) |
| `elf-erkek-warlock-WL-1` | yatay | 19 | 233 | warlock-male-elf.jpg h1 |
| `elf-erkek-warlock-WL-2` | yatay | 23 | 165 | warlock-male-elf.jpg h2 |
| `elf-erkek-warlock-WL-6` | dikey | 14 | 150 | warlock-male-elf.jpg h6 |
| `elf-female-warlock` | dikey | 32 | 44 | eski sınıf-genel (elf-female-warlock) |
| `elf-kadin-druid-ID7` | yatay | 24 | 243 | druid-female-elf.jpg h7 (tahmin) |
| `elf-kadin-fighter-GR` | yatay | 14 | 149 | Gariban sayfası (elf female) (tahmin) |
| `elf-kadin-warlock-WL-2` | yatay | 21 | 231 | warlock-female-elf.jpg h2 |
| `elf-kadin-warlock-WL-4` | yatay | 14 | 242 | warlock-female-elf.jpg h4 |
| `elf-kadin-warlock-WL-6` | dikey | 18 | 152 | warlock-female-elf.jpg h6 |
| `elf-male-warlock` | dikey | 32 | 43 | eski sınıf-genel (elf-male-warlock) |
| `gnome-erkek-druid-GR` | yatay | 21 | 167 | Gariban sayfası (gnome male) (tahmin) |
| `gnome-erkek-fighter-GR` | dikey | 43 | 229 | Gariban sayfası (gnome male) (tahmin) |
| `gnome-erkek-warlock-WL-2` | yatay | 22 | 230 | warlock-male-gnome.jpg h2 |
| `gnome-erkek-warlock-WL-6` | dikey | 16 | 152 | warlock-male-gnome.jpg h6 |
| `gnome-erkek-warlock-WL-7` | dikey | 15 | 144 | warlock-male-gnome.jpg h7 |
| `gnome-kadin-druid-GR` | yatay | 14 | 234 | Gariban sayfası (gnome female) (tahmin) |
| `gnome-kadin-monk-GR` | yatay | 16 | 227 | Gariban sayfası (gnome female) (tahmin) |
| `gnome-male-warlock` | dikey | 19 | 52 | eski sınıf-genel (gnome-male-warlock) |
| `goliath-erkek-monk-GR` | yatay | 24 | 170 | Gariban sayfası (goliath male) (tahmin) |
| `goliath-erkek-rogue-GR` | yatay | 22 | 132 | Gariban sayfası (goliath male) (tahmin) |
| `goliath-kadin-bard-GR` | yatay | 18 | 108 | Gariban sayfası (goliath female) (tahmin) |
| `goliath-kadin-druid-GR` | yatay | 16 | 217 | Gariban sayfası (goliath female) (tahmin) |
| `goliath-kadin-monk-GR` | yatay | 17 | 228 | Gariban sayfası (goliath female) (tahmin) |
| `halfling-erkek-barbarian-GR` | yatay | 16 | 152 | Gariban sayfası (halfling male) (tahmin) |
| `halfling-erkek-bard-GR` | yatay | 19 | 133 | Gariban sayfası (halfling male) (tahmin) |
| `halfling-erkek-druid-GR` | yatay | 13 | 156 | Gariban sayfası (halfling male) (tahmin) |
| `halfling-erkek-fighter-GR` | dikey | 29 | 213 | Gariban sayfası (halfling male) (tahmin) |
| `halfling-female-warlock` | dikey | 18 | 70 | eski sınıf-genel (halfling-female-warlock) |
| `halfling-kadin-barbarian-GR` | yatay | 22 | 155 | Gariban sayfası (halfling female) (tahmin) |
| `halfling-kadin-druid-GR` | yatay | 15 | 164 | Gariban sayfası (halfling female) (tahmin) |
| `halfling-kadin-fighter-GR` | dikey | 22 | 213 | Gariban sayfası (halfling female) (tahmin) |
| `halfling-kadin-monk-GR` | yatay | 22 | 187 | Gariban sayfası (halfling female) (tahmin) |
| `halfling-male-warlock` | dikey | 28 | 55 | eski sınıf-genel (halfling-male-warlock) |
| `human-erkek-barbarian-ID8` | yatay | 15 | 146 | barbarian-male-aurasiz.jpg h1 |
| `human-erkek-druid-GR` | yatay | 23 | 161 | Gariban sayfası (human male) (tahmin) |
| `human-erkek-sorcerer-GR` | yatay | 19 | 231 | Gariban sayfası (human male) (tahmin) |
| `human-erkek-warlock-WL-1` | yatay | 14 | 236 | warlock-male-human.jpg h1 |
| `human-erkek-warlock-WL-2` | yatay | 21 | 230 | warlock-male-human.jpg h2 |
| `human-erkek-warlock-WL-6` | dikey | 15 | 151 | warlock-male-human.jpg h6 |
| `human-kadin-bard-ID5` | yatay | 17 | 139 | bard-female-human.jpg h5 (tahmin) |
| `human-kadin-monk-GR` | yatay | 14 | 233 | Gariban sayfası (human female) (tahmin) |
| `human-kadin-paladin-GR` | yatay | 13 | 226 | Gariban sayfası (human female) (tahmin) |
| `human-kadin-warlock-WL-1` | yatay | 15 | 236 | warlock-female-human.jpg h1 |
| `human-kadin-warlock-WL-2` | yatay | 21 | 232 | warlock-female-human.jpg h2 |
| `human-kadin-warlock-WL-6` | dikey | 14 | 149 | warlock-female-human.jpg h6 |
| `human-male-warlock` | dikey | 19 | 105 | eski sınıf-genel (human-male-warlock) |
| `orc-erkek-bard-GR` | yatay | 22 | 127 | Gariban sayfası (orc male) (tahmin) |
| `orc-erkek-monk-GR` | yatay | 16 | 229 | Gariban sayfası (orc male) (tahmin) |
| `orc-erkek-sorcerer-GR` | yatay | 19 | 158 | Gariban sayfası (orc male) (tahmin) |
| `orc-kadin-barbarian-GR` | yatay | 18 | 151 | Gariban sayfası (orc female) (tahmin) |
| `orc-kadin-druid-GR` | yatay | 16 | 166 | Gariban sayfası (orc female) (tahmin) |
| `orc-male-wizard` | yatay | 27 | 42 | eski sınıf-genel (orc-male-wizard) |
| `tiefling-erkek-warlock-WL-1` | yatay | 21 | 237 | warlock-male-tiefling.jpg h1 |
| `tiefling-erkek-warlock-WL-4` | yatay | 21 | 236 | warlock-male-tiefling.jpg h4 |
| `tiefling-female-warlock` | dikey | 18 | 129 | eski sınıf-genel (tiefling-female-warlock) |
| `tiefling-kadin-monk-GR` | yatay | 15 | 233 | Gariban sayfası (tiefling female) (tahmin) |
| `tiefling-kadin-warlock-WL-2` | yatay | 14 | 224 | warlock-female-tiefling.jpg h2 |
| `tiefling-kadin-warlock-WL-6` | dikey | 14 | 175 | warlock-female-tiefling.jpg h6 |
| `tiefling-male-wizard` | dikey | 40 | 142 | eski sınıf-genel (tiefling-male-wizard) |

Belirsiz (yakın görüntüde karar verilemedi; ham sayfayla karşılaştırılmalı): `celestial-erkek-bard-GR`, `celestial-erkek-cleric-ID4`, `celestial-erkek-cleric-ID6`, `celestial-erkek-cleric-ID7`, `celestial-erkek-sorcerer-SC-9`, `celestial-kadin-cleric-ID3`, `celestial-kadin-fighter-GR`, `celestial-kadin-ranger-GR`, `celestial-kadin-rogue-ID9`, `celestial-kadin-wizard-GR`, `celestial-male-bard`, `dragonborn-erkek-barbarian-ID9`, `dragonborn-erkek-bard-GR`, `dragonborn-erkek-bard-ID7`, `dragonborn-erkek-fighter-ID2`, `dragonborn-erkek-fighter-ID3`, `dragonborn-erkek-paladin-GR`, `dragonborn-erkek-paladin-ID10`, `dragonborn-erkek-paladin-ID6`, `dragonborn-erkek-paladin-ID9`, `dragonborn-kadin-bard-GR`, `dragonborn-kadin-bard-ID6`, `dragonborn-kadin-cleric-ID6`, `dragonborn-kadin-druid-ID8`, `dragonborn-kadin-fighter-ID10`, `dragonborn-kadin-fighter-ID3`, `dragonborn-kadin-paladin-ID2`, `dragonborn-kadin-ranger-ID4`, `dragonborn-kadin-ranger-ID5`, `dragonborn-kadin-ranger-ID6`, `dragonborn-kadin-rogue-ID10`, `dragonborn-kadin-sorcerer-SC-3`, `dwarf-erkek-barbarian-ID4`, `dwarf-erkek-cleric-GR`, `dwarf-female-bard`, `dwarf-kadin-barbarian-ID4`, `dwarf-kadin-cleric-GR`, `dwarf-kadin-druid-GR`, `dwarf-kadin-paladin-GR`, `dwarf-kadin-warlock-GR`, `dwarf-kadin-warlock-WL-1`, `dwarf-kadin-warlock-WL-7`, `dwarf-kadin-wizard-WZ-B5`, `elf-erkek-bard-GR`, `elf-erkek-rogue-ID9`, `elf-erkek-warlock-WL-4`, `elf-kadin-bard-GR`, `elf-kadin-monk-GR`, `elf-kadin-warlock-WL-3`, `gnome-erkek-ranger-GR`, `gnome-female-bard`, `gnome-female-paladin`, `gnome-female-warlock`, `gnome-kadin-bard-GR`, `gnome-kadin-fighter-ID9`, `gnome-kadin-paladin-GR`, `gnome-kadin-sorcerer-GR`, `gnome-kadin-warlock-GR`, `gnome-kadin-wizard-WZ-B5`, `goliath-erkek-cleric-GR`, `goliath-erkek-cleric-ID1`, `goliath-erkek-cleric-ID3`, `goliath-erkek-sorcerer-SC-9`, `goliath-female-bard`, `goliath-kadin-cleric-ID7`, `goliath-kadin-fighter-ID12`, `goliath-kadin-fighter-ID8`, `goliath-kadin-wizard-GR`, `goliath-male-warlock`, `halfling-erkek-bard-ID6`, `halfling-erkek-druid-ID7`, `halfling-erkek-rogue-ID3`, `halfling-female-bard`, `halfling-kadin-bard-GR`, `halfling-kadin-bard-ID7`, `halfling-kadin-cleric-ID8`, `halfling-kadin-sorcerer-GR`, `halfling-kadin-warlock-WL-4`, `human-erkek-barbarian-ID6`, `human-erkek-fighter-ID3`, `human-erkek-fighter-ID8`, `human-erkek-paladin-GR`, `human-erkek-rogue-ID4`, `human-erkek-warlock-WL-11`, `human-erkek-warlock-WL-7`, `human-kadin-fighter-GR`, `human-kadin-fighter-ID6`, `human-kadin-fighter-ID7`, `human-kadin-monk-ID10`, `human-kadin-sorcerer-GR`, `human-kadin-warlock-GR`, `human-male-barbarian`, `orc-erkek-barbarian-GR`, `orc-erkek-bard-ID5`, `orc-erkek-fighter-ID10`, `orc-erkek-fighter-ID2`, `orc-erkek-monk-ID4`, `orc-erkek-rogue-ID4`, `orc-erkek-sorcerer-SC-9`, `orc-kadin-barbarian-ID4`, `orc-kadin-cleric-ID4`, `orc-kadin-fighter-GR`, `orc-kadin-paladin-GR`, `orc-kadin-warlock-GR`, `orc-kadin-warlock-WL-3`, `orc-kadin-warlock-WL-6`, `orc-male-warlock`, `tiefling-erkek-cleric-ID4`, `tiefling-erkek-druid-ID7`, `tiefling-erkek-sorcerer-SC-9`, `tiefling-female-bard`, `tiefling-kadin-bard-ID1`, `tiefling-kadin-ranger-ID5`

### 1b. Yanlış oran (figür tuvalde yarı boyda)

Figür yüksekliği aynı ırk-cinsiyetin medyanının %52–59'u (≈120–135 px; medyan ≈ 228 px). Gözle doğrulandı (`irk-gnome.png`, `irk-halfling.png`, boya sayfaları): figür tuvalin alt yarısında küçücük. Tahmini neden: sayfada iki sıra/küçük ölçekli çizim ya da yükseklik normalleştirmesi atlandı (aynı sayfanın 9 hücresi birlikte). Önerilen düzeltme: bu iki sayfayı (Barbarian kadın Gnome, Barbarian erkek Halfling) hedef figür boyuna (`FIG_H`) yeniden ölçeklemek.

| Jeton | Boy / medyan | Kaynak |
|---|---|---|
| `halfling-erkek-barbarian-ID2` | 0.52 | barbarian-male-halfling.jpg h2 (tahmin) |
| `halfling-erkek-barbarian-ID5` | 0.52 | barbarian-male-halfling.jpg h5 (tahmin) |
| `halfling-erkek-barbarian-ID6` | 0.52 | barbarian-male-halfling.jpg h6 (tahmin) |
| `halfling-erkek-barbarian-ID9` | 0.52 | barbarian-male-halfling.jpg h9 (tahmin) |
| `halfling-erkek-barbarian-ID1` | 0.53 | barbarian-male-halfling.jpg h1 (tahmin) |
| `halfling-erkek-barbarian-ID7` | 0.53 | barbarian-male-halfling.jpg h7 (tahmin) |
| `halfling-erkek-barbarian-ID8` | 0.53 | barbarian-male-aurasiz.jpg h4 |
| `halfling-erkek-barbarian-ID4` | 0.54 | barbarian-male-halfling.jpg h4 (tahmin) |
| `halfling-erkek-barbarian-ID3` | 0.55 | barbarian-male-halfling.jpg h3 (tahmin) |
| `gnome-kadin-barbarian-ID1` | 0.56 | barbarian-female-gnome.jpg h1 (tahmin) |
| `gnome-kadin-barbarian-ID2` | 0.56 | barbarian-female-gnome.jpg h2 (tahmin) |
| `gnome-kadin-barbarian-ID7` | 0.57 | barbarian-female-gnome.jpg h7 (tahmin) |
| `gnome-kadin-barbarian-ID8` | 0.57 | barbarian-female-aurasiz.jpg h5 |
| `gnome-kadin-barbarian-ID9` | 0.57 | barbarian-female-gnome.jpg h9 (tahmin) |
| `gnome-kadin-barbarian-ID4` | 0.58 | barbarian-female-gnome.jpg h4 (tahmin) |
| `gnome-kadin-barbarian-ID5` | 0.58 | barbarian-female-gnome.jpg h5 (tahmin) |
| `gnome-kadin-barbarian-ID6` | 0.58 | barbarian-female-gnome.jpg h6 (tahmin) |
| `gnome-kadin-barbarian-ID3` | 0.59 | barbarian-female-gnome.jpg h3 (tahmin) |

### 1c. Zemin kalıntısı, kopuk parça, bulanıklık

- Yeşil (kroma) kenar pikseli ≥ 400 olan 66 jeton ölçüldü; ırk sayfalarında bakılanlar kasıtlı yeşil efekt (aura, büyü, zehir): kalıntı görmedim. Ölçü listesi `veri/dosya.json` `yesil`. **Tek tek yakın bakılmadı.**
- Beyaz hale (1 px kenarın beyaz oranı) en yüksek: `celestial-erkek-wizard-WZ-B5` 0.168, `orc-erkek-sorcerer-SC-9` 0.091, `human-erkek-wizard-WZ-B1` 0.079, `orc-kadin-warlock-WL-10` 0.072, `goliath-female-sorcerer` 0.061, `celestial-erkek-wizard-WZ-B7` 0.059 — kar/bulut/beyaz cüppe çizimi; ırk sayfalarında hale görmedim.
- Bulanıklık: keskinlik (iç gradyan p90) en düşük jetonlar Sorcerer **SC-5** (gölge biçimi, kasıtlı yumuşak) ve Monk ID8 (duman); bulanık kesim görmedim.
- Kopuk küçük parçalar yarık kusurlarıyla birlikte (`veri/dosya.json` `parca`); ayrıca bakılmadı.

### 1d. Kesim betiklerinde aynı tuzak

- `scripts/toplu-kesim.py` `trim_lines` (2026-11-22 düzeltmesi) hâlâ: kutunun üst/alt 16 px bandına değen ≥ 40 px yatay koyu şeridi ve sol/sağ banda değen dikey koyu şeridi siliyor. Kutu = figürün kendi sınırı olduğundan ayak tabanı, yere değen koyu gölge, başın üstündeki yatay asa/şapka siperi, figürün yanındaki dikey asa/mızrak sapı hâlâ silinebilir.
- `scripts/cc-kesim.py` `keyed_rgba` her figür kutusunda aynı `tk.trim_lines`'ı çağırır: düzeltmeden önce kesilen bütün CC jetonları (Warlock sayfaları, Gladyatör, Celestial Cleric 4bdedcaf) eski davranışla kesildi.
- `scripts/toplu-kesim.py` `drop_lines`: yorumu "yalnız koyu ince çizgiler" diyor ama kod renkten bağımsız (`fg` üstünde 1×60 / 60×1 açma); 16×16 dolu bölgeye 3 px'ten uzak her ince uzun parça (mızrak, yay kirişi, asa, kılıç namlusu) sayfa düzeyinde silinir. Öneri: `dk` (koyu) ile kesişim ve uzunluk eşiğini ızgara çizgisine göre (≥ 300 px) sınırlamak.

## 2. Kırpılma

### 2a. Dosyada

- **`celestial-kadin-sorcerer-SC-9`** (bozuk): silindir şapka tuvalin üst kenarında düz kesik (satır 0'da 164 opak piksel). Kaynak: hale-gemini-sayfa-26.png h2. Öneri: daha küçük ölçekle yeniden yerleştirme ya da ham hücreden yeniden kesim.
- `dwarf-kadin-cleric-ID9` (şüpheli): hale halkasının üst noktası tuval kenarına değiyor (7 px).
- Üst kenarı düz ve konturuz 130 jetonun hepsine bakıldı (`bas-tepe.png`): silindir şapka, miğfer, kapüşon, bayrak, kar başlığı, hale çizgisi: doğal; kafası traşlanmış başka jeton yok. Sol/sağ kenara değen 13+13 jeton silah/efekt ucu.

### 2b. Oyunda: rozet çerçevesi (LookFrame + AvatarBadge)

Savaş jetonu (`TokenFigure`) ve karakter ekranı figürü (`CharacterFigure`, taç/kanat kutusu dahil) kırpmıyor. Rozet (`.avatar`: daire, `overflow: hidden`, 3 px kenarlık) dairenin dışını kesiyor; kırpmasız çizimle farkı ölçüldü. Başın üstünde (orta ±18 px bant, figür tepesinden 30 px) kesilen piksel ≥ 10 olan **69** jeton (en çok: uzun şapka, kapüşon ucu, sivri saç, taç). Örnekler `rozet-bas.png`. Celestial yıldız tacı kırpılmıyor (`has-crown` taşmaya izin veriyor). Öneri: rozette figürü ayak çizgisinden %6–8 küçültmek ya da üst yarıda `overflow: visible` (taçtaki gibi).

Rozet kırpması ≥ 10 px (en çok kesilen önce): `goliath-erkek-rogue-ID10` 34, `dwarf-male-wizard` 33, `gnome-female-warlock` 32, `halfling-erkek-rogue-ID10` 30, `human-erkek-rogue-ID10` 26, `tiefling-female-wizard` 25, `goliath-male-warlock` 25, `gnome-male-warlock` 25, `tiefling-erkek-druid-ID5` 23, `halfling-erkek-druid-ID5` 22, `orc-erkek-rogue-ID10` 21, `elf-erkek-warlock-WL-11` 21, `tiefling-male-warlock` 19, `goliath-female-warlock` 19, `dwarf-female-wizard` 19, `orc-male-wizard` 18, `human-erkek-warlock-WL-11` 18, `human-male-warlock` 17, `human-kadin-druid-ID5` 17, `tiefling-male-wizard` 16, `orc-kadin-druid-ID5` 16, `orc-erkek-rogue-ID9` 16, `goliath-erkek-druid-ID6` 16, `elf-erkek-rogue-ID10` 16, `tiefling-erkek-rogue-ID9` 15, `goliath-erkek-rogue-ID9` 15, `dwarf-kadin-rogue-ID9` 15, `orc-male-warlock` 14, `halfling-kadin-druid-ID4` 14, `gnome-female-wizard` 14, `dwarf-male-warlock` 14, `dragonborn-erkek-rogue-ID10` 14, `human-kadin-druid-ID4` 13, `halfling-male-warlock` 13, `halfling-kadin-druid-ID5` 13, `gnome-erkek-druid-ID5` 13, `celestial-kadin-druid-ID5` 13, `tiefling-kadin-druid-ID5` 12, `tiefling-erkek-rogue-ID10` 12, `human-erkek-rogue-ID9` 12, `halfling-male-wizard` 12, `halfling-erkek-druid-ID6` 12, `gnome-erkek-warlock-WL-11` 12, `dragonborn-kadin-druid-ID5` 12, `dragonborn-erkek-rogue-ID9` 12, `celestial-kadin-sorcerer-SC-9` 12, `tiefling-erkek-warlock-WL-11` 11, `human-male-wizard` 11, `human-erkek-druid-ID6` 11, `human-erkek-druid-ID5` 11, `goliath-kadin-druid-ID5` 11, `goliath-female-wizard` 11, `elf-kadin-druid-ID5` 11, `dwarf-kadin-warlock-WL-11` 11, `dragonborn-kadin-rogue-ID10` 11, `celestial-male-wizard` 11, `tiefling-kadin-druid-ID4` 10, `tiefling-erkek-druid-ID6` 10, `orc-kadin-warlock-WL-11` 10, `orc-female-wizard` 10, `halfling-erkek-warlock-WL-11` 10, `elf-male-wizard` 10, `elf-female-wizard` 10, `dwarf-erkek-rogue-ID10` 10, `dragonborn-kadin-warlock-WL-11` 10, `dragonborn-kadin-rogue-ID9` 10, `dragonborn-kadin-druid-ID6` 10, `dragonborn-erkek-warlock-WL-11` 10, `dragonborn-erkek-druid-ID5` 10

## 3. Ten tonu

- **`human-erkek-fighter-GR`** (bozuk): eller maskede yok; yüz Altın/Koyu tona boyanırken eller ham kahverengi kalıyor (Altın ΔL ≈ −52). Kullanıcının gördüğü hata. Tenhausser (Koyu) tonda da yüz–el ayrımı (ΔL −19…−25) belirgin. Öneri: elle maskeye (`assets/soy-maske-el/`) iki eli eklemek ya da eldiven olarak bırakılacaksa Orijinal tonda da yüzle uyumlu hâle getirmek (karar kullanıcıda).
- Human 290 jeton × 3 ton (Orijinal | Koyu | Altın) yan yana: `ten-human-1…5.png`. **1–2. sayfalara (120 jeton) gözle bakıldı**: başka belirgin yüz–el uyumsuzluğu görmedim; 100 px'te el ayrıntısı sınırda. **3–5. sayfalara (170 jeton) bakılmadı** (otomatik ölçü güvenilmez çıktı: saç örgüsü/deri giysi el sanılıyor).
- Maskeli öteki ırklarda (Drow, Tiefling, Gnome) yüz ile maskedeki öteki parçaların (el, kol, boyun) boyalı hâldeki farkı: aynı boyadan geçtikleri için ΔE ≤ 16 (`veri/boya-olcum.json` `parcalar`); boyanmamış ten parçaları boya sayfalarında sarıyla işaretli ve aşağıdaki "yanlış yer boyama" listelerinde.

## 4. Yanlış yer boyama (maske kıyafet/saç/eşya üstünde ya da yüz dışarıda)

Boya haritası: yeşil = ten renginde boyanan, kırmızı = ten dışı renkte boyanan (ham renk baştaki tenden ΔE > 32), sarı = boyanmamış ten. Maske jeton başına tek dosya olduğundan liste o ırkın bütün boyalı soylarında geçerli (Human Koyu/Altın; Tiefling Abyssal/Chthonic/Winged; Elf Drow; Gnome Yeraltı). Ölçü sütunu: ten dışı boyanan oranı / baştaki tenin boyanmayan oranı.

### elf/drow

| Durum | Jeton | Ten dışı / yüz boyasız | Boyanan ham renk | Kaynak |
|---|---|---|---|---|
| bozuk | `elf-kadin-barbarian-ID4` | 0.86 / 0.99 | #814a33 | barbarian-female-elf.jpg h4 (tahmin) |
| bozuk | `elf-erkek-bard-ID7` | 0.96 / 0.99 | #816c63 | bard-male-elf.jpg h7 (tahmin) |
| bozuk | `elf-kadin-bard-ID7` | 0.39 / 0.96 | #645048 | bard-female-elf.jpg h7 (tahmin) |
| bozuk | `elf-erkek-fighter-ID10` | 0.02 / 0.01 | #7a5653 | fighter-male-elf.jpg h10 (tahmin) |
| bozuk | `elf-erkek-rogue-ID4` | 0.00 / 0.14 |  | rogue-male-elf.jpg h4 (tahmin) |
| bozuk | `elf-kadin-rogue-ID4` | 0.00 / 0.29 |  | rogue-female-elf.jpg h4 (tahmin) |
| bozuk | `elf-erkek-rogue-ID8` | 0.00 / 0.02 |  | rogue-male-elf.jpg h8 (tahmin) |
| bozuk | `elf-kadin-rogue-ID8` | 0.00 / 0.04 |  | rogue-female-elf.jpg h8 (tahmin) |
| bozuk | `elf-kadin-sorcerer-SC-3` | 0.16 / 0.03 | #6d5e50 | sorcerer-female-elf.jpg h3 (tahmin) |
| bozuk | `elf-kadin-sorcerer-SC-9` | 0.00 / 1.00 |  | sorcerer-female-elf.jpg h9 (tahmin) |
| bozuk | `elf-erkek-warlock-WL-3` | 0.88 / 1.00 | #644b37 | warlock-male-elf.jpg h3 |
| supheli | `elf-erkek-barbarian-ID4` | 0.07 / 0.54 | #aa5742 | barbarian-male-elf.jpg h4 (tahmin) |
| supheli | `elf-kadin-cleric-ID1` | 0.15 / 0.95 | #b9695d | cleric-female-elf.jpg h1 (tahmin) |
| supheli | `elf-erkek-druid-ID4` | 0.05 / 0.86 | #633f3a | druid-male-elf.jpg h4 (tahmin) |
| supheli | `elf-kadin-druid-ID4` | 0.57 / 0.00 | #5c4a3d | druid-female-elf.jpg h4 (tahmin) |
| supheli | `elf-kadin-druid-ID8` | 0.05 / 0.02 | #9f484e | druid-female-elf.jpg h8 (tahmin) |
| supheli | `elf-erkek-paladin-ID2` | 0.09 / 0.01 | #8a5641 | paladin-male-elf.jpg h2 (tahmin) |
| supheli | `elf-kadin-paladin-ID2` | 0.05 / 0.01 | #aa4b46 | paladin-female-elf.jpg h2 (tahmin) |
| supheli | `elf-erkek-paladin-ID8` | 0.04 / 0.66 | #ffd987 | paladin-male-elf.jpg h8 (tahmin) |
| supheli | `elf-kadin-paladin-ID8` | 0.07 / 0.97 | #af5352 | paladin-female-elf.jpg h8 (tahmin) |
| supheli | `elf-erkek-warlock-WL-4` | 0.04 / 0.80 | #604b4b | warlock-male-elf.jpg h4 |
| supheli | `elf-kadin-warlock-WL-4` | 0.00 / 0.00 |  | warlock-female-elf.jpg h4 |
| supheli | `elf-kadin-warlock-WL-8` | 0.05 / 0.14 | #68554a | warlock-female-elf.jpg h8 |

### human/ten-siyahi

| Durum | Jeton | Ten dışı / yüz boyasız | Boyanan ham renk | Kaynak |
|---|---|---|---|---|
| bozuk | `human-erkek-barbarian-ID4` | 0.32 / 0.53 | #c56958 | barbarian-male-human.jpg h4 (tahmin) |
| bozuk | `human-kadin-fighter-ID1` | 0.22 / 0.00 | #5e4a3b | fighter-female-human.jpg h1 |
| bozuk | `human-kadin-fighter-ID10` | 0.02 / 0.00 | #87795b | fighter-female-human.jpg h10 |
| bozuk | `human-kadin-fighter-ID3` | 0.06 / 0.00 | #9b4330 | fighter-female-human.jpg h3 |
| bozuk | `human-erkek-rogue-ID4` | 0.00 / 0.14 |  | rogue-male-human.jpg h4 (tahmin) |
| bozuk | `human-kadin-rogue-ID8` | 0.03 / 0.17 | #7b6a62 | rogue-female-human.jpg h8 (tahmin) |
| bozuk | `human-erkek-sorcerer-SC-3` | 0.10 / 0.40 | #75563f | sorcerer-male-human.jpg h3 (tahmin) |
| bozuk | `human-erkek-sorcerer-SC-9` | 0.01 / 0.07 | #45494e | sorcerer-male-human.jpg h9 (tahmin) |
| bozuk | `human-kadin-sorcerer-SC-9` | 0.00 / 0.70 |  | sorcerer-duzelt-C-sonuc.jpg h8 |
| bozuk | `human-erkek-warlock-WL-3` | 0.75 / 0.98 | #5b4c3c | warlock-male-human.jpg h3 |
| bozuk | `human-kadin-warlock-WL-3` | 0.99 / 1.00 | #584936 | warlock-female-human.jpg h3 |
| bozuk | `human-erkek-wizard-WZ-A3` | 0.14 / 0.46 | #894139 | wizard-male-human.jpg hA3 (tahmin) |
| supheli | `human-kadin-barbarian-ID4` | 0.12 / 0.94 | #d37566 | barbarian-female-human.jpg h4 (tahmin) |
| supheli | `human-erkek-bard-ID7` | 0.08 / 1.00 | #5c4b3c | bard-male-human.jpg h7 (tahmin) |
| supheli | `human-erkek-cleric-ID1` | 0.07 / 0.15 | #a96151 | cleric-male-human.jpg h1 (tahmin) |
| supheli | `human-kadin-cleric-ID1` | 0.09 / 0.50 | #9e6455 | cleric-female-human.jpg h1 (tahmin) |
| supheli | `human-erkek-druid-ID4` | 0.92 / 0.98 | #6a4a36 | druid-male-human.jpg h4 (tahmin) |
| supheli | `human-erkek-fighter-ID10` | 0.03 / 0.87 | #867763 | fighter-male-human.jpg h10 |
| supheli | `human-kadin-paladin-ID2` | 0.08 / 0.00 | #8e5f47 | paladin-female-human.jpg h2 (tahmin) |
| supheli | `human-erkek-paladin-ID8` | 0.06 / 0.41 | #72402d | paladin-male-human.jpg h8 (tahmin) |
| supheli | `human-kadin-paladin-ID8` | 0.16 / 0.78 | #7b3922 | paladin-female-human.jpg h8 (tahmin) |
| supheli | `human-kadin-rogue-ID10` | 0.38 / 0.89 | #773a2c | rogue-female-human.jpg h10 (tahmin) |
| supheli | `human-kadin-rogue-ID4` | 0.00 / 0.26 |  | rogue-female-human.jpg h4 (tahmin) |
| supheli | `human-kadin-sorcerer-SC-3` | 0.02 / 0.07 | #8b6e6f | sorcerer-duzelt-B-sonuc.jpg h3 |
| supheli | `human-erkek-warlock-WL-4` | 1.00 / 1.00 | #81422d | warlock-male-human.jpg h4 |
| supheli | `human-kadin-warlock-WL-4` | 0.00 / 0.00 |  | warlock-female-human.jpg h4 |

### tiefling/abyssal

| Durum | Jeton | Ten dışı / yüz boyasız | Boyanan ham renk | Kaynak |
|---|---|---|---|---|
| bozuk | `tiefling-kadin-bard-ID7` | 0.19 / 0.58 | #ac3659 | bard-female-tiefling.jpg h7 (tahmin) |
| bozuk | `tiefling-erkek-fighter-ID2` | 0.14 / 1.00 | #858aa8 | fighter-male-tiefling.jpg h2 (tahmin) |
| bozuk | `tiefling-erkek-rogue-ID3` | 0.10 / 0.11 | #9e234e | rogue-male-tiefling.jpg h3 (tahmin) |
| bozuk | `tiefling-kadin-rogue-ID3` | 0.00 / 0.50 |  | rogue-female-tiefling.jpg h3 (tahmin) |
| bozuk | `tiefling-erkek-sorcerer-SC-2` | 0.14 / 0.54 | #b42c21 | sorcerer-male-tiefling.jpg h2 (tahmin) |
| bozuk | `tiefling-erkek-sorcerer-SC-3` | 0.06 / 0.99 | #de7b85 | sorcerer-male-tiefling.jpg h3 (tahmin) |
| bozuk | `tiefling-erkek-sorcerer-SC-9` | 0.80 / 0.98 | #b88e96 | sorcerer-duzelt-C-sonuc.jpg h3 |
| bozuk | `tiefling-kadin-sorcerer-SC-9` | 0.98 / 1.00 | #d0a5a9 | sorcerer-duzelt-C-sonuc.jpg h9 |
| bozuk | `tiefling-erkek-warlock-WL-7` | 0.88 / 1.00 | #8f82a6 | warlock-male-tiefling.jpg h7 |
| bozuk | `tiefling-kadin-warlock-WL-7` | 1.00 / 1.00 | #afacd5 | warlock-female-tiefling.jpg h7 |
| bozuk | `tiefling-erkek-wizard-GR` | 0.11 / 0.18 | #ad2b53 | Gariban sayfası (tiefling male) (tahmin) |
| supheli | `tiefling-erkek-barbarian-ID8` | 0.08 / 0.39 | #b3325a | barbarian-male-aurasiz.jpg h7 |
| supheli | `tiefling-kadin-barbarian-ID8` | 0.25 / 0.65 | #b02e5a | barbarian-female-aurasiz.jpg h7 |
| supheli | `tiefling-kadin-bard-ID1` | 0.24 / 0.49 | #b6375e | bard-female-tiefling.jpg h1 (tahmin) |
| supheli | `tiefling-erkek-cleric-ID9` | 0.00 / 0.12 |  | cleric-id9-halka/aday + kalın halka h9 |
| supheli | `tiefling-kadin-monk-ID10` | 0.00 / 1.00 |  | monk-female-tiefling.jpg h10 (tahmin) |
| supheli | `tiefling-erkek-monk-ID11` | 0.40 / 1.00 | #e15a57 | monk-male-tiefling.jpg h11 (tahmin) |
| supheli | `tiefling-kadin-monk-ID9` | 0.41 / 0.89 | #a93558 | monk-female-tiefling.jpg h9 (tahmin) |
| supheli | `tiefling-erkek-warlock-WL-4` | 0.01 / 0.94 |  | warlock-male-tiefling.jpg h4 |
| supheli | `tiefling-erkek-fighter-ID4` | 0.33 / 0.44 | #cb4c51 | fighter-male-tiefling.jpg h4 (tahmin) |
| supheli | `tiefling-kadin-fighter-ID4` | 0.31 / 0.73 | #c13d68 | fighter-female-tiefling.jpg h4 (tahmin) |
| supheli | `tiefling-erkek-fighter-ID5` | 0.18 / 0.69 | #d24741 | fighter-male-tiefling.jpg h5 (tahmin) |
| supheli | `tiefling-kadin-fighter-ID5` | 0.01 / 0.28 | #c7386a | fighter-female-tiefling.jpg h5 (tahmin) |

### gnome/subterranean

| Durum | Jeton | Ten dışı / yüz boyasız | Boyanan ham renk | Kaynak |
|---|---|---|---|---|
| bozuk | `gnome-kadin-fighter-ID1` | 0.00 / 0.05 |  | fighter-female-gnome.jpg h1 (tahmin) |
| bozuk | `gnome-kadin-fighter-ID10` | 0.00 / 0.64 |  | fighter-female-gnome.jpg h10 (tahmin) |
| bozuk | `gnome-erkek-rogue-ID4` | 0.39 / 0.94 | #624c36 | rogue-male-gnome.jpg h4 (tahmin) |
| bozuk | `gnome-kadin-rogue-ID4` | 0.00 / 0.98 |  | rogue-female-gnome.jpg h4 (tahmin) |
| bozuk | `gnome-erkek-rogue-ID8` | 0.00 / 0.09 |  | rogue-male-gnome.jpg h8 (tahmin) |
| bozuk | `gnome-kadin-rogue-ID8` | 0.00 / 0.12 |  | rogue-female-gnome.jpg h8 (tahmin) |
| bozuk | `gnome-erkek-sorcerer-SC-3` | 0.91 / 1.00 | #715045 | sorcerer-male-gnome.jpg h3 (tahmin) |
| bozuk | `gnome-kadin-sorcerer-SC-9` | 0.00 / 0.43 |  | sorcerer-female-gnome.jpg h9 (tahmin) |
| bozuk | `gnome-erkek-wizard-GR` | 0.95 / 1.00 | #7d685e | Gariban sayfası (gnome male) (tahmin) |
| supheli | `gnome-erkek-barbarian-ID4` | 0.00 / 1.00 |  | barbarian-male-gnome.jpg h4 (tahmin) |
| supheli | `gnome-erkek-bard-ID3` | 0.00 / 0.95 |  | erkek-5'li.jpg h4 |
| supheli | `gnome-erkek-bard-ID7` | 0.00 / 0.12 |  | bard-male-gnome.jpg h7 (tahmin) |
| supheli | `gnome-kadin-bard-ID7` | 0.05 / 0.99 | #5a453c | bard-female-gnome.jpg h7 (tahmin) |
| supheli | `gnome-erkek-druid-ID4` | 0.50 / 1.00 | #6f4638 | druid-male-gnome.jpg h4 (tahmin) |
| supheli | `gnome-kadin-druid-ID4` | 0.17 / 1.00 | #5a483c | druid-female-gnome.jpg h4 (tahmin) |
| supheli | `gnome-erkek-fighter-ID5` | 0.00 / 0.68 |  | fighter-male-gnome.jpg h5 (tahmin) |
| supheli | `gnome-kadin-sorcerer-SC-3` | 0.00 / 0.78 |  | sorcerer-female-gnome.jpg h3 (tahmin) |
| supheli | `gnome-erkek-warlock-WL-4` | 0.23 / 1.00 | #5f5347 | warlock-male-gnome.jpg h4 |
| supheli | `gnome-kadin-warlock-WL-4` | 0.00 / 0.99 |  | warlock-female-gnome.jpg h4 (tahmin) |
| supheli | `gnome-kadin-warlock-WL-8` | 0.00 / 0.53 |  | warlock-female-gnome.jpg h8 (tahmin) |

Öneri: maskesi bozuk jetonlar için `assets/soy-maske-el/` elle maske (yüz + eller + boyun; kıyafet/saç/eşya dışarıda) ya da `npm run soy-maske-ice`. Yüzü olmayan çizimler (iskelet, korkuluk maskesi, gölge, hayalet) için bilerek boş maske (Human'daki 5 jeton gibi).

- **High Elf** maskesiz HSL yolu (`soy-renkleri.json` `elf.lineages.high-elf`): ten tonu aralığındaki **bütün** pikseller (saç, deri, ahşap dahil) hafifçe kayıyor; tasarım gereği, etkisi küçük (s ×0,7, l ×1,08). 1. sayfaya bakıldı, ayrı listelenmedi.
- **Goliath**: otomatik maske ırkta kapalı (`otoMaske: false`), bütün jetona soy filtresi; seçim bekliyor (ayrı görev). Orc, Dwarf, Halfling: boya yok (filtre ya da orijinal).

## 5. Alfa kaybı (ham jeton ↔ oyunda çizilmiş)

- Boya (`tintedUrl`): 6720 boyalı çıktının hiçbirinde alfa değişmiyor (0 piksel).
- Savaş jetonu: oranlı soylarda (Halfling Kalın ×1,07/×0,93, Dwarf Knoll ×1,04) `image-rendering: pixelated` ölçeklemesi ince parçalardan piksel düşürüyor: **106** jetonda ≥ 20 piksel (en çok `halfling-erkek-wizard-WZ-A4` 93 px). Oransız soylarda kayıp 0. Bu yakın bakılmadı; silah ucu/ince asa incelmesi olabilir. Öneri: oranı bütün jeton yerine ölçeklenmiş kopya dosyayla vermek ya da `image-rendering: auto`.
- Rozet: çerçevenin kestiği pikseller bölüm 2b. Ham sayfa hücresi ↔ jeton kaybı (kesimde silinen) bölüm 1a (ham sayfalar yok; yarık ölçüsüyle).

## 6. Eski çizim (kaynak uyumu)

- Ham sayfalar (`sinif-sayfalari-final/Eksikler`, `assets-ham/`) bu ortamda **yok** (bulut kapsayıcısı; bağlı bilgisayar yok): kaynak karşılaştırması yeniden yapılamadı. Önceki iki denetimin bulguları git'le doğrulandı:
- **Kadın Tiefling Druid ID1, ID2, ID3, ID5, ID6, ID7, ID8** ve **erkek Tiefling Druid ID7**: dosyalar hâlâ 987fc6de (2026-11-16 toplu kesim); güncel `druid-female-tiefling.jpg` / `druid-male-tiefling.jpg` sayfalarından kesilmemiş (EKSIKLER-KAYNAK-DENETIM.md). Öneri: `cc-kesim.py` ile güncel sayfadan yeniden kesim.
- Celestial erkek Cleric ID1–ID6, ID8: 4bdedcaf (2026-11-22) ile kabul edilen sayfadan yeniden kesildi (güncel). Ancak bu kesim `trim_lines` düzeltmesinden (18a311bc) önce: yarık kusuru erkek Cleric ID8, belirsiz erkek ID4, ID6 (yeni kesilenlerden) ve ID7, kadın ID3 (bölüm 1a).
- Öteki 2900 jetonun "en güncel kabul edilmiş çizim mi" sorusu ham sayfa olmadan cevaplanamaz (bakılamadı).

## 7. Filtre ve kanat

- Maske varsa yedek filtre kapalı: boyası başarılı hiçbir jetonda yedek filtre yok (ölçüldü). Yedek filtreyle çizilenler (maske yok ya da boş HSL):
  - Goliath: bütün jetonlar × 6 soy (otomatik maske kapalı; ayrı görev, seçim bekliyor).
  - Gnome Yeraltı: `gnome-erkek-cleric-ID6`, `gnome-erkek-paladin-ID3`, `gnome-erkek-paladin-ID8`, `gnome-erkek-sorcerer-SC-5`, `gnome-erkek-sorcerer-SC-9`, `gnome-erkek-warlock-WL-10`, `gnome-kadin-monk-ID10`, `gnome-kadin-paladin-ID3`, `gnome-kadin-sorcerer-SC-5`, `gnome-kadin-warlock-WL-10`
  - Elf (Drow/High Elf): `elf-erkek-monk-ID10`, `elf-erkek-paladin-ID3`, `elf-erkek-sorcerer-SC-5`, `elf-erkek-sorcerer-SC-9`, `elf-erkek-warlock-WL-10`, `elf-kadin-monk-ID10`, `elf-kadin-paladin-ID3`, `elf-kadin-sorcerer-SC-5`, `elf-kadin-warlock-WL-10`
  - Tiefling: `tiefling-erkek-druid-ID4`, `tiefling-erkek-sorcerer-SC-5`, `tiefling-kadin-druid-ID4`
  - Human: yok. Bilerek boş maske (çıplak ten yok, boyasız): Paladin ID3 erkek/kadın, Sorcerer SC-5 erkek, Warlock WL-10 erkek/kadın (beklenen 5 jeton, doğrulandı). Elf'te de boş maske: Sorcerer SC-5 e/k, Warlock WL-10 e/k, WL-4 e/k, Paladin ID3 kadın.
- Kanat (gerçek tarayıcıda uçarken, `kanat-0.png`): Dragonborn 10 soyun her biri kendi renginde (beyaz kalan yok); Dragonborn Cleric ID1 kendi melek kanadıyla çizili, ejderha kanadı eklenmiyor (doğru). Tiefling Kanatlı mor (#9d5793), Celestial Kırık Kanat beyaz-gri (#e7e7e7; tasarım). Celestial Gece Gözyaşı gri filtresi ve hale gizleme çözücüden.
- Orc, Goliath, Dwarf, Gnome maske işi ayrı görevde: yalnız mevcut durum (Orc/Dwarf soy filtresi, Gnome Yeraltı maskeli, Goliath yedek filtre).

## 8. Eşleme ve oyunda görünen hâl

- Dragonborn eski sınıf-genel jetonları: **hiçbir kombinasyonda kullanılmıyor** (alt sınıfsız 5. seviyede de Gariban jetonu). Doğrulandı.
- Sınıf-genel jetonlar yalnız "alt sınıfsız seviye ≥ 3" satırında (720 kombinasyon; oluşturucu alt sınıf istediği için yalnız eski kayıt).
- Birlik Manastırı Cleric < 17 → ID3, 17+ → ID9; Gladyatör = Champion → Fighter ID12; Pehlivan 10+ → ID5; kadın İmparator ve erkek Karadul kombinasyonu yok (normal). Hepsi doğrulandı. Kadın Gnome beyaz saç bilinçli (Gnome sayfalarında kadınlar beyaz saçlı).
- Eksik jeton dosyası: 0 (her kombinasyonun jetonu var).
- Hapishane mahkûm kıyafeti (`outfit-mahkum`: Monk jetonu + sepya filtre): ayrıca çizilmedi; **bakılmadı** (Monk jetonları savaş jetonu ve ırk sayfalarında bakıldı).

## Kapsam dışı / bakılamayanlar

- Ham sınıf sayfaları (Windows `C:\Users\90546\OneDrive\Masaüstü\sinif-sayfalari-final\Eksikler`, `assets-ham/`): bu ortamda yok → kaynak uyumu (madde 3) ve ham hücre ↔ jeton baş yüksekliği karşılaştırması yapılamadı; eksik sayfalar (sayfa 30: 8 erkek Wizard vb.) da denetlenemedi.
- Human ten sayfaları 3–5 (170 jeton) gözle bakılmadı; High Elf boya sayfaları 2–4 bakılmadı.
- Yeşil kenar ölçüsü yüksek 736 jetona ayrı yakın bakılmadı (ırk sayfalarında genel bakış).
- Oranlı soyların savaş jetonu piksel kaybı (106 jeton) yakın bakılmadı.
- Ölçüm ve kontak sayfaları: `gorsel-dokum/jeton-denetim/` (git dışı); yeniden üretim `python scripts/jeton-denetim.py --ciz`.

