# Aşama 2 denetimi (Kuyruk 17)

Bu belge Kuyruk 17'nin G1 (4–5. seviye büyüler) ve G2 (6–10. seviye sınıf özellikleri) özetidir. Ayrıntılı tablolar:

- 4–5. seviye büyüler: `docs/BUYU-DENETIMI-4-5.md` (Kuyruk 40/41b + K17 G1).
- 6–10. seviye sınıf ve SRD alt sınıf özellikleri: `docs/A2-OZELLIK-DENETIMI.md` (`npx vite-node scripts/a2-ozellik-denetimi.ts` üretir; K17 G2 sonrası yeniden üretildi).

Seviye tavanı zaten 10 (Kuyruk 38: Ayarlar'da "Üst seviye (6–10)"; kayıt ve ilerleme ekranı uyumlu). Kural sürümü 13 (K17 G2 davranışları eski savaşta çalışmaz).

## G1 — 4–5. seviye büyüler

| Grup | Sayı | Durum |
|---|---:|---|
| Oyunda (tam/kısmi, Kuyruk 40/41b) | 33 | yapıldı (önceden) |
| Savaş dışı (`offCombat`, kart etiketi + Game Master notu) | 27 | yapıldı (önceden) |
| K17 G1 ile eklendi | 4 | Banishment, Resilient Sphere, Wall of Force, Wall of Stone |
| "Yakında" (yeni sistem) | 8 | yapılmadı: Dominate Beast, Dominate Person, Polymorph, Telekinesis, Antilife Shell, Arcane Hand, Conjure Elemental, Tree Stride |

Yapay zekâ: hasar/kontrol/iyileştirme büyülerini var olan genel yollardan kullanır; K17'de Banishment için kural eklendi (en az iki düşmanda en güçlüsüne). Resilient Sphere ve duvarları kullanmaz.

## G2 — 6–10. seviye sınıf özellikleri

| Sınıf | Özellik | Seviye | K17 öncesi | K17 sonrası |
|---|---|---:|---|---|
| Monk | Empowered Strikes | 6 | yok | yapıldı (Unarmed Strike Force seçebilir) |
| Monk | Heightened Focus | 10 | yok | kısmi (Flurry 3 vuruş; Patient Defense geçici HP ve Step of the Wind eşliği yok) |
| Monk | Self-Restoration | 10 | yok | kısmi (tur sonunda Charmed/Frightened/Poisoned biter) |
| Paladin | Aura of Courage | 10 | yok | yapıldı (10 ft Frightened bağışıklığı) |
| Paladin (Devotion) | Aura of Devotion | 7 | planlı | kısmi (10 ft yeni Charmed engellenir) |
| Barbarian (Berserker) | Mindless Rage | 6 | planlı | kısmi (Rage'de Charmed/Frightened olmaz; girişte bitirme yok) |
| Paladin | Aura of Protection | 6 | kısmi | yapılmadı: dostlara aura (save'ler tek noktadan geçmiyor) |
| Barbarian | Instinctive Pounce, Brutal Strike | 7, 9 | yok | yapılmadı (Rage hareketi; yeni saldırı seçeneği) |
| Bard | Countercharm; Lore Magical Discoveries | 7, 6 | yok | yapılmadı (save sonrası tepki tetiği; oluşturucu liste genişlemesi) |
| Fighter | Tactical Master; Champion Heroic Warrior | 9, 10 | yok | yapılmadı (ustalık seçimi arayüzü; Heroic Inspiration) |
| Paladin | Abjure Foes | 9 | yok | yapılmadı (Channel Divinity korkusu) |
| Rogue (Thief) | Supreme Sneak | 9 | yok | yapılmadı |
| Monk (Open Hand) | Wholeness of Body | 6 | planlı | yapılmadı |
| Warlock | Contact Patron | 9 | yok | savaş dışı |

Duman testi: 12 sınıf × 6/8/10. seviye (`src/sim/k17g2smoke.test.ts`), oluşturucu sheet'i ile iki Ogre'ye karşı 6 tur; çökme yok. Denge: üst seviye partisi a2-klasik 9. seviye Normal, 4 senaryo × 30 tohum (`harita/belgeler/DENGE.md`); sınıf başına 100 tohumluk ölçüm yapılmadı (süre).

## Kuyruk 19 — seviye 11–20 (görev 4–5)

Seviye tavanı 20 (görev 2). 11–20. seviye sınıf ve SRD alt sınıf özellikleri tablosu: `docs/A3-OZELLIK-DENETIMI.md` (aynı betik üretir: `npx vite-node scripts/a2-ozellik-denetimi.ts`). Bütün yeni davranışlar `featuresK19` Game Master anahtarına ve kural sürümü 16'ya bağlı.

| Grup | Özellikler | Durum |
|---|---|---|
| Barbarian | Relentless Rage, Improved Brutal Strike, Persistent Rage, Indomitable Might, Primal Champion; Berserker Intimidating Presence | yapıldı |
| Monk | Acrobatic Movement, Deflect Energy, Disciplined Survivor, Perfect Focus, Superior Defense, Body and Mind; Open Hand Fleet Step, Quivering Palm | yapıldı |
| Paladin | Radiant Strikes, Restoring Touch, Aura Expansion; Devotion Smite of Protection, Holy Nimbus | yapıldı |
| Fighter, Rogue, Ranger | (Görev F ve Kuyruk 18'de) + Thief's Reflexes, Superior Hunter's Defense (alan hasarı dahil) | yapıldı |
| Cleric | Improved Blessed Strikes (Potent Spellcasting geçici HP) | yapıldı |
| Druid | Improved Elemental Fury (+300 ft), Archdruid Nature Magician; Land Nature's Sanctuary | yapıldı |
| Sorcerer | Arcane Apotheosis; Draconic Dragon Wings, Dragon Companion | yapıldı |
| Warlock | Eldritch Master; Fiend Hurl Through Hell | yapıldı |
| Wizard | Spell Mastery / Signature Spells seçimi; Evoker Overchannel | yapıldı |
| Bard | Lore Peerless Skill | yapıldı |
| Epic Boon feat'leri | Combat Prowess, Dimensional Travel, Fate, Irresistible Offense, Spell Recall, Night Spirit, Truesight | yapıldı |
| 6–9. seviye büyüye bağlı | Mystic Arcanum, Greater Divine Intervention (Wish), Words of Creation (Power Word Heal/Kill) | görev 3+6'da (büyüler eklenince) |
| Eşya/sistem | Use Magic Device (Thief 13) | görev 7'de (sihirli eşya ve parşömen) |
