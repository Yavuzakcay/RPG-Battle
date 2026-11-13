# AS2 envanteri: 120 alt sınıf tek paket

Görev AS2. Bu belge yalnız kimlik, ad ve sayı içerir; dış paketin özellik metni yazılmaz. İlk sürüm (2026-11-12, bulut
oturumu, kural sürümü 77) paket depoda olmadığı için durmuştu; bu sürüm (2026-11-13, yerel oturum) doğrulanmış ve
tamamlanmış hâlidir. Kararlar `DECISIONS.md` (Görev AS2), kitapçık ↔ kayıt farkları `harita/belgeler/AS2-FARKLAR.md`.

## Sonuç

- **120 = 108 paket + 12 bizim** (test `src/content/as2.test.ts`, yerel `icerik/` varken). Kural sürümü 78.
- Paket (`icerik/ek-<sınıf>.json`, 12 dosya, depoya girmez): **109** alt sınıf. Görevin başında **97** idi; eksik 12 tam olarak
  SRD karşılıklarıydı (sınıf başına bir). 12 SRD kaydı `data/subclasses.json`'dan aynı kimlikle pakete taşındı (mekanik
  kayıttan, Türkçe adlar kitapçıktan). Barış Alanı pakette kalır, listeden çıkar (`kaldirilan`) → **108** görünür.
- Bizim (`classData.subclasses`): 11 imza (`data/imza.json`) + Karadul Çemberi (`data/karadul.json`) = **12**.
- Orijinal SRD 12 kaydı uygulamadan kaldırıldı (`data/subclasses.json` boş); depodaki kopya yalnız test/sim fikstürü
  (`src/rules/fixtures/srd-alt-siniflar.json`).

## Sınıf başına

| Sınıf | Paket (görünen) | Bizim | Toplam | Paketteki SRD karşılığı (kimlik → TR ad) | Bizim |
|---|---|---|---|---|---|
| Barbarian | 8 | 1 | 9 | `path-of-the-berserker` → Berserker Yolu | `imza_geride_kalan` |
| Bard | 8 | 1 | 9 | `college-of-lore` → Kadim Bilgi Koleji | `imza_sair` |
| Cleric | 7 (Barış hariç) | 1 | 8 | `life-domain` → Yaşam Alanı | `imza_birlik` (eski `baris-alani` buna yönlenir) |
| Druid | 7 | 1 | 8 | `circle-of-the-land` → Toprak Çemberi | `karadul-cemberi` (yalnız kadın) |
| Fighter | 10 | 1 | 11 | `champion` → Şampiyon | `imza_imparator` (yalnız erkek) |
| Monk | 10 | 1 | 11 | `warrior-of-the-open-hand` → Sadelik Disiplini | `imza_bilge` |
| Paladin | 9 | 1 | 10 | `oath-of-devotion` → Sadakat Yemini | `imza_hizir` |
| Ranger | 8 | 1 | 9 | `hunter` → Avcı | `imza_ciftci` |
| Rogue | 9 | 1 | 10 | `thief` → Hırsız | `imza_infazci` |
| Sorcerer | 8 | 1 | 9 | `draconic-sorcery` → Pulkanat | `imza_dunganga` |
| Warlock | 10 | 1 | 11 | `fiend-patron` → Zebani | `imza_astrolog` |
| Wizard | 14 | 1 | 15 | `evoker` → Azap Öğretisi | `imza_harita` |
| **Toplam** | **108** | **12** | **120** | | |

Kitapçık (`icerik/belge/`, PDF, depoya girmez) aynı sayıları verir: 109 alt sınıf (Barış dahil), sınıf başına yukarıdaki
paket sayıları.

## Kaynaklar (görev öncesi → sonrası)

| Kaynak | Önce | Sonra |
|---|---|---|
| SRD 5.2.1 (`data/subclasses.json`) | 12, her zaman | boş; aynı kimlikler pakette |
| İmza (`data/imza.json`) | 11; ev kuralı `imza_<ad>` (sürüm 23+), Ayarlar `rpg-battle-deneysel.imza` | 11; hep seçilebilir; savaşta 78+ hep açık, 23–77 ev kuralıyla |
| Karadul (`data/karadul.json`) | Ayarlar `karadulEnabled` + `karadulWomenOnly`; ev kuralı `karadulCemberi` (21+) | hep seçilebilir, yalnız kadın (`cinsiyet`); savaşta 78+ hep açık |
| Dış paket (`icerik/*.json`) | 97; localStorage kopyası, aç/sil, kopya politikası, çalışmayanı gizle | 109 (108 görünür); klasör kalıcı ana kaynak, hepsi seçilebilir |

## Paket yamaları (`icerik/yama/`)

