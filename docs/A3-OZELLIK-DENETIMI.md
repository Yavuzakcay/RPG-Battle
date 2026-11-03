# Özellik denetimi: seviye 11–20 (Kuyruk 19)

Üretim: `npx vite-node scripts/a2-ozellik-denetimi.ts`. Kaynak: SRD 5.2.1 sınıf tabloları (`data/srd/progression.json`), mekanik `data/class-features.json` ve `data/subclasses.json` (SRD alt sınıfları). Durum: **çalışır**, **çalışır (kısmi)**, **planlı sistem** (mekanik kaydı yok), **hikâye** (savaşta etkisiz), **çalışmıyor** (yeni sistem gerekir).

Özet: çalışır 52, çalışmıyor 4. Sınıf başına çalışan (kısmi dahil): barbarian 6, bard 2, cleric 2, druid 4, fighter 5, monk 7, paladin 5, ranger 7, rogue 6, sorcerer 3, warlock 2, wizard 3.

| Sınıf | Alt sınıf | Seviye | Özellik | Durum | Not |
|---|---|---:|---|---|---|
| barbarian | — | 11 | Relentless Rage | çalışır | Kuyruk 19: öfkedeyken 0 HP'ye düşünce CON save (DC 10, her kullanımda +5; kısa/uzun dinlenmede 10), başarıda HP 2 × Barbarian seviyesi (kaynak relentlessRage) |
| barbarian | — | 13 | Improved Brutal Strike | çalışır | Kuyruk 19: 13. seviye Staggering Blow (sonraki save dezavantajlı; sonraki turuna dek fırsat saldırısı yok) ve Sundering Blow (başka yaratığın sonraki saldırısı  |
| barbarian | path-of-the-berserker | 14 | Intimidating Presence | çalışır | Kuyruk 19 (featuresK19): bonus eylem, 30 ft içindeki görülen düşmanlar WIS save (DC 8 + STR + PB) ya da 1 dakika Frightened (tur sonunda tekrar save). Uzun dinl |
| barbarian | — | 15 | Persistent Rage | çalışır | Kuyruk 19: inisiyatifte Rage kullanımları dolar (uzun dinlenmede bir, kaynak persistentRage); Rage uzatılmadan 10 dakika sürer (Unconscious ya da ağır zırhla bi |
| barbarian | — | 18 | Indomitable Might | çalışır | Kuyruk 19: STR save ya da STR (Athletics) kontrolü toplamı STR skorundan küçükse skor sayılır |
| barbarian | — | 20 | Primal Champion | çalışır | Kuyruk 19: STR ve CON +4 (en çok 25) |
| bard | college-of-lore | 14 | Peerless Skill | çalışır | Kuyruk 19 (featuresK19): başarısız kontrol ya da saldırıya Bardic Inspiration zarı eklenir; yine başarısızsa harcanmaz. |
| bard | — | 18 | Superior Inspiration | çalışır | İnisiyatifte (savaş başında) Bardic Inspiration en az 2'ye tamamlanır |
| bard | — | 20 | Words of Creation | çalışmıyor | Aşama 2: Power Word Heal ve Power Word Kill (9. seviye büyüler) oyunda yok |
| cleric | — | 14 | Improved Blessed Strikes | çalışır | Divine Strike 2d8. Kuyruk 19 (featuresK19): Potent Spellcasting seçildiyse hasar veren cantrip'ten sonra kendine ya da 60 ft içindeki bir dosta 2 × WIS geçici H |
| cleric | life-domain | 17 | Supreme Healing | çalışır | Büyü ve Channel Divinity iyileştirme zarları en yüksek değer |
| cleric | — | 20 | Greater Divine Intervention | çalışmıyor | Aşama 2: Wish (9. seviye büyü oyunda yok) |
| druid | circle-of-the-land | 14 | Nature’s Sanctuary | çalışır | Kuyruk 19 (featuresK19): eylem + Wild Shape kullanımı: 120 ft içinde 15 ft küp (7 altıgen), 1 dakika: içindeki dostlar yarım siperli ve Nature's Ward direncine  |
| druid | — | 15 | Improved Elemental Fury | çalışır | Primal Strike 2d8. Kuyruk 19 (featuresK19): Potent Spellcasting seçildiyse 10 ft ve üstü menzilli cantrip'lere +300 ft. |
| druid | — | 18 | Beast Spells | çalışır | Wild Shape biçiminde büyü yapılabilir |
| druid | — | 20 | Archdruid | çalışır | Evergreen Wild Shape (inisiyatifte kullanım yoksa bir). Kuyruk 19 (featuresK19): Nature Magician: Wild Shape kullanımları tek slota (kullanım başına 2 seviye),  |
| fighter | — | 11 | Two Extra Attacks | çalışır |  |
| fighter | — | 13 | Studied Attacks | çalışır | Iskalanan hedefe bir sonraki saldırı, sonraki turun sonuna dek avantajlı |
| fighter | champion | 15 | Superior Critical | çalışır | Silah ve Unarmed Strike saldırıları 18–20'de kritik |
| fighter | champion | 18 | Survivor | çalışır | Defy Death: ölüm save'leri avantajlı, 18–20 doğal 20 sayılır. Heroic Rally: tur başında Bloodied ve en az 1 HP ise 5 + CON HP |
| fighter | — | 20 | Three Extra Attacks | çalışır |  |
| monk | warrior-of-the-open-hand | 11 | Fleet Step | çalışır | Kuyruk 19 (featuresK19): Step of the Wind dışında bir bonus eylemden sonra Step of the Wind bonus eylemsiz (turda bir; Focus yine harcanır). |
| monk | — | 13 | Deflect Energy | çalışır | Kuyruk 19: Deflect Attacks her hasar türüne |
| monk | — | 14 | Disciplined Survivor | çalışır | Kuyruk 19: bütün save'lerde yetkinlik; başarısız save 1 Focus ile yeniden atılır |
| monk | — | 15 | Perfect Focus | çalışır | Kuyruk 19: inisiyatifte Uncanny Metabolism kullanılmadıysa Focus 3 ya da azsa 4'e çıkar |
| monk | warrior-of-the-open-hand | 17 | Quivering Palm | çalışır | Kuyruk 19 (featuresK19): bu tur Unarmed Strike ile vurulan hedefe 4 Focus ile titreşim (eylemsiz); sonra eylemle bitir: CON save, başarısızsa 10d12 Force, başar |
| monk | — | 18 | Superior Defense | çalışır | Kuyruk 19: tur başında 3 Focus ile 1 dakika (ya da Incapacitated olana dek) Force dışındaki bütün hasara direnç (`superior_defense`) |
| monk | — | 20 | Body and Mind | çalışır | Kuyruk 19: DEX ve WIS +4 (en çok 25) |
| paladin | — | 11 | Radiant Strikes | çalışır | Kuyruk 19: yakın dövüş silahı ya da Unarmed Strike isabetinde +1d8 Radiant |
| paladin | — | 14 | Restoring Touch | çalışır | Kuyruk 19: Lay On Hands Blinded, Charmed, Deafened, Frightened, Paralyzed, Stunned'ı da kaldırır (her biri 5 puan; havuz yettikçe) |
| paladin | oath-of-devotion | 15 | Smite of Protection | çalışır | Kuyruk 19 (featuresK19): Divine Smite'tan sonra Paladin ve Aura of Protection içindeki dostlar sonraki turunun başına dek yarım siperli. |
| paladin | — | 18 | Aura Expansion | çalışır | Aura of Protection (ve Devotion/Courage auraları) 30 ft (18. seviye; auras.ts, mind.ts) |
| paladin | oath-of-devotion | 20 | Holy Nimbus | çalışır | Kuyruk 19 (featuresK19): bonus eylem, 10 dakika: Aura of Devotion içinde (30 ft) turuna başlayan düşmana CHA + PB Radiant; parlak ışık; Fiend/Undead etkilerine  |
| ranger | hunter | 11 | Superior Hunter’s Prey | çalışır | Turda bir kez Hunter's Mark hasarı verince aynı ek hasar 30 ft içindeki başka bir düşmana da (yapay zekâ ve oyuncu için kendiliğinden: en düşük HP'li) |
| ranger | — | 13 | Relentless Hunter | çalışır | Hasar Hunter's Mark konsantrasyonunu bozmaz |
| ranger | — | 14 | Nature’s Veil | çalışır | Bonus eylem: sonraki turunun sonuna dek Invisible; WIS kadar (en az 1) |
| ranger | hunter | 15 | Superior Hunter’s Defense | çalışır | Tepki: saldırı isabetinde o saldırının hasarı yarılanır; Kuyruk 19 (featuresK19): alan hasarında da (save'li) ve aynı türe geçerli turun sonuna dek direnç. |
| ranger | — | 17 | Precise Hunter | çalışır | Hunter's Mark'lı hedefe saldırılar avantajlı |
| ranger | — | 18 | Feral Senses | çalışır | Blindsight 30 ft: karanlık haritada 6 altıgen içindekileri görür; Kuyruk 19 (featuresK19): 30 ft içindeki görünmez yaratığın saldırı avantajı/dezavantajı yok sa |
| ranger | — | 20 | Foe Slayer | çalışır | Hunter's Mark zarı d10 |
| rogue | — | 11 | Improved Cunning Strike | çalışır | İki Cunning Strike etkisi birlikte |
| rogue | thief | 13 | Use Magic Device | çalışmıyor | Ayarlanma sınırı, şarjlı eşya ve büyü parşömeni yok |
| rogue | — | 14 | Devious Strikes | çalışır | Daze (CON; Dazed: turunda yalnızca biri — hareket, eylem ya da bonus eylem), Knock Out (CON; Unconscious, her tur sonu CON save; Kuyruk 19: hasar alınca da bite |
| rogue | — | 15 | Slippery Mind | çalışır |  |
| rogue | thief | 17 | Thief’s Reflexes | çalışır | Kuyruk 19 (featuresK19): savaşın ilk turunda ikinci tur, inisiyatif − 10'da (Surprised değilken; sıra kaldığı yerden sürer). |
| rogue | — | 18 | Elusive | çalışır | Incapacitated değilken ona yapılan saldırılar avantajlı olamaz |
| rogue | — | 20 | Stroke of Luck | çalışır | Başarısız D20 Testi (saldırı, save, kontrol) kendiliğinden 20 olur; kısa ya da uzun dinlenmede dolar |
| sorcerer | draconic-sorcery | 14 | Dragon Wings | çalışır | Kuyruk 19 (featuresK19): bonus eylem, 1 saat 60 ft uçuş. Uzun dinlenmede bir; kullanım yoksa 3 Sorcery Point. |
| sorcerer | draconic-sorcery | 18 | Dragon Companion | çalışır | Kuyruk 19 (featuresK19 dışında, kaynak dragonCompanion): Summon Dragon uzun dinlenmede bir slotsuz ve konsantrasyonsuz (1 dakika); Summon Dragon her zaman hazır |
| sorcerer | — | 20 | Arcane Apotheosis | çalışır | Kuyruk 19 (featuresK19): Innate Sorcery etkinken kendi turunda bir Metamagic seçeneği bedelsiz (turda bir; birden çok seçenekte en pahalısı). |
| warlock | — | 11 | Mystic Arcanum | çalışmıyor | Çalışmıyor: 11. seviye özelliği (seviye sınırı 10) ve 6.–9. seviye büyüler oyunda yok |
| warlock | fiend-patron | 14 | Hurl Through Hell | çalışır | Kuyruk 19 (featuresK19): turda bir saldırı isabetinde (uzun dinlenmede bir, kaynak hurlThroughHell) CHA save; başarısızsa Fiend değilse 8d10 Psychic ve büyücünü |
| warlock | — | 20 | Eldritch Master | çalışır | Kuyruk 19: Magical Cunning harcanmış bütün Pact slotlarını geri verir (yarısı yerine; savaş dışı ayin, karakter listesinde). |
| wizard | evoker | 14 | Overchannel | çalışır | Kuyruk 19 (featuresK19): 1–5. seviye slotla yapılan hasar veren Wizard büyüsünde hasar zarları en yüksek; uzun dinlenmeden önceki her ek kullanımda büyücü slot  |
| wizard | — | 18 | Spell Mastery | çalışır | Kuyruk 19: oluşturucuda bir 1. ve bir 2. seviye Wizard büyüsü seçilir (seçilmezse hazırlanan ilk); seçilen büyüler en düşük seviyede slotsuz (99 kullanım = iste |
| wizard | — | 20 | Signature Spells | çalışır | Kuyruk 19: oluşturucuda iki 3. seviye Wizard büyüsü seçilir (seçilmezse hazırlanan ilk ikisi); her zaman hazır, kısa dinlenmede dolan 2 slotsuz yapım (SRD: her  |
