# Heroic Inspiration (Görev HEROIC-INSPIRATION-TAM)

Tarih: 2026-11-28. Kaynak: SRD 5.2.1 s. 7 "Heroic Inspiration", s. 182 Sözlük, s. 85 Human "Resourceful", s. 48 Champion "Heroic Warrior".
Kural sürümü **110 → 111** (tek sabit `src/battle/heroic111Surum.ts`), kayıt sürümü **28 → 29** (3–28 yüklenir). Kararlar DECISIONS.md "HEROIC-INSPIRATION-TAM".

## SRD özeti

| Kural | SRD 5.2.1 | Oyunda |
|---|---|---|
| Kullanım | Hakkı harca, bir zarı hemen yeniden at, yeni sonucu kullan | Başarısız d20 Testinde (saldırı, save, kontrol) bir kez yeniden atış, kullanmadan önce sorulur (⚠ yaklaşık: hasar zarı yok) |
| Bir seferde bir | Hak varken yenisi gelirse hakkı olmayan bir PC'ye verilebilir, yoksa kaybolur | Game Master verirken "aktar / kaybolsun" seçer; en çok 1 |
| Game Master verir | Kahramanca, karaktere uygun, eğlenceli oyun için | Savaşta çekmecede, Game Master kurulumunda, Serüven'de düğme; Serüven olay ödülü |
| Human Resourceful | Uzun dinlenme bitince | Uzun dinlenmede (kısa dinlenmede değil); eskiden de böyleydi (TE99) |
| Champion Heroic Warrior | Savaşta turunu haksız başlatınca | Değişmedi (tur başı, 97+ ilk tur dahil) |

## Önce / sonra

| Eksik | Önce | Sonra |
|---|---|---|
| (1) Kâğıtta kalıcı hak | Yalnız Human'da (tür kaynağı); diğerlerinde savaşta kazanılan hak savaş sonunda siliniyordu | Her karakterin kâğıdında `resources.heroicInspiration` (0/1); savaş sonu yazılır, sonraki savaşa gelir |
| (2) Game Master verişi | Yok | Savaş: `grant_inspiration` (111+). Savaş dışı: Game Master kurulumu ▸ "Heroic Inspiration (Game Master)". Serüven: `ilham_ver` (kurallar paneli açıkken), düğüm ödülü `reward.ilham` |
| (3) Görünürlük | Yalnız savaş çekmecesinde kaynak listesinde (Human) | Karakter kartında ve karakter kâğıdında (başlık altı) ✦ satırı, Game Master kurulumunda parti çipinde ✦, Serüven parti çubuğunda ✦, savaş çekmecesinde "Heroic Inspiration" satırı + kaynak ikonu (ilham) |
| (4) En çok 1 | Kaynak tavanı 1 (Human); verme yolu yoktu | Her yolda en çok 1; fazlası aktarılır ya da kaybolur |
| Kullanım | Yalnız `resourceful`/`heroic-warrior` işaretiyle | 111+: hakkı olan her oyuncu karakteri (`hi111`) |

## Dosyalar

- Kural (savaş dışı, sürümsüz): `src/rules/heroicInspiration.ts`, `src/rules/characterRest.ts` (`currentStatus`, `isRested`), `src/app/partyStatus.ts` (`applyBattleResult`).
- Savaş (111): `src/battle/heroic111Surum.ts`, `create.ts` (`hi111` işareti), `effectDice.ts`, `commands.ts` (`grant_inspiration`), `reduce.ts` (`inspiration_granted`), `types.ts`, `src/ui/log.ts`, `src/room/auth.ts` (GM komutu), `src/app/battleSave.ts` (29).
- Serüven: `src/journey/seruven.ts` (`ilham_ver`, `seruven_ilham`, `reward.ilham`), `src/journey/types.ts`, `src/journey/sefer.ts`.
- Arayüz: `src/ui/HeroicGrant.tsx` (rozet + verme), `src/screens/Screens.tsx`, `src/screens/sheet/sheetModel.ts` + `SheetView.tsx` (`heroic`), `src/screens/GmScreen.tsx`, `src/screens/SeruvenScreen.tsx`, `src/MapBattle.tsx` (çekmece satırı), `data/kaynak-ikon.json`, `src/styles.css`, metinler `strings.ts` / `strings.tr2.ts` / `strings.en.ts`.
- Testler: `src/rules/heroicInspiration.test.ts`, `src/battle/heroic111.test.ts`, `src/journey/heroicSeruven.test.ts`.

## Eski kayıt

- 110 ve altı savaş kaydı / replay: işaret yok, `grant_inspiration` reddedilir; davranış aynı.
- Eski karakter kaydı: Human'ın anahtarı aynı; diğerlerinde anahtar yok = hak yok. Karakter kayıt sürümü değişmedi.

## Kalanlar

- SRD'nin "herhangi bir zar" kapsamı (hasar zarı, başarılı d20) yok; yalnız başarısız d20 (⚠, TE99'dan beri).
- Human'ın uzun dinlenmede hakkı varken kazandığı yeni hakkı aktarma seçimi yok (kaybolur).
- Serüven verisinde `reward.ilham` taşıyan düğüm yok (içerik kararı); görev ödülü (`gorev.odul`) için ilham alanı yok.
- Yapay zekâ Game Master hak vermez (simülasyon aynı).

## Doğrulama (hafif mod)

- `npm run typecheck`, `npm run build` yeşil (ana parça 467,24 kB / 500 kB).
- Yeni testler: `heroicInspiration.test.ts` (7), `heroic111.test.ts` (5), `heroicSeruven.test.ts` (2).
- İlgili mevcut testler yeşil: te99, b95fighter, k18h3, k19tier4b, karar104, mc3, mc2, k10, characterRest, battleSave, room auth/reconnect, resourceIcon, i18n, journey engine/moral/seruven, ck1, sheetPortrait, `src/sim/k59uyum.test.ts` (kural sürümü 1–111 × her kayıt sürümü aç/devam).
- `check:harita`, `check:ses`: dokunulmadı (harita/ses yok). Tam `npm test` çalıştırılmadı (hafif mod). Denge ölçümü yok (yeni parti yok).
- Ekran görüntüsü: `docs/gorev-heroic/kart-rozet.png` (karakter listesinde ✦ Heroic Inspiration).
