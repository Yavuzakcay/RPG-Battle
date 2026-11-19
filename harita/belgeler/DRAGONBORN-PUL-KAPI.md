# Dragonborn pul v2: renk kapısı ve kapatılan jetonlar

`python scripts/dragonborn-pul-maske.py` üretir (elle düzenleme). Yalnız görünüm; kural ve kayıt sürümü değişmez.

## Yöntem

- **Renk kapısı** (`scripts/dragonborn-desen-v2.py` `renk_kapisi`, ayar `KAPI`, kopyası `data/dragonborn-pul.json` `kapi`): maske, renk farkı (Lab) < 8 olan komşu piksellerden bölgelere ayrılır; bölgenin ortalama rengi jetonun baş ten örneğine yakın değilse (ton farkı > 12°, kroma oranı 0,4–3,0 dışı ya da açık ve renksiz) bölge boyanmaz. Kapının açtığı, maskeyle çevrili ≤ 160 px delikler (ten parlaması) geri konur.
- **Doğrulama** (etiketli veri: el yamalı 30 jeton, otomatik maske − yamalı maske = taşma): kapı tenin **%95,8**ini korur, taşmanın **%36**sını keser (kalan %63,6). Bu jetonlar ten rengine en yakın kıyafetli olanlardır; renk kapısı tek başına onları çözemez, yamaları korunur.
- **Taşma ölçüsü** (kapıdan bağımsız tahmin, `tasma_tahmini`): baş bandı dışında parlak renksiz (beyaz kumaş/metal) ya da ton dışı renkli maske piksellerinin oranı. Etiketli jetonlarda gerçek taşmayla korelasyonu 0,52 (kaba bir gösterge; küçük silah ağzı, cep saati, duman gibi kabul edilen sızıntıları da sayar).
- **Kötüleşme kuralı:** kapı sonrası taşma tahmini 0,005'ten fazla artarsa ya da baş bandındaki maske %10'dan fazla azalırsa (ten kesiliyor) o jetonda eski maske korunur.
- `data/dragonborn-pul-duzeltme.json` el yamalı jetonlara kapı uygulanmaz (maskeleri aynen).

## Sonuç

- Dragonborn jetonu: 266; el yamalı: 31 (kapı uygulanmaz); kör topal (önceden boyanmayan): 18; otomatik maskeli (kapı ölçümü): 217.
- Kapı uygulandı: **187** jetonda taşma tahmini azaldı, **19** jetonda aynı kaldı (yalnız ten tonuna uzak küçük bölgeler çıktı); eski maske korundu (kötüleşti): **11**; kapatıldı (beyaz kalır): **0**.
- Kapı uygulanan jetonlarda taşma tahmini (piksel ağırlıklı) %5,5 → %3,8.

## Kapatılan jetonlar (boyanmaz, beyaz kalır)

| Jeton | Neden | Kaynak |
|---|---|---|

## Kör topal: önceden boyanmayan jetonlar (kullanıcı kararı "kör topal boyansın")

Seçenek: (a) kapılı/eski otomatik maske gövdenin %60'ından azını boyuyorsa o; (b) yalnız baş, eller ve kuyruk (`alan` çokgen/kutu); (c) yalnız baş/yüz. Başta lavanta ten örneği olmayan jetonlarda ten rengi elle seçilen `ornek` alanından alınır, `alan` içinde bu renge yakın pikseller boyanır (`scripts/dragonborn-desen-v2.py` `_elle_ornek`). Önce/sonra kontak sayfaları `docs/sabah/dragonborn-desen-v2/kor-topal/` (`npx vite-node scripts/dragonborn-pul-kortopal-sayfa.ts <ref>`).

Toplam 18: (a) 1, (b) 12, (c) 5; boyanmayan kalmadı.

