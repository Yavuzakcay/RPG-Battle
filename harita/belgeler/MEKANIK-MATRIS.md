# Mekanik doğrulama matrisi (APK öncesi)

Üretim: `npx vite-node src/sim/mekanikMatris.ts -- --yaz` (tek süreç, ≈8 sn). Kural sürümü 83.
Satır satır sonuçlar: [`mekanik-matris.csv`](mekanik-matris.csv) (UTF-8, virgülle ayrılmış; sütunlar: tür, büyü/saldırı, seviye, sınıflar, mekanik, bağlam, bağlam sınıfı, beklenen, gerçek, sonuç, bulgu, not).

## Özet

- Toplam satır: **6587** (büyü 1832 satır / 339 büyü; silah 670 satır / 46 seçenek; canavar 4085 satır / 579 saldırı).
- Doğru oranı: **98.9%** (6514/6587); karar bekleyenler hariç 99.3%.
- Sonuçlar: doğru 6514 · yanlış 43 · çökme 0 · uygulanmıyor 1 · karar bekliyor 29.
- Kök nedene göre: 11 yanlış, 0 çökme, 1 uygulanmıyor, 4 karar bekleyen bulgu.

| Tür | Satır | Doğru | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor | Doğru oranı |
|---|---:|---:|---:|---:|---:|---:|---:|
| Büyü | 1832 | 1759 | 43 | 0 | 1 | 29 | 96.0% |
| Silah | 670 | 670 | 0 | 0 | 0 | 0 | 100.0% |
| Canavar | 4085 | 4085 | 0 | 0 | 0 | 0 | 100.0% |

## Önce / sonra (düzeltme turları)

| Aşama | Sürüm | Satır | Doğru | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor | Doğru oranı |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| İlk ölçüm (3116efd) | 82 | 6587 | 6312 | 235 | 9 | 2 | 29 | 95.8% |
| Kahin/ölçüm düzeltmesi, sürüm 82 | 82 | 6587 | 6321 | 235 | 0 | 2 | 29 | 96.0% |
| Grup 1 sonrası (Ç01, B01, B02, B03, B05) | 83 | 6587 | 6501 | 55 | 0 | 2 | 29 | 98.7% |
| Grup 2 sonrası (B07, B09, B11, B12, B17, B19, U01) | 83 | 6587 | 6514 | 43 | 0 | 1 | 29 | 98.9% |

Bulgu başına doğru olmayan satır (aşama sırasıyla):

