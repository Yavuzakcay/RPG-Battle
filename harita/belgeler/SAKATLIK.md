# SAKATLIK — kalıcı yaralanma (ev kuralı, Serüven)

Durum: **PLAN — uygulanmadı (DUR).** Kullanıcı kararı 2026-11-28 (mekanik donmasına bilinçli istisna).
Neden durduruldu: görev kuralı "15 dosyadan büyükse ya da motor çekirdeğine geniş dokunuyorsa DUR". Tam iş ≈35 dosya
ve çekirdek (`damage-effects.ts`, `reduce.ts`, `types.ts`, `create.ts`, `battleSave.ts`) değişiyor. Aşağıda ≤15 dosyalık
dört aşamaya bölünmüş plan, SRD okuması, taslak tablo ve KARAR GEREKİYOR listesi var. Hiçbir kod/veri değişmedi.

## 1. Kural (kullanıcı onaylı, değişmez)

- Yalnız parti tarafının oyuncu karakterleri (kâğıttan gelen, `allegiance.side ?? side === 'party'`, çağrı/sivil değil).
  Canavar, kâğıt düşman (düşman tarafındaki kâğıt), boss: asla.
- Tetik: hasar hedefi 0 HP'ye düşürürse `artan = hasar − o anki HP` (bugünkü `src/battle/damage-effects.ts` satır 132).
  - `artan ≥ azami HP` → anında ölüm (SRD; Death Ward, Relentless Endurance/Rage aynen önce çalışır).
  - `azami HP / 2 ≤ artan < azami HP` → **kalıcı sakatlık** + yine ölmekte (0 HP, ölüm save'leri).
  - daha azı → yalnız ölmekte.
- Zaten 0 HP'deki (ölmekte/stabil) karaktere gelen hasar sakatlık vermez (tetik "0 HP'ye düşürürse").
- Doğrulama örnekleri (test olarak yazılacak):

| Azami | Can | Hasar | Artan | Sonuç |
|---|---|---|---|---|
| 40 | 25 | 40 | 15 | yok |
| 40 | 25 | 50 | 25 | sakatlık |
| 40 | 25 | 65 | 40 | ölüm |
| 60 | 60 | 80 | 20 | yok |
| 60 | 60 | 95 | 35 | sakatlık |
| 60 | 60 | 120 | 60 | ölüm |
| 60 | 8 | 45 | 37 | sakatlık |

## 2. Motorda nereye oturur (inceleme bulguları)

- `damageEffects(target, applied, damageType, critical, rng)` 27 dosyadan 48 kez çağrılıyor ve `state` almıyor. Kural sürümü
  ve ev kuralı kapısı bu yüzden **savaşçı işaretiyle** (mevcut `srd96`/`te99`/`k103` kalıbı): `startBattle` (create.ts)
  sürüm ≥ 111 ve `sakatlik` açıkken parti kâğıtlarına `sakatlik: true` yazar. 48 çağrı yeri değişmez.
- `damageEffects` son dalında `{ kind: 'dying' }` yerine, işaretli hedefte ve eşik aşılınca
  `{ kind: 'dying', injury: { id, kademe, tur, oran } }` (alan yalnız o zaman; eski olaylar aynı). Hesap zarsız ve
  deterministik (tablo + oran), replay güvenli.
- Reducer (`reduce.ts` `dying` dalı, satır ~384): `injury` varsa süren etkiyi `sakatlik:<id>` ekler ve savaşçının
  `sakatliklar` listesine yazar.
- **Çok türlü hasar sınırı:** `damageEffects` tek tür alıyor; çağıranlar bileşenleri toplayıp birincil türle geçiyor
  (ör. `spells.ts:360` `adjusted + adjusted2`, `damageType`). "En büyük bileşen" için ana yollara (silah saldırısı
  `features.ts:373`, canavar saldırısı `monsters.ts:242`, iki türlü büyü `spells.ts:360/1116`) baskın türü hesaplayan
  küçük yardımcı gerekir; kalan 40+ yol tek türlü zaten. → KARAR G4.
- Karakterde kalıcılık: `CharacterStatus` (`src/rules/characterRest.ts`) içine isteğe bağlı `sakatliklar` (likantrop
  `lanet` kalıbı: `moralPart` dinlenmelerde taşır, kısa/uzun dinlenme silmez). Alan isteğe bağlı → karakter kayıt sürümü
  (4) artmaz, eski kayıt aynen yüklenir. Savaş sonu yazımı ve savaş başı uygulaması `src/app/partyStatus.ts`
  (`withStatus`, lanetle aynı yer).
- Mevcut altyapı yeterli (yeni etki alanı gerekmiyor): `ActiveEffect.grants` (Blinded/Deafened/Poisoned),
  `speedFt` (eksi), `checkDis` (yetenek), `checkDisSkill` (beceri), `dice` (−1d4 saldırı), `attackDis`, savaşçı
  `maxHpLoss` (Greater Restoration'ın zaten kaldırdığı alan), `ability_drained` olayının yetenek düşüşü hesabı.
- Kayıt sürümü: `dying.injury` olay biçimi değişikliği → `SAVE_VERSION` 28 → 29 (28 yüklenir kalır).
- Kural sürümü: yeni tek sabit `src/battle/sakatlikSurum.ts` `SAKATLIK_VERSION = 111`; ≤ 110 kayıt/replay'de yok.

## 3. SRD 5.2.1 okuması (PDF'ten; `data/srd/*.json` aynı metin, sayfalar kayıttan)

| Kaynak | Sayfa | SRD metni (özet, birebir anlam) | Sakatlıkta karşılığı |
|---|---|---|---|
| Lay On Hands | s. 53 | Havuzdan 5 HP harcayarak Poisoned kaldırır; bu puanlar HP vermez | Kalıp genişletilir: kademeye göre havuzdan maliyet (ev kuralı) |
| Restoring Touch (Paladin 14) | s. 53 | LoH ile Blinded, Charmed, Deafened, Frightened, Paralyzed, Stunned; durum başına 5 HP | Ev kuralının LoH maliyeti bunun üstüne kurulur |
| Lesser Restoration | s. 144 | Bir durumu bitirir: Blinded, Deafened, Paralyzed, Poisoned | Körlük (Blinded), sağırlık (Deafened), kalıcı Poisoned. Başka sakatlık **yok** |
| Greater Restoration | s. 137 | 1 Exhaustion; Charmed/Petrified; lanet; **yetenek puanı düşüşü**; **HP maksimumu düşüşü** | Necrotic (azami HP), Psychic ve Poison yetenek düşüşleri. Durum veren sakatlık **yok** (Blinded/Deafened listede değil) |
| Heal | s. 139 | 70 HP; Blinded, Deafened, Poisoned biter | Lesser Restoration ile aynı küme |
| Mass Heal | — | Blinded, Deafened, Poisoned kaldırılır | Aynı küme |
| Power Word Heal | — | Charmed, Frightened, Paralyzed, Poisoned, Stunned biter | Kalıcı Frightened (seçilirse), kalıcı Poisoned |
| Regenerate | s. 158 | 4d8 + 15 HP, 1 saat tur başı 1 HP, "severed body parts regrow after 2 minutes" | Yalnız yaralı uzuv (Slashing/Piercing/Bludgeoning) |
| Wish (Instant Health) | — | Greater Restoration listesindeki etkileri bitirir | Greater Restoration ile aynı |
| Remove Curse | s. 158 | Lanetler | Hiçbiri (sakatlık lanet değil) |

SRD'de yara izi (Fire/Acid) ve soğuk hasarı hızına (Cold) uyan büyü yok → yalnız şifa evi/tapınak. Force: SRD'de karşılık yok.

## 4. Taslak tablo (`data/sakatlik.json`; kodda sayı yok) — ONAY BEKLİYOR

Kademe artanın azami HP'ye oranından: **hafif** 0,50–<0,67 · **orta** 0,67–<0,84 · **ağır** 0,84–<1,00.

| Tür | Sakatlık | Hafif | Orta | Ağır | İyileşir (SRD) |
|---|---|---|---|---|---|
| Radiant | Körlük | Algı (görme) kontrolü dezavantaj (`checkDisSkill` perception) | + saldırı −1d4 (`dice`) | **Blinded** (`grants`) | Lesser Rest., Heal, Mass Heal |
| Lightning, Thunder | Sağırlık | Algı dezavantaj | + inisiyatif dezavantaj? (KARAR G6) | **Deafened** (`grants`) | Lesser Rest., Heal, Mass Heal |
| Necrotic | Solgunluk | azami HP −%10 | −%20 | −%30 (`maxHpLoss`, aşağı yuvarla, en az 1) | Greater Rest., Wish |
| Fire, Acid | Yara izi | İkna (Persuasion) dezavantaj | CHA kontrolleri dezavantaj (`checkDis` cha) | CHA kontrolleri dezavantaj + CHA −1 | yok (yalnız tapınak) |
| Cold | Donuk uzuv | hız −5 ft | hız −10 ft (kullanıcının değeri) | hız −15 ft | yok (yalnız tapınak) |
| Bludgeoning | Kırık bacak | hız −5 ft | hız −10 ft | hız −10 ft + saldırı −1d4 | Regenerate |
| Slashing, Piercing | Yaralı kol | saldırı −1d4 (`dice`) | STR/DEX saldırısı dezavantaj tek saldırı? (KARAR G7) | yakın dövüş saldırısı dezavantaj (`attackDis` melee) | Regenerate |
| Psychic | Zihin yarası | WIS ya da INT −1 (yüksek olan) | −2 | −3 (alternatif: kalıcı Frightened; KARAR G5) | Greater Rest., Wish |
| Poison | Zehir izi | CON −1 | CON −2 | **Poisoned** (`grants`) | hafif/orta Greater Rest.; ağır Lesser Rest., Heal, PW Heal |
| Force | — | öneri bekliyor (G3) | | | |

Not: yetenek düşüşü savaşçıya `ability_drained` hesabıyla (değiştirici, save, saldırı) savaş başında uygulanır; karakter
kâğıdının kendisi değişmez, liste `CharacterStatus.sakatliklar`'da.

### İyileştirme taslakları — ONAY BEKLİYOR

- **Lay On Hands** (ev kuralı): havuzdan hafif 5 / orta 10 / ağır 20 HP; bu puanlar HP vermez (SRD'nin Poisoned kalıbı).
  Restoring Touch gerekmez mi, gerekir mi → KARAR G8.
- **Şifa evi/tapınak** (Serüven hub `tapinak`; `moral_dirilt` yolu emsal, tapınak diriltmesi 300 altın):
  hafif 50 altın / 1 gün · orta 150 altın / 3 gün · ağır 300 altın / 7 gün. Gün = uzun dinlenme sayısı (Hapishane
  takvimi gibi). Yeni Serüven komutu `sakatlik_tedavi` + olay `seruven_tedavi`.
- **Büyüler**: yalnız §3 tablosundaki eşleme; uymayan büyü o sakatlığı kaldırmaz. Savaşta yapılan büyü süren etkiyi
  kaldırır, savaş sonu listeden düşer. Savaş dışı büyü yapma arayüzü yok → KARAR G9.

## 5. Anahtar ve sürüm

- Ev kuralı `sakatlik` (`data/ev-kurallari.json`, Game Master "Ev kuralları" panelinde). Varsayılan: Serüven'de açık
  (`src/app/seruvenBattle.ts` `houseRules` satırı), hızlı savaş/GM kurulumunda kapalı (`default: false`).
  **KARAR GEREKİYOR G1** — değiştirmek tek satır (`default`).
- Kural sürümü 111 (`SAKATLIK_VERSION`), kayıt sürümü 29. Simülasyon varsayılanı kapalı (ev kuralı kapalı).
- Regresyon: `src/sim/sakatlikRegresyon.test.ts`, 3 tohum, 4 senaryo: 110 imzası = altın, 111 (kural kapalı) = 110,
  111 (açık) çökmesiz.

## 6. KARAR GEREKİYOR

| # | Konu | Öneri |
|---|---|---|
| G1 | Hızlı savaş/GM kurulumunda varsayılan | Kapalı (Serüven açık) |
| G2 | Sınır: bir karakterde en çok kaç sakatlık; aynı tür tekrarı | En çok 3. Aynı tür tekrarında kademe +1 (ağır üstü değişmez). 3 doluyken yeni türde yeni sakatlık yazılmaz, en hafif olanın kademesi +1 |
| G3 | Force sakatlığı | (a) yok, ya da (b) "iç kanama" = Necrotic gibi azami HP düşüşü (Greater Restoration). Öneri (b) |
| G4 | Çok türlü hasarda tür | Ana dört yolda baskın bileşen (silah, canavar saldırısı, iki türlü büyü); diğer yollar tek türlü |
| G5 | Psychic: kalıcı Frightened mı yetenek düşüşü mü | Yetenek düşüşü. Kaynaksız Frightened, sürüm 2'den beri `frightenedNow` kaynak görüşü istediği için tutarsız |
| G6 | Körlük/sağırlık hafif-orta kademeleri (Blinded/Deafened ikili) | Tablodaki beceri/zar cezaları; tam durum yalnız ağırda |
| G7 | Yaralı kol orta kademe | Saldırı −1d4 + hasar −1d4 (`damagePenalty`) |
| G8 | LoH ile sakatlık kaldırma Restoring Touch (14) ister mi | İstemez (1. seviyeden, yalnız maliyetle) |
| G9 | Savaş dışı büyüyle iyileştirme | Bu görevde yok; Serüven karakter ekranına "büyüyle tedavi" düğmesi (slot harcar) ayrı aşama |
| G10 | Likantrop dönüşümü sakatlık yazar mı | Yazar (0 HP'ye düşüş gerçekleşti) |
| G11 | Ölen karakterin sakatlıkları diriltmede | Kalır (diriltme sakatlığı silmez) |
| G12 | Tablodaki bütün sayılar (kademe eşikleri, cezalar, LoH maliyeti, tapınak altın/gün) | Taslak; onay |

## 7. Plan (dört aşama, her biri ≤ 15 dosya)

**S1 — Motor (15):** `data/sakatlik.json`, `data/ev-kurallari.json`, `data/kural-surumu.json`,
`src/battle/sakatlikSurum.ts`, `src/battle/sakatlik.ts` (eşik, kademe, tür seçimi, etki kurma), `damage-effects.ts`,
`types.ts` (`dying.injury`, `Combatant.sakatlik`/`sakatliklar`), `reduce.ts`, `create.ts` (işaret), `battleSave.ts`
(29), `features.ts`/`monsters.ts`/`spells.ts` baskın tür (G4), `src/battle/sakatlik.test.ts` (yukarıdaki 7 örnek,
kâğıt düşman/boss/canavar/çağrı muaf, Death Ward, sürüm 110'da yok), regresyon testi. Belgeler DECISIONS/CLAUDE.md.

**S2 — Karakter ve Serüven (≈12):** `characterRest.ts` (`sakatliklar`, dinlenmede taşınır), `partyStatus.ts`
(savaş sonu yaz, savaş başı uygula: süren etki + `maxHpLoss` + yetenek düşüşü), `seruvenBattle.ts` (varsayılan açık),
`src/journey/seruven.ts` (`sakatlik_tedavi`), hub tapınak (`YerlesimHub.tsx`/ortak `HubTemple`), testler, metinler.

**S3 — Savaşta iyileştirme (≈8):** `divine.ts` (LoH seçeneği), `spells.ts` `cure` yolunun sakatlık eşlemesi
(`data/sakatlik.json` `iyilesir`), LoH seçim arayüzü, testler.

**S4 — Arayüz (≈10):** karakter listesi kartı (`Screens.tsx`), Serüven karakter ekranı (`SeruvenScreen.tsx`):
ad, kademe, etki, nasıl iyileşir; günlük "sakatlandı: …" (`logEntries.ts`, `strings.tr2.ts`, `strings.en.ts`);
ölmekte uyarısı; `strings.ts`/`strings.en.ts`; tek ekran görüntüsü.

Genel ilke her aşamada: kodda hasar türü ya da sakatlık adıyla koşul yok, hepsi `data/sakatlik.json`'dan.

## 8. Test sonuçları

Kod değişmediği için test çalıştırılmadı (typecheck/build/test: dokunulmadı; `check:harita`, `check:ses`: dokunulmadı).
