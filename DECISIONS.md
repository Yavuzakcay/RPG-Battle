# Kararlar

Projede alınan içerik ve kural kararlarının kaydı. En yeni karar en üstte.

## 2026-10-15 — Büyü, zırh ve canavar adları SRD 5.2.1'e çevrildi

**Bağlam:** Bazı içerik SRD 5.2.1'de farklı adla yer alıyor ya da hiç yer almıyor.
Henüz kayıt sistemi olmadığı için ad değişikliğinin en ucuz olduğu an şimdi; ileride
kayıtlı karakterler eski adları (ör. "Plate") içerseydi bozulurdu.

**Karar:**

- **Büyüler** (aynı büyü, yeniden adlandırıldı; seviye ve sınıf SRD'ye göre):
  - Branding Smite → Shining Smite (2. seviye, yalnızca Paladin)
  - Tasha's Hideous Laughter → Hideous Laughter (1. seviye, Bard, Warlock, Wizard)
- **Zırhlar:** Leather → Leather Armor, Studded leather → Studded Leather Armor,
  Hide → Hide Armor, Chain shirt → Chain Shirt, Half plate → Half Plate Armor,
  Chain mail → Chain Mail, Plate → Plate Armor. "Zırhsız" oyunun kendi seçeneği.
- **Canavarlar:** Goblin → Goblin Warrior, Hobgoblin → Hobgoblin Warrior,
  Minotaur → Minotaur of Baphomet (id'ler de değişti). Yalnız ad değişti, istatistikler
  henüz SRD 5.2.1 değerlerine güncellenmedi.
- **Orc canavarı kaldırıldı**, SRD'nin önerdiği **Tough** eklendi (SRD 5.2.1 istatistikleriyle:
  AC 12, HP 32, Mace, Heavy Crossbow, Pack Tactics). "Orc" adı artık yalnızca oyuncu türü.

## 2026-10-15 — Büyülerin sınıf listeleri SRD 5.2.1'e göre düzeltildi

**Bağlam:** Ortak büyülerin bazılarında sınıf listesi SRD 5.2.1'den farklıydı. Bu
lisanstan çok doğruluk meselesi: bir büyünün hangi sınıfın listesinde olduğu,
karakterlerin oyunda ne yapabileceğini değiştirir.

**Karar:** 12 büyünün sınıf listesi SRD 5.2.1'e eşitlendi:

| Büyü | Eklenen | Çıkarılan |
|---|---|---|
| Spare the Dying | Druid | |
| Command | Bard | |
| Entangle | Ranger | |
| Mirror Image | Bard | |
| Flaming Sphere | Sorcerer | |
| Slow | Bard | |
| Vampiric Touch | Sorcerer | |
| Mass Healing Word | Bard | |
| Revivify | Druid, Ranger | |
| Aid | Bard, Druid, Ranger | |
| Dispel Magic | Ranger | |
| Shatter | | Warlock |

Bu düzeltmeden sonra veride kalan her büyünün seviyesi ve sınıf listesi SRD 5.2.1
ile birebir aynı. İstisna: Branding Smite ve Tasha's Hideous Laughter; bunların
SRD'deki adları farklı (Shining Smite, Hideous Laughter) ve karar bekliyor.

## 2026-10-15 — SRD 5.2.1'de olmayan büyüler çıkarıldı

**Bağlam:** Oyun verisi ticari sürümde yalnızca SRD 5.2.1 (CC-BY-4.0) kapsamındaki
içeriğe dayanmalı. `data/spells.json`, `docs/SRD_CC_v5.2.1.pdf` ile büyü büyü
karşılaştırıldı.

**Karar:** SRD 5.2.1'de bulunmayan 9 büyü veriden çıkarıldı:

| Büyü | Seviye | Sınıf |
|---|---|---|
| Blade Ward | 0 | Bard, Sorcerer, Warlock, Wizard |
| Armor of Agathys | 1 | Warlock |
| Thunderous Smite | 1 | Paladin |
| Witch Bolt | 1 | Sorcerer, Warlock, Wizard |
| Wrathful Smite | 1 | Paladin |
| Blinding Smite | 3 | Paladin |
| Crusader's Mantle | 3 | Paladin |
| Elemental Weapon | 3 | Paladin |
| Lightning Arrow | 3 | Ranger |

**Gerekçe:** Çıkarmak en basit ve en güvenli yol. Bir büyüyü özgün hâle getirmek
yeniden adlandırmaktan fazlası: kendi adı, hikâyesi ve dengesi olmalı; bu ayrı bir iş.

**İleride:** Bu büyülerin yerine özgün büyüler yazılabilir. Demo karakterleri
(Mira, Bor) bu büyülerin hiçbirini kullanmıyordu. `src/data/data.test.ts` bu
büyülerin veriye geri girmesini engelleyen bir test içerir; özgün büyüler farklı
adlarla eklenmeli.
