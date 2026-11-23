# MASKE-EK: liste dışı kalan boyama hataları ve 7 ırk taraması (2026-11-23)

Yalnız görünüm; kural ve kayıt sürümü değişmedi. Yöntem MASKE-DUZELT ile aynı: `python scripts/maske-duzelt.py` (PYTHONUTF8=1), jeton
kararları `data/maske-duzelt.json` `jetonlar` (`neden`: `ek:liste` görevdeki liste, `ek:tarama` taramadan, `ek:sac` Tiefling saçı).
`npm run soy-maske` **çalıştırılmadı**; Dragonborn, Celestial, Halfling maskelerine ve elle maskelere (`assets/soy-maske-el/`,
`public/characters/maske-el/`) dokunulmadı. Toplam **99 jeton**: 87 maske yeniden yazıldı, 12 jetona ilk kez (bilerek boş) dosya.

## 1. Görevdeki liste (7)

| Jeton | Önce | Karar |
|---|---|---|
| `elf-erkek-warlock-WL-8`, `human-erkek-warlock-WL-8`, `human-kadin-warlock-WL-8` | ghoul: bütün figür, peştemal/elbise, sakal benekli boyalı | MASKE-DUZELT kadın SC-9 ghoul kararı: yüz, kulak, eller (sakal, peştemal, kürk yaka, gövde dışarıda) |
| `tiefling-erkek-warlock-WL-8`, `tiefling-kadin-warlock-WL-8` | gövde, sakal, kuyruk boyalı | aynı karar + Tiefling SC-2 kararı: yüz, kulak, boynuz, eller |
| `tiefling-kadin-sorcerer-SC-5` | gölge, bütünüyle | `bos` (diğer ırklarda olduğu gibi) |
| `tiefling-kadin-barbarian-ID3` | koyu mor saç uçları boyalı | ton 318°–30°, açıklık ≥ 32: saç dışarıda; yüz, boynuz, kol, bacak, kuyruk kalır |

Kullanıcının ek listesi görevde boş geldi (yer tutucu doldurulmamıştı); onun yerine aşağıdaki tarama yapıldı.

## 2. Tarama (Elf, Human, Tiefling, Orc, Goliath, Dwarf, Gnome: 2030 jeton)