| Bulgu | İlk ölçüm (3116efd) | Kahin/ölçüm düzeltmesi, sürüm 82 | Grup 1 sonrası (Ç01, B01, B02, B03, B05) | Grup 2 sonrası (B07, B09, B11, B12, B17, B19, U01) | Düzeltme |
|---|---:|---:|---:|---:|---|
| B01 | 72 | 72 | 1 | 1 | sürüm 83: `saveMode` Restrained DEX dezavantajı (`srd83` işareti) |
| B02 | 38 | 38 | 0 | 0 | sürüm 83: görülmeyen hedef reddi, alanda görülmeyen etkilenmez (`data/gorme-gerekir.json`, `seenTargets.ts`) |
| Ç01 | 9 | 0 | 0 | 0 | sürümsüz: sabit hasar tek sabit, yetenek değiştiricisi yok (SRD Damage Rolls) |
| B03 | 5 | 5 | 0 | 0 | sürüm 83: durdurulan büyüde yapım sonrası kancalar yok (`spell_cast.countered`); görünmez büyücüye Counterspell yok |
| B04 | 4 | 4 | 4 | 4 |  |
| B05 | 68 | 68 | 0 | 0 | sürüm 83: büyü verisinde `m83` bloğu; yapım anı tetiğinde siper, tek hasar zarı, eşzamanlı etki |
| B06 | 10 | 10 | 10 | 10 |  |
| B07 | 1 | 1 | 1 | 0 | sürüm 83: boyut kodu L/H/G ile karşılaştırma |
| B08 | 2 | 2 | 2 | 2 |  |
| B09 | 6 | 6 | 6 | 0 | sürüm 83: büyü verisinde `m83` `addCastingMod` |
| B10 | 14 | 14 | 14 | 14 |  |
| B11 | 1 | 1 | 0 | 0 | sürümsüz: yanlış bulgu: motor zaten yarı hasar veriyor; ölçüm hatası (ışın save'i `kind: save` etiketsiz), motor değişmedi |
| B12 | 1 | 1 | 1 | 0 | sürüm 83: sıçrama 3 + (slot − 6) |
| B13 | 3 | 3 | 3 | 3 |  |
| B14 | 1 | 1 | 1 | 1 |  |
| B15 | 1 | 1 | 1 | 1 |  |
| B16 | 4 | 4 | 4 | 4 |  |
| B17 | 1 | 1 | 1 | 0 | sürüm 83: büyü verisinde `m83` 600 tur |
| B18 | 1 | 1 | 1 | 1 |  |
| B19 | 3 | 3 | 3 | 0 | sürüm 83: `spell_cast.area.parts`, yüzey çözücüsü her türü ayrı işler |
| B20 | 1 | 1 | 4 | 4 |  |
| U01 | 1 | 1 | 1 | 0 | sürüm 83: büyü verisinde `m83` Charmed, yalnız DEX save dezavantajı |
| U02 | 1 | 1 | 1 | 1 |  |
| K01 | 20 | 20 | 20 | 20 |  |
| K02 | 2 | 2 | 2 | 2 |  |
| K03 | 3 | 3 | 3 | 3 |  |
| K04 | 2 | 2 | 2 | 2 |  |

## Yanlış dağılımı

### Sınıflara göre (büyünün sınıf listesi; bir büyü birden çok sınıfta sayılır)

| Sınıf | Büyü satırı | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor | Yanlış oranı |
|---|---:|---:|---:|---:|---:|---:|
| Bard | 502 | 4 | 0 | 0 | 18 | 0.8% |
| Cleric | 428 | 6 | 0 | 1 | 6 | 1.4% |
| Druid | 620 | 3 | 0 | 1 | 10 | 0.5% |
| Paladin | 113 | 1 | 0 | 0 | 1 | 0.9% |
| Ranger | 148 | 0 | 0 | 0 | 3 | 0.0% |
| Sorcerer | 996 | 21 | 0 | 0 | 13 | 2.1% |
| Warlock | 369 | 4 | 0 | 0 | 9 | 1.1% |
| Wizard | 1165 | 33 | 0 | 1 | 21 | 2.8% |
| Silah (karakter) | 670 | 0 | 0 | 0 | 0 | 0.0% |
| Canavar saldırısı | 4085 | 0 | 0 | 0 | 0 | 0.0% |

### Bağlam sınıfına göre

| Bağlam sınıfı | Satır | Doğru | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor |
|---|---:|---:|---:|---:|---:|---:|
| alan | 96 | 92 | 3 | 0 | 0 | 1 |
| durum | 1976 | 1942 | 9 | 0 | 0 | 25 |
| hasar türü | 1384 | 1376 | 7 | 0 | 0 | 1 |
| konsantrasyon | 157 | 155 | 2 | 0 | 0 | 0 |
| saldırı zarı | 634 | 632 | 2 | 0 | 0 | 0 |
| save | 233 | 232 | 1 | 0 | 0 | 0 |
| siper | 216 | 214 | 2 | 0 | 0 | 0 |
| tepki | 731 | 725 | 6 | 0 | 0 | 0 |
| yapım | 1025 | 1017 | 5 | 0 | 1 | 2 |
| yukarı slot | 107 | 107 | 0 | 0 | 0 | 0 |
| yüzey | 28 | 22 | 6 | 0 | 0 | 0 |

## Bulgular (kök nedene göre; öncelik sırası: yanlış → çökme → uygulanmıyor → karar bekliyor)

Düzeltilen bulgular (B01, B02, Ç01, B03, B05, B07, B09, B11, B12, B17, B19, U01) doğru olmayan satırı kalmadıysa aşağıda listelenmez; önce/sonra sayıları yukarıdaki tabloda.

### B01 — Restrained hedefin DEX save'i dezavantajlı atılmıyor (yanlış; 1 satır)

- **Neden:** SRD 5.2.1 Restrained: "You have Disadvantage on Dexterity saving throws." `saveMode` (src/battle/durations.ts) Restrained'ı hiç okumuyor; büyü, canavar nefesi ve alan save'lerinin hepsi normal kipte.
- **Öneri:** `saveMode` içinde `ability === 'dex' && s.conditions.includes('Restrained')` → dezavantaj (yeni kural sürümüyle kapılı; eski kayıtlar aynı kalsın).
- **Etkilenen (1):** Wall of Ice
- **Örnek:** Wall of Ice — hedef Restrained (DEX save dezavantajı): beklenen `save=dex/18; kip=disadvantage; başarı=hayır; hasar=40; tür=cold; durum=yok`, gerçek `save=yok; kip=—; başarı=—; hasar=40; tür=yok; durum=yok`

### B04 — Tepki büyüleri eylemle yapılabiliyor (Shield, Counterspell, Feather Fall, Hellish Rebuke) (yanlış; 4 satır)

- **Neden:** SRD: yapım süresi "Reaction, which you take when …". `cast_spell` komutu bunları eylemle kabul ediyor; slot harcanıyor, tetik olmadığı için etki yok (A0 bulgusu, hâlâ açık).
- **Öneri:** Büyü verisinde `castingTime: reaction` olanları `cast_spell` komutunda reddetmek (tepki akışı `reactions.ts` ayrı yoldan yapıyor).
- **Etkilenen (4):** Feather Fall, Shield, Hellish Rebuke, Counterspell
- **Örnek:** Feather Fall — eylemle yapım (SRD: yalnız tepki): beklenen `red (yapılamaz)`, gerçek `kabul edildi`

### B06 — Wall of Ice kesme hasarı save'siz tam uygulanıyor (yanlış; 10 satır)

- **Neden:** SRD: duvarın kestiği yaratık itilir ve DEX save atar; başarıda yarı hasar. Motor 10d6 Cold'u save olayı olmadan tam veriyor (`walls.ts` `cutDamage`).
- **Öneri:** `cutDamage` yolunda DEX save (büyücünün DC'si) ve başarıda yarı hasar; `save_resolved` olayı.
- **Etkilenen (1):** Wall of Ice
- **Örnek:** Wall of Ice — normal (save başarısız): beklenen `save=dex/18; kip=normal; başarı=hayır; zar=10d6; hasar=40; tür=cold; durum=yok; slot=6; kons=Wall of Ice`, gerçek `save=yok; kip=—; başarı=—; zar=10d6; hasar=40; tür=yok; durum=yok; slot=6; kons=Wall of Ice`

### B08 — Sacred Flame siperden yararlandırıyor (yanlış; 2 satır)

- **Neden:** SRD: "The target gains no benefit from Half Cover or Three-Quarters Cover for this save." Motor DEX save'e +2/+5 ekliyor.
- **Öneri:** Büyü verisine `ignoresCover` bayrağı; `castSpell` save yolunda `dexCover = 0`.
- **Etkilenen (1):** Sacred Flame
- **Örnek:** Sacred Flame — yarım siper (+2 DEX save; SRD: bu büyüde siper yok): beklenen `save=dex/18; kip=normal; başarı=hayır; hasar=20; tür=radiant; durum=yok`, gerçek `save=dex/18; kip=normal; başarı=evet; hasar=0; tür=radiant; durum=yok`

### B10 — Arcane Hand yapımda etki uygulamıyor (yanlış; 14 satır)

- **Neden:** SRD: "When you cast the spell and as a Bonus Action on your later turns, you can move the hand … and then cause one of the following effects" (Clenched Fist 5d8 Force…). Motor eli çağırıyor ama yapım anında etki yok.
- **Öneri:** Çağrıdan hemen sonra bir el etkisi seçimi (yapım komutunda `choice` + hedef) ya da aynı turda bedava ilk etki.
- **Etkilenen (1):** Arcane Hand
- **Örnek:** Arcane Hand — normal (isabet): beklenen `ışın=1; kip=normal; doğal=8; AC=15; isabet=evet; kritik=hayır; zar=5d8; hasar=25; tür=force; slot=5; kons=Arcane Hand`, gerçek `ışın=0; kip=—; doğal=—; AC=—; isabet=—; kritik=—; zar=yok; hasar=0; tür=yok; slot=5; kons=Arcane Hand`

### B13 — Holy Aura dostlara yapılamıyor (yanlış; 3 satır)

- **Neden:** SRD: büyücüden 30 ft yayılım; seçilen yaratıklar yararlanır. Veride menzil 0 (Self) ve hedef dost listesi: motor her dostu "menzil dışında" reddediyor, yalnız büyücü etkilenebiliyor.
- **Öneri:** Etkiyi 30 ft içindeki seçilen dostlara (menzil denetimi yayılım yarıçapıyla) uygulamak.
- **Etkilenen (1):** Holy Aura
- **Örnek:** Holy Aura — normal (dosta): beklenen `kabul`, gerçek `red: B: Hedef menzil dışında: 1 altıgen (5 ft), menzil 0 ft.`

### B14 — Weird dostları da etkiliyor (yanlış; 1 satır)

- **Neden:** SRD: "Each creature of your choice in a 30-foot-radius Sphere". Veride alan `targets: all`.
- **Öneri:** Weird alanını `targets: enemies` (seçilen yaratıklar) yapmak.
- **Etkilenen (1):** Weird
- **Örnek:** Weird — dost ateşi (dost alanda; SRD: seçilen yaratıklar): beklenen `dost etkilendi=hayır`, gerçek `dost etkilendi=evet`

### B15 — Compulsion alanı SRD menzilinden geniş (yanlış; 1 satır)

- **Neden:** SRD: 30 ft menzilde, görülen ve seçilen yaratıklar. Motor 30 ft yarıçaplı küreyi büyücünün 15 ft önüne kuruyor; 45 ft'teki yaratık da etkileniyor.
- **Öneri:** Compulsion'ı büyücü merkezli 30 ft yayılım (seçilen düşmanlar) olarak tanımlamak.
- **Etkilenen (1):** Compulsion
- **Örnek:** Compulsion — alan içi hedefler (2 içeride, 1 dışarıda): beklenen `etkilenen=T+U`, gerçek `etkilenen=T+U+Z`

### B16 — Suggestion ve Mass Suggestion birkaç turda kendiliğinden bitiyor; Mass Suggestion Charmed vermiyor (yanlış; 4 satır)

- **Neden:** SRD: Suggestion Konsantrasyon en çok 8 saat, Mass Suggestion 24 saat (büyücü ya da dostları hasar verene dek); her ikisi Charmed. Motorda etki `until` = yapım turu + 1 (komut etkisi `commandPersist` olsa da 4. turda etki yok); Mass Suggestion etkisinde `grants: Charmed` yok.
- **Öneri:** Etkinin `until` değerini büyü süresinden almak (komut her tur yenilenebilir), Mass Suggestion'a `grants: ['Charmed']`.
- **Etkilenen (2):** Suggestion, Mass Suggestion
- **Örnek:** Suggestion — normal (save başarısız): beklenen `save=wis/18; kip=normal; başarı=hayır; durum=Charmed; süre=4800 tur; slot=2; kons=Suggestion`, gerçek `save=wis/18; kip=normal; başarı=hayır; durum=Charmed; süre=2 tur; slot=2; kons=Suggestion`

### B18 — Shining Smite işaretli hedefin Invisible yararını kaldırmıyor (yanlış; 1 satır)

- **Neden:** SRD: hedef "can't benefit from the Invisible condition"; işaretli Invisible hedefe saldırı avantajlı olmalı. Motor avantajı veriyor ama Invisible dezavantajını da sürdürüyor (sonuç normal).
- **Öneri:** Shining Smite koruma/ışık etkisinde hedefe `revealed` (Faerie Fire gibi) koymak.
- **Etkilenen (1):** Shining Smite
- **Örnek:** Shining Smite — parlayan hedefe saldırı avantajlı, Invisible yararı yok: beklenen `sonraki saldırı kipi=advantage`, gerçek `sonraki saldırı kipi=normal`

### B20 — Alan (zone) yoluyla verilen ateş hasarı yüzey tablosuna girmiyor (Wall of Fire) (yanlış; 4 satır)

- **Neden:** Yüzey tablosunun `fireOil` satırı ateş hasarı değen yağı tutuşturur; `hexResolver.incomingOf` yalnız alan/isabet/save olaylarını okuyor, alan tetiğinin hasarını okumuyor.
- **Öneri:** `incomingOf` alan tetiğinden (`zone_triggered` + hasar) element üretsin.
- **Etkilenen (4):** Wall of Fire, Blade Barrier, Incendiary Cloud, Storm of Vengeance
- **Örnek:** Wall of Fire — yüzey: hedef yağda (fire → fireOil): beklenen `tepkime=fireOil`, gerçek `tepkime=yok`

### U02 — Control Water savaş dışı işaretli (uygulanmıyor; 1 satır)

- **Neden:** SRD: Action, konsantrasyon; girdap seçeneği 2d8 Bludgeoning ve STR save. Oyunda savaş dışı (Game Master notu).
- **Öneri:** Kapsam kararı: girdabı alan olarak eklemek ya da savaş dışı kalmasını DECISIONS'a yazmak.
- **Etkilenen (1):** Control Water
- **Örnek:** Control Water — savaşta yapım: beklenen `savaşta etki (SRD: hasar/save/durum)`, gerçek `savaş dışı (Game Master notu)`

### K01 — Charmed büyücü, büyüleyenine zarar vermeyen büyü yapabilir mi? (karar bekliyor; 20 satır)

- **Neden:** SRD 5.2.1 Charmed: "You can't attack the charmer or target the charmer with damaging abilities or magical effects." "damaging" sözcüğünün "magical effects"i de nitelediği okunursa zarar vermeyen büyüler (Hold Person, Bane, Charm Person…) serbest; motor hepsini reddediyor (katı okuma).
- **Öneri:** Okuma kararı; katı okuma korunacaksa DECISIONS'a yazmak.
- **Etkilenen (20):** Charm Person, Hideous Laughter, Bane, Slow, Bestow Curse, Levitate, Ray of Enfeeblement, Enlarge/Reduce, Animal Friendship, Calm Emotions, Phantasmal Force, Charm Monster, Banishment, Dominate Beast, Dominate Person, Resilient Sphere, Polymorph, Irresistible Dance, Dominate Monster, True Polymorph
- **Örnek:** Charm Person — büyücü Charmed (hedef büyüleyen): beklenen `kabul`, gerçek `red: T: A büyülenmiş (Charmed): T hedef alınamaz.`

### K02 — Spirit Guardians ve Conjure Woodland Beings yapımda içerideki yaratığa save attırır mı? (karar bekliyor; 2 satır)

- **Neden:** SRD 5.2.1: "whenever the Emanation enters a creature's space …" Yapım anında yayılımın "girdiği" sayılıp sayılmayacağı yoruma açık; motor yapımda save attırıyor.
- **Öneri:** Okuma kararı (motor davranışı yaygın masa yorumuyla uyumlu).
- **Etkilenen (2):** Spirit Guardians, Conjure Woodland Beings
- **Örnek:** Spirit Guardians — yapım (SRD: yapımda hedefe etki yok): beklenen `alan/çağrı kuruldu=evet; hedef save=0; hedef hasarı=0; slot=3; kons=Spirit Guardians`, gerçek `alan/çağrı kuruldu=evet; hedef save=1; hedef hasarı=15; slot=3; kons=Spirit Guardians`

### K03 — Güç/kılıç/ruh saldırısında Prone kuralı kimin uzaklığından? (Spiritual Weapon, Arcane Sword, Conjure Fey) (karar bekliyor; 3 satır)

- **Neden:** SRD Prone: "Attack rolls against you have Advantage if the attacker is within 5 feet of you." Saldırıyı büyücü yapar ama güç hedefin 5 ft içinden vurur; motor büyücünün uzaklığını kullanıyor (Prone hedefe dezavantaj).
- **Öneri:** Okuma kararı; gücün yeri sayılacaksa `attackSources` 5 ft denetimi güç/çağrı altıgeninden.
- **Etkilenen (3):** Spiritual Weapon, Conjure Fey, Arcane Sword
- **Örnek:** Spiritual Weapon — hedef Prone (yakın: avantaj): beklenen `ışın=1; kip=advantage; doğal=16; AC=15; isabet=evet; kritik=hayır; hasar=9; tür=force`, gerçek `ışın=1; kip=disadvantage; doğal=2; AC=15; isabet=hayır; kritik=hayır; hasar=0; tür=force`

### K04 — Conjure Elemental: yakalandığı tur başında tutsak tekrar save'i de atar mı? (karar bekliyor; 2 satır)

- **Neden:** SRD: yaratık ruhun 5 ft içinde turuna başlayınca save (8d8 + Restrained); "At the start of each of its turns, the Restrained target repeats the save" (4d8). Motor aynı tur başında ikisini de uyguluyor (12d8).
- **Öneri:** Okuma kararı; tekrarın sonraki turdan başlaması daha muhafazakâr.
- **Etkilenen (1):** Conjure Elemental
- **Örnek:** Conjure Elemental — tetik: hedefin tur başı (save başarısız): beklenen `tetik save=1; tetik hasarı=40; durum=Restrained`, gerçek `tetik save=1; tetik hasarı=60; durum=Restrained`

### Yeni bulgular (düzeltme turlarında bulundu; matris satırı yok; onay bekliyor)

- **G01 — Save günlüğü durumdan gelen avantaj/dezavantajı göstermiyor (görünüm; sonucu etkilemez).** `save_resolved.mode` motorun 41 save yolunun 27'sinde sabit 'normal', kalanında yalnız ortam kipi; Restrained, Dodge, Haste gibi kaynaklardan gelen kip yalnız atılan iki zarda görünür. Günlük "19 / 3 (normal)" yazar. Öneri: Save olaylarına etkin kipi (`resolveSave`'e giden `mode`) yazmak; günlük ve önizleme bunu okur.
- **G02 — Harita/özel save zarları `kind: 'save'` etiketi taşımıyor (görünüm/elle zar; sonucu etkilemez).** `maprules.ts` `saveEffect` (`roll`) d20'yi `rollTag(rng, { by, bonus })` ile atar, `kind` yok; zar kancası (elle zar istemi, matris) bunu save olarak tanımaz. Prismatic Spray ışınları, Reverse Gravity ve harita kuralı save'leri bu yoldan. Öneri: `roll` içinde `kind` parametresini `rollTag`'e geçirmek (kancasız Rng'de etkisiz; elle zarda save olarak sorulur).
- **B21 — Kayan bulut içine girdiği yaratığa save attırmıyor (Incendiary Cloud, Cloudkill).** SRD 5.2.1 Incendiary Cloud: "A creature must also make this save when the Sphere moves into its space" (Cloudkill benzer). `zoneDriftEvents` bulutu kaydırıyor (`zone_moved`) ama yeni kapladığı yaratıklar için tetik yok. Öneri: Kayma sonrası yeni kaplanan altıgendeki yaratıklara `move` tetiği (turda bir kuralıyla), kural sürümü kapısıyla.

