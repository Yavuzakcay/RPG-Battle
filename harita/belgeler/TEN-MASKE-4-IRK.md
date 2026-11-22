# TEN-MASKE-4-IRK: Orc, Goliath, Dwarf, Gnome ten maskesi (2026-11-23)

Yalnız görünüm; kural ve kayıt sürümü değişmedi. Bütün-jeton filtresinin yerine gerçek ten maskesi: soy rengi yalnız çıplak tene (yüz,
boyun, kol, el, görünen bacak); kıyafet, zırh, silah, kalkan, saç ve sakal aynen kalır. Diğer ırklara (Celestial, Human, Dragonborn,
Tiefling, Elf, Halfling) dokunulmadı.

## Envanter (önce → sonra)

| Irk | Soylar (boyasız kalın) | Jeton | Önce | Sonra |
|---|---|---|---|---|
| Orc | Glacier (Buzul), Fen (Bataklık), **Wildwood (Orman)** | 290 = 24 sınıf-genel + 266 alt sınıf/Gariban | maske yok; Glacier/Fen bütün jetona CSS filtresi (`alt-soy-gorunum.json`) | 290 maske (22 bilerek boş) |
| Goliath | Cloud, Fire, Frost, Hill, Storm, **Stone** | 290 | `otoMaske: false`: 6 soyun hepsi bütün jetona yedek filtre (`soy-filtre-yedek.json`); 285 eski baş maskesi kullanılmıyordu; kafa kaplaması (6 sınıf-genel) kapalı | 290 maske (23 bilerek boş); kafa kaplaması kapalı kalır |
| Dwarf | Crag (Dağ), Undervault (Yeraltı), **Knoll (Tepe)** | 290 | maske yok; Crag/Undervault bütün jetona CSS filtresi | 290 maske (22 bilerek boş) |
| Gnome | Rock, Subterranean (Yeraltı), **Forest** | 290 | Subterranean eski otomatik maskeyle (280 dosya; şapka/saç taşması), Rock ve Forest boyasız | 290 maske (23 boş: 22 bilerek + kamuflajlı kadın Rogue ID4) |

Boyasız soylar 2026-11-17 kararı: Goliath Stone, Gnome Forest, Dwarf Knoll (Tepe), Orc Wildwood. Gnome Rock artık boyalı; Goliath Stone'un
arduvaz hedefi kalktı, "her ırkta en az bir orijinal soy" kuralı Goliath'ta geri geldi.

## Renk

- Veri `data/soy-ten-renkleri.json` (`<ırk>/<soy>` → hex ya da null). Oyun bu dosyadan çizer: `src/battle/avatar.ts` `lineageTint` →
  `src/ui/lineageLook.ts` `hexTint` (Human ten tonuyla aynı yol: ton ve kroma hedefe, ortalama açıklık hedefin açıklığına, gölge/çizgi/ten
  detayı korunur). Goliath kadın Cloud'un K19 `contrast` ayarı (dövme okunurluğu) korunur.
- Başlangıç değerleri görevdeki öneri: Orc Glacier `#C3D6E0`, Fen `#5E5538`; Goliath Cloud `#D8DEE6`, Fire `#C4573B`, Frost `#8EC5E6`,
  Hill `#7F7A45`, Storm `#4A4E9A`; Dwarf Crag `#A9B7C4`, Undervault `#6A5F78`; Gnome Rock `#C98A5A`, Subterranean `#A39AB0`.
- **Seçim sayfası** (yalnız geliştirme): `npm run dev` → `/onizleme-ten.html`. Irk başına 3 temsilci jeton (çıplak kollu Barbarian GR,
  düz kıyafetli kadın Bard GR, zırhlı sınıf-genel Fighter), soy başına HEX kutusu + renk seçici + "Boyasız (orijinal)"; çizim oyunun kendi
  yolu (`tintedUrl`). "Dışa aktar" dosyanın içeriğini panoya kopyalar ve `soy-ten-renkleri.json` olarak indirir; `data/` altına koy.

## Maske üretimi

`python scripts/maske-duzelt.py --irk <orc|goliath|dwarf|gnome>` (PYTHONUTF8=1); MASKE-DUZELT'in betiği genişletildi (kopya yok).
`data/maske-duzelt.json` `irkTum` bu dört ırkı listeler: betik bunların bütün jetonlarını yazar, `npm run soy-maske` (`--alt` ve
sınıf-genel döngü) bunlara dokunmaz. Irk ayarları `irklar.<ırk>`, jeton kararları `jetonlar` (`neden: "ten4"`).

