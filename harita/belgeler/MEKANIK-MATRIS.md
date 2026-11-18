# Mekanik doğrulama matrisi (APK öncesi)

Üretim: `npx vite-node src/sim/mekanikMatris.ts -- --yaz` (tek süreç, ≈5 sn). Kural sürümü 82. Mekaniğe dokunulmadı; yalnız ölçüm.
Satır satır sonuçlar: [`mekanik-matris.csv`](mekanik-matris.csv) (UTF-8, virgülle ayrılmış; sütunlar: tür, büyü/saldırı, seviye, sınıflar, mekanik, bağlam, bağlam sınıfı, beklenen, gerçek, sonuç, bulgu, not).

## Özet

- Toplam satır: **6587** (büyü 1832 satır / 339 büyü; silah 670 satır / 46 seçenek; canavar 4085 satır / 579 saldırı).
- Doğru oranı: **95.8%** (6312/6587); karar bekleyenler hariç 96.2%.
- Sonuçlar: doğru 6312 · yanlış 235 · çökme 9 · uygulanmıyor 2 · karar bekliyor 29.
- Kök nedene göre: 20 yanlış, 1 çökme, 2 uygulanmıyor, 4 karar bekleyen bulgu.

| Tür | Satır | Doğru | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor | Doğru oranı |
|---|---:|---:|---:|---:|---:|---:|---:|
| Büyü | 1832 | 1616 | 185 | 0 | 2 | 29 | 88.2% |
| Silah | 670 | 661 | 0 | 9 | 0 | 0 | 98.7% |
| Canavar | 4085 | 4035 | 50 | 0 | 0 | 0 | 98.8% |

## Yanlış dağılımı

### Sınıflara göre (büyünün sınıf listesi; bir büyü birden çok sınıfta sayılır)

| Sınıf | Büyü satırı | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor | Yanlış oranı |
|---|---:|---:|---:|---:|---:|---:|
| Bard | 502 | 38 | 0 | 1 | 18 | 7.6% |
| Cleric | 428 | 47 | 0 | 1 | 6 | 11.0% |
| Druid | 620 | 64 | 0 | 1 | 10 | 10.3% |
| Paladin | 113 | 3 | 0 | 0 | 1 | 2.7% |
| Ranger | 148 | 5 | 0 | 0 | 3 | 3.4% |
| Sorcerer | 996 | 82 | 0 | 0 | 13 | 8.2% |
| Warlock | 369 | 23 | 0 | 0 | 9 | 6.2% |
| Wizard | 1165 | 103 | 0 | 2 | 21 | 8.8% |
| Silah (karakter) | 670 | 0 | 9 | 0 | 0 | 0.0% |
| Canavar saldırısı | 4085 | 50 | 0 | 0 | 0 | 1.2% |

### Bağlam sınıfına göre

| Bağlam sınıfı | Satır | Doğru | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor |
|---|---:|---:|---:|---:|---:|---:|
| alan | 96 | 83 | 12 | 0 | 0 | 1 |
| durum | 1976 | 1820 | 130 | 1 | 0 | 25 |
| hasar türü | 1384 | 1350 | 30 | 3 | 0 | 1 |
| konsantrasyon | 157 | 149 | 8 | 0 | 0 | 0 |
| saldırı zarı | 634 | 630 | 3 | 1 | 0 | 0 |
| save | 233 | 222 | 11 | 0 | 0 | 0 |
| siper | 216 | 208 | 6 | 2 | 0 | 0 |
| tepki | 731 | 719 | 11 | 1 | 0 | 0 |
| yapım | 1025 | 1007 | 13 | 1 | 2 | 2 |
| yukarı slot | 107 | 103 | 4 | 0 | 0 | 0 |
| yüzey | 28 | 21 | 7 | 0 | 0 | 0 |

## Bulgular (kök nedene göre; öncelik sırası: yanlış → çökme → uygulanmıyor → karar bekliyor)

Düzeltme yapılmadı; öneriler onaydan sonra uygulanacak.

### B01 — Restrained hedefin DEX save'i dezavantajlı atılmıyor (yanlış; 72 satır)

- **Neden:** SRD 5.2.1 Restrained: "You have Disadvantage on Dexterity saving throws." `saveMode` (src/battle/durations.ts) Restrained'ı hiç okumuyor; büyü, canavar nefesi ve alan save'lerinin hepsi normal kipte.
- **Öneri:** `saveMode` içinde `ability === 'dex' && s.conditions.includes('Restrained')` → dezavantaj (yeni kural sürümüyle kapılı; eski kayıtlar aynı kalsın).
- **Etkilenen (72):** Acid Splash, Sacred Flame, Burning Hands, Fireball, Lightning Bolt, Call Lightning, Grease, Ice Storm, Vitriolic Sphere, Flame Strike, Wall of Fire, Resilient Sphere, Blade Barrier, Chain Lightning, Disintegrate, Wall of Ice, Wall of Thorns, Conjure Celestial, Fire Storm, Earthquake, Incendiary Cloud, Meteor Swarm, Giant Spider: Web, Young Red Dragon: Fire Breath, Black Dragon Wyrmling: Acid Breath, Blue Dragon Wyrmling: Lightning Breath, Brass Dragon Wyrmling: Fire Breath, Bronze Dragon Wyrmling: Lightning Breath, Copper Dragon Wyrmling: Acid Breath, Gold Dragon Wyrmling: Fire Breath, Red Dragon Wyrmling: Fire Breath, Young Black Dragon: Acid Breath, Young Blue Dragon: Lightning Breath, Young Brass Dragon: Fire Breath, Young Bronze Dragon: Lightning Breath, Young Copper Dragon: Acid Breath, Young Gold Dragon: Fire Breath, Adult Black Dragon: Acid Breath, Adult Blue Dragon: Lightning Breath, Adult Brass Dragon: Fire Breath, Adult Bronze Dragon: Lightning Breath, Adult Copper Dragon: Acid Breath, Adult Gold Dragon: Fire Breath, Adult Red Dragon: Fire Breath, Ancient Black Dragon: Acid Breath, Ancient Blue Dragon: Lightning Breath, Ancient Brass Dragon: Fire Breath, Ancient Bronze Dragon: Lightning Breath, Ancient Copper Dragon: Acid Breath, Ancient Gold Dragon: Fire Breath, Ancient Red Dragon: Fire Breath, Dust Mephit: Blinding Breath, Magma Mephit: Fire Breath, Ankheg: Acid Spray, Ettercap: Web Strand, Gibbering Mouther: Blinding Spittle, Hell Hound: Fire Breath, Bulette: Deadly Leap, Half-Dragon: Dragon’s Breath, Chimera: Fire Breath, … (+12)
- **Örnek:** Acid Splash — hedef Restrained (DEX save dezavantajı): beklenen `save=dex/18; kip=disadvantage; başarı=hayır; hasar=16; tür=acid; durum=yok`, gerçek `save=dex/18; kip=normal; başarı=evet; hasar=0; tür=acid; durum=yok`

