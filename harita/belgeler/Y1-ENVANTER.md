# Y1: Yapay zekâ kalanları envanteri (Kuyruk Y1, Görev 0)

Kaynaklar: `DECISIONS.md` (K61–K70 ve önceki kuyruklar), `CLAUDE.md` "Bilinen eksikler", `harita/belgeler/BUYU-ERTELENEN.md`,
`harita/belgeler/M1-FARKLAR.md`. Her satır depodan doğrulandı (`src/battle/ai.ts`, `src/battle/ai/*.ts`: aday üreticisi
`registerAction`, kural zinciri, `withMetamagic`). Taban: `wip/k70` 60536ea, kural sürümü 54.

Sınıf: **kolay** (mevcut aday/değerlendirici yoluyla, tek üretici), **orta** (yeni üretici + koşul, önizleme puanlar),
**denge kararı** (yapılabilir ama sonucu denge/ölçüme bağlı; kullanıcı kararı), **kapsam dışı** (YZ değil ya da yasak:
yeni mekanik, dikey/büyük yaratık taktiği K73).

Durum: **geçerli** (YZ bugün yapmıyor), **geçersiz** (artık yapıyor ya da sorun yok), **kısmen**.

| # | Madde | Kaynak | Depoda durum | Neden yapılmıyor | Risk | Önerilen davranış | Sınıf |
|---|---|---|---|---|---|---|---|
| 1 | Wall of Ice / Wall of Stone panellerini hedefleme (yolu açmak) | DECISIONS K65c açık kalanlar, K70 kapsam dışı | geçerli: YZ hiç `attack_object` üretmez | panel nesne değil, alan; aday üreticisi yok | düşman duvarın arkasında kalınca YZ beklemeye/dolaşmaya düşer | yürüyerek hiçbir düşmana ulaşamıyorken ve yol düşman duvarıyla kapalıyken en yakın panele saldırı (önizleme yok: kural önceliği) | orta (Y1 G2a) |
| 2 | Disintegrate'i Wall of Force'a kullanma | DECISIONS K70 | geçerli | K70'te yalnız motor + arayüz | düşmanın Wall of Force'u savaşı kilitler | düşman tarafın duvarı yolu kapatıyorsa (madde 1 koşulu) Disintegrate ile duvarı kaldır | kolay (Y1 G2a) |
| 3 | Earthquake'i kendiliğinden yapma | DECISIONS K66b, K70 | geçerli: `zoneSpell` alanda dost (büyücü dahil) varsa seçmez; 100 ft yarıçap büyücüyü kapsar | kural "alanda dost yok" | açılırsa kendi tarafına DEX save, Prone, yarık; denge değişir | yalnız ölçüm (Y1 G2: kural gevşek/kapalı karşılaştırması) | denge kararı |
| 4 | Charm Person'ı kullanma | DECISIONS G6 4c, K70 | geçerli: `banishChoice` ham mekaniği okur, `g6` bloğundaki `dominate` görünmez | sürümlü mekanik okunmuyor | taraf değiştirme güçlü (Humanoid, 30+ HP) | `banishChoice` sürüm 55+'ta `mechanicsAt` ile; Charm Person konsantrasyonsuz olduğu için konsantrasyon kuralı yalnız konsantrasyonlu büyüde | orta (Y1 G2c) |
| 5 | Dancing Lights'ı yerleştirdikten sonra taşıma | DECISIONS K67b | geçerli: `spell_followup.targetHexes` adayı yok | K67b'de yalnız ilk yerleşim | düşman ışıktan çıkar, görmeyen dost yine kör kalır | bonus eylem boşken görmeyen dost–düşman çifti varsa ışıkları yeni düşman konumlarına taşı (aynı `lightCommand` yerleşimi) | kolay (Y1 G2b) |
| 6 | Delayed Blast Fireball boncuğu için arayüz düğmesi | DECISIONS K62 | geçerli (yalnız motor komutu `spell_followup choice: 'bead'`); YZ `k62:boncuk` var | arayüz işi | oyuncu boncuğu fırlatamaz | büyü kartına "Boncuğu fırlat/dokun" düğmesi | kapsam dışı (YZ değil; arayüz kuyruğu) |
| 7 | Metamagic: Twinned, Quickened dışındakiler | DECISIONS Kuyruk 43 | kısmen: Twinned/Quickened var (`withMetamagic`) | diğerleri kural yazılmadı | Sorcerer puanı boşa kalır | Heightened: önizleme save dezavantajını analitik puanlar → yalnız kazanç varsa (Y1 G2d). Careful: dostlu alan adayı zaten üretilmez (gereksiz). Empowered/Seeking: ikinci şans önizlemeye girmez. Distant/Extended/Subtle/Transmuted: değeri önizlemede yok | orta (yalnız Heightened) |
| 8 | Cutting Words zar seçimi | DECISIONS Z2, Kuyruk 43 | geçersiz: öneri SRD sırasına uygun (isabeti çevirme olasılığı × hasar ↔ ortalama düşüş) | — | — | değişiklik yok | — |
| 9 | Thirsting Blade sınırı | DECISIONS K13, Kuyruk 43 | geçersiz: motor `economy.pactOnly` ile sınırlar; YZ denetimli komut seçer | — | — | değişiklik yok | — |
| 10 | Magic Circle / Hallow (K64b) | DECISIONS K64b | geçerli ama YZ kapsamı değil: kurulumda (savaş öncesi, Game Master) yapılır | savaş içi döküm süresi uzun | yok | — | kapsam dışı |
| 11 | Kaçın (Dodge) / Yardım (Help) | DECISIONS (eski) "Yapay zekâ Kaçın ve Yardım'ı kullanmıyor" | geçersiz: `ai.ts` `help`/`dodge` adayları var | — | — | belge eski | — |
| 12 | Gizlen (Hide) | CLAUDE.md bilinen eksikler | kısmen: `ai.ts` `hide` (bonus eylemle, gizlenme yerinde) var; gece/ışıksız altıgen araması yok | — | gece kuralı simde zayıf | sonraki YZ kuyruğu | orta (yapılmadı: kapsam) |
| 13 | Ready eylemi | CLAUDE.md | geçerli (mekanik yok) | yeni mekanik | — | — | kapsam dışı |
| 14 | Patient Defense / Step of the Wind | DECISIONS P-Monk | geçerli (yalnız Flurry) | — | düşük | savunma değerlendirmesi | orta (yapılmadı) |
| 15 | Divine Favor, Shield of Faith, Magic Weapon (kendine güçlendirme büyüleri) | DECISIONS P-Paladin | geçerli (`buff` yalnız özelliklerde, büyüde yok) | — | düşük | önizlemede etki değeri | orta (yapılmadı) |
| 16 | Jump, Spider Climb, Longstrider, Fly ile dikey taktik | DECISIONS K68b | geçerli | dikey taktik yasak | — | — | kapsam dışı (K73) |
| 17 | Çağırma büyüleri (Find Steed, Summon Dragon, Conjure…) | DECISIONS R3 | geçerli (bilinçli: partiler aynı kalsın) | denge | yüksek | — | denge kararı |
| 18 | Büyük yaratık taktiği (çevreleme, gövdeyle yol kesme) | K69 | geçerli | yasak | — | — | kapsam dışı (K73) |
| 19 | İyileştirme dışı sarf eşyası (fırlatma iksiri, yağ) | DECISIONS A5, K53 | geçerli (`use_item` yalnız iyileştirme) | — | düşük | — | orta (yapılmadı) |
| 20 | Harita nesne eylemleri (kaya yuvarlama, söndürme, plaka okuma) | DECISIONS K28b | geçerli (nesne fırlatma `a2:firlat` var) | — | orta | — | orta (yapılmadı) |
| 21 | Yanıcı haneye ateş büyüsü (`cast_spell.targetHex`) | DECISIONS 24c, K30 | geçerli | — | düşük | — | orta (yapılmadı) |
| 22 | Adrenaline Rush (Orc) | DECISIONS denge turu | geçerli | — | düşük (Orc zaten yüksek) | — | denge kararı |
| 23 | İmza: Buyruk Yer değiştir, Kuşbakışı Yerleştir; Dunganga Ninni/Sepet; Zihin Gücü yeni kipleri | DECISIONS K50–K54 | geçerli | değeri harita geometrisine bağlı | orta | — | orta (yapılmadı) |
| 24 | Paket çağrıdan çıkış (`originId`) | DECISIONS P11 | geçerli | — | düşük | — | orta (yapılmadı) |
| 25 | Arazi × büyüyü saldırgan kullanma (K56) | DECISIONS K56 | geçerli | — | orta | — | orta (yapılmadı) |
| 26 | Wish (YZ yapmaz) | DECISIONS G6 | geçerli | serbest dilek Game Master kararı | — | — | kapsam dışı |
| 27 | Resilient Sphere'i Disintegrate ile kırma (YZ) | K70 açık | Y1 G1'de motora bağlanırsa geçerli olur | — | düşük | madde 2 koşulunun küre sürümü (dost kürede değilse) | kolay (Y1 G2a ile; yalnız düşman küresinde güçlü düşman yoksa anlamsız: yapılmadı) |

## Y1'de yapılacaklar (kullanıcı listesi × envanter)

- (a) madde 1 + 2: yol kesen düşman duvarı → panel saldırısı ya da Disintegrate.
- (b) madde 5: Dancing Lights taşıma.
- (c) madde 4: Charm Person (ilkel `dominate` var; yeni mekanik yok).
- (d) madde 7: yalnız Heightened Spell (önizleme puanlar).
- (e) madde 8: geçersiz (zaten var); değişiklik yok.
- Earthquake (madde 3): yalnız ölçüm, karar kullanıcıda.
- Diğerleri: sınıfına göre yapılmadı (kapsam dışı, denge kararı ya da Y1 listesinde değil).
