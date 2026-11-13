# AS2 farkları: kitapçık ↔ mevcut kayıt (salt liste; özellik metni yok)

Görev AS2 (kural sürümü 78). Bu dosya sonraki "kitapçığa uydur" işinin girdisidir. Yalnız kimlik, seviye ve fark türü.
Kaynaklar: mevcut kayıt = 12 SRD alt sınıfının mekaniği (eskiden `data/subclasses.json`; şimdi `icerik/ek-<sınıf>.json` içinde
aynı kimlikle, depodaki kopyası `src/rules/fixtures/srd-alt-siniflar.json`), kitapçık = kullanıcının
`icerik/belge/` altındaki kural kitapçığı (PDF, depoya girmez).

## Uygulanan kural (kullanıcı kararı)

- **Mekanik** kayıttan (özellik, seviye, etki, durum); hiçbiri geri alınmadı, silinmedi, kitapçığa uydurulmadı.
- **Türkçe ad** (alt sınıf, rol, özellik) kitapçıktan; EN adlar kayıttan. Kimlikler değişmedi.
- **Açıklama**: mekanik fark yoksa kitapçık metni (TR; EN kayıttan), mekanik fark varsa kaydın açıklaması (motorun
  yaptığını anlatır). Kitapçıkta olup kayıtta olmayan 3 özellik `planli` (etkisiz) olarak kitapçık metniyle eklendi.
- Kitapçıkta tek özellik olan iki kayıt özelliği (`birleşik`) adı ve metni "&" / ";" ile bölünerek aldı.

## Sayılar

12 alt sınıf, 58 kayıt özelliği + 3 eklenen = 61 özellik. Açıklama: 17 kitapçıktan, 41 kayıttan (32 mekanik farklı ya da
kayıtta ek kural + 9 yalnız kayıtta), 3 eklenen kitapçıktan. Fark kaydı: 52 satır
(mekanik 32, seviye 12, birleşik (kitapçıkta tek özellik) 6, etiket 6, yalnız kitapçıkta (planlı eklendi) 3, yalnız kayıtta 9, ad (kitapçıkta ayrı ad yok; kayıt adı korundu) 1).

Alt sınıf adı farkı (kayıt → kitapçık; Türkçe ad kitapçıktan): `path-of-the-berserker` Çılgın Savaşçı Yolu → Berserker Yolu,
`college-of-lore` Bilgi Koleji → Kadim Bilgi Koleji, `life-domain` Yaşam Etki Alanı → Yaşam Alanı (görünen ad K49 kuralıyla
"Yaşam Manastırı"), `warrior-of-the-open-hand` Açık El Savaşçısı → Sadelik Disiplini, `oath-of-devotion` Bağlılık Yemini →
Sadakat Yemini, `draconic-sorcery` Ejderha Büyücülüğü → Pulkanat, `fiend-patron` İblis Hamisi → Zebani, `evoker` Evokasyon
Ustası → Azap Öğretisi. Toprak Çemberi, Şampiyon, Avcı, Hırsız aynı.

Seviye notu: kitapçıkta Cleric (S1/S2), Sorcerer ve Warlock (S1), Wizard ve Druid (S2) alt sınıf özellikleri 2014 tarzı
erken seviyede; kayıt 5.2.1 (3. seviye). Kayıt seviyesi korundu (motor zaten max(seviye, 3) uygular).

## Özellik farkları (12 alt sınıf)