### B02 — "Görebildiğin yaratık" isteyen büyüler Invisible hedefe yapılabiliyor (yanlış; 38 satır)

- **Neden:** SRD 5.2.1 Invisible: "You aren't affected by any effect that requires its target to be seen unless the effect's creator can somehow see you." Büyü metni "a creature (that) you can see" dediği hâlde motor Invisible hedefi kabul ediyor (görme yeteneği olmayan büyücüyle).
- **Öneri:** Büyü verisine SRD metninden "görme gerekir" bayrağı (ör. `seen: true`) ekleyip `castSpell`/`executeEffect`/`executeTrueStrike` hedef denetiminde Invisible hedefi, büyücü onu göremiyorsa (See Invisibility, Truesight, Blindsight menzili yoksa; `sight.ts` `sightConditions`/`truesightSees`) reddetmek.
- **Etkilenen (38):** Sacred Flame, Vicious Mockery, Magic Missile, Charm Person, Hideous Laughter, Dissonant Whispers, Bane, Command, Hunter's Mark, Hex, Hold Person, Blindness/Deafness, Levitate, Mind Spike, Enlarge/Reduce, Animal Friendship, Phantasmal Force, Suggestion, Blight, Charm Monster, Phantasmal Killer, Hold Monster, Banishment, Dominate Beast, Dominate Person, Polymorph, Chain Lightning, Disintegrate, Eyebite, Flesh to Stone, Harm, Irresistible Dance, Mass Suggestion, Finger of Death, Befuddlement, Dominate Monster, Power Word Kill, True Polymorph
- **Örnek:** Sacred Flame — hedef Invisible: beklenen `red (yapılamaz)`, gerçek `kabul edildi`

### B03 — Counterspell ile durdurulan 6.–9. seviye büyülerin etkisi yine uygulanıyor (yanlış; 5 satır)

