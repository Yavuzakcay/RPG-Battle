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

## A2'de bağlananlar (Kuyruk A2, kural sürümü 30)

Veri `data/canavar-ekleri-a2.json`, motor `src/battle/ridersA2.ts` (çağrı `riderConditionEvents`). Sürüm 29 ve öncesi (eski kayıt, replay) eski davranış. `data/attack-riders.json` üretilen dosya; durumları değişmedi, A2 bağlaması ayrı dosyada.

| Tür | Bağlanan |
|---|---|
| Hız/eylem kısıtı | 19 |
| İtme/çekme (K53 forcedMove) | 12 |
| Nefesin ikinci aşaması | 9 |
| Süresi ayrıştırılamayan durum | 8 |
| Özel metin/hasar | 8 |
| 0 HP'de tetiklenen | 6 |
| Sürekli hasar (yakalama) | 2 |
| Yutma/içine alma | 2 |
| HP eşiği | 2 |
| **Toplam** | **68** (tam 54, kısmi 14) |

Saldırı ekleri yeni sayım: 85 yok/kısmen kalemin 68'i bağlandı (54 tam, 14 kısmi), 17 kaldı.


## A2'de kalan

Kısmi bağlananların uygulanmayan kısmı:

| Saldırı | Kalan |
|---|---|
| ice-devil:Ice Spear | 'hareket ya da eylem, ikisi değil' kısıtı yok (yeni ekonomi kuralı). |
| ice-devil:Ice Spear (menzilli) | 'hareket ya da eylem, ikisi değil' kısıtı yok (yeni ekonomi kuralı). |
| harpy:Luring Song | harpiye doğru yürüme ve 'şarkı bitince' (harpi konsantrasyonu) yok. |
| djinni:Create Whirlwind | hedef kasırgayla birlikte hareket etmez. |
| erinyes:Entangling Rope | ipin AC/HP'si ve bonus eylemle serbest bırakma yok. |
| death-dog:Bite | Uzun dinlenmede HP maksimumu dönmemesi ve 24 saatte bir tekrar save savaş dışı. |
| roper:Tentacle | dokunaçların AC/HP'si yok. |
| animated-rug-of-smothering:Smother | 'hasar yerine yakalama' seçimi ve boğulma yok. |
| shambling-mound:Engulf | yığının altıgenine girme ve birlikte taşınma yok (sürükleme mevcut yakalama kuralıyla). |
| invisible-stalker:Vortex | sözlü bileşenli büyü yasağı yok. |
| water-elemental:Whelm | boğulma yok. |
| gelatinous-cube:Engulf | boğulma, sözlü bileşen yasağı ve küple birlikte taşınma yok (yutulan hedef alınamaz). |
| mummy:Rotting Fist | 24 saatte bir HP maksimumu azalması savaş dışı. |
| mummy-lord:Rotting Fist | 24 saatte bir HP maksimumu azalması ve uzun dinlenme yasağı savaş dışı. |

Hiç bağlanmayanlar (yeni sistem gerektirir ya da savaş dışı):

| Saldırı | Neden | Boyut |
|---|---|---|
| stirge:Proboscis | yapışma (attach) sistemi yok: yapışık kalıp her tur hasar, eylemle sökme | orta |
| sprite:Heart Sight | savaş dışı (duygu/hizalanma bilgisi) | savaş dışı |
| darkmantle:Crush | yapışma (attach) sistemi yok: hedefe yapışıp birlikte hareket, avantajla örtme | orta |
| wererat:Bite | lanet: 0 HP'de likantropa dönüşüp taraf değiştirme (yeni sistem) | büyük |
| werewolf:Bite | lanet: 0 HP'de likantropa dönüşüp taraf değiştirme | büyük |
| ghost:Possession | **Kuyruk K64a (sürüm 48) uygulandı**: `src/battle/possession.ts`, `data/ele-gecirme.json` (Game Master anahtarı `possession`) | tamam |
| incubus:Restless Touch | savaş dışı (kısa dinlenme yararı yok) | savaş dışı |
| wereboar:Gore | lanet: 0 HP'de likantropa dönüşüp taraf değiştirme | büyük |
| weretiger:Bite | lanet: 0 HP'de likantropa dönüşüp taraf değiştirme | büyük |
| barbed-devil:Hurl Flame | yalnızca giyilmeyen yanıcı nesneye; canavar saldırısı nesne hedeflemez | küçük |
| werebear:Bite | lanet: 0 HP'de likantropa dönüşüp taraf değiştirme | büyük |
| cloaker:Attach | yapışma (attach) sistemi yok: hasar paylaşımı, birlikte hareket | orta |
| aboleth:Dominate Mind | kalıcı zihin kontrolü + telepati (allegianceSwap bağlantısı ayrı iş; ölüm/uzaklık koşulu) | büyük |
| horned-devil:Hurl Flame | yalnızca giyilmeyen yanıcı nesneye; canavar saldırısı nesne hedeflemez | küçük |
| rakshasa:Cursed Touch | savaş dışı (dinlenme yararı yok) | savaş dışı |
| otyugh:Bite | savaş dışı (uzun dinlenmede save ve HP maksimumu) | savaş dışı |
| vampire:Bite | savaş dışı (gömülen hedef vampir yavrusu olarak kalkar) | savaş dışı |

Sonraki adım önerisi: yapışma (attach) sistemi (Stirge, Darkmantle, Cloaker; 3 canavar), likantrop laneti (0 HP'de taraf değiştirme; 5 canavar, allegianceSwap'a bağlanabilir), boğulma (Rug, Water Elemental, Gelatinous Cube, Darkmantle).

## A2: koşullu yetenekler (23)

Koşulu sağlayan senaryolarla doğrulandı (`src/battle/a2abilities.test.ts`): koşul varken çalışır, yokken reddedilir.

| Yetenek | Koşul | Sonuç |
|---|---|---|
| Swallow ×6 (Giant Frog, Giant Toad, Tarrasque, Behir, Remorhaz, Purple Worm) | yakaladığı hedef, save başarısız | ÇALIŞIR |
| Trample ×3 (Gorgon, Elephant, Mammoth) | 5 ft içinde Prone hedef | ÇALIŞIR |
| Rampage ×2 (Gnoll Warrior, Giant Hyena) | Bloodied düşman | ÇALIŞIR |
| Reel ×2 (Ettercap, Roper) | Restrained / Grappled hedef | ÇALIŞIR |
| Bubble Dash ×2, Aquatic Charge | derin suda | ÇALIŞIR |
| Tree Stride (Dryad) | ağaç bitişiğinde | **DÜZELTİLDİ** (sürüm 30): ikinci ağaca ışınlanır; eskiden varışta 2+ düşman isteniyordu |
| Animate Trees (Treant) | 60 ft içinde ağaç | ÇALIŞIR |
| Shadow Stealth (Shadow) | karanlık + gizlenme yeri | ÇALIŞIR |
| Swoop (Roc) | yakaladığı hedef | ÇALIŞIR |
| Consume Life (Will-o'-Wisp) | 5 ft'te 0 HP yaratık | ÇALIŞIR |
| Create Specter (Wraith) | 10 ft'te ölü insansı | ÇALIŞIR |
| Hellfire Spellcasting (Pit Fiend) | menzilde hedef | ÇALIŞIR (iki Fireball) |

Yetenekler: 61'in 61'i ÇALIŞIR (A0'da 38 + 23 kısmi).
