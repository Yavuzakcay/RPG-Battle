## Serüven öncesi mutlaka (en çok 15; elle seçildi)

Ölçüt: Serüven'in her savaşında görülen, SRD'de olan ve oyunu yanlış oynatan açıklar; denge ölçümü gerektirenler işaretli.

1. **Denge yeniden ölçümü (101 `nightVision` varsayılan açık, 103 canavar inisiyatifi):** Kale %32, gece senaryoları ölçülmedi (DENGE.md).
2. **Storm of Vengeance 2–10. tur aşamaları** (BUYU-TAM-TARAMA §4.1): 9. seviye büyü yalnız ilk turunu yapıyor.
3. **Yapışma eki** (Stirge, Darkmantle, Cloaker; KAPSAM103): erken seviye düşmanlardan Stirge sık; yapışık kalıp her tur hasar yok.
4. **Boğulma / "nefes alamaz"** (Rug of Smothering, Water Elemental Whelm, Gelatinous Cube Engulf): tek `noBreath` etkisi.
5. **Likantrop laneti** (5 canavar): 0 HP'de canavara dönüşme; en azından savaş sonu "lanetli" işareti.
6. **Eşya ↔ silah bağı** (Weapon +N, Flame Tongue, Javelin of Lightning; TE99 K-D2, KARAR101 5e): büyülü silah bonusu hangi silaha.
7. **Yapay zekâ Ready ve Dash dengesi** (GENEL-SAVAS-DENETIM A27, A45): YZ Ready kullanmıyor.
8. **Ready yanıt listesi** (A23): yalnız tek saldırı / hareket / büyü; Utilize, Help, Dash yanıtı yok.
9. **0 HP'de uzun dinlenme** (G6/D21; bilinçli sapma): Serüven bozgun akışı SRD'den sapıyor.
10. **Unconscious eşya düşürme** (B40): YZ'nin yerden silah alması gerekiyor.
11. **Oyuncu seçimleri yerine otomatik seçimler** (Preserve Life, Land's Aid, Sculpt Spells, Superior Hunter's Prey, Intimidating
    Presence; Stroke of Luck, Peerless Aim): `askChoice` kalıbıyla.
12. **Cutting Words ıskada, Dark One's Own Luck** (Bard/Warlock tepki zamanlaması).
13. **Maliyetli materyal** (Revivify 300 GP …): Serüven ekonomisiyle doğrudan ilgili.
14. **Çoklu sınıf kararı** (Multiclassing): Serüven seviye atlamasında soru çıkacak.
15. **"Var-test edilmiş" sınama açığı:** örneklemde satırların ≈ %42'si kuralı gerçekten sınıyor (SRD-KAPSAM Aşama 5 notu); Serüven
    öncesi tam test turunda yüzeysel testler kural testine çevrilmeli.

## Bölüm 3 (elle): karar gerektiren sorular ve öneriler (16)

1. **Knocking Out bitişi:** bayıltılan savaş sonunda yenilmiş sayılıyor (KARAR101). Serüven'de esir alma / sorgu olacak mı? Öneri: şimdilik
   yenilmiş; esir alma Serüven olayı olarak ayrı görev.
2. **Eşyayı silaha bağlama** (KARAR101 5e): oluşturucuda eşyaya silah seçimi mi, ilk uygun silah varsayılanı mı? Öneri: donanım adımında
   seçim, varsayılan ana silah.
3. **Storm of Vengeance aşamaları** (BUYU-TAM §4.1): alan tetikleyicisine aşama sayacı eklensin mi? Öneri: evet, sürüm 104+.
4. **Savaş dışı süreler** (Light 1 saat, Find Familiar, Animate Dead 24 saat): Serüven zaman modeline bağlansın mı? Öneri: saat/gün
   alanı gelince.
5. **Eşya büyüleri** (Dispel Magic nesnede, Remove Curse eşya bağı): eşya örneği şeması? Öneri: 2 ile birlikte.
6. **Wish serbest dilek:** Game Master'da kalsın mı? Öneri: kalsın (sapma kayıtlı).
7. **Maliyetli materyal (GP):** büyüler materyalsiz mi kalsın, envanter denetimi mi? Öneri: Serüven dükkânı + `components.costGp`.
8. **Yapışma / likantropi / boğulma** (KAPSAM103): yeni "bağlı yaratık" sistemi + `noBreath` etkisi + 0 HP biçim değişimi; kapsam
   onayı? Öneri: üçü tek görev, sürüm 104+.
9. **0 HP uzun dinlenme** (G6): Serüven bozgun akışı SRD'ye dönsün mü (1d4 saat sonra 1 HP)? Öneri: Kolay'da ev kuralı, Normal'de SRD.
10. **YZ Dash/Ready denge** (A45, A27): YZ Ready kullansın mı? Öneri: yalnız menzilli bekleyen düşmanlar, ölçümle.
11. **Unconscious eşya düşürme** (B40): YZ yerden silah alsın mı? Öneri: evet, `pick_up` adayı, sonra kuralı aç.
12. **Monk Stunning Strike zamanı** (K2): "bu tur son vurulan hedef" yorumu kalsın mı? Öneri: kalsın, isabet anı istemi sonra.
13. **Bard ilham zarını seçerek atma** (K1), **Stroke of Luck istemi** (C): oyuncuya sorulsun mu? Öneri: tepki ayarındaki "Sor" ile.
14. **Swarm'ın başka yaratığın altıgeninde durması** (SWARM95): doluluk kuralı genişlesin mi? Öneri: SRD metni net; uygula.
15. **Çoklu sınıf** (SRD s. 24–25): kapsam? Öneri: Serüven sonrası, oluşturucu + `classes[]` şeması.
16. **Dash kip seçimi** (KARAR101 ⚠): uçan yaratık yürüme kipi seçebilsin mi? Öneri: hareket kipinin arayüzü gelince.

