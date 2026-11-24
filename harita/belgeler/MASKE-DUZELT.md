# MASKE-DUZELT: yeni kesime ve yüz tonuna göre ten maskesi (2026-11-22)

Yalnız görünüm; kural ve kayıt sürümü değişmedi. Üretici `python scripts/maske-duzelt.py` (PYTHONUTF8=1), veri `data/maske-duzelt.json`
(ırk ayarları, jeton başına neden/kutular/karar, `sonuc` piksel sayıları, `gemini` listesi, `ayri` liste). `npm run soy-maske` **tam
çalıştırılmadı**; `soy-maske -- --alt` bundan sonra bu listedeki jetonları atlar (ezmez).

## Kapsam

- `KESIM-DUZELT-MASKE-LISTESI.md` (126 yeniden kesilen; 79 maskeli): Elf 12, Human 12, Tiefling 14 jetonun maskesi yenilendi.
  **Ayrı tutulan, dokunulmayan 41 jeton** (başka görev): Dragonborn 19 (pul maskesi), Gnome 17 (Barbarian ID1–ID9, Cleric ID1 tamamen eski;
  Druid/Fighter/Monk GR, WL-2/6/7 kısmen eski), Goliath 5 (Monk/Rogue/Bard/Druid/Monk GR). Liste: `data/maske-duzelt.json` `ayri`.
- `JETON-DENETIM.md` bölüm 4 bozuk/şüpheli: Drow 23, Human Koyu/Altın 26, Tiefling 23 (Gnome Yeraltı dokunulmadı). Bölüm 3:
  `human-erkek-fighter-GR` (eller).
