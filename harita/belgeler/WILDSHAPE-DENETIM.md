# DR0: Wild Shape denetimi (kod değişmedi, yalnız belge)

Kaynaklar: `src/battle/druid.ts`, `src/battle/polymorph.ts`, `src/battle/reduce.ts` (`shape_changed`), `src/battle/ai.ts` (Druid kararı), `data/class-features.json`, `data/karadul.json`, `src/rules/fixtures/srd-alt-siniflar.json`, `harita/belgeler/AS2-ENVANTER.md`. Sayılar `data/monsters.json` + `data/canavar-turleri.json` üzerinden bu oturumda ölçüldü.

## 1. Hayvan listesi

- Uygun: `canavar-turleri.json` türü `beast` (330 canavardan **94**). Sınır `class-features.json` `druid:wild-shape` `forms` tablosunda: seviye 2 → bilinen 4 biçim, CR ≤ 1/4, uçuş yok; seviye 4 → 6 biçim, CR ≤ 1/2, uçuş yok; seviye 8 → 8 biçim, CR ≤ 1, **uçuş serbest**. (`eligibleForms`: CR ve `fly` süzgeci; **yüzme/tırmanma sınırı uygulanmıyor**, yüzme hız notu veride ayrı alan değil.)
- Uygun sayısı: seviye 2–3: **40**, 4–7: **47**, 8+: **72** (15 uçan). Hepsinde Multiattack olmayan ya da olan en az bir silah saldırısı var (saldırısız beast yok).
- Bilinen biçimler: karakterde seçili `wildShapeForms` varsa onlar; yoksa uygunlar CR ↓, HP ↓ sıralanıp ilk `known` tanesi (`availableForms`). Seviye 4'ün listesi bu yüzden Reef Shark (CR 1/2, 22 HP), Ape, Black Bear, Giant Goat, Warhorse, Giant Seahorse; seviye 8'in başı Giant Hyena, Giant Octopus (CR 1, 45 HP), Death Dog, Giant Toad… **Su biçimleri (Reef Shark, Giant Octopus, Giant Seahorse) kara savaşında seçilebilir ve YZ en başta bunu seçer.**
- Düşük seviye (2–7) için tavan CR 1/4–1/2: HP 13–22, saldırı bonusu +3…+5.

## 2. Geçici can, AC, saldırı, Multiattack, özel saldırılar

- Geçici can = Druid seviyesi (`executeWildShape`: `temp_hp`, SRD 5.2.1). **Biçimin kendi HP'si kullanılmaz**; HP Druid'in. 3. seviyede 3, 5. seviyede 5 geçici can.
- AC, hız, uçuş, boyut: biçimden (`shapeStats`). Beast AC'leri 10–14; Druid'in zırhlı AC'sinden (14–16) **düşük**. STR/DEX/CON değiştiricisi ve bu üç kurtulma atışı biçimden; INT/WIS/CHA ve yeterlilik Druid'den.
- Saldırılar: canavarın `damageDice`lı, kurtarmasız, şarjsız saldırıları (`shapeStats`); **saldırı bonusu canavarın sabit değeri** (Druid yeterliliği/WIS eklenmez). Multiattack: `repeat` toplamı (en az 1). Şarjlı/kurtarmalı özel saldırılar (nefes, Swallow vb.) ve özellikler (Pack Tactics, Charge, Pounce…) **formda yok** (`monsterAbilities` formda devreye girmez).
- Büyü: biçimde yapılamaz (`spells.ts`: `beast-spells` özelliği olmadıkça); `druid:beast-spells` (seviye 7) "çalışır" etiketli.
- Wild Resurgence ve Nature Magician komutları motorda var; Evergreen Wild Shape veri notunda.

## 3. Form bitince taşan hasar

