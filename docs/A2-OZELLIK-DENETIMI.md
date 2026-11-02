# Aşama 2 özellik denetimi: seviye 6–10 (Kuyruk 39)

Üretim: `npx vite-node scripts/a2-ozellik-denetimi.ts`. Kaynak: SRD 5.2.1 sınıf tabloları (`data/srd/progression.json`), mekanik `data/class-features.json` ve `data/subclasses.json` (SRD alt sınıfları). Durum: **çalışır**, **çalışır (kısmi)**, **planlı sistem** (mekanik kaydı yok), **hikâye** (savaşta etkisiz), **çalışmıyor** (yeni sistem gerekir).

Özet: çalışır (kısmi) 10, çalışır 21, çalışmıyor 9, planlı sistem 1, hikâye 1. Sınıf başına çalışan (kısmi dahil): barbarian 3, bard 1, cleric 3, druid 3, fighter 2, monk 4, paladin 3, ranger 4, rogue 2, sorcerer 2, warlock 2, wizard 2.

| Sınıf | Alt sınıf | Seviye | Özellik | Durum | Not |
|---|---|---:|---|---|---|
| barbarian | path-of-the-berserker | 6 | Mindless Rage | çalışır (kısmi) | K17 G2 (kural sürümü 13): Rage sürerken Charmed ve Frightened olmaz; öfkelenince var olanın bitmesi yok. |
| barbarian | — | 7 | Feral Instinct | çalışır | Kuyruk 39: inisiyatifte avantaj (Remarkable Athlete ile aynı kanca). |
| barbarian | — | 7 | Instinctive Pounce | çalışmıyor | Kuyruk 39: Rage'e girerken yarım hız hareket yok (Rage komutu hareket vermiyor). |
| barbarian | — | 9 | Brutal Strike | çalışmıyor | Kuyruk 39: Reckless avantajından vazgeçip ek 1d10 ve etki seçimi yok (yeni saldırı seçeneği gerekir). |
| barbarian | path-of-the-berserker | 10 | Retaliation | çalışır | Tepki (Görev R1): 5 ft içindeki bir yaratıktan hasar alınca ona bir yakın dövüş saldırısı |
| bard | college-of-lore | 6 | Magical Discoveries | çalışmıyor | Aşama 2: Cleric/Druid/Wizard listelerinden iki her zaman hazır büyü (oluşturucuda liste genişlemesi yok) |
| bard | — | 7 | Countercharm | çalışmıyor | Aşama 2: Charmed/Frightened save'inin başarısızlığına bağlı tepki tetiği yok (save'ler tek noktadan geçmiyor) |
| bard | — | 10 | Magical Secrets | çalışır | Kuyruk 39: 10. seviyeden hazırlanan büyüler Cleric, Druid ve Wizard listelerinden de seçilebilir (oluşturucuda liste genişler; sayı Bard tab |
| cleric | life-domain | 6 | Blessed Healer | çalışır | Slotla başkasını iyileştirince büyücüye 2 + slot seviyesi |
| cleric | — | 7 | Blessed Strikes | çalışır | Divine Strike: turda bir silah isabetine +1d8 Necrotic ya da Radiant. Potent Spellcasting: Cleric cantrip hasarına WIS (oyunda cantrip ölçek |
| cleric | — | 10 | Divine Intervention | çalışır (kısmi) | Kuyruk 41b: uzun dinlenmede bir kez, hazırlanan 1.–5. seviye Cleric büyüsü slotsuz; yalnızca o seviyede ya da üstünde slot kalmadığında kull |
| druid | circle-of-the-land | 6 | Natural Recovery | çalışır (kısmi) | Kısa dinlenmede toplamı seviyenin yarısını (yukarı) aşmayan slotlar (uzun dinlenmede bir kez); daire büyüsünü slotsuz yapma Aşama 2 |
| druid | — | 7 | Elemental Fury | çalışır | Potent Spellcasting (Druid cantrip hasarına WIS) ya da Primal Strike (turda bir silah/Beast saldırısı isabetine 1d8 Cold/Fire/Lightning/Thun |
| druid | circle-of-the-land | 10 | Nature’s Ward | çalışır (kısmi) | Arazinin türüne direnç (Arid Fire, Polar Cold, Temperate Lightning, Tropical Poison); Poisoned bağışıklığı yok (durum bağışıklığı sistemi yo |
| fighter | champion | 7 | Additional Fighting Style | çalışır |  |
| fighter | — | 9 | Indomitable | çalışır | Başarısız save'de kendiliğinden yeniden atılır (+Fighter seviyesi); kullanım 9: 1, 13: 2, 17: 3, uzun dinlenmede dolar |
| fighter | — | 9 | Tactical Master | çalışmıyor | Ustalığı saldırı başına Push/Sap/Slow ile değiştirme seçimi yok (saldırı komutunda ustalık seçimi arayüzü yok) |
| fighter | champion | 10 | Heroic Warrior | çalışmıyor | Heroic Inspiration sistemi yok (yeniden atma hakkı modellenmedi) |
| monk | — | 6 | Empowered Strikes | çalışır | K17 G2: Unarmed Strike Bludgeoning ya da Force; hedefe göre etkili olan seçilir (`altDamageType`). |
| monk | warrior-of-the-open-hand | 6 | Wholeness of Body | planlı sistem |  |
| monk | — | 7 | Evasion | çalışır | Kuyruk 39: Rogue Evasion ile aynı (DEX save'li hasarda yarı/sıfır). |
| monk | — | 9 | Acrobatic Movement | hikâye | Kuyruk 39: dikey yüzey ve sıvı üstünde yürüme yok (hikâye). |
| monk | — | 10 | Heightened Focus | çalışır (kısmi) | K17 G2 (kural sürümü 13): Flurry of Blows 3 vuruş. Patient Defense geçici HP ve Step of the Wind eşliği yok. |
| monk | — | 10 | Self-Restoration | çalışır (kısmi) | K17 G2 (kural sürümü 13): tur sonunda Charmed, Frightened ve Poisoned biter (durum listesinden; büyü etkisinin verdiği durum etkiyle sürer). |
| paladin | — | 6 | Aura of Protection | çalışır (kısmi) | Kuyruk 39: Paladin'in kendi save'lerine CHA değiştiricisi (en az +1); 10 ft içindeki müttefiklere aura yok (konuma bağlı save eklentisi gere |
| paladin | oath-of-devotion | 7 | Aura of Devotion | çalışır (kısmi) | K17 G2 (kural sürümü 13): Paladin ve 10 ft içindeki dostlar Charmed olmaz (yeni Charmed); auraya giren Charmed dostun durumu kalkmaz. |
| paladin | — | 9 | Abjure Foes | çalışmıyor | Kuyruk 39: Channel Divinity ile Frightened yok. |
| paladin | — | 10 | Aura of Courage | çalışır | K17 G2 (kural sürümü 13): Paladin ve 10 ft içindeki müttefikleri Frightened olmaz (Paladin Incapacitated değilken). |
| ranger | — | 6 | Roving | çalışır (kısmi) | Ağır zırh yokken +10 ft hız; tırmanma ve yüzme hızı yok |
| ranger | hunter | 7 | Defensive Tactics | çalışır | Escape the Horde: ona yapılan fırsat saldırıları dezavantajlı. Multiattack Defense: onu vuran yaratığın bu turdaki diğer saldırıları dezavan |
| ranger | — | 9 | Expertise | çalışır |  |
| ranger | — | 10 | Tireless | çalışır (kısmi) | Eylemle 1d8 + WIS (en az 1) geçici HP, WIS kadar (en az 1) kullanım; Exhaustion yok |
| rogue | — | 7 | Evasion | çalışır | Yarım hasarlı DEX save'inde başarıda hasar yok, başarısızlıkta yarım (Incapacitated değilken) |
| rogue | — | 7 | Reliable Talent | çalışır | Yetkin olunan beceri kontrolünde 9 ve altı 10 sayılır |
| rogue | thief | 9 | Supreme Sneak | çalışmıyor | Gizlenmenin Invisible koşulu ve siper arkasında turu bitirme kuralı ayrı modellenmedi |
| sorcerer | draconic-sorcery | 6 | Elemental Affinity | çalışır | Seçilen türe direnç; o türde hasar veren büyünün bir hasar zarına CHA |
| sorcerer | — | 7 | Sorcery Incarnate | çalışır | Innate Sorcery kullanımı bitince 2 Sorcery Point ile; Innate Sorcery etkinken bir büyüye iki Metamagic |
| warlock | fiend-patron | 6 | Dark One’s Own Luck | çalışır | Başarısız yetenek kontrolü ya da save'e 1d10 (tutarsa kullanım harcanır); CHA kadar, uzun dinlenmede |
| warlock | — | 9 | Contact Patron | çalışmıyor | Savaş dışı: Contact Other Plane (5. seviye büyü, Aşama 2) |
| warlock | fiend-patron | 10 | Fiendish Resilience | çalışır | Seçilen türe (Force dışı) direnç; dinlenmede değiştirilebilir (oluşturucuda) |
| wizard | evoker | 6 | Sculpt Spells | çalışır | Evocation alan büyüsünde 1 + büyü seviyesi kadar dost (büyücü dahil, alandakilerden ilk sıradakiler) etkilenmez; seçim otomatik |
| wizard | evoker | 10 | Empowered Evocation | çalışır | Evocation büyülerinin hasarına INT (büyü başına bir kez) |