Yeni ayarlar (yoksa eski davranış, Elf/Human/Tiefling maskeleri değişmedi):

- `griKroma` + `abTol` (Goliath, erkek Orc): referans kroması düşükse ton belirsiz; gölge = ab düzleminde referansa yakın + açıklık bandı.
- `kromaUst` (Dwarf, Gnome, Orc): aynı ton ailesinde daha doygun pikseller (kızıl sakal/saç) ten sayılmaz.
- `buyume` + `buyumeDE` + `sacL`/`sacKroma` (Dwarf, Gnome, Orc): kesin tenden komşuya gölge rampası (koyu ve doygun saç/sakal dışarıda).
- `delik` (hepsi): maskenin çevrelediği ≤ 40 px ten adayı benekleri doldurulur.
- `parlakKenar` (Goliath, Orc): bileşeninin > %20'si parlak beyaz kenara (L ≥ 82, C < 8) yakınsa çelik sayılır (yüz bileşeni hariç).
- Jeton kutuları `basKutu` (yalnız yüz çevresi: gri çelik zırh/cüppe/silah tenle aynı renkte), `yalniz`, `exclude`, `seed`; kutular
  büyüme ve delik doldurmadan sonra da geçerli. `asiri` eşiği ırk başına (Orc/Dwarf/Gnome 0,55: çıplak gövdeli Barbarian/Fighter ID4).
- `--kontak <klasör> --irk <ırk>`: inceleme sayfaları (ham | maske | ilk boyalı renkte boya).

## Gözle inceleme (bütün 1160 jeton)

Her ırkın 290 jetonunun maske kaplaması (8 sayfa × 40 jeton) ve şüphelilerin 512 px ızgaralı yakın görüntüsü tek tek incelendi.

| Irk | Otomatik kabul | Jeton başına kutu | Bilerek boş | Gemini'ye (yaklaşık/eksik) |
|---|---|---|---|---|
| Orc | 258 | 10 | 22 | 7 |
| Goliath | 218 | 49 | 23 | 12 |
| Dwarf | 261 | 7 | 22 | 4 |
| Gnome | 261 | 6 | 22 (+1 kamuflajlı, otomatik boş) | 5 |