- Hasar önce geçici cana gider (`damageEffects`); geçici can biterse **kalan hasar Druid'in gerçek HP'sine geçer ve biçim sürer**. Biçim yalnız 0 HP ya da Incapacitated'te biter (`shapeCleanup`); geçici canın bitmesi biçimi bitirmez (Polymorph ve Karadul örümcek biçimi hariç: onlarda geçici can bitince form biter). Bırakınca eski AC/hız/saldırılar geri gelir (`prev`); geçici can kalırsa (bırakılırsa) kalır. Yani taşan hasar "kaybolmaz", doğrudan Druid'e işler; 3–5 geçici can ile fiilen biçimin dayanıklılığı sıfıra yakın.

## 4. Druid alt sınıfları

Bu bulut oturumunda yerel `icerik/` (108'lik dış paket) yok; **pakette bulunan 6 Druid alt sınıfının adı ve özellikleri burada okunamadı** (AS2-ENVANTER: Druid = pakette 7 (biri SRD'nin Toprak Çemberi) + bizim 1). Listelenebilenler:

| Alt sınıf (TR / EN) | Kaynak | Wild Shape'e dokunan özellik | Durum |
|---|---|---|---|
| Toprak Çemberi / Circle of the Land | SRD (fikstür `srd-alt-siniflar.json`, aynı kimlik pakette) | Yok: büyü listesi, Land's Aid, Natural Recovery, Nature's Ward, Nature's Sanctuary dövüş formunu geliştirmiyor | çalışır (5/5) |
| Karadul Çemberi / Circle of the Black Widow | bizim (`data/karadul.json`, ev) | **Wild Shape'in yerine** Örümcek Biçimi (`replaces: druid:wild-shape`): ayrı biçim canı (geçici can), skor takası, zehir saldırıları; Bewitching Gaze, Sweet Snare, Web Sense, Final Kiss | çalışır (6/6) |
| Pakette kalan 6 Druid alt sınıfı | `icerik/ek-druid.json` (yerelde) | **okunamadı** | yerelde `npm run check:icerik` çıktısıyla doldurulacak |

Sonuçlar (okunabilen kadar): dövüş formuna yönelen **gerçek Wild Shape alt sınıfı yok** (CR sınırı artıran, formda AC/geçici can ekleyen, bonus eylem dönüşümünü hızlandıran, form saldırı bonusu ya da formda büyü veren özellik bulunmuyor). Tabloda olmayanlar: CR sınırı artışı, form AC, ek geçici can, saldırı bonusu, hız/uçuş, bonus eylemle dönüşüm; hepsi **yok**. Bunun doğrulaması paketin geri kalan 6 alt sınıfında yerelde yapılmalı (açık madde).

## 5. Yapay zekâ Druid'i