| Jeton | Seçenek | Boyanan bölge |
|---|---|---|
| erkek-druid-ID4 | c | yeşil-kahve ten, başta lavanta yok; gövde kök/kabuk: yalnız baş |
| erkek-monk-ID10 | b | gri ten; baş, kuyruk, sağ el (sargılı el/ayak hariç) |
| erkek-rogue-GR | b | koyu kukuleta; beyaz çene, kuyruk, el |
| erkek-rogue-ID4 | b | yeşil ten, yaprak kıyafet; baş ve kuyruk |
| erkek-sorcerer-SC-3 | b | solgun ten; baş, kuyruk, eller, ayaklar |
| erkek-sorcerer-SC-5 | b | siyah gölge gövde; baş ve kuyruk |
| erkek-warlock-WL-10 | c | hayalet gövde; yalnız baş |
| erkek-warlock-WL-4 | b | zombi; baş ve eller (pelerin hariç) |
| erkek-warlock-WL-8 | a | kapılı otomatik maske (gövdenin %30u, %60 sınırının altında); sargılara küçük taşma kabul |
| kadin-cleric-ID6 | b | kukuleta ve cüppe; yüz, kuyruk, eller |
| kadin-druid-ID4 | b | yeşil ten, kabuk gövde; baş ve el |
| kadin-fighter-ID8 | b | samuray zırhı, başta miğfer; yüz, kuyruk, el |
| kadin-rogue-GR | b | koyu kukuleta; beyaz çene ve kuyruk |
| kadin-rogue-ID4 | c | yaprak örtü; yalnız yüz |
| kadin-sorcerer-SC-3 | b | hayaletimsi ten; baş ve kuyruk |
| kadin-sorcerer-SC-5 | b | siyah gölge gövde; baş ve kuyruk |
| kadin-warlock-WL-10 | c | hayalet gövde; yalnız baş |
| kadin-warlock-WL-8 | c | zombi, elbise tenle aynı renkte; yalnız baş ve boyun |

Not: erkek/kadin-cleric-ID9 jeton görseli kör topal görevinden önce başka bir commit'te değişti; maskeleri o görevde yeniden üretilmedi (önceki maske korundu), aşağıdaki ölçüm yeni görselden.

## Jeton başına ölçüm (otomatik maskeli jetonlar)