- Toplam 107 jeton (Elf 34, Human 38, Tiefling 35; 3'ü iki listede). Atlanan: `human-erkek-sorcerer-SC-9` (elle maske; öncelik korunur).
  Bilerek maskesiz Human 5 jetona (Paladin ID3 e/k, Sorcerer SC-5 e, Warlock WL-10 e/k) dokunulmadı.

## Yöntem

Eski otomatik maske (soy-maske.ts) tohumu baş bandındaki en büyük "ten aralığı" bileşeninden seçiyordu; aralık geniş (Lab kroma 8–50, ton
15–85°) olduğundan krem kapüşon, kahverengi şapka/tunik, krem sancak, altın zırh, kızıl saç yüz sayılıyordu. Yeni yöntem:

1. **Tohum:** baş bandında ten aralığındaki bileşenler, doygunluk tabanı (Elf/Human kroma ≥ 20, Tiefling ≥ 25) ve ırkın iyi maskelerinin ten
   medyanına (`onceli`) yakınlıkla puanlanır; ya da jeton başına `seed` kutusu.
2. **Ten referansı:** tohumun parlak yarısının medyanı. **Ten:** referansa ΔE ≤ `th` ya da aynı ton ailesinde gölge (ton farkı ≤ `ton`,
   kroma ≥ referans × 0,6, açıklık referansın 30 altına, 12 üstüne dek). Bütün figürde: yüz, kulak, boyun, eller, açık kol/bacak, Tiefling
   boynuz ve kuyruğu. Kıyafet/şapka/kapüşon/saç (başka ton ya da düşük kroma) dışarıda; belirsiz piksel alınmaz (daraltma). Gözler,
   ağız çizgisi, saç bilerek dışarıda.
3. **Temizlik:** ≥ 6 px bileşen, bileşen ortalaması referanstan ΔE ≤ 18, tek tük pikseller atılır.
4. **Jeton başına kararlar** (gözle, ızgaralı yakın görüntüyle): `exclude` (kemik/kafatası maske, kanat, tunik kırıntısı), `yalniz` (altın
   zırhlı Paladin ID8: miğfer aralığındaki yüz; yaprak kamuflajlı Rogue ID4: yüz; Tiefling SC-2: yüz, boynuz, eller; kadın SC-9 ghoul: yüz,
   kulak, eller), `seed` (sancaklı Fighter ID10, Tiefling SC-9 erkek kuyruk), `include` (Human Fighter GR sol el), `bos` (aşağıda).
5. **Boş maske (13, bilerek):** çıplak teni olmayan çizimler. Dosya kalır, tümü 0: jeton boyanmaz, soyun yedek filtresi de uygulanmaz
   (tint.ts "maske var" sayar). Ağaç adam Druid ID4 (elf e/k, human e), zombi Warlock WL-4 (elf e/k, human e/k, tiefling e), hortlak elf-kadin
   WL-8, hayalet Sorcerer SC-3 (elf k, human k), zombi çocuk human-erkek SC-3, ölü tiefling-kadin Monk ID10. Eskiden bunlarda saç, elbise,
   kitap ya da kontur boyanıyordu.

Çalışma anı onarımı (Human/Drow `closeSkinHoles`, Tiefling `fixSkinMask` gölge bandı) değişmedi ve yeni maskelerin üstünde çalışır.

## Kanıt

- **Maske dışı değişiklik sıfır:** önce/sonra tarayıcı boya dökümü (`scripts/jeton-denetim-cizim.ts --yalniz boya`, 6720 boya). Hedef
  jetonlarda önce↔sonra farklı olan her piksel eski ya da yeni boyalı alanın (maske + çalışma anı onarımı) içinde; iki boyalı alanın
  dışında değişen piksel **0** (Elf, Human, Tiefling). Liste dışındaki **4703 boyalı görünüş birebir aynı** (farklı 0).
- **Gözle:** hedef 107 jetonun önce/sonra boyalı hâli (Human: Orijinal | Altın önce/sonra | Koyu önce/sonra; Drow gradyan; Tiefling
  Abyssal/Chthonic/Winged önce/sonra) `gorsel-dokum/maske-duzelt/kanit/{elf,human,tiefling}-N.png` (git dışı; yeniden üretim aşağıda)
  sayfalarının hepsine bakıldı. Denetimin boya sayfaları `gorsel-dokum/jeton-denetim/kontak/boya-tum-*.png` (Drow, High Elf, Human, Tiefling,
  Gnome Yeraltı) yeni maskelerle yeniden çizilip bakıldı.
- **Ölçü (`python scripts/jeton-denetim.py --asama boya`, `maske-olcum.json`):** jeton başına en kötü boyalı görünüş; otomatik sınıf
  bozuk = ten dışı boya ≥ 0,30 ya da yüz boyasız ≥ 0,60, şüpheli = ≥ 0,10 / ≥ 0,30 (ırkın bütün maskeli jetonları):

  | Irk (soy) | Bozuk önce → sonra | Şüpheli önce → sonra |
  |---|---|---|
  | Elf (Drow) | 16 → 14 | 20 → 19 |
  | Human (Koyu/Altın) | 22 → 23 | 13 → 11 |
  | Tiefling (Abyssal/Chthonic/Winged) | 24 → 15 | 59 → 59 |

  Bu ölçü Elf/Human'da güvenilir değil (aşağıda "Kalanlar"): referansı krem kapüşon/sancak/altın zırh olan jetonlarda ters çalışır.
- **Gözle (JETON-DENETIM bölüm 4 listeleri, kanıt sayfalarından):**

  | Liste | Önce | Sonra |
  |---|---|---|
  | Drow bozuk 11 / şüpheli 12 | kapüşon, şapka, tunik, sancak, sepet, kitap, saç boyalı; yüz boyasız | hepsinde yüz (ve görünen el/kol) boyalı, giysi/eşya boyasız; 5 bilerek boş; Rogue ID4 e/k ve Barbarian ID4 e/k yaklaşık (Gemini) |
  | Human bozuk 12 / şüpheli 14 | aynı + kafatası başlık, altın zırh, eller dışarıda | yüz + eller boyalı (WZ-A3, Druid GR, Fighter GR sol el); 5 bilerek boş; `human-erkek-sorcerer-SC-9` elle maske, dokunulmadı; Rogue ID4 e/k, Barbarian ID4 e/k, Fighter GR sağ yumruk Gemini |
  | Tiefling bozuk 11 / şüpheli 12 | şapka, cüppe, kanat, alev pelerini, kontur boyalı; yüz boyasız | yüz, boynuz, kuyruk, eller boyalı; 2 bilerek boş; SC-2 yaklaşık (Gemini) |

## Gemini'ye gidecekler (kullanıcı çalıştıracak)

Otomatik düzeltmenin yetmediği ya da kutuyla yaklaşık kaldığı 10 jeton (`data/maske-duzelt.json` `gemini`; neden ve beklenen maske orada):
`human-erkek-fighter-GR` (sağ yumruk kalkanla aynı renkte), `tiefling-erkek-sorcerer-SC-2` (alev pelerini), Rogue ID4 ×4 (yaprak
kamuflajı; kadınların ham jetonunda macenta kesim artığı da var, kesim görevi), Barbarian ID4 ×4 (kemik/kafatası/boyalı maske). Ayrıca
`human-erkek-sorcerer-SC-9` elle maskesi JETON-DENETIM'de "bozuk" listede ama yüz + eller boyalı (ghoul); kadın SC-9'lar buna göre
yapıldı, karar kullanıcıda.

Sayfalar: `python scripts/maske-duzelt.py --gemini gorsel-dokum/maske-duzelt/gemini` → her jeton için `<jeton>-sablon.png` (768 px, siyah
zemin, jeton %35 saydam: `docs/soy-maske-yz.md` şablonu) ve `<jeton>-sayfa.png` (iki 768 px hücre: jeton | şimdiki maske taslağı).

Yönerge (şablonu ve sayfayı birlikte ver):

> Ekteki ilk görsel bir pixel art karakter jetonunun şablonudur (siyah zemin üstünde yarı saydam karakter); ikinci görselde solda aynı jeton,
> sağda şimdiki maskenin taslağı var (beyaz = boyanan). Şablonla aynı boyutta ve **aynı hizada** tek bir siyah-beyaz maske üret: karakterin
> **yalnızca çıplak tenini** (yüz, kulaklar, boyun, açık kollar, eller; Tiefling'de boynuz ve kuyruk da) **saf beyaz**, geri kalan her şeyi
> (saç, sakal, maske, kafatası, miğfer, zırh, giysi, yaprak, alev, kürk, silah, kalkan, arka plan) **saf siyah** yap. Taslağı yalnızca
> başlangıç olarak kullan, şu düzeltmeyi yap: <data/maske-duzelt.json gemini satırı>. Gölge, gri ton, kenar yumuşatma, çerçeve, yazı ekleme.
> Karakteri kırpma, kaydırma, büyütme ya da yeniden çizme; şablondaki konumlar birebir korunmalı. Çıktı kare olsun.

Çıktıyı `assets/soy-maske-ham/<jeton>.png` olarak kaydet, sonra:

```powershell
npm run soy-maske-ice -- <jeton>
npm run soy-maske -- --el
```

Elle maske (`maske-el/`) otomatik maskenin önüne geçer; `data/maske-duzelt.json`'daki kayıt kalabilir.

## Kalanlar

- Human Fighter GR sağ yumruk boyasız (eldivenli yumruk kalkanın önünde; Gemini). Sol el boyalı; Altın tonda yüz–el açıklık farkı
  azaldı ama eller ham hâliyle koyu olduğundan (LCH boyası açıklık farkını korur) yüzden koyu kalır.
- Ölçü: denetimin "baş teni" referansı krem kapüşonu/sancağı/altın zırhı ten sayabildiğinden otomatik sınıflama bu jetonlarda ters sonuç
  verir (örnek: Rogue ID8 eskiden kapüşon boyalıyken "temiz", şimdi yüz boyalıyken "bozuk"). Sonuç gözle verildi.
- Gnome Yeraltı ve Orc/Goliath/Dwarf/Gnome/Dragonborn ayrı görevde.
- **Liste dışı, boya sayfalarında görülen:** Warlock WL-8 ghoul (`elf-erkek`, `human-erkek`/`kadin`, `tiefling-erkek`/`kadin`),
  `tiefling-kadin-sorcerer-SC-5`, `tiefling-kadin-barbarian-ID3`: MASKE-EK'te düzeltildi (`harita/belgeler/MASKE-EK.md`; orada 7 ırk
  taraması ve 92 jetonluk ek düzeltme).
- High Elf maskesiz HSL yolunda (soy-renkleri.json); bu görev onu değiştirmedi.
