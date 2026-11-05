# Envanter: canavarlar

> A0 envanter denetimi (2026-11-05, dal `wip/a0`, kural sürümü 27). Salt-okunur: oyun kodu, veri ve testler değişmedi. Yoklama betikleri repo dışında çalıştırıldı.

## Yöntem

- **Veri:** `data/monsters.json` (330 SRD canavarı), saldırı ekleri `data/attack-riders.json` (325 saldırı), yetenekler `data/canavar-yetenekleri.json` (61 yetenek, 35 pasif anahtar), tepkiler `data/monster-reactions.json` (27), Multiattack planları `data/multiattack.json` (96), efsanevi `data/efsanevi.json` (30), büyüler `data/canavar-buyuleri.json` (56 canavar).
- **"Veride var ama motorda yok" listesi:** her canavarın `unsupported` alanı (SRD aktarımında saldırıya dönüşmeyen metinler; 309 canavarda 1.111 kalem). Her kalem, karşılığının veride (yetenek/tepki/plan/efsanevi/büyü) ya da motorda (`monsterTraits.ts`, `monsterAbilities.ts` pasif anahtarları) olup olmadığına göre sınıflandı. Pasif anahtarların 35'inin hepsi kodda okunuyor.
- **Savaş yoklaması:** canavar yeteneklerinin hepsi (`monster_ability`) ve canavar büyülerinin hepsi (`cast_spell`, 153 büyü) gerçek bir savaşta, iki oyuncu hedefine karşı denendi.

## Özet

| Kalem | ÇALIŞIR | KISMİ | YOK | SAVAŞ DIŞI | Toplam |
|---|---|---|---|---|---|
| `unsupported` kalemleri (veride metin) | 781 | 177 | 1 | 152 | 1.111 |
| Saldırı ekleri (`attack-riders`) | 240 (223 uygulandı + 17 süreli etki) | 29 | 56 | 0 | 325 |
| Canavar tepkileri | 26 (Split ×2 tepki değil, canavar yeteneği yolunda `srdK19`) | 0 | 0 | 1 (Shriek) | 27 |
| Yetenekler (savaş yoklaması) | 38 | 23 (koşul gerektirir, arenada doğrulanmadı) | 0 | 0 | 61 |
| Canavar büyüleri (savaş yoklaması) | 132 (+9 kabul, olay yok: algılama vb.) | 12 (hedef koşulu: dost/ışınlanma/ritüel) | 0 | 0 | 153 |

- **KISMİ (177):** Boyut 156 (Large/Huge/Gargantuan tek altıgen; çok altıgen bayrağı `multiHex` varsayılan kapalı) ve sabit hasar 21 (`1d2 + (N − 1)` yaklaşığı).
- **YOK (1):** **ice-mephit Fog Cloud** (eylem, 1/Day; canavar büyü verisinde yok). İlk sayımda YOK görünen 15 kalem elle doğrulandı: Divine Aid ×6 ve Misty Step ×3 canavar büyü verisinin bonus girişinde (ÇALIŞIR), "1/Day" saldırılar ×4 (ÇALIŞIR, aşağıda), "Saldırı yok" ×2 (savaş dışı yaratık; basit vuruş eklendi, SAVAŞ DIŞI).
- **"1/Day (Recharge 6 olarak)"** (dretch Fetid Cloud, quasit Scare, vrock Stunning Screech, aboleth Dominate Mind…): savaşta bir kez; KISMİ değil ÇALIŞIR sayıldı (K19 kararı), şarj kuralı SRD'den farklı.
- **Koşullu yetenekler (23):** Swallow ×6 (önce Grappled hedef), Trample ×3, Rampage ×2 (öldürme sonrası), Reel ×2, Bubble Dash ×2 / Aquatic Charge (su), Tree Stride (ağaç), Swoop, Consume Life (0 HP hedef), Animate Trees, Create Specter (ölü), Shadow Stealth (loş ışık), Hellfire Spellcasting. Kodda koşul denetimi var; arenada koşul olmadığı için reddedildi. Tam doğrulama için koşullu senaryo gerekir.

## En sık eksik kalıplar (saldırı ekleri, `yok` + `kısmen` = 85)

| Kalıp | yok | kısmen | Çözüm yolu | İş |
|---|---|---|---|---|
| Durum etkisi süresi ayrıştırılamadı | 20 | 5 | `conditionTimers` (veri) | küçük |
| Özel metin etkisi | 14 | 0 | tek tek | orta |
| İkinci aşama (Second Failure: Sleep/Paralyzing Breath) | 10 | 0 | A3 `escalate` (veri; `condition-effects.json`) | küçük |
| İtme/çekme | 2 | 9 | **K53 `forcedMove`** (motor hazır, veri bağlanmamış) | küçük |
| Hız/eylem kısıtı (Slowing Breath) | 5 | 7 | süren etki `slowed` (Slow büyüsü yolu) | küçük |
| Lanet/kalıcı etki | 8 | 3 | süren etki + dinlenme | orta |
| 0 HP'de tetiklenen | 0 | 6 | `onDamage` pasifi | orta |
| HP eşiğiyle öldürme | 4 | 3 | İnfaz kalıbı (`imzaHit`) | küçük |
| Sürekli hasar (her tur) | 4 | 4 | süren etki `ongoing` / `dot` | küçük |
| Yapışma/ele geçirme | 4 | 0 | Grappled + `escape` | küçük |
| Yutma/içine alma | 2 | 0 | Swallow yeteneği yolu | orta |
| Özel hasar metni (Weakening Breath) | 6 | 1 | `damagePenalty` + `checkDis` | küçük |

## Yapay zekâ

- Canavar yetenekleri ve büyüleri yapay zekâda kullanılıyor (`monsterAbilities.ts` + YZ); efsanevi eylemler ve in olayı boss yolunda.
- Koşullu yeteneklerin (Swallow, Trample, Rampage) YZ seçimi bu denetimde ölçülmedi.

## Kaynak dosyalar

- Ayrıntılı `unsupported` sınıflaması: K19 denetimi `docs/SRD-DENETIM.md` ("Canavar yeteneği" satırları) ile aynı kurallar, bu denetimde yeniden sayıldı.
- Saldırı ekleri ayrıntısı: `data/attack-riders.json` (`unsupported` alanı; `node scripts/riders-uret.cjs` üretir).
