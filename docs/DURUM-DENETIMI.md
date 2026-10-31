# Durum denetimi (SRD 5.2.1) — Kuyruk 17 Görev H

Kaynak: SRD 5.2.1 "Rules Glossary" durum metinleri (Incapacitated, Stunned, Paralyzed, Frightened, Prone, Invisible), metnin kendisinden okundu. Motor: `src/rules/conditions.ts`, `data/conditions.json`, `src/battle/reduce.ts`, `src/battle/create.ts`, `src/battle/sight.ts`. Testler: `src/battle/incapacitated.test.ts`, `src/rules/combat.test.ts`.

## Incapacitated, Stunned, Paralyzed (uygulanır, testli)

| SRD maddesi | Incapacitated | Stunned | Paralyzed | Motor | Test |
|---|---|---|---|---|---|
| Eylem, bonus eylem, tepki yok | ✓ | ✓ (Incapacitated içerir) | ✓ | `isIncapacitated`, `canReact` | var |
| Konsantrasyon kesilir | ✓ | ✓ | ✓ | reducer `endConcentration` | var (Bless, çağrı) |
| Konuşamaz (Speechless) | ✓ | ✓ | ✓ | eylemsiz yaratık büyü yapamaz (sözlü bileşen ayrıca gerekmiyor) | eylem engeli testi |
| İnisiyatifte dezavantaj (Surprised) | ✓ | ✓ | ✓ | **Kuyruk 17'de eklendi** (`create.ts`; avantajla götürür) | **yeni test** |
| Hız | düşmez | düşmez (5.2.1'de "hareket edemez" yok) | 0, artamaz | `speedZero` | var |
| STR/DEX save otomatik başarısız | — | ✓ | ✓ | `autoFailsStrDexSave` (zar atılmaz) | var |
| Ona saldırılar avantajlı | — | ✓ | ✓ | `TARGET_ADVANTAGE` | var |
| 5 ft içinden isabet kritik | — | — | ✓ | `isAutoCritical` (`withinFiveFt`: bitişik; 10 ft erişim değil) | var |
| Bitiş | kaynağa göre | kaynağa göre | kaynağa göre | `conditionTimers` (tur, başına/sonuna dek, save ends) | Stunning Strike, Hold Person |

Hızlı regresyon: Çöl, Orman, Kale, Mağara (3. seviye, standart, 20 tohum) bit bit aynı (savaş başında durumlu yaratık yok, zar sayısı aynı).

## Kuyruk 16 K16E: düzeltildi (kural sürümü 2)

Yeni savaşlar kural sürümü 2 ile başlar (`kuralSurumu`, `data/kural-surumu.json`, `src/battle/ruleVersion.ts`); eski kayıt ve replay (alan yok) sürüm 1 ile eski kurallarla oynar. Testler `src/battle/ruleVersion.test.ts`.

| Durum | Düzeltme (sürüm 2) |
|---|---|
| Prone | Saldırı zarı saldıranın 5 ft içinde olmasına göre: içindeyse avantaj, değilse dezavantaj (saldırı türüne bakılmaz; `sightConditions` → `proneWithin5`). Kalkma (hızın yarısı, hız 0'da kalkamaz) zaten SRD'ye uygun. |
| Frightened | Dezavantaj saldırı zarlarına **ve** yetenek kontrollerine (Game Master kontrolü, kaçış, yakalamadan kurtulma, bataktan çıkma, arama, gizlenme), yalnızca korku kaynağı görüş hattındayken (`frightenedNow`). Kaynak: süreli durum sayacının `sourceId`'si, durumu veren süren etki ya da konsantrasyon bağı; bilinmiyorsa eski gibi hep. Kaynağa isteyerek yaklaşamaz: `moveCostFn` kaynaklardan birine yaklaşan adımı yasaklar (oyuncu yürüyüşü ve yapay zekâ yol bulması aynı yoldan; zorlama hareketi etkilenmez). |
| Invisible | İnisiyatif atılırken Invisible olan avantajlı atar (Remarkable Athlete ile aynı; Incapacitated dezavantajıyla götürür). |

Kalan sapmalar (uygulanmadı): sürünme (Prone yaratık motor tarafından yürümeden önce ayağa kaldırılır; SRD sürünmeyi de seçenek olarak tanır: ft başına +1 ft), isteğe bağlı yere yatma (Dropping Prone) komutu yok; Invisible'ın "görmeyi gerektiren etki" denetimi genel değil.

### Open Hand Technique ve Cunning Strike

- **Open Hand Technique (Topple):** Monk'un kendisi bitişikten vurduğu için iki sürümde de avantajlı. Değişen, partinin diğer üyeleri: yerdeki hedefe bitişikten menzilli saldırı artık avantajlı (yakın düşman dezavantajıyla götürür → normal), 10 ft erişimli (Glaive) yakın dövüş artık dezavantajlı. Monk partisi ölçümü `docs/harita/DENGE.md` (Çöl %77 → %83).
- **Cunning Strike (Trip):** aynı mantık; Rogue genelde bitişikten ya da uzaktan (yay) saldırır: uzaktan yerdeki hedefe iki sürümde de dezavantaj. Ölçümde yalnızca küçük oynama.

## Frightened, Prone, Invisible (Kuyruk 17 raporu; yukarıda düzeltildi)

| Durum | SRD 5.2.1 | Motorda | Eksik / sapma |
|---|---|---|---|
| Frightened | Korku kaynağı görüş hattındayken kontrollerde ve saldırılarda dezavantaj; kaynağa isteyerek yaklaşamaz | Saldırıda dezavantaj her zaman | (1) görüş hattı koşulu yok (kaynak görünmese de dezavantaj); (2) yetenek kontrollerinde dezavantaj yok (`checkMode`); (3) "kaynağa yaklaşamaz" hareket kısıtı yok; durum kaynağı (`sourceId`) saklanmıyor |
| Prone | Yalnızca sürünme ya da yarı hızla kalkma; saldırılarında dezavantaj; 5 ft içinden saldırı avantajlı, değilse dezavantajlı | Kalkma yarı hız; saldırıda dezavantaj; hedefe yakın dövüş avantaj / menzilli dezavantaj | Mesafe yerine saldırı türüne bakılıyor: 10 ft erişimli yakın dövüş avantaj alıyor (dezavantaj olmalı), bitişikten menzilli saldırı dezavantaj alıyor (avantaj olmalı; menzilli saldırının yakın düşman dezavantajıyla götürür). Sürünme (ft başına ek 1 ft) ayrı kip değil |
| Invisible | İnisiyatifte avantaj; görmeyi gerektiren etkilerden etkilenmez; ona saldırılar dezavantajlı, onun saldırıları avantajlı; onu gören için bu fayda yok | Saldırı avantaj/dezavantajı; görülüyorsa (`revealed`, `seeInvisible`) yok sayılır | (1) inisiyatifte avantaj yok; (2) "görmeyi gerektiren etki" denetimi genel değil (büyü hedeflemesinde görüş kuralı yalnızca görüş hattı) |

Önerilen düzeltmeler (ayrı görev; eski senaryoları değiştirebilir): Prone'u `AttackContext`'e mesafe (`withinFiveFt`) vererek düzeltmek; Frightened için durum kaynağı + görüş + kontrol dezavantajı + yaklaşma yasağı (`moveCostFn`); Invisible inisiyatif avantajı (bu turdaki değişiklikle aynı yerde, tek satır).

## Etkilenen sınıf ve alt sınıf özellikleri

Veride bu altı durumdan birini anan özellikler (sayım `data/subclasses.json` ve `data/class-features.json`):

**Alt sınıf özellikleri: 6**
1. Barbarian / Path of the Berserker 6 — Mindless Rage (Frightened; planlı)
2. Barbarian / Path of the Berserker 14 — Intimidating Presence (Frightened; çalışmıyor)
3. Druid / Circle of the Land 14 — Nature's Sanctuary (Incapacitated; planlı)
4. Monk / Warrior of the Open Hand 3 — Open Hand Technique (Prone; çalışır — Prone sapmasından etkilenir)
5. Rogue / Thief 9 — Supreme Sneak (Invisible; çalışmıyor)
6. Warlock / Fiend Patron 14 — Hurl Through Hell (Incapacitated; planlı)

**Sınıf özellikleri: 11**
Barbarian Rage, Danger Sense (Incapacitated ile biter/geçmez); Bard Countercharm (Frightened); Cleric Channel Divinity / Turn Undead (Frightened + Incapacitated); Druid Wild Shape (Incapacitated); Monk Stunning Strike (Stunned); Rogue Cunning Strike (Prone), Evasion, Elusive (Incapacitated); Ranger Nature's Veil (Invisible); Warlock Eldritch Invocations (Prone, Invisible).

Bu turdaki tek motor değişikliği (inisiyatifte dezavantaj) bunlardan hiçbirinin davranışını değiştirmez: inisiyatif yalnızca savaş başında atılır ve bu özellikler savaş içinde durum verir.