| Kimlik (`sınıf/alt sınıf:özellik`) | Seviye (kayıt) | Seviye (kitapçık) | Fark türü | Kitapçık etiketi |
|---|---|---|---|---|
| `barbarian/path-of-the-berserker:frenzy` | 3 | 3 | mekanik |  |
| `barbarian/path-of-the-berserker:retaliation` | 10 | 14 | seviye |  |
| `barbarian/path-of-the-berserker:intimidating-presence` | 14 | 10 | mekanik, seviye |  |
| `bard/college-of-lore:bonus-proficiencies` | 3 | 3 | birleşik (kitapçıkta tek özellik) |  |
| `bard/college-of-lore:cutting-words` | 3 | 3 | birleşik (kitapçıkta tek özellik) |  |
| `bard/college-of-lore:magical-discoveries` | 6 | 6 | mekanik, etiket | SİSTEM (buyu) |
| `bard/college-of-lore:ileri-sirlar` | – | 10 | yalnız kitapçıkta (planlı eklendi) |  |
| `cleric/life-domain:disciple-of-life` | 3 | 1 | mekanik, seviye |  |
| `cleric/life-domain:life-domain-spells` | 3 | – | yalnız kayıtta |  |
| `cleric/life-domain:preserve-life` | 3 | 2 | mekanik, seviye |  |
| `cleric/life-domain:ilahi-vurus` | – | 8 | yalnız kitapçıkta (planlı eklendi) |  |
| `druid/circle-of-the-land:circle-of-the-land-spells` | 3 | – | yalnız kayıtta |  |
| `druid/circle-of-the-land:lands-aid` | 3 | – | yalnız kayıtta |  |
| `druid/circle-of-the-land:natural-recovery` | 6 | 2 | seviye |  |
| `druid/circle-of-the-land:natures-ward` | 10 | 10 | mekanik |  |
| `druid/circle-of-the-land:natures-sanctuary` | 14 | 14 | mekanik |  |
| `druid/circle-of-the-land:toprak-adimi` | – | 6 | yalnız kitapçıkta (planlı eklendi) |  |
| `fighter/champion:remarkable-athlete` | 3 | 7 | mekanik, seviye |  |
| `fighter/champion:additional-fighting-style` | 7 | 10 | seviye |  |
| `fighter/champion:heroic-warrior` | 10 | – | yalnız kayıtta |  |
| `fighter/champion:superior-critical` | 15 | 15/18 | birleşik (kitapçıkta tek özellik) |  |
| `fighter/champion:survivor` | 18 | 15/18 | birleşik (kitapçıkta tek özellik), mekanik, seviye, ad (kitapçıkta ayrı ad yok; kayıt adı korundu) |  |
| `monk/warrior-of-the-open-hand:open-hand-technique` | 3 | 3 | mekanik |  |
| `monk/warrior-of-the-open-hand:wholeness-of-body` | 6 | 6 | mekanik |  |
| `monk/warrior-of-the-open-hand:fleet-step` | 11 | 11 | mekanik |  |
| `monk/warrior-of-the-open-hand:quivering-palm` | 17 | 17 | mekanik |  |
| `paladin/oath-of-devotion:oath-of-devotion-spells` | 3 | – | yalnız kayıtta |  |
| `paladin/oath-of-devotion:sacred-weapon` | 3 | 3 | mekanik |  |
| `paladin/oath-of-devotion:smite-of-protection` | 15 | 15 | mekanik |  |
| `paladin/oath-of-devotion:holy-nimbus` | 20 | 20 | mekanik |  |
| `ranger/hunter:hunters-lore` | 3 | – | yalnız kayıtta |  |
| `ranger/hunter:hunters-prey` | 3 | 3 | mekanik |  |
| `ranger/hunter:defensive-tactics` | 7 | 7 | mekanik |  |
| `ranger/hunter:superior-hunters-prey` | 11 | 11 | mekanik |  |
| `ranger/hunter:superior-hunters-defense` | 15 | 15 | mekanik |  |
| `rogue/thief:fast-hands` | 3 | 3 | birleşik (kitapçıkta tek özellik), etiket | HİKAYE + SAVAŞ |
| `rogue/thief:second-story-work` | 3 | 3 | birleşik (kitapçıkta tek özellik), mekanik, etiket | HİKAYE + SAVAŞ |
| `rogue/thief:supreme-sneak` | 9 | 9 | mekanik, etiket | SİSTEM (gizlenme) |
| `rogue/thief:use-magic-device` | 13 | 13 | mekanik, etiket | HİKAYE |
| `sorcerer/draconic-sorcery:draconic-resilience` | 3 | 1 | mekanik, seviye |  |
| `sorcerer/draconic-sorcery:draconic-spells` | 3 | – | yalnız kayıtta |  |
| `sorcerer/draconic-sorcery:elemental-affinity` | 6 | 6 | mekanik |  |
| `sorcerer/draconic-sorcery:dragon-wings` | 14 | 14 | mekanik |  |
| `sorcerer/draconic-sorcery:dragon-companion` | 18 | 18 | mekanik |  |
| `warlock/fiend-patron:dark-ones-blessing` | 3 | 1 | mekanik, seviye |  |
| `warlock/fiend-patron:fiend-spells` | 3 | – | yalnız kayıtta |  |
| `warlock/fiend-patron:dark-ones-own-luck` | 6 | 6 | mekanik |  |
| `warlock/fiend-patron:hurl-through-hell` | 14 | 14 | mekanik, etiket | SİSTEM (haritadancikarma) |
| `wizard/evoker:evocation-savant` | 3 | – | yalnız kayıtta |  |
| `wizard/evoker:potent-cantrip` | 3 | 6 | seviye |  |
| `wizard/evoker:sculpt-spells` | 6 | 2 | mekanik, seviye |  |
| `wizard/evoker:overchannel` | 14 | 14 | mekanik |  |

Farksız (ad dışında aynı) özellikler bu tabloda yok: Berserker `mindless-rage`; Lore `peerless-skill`; Life `blessed-healer`,
`supreme-healing`; Champion `improved-critical`; Devotion `aura-of-devotion`; Thief `thiefs-reflexes`; Fiend
`fiendish-resilience`; Evoker `empowered-evocation`.

## 97 paket alt sınıfı ↔ kitapçık (bilgi; paket kayıtları değişmedi)

76 alt sınıf birebir aynı (seviye, ad, etiket, metin benzerliği eşiğin üstünde); 21 alt
sınıfta etiket ya da kısa metin farkı (özellik sayısı, seviye ve ad farkı yok). Kitapçıkta olmayan paket alt sınıfı 0,
pakette olmayan kitapçık alt sınıfı 0 (12 SRD karşılığı dışında).

| Paket kimliği | Fark türü |
|---|---|
| `islik-koleji` | etiket |
| `aydin-alani` | metin |
| `baris-alani` | etiket |
| `pehlivan` | etiket |
| `ninja` | etiket |
| `keskinlik-disiplini` | metin |
| `azizlik-disiplini` | etiket |
| `intikam-yemini` | etiket |
| `muhafiz-yemini` | etiket |
| `ibliskiran` | etiket |
| `kamufle` | etiket |
| `taktisyen` | etiket |
| `kasif` | etiket |
| `ceren-urperten` | etiket |
| `otonom-evren` | etiket |
| `muhterem` | etiket |
| `paradoks` | metin |
| `siginak-ogretisi` | etiket |
| `uzay-bukme-ogretisi` | etiket |
| `harp-ogretisi` | etiket |
| `anka-ogretisi` | metin |