(Kutu ve Gemini kümeleri kesişir: Gemini'deki jetonların çoğunun şimdilik yaklaşık kutusu var.)

- **Bilerek boş** (çıplak teni olmayan çizim; dosya kalır, tümü 0: boyanmaz, yedek filtre de yok): azrail Cleric ID6, ağaç adam Druid ID4,
  zombi çocuk/hayalet Sorcerer SC-3, gölge SC-5, silindir şapkalı iskelet SC-9, zombi Warlock WL-4, ghoul WL-8, hayalet WL-10, ölü Monk
  ID10, kapalı miğfer Paladin ID3 (her ırk, iki cinsiyet; jetonu olmayanlar hariç), altın miğferli Paladin ID8 (Goliath, Dwarf), ateş
  derili Goliath kadın Fighter ID5.
- **Goliath:** gri ten çelik zırh, kılıç, balta, kalkan, gri cüppe ve kumaşla aynı renkte. Zırhlı/silahlı 42 jetonda (8 sınıf-genel dahil)
  maske yalnız yüz çevresi (`basKutu`; eldivenli eller ve çelik boyanmaz, açık eller de boyanmaz: boşluk, Gemini). 4 jetonda nötr gri
  ten için yüzden tohum, Paladin ID10 (beyaz kapüşon gölgesi), Wizard GR kadın (mavi-gri şapka/cüppe), Ranger ID8/ID9 (pala, orak) kutuyla.
- **Kalan taşma/boşluk (Gemini listesinde):** yaprak kamuflajlı Rogue ID4 (7), kemik/ahşap maskeli Barbarian ID4 (8), Orc Ranger GR
  erkek (yeşil kapüşon), Orc kadın Cleric ID4 ve Druid ID3, Goliath kadın Wizard GR, Goliath zırhlı sınıf-genel 8 jeton (eller),
  `gnome-male-warlock` (mor tenli çizim, yalnız eller).

## Kod

- `src/battle/avatar.ts` `lineageTint`: soyun kaydı `soy-ten-renkleri.json`'daysa oradan (null: boyasız).
- `src/ui/lineageLook.ts`: `hexTint` (Human `skinTint` de bunu kullanır, sonuç aynı), `LINEAGE_SKIN`, `lineageSkinHex`.
- Dwarf/Orc'un bütün-jeton filtreleri `alt-soy-gorunum.json`'dan `soy-filtre-yedek.json`'a taşındı (`eski: true`, adaysız): yalnız maske
  yüklenemezse uygulanır ("maske varsa filtre kapanır", `tint.ts` `fallbackFilterFor`). Goliath `otoMaske: false` kalktı; kafa
  kaplaması (`basKaplama.goliath.kapali`) kapalı kalır. `goliath/stone` yedek filtresi ve adayları kalktı (boyasız).

## Kanıt

Önce/sonra tarayıcı boya dökümü (`npx vite-node scripts/jeton-denetim-cizim.ts --yalniz boya`; önce = HEAD `476f5bde` ayrı çalışma
ağacında, sonra = bu değişiklik). Sonuçlar aşağıda (`scripts/ten4-kanit.py`).

- **Hedef dışı görünüşler** (Celestial, Human, Dragonborn, Tiefling, Elf, Halfling): **4690 / 4690 birebir aynı** (aynı anahtar, aynı
  PNG pikselleri, aynı yedek filtre; yalnız öncede ya da yalnız sonrada olan 0).
- **Hedef görünüşler (sonra, 3190):** boyalı jetonun ham jetondan farklı her pikseli ten maskesinin içinde. Opak piksel birebir, yarı
  saydam kenar ön-çarpılmış görünen değerle (tarayıcı tuvali ön-çarpılmış saklar), alfa birebir karşılaştırıldı.

  | Irk | Görünüş | Boyalı | Boş maske | Maske dışı değişen piksel |
  |---|---|---|---|---|
  | Orc | 580 | 536 | 44 | **0** |
  | Dwarf | 580 | 536 | 44 | **0** |
  | Gnome | 580 | 534 | 46 | **0** |
  | Goliath | 1450 | 1335 | 115 | 121 060 çalışma anı onarımı içinde (TG1 `fixSkinMask`: gri ten kutusunda 1 px kapama + ≤ 12 px delik); onarım modelinin dışında 15 görünüşte 1'er piksel (Lab yuvarlama sınırı) |

  Yani kıyafet, zırh, silah, saç ve sakal pikselleri değişmedi (Goliath'ta yalnız maskenin hemen kenarındaki gri ten kutusu pikselleri,
  bilinen onarım).
- **Gözle:** `gorsel-dokum/ten-maske-4/kanit/<ırk>.png` (git dışı; yeniden üretim aşağıda): her boyalı soy için 3 jeton (Barbarian GR,
  kadın Bard GR, sınıf-genel Fighter) önce | sonra. Önce bütün jeton (kıyafet, zırh, saç) renkleniyordu, sonra yalnız ten. (Goliath sınıf-genel
  Fighter'ın "önce" hücresi filtresiz: önceki dökümde bu görünüşün boya kaydı yok; oyunda yedek filtreyle çiziliyordu.)

```powershell
npx vite-node scripts/jeton-denetim-cizim.ts --yalniz boya
```

```powershell
$env:PYTHONUTF8=1; python scripts/ten4-kanit.py <önce>/gorsel-dokum/jeton-denetim gorsel-dokum/jeton-denetim gorsel-dokum/ten-maske-4/kanit
```

## Gemini'ye gidecekler (kullanıcı çalıştıracak)

28 jeton, `data/maske-duzelt.json` `gemini` (neden ve beklenen maske orada). Sayfalar (hücre 768 px):

```powershell
$env:PYTHONUTF8=1; python scripts/maske-duzelt.py --gemini gorsel-dokum/ten-maske-4/gemini --irk orc,goliath,dwarf,gnome
```

Her jeton için `<jeton>-sablon.png` (siyah zemin, jeton %35 saydam) ve `<jeton>-sayfa.png` (jeton | şimdiki maske taslağı). Yönerge
`harita/belgeler/MASKE-DUZELT.md` "Gemini'ye gidecekler" bölümündekiyle aynı (`<düzeltme>` yerine `gemini` satırı). Çıktı
`assets/soy-maske-ham/<jeton>.png`, sonra:

```powershell
npm run soy-maske-ice -- <jeton>
```

```powershell
npm run soy-maske -- --el
```

Elle maske (`maske-el/`) otomatik maskenin önüne geçer.
