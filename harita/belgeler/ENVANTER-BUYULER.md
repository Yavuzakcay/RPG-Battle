# Envanter: büyüler

> A0 envanter denetimi (2026-11-05, dal `wip/a0`, kural sürümü 27). Salt-okunur: oyun kodu, veri ve testler değişmedi. Yoklama betikleri repo dışında çalıştırıldı (aşağıda "Yöntem").

## Yöntem

- **Veri:** `data/spells.json` (0–3), `data/spells-45.json`, `data/spells-69.json`: 339 kayıt; `mechanics.kind`, `offCombat`, `approx`, `gmNote`, `reaction`.
- **Savaş yoklaması:** her büyü düz 15×9 arenada (büyücü 20. seviye, bütün slotlar; düşman, insansı, hayvan, yaralı/ölmekte/ölü dost) 16 hedef biçimiyle `cast_spell` olarak yapıldı. Komut kabul edildi mi, savaşı değiştiren olay (hasar, save, etki, alan, çağırma, ışınlanma, iyileştirme, durum…) üretti mi.
- **Sınıflama:** savaş olayı + yaklaşıklık yok → ÇALIŞIR; olay var ama `approx`/Game Master notu → KISMİ; savaşta anlamlı ama olay yok ya da motor hatası → YOK; `offCombat` ve savaş anında etkisi yok → SAVAŞ DIŞI. Koşullu büyüler (smite, tür kısıtı, ritüel, ölmekte hedef) koşul sağlanınca kodda yolu olduğu için ÇALIŞIR sayıldı; tepki büyüleri tepki yolunda (`reactions.ts`) ÇALIŞIR.
- **Sınır:** yoklama "etki oluştu mu" sorusunu yanıtlar, sayıların SRD ile birebir doğruluğunu değil. Doğruluk için `docs/BUYU-DENETIMI*.md` ve testler.

## Özet

| Sınıf | Sayı |
|---|---|
| ÇALIŞIR | 151 |
| KISMİ | 74 |
| YOK | 21 |
| SAVAŞ DIŞI | 93 |
| **Toplam** | 339 |

### Tür × sınıf

| `mechanics.kind` | ÇALIŞIR | KISMİ | YOK | SAVAŞ DIŞI | Toplam |
|---|---|---|---|---|---|
| utility | 12 | 0 | 19 | 91 | 122 |
| effect | 40 | 35 | 0 | 0 | 75 |
| save | 51 | 16 | 1 | 0 | 68 |
| attack | 16 | 4 | 0 | 0 | 20 |
| zone | 5 | 8 | 0 | 0 | 13 |
| summon | 7 | 3 | 0 | 0 | 10 |
| buff | 4 | 2 | 0 | 0 | 6 |
| heal | 4 | 0 | 1 | 0 | 5 |
| smite | 3 | 1 | 0 | 0 | 4 |
| revive | 2 | 0 | 0 | 2 | 4 |
| teleport | 3 | 0 | 0 | 0 | 3 |
| auto | 1 | 2 | 0 | 0 | 3 |
| cure | 2 | 0 | 0 | 0 | 2 |
| dispel | 0 | 2 | 0 | 0 | 2 |
| mark | 1 | 1 | 0 | 0 | 2 |

`utility` (122): 91 SAVAŞ DIŞI, 19 YOK (savaşta anlamlı, karşılığı yok), 12 ÇALIŞIR (Time Stop, Power Word ailesi, Divine Word, Mass Heal, Prismatic Spray, Reverse Gravity, tepki büyüleri…).

## Motor hataları (yoklamada bulundu)

- **Heal (6):** `"damage": "70"` sabit iyileştirme `healDice` içinde `"0d1+70"` olur; `parseDice` istisna fırlatır. Büyü hiçbir hedefle yapılamıyor; arayüzde komut hata verir. İş: küçük (sabit değer yolu).
- **Eyebite (6):** hedef denetimi "yalnızca büyücüyü etkiler" (başkası) ve "kendini hedefleyemezsin" (kendi) birlikte; hiçbir hedef kabul edilmiyor. İş: küçük.

## İstenen büyüler tek tek