- Tek kural (`ai.ts` "Görev DRUID"): bonus eylem boş, formda değil, konsantre değil, düşman var **ve bütün büyü slotları bitmiş** → `availableForms()[0]` (en yüksek CR, sonra en yüksek HP) ile Wild Shape. Slot kalmış olduğu sürece hiç forma girmez; konsantrasyonlu büyü sürerken girmez.
- Formda kalır; **bırakma kararı yok** (YZ `wild_shape` form'suz hiç göndermez); form dışı yeniden büyüye dönmez. Wild Resurgence'ı (kullanım ↔ slot) YZ kullanmaz. Beast Spells özelliği olsa da biçimde özel bir karar yok (`castable` yine çalışır).
- Biçim seçiminde arazi, düşman türü, uçuş ihtiyacı ya da form AC'si dikkate alınmaz (su biçimi kara savaşında seçilebilir). Karadul için ayrı kural (`ai.ts` 157–176: bonus eylem boşsa ve büyüleme/slot durumuna göre örümcek).

## 6. Sim karşılaştırması (20 tohum, `k18-druid` partisi: yara (Druid) + bor, tavi, sela; Çöl gündüz ve Orman)

Geçici betikle (commit edilmedi) üç kip: **varsayılan** (YZ kuralı: yalnız slot bitince form), **formsuz** (Wild Shape özelliği çıkarılmış), **zorla** (savaş başında en iyi bilinen forma girer, YZ formda kalır).

| Kip | Sev. | Senaryo | Savaş | Parti kazandı | Ort. tur | Ort. ölen PC | Ort. düşmüş PC | Forma giren |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| formsuz | 3 | Çöl | 20 | 70% | 11.3 | 0.25 | 1.25 | 0 |
| varsayılan | 3 | Çöl | 20 | 70% | 11.2 | 0.25 | 1.40 | 0 |
| zorla | 3 | Çöl | 20 | 5% | 8.2 | 0.35 | 3.50 | 20 |
| formsuz | 3 | Orman | 20 | 25% | 6.4 | 0.10 | 3.15 | 0 |
| varsayılan | 3 | Orman | 20 | 25% | 6.5 | 0.20 | 3.05 | 1 |
| zorla | 3 | Orman | 20 | 5% | 5.3 | 0.10 | 3.80 | 20 |
| formsuz | 5 | Çöl | 20 | 30% | 9.8 | 0.30 | 2.60 | 0 |
| varsayılan | 5 | Çöl | 20 | 30% | 9.8 | 0.30 | 2.60 | 3 |
| zorla | 5 | Çöl | 20 | 0% | 7.6 | 0.20 | 3.70 | 20 |
| formsuz | 5 | Orman | 20 | 5% | 5.7 | 0.15 | 3.65 | 0 |
| varsayılan | 5 | Orman | 20 | 5% | 5.7 | 0.15 | 3.65 | 0 |
| zorla | 5 | Orman | 20 | 0% | 4.6 | 0.05 | 3.95 | 20 |

Okuma: (a) varsayılan YZ kuralı formu neredeyse hiç kullanmıyor (20 savaşta 0–3 giriş) ve sonucu değiştirmiyor; (b) forma girmek **partinin kazanma oranını çökertiyor** (Çöl 3. seviye %70 → %5): form, Druid'in büyüsünü (kontrol, iyileştirme) ve zırh AC'sini 3–5 geçici can karşılığında bırakıyor. Wild Shape bu hâliyle bir güçlenme değil, ağır bir bedel. (Küçük örnek: 20 tohum; Orman zaten düşük, Kale ölçülmedi.)

## 7. Öneriler (kaynağa göre, öncelik sırasıyla)

1. **Kural/uygulama, en büyük etki:** biçimde AC ve saldırı bonusu. SRD 5.2.1'de formda kalan Druid yeterlilik ve WIS'ten saldırı bonusu alır; burada canavarın sabit bonusu kullanılıyor ve AC beast'inkine düşüyor. Form için `max(beast AC, Druid AC)` ya da Druid yeterlilik bonusuyla saldırı gözden geçirilmeli (SRD metniyle birlikte doğrulanmalı; bu oturumda metin yeniden okunmadı).
2. **Uygulama:** geçici can (Druid seviyesi) dışında **biçimin HP'si** de katkı verir mi (2014 kuralı) ya da 5.2.1'in yeni geçici can formülü doğru mu; formun dayanıklılığı 3–5 can olarak ölçüldü, bu yüzden form pratikte işlemiyor.
3. **YZ:** forma ne zaman girileceği: yalnız slot bitince giriyor (neredeyse hiç). Form, yalnızca yakın dövüşte hasar alan ve konsantrasyonsuz Druid için; bırakma, yeniden büyü ve Wild Resurgence döngüsü yok. Biçim seçimi arazi/uçuş/AC'yi hesaba katmalı (su biçimleri kara savaşında seçilmemeli).
4. **Kural:** uygun liste: yüzme/tırmanma biçimleri ortama göre süzülsün (SRD'de CR ve uçuş sınırı yeter; ama YZ ve oyuncu menüsü ortam notu göstermeli).
5. **Veri:** formda özel saldırı/özellik (Pack Tactics, Charge, Pounce) yok; en az en sık seçilen biçimler için eklenebilir.
6. **Alt sınıf:** dövüş formuna yönelen alt sınıf yok (okunabilen 2'de); paketin 6'sı yerelde incelenmeli.
