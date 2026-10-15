# Kararlar

Projede alınan içerik ve kural kararlarının kaydı. En yeni karar en üstte.

## 2026-10-15 — Altıgen ızgara geometrisi

**Bağlam:** Savaş, karşılıklı kartlardan altıgen ızgaralı yatay haritaya geçiyor
(`docs/harita/GOREV.md`).

**Karar:** Izgara 15 sütun × 7 satır, düz üstlü (flat-top) altıgen, odd-q offset düzeni
(0 tabanlı tek sütunlar yarım altıgen aşağı kayık), 1 altıgen = 5 ft (hız 30 ft = 6
altıgen). Kodda koordinatlar 0 tabanlı, kullanıcıya 1 tabanlı gösterilir. Hesaplar
eksenel (axial) koordinatta: `q = col`, `r = row - (col - (col & 1)) / 2`; mesafe
`(|dq| + |dq + dr| + |dr|) / 2`. Geometri `src/rules/hex.ts` içinde saf bir modül: harita
biçimini bilmez, zemin maliyeti yol bulucuya fonksiyon olarak verilir (normal 1, zorlu 2,
engel null). Eşit maliyetli yollar arasında seçim sabit (komşu ve keşif sırası), böylece
olaylar baştan oynatılınca aynı yol çıkar.

## 2026-10-15 — SRD 5.2.1 atıf metni eklendi

**Bağlam:** CC-BY-4.0'ın tek şartı atıf. SRD 5.2.1'in ilk sayfası atıf metnini verir ve
Wizards'a başka bir atıf yapılmamasını ister; "5E compatible" ifadesine izin verir.

**Karar:** İlk sayfadaki atıf metni olduğu gibi `NOTICE`, `README.md` ve uygulamanın
"Hakkında / Atıflar" metni `public/atiflar.txt` içine kondu (ekran sonra gelecek; dosya
build ile birlikte yayınlanır). "5E uyumlu (5E compatible)" ifadesi kullanılır.
Onay veya ortaklık izlenimi veren hiçbir ifade kullanılmaz; kod yorumlarındaki "PHB"
ve "D&D" anmaları "SRD 5.2.1" / "5E" olarak değiştirildi. `src/legal.test.ts` metnin
üç dosyada da birebir durduğunu denetler.

## 2026-10-15 — Tüm canavarlar SRD 5.2.1 istatistiklerine güncellendi

**Karar:** 16 canavarın AC, HP, hız, yetenek skorları, saldırıları, Multiattack düzeni,
yenilenme, bağışıklıklar ve save bonusları SRD 5.2.1 stat bloklarına göre güncellendi.
Öne çıkanlar: Troll 94 HP, tur başı 15 yenilenme, üç Rend; Young Red Dragon üç Rend +
Fire Breath; Owlbear iki Rend; Ghoul iki Bite; Bandit Captain iki saldırı ve Pistol;
Hobgoblin Warrior Pack Tactics; Giant Spider Web artık DEX save (DC 13); Wolf AC 12,
Bite 1d6+2 ve koşulsuz Prone. Canavarlara stat bloğundaki SAVE sütunu için `saves`
alanı eklendi (ör. ejderhanın DEX ve WIS save'i +4).

**Motor sınırı:** Motor bir saldırıda tek hasar türü uygular. "plus 2d6 Poison" gibi
ikinci hasarlar, koşullar (Prone, Poisoned, Restrained) ve durum bağışıklıkları şimdilik
`rider`/`traits` metninde durur ve elle uygulanır. Demo dengesi de değişti (Troll daha
güçlü); yeniden ölçülmedi.

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
