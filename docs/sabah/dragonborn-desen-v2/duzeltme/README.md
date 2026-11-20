# Dragonborn pul v2: elle maske düzeltmesi

Kaynak: `data/dragonborn-pul-duzeltme.json` (jeton başına `yalniz` / `haric` / `beyazKutu` alanı, `bos`), üretici `python scripts/dragonborn-pul-maske.py`.
Önizleme (oyun kodundan, 256 px): `npx vite-node scripts/dragonborn-pul-duzeltme-sayfa.ts <önceki-commit>` → `<jeton>.webp`
(orijinal | önce Kırmızı | sonra Kırmızı | önce Mavi | sonra Mavi).

1. tur: 19 jeton; 2. tur: 14 jeton + erkek-cleric-ID5 (aşağıda). Diğer jetonların maskesi değişmedi.

| Jeton | Çıkarılan | Yöntem |
|---|---|---|
| kadin-paladin-ID10 | kukuleta, pelerin, zırh, asa | yalnız yüz (kontur çokgeni), kulak, kuyruk |
| erkek-monk-ID9 | beyaz gi | beyaz vurgu adayı yalnız başta |
| kadin-monk-ID9 | gi, kuşak düğümü | baş, yaka açıklığı, yumruk, kuyruk, ayaklar |
| erkek/kadin-wizard-WZ-A1 | cüppe, kol | baş, ayaklar |
| erkek/kadin-wizard-WZ-A6 | cüppe, pantolon, çizme | baş, el, yumruk, kuyruk, ayak |
| erkek-cleric-ID3 | cüppe, pelerin | baş, ayak |
| kadin-cleric-ID3 | elbise, pelerin, güvercin | baş, kuyruk, eller, ayaklar |
| erkek-cleric-ID5 | pelerin, tabard, zırh | baş, eller |
| kadin-cleric-ID5 | pelerin kenarı, zırh | baş, kuyruk |
| kadin-barbarian-ID7 | çekiç başı, zırh | baş, kuyruk |
| erkek/kadin-warlock-WL-10 | hayalet gövde (ten yok) | **maskesiz: artık boyanmaz** |
| erkek/kadin-rogue-ID3 | gömlek kolları, kristaller | baş, eller, kuyruk (kadında ayaklar) |
| kadin-fighter-ID4 | pantolon kemeri | dışlama kutusu |
| erkek/kadin-ranger-ID4 | kılıç ağzı, yavru ejderha kalıntısı | çokgen + kutu dışlama |

Not: erkek-ranger-ID4'te de yavru ejderha kalıntısı vardı, aynı turda çıkarıldı. erkek-cleric-ID5'in sol alttaki pelerin kıvrımı
kuyrukla karıştığı için boyanmıyor (kuyruk görünmüyorsa bu doğru).

## 2. tur (14 jeton + erkek-cleric-ID5)

Önizlemede "önce" = 1. tur sonrası (kullanıcı listesi). erkek-cleric-ID5'in önce/sonra görseli bu turla değişti (önce = 1. tur sonucu).

| Jeton | Çıkarılan | Kalan |
|---|---|---|
| erkek-paladin-ID10 | kukuleta, pelerin, zırh, asa | yüz (kontur çokgeni), kuyruk |
| erkek/kadin-warlock-WL-7 | tüylü kanatlar, beyaz cüppe | baş, eller, kuyruk, ayaklar |
| erkek/kadin-sorcerer-SC-6 | cüppe, yaka | baş, eller, kuyruk, ayak(lar) |
| erkek-barbarian-ID7 | omuzluk, kolluk, dizlik, kemer, çekiç başı | baş, çıplak göğüs, sağ kol ve el, kuyruk, ayak |
| kadin-barbarian-ID1 | zırh, kalkan | baş, kuyruk (çokgen), el |
| erkek-paladin-GR | miğfer | miğfer altındaki yüz, kuyruk, eller |
| kadin-wizard-WZ-A3 | beyaz pantolon, gömlek düğmesi | dışlama kutusu |
| kadin-fighter-ID5 | kemer | dışlama kutusu |
| erkek/kadin-druid-ID5 | hortum alt gövde | baş, kuyruk (çokgen) |
| kadin-bard-ID8 | omuzdaki kuş | dışlama kutusu |
| kadin-sorcerer-SC-9 | veba maskesi (gaga, göz bölgesi) | baş yan dikenleri, kuyruk, eller, ayaklar |
| erkek-cleric-ID5 | (1. turdaki gibi) | sol alttaki kuyruk geri açıldı |

Bu turda yapılmayanlar (kullanıcı kararı): silah ağızları, cep saatleri, lamba dumanı.

## Benzer sızıntı görülen diğer jetonlar (uygulanmadı)

Tarama: gövde ortası bandında maske oranı sıralaması + 264 jetonun gözle kontrolü (maske bindirmesi). Hiçbirine dokunulmadı.

- Açık kıyafet / zırh boyanıyor: erkek-paladin-ID10 (kukuleta, pelerin, zırh, asa; kadın sürümüyle aynı), erkek/kadin-warlock-WL-7 (beyaz cüppe),
  erkek/kadin-sorcerer-SC-6 (cüppe), erkek-barbarian-ID7 (zırh + çekiç başı), kadin-barbarian-ID1 (zırh, kalkan), erkek-paladin-GR (miğfer),
  kadin-wizard-WZ-A3 (beyaz pantolon), kadin-fighter-ID5 (kemer; kadin-fighter-ID4 ile aynı).
- Efekt/gövde dışı: erkek/kadin-druid-ID5 (hortum alt gövde), kadin-warlock-WL-2 (lamba dumanı).
- Silah ağzı: erkek/kadin-fighter-GR (kılıç), erkek/kadin-fighter-ID7 (kılıç), erkek-fighter-ID8 (katana), erkek/kadin-paladin-ID6 (kılıç),
  erkek/kadin-rogue-ID10 (balta), erkek-barbarian-ID8 (balta).