| Büyü | Sv | Tür | Sınıf | Neden |
|---|---|---|---|---|
| Counterspell | 3 | utility | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Shield | 1 | utility | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Feather Fall | 1 | utility | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Hellish Rebuke | 1 | save | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Time Stop | 9 | utility | ÇALIŞIR | olaylar: time_stop |
| Power Word Kill | 9 | utility | ÇALIŞIR | olaylar: map_effect |
| Power Word Stun | 8 | utility | ÇALIŞIR | olaylar: condition_changed |
| Power Word Heal | 9 | utility | ÇALIŞIR | olaylar: healed |
| Teleport | 7 | utility | YOK | savaşta anlamlı, motor karşılığı yok: savaştan kaçış ışınlanması yok (K53 teleport ile) |
| Prismatic Spray | 7 | utility | ÇALIŞIR | olaylar: map_effect |
| Reverse Gravity | 7 | utility | ÇALIŞIR | olaylar: map_effect, effect_added |
| Tsunami | 8 | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): 1 minute döküm: savaştan önce yapılır |
| Move Earth | 6 | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Toprağı şekillendirir (10 dakikada bir) |
| Divine Word | 7 | utility | ÇALIŞIR | olaylar: map_effect, effect_added |
| Mass Heal | 9 | utility | ÇALIŞIR | olaylar: healed |
| Raise Dead | 5 | utility | SAVAŞ DIŞI | 10 günden kısa süredir ölü yaratığı diriltir (1 saat) |
| Resurrection | 7 | revive | SAVAŞ DIŞI | komut çalışıyor ama savaş dışı (life_restored) |
| True Resurrection | 9 | revive | SAVAŞ DIŞI | komut çalışıyor ama savaş dışı (life_restored) |
| Wish | 9 | utility | ÇALIŞIR | koşullu: kopyalanacak büyü seçimi gerekir |
| Disguise Self | 1 | utility | YOK | savaşta anlamlı, motor karşılığı yok: görünüm değişimi (gizlenme) yok |
| Magic Circle | 3 | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Kurulumda (1 dakika): 10 ft yarıçaplı silindir; seçilen türler (Celest |
| Gate | 9 | utility | YOK | savaşta anlamlı, motor karşılığı yok: çağırma (portal) yok |
| Foresight | 9 | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): 1 minute döküm: savaştan önce yapılır |
| Heroes’ Feast | 6 | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Ziyafet (1 saat): 24 saat Poisoned ve Frightened bağışıklığı, +2d10 HP |
| Imprisonment | 9 | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): 1 minute döküm: savaştan önce yapılır |
| Heal | 6 | heal | YOK | MOTOR HATASI: "70" sabit iyileştirme "0d1+70" zar ifadesine dönüşüyor, execute istisna fırlatıyor (büyü yapılamıyor, arayüz hata verir) |
| Eyebite | 6 | save | YOK | MOTOR HATASI: "yalnızca büyücüyü etkiler" ve "kendini hedefleyemezsin" denetimleri çelişiyor; hiçbir hedefle yapılamıyor |
| Control Water | 4 | utility | YOK | savaşta anlamlı, motor karşılığı yok: veride savaş dışı; Kuyruk 19 girdap kodu var ama yapımda olay üretmedi |
| Glyph of Warding | 3 | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Kurulumda (1 saat): işaret tetiklenince patlar (20 ft küre, DEX save,  |
| Major Image | 3 | utility | YOK | savaşta anlamlı, motor karşılığı yok: yanılsama (örtü/dikkat dağıtma) yok |
| Dimension Door | 4 | teleport | ÇALIŞIR | olaylar: teleported |
| Misty Step | 2 | teleport | ÇALIŞIR | olaylar: teleported |
| Banishment | 4 | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Plane Shift | 7 | effect | KISMİ | yaklaşık: İstemsiz hedef: melee büyü saldırısı + CHA save; başka düzleme gider (savaş boyunca sürgün) |
| Etherealness | 7 | effect | ÇALIŞIR | olaylar: effect_added |
| Maze | 8 | effect | ÇALIŞIR | olaylar: effect_added |
| Forcecage | 7 | effect | ÇALIŞIR | olaylar: effect_added |
| Mirage Arcane | 7 | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Arazi yanılsaması (10 gün) |
| Simulacrum | 7 | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Kopya yaratık (12 saat döküm) |
| Contingency | 6 | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Koşula bağlı büyü saklar (10 gün) |

## Savaşta anlamlı ama YOK olanlar (yapım etki üretmiyor)

| Büyü | Sv | Neden | İş | Çözüm yolu |
|---|---|---|---|---|
| Arcane Lock | 2 | savaşta anlamlı, motor karşılığı yok: kapı kilitleme yok | küçük | nesne kilidi |
| Find Traps | 2 | savaşta anlamlı, motor karşılığı yok: tuzak bulma yok (tuzak sistemi var) | küçük | `trapsFound` (Arazi Okuma ile aynı yol) |
| Meld into Stone | 3 | savaşta anlamlı, motor karşılığı yok: taşa girip gizlenme yok | küçük | süren etki `sealed`/gizlenme |
| Knock | 2 | savaşta anlamlı, motor karşılığı yok: kilitli kapı/sandık açma yok (nesne kilidi var) | küçük | nesne kilidi `key` yolu (Kuyruk 36) |
| Minor Illusion | 0 | savaşta anlamlı, motor karşılığı yok: yanılsama örtüsü yok | küçük | K53 geçici engel (görüş keser, geçilir) |
| Disguise Self | 1 | savaşta anlamlı, motor karşılığı yok: görünüm değişimi (gizlenme) yok | küçük | gizlenme/hedefleme dışı (hikâye ağırlıklı) |
| Silent Image | 1 | savaşta anlamlı, motor karşılığı yok: yanılsama yok | orta | aynı |
| Major Image | 3 | savaşta anlamlı, motor karşılığı yok: yanılsama (örtü/dikkat dağıtma) yok | orta | K53 geçici engel `blocksSight` (görsel engel) + Investigation ile bozma |
| Goodberry | 1 | savaşta anlamlı, motor karşılığı yok: meyveyle bonus eylem iyileştirme yok | küçük | `consumables` + `use_item` (bonus eylem 1 HP) |
| Enthrall | 2 | savaşta anlamlı, motor karşılığı yok: Algı dezavantajı yok | küçük | süren etki `checkDis` Algı |
| Rope Trick | 2 | savaşta anlamlı, motor karşılığı yok: boyut cebine saklanma yok | küçük | süren etki: hedef alınamaz + harita dışı |
| Control Water | 4 | savaşta anlamlı, motor karşılığı yok: veride savaş dışı; Kuyruk 19 girdap kodu var ama yapımda olay üretmedi | orta | Kuyruk 19 girdap kodu var; veri `offCombat` ve hedefleme |
| Stone Shape | 4 | savaşta anlamlı, motor karşılığı yok: duvar/geçit şekillendirme yok | orta | K53 `gecicEngel`/`tile_changed` |
| Passwall | 5 | savaşta anlamlı, motor karşılığı yok: duvarda geçit açma yok (tile_changed ile) | orta | `tile_changed` geçit (K53 engel tersi) |
| Eyebite | 6 | MOTOR HATASI: "yalnızca büyücüyü etkiler" ve "kendini hedefleyemezsin" denetimleri çelişiyor; hiçbir hedefle y | küçük | hedef denetimi |
| Heal | 6 | MOTOR HATASI: "70" sabit iyileştirme "0d1+70" zar ifadesine dönüşüyor, execute istisna fırlatıyor (büyü yapıla | küçük | sabit iyileştirme yolu |
| Transport via Plants | 6 | savaşta anlamlı, motor karşılığı yok: ağaçtan ağaca geçiş yok | küçük | Tree Stride yolu (K53 teleport) |
| Word of Recall | 6 | savaşta anlamlı, motor karşılığı yok: kaçış ışınlanması yok | küçük | aynı |
| Project Image | 7 | savaşta anlamlı, motor karşılığı yok: yansıma yok | orta | çağrılmış dokunulamaz yansıma (R3 `intangible`) |
| Teleport | 7 | savaşta anlamlı, motor karşılığı yok: savaştan kaçış ışınlanması yok (K53 teleport ile) | küçük | K53 `teleport` + savaştan çıkış (Serüven kilitliyken savaş sonu "kaçtı") |
| Gate | 9 | savaşta anlamlı, motor karşılığı yok: çağırma (portal) yok | orta | R3 çağırma + K53 teleport |

## Savaş öncesi hazırlık (SAVAŞ DIŞI sayıldı, savaşa etkisi olur)

Bu büyüler 1 dakika+ yapım süresiyle savaştan önce yapılır; etkisi savaşta sürer. Find Familiar gibi kurulumda yapılabilirlerse anlam kazanır. İş: orta (kurulum ritüel yolu, Görev R3).

Antipathy/Sympathy, Contingency, Create Undead, Forbiddance, Foresight, Glyph of Warding, Guards and Wards, Hallow, Hallucinatory Terrain, Heroes’ Feast, Imprisonment, Magic Circle, Magic Jar, Mirage Arcane, Move Earth, Phantom Steed, Planar Ally, Planar Binding, Programmed Illusion, Regenerate, Simulacrum, Symbol, Tiny Hut, Tsunami, Wind Walk

## KISMİ olanlar (yaklaşık)

| Büyü | Sv | Tür | Neden |
|---|---|---|---|
| Produce Flame | 0 | attack | yaklaşık: SRD: alev bonus eylemle yaratılır, Magic eylemiyle 60 ft fırlatılır; oyunda yaratıp fırlatmak tek bonus eylem |
| Mage Armor | 1 | effect | yaklaşık: Hedefin zırh giyip giymediği denetlenmez (temel AC zaten yüksekse etkisiz) |
| Sleep | 1 | save | yaklaşık: İkinci başarısız save'de Unconscious (Görev WIZARD); hasar alınca uyanır; yanındakinin eylemle uyandırması yok |
| Chromatic Orb | 1 | attack | yaklaşık: Sıçrama: aynı iki hasar zarında 30 ft içindeki en yakın düşmana yeni saldırı, slot seviyesi kadar (hedef seçim |
| Charm Person | 1 | effect | yaklaşık: dostluk tutumu ve sosyal avantaj yok |
| Hideous Laughter | 1 | effect | yaklaşık: Prone kendi başına kaldırılamaz kuralı ayrıca denetlenmez (Incapacitated kalkmayı zaten engeller) |
| Command | 1 | effect | yaklaşık: Drop: elde tutulan bırakılmaz (silah bırakma modeli yok), yalnızca turunu kaybeder; Approach ve Flee yürüyüşte |
| Entangle | 1 | save | yaklaşık: Kurtulma eylemle STR (Athletics) kontrolüyle; bitki sarmaşığının bitişik altıgenlere yayılması yok |
| Faerie Fire | 1 | save | yaklaşık: Nesneler işaretlenmez; saldıranın hedefi görmesi ayrıca denetlenmez; ışık (10 ft) yalnızca karanlık/gece harit |
| Hex | 1 | mark | koşullu: etki konsantrasyonda (işaret); yaklaşık: Seçilen yeteneğin kontrollerinde dezavantaj yok (savaşta kontrol azdır |
| Mirror Image | 2 | effect | yaklaşık: Blindsight/Truesight ayrımı yok (yalnızca Blinded saldıran etkilenmez) |
| Blur | 2 | effect | yaklaşık: Blindsight/Truesight ile görenler için istisna yok |
| Invisibility | 2 | effect | yaklaşık: Saldırı ve büyüyle biter; saldırısız hasar verince (aura, alan) bitmez |
| Web | 2 | save | yaklaşık: Tutunma yeri kuralı (çökme) ve yanma yok; hafif örtünün oyunda etkisi yok |
| Darkness | 2 | zone | yaklaşık: Nesneye bağlı yürüyen karanlık yok; Blindsight/Truesight yok; Darkvision bu alanı göremez ve ışık aydınlatamaz |
| Flaming Sphere | 2 | summon | yaklaşık: Engellerin üstünden atlama ve ışık yok; çarpma yalnızca taşımanın sonunda bitişik yaratığa |
| Moonbeam | 2 | save | yaklaşık: Taşıma 60 ft yerine büyü menzili içinde bir yaratığın altıgenine; biçim değiştirenlere ek etki yok; silindir y |
| Heat Metal | 2 | auto | yaklaşık: Her yaratık metal taşıyor sayılır; silahı bırakma seçeneği yok, kontrol dezavantajı yok |
| Blindness/Deafness | 2 | save | yaklaşık: Seçim komutta (choice); arayüzde ve yapay zekâda Blinded. Deafened yalnızca sözlü buyrukları (Command, Suggest |
| Spike Growth | 2 | auto | yaklaşık: Gizlenmiş (fark edilmemiş) alan kuralı yok: herkes alanı görür |
| Haste | 3 | effect | yaklaşık: Ek eylem asıl eylemden sonra alınır; Utilize yok |
| Slow | 3 | effect | yaklaşık: 40 ft küp yerine seçilen hedefler; büyü yapmadaki gecikme (d20) yok |
| Fly | 3 | effect | yaklaşık: Yükseklik modeli yok: uçan yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c); uçuş bitince dü |
| Fear | 3 | save | yaklaşık: Tekrar save her tur sonunda (SRD: yalnızca büyücüyü göremezken); elindekini düşürme yok; kaçınca turu biter |
| Hypnotic Pattern | 3 | save | yaklaşık: Sarsarak uyandırma (eylemle) yok; hasarla ve konsantrasyonla biter |
| Stinking Cloud | 3 | save | yaklaşık: Eylem ve bonus eylem kaybı Incapacitated ile (tepki de gider); rüzgârla dağılma yok |
| Blink | 3 | effect | yaklaşık: Tur sonu d20 11+: sonraki turunun başına dek Ethereal (hedef alınamaz, alan ve saldırılardan etkilenmez); dönü |
| Bestow Curse | 3 | effect | yaklaşık: Dört seçenek: yetenek (seçilen yetenekte save dezavantajı; kontrol dezavantajı yok), lanetleyene saldırılar de |
| Dispel Magic | 3 | dispel | koşullu: dağıtılacak etki gerekir; yaklaşık: Yaratıktaki süren büyü etkileri, büyüyle çağrılmış yaratık, silahtaki  |
| Remove Curse | 3 | dispel | koşullu: lanet gerekir; yaklaşık: Yalnızca Bestow Curse etkisi kalkar (Hex büyücünün konsantrasyonunda k |
| Beacon of Hope | 3 | effect | yaklaşık: Hedef sayısı 6 (SRD: menzildeki istenen sayıda yaratık); en yüksek iyileştirme yalnızca büyü iyileştirmesinde |
| Call Lightning | 3 | save | yaklaşık: Fırtınada ek zar yok; tekrarın noktası bir yaratığın altıgeni |
| Conjure Animals | 3 | summon | yaklaşık: Sürü büyücüyle birlikte değil, sahibinin bonus eylemiyle 30 ft taşınır; büyücünün STR save avantajı yok; sürü  |
| Protection from Evil and Good | 1 | buff | koşullu: etki konsantrasyonda (ward); yaklaşık: Ele geçirme (possession) yok; zaten Charmed/Frightened olana yeni save |
| Magic Weapon | 2 | buff | yaklaşık: Büyücünün kendi silahlarına uygulanır |
| Levitate | 2 | effect | yaklaşık: Yükseklik modeli yok: havadaki yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c) ama yürüyeme |
| Animate Dead | 3 | summon | koşullu: ritüel: kurulumda; yaklaşık: Döküm süresi 1 dakika olduğu için yalnızca kurulumda; bonus eylemle ko |
| Mind Spike | 2 | save | yaklaşık: Hedefin yerini her zaman bilme (gizlenme/görünmezlik) yok |
| Ray of Enfeeblement | 2 | effect | yaklaşık: STR saldırısı yakın dövüş saldırısı sayılır (Finesse ve fırlatma ayrımı yok) |
| Ensnaring Strike | 1 | smite | yaklaşık: Kurtulma eylemle STR (Athletics) kontrolü yerine tur başı hasardan sonra STR save; yalnızca bu tur yakın dövüş |
| Enlarge/Reduce | 2 | effect | yaklaşık: Boyut yalnızca jeton etiketi (mekanik tek altıgen); STR kontrolleri ve nesneler yok |
| Gaseous Form | 3 | effect | yaklaşık: Yükseklik farkı maliyetini ve zemin engelini yok sayar (uçuş 10 ft; Görev K9c); dar aralıklardan geçme yok (ha |
| Gust of Wind | 2 | save | yaklaşık: Çizgide tur bitirene tekrar save ve hareket maliyeti yok; tekrar yeni bir esinti olarak |
| Fog Cloud | 1 | zone | yaklaşık: Rüzgârla dağılma yok |
| Silence | 2 | zone | yaklaşık: Tepki büyüleri (Shield, Counterspell) sessizlikte denetlenmez; Deafened durumu verilmez (Thunder bağışıklığı v |
| Plant Growth | 3 | zone | yaklaşık: Alandan bölge çıkarma yok; Enrichment (8 saat) savaşta yok |
| Sleet Storm | 3 | zone | yaklaşık: Silindir küre sayılır (yükseklik yok); alevlerin sönmesi yok |
| Wind Wall | 3 | zone | yaklaşık: Duvar düz ya da büyücünün çevresinde yay (serbest çizim yok); dev kayaları ayrımı yok; sis dağıtma yok |
| Calm Emotions | 2 | effect | yaklaşık: Dostlara save yok (isteyerek başarısız sayılır); var olan Charmed/Frightened bastırılmaz, kalkar; kayıtsızlık  |
| Phantasmal Force | 2 | effect | yaklaşık: Yanılsamanın biçimi ve konumu yok: her turda hasar verir; Study eylemiyle (Investigation) kurtulma yok |
| Suggestion | 2 | effect | yaklaşık: Öneri iki seçenekle: savaşı bırak (her turunu kaybeder) ya da uzaklaş (her tur kaçar); serbest metinli önerile |
| Light | 0 | effect | yaklaşık: Nesne yerine bir yaratık (büyücü ya da dost) taşır; yalnızca parlak ışık (20 ft = 4 altıgen), loş ışık ayrı de |
| Dancing Lights | 0 | zone | yaklaşık: Dört ışık yerine tek ışık noktası (çevresiyle 10 ft); taşıma bonus eylemle bir yaratığın altıgenine; insan biç |
| Continual Flame | 2 | effect | yaklaşık: Nesne yerine bir yaratık taşır; yalnızca parlak ışık (20 ft); süre savaş boyunca |
| Daylight | 3 | zone | yaklaşık: Nesneye bağlı yürüyen ışık yok; ek 60 ft loş ışık yok; gün ışığına duyarlı yaratık kuralları yok |
| Starry Wisp | 0 | attack | yaklaşık: Işık ve görünmezlik engeli sonraki turun sonuna dek (büyücünün sonraki turunun sonu yerine) |
| Flame Blade | 2 | attack | yaklaşık: Kılıç el boşluğu denetlenmez; bırakıp yeniden çağırma yok; saldırı "Büyüyü sürdür" (eylem) ile |
| See Invisibility | 2 | effect | yaklaşık: Ethereal Plane görüşü yok |
| Color Spray | 1 | save | yaklaşık: Kör kalma etkinin süresiyle (iki tur sınırı; büyücünün sonraki turunun sonu yerine) |
| Expeditious Retreat | 1 | effect | yaklaşık: Her turun bonus eylemle Dash'i yerine hız iki katı (bonus eylem harcanmaz) |
| Alter Self | 2 | effect | yaklaşık: Yalnızca Natural Weapons (hasar türü Bludgeoning kalır); Aquatic Adaptation ve Change Appearance savaş dışı (G |
| Dragon's Breath | 2 | save | yaklaşık: Nefesi dokunulan dost yerine büyücü verir; tür seçimi yapılırken (nefeste Fire); yukarı slot zarı uygulanmaz |
| Enhance Ability | 2 | effect | yaklaşık: Kontroller savaşta az (İt, Gizlen, kurtulma) |
| Protection from Poison | 2 | effect | yaklaşık: Poisoned'a karşı save avantajı yok |
| Sanctuary | 1 | effect | yaklaşık: Başarısız save'de saldırı ya da büyü boşa gider (yeni hedef seçme yok; büyü yuvası harcanmaz); alan etkileri v |
| Warding Bond | 2 | effect | yaklaşık: Hedefe +1 AC, +1 save, bütün hasar türlerine direnç; aldığı hasar kadar büyücüye (her komuttan sonra); büyücü  |
| Jump | 1 | effect | yaklaşık: Turda bir 30 ft düz atlama 10 ft (2 altıgen) harcar, aradaki tek engel altıgeninin (hendek, sütun) üstünden ge |
| Spider Climb | 2 | effect | yaklaşık: Yükseklik modeli yok: tırmanma hızı haritadaki yükseklik farkı maliyetini kaldırır (Görev K9c); duvar/tavanda  |
| Conjure Fey | 6 | save | yaklaşık: Fey ruhu ayrı yaratık değil: yapımda ve sonraki turlarda bonus eylemle bir düşmana büyü saldırısı (3d12 Psychi |
| Mass Suggestion | 6 | effect | yaklaşık: Öneri savaşta "dur" olarak |
| Plane Shift | 7 | effect | yaklaşık: İstemsiz hedef: melee büyü saldırısı + CHA save; başka düzleme gider (savaş boyunca sürgün) |
| Animal Shapes | 8 | effect | yaklaşık: Polymorph biçim olayıyla, istekli dostlar |
| Holy Aura | 8 | effect | yaklaşık: Fiend/Undead vurana CON save ya da Blinded yansıması yok |
| Meteor Swarm | 9 | save | yaklaşık: Dört 40 ft küre yerine bir küre (büyü tek hedef altıgeni alır); yapay zekâ en kalabalık noktayı seçer |

## Bütün büyüler

| Büyü | Sv | Dosya | Tür | Sınıf | Neden |
|---|---|---|---|---|---|
| Acid Splash | 0 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Chill Touch | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Dancing Lights | 0 | spells.json | zone | KISMİ | yaklaşık: Dört ışık yerine tek ışık noktası (çevresiyle 10 ft); taşıma bonus eylemle bir yaratığın altıgenine; insan biç |
| Druidcraft | 0 | spells.json | utility | SAVAŞ DIŞI | Hava tahmini, çiçek açtırma, duyusal etki; hasar ya da durum yok |
| Eldritch Blast | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Elementalism | 0 | spells.json | utility | SAVAŞ DIŞI | Seçilen küçük element etkisini uygula; hasar ya da durum yok |
| Fire Bolt | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Guidance | 0 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Light | 0 | spells.json | effect | KISMİ | yaklaşık: Nesne yerine bir yaratık (büyücü ya da dost) taşır; yalnızca parlak ışık (20 ft = 4 altıgen), loş ışık ayrı de |
| Mage Hand | 0 | spells.json | utility | SAVAŞ DIŞI | Hayali el 30 ft içinde nesne taşır (10 pound); saldıramaz, büyülü eşya etkinleştiremez |
| Mending | 0 | spells.json | utility | SAVAŞ DIŞI | Dokunulan nesnedeki tek kırık ya da yırtık onarılır (en çok 1 ft); büyülü eşyanın büyüsü g |
| Message | 0 | spells.json | utility | SAVAŞ DIŞI | Büyücü 120 ft içindeki bir yaratığa fısıltıyla ileti gönderir; yalnızca hedef duyar ve fıs |
| Minor Illusion | 0 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: yanılsama örtüsü yok |
| Poison Spray | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Prestidigitation | 0 | spells.json | utility | SAVAŞ DIŞI | Seçilen küçük etkiyi uygula; hasar ya da durum yok |
| Produce Flame | 0 | spells.json | attack | KISMİ | yaklaşık: SRD: alev bonus eylemle yaratılır, Magic eylemiyle 60 ft fırlatılır; oyunda yaratıp fırlatmak tek bonus eylem |
| Ray of Frost | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Resistance | 0 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Sacred Flame | 0 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Shillelagh | 0 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Shocking Grasp | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Sorcerous Burst | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Spare the Dying | 0 | spells.json | revive | ÇALIŞIR | olaylar: life_restored |
| Starry Wisp | 0 | spells.json | attack | KISMİ | yaklaşık: Işık ve görünmezlik engeli sonraki turun sonuna dek (büyücünün sonraki turunun sonu yerine) |
| Thaumaturgy | 0 | spells.json | utility | SAVAŞ DIŞI | Seçilen küçük etkiyi uygula; Booming Voice Intimidation avantajı verir |
| True Strike | 0 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Vicious Mockery | 0 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Alarm | 1 | spells.json | utility | SAVAŞ DIŞI | Kurulumda: 20 ft küp alana 8 saatlik alarm; büyücünün belirlemediği yaratık girerse zihins |
| Animal Friendship | 1 | spells.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Bane | 1 | spells.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Bless | 1 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Burning Hands | 1 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Charm Person | 1 | spells.json | effect | KISMİ | yaklaşık: dostluk tutumu ve sosyal avantaj yok |
| Chromatic Orb | 1 | spells.json | attack | KISMİ | yaklaşık: Sıçrama: aynı iki hasar zarında 30 ft içindeki en yakın düşmana yeni saldırı, slot seviyesi kadar (hedef seçim |
| Color Spray | 1 | spells.json | save | KISMİ | yaklaşık: Kör kalma etkinin süresiyle (iki tur sınırı; büyücünün sonraki turunun sonu yerine) |
| Command | 1 | spells.json | effect | KISMİ | yaklaşık: Drop: elde tutulan bırakılmaz (silah bırakma modeli yok), yalnızca turunu kaybeder; Approach ve Flee yürüyüşte |
| Comprehend Languages | 1 | spells.json | utility | SAVAŞ DIŞI | Duyduğu ve dokunduğu yazıdaki dilleri anlar (1 saat) |
| Create or Destroy Water | 1 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 10 galon su yaratır (ya da yağmur) veya 30 ft küpteki açık suyu ya da sisi yok |
| Cure Wounds | 1 | spells.json | heal | ÇALIŞIR | olaylar: healed |
| Detect Evil and Good | 1 | spells.json | utility | SAVAŞ DIŞI | 30 ft içindeki bu türlerin yerini ve türünü oyunculara söyle |
| Detect Magic | 1 | spells.json | utility | SAVAŞ DIŞI | 30 ft içindeki büyülü yaratık ve nesneleri ve okullarını oyunculara söyle |
| Detect Poison and Disease | 1 | spells.json | utility | SAVAŞ DIŞI | 30 ft içindeki zehir, zehirli yaratık ve hastalıkları söyle |
| Disguise Self | 1 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: görünüm değişimi (gizlenme) yok |
| Dissonant Whispers | 1 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Divine Favor | 1 | spells.json | buff | ÇALIŞIR | olaylar: buff_added |
| Divine Smite | 1 | spells.json | smite | ÇALIŞIR | olaylar: attack_resolved |
| Ensnaring Strike | 1 | spells.json | smite | KISMİ | yaklaşık: Kurtulma eylemle STR (Athletics) kontrolü yerine tur başı hasardan sonra STR save; yalnızca bu tur yakın dövüş |
| Entangle | 1 | spells.json | save | KISMİ | yaklaşık: Kurtulma eylemle STR (Athletics) kontrolüyle; bitki sarmaşığının bitişik altıgenlere yayılması yok |
| Expeditious Retreat | 1 | spells.json | effect | KISMİ | yaklaşık: Her turun bonus eylemle Dash'i yerine hız iki katı (bonus eylem harcanmaz) |
| Faerie Fire | 1 | spells.json | save | KISMİ | yaklaşık: Nesneler işaretlenmez; saldıranın hedefi görmesi ayrıca denetlenmez; ışık (10 ft) yalnızca karanlık/gece harit |
| False Life | 1 | spells.json | effect | ÇALIŞIR | olaylar: temp_hp |
| Feather Fall | 1 | spells.json | utility | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Find Familiar | 1 | spells.json | summon | ÇALIŞIR | koşullu: ritüel: kurulumda |
| Floating Disk | 1 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 500 pound taşıyan disk büyücüyü izler |
| Fog Cloud | 1 | spells.json | zone | KISMİ | yaklaşık: Rüzgârla dağılma yok |
| Goodberry | 1 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: meyveyle bonus eylem iyileştirme yok |
| Grease | 1 | spells.json | zone | ÇALIŞIR | olaylar: zone_created, save_resolved |
| Guiding Bolt | 1 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Healing Word | 1 | spells.json | heal | ÇALIŞIR | olaylar: healed |
| Hellish Rebuke | 1 | spells.json | save | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Heroism | 1 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Hex | 1 | spells.json | mark | KISMİ | koşullu: etki konsantrasyonda (işaret); yaklaşık: Seçilen yeteneğin kontrollerinde dezavantaj yok (savaşta kontrol azdır |
| Hideous Laughter | 1 | spells.json | effect | KISMİ | yaklaşık: Prone kendi başına kaldırılamaz kuralı ayrıca denetlenmez (Incapacitated kalkmayı zaten engeller) |
| Hunter's Mark | 1 | spells.json | mark | ÇALIŞIR | koşullu: etki konsantrasyonda (işaret) |
| Ice Knife | 1 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved, save_resolved |
| Identify | 1 | spells.json | utility | SAVAŞ DIŞI | Dokunulan büyülü eşyanın özellikleri, kullanımı, uyum gerekip gerekmediği ve üzerindeki bü |
| Illusory Script | 1 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: yalnızca belirlenen yaratıkların okuyabildiği gizli yazı (10 gün); diğerleri a |
| Inflict Wounds | 1 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Jump | 1 | spells.json | effect | KISMİ | yaklaşık: Turda bir 30 ft düz atlama 10 ft (2 altıgen) harcar, aradaki tek engel altıgeninin (hendek, sütun) üstünden ge |
| Longstrider | 1 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Mage Armor | 1 | spells.json | effect | KISMİ | yaklaşık: Hedefin zırh giyip giymediği denetlenmez (temel AC zaten yüksekse etkisiz) |
| Magic Missile | 1 | spells.json | auto | ÇALIŞIR | olaylar: attack_resolved |
| Protection from Evil and Good | 1 | spells.json | buff | KISMİ | koşullu: etki konsantrasyonda (ward); yaklaşık: Ele geçirme (possession) yok; zaten Charmed/Frightened olana yeni save |
| Purify Food and Drink | 1 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 5 ft küredeki yiyecek ve içecek zehirsiz olur |
| Ray of Sickness | 1 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Sanctuary | 1 | spells.json | effect | KISMİ | yaklaşık: Başarısız save'de saldırı ya da büyü boşa gider (yeni hedef seçme yok; büyü yuvası harcanmaz); alan etkileri v |
| Searing Smite | 1 | spells.json | smite | ÇALIŞIR | olaylar: attack_resolved, effect_added |
| Shield | 1 | spells.json | utility | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Shield of Faith | 1 | spells.json | buff | ÇALIŞIR | koşullu: etki konsantrasyonda (ward) |
| Silent Image | 1 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: yanılsama yok |
| Sleep | 1 | spells.json | save | KISMİ | yaklaşık: İkinci başarısız save'de Unconscious (Görev WIZARD); hasar alınca uyanır; yanındakinin eylemle uyandırması yok |
| Speak with Animals | 1 | spells.json | utility | SAVAŞ DIŞI | Beast'lerle konuşma (10 dakika) |
| Thunderwave | 1 | spells.json | save | ÇALIŞIR | olaylar: save_resolved, pushed |
| Unseen Servant | 1 | spells.json | utility | SAVAŞ DIŞI | Hizmetkâr basit işler yapar; saldıramaz |
| Acid Arrow | 2 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved, effect_added |
| Aid | 2 | spells.json | effect | ÇALIŞIR | olaylar: hp_boosted |
| Alter Self | 2 | spells.json | effect | KISMİ | yaklaşık: Yalnızca Natural Weapons (hasar türü Bludgeoning kalır); Aquatic Adaptation ve Change Appearance savaş dışı (G |
| Animal Messenger | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: Tiny Beast ileti taşır |
| Arcane Lock | 2 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: kapı kilitleme yok |
| Arcanist's Magic Aura | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: algılama büyülerini yanıltır |
| Augury | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 30 dakika içindeki bir eylem için iyi, kötü, iyi ve kötü ya da hiçbiri yanıtın |
| Barkskin | 2 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Blindness/Deafness | 2 | spells.json | save | KISMİ | yaklaşık: Seçim komutta (choice); arayüzde ve yapay zekâda Blinded. Deafened yalnızca sözlü buyrukları (Command, Suggest |
| Blur | 2 | spells.json | effect | KISMİ | yaklaşık: Blindsight/Truesight ile görenler için istisna yok |
| Calm Emotions | 2 | spells.json | effect | KISMİ | yaklaşık: Dostlara save yok (isteyerek başarısız sayılır); var olan Charmed/Frightened bastırılmaz, kalkar; kayıtsızlık  |
| Continual Flame | 2 | spells.json | effect | KISMİ | yaklaşık: Nesne yerine bir yaratık taşır; yalnızca parlak ışık (20 ft); süre savaş boyunca |
| Darkness | 2 | spells.json | zone | KISMİ | yaklaşık: Nesneye bağlı yürüyen karanlık yok; Blindsight/Truesight yok; Darkvision bu alanı göremez ve ışık aydınlatamaz |
| Darkvision | 2 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Detect Thoughts | 2 | spells.json | utility | SAVAŞ DIŞI | Seçilen yaratığın yüzeysel düşüncelerini söyle; derin sondada WIS save |
| Dragon's Breath | 2 | spells.json | save | KISMİ | yaklaşık: Nefesi dokunulan dost yerine büyücü verir; tür seçimi yapılırken (nefeste Fire); yukarı slot zarı uygulanmaz |
| Enhance Ability | 2 | spells.json | effect | KISMİ | yaklaşık: Kontroller savaşta az (İt, Gizlen, kurtulma) |
| Enlarge/Reduce | 2 | spells.json | effect | KISMİ | yaklaşık: Boyut yalnızca jeton etiketi (mekanik tek altıgen); STR kontrolleri ve nesneler yok |
| Enthrall | 2 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: Algı dezavantajı yok |
| Find Steed | 2 | spells.json | summon | ÇALIŞIR | olaylar: summoned |
| Find Traps | 2 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: tuzak bulma yok (tuzak sistemi var) |
| Flame Blade | 2 | spells.json | attack | KISMİ | yaklaşık: Kılıç el boşluğu denetlenmez; bırakıp yeniden çağırma yok; saldırı "Büyüyü sürdür" (eylem) ile |
| Flaming Sphere | 2 | spells.json | summon | KISMİ | yaklaşık: Engellerin üstünden atlama ve ışık yok; çarpma yalnızca taşımanın sonunda bitişik yaratığa |
| Gentle Repose | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: ceset bozulmaz, dirilme süresi uzar |
| Gust of Wind | 2 | spells.json | save | KISMİ | yaklaşık: Çizgide tur bitirene tekrar save ve hareket maliyeti yok; tekrar yeni bir esinti olarak |
| Heat Metal | 2 | spells.json | auto | KISMİ | yaklaşık: Her yaratık metal taşıyor sayılır; silahı bırakma seçeneği yok, kontrol dezavantajı yok |
| Hold Person | 2 | spells.json | save | ÇALIŞIR | olaylar: save_resolved, condition_changed |
| Invisibility | 2 | spells.json | effect | KISMİ | yaklaşık: Saldırı ve büyüyle biter; saldırısız hasar verince (aura, alan) bitmez |
| Knock | 2 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: kilitli kapı/sandık açma yok (nesne kilidi var) |
| Lesser Restoration | 2 | spells.json | cure | ÇALIŞIR | olaylar: condition_changed |
| Levitate | 2 | spells.json | effect | KISMİ | yaklaşık: Yükseklik modeli yok: havadaki yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c) ama yürüyeme |
| Locate Animals or Plants | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 5 mil içindeki en yakın türün yönü ve uzaklığı |
| Locate Object | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 1000 ft içindeki nesnenin yönü |
| Magic Mouth | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: nesneye 25 sözcüklük bir ileti bağlanır; belirlenen tetik gerçekleşince söylen |
| Magic Weapon | 2 | spells.json | buff | KISMİ | yaklaşık: Büyücünün kendi silahlarına uygulanır |
| Mind Spike | 2 | spells.json | save | KISMİ | yaklaşık: Hedefin yerini her zaman bilme (gizlenme/görünmezlik) yok |
| Mirror Image | 2 | spells.json | effect | KISMİ | yaklaşık: Blindsight/Truesight ayrımı yok (yalnızca Blinded saldıran etkilenmez) |
| Misty Step | 2 | spells.json | teleport | ÇALIŞIR | olaylar: teleported |
| Moonbeam | 2 | spells.json | save | KISMİ | yaklaşık: Taşıma 60 ft yerine büyü menzili içinde bir yaratığın altıgenine; biçim değiştirenlere ek etki yok; silindir y |
| Pass without Trace | 2 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Phantasmal Force | 2 | spells.json | effect | KISMİ | yaklaşık: Yanılsamanın biçimi ve konumu yok: her turda hasar verir; Study eylemiyle (Investigation) kurtulma yok |
| Prayer of Healing | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı (10 dakika): en çok 5 dost kısa dinlenme etkisi alır ve 2d8 + büyü değiştiricis |
| Protection from Poison | 2 | spells.json | effect | KISMİ | yaklaşık: Poisoned'a karşı save avantajı yok |
| Ray of Enfeeblement | 2 | spells.json | effect | KISMİ | yaklaşık: STR saldırısı yakın dövüş saldırısı sayılır (Finesse ve fırlatma ayrımı yok) |
| Rope Trick | 2 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: boyut cebine saklanma yok |
| Scorching Ray | 2 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| See Invisibility | 2 | spells.json | effect | KISMİ | yaklaşık: Ethereal Plane görüşü yok |
| Shatter | 2 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Shining Smite | 2 | spells.json | smite | ÇALIŞIR | olaylar: attack_resolved |
| Silence | 2 | spells.json | zone | KISMİ | yaklaşık: Tepki büyüleri (Shield, Counterspell) sessizlikte denetlenmez; Deafened durumu verilmez (Thunder bağışıklığı v |
| Spider Climb | 2 | spells.json | effect | KISMİ | yaklaşık: Yükseklik modeli yok: tırmanma hızı haritadaki yükseklik farkı maliyetini kaldırır (Görev K9c); duvar/tavanda  |
| Spike Growth | 2 | spells.json | auto | KISMİ | yaklaşık: Gizlenmiş (fark edilmemiş) alan kuralı yok: herkes alanı görür |
| Spiritual Weapon | 2 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Suggestion | 2 | spells.json | effect | KISMİ | yaklaşık: Öneri iki seçenekle: savaşı bırak (her turunu kaybeder) ya da uzaklaş (her tur kaçar); serbest metinli önerile |
| Warding Bond | 2 | spells.json | effect | KISMİ | yaklaşık: Hedefe +1 AC, +1 save, bütün hasar türlerine direnç; aldığı hasar kadar büyücüye (her komuttan sonra); büyücü  |
| Web | 2 | spells.json | save | KISMİ | yaklaşık: Tutunma yeri kuralı (çökme) ve yanma yok; hafif örtünün oyunda etkisi yok |
| Zone of Truth | 2 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 15 ft yarıçaplı alanda CHA save başarısız olan yaratık bile bile yalan söyleye |
| Animate Dead | 3 | spells.json | summon | KISMİ | koşullu: ritüel: kurulumda; yaklaşık: Döküm süresi 1 dakika olduğu için yalnızca kurulumda; bonus eylemle ko |
| Beacon of Hope | 3 | spells.json | effect | KISMİ | yaklaşık: Hedef sayısı 6 (SRD: menzildeki istenen sayıda yaratık); en yüksek iyileştirme yalnızca büyü iyileştirmesinde |
| Bestow Curse | 3 | spells.json | effect | KISMİ | yaklaşık: Dört seçenek: yetenek (seçilen yetenekte save dezavantajı; kontrol dezavantajı yok), lanetleyene saldırılar de |
| Blink | 3 | spells.json | effect | KISMİ | yaklaşık: Tur sonu d20 11+: sonraki turunun başına dek Ethereal (hedef alınamaz, alan ve saldırılardan etkilenmez); dönü |
| Call Lightning | 3 | spells.json | save | KISMİ | yaklaşık: Fırtınada ek zar yok; tekrarın noktası bir yaratığın altıgeni |
| Clairvoyance | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 1 mil içinde bilinen bir yerde görünmez göz ya da kulak (10 dakika, konsantras |
| Conjure Animals | 3 | spells.json | summon | KISMİ | yaklaşık: Sürü büyücüyle birlikte değil, sahibinin bonus eylemiyle 30 ft taşınır; büyücünün STR save avantajı yok; sürü  |
| Counterspell | 3 | spells.json | utility | ÇALIŞIR | tepki yolu (reactions.ts, `mechanics.reaction`); eylemle yapılınca etkisiz |
| Create Food and Water | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 45 pound yiyecek ve 30 galon su |
| Daylight | 3 | spells.json | zone | KISMİ | yaklaşık: Nesneye bağlı yürüyen ışık yok; ek 60 ft loş ışık yok; gün ışığına duyarlı yaratık kuralları yok |
| Dispel Magic | 3 | spells.json | dispel | KISMİ | koşullu: dağıtılacak etki gerekir; yaklaşık: Yaratıktaki süren büyü etkileri, büyüyle çağrılmış yaratık, silahtaki  |
| Fear | 3 | spells.json | save | KISMİ | yaklaşık: Tekrar save her tur sonunda (SRD: yalnızca büyücüyü göremezken); elindekini düşürme yok; kaçınca turu biter |
| Fireball | 3 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Fly | 3 | spells.json | effect | KISMİ | yaklaşık: Yükseklik modeli yok: uçan yükseklik farkı maliyetini ve zemin engelini yok sayar (Görev K9c); uçuş bitince dü |
| Gaseous Form | 3 | spells.json | effect | KISMİ | yaklaşık: Yükseklik farkı maliyetini ve zemin engelini yok sayar (uçuş 10 ft; Görev K9c); dar aralıklardan geçme yok (ha |
| Glyph of Warding | 3 | spells.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Kurulumda (1 saat): işaret tetiklenince patlar (20 ft küre, DEX save,  |
| Haste | 3 | spells.json | effect | KISMİ | yaklaşık: Ek eylem asıl eylemden sonra alınır; Utilize yok |
| Hypnotic Pattern | 3 | spells.json | save | KISMİ | yaklaşık: Sarsarak uyandırma (eylemle) yok; hasarla ve konsantrasyonla biter |
| Lightning Bolt | 3 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Magic Circle | 3 | spells.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Kurulumda (1 dakika): 10 ft yarıçaplı silindir; seçilen türler (Celest |
| Major Image | 3 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: yanılsama (örtü/dikkat dağıtma) yok |
| Mass Healing Word | 3 | spells.json | heal | ÇALIŞIR | olaylar: healed |
| Meld into Stone | 3 | spells.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: taşa girip gizlenme yok |
| Nondetection | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: hedef 8 saat kehanet büyüleri ve büyülü gözetleme sensörleriyle algılanamaz. |
| Phantom Steed | 3 | spells.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Savaş dışı (1 dakika): yolculuk için hayalet at (1 saat, hız 100 ft);  |
| Plant Growth | 3 | spells.json | zone | KISMİ | yaklaşık: Alandan bölge çıkarma yok; Enrichment (8 saat) savaşta yok |
| Protection from Energy | 3 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Remove Curse | 3 | spells.json | dispel | KISMİ | koşullu: lanet gerekir; yaklaşık: Yalnızca Bestow Curse etkisi kalkar (Hex büyücünün konsantrasyonunda k |
| Revivify | 3 | spells.json | revive | ÇALIŞIR | olaylar: life_restored |
| Sending | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: ileti ve 25 sözcüklük yanıt |
| Sleet Storm | 3 | spells.json | zone | KISMİ | yaklaşık: Silindir küre sayılır (yükseklik yok); alevlerin sönmesi yok |
| Slow | 3 | spells.json | effect | KISMİ | yaklaşık: 40 ft küp yerine seçilen hedefler; büyü yapmadaki gecikme (d20) yok |
| Speak with Dead | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: cesede 5 soru |
| Speak with Plants | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: 30 ft içindeki bitkiler büyücüyle konuşur ve sınırlı bilgi verir; bitkisel zor |
| Spirit Guardians | 3 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Stinking Cloud | 3 | spells.json | save | KISMİ | yaklaşık: Eylem ve bonus eylem kaybı Incapacitated ile (tepki de gider); rüzgârla dağılma yok |
| Tiny Hut | 3 | spells.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Savaş dışı (1 dakika, ritüel): 10 ft kubbe 8 saat; dışarıdaki yaratık  |
| Tongues | 3 | spells.json | utility | SAVAŞ DIŞI | Savaş dışı: her dili anlar ve konuşur (1 saat) |
| Vampiric Touch | 3 | spells.json | attack | ÇALIŞIR | olaylar: attack_resolved, healed |
| Water Breathing | 3 | spells.json | utility | SAVAŞ DIŞI | Su altında nefes alma (24 saat); haritada derin su kuralları değişmez |
| Water Walk | 3 | spells.json | effect | ÇALIŞIR | olaylar: effect_added |
| Wind Wall | 3 | spells.json | zone | KISMİ | yaklaşık: Duvar düz ya da büyücünün çevresinde yay (serbest çizim yok); dev kayaları ayrımı yok; sis dağıtma yok |
| Arcane Eye | 4 | spells-45.json | utility | SAVAŞ DIŞI | Görünmez göz 30 ft karanlık görüşle keşif (1 saat) |
| Aura of Life | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Banishment | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Black Tentacles | 4 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created, zone_triggered, save_resolved, effect_added |
| Blight | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved |
| Charm Monster | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Compulsion | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Confusion | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Conjure Minor Elementals | 4 | spells-45.json | buff | ÇALIŞIR | olaylar: buff_added, zone_created |
| Conjure Woodland Beings | 4 | spells-45.json | save | ÇALIŞIR | olaylar: effect_added, save_resolved |
| Control Water | 4 | spells-45.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: veride savaş dışı; Kuyruk 19 girdap kodu var ama yapımda olay üretmedi |
| Death Ward | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Dimension Door | 4 | spells-45.json | teleport | ÇALIŞIR | olaylar: teleported |
| Divination | 4 | spells-45.json | utility | SAVAŞ DIŞI | Bir hedef/olay hakkında doğru bir cevap (ritüel) |
| Dominate Beast | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Fabricate | 4 | spells-45.json | utility | SAVAŞ DIŞI | Ham maddeden nesne (10 dakika) |
| Faithful Hound | 4 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created |
| Fire Shield | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Freedom of Movement | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Giant Insect | 4 | spells-45.json | summon | ÇALIŞIR | olaylar: summoned |
| Greater Invisibility | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Guardian of Faith | 4 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created |
| Hallucinatory Terrain | 4 | spells-45.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): 150 ft küp arazi yanılsaması (24 saat) |
| Ice Storm | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, zone_created |
| Locate Creature | 4 | spells-45.json | utility | SAVAŞ DIŞI | 1000 ft içinde tanıdık yaratığın yönü (1 saat) |
| Phantasmal Killer | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Polymorph | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added, shape_changed, temp_hp |
| Private Sanctum | 4 | spells-45.json | utility | SAVAŞ DIŞI | 100 ft küp korunaklı alan (24 saat) |
| Resilient Sphere | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Secret Chest | 4 | spells-45.json | utility | SAVAŞ DIŞI | Sandığı Ethereal Plane'de saklar |
| Stone Shape | 4 | spells-45.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: duvar/geçit şekillendirme yok |
| Stoneskin | 4 | spells-45.json | effect | ÇALIŞIR | olaylar: effect_added |
| Vitriolic Sphere | 4 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Wall of Fire | 4 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created, zone_triggered, save_resolved |
| Animate Objects | 5 | spells-45.json | summon | ÇALIŞIR | olaylar: summoned |
| Antilife Shell | 5 | spells-45.json | zone | ÇALIŞIR | olaylar: zone_created |
| Arcane Hand | 5 | spells-45.json | summon | ÇALIŞIR | olaylar: summoned |
| Awaken | 5 | spells-45.json | utility | SAVAŞ DIŞI | Bitki ya da hayvana zekâ verir (8 saat) |
| Cloudkill | 5 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created, zone_triggered, save_resolved |
| Commune | 5 | spells-45.json | utility | SAVAŞ DIŞI | Tanrıya üç evet/hayır sorusu (ritüel) |
| Commune with Nature | 5 | spells-45.json | utility | SAVAŞ DIŞI | Çevredeki arazi bilgisi (ritüel) |
| Cone of Cold | 5 | spells.json | save | ÇALIŞIR | olaylar: save_resolved |
| Conjure Elemental | 5 | spells-45.json | summon | ÇALIŞIR | olaylar: summoned, zone_created |
| Contact Other Plane | 5 | spells-45.json | utility | SAVAŞ DIŞI | Başka düzlemden beş soru (ritüel; INT save) |
| Contagion | 5 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Creation | 5 | spells-45.json | utility | SAVAŞ DIŞI | Gölge maddesinden nesne (1 dakika) |
| Dispel Evil and Good | 5 | spells-45.json | buff | ÇALIŞIR | koşullu: etki konsantrasyonda (ward) |
| Dominate Person | 5 | spells-45.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Dream | 5 | spells-45.json | utility | SAVAŞ DIŞI | Uykudaki hedefe rüya mesajı |
| Flame Strike | 5 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved |
| Geas | 5 | spells-45.json | utility | SAVAŞ DIŞI | Hedefe uzun süreli emir (30 gün) |
| Greater Restoration | 5 | spells-45.json | cure | ÇALIŞIR | olaylar: exhaustion_changed |
| Hallow | 5 | spells-45.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Kutsal alan (24 saat) |
| Hold Monster | 5 | spells-45.json | save | ÇALIŞIR | olaylar: save_resolved, condition_changed |
| Insect Plague | 5 | spells-45.json | save | ÇALIŞIR | olaylar: zone_created, zone_triggered, save_resolved |
| Legend Lore | 5 | spells-45.json | utility | SAVAŞ DIŞI | Efsane bilgisi |
| Mass Cure Wounds | 5 | spells-45.json | heal | ÇALIŞIR | olaylar: healed |
| Mislead | 5 | spells-45.json | effect | ÇALIŞIR | olaylar: zone_created, effect_added |
| Modify Memory | 5 | spells-45.json | utility | SAVAŞ DIŞI | komut çalışıyor ama savaş dışı (save_resolved, effect_added) |
| Passwall | 5 | spells-45.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: duvarda geçit açma yok (tile_changed ile) |
| Planar Binding | 5 | spells-45.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Çağrılan yaratığı hizmete bağlar |
| Raise Dead | 5 | spells-45.json | utility | SAVAŞ DIŞI | 10 günden kısa süredir ölü yaratığı diriltir (1 saat) |
| Reincarnate | 5 | spells-45.json | utility | SAVAŞ DIŞI | Ölüyü yeni bedende diriltir (1 saat) |
| Scrying | 5 | spells-45.json | utility | SAVAŞ DIŞI | Uzaktaki hedefi gözetler (10 dakika) |
| Seeming | 5 | spells-45.json | utility | SAVAŞ DIŞI | Yaratıkların görünüşünü değiştirir (8 saat) |
| Summon Dragon | 5 | spells.json | summon | ÇALIŞIR | olaylar: summoned |
| Telekinesis | 5 | spells-45.json | save | ÇALIŞIR | olaylar: pushed, effect_added |
| Telepathic Bond | 5 | spells-45.json | utility | SAVAŞ DIŞI | Sekiz yaratık arası telepati (ritüel) |
| Teleportation Circle | 5 | spells-45.json | utility | SAVAŞ DIŞI | Kalıcı çembere ışınlanma (1 dakika) |
| Tree Stride | 5 | spells-45.json | teleport | ÇALIŞIR | koşullu: ağaç yanı gerekir |
| Wall of Force | 5 | spells-45.json | zone | ÇALIŞIR | olaylar: zone_created, pushed |
| Wall of Stone | 5 | spells-45.json | zone | ÇALIŞIR | olaylar: zone_created, pushed |
| Blade Barrier | 6 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Chain Lightning | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Circle of Death | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Conjure Fey | 6 | spells-69.json | save | KISMİ | yaklaşık: Fey ruhu ayrı yaratık değil: yapımda ve sonraki turlarda bonus eylemle bir düşmana büyü saldırısı (3d12 Psychi |
| Contingency | 6 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Koşula bağlı büyü saklar (10 gün) |
| Create Undead | 6 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Geceleyin cesetlerden Ghoul yaratır (1 dakika döküm) |
| Disintegrate | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Eyebite | 6 | spells-69.json | save | YOK | MOTOR HATASI: "yalnızca büyücüyü etkiler" ve "kendini hedefleyemezsin" denetimleri çelişiyor; hiçbir hedefle yapılamıyor |
| Find the Path | 6 | spells-69.json | utility | SAVAŞ DIŞI | Bir yere en kısa yolu sezer (1 gün) |
| Flesh to Stone | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Forbiddance | 6 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Bölgeye ışınlanmayı yasaklar (1 gün) |
| Freezing Sphere | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Globe of Invulnerability | 6 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Guards and Wards | 6 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Bir yapıyı korur (24 saat) |
| Harm | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved, max_hp_drained |
| Heal | 6 | spells-69.json | heal | YOK | MOTOR HATASI: "70" sabit iyileştirme "0d1+70" zar ifadesine dönüşüyor, execute istisna fırlatıyor (büyü yapılamıyor, arayüz hata verir) |
| Heroes’ Feast | 6 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Ziyafet (1 saat): 24 saat Poisoned ve Frightened bağışıklığı, +2d10 HP |
| Instant Summons | 6 | spells-69.json | utility | SAVAŞ DIŞI | Nesneyi çağırır |
| Irresistible Dance | 6 | spells-69.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Magic Jar | 6 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Ruh kaba geçer (savaş dışı hazırlık) |
| Mass Suggestion | 6 | spells-69.json | effect | KISMİ | yaklaşık: Öneri savaşta "dur" olarak |
| Move Earth | 6 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Toprağı şekillendirir (10 dakikada bir) |
| Planar Ally | 6 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Varlıktan yardım ister (pazarlık) |
| Programmed Illusion | 6 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Tetiklenen yanılsama |
| Sunbeam | 6 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Transport via Plants | 6 | spells-69.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: ağaçtan ağaca geçiş yok |
| True Seeing | 6 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Wall of Ice | 6 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created, pushed |
| Wall of Thorns | 6 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Wind Walk | 6 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Bulut biçiminde yolculuk (8 saat) |
| Word of Recall | 6 | spells-69.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: kaçış ışınlanması yok |
| Arcane Sword | 7 | spells-69.json | attack | ÇALIŞIR | olaylar: attack_resolved |
| Conjure Celestial | 7 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Delayed Blast Fireball | 7 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Divine Word | 7 | spells-69.json | utility | ÇALIŞIR | olaylar: map_effect, effect_added |
| Etherealness | 7 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Finger of Death | 7 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Fire Storm | 7 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Forcecage | 7 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Magnificent Mansion | 7 | spells-69.json | utility | SAVAŞ DIŞI | Boyut ötesi konak (24 saat) |
| Mirage Arcane | 7 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Arazi yanılsaması (10 gün) |
| Plane Shift | 7 | spells-69.json | effect | KISMİ | yaklaşık: İstemsiz hedef: melee büyü saldırısı + CHA save; başka düzleme gider (savaş boyunca sürgün) |
| Prismatic Spray | 7 | spells-69.json | utility | ÇALIŞIR | olaylar: map_effect |
| Project Image | 7 | spells-69.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: yansıma yok |
| Regenerate | 7 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): 1 minute döküm: savaştan önce yapılır |
| Resurrection | 7 | spells-69.json | revive | SAVAŞ DIŞI | komut çalışıyor ama savaş dışı (life_restored) |
| Reverse Gravity | 7 | spells-69.json | utility | ÇALIŞIR | olaylar: map_effect, effect_added |
| Sequester | 7 | spells-69.json | utility | SAVAŞ DIŞI | Nesne/istekli yaratık saklanır |
| Simulacrum | 7 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Kopya yaratık (12 saat döküm) |
| Symbol | 7 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Tetiklenen glif (1 dakika döküm; tuzak olarak Game Master yerleştirir) |
| Teleport | 7 | spells-69.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: savaştan kaçış ışınlanması yok (K53 teleport ile) |
| Animal Shapes | 8 | spells-69.json | effect | KISMİ | yaklaşık: Polymorph biçim olayıyla, istekli dostlar |
| Antimagic Field | 8 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Antipathy/Sympathy | 8 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): Yer/nesne itme-çekme (10 gün) |
| Befuddlement | 8 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Clone | 8 | spells-69.json | utility | SAVAŞ DIŞI | Yedek beden |
| Control Weather | 8 | spells-69.json | utility | SAVAŞ DIŞI | Hava durumu (8 saat) |
| Demiplane | 8 | spells-69.json | utility | SAVAŞ DIŞI | Yarı düzleme kapı |
| Dominate Monster | 8 | spells-69.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Earthquake | 8 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Glibness | 8 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Holy Aura | 8 | spells-69.json | effect | KISMİ | yaklaşık: Fiend/Undead vurana CON save ya da Blinded yansıması yok |
| Incendiary Cloud | 8 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Maze | 8 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Mind Blank | 8 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added |
| Power Word Stun | 8 | spells-69.json | utility | ÇALIŞIR | olaylar: condition_changed |
| Sunburst | 8 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved |
| Tsunami | 8 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): 1 minute döküm: savaştan önce yapılır |
| Astral Projection | 9 | spells-69.json | utility | SAVAŞ DIŞI | Astral yolculuk |
| Foresight | 9 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): 1 minute döküm: savaştan önce yapılır |
| Gate | 9 | spells-69.json | utility | YOK | savaşta anlamlı, motor karşılığı yok: çağırma (portal) yok |
| Imprisonment | 9 | spells-69.json | utility | SAVAŞ DIŞI | savaş öncesi hazırlık (savaşa etkisi olur, kurulum yolu yok): 1 minute döküm: savaştan önce yapılır |
| Mass Heal | 9 | spells-69.json | utility | ÇALIŞIR | olaylar: healed |
| Meteor Swarm | 9 | spells-69.json | save | KISMİ | yaklaşık: Dört 40 ft küre yerine bir küre (büyü tek hedef altıgeni alır); yapay zekâ en kalabalık noktayı seçer |
| Power Word Heal | 9 | spells-69.json | utility | ÇALIŞIR | olaylar: healed |
| Power Word Kill | 9 | spells-69.json | utility | ÇALIŞIR | olaylar: map_effect |
| Prismatic Wall | 9 | spells-69.json | zone | ÇALIŞIR | olaylar: zone_created, pushed |
| Shapechange | 9 | spells-69.json | effect | ÇALIŞIR | olaylar: effect_added, shape_changed, temp_hp |
| Storm of Vengeance | 9 | spells-69.json | save | ÇALIŞIR | olaylar: zone_created |
| Time Stop | 9 | spells-69.json | utility | ÇALIŞIR | olaylar: time_stop |
| True Polymorph | 9 | spells-69.json | effect | ÇALIŞIR | olaylar: save_resolved, effect_added, shape_changed, temp_hp |
| True Resurrection | 9 | spells-69.json | revive | SAVAŞ DIŞI | komut çalışıyor ama savaş dışı (life_restored) |
| Weird | 9 | spells-69.json | save | ÇALIŞIR | olaylar: save_resolved, effect_added |
| Wish | 9 | spells-69.json | utility | ÇALIŞIR | koşullu: kopyalanacak büyü seçimi gerekir |
