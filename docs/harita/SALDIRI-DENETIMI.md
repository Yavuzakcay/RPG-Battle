# Saldırı ve büyü sayısı denetimi (Görev K7)

SRD 5.2.1'e göre beklenen değerlerle oyundaki değerin karşılaştırması. Oyundaki değerler motordan ölçüldü
(`combatantFromSheet`, büyü komutları; testler `src/battle/k7.test.ts`, `src/screens/k6.test.tsx`).
Durum: ✅ uyumlu · 🔧 bu görevde düzeltildi · ⚠️ kısmi / karar bekliyor · — SRD'de yok.

## Attack eylemi başına saldırı (1–5. seviye)

| Sınıf | 1 | 2 | 3 | 4 | 5 | SRD 5.2.1 | Oyun | Durum |
|---|---|---|---|---|---|---|---|---|
| Barbarian | 1 | 1 | 1 | 1 | 2 | Extra Attack 5 | aynı | ✅ |
| Bard | 1 | 1 | 1 | 1 | 1 | College of Lore ek saldırı vermez (Valor/Swords SRD'de yok) | aynı | ✅ |
| Cleric | 1 | 1 | 1 | 1 | 1 | — | aynı | ✅ |
| Druid | 1 | 1 | 1 | 1 | 1 | — | aynı | ✅ |
| Fighter | 1 | 1 | 1 | 1 | 2 | Extra Attack 5 (11'de 3, 20'de 4) | aynı (11: 3, 20: 4) | ✅ |
| Monk | 1 | 1 | 1 | 1 | 2 | Extra Attack 5 | aynı | ✅ |
| Paladin | 1 | 1 | 1 | 1 | 2 | Extra Attack 5 | aynı | ✅ |
| Ranger | 1 | 1 | 1 | 1 | 2 | Extra Attack 5 | aynı | ✅ |
| Rogue | 1 | 1 | 1 | 1 | 1 | — | aynı | ✅ |
| Sorcerer | 1 | 1 | 1 | 1 | 1 | — | aynı | ✅ |
| Warlock | 1 | 1 | 1 | 1 | 1 | Thirsting Blade (Pact of the Blade, 5) | yok (Eldritch Invocations yok) | ⚠️ |
| Wizard | 1 | 1 | 1 | 1 | 1 | — | aynı | ✅ |

## Bonus eylem ve tepki saldırıları

| Konu | SRD 5.2.1 | Oyun | Durum |
|---|---|---|---|
| Light silahla ek saldırı | Attack eyleminde Light silahla saldırınca bonus eylemle diğer Light silah; yetenek değiştiricisi yok (Two-Weapon Fighting ekler) | `offhand_attack`, `economy.lightAttack` | ✅ |
| Nick ustalığı | Ek saldırı Attack eyleminin içinde, turda bir | `nickOffhand` | ✅ |
| Martial Arts | Bonus eylemle Unarmed Strike (1. seviye) | `bonus_strike` | ✅ |
| Flurry of Blows | 1 Focus, iki Unarmed Strike (2. seviye; 10. seviyede üç) | iki vuruş; 10. seviye üç vuruş yok | ⚠️ (6+ seviye) |
| Fırsat saldırısı | Tepkiyle bir yakın dövüş saldırısı | her yaratıkta, `reactions.ts` | ✅ |
| Cleave | Turda bir, ikinci hedefe değiştiricisiz | `cleaveTurn` | ✅ |
| Graze, Sap, Slow, Topple, Vex | Ustalık kuralları | `mastery.ts` | ✅ |
| Push | İsabette 10 ft itme | yakın dövüşte yalnızca eylemin son saldırısında | ⚠️ (bilinen) |
| Polearm Master | SRD 5.2.1 feat listesinde yok | — | — |

## Büyü sayıları ve tur sınırları

| Konu | SRD 5.2.1 | Oyun | Durum |
|---|---|---|---|
| Cantrip hasar ölçeği | 5, 11, 17. seviyede zar artar | `tierOf` (1/5/11/17) | ✅ |
| Eldritch Blast ışınları | 1 / 2 (5) / 3 (11) / 4 (17) | `raysByLevel` | ✅ |
| Magic Missile | 3 dart, yukarı slot başına +1 | yukarı slot dartı **eklenmiyordu** | 🔧 |
| Scorching Ray | 3 ışın, yukarı slot başına +1 | yukarı slot ışını **eklenmiyordu** | 🔧 |
| Spirit Guardians | Bir yaratık turda bir kez etkilenir | `auraHits` (tur başına) | ✅ |
| Sneak Attack | Turda bir (başkasının turunda yeniden) | `sneakTurn` | ✅ |
| Divine Smite | Bonus eylem büyüsü (turda bir bonus eylem, bir yuva) | bonus eylem + yuva kuralı | ✅ |
| Turda tek yuvalı büyü | Bir turda yalnızca bir yuva harcanır | `economy.slotTurn` (Görev K6 testi) | ✅ |
| Haste ek eylemi | Tek silah saldırısı, Dash, Disengage, Hide, Utilize | `haste_action`: tek saldırı, Extra Attack yok (Utilize yok) | ✅ |
| Slow | Eylem ya da bonus eylem, Attack eyleminde tek saldırı | `slowed` | ✅ |
| Konsantrasyon | Aynı anda tek | yenisi eskisini bitirir | ✅ |

## Özet

- 12 sınıfın 1–5. seviye saldırı sayıları, Fighter 11/20, bonus eylem saldırıları, fırsat saldırısı ve ustalıklar SRD ile uyumlu.
- Düzeltilen: Magic Missile ve Scorching Ray'in yukarı slot dartı/ışını (`upcast.rays`, `applied`).
- Karar bekleyen: Warlock Eldritch Invocations (Thirsting Blade, Agonizing Blast…) sistemi yok.
- Bilinen kısmi: Flurry of Blows'un 10. seviyedeki üçüncü vuruşu, Push'un yakın dövüşte yalnızca son saldırıda olması.