`python scripts/maske-tarama.py --json <çıktı> [--kontak <klasör> --en-cok 120]`. `jeton-denetim.py --asama boya` krem kapüşonu ten
sayabildiğinden kullanılmadı: ten referansı jetonun **yüzünden** (maske-duzelt.py'nin tohumu, maske dosyasından bağımsız). Ölçüler:

- **a** alan: maske / opak piksel, aynı ırk + cinsiyetin medyanına göre MAD z-puanı (z > 3 büyük, < −2,2 küçük);
- **b** ten dışı: maske piksellerinden yüz referansına ΔE > 30 ve ten ailesi dışında (ton farkı > 30° ya da kroma < referans × 0,35) olanların oranı ≥ 0,12;
- **c** yüz boyasız: yüz tohumunun maskede olmayan oranı ≥ 0,6 (bilerek boş değilse);
- **d** tensiz çizim kalıbı (azrail Cleric ID6, ağaç Druid ID4, SC-3/5/9, WL-4/10, ölü Monk ID10, kapalı miğfer Paladin ID3) ama maske dolu ya da dosya yok.

Şüpheliler puana göre sıralandı; en kötü **120** için kontak sayfası (jeton | maske | boyalı) ve gerekenlere 1,5×/3× ızgaralı yakın
görüntü üretilip **hepsine bakıldı**. Bakarken Tiefling'de sistematik bir hata çıktı (aşağıda), onun için ayrı ölçü (maskedeki 250°–320°
tonlu piksel oranı ≥ 0,02) bütün 290 Tiefling jetonuna uygulandı: 63 jeton (MASKE-DUZELT'in onayladığı 35 Tiefling jetonunun **hiçbiri**
bu ölçüde 0,05'i geçmiyor; ayrım temiz); 33'ü ilk 120'nin dışındaydı, hepsine önce/sonra bakıldı.

| Irk | Şüpheli (a–d) | İlk 120'de | Gerçekten bozuk (düzeltildi) | Kabul (ilk 120'de) |
|---|---|---|---|---|
| Elf | 44 | 26 | 13 | 13 |
| Human | 43 | 25 | 8 | 17 |
| Tiefling | 75 | 41 | 70 (37 ilk 120'den + 33 saç ölçüsünden) | 4 |
| Orc | 18 | 9 | 1 | 8 |
| Goliath | 10 | 3 | 0 | 3 |
| Dwarf | 18 | 6 | 0 | 6 |
| Gnome | 16 | 10 | 0 | 10 |
| **Toplam** | **224** | **120** | **92** | **61** |

(Görevdeki 7 jeton bu sayılara dahil değil. Orc/Goliath/Dwarf/Gnome TEN-MASKE-4-IRK'te zaten tek tek incelenmişti; şüphelileri çıplak
gövdeli Monk/Fighter/Barbarian ID4–ID5 ve bilinen Gemini jetonları.)

### Düzeltilenler

- **Tiefling saçı (60, `ek:sac`):** eski otomatik maske (soy-maske.ts) koyu mor saçı (ton ≈ 300°–318°) ten sayıyordu; çoğu kadın jetonu,
  birkaç erkek. Yeni maske yüz tonundan; `tenTon` (betiğe eklendi, yoksa eski davranış): ten pikselinin tonu 318°–18° (saç ve
  turuncu-kırmızı kumaş/kalkan/sancak dışarıda), gölge ve kuyruk için ton payı 30°, bileşen ΔE ≤ 30. Kızıl zırh/pelerin/kuşak/kalp
  efektli 10 jetonda ayrıca kutu (`yalniz`/`exclude`): Sorcerer (sınıf-genel kadın), Paladin ID3 (kapalı miğfer: yalnız boynuz; erkek
  Paladin ID3 de), ID5, ID6, ID9, Bard ID3, Wizard WZ-A2, Rogue ID6, Warlock WL-1.
- **Bilerek boş (26, `bos`):** maskesi hiç olmayan 12 jeton (Elf Monk ID10 e/k, Paladin ID3 e/k, SC-5 e/k, WL-10 e/k; Tiefling Druid ID4
  e/k, erkek SC-5) eskiden Drow/Tiefling soyunda **yedek CSS filtresiyle bütün jetonu boyuyordu** (önce dökümünde 18 görünüş); artık
  tümü 0 dosya, boyanmaz. Ayrıca maskesi dolu tensiz çizimler: azrail Cleric ID6 (Elf e/k, Human e/k, Tiefling e/k), hayalet WL-10 (Tiefling
  e/k), zombi WL-4 (Tiefling k; erkeği zaten boştu), ölü Monk ID10 (Human e, Tiefling e), ağaç Druid ID4 (Human k), gölge SC-5 (Human k,
  ve görevdeki Tiefling k), zombi çocuk SC-3 (Elf e; human-erkek SC-3 kararı).
- **Kutuyla (7):** `elf-erkek-sorcerer-SC-9` (maskesizdi, yedek filtre bütün jeton; ghoul kararı yüz, kulak, eller),
  `elf-kadin-fighter-ID6` ve `human-kadin-monk-ID8` (ninja: saç boyanıyordu; göz bandı, kulak, kol/eller), `human-erkek-monk-ID3` (sakal,
  saç, tunik boyanıyordu; sakal üstü yüz, kol, eller), `human-erkek-fighter-ID5` (eski maske yalnız kontur kenarı; yüz + çıplak gövde,
  kroma ≤ 50 ile alev ve parlak rünler dışarıda), `orc-kadin-monk-GR` (keikogi tenle aynı renkte; baş, boyun, üst kol),
  `tiefling-erkek-paladin-ID3`.

### Kabul (61; bakıldı, doğru)

Çıplak gövdeli Monk/Fighter/Barbarian (Elf, Human, Dwarf, Gnome, Orc, Goliath ID4/ID5/GR, Cleric ID9 keşiş): alan büyük ama hepsi ten.
MASKE-DUZELT/TEN-MASKE-4 kararları: Elf/Human kadın SC-9 ve Tiefling SC-9 e/k (ghoul/kafatası boyası), Tiefling SC-3 e/k (kırmızı tenli
çocuk: tenli). Bilinen Gemini: Barbarian ID4 (Elf e/k, Human e, Gnome e, Orc k). Elle maske (dokunulmadı): `human-erkek-sorcerer-SC-9`
(ghoul yüz + eller, doğru), `human-kadin-monk-ID10` (**not:** ölü Monk'un elle maskesi yüzü boyuyor; diğer bütün ırklarda bu çizim
bilerek boş. Karar kullanıcıda: elle maske silinir/boşaltılırsa tutarlı olur). Tam liste: `gorsel-dokum/maske-ek/tarama.json` ilk 120 eksi
`data/maske-duzelt.json` `ek:*` kayıtları.

## 3. Kanıt

Önce = HEAD `3f27dd91` ayrı çalışma ağacında, sonra = bu değişiklik; ikisi de `npx vite-node scripts/jeton-denetim-cizim.ts --yalniz boya`
(oyunun `tintedUrl` çıktısı + yedek filtre kaydı, 7880 görünüş). Karşılaştırma `python scripts/maske-ek-kanit.py <önce> <sonra> <çıktı>
<hedef listesi> [hariç listesi]`:

- **Hedef dışı görünüşler: 7587 / 7587 birebir aynı** (aynı boya kaydı, aynı PNG pikselleri; yalnız sonrada olan 0). 21 görünüş ayrı
  sayıldı: aynı saatlerde bu klasörde bu görevin dışında 10 yeni elle maske oluştu (aşağıda), onların jetonları.
- **Hedef görünüşler (272; maskeli 258, 14'ü maske kullanmayan High Elf HSL yolu):** boyalı jetonun ham jetondan farklı pikselleri yeni maskenin ya da çalışma anı onarımının
  (1 px komşuluk + çevrelenen delik) içinde; dışında kalan Tiefling'de görünüş başına ≈ 50 px (165 görünüş, 8544 px), Human 8 görünüşte
  186 px, Elf 3 görünüşte 21 px. Bunlar TB1 `fixSkinMask` gölge bandı (boynuz/kuyruğun koyu yarısı, kaş/göz çizgisi ince bileşenleri) ve
  `closeSkinHoles` pikselleri; örnek görüntüyle doğrulandı, saç/kıyafet değil.
- **Yedek filtre kalktı:** 18 görünüş (Elf 9, Tiefling 9) önce bütün-jeton CSS filtresiyle, sonra boyasız orijinal.
- **Gözle:** her hedefin ilk üç maskeli görünüşü önce | sonra (Human Koyu/Altın, Drow gradyan, Tiefling Abyssal/Chthonic/Winged)
  `gorsel-dokum/maske-ek/kanit/gorunus-*.png` (git dışı); hepsine bakıldı: saç, kıyafet, zırh, kumaş artık boyanmıyor.

## 4. Gemini'ye gidecekler (kullanıcı çalıştıracak)

Otomatik maskenin yaklaşık kaldığı 4 yeni jeton `data/maske-duzelt.json` `gemini`'ye eklendi: `orc-kadin-monk-GR` (kollar),
`human-kadin-monk-ID8` (göz bandının yarısı), `human-erkek-monk-ID3` (sakal üstü yüz), `tiefling-erkek-fighter-ID3` (boynuz, kuyruk).
Sayfalar (betiğe `--jeton` süzgeci eklendi):

```powershell
$env:PYTHONUTF8=1; python scripts/maske-duzelt.py --gemini gorsel-dokum/maske-ek/gemini --jeton orc-kadin-monk-GR,human-kadin-monk-ID8,human-erkek-monk-ID3,tiefling-erkek-fighter-ID3
```

Yönerge ve sonrası `MASKE-DUZELT.md` "Gemini'ye gidecekler" ile aynı.

## 5. Kesim sorunu (yalnız rapor): kadın Rogue ID4 macenta artığı

- **Nerede:** iki ayağın arasındaki kapalı cep (jetonda x 140–151, y 215–230) + alt kenarda pembe hale. Piksel: `elf-kadin-rogue-ID4`
  181 (cep 102, kenar 79, 53'ü yarı saydam), `human-kadin-rogue-ID4` 489 (cep 96, kenar 393, 252'si yarı saydam). Aynı hücre diğer
  ırklarda da: Dwarf 106, Halfling 108, Gnome 84, Orc 46, Tiefling 16, Dragonborn 33 (Goliath, Celestial ≈ 0).
- **Kaynak:** `origin/wip/karakter-ham` `assets-ham/karakter/rogue-female-<ırk>.jpg`, 4. hücre (x 1791–2331, y 58–594); cep ham sayfada
  x 2097–2126, y 512–548 (559 px), gölgede kalmış macenta: ortalama (239, 83, 229) Elf, (223, 76, 215) Human; hücre zemini (249, 2, 248).
- **Neden (anahtarlama):** `scripts/toplu-kesim.py` `key()` zemini kenardan taşma dolgusuyla (ΔE < `T_FLOOD` 80) alır; kenara bağlı olmayan
  delikleri yalnız ΔE < `T_HOLE` 45 ise siler. Cebin zemine ΔE'si 61–121 (medyan ≈ 80): ikisini de geçemiyor, figür sayılıyor. Kenardaki
  hale: despill bandı 2 px (`SPILL` 50, `PEEL_CHROMA` 90); yarı saydam kenarda ve küçültmede macenta karışıyor.
- **Düzeltme önerisi (kesim betiğinde, anahtarlamada):** kapalı delik geçişini renk mesafesi yerine macenta kromasıyla yapmak
  (min(R, B) − G ≥ ≈ 100 ve delik ≥ `HOLE_MIN`; cepte ≈ 146, figürün pembe/mor çizimleri bunun altında kalmalı, Wizard WZ-B3 pembe cüppesi
  gibi jetonlarla denetlenmeli) ve despill'i yarı saydam kenarda (alfa < 255) da uygulamak; sonra yalnız bu hücre `cc-kesim.py hucre`
  ya da `kesim-yenile.py` ile yeniden kesilir (maske hizası `eski` yerleşimle korunur). Jetonlar bu görevde değiştirilmedi.

## 6. Bu görevin dışında oluşan değişiklikler (commit'e girmedi)

Aynı klasörde 06:23–06:39 arasında 10 Gemini maskesi işlenmiş: `assets/soy-maske-ham/*.jpg`, `assets/soy-maske-el/*.png`,
`public/characters/maske-el/*.png` (Elf/Human Barbarian ID4 ve Rogue ID4 e/k, `human-erkek-fighter-GR`, `tiefling-erkek-sorcerer-SC-2`),
`data/soy-maske-rapor.json`, `data/soy-maske-yz.json`. Bu görev bunlara dokunmadı ve commit'e eklemedi.