## Bölüm 5: doğrulama probe listesi (14; gece kuyruğunda ⚠ ya da "doğrulanmadı" kalanlar)

| Probe | Ne denenir | Kaynak |
|---|---|---|
| P1 | Knocking Out sonrası savaş sonu: tek ayakta düşman bayıltılınca `battle_finished` parti; Serüven akışı | KARAR101 |
| P2 | Dash + Fly (Dash'ten sonra Fly yapılırsa) bütçesi arayüzde doğru gösteriliyor mu | KARAR101 ⚠ |
| P3 | Kalkan çıkaran Monk/Barbarian'ın Unarmored Defense'i (yeniden türetilmiyor) | KARAR101 ⚠ |
| P4 | Yakalama tutan oyuncunun fırsat saldırısında Two-Handed seçeneği reddi ve Versatile tek el | KARAR101 |
| P5 | Stone's Endurance alan/zemin hasarında tepki istemi ve Giant Ancestry kullanımı | KARAR101 |
| P6 | `nightVision` açıkken gece haritalarında YZ hedef seçimi (görmediği hedef) ve kilitlenme | KARAR101 |
| P7 | Etherealness ile Ethereal'e geçen dostun tur sonu dönüşü (süre, hedef alınmazlık) | BUYU-TAM |
| P8 | Earthquake'te büyücünün kendi konsantrasyonu (alan içindeyken) | BUYU-TAM |
| P9 | Mass Cure Wounds arayüz seçicisi kürede olmayan hedefi gri gösteriyor mu | BUYU-TAM |
| P10 | 103 inisiyatifiyle boss savaşları (`sim:boss`) ve efsanevi eylem sırası | KAPSAM103 |
| P11 | Weakening Breath'in Multiattack'ta Rend yerine geçmesi (YZ planı) | KAPSAM103 |
| P12 | Weight of Years "sonraki turunun başına dek bir kez" (`legendaryUsed` sıfırlanması) | KAPSAM103 ⚠ |
| P13 | Empowered Evocation: Magic Initiate ile alınan Wizard dışı Evocation büyüsünde ek yok | KAPSAM103 |
| P14 | "var-test edilmiş" satırlarından 30'luk ikinci örneklem (Aşama 5 oranının güveni) | Aşama 5 |

## Bölüm 6 (elle): savaş dışı SRD sistemleri ve tasarım adımları (12)

| Sistem | SRD | Önerilen tasarım adımı |
|---|---|---|
| Çoklu sınıf | s. 24–25 | `CharacterSheet.classes[]` (sınıf + seviye), ilerleme ve slot birleştirme `rules/multiclass.ts`, oluşturucuda ön koşul (13 puan) |
| Diller | s. 20, 83 | `languages[]` geçmiş/tür kaynağından; savaşta Command/Suggestion "anlamalı" denetimi |
| Araçlar | s. 93–94 | TE99 `toolProfs` genişlet: alet kontrolü komutu (`tool_check`), Serüven sınavlarında |
| Zehirler | s. 199–200 | `data/zehirler.json` (14 örnek), `use.kind: coat` (Basic Poison yolu), hasat kontrolü savaş dışı |
| Tuzaklar | s. 196–199 | Harita `traps` şeması (algı/etkisizleştirme DC, tetik, etki); 8 örnek tuzak veriyle |
| Eşya yapımı | s. 203–204 | Serüven dükkânı + zaman modeli; tarif tablosu `data/yapim.json` |
| Influence eylemi / tutumlar | s. 10, 185 | NPC tutumu (Friendly/Indifferent/Hostile) yerleşim verisinde; Influence kontrolü Serüven olayı |
| Lanetli yaratıklar / lanetler | s. 203, canavarlar | `curse` etkisi kalıcı (savaş sonu karaktere), Remove Curse; likantropi bununla |
| Çevre tehlikeleri | s. 201–202 (Extreme Cold/Heat, Mental Stress) | Harita kuralı (`coldExposure` kalıbı) ve Serüven günlük kontrolü |
| High Elf cantrip değiştirme | s. 84 | Uzun dinlenmede soy cantrip seçimi (`characterRest.ts` + oluşturucu) |
| Human/Tiefling boyut seçimi | s. 84–86 | Oluşturucuda Small/Medium seçimi (`sheet.size`), jeton ölçeği yalnız görsel |
| Başlangıç donanımı seçimi | s. 21, sınıf tabloları | Sınıf/geçmiş A/B paketleri `data/baslangic-donanim.json`, sihirbazın donanım adımında |
