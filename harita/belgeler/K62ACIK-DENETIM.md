# K62-ACIK denetimi: K62–K67'den kalan açık maddeler

Taban `origin/main` f740c07 (kural sürümü 66). Dal `wip/k62-acik`. K57 mekanik donması geçerli: yeni komut, olay, etki
alanı, harita kuralı türü, ev kuralı ya da ilkel eklenmez. Kararlar DECISIONS.md "Kuyruk K62-ACIK" girdisinde.

## Özet

| # | Madde | Şimdiki durum | SRD 5.2.1 ne istiyor | Fark | Boyut | Donma | Sürüm |
|---|---|---|---|---|---|---|---|
| 1 | Delayed Blast Fireball boncuğu arayüzü | Motor var (`bead.ts` `executeBeadTouch`, `spell_followup` `choice: 'bead'`); YZ var (`k62:boncuk`). Arayüzde boncuğa dokunma/fırlatma hiç yok. | Boncuğa dokunan DEX save; başarıda en çok 40 ft fırlatır; yaratık altıgenine girerse ya da katı engele çarparsa patlar. | Oyuncu bunu yapamıyor. | küçük (arayüz) | uyar (yalnız arayüz) | gerekmez |
| 2 | Wall of Ice YZ hedeflemesi | `ai.ts` `wallBreakCands` (Y1, `y1:duvar`) panele yalnız `weaponOptions` ile saldırıyor: canavar saldırıları (`attacks`) hiç denenmiyor (düşmanların çoğu canavar). Seçenek ilk bulunan; panelin bağışıklığı ve zayıflığı yok sayılıyor. | Panel AC 12, 30 HP; Cold/Poison/Psychic bağışık, Fire iki kat (K62'de var). | YZ duvarı ya hiç hedeflemiyor (canavar) ya da bağışık türle boşa vuruyor; ateşi seçmiyor. | küçük (YZ) | uyar (YZ düzeltmesi) | gerekmez |
| 3 | Truesight eski YZ yolu | K63 tek sorgusu (`truesightSees`, `hiddenFromTruesight`, `truesightRange`) var. YZ'de dört eski yol: (a) `blindChoice` Truesight'ı ham `senses.truesight`/`boon-truesight`'tan okuyor (True Seeing etkisi, paket Truesight'ı ve `specialSenses` anahtarı yok sayılıyor); (b) kapı açma (`doorCommand`) ve (c) haritasız hedef gizlenmişi `!c.hidden` ile eliyor; (d) Divine Sense tetiği gizlenmiş düşmanı `foesOf`'tan arıyor, `foesOf` ise Truesight'sız gizlenmişi zaten eliyor: tetik yalnız Truesight'lı Paladin'de doğabiliyordu. | Truesight: gizlenmiş (Invisible) yaratığı menzilde görür. | Tek sorguya bağlı değil; (d) tetik hiç doğmuyordu. | küçük (YZ) | uyar (YZ düzeltmesi) | gerekmez |
| 4 | Magic Circle: isteyerek giriş ve ışınlanma | `setupWard`/`wardProtects`/`circleAttackDis`: ele geçirme, Charmed/Frightened koruması ve saldırı dezavantajı var. "İçeri isteyerek girememe" ve "ışınlanarak girerken CHA save" yalnız veride not (`setupWard.note`, Game Master). Ters yönde çıkamama da yok. | Seçilen tür silindire büyüsüz yollarla isteyerek giremez; ışınlanma ya da düzlem yolculuğuyla girmeye çalışırsa önce CHA save. Ters yönde seçilen tür silindirden çıkamaz. | İki kol eksik (yürüme/atlama/kazma ile giriş; ışınlanmada save) + ters yönde çıkış. | orta | uyar: mevcut koruma alanının (`SpellZone.ward`) SRD kolu; yeni alan/olay yok (hareket `moveCostFn`'de durur, save mevcut `map_effect`, geri dönüş mevcut `teleported`) | **gerekir (67)** |
| 5 | Hallow ek etkileri | `hallowSyncEvents`: alandaki ele geçirme/Charmed/Frightened bastırılıyor. "İçeri isteyerek girememe" yok; **Extra Effect** (10 seçenek) hiç yok. | Hallowed Ward: seçilen türler alana isteyerek giremez. Extra Effect (biri seçilir): Courage, Darkness, Daylight, Peaceful Rest, Extradimensional Interference, Fear, Resistance, Vulnerability, Silence, Tongues. | Girememe eksik; ek etkinin kurulum seçimi ve 10 etki eksik. | girememe küçük (Madde 4 ile ortak); ek etkiler büyük | girememe uyar; ek etkiler **uymaz** (aşağıda) | girememe **gerekir (67)** |

## Madde 5 ayrıntı: Hallow ek etkileri (kullanıcı kararı bekliyor)

Ek etki kurulumda bir seçim ve alanın kaydında saklanan bir değer ister; bugün `SpellZone.ward` yalnız `kind`, `types`,
`reverse` taşır. Etkilerin karşılığı:

| Ek etki | Var olan sistemde karşılığı | Not |
|---|---|---|
| Darkness | `ZoneSpec.dark` (büyülü karanlık) | SRD "daha düşük seviyeli büyü ışığı aydınlatamaz"; bugünkü `dark` ≤2. seviye ışığı kaldırır: eşik farklı |
| Daylight | `ZoneSpec.light` | "daha düşük seviyeli büyülü karanlık söndüremez" kolu yok |
| Silence | `ZoneSpec.silence` | aynen |
| Extradimensional Interference | Madde 4'ün ışınlanma kancası (save yerine red) | türe göre |
| Courage | yok | türe göre Frightened bağışıklığı alanda (yeni alan etkisi) |
| Fear | yok | türe göre alanda sürekli Frightened (yeni alan etkisi) |
| Resistance / Vulnerability | yok | türe göre alanda seçilen hasar türüne direnç/zayıflık (yeni alan etkisi + tür seçimi) |
| Peaceful Rest, Tongues | savaş dışı | Game Master notu |

Dördü var olan alan türlerine oturuyor ama seçim için kayıtta yeni bir değer (`ward` alt alanı ya da kurulum seçeneği)
gerekir; dördü türe göre yeni alan etkisi ister. Donma nedeniyle uygulanmadı: **kullanıcı kararı bekliyor**.

## Sürüm

- Madde 4 ve 5'in girememe kolu savaş sonucunu değiştirir: kural sürümü 66 → **67** (`src/battle/k62acikSurum.ts`).
  AS1 şeridi bundan sonra 68 olur. 66 ve altı kayıt/replay birebir.
- Madde 1 (arayüz), 2 ve 3 (YZ) sürüm gerektirmez: kayıtlar olay listesidir, YZ kararı replay'e girmez.

## Madde 3 dışında kalan motor yolları (bilgi)

Truesight'ı bilmeyen motor yolları (YZ değil; savaş sonucunu değiştirir, bu şeridin kapsamı dışında, ayrı madde önerisi):
`reactions.ts` fırsat saldırısı görme (`!b.hidden`), `features.ts` hareket algısı (`mover.hidden`), `classTraits.ts` Cleave
ve `mastery.ts` Cleave/ikinci hedef süzgeci (`!c.hidden`), `dragon.ts` uyuyan ejderhanın Algı süzgeci (`!c.hidden`).