## Büyü matrisi (büyü başına)

Sembol: ✓ doğru, ✗ yanlış, ‼ çökme, ∅ uygulanmıyor, ? karar bekliyor. Bağlamların ayrıntısı CSV'de.

| Büyü | Sv | Mekanik | Satır | ✓ | ✗ | ‼ | ∅ | ? | Bulgu |
|---|---:|---|---:|---:|---:|---:|---:|---:|---|
| Acid Arrow | 2 | attack | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Acid Splash | 0 | save+alan(sphere) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Aid | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Alarm | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Alter Self | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Animal Friendship | 1 | effect | 7 | 6 | 0 | 0 | 0 | 1 | K01 |
| Animal Messenger | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Animal Shapes | 8 | effect (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Animate Dead | 3 | summon | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Animate Objects | 5 | summon | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Antilife Shell | 5 | zone+alan(emanation) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Antimagic Field | 8 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Antipathy/Sympathy | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Arcane Eye | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Arcane Hand | 5 | summon | 16 | 2 | 14 | 0 | 0 | 0 | B10 |
| Arcane Lock | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Arcane Sword | 7 | attack | 16 | 15 | 0 | 0 | 0 | 1 | K03 |
| Arcanist's Magic Aura | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Astral Projection | 9 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Augury | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Aura of Life | 4 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Awaken | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Bane | 1 | effect | 7 | 6 | 0 | 0 | 0 | 1 | K01 |
| Banishment | 4 | effect | 8 | 7 | 0 | 0 | 0 | 1 | K01 |
| Barkskin | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Beacon of Hope | 3 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Befuddlement | 8 | save | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Bestow Curse | 3 | effect | 5 | 4 | 0 | 0 | 0 | 1 | K01 |
| Black Tentacles | 4 | save+alan(cube) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Blade Barrier | 6 | save+alan(wall) | 18 | 17 | 1 | 0 | 0 | 0 | B20 |
| Bless | 1 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Blight | 4 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Blindness/Deafness | 2 | save | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Blink | 3 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Blur | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Burning Hands | 1 | save+alan(cone) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Call Lightning | 3 | save+alan(sphere) | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Calm Emotions | 2 | effect | 5 | 4 | 0 | 0 | 0 | 1 | K01 |
| Chain Lightning | 6 | save | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Charm Monster | 4 | effect | 7 | 6 | 0 | 0 | 0 | 1 | K01 |
| Charm Person | 1 | effect | 7 | 6 | 0 | 0 | 0 | 1 | K01 |
| Chill Touch | 0 | attack | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Chromatic Orb | 1 | attack | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Circle of Death | 6 | save+alan(sphere) | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Clairvoyance | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Clone | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Cloudkill | 5 | save+alan(sphere) | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Color Spray | 1 | save+alan(cone) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Command | 1 | effect | 10 | 10 | 0 | 0 | 0 | 0 |  |
| Commune | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Commune with Nature | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Comprehend Languages | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Compulsion | 4 | save+alan(sphere) | 8 | 7 | 1 | 0 | 0 | 0 | B15 |
| Cone of Cold | 5 | save+alan(cone) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Confusion | 4 | save+alan(sphere) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Conjure Animals | 3 | summon+alan | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Conjure Celestial | 7 | save+alan(sphere) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Conjure Elemental | 5 | summon+alan | 8 | 6 | 0 | 0 | 0 | 2 | K04 |
| Conjure Fey | 6 | attack | 16 | 15 | 0 | 0 | 0 | 1 | K03 |
| Conjure Minor Elementals | 4 | buff | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Conjure Woodland Beings | 4 | save(emanation) | 7 | 6 | 0 | 0 | 0 | 1 | K02 |
| Contact Other Plane | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Contagion | 5 | save | 12 | 12 | 0 | 0 | 0 | 0 |  |
| Contingency | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Continual Flame | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Control Water | 4 | utility (savaş dışı) | 1 | 0 | 0 | 0 | 1 | 0 | U02 |
| Control Weather | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Counterspell | 3 | utility | 1 | 0 | 1 | 0 | 0 | 0 | B04 |
| Create Food and Water | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Create or Destroy Water | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Create Undead | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Creation | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Cure Wounds | 1 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Dancing Lights | 0 | zone+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Darkness | 2 | zone+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Darkvision | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Daylight | 3 | zone+alan(sphere) | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Death Ward | 4 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Delayed Blast Fireball | 7 | zone+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Demiplane | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Detect Evil and Good | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Detect Magic | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Detect Poison and Disease | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Detect Thoughts | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Dimension Door | 4 | teleport | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Disguise Self | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Disintegrate | 6 | save | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Dispel Evil and Good | 5 | buff | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Dispel Magic | 3 | dispel | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Dissonant Whispers | 1 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Divination | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Divine Favor | 1 | buff | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Divine Smite | 1 | smite | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Divine Word | 7 | utility | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Dominate Beast | 4 | effect | 6 | 5 | 0 | 0 | 0 | 1 | K01 |
| Dominate Monster | 8 | effect | 6 | 5 | 0 | 0 | 0 | 1 | K01 |
| Dominate Person | 5 | effect | 6 | 5 | 0 | 0 | 0 | 1 | K01 |
| Dragon's Breath | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Dream | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Druidcraft | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Earthquake | 8 | save+alan(sphere) | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Eldritch Blast | 0 | attack | 21 | 21 | 0 | 0 | 0 | 0 |  |
| Elementalism | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Enhance Ability | 2 | effect (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Enlarge/Reduce | 2 | effect | 6 | 5 | 0 | 0 | 0 | 1 | K01 |
| Ensnaring Strike | 1 | smite | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Entangle | 1 | save+alan(cube) | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Enthrall | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Etherealness | 7 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Expeditious Retreat | 1 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Eyebite | 6 | save | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Fabricate | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Faerie Fire | 1 | save+alan(cube) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Faithful Hound | 4 | save+alan(sphere) | 2 | 2 | 0 | 0 | 0 | 0 |  |
| False Life | 1 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Fear | 3 | save+alan(cone) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Feather Fall | 1 | utility | 1 | 0 | 1 | 0 | 0 | 0 | B04 |
| Find Familiar | 1 | summon | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Find Steed | 2 | summon | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Find the Path | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Find Traps | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Finger of Death | 7 | save | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Fire Bolt | 0 | attack | 21 | 21 | 0 | 0 | 0 | 0 |  |
| Fire Shield | 4 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Fire Storm | 7 | save+alan(sphere) | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Fireball | 3 | save+alan(sphere) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Flame Blade | 2 | attack | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Flame Strike | 5 | save+alan(sphere) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Flaming Sphere | 2 | summon+alan | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Flesh to Stone | 6 | save | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Floating Disk | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Fly | 3 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Fog Cloud | 1 | zone+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Forbiddance | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Forcecage | 7 | zone+alan | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Foresight | 9 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Freedom of Movement | 4 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Freezing Sphere | 6 | save+alan(sphere) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Gaseous Form | 3 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Gate | 9 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Geas | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Gentle Repose | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Giant Insect | 4 | summon | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Glibness | 8 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Globe of Invulnerability | 6 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Glyph of Warding | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Goodberry | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Grease | 1 | zone+alan(cube) | 10 | 10 | 0 | 0 | 0 | 0 |  |
| Greater Invisibility | 4 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Greater Restoration | 5 | cure | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Guardian of Faith | 4 | save+alan(sphere) | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Guards and Wards | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Guidance | 0 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Guiding Bolt | 1 | attack | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Gust of Wind | 2 | save+alan(line) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Hallow | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Hallucinatory Terrain | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Harm | 6 | save | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Haste | 3 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Heal | 6 | heal | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Healing Word | 1 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Heat Metal | 2 | auto | 10 | 10 | 0 | 0 | 0 | 0 |  |
| Hellish Rebuke | 1 | save | 4 | 3 | 1 | 0 | 0 | 0 | B04 |
| Heroes’ Feast | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Heroism | 1 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Hex | 1 | mark | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Hideous Laughter | 1 | effect | 8 | 7 | 0 | 0 | 0 | 1 | K01 |
| Hold Monster | 5 | save | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Hold Person | 2 | save | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Holy Aura | 8 | effect | 3 | 0 | 3 | 0 | 0 | 0 | B13 |
| Hunter's Mark | 1 | mark | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Hypnotic Pattern | 3 | save+alan(cube) | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Ice Knife | 1 | attack | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Ice Storm | 4 | save+alan(sphere) | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Identify | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Illusory Script | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Imprisonment | 9 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Incendiary Cloud | 8 | save+alan(sphere) | 21 | 20 | 1 | 0 | 0 | 0 | B20 |
| Inflict Wounds | 1 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Insect Plague | 5 | save+alan(sphere) | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Instant Summons | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Invisibility | 2 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Irresistible Dance | 6 | effect | 6 | 5 | 0 | 0 | 0 | 1 | K01 |
| Jump | 1 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Knock | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Legend Lore | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Lesser Restoration | 2 | cure | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Levitate | 2 | effect | 6 | 5 | 0 | 0 | 0 | 1 | K01 |
| Light | 0 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Lightning Bolt | 3 | save+alan(line) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Locate Animals or Plants | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Locate Creature | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Locate Object | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Longstrider | 1 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Mage Armor | 1 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Mage Hand | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Circle | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Jar | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Missile | 1 | auto | 10 | 10 | 0 | 0 | 0 | 0 |  |
| Magic Mouth | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Weapon | 2 | buff | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Magnificent Mansion | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Major Image | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Mass Cure Wounds | 5 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Mass Heal | 9 | utility | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Mass Healing Word | 3 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Mass Suggestion | 6 | effect | 5 | 3 | 1 | 0 | 0 | 1 | B16 |
| Maze | 8 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Meld into Stone | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Mending | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Message | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Meteor Swarm | 9 | save+alan(sphere) | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Mind Blank | 8 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Mind Spike | 2 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Minor Illusion | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Mirage Arcane | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Mirror Image | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Mislead | 5 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Misty Step | 2 | teleport | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Modify Memory | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Moonbeam | 2 | save+alan(sphere) | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Move Earth | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Nondetection | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Pass without Trace | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Passwall | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Phantasmal Force | 2 | effect | 6 | 5 | 0 | 0 | 0 | 1 | K01 |
| Phantasmal Killer | 4 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Phantom Steed | 3 | summon | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Planar Ally | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Planar Binding | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Plane Shift | 7 | utility | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Plant Growth | 3 | zone+alan(sphere) | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Poison Spray | 0 | attack | 20 | 20 | 0 | 0 | 0 | 0 |  |
| Polymorph | 4 | effect | 6 | 5 | 0 | 0 | 0 | 1 | K01 |
| Power Word Heal | 9 | utility | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Power Word Kill | 9 | utility | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Power Word Stun | 8 | utility | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Prayer of Healing | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Prestidigitation | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Prismatic Spray | 7 | utility | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Prismatic Wall | 9 | zone+alan(wall) | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Private Sanctum | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Produce Flame | 0 | attack | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Programmed Illusion | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Project Image | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Protection from Energy | 3 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Protection from Evil and Good | 1 | buff | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Protection from Poison | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Purify Food and Drink | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Raise Dead | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Ray of Enfeeblement | 2 | effect | 5 | 4 | 0 | 0 | 0 | 1 | K01 |
| Ray of Frost | 0 | attack | 21 | 21 | 0 | 0 | 0 | 0 |  |
| Ray of Sickness | 1 | attack | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Regenerate | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Reincarnate | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Remove Curse | 3 | dispel | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Resilient Sphere | 4 | effect | 6 | 5 | 0 | 0 | 0 | 1 | K01 |
| Resistance | 0 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Resurrection | 7 | revive (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Reverse Gravity | 7 | utility | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Revivify | 3 | revive | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Rope Trick | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Sacred Flame | 0 | save | 17 | 15 | 2 | 0 | 0 | 0 | B08 |
| Sanctuary | 1 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Scorching Ray | 2 | attack | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Scrying | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Searing Smite | 1 | smite | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Secret Chest | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| See Invisibility | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Seeming | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Sending | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Sequester | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Shapechange | 9 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Shatter | 2 | save+alan(sphere) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Shield | 1 | utility | 1 | 0 | 1 | 0 | 0 | 0 | B04 |
| Shield of Faith | 1 | buff | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Shillelagh | 0 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Shining Smite | 2 | smite | 10 | 9 | 1 | 0 | 0 | 0 | B18 |
| Shocking Grasp | 0 | attack | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Silence | 2 | zone+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Silent Image | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Simulacrum | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Sleep | 1 | save+alan(sphere) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Sleet Storm | 3 | zone+alan(sphere) | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Slow | 3 | effect | 5 | 4 | 0 | 0 | 0 | 1 | K01 |
| Sorcerous Burst | 0 | attack | 21 | 21 | 0 | 0 | 0 | 0 |  |
| Spare the Dying | 0 | revive | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Speak with Animals | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Speak with Dead | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Speak with Plants | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Spider Climb | 2 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Spike Growth | 2 | auto+alan(sphere) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Spirit Guardians | 3 | save(emanation) | 7 | 6 | 0 | 0 | 0 | 1 | K02 |
| Spiritual Weapon | 2 | attack | 17 | 16 | 0 | 0 | 0 | 1 | K03 |
| Starry Wisp | 0 | attack | 20 | 20 | 0 | 0 | 0 | 0 |  |
| Stinking Cloud | 3 | save+alan(sphere) | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Stone Shape | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Stoneskin | 4 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Storm of Vengeance | 9 | save+alan(sphere) | 14 | 13 | 1 | 0 | 0 | 0 | B20 |
| Suggestion | 2 | effect | 6 | 4 | 1 | 0 | 0 | 1 | B16 |
| Summon Dragon | 5 | summon | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Sunbeam | 6 | save+alan(line) | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Sunburst | 8 | save+alan(sphere) | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Symbol | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Telekinesis | 5 | save+alan(cube) | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Telepathic Bond | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Teleport | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Teleportation Circle | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Thaumaturgy | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Thunderwave | 1 | save+alan(cube) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Time Stop | 9 | utility | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Tiny Hut | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Tongues | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Transport via Plants | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Tree Stride | 5 | teleport | 3 | 3 | 0 | 0 | 0 | 0 |  |
| True Polymorph | 9 | effect | 6 | 5 | 0 | 0 | 0 | 1 | K01 |
| True Resurrection | 9 | revive (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| True Seeing | 6 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| True Strike | 0 | attack | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Tsunami | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Unseen Servant | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Vampiric Touch | 3 | attack | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Vicious Mockery | 0 | save | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Vitriolic Sphere | 4 | save+alan(sphere) | 16 | 16 | 0 | 0 | 0 | 0 |  |
| Wall of Fire | 4 | save+alan(wall) | 18 | 17 | 1 | 0 | 0 | 0 | B20 |
| Wall of Force | 5 | zone+alan(wall) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Wall of Ice | 6 | save+alan(wall) | 14 | 3 | 11 | 0 | 0 | 0 | B06 B01 |
| Wall of Stone | 5 | zone+alan(wall) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Wall of Thorns | 6 | save+alan(wall) | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Warding Bond | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Water Breathing | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Water Walk | 3 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Web | 2 | save+alan(cube) | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Weird | 9 | save+alan(sphere) | 13 | 12 | 1 | 0 | 0 | 0 | B14 |
| Wind Walk | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Wind Wall | 3 | zone+alan(wall) | 13 | 13 | 0 | 0 | 0 | 0 |  |
| Wish | 9 | utility | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Word of Recall | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Zone of Truth | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |

## Silah matrisi

| Silah seçeneği | Özellik | Satır | ✓ | ✗ | ‼ | Bulgu |
|---|---|---:|---:|---:|---:|---|
| Club | yakın | 13 | 13 | 0 | 0 |  |
| Dagger | yakın, Finesse | 13 | 13 | 0 | 0 |  |
| Dagger (fırlatma) | menzilli, Finesse | 17 | 17 | 0 | 0 |  |
| Greatclub | yakın | 13 | 13 | 0 | 0 |  |
| Handaxe | yakın | 13 | 13 | 0 | 0 |  |
| Handaxe (fırlatma) | menzilli | 17 | 17 | 0 | 0 |  |
| Javelin | yakın | 13 | 13 | 0 | 0 |  |
| Javelin (fırlatma) | menzilli | 17 | 17 | 0 | 0 |  |
| Light Hammer | yakın | 13 | 13 | 0 | 0 |  |
| Light Hammer (fırlatma) | menzilli | 17 | 17 | 0 | 0 |  |
| Mace | yakın | 13 | 13 | 0 | 0 |  |
| Quarterstaff | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Sickle | yakın | 13 | 13 | 0 | 0 |  |
| Spear | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Spear (fırlatma) | menzilli, Versatile | 17 | 17 | 0 | 0 |  |
| Dart | menzilli, Finesse | 17 | 17 | 0 | 0 |  |
| Dart (fırlatma) | menzilli, Finesse | 17 | 17 | 0 | 0 |  |
| Light Crossbow | menzilli | 17 | 17 | 0 | 0 |  |
| Shortbow | menzilli | 17 | 17 | 0 | 0 |  |
| Sling | menzilli | 17 | 17 | 0 | 0 |  |
| Battleaxe | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Flail | yakın | 13 | 13 | 0 | 0 |  |
| Glaive | yakın, Heavy, Reach | 15 | 15 | 0 | 0 |  |
| Greataxe | yakın, Heavy | 14 | 14 | 0 | 0 |  |
| Greatsword | yakın, Heavy | 14 | 14 | 0 | 0 |  |
| Halberd | yakın, Heavy, Reach | 15 | 15 | 0 | 0 |  |
| Lance | yakın, Heavy, Reach | 15 | 15 | 0 | 0 |  |
| Longsword | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Maul | yakın, Heavy | 14 | 14 | 0 | 0 |  |
| Morningstar | yakın | 13 | 13 | 0 | 0 |  |
| Pike | yakın, Heavy, Reach | 15 | 15 | 0 | 0 |  |
| Rapier | yakın, Finesse | 13 | 13 | 0 | 0 |  |
| Scimitar | yakın, Finesse | 13 | 13 | 0 | 0 |  |
| Shortsword | yakın, Finesse | 13 | 13 | 0 | 0 |  |
| Trident | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Trident (fırlatma) | menzilli, Versatile | 17 | 17 | 0 | 0 |  |
| Warhammer | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| War Pick | yakın, Versatile | 13 | 13 | 0 | 0 |  |
| Whip | yakın, Finesse, Reach | 14 | 14 | 0 | 0 |  |
| Blowgun | menzilli | 17 | 17 | 0 | 0 |  |
| Hand Crossbow | menzilli | 17 | 17 | 0 | 0 |  |
| Heavy Crossbow | menzilli, Heavy | 18 | 18 | 0 | 0 |  |
| Longbow | menzilli, Heavy | 18 | 18 | 0 | 0 |  |
| Musket | menzilli | 17 | 17 | 0 | 0 |  |
| Pistol | menzilli | 17 | 17 | 0 | 0 |  |
| Unarmed Strike | yakın | 3 | 3 | 0 | 0 |  |

## Canavar saldırıları

579 saldırının 579 tanesinin bütün bağlamları doğru. Sorunlu olanlar:

| Saldırı | Mekanik | Satır | ✗ | Bulgu |
|---|---|---:|---:|---|

## Yöntem

- **Sahne:** düz 31×45 altıgen zemin (kale-onu haritası, "Düz zemin" ortamı: ortam kuralı yok; zemin, nesne ve alanlar temiz), güncel kural sürümü, varsayılan Game Master anahtarları ve ev kuralları. Ev kuralı `carpmaHasari` (varsayılan açık, SRD'de yok) itmeli alan bağlamlarına karışmasın diye ikinci düşman itme ekseninin dışında.
- **Büyücü:** 20. seviye, büyü DC 18, büyü saldırısı +10, büyü değiştiricisi +4, her seviyeden 4 slot, sınıf özelliği yok. **Hedef:** AC 15, 300 HP, save değiştiricileri 0, türü SRD metnine göre (Beast, Humanoid…). **Canavar saldırısının hedefi:** AC 15, 999 HP, save +5.
- **Zar (kancalı Rng):** motorun zar istekleri amaçla yanıtlanır. Büyü saldırısı d20 tek zarda 8, çift zarda 2/16 (silah ve canavarda 19 ve 5/19); kip, motorun tuttuğu doğal zardan doğrulanır. Kritik 20, ıska 1. Save d20: başarısız 1, başarılı 20; dezavantaj sondası 19/3; yarım siper sondası 16 (yalnız +2 ile geçer), ¾ siper sondası 14 (yalnız +5 ile geçer). Hasar zarları yüze bağlı sabit (⌊yüz/2⌋ + 1: d4 3, d6 4, d8 5, d10 6, d12 7): toplam yalnız zar sayısına bağlı; zar ifadesi kanonik biçimde (yüz başına toplam zar + sabit) karşılaştırılır. Tepki ve seçim istemleri kancayla (Shield, Counterspell, Hellish Rebuke kullanılır; diğer tepkiler kullanılmaz).
- **Kahin (beklenen):** SRD 5.2.1 kaydından (data/srd/spells.json, data/srd/weapons.json) otomatik ayrıştırma — saldırı/save türü, hasar zarı ve türü, yarı hasar, durumlar, süre, konsantrasyon, yukarı slot, kantrip kademesi, alan, hedef türü, "görebildiğin yaratık", "creatures of your choice", "Advantage if you or your allies are fighting it" — ve SRD metninden elle okunan özel tablo (`src/sim/matris/ozel.ts`: yapım anı ya da tetik davranışı, seçimli büyüler, Ice Knife patlaması, Acid Arrow ıskası…). Motor kodu kahinde kullanılmaz; motorun büyü verisi yalnız komutun biçimini (alan nişanı, seçim) belirlemek için okunur.
- **D&D kuralları (kahinde):** direnç ⌊/2⌋, zayıflık ×2, bağışıklık 0; başarılı save'de yarı hasar (kantripte 0), ardından direnç; kritikte zarlar iki kat, sabitler bir kez; avantaj ve dezavantaj birbirini götürür; siper +2/+5 AC ve DEX save'e; Prone hedefe 5 ft içinden avantaj, uzaktan dezavantaj; Restrained hedefe avantaj ve DEX save'inde dezavantaj; Invisible hedefe dezavantaj, "görmen gereken" etki yapılamaz; Frightened saldırana dezavantaj; Charmed büyüleyene saldıramaz; menzilli saldırıda yanında düşman ve uzun menzil dezavantaj; Heavy silahta STR/DEX < 13 dezavantaj; konsantrasyon DC'si max(10, ⌊hasar/2⌋), en çok 30; yeni konsantrasyon eskisini bitirir; Counterspell başarısızlığında büyü boşa gider ve slot harcanmaz; Shield +5 AC (tetikleyen saldırıya da) ve Magic Missile'i keser; Blindsight/Truesight menzilindeki görünmez hedefe dezavantaj yok; gün ışığında Sunlight Sensitivity/Weakness/Hypersensitivity ve Light Sensitivity dezavantajı.
- **Yüzey/zemin:** beklenen, oyunun kendi tablosu (data/yuzey-etkilesimleri.json element satırları: ateş→yağ `fireOil`, soğuk→su `coldWater`, yıldırım→su `lightningWater`, kuvvet/gök gürültüsü→su `forceWater`).
- **Canavar saldırıları:** beklenen data/monsters.json'dan (saldırı bonusu, zar, tür; SRD metnindeki sabit hasar, "Advantage ile" alternatif zar) ve yukarıdaki kurallardan. Ek etkiler (rider) bu matriste ölçülmez.
- **Sonuç sınıfları:** *doğru* = karşılaştırılan bütün alanlar eşit; *yanlış* = motor sonuç üretiyor ama değer SRD'den farklı ya da SRD'nin yasakladığını kabul ediyor; *çökme* = komut istisna fırlatıyor; *uygulanmıyor* = SRD etkisi motorda yok (savaş dışı işaretli ya da beklenen durum/etki hiç üretilmiyor); *karar bekliyor* = SRD metni iki türlü okunabiliyor (bulgu kaydında gerekçe).

## Kahin ve ölçüm düzeltmeleri

Kahin motoru haklı çıkarmak için değiştirilmez; her değişiklik SRD alıntısıyla ya da ölçümün kendisiyle gerekçelendirilir.

- **Sabit hasarlı silah (Blowgun):** SRD 5.2.1 Damage Rolls: "Unless a rule says otherwise, you don't add your ability modifier to a fixed damage amount that doesn't use a roll, such as the damage of a Blowgun." İlk ölçümde kahin 1 + DEX bekliyordu (motor çöktüğü için karşılaştırılmamıştı); şimdi 1, zar yok, kritikte de 1.
- **Save kipinin ölçümü:** `save_resolved.mode` alanı motorun 41 save yolunun 27'sinde sabit 'normal', kalanında yalnız ortam kipi (Restrained, Dodge, Haste gibi durum/etki kaynaklı avantaj-dezavantaj yazılmaz). Kip artık atılan zardan okunur: kancaya gelen d20 save isteğinin `mode` alanı (olaydaki zarlarla eşleşen istek). Beklenen değişmedi (SRD Restrained: "You have Disadvantage on Dexterity saving throws."). Bu değişiklik ilk ölçümdeki hiçbir satırın sonucunu değiştirmedi (sürüm 82 ölçümü: yalnız Ç01 farkı).
- **Etkilenen sayımı iyileşmeyi de içerir:** Conjure Celestial: "For each creature you can see in the Cylinder, choose which of these lights shines on it: Healing Light … Searing Light." Dost iyileştiyse etkilenmiştir (eskiden yalnız save ve saldırı sayılıyordu).
- **Haritayı kaplayan küre (Storm of Vengeance):** "spreading to a radius of 300 feet. Each creature under the cloud when it appears must succeed on a Constitution saving throw". Kürenin yarıçapı içindeki büyücü ve dost da etkilenenlere girer (yalnız küre biçimli, herkesi etkileyen alanlarda; duvarlar hariç).
- **B11 yanlış bulguydu (Prismatic Spray):** SRD Prismatic Rays: "Successful Save: Half as much damage." Motor zaten yarı hasar veriyor (`saveEffect` → `hurt(..., half = başarı)`); ışın save'i `kind: 'save'` etiketsiz atıldığı için kanca save planı veremiyor, d20 = 10 ile hep başarısız ölçülüyordu (G02). Başarı bağlamı büyücünün DC'si 10 iken ölçülür; motor değişmedi.
- **Haritayı kaplayan küre kuralının sınırı:** yalnız yarıçapı haritanın boyunu (45 altıgen) aşan kürede (Storm of Vengeance) uygulanır; serbest şekilli Fire Storm'da (veride 25 ft küre, seçilen altıgenler) uygulanmaz. Grup 1 ölçümü bu sınırla ve B11 ölçümüyle yeniden yapıldı (yanlış 57 → 55; iki satır kahin kaynaklıydı).
- **Görünüm notu G01 (sonucu etkilemez, düzeltilmedi):** günlük save satırı zarları "19 / 3" diye gösterip kipi `mode` alanından "normal" yazıyor; durumdan gelen dezavantaj günlükte görünmüyor. Öneri: save olaylarına etkin kipi yazmak (41 yol; onay bekliyor).

## Kapsam ve sınırlar

- 339 büyünün hepsi matriste; savaş dışı işaretli (ya da SRD'de 1 dakika ve üstü yapım süreli) büyüler tek satır: SRD etkisi savaşta anlamlıysa *uygulanmıyor*, değilse *doğru*.
- Silah: SRD Weapons tablosunun 38 silahı + fırlatma biçimleri + Unarmed Strike, 5. seviye Fighter (STR 16, DEX 14), ustalık seçilmemiş (Graze, Topple… karışmasın diye).
- Ölçülmeyenler: canavar saldırı ek etkileri (A2 envanteri ayrı), Multiattack, sınıf özellikleri (Sneak Attack, Rage…), sihirli eşyalar, çok altıgen gövde, irtifa/dikey, büyülerin sonraki turlardaki tekrarı (`spell_followup`), süren etkilerin sonraki zarlardaki sayısal katkısı (Bless +1d4 gibi: yalnız etkinin varlığı, süresi, konsantrasyon bağı ölçüldü), alan geometrisinin kenar altıgenleri (yalnız açıkça içeride/dışarıda konumlar).
- Telekinesis'in STR save'i yapılandırılmış olay (`save_resolved`) yerine günlük notuyla kaydediliyor; yalnız durum sonucu karşılaştırıldı.
- "Doğru" bir senaryonun doğru olduğunu söyler; bütün zar kombinasyonlarını değil.
- Yeniden üretmek için: `npx vite-node src/sim/mekanikMatris.ts -- --yaz`; tek büyü/saldırı ayrıntısı: `npx vite-node src/sim/mekanikMatris.ts -- --buyu "Fireball" --hepsi`; eski sürümle ölçüm: `-- --kural-surumu 82`; önce/sonra tablosuna aşama ekleme: `-- --etiket "Grup 1 sonrası"`.
