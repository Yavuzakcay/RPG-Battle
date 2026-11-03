# Aşama 2 özellik denetimi: seviye 6–10 (Kuyruk 39)

Üretim: `npx vite-node scripts/a2-ozellik-denetimi.ts`. Kaynak: SRD 5.2.1 sınıf tabloları (`data/srd/progression.json`), mekanik `data/class-features.json` ve `data/subclasses.json` (SRD alt sınıfları). Durum: **çalışır**, **çalışır (kısmi)**, **planlı sistem** (mekanik kaydı yok), **hikâye** (savaşta etkisiz), **çalışmıyor** (yeni sistem gerekir).

Özet: çalışır 42. Sınıf başına çalışan (kısmi dahil): barbarian 5, bard 3, cleric 3, druid 3, fighter 4, monk 6, paladin 4, ranger 4, rogue 3, sorcerer 2, warlock 3, wizard 2.

| Sınıf | Alt sınıf | Seviye | Özellik | Durum | Not |
|---|---|---:|---|---|---|
| barbarian | path-of-the-berserker | 6 | Mindless Rage | çalışır | K17 G2 (kural sürümü 13): Rage sürerken Charmed ve Frightened olmaz; Kuyruk 18 H3 (kural sürümü 14, anahtar mindlessRageClear): Rage'e girince var olanlar biter |
| barbarian | — | 7 | Feral Instinct | çalışır | Kuyruk 39: inisiyatifte avantaj (Remarkable Athlete ile aynı kanca). |
| barbarian | — | 7 | Instinctive Pounce | çalışır | Kuyruk 18 H3 (kural sürümü 14, anahtar instinctivePounce): Rage'e girerken hızın yarısı kadar ek hareket; o turda istenen anda kullanılır (SRD'de bonus eylemin  |
| barbarian | — | 9 | Brutal Strike | çalışır | Kuyruk 18 H3 (kural sürümü 14, anahtar brutalStrike): Reckless turunda bir STR saldırısında avantajdan vazgeçilir; isabette silahın türünde +1d10 ve Forceful Bl |
| barbarian | path-of-the-berserker | 10 | Retaliation | çalışır | Tepki (Görev R1): 5 ft içindeki bir yaratıktan hasar alınca ona bir yakın dövüş saldırısı |
| bard | college-of-lore | 6 | Magical Discoveries | çalışır | Kuyruk 18 H3: Cleric, Druid ve Wizard listelerinden iki büyü (cantrip ya da slotu olan seviye); her zaman hazır, hazırlanan sayısına girmez (oluşturucu sınırı d |
| bard | — | 7 | Countercharm | çalışır | Kuyruk 18 H3 (kural sürümü 14, anahtar countercharm): Bard ya da 30 ft içindeki dostu Charmed/Frightened veren bir büyünün save'ini kaçırınca Bard'ın tepkisiyle |
| bard | — | 10 | Magical Secrets | çalışır | Kuyruk 39: 10. seviyeden hazırlanan büyüler Cleric, Druid ve Wizard listelerinden de seçilebilir (oluşturucuda liste genişler; sayı Bard tablosundan) |
| cleric | life-domain | 6 | Blessed Healer | çalışır | Slotla başkasını iyileştirince büyücüye 2 + slot seviyesi |
| cleric | — | 7 | Blessed Strikes | çalışır | Divine Strike: turda bir silah isabetine +1d8 Necrotic ya da Radiant. Potent Spellcasting: Cleric cantrip hasarına WIS (oyunda cantrip ölçekli bütün hasar cantr |
| cleric | — | 10 | Divine Intervention | çalışır | Kuyruk 41b + 43b: uzun dinlenmede bir kez, hazırlanan 1.–5. seviye Cleric büyüsü slotsuz; slot kalmışsa da slot seçicideki 'Slotsuz' düğmesiyle (cast_spell.free |
| druid | circle-of-the-land | 6 | Natural Recovery | çalışır | Kısa dinlenmede toplamı seviyenin yarısını (yukarı) aşmayan slotlar (uzun dinlenmede bir kez). Kuyruk 19: hazırlanan bir daire büyüsü (1.+ seviye) uzun dinlenme |
| druid | — | 7 | Elemental Fury | çalışır | Potent Spellcasting (Druid cantrip hasarına WIS) ya da Primal Strike (turda bir silah/Beast saldırısı isabetine 1d8 Cold/Fire/Lightning/Thunder, hedefe iyi işle |
| druid | circle-of-the-land | 10 | Nature’s Ward | çalışır | Arazinin türüne direnç (Arid Fire, Polar Cold, Temperate Lightning, Tropical Poison); Kuyruk 18 H3 (kural sürümü 14, anahtar naturesWard): Poisoned bağışıklığı. |
| fighter | champion | 7 | Additional Fighting Style | çalışır |  |
| fighter | — | 9 | Indomitable | çalışır | Başarısız save'de kendiliğinden yeniden atılır (+Fighter seviyesi); kullanım 9: 1, 13: 2, 17: 3, uzun dinlenmede dolar |
| fighter | — | 9 | Tactical Master | çalışır | Kuyruk 18 H3 (kural sürümü 14, anahtar tacticalMaster): ustalığını kullanabildiği silahla saldırırken ustalık o saldırı için Push, Sap ya da Slow ile değiştiril |
| fighter | champion | 10 | Heroic Warrior | çalışır | Kuyruk 18 H3 (kural sürümü 14, anahtar heroicWarrior): savaşta her tur başında Heroic Inspiration yoksa gelir; başarısız saldırı, save ya da kontrol d20'si bir  |
| monk | — | 6 | Empowered Strikes | çalışır | K17 G2: Unarmed Strike Bludgeoning ya da Force; hedefe göre etkili olan seçilir (`altDamageType`). |
| monk | warrior-of-the-open-hand | 6 | Wholeness of Body | çalışır | Kuyruk 18 H3 (kural sürümü 14, anahtar wholenessOfBody): bonus eylem, Martial Arts zarı + WIS (en az 1) kendini iyileştirme; WIS kadar (en az 1) kullanım, uzun  |
| monk | — | 7 | Evasion | çalışır | Kuyruk 39: Rogue Evasion ile aynı (DEX save'li hasarda yarı/sıfır). |
| monk | — | 9 | Acrobatic Movement | çalışır | Kuyruk 19 (featuresK19): zırhsız, kalkansızken dikey yüzeylerde (tırmanma ek maliyeti yok) ve sıvı üstünde (Water Walk gibi) hareket |
| monk | — | 10 | Heightened Focus | çalışır | K17 G2 (kural sürümü 13): Flurry of Blows 3 vuruş. Kuyruk 18 H3 (kural sürümü 14, anahtar heightenedDefense): Focus'lu Patient Defense iki Martial Arts zarı geç |
| monk | — | 10 | Self-Restoration | çalışır | K17 G2 (kural sürümü 13): tur sonunda Charmed, Frightened ve Poisoned biter (durum listesinden; büyü etkisinin verdiği durum etkiyle sürer). Yemeksiz/içeceksiz  |
| paladin | — | 6 | Aura of Protection | çalışır | Kuyruk 39 + Kuyruk 18 H3 (kural sürümü 14, anahtar auraOfProtection): Paladin ve 10 ft (18. seviyede 30 ft) içindeki dostlar bütün save'lerine CHA değiştiricisi |
| paladin | oath-of-devotion | 7 | Aura of Devotion | çalışır | K17 G2 (kural sürümü 13): Paladin ve 10 ft içindeki dostlar Charmed olmaz (yeni Charmed). Kuyruk 19 (featuresK19): auraya giren Charmed dostun durumu orada etki |
| paladin | — | 9 | Abjure Foes | çalışır | Kuyruk 18 H3 (kural sürümü 14, anahtar abjureFoes): Channel Divinity, Magic eylemi; 60 ft içinde görülen CHA değiştiricisi kadar (en az 1) düşman WIS save ya da |
| paladin | — | 10 | Aura of Courage | çalışır | K17 G2 (kural sürümü 13): Paladin ve 10 ft içindeki müttefikleri Frightened olmaz (Paladin Incapacitated değilken). |
| ranger | — | 6 | Roving | çalışır | Ağır zırh yokken +10 ft hız; Kuyruk 19 (featuresK19): tırmanma (tırmanma ek maliyeti ve yükseklik Atletizm'i yok) ve yüzme hızı (çok derin suya girebilir) |
| ranger | hunter | 7 | Defensive Tactics | çalışır | Escape the Horde: ona yapılan fırsat saldırıları dezavantajlı. Multiattack Defense: onu vuran yaratığın bu turdaki diğer saldırıları dezavantajlı |
| ranger | — | 9 | Expertise | çalışır |  |
| ranger | — | 10 | Tireless | çalışır | Eylemle 1d8 + WIS (en az 1) geçici HP, WIS kadar (en az 1) kullanım; Kuyruk 18 H3: kısa dinlenme Exhaustion'ı 1 azaltır. |
| rogue | — | 7 | Evasion | çalışır | Yarım hasarlı DEX save'inde başarıda hasar yok, başarısızlıkta yarım (Incapacitated değilken) |
| rogue | — | 7 | Reliable Talent | çalışır | Yetkin olunan beceri kontrolünde 9 ve altı 10 sayılır |
| rogue | thief | 9 | Supreme Sneak | çalışır | Kuyruk 18 H3 (kural sürümü 14, anahtar supremeSneak): Cunning Strike seçeneği Stealth Attack (1d6): gizliyken yapılan saldırı, hedefe göre ¾ ya da tam siperdeyk |
| sorcerer | draconic-sorcery | 6 | Elemental Affinity | çalışır | Seçilen türe direnç; o türde hasar veren büyünün bir hasar zarına CHA |
| sorcerer | — | 7 | Sorcery Incarnate | çalışır | Innate Sorcery kullanımı bitince 2 Sorcery Point ile; Innate Sorcery etkinken bir büyüye iki Metamagic |
| warlock | fiend-patron | 6 | Dark One’s Own Luck | çalışır | Başarısız yetenek kontrolü ya da save'e 1d10 (tutarsa kullanım harcanır); CHA kadar, uzun dinlenmede |
| warlock | — | 9 | Contact Patron | çalışır | Kuyruk 18 H3: Contact Other Plane her zaman hazır (savaş dışı büyü: kartta etiket, yapınca Game Master notu). Slotsuz bir kez ve save'in kendiliğinden başarısı  |
| warlock | fiend-patron | 10 | Fiendish Resilience | çalışır | Seçilen türe (Force dışı) direnç; dinlenmede değiştirilebilir (oluşturucuda) |
| wizard | evoker | 6 | Sculpt Spells | çalışır | Evocation alan büyüsünde 1 + büyü seviyesi kadar dost (büyücü dahil, alandakilerden ilk sıradakiler) etkilenmez; seçim otomatik |
| wizard | evoker | 10 | Empowered Evocation | çalışır | Evocation büyülerinin hasarına INT (büyü başına bir kez) |