- **Neden:** src/battle/spells.ts `executeCast`: `executeCastOver` Counterspell'le durdurulmuş (slot harcanmamış) sonuç döndürse de `after69` kancası çalışıyor; Power Word Kill hasar veriyor, Power Word Stun etki koyuyor, Prismatic Spray, Mass Heal ve Reverse Gravity uygulanıyor.
- **Öneri:** `executeCastWith` durdurmayı işaretlesin (ör. `countered: true`); `executeCast` bu durumda `after69` ve sonrası kancaları atlasın.
- **Etkilenen (5):** Prismatic Spray, Reverse Gravity, Power Word Stun, Mass Heal, Power Word Kill
- **Örnek:** Prismatic Spray — Counterspell (büyücünün CON save'i başarısız): beklenen `tepki=K:Counterspell; büyücü slotu=yok; K slotu=3; etki=yok; kons=yok`, gerçek `tepki=K:Counterspell; büyücü slotu=yok; K slotu=3; etki=T:hp; kons=yok`

### B04 — Tepki büyüleri eylemle yapılabiliyor (Shield, Counterspell, Feather Fall, Hellish Rebuke) (yanlış; 4 satır)

- **Neden:** SRD: yapım süresi "Reaction, which you take when …". `cast_spell` komutu bunları eylemle kabul ediyor; slot harcanıyor, tetik olmadığı için etki yok (A0 bulgusu, hâlâ açık).
- **Öneri:** Büyü verisinde `castingTime: reaction` olanları `cast_spell` komutunda reddetmek (tepki akışı `reactions.ts` ayrı yoldan yapıyor).
- **Etkilenen (4):** Feather Fall, Shield, Hellish Rebuke, Counterspell
- **Örnek:** Feather Fall — eylemle yapım (SRD: yalnız tepki): beklenen `red (yapılamaz)`, gerçek `kabul edildi`

### B05 — Alan büyülerinin yapım anı save'i eksik ya da tetik zamanı yanlış (yanlış; 68 satır)

- **Neden:** SRD: Incendiary Cloud "When the cloud appears … each creature in it makes a DEX save" ve giriş/tur sonu; veride `zone.on` = enter, end (cast yok). Wall of Thorns yapımda DEX 7d8 Piercing, giriş/tur sonunda 7d8 Slashing; veride yalnız enter. Blade Barrier yapımda save + giriş/tur sonu; veride enter, start. Conjure Celestial yapımda her yaratığa Searing Light (DEX 6d12) + giriş/tur sonu; veride enter, start. Storm of Vengeance belirince CON save, 2d6 Thunder + Deafened; veride yalnız aşamalı tur başı.
- **Öneri:** Büyü verisinde `zone.on` listelerini SRD'ye çekmek (cast ekle; start → end), Wall of Thorns için yapım ve tetik hasar türlerini ayırmak, Storm of Vengeance'a yapım anı save + Deafened eklemek.
- **Etkilenen (5):** Blade Barrier, Wall of Thorns, Conjure Celestial, Incendiary Cloud, Storm of Vengeance
- **Örnek:** Blade Barrier — normal (save başarısız): beklenen `save=dex/18; kip=normal; başarı=hayır; zar=6d10; hasar=36; tür=force; durum=yok; slot=6; kons=Blade Barrier`, gerçek `save=yok; kip=—; başarı=—; zar=yok; hasar=0; tür=yok; durum=yok; slot=6; kons=Blade Barrier`

### B06 — Wall of Ice kesme hasarı save'siz tam uygulanıyor (yanlış; 10 satır)

- **Neden:** SRD: duvarın kestiği yaratık itilir ve DEX save atar; başarıda yarı hasar. Motor 10d6 Cold'u save olayı olmadan tam veriyor (`walls.ts` `cutDamage`).
- **Öneri:** `cutDamage` yolunda DEX save (büyücünün DC'si) ve başarıda yarı hasar; `save_resolved` olayı.
- **Etkilenen (1):** Wall of Ice
- **Örnek:** Wall of Ice — normal (save başarısız): beklenen `save=dex/18; kip=normal; başarı=hayır; zar=10d6; hasar=40; tür=cold; durum=yok; slot=6; kons=Wall of Ice`, gerçek `save=yok; kip=—; başarı=—; zar=10d6; hasar=40; tür=yok; durum=yok; slot=6; kons=Wall of Ice`

### B07 — Ensnaring Strike: Large ve büyük hedefin save avantajı hiç verilmiyor (yanlış; 1 satır)

- **Neden:** src/battle/spells.ts (`executeSmite`, `largeAdvantage`): boyut `['Large','Huge','Gargantuan'].includes(hit.size)` ile sınanıyor; savaşçı boyutları `L/H/G` kodlarıyla saklanıyor, koşul hiç tutmuyor.
- **Öneri:** Karşılaştırmayı `['L','H','G']` yapmak.
- **Etkilenen (1):** Ensnaring Strike
- **Örnek:** Ensnaring Strike — Large hedef (save avantajlı): beklenen `kip=advantage; durum=yok`, gerçek `kip=normal; durum=Restrained`

### B08 — Sacred Flame siperden yararlandırıyor (yanlış; 2 satır)

- **Neden:** SRD: "The target gains no benefit from Half Cover or Three-Quarters Cover for this save." Motor DEX save'e +2/+5 ekliyor.
- **Öneri:** Büyü verisine `ignoresCover` bayrağı; `castSpell` save yolunda `dexCover = 0`.
- **Etkilenen (1):** Sacred Flame
- **Örnek:** Sacred Flame — yarım siper (+2 DEX save; SRD: bu büyüde siper yok): beklenen `save=dex/18; kip=normal; başarı=hayır; hasar=20; tür=radiant; durum=yok`, gerçek `save=dex/18; kip=normal; başarı=evet; hasar=0; tür=radiant; durum=yok`

### B09 — Arcane Sword hasarına büyü yeteneği değiştiricisi eklenmiyor (yanlış; 6 satır)

- **Neden:** SRD: "Force damage equal to 4d12 plus your spellcasting ability modifier". Motor 4d12 atıyor; konsantrasyon DC'si de düşük hesaplanıyor.
- **Öneri:** data/spells-69.json Arcane Sword mekaniğine `addCastingMod: true`.
- **Etkilenen (1):** Arcane Sword
- **Örnek:** Arcane Sword — normal (isabet): beklenen `ışın=1; kip=normal; doğal=8; AC=15; isabet=evet; kritik=hayır; zar=4d12+4; hasar=32; tür=force; slot=7; kons=Arcane Sword`, gerçek `ışın=1; kip=normal; doğal=8; AC=15; isabet=evet; kritik=hayır; zar=4d12; hasar=28; tür=force; slot=7; kons=Arcane Sword`

### B10 — Arcane Hand yapımda etki uygulamıyor (yanlış; 14 satır)

- **Neden:** SRD: "When you cast the spell and as a Bonus Action on your later turns, you can move the hand … and then cause one of the following effects" (Clenched Fist 5d8 Force…). Motor eli çağırıyor ama yapım anında etki yok.
- **Öneri:** Çağrıdan hemen sonra bir el etkisi seçimi (yapım komutunda `choice` + hedef) ya da aynı turda bedava ilk etki.
- **Etkilenen (1):** Arcane Hand
- **Örnek:** Arcane Hand — normal (isabet): beklenen `ışın=1; kip=normal; doğal=8; AC=15; isabet=evet; kritik=hayır; zar=5d8; hasar=25; tür=force; slot=5; kons=Arcane Hand`, gerçek `ışın=0; kip=—; doğal=—; AC=—; isabet=—; kritik=—; zar=yok; hasar=0; tür=yok; slot=5; kons=Arcane Hand`

### B11 — Prismatic Spray hasar ışınlarında başarılı save yarı hasar vermiyor (yanlış; 1 satır)

- **Neden:** SRD Prismatic Rays (Red–Blue): "Failed Save: 12d6 … Successful Save: Half as much damage." Motor başarılı save'de tam hasar uyguluyor.
- **Öneri:** src/battle/spells69.ts Prismatic Spray ışın çözümünde başarıda `Math.floor(raw / 2)`.
- **Etkilenen (1):** Prismatic Spray
- **Örnek:** Prismatic Spray — ışın d8=5 (Blue; save başarılı, SRD: yarı): beklenen `hasar=24`, gerçek `hasar=48`

### B12 — Chain Lightning yukarı slotta ek hedef eklemiyor (yanlış; 1 satır)

- **Neden:** SRD: "One additional bolt leaps from the first target to another target for each spell slot level above 6." Veride `extraTargets: 3` sabit, `upcast.other` uygulanmış görünse de hedef sayısı artmıyor.
- **Öneri:** Ek hedef sayısı = 3 + (slot − 6).
- **Etkilenen (1):** Chain Lightning
- **Örnek:** Chain Lightning — yukarı slot 7 (+1 ek hedef): beklenen `hasar alan=5; slot=7`, gerçek `hasar alan=4; slot=7`

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

### B17 — Protection from Energy süresi 10 dakika (yanlış; 1 satır)

- **Neden:** SRD: Konsantrasyon, en çok 1 saat (600 tur). Veride `rounds: 100`.
- **Öneri:** data/spells.json Protection from Energy `effect.rounds: 600`.
- **Etkilenen (1):** Protection from Energy
- **Örnek:** Protection from Energy — normal (dosta): beklenen `etki=evet; süre=600 tur; slot=3; kons=Protection from Energy`, gerçek `etki=evet; süre=100 tur; slot=3; kons=Protection from Energy`

### B18 — Shining Smite işaretli hedefin Invisible yararını kaldırmıyor (yanlış; 1 satır)

- **Neden:** SRD: hedef "can't benefit from the Invisible condition"; işaretli Invisible hedefe saldırı avantajlı olmalı. Motor avantajı veriyor ama Invisible dezavantajını da sürdürüyor (sonuç normal).
- **Öneri:** Shining Smite koruma/ışık etkisinde hedefe `revealed` (Faerie Fire gibi) koymak.
- **Etkilenen (1):** Shining Smite
- **Örnek:** Shining Smite — parlayan hedefe saldırı avantajlı, Invisible yararı yok: beklenen `sonraki saldırı kipi=advantage`, gerçek `sonraki saldırı kipi=normal`

### B19 — İki hasar türlü büyülerde yüzey verisi eski alanlardan okunuyor (Ice Storm, Flame Strike) (yanlış; 3 satır)

- **Neden:** Ice Storm ve Flame Strike hasarı `split` ile doğru (SRD 2d10 Bludgeoning + 4d6 Cold; 5d6 Fire + 5d6 Radiant), ama `spell_cast.area` eski `damage`/`damageType` alanlarını taşıyor: altıgen çözücüsü Ice Storm için eski 7d6 zarını atıyor, Flame Strike alanı Radiant sayıldığından yağı tutuşturmuyor.
- **Öneri:** `executeAreaCast` alan olayında `split` varken hasar türü/zarı split'ten (ateş parçası) yazmak; eski alanları veriden kaldırmak.
- **Etkilenen (2):** Ice Storm, Flame Strike
- **Örnek:** Ice Storm — normal (save başarısız): beklenen `save=dex/18; kip=normal; başarı=hayır; zar=2d10+4d6; hasar=28; tür=bludgeoning; durum=yok; slot=4; kons=yok`, gerçek `save=dex/18; kip=normal; başarı=hayır; zar=2d10+11d6; hasar=28; tür=bludgeoning; durum=yok; slot=4; kons=yok`

### B20 — Alan (zone) yoluyla verilen ateş hasarı yüzey tablosuna girmiyor (Wall of Fire) (yanlış; 1 satır)

- **Neden:** Yüzey tablosunun `fireOil` satırı ateş hasarı değen yağı tutuşturur; `hexResolver.incomingOf` yalnız alan/isabet/save olaylarını okuyor, alan tetiğinin hasarını okumuyor.
- **Öneri:** `incomingOf` alan tetiğinden (`zone_triggered` + hasar) element üretsin.
- **Etkilenen (1):** Wall of Fire
- **Örnek:** Wall of Fire — yüzey: hedef yağda (fire → fireOil): beklenen `tepkime=fireOil`, gerçek `tepkime=yok`

### Ç01 — Blowgun her isabette istisna fırlatıyor ("Geçersiz zar ifadesi: \"1+2\"") (çökme; 9 satır)

- **Neden:** Blowgun hasarı sabit "1"; `weaponAttackOptions` (src/battle/weapons.ts `optionFor`) DEX değiştiricisini "1+2" diye ekliyor, `parseDice` sabit+sabit ifadesini ayrıştıramıyor. Iskada zar atılmadığı için yalnız isabet/kritik bağlamları çöküyor.
- **Öneri:** `optionFor` içinde zar sabitse (`/^\d+$/`) toplamı tek sabit yaz (`String(Number(dice) + bonus)` ya da `formatDice(0, 1, n)`).
- **Etkilenen (1):** Blowgun
- **Örnek:** Blowgun — normal (isabet): beklenen `kabul`, gerçek `istisna: Geçersiz zar ifadesi: "1+2"`

### U01 — Irresistible Dance Charmed durumunu vermiyor (uygulanmıyor; 1 satır)

- **Neden:** SRD 5.2.1: başarısız save'de hedef büyü süresince Charmed; dans etkileri Charmed iken. Motor dans etkisini uyguluyor ama Charmed durumu yok (Charmed'a bağlı kurallar: büyüleyene saldıramama, Countercharm vb. işlemez).
- **Öneri:** Etkiye `grants: ['Charmed']`.
- **Etkilenen (1):** Irresistible Dance
- **Örnek:** Irresistible Dance — normal (save başarısız): beklenen `save=wis/18; kip=normal; başarı=hayır; durum=Charmed; süre=10 tur; slot=6; kons=Irresistible Dance`, gerçek `save=wis/18; kip=normal; başarı=hayır; durum=yok; süre=10 tur; slot=6; kons=Irresistible Dance`

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

## Büyü matrisi (büyü başına)

Sembol: ✓ doğru, ✗ yanlış, ‼ çökme, ∅ uygulanmıyor, ? karar bekliyor. Bağlamların ayrıntısı CSV'de.

| Büyü | Sv | Mekanik | Satır | ✓ | ✗ | ‼ | ∅ | ? | Bulgu |
|---|---:|---|---:|---:|---:|---:|---:|---:|---|
| Acid Arrow | 2 | attack | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Acid Splash | 0 | save+alan(sphere) | 15 | 14 | 1 | 0 | 0 | 0 | B01 |
| Aid | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Alarm | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Alter Self | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Animal Friendship | 1 | effect | 7 | 5 | 1 | 0 | 0 | 1 | B02 K01 |
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
| Arcane Sword | 7 | attack | 16 | 9 | 6 | 0 | 0 | 1 | B09 K03 |
| Arcanist's Magic Aura | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Astral Projection | 9 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Augury | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Aura of Life | 4 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Awaken | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Bane | 1 | effect | 7 | 5 | 1 | 0 | 0 | 1 | B02 K01 |
| Banishment | 4 | effect | 8 | 6 | 1 | 0 | 0 | 1 | B02 K01 |
| Barkskin | 2 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Beacon of Hope | 3 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Befuddlement | 8 | save | 13 | 12 | 1 | 0 | 0 | 0 | B02 |
| Bestow Curse | 3 | effect | 5 | 4 | 0 | 0 | 0 | 1 | K01 |
| Black Tentacles | 4 | save+alan(cube) | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Blade Barrier | 6 | save+alan(wall) | 18 | 5 | 13 | 0 | 0 | 0 | B05 B01 |
| Bless | 1 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Blight | 4 | save | 14 | 13 | 1 | 0 | 0 | 0 | B02 |
| Blindness/Deafness | 2 | save | 9 | 8 | 1 | 0 | 0 | 0 | B02 |
| Blink | 3 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Blur | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Burning Hands | 1 | save+alan(cone) | 17 | 16 | 1 | 0 | 0 | 0 | B01 |
| Call Lightning | 3 | save+alan(sphere) | 16 | 15 | 1 | 0 | 0 | 0 | B01 |
| Calm Emotions | 2 | effect | 5 | 4 | 0 | 0 | 0 | 1 | K01 |
| Chain Lightning | 6 | save | 17 | 14 | 3 | 0 | 0 | 0 | B01 B02 B12 |
| Charm Monster | 4 | effect | 7 | 5 | 1 | 0 | 0 | 1 | B02 K01 |
| Charm Person | 1 | effect | 7 | 5 | 1 | 0 | 0 | 1 | B02 K01 |
| Chill Touch | 0 | attack | 17 | 17 | 0 | 0 | 0 | 0 |  |
| Chromatic Orb | 1 | attack | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Circle of Death | 6 | save+alan(sphere) | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Clairvoyance | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Clone | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Cloudkill | 5 | save+alan(sphere) | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Color Spray | 1 | save+alan(cone) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Command | 1 | effect | 10 | 9 | 1 | 0 | 0 | 0 | B02 |
| Commune | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Commune with Nature | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Comprehend Languages | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Compulsion | 4 | save+alan(sphere) | 8 | 7 | 1 | 0 | 0 | 0 | B15 |
| Cone of Cold | 5 | save+alan(cone) | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Confusion | 4 | save+alan(sphere) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Conjure Animals | 3 | summon+alan | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Conjure Celestial | 7 | save+alan(sphere) | 17 | 2 | 15 | 0 | 0 | 0 | B05 B01 |
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
| Disintegrate | 6 | save | 15 | 13 | 2 | 0 | 0 | 0 | B01 B02 |
| Dispel Evil and Good | 5 | buff | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Dispel Magic | 3 | dispel | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Dissonant Whispers | 1 | save | 14 | 13 | 1 | 0 | 0 | 0 | B02 |
| Divination | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Divine Favor | 1 | buff | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Divine Smite | 1 | smite | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Divine Word | 7 | utility | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Dominate Beast | 4 | effect | 6 | 4 | 1 | 0 | 0 | 1 | B02 K01 |
| Dominate Monster | 8 | effect | 6 | 4 | 1 | 0 | 0 | 1 | B02 K01 |
| Dominate Person | 5 | effect | 6 | 4 | 1 | 0 | 0 | 1 | B02 K01 |
| Dragon's Breath | 2 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Dream | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Druidcraft | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Earthquake | 8 | save+alan(sphere) | 9 | 8 | 1 | 0 | 0 | 0 | B01 |
| Eldritch Blast | 0 | attack | 21 | 21 | 0 | 0 | 0 | 0 |  |
| Elementalism | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Enhance Ability | 2 | effect (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Enlarge/Reduce | 2 | effect | 6 | 4 | 1 | 0 | 0 | 1 | B02 K01 |
| Ensnaring Strike | 1 | smite | 6 | 5 | 1 | 0 | 0 | 0 | B07 |
| Entangle | 1 | save+alan(cube) | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Enthrall | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Etherealness | 7 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Expeditious Retreat | 1 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Eyebite | 6 | save | 8 | 7 | 1 | 0 | 0 | 0 | B02 |
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
| Finger of Death | 7 | save | 13 | 12 | 1 | 0 | 0 | 0 | B02 |
| Fire Bolt | 0 | attack | 21 | 21 | 0 | 0 | 0 | 0 |  |
| Fire Shield | 4 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Fire Storm | 7 | save+alan(sphere) | 14 | 13 | 1 | 0 | 0 | 0 | B01 |
| Fireball | 3 | save+alan(sphere) | 17 | 16 | 1 | 0 | 0 | 0 | B01 |
| Flame Blade | 2 | attack | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Flame Strike | 5 | save+alan(sphere) | 17 | 15 | 2 | 0 | 0 | 0 | B01 B19 |
| Flaming Sphere | 2 | summon+alan | 7 | 7 | 0 | 0 | 0 | 0 |  |
| Flesh to Stone | 6 | save | 8 | 7 | 1 | 0 | 0 | 0 | B02 |
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
| Grease | 1 | zone+alan(cube) | 10 | 9 | 1 | 0 | 0 | 0 | B01 |
| Greater Invisibility | 4 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Greater Restoration | 5 | cure | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Guardian of Faith | 4 | save+alan(sphere) | 6 | 6 | 0 | 0 | 0 | 0 |  |
| Guards and Wards | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Guidance | 0 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Guiding Bolt | 1 | attack | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Gust of Wind | 2 | save+alan(line) | 8 | 8 | 0 | 0 | 0 | 0 |  |
| Hallow | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Hallucinatory Terrain | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Harm | 6 | save | 13 | 12 | 1 | 0 | 0 | 0 | B02 |
| Haste | 3 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Heal | 6 | heal | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Healing Word | 1 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Heat Metal | 2 | auto | 10 | 10 | 0 | 0 | 0 | 0 |  |
| Hellish Rebuke | 1 | save | 4 | 3 | 1 | 0 | 0 | 0 | B04 |
| Heroes’ Feast | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Heroism | 1 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Hex | 1 | mark | 8 | 7 | 1 | 0 | 0 | 0 | B02 |
| Hideous Laughter | 1 | effect | 8 | 6 | 1 | 0 | 0 | 1 | B02 K01 |
| Hold Monster | 5 | save | 9 | 8 | 1 | 0 | 0 | 0 | B02 |
| Hold Person | 2 | save | 9 | 8 | 1 | 0 | 0 | 0 | B02 |
| Holy Aura | 8 | effect | 3 | 0 | 3 | 0 | 0 | 0 | B13 |
| Hunter's Mark | 1 | mark | 8 | 7 | 1 | 0 | 0 | 0 | B02 |
| Hypnotic Pattern | 3 | save+alan(cube) | 9 | 9 | 0 | 0 | 0 | 0 |  |
| Ice Knife | 1 | attack | 18 | 18 | 0 | 0 | 0 | 0 |  |
| Ice Storm | 4 | save+alan(sphere) | 16 | 13 | 3 | 0 | 0 | 0 | B19 B01 |
| Identify | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Illusory Script | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Imprisonment | 9 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Incendiary Cloud | 8 | save+alan(sphere) | 21 | 5 | 16 | 0 | 0 | 0 | B05 B01 |
| Inflict Wounds | 1 | save | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Insect Plague | 5 | save+alan(sphere) | 19 | 19 | 0 | 0 | 0 | 0 |  |
| Instant Summons | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Invisibility | 2 | effect | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Irresistible Dance | 6 | effect | 6 | 3 | 1 | 0 | 1 | 1 | U01 B02 K01 |
| Jump | 1 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Knock | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Legend Lore | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Lesser Restoration | 2 | cure | 5 | 5 | 0 | 0 | 0 | 0 |  |
| Levitate | 2 | effect | 6 | 4 | 1 | 0 | 0 | 1 | B02 K01 |
| Light | 0 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Lightning Bolt | 3 | save+alan(line) | 17 | 16 | 1 | 0 | 0 | 0 | B01 |
| Locate Animals or Plants | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Locate Creature | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Locate Object | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Longstrider | 1 | effect | 4 | 4 | 0 | 0 | 0 | 0 |  |
| Mage Armor | 1 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Mage Hand | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Circle | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Jar | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Missile | 1 | auto | 10 | 9 | 1 | 0 | 0 | 0 | B02 |
| Magic Mouth | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Magic Weapon | 2 | buff | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Magnificent Mansion | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Major Image | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Mass Cure Wounds | 5 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Mass Heal | 9 | utility | 2 | 1 | 1 | 0 | 0 | 0 | B03 |
| Mass Healing Word | 3 | heal | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Mass Suggestion | 6 | effect | 5 | 2 | 2 | 0 | 0 | 1 | B16 B02 |
| Maze | 8 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Meld into Stone | 3 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Mending | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Message | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Meteor Swarm | 9 | save+alan(sphere) | 16 | 15 | 1 | 0 | 0 | 0 | B01 |
| Mind Blank | 8 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Mind Spike | 2 | save | 14 | 13 | 1 | 0 | 0 | 0 | B02 |
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
| Phantasmal Force | 2 | effect | 6 | 4 | 1 | 0 | 0 | 1 | B02 K01 |
| Phantasmal Killer | 4 | save | 14 | 13 | 1 | 0 | 0 | 0 | B02 |
| Phantom Steed | 3 | summon | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Planar Ally | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Planar Binding | 5 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Plane Shift | 7 | utility | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Plant Growth | 3 | zone+alan(sphere) | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Poison Spray | 0 | attack | 20 | 20 | 0 | 0 | 0 | 0 |  |
| Polymorph | 4 | effect | 6 | 4 | 1 | 0 | 0 | 1 | B02 K01 |
| Power Word Heal | 9 | utility | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Power Word Kill | 9 | utility | 5 | 3 | 2 | 0 | 0 | 0 | B02 B03 |
| Power Word Stun | 8 | utility | 3 | 2 | 1 | 0 | 0 | 0 | B03 |
| Prayer of Healing | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Prestidigitation | 0 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Prismatic Spray | 7 | utility | 3 | 1 | 2 | 0 | 0 | 0 | B11 B03 |
| Prismatic Wall | 9 | zone+alan(wall) | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Private Sanctum | 4 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Produce Flame | 0 | attack | 2 | 2 | 0 | 0 | 0 | 0 |  |
| Programmed Illusion | 6 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Project Image | 7 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Protection from Energy | 3 | effect | 3 | 2 | 1 | 0 | 0 | 0 | B17 |
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
| Resilient Sphere | 4 | effect | 6 | 4 | 1 | 0 | 0 | 1 | B01 K01 |
| Resistance | 0 | effect | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Resurrection | 7 | revive (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Reverse Gravity | 7 | utility | 2 | 1 | 1 | 0 | 0 | 0 | B03 |
| Revivify | 3 | revive | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Rope Trick | 2 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Sacred Flame | 0 | save | 17 | 13 | 4 | 0 | 0 | 0 | B01 B02 B08 |
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
| Storm of Vengeance | 9 | save+alan(sphere) | 14 | 2 | 12 | 0 | 0 | 0 | B05 |
| Suggestion | 2 | effect | 6 | 3 | 2 | 0 | 0 | 1 | B16 B02 |
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
| True Polymorph | 9 | effect | 6 | 4 | 1 | 0 | 0 | 1 | B02 K01 |
| True Resurrection | 9 | revive (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| True Seeing | 6 | effect | 2 | 2 | 0 | 0 | 0 | 0 |  |
| True Strike | 0 | attack | 14 | 14 | 0 | 0 | 0 | 0 |  |
| Tsunami | 8 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Unseen Servant | 1 | utility (savaş dışı) | 1 | 1 | 0 | 0 | 0 | 0 |  |
| Vampiric Touch | 3 | attack | 15 | 15 | 0 | 0 | 0 | 0 |  |
| Vicious Mockery | 0 | save | 15 | 14 | 1 | 0 | 0 | 0 | B02 |
| Vitriolic Sphere | 4 | save+alan(sphere) | 16 | 15 | 1 | 0 | 0 | 0 | B01 |
| Wall of Fire | 4 | save+alan(wall) | 18 | 16 | 2 | 0 | 0 | 0 | B01 B20 |
| Wall of Force | 5 | zone+alan(wall) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Wall of Ice | 6 | save+alan(wall) | 14 | 3 | 11 | 0 | 0 | 0 | B06 B01 |
| Wall of Stone | 5 | zone+alan(wall) | 3 | 3 | 0 | 0 | 0 | 0 |  |
| Wall of Thorns | 6 | save+alan(wall) | 18 | 2 | 16 | 0 | 0 | 0 | B05 B01 |
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
| Blowgun | menzilli | 17 | 8 | 0 | 9 | Ç01 |
| Hand Crossbow | menzilli | 17 | 17 | 0 | 0 |  |
| Heavy Crossbow | menzilli, Heavy | 18 | 18 | 0 | 0 |  |
| Longbow | menzilli, Heavy | 18 | 18 | 0 | 0 |  |
| Musket | menzilli | 17 | 17 | 0 | 0 |  |
| Pistol | menzilli | 17 | 17 | 0 | 0 |  |
| Unarmed Strike | yakın | 3 | 3 | 0 | 0 |  |

## Canavar saldırıları

579 saldırının 529 tanesinin bütün bağlamları doğru. Sorunlu olanlar:

| Saldırı | Mekanik | Satır | ✗ | Bulgu |
|---|---|---:|---:|---|
| Giant Spider: Web | save (DEX 13) | 3 | 1 | B01 |
| Young Red Dragon: Fire Breath | save (DEX 17) | 4 | 1 | B01 |
| Black Dragon Wyrmling: Acid Breath | save (DEX 11) | 4 | 1 | B01 |
| Blue Dragon Wyrmling: Lightning Breath | save (DEX 12) | 4 | 1 | B01 |
| Brass Dragon Wyrmling: Fire Breath | save (DEX 11) | 4 | 1 | B01 |
| Bronze Dragon Wyrmling: Lightning Breath | save (DEX 12) | 4 | 1 | B01 |
| Copper Dragon Wyrmling: Acid Breath | save (DEX 11) | 4 | 1 | B01 |
| Gold Dragon Wyrmling: Fire Breath | save (DEX 13) | 4 | 1 | B01 |
| Red Dragon Wyrmling: Fire Breath | save (DEX 13) | 4 | 1 | B01 |
| Young Black Dragon: Acid Breath | save (DEX 14) | 4 | 1 | B01 |
| Young Blue Dragon: Lightning Breath | save (DEX 16) | 4 | 1 | B01 |
| Young Brass Dragon: Fire Breath | save (DEX 14) | 4 | 1 | B01 |
| Young Bronze Dragon: Lightning Breath | save (DEX 15) | 4 | 1 | B01 |
| Young Copper Dragon: Acid Breath | save (DEX 14) | 4 | 1 | B01 |
| Young Gold Dragon: Fire Breath | save (DEX 17) | 4 | 1 | B01 |
| Adult Black Dragon: Acid Breath | save (DEX 18) | 4 | 1 | B01 |
| Adult Blue Dragon: Lightning Breath | save (DEX 19) | 4 | 1 | B01 |
| Adult Brass Dragon: Fire Breath | save (DEX 18) | 4 | 1 | B01 |
| Adult Bronze Dragon: Lightning Breath | save (DEX 19) | 4 | 1 | B01 |
| Adult Copper Dragon: Acid Breath | save (DEX 18) | 4 | 1 | B01 |
| Adult Gold Dragon: Fire Breath | save (DEX 21) | 4 | 1 | B01 |
| Adult Red Dragon: Fire Breath | save (DEX 21) | 4 | 1 | B01 |
| Ancient Black Dragon: Acid Breath | save (DEX 22) | 4 | 1 | B01 |
| Ancient Blue Dragon: Lightning Breath | save (DEX 23) | 4 | 1 | B01 |
| Ancient Brass Dragon: Fire Breath | save (DEX 21) | 4 | 1 | B01 |
| Ancient Bronze Dragon: Lightning Breath | save (DEX 23) | 4 | 1 | B01 |
| Ancient Copper Dragon: Acid Breath | save (DEX 22) | 4 | 1 | B01 |
| Ancient Gold Dragon: Fire Breath | save (DEX 24) | 4 | 1 | B01 |
| Ancient Red Dragon: Fire Breath | save (DEX 24) | 4 | 1 | B01 |
| Dust Mephit: Blinding Breath | save (DEX 10) | 3 | 1 | B01 |
| Magma Mephit: Fire Breath | save (DEX 11) | 4 | 1 | B01 |
| Ankheg: Acid Spray | save (DEX 12) | 4 | 1 | B01 |
| Ettercap: Web Strand | save (DEX 12) | 3 | 1 | B01 |
| Gibbering Mouther: Blinding Spittle | save (DEX 10) | 4 | 1 | B01 |
| Hell Hound: Fire Breath | save (DEX 12) | 4 | 1 | B01 |
| Bulette: Deadly Leap | save (DEX 15) | 4 | 1 | B01 |
| Half-Dragon: Dragon’s Breath | save (DEX 14) | 3 | 1 | B01 |
| Chimera: Fire Breath | save (DEX 15) | 4 | 1 | B01 |
| Giant Ape: Boulder Toss | save (DEX 17) | 4 | 1 | B01 |
| Chain Devil: Conjure Infernal Chain | save (DEX 15) | 4 | 1 | B01 |
| Horned Devil: Infernal Tail | save (DEX 17) | 4 | 1 | B01 |
| Storm Giant: Lightning Storm | save (DEX 18) | 4 | 1 | B01 |
| Planetar: Holy Burst | save (DEX 20) | 4 | 1 | B01 |
| Solar: Slaying Bow | save (DEX 21) | 3 | 1 | B01 |
| Kraken: Fling | save (DEX 25) | 4 | 1 | B01 |
| Kraken: Lightning Strike | save (DEX 23) | 4 | 1 | B01 |
| Kraken: Swallow | save (DEX 25) | 4 | 1 | B01 |
| Gelatinous Cube: Engulf | save (DEX 12) | 4 | 1 | B01 |
| Glabrezu: Pummel | save (DEX 17) | 4 | 1 | B01 |
| Behir: Lightning Breath | save (DEX 16) | 4 | 1 | B01 |

## Yöntem

- **Sahne:** düz 31×45 altıgen zemin (kale-onu haritası, "Düz zemin" ortamı: ortam kuralı yok; zemin, nesne ve alanlar temiz), güncel kural sürümü, varsayılan Game Master anahtarları ve ev kuralları. Ev kuralı `carpmaHasari` (varsayılan açık, SRD'de yok) itmeli alan bağlamlarına karışmasın diye ikinci düşman itme ekseninin dışında.
- **Büyücü:** 20. seviye, büyü DC 18, büyü saldırısı +10, büyü değiştiricisi +4, her seviyeden 4 slot, sınıf özelliği yok. **Hedef:** AC 15, 300 HP, save değiştiricileri 0, türü SRD metnine göre (Beast, Humanoid…). **Canavar saldırısının hedefi:** AC 15, 999 HP, save +5.
- **Zar (kancalı Rng):** motorun zar istekleri amaçla yanıtlanır. Büyü saldırısı d20 tek zarda 8, çift zarda 2/16 (silah ve canavarda 19 ve 5/19); kip, motorun tuttuğu doğal zardan doğrulanır. Kritik 20, ıska 1. Save d20: başarısız 1, başarılı 20; dezavantaj sondası 19/3; yarım siper sondası 16 (yalnız +2 ile geçer), ¾ siper sondası 14 (yalnız +5 ile geçer). Hasar zarları yüze bağlı sabit (⌊yüz/2⌋ + 1: d4 3, d6 4, d8 5, d10 6, d12 7): toplam yalnız zar sayısına bağlı; zar ifadesi kanonik biçimde (yüz başına toplam zar + sabit) karşılaştırılır. Tepki ve seçim istemleri kancayla (Shield, Counterspell, Hellish Rebuke kullanılır; diğer tepkiler kullanılmaz).
- **Kahin (beklenen):** SRD 5.2.1 kaydından (data/srd/spells.json, data/srd/weapons.json) otomatik ayrıştırma — saldırı/save türü, hasar zarı ve türü, yarı hasar, durumlar, süre, konsantrasyon, yukarı slot, kantrip kademesi, alan, hedef türü, "görebildiğin yaratık", "creatures of your choice", "Advantage if you or your allies are fighting it" — ve SRD metninden elle okunan özel tablo (`src/sim/matris/ozel.ts`: yapım anı ya da tetik davranışı, seçimli büyüler, Ice Knife patlaması, Acid Arrow ıskası…). Motor kodu kahinde kullanılmaz; motorun büyü verisi yalnız komutun biçimini (alan nişanı, seçim) belirlemek için okunur.
- **D&D kuralları (kahinde):** direnç ⌊/2⌋, zayıflık ×2, bağışıklık 0; başarılı save'de yarı hasar (kantripte 0), ardından direnç; kritikte zarlar iki kat, sabitler bir kez; avantaj ve dezavantaj birbirini götürür; siper +2/+5 AC ve DEX save'e; Prone hedefe 5 ft içinden avantaj, uzaktan dezavantaj; Restrained hedefe avantaj ve DEX save'inde dezavantaj; Invisible hedefe dezavantaj, "görmen gereken" etki yapılamaz; Frightened saldırana dezavantaj; Charmed büyüleyene saldıramaz; menzilli saldırıda yanında düşman ve uzun menzil dezavantaj; Heavy silahta STR/DEX < 13 dezavantaj; konsantrasyon DC'si max(10, ⌊hasar/2⌋), en çok 30; yeni konsantrasyon eskisini bitirir; Counterspell başarısızlığında büyü boşa gider ve slot harcanmaz; Shield +5 AC (tetikleyen saldırıya da) ve Magic Missile'i keser; Blindsight/Truesight menzilindeki görünmez hedefe dezavantaj yok; gün ışığında Sunlight Sensitivity/Weakness/Hypersensitivity ve Light Sensitivity dezavantajı.
- **Yüzey/zemin:** beklenen, oyunun kendi tablosu (data/yuzey-etkilesimleri.json element satırları: ateş→yağ `fireOil`, soğuk→su `coldWater`, yıldırım→su `lightningWater`, kuvvet/gök gürültüsü→su `forceWater`).
- **Canavar saldırıları:** beklenen data/monsters.json'dan (saldırı bonusu, zar, tür; SRD metnindeki sabit hasar, "Advantage ile" alternatif zar) ve yukarıdaki kurallardan. Ek etkiler (rider) bu matriste ölçülmez.
- **Sonuç sınıfları:** *doğru* = karşılaştırılan bütün alanlar eşit; *yanlış* = motor sonuç üretiyor ama değer SRD'den farklı ya da SRD'nin yasakladığını kabul ediyor; *çökme* = komut istisna fırlatıyor; *uygulanmıyor* = SRD etkisi motorda yok (savaş dışı işaretli ya da beklenen durum/etki hiç üretilmiyor); *karar bekliyor* = SRD metni iki türlü okunabiliyor (bulgu kaydında gerekçe).

## Kapsam ve sınırlar

- 339 büyünün hepsi matriste; savaş dışı işaretli (ya da SRD'de 1 dakika ve üstü yapım süreli) büyüler tek satır: SRD etkisi savaşta anlamlıysa *uygulanmıyor*, değilse *doğru*.
- Silah: SRD Weapons tablosunun 38 silahı + fırlatma biçimleri + Unarmed Strike, 5. seviye Fighter (STR 16, DEX 14), ustalık seçilmemiş (Graze, Topple… karışmasın diye).
- Ölçülmeyenler: canavar saldırı ek etkileri (A2 envanteri ayrı), Multiattack, sınıf özellikleri (Sneak Attack, Rage…), sihirli eşyalar, çok altıgen gövde, irtifa/dikey, büyülerin sonraki turlardaki tekrarı (`spell_followup`), süren etkilerin sonraki zarlardaki sayısal katkısı (Bless +1d4 gibi: yalnız etkinin varlığı, süresi, konsantrasyon bağı ölçüldü), alan geometrisinin kenar altıgenleri (yalnız açıkça içeride/dışarıda konumlar).
- Telekinesis'in STR save'i yapılandırılmış olay (`save_resolved`) yerine günlük notuyla kaydediliyor; yalnız durum sonucu karşılaştırıldı.
- "Doğru" bir senaryonun doğru olduğunu söyler; bütün zar kombinasyonlarını değil.
- Yeniden üretmek için: `npx vite-node src/sim/mekanikMatris.ts -- --yaz`; tek büyü/saldırı ayrıntısı: `npx vite-node src/sim/mekanikMatris.ts -- --buyu "Fireball" --hepsi`.