| Jeton | Maske px önce → sonra | Taşma tahmini önce → sonra | Baş bandı kaybı | Karar |
|---|---|---|---|---|
| erkek-barbarian-GR | 10021 → 9868 | %2,3 → %2,0 | %3 | kapı: taşma azaldı |
| erkek-barbarian-ID1 | 8528 → 7584 | %7,3 → %3,4 | %8 | kapı: taşma azaldı |
| erkek-barbarian-ID2 | 11188 → 10736 | %4,7 → %3,8 | %8 | kapı: taşma azaldı |
| erkek-barbarian-ID3 | 10089 → 9859 | %3,3 → %3,1 | %5 | kapı: taşma azaldı |
| erkek-barbarian-ID4 | 8613 → 8413 | %4,5 → %3,7 | %2 | kapı: taşma azaldı |
| erkek-barbarian-ID5 | 6692 → 6420 | %5,3 → %3,2 | %1 | kapı: taşma azaldı |
| erkek-barbarian-ID6 | 14519 → 14290 | %4,5 → %3,8 | %1 | kapı: taşma azaldı |
| erkek-barbarian-ID8 | 11244 → 10474 | %7,3 → %2,2 | %1 | kapı: taşma azaldı |
| erkek-barbarian-ID9 | 5986 → 5680 | %4,9 → %1,3 | %1 | kapı: taşma azaldı |
| erkek-bard-GR | 7042 → 6975 | %2,6 → %2,5 | %3 | kapı: taşma azaldı |
| erkek-bard-ID1 | 5901 → 5811 | %1,3 → %0,9 | %1 | kapı: taşma azaldı |
| erkek-bard-ID2 | 3404 → 3290 | %2,1 → %0,3 | %1 | kapı: taşma azaldı |
| erkek-bard-ID3 | 4998 → 4956 | %0,6 → %0,4 | %1 | kapı: taşma azaldı |
| erkek-bard-ID4 | 6388 → 6127 | %3,6 → %0,6 | %0 | kapı: taşma azaldı |
| erkek-bard-ID5 | 5467 → 5404 | %3,8 → %3,6 | %1 | kapı: taşma azaldı |
| erkek-bard-ID6 | 6001 → 5844 | %2,1 → %0,7 | %1 | kapı: taşma azaldı |
| erkek-bard-ID7 | 4967 → 4375 | %6,8 → %3,9 | %0 | kapı: taşma azaldı |
| erkek-bard-ID8 | 6327 → 5878 | %4,5 → %1,7 | %5 | kapı: taşma azaldı |
| erkek-bard-ID9 | 5272 → 4876 | %9,1 → %5,2 | %1 | kapı: taşma azaldı |
| erkek-cleric-GR | 8216 → 8095 | %2,5 → %2,4 | %4 | kapı: taşma azaldı |
| erkek-cleric-ID1 | 6332 → 6294 | %2,0 → %2,0 | %1 | kapı: taşma aynı |
| erkek-cleric-ID2 | 5237 → 5154 | %1,4 → %1,0 | %2 | kapı: taşma azaldı |
| erkek-cleric-ID4 | 5422 → 5372 | %0,8 → %0,8 | %2 | kapı: taşma aynı |
| erkek-cleric-ID6 | 1347 → 1093 | %13,9 → %2,5 | %100 | eski maske (kötüleşti) |
| erkek-cleric-ID7 | 4771 → 4270 | %9,6 → %4,0 | %8 | kapı: taşma azaldı |
| erkek-cleric-ID8 | 5518 → 5330 | %8,6 → %6,7 | %1 | kapı: taşma azaldı |
| erkek-cleric-ID9 | 6268 → 5924 | %6,5 → %3,4 | %2 | kapı: taşma azaldı |
| erkek-druid-GR | 10129 → 10028 | %2,9 → %2,8 | %2 | kapı: taşma azaldı |
| erkek-druid-ID1 | 5366 → 5295 | %1,0 → %1,0 | %3 | kapı: taşma aynı |
| erkek-druid-ID2 | 5570 → 5492 | %0,4 → %0,4 | %3 | kapı: taşma aynı |
| erkek-druid-ID3 | 6754 → 6716 | %0,5 → %0,5 | %1 | kapı: taşma azaldı |
| erkek-druid-ID6 | 7245 → 7216 | %0,4 → %0,4 | %1 | kapı: taşma aynı |
| erkek-druid-ID7 | 7473 → 7446 | %0,5 → %0,5 | %0 | kapı: taşma aynı |
| erkek-fighter-GR | 9006 → 8040 | %5,1 → %2,2 | %1 | kapı: taşma azaldı |
| erkek-fighter-ID1 | 3337 → 3316 | %2,0 → %2,0 | %1 | kapı: taşma azaldı |
| erkek-fighter-ID10 | 5612 → 5379 | %2,4 → %0,5 | %0 | kapı: taşma azaldı |
| erkek-fighter-ID11 | 4339 → 3887 | %9,1 → %0,8 | %1 | kapı: taşma azaldı |
| erkek-fighter-ID12 | 4291 → 4236 | %0,3 → %0,2 | %1 | kapı: taşma azaldı |
| erkek-fighter-ID2 | 4093 → 3638 | %11,0 → %4,9 | %1 | kapı: taşma azaldı |
| erkek-fighter-ID3 | 6502 → 5630 | %3,3 → %0,4 | %0 | kapı: taşma azaldı |
| erkek-fighter-ID4 | 13631 → 13595 | %2,1 → %2,1 | %1 | kapı: taşma azaldı |
| erkek-fighter-ID5 | 14214 → 14138 | %5,2 → %5,0 | %0 | kapı: taşma azaldı |
| erkek-fighter-ID6 | 2982 → 2901 | %4,6 → %4,2 | %0 | kapı: taşma azaldı |
| erkek-fighter-ID7 | 6485 → 5685 | %8,1 → %2,5 | %0 | kapı: taşma azaldı |
| erkek-fighter-ID8 | 4560 → 4498 | %13,3 → %12,7 | %4 | kapı: taşma azaldı |
| erkek-fighter-ID9 | 5028 → 4798 | %3,9 → %1,9 | %6 | kapı: taşma azaldı |
| erkek-monk-GR | 9484 → 9442 | %3,1 → %3,0 | %0 | kapı: taşma azaldı |
| erkek-monk-ID1 | 4884 → 4854 | %3,1 → %3,1 | %0 | kapı: taşma aynı |
| erkek-monk-ID11 | 6497 → 6323 | %3,3 → %2,3 | %1 | kapı: taşma azaldı |
| erkek-monk-ID2 | 4137 → 3971 | %3,7 → %0,5 | %1 | kapı: taşma azaldı |
| erkek-monk-ID3 | 5559 → 5493 | %3,6 → %3,3 | %0 | kapı: taşma azaldı |
| erkek-monk-ID4 | 5649 → 5615 | %3,0 → %2,9 | %1 | kapı: taşma azaldı |
| erkek-monk-ID5 | 5100 → 5031 | %8,0 → %7,6 | %1 | kapı: taşma azaldı |
| erkek-monk-ID6 | 6993 → 6133 | %12,9 → %8,5 | %0 | kapı: taşma azaldı |
| erkek-monk-ID7 | 5753 → 5121 | %8,5 → %4,4 | %0 | kapı: taşma azaldı |
| erkek-monk-ID8 | 5044 → 4652 | %7,0 → %3,5 | %1 | kapı: taşma azaldı |
| erkek-paladin-ID1 | 5279 → 5224 | %2,7 → %2,7 | %3 | kapı: taşma aynı |
| erkek-paladin-ID2 | 5242 → 4934 | %3,1 → %1,2 | %6 | kapı: taşma azaldı |
| erkek-paladin-ID3 | 3509 → 3483 | %1,0 → %0,9 | %2 | kapı: taşma azaldı |
| erkek-paladin-ID4 | 7383 → 6774 | %5,1 → %0,9 | %8 | kapı: taşma azaldı |
| erkek-paladin-ID5 | 5707 → 5277 | %6,0 → %2,7 | %3 | kapı: taşma azaldı |
| erkek-paladin-ID6 | 3953 → 3593 | %10,3 → %5,6 | %0 | kapı: taşma azaldı |
| erkek-paladin-ID7 | 6492 → 5697 | %10,5 → %2,5 | %2 | kapı: taşma azaldı |
| erkek-paladin-ID8 | 410 → 142 | %17,3 → %7,0 | %61 | eski maske (kötüleşti) |
| erkek-paladin-ID9 | 5636 → 5560 | %1,0 → %0,8 | %2 | kapı: taşma azaldı |
| erkek-ranger-GR | 4209 → 4182 | %5,5 → %5,2 | %0 | kapı: taşma azaldı |
| erkek-ranger-ID1 | 6104 → 5690 | %12,8 → %12,0 | %15 | eski maske (kötüleşti) |
| erkek-ranger-ID2 | 6236 → 6102 | %8,4 → %7,9 | %2 | kapı: taşma azaldı |
| erkek-ranger-ID3 | 6031 → 5905 | %10,8 → %10,2 | %1 | kapı: taşma azaldı |
| erkek-ranger-ID5 | 7810 → 7515 | %5,9 → %4,1 | %1 | kapı: taşma azaldı |
| erkek-ranger-ID6 | 7723 → 7643 | %5,7 → %5,4 | %0 | kapı: taşma azaldı |
| erkek-ranger-ID7 | 6506 → 6402 | %4,2 → %3,8 | %2 | kapı: taşma azaldı |
| erkek-ranger-ID8 | 6154 → 5868 | %6,7 → %3,8 | %2 | kapı: taşma azaldı |
| erkek-ranger-ID9 | 6816 → 6101 | %12,1 → %5,8 | %1 | kapı: taşma azaldı |
| erkek-rogue-ID1 | 6880 → 6366 | %11,9 → %7,8 | %1 | kapı: taşma azaldı |
| erkek-rogue-ID10 | 8229 → 7567 | %9,8 → %10,2 | %18 | eski maske (kötüleşti) |
| erkek-rogue-ID2 | 6027 → 5740 | %7,9 → %6,6 | %2 | kapı: taşma azaldı |
| erkek-rogue-ID5 | 4361 → 4261 | %14,3 → %14,1 | %0 | kapı: taşma azaldı |
| erkek-rogue-ID6 | 7916 → 7370 | %7,5 → %4,8 | %5 | kapı: taşma azaldı |
| erkek-rogue-ID7 | 1099 → 758 | %23,1 → %5,1 | %12 | eski maske (kötüleşti) |
| erkek-rogue-ID8 | 5717 → 5545 | %10,8 → %9,8 | %0 | kapı: taşma azaldı |
| erkek-rogue-ID9 | 6326 → 6158 | %6,7 → %6,1 | %1 | kapı: taşma azaldı |
| erkek-sorcerer-GR | 9374 → 9330 | %3,4 → %3,3 | %0 | kapı: taşma azaldı |
| erkek-sorcerer-SC-1 | 6614 → 6562 | %0,6 → %0,5 | %1 | kapı: taşma azaldı |
| erkek-sorcerer-SC-2 | 7136 → 7034 | %1,2 → %1,0 | %2 | kapı: taşma azaldı |
| erkek-sorcerer-SC-4 | 6732 → 6592 | %3,0 → %2,6 | %3 | kapı: taşma azaldı |
| erkek-sorcerer-SC-7 | 7219 → 7079 | %2,3 → %2,1 | %4 | kapı: taşma azaldı |
| erkek-sorcerer-SC-8 | 5654 → 5439 | %1,7 → %1,1 | %4 | kapı: taşma azaldı |
| erkek-sorcerer-SC-9 | 2153 → 2101 | %4,7 → %2,9 | %100 | eski maske (kötüleşti) |
| erkek-warlock-GR | 6608 → 6591 | %2,3 → %2,3 | %0 | kapı: taşma aynı |
| erkek-warlock-WL-1 | 6565 → 5892 | %13,7 → %10,7 | %2 | kapı: taşma azaldı |
| erkek-warlock-WL-11 | 8621 → 8483 | %2,9 → %2,9 | %4 | kapı: taşma aynı |
| erkek-warlock-WL-2 | 7897 → 6563 | %20,8 → %14,7 | %1 | kapı: taşma azaldı |
| erkek-warlock-WL-3 | 4847 → 4456 | %9,8 → %7,6 | %2 | kapı: taşma azaldı |
| erkek-warlock-WL-5 | 7988 → 7417 | %15,1 → %13,6 | %4 | kapı: taşma azaldı |
| erkek-warlock-WL-6 | 6133 → 5937 | %4,8 → %4,7 | %4 | kapı: taşma azaldı |
| erkek-warlock-WL-9 | 8846 → 3266 | %21,2 → %19,7 | %92 | eski maske (kötüleşti) |
| erkek-wizard-GR | 5273 → 5210 | %10,5 → %9,9 | %0 | kapı: taşma azaldı |
| erkek-wizard-WZ-A2 | 5338 → 5155 | %4,3 → %4,4 | %6 | kapı: taşma aynı |
| erkek-wizard-WZ-A3 | 3668 → 3360 | %4,6 → %1,7 | %7 | kapı: taşma azaldı |
| erkek-wizard-WZ-A4 | 4424 → 4231 | %1,5 → %1,5 | %6 | kapı: taşma aynı |
| erkek-wizard-WZ-A5 | 5154 → 4927 | %4,9 → %4,8 | %7 | kapı: taşma azaldı |
| erkek-wizard-WZ-A7 | 5645 → 5449 | %5,7 → %5,6 | %7 | kapı: taşma azaldı |
| erkek-wizard-WZ-A8 | 6028 → 5780 | %6,7 → %5,8 | %4 | kapı: taşma azaldı |
| erkek-wizard-WZ-B1 | 5788 → 5223 | %10,3 → %4,4 | %1 | kapı: taşma azaldı |
| erkek-wizard-WZ-B2 | 5361 → 5313 | %8,6 → %8,6 | %1 | kapı: taşma azaldı |
| erkek-wizard-WZ-B3 | 5684 → 5608 | %7,1 → %6,9 | %1 | kapı: taşma azaldı |
| erkek-wizard-WZ-B4 | 6250 → 6193 | %8,7 → %8,4 | %0 | kapı: taşma azaldı |
| erkek-wizard-WZ-B5 | 6844 → 6528 | %9,6 → %7,2 | %3 | kapı: taşma azaldı |
| erkek-wizard-WZ-B6 | 6483 → 6045 | %10,0 → %7,9 | %0 | kapı: taşma azaldı |
| erkek-wizard-WZ-B7 | 4104 → 3984 | %5,3 → %3,7 | %1 | kapı: taşma azaldı |
| kadin-barbarian-GR | 7537 → 7385 | %2,7 → %2,1 | %1 | kapı: taşma azaldı |
| kadin-barbarian-ID2 | 7554 → 7481 | %2,4 → %2,0 | %1 | kapı: taşma azaldı |
| kadin-barbarian-ID3 | 8149 → 7993 | %2,7 → %2,2 | %1 | kapı: taşma azaldı |
| kadin-barbarian-ID4 | 6413 → 6281 | %1,2 → %0,7 | %1 | kapı: taşma azaldı |
| kadin-barbarian-ID5 | 6833 → 6747 | %1,0 → %0,8 | %1 | kapı: taşma azaldı |
| kadin-barbarian-ID6 | 9060 → 8903 | %1,4 → %0,7 | %1 | kapı: taşma azaldı |
| kadin-barbarian-ID8 | 7643 → 7538 | %1,0 → %0,6 | %1 | kapı: taşma azaldı |
| kadin-barbarian-ID9 | 4714 → 4633 | %1,8 → %0,7 | %1 | kapı: taşma azaldı |
| kadin-bard-GR | 5242 → 5160 | %3,4 → %2,6 | %0 | kapı: taşma azaldı |
| kadin-bard-ID1 | 4045 → 3983 | %3,1 → %2,4 | %1 | kapı: taşma azaldı |
| kadin-bard-ID2 | 3746 → 3701 | %1,9 → %1,4 | %1 | kapı: taşma azaldı |
| kadin-bard-ID3 | 4431 → 4397 | %1,7 → %1,4 | %1 | kapı: taşma azaldı |
| kadin-bard-ID4 | 5166 → 4409 | %11,9 → %1,0 | %3 | kapı: taşma azaldı |
| kadin-bard-ID5 | 3560 → 3533 | %2,6 → %2,3 | %0 | kapı: taşma azaldı |
| kadin-bard-ID6 | 4668 → 4575 | %2,1 → %0,9 | %1 | kapı: taşma azaldı |
| kadin-bard-ID7 | 4627 → 4171 | %11,0 → %6,3 | %0 | kapı: taşma azaldı |
| kadin-bard-ID9 | 4297 → 4247 | %3,2 → %2,8 | %2 | kapı: taşma azaldı |
| kadin-cleric-GR | 4871 → 4837 | %3,4 → %3,1 | %0 | kapı: taşma azaldı |
| kadin-cleric-ID1 | 4345 → 4107 | %4,0 → %2,8 | %2 | kapı: taşma azaldı |
| kadin-cleric-ID2 | 4261 → 3710 | %10,6 → %2,4 | %1 | kapı: taşma azaldı |
| kadin-cleric-ID4 | 4350 → 4191 | %5,2 → %4,1 | %1 | kapı: taşma azaldı |
| kadin-cleric-ID7 | 4783 → 3857 | %15,9 → %4,0 | %4 | kapı: taşma azaldı |
| kadin-cleric-ID8 | 4645 → 4497 | %5,1 → %4,2 | %1 | kapı: taşma azaldı |
| kadin-cleric-ID9 | 5125 → 5000 | %6,2 → %5,5 | %2 | kapı: taşma azaldı |
| kadin-druid-GR | 8695 → 8542 | %3,3 → %3,0 | %1 | kapı: taşma azaldı |
| kadin-druid-ID1 | 5306 → 5210 | %2,7 → %1,8 | %1 | kapı: taşma azaldı |
| kadin-druid-ID2 | 4108 → 4053 | %1,9 → %1,9 | %1 | kapı: taşma azaldı |
| kadin-druid-ID3 | 6341 → 6089 | %4,3 → %2,4 | %1 | kapı: taşma azaldı |
| kadin-druid-ID6 | 4114 → 4046 | %1,2 → %0,9 | %1 | kapı: taşma azaldı |
| kadin-druid-ID7 | 4271 → 3937 | %6,9 → %0,6 | %1 | kapı: taşma azaldı |
| kadin-druid-ID8 | 6475 → 6394 | %2,6 → %2,2 | %0 | kapı: taşma azaldı |
| kadin-fighter-GR | 6043 → 5720 | %8,3 → %4,9 | %1 | kapı: taşma azaldı |
| kadin-fighter-ID1 | 3285 → 3197 | %1,7 → %1,6 | %8 | kapı: taşma aynı |
| kadin-fighter-ID10 | 4722 → 4601 | %3,5 → %1,8 | %1 | kapı: taşma azaldı |
| kadin-fighter-ID12 | 4954 → 4838 | %2,1 → %0,5 | %0 | kapı: taşma azaldı |
| kadin-fighter-ID2 | 2538 → 2480 | %3,9 → %2,7 | %2 | kapı: taşma azaldı |
| kadin-fighter-ID3 | 5865 → 5273 | %4,6 → %1,2 | %3 | kapı: taşma azaldı |
| kadin-fighter-ID6 | 3521 → 3227 | %7,7 → %2,7 | %0 | kapı: taşma azaldı |
| kadin-fighter-ID7 | 5853 → 5023 | %7,7 → %0,9 | %1 | kapı: taşma azaldı |
| kadin-fighter-ID9 | 4891 → 4441 | %5,6 → %1,3 | %9 | kapı: taşma azaldı |
| kadin-monk-GR | 6966 → 6913 | %5,6 → %5,3 | %0 | kapı: taşma azaldı |
| kadin-monk-ID1 | 6077 → 5928 | %8,0 → %7,7 | %3 | kapı: taşma azaldı |
| kadin-monk-ID10 | 2715 → 2672 | %0,3 → %0,3 | %1 | kapı: taşma aynı |
| kadin-monk-ID11 | 7088 → 6960 | %2,2 → %1,6 | %2 | kapı: taşma azaldı |
| kadin-monk-ID2 | 11284 → 10426 | %5,0 → %2,1 | %6 | kapı: taşma azaldı |
| kadin-monk-ID3 | 6681 → 6308 | %6,4 → %4,8 | %2 | kapı: taşma azaldı |
| kadin-monk-ID4 | 6904 → 6574 | %7,0 → %5,8 | %1 | kapı: taşma azaldı |
| kadin-monk-ID5 | 4871 → 4821 | %7,1 → %7,0 | %1 | kapı: taşma azaldı |
| kadin-monk-ID6 | 7898 → 7301 | %11,2 → %9,5 | %1 | kapı: taşma azaldı |
| kadin-monk-ID7 | 5950 → 5595 | %9,1 → %7,0 | %2 | kapı: taşma azaldı |
| kadin-monk-ID8 | 4260 → 3922 | %8,0 → %4,5 | %1 | kapı: taşma azaldı |
| kadin-paladin-GR | 4802 → 4688 | %8,5 → %7,7 | %0 | kapı: taşma azaldı |
| kadin-paladin-ID1 | 3026 → 3003 | %2,5 → %2,3 | %0 | kapı: taşma azaldı |
| kadin-paladin-ID2 | 4152 → 3304 | %14,5 → %2,2 | %7 | kapı: taşma azaldı |
| kadin-paladin-ID3 | 1426 → 1375 | %4,8 → %4,6 | %18 | eski maske (kötüleşti) |
| kadin-paladin-ID4 | 4600 → 3973 | %12,1 → %1,8 | %2 | kapı: taşma azaldı |
| kadin-paladin-ID5 | 3997 → 3620 | %5,1 → %0,6 | %1 | kapı: taşma azaldı |
| kadin-paladin-ID6 | 3221 → 3192 | %8,7 → %8,3 | %0 | kapı: taşma azaldı |
| kadin-paladin-ID7 | 4524 → 3980 | %9,7 → %1,5 | %1 | kapı: taşma azaldı |
| kadin-paladin-ID8 | 751 → 673 | %8,0 → %8,0 | %4 | kapı: taşma aynı |
| kadin-paladin-ID9 | 4447 → 4361 | %2,8 → %2,5 | %1 | kapı: taşma azaldı |
| kadin-ranger-GR | 4759 → 4569 | %6,4 → %5,3 | %0 | kapı: taşma azaldı |
| kadin-ranger-ID1 | 4407 → 4338 | %8,0 → %7,6 | %1 | kapı: taşma azaldı |
| kadin-ranger-ID2 | 4169 → 4116 | %5,4 → %5,2 | %2 | kapı: taşma azaldı |
| kadin-ranger-ID3 | 4269 → 4189 | %6,3 → %5,7 | %1 | kapı: taşma azaldı |
| kadin-ranger-ID5 | 4314 → 4003 | %6,3 → %2,7 | %0 | kapı: taşma azaldı |
| kadin-ranger-ID6 | 4282 → 4137 | %4,0 → %2,7 | %0 | kapı: taşma azaldı |
| kadin-ranger-ID7 | 4935 → 4813 | %5,6 → %4,7 | %1 | kapı: taşma azaldı |
| kadin-ranger-ID8 | 5368 → 5169 | %8,4 → %6,9 | %1 | kapı: taşma azaldı |
| kadin-ranger-ID9 | 6054 → 5527 | %10,5 → %6,1 | %1 | kapı: taşma azaldı |
| kadin-rogue-ID1 | 6384 → 5814 | %8,6 → %5,1 | %2 | kapı: taşma azaldı |
| kadin-rogue-ID10 | 8731 → 8375 | %5,0 → %4,5 | %5 | kapı: taşma azaldı |
| kadin-rogue-ID2 | 5707 → 5471 | %6,9 → %5,0 | %1 | kapı: taşma azaldı |
| kadin-rogue-ID5 | 4333 → 4216 | %10,1 → %9,0 | %0 | kapı: taşma azaldı |
| kadin-rogue-ID6 | 7642 → 7386 | %4,7 → %4,1 | %4 | kapı: taşma azaldı |
| kadin-rogue-ID7 | 2680 → 2227 | %9,2 → %1,8 | %17 | eski maske (kötüleşti) |
| kadin-rogue-ID8 | 5507 → 5403 | %7,5 → %6,8 | %0 | kapı: taşma azaldı |
| kadin-rogue-ID9 | 6459 → 6350 | %3,1 → %2,7 | %2 | kapı: taşma azaldı |
| kadin-sorcerer-GR | 7394 → 7326 | %5,0 → %4,6 | %1 | kapı: taşma azaldı |
| kadin-sorcerer-SC-1 | 5065 → 4992 | %8,4 → %8,1 | %1 | kapı: taşma azaldı |
| kadin-sorcerer-SC-2 | 4588 → 4346 | %6,4 → %3,9 | %2 | kapı: taşma azaldı |
| kadin-sorcerer-SC-4 | 4128 → 4020 | %4,4 → %3,9 | %2 | kapı: taşma azaldı |
| kadin-sorcerer-SC-7 | 5542 → 5214 | %6,5 → %4,4 | %4 | kapı: taşma azaldı |
| kadin-sorcerer-SC-8 | 4668 → 4438 | %5,9 → %3,4 | %1 | kapı: taşma azaldı |
| kadin-warlock-GR | 6283 → 6104 | %4,9 → %3,6 | %1 | kapı: taşma azaldı |
| kadin-warlock-WL-1 | 6797 → 6440 | %4,1 → %4,1 | %8 | kapı: taşma aynı |
| kadin-warlock-WL-11 | 6074 → 5920 | %5,7 → %5,9 | %4 | kapı: taşma aynı |
| kadin-warlock-WL-2 | 7594 → 6140 | %9,5 → %4,9 | %26 | eski maske (kötüleşti) |
| kadin-warlock-WL-3 | 3284 → 3282 | %11,0 → %11,0 | %0 | kapı: taşma aynı |
| kadin-warlock-WL-4 | 47 → 0 | %95,7 → %0,0 | %100 | eski maske (kötüleşti) |
| kadin-warlock-WL-5 | 8505 → 8398 | %2,9 → %2,8 | %1 | kapı: taşma azaldı |
| kadin-warlock-WL-6 | 6224 → 6063 | %4,5 → %4,3 | %4 | kapı: taşma azaldı |
| kadin-warlock-WL-9 | 6890 → 6288 | %11,7 → %7,9 | %6 | kapı: taşma azaldı |
| kadin-wizard-GR | 4609 → 4276 | %15,2 → %11,4 | %0 | kapı: taşma azaldı |
| kadin-wizard-WZ-A2 | 5250 → 5199 | %2,4 → %2,3 | %2 | kapı: taşma azaldı |
| kadin-wizard-WZ-A4 | 3850 → 3702 | %1,9 → %0,7 | %1 | kapı: taşma azaldı |
| kadin-wizard-WZ-A5 | 4642 → 4576 | %1,7 → %0,8 | %1 | kapı: taşma azaldı |
| kadin-wizard-WZ-A7 | 5155 → 5057 | %2,0 → %1,3 | %2 | kapı: taşma azaldı |
| kadin-wizard-WZ-A8 | 5726 → 5641 | %1,3 → %0,9 | %1 | kapı: taşma azaldı |
| kadin-wizard-WZ-B1 | 5670 → 5161 | %10,1 → %3,6 | %1 | kapı: taşma azaldı |
| kadin-wizard-WZ-B2 | 5334 → 5295 | %7,6 → %7,6 | %1 | kapı: taşma aynı |
| kadin-wizard-WZ-B3 | 5537 → 5475 | %7,5 → %7,3 | %1 | kapı: taşma azaldı |
| kadin-wizard-WZ-B4 | 6435 → 6346 | %7,1 → %6,7 | %1 | kapı: taşma azaldı |
| kadin-wizard-WZ-B5 | 6913 → 6599 | %7,5 → %5,0 | %4 | kapı: taşma azaldı |
| kadin-wizard-WZ-B6 | 6293 → 6068 | %7,1 → %5,5 | %1 | kapı: taşma azaldı |
| kadin-wizard-WZ-B7 | 4102 → 4035 | %1,4 → %1,0 | %1 | kapı: taşma azaldı |