Yamalar alt sınıf sayısını ve kimliklerini değiştirmez: `ek-yama.mjs` yalnız var olan özelliklere `ilkeller`/`status` ve paket
düzeyinde `yaratiklar` işler; `durum-yukselt.mjs` yalnız `kismi` → `calisir` yapar. Hedef aldıkları bütün alt sınıf
kimlikleri pakette var. `uygulanan/` (p1…p11b) işlenmiş; kökteki `p11.yama.json` uygulanmışla aynı dosya değil (22 özellik
yaması). Bu görevde yama çalıştırılmadı. `yedek/` ve `yedek-durum/` okunmadı.

## Çakışma denetimi

- Paket kimlikleri imza (`imza_` önekli) ve Karadul kimliğiyle çakışmaz; 12 SRD kimliği artık yalnız pakette (tek kayıt).
- `baris-alani` (paket) ↔ yönlendirme `baris-alani` → `imza_birlik`: Barış Alanı listeden çıkar, kimlik yönlenir.
- Ad: "Ejderha Disiplini" (Monk) ↔ "Pulkanat"/eski "Ejderha Büyücülüğü" (Sorcerer) farklı sınıf, sorun değil.

## Hizalanma başlangıcı (`data/hizalanma-baslangic.json` `altSinif`)

Değişmedi (kimlikler aynı): 24 satır = 12 SRD karşılığı + 11 imza + Karadul. Değer uydurulmadı; satırı olmayan 96 paket alt
sınıfı katkı 0:

varis-yolu, element-yolu, kaos-yolu, saman-yolu, ilkelligin-yolu, vahset-yolu, heybet-yolu, varolus-koleji, hatip-koleji,
arzu-koleji, agit-koleji, akrobat-koleji, harp-koleji, islik-koleji, demirci-alani, firtina-alani, aydin-alani, yakamoz-alani,
mezar-alani, savas-alani, uyku-cemberi, cagri-cemberi, anka-cemberi, element-cemberi, curuyus-cemberi, feza-cemberi,
sahin-gozlu, capkin-kavalye, hissi-kablel, pehlivan, ninja, cift-dikis, samuray, hokkabaz, sancaktar, astral-disiplini,
ayyaslik-disiplini, olumsuzluk-disiplini, element-disiplini, keskinlik-disiplini, azizlik-disiplini, ejderha-disiplini,
karanlik-disiplini, isik-disiplini, asi-yemin-bozan, biat-yemini, intikam-yemini, muhafiz-yemini, antik-yemin, zafer-yemini,
fetih-yemini, kefaret-yemini, coban, seyyah, kovanci, izci, avare, ibliskiran, ejder-muhafizi, illuzyonist, kamufle,
taktisyen, psisik-hancerler-kirpi, dedektif, suikastci, kasif, silahsor, ceren-urperten, ilahi-kan, lanetli, otonom-evren,
paratoner, alevbaz, titan-kani, kargisci, cin, ruhsar, kraken, muhterem, melek, gulyabani, paradoks, hortlak,
siginak-ogretisi, kehanet-ogretisi, diriltme-ogretisi, tezahur-ogretisi, aldatma-ogretisi, serap-ogretisi, simya-ogretisi,
kilic-sarkisi-ogretisi, uzay-bukme-ogretisi, harp-ogretisi, hattat-ogretisi, zamanalti-ogretisi, anka-ogretisi.

## Kaldırılan Ayarlar öğeleri (yalnız alt sınıfla ilgili)

| Öğe | Yer |
|---|---|
| Karadul anahtarı `karadulEnabled`, kadın kısıtı `karadulWomenOnly` | `src/app/features.ts`, `src/screens/SettingsScreen.tsx`, `src/screens/Builder.tsx` (`houseSubclassVisible` → `genderVisible`) |
| İmza ev kuralı kapısı `rpg-battle-deneysel.imza` (`imzaEnabled`), `characterHouseRules`'taki imza/Karadul | `src/app/features.ts`, Ayarlar, oluşturucu |
| Dış paket aç/kapa ve sil düğmeleri, paket başına satırlar, "silinen yeniden gelmesin" | `src/content/store.ts`, Ayarlar |
| "Kopyalarda hangisi kalsın" (Paket/SRD/İkisi de) | `src/rules/subclasses.ts`, `src/content/store.ts`, Ayarlar |
| Çalışan özelliği olmayan paket alt sınıfının gizlenmesi (`packSelectable`) | `src/rules/subclasses.ts` |
| Game Master ev kuralı listesinde `karadulCemberi`, `imza_<ad>` | `data/ev-kurallari.json` `gizli` (yalnız < 78 kayıt okur) |
